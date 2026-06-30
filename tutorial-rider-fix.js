import * as THREE from 'three';

const rigCache = new WeakMap();
const bikeCache = new WeakMap();
const stateCache = new WeakMap();
const UP = new THREE.Vector3(0, 1, 0);

function getRig(root) {
  if (!root) return null;
  const visual = root.children?.[0] || root;
  const cached = rigCache.get(root);
  if (cached?.visual === visual) return cached;
  const bone = (name) => root.getObjectByName(name) || root.getObjectByName(name.replace('mixamorig:', 'mixamorig'));
  const rig = {
    visual,
    fallback: visual?.userData?.limbs || root.userData?.limbs || null,
    hips: bone('mixamorig:Hips'),
    spine: bone('mixamorig:Spine'),
    spine1: bone('mixamorig:Spine1'),
    spine2: bone('mixamorig:Spine2'),
    neck: bone('mixamorig:Neck'),
    head: bone('mixamorig:Head'),
    leftShoulder: bone('mixamorig:LeftShoulder'),
    rightShoulder: bone('mixamorig:RightShoulder'),
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
  rigCache.set(root, rig);
  return rig;
}

function getBikeParts(bike) {
  const cached = bikeCache.get(bike);
  if (cached) return cached;
  const exact = (...names) => {
    for (const name of names) {
      const found = bike.getObjectByName(name);
      if (found) return found;
    }
    return null;
  };
  const parts = {
    seat: exact('Sattel_736_sattel', 'Sattel_26656', 'Sattel_24139', 'Sattelstange2'),
    gripA: exact('Lenkergriff 1'),
    gripB: exact('Lenkergriff'),
    handle: exact('Lenker 1', 'Lenker'),
    pedalA: exact('Pedal_Funn_Bigfoot_le'),
    pedalB: exact('Pedal_Funn_Bigfoot_re'),
    pedalCenter: exact('Pedale', 'Kurbel_X01_DH_li'),
    frontWheel: exact('frontWheel', 'RadVorn'),
    backWheel: exact('backWheel', 'RadHinten')
  };
  bikeCache.set(bike, parts);
  return parts;
}

function worldPosition(object, fallback) {
  if (!object) return fallback.clone();
  return object.getWorldPosition(new THREE.Vector3());
}

function captureBonePose(rig) {
  const state = {};
  for (const [key, bone] of Object.entries(rig || {})) {
    if (!bone || !bone.isBone) continue;
    state[key] = {
      rotation: bone.rotation.clone(),
      quaternion: bone.quaternion.clone()
    };
  }
  return state;
}

function storeBaseState(root, rig) {
  if (!root) return null;
  let state = stateCache.get(root);
  if (!state) {
    state = {
      rootScale: root.scale.clone(),
      rootRotation: root.rotation.clone(),
      bonePose: captureBonePose(rig),
      hadPose: false
    };
    stateCache.set(root, state);
  }
  return state;
}

function restoreBaseState(root) {
  const state = stateCache.get(root);
  if (!root || !state || !state.hadPose) return;
  root.scale.copy(state.rootScale);
  root.rotation.copy(state.rootRotation);
  const rig = getRig(root);
  for (const [key, pose] of Object.entries(state.bonePose || {})) {
    const bone = rig?.[key];
    if (!bone) continue;
    bone.rotation.copy(pose.rotation);
    bone.quaternion.copy(pose.quaternion);
  }
  state.hadPose = false;
  root.updateWorldMatrix(true, true);
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
  const worldQuaternion = bone.getWorldQuaternion(new THREE.Quaternion());
  const desiredWorldQuaternion = delta.multiply(worldQuaternion);
  const parentQuaternion = bone.parent
    ? bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert()
    : new THREE.Quaternion();
  bone.quaternion.copy(parentQuaternion.multiply(desiredWorldQuaternion));
  bone.updateWorldMatrix(true, true);
}

function solveTwoBone(upper, lower, end, target, bendBias) {
  if (!upper || !lower || !end) return;
  upper.updateWorldMatrix(true, true);
  const shoulder = upper.getWorldPosition(new THREE.Vector3());
  const elbowNow = lower.getWorldPosition(new THREE.Vector3());
  const endNow = end.getWorldPosition(new THREE.Vector3());
  const length1 = Math.max(0.001, shoulder.distanceTo(elbowNow));
  const length2 = Math.max(0.001, elbowNow.distanceTo(endNow));
  const toward = target.clone().sub(shoulder);
  let distance = toward.length();
  if (distance < 1e-5) return;
  const direction = toward.normalize();
  distance = THREE.MathUtils.clamp(distance, Math.abs(length1 - length2) + 0.001, (length1 + length2) * 0.985);
  const along = (length1 * length1 - length2 * length2 + distance * distance) / (2 * distance);
  const height = Math.sqrt(Math.max(0, length1 * length1 - along * along));
  const perpendicular = bendBias.clone().sub(direction.clone().multiplyScalar(bendBias.dot(direction)));
  if (perpendicular.lengthSq() < 1e-6) perpendicular.crossVectors(direction, UP);
  if (perpendicular.lengthSq() < 1e-6) perpendicular.set(1, 0, 0);
  perpendicular.normalize();
  const elbowTarget = shoulder.clone().addScaledVector(direction, along).addScaledVector(perpendicular, height);
  aimBone(upper, lower, elbowTarget);
  aimBone(lower, end, target);
}

function leanSpine(rig, forward) {
  const desired = UP.clone().multiplyScalar(0.68).addScaledVector(forward, 0.74).normalize();
  for (const [bone, child, factor] of [
    [rig.spine, rig.spine1, 1],
    [rig.spine1, rig.spine2, 0.94]
  ]) {
    if (!bone || !child) continue;
    const origin = bone.getWorldPosition(new THREE.Vector3());
    aimBone(bone, child, origin.add(desired.clone().multiplyScalar(factor)));
  }
  if (rig.neck && rig.head) {
    const origin = rig.neck.getWorldPosition(new THREE.Vector3());
    aimBone(rig.neck, rig.head, origin.add(UP.clone().multiplyScalar(0.75)).addScaledVector(forward, 0.65));
  }
}

function fallbackPose(rig, moving, time) {
  const limbs = rig?.fallback;
  if (!limbs) return;
  const phase = moving ? Math.sin(time * 10) : 0;
  if (limbs.armL) { limbs.armL.rotation.x = 1.55; limbs.armL.rotation.z = -0.40; }
  if (limbs.armR) { limbs.armR.rotation.x = 1.55; limbs.armR.rotation.z = 0.40; }
  if (limbs.legL) limbs.legL.rotation.x = -1.25 + phase * 0.58;
  if (limbs.legR) limbs.legR.rotation.x = -1.25 - phase * 0.58;
}

window.__applyTutorialBikePose = function applyTutorialBikePose(game, elapsed, moving, keys) {
  const rider = game?.soldierModel;
  const bike = game?.bikeGroup;
  if (!rider || !bike || !game.isRidingBike) return;

  const rig = getRig(rider);
  storeBaseState(rider, rig).hadPose = true;

  if (!game.isFallbackRobot) rider.scale.setScalar(4.15);

  rider.rotation.y = bike.rotation.y;
  rider.rotation.x = 0;
  rider.rotation.z = keys?.a ? 0.065 : keys?.d ? -0.065 : 0;
  bike.updateWorldMatrix(true, true);
  rider.updateWorldMatrix(true, true);

  const parts = getBikeParts(bike);
  const yaw = bike.rotation.y;
  const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
  const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)).normalize();

  const frontWheel = worldPosition(parts.frontWheel, bike.position.clone().addScaledVector(forward, 20));
  const backWheel = worldPosition(parts.backWheel, bike.position.clone().addScaledVector(forward, -20));
  const wheelbase = Math.max(8, frontWheel.distanceTo(backWheel));

  const seatFallback = bike.position.clone().addScaledVector(forward, -wheelbase * 0.16).addScaledVector(UP, wheelbase * 0.39);
  const seat = worldPosition(parts.seat, seatFallback);

  rider.position.x = seat.x;
  rider.position.z = seat.z;
  rider.updateWorldMatrix(true, true);
  if (rig?.hips) {
    const hip = rig.hips.getWorldPosition(new THREE.Vector3());
    const desiredHip = seat.clone()
      .addScaledVector(UP, -wheelbase * 0.02)
      .addScaledVector(forward, -wheelbase * 0.01);
    rider.position.add(desiredHip.sub(hip));
  } else {
    rider.position.y = seat.y - wheelbase * 0.31;
  }
  rider.updateWorldMatrix(true, true);

  fallbackPose(rig, moving, elapsed);
  if (!rig || rig.fallback || !rig.leftArm || !rig.rightArm) return;

  leanSpine(rig, forward);
  rider.updateWorldMatrix(true, true);

  const gripOne = worldPosition(parts.gripA, bike.position.clone().addScaledVector(forward, wheelbase * 0.37).addScaledVector(UP, -wheelbase * 0.02));
  const gripTwo = worldPosition(parts.gripB, gripOne.clone());
  const handleCenter = parts.gripA || parts.gripB
    ? gripOne.clone().add(gripTwo).multiplyScalar(0.5)
    : worldPosition(parts.handle, bike.position.clone().addScaledVector(forward, wheelbase * 0.37).addScaledVector(UP, wheelbase * 0.42));
  let gripHalf = Math.abs(gripOne.clone().sub(gripTwo).dot(right)) * 0.5;
  gripHalf = THREE.MathUtils.clamp(gripHalf || wheelbase * 0.11, wheelbase * 0.09, wheelbase * 0.17);
  const leftGrip = handleCenter.clone().addScaledVector(right, -gripHalf).addScaledVector(UP, -wheelbase * 0.01);
  const rightGrip = handleCenter.clone().addScaledVector(right, gripHalf).addScaledVector(UP, -wheelbase * 0.01);

  const leftArmBias = right.clone().multiplyScalar(-1).addScaledVector(UP, -0.35).addScaledVector(forward, 0.18);
  const rightArmBias = right.clone().addScaledVector(UP, -0.35).addScaledVector(forward, 0.18);
  solveTwoBone(rig.leftArm, rig.leftForeArm, rig.leftHand, leftGrip, leftArmBias);
  solveTwoBone(rig.rightArm, rig.rightForeArm, rig.rightHand, rightGrip, rightArmBias);

  const pedalOne = worldPosition(parts.pedalA, bike.position.clone());
  const pedalTwo = worldPosition(parts.pedalB, pedalOne.clone());
  const pedalCenter = parts.pedalA || parts.pedalB
    ? pedalOne.clone().add(pedalTwo).multiplyScalar(0.5)
    : worldPosition(parts.pedalCenter, bike.position.clone().addScaledVector(UP, wheelbase * 0.17));
  let pedalHalf = Math.abs(pedalOne.clone().sub(pedalTwo).dot(right)) * 0.5;
  pedalHalf = THREE.MathUtils.clamp(pedalHalf || wheelbase * 0.05, wheelbase * 0.038, wheelbase * 0.08);
  const cadence = keys?.Shift ? 13 : 9;
  const phase = moving ? elapsed * cadence : 0;
  const radius = wheelbase * 0.07;
  const leftPedal = pedalCenter.clone()
    .addScaledVector(right, -pedalHalf)
    .addScaledVector(UP, Math.sin(phase) * radius)
    .addScaledVector(forward, Math.cos(phase) * radius);
  const rightPedal = pedalCenter.clone()
    .addScaledVector(right, pedalHalf)
    .addScaledVector(UP, -Math.sin(phase) * radius)
    .addScaledVector(forward, -Math.cos(phase) * radius);
  const leftKneeBias = forward.clone().multiplyScalar(0.86).addScaledVector(right, -0.20).addScaledVector(UP, 0.12);
  const rightKneeBias = forward.clone().multiplyScalar(0.86).addScaledVector(right, 0.20).addScaledVector(UP, 0.12);
  solveTwoBone(rig.leftUpLeg, rig.leftLeg, rig.leftFoot, leftPedal, leftKneeBias);
  solveTwoBone(rig.rightUpLeg, rig.rightLeg, rig.rightFoot, rightPedal, rightKneeBias);
  if (rig.leftToe) aimBone(rig.leftFoot, rig.leftToe, leftPedal.clone().addScaledVector(forward, wheelbase * 0.05));
  if (rig.rightToe) aimBone(rig.rightFoot, rig.rightToe, rightPedal.clone().addScaledVector(forward, wheelbase * 0.05));
};

