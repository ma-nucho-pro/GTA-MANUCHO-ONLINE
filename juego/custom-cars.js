/**
 * GTA MANUCHO V84 — código del proyecto.
 * Creado e integrado por Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * ARKEA AI / Manucho · conserva LICENSE, NOTICE.md y estos créditos al reutilizar.
 */
import * as THREE from './bosque/libs/three.module.js';
import { GLTFLoader } from './bosque/bike-runtime/loaders/GLTFLoader.js';
import { DRACOLoader } from './bosque/bike-runtime/loaders/DRACOLoader.js';

THREE.Cache.enabled = true;
window.__CUSTOM_CARS_EXPECTED__ = true;
window.__CUSTOM_CARS_READY__ = false;

const CARS = [];
const COLORS = [0xe51b23, 0x1565c0, 0xff7a00, 0x20252c, 0xf2f2f2, 0x5a189a, 0x087f5b, 0xf1c40f];
const CAMERA_NAMES = ['CERCA DETRÁS', 'VENTANA · PRIMERA PERSONA', 'DRON · ARRIBA DETRÁS'];
const TRAFFIC_STEP = 1 / 14;
const FIXED_CAR_LENGTH = 88;
const FERRARI_TRAFFIC_COUNT = 10;
const WORLD_SCALE = 16;

// V41: rutas verificadas con las dimensiones exactas de buildWorld() y escaladas
// por WORLD_SCALE=16. Cada circuito queda dentro de asfalto sólido o de un puente.
const ROAD_ROUTE_COORDS = [
  // Isla oeste sur: x [-2400,-600], z [-5350,-3350].
  [[-2250,0.10,-5200],[-750,0.10,-5200],[-750,0.10,-3500],[-2250,0.10,-3500]],
  // Isla oeste central: x [-2500,-500], z [-3600,-600].
  [[-2350,0.10,-3450],[-650,0.10,-3450],[-650,0.10,-750],[-2350,0.10,-750]],
  // Isla oeste norte: x [-2500,-500], z [-300,2700].
  [[-2350,0.10,-150],[-650,0.10,-150],[-650,0.10,2550],[-2350,0.10,2550]],
  // Isla este sur: x [750,2250], z [-5350,-3350].
  [[900,0.10,-5200],[2100,0.10,-5200],[2100,0.10,-3500],[900,0.10,-3500]],
  // Isla este central: x [750,2250], z [-3600,-600].
  [[900,0.10,-3450],[2100,0.10,-3450],[2100,0.10,-750],[900,0.10,-750]],
  // Isla este superior rodeando el Retiro sin entrar en el parque.
  [[850,0.10,-800],[2150,0.10,-800],[2150,0.10,-450],[1000,0.10,-450],
   [1000,0.10,1050],[2150,0.10,1050],[2150,0.10,1950],[850,0.10,1950]],
  // Isla este norte: x [750,2250], z [2700,4200].
  [[900,0.10,2850],[2100,0.10,2850],[2100,0.10,4050],[900,0.10,4050]],
  // Isla central pequeña: x [-400,400], z [-525,75].
  [[-320,0.10,-450],[320,0.10,-450],[320,0.10,0],[-320,0.10,0]],
  // Puente occidental de z=-225, con ida y vuelta por carriles separados.
  [[-1800,0.10,-260],[-1050,0.10,-260],[-500,2.00,-260],
   [-500,2.00,-190],[-1050,0.10,-190],[-1800,0.10,-190]],
  // Puente norte de z=1275, con carriles de ida y vuelta.
  [[-1800,0.10,1225],[-1000,2.00,1225],[1000,2.00,1225],[1800,0.10,1225],
   [1800,0.10,1325],[1000,2.00,1325],[-1000,2.00,1325],[-1800,0.10,1325]]
];
const RETIRO_NO_TRAFFIC = { xMin: 1080, xMax: 2250, zMin: -320, zMax: 980 };
const TRAFFIC_SURFACES = [
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
const tempA = new THREE.Vector3();
const tempB = new THREE.Vector3();
const tempC = new THREE.Vector3();
const tempBox = new THREE.Box3();
const tempSize = new THREE.Vector3();
const tempCenter = new THREE.Vector3();
const tempQuaternion = new THREE.Quaternion();
const ferrariBodyMaterialVariants = new Map();

let game = null;
let active = null;
let cameraMode = 0;
let cameraSnapFrames = 0;
let rendererPatched = false;
let drivePatched = false;
let installed = false;
let lastFrameTime = performance.now();
let promptAccumulator = 0;
let visibilityAccumulator = 0;
let trafficAccumulator = 0;

function nextFrame() {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

function idleTurn(timeout = 700) {
  return new Promise(resolve => {
    if ('requestIdleCallback' in window) requestIdleCallback(() => resolve(), { timeout });
    else setTimeout(resolve, 24);
  });
}

function notice(text, duration = 2600) {
  let node = document.getElementById('custom-car-notice');
  if (!node) {
    node = document.createElement('div');
    node.id = 'custom-car-notice';
    node.style.cssText = [
      'position:fixed','left:50%','bottom:27px','transform:translateX(-50%)','z-index:3600',
      'padding:9px 14px','border-radius:10px','background:rgba(4,9,18,.88)',
      'border:1px solid rgba(0,220,255,.72)','color:#effcff','font:800 12px Arial,sans-serif',
      'letter-spacing:.045em','pointer-events:none','box-shadow:0 12px 34px rgba(0,0,0,.42)',
      'display:none'
    ].join(';');
    document.body.appendChild(node);
  }
  node.textContent = text;
  node.style.display = 'block';
  clearTimeout(node.__hideTimer);
  node.__hideTimer = setTimeout(() => { node.style.display = 'none'; }, duration);
}

function ensurePrompt() {
  let node = document.getElementById('custom-car-prompt');
  if (node) return node;
  node = document.createElement('div');
  node.id = 'custom-car-prompt';
  node.style.cssText = [
    'position:fixed','left:50%','bottom:72px','transform:translateX(-50%)','z-index:3500',
    'padding:8px 13px','border-radius:9px','background:rgba(2,8,16,.9)',
    'border:1px solid rgba(0,225,255,.65)','color:#e8fbff','font:800 12px Arial,sans-serif',
    'letter-spacing:.04em','pointer-events:none','display:none','box-shadow:0 10px 28px rgba(0,0,0,.4)'
  ].join(';');
  document.body.appendChild(node);
  return node;
}

const prompt = ensurePrompt();

function measurePlayerHeight() {
  const root = game?.playerModel || game?.playerContainer;
  if (!root) return 38;
  root.updateWorldMatrix(true, true);
  tempBox.setFromObject(root);
  const height = tempBox.max.y - tempBox.min.y;
  return Number.isFinite(height) && height > 5 ? THREE.MathUtils.clamp(height, 26, 56) : 38;
}

function optimizeMaterial(material, bodyColor, shouldColor) {
  if (!material) return material;
  if (!shouldColor) return material;
  const copy = material.clone();
  copy.color?.setHex(bodyColor);
  if ('roughness' in copy) copy.roughness = Math.max(.25, copy.roughness ?? .35);
  if ('metalness' in copy) copy.metalness = Math.min(.72, copy.metalness ?? .4);
  return copy;
}

function prepareFerrariVisual(root, bodyColor) {
  root.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = false;
    object.receiveShadow = false;
    object.frustumCulled = true;
    const objectName = String(object.name || '').toLowerCase();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const prepared = materials.map(material => {
      const materialName = String(material?.name || '').toLowerCase();
      const isBody = materialName.includes('body') || objectName === 'body' || objectName.includes('paint');
      if (!isBody) return material;
      const key = `${material?.uuid || materialName}:${bodyColor}`;
      if (!ferrariBodyMaterialVariants.has(key)) ferrariBodyMaterialVariants.set(key, optimizeMaterial(material, bodyColor, true));
      return ferrariBodyMaterialVariants.get(key);
    });
    object.material = Array.isArray(object.material) ? prepared : prepared[0];
  });
}

function collectWheelNodes(root) {
  const result = [];
  root.traverse(object => {
    const name = String(object.name || '').toLowerCase();
    if (name.includes('wheel') && !name.includes('steering')) result.push(object);
  });
  return result;
}

function freezeStaticHierarchy(root, animatedNodes = []) {
  const animatedSet = new Set(animatedNodes);
  root.traverse(object => {
    if (object === root || animatedSet.has(object)) return;
    object.updateMatrix();
    object.matrixAutoUpdate = false;
  });
}

function normalizeFerrari(source, targetLength, color) {
  const visual = source.clone(true);
  prepareFerrariVisual(visual, color);
  visual.rotation.set(0, 0, 0);
  visual.scale.set(1, 1, 1);
  visual.position.set(0, 0, 0);
  visual.updateMatrixWorld(true);

  tempBox.setFromObject(visual);
  tempBox.getSize(tempSize);
  if (tempSize.x > tempSize.z * 1.15) visual.rotation.y = Math.PI / 2;
  visual.updateMatrixWorld(true);

  const wheelFront = [visual.getObjectByName('wheel_fl'), visual.getObjectByName('wheel_fr')].filter(Boolean);
  const wheelRear = [visual.getObjectByName('wheel_rl'), visual.getObjectByName('wheel_rr')].filter(Boolean);
  if (wheelFront.length && wheelRear.length) {
    const frontZ = wheelFront.reduce((sum, wheel) => sum + wheel.getWorldPosition(tempA).z, 0) / wheelFront.length;
    const rearZ = wheelRear.reduce((sum, wheel) => sum + wheel.getWorldPosition(tempA).z, 0) / wheelRear.length;
    if (frontZ > rearZ) visual.rotation.y += Math.PI;
  }
  visual.updateMatrixWorld(true);

  tempBox.setFromObject(visual);
  tempBox.getSize(tempSize);
  const length = Math.max(tempSize.z, tempSize.x, .001);
  visual.scale.setScalar(targetLength / length);
  visual.updateMatrixWorld(true);
  tempBox.setFromObject(visual);
  tempBox.getCenter(tempCenter);
  visual.position.x -= tempCenter.x;
  visual.position.z -= tempCenter.z;
  visual.position.y -= tempBox.min.y;
  visual.updateMatrixWorld(true);

  const holder = new THREE.Group();
  holder.add(visual);
  holder.updateMatrixWorld(true);
  tempBox.setFromObject(holder);
  tempBox.getSize(tempSize);
  const wheels = collectWheelNodes(visual);
  freezeStaticHierarchy(visual, wheels);
  return {
    root: holder,
    wheels,
    length: Math.max(tempSize.z, targetLength),
    width: Math.max(tempSize.x, targetLength * .42),
    height: Math.max(tempSize.y, targetLength * .28),
    highDetail: true
  };
}

function groundAt(x, z, fallback = 0) {
  try {
    const value = game.getGroundY?.(x, fallback + 80, z, false);
    return Number.isFinite(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function positionCar(car, x, z, yaw = 0) {
  const y = groundAt(x, z, game.playerContainer?.position.y || 0);
  car.root.position.set(x, y + .35, z);
  car.root.rotation.y = yaw;
  car.root.carSpeed = 0;
  car.root.userData.__customDriveableCar = true;
  car.root._isAlwaysVisible = false;
  car.root.visible = false;
  car.root.userData.customCarData = car;
  car.root._cx = x;
  car.root._cz = z;
  car.cachedGround = y;
  car.groundTimer = .15 + CARS.length * .11;
  car.visibilityTimer = Math.random() * .5;
  car.driveGroundTimer = 0;
  car.driveCollisionTimer = 0;
  car.driveCanMove = true;
  game.scene.add(car.root);
  CARS.push(car);
}

function nearestCar(maxDistance = 62) {
  if (!game?.playerContainer) return null;
  const player = game.playerContainer.position;
  let best = null;
  let bestDistanceSq = maxDistance * maxDistance;
  for (const car of CARS) {
    if (car === active || car.root.visible === false) continue;
    const dx = car.root.position.x - player.x;
    const dz = car.root.position.z - player.z;
    const distanceSq = dx * dx + dz * dz;
    if (distanceSq < bestDistanceSq) {
      best = car;
      bestDistanceSq = distanceSq;
    }
  }
  return best ? { car: best, distance: Math.sqrt(bestDistanceSq) } : null;
}

function enterCar(car) {
  if (!car || game.activeCar || game.activeBoat || game.activeRiddenHorse) return;
  active = car;
  car.autopilot = false;
  car.playerOwned = true;
  car.root.userData.playerOwned = true;
  if (car.serviceEntry) car.serviceEntry.playerOwned = true;
  car.root.userData.lastPlayerEnterAt = performance.now();
  car.root.carSpeed = 0;
  if (String(game.currentMessage || '').includes('ATROPELL')) { game.currentMessage = undefined; game.updateHUDState?.(); }
  game.activeCar = car.root;
  game.activeBoat = null;
  game.activeRiddenHorse = null;
  game.nearestDriveableCar = null;
  game.state.isFlying = false;
  game.state.inWater = false;
  cameraMode = 0;
  game.boatCamMode = 0;
  // V85: cámara normal al entrar. El zoom óptico x4 con la cámara pegada al
  // coche hacía que la vista se viera "al revés" / dentro de la carrocería.
  game.camera.fov = 62;
  game.camera.near = 0.1;
  game.camera.zoom = 1;
  game.camera.up.set(0, 1, 0);
  game.camera.updateProjectionMatrix();
  cameraSnapFrames = 6;
  if (game.playerModel) game.playerModel.visible = false;
  prompt.style.display = 'none';
  notice('VEHÍCULO AHORA ES TUYO · V CÁMARA · W/S ACELERAR · A/D GIRAR · E BAJAR · Y MISIÓN', 4200);
  game.updateHUDState?.();
}

function exitCar() {
  if (!active) return;
  const car = active;
  // Se coloca al jugador claramente fuera de la caja del vehículo. La versión
  // anterior lo dejaba rozando la carrocería y el detector lo marcaba como atropello.
  const side = tempA.set(car.width * 1.08, 0, car.length * .06).applyQuaternion(car.root.quaternion);
  const exitX = car.root.position.x + side.x;
  const exitZ = car.root.position.z + side.z;
  const exitY = groundAt(exitX, exitZ, car.root.position.y);
  game.playerContainer.position.set(exitX, exitY + .4, exitZ);
  game.playerContainer.rotation.y = car.root.rotation.y;
  if (game.playerModel) game.playerModel.visible = true;
  car.root.carSpeed = 0;
  const exitNow = performance.now();
  car.root.userData.lastPlayerExitAt = exitNow;
  game.playerContainer.userData.v74VehicleExitGraceUntil = exitNow + 3000;
  if (String(game.currentMessage || '').includes('ATROPELL')) game.currentMessage = undefined;
  game.activeCar = null;
  active = null;
  cameraMode = 0;
  game.camera.up.set(0, 1, 0);
  game.camera.fov = 60;
  game.camera.near = 0.1;
  game.camera.zoom = 1;
  game.camera.updateProjectionMatrix();
  notice('HAS BAJADO DEL COCHE');
  game.updateHUDState?.();
}

function cycleCamera() {
  if (!active) return;
  cameraMode = (cameraMode + 1) % CAMERA_NAMES.length;
  // V85: todas las vistas usan zoom 1 y FOV natural; el zoom x4 rompía la cámara.
  game.camera.fov = cameraMode === 1 ? 74 : 62;
  game.camera.zoom = 1;
  game.camera.near = cameraMode === 1 ? 0.32 : 0.1;
  game.camera.up.set(0, 1, 0);
  game.camera.updateProjectionMatrix();
  cameraSnapFrames = 6;
  notice(`CÁMARA: ${CAMERA_NAMES[cameraMode]}`, 1500);
}

function carLocalToWorld(car, x, y, z, target) {
  target.set(x, y, z);
  return car.root.localToWorld(target);
}

function applyCamera(camera) {
  if (!active || game.activeCar !== active.root) return;
  const car = active;
  const { length, height, width } = car;
  let smoothFactor = .24;

  // Solo existen tres vistas al conducir:
  // 0) chase cam detrás, 1) primera persona, 2) dron arriba-detrás.
  switch (cameraMode) {
    case 1:
      // Primera persona: cámara delante del parabrisas, mirando lejos al frente.
      carLocalToWorld(car, -width * .08, height * .80, -length * .50, tempA);
      carLocalToWorld(car, -width * .05, height * .72, -length * 6.0, tempB);
      smoothFactor = 1;
      break;
    case 2:
      // Dron: más alto y atrás para ver el tráfico.
      carLocalToWorld(car, 0, height * 2.6, length * 1.55, tempA);
      carLocalToWorld(car, 0, height * .45, -length * .35, tempB);
      smoothFactor = .3;
      break;
    default:
      // V85: chase cam clásica de GTA, separada del coche y mirando al frente.
      carLocalToWorld(car, 0, height * 1.35, length * 1.28, tempA);
      carLocalToWorld(car, 0, height * .48, -length * .85, tempB);
      smoothFactor = .38;
      break;
  }

  if (cameraSnapFrames > 0) {
    cameraSnapFrames--;
    smoothFactor = 1;
  }
  if (smoothFactor >= 1) camera.position.copy(tempA);
  else camera.position.lerp(tempA, smoothFactor);
  camera.lookAt(tempB);
  camera.updateMatrixWorld(true);
}

function patchRenderer() {
  if (rendererPatched || !game?.renderer) return;
  rendererPatched = true;
  const renderer = game.renderer;
  const originalRender = renderer.render.bind(renderer);
  renderer.render = (scene, camera) => {
    if (active && game.activeCar === active.root) {
      if (game.playerModel) game.playerModel.visible = false;
      applyCamera(camera);
    }
    return originalRender(scene, camera);
  };
}

function updateCarWheels(car, distance) {
  if (!distance || !car.wheels?.length) return;
  const rotation = distance / Math.max(.8, car.height * .23);
  for (const wheel of car.wheels) {
    wheel.rotation.x += rotation;
    wheel.updateMatrix();
  }
}

function patchDriveController() {
  if (drivePatched || typeof game?.updateActiveCar !== 'function') return;
  drivePatched = true;
  const original = game.updateActiveCar.bind(game);
  game.updateActiveCar = function optimizedActiveCar(dt, elapsed) {
    const root = this.activeCar;
    const car = root?.userData?.customCarData;
    if (!root?.userData?.__customDriveableCar || !car) return original(dt, elapsed);

    dt = Math.min(.05, Math.max(0, dt || 0));
    let speed = Number(root.carSpeed || 0);
    const forwardPressed = this.keys.KeyW || this.keys.w || this.keys.ArrowUp;
    const reversePressed = this.keys.KeyS || this.keys.s || this.keys.ArrowDown;
    const leftPressed = this.keys.KeyA || this.keys.a || this.keys.ArrowLeft;
    const rightPressed = this.keys.KeyD || this.keys.d || this.keys.ArrowRight;
    // V85: velocidad de coche real. Antes el máximo era 720 y se sentía lento
    // para la escala del mundo; ahora acelera fuerte y alcanza velocidad de GTA.
    const boostPressed = this.keys.ShiftLeft || this.keys.ShiftRight || this.keys.Shift;
    const maxSpeed = boostPressed ? 1550 : 1180;
    const acceleration = boostPressed ? 980 : 760;
    const braking = 840;
    const drag = 62;

    if (forwardPressed) speed = Math.min(maxSpeed, speed + acceleration * dt);
    else if (reversePressed) speed = Math.max(-maxSpeed * .38, speed - braking * dt);
    else if (speed > 0) speed = Math.max(0, speed - drag * dt);
    else if (speed < 0) speed = Math.min(0, speed + drag * dt);
    root.carSpeed = speed;

    const steerInput = (leftPressed ? 1 : 0) - (rightPressed ? 1 : 0);
    if (Math.abs(speed) > .15) {
      // El giro se suaviza a alta velocidad para que el coche no derrape raro.
      const grip = Math.min(1, .30 + Math.abs(speed) / 110) * (1 - Math.min(.45, Math.abs(speed) / 3800));
      root.rotation.y += steerInput * Math.sign(speed) * 1.45 * dt * grip;
    }

    tempA.set(0, 0, -1).applyQuaternion(root.quaternion);
    const moveDistance = speed * dt;
    const nextX = root.position.x + tempA.x * moveDistance;
    const nextZ = root.position.z + tempA.z * moveDistance;

    // Las colisiones completas del mapa hacían una búsqueda muy costosa cada pocos
    // milisegundos y provocaban microcongelamientos. El coche avanza de forma
    // continua; las zonas del mapa siguen limitadas por sus propios bordes.
    root.position.x = nextX;
    root.position.z = nextZ;

    // La ciudad principal es plana. Mantener la altura en caché elimina el
    // raycast periódico que provocaba microcongelamientos al conducir.
    root.position.y += ((car.cachedGround + .35) - root.position.y) * (1 - Math.exp(-dt * 13));
    // Solo se actualiza la matriz del contenedor. Recorrer toda la jerarquía
    // del Ferrari en cada frame era una de las principales causas de tirones.
    root.updateWorldMatrix(true, false);
    root._cx = root.position.x;
    root._cz = root.position.z;
    updateCarWheels(car, moveDistance);

    tempB.set(0, car.height * .56, 0).applyMatrix4(root.matrixWorld);
    this.playerContainer.position.copy(tempB);
    this.playerContainer.rotation.y = root.rotation.y;
    this.state.vy = 0;
    this.state.onGround = true;
    this.state.inWater = false;
    this.state.isFlying = false;
    if (this.playerModel) this.playerModel.visible = false;
  };
}


function isInsideRetiroPark(x, z) {
  const logicalX = x / WORLD_SCALE;
  const logicalZ = z / WORLD_SCALE;
  return logicalX > RETIRO_NO_TRAFFIC.xMin && logicalX < RETIRO_NO_TRAFFIC.xMax &&
    logicalZ > RETIRO_NO_TRAFFIC.zMin && logicalZ < RETIRO_NO_TRAFFIC.zMax;
}

function isOnTrafficSurface(x, z) {
  if (isInsideRetiroPark(x, z)) return false;
  const logicalX = x / WORLD_SCALE;
  const logicalZ = z / WORLD_SCALE;
  return TRAFFIC_SURFACES.some(surface =>
    logicalX >= surface.xMin && logicalX <= surface.xMax &&
    logicalZ >= surface.zMin && logicalZ <= surface.zMax
  );
}

function snapCarBackToRoad(car) {
  const point = car.roadRoute?.[car.routeIndex] || car.roadRoute?.[0];
  if (!point) return;
  car.root.position.set(point.x, point.y + .35, point.z);
  car.cachedGround = point.y;
  car.routeIndex = (car.routeIndex + 1) % car.roadRoute.length;
}
function updateAutopilot(car, dt) {
  if (car.root.userData?.combatVehicleEntity?.dead) return;
  if (!car.autopilot || car === active || !car.roadRoute?.length) return;

  // V75: los coches muy lejanos se actualizan a baja frecuencia. Así no se
  // procesan todas las rutas en cada paso y se evitan tirones al acercarse.
  const player = game?.playerContainer?.position;
  const carDistance = window.__VICE_VIDEO_SETTINGS__?.carDistance || 5000;
  if (player) {
    const dxp = car.root.position.x - player.x;
    const dzp = car.root.position.z - player.z;
    const far = dxp * dxp + dzp * dzp > Math.pow(carDistance * 1.25, 2);
    if (far) {
      car.farAccumulator = (car.farAccumulator || 0) + dt;
      if (car.farAccumulator < .42) return;
      dt = Math.min(.52, car.farAccumulator);
      car.farAccumulator = 0;
    } else {
      car.farAccumulator = 0;
    }
  }

  if (!isOnTrafficSurface(car.root.position.x, car.root.position.z)) snapCarBackToRoad(car);
  let target = car.roadRoute[car.routeIndex];
  if (!target) {
    car.routeIndex = 0;
    target = car.roadRoute[0];
  }

  let dx = target.x - car.root.position.x;
  let dz = target.z - car.root.position.z;
  let distance = Math.hypot(dx, dz);
  if (distance < Math.max(16, car.length * .35)) {
    car.routeIndex = (car.routeIndex + 1) % car.roadRoute.length;
    target = car.roadRoute[car.routeIndex];
    dx = target.x - car.root.position.x;
    dz = target.z - car.root.position.z;
    distance = Math.hypot(dx, dz);
  }
  if (distance < .001) return;

  const vx = dx / distance;
  const vz = dz / distance;
  const moveDistance = Math.min(distance, car.trafficSpeed * dt);
  car.root.position.x += vx * moveDistance;
  car.root.position.z += vz * moveDistance;
  if (!isOnTrafficSurface(car.root.position.x, car.root.position.z) || Math.abs(car.root.position.x) > 240000 || Math.abs(car.root.position.z) > 240000) {
    snapCarBackToRoad(car);
    return;
  }
  car.cachedGround += (target.y - car.cachedGround) * Math.min(1, dt * .8);
  car.root.position.y += ((car.cachedGround + .35) - car.root.position.y) * (1 - Math.exp(-dt * 7));

  const desiredYaw = Math.atan2(-vx, -vz);
  let yawDelta = desiredYaw - car.root.rotation.y;
  yawDelta = Math.atan2(Math.sin(yawDelta), Math.cos(yawDelta));
  car.root.rotation.y += yawDelta * (1 - Math.exp(-dt * 4.2));
  car.root._cx = car.root.position.x;
  car.root._cz = car.root.position.z;
  const nearEnoughForWheelAnimation = car === active || !player || car.root.position.distanceToSquared(player) < Math.pow(700, 2);
  if (nearEnoughForWheelAnimation) updateCarWheels(car, moveDistance);
}

function updateVisibility() {
  // V75: solo se dibujan los coches próximos y un número máximo según la calidad.
  // Los coches lejanos siguen circulando de forma simplificada, pero no consumen GPU.
  const player = game?.playerContainer?.position;
  const settings = window.__VICE_VIDEO_SETTINGS__ || {};
  const maxDistance = Math.max(2200, settings.carDistance || 5000);
  const maxVisible = Math.max(6, settings.maxVisibleCars || 14);
  const maxDistanceSq = maxDistance * maxDistance;
  const ranked = [];

  for (const car of CARS) {
    if (car.root.userData?.combatVehicleEntity?.dead) {
      car.root.visible = false;
      continue;
    }
    if (car === active) {
      car.root.visible = true;
      continue;
    }
    if (!player) {
      ranked.push({ car, distanceSq: 0 });
      continue;
    }
    const dx = car.root.position.x - player.x;
    const dz = car.root.position.z - player.z;
    const distanceSq = dx * dx + dz * dz;
    car.root.visible = false;
    if (distanceSq <= maxDistanceSq) ranked.push({ car, distanceSq });
  }

  ranked.sort((a, b) => a.distanceSq - b.distanceSq);
  for (let i = 0; i < Math.min(maxVisible, ranked.length); i++) ranked[i].car.root.visible = true;
}

function frame(now = performance.now()) {
  requestAnimationFrame(frame);
  if (document.hidden) { lastFrameTime = now; return; }
  const dt = Math.min(.05, Math.max(0, (now - lastFrameTime) / 1000));
  lastFrameTime = now;

  trafficAccumulator += dt;
  if (trafficAccumulator >= TRAFFIC_STEP) {
    const trafficDt = Math.min(.075, trafficAccumulator);
    trafficAccumulator = 0;
    for (const car of CARS) updateAutopilot(car, trafficDt);
  }

  if (active && game.activeCar === active.root) {
    active.root._cx = active.root.position.x;
    active.root._cz = active.root.position.z;
  } else if (active) {
    if (game.playerModel) game.playerModel.visible = true;
    active = null;
  }

  visibilityAccumulator += dt;
  if (visibilityAccumulator >= 1.15) {
    visibilityAccumulator = 0;
    updateVisibility();
  }

  promptAccumulator += dt;
  if (promptAccumulator >= .3) {
    promptAccumulator = 0;
    if (active) {
      prompt.textContent = `V · CAMBIAR CÁMARA (${CAMERA_NAMES[cameraMode]}) · E · BAJAR`;
      prompt.style.display = 'block';
    } else {
      const nearby = nearestCar();
      if (nearby) {
        prompt.textContent = `E · ROBAR / SUBIR AL COCHE · ${nearby.distance.toFixed(0)} m`;
        prompt.style.display = 'block';
      } else {
        prompt.style.display = 'none';
      }
    }
  }
}

function keydown(event) {
  if (event.repeat) return;
  if (event.code === 'KeyV' && active) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    cycleCamera();
    return;
  }
  if (event.code !== 'KeyE') return;
  if (active) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    exitCar();
    return;
  }
  if (game.activeCar || game.activeBoat || game.activeRiddenHorse) return;
  const nearby = nearestCar();
  if (!nearby) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  enterCar(nearby.car);
}

async function loadFerrariBase() {
  const draco = new DRACOLoader();
  draco.setDecoderPath(new URL('./bosque/bike-runtime/libs/draco/', import.meta.url).href);
  draco.setWorkerLimit(1);
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);
  try {
    const gltf = await loader.loadAsync(new URL('./car-assets/ferrari.glb', import.meta.url).href);
    return gltf.scene;
  } catch (error) {
    console.warn('[custom-cars] No se pudo cargar el Ferrari local de Three.js.', error);
    return null;
  } finally {
    draco.dispose();
  }
}

async function prewarmCars() {
  const renderer = game?.renderer;
  if (!renderer || !CARS.length) return;
  const oldTarget = renderer.getRenderTarget?.() || null;
  const stage = new THREE.Scene();
  stage.add(new THREE.HemisphereLight(0xffffff, 0x303030, 1.45));
  const directional = new THREE.DirectionalLight(0xffffff, 1.9);
  directional.position.set(4, 8, 6);
  stage.add(directional);
  const camera = new THREE.PerspectiveCamera(50, 1, .1, 4000);
  const target = new THREE.WebGLRenderTarget(24, 24, { depthBuffer: true, stencilBuffer: false });

  try {
    renderer.setRenderTarget(target);
    // Solo se precalienta una muestra por color/material. Renderizar los 28 clones
    // completos al iniciar alargaba la carga sin aportar nuevos shaders.
    const sampleCount = Math.min(COLORS.length, CARS.length);
    for (let i = 0; i < sampleCount; i++) {
      const car = CARS[i];
      const preview = car.root.clone(true);
      preview.position.set(0, 0, 0);
      preview.rotation.set(0, Math.PI * .22, 0);
      preview.visible = true;
      stage.add(preview);
      tempBox.setFromObject(preview);
      tempBox.getCenter(tempCenter);
      tempBox.getSize(tempSize);
      const radius = Math.max(tempSize.x, tempSize.y, tempSize.z, 1);
      camera.position.set(tempCenter.x + radius * 1.15, tempCenter.y + radius * .55, tempCenter.z + radius * 1.35);
      camera.near = Math.max(.05, radius / 1000);
      camera.far = radius * 8;
      camera.updateProjectionMatrix();
      camera.lookAt(tempCenter);
      renderer.render(stage, camera);
      stage.remove(preview);
      if (i === 3) await new Promise(resolve => requestAnimationFrame(resolve));
    }
  } catch (error) {
    console.warn('[custom-cars] Precalentamiento gráfico incompleto.', error);
  } finally {
    renderer.setRenderTarget(oldTarget);
    target.dispose();
  }
}

function buildRoadRoute(coords) {
  return coords.map(point => {
    // Las coordenadas del mapa base están expresadas en unidades lógicas y el
    // juego las multiplica por 16 al construir las islas. V40 no aplicaba esa
    // escala y por eso los coches terminaban sobre el mar azul cerca del origen.
    const logicalX = point[0];
    const logicalZ = point.length >= 3 ? point[2] : point[1];
    const x = logicalX * WORLD_SCALE;
    const z = logicalZ * WORLD_SCALE;
    return { x, z, y: groundAt(x, z, WORLD_SCALE * 0.5) };
  });
}

function pointAlongRoute(route, segmentIndex, t) {
  const a = route[segmentIndex % route.length];
  const b = route[(segmentIndex + 1) % route.length];
  return {
    x: THREE.MathUtils.lerp(a.x, b.x, t),
    y: THREE.MathUtils.lerp(a.y, b.y, t),
    z: THREE.MathUtils.lerp(a.z, b.z, t),
    nextIndex: (segmentIndex + 1) % route.length,
    yaw: Math.atan2(-(b.x - a.x), -(b.z - a.z))
  };
}

function randomTrafficT() {
  return .12 + Math.random() * .76;
}

function randomTrafficSpeed() {
  return 155 + Math.random() * 55;
}

async function spawnCars() {
  // V48: el Ferrari oficial de Three.js vuelve al tráfico, pero se carga una sola
  // vez y sus clones se crean de forma escalonada después de mostrar la ciudad.
  await idleTurn(900);
  const ferrariBase = await loadFerrariBase();
  if (!ferrariBase) {
    console.error('[custom-cars] No se pudo cargar el Ferrari oficial de Three.js.');
    notice('NO SE PUDO CARGAR EL FERRARI THREE.JS', 5000);
    window.__CUSTOM_CARS__ = CARS;
    return;
  }

  const roadRoutes = ROAD_ROUTE_COORDS.map(buildRoadRoute);
  const trafficLayout = Array.from({ length: FERRARI_TRAFFIC_COUNT }, (_, index) => {
    const route = index % roadRoutes.length;
    const segment = Math.floor(Math.random() * roadRoutes[route].length);
    return { route, segment, t: .10 + Math.random() * .80 };
  });

  for (let index = 0; index < trafficLayout.length; index++) {
    const layout = trafficLayout[index];
    const car = normalizeFerrari(ferrariBase, FIXED_CAR_LENGTH, COLORS[index % COLORS.length]);
    car.kind = 'ferrari-threejs';
    car.root.name = `THREEJS_FERRARI_ROAD_${index}`;
    car.autopilot = true;
    car.roadRoute = roadRoutes[layout.route];
    const initial = pointAlongRoute(car.roadRoute, layout.segment, layout.t);
    car.routeIndex = initial.nextIndex;
    car.trafficSpeed = randomTrafficSpeed();
    positionCar(car, initial.x, initial.z, initial.yaw);
    car.cachedGround = initial.y;
    car.root.position.y = initial.y + .35;

    // Un Ferrari por turno libre para que la clonación no bloquee un fotograma.
    await idleTurn(index < 10 ? 180 : 360);
    if (index % 2 === 1) await nextFrame();
  }

  // Compila materiales y shaders antes de hacer visibles los coches.
  await prewarmCars();
  window.__CUSTOM_CARS__ = CARS;
  window.__CUSTOM_CAR_SYSTEM__ = { cars: CARS, exit: exitCar, enter: enterCar, get active() { return active; } };
  updateVisibility();
}

async function install() {
  if (installed) return;
  game = window.__VICE_CITY_GAME__;
  if (!game?.scene || !game?.renderer) return;
  installed = true;
  patchRenderer();
  patchDriveController();
  window.addEventListener('keydown', keydown, true);
  window.addEventListener('vice-video-settings-changed', updateVisibility);
  try {
    await spawnCars();
  } finally {
    window.__CUSTOM_CARS_READY__ = true;
    window.dispatchEvent(new CustomEvent('custom-cars-ready'));
  }
  requestAnimationFrame(frame);
}

const wait = setInterval(() => {
  game = window.__VICE_CITY_GAME__ || game;
  if (!game?.scene || !game?.renderer) return;
  clearInterval(wait);
  install().catch(error => {
    console.error('[custom-cars] Error de instalación.', error);
    window.__CUSTOM_CARS_READY__ = true;
    window.dispatchEvent(new CustomEvent('custom-cars-ready'));
  });
}, 40);

setTimeout(() => {
  clearInterval(wait);
  if (!window.__CUSTOM_CARS_READY__) {
    window.__CUSTOM_CARS_READY__ = true;
    window.dispatchEvent(new CustomEvent('custom-cars-ready'));
  }
}, 25000);
