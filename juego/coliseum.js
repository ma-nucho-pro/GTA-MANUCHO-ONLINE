/**
 * GTA MANUCHO V84 — código del proyecto.
 * Creado e integrado por Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * ARKEA AI / Manucho · conserva LICENSE, NOTICE.md y estos créditos al reutilizar.
 */
import * as THREE from './bosque/libs/three.module.js';

THREE.Cache.enabled = true;
window.__COLISEUM_EXPECTED__ = true;
window.__COLISEUM_READY__ = false;

const WORLD_SCALE = 16;
const COLISEUM = {
  // Fuera del Parque del Retiro, sobre la isla firme situada al oeste/norte.
  logicalX: 900,
  logicalZ: 1600,
  x: 900 * WORLD_SCALE,
  z: 1600 * WORLD_SCALE,
  floorY: 0,
  outerRadius: 176,
  innerRadius: 94,
  wallHeight: 72,
  entranceHalf: 28,
  launchRadius: 58
};

let game = null;
let installed = false;
let prompt = null;
let lastTime = performance.now();
let promptTimer = 0;
let launching = false;
let brickTexture = null;

function makeSignTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 1024, 256);
  g.addColorStop(0, '#4b160d');
  g.addColorStop(.5, '#b35a18');
  g.addColorStop(1, '#4b160d');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 256);
  ctx.strokeStyle = '#ffd36b';
  ctx.lineWidth = 18;
  ctx.strokeRect(12, 12, 1000, 232);
  ctx.fillStyle = '#fff7df';
  ctx.textAlign = 'center';
  ctx.font = '900 82px Arial';
  ctx.fillText('COLISEO ROMANO', 512, 108);
  ctx.fillStyle = '#ffe07e';
  ctx.font = '800 38px Arial';
  ctx.fillText('PULSA E PARA JUGAR LA CARRERA', 512, 180);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 2;
  return texture;
}

function ensurePrompt() {
  let node = document.getElementById('coliseum-prompt');
  if (node) return node;
  node = document.createElement('div');
  node.id = 'coliseum-prompt';
  node.style.cssText = [
    'position:fixed','left:50%','bottom:148px','transform:translateX(-50%)','z-index:9100',
    'padding:10px 16px','border-radius:10px','background:rgba(26,9,3,.92)',
    'border:1px solid rgba(255,185,66,.86)','color:#fff7df','font:900 13px Arial,sans-serif',
    'letter-spacing:.05em','pointer-events:none','display:none','box-shadow:0 14px 38px rgba(0,0,0,.48)'
  ].join(';');
  document.body.appendChild(node);
  return node;
}

async function loadBrickTexture() {
  try {
    const loader = new THREE.TextureLoader();
    const texture = await loader.loadAsync(new URL('../assets/tutorial/brick_diffuse.jpg', import.meta.url).href);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 2);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(4, game?.renderer?.capabilities?.getMaxAnisotropy?.() || 2);
    return texture;
  } catch (error) {
    console.warn('[coliseum] No se pudo cargar la textura de ladrillo local.', error);
    return null;
  }
}

function resolveFloorY() {
  try {
    const y = game.getGroundY(COLISEUM.x, 900, COLISEUM.z, false);
    COLISEUM.floorY = Number.isFinite(y) ? y : 0;
  } catch {
    COLISEUM.floorY = 0;
  }
}

function clearFootprint() {
  if (!game?.city) return;
  game.city.updateMatrixWorld(true);
  const footprint = new THREE.Box3(
    new THREE.Vector3(COLISEUM.x - COLISEUM.outerRadius - 60, COLISEUM.floorY - 60, COLISEUM.z - COLISEUM.outerRadius - 180),
    new THREE.Vector3(COLISEUM.x + COLISEUM.outerRadius + 60, COLISEUM.floorY + 600, COLISEUM.z + COLISEUM.outerRadius + 60)
  );
  const box = new THREE.Box3();
  const size = new THREE.Vector3();
  const remove = [];
  for (const child of game.city.children) {
    if (!child || child.name?.includes('COLISEUM')) continue;
    try {
      box.setFromObject(child);
      box.getSize(size);
      if (box.intersectsBox(footprint) && size.y > 12 && size.x < 900 && size.z < 900) remove.push(child);
    } catch {}
  }
  for (const child of remove) child.parent?.remove(child);
}

function patchPhysics() {
  if (game.__coliseumPhysicsPatched) return;
  game.__coliseumPhysicsPatched = true;
  const oldGround = game.getGroundY.bind(game);
  game.getGroundY = function coliseumGround(x, y, z, strict = true) {
    const value = oldGround(x, y, z, strict);
    const dx = x - COLISEUM.x;
    const dz = z - COLISEUM.z;
    const distance = Math.hypot(dx, dz);
    const onApproach = Math.abs(dx) <= 48 && z >= COLISEUM.z - COLISEUM.outerRadius - 230 && z <= COLISEUM.z - COLISEUM.outerRadius + 18;
    if (distance <= COLISEUM.outerRadius + 28 || onApproach) {
      return Math.max(Number.isFinite(value) ? value : -Infinity, COLISEUM.floorY + 1.2);
    }
    return value;
  };

  const oldCollision = game.checkCollision.bind(game);
  game.checkCollision = function coliseumCollision(x, z, includeWorld = false, y = null, radius = null) {
    const r = Number.isFinite(radius) ? radius : 2;
    const lx = x - COLISEUM.x;
    const lz = z - COLISEUM.z;
    const distance = Math.hypot(lx, lz);
    const southEntrance = lz < -COLISEUM.innerRadius + 28 && Math.abs(lx) <= COLISEUM.entranceHalf + 10;
    if (!southEntrance && distance >= COLISEUM.innerRadius - r && distance <= COLISEUM.outerRadius + r) return true;
    if (distance < COLISEUM.innerRadius - r) return false;
    return oldCollision(x, z, includeWorld, y, radius);
  };
}

function makeStoneMaterial(color = 0xb77845) {
  return new THREE.MeshStandardMaterial({
    color,
    map: brickTexture,
    roughness: .92,
    metalness: .01
  });
}

function addRomanSteps(group, material) {
  const levels = 7;
  const segments = 64;
  const gapHalfAngle = .24;
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const steps = new THREE.InstancedMesh(geo, material, levels * segments);
  steps.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  steps.castShadow = false;
  steps.receiveShadow = true;
  const dummy = new THREE.Object3D();
  let index = 0;

  for (let level = 0; level < levels; level++) {
    const radius = COLISEUM.innerRadius + 10 + level * 9.5;
    const stepHeight = 3.2;
    const y = COLISEUM.floorY + 2.4 + level * stepHeight;
    const arcLength = Math.PI * 2 * radius / segments * .98;
    for (let i = 0; i < segments; i++) {
      const angle = i / segments * Math.PI * 2;
      const southDifference = Math.abs(Math.atan2(Math.sin(angle - Math.PI), Math.cos(angle - Math.PI)));
      if (southDifference < gapHalfAngle) continue;
      dummy.position.set(
        COLISEUM.x + Math.sin(angle) * radius,
        y,
        COLISEUM.z + Math.cos(angle) * radius
      );
      dummy.rotation.set(0, angle, 0);
      dummy.scale.set(arcLength, stepHeight, 8.5);
      dummy.updateMatrix();
      steps.setMatrixAt(index++, dummy.matrix);
    }
  }
  steps.count = index;
  steps.instanceMatrix.needsUpdate = true;
  group.add(steps);
}

function addRomanArcades(group, stoneMat, darkStone) {
  const columns = 40;
  const gapHalfAngle = .23;
  const columnGeo = new THREE.CylinderGeometry(4.6, 5.4, 46, 10);
  const columnMesh = new THREE.InstancedMesh(columnGeo, stoneMat, columns * 2);
  columnMesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  const archGeo = new THREE.BoxGeometry(15, 10, 20);
  const archMesh = new THREE.InstancedMesh(archGeo, darkStone, columns * 2);
  archMesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  const dummy = new THREE.Object3D();
  let colIndex = 0;
  let archIndex = 0;
  const radius = COLISEUM.outerRadius - 10;

  for (let level = 0; level < 2; level++) {
    const baseY = COLISEUM.floorY + 24 + level * 34;
    for (let i = 0; i < columns; i++) {
      const angle = i / columns * Math.PI * 2;
      const southDifference = Math.abs(Math.atan2(Math.sin(angle - Math.PI), Math.cos(angle - Math.PI)));
      if (southDifference < gapHalfAngle) continue;
      dummy.position.set(
        COLISEUM.x + Math.sin(angle) * radius,
        baseY,
        COLISEUM.z + Math.cos(angle) * radius
      );
      dummy.rotation.set(0, angle, 0);
      dummy.scale.set(1, level === 0 ? 1 : .72, 1);
      dummy.updateMatrix();
      columnMesh.setMatrixAt(colIndex++, dummy.matrix);

      dummy.position.y = baseY + (level === 0 ? 25 : 18);
      dummy.rotation.set(0, angle, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      archMesh.setMatrixAt(archIndex++, dummy.matrix);
    }
  }
  columnMesh.count = colIndex;
  archMesh.count = archIndex;
  columnMesh.instanceMatrix.needsUpdate = true;
  archMesh.instanceMatrix.needsUpdate = true;
  columnMesh.castShadow = false;
  columnMesh.receiveShadow = true;
  archMesh.castShadow = false;
  archMesh.receiveShadow = true;
  group.add(columnMesh, archMesh);
}

function buildColiseum() {
  resolveFloorY();
  clearFootprint();
  patchPhysics();

  const group = new THREE.Group();
  group.name = 'COLISEUM_ROMANO_CARRERAS_V43';
  group._isAlwaysVisible = true;

  const stoneMat = makeStoneMaterial(0xb98258);
  const darkStone = makeStoneMaterial(0x7f4b36);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x9b7852, roughness: 1, metalness: 0 });
  const trackMat = new THREE.MeshStandardMaterial({ color: 0x34363c, roughness: .98, metalness: .01 });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xffb532, toneMapped: false });

  // Plaza y base apoyadas sobre la isla firme, no sobre el agua.
  const plaza = new THREE.Mesh(
    new THREE.BoxGeometry(COLISEUM.outerRadius * 2 + 90, 8, COLISEUM.outerRadius * 2 + 120),
    new THREE.MeshStandardMaterial({ color: 0xa58b70, roughness: 1, metalness: 0 })
  );
  plaza.position.set(COLISEUM.x, COLISEUM.floorY - 2.8, COLISEUM.z - 18);
  plaza.name = 'COLISEUM_PLAZA_SOLIDA';
  group.add(plaza);

  const foundation = new THREE.Mesh(
    new THREE.CylinderGeometry(COLISEUM.outerRadius + 18, COLISEUM.outerRadius + 22, 14, 64),
    darkStone
  );
  foundation.position.set(COLISEUM.x, COLISEUM.floorY - 5.8, COLISEUM.z);
  foundation.name = 'COLISEUM_SOLID_FOUNDATION';
  group.add(foundation);

  const floor = new THREE.Mesh(
    new THREE.CylinderGeometry(COLISEUM.innerRadius - 4, COLISEUM.innerRadius - 4, 2.2, 64),
    floorMat
  );
  floor.position.set(COLISEUM.x, COLISEUM.floorY, COLISEUM.z);
  group.add(floor);

  const innerTrack = new THREE.Mesh(
    new THREE.RingGeometry(34, COLISEUM.innerRadius - 12, 64),
    trackMat
  );
  innerTrack.rotation.x = -Math.PI / 2;
  innerTrack.position.set(COLISEUM.x, COLISEUM.floorY + 1.2, COLISEUM.z);
  group.add(innerTrack);

  addRomanSteps(group, stoneMat);
  addRomanArcades(group, stoneMat, darkStone);

  // Cornisa superior.
  const cornice = new THREE.Mesh(
    new THREE.TorusGeometry(COLISEUM.outerRadius - 9, 5.5, 8, 96),
    darkStone
  );
  cornice.rotation.x = Math.PI / 2;
  cornice.position.set(COLISEUM.x, COLISEUM.floorY + COLISEUM.wallHeight + 16, COLISEUM.z);
  group.add(cornice);

  const gateLeft = new THREE.Mesh(new THREE.BoxGeometry(20, 66, 25), stoneMat);
  gateLeft.position.set(COLISEUM.x - COLISEUM.entranceHalf - 12, COLISEUM.floorY + 34, COLISEUM.z - COLISEUM.outerRadius + 9);
  group.add(gateLeft);
  const gateRight = gateLeft.clone();
  gateRight.position.x = COLISEUM.x + COLISEUM.entranceHalf + 12;
  group.add(gateRight);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(COLISEUM.entranceHalf * 2 + 44, 16, 25), darkStone);
  lintel.position.set(COLISEUM.x, COLISEUM.floorY + 63, COLISEUM.z - COLISEUM.outerRadius + 9);
  group.add(lintel);

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(150, 37),
    new THREE.MeshBasicMaterial({ map: makeSignTexture(), toneMapped: false })
  );
  sign.position.set(COLISEUM.x, COLISEUM.floorY + 88, COLISEUM.z - COLISEUM.outerRadius - 5);
  group.add(sign);

  // Camino de acceso unido a la isla firme.
  const entrancePath = new THREE.Mesh(new THREE.BoxGeometry(74, 2.2, 250), trackMat);
  entrancePath.position.set(COLISEUM.x, COLISEUM.floorY + .3, COLISEUM.z - COLISEUM.outerRadius - 112);
  entrancePath.name = 'CAMINO_FIRME_AL_COLISEO';
  group.add(entrancePath);

  const portal = new THREE.Mesh(
    new THREE.CylinderGeometry(28, 28, .8, 40),
    new THREE.MeshBasicMaterial({ color: 0xffa41d, transparent: true, opacity: .42, toneMapped: false })
  );
  portal.position.set(COLISEUM.x, COLISEUM.floorY + 1.6, COLISEUM.z);
  portal.name = 'COLISEUM_RACE_PORTAL';
  group.add(portal);

  for (let i = 0; i < 12; i++) {
    const angle = i / 12 * Math.PI * 2;
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(3.5, 10, 8), glowMat);
    lamp.position.set(
      COLISEUM.x + Math.sin(angle) * (COLISEUM.innerRadius - 7),
      COLISEUM.floorY + 13,
      COLISEUM.z + Math.cos(angle) * (COLISEUM.innerRadius - 7)
    );
    group.add(lamp);
  }

  group.traverse(object => {
    if (!object.isMesh && !object.isInstancedMesh) return;
    object.castShadow = false;
    object.receiveShadow = true;
  });
  game.city.add(group);
  window.__VICE_COLISEUM__ = { group, area: COLISEUM };
}

function readReturnPosition() {
  try {
    const saved = JSON.parse(sessionStorage.getItem('vice-coliseum-return') || 'null');
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.z)) return saved;
  } catch {}
  return { x: COLISEUM.x, y: COLISEUM.floorY + 2.2, z: COLISEUM.z - 40, rotationY: 0 };
}

function applyReturn(saved) {
  if (!game?.playerContainer) return;
  const x = Number.isFinite(saved.x) ? saved.x : COLISEUM.x;
  const z = Number.isFinite(saved.z) ? saved.z : COLISEUM.z - 40;
  const y = Math.max(COLISEUM.floorY + 2.1, Number.isFinite(saved.y) ? saved.y : COLISEUM.floorY + 2.2);
  game.playerContainer.position.set(x, y, z);
  if (Number.isFinite(saved.rotationY)) game.playerContainer.rotation.y = saved.rotationY;
  game.lastSafePlayerPosition?.set(x, y, z);
  game.lastSafeGroundY = COLISEUM.floorY + 1.1;
  if (game.state) {
    game.state.vy = 0;
    game.state.onGround = true;
    game.state.inWater = false;
    game.state.isSubmerged = false;
    game.state.isFlying = false;
  }
  window.__COLISEUM_RETURN_COOLDOWN_UNTIL__ = performance.now() + 5000;
}

function restoreFromRace() {
  const params = new URLSearchParams(location.search);
  let pending = false;
  try { pending = sessionStorage.getItem('vice-coliseum-return-pending') === '1'; } catch {}
  if (params.get('from') !== 'coliseum' && !pending) return;
  const saved = readReturnPosition();
  applyReturn(saved);
  setTimeout(() => applyReturn(saved), 350);
  setTimeout(() => applyReturn(saved), 1200);
  setTimeout(() => applyReturn(saved), 2800);
  setTimeout(() => {
    try {
      sessionStorage.removeItem('vice-coliseum-return-pending');
      sessionStorage.removeItem('vice-coliseum-return');
    } catch {}
  }, 3800);
}

function distanceToCenter() {
  if (!game?.playerContainer) return Infinity;
  return Math.hypot(game.playerContainer.position.x - COLISEUM.x, game.playerContainer.position.z - COLISEUM.z);
}

function launchRace() {
  if (launching || !game?.playerContainer) return;
  launching = true;
  prompt.textContent = 'ENTRANDO A LA CARRERA…';
  prompt.style.display = 'block';
  try {
    const p = game.playerContainer.position;
    sessionStorage.setItem('vice-coliseum-return', JSON.stringify({
      x: p.x,
      y: p.y,
      z: p.z,
      rotationY: game.playerContainer.rotation.y
    }));
    sessionStorage.setItem('vice-coliseum-return-pending', '1');
  } catch {}
  setTimeout(() => window.location.assign('./coliseo/carrera/index.html?from=vicecity'), 120);
}

function onKeyDown(event) {
  if (event.repeat || event.code !== 'KeyE') return;
  if (distanceToCenter() > COLISEUM.launchRadius) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  launchRace();
}

function updatePrompt() {
  const distance = distanceToCenter();
  if (distance > COLISEUM.outerRadius + 90) {
    prompt.style.display = 'none';
    return;
  }
  prompt.textContent = distance <= COLISEUM.launchRadius
    ? 'PULSA E PARA JUGAR LA CARRERA'
    : 'ENTRA AL CENTRO DEL COLISEO Y PULSA E';
  prompt.style.display = 'block';
}

function frame(now = performance.now()) {
  requestAnimationFrame(frame);
  const dt = Math.min(.1, Math.max(0, (now - lastTime) / 1000));
  lastTime = now;
  promptTimer += dt;
  if (promptTimer >= .2) {
    promptTimer = 0;
    updatePrompt();
  }
}

async function install() {
  if (installed) return;
  game = window.__VICE_CITY_GAME__;
  if (!game?.city || !game?.playerContainer || typeof game.getGroundY !== 'function') return;
  installed = true;
  prompt = ensurePrompt();
  brickTexture = await loadBrickTexture();
  buildColiseum();
  restoreFromRace();
  window.addEventListener('keydown', onKeyDown, true);
  window.__COLISEUM_READY__ = true;
  window.dispatchEvent(new CustomEvent('coliseum-ready'));
  requestAnimationFrame(frame);
}

const wait = setInterval(() => {
  game = window.__VICE_CITY_GAME__ || game;
  if (!game?.city || !game?.playerContainer) return;
  clearInterval(wait);
  install().catch(error => {
    console.error('[coliseum] No se pudo construir el coliseo.', error);
    window.__COLISEUM_READY__ = true;
    window.dispatchEvent(new CustomEvent('coliseum-ready'));
  });
}, 60);

setTimeout(() => {
  clearInterval(wait);
  if (!window.__COLISEUM_READY__) {
    window.__COLISEUM_READY__ = true;
    window.dispatchEvent(new CustomEvent('coliseum-ready'));
  }
}, 26000);
