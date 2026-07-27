/**
 * GTA MANUCHO V99 — ONLINE sincronizado con Supabase Realtime.
 * Personaje Soldier.glb original, animaciones, nombres, colores exactos,
 * vehículos a escala real, PVP, policía, objetos de trucos y mapa compartido.
 * V94: cero tirones (medición de vehículos cacheada, shaders precompilados
 * antes de conectar), amigos caminando de frente y panel rediseñado.
 */
import * as THREE from './bosque/libs/three.module.js';
import { GLTFLoader } from './bosque/bike-runtime/loaders/GLTFLoader.js';
import { DRACOLoader } from './bosque/bike-runtime/loaders/DRACOLoader.js';
import { clone as cloneSkeleton } from './bosque/bike-runtime/utils/SkeletonUtils.js';
import { createClient } from './libs/supabase.esm.js';

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.local.js';
const SEND_HZ = 16;
const WORLD_HZ = 4;
const WORLD_SCALE = 16;
const STORAGE_KEY = 'gta_manucho_online_v90';
const PLAYER_COLORS = ['#ff8a00','#111111','#f5f5f5','#ffd23f','#ff4d4d','#25d366','#4dd2ff','#b967ff','#ff6ec7'];
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const ONLINE_VEHICLE_DEFS = {
  JET:{file:'./aircraft-assets/jet_sf1.glb',length:300,yaw:0},
  HELICOPTER:{file:'./aircraft-assets/helicopter_u1h.glb',length:360,yaw:0},
  PLANE:{file:'./aircraft-assets/plane_fm2.glb',length:360,yaw:Math.PI},
  FLY:{file:'./aircraft-assets/fly_md5.glb',length:320,yaw:0}
};

let game = null;
let supabase = null;
let channel = null;
let connected = false;
let myId = null;
let myName = 'MANUCHO';
let myColor = '#ff8a00';
let roomCode = 'MANUCHO';
let hostId = null;
let panel = null;
let badge = null;
let lastSendAt = 0;
let lastWorldSendAt = 0;
let lastLocalShotAt = 0;
let localShotSequence = 0;
let avatarTemplatePromise = null;
let objectSequence = 0;
const livePresenceIds = new Set();
const remotes = new Map();
const worldGhosts = new Map();
const localObjectIds = new WeakMap();
const remoteCombatTargets = new Map();
const onlineVehicleTemplatePromises = new Map();
const pendingWorldGhosts = new Map();
const tempV = new THREE.Vector3();
const tempV2 = new THREE.Vector3();
const tempQ = new THREE.Quaternion();
const tempEuler = new THREE.Euler(0,0,0,'YXZ');
const tempBox = new THREE.Box3();
const tempSize = new THREE.Vector3();
const tempCenter = new THREE.Vector3();
const clock = new THREE.Clock();

function clampText(value, fallback, max) {
  return String(value || fallback).replace(/[<>]/g, '').trim().slice(0, max) || fallback;
}
function round(value, digits = 2) {
  const power = 10 ** digits;
  return Math.round((Number(value) || 0) * power) / power;
}
function loadPrefs() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || localStorage.getItem('gta_manucho_online_v85') || '{}');
    myName = clampText(saved.name, 'MANUCHO', 14).toUpperCase();
    myColor = PLAYER_COLORS.includes(saved.color) ? saved.color : '#ff8a00';
    roomCode = clampText(saved.room, 'MANUCHO', 16).toUpperCase().replace(/[^A-Z0-9-]/g, '') || 'MANUCHO';
  } catch {}
}
function savePrefs() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ name:myName, color:myColor, room:roomCode })); } catch {}
}
function safeClone(source) {
  if (!source) return null;
  try { return cloneSkeleton(source); } catch {}
  try { return source.clone(true); } catch { return null; }
}
function stripInteractiveData(root) {
  root?.traverse?.(object => {
    object.userData = { onlineGhost:true };
    object.castShadow = false;
    object.receiveShadow = false;
    object.frustumCulled = true;
  });
  if (root) root.userData = { onlineGhost:true };
}
function loadAvatarTemplate() {
  if (!avatarTemplatePromise) {
    avatarTemplatePromise = new GLTFLoader().loadAsync('./models/gltf/Soldier.glb').then(data => ({
      scene:data.scene,
      animations:data.animations || []
    })).catch(error => {
      console.error('[GTA ONLINE] No se pudo cargar Soldier.glb.', error);
      return null;
    });
  }
  return avatarTemplatePromise;
}
function tintModel(root, colorHex) {
  if (!root) return;
  const color = new THREE.Color(colorHex);
  root.traverse(object => {
    if (!object.isMesh && !object.isSkinnedMesh) return;
    const source = Array.isArray(object.material) ? object.material : [object.material];
    const cloned = source.map(material => {
      if (!material) return material;
      const next = material.clone();
      if (next.color) next.color.copy(color);
      if (next.emissive) next.emissive.setHex(0x000000);
      next.needsUpdate = true;
      return next;
    });
    object.material = Array.isArray(object.material) ? cloned : cloned[0];
    object.castShadow = false;
    object.receiveShadow = false;
  });
}
function applyColorToLocalPlayer() {
  const model = game?.soldierModel || game?.playerModel;
  if (!model) return;
  if (!model.userData.__onlineTintPrepared) {
    model.traverse(object => {
      if (!object.isMesh && !object.isSkinnedMesh) return;
      const mats = Array.isArray(object.material) ? object.material : [object.material];
      const clones = mats.map(material => material?.clone?.() || material);
      object.material = Array.isArray(object.material) ? clones : clones[0];
    });
    model.userData.__onlineTintPrepared = true;
  }
  const color = new THREE.Color(myColor);
  model.traverse(object => {
    if (!object.isMesh && !object.isSkinnedMesh) return;
    for (const material of (Array.isArray(object.material) ? object.material : [object.material])) {
      if (material?.color) material.color.copy(color);
      if (material) material.needsUpdate = true;
    }
  });
}
function makeNameSprite(text, colorHex) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,512,128);
  ctx.font = '900 54px "Arial Black",Arial,sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 13; ctx.strokeStyle = 'rgba(0,0,0,.95)';
  ctx.strokeText(text,256,64);
  ctx.fillStyle = colorHex; ctx.fillText(text,256,64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map:texture, transparent:true, depthTest:false, depthWrite:false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(150, 37.5, 1);
  sprite.renderOrder = 99999;
  sprite.userData.disposeOnline = () => { texture.dispose(); material.dispose(); };
  return sprite;
}
function setAction(remote, name) {
  if (!remote.actions || remote.action === name || !remote.actions[name]) return;
  const previous = remote.actions[remote.action];
  const next = remote.actions[name];
  previous?.fadeOut?.(.18);
  next.reset().fadeIn(.18).play();
  remote.action = name;
}
async function buildRemoteVisual(remote) {
  const data = await loadAvatarTemplate();
  if (!data || remotes.get(remote.id) !== remote) return;
  const visual = safeClone(data.scene);
  if (!visual) return;
  visual.name = `ONLINE_SOLDIER_${remote.id}`;
  // V91: la orientación mundial exacta llega desde el jugador remoto.
  // No se añade otro giro aquí porque provocaba que caminara de espaldas.
  visual.rotation.y = 0;
  visual.scale.set(20,20,20);
  tintModel(visual, remote.color);
  remote.visual = visual;
  remote.avatarRoot.add(visual);
  remote.mixer = new THREE.AnimationMixer(visual);
  const find = key => data.animations.find(clip => clip.name.toLowerCase() === key.toLowerCase()) || data.animations.find(clip => clip.name.toLowerCase().includes(key.toLowerCase()));
  remote.actions = {};
  for (const [name, clip] of [['Idle',find('Idle')],['Walk',find('Walk')],['Run',find('Run')]]) {
    if (clip) remote.actions[name] = remote.mixer.clipAction(clip);
  }
  remote.actions.Walk && (remote.actions.Walk.timeScale = 1.1);
  remote.actions.Run && (remote.actions.Run.timeScale = .95);
  remote.actions.Idle?.play();
  remote.action = 'Idle';
  remote.bones = {
    armR: visual.getObjectByName('mixamorig:RightArm') || visual.getObjectByName('RightArm'),
    armL: visual.getObjectByName('mixamorig:LeftArm') || visual.getObjectByName('LeftArm'),
    forearmR: visual.getObjectByName('mixamorig:RightForeArm') || visual.getObjectByName('RightForeArm'),
    spine: visual.getObjectByName('mixamorig:Spine') || visual.getObjectByName('Spine')
  };
  visual.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(visual);
  const height = Number.isFinite(box.max.y - remote.group.position.y) ? Math.max(70, box.max.y - remote.group.position.y) : 115;
  remote.label.position.y = Math.min(220, height + 22);
}
function ensureRemote(id, meta = {}) {
  if (!id || id === myId) return null;
  let remote = remotes.get(id);
  const nextName = clampText(meta.name, 'JUGADOR', 14).toUpperCase();
  const nextColor = PLAYER_COLORS.includes(meta.color) ? meta.color : '#ff8a00';
  if (!remote) {
    const group = new THREE.Group();
    group.name = `ONLINE_PLAYER_${id}`;
    const avatarRoot = new THREE.Group();
    const label = makeNameSprite(nextName,nextColor);
    label.position.y = 120;
    group.add(avatarRoot,label);
    game.scene.add(group);
    remote = {
      id, group, avatarRoot, label, visual:null, mixer:null, actions:null, action:'Idle', bones:null,
      name:nextName, color:nextColor, target:new THREE.Vector3(), targetYaw:0,
      moving:false, running:false, vehicle:null, vehicleGhost:null, lastSeen:performance.now(),
      hasTarget:false, shotUntil:0, health:150, wanted:0, vehiclePendingKey:''
    };
    remotes.set(id,remote);
    buildRemoteVisual(remote);
    updateBadge();
  } else if (remote.name !== nextName || remote.color !== nextColor) {
    remote.name = nextName; remote.color = nextColor;
    remote.label.userData.disposeOnline?.();
    remote.group.remove(remote.label);
    remote.label = makeNameSprite(nextName,nextColor);
    remote.label.position.y = 120;
    remote.group.add(remote.label);
    if (remote.visual) tintModel(remote.visual,nextColor);
  }
  return remote;
}
function removeRemote(id) {
  const remote = remotes.get(id);
  if (!remote) return;
  remote.label?.userData?.disposeOnline?.();
  remote.group.parent?.remove(remote.group);
  remote.vehicleGhost?.parent?.remove(remote.vehicleGhost);
  remotes.delete(id);
  for (const [key,ghost] of worldGhosts) if (key.startsWith(`${id}:`)) removeWorldGhost(key,ghost);
  updateBadge();
}
function resolveSource(type, code = '') {
  const normalized = String(code || '').toUpperCase();
  if (type === 'aircraft') return window.__AIRCRAFT_SYSTEM__?.aircraft?.find(entry => entry?.code === normalized && entry?.root)?.root || window.__AIRCRAFT_SYSTEM__?.aircraft?.find(entry => entry?.root)?.root;
  if (type === 'tank' || type === 'police-tank') return window.__POLICE_RESPONSE__?.activeTank?.root || window.__POLICE_RESPONSE__?.tanks?.find(entry => entry?.root)?.root;
  if (type === 'boat') return game?.activeBoat?.root || game?.activeBoat || window.__V84_MARINE_WORLD__?.mainBoat?.root || window.__V81_MARINE_WORLD__?.mainBoat?.root;
  if (type === 'car') {
    if (normalized === 'FERRARI' || normalized === 'CUSTOM') return window.__CUSTOM_CAR_SYSTEM__?.active?.root || window.__CUSTOM_CARS__?.find(entry => entry?.root)?.root;
    return game?.activeCar?.root || game?.activeCar || game?.baseScatteredCar || game?.trafficCars?.find(entry => entry?.mesh)?.mesh;
  }
  if (type === 'police-car') return window.__CITY_LIFE_SYSTEM__?.serviceVehicles?.find(entry => entry?.police && entry?.root)?.root || game?.baseScatteredCar;
  if (type === 'police-plane') return window.__POLICE_RESPONSE__?.policePlanes?.find(entry => entry?.root)?.root || resolveSource('aircraft','JET');
  if (type === 'police-person') return window.__CITY_LIFE_SYSTEM__?.ambientPolice?.find(entry => entry?.root)?.root || game?.crimeWorld?.policeAgents?.find(entry => entry?.root)?.root;
  return null;
}
function prepareVehicleGhost(root) {
  if (!root) return null;
  root.visible = true;
  root._isAlwaysVisible = true;
  root.traverse?.(object => {
    object.userData = { onlineGhost:true };
    object.visible = true;
    object.frustumCulled = false;
    object.castShadow = false;
    object.receiveShadow = false;
  });
  root.userData = { ...(root.userData || {}), onlineGhost:true };
  return root;
}
function normalizeOnlineVehicle(source, desiredLength, visualYaw = 0, carMode = false) {
  const visual = safeClone(source);
  if (!visual) return null;
  visual.position.set(0,0,0);
  visual.rotation.set(0,visualYaw,0);
  visual.scale.set(1,1,1);
  visual.updateMatrixWorld(true);
  tempBox.setFromObject(visual);
  tempBox.getSize(tempSize);
  if (carMode && tempSize.x > tempSize.z * 1.15) {
    visual.rotation.y += Math.PI / 2;
    visual.updateMatrixWorld(true);
    tempBox.setFromObject(visual);
    tempBox.getSize(tempSize);
  }
  const currentLength = Math.max(tempSize.x,tempSize.z,.001);
  visual.scale.setScalar(desiredLength/currentLength);
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
  return prepareVehicleGhost(holder);
}
async function loadOnlineVehicleTemplate(type, code = '') {
  const normalized = String(code || '').toUpperCase();
  const key = `${type}:${normalized}`;
  if (onlineVehicleTemplatePromises.has(key)) return onlineVehicleTemplatePromises.get(key);
  const promise = (async () => {
    const existing = resolveSource(type,normalized);
    if (existing) {
      const clone = safeClone(existing);
      if (clone) return prepareVehicleGhost(clone);
    }
    const loader = new GLTFLoader();
    if (type === 'aircraft' || type === 'police-plane') {
      const def = ONLINE_VEHICLE_DEFS[normalized] || ONLINE_VEHICLE_DEFS.JET;
      const gltf = await loader.loadAsync(def.file);
      return normalizeOnlineVehicle(gltf.scene,def.length,def.yaw,false);
    }
    if (type === 'tank' || type === 'police-tank') {
      const gltf = await loader.loadAsync('./tank-assets/scene.gltf');
      return normalizeOnlineVehicle(gltf.scene,185,Math.PI,false);
    }
    if (type === 'car' || type === 'police-car') {
      const draco = new DRACOLoader();
      draco.setDecoderPath(new URL('./bosque/bike-runtime/libs/draco/',import.meta.url).href);
      draco.setWorkerLimit(1);
      loader.setDRACOLoader(draco);
      try {
        const gltf = await loader.loadAsync('./car-assets/ferrari.glb');
        return normalizeOnlineVehicle(gltf.scene,88,0,true);
      } finally { draco.dispose(); }
    }
    return null;
  })().catch(error => {
    onlineVehicleTemplatePromises.delete(key);
    console.warn(`[GTA ONLINE] No se pudo preparar ${key}.`,error);
    return null;
  });
  onlineVehicleTemplatePromises.set(key,promise);
  return promise;
}
async function createGhostAsync(type, code) {
  const source = resolveSource(type,code);
  let clone = safeClone(source);
  if (!clone) {
    const template = await loadOnlineVehicleTemplate(type,code);
    clone = safeClone(template);
  }
  if (!clone) return null;
  prepareVehicleGhost(clone);
  game.scene.add(clone);
  return clone;
}
function fitOnlineGhostScale(root, transform) {
  if (!root || !Array.isArray(transform?.d) || transform.d.length !== 3) return;
  const sizeKey = transform.d.map(value => round(value,2)).join(':');
  if (root.userData.onlineSizeKey === sizeKey && Number.isFinite(root.userData.onlineScaleMultiplier)) {
    root.scale.multiplyScalar(root.userData.onlineScaleMultiplier);
    return;
  }
  root.updateMatrixWorld(true);
  tempBox.setFromObject(root);
  tempBox.getSize(tempSize);
  const wanted = Math.max(Number(transform.d[0])||0,Number(transform.d[1])||0,Number(transform.d[2])||0);
  const current = Math.max(tempSize.x,tempSize.y,tempSize.z,.001);
  const multiplier = THREE.MathUtils.clamp(wanted/current,.08,80);
  root.userData.onlineSizeKey = sizeKey;
  root.userData.onlineScaleMultiplier = multiplier;
  root.scale.multiplyScalar(multiplier);
  root.updateMatrixWorld(true);
}
function applyTransform(root, transform, lerp = false) {
  if (!root || !transform) return;
  tempV.set(transform.x || 0,transform.y || 0,transform.z || 0);
  tempQ.set(transform.qx || 0,transform.qy || 0,transform.qz || 0,Number.isFinite(transform.qw)?transform.qw:1).normalize();
  if (lerp) {
    root.position.lerp(tempV,.36);
    root.quaternion.slerp(tempQ,.38);
  } else {
    root.position.copy(tempV); root.quaternion.copy(tempQ);
  }
  if (Array.isArray(transform.s) && transform.s.length === 3) root.scale.set(transform.s[0],transform.s[1],transform.s[2]);
  else root.scale.set(1,1,1);
  fitOnlineGhostScale(root,transform);
  root.visible = true;
}
function beginRemoteVehicleLoad(remote, descriptor, key) {
  if (remote.vehiclePendingKey === key) return;
  remote.vehiclePendingKey = key;
  void createGhostAsync(descriptor.type,descriptor.code).then(ghost => {
    if (!ghost || remotes.get(remote.id) !== remote || remote.vehiclePendingKey !== key) {
      ghost?.parent?.remove(ghost);
      return;
    }
    remote.vehicleGhost?.parent?.remove(remote.vehicleGhost);
    ghost.userData.onlineVehicleKey = key;
    remote.vehicleGhost = ghost;
    remote.vehiclePendingKey = '';
    applyTransform(ghost,remote.vehicle?.transform || descriptor.transform,false);
  });
}
function ensureRemoteVehicle(remote, descriptor) {
  if (!descriptor) {
    if (remote.vehicleGhost) remote.vehicleGhost.visible = false;
    remote.vehiclePendingKey = '';
    remote.vehicle = null;
    return null;
  }
  const key = `${descriptor.type}:${descriptor.code || ''}`;
  if (remote.vehicleGhost?.userData.onlineVehicleKey !== key) {
    if (remote.vehicleGhost) {
      remote.vehicleGhost.parent?.remove(remote.vehicleGhost);
      remote.vehicleGhost = null;
    }
    beginRemoteVehicleLoad(remote,descriptor,key);
    return null;
  }
  remote.vehicleGhost.visible = true;
  applyTransform(remote.vehicleGhost,descriptor.transform,true);
  remote.vehicle = descriptor;
  return remote.vehicleGhost;
}
function localVehicle() {
  const aircraft = window.__AIRCRAFT_SYSTEM__?.active;
  if (aircraft?.root) return { type:'aircraft', code:aircraft.code || 'JET', root:aircraft.root };
  const tank = window.__POLICE_RESPONSE__?.activeTank;
  if (tank?.root) return { type:'tank', code:'TANK', root:tank.root };
  const boat = game?.activeBoat?.root || game?.activeBoat;
  if (boat?.position) return { type:'boat', code:'BOAT', root:boat };
  const custom = window.__CUSTOM_CAR_SYSTEM__?.active;
  if (custom?.root && (game?.activeCar === custom.root || custom.active)) return { type:'car', code:'FERRARI', root:custom.root };
  const car = game?.activeCar?.root || game?.activeCar;
  if (car?.position) return { type:'car', code:car.userData?.customCarData ? 'FERRARI' : 'SCATTERED', root:car };
  return null;
}
function measureDimsOnce(root) {
  // V94 ANTI-TIRONES: antes cada envío recorría TODA la jerarquía 3D del
  // vehículo con setFromObject (16 veces/seg con tu avión + 4 veces/seg por
  // CADA policía/tanque/patrulla del mundo). Ese recorrido era la causa de
  // los tirones al volar y de los congelones en online. Ahora las
  // dimensiones se miden UNA sola vez por objeto y quedan cacheadas.
  const cached = root.userData && root.userData.__onlineDims;
  if (cached) return cached;
  root.updateMatrixWorld?.(true);
  tempBox.setFromObject(root);
  tempBox.getSize(tempSize);
  const dims = [round(tempSize.x,2), round(tempSize.y,2), round(tempSize.z,2)];
  if (dims[0] < 1 && dims[1] < 1 && dims[2] < 1) return dims; // modelo aún cargando: no cachear
  if (!root.userData) root.userData = {};
  root.userData.__onlineDims = dims;
  return dims;
}
function serializeTransform(root) {
  if (!root) return null;
  const dims = measureDimsOnce(root);
  return {
    x:round(root.position.x),y:round(root.position.y),z:round(root.position.z),
    qx:round(root.quaternion.x,4),qy:round(root.quaternion.y,4),qz:round(root.quaternion.z,4),qw:round(root.quaternion.w,4),
    s:[round(root.scale.x,4),round(root.scale.y,4),round(root.scale.z,4)],
    d:[dims[0],dims[1],dims[2]]
  };
}
function localMoving() {
  const k = game?.keys || {};
  return Boolean(k.KeyW||k.KeyA||k.KeyS||k.KeyD||k.w||k.a||k.s||k.d||k.ArrowUp||k.ArrowDown||k.ArrowLeft||k.ArrowRight);
}
function localRunning() {
  const k = game?.keys || {};
  return Boolean(k.ShiftLeft||k.ShiftRight);
}
function getLocalState() {
  const vehicle = localVehicle();
  const p = game.playerContainer.position;
  let yaw = game.playerContainer.rotation.y || 0;
  const facingModel = game.soldierModel || game.playerModel;
  if (facingModel?.getWorldQuaternion) {
    facingModel.updateMatrixWorld?.(true);
    facingModel.getWorldQuaternion(tempQ);
    tempEuler.setFromQuaternion(tempQ,'YXZ');
    yaw = tempEuler.y;
  }
  while (yaw > Math.PI) yaw -= Math.PI*2;
  while (yaw < -Math.PI) yaw += Math.PI*2;
  return {
    id:myId, name:myName, color:myColor,
    x:round(p.x),y:round(p.y),z:round(p.z),ry:round(yaw,4),
    m:localMoving()?1:0,r:localRunning()?1:0,
    health:round(game.health || 0,1), armor:round(game.armor || 0,1),
    wanted:Number(game.crimeWorld?.getWantedLevel?.() ?? game.crimeWorld?.wantedLevel ?? game.wantedLevel ?? 0),
    vehicle:vehicle ? {type:vehicle.type,code:vehicle.code,transform:serializeTransform(vehicle.root)} : null,
    // V104: si vamos de pasajeros en el vehículo de otro, se manda de quién y
    // en qué asiento. El conductor sigue siendo el único que simula la física.
    ride:window.__V104_RIDE__ || null,
    at:Date.now()
  };
}
function updateRemoteFromState(payload) {
  if (!payload || payload.id === myId) return;
  const remote = ensureRemote(payload.id,payload);
  if (!remote) return;
  const nextX=Number(payload.x)||0,nextY=Number(payload.y)||0,nextZ=Number(payload.z)||0;
  // V94: signo corregido — el Soldier mira hacia +Z, así que el rumbo real
  // de avance es atan2(dx,dz). Con el signo invertido de V93 los amigos
  // caminaban de espaldas. Quieto usa la orientación que envía el jugador.
  // V103: se usa SIEMPRE la orientación que envía el jugador remoto, que es
  // literalmente la de su propio modelo. Deducirla del desplazamiento con
  // atan2 podía salir girada 180 grados y fallaba al caminar de lado.
  remote.targetYaw=Number.isFinite(Number(payload.ry))?Number(payload.ry):(remote.targetYaw||0);
  remote.target.set(nextX,nextY,nextZ);
  remote.moving = Boolean(payload.m);
  remote.running = Boolean(payload.r);
  remote.health = Number(payload.health)||0;
  remote.wanted = Number(payload.wanted)||0;
  remote.lastSeen = performance.now();
  remote.vehicle = payload.vehicle || null;
  remote.ride = payload.ride || null;
  if (!remote.hasTarget) {
    remote.group.position.copy(remote.target);
    remote.group.rotation.y = remote.targetYaw;
    remote.hasTarget = true;
  }
}
function drawRemoteShot(payload) {
  const remote = remotes.get(payload.id);
  if (remote) remote.shotUntil = performance.now()+380;
  const origin = new THREE.Vector3(payload.ox,payload.oy,payload.oz);
  const direction = new THREE.Vector3(payload.dx,payload.dy,payload.dz).normalize();
  const end = origin.clone().addScaledVector(direction,900);
  const geometry = new THREE.BufferGeometry().setFromPoints([origin,end]);
  const material = new THREE.LineBasicMaterial({color:remote?.color || 0xffd27d,transparent:true,opacity:.9});
  const line = new THREE.Line(geometry,material);
  game.scene.add(line);
  setTimeout(()=>{line.parent?.remove(line);geometry.dispose();material.dispose();},100);
}
function playerHitByRay(payload) {
  if (!game?.playerContainer || payload.id === myId) return false;
  const origin = new THREE.Vector3(payload.ox,payload.oy,payload.oz);
  const direction = new THREE.Vector3(payload.dx,payload.dy,payload.dz).normalize();
  const ray = new THREE.Ray(origin,direction);
  const boxes = [];
  const bodyRoot = game.playerModel || game.playerContainer;
  const bodyBox = new THREE.Box3().setFromObject(bodyRoot);
  const bodyCenter = game.playerContainer.position.clone().add(new THREE.Vector3(0,32,0));
  const reliableBodyBox = new THREE.Box3().setFromCenterAndSize(
    bodyCenter,
    new THREE.Vector3(40,82,40)
  );
  if (!bodyBox.isEmpty()) bodyBox.expandByScalar(9).union(reliableBodyBox);
  else bodyBox.copy(reliableBodyBox);
  boxes.push(bodyBox);

  // Al conducir, el jugador sigue siendo un blanco además del vehículo. En
  // V98 se comprobaba uno u otro y apuntar al cuerpo del motorista fallaba.
  const vehicleRoot = localVehicle()?.root;
  if (vehicleRoot) {
    const vehicleBox = new THREE.Box3().setFromObject(vehicleRoot);
    if (!vehicleBox.isEmpty()) boxes.push(vehicleBox.expandByScalar(6));
  }
  let hit = null;
  let hitDistance = Infinity;
  for (const box of boxes) {
    const point = ray.intersectBox(box, new THREE.Vector3());
    if (!point) continue;
    const distance = point.distanceTo(origin);
    if (distance < hitDistance) {
      hitDistance = distance;
      hit = point;
    }
  }
  if (!hit || hitDistance > 4200) return false;
  const damage = Math.max(8, Math.min(80, Number(payload.damage) || (payload.vehicleType ? 42 : 24)));
  let damageResult = null;
  if (window.__CITY_LIFE_SYSTEM__?.damagePlayer) {
    damageResult = window.__CITY_LIFE_SYSTEM__.damagePlayer(damage,`DISPARO DE ${clampText(payload.name,'JUGADOR',14)}`);
    if (damageResult === false) return false;
  } else {
    let remaining=damage;
    if(game.armor>0){const block=Math.min(game.armor,remaining);game.armor-=block;remaining-=block;}
    game.health=Math.max(0,(game.health||150)-remaining);game.updateHUDState?.();
    damageResult={applied:true,killed:game.health<=0,health:game.health,damage};
  }
  notice(`${clampText(payload.name,'JUGADOR',14)} TE DISPARÓ`,1200);
  channel?.send?.({
    type:'broadcast',
    event:'hit-confirm',
    payload:{
      shooterId:payload.id,
      targetId:myId,
      targetName:myName,
      damage:Number(damageResult?.damage) || damage,
      health:Math.max(0, Number(damageResult?.health ?? game.health) || 0),
      killed:Boolean(damageResult?.killed),
      shotId:payload.shotId || '',
      at:Date.now()
    }
  });
  return true;
}
function getShotData() {
  const origin = new THREE.Vector3();
  const direction = new THREE.Vector3();
  game.camera?.getWorldPosition(origin);
  game.camera?.getWorldDirection(direction);
  if (!Number.isFinite(direction.x) || direction.lengthSq()<.5) direction.set(0,0,-1).applyQuaternion(game.playerContainer.quaternion);
  const vehicle = localVehicle();
  const weaponId = window.__WEAPON_CRATES__?.selectedWeapon || 'pistol';
  const damage = weaponId === 'shotgun' ? 72 : weaponId === 'akm' ? 34 : weaponId === 'pistol' ? 42 : 18;
  return {
    id:myId,name:myName,color:myColor,
    ox:round(origin.x),oy:round(origin.y),oz:round(origin.z),
    dx:round(direction.x,4),dy:round(direction.y,4),dz:round(direction.z,4),
    vehicleType:vehicle?.type || '',weaponId,damage,
    shotId:`${myId || 'local'}:${Date.now()}:${++localShotSequence}`,at:Date.now()
  };
}
function broadcastShot() {
  if (!connected || !channel || performance.now()-lastLocalShotAt<90) return;
  lastLocalShotAt=performance.now();
  channel.send({type:'broadcast',event:'shot',payload:getShotData()});
}
function installShotHook() {
  if (game.__v86OnlineShotHook) return;
  game.__v86OnlineShotHook=true;
  if (typeof game.performShoot==='function') {
    const original=game.performShoot.bind(game);
    game.performShoot=function onlineShoot(...args){const result=original(...args);broadcastShot();return result;};
  }
  window.addEventListener('mousedown',event=>{
    if(event.button!==0)return;
    if(window.__AIRCRAFT_SYSTEM__?.active||window.__POLICE_RESPONSE__?.activeTank)setTimeout(broadcastShot,0);
  },true);
  window.addEventListener('keydown',event=>{
    if((event.code==='KeyF'||event.code==='Numpad0')&&(window.__AIRCRAFT_SYSTEM__?.active||window.__POLICE_RESPONSE__?.activeTank))setTimeout(broadcastShot,0);
  },true);
  window.addEventListener('vice-weapon-fired',()=>{
    if(game.activeCar?.userData?.v95BikeEntry)setTimeout(broadcastShot,0);
  });
}
function objectId(root,prefix) {
  if (!root) return null;
  if (!localObjectIds.has(root)) localObjectIds.set(root,`${prefix}-${++objectSequence}`);
  return localObjectIds.get(root);
}
function collectSpawnedObjects() {
  const objects=[];
  for(const entry of window.__AIRCRAFT_SYSTEM__?.aircraft||[]){
    if(!entry?.root?.visible||!entry.spawnedByCheat||entry===window.__AIRCRAFT_SYSTEM__?.active)continue;
    objects.push({id:objectId(entry.root,'aircraft'),type:'aircraft',code:entry.code||'',transform:serializeTransform(entry.root)});
  }
  for(const entry of window.__POLICE_RESPONSE__?.tanks||[]){
    if(!entry?.root?.visible||!entry.cheat||entry===window.__POLICE_RESPONSE__?.activeTank)continue;
    objects.push({id:objectId(entry.root,'tank'),type:'tank',code:'TANK',transform:serializeTransform(entry.root)});
  }
  return objects.slice(0,16);
}
function collectPoliceObjects() {
  const objects=[];
  const city=window.__CITY_LIFE_SYSTEM__;
  let index=0;
  for(const entry of city?.ambientPolice||[]){
    if(!entry?.root?.visible||entry.dead)continue;
    objects.push({id:`foot-${index++}`,type:'police-person',code:'VCPD',transform:serializeTransform(entry.root)});
  }
  index=0;
  for(const entry of city?.serviceVehicles||[]){
    if(!entry?.police||!entry?.root?.visible)continue;
    objects.push({id:`car-${index++}`,type:'police-car',code:'VCPD',transform:serializeTransform(entry.root)});
  }
  index=0;
  for(const entry of window.__POLICE_RESPONSE__?.tanks||[]){
    if(!entry?.police||!entry?.root?.visible)continue;
    objects.push({id:`tank-${index++}`,type:'police-tank',code:'TANK',transform:serializeTransform(entry.root)});
  }
  index=0;
  for(const entry of window.__POLICE_RESPONSE__?.policePlanes||[]){
    if(!entry?.root?.visible)continue;
    objects.push({id:`plane-${index++}`,type:'police-plane',code:'JET',transform:serializeTransform(entry.root)});
  }
  return objects.slice(0,12);
}
function removeWorldGhost(key,ghost=worldGhosts.get(key)) {
  if(!ghost)return;
  ghost.root?.parent?.remove(ghost.root);
  worldGhosts.delete(key);
}
function updateWorldGhosts(owner,kind,objects=[]) {
  const active=new Set();
  for(const descriptor of objects){
    const key=`${owner}:${kind}:${descriptor.id}`;
    active.add(key);
    let ghost=worldGhosts.get(key);
    const sourceKey=`${descriptor.type}:${descriptor.code||''}`;
    if(ghost&&ghost.sourceKey!==sourceKey){removeWorldGhost(key,ghost);ghost=null;}
    if(!ghost){
      const pending=pendingWorldGhosts.get(key);
      if(pending){pending.descriptor=descriptor;pending.lastSeen=performance.now();continue;}
      const state={descriptor,lastSeen:performance.now(),sourceKey};
      pendingWorldGhosts.set(key,state);
      void createGhostAsync(descriptor.type,descriptor.code).then(root=>{
        const latest=pendingWorldGhosts.get(key);
        pendingWorldGhosts.delete(key);
        if(!root||!latest||!active.has(key)&&performance.now()-latest.lastSeen>1600){root?.parent?.remove(root);return;}
        const created={root,sourceKey:latest.sourceKey,lastSeen:performance.now(),type:latest.descriptor.type};
        worldGhosts.set(key,created);
        applyTransform(root,latest.descriptor.transform,false);
      });
      continue;
    }
    ghost.lastSeen=performance.now();
    applyTransform(ghost.root,descriptor.transform,true);
  }
  for(const [key,ghost] of worldGhosts){
    if(!key.startsWith(`${owner}:${kind}:`))continue;
    if(!active.has(key)&&performance.now()-ghost.lastSeen>1200)removeWorldGhost(key,ghost);
  }
  for(const [key,pending] of pendingWorldGhosts){
    if(!key.startsWith(`${owner}:${kind}:`))continue;
    if(!active.has(key)&&performance.now()-pending.lastSeen>1200)pendingWorldGhosts.delete(key);
  }
}
function combatEntities() {
  const city=window.__CITY_LIFE_SYSTEM__;
  return [...(city?.gangs||[]),...(city?.ambientPolice||[])].filter(entity=>entity?.root);
}
function combatSnapshots() {
  return combatEntities().map((entity,index)=>({
    id:`${entity.faction||entity.type||'entity'}:${index}`,
    x:round(entity.root.position.x),y:round(entity.root.position.y),z:round(entity.root.position.z),
    ry:round(entity.root.rotation.y,4),health:round(entity.health||0,1),dead:Boolean(entity.dead),visible:Boolean(entity.root.visible)
  }));
}
function applyCombatSnapshots(snapshots=[]) {
  if(myId===hostId)return;
  const entities=combatEntities();
  const byId=new Map(entities.map((entity,index)=>[`${entity.faction||entity.type||'entity'}:${index}`,entity]));
  remoteCombatTargets.clear();
  for(const state of snapshots){
    const entity=byId.get(state.id);if(!entity)continue;
    remoteCombatTargets.set(entity,{state,at:performance.now()});
    entity.health=state.health;entity.dead=Boolean(state.dead);entity.root.visible=Boolean(state.visible)&&!entity.dead;
  }
}
function updateCombatAuthority() {
  if(myId===hostId)return;
  for(const [entity,target] of remoteCombatTargets){
    if(!entity?.root||performance.now()-target.at>1600)continue;
    const state=target.state;
    tempV.set(state.x,state.y,state.z);
    entity.root.position.lerp(tempV,.32);
    const delta=Math.atan2(Math.sin(state.ry-entity.root.rotation.y),Math.cos(state.ry-entity.root.rotation.y));
    entity.root.rotation.y+=delta*.3;
  }
}
function damageHostEntityFromShot(payload) {
  if(myId!==hostId)return;
  const origin=new THREE.Vector3(payload.ox,payload.oy,payload.oz);
  const direction=new THREE.Vector3(payload.dx,payload.dy,payload.dz).normalize();
  const ray=new THREE.Ray(origin,direction);
  let best=null,bestAlong=Infinity;
  for(const entity of combatEntities()){
    if(entity.dead||!entity.root.visible)continue;
    const point=entity.root.position.clone().add(new THREE.Vector3(0,35,0));
    const along=direction.dot(point.clone().sub(origin));
    if(along<0||along>5000)continue;
    if(ray.distanceSqToPoint(point)>55*55)continue;
    if(along<bestAlong){bestAlong=along;best=entity;}
  }
  if(best)window.__CITY_LIFE_SYSTEM__?.damageEntity?.(best,payload.vehicleType?42:24,'online');
}
function recalculateHost() {
  const ids=[...livePresenceIds].sort();
  hostId=ids[0]||myId;
}
function sendLoop() {
  requestAnimationFrame(sendLoop);
  if(!connected||!channel||!game?.playerContainer)return;
  const now=performance.now();
  if(now-lastSendAt>=1000/SEND_HZ){
    lastSendAt=now;
    channel.send({type:'broadcast',event:'state',payload:getLocalState()});
  }
  if(now-lastWorldSendAt>=1000/WORLD_HZ){
    lastWorldSendAt=now;
    channel.send({type:'broadcast',event:'objects',payload:{id:myId,objects:collectSpawnedObjects(),police:collectPoliceObjects(),at:Date.now()}});
    if(myId===hostId)channel.send({type:'broadcast',event:'world-state',payload:{id:myId,entities:combatSnapshots(),at:Date.now()}});
  }
}
function animate() {
  requestAnimationFrame(animate);
  const dt=Math.min(.08,clock.getDelta());
  const now=performance.now();
  updateCombatAuthority();
  for(const [id,remote] of remotes){
    if(now-remote.lastSeen>18000){removeRemote(id);continue;}
    if(!remote.hasTarget)continue;
    // V104: si este amigo va de pasajero en el vehículo de otro, de colocarlo
    // se encarga pasajeros-v104.js, que sabe dónde está cada asiento.
    if(remote.ride){remote.avatarRoot.visible=true;remote.mixer?.update(dt);setAction(remote,'Idle');continue;}
    const ghost=ensureRemoteVehicle(remote,remote.vehicle);
    if(ghost){
      remote.avatarRoot.visible=false;
      remote.group.position.lerp(ghost.position,.35);
      remote.group.quaternion.slerp(ghost.quaternion,.35);
      remote.label.position.y=150;
      // El grupo se queda con el cabeceo y el alabeo del vehículo.
      remote.tiltedByVehicle=true;
    }else{
      remote.avatarRoot.visible=true;
      // V103: AQUÍ ESTABA EL FALLO. Al ir en avión o en coche, la línea de
      // arriba copia el quaternion COMPLETO del vehículo (cabeceo y alabeo
      // incluidos). Al bajarse, este bloque sólo corregía rotation.y, así que
      // la inclinación del avión se quedaba puesta y el amigo aparecía tumbado
      // en el suelo. Y además, con el grupo inclinado, rotation.y ya no es el
      // rumbo real, por eso también parecía que caminaban al revés.
      // A pie la orientación es SIEMPRE un giro puro sobre el eje vertical.
      if(remote.tiltedByVehicle){
        tempEuler.setFromQuaternion(remote.group.quaternion,'YXZ');
        remote.group.rotation.set(0,tempEuler.y,0);
        remote.tiltedByVehicle=false;
      }
      remote.group.position.lerp(remote.target,.24);
      const delta=Math.atan2(Math.sin(remote.targetYaw-remote.group.rotation.y),Math.cos(remote.targetYaw-remote.group.rotation.y));
      remote.group.rotation.y+=delta*.25;
      setAction(remote,remote.moving?(remote.running?'Run':'Walk'):'Idle');
      remote.mixer?.update(dt);
      if(now<remote.shotUntil&&remote.bones){
        if(remote.bones.armR){remote.bones.armR.rotation.x=-1.45;remote.bones.armR.rotation.z=-.45;}
        if(remote.bones.forearmR)remote.bones.forearmR.rotation.x=.12;
        if(remote.bones.armL){remote.bones.armL.rotation.x=-1.1;remote.bones.armL.rotation.z=.35;}
        if(remote.bones.spine)remote.bones.spine.rotation.y=-.18;
      }
    }
  }
  for(const [key,ghost] of worldGhosts)if(now-ghost.lastSeen>5000)removeWorldGhost(key,ghost);
}
function setStatus(text,color='#ff8a00') {
  const node=document.getElementById('gta-online-status');if(node){node.textContent=text;node.style.color=color;}
  const dot=badge?.querySelector('.gta-online-dot');if(dot){dot.style.background=color;dot.style.boxShadow='0 0 10px '+color;}
}
function notice(text,duration=3600) {
  let node=document.getElementById('gta-online-notice');
  if(!node){node=document.createElement('div');node.id='gta-online-notice';node.style.cssText='position:fixed;left:50%;top:92px;transform:translateX(-50%);z-index:6500;padding:11px 18px;border:2px solid #ff8a00;background:rgba(8,6,3,.95);color:#ffe9c9;font:900 13px "Arial Black",Arial,sans-serif;letter-spacing:.07em;pointer-events:none;box-shadow:0 14px 40px rgba(0,0,0,.75)';document.body.appendChild(node);}
  node.textContent=text;node.style.display='block';clearTimeout(node.__timer);node.__timer=setTimeout(()=>node.style.display='none',duration);
}
function updateBadge() {
  if(!badge)return;
  const count=connected?remotes.size+1:0;
  badge.querySelector('.gta-online-count').textContent=connected?`ONLINE · ${count} JUGADOR${count===1?'':'ES'} · ${roomCode}`:'MODO ONLINE · PULSA O';
}
async function prewarmAvatarShaders() {
  // V94: compila por adelantado el shader del Soldier teñido. El congelón al
  // conectarse alguien era la primera compilación de materiales del avatar
  // remoto; ahora se hace en segundo plano mucho antes de conectar.
  try {
    const data = await loadAvatarTemplate();
    if (!data || !game?.scene) return;
    const ghost = safeClone(data.scene);
    if (!ghost) return;
    ghost.name = 'ONLINE_PREWARM_GHOST';
    ghost.scale.set(20,20,20);
    ghost.position.set(0,-100000,0);
    tintModel(ghost,'#25d366');
    game.scene.add(ghost);
    try { if (game.renderer?.compileAsync) await game.renderer.compileAsync(game.scene, game.camera); } catch {}
    setTimeout(() => { try { ghost.parent?.remove(ghost); } catch {} }, 2600);
  } catch {}
}
function prewarmOnlineTemplates() {
  // V92: descarga y prepara por adelantado los modelos que el otro jugador
  // puede usar (jet, helicóptero, avión, tanque y coche). Así, cuando aparecen
  // en la partida online ya están listos y la pantalla no se congela.
  // V94: se lanza al arrancar el juego (no al conectar) e incluye la
  // precompilación de shaders del avatar remoto.
  if (prewarmOnlineTemplates.__done) return;
  prewarmOnlineTemplates.__done = true;
  const jobs = [
    () => loadAvatarTemplate(),
    () => prewarmAvatarShaders(),
    () => loadOnlineVehicleTemplate('aircraft','JET'),
    () => loadOnlineVehicleTemplate('aircraft','HELICOPTER'),
    () => loadOnlineVehicleTemplate('aircraft','PLANE'),
    () => loadOnlineVehicleTemplate('tank','TANK'),
    () => loadOnlineVehicleTemplate('car','')
  ];
  let index = 0;
  const runNext = () => {
    if (index >= jobs.length) {
      // Compila los shaders una vez con todo cargado para evitar el tirón
      // del primer render de cada vehículo remoto.
      try {
        if (game?.renderer?.compileAsync) game.renderer.compileAsync(game.scene, game.camera).catch(()=>{});
      } catch {}
      return;
    }
    const job = jobs[index++];
    Promise.resolve().then(job).catch(()=>{}).finally(() => {
      if ('requestIdleCallback' in window) requestIdleCallback(runNext, { timeout: 2500 });
      else setTimeout(runNext, 350);
    });
  };
  setTimeout(runNext, 900);
}
async function connect() {
  if(connected)return;
  setStatus('CONECTANDO…','#ffd23f');
  try{
    if(!supabase)supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{realtime:{params:{eventsPerSecond:35}}});
    myId=myId||`p_${globalThis.crypto?.randomUUID?.()?.slice(0,8)||Math.random().toString(36).slice(2,10)}`;
    channel=supabase.channel(`gta-v86:${roomCode}`,{config:{presence:{key:myId},broadcast:{self:false,ack:false}}});
    channel.on('presence',{event:'sync'},()=>{
      const state=channel.presenceState();livePresenceIds.clear();livePresenceIds.add(myId);
      for(const key of Object.keys(state)){
        livePresenceIds.add(key);if(key===myId)continue;
        ensureRemote(key,state[key]?.[0]||{});
      }
      for(const id of [...remotes.keys()])if(!livePresenceIds.has(id))removeRemote(id);
      recalculateHost();updateBadge();
    });
    channel.on('presence',{event:'leave'},({key})=>{livePresenceIds.delete(key);if(key!==myId)removeRemote(key);recalculateHost();});
    channel.on('broadcast',{event:'state'},({payload})=>updateRemoteFromState(payload));
    channel.on('broadcast',{event:'shot'},({payload})=>{
      if(!payload||payload.id===myId)return;
      drawRemoteShot(payload);playerHitByRay(payload);damageHostEntityFromShot(payload);
    });
    channel.on('broadcast',{event:'hit-confirm'},({payload})=>{
      if(!payload||payload.shooterId!==myId)return;
      const target=clampText(payload.targetName,'JUGADOR',14);
      notice(payload.killed
        ? `JUGADOR ELIMINADO · ${target}`
        : `IMPACTO ONLINE · ${target} · VIDA ${Math.max(0,Math.round(Number(payload.health)||0))}`,1500);
      window.dispatchEvent(new CustomEvent('vice-combat-hit',{
        detail:{online:true,targetId:payload.targetId,damage:Number(payload.damage)||0,killed:Boolean(payload.killed)}
      }));
    });
    channel.on('broadcast',{event:'objects'},({payload})=>{
      if(!payload||payload.id===myId)return;
      updateWorldGhosts(payload.id,'objects',payload.objects||[]);
      updateWorldGhosts(payload.id,'police',payload.police||[]);
    });
    channel.on('broadcast',{event:'world-state'},({payload})=>{if(payload?.id===hostId)applyCombatSnapshots(payload.entities||[]);});
    channel.subscribe(async status=>{
      if(status==='SUBSCRIBED'){
        connected=true;livePresenceIds.add(myId);recalculateHost();
        await channel.track({name:myName,color:myColor,version:99,at:Date.now()});
        setStatus(`ONLINE · SERVIDOR ${roomCode}`,'#25d366');
        notice(`CONECTADO A ${roomCode} · JUGADORES, VEHÍCULOS, POLICÍA Y COMBATE SINCRONIZADOS`,5200);
        prewarmOnlineTemplates();
        panel?.classList.add('gta-online-min');updateBadge();
      }else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){connected=false;setStatus('ERROR DE CONEXIÓN · REINTENTA','#ff4d4d');}
      else if(status==='CLOSED'){connected=false;setStatus('DESCONECTADO','#ff8a00');}
    });
  }catch(error){console.error('[GTA ONLINE]',error);setStatus('SIN CONEXIÓN · MODO OFFLINE','#ff4d4d');}
}
async function disconnect() {
  if(channel){try{await channel.untrack();await supabase.removeChannel(channel);}catch{}}
  channel=null;connected=false;livePresenceIds.clear();hostId=null;
  for(const id of [...remotes.keys()])removeRemote(id);
  for(const [key,ghost] of [...worldGhosts])removeWorldGhost(key,ghost);
  setStatus('DESCONECTADO','#ff8a00');updateBadge();
}
function buildUi() {
  // V94: panel rediseñado al estilo gangsta de GTA — chapa negra con rayas
  // diagonales, dorado clásico, título tipo Pricedown (Impact en cursiva con
  // sombra dura), estrellas de búsqueda, fichas de color circulares y botón
  // dorado con relieve. Mismos IDs de siempre: solo cambia la piel.
  const style=document.createElement('style');
  style.textContent=`
  #gta-online-panel{position:fixed;right:18px;bottom:18px;z-index:6400;width:344px;padding:0 0 18px;color:#f3e3c3;font-family:Arial,sans-serif;background:repeating-linear-gradient(-45deg,rgba(255,255,255,.022) 0 2px,transparent 2px 9px),radial-gradient(120% 90% at 50% 0%,#241505 0%,#0d0a05 46%,#060504 100%);border:1px solid #000;outline:3px solid #f5a41c;outline-offset:-4px;box-shadow:0 0 0 1px #5b3b09,0 26px 70px rgba(0,0,0,.85),0 0 42px rgba(245,164,28,.16);animation:gtaPanelIn .28s cubic-bezier(.2,.9,.3,1.2)}
  @keyframes gtaPanelIn{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:none}}
  #gta-online-panel.gta-online-min{display:none}
  .gta-online-head{position:relative;padding:16px 16px 12px;text-align:center;border-bottom:2px solid #f5a41c;background:linear-gradient(180deg,rgba(245,164,28,.14),rgba(0,0,0,0) 78%)}
  .gta-online-head:before{content:'';position:absolute;left:0;right:0;top:0;height:7px;background:repeating-linear-gradient(-45deg,#f5a41c 0 12px,#0a0803 12px 24px);opacity:.92}
  .gta-online-stars{margin-top:7px;font:900 12px Arial;color:#f5a41c;letter-spacing:.4em;text-shadow:0 0 8px rgba(245,164,28,.65),1px 2px 0 #000}
  #gta-online-panel h3{margin:6px 0 0;color:#fff;font:italic 900 30px Impact,"Arial Black",Arial;letter-spacing:.02em;transform:skewX(-5deg);text-shadow:3px 3px 0 #000,4px 5px 0 rgba(0,0,0,.55),0 0 22px rgba(245,164,28,.35)}
  .gta-online-neon{margin-top:2px;font:italic 900 15px Impact,"Arial Black",Arial;letter-spacing:.55em;text-indent:.55em;color:#ff3fa4;text-shadow:0 0 9px #ff3fa4,0 0 20px rgba(255,63,164,.7),1px 2px 0 #000}
  #gta-online-panel .sub{font:800 8.5px Arial;color:#b9924e;letter-spacing:.2em;text-align:center;margin:10px 14px 2px}
  .gta-online-body{padding:2px 18px 0}
  #gta-online-panel label{display:block;margin:13px 0 5px;color:#f5a41c;font:900 9.5px Arial;letter-spacing:.16em;text-shadow:1px 1px 0 #000}
  #gta-online-panel input{width:100%;box-sizing:border-box;background:#070604;border:2px solid #3d2c0d;border-radius:2px;color:#ffedcd;padding:10px 11px;font:900 14px "Arial Black",Arial;letter-spacing:.05em;outline:none;box-shadow:inset 0 3px 9px rgba(0,0,0,.75);transition:border-color .15s,box-shadow .15s}
  #gta-online-panel input:focus{border-color:#f5a41c;box-shadow:inset 0 3px 9px rgba(0,0,0,.75),0 0 12px rgba(245,164,28,.4)}
  .gta-online-colors{display:flex;gap:8px;flex-wrap:wrap;padding:2px 0}
  .gta-online-colors button{width:31px;height:31px;border-radius:50%;border:2px solid #000;cursor:pointer;box-shadow:0 0 0 2px #453310,inset 0 2px 4px rgba(255,255,255,.22),0 3px 6px rgba(0,0,0,.6);transition:transform .12s}
  .gta-online-colors button:hover{transform:scale(1.14)}
  .gta-online-colors button.sel{transform:scale(1.18);box-shadow:0 0 0 2.5px #fff,0 0 14px #f5a41c,inset 0 2px 4px rgba(255,255,255,.25)}
  #gta-online-connect{width:100%;margin-top:17px;padding:13px;border:1px solid #131313;border-radius:2px;cursor:pointer;color:#160c00;background:linear-gradient(180deg,#ffd35e 0%,#f5a41c 48%,#c67c07 100%);font:italic 900 17px Impact,"Arial Black",Arial;letter-spacing:.12em;text-shadow:0 1px 0 rgba(255,255,255,.5);box-shadow:0 4px 0 #6f4703,0 9px 22px rgba(0,0,0,.55);transition:transform .08s,box-shadow .08s,filter .12s}
  #gta-online-connect:hover{filter:brightness(1.09)}
  #gta-online-connect:active{transform:translateY(3px);box-shadow:0 1px 0 #6f4703,0 4px 10px rgba(0,0,0,.5)}
  #gta-online-disconnect{width:100%;margin-top:9px;padding:8px;background:rgba(122,27,27,.14);border:1px solid #7a2a1b;border-radius:2px;color:#e8a08d;font:900 10px Arial;letter-spacing:.12em;cursor:pointer;transition:background .15s,color .15s}
  #gta-online-disconnect:hover{background:rgba(122,27,27,.32);color:#ffc8ba}
  #gta-online-status{margin:12px 4px 0;padding:8px;text-align:center;color:#f5a41c;font:900 10px "Arial Black",Arial;letter-spacing:.1em;background:rgba(0,0,0,.5);border:1px solid #2c2110;border-radius:2px;text-shadow:1px 1px 0 #000}
  #gta-online-close{position:absolute;right:10px;top:12px;z-index:2;background:rgba(0,0,0,.45);border:1px solid #5b3b09;border-radius:2px;color:#e8c491;width:24px;height:24px;line-height:20px;font-weight:900;cursor:pointer}
  #gta-online-close:hover{color:#fff;border-color:#f5a41c}
  #gta-online-badge{position:fixed;right:18px;bottom:18px;z-index:6390;display:flex;gap:9px;align-items:center;cursor:pointer;padding:9px 15px;color:#ffe9c9;font:italic 900 11px Impact,"Arial Black",Arial;letter-spacing:.1em;background:repeating-linear-gradient(-45deg,rgba(255,255,255,.03) 0 2px,transparent 2px 8px),linear-gradient(180deg,#1b1206,#090705);border:1px solid #000;outline:2px solid #f5a41c;outline-offset:-3px;box-shadow:0 10px 26px rgba(0,0,0,.7),0 0 18px rgba(245,164,28,.14);text-shadow:1px 1px 0 #000}
  #gta-online-badge:hover{filter:brightness(1.12)}
  .gta-online-dot{width:10px;height:10px;border-radius:50%;background:#f5a41c;border:1.5px solid #000;box-shadow:0 0 10px #f5a41c;animation:gtaDotPulse 1.6s ease-in-out infinite}
  @keyframes gtaDotPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.28)}}
  `;
  document.head.appendChild(style);
  panel=document.createElement('div');panel.id='gta-online-panel';panel.className='gta-online-min';panel.innerHTML=`<button id="gta-online-close">✕</button><div class="gta-online-head"><div class="gta-online-stars">★ ★ ★ ★ ★</div><h3>GTA MANUCHO</h3><div class="gta-online-neon">ONLINE</div></div><div class="sub">MUNDO · POLICÍA · VEHÍCULOS · COMBATE COMPARTIDO</div><div class="gta-online-body"><label>TU NOMBRE EN LA CALLE</label><input id="gta-online-name" maxlength="14" spellcheck="false" autocomplete="off"><label>COLOR DE TU PERSONAJE</label><div class="gta-online-colors" id="gta-online-colors"></div><label>CÓDIGO DEL SERVIDOR</label><input id="gta-online-room" maxlength="16" spellcheck="false" autocomplete="off"><button id="gta-online-connect">JUGAR ONLINE</button><button id="gta-online-disconnect">DESCONECTAR</button><div id="gta-online-status">DESCONECTADO · PULSA O</div></div>`;
  document.body.appendChild(panel);
  badge=document.createElement('div');badge.id='gta-online-badge';badge.innerHTML='<span class="gta-online-dot"></span><span class="gta-online-count">MODO ONLINE · PULSA O</span>';document.body.appendChild(badge);
  const nameInput=panel.querySelector('#gta-online-name'),roomInput=panel.querySelector('#gta-online-room'),colors=panel.querySelector('#gta-online-colors');
  nameInput.value=myName;roomInput.value=roomCode;
  for(const color of PLAYER_COLORS){const button=document.createElement('button');button.style.background=color;button.title=color;if(color===myColor)button.classList.add('sel');button.onclick=()=>{myColor=color;colors.querySelectorAll('button').forEach(x=>x.classList.remove('sel'));button.classList.add('sel');savePrefs();applyColorToLocalPlayer();if(connected)channel?.track({name:myName,color:myColor,version:94,at:Date.now()});};colors.appendChild(button);}
  badge.onclick=()=>panel.classList.toggle('gta-online-min');panel.querySelector('#gta-online-close').onclick=()=>panel.classList.add('gta-online-min');
  panel.querySelector('#gta-online-connect').onclick=async()=>{myName=clampText(nameInput.value,'MANUCHO',14).toUpperCase();const next=clampText(roomInput.value,'MANUCHO',16).toUpperCase().replace(/[^A-Z0-9-]/g,'')||'MANUCHO';nameInput.value=myName;roomInput.value=next;if(connected&&next!==roomCode)await disconnect();roomCode=next;savePrefs();applyColorToLocalPlayer();if(connected)await channel.track({name:myName,color:myColor,version:99,at:Date.now()});else connect();};
  panel.querySelector('#gta-online-disconnect').onclick=disconnect;
  for(const input of [nameInput,roomInput])for(const type of ['keydown','keyup','keypress'])input.addEventListener(type,event=>event.stopPropagation());
  window.addEventListener('keydown',event=>{if(event.code==='KeyO'&&!event.repeat&&document.activeElement?.tagName!=='INPUT')panel.classList.toggle('gta-online-min');});
}
function install() {
  game=window.__VICE_CITY_GAME__;
  if(!game?.scene||!game?.playerContainer||!game?.camera)return false;
  loadPrefs();buildUi();loadAvatarTemplate();installShotHook();
  let tintAttempts=0;
  const tintTimer=setInterval(()=>{
    applyColorToLocalPlayer();
    tintAttempts+=1;
    if(game?.soldierModel||tintAttempts>=24)clearInterval(tintTimer);
  },500);
  requestAnimationFrame(animate);requestAnimationFrame(sendLoop);
  // V99: precalentado en segundo plano nada más arrancar, sin esperar a conectar.
  setTimeout(()=>{try{prewarmOnlineTemplates();}catch{}},9000);
  window.__GTA_ONLINE__={connect,disconnect,broadcastShot,remotes,worldGhosts,get myId(){return myId;},get connected(){return connected;},get hostId(){return hostId;},getRemoteMapStates(){return [...remotes.values()].filter(remote=>remote.hasTarget).map(remote=>({id:remote.id,name:remote.name,color:remote.color,position:remote.vehicleGhost?.visible?remote.vehicleGhost.position:remote.group.position,yaw:remote.targetYaw,vehicle:Boolean(remote.vehicle)}));}};
  setTimeout(()=>notice('MODO ONLINE V99 DISPONIBLE · PULSA O',5000),3500);
  return true;
}
const wait=setInterval(()=>{if(install())clearInterval(wait);},300);
setTimeout(()=>clearInterval(wait),60000);
