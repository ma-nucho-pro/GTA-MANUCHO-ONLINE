/**
 * GTA MANUCHO V84 — código del proyecto.
 * Creado e integrado por Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * ARKEA AI / Manucho · conserva LICENSE, NOTICE.md y estos créditos al reutilizar.
 */
import * as THREE from './bosque/libs/three.module.js';
import { GLTFLoader } from './bosque/bike-runtime/loaders/GLTFLoader.js';

THREE.Cache.enabled = true;
window.__POLICE_RESPONSE_READY__ = false;

const TANK_TARGET_LENGTH = 185;
const TANK_MAX_SPEED = 285;
const POLICE_TANK_SPEED = 125;
const PROJECTILE_LIMIT = 52;
const keys = Object.create(null);
const tanks = [];
const policePlanes = [];
const projectiles = [];
const tempA = new THREE.Vector3();
const tempB = new THREE.Vector3();
const tempC = new THREE.Vector3();
const tempBox = new THREE.Box3();
const tempSize = new THREE.Vector3();
const tempCenter = new THREE.Vector3();
const tempQuaternion = new THREE.Quaternion();
const forwardAxis = new THREE.Vector3(0, 0, -1);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const projectileGeometry = new THREE.SphereGeometry(4.2, 7, 5);
const policeProjectileMaterial = new THREE.MeshBasicMaterial({ color: 0xff5c45 });
const playerProjectileMaterial = new THREE.MeshBasicMaterial({ color: 0xffd84a });

let game = null;
let installed = false;
let tankTemplatePromise = null;
let policePlaneTemplatePromise = null;
let activeTank = null;
let tankCameraMode = 0;
let parkedTankPromise = null;
let rendererPatched = false;
let commandBuffer = '';
let commandTimer = 0;
let lastFrameTime = performance.now();
let wantedAccumulator = 0;
let promptAccumulator = 0;
let currentWanted = 0;
let policeTankSpawning = false;
let policePlanesSpawning = false;
let mouseAimYaw = 0;
let mouseAimPitch = 0;
let promptNode = null;
let noticeNode = null;
let crosshairNode = null;

function idleTurn(timeout = 1200) {
  return new Promise(resolve => {
    if ('requestIdleCallback' in window) requestIdleCallback(() => resolve(), { timeout });
    else setTimeout(resolve, Math.min(timeout, 350));
  });
}

function nextFrame() {
  return new Promise(resolve => requestAnimationFrame(resolve));
}

function createUi() {
  if (!promptNode) {
    promptNode = document.createElement('div');
    promptNode.id = 'tank-prompt-v58';
    promptNode.style.cssText = [
      'position:fixed','left:50%','bottom:158px','transform:translateX(-50%)','z-index:5300',
      'padding:9px 14px','border-radius:9px','background:rgba(4,11,15,.92)',
      'border:1px solid rgba(116,255,151,.72)','color:#eaffef','font:900 12px Arial,sans-serif',
      'letter-spacing:.045em','pointer-events:none','display:none','box-shadow:0 12px 34px rgba(0,0,0,.48)'
    ].join(';');
    document.body.appendChild(promptNode);
  }
  if (!noticeNode) {
    noticeNode = document.createElement('div');
    noticeNode.id = 'tank-notice-v58';
    noticeNode.style.cssText = [
      'position:fixed','left:50%','top:146px','transform:translateX(-50%)','z-index:5400',
      'padding:11px 17px','border-radius:10px','background:rgba(6,12,18,.94)',
      'border:1px solid rgba(84,184,255,.82)','color:#e9f6ff','font:900 13px Arial,sans-serif',
      'letter-spacing:.065em','pointer-events:none','display:none','box-shadow:0 12px 38px rgba(0,0,0,.58)'
    ].join(';');
    document.body.appendChild(noticeNode);
  }
  if (!crosshairNode) {
    crosshairNode = document.createElement('div');
    crosshairNode.id = 'tank-crosshair-v58';
    crosshairNode.textContent = '+';
    crosshairNode.style.cssText = [
      'position:fixed','left:50%','top:50%','transform:translate(-50%,-50%)','z-index:5350',
      'font:900 31px Arial,sans-serif','color:#fff3a4','text-shadow:0 0 8px #ff9f00,0 0 2px #000',
      'pointer-events:none','display:none'
    ].join(';');
    document.body.appendChild(crosshairNode);
  }
}

function notice(text, duration = 3000) {
  createUi();
  noticeNode.textContent = text;
  noticeNode.style.display = 'block';
  clearTimeout(noticeNode.__hideTimer);
  noticeNode.__hideTimer = setTimeout(() => { noticeNode.style.display = 'none'; }, duration);
}

function groundAt(x, z, fallback = 0) {
  try {
    const value = game?.getGroundY?.(x, fallback + 500, z, false);
    return Number.isFinite(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function simplifyMaterial(material) {
  if (!material) return material;
  const color = material.color?.clone?.() || new THREE.Color(0x55604d);
  return new THREE.MeshLambertMaterial({
    color,
    map: material.map || null,
    transparent: Boolean(material.transparent),
    opacity: material.opacity ?? 1,
    alphaTest: material.alphaTest || 0,
    side: material.side ?? THREE.FrontSide,
    vertexColors: Boolean(material.vertexColors),
    fog: material.fog !== false
  });
}

function optimizeTankVisual(root) {
  const materialMap = new Map();
  root.traverse(object => {
    if (!object.isMesh && !object.isSkinnedMesh) return;
    object.castShadow = false;
    object.receiveShadow = false;
    object.frustumCulled = true;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const prepared = materials.map(material => {
      if (!materialMap.has(material)) materialMap.set(material, simplifyMaterial(material));
      return materialMap.get(material);
    });
    object.material = Array.isArray(object.material) ? prepared : prepared[0];
  });
}

async function ensureTankTemplate() {
  if (tankTemplatePromise) return tankTemplatePromise;
  tankTemplatePromise = (async () => {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync('./tank-assets/scene.gltf');
    const source = gltf.scene;
    optimizeTankVisual(source);
    source.updateMatrixWorld(true);
    return source;
  })();
  try {
    return await tankTemplatePromise;
  } catch (error) {
    tankTemplatePromise = null;
    throw error;
  }
}

async function ensurePolicePlaneTemplate() {
  const existing = window.__AIRCRAFT_SYSTEM__?.aircraft?.find(entry => entry?.code === 'JET' && entry?.root);
  if (existing) return existing.root;
  if (policePlaneTemplatePromise) return policePlaneTemplatePromise;
  policePlaneTemplatePromise = (async () => {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync('./aircraft-assets/jet_sf1.glb');
    const source = gltf.scene;
    const materialMap = new Map();
    source.traverse(object => {
      if (!object.isMesh && !object.isSkinnedMesh) return;
      object.castShadow = false;
      object.receiveShadow = false;
      object.frustumCulled = true;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      const prepared = materials.map(material => {
        if (!materialMap.has(material)) materialMap.set(material, simplifyMaterial(material));
        return materialMap.get(material);
      });
      object.material = Array.isArray(object.material) ? prepared : prepared[0];
    });
    source.updateMatrixWorld(true);
    return source;
  })();
  try {
    return await policePlaneTemplatePromise;
  } catch (error) {
    policePlaneTemplatePromise = null;
    throw error;
  }
}

function normalizeClone(source, desiredLength, visualYaw = 0) {
  const visual = source.clone(true);
  visual.position.set(0, 0, 0);
  visual.rotation.set(0, visualYaw, 0);
  visual.scale.set(1, 1, 1);
  visual.updateMatrixWorld(true);
  tempBox.setFromObject(visual);
  tempBox.getSize(tempSize);
  const length = Math.max(tempSize.x, tempSize.z, 0.001);
  visual.scale.setScalar(desiredLength / length);
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
  return {
    root: holder,
    visual,
    length: Math.max(tempSize.x, tempSize.z),
    width: Math.min(tempSize.x, tempSize.z),
    height: tempSize.y
  };
}

function addPoliceLights(root, y, spacing = 18) {
  const lightGroup = new THREE.Group();
  const red = new THREE.Mesh(new THREE.SphereGeometry(3.8, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff2438 }));
  const blue = new THREE.Mesh(new THREE.SphereGeometry(3.8, 8, 6), new THREE.MeshBasicMaterial({ color: 0x2878ff }));
  red.position.set(-spacing, y, 0);
  blue.position.set(spacing, y, 0);
  lightGroup.add(red, blue);
  root.add(lightGroup);
  return { group: lightGroup, red, blue };
}

async function createTank(position, options = {}) {
  const source = await ensureTankTemplate();
  const prepared = normalizeClone(source, TANK_TARGET_LENGTH, Math.PI);
  const entry = {
    root: prepared.root,
    visual: prepared.visual,
    length: prepared.length,
    width: prepared.width,
    height: prepared.height,
    turret: prepared.visual.getObjectByName('Turret') || prepared.visual.getObjectByName('turret'),
    gun: prepared.visual.getObjectByName('Gun') || prepared.visual.getObjectByName('gun'),
    police: Boolean(options.police),
    cheat: Boolean(options.cheat),
    active: false,
    speed: 0,
    turretYaw: 0,
    cannonPitch: 0,
    fireCooldown: 0,
    groundTimer: 0,
    cachedGround: position.y,
    health: options.police ? 260 : 400,
    lights: null
  };
  entry.root.name = options.police ? 'VCPD_TANK_4_STARS' : `PLAYER_TANK_${Date.now()}`;
  entry.root.position.copy(position);
  entry.root.rotation.order = 'YXZ';
  entry.root.rotation.y = options.yaw || 0;
  entry.root._isAlwaysVisible = true;
  entry.root.userData.tankEntry = entry;
  if (entry.police) entry.lights = addPoliceLights(entry.root, entry.height * 0.78, entry.width * 0.22);
  game.scene.add(entry.root);
  tanks.push(entry);
  await nextFrame();
  return entry;
}

function forwardFromObject(object, target = tempA) {
  return target.copy(forwardAxis).applyQuaternion(object.quaternion).normalize();
}

function findSafeSpawn(distance = 360, lateral = 0) {
  const player = game?.playerContainer;
  if (!player) return new THREE.Vector3();
  const yaw = player.rotation.y || 0;
  const forward = tempA.set(0, 0, -1).applyAxisAngle(Y_AXIS, yaw);
  const right = tempB.set(1, 0, 0).applyAxisAngle(Y_AXIS, yaw);
  const x = player.position.x + forward.x * distance + right.x * lateral;
  const z = player.position.z + forward.z * distance + right.z * lateral;
  const y = groundAt(x, z, player.position.y) + 0.4;
  return new THREE.Vector3(x, y, z);
}

async function spawnCheatTank() {
  if (!game?.playerContainer) return null;
  try {
    const position = findSafeSpawn(300, 0);
    const entry = await createTank(position, { cheat: true, yaw: game.playerContainer.rotation.y });
    notice('TANK APARECIÓ DELANTE · ACÉRCATE Y PULSA E', 4400);
    return entry;
  } catch (error) {
    console.error('[police-response] No se pudo cargar el tanque.', error);
    notice('NO SE PUDO CARGAR TANK', 4200);
    return null;
  }
}

async function spawnPoliceTank() {
  if (policeTankSpawning || tanks.some(entry => entry.police)) return;
  policeTankSpawning = true;
  notice('4 ESTRELLAS · TANQUE VCPD EN CAMINO', 4400);
  try {
    const position = findSafeSpawn(-820, 360);
    const entry = await createTank(position, {
      police: true,
      yaw: (game.playerContainer.rotation.y || 0) + Math.PI
    });
    entry.cachedGround = position.y;
  } catch (error) {
    console.warn('[police-response] No se pudo desplegar el tanque policial.', error);
  } finally {
    policeTankSpawning = false;
  }
}

async function ensureParkedTank() {
  const existing = tanks.find(entry => entry?.root?.name === 'ARKEA_TANQUE_JUGABLE_V83');
  if (existing) return existing;
  if (parkedTankPromise) return parkedTankPromise;
  parkedTankPromise = (async () => {
    const centerX = (1500 - 130) * 16;
    const centerZ = (300 + 40) * 16;
    const x = centerX;
    const z = centerZ + 350;
    const y = groundAt(x, z, game?.playerContainer?.position?.y || 0) + 1;
    const entry = await createTank(new THREE.Vector3(x, y, z), { cheat: true, yaw: Math.PI * 0.5 });
    entry.root.name = 'ARKEA_TANQUE_JUGABLE_V83';
    entry.speed = 0;
    window.__ARKEA_TANK_READY__ = true;
    window.dispatchEvent(new CustomEvent('arkea-tank-ready'));
    return entry;
  })();
  try { return await parkedTankPromise; }
  catch (error) {
    parkedTankPromise = null;
    console.warn('[police-response] No se pudo preparar el tanque de ARKEA.', error);
    throw error;
  }
}

function removeTank(entry) {
  if (!entry) return;
  if (activeTank === entry) exitTank();
  entry.root.parent?.remove(entry.root);
  const index = tanks.indexOf(entry);
  if (index >= 0) tanks.splice(index, 1);
}

function nearestTank(maxDistance = 120) {
  if (!game?.playerContainer) return null;
  let best = null;
  let bestSq = maxDistance * maxDistance;
  const p = game.playerContainer.position;
  for (const entry of tanks) {
    if (entry.police || entry === activeTank || !entry.root.visible) continue;
    const distanceSq = entry.root.position.distanceToSquared(p);
    if (distanceSq < bestSq) {
      bestSq = distanceSq;
      best = entry;
    }
  }
  return best ? { entry: best, distance: Math.sqrt(bestSq) } : null;
}

function enterTank(entry) {
  if (!entry || entry.police || activeTank || game.activeCar || game.activeBoat || game.activeRiddenHorse || window.__AIRCRAFT_SYSTEM__?.active) return;
  activeTank = entry;
  entry.active = true;
  entry.speed = 0;
  tankCameraMode = 0;
  mouseAimYaw = 0;
  mouseAimPitch = 0;
  game.activeTank = entry.root;
  if (game.playerModel) game.playerModel.visible = false;
  if (game.state) {
    game.state.isFlying = false;
    game.state.inWater = false;
    game.state.vy = 0;
  }
  crosshairNode.style.display = 'block';
  notice('TANQUE · W/S MOVER · A/D GIRAR · RATÓN APUNTAR · F/CLIC DISPARAR · V CÁMARA · E BAJAR', 6500);
}

function exitTank() {
  if (!activeTank) return;
  const entry = activeTank;
  const side = tempA.set(entry.width * 0.7, 0, 0).applyQuaternion(entry.root.quaternion);
  const x = entry.root.position.x + side.x;
  const z = entry.root.position.z + side.z;
  const y = groundAt(x, z, entry.root.position.y) + 1;
  game.playerContainer.position.set(x, y, z);
  game.playerContainer.rotation.set(0, entry.root.rotation.y, 0);
  if (game.playerModel) game.playerModel.visible = true;
  if (game.state) {
    game.state.isFlying = false;
    game.state.inWater = false;
    game.state.vy = 0;
  }
  entry.active = false;
  entry.speed = 0;
  activeTank = null;
  game.activeTank = null;
  tankCameraMode = 0;
  crosshairNode.style.display = 'none';
  game.camera.fov = 60;
  game.camera.near = 0.1;
  game.camera.updateProjectionMatrix();
  notice('BAJASTE DEL TANQUE');
}

function cycleTankCamera() {
  if (!activeTank) return;
  tankCameraMode = (tankCameraMode + 1) % 3;
  game.camera.fov = tankCameraMode === 1 ? 72 : 58;
  game.camera.near = tankCameraMode === 1 ? 0.25 : 0.1;
  game.camera.updateProjectionMatrix();
  notice(`CÁMARA TANQUE ${tankCameraMode + 1}/3`, 1500);
}

function applyTankCamera(camera) {
  if (!activeTank) return;
  const entry = activeTank;
  const target = tempB.copy(entry.root.position).add(new THREE.Vector3(0, entry.height * 0.62, 0));
  if (tankCameraMode === 1) {
    tempA.set(0, entry.height * 0.72, -entry.length * 0.23).applyQuaternion(entry.root.quaternion).add(entry.root.position);
    camera.position.copy(tempA);
    const aim = tempC.set(0, entry.height * 0.65, -entry.length * 2.3).applyQuaternion(entry.root.quaternion).add(entry.root.position);
    camera.lookAt(aim);
  } else if (tankCameraMode === 2) {
    tempA.set(0, entry.length * 1.15, entry.length * 0.9).applyQuaternion(entry.root.quaternion).add(entry.root.position);
    camera.position.lerp(tempA, 0.18);
    camera.lookAt(target);
  } else {
    tempA.set(0, entry.height * 1.12, entry.length * 0.78).applyQuaternion(entry.root.quaternion).add(entry.root.position);
    camera.position.lerp(tempA, 0.28);
    camera.lookAt(target);
  }
  camera.updateMatrixWorld(true);
}

function patchRenderer() {
  if (rendererPatched || !game?.renderer) return;
  rendererPatched = true;
  const renderer = game.renderer;
  const originalRender = renderer.render.bind(renderer);
  renderer.render = (scene, camera) => {
    if (activeTank) applyTankCamera(camera);
    return originalRender(scene, camera);
  };
}

function getProjectile() {
  let item = projectiles.find(entry => !entry.active);
  if (!item && projectiles.length < PROJECTILE_LIMIT) {
    const mesh = new THREE.Mesh(projectileGeometry, playerProjectileMaterial);
    mesh.visible = false;
    mesh.frustumCulled = true;
    game.scene.add(mesh);
    item = { mesh, velocity: new THREE.Vector3(), life: 0, active: false, police: false, damage: 0 };
    projectiles.push(item);
  }
  return item || projectiles[0];
}

function fireProjectile(origin, direction, speed, police, damage) {
  const item = getProjectile();
  if (!item) return;
  item.active = true;
  item.police = police;
  item.damage = damage;
  item.life = 4.2;
  item.mesh.material = police ? policeProjectileMaterial : playerProjectileMaterial;
  item.mesh.position.copy(origin);
  item.velocity.copy(direction).normalize().multiplyScalar(speed);
  item.mesh.visible = true;
}

function fireTank(entry, police = false) {
  if (!entry || entry.fireCooldown > 0) return;
  entry.fireCooldown = police ? 2.1 : 0.48;
  const direction = forwardFromObject(entry.root, tempA).clone();
  if (entry.turret) direction.applyAxisAngle(Y_AXIS, entry.turretYaw || 0);
  direction.y += entry.cannonPitch || 0;
  direction.normalize();
  const origin = tempB.copy(entry.root.position)
    .add(new THREE.Vector3(0, entry.height * 0.68, 0))
    .addScaledVector(direction, entry.length * 0.62);
  fireProjectile(origin, direction, police ? 720 : 920, police, police ? 19 : 46);
}

function damagePlayer(amount, message) {
  if (!game) return;
  let remaining = amount;
  if (game.armor > 0) {
    const absorbed = Math.min(game.armor, remaining);
    game.armor -= absorbed;
    remaining -= absorbed;
  }
  if (remaining > 0) game.health = Math.max(0, game.health - remaining);
  game.currentMessage = message;
  game.updateHUDState?.();
  if (game.health <= 0 && typeof game.crimeWorld?.handlePlayerDown === 'function') {
    try { game.crimeWorld.handlePlayerDown(); } catch {}
  }
  clearTimeout(game.__policeResponseMessageTimer);
  game.__policeResponseMessageTimer = setTimeout(() => {
    if (game.currentMessage === message) game.currentMessage = undefined;
  }, 1200);
}

function updateProjectiles(dt) {
  const playerPos = game?.playerContainer?.position;
  for (const item of projectiles) {
    if (!item.active) continue;
    item.mesh.position.addScaledVector(item.velocity, dt);
    item.life -= dt;
    if (item.police && playerPos && item.mesh.position.distanceToSquared(playerPos) < 42 * 42) {
      damagePlayer(item.damage, '¡IMPACTO DE LA POLICÍA!');
      item.life = 0;
    } else if (!item.police) {
      for (const tank of tanks) {
        if (!tank.police) continue;
        if (item.mesh.position.distanceToSquared(tank.root.position) < 70 * 70) {
          tank.health -= item.damage;
          item.life = 0;
          if (tank.health <= 0) {
            notice('TANQUE VCPD DESTRUIDO', 3000);
            removeTank(tank);
          }
          break;
        }
      }
    }
    if (item.life <= 0) {
      item.active = false;
      item.mesh.visible = false;
    }
  }
}

function updatePlayerTank(entry, dt) {
  const forward = keys.KeyW || keys.ArrowUp;
  const brake = keys.KeyS || keys.ArrowDown;
  const turn = (keys.KeyA ? 1 : 0) - (keys.KeyD ? 1 : 0);
  if (forward) entry.speed = Math.min(TANK_MAX_SPEED, entry.speed + 170 * dt);
  else if (brake) entry.speed = Math.max(-TANK_MAX_SPEED * 0.45, entry.speed - 155 * dt);
  else entry.speed *= Math.exp(-1.6 * dt);
  if (Math.abs(entry.speed) > 0.2) entry.root.rotation.y += turn * Math.sign(entry.speed || 1) * 0.95 * dt;

  forwardFromObject(entry.root, tempA);
  const nextX = entry.root.position.x + tempA.x * entry.speed * dt;
  const nextZ = entry.root.position.z + tempA.z * entry.speed * dt;
  entry.groundTimer -= dt;
  if (entry.groundTimer <= 0) {
    entry.groundTimer = 0.16;
    entry.cachedGround = groundAt(nextX, nextZ, entry.root.position.y);
  }
  entry.root.position.x = nextX;
  entry.root.position.z = nextZ;
  entry.root.position.y += ((entry.cachedGround + 0.4) - entry.root.position.y) * (1 - Math.exp(-10 * dt));
  entry.turretYaw = mouseAimYaw;
  entry.cannonPitch = mouseAimPitch;
  if (entry.turret) entry.turret.rotation.y = entry.turretYaw;
  entry.root.updateWorldMatrix(true, false);

  game.playerContainer.position.copy(entry.root.position).add(new THREE.Vector3(0, entry.height * 0.55, 0));
  game.playerContainer.rotation.y = entry.root.rotation.y;
  if (game.playerModel) game.playerModel.visible = false;
  if (game.state) {
    game.state.vy = 0;
    game.state.onGround = true;
    game.state.inWater = false;
    game.state.isFlying = false;
  }
  if (keys.KeyF || keys.Numpad0) fireTank(entry, false);
  if (game.keys) {
    for (const key of ['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyF']) game.keys[key] = false;
  }
}

function updatePoliceTank(entry, dt) {
  const player = game?.playerContainer?.position;
  if (!player) return;
  entry.fireCooldown = Math.max(0, entry.fireCooldown - dt);
  const dx = player.x - entry.root.position.x;
  const dz = player.z - entry.root.position.z;
  const distance = Math.hypot(dx, dz);
  const desiredYaw = Math.atan2(-dx, -dz);
  let yawDelta = Math.atan2(Math.sin(desiredYaw - entry.root.rotation.y), Math.cos(desiredYaw - entry.root.rotation.y));
  entry.root.rotation.y += yawDelta * (1 - Math.exp(-2.1 * dt));
  if (distance > 330) {
    forwardFromObject(entry.root, tempA);
    const speed = Math.min(POLICE_TANK_SPEED, Math.max(40, (distance - 250) * 0.18));
    const nextX = entry.root.position.x + tempA.x * speed * dt;
    const nextZ = entry.root.position.z + tempA.z * speed * dt;
    entry.groundTimer -= dt;
    if (entry.groundTimer <= 0) {
      entry.groundTimer = 0.22;
      entry.cachedGround = groundAt(nextX, nextZ, entry.root.position.y);
    }
    entry.root.position.x = nextX;
    entry.root.position.z = nextZ;
    entry.root.position.y += ((entry.cachedGround + 0.4) - entry.root.position.y) * (1 - Math.exp(-7 * dt));
  }
  entry.turretYaw = yawDelta;
  if (entry.turret) entry.turret.rotation.y = yawDelta;
  entry.root.updateWorldMatrix(true, false);
  if (distance < 1350 && Math.abs(yawDelta) < 0.38) fireTank(entry, true);
  if (entry.lights) {
    const flash = Math.floor(performance.now() / 240) % 2 === 0;
    entry.lights.red.visible = flash;
    entry.lights.blue.visible = !flash;
  }
}

function createPolicePlaneLights(root, height, width) {
  return addPoliceLights(root, height * 0.22, width * 0.22);
}

async function createPolicePlane(index) {
  const source = await ensurePolicePlaneTemplate();
  const prepared = normalizeClone(source, 300, 0);
  const player = game.playerContainer.position;
  const angle = index * Math.PI;
  const entry = {
    root: prepared.root,
    visual: prepared.visual,
    length: prepared.length,
    width: prepared.width,
    height: prepared.height,
    angle,
    radius: 1050 + index * 180,
    altitude: 620 + index * 110,
    fireCooldown: 0.8 + index * 0.6,
    lights: null
  };
  entry.root.name = `VCPD_POLICE_JET_5_STARS_${index}`;
  entry.root.position.set(player.x + Math.cos(angle) * entry.radius, player.y + entry.altitude, player.z + Math.sin(angle) * entry.radius);
  entry.root.rotation.order = 'YXZ';
  entry.root._isAlwaysVisible = true;
  entry.lights = createPolicePlaneLights(entry.root, entry.height, entry.width);
  game.scene.add(entry.root);
  policePlanes.push(entry);
  return entry;
}

async function spawnPolicePlanes() {
  if (policePlanesSpawning || policePlanes.length) return;
  policePlanesSpawning = true;
  notice('5 ESTRELLAS · AVIONES VCPD ATACANDO', 4800);
  try {
    await Promise.all([createPolicePlane(0), createPolicePlane(1)]);
  } catch (error) {
    console.warn('[police-response] No se pudieron desplegar todos los aviones policiales.', error);
  } finally {
    policePlanesSpawning = false;
  }
}

function removePolicePlanes() {
  for (const plane of policePlanes) plane.root.parent?.remove(plane.root);
  policePlanes.length = 0;
}

function updatePolicePlane(entry, dt, index) {
  const player = game?.playerContainer?.position;
  if (!player) return;
  entry.angle += dt * (index % 2 === 0 ? 0.34 : -0.31);
  const desired = tempA.set(
    player.x + Math.cos(entry.angle) * entry.radius,
    player.y + entry.altitude + Math.sin(entry.angle * 1.7) * 80,
    player.z + Math.sin(entry.angle) * entry.radius
  );
  const previous = tempB.copy(entry.root.position);
  entry.root.position.lerp(desired, 1 - Math.exp(-1.3 * dt));
  const direction = tempC.copy(entry.root.position).sub(previous).normalize();
  if (direction.lengthSq() > 0.0001) {
    tempQuaternion.setFromUnitVectors(forwardAxis, direction);
    entry.root.quaternion.slerp(tempQuaternion, 1 - Math.exp(-3 * dt));
  }
  entry.fireCooldown -= dt;
  if (entry.fireCooldown <= 0 && entry.root.position.distanceToSquared(player) < 1700 * 1700) {
    entry.fireCooldown = 1.35 + Math.random() * 0.55;
    const aim = tempA.copy(player).add(new THREE.Vector3((Math.random() - 0.5) * 55, 22, (Math.random() - 0.5) * 55));
    const directionToPlayer = aim.sub(entry.root.position).normalize();
    const origin = tempB.copy(entry.root.position).addScaledVector(directionToPlayer, entry.length * 0.48);
    fireProjectile(origin, directionToPlayer, 980, true, 11);
  }
  const flash = Math.floor((performance.now() + index * 140) / 210) % 2 === 0;
  entry.lights.red.visible = flash;
  entry.lights.blue.visible = !flash;
}

function getWantedLevel() {
  const world = game?.crimeWorld;
  if (!world) return 0;
  try {
    const value = typeof world.getWantedLevel === 'function' ? world.getWantedLevel() : world.wantedLevel;
    return Number.isFinite(value) ? THREE.MathUtils.clamp(value, 0, 5) : 0;
  } catch {
    return 0;
  }
}

function updateWantedResponses() {
  const wanted = getWantedLevel();
  currentWanted = wanted;
  // Se adelanta la carga del único modelo pesado: el tanque empieza a prepararse
  // en 2 estrellas y el avión en 4. Así, al alcanzar los umbrales de aparición,
  // los recursos ya suelen estar en caché y no provocan una pausa grande.
  if (wanted >= 2 && !tankTemplatePromise) idleTurn(900).then(() => ensureTankTemplate()).catch(() => {});
  if (wanted >= 4 && !policePlaneTemplatePromise && !window.__AIRCRAFT_SYSTEM__?.aircraft?.some(entry => entry?.code === 'JET')) {
    idleTurn(1100).then(() => ensurePolicePlaneTemplate()).catch(() => {});
  }
  if (wanted >= 4) spawnPoliceTank();
  else {
    for (const entry of [...tanks]) if (entry.police) removeTank(entry);
  }
  if (wanted >= 5) spawnPolicePlanes();
  else if (policePlanes.length) removePolicePlanes();
}

function updatePrompt() {
  createUi();
  if (activeTank) {
    promptNode.textContent = `TANQUE · W/S MOVER · A/D GIRAR · F/CLIC DISPARAR · V CÁMARA · E BAJAR · ${Math.abs(activeTank.speed).toFixed(0)}`;
    promptNode.style.display = 'block';
    return;
  }
  const nearby = nearestTank();
  if (nearby) {
    promptNode.textContent = `E · SUBIR AL TANQUE · ${nearby.distance.toFixed(0)} m`;
    promptNode.style.display = 'block';
  } else {
    promptNode.style.display = 'none';
  }
}

function onMouseMove(event) {
  if (!activeTank || !document.pointerLockElement) return;
  mouseAimYaw = THREE.MathUtils.clamp(mouseAimYaw - event.movementX * 0.0018, -1.55, 1.55);
  mouseAimPitch = THREE.MathUtils.clamp(mouseAimPitch - event.movementY * 0.0012, -0.24, 0.32);
}

function onMouseDown(event) {
  if (!activeTank || event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  fireTank(activeTank, false);
}

function onKeyDown(event) {
  keys[event.code] = true;
  if (event.repeat) return;

  if (activeTank && (event.code === 'KeyF' || event.code === 'Numpad0')) {
    event.preventDefault();
    event.stopPropagation();
    fireTank(activeTank, false);
    return;
  }

  const target = event.target;
  const editing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
  if (!editing && event.key?.length === 1 && /[a-z]/i.test(event.key)) {
    clearTimeout(commandTimer);
    commandBuffer = (commandBuffer + event.key.toUpperCase()).slice(-12);
    commandTimer = setTimeout(() => { commandBuffer = ''; }, 1800);
    if (commandBuffer.endsWith('TANK')) {
      commandBuffer = '';
      event.preventDefault();
      spawnCheatTank();
      return;
    }
  }

  if (event.code === 'KeyE') {
    if (activeTank) {
      event.preventDefault();
      event.stopPropagation();
      exitTank();
      return;
    }
    const nearby = nearestTank();
    if (nearby) {
      event.preventDefault();
      event.stopPropagation();
      enterTank(nearby.entry);
      return;
    }
  }
  if (event.code === 'KeyV' && activeTank) {
    event.preventDefault();
    event.stopPropagation();
    cycleTankCamera();
  }
}

function onKeyUp(event) {
  keys[event.code] = false;
}

function update(now = performance.now()) {
  requestAnimationFrame(update);
  const dt = Math.min(0.05, Math.max(0, (now - lastFrameTime) / 1000));
  lastFrameTime = now;
  if (!window.__VICE_CITY_REVEALED__ || document.hidden || window.__VICE_ZONE_TRANSITION__) return;

  for (const tank of [...tanks]) {
    if (tank.root?.userData?.combatVehicleEntity?.dead) continue;
    tank.fireCooldown = Math.max(0, tank.fireCooldown - dt);
    if (tank === activeTank) updatePlayerTank(tank, dt);
    else if (tank.police) updatePoliceTank(tank, dt);
  }
  for (let i = 0; i < policePlanes.length; i++) { if (!policePlanes[i].root?.userData?.combatVehicleEntity?.dead) updatePolicePlane(policePlanes[i], dt, i); }
  updateProjectiles(dt);

  wantedAccumulator += dt;
  if (wantedAccumulator >= 0.25) {
    wantedAccumulator = 0;
    updateWantedResponses();
  }
  promptAccumulator += dt;
  if (promptAccumulator >= 0.2) {
    promptAccumulator = 0;
    updatePrompt();
  }
}

async function install() {
  if (installed) return;
  game = window.__VICE_CITY_GAME__;
  if (!game?.scene || !game?.renderer || !game?.playerContainer) return;
  installed = true;
  createUi();
  patchRenderer();
  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('keyup', onKeyUp, true);
  window.addEventListener('mousemove', onMouseMove, true);
  window.addEventListener('mousedown', onMouseDown, true);
  window.__POLICE_RESPONSE__ = {
    spawnTank: spawnCheatTank,
    ensureParkedTank,
    exitTank,
    tanks,
    policePlanes,
    get activeTank() { return activeTank; },
    get wantedLevel() { return currentWanted; }
  };
  requestAnimationFrame(update);
  idleTurn(900).then(() => ensureParkedTank()).catch(() => {});
  window.__POLICE_RESPONSE_READY__ = true;
  window.dispatchEvent(new CustomEvent('police-response-ready'));
}

const wait = setInterval(() => {
  if (!window.__VICE_CITY_GAME__?.scene) return;
  clearInterval(wait);
  install().catch(error => {
    console.error('[police-response] Error de instalación.', error);
    window.__POLICE_RESPONSE_READY__ = true;
  });
}, 120);

setTimeout(() => {
  clearInterval(wait);
  if (!window.__POLICE_RESPONSE_READY__) window.__POLICE_RESPONSE_READY__ = true;
}, 18000);
