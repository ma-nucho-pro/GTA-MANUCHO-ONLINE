/**
 * GTA MANUCHO V100 — moto voladora física de Fog City.
 * Reemplaza el jetpack visual por la motocicleta original entregada por el
 * usuario. Conserva internamente la física de vuelo del juego para no duplicar
 * controles ni añadir carga innecesaria al render.
 */
import * as THREE from './bosque/libs/three.module.js';
import {
  createOriginalMotorcycle,
  loadDeathchaseAssets
} from './deathchase-original-assets-v97.js';

const SPAWN = new THREE.Vector3(48000, 3, 16000);
const INTERACT_DISTANCE = 155;

let game = null;
let pickup = null;
let pickupBike = null;
let rideBike = null;
let prompt = null;
let active = false;
let installed = false;
let originalFlySpeed = null;
let playerWasVisible = true;
let lastFrame = performance.now();

function makeBeacon() {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(54, 4, 8, 36),
    new THREE.MeshBasicMaterial({
      color: 0x43d7ff,
      transparent: true,
      opacity: .72,
      depthWrite: false
    })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 2;
  group.add(ring);
  const light = new THREE.PointLight(0x43d7ff, 2.4, 250, 2);
  light.position.y = 32;
  group.add(light);
  group.userData.ring = ring;
  return group;
}

function ensurePrompt() {
  if (prompt) return prompt;
  prompt = document.createElement('div');
  prompt.id = 'fog-city-hover-bike-prompt';
  prompt.style.cssText = 'position:fixed;left:50%;bottom:116px;transform:translateX(-50%);z-index:14500;display:none;padding:10px 15px;border:1px solid #43d7ff;border-radius:8px;background:rgba(4,8,14,.94);color:#fff;font:900 12px "Arial Narrow",Arial,sans-serif;letter-spacing:.07em;pointer-events:none;box-shadow:0 8px 25px rgba(0,0,0,.55)';
  document.body.appendChild(prompt);
  return prompt;
}

function groundY(x, z, fallback = 3) {
  try {
    const y = game?.getGroundY?.(x, fallback + 1000, z, false);
    return Number.isFinite(y) ? y : fallback;
  } catch {
    return fallback;
  }
}

function setWorldPickupPosition(x, z, yaw = 0) {
  if (!pickup) return;
  pickup.position.set(x, groundY(x, z, SPAWN.y), z);
  pickup.rotation.y = yaw;
  pickup.visible = true;
  pickup.userData.beacon.visible = true;
}

function mountHoverBike() {
  if (active || !game?.playerContainer || !pickup?.visible || !rideBike) return;
  active = true;
  window.__FOG_HOVER_BIKE_ACTIVE__ = true;
  window.__FOG_JETPACK_ACTIVE__ = true;
  pickup.visible = false;
  pickup.userData.beacon.visible = false;
  rideBike.visible = true;
  originalFlySpeed ??= Number(game.state?.flySpeed || 960);
  game.hasJetpack = true;
  game.state.isFlying = true;
  game.state.inWater = false;
  game.state.isSubmerged = false;
  game.state.onGround = false;
  game.state.vy = 0;
  game.state.flySpeed = 610;
  if (game.jetpackMesh) game.jetpackMesh.visible = false;
  if (game.playerModel) {
    playerWasVisible = game.playerModel.visible;
    game.playerModel.visible = false;
  }
  game.currentMessage = 'MOTO VOLADORA · ESPACIO SUBE · SHIFT BAJA · ENTER LA DEJA';
  game.updateHUDState?.();
  setTimeout(() => {
    if (game.currentMessage?.startsWith?.('MOTO VOLADORA')) {
      game.currentMessage = undefined;
      game.updateHUDState?.();
    }
  }, 2800);
}

function dropHoverBike() {
  if (!active || !game?.playerContainer) return;
  const player = game.playerContainer;
  const yaw = Number(player.rotation?.y || 0);
  const side = new THREE.Vector3(1, 0, 0)
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw)
    .multiplyScalar(78);
  active = false;
  window.__FOG_HOVER_BIKE_ACTIVE__ = false;
  window.__FOG_JETPACK_ACTIVE__ = false;
  rideBike.visible = false;
  game.hasJetpack = false;
  game.state.isFlying = false;
  game.state.vy = 0;
  game.state.flySpeed = originalFlySpeed || game.state.flySpeed;
  if (game.jetpackMesh) game.jetpackMesh.visible = false;
  if (game.playerModel) game.playerModel.visible = playerWasVisible;
  setWorldPickupPosition(player.position.x + side.x, player.position.z + side.z, yaw);
  game.currentMessage = 'MOTO VOLADORA DEJADA EN EL SUELO';
  game.updateHUDState?.();
  setTimeout(() => {
    if (game.currentMessage === 'MOTO VOLADORA DEJADA EN EL SUELO') {
      game.currentMessage = undefined;
      game.updateHUDState?.();
    }
  }, 1600);
}

function nearPickup() {
  if (!pickup?.visible || !pickupBike || !game?.playerContainer?.position) return false;
  const p = game.playerContainer.position;
  return Math.hypot(p.x - pickup.position.x, p.z - pickup.position.z) <= INTERACT_DISTANCE &&
    Math.abs(p.y - pickup.position.y) < 180;
}

function onKeyDown(event) {
  if (window.__VICE_MENU_OPEN__ || window.__VICE_FULL_MAP_OPEN__) return;
  if (event.code === 'Enter' && active && !event.repeat) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    dropHoverBike();
    return;
  }
  if (event.code === 'KeyE' && nearPickup() && !event.repeat) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    mountHoverBike();
  }
}

async function loadExactMotorcycles() {
  const assets = await loadDeathchaseAssets(game.renderer);
  const parked = createOriginalMotorcycle(assets, 96, { playerBike:true });
  pickupBike = parked.root;
  pickupBike.name = 'MOTO_VOLADORA_ORIGINAL_RECOGIBLE';
  pickupBike.position.y = 4;
  pickup.add(pickupBike);

  const ridden = createOriginalMotorcycle(assets, 97, { playerBike:true });
  rideBike = ridden.root;
  rideBike.name = 'MOTO_VOLADORA_ORIGINAL_MONTADA';
  rideBike.position.set(0, -17, 0);
  rideBike.rotation.y = 0;
  rideBike.visible = false;
  game.playerContainer.add(rideBike);
}

function update(now = performance.now()) {
  requestAnimationFrame(update);
  if (!installed || !game?.playerContainer) return;
  const dt = Math.min(.08, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;

  if (pickup?.visible) {
    pickup.rotation.y += dt * .28;
    const beacon = pickup.userData.beacon;
    beacon.rotation.y -= dt * .22;
    beacon.userData.ring.material.opacity = .54 + Math.sin(now * .0035) * .17;
    if (pickupBike) pickupBike.position.y = 7 + Math.sin(now * .0022) * 4;
  }

  const node = ensurePrompt();
  if (active) {
    window.__FOG_HOVER_BIKE_ACTIVE__ = true;
    window.__FOG_JETPACK_ACTIVE__ = true;
    game.hasJetpack = true;
    game.state.isFlying = true;
    game.state.inWater = false;
    game.state.isSubmerged = false;
    game.state.vy = 0;
    if (game.jetpackMesh) game.jetpackMesh.visible = false;
    if (game.playerModel) game.playerModel.visible = false;
    if (rideBike) {
      rideBike.visible = true;
      rideBike.rotation.z = Math.sin(now * .0016) * .025;
      rideBike.position.y = -17 + Math.sin(now * .003) * 1.6;
    }
    node.textContent = 'ENTER · DEJAR LA MOTO VOLADORA';
    node.style.display = 'block';
    if (game.activeCar || game.activeBoat || game.activeRiddenHorse ||
        window.__ACTIVE_AIRCRAFT__ || window.__ACTIVE_TANK__) dropHoverBike();
  } else if (nearPickup()) {
    node.textContent = 'E · SUBIR A LA MOTO VOLADORA';
    node.style.display = 'block';
  } else {
    node.style.display = 'none';
  }
}

function install() {
  if (installed) return true;
  game = window.__VICE_CITY_GAME__;
  if (!game?.city || !game?.renderer || !game?.playerContainer || !game?.state) return false;
  installed = true;

  const beacon = makeBeacon();
  pickup = new THREE.Group();
  pickup.name = 'FOG_CITY_HOVER_BIKE_PICKUP_V100';
  pickup.add(beacon);
  pickup.userData.beacon = beacon;
  setWorldPickupPosition(SPAWN.x, SPAWN.z, 0);
  game.city.add(pickup);

  game.hasJetpack = false;
  game.state.isFlying = false;
  if (game.jetpackMesh) game.jetpackMesh.visible = false;
  window.__FOG_JETPACK_ACTIVE__ = false;
  window.__FOG_HOVER_BIKE_ACTIVE__ = false;

  const api = {
    get active() { return active; },
    get pickup() { return pickup; },
    mount: mountHoverBike,
    drop: dropHoverBike
  };
  window.__FOG_CITY_HOVER_BIKE__ = api;
  window.__FOG_CITY_JETPACK__ = api;

  loadExactMotorcycles().catch(error => {
    console.error('[fog-city] No se pudo cargar la moto original adjunta.', error);
    game.currentMessage = 'NO SE PUDO CARGAR LA MOTO VOLADORA';
    game.updateHUDState?.();
  });

  document.addEventListener('keydown', onKeyDown, true);
  requestAnimationFrame(update);
  return true;
}

const wait = setInterval(() => {
  if (!window.__FOG_CITY_READY__ && !window.__VICE_CITY_GAME__) return;
  if (!install()) return;
  clearInterval(wait);
}, 180);

setTimeout(() => clearInterval(wait), 25000);
