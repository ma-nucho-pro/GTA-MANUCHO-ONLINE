import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const DEFINITIONS = {
  JET: { file: '../aircraft-assets/jet_sf1.glb', label: 'SF1', length: 13, yaw: 0, maxSpeed: 42, helicopter: false, forwardSign: -1 },
  HELICOPTER: { file: '../aircraft-assets/helicopter_u1h.glb', label: 'U1H', length: 17, yaw: 0, maxSpeed: 25, helicopter: true, forwardSign: -1 },
  PLANE: { file: '../aircraft-assets/plane_fm2.glb', label: 'FM2', length: 16, yaw: Math.PI, maxSpeed: 36, helicopter: false, forwardSign: 1 },
  FLY: { file: '../aircraft-assets/fly_md5.glb', label: 'MD5', length: 14, yaw: 0, maxSpeed: 24, helicopter: true, forwardSign: -1 }
};

const entries = [];
const cache = new Map();
const keys = Object.create(null);
const box = new THREE.Box3();
const size = new THREE.Vector3();
const center = new THREE.Vector3();
const a = new THREE.Vector3();
const b = new THREE.Vector3();
const c = new THREE.Vector3();
const yAxis = new THREE.Vector3(0, 1, 0);
const projectileGeometry = new THREE.SphereGeometry(.13, 7, 5);
const projectileMaterial = new THREE.MeshBasicMaterial({ color: 0xffd54a });
const projectiles = [];
const PROJECTILE_LIMIT = 32;
let context = null;
let active = null;
let cameraMode = 0;
let prompt = null;
let notice = null;
let commandBuffer = '';
let commandTimer = 0;
let mixerAccumulator = 0;
let crosshair = null;
let fireCooldown = 0;

function framePause() {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

function makeUi() {
  prompt = document.createElement('div');
  prompt.style.cssText = 'position:fixed;left:50%;bottom:104px;transform:translateX(-50%);z-index:40;padding:9px 14px;border-radius:10px;background:rgba(30,18,8,.9);border:1px solid #ffc96b;color:#fff1c4;font:800 13px Arial;display:none;pointer-events:none';
  document.body.appendChild(prompt);
  notice = document.createElement('div');
  notice.style.cssText = 'position:fixed;left:50%;top:84px;transform:translateX(-50%);z-index:42;padding:10px 16px;border-radius:10px;background:rgba(18,10,5,.92);border:1px solid #ffc96b;color:#fff1c4;font:900 13px Arial;display:none;pointer-events:none';
  document.body.appendChild(notice);
  crosshair = document.createElement('div');
  crosshair.textContent = '+';
  crosshair.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:41;color:#fff1a8;font:900 32px Arial;text-shadow:0 0 8px #ff9f00,0 0 2px #000;display:none;pointer-events:none';
  document.body.appendChild(crosshair);
}

function showNotice(text, duration = 2600) {
  notice.textContent = text;
  notice.style.display = 'block';
  clearTimeout(notice.__timer);
  notice.__timer = setTimeout(() => { notice.style.display = 'none'; }, duration);
}

function normalize(scene, def) {
  const visual = scene.clone(true);
  visual.position.set(0, 0, 0);
  visual.rotation.set(0, def.yaw, 0);
  visual.scale.set(1, 1, 1);
  visual.updateMatrixWorld(true);
  visual.traverse(object => {
    if (!object.isMesh && !object.isSkinnedMesh) return;
    object.castShadow = false;
    object.receiveShadow = false;
    object.frustumCulled = true;
  });
  box.setFromObject(visual);
  box.getSize(size);
  visual.scale.setScalar(def.length / Math.max(size.x, size.z, .001));
  visual.updateMatrixWorld(true);
  box.setFromObject(visual);
  box.getCenter(center);
  visual.position.x -= center.x;
  visual.position.z -= center.z;
  visual.position.y -= box.min.y;
  visual.updateMatrixWorld(true);
  const root = new THREE.Group();
  root.add(visual);
  root.updateMatrixWorld(true);
  box.setFromObject(root);
  box.getSize(size);
  return { root, visual, length: Math.max(size.x, size.z), width: Math.min(size.x, size.z), height: size.y };
}

async function load(code) {
  if (cache.has(code)) return cache.get(code);
  const def = DEFINITIONS[code];
  const promise = new GLTFLoader().loadAsync(def.file).then(gltf => ({ gltf, def }));
  cache.set(code, promise);
  return promise;
}

async function create(code, x, z, yaw = 0, cheat = false) {
  const { gltf, def } = await load(code);
  const prepared = normalize(gltf.scene, def);
  const y = context.sampleHeight(x, z) + .3;
  const entry = {
    code, def, ...prepared, speed: 0, verticalSpeed: 0, mixer: null, cheat, pitch: 0, roll: 0
  };
  entry.root.name = `DESERT_AIRCRAFT_${code}_${entries.length}`;
  entry.root.position.set(x, y, z);
  entry.root.rotation.order = 'YXZ';
  entry.root.rotation.set(0, yaw, 0);
  entry.root.userData.aircraftEntry = entry;
  context.scene.add(entry.root);
  const clips = gltf.animations.filter(clip => /rotor|propeller|spinner|hub/i.test(clip.name));
  if (clips.length) {
    entry.mixer = new THREE.AnimationMixer(entry.visual);
    for (const clip of clips) entry.mixer.clipAction(clip).play();
  }
  entries.push(entry);
  return entry;
}

function nearest(maxDistance = 5.5) {
  const p = context.playerRoot.position;
  let best = null;
  let bestSq = maxDistance * maxDistance;
  for (const entry of entries) {
    if (entry === active) continue;
    const sq = entry.root.position.distanceToSquared(p);
    if (sq < bestSq) { bestSq = sq; best = entry; }
  }
  return best ? { entry: best, distance: Math.sqrt(bestSq) } : null;
}

function enter(entry) {
  if (!entry || active) return;
  active = entry;
  cameraMode = 0;
  entry.speed = 0;
  entry.verticalSpeed = 0;
  entry.pitch = entry.root.rotation.x || 0;
  entry.roll = entry.root.rotation.z || 0;
  context.setPlayerVisible(false);
  crosshair.style.display = 'block';
  showNotice(`${entry.def.label} · W/S VELOCIDAD · A/D GIRAR · ↑/↓ APUNTAR · Q/R INCLINAR · F O CLIC DISPARAR · E SALIR`, 6200);
}

function exit() {
  if (!active) return;
  const entry = active;
  a.set(entry.width * .8, 0, 0).applyQuaternion(entry.root.quaternion);
  const x = entry.root.position.x + a.x;
  const z = entry.root.position.z + a.z;
  context.playerRoot.position.set(x, context.sampleHeight(x, z) + .05, z);
  context.playerRoot.rotation.y = entry.root.rotation.y;
  context.setPlayerVisible(true);
  active = null;
  cameraMode = 0;
  crosshair.style.display = 'none';
  showNotice('BAJASTE DE LA AERONAVE');
}

async function spawn(code) {
  showNotice(`CARGANDO ${DEFINITIONS[code].label}…`, 3500);
  const yaw = context.playerRoot.rotation.y;
  a.set(0, 0, -1).applyAxisAngle(yAxis, yaw).multiplyScalar(9);
  const x = context.playerRoot.position.x + a.x;
  const z = context.playerRoot.position.z + a.z;
  const entry = await create(code, x, z, yaw, true);
  showNotice(`${code} APARECIÓ DELANTE · PULSA E PARA SUBIR`, 4000);
  return entry;
}

function acquireProjectile() {
  let projectile = projectiles.find(item => !item.active);
  if (!projectile && projectiles.length < PROJECTILE_LIMIT) {
    const mesh = new THREE.Mesh(projectileGeometry, projectileMaterial);
    mesh.visible = false;
    context.scene.add(mesh);
    projectile = { mesh, velocity: new THREE.Vector3(), life: 0, active: false };
    projectiles.push(projectile);
  }
  return projectile || null;
}

function fireWeapon() {
  if (!active || fireCooldown > 0) return;
  const projectile = acquireProjectile();
  if (!projectile) return;
  active.root.updateWorldMatrix(true, false);
  const forwardSign = active.def.forwardSign ?? -1;
  localToWorld(active, 0, active.height * .42, active.length * .58 * forwardSign, a);
  b.set(0, 0, forwardSign).applyQuaternion(active.root.quaternion).normalize();
  projectile.mesh.position.copy(a);
  projectile.mesh.visible = true;
  projectile.velocity.copy(b).multiplyScalar(105 + Math.max(0, active.speed));
  projectile.life = 2.2;
  projectile.active = true;
  fireCooldown = active.def.helicopter ? .17 : .11;
}

function updateProjectiles(dt) {
  fireCooldown = Math.max(0, fireCooldown - dt);
  for (const projectile of projectiles) {
    if (!projectile.active) continue;
    projectile.mesh.position.addScaledVector(projectile.velocity, dt);
    projectile.life -= dt;
    if (projectile.life <= 0) {
      projectile.active = false;
      projectile.mesh.visible = false;
    }
  }
}

function mouseMove(event) {
  if (!active || !document.pointerLockElement) return;
  active.pitch = THREE.MathUtils.clamp(active.pitch - event.movementY * .0018, -.72, .72);
  active.root.rotation.y -= event.movementX * .002;
}

function mouseDown(event) {
  if (!active || event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  fireWeapon();
}

function keyDown(event) {
  keys[event.code] = true;
  if (event.repeat) return;
  if (active && (event.code === 'KeyF' || event.code === 'Numpad0')) {
    event.preventDefault();
    event.stopPropagation();
    fireWeapon();
    return;
  }
  const target = event.target;
  const editing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
  if (!editing && event.key?.length === 1 && /[a-z]/i.test(event.key)) {
    clearTimeout(commandTimer);
    commandBuffer = (commandBuffer + event.key.toUpperCase()).slice(-16);
    commandTimer = setTimeout(() => { commandBuffer = ''; }, 1800);
    for (const code of ['HELICOPTER','PLANE','JET','FLY']) {
      if (commandBuffer.endsWith(code)) {
        commandBuffer = '';
        spawn(code).catch(error => console.error(error));
        return;
      }
    }
  }
  if (event.code === 'KeyE') {
    if (active) { event.preventDefault(); exit(); return; }
    const nearby = nearest();
    if (nearby) { event.preventDefault(); enter(nearby.entry); }
  } else if (event.code === 'KeyV' && active) {
    event.preventDefault();
    cameraMode = (cameraMode + 1) % 3;
    showNotice(`CÁMARA ${cameraMode + 1}/3`, 1200);
  }
}

function keyUp(event) { keys[event.code] = false; }

function localToWorld(entry, x, y, z, target) {
  entry.root.updateWorldMatrix(true, false);
  target.set(x, y, z);
  return entry.root.localToWorld(target);
}

function updateCamera() {
  if (!active) return;
  const forwardSign = active.def.forwardSign ?? -1;
  if (cameraMode === 1) {
    localToWorld(active, 0, active.height * .65, active.length * .16 * forwardSign, a);
    localToWorld(active, 0, active.height * .55, active.length * 5 * forwardSign, b);
    context.camera.position.copy(a);
  } else if (cameraMode === 2) {
    localToWorld(active, 0, active.length * 1.6, -active.length * 1.8 * forwardSign, a);
    localToWorld(active, 0, active.height * .3, active.length * .6 * forwardSign, b);
    context.camera.position.lerp(a, .18);
  } else {
    localToWorld(active, 0, active.height * .75, -active.length * .85 * forwardSign, a);
    localToWorld(active, 0, active.height * .3, active.length * .75 * forwardSign, b);
    context.camera.position.lerp(a, .3);
  }
  context.camera.lookAt(b);
}

function updateActive(dt) {
  const forward = keys.KeyW ? 1 : 0;
  const brake = keys.KeyS ? 1 : 0;
  const turn = (keys.KeyA ? 1 : 0) - (keys.KeyD ? 1 : 0);
  const pitchInput = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
  const rollInput = (keys.KeyQ ? 1 : 0) - (keys.KeyR ? 1 : 0);
  const rise = keys.Space ? 1 : 0;
  const descend = (keys.KeyC || keys.ControlLeft || keys.ControlRight) ? 1 : 0;
  const boost = keys.ShiftLeft || keys.ShiftRight;
  const maxSpeed = active.def.maxSpeed * (boost ? 1.4 : 1);
  if (forward) active.speed = Math.min(maxSpeed, active.speed + maxSpeed * .75 * dt);
  else if (brake) active.speed = Math.max(-maxSpeed * .2, active.speed - maxSpeed * .7 * dt);
  else active.speed *= Math.exp(-.55 * dt);

  active.root.rotation.y += turn * (active.def.helicopter ? 1.4 : .9) * dt * (active.speed < -1 ? -1 : 1);
  active.pitch = THREE.MathUtils.clamp(active.pitch + pitchInput * (active.def.helicopter ? 1.05 : .86) * dt, -.72, .72);
  const targetRoll = THREE.MathUtils.clamp(rollInput * .62 - turn * (active.def.helicopter ? .22 : .44), -.72, .72);
  active.roll += (targetRoll - active.roll) * (1 - Math.exp(-5 * dt));
  active.root.rotation.x = active.pitch;
  active.root.rotation.z = active.roll;

  active.verticalSpeed += (((rise - descend) * (active.def.helicopter ? 16 : 21)) - active.verticalSpeed) * (1 - Math.exp(-4 * dt));
  if (!rise && !descend) active.verticalSpeed *= Math.exp(-1.4 * dt);
  a.set(0, 0, active.def.forwardSign ?? -1).applyQuaternion(active.root.quaternion).normalize();
  active.root.position.addScaledVector(a, active.speed * dt);
  active.root.position.y += active.verticalSpeed * dt;
  active.root.position.x = THREE.MathUtils.clamp(active.root.position.x, -235, 235);
  active.root.position.z = THREE.MathUtils.clamp(active.root.position.z, -235, 235);
  const floor = context.sampleHeight(active.root.position.x, active.root.position.z) + .25;
  if (active.root.position.y < floor) {
    active.root.position.y = floor;
    active.verticalSpeed = 0;
    active.pitch = Math.min(active.pitch, .12);
  }
  active.visual.rotation.x += (0 - active.visual.rotation.x) * (1 - Math.exp(-5 * dt));
  active.visual.rotation.z += (0 - active.visual.rotation.z) * (1 - Math.exp(-5 * dt));
  active.root.updateWorldMatrix(true, false);
  context.playerRoot.position.copy(active.root.position);
  context.playerRoot.rotation.y = active.root.rotation.y;
  if (keys.KeyF || keys.Numpad0) fireWeapon();
  updateCamera();
}

function updatePrompt() {
  if (active) {
    prompt.textContent = `F/CLIC · DISPARAR · ↑/↓ APUNTAR · Q/R INCLINAR · V CÁMARA · E BAJAR · ${Math.abs(active.speed).toFixed(0)}`;
    prompt.style.display = 'block';
    return;
  }
  const nearby = nearest();
  if (nearby) {
    prompt.textContent = `E · SUBIR A ${nearby.entry.def.label} · ${nearby.distance.toFixed(1)} m`;
    prompt.style.display = 'block';
  } else prompt.style.display = 'none';
}

export async function installDesertAircraft(ctx) {
  context = ctx;
  makeUi();
  addEventListener('keydown', keyDown, true);
  addEventListener('keyup', keyUp, true);
  addEventListener('mousemove', mouseMove, true);
  addEventListener('mousedown', mouseDown, true);
  // V55: las aeronaves estacionadas vuelven a mirar hacia el lado opuesto
  // al usado en V54, manteniendo intacta la orientación de las invocadas por código.
  const placements = [
    ['JET', -26, -28, .25],
    ['HELICOPTER', 28, -24, -1.1],
    ['PLANE', -30, 28, 2.5],
    ['FLY', 30, 30, -2.1]
  ];
  let index = 0;
  for (const [code, x, z, yaw] of placements) {
    context.ui.loadText.textContent = `Cargando aeronave exacta ${index + 1}/4 · ${DEFINITIONS[code].label}…`;
    context.ui.fill.style.width = `${70 + index * 7}%`;
    await create(code, x, z, yaw, false);
    await framePause();
    index++;
  }
  context.ui.loadText.textContent = 'Terreno DESERT y cuatro aeronaves exactas listos.';
}

export function updateDesertAircraft(dt) {
  mixerAccumulator += dt;
  if (mixerAccumulator >= 1 / 18) {
    const step = Math.min(.1, mixerAccumulator);
    mixerAccumulator = 0;
    for (const entry of entries) entry.mixer?.update(step);
  }
  if (active) updateActive(dt);
  updateProjectiles(dt);
  updatePrompt();
  return Boolean(active);
}

export function isDesertAircraftActive() {
  return Boolean(active);
}
