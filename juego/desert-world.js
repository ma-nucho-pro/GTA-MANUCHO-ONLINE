/**
 * GTA MANUCHO V84 — código del proyecto.
 * Creado e integrado por Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * ARKEA AI / Manucho · conserva LICENSE, NOTICE.md y estos créditos al reutilizar.
 */
import * as THREE from './bosque/libs/three.module.js';

window.__DESERT_WORLD_READY__ = false;

const WORLD_SCALE = 16;
const RETIRO = {
  centerX: 1720 * WORLD_SCALE,
  northEdgeZ: 470 * WORLD_SCALE
};
const DESERT_GATE = {
  x: RETIRO.centerX,
  z: RETIRO.northEdgeZ + 1450,
  radius: 420,
  floorY: 0
};

let game = null;
let installed = false;
let prompt = null;
let cooldownUntil = 0;

function groundAt(x, z, fallback = 0) {
  try {
    const y = game?.getGroundY?.(x, fallback + 700, z, false);
    return Number.isFinite(y) ? y : fallback;
  } catch {
    return fallback;
  }
}

function makeSandTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#c89958';
  ctx.fillRect(0, 0, 256, 256);
  let seed = 19073;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 2600; i++) {
    const shade = 135 + Math.floor(rand() * 70);
    ctx.fillStyle = `rgba(${shade + 25},${shade},${Math.max(55, shade - 55)},${0.05 + rand() * 0.14})`;
    const size = 0.6 + rand() * 2.3;
    ctx.fillRect(rand() * 256, rand() * 256, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(14, 10);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeSignTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#3a220f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#ffe0a1';
  ctx.lineWidth = 18;
  ctx.strokeRect(12, 12, 1000, 232);
  ctx.fillStyle = '#fff0bf';
  ctx.textAlign = 'center';
  ctx.font = '900 92px Arial';
  ctx.fillText('DESERT', 512, 122);
  ctx.font = '800 32px Arial';
  ctx.fillText('PULSA E PARA ENTRAR', 512, 188);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createPrompt() {
  prompt = document.createElement('div');
  prompt.id = 'desert-gate-prompt';
  prompt.style.cssText = [
    'position:fixed','left:50%','bottom:160px','transform:translateX(-50%)','z-index:5200',
    'padding:10px 16px','border-radius:10px','background:rgba(49,28,10,.92)',
    'border:1px solid rgba(255,216,140,.8)','color:#fff1c5','font:900 13px Arial,sans-serif',
    'letter-spacing:.08em','display:none','pointer-events:none','box-shadow:0 12px 38px rgba(0,0,0,.52)'
  ].join(';');
  document.body.appendChild(prompt);
}

function buildIgloo() {
  const baseY = groundAt(DESERT_GATE.x, DESERT_GATE.z, 0);
  DESERT_GATE.floorY = Math.max(0, baseY);
  const root = new THREE.Group();
  root.name = 'SAND_IGLOO_DESERT_PORTAL_V49';

  const sandMaterial = new THREE.MeshStandardMaterial({
    map: makeSandTexture(),
    color: 0xf3d19a,
    roughness: 1,
    metalness: 0,
    side: THREE.DoubleSide
  });
  const darkSand = new THREE.MeshStandardMaterial({ color: 0x6f4724, roughness: 1, metalness: 0 });

  // Base profunda y camino firme desde el borde norte del Retiro.
  const foundation = new THREE.Mesh(new THREE.BoxGeometry(1500, 90, 1450), sandMaterial);
  foundation.position.set(DESERT_GATE.x, DESERT_GATE.floorY - 45, DESERT_GATE.z);
  foundation.receiveShadow = false;
  foundation.castShadow = false;
  root.add(foundation);

  const pathLength = DESERT_GATE.z - RETIRO.northEdgeZ;
  const path = new THREE.Mesh(new THREE.BoxGeometry(260, 16, pathLength), sandMaterial);
  path.position.set(DESERT_GATE.x, DESERT_GATE.floorY - 8, RETIRO.northEdgeZ + pathLength * 0.5);
  path.receiveShadow = false;
  root.add(path);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(430, 40, 22, 0, Math.PI * 2, 0, Math.PI * 0.52),
    sandMaterial
  );
  dome.position.set(DESERT_GATE.x, DESERT_GATE.floorY, DESERT_GATE.z);
  dome.scale.y = 0.78;
  dome.castShadow = false;
  dome.receiveShadow = false;
  root.add(dome);

  const tunnel = new THREE.Mesh(new THREE.BoxGeometry(260, 220, 330), sandMaterial);
  tunnel.position.set(DESERT_GATE.x, DESERT_GATE.floorY + 110, DESERT_GATE.z - 400);
  root.add(tunnel);

  const door = new THREE.Mesh(new THREE.PlaneGeometry(180, 170), new THREE.MeshBasicMaterial({ color: 0x120b05, side: THREE.DoubleSide }));
  door.position.set(DESERT_GATE.x, DESERT_GATE.floorY + 88, DESERT_GATE.z - 566);
  root.add(door);

  const portal = new THREE.Mesh(
    new THREE.CircleGeometry(105, 40),
    new THREE.MeshBasicMaterial({ color: 0xffc85a, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false })
  );
  portal.position.set(DESERT_GATE.x, DESERT_GATE.floorY + 104, DESERT_GATE.z - 570);
  root.add(portal);

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(630, 158),
    new THREE.MeshBasicMaterial({ map: makeSignTexture(), side: THREE.DoubleSide })
  );
  sign.position.set(DESERT_GATE.x, DESERT_GATE.floorY + 380, DESERT_GATE.z - 575);
  root.add(sign);

  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(18 + (i % 4) * 5, 0), darkSand);
    rock.position.set(
      DESERT_GATE.x + Math.cos(angle) * 590,
      DESERT_GATE.floorY + 10,
      DESERT_GATE.z + Math.sin(angle) * 540
    );
    rock.rotation.set(i * .2, angle, i * .13);
    root.add(rock);
  }

  root.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = false;
    object.receiveShadow = false;
    object.frustumCulled = true;
  });
  game.scene.add(root);

  if (!game.__desertGroundPatched) {
    game.__desertGroundPatched = true;
    const previous = game.getGroundY.bind(game);
    game.getGroundY = function desertGround(x, y, z, strict = true) {
      const value = previous(x, y, z, strict);
      const inBase = Math.abs(x - DESERT_GATE.x) <= 750 && Math.abs(z - DESERT_GATE.z) <= 725;
      const onPath = Math.abs(x - DESERT_GATE.x) <= 130 && z >= RETIRO.northEdgeZ && z <= DESERT_GATE.z;
      if (inBase || onPath) return Math.max(Number.isFinite(value) ? value : -Infinity, DESERT_GATE.floorY);
      return value;
    };
  }
}

function saveReturnPoint() {
  const p = game.playerContainer.position;
  sessionStorage.setItem('vice_desert_return', JSON.stringify({
    x: p.x,
    y: p.y,
    z: p.z,
    ry: game.playerContainer.rotation.y
  }));
}

function enterDesert() {
  if (Date.now() < cooldownUntil) return;
  cooldownUntil = Date.now() + 2000;
  saveReturnPoint();
  try { document.exitPointerLock?.(); } catch {}
  window.location.assign('./desert/index.html?from=vice');
}

function handleReturn() {
  const params = new URLSearchParams(location.search);
  if (params.get('return') !== 'desert') return;
  cooldownUntil = Date.now() + 4500;
  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem('vice_desert_return') || 'null'); } catch {}
  const x = saved?.x ?? DESERT_GATE.x;
  const z = saved?.z ?? (DESERT_GATE.z - 520);
  const y = DESERT_GATE.floorY + 3;
  game.playerContainer.position.set(x, Math.max(y, saved?.y || y), z);
  game.playerContainer.rotation.y = saved?.ry || 0;
  game.lastSafePlayerPosition?.copy(game.playerContainer.position);
  if (game.state) {
    game.state.vy = 0;
    game.state.onGround = true;
    game.state.inWater = false;
    game.state.isFlying = false;
  }
  history.replaceState({}, '', location.pathname + '?noprogressive=1');
}

function nearPortal() {
  const p = game?.playerContainer?.position;
  if (!p) return false;
  return Math.hypot(p.x - DESERT_GATE.x, p.z - (DESERT_GATE.z - 545)) < DESERT_GATE.radius;
}

function monitor() {
  if (!game?.playerContainer) return;
  const near = nearPortal();
  prompt.style.display = near ? 'block' : 'none';
  if (near) prompt.textContent = 'E · ENTRAR AL MUNDO DESERT';
}

function onKeyDown(event) {
  if (event.repeat || event.code !== 'KeyE' || !nearPortal()) return;
  event.preventDefault();
  event.stopPropagation();
  enterDesert();
}

function install() {
  if (installed) return true;
  game = window.__VICE_CITY_GAME__;
  if (!game?.scene || !game?.playerContainer || typeof game.getGroundY !== 'function') return false;
  installed = true;
  createPrompt();
  buildIgloo();
  handleReturn();
  window.addEventListener('keydown', onKeyDown, true);
  setInterval(monitor, 180);
  window.__DESERT_WORLD_READY__ = true;
  window.dispatchEvent(new CustomEvent('desert-world-ready'));
  return true;
}

const wait = setInterval(() => {
  if (!install()) return;
  clearInterval(wait);
}, 120);

setTimeout(() => {
  clearInterval(wait);
  if (!window.__DESERT_WORLD_READY__) window.__DESERT_WORLD_READY__ = true;
}, 12000);
