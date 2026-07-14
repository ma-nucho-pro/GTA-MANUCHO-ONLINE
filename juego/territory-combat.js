/**
 * GTA MANUCHO V84 — código del proyecto.
 * Creado e integrado por Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * ARKEA AI / Manucho · conserva LICENSE, NOTICE.md y estos créditos al reutilizar.
 */
import * as THREE from './bosque/libs/three.module.js';
import { GLTFLoader } from './bosque/bike-runtime/loaders/GLTFLoader.js';
import { DRACOLoader } from './bosque/bike-runtime/loaders/DRACOLoader.js';
import { clone as cloneSkeleton } from './bosque/bike-runtime/utils/SkeletonUtils.js';
import { ColladaLoader } from './skin-assets/loaders/ColladaLoader.js';
import { MD2Loader } from './skin-assets/loaders/MD2Loader.js';

THREE.Cache.enabled = true;

const WORLD_SCALE = 16;
const UPDATE_STEP = 1 / 10;
const MAP_STEP = 1 / 15;
const MAX_RECRUITS = 4;
const RECRUIT_DISTANCE = 145;
const GANG_ALERT_DISTANCE = 760;
const GANG_FIRE_DISTANCE = 390;
const POLICE_FIRE_DISTANCE = 470;
const STORAGE_KEY = 'vice_city_v64_territories';
const WAYPOINT_STORAGE_KEY = 'vice_city_v66_waypoint';
const CITY_RETURN_STORAGE_KEY = 'vice_city_v67_game_of_crew_return';
const FULL_MAP_W = 1000;
const FULL_MAP_H = 760;
const RADAR_RANGE = 680;
const WORLD_BOUNDS = { xMin: -2600, xMax: 2300, zMin: -5400, zMax: 4300 };
const SAFE_SURFACES = [
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
const ROAD_SPECS = [
  [-2050,-5250,-2050,2650],[-1500,-5250,-1500,2700],[-900,-5200,-900,2700],
  [1050,-5250,1050,4150],[1500,-5250,1500,4150],[2020,-5250,2020,4150],
  [-2400,-4450,-520,-4450],[-2400,-2900,-520,-2900],[-2400,-900,-520,-900],[-2400,1100,-520,1100],
  [800,-4450,2250,-4450],[800,-2850,2250,-2850],[800,-800,2250,-800],[800,1200,2250,1200],[800,3350,2250,3350],
  [-980,-225,980,-225],[-320,-500,-320,1350],[320,-500,320,1350]
];

const FACTIONS = {
  orange: { name: 'LOS NARANJA', color: 0xff7800 },
  blue: { name: 'BANDA AZUL', color: 0x2474ff },
  green: { name: 'BANDA VERDE', color: 0x27b85a },
  purple: { name: 'BANDA MORADA', color: 0x9c4dcc },
  red: { name: 'BANDA ROJA', color: 0xe13e3e },
  police: { name: 'VCPD', color: 0x67b7ff },
  civilian: { name: 'CIVIL', color: 0xcfcfcf }
};

const TERRITORY_DEFS = [
  { id:'orange_home', owner:'orange', xMin:-2320,xMax:-1540,zMin:-5200,zMax:-4200 },
  { id:'blue_docks', owner:'blue', xMin:-2320,xMax:-1320,zMin:-3340,zMax:-2200 },
  { id:'green_south', owner:'green', xMin:920,xMax:2050,zMin:-5150,zMax:-4050 },
  { id:'purple_mid', owner:'purple', xMin:920,xMax:2050,zMin:-3320,zMax:-2200 },
  { id:'red_north', owner:'red', xMin:-2280,xMax:-1260,zMin:550,zMax:1700 }
];

const entities = [];
const gangs = [];
const ambientPolice = [];
const serviceVehicles = [];
const explosions = [];
const textureLoader = new THREE.TextureLoader();
const raycaster = new THREE.Raycaster();
const tempDir = new THREE.Vector3();
const tempVec = new THREE.Vector3();
const tempVec2 = new THREE.Vector3();
const tempBox = new THREE.Box3();
const keys = Object.create(null);

// V76 · iconos de mapa estilo clásico, relacionados con cada lugar y servicio.
const MAP_ICON_URLS = {
  hospital:'./ui-icons/map/hospital.svg', police:'./ui-icons/map/police.svg',
  crew:'./ui-icons/map/crew.svg', barber:'./ui-icons/map/barber.svg', gym:'./ui-icons/map/gym.svg',
  home:'./ui-icons/map/home.svg', heart:'./ui-icons/map/heart.svg', property:'./ui-icons/map/property.svg',
  rose:'./ui-icons/map/rose.svg', taxi:'./ui-icons/map/taxi.svg', ambulance:'./ui-icons/map/ambulance.svg',
  boat:'./ui-icons/map/boat.svg', island:'./ui-icons/map/island.svg',
  pickupHeart:'./ui-icons/map/pickup-heart.svg', aspirin:'./ui-icons/map/aspirin.svg',
  waypoint:'./ui-icons/map/waypoint.svg', player:'./ui-icons/map/player.svg'
};
const MAP_ICON_IMAGES = Object.create(null);
for (const [key, url] of Object.entries(MAP_ICON_URLS)) {
  const image = new Image();
  image.decoding = 'async';
  image.onload = () => { try { updateMap(); } catch {} };
  image.src = url;
  MAP_ICON_IMAGES[key] = image;
}
function drawMapIcon(ctx, key, x, y, size = 18, rotation = 0) {
  const image = MAP_ICON_IMAGES[key];
  if (!image?.complete || !image.naturalWidth) return false;
  ctx.save();
  ctx.translate(x, y);
  if (rotation) ctx.rotate(rotation);
  ctx.drawImage(image, -size / 2, -size / 2, size, size);
  ctx.restore();
  return true;
}
function svgMapIcon(key, size = 26) {
  return svgNode('image', { href:MAP_ICON_URLS[key], x:-size/2, y:-size/2, width:size, height:size, preserveAspectRatio:'xMidYMid meet' });
}

let game = null;
let installed = false;
let lastTime = performance.now();
let updateAccumulator = 0;
let mapAccumulator = 0;
let fullMapVisible = false;
let miniCanvas = null;
let fullMap = null;
let fullSvg = null;
let fullMapPanel = null;
let mapSvgRefs = null;
let baseMapUiDisabled = false;
let promptNode = null;
let noticeNode = null;
let currentInterior = null;
let hospital = null;
let station = null;
let ambulance = null;
let patchedWeapons = false;
let lastPlayerDamageAt = 0;
let transitionLock = false;
let territoryState = loadTerritoryState();
let assetTextures = null;
let actorTemplate = null;
let actorAnimations = [];
let actorTargetHeight = 64;
let policeActorTemplate = null;
let policeActorAnimations = [];
let gangGeometry = null;
let gangAnimations = [];
let waypoint = loadWaypoint();
let lockedPlayerPosition = null;
let serviceCarTemplate = null;
let ambulanceTemplate = null;
let operationTableTemplate = null;
let lastActiveServiceVehicle = null;
let crewBuilding = null;
let barberBuilding = null;
let gymBuilding = null;
let cityHairGroup = null;
let lastVehicleCollisionCheck = 0;
const recruitedGang = [];

const bodyGeo = new THREE.BoxGeometry(14, 27, 9);
const headGeo = new THREE.SphereGeometry(6.2, 8, 6);
const limbGeo = new THREE.BoxGeometry(5, 22, 5);
const serviceBodyGeo = new THREE.BoxGeometry(66, 25, 125);
const serviceCabGeo = new THREE.BoxGeometry(58, 23, 62);
const wheelGeo = new THREE.CylinderGeometry(10, 10, 7, 10);
const tracerMaterial = new THREE.LineBasicMaterial({ color: 0xffe184, transparent: true, opacity: .9 });
const explosionGeo = new THREE.SphereGeometry(1, 10, 8);
const explosionMaterial = new THREE.MeshBasicMaterial({ color: 0xff7b00, transparent: true, opacity: .9, depthWrite: false });

function loadTerritoryState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return saved && typeof saved === 'object' ? saved : {};
  } catch {
    return {};
  }
}

function saveTerritoryState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(territoryState)); } catch {}
}

function loadWaypoint() {
  try {
    const value = JSON.parse(localStorage.getItem(WAYPOINT_STORAGE_KEY) || 'null');
    if (value && Number.isFinite(value.x) && Number.isFinite(value.z)) return { x:value.x, z:value.z };
  } catch {}
  return null;
}

function saveWaypoint() {
  try {
    if (waypoint) localStorage.setItem(WAYPOINT_STORAGE_KEY, JSON.stringify(waypoint));
    else localStorage.removeItem(WAYPOINT_STORAGE_KEY);
  } catch {}
}

function idleTurn(timeout = 1200) {
  return new Promise(resolve => {
    if ('requestIdleCallback' in window) requestIdleCallback(() => resolve(), { timeout });
    else setTimeout(resolve, Math.min(timeout, 300));
  });
}

function logicalToWorld(value) { return value * WORLD_SCALE; }
function worldToLogical(value) { return value / WORLD_SCALE; }

function onSafeSurfaceWorld(x, z) {
  const lx = worldToLogical(x);
  const lz = worldToLogical(z);
  return SAFE_SURFACES.some(s => lx >= s.xMin && lx <= s.xMax && lz >= s.zMin && lz <= s.zMax);
}

function groundAt(x, z, fallback = 0) {
  try {
    const y = game?.getGroundY?.(x, fallback + 900, z, false);
    return Number.isFinite(y) ? y : fallback;
  } catch {
    return fallback;
  }
}

function navigationRoot() {
  const candidates = [
    window.__CUSTOM_CAR_SYSTEM__?.active?.root,
    game?.activeCar?.root || game?.activeCar,
    game?.activeBoat?.root || game?.activeBoat,
    window.__AIRCRAFT_SYSTEM__?.active?.root,
    window.__POLICE_RESPONSE__?.activeTank?.root,
    game?.playerContainer
  ];
  return candidates.find(object => object?.position && Number.isFinite(object.position.x) && Number.isFinite(object.position.z)) || game?.playerContainer || null;
}

function navigationPose() {
  const root = navigationRoot();
  const position = root?.position || game?.playerContainer?.position || new THREE.Vector3();
  const yaw = Number.isFinite(root?.rotation?.y) ? root.rotation.y : Number(game?.playerContainer?.rotation?.y || 0);
  return { root, position, yaw };
}

function svgNode(tag, attrs = {}) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}

function disableBaseMapUi() {
  if (baseMapUiDisabled || !game) return;
  baseMapUiDisabled = true;
  game.drawRadar = () => {};

  const hideLegacyMap = () => {
    // React puede volver a asignar el canvas original del radar. Se oculta de
    // nuevo en cada cambio del HUD para que nunca reaparezca ni parpadee.
    const baseCanvas = game?.miniCtx?.canvas;
    if (baseCanvas && baseCanvas !== miniCanvas) {
      const wrapper = baseCanvas.parentElement;
      const target = wrapper || baseCanvas;
      if (target.style.display !== 'none') target.style.setProperty('display', 'none', 'important');
      game.miniCtx = null;
    }
    for (const heading of document.querySelectorAll('h1')) {
      if (!/GTA MANUCHO METROPOLIS MAP/i.test(heading.textContent || '')) continue;
      const overlay = heading.closest('.fixed') || heading.parentElement?.parentElement;
      if (overlay && overlay !== fullMap && overlay.style.display !== 'none') {
        overlay.style.setProperty('display', 'none', 'important');
      }
    }
  };
  hideLegacyMap();
  new MutationObserver(hideLegacyMap).observe(document.body, {
    childList:true,
    subtree:true,
    attributes:true,
    attributeFilter:['class','style']
  });
}

function createMapButton(text, title) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = text;
  button.title = title;
  button.style.cssText = 'border:1px solid rgba(255,255,255,.28);background:rgba(8,18,27,.92);color:#fff;padding:9px 13px;border-radius:9px;font:800 12px Arial,sans-serif;letter-spacing:.04em;cursor:pointer;box-shadow:0 5px 16px rgba(0,0,0,.35)';
  return button;
}

function ensureUi() {
  if (!noticeNode) {
    noticeNode = document.createElement('div');
    noticeNode.style.cssText = 'position:fixed;left:50%;top:19%;transform:translateX(-50%);z-index:16000;padding:10px 16px;border-radius:10px;background:rgba(5,8,15,.91);border:1px solid rgba(255,130,30,.85);color:white;font:900 13px Arial,sans-serif;letter-spacing:.05em;display:none;pointer-events:none;box-shadow:0 12px 34px rgba(0,0,0,.55)';
    document.body.appendChild(noticeNode);
  }
  if (!promptNode) {
    promptNode = document.createElement('div');
    promptNode.style.cssText = 'position:fixed;left:50%;bottom:122px;transform:translateX(-50%);z-index:15000;padding:9px 14px;border-radius:9px;background:rgba(4,8,14,.92);border:1px solid #ff8a24;color:#fff4df;font:900 12px Arial,sans-serif;letter-spacing:.05em;display:none;pointer-events:none';
    document.body.appendChild(promptNode);
  }
  if (!miniCanvas) {
    miniCanvas = document.createElement('canvas');
    miniCanvas.width = 256;
    miniCanvas.height = 256;
    miniCanvas.setAttribute('aria-label', 'Radar sincronizado de GTA MANUCHO');
    miniCanvas.style.cssText = 'position:fixed;left:32px;bottom:32px;width:220px;height:220px;z-index:65;pointer-events:none;border:6px solid #050505;border-radius:50%;background:#09131a;box-shadow:0 8px 28px rgba(0,0,0,.9),inset 0 0 0 3px rgba(148,163,184,.35);opacity:1;display:block;transform:translateZ(0);backface-visibility:hidden';
    document.body.appendChild(miniCanvas);
  }
  if (!fullMap) {
    fullMap = document.createElement('div');
    fullMap.style.cssText = 'position:fixed;inset:0;z-index:17000;background:rgba(1,5,9,.95);backdrop-filter:blur(7px);display:none;align-items:center;justify-content:center;pointer-events:auto;padding:18px;box-sizing:border-box';

    fullMapPanel = document.createElement('div');
    fullMapPanel.style.cssText = 'position:relative;width:min(1180px,96vw);height:min(860px,93vh);overflow:hidden;border:2px solid rgba(255,132,30,.8);border-radius:18px;background:#061018;box-shadow:0 24px 90px rgba(0,0,0,.78);display:flex;flex-direction:column';

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;background:linear-gradient(180deg,rgba(20,39,49,.98),rgba(6,16,24,.96));border-bottom:1px solid rgba(255,255,255,.14);color:white;flex:0 0 auto';
    const title = document.createElement('div');
    title.innerHTML = '<div style="font:900 20px Arial,sans-serif;letter-spacing:.08em">MAPA SATELITAL SVG · GTA MANUCHO</div><div style="font:700 11px Arial,sans-serif;color:#9ddcff;margin-top:3px">Haz clic en cualquier punto para marcar el destino. TAB cierra el mapa.</div>';
    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:8px;align-items:center';
    const clearButton = createMapButton('BORRAR DESTINO', 'Eliminar el punto marcado');
    clearButton.addEventListener('click', event => {
      event.stopPropagation();
      waypoint = null;
      saveWaypoint();
      updateMap();
      notice('DESTINO ELIMINADO');
    });
    const closeButton = createMapButton('CERRAR ×', 'Cerrar el mapa');
    closeButton.addEventListener('click', event => { event.stopPropagation(); setFullMapVisible(false); });
    actions.append(clearButton, closeButton);
    header.append(title, actions);

    const svgWrap = document.createElement('div');
    svgWrap.style.cssText = 'position:relative;flex:1;min-height:0;background:#07131b;overflow:hidden';
    fullSvg = svgNode('svg', { viewBox:`0 0 ${FULL_MAP_W} ${FULL_MAP_H}`, preserveAspectRatio:'xMidYMid meet' });
    fullSvg.style.cssText = 'width:100%;height:100%;display:block;cursor:crosshair;touch-action:none;user-select:none';
    const placeWaypointFromPointer = event => {
      if (event.button != null && event.button !== 0) return;
      if (event.target?.closest?.('button')) return;
      const now = performance.now();
      if (now - Number(fullSvg.__lastWaypointAt || 0) < 180) return;
      const ctm = fullSvg.getScreenCTM();
      if (!ctm) return;
      const point = fullSvg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const local = point.matrixTransform(ctm.inverse());
      const [lx, lz] = mapToLogical(local.x, local.y, FULL_MAP_W, FULL_MAP_H);
      waypoint = { x:logicalToWorld(lx), z:logicalToWorld(lz) };
      window.__VICE_LAST_WAYPOINT__ = waypoint;
      fullSvg.__lastWaypointAt = now;
      saveWaypoint();
      updateFullMapSvg();
      drawRadar(miniCanvas);
      const player = navigationPose().position;
      const distance = player ? Math.round(Math.hypot(waypoint.x-player.x, waypoint.z-player.z) / WORLD_SCALE) : 0;
      notice(`DESTINO MARCADO · ${distance} m`);
      event.preventDefault();
      event.stopPropagation();
    };
    fullSvg.addEventListener('pointerup', placeWaypointFromPointer, { passive:false });
    fullSvg.addEventListener('click', placeWaypointFromPointer, { passive:false });
    fullSvg.addEventListener('contextmenu', event => {
      event.preventDefault();
      waypoint = null;
      saveWaypoint();
      updateMap();
      notice('DESTINO ELIMINADO');
    });
    svgWrap.appendChild(fullSvg);
    fullMapPanel.append(header, svgWrap);
    fullMap.appendChild(fullMapPanel);
    document.body.appendChild(fullMap);
    buildSatelliteSvg();
  }
  disableBaseMapUi();
}

function notice(text, duration = 2400) {
  ensureUi();
  noticeNode.textContent = text;
  noticeNode.style.display = 'block';
  clearTimeout(noticeNode.__timer);
  noticeNode.__timer = setTimeout(() => { noticeNode.style.display = 'none'; }, duration);
}

function setPrompt(text) {
  ensureUi();
  if (!text) {
    promptNode.style.display = 'none';
    return;
  }
  promptNode.textContent = text;
  promptNode.style.display = 'block';
}

function makeLabel(text, color, width = 230) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(4,7,12,.86)';
  ctx.fillRect(8, 8, 496, 112);
  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 112);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 46px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 65);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.scale.set(width, width * .25, 1);
  return sprite;
}

async function loadTextures() {
  const police = textureLoader.load('./skin-assets/police/Stormtrooper_D.jpg');
  const blue = textureLoader.load('./skin-assets/bandas/skins/ctf_b.png');
  const red = textureLoader.load('./skin-assets/bandas/skins/ctf_r.png');
  const green = textureLoader.load('./skin-assets/bandas/skins/darkam.png');
  const purple = textureLoader.load('./skin-assets/bandas/skins/gordogh.png');
  const orange = textureLoader.load('./skin-assets/bandas/skins/khorne.png');
  for (const texture of [police, blue, red, green, purple, orange]) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.anisotropy = 2;
  }
  assetTextures = { police, blue, red, green, purple, orange };
  return assetTextures;
}

function factionTexture(faction) {
  if (!assetTextures) return null;
  return assetTextures[faction] || assetTextures.red;
}

function playerVisualHeight() {
  const visual = game?.playerModel || game?.playerContainer;
  if (!visual) return 64;
  try {
    visual.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(visual);
    const height = box.max.y - box.min.y;
    if (Number.isFinite(height) && height > 20 && height < 240) return THREE.MathUtils.clamp(height, 54, 82);
  } catch {}
  return 64;
}

async function loadActorTemplate() {
  const tasks = [];

  tasks.push((async () => {
    try {
      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync('./models/gltf/Soldier.glb');
      actorTemplate = gltf.scene;
      actorAnimations = gltf.animations || [];
      actorTemplate.traverse(object => {
        if (!object.isMesh && !object.isSkinnedMesh) return;
        object.castShadow = false;
        object.receiveShadow = false;
        object.frustumCulled = true;
      });
    } catch (error) {
      console.warn('[territory-combat] No se pudo cargar el modelo de respaldo.', error);
    }
  })());

  tasks.push((async () => {
    try {
      const collada = await new ColladaLoader().loadAsync('./skin-assets/police/stormtrooper.dae');
      policeActorTemplate = collada.scene;
      policeActorAnimations = collada.animations || collada.scene?.animations || [];
      policeActorTemplate.traverse(object => {
        if (!object.isMesh && !object.isSkinnedMesh) return;
        object.castShadow = false;
        object.receiveShadow = false;
        object.frustumCulled = true;
      });
    } catch (error) {
      console.warn('[territory-combat] No se pudo cargar la skin de policía adjunta.', error);
    }
  })());

  tasks.push((async () => {
    try {
      gangGeometry = await new MD2Loader().loadAsync('./skin-assets/bandas/ogro.md2');
      gangAnimations = gangGeometry.animations || [];
      gangGeometry.computeBoundingBox();
      gangGeometry.computeBoundingSphere();
    } catch (error) {
      console.warn('[territory-combat] No se pudo cargar la skin MD2 de bandas adjunta.', error);
    }
  })());

  await Promise.allSettled(tasks);
}

function normalizeVisualHeight(visual, targetHeight, orientation = null) {
  visual.position.set(0, 0, 0);
  visual.rotation.set(
    orientation?.x ?? 0,
    orientation?.y ?? 0,
    orientation?.z ?? 0
  );
  visual.scale.set(1, 1, 1);
  visual.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(visual);
  const height = Math.max(.001, box.max.y - box.min.y);
  visual.scale.setScalar(targetHeight / height);
  visual.updateMatrixWorld(true);
  const scaledBox = new THREE.Box3().setFromObject(visual);
  const center = scaledBox.getCenter(new THREE.Vector3());
  visual.position.x -= center.x;
  visual.position.z -= center.z;
  visual.position.y -= scaledBox.min.y;
  visual.updateMatrixWorld(true);
}

function normalizeExistingRootHeight(root, targetHeight = actorTargetHeight) {
  if (!root || root.userData?.v65HeightNormalized) return;
  try {
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const height = box.max.y - box.min.y;
    if (!Number.isFinite(height) || height < 8 || height > 400) return;
    const factor = THREE.MathUtils.clamp(targetHeight / height, .55, 1.8);
    root.scale.multiplyScalar(factor);
    root.userData.v65HeightNormalized = true;
  } catch {}
}

function recolorActor(root, faction) {
  if (!root) return;
  if (root.userData?.v66PoliceSkin) return;
  const texture = factionTexture(faction);
  const tint = FACTIONS[faction]?.color || 0xffffff;
  const exactBandSkin = Boolean(root.userData?.v66BandSkin);
  root.traverse(object => {
    if (!object.isMesh && !object.isSkinnedMesh) return;
    const source = Array.isArray(object.material) ? object.material : [object.material];
    const mapped = source.map(material => {
      if (!material) return material;
      const copy = material.clone();
      copy.map = texture || copy.map;
      copy.color?.setHex(exactBandSkin ? 0xffffff : (faction === 'police' ? 0xffffff : tint));
      copy.roughness = .9;
      copy.metalness = 0;
      copy.needsUpdate = true;
      return copy;
    });
    object.material = Array.isArray(object.material) ? mapped : mapped[0];
  });
}

function findClip(clips, names) {
  for (const name of names) {
    const exact = clips.find(clip => String(clip.name || '').toLowerCase() === name);
    if (exact) return exact;
  }
  for (const name of names) {
    const partial = clips.find(clip => String(clip.name || '').toLowerCase().startsWith(name));
    if (partial) return partial;
  }
  return null;
}

function buildActorActions(visual, clips = actorAnimations, kind = 'fallback') {
  if (!clips?.length) return { mixer:null, actions:{}, animationKind:kind };
  const mixer = new THREE.AnimationMixer(visual);
  const actions = {};
  const idleClip = findClip(clips, ['stand', 'idle', 'cstand']);
  const walkClip = findClip(clips, ['walk', 'cwalk', 'run']);
  const runClip = findClip(clips, ['run', 'walk']);
  const attackClip = findClip(clips, ['attack', 'crattack', 'pain']);

  if (idleClip) actions.idle = mixer.clipAction(idleClip);
  if (walkClip) actions.walk = mixer.clipAction(walkClip);
  if (runClip) actions.run = mixer.clipAction(runClip);
  if (attackClip) actions.attack = mixer.clipAction(attackClip);

  if (kind === 'police' && !actions.walk && clips[0]) {
    const idle = new THREE.AnimationClip('v66-police-idle', .1, []);
    const walk = clips[0].clone(); walk.name = 'v66-police-walk';
    const run = clips[0].clone(); run.name = 'v66-police-run';
    const attack = clips[0].clone(); attack.name = 'v66-police-attack';
    actions.idle = mixer.clipAction(idle);
    actions.walk = mixer.clipAction(walk);
    actions.run = mixer.clipAction(run);
    actions.attack = mixer.clipAction(attack);
    actions.walk.timeScale = .52;
    actions.run.timeScale = .82;
    actions.attack.timeScale = 1.18;
  }
  if (kind === 'gang') {
    if (actions.walk) actions.walk.timeScale = .82;
    if (actions.run) actions.run.timeScale = 1.12;
    if (actions.attack) actions.attack.timeScale = 1.18;
  }
  actions.idle?.play();
  return { mixer, actions, animationKind:kind };
}

function makeMaterial(color, texture = null) {
  return new THREE.MeshLambertMaterial({ color, map: texture, roughness: 1 });
}

// Algunos archivos Collada declaran Z_UP aunque la geometría ya venga orientada.
// En vez de asumir un giro fijo, se prueban las orientaciones razonables y se
// conserva la que deja la mayor dimensión del personaje en el eje vertical.
function choosePoliceUprightOrientation(visual) {
  // V85: se prueban las orientaciones razonables y se conserva la que deja al
  // personaje de pie (mayor extensión en Y frente a X/Z). Esto corrige a los
  // policías que aparecían acostados y gigantes cuando el Collada llega Z_UP.
  const candidates = [
    { x:0, y:Math.PI, z:0 },
    { x:-Math.PI/2, y:0, z:Math.PI },
    { x:Math.PI/2, y:Math.PI, z:0 },
    { x:-Math.PI/2, y:Math.PI, z:0 }
  ];
  let best = candidates[0];
  let bestScore = -Infinity;
  const box = new THREE.Box3();
  const size = new THREE.Vector3();
  for (const candidate of candidates) {
    visual.position.set(0, 0, 0);
    visual.rotation.set(candidate.x, candidate.y, candidate.z);
    visual.scale.set(1, 1, 1);
    visual.updateMatrixWorld(true);
    box.setFromObject(visual);
    box.getSize(size);
    const footprint = Math.max(0.001, Math.max(size.x, size.z));
    const score = size.y / footprint;
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return { x:best.x, y:best.y, z:best.z, score:bestScore };
}

function makeHumanoid(faction, material, labelText = null) {
  const root = new THREE.Group();
  root.name = `V66_${faction.toUpperCase()}_${entities.length}`;
  root.userData.isCombatRoot = true;
  root._isAlwaysVisible = false;
  let limbs = {};
  let model = null;
  let mixer = null;
  let actions = {};

  let animationKind = 'fallback';
  if (faction === 'police' && policeActorTemplate) {
    model = cloneSkeleton(policeActorTemplate);
    model.userData.v66PoliceSkin = true;
    const upright = choosePoliceUprightOrientation(model);
    normalizeVisualHeight(model, actorTargetHeight, upright);
    model.userData.v74PoliceBaseRotation = { x:upright.x, y:upright.y, z:upright.z };
    root.add(model);
    const findBone = (...names) => names.map(name => model.getObjectByName(name)).find(Boolean) || null;
    limbs = {
      armL: findBone('mixamorig_LeftArm','LeftArm'),
      armR: findBone('mixamorig_RightArm','RightArm'),
      legL: findBone('mixamorig_LeftUpLeg','LeftUpLeg'),
      legR: findBone('mixamorig_RightUpLeg','RightUpLeg')
    };
    // Se usa una marcha procedural estable en lugar de la animación de baile del
    // ejemplo Collada. Así los agentes caminan erguidos y no adoptan poses extrañas.
    mixer = null;
    actions = {};
    animationKind = 'police-procedural';
  } else if (faction !== 'police' && gangGeometry) {
    const bandMaterial = new THREE.MeshLambertMaterial({ map:factionTexture(faction), color:0xffffff });
    model = new THREE.Mesh(gangGeometry, bandMaterial);
    model.userData.v66BandSkin = true;
    model.rotation.y = Math.PI;
    normalizeVisualHeight(model, actorTargetHeight);
    root.add(model);
    const controller = buildActorActions(model, gangAnimations, 'gang');
    mixer = controller.mixer;
    actions = controller.actions;
    animationKind = controller.animationKind;
  } else if (actorTemplate) {
    model = cloneSkeleton(actorTemplate);
    recolorActor(model, faction);
    normalizeVisualHeight(model, actorTargetHeight);
    root.add(model);
    const controller = buildActorActions(model, actorAnimations, 'fallback');
    mixer = controller.mixer;
    actions = controller.actions;
    animationKind = controller.animationKind;
  } else {
    const torso = new THREE.Mesh(bodyGeo, material);
    torso.position.y = 36;
    const head = new THREE.Mesh(headGeo, material);
    head.position.y = 56;
    const armL = new THREE.Mesh(limbGeo, material);
    const armR = new THREE.Mesh(limbGeo, material);
    armL.position.set(-10, 36, 0);
    armR.position.set(10, 36, 0);
    const legL = new THREE.Mesh(limbGeo, material);
    const legR = new THREE.Mesh(limbGeo, material);
    legL.position.set(-4, 12, 0);
    legR.position.set(4, 12, 0);
    root.add(torso, head, armL, armR, legL, legR);
    limbs = { armL, armR, legL, legR };
  }

  const weapon = new THREE.Group();
  const gunBody = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.2, 19), new THREE.MeshLambertMaterial({ color:0x24282d }));
  const grip = new THREE.Mesh(new THREE.BoxGeometry(2.8, 8, 3.2), gunBody.material);
  gunBody.position.set(8, actorTargetHeight * .58, 8);
  grip.position.set(8, actorTargetHeight * .53, 4);
  grip.rotation.x = -.3;
  weapon.add(gunBody, grip);
  root.add(weapon);

  // V66: sin carteles flotantes sobre policías ni bandas.
  root.traverse(object => {
    if (!object.isMesh && !object.isSkinnedMesh) return;
    object.castShadow = false;
    object.receiveShadow = false;
    object.frustumCulled = true;
  });
  return { root, limbs, model, mixer, actions, weapon, animationKind };
}

function registerEntity(entity) {
  entity.root.userData.entityRef = entity;
  entity.root.traverse(object => { object.userData.entityRef = entity; });
  entities.push(entity);
  return entity;
}

function randomPointInTerritory(territory, margin = 70) {
  const lx = THREE.MathUtils.lerp(territory.xMin + margin, territory.xMax - margin, Math.random());
  const lz = THREE.MathUtils.lerp(territory.zMin + margin, territory.zMax - margin, Math.random());
  const x = logicalToWorld(lx);
  const z = logicalToWorld(lz);
  return new THREE.Vector3(x, groundAt(x, z, 0), z);
}

function territoryOwner(def) {
  return territoryState[def.id] || def.owner;
}

function territoryContainsWorld(def, position, padding = 0) {
  if (!def || !position) return false;
  const lx = worldToLogical(position.x);
  const lz = worldToLogical(position.z);
  return lx >= def.xMin - padding && lx <= def.xMax + padding && lz >= def.zMin - padding && lz <= def.zMax + padding;
}

function setEntityFactionAppearance(entity, faction) {
  if (!entity?.root) return;
  entity.faction = faction;
  if (entity.material?.color) entity.material.color.setHex(FACTIONS[faction]?.color || 0xffffff);
  recolorActor(entity.model || entity.root, faction);
  const label = entity.root.userData?.label;
  if (label) {
    const replacement = makeLabel(FACTIONS[faction]?.name || faction, `#${new THREE.Color(FACTIONS[faction]?.color || 0xffffff).getHexString()}`, 120);
    replacement.position.copy(label.position);
    label.parent?.remove(label);
    entity.root.add(replacement);
    entity.root.userData.label = replacement;
  }
}

function nearestRecruitableOrange() {
  const player = game?.playerContainer?.position;
  if (!player) return null;
  let best = null;
  let bestSq = RECRUIT_DISTANCE * RECRUIT_DISTANCE;
  for (const member of gangs) {
    if (member.dead || member.faction !== 'orange' || member.recruited || !member.root.visible) continue;
    const distanceSq = member.root.position.distanceToSquared(player);
    if (distanceSq < bestSq) { best = member; bestSq = distanceSq; }
  }
  return best;
}

function recruitNearbyOrange() {
  const member = nearestRecruitableOrange();
  if (!member) {
    notice('ACÉRCATE A UN MIEMBRO DE LOS NARANJA');
    return;
  }
  if (recruitedGang.length >= MAX_RECRUITS) {
    notice(`YA TIENES ${MAX_RECRUITS} ALIADOS RECLUTADOS`);
    return;
  }
  member.recruited = true;
  member.state = 'follow';
  member.target = null;
  recruitedGang.push(member);
  notice(`ALIADO RECLUTADO · ${recruitedGang.length}/${MAX_RECRUITS}`);
}

function removeRecruit(member) {
  if (!member) return;
  member.recruited = false;
  const index = recruitedGang.indexOf(member);
  if (index >= 0) recruitedGang.splice(index, 1);
}

function createTerritoryMarker(def) {
  // V66: los territorios se muestran solamente en el radar y en el mapa TAB.
  // No se crean carteles, nombres ni rectángulos flotantes dentro del mundo 3D.
  def.marker = null;
  def.label = null;
  def.currentOwner = territoryOwner(def);
}

function updateTerritoryMarker(def) {
  def.currentOwner = territoryOwner(def);
  updateMap();
}

function spawnGangMember(def, index, textures, forceFaction = null) {
  const faction = forceFaction || territoryOwner(def);
  const texture = faction === 'blue' ? textures.blue : textures.red;
  const material = makeMaterial(FACTIONS[faction].color, texture);
  const visual = makeHumanoid(faction, material, null);
  const position = randomPointInTerritory(def, 95);
  visual.root.position.set(position.x, position.y, position.z);
  game.city.add(visual.root);
  const entity = registerEntity({
    type: 'gang', faction, territory: def, root: visual.root, limbs: visual.limbs,
    health: 100, maxHealth: 100, dead: false, state: 'patrol', target: randomPointInTerritory(def),
    speed: 78 + Math.random() * 18, nextAttack: 0, phase: index * .9 + Math.random() * 4,
    material, originalSpeed: 78 + Math.random() * 18,
    mixer: visual.mixer, actions: visual.actions, model: visual.model, animationKind:visual.animationKind, currentActionName: 'idle', recruited:false
  });
  gangs.push(entity);
  return entity;
}

function spawnAmbientPolice(index, textures) {
  const material = makeMaterial(0xffffff, textures.police);
  const visual = makeHumanoid('police', material, null);
  const patrolTerritories = [TERRITORY_DEFS[0], TERRITORY_DEFS[1], TERRITORY_DEFS[3]];
  const territory = patrolTerritories[index % patrolTerritories.length];
  const position = randomPointInTerritory(territory, 110);
  visual.root.position.copy(position);
  game.city.add(visual.root);
  const entity = registerEntity({
    type: 'police', faction:'police', root:visual.root, limbs:visual.limbs,
    health:120, maxHealth:120, dead:false, state:'patrol', patrolTerritory:territory,
    target:randomPointInTerritory(territory), speed:86, nextAttack:0, phase:index*.6,
    material, mixer:visual.mixer, actions:visual.actions, model:visual.model, animationKind:visual.animationKind, currentActionName:'idle'
  });
  ambientPolice.push(entity);
  return entity;
}

function setActorAction(entity, desired) {
  if (!entity.actions || !entity.mixer) return false;
  if (entity.animationKind === 'police' && desired === 'idle') {
    if (entity.currentAction) {
      entity.currentAction.paused = true;
      entity.currentAction.time = 0;
    }
    entity.currentActionName = 'idle';
    return true;
  }
  const fallback = desired === 'run' ? (entity.actions.run || entity.actions.walk || entity.actions.idle) :
    desired === 'walk' ? (entity.actions.walk || entity.actions.run || entity.actions.idle) :
    desired === 'attack' ? (entity.actions.attack || entity.actions.run || entity.actions.walk || entity.actions.idle) :
    (entity.actions.idle || entity.actions.walk || entity.actions.run);
  if (!fallback) return false;
  if (entity.currentAction === fallback) {
    fallback.paused = false;
    return true;
  }
  entity.currentAction?.fadeOut?.(.16);
  fallback.paused = false;
  fallback.reset().fadeIn(.16).play();
  entity.currentAction = fallback;
  entity.currentActionName = desired;
  return true;
}

function applyWalkAnimation(entity, elapsed, moving) {
  if (entity.faction === 'police' && entity.model?.userData?.v66PoliceSkin) {
    const base = entity.model.userData.v74PoliceBaseRotation || { x:0, y:Math.PI, z:0 };
    // V85: se restablece la rotación base COMPLETA (x, y, z). Antes se forzaba
    // x=0 y z=0 y los agentes con orientación Z_UP quedaban acostados.
    entity.model.rotation.set(base.x || 0, base.y || 0, base.z || 0);
    entity.model.updateMatrixWorld?.(false);
  }
  const fast = entity.state === 'chase' || entity.state === 'attack' || entity.state === 'follow' || entity.state === 'defend';
  if (setActorAction(entity, moving ? (fast ? 'run' : 'walk') : 'idle')) return;
  if (!entity.limbs?.armL) return;
  if (!entity.limbBase) {
    entity.limbBase = {};
    for (const [name, limb] of Object.entries(entity.limbs)) {
      if (limb?.rotation) entity.limbBase[name] = { x:limb.rotation.x, y:limb.rotation.y, z:limb.rotation.z };
    }
  }
  const pace = fast ? 9.2 : 6.8;
  const amount = moving ? (fast ? .62 : .42) : 0;
  const swing = Math.sin(elapsed * pace + entity.phase) * amount;
  const setLimb = (name, offset) => {
    const limb = entity.limbs[name], base = entity.limbBase[name];
    if (!limb?.rotation || !base) return;
    limb.rotation.x = base.x + offset;
    limb.rotation.y = base.y;
    limb.rotation.z = base.z;
  };
  setLimb('armL', swing);
  setLimb('armR', -swing);
  setLimb('legL', -swing);
  setLimb('legR', swing);
  if (entity.model) {
    if (!Number.isFinite(entity.modelBaseY)) entity.modelBaseY = entity.model.position.y;
    entity.model.position.y = entity.modelBaseY + (moving ? Math.abs(Math.sin(elapsed * pace + entity.phase)) * .55 : 0);
  }
}

function moveToward(entity, target, speed, dt) {
  tempVec.subVectors(target, entity.root.position);
  tempVec.y = 0;
  const distance = tempVec.length();
  if (distance < 1) return false;
  tempVec.divideScalar(distance);
  const nextX = entity.root.position.x + tempVec.x * Math.min(distance, speed * dt);
  const nextZ = entity.root.position.z + tempVec.z * Math.min(distance, speed * dt);
  const safeSurface = onSafeSurfaceWorld(nextX, nextZ);
  const policeFollowingIntoSea = entity.faction === 'police' && Boolean(game?.state?.inWater) && (entity.state === 'chase' || entity.state === 'attack');
  if (!safeSurface && !policeFollowingIntoSea) return false;
  entity.root.position.x = nextX;
  entity.root.position.z = nextZ;
  entity.root._cx = nextX; entity.root._cz = nextZ;
  if (safeSurface) entity.root.position.y = groundAt(nextX, nextZ, entity.root.position.y) + .1;
  else entity.root.position.y -= Math.max(5, speed * dt * .12);
  const yaw = Math.atan2(tempVec.x, tempVec.z);
  const delta = Math.atan2(Math.sin(yaw - entity.root.rotation.y), Math.cos(yaw - entity.root.rotation.y));
  entity.root.rotation.y += delta * Math.min(1, dt * 7);
  return true;
}

function wantedLevel() {
  const world = game?.crimeWorld;
  if (!world) return Number(game?.wantedLevel || 0);
  try { return Math.max(0, Math.min(5, Number(world.getWantedLevel?.() ?? world.wantedLevel ?? 0))); }
  catch { return 0; }
}

function setWanted(level, message = null) {
  const next = Math.max(0, Math.min(5, Math.round(level)));
  const world = game?.crimeWorld;
  if (world) {
    world.wantedLevel = next;
    world.wantedAge = 0;
    if (next > 0) world.activatePolice?.();
  }
  game.wantedLevel = next;
  if (message) game.currentMessage = message;
  game.updateHUDState?.();
}

function addWanted(amount = 1, message = 'DELITO REPORTADO') {
  const world = game?.crimeWorld;
  if (world?.reportCrime) {
    try { world.reportCrime(amount, message); return; } catch {}
  }
  setWanted(wantedLevel() + amount, `${message} · ${Math.min(5, wantedLevel() + amount)} ESTRELLAS`);
}

function drawTracer(from, to, color = 0xffe184) {
  const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
  const material = tracerMaterial.clone();
  material.color.setHex(color);
  const line = new THREE.Line(geometry, material);
  game.scene.add(line);
  setTimeout(() => {
    line.parent?.remove(line);
    geometry.dispose();
    material.dispose();
  }, 90);
}

function damagePlayer(amount, source = 'ATAQUE') {
  const now = performance.now();
  // V71: el jugador dispone de más resistencia y no recibe daño repetido en cada
  // fotograma cuando queda junto a un coche, una bala o un agente.
  if (now - lastPlayerDamageAt < 360) return;
  lastPlayerDamageAt = now;
  let damage = Math.max(.35, Number(amount || 0) * .64);
  if (game.armor > 0) {
    const blocked = Math.min(game.armor, damage);
    game.armor -= blocked;
    damage -= blocked;
  }
  game.health = Math.max(0, Number(game.health || 150) - damage);
  const message = String(source || 'ATAQUE');
  if (message.includes('ATROPELL') && performance.now() < Number(game.playerContainer?.userData?.v74VehicleExitGraceUntil || 0)) return;
  game.currentMessage = message;
  game.updateHUDState?.();
  clearTimeout(damagePlayer._messageTimer);
  damagePlayer._messageTimer = setTimeout(() => {
    if (game.currentMessage === message) {
      game.currentMessage = undefined;
      game.updateHUDState?.();
    }
  }, message.includes('ATROPELL') ? 650 : 900);
  if (game.health <= 0) hospitalize(source);
}

function createExplosion(position, scale = 1) {
  const mesh = new THREE.Mesh(explosionGeo, explosionMaterial.clone());
  mesh.position.copy(position);
  mesh.scale.setScalar(10 * scale);
  mesh.renderOrder = 999;
  game.scene.add(mesh);
  explosions.push({ mesh, age:0, duration:.65, maxScale:95 * scale });
}

function exitCurrentVehicle() {
  try { window.__CUSTOM_CAR_SYSTEM__?.exit?.(); } catch {}
  try { window.__AIRCRAFT_SYSTEM__?.exit?.(); } catch {}
  try { window.__POLICE_RESPONSE__?.exitTank?.(); } catch {}
  if (game.activeCar) game.activeCar = null;
  if (game.activeBoat) game.activeBoat = null;
  if (game.playerModel) game.playerModel.visible = true;
}

function clearWanted() {
  const world = game?.crimeWorld;
  if (world) {
    world.wantedLevel = 0;
    world.wantedAge = 0;
    for (const officer of world.policeAgents || []) {
      officer.root.visible = false;
      officer.state = 'idle';
    }
  }
  game.wantedLevel = 0;
}

function hospitalize(reason = 'HAS SIDO HERIDO') {
  if (transitionLock || !hospital) return;
  transitionLock = true;
  exitCurrentVehicle();
  clearWanted();
  const fine = 800;
  game.money = Math.max(0, Number(game.money || 0) - fine);
  game.health = 150;
  game.armor = 0;
  lockedPlayerPosition = null;
  currentInterior = null;
  if (hospital?.roof) hospital.roof.visible = true;
  if (station?.roof) station.roof.visible = true;
  game.playerContainer.position.copy(hospital.respawn);
  game.state.vy = 0;
  game.state.onGround = true;
  game.state.inWater = false;
  game.currentMessage = `${reason} · HOSPITAL $${fine}`;
  game.updateHUDState?.();
  setTimeout(() => {
    transitionLock = false;
    if (game.currentMessage?.includes('HOSPITAL')) {
      game.currentMessage = undefined;
      game.updateHUDState?.();
    }
  }, 2200);
}

function arrestPlayer(reason = 'ARRESTADO POR VCPD') {
  if (transitionLock || !station) return;
  transitionLock = true;
  exitCurrentVehicle();
  clearWanted();
  const fine = 500;
  game.money = Math.max(0, Number(game.money || 0) - fine);
  game.health = Math.max(110, Number(game.health || 0));
  game.playerContainer.position.copy(station.cell);
  lockedPlayerPosition = station.cell.clone();
  currentInterior = 'station';
  if (station.roof) station.roof.visible = false;
  game.currentMessage = `${reason} · MULTA $${fine}`;
  game.updateHUDState?.();
  setTimeout(() => {
    game.playerContainer.position.copy(station.respawn);
    lockedPlayerPosition = null;
    currentInterior = null;
    if (station.roof) station.roof.visible = true;
    transitionLock = false;
    game.currentMessage = 'LIBERADO DE LA COMISARÍA';
    game.updateHUDState?.();
    setTimeout(() => {
      if (game.currentMessage === 'LIBERADO DE LA COMISARÍA') {
        game.currentMessage = undefined;
        game.updateHUDState?.();
      }
    }, 1800);
  }, 4200);
}

function explodeVehicle(entity, reason = 'VEHÍCULO DESTRUIDO') {
  if (!entity || entity.dead) return;
  entity.dead = true;
  entity.health = 0;
  createExplosion(entity.root.position.clone(), entity.type === 'aircraft' ? 1.8 : entity.type === 'tank' ? 1.5 : 1);
  entity.root.visible = false;
  if (entity.isPlayerControlled || entity.root === game.activeCar || entity.entry === window.__AIRCRAFT_SYSTEM__?.active || entity.entry === window.__POLICE_RESPONSE__?.activeTank) {
    hospitalize(reason);
  } else {
    setTimeout(() => {
      if (entity.respawnable !== false) {
        entity.dead = false;
        entity.health = entity.maxHealth;
        entity.root.visible = true;
      }
    }, 25000);
  }
}

function requestGangWeaponDrop(position, weaponId, attempts = 0) {
  const api = window.__WEAPON_CRATES__;
  if (api?.dropWeaponAt) {
    api.dropWeaponAt(position, weaponId);
    return;
  }
  if (attempts < 28) setTimeout(() => requestGangWeaponDrop(position, weaponId, attempts + 1), 260);
}

function damageEntity(entity, damage, source = 'player') {
  if (!entity || entity.dead || entity.invulnerable) return false;
  entity.health -= damage;
  entity.lastHitAt = performance.now();
  if (source === 'player') {
    if (entity.faction === 'police') addWanted(2, 'ATAQUE A UN POLICÍA');
    else if (entity.type === 'civilian') addWanted(1, 'AGRESIÓN A CIVIL');
    else if (entity.type === 'vehicle' && entity.police) addWanted(2, 'ATAQUE A VEHÍCULO POLICIAL');
  }
  if (entity.type === 'civilian' && entity.health > 0) {
    entity.state = Math.random() < .62 ? 'flee' : 'fight';
    entity.stateUntil = performance.now() + 9000;
  }
  if (entity.health > 0) return true;

  if (['vehicle','tank','aircraft'].includes(entity.type)) {
    explodeVehicle(entity, entity.type === 'aircraft' ? 'ACCIDENTE AÉREO' : 'VEHÍCULO DESTRUIDO');
    return true;
  }
  const deathPosition = entity.root.position.clone();
  entity.dead = true;
  entity.health = 0;
  entity.root.visible = false;
  if (entity.type === 'gang') {
    removeRecruit(entity);
    if (entity.faction !== 'orange' && source === 'player') {
      const ids = ['pistol','akm','shotgun'];
      const weaponId = ids[Math.floor(Math.random() * ids.length)];
      setTimeout(() => requestGangWeaponDrop(deathPosition, weaponId), 120);
    }
    checkTerritoryCapture(entity.territory);
  }
  const respawnDelay = entity.type === 'civilian' ? 32000 : entity.type === 'police' ? 22000 :
    entity.type === 'gang' && entity.faction === 'orange' ? 26000 : 0;
  if (respawnDelay > 0) {
    setTimeout(() => {
      entity.dead = false;
      entity.health = entity.maxHealth;
      entity.root.visible = true;
      entity.state = 'patrol';
      const home = entity.territory || entity.patrolTerritory;
      if (home) entity.root.position.copy(randomPointInTerritory(home));
    }, respawnDelay);
  }
  return true;
}

function checkTerritoryCapture(def) {
  if (!def || territoryOwner(def) === 'orange') return;
  const remaining = gangs.filter(g => g.territory === def && !g.dead && g.faction !== 'orange');
  if (remaining.length) return;
  territoryState[def.id] = 'orange';
  saveTerritoryState();
  updateTerritoryMarker(def);
  notice(`TERRITORIO CONQUISTADO · ${FACTIONS.orange.name}`, 4000);
  for (const vehicle of serviceVehicles.filter(v => v.kind === 'gang' && v.territory === def)) setGangVehicleFaction(vehicle, 'orange');
  for (const member of gangs.filter(g => g.territory === def)) {
    setTimeout(() => {
      member.dead = false;
      member.health = member.maxHealth;
      setEntityFactionAppearance(member, 'orange');
      member.root.visible = true;
      member.root.position.copy(randomPointInTerritory(def));
      member.state = 'patrol';
      member.recruited = false;
    }, 1800 + Math.random() * 1200);
  }
}

function findEntityFromObject(object) {
  let current = object;
  while (current) {
    if (current.userData?.entityRef) return current.userData.entityRef;
    current = current.parent;
  }
  return null;
}

function collectRaycastRoots() {
  const roots = [];
  for (const entity of entities) if (!entity.dead && entity.root?.visible) roots.push(entity.root);
  for (const npc of window.__CITY_NPCS__ || []) if (npc.root?.visible) roots.push(npc.root);
  for (const car of window.__CUSTOM_CARS__ || []) if (car.root?.visible) roots.push(car.root);
  for (const tank of window.__POLICE_RESPONSE__?.tanks || []) if (tank.root?.visible) roots.push(tank.root);
  for (const plane of window.__POLICE_RESPONSE__?.policePlanes || []) if (plane.root?.visible) roots.push(plane.root);
  for (const craft of window.__AIRCRAFT_SYSTEM__?.aircraft || []) if (craft.root?.visible) roots.push(craft.root);
  return roots;
}

function currentWeaponDamage() {
  const id = window.__WEAPON_CRATES__?.selectedWeapon || 'pistol';
  if (id === 'shotgun') return 72;
  if (id === 'akm') return 34;
  if (id === 'pistol') return 42;
  return 18;
}

function handleRayShot(damage = currentWeaponDamage()) {
  if (!game?.camera) return;
  game.camera.getWorldDirection(tempDir);
  raycaster.set(game.camera.position, tempDir);
  raycaster.far = 3200;
  const hit = raycaster.intersectObjects(collectRaycastRoots(), true)[0];
  if (!hit) return;
  let entity = findEntityFromObject(hit.object);
  if (!entity) entity = augmentRootEntity(hit.object);
  if (entity) damageEntity(entity, damage, 'player');
}

function augmentRootEntity(object) {
  let root = object;
  while (root.parent && !root.userData?.customCarData && !root.userData?.aircraftEntry && !root.userData?.tankEntry) root = root.parent;
  const car = root.userData?.customCarData;
  if (car) return ensureVehicleEntity(car.root, 'vehicle', car, false);
  const craft = root.userData?.aircraftEntry;
  if (craft) return ensureVehicleEntity(craft.root, 'aircraft', craft, false);
  return null;
}

function patchWeapons() {
  if (patchedWeapons || !game) return;
  patchedWeapons = true;
  const originalShoot = typeof game.performShoot === 'function' ? game.performShoot.bind(game) : null;
  if (originalShoot) {
    game.performShoot = function v64CombatShoot(...args) {
      const result = originalShoot(...args);
      addWanted(1, 'DISPARO REPORTADO');
      handleRayShot();
      return result;
    };
  }
  const originalAction = typeof game.triggerWeaponAction === 'function' ? game.triggerWeaponAction.bind(game) : null;
  if (originalAction) {
    game.triggerWeaponAction = function v64CombatAction(...args) {
      const selected = window.__WEAPON_CRATES__?.selectedWeapon || game.activeWeapon;
      const result = originalAction(...args);
      if (selected === 'fist') meleeAttack();
      return result;
    };
  }
}

function meleeAttack() {
  const player = game?.playerContainer?.position;
  if (!player) return;
  game.camera.getWorldDirection(tempDir);
  tempDir.y = 0;
  tempDir.normalize();
  let best = null;
  let bestScore = Infinity;
  const candidates = [...entities];
  for (const npc of window.__CITY_NPCS__ || []) {
    if (npc.__combatEntity) candidates.push(npc.__combatEntity);
  }
  for (const entity of candidates) {
    if (!entity || entity.dead || !entity.root.visible) continue;
    tempVec.subVectors(entity.root.position, player);
    const distance = tempVec.length();
    if (distance > 95) continue;
    tempVec.y = 0;
    tempVec.normalize();
    const facing = tempDir.dot(tempVec);
    // V85: a corta distancia el golpe conecta aunque el ángulo no sea exacto.
    // Antes, con un agente encima del jugador, el puñetazo fallaba siempre.
    if (facing < .15 && distance > 42) continue;
    const score = distance - facing * 20;
    if (score < bestScore) { best = entity; bestScore = score; }
  }
  if (best) damageEntity(best, 30, 'player');
}

function ensureCivilianEntities() {
  for (const npc of window.__CITY_NPCS__ || []) {
    if (npc.__combatEntity) continue;
    const entity = {
      type:'civilian', faction:'civilian', root:npc.root, limbs:npc.rig || {}, health:75, maxHealth:75,
      dead:false, state:'wander', stateUntil:0, speedBackup:npc.speed, npcRef:npc, phase:npc.phase || Math.random()*4
    };
    npc.__combatEntity = entity;
    npc.root.userData.entityRef = entity;
    npc.root.traverse(object => { object.userData.entityRef = entity; });
    entities.push(entity);
  }
}

function ensureBasePoliceEntities() {
  const world = game?.crimeWorld;
  if (!world || world.__v74BasePoliceSuppressed) return;
  world.__v74BasePoliceSuppressed = true;

  // El sistema optimizado usa los agentes ambientales de este módulo. Los agentes
  // internos del juego base se conservan solo como datos para el nivel de búsqueda,
  // pero no renderizan ni ejecutan disparos/rutas duplicadas.
  for (const officer of world.policeAgents || []) {
    if (!officer?.root) continue;
    officer.root.visible = false;
    officer.root.userData.v74SuppressedBasePolice = true;
    officer.state = 'idle';
  }
  world.agentShoot = () => {};
}

function ensureVehicleEntity(root, type, entry, police = false) {
  if (!root) return null;
  if (root.userData?.combatVehicleEntity) return root.userData.combatVehicleEntity;
  const maxHealth = type === 'tank' ? 460 : type === 'aircraft' ? 260 : 190;
  const entity = { type, root, entry, police, health:maxHealth, maxHealth, dead:false, respawnable:!police };
  root.userData.combatVehicleEntity = entity;
  root.userData.entityRef = entity;
  root.traverse(object => { object.userData.entityRef = entity; });
  entities.push(entity);
  return entity;
}

function ensureVehicleEntities() {
  for (const car of window.__CUSTOM_CARS__ || []) ensureVehicleEntity(car.root, 'vehicle', car, false);
  for (const tank of window.__POLICE_RESPONSE__?.tanks || []) ensureVehicleEntity(tank.root, 'tank', tank, Boolean(tank.police));
  for (const plane of window.__POLICE_RESPONSE__?.policePlanes || []) ensureVehicleEntity(plane.root, 'aircraft', plane, true);
  for (const craft of window.__AIRCRAFT_SYSTEM__?.aircraft || []) ensureVehicleEntity(craft.root, 'aircraft', craft, false);
}

function currentPlayerVehicleEntity() {
  if (window.__CUSTOM_CAR_SYSTEM__?.active?.root) return ensureVehicleEntity(window.__CUSTOM_CAR_SYSTEM__.active.root, 'vehicle', window.__CUSTOM_CAR_SYSTEM__.active, false);
  if (window.__AIRCRAFT_SYSTEM__?.active?.root) return ensureVehicleEntity(window.__AIRCRAFT_SYSTEM__.active.root, 'aircraft', window.__AIRCRAFT_SYSTEM__.active, false);
  if (window.__POLICE_RESPONSE__?.activeTank?.root) return ensureVehicleEntity(window.__POLICE_RESPONSE__.activeTank.root, 'tank', window.__POLICE_RESPONSE__.activeTank, false);
  return null;
}

function updateCivilianBehavior(dt) {
  const player = game.playerContainer.position;
  const now = performance.now();
  for (const npc of window.__CITY_NPCS__ || []) {
    const entity = npc.__combatEntity;
    if (!entity || entity.dead) continue;
    if (entity.state === 'wander') {
      npc.speed = entity.speedBackup;
      continue;
    }
    npc.speed = 0;
    tempVec.subVectors(player, npc.root.position);
    tempVec.y = 0;
    const distance = tempVec.length();
    if (now > entity.stateUntil || distance > 900) {
      entity.state = 'wander';
      npc.speed = entity.speedBackup;
      continue;
    }
    if (entity.state === 'flee') {
      tempVec.multiplyScalar(-1).normalize();
      const target = tempVec2.copy(npc.root.position).addScaledVector(tempVec, 280);
      moveToward(entity, target, 115, dt);
    } else if (entity.state === 'fight') {
      if (distance > 70) moveToward(entity, player, 82, dt);
      else if (now > (entity.nextAttack || 0)) {
        entity.nextAttack = now + 1200;
        damagePlayer(1.5, 'UN CIVIL SE DEFIENDE');
      }
    }
  }
}

function nearestHostileForAlly(member, maxDistance = 620) {
  let best = null;
  let bestSq = maxDistance * maxDistance;
  for (const candidate of gangs) {
    if (candidate.dead || candidate.faction === 'orange' || !candidate.root.visible) continue;
    const d = member.root.position.distanceToSquared(candidate.root.position);
    if (d < bestSq) { best = candidate; bestSq = d; }
  }
  if (wantedLevel() > 0) {
    for (const candidate of ambientPolice) {
      if (candidate.dead || !candidate.root.visible) continue;
      const d = member.root.position.distanceToSquared(candidate.root.position);
      if (d < bestSq) { best = candidate; bestSq = d; }
    }
  }
  return best;
}

function nearestRecruitedInside(def, from, maxDistance = GANG_ALERT_DISTANCE) {
  let best = null;
  let bestSq = maxDistance * maxDistance;
  for (const ally of recruitedGang) {
    if (ally.dead || !ally.root.visible || !territoryContainsWorld(def, ally.root.position)) continue;
    const d = from.distanceToSquared(ally.root.position);
    if (d < bestSq) { best = ally; bestSq = d; }
  }
  return best;
}

function updatePatrol(entity, dt) {
  if (!entity.target || entity.root.position.distanceToSquared(entity.target) < 45 * 45) {
    const territory = entity.territory || entity.patrolTerritory;
    entity.target = territory ? randomPointInTerritory(territory, 80) : entity.root.position.clone();
  }
  entity.state = 'patrol';
  return moveToward(entity, entity.target, entity.speed * .62, dt);
}

function updateGangAndPolice(dt, elapsed) {
  const player = game.playerContainer.position;
  const playerVehicle = currentPlayerVehicleEntity();
  const now = performance.now();
  const wanted = wantedLevel();

  // Mantiene como máximo dos agentes Collada activos. Los demás quedan fuera
  // del render y de la IA hasta que sean necesarios, evitando el tirón que se
  // producía al activar simultáneamente varias skins esqueléticas.
  const availablePolice = ambientPolice
    .filter(entity => !entity.dead)
    .sort((a,b) => a.root.position.distanceToSquared(player) - b.root.position.distanceToSquared(player));
  const policeLimit = wanted >= 4 ? 2 : 1;
  const activePolice = availablePolice.slice(0, policeLimit);
  if (wanted > 0 && now - (updateGangAndPolice._lastResponseAt || 0) > 8000) {
    updateGangAndPolice._lastResponseAt = now;
    for (let i=0;i<activePolice.length;i++) {
      const officer=activePolice[i];
      if (officer.root.position.distanceToSquared(player) > 1500*1500) {
        const angle=(i/Math.max(1,activePolice.length))*Math.PI*2 + (now*.00021);
        const radius=950+i*170;
        const px=player.x+Math.cos(angle)*radius;
        const pz=player.z+Math.sin(angle)*radius;
        if(onSafeSurfaceWorld(px,pz)){
          // V85: el respawn usa 0 como altura de respaldo, nunca player.y.
          // Antes, si el jugador volaba, los agentes aparecían flotando a su altitud.
          officer.root.position.set(px,groundAt(px,pz,0)+.1,pz);
          officer.target=null;
        }
      }
    }
  }
  for (const officer of ambientPolice) {
    const shouldShow = !officer.dead && activePolice.includes(officer) && (wanted > 0 || officer.root.position.distanceToSquared(player) < 1050*1050);
    officer.root.visible = shouldShow;
  }

  const actorCount = gangs.length + activePolice.length;
  for (let actorIndex=0; actorIndex<actorCount; actorIndex++) {
    const entity = actorIndex < gangs.length ? gangs[actorIndex] : activePolice[actorIndex-gangs.length];
    entity.mixer?.update?.(dt);
    if (entity.dead || !entity.root.visible) continue;
    let moving = false;
    const isPolice = entity.faction === 'police';
    const isOrange = entity.type === 'gang' && entity.faction === 'orange';
    const hostileGang = entity.type === 'gang' && entity.faction !== 'orange';
    const distance = entity.root.position.distanceTo(player);

    // Los interiores son zonas seguras: ningún disparo atraviesa hospital o comisaría.
    if (currentInterior) {
      moving = updatePatrol(entity, dt);
      applyWalkAnimation(entity, elapsed, moving);
      continue;
    }

    if (isPolice && wanted > 0) {
      entity.state = 'chase';
      // V85: los agentes NUNCA vuelan. Si el jugador está en el aire (aeronave,
      // jetpack o salto largo), esperan bajo su vertical en el suelo.
      const playerAirborne = Boolean(game?.state?.isFlying) || Boolean(window.__ACTIVE_AIRCRAFT__) ||
        (player.y - groundAt(player.x, player.z, 0)) > 90;
      if (distance > 76) {
        if (playerAirborne) {
          tempVec2.set(player.x, 0, player.z);
          const groundDistance = Math.hypot(entity.root.position.x - player.x, entity.root.position.z - player.z);
          if (groundDistance > 140) moving = moveToward(entity, tempVec2, entity.speed + wanted * 6, dt);
        } else {
          moving = moveToward(entity, player, entity.speed + wanted * 9, dt);
        }
      }
      // V85: separación física. El agente mantiene una distancia mínima con el
      // jugador; antes se pegaban, empujaban y caminaban por encima.
      const MIN_POLICE_GAP = 34;
      const gapDx = entity.root.position.x - player.x;
      const gapDz = entity.root.position.z - player.z;
      const gapDistance = Math.hypot(gapDx, gapDz);
      if (gapDistance > .001 && gapDistance < MIN_POLICE_GAP && !playerAirborne) {
        const push = (MIN_POLICE_GAP - gapDistance);
        const nx = entity.root.position.x + (gapDx / gapDistance) * push;
        const nz = entity.root.position.z + (gapDz / gapDistance) * push;
        if (onSafeSurfaceWorld(nx, nz)) {
          entity.root.position.x = nx;
          entity.root.position.z = nz;
          entity.root._cx = nx; entity.root._cz = nz;
        }
      }
      // V85: anclaje al suelo en cada actualización (excepto persecución en el mar).
      if (!game?.state?.inWater) {
        const groundY = groundAt(entity.root.position.x, entity.root.position.z, 0);
        if (Number.isFinite(groundY)) entity.root.position.y = groundY + .1;
      }

      // A niveles bajos intentan detener; a partir de dos estrellas también disparan.
      if (distance < 58 && wanted <= 2 && !playerVehicle) {
        entity.arrestProgress = (entity.arrestProgress || 0) + dt;
        if (entity.arrestProgress >= (wanted === 1 ? 7.5 : 5.5)) arrestPlayer('ARRESTADO POR UN AGENTE');
      } else {
        entity.arrestProgress = Math.max(0, (entity.arrestProgress || 0) - dt * 1.4);
      }
      if (wanted >= 2 && distance < POLICE_FIRE_DISTANCE && now > entity.nextAttack) {
        entity.state = 'attack';
        entity.nextAttack = now + Math.max(520, 1120 - wanted * 105) + Math.random() * 180;
        const from = entity.root.position.clone().add(new THREE.Vector3(0, actorTargetHeight * .62, 0));
        const to = player.clone().add(new THREE.Vector3(0, actorTargetHeight * .42, 0));
        drawTracer(from, to, FACTIONS.police.color);
        if (playerVehicle) damageEntity(playerVehicle, 2.4 + wanted * 1.1, 'police');
        else damagePlayer(1.4 + wanted * .65, 'DISPAROS DE VCPD');
      }
    } else if (isOrange && entity.recruited) {
      const hostile = nearestHostileForAlly(entity);
      if (hostile) {
        const hostileDistance = entity.root.position.distanceTo(hostile.root.position);
        entity.state = 'defend';
        if (hostileDistance > 185) moving = moveToward(entity, hostile.root.position, entity.speed + 28, dt);
        if (hostileDistance < 420 && now > entity.nextAttack) {
          entity.nextAttack = now + 850 + Math.random() * 260;
          drawTracer(
            entity.root.position.clone().add(new THREE.Vector3(0, actorTargetHeight * .62, 0)),
            hostile.root.position.clone().add(new THREE.Vector3(0, actorTargetHeight * .45, 0)),
            FACTIONS.orange.color
          );
          damageEntity(hostile, 16 + Math.random() * 5, 'ally');
        }
      } else {
        entity.state = 'follow';
        const index = Math.max(0, recruitedGang.indexOf(entity));
        const angle = (index / Math.max(1, recruitedGang.length)) * Math.PI * 2 + elapsed * .12;
        const followPoint = tempVec2.copy(player).add(new THREE.Vector3(Math.cos(angle) * 82, 0, Math.sin(angle) * 82));
        followPoint.y = groundAt(followPoint.x, followPoint.z, player.y);
        if (distance > 1800) {
          entity.root.position.copy(findSafePointNear(player, 110 + index * 22, angle));
        } else if (entity.root.position.distanceToSquared(followPoint) > 72 * 72) {
          moving = moveToward(entity, followPoint, entity.speed + 34, dt);
        }
      }
    } else if (hostileGang) {
      const territoryIsHostile = territoryOwner(entity.territory) === entity.faction;
      const playerInsideEnemyZone = territoryIsHostile && territoryContainsWorld(entity.territory, player);
      const alliedTarget = territoryIsHostile ? nearestRecruitedInside(entity.territory, entity.root.position) : null;
      const targetEntity = playerInsideEnemyZone ? null : alliedTarget;
      const targetPosition = playerInsideEnemyZone ? player : targetEntity?.root?.position;

      // Las bandas enemigas solo atacan al jugador cuando entra realmente en su zona.
      if (targetPosition) {
        const targetDistance = entity.root.position.distanceTo(targetPosition);
        entity.state = targetDistance > 175 ? 'chase' : 'attack';
        if (targetDistance > 170) moving = moveToward(entity, targetPosition, entity.speed + 10, dt);
        if (targetDistance < GANG_FIRE_DISTANCE && now > entity.nextAttack) {
          entity.nextAttack = now + 920 + Math.random() * 430;
          const from = entity.root.position.clone().add(new THREE.Vector3(0, actorTargetHeight * .61, 0));
          const to = targetPosition.clone().add(new THREE.Vector3(0, actorTargetHeight * .42, 0));
          drawTracer(from, to, FACTIONS[entity.faction].color);
          if (targetEntity) damageEntity(targetEntity, 9 + Math.random() * 3, 'gang');
          else if (playerVehicle) damageEntity(playerVehicle, 3.0, 'gang');
          else damagePlayer(1.7 + Math.random() * 1.1, `ATAQUE DE ${FACTIONS[entity.faction].name}`);
        }
      } else {
        moving = updatePatrol(entity, dt);
      }
    } else {
      moving = updatePatrol(entity, dt);
    }
    applyWalkAnimation(entity, elapsed, moving);
  }
}

function createServiceVehicle(label, color, x, z, police = false, options = {}) {
  const root = new THREE.Group();
  const visualGroup = new THREE.Group();
  const wheelGroup = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color });
  const darkMat = new THREE.MeshLambertMaterial({ color:0x15191e });
  const body = new THREE.Mesh(serviceBodyGeo, bodyMat);
  body.position.y = 18;
  const cab = new THREE.Mesh(serviceCabGeo, bodyMat);
  cab.position.set(0,37,-16);
  visualGroup.add(body,cab);
  root.add(visualGroup, wheelGroup);
  for (const sx of [-1,1]) for (const sz of [-1,1]) {
    const wheel = new THREE.Mesh(wheelGeo, darkMat);
    wheel.rotation.z = Math.PI/2;
    wheel.position.set(sx*35,10,sz*38);
    wheelGroup.add(wheel);
  }
  if (police) {
    const red = new THREE.Mesh(new THREE.BoxGeometry(12,5,8), new THREE.MeshBasicMaterial({color:0xff2a2a}));
    const blue = new THREE.Mesh(new THREE.BoxGeometry(12,5,8), new THREE.MeshBasicMaterial({color:0x2a78ff}));
    red.position.set(-8,52,0); blue.position.set(8,52,0);
    root.add(red,blue);
    root.userData.lights = { red, blue };
  }
  const sign = null; // V66: sin carteles flotantes sobre vehículos.
  root.position.set(x, groundAt(x,z,0)+1, z);
  root._isAlwaysVisible = options.kind === 'ambulance';
  root._cx = x; root._cz = z;
  root.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});
  game.city.add(root);
  const entry = {
    root, visualGroup, wheelGroup, sign, police, faction:options.faction || null,
    territory:options.territory || null, kind:options.kind || (police ? 'police' : 'service'),
    speed:police?260:(options.faction?170:0), visible:true, phase:Math.random()*6,
    lastImpact:0, target:null, nextTargetAt:0, home:new THREE.Vector3(x, groundAt(x,z,0)+1, z),
    theftReported:false
  };
  const driveData = {
    root,
    wheels:[...wheelGroup.children],
    length:125,
    width:70,
    height:56,
    cachedGround:entry.home.y - 1,
    autopilot:false,
    kind:`service-${entry.kind}`,
    serviceEntry:entry
  };
  entry.driveData = driveData;
  root.userData.__customDriveableCar = true;
  root.userData.customCarData = driveData;
  root.userData.serviceVehicleEntry = entry;
  serviceVehicles.push(entry);
  registerServiceVehicleForDriving(entry);
  if (police || options.faction) ensureVehicleEntity(root,'vehicle',entry,police);
  return entry;
}

function registerServiceVehicleForDriving(entry) {
  if (!entry?.driveData || entry.driveRegistered) return;
  const tryRegister = () => {
    const system = window.__CUSTOM_CAR_SYSTEM__;
    if (!system?.cars) return false;
    if (!system.cars.includes(entry.driveData)) system.cars.push(entry.driveData);
    entry.driveRegistered = true;
    return true;
  };
  if (tryRegister()) return;
  let attempts = 0;
  const timer = setInterval(() => {
    attempts++;
    if (tryRegister() || attempts > 180) clearInterval(timer);
  }, 250);
}

function normalizeVehicleVisual(visual, targetLength = 135) {
  visual.position.set(0,0,0);
  visual.rotation.set(0,0,0);
  visual.scale.set(1,1,1);
  visual.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(visual);
  let size = box.getSize(new THREE.Vector3());
  if (size.x > size.z) visual.rotation.y = Math.PI / 2;
  visual.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(visual);
  size = box.getSize(new THREE.Vector3());
  const scale = targetLength / Math.max(.001, size.z);
  visual.scale.setScalar(scale);
  visual.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(visual);
  const center = box.getCenter(new THREE.Vector3());
  visual.position.x -= center.x;
  visual.position.z -= center.z;
  visual.position.y -= box.min.y;
}

function prepareVehicleClone(source, tint = null, targetLength = 135) {
  const visual = source.clone(true);
  visual.traverse(object => {
    if (!object.isMesh && !object.isSkinnedMesh) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const mapped = materials.map(material => {
      if (!material) return material;
      const copy = material.clone();
      if (tint && copy.color) copy.color.lerp(new THREE.Color(tint), .68);
      copy.roughness = Math.max(.32, copy.roughness ?? .55);
      copy.needsUpdate = true;
      return copy;
    });
    object.material = Array.isArray(object.material) ? mapped : mapped[0];
    object.castShadow = false;
    object.receiveShadow = false;
  });
  normalizeVehicleVisual(visual, targetLength);
  return visual;
}

function upgradeVehicleEntry(entry, source, tint = null, targetLength = 135, hideFallbackWheels = false) {
  if (!entry?.visualGroup || !source) return;
  entry.visualGroup.clear();
  const realVisual = prepareVehicleClone(source, tint, targetLength);
  // V82: el controlador avanza por -Z. La ambulancia adjuntada miraba al lado
  // contrario en la vista de conducción, así que se gira únicamente su skin.
  if (entry.kind === 'ambulance') realVisual.rotation.y += Math.PI;
  entry.visualGroup.add(realVisual);
  if (entry.wheelGroup) entry.wheelGroup.visible = !hideFallbackWheels;
  entry.root.userData.v65RealVehicleSkin = true;
}

function setGangVehicleFaction(entry, faction) {
  if (!entry || entry.kind !== 'gang') return;
  entry.faction = faction;
  if (serviceCarTemplate) upgradeVehicleEntry(entry, serviceCarTemplate, FACTIONS[faction].color, 132, false);
  else {
    entry.visualGroup?.traverse(object => {
      if (object.isMesh && object.material?.color) object.material.color.setHex(FACTIONS[faction].color);
    });
  }
  if (entry.sign) {
    const replacement = makeLabel(FACTIONS[faction].name, `#${new THREE.Color(FACTIONS[faction].color).getHexString()}`, 125);
    replacement.position.copy(entry.sign.position);
    entry.sign.parent?.remove(entry.sign);
    entry.root.add(replacement);
    entry.sign = replacement;
  }
}

async function loadServiceAssetTemplates() {
  await idleTurn(1800);
  const basicLoader = new GLTFLoader();
  const results = await Promise.allSettled([
    basicLoader.loadAsync('./service-assets/ambulance.glb'),
    basicLoader.loadAsync('./service-assets/hospital-operation-table.glb')
  ]);
  if (results[0].status === 'fulfilled') ambulanceTemplate = results[0].value.scene;
  if (results[1].status === 'fulfilled') operationTableTemplate = results[1].value.scene;

  try {
    const draco = new DRACOLoader();
    draco.setDecoderPath('./include/draco/');
    const carLoader = new GLTFLoader();
    carLoader.setDRACOLoader(draco);
    const car = await carLoader.loadAsync('./service-assets/police-gang-car.gltf');
    serviceCarTemplate = car.scene;
    draco.dispose?.();
  } catch (error) {
    console.warn('[territory-combat] El modelo de coche adjunto no pudo cargarse; se conserva el coche ligero.', error);
  }

  if (ambulanceTemplate && ambulance) upgradeVehicleEntry(ambulance, ambulanceTemplate, null, 148, true);
  if (serviceCarTemplate) {
    for (const entry of serviceVehicles) {
      if (entry.kind !== 'police' && entry.kind !== 'gang') continue;
      const tint = entry.police ? 0x18518e : FACTIONS[entry.faction]?.color;
      upgradeVehicleEntry(entry, serviceCarTemplate, tint, 132, false);
    }
  }
  if (operationTableTemplate && hospital?.root) {
    const table = prepareVehicleClone(operationTableTemplate, null, 88);
    table.position.set(-62, 4, -34);
    table.rotation.y = Math.PI / 2;
    hospital.root.add(table);
  }
}

function findSafePointNear(position, radius, phase=0) {
  for (let i=0;i<16;i++) {
    const angle = phase + i * .73;
    const r = radius * (.65 + (i%4)*.13);
    const x = position.x + Math.cos(angle)*r;
    const z = position.z + Math.sin(angle)*r;
    if (onSafeSurfaceWorld(x,z)) return new THREE.Vector3(x,groundAt(x,z,position.y),z);
  }
  return position.clone();
}

function driveServiceVehicleToward(car, target, speed, dt) {
  tempVec.subVectors(target, car.root.position);
  tempVec.y = 0;
  const distance = tempVec.length();
  if (distance < 1) return distance;
  tempVec.normalize();
  const nx = car.root.position.x + tempVec.x * Math.min(distance, speed * dt);
  const nz = car.root.position.z + tempVec.z * Math.min(distance, speed * dt);
  if (onSafeSurfaceWorld(nx,nz)) {
    car.root.position.x = nx;
    car.root.position.z = nz;
    car.root._cx = nx; car.root._cz = nz;
    const now = performance.now();
    if (!Number.isFinite(car.cachedRoadY)) car.cachedRoadY = car.root.position.y - 1;
    if (!car.nextGroundSampleAt || now >= car.nextGroundSampleAt) {
      car.cachedRoadY = groundAt(nx, nz, car.cachedRoadY);
      car.nextGroundSampleAt = now + 650;
    }
    car.root.position.y += ((car.cachedRoadY + 1) - car.root.position.y) * Math.min(1, dt * 9);
    if (car.driveData) car.driveData.cachedGround = car.cachedRoadY;
    car.blockedSince = 0;
  } else {
    car.blockedSince = car.blockedSince || performance.now();
  }
  car.root.rotation.y = Math.atan2(tempVec.x,tempVec.z);
  return distance;
}

function updatePoliceCars(dt, elapsed) {
  const player = game.playerContainer.position;
  const wanted = wantedLevel();
  const playerVehicle = currentPlayerVehicleEntity();
  const policeCars = serviceVehicles.filter(v=>v.police);
  for (let i=0;i<policeCars.length;i++) {
    const car = policeCars[i];
    const destroyed = car.root.userData?.combatVehicleEntity?.dead;
    car.root.visible = !destroyed;
    if (destroyed) continue;
    if (game.activeCar === car.root) {
      car.home.copy(car.root.position);
      if (car.driveData && !Number.isFinite(car.driveData.cachedGround)) car.driveData.cachedGround = car.root.position.y - 1;
      continue;
    }
    if (car.root.userData.playerOwned || car.driveData?.playerOwned) {
      car.root.carSpeed = 0;
      if(car.root.userData.lights){car.root.userData.lights.red.visible=false;car.root.userData.lights.blue.visible=false;}
      continue;
    }

    if (wanted < 2 || currentInterior) {
      if (car.root.position.distanceToSquared(car.home) > 24 * 24) driveServiceVehicleToward(car, car.home, 125, dt);
      if(car.root.userData.lights){car.root.userData.lights.red.visible=false;car.root.userData.lights.blue.visible=false;}
      continue;
    }
    if (!onSafeSurfaceWorld(car.root.position.x,car.root.position.z) || car.root.position.distanceToSquared(player) > Math.pow(1500,2)) {
      car.root.position.copy(findSafePointNear(player,760+i*120,i*2.1));
    }
    const distance = driveServiceVehicleToward(car, player, car.speed + wanted * 12, dt);
    if (car.blockedSince && performance.now() - car.blockedSince > 900) {
      car.root.position.copy(findSafePointNear(player,680+i*110,i*1.7));
      car.blockedSince=0;
    }
    if(car.root.userData.lights){
      const blink=Math.sin(elapsed*12+i)>0;
      car.root.userData.lights.red.visible=blink;
      car.root.userData.lights.blue.visible=!blink;
    }
    // V86: la patrulla frena y mantiene un colchón físico; nunca atraviesa ni
    // aparece encima del jugador. El impacto solo ocurre si aún existe contacto.
    if (!playerVehicle && distance < 105) {
      const dx = car.root.position.x - player.x;
      const dz = car.root.position.z - player.z;
      const length = Math.max(.001, Math.hypot(dx,dz));
      const push = 105 - length;
      const nx = car.root.position.x + dx / length * push;
      const nz = car.root.position.z + dz / length * push;
      if (onSafeSurfaceWorld(nx,nz)) {
        car.root.position.x = nx; car.root.position.z = nz;
        car.root._cx = nx; car.root._cz = nz;
      }
      car.root.carSpeed = 0;
    }
    if(distance<76 && performance.now()-car.lastImpact>1200){
      car.lastImpact=performance.now();
      if(playerVehicle) damageEntity(playerVehicle,wanted>=4?7:3.5,'police');
      else damagePlayer(wanted>=4?2.8:1.0, wanted>=4?'ATROPELLO VCPD':'VCPD TE BLOQUEA');
    }
  }
}

function updateGangCars(dt, elapsed) {
  const player = game.playerContainer.position;
  const playerVehicle = currentPlayerVehicleEntity();
  const now = performance.now();
  const cars = serviceVehicles.filter(v => v.kind === 'gang');
  for (let i = 0; i < cars.length; i++) {
    const car = cars[i];
    const combat = car.root.userData?.combatVehicleEntity;
    if (combat?.dead) { car.root.visible = false; continue; }
    car.root.visible = true;
    if (game.activeCar === car.root) {
      car.home.copy(car.root.position);
      if (car.driveData && !Number.isFinite(car.driveData.cachedGround)) car.driveData.cachedGround = car.root.position.y - 1;
      continue;
    }
    if (car.root.userData.playerOwned || car.driveData?.playerOwned) {
      car.root.carSpeed = 0;
      continue;
    }
    const owner = territoryOwner(car.territory);
    if (car.faction !== owner) setGangVehicleFaction(car, owner);
    const hostile = car.faction !== 'orange' && territoryContainsWorld(car.territory, player);

    if (hostile && !currentInterior) {
      const distance = driveServiceVehicleToward(car, player, car.speed + 35, dt);
      if (distance < 84 && now - car.lastImpact > 1100) {
        car.lastImpact = now;
        if (playerVehicle) damageEntity(playerVehicle, 5, 'gang');
        else damagePlayer(2.4, `ATROPELLO DE ${FACTIONS[car.faction].name}`);
      }
    } else {
      if (!car.target || now > car.nextTargetAt || car.root.position.distanceToSquared(car.target) < 70 * 70) {
        car.target = randomPointInTerritory(car.territory, 125);
        car.nextTargetAt = now + 8000 + Math.random() * 6000;
      }
      driveServiceVehicleToward(car, car.target, car.speed * .55, dt);
    }
    if (car.wheelGroup) {
      for (const wheel of car.wheelGroup.children) wheel.rotation.x -= dt * (hostile ? 8 : 4);
    }
  }
}

function updateVehicleCollisions() {
  const now = performance.now();
  if (now - lastVehicleCollisionCheck < 180) return;
  lastVehicleCollisionCheck = now;
  const player = game.playerContainer.position;
  const activeCar = window.__CUSTOM_CAR_SYSTEM__?.active;
  const playerVehicle = currentPlayerVehicleEntity();
  if(activeCar?.root){
    const speed=Math.abs(activeCar.root.carSpeed||0);
    if(speed>70){
      for(const entity of entities){
        if(entity.dead||!['civilian','gang','police'].includes(entity.type)||!entity.root.visible)continue;
        if(entity.root.position.distanceToSquared(activeCar.root.position)<65*65) damageEntity(entity,Math.min(120,25+speed*.16),'player');
      }
      for(const other of window.__CUSTOM_CARS__||[]){
        if(other===activeCar||!other.root.visible)continue;
        if(other.root.position.distanceToSquared(activeCar.root.position)<88*88){
          const otherEntity=ensureVehicleEntity(other.root,'vehicle',other,false);
          damageEntity(otherEntity,Math.min(28,speed*.028),'collision');
          if(playerVehicle) damageEntity(playerVehicle,Math.min(10,speed*.012),'collision');
          activeCar.root.carSpeed*=.55;
        }
      }
    }
  } else {
    const exitGraceUntil = Number(game.playerContainer?.userData?.v74VehicleExitGraceUntil || 0);
    if (now < exitGraceUntil) return;
    for(const car of window.__CUSTOM_CARS__||[]){
      if(!car.root.visible)continue;
      const speed = Math.abs(car.root.carSpeed || 0);
      if (speed < 45) continue;
      if(now-(car.root.userData?.lastPlayerEnterAt||0)<1800) continue;
      if(now-(car.root.userData?.lastPlayerExitAt||0)<3000) continue;
      if(car.root.position.distanceToSquared(player)<50*50 && now-(car.__lastPedHit||0)>1500){
        car.__lastPedHit=now;
        damagePlayer(1.8,'ATROPELLADO');
      }
    }
  }
}

function updateAircraftCrash() {
  const craft = window.__AIRCRAFT_SYSTEM__?.active;
  if(!craft?.root) return;
  const floor=groundAt(craft.root.position.x,craft.root.position.z,0)+5;
  const hardImpact=craft.root.position.y<=floor+.8 && (Math.abs(craft.speed)>250 || craft.verticalSpeed<-100) && (Math.abs(craft.pitch||0)>.18 || Math.abs(craft.roll||0)>.35 || craft.verticalSpeed<-100);
  if(hardImpact){
    const entity=ensureVehicleEntity(craft.root,'aircraft',craft,false);
    entity.isPlayerControlled=true;
    explodeVehicle(entity,'ACCIDENTE AÉREO');
  }
}

function updateExplosions(dt){
  for(let i=explosions.length-1;i>=0;i--){
    const e=explosions[i];e.age+=dt;
    const t=Math.min(1,e.age/e.duration);
    e.mesh.scale.setScalar(10+(e.maxScale-10)*t);
    e.mesh.material.opacity=1-t;
    if(t>=1){e.mesh.parent?.remove(e.mesh);e.mesh.material.dispose();explosions.splice(i,1);}
  }
}

function addInteriorBox(root, size, position, color, options = {}) {
  const material = new THREE.MeshLambertMaterial({ color, transparent:Boolean(options.transparent), opacity:options.opacity ?? 1 });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0],size[1],size[2]), material);
  mesh.position.set(position[0],position[1],position[2]);
  root.add(mesh);
  return mesh;
}

function addHospitalInterior(root) {
  addInteriorBox(root,[118,30,20],[-55,17,72],0xf0f3f6);
  addInteriorBox(root,[118,4,23],[-55,34,72],0xd32232);
  for (const z of [-52,25]) {
    addInteriorBox(root,[78,9,35],[56,12,z],0xe7eef4);
    addInteriorBox(root,[76,3,31],[56,18,z],0xffffff);
    addInteriorBox(root,[22,10,32],[84,9,z],0x5b7485);
    addInteriorBox(root,[4,22,4],[24,11,z-13],0x777777);
    addInteriorBox(root,[4,22,4],[24,11,z+13],0x777777);
    addInteriorBox(root,[4,22,4],[88,11,z-13],0x777777);
    addInteriorBox(root,[4,22,4],[88,11,z+13],0x777777);
  }
  const crossMat = 0xd71920;
  addInteriorBox(root,[10,42,5],[-105,72,-101],crossMat);
  addInteriorBox(root,[42,10,5],[-105,72,-101],crossMat);
  addInteriorBox(root,[38,50,4],[-122,42,-45],0x9ed6e8,{transparent:true,opacity:.55});
}

function addStationInterior(root) {
  addInteriorBox(root,[120,31,26],[-42,18,65],0x34495e);
  addInteriorBox(root,[120,5,28],[-42,36,65],0x67a9e7);
  addInteriorBox(root,[80,12,28],[74,9,62],0x59636e);
  // Celda transitable situada al fondo izquierdo.
  const barColor = 0x252a2f;
  for (let x=-128; x<=-24; x+=13) addInteriorBox(root,[3,76,3],[x,40,-33],barColor);
  for (let z=-100; z<=-34; z+=13) addInteriorBox(root,[3,76,3],[-24,40,z],barColor);
  addInteriorBox(root,[108,4,4],[-76,78,-33],barColor);
  addInteriorBox(root,[4,4,72],[-24,78,-67],barColor);
  addInteriorBox(root,[82,6,22],[-79,8,-80],0x6f7478);
  addInteriorBox(root,[34,55,5],[105,40,-105],0x1b5d94);
  addInteriorBox(root,[65,4,5],[105,68,-105],0xffffff);
}

function createBuilding(name, logicalX, logicalZ, color, label, kind) {
  const x=logicalToWorld(logicalX), z=logicalToWorld(logicalZ), y=groundAt(x,z,0);
  const root=new THREE.Group();root.name=name;root._isAlwaysVisible=true;
  const wallMat=new THREE.MeshLambertMaterial({color});
  const roofMat=new THREE.MeshLambertMaterial({color:0x3a3d44,transparent:true,opacity:.96});
  const floor=new THREE.Mesh(new THREE.BoxGeometry(300,5,230),wallMat);floor.position.y=2.5;
  const back=new THREE.Mesh(new THREE.BoxGeometry(300,120,12),wallMat);back.position.set(0,60,-109);
  const left=new THREE.Mesh(new THREE.BoxGeometry(12,120,220),wallMat);left.position.set(-144,60,0);
  const right=new THREE.Mesh(new THREE.BoxGeometry(12,120,220),wallMat);right.position.set(144,60,0);
  const frontL=new THREE.Mesh(new THREE.BoxGeometry(112,120,12),wallMat);frontL.position.set(-94,60,109);
  const frontR=new THREE.Mesh(new THREE.BoxGeometry(112,120,12),wallMat);frontR.position.set(94,60,109);
  const roof=new THREE.Mesh(new THREE.BoxGeometry(310,8,240),roofMat);roof.position.y=124;
  root.add(floor,back,left,right,frontL,frontR,roof);
  if(kind==='hospital') addHospitalInterior(root); else addStationInterior(root);
  const sign=makeLabel(label,kind==='hospital'?'#ff4b4b':'#5ba9ff',220);sign.position.set(0,145,110);root.add(sign);
  root.position.set(x,y,z);
  root.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;}});
  game.city.add(root);
  if(typeof game.addObstacle==='function'){
    game.addObstacle(x,z-109,300,12,120,y);
    game.addObstacle(x-144,z,12,220,120,y);
    game.addObstacle(x+144,z,12,220,120,y);
    game.addObstacle(x-94,z+109,112,12,120,y);
    game.addObstacle(x+94,z+109,112,12,120,y);
  }
  return {
    root, roof, kind, door:new THREE.Vector3(x,y+2,z+145), inside:new THREE.Vector3(x,y+2,z+48),
    respawn:new THREE.Vector3(x,y+2,z+185), cell:new THREE.Vector3(x-78,y+2,z-70)
  };
}

function createCrewBuilding(logicalX, logicalZ) {
  const x=logicalToWorld(logicalX), z=logicalToWorld(logicalZ), y=groundAt(x,z,0);
  const root=new THREE.Group();root.name='GAME_OF_CREW_BUILDING_V68';root._isAlwaysVisible=true;
  const dark=new THREE.MeshLambertMaterial({color:0x141922});
  const orange=new THREE.MeshLambertMaterial({color:0xff7218,emissive:0x5a1700,emissiveIntensity:.35});
  const glass=new THREE.MeshLambertMaterial({color:0x1c5b72,transparent:true,opacity:.58});
  const floor=new THREE.Mesh(new THREE.BoxGeometry(330,6,250),dark);floor.position.y=3;
  const back=new THREE.Mesh(new THREE.BoxGeometry(330,145,14),dark);back.position.set(0,72,-118);
  const left=new THREE.Mesh(new THREE.BoxGeometry(14,145,242),dark);left.position.set(-158,72,0);
  const right=new THREE.Mesh(new THREE.BoxGeometry(14,145,242),dark);right.position.set(158,72,0);
  const frontL=new THREE.Mesh(new THREE.BoxGeometry(112,145,14),dark);frontL.position.set(-103,72,118);
  const frontR=new THREE.Mesh(new THREE.BoxGeometry(112,145,14),dark);frontR.position.set(103,72,118);
  const roof=new THREE.Mesh(new THREE.BoxGeometry(344,12,264),orange);roof.position.y=151;
  const doorGlow=new THREE.Mesh(new THREE.PlaneGeometry(82,112),new THREE.MeshBasicMaterial({color:0xff7b18,transparent:true,opacity:.33,side:THREE.DoubleSide}));doorGlow.position.set(0,57,126);doorGlow.rotation.y=Math.PI;
  const windowL=new THREE.Mesh(new THREE.PlaneGeometry(68,70),glass);windowL.position.set(-104,76,126);windowL.rotation.y=Math.PI;
  const windowR=windowL.clone();windowR.position.x=104;
  root.add(floor,back,left,right,frontL,frontR,roof,doorGlow,windowL,windowR);
  const sign=makeLabel('GAME OF CREW','#ff7b18',270);sign.position.set(0,184,121);root.add(sign);
  for(let i=-1;i<=1;i+=2){const pillar=new THREE.Mesh(new THREE.BoxGeometry(13,160,13),orange);pillar.position.set(i*151,80,119);root.add(pillar);}
  root.position.set(x,y,z);
  root.traverse(object=>{if(object.isMesh){object.castShadow=false;object.receiveShadow=true;}});
  game.city.add(root);
  if(typeof game.addObstacle==='function'){
    game.addObstacle(x,z-118,330,14,145,y);
    game.addObstacle(x-158,z,14,242,145,y);
    game.addObstacle(x+158,z,14,242,145,y);
    game.addObstacle(x-103,z+118,112,14,145,y);
    game.addObstacle(x+103,z+118,112,14,145,y);
  }
  return {root,kind:'crew',door:new THREE.Vector3(x,y+3,z+160),respawn:new THREE.Vector3(x,y+3,z+205)};
}

function createVenueBuilding(name, logicalX, logicalZ, color, accent, label, kind, page) {
  const x=logicalToWorld(logicalX), z=logicalToWorld(logicalZ), y=groundAt(x,z,0);
  const root=new THREE.Group(); root.name=name; root._isAlwaysVisible=true;
  const wall=new THREE.MeshLambertMaterial({color});
  const trim=new THREE.MeshLambertMaterial({color:accent,emissive:accent,emissiveIntensity:.18});
  const glass=new THREE.MeshLambertMaterial({color:0x356579,transparent:true,opacity:.55});
  const floor=new THREE.Mesh(new THREE.BoxGeometry(280,6,210),wall); floor.position.y=3;
  const back=new THREE.Mesh(new THREE.BoxGeometry(280,125,12),wall); back.position.set(0,62,-99);
  const left=new THREE.Mesh(new THREE.BoxGeometry(12,125,200),wall); left.position.set(-134,62,0);
  const right=left.clone(); right.position.x=134;
  const frontL=new THREE.Mesh(new THREE.BoxGeometry(96,125,12),wall); frontL.position.set(-88,62,99);
  const frontR=frontL.clone(); frontR.position.x=88;
  const roof=new THREE.Mesh(new THREE.BoxGeometry(292,10,222),trim); roof.position.y=130;
  const door=new THREE.Mesh(new THREE.PlaneGeometry(66,96),new THREE.MeshBasicMaterial({color:accent,transparent:true,opacity:.28,side:THREE.DoubleSide})); door.position.set(0,49,106); door.rotation.y=Math.PI;
  const windowL=new THREE.Mesh(new THREE.PlaneGeometry(60,62),glass); windowL.position.set(-92,68,106); windowL.rotation.y=Math.PI;
  const windowR=windowL.clone(); windowR.position.x=92;
  root.add(floor,back,left,right,frontL,frontR,roof,door,windowL,windowR);
  const sign=makeLabel(label,`#${new THREE.Color(accent).getHexString()}`,245); sign.position.set(0,158,103); root.add(sign);
  root.position.set(x,y,z);
  root.traverse(object=>{if(object.isMesh){object.castShadow=false;object.receiveShadow=true;}});
  game.city.add(root);
  if(typeof game.addObstacle==='function'){
    game.addObstacle(x,z-99,280,12,125,y); game.addObstacle(x-134,z,12,200,125,y); game.addObstacle(x+134,z,12,200,125,y);
    game.addObstacle(x-88,z+99,96,12,125,y); game.addObstacle(x+88,z+99,96,12,125,y);
  }
  return {root,kind,page,label,door:new THREE.Vector3(x,y+3,z+142),respawn:new THREE.Vector3(x,y+3,z+188)};
}

function nearestVenueEntrance() {
  if(!game?.playerContainer)return null;
  const venues=[crewBuilding,barberBuilding,gymBuilding].filter(Boolean);
  let best=null,bestSq=135*135;
  for(const venue of venues){const d=venue.door.distanceToSquared(game.playerContainer.position);if(d<bestSq){best=venue;bestSq=d;}}
  return best;
}

function saveCityReturnState() {
  try {
    const p=game.playerContainer.position;
    localStorage.setItem(CITY_RETURN_STORAGE_KEY,JSON.stringify({x:p.x,y:p.y,z:p.z,yaw:game.playerContainer.rotation.y||0,health:Number(game.health||100),armor:Number(game.armor||0),money:Number(game.money||0)}));
  } catch {}
}

function enterVenue(venue) {
  if(!venue)return;
  exitCurrentVehicle(); saveCityReturnState();
  notice(`ENTRANDO A ${venue.label}…`,900);
  setTimeout(()=>{location.href=venue.page;},260);
}

function nearestCrewEntrance() {
  if(!crewBuilding||!game?.playerContainer)return null;
  return crewBuilding.door.distanceToSquared(game.playerContainer.position)<=135*135?crewBuilding:null;
}

function enterGameOfCrew() { enterVenue(crewBuilding); }

function buildServices(){
  crewBuilding=createCrewBuilding(1540,655); crewBuilding.page='./game-of-crew/index.html'; crewBuilding.label='GAME OF CREW';
  barberBuilding=createVenueBuilding('BARBERIA_V69',-1650,900,0x182832,0xff69b4,'BARBERÍA','barber','./barberia/index.html');
  gymBuilding=createVenueBuilding('GIMNASIO_V69',1250,3200,0x28201b,0xff4d2e,'GIMNASIO','gym','./gimnasio/index.html');
  hospital=createBuilding('HOSPITAL_V66',-2050,-4700,0xe8e8e8,'HOSPITAL','hospital');
  station=createBuilding('COMISARIA_V66',-1850,-3200,0x9ca8b8,'COMISARÍA VCPD','station');
  // V89: sin coches creados manualmente. Se conservan edificios y combate,
  // pero la población adicional se obtiene solo del sistema nativo del juego.
  ambulance = null;
}


function nearestServiceDoor(){
  const p=game.playerContainer.position;
  const options=[hospital,station].filter(Boolean);
  let best=null,bestSq=120*120;
  for(const b of options){
    const target=currentInterior===b.kind?b.inside:b.door;
    const d=target.distanceToSquared(p);
    if(d<bestSq){bestSq=d;best=b;}
  }
  return best;
}

function toggleBuilding(building){
  if(!building || transitionLock)return;
  if(currentInterior===building.kind){
    const exitPoint=building.entryReturn?.clone?.()||building.respawn;
    game.playerContainer.position.copy(exitPoint);
    building.entryReturn=null;
    currentInterior=null;
    if(building.roof)building.roof.visible=true;
    notice(`HAS SALIDO DE ${building.kind==='hospital'?'HOSPITAL':'COMISARÍA'}`);
  }else{
    building.entryReturn=game.playerContainer.position.clone();
    exitCurrentVehicle();
    if(hospital?.roof)hospital.roof.visible=true;
    if(station?.roof)station.roof.visible=true;
    game.playerContainer.position.copy(building.inside);
    currentInterior=building.kind;
    if(building.roof)building.roof.visible=false;
    notice(`DENTRO DE ${building.kind==='hospital'?'HOSPITAL':'COMISARÍA VCPD'}`);
  }
  game.state.vy=0;game.state.onGround=true;game.state.inWater=false;
}

function updateDoorPrompt(){
  const venue=nearestVenueEntrance();
  if(venue){setPrompt(`E · ENTRAR A ${venue.label}`);return;}
  const near=nearestServiceDoor();
  if(near){
    setPrompt(`E · ${currentInterior===near.kind?'SALIR DE':'ENTRAR A'} ${near.kind==='hospital'?'HOSPITAL':'COMISARÍA'}`);
    return;
  }
  const recruit=nearestRecruitableOrange();
  if(recruit)setPrompt(`G · RECLUTAR ALIADO NARANJA (${recruitedGang.length}/${MAX_RECRUITS})`);
  else setPrompt(null);
}

function mapPoint(lx, lz, width = FULL_MAP_W, height = FULL_MAP_H) {
  const x = (lx - WORLD_BOUNDS.xMin) / (WORLD_BOUNDS.xMax - WORLD_BOUNDS.xMin) * width;
  const y = (1 - (lz - WORLD_BOUNDS.zMin) / (WORLD_BOUNDS.zMax - WORLD_BOUNDS.zMin)) * height;
  return [x, y];
}

function mapToLogical(x, y, width = FULL_MAP_W, height = FULL_MAP_H) {
  const lx = WORLD_BOUNDS.xMin + THREE.MathUtils.clamp(x / width, 0, 1) * (WORLD_BOUNDS.xMax - WORLD_BOUNDS.xMin);
  const lz = WORLD_BOUNDS.zMin + (1 - THREE.MathUtils.clamp(y / height, 0, 1)) * (WORLD_BOUNDS.zMax - WORLD_BOUNDS.zMin);
  return [lx, lz];
}

function buildSatelliteSvg() {
  if (!fullSvg || mapSvgRefs) return;
  fullSvg.replaceChildren();
  const defs = svgNode('defs');
  const ocean = svgNode('linearGradient', { id:'v66Ocean', x1:'0', y1:'0', x2:'1', y2:'1' });
  ocean.append(svgNode('stop', { offset:'0%', 'stop-color':'#061e2a' }), svgNode('stop', { offset:'55%', 'stop-color':'#0a3440' }), svgNode('stop', { offset:'100%', 'stop-color':'#08212d' }));
  const land = svgNode('linearGradient', { id:'v66Land', x1:'0', y1:'0', x2:'1', y2:'1' });
  land.append(svgNode('stop', { offset:'0%', 'stop-color':'#34513b' }), svgNode('stop', { offset:'45%', 'stop-color':'#263f31' }), svgNode('stop', { offset:'100%', 'stop-color':'#4f4938' }));
  const noise = svgNode('filter', { id:'v66Noise', x:'-15%', y:'-15%', width:'130%', height:'130%' });
  noise.append(svgNode('feTurbulence', { type:'fractalNoise', baseFrequency:'.035', numOctaves:'3', seed:'19', result:'noise' }));
  noise.append(svgNode('feColorMatrix', { in:'noise', type:'saturate', values:'.25', result:'desat' }));
  noise.append(svgNode('feBlend', { in:'SourceGraphic', in2:'desat', mode:'soft-light' }));
  defs.append(ocean, land, noise);
  fullSvg.append(defs, svgNode('rect', { x:0, y:0, width:FULL_MAP_W, height:FULL_MAP_H, fill:'url(#v66Ocean)' }));

  const landGroup = svgNode('g', { filter:'url(#v66Noise)' });
  for (const surface of SAFE_SURFACES) {
    const [x1,y1] = mapPoint(surface.xMin, surface.zMin);
    const [x2,y2] = mapPoint(surface.xMax, surface.zMax);
    landGroup.append(svgNode('rect', {
      x:Math.min(x1,x2), y:Math.min(y1,y2), width:Math.abs(x2-x1), height:Math.abs(y2-y1),
      rx:8, fill:'url(#v66Land)', stroke:'#64705e', 'stroke-width':1.5
    }));
  }
  fullSvg.append(landGroup);

  const roads = svgNode('g', { fill:'none', stroke:'#81909a', 'stroke-width':4, opacity:.92, 'stroke-linecap':'round' });
  for (const [x1,z1,x2,z2] of ROAD_SPECS) {
    const a=mapPoint(x1,z1), b=mapPoint(x2,z2);
    roads.append(svgNode('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1]}));
    roads.append(svgNode('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:'#d7c68b','stroke-width':.8,'stroke-dasharray':'8 10',opacity:.72}));
  }
  fullSvg.append(roads);

  const buildings = svgNode('g', { fill:'#111a1c', stroke:'#73817b', 'stroke-width':.65, opacity:.8 });
  let seed = 91357;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (const surface of SAFE_SURFACES) {
    const width = surface.xMax - surface.xMin;
    const depth = surface.zMax - surface.zMin;
    const count = Math.max(2, Math.min(28, Math.floor(width * depth / 180000)));
    for (let i=0;i<count;i++) {
      const lx = THREE.MathUtils.lerp(surface.xMin + 35, surface.xMax - 35, rand());
      const lz = THREE.MathUtils.lerp(surface.zMin + 35, surface.zMax - 35, rand());
      const [x,y] = mapPoint(lx,lz);
      buildings.append(svgNode('rect',{x:x-2-rand()*3,y:y-2-rand()*3,width:4+rand()*7,height:4+rand()*7,rx:1,transform:`rotate(${Math.floor(rand()*4)*90} ${x} ${y})`}));
    }
  }
  fullSvg.append(buildings);

  const territoryGroup = svgNode('g', { opacity:.38 });
  const territoryNodes = [];
  for (const def of TERRITORY_DEFS) {
    const [x1,y1]=mapPoint(def.xMin,def.zMin), [x2,y2]=mapPoint(def.xMax,def.zMax);
    const rect=svgNode('rect',{x:Math.min(x1,x2),y:Math.min(y1,y2),width:Math.abs(x2-x1),height:Math.abs(y2-y1),rx:6,'stroke-width':3});
    territoryGroup.append(rect);
    territoryNodes.push({def,rect});
  }
  fullSvg.append(territoryGroup);

  const routeLine = svgNode('line',{stroke:'#ffb020','stroke-width':4,'stroke-dasharray':'11 8',opacity:.9});
  const markerGroup = svgNode('g');
  const makeIconMarker = (key, size = 28) => { const group = svgNode('g'); group.append(svgMapIcon(key, size)); return group; };
  const hospitalMarker = makeIconMarker('hospital',30);
  const stationMarker = makeIconMarker('police',30);
  const waypointMarker = svgNode('g');
  waypointMarker.append(
    svgNode('circle',{r:17,fill:'rgba(255,145,0,.24)',stroke:'#ffd06b','stroke-width':2.5}),
    svgNode('path',{d:'M 0 -15 L 10 9 L 0 5 L -10 9 Z',fill:'#ff9700',stroke:'#ffffff','stroke-width':1.6}),
    svgMapIcon('waypoint',22)
  );
  const crewMarker = makeIconMarker('crew',30);
  const barberMarker = makeIconMarker('barber',30);
  const gymMarker = makeIconMarker('gym',30);
  const houseMarker = makeIconMarker('home',30);
  const girlfriend2Marker = makeIconMarker('heart',30);
  const propertyMarkerGroup = svgNode('g');
  const marineMarkerGroup = svgNode('g');
  const mainBoatMarker = makeIconMarker('boat',30);
  const npcBoatMarker = makeIconMarker('boat',25);
  const boatWorldMarker = makeIconMarker('boat',30);
  const islandMarkerGroup = svgNode('g');
  marineMarkerGroup.append(islandMarkerGroup, mainBoatMarker, npcBoatMarker, boatWorldMarker);
  const onlineMarkerGroup = svgNode('g');
  const playerMarker = makeIconMarker('player',31);
  markerGroup.append(routeLine,hospitalMarker,stationMarker,crewMarker,barberMarker,gymMarker,houseMarker,girlfriend2Marker,propertyMarkerGroup,marineMarkerGroup,waypointMarker,onlineMarkerGroup,playerMarker);
  fullSvg.append(markerGroup);

  mapSvgRefs={territoryNodes,routeLine,hospitalMarker,stationMarker,crewMarker,barberMarker,gymMarker,houseMarker,girlfriend2Marker,propertyMarkerGroup,propertyMarkers:new Map(),marineMarkerGroup,mainBoatMarker,npcBoatMarker,boatWorldMarker,islandMarkerGroup,islandMarkers:new Map(),waypointMarker,onlineMarkerGroup,onlineMarkers:new Map(),playerMarker};
}

function setSvgTransform(node, x, y, rotation = 0) {
  if (!node) return;
  node.setAttribute('transform', `translate(${x} ${y}) rotate(${rotation})`);
}

function updateFullMapSvg() {
  if (!fullSvg || !mapSvgRefs || !game?.playerContainer) return;
  for (const {def,rect} of mapSvgRefs.territoryNodes) {
    const owner=territoryOwner(def);
    const color=`#${new THREE.Color(FACTIONS[owner].color).getHexString()}`;
    rect.setAttribute('fill',color);
    rect.setAttribute('stroke',color);
  }
  const pose=navigationPose(), player=pose.position;
  const [px,py]=mapPoint(worldToLogical(player.x),worldToLogical(player.z));
  setSvgTransform(mapSvgRefs.playerMarker,px,py,THREE.MathUtils.radToDeg(pose.yaw || 0) + 180);

  if (hospital?.respawn) {
    const p=mapPoint(worldToLogical(hospital.respawn.x),worldToLogical(hospital.respawn.z));
    setSvgTransform(mapSvgRefs.hospitalMarker,p[0],p[1]);
    mapSvgRefs.hospitalMarker.style.display='';
  } else mapSvgRefs.hospitalMarker.style.display='none';
  if (station?.respawn) {
    const p=mapPoint(worldToLogical(station.respawn.x),worldToLogical(station.respawn.z));
    setSvgTransform(mapSvgRefs.stationMarker,p[0],p[1]);
    mapSvgRefs.stationMarker.style.display='';
  } else mapSvgRefs.stationMarker.style.display='none';

  if (crewBuilding?.door) {
    const p=mapPoint(worldToLogical(crewBuilding.door.x),worldToLogical(crewBuilding.door.z));
    setSvgTransform(mapSvgRefs.crewMarker,p[0],p[1]);
    mapSvgRefs.crewMarker.style.display='';
  } else if (mapSvgRefs.crewMarker) mapSvgRefs.crewMarker.style.display='none';
  if (barberBuilding?.door) {
    const p=mapPoint(worldToLogical(barberBuilding.door.x),worldToLogical(barberBuilding.door.z));
    setSvgTransform(mapSvgRefs.barberMarker,p[0],p[1]);
    mapSvgRefs.barberMarker.style.display='';
  } else if (mapSvgRefs.barberMarker) mapSvgRefs.barberMarker.style.display='none';
  if (gymBuilding?.door) {
    const p=mapPoint(worldToLogical(gymBuilding.door.x),worldToLogical(gymBuilding.door.z));
    setSvgTransform(mapSvgRefs.gymMarker,p[0],p[1]);
    mapSvgRefs.gymMarker.style.display='';
  } else if (mapSvgRefs.gymMarker) mapSvgRefs.gymMarker.style.display='none';
  const starterHouse = window.__STARTER_HOUSE__;
  if (starterHouse?.door && mapSvgRefs.houseMarker) {
    const p=mapPoint(worldToLogical(starterHouse.door.x),worldToLogical(starterHouse.door.z));
    setSvgTransform(mapSvgRefs.houseMarker,p[0],p[1]);
    mapSvgRefs.houseMarker.style.display='';
  } else if (mapSvgRefs.houseMarker) mapSvgRefs.houseMarker.style.display='none';
  const girlfriend2 = window.__SECOND_GIRLFRIEND_HOUSE__;
  if (girlfriend2?.door && mapSvgRefs.girlfriend2Marker) {
    const p=mapPoint(worldToLogical(girlfriend2.door.x),worldToLogical(girlfriend2.door.z));
    setSvgTransform(mapSvgRefs.girlfriend2Marker,p[0],p[1]);
    mapSvgRefs.girlfriend2Marker.style.display='';
  } else if (mapSvgRefs.girlfriend2Marker) mapSvgRefs.girlfriend2Marker.style.display='none';

  const propertySystem = window.__PROPERTY_SYSTEM__;
  const visiblePropertyIds = new Set();
  for (const property of propertySystem?.properties || []) {
    if (!property?.door || !mapSvgRefs.propertyMarkerGroup) continue;
    visiblePropertyIds.add(property.id);
    let marker = mapSvgRefs.propertyMarkers.get(property.id);
    if (!marker) {
      marker = svgNode('g');
      const halo = svgNode('circle',{r:15,fill:'rgba(5,10,18,.82)',stroke:'#63a1ff','stroke-width':2});
      marker.append(halo, svgMapIcon('property',25));
      mapSvgRefs.propertyMarkerGroup.append(marker);
      mapSvgRefs.propertyMarkers.set(property.id,marker);
    }
    const p=mapPoint(worldToLogical(property.door.x),worldToLogical(property.door.z));
    setSvgTransform(marker,p[0],p[1]);
    const owned=Boolean(property.owned);
    marker.firstChild?.setAttribute('stroke',owned?'#34d787':'#63a1ff');
    marker.style.display='';
  }
  for (const [id,marker] of mapSvgRefs.propertyMarkers || []) {
    if (!visiblePropertyIds.has(id)) marker.style.display='none';
  }

  const marineMarkers = window.__V81_MARINE_MARKERS__;
  const placeMarineBoat = (root, marker) => {
    if (!root?.visible || !marker) { if (marker) marker.style.display='none'; return; }
    const p=mapPoint(worldToLogical(root.position.x),worldToLogical(root.position.z));
    setSvgTransform(marker,p[0],p[1],THREE.MathUtils.radToDeg(root.rotation?.y || 0));
    marker.style.display='';
  };
  placeMarineBoat(marineMarkers?.boat,mapSvgRefs.mainBoatMarker);
  placeMarineBoat(marineMarkers?.npcBoat,mapSvgRefs.npcBoatMarker);
  const visibleIslandIds = new Set();
  for (const island of marineMarkers?.islands || []) {
    const position=island?.position;
    if (!position || !mapSvgRefs.islandMarkerGroup) continue;
    const id=island.id || `${position.x}:${position.z}`;
    visibleIslandIds.add(id);
    let marker=mapSvgRefs.islandMarkers.get(id);
    if (!marker) {
      marker=makeIconMarker('island',28);
      mapSvgRefs.islandMarkerGroup.append(marker);
      mapSvgRefs.islandMarkers.set(id,marker);
    }
    const p=mapPoint(worldToLogical(position.x),worldToLogical(position.z));
    setSvgTransform(marker,p[0],p[1]);
    marker.style.display='';
  }
  for (const [id,marker] of mapSvgRefs.islandMarkers || []) {
    if (!visibleIslandIds.has(id)) marker.style.display='none';
  }
  const boatWorldTerminal = window.__BOAT_WORLD_TERMINAL__;
  if (boatWorldTerminal?.door && mapSvgRefs.boatWorldMarker) {
    const p=mapPoint(worldToLogical(boatWorldTerminal.door.x),worldToLogical(boatWorldTerminal.door.z));
    setSvgTransform(mapSvgRefs.boatWorldMarker,p[0],p[1]);
    mapSvgRefs.boatWorldMarker.style.display='';
  } else if (mapSvgRefs.boatWorldMarker) mapSvgRefs.boatWorldMarker.style.display='none';

  const onlineStates = window.__GTA_ONLINE__?.getRemoteMapStates?.() || [];
  const visibleOnlineIds = new Set();
  for (const state of onlineStates) {
    if (!state?.position || !mapSvgRefs.onlineMarkerGroup) continue;
    visibleOnlineIds.add(state.id);
    let marker = mapSvgRefs.onlineMarkers.get(state.id);
    if (!marker) {
      marker = svgNode('g');
      const halo = svgNode('circle',{r:14,fill:'rgba(0,0,0,.82)',stroke:state.color||'#ff8a00','stroke-width':3});
      const arrow = svgNode('path',{d:'M 0 -11 L 8 8 L 0 4 L -8 8 Z',fill:state.color||'#ff8a00',stroke:'#ffffff','stroke-width':1.2});
      const label = svgNode('text',{x:0,y:27,'text-anchor':'middle',fill:'#ffffff','font-size':11,'font-weight':900,stroke:'#000000','stroke-width':3,'paint-order':'stroke'});
      label.textContent = state.name || 'JUGADOR';
      marker.append(halo,arrow,label);
      mapSvgRefs.onlineMarkerGroup.append(marker);
      mapSvgRefs.onlineMarkers.set(state.id,marker);
    }
    marker.children[0]?.setAttribute('stroke',state.color||'#ff8a00');
    marker.children[1]?.setAttribute('fill',state.color||'#ff8a00');
    if (marker.children[2]) marker.children[2].textContent=state.name||'JUGADOR';
    const point=mapPoint(worldToLogical(state.position.x),worldToLogical(state.position.z));
    setSvgTransform(marker,point[0],point[1],0);
    marker.style.display='';
  }
  for (const [id,marker] of mapSvgRefs.onlineMarkers || []) if (!visibleOnlineIds.has(id)) marker.style.display='none';

  if (waypoint) {
    const [wx,wy]=mapPoint(worldToLogical(waypoint.x),worldToLogical(waypoint.z));
    setSvgTransform(mapSvgRefs.waypointMarker,wx,wy);
    mapSvgRefs.waypointMarker.style.display='';
    mapSvgRefs.routeLine.style.display='';
    mapSvgRefs.routeLine.setAttribute('x1',px); mapSvgRefs.routeLine.setAttribute('y1',py);
    mapSvgRefs.routeLine.setAttribute('x2',wx); mapSvgRefs.routeLine.setAttribute('y2',wy);
  } else {
    mapSvgRefs.waypointMarker.style.display='none';
    mapSvgRefs.routeLine.style.display='none';
  }
}

function radarPoint(worldX, worldZ, player, radius, yaw = navigationPose().yaw || 0) {
  const dx = worldToLogical(worldX - player.x);
  const dz = worldToLogical(worldZ - player.z);
  // Radar orientado hacia la marcha: lo que está delante siempre aparece arriba.
  // El controlador avanza por el eje local -Z.
  const c = Math.cos(yaw), sn = Math.sin(yaw);
  const localX = dx * c - dz * sn;
  const localForward = dx * sn + dz * c;
  const scale = radius / RADAR_RANGE;
  return [128 + localX * scale, 128 + localForward * scale, localX, localForward];
}

function drawRadar(canvas) {
  if (!canvas || !game?.playerContainer) return;
  const radarMode=window.__VICE_RADAR_MODE__||'map-icons';
  canvas.style.display=radarMode==='off'?'none':'block';
  if(radarMode==='off')return;
  const drawMapLayer=radarMode!=='icons';
  const drawIconLayer=radarMode!=='map';
  const ctx=canvas.getContext('2d',{alpha:false});
  const w=canvas.width,h=canvas.height,cx=w/2,cy=h/2,radius=119;
  const pose=navigationPose(), player=pose.position;
  ctx.setTransform(1,0,0,1,0,0);
  const bg=ctx.createRadialGradient(cx,cy,15,cx,cy,radius);
  bg.addColorStop(0,'#18333a'); bg.addColorStop(1,'#07141d');
  ctx.fillStyle='#07141d';ctx.fillRect(0,0,w,h);
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.clip();ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);

  if(drawMapLayer){
  for(const surface of SAFE_SURFACES){
    const a=radarPoint(logicalToWorld(surface.xMin),logicalToWorld(surface.zMin),player,radius);
    const b=radarPoint(logicalToWorld(surface.xMax),logicalToWorld(surface.zMax),player,radius);
    ctx.fillStyle='rgba(61,82,64,.9)';ctx.strokeStyle='rgba(145,159,137,.55)';ctx.lineWidth=1;
    ctx.fillRect(Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]));
    ctx.strokeRect(Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]));
  }
  for(const def of TERRITORY_DEFS){
    const owner=territoryOwner(def),hex=`#${new THREE.Color(FACTIONS[owner].color).getHexString()}`;
    const a=radarPoint(logicalToWorld(def.xMin),logicalToWorld(def.zMin),player,radius);
    const b=radarPoint(logicalToWorld(def.xMax),logicalToWorld(def.zMax),player,radius);
    ctx.globalAlpha=.32;ctx.fillStyle=hex;ctx.fillRect(Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]));ctx.globalAlpha=1;
  }

  ctx.strokeStyle='rgba(218,226,228,.72)';ctx.lineWidth=4;ctx.lineCap='round';
  for(const [x1,z1,x2,z2] of ROAD_SPECS){
    const a=radarPoint(logicalToWorld(x1),logicalToWorld(z1),player,radius);
    const b=radarPoint(logicalToWorld(x2),logicalToWorld(z2),player,radius);
    ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();
    ctx.strokeStyle='rgba(246,212,121,.48)';ctx.lineWidth=1.2;ctx.setLineDash([5,7]);
    ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();
    ctx.setLineDash([]);ctx.strokeStyle='rgba(218,226,228,.72)';ctx.lineWidth=4;
  }

  }

  const drawServiceMarker=(building,key)=>{
    if(!building?.respawn)return;
    const p=radarPoint(building.respawn.x,building.respawn.z,player,radius);
    if(Math.hypot(p[0]-cx,p[1]-cy)>radius-12)return;
    drawMapIcon(ctx,key,p[0],p[1],18);
  };
  if(drawIconLayer){
  drawServiceMarker(hospital,'hospital'); drawServiceMarker(station,'police');


  const drawDot=(position,color,size=3.2)=>{
    if(!position)return;
    const p=radarPoint(position.x,position.z,player,radius);
    if(Math.hypot(p[0]-cx,p[1]-cy)>radius-7)return;
    ctx.fillStyle=color;ctx.strokeStyle='rgba(0,0,0,.8)';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(p[0],p[1],size,0,Math.PI*2);ctx.fill();ctx.stroke();
  };
  const drawVenueMarker=(building,key,size=18)=>{
    if(!building?.door)return;
    const p=radarPoint(building.door.x,building.door.z,player,radius);
    if(Math.hypot(p[0]-cx,p[1]-cy)>radius-12)return;
    drawMapIcon(ctx,key,p[0],p[1],size);
  };
  drawVenueMarker(crewBuilding,'crew');
  drawVenueMarker(barberBuilding,'barber');
  drawVenueMarker(gymBuilding,'gym');
  drawVenueMarker(window.__STARTER_HOUSE__,'home');
  drawVenueMarker(window.__SECOND_GIRLFRIEND_HOUSE__,'heart');
  drawVenueMarker(window.__BOAT_WORLD_TERMINAL__,'boat');
  for (const rose of window.__SECOND_GIRLFRIEND_HOUSE__?.roses || []) {
    if (rose?.root?.visible) { const p=radarPoint(rose.root.position.x,rose.root.position.z,player,radius); if(Math.hypot(p[0]-cx,p[1]-cy)<=radius-12) drawMapIcon(ctx,'rose',p[0],p[1],16); }
  }
  for (const property of window.__PROPERTY_SYSTEM__?.properties || []) {
    if (!property?.door) continue;
    drawVenueMarker(property, 'property', 17);
  }
  for(const entity of gangs){if(!entity.dead&&entity.root?.visible)drawDot(entity.root.position,`#${new THREE.Color(FACTIONS[entity.faction]?.color||0xffffff).getHexString()}`,3);}
  for(const entity of ambientPolice){if(!entity.dead&&entity.root?.visible)drawDot(entity.root.position,'#62b7ff',3);}
  for(const officer of game?.crimeWorld?.policeAgents||[]){if(officer?.root?.visible&&officer.state!=='dead')drawDot(officer.root.position,'#62b7ff',2.7);}
  for(const vehicle of serviceVehicles){if(!vehicle.root?.visible)continue; const p=radarPoint(vehicle.root.position.x,vehicle.root.position.z,player,radius); if(Math.hypot(p[0]-cx,p[1]-cy)>radius-12)continue; if(vehicle.police)drawMapIcon(ctx,'police',p[0],p[1],14); else if(vehicle===ambulance)drawMapIcon(ctx,'ambulance',p[0],p[1],15); else drawDot(vehicle.root.position,vehicle.faction?`#${new THREE.Color(FACTIONS[vehicle.faction]?.color||0xffffff).getHexString()}`:'#ffffff',2.4);}
  for(const pickup of window.__V71_HEALTH_PICKUPS__||[]){if(!pickup?.root?.visible)continue; const p=radarPoint(pickup.root.position.x,pickup.root.position.z,player,radius); if(Math.hypot(p[0]-cx,p[1]-cy)<=radius-12)drawMapIcon(ctx,pickup.kind==='heart'?'pickupHeart':'aspirin',p[0],p[1],15);}
  for(const npc of window.__V71_EXTRA_NPCS__||[]){
    if(!npc?.root?.visible||npc.passenger||npc.dead)continue;
    drawDot(npc.root.position,npc.kind==='dama'?'#ff74c8':'#d54848',npc.kind==='dama'?3:3.4);
  }
  for(const taxi of window.__V71_TAXIS__||[]){if(!taxi?.root?.visible)continue; const p=radarPoint(taxi.root.position.x,taxi.root.position.z,player,radius); if(Math.hypot(p[0]-cx,p[1]-cy)<=radius-12)drawMapIcon(ctx,'taxi',p[0],p[1],15);}
  const marineMarkers=window.__V81_MARINE_MARKERS__;
  const drawMarineMarker=(root,key,size=17)=>{
    if(!root?.visible)return;
    const p=radarPoint(root.position.x,root.position.z,player,radius);
    if(Math.hypot(p[0]-cx,p[1]-cy)<=radius-12)drawMapIcon(ctx,key,p[0],p[1],size,root.rotation?.y||0);
  };
  drawMarineMarker(marineMarkers?.boat,'boat',18);
  drawMarineMarker(marineMarkers?.npcBoat,'boat',15);
  for(const island of marineMarkers?.islands||[]){
    const position=island?.position;if(!position)continue;
    const p=radarPoint(position.x,position.z,player,radius);
    if(Math.hypot(p[0]-cx,p[1]-cy)<=radius-12)drawMapIcon(ctx,'island',p[0],p[1],17);
  }
  for(const onlinePlayer of window.__GTA_ONLINE__?.getRemoteMapStates?.()||[]){
    if(!onlinePlayer?.position)continue;
    const p=radarPoint(onlinePlayer.position.x,onlinePlayer.position.z,player,radius);
    if(Math.hypot(p[0]-cx,p[1]-cy)>radius-10)continue;
    ctx.fillStyle=onlinePlayer.color||'#ff8a00';ctx.strokeStyle='#ffffff';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.arc(p[0],p[1],onlinePlayer.vehicle?6:5,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#ffffff';ctx.font='900 8px Arial';ctx.textAlign='center';ctx.fillText(onlinePlayer.name||'JUGADOR',p[0],p[1]-9);
  }
  }

  let distanceText='';
  if(waypoint){
    const p=radarPoint(waypoint.x,waypoint.z,player,radius);
    const vx=p[0]-cx,vy=p[1]-cy,len=Math.max(.001,Math.hypot(vx,vy));
    const edge=Math.min(1,(radius-18)/len),tx=cx+vx*edge,ty=cy+vy*edge;
    ctx.strokeStyle='#ffb020';ctx.lineWidth=3;ctx.setLineDash([8,6]);ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(tx,ty);ctx.stroke();ctx.setLineDash([]);
    ctx.save();ctx.translate(tx,ty);ctx.rotate(Math.atan2(vy,vx)+Math.PI/2);ctx.fillStyle='#ff9f0a';ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(8,8);ctx.lineTo(0,4);ctx.lineTo(-8,8);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    const meters=Math.round(Math.hypot(worldToLogical(waypoint.x-player.x),worldToLogical(waypoint.z-player.z)));
    distanceText=`DESTINO ${meters} m`;
  }

  if(!drawMapIcon(ctx,'player',cx,cy,24)){ctx.save();ctx.translate(cx,cy);ctx.fillStyle='#fff';ctx.strokeStyle='#ff7b00';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(9,9);ctx.lineTo(0,5);ctx.lineTo(-9,9);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
  ctx.restore();
  ctx.strokeStyle='#000';ctx.lineWidth=10;ctx.beginPath();ctx.arc(cx,cy,123,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle='rgba(180,198,205,.65)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,117,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#fff';ctx.font='900 9px Arial';ctx.textAlign='center';ctx.fillText('N',cx,18);
  if(distanceText){ctx.fillStyle='rgba(0,0,0,.78)';ctx.fillRect(67,226,122,19);ctx.fillStyle='#ffd27d';ctx.font='900 10px Arial';ctx.fillText(distanceText,cx,239);}
}

function updateMap(){
  drawRadar(miniCanvas);
  if(fullMapVisible)updateFullMapSvg();
}

function setFullMapVisible(visible){
  fullMapVisible=Boolean(visible);
  window.__VICE_FULL_MAP_OPEN__=fullMapVisible;
  ensureUi();
  fullMap.style.display=fullMapVisible?'flex':'none';
  window.dispatchEvent(new CustomEvent('vice-map-visibility-changed',{detail:{visible:fullMapVisible}}));
  if(fullMapVisible){
    document.exitPointerLock?.();
    updateFullMapSvg();
  }else{
    const canvas=game?.renderer?.domElement;
    if(canvas?.isConnected&&document.pointerLockElement!==canvas){
      try{const result=canvas.requestPointerLock?.();result?.catch?.(()=>{});}catch{}
    }
  }
}

function updatePromptAndMap(){updateDoorPrompt();}

function patchBasePoliceArrest(){
  const world=game?.crimeWorld;if(!world||world.__v64LifePatched)return;world.__v64LifePatched=true;
  world.handlePlayerDown=()=>hospitalize('HAS SIDO ELIMINADO');
}

function onKeyDown(event){
  keys[event.code]=true;
  if(event.code==='Tab'){
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    if(event.repeat)return;
    setFullMapVisible(!fullMapVisible);
    return;
  }
  if(fullMapVisible){
    if(event.code==='Escape'){event.preventDefault();event.stopImmediatePropagation();setFullMapVisible(false);}
    else if(!event.repeat){event.preventDefault();event.stopImmediatePropagation();}
    return;
  }
  if(event.code==='KeyE'&&!event.repeat){
    const venue=nearestVenueEntrance();if(venue){event.preventDefault();event.stopPropagation();enterVenue(venue);return;}
    const near=nearestServiceDoor();if(near){event.preventDefault();event.stopPropagation();toggleBuilding(near);return;}
  }
  if(event.code==='KeyG'&&!event.repeat){
    const recruit=nearestRecruitableOrange();
    if(recruit){event.preventDefault();event.stopPropagation();recruitNearbyOrange();return;}
  }
  if((event.code==='KeyF'||event.code==='Numpad0')&&(window.__AIRCRAFT_SYSTEM__?.active||window.__POLICE_RESPONSE__?.activeTank)) { addWanted(1,'DISPARO DESDE VEHÍCULO'); handleRayShot(window.__AIRCRAFT_SYSTEM__?.active ? 58 : 75); }
}

function onKeyUp(event){keys[event.code]=false;}
function onMouseDown(event){if(event.button===0&&(window.__AIRCRAFT_SYSTEM__?.active||window.__POLICE_RESPONSE__?.activeTank)){addWanted(1,'DISPARO DESDE VEHÍCULO');handleRayShot(window.__AIRCRAFT_SYSTEM__?.active?58:75);}}

function restoreCityAfterCrewMatch() {
  const source=new URL(location.href).searchParams.get('from');
  if (!source) return;
  try {
    const saved = JSON.parse(localStorage.getItem(CITY_RETURN_STORAGE_KEY) || 'null');
    if (!saved || !Number.isFinite(saved.x) || !Number.isFinite(saved.z)) return;
    game.playerContainer.position.set(saved.x, groundAt(saved.x, saved.z, saved.y || 0) + .4, saved.z);
    game.playerContainer.rotation.y = Number(saved.yaw || 0);
    game.health = Math.max(1, Number(saved.health || 100));
    game.armor = Math.max(0, Number(saved.armor || 0));
    if (Number.isFinite(saved.money)) game.money = saved.money;
    game.state.vy = 0; game.state.onGround = true;
    const place=source==='barberia'?'LA BARBERÍA':source==='gimnasio'?'EL GIMNASIO':source==='propiedad'?'LA PROPIEDAD':source==='mundo-barco'?'MUNDO BARCO':'GAME OF CREW';
    const message=`HAS REGRESADO DE ${place}`;
    game.currentMessage = message; game.updateHUDState?.();
    setTimeout(() => { if (game.currentMessage === message) { game.currentMessage = undefined; game.updateHUDState?.(); } }, 2400);
  } catch {}
}

function applySavedHairToCityPlayer() {
  const visual=game?.playerModel;
  if(!visual)return;
  cityHairGroup?.parent?.remove(cityHairGroup); cityHairGroup=null;
  const style=localStorage.getItem('vice_city_hair_style')||'corto';
  if(style==='rapado')return;
  visual.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(visual); if(box.isEmpty())return;
  const size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
  const worldScale=new THREE.Vector3(); visual.getWorldScale(worldScale);
  const avgScale=Math.max(.0001,(Math.abs(worldScale.x)+Math.abs(worldScale.y)+Math.abs(worldScale.z))/3);
  const localRadius=(size.y*.075)/avgScale;
  const worldTop=new THREE.Vector3(center.x,box.max.y-size.y*.035,center.z);
  const localTop=visual.worldToLocal(worldTop.clone());
  const group=new THREE.Group(); group.name='V69_PLAYER_HAIR'; group.position.copy(localTop);
  const mat=new THREE.MeshLambertMaterial({color:0x17100c,roughness:1});
  if(style==='afro'){
    const hair=new THREE.Mesh(new THREE.SphereGeometry(localRadius*1.55,10,8),mat); hair.scale.y=.9; group.add(hair);
  }else if(style==='cresta'){
    const hair=new THREE.Mesh(new THREE.BoxGeometry(localRadius*.65,localRadius*2.0,localRadius*2.7),mat); hair.position.y=localRadius*.55; group.add(hair);
  }else if(style==='clasico'){
    for(let i=-2;i<=2;i++){const lock=new THREE.Mesh(new THREE.SphereGeometry(localRadius*.62,8,6),mat);lock.position.set(i*localRadius*.42,0,Math.abs(i)*localRadius*.08);group.add(lock);}
  }else{
    const hair=new THREE.Mesh(new THREE.SphereGeometry(localRadius*1.12,10,7,0,Math.PI*2,0,Math.PI*.58),mat);hair.position.y=-localRadius*.06;group.add(hair);
  }
  visual.add(group); cityHairGroup=group;
}

function monitorServiceVehicleTheft() {
  const activeRoot = game?.activeCar;
  const entry = activeRoot?.userData?.serviceVehicleEntry || null;
  if (entry !== lastActiveServiceVehicle) {
    if (entry) {
      entry.theftReported = true;
      if (entry.police) addWanted(2, 'ROBO DE VEHÍCULO POLICIAL');
      else if (entry.kind === 'gang' && entry.faction !== 'orange') notice(`HAS ROBADO UN VEHÍCULO DE ${FACTIONS[entry.faction]?.name || 'UNA BANDA'}`);
    }
    lastActiveServiceVehicle = entry;
  }
  if (!entry) lastActiveServiceVehicle = null;
}

function update(dt,elapsed){
  ensureCivilianEntities();ensureBasePoliceEntities();ensureVehicleEntities();patchWeapons();patchBasePoliceArrest();
  if(lockedPlayerPosition){
    game.playerContainer.position.copy(lockedPlayerPosition);
    game.state.vy=0;game.state.onGround=true;game.state.inWater=false;
  }
  monitorServiceVehicleTheft();updateCivilianBehavior(dt);updateGangAndPolice(dt,elapsed);updatePoliceCars(dt,elapsed);updateGangCars(dt,elapsed);updateVehicleCollisions();updateAircraftCrash();updateExplosions(dt);updatePromptAndMap();
  if(Number(game.health||100)<=0)hospitalize('HAS SIDO ELIMINADO');
}

function frame(now=performance.now()){
  requestAnimationFrame(frame);if(document.hidden||!window.__VICE_CITY_REVEALED__||window.__VICE_ZONE_TRANSITION__){lastTime=now;return;}const dt=Math.min(.1,Math.max(0,(now-lastTime)/1000));lastTime=now;updateAccumulator+=dt;mapAccumulator+=dt;
  if(updateAccumulator>=UPDATE_STEP){const step=Math.min(.15,updateAccumulator);updateAccumulator=0;update(step,now*.001);}
  if(mapAccumulator>=MAP_STEP){mapAccumulator=0;updateMap();}
}

async function install(){
  if(installed)return;game=window.__VICE_CITY_GAME__;if(!game?.city||!game?.playerContainer)return;installed=true;ensureUi();
  actorTargetHeight=playerVisualHeight();
  game.health = Math.max(150, Number(game.health || 0));
  restoreCityAfterCrewMatch();
  const textures=await loadTextures();
  await loadActorTemplate();
  actorTargetHeight=playerVisualHeight();
  for(const def of TERRITORY_DEFS)createTerritoryMarker(def);
  for(const def of TERRITORY_DEFS){
    const count=def.id==='orange_home'?5:4;
    for(let i=0;i<count;i++){spawnGangMember(def,i,textures);await idleTurn(60);}
  }
  for(let i=0;i<3;i++){spawnAmbientPolice(i,textures);await idleTurn(50);}
  buildServices();
  setTimeout(applySavedHairToCityPlayer,700);
  if (serviceVehicles.length) {
    try { await loadServiceAssetTemplates(); }
    catch(error){ console.warn('[territory-combat] Modelos de servicio opcionales incompletos.',error); }
  }
  window.addEventListener('keydown',onKeyDown,true);window.addEventListener('keyup',onKeyUp,true);window.addEventListener('mousedown',onMouseDown,true);
  window.__CITY_LIFE_SYSTEM__={
    hospitalize, arrest:arrestPlayer, damagePlayer, damageEntity, registerEntity,
    handleRayShot, meleeAttack, addWanted, territories:TERRITORY_DEFS, entities,
    gangs, ambientPolice, recruitedGang, serviceVehicles, hospital, station, ambulance, barberBuilding,
    updateMap,
    gymBuilding, crewBuilding, get waypoint(){return waypoint;},
    setWaypoint:(x,z)=>{waypoint={x,z};window.__VICE_LAST_WAYPOINT__=waypoint;saveWaypoint();updateMap();},
    clearWaypoint:()=>{waypoint=null;window.__VICE_LAST_WAYPOINT__=null;saveWaypoint();updateMap();},
    openMap:()=>setFullMapVisible(true),
    closeMap:()=>setFullMapVisible(false),
    toggleMap:()=>setFullMapVisible(!fullMapVisible),
    setRadarMode:(mode)=>{window.__VICE_RADAR_MODE__=mode||'map-icons';if(miniCanvas)miniCanvas.style.display=mode==='off'?'none':'block';updateMap();},
    get mapOpen(){return fullMapVisible;}
  };
  window.__TERRITORY_COMBAT_READY__=true;
  window.dispatchEvent(new CustomEvent('territory-combat-ready'));
  requestAnimationFrame(frame);
}

const wait=setInterval(()=>{game=window.__VICE_CITY_GAME__||game;if(!game?.city||!game?.playerContainer)return;clearInterval(wait);install().catch(error=>console.error('[territory-combat]',error));},150);
setTimeout(()=>clearInterval(wait),30000);
