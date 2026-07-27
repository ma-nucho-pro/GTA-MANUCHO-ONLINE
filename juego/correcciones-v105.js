/**
 * GTA MANUCHO V105 — CORRECCIONES DE JUEGO
 * Autor e integración: Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * Marca: ARKEA AI / Manucho. Uso permitido conforme a LICENSE; conserva los créditos.
 *
 * Este módulo se instala EL ÚLTIMO y manda sobre lo demás a propósito. Varias
 * de las correcciones anteriores no se veían porque otro sistema volvía a tocar
 * la cámara o la posición después. Aquí se aplica al final del fotograma, justo
 * antes de dibujar, así que es la última palabra.
 *
 *   1. Cámara de moto 2 y cámara de balsa: zoom de verdad, pegadas al personaje.
 *   2. Las islas son duras: no se atraviesan ni nadando ni por debajo.
 *   3. Los vehículos se hunden en el mar, chocan con los edificios y atropellan.
 *   4. Los coches de NPC dejan de circular sobre el agua.
 *   5. Fuera todos los carteles y avisos.
 *   6. Fuera el teletransporte.
 */
import * as THREE from './bosque/libs/three.module.js';

const WORLD_SCALE = 16;
const WATER_LEVEL = -14 * WORLD_SCALE;

let game = null;
let installed = false;

const camPos = new THREE.Vector3();
const smoothPos = new THREE.Vector3();
let smoothReady = false;
const camLook = new THREE.Vector3();
const tmp = new THREE.Vector3();
const Y_AXIS = new THREE.Vector3(0, 1, 0);

/* ====================================================================== */
/* 1) CÁMARAS: ZOOM DE VERDAD                                             */
/* ====================================================================== */
/* La cámara 2 de la moto seguía viéndose lejos por más que se bajaran los
   números en free-roam: algún otro sistema la recolocaba después. Aquí se
   aplica al final, dentro del envoltorio de render más externo, que se
   reinstala cada pocos segundos para no perder el turno. */

function bikeEntry() {
  const api = window.__V100_BIKE_API__;
  return api?.activeBike || null;
}

function raftEntry() {
  return game?.activeBoat?.userData?.v95RaftEntry || null;
}

function applyCloseCamera(camera) {
  const bike = bikeEntry();
  const raft = raftEntry();
  if (!bike && !raft) { smoothReady = false; return false; }

  if (bike) {
    // Modo 1 = "cerca". Los otros dos modos se dejan como están.
    const mode = Number(bike.cameraMode) || 0;
    if (mode !== 1) return false;
    const root = bike.root;
    if (!root) return false;
    const baseY = Number.isFinite(bike.cameraStableY) ? bike.cameraStableY : root.position.y;
    // 74 unidades por detrás = poco más de cuatro metros y medio. El personaje
    // llena buena parte de la pantalla, que es lo que se pedía.
    camPos.set(8, 40, 74).applyAxisAngle(Y_AXIS, root.rotation.y);
    camPos.add(tmp.set(root.position.x, baseY, root.position.z));
    camLook.set(0, (Number(bike.seatHeight) || 20) + 14, -14).applyAxisAngle(Y_AXIS, root.rotation.y);
    camLook.add(tmp.set(root.position.x, baseY, root.position.z));
    if (Math.abs(camera.fov - 55) > 0.01) { camera.fov = 55; camera.updateProjectionMatrix(); }
    if (!smoothReady) { smoothPos.copy(camPos); smoothReady = true; }
    else smoothPos.lerp(camPos, 0.5);
    camera.position.copy(smoothPos);
    camera.lookAt(camLook);
    camera.updateMatrixWorld(true);
    return true;
  }

  if (raft) {
    // La balsa se veía desde lejísimos porque usaba la cámara genérica de
    // barco, pensada para el barco grande. Una balsa de 5 m necesita otra cosa.
    const root = raft.root;
    if (!root) return false;
    camPos.set(0, 62, 118).applyAxisAngle(Y_AXIS, root.rotation.y);
    camPos.add(tmp.set(root.position.x, root.position.y, root.position.z));
    camLook.set(0, 12, -30).applyAxisAngle(Y_AXIS, root.rotation.y);
    camLook.add(tmp.set(root.position.x, root.position.y, root.position.z));
    if (Math.abs(camera.fov - 58) > 0.01) { camera.fov = 58; camera.updateProjectionMatrix(); }
    if (!smoothReady) { smoothPos.copy(camPos); smoothReady = true; }
    else smoothPos.lerp(camPos, 0.45);
    camera.position.copy(smoothPos);
    camera.lookAt(camLook);
    camera.updateMatrixWorld(true);
    return true;
  }
  return false;
}

/* AQUÍ ESTABA EL VERDADERO PROBLEMA DE LA CÁMARA 2
   Envolver renderer.render no sirve para tener la última palabra. La cadena de
   envoltorios se ejecuta de fuera hacia dentro: el último que envuelve es el
   PRIMERO en ejecutarse, y el de free-roam, que está más adentro, recolocaba la
   cámara justo después. Por eso daba igual qué números pusiera.

   La solución es scene.onBeforeRender. Three.js lo llama dentro de render(),
   después de actualizar las matrices de la cámara pero ANTES de calcular la
   matriz de proyección con la que dibuja. Es decir: después de TODOS los
   envoltorios y aún a tiempo. Recalculando a mano la matriz de la cámara, esa
   posición es la que se usa de verdad. Es el último punto posible. */
function hookScene() {
  const scene = game?.scene;
  if (!scene || scene.__v105Hooked) return;
  scene.__v105Hooked = true;
  const previous = typeof scene.onBeforeRender === 'function' ? scene.onBeforeRender.bind(scene) : null;
  scene.onBeforeRender = function v105BeforeRender(renderer, sceneArg, camera, target) {
    try { previous?.(renderer, sceneArg, camera, target); } catch {}
    try { resolveIslandPenetration(); } catch {}
    try {
      if (applyCloseCamera(camera)) {
        // Obligatorio: sin esto la matriz de proyección usaría la posición vieja.
        camera.updateMatrixWorld(true);
        camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
      }
    } catch {}
  };
  console.log('[correcciones-v105] Cámara enganchada en scene.onBeforeRender: última palabra garantizada.');
}

/* ====================================================================== */
/* 2) LAS ISLAS SON DURAS                                                 */
/* ====================================================================== */
/* Un simple tope de altura no bastaba: en un talud inclinado se puede entrar
   de lado y quedarse DENTRO de la arena, que es lo que pasaba al nadar. Aquí
   además de subir al personaje sobre el terreno, si sigue metido se le empuja
   hacia fuera siguiendo la pendiente, que es la dirección en la que la isla
   baja. Se aplica siempre: nadando, andando y en vehículo. */

function seabedAt(x, z) {
  const fn = window.__GTA_ISLAND_GROUND_RAW__;
  if (typeof fn !== 'function') return -Infinity;
  const value = fn(x, z);
  return Number.isFinite(value) ? value : -Infinity;
}

function pushOutOfIsland(position, clearance) {
  const here = seabedAt(position.x, position.z);
  if (!Number.isFinite(here)) return false;

  const floor = here + clearance;
  if (position.y >= floor) return false;

  // 1. Lo normal: subir por encima del terreno.
  position.y = floor;

  // 2. Si el terreno de alrededor es mucho más alto, estamos metidos de lado
  //    en el talud. Se busca la pendiente y se empuja cuesta abajo.
  const step = 34;
  const east = seabedAt(position.x + step, position.z);
  const west = seabedAt(position.x - step, position.z);
  const south = seabedAt(position.x, position.z + step);
  const north = seabedAt(position.x, position.z - step);
  if (!Number.isFinite(east) || !Number.isFinite(west) ||
      !Number.isFinite(south) || !Number.isFinite(north)) return true;

  const gradX = east - west;
  const gradZ = south - north;
  const slope = Math.hypot(gradX, gradZ);
  if (slope > step * 1.1) {
    // Pendiente de más de 45 grados: pared, no playa. Se sale cuesta abajo.
    position.x -= (gradX / slope) * 26;
    position.z -= (gradZ / slope) * 26;
  }
  return true;
}

function resolveIslandPenetration() {
  const container = game?.playerContainer;
  if (!container) return;
  if (game.activeCar || game.activeRiddenHorse || window.__ACTIVE_AIRCRAFT__) return;
  pushOutOfIsland(container.position, 1.1 * WORLD_SCALE);
}

/* ====================================================================== */
/* 3) LOS VEHÍCULOS SE HUNDEN EN EL MAR Y NO ATRAVIESAN EDIFICIOS         */
/* ====================================================================== */

function groundUnder(x, z, y) {
  try {
    const value = game.getGroundY(x, y + 60, z, false);
    return Number.isFinite(value) ? value : -Infinity;
  } catch { return -Infinity; }
}

// ¿Está esto sobre mar abierto? Sobre el agua no hay suelo por encima del nivel
// del mar, salvo en las islas, el puente y los barcos, que sí lo tienen.
function overOpenWater(x, z, y) {
  const ground = groundUnder(x, z, y);
  return !Number.isFinite(ground) || ground < WATER_LEVEL - 1;
}

let sinking = null;

function sinkVehicleIfOverWater() {
  const bike = bikeEntry();
  const root = bike?.root || (game.activeCar && !game.activeCar.userData?.v95RaftEntry ? game.activeCar : null);
  if (!root || game.activeBoat) { sinking = null; return; }

  if (!overOpenWater(root.position.x, root.position.z, root.position.y)) { sinking = null; return; }

  // Se hunde: baja, se apaga y el jugador acaba nadando.
  if (!sinking) {
    sinking = { root, since: performance.now() };
    if (bike) bike.speed = 0;
  }
  root.position.y -= 2.6;
  root.rotation.z += 0.012;
  if (root.position.y < WATER_LEVEL - 3 * WORLD_SCALE) {
    const api = window.__V100_BIKE_API__;
    try { if (bike) api?.exitBike?.(); else window.__CUSTOM_CAR_SYSTEM__?.exit?.(); } catch {}
    if (game.playerContainer) {
      game.playerContainer.position.y = WATER_LEVEL + 3 * WORLD_SCALE;
    }
    if (game.state) { game.state.inWater = true; game.state.onGround = false; game.state.vy = 0; }
    sinking = null;
  }
}

// Los edificios ya están en el obstacleGrid del juego. Un vehículo que entra
// dentro de una caja se devuelve al borde: así deja de atravesar paredes.
const lastGood = new THREE.Vector3();
let lastGoodValid = false;

function blockVehicleThroughBuildings() {
  const bike = bikeEntry();
  const root = bike?.root;
  if (!root) { lastGoodValid = false; return; }
  let inside = false;
  try {
    inside = Boolean(game.isPointInsideObstacle?.(root.position.x, root.position.y + 18, root.position.z));
  } catch { inside = false; }

  if (!inside) {
    lastGood.copy(root.position);
    lastGoodValid = true;
    return;
  }
  if (lastGoodValid) {
    root.position.copy(lastGood);
    if (bike) bike.speed *= -0.25;   // rebote seco, como chocar de verdad
  }
}

// Atropellar. Si el vehículo pasa por encima de alguien, se lo lleva por delante.
function runOverPedestrians() {
  const bike = bikeEntry();
  const root = bike?.root || game.activeCar;
  if (!root) return;
  const speed = Math.abs(Number(bike?.speed) || Number(game.activeCar?.userData?.speed) || 0);
  if (speed < 42) return;

  const life = window.__CITY_LIFE_SYSTEM__;
  const groups = [life?.gangs, life?.ambientPolice, window.__V81_BACKGROUND_POPULATION__?.people, life?.pedestrians];
  const radiusSq = 46 * 46;

  for (const group of groups) {
    if (!Array.isArray(group)) continue;
    for (const entity of group) {
      const target = entity?.root;
      if (!target || entity.dead || target.userData.__v105Hit) continue;
      if (Math.abs(target.position.y - root.position.y) > 90) continue;
      const dx = target.position.x - root.position.x;
      const dz = target.position.z - root.position.z;
      if (dx * dx + dz * dz > radiusSq) continue;

      target.userData.__v105Hit = true;
      entity.health = 0;
      entity.dead = true;
      if (entity.state !== undefined) entity.state = 'dead';
      // Se lo lleva por delante en la dirección de la marcha.
      target.rotation.z = Math.PI / 2.2;
      target.position.y = Math.max(target.position.y - 6, target.position.y - 6);
      setTimeout(() => { try { target.visible = false; } catch {} }, 3800);
    }
  }
}

/* ====================================================================== */
/* 4) LOS COCHES DE NPC NO CIRCULAN SOBRE EL AGUA                         */
/* ====================================================================== */
/* El tráfico se genera sin comprobar si el punto cae en el mar. Se repasa por
   tandas, sin coste apreciable, y el que está sobre agua abierta se retira. */

let trafficCursor = 0;

function clearTrafficOnWater() {
  const pools = [
    game.traffic, game.trafficCars, game.cars,
    window.__CITY_LIFE_SYSTEM__?.serviceVehicles,
    window.__CUSTOM_CAR_SYSTEM__?.cars
  ];
  for (const pool of pools) {
    if (!Array.isArray(pool) || !pool.length) continue;
    // 12 por fotograma: en unos segundos se repasa la flota entera.
    for (let n = 0; n < 12; n++) {
      trafficCursor = (trafficCursor + 1) % pool.length;
      const item = pool[trafficCursor];
      const root = item?.root || item?.mesh || (item?.isObject3D ? item : null);
      if (!root || root === game.activeCar) continue;
      if (root.position.y < WATER_LEVEL - 400) continue;   // ya está hundido
      if (!overOpenWater(root.position.x, root.position.z, root.position.y)) continue;
      root.visible = false;
      if (item.speed !== undefined) item.speed = 0;
      if (item.active !== undefined) item.active = false;
      // Se aparta bien abajo para que el sistema lo recicle en tierra.
      root.position.y = WATER_LEVEL - 5000;
    }
  }
}

/* ====================================================================== */
/* 5) FUERA LOS CARTELES Y AVISOS                                         */
/* ====================================================================== */
/* Se ocultan por CSS, que es reversible y no rompe a quien los escribe: los
   módulos siguen llamando a sus notice() y simplemente no se ve nada. La barra
   pequeña de abajo con las teclas del vehículo SÍ se conserva: es información
   útil, no un cartel. */
function hideNotices() {
  if (document.getElementById('gta-v105-sin-carteles')) return;
  const style = document.createElement('style');
  style.id = 'gta-v105-sin-carteles';
  // V113: EXCEPCIÓN para las misiones. Ocultar todos los carteles dejó mudas
  // las misiones de taxi, policía y ambulancia: hablan por #v71-notice y
  // enseñan el objetivo en #v71-mission. Sin eso no sabes a dónde ir ni si has
  // recogido al pasajero. No son carteles ambientales: sólo aparecen cuando hay
  // una misión en marcha, así que se quedan.
  //
  // Importante: NO se fuerza display:block, porque esos paneles se muestran y
  // se esconden desde el propio juego. Forzarlo los dejaría fijos en pantalla
  // aunque estuvieran vacíos. Lo correcto es sacarlos de la regla que oculta.
  style.textContent = `
    #gta-v93-say, #gta-online-notice, #v95-free-roam-notice, #custom-car-notice,
    #aircraft-notice-v49, #tank-notice-v58, #weapon-crate-notice,
    #girlfriend-stat-notice, #property-system-notice, #vice-menu-toast,
    #gta-v104-toast, #gta-manucho-easter-egg,
    [id$="-notice"]:not(#v71-notice),
    [id$="-toast"],
    [id*="notice-"],
    [class*="game-banner"] {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
  `;
  document.head.appendChild(style);

  // El cartel grande (el rosa de "TELETRANSPORTE...", "MOTO ROBADA...", etc.)
  // no es un elemento propio: los módulos escriben en game.currentMessage y el
  // HUD del motor lo pinta. Se convierte en una propiedad que se traga lo que
  // le echen, así que quien lo llame sigue funcionando y no se ve nada.
  try {
    Object.defineProperty(game, 'currentMessage', {
      get() { return ''; },
      set() { /* carteles desactivados */ },
      configurable: true
    });
  } catch (error) {
    console.warn('[correcciones-v105] No se pudo silenciar el cartel del HUD.', error);
  }
  console.log('[correcciones-v105] Carteles y avisos ocultos.');
}

/* ====================================================================== */
/* 6) FUERA EL TELETRANSPORTE                                             */
/* ====================================================================== */
function killTeleport() {
  // Se traga ALT y CTRL+Y antes de que lleguen a nadie.
  window.addEventListener('keydown', event => {
    const isAlt = event.code === 'AltLeft' || event.code === 'AltRight';
    const isCtrlY = event.code === 'KeyY' && (event.ctrlKey || event.metaKey);
    if (isAlt || isCtrlY) event.stopImmediatePropagation();
  }, true);
}

/* ====================================================================== */
/* BUCLE                                                                  */
/* ====================================================================== */
let repatchAt = 0;

let workTick = 0;

function frame() {
  requestAnimationFrame(frame);
  if (!game || document.hidden) return;
  // V110: hundimiento, choques, atropellos y barrido de tráfico se comprueban
  // cada tres fotogramas. La cámara y las islas NO pasan por aquí: siguen yendo
  // en scene.onBeforeRender, cada fotograma, porque ahí sí se notaría.
  if ((workTick = (workTick + 1) % 3) !== 0) return;

  const now = performance.now();
  if (now > repatchAt) { repatchAt = now + 3000; hookScene(); }

  try { sinkVehicleIfOverWater(); } catch {}
  try { blockVehicleThroughBuildings(); } catch {}
  try { runOverPedestrians(); } catch {}
  try { clearTrafficOnWater(); } catch {}
}

function install() {
  if (installed || !game?.renderer) return;
  installed = true;
  hideNotices();
  killTeleport();
  hookScene();
  requestAnimationFrame(frame);
  window.__V105_FIXES__ = { pushOutOfIsland, overOpenWater, seabedAt };
  console.log('[correcciones-v105] Activo: cámaras cercanas, islas duras, vehículos con física y sin carteles.');
}

const wait = setInterval(() => {
  game = window.__VICE_CITY_GAME__ || game;
  if (!game?.renderer || !game?.playerContainer) return;
  clearInterval(wait);
  install();
}, 100);
setTimeout(() => clearInterval(wait), 60000);
