/**
 * GTA MANUCHO V84 — código del proyecto.
 * Creado e integrado por Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * ARKEA AI / Manucho · conserva LICENSE, NOTICE.md y estos créditos al reutilizar.
 */
import * as THREE from './bosque/libs/three.module.js';
import { GLTFLoader } from './bosque/bike-runtime/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from './bosque/bike-runtime/utils/SkeletonUtils.js';
import { OBJLoader } from './npc-assets/male02/loaders/OBJLoader.js';
import { MTLLoader } from './npc-assets/male02/loaders/MTLLoader.js';

THREE.Cache.enabled = true;
window.__CITY_NPCS_READY__ = false;

// V48: vuelve el NPC GLB de Three.js (Michelle) sin cargar una multitud de modelos
// distintos. Se carga una sola fuente, se clona de forma escalonada y se actualiza
// a frecuencia limitada para mantener la ciudad fluida.
const WORLD_SCALE = 16;
const CIVILIAN_COUNT = 20;
const GANG_COUNT = 4;
const TOTAL = CIVILIAN_COUNT + GANG_COUNT;
const SIM_STEP = 1 / 12;
const ANIM_STEP = 1 / 8;
const NPC_HEIGHT = 48;

const NPC_SURFACES = [
  { xMin:-2400,xMax:-600,zMin:-5350,zMax:-3350 },
  { xMin:-2500,xMax:-500,zMin:-3600,zMax:-600 },
  { xMin:-2500,xMax:-500,zMin:-300,zMax:2700 },
  { xMin:750,xMax:2250,zMin:-5350,zMax:-3350 },
  { xMin:750,xMax:2250,zMin:-3600,zMax:-600 },
  { xMin:750,xMax:2250,zMin:-900,zMax:2100 },
  { xMin:750,xMax:2250,zMin:2700,zMax:4200 },
  { xMin:-400,xMax:400,zMin:-525,zMax:75 },
  { xMin:-1050,xMax:-450,zMin:-275,zMax:-175 },
  { xMin:450,xMax:1050,zMin:-275,zMax:-175 },
  { xMin:-1000,xMax:1000,zMin:1200,zMax:1350 }
];

const ROUTE_COORDS = [
  [[-2200,-5100],[-800,-5100],[-800,-3550],[-2200,-3550]],
  [[-2250,-3350],[-750,-3350],[-750,-850],[-2250,-850]],
  [[-2250,-100],[-750,-100],[-750,2450],[-2250,2450]],
  [[950,-5100],[2050,-5100],[2050,-3550],[950,-3550]],
  [[950,-3350],[2050,-3350],[2050,-850],[950,-850]],
  [[900,-700],[1000,-700],[1000,1100],[2100,1100],[2100,1900],[900,1900]],
  [[1220,-180],[2050,-180],[2050,820],[1220,820]],
  [[950,2850],[2050,2850],[2050,4050],[950,4050]],
  [[-300,-430],[300,-430],[300,-20],[-300,-20]],
  [[-2150,220],[-850,220],[-850,2200],[-2150,2200]]
];

const NPCS = [];
let game = null;
let sourceScene = null;
let male02Source = null;
let installed = false;
let simAccumulator = 0;
let animAccumulator = 0;
let lastTime = performance.now();

const tintPalette = [0xffffff,0x3b6ca8,0x267b63,0x8d4b5c,0x6f4f91,0x9b712f];
const materialVariantCache = new Map();

function idleTurn(timeout = 900) {
  return new Promise(resolve => {
    if ('requestIdleCallback' in window) requestIdleCallback(() => resolve(), { timeout });
    else setTimeout(resolve, Math.min(timeout, 180));
  });
}

function nextFrame() {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

function groundAt(x, z, fallback = 0) {
  try {
    const value = game?.getGroundY?.(x, fallback + 140, z, false);
    return Number.isFinite(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function buildRoutes() {
  return ROUTE_COORDS.map(route => route.map(([lx, lz]) => {
    const x = lx * WORLD_SCALE;
    const z = lz * WORLD_SCALE;
    return new THREE.Vector3(x, groundAt(x, z, WORLD_SCALE * .5), z);
  }));
}

function normalizeModel(model) {
  model.position.set(0, 0, 0);
  model.rotation.set(0, 0, 0);
  model.scale.set(1, 1, 1);
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const scale = NPC_HEIGHT / Math.max(.001, size.y);
  model.scale.setScalar(scale);
  model.updateMatrixWorld(true);
  const adjusted = new THREE.Box3().setFromObject(model);
  const center = adjusted.getCenter(new THREE.Vector3());
  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y -= adjusted.min.y;
  model.updateMatrixWorld(true);
}

function findBone(model, simpleName) {
  const names = [simpleName, `mixamorig:${simpleName}`, `mixamorig${simpleName}`];
  for (const name of names) {
    const node = model.getObjectByName(name);
    if (node) return node;
  }
  return null;
}

function makeRig(model) {
  const rig = {
    hips: findBone(model, 'Hips'),
    spine: findBone(model, 'Spine'),
    leftArm: findBone(model, 'LeftArm'),
    rightArm: findBone(model, 'RightArm'),
    leftForeArm: findBone(model, 'LeftForeArm'),
    rightForeArm: findBone(model, 'RightForeArm'),
    leftUpLeg: findBone(model, 'LeftUpLeg'),
    rightUpLeg: findBone(model, 'RightUpLeg'),
    leftLeg: findBone(model, 'LeftLeg'),
    rightLeg: findBone(model, 'RightLeg')
  };
  rig.base = {};
  for (const [key, bone] of Object.entries(rig)) {
    if (!bone || key === 'base') continue;
    rig.base[key] = bone.quaternion.clone();
  }
  return rig;
}

function applyTint(model, tintHex, gang = false) {
  const tint = new THREE.Color(gang ? 0xff6a00 : tintHex);
  model.traverse(object => {
    if (!object.isMesh && !object.isSkinnedMesh) return;
    object.castShadow = false;
    object.receiveShadow = false;
    object.frustumCulled = true;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const prepared = materials.map(material => {
      if (!material) return material;
      const variantKey = `${material.uuid}:${gang ? 'gang' : tintHex}`;
      if (materialVariantCache.has(variantKey)) return materialVariantCache.get(variantKey);
      const copy = material.clone();
      if (copy.color) copy.color.lerp(tint, gang ? .28 : .12);
      if ('roughness' in copy) copy.roughness = Math.max(.58, copy.roughness ?? .58);
      if ('metalness' in copy) copy.metalness = Math.min(.08, copy.metalness ?? 0);
      materialVariantCache.set(variantKey, copy);
      return copy;
    });
    object.material = Array.isArray(object.material) ? prepared : prepared[0];
  });
}

function randomStart(route, index) {
  const segment = Math.floor(Math.random() * route.length);
  const next = (segment + 1) % route.length;
  const t = .08 + Math.random() * .84;
  const a = route[segment];
  const b = route[next];
  return {
    position: new THREE.Vector3(
      THREE.MathUtils.lerp(a.x, b.x, t),
      THREE.MathUtils.lerp(a.y, b.y, t),
      THREE.MathUtils.lerp(a.z, b.z, t)
    ),
    routeIndex: next,
    phase: index * .73 + Math.random() * Math.PI
  };
}

function createNpc(routes, index) {
  const gang = index >= CIVILIAN_COUNT;
  // Usa únicamente los personajes adjuntados: Michelle y male02.
  const useMale02 = !gang && male02Source && index % 4 === 3;
  const model = useMale02 ? male02Source.clone(true) : cloneSkeleton(sourceScene);
  normalizeModel(model);
  applyTint(model, tintPalette[index % tintPalette.length], gang);

  const root = new THREE.Group();
  root.name = `${useMale02 ? 'THREEJS_MALE02' : 'THREEJS_MICHELLE'}_NPC_${index}`;
  root.userData.isCityNpc = true;
  root.userData.faction = gang ? 'orange' : 'civilian';
  root._isAlwaysVisible = false;
  root.add(model);

  const route = routes[Math.floor(Math.random() * routes.length)];
  const start = randomStart(route, index);
  root.position.copy(start.position);
  game.city.add(root);

  const npc = {
    root,
    model,
    route,
    routeIndex: start.routeIndex,
    speed: (gang ? 92 : 82) + Math.random() * 22,
    phase: start.phase,
    cadence: 6.4 + Math.random() * 1.7,
    rig: makeRig(model),
    baseY: model.position.y,
    yaw: 0
  };
  NPCS.push(npc);
}

function animateNpc(npc, elapsed) {
  const rig = npc.rig;
  const cycle = Math.sin(elapsed * npc.cadence + npc.phase);
  const bounce = Math.abs(Math.sin(elapsed * npc.cadence + npc.phase)) * .65;
  npc.model.position.y = npc.baseY + bounce;

  const setX = (bone, key, angle) => {
    if (!bone || !rig.base[key]) return;
    bone.quaternion.copy(rig.base[key]);
    bone.rotateX(angle);
  };
  setX(rig.leftArm, 'leftArm', cycle * .42);
  setX(rig.rightArm, 'rightArm', -cycle * .42);
  setX(rig.leftForeArm, 'leftForeArm', Math.max(0, -cycle) * .18);
  setX(rig.rightForeArm, 'rightForeArm', Math.max(0, cycle) * .18);
  setX(rig.leftUpLeg, 'leftUpLeg', -cycle * .48);
  setX(rig.rightUpLeg, 'rightUpLeg', cycle * .48);
  setX(rig.leftLeg, 'leftLeg', Math.max(0, cycle) * .34);
  setX(rig.rightLeg, 'rightLeg', Math.max(0, -cycle) * .34);
}


function isOnNpcSurface(x, z) {
  const logicalX = x / WORLD_SCALE;
  const logicalZ = z / WORLD_SCALE;
  return NPC_SURFACES.some(surface =>
    logicalX >= surface.xMin && logicalX <= surface.xMax &&
    logicalZ >= surface.zMin && logicalZ <= surface.zMax
  );
}

function snapNpcToRoute(npc) {
  const point = npc.route[npc.routeIndex] || npc.route[0];
  if (!point) return;
  npc.root.position.copy(point);
  npc.routeIndex = (npc.routeIndex + 1) % npc.route.length;
}

function updateMovement(dt) {
  for (const npc of NPCS) {
    let target = npc.route[npc.routeIndex];
    let dx = target.x - npc.root.position.x;
    let dz = target.z - npc.root.position.z;
    let distance = Math.hypot(dx, dz);
    if (distance < 42) {
      npc.routeIndex = (npc.routeIndex + 1) % npc.route.length;
      target = npc.route[npc.routeIndex];
      dx = target.x - npc.root.position.x;
      dz = target.z - npc.root.position.z;
      distance = Math.hypot(dx, dz);
    }
    if (distance < .001) continue;
    const vx = dx / distance;
    const vz = dz / distance;
    const step = Math.min(distance, npc.speed * dt);
    const nextX = npc.root.position.x + vx * step;
    const nextZ = npc.root.position.z + vz * step;
    if (!isOnNpcSurface(nextX, nextZ)) {
      snapNpcToRoute(npc);
      continue;
    }
    npc.root.position.x = nextX;
    npc.root.position.z = nextZ;
    npc.root.position.y += (target.y - npc.root.position.y) * Math.min(1, dt * 3);

    // Michelle mira hacia +Z local; no se añade el giro extra de 180 grados.
    const desiredYaw = Math.atan2(vx, vz);
    const delta = Math.atan2(Math.sin(desiredYaw - npc.root.rotation.y), Math.cos(desiredYaw - npc.root.rotation.y));
    npc.root.rotation.y += delta * Math.min(1, dt * 7);
    npc.root._cx = npc.root.position.x;
    npc.root._cz = npc.root.position.z;
  }
}

function loop(now = performance.now()) {
  requestAnimationFrame(loop);
  const dt = Math.min(.1, Math.max(0, (now - lastTime) / 1000));
  lastTime = now;
  simAccumulator += dt;
  animAccumulator += dt;

  if (simAccumulator >= SIM_STEP) {
    const step = Math.min(.12, simAccumulator);
    simAccumulator = 0;
    updateMovement(step);
  }
  if (animAccumulator >= ANIM_STEP) {
    animAccumulator = 0;
    const elapsed = now / 1000;
    const player = game?.playerContainer?.position;
    const maxDistance = window.__VICE_VIDEO_SETTINGS__?.npcDistance || 4300;
    const maxAnimDistanceSq = maxDistance * maxDistance;
    for (const npc of NPCS) {
      const visible = !player || npc.root.position.distanceToSquared(player) <= maxAnimDistanceSq;
      npc.root.visible = visible;
      if (visible) animateNpc(npc, elapsed);
    }
  }
}

async function loadSource() {
  const gltfPromise = new GLTFLoader().loadAsync('./npc-assets/michelle/Michelle.glb');
  const malePromise = (async () => {
    try {
      const base = './npc-assets/male02/';
      const mtlLoader = new MTLLoader().setPath(base).setResourcePath(base);
      const materials = await mtlLoader.loadAsync('male02.mtl');
      materials.preload();
      const objLoader = new OBJLoader().setMaterials(materials).setPath(base);
      const model = await objLoader.loadAsync('male02.obj');
      model.traverse(object => {
        if (!object.isMesh) return;
        object.castShadow = false;
        object.receiveShadow = false;
        object.frustumCulled = true;
      });
      return model;
    } catch (error) {
      console.warn('[city-npcs] male02 adjuntado no pudo cargarse; se conserva Michelle.', error);
      return null;
    }
  })();

  const [gltf, male] = await Promise.all([gltfPromise, malePromise]);
  sourceScene = gltf.scene;
  male02Source = male;
  sourceScene.traverse(object => {
    if (!object.isMesh && !object.isSkinnedMesh) return;
    object.castShadow = false;
    object.receiveShadow = false;
    object.frustumCulled = true;
  });
}

async function install() {
  if (installed) return;
  game = window.__VICE_CITY_GAME__;
  if (!game?.city || !game?.renderer || typeof game.getGroundY !== 'function') return;
  installed = true;

  try {
    await idleTurn(900);
    await loadSource();
    const routes = buildRoutes();
    for (let i = 0; i < TOTAL; i++) {
      createNpc(routes, i);
      // Un personaje por turno libre: evita una pausa grande en un solo fotograma.
      await idleTurn(i < 12 ? 180 : 300);
      if (i % 2 === 1) await nextFrame();
    }
    window.__CITY_NPCS__ = NPCS;
    requestAnimationFrame(loop);
  } catch (error) {
    console.error('[city-npcs] No se pudieron cargar los NPC adjuntados.', error);
  } finally {
    window.__CITY_NPCS_READY__ = true;
    window.dispatchEvent(new CustomEvent('city-npcs-ready'));
  }
}

const wait = setInterval(() => {
  game = window.__VICE_CITY_GAME__ || game;
  if (!game?.city || !game?.renderer || typeof game.getGroundY !== 'function') return;
  clearInterval(wait);
  install();
}, 100);

setTimeout(() => {
  clearInterval(wait);
  if (!window.__CITY_NPCS_READY__) {
    window.__CITY_NPCS_READY__ = true;
    window.dispatchEvent(new CustomEvent('city-npcs-ready'));
  }
}, 20000);
