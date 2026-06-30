/**
 * GTA MANUCHO V84 — código del proyecto.
 * Creado e integrado por Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * ARKEA AI / Manucho · conserva LICENSE, NOTICE.md y estos créditos al reutilizar.
 */
import * as THREE from './bosque/libs/three.module.js';

window.__CASTLE_WORLD_READY__ = false;

const WORLD_SCALE = 16;
const CASTLE = {
  x: 1500 * WORLD_SCALE,
  z: 3450 * WORLD_SCALE,
  halfX: 310,
  halfZ: 250,
  wallHeight: 145,
  floorY: 0,
  gateHalf: 44,
  launchRadius: 72
};

let game = null;
let installed = false;
let prompt = null;
let cooldownUntil = 0;

function groundAt(x, z, fallback = 0) {
  try {
    const y = game?.getGroundY?.(x, fallback + 300, z, false);
    return Number.isFinite(y) ? y : fallback;
  } catch {
    return fallback;
  }
}

function makeSignTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1c120b';
  ctx.fillRect(0, 0, 1024, 256);
  ctx.strokeStyle = '#d5b26f';
  ctx.lineWidth = 18;
  ctx.strokeRect(12, 12, 1000, 232);
  ctx.fillStyle = '#ffe7b0';
  ctx.textAlign = 'center';
  ctx.font = 'bold 76px Georgia';
  ctx.fillText('CASTILLO DEL DUNGEON', 512, 108);
  ctx.fillStyle = '#d8c69d';
  ctx.font = 'bold 30px Arial';
  ctx.fillText('PULSA E EN EL PORTAL PARA ENTRAR', 512, 180);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createPrompt() {
  prompt = document.createElement('div');
  prompt.id = 'castle-world-prompt';
  prompt.style.cssText = [
    'position:fixed','left:50%','bottom:74px','transform:translateX(-50%)','z-index:3900',
    'padding:9px 14px','border-radius:10px','background:rgba(21,12,5,.92)',
    'border:1px solid rgba(230,190,110,.76)','color:#fff0c7','font:800 12px Arial,sans-serif',
    'letter-spacing:.05em','pointer-events:none','display:none','box-shadow:0 12px 32px rgba(0,0,0,.48)'
  ].join(';');
  document.body.appendChild(prompt);
}

function buildCastle() {
  CASTLE.floorY = groundAt(CASTLE.x, CASTLE.z, 0);
  const root = new THREE.Group();
  root.name = 'CASTLE_DUNGEON_PORTAL_V48';

  const stone = new THREE.MeshLambertMaterial({ color: 0x6f675b });
  const darkStone = new THREE.MeshLambertMaterial({ color: 0x3d3935 });
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x4d2022 });
  const floorMat = new THREE.MeshLambertMaterial({ color: 0x8e8578 });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x7c5cff, transparent: true, opacity: .58, side: THREE.DoubleSide, depthWrite: false });

  const foundation = new THREE.Mesh(
    new THREE.BoxGeometry(CASTLE.halfX * 2 + 80, 36, CASTLE.halfZ * 2 + 120),
    darkStone
  );
  foundation.position.set(CASTLE.x, CASTLE.floorY - 18, CASTLE.z - 18);
  root.add(foundation);

  const courtyard = new THREE.Mesh(
    new THREE.BoxGeometry(CASTLE.halfX * 2, 3, CASTLE.halfZ * 2),
    floorMat
  );
  courtyard.position.set(CASTLE.x, CASTLE.floorY + 1.5, CASTLE.z);
  root.add(courtyard);

  const wallThickness = 28;
  const north = new THREE.Mesh(new THREE.BoxGeometry(CASTLE.halfX * 2, CASTLE.wallHeight, wallThickness), stone);
  north.position.set(CASTLE.x, CASTLE.floorY + CASTLE.wallHeight * .5, CASTLE.z + CASTLE.halfZ);
  root.add(north);

  const west = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, CASTLE.wallHeight, CASTLE.halfZ * 2), stone);
  west.position.set(CASTLE.x - CASTLE.halfX, CASTLE.floorY + CASTLE.wallHeight * .5, CASTLE.z);
  root.add(west);
  const east = west.clone();
  east.position.x = CASTLE.x + CASTLE.halfX;
  root.add(east);

  const frontPart = (CASTLE.halfX - CASTLE.gateHalf) * .5;
  const southLeft = new THREE.Mesh(new THREE.BoxGeometry(frontPart * 2, CASTLE.wallHeight, wallThickness), stone);
  southLeft.position.set(CASTLE.x - CASTLE.gateHalf - frontPart, CASTLE.floorY + CASTLE.wallHeight * .5, CASTLE.z - CASTLE.halfZ);
  root.add(southLeft);
  const southRight = southLeft.clone();
  southRight.position.x = CASTLE.x + CASTLE.gateHalf + frontPart;
  root.add(southRight);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(CASTLE.gateHalf * 2, 42, wallThickness), stone);
  lintel.position.set(CASTLE.x, CASTLE.floorY + CASTLE.wallHeight - 21, CASTLE.z - CASTLE.halfZ);
  root.add(lintel);

  const towerGeo = new THREE.CylinderGeometry(58, 68, CASTLE.wallHeight + 40, 12);
  const towerPositions = [
    [CASTLE.x - CASTLE.halfX, CASTLE.z - CASTLE.halfZ],
    [CASTLE.x + CASTLE.halfX, CASTLE.z - CASTLE.halfZ],
    [CASTLE.x - CASTLE.halfX, CASTLE.z + CASTLE.halfZ],
    [CASTLE.x + CASTLE.halfX, CASTLE.z + CASTLE.halfZ]
  ];
  for (const [x, z] of towerPositions) {
    const tower = new THREE.Mesh(towerGeo, stone);
    tower.position.set(x, CASTLE.floorY + (CASTLE.wallHeight + 40) * .5, z);
    root.add(tower);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(76, 70, 12), roofMat);
    roof.position.set(x, CASTLE.floorY + CASTLE.wallHeight + 75, z);
    root.add(roof);
  }

  const battlementGeo = new THREE.BoxGeometry(24, 22, 24);
  const battlements = new THREE.InstancedMesh(battlementGeo, stone, 72);
  battlements.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  const dummy = new THREE.Object3D();
  let count = 0;
  for (let x = -CASTLE.halfX + 24; x <= CASTLE.halfX - 24; x += 42) {
    for (const z of [-CASTLE.halfZ, CASTLE.halfZ]) {
      dummy.position.set(CASTLE.x + x, CASTLE.floorY + CASTLE.wallHeight + 11, CASTLE.z + z);
      dummy.updateMatrix();
      battlements.setMatrixAt(count++, dummy.matrix);
    }
  }
  for (let z = -CASTLE.halfZ + 35; z <= CASTLE.halfZ - 35; z += 42) {
    for (const x of [-CASTLE.halfX, CASTLE.halfX]) {
      dummy.position.set(CASTLE.x + x, CASTLE.floorY + CASTLE.wallHeight + 11, CASTLE.z + z);
      dummy.updateMatrix();
      battlements.setMatrixAt(count++, dummy.matrix);
    }
  }
  battlements.count = count;
  battlements.instanceMatrix.needsUpdate = true;
  root.add(battlements);

  const path = new THREE.Mesh(
    new THREE.BoxGeometry(CASTLE.gateHalf * 1.6, 2, 220),
    floorMat
  );
  path.position.set(CASTLE.x, CASTLE.floorY + 1, CASTLE.z - CASTLE.halfZ - 110);
  root.add(path);

  const portal = new THREE.Mesh(new THREE.PlaneGeometry(84, 108), glowMat);
  portal.position.set(CASTLE.x, CASTLE.floorY + 56, CASTLE.z - CASTLE.halfZ + 22);
  root.add(portal);

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(240, 60),
    new THREE.MeshBasicMaterial({ map: makeSignTexture(), side: THREE.DoubleSide })
  );
  sign.position.set(CASTLE.x, CASTLE.floorY + CASTLE.wallHeight + 72, CASTLE.z - CASTLE.halfZ - 18);
  root.add(sign);

  root.traverse(object => {
    if (!object.isMesh && !object.isInstancedMesh) return;
    object.castShadow = false;
    object.receiveShadow = false;
    object.frustumCulled = true;
    if (!object.isInstancedMesh) {
      object.matrixAutoUpdate = false;
      object.updateMatrix();
    }
  });
  game.city.add(root);
  window.__CASTLE_WORLD__ = { root, area: CASTLE };
}

function patchGround() {
  if (game.__castleGroundPatched) return;
  game.__castleGroundPatched = true;
  const previous = game.getGroundY.bind(game);
  game.getGroundY = function castleGround(x, y, z, strict = true) {
    const base = previous(x, y, z, strict);
    const inside = Math.abs(x - CASTLE.x) <= CASTLE.halfX + 42 && Math.abs(z - CASTLE.z) <= CASTLE.halfZ + 78;
    const path = Math.abs(x - CASTLE.x) <= CASTLE.gateHalf && z >= CASTLE.z - CASTLE.halfZ - 220 && z <= CASTLE.z - CASTLE.halfZ + 30;
    if (inside || path) return Math.max(Number.isFinite(base) ? base : -Infinity, CASTLE.floorY + 3);
    return base;
  };
}

function nearPortal() {
  if (!game?.playerContainer) return false;
  const p = game.playerContainer.position;
  return Math.hypot(p.x - CASTLE.x, p.z - (CASTLE.z - CASTLE.halfZ + 28)) <= CASTLE.launchRadius;
}

function enterWorld() {
  if (performance.now() < cooldownUntil) return;
  const p = game.playerContainer.position;
  const saved = { x: p.x, y: p.y, z: p.z, rotationY: game.playerContainer.rotation.y };
  try {
    sessionStorage.setItem('VICE_CASTLE_RETURN_POSITION', JSON.stringify(saved));
  } catch {}
  location.href = './castillo/mundo/index.html';
}

function restoreReturn() {
  const params = new URLSearchParams(location.search);
  const returning = params.get('from') === 'castillo' || sessionStorage.getItem('VICE_RETURN_FROM_CASTLE') === '1';
  if (!returning || !game?.playerContainer) return;
  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem('VICE_CASTLE_RETURN_POSITION') || 'null'); } catch {}
  const x = Number.isFinite(saved?.x) ? saved.x : CASTLE.x;
  const z = Number.isFinite(saved?.z) ? saved.z : CASTLE.z - CASTLE.halfZ - 80;
  const y = Math.max(CASTLE.floorY + 4, Number.isFinite(saved?.y) ? saved.y : CASTLE.floorY + 4);
  game.playerContainer.position.set(x, y, z);
  game.playerContainer.rotation.y = Number.isFinite(saved?.rotationY) ? saved.rotationY : 0;
  game.lastSafePlayerPosition?.copy(game.playerContainer.position);
  game.lastSafeGroundY = CASTLE.floorY + 3;
  if (game.state) {
    game.state.vy = 0;
    game.state.onGround = true;
    game.state.inWater = false;
  }
  cooldownUntil = performance.now() + 5000;
  try { sessionStorage.removeItem('VICE_RETURN_FROM_CASTLE'); } catch {}
  history.replaceState({}, '', location.pathname);
}

function keydown(event) {
  if (event.repeat || event.code !== 'KeyE' || !nearPortal()) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  enterWorld();
}

function monitor() {
  if (!prompt) return;
  if (nearPortal() && performance.now() >= cooldownUntil) {
    prompt.textContent = 'E · ENTRAR AL MUNDO DEL CASTILLO';
    prompt.style.display = 'block';
  } else {
    prompt.style.display = 'none';
  }
}

function install() {
  if (installed) return false;
  game = window.__VICE_CITY_GAME__;
  if (!game?.city || !game?.playerContainer || typeof game.getGroundY !== 'function') return false;
  installed = true;
  CASTLE.floorY = groundAt(CASTLE.x, CASTLE.z, 0);
  patchGround();
  buildCastle();
  createPrompt();
  restoreReturn();
  window.addEventListener('keydown', keydown, true);
  setInterval(monitor, 180);
  window.__CASTLE_WORLD_READY__ = true;
  window.dispatchEvent(new CustomEvent('castle-world-ready'));
  return true;
}

const wait = setInterval(() => {
  if (!install()) return;
  clearInterval(wait);
}, 120);

setTimeout(() => {
  clearInterval(wait);
  if (!window.__CASTLE_WORLD_READY__) {
    window.__CASTLE_WORLD_READY__ = true;
    window.dispatchEvent(new CustomEvent('castle-world-ready'));
  }
}, 10000);
