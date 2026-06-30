/**
 * GTA MANUCHO V84 — código del proyecto.
 * Creado e integrado por Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * ARKEA AI / Manucho · conserva LICENSE, NOTICE.md y estos créditos al reutilizar.
 */
import * as THREE from './bosque/libs/three.module.js';

THREE.Cache.enabled = true;

let installed = false;

function detachObject(object) {
  if (!object) return;
  try { object.parent?.remove(object); } catch {}
}

function removeBasePopulation(game) {
  // El juego base podía dejar NPC, tráfico o agentes programados antes de que
  // entrara el sistema optimizado. Se eliminan siempre, no solo si hay muchos.
  try {
    if (Array.isArray(game.npcs)) {
      for (const npc of game.npcs) detachObject(npc?.mesh || npc?.root);
      game.npcs.length = 0;
    }
    game.activeNpcRenderSet?.clear?.();
  } catch (error) {
    console.warn('[fluid-mode] No se pudo retirar toda la población base.', error);
  }

  try {
    if (Array.isArray(game.trafficCars)) {
      for (const entry of game.trafficCars) detachObject(entry?.mesh);
      game.trafficCars.length = 0;
    }
    if (Array.isArray(game.instancedCarMeshes)) {
      for (const entry of game.instancedCarMeshes) detachObject(entry?.instanced);
      game.instancedCarMeshes.length = 0;
    }
    if (Array.isArray(game.scatteredCarData)) game.scatteredCarData.length = 0;
    game.nearestDriveableCar = null;
  } catch (error) {
    console.warn('[fluid-mode] No se pudo retirar todo el tráfico base.', error);
  }

  // Los agentes del sistema policial/base añadían otra simulación completa de
  // personajes. Los peatones optimizados siguen presentes mediante city-npcs.js.
  try {
    const world = game.crimeWorld;
    if (world) {
      for (const agent of world.agents || []) detachObject(agent?.root || agent?.mesh);
      for (const agent of world.gangAgents || []) detachObject(agent?.root || agent?.mesh);
      world.agents?.splice?.(0);
      world.gangAgents?.splice?.(0);
    }
    game.crimeWorld = null;
  } catch {}
}

function disableDeferredStallTasks(game) {
  // Estas tareas construían ciudades/zonas enormes de forma síncrona después de
  // empezar a jugar. Aunque se ejecutaran "en idle", podían bloquear varios
  // fotogramas. El mapa principal, Retiro, bosque y museo permanecen disponibles.
  const blockedIds = [
    'ocean', 'hdri', 'mega-city', 'east-city', 'new-york-city', 'highway',
    'chrome-city', 'sewers', 'sky-world', 'underwater-world', 'neon-city',
    'npc-assets', 'traffic', 'crime-world', 'scattered-cars', 'pbr-chamber',
    'retiro-progressive-models', 'retiro-sea-exhibits', 'casa-mia-module',
    'casa-mia', 'nasa-module', 'nasa'
  ];

  try {
    game.heavyTasks?.splice?.(0);
    for (const id of blockedIds) game.loadedHeavyTasks?.add?.(id);
  } catch {}

  game.scheduleHeavyTask = () => {};
  game.processHeavyTasks = () => {};
  game.heavyTaskRunning = false;
}

function installLightweightGroundSafety(game) {
  const original = typeof game.recoverPlayerIfInvalid === 'function'
    ? game.recoverPlayerIfInvalid.bind(game)
    : null;
  if (!original) return;

  let nextCheck = 0;
  game.recoverPlayerIfInvalid = function throttledGroundSafety() {
    const p = this.playerContainer?.position;
    if (!p) return;

    // Una posición inválida se corrige inmediatamente. La costosa consulta normal
    // del suelo se limita a pocas veces por segundo y nunca se hace cada frame.
    const invalid = !Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z) || p.y < -5000;
    const now = performance.now();
    if (!invalid && now < nextCheck) return;
    nextCheck = now + (this.activeCar ? 900 : 260);
    return original();
  };
}

function installLightweightCulling(game) {
  // V76: el culling manual de versiones anteriores podía ocultar accidentalmente
  // el suelo y las islas completas cuando el primer escaneo empezaba antes de que
  // la posición del jugador estuviera lista. Restauramos la ciudad una sola vez y
  // dejamos que Three.js aplique su frustum culling nativo por malla.
  try {
    for (const object of game.city?.children || []) object.visible = true;
  } catch {}
  game.processIncrementalVisibilityCulling = function safeWorldCulling() {};
  window.__VICE_FORCE_CULL_PREPARE__ = async () => {
    try { for (const object of game.city?.children || []) object.visible = true; } catch {}
  };
}

function throttleInterfaceWork(game) {
  if (typeof game.drawRadar === 'function') {
    const drawRadar = game.drawRadar.bind(game);
    let nextRadar = 0;
    game.drawRadar = function throttledRadar() {
      const now = performance.now();
      if (now < nextRadar) return;
      nextRadar = now + (this.activeCar ? 1100 : 750);
      return drawRadar();
    };
  }

  if (typeof game.updateHUDState === 'function') {
    const updateHUD = game.updateHUDState.bind(game);
    let nextHud = 0;
    let lastMessage = Symbol('initial');
    game.updateHUDState = function throttledHud() {
      const now = performance.now();
      const messageChanged = this.currentMessage !== lastMessage;
      if (!messageChanged && now < nextHud) return;
      lastMessage = this.currentMessage;
      nextHud = now + (this.activeCar ? 700 : 500);
      return updateHUD();
    };
  }
}

function install(game) {
  if (installed || !game?.renderer) return;
  installed = true;

  // Impide que los sistemas duplicados vuelvan a crearse.
  game.autoAdjustPerformance = () => {};
  game.loadNPCAssets = async () => [];
  game.spawnNPCs = () => {};
  game.initTraffic = () => {
    game.trafficCars = [];
    game.scatteredCarData = [];
    game.instancedCarMeshes = [];
  };
  game.updateTraffic = () => { game.nearestDriveableCar = null; };

  removeBasePopulation(game);
  disableDeferredStallTasks(game);
  installLightweightGroundSafety(game);
  installLightweightCulling(game);
  throttleInterfaceWork(game);

  const renderer = game.renderer;
  renderer.info.autoReset = true;
  renderer.shadowMap.enabled = false;
  renderer.shadowMap.autoUpdate = false;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  window.__VICE_PERFORMANCE_READY__ = true;
  window.dispatchEvent(new CustomEvent('vice-performance-ready'));
  window.__VICE_PERFORMANCE_BOOST__ = {
    fullResolution: true,
    baseNpcSystemDisabled: true,
    baseTrafficDisabled: true,
    deferredWorldBuildsDisabled: true,
    crimeAgentsDisabled: true,
    groundChecksThrottled: true,
    cullingBatched: false,
    hudAndRadarThrottled: true
  };
}

const wait = setInterval(() => {
  const game = window.__VICE_CITY_GAME__;
  if (!game?.renderer) return;
  clearInterval(wait);
  install(game);
}, 12);

setTimeout(() => clearInterval(wait), 20000);
