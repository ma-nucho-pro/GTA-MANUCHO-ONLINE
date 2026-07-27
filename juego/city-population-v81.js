/**
 * GTA MANUCHO V84 — código del proyecto.
 * Creado e integrado por Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * ARKEA AI / Manucho · conserva LICENSE, NOTICE.md y estos créditos al reutilizar.
 */
import * as THREE from './bosque/libs/three.module.js';

// GTA MANUCHO V81 · población visual abundante con muy pocos draw calls.
// Los personajes y coches cercanos siguen siendo los modelos interactivos de los
// sistemas existentes. Este módulo añade tráfico y peatones de fondo mediante
// InstancedMesh y actualizaciones a baja frecuencia para evitar congelamientos.

const WORLD_SCALE = 16;
// V85: población mucho más abundante. Al ser InstancedMesh, subir los contadores
// no añade draw calls; solo crece el muestreo a 9 Hz, que es muy barato.
const CAR_COUNT = 38;  // V110: bajado de 80. Tercera reducción, a petición.
const PED_COUNT = 95;  // V110: bajado de 170. Sigue habiendo vida sin ahogar la CPU.
const UPDATE_STEP = 1 / 9;

const ROAD_ROUTES_LOGICAL = [
  [[-2250,-5200],[-750,-5200],[-750,-3500],[-2250,-3500]],
  [[-2350,-3450],[-650,-3450],[-650,-750],[-2350,-750]],
  [[-2350,-150],[-650,-150],[-650,2550],[-2350,2550]],
  [[900,-5200],[2100,-5200],[2100,-3500],[900,-3500]],
  [[900,-3450],[2100,-3450],[2100,-750],[900,-750]],
  [[850,-800],[2150,-800],[2150,-450],[1000,-450],[1000,1050],[2150,1050],[2150,1950],[850,1950]],
  [[900,2850],[2100,2850],[2100,4050],[900,4050]],
  [[-320,-450],[320,-450],[320,0],[-320,0]],
  [[-1800,-260],[-1050,-260],[-500,-260],[-500,-190],[-1050,-190],[-1800,-190]],
  [[-1800,1225],[-1000,1225],[1000,1225],[1800,1225],[1800,1325],[1000,1325],[-1000,1325],[-1800,1325]]
];

const WALK_ROUTES_LOGICAL = [
  [[-2200,-5100],[-820,-5100],[-820,-3560],[-2200,-3560]],
  [[-2240,-3340],[-760,-3340],[-760,-860],[-2240,-860]],
  [[-2240,-100],[-760,-100],[-760,2440],[-2240,2440]],
  [[960,-5100],[2040,-5100],[2040,-3560],[960,-3560]],
  [[960,-3340],[2040,-3340],[2040,-860],[960,-860]],
  [[930,-690],[1040,-690],[1040,1080],[2070,1080],[2070,1860],[930,1860]],
  [[970,2860],[2030,2860],[2030,4040],[970,4040]],
  [[-280,-410],[280,-410],[280,-40],[-280,-40]],
  [[-1700,1180],[-900,1180],[900,1180],[1700,1180],[1700,1370],[900,1370],[-900,1370],[-1700,1370]]
];

const CAR_COLORS = [0xe13a32,0x3183d8,0xff8a18,0x22262b,0xe8e8e8,0x6f45a8,0x159d70,0xf0c52a,0x9b3f61];
const PED_COLORS = [0xd6624e,0x3c77b8,0x36a26a,0x8e5bb4,0xd59542,0x65707b,0xe078a7,0x4ea6a6];

let game = null;
let installed = false;
let last = performance.now();
let accumulator = 0;
let carStates = [];
let pedStates = [];
let meshes = null;
const dummy = new THREE.Object3D();
const color = new THREE.Color();

function groundAt(x, z, fallback = 0) {
  try {
    const y = game?.getGroundY?.(x, fallback + 600, z, false);
    return Number.isFinite(y) ? y : fallback;
  } catch {
    return fallback;
  }
}

// V108: CÓMO SE SABE, SIN ADIVINAR, SI UN PUNTO ES MAR
// El motor, cuando NO encuentra suelo y se le pregunta sin insistir
// (strict=false), devuelve siempre el mismo número exacto: 0.5 * WORLD_SCALE,
// o sea 8. Ese 8 clavado es su forma de decir "aquí no hay nada". Una carretera
// de verdad devuelve 8.8 o 24, y el interior de la ciudad -1.6; ninguna da 8
// exacto. Así que preguntándole al propio motor sabemos con certeza dónde hay
// suelo y dónde no, sin mapas ni estimaciones.
const VOID_MARK = 0.5 * WORLD_SCALE;

function isVoid(x, z) {
  try {
    const y = game?.getGroundY?.(x, 600, z, false);
    if (!Number.isFinite(y)) return true;
    return Math.abs(y - VOID_MARK) < 0.001;
  } catch { return false; }
}

// Una ruta se descarta ENTERA si buena parte de su recorrido cae en el vacío.
// No basta con mirar las esquinas: un tramo recto puede cruzar la bahía de lado
// a lado con las dos esquinas en tierra, así que se muestrea todo el trayecto.
function routeCrossesWater(points) {
  let checked = 0;
  let dry = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    for (let s = 0; s < 10; s++) {
      const t = s / 10;
      checked++;
      if (!isVoid(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) dry++;
    }
  }
  return checked > 0 && dry / checked < 0.86;   // 14 % mojado ya la descarta
}

function buildRoutes(source, label) {
  const all = source.map(route => route.map(([lx,lz]) => {
    const x = lx * WORLD_SCALE;
    const z = lz * WORLD_SCALE;
    return new THREE.Vector3(x, groundAt(x,z,0), z);
  }));
  // V109: ahora hay carretera construida sobre el agua (calzadas-v109.js), así
  // que lo normal es que NINGUNA ruta salga descartada. Este filtro se queda
  // sólo como red de seguridad: si la construcción hubiese fallado, se vuelve
  // al comportamiento de la V108 y los coches no aparecen sobre el agua.
  const dry = all.filter(points => !routeCrossesWater(points));
  if (!dry.length) {
    console.warn(`[poblacion-v109] ${label}: la comprobación descartó TODAS las rutas. Se dejan intactas.`);
    return all;
  }
  const dropped = all.length - dry.length;
  if (dropped) {
    console.warn(`[poblacion-v109] ${label}: ${dropped} de ${all.length} rutas siguen sobre el vacío. La calzada no llegó a construirse ahí.`);
  } else {
    console.log(`[poblacion-v109] ${label}: las ${all.length} rutas tienen suelo firme.`);
  }
  return dry;
}

function makeState(routes, index, kind) {
  const route = routes[index % routes.length];
  const segment = Math.floor(Math.random() * route.length);
  const t = Math.random();
  return {
    route,
    segment,
    t,
    speed: kind === 'car' ? 120 + Math.random() * 95 : 34 + Math.random() * 24,
    phase: Math.random() * Math.PI * 2,
    color: (kind === 'car' ? CAR_COLORS : PED_COLORS)[index % (kind === 'car' ? CAR_COLORS.length : PED_COLORS.length)],
    x: 0,
    y: 0,
    z: 0,
    yaw: 0
  };
}

function sampleState(state, dt) {
  let a = state.route[state.segment];
  let b = state.route[(state.segment + 1) % state.route.length];
  let dx = b.x - a.x;
  let dz = b.z - a.z;
  let length = Math.max(1, Math.hypot(dx,dz));
  state.t += state.speed * dt / length;
  while (state.t >= 1) {
    state.t -= 1;
    state.segment = (state.segment + 1) % state.route.length;
    a = state.route[state.segment];
    b = state.route[(state.segment + 1) % state.route.length];
    dx = b.x - a.x;
    dz = b.z - a.z;
    length = Math.max(1, Math.hypot(dx,dz));
  }
  state.x = THREE.MathUtils.lerp(a.x,b.x,state.t);
  state.y = THREE.MathUtils.lerp(a.y,b.y,state.t);
  state.z = THREE.MathUtils.lerp(a.z,b.z,state.t);
  // Los modelos visuales avanzan por -Z local.
  state.yaw = Math.atan2(-dx,-dz);
}

function createMeshes() {
  const carBody = new THREE.InstancedMesh(
    new THREE.BoxGeometry(21,8,43),
    new THREE.MeshLambertMaterial({ color:0xffffff }),
    CAR_COUNT
  );
  const carCabin = new THREE.InstancedMesh(
    new THREE.BoxGeometry(16,7,20),
    new THREE.MeshLambertMaterial({ color:0x9bb7c8 }),
    CAR_COUNT
  );
  const carWheels = new THREE.InstancedMesh(
    new THREE.BoxGeometry(23,4,10),
    new THREE.MeshLambertMaterial({ color:0x15191d }),
    CAR_COUNT
  );

  const pedBody = new THREE.InstancedMesh(
    new THREE.CapsuleGeometry(3.8,15,3,6),
    new THREE.MeshLambertMaterial({ color:0xffffff }),
    PED_COUNT
  );
  const pedHead = new THREE.InstancedMesh(
    new THREE.SphereGeometry(4.1,7,6),
    new THREE.MeshLambertMaterial({ color:0xc99873 }),
    PED_COUNT
  );
  const pedLegs = new THREE.InstancedMesh(
    new THREE.BoxGeometry(7,13,5),
    new THREE.MeshLambertMaterial({ color:0x242932 }),
    PED_COUNT
  );

  for (const mesh of [carBody,carCabin,carWheels,pedBody,pedHead,pedLegs]) {
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    game.scene.add(mesh);
  }
  carBody.name = 'GTA_MANUCHO_TRAFICO_INSTANCIADO';
  pedBody.name = 'GTA_MANUCHO_PEATONES_INSTANCIADOS';
  return { carBody,carCabin,carWheels,pedBody,pedHead,pedLegs };
}

// El objeto de límites se guardaba en caché: antes se creaba uno por fotograma.
let cachedLimits = null;
let cachedQuality = null;

function qualityLimits() {
  const q = window.__VICE_VIDEO_SETTINGS__?.quality || 'medium';
  if (q === cachedQuality && cachedLimits) return cachedLimits;
  cachedQuality = q;
  cachedLimits = computeLimits(q);
  return cachedLimits;
}

function computeLimits(q) {
  // V85: límites visibles mucho más altos manteniendo fluidez (instanciado).
  // V107: límites visibles bajados y, sobre todo, radios más cortos. Un peatón
  // a 400 metros no aporta nada y cuesta lo mismo que uno que tienes delante.
  if (q === 'low') return { cars:14, peds:28, carDistance:1900, pedDistance:1500 };
  if (q === 'high') return { cars:30, peds:64, carDistance:3400, pedDistance:2600 };
  if (q === 'max') return { cars:38, peds:95, carDistance:4200, pedDistance:3200 };
  return { cars:22, peds:46, carDistance:2600, pedDistance:2100 };
}

// V107: NI UN COCHE SOBRE EL AGUA. Los coches y los peatones son mallas
// instanciadas: no son objetos sueltos que se puedan ocultar de uno en uno, son
// matrices dentro de una sola malla. Por eso los intentos anteriores de
// "quitar los coches del mar" no hacían nada. El sitio correcto es este: al
// decidir qué instancias se dibujan. Si el mapa de tierra no está activo, esta
// función no filtra nada y el tráfico queda exactamente como estaba.
function overSea(state) {
  const sea = window.__V106_MAR__;
  return typeof sea?.isSea === 'function' ? sea.isSea(state.x, state.z) : false;
}

// V108: ESTO ERA UNA FÁBRICA DE BASURA.
// El código anterior hacía map + filter + sort + slice sobre 250 elementos en
// CADA fotograma: unos 250 objetos nuevos por fotograma, 15.000 por segundo,
// que el recolector de basura tiene que ir limpiando. El recolector no avisa:
// para el mundo unos milisegundos cuando le apetece, y ESO es exactamente el
// tirón que se siente al moverse. Ahora se reutiliza siempre el mismo array de
// trabajo y no se crea ni un objeto por fotograma. Resultado idéntico, coste
// cero.
const scratch = [];
let scratchLen = 0;

function compareDist(a, b) { return a.distSq - b.distSq; }

function rankStates(states, maxDistance, player) {
  const limitSq = maxDistance * maxDistance;
  scratchLen = 0;
  for (let i = 0; i < states.length; i++) {
    const state = states[i];
    const dx = player ? state.x - player.x : 0;
    const dz = player ? state.z - player.z : 0;
    const distSq = dx * dx + dz * dz;
    if (distSq > limitSq) continue;
    if (overSea(state)) continue;
    let slot = scratch[scratchLen];
    if (!slot) { slot = { state: null, distSq: 0 }; scratch[scratchLen] = slot; }
    slot.state = state;
    slot.distSq = distSq;
    scratchLen++;
  }
  for (let i = scratchLen; i < scratch.length; i++) scratch[i].distSq = Infinity;
  scratch.sort(compareDist);
  return scratchLen;
}

function fillCarMatrices(states, limits, player) {
  const found = rankStates(states, limits.carDistance, player);
  const total = Math.min(found, limits.cars);
  let slot = 0;
  for (let r = 0; r < total; r++) {
    const state = scratch[r].state;
    dummy.position.set(state.x,state.y+7,state.z);
    dummy.rotation.set(0,state.yaw,0);
    dummy.scale.set(1,1,1);
    dummy.updateMatrix();
    meshes.carBody.setMatrixAt(slot,dummy.matrix);
    color.setHex(state.color); meshes.carBody.setColorAt(slot,color);

    dummy.position.y = state.y + 14;
    dummy.scale.set(.95,1,1);
    dummy.updateMatrix(); meshes.carCabin.setMatrixAt(slot,dummy.matrix);

    dummy.position.y = state.y + 3;
    dummy.scale.set(1,1,1);
    dummy.updateMatrix(); meshes.carWheels.setMatrixAt(slot,dummy.matrix);
    slot++;
  }
  meshes.carBody.count = meshes.carCabin.count = meshes.carWheels.count = slot;
  meshes.carBody.instanceMatrix.needsUpdate = meshes.carCabin.instanceMatrix.needsUpdate = meshes.carWheels.instanceMatrix.needsUpdate = true;
  if (meshes.carBody.instanceColor) meshes.carBody.instanceColor.needsUpdate = true;
}

function fillPedMatrices(states, limits, player, elapsed) {
  const found = rankStates(states, limits.pedDistance, player);
  const total = Math.min(found, limits.peds);
  let slot = 0;
  for (let r = 0; r < total; r++) {
    const state = scratch[r].state;
    const bob = Math.abs(Math.sin(elapsed*6 + state.phase)) * .7;
    dummy.rotation.set(0,state.yaw,0);
    dummy.scale.set(1,1,1);
    dummy.position.set(state.x,state.y+17+bob,state.z);
    dummy.updateMatrix(); meshes.pedBody.setMatrixAt(slot,dummy.matrix);
    color.setHex(state.color); meshes.pedBody.setColorAt(slot,color);

    dummy.position.y = state.y + 34 + bob;
    dummy.updateMatrix(); meshes.pedHead.setMatrixAt(slot,dummy.matrix);

    dummy.position.y = state.y + 7 + bob;
    dummy.rotation.z = Math.sin(elapsed*6 + state.phase) * .08;
    dummy.updateMatrix(); meshes.pedLegs.setMatrixAt(slot,dummy.matrix);
    slot++;
  }
  meshes.pedBody.count = meshes.pedHead.count = meshes.pedLegs.count = slot;
  meshes.pedBody.instanceMatrix.needsUpdate = meshes.pedHead.instanceMatrix.needsUpdate = meshes.pedLegs.instanceMatrix.needsUpdate = true;
  if (meshes.pedBody.instanceColor) meshes.pedBody.instanceColor.needsUpdate = true;
}

function update(dt, elapsed) {
  for (const state of carStates) sampleState(state,dt);
  for (const state of pedStates) sampleState(state,dt);
  const limits = qualityLimits();
  const player = game?.playerContainer?.position;
  fillCarMatrices(carStates,limits,player);
  fillPedMatrices(pedStates,limits,player,elapsed);
}

function frame(now = performance.now()) {
  requestAnimationFrame(frame);
  if (document.hidden || window.__VICE_ZONE_TRANSITION__) { last = now; return; }
  const dt = Math.min(.12,Math.max(0,(now-last)/1000));
  last = now;
  accumulator += dt;
  if (accumulator < UPDATE_STEP) return;
  const step = Math.min(.16,accumulator);
  accumulator = 0;
  update(step,now/1000);
}

function install() {
  if (installed) return;
  game = window.__VICE_CITY_GAME__;
  if (!game?.scene || !game?.playerContainer) return;
  installed = true;
  const roadRoutes = buildRoutes(ROAD_ROUTES_LOGICAL, 'coches');
  const walkRoutes = buildRoutes(WALK_ROUTES_LOGICAL, 'peatones');
  carStates = Array.from({length:CAR_COUNT},(_,i) => makeState(roadRoutes,i,'car'));
  pedStates = Array.from({length:PED_COUNT},(_,i) => makeState(walkRoutes,i,'ped'));
  for (const state of [...carStates,...pedStates]) sampleState(state,Math.random()*25);
  meshes = createMeshes();
  update(0,performance.now()/1000);
  window.__V81_BACKGROUND_POPULATION__ = { carStates,pedStates,meshes };
  window.dispatchEvent(new CustomEvent('gta-manucho-population-ready'));
  requestAnimationFrame(frame);
}

// V109: se espera a que estén construidas las calzadas sobre el agua. Si se
// midieran las rutas antes, el suelo nuevo aún no existiría y se descartarían
// por error. Hay un tope de 40 segundos por si ese módulo no llega.
let waited = 0;
const wait = setInterval(() => {
  game = window.__VICE_CITY_GAME__ || game;
  if (!game?.scene || !game?.playerContainer || typeof game.getGroundY !== 'function') return;
  waited += 120;
  if (!window.__V109_CALZADAS_READY__ && waited < 40000) return;
  clearInterval(wait);
  install();
},120);
setTimeout(() => clearInterval(wait),180000); // V85: más margen en equipos lentos
