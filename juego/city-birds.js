/**
 * GTA MANUCHO V84 — código del proyecto.
 * Creado e integrado por Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * ARKEA AI / Manucho · conserva LICENSE, NOTICE.md y estos créditos al reutilizar.
 */
import * as THREE from './bosque/libs/three.module.js';

window.__CITY_BIRDS_EXPECTED__ = true;
window.__CITY_BIRDS_READY__ = false;

const BIRD_COUNT = 24;
const UPDATE_STEP = 1 / 12;
const WORLD_SCALE = 16;
const birds = [];
const dummy = new THREE.Object3D();
const tempOffset = new THREE.Vector3();
const tempLeft = new THREE.Vector3();
const tempRight = new THREE.Vector3();
const Y_AXIS = new THREE.Vector3(0, 1, 0);
let game = null;
let bodyMesh = null;
let leftWingMesh = null;
let rightWingMesh = null;
let lastTime = performance.now();
let accumulator = 0;

// Centros de vuelo sobre las zonas urbanas firmes, no generados por proximidad.
const FLIGHT_AREAS = [
  [-1550, -4350], [-1500, -2100], [-1500, 1200],
  [1500, -4350], [1500, -2100], [1500, 1450],
  [1500, 3350], [0, -250]
];

function createBodyGeometry() {
  const geometry = new THREE.ConeGeometry(1.1, 5.2, 4, 1, false);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, 0, -0.5);
  return geometry;
}

function createWingGeometry() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, 0,
    4.8, 0, 0.2,
    1.2, 0, -2.1
  ], 3));
  geometry.computeVertexNormals();
  return geometry;
}

function setMatrix(mesh, index, position, yaw, roll, scaleX, scaleY, scaleZ) {
  dummy.position.copy(position);
  dummy.rotation.set(0, yaw, roll);
  dummy.scale.set(scaleX, scaleY, scaleZ);
  dummy.updateMatrix();
  mesh.setMatrixAt(index, dummy.matrix);
}

function updateBirds(elapsed) {
  for (let i = 0; i < birds.length; i++) {
    const bird = birds[i];
    const angle = elapsed * bird.speed + bird.phase;
    const x = bird.centerX + Math.cos(angle) * bird.radiusX;
    const z = bird.centerZ + Math.sin(angle) * bird.radiusZ;
    const y = bird.altitude + Math.sin(angle * 2.1 + bird.phase) * bird.bob;
    const vx = -Math.sin(angle) * bird.radiusX;
    const vz = Math.cos(angle) * bird.radiusZ;
    const yaw = Math.atan2(vx, vz);
    const flap = Math.sin(elapsed * bird.flapSpeed + bird.phase * 2) * 0.62;
    const bank = THREE.MathUtils.clamp(Math.sin(angle) * 0.12, -0.12, 0.12);
    const position = tempOffset.set(x, y, z);

    setMatrix(bodyMesh, i, position, yaw, bank, bird.scale, bird.scale, bird.scale);

    tempLeft.set(-1.0 * bird.scale, 0, 0).applyAxisAngle(Y_AXIS, yaw).add(position);
    tempRight.set(1.0 * bird.scale, 0, 0).applyAxisAngle(Y_AXIS, yaw).add(position);
    setMatrix(leftWingMesh, i, tempLeft, yaw, flap + bank, bird.scale, bird.scale, bird.scale);
    setMatrix(rightWingMesh, i, tempRight, yaw + Math.PI, -flap - bank, bird.scale, bird.scale, bird.scale);
  }

  bodyMesh.instanceMatrix.needsUpdate = true;
  leftWingMesh.instanceMatrix.needsUpdate = true;
  rightWingMesh.instanceMatrix.needsUpdate = true;
}

function frame(now = performance.now()) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.08, Math.max(0, (now - lastTime) / 1000));
  lastTime = now;
  accumulator += dt;
  if (accumulator < UPDATE_STEP) return;
  const elapsed = now / 1000;
  accumulator = 0;
  updateBirds(elapsed);
}

function install() {
  game = window.__VICE_CITY_GAME__;
  if (!game?.city) return false;

  const group = new THREE.Group();
  group.name = 'AVES_CIUDAD_LIGERAS_V46';
  const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0x252932, side: THREE.DoubleSide });
  const wingMaterial = new THREE.MeshBasicMaterial({ color: 0x343944, side: THREE.DoubleSide });

  bodyMesh = new THREE.InstancedMesh(createBodyGeometry(), bodyMaterial, BIRD_COUNT);
  leftWingMesh = new THREE.InstancedMesh(createWingGeometry(), wingMaterial, BIRD_COUNT);
  rightWingMesh = new THREE.InstancedMesh(createWingGeometry(), wingMaterial, BIRD_COUNT);
  for (const mesh of [bodyMesh, leftWingMesh, rightWingMesh]) {
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.frustumCulled = true;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    group.add(mesh);
  }

  for (let i = 0; i < BIRD_COUNT; i++) {
    const [logicalX, logicalZ] = FLIGHT_AREAS[i % FLIGHT_AREAS.length];
    const layer = Math.floor(i / FLIGHT_AREAS.length);
    birds.push({
      centerX: logicalX * WORLD_SCALE,
      centerZ: logicalZ * WORLD_SCALE,
      radiusX: (180 + (i % 4) * 55) * WORLD_SCALE,
      radiusZ: (120 + ((i + 2) % 4) * 45) * WORLD_SCALE,
      altitude: 720 + layer * 210 + (i % 3) * 90,
      bob: 20 + (i % 4) * 7,
      speed: 0.045 + (i % 5) * 0.006,
      flapSpeed: 4.8 + (i % 6) * 0.35,
      phase: (i / BIRD_COUNT) * Math.PI * 2,
      scale: 4.5 + (i % 3) * 0.65
    });
  }

  game.city.add(group);
  window.__CITY_BIRDS__ = group;
  updateBirds(performance.now() / 1000);
  window.__CITY_BIRDS_READY__ = true;
  window.dispatchEvent(new CustomEvent('city-birds-ready'));
  requestAnimationFrame(frame);
  return true;
}

const wait = setInterval(() => {
  if (!install()) return;
  clearInterval(wait);
}, 100);

setTimeout(() => {
  clearInterval(wait);
  if (!window.__CITY_BIRDS_READY__) {
    window.__CITY_BIRDS_READY__ = true;
    window.dispatchEvent(new CustomEvent('city-birds-ready'));
  }
}, 10000);
