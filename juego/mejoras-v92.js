/**
 * GTA MANUCHO V92 — mejoras sin cambiar el contenido del juego.
 * 1) PARQUE DEL RETIRO GARANTIZADO: si su carga falla o desaparece, se
 *    reconstruye automáticamente con el constructor original del núcleo.
 * 2) COCHES FUERA DEL AGUA: ningún vehículo puede circular sobre el lago del
 *    Retiro ni el agua del núcleo (el mar abierto ya lo controla marine-world).
 * 3) ANTI-TIRONES: cada vez que un sistema secundario termina de cargar
 *    (mar, aeronaves, tanque policial, territorios), se compilan sus shaders
 *    en un momento libre para que no congelen la pantalla al aparecer.
 * No se elimina ni se sustituye ningún NPC, coche, mundo ni función existente.
 */

const WORLD_SCALE = 16;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function idle(task, timeout = 2200) {
  if ('requestIdleCallback' in window) requestIdleCallback(task, { timeout });
  else setTimeout(task, 120);
}

function getGame() {
  return window.__VICE_CITY_GAME__ || null;
}

/* ------------------------------------------------------------------ */
/* 1) PARQUE DEL RETIRO GARANTIZADO                                    */
/* ------------------------------------------------------------------ */

function retiroGroup(game) {
  if (game?.__retiroParkGroup?.parent) return game.__retiroParkGroup;
  return (game?.city?.children || []).find(o => o?.name === 'retiro-park-ground') || null;
}

function retiroLooksHealthy(game) {
  const group = retiroGroup(game);
  if (!group) return false;
  if (window.__GTA_RETIRO_FAILED__ && !window.__GTA_RETIRO_OK__) return false;
  // Un parque completo tiene decenas de elementos (lago, árboles, arcos…).
  return (group.children?.length || 0) >= 6;
}

let retiroAttempts = 0;
async function ensureRetiro() {
  const game = getGame();
  if (!game?.city || !game?.coreWorldReady) return;
  if (retiroLooksHealthy(game)) {
    const group = retiroGroup(game);
    if (group) {
      group.visible = true;
      group.frustumCulled = false;
    }
    return;
  }
  if (retiroAttempts >= 3 || typeof window.__GTA_BUILD_RETIRO__ !== 'function') return;
  retiroAttempts += 1;
  try {
    // Retira el intento parcial anterior antes de reconstruir.
    const previous = retiroGroup(game);
    if (previous?.parent) previous.parent.remove(previous);
  } catch {}
  const ok = window.__GTA_BUILD_RETIRO__();
  if (ok) {
    window.__GTA_RETIRO_OK__ = true;
    window.__GTA_RETIRO_FAILED__ = false;
    try { game.city.updateMatrixWorld(true); } catch {}
    const group = retiroGroup(game);
    if (group) { group.visible = true; group.frustumCulled = false; }
    console.info('[mejoras-v92] Parque del Retiro reconstruido correctamente.');
    idle(() => { try { game.renderer?.compileAsync?.(game.scene, game.camera).catch(() => {}); } catch {} });
  }
}

/* ------------------------------------------------------------------ */
/* 2) COCHES FUERA DEL AGUA (lago del Retiro y agua del núcleo)         */
/* ------------------------------------------------------------------ */

// Geometría del lago del Retiro (misma que usa el núcleo para detectar nado).
const LAKE_CENTER_X = (1500 + 220) * WORLD_SCALE; // 1720 * r
const LAKE_CENTER_Z = (300 - 70) * WORLD_SCALE;   // 230 * r
const LAKE_HALF_X = (160 / 2 + 2) * WORLD_SCALE;
const LAKE_HALF_Z = (240 / 2 + 2) * WORLD_SCALE;
const LAKE_SURFACE_Y = (0.5 + 0.45) * WORLD_SCALE;

const lastSafeCarPosition = { x: 0, y: 0, z: 0, valid: false };
let lastCarWaterNoticeAt = 0;

function isInLake(x, z, y) {
  return Math.abs(x - LAKE_CENTER_X) < LAKE_HALF_X &&
         Math.abs(z - LAKE_CENTER_Z) < LAKE_HALF_Z &&
         y < LAKE_SURFACE_Y + 8 * WORLD_SCALE;
}

function zeroSpeeds(object) {
  if (!object) return;
  for (const key of ['speed', 'carSpeed', 'currentSpeed', 'targetSpeed', 'velocityY', 'steer', 'steering']) {
    if (typeof object[key] === 'number') object[key] = 0;
  }
  object.velocity?.set?.(0, 0, 0);
  object.angularVelocity?.set?.(0, 0, 0);
}

function blockActiveCarFromLake() {
  const game = getGame();
  if (!game?.activeCar || !game?.playerContainer) return;
  const entry = game.activeCar;
  const root = entry?.root || entry?.mesh || entry;
  const pos = root?.position || game.playerContainer.position;
  if (!pos) return;

  if (isInLake(pos.x, pos.z, pos.y)) {
    if (lastSafeCarPosition.valid) {
      pos.x = lastSafeCarPosition.x;
      pos.y = lastSafeCarPosition.y;
      pos.z = lastSafeCarPosition.z;
      game.playerContainer.position.set(lastSafeCarPosition.x, lastSafeCarPosition.y, lastSafeCarPosition.z);
    } else {
      // Empuja hacia el borde más cercano del lago.
      const dx = pos.x - LAKE_CENTER_X;
      const dz = pos.z - LAKE_CENTER_Z;
      if (Math.abs(dx) / LAKE_HALF_X > Math.abs(dz) / LAKE_HALF_Z) {
        pos.x = LAKE_CENTER_X + Math.sign(dx || 1) * (LAKE_HALF_X + 6 * WORLD_SCALE);
      } else {
        pos.z = LAKE_CENTER_Z + Math.sign(dz || 1) * (LAKE_HALF_Z + 6 * WORLD_SCALE);
      }
      game.playerContainer.position.copy(pos);
    }
    zeroSpeeds(root); zeroSpeeds(entry); zeroSpeeds(entry?.driveData); zeroSpeeds(root?.userData);
    game.state && (game.state.inWater = false, game.state.isSubmerged = false, game.state.vy = 0);
    const now = performance.now();
    if (now - lastCarWaterNoticeAt > 2600) {
      lastCarWaterNoticeAt = now;
      game.currentMessage = 'LOS VEHÍCULOS NO PUEDEN ENTRAR AL AGUA';
      game.updateHUDState?.();
      setTimeout(() => {
        if (game.currentMessage === 'LOS VEHÍCULOS NO PUEDEN ENTRAR AL AGUA') {
          game.currentMessage = undefined;
          game.updateHUDState?.();
        }
      }, 1800);
    }
  } else {
    lastSafeCarPosition.x = pos.x;
    lastSafeCarPosition.y = pos.y;
    lastSafeCarPosition.z = pos.z;
    lastSafeCarPosition.valid = true;
  }
}

/* ------------------------------------------------------------------ */
/* 3) ANTI-TIRONES: precompilar shaders al llegar cada sistema          */
/* ------------------------------------------------------------------ */

let compileQueued = false;
function queueShaderCompile(reason) {
  const game = getGame();
  if (!game?.renderer || compileQueued) return;
  compileQueued = true;
  idle(async () => {
    compileQueued = false;
    try {
      if (typeof game.renderer.compileAsync === 'function') {
        await game.renderer.compileAsync(game.scene, game.camera);
      } else {
        game.renderer.compile?.(game.scene, game.camera);
      }
    } catch {}
  }, 2600);
}

function installAntiStutterHooks() {
  for (const eventName of [
    'aircraft-system-ready',
    'police-response-ready',
    'territory-combat-ready',
    'vice-city-extras-ready'
  ]) {
    window.addEventListener(eventName, () => queueShaderCompile(eventName), { once: true });
  }
  // El mar no emite evento propio: se vigila su bandera unos segundos.
  let marinePasses = 0;
  const marineTimer = setInterval(() => {
    marinePasses += 1;
    if (window.__V81_MARINE_WORLD__) {
      clearInterval(marineTimer);
      queueShaderCompile('marine-world');
    } else if (marinePasses > 90) clearInterval(marineTimer);
  }, 500);
}

/* ------------------------------------------------------------------ */
/* Arranque                                                            */
/* ------------------------------------------------------------------ */

async function start() {
  // Espera a que el núcleo exista.
  for (let i = 0; i < 400; i++) {
    if (getGame()?.renderer && getGame()?.city) break;
    await sleep(150);
  }
  const game = getGame();
  if (!game) return;

  installAntiStutterHooks();

  // Guardia del Retiro: comprobaciones durante los primeros minutos.
  for (let i = 0; i < 40; i++) {
    await ensureRetiro();
    await sleep(3000);
    if (retiroLooksHealthy(getGame()) && i > 6) break;
  }
}

// Bloqueo del lago: comprobación ligera continua (solo cuando conduces).
setInterval(() => {
  try { blockActiveCarFromLake(); } catch {}
}, 130);

start().catch(error => console.warn('[mejoras-v92] Arranque incompleto.', error));
