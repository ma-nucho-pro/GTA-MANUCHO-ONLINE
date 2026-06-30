import * as THREE from 'three';
import { PlayerCharacter } from './PlayerCharacter.js';

const keys = Object.create(null);
const blockCodes = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'ShiftLeft', 'ShiftRight', 'KeyF'
]);

let app = null;
let scene = null;
let boat = null;
let player = null;
let dock = null;
let playerMode = 'dock'; // dock | deck | driving
let boatSpeed = 0;
let footLocal = new THREE.Vector3(6.2, 5.12, 7.0);
let playerLocalYaw = Math.PI;
let orbitYaw = Math.PI * 0.82;
let orbitPitch = 0.34;
let orbitDistance = 145;
let dragging = false;
let pointerX = 0;
let pointerY = 0;
let initialized = false;

const tempWorld = new THREE.Vector3();
const target = new THREE.Vector3();
const desiredCamera = new THREE.Vector3();
const forward = new THREE.Vector3();

const hud = document.createElement('div');
hud.id = 'gta-ventara-player-hud';
hud.innerHTML = `
  <strong>GTA MANUCHO</strong>
  <span data-status>Preparando océano, personaje y barco…</span>
  <small data-help>WASD mover · Shift correr · F subir al barco</small>
`;
document.body.appendChild(hud);
const statusNode = hud.querySelector('[data-status]');
const helpNode = hud.querySelector('[data-help]');

function handleInteraction() {
  if (!initialized) return;
  if (playerMode === 'dock') {
    // Solo sube cuando está junto al borde conectado con la cubierta.
    if (footLocal.x <= 4.35) {
      playerMode = 'deck';
      footLocal.set(1.85, 5.28, 7.0);
      playerLocalYaw = Math.PI;
    }
  } else if (playerMode === 'deck') {
    playerMode = 'driving';
    footLocal.set(0, 5.52, -2.4);
    playerLocalYaw = Math.PI;
    boatSpeed = 0;
  } else {
    playerMode = 'deck';
    footLocal.set(1.65, 5.3, -1.3);
    playerLocalYaw = Math.PI;
    boatSpeed = 0;
  }
  updateHud();
}

function stopGameKey(event) {
  if (!blockCodes.has(event.code)) return;
  keys[event.code] = event.type === 'keydown';
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  if (event.type === 'keydown' && event.code === 'KeyF' && !event.repeat) handleInteraction();
}

window.addEventListener('keydown', stopGameKey, true);
window.addEventListener('keyup', stopGameKey, true);
window.addEventListener('blur', () => {
  for (const code of Object.keys(keys)) keys[code] = false;
});

window.addEventListener('pointerdown', (event) => {
  if (event.target?.closest?.('.wp-panel, #gta-ventara-player-hud')) return;
  dragging = true;
  pointerX = event.clientX;
  pointerY = event.clientY;
});
window.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  orbitYaw -= (event.clientX - pointerX) * 0.005;
  orbitPitch = THREE.MathUtils.clamp(orbitPitch + (event.clientY - pointerY) * 0.003, 0.12, 0.95);
  pointerX = event.clientX;
  pointerY = event.clientY;
});
window.addEventListener('pointerup', () => { dragging = false; });
window.addEventListener('wheel', (event) => {
  orbitDistance = THREE.MathUtils.clamp(orbitDistance + event.deltaY * 0.08, 70, 260);
}, { passive: true });

function updateHud() {
  if (!initialized) {
    statusNode.textContent = 'Preparando océano, personaje y barco…';
    return;
  }
  if (playerMode === 'driving') {
    statusNode.textContent = `Manejando el barco · velocidad ${Math.round(Math.abs(boatSpeed))}`;
    helpNode.textContent = 'W/S acelerar · A/D girar · F dejar el timón · ratón mover cámara';
    return;
  }
  if (playerMode === 'deck') {
    statusNode.textContent = window.__GTA_VENTARA_SOLDIER_READY__
      ? 'Soldier de Three.js caminando sobre la cubierta'
      : 'Personaje Three.js caminando sobre la cubierta';
    helpNode.textContent = 'WASD caminar · Shift correr · F tomar el timón';
    return;
  }
  const nearBoarding = footLocal.x <= 4.35;
  statusNode.textContent = nearBoarding
    ? 'Estás junto al barco: pulsa F para subir'
    : 'Camina por el embarcadero hasta el costado del barco';
  helpNode.textContent = 'WASD caminar · Shift correr · F subir al barco';
}

function getActiveCamera() {
  return app?.o1ghxknu?.o1dmq8e2 || app?.camera || null;
}

function localToWorld(local) {
  tempWorld.copy(local);
  boat.localToWorld(tempWorld);
  return tempWorld;
}

function createDock() {
  // Embarcadero colocado al lado del barco original. No sustituye ninguna isla ni el océano.
  const center = localToWorld(new THREE.Vector3(6.25, 4.88, 7.0)).clone();
  const material = new THREE.MeshStandardMaterial({ color: 0x6b4a2d, roughness: 0.92, metalness: 0.02 });
  const platform = new THREE.Mesh(new THREE.BoxGeometry(82, 5, 180), material);
  platform.name = 'Embarcadero GTA MANUCHO';
  platform.position.copy(center);
  platform.rotation.y = boat.rotation.y;
  platform.castShadow = true;
  platform.receiveShadow = true;
  scene.add(platform);

  const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xe8d6a7 });
  for (let i = -3; i <= 3; i++) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(3, 0.45, 170), lineMaterial);
    plank.position.copy(center);
    const side = new THREE.Vector3(i * 9, 2.8, 0).applyQuaternion(boat.quaternion);
    plank.position.add(side);
    plank.rotation.y = boat.rotation.y;
    scene.add(plank);
  }
  return platform;
}

function updateWalking(delta) {
  const moveX = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  const moveZ = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
  const moving = moveX !== 0 || moveZ !== 0;
  const running = keys.ShiftLeft || keys.ShiftRight;

  if (moving) {
    const length = Math.hypot(moveX, moveZ) || 1;
    const speed = running ? 1.25 : 0.7;
    footLocal.x += (moveX / length) * speed * delta;
    footLocal.z += (moveZ / length) * speed * delta;
    if (playerMode === 'dock') {
      footLocal.x = THREE.MathUtils.clamp(footLocal.x, 3.55, 8.8);
      footLocal.z = THREE.MathUtils.clamp(footLocal.z, 1.2, 12.8);
      footLocal.y = 5.12;
    } else {
      footLocal.x = THREE.MathUtils.clamp(footLocal.x, -2.15, 2.15);
      footLocal.z = THREE.MathUtils.clamp(footLocal.z, -7.6, 9.0);
      footLocal.y = 5.28;
    }
    playerLocalYaw = Math.atan2(moveX, moveZ);
  }

  const worldPosition = localToWorld(footLocal).clone();
  player.setWorldTransform(worldPosition, boat.rotation.y + playerLocalYaw);
  player.update(delta, moving ? (running ? 'Run' : 'Walk') : 'Idle');
}

function updateBoat(delta) {
  const throttle = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
  const steering = (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0);

  boatSpeed += throttle * 28 * delta;
  boatSpeed *= Math.exp(-delta * (throttle ? 0.42 : 1.25));
  boatSpeed = THREE.MathUtils.clamp(boatSpeed, -12, 48);

  if (Math.abs(boatSpeed) > 0.25) {
    boat.rotation.y += steering * delta * (0.24 + Math.min(0.32, Math.abs(boatSpeed) * 0.008)) * Math.sign(boatSpeed);
  }

  forward.set(0, 0, -1).applyQuaternion(boat.quaternion).normalize();
  boat.position.x += forward.x * boatSpeed * delta;
  boat.position.z += forward.z * boatSpeed * delta;

  const helm = localToWorld(footLocal).clone();
  player.setWorldTransform(helm, boat.rotation.y + Math.PI);
  player.update(delta, 'Idle');
}

function updateCamera(delta) {
  const camera = getActiveCamera();
  if (!camera) return;

  if (playerMode === 'driving') {
    boat.getWorldPosition(target);
    target.y += 62;
  } else {
    localToWorld(footLocal);
    target.copy(tempWorld);
    target.y += 13;
  }

  const horizontal = Math.cos(orbitPitch) * orbitDistance;
  desiredCamera.set(
    target.x + Math.sin(orbitYaw) * horizontal,
    target.y + Math.sin(orbitPitch) * orbitDistance,
    target.z + Math.cos(orbitYaw) * horizontal
  );
  const alpha = 1 - Math.exp(-delta * 5.5);
  camera.position.lerp(desiredCamera, alpha);
  camera.lookAt(target);

  if (app?.o1m55bfd) app.o1m55bfd.camera = camera;
  if (app?.scenePass) app.scenePass.camera = camera;
}

function frameUpdate(delta, waterApp) {
  if (!initialized) return;
  app = waterApp || app;
  if (playerMode === 'driving') updateBoat(delta);
  else updateWalking(delta);
  updateCamera(delta);
  updateHud();
}

function initialize(waterApp) {
  if (initialized || !waterApp?.o1m55bfd?.scene || !waterApp?.models?.o1fnn26i) return false;
  app = waterApp;
  scene = app.o1m55bfd.scene;
  boat = app.models.o1fnn26i;
  dock = createDock();
  player = new PlayerCharacter(scene);
  if (app.controls) app.controls.enabled = false;
  window.__GTA_VENTARA_PLAYER_UPDATE__ = frameUpdate;
  initialized = true;
  updateWalking(0);
  updateCamera(0.016);
  updateHud();
  console.info('GTA MANUCHO: personaje integrado sin reemplazar el océano, la isla ni los modelos originales.');
  return true;
}

function waitForOriginalGame() {
  if (initialize(window.__GTA_WATER_APP)) return;
  window.setTimeout(waitForOriginalGame, 100);
}

window.addEventListener('gta-water-ready', (event) => initialize(event.detail));
waitForOriginalGame();
