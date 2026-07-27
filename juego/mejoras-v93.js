/**
 * GTA MANUCHO V93 — mejoras y correcciones (no elimina ningún contenido).
 * Creado sobre el proyecto de Roberto Manuel Jara Peche (ma-nucho-pro) · ARKEA AI.
 *
 * 1) TRUCO "CORRUPTO": escribe CORRUPTO y la policía deja de buscarte (0 estrellas).
 * 2) TELETRANSPORTE: abre el mapa (TAB), haz clic en un punto y pulsa CTRL+Y.
 * 3) JUGADORES ONLINE EN EL MAPA GRANDE (TAB) con su nombre y color.
 * 4) POSTURA DEL PERSONAJE: al bajar del avión (o cuando quede inclinado) se
 *    endereza y se ajusta al suelo — adiós al bug de caminar a 30 grados.
 * 5) ISLAS SIN PARPADEO: materiales con polygonOffset y sin culling agresivo.
 * 6) ANTI-CONGELONES: precarga en momentos libres los modelos de policía,
 *    tanque, jet, ambulancia y vehículos online, y compila sus shaders.
 * 7) MISIONES VISIBLES: avisos al subir a TAXI / AMBULANCIA / PATRULLA (tecla Y).
 * 8) PARQUE DEL RETIRO: menos NPCs (tope) y 4 caballos montables con [E].
 * 9) AUTOGUARDADO: guarda tu posición y dinero para "CONTINUAR" desde el menú.
 * 10) PAUSA REAL con TAB: bloquea las teclas del juego mientras el mapa está abierto.
 */

import * as THREE from './bosque/libs/three.module.js';
import { clone as cloneSkeleton } from './bosque/bike-runtime/utils/SkeletonUtils.js';

const WORLD_SCALE = 16;
const AUTOSAVE_KEY = 'gta_manucho_v93_autosave';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function idle(task, timeout = 2600) {
  if ('requestIdleCallback' in window) requestIdleCallback(task, { timeout });
  else setTimeout(task, 160);
}
function getGame() { return window.__VICE_CITY_GAME__ || null; }
function isEditable(target) { return target?.matches?.('input, select, textarea, [contenteditable="true"]'); }

let sayTimer = 0;
function say(text, ms = 2800) {
  const game = getGame();
  if (!game) return;
  game.currentMessage = text;
  game.updateHUDState?.();
  clearTimeout(sayTimer);
  sayTimer = setTimeout(() => {
    if (game.currentMessage === text) { game.currentMessage = undefined; game.updateHUDState?.(); }
  }, ms);
}
function tip(text, ms = 4600) {
  const game = getGame();
  if (!game || game.currentMessage) return;
  say(text, ms);
}
function clearKeys() {
  const keys = getGame()?.keys;
  if (!keys) return;
  for (const key of Object.keys(keys)) keys[key] = false;
}

/* ================================================================== */
/* 1) TRUCO "CORRUPTO" — 0 estrellas y policía en paz                  */
/* ================================================================== */

let cheatBuffer = '';
let corruptoOn = false;
let crimeBackup = null;

function applyCorrupto(on, quiet = false) {
  corruptoOn = on;
  const game = getGame();
  const world = game?.crimeWorld;
  if (world) {
    if (on) {
      if (!crimeBackup || crimeBackup.owner !== world) {
        crimeBackup = { owner: world, reportCrime: world.reportCrime, reportGunshot: world.reportGunshot };
        world.reportCrime = function () {};
        world.reportGunshot = function () {};
      }
      world.wantedLevel = 0;
      world.wantedAge = 0;
    } else if (crimeBackup && crimeBackup.owner === world) {
      world.reportCrime = crimeBackup.reportCrime;
      world.reportGunshot = crimeBackup.reportGunshot;
      crimeBackup = null;
    }
    game.updateHUDState?.();
  }
  if (!quiet) say(on
    ? 'TRUCO "CORRUPTO" ACTIVADO · 0 ESTRELLAS · LA POLICÍA NO TE BUSCARÁ'
    : 'TRUCO "CORRUPTO" DESACTIVADO · LA POLICÍA VUELVE A LA NORMALIDAD', 4200);
}

window.addEventListener('keydown', event => {
  if (isEditable(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;
  const key = event.key && event.key.length === 1 ? event.key.toUpperCase() : '';
  if (!key || key < 'A' || key > 'Z') return;
  cheatBuffer = (cheatBuffer + key).slice(-12);
  if (cheatBuffer.endsWith('CORRUPTO')) {
    cheatBuffer = '';
    applyCorrupto(!corruptoOn);
  }
});

setInterval(() => {
  if (!corruptoOn) return;
  const game = getGame();
  const world = game?.crimeWorld;
  if (!world) return;
  if (!crimeBackup || crimeBackup.owner !== world) applyCorrupto(true, true); // el mundo del crimen se recreó
  if ((world.wantedLevel || 0) !== 0) { world.wantedLevel = 0; world.wantedAge = 0; game.updateHUDState?.(); }
}, 400);

/* ================================================================== */
/* 2+3) MAPA GRANDE: teletransporte con CTRL+Y y jugadores online      */
/* ================================================================== */

const MAP_VB = { x: -14000, y: -10000, w: 38000, h: 34000 };
let mapOpen = false;
let mapOverlay = null;
let teleTarget = null; // { x, z } en coordenadas de mundo

function mapSvg() {
  const exact = document.querySelector('svg[viewBox="-14000 -10000 38000 34000"]');
  if (exact) return exact;
  // Reserva: cualquier SVG grande cuyo viewBox coincida con la zona del mapa.
  for (const svg of document.querySelectorAll('svg[viewBox]')) {
    const parts = String(svg.getAttribute('viewBox')).trim().split(/[\s,]+/).map(Number);
    if (parts.length !== 4 || parts.some(n => !Number.isFinite(n))) continue;
    if (Math.abs(parts[2]) < 5000 || Math.abs(parts[3]) < 5000) continue;
    const rect = svg.getBoundingClientRect();
    if (rect.width > 240 && rect.height > 240) return svg;
  }
  return null;
}
function mapTransform() {
  const svg = mapSvg();
  if (!svg) return null;
  const rect = svg.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  let box = MAP_VB;
  const parts = String(svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
  if (parts.length === 4 && parts.every(Number.isFinite) && parts[2] > 0 && parts[3] > 0) {
    box = { x: parts[0], y: parts[1], w: parts[2], h: parts[3] };
  }
  const scale = Math.min(rect.width / box.w, rect.height / box.h);
  const originX = rect.left + (rect.width - box.w * scale) / 2 - box.x * scale;
  const originY = rect.top + (rect.height - box.h * scale) / 2 - box.y * scale;
  return { scale, originX, originY, box };
}
function worldToClient(tr, wx, wz) {
  return { x: tr.originX + (wx / WORLD_SCALE) * tr.scale, y: tr.originY + (wz / WORLD_SCALE) * tr.scale };
}
function clientToWorld(tr, cx, cy) {
  let sx = (cx - tr.originX) / tr.scale;
  let sy = (cy - tr.originY) / tr.scale;
  const box = tr.box || MAP_VB;
  sx = Math.max(box.x, Math.min(box.x + box.w, sx));
  sy = Math.max(box.y, Math.min(box.y + box.h, sy));
  return { x: sx * WORLD_SCALE, z: sy * WORLD_SCALE };
}

function escapeName(value) {
  return String(value || 'JUGADOR').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').slice(0, 16);
}

function buildOverlay() {
  destroyOverlay();
  mapOverlay = document.createElement('div');
  mapOverlay.id = 'gta-v93-map-overlay';
  // V103: el z-index era 60 y el panel del mapa de TAB se dibuja por encima,
  // así que el marcador existía pero quedaba tapado: en el radar se veía y en
  // el tabulador no. Por eso también parecía que CTRL+Y no funcionaba.
  mapOverlay.style.cssText = 'position:fixed;inset:0;z-index:2147483600;pointer-events:none;';
  document.body.appendChild(mapOverlay);
  const loop = () => {
    if (!mapOpen || !mapOverlay) return;
    refreshOverlay();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
function destroyOverlay() {
  mapOverlay?.remove();
  mapOverlay = null;
}
// V103: todas las ubicaciones del juego con su icono. Se leen de los objetos
// que cada módulo ya publica en window, así que aparecen solas según se van
// cargando y no hay que mantener una lista de coordenadas a mano.
function pointOf(source) {
  if (!source) return null;
  const node = source.root || source.group || source.hall || source.house || source;
  if (node?.position && Number.isFinite(node.position.x)) return node.position;
  const area = source.area || source;
  if (Number.isFinite(area?.x) && Number.isFinite(area?.z)) return area;
  if (Number.isFinite(area?.cx) && Number.isFinite(area?.cz)) return { x: area.cx, z: area.cz };
  return null;
}

function collectLocations() {
  const list = [];
  const push = (icon, name, source) => {
    const point = pointOf(source);
    if (point) list.push({ icon, name, x: point.x, z: point.z });
  };
  const w = window;
  push('🏠', 'TU CASA', w.__STARTER_HOUSE__);
  push('💗', 'NOVIA', w.__GIRLFRIEND_HOUSE__);
  push('💜', 'NOVIA 2', w.__SECOND_GIRLFRIEND_HOUSE__);
  push('🕹️', 'ARCADE', w.__ARCADE_HALL__);
  push('🏛️', 'COLISEO', w.__VICE_COLISEUM__ || w.__COLISEUM__);
  push('🏰', 'CASTILLO', w.__CASTLE_WORLD__);
  push('🏜️', 'DESIERTO', w.__DESERT_WORLD__);
  push('⛵', 'PUERTO', w.__BOAT_WORLD_PORTAL__);
  push('🌲', 'BOSQUE', w.__FOREST_PORTAL__ || w.__BOSQUE_PORTAL__);
  try {
    for (const island of (w.__GTA_MANUCHO_ISLANDS__ || [])) {
      list.push({ icon: '🏝️', name: 'ISLA', x: island.x, z: island.z });
    }
  } catch {}
  try {
    for (const raft of (w.__V95_MARINE_EXPANSION__?.rafts || [])) {
      list.push({ icon: '🛶', name: 'BALSA', x: raft.root.position.x, z: raft.root.position.z });
    }
  } catch {}
  try {
    for (const property of (w.__PROPERTY_SYSTEM__?.properties || [])) {
      const point = pointOf(property);
      if (point) list.push({ icon: property.owned ? '🔑' : '🏢', name: property.name || 'PROPIEDAD', x: point.x, z: point.z });
    }
  } catch {}
  return list;
}

function refreshOverlay() {
  if (!mapOverlay) return;
  const tr = mapTransform();
  if (!tr) { mapOverlay.innerHTML = ''; return; }
  let html = '';
  for (const place of collectLocations()) {
    const p = worldToClient(tr, place.x, place.z);
    html += `<div style="position:absolute;left:${p.x}px;top:${p.y}px;transform:translate(-50%,-50%);text-align:center;pointer-events:none;">
      <div style="font-size:19px;line-height:1;filter:drop-shadow(0 1px 2px #000);">${place.icon}</div>
      <div style="margin-top:1px;font:900 9px Arial,sans-serif;color:#e8f4ff;text-shadow:0 0 3px #000,1px 1px 2px #000;letter-spacing:.05em;white-space:nowrap;">${escapeName(place.name)}</div>
    </div>`;
  }
  const online = window.__GTA_ONLINE__;
  const states = online?.getRemoteMapStates?.() || [];
  for (const state of states) {
    if (!state?.position) continue;
    const p = worldToClient(tr, state.position.x, state.position.z);
    const color = /^#[0-9a-fA-F]{3,8}$/.test(String(state.color || '')) ? state.color : '#ff8a00';
    html += `<div style="position:absolute;left:${p.x}px;top:${p.y}px;transform:translate(-50%,-50%);text-align:center;">
      <div style="width:15px;height:15px;border-radius:50%;background:${color};border:2.5px solid #000;box-shadow:0 0 12px ${color};margin:0 auto;"></div>
      <div style="margin-top:2px;font:900 11px Arial,sans-serif;color:#fff;text-shadow:0 0 4px #000,1px 1px 2px #000;letter-spacing:.04em;white-space:nowrap;">${escapeName(state.name)}${state.vehicle ? ' 🚗' : ''}</div>
    </div>`;
  }
  if (online?.connected && states.length === 0) {
    html += '<div style="position:absolute;left:50%;bottom:26px;transform:translateX(-50%);font:800 12px Arial;color:#9fd8ff;text-shadow:0 0 4px #000;">ONLINE · NO HAY OTROS JUGADORES CONECTADOS EN LA SALA</div>';
  }
  if (teleTarget) {
    const p = worldToClient(tr, teleTarget.x, teleTarget.z);
    html += `<div style="position:absolute;left:${p.x}px;top:${p.y}px;transform:translate(-50%,-92%);font-size:28px;filter:drop-shadow(0 2px 3px #000);">📍</div>
      `;
  }
  mapOverlay.innerHTML = html;
}

window.addEventListener('gta-map-toggle', event => {
  // V104: el destino NO se borra al cerrar el mapa. Se elige una vez y ALT
  // funciona esté el mapa abierto o cerrado.
  mapOpen = Boolean(event.detail?.open);
  clearKeys();
  if (mapOpen) buildOverlay();
  else destroyOverlay();
});

// Clic sobre el mapa: fija el destino del teletransporte.
document.addEventListener('click', event => {
  if (!mapOpen) return;
  if (event.target.closest?.('button')) return;
  const tr = mapTransform();
  if (!tr) return;
  const world = clientToWorld(tr, event.clientX, event.clientY);
  teleTarget = world;
  refreshOverlay();
}, true);

// V103: red de seguridad. Con el mapa abierto el juego está en pausa y hay
// varios módulos llamando a stopImmediatePropagation; si alguno se queda con
// el click, el destino se fija igualmente con pointerdown.
document.addEventListener('pointerdown', event => {
  if (!mapOpen) return;
  if (event.target.closest?.('button')) return;
  const tr = mapTransform();
  if (!tr) return;
  teleTarget = clientToWorld(tr, event.clientX, event.clientY);
  refreshOverlay();
}, true);

function forceExitVehicles(game) {
  try { window.__CUSTOM_CAR_SYSTEM__?.exit?.(); } catch {}
  try { window.__AIRCRAFT_SYSTEM__?.exit?.(); } catch {}
  try { window.__POLICE_RESPONSE__?.exitTank?.(); } catch {}
  try {
    if (game.activeRiddenHorse) {
      const horse = game.activeRiddenHorse;
      horse.isRidden = false; horse.state = 'idle'; horse.timer = 2;
      game.activeRiddenHorse = null;
    }
  } catch {}
  try {
    if (game.activeCar) {
      const car = game.activeCar;
      if (car.originalData) {
        car.originalData.active = true;
        car.originalData.x = car.position.x;
        car.originalData.y = car.position.y;
        car.originalData.z = car.position.z;
        car.originalData.rotation = car.rotation.y;
        game.city?.remove?.(car);
      }
      game.activeCar = null;
    }
  } catch {}
  try {
    if (game.activeBoat) {
      const entry = game.activeBoat.userData?.v81BoatEntry;
      if (entry) entry.speed = 0;
      game.activeBoat = null;
    }
  } catch {}
  game.updateHUDState?.();
}

function doTeleport() {
  const game = getGame();
  if (!game?.playerContainer) return;
  if (!teleTarget) {
    return;
  }
  const wasOpen = mapOpen;
  forceExitVehicles(game);
  const { x, z } = teleTarget;
  let y = NaN;
  try { y = game.getGroundY(x, 15000, z, false); } catch {}
  if (!Number.isFinite(y) || y < -40) {
    const waterLevel = Number(window.__V84_MARINE_WORLD__?.waterLevel);
    y = (Number.isFinite(waterLevel) ? waterLevel : 0) + 6;
  }
  game.playerContainer.position.set(x, y + 8, z);
  if (game.state) {
    game.state.vy = 0;
    game.state.onGround = false;
    game.state.inWater = false;
    game.state.isSubmerged = false;
  }
  try { game.lastSafePlayerPosition?.copy?.(game.playerContainer.position); game.lastSafeGroundY = y; } catch {}
  if (wasOpen) {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Tab', key: 'Tab', bubbles: true }));
  }
  say('✨ TELETRANSPORTADO ✨', 2400);
}

// V105: teletransporte eliminado a petición del usuario. Ni ALT ni CTRL+Y.
// El clic en el mapa sigue poniendo el destino en el radar, que es lo útil.

/* ================================================================== */
/* 10) PAUSA REAL: mientras el mapa está abierto, bloquea las teclas   */
/* ================================================================== */

window.addEventListener('keydown', event => {
  if (!window.__GTA_PAUSED__) return;
  if (event.code === 'Tab') return;                                   // cerrar el mapa
  if (event.code === 'KeyY' && (event.ctrlKey || event.metaKey)) return; // teletransporte
  if (event.code === 'AltLeft' || event.code === 'AltRight') return;     // teletransporte
  event.stopImmediatePropagation();
}, true);
window.addEventListener('mousedown', event => {
  if (window.__GTA_PAUSED__) event.stopImmediatePropagation();
}, true);

/* ================================================================== */
/* 4) POSTURA: bajar del avión sin inclinarse ni hundirse en el suelo  */
/* ================================================================== */

function snapToGround(game, force) {
  if (!game?.playerContainer || !game.state) return;
  const p = game.playerContainer.position;
  let ground = NaN;
  try { ground = game.getGroundY(p.x, p.y + 40, p.z, true); } catch {}
  if (!Number.isFinite(ground)) return;
  if (force ? p.y < ground + 1 : p.y < ground - 1) {
    p.y = ground;
    game.state.vy = 0;
    game.state.onGround = true;
  }
}

function hookAircraftExit() {
  const system = window.__AIRCRAFT_SYSTEM__;
  if (!system || system.__v93ExitHook || typeof system.exit !== 'function') return;
  system.__v93ExitHook = true;
  const original = system.exit;
  system.exit = function v93AircraftExit(...args) {
    const result = original.apply(this, args);
    const game = getGame();
    try {
      if (game?.playerModel) { game.playerModel.rotation.x = 0; game.playerModel.rotation.z = 0; }
      if (game?.playerContainer) { game.playerContainer.rotation.x = 0; game.playerContainer.rotation.z = 0; }
      snapToGround(game, true);
    } catch {}
    return result;
  };
}

setInterval(() => {
  const game = getGame();
  if (!game?.playerModel || !game.coreWorldReady || window.__GTA_PAUSED__) return;
  hookAircraftExit();
  const busy = game.activeCar || game.activeBoat || game.activeRiddenHorse ||
    window.__AIRCRAFT_SYSTEM__?.active || window.__POLICE_RESPONSE__?.activeTank || game.state?.inWater;
  if (busy) return;
  const model = game.playerModel;
  // El núcleo solo endereza el eje X; el eje Z (balanceo lateral) quedaba
  // inclinado para siempre tras algunos vehículos. Aquí se corrige suavemente.
  if (Math.abs(model.rotation.z) > 0.02) model.rotation.z *= 0.55;
  else if (model.rotation.z !== 0) model.rotation.z = 0;
  if (Math.abs(model.rotation.x) > 1.25 && game.state?.onGround) model.rotation.x *= 0.55;
  const container = game.playerContainer;
  if (container && (container.rotation.x !== 0 || container.rotation.z !== 0)) {
    container.rotation.x = 0;
    container.rotation.z = 0;
  }
  if (game.state && !game.state.isFlying) snapToGround(game, false);
}, 150);

/* ================================================================== */
/* 5) ISLAS SIN PARPADEO (z-fighting) y siempre visibles               */
/* ================================================================== */

let islandsFixed = false;
function fixIslands() {
  if (islandsFixed) return;
  const game = getGame();
  const marine = window.__V84_MARINE_WORLD__ || window.__V81_MARINE_WORLD__;
  if (!game?.scene || !marine?.marineGroup) return;
  islandsFixed = true;
  const seen = new Set();
  const tune = (object, factor) => {
    object.traverse?.(child => {
      if (!child.isMesh || seen.has(child)) return;
      seen.add(child);
      child.frustumCulled = false;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        if (!material) continue;
        material.polygonOffset = true;
        material.polygonOffsetFactor = factor;
        material.polygonOffsetUnits = factor;
        if (material.transparent && (material.opacity === undefined || material.opacity >= 0.98)) {
          material.transparent = false;
        }
        material.depthWrite = true;
        material.needsUpdate = true;
      }
    });
  };
  // Los modelos GLB de isla se dibujan por delante (factor negativo) y se
  // elevan un poco; los cilindros procedurales se empujan hacia atrás.
  const glbRoots = [];
  game.scene.traverse(object => { if (/^ISLA_ADJUNTA_/.test(object.name || '')) glbRoots.push(object); });
  for (const root of glbRoots) {
    // V105: se quita el "+= 4". Movía la isla 4 unidades DESPUÉS de haber
    // calculado su campo de alturas, así que el suelo dejaba de coincidir con
    // lo que se ve. El parpadeo se corrige sólo con polygonOffset.
    root.updateMatrixWorld(true);
    tune(root, -2);
  }
  tune(marine.marineGroup, 2);
  marine.marineGroup._isAlwaysVisible = true;
  idle(() => { try { game.renderer?.compileAsync?.(game.scene, game.camera).catch(() => {}); } catch {} });
  console.info('[mejoras-v93] Islas ajustadas contra el parpadeo (z-fighting).');
}
window.addEventListener('gta-manucho-marine-ready', () => setTimeout(fixIslands, 800), { once: true });

/* ================================================================== */
/* 6) PRECARGA ANTI-CONGELONES (policía, tanque, jet, servicios)       */
/* ================================================================== */

async function waitCalm(game, tries = 120) {
  for (let i = 0; i < tries; i++) {
    const calm = performance.now() - (game.lastPlayerMotionAt || 0) > 2200 &&
      !game.activeCar && !game.activeBoat && !window.__AIRCRAFT_SYSTEM__?.active;
    if (calm) return;
    await sleep(500);
  }
}

async function prewarmHeavyAssets(game) {
  const jobs = [
    ['modelo de policía', () => {
      const world = game.crimeWorld;
      if (world && !world.policeModelRequested && typeof world.loadPoliceModel === 'function') {
        world.policeModelRequested = true;
        world.loadPoliceModel();
      }
    }],
    ['jet policial', () => fetch('./aircraft-assets/jet_sf1.glb').catch(() => {})],
    ['ambulancia', () => fetch('./service-assets/ambulance.glb').catch(() => {})],
    ['coche de bandas', () => fetch('./service-assets/police-gang-car.gltf').catch(() => {})],
    ['helicóptero', () => fetch('./aircraft-assets/helicopter_u1h.glb').catch(() => {})],
    ['avión FM2', () => fetch('./aircraft-assets/plane_fm2.glb').catch(() => {})],
    ['aeronave MD5', () => fetch('./aircraft-assets/fly_md5.glb').catch(() => {})],
    ['ferrari online', () => fetch('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/ferrari.glb').catch(() => {})]
  ];
  for (const [label, job] of jobs) {
    await waitCalm(game);
    await new Promise(resolve => idle(() => {
      try { job(); } catch {}
      resolve();
    }, 5000));
    await sleep(2200);
  }
  idle(() => { try { game.renderer?.compileAsync?.(game.scene, game.camera).catch(() => {}); } catch {} }, 5000);
  console.info('[mejoras-v93] Recursos pesados precargados en segundo plano.');
}

/* ================================================================== */
/* 7) MISIONES DE TAXI / AMBULANCIA visibles al subir (tecla Y)        */
/* ================================================================== */

let lastMissionVehicle = null;
setInterval(() => {
  const car = window.__CUSTOM_CAR_SYSTEM__?.active || null;
  if (car === lastMissionVehicle) return;
  lastMissionVehicle = car;
  if (!car?.root) return;
  const root = car.root;
  const entry = car.serviceEntry || root.userData?.serviceVehicleEntry || root.userData?.serviceEntry;
  setTimeout(() => {
    if (window.__CUSTOM_CAR_SYSTEM__?.active !== car) return;
    if (root.userData?.taxi || car.isTaxi) say('🚕 TAXI · PULSA [Y] PARA RECOGER PASAJEROS Y GANAR DINERO', 5200);
    else if (entry?.kind === 'ambulance') say('🚑 AMBULANCIA · PULSA [Y] PARA LA MISIÓN DE PARAMÉDICO', 5200);
    else if (entry?.kind === 'police') say('🚓 PATRULLA · PULSA [Y] PARA LA MISIÓN POLICIAL', 5200);
  }, 1200);
}, 500);

/* ================================================================== */
/* 8) PARQUE DEL RETIRO: tope de NPCs y caballos montables             */
/* ================================================================== */

const PARK = {
  xMin: 1600 * WORLD_SCALE, xMax: 1900 * WORLD_SCALE,
  zMin: 20 * WORLD_SCALE, zMax: 400 * WORLD_SCALE
};
function inPark(position) {
  return position.x >= PARK.xMin && position.x <= PARK.xMax &&
    position.z >= PARK.zMin && position.z <= PARK.zMax;
}

setInterval(() => {
  const game = getGame();
  if (!game?.npcs || !game.coreWorldReady || window.__GTA_PAUSED__) return;
  let kept = 0;
  for (const npc of game.npcs) {
    if (!npc?.mesh || npc.type === 'horse' || npc.type === 'disco_dancer' || npc.state === 'dead' || npc.isRidden) continue;
    if (!inPark(npc.mesh.position)) continue;
    kept++;
    if (kept <= 5) continue; // V94: menos NPCs en el Retiro (antes 8)
    try {
      const spot = game.getRandomLandPosition();
      if (spot && !inPark(spot)) {
        npc.mesh.position.copy(spot);
        npc._lastGroundY = spot.y;
        npc.target?.copy?.(spot);
        npc.state = 'idle';
        npc.timer = 2 + Math.random() * 4;
      }
    } catch {}
  }
  let cityKept = 0;
  for (const actor of (window.__CITY_NPCS__ || [])) {
    const root = actor?.root;
    if (!root?.position || actor.passenger) continue;
    if (!inPark(root.position)) continue;
    cityKept++;
    if (cityKept <= 4) continue; // V94: menos peatones urbanos en el Retiro (antes 6)
    root.position.x = PARK.xMin - (400 + Math.random() * 2200);
    root.position.z = PARK.zMin + Math.random() * (PARK.zMax - PARK.zMin);
    try {
      const y = game.getGroundY(root.position.x, root.position.y + 200, root.position.z, false);
      root.position.y = Number.isFinite(y) && y > -20 ? y : 8;
    } catch { root.position.y = 8; }
    actor.target?.set?.(root.position.x, root.position.y, root.position.z);
  }
}, 4000);

async function spawnParkHorses(game) {
  for (let i = 0; i < 300; i++) {
    if (game.npcModelsData?.some(d => d.type === 'horse') && game.npcs?.length) break;
    await sleep(500);
  }
  const data = game.npcModelsData?.find(d => d.type === 'horse');
  if (!data?.scene || !data.animations?.length) return;
  // V94: 2 caballos en vez de 4 — cada caballo animado cuesta GPU (skinning)
  // y el parque iba lento. Dos montables bien colocados bastan.
  const spots = [[1612, 150], [1838, 318]];
  let created = 0;
  for (const [rx, rz] of spots) {
    let visual = null;
    try { visual = cloneSkeleton(data.scene); } catch { try { visual = data.scene.clone(true); } catch {} }
    if (!visual) continue;
    visual.scale.setScalar(0.2);
    visual.traverse(child => { if (child !== visual && child.parent === visual) child.rotation.y = Math.PI; });
    const x = rx * WORLD_SCALE;
    const z = rz * WORLD_SCALE;
    let y = 8;
    try {
      const ground = game.getGroundY(x, 300, z, false);
      if (Number.isFinite(ground) && ground > -20) y = ground;
    } catch {}
    visual.position.set(x, y, z);
    visual.rotation.y = Math.random() * Math.PI * 2;
    game.scene.add(visual);
    const mixer = new THREE.AnimationMixer(visual);
    const idleClip = data.animations[0].clone(); idleClip.name = `RetiroHorseIdle${created}`;
    const walkClip = data.animations[0].clone(); walkClip.name = `RetiroHorseWalk${created}`;
    const Idle = mixer.clipAction(idleClip); Idle.timeScale = 0.05;
    const Walk = mixer.clipAction(walkClip); Walk.timeScale = -1;
    Idle.play();
    game.npcs.push({
      mesh: visual, mixer, actions: { Idle, Walk },
      speed: (2 + Math.random() * 2) * WORLD_SCALE,
      target: new THREE.Vector3(x, y, z),
      state: 'idle', timer: Math.random() * 3, health: 40,
      type: 'horse', rideable: true, isRidden: false, retiroHorse: true // V94: marcado para que el limpiador de caballos del parque no lo toque
    });
    created++;
  }
  if (created > 0) console.info(`[mejoras-v93] ${created} caballos añadidos al Parque del Retiro.`);
}

/* ================================================================== */
/* 9) AUTOGUARDADO para "CONTINUAR PARTIDA" desde el menú principal    */
/* ================================================================== */

function autosave() {
  const game = getGame();
  if (!game?.playerContainer || !game.coreWorldReady) return;
  if (window.__VICE_ZONE_TRANSITION__ && !window.__GTA_PAUSED__) return;
  const p = game.playerContainer.position;
  if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z) || p.y < -3000) return;
  const save = {
    savedAt: Date.now(),
    player: {
      x: p.x, y: p.y, z: p.z,
      yaw: Number(game.playerContainer.rotation.y || 0),
      health: Math.max(1, Number(game.health || 100)),
      armor: Math.max(0, Number(game.armor || 0)),
      money: Math.max(0, Number(game.money || 0))
    },
    runtime: {
      activeWeapon: window.__WEAPON_CRATES__?.selectedWeapon || game.activeWeapon || 'fist',
      wantedLevel: Math.max(0, Math.min(5, Number(game.crimeWorld?.wantedLevel || 0)))
    }
  };
  try { localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(save)); } catch {}
}
setInterval(autosave, 20000);
window.addEventListener('pagehide', autosave);
document.addEventListener('visibilitychange', () => { if (document.hidden) autosave(); });

/* ================================================================== */
/* Arranque                                                            */
/* ================================================================== */

async function start() {
  let game = null;
  for (let i = 0; i < 600; i++) {
    game = getGame();
    if (game?.renderer && game.coreWorldReady) break;
    await sleep(200);
  }
  game = getGame();
  if (!game) return;
  hookAircraftExit();
  setTimeout(fixIslands, 4000);
  setInterval(() => { if (!islandsFixed && window.__GTA_MARINE_READY__) fixIslands(); }, 3000);
  spawnParkHorses(game).catch(() => {});
  setTimeout(() => prewarmHeavyAssets(getGame() || game).catch(() => {}), 12000);
  setTimeout(() => tip('🚕🚑 NUEVO: MISIONES DE TAXI Y AMBULANCIA · SUBE AL VEHÍCULO Y PULSA [Y]', 5600), 26000);
  setTimeout(() => tip('🐴 TODOS LOS CABALLOS SON MONTABLES CON [E] · HAY CABALLOS EN EL RETIRO', 5600), 45000);
  setTimeout(() => tip('🗺️ TAB PAUSA EL JUEGO · CLIC EN EL MAPA + CTRL+Y = TELETRANSPORTE · TRUCO: CORRUPTO', 6200), 64000);
  console.info('[mejoras-v93] Módulo V93 activo.');
}

start().catch(error => console.warn('[mejoras-v93] Arranque incompleto.', error));
