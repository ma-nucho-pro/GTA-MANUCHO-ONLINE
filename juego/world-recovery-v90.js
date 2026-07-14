/**
 * GTA MANUCHO V90 — recuperación del mundo principal.
 * Garantiza que la ciudad procedural, las pistas y el suelo existan y sean visibles
 * antes de retirar la transición de carga.
 */
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let installed = false;
let recoveryRunning = false;

function directCityMeshes(game) {
  return (game?.city?.children || []).filter(object => object?.isMesh || object?.isInstancedMesh);
}

function geometryFootprint(object) {
  const params = object?.geometry?.parameters || {};
  let width = Number(params.width || 0);
  let depth = Number(params.depth || 0);
  if (object?.geometry?.type === 'PlaneGeometry') depth = Number(params.height || 0);
  if ((!width || !depth) && object?.geometry) {
    try {
      object.geometry.computeBoundingBox?.();
      const box = object.geometry.boundingBox;
      if (box) {
        width = Math.max(width, box.max.x - box.min.x);
        depth = Math.max(depth, box.max.z - box.min.z, box.max.y - box.min.y);
      }
    } catch {}
  }
  const sx = Math.abs(Number(object?.scale?.x || 1));
  const sz = Math.abs(Number(object?.scale?.z || 1));
  return { width: width * sx, depth: depth * sz };
}

function isLargeSurface(object) {
  if (!object?.geometry) return false;
  const name = String(object.name || '').toLowerCase();
  if (/ground|road|street|floor|foundation|terrain|island|water|ocean|piso|suelo|pista/.test(name)) return true;
  const { width, depth } = geometryFootprint(object);
  return width >= 3500 && depth >= 3500;
}

function hasGroundNearPlayer(game) {
  const player = game?.playerContainer?.position;
  if (!player) return false;
  for (const object of directCityMeshes(game)) {
    if (!isLargeSurface(object)) continue;
    const { width, depth } = geometryFootprint(object);
    if (!width || !depth) continue;
    const dx = Math.abs(player.x - object.position.x);
    const dz = Math.abs(player.z - object.position.z);
    if (dx <= width * .55 + 300 && dz <= depth * .55 + 300) return true;
  }
  return false;
}

function forceWorldVisibility(game) {
  if (!game?.city || !game?.playerContainer) return;
  game.city.visible = true;
  const player = game.playerContainer.position;
  const nearSq = 42000 * 42000;

  for (const object of game.city.children || []) {
    if (!object) continue;
    const large = isLargeSurface(object);
    const dx = Number(object.position?.x || 0) - player.x;
    const dz = Number(object.position?.z || 0) - player.z;
    if (large) {
      object._cx = Number(object.position?.x || 0);
      object._cz = Number(object.position?.z || 0);
      object._isAlwaysVisible = true;
      object.visible = true;
      object.frustumCulled = false;
      object.traverse?.(child => {
        if (child?.isMesh || child?.isInstancedMesh) child.frustumCulled = false;
      });
    } else if (dx * dx + dz * dz <= nearSq) {
      object.visible = true;
    }
  }

  // Reinicia el barrido de visibilidad después de teletransportes (casa/tutorial).
  try {
    game.cullScanPlayer?.copy?.(player);
    game.cullScanAnchor?.set?.(player.x + 100000, player.y, player.z + 100000);
    game.cullScanCursor = 0;
    game.cullScanPending = true;
  } catch {}

  // El mundo estaba demasiado oscuro aun cuando sí existía.
  if (game.hemiLight) game.hemiLight.intensity = Math.max(Number(game.hemiLight.intensity || 0), .9);
  if (game.dLight) game.dLight.intensity = Math.max(Number(game.dLight.intensity || 0), 1.8);
  if (game.renderer && Number(game.renderer.toneMappingExposure || 0) < .78) game.renderer.toneMappingExposure = .78;
  game.city.updateMatrixWorld?.(true);
}

function markReady(game, reason) {
  forceWorldVisibility(game);
  window.__VICE_WORLD_VISIBILITY_READY__ = true;
  window.__VICE_WORLD_VISIBILITY_REASON__ = reason;
  window.dispatchEvent(new CustomEvent('vice-world-visibility-ready', { detail:{ reason } }));
}

async function recoverCoreWorld(game) {
  if (recoveryRunning || !game) return;
  recoveryRunning = true;
  window.__GTA_LOADING__?.setStatus?.('Cargando pistas y edificios del mundo…');
  window.__GTA_LOADING__?.setProgress?.(58);

  try {
    if (!game.coreWorldReady) {
      try { game.loadCoreWorldNow?.(); } catch (error) { console.warn('[world-recovery] Primer arranque incompleto.', error); }
    }

    for (let i = 0; i < 70; i++) {
      forceWorldVisibility(game);
      if (game.coreWorldReady && hasGroundNearPlayer(game)) {
        markReady(game, 'core-ready');
        return;
      }
      await sleep(100);
    }

    // Si Parque del Retiro falló después de que buildWorld ya creó la ciudad,
    // no se descarta el mapa completo: se conserva el mundo procedural existente.
    const enoughWorld = (game.city?.children?.length || 0) >= 24 && hasGroundNearPlayer(game);
    if (enoughWorld) {
      game.coreWorldReady = true;
      if (game.bootstrapGround) {
        try { game.scene?.remove?.(game.bootstrapGround); } catch {}
        game.bootstrapGround = null;
      }
      markReady(game, 'procedural-world-recovered');
      return;
    }

    // Segundo intento controlado. Solo reconstruye si realmente no hay superficies.
    game.coreWorldLoadStarted = false;
    try { game.loadCoreWorldNow?.(); } catch (error) { console.warn('[world-recovery] Segundo arranque incompleto.', error); }
    for (let i = 0; i < 55; i++) {
      forceWorldVisibility(game);
      if ((game.coreWorldReady || (game.city?.children?.length || 0) >= 24) && hasGroundNearPlayer(game)) {
        game.coreWorldReady = true;
        markReady(game, 'retry-recovered');
        return;
      }
      await sleep(100);
    }

    // Última recuperación: llama al constructor procedural solo si el mapa no existe.
    if (!hasGroundNearPlayer(game) && typeof game.buildWorld === 'function') {
      try {
        game.buildWorld();
        game.city?.updateMatrixWorld?.(true);
      } catch (error) {
        console.error('[world-recovery] No se pudo reconstruir el mundo procedural.', error);
      }
    }

    if ((game.city?.children?.length || 0) >= 10) {
      game.coreWorldReady = true;
      markReady(game, hasGroundNearPlayer(game) ? 'forced-world-ready' : 'partial-world-ready');
    }
  } finally {
    recoveryRunning = false;
  }
}

async function install() {
  if (installed) return;
  const game = window.__VICE_CITY_GAME__;
  if (!game?.renderer || !game?.scene || !game?.city || !game?.playerContainer) return;
  installed = true;
  await recoverCoreWorld(game);

  // Durante los primeros segundos mantiene visibles los sectores cercanos,
  // incluyendo el traslado inicial a la casa.
  let passes = 0;
  const guard = setInterval(() => {
    forceWorldVisibility(game);
    passes++;
    if (passes >= 30) clearInterval(guard);
  }, 500);
}

window.__VICE_RECOVER_WORLD__ = () => recoverCoreWorld(window.__VICE_CITY_GAME__);
const timer = setInterval(() => {
  void install();
  if (installed) clearInterval(timer);
}, 80);
setTimeout(() => clearInterval(timer), 30000);
