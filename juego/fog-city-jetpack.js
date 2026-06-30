/**
 * GTA MANUCHO V84 — código del proyecto.
 * Creado e integrado por Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * ARKEA AI / Manucho · conserva LICENSE, NOTICE.md y estos créditos al reutilizar.
 */
import * as THREE from './bosque/libs/three.module.js';

// GTA MANUCHO V81 · Jetpack físico exclusivo de Fog City.
// No se guarda en el inventario ni en localStorage: al bajar queda en el mundo.
const SPAWN = new THREE.Vector3(48000, 3, 16000);
const INTERACT_DISTANCE = 155;
const WORLD_PACK_HEIGHT = 58;

let game = null;
let pickup = null;
let prompt = null;
let active = false;
let installed = false;
let originalFlySpeed = null;
let lastFrame = performance.now();

function makeWorldJetpack() {
  const root = new THREE.Group();
  root.name = 'FOG_CITY_WORLD_JETPACK';

  const dark = new THREE.MeshStandardMaterial({ color: 0x202833, metalness: .72, roughness: .28 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x9eabb8, metalness: .9, roughness: .18 });
  const orange = new THREE.MeshStandardMaterial({ color: 0xff7a16, emissive: 0x4a1200, emissiveIntensity: .5, metalness: .42, roughness: .28 });
  const nozzle = new THREE.MeshStandardMaterial({ color: 0x111418, metalness: .82, roughness: .34 });

  const back = new THREE.Mesh(new THREE.BoxGeometry(29, 47, 11), dark);
  back.position.y = 30;
  root.add(back);

  for (const side of [-1, 1]) {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(9, 10, 55, 12), metal);
    tank.position.set(side * 20, 30, 0);
    root.add(tank);

    const cap = new THREE.Mesh(new THREE.SphereGeometry(9, 12, 8), orange);
    cap.scale.y = .58;
    cap.position.set(side * 20, 58, 0);
    root.add(cap);

    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(8, 5, 13, 12), nozzle);
    exhaust.position.set(side * 20, -2, 0);
    root.add(exhaust);
  }

  const connector = new THREE.Mesh(new THREE.BoxGeometry(47, 6, 8), dark);
  connector.position.y = 33;
  root.add(connector);

  const straps = new THREE.MeshStandardMaterial({ color: 0x090b0e, roughness: .92 });
  for (const side of [-1, 1]) {
    const strap = new THREE.Mesh(new THREE.TorusGeometry(10, 2.2, 6, 18, Math.PI * 1.35), straps);
    strap.rotation.set(Math.PI / 2, 0, side < 0 ? .28 : -.28);
    strap.position.set(side * 9, 31, -8);
    root.add(strap);
  }

  root.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = false;
    object.receiveShadow = false;
    object.frustumCulled = true;
  });
  return root;
}

function makeBeacon() {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(54, 4, 8, 36),
    new THREE.MeshBasicMaterial({ color: 0xff8a19, transparent: true, opacity: .75, depthWrite: false })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 2;
  group.add(ring);

  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(17, 34, 120, 18, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xff7a16, transparent: true, opacity: .075, side: THREE.DoubleSide, depthWrite: false })
  );
  beam.position.y = 60;
  group.add(beam);
  group.userData.ring = ring;
  return group;
}

function ensurePrompt() {
  if (prompt) return prompt;
  prompt = document.createElement('div');
  prompt.id = 'fog-city-jetpack-prompt';
  prompt.style.cssText = 'position:fixed;left:50%;bottom:116px;transform:translateX(-50%);z-index:14500;display:none;padding:10px 15px;border:1px solid #ff8a19;border-radius:8px;background:rgba(4,8,14,.94);color:#fff;font:900 12px "Arial Narrow",Arial,sans-serif;letter-spacing:.07em;pointer-events:none;box-shadow:0 8px 25px rgba(0,0,0,.55)';
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

function mountJetpack() {
  if (active || !game?.playerContainer || !pickup?.visible) return;
  active = true;
  window.__FOG_JETPACK_ACTIVE__ = true;
  pickup.visible = false;
  pickup.userData.beacon.visible = false;
  originalFlySpeed ??= Number(game.state?.flySpeed || 960);
  game.hasJetpack = true;
  game.state.isFlying = true;
  game.state.inWater = false;
  game.state.isSubmerged = false;
  game.state.onGround = false;
  game.state.vy = 0;
  game.state.flySpeed = 430;
  if (game.jetpackMesh) game.jetpackMesh.visible = true;
  game.currentMessage = 'JETPACK EQUIPADO · ESPACIO SUBE · SHIFT BAJA · ENTER LO DEJA';
  game.updateHUDState?.();
  setTimeout(() => {
    if (game.currentMessage?.startsWith?.('JETPACK EQUIPADO')) {
      game.currentMessage = undefined;
      game.updateHUDState?.();
    }
  }, 2600);
}

function dropJetpack() {
  if (!active || !game?.playerContainer) return;
  const player = game.playerContainer;
  const yaw = Number(player.rotation?.y || 0);
  const side = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw).multiplyScalar(78);
  active = false;
  window.__FOG_JETPACK_ACTIVE__ = false;
  game.hasJetpack = false;
  game.state.isFlying = false;
  game.state.vy = 0;
  game.state.flySpeed = originalFlySpeed || game.state.flySpeed;
  if (game.jetpackMesh) game.jetpackMesh.visible = false;
  setWorldPickupPosition(player.position.x + side.x, player.position.z + side.z, yaw);
  game.currentMessage = 'JETPACK DEJADO EN EL SUELO';
  game.updateHUDState?.();
  setTimeout(() => {
    if (game.currentMessage === 'JETPACK DEJADO EN EL SUELO') {
      game.currentMessage = undefined;
      game.updateHUDState?.();
    }
  }, 1500);
}

function nearPickup() {
  if (!pickup?.visible || !game?.playerContainer?.position) return false;
  const p = game.playerContainer.position;
  return Math.hypot(p.x - pickup.position.x, p.z - pickup.position.z) <= INTERACT_DISTANCE && Math.abs(p.y - pickup.position.y) < 180;
}

function onKeyDown(event) {
  if (window.__VICE_MENU_OPEN__ || window.__VICE_FULL_MAP_OPEN__) return;
  if (event.code === 'Enter' && active && !event.repeat) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    dropJetpack();
    return;
  }
  if (event.code === 'KeyE' && nearPickup() && !event.repeat) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    mountJetpack();
  }
}

function update(now = performance.now()) {
  requestAnimationFrame(update);
  if (!installed || !game?.playerContainer) return;
  const dt = Math.min(.08, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;

  if (pickup?.visible) {
    pickup.rotation.y += dt * .42;
    const beacon = pickup.userData.beacon;
    beacon.rotation.y -= dt * .22;
    beacon.userData.ring.material.opacity = .55 + Math.sin(now * .0035) * .18;
  }

  const node = ensurePrompt();
  if (active) {
    // El jugador base ya tiene física de vuelo; reafirmamos el estado porque otros
    // sistemas antiguos desactivaban el jetpack cada fotograma.
    window.__FOG_JETPACK_ACTIVE__ = true;
    game.hasJetpack = true;
    game.state.isFlying = true;
    game.state.inWater = false;
    game.state.vy = 0;
    if (game.jetpackMesh) {
      game.jetpackMesh.visible = true;
      for (let i = 0; i < (game.jetpackFlames || []).length; i++) {
        const flame = game.jetpackFlames[i];
        flame.visible = true;
        const pulse = .78 + Math.sin(now * .018 + i) * .19;
        flame.scale.set(pulse, .85 + pulse * .34, pulse);
      }
    }
    node.textContent = 'ENTER · DEJAR JETPACK EN EL SUELO';
    node.style.display = 'block';
    if (game.activeCar || game.activeBoat || game.activeRiddenHorse || window.__ACTIVE_AIRCRAFT__ || window.__ACTIVE_TANK__) dropJetpack();
  } else if (nearPickup()) {
    node.textContent = 'E · PONERSE EL JETPACK';
    node.style.display = 'block';
  } else {
    node.style.display = 'none';
  }
}

function install() {
  if (installed) return true;
  game = window.__VICE_CITY_GAME__;
  if (!game?.city || !game?.playerContainer || !game?.state) return false;
  installed = true;

  const model = makeWorldJetpack();
  const beacon = makeBeacon();
  pickup = new THREE.Group();
  pickup.name = 'FOG_CITY_JETPACK_PICKUP';
  pickup.add(model, beacon);
  pickup.userData.beacon = beacon;
  model.position.y = 5;
  model.scale.setScalar(1);
  setWorldPickupPosition(SPAWN.x, SPAWN.z, 0);
  game.city.add(pickup);

  // El jetpack nativo ya está unido a la espalda del personaje y respeta sus
  // animaciones. Permanece oculto hasta recoger el objeto de Fog City.
  game.hasJetpack = false;
  game.state.isFlying = false;
  if (game.jetpackMesh) game.jetpackMesh.visible = false;
  window.__FOG_JETPACK_ACTIVE__ = false;
  window.__FOG_CITY_JETPACK__ = {
    get active() { return active; },
    get pickup() { return pickup; },
    mount: mountJetpack,
    drop: dropJetpack
  };

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
