/**
 * GTA MANUCHO V84 — código del proyecto.
 * Creado e integrado por Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * ARKEA AI / Manucho · conserva LICENSE, NOTICE.md y estos créditos al reutilizar.
 */
import * as THREE from './bosque/libs/three.module.js';

THREE.Cache.enabled = true;
window.__GIRLFRIEND_HOUSE_READY__ = false;

const HOUSE = {
  x: 560,
  z: 1360,
  floorY: 0.65,
  halfX: 95,
  halfZ: 72,
  wallHeight: 58,
  wallThickness: 6,
  doorHalf: 19
};

const STATS_KEY = 'viceCityRelationshipStatsV1';
const VISIT_SECONDS = 10;

let game = null;
let installed = false;
let houseRoot = null;
let prompt = null;
let statsPanel = null;
let visitOverlay = null;
let inside = false;
let visitEndsAt = 0;
let exitTimer = null;
let savedOutside = null;
let video = null;
let videoTexture = null;
let videoScreen = null;
let lastFrame = performance.now();
let promptAccumulator = 0;

const stats = loadStats();

function loadStats() {
  const defaults = { sexAppeal: 20, autoestima: 25, carisma: 15, respeto: 10, visitas: 0 };
  try {
    const saved = JSON.parse(localStorage.getItem(STATS_KEY) || 'null');
    return { ...defaults, ...(saved && typeof saved === 'object' ? saved : {}) };
  } catch {
    return defaults;
  }
}

function saveStats() {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch {}
}

function clampStat(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function ensurePrompt() {
  let node = document.getElementById('girlfriend-house-prompt');
  if (node) return node;
  node = document.createElement('div');
  node.id = 'girlfriend-house-prompt';
  node.style.cssText = [
    'position:fixed','left:50%','bottom:116px','transform:translateX(-50%)','z-index:9500',
    'padding:10px 16px','border-radius:11px','background:rgba(28,5,23,.92)',
    'border:1px solid rgba(255,94,184,.82)','color:#fff','font:900 13px Arial,sans-serif',
    'letter-spacing:.045em','pointer-events:none','display:none','box-shadow:0 14px 38px rgba(0,0,0,.5)'
  ].join(';');
  document.body.appendChild(node);
  return node;
}

function ensureVisitOverlay() {
  let node = document.getElementById('girlfriend-visit-overlay');
  if (node) return node;
  node = document.createElement('div');
  node.id = 'girlfriend-visit-overlay';
  node.style.cssText = [
    'position:fixed','top:22px','left:50%','transform:translateX(-50%)','z-index:9600',
    'padding:12px 18px','border-radius:12px','background:rgba(24,4,20,.9)',
    'border:1px solid rgba(255,104,195,.85)','color:#fff','font:900 14px Arial,sans-serif',
    'letter-spacing:.055em','pointer-events:none','display:none','box-shadow:0 14px 42px rgba(0,0,0,.5)'
  ].join(';');
  document.body.appendChild(node);
  return node;
}

function ensureStatsPanel() {
  let node = document.getElementById('relationship-stats-panel');
  if (node) return node;
  node = document.createElement('div');
  node.id = 'relationship-stats-panel';
  node.style.cssText = [
    'position:fixed','right:22px','top:150px','z-index:9700','width:300px','display:none',
    'padding:18px','border-radius:16px','background:rgba(6,8,18,.95)',
    'border:1px solid rgba(255,95,190,.8)','color:#fff','font-family:Arial,sans-serif',
    'box-shadow:0 20px 55px rgba(0,0,0,.58)','pointer-events:none'
  ].join(';');
  document.body.appendChild(node);
  return node;
}

function renderStats() {
  if (!statsPanel) return;
  const rows = [
    ['SEX APPEAL', stats.sexAppeal, '#ff4fad'],
    ['AUTOESTIMA', stats.autoestima, '#53d8ff'],
    ['CARISMA', stats.carisma, '#ffd45a'],
    ['RESPETO', stats.respeto, '#7dff88']
  ];
  statsPanel.innerHTML = `
    <div style="font-weight:1000;font-size:19px;letter-spacing:.08em;margin-bottom:4px;color:#ff72c7">ESTADÍSTICAS</div>
    <div style="font-size:11px;opacity:.72;margin-bottom:15px">J · CERRAR · VISITAS A TU NOVIA: ${stats.visitas}</div>
    ${rows.map(([label,value,color]) => `
      <div style="margin:11px 0 5px;font-size:12px;font-weight:900;letter-spacing:.055em">${label} <span style="float:right">${value}%</span></div>
      <div style="height:9px;border-radius:10px;background:#202536;overflow:hidden"><div style="height:100%;width:${value}%;background:${color}"></div></div>
    `).join('')}
  `;
}

function toggleStats() {
  if (!statsPanel) return;
  renderStats();
  statsPanel.style.display = statsPanel.style.display === 'block' ? 'none' : 'block';
}

function showNotice(text, duration = 3600) {
  let node = document.getElementById('girlfriend-stat-notice');
  if (!node) {
    node = document.createElement('div');
    node.id = 'girlfriend-stat-notice';
    node.style.cssText = [
      'position:fixed','left:50%','bottom:58px','transform:translateX(-50%)','z-index:9800',
      'padding:11px 17px','border-radius:12px','background:rgba(24,4,20,.94)',
      'border:1px solid rgba(255,92,186,.86)','color:#fff','font:900 13px Arial,sans-serif',
      'letter-spacing:.05em','pointer-events:none','display:none','box-shadow:0 14px 40px rgba(0,0,0,.55)'
    ].join(';');
    document.body.appendChild(node);
  }
  node.textContent = text;
  node.style.display = 'block';
  clearTimeout(node.__hideTimer);
  node.__hideTimer = setTimeout(() => { node.style.display = 'none'; }, duration);
}

function makeSignTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 1024, 256);
  gradient.addColorStop(0, '#4b123c');
  gradient.addColorStop(.5, '#8d245e');
  gradient.addColorStop(1, '#4b123c');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 256);
  ctx.strokeStyle = '#ff8bd2';
  ctx.lineWidth = 16;
  ctx.strokeRect(12, 12, 1000, 232);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = '900 78px Arial';
  ctx.fillText('CASA DE MI NOVIA', 512, 112);
  ctx.fillStyle = '#ffd7ef';
  ctx.font = '800 34px Arial';
  ctx.fillText('ENTRA CON E · ESTADÍSTICAS CON J', 512, 180);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 2;
  return texture;
}

function patchGroundAndCollision() {
  if (game.__girlfriendHousePhysicsPatched) return;
  game.__girlfriendHousePhysicsPatched = true;

  const oldGround = game.getGroundY.bind(game);
  game.getGroundY = function girlfriendHouseGround(x, y, z, strict = true) {
    const value = oldGround(x, y, z, strict);
    if (
      x >= HOUSE.x - HOUSE.halfX - 28 && x <= HOUSE.x + HOUSE.halfX + 28 &&
      z >= HOUSE.z - HOUSE.halfZ - 80 && z <= HOUSE.z + HOUSE.halfZ + 25
    ) {
      return Math.max(Number.isFinite(value) ? value : -Infinity, HOUSE.floorY + 1.1);
    }
    return value;
  };

  if (typeof game.checkCollision === 'function') {
    const oldCollision = game.checkCollision.bind(game);
    game.checkCollision = function girlfriendHouseCollision(x, z, includeWorld = false, y = null, radius = null) {
      const r = Number.isFinite(radius) ? radius : 2;
      const lx = x - HOUSE.x;
      const lz = z - HOUSE.z;
      const entrance = Math.abs(lx) <= HOUSE.doorHalf + 8 && lz >= -HOUSE.halfZ - 65 && lz <= -HOUSE.halfZ + 8;
      if (entrance) return false;
      const near = Math.abs(lx) <= HOUSE.halfX + HOUSE.wallThickness + r && Math.abs(lz) <= HOUSE.halfZ + HOUSE.wallThickness + r;
      if (near) {
        const west = Math.abs(lx + HOUSE.halfX) <= HOUSE.wallThickness + r;
        const east = Math.abs(lx - HOUSE.halfX) <= HOUSE.wallThickness + r;
        const north = Math.abs(lz - HOUSE.halfZ) <= HOUSE.wallThickness + r;
        const south = Math.abs(lz + HOUSE.halfZ) <= HOUSE.wallThickness + r;
        const door = Math.abs(lx) <= HOUSE.doorHalf - r * .25;
        if (west || east || north || (south && !door)) return true;
        if (Math.abs(lx) < HOUSE.halfX && Math.abs(lz) < HOUSE.halfZ) return false;
      }
      return oldCollision(x, z, includeWorld, y, radius);
    };
  }
}

function buildHouse() {
  patchGroundAndCollision();
  const root = new THREE.Group();
  root.name = 'CASA_NOVIA_V59';
  root._isAlwaysVisible = true;

  const floorMat = new THREE.MeshStandardMaterial({ color: 0xb68a78, roughness: .92, metalness: .02 });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf0b7d5, roughness: .82, metalness: .02 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x6f1d46, roughness: .82, metalness: .03 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .78, metalness: .01 });
  const pathMat = new THREE.MeshStandardMaterial({ color: 0xc7b29a, roughness: 1, metalness: 0 });
  const screenFrameMat = new THREE.MeshStandardMaterial({ color: 0x1b1321, roughness: .48, metalness: .25 });

  const foundation = new THREE.Mesh(new THREE.BoxGeometry(HOUSE.halfX * 2 + 24, 5, HOUSE.halfZ * 2 + 24), floorMat);
  foundation.position.set(HOUSE.x, HOUSE.floorY - 1.4, HOUSE.z);
  foundation.name = 'CASA_NOVIA_BASE_SOLIDA';
  root.add(foundation);

  const path = new THREE.Mesh(new THREE.BoxGeometry(54, 2, 94), pathMat);
  path.position.set(HOUSE.x, HOUSE.floorY, HOUSE.z - HOUSE.halfZ - 42);
  root.add(path);

  const floor = new THREE.Mesh(new THREE.BoxGeometry(HOUSE.halfX * 2, 2.2, HOUSE.halfZ * 2), floorMat);
  floor.position.set(HOUSE.x, HOUSE.floorY + .8, HOUSE.z);
  root.add(floor);

  const h = HOUSE.wallHeight;
  const t = HOUSE.wallThickness;
  const wallY = HOUSE.floorY + h * .5 + 1.9;
  const back = new THREE.Mesh(new THREE.BoxGeometry(HOUSE.halfX * 2, h, t), wallMat);
  back.position.set(HOUSE.x, wallY, HOUSE.z + HOUSE.halfZ);
  root.add(back);
  const left = new THREE.Mesh(new THREE.BoxGeometry(t, h, HOUSE.halfZ * 2), wallMat);
  left.position.set(HOUSE.x - HOUSE.halfX, wallY, HOUSE.z);
  root.add(left);
  const right = left.clone();
  right.position.x = HOUSE.x + HOUSE.halfX;
  root.add(right);

  const sideWidth = HOUSE.halfX - HOUSE.doorHalf;
  const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(sideWidth, h, t), wallMat);
  frontLeft.position.set(HOUSE.x - (HOUSE.doorHalf + sideWidth * .5), wallY, HOUSE.z - HOUSE.halfZ);
  root.add(frontLeft);
  const frontRight = frontLeft.clone();
  frontRight.position.x = HOUSE.x + (HOUSE.doorHalf + sideWidth * .5);
  root.add(frontRight);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(HOUSE.doorHalf * 2, 15, t), wallMat);
  lintel.position.set(HOUSE.x, HOUSE.floorY + h - 5, HOUSE.z - HOUSE.halfZ);
  root.add(lintel);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(142, 42, 4), roofMat);
  roof.position.set(HOUSE.x, HOUSE.floorY + h + 22, HOUSE.z);
  roof.rotation.y = Math.PI * .25;
  root.add(roof);

  for (const x of [-HOUSE.halfX + 13, HOUSE.halfX - 13]) {
    const trim = new THREE.Mesh(new THREE.BoxGeometry(9, h + 7, 9), trimMat);
    trim.position.set(HOUSE.x + x, wallY, HOUSE.z - HOUSE.halfZ - 1);
    root.add(trim);
  }

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(128, 32),
    new THREE.MeshBasicMaterial({ map: makeSignTexture(), toneMapped: false, side: THREE.DoubleSide })
  );
  sign.position.set(HOUSE.x, HOUSE.floorY + h + 33, HOUSE.z - HOUSE.halfZ - 3.2);
  sign.rotation.y = Math.PI;
  root.add(sign);

  const bed = new THREE.Group();
  const bedBase = new THREE.Mesh(new THREE.BoxGeometry(76, 10, 42), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .88 }));
  bedBase.position.set(0, 7, 0);
  bed.add(bedBase);
  const blanket = new THREE.Mesh(new THREE.BoxGeometry(73, 5, 27), new THREE.MeshStandardMaterial({ color: 0xdf4f92, roughness: .86 }));
  blanket.position.set(0, 14, 7);
  bed.add(blanket);
  const pillow = new THREE.Mesh(new THREE.BoxGeometry(28, 7, 13), new THREE.MeshStandardMaterial({ color: 0xffe8f5, roughness: .9 }));
  pillow.position.set(0, 15, -12);
  bed.add(pillow);
  bed.position.set(HOUSE.x - 45, HOUSE.floorY + 1.9, HOUSE.z + 34);
  root.add(bed);

  const sofa = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(70, 12, 28), new THREE.MeshStandardMaterial({ color: 0x8d3568, roughness: .86 }));
  seat.position.y = 12;
  sofa.add(seat);
  const backrest = new THREE.Mesh(new THREE.BoxGeometry(70, 28, 9), new THREE.MeshStandardMaterial({ color: 0x762653, roughness: .86 }));
  backrest.position.set(0, 24, 10);
  sofa.add(backrest);
  sofa.position.set(HOUSE.x + 45, HOUSE.floorY + 1.9, HOUSE.z + 30);
  root.add(sofa);

  const frame = new THREE.Mesh(new THREE.BoxGeometry(112, 61, 5), screenFrameMat);
  frame.position.set(HOUSE.x, HOUSE.floorY + 34, HOUSE.z + HOUSE.halfZ - 5.5);
  root.add(frame);
  videoScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(105, 53),
    new THREE.MeshBasicMaterial({ color: 0x170d18, toneMapped: false })
  );
  videoScreen.position.set(HOUSE.x, HOUSE.floorY + 34, HOUSE.z + HOUSE.halfZ - 8.1);
  videoScreen.rotation.y = Math.PI;
  root.add(videoScreen);

  const lampMat = new THREE.MeshBasicMaterial({ color: 0xffbadf, toneMapped: false });
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(4, 12, 8), lampMat);
  lamp.position.set(HOUSE.x, HOUSE.floorY + h - 7, HOUSE.z);
  root.add(lamp);

  root.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = false;
    object.receiveShadow = true;
    object.frustumCulled = true;
  });

  game.city.add(root);
  houseRoot = root;
}

function ensureVideoTexture() {
  if (videoTexture) return;
  video = document.createElement('video');
  video.src = './girlfriend-assets/MaryOculus.webm';
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.preload = 'metadata';
  video.crossOrigin = 'anonymous';
  videoTexture = new THREE.VideoTexture(video);
  videoTexture.colorSpace = THREE.SRGBColorSpace;
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.magFilter = THREE.LinearFilter;
  videoTexture.generateMipmaps = false;
  // El video es estereoscópico lado a lado; se muestra solo un ojo para ver una imagen única.
  videoTexture.wrapS = THREE.ClampToEdgeWrapping;
  videoTexture.repeat.set(.5, 1);
  videoTexture.offset.set(.5, 0);
  videoScreen.material.dispose?.();
  videoScreen.material = new THREE.MeshBasicMaterial({ map: videoTexture, toneMapped: false });
}

function playerNearDoor(maxDistance = 48) {
  if (!game?.playerContainer) return false;
  const p = game.playerContainer.position;
  const dx = p.x - HOUSE.x;
  const dz = p.z - (HOUSE.z - HOUSE.halfZ - 20);
  return dx * dx + dz * dz <= maxDistance * maxDistance;
}

function freezePlayer() {
  if (!game?.playerContainer) return;
  for (const key of Object.keys(game.keys || {})) game.keys[key] = false;
  game.playerContainer.position.set(HOUSE.x, HOUSE.floorY + 2.2, HOUSE.z + 6);
  game.playerContainer.rotation.y = Math.PI;
  if (game.state) {
    game.state.vy = 0;
    game.state.onGround = true;
    game.state.inWater = false;
    game.state.isSubmerged = false;
    game.state.isFlying = false;
  }
}

function enterHouse() {
  if (inside || !game?.playerContainer) return;
  if (game.activeCar || game.activeBoat || game.activeRiddenHorse || window.__ACTIVE_AIRCRAFT__ || window.__ACTIVE_TANK__) {
    showNotice('BAJA DEL VEHÍCULO ANTES DE ENTRAR');
    return;
  }
  inside = true;
  savedOutside = {
    x: HOUSE.x,
    y: HOUSE.floorY + 2.2,
    z: HOUSE.z - HOUSE.halfZ - 31,
    yaw: 0
  };
  ensureVideoTexture();
  try {
    video.currentTime = 0;
    video.play().catch(() => {});
  } catch {}
  freezePlayer();
  prompt.style.display = 'none';
  visitEndsAt = performance.now() + VISIT_SECONDS * 1000;
  visitOverlay.style.display = 'block';
  clearTimeout(exitTimer);
  exitTimer = setTimeout(finishVisit, VISIT_SECONDS * 1000);
}

function finishVisit() {
  if (!inside) return;
  inside = false;
  try { video?.pause?.(); } catch {}
  visitOverlay.style.display = 'none';

  stats.sexAppeal = clampStat(stats.sexAppeal + 12);
  stats.autoestima = clampStat(stats.autoestima + 8);
  stats.carisma = clampStat(stats.carisma + 5);
  stats.respeto = clampStat(stats.respeto + 2);
  stats.visitas = Math.max(0, Math.round(stats.visitas + 1));
  saveStats();
  renderStats();

  if (game?.playerContainer && savedOutside) {
    game.playerContainer.position.set(savedOutside.x, savedOutside.y, savedOutside.z);
    game.playerContainer.rotation.y = savedOutside.yaw;
    if (game.state) {
      game.state.vy = 0;
      game.state.onGround = true;
      game.state.inWater = false;
      game.state.isSubmerged = false;
      game.state.isFlying = false;
    }
    game.lastSafePlayerPosition?.copy?.(game.playerContainer.position);
    game.lastSafeGroundY = savedOutside.y;
  }
  showNotice('SEX APPEAL +12 · AUTOESTIMA +8 · CARISMA +5 · PULSA J PARA VER ESTADÍSTICAS', 5200);
}

function onKeyDown(event) {
  if (event.repeat) return;
  if (event.code === 'KeyJ') {
    event.preventDefault();
    toggleStats();
    return;
  }
  if (event.code !== 'KeyE' || inside || !playerNearDoor()) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  enterHouse();
}

function loop(now = performance.now()) {
  requestAnimationFrame(loop);
  const dt = Math.min(.1, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;

  if (inside) {
    freezePlayer();
    const remaining = Math.max(0, Math.ceil((visitEndsAt - now) / 1000));
    visitOverlay.textContent = `EN CASA DE TU NOVIA · SALDRÁS EN ${remaining} s`;
    return;
  }

  promptAccumulator += dt;
  if (promptAccumulator >= .2) {
    promptAccumulator = 0;
    if (playerNearDoor()) {
      prompt.textContent = 'E · ENTRAR A CASA DE TU NOVIA · J · ESTADÍSTICAS';
      prompt.style.display = 'block';
    } else {
      prompt.style.display = 'none';
    }
  }
}

function install() {
  if (installed) return;
  game = window.__VICE_CITY_GAME__;
  if (!game?.city || !game?.playerContainer || typeof game.getGroundY !== 'function') return;
  installed = true;
  prompt = ensurePrompt();
  visitOverlay = ensureVisitOverlay();
  statsPanel = ensureStatsPanel();
  renderStats();
  buildHouse();
  window.addEventListener('keydown', onKeyDown, true);
  window.__GIRLFRIEND_HOUSE__ = { root: houseRoot, stats, enterHouse, finishVisit };
  window.__GIRLFRIEND_HOUSE_READY__ = true;
  window.dispatchEvent(new CustomEvent('girlfriend-house-ready'));
  requestAnimationFrame(loop);
}

const wait = setInterval(() => {
  game = window.__VICE_CITY_GAME__ || game;
  if (!game?.city || !game?.playerContainer || typeof game.getGroundY !== 'function') return;
  clearInterval(wait);
  install();
}, 120);

setTimeout(() => {
  clearInterval(wait);
  if (!window.__GIRLFRIEND_HOUSE_READY__) {
    window.__GIRLFRIEND_HOUSE_READY__ = true;
    window.dispatchEvent(new CustomEvent('girlfriend-house-ready'));
  }
}, 15000);
