/**
 * GTA MANUCHO V84 — código del proyecto.
 * Creado e integrado por Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * ARKEA AI / Manucho · conserva LICENSE, NOTICE.md y estos créditos al reutilizar.
 */
import * as THREE from './bosque/libs/three.module.js';
import { GLTFLoader } from './bosque/bike-runtime/loaders/GLTFLoader.js';
import { OBJLoader } from './weapon-assets/OBJLoader.js';

THREE.Cache.enabled = true;

const WORLD_SCALE = 16;
const STORAGE_KEY = 'vice_city_v61_native_weapon_inventory';
const CRATE_RESPAWN_MS = 90000;
const CRATE_SIZE = 30;
const CRATE_COUNT = 18;

// Puntos ya comprobados sobre asfalto, aceras o islas firmes. En cada partida
// se mezclan y reciben una pequeña variación para que las cajas no salgan igual.
const SAFE_CRATE_ANCHORS = [
  [-2200,-5050],[-1700,-5050],[-900,-5000],[-2200,-4200],[-900,-3700],
  [-2250,-3200],[-1550,-2900],[-750,-1800],[-2200,-900],[-800,-850],
  [-2250,-100],[-1550,650],[-750,2050],[-1900,2450],
  [900,-5050],[1500,-4900],[2100,-4100],[950,-3300],[2000,-2500],
  [900,-950],[2000,-850],[900,1200],[2100,1700],[950,2900],[2000,3900],
  [-300,-420],[280,-100]
];

const WEAPONS = {
  fist: { label: 'PUÑO', ammo: Infinity, cooldown: 260, damage: 1 },
  pistol: { label: 'PISTOLA', ammoGrant: 48, cooldown: 330, damage: 1 },
  akm: { label: 'AK-47', ammoGrant: 120, cooldown: 105, damage: 2 },
  shotgun: { label: 'ESCOPETA', ammoGrant: 30, cooldown: 720, damage: 3 }
};

const CHEAT_CODES = {
  GUN: 'pistol',
  PISTOL: 'pistol',
  AK47: 'akm',
  METRA: 'akm',
  ARM: 'shotgun'
};

const crates = [];
const pickups = [];
const tempBox = new THREE.Box3();
const tempSize = new THREE.Vector3();
const tempCenter = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const rayDirection = new THREE.Vector3();

let game = null;
let installed = false;
let crateTexture = null;
const weaponSources = { pistol: null, akmPickup: null, akmView: null, shotgun: null };
let weaponAssetLoadStarted = false;
let originalTriggerWeaponAction = null;
let selectedWeapon = 'fist';
let lastShotAt = 0;
let nearestPickup = null;
let prompt = null;
let viewWeapon = null;
let commandBuffer = '';
let commandTimer = 0;
let inventory = loadInventory();

function loadInventory() {
  const fallback = {
    fist: { owned: true, ammo: -1 },
    pistol: { owned: false, ammo: 0 },
    akm: { owned: false, ammo: 0 },
    shotgun: { owned: false, ammo: 0 }
  };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return fallback;
    return { ...fallback, ...saved, fist: { owned: true, ammo: -1 } };
  } catch {
    return fallback;
  }
}

function saveInventory() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory)); } catch {}
}

function idleTurn(timeout = 900) {
  return new Promise(resolve => {
    if ('requestIdleCallback' in window) requestIdleCallback(() => resolve(), { timeout });
    else setTimeout(resolve, Math.min(timeout, 220));
  });
}

function notice(text, duration = 2300) {
  let node = document.getElementById('weapon-crate-notice');
  if (!node) {
    node = document.createElement('div');
    node.id = 'weapon-crate-notice';
    node.style.cssText = [
      'position:fixed','left:50%','top:22%','transform:translateX(-50%)','z-index:9900',
      'padding:10px 16px','border-radius:10px','background:rgba(7,10,15,.92)',
      'border:1px solid #e0ad42','color:white','font:900 13px Arial,sans-serif',
      'letter-spacing:.06em','pointer-events:none','display:none','box-shadow:0 14px 34px rgba(0,0,0,.5)'
    ].join(';');
    document.body.appendChild(node);
  }
  node.textContent = text;
  node.style.display = 'block';
  clearTimeout(node.__hideTimer);
  node.__hideTimer = setTimeout(() => { node.style.display = 'none'; }, duration);
}

function groundAt(x, z, fallback = 0) {
  try {
    const y = game?.getGroundY?.(x, fallback + 180, z, false);
    return Number.isFinite(y) ? y : fallback;
  } catch {
    return fallback;
  }
}

function ensurePrompt() {
  if (prompt) return prompt;
  prompt = document.createElement('div');
  prompt.id = 'weapon-pickup-prompt';
  prompt.style.cssText = [
    'position:fixed','left:50%','bottom:122px','transform:translateX(-50%)','z-index:9400',
    'padding:9px 14px','border-radius:9px','background:rgba(4,8,13,.92)',
    'border:1px solid #e0ad42','color:#fff7d6','font:900 12px Arial,sans-serif',
    'letter-spacing:.055em','pointer-events:none','display:none'
  ].join(';');
  document.body.appendChild(prompt);
  return prompt;
}

function nativeInventoryItems() {
  return Array.isArray(window.__VICE_WEAPON_ITEMS__) ? window.__VICE_WEAPON_ITEMS__ : null;
}

function weaponTemplate(id) {
  const templates = window.__VICE_WEAPON_TEMPLATES__;
  if (!Array.isArray(templates)) return null;
  return templates.find(item => item?.id === id) || null;
}

function addToNativeInventory(id) {
  if (id === 'fist') return;
  const items = nativeInventoryItems();
  if (!items || items.some(item => item?.id === id)) return;
  const template = weaponTemplate(id);
  if (!template) return;
  // Se inserta la plantilla real de cada arma para conservar su silueta propia
  // en el inventario original que se recorre con Q.
  items.push({ ...template, name: WEAPONS[id].label });
}

function syncNativeInventory() {
  const items = nativeInventoryItems();
  const templates = window.__VICE_WEAPON_TEMPLATES__;
  if (!items || !Array.isArray(templates)) return;
  const fist = templates.find(item => item?.id === 'fist') || templates[0];
  items.splice(0, items.length, fist);
  for (const id of ['pistol', 'akm', 'shotgun']) {
    if (inventory[id]?.owned) addToNativeInventory(id);
  }
}

function createProceduralWeapon(id) {
  const group = new THREE.Group();
  const dark = new THREE.MeshLambertMaterial({ color: 0x22252a });
  const wood = new THREE.MeshLambertMaterial({ color: id === 'akm' ? 0x8c4d22 : 0x59351f });
  if (id === 'pistol') {
    const slide = new THREE.Mesh(new THREE.BoxGeometry(1.5,.38,.42), dark);
    slide.position.z = -.3;
    const grip = new THREE.Mesh(new THREE.BoxGeometry(.38,.9,.42), wood);
    grip.position.set(.35,-.5,.15);
    grip.rotation.z = -.25;
    group.add(slide, grip);
  } else if (id === 'shotgun') {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.10,.10,2.4,8), dark);
    barrel.rotation.z = Math.PI/2;
    const stock = new THREE.Mesh(new THREE.BoxGeometry(1.1,.42,.42), wood);
    stock.position.x = .85;
    group.add(barrel, stock);
  } else {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.6,.5,.36), dark);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,1.3,8), dark);
    barrel.rotation.z = Math.PI/2;
    barrel.position.x = -.95;
    const stock = new THREE.Mesh(new THREE.BoxGeometry(.9,.42,.38), wood);
    stock.position.x = 1.1;
    group.add(body, barrel, stock);
  }
  group.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = false;
    object.receiveShadow = false;
  });
  return group;
}

function optimizeLoadedModel(root, { hideArms = false } = {}) {
  root.traverse(object => {
    const name = String(object.name || '').toLowerCase();
    if (hideArms && name.includes('armmodel')) object.visible = false;
    if (!object.isMesh && !object.isSkinnedMesh) return;
    object.castShadow = false;
    object.receiveShadow = false;
    object.frustumCulled = true;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material) continue;
      material.transparent = Boolean(material.transparent);
      material.needsUpdate = true;
    }
  });
  return root;
}

function normalizeWeaponModel(root, targetLength, rotationY = 0) {
  const inner = new THREE.Group();
  inner.add(root);
  root.rotation.y += rotationY;
  inner.updateMatrixWorld(true);
  tempBox.setFromObject(inner);
  tempBox.getSize(tempSize);
  const longest = Math.max(tempSize.x, tempSize.y, tempSize.z, .0001);
  inner.scale.setScalar(targetLength / longest);
  inner.updateMatrixWorld(true);
  tempBox.setFromObject(inner);
  tempBox.getCenter(tempCenter);
  inner.position.sub(tempCenter);
  inner.updateMatrixWorld(true);
  const outer = new THREE.Group();
  outer.add(inner);
  return outer;
}

function cloneWeaponSource(id, mode = 'pickup') {
  let source = null;
  if (id === 'akm') source = mode === 'view' ? weaponSources.akmView : weaponSources.akmPickup;
  else source = weaponSources[id];
  if (!source) return null;
  const clone = source.clone(true);
  clone.traverse(object => {
    if (!object.isMesh && !object.isSkinnedMesh) return;
    if (mode === 'view') {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      const cloned = materials.map(material => {
        if (!material) return material;
        const copy = material.clone();
        copy.depthTest = false;
        copy.depthWrite = false;
        copy.transparent = material.transparent;
        return copy;
      });
      object.material = Array.isArray(object.material) ? cloned : cloned[0];
      object.renderOrder = 9999;
      object.frustumCulled = false;
    }
  });
  return clone;
}

async function precompileWeaponSource(source) {
  if (!source || !game?.renderer) return;
  await idleTurn(1000);
  const stage = new THREE.Scene();
  stage.add(new THREE.HemisphereLight(0xffffff, 0x303030, 1.5));
  const clone = source.clone(true);
  clone.position.set(0, 0, -3);
  stage.add(clone);
  const camera = new THREE.PerspectiveCamera(55, 1, .05, 30);
  camera.position.set(0, 0, 2.5);
  camera.lookAt(0, 0, -2);
  try {
    if (typeof game.renderer.compileAsync === 'function') await game.renderer.compileAsync(stage, camera);
    else game.renderer.compile?.(stage, camera);
  } catch {}
}

function replacePickupVisual(pickup) {
  if (!pickup?.group) return;
  const exact = cloneWeaponSource(pickup.id, 'pickup');
  if (!exact) return;
  while (pickup.group.children.length) pickup.group.remove(pickup.group.children[0]);
  exact.scale.setScalar(pickup.id === 'pistol' ? 18 : pickup.id === 'shotgun' ? 16 : 14);
  exact.rotation.set(0, pickup.id === 'akm' ? -Math.PI * .5 : 0, 0);
  pickup.group.add(exact);
}

function refreshWeaponVisuals(id) {
  for (const pickup of pickups) if (pickup.id === id) replacePickupVisual(pickup);
  if (selectedWeapon === id) createViewWeapon(id);
}

async function loadPistolModel() {
  const textureLoader = new THREE.TextureLoader();
  const [map, normalMap, roughnessMap] = await Promise.all([
    textureLoader.loadAsync('./weapon-assets/cerberus/Cerberus_A.jpg'),
    textureLoader.loadAsync('./weapon-assets/cerberus/Cerberus_N.jpg'),
    textureLoader.loadAsync('./weapon-assets/cerberus/Cerberus_RM.jpg')
  ]);
  map.colorSpace = THREE.SRGBColorSpace;
  for (const texture of [map, normalMap, roughnessMap]) texture.anisotropy = Math.min(2, game.renderer?.capabilities?.getMaxAnisotropy?.() || 1);
  const root = await new OBJLoader().loadAsync('./weapon-assets/cerberus/Cerberus.obj');
  const material = new THREE.MeshStandardMaterial({ map, normalMap, roughnessMap, roughness: .62, metalness: .28 });
  root.traverse(object => { if (object.isMesh) object.material = material; });
  weaponSources.pistol = normalizeWeaponModel(optimizeLoadedModel(root), 1.15, 0);
  await precompileWeaponSource(weaponSources.pistol);
  refreshWeaponVisuals('pistol');
}

async function loadAkmModels() {
  const gltf = await new GLTFLoader().loadAsync('./weapon-assets/FpsRig.glb');
  const pickupRoot = optimizeLoadedModel(gltf.scene.clone(true), { hideArms: true });
  const viewRoot = optimizeLoadedModel(gltf.scene.clone(true), { hideArms: false });
  weaponSources.akmPickup = normalizeWeaponModel(pickupRoot, 1.65, -Math.PI * .5);
  weaponSources.akmView = normalizeWeaponModel(viewRoot, 1.72, -Math.PI * .5);
  await precompileWeaponSource(weaponSources.akmView);
  refreshWeaponVisuals('akm');
}

async function loadShotgunModel() {
  const textureLoader = new THREE.TextureLoader();
  const [map, normalMap, specularMap] = await Promise.all([
    textureLoader.loadAsync('./weapon-assets/ithaca/M37_diffuse.jpg'),
    textureLoader.loadAsync('./weapon-assets/ithaca/M37_normal.jpg'),
    textureLoader.loadAsync('./weapon-assets/ithaca/M37_specular.jpg')
  ]);
  map.colorSpace = THREE.SRGBColorSpace;
  for (const texture of [map, normalMap, specularMap]) texture.anisotropy = Math.min(2, game.renderer?.capabilities?.getMaxAnisotropy?.() || 1);
  const root = await new OBJLoader().loadAsync('./weapon-assets/ithaca/m37 tris.obj');
  const material = new THREE.MeshStandardMaterial({ map, normalMap, roughness: .42, metalness: .35 });
  root.traverse(object => { if (object.isMesh) object.material = material; });
  weaponSources.shotgun = normalizeWeaponModel(optimizeLoadedModel(root), 1.82, Math.PI);
  await precompileWeaponSource(weaponSources.shotgun);
  refreshWeaponVisuals('shotgun');
}

async function loadWeaponAssetsGradually() {
  if (weaponAssetLoadStarted) return;
  weaponAssetLoadStarted = true;
  const jobs = [loadPistolModel, loadAkmModels, loadShotgunModel];
  for (const job of jobs) {
    await idleTurn(1800);
    try { await job(); } catch (error) { console.warn('[weapon-crates] Modelo de arma de respaldo activo.', error); }
    await new Promise(resolve => setTimeout(resolve, 700));
  }
}

function weaponPickupVisual(id) {
  const exact = cloneWeaponSource(id, 'pickup');
  if (exact) {
    exact.scale.setScalar(id === 'pistol' ? 18 : id === 'shotgun' ? 16 : 14);
    exact.rotation.set(0, id === 'akm' ? -Math.PI * .5 : 0, 0);
    return exact;
  }
  const visual = createProceduralWeapon(id);
  visual.scale.setScalar(14);
  return visual;
}

function createViewWeapon(id) {
  if (viewWeapon?.parent) viewWeapon.parent.remove(viewWeapon);
  viewWeapon = null;
  if (id === 'fist') return;
  viewWeapon = cloneWeaponSource(id, 'view') || createProceduralWeapon(id);
  viewWeapon.name = 'V63_VIEW_WEAPON';
  if (weaponSources[id] || (id === 'akm' && weaponSources.akmView)) {
    if (id === 'pistol') {
      viewWeapon.scale.setScalar(.92);
      viewWeapon.position.set(.42, -.34, -1.02);
      viewWeapon.rotation.set(-.05, -.06, -.03);
    } else if (id === 'akm') {
      viewWeapon.scale.setScalar(.92);
      viewWeapon.position.set(.22, -.48, -1.22);
      viewWeapon.rotation.set(-.02, -.08, -.025);
    } else {
      viewWeapon.scale.setScalar(.84);
      viewWeapon.position.set(.40, -.43, -1.16);
      viewWeapon.rotation.set(-.06, -.02, -.035);
    }
  } else {
    viewWeapon.scale.setScalar(.32);
    viewWeapon.position.set(.48,-.38,-1.05);
    viewWeapon.rotation.set(-.08,-.12,-.06);
  }
  game.camera.add(viewWeapon);
}

function equipWeapon(id) {
  if (!WEAPONS[id]) id = 'fist';
  if (id !== 'fist' && !inventory[id]?.owned) id = 'fist';
  selectedWeapon = id;
  game.activeWeapon = id === 'fist' ? 'fist' : 'pistol';
  if (game.pistolMesh) game.pistolMesh.visible = false;
  if (game.fpPistolMesh) game.fpPistolMesh.visible = false;
  createViewWeapon(id);
}

function shuffledCratePoints() {
  const points = SAFE_CRATE_ANCHORS.map(([x,z]) => [x,z]);
  for (let i = points.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [points[i], points[j]] = [points[j], points[i]];
  }
  return points.slice(0, CRATE_COUNT).map(([x,z]) => [
    x + (Math.random() - .5) * 36,
    z + (Math.random() - .5) * 36
  ]);
}

function createCrate(logicalX, logicalZ, index) {
  const x = logicalX * WORLD_SCALE;
  const z = logicalZ * WORLD_SCALE;
  const y = groundAt(x, z, 0);
  const material = new THREE.MeshLambertMaterial({ map: crateTexture, color: 0xffffff });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(CRATE_SIZE, CRATE_SIZE, CRATE_SIZE), material);
  mesh.name = `CAJA_ARMAS_V61_${index}`;
  mesh.position.set(x, y + CRATE_SIZE * .5, z);
  mesh.rotation.y = Math.random() * Math.PI * 2;
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  const entry = { mesh, health: 3, logicalX, logicalZ, broken: false, index };
  mesh.userData.weaponCrate = true;
  mesh.userData.crateEntry = entry;
  game.city.add(mesh);
  crates.push(entry);
}

function createDebris(position) {
  const geometry = new THREE.BoxGeometry(5,5,5);
  const material = new THREE.MeshLambertMaterial({ map: crateTexture, color: 0xffffff });
  const pieces = [];
  for (let i = 0; i < 5; i++) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    const velocity = new THREE.Vector3((Math.random()-.5)*80,40+Math.random()*65,(Math.random()-.5)*80);
    game.scene.add(mesh);
    pieces.push({ mesh, velocity });
  }
  let last = performance.now();
  const start = last;
  function animate(now) {
    const dt = Math.min(.05,(now-last)/1000);
    last = now;
    for (const piece of pieces) {
      piece.velocity.y -= 150*dt;
      piece.mesh.position.addScaledVector(piece.velocity,dt);
      piece.mesh.rotation.x += dt*4;
      piece.mesh.rotation.y += dt*3;
    }
    if (now-start < 800) requestAnimationFrame(animate);
    else {
      for (const piece of pieces) game.scene.remove(piece.mesh);
      geometry.dispose();
      material.dispose();
    }
  }
  requestAnimationFrame(animate);
}

function spawnPickup(position, forcedId = null, options = {}) {
  const ids = ['pistol','akm','shotgun'];
  const id = WEAPONS[forcedId] && forcedId !== 'fist' ? forcedId : ids[Math.floor(Math.random()*ids.length)];
  const group = new THREE.Group();
  group.name = `ARMA_RECOGIBLE_${id.toUpperCase()}`;
  group.add(weaponPickupVisual(id));
  group.position.copy(position);
  group.position.y += Number.isFinite(options.height) ? options.height : 10;
  game.city.add(group);
  const pickup = {
    id,
    group,
    phase: Math.random()*Math.PI*2,
    baseY: group.position.y,
    droppedByGang: Boolean(options.droppedByGang)
  };
  pickups.push(pickup);
  if (options.notice !== false) notice(`${WEAPONS[id].label} DISPONIBLE · PULSA E PARA RECOGER`, 2600);
  return pickup;
}

function dropWeaponAt(position, id = null) {
  if (!position || !game?.city) return null;
  const dropPosition = position.clone ? position.clone() : new THREE.Vector3(position.x || 0, position.y || 0, position.z || 0);
  return spawnPickup(dropPosition, id, { droppedByGang:true, height:12, notice:true });
}

function breakCrate(entry) {
  if (!entry || entry.broken) return;
  entry.broken = true;
  const position = entry.mesh.position.clone();
  entry.mesh.parent?.remove(entry.mesh);
  createDebris(position);
  spawnPickup(position);
  setTimeout(() => {
    const x = entry.logicalX * WORLD_SCALE;
    const z = entry.logicalZ * WORLD_SCALE;
    entry.health = 3;
    entry.broken = false;
    entry.mesh.position.set(x, groundAt(x,z,0)+CRATE_SIZE*.5, z);
    entry.mesh.rotation.y = Math.random()*Math.PI*2;
    game.city.add(entry.mesh);
  }, CRATE_RESPAWN_MS);
}

function damageCrate(entry, damage = 1) {
  if (!entry || entry.broken) return false;
  entry.health -= damage;
  entry.mesh.scale.set(1.12,.88,1.12);
  setTimeout(() => entry.mesh?.scale?.set(1,1,1), 85);
  if (entry.health <= 0) breakCrate(entry);
  return true;
}

function nearestCrate(maxDistance = 115) {
  const player = game?.playerContainer?.position;
  if (!player) return null;
  let best = null;
  let bestSq = maxDistance*maxDistance;
  for (const entry of crates) {
    if (entry.broken || !entry.mesh.parent) continue;
    const distanceSq = entry.mesh.position.distanceToSquared(player);
    if (distanceSq < bestSq) {
      bestSq = distanceSq;
      best = entry;
    }
  }
  return best;
}

function raycastCrate() {
  game.camera.getWorldDirection(rayDirection);
  raycaster.set(game.camera.position, rayDirection);
  raycaster.far = 2600;
  const objects = crates.filter(entry => !entry.broken && entry.mesh.parent).map(entry => entry.mesh);
  const hit = raycaster.intersectObjects(objects, false)[0];
  return hit?.object?.userData?.crateEntry || null;
}

function fireCustomWeapon() {
  const spec = WEAPONS[selectedWeapon];
  const state = inventory[selectedWeapon];
  const now = performance.now();
  if (!spec || now - lastShotAt < spec.cooldown) return;
  if (!state || state.ammo <= 0) {
    notice('SIN MUNICIÓN');
    return;
  }
  lastShotAt = now;
  state.ammo--;
  saveInventory();
  const crate = raycastCrate();
  if (crate) damageCrate(crate, spec.damage);
  try { game.performShoot?.(); } catch {}
}

function patchGameWeapons() {
  game.hasJetpack = false;
  game.state.isFlying = false;
  if (game.jetpackMesh) game.jetpackMesh.visible = false;
  if (game.pistolMesh) game.pistolMesh.visible = false;
  if (game.fpPistolMesh) game.fpPistolMesh.visible = false;

  game.toggleJetpack = function disabledJetpackSilently() {
    this.hasJetpack = false;
    this.state.isFlying = false;
    if (this.jetpackMesh) this.jetpackMesh.visible = false;
  };

  game.setWeapon = function nativeInventoryWeapon(id) {
    equipWeapon(id);
  };

  originalTriggerWeaponAction = game.triggerWeaponAction?.bind(game);
  game.triggerWeaponAction = function nativeInventoryWeaponAction() {
    if (selectedWeapon === 'fist') {
      const crate = nearestCrate();
      if (crate) damageCrate(crate, 1);
      return originalTriggerWeaponAction?.();
    }
    fireCustomWeapon();
  };
}

function grantWeapon(id, source = 'RECOGIDA', autoEquip = false) {
  if (!WEAPONS[id] || id === 'fist') return;
  const state = inventory[id] || { owned:false, ammo:0 };
  state.owned = true;
  state.ammo = Math.max(0, state.ammo || 0) + WEAPONS[id].ammoGrant;
  inventory[id] = state;
  addToNativeInventory(id);
  saveInventory();
  if (autoEquip) {
    equipWeapon(id);
    window.dispatchEvent(new CustomEvent('vice-equip-weapon', { detail: { id } }));
  }
  notice(`${WEAPONS[id].label} ${source} · GUARDADA EN INVENTARIO · Q PARA CAMBIAR`, 3000);
}


function collectPickup(pickup) {
  if (!pickup) return;
  grantWeapon(pickup.id, 'RECOGIDA', true);
  pickup.group.parent?.remove(pickup.group);
  const index = pickups.indexOf(pickup);
  if (index >= 0) pickups.splice(index,1);
  nearestPickup = null;
}

function updateCommandBuffer(event) {
  const target = event.target;
  const editing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
  if (editing || event.key?.length !== 1 || !/[a-z0-9]/i.test(event.key)) return false;
  clearTimeout(commandTimer);
  commandBuffer = (commandBuffer + event.key.toUpperCase()).slice(-16);
  commandTimer = setTimeout(() => { commandBuffer = ''; }, 1800);
  for (const [code, id] of Object.entries(CHEAT_CODES)) {
    if (!commandBuffer.endsWith(code)) continue;
    commandBuffer = '';
    grantWeapon(id, 'AÑADIDA', true);
    return true;
  }
  return false;
}

function onKeyDown(event) {
  updateCommandBuffer(event);
  if (event.code === 'KeyE' && nearestPickup && !event.repeat) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    collectPickup(nearestPickup);
  }
}

function update() {
  requestAnimationFrame(update);
  const player = game?.playerContainer?.position;
  if (!player) return;

  nearestPickup = null;
  let bestSq = 110*110;
  const time = performance.now()/1000;
  for (const pickup of pickups) {
    pickup.group.rotation.y += .018;
    pickup.group.position.y = pickup.baseY + Math.sin(time*2.2+pickup.phase)*2.2;
    const distanceSq = pickup.group.position.distanceToSquared(player);
    if (distanceSq < bestSq) {
      bestSq = distanceSq;
      nearestPickup = pickup;
    }
  }
  if (nearestPickup) {
    ensurePrompt().textContent = `E · RECOGER ${WEAPONS[nearestPickup.id].label} · SE AÑADE AL INVENTARIO Q`;
    prompt.style.display = 'block';
  } else if (prompt) {
    prompt.style.display = 'none';
  }

  if (viewWeapon) {
    const inVehicle = Boolean(game.activeCar || game.activeBoat || game.activeRiddenHorse || window.__ACTIVE_AIRCRAFT__ || window.__ACTIVE_TANK__);
    viewWeapon.visible = !inVehicle && selectedWeapon !== 'fist' && game.state?.camMode === 2;
  }
  if (game.pistolMesh) game.pistolMesh.visible = false;
  if (game.fpPistolMesh) game.fpPistolMesh.visible = false;
  if (!window.__FOG_JETPACK_ACTIVE__) {
    game.hasJetpack = false;
    if (game.jetpackMesh) game.jetpackMesh.visible = false;
  }
}

async function install() {
  if (installed) return;
  game = window.__VICE_CITY_GAME__;
  if (!game?.city || !game?.scene || !game?.camera || !game?.playerContainer) return;
  installed = true;

  syncNativeInventory();
  patchGameWeapons();
  equipWeapon('fist');
  document.addEventListener('keydown', onKeyDown, true);

  crateTexture = await new THREE.TextureLoader().loadAsync('./weapon-assets/crate.gif');
  crateTexture.colorSpace = THREE.SRGBColorSpace;
  crateTexture.anisotropy = Math.min(2, game.renderer?.capabilities?.getMaxAnisotropy?.() || 1);
  const points = shuffledCratePoints();
  for (let i = 0; i < points.length; i++) {
    createCrate(points[i][0], points[i][1], i);
    if (i % 3 === 2) await idleTurn(220);
  }
  loadWeaponAssetsGradually();
  window.__WEAPON_CRATES__ = { crates, pickups, inventory, grantWeapon, dropWeaponAt, spawnPickup, get selectedWeapon() { return selectedWeapon; } };
  requestAnimationFrame(update);
}

const wait = setInterval(() => {
  game = window.__VICE_CITY_GAME__ || game;
  if (!game?.city || !game?.scene || !game?.camera || !game?.playerContainer) return;
  clearInterval(wait);
  install().catch(error => console.error('[weapon-crates] Error de instalación.', error));
}, 120);

setTimeout(() => clearInterval(wait), 30000);
