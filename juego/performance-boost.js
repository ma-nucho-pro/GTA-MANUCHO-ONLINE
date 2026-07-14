/**
 * GTA MANUCHO V86 — optimización sin sustituir contenido original.
 * Conserva los NPC, tráfico, bandas, policía, vehículos y mundos del juego base.
 */
import * as THREE from './bosque/libs/three.module.js';

THREE.Cache.enabled = true;
const WORLD_SCALE = 16;
let installed = false;

function idle(callback, timeout = 1000) {
  if ('requestIdleCallback' in window) requestIdleCallback(callback, { timeout });
  else setTimeout(callback, Math.min(timeout, 220));
}

function capTextureCost(root, renderer) {
  const maxAnisotropy = Math.min(4, renderer.capabilities?.getMaxAnisotropy?.() || 1);
  root?.traverse?.(object => {
    if (!object.isMesh && !object.isSkinnedMesh) return;
    object.frustumCulled = true;
    object.castShadow = false;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material) continue;
      for (const key of ['map','normalMap','roughnessMap','metalnessMap','emissiveMap','aoMap']) {
        const texture = material[key];
        if (!texture) continue;
        texture.anisotropy = Math.min(texture.anisotropy || 1, maxAnisotropy);
        texture.generateMipmaps = true;
      }
    }
  });
}

function installGroundSafety(game) {
  const original = typeof game.recoverPlayerIfInvalid === 'function'
    ? game.recoverPlayerIfInvalid.bind(game) : null;
  if (!original || game.__v86GroundSafety) return;
  game.__v86GroundSafety = true;
  let nextCheck = 0;
  game.recoverPlayerIfInvalid = function v86GroundSafety() {
    const p = this.playerContainer?.position;
    if (!p) return;
    const invalid = !Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z) || p.y < -5000;
    const now = performance.now();
    if (!invalid && now < nextCheck) return;
    nextCheck = now + (this.activeCar || this.activeBoat ? 500 : 180);
    return original();
  };
}

function installAdaptiveResolution(game) {
  const renderer = game.renderer;
  const preferred = Math.min(window.devicePixelRatio || 1, 1.15);
  renderer.setPixelRatio(preferred);
  renderer.shadowMap.enabled = false;
  renderer.shadowMap.autoUpdate = false;
  renderer.info.autoReset = true;

  let sampleStart = performance.now();
  let frames = 0;
  let current = preferred;
  function sample() {
    requestAnimationFrame(sample);
    if (document.hidden) return;
    frames++;
    const now = performance.now();
    const elapsed = now - sampleStart;
    if (elapsed < 3000) return;
    const fps = frames * 1000 / elapsed;
    frames = 0;
    sampleStart = now;
    let next = current;
    if (fps < 45) next = Math.max(.64, current - .12);
    else if (fps > 57) next = Math.min(preferred, current + .05);
    if (Math.abs(next - current) > .01) {
      current = next;
      renderer.setPixelRatio(current);
      renderer.setSize(window.innerWidth, window.innerHeight, false);
    }
  }
  requestAnimationFrame(sample);
}

function installPopulationBudget(game) {
  // El sistema nativo ya activa únicamente los peatones más cercanos. Esta capa
  // evita que una población mayor incremente mezcladores y matrices innecesarios.
  let nextNpcPass = 0;
  let nextTrafficPass = 0;
  const nativeUpdateNpcs = typeof game.updateNPCs === 'function' ? game.updateNPCs.bind(game) : null;
  if (nativeUpdateNpcs) {
    game.updateNPCs = function v86UpdateNPCs(dt, ...rest) {
      const now = performance.now();
      const movingFast = Boolean(this.activeCar || this.activeBoat || window.__ACTIVE_AIRCRAFT__ || window.__ACTIVE_TANK__);
      if (now < nextNpcPass) return;
      nextNpcPass = now + (movingFast ? 72 : 40);
      return nativeUpdateNpcs(Math.min(Number(dt) || 0, .08), ...rest);
    };
  }

  const nativeUpdateTraffic = typeof game.updateTraffic === 'function' ? game.updateTraffic.bind(game) : null;
  if (nativeUpdateTraffic) {
    game.updateTraffic = function v86UpdateTraffic(dt, ...rest) {
      const now = performance.now();
      if (now < nextTrafficPass) return;
      nextTrafficPass = now + 24;
      return nativeUpdateTraffic(Math.min(Number(dt) || 0, .08), ...rest);
    };
  }
}

function install(game) {
  if (installed || !game?.renderer || !game?.scene) return;
  installed = true;

  // Nunca se vacían game.npcs, trafficCars, scatteredCarData ni crimeWorld.
  game.autoAdjustPerformance = () => {};
  installGroundSafety(game);
  installAdaptiveResolution(game);
  installPopulationBudget(game);

  idle(() => capTextureCost(game.city || game.scene, game.renderer), 1400);
  window.addEventListener('vice-city-revealed', () => idle(() => capTextureCost(game.scene, game.renderer), 1600), { once:true });

  // Limpia únicamente proyectiles/efectos ya terminados, no entidades de juego.
  setInterval(() => {
    if (document.hidden) return;
    try {
      if (Array.isArray(game.bullets) && game.bullets.length > 90) {
        const stale = game.bullets.splice(0, game.bullets.length - 70);
        for (const bullet of stale) bullet?.mesh?.parent?.remove(bullet.mesh);
      }
    } catch {}
  }, 5000);

  window.__VICE_PERFORMANCE_READY__ = true;
  window.__VICE_PERFORMANCE_BOOST__ = {
    nativeNpcSystem: true,
    nativeTrafficSystem: true,
    nativeCrimeWorld: true,
    adaptiveResolution: true,
    textureBudget: true,
    generatedReplacementPopulation: false
  };
  window.dispatchEvent(new CustomEvent('vice-performance-ready'));
}

const wait = setInterval(() => {
  const game = window.__VICE_CITY_GAME__;
  if (!game?.renderer) return;
  clearInterval(wait);
  install(game);
}, 20);
setTimeout(() => clearInterval(wait), 30000);
