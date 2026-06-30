/**
 * GTA MANUCHO V84 — código del proyecto.
 * Creado e integrado por Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * ARKEA AI / Manucho · conserva LICENSE, NOTICE.md y estos créditos al reutilizar.
 */
import * as THREE from './bosque/libs/three.module.js';

THREE.Cache.enabled = true;

const WORLD_SCALE = 16;
const STORAGE_KEY = 'vice_city_v70_properties';
const PENDING_LOAD_KEY = 'vice_city_v70_pending_loaded_save';
const PROPERTY_RETURN_KEY = 'vice_city_v70_property_return';
const CITY_RETURN_KEY = 'vice_city_v67_game_of_crew_return';
const SAVE_FORMAT = 'VICE_CITY_OFFLINE_SAVE';
const SAVE_VERSION = 70;
const INTERACT_DISTANCE = 150;

const PROPERTY_DEFS = [
  {
    id: 'galeria', name: 'GALERÍA PRIVADA', short: 'GALERÍA', price: 175000,
    logicalX: -1940, logicalZ: 2050, color: 0x263546, accent: 0x4196ff,
    description: 'Salón de ladrillo con el cuadro adjunto colocado en la pared.'
  },
  {
    id: 'villa_piscina', name: 'VILLA CON PISCINA', short: 'VILLA', price: 325000,
    logicalX: 1770, logicalZ: 3730, color: 0xe9e6dc, accent: 0x2db6e8,
    description: 'Residencia privada con piscina transitable.'
  },
  {
    id: 'residencia', name: 'RESIDENCIA MODERNA', short: 'RESIDENCIA', price: 260000,
    logicalX: 1800, logicalZ: -3730, color: 0x20242b, accent: 0x4a79ff,
    description: 'Casa moderna inspirada en el edificio arquitectónico adjunto.'
  }
];

let game = null;
let installed = false;
let propertyState = loadPropertyState();
let promptNode = null;
let noticeNode = null;
let modalNode = null;
let fileInput = null;
let nearest = null;
let lastFrame = performance.now();
let promptAccumulator = 0;
let animationAccumulator = 0;

function loadPropertyState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return saved && typeof saved === 'object' ? saved : {};
  } catch {
    return {};
  }
}

function savePropertyState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(propertyState)); } catch {}
}

function logicalToWorld(value) { return value * WORLD_SCALE; }

function groundAt(x, z, fallback = 0) {
  try {
    const y = game?.getGroundY?.(x, fallback + 900, z, false);
    return Number.isFinite(y) ? y : fallback;
  } catch {
    return fallback;
  }
}

function ensureUi() {
  if (!promptNode) {
    promptNode = document.createElement('div');
    promptNode.id = 'property-interaction-prompt';
    promptNode.style.cssText = [
      'position:fixed','left:50%','bottom:116px','transform:translateX(-50%)','z-index:9720',
      'padding:10px 15px','border-radius:9px','background:rgba(4,8,15,.94)',
      'border:1px solid #3487ff','color:#eaf3ff','font:900 12px Arial,sans-serif',
      'letter-spacing:.055em','pointer-events:none','display:none','box-shadow:0 10px 28px rgba(0,0,0,.48)'
    ].join(';');
    document.body.appendChild(promptNode);
  }

  if (!noticeNode) {
    noticeNode = document.createElement('div');
    noticeNode.id = 'property-system-notice';
    noticeNode.style.cssText = [
      'position:fixed','left:50%','top:20%','transform:translateX(-50%)','z-index:9902',
      'padding:12px 18px','border-radius:10px','background:rgba(4,8,15,.96)',
      'border:2px solid #3487ff','color:#fff','font:900 14px Arial,sans-serif',
      'letter-spacing:.055em','pointer-events:none','display:none','box-shadow:0 14px 38px rgba(0,0,0,.58)'
    ].join(';');
    document.body.appendChild(noticeNode);
  }

  if (!fileInput) {
    fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.vcsave,.json,application/json';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      fileInput.value = '';
      if (!file) return;
      try {
        const parsed = JSON.parse(await file.text());
        loadSaveObject(parsed);
      } catch (error) {
        console.error('[property-save] Archivo inválido.', error);
        notice('EL ARCHIVO NO ES UNA PARTIDA VÁLIDA', 3600);
      }
    });
    document.body.appendChild(fileInput);
  }

  // V75: Cargar partida ya no aparece como botón permanente.
  // Solo se abre desde AJUSTES mediante window.__PROPERTY_SYSTEM__.openLoadDialog().
}

function notice(text, duration = 2600) {
  ensureUi();
  noticeNode.textContent = text;
  noticeNode.style.display = 'block';
  clearTimeout(noticeNode.__hideTimer);
  noticeNode.__hideTimer = setTimeout(() => { noticeNode.style.display = 'none'; }, duration);
}

function makeCanvasLabel(title, subtitle, accent) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#08101b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 18;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 72px Arial';
  ctx.fillText(title, canvas.width / 2, 118);
  ctx.fillStyle = accent;
  ctx.font = '900 38px Arial';
  ctx.fillText(subtitle, canvas.width / 2, 205);
  ctx.fillStyle = '#c7d7ea';
  ctx.font = '700 24px Arial';
  ctx.fillText('DISQUETE = COMPRAR · GUARDAR · ENTRAR', canvas.width / 2, 255);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  return new THREE.MeshBasicMaterial({ map: texture, transparent: false });
}

function createFloppyDisk(accent = 0x3d82ff) {
  const group = new THREE.Group();
  group.name = 'DISQUETE_PROPIEDAD';
  const black = new THREE.MeshLambertMaterial({ color: 0x090d13 });
  const blue = new THREE.MeshLambertMaterial({ color: accent });
  const metal = new THREE.MeshLambertMaterial({ color: 0xb9c7d8 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(44, 52, 8), black);
  const label = new THREE.Mesh(new THREE.BoxGeometry(31, 18, 2), blue);
  label.position.set(0, 10, 5);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(26, 8, 2), metal);
  slot.position.set(0, -14, 5);
  const notch = new THREE.Mesh(new THREE.BoxGeometry(8, 12, 10), black);
  notch.position.set(15, 20, 1);
  group.add(body, label, slot, notch);
  group.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = false;
    object.receiveShadow = false;
  });
  return group;
}

function createExterior(property) {
  const root = new THREE.Group();
  root.name = `PROPIEDAD_${property.id.toUpperCase()}`;
  const width = property.id === 'villa_piscina' ? 330 : 270;
  const depth = property.id === 'villa_piscina' ? 230 : 190;
  const height = property.id === 'residencia' ? 190 : 145;
  const mat = new THREE.MeshLambertMaterial({ color: property.color });
  const trimMat = new THREE.MeshLambertMaterial({ color: property.accent });
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x82b7d5, transparent: true, opacity: .72 });

  const building = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat);
  building.position.y = height * .5;
  root.add(building);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(width + 14, 12, depth + 14), trimMat);
  roof.position.y = height + 5;
  root.add(roof);

  const door = new THREE.Mesh(new THREE.BoxGeometry(52, 86, 8), new THREE.MeshLambertMaterial({ color: 0x10151e }));
  door.position.set(0, 43, depth * .5 + 5);
  root.add(door);

  for (const x of [-width * .30, width * .30]) {
    const windowMesh = new THREE.Mesh(new THREE.BoxGeometry(54, 48, 5), glassMat);
    windowMesh.position.set(x, 82, depth * .5 + 7);
    root.add(windowMesh);
  }

  if (property.id === 'villa_piscina') {
    const pool = new THREE.Mesh(new THREE.BoxGeometry(150, 5, 90), new THREE.MeshLambertMaterial({ color: 0x1c8fc5, transparent: true, opacity: .78 }));
    pool.position.set(-230, 2, 15);
    root.add(pool);
    const patio = new THREE.Mesh(new THREE.BoxGeometry(220, 3, 150), new THREE.MeshLambertMaterial({ color: 0xdacbb5 }));
    patio.position.set(-230, .5, 15);
    root.add(patio);
  }

  if (property.id === 'residencia') {
    const upper = new THREE.Mesh(new THREE.BoxGeometry(width * .72, 85, depth * .70), trimMat);
    upper.position.set(35, height + 42, -12);
    root.add(upper);
  }

  const accentCss = `#${new THREE.Color(property.accent).getHexString()}`;
  const label = new THREE.Mesh(new THREE.PlaneGeometry(260, 76), makeCanvasLabel(property.short, `$${property.price.toLocaleString('es-PE')}`, accentCss));
  label.position.set(0, height + 68, depth * .5 + 10);
  root.add(label);

  const disk = createFloppyDisk(property.accent);
  disk.position.set(0, 95, depth * .5 + 35);
  root.add(disk);

  const x = logicalToWorld(property.logicalX);
  const z = logicalToWorld(property.logicalZ);
  const y = groundAt(x, z, 0);
  root.position.set(x, y, z);
  root._cx = x;
  root._cz = z;
  root.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = false;
    object.receiveShadow = false;
    object.frustumCulled = true;
  });
  game.city.add(root);

  property.root = root;
  property.disk = disk;
  property.door = new THREE.Vector3(x, y + 2, z + depth * .5 + 78);
  property.returnPoint = new THREE.Vector3(x, y + 2, z + depth * .5 + 108);
  property.owned = Boolean(propertyState[property.id]?.owned);
  updatePropertyAppearance(property);
}

function updatePropertyAppearance(property) {
  property.owned = Boolean(propertyState[property.id]?.owned);
  if (!property.disk) return;
  property.disk.traverse(object => {
    if (!object.isMesh || !object.material?.color) return;
    if (object.geometry?.parameters?.height === 18) object.material.color.setHex(property.owned ? 0x2ad67d : property.accent);
  });
}

function currentNavigationPosition() {
  return window.__CUSTOM_CAR_SYSTEM__?.active?.root?.position || game?.activeCar?.position || game?.playerContainer?.position;
}

function nearestProperty() {
  const player = currentNavigationPosition();
  if (!player) return null;
  let best = null;
  let bestSq = INTERACT_DISTANCE * INTERACT_DISTANCE;
  for (const property of PROPERTY_DEFS) {
    if (!property.door) continue;
    const distanceSq = property.door.distanceToSquared(player);
    if (distanceSq < bestSq) {
      best = property;
      bestSq = distanceSq;
    }
  }
  return best;
}

function closeModal() {
  modalNode?.remove();
  modalNode = null;
}

function createModal(property, owned) {
  closeModal();
  document.exitPointerLock?.();
  const overlay = document.createElement('div');
  overlay.id = 'property-menu-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:12000;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;padding:22px;font-family:Arial,sans-serif';
  const panel = document.createElement('div');
  panel.style.cssText = 'width:min(560px,94vw);background:#07101d;border:2px solid #438cff;border-radius:16px;padding:24px;color:white;box-shadow:0 28px 90px rgba(0,0,0,.75)';
  const title = document.createElement('h2');
  title.textContent = property.name;
  title.style.cssText = 'margin:0 0 8px;font-size:26px;letter-spacing:.06em';
  const description = document.createElement('p');
  description.textContent = property.description;
  description.style.cssText = 'margin:0 0 18px;color:#c8d8eb;line-height:1.45';
  panel.append(title, description);

  const buttonStyle = 'width:100%;margin-top:10px;padding:13px 14px;border-radius:9px;border:1px solid #438cff;background:#10213b;color:white;font:900 13px Arial;letter-spacing:.05em;cursor:pointer';
  const addButton = (label, handler, disabled = false) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.style.cssText = buttonStyle + (disabled ? ';opacity:.45;cursor:not-allowed' : '');
    button.disabled = disabled;
    button.addEventListener('click', handler);
    panel.appendChild(button);
  };

  if (!owned) {
    const money = Number(game?.money || 0);
    const info = document.createElement('div');
    info.textContent = `PRECIO: $${property.price.toLocaleString('es-PE')} · TU DINERO: $${money.toLocaleString('es-PE')}`;
    info.style.cssText = 'padding:11px;border-radius:8px;background:#0d1a2b;color:#8fc1ff;font-weight:900';
    panel.appendChild(info);
    addButton(`COMPRAR POR $${property.price.toLocaleString('es-PE')}`, () => purchaseProperty(property), money < property.price);
  } else {
    addButton('ENTRAR A LA PROPIEDAD', () => enterProperty(property));
    addButton('GUARDAR PARTIDA EN UN ARCHIVO', () => {
      downloadSave(property);
      closeModal();
    });
    addButton('CARGAR UNA PARTIDA DESDE MI COMPUTADORA', () => {
      closeModal();
      fileInput.click();
    });
  }
  addButton('CERRAR', closeModal);
  overlay.appendChild(panel);
  overlay.addEventListener('mousedown', event => { if (event.target === overlay) closeModal(); });
  document.body.appendChild(overlay);
  modalNode = overlay;
}

function purchaseProperty(property) {
  const money = Number(game?.money || 0);
  if (money < property.price) {
    notice('NO TIENES DINERO SUFICIENTE');
    return;
  }
  game.money = money - property.price;
  propertyState[property.id] = { owned: true, boughtAt: new Date().toISOString(), price: property.price };
  savePropertyState();
  updatePropertyAppearance(property);
  game.currentMessage = `PROPIEDAD COMPRADA: ${property.name}`;
  game.updateHUDState?.();
  closeModal();
  notice(`${property.name} COMPRADA · YA PUEDES ENTRAR Y GUARDAR` , 4200);
}

function exitVehicles() {
  try { window.__CUSTOM_CAR_SYSTEM__?.exit?.(); } catch {}
  try { window.__AIRCRAFT_SYSTEM__?.exit?.(); } catch {}
  try { window.__POLICE_RESPONSE__?.exitTank?.(); } catch {}
}

function citySnapshot(property) {
  const p = game?.playerContainer?.position || property.returnPoint;
  return {
    x: Number(p?.x || property.returnPoint.x),
    y: Number(p?.y || property.returnPoint.y),
    z: Number(p?.z || property.returnPoint.z),
    yaw: Number(game?.playerContainer?.rotation?.y || 0),
    health: Math.max(1, Number(game?.health || 100)),
    armor: Math.max(0, Number(game?.armor || 0)),
    money: Math.max(0, Number(game?.money || 0)),
    propertyId: property.id
  };
}

function enterProperty(property) {
  if (!property.owned) return;
  exitVehicles();
  const snapshot = citySnapshot(property);
  try {
    localStorage.setItem(PROPERTY_RETURN_KEY, JSON.stringify(snapshot));
    localStorage.setItem(CITY_RETURN_KEY, JSON.stringify(snapshot));
  } catch {}
  location.href = `./propiedad/index.html?id=${encodeURIComponent(property.id)}`;
}

function collectGameStorage() {
  const result = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith('vice_') || key.startsWith('vice-') || key.startsWith('game_of_crew')) result[key] = localStorage.getItem(key);
    }
  } catch {}
  return result;
}

function buildSaveObject(property) {
  return {
    format: SAVE_FORMAT,
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    slot: property.id,
    slotName: property.name,
    player: citySnapshot(property),
    runtime: {
      activeWeapon: window.__WEAPON_CRATES__?.selectedWeapon || game?.activeWeapon || 'fist',
      wantedLevel: Number(game?.crimeWorld?.wantedLevel || 0)
    },
    localStorage: collectGameStorage()
  };
}

function downloadSave(property) {
  const save = buildSaveObject(property);
  const json = JSON.stringify(save, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  anchor.href = url;
  anchor.download = `VICE_CITY_${property.id.toUpperCase()}_${stamp}.vcsave`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notice(`PARTIDA GUARDADA EN ARCHIVO · ${property.name}`, 4200);
}

function validateSaveObject(save) {
  if (!save || typeof save !== 'object') throw new Error('Objeto vacío');
  if (save.format !== SAVE_FORMAT) throw new Error('Formato incorrecto');
  if (!save.player || !Number.isFinite(Number(save.player.x)) || !Number.isFinite(Number(save.player.z))) throw new Error('Posición inválida');
  if (!save.localStorage || typeof save.localStorage !== 'object') throw new Error('Datos incompletos');
}

function loadSaveObject(save) {
  validateSaveObject(save);
  try {
    for (const [key, value] of Object.entries(save.localStorage)) {
      if (!(key.startsWith('vice_') || key.startsWith('vice-') || key.startsWith('game_of_crew'))) continue;
      if (typeof value === 'string') localStorage.setItem(key, value);
    }
    localStorage.setItem(PENDING_LOAD_KEY, JSON.stringify({
      player: save.player,
      runtime: save.runtime || {},
      loadedAt: Date.now()
    }));
  } catch (error) {
    throw new Error(`No se pudo preparar la partida: ${error.message}`);
  }
  notice('PARTIDA CARGADA · REINICIANDO GTA MANUCHO…', 1800);
  setTimeout(() => location.href = './index.html?noprogressive=1&loaded=1', 650);
}

function applyPendingLoadedSave() {
  let pending = null;
  try {
    pending = JSON.parse(localStorage.getItem(PENDING_LOAD_KEY) || 'null');
    localStorage.removeItem(PENDING_LOAD_KEY);
  } catch {}
  if (!pending?.player) return;
  const apply = () => {
    const state = pending.player;
    const x = Number(state.x);
    const z = Number(state.z);
    const y = groundAt(x, z, Number(state.y || 0)) + .4;
    if (!Number.isFinite(x) || !Number.isFinite(z)) return;
    exitVehicles();
    game.playerContainer.position.set(x, y, z);
    game.playerContainer.rotation.y = Number(state.yaw || 0);
    game.health = Math.max(1, Number(state.health || 100));
    game.armor = Math.max(0, Number(state.armor || 0));
    game.money = Math.max(0, Number(state.money || 0));
    if (game.crimeWorld && pending.runtime) game.crimeWorld.wantedLevel = Math.max(0, Math.min(5, Number(pending.runtime.wantedLevel || 0)));
    game.state.vy = 0;
    game.state.onGround = true;
    game.state.inWater = false;
    game.currentMessage = 'PARTIDA CARGADA CORRECTAMENTE';
    game.updateHUDState?.();
  };
  apply();
  setTimeout(apply, 500);
  setTimeout(apply, 1700);
  notice('PARTIDA RESTAURADA', 4200);
}

function updatePrompt() {
  nearest = nearestProperty();
  if (!nearest || modalNode) {
    promptNode.style.display = 'none';
    return;
  }
  if (nearest.owned) promptNode.textContent = `E · ${nearest.name} · ENTRAR / GUARDAR PARTIDA`;
  else promptNode.textContent = `E · COMPRAR ${nearest.name} · $${nearest.price.toLocaleString('es-PE')}`;
  promptNode.style.display = 'block';
}

function onKeyDown(event) {
  if (event.code === 'Escape' && modalNode) {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeModal();
    return;
  }
  if (event.code !== 'KeyE' || event.repeat || modalNode) return;
  const property = nearestProperty();
  if (!property) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  exitVehicles();
  createModal(property, property.owned);
}

function animate(now = performance.now()) {
  requestAnimationFrame(animate);
  if (document.hidden) {
    lastFrame = now;
    return;
  }
  const dt = Math.min(.08, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;
  promptAccumulator += dt;
  animationAccumulator += dt;
  if (promptAccumulator >= .18) {
    promptAccumulator = 0;
    updatePrompt();
  }
  if (animationAccumulator >= 1 / 20) {
    animationAccumulator = 0;
    const t = now * .001;
    for (let i = 0; i < PROPERTY_DEFS.length; i++) {
      const property = PROPERTY_DEFS[i];
      if (!property.disk) continue;
      property.disk.rotation.y = t * .85 + i;
      property.disk.position.y = 95 + Math.sin(t * 2 + i) * 7;
    }
  }
}

async function install() {
  if (installed) return;
  game = window.__VICE_CITY_GAME__;
  if (!game?.city || !game?.playerContainer) return;
  installed = true;
  ensureUi();
  for (const property of PROPERTY_DEFS) createExterior(property);
  window.addEventListener('keydown', onKeyDown, true);
  window.__PROPERTY_SYSTEM__ = {
    properties: PROPERTY_DEFS,
    openLoadDialog: () => fileInput.click(),
    downloadSave,
    loadSaveObject,
    isOwned: id => Boolean(propertyState[id]?.owned)
  };
  applyPendingLoadedSave();
  requestAnimationFrame(animate);
}

const wait = setInterval(() => {
  game = window.__VICE_CITY_GAME__ || game;
  if (!game?.city || !game?.playerContainer) return;
  clearInterval(wait);
  install().catch(error => console.error('[property-save-system]', error));
}, 120);

setTimeout(() => clearInterval(wait), 30000);
