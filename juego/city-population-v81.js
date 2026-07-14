/**
 * GTA MANUCHO V84 — código del proyecto.
 * Creado e integrado por Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * ARKEA AI / Manucho · conserva LICENSE, NOTICE.md y estos créditos al reutilizar.
 */
import * as THREE from './bosque/libs/three.module.js';

// GTA MANUCHO V81 · población visual abundante con muy pocos draw calls.
// Los personajes y coches cercanos siguen siendo los modelos interactivos de los
// sistemas existentes. Este módulo añade tráfico y peatones de fondo mediante
// InstancedMesh y actualizaciones a baja frecuencia para evitar congelamientos.

const WORLD_SCALE = 16;
// V85: población mucho más abundante. Al ser InstancedMesh, subir los contadores
// no añade draw calls; solo crece el muestreo a 9 Hz, que es muy barato.
const CAR_COUNT = 135; // V92: más coches por toda la ciudad
const PED_COUNT = 330; // V92: muchos más peatones
const UPDATE_STEP = 1 / 9;

const ROAD_ROUTES_LOGICAL = [
  [[-2250,-5200],[-750,-5200],[-750,-3500],[-2250,-3500]],
  [[-2350,-3450],[-650,-3450],[-650,-750],[-2350,-750]],
  [[-2350,-150],[-650,-150],[-650,2550],[-2350,2550]],
  [[900,-5200],[2100,-5200],[2100,-3500],[900,-3500]],
  [[900,-3450],[2100,-3450],[2100,-750],[900,-750]],
  [[850,-800],[2150,-800],[2150,-450],[1000,-450],[1000,1050],[2150,1050],[2150,1950],[850,1950]],
  [[900,2850],[2100,2850],[2100,4050],[900,4050]],
  [[-320,-450],[320,-450],[320,0],[-320,0]],
  [[-1800,-260],[-1050,-260],[-500,-260],[-500,-190],[-1050,-190],[-1800,-190]],
  [[-1800,1225],[-1000,1225],[1000,1225],[1800,1225],[1800,1325],[1000,1325],[-1000,1325],[-1800,1325]]
];

const WALK_ROUTES_LOGICAL = [
  [[-2200,-5100],[-820,-5100],[-820,-3560],[-2200,-3560]],
  [[-2240,-3340],[-760,-3340],[-760,-860],[-2240,-860]],
  [[-2240,-100],[-760,-100],[-760,2440],[-2240,2440]],
  [[960,-5100],[2040,-5100],[2040,-3560],[960,-3560]],
  [[960,-3340],[2040,-3340],[2040,-860],[960,-860]],
  [[930,-690],[1040,-690],[1040,1080],[2070,1080],[2070,1860],[930,1860]],
  [[970,2860],[2030,2860],[2030,4040],[970,4040]],
  [[-280,-410],[280,-410],[280,-40],[-280,-40]],
  [[-1700,1180],[-900,1180],[900,1180],[1700,1180],[1700,1370],[900,1370],[-900,1370],[-1700,1370]]
];

const CAR_COLORS = [0xe13a32,0x3183d8,0xff8a18,0x22262b,0xe8e8e8,0x6f45a8,0x159d70,0xf0c52a,0x9b3f61];
const PED_COLORS = [0xd6624e,0x3c77b8,0x36a26a,0x8e5bb4,0xd59542,0x65707b,0xe078a7,0x4ea6a6];

let game = null;
let installed = false;
let last = performance.now();
let accumulator = 0;
let carStates = [];
let pedStates = [];
let meshes = null;
const dummy = new THREE.Object3D();
const color = new THREE.Color();

function groundAt(x, z, fallback = 0) {
  try {
    const y = game?.getGroundY?.(x, fallback + 600, z, false);
    return Number.isFinite(y) ? y : fallback;
  } catch {
    return fallback;
  }
}

function buildRoutes(source) {
  return source.map(route => route.map(([lx,lz]) => {
    const x = lx * WORLD_SCALE;
    const z = lz * WORLD_SCALE;
    return new THREE.Vector3(x, groundAt(x,z,0), z);
  }));
}

function makeState(routes, index, kind) {
  const route = routes[index % routes.length];
  const segment = Math.floor(Math.random() * route.length);
  const t = Math.random();
  return {
    route,
    segment,
    t,
    speed: kind === 'car' ? 120 + Math.random() * 95 : 34 + Math.random() * 24,
    phase: Math.random() * Math.PI * 2,
    color: (kind === 'car' ? CAR_COLORS : PED_COLORS)[index % (kind === 'car' ? CAR_COLORS.length : PED_COLORS.length)],
    x: 0,
    y: 0,
    z: 0,
    yaw: 0
  };
}

function sampleState(state, dt) {
  let a = state.route[state.segment];
  let b = state.route[(state.segment + 1) % state.route.length];
  let dx = b.x - a.x;
  let dz = b.z - a.z;
  let length = Math.max(1, Math.hypot(dx,dz));
  state.t += state.speed * dt / length;
  while (state.t >= 1) {
    state.t -= 1;
    state.segment = (state.segment + 1) % state.route.length;
    a = state.route[state.segment];
    b = state.route[(state.segment + 1) % state.route.length];
    dx = b.x - a.x;
    dz = b.z - a.z;
    length = Math.max(1, Math.hypot(dx,dz));
  }
  state.x = THREE.MathUtils.lerp(a.x,b.x,state.t);
  state.y = THREE.MathUtils.lerp(a.y,b.y,state.t);
  state.z = THREE.MathUtils.lerp(a.z,b.z,state.t);
  // Los modelos visuales avanzan por -Z local.
  state.yaw = Math.atan2(-dx,-dz);
}

function createMeshes() {
  const carBody = new THREE.InstancedMesh(
    new THREE.BoxGeometry(21,8,43),
    new THREE.MeshLambertMaterial({ color:0xffffff }),
    CAR_COUNT
  );
  const carCabin = new THREE.InstancedMesh(
    new THREE.BoxGeometry(16,7,20),
    new THREE.MeshLambertMaterial({ color:0x9bb7c8 }),
    CAR_COUNT
  );
  const carWheels = new THREE.InstancedMesh(
    new THREE.BoxGeometry(23,4,10),
    new THREE.MeshLambertMaterial({ color:0x15191d }),
    CAR_COUNT
  );

  const pedBody = new THREE.InstancedMesh(
    new THREE.CapsuleGeometry(3.8,15,3,6),
    new THREE.MeshLambertMaterial({ color:0xffffff }),
    PED_COUNT
  );
  const pedHead = new THREE.InstancedMesh(
    new THREE.SphereGeometry(4.1,7,6),
    new THREE.MeshLambertMaterial({ color:0xc99873 }),
    PED_COUNT
  );
  const pedLegs = new THREE.InstancedMesh(
    new THREE.BoxGeometry(7,13,5),
    new THREE.MeshLambertMaterial({ color:0x242932 }),
    PED_COUNT
  );

  for (const mesh of [carBody,carCabin,carWheels,pedBody,pedHead,pedLegs]) {
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    game.scene.add(mesh);
  }
  carBody.name = 'GTA_MANUCHO_TRAFICO_INSTANCIADO';
  pedBody.name = 'GTA_MANUCHO_PEATONES_INSTANCIADOS';
  return { carBody,carCabin,carWheels,pedBody,pedHead,pedLegs };
}

function qualityLimits() {
  const q = window.__VICE_VIDEO_SETTINGS__?.quality || 'medium';
  // V85: límites visibles mucho más altos manteniendo fluidez (instanciado).
  if (q === 'low') return { cars:42, peds:100, carDistance:3400, pedDistance:2900 };
  if (q === 'high') return { cars:100, peds:245, carDistance:6800, pedDistance:5900 };
  if (q === 'max') return { cars:135, peds:330, carDistance:8200, pedDistance:7300 };
  return { cars:75, peds:180, carDistance:5200, pedDistance:4500 };
}

function fillCarMatrices(states, limits, player) {
  const ranked = states.map((state,index) => ({ state,index,distSq:player ? (state.x-player.x)**2 + (state.z-player.z)**2 : 0 }))
    .filter(e => e.distSq <= limits.carDistance * limits.carDistance)
    .sort((a,b) => a.distSq-b.distSq)
    .slice(0,limits.cars);
  let slot = 0;
  for (const {state} of ranked) {
    dummy.position.set(state.x,state.y+7,state.z);
    dummy.rotation.set(0,state.yaw,0);
    dummy.scale.set(1,1,1);
    dummy.updateMatrix();
    meshes.carBody.setMatrixAt(slot,dummy.matrix);
    color.setHex(state.color); meshes.carBody.setColorAt(slot,color);

    dummy.position.y = state.y + 14;
    dummy.scale.set(.95,1,1);
    dummy.updateMatrix(); meshes.carCabin.setMatrixAt(slot,dummy.matrix);

    dummy.position.y = state.y + 3;
    dummy.scale.set(1,1,1);
    dummy.updateMatrix(); meshes.carWheels.setMatrixAt(slot,dummy.matrix);
    slot++;
  }
  meshes.carBody.count = meshes.carCabin.count = meshes.carWheels.count = slot;
  meshes.carBody.instanceMatrix.needsUpdate = meshes.carCabin.instanceMatrix.needsUpdate = meshes.carWheels.instanceMatrix.needsUpdate = true;
  if (meshes.carBody.instanceColor) meshes.carBody.instanceColor.needsUpdate = true;
}

function fillPedMatrices(states, limits, player, elapsed) {
  const ranked = states.map((state,index) => ({ state,index,distSq:player ? (state.x-player.x)**2 + (state.z-player.z)**2 : 0 }))
    .filter(e => e.distSq <= limits.pedDistance * limits.pedDistance)
    .sort((a,b) => a.distSq-b.distSq)
    .slice(0,limits.peds);
  let slot = 0;
  for (const {state} of ranked) {
    const bob = Math.abs(Math.sin(elapsed*6 + state.phase)) * .7;
    dummy.rotation.set(0,state.yaw,0);
    dummy.scale.set(1,1,1);
    dummy.position.set(state.x,state.y+17+bob,state.z);
    dummy.updateMatrix(); meshes.pedBody.setMatrixAt(slot,dummy.matrix);
    color.setHex(state.color); meshes.pedBody.setColorAt(slot,color);

    dummy.position.y = state.y + 34 + bob;
    dummy.updateMatrix(); meshes.pedHead.setMatrixAt(slot,dummy.matrix);

    dummy.position.y = state.y + 7 + bob;
    dummy.rotation.z = Math.sin(elapsed*6 + state.phase) * .08;
    dummy.updateMatrix(); meshes.pedLegs.setMatrixAt(slot,dummy.matrix);
    slot++;
  }
  meshes.pedBody.count = meshes.pedHead.count = meshes.pedLegs.count = slot;
  meshes.pedBody.instanceMatrix.needsUpdate = meshes.pedHead.instanceMatrix.needsUpdate = meshes.pedLegs.instanceMatrix.needsUpdate = true;
  if (meshes.pedBody.instanceColor) meshes.pedBody.instanceColor.needsUpdate = true;
}

function update(dt, elapsed) {
  for (const state of carStates) sampleState(state,dt);
  for (const state of pedStates) sampleState(state,dt);
  const limits = qualityLimits();
  const player = game?.playerContainer?.position;
  fillCarMatrices(carStates,limits,player);
  fillPedMatrices(pedStates,limits,player,elapsed);
}

function frame(now = performance.now()) {
  requestAnimationFrame(frame);
  if (document.hidden || window.__VICE_ZONE_TRANSITION__) { last = now; return; }
  const dt = Math.min(.12,Math.max(0,(now-last)/1000));
  last = now;
  accumulator += dt;
  if (accumulator < UPDATE_STEP) return;
  const step = Math.min(.16,accumulator);
  accumulator = 0;
  update(step,now/1000);
}

function install() {
  if (installed) return;
  game = window.__VICE_CITY_GAME__;
  if (!game?.scene || !game?.playerContainer) return;
  installed = true;
  const roadRoutes = buildRoutes(ROAD_ROUTES_LOGICAL);
  const walkRoutes = buildRoutes(WALK_ROUTES_LOGICAL);
  carStates = Array.from({length:CAR_COUNT},(_,i) => makeState(roadRoutes,i,'car'));
  pedStates = Array.from({length:PED_COUNT},(_,i) => makeState(walkRoutes,i,'ped'));
  for (const state of [...carStates,...pedStates]) sampleState(state,Math.random()*25);
  meshes = createMeshes();
  update(0,performance.now()/1000);
  window.__V81_BACKGROUND_POPULATION__ = { carStates,pedStates,meshes };
  window.dispatchEvent(new CustomEvent('gta-manucho-population-ready'));
  requestAnimationFrame(frame);
}

const wait = setInterval(() => {
  game = window.__VICE_CITY_GAME__ || game;
  if (!game?.scene || !game?.playerContainer || typeof game.getGroundY !== 'function') return;
  clearInterval(wait);
  install();
},120);
setTimeout(() => clearInterval(wait),180000); // V85: más margen en equipos lentos
