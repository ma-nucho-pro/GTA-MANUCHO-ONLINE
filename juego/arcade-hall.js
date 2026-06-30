/**
 * GTA MANUCHO V84 — código del proyecto.
 * Creado e integrado por Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * ARKEA AI / Manucho · conserva LICENSE, NOTICE.md y estos créditos al reutilizar.
 */
import * as THREE from './bosque/libs/three.module.js';

THREE.Cache.enabled = true;
window.__ARCADE_HALL_EXPECTED__ = true;
window.__ARCADE_HALL_READY__ = false;

const ARCADE = {
  x: 930,
  z: 1060,
  floorY: 0.55,
  halfX: 118,
  halfZ: 92,
  wallHeight: 62,
  wallThickness: 7,
  doorHalf: 27
};

const COMPUTERS = [
  {
    id: 'machete',
    title: 'CORTAR MACHETE',
    subtitle: 'Simulador GTA MANUCHO',
    x: ARCADE.x - 52,
    z: ARCADE.z + 18,
    color: 0xff8a24,
    target: './arcade/machete/index.html?from=vicecity'
  },
  {
    id: 'slowroads',
    title: 'MANEJAR COCHE',
    subtitle: 'Slow Roads',
    x: ARCADE.x + 52,
    z: ARCADE.z + 18,
    color: 0x35b8ff,
    target: './arcade/slow-roads/index.html?from=vicecity'
  }
];

let game = null;
let installed = false;
let prompt = null;
let nearestComputer = null;
let promptTimer = 0;
let lastTime = performance.now();
let autoComputer = null;
let autoEnterTimer = 0;
let launchingGame = false;

function makeCanvasTexture(title, subtitle, accent = '#39c6ff', width = 768, height = 432) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#07111e');
  gradient.addColorStop(1, '#151124');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 18;
  ctx.strokeRect(18, 18, width - 36, height - 36);
  ctx.fillStyle = accent;
  ctx.textAlign = 'center';
  ctx.font = '900 72px Arial';
  ctx.fillText(title, width / 2, 190);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 38px Arial';
  ctx.fillText(subtitle, width / 2, 255);
  ctx.fillStyle = '#b8c7d9';
  ctx.font = '700 27px Arial';
  ctx.fillText('ACÉRCATE Y PULSA E', width / 2, 335);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 2;
  return texture;
}

function makeSignTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 1024, 256);
  gradient.addColorStop(0, '#26113f');
  gradient.addColorStop(.5, '#0a3856');
  gradient.addColorStop(1, '#26113f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 256);
  ctx.strokeStyle = '#5de5ff';
  ctx.lineWidth = 16;
  ctx.strokeRect(12, 12, 1000, 232);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = '900 82px Arial';
  ctx.fillText('SALÓN DE JUEGOS', 512, 112);
  ctx.fillStyle = '#ffdd6b';
  ctx.font = '800 35px Arial';
  ctx.fillText('FUERA DEL PARQUE DEL RETIRO', 512, 178);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 2;
  return texture;
}

function ensurePrompt() {
  let node = document.getElementById('arcade-computer-prompt');
  if (node) return node;
  node = document.createElement('div');
  node.id = 'arcade-computer-prompt';
  node.style.cssText = [
    'position:fixed','left:50%','bottom:112px','transform:translateX(-50%)','z-index:9000',
    'padding:10px 16px','border-radius:10px','background:rgba(8,8,20,.92)',
    'border:1px solid rgba(93,229,255,.78)','color:#fff','font:900 13px Arial,sans-serif',
    'letter-spacing:.045em','pointer-events:none','display:none','box-shadow:0 14px 38px rgba(0,0,0,.48)'
  ].join(';');
  document.body.appendChild(node);
  return node;
}

function clearExistingTallObjects() {
  if (!game?.city) return;
  game.city.updateMatrixWorld(true);
  const footprint = new THREE.Box3(
    new THREE.Vector3(ARCADE.x - ARCADE.halfX - 22, -20, ARCADE.z - ARCADE.halfZ - 82),
    new THREE.Vector3(ARCADE.x + ARCADE.halfX + 22, 600, ARCADE.z + ARCADE.halfZ + 22)
  );
  const box = new THREE.Box3();
  const size = new THREE.Vector3();
  const remove = [];
  for (const child of game.city.children) {
    if (!child?.isMesh || child.name?.includes('ARCADE')) continue;
    try {
      box.setFromObject(child);
      box.getSize(size);
      if (!box.intersectsBox(footprint)) continue;
      if (size.y > 14 && size.x < 520 && size.z < 520) remove.push(child);
    } catch {}
  }
  for (const child of remove) {
    child.visible = false;
    child.parent?.remove(child);
  }
}

function patchArcadeGroundAndCollision() {
  if (game.__arcadePhysicsPatched) return;
  game.__arcadePhysicsPatched = true;

  const oldGround = game.getGroundY.bind(game);
  game.getGroundY = function arcadeGround(x, y, z, strict = true) {
    const value = oldGround(x, y, z, strict);
    if (
      x >= ARCADE.x - ARCADE.halfX && x <= ARCADE.x + ARCADE.halfX &&
      z >= ARCADE.z - ARCADE.halfZ && z <= ARCADE.z + ARCADE.halfZ
    ) {
      return Math.max(Number.isFinite(value) ? value : -Infinity, ARCADE.floorY + 1.1);
    }
    return value;
  };

  const oldCollision = game.checkCollision.bind(game);
  game.checkCollision = function arcadeCollision(x, z, includeWorld = false, y = null, radius = null) {
    const r = Number.isFinite(radius) ? radius : 2;
    const lx = x - ARCADE.x;
    const lz = z - ARCADE.z;
    const entranceCorridor = Math.abs(lx) <= ARCADE.doorHalf + 10 &&
      lz >= -ARCADE.halfZ - 78 && lz <= -ARCADE.halfZ + ARCADE.wallThickness;
    if (entranceCorridor) return false;
    const insideExpanded = Math.abs(lx) <= ARCADE.halfX + ARCADE.wallThickness + r &&
      Math.abs(lz) <= ARCADE.halfZ + ARCADE.wallThickness + r;
    if (insideExpanded) {
      const nearWest = Math.abs(lx + ARCADE.halfX) <= ARCADE.wallThickness + r;
      const nearEast = Math.abs(lx - ARCADE.halfX) <= ARCADE.wallThickness + r;
      const nearNorth = Math.abs(lz - ARCADE.halfZ) <= ARCADE.wallThickness + r;
      const nearSouth = Math.abs(lz + ARCADE.halfZ) <= ARCADE.wallThickness + r;
      const inDoor = Math.abs(lx) <= ARCADE.doorHalf - r * .25;
      if (nearWest || nearEast || nearNorth || (nearSouth && !inDoor)) return true;
      // Dentro del salón se ignoran los obstáculos procedurales antiguos que
      // pudieran haberse generado antes de construir el local.
      if (Math.abs(lx) < ARCADE.halfX && Math.abs(lz) < ARCADE.halfZ) return false;
    }
    return oldCollision(x, z, includeWorld, y, radius);
  };
}

function createComputer(computer) {
  const root = new THREE.Group();
  root.name = `ARCADE_PC_${computer.id.toUpperCase()}`;
  root.position.set(computer.x, ARCADE.floorY + 1.1, computer.z);

  const deskMat = new THREE.MeshStandardMaterial({ color: 0x252b35, roughness: .86, metalness: .12 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x111722, roughness: .45, metalness: .55 });
  const accent = `#${computer.color.toString(16).padStart(6, '0')}`;
  const screenMat = new THREE.MeshBasicMaterial({ map: makeCanvasTexture(computer.title, computer.subtitle, accent), toneMapped: false });

  const desk = new THREE.Mesh(new THREE.BoxGeometry(72, 5, 38), deskMat);
  desk.position.set(0, 24, 0);
  root.add(desk);
  for (const x of [-29, 29]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(5, 24, 5), metalMat);
    leg.position.set(x, 12, 10);
    root.add(leg);
  }
  const monitor = new THREE.Mesh(new THREE.BoxGeometry(55, 34, 4), metalMat);
  monitor.position.set(0, 46, -5);
  root.add(monitor);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(49, 28), screenMat);
  screen.position.set(0, 46, -7.05);
  screen.rotation.y = Math.PI;
  root.add(screen);
  const stand = new THREE.Mesh(new THREE.BoxGeometry(5, 17, 5), metalMat);
  stand.position.set(0, 32, -2);
  root.add(stand);
  const keyboard = new THREE.Mesh(new THREE.BoxGeometry(40, 2, 13), metalMat);
  keyboard.position.set(0, 27.5, 9);
  keyboard.rotation.x = -.08;
  root.add(keyboard);
  const tower = new THREE.Mesh(new THREE.BoxGeometry(14, 30, 30), metalMat);
  tower.position.set(27, 11, -3);
  root.add(tower);
  const light = new THREE.Mesh(
    new THREE.BoxGeometry(3, 3, .7),
    new THREE.MeshBasicMaterial({ color: computer.color, toneMapped: false })
  );
  light.position.set(27, 15, -18.3);
  root.add(light);

  root.rotation.y = 0;
  root.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = false;
    object.receiveShadow = true;
  });
  return root;
}

function buildArcadeHall() {
  clearExistingTallObjects();
  patchArcadeGroundAndCollision();

  const hall = new THREE.Group();
  hall.name = 'ARCADE_HALL_OUTSIDE_RETIRO_V41';
  hall._isAlwaysVisible = true;

  const floorMat = new THREE.MeshStandardMaterial({ color: 0x2c3140, roughness: .9, metalness: .03 });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x7250a3, roughness: .76, metalness: .04 });
  const trimMat = new THREE.MeshBasicMaterial({ color: 0x5de5ff, toneMapped: false });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x161a26, roughness: .82, metalness: .08 });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(ARCADE.halfX * 2, 2.2, ARCADE.halfZ * 2), floorMat);
  floor.position.set(ARCADE.x, ARCADE.floorY, ARCADE.z);
  floor.name = 'ARCADE_SOLID_FLOOR';
  hall.add(floor);

  const h = ARCADE.wallHeight;
  const t = ARCADE.wallThickness;
  const wallY = ARCADE.floorY + h * .5 + 1.1;
  const back = new THREE.Mesh(new THREE.BoxGeometry(ARCADE.halfX * 2, h, t), wallMat);
  back.position.set(ARCADE.x, wallY, ARCADE.z + ARCADE.halfZ);
  hall.add(back);
  const left = new THREE.Mesh(new THREE.BoxGeometry(t, h, ARCADE.halfZ * 2), wallMat);
  left.position.set(ARCADE.x - ARCADE.halfX, wallY, ARCADE.z);
  hall.add(left);
  const right = left.clone();
  right.position.x = ARCADE.x + ARCADE.halfX;
  hall.add(right);

  const frontPartWidth = ARCADE.halfX - ARCADE.doorHalf;
  const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(frontPartWidth, h, t), wallMat);
  frontLeft.position.set(ARCADE.x - (ARCADE.doorHalf + frontPartWidth * .5), wallY, ARCADE.z - ARCADE.halfZ);
  hall.add(frontLeft);
  const frontRight = frontLeft.clone();
  frontRight.position.x = ARCADE.x + (ARCADE.doorHalf + frontPartWidth * .5);
  hall.add(frontRight);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(ARCADE.doorHalf * 2, 17, t), wallMat);
  lintel.position.set(ARCADE.x, ARCADE.floorY + h - 7.5, ARCADE.z - ARCADE.halfZ);
  hall.add(lintel);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(ARCADE.halfX * 2 + 8, 4, ARCADE.halfZ * 2 + 8), roofMat);
  roof.position.set(ARCADE.x, ARCADE.floorY + h + 4, ARCADE.z);
  hall.add(roof);

  const trim = new THREE.Mesh(new THREE.BoxGeometry(ARCADE.halfX * 2 + 4, 2.5, 3), trimMat);
  trim.position.set(ARCADE.x, ARCADE.floorY + h - 1, ARCADE.z - ARCADE.halfZ - 4.1);
  hall.add(trim);

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(128, 32),
    new THREE.MeshBasicMaterial({ map: makeSignTexture(), toneMapped: false })
  );
  sign.position.set(ARCADE.x, ARCADE.floorY + h - 19, ARCADE.z - ARCADE.halfZ - 4.2);
  hall.add(sign);

  const walkway = new THREE.Mesh(new THREE.BoxGeometry(58, 1, 68), floorMat);
  walkway.position.set(ARCADE.x, ARCADE.floorY + .2, ARCADE.z - ARCADE.halfZ - 34);
  hall.add(walkway);

  for (const computer of COMPUTERS) hall.add(createComputer(computer));

  // Bancos laterales y pequeñas luces sin sombras para mantener el rendimiento.
  for (const x of [ARCADE.x - 82, ARCADE.x + 82]) {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(42, 8, 20), roofMat);
    bench.position.set(x, ARCADE.floorY + 8, ARCADE.z - 20);
    hall.add(bench);
  }
  for (const x of [ARCADE.x - 70, ARCADE.x, ARCADE.x + 70]) {
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(4, 10, 8), trimMat);
    lamp.position.set(x, ARCADE.floorY + h - 6, ARCADE.z - 10);
    hall.add(lamp);
  }

  hall.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = false;
    object.receiveShadow = true;
  });
  game.city.add(hall);
  window.__ARCADE_HALL__ = { hall, computers: COMPUTERS, area: ARCADE };
}

function readArcadeReturnPosition() {
  try {
    const saved = JSON.parse(sessionStorage.getItem('vice-arcade-return') || 'null');
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.z)) return saved;
  } catch {}
  return { x: ARCADE.x, y: ARCADE.floorY + 2.2, z: ARCADE.z - 18, rotationY: 0 };
}

function applyArcadeReturn(saved) {
  if (!game?.playerContainer || !saved) return;
  const x = Number.isFinite(saved.x) ? saved.x : ARCADE.x;
  const z = Number.isFinite(saved.z) ? saved.z : ARCADE.z - 18;
  const y = Math.max(ARCADE.floorY + 2.1, Number.isFinite(saved.y) ? saved.y : ARCADE.floorY + 2.2);
  game.playerContainer.position.set(x, y, z);
  if (Number.isFinite(saved.rotationY)) game.playerContainer.rotation.y = saved.rotationY;
  game.lastSafePlayerPosition?.set(x, y, z);
  game.lastSafeGroundY = ARCADE.floorY + 1.1;
  if (game.state) {
    game.state.vy = 0;
    game.state.onGround = true;
    game.state.inWater = false;
    game.state.isSubmerged = false;
    game.state.isFlying = false;
  }
  // Evita que la computadora vuelva a abrirse automáticamente nada más regresar.
  window.__ARCADE_RETURN_LOCK__ = { x, z };
  window.__ARCADE_RETURN_COOLDOWN_UNTIL__ = performance.now() + 8000;
}

function restoreFromArcade() {
  const params = new URLSearchParams(location.search);
  let pending = false;
  try { pending = sessionStorage.getItem('vice-arcade-return-pending') === '1'; } catch {}
  if ((params.get('from') !== 'arcade' && !pending) || !game?.playerContainer) return;

  const saved = readArcadeReturnPosition();
  // Se aplica varias veces durante el arranque para que la posición inicial del
  // juego base no vuelva a mandar al jugador al comienzo después de la carga.
  applyArcadeReturn(saved);
  setTimeout(() => applyArcadeReturn(saved), 350);
  setTimeout(() => applyArcadeReturn(saved), 1200);
  setTimeout(() => applyArcadeReturn(saved), 2800);
  setTimeout(() => {
    try {
      sessionStorage.removeItem('vice-arcade-return-pending');
      sessionStorage.removeItem('vice-arcade-return');
    } catch {}
  }, 3600);

  params.delete('from');
  params.delete('game');
  const query = params.toString();
  history.replaceState({}, '', `${location.pathname}${query ? `?${query}` : ''}`);
}

function findNearestComputer(maxDistance = 34) {
  if (!game?.playerContainer) return null;
  const p = game.playerContainer.position;
  let nearest = null;
  let bestSq = maxDistance * maxDistance;
  for (const computer of COMPUTERS) {
    const dx = p.x - computer.x;
    const dz = p.z - computer.z;
    const distanceSq = dx * dx + dz * dz;
    if (distanceSq < bestSq) {
      bestSq = distanceSq;
      nearest = computer;
    }
  }
  return nearest;
}

function distanceToComputer(computer) {
  if (!computer || !game?.playerContainer) return Infinity;
  const p = game.playerContainer.position;
  return Math.hypot(p.x - computer.x, p.z - computer.z);
}

function updatePrompt() {
  nearestComputer = findNearestComputer();
  if (!nearestComputer) {
    prompt.style.display = 'none';
    return;
  }
  const distance = distanceToComputer(nearestComputer);
  prompt.textContent = distance <= 13
    ? `ENTRANDO A ${nearestComputer.title}…`
    : `ACÉRCATE MÁS O PULSA E · ${nearestComputer.title}`;
  prompt.style.display = 'block';
}

function launchComputer(computer) {
  if (!computer || launchingGame) return;
  launchingGame = true;
  prompt.textContent = `ABRIENDO ${computer.title}…`;
  prompt.style.display = 'block';
  try {
    const p = game.playerContainer.position;
    sessionStorage.setItem('vice-arcade-return', JSON.stringify({
      x: p.x,
      y: p.y,
      z: p.z,
      rotationY: game.playerContainer.rotation.y,
      computer: computer.id
    }));
    sessionStorage.setItem('vice-arcade-return-pending', '1');
  } catch {}
  setTimeout(() => window.location.assign(computer.target), 120);
}

function onKeyDown(event) {
  if (event.repeat || event.code !== 'KeyE') return;
  const computer = findNearestComputer();
  if (!computer) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  launchComputer(computer);
}

function frame(now = performance.now()) {
  requestAnimationFrame(frame);
  const dt = Math.min(.1, Math.max(0, (now - lastTime) / 1000));
  lastTime = now;
  promptTimer += dt;
  if (promptTimer >= .18) {
    promptTimer = 0;
    updatePrompt();
  }

  const returnLock = window.__ARCADE_RETURN_LOCK__;
  if (returnLock && game?.playerContainer) {
    const p = game.playerContainer.position;
    if (Math.hypot(p.x - returnLock.x, p.z - returnLock.z) > 22) {
      window.__ARCADE_RETURN_LOCK__ = null;
    }
  }
  const autoBlocked = performance.now() < (window.__ARCADE_RETURN_COOLDOWN_UNTIL__ || 0) || Boolean(window.__ARCADE_RETURN_LOCK__);
  const closeComputer = autoBlocked ? null : findNearestComputer(13);
  if (closeComputer && !launchingGame) {
    if (autoComputer !== closeComputer) {
      autoComputer = closeComputer;
      autoEnterTimer = 0;
    }
    autoEnterTimer += dt;
    if (autoEnterTimer >= .7) launchComputer(closeComputer);
  } else {
    autoComputer = null;
    autoEnterTimer = 0;
  }
}

function install() {
  if (installed) return;
  game = window.__VICE_CITY_GAME__;
  if (!game?.city || !game?.playerContainer || typeof game.getGroundY !== 'function') return;
  installed = true;
  prompt = ensurePrompt();
  buildArcadeHall();
  restoreFromArcade();
  window.addEventListener('keydown', onKeyDown, true);
  window.__ARCADE_HALL_READY__ = true;
  window.dispatchEvent(new CustomEvent('arcade-hall-ready'));
  requestAnimationFrame(frame);
}

const wait = setInterval(() => {
  game = window.__VICE_CITY_GAME__ || game;
  if (!game?.city || !game?.playerContainer) return;
  clearInterval(wait);
  try { install(); }
  catch (error) {
    console.error('[arcade-hall] No se pudo construir el salón.', error);
    window.__ARCADE_HALL_READY__ = true;
    window.dispatchEvent(new CustomEvent('arcade-hall-ready'));
  }
}, 60);

setTimeout(() => {
  clearInterval(wait);
  if (!window.__ARCADE_HALL_READY__) {
    window.__ARCADE_HALL_READY__ = true;
    window.dispatchEvent(new CustomEvent('arcade-hall-ready'));
  }
}, 18000);
