/**
 * GTA MANUCHO V100 — expansión del juego libre.
 * Integración local y progresiva para la ciudad principal, no para tutoriales
 * ni mundos separados.
 *
 * Incluye:
 * - zona de césped con árboles físicos y optimizados;
 * - motos conducidas por NPC que se pueden robar, conducir y ver en 1.ª/3.ª persona;
 * - aves que aparecen en bandadas y pueden ser abatidas con las armas;
 * - rocas instanciadas bajo el mar y en las islas;
 * - balsas manejables y corrección complementaria del barco;
 * - clima visible por franja horaria;
 * - isla-cementerio temporal entre las 00:00 y las 00:15.
 *
 * Conserva los créditos y la licencia del proyecto original.
 */
import * as THREE from './bosque/libs/three.module.js';
import { GLTFLoader } from './bosque/bike-runtime/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from './bosque/bike-runtime/utils/SkeletonUtils.js';
import {
  buildOriginalForest,
  createOriginalMotorcycle,
  loadDeathchaseAssets
} from './deathchase-original-assets-v97.js';
import {
  createAttachedBoat,
  createAttachedGraveyard,
  createAttachedRockGeometry
} from './attached-original-systems-v97.js';

THREE.Cache.enabled = true;

const WORLD_SCALE = 16;
const WATER_LEVEL = -14 * WORLD_SCALE;
const MARINE_CENTER = new THREE.Vector3(0, WATER_LEVEL, 2080 * WORLD_SCALE);
const SEA_FLOOR = WATER_LEVEL - 900;
const LOW_POWER = (navigator.hardwareConcurrency || 4) <= 4 ||
  (Number(navigator.deviceMemory || 8) <= 4);

const BIKE_COUNT = LOW_POWER ? 3 : 5;
const BIRD_COUNT = LOW_POWER ? 5 : 8;
const UNDERWATER_ROCK_COUNT = LOW_POWER ? 42 : 72;
const RAFT_COUNT = LOW_POWER ? 2 : 3;

const bikes = [];
const rafts = [];
const birds = [];
const birdTargets = [];
const treeColliders = [];
const tempA = new THREE.Vector3();
const tempB = new THREE.Vector3();
const tempC = new THREE.Vector3();
const tempD = new THREE.Vector3();
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const raycaster = new THREE.Raycaster();
const screenCenter = new THREE.Vector2(0, 0);

let game = null;
let deathchaseAssets = null;
let activeBike = null;
let bikeCameraMode = 0;
let bikeCameraKeyHeld = false;
let cameraSnapFrames = 0;
let bikeRendererGeneration = 0;
let prompt = null;
let noticeNode = null;
let crosshairNode = null;
let parkRoot = null;
let weatherRoot = null;
let weatherClouds = [];
let rainRoot = null;
let rainPositions = null;
let starRoot = null;
let currentWeather = null;
let weatherPeriodKey = '';
let weatherRoll = Math.random();
let nextShootingStarAt = performance.now() + 18000;
const shootingStars = [];
const weatherLights = [];
let hauntedRoot = null;
let hauntedLight = null;
let hauntedVisible = false;
const hauntedRavens = [];
let marineInstalled = false;
let weaponsPatched = false;
let originalUpdateActiveCar = null;
let lastFrame = performance.now();
let npcAccumulator = 0;
let promptAccumulator = 0;
let birdAccumulator = 0;
let collisionAccumulator = 0;
let visibilityAccumulator = 0;
let weatherAccumulator = 0;
let flockActive = true;
let nextFlockToggleAt = performance.now() + 52000;
let ravenTemplate = null;
let ravenAnimations = [];
let legacyTreeAccumulator = 0;

function idleTurn(timeout = 900) {
  return new Promise(resolve => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => resolve(), { timeout });
    }
    else setTimeout(resolve, Math.min(timeout, 180));
  });
}

function nextFrame() {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

function isEditable(target) {
  return target?.matches?.('input, textarea, select, [contenteditable="true"]');
}

function groundAt(x, z, fallback = 0) {
  try {
    const y = game?.getGroundY?.(x, fallback + 260, z, false);
    return Number.isFinite(y) ? y : fallback;
  } catch {
    return fallback;
  }
}

function ensureUi() {
  if (!prompt) {
    prompt = document.createElement('div');
    prompt.id = 'v95-free-roam-prompt';
    prompt.style.cssText = [
      'position:fixed','left:50%','bottom:104px','transform:translateX(-50%)',
      'z-index:25000','display:none','padding:9px 14px','border-radius:9px',
      'background:rgba(4,9,16,.92)','border:1px solid rgba(95,225,255,.8)',
      'color:#effcff','font:900 12px Arial,sans-serif','letter-spacing:.055em',
      'pointer-events:none','box-shadow:0 10px 30px rgba(0,0,0,.45)'
    ].join(';');
    document.body.appendChild(prompt);
  }
  if (!noticeNode) {
    noticeNode = document.createElement('div');
    noticeNode.id = 'v95-free-roam-notice';
    noticeNode.style.cssText = [
      'position:fixed','left:50%','top:19%','transform:translateX(-50%)',
      'z-index:25100','display:none','padding:10px 16px','border-radius:10px',
      'background:rgba(4,8,14,.94)','border:1px solid #74e4ff','color:#fff',
      'font:900 13px Arial,sans-serif','letter-spacing:.06em','pointer-events:none',
      'box-shadow:0 14px 38px rgba(0,0,0,.55)'
    ].join(';');
    document.body.appendChild(noticeNode);
  }
  if (!crosshairNode) {
    crosshairNode = document.createElement('div');
    crosshairNode.id = 'v97-bike-aim-crosshair';
    crosshairNode.setAttribute('aria-hidden', 'true');
    crosshairNode.style.cssText = [
      'position:fixed','left:50%','top:50%','width:28px','height:28px',
      'transform:translate(-50%,-50%)','z-index:25200','display:none',
      'pointer-events:none','filter:drop-shadow(0 0 3px #000)'
    ].join(';');
    crosshairNode.innerHTML = [
      '<span style="position:absolute;left:13px;top:0;width:2px;height:9px;background:#63ff83"></span>',
      '<span style="position:absolute;left:13px;bottom:0;width:2px;height:9px;background:#63ff83"></span>',
      '<span style="position:absolute;left:0;top:13px;width:9px;height:2px;background:#63ff83"></span>',
      '<span style="position:absolute;right:0;top:13px;width:9px;height:2px;background:#63ff83"></span>',
      '<span style="position:absolute;left:11px;top:11px;width:6px;height:6px;border:1px solid #b8ffc8;border-radius:50%"></span>'
    ].join('');
    document.body.appendChild(crosshairNode);
  }
}

function showPrompt(text) {
  ensureUi();
  prompt.textContent = text;
  prompt.style.display = 'block';
}

function hidePrompt() {
  if (prompt) prompt.style.display = 'none';
}

function notice(text, duration = 2800) {
  ensureUi();
  noticeNode.textContent = text;
  noticeNode.style.display = 'block';
  clearTimeout(noticeNode.__hideTimer);
  noticeNode.__hideTimer = setTimeout(() => {
    noticeNode.style.display = 'none';
  }, duration);
}

function seededRandom(seed = 1) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

/* ================================================================== */
/* PARQUE DE CÉSPED Y ÁRBOLES FÍSICOS                                 */
/* ================================================================== */

const PARK_LAWNS = [
  { x1: 1160, x2: 1540, z1: -250, z2: 120 },
  { x1: 1690, x2: 2170, z1: -250, z2: 120 },
  { x1: 1160, x2: 1540, z1: 360, z2: 900 },
  { x1: 1690, x2: 2170, z1: 360, z2: 900 }
];

function makeGrassTexture() {
  // Archivo exacto indicado por el usuario, guardado también localmente para
  // que funcione sin Internet.
  const texture = new THREE.TextureLoader().load(
    './deathchase-assets/textures/grasslight-big.jpg'
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(100, 100);
  texture.anisotropy = Math.min(2, game?.renderer?.capabilities?.getMaxAnisotropy?.() || 1);
  return texture;
}

function isOriginalRetiroTreeMesh(object) {
  if (!object?.isInstancedMesh || !object.geometry?.parameters) return false;
  const p = object.geometry.parameters;
  const near = (a, b) => Math.abs(Number(a) - b) < .02;
  if (near(p.radiusTop, 2.88) && near(p.radiusBottom, 4.8) &&
      near(p.height, 64) && p.radialSegments === 6) return true;
  if (near(p.radiusTop, 19.2) && near(p.radiusBottom, 28.8) &&
      near(p.height, 224) && p.radialSegments === 8) return true;
  if (near(p.radiusTop, 8) && near(p.radiusBottom, 14.4) &&
      near(p.height, 96) && p.radialSegments === 8) return true;
  // Las copas redondas viejas se dibujan en un único InstancedMesh con varias
  // esferas por árbol (normalmente 40 instancias, no 8). El filtro anterior
  // ocultaba los troncos pero dejaba flotando esas bolas verdes.
  return near(p.radius, 1) && p.widthSegments === 8 && p.heightSegments === 8;
}

function replaceLegacyRetiroTrees() {
  const retiro = game?.__retiroParkGroup ||
    game?.city?.children?.find(object => object?.name === 'retiro-park-ground');
  retiro?.traverse?.(object => {
    if (!isOriginalRetiroTreeMesh(object)) return;
    object.visible = false;
    object.userData.v98ReplacedByAttachedForest = true;
  });
  // Los dos árboles viejos registraban estas medidas exactas en addObstacle.
  // Se anulan para no dejar choques invisibles después de sustituirlos.
  for (const obstacle of game?.obstacles || []) {
    const typeA = Math.abs(obstacle.w - 38.4) < .05 &&
      Math.abs(obstacle.d - 38.4) < .05 && Math.abs(obstacle.h - 256) < .05;
    const typeB = Math.abs(obstacle.w - 48) < .05 &&
      Math.abs(obstacle.d - 48) < .05 && Math.abs(obstacle.h - 192) < .05;
    if (typeA || typeB) obstacle.w = obstacle.d = obstacle.h = 0;
  }
}

function buildParkForest() {
  if (parkRoot || !game?.scene) return;
  parkRoot = new THREE.Group();
  parkRoot.name = 'PARQUE_CESPED_Y_ARBOLES_ADJUNTOS_V97';
  const baseGrass = makeGrassTexture();
  const grassMaterial = new THREE.MeshStandardMaterial({
    map: baseGrass,
    roughness: 1,
    color: 0xdddddd
  });

  for (const lawn of PARK_LAWNS) {
    const width = (lawn.x2 - lawn.x1) * WORLD_SCALE;
    const depth = (lawn.z2 - lawn.z1) * WORLD_SCALE;
    const x = (lawn.x1 + lawn.x2) * .5 * WORLD_SCALE;
    const z = (lawn.z1 + lawn.z2) * .5 * WORLD_SCALE;
    const y = groundAt(x, z, 0);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), grassMaterial);
    mesh.name = 'CESPED_RETIRO_TEXTURA_EXACTA_V97';
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y + .32, z);
    mesh.receiveShadow = false;
    mesh.castShadow = false;
    mesh.userData.ignoreGroundRaycast = true;
    mesh.raycast = () => {};
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    parkRoot.add(mesh);
  }

  const counts = LOW_POWER ? [12, 14, 14, 16] : [18, 20, 22, 28];
  const radii = [150, 165, 160, 210];
  PARK_LAWNS.forEach((lawn, index) => {
    const centerX = (lawn.x1 + lawn.x2) * .5 * WORLD_SCALE;
    const centerZ = (lawn.z1 + lawn.z2) * .5 * WORLD_SCALE;
    const forest = buildOriginalForest({
      treeCount: counts[index],
      forestRadius: radii[index],
      unitScale: WORLD_SCALE,
      centerX,
      centerZ,
      baseY: groundAt(centerX, centerZ, 0) + .35
    });
    parkRoot.add(forest.group);
    treeColliders.push(...forest.treeLocations);
  });
  game.scene.add(parkRoot);
  replaceLegacyRetiroTrees();
}

function collidesWithTree(x, z, extraRadius = 0) {
  for (const tree of treeColliders) {
    const radius = tree.radius + extraRadius;
    const dx = x - tree.x;
    const dz = z - tree.z;
    if (dx * dx + dz * dz < radius * radius) return tree;
  }
  return null;
}

function resolvePlayerTreeCollision() {
  if (!game?.playerContainer || game.activeCar || game.activeBoat ||
      game.activeRiddenHorse || window.__ACTIVE_AIRCRAFT__ || window.__ACTIVE_TANK__) return;
  const position = game.playerContainer.position;
  for (const tree of treeColliders) {
    const radius = tree.radius + 12;
    let dx = position.x - tree.x;
    let dz = position.z - tree.z;
    const distanceSq = dx * dx + dz * dz;
    if (distanceSq >= radius * radius) continue;
    let distance = Math.sqrt(distanceSq);
    if (distance < .001) {
      dx = 1;
      dz = 0;
      distance = 1;
    }
    position.x = tree.x + dx / distance * radius;
    position.z = tree.z + dz / distance * radius;
    game.state.vy = 0;
  }
}

/* ================================================================== */
/* MOTOS CON NPC, ROBO, MANEJO Y CÁMARAS                              */
/* ================================================================== */

const BIKE_ROUTES = [
  [[900,-760],[2100,-760],[2100,1030],[1000,1030]],
  [[-2250,-5200],[-760,-5200],[-760,-3520],[-2250,-3520]],
  [[900,-3440],[2100,-3440],[2100,-820],[900,-820]],
  [[-2300,-150],[-720,-150],[-720,2500],[-2300,2500]],
  [[920,2850],[2080,2850],[2080,4040],[920,4040]]
].map(route => route.map(([x, z]) => new THREE.Vector3(x * WORLD_SCALE, 0, z * WORLD_SCALE)));

function makeMotorcycle(index) {
  if (!deathchaseAssets) return;
  const original = createOriginalMotorcycle(deathchaseAssets, index);
  const { root, rider, arms, wheels, dimensions } = original;
  root.name = `MOTO_NPC_ORIGINAL_ROBABLE_V96_${index + 1}`;

  const route = BIKE_ROUTES[index % BIKE_ROUTES.length].map(point => {
    const result = point.clone();
    result.y = groundAt(result.x, result.z, 0);
    return result;
  });
  root.position.copy(route[0]);
  root.position.y += .5;
  root.rotation.y = Math.PI;
  game.scene.add(root);

  const entry = {
    root,
    rider,
    arms,
    wheels,
    route,
    routeIndex: 1,
    autopilot: true,
    playerOwned: false,
    trafficSpeed: 170 + index * 12,
    speed: 0,
    cachedGround: route[0].y,
    length: dimensions.length,
    width: dimensions.width,
    height: dimensions.height,
    seatHeight: Math.max(17, dimensions.height * .55),
    lean: 0,
    cameraMode: 0,
    cameraStableY: root.position.y,
    lookYaw: 0,
    lookPitch: 0,
    verticalVelocity: 0,
    bridgeFalling: false
  };
  root.userData.v95BikeEntry = entry;
  root.userData.__v95Motorcycle = true;
  root._isAlwaysVisible = false;
  bikes.push(entry);
}

function updateBikeWheels(entry, distance) {
  if (!distance) return;
  const amount = distance / 13;
  for (const wheel of entry.wheels) wheel.rotation.x += amount;
}

function nearestBike(maxDistance = 108) {
  if (!game?.playerContainer || activeBike) return null;
  let best = null;
  let bestSq = maxDistance * maxDistance;
  const player = game.playerContainer.position;
  for (const entry of bikes) {
    if (!entry.root.visible) continue;
    const dx = entry.root.position.x - player.x;
    const dz = entry.root.position.z - player.z;
    const distanceSq = dx * dx + dz * dz;
    if (distanceSq >= bestSq) continue;
    bestSq = distanceSq;
    best = entry;
  }
  return best ? { entry: best, distance: Math.sqrt(bestSq) } : null;
}

function enterBike(entry) {
  if (!entry || game.activeCar || game.activeBoat || game.activeRiddenHorse) return;
  activeBike = entry;
  entry.autopilot = false;
  entry.playerOwned = true;
  entry.speed = 0;
  entry.rider.visible = false;
  entry.arms.visible = false;
  entry.root.visible = true;
  game.activeCar = entry.root;
  game.activeBoat = null;
  game.activeRiddenHorse = null;
  game.nearestDriveableCar = null;
  game.state.isFlying = false;
  game.state.inWater = false;
  game.state.isSubmerged = false;
  game.state.onGround = true;
  game.state.vy = 0;
  game.state.camMode = 0;
  game.boatCamMode = 0;
  if (game.playerModel) game.playerModel.visible = true;
  if (crosshairNode) crosshairNode.style.display = 'block';
  entry.cameraMode = 0;
  entry.cameraStableY = entry.root.position.y;
  entry.lookYaw = 0;
  entry.lookPitch = 0;
  bikeCameraMode = entry.cameraMode;
  bikeCameraKeyHeld = false;
  cameraSnapFrames = 6;
  game.camera.fov = 64;
  game.camera.near = .1;
  game.camera.zoom = 1;
  game.camera.up.set(0, 1, 0);
  game.camera.updateProjectionMatrix();
  notice('MOTO ROBADA · W/S ACELERAR · A/D GIRAR · SHIFT TURBO · V CÁMARA · E BAJAR · CLIC DISPARAR', 4800);
}

function exitBike() {
  if (!activeBike) return false;
  const entry = activeBike;
  tempA.set(entry.width + 18, 4, 8).applyQuaternion(entry.root.quaternion);
  const x = entry.root.position.x + tempA.x;
  const z = entry.root.position.z + tempA.z;
  const y = groundAt(x, z, entry.root.position.y);
  game.playerContainer.position.set(x, y + .5, z);
  game.playerContainer.rotation.y = entry.root.rotation.y;
  entry.speed = 0;
  entry.arms.visible = false;
  game.activeCar = null;
  activeBike = null;
  bikeCameraMode = 0;
  bikeCameraKeyHeld = false;
  game.boatCamMode = 0;
  if (crosshairNode) crosshairNode.style.display = 'none';
  game.state.camMode = 0;
  if (game.playerModel) game.playerModel.visible = true;
  game.camera.fov = 60;
  game.camera.near = .1;
  game.camera.zoom = 1;
  game.camera.up.set(0, 1, 0);
  game.camera.updateProjectionMatrix();
  game.playerContainer.userData.v74VehicleExitGraceUntil = performance.now() + 2200;
  notice('HAS BAJADO DE LA MOTO');
  return true;
}

function cycleBikeCamera() {
  if (!activeBike) return;
  activeBike.cameraMode = ((Number(activeBike.cameraMode) || 0) + 1) % 3;
  bikeCameraMode = activeBike.cameraMode;
  const firstPerson = bikeCameraMode === 2;
  const armed = (window.__WEAPON_CRATES__?.selectedWeapon || 'fist') !== 'fist';
  activeBike.arms.visible = firstPerson && !armed;
  if (game.playerModel) game.playerModel.visible = !firstPerson;
  if (crosshairNode) crosshairNode.style.display = 'block';
  // La vista en primera persona reutiliza el arma 3D real del inventario.
  game.state.camMode = firstPerson ? 2 : 0;
  game.boatCamMode = 0;
  cameraSnapFrames = 7;
  game.camera.fov = firstPerson ? 90 : bikeCameraMode === 0 ? 58 : 60;
  game.camera.near = firstPerson ? .18 : .1;
  game.camera.zoom = 1;
  game.camera.updateProjectionMatrix();
  applyBikeCamera(game.camera);
  requestAnimationFrame(() => {
    if (activeBike && Number(activeBike.cameraMode) === bikeCameraMode) {
      applyBikeCamera(game.camera);
    }
  });
  notice(`CÁMARA DE MOTO ${bikeCameraMode + 1}/3: ${['LEJOS', 'CERCA', 'PRIMERA PERSONA'][bikeCameraMode]}`, 1500);
}

function applyBikeCamera(camera) {
  const entry = game?.activeCar?.userData?.v95BikeEntry;
  if (!entry || entry !== activeBike) return;
  bikeCameraMode = Number(entry.cameraMode) || 0;
  game.boatCamMode = 0;
  const root = entry.root;
  const firstPerson = bikeCameraMode === 2;
  const armed = (window.__WEAPON_CRATES__?.selectedWeapon || 'fist') !== 'fist';
  entry.arms.visible = firstPerson && !armed;
  if (game.playerModel) game.playerModel.visible = !firstPerson;
  const desiredFov = firstPerson ? 90 : bikeCameraMode === 1 ? 60 : 58;
  if (Math.abs(camera.fov - desiredFov) > .01) {
    camera.fov = desiredFov;
    camera.near = firstPerson ? .18 : .1;
    camera.updateProjectionMatrix();
  }
  entry.cameraStableY += (root.position.y - entry.cameraStableY) * (firstPerson ? .14 : .25);
  let smooth = .35;
  if (firstPerson) {
    // Primera persona estable: hereda el rumbo, pero no el balanceo lateral ni
    // los pequeños cambios de suspensión que hacían temblar el suelo.
    tempA.set(0, entry.seatHeight + 22, 2).applyAxisAngle(Y_AXIS, root.rotation.y);
    tempA.add(tempD.set(root.position.x, entry.cameraStableY, root.position.z));
    const yaw = root.rotation.y + entry.lookYaw;
    const horizontal = Math.cos(entry.lookPitch);
    tempB.set(
      -Math.sin(yaw) * horizontal,
      Math.sin(entry.lookPitch),
      -Math.cos(yaw) * horizontal
    ).multiplyScalar(420).add(tempA);
    smooth = 1;
  } else if (bikeCameraMode === 1) {
    // V102: tercera persona CERCANA. La versión anterior ponía la cámara a 128
    // por detrás pero apuntaba a un punto 150 por DELANTE de la moto, así que
    // la mirada pasaba de largo del personaje y la vista quedaba casi idéntica
    // a la lejana: parecía que la cámara 2 no funcionaba. Ahora mira al propio
    // conductor, algo por encima del asiento, y se ve al personaje de espaldas.
    // V104: seguía viéndose lejos. Ahora está a 104 por detrás y 58 de alto,
    // apuntando al pecho del conductor: el personaje ocupa buena parte de la
    // pantalla, como una tercera persona de verdad.
    tempA.set(14, 58, 104).applyAxisAngle(Y_AXIS, root.rotation.y);
    tempA.add(tempD.set(root.position.x, entry.cameraStableY, root.position.z));
    tempB.set(0, entry.seatHeight + 20, -26).applyAxisAngle(Y_AXIS, root.rotation.y);
    tempB.add(tempD.set(root.position.x, entry.cameraStableY, root.position.z));
    smooth = .58;
  } else {
    tempA.set(0, 165, 330).applyAxisAngle(Y_AXIS, root.rotation.y);
    tempA.add(tempD.set(root.position.x, entry.cameraStableY, root.position.z));
    tempB.set(0, 44, -105).applyAxisAngle(Y_AXIS, root.rotation.y);
    tempB.add(tempD.set(root.position.x, entry.cameraStableY, root.position.z));
  }
  if (cameraSnapFrames > 0) {
    cameraSnapFrames--;
    smooth = 1;
  }
  if (smooth >= 1) camera.position.copy(tempA);
  else camera.position.lerp(tempA, smooth);
  camera.lookAt(tempB);
  camera.updateMatrixWorld(true);
}

function patchBikeRenderer() {
  if (!game?.renderer) return;
  const current = game.renderer.render;
  if (current?.__v100BikeCameraWrapper) return;
  const previous = current.bind(game.renderer);
  const generation = ++bikeRendererGeneration;
  const wrapper = (scene, camera) => {
    // El motor base recalcula su cielo justo antes de renderizar. Aplicamos el
    // estado climático V100 en este último punto para que lluvia, cielos
    // rosados y noches despejadas sí sean visibles en el fotograma final.
    if (generation === bikeRendererGeneration) applyCurrentWeatherVisuals();
    // Solo el envoltorio más reciente manda sobre la cámara. Así se conserva
    // la vista de moto aunque otro módulo sustituya renderer.render después.
    if (generation === bikeRendererGeneration &&
        game.activeCar?.userData?.v95BikeEntry === activeBike) {
      applyBikeCamera(camera);
    }
    return previous(scene, camera);
  };
  wrapper.__v100BikeCameraWrapper = true;
  game.renderer.render = wrapper;
}

function patchBikeController() {
  if (game.__v95BikeControllerPatched) return;
  game.__v95BikeControllerPatched = true;
  originalUpdateActiveCar = typeof game.updateActiveCar === 'function'
    ? game.updateActiveCar.bind(game)
    : null;
  game.updateActiveCar = function v95UpdateActiveBike(dt, elapsed) {
    const entry = this.activeCar?.userData?.v95BikeEntry;
    if (!entry) return originalUpdateActiveCar?.(dt, elapsed);
    dt = Math.min(.05, Math.max(0, dt || 0));
    const forward = this.keys.KeyW || this.keys.w || this.keys.ArrowUp;
    const reverse = this.keys.KeyS || this.keys.s || this.keys.ArrowDown;
    const left = this.keys.KeyA || this.keys.a || this.keys.ArrowLeft;
    const right = this.keys.KeyD || this.keys.d || this.keys.ArrowRight;
    const boost = this.keys.ShiftLeft || this.keys.ShiftRight || this.keys.Shift;
    const maxSpeed = boost ? 1320 : 980;
    const acceleration = boost ? 1020 : 760;

    if (forward) entry.speed = Math.min(maxSpeed, entry.speed + acceleration * dt);
    else if (reverse) entry.speed = Math.max(-320, entry.speed - 620 * dt);
    else entry.speed *= Math.exp(-1.15 * dt);
    if (Math.abs(entry.speed) < .5) entry.speed = 0;

    const steer = (left ? 1 : 0) - (right ? 1 : 0);
    const speedRatio = Math.min(1, Math.abs(entry.speed) / 360);
    entry.root.rotation.y += steer * Math.sign(entry.speed || 1) * (1.75 - speedRatio * .55) * dt;
    entry.lean += ((-steer * speedRatio * .18) - entry.lean) * (1 - Math.exp(-dt * 9));
    entry.root.rotation.z = entry.lean;

    tempA.set(0, 0, -1).applyQuaternion(entry.root.quaternion);
    const distance = entry.speed * dt;
    const nx = entry.root.position.x + tempA.x * distance;
    const nz = entry.root.position.z + tempA.z * distance;
    const tree = collidesWithTree(nx, nz, 18);
    if (tree) {
      entry.speed *= -.18;
      notice('LA MOTO HA CHOCADO CON UN ÁRBOL', 1200);
    } else {
      entry.root.position.x = nx;
      entry.root.position.z = nz;
    }
    const goldenGate = window.__GTA_GOLDEN_GATE__;
    const bridgeY = goldenGate?.surfaceAt?.(entry.root.position.x, entry.root.position.z);
    const inBridgeAirspace = Boolean(goldenGate?.containsAirspace?.(
      entry.root.position.x,
      entry.root.position.z
    ));
    if (Number.isFinite(bridgeY)) {
      entry.bridgeFalling = false;
      entry.verticalVelocity = 0;
      entry.cachedGround = bridgeY;
      entry.root.position.y += ((bridgeY + .5) - entry.root.position.y) *
        (1 - Math.exp(-dt * 18));
      entry.root.userData.v81MarineSafe = true;
    } else if (inBridgeAirspace) {
      entry.bridgeFalling = true;
      entry.verticalVelocity = Math.max(-1150, entry.verticalVelocity - 980 * dt);
      entry.root.position.y += entry.verticalVelocity * dt;
      entry.root.userData.v81MarineSafe = entry.root.position.y > WATER_LEVEL + 35;
    } else {
      entry.bridgeFalling = false;
      entry.verticalVelocity = 0;
      entry.cachedGround = groundAt(nx, nz, entry.cachedGround);
      entry.root.position.y += ((entry.cachedGround + .5) - entry.root.position.y) *
        (1 - Math.exp(-dt * 14));
      entry.root.userData.v81MarineSafe = false;
    }
    updateBikeWheels(entry, distance);
    entry.root.updateMatrixWorld(true);

    tempB.set(0, entry.seatHeight, 3);
    entry.root.localToWorld(tempB);
    this.playerContainer.position.copy(tempB);
    this.playerContainer.rotation.y = entry.root.rotation.y;
    this.state.vy = 0;
    this.state.onGround = !entry.bridgeFalling;
    this.state.inWater = false;
    this.state.isSubmerged = false;
    this.state.isFlying = false;
    this.boatCamMode = 0;
    bikeCameraMode = Number(entry.cameraMode) || 0;
    if (this.playerModel) this.playerModel.visible = bikeCameraMode !== 2;
  };
}

function updateNpcBike(entry, dt) {
  if (!entry.autopilot || entry === activeBike || !entry.route.length) return;
  let target = entry.route[entry.routeIndex];
  let dx = target.x - entry.root.position.x;
  let dz = target.z - entry.root.position.z;
  let distance = Math.hypot(dx, dz);
  if (distance < 60) {
    entry.routeIndex = (entry.routeIndex + 1) % entry.route.length;
    target = entry.route[entry.routeIndex];
    dx = target.x - entry.root.position.x;
    dz = target.z - entry.root.position.z;
    distance = Math.hypot(dx, dz);
  }
  if (distance < .001) return;
  const vx = dx / distance;
  const vz = dz / distance;
  const movement = Math.min(distance, entry.trafficSpeed * dt);
  entry.root.position.x += vx * movement;
  entry.root.position.z += vz * movement;
  entry.cachedGround += (target.y - entry.cachedGround) * Math.min(1, dt * 2);
  entry.root.position.y = entry.cachedGround + .5;
  const yaw = Math.atan2(-vx, -vz);
  let delta = Math.atan2(Math.sin(yaw - entry.root.rotation.y), Math.cos(yaw - entry.root.rotation.y));
  entry.root.rotation.y += delta * (1 - Math.exp(-dt * 5));
  entry.root.rotation.z += ((-delta * 1.2) - entry.root.rotation.z) * (1 - Math.exp(-dt * 6));
  entry.rider.visible = true;
  entry.arms.visible = false;
  updateBikeWheels(entry, movement);
}

function updateBikeVisibility() {
  const player = game?.playerContainer?.position;
  if (!player) return;
  const maxDistance = Math.max(3000, window.__VICE_VIDEO_SETTINGS__?.carDistance || 5200);
  const maxSq = maxDistance * maxDistance;
  for (const entry of bikes) {
    if (entry === activeBike) {
      entry.root.visible = true;
      continue;
    }
    const dx = entry.root.position.x - player.x;
    const dz = entry.root.position.z - player.z;
    entry.root.visible = dx * dx + dz * dz < maxSq;
  }
}

/* ================================================================== */
/* AVES EN BANDADAS Y DISPAROS                                        */
/* ================================================================== */

async function loadAttachedRaven() {
  const gltf = await new GLTFLoader().loadAsync(
    './deathchase-assets/models/raven.glb'
  );
  if (!gltf.animations?.length) throw new Error('raven.glb no contiene animaciones');
  const baseModel = gltf.scene;
  baseModel.traverse(node => {
    if (!node.isMesh && !node.isSkinnedMesh) return;
    node.material = Array.isArray(node.material)
      ? node.material.map(material => material?.clone?.() || material)
      : node.material?.clone?.() || node.material;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of materials) {
      if (!material) continue;
      material.side = THREE.DoubleSide;
      if (material.isMeshStandardMaterial) {
        material.roughness = Math.max(material.roughness, .7);
        material.metalness = Math.min(material.metalness, .5);
        material.emissive = new THREE.Color(0x222222);
        material.emissiveIntensity = .3;
      }
    }
    node.castShadow = false;
    node.receiveShadow = false;
    node.frustumCulled = true;
  });
  const box = new THREE.Box3().setFromObject(baseModel);
  const size = box.getSize(new THREE.Vector3());
  // BIRD_SCALE 2.5 del HTML, convertido a las unidades del mapa.
  const scale = (2.5 * WORLD_SCALE) / Math.max(size.x, size.y, size.z, .0001);
  baseModel.scale.setScalar(scale);
  baseModel.updateMatrixWorld(true);
  const alignedBox = new THREE.Box3().setFromObject(baseModel);
  baseModel.position.y = -alignedBox.min.y;
  ravenTemplate = new THREE.Group();
  ravenTemplate.add(baseModel);
  ravenAnimations = gltf.animations;
}

function createBird(index) {
  if (!ravenTemplate) return;
  const root = cloneSkeleton(ravenTemplate);
  root.name = `RAVEN_GLB_ABATIBLE_V97_${index + 1}`;
  const mixer = new THREE.AnimationMixer(root);
  const action = mixer.clipAction(ravenAnimations[0]);
  action.play();
  const entry = {
    root,
    mixer,
    action,
    phase: index / Math.max(1, BIRD_COUNT) * Math.PI * 2,
    radius: 680 + (index % 4) * 120,
    altitude: 650 + (index % 3) * 95,
    speed: .19 + (index % 4) * .018,
    falling: false,
    fallVelocity: new THREE.Vector3(),
    spin: new THREE.Vector3()
  };
  root.traverse(object => {
    if (!object.isMesh && !object.isSkinnedMesh) return;
    object.castShadow = false;
    object.receiveShadow = false;
    object.frustumCulled = true;
    object.userData.v95BirdEntry = entry;
    birdTargets.push(object);
  });
  game.scene.add(root);
  birds.push(entry);
}

function resetFlock() {
  for (const bird of birds) {
    bird.falling = false;
    bird.fallVelocity.set(0, 0, 0);
    bird.root.rotation.set(0, 0, 0);
    bird.root.visible = flockActive;
    bird.action?.reset().play();
  }
}

function toggleFlock(now) {
  if (now < nextFlockToggleAt) return;
  flockActive = !flockActive;
  nextFlockToggleAt = now + (flockActive ? 48000 : 32000 + Math.random() * 18000);
  resetFlock();
}

function updateBirds(dt, elapsed) {
  toggleFlock(performance.now());
  const centerX = 1630 * WORLD_SCALE;
  const centerZ = 320 * WORLD_SCALE;
  for (let i = 0; i < birds.length; i++) {
    const bird = birds[i];
    if (!bird.root.visible) continue;
    bird.mixer?.update(dt);
    if (bird.falling) {
      bird.fallVelocity.y -= 260 * dt;
      bird.root.position.addScaledVector(bird.fallVelocity, dt);
      bird.root.rotation.x += bird.spin.x * dt;
      bird.root.rotation.z += bird.spin.z * dt;
      const floor = groundAt(bird.root.position.x, bird.root.position.z, WATER_LEVEL);
      if (bird.root.position.y < floor + 5) bird.root.visible = false;
      continue;
    }
    const angle = elapsed * bird.speed + bird.phase;
    const x = centerX + Math.cos(angle) * bird.radius;
    const z = centerZ + Math.sin(angle * .92) * bird.radius * .72;
    const y = bird.altitude + Math.sin(angle * 2.3 + bird.phase) * 38;
    const vx = -Math.sin(angle) * bird.radius;
    const vz = Math.cos(angle * .92) * bird.radius * .66;
    bird.root.position.set(x, y, z);
    bird.root.rotation.y = Math.atan2(vx, vz);
  }
}

function shootBird() {
  if (!flockActive || game?.activeWeapon === 'fist' || !game?.camera) return false;
  raycaster.setFromCamera(screenCenter, game.camera);
  raycaster.far = 6000;
  const hits = raycaster.intersectObjects(birdTargets, false);
  for (const hit of hits) {
    const bird = hit.object?.userData?.v95BirdEntry;
    if (!bird || bird.falling || !bird.root.visible) continue;
    bird.falling = true;
    bird.action?.stop();
    game.camera.getWorldDirection(tempA);
    bird.fallVelocity.copy(tempA).multiplyScalar(95);
    bird.fallVelocity.y = 45;
    bird.spin.set(2.5 + Math.random() * 3, 0, 2 + Math.random() * 4);
    if (crosshairNode) {
      crosshairNode.style.filter = 'drop-shadow(0 0 7px #ff304f)';
      crosshairNode.style.transform = 'translate(-50%,-50%) scale(1.28)';
      setTimeout(() => {
        if (!crosshairNode) return;
        crosshairNode.style.filter = 'drop-shadow(0 0 3px #000)';
        crosshairNode.style.transform = 'translate(-50%,-50%) scale(1)';
      }, 120);
    }
    notice('AVE ABATIDA', 1200);
    return true;
  }
  return false;
}

function patchWeaponsForBirds() {
  if (weaponsPatched || !window.__WEAPON_CRATES__) return;
  weaponsPatched = true;
  window.addEventListener('vice-weapon-fired', event => {
    shootBird();
    if (!activeBike) return;
    const damage = Number(event.detail?.damage) || 42;
    // Disparo confirmado por el inventario: fuerza la bala de combate aun si
    // el disparo visual nativo se cancela por conducir.
    window.__CITY_LIFE_SYSTEM__?.handleRayShot?.(damage);
    window.__GTA_ONLINE__?.broadcastShot?.();
  });
}

/* ================================================================== */
/* ROCAS SUBMARINAS, ROCAS DE ISLA Y BALSAS                           */
/* ================================================================== */

function createRockGeometry() {
  // SDF con 14–22 cortes, radios, proporciones y suavizado del ROCAS.html.
  return createAttachedRockGeometry(1337, LOW_POWER ? 2 : 3);
}

function buildMarineRocks(marine) {
  const geometry = createRockGeometry();
  const material = new THREE.MeshLambertMaterial({ color: 0x566267 });
  const underwater = new THREE.InstancedMesh(geometry, material, UNDERWATER_ROCK_COUNT);
  underwater.name = 'ROCAS_SDF_DEL_HTML_SUBMARINAS_V97';
  const dummy = new THREE.Object3D();
  const rand = seededRandom(78543);
  for (let i = 0; i < UNDERWATER_ROCK_COUNT; i++) {
    const angle = rand() * Math.PI * 2;
    const radius = 460 + Math.sqrt(rand()) * 4300;
    const scale = 18 + rand() * 68;
    dummy.position.set(
      MARINE_CENTER.x + Math.cos(angle) * radius,
      SEA_FLOOR + scale * (.34 + rand() * .12),
      MARINE_CENTER.z + Math.sin(angle) * radius
    );
    dummy.rotation.set(rand() * .45, rand() * Math.PI * 2, rand() * .38);
    dummy.scale.set(scale * (.75 + rand() * .55), scale * (.42 + rand() * .7), scale);
    dummy.updateMatrix();
    underwater.setMatrixAt(i, dummy.matrix);
    underwater.setColorAt(i, new THREE.Color().setHSL(.52 + rand() * .08, .08, .27 + rand() * .16));
  }
  underwater.instanceMatrix.needsUpdate = true;
  if (underwater.instanceColor) underwater.instanceColor.needsUpdate = true;
  underwater.castShadow = false;
  underwater.receiveShadow = false;
  underwater.frustumCulled = true;
  marine.underwaterGroup?.add(underwater);

  // V102: se eliminan las rocas de las islas que se generaban aquí. No venían
  // del archivo ROCAS.html: eran cajas SDF colocadas a la altura de la cima
  // aunque estuviesen al 78 % del radio, donde el terreno ya ha bajado, así que
  // quedaban flotando en el aire. Las únicas rocas de estas islas son ahora las
  // del archivo adjunto (rocas-adjuntas-v101.js). Las submarinas del fondo se
  // conservan porque están a -1100 y no molestan.
}

function makeRaft(index) {
  const colors = [0x7f5539, 0x696969, 0x6b705c];
  const root = new THREE.Group();
  root.name = `BALSA_BARCA_MANEJABLE_DEL_HTML_V97_${index + 1}`;
  // V102: la balsa medía 2,4 * 16 = 38 unidades de largo, menos que el propio
  // personaje (48). Con escala 34 mide 5,1 m de largo por 2,1 m de ancho, que
  // es una balsa de una plaza en la que el personaje se ve encima de pie.
  const originalBoat = createAttachedBoat(colors[index % colors.length], 34);
  // El HTML navega sobre el eje longitudinal X. El controlador del juego
  // principal avanza por -Z, por eso sólo se adapta la orientación del grupo.
  originalBoat.rotation.y = Math.PI / 2;
  root.add(originalBoat);
  // V102: antes estaban a z 39680-43840, muy al norte y lejos de todo, así que
  // no había manera de encontrarlas. Ahora una junto al barco jugable y otra en
  // la orilla de cada isla, siempre en agua libre y fuera del radio de tierra.
  const positions = [
    [39, 2213],
    [-118, 2075],
    [170, 2246]
  ];
  const [lx, lz] = positions[index % positions.length];
  root.position.set(lx * WORLD_SCALE, WATER_LEVEL + 5, lz * WORLD_SCALE);
  root.rotation.y = index * 1.7;
  game.scene.add(root);
  const entry = {
    root,
    speed: 0,
    playerDriveable: true,
    baseY: WATER_LEVEL + 5,
    attachedBoat: originalBoat
  };
  root.userData.v81MarineSafe = true;
  root.userData.v81MarineBoat = true;
  root.userData.v95RaftEntry = entry;
  root.userData.v81BoatEntry = entry;
  rafts.push(entry);
}

function updateAttachedRafts(elapsed) {
  for (const entry of rafts) {
    if (game?.activeBoat === entry.root) {
      // Corrige la altura fija de 72 unidades del controlador marino: esta
      // barca del HTML tiene el asiento a la altura real del personaje.
      // V102: la cubierta de la balsa adjunta queda a unas 3 unidades del
      // origen del grupo. Con 20 el personaje flotaba por encima de la barca.
      tempA.set(0, 3, 0);
      entry.root.localToWorld(tempA);
      game.playerContainer.position.copy(tempA);
      game.playerContainer.rotation.y = entry.root.rotation.y;
      continue;
    }
    entry.root.position.y = entry.baseY + Math.sin(elapsed * .9 + entry.root.id) * 1.2;
    entry.root.rotation.z = Math.sin(elapsed * .65 + entry.root.id) * .012;
  }
}

function nearestRaft(maxDistance = 175) {
  if (!game?.playerContainer || game.activeBoat || game.activeCar) return null;
  let best = null;
  let bestSq = maxDistance * maxDistance;
  const player = game.playerContainer.position;
  for (const entry of rafts) {
    const distanceSq = entry.root.position.distanceToSquared(player);
    if (distanceSq >= bestSq) continue;
    bestSq = distanceSq;
    best = entry;
  }
  return best ? { entry: best, distance: Math.sqrt(bestSq) } : null;
}

function enterRaft(entry) {
  if (!entry || game.activeBoat || game.activeCar || game.activeRiddenHorse) return;
  game.activeBoat = entry.root;
  entry.speed = 0;
  game.boatCamMode = 0;
  game.state.inWater = false;
  game.state.isSubmerged = false;
  game.state.isFlying = false;
  game.state.onGround = true;
  game.state.vy = 0;
  game.state.camMode = 0;
  // V102: se conduce viendo al personaje de pie encima de la balsa.
  if (game.playerModel) game.playerModel.visible = true;
  notice('BALSA · W/S AVANZAR · A/D GIRAR · V CÁMARA · E BAJAR', 3800);
}

function exitRaft() {
  const entry = game?.activeBoat?.userData?.v95RaftEntry;
  if (!entry) return false;
  tempA.set(64, 6, 0);
  entry.root.localToWorld(tempA);
  game.activeBoat = null;
  game.playerContainer.position.copy(tempA);
  game.playerContainer.position.y = WATER_LEVEL + 4;
  game.playerContainer.rotation.y = entry.root.rotation.y;
  game.state.inWater = true;
  game.state.isSubmerged = false;
  game.state.onGround = false;
  game.state.vy = 0;
  notice('HAS BAJADO DE LA BALSA');
  return true;
}

async function installMarineExpansion() {
  if (marineInstalled) return;
  const marine = window.__V84_MARINE_WORLD__ || window.__V81_MARINE_WORLD__;
  if (!marine?.underwaterGroup || !marine?.marineGroup) return;
  marineInstalled = true;
  await idleTurn(1200);
  buildMarineRocks(marine);
  await nextFrame();
  for (let i = 0; i < RAFT_COUNT; i++) makeRaft(i);
  window.__V95_MARINE_EXPANSION__ = { rafts, rocks: true };
}

/* ================================================================== */
/* CLIMA Y CICLO HORARIO                                               */
/* ================================================================== */

function createCloudTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const [x, y, r] of [[55,72,38],[95,53,50],[145,66,43],[190,76,33]]) {
    const gradient = ctx.createRadialGradient(x, y, 2, x, y, r);
    gradient.addColorStop(0, 'rgba(235,241,246,.82)');
    gradient.addColorStop(.55, 'rgba(174,184,196,.62)');
    gradient.addColorStop(1, 'rgba(124,136,151,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x-r, y-r, r*2, r*2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function buildWeather() {
  if (weatherRoot) return;
  weatherRoot = new THREE.Group();
  weatherRoot.name = 'CLIMA_DINAMICO_V100';
  const cloudMaterial = new THREE.SpriteMaterial({
    map: createCloudTexture(),
    transparent: true,
    depthWrite: false,
    opacity: .72,
    fog: true
  });
  const rand = seededRandom(7201);
  for (let i = 0; i < (LOW_POWER ? 7 : 12); i++) {
    const sprite = new THREE.Sprite(cloudMaterial);
    sprite.position.set(
      -9000 + rand() * 18000,
      1700 + rand() * 900,
      -9000 + rand() * 18000
    );
    const scale = 2100 + rand() * 2600;
    sprite.scale.set(scale * 1.9, scale, 1);
    sprite.userData.drift = 9 + rand() * 12;
    weatherRoot.add(sprite);
    weatherClouds.push(sprite);
  }

  const rainCount = LOW_POWER ? 120 : 240;
  rainPositions = new Float32Array(rainCount * 3);
  for (let i = 0; i < rainCount; i++) {
    rainPositions[i * 3] = (rand() - .5) * 3200;
    rainPositions[i * 3 + 1] = rand() * 2200 - 300;
    rainPositions[i * 3 + 2] = (rand() - .5) * 3200;
  }
  const rainGeometry = new THREE.BufferGeometry();
  rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
  rainRoot = new THREE.Points(
    rainGeometry,
    new THREE.PointsMaterial({
      color: 0xbad9ef,
      size: LOW_POWER ? 4 : 5.5,
      transparent: true,
      opacity: .72,
      depthWrite: false,
      sizeAttenuation: true
    })
  );
  rainRoot.name = 'LLUVIA_DINAMICA_V100';
  rainRoot.visible = false;
  weatherRoot.add(rainRoot);

  const starCount = LOW_POWER ? 160 : 300;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const angle = rand() * Math.PI * 2;
    const radius = 10500 + rand() * 5500;
    const height = 4200 + rand() * 9000;
    starPositions[i * 3] = Math.cos(angle) * radius;
    starPositions[i * 3 + 1] = height;
    starPositions[i * 3 + 2] = Math.sin(angle) * radius;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starRoot = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({
      color: 0xe8f4ff,
      size: LOW_POWER ? 20 : 24,
      transparent: true,
      opacity: .92,
      depthWrite: false,
      sizeAttenuation: true
    })
  );
  starRoot.name = 'ESTRELLAS_NOCTURNAS_V100';
  starRoot.visible = false;
  weatherRoot.add(starRoot);

  game.scene.traverse(object => {
    if (!(object.isAmbientLight || object.isHemisphereLight || object.isDirectionalLight)) return;
    if (weatherLights.some(entry => entry.light === object)) return;
    weatherLights.push({
      light: object,
      intensity: Math.max(.05, Number(object.intensity || 1)),
      color: object.color?.clone?.() || null,
      groundColor: object.groundColor?.clone?.() || null
    });
  });

  game.scene.add(weatherRoot);
}

function weatherForMinutes(minutes) {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hour = normalized / 60;
  const period = Math.floor(normalized / 180);
  const periodKey = `${Math.floor(normalized / 1440)}:${period}`;
  if (periodKey !== weatherPeriodKey) {
    weatherPeriodKey = periodKey;
    weatherRoll = Math.random();
  }

  if (hour >= 5.1 && hour < 7.5) {
    return {
      label: weatherRoll < .24 ? 'AMANECER NUBLADO' : 'AMANECER ROSADO',
      sky: weatherRoll < .24 ? 0x8496a9 : weatherRoll < .62 ? 0xe9928b : 0xf3b087,
      cloudy: weatherRoll < .24, rain: false, night: false, stars: false, light: .62
    };
  }
  if (hour >= 17.1 && hour < 19.55) {
    return {
      label: weatherRoll < .25 ? 'ATARDECER NUBLADO' : weatherRoll < .66 ? 'CIELO ROSADO' : 'CIELO ROJO',
      sky: weatherRoll < .25 ? 0x6d7185 : weatherRoll < .66 ? 0xd78199 : 0xa94339,
      cloudy: weatherRoll < .25, rain: weatherRoll < .08, night: false, stars: false, light: .55
    };
  }
  if (hour >= 7.5 && hour < 17.1) {
    if (weatherRoll < .13) return {
      label:'LLUVIA', sky:0x697887, cloudy:true, rain:true, night:false, stars:false, light:.58
    };
    if (weatherRoll < .38) return {
      label:'NUBLADO', sky:0x8492a0, cloudy:true, rain:false, night:false, stars:false, light:.7
    };
    return {
      label:'SOLEADO', sky:0x3bb6ee, cloudy:false, rain:false, night:false, stars:false, light:1
    };
  }
  if (weatherRoll < .15) return {
    label:'NOCHE LLUVIOSA', sky:0x08101b, cloudy:true, rain:true, night:true, stars:false, light:.25
  };
  if (weatherRoll < .42) return {
    label:'NOCHE NUBLADA', sky:0x121a29, cloudy:true, rain:false, night:true, stars:false, light:.3
  };
  return {
    label:'NOCHE DESPEJADA', sky:0x06112b, cloudy:false, rain:false, night:true, stars:true, light:.34
  };
}

function updateWeather(dt) {
  if (!weatherRoot || !Number.isFinite(game?.gameTimeMinutes)) return;
  currentWeather = weatherForMinutes(game.gameTimeMinutes);
  const submerged = Boolean(game.state?.isSubmerged);
  for (const cloud of weatherClouds) cloud.visible = currentWeather.cloudy && !submerged;
  rainRoot.visible = currentWeather.rain && !submerged;
  starRoot.visible = currentWeather.stars && !submerged;

  for (const cloud of weatherClouds) {
    cloud.position.x += cloud.userData.drift * dt;
    if (cloud.position.x > 9500) cloud.position.x = -9500;
  }

  if (!submerged) applyCurrentWeatherVisuals();
  window.__GTA_MANUCHO_WEATHER__ = currentWeather.label;
}

function applyCurrentWeatherVisuals() {
  if (!currentWeather || !game?.scene || game.state?.isSubmerged) return;
  const sky = new THREE.Color(currentWeather.sky);
  if (game.scene.background?.isColor) game.scene.background.copy(sky);
  else game.scene.background = sky;
  if (game.scene.fog?.color) {
    game.scene.fog.color.copy(sky).multiplyScalar(currentWeather.night ? .42 : .74);
  }
  for (const entry of weatherLights) {
    const factor = currentWeather.light;
    entry.light.intensity = Math.max(.08, entry.intensity * factor);
    if (entry.color && entry.light.color) {
      entry.light.color.copy(entry.color);
      if (currentWeather.night) entry.light.color.lerp(new THREE.Color(0x8299c5), .35);
      else if (currentWeather.label.includes('ROSADO') || currentWeather.label.includes('ROJO')) {
        entry.light.color.lerp(new THREE.Color(0xff9a7f), .28);
      }
    }
    if (entry.groundColor && entry.light.groundColor) {
      entry.light.groundColor.copy(entry.groundColor);
    }
  }
}

function createShootingStar() {
  if (!currentWeather?.stars || shootingStars.length >= (LOW_POWER ? 1 : 2)) return;
  const origin = game.camera.position.clone();
  origin.x += (Math.random() - .5) * 9000;
  origin.y += 4500 + Math.random() * 3500;
  origin.z += (Math.random() - .5) * 9000;
  const end = origin.clone().add(new THREE.Vector3(-900 - Math.random() * 800, -500, 320));
  const geometry = new THREE.BufferGeometry().setFromPoints([origin, end]);
  const material = new THREE.LineBasicMaterial({
    color: 0xf6fbff,
    transparent: true,
    opacity: .95,
    depthWrite: false
  });
  const line = new THREE.Line(geometry, material);
  line.name = 'ESTRELLA_FUGAZ_V100';
  game.scene.add(line);
  shootingStars.push({ line, geometry, material, age:0, duration:1.25 });
}

function updateWeatherEffects(dt, now) {
  if (!weatherRoot || !game?.camera) return;
  const camera = game.camera.position;
  weatherRoot.position.set(camera.x, 0, camera.z);
  if (rainRoot?.visible && rainPositions) {
    for (let i = 1; i < rainPositions.length; i += 3) {
      rainPositions[i] -= dt * 1900;
      if (rainPositions[i] < -350) rainPositions[i] += 2500;
    }
    rainRoot.geometry.attributes.position.needsUpdate = true;
  }
  if (currentWeather?.stars && now >= nextShootingStarAt) {
    createShootingStar();
    nextShootingStarAt = now + 15000 + Math.random() * 26000;
  }
  for (let i = shootingStars.length - 1; i >= 0; i--) {
    const star = shootingStars[i];
    star.age += dt;
    star.line.position.x -= dt * 1100;
    star.line.position.y -= dt * 420;
    star.material.opacity = Math.max(0, 1 - star.age / star.duration);
    if (star.age < star.duration) continue;
    star.line.parent?.remove(star.line);
    star.geometry.dispose();
    star.material.dispose();
    shootingStars.splice(i, 1);
  }
}

/* ================================================================== */
/* ISLA-CEMENTERIO 00:00–00:15                                        */
/* ================================================================== */

const HAUNTED = {
  x: 520 * WORLD_SCALE,
  z: 2180 * WORLD_SCALE,
  radius: 35 * WORLD_SCALE,
  top: WATER_LEVEL + 1
};

function buildHauntedIsland() {
  if (hauntedRoot) return;
  hauntedRoot = createAttachedGraveyard(WORLD_SCALE);
  hauntedRoot.name = 'ISLA_CEMENTERIO_HTML_0000_0015_V97';
  hauntedRoot.position.set(HAUNTED.x, WATER_LEVEL + 1, HAUNTED.z);
  hauntedLight = new THREE.PointLight(0x849dff, 0, 2400, 2);
  hauntedLight.position.set(0, 320, 0);
  hauntedRoot.add(hauntedLight);
  if (ravenTemplate && ravenAnimations.length) {
    for (let i = 0; i < 5; i++) {
      const raven = cloneSkeleton(ravenTemplate);
      raven.name = `CUERVO_CEMENTERIO_HTML_V97_${i + 1}`;
      // ravenTemplate ya está en escala mundial (2.5 m); el cementerio usa
      // escala de metros, por eso se ajusta a BIRD_SCALE 1.6 del HTML nocturno.
      raven.scale.setScalar((1.6 / 2.5) / WORLD_SCALE);
      const mixer = new THREE.AnimationMixer(raven);
      mixer.clipAction(ravenAnimations[0]).play();
      hauntedRoot.add(raven);
      hauntedRavens.push({
        root: raven,
        mixer,
        phase: i / 5 * Math.PI * 2,
        speed: 3 + i * .65,
        radius: 12 + i * 2.2,
        height: 6 + (i % 3) * 2.5
      });
    }
  }
  hauntedRoot.visible = false;
  game.scene.add(hauntedRoot);
}

function patchHauntedGround() {
  if (game.__v95HauntedGroundPatched || typeof game.getGroundY !== 'function') return;
  game.__v95HauntedGroundPatched = true;
  const previous = game.getGroundY.bind(game);
  game.getGroundY = function v95HauntedGround(x, y, z, strict = true) {
    let base;
    try { base = previous(x, y, z, strict); } catch { base = -Infinity; }
    if (hauntedVisible) {
      const dx = x - HAUNTED.x;
      const dz = z - HAUNTED.z;
      if (dx * dx + dz * dz <= HAUNTED.radius * HAUNTED.radius) {
        const islandTop = hauntedRoot?.position?.y ?? HAUNTED.top;
        return Math.max(Number.isFinite(base) ? base : -Infinity, islandTop);
      }
    }
    return base;
  };
}

function updateHauntedIsland(elapsed, dt = 0) {
  if (!hauntedRoot || !Number.isFinite(game?.gameTimeMinutes)) return;
  const minutes = ((game.gameTimeMinutes % 1440) + 1440) % 1440;
  const shouldShow = minutes >= 0 && minutes < 15;
  if (shouldShow !== hauntedVisible) {
    hauntedVisible = shouldShow;
    hauntedRoot.visible = shouldShow;
    if (shouldShow) {
      notice('A LAS 00:00 HA APARECIDO UNA ISLA-CEMENTERIO EN EL MAR', 5000);
    } else {
      notice('LA ISLA-CEMENTERIO HA DESAPARECIDO', 3200);
    }
  }
  if (!hauntedVisible) return;
  hauntedRoot.rotation.y = Math.sin(elapsed * .08) * .012;
  hauntedRoot.position.y = WATER_LEVEL + Math.sin(elapsed * .42) * 1.6;
  if (hauntedLight) hauntedLight.intensity = 1.1 + Math.sin(elapsed * 2.1) * .2;
  for (const bird of hauntedRavens) {
    const angle = elapsed * bird.speed / bird.radius + bird.phase;
    bird.root.position.set(
      Math.cos(angle) * bird.radius,
      bird.height + Math.sin(angle * 2.2) * .8,
      Math.sin(angle) * bird.radius
    );
    bird.root.rotation.y = -angle;
    bird.mixer.update(dt);
  }
}

/* ================================================================== */
/* ENTRADAS, INTERACCIÓN Y BUCLE                                      */
/* ================================================================== */

function guardEmptyWeaponSlot(event) {
  if (!/^Digit[1-9]$/.test(event.code)) return false;
  const index = Number(event.code.slice(5)) - 1;
  const items = window.__VICE_WEAPON_ITEMS__;
  if (Array.isArray(items) && items[index]) return false;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  notice(`RANURA ${index + 1} VACÍA · RECOGE EL ARMA EN UNA CAJA`, 1900);
  return true;
}

function handleKeyDown(event) {
  if (isEditable(event.target)) return;
  if (guardEmptyWeaponSlot(event)) return;
  if (event.code === 'KeyV' && activeBike) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (game?.keys) {
      game.keys.KeyV = false;
      game.keys.v = false;
    }
    // Bloquea repeticiones del teclado y cualquier segundo listener de cámara:
    // una pulsación física siempre avanza exactamente una sola vista.
    if (event.repeat || bikeCameraKeyHeld) return;
    bikeCameraKeyHeld = true;
    cycleBikeCamera();
    return;
  }
  if (event.repeat) return;
  if (event.code !== 'KeyE') return;

  if (activeBike) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    // V102: se limpia la tecla en el estado del motor. Si no, el juego base la
    // seguía leyendo en su bucle y consumía la pulsación por su cuenta, que era
    // el motivo de tener que pulsar E dos veces para bajar de la moto.
    if (game?.keys) { game.keys.KeyE = false; game.keys.e = false; }
    exitBike();
    return;
  }
  if (exitRaft()) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    return;
  }
  if (game.activeCar || game.activeBoat || game.activeRiddenHorse ||
      window.__ACTIVE_AIRCRAFT__ || window.__ACTIVE_TANK__) return;

  const bike = nearestBike();
  if (bike) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    enterBike(bike.entry);
    return;
  }
  const raft = nearestRaft();
  if (raft) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    enterRaft(raft.entry);
  }
}

function handleKeyUp(event) {
  if (event.code !== 'KeyV') return;
  bikeCameraKeyHeld = false;
  if (!activeBike) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  if (game?.keys) {
    game.keys.KeyV = false;
    game.keys.v = false;
  }
}

function handleBikeMouseLook(event) {
  if (!activeBike || bikeCameraMode !== 2 ||
      document.pointerLockElement !== game?.renderer?.domElement) return;
  activeBike.lookYaw = THREE.MathUtils.clamp(
    activeBike.lookYaw - Number(event.movementX || 0) * .0022,
    -1.35,
    1.35
  );
  activeBike.lookPitch = THREE.MathUtils.clamp(
    activeBike.lookPitch - Number(event.movementY || 0) * .0018,
    -.62,
    .58
  );
}

function flashBikeCombatHit() {
  if (!activeBike || !crosshairNode) return;
  crosshairNode.style.filter = 'drop-shadow(0 0 8px #ff304f)';
  crosshairNode.style.transform = 'translate(-50%,-50%) scale(1.34)';
  clearTimeout(crosshairNode.__v98HitTimer);
  crosshairNode.__v98HitTimer = setTimeout(() => {
    if (!crosshairNode) return;
    crosshairNode.style.filter = 'drop-shadow(0 0 3px #000)';
    crosshairNode.style.transform = 'translate(-50%,-50%) scale(1)';
  }, 125);
}

function updateInteractionPrompt() {
  if (activeBike) {
    showPrompt(`MOTO · CÁMARA ${bikeCameraMode + 1}/3 ${['LEJOS', 'CERCA', '1.ª PERSONA'][bikeCameraMode]} · V CÁMARA · E BAJAR · CLIC DISPARAR`);
    return;
  }
  if (game?.activeBoat?.userData?.v95RaftEntry) {
    showPrompt('BALSA · W/S AVANZAR · A/D GIRAR · V CÁMARA · E BAJAR');
    return;
  }
  if (game?.activeCar || game?.activeBoat || game?.activeRiddenHorse) {
    hidePrompt();
    return;
  }
  const bike = nearestBike();
  if (bike) {
    showPrompt(`E · ROBAR MOTO DEL NPC · ${Math.round(bike.distance)} m`);
    return;
  }
  const raft = nearestRaft();
  if (raft) {
    showPrompt(`E · SUBIR A LA BALSA · ${Math.round(raft.distance)} m`);
    return;
  }
  hidePrompt();
}

function ensureDiveClick() {
  window.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !game?.state?.inWater || game.activeBoat) return;
    game.isMouseDown = true;
  }, true);
  window.addEventListener('pointerup', event => {
    if (event.button === 0 && game?.state?.inWater) game.isMouseDown = false;
  }, true);
}

function frame(now = performance.now()) {
  requestAnimationFrame(frame);
  if (!game || document.hidden || window.__GTA_PAUSED__ || window.__VICE_ZONE_TRANSITION__) {
    lastFrame = now;
    return;
  }
  const dt = Math.min(.07, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;
  const elapsed = now / 1000;
  updateWeatherEffects(dt, now);

  npcAccumulator += dt;
  if (npcAccumulator >= .1) {
    const step = Math.min(.16, npcAccumulator);
    npcAccumulator = 0;
    for (const entry of bikes) updateNpcBike(entry, step);
  }

  birdAccumulator += dt;
  if (birdAccumulator >= .05) {
    const step = Math.min(.09, birdAccumulator);
    birdAccumulator = 0;
    updateBirds(step, elapsed);
  }

  collisionAccumulator += dt;
  if (collisionAccumulator >= .035) {
    collisionAccumulator = 0;
    resolvePlayerTreeCollision();
  }

  promptAccumulator += dt;
  if (promptAccumulator >= .25) {
    promptAccumulator = 0;
    updateInteractionPrompt();
    patchWeaponsForBirds();
  }

  visibilityAccumulator += dt;
  if (visibilityAccumulator >= 1.1) {
    visibilityAccumulator = 0;
    updateBikeVisibility();
    patchBikeRenderer();
  }
  legacyTreeAccumulator += dt;
  if (legacyTreeAccumulator >= 3) {
    legacyTreeAccumulator = 0;
    replaceLegacyRetiroTrees();
  }

  weatherAccumulator += dt;
  if (weatherAccumulator >= .5) {
    const step = weatherAccumulator;
    weatherAccumulator = 0;
    updateWeather(step);
  }

  updateHauntedIsland(elapsed, dt);
  updateAttachedRafts(elapsed);
}

async function install() {
  game = window.__VICE_CITY_GAME__;
  if (!game?.scene || !game?.renderer || !game?.camera || !game?.playerContainer) return false;
  if (window.__V100_FREE_ROAM_INSTALLED__) return true;
  window.__V100_FREE_ROAM_INSTALLED__ = true;
  window.__V99_FREE_ROAM_INSTALLED__ = true;
  window.__V95_FREE_ROAM_INSTALLED__ = true;

  ensureUi();
  patchBikeRenderer();
  patchBikeController();
  patchHauntedGround();
  ensureDiveClick();
  window.addEventListener('keydown', handleKeyDown, true);
  // V102: expuesto para el guion de controles prioritarios, que se registra
  // antes que ningún módulo y garantiza una acción por pulsación física.
  window.__V100_BIKE_API__ = {
    get activeBike() { return activeBike; },
    exitBike,
    cycleBikeCamera,
    applyBikeCamera,
    patchBikeRenderer,
    nearestBike,
    enterBike,
    nearestRaft,
    enterRaft,
    exitRaft,
    get activeRaft() { return game?.activeBoat?.userData?.v95RaftEntry || null; }
  };
  window.addEventListener('keyup', handleKeyUp, true);
  document.addEventListener('mousemove', handleBikeMouseLook, true);
  window.addEventListener('vice-combat-hit', flashBikeCombatHit);

  const modelLoad = loadDeathchaseAssets(game.renderer);
  await idleTurn(750);
  buildParkForest();
  await nextFrame();

  try {
    deathchaseAssets = await modelLoad;
  } catch (error) {
    console.error('[GTA MANUCHO V100] No se pudieron cargar los modelos originales adjuntos.', error);
    notice('ERROR AL CARGAR LAS MOTOS ORIGINALES', 4200);
  }
  for (let i = 0; i < BIKE_COUNT; i++) {
    makeMotorcycle(i);
    if (i % 2 === 1) await nextFrame();
  }
  updateBikeVisibility();

  await idleTurn(900);
  try {
    await loadAttachedRaven();
    for (let i = 0; i < BIRD_COUNT; i++) createBird(i);
    resetFlock();
  } catch (error) {
    console.error('[GTA MANUCHO V100] No se pudo cargar raven.glb.', error);
    notice('ERROR AL CARGAR LOS PÁJAROS ORIGINALES', 4000);
  }

  buildWeather();
  buildHauntedIsland();

  if (window.__GTA_MARINE_READY__) {
    installMarineExpansion().catch(error => console.warn('[V100] Expansión marina incompleta.', error));
  } else {
    window.addEventListener('gta-manucho-marine-ready', () => {
      installMarineExpansion().catch(error => console.warn('[V100] Expansión marina incompleta.', error));
    }, { once: true });
  }

  window.__V100_FREE_ROAM__ = window.__V99_FREE_ROAM__ = window.__V98_FREE_ROAM__ = window.__V97_FREE_ROAM__ = window.__V95_FREE_ROAM__ = {
    bikes,
    rafts,
    birds,
    treeColliders,
    haunted: HAUNTED,
    get weather() { return window.__GTA_MANUCHO_WEATHER__; },
    get activeBike() { return activeBike; },
    get bikeCameraMode() { return bikeCameraMode; }
  };
  requestAnimationFrame(frame);
  return true;
}

const wait = setInterval(() => {
  game = window.__VICE_CITY_GAME__ || game;
  if (!game?.scene || !game?.renderer || !game?.camera || !game?.playerContainer) return;
  clearInterval(wait);
  install().catch(error => console.error('[GTA MANUCHO V100] Error de instalación.', error));
}, 100);

setTimeout(() => clearInterval(wait), 30000);
