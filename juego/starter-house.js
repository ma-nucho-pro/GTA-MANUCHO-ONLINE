/**
 * GTA MANUCHO V84 — código del proyecto.
 * Creado e integrado por Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * ARKEA AI / Manucho · conserva LICENSE, NOTICE.md y estos créditos al reutilizar.
 */
import * as THREE from './bosque/libs/three.module.js';

const WORLD_SCALE = 16;
const HOUSE_LOGICAL = { x: -2200, z: -5000 };
const HOUSE_WORLD = { x: HOUSE_LOGICAL.x * WORLD_SCALE, z: HOUSE_LOGICAL.z * WORLD_SCALE };
const STARTED_KEY = 'vice_city_v72_started';
const HOUSE_RETURN_KEY = 'vice_city_v72_house_return';
const RETURNING_KEY = 'vice_city_v72_house_returning';
const CAMERA_KEY = 'vice_city_v72_camera_owned';
const OUTFIT_KEY = 'vice_city_v72_outfit';
const PENDING_SAVE_KEY = 'vice_city_v70_pending_loaded_save';

let game = null;
let installed = false;
let prompt = null;
let cameraHud = null;
let viewfinder = null;
let house = null;
let photoMode = false;
let lastOutfit = '';
let lastPlayerVisual = null;

function groundAt(x, z, fallback = 0) {
  try {
    const y = game?.getGroundY?.(x, fallback + 900, z, false);
    return Number.isFinite(y) ? y : fallback;
  } catch {
    return fallback;
  }
}

function makePlant(x, z, scale = 1) {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(12 * scale, 16 * scale, 24 * scale, 10),
    new THREE.MeshLambertMaterial({ color: 0x8f684d })
  );
  pot.position.y = 12 * scale;
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(2.4 * scale, 3.6 * scale, 52 * scale, 7),
    new THREE.MeshLambertMaterial({ color: 0x49643a })
  );
  stem.position.y = 47 * scale;
  g.add(pot, stem);
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x4f7f45 });
  for (let i = 0; i < 7; i++) {
    const a = i * Math.PI * 2 / 7;
    const leaf = new THREE.Mesh(new THREE.CapsuleGeometry(4 * scale, 20 * scale, 3, 6), leafMat);
    leaf.position.set(Math.cos(a) * 14 * scale, (62 + (i % 2) * 7) * scale, Math.sin(a) * 14 * scale);
    leaf.rotation.z = Math.PI * .5 - .35;
    leaf.rotation.y = a;
    g.add(leaf);
  }
  g.position.set(x, 0, z);
  return g;
}

function createHouseExterior() {
  const root = new THREE.Group();
  root.name = 'CASA_INICIAL_LUMEN';
  const wall = new THREE.MeshLambertMaterial({ color: 0xd7cfbf });
  const dark = new THREE.MeshLambertMaterial({ color: 0x20252b });
  const wood = new THREE.MeshLambertMaterial({ color: 0x684832 });
  const glass = new THREE.MeshLambertMaterial({ color: 0x9bc8dc, transparent: true, opacity: .7 });
  const trim = new THREE.MeshLambertMaterial({ color: 0xf2eee5 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(360, 178, 250), wall);
  body.position.y = 89;
  const sideWing = new THREE.Mesh(new THREE.BoxGeometry(150, 126, 175), trim);
  sideWing.position.set(205, 63, -18);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(382, 15, 272), dark);
  roof.position.y = 184;
  const wingRoof = new THREE.Mesh(new THREE.BoxGeometry(166, 13, 191), dark);
  wingRoof.position.set(205, 132, -18);
  const door = new THREE.Mesh(new THREE.BoxGeometry(66, 105, 9), wood);
  door.position.set(0, 52.5, 129);
  const porch = new THREE.Mesh(new THREE.BoxGeometry(150, 8, 82), new THREE.MeshLambertMaterial({ color: 0xb9a78d }));
  porch.position.set(0, 4, 163);
  root.add(body, sideWing, roof, wingRoof, door, porch);

  for (const x of [-112, 112]) {
    const windowMesh = new THREE.Mesh(new THREE.BoxGeometry(72, 58, 7), glass);
    windowMesh.position.set(x, 102, 130);
    root.add(windowMesh);
    const sill = new THREE.Mesh(new THREE.BoxGeometry(80, 7, 14), dark);
    sill.position.set(x, 70, 134);
    root.add(sill);
  }
  const wingWindow = new THREE.Mesh(new THREE.BoxGeometry(70, 50, 7), glass);
  wingWindow.position.set(205, 77, 72);
  root.add(wingWindow);

  root.add(makePlant(-145, 150, 1.05), makePlant(145, 150, .95), makePlant(245, 82, .82));

  const x = HOUSE_WORLD.x;
  const z = HOUSE_WORLD.z;
  const y = groundAt(x, z, 0);
  root.position.set(x, y, z);
  root.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = false;
    o.receiveShadow = false;
    o.frustumCulled = true;
  });
  game.city.add(root);

  const doorWorld = new THREE.Vector3(x, y + 3, z + 205);
  house = {
    root,
    door: doorWorld,
    spawn: new THREE.Vector3(x, y + .55, z + 286),
    logicalX: HOUSE_LOGICAL.x,
    logicalZ: HOUSE_LOGICAL.z,
    name: 'CASA INICIAL'
  };
  window.__STARTER_HOUSE__ = house;
}

function ensureUi() {
  if (!prompt) {
    prompt = document.createElement('div');
    prompt.id = 'starter-house-prompt';
    prompt.style.cssText = 'position:fixed;left:50%;bottom:112px;transform:translateX(-50%);z-index:26000;display:none;padding:10px 15px;border-radius:8px;background:rgba(5,10,16,.94);border:1px solid #77baff;color:#fff;font:900 12px Arial;letter-spacing:.06em;pointer-events:none;box-shadow:0 8px 26px #0008';
    prompt.textContent = 'E · ENTRAR A CASA';
    document.body.appendChild(prompt);
  }
  if (!cameraHud) {
    cameraHud = document.createElement('div');
    cameraHud.id = 'camera-inventory-hud';
    cameraHud.style.cssText = 'position:fixed;left:20px;top:68px;z-index:9700;display:none;align-items:center;gap:8px;padding:7px 10px;border-radius:7px;background:rgba(4,9,18,.86);border:1px solid #7ea7cf;color:#eaf4ff;font:900 10px Arial;letter-spacing:.05em;pointer-events:none';
    cameraHud.innerHTML = '<span style="font-size:18px">📷</span><span>C · CÁMARA</span>';
    document.body.appendChild(cameraHud);
  }
  if (!viewfinder) {
    viewfinder = document.createElement('div');
    viewfinder.id = 'vice-photo-viewfinder';
    viewfinder.style.cssText = 'position:fixed;inset:0;z-index:25500;display:none;pointer-events:none;border:28px solid rgba(0,0,0,.72);box-shadow:inset 0 0 0 2px rgba(255,255,255,.8)';
    viewfinder.innerHTML = '<div style="position:absolute;left:50%;top:50%;width:46px;height:46px;transform:translate(-50%,-50%);border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 1px #000"></div><div style="position:absolute;left:50%;bottom:38px;transform:translateX(-50%);padding:7px 12px;border-radius:6px;background:#000b;color:#fff;font:900 11px Arial;letter-spacing:.08em">CLIC · TOMAR FOTO &nbsp; C · GUARDAR CÁMARA</div>';
    document.body.appendChild(viewfinder);
  }
  updateCameraHud();
}

function cameraOwned() {
  try { return localStorage.getItem(CAMERA_KEY) === '1'; } catch { return false; }
}

function updateCameraHud() {
  if (!cameraHud) return;
  cameraHud.style.display = cameraOwned() ? 'flex' : 'none';
}

function entrySnapshot() {
  const p = game.playerContainer.position;
  return {
    x: Number(p.x), y: Number(p.y), z: Number(p.z),
    yaw: Number(game.playerContainer.rotation.y || 0),
    health: Math.max(1, Number(game.health || 150)),
    armor: Math.max(0, Number(game.armor || 0)),
    money: Math.max(0, Number(game.money || 200))
  };
}

function enterHouse() {
  try { window.__CUSTOM_CAR_SYSTEM__?.exit?.(); } catch {}
  try { window.__AIRCRAFT_SYSTEM__?.exit?.(); } catch {}
  try { localStorage.setItem(HOUSE_RETURN_KEY, JSON.stringify(entrySnapshot())); } catch {}
  location.href = './casa/index.html';
}

function restoreFromHouse() {
  let shouldRestore = false;
  let state = null;
  try {
    shouldRestore = localStorage.getItem(RETURNING_KEY) === '1';
    if (shouldRestore) state = JSON.parse(localStorage.getItem(HOUSE_RETURN_KEY) || 'null');
    localStorage.removeItem(RETURNING_KEY);
  } catch {}
  if (!shouldRestore || !state) return false;
  const apply = () => {
    if (!game?.playerContainer) return;
    const x = Number(state.x), z = Number(state.z);
    if (!Number.isFinite(x) || !Number.isFinite(z)) return;
    const y = groundAt(x, z, Number(state.y || 0)) + .35;
    game.playerContainer.position.set(x, y, z);
    game.playerContainer.rotation.y = Number(state.yaw || 0);
    game.health = Math.max(1, Number(state.health || 150));
    game.armor = Math.max(0, Number(state.armor || 0));
    game.money = Math.max(0, Number(state.money || 200));
    if (game.state) {
      game.state.vy = 0;
      game.state.onGround = true;
      game.state.inWater = false;
    }
    game.updateHUDState?.();
  };
  apply();
  setTimeout(apply, 550);
  setTimeout(apply, 1500);
  return true;
}

function applyNewGameStart() {
  let started = false;
  let pendingSave = false;
  try {
    started = localStorage.getItem(STARTED_KEY) === '1';
    pendingSave = Boolean(localStorage.getItem(PENDING_SAVE_KEY));
  } catch {}
  const loaded = new URL(location.href).searchParams.get('loaded') === '1';
  if (started || pendingSave || loaded) return;
  try { localStorage.setItem(STARTED_KEY, '1'); } catch {}
  const apply = () => {
    if (!house || !game?.playerContainer) return;
    game.playerContainer.position.copy(house.spawn);
    game.playerContainer.position.y = groundAt(house.spawn.x, house.spawn.z, house.spawn.y) + .55;
    game.playerContainer.rotation.y = Math.PI;
    game.money = 200;
    game.health = Math.max(150, Number(game.health || 0));
    if (game.state) {
      game.state.vy = 0;
      game.state.onGround = true;
      game.state.inWater = false;
    }
    game.updateHUDState?.();
  };
  apply();
  setTimeout(apply, 600);
  setTimeout(apply, 1800);
}

function outfitPalette(id) {
  if (id === 'azul') return { main: 0x244f86, dark: 0x14283f };
  if (id === 'oscuro') return { main: 0x202226, dark: 0x08090b };
  return { main: 0xc55a16, dark: 0x17120e };
}

function applyOutfit() {
  const outfit = localStorage.getItem(OUTFIT_KEY) || 'naranja';
  const visual = game?.playerModel || game?.playerContainer;
  if (!visual || (lastOutfit === outfit && lastPlayerVisual === visual)) return;
  lastOutfit = outfit;
  lastPlayerVisual = visual;
  const palette = outfitPalette(outfit);
  visual.traverse?.(obj => {
    if (!obj.isMesh && !obj.isSkinnedMesh) return;
    const name = `${obj.name || ''} ${obj.material?.name || ''}`.toLowerCase();
    if (/head|face|skin|hand|eye|teeth/.test(name)) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    const next = mats.map((mat, i) => {
      if (!mat?.clone) return mat;
      if (!mat.userData?.v72OutfitClone) {
        const cloned = mat.clone();
        cloned.userData = { ...(mat.userData || {}), v72OutfitClone: true };
        mat = cloned;
      }
      if (mat.color) mat.color.setHex(i % 2 ? palette.dark : palette.main);
      return mat;
    });
    obj.material = Array.isArray(obj.material) ? next : next[0];
  });
}

function setPhotoMode(value) {
  photoMode = Boolean(value && cameraOwned());
  viewfinder.style.display = photoMode ? 'block' : 'none';
  document.body.style.cursor = photoMode ? 'crosshair' : '';
}

function takePhoto() {
  if (!photoMode || !game?.renderer?.domElement) return;
  try { game.renderer.render(game.scene, game.camera); } catch {}
  const canvas = game.renderer.domElement;
  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VICE_CITY_FOTO_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  }, 'image/png');
}

function onKeyDown(event) {
  if (event.code === 'KeyC' && !event.repeat && cameraOwned()) {
    event.preventDefault();
    event.stopImmediatePropagation();
    setPhotoMode(!photoMode);
    return;
  }
  if (event.code !== 'KeyE' || event.repeat || !house) return;
  const p = window.__CUSTOM_CAR_SYSTEM__?.active?.root?.position || game?.playerContainer?.position;
  if (!p || p.distanceTo(house.door) > 150) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  enterHouse();
}

function onMouseDown(event) {
  if (!photoMode || event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  takePhoto();
}

function updatePrompt() {
  if (!house || !game?.playerContainer) return;
  const p = window.__CUSTOM_CAR_SYSTEM__?.active?.root?.position || game.playerContainer.position;
  prompt.style.display = p.distanceTo(house.door) <= 150 ? 'block' : 'none';
  updateCameraHud();
  applyOutfit();
}

async function install() {
  if (installed) return;
  game = window.__VICE_CITY_GAME__;
  if (!game?.city || !game?.playerContainer) return;
  installed = true;
  ensureUi();
  createHouseExterior();
  const restored = restoreFromHouse();
  if (!restored) applyNewGameStart();
  applyOutfit();
  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('mousedown', onMouseDown, true);
  setInterval(updatePrompt, 160);
}

const ready = setInterval(() => {
  game = window.__VICE_CITY_GAME__ || game;
  if (!game?.city || !game?.playerContainer) return;
  clearInterval(ready);
  install().catch(error => console.error('[starter-house]', error));
}, 120);
setTimeout(() => clearInterval(ready), 30000);
