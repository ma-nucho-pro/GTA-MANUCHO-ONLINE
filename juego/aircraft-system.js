/**
 * GTA MANUCHO V84 — código del proyecto.
 * Creado e integrado por Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * ARKEA AI / Manucho · conserva LICENSE, NOTICE.md y estos créditos al reutilizar.
 */
import * as THREE from './bosque/libs/three.module.js';
import { GLTFLoader } from './bosque/bike-runtime/loaders/GLTFLoader.js';

THREE.Cache.enabled = true;
window.__AIRCRAFT_SYSTEM_READY__ = false;

const AIRCRAFT_DEFS = {
  JET: {
    file: './aircraft-assets/jet_sf1.glb',
    label: 'SF1',
    desiredLength: 300,
    visualYaw: 0,
    maxSpeed: 1450,
    acceleration: 760,
    helicopter: false,
    forwardSign: -1,
    pilotSide: 1,
    seatLateral: 0.075,
    seatForward: 0.10,
    seatHeight: 0.50
  },
  HELICOPTER: {
    file: './aircraft-assets/helicopter_u1h.glb',
    label: 'U1H',
    desiredLength: 360,
    visualYaw: 0,
    maxSpeed: 760,
    acceleration: 500,
    helicopter: true,
    forwardSign: -1,
    pilotSide: 1,
    seatLateral: 0.075,
    seatForward: 0.05,
    seatHeight: 0.48
  },
  PLANE: {
    file: './aircraft-assets/plane_fm2.glb',
    label: 'FM2',
    desiredLength: 360,
    visualYaw: Math.PI,
    maxSpeed: 1180,
    acceleration: 660,
    helicopter: false,
    // El FM2 tiene el morro en el eje local opuesto a los demás modelos.
    // Solo este avión usa +Z como frente real.
    forwardSign: 1,
    pilotSide: 1,
    seatLateral: 0.075,
    seatForward: 0.12,
    seatHeight: 0.50
  },
  FLY: {
    file: './aircraft-assets/fly_md5.glb',
    label: 'MD5',
    desiredLength: 320,
    visualYaw: 0,
    maxSpeed: 700,
    acceleration: 460,
    helicopter: true,
    forwardSign: -1,
    pilotSide: 1,
    seatLateral: 0.075,
    seatForward: 0.04,
    seatHeight: 0.48
  }
};

const cache = new Map();
const lightweightMaterialCache = new WeakMap();
const preparedTextures = new WeakSet();
const aircraft = [];
const keys = Object.create(null);
const tempA = new THREE.Vector3();
const tempB = new THREE.Vector3();
const tempC = new THREE.Vector3();
const tempBox = new THREE.Box3();
const tempSize = new THREE.Vector3();
const tempCenter = new THREE.Vector3();
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const PROJECTILE_LIMIT = 36;
const PROJECTILE_GEOMETRY = new THREE.SphereGeometry(5, 7, 5);
const PROJECTILE_MATERIAL = new THREE.MeshBasicMaterial({ color: 0xffd54a });
const projectiles = [];

let game = null;
let active = null;
let cameraMode = 0;
let lastTime = performance.now();
let prompt = null;
let noticeNode = null;
let rendererPatched = false;
let commandBuffer = '';
let commandTimer = 0;
let animationAccumulator = 0;
let installed = false;
let arkeaExhibitPromise = null;
let crosshair = null;
let fireCooldown = 0;
let pilotState = null;
const pilotEuler = new THREE.Euler();
const pilotQuaternion = new THREE.Quaternion();

function idleTurn(timeout = 1200) {
  return new Promise(resolve => {
    if ('requestIdleCallback' in window) requestIdleCallback(() => resolve(), { timeout });
    else setTimeout(resolve, Math.min(timeout, 350));
  });
}

function createUi() {
  if (!prompt) {
    prompt = document.createElement('div');
    prompt.id = 'aircraft-prompt-v49';
    prompt.style.cssText = [
      'position:fixed','left:50%','bottom:116px','transform:translateX(-50%)','z-index:5000',
      'padding:10px 15px','border-radius:10px','background:rgba(3,10,18,.91)',
      'border:1px solid rgba(0,220,255,.78)','color:#eaffff','font:800 12px Arial,sans-serif',
      'letter-spacing:.045em','pointer-events:none','display:none','box-shadow:0 10px 34px rgba(0,0,0,.48)'
    ].join(';');
    document.body.appendChild(prompt);
  }
  if (!noticeNode) {
    noticeNode = document.createElement('div');
    noticeNode.id = 'aircraft-notice-v49';
    noticeNode.style.cssText = [
      'position:fixed','left:50%','top:92px','transform:translateX(-50%)','z-index:5100',
      'padding:10px 16px','border-radius:10px','background:rgba(5,8,16,.92)',
      'border:1px solid rgba(255,204,75,.72)','color:#fff3bd','font:900 13px Arial,sans-serif',
      'letter-spacing:.06em','pointer-events:none','display:none','box-shadow:0 12px 36px rgba(0,0,0,.55)'
    ].join(';');
    document.body.appendChild(noticeNode);
  }
  if (!crosshair) {
    crosshair = document.createElement('div');
    crosshair.id = 'aircraft-crosshair-v50';
    crosshair.textContent = '+';
    crosshair.style.cssText = [
      'position:fixed','left:50%','top:50%','transform:translate(-50%,-50%)','z-index:5050',
      'font:900 34px Arial,sans-serif','color:#fff6a8','text-shadow:0 0 8px #ffae00,0 0 2px #000',
      'pointer-events:none','display:none'
    ].join(';');
    document.body.appendChild(crosshair);
  }
}

function notice(text, duration = 2600) {
  createUi();
  noticeNode.textContent = text;
  noticeNode.style.display = 'block';
  clearTimeout(noticeNode.__hideTimer);
  noticeNode.__hideTimer = setTimeout(() => { noticeNode.style.display = 'none'; }, duration);
}

function groundAt(x, z, fallback = 0) {
  try {
    const value = game?.getGroundY?.(x, fallback + 900, z, false);
    return Number.isFinite(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function toLightweightMaterial(material) {
  if (!material) return material;
  if (lightweightMaterialCache.has(material)) return lightweightMaterialCache.get(material);

  const params = {
    color: material.color?.clone?.() || new THREE.Color(0xffffff),
    map: material.map || null,
    alphaMap: material.alphaMap || null,
    transparent: Boolean(material.transparent || (material.opacity ?? 1) < 0.999),
    opacity: material.opacity ?? 1,
    alphaTest: material.alphaTest || 0,
    side: material.side ?? THREE.FrontSide,
    vertexColors: Boolean(material.vertexColors),
    depthTest: material.depthTest !== false,
    depthWrite: material.depthWrite !== false,
    fog: material.fog !== false
  };

  // Los materiales físicos con normal/metalness/transmission crean shaders y
  // cargas GPU más costosas. Lambert conserva el color y la textura principal,
  // pero reduce mucho el trabajo cuando el avión entra por primera vez en cámara.
  const simplified = material.isMeshBasicMaterial
    ? new THREE.MeshBasicMaterial(params)
    : new THREE.MeshLambertMaterial({
        ...params,
        emissive: material.emissive?.clone?.() || new THREE.Color(0x000000),
        emissiveIntensity: Math.min(1, material.emissiveIntensity ?? 1)
      });
  simplified.name = `${material.name || 'aircraft'}_LIGHT_V53`;
  lightweightMaterialCache.set(material, simplified);
  return simplified;
}

function optimizeModel(root) {
  root.traverse(object => {
    if (!object.isMesh && !object.isSkinnedMesh) return;
    object.castShadow = false;
    object.receiveShadow = false;
    object.frustumCulled = true;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const simplified = materials.map(toLightweightMaterial);
    object.material = Array.isArray(object.material) ? simplified : simplified[0];
  });
}

function nextFrame() {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

function collectEntryTextures(entry) {
  const textures = [];
  const seen = new Set();
  entry.root.traverse(object => {
    if (!object.isMesh && !object.isSkinnedMesh) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      for (const texture of [material?.map, material?.alphaMap]) {
        if (!texture || seen.has(texture)) continue;
        seen.add(texture);
        texture.anisotropy = Math.min(texture.anisotropy || 1, 2);
        textures.push(texture);
      }
    }
  });
  return textures;
}

async function prepareAircraftGpu(entry) {
  const renderer = game?.renderer;
  if (!renderer || entry.gpuReady) return;

  // Se hace una textura por turno para evitar un pico único de subida a la GPU.
  for (const texture of collectEntryTextures(entry)) {
    if (preparedTextures.has(texture)) continue;
    await idleTurn(700);
    try { renderer.initTexture?.(texture); } catch {}
    preparedTextures.add(texture);
    await nextFrame();
  }

  await idleTurn(900);
  const cullingStates = [];
  entry.root.traverse(object => {
    if (!object.isMesh && !object.isSkinnedMesh) return;
    cullingStates.push([object, object.frustumCulled]);
    object.frustumCulled = false;
  });
  try {
    if (typeof renderer.compileAsync === 'function') {
      await renderer.compileAsync(entry.root, game.camera, game.scene);
    } else if (typeof renderer.compile === 'function') {
      renderer.compile(entry.root, game.camera, game.scene);
    }
  } catch (error) {
    console.warn('[aircraft-system] Preparación GPU parcial.', error);
  } finally {
    for (const [object, state] of cullingStates) object.frustumCulled = state;
  }
  entry.gpuReady = true;
}

function normalizeModel(source, definition) {
  const visual = source.clone(true);
  visual.position.set(0, 0, 0);
  visual.rotation.set(0, definition.visualYaw, 0);
  visual.scale.set(1, 1, 1);
  visual.updateMatrixWorld(true);
  optimizeModel(visual);

  tempBox.setFromObject(visual);
  tempBox.getSize(tempSize);
  const horizontalLength = Math.max(tempSize.x, tempSize.z, 0.001);
  const scale = definition.desiredLength / horizontalLength;
  visual.scale.setScalar(scale);
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
  tempBox.setFromObject(holder);
  tempBox.getSize(tempSize);

  return {
    root: holder,
    visual,
    length: Math.max(tempSize.x, tempSize.z),
    width: Math.min(tempSize.x, tempSize.z),
    height: tempSize.y
  };
}

async function loadDefinition(code) {
  code = code.toUpperCase();
  if (cache.has(code)) return cache.get(code);
  const definition = AIRCRAFT_DEFS[code];
  if (!definition) throw new Error(`Código de aeronave desconocido: ${code}`);
  const promise = (async () => {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(definition.file);
    return { gltf, definition };
  })();
  cache.set(code, promise);
  try {
    return await promise;
  } catch (error) {
    cache.delete(code);
    throw error;
  }
}

function startModelAnimations(entry, animations) {
  if (!animations?.length) return;
  entry.mixer = new THREE.AnimationMixer(entry.visual);
  const useful = animations.filter(clip => /rotor|propeller|spinner|hub/i.test(clip.name));
  const clips = useful.length ? useful : animations.slice(0, 1);
  for (const clip of clips) {
    const action = entry.mixer.clipAction(clip);
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.play();
  }
}

async function createAircraft(code, position, options = {}) {
  const normalizedCode = code.toUpperCase();
  const { gltf, definition } = await loadDefinition(normalizedCode);
  const prepared = normalizeModel(gltf.scene, definition);
  const entry = {
    code: normalizedCode,
    definition,
    root: prepared.root,
    visual: prepared.visual,
    length: prepared.length,
    width: prepared.width,
    height: prepared.height,
    speed: 0,
    verticalSpeed: 0,
    mixer: null,
    exhibit: Boolean(options.exhibit),
    spawnedByCheat: Boolean(options.spawnedByCheat),
    cameraMode: 0,
    pitch: 0,
    roll: 0,
    gpuReady: false
  };
  entry.root.name = `AIRCRAFT_${normalizedCode}_${aircraft.length}`;
  entry.root.position.copy(position);
  entry.root.rotation.order = 'YXZ';
  entry.root.rotation.set(0, options.yaw || 0, 0);
  entry.root.userData.__driveableAircraft = true;
  entry.root.userData.aircraftEntry = entry;
  entry.root.visible = false;
  entry.root._isAlwaysVisible = true;
  startModelAnimations(entry, gltf.animations);
  game.scene.add(entry.root);
  aircraft.push(entry);

  await prepareAircraftGpu(entry);
  entry.root.visible = true;

  if (aircraft.length > 18) {
    const disposable = aircraft.find(item => item.spawnedByCheat && item !== active);
    if (disposable) {
      disposable.root.parent?.remove(disposable.root);
      const index = aircraft.indexOf(disposable);
      if (index >= 0) aircraft.splice(index, 1);
    }
  }
  return entry;
}

function playerForward(distance) {
  const yaw = game?.playerContainer?.rotation?.y || 0;
  tempA.set(0, 0, -1).applyAxisAngle(Y_AXIS, yaw).multiplyScalar(distance);
  return tempA;
}

async function spawnByCode(code) {
  if (!game?.playerContainer) return null;
  const normalizedCode = code.toUpperCase();
  if (!AIRCRAFT_DEFS[normalizedCode]) return null;
  const offset = playerForward(420);
  const x = game.playerContainer.position.x + offset.x;
  const z = game.playerContainer.position.z + offset.z;
  const y = groundAt(x, z, game.playerContainer.position.y) + 18;
  try {
    const entry = await createAircraft(normalizedCode, new THREE.Vector3(x, y, z), {
      yaw: game.playerContainer.rotation.y,
      spawnedByCheat: true
    });
    notice(`${normalizedCode} APARECIÓ DELANTE · ACÉRCATE Y PULSA E`, 4200);
    return entry;
  } catch (error) {
    console.error('[aircraft-system] Error cargando aeronave.', error);
    notice(`NO SE PUDO CARGAR ${normalizedCode}`, 4200);
    return null;
  }
}

function nearestAircraft(maxDistance = 260) {
  if (!game?.playerContainer) return null;
  const p = game.playerContainer.position;
  let best = null;
  let bestSq = maxDistance * maxDistance;
  for (const entry of aircraft) {
    if (entry === active || !entry.root.visible) continue;
    const dx = entry.root.position.x - p.x;
    const dy = entry.root.position.y - p.y;
    const dz = entry.root.position.z - p.z;
    const sq = dx * dx + dy * dy + dz * dz;
    if (sq < bestSq) {
      bestSq = sq;
      best = entry;
    }
  }
  return best ? { entry: best, distance: Math.sqrt(bestSq) } : null;
}


function capturePilotState() {
  if (!game?.playerModel || pilotState) return;
  const bones = game.bones || {};
  const boneStates = new Map();
  for (const bone of Object.values(bones)) {
    if (!bone || boneStates.has(bone)) continue;
    boneStates.set(bone, {
      position: bone.position.clone(),
      quaternion: bone.quaternion.clone(),
      scale: bone.scale.clone()
    });
  }
  pilotState = {
    parent: game.playerModel.parent,
    position: game.playerModel.position.clone(),
    quaternion: game.playerModel.quaternion.clone(),
    scale: game.playerModel.scale.clone(),
    mixerTimeScale: game.playerMixer?.timeScale ?? 1,
    poseInitialized: false,
    boneStates
  };
}

function applyBoneDelta(bone, x = 0, y = 0, z = 0) {
  if (!bone || !pilotState?.boneStates?.has(bone)) return;
  const original = pilotState.boneStates.get(bone);
  bone.position.copy(original.position);
  bone.scale.copy(original.scale);
  pilotEuler.set(x, y, z, 'XYZ');
  pilotQuaternion.setFromEuler(pilotEuler);
  bone.quaternion.copy(original.quaternion).multiply(pilotQuaternion);
}

function applySeatedPilotPose(entry) {
  if (!game?.playerModel || !entry) return;
  capturePilotState();
  if (!pilotState.poseInitialized) {
    if (game.playerMixer) game.playerMixer.timeScale = 0;
    for (const action of Object.values(game.playerActions || {})) action?.stop?.();
    pilotState.poseInitialized = true;
  }

  const bones = game.bones || {};
  // Muslos hacia delante, rodillas flexionadas y brazos apoyados como si
  // sujetaran los mandos. Se reaplica cada frame para que ninguna animación
  // de caminar vuelva a poner al piloto de pie.
  applyBoneDelta(bones.leftUp, -1.22, 0.05, 0.08);
  applyBoneDelta(bones.rightUp, -1.22, -0.05, -0.08);
  applyBoneDelta(bones.leftLow, 1.48, 0, 0.04);
  applyBoneDelta(bones.rightLow, 1.48, 0, -0.04);
  applyBoneDelta(bones.armL, -0.62, 0.10, -0.32);
  applyBoneDelta(bones.armR, -0.62, -0.10, 0.32);
  applyBoneDelta(bones.forearmL, -1.02, 0.05, -0.08);
  applyBoneDelta(bones.forearmR, -1.02, -0.05, 0.08);
  applyBoneDelta(bones.spine, -0.10, 0, 0);
  applyBoneDelta(bones.spine1, 0.08, 0, 0);
  applyBoneDelta(bones.head, 0.04, 0, 0);

  game.playerModel.position.set(0, -18, 0);
  game.playerModel.rotation.set(0, 0, 0);
  game.playerModel.visible = true;
}

function restorePilotPose() {
  if (!pilotState || !game?.playerModel) return;
  game.playerModel.position.copy(pilotState.position);
  game.playerModel.quaternion.copy(pilotState.quaternion);
  game.playerModel.scale.copy(pilotState.scale);
  for (const [bone, state] of pilotState.boneStates) {
    bone.position.copy(state.position);
    bone.quaternion.copy(state.quaternion);
    bone.scale.copy(state.scale);
  }
  if (game.playerMixer) game.playerMixer.timeScale = pilotState.mixerTimeScale;
  for (const action of Object.values(game.playerActions || {})) action?.stop?.();
  game.playerActions?.Idle?.reset?.().play?.();
  game.playerModel.visible = true;
  pilotState = null;
}

function updatePilotSeat(entry) {
  if (!entry || !game?.playerContainer || !game?.playerModel) return;
  const side = entry.definition.pilotSide ?? 1;
  const seatX = entry.width * (entry.definition.seatLateral ?? 0.075) * side;
  const seatY = entry.height * (entry.definition.seatHeight ?? 0.50);
  const seatZ = entry.length * (entry.definition.seatForward ?? 0.08) * (entry.definition.forwardSign ?? -1);
  localToWorld(entry, seatX, seatY, seatZ, tempB);
  game.playerContainer.position.copy(tempB);
  game.playerContainer.quaternion.copy(entry.root.quaternion);
  applySeatedPilotPose(entry);
}

function enterAircraft(entry) {
  if (!entry || active || game.activeCar || game.activeBoat || game.activeRiddenHorse) return;
  active = entry;
  cameraMode = 0;
  entry.speed = 0;
  entry.verticalSpeed = 0;
  entry.pitch = entry.root.rotation.x || 0;
  entry.roll = entry.root.rotation.z || 0;
  capturePilotState();
  applySeatedPilotPose(entry);
  if (game.state) {
    game.state.isFlying = true;
    game.state.inWater = false;
    game.state.vy = 0;
  }
  crosshair.style.display = 'block';
  notice(`${entry.definition.label} · W/S VELOCIDAD · A/D GIRAR · ↑/↓ APUNTAR · Q/R INCLINAR · F O CLIC DISPARAR · E SALIR`, 6200);
}

function exitAircraft() {
  if (!active) return;
  const entry = active;
  const side = tempA.set(entry.width * 0.72, 0, 0).applyQuaternion(entry.root.quaternion);
  const x = entry.root.position.x + side.x;
  const z = entry.root.position.z + side.z;
  const y = groundAt(x, z, entry.root.position.y) + 2;
  game.playerContainer.position.set(x, y, z);
  game.playerContainer.rotation.set(0, entry.root.rotation.y, 0);
  restorePilotPose();
  if (game.state) {
    game.state.isFlying = false;
    game.state.inWater = false;
    game.state.vy = 0;
  }
  entry.speed = 0;
  active = null;
  cameraMode = 0;
  if (crosshair) crosshair.style.display = 'none';
  game.camera.fov = 60;
  game.camera.near = 0.1;
  game.camera.updateProjectionMatrix();
  notice('BAJASTE DE LA AERONAVE');
}

function cycleCamera() {
  if (!active) return;
  cameraMode = (cameraMode + 1) % 3;
  game.camera.fov = cameraMode === 1 ? 74 : 58;
  game.camera.near = cameraMode === 1 ? 0.5 : 0.1;
  game.camera.updateProjectionMatrix();
  notice(`CÁMARA AERONAVE ${cameraMode + 1}/3`, 1500);
}

function localToWorld(entry, x, y, z, target) {
  entry.root.updateWorldMatrix(true, false);
  target.set(x, y, z);
  return entry.root.localToWorld(target);
}

function applyAircraftCamera(camera) {
  if (!active) return;
  const entry = active;
  const forwardSign = entry.definition.forwardSign ?? -1;
  let smoothing = 0.26;
  if (cameraMode === 1) {
    // Cabina orientada hacia el morro real del modelo.
    localToWorld(entry, 0, entry.height * 0.62, entry.length * 0.12 * forwardSign, tempA);
    localToWorld(entry, 0, entry.height * 0.55, entry.length * 5.0 * forwardSign, tempB);
    smoothing = 1;
  } else if (cameraMode === 2) {
    // Dron detrás de la cola real, mirando hacia el morro.
    localToWorld(entry, 0, entry.length * 1.55, -entry.length * 1.7 * forwardSign, tempA);
    localToWorld(entry, 0, entry.height * 0.35, entry.length * 0.6 * forwardSign, tempB);
    smoothing = 0.18;
  } else {
    // Cámara trasera pegada al lado correcto de la aeronave.
    localToWorld(entry, 0, entry.height * 0.72, -entry.length * 0.72 * forwardSign, tempA);
    localToWorld(entry, 0, entry.height * 0.35, entry.length * 0.85 * forwardSign, tempB);
    smoothing = 0.34;
  }
  if (smoothing >= 1) camera.position.copy(tempA);
  else camera.position.lerp(tempA, smoothing);
  camera.lookAt(tempB);
  camera.updateMatrixWorld(true);
}

function patchRenderer() {
  if (rendererPatched || !game?.renderer) return;
  rendererPatched = true;
  const original = game.renderer.render.bind(game.renderer);
  game.renderer.render = (scene, camera) => {
    if (active) {
      updatePilotSeat(active);
      if (game.playerModel) game.playerModel.visible = cameraMode !== 1;
      applyAircraftCamera(camera);
    }
    return original(scene, camera);
  };
}

function acquireProjectile() {
  let projectile = projectiles.find(item => !item.active);
  if (!projectile && projectiles.length < PROJECTILE_LIMIT) {
    const mesh = new THREE.Mesh(PROJECTILE_GEOMETRY, PROJECTILE_MATERIAL);
    mesh.visible = false;
    mesh.frustumCulled = true;
    game.scene.add(mesh);
    projectile = { mesh, velocity: new THREE.Vector3(), life: 0, active: false };
    projectiles.push(projectile);
  }
  return projectile || null;
}

function fireAircraftWeapon() {
  if (!active || fireCooldown > 0) return;
  const projectile = acquireProjectile();
  if (!projectile) return;
  active.root.updateWorldMatrix(true, false);
  const forwardSign = active.definition.forwardSign ?? -1;
  localToWorld(active, 0, active.height * 0.42, active.length * 0.58 * forwardSign, tempA);
  tempB.set(0, 0, forwardSign).applyQuaternion(active.root.quaternion).normalize();
  projectile.mesh.position.copy(tempA);
  projectile.mesh.visible = true;
  projectile.velocity.copy(tempB).multiplyScalar(3000 + Math.max(0, active.speed));
  projectile.life = 2.1;
  projectile.active = true;
  fireCooldown = active.definition.helicopter ? 0.16 : 0.11;
}

function updateProjectiles(dt) {
  fireCooldown = Math.max(0, fireCooldown - dt);
  for (const projectile of projectiles) {
    if (!projectile.active) continue;
    projectile.mesh.position.addScaledVector(projectile.velocity, dt);
    projectile.life -= dt;
    if (projectile.life <= 0) {
      projectile.active = false;
      projectile.mesh.visible = false;
    }
  }
}

function onAircraftMouseMove(event) {
  if (!active || !document.pointerLockElement) return;
  active.pitch = THREE.MathUtils.clamp(active.pitch - event.movementY * 0.0015, -0.72, 0.72);
  active.root.rotation.y -= event.movementX * 0.0018;
}

function onAircraftMouseDown(event) {
  if (!active || event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  fireAircraftWeapon();
}

function updateActive(entry, dt) {
  const forward = keys.KeyW ? 1 : 0;
  const brake = keys.KeyS ? 1 : 0;
  const turn = (keys.KeyA ? 1 : 0) - (keys.KeyD ? 1 : 0);
  const pitchInput = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
  const rollInput = (keys.KeyQ ? 1 : 0) - (keys.KeyR ? 1 : 0);
  const rise = keys.Space ? 1 : 0;
  const descend = (keys.KeyC || keys.ControlLeft || keys.ControlRight) ? 1 : 0;
  const boost = keys.ShiftLeft || keys.ShiftRight;
  const maxSpeed = entry.definition.maxSpeed * (boost ? 1.35 : 1);

  if (forward) entry.speed = Math.min(maxSpeed, entry.speed + entry.definition.acceleration * dt);
  else if (brake) entry.speed = Math.max(-maxSpeed * 0.22, entry.speed - entry.definition.acceleration * 0.9 * dt);
  else entry.speed *= Math.exp(-0.45 * dt);

  const turnRate = entry.definition.helicopter ? 1.25 : 0.78;
  entry.root.rotation.y += turn * turnRate * dt * (entry.speed < -10 ? -1 : 1);
  entry.pitch = THREE.MathUtils.clamp(entry.pitch + pitchInput * (entry.definition.helicopter ? 0.95 : 0.78) * dt, -0.72, 0.72);
  const targetRoll = THREE.MathUtils.clamp(rollInput * 0.6 - turn * (entry.definition.helicopter ? 0.22 : 0.42), -0.72, 0.72);
  entry.roll += (targetRoll - entry.roll) * (1 - Math.exp(-4.8 * dt));
  entry.root.rotation.x = entry.pitch;
  entry.root.rotation.z = entry.roll;

  const verticalTarget = (rise - descend) * (entry.definition.helicopter ? 520 : 620);
  entry.verticalSpeed += (verticalTarget - entry.verticalSpeed) * (1 - Math.exp(-3.8 * dt));
  if (!rise && !descend) entry.verticalSpeed *= Math.exp(-1.5 * dt);

  tempA.set(0, 0, entry.definition.forwardSign ?? -1).applyQuaternion(entry.root.quaternion).normalize();
  entry.root.position.addScaledVector(tempA, entry.speed * dt);
  entry.root.position.y += entry.verticalSpeed * dt;

  const floor = groundAt(entry.root.position.x, entry.root.position.z, 0) + 4;
  if (entry.root.position.y < floor) {
    entry.root.position.y = floor;
    entry.verticalSpeed = Math.max(0, entry.verticalSpeed);
    entry.pitch = Math.min(entry.pitch, 0.12);
  }

  entry.visual.rotation.x += (0 - entry.visual.rotation.x) * (1 - Math.exp(-5 * dt));
  entry.visual.rotation.z += (0 - entry.visual.rotation.z) * (1 - Math.exp(-5 * dt));
  entry.root.updateWorldMatrix(true, false);

  updatePilotSeat(entry);
  if (game.state) {
    game.state.vy = 0;
    game.state.onGround = false;
    game.state.inWater = false;
    game.state.isFlying = true;
  }

  if (keys.KeyF || keys.Numpad0) fireAircraftWeapon();

  if (game.keys) {
    for (const key of ['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyC','KeyQ','KeyR','KeyF']) {
      game.keys[key] = false;
    }
  }
}

function updatePrompt() {
  if (!prompt) return;
  if (active) {
    prompt.textContent = `F/CLIC · DISPARAR · ↑/↓ APUNTAR · Q/R INCLINAR · V CÁMARA · E BAJAR · ${Math.abs(active.speed).toFixed(0)}`;
    prompt.style.display = 'block';
    return;
  }
  const nearby = nearestAircraft();
  if (nearby) {
    prompt.textContent = `E · SUBIR A ${nearby.entry.definition.label} · ${nearby.distance.toFixed(0)} m`;
    prompt.style.display = 'block';
  } else {
    prompt.style.display = 'none';
  }
}

function onKeyDown(event) {
  keys[event.code] = true;
  if (event.repeat) return;

  if (active && (event.code === 'KeyF' || event.code === 'Numpad0')) {
    event.preventDefault();
    event.stopPropagation();
    fireAircraftWeapon();
    return;
  }

  const target = event.target;
  const editing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
  if (!editing && event.key?.length === 1 && /[a-z]/i.test(event.key)) {
    clearTimeout(commandTimer);
    commandBuffer = (commandBuffer + event.key.toUpperCase()).slice(-16);
    commandTimer = setTimeout(() => { commandBuffer = ''; }, 1800);
    for (const command of ['HELICOPTER', 'PLANE', 'JET', 'FLY']) {
      if (commandBuffer.endsWith(command)) {
        commandBuffer = '';
        event.preventDefault();
        spawnByCode(command);
        return;
      }
    }
  }

  if (event.code === 'KeyE') {
    if (active) {
      event.preventDefault();
      event.stopPropagation();
      exitAircraft();
      return;
    }
    const nearby = nearestAircraft();
    if (nearby) {
      event.preventDefault();
      event.stopPropagation();
      enterAircraft(nearby.entry);
    }
  } else if (event.code === 'KeyV' && active) {
    event.preventDefault();
    event.stopPropagation();
    cycleCamera();
  }
}

function onKeyUp(event) {
  keys[event.code] = false;
}

function update(now = performance.now()) {
  requestAnimationFrame(update);
  const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
  lastTime = now;
  if (!window.__VICE_CITY_REVEALED__ || document.hidden || window.__VICE_ZONE_TRANSITION__) return;

  if (active) updateActive(active, dt);
  else if (pilotState) restorePilotPose();
  updateProjectiles(dt);
  animationAccumulator += dt;
  if (animationAccumulator >= 1 / 15) {
    const step = Math.min(0.1, animationAccumulator);
    animationAccumulator = 0;
    const player = game?.playerContainer?.position;
    for (const entry of aircraft) {
      if (!entry.mixer) continue;
      if (entry === active || !player || entry.root.position.distanceToSquared(player) < 4200 * 4200) {
        entry.mixer.update(step);
      }
    }
  }
  updatePrompt();
}

function makeSignTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1536;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#020707';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#ff00c8';
  ctx.lineWidth = 20;
  ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);
  ctx.fillStyle = '#ff00c8';
  ctx.textAlign = 'center';
  ctx.font = '900 74px Arial';
  ctx.fillText('ARKEA · AIRCRAFT EXHIBIT', canvas.width / 2, 132);
  ctx.fillStyle = '#f2f8ff';
  ctx.font = '800 38px Arial';
  ctx.fillText('SF1 · U1H · FM2 · MD5', canvas.width / 2, 224);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}


function addBoardingStairs(entry, exhibitRoot, baseY, yaw) {
  const stairRoot = new THREE.Group();
  stairRoot.name = `ESCALERA_${entry.definition.label}_V55`;
  stairRoot.position.set(entry.root.position.x, baseY, entry.root.position.z);
  stairRoot.rotation.y = yaw;

  const stepMaterial = new THREE.MeshStandardMaterial({ color: 0xc8cbd2, roughness: 0.82, metalness: 0.28 });
  const railMaterial = new THREE.MeshStandardMaterial({ color: 0x303842, roughness: 0.56, metalness: 0.72 });
  const stepCount = 9;
  const stepDepth = 20;
  const stepWidth = Math.max(64, Math.min(105, entry.length * 0.27));
  const totalRise = Math.max(80, entry.height * 0.72);
  const stepRise = totalRise / stepCount;
  const sideSign = entry.definition.pilotSide ?? 1;
  const sideStart = entry.width * 0.58 * sideSign;

  for (let i = 0; i < stepCount; i++) {
    const level = stepCount - i;
    const height = level * stepRise;
    const localX = sideStart + sideSign * (i * stepDepth + stepDepth * 0.5);
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(stepDepth, height, stepWidth),
      stepMaterial
    );
    step.position.set(localX, height * 0.5, 0);
    step.castShadow = false;
    step.receiveShadow = true;
    stairRoot.add(step);

    if (typeof game.addObstacle === 'function') {
      const world = new THREE.Vector3(localX, 0, 0).applyAxisAngle(Y_AXIS, yaw).add(entry.root.position);
      const rotated = Math.abs(Math.sin(yaw)) > 0.7;
      const obstacleW = rotated ? stepWidth : stepDepth;
      const obstacleD = rotated ? stepDepth : stepWidth;
      game.addObstacle(world.x, world.z, obstacleW, obstacleD, height, baseY);
    }
  }

  const landing = new THREE.Mesh(
    new THREE.BoxGeometry(54, 8, stepWidth + 10),
    stepMaterial
  );
  landing.position.set(sideStart - sideSign * 20, totalRise - 4, 0);
  landing.castShadow = false;
  landing.receiveShadow = true;
  stairRoot.add(landing);
  if (typeof game.addObstacle === 'function') {
    const landingLocalX = sideStart - sideSign * 20;
    const world = new THREE.Vector3(landingLocalX, 0, 0).applyAxisAngle(Y_AXIS, yaw).add(new THREE.Vector3(entry.root.position.x, 0, entry.root.position.z));
    const rotated = Math.abs(Math.sin(yaw)) > 0.7;
    game.addObstacle(
      world.x,
      world.z,
      rotated ? stepWidth + 10 : 54,
      rotated ? 54 : stepWidth + 10,
      totalRise,
      baseY
    );
  }

  const railHeight = 36;
  const railGeo = new THREE.CylinderGeometry(2.3, 2.3, railHeight, 8);
  for (const zSide of [-1, 1]) {
    for (let i = 0; i <= stepCount; i += 2) {
      const localX = sideStart + sideSign * (i * stepDepth);
      const localY = Math.max(stepRise, (stepCount - Math.min(i, stepCount - 1)) * stepRise) + railHeight * 0.5;
      const post = new THREE.Mesh(railGeo, railMaterial);
      post.position.set(localX, localY, zSide * (stepWidth * 0.5 + 4));
      post.castShadow = false;
      stairRoot.add(post);
    }
  }

  exhibitRoot.add(stairRoot);
}

async function buildArkeaExhibit() {
  if (window.__ARKEA_AIRCRAFT_EXHIBIT_READY__) return;
  if (arkeaExhibitPromise) return arkeaExhibitPromise;
  arkeaExhibitPromise = buildArkeaExhibitInternal();
  try {
    return await arkeaExhibitPromise;
  } finally {
    if (!window.__ARKEA_AIRCRAFT_EXHIBIT_READY__) arkeaExhibitPromise = null;
  }
}

async function buildArkeaExhibitInternal() {
  const existingExhibit = game?.scene?.getObjectByName?.('ARKEA_AIRCRAFT_GROUND_PLATFORM_V53');
  if (existingExhibit && aircraft.length >= 4) {
    window.__ARKEA_AIRCRAFT_EXHIBIT_READY__ = true;
    window.dispatchEvent(new CustomEvent('arkea-aircraft-exhibit-ready'));
    return;
  }
  // V53: el disparador invisible del Boeing antiguo se elimina del juego base. Las cuatro
  // aeronaves actuales quedan sobre una plataforma muy fina y al nivel real
  // del piso de ARKEA, sin carteles flotantes ni estructuras elevadas.
  const centerX = (1500 - 130) * 16;
  const centerZ = (300 + 40) * 16;
  const groundY = groundAt(centerX, centerZ, game?.playerContainer?.position?.y || 0);
  const platformThickness = 1.2;
  const platformTopY = groundY + platformThickness;
  const root = new THREE.Group();
  root.name = 'ARKEA_AIRCRAFT_GROUND_PLATFORM_V53';

  const foundation = new THREE.Mesh(
    new THREE.BoxGeometry(1500, platformThickness, 980),
    new THREE.MeshLambertMaterial({ color: 0x3b4149 })
  );
  foundation.position.set(centerX, groundY + platformThickness * 0.5, centerZ);
  foundation.receiveShadow = true;
  foundation.castShadow = false;
  foundation.matrixAutoUpdate = false;
  foundation.updateMatrix();
  root.add(foundation);
  game.scene.add(root);

  // Plataforma física casi al ras del terreno para que el personaje y los
  // aviones estén a la misma altura visual.
  if (typeof game.addObstacle === 'function') {
    game.addObstacle(centerX, centerZ, 1500, 980, platformThickness, groundY);
  }

  // V55: orientación invertida respecto a V54 y acceso por el costado
  // contrario. Las escaleras siguen automáticamente el nuevo lado del piloto.
  const placements = [
    ['JET', centerX - 470, centerZ - 210, Math.PI * 0.5],
    ['HELICOPTER', centerX + 420, centerZ - 180, -Math.PI * 0.5],
    ['PLANE', centerX - 430, centerZ + 260, Math.PI * 0.5],
    ['FLY', centerX + 430, centerZ + 260, -Math.PI * 0.5]
  ];

  for (const [code, x, z, yaw] of placements) {
    await idleTurn(900);
    try {
      const entry = await createAircraft(code, new THREE.Vector3(x, platformTopY + 0.35, z), { exhibit: true, yaw });
      entry.speed = 0;
      addBoardingStairs(entry, root, platformTopY, yaw);
      await nextFrame();
    } catch (error) {
      console.warn(`[aircraft-system] No se pudo añadir ${code} a ARKEA.`, error);
    }
  }
  window.__ARKEA_AIRCRAFT_EXHIBIT_READY__ = true;
  window.dispatchEvent(new CustomEvent('arkea-aircraft-exhibit-ready'));
}

async function install() {
  if (installed) return;
  game = window.__VICE_CITY_GAME__;
  if (!game?.scene || !game?.renderer || !game?.playerContainer) return;
  installed = true;
  createUi();
  patchRenderer();
  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('keyup', onKeyUp, true);
  window.addEventListener('mousemove', onAircraftMouseMove, true);
  window.addEventListener('mousedown', onAircraftMouseDown, true);
  window.__AIRCRAFT_SYSTEM__ = { spawnByCode, aircraft, exit: exitAircraft, ensureExhibit: buildArkeaExhibit, get active() { return active; } };
  requestAnimationFrame(update);

  // El exhibit se crea en turnos libres, una aeronave cada vez. Así no bloquea
  // la carga ni crea un pico de decodificación de cuatro GLB simultáneos.
  idleTurn(650).then(() => buildArkeaExhibit()).catch(error => console.warn('[aircraft-system] Exhibit incompleto.', error));
  window.__AIRCRAFT_SYSTEM_READY__ = true;
  window.dispatchEvent(new CustomEvent('aircraft-system-ready'));
}

const wait = setInterval(() => {
  if (!window.__VICE_CITY_GAME__?.scene) return;
  clearInterval(wait);
  install().catch(error => {
    console.error('[aircraft-system] Error de instalación.', error);
    window.__AIRCRAFT_SYSTEM_READY__ = true;
  });
}, 120);

setTimeout(() => {
  clearInterval(wait);
  if (!window.__AIRCRAFT_SYSTEM_READY__) window.__AIRCRAFT_SYSTEM_READY__ = true;
}, 15000);
