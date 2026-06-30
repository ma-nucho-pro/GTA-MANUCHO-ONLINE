/**
 * GTA MANUCHO V84 — código del proyecto.
 * Creado e integrado por Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * ARKEA AI / Manucho · conserva LICENSE, NOTICE.md y estos créditos al reutilizar.
 */
import * as THREE from './bosque/libs/three.module.js';
import { GLTFLoader } from './bosque/bike-runtime/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from './bosque/bike-runtime/utils/SkeletonUtils.js';

window.__FOG_CITY_READY__ = false;

const CITY = {
  centerX: 48000,
  centerZ: 16000,
  halfX: 7000,
  halfZ: 6000,
  topY: 3,
  bridgeXMin: 35500,
  bridgeXMax: 41000,
  bridgeZ: 16000,
  bridgeHalfZ: 450
};

let game;
const horses = [];
let lastTime = performance.now();
let accumulator = 0;
const HORSE_STEP = 1 / 15;

function groundPatch() {
  if (game.__fogCityGroundPatched) return;
  game.__fogCityGroundPatched = true;
  const previous = game.getGroundY.bind(game);
  game.getGroundY = function fogCityGround(x, y, z, strict = true) {
    const base = previous(x, y, z, strict);
    const inCity = x >= CITY.centerX - CITY.halfX && x <= CITY.centerX + CITY.halfX &&
      z >= CITY.centerZ - CITY.halfZ && z <= CITY.centerZ + CITY.halfZ;
    const onBridge = x >= CITY.bridgeXMin && x <= CITY.bridgeXMax &&
      Math.abs(z - CITY.bridgeZ) <= CITY.bridgeHalfZ;
    if (inCity || onBridge) return Math.max(Number.isFinite(base) ? base : -Infinity, CITY.topY);
    return base;
  };
}

function makeLabel(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#172128';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#cde9ee';
  ctx.lineWidth = 14;
  ctx.strokeRect(12, 12, 1000, 232);
  ctx.fillStyle = '#eefcff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 78px Arial';
  ctx.fillText(text, 512, 150);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function buildCity() {
  const root = new THREE.Group();
  root.name = 'FOG_CITY_ATTACHED_V47';

  const foundation = new THREE.Mesh(
    new THREE.BoxGeometry(CITY.halfX * 2, 90, CITY.halfZ * 2),
    new THREE.MeshLambertMaterial({ color: 0x58686c })
  );
  foundation.position.set(CITY.centerX, CITY.topY - 45, CITY.centerZ);
  foundation.receiveShadow = false;
  foundation.castShadow = false;
  root.add(foundation);

  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(CITY.halfX * 2, 4, CITY.halfZ * 2),
    new THREE.MeshLambertMaterial({ color: 0x69777a })
  );
  ground.position.set(CITY.centerX, CITY.topY - 2, CITY.centerZ);
  ground.receiveShadow = false;
  ground.castShadow = false;
  root.add(ground);

  const bridgeLength = CITY.bridgeXMax - CITY.bridgeXMin;
  const bridge = new THREE.Mesh(
    new THREE.BoxGeometry(bridgeLength, 5, CITY.bridgeHalfZ * 2),
    new THREE.MeshLambertMaterial({ color: 0x30383d })
  );
  bridge.position.set((CITY.bridgeXMin + CITY.bridgeXMax) * .5, CITY.topY - 2.5, CITY.bridgeZ);
  bridge.receiveShadow = false;
  bridge.castShadow = false;
  root.add(bridge);

  const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x293238 });
  for (let i = -4; i <= 4; i++) {
    const roadA = new THREE.Mesh(new THREE.BoxGeometry(CITY.halfX * 2 - 800, .8, 260), roadMaterial);
    roadA.position.set(CITY.centerX, CITY.topY + .4, CITY.centerZ + i * 1200);
    roadA.receiveShadow = false;
    root.add(roadA);
    const roadB = new THREE.Mesh(new THREE.BoxGeometry(260, .8, CITY.halfZ * 2 - 800), roadMaterial);
    roadB.position.set(CITY.centerX + i * 1400, CITY.topY + .42, CITY.centerZ);
    roadB.receiveShadow = false;
    root.add(roadB);
  }

  const plaza = new THREE.Mesh(
    new THREE.CylinderGeometry(1100, 1100, 1.2, 48),
    new THREE.MeshLambertMaterial({ color: 0xaaa9a3 })
  );
  plaza.position.set(CITY.centerX, CITY.topY + .6, CITY.centerZ);
  plaza.receiveShadow = false;
  root.add(plaza);

  const buildingGeometry = new THREE.BoxGeometry(1, 1, 1);
  const buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x75858d });
  const count = 150;
  const buildings = new THREE.InstancedMesh(buildingGeometry, buildingMaterial, count);
  buildings.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  buildings.castShadow = false;
  buildings.receiveShadow = false;
  const dummy = new THREE.Object3D();
  let seed = 918273;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  let placed = 0;
  while (placed < count) {
    const x = CITY.centerX + rand() * (CITY.halfX * 1.72) - CITY.halfX * .86;
    const z = CITY.centerZ + rand() * (CITY.halfZ * 1.72) - CITY.halfZ * .86;
    if (Math.hypot(x - CITY.centerX, z - CITY.centerZ) < 1550) continue;
    if (Math.abs((x - CITY.centerX) % 1400) < 230 || Math.abs((z - CITY.centerZ) % 1200) < 230) continue;
    const w = 260 + rand() * 420;
    const d = 260 + rand() * 420;
    const h = 450 + rand() * 1700;
    dummy.position.set(x, CITY.topY + h * .5, z);
    dummy.scale.set(w, h, d);
    dummy.rotation.set(0, (rand() - .5) * .16, 0);
    dummy.updateMatrix();
    buildings.setMatrixAt(placed++, dummy.matrix);
  }
  buildings.instanceMatrix.needsUpdate = true;
  root.add(buildings);

  const fogCanvas = document.createElement('canvas');
  fogCanvas.width = fogCanvas.height = 96;
  const ctx = fogCanvas.getContext('2d');
  const gradient = ctx.createRadialGradient(48,48,2,48,48,48);
  gradient.addColorStop(0,'rgba(225,240,244,.27)');
  gradient.addColorStop(.48,'rgba(190,214,219,.14)');
  gradient.addColorStop(1,'rgba(160,190,196,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0,0,96,96);
  const fogTexture = new THREE.CanvasTexture(fogCanvas);
  const fogMaterial = new THREE.SpriteMaterial({ map: fogTexture, transparent: true, depthWrite: false, opacity: .34 });
  for (let i = 0; i < 18; i++) {
    const fog = new THREE.Sprite(fogMaterial);
    fog.position.set(
      CITY.centerX + rand() * CITY.halfX * 1.7 - CITY.halfX * .85,
      CITY.topY + 130 + rand() * 600,
      CITY.centerZ + rand() * CITY.halfZ * 1.7 - CITY.halfZ * .85
    );
    const size = 700 + rand() * 1300;
    fog.scale.set(size * 1.8, size, 1);
    root.add(fog);
  }

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(1050, 260),
    new THREE.MeshBasicMaterial({ map: makeLabel('FOG CITY · CABALLOS'), side: THREE.DoubleSide })
  );
  sign.position.set(CITY.centerX - CITY.halfX + 600, CITY.topY + 340, CITY.centerZ);
  sign.rotation.y = Math.PI / 2;
  root.add(sign);

  root.traverse(object => {
    if (object.isMesh && !object.isInstancedMesh) {
      object.matrixAutoUpdate = false;
      object.updateMatrix();
    }
  });
  game.city.add(root);
}

function normalizeHorse(model, desiredHeight = 74) {
  model.position.set(0, 0, 0);
  model.rotation.set(0, 0, 0);
  model.scale.set(1, 1, 1);
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);
  const scale = desiredHeight / Math.max(.001, size.y);
  model.scale.setScalar(scale);
  model.updateMatrixWorld(true);
  const adjusted = new THREE.Box3().setFromObject(model);
  model.position.y -= adjusted.min.y;
  model.traverse(object => {
    if (!object.isMesh && !object.isSkinnedMesh) return;
    object.castShadow = false;
    object.receiveShadow = false;
    object.frustumCulled = true;
  });
}

function createFallbackHorse() {
  const root = new THREE.Group();
  const brown = new THREE.MeshLambertMaterial({ color: 0x80502f });
  const dark = new THREE.MeshLambertMaterial({ color: 0x352016 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(46, 22, 72), brown);
  body.position.y = 44;
  const neck = new THREE.Mesh(new THREE.BoxGeometry(16, 35, 18), brown);
  neck.position.set(0, 62, -27);
  neck.rotation.x = -.35;
  const head = new THREE.Mesh(new THREE.BoxGeometry(17, 16, 30), brown);
  head.position.set(0, 79, -42);
  const mane = new THREE.Mesh(new THREE.BoxGeometry(4, 30, 22), dark);
  mane.position.set(0, 68, -23);
  root.add(body, neck, head, mane);
  for (const [x,z] of [[-15,-22],[15,-22],[-15,22],[15,22]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(7, 40, 8), brown);
    leg.position.set(x, 20, z);
    root.add(leg);
  }
  return root;
}

function horseRoute(index) {
  const offset = index * 500;
  return [
    new THREE.Vector3(CITY.centerX - 1800 + offset, CITY.topY, CITY.centerZ - 1200),
    new THREE.Vector3(CITY.centerX + 1800, CITY.topY, CITY.centerZ - 1200 + offset * .2),
    new THREE.Vector3(CITY.centerX + 1600 - offset * .15, CITY.topY, CITY.centerZ + 1500),
    new THREE.Vector3(CITY.centerX - 1800, CITY.topY, CITY.centerZ + 1300 - offset * .2)
  ];
}

function addHorse(model, clip, index) {
  const root = new THREE.Group();
  root.name = `FOG_CITY_HORSE_${index}`;
  root.add(model);
  const route = horseRoute(index);
  root.position.copy(route[index % route.length]);
  game.city.add(root);
  const entry = {
    root, model, route, routeIndex: (index + 1) % route.length,
    speed: 75 + index * 7, mixer: null
  };
  if (clip) {
    entry.mixer = new THREE.AnimationMixer(model);
    const action = entry.mixer.clipAction(clip);
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.play();
    action.time = Math.random() * Math.max(.1, clip.duration);
  }
  horses.push(entry);
}

async function loadHorses() {
  const loader = new GLTFLoader();
  try {
    // Modelo oficial exacto indicado por el usuario. Se descarga solo cuando
    // Fog City ya existe; nunca bloquea la entrada a GTA MANUCHO.
    const gltf = await loader.loadAsync('https://threejs.org/examples/models/gltf/Horse.glb');
    for (let i = 0; i < 4; i++) {
      const model = cloneSkeleton(gltf.scene);
      normalizeHorse(model, 74);
      addHorse(model, gltf.animations?.[0] || null, i);
    }
  } catch (error) {
    console.warn('[fog-city] Horse.glb oficial no pudo cargarse; usando caballo ligero local.', error);
    for (let i = 0; i < 4; i++) addHorse(createFallbackHorse(), null, i);
  }
}

function updateHorses(dt) {
  for (const horse of horses) {
    const target = horse.route[horse.routeIndex];
    let dx = target.x - horse.root.position.x;
    let dz = target.z - horse.root.position.z;
    let distance = Math.hypot(dx, dz);
    if (distance < 45) {
      horse.routeIndex = (horse.routeIndex + 1) % horse.route.length;
      continue;
    }
    const vx = dx / distance;
    const vz = dz / distance;
    const step = Math.min(distance, horse.speed * dt);
    horse.root.position.x += vx * step;
    horse.root.position.z += vz * step;
    const yaw = Math.atan2(vx, vz);
    let delta = Math.atan2(Math.sin(yaw - horse.root.rotation.y), Math.cos(yaw - horse.root.rotation.y));
    horse.root.rotation.y += delta * Math.min(1, dt * 5);
    horse.mixer?.update(dt);
  }
}

function loop(now = performance.now()) {
  requestAnimationFrame(loop);
  accumulator += Math.min(.1, Math.max(0, (now - lastTime) / 1000));
  lastTime = now;
  if (accumulator < HORSE_STEP) return;
  const dt = Math.min(.12, accumulator);
  accumulator = 0;
  updateHorses(dt);
}

async function install() {
  game = window.__VICE_CITY_GAME__;
  if (!game?.city || !game?.getGroundY) return false;
  groundPatch();
  buildCity();
  window.__FOG_CITY_READY__ = true;
  window.dispatchEvent(new CustomEvent('fog-city-ready'));
  requestAnimationFrame(loop);
  // Caballos asíncronos y no bloqueantes.
  loadHorses();
  return true;
}

const wait = setInterval(async () => {
  if (!await install()) return;
  clearInterval(wait);
}, 100);

setTimeout(() => {
  clearInterval(wait);
  if (!window.__FOG_CITY_READY__) {
    window.__FOG_CITY_READY__ = true;
    window.dispatchEvent(new CustomEvent('fog-city-ready'));
  }
}, 10000);
