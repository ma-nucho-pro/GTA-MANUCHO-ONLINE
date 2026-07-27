/**
 * GTA MANUCHO V106 — DÓNDE ACABA LA TIERRA Y EMPIEZA EL MAR
 * Autor e integración: Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * Marca: ARKEA AI / Manucho. Uso permitido conforme a LICENSE; conserva los créditos.
 *
 * POR QUÉ SE CAMINA Y SE CONDUCE SOBRE EL AGUA
 * El motor, cuando no encuentra suelo bajo un punto, no dice "aquí no hay
 * suelo": devuelve lastSafeGroundY, la última altura buena que recuerda. Es una
 * red de seguridad razonable para no caerse por una grieta, pero al salir de la
 * costa hacia el mar significa que el suelo TE SIGUE. Por eso el personaje
 * camina sobre el agua y los coches de NPC circulan por el mar como si fuese
 * pista, sobre todo por las afueras del Parque del Retiro y por el bosque.
 *
 * Nadie le había dicho al juego dónde está el mar. Eso es lo que hace este
 * módulo: mide dónde hay geometría de verdad y llama mar a todo lo demás.
 *
 * CÓMO SE MIDE, SIN LISTAS A MANO
 * Se recorre la escena una vez y se marca en una rejilla la huella horizontal
 * de cada objeto sólido. Lo que queda sin marcar, y además está lejos de
 * cualquier cosa marcada, es mar. Se excluyen las superficies gigantes (el
 * propio océano mide un millón de unidades) porque si no cubrirían el mapa
 * entero y no quedaría mar en ninguna parte.
 *
 * SEGURIDAD
 * Equivocarse aquí significaría hundir al jugador en mitad de la ciudad, así
 * que el módulo es deliberadamente cobarde:
 *   · Sólo se considera mar una celda si ella y sus OCHO vecinas están vacías.
 *   · Si el mapa de tierra sale sospechosamente pequeño, no se activa nada.
 *   · Las islas, el puente y los barcos siempre cuentan como tierra.
 *   · window.__V106_MAR__.off() lo desactiva en caliente si algo va mal.
 */
import * as THREE from './bosque/libs/three.module.js';

const WORLD_SCALE = 16;
const WATER_LEVEL = -14 * WORLD_SCALE;
const CELL = 460;                 // ~29 m por celda
const MIN_LAND_CELLS = 260;       // por debajo de esto no nos fiamos
const SEA_GROUND = WATER_LEVEL - 6 * WORLD_SCALE;

let game = null;
let installed = false;
let enabled = false;

let mask = null;
let minX = 0, minZ = 0, nx = 0, nz = 0;
let landCells = 0;

const box = new THREE.Box3();

/* ---------------------------------------------------------------------- */
/* CONSTRUCCIÓN DEL MAPA DE TIERRA                                         */
/* ---------------------------------------------------------------------- */
function buildMask() {
  const scene = game.scene;
  const pieces = [];

  scene.traverse(node => {
    if (!node.isMesh && !node.isInstancedMesh) return;
    const name = (node.name || '').toLowerCase();
    // El océano, el cielo y el mapa 3D no son tierra.
    if (name.includes('ocean') || name.includes('water') || name.includes('agua') ||
        name.includes('sky') || name.includes('cielo') || name.includes('rocas_adjuntas')) return;
    try {
      box.setFromObject(node);
      if (!Number.isFinite(box.min.x) || box.min.x > box.max.x) return;
      const w = box.max.x - box.min.x;
      const d = box.max.z - box.min.z;
      // Fuera las superficies gigantes: son planos de fondo, no terreno.
      if (w > 60000 || d > 60000) return;
      // Fuera lo que está muy por debajo del agua (fondo marino, cascos).
      if (box.max.y < WATER_LEVEL - 2 * WORLD_SCALE) return;
      pieces.push([box.min.x, box.min.z, box.max.x, box.max.z]);
    } catch {}
  });

  if (pieces.length < 40) return false;

  let lo = [Infinity, Infinity], hi = [-Infinity, -Infinity];
  for (const p of pieces) {
    if (p[0] < lo[0]) lo[0] = p[0];
    if (p[1] < lo[1]) lo[1] = p[1];
    if (p[2] > hi[0]) hi[0] = p[2];
    if (p[3] > hi[1]) hi[1] = p[3];
  }
  const pad = CELL * 4;
  minX = lo[0] - pad;
  minZ = lo[1] - pad;
  nx = Math.ceil((hi[0] - lo[0] + pad * 2) / CELL) + 1;
  nz = Math.ceil((hi[1] - lo[1] + pad * 2) / CELL) + 1;
  if (nx * nz > 900000) return false;

  mask = new Uint8Array(nx * nz);
  for (const [x0, z0, x1, z1] of pieces) {
    const ix0 = Math.max(0, Math.floor((x0 - minX) / CELL));
    const ix1 = Math.min(nx - 1, Math.ceil((x1 - minX) / CELL));
    const iz0 = Math.max(0, Math.floor((z0 - minZ) / CELL));
    const iz1 = Math.min(nz - 1, Math.ceil((z1 - minZ) / CELL));
    for (let iz = iz0; iz <= iz1; iz++) {
      const row = iz * nx;
      for (let ix = ix0; ix <= ix1; ix++) mask[row + ix] = 1;
    }
  }

  landCells = 0;
  for (let i = 0; i < mask.length; i++) if (mask[i]) landCells++;
  return landCells >= MIN_LAND_CELLS;
}

function cellIsLand(ix, iz) {
  if (ix < 0 || iz < 0 || ix >= nx || iz >= nz) return false;
  return mask[iz * nx + ix] === 1;
}

// Mar sólo si la celda Y sus ocho vecinas están vacías. Ese margen de una celda
// entera (unos 29 m) evita hundir a nadie por un borde mal medido.
function isSea(x, z) {
  if (!enabled || !mask) return false;
  const ix = Math.floor((x - minX) / CELL);
  const iz = Math.floor((z - minZ) / CELL);
  if (ix < 1 || iz < 1 || ix >= nx - 1 || iz >= nz - 1) return true;  // fuera del mapa: mar
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (cellIsLand(ix + dx, iz + dz)) return false;
    }
  }
  return true;
}

/* ---------------------------------------------------------------------- */
/* EL SUELO DEJA DE SEGUIRTE MAR ADENTRO                                   */
/* ---------------------------------------------------------------------- */
function patchGround() {
  if (game.__v106Ground) return;
  game.__v106Ground = true;
  const inner = game.getGroundY.bind(game);
  // Este envoltorio va POR FUERA a propósito: llama a toda la cadena de antes,
  // mira el resultado y sólo lo corrige si el punto cae en mar abierto. Así no
  // le quita el trabajo a nadie, sólo tapa el respaldo que hacía flotar.
  game.getGroundY = function v106Ground(x, y, z, strict = true) {
    let result;
    try { result = inner(x, y, z, strict); } catch { return SEA_GROUND; }
    if (!enabled) return result;
    if (!Number.isFinite(result) || result <= WATER_LEVEL) return result;
    if (!isSea(x, z)) return result;
    // Las islas del mar tienen su propio suelo y ya se han comprobado antes.
    const island = window.__GTA_ISLAND_GROUND__;
    if (typeof island === 'function' && Number.isFinite(island(x, z))) return result;
    return SEA_GROUND;
  };
}

/* ---------------------------------------------------------------------- */
/* LOS COCHES DE NPC QUE YA ESTÁN EN EL MAR                                */
/* ---------------------------------------------------------------------- */
// Los cuatro coches del motor no se colocan por posición: siguen raíles rectos
// definidos en initTraffic(), y esos raíles cruzan el mar de lado a lado. Da
// igual dónde los pongas, el raíl los devuelve. Así que en vez de moverlos, al
// llegar al agua dan media vuelta: el tráfico sigue vivo y se queda en tierra.
function turnTrackCarsAround() {
  const cars = game.trafficCars;
  if (!Array.isArray(cars)) return;
  for (const car of cars) {
    const mesh = car?.mesh;
    if (!mesh) continue;
    if (!isSea(mesh.position.x, mesh.position.z)) { car.__v106Wet = false; continue; }
    if (car.__v106Wet) continue;      // ya dio la vuelta, que no rebote sin fin
    car.__v106Wet = true;
    car.direction = -(car.direction || 1);
    // Un empujón hacia atrás para salir del agua antes del siguiente cálculo.
    car.progress = Math.min(1, Math.max(0, (car.progress || 0) + car.direction * 0.02));
  }
}

let cursor = 0;
let sweepTick = 0;

function sweepVehicles() {
  if (!enabled) return;
  const pools = [
    game.traffic, game.trafficCars, game.cars, game.vehicles,
    window.__CITY_LIFE_SYSTEM__?.serviceVehicles,
    window.__CITY_LIFE_SYSTEM__?.trafficCars,
    window.__CUSTOM_CAR_SYSTEM__?.cars,
    window.__V81_BACKGROUND_POPULATION__?.vehicles
  ];
  for (const pool of pools) {
    if (!Array.isArray(pool) || !pool.length) continue;
    for (let n = 0; n < 10; n++) {
      cursor = (cursor + 1) % pool.length;
      const item = pool[cursor];
      const root = item?.root || item?.mesh || (item?.isObject3D ? item : null);
      if (!root || root === game.activeCar || !root.visible) continue;
      if (root.position.y < WATER_LEVEL) continue;
      if (!isSea(root.position.x, root.position.z)) continue;
      // Se hunde y se apaga; el sistema de tráfico lo reciclará en tierra.
      root.visible = false;
      root.position.y = WATER_LEVEL - 4000;
      if (item.speed !== undefined) item.speed = 0;
      if (item.active !== undefined) item.active = false;
      if (item.respawn === undefined && item.needsRespawn !== undefined) item.needsRespawn = true;
    }
  }
}

/* ---------------------------------------------------------------------- */
function frame() {
  requestAnimationFrame(frame);
  if (document.hidden) return;
  try { turnTrackCarsAround(); } catch {}
  // V110: el barrido no necesita ir a 60 por segundo. Cada seis fotogramas
  // basta y ahorra trabajo constante.
  if ((sweepTick = (sweepTick + 1) % 6) !== 0) return;
  try { sweepVehicles(); } catch {}
}

function install() {
  if (installed) return;
  installed = true;
  let ok = false;
  try { ok = buildMask(); } catch (error) { console.warn('[mar-v106] No se pudo medir la tierra.', error); }

  if (!ok) {
    console.warn(`[mar-v106] Mapa de tierra descartado (${landCells} celdas). No se toca nada, por seguridad.`);
    return;
  }
  enabled = true;
  patchGround();
  requestAnimationFrame(frame);

  window.__V106_MAR__ = {
    isSea,
    // V110: las calzadas nuevas avisan de dónde han puesto suelo, para que el
    // mapa deje de considerar mar esa franja y los coches puedan pasar.
    markLand(x0, z0, x1, z1) {
      if (!mask) return 0;
      const ix0 = Math.max(0, Math.floor((Math.min(x0, x1) - minX) / CELL) - 1);
      const ix1 = Math.min(nx - 1, Math.ceil((Math.max(x0, x1) - minX) / CELL) + 1);
      const iz0 = Math.max(0, Math.floor((Math.min(z0, z1) - minZ) / CELL) - 1);
      const iz1 = Math.min(nz - 1, Math.ceil((Math.max(z0, z1) - minZ) / CELL) + 1);
      let marked = 0;
      for (let iz = iz0; iz <= iz1; iz++) {
        for (let ix = ix0; ix <= ix1; ix++) {
          if (!mask[iz * nx + ix]) { mask[iz * nx + ix] = 1; marked++; landCells++; }
        }
      }
      return marked;
    },
    get cells() { return { nx, nz, landCells, cell: CELL, minX, minZ }; },
    off() { enabled = false; console.log('[mar-v106] Desactivado.'); },
    on() { enabled = true; console.log('[mar-v106] Activado.'); },
    rebuild() { installed = false; install(); }
  };
  console.log(`[mar-v106] Tierra medida: ${landCells} celdas de ${CELL} unidades en una rejilla ${nx}x${nz}. El suelo ya no sigue al jugador mar adentro.`);
}

// Se mide tarde a propósito: la ciudad, el bosque y las islas tienen que estar
// ya cargados, o parte del mapa se marcaría como mar por no haber llegado aún.
const wait = setInterval(() => {
  game = window.__VICE_CITY_GAME__ || game;
  if (!game?.scene || !game?.getGroundY) return;
  if (!window.__VICE_CITY_REVEALED__) return;
  clearInterval(wait);
  setTimeout(install, 15000);
}, 500);
setTimeout(() => clearInterval(wait), 120000);
