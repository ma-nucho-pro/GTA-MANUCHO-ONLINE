import * as THREE from './libs/three.module.js';
import { loadCarbonBike } from './bike-runtime/load-carbon-bike.js';

const EYE_HEIGHT = 1.7;
const MOUNT_DISTANCE = 3.4;
const AUTO_MOUNT_DISTANCE = 2.45;
const BIKE_LENGTH = 2.65;
const CRUISE_SPEED = 13;
const SPRINT_SPEED = 20;
const REVERSE_SPEED = 6;

let engine = null;
let controller = null;
let bikeRoot = null;
let bikeMixer = null;
let playerRoot = null;
let riding = false;
let installed = false;
let loading = false;
let bikeYaw = 0;
let bikeSpeed = 0;
let currentGround = 0;
let frontWheel = null;
let backWheel = null;
let hudTimer = 0;
let autoMountArmed = true;

const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const cameraGoal = new THREE.Vector3();
const lookGoal = new THREE.Vector3();
const smoothCamera = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
let riderRig = null;
let riderRigVisual = null;
let bikeParts = null;

function resolveRiderRig() {
  if (!playerRoot) return null;
  const visual = playerRoot.children?.[0] || playerRoot;
  if (riderRig && riderRigVisual === visual) return riderRig;
  riderRigVisual = visual;
  const bone = (name) => playerRoot.getObjectByName(name) || playerRoot.getObjectByName(name.replace('mixamorig:', 'mixamorig'));
  riderRig = {
    fallback: visual?.userData?.limbs || null,
    hips: bone('mixamorig:Hips'),
    spine: bone('mixamorig:Spine'),
    spine1: bone('mixamorig:Spine1'),
    spine2: bone('mixamorig:Spine2'),
    leftArm: bone('mixamorig:LeftArm'),
    rightArm: bone('mixamorig:RightArm'),
    leftForeArm: bone('mixamorig:LeftForeArm'),
    rightForeArm: bone('mixamorig:RightForeArm'),
    leftHand: bone('mixamorig:LeftHand'),
    rightHand: bone('mixamorig:RightHand'),
    leftUpLeg: bone('mixamorig:LeftUpLeg'),
    rightUpLeg: bone('mixamorig:RightUpLeg'),
    leftLeg: bone('mixamorig:LeftLeg'),
    rightLeg: bone('mixamorig:RightLeg'),
    leftFoot: bone('mixamorig:LeftFoot'),
    rightFoot: bone('mixamorig:RightFoot'),
    leftToe: bone('mixamorig:LeftToeBase'),
    rightToe: bone('mixamorig:RightToeBase')
  };
  return riderRig;
}

function resolveBikeParts() {
  if (!bikeRoot) return null;
  if (bikeParts?.root === bikeRoot) return bikeParts;
  const exact = (...names) => {
    for (const name of names) {
      const found = bikeRoot.getObjectByName(name);
      if (found) return found;
    }
    return null;
  };
  bikeParts = {
    root: bikeRoot,
    seat: exact('Sattel_736_sattel', 'Sattel_26656', 'Sattel_24139', 'Sattelstange2'),
    gripA: exact('Lenkergriff 1'),
    gripB: exact('Lenkergriff'),
    handle: exact('Lenker 1', 'Lenker'),
    pedalA: exact('Pedal_Funn_Bigfoot_le'),
    pedalB: exact('Pedal_Funn_Bigfoot_re'),
    pedalCenter: exact('Pedale', 'Kurbel_X01_DH_li'),
    frontWheel: exact('RadVorn', 'frontWheel'),
    backWheel: exact('RadHinten', 'backWheel')
  };
  return bikeParts;
}

function worldPosition(object, fallback) {
  if (!object) return fallback.clone();
  return object.getWorldPosition(new THREE.Vector3());
}

function aimBone(bone, child, worldTarget) {
  if (!bone || !child) return;
  bone.updateWorldMatrix(true, false);
  child.updateWorldMatrix(true, false);
  const origin = bone.getWorldPosition(new THREE.Vector3());
  const childPosition = child.getWorldPosition(new THREE.Vector3());
  const currentDirection = childPosition.sub(origin);
  const desiredDirection = worldTarget.clone().sub(origin);
  if (currentDirection.lengthSq() < 1e-8 || desiredDirection.lengthSq() < 1e-8) return;
  currentDirection.normalize();
  desiredDirection.normalize();
  const delta = new THREE.Quaternion().setFromUnitVectors(currentDirection, desiredDirection);
  const currentWorld = bone.getWorldQuaternion(new THREE.Quaternion());
  const desiredWorld = delta.multiply(currentWorld);
  const inverseParent = bone.parent
    ? bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert()
    : new THREE.Quaternion();
  bone.quaternion.copy(inverseParent.multiply(desiredWorld));
  bone.updateWorldMatrix(true, true);
}

function solveTwoBone(upper, lower, end, target, bendBias) {
  if (!upper || !lower || !end) return;
  upper.updateWorldMatrix(true, true);
  const start = upper.getWorldPosition(new THREE.Vector3());
  const middle = lower.getWorldPosition(new THREE.Vector3());
  const finish = end.getWorldPosition(new THREE.Vector3());
  const length1 = Math.max(.001, start.distanceTo(middle));
  const length2 = Math.max(.001, middle.distanceTo(finish));
  const toward = target.clone().sub(start);
  let distance = toward.length();
  if (distance < 1e-5) return;
  const direction = toward.normalize();
  distance = THREE.MathUtils.clamp(distance, Math.abs(length1 - length2) + .001, (length1 + length2) * .985);
  const along = (length1 * length1 - length2 * length2 + distance * distance) / (2 * distance);
  const height = Math.sqrt(Math.max(0, length1 * length1 - along * along));
  const perpendicular = bendBias.clone().sub(direction.clone().multiplyScalar(bendBias.dot(direction)));
  if (perpendicular.lengthSq() < 1e-6) perpendicular.crossVectors(direction, UP);
  if (perpendicular.lengthSq() < 1e-6) perpendicular.set(1, 0, 0);
  perpendicular.normalize();
  const bendTarget = start.clone().addScaledVector(direction, along).addScaledVector(perpendicular, height);
  aimBone(upper, lower, bendTarget);
  aimBone(lower, end, target);
}

function leanSpine(rig, frontDirection) {
  const desired = UP.clone().multiplyScalar(.82).addScaledVector(frontDirection, .57).normalize();
  for (const [bone, child, factor] of [
    [rig.spine, rig.spine1, 1],
    [rig.spine1, rig.spine2, .86]
  ]) {
    if (!bone || !child) continue;
    const origin = bone.getWorldPosition(new THREE.Vector3());
    aimBone(bone, child, origin.add(desired.clone().multiplyScalar(factor)));
  }
}

function poseFallbackRider(steeringInput, phase, seat, frontDirection) {
  const rig = resolveRiderRig();
  if (!rig?.fallback || !playerRoot) return;
  playerRoot.position.copy(seat).addScaledVector(UP, -.98).addScaledVector(frontDirection, -.02);
  const { armL, armR, legL, legR } = rig.fallback;
  if (armL) { armL.rotation.x = -1.55; armL.rotation.z = -.38; }
  if (armR) { armR.rotation.x = -1.55; armR.rotation.z = .38; }
  if (legL) legL.rotation.x = -1.18 + phase * .58;
  if (legR) legR.rotation.x = -1.18 - phase * .58;
  playerRoot.rotation.z = steeringInput * -.05;
}

function poseRider(steeringInput) {
  const rig = resolveRiderRig();
  const parts = resolveBikeParts();
  if (!rig || !parts || !bikeRoot || !playerRoot) return;

  bikeRoot.updateWorldMatrix(true, true);
  playerRoot.rotation.y = bikeYaw;
  playerRoot.rotation.x = 0;
  playerRoot.rotation.z = steeringInput * -.05;

  const frontDirection = new THREE.Vector3(-Math.sin(bikeYaw), 0, -Math.cos(bikeYaw)).normalize();
  const rightDirection = new THREE.Vector3(Math.cos(bikeYaw), 0, -Math.sin(bikeYaw)).normalize();
  const frontPosition = worldPosition(parts.frontWheel, bikeRoot.position.clone().addScaledVector(frontDirection, 1.2));
  const backPosition = worldPosition(parts.backWheel, bikeRoot.position.clone().addScaledVector(frontDirection, -1.2));
  const wheelbase = Math.max(1.2, frontPosition.distanceTo(backPosition));
  const seatFallback = bikeRoot.position.clone().addScaledVector(frontDirection, -wheelbase * .16).addScaledVector(UP, wheelbase * .39);
  const seat = worldPosition(parts.seat, seatFallback);

  const moving = Math.abs(bikeSpeed) > .18;
  const cadence = Math.max(7.5, Math.min(16, Math.abs(bikeSpeed) * .82));
  const time = performance.now() * .001;
  const phase = moving ? Math.sin(time * cadence) : 0;

  if (rig.fallback) {
    poseFallbackRider(steeringInput, phase, seat, frontDirection);
    return;
  }

  playerRoot.position.x = seat.x;
  playerRoot.position.z = seat.z;
  playerRoot.position.y = currentGround + .05;
  playerRoot.updateWorldMatrix(true, true);
  if (rig.hips) {
    const hip = rig.hips.getWorldPosition(new THREE.Vector3());
    const desiredHip = seat.clone()
      .addScaledVector(UP, -wheelbase * .02)
      .addScaledVector(frontDirection, -wheelbase * .01);
    playerRoot.position.add(desiredHip.sub(hip));
  }
  playerRoot.updateWorldMatrix(true, true);

  leanSpine(rig, frontDirection);
  playerRoot.updateWorldMatrix(true, true);

  const gripOne = worldPosition(parts.gripA, bikeRoot.position.clone().addScaledVector(frontDirection, wheelbase * .37).addScaledVector(UP, -wheelbase * .02));
  const gripTwo = worldPosition(parts.gripB, gripOne.clone());
  const handleCenter = parts.gripA || parts.gripB
    ? gripOne.clone().add(gripTwo).multiplyScalar(.5)
    : worldPosition(parts.handle, bikeRoot.position.clone().addScaledVector(frontDirection, wheelbase * .37).addScaledVector(UP, wheelbase * .42));
  let gripHalf = Math.abs(gripOne.clone().sub(gripTwo).dot(rightDirection)) * .5;
  gripHalf = THREE.MathUtils.clamp(gripHalf || wheelbase * .11, wheelbase * .09, wheelbase * .17);
  const leftGrip = handleCenter.clone().addScaledVector(rightDirection, -gripHalf).addScaledVector(UP, -wheelbase * .01);
  const rightGrip = handleCenter.clone().addScaledVector(rightDirection, gripHalf).addScaledVector(UP, -wheelbase * .01);
  const leftArmBias = rightDirection.clone().multiplyScalar(-1).addScaledVector(UP, -.35).addScaledVector(frontDirection, .18);
  const rightArmBias = rightDirection.clone().addScaledVector(UP, -.35).addScaledVector(frontDirection, .18);
  solveTwoBone(rig.leftArm, rig.leftForeArm, rig.leftHand, leftGrip, leftArmBias);
  solveTwoBone(rig.rightArm, rig.rightForeArm, rig.rightHand, rightGrip, rightArmBias);

  const pedalOne = worldPosition(parts.pedalA, bikeRoot.position.clone());
  const pedalTwo = worldPosition(parts.pedalB, pedalOne.clone());
  const pedalCenter = parts.pedalA || parts.pedalB
    ? pedalOne.clone().add(pedalTwo).multiplyScalar(.5)
    : worldPosition(parts.pedalCenter, bikeRoot.position.clone().addScaledVector(UP, wheelbase * .17));
  let pedalHalf = Math.abs(pedalOne.clone().sub(pedalTwo).dot(rightDirection)) * .5;
  pedalHalf = THREE.MathUtils.clamp(pedalHalf || wheelbase * .05, wheelbase * .038, wheelbase * .08);
  const pedalRadius = wheelbase * .07;
  const pedalAngle = moving ? time * cadence : 0;
  const leftPedal = pedalCenter.clone()
    .addScaledVector(rightDirection, -pedalHalf)
    .addScaledVector(UP, Math.sin(pedalAngle) * pedalRadius)
    .addScaledVector(frontDirection, Math.cos(pedalAngle) * pedalRadius);
  const rightPedal = pedalCenter.clone()
    .addScaledVector(rightDirection, pedalHalf)
    .addScaledVector(UP, -Math.sin(pedalAngle) * pedalRadius)
    .addScaledVector(frontDirection, -Math.cos(pedalAngle) * pedalRadius);
  const leftKneeBias = frontDirection.clone().multiplyScalar(.86).addScaledVector(rightDirection, -.20).addScaledVector(UP, .12);
  const rightKneeBias = frontDirection.clone().multiplyScalar(.86).addScaledVector(rightDirection, .20).addScaledVector(UP, .12);
  solveTwoBone(rig.leftUpLeg, rig.leftLeg, rig.leftFoot, leftPedal, leftKneeBias);
  solveTwoBone(rig.rightUpLeg, rig.rightLeg, rig.rightFoot, rightPedal, rightKneeBias);
  if (rig.leftToe) aimBone(rig.leftFoot, rig.leftToe, leftPedal.clone().addScaledVector(frontDirection, wheelbase * .05));
  if (rig.rightToe) aimBone(rig.rightFoot, rig.rightToe, rightPedal.clone().addScaledVector(frontDirection, wheelbase * .05));
}

function resetFallbackRiderPose() {
  const rig = resolveRiderRig();
  if (!rig?.fallback) return;
  const { armL, armR, legL, legR } = rig.fallback;
  for (const limb of [armL, armR, legL, legR]) {
    if (limb) limb.rotation.set(0, 0, 0);
  }
}

function language() {
  const query = new URLSearchParams(location.search).get('lang');
  if (query) return query.toLowerCase().startsWith('en') ? 'en' : 'es';
  try {
    const stored = sessionStorage.getItem('game_language');
    if (stored === 'en' || stored === 'es') return stored;
  } catch {}
  const htmlLang = (document.documentElement.lang || '').toLowerCase();
  if (htmlLang.startsWith('en')) return 'en';
  if (htmlLang.startsWith('es')) return 'es';
  return (navigator.language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
}

const lang = language();
const t = (es, en) => lang === 'en' ? en : es;

function createBikeHud() {
  let hud = document.getElementById('bosque-bike-hud');
  if (hud) return hud;
  hud = document.createElement('div');
  hud.id = 'bosque-bike-hud';
  hud.textContent = t('Preparando bicicleta Carbon Frame…', 'Preparing Carbon Frame bicycle…');
  hud.style.cssText = [
    'position:fixed','left:50%','bottom:24px','transform:translateX(-50%)','z-index:2200',
    'padding:10px 15px','border-radius:12px','background:rgba(4,9,12,.82)',
    'border:1px solid rgba(111,240,168,.55)','color:#f4fff8','font:700 12px/1.3 Arial,sans-serif',
    'letter-spacing:.025em','text-align:center','backdrop-filter:blur(7px)','pointer-events:none',
    'box-shadow:0 12px 35px rgba(0,0,0,.35)','max-width:min(92vw,650px)'
  ].join(';');
  document.body.appendChild(hud);
  return hud;
}

const hud = createBikeHud();

function setHud(text, accent = '#6ff0a8') {
  hud.textContent = text;
  hud.style.borderColor = accent;
}

function sayMountPhrase() {
  const phrase = t('Oh mierda, aquí vamos de nuevo', 'Oh shit, here we go again');
  setHud(phrase, '#77ddff');
  clearTimeout(hudTimer);
  hudTimer = setTimeout(() => {
    if (riding) setHud(t('MONTANDO · W/S pedalear · A/D girar · Shift acelerar · Enter o E bajar', 'RIDING · W/S pedal · A/D steer · Shift accelerate · Enter or E dismount'));
  }, 2800);
  try {
    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = lang === 'en' ? 'en-US' : 'es-PE';
    utterance.rate = 0.94;
    utterance.pitch = 0.86;
    synth.speak(utterance);
  } catch (error) {
    console.warn('[BICICLETA] No se pudo reproducir la voz.', error);
  }
}

function getGround(x, z) {
  if (!controller?.groundProbe) return null;
  try {
    const hit = controller.groundProbe(x, z);
    if (!hit || !Number.isFinite(hit.ground)) return null;
    return {
      ground: hit.ground,
      water: Number.isFinite(hit.water) ? hit.water : -Infinity
    };
  } catch {
    return null;
  }
}

function makeFallbackBike() {
  const group = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({ color: 0x10151a, roughness: .55, metalness: .65 });
  const frame = new THREE.MeshStandardMaterial({ color: 0x1f78ff, roughness: .3, metalness: .72 });
  const tire = new THREE.TorusGeometry(.36, .045, 10, 24);
  const wheelA = new THREE.Mesh(tire, dark);
  const wheelB = wheelA.clone();
  wheelA.rotation.y = wheelB.rotation.y = Math.PI / 2;
  wheelA.position.z = -.72;
  wheelB.position.z = .72;
  wheelA.position.y = wheelB.position.y = .37;
  wheelA.name = 'RadVorn';
  wheelB.name = 'RadHinten';
  const tube = (length, radius = .025) => new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 8), frame);
  const bar1 = tube(1.25); bar1.rotation.x = Math.PI / 2; bar1.position.set(0,.68,0);
  const bar2 = tube(.78); bar2.rotation.z = -.7; bar2.position.set(0,.72,-.25);
  const bar3 = tube(.82); bar3.rotation.z = .65; bar3.position.set(0,.72,.26);
  const handle = tube(.46); handle.rotation.z = Math.PI / 2; handle.position.set(0,.96,-.63);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(.22,.06,.34), dark); seat.position.set(0,.94,.28);
  group.add(wheelA,wheelB,bar1,bar2,bar3,handle,seat);
  frontWheel = wheelA;
  backWheel = wheelB;
  return group;
}

function configureModel(gltf) {
  const model = gltf.scene;
  model.name = 'CARBON_FRAME_BIKE_MODEL';
  model.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = false;
    object.receiveShadow = true;
    object.frustumCulled = true;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material) continue;
      if ('envMapIntensity' in material) material.envMapIntensity = .7;
      material.needsUpdate = true;
    }
  });

  model.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const horizontal = Math.max(size.x, size.z, .001);
  model.scale.setScalar(BIKE_LENGTH / horizontal);
  model.updateMatrixWorld(true);

  box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y -= box.min.y;
  model.rotation.y = -Math.PI / 2;

  frontWheel = model.getObjectByName('RadVorn');
  backWheel = model.getObjectByName('RadHinten');
  if (gltf.animations?.length) {
    bikeMixer = new THREE.AnimationMixer(model);
    bikeMixer.clipAction(gltf.animations[0]).play();
  }
  return model;
}

function createMarker() {
  const marker = new THREE.Mesh(
    new THREE.RingGeometry(1.12, 1.34, 40),
    new THREE.MeshBasicMaterial({ color: 0x70f0aa, transparent: true, opacity: .48, side: THREE.DoubleSide, depthWrite: false })
  );
  marker.name = 'BIKE_INTERACTION_MARKER';
  marker.rotation.x = -Math.PI / 2;
  marker.position.y = .035;
  bikeRoot.add(marker);
}

function findSpawn(base, yaw) {
  forward.set(-Math.sin(yaw), 0, -Math.cos(yaw));
  right.set(Math.cos(yaw), 0, -Math.sin(yaw));
  const candidates = [
    [7, 3], [6, -3], [4, 3], [4, -3], [3, 0], [9, 0]
  ];
  for (const [ahead, side] of candidates) {
    const x = base.x + forward.x * ahead + right.x * side;
    const z = base.z + forward.z * ahead + right.z * side;
    const hit = getGround(x, z);
    if (!hit) continue;
    if (hit.ground < hit.water + .15) continue;
    return { x, z, ground: hit.ground };
  }
  const hit = getGround(base.x, base.z);
  return { x: base.x + 2.5, z: base.z, ground: hit?.ground ?? base.y - EYE_HEIGHT };
}

async function spawnBike() {
  if (loading || bikeRoot || !engine?.scene || !controller?.groundProbe) return;
  loading = true;
  setHud(t('Cargando bicicleta Carbon Frame dentro del bosque…', 'Loading Carbon Frame bicycle in the forest…'));

  bikeRoot = new THREE.Group();
  bikeRoot.name = 'CARBON_FRAME_BIKE_MONTABLE';

  try {
    const gltf = await loadCarbonBike(engine.renderer);
    bikeRoot.add(configureModel(gltf));
  } catch (error) {
    console.error('[BICICLETA CARBON FRAME] Falló el modelo GLB; se mantiene una bicicleta de respaldo para no bloquear el bosque.', error);
    bikeRoot.add(makeFallbackBike());
    setHud(t('El modelo tardó en cargar; bicicleta de respaldo activa', 'Model failed to load; fallback bicycle active'), '#ffd66f');
  }

  createMarker();
  const base = controller.basePos || engine.camera.position;
  const yaw = controller.yaw || 0;
  const spawn = findSpawn(base, yaw);
  currentGround = spawn.ground;
  bikeYaw = yaw;
  bikeRoot.position.set(spawn.x, currentGround + .035, spawn.z);
  bikeRoot.rotation.y = bikeYaw;
  engine.scene.add(bikeRoot);

  window.__bosqueCarbonBike = {
    root: bikeRoot,
    mount: mountBike,
    dismount: dismountBike,
    get riding() { return riding; }
  };
  setHud(t('Bicicleta lista · pasa por encima para subir automáticamente · E también monta', 'Bicycle ready · walk over it to mount automatically · E also mounts'));
  loading = false;
}

function distanceToBike() {
  if (!bikeRoot || !controller) return Infinity;
  const base = controller.basePos || engine.camera.position;
  return Math.hypot(base.x - bikeRoot.position.x, base.z - bikeRoot.position.z);
}

function mountBike() {
  if (!bikeRoot || !controller || riding) return;
  if (distanceToBike() > MOUNT_DISTANCE) {
    setHud(t('La bicicleta está lejos · acércate para montar', 'The bicycle is too far · move closer to mount'), '#ffd66f');
    return;
  }
  riding = true;
  bikeSpeed = 0;
  bikeYaw = bikeRoot.rotation.y;
  controller.enabled = false;
  controller.vel?.set?.(0, 0, 0);
  controller.velY = 0;
  controller.grounded = true;
  sayMountPhrase();
}

function dismountBike() {
  if (!riding || !bikeRoot || !controller) return;
  riding = false;
  bikeSpeed = 0;
  const sideX = Math.cos(bikeYaw) * 1.45;
  const sideZ = -Math.sin(bikeYaw) * 1.45;
  const hit = getGround(bikeRoot.position.x + sideX, bikeRoot.position.z + sideZ) || { ground: currentGround };
  controller.basePos.set(bikeRoot.position.x + sideX, hit.ground + EYE_HEIGHT, bikeRoot.position.z + sideZ);
  controller.yaw = bikeYaw;
  controller.vel?.set?.(0, 0, 0);
  controller.velY = 0;
  controller.grounded = true;
  controller.enabled = true;
  if (playerRoot) {
    playerRoot.rotation.x = 0;
    playerRoot.rotation.z = 0;
  }
  resetFallbackRiderPose();
  smoothCamera.set(0, 0, 0);
  autoMountArmed = false;
  setHud(t('Bicicleta estacionada · aléjate y vuelve a pasar por encima, o presiona E', 'Bicycle parked · move away and walk over it again, or press E'));
}

window.addEventListener('keydown', event => {
  if (event.repeat) return;
  const isE = event.code === 'KeyE';
  const isEnter = event.code === 'Enter' || event.code === 'NumpadEnter' || event.key === 'Enter';
  if (!isE && !(isEnter && riding)) return;

  // Enter sirve únicamente para bajarse. E conserva montar/bajar.
  if (riding) dismountBike();
  else if (isE) mountBike();

  event.preventDefault();
  event.stopPropagation();
}, true);

function updateRiding(dt) {
  const keys = controller.keys || new Set();
  const forwardPressed = keys.has('KeyW');
  const reversePressed = keys.has('KeyS');
  const leftPressed = keys.has('KeyA');
  const rightPressed = keys.has('KeyD');
  const sprint = keys.has('ShiftLeft') || keys.has('ShiftRight');

  const targetSpeed = forwardPressed ? (sprint ? SPRINT_SPEED : CRUISE_SPEED) : reversePressed ? -REVERSE_SPEED : 0;
  bikeSpeed += (targetSpeed - bikeSpeed) * (1 - Math.exp(-dt * (targetSpeed === 0 ? 4.5 : 3.2)));

  const steeringInput = (leftPressed ? 1 : 0) - (rightPressed ? 1 : 0);
  const steeringStrength = Math.min(1, Math.abs(bikeSpeed) / 3 + .22);
  const reverseSteer = bikeSpeed < -.15 ? -1 : 1;
  bikeYaw += steeringInput * reverseSteer * steeringStrength * 1.72 * dt;

  forward.set(-Math.sin(bikeYaw), 0, -Math.cos(bikeYaw));
  const nextX = bikeRoot.position.x + forward.x * bikeSpeed * dt;
  const nextZ = bikeRoot.position.z + forward.z * bikeSpeed * dt;
  const nextHit = getGround(nextX, nextZ);

  if (nextHit) {
    const tooSteep = Math.abs(nextHit.ground - currentGround) > Math.max(.75, Math.abs(bikeSpeed) * dt * .9);
    const underWater = nextHit.ground < nextHit.water + .12;
    if (!tooSteep && !underWater) {
      bikeRoot.position.x = nextX;
      bikeRoot.position.z = nextZ;
      currentGround = nextHit.ground;
    } else {
      bikeSpeed *= .35;
    }
  }

  bikeRoot.position.y += ((currentGround + .035) - bikeRoot.position.y) * (1 - Math.exp(-dt * 16));
  bikeRoot.rotation.y = bikeYaw;

  if (bikeMixer) {
    bikeMixer.timeScale = Math.max(.18, Math.min(2.2, Math.abs(bikeSpeed) / CRUISE_SPEED * 1.45));
    bikeMixer.update(dt);
  }
  const wheelTurn = bikeSpeed * dt / .36;
  if (frontWheel) frontWheel.rotation.y += wheelTurn;
  if (backWheel) backWheel.rotation.y += wheelTurn;

  controller.basePos.set(bikeRoot.position.x, currentGround + EYE_HEIGHT, bikeRoot.position.z);
  controller.yaw = bikeYaw;
  controller.vel?.set?.(0, 0, 0);
  controller.velY = 0;
  controller.grounded = true;

  if (!playerRoot) playerRoot = engine.scene.getObjectByName('GTA_MANUCHO_SOLDIER');
  if (playerRoot) {
    playerRoot.position.set(bikeRoot.position.x, currentGround + .05, bikeRoot.position.z);
    playerRoot.rotation.y = bikeYaw;
    poseRider(steeringInput);
  }

  const thirdPerson = playerRoot ? playerRoot.visible : true;
  if (thirdPerson) {
    cameraGoal.set(bikeRoot.position.x + Math.sin(bikeYaw) * 6.4, currentGround + 3.25, bikeRoot.position.z + Math.cos(bikeYaw) * 6.4);
    const cameraGround = getGround(cameraGoal.x, cameraGoal.z);
    if (cameraGround) cameraGoal.y = Math.max(cameraGoal.y, cameraGround.ground + 1.15);
    if (smoothCamera.lengthSq() === 0) smoothCamera.copy(cameraGoal);
    smoothCamera.lerp(cameraGoal, 1 - Math.exp(-dt * 9));
    lookGoal.set(bikeRoot.position.x + forward.x * 2.1, currentGround + 1.15, bikeRoot.position.z + forward.z * 2.1);
    engine.camera.position.copy(smoothCamera);
    engine.camera.lookAt(lookGoal);
  } else {
    smoothCamera.set(0, 0, 0);
    engine.camera.position.set(bikeRoot.position.x + forward.x * .28, currentGround + 1.58, bikeRoot.position.z + forward.z * .28);
    engine.camera.rotation.set(0, 0, 0);
    engine.camera.rotateY(controller.yaw || 0);
    engine.camera.rotateX(controller.pitch || 0);
  }
  engine.camera.updateMatrixWorld(true);
}

function updateOnFoot(dt) {
  if (!bikeRoot) return;
  const hit = getGround(bikeRoot.position.x, bikeRoot.position.z);
  if (hit) {
    currentGround = hit.ground;
    bikeRoot.position.y += ((currentGround + .035) - bikeRoot.position.y) * (1 - Math.exp(-dt * 10));
  }
  const marker = bikeRoot.getObjectByName('BIKE_INTERACTION_MARKER');
  if (marker) {
    marker.rotation.z += dt * .7;
    marker.material.opacity = .34 + Math.sin(performance.now() * .004) * .13;
  }
  const distance = distanceToBike();
  if (distance > AUTO_MOUNT_DISTANCE + 1.0) autoMountArmed = true;
  if (autoMountArmed && distance <= AUTO_MOUNT_DISTANCE) {
    autoMountArmed = false;
    mountBike();
    return;
  }
  if (distance <= MOUNT_DISTANCE) setHud(t('PASA POR ENCIMA PARA SUBIR · E TAMBIÉN MONTA', 'WALK OVER IT TO MOUNT · E ALSO MOUNTS'));
  else if (distance < 18) setHud(t(`Bicicleta a ${distance.toFixed(1)} m · camina hasta ella`, `Bicycle ${distance.toFixed(1)} m away · walk toward it`), '#ffd66f');
}

function install() {
  if (installed) return;
  engine = window.__gtaVentaraEngine;
  controller = window.__gtaVentaraController;
  if (!engine?.scene || !engine?.camera || !controller || typeof engine.onUpdate !== 'function') return;
  installed = true;
  engine.onUpdate(dt => {
    if (!bikeRoot) {
      spawnBike();
      return;
    }
    if (riding) updateRiding(Math.min(dt, .05));
    else updateOnFoot(Math.min(dt, .05));
  });
}

const poll = setInterval(() => {
  install();
  if (installed) clearInterval(poll);
}, 80);
setTimeout(install, 0);
setTimeout(() => {
  if (!installed) setHud(t('El bosque continúa cargando; la bicicleta aparecerá al terminar', 'The forest is still loading; the bicycle will appear when ready'), '#ffd66f');
}, 12000);
