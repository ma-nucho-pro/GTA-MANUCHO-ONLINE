/**
 * GTA MANUCHO V84 — cargador de sistemas de ciudad.
 * Roberto Manuel Jara Peche · GitHub: ma-nucho-pro · ARKEA AI.
 * Licencia y atribución: consulta LICENSE y NOTICE.md.
 */
// V36: NPC y coches se preparan detrás de la transición. La ciudad solo se
// descubre cuando sus modelos, materiales y primeras animaciones ya están listos.

const overlay = document.getElementById('npc-city-loading-overlay');
const subtitle = overlay?.querySelector('.npc-loading-subtitle');
let overlayHidden = false;

function nextFrame() {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function idle(timeout = 1000) {
  return new Promise(resolve => {
    if ('requestIdleCallback' in window) requestIdleCallback(() => resolve(), { timeout });
    else setTimeout(resolve, Math.min(timeout, 180));
  });
}

function setStatus(text) {
  if (subtitle) subtitle.textContent = text;
  window.__GTA_LOADING__?.setStatus?.(text);
}

async function waitForBaseCity() {
  const started = performance.now();
  while (performance.now() - started < 30000) {
    const game = window.__VICE_CITY_GAME__;
    const canvas = game?.renderer?.domElement;
    if (game?.renderer && game?.scene && game?.camera && game?.playerContainer && canvas) {
      await nextFrame();
      await nextFrame();
      window.__VICE_BASE_CITY_READY__ = true;
      window.__GTA_LOADING__?.setProgress?.(72);
      window.dispatchEvent(new CustomEvent('vice-base-city-ready'));
      return game;
    }
    await delay(32);
  }
  return window.__VICE_CITY_GAME__;
}

async function waitForCoreWorld(timeout = 12000) {
  const started = performance.now();
  while (performance.now() - started < timeout) {
    const game = window.__VICE_CITY_GAME__;
    if (game?.coreWorldReady) return game;
    await delay(80);
  }
  return window.__VICE_CITY_GAME__;
}

async function importSafely(path, label) {
  try {
    await import(path);
    return true;
  } catch (error) {
    console.error(`[city-extras] No se pudo iniciar ${label}.`, error);
    return false;
  }
}

async function waitForFlag(flagName, eventName, timeout) {
  if (window[flagName]) return;
  await Promise.race([
    new Promise(resolve => window.addEventListener(eventName, resolve, { once: true })),
    delay(timeout)
  ]);
}


async function preparePoliceBeforeReveal() {
  const game = window.__VICE_CITY_GAME__;
  if (!game || typeof game.performShoot !== 'function') return;

  const oldMessage = game.currentMessage;
  const oldWeapon = game.activeWeapon;
  const oldBullets = Array.isArray(game.bullets) ? game.bullets.slice() : [];
  const hadCrimeWorld = Boolean(game.crimeWorld);
  const previousWanted = Number(game.crimeWorld?.wantedLevel || 0);
  const previousWantedAge = Number(game.crimeWorld?.wantedAge || 0);
  try {
    // La clase policial está encapsulada en el juego base. Ejecutar una sola vez
    // el camino de creación mientras la transición está visible construye la
    // piscina de agentes, geometrías y materiales antes de cualquier delito real.
    if (!game.crimeWorld) game.performShoot();
    const world = game.crimeWorld;
    if (!world) return;

    // V86: precalienta la policía sin borrar bandas, aves ni funciones del mundo.
    // Los modelos y materiales existentes quedan disponibles para el modo online.
    world.policeModelRequested = true;
    world.requestNearbyModels?.();

    world.wantedLevel = hadCrimeWorld ? previousWanted : 0;
    world.wantedAge = hadCrimeWorld ? previousWantedAge : 0;
    for (const officer of world.policeAgents || []) {
      officer.root.visible = false;
      officer.root.updateMatrixWorld(true);
    }
    window.__POLICE_PREPARED__ = true;
  } catch (error) {
    console.warn('[city-extras] No se pudo precargar completamente la policía.', error);
  } finally {
    // Retira el disparo técnico usado únicamente para construir el sistema.
    if (Array.isArray(game.bullets)) {
      for (const bullet of game.bullets) {
        if (!oldBullets.includes(bullet)) bullet?.mesh?.parent?.remove(bullet.mesh);
      }
      game.bullets.length = 0;
      game.bullets.push(...oldBullets);
    }
    game.currentMessage = oldMessage;
    game.activeWeapon = oldWeapon;
    game.updateHUDState?.();
  }
}


async function prepareNativePopulation() {
  const game = window.__VICE_CITY_GAME__;
  if (!game) return;
  const removeQueued = id => {
    try { game.heavyTasks = (game.heavyTasks || []).filter(task => task?.id !== id); } catch {}
    try { game.loadedHeavyTasks?.add?.(id); } catch {}
  };

  // Solo se usan los peatones y coches originales. Cada fase obtiene su propio
  // turno libre para que no se creen NPC, tráfico y coches en el mismo fotograma.
  removeQueued('npc-assets');
  removeQueued('traffic');
  removeQueued('scattered-cars');

  if ((!game.npcModelsData || game.npcModelsData.length === 0) && typeof game.loadNPCAssets === 'function') {
    await idle(1800);
    await game.loadNPCAssets();
  }

  await nextFrame();
  await idle(1200);
  if ((!game.npcs || game.npcs.length === 0) && typeof game.spawnNPCs === 'function') {
    game.spawnNPCs();
  }
  removeQueued('npc-assets');

  await nextFrame();
  await idle(1200);
  if ((!game.trafficCars || game.trafficCars.length === 0) && typeof game.initTraffic === 'function') {
    game.initTraffic();
  }
  removeQueued('traffic');

  await nextFrame();
  await idle(1500);
  if ((!game.scatteredCarData || game.scatteredCarData.length === 0) && typeof game.spawnScatteredCars === 'function') {
    game.spawnScatteredCars();
  }
  removeQueued('scattered-cars');
  window.__NATIVE_CITY_POPULATION_READY__ = true;
}


async function prewarmActualCityScene() {
  const game = window.__VICE_CITY_GAME__;
  const renderer = game?.renderer;
  const scene = game?.scene;
  const camera = game?.camera;
  if (!renderer || !scene || !camera) return;

  const roots = [
    ...((window.__VICE_CITY_GAME__?.npcs) || []).slice(0, 24).map(entry => entry?.mesh || entry?.root),
    window.__ARCADE_HALL__?.hall,
    window.__CITY_BIRDS__,
    ...((window.__VICE_CITY_GAME__?.trafficCars) || []).map(entry => entry?.mesh),
    window.__VICE_CITY_GAME__?.baseScatteredCar,
    ...((window.__VICE_CITY_GAME__?.crimeWorld?.policeAgents) || []).map(entry => entry?.root),
    ...((window.__CITY_LIFE_SYSTEM__?.gangs) || []).map(entry => entry?.root),
    ...((window.__CITY_LIFE_SYSTEM__?.ambientPolice) || []).map(entry => entry?.root),
    ...((window.__AIRCRAFT_SYSTEM__?.aircraft) || []).map(entry => entry?.root),
    ...((window.__POLICE_RESPONSE__?.tanks) || []).map(entry => entry?.root),
    window.__V81_MARINE_WORLD__?.ocean,
    window.__V81_MARINE_WORLD__?.marineGroup,
    window.__V81_MARINE_WORLD__?.underwaterGroup
  ].filter(Boolean);
  if (!roots.length) return;

  const saved = [];
  const oldTarget = renderer.getRenderTarget?.() || null;
  let target = null;
  try {
    // Fuerza una única compilación con la iluminación, niebla y entorno reales de
    // GTA MANUCHO. Así los modelos no estrenan shaders cuando entran en pantalla.
    for (const root of roots) {
      saved.push({ object: root, visible: root.visible });
      root.visible = true;
      root.traverse?.(object => {
        if (!object.isMesh && !object.isSkinnedMesh) return;
        saved.push({ object, frustumCulled: object.frustumCulled });
        object.frustumCulled = false;
      });
    }

    if (typeof renderer.compileAsync === 'function') {
      try { await renderer.compileAsync(scene, camera); } catch {}
    } else if (typeof renderer.compile === 'function') {
      try { renderer.compile(scene, camera); } catch {}
    }

    const THREE = await import('./bosque/libs/three.module.js');
    target = new THREE.WebGLRenderTarget(24, 24, { depthBuffer: true, stencilBuffer: false });
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    await nextFrame();
  } catch (error) {
    console.warn('[city-extras] Precalentamiento final incompleto.', error);
  } finally {
    try { renderer.setRenderTarget(oldTarget); } catch {}
    try { target?.dispose?.(); } catch {}
    for (let i = saved.length - 1; i >= 0; i--) {
      const state = saved[i];
      if ('frustumCulled' in state) state.object.frustumCulled = state.frustumCulled;
      if ('visible' in state) state.object.visible = state.visible;
    }
  }
}

async function revealCity() {
  if (overlayHidden) return;
  const game = window.__VICE_CITY_GAME__;
  if (!game?.renderer?.domElement || !game?.scene || !game?.camera) return;
  await nextFrame();
  await nextFrame();
  window.__VICE_CITY_REVEALED__ = true;
  window.dispatchEvent(new CustomEvent('vice-city-revealed'));
  window.__GTA_LOADING__?.reveal?.('base-city-ready');
  overlay?.classList.add('ready');
  setTimeout(() => overlay?.remove(), 650);
  overlayHidden = true;
}

function markCityExtrasReady() {
  if (window.__VICE_CITY_EXTRAS_READY__) return;
  window.__VICE_CITY_EXTRAS_READY__ = true;
  window.dispatchEvent(new CustomEvent('vice-city-extras-ready'));
}

function scheduleIdle(task, delayMs = 1500) {
  const run = () => Promise.resolve().then(task).catch(error => console.warn('[city-extras] Tarea secundaria incompleta.', error));
  setTimeout(() => {
    if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 1800 });
    else setTimeout(run, 40);
  }, Math.max(0, delayMs));
}

async function bootExtras() {
  setStatus('Cargando la ciudad base…');
  window.__GTA_LOADING__?.setProgress?.(18);
  const game = await waitForBaseCity();
  if (!game?.renderer || !game?.scene || !game?.camera) {
    setStatus('El motor 3D sigue iniciándose…');
    console.error('[city-extras] El núcleo no estuvo disponible dentro del tiempo de espera.');
    return;
  }

  setStatus('Preparando el render principal…');
  window.__GTA_LOADING__?.setProgress?.(52);
  await Promise.race([
    waitForFlag('__VICE_PERFORMANCE_READY__', 'vice-performance-ready', 1200),
    delay(280)
  ]);

  setStatus('Cargando pistas y zonas del mapa…');
  window.__GTA_LOADING__?.setProgress?.(72);
  await waitForCoreWorld(12000);
  if (!game.coreWorldReady || !window.__VICE_WORLD_VISIBILITY_READY__) {
    try { await window.__VICE_RECOVER_WORLD__?.(); } catch {}
    await waitForFlag('__VICE_WORLD_VISIBILITY_READY__', 'vice-world-visibility-ready', 10000);
  }
  await importSafely('./integrated-zones.js?v=49', 'las zonas del mapa');

  setStatus('Activando población y tráfico nativos…');
  window.__GTA_LOADING__?.setProgress?.(82);
  await idle(900);
  await prepareNativePopulation();

  setStatus('Preparando policía y bandas…');
  window.__GTA_LOADING__?.setProgress?.(90);
  await idle(700);
  await preparePoliceBeforeReveal();
  await importSafely('./territory-combat.js?v=90', 'la policía, las bandas y los servicios');
  await waitForFlag('__TERRITORY_COMBAT_READY__', 'territory-combat-ready', 11000);

  setStatus('Precalentando animaciones cercanas…');
  window.__GTA_LOADING__?.setProgress?.(94);
  await prewarmActualCityScene();

  markCityExtrasReady();
  window.__GTA_LOADING__?.setProgress?.(96);
  setStatus('Entrando a Ciudad Manucho…');
  await revealCity();

  // Resto de mundos y extras realmente secundarios.
  scheduleIdle(async () => {
    await waitForCoreWorld(12000);
    await importSafely('./marine-world-v84.js?v=87', 'el mar, las islas y los barcos');
  }, 1800);

  scheduleIdle(async () => {
    await waitForCoreWorld(12000);
    await importSafely('./aircraft-system.js?v=87', 'las aeronaves y el helicóptero');
    await waitForFlag('__AIRCRAFT_SYSTEM_READY__', 'aircraft-system-ready', 9000);
    try { await window.__AIRCRAFT_SYSTEM__?.ensureExhibit?.(); } catch {}
  }, 3600);

  scheduleIdle(async () => {
    await waitForFlag('__AIRCRAFT_SYSTEM_READY__', 'aircraft-system-ready', 12000);
    await importSafely('./police-response.js?v=87', 'el tanque y la respuesta policial');
    await waitForFlag('__POLICE_RESPONSE_READY__', 'police-response-ready', 9000);
    try { await window.__POLICE_RESPONSE__?.ensureParkedTank?.(); } catch {}
  }, 6200);

  scheduleIdle(() => importSafely('./castle-world.js?v=49', 'el castillo y su mundo'), 1300);
  scheduleIdle(() => importSafely('./desert-world.js?v=49', 'el iglú DESERT y su portal'), 2100);
  scheduleIdle(() => importSafely('./city-birds.js?v=49', 'las aves'), 3000);
  scheduleIdle(() => importSafely('./wanted-stars.js?v=65', 'las estrellas de reducción de búsqueda'), 3900);
  scheduleIdle(() => importSafely('./police-foot-behavior.js?v=87', 'el comportamiento terrestre de la policía'), 5200);
  scheduleIdle(() => importSafely('./weapon-crates.js?v=82', 'las cajas y armas del inventario Q'), 7600);
  scheduleIdle(() => importSafely('./fog-city-horses.js?v=82', 'Fog City y sus caballos'), 9400);
  scheduleIdle(() => importSafely('./fog-city-jetpack.js?v=82', 'el jetpack físico de Fog City'), 10100);
  scheduleIdle(() => importSafely('./girlfriend-house.js?v=61', 'la casa de la novia y las estadísticas'), 11200);
  scheduleIdle(() => importSafely('./arcade-hall.js?v=49', 'el salón de juegos'), 13200);
  scheduleIdle(() => importSafely('./coliseum.js?v=49', 'el coliseo de carreras'), 15800);
}

bootExtras().catch(async error => {
  console.error('[city-extras] Error de arranque.', error);
  try { await window.__VICE_RECOVER_WORLD__?.(); } catch {}
  await waitForFlag('__VICE_WORLD_VISIBILITY_READY__', 'vice-world-visibility-ready', 9000);
  markCityExtrasReady();
  if (window.__VICE_CITY_GAME__?.renderer && window.__VICE_WORLD_VISIBILITY_READY__) revealCity();
});

// Salvaguarda: no muestra una ciudad negra. Primero intenta recuperar el mundo
// y solo después permite retirar la transición.
setTimeout(async () => {
  try { await window.__VICE_RECOVER_WORLD__?.(); } catch {}
  await waitForFlag('__VICE_WORLD_VISIBILITY_READY__', 'vice-world-visibility-ready', 8000);
  if (!window.__VICE_WORLD_VISIBILITY_READY__) return;
  markCityExtrasReady();
  if (window.__VICE_CITY_GAME__?.renderer) revealCity();
}, 28000);
