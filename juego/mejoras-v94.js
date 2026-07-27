/**
 * GTA MANUCHO V94 — mejoras y correcciones (no elimina ningún contenido).
 * Creado sobre el proyecto de Roberto Manuel Jara Peche (ma-nucho-pro) · ARKEA AI.
 *
 * 1) EL PERSONAJE YA NO CAMINA SOLO: un vigilante compara las teclas que el
 *    juego cree pulsadas con las teclas físicamente pulsadas y limpia las que
 *    se quedaron "pegadas" (al cambiar de ventana, abrir el mapa, etc.).
 * 2) PUNTO DE DESTINO 📍: clic en el mapa (TAB) marca un destino que se ve en
 *    el mapa grande Y en el radar (parpadea en magenta, estilo GTA). CTRL+Y
 *    sigue siendo el viaje rápido. Al llegar, el punto se borra solo.
 *    Clic encima del punto = borrarlo.
 * 3) AMIGOS ONLINE EN EL RADAR y en el mapa grande, con su color y nombre.
 *    Si están lejos, su punto se pega al borde del radar para saber hacia
 *    dónde ir (como en GTA).
 * 4) CÁMARA DE NADO EN MAR ABIERTO: si el juego pone la vista de dron desde
 *    el cielo, la cámara baja detrás del personaje, como en el Retiro.
 * 5) BAJAR DEL AVIÓN DE PIE: vigilancia de postura durante 3 segundos tras
 *    salir de cualquier aeronave (adiós al bug de quedar acostado).
 * 6) TRUCOS NUEVOS: escribe INFINITY (munición infinita, se puede apagar
 *    escribiéndolo otra vez) y FULLGLOCK (todas las armas + AK equipada).
 * 7) PARQUE DEL RETIRO MÁS FLUIDO: los caballos errantes que se amontonan en
 *    el parque se reparten por la ciudad (los 2 montables del Retiro se quedan).
 */

const WORLD_SCALE = 16;
const MAP_VB = { x: -14000, y: -10000, w: 38000, h: 34000 };

function getGame() { return window.__VICE_CITY_GAME__ || null; }
function isEditable(target) { return target?.matches?.('input, select, textarea, [contenteditable="true"]'); }

let sayTimer = 0;
function say(text, ms = 3200) {
  const game = getGame();
  if (!game) return;
  game.currentMessage = text;
  game.updateHUDState?.();
  clearTimeout(sayTimer);
  sayTimer = setTimeout(() => {
    if (game.currentMessage === text) { game.currentMessage = undefined; game.updateHUDState?.(); }
  }, ms);
}
function tip(text, ms = 5200) {
  const game = getGame();
  if (!game || game.currentMessage) return;
  say(text, ms);
}

/* ================================================================== */
/* 1) EL PERSONAJE YA NO CAMINA SOLO — vigilante de teclas pegadas     */
/* ================================================================== */

const physicallyDown = new Set();
const WATCHED_KEYS = [
  'KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
  'Space','ShiftLeft','ShiftRight','w','a','s','d','W','A','S','D'
];

function trackKey(event, down) {
  const code = event.code || '';
  const key = event.key || '';
  if (down) {
    if (code) physicallyDown.add(code);
    if (key) physicallyDown.add(key.length === 1 ? key.toLowerCase() : key);
  } else {
    if (code) physicallyDown.delete(code);
    if (key) physicallyDown.delete(key.length === 1 ? key.toLowerCase() : key);
  }
}
window.addEventListener('keydown', event => trackKey(event, true), true);
window.addEventListener('keyup', event => trackKey(event, false), true);

function isPhysicallyHeld(name) {
  if (physicallyDown.has(name)) return true;
  if (name.length === 1) return physicallyDown.has(name.toLowerCase());
  // 'KeyW' también cuenta como pulsada si la letra física 'w' está pulsada.
  if (/^Key[A-Z]$/.test(name)) return physicallyDown.has(name.slice(3).toLowerCase());
  return false;
}

function clearAllGameKeys(reason) {
  const game = getGame();
  physicallyDown.clear();
  if (!game?.keys) return;
  for (const key of Object.keys(game.keys)) game.keys[key] = false;
  game.isMouseDown = false;
}

setInterval(() => {
  const game = getGame();
  if (!game?.keys || window.__GTA_PAUSED__) return;
  for (const name of WATCHED_KEYS) {
    if (game.keys[name] && !isPhysicallyHeld(name)) game.keys[name] = false;
  }
}, 300);

window.addEventListener('blur', () => clearAllGameKeys('blur'));
document.addEventListener('visibilitychange', () => { if (document.hidden) clearAllGameKeys('hidden'); });
document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement) setTimeout(() => clearAllGameKeys('pointerlock'), 60); });

/* ================================================================== */
/* 2+3) DESTINO 📍 Y AMIGOS ONLINE — mapa grande y radar               */
/* ================================================================== */

let waypoint = null; // { x, z } en coordenadas de mundo
let mapOpen = false;
let overlay = null;

function mapSvg() { return document.querySelector('svg[viewBox="-14000 -10000 38000 34000"]'); }
function mapTransform() {
  const svg = mapSvg();
  if (!svg) return null;
  const rect = svg.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  const scale = Math.min(rect.width / MAP_VB.w, rect.height / MAP_VB.h);
  const originX = rect.left + (rect.width - MAP_VB.w * scale) / 2 - MAP_VB.x * scale;
  const originY = rect.top + (rect.height - MAP_VB.h * scale) / 2 - MAP_VB.y * scale;
  return { scale, originX, originY };
}
function worldToClient(tr, wx, wz) {
  return { x: tr.originX + (wx / WORLD_SCALE) * tr.scale, y: tr.originY + (wz / WORLD_SCALE) * tr.scale };
}
function clientToWorld(tr, cx, cy) {
  let sx = (cx - tr.originX) / tr.scale;
  let sy = (cy - tr.originY) / tr.scale;
  sx = Math.max(MAP_VB.x, Math.min(MAP_VB.x + MAP_VB.w, sx));
  sy = Math.max(MAP_VB.y, Math.min(MAP_VB.y + MAP_VB.h, sy));
  return { x: sx * WORLD_SCALE, z: sy * WORLD_SCALE };
}
function escapeName(value) {
  return String(value || 'JUGADOR').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').slice(0, 16);
}
function onlineStates() {
  try { return window.__GTA_ONLINE__?.getRemoteMapStates?.() || []; } catch { return []; }
}
function safeColor(value, fallback = '#ff8a00') {
  return /^#[0-9a-fA-F]{3,8}$/.test(String(value || '')) ? value : fallback;
}

// El marcador antiguo de mejoras-v93 queda oculto: esta capa V94 lo dibuja
// todo (destino + amigos) con mejor diseño, y la lógica de CTRL+Y de V93
// sigue funcionando por debajo sin cambios.
const hideV93 = document.createElement('style');
hideV93.textContent = `
#gta-v93-map-overlay{display:none !important}
@keyframes gtaV94Pin{0%,100%{transform:translate(-50%,-96%) scale(1)}50%{transform:translate(-50%,-96%) scale(1.14)}}
@keyframes gtaV94Ring{0%{transform:translate(-50%,-50%) scale(.45);opacity:.9}100%{transform:translate(-50%,-50%) scale(1.65);opacity:0}}
`;
document.head.appendChild(hideV93);

function buildOverlay() {
  destroyOverlay();
  overlay = document.createElement('div');
  overlay.id = 'gta-v94-map-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:70;pointer-events:none;';
  document.body.appendChild(overlay);
  const loop = () => {
    if (!mapOpen || !overlay) return;
    refreshOverlay();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
function destroyOverlay() {
  overlay?.remove();
  overlay = null;
}
let refreshCount = 0;
function refreshOverlay() {
  refreshCount++;
  if (!overlay) return;
  const tr = mapTransform();
  if (!tr) { overlay.innerHTML = ''; return; }
  let html = '';
  const states = onlineStates();
  for (const state of states) {
    if (!state?.position) continue;
    const p = worldToClient(tr, state.position.x, state.position.z);
    const color = safeColor(state.color);
    html += `<div style="position:absolute;left:${p.x}px;top:${p.y}px;transform:translate(-50%,-50%);text-align:center;">
      <div style="width:16px;height:16px;border-radius:50%;background:${color};border:2.5px solid #000;box-shadow:0 0 14px ${color};margin:0 auto;"></div>
      <div style="margin-top:2px;font:900 11px Arial,sans-serif;color:#fff;text-shadow:0 0 4px #000,1px 1px 2px #000;letter-spacing:.04em;white-space:nowrap;">${escapeName(state.name)}${state.vehicle ? ' 🚗' : ''}</div>
    </div>`;
  }
  if (window.__GTA_ONLINE__?.connected && states.length === 0) {
    html += '<div style="position:absolute;left:50%;bottom:26px;transform:translateX(-50%);font:800 12px Arial;color:#9fd8ff;text-shadow:0 0 4px #000;">ONLINE · NO HAY OTROS JUGADORES CONECTADOS EN LA SALA</div>';
  }
  if (waypoint) {
    const p = worldToClient(tr, waypoint.x, waypoint.z);
    html += `<div style="position:absolute;left:${p.x}px;top:${p.y}px;width:46px;height:46px;transform:translate(-50%,-50%);border:2.5px solid #ff3fa4;border-radius:50%;animation:gtaV94Ring 1.4s ease-out infinite;"></div>
      <div style="position:absolute;left:${p.x}px;top:${p.y}px;transform:translate(-50%,-96%);font-size:30px;filter:drop-shadow(0 3px 3px #000);animation:gtaV94Pin 1.2s ease-in-out infinite;">📍</div>
      <div style="position:absolute;left:${p.x}px;top:${p.y + 9}px;transform:translate(-50%,0);font:900 11px 'Arial Black',Arial;color:#ff8fd0;text-shadow:0 0 5px #000,1px 1px 2px #000;white-space:nowrap;letter-spacing:.06em;">DESTINO · CTRL+Y VIAJE RÁPIDO · CLIC AQUÍ BORRA</div>`;
  } else {
    html += '<div style="position:absolute;left:50%;bottom:52px;transform:translateX(-50%);font:900 12px Arial;color:#ffd23f;text-shadow:0 0 5px #000;letter-spacing:.05em;">HAZ CLIC EN EL MAPA PARA MARCAR TU DESTINO 📍</div>';
  }
  overlay.innerHTML = html;
}

window.addEventListener('gta-map-toggle', event => {
  mapOpen = Boolean(event.detail?.open);
  if (mapOpen) buildOverlay();
  else destroyOverlay();
});

// Clic en el mapa: fija (o borra, si tocas el pin) el destino.
window.addEventListener('pointerdown', event => {
  if (!mapOpen || event.button !== 0) return;
  if (event.target.closest?.('button, input')) return;
  const tr = mapTransform();
  if (!tr) return;
  if (waypoint) {
    const pin = worldToClient(tr, waypoint.x, waypoint.z);
    if (Math.hypot(event.clientX - pin.x, event.clientY - pin.y) < 26) {
      waypoint = null;
      refreshOverlay();
      return;
    }
  }
  waypoint = clientToWorld(tr, event.clientX, event.clientY);
  refreshOverlay();
}, true);

// Al llegar al destino, el punto se borra solo.
setInterval(() => {
  const game = getGame();
  if (!waypoint || !game?.playerContainer) return;
  const p = game.playerContainer.position;
  if (Math.hypot(p.x - waypoint.x, p.z - waypoint.z) < 9 * WORLD_SCALE) {
    console.info('[mejoras-v94] destino alcanzado, distancia', Math.round(Math.hypot(p.x - waypoint.x, p.z - waypoint.z)), 'jugador', Math.round(p.x), Math.round(p.z));
    waypoint = null;
    say('📍 HAS LLEGADO A TU DESTINO', 2800);
  }
}, 500);

/* ---------- Radar: amigos online + destino, pegados al borde -------- */

function drawRadarExtras() {
  const game = getGame();
  const ctx = game?.miniCtx;
  if (!ctx || !game.playerContainer) return;
  const half = 110;
  const scale = 0.0025;
  const p = game.playerContainer.position;
  const yaw = game.playerContainer.rotation.y || 0;
  const offX = -p.x * scale;
  const offZ = -p.z * scale;
  ctx.save();
  ctx.translate(half, half);
  ctx.rotate(yaw);

  for (const state of onlineStates()) {
    if (!state?.position) continue;
    let mx = state.position.x * scale + offX;
    let mz = state.position.z * scale + offZ;
    const dist = Math.hypot(mx, mz);
    const edge = dist > 94;
    if (edge) { const k = 94 / dist; mx *= k; mz *= k; }
    ctx.save();
    ctx.translate(mx, mz);
    ctx.rotate(-yaw);
    const color = safeColor(state.color);
    ctx.beginPath();
    ctx.arc(0, 0, edge ? 4 : 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.stroke();
    if (!edge) {
      const name = String(state.name || '').slice(0, 9);
      ctx.font = 'bold 7px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = 'rgba(0,0,0,.9)';
      ctx.strokeText(name, 0, -8);
      ctx.fillStyle = '#fff';
      ctx.fillText(name, 0, -8);
    }
    ctx.restore();
  }

  if (waypoint) {
    let mx = waypoint.x * scale + offX;
    let mz = waypoint.z * scale + offZ;
    const dist = Math.hypot(mx, mz);
    if (dist > 94) { const k = 94 / dist; mx *= k; mz *= k; }
    ctx.save();
    ctx.translate(mx, mz);
    ctx.rotate(-yaw);
    const pulse = 3 + Math.sin(performance.now() / 180) * 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, 6.5 + pulse, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,63,164,.6)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = '#ff3fa4';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(-4.5, -4.5, 9, 9);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function hookRadar() {
  const game = getGame();
  if (!game || typeof game.drawRadar !== 'function' || game.__v94RadarHook) return;
  game.__v94RadarHook = true;
  const original = game.drawRadar.bind(game);
  game.drawRadar = function v94DrawRadar(...args) {
    const result = original(...args);
    try { drawRadarExtras(); } catch {}
    return result;
  };
}

/* ================================================================== */
/* 4) CÁMARA DE NADO EN MAR ABIERTO — nunca más vista de dron          */
/* ================================================================== */

let swimLatched = false;
let swimCamReady = false;
const swimCam = { x: 0, y: 0, z: 0 };

function installSwimCameraGuard() {
  const game = getGame();
  if (!game?.renderer || game.renderer.__v94SwimCamGuard) return;
  game.renderer.__v94SwimCamGuard = true;
  const original = game.renderer.render.bind(game.renderer);
  game.renderer.render = function v94RenderWithSwimGuard(scene, camera) {
    try {
      const g = getGame();
      const state = g?.state;
      const busy = g?.activeBoat || g?.activeCar || g?.activeRiddenHorse ||
        window.__AIRCRAFT_SYSTEM__?.active || window.__POLICE_RESPONSE__?.activeTank;
      const swimming = Boolean(state?.inWater) && !busy && g?.playerContainer && camera?.isPerspectiveCamera;
      if (!swimming) {
        swimLatched = false;
        swimCamReady = false;
      } else {
        const p = g.playerContainer.position;
        if (!swimLatched) {
          const above = camera.position.y - p.y;
          const horizontal = Math.hypot(camera.position.x - p.x, camera.position.z - p.z);
          // Vista de dron: cámara muy por encima, casi vertical o perdida lejos.
          if (above > 5 * WORLD_SCALE || horizontal < 2 * WORLD_SCALE || horizontal > 26 * WORLD_SCALE) swimLatched = true;
        }
        if (swimLatched) {
          const yaw = g.playerContainer.rotation.y || 0;
          const back = 7.5 * WORLD_SCALE;
          const height = 2.6 * WORLD_SCALE;
          const tx = p.x + Math.sin(yaw) * back;
          const ty = p.y + height;
          const tz = p.z + Math.cos(yaw) * back;
          if (!swimCamReady) { swimCam.x = tx; swimCam.y = ty; swimCam.z = tz; swimCamReady = true; }
          else {
            swimCam.x += (tx - swimCam.x) * 0.3;
            swimCam.y += (ty - swimCam.y) * 0.3;
            swimCam.z += (tz - swimCam.z) * 0.3;
          }
          camera.position.set(swimCam.x, swimCam.y, swimCam.z);
          camera.up.set(0, 1, 0);
          camera.lookAt(p.x - Math.sin(yaw) * 5 * WORLD_SCALE, p.y + 0.7 * WORLD_SCALE, p.z - Math.cos(yaw) * 5 * WORLD_SCALE);
          camera.updateMatrixWorld(true);
        }
      }
    } catch {}
    return original(scene, camera);
  };
}

/* ================================================================== */
/* 5) BAJAR DEL AVIÓN SIEMPRE DE PIE                                   */
/* ================================================================== */

let wasFlying = false;
setInterval(() => {
  const system = window.__AIRCRAFT_SYSTEM__;
  const flyingNow = Boolean(system?.active);
  if (wasFlying && !flyingNow) window.__GTA_V94_AIRCRAFT_EXIT_AT__ = performance.now();
  wasFlying = flyingNow;

  const exitAt = window.__GTA_V94_AIRCRAFT_EXIT_AT__ || 0;
  if (!exitAt || performance.now() - exitAt > 3200) return;
  const game = getGame();
  if (!game?.playerModel || flyingNow) return;
  if (game.activeCar || game.activeBoat || game.activeRiddenHorse || game.state?.inWater) return;
  for (const model of [game.playerModel, game.soldierModel]) {
    if (!model) continue;
    if (model.rotation.x !== 0) model.rotation.x = 0;
    if (model.rotation.z !== 0) model.rotation.z = 0;
  }
  const container = game.playerContainer;
  if (container && (container.rotation.x !== 0 || container.rotation.z !== 0)) {
    container.rotation.x = 0;
    container.rotation.z = 0;
  }
}, 120);

/* ================================================================== */
/* 6) TRUCOS: INFINITY (munición infinita) y FULLGLOCK (todas)         */
/* ================================================================== */

let cheatBuffer = '';
let infinityOn = false;

function toggleInfinity() {
  infinityOn = !infinityOn;
  if (infinityOn && !window.__WEAPON_CRATES__?.inventory) {
    infinityOn = false;
    say('LAS ARMAS AÚN ESTÁN CARGANDO · PRUEBA EL TRUCO EN UNOS SEGUNDOS', 3400);
    return;
  }
  say(infinityOn
    ? '∞ TRUCO "INFINITY" ACTIVADO · MUNICIÓN INFINITA EN TODAS TUS ARMAS'
    : 'TRUCO "INFINITY" DESACTIVADO · LA MUNICIÓN VUELVE A GASTARSE', 4200);
}

setInterval(() => {
  if (!infinityOn) return;
  const inventory = window.__WEAPON_CRATES__?.inventory;
  if (!inventory) return;
  for (const id of Object.keys(inventory)) {
    if (id === 'fist') continue;
    const state = inventory[id];
    if (state?.owned && (Number(state.ammo) || 0) < 999) state.ammo = 999;
  }
}, 350);

function applyFullglock() {
  const api = window.__WEAPON_CRATES__;
  if (!api?.grantWeapon || !api.inventory) {
    say('LAS ARMAS AÚN ESTÁN CARGANDO · PRUEBA EL TRUCO EN UNOS SEGUNDOS', 3400);
    return;
  }
  try {
    api.grantWeapon('pistol', '· TRUCO', false);
    api.grantWeapon('shotgun', '· TRUCO', false);
    api.grantWeapon('akm', '· TRUCO', true); // equipa la AK-47 al instante
    for (const id of ['pistol', 'akm', 'shotgun']) {
      const state = api.inventory[id];
      if (state) { state.owned = true; state.ammo = Math.max(Number(state.ammo) || 0, 300); }
    }
  } catch {}
  setTimeout(() => say('🔫 TRUCO "FULLGLOCK" · PISTOLA, ESCOPETA Y AK-47 EN TU INVENTARIO · CAMBIA CON Q', 4800), 200);
}

window.addEventListener('keydown', event => {
  if (isEditable(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;
  const key = event.key && event.key.length === 1 ? event.key.toUpperCase() : '';
  if (!key || key < 'A' || key > 'Z') return;
  cheatBuffer = (cheatBuffer + key).slice(-12);
  if (cheatBuffer.endsWith('INFINITY')) {
    cheatBuffer = '';
    toggleInfinity();
  } else if (cheatBuffer.endsWith('FULLGLOCK')) {
    cheatBuffer = '';
    applyFullglock();
  }
});

/* ================================================================== */
/* 7) RETIRO FLUIDO: los caballos errantes no se amontonan en el parque */
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
  let horses = 0;
  for (const npc of game.npcs) {
    if (npc?.type !== 'horse' || npc.retiroHorse || npc.isRidden || npc.state === 'dead' || !npc.mesh) continue;
    if (!inPark(npc.mesh.position)) continue;
    horses++;
    if (horses <= 1) continue; // un caballo errante como máximo dentro del parque
    try {
      const spot = game.getRandomLandPosition();
      if (spot && !inPark(spot)) {
        npc.mesh.position.copy(spot);
        npc._lastGroundY = spot.y;
        npc.target?.copy?.(spot);
        npc.state = 'idle';
        npc.timer = 3 + Math.random() * 4;
      }
    } catch {}
  }
}, 5000);

/* ================================================================== */
/* Arranque                                                            */
/* ================================================================== */

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function start() {
  let game = null;
  for (let i = 0; i < 600; i++) {
    game = getGame();
    if (game?.renderer && game.coreWorldReady) break;
    await sleep(200);
  }
  game = getGame();
  if (!game) return;
  installSwimCameraGuard();
  hookRadar();
  setInterval(hookRadar, 2000); // por si el radar se crea más tarde
  window.__GTA_V94__ = {
    get waypoint() { return waypoint; },
    setWaypoint(x, z) { waypoint = { x, z }; },
    clearWaypoint() { waypoint = null; },
    get debug() { return { mapOpen, refreshCount, overlayLen: overlay ? overlay.innerHTML.length : -1, hasPin: overlay ? overlay.innerHTML.includes('DESTINO') : false }; }
  };
  setTimeout(() => tip('🔫 TRUCOS NUEVOS: ESCRIBE "INFINITY" (MUNICIÓN INFINITA) O "FULLGLOCK" (TODAS LAS ARMAS)', 6000), 34000);
  setTimeout(() => tip('📍 CLIC EN EL MAPA (TAB) = DESTINO EN EL RADAR · TUS AMIGOS ONLINE TAMBIÉN SALEN EN EL RADAR', 6000), 56000);
  console.info('[mejoras-v94] Módulo V94 activo.');
}

start().catch(error => console.warn('[mejoras-v94] Arranque incompleto.', error));
