/**
 * GTA MANUCHO V101 — ROCAS ADJUNTAS (archivo ROCAS.html)
 * Autor e integración: Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * Marca: ARKEA AI / Manucho. Uso permitido conforme a LICENSE; conserva los créditos.
 *
 * Las rocas NO están creadas de cero: el generador SDF (createRockSDF), las
 * tablas de marching cubes (edgeTable / triTable), la función marchingCubes,
 * los impostores, el generador aleatorio con semilla y el shader completo están
 * copiados literalmente del archivo ROCAS.html adjunto, con las mismas semillas
 * (s * 7919 + 1337) y las mismas ocho formas. Sólo se han adaptado tres cosas
 * para que funcionen dentro del juego:
 *   1. La escala: una unidad del adjunto equivale a ROCK_UNIT unidades de mundo.
 *   2. Las frecuencias del ruido y el epsilon del shader se dividen/multiplican
 *      por esa misma escala, y el ruido usa coordenadas locales para no perder
 *      precisión estando la isla a z ~ 33000.
 *   3. El recorte inferior usa la cota real del terreno bajo cada roca en vez de
 *      un plano fijo en y = 0.
 *
 * Colocación: alrededor de las dos islas de la zona de los barcos.
 * Rendimiento: instancing + 4 niveles de LOD + descarte por frustum y por
 * distancia, tal y como venía en el adjunto ("brutally optimized").
 */
import * as THREE from './bosque/libs/three.module.js';

const WORLD_SCALE = 16;
const WATER_LEVEL = -14 * WORLD_SCALE;

// Una unidad del archivo adjunto = 1,55 m de juego. Con MIN_SCALE 0.45 y
// MAX_SCALE 2.2 salen rocas de ~0,7 m a ~3,4 m: piedras de playa creíbles.
const ROCK_UNIT = 1.55 * WORLD_SCALE;

// Ruido del shader llevado a la escala del juego (misma apariencia que el demo).
const NOISE_LOW  = (0.4 / ROCK_UNIT).toFixed(8);
const NOISE_HIGH = (2.5 / ROCK_UNIT).toFixed(8);
const NOISE_EPS  = (0.05 * ROCK_UNIT).toFixed(5);
const NOISE_ORIGIN = new THREE.Vector3(0, 0, 2170 * WORLD_SCALE);

// Distancia hasta la que se usa el sombreado detallado de la roca. Antes era
// LOD_DISTANCES[2] * 0.75 = 2418 unidades fijas, y a esa distancia el camino
// caro cubría casi toda la pantalla en la zona marina. Ahora arranca a 46 m y
// el módulo de fluidez lo ajusta según los FPS reales.
const ROCK_DETAIL_DISTANCE = { value: 46 * WORLD_SCALE };

// ==========================================================
// CONFIGURATION  (valores del adjunto; sólo se escalan las distancias)
// ==========================================================
const CONFIG = {
  INSTANCE_COUNT: 0,          // se fija al terminar la colocación

  NUM_ROCK_SHAPES: 8,         // draw calls = NUM_ROCK_SHAPES x LOD_DISTANCES.length
  MIN_SCALE: 0.45,
  MAX_SCALE: 2.2,
  MIN_SQUASH: 0.4,
  MAX_SQUASH: 1.1,
  MIN_NUM_CUTS: 14,
  MAX_NUM_CUTS: 22,
  MIN_CUT_RADIUS: 1.4,
  MAX_CUT_RADIUS: 2.5,
  MIN_CUT_RATIO: 0.6,
  MAX_CUT_RATIO: 0.85,
  MIN_CUT_K: 0.02,
  MAX_CUT_K: 0.08,
  MIN_SHAPE_SCALE_X: 0.75,
  MAX_SHAPE_SCALE_X: 1.25,
  MIN_SHAPE_SCALE_Y: 0.6,
  MAX_SHAPE_SCALE_Y: 1.0,
  MIN_SHAPE_SCALE_Z: 0.75,
  MAX_SHAPE_SCALE_Z: 1.25,
  MIN_WETNESS: 0.1,
  MAX_WETNESS: 0.45,
  MIN_ROUGHNESS: 0.4,
  MAX_ROUGHNESS: 1.0,
  MIN_COLOR_TINGE: -0.12,
  MAX_COLOR_TINGE: 0.12,

  WORLD_BOTTOM: 0,            // sustituido por la cota real de cada roca
  GROUND_SINKING: 0.45,       // 0.45 = la roca se hunde el 45 % de su alto

  LOD_DISTANCES: [0, 30 * ROCK_UNIT, 130 * ROCK_UNIT, 165 * ROCK_UNIT],
  LOD_RESOLUTIONS: [20, 14, 6, 1],
  LOD_SPHERE1_RESOLUTION: -1,
  LOD_SPHERE0_RESOLUTION: 6,
  LOD_BOX_RESOLUTION: 1,

  VIEW_DISTANCE: 180 * ROCK_UNIT,
  FRUSTUM_CULLING: true
};

// Luz: se rellena con el sol real del juego y se refresca de vez en cuando.
const sun = {
  position: new THREE.Vector3(0.35, 0.88, 0.3).normalize(),
  color: new THREE.Color(0xffeedd),
  intensity: 1.15
};

const frustum = new THREE.Frustum();
const projScreenMatrix = new THREE.Matrix4();

let game = null;
let installed = false;
let rockGroup = null;
let lodManager = null;
let clusterCenter = new THREE.Vector3(0, WATER_LEVEL, 2170 * WORLD_SCALE);
let clusterRadius = 0;
let nextSunRefresh = 0;

function nextFrame(){ return new Promise(resolve => requestAnimationFrame(() => resolve())); }
function idleTurn(timeout=600){
  return new Promise(resolve => {
    if ('requestIdleCallback' in window) requestIdleCallback(() => resolve(), {timeout});
    else setTimeout(resolve, Math.min(timeout, 180));
  });
}

// ==========================================================
// SEEDED RNG  (copiado literalmente de ROCAS.html)
// ==========================================================
class SeededRNG {
  constructor(seed) {
    this.seed = seed;
  }
  next() {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }
  range(min, max) {
    return min + this.next() * (max - min);
  }

  static _scratchVec = new THREE.Vector3();
  vec3Norm(target = SeededRNG._scratchVec) {
    const theta = this.next() * Math.PI * 2;
    const phi = Math.acos(2 * this.next() - 1);
    return target.set(
      Math.sin(phi) * Math.cos(theta),
      Math.sin(phi) * Math.sin(theta),
      Math.cos(phi),
    );
  }
}

// ==========================================================
// SDF ROCK GENERATOR  (copiado literalmente de ROCAS.html)
// ==========================================================
function createRockSDF(seed) {
  const rng = new SeededRNG(seed);

  const numCuts = Math.floor(
    rng.range(CONFIG.MIN_NUM_CUTS, CONFIG.MAX_NUM_CUTS),
  );
  const cuts = [];
  for (let i = 0; i < numCuts; i++) {
    const dir = rng.vec3Norm();
    cuts.push({
      dx: dir.x,
      dy: dir.y,
      dz: dir.z,
      radius: rng.range(CONFIG.MIN_CUT_RADIUS, CONFIG.MAX_CUT_RADIUS),
      ratio: rng.range(CONFIG.MIN_CUT_RATIO, CONFIG.MAX_CUT_RATIO),
      k: rng.range(CONFIG.MIN_CUT_K, CONFIG.MAX_CUT_K),
    });
  }

  const scale = new THREE.Vector3(
    rng.range(CONFIG.MIN_SHAPE_SCALE_X, CONFIG.MAX_SHAPE_SCALE_X),
    rng.range(CONFIG.MIN_SHAPE_SCALE_Y, CONFIG.MAX_SHAPE_SCALE_Y),
    rng.range(CONFIG.MIN_SHAPE_SCALE_Z, CONFIG.MAX_SHAPE_SCALE_Z),
  );

  const sdf = (x, y, z) => {
    const px = x / scale.x;
    const py = y / scale.y;
    const pz = z / scale.z;

    let d = Math.sqrt(px * px + py * py + pz * pz) - 1.05;

    for (const c of cuts) {
      const spx = px + c.dx * c.radius;
      const spy = py + c.dy * c.radius;
      const spz = pz + c.dz * c.radius;

      const sd =
        Math.sqrt(spx * spx + spy * spy + spz * spz) - c.radius * c.ratio;

      const h = Math.max(0, Math.min(1, 0.5 + (0.5 * (-sd - d)) / c.k));

      d = d * (1 - h) + -sd * h + c.k * h * (1 - h);
    }

    // Clamp d to avoid tiny floating islands
    if (d > 0.3) d = 0.3;

    return d;
  };

  return { sdf, scale };
}

// ==========================================================
// MARCHING CUBES  (tablas y función copiadas de ROCAS.html)
// ==========================================================
const edgeTable = new Int32Array([
  0x0, 0x109, 0x203, 0x30a, 0x406, 0x50f, 0x605, 0x70c, 0x80c, 0x905,
  0xa0f, 0xb06, 0xc0a, 0xd03, 0xe09, 0xf00, 0x190, 0x99, 0x393, 0x29a,
  0x596, 0x49f, 0x795, 0x69c, 0x99c, 0x895, 0xb9f, 0xa96, 0xd9a, 0xc93,
  0xf99, 0xe90, 0x230, 0x339, 0x33, 0x13a, 0x636, 0x73f, 0x435, 0x53c,
  0xa3c, 0xb35, 0x83f, 0x936, 0xe3a, 0xf33, 0xc39, 0xd30, 0x3a0, 0x2a9,
  0x1a3, 0xaa, 0x7a6, 0x6af, 0x5a5, 0x4ac, 0xbac, 0xaa5, 0x9af, 0x8a6,
  0xfaa, 0xea3, 0xda9, 0xca0, 0x460, 0x569, 0x663, 0x76a, 0x66, 0x16f,
  0x265, 0x36c, 0xc6c, 0xd65, 0xe6f, 0xf66, 0x86a, 0x963, 0xa69, 0xb60,
  0x5f0, 0x4f9, 0x7f3, 0x6fa, 0x1f6, 0xff, 0x3f5, 0x2fc, 0xdfc, 0xcf5,
  0xfff, 0xef6, 0x9fa, 0x8f3, 0xbf9, 0xaf0, 0x650, 0x759, 0x453, 0x55a,
  0x256, 0x35f, 0x55, 0x15c, 0xe5c, 0xf55, 0xc5f, 0xd56, 0xa5a, 0xb53,
  0x859, 0x950, 0x7c0, 0x6c9, 0x5c3, 0x4ca, 0x3c6, 0x2cf, 0x1c5, 0xcc,
  0xfcc, 0xec5, 0xdcf, 0xcc6, 0xbca, 0xac3, 0x9c9, 0x8c0, 0x8c0, 0x9c9,
  0xac3, 0xbca, 0xcc6, 0xdcf, 0xec5, 0xfcc, 0xcc, 0x1c5, 0x2cf, 0x3c6,
  0x4ca, 0x5c3, 0x6c9, 0x7c0, 0x950, 0x859, 0xb53, 0xa5a, 0xd56, 0xc5f,
  0xf55, 0xe5c, 0x15c, 0x55, 0x35f, 0x256, 0x55a, 0x453, 0x759, 0x650,
  0xaf0, 0xbf9, 0x8f3, 0x9fa, 0xef6, 0xfff, 0xcf5, 0xdfc, 0x2fc, 0x3f5,
  0xff, 0x1f6, 0x6fa, 0x7f3, 0x4f9, 0x5f0, 0xb60, 0xa69, 0x963, 0x86a,
  0xf66, 0xe6f, 0xd65, 0xc6c, 0x36c, 0x265, 0x16f, 0x66, 0x76a, 0x663,
  0x569, 0x460, 0xca0, 0xda9, 0xea3, 0xfaa, 0x8a6, 0x9af, 0xaa5, 0xbac,
  0x4ac, 0x5a5, 0x6af, 0x7a6, 0xaa, 0x1a3, 0x2a9, 0x3a0, 0xd30, 0xc39,
  0xf33, 0xe3a, 0x936, 0x83f, 0xb35, 0xa3c, 0x53c, 0x435, 0x73f, 0x636,
  0x13a, 0x33, 0x339, 0x230, 0xe90, 0xf99, 0xc93, 0xd9a, 0xa96, 0xb9f,
  0x895, 0x99c, 0x69c, 0x795, 0x49f, 0x596, 0x29a, 0x393, 0x99, 0x190,
  0xf00, 0xe09, 0xd03, 0xc0a, 0xb06, 0xa0f, 0x905, 0x80c, 0x70c, 0x605,
  0x50f, 0x406, 0x30a, 0x203, 0x109, 0x0,
]);

const triTable = [
  [-1],
  [0, 8, 3, -1],
  [0, 1, 9, -1],
  [1, 8, 3, 9, 8, 1, -1],
  [1, 2, 10, -1],
  [0, 8, 3, 1, 2, 10, -1],
  [9, 2, 10, 0, 2, 9, -1],
  [2, 8, 3, 2, 10, 8, 10, 9, 8, -1],
  [3, 11, 2, -1],
  [0, 11, 2, 8, 11, 0, -1],
  [1, 9, 0, 2, 3, 11, -1],
  [1, 11, 2, 1, 9, 11, 9, 8, 11, -1],
  [3, 10, 1, 11, 10, 3, -1],
  [0, 10, 1, 0, 8, 10, 8, 11, 10, -1],
  [3, 9, 0, 3, 11, 9, 11, 10, 9, -1],
  [9, 8, 10, 10, 8, 11, -1],
  [4, 7, 8, -1],
  [4, 3, 0, 7, 3, 4, -1],
  [0, 1, 9, 8, 4, 7, -1],
  [4, 1, 9, 4, 7, 1, 7, 3, 1, -1],
  [1, 2, 10, 8, 4, 7, -1],
  [3, 4, 7, 3, 0, 4, 1, 2, 10, -1],
  [9, 2, 10, 9, 0, 2, 8, 4, 7, -1],
  [2, 10, 9, 2, 9, 7, 2, 7, 3, 7, 9, 4, -1],
  [8, 4, 7, 3, 11, 2, -1],
  [11, 4, 7, 11, 2, 4, 2, 0, 4, -1],
  [9, 0, 1, 8, 4, 7, 2, 3, 11, -1],
  [4, 7, 11, 9, 4, 11, 9, 11, 2, 9, 2, 1, -1],
  [3, 10, 1, 3, 11, 10, 7, 8, 4, -1],
  [1, 11, 10, 1, 4, 11, 1, 0, 4, 7, 11, 4, -1],
  [4, 7, 8, 9, 0, 11, 9, 11, 10, 11, 0, 3, -1],
  [4, 7, 11, 4, 11, 9, 9, 11, 10, -1],
  [9, 5, 4, -1],
  [9, 5, 4, 0, 8, 3, -1],
  [0, 5, 4, 1, 5, 0, -1],
  [8, 5, 4, 8, 3, 5, 3, 1, 5, -1],
  [1, 2, 10, 9, 5, 4, -1],
  [3, 0, 8, 1, 2, 10, 4, 9, 5, -1],
  [5, 2, 10, 5, 4, 2, 4, 0, 2, -1],
  [2, 10, 5, 3, 2, 5, 3, 5, 4, 3, 4, 8, -1],
  [9, 5, 4, 2, 3, 11, -1],
  [0, 11, 2, 0, 8, 11, 4, 9, 5, -1],
  [0, 5, 4, 0, 1, 5, 2, 3, 11, -1],
  [2, 1, 5, 2, 5, 8, 2, 8, 11, 4, 8, 5, -1],
  [10, 3, 11, 10, 1, 3, 9, 5, 4, -1],
  [4, 9, 5, 0, 8, 1, 8, 10, 1, 8, 11, 10, -1],
  [5, 4, 0, 5, 0, 11, 5, 11, 10, 11, 0, 3, -1],
  [5, 4, 8, 5, 8, 10, 10, 8, 11, -1],
  [9, 7, 8, 5, 7, 9, -1],
  [9, 3, 0, 9, 5, 3, 5, 7, 3, -1],
  [0, 7, 8, 0, 1, 7, 1, 5, 7, -1],
  [1, 5, 3, 3, 5, 7, -1],
  [9, 7, 8, 9, 5, 7, 10, 1, 2, -1],
  [10, 1, 2, 9, 5, 0, 5, 3, 0, 5, 7, 3, -1],
  [8, 0, 2, 8, 2, 5, 8, 5, 7, 10, 5, 2, -1],
  [2, 10, 5, 2, 5, 3, 3, 5, 7, -1],
  [7, 9, 5, 7, 8, 9, 3, 11, 2, -1],
  [9, 5, 7, 9, 7, 2, 9, 2, 0, 2, 7, 11, -1],
  [2, 3, 11, 0, 1, 8, 1, 7, 8, 1, 5, 7, -1],
  [11, 2, 1, 11, 1, 7, 7, 1, 5, -1],
  [9, 5, 8, 8, 5, 7, 10, 1, 3, 10, 3, 11, -1],
  [5, 7, 0, 5, 0, 9, 7, 11, 0, 1, 0, 10, 11, 10, 0, -1],
  [11, 10, 0, 11, 0, 3, 10, 5, 0, 8, 0, 7, 5, 7, 0, -1],
  [11, 10, 5, 7, 11, 5, -1],
  [10, 6, 5, -1],
  [0, 8, 3, 5, 10, 6, -1],
  [9, 0, 1, 5, 10, 6, -1],
  [1, 8, 3, 1, 9, 8, 5, 10, 6, -1],
  [1, 6, 5, 2, 6, 1, -1],
  [1, 6, 5, 1, 2, 6, 3, 0, 8, -1],
  [9, 6, 5, 9, 0, 6, 0, 2, 6, -1],
  [5, 9, 8, 5, 8, 2, 5, 2, 6, 3, 2, 8, -1],
  [2, 3, 11, 10, 6, 5, -1],
  [11, 0, 8, 11, 2, 0, 10, 6, 5, -1],
  [0, 1, 9, 2, 3, 11, 5, 10, 6, -1],
  [5, 10, 6, 1, 9, 2, 9, 11, 2, 9, 8, 11, -1],
  [6, 3, 11, 6, 5, 3, 5, 1, 3, -1],
  [0, 8, 11, 0, 11, 5, 0, 5, 1, 5, 11, 6, -1],
  [3, 11, 6, 0, 3, 6, 0, 6, 5, 0, 5, 9, -1],
  [6, 5, 9, 6, 9, 11, 11, 9, 8, -1],
  [5, 10, 6, 4, 7, 8, -1],
  [4, 3, 0, 4, 7, 3, 6, 5, 10, -1],
  [1, 9, 0, 5, 10, 6, 8, 4, 7, -1],
  [10, 6, 5, 1, 9, 7, 1, 7, 3, 7, 9, 4, -1],
  [6, 1, 2, 6, 5, 1, 4, 7, 8, -1],
  [1, 2, 5, 5, 2, 6, 3, 0, 4, 3, 4, 7, -1],
  [8, 4, 7, 9, 0, 5, 0, 6, 5, 0, 2, 6, -1],
  [7, 3, 9, 7, 9, 4, 3, 2, 9, 5, 9, 6, 2, 6, 9, -1],
  [3, 11, 2, 7, 8, 4, 10, 6, 5, -1],
  [5, 10, 6, 4, 7, 2, 4, 2, 0, 2, 7, 11, -1],
  [0, 1, 9, 4, 7, 8, 2, 3, 11, 5, 10, 6, -1],
  [9, 2, 1, 9, 11, 2, 9, 4, 11, 7, 11, 4, 5, 10, 6, -1],
  [8, 4, 7, 3, 11, 5, 3, 5, 1, 5, 11, 6, -1],
  [5, 1, 11, 5, 11, 6, 1, 0, 11, 7, 11, 4, 0, 4, 11, -1],
  [0, 5, 9, 0, 6, 5, 0, 3, 6, 11, 6, 3, 8, 4, 7, -1],
  [6, 5, 9, 6, 9, 11, 4, 7, 9, 7, 11, 9, -1],
  [10, 4, 9, 6, 4, 10, -1],
  [4, 10, 6, 4, 9, 10, 0, 8, 3, -1],
  [10, 0, 1, 10, 6, 0, 6, 4, 0, -1],
  [8, 3, 1, 8, 1, 6, 8, 6, 4, 6, 1, 10, -1],
  [1, 4, 9, 1, 2, 4, 2, 6, 4, -1],
  [3, 0, 8, 1, 2, 9, 2, 4, 9, 2, 6, 4, -1],
  [0, 2, 4, 4, 2, 6, -1],
  [8, 3, 2, 8, 2, 4, 4, 2, 6, -1],
  [10, 4, 9, 10, 6, 4, 11, 2, 3, -1],
  [0, 8, 2, 2, 8, 11, 4, 9, 10, 4, 10, 6, -1],
  [3, 11, 2, 0, 1, 6, 0, 6, 4, 6, 1, 10, -1],
  [6, 4, 1, 6, 1, 10, 4, 8, 1, 2, 1, 11, 8, 11, 1, -1],
  [9, 6, 4, 9, 3, 6, 9, 1, 3, 11, 6, 3, -1],
  [8, 11, 1, 8, 1, 0, 11, 6, 1, 9, 1, 4, 6, 4, 1, -1],
  [3, 11, 6, 3, 6, 0, 0, 6, 4, -1],
  [6, 4, 8, 11, 6, 8, -1],
  [7, 10, 6, 7, 8, 10, 8, 9, 10, -1],
  [0, 7, 3, 0, 10, 7, 0, 9, 10, 6, 7, 10, -1],
  [10, 6, 7, 1, 10, 7, 1, 7, 8, 1, 8, 0, -1],
  [10, 6, 7, 10, 7, 1, 1, 7, 3, -1],
  [1, 2, 6, 1, 6, 8, 1, 8, 9, 8, 6, 7, -1],
  [2, 6, 9, 2, 9, 1, 6, 7, 9, 0, 9, 3, 7, 3, 9, -1],
  [7, 8, 0, 7, 0, 6, 6, 0, 2, -1],
  [7, 3, 2, 6, 7, 2, -1],
  [2, 3, 11, 10, 6, 8, 10, 8, 9, 8, 6, 7, -1],
  [2, 0, 7, 2, 7, 11, 0, 9, 7, 6, 7, 10, 9, 10, 7, -1],
  [1, 8, 0, 1, 7, 8, 1, 10, 7, 6, 7, 10, 2, 3, 11, -1],
  [11, 2, 1, 11, 1, 7, 10, 6, 1, 6, 7, 1, -1],
  [8, 9, 6, 8, 6, 7, 9, 1, 6, 11, 6, 3, 1, 3, 6, -1],
  [0, 9, 1, 11, 6, 7, -1],
  [7, 8, 0, 7, 0, 6, 3, 11, 0, 11, 6, 0, -1],
  [7, 11, 6, -1],
  [7, 6, 11, -1],
  [3, 0, 8, 11, 7, 6, -1],
  [0, 1, 9, 11, 7, 6, -1],
  [8, 1, 9, 8, 3, 1, 11, 7, 6, -1],
  [10, 1, 2, 6, 11, 7, -1],
  [1, 2, 10, 3, 0, 8, 6, 11, 7, -1],
  [2, 9, 0, 2, 10, 9, 6, 11, 7, -1],
  [6, 11, 7, 2, 10, 3, 10, 8, 3, 10, 9, 8, -1],
  [7, 2, 3, 6, 2, 7, -1],
  [7, 0, 8, 7, 6, 0, 6, 2, 0, -1],
  [2, 7, 6, 2, 3, 7, 0, 1, 9, -1],
  [1, 6, 2, 1, 8, 6, 1, 9, 8, 8, 7, 6, -1],
  [10, 7, 6, 10, 1, 7, 1, 3, 7, -1],
  [10, 7, 6, 1, 7, 10, 1, 8, 7, 1, 0, 8, -1],
  [0, 3, 7, 0, 7, 10, 0, 10, 9, 6, 10, 7, -1],
  [7, 6, 10, 7, 10, 8, 8, 10, 9, -1],
  [6, 8, 4, 11, 8, 6, -1],
  [3, 6, 11, 3, 0, 6, 0, 4, 6, -1],
  [8, 6, 11, 8, 4, 6, 9, 0, 1, -1],
  [9, 4, 6, 9, 6, 3, 9, 3, 1, 11, 3, 6, -1],
  [6, 8, 4, 6, 11, 8, 2, 10, 1, -1],
  [1, 2, 10, 3, 0, 11, 0, 6, 11, 0, 4, 6, -1],
  [4, 11, 8, 4, 6, 11, 0, 2, 9, 2, 10, 9, -1],
  [10, 9, 3, 10, 3, 2, 9, 4, 3, 11, 3, 6, 4, 6, 3, -1],
  [8, 2, 3, 8, 4, 2, 4, 6, 2, -1],
  [0, 4, 2, 4, 6, 2, -1],
  [1, 9, 0, 2, 3, 4, 2, 4, 6, 4, 3, 8, -1],
  [1, 9, 4, 1, 4, 2, 2, 4, 6, -1],
  [8, 1, 3, 8, 6, 1, 8, 4, 6, 6, 10, 1, -1],
  [10, 1, 0, 10, 0, 6, 6, 0, 4, -1],
  [4, 6, 3, 4, 3, 8, 6, 10, 3, 0, 3, 9, 10, 9, 3, -1],
  [10, 9, 4, 6, 10, 4, -1],
  [4, 9, 5, 7, 6, 11, -1],
  [0, 8, 3, 4, 9, 5, 11, 7, 6, -1],
  [5, 0, 1, 5, 4, 0, 7, 6, 11, -1],
  [11, 7, 6, 8, 3, 4, 3, 5, 4, 3, 1, 5, -1],
  [9, 5, 4, 10, 1, 2, 7, 6, 11, -1],
  [6, 11, 7, 1, 2, 10, 0, 8, 3, 4, 9, 5, -1],
  [7, 6, 11, 5, 4, 10, 4, 2, 10, 4, 0, 2, -1],
  [3, 4, 8, 3, 5, 4, 3, 2, 5, 10, 5, 2, 11, 7, 6, -1],
  [7, 2, 3, 7, 6, 2, 5, 4, 9, -1],
  [9, 5, 4, 0, 8, 6, 0, 6, 2, 6, 8, 7, -1],
  [3, 6, 2, 3, 7, 6, 1, 5, 0, 5, 4, 0, -1],
  [6, 2, 8, 6, 8, 7, 2, 1, 8, 4, 8, 5, 1, 5, 8, -1],
  [9, 5, 4, 10, 1, 6, 1, 7, 6, 1, 3, 7, -1],
  [1, 6, 10, 1, 7, 6, 1, 0, 7, 8, 7, 0, 9, 5, 4, -1],
  [4, 0, 10, 4, 10, 5, 0, 3, 10, 6, 10, 7, 3, 7, 10, -1],
  [7, 6, 10, 7, 10, 8, 5, 4, 10, 4, 8, 10, -1],
  [6, 9, 5, 6, 11, 9, 11, 8, 9, -1],
  [3, 6, 11, 0, 6, 3, 0, 5, 6, 0, 9, 5, -1],
  [0, 11, 8, 0, 5, 11, 0, 1, 5, 5, 6, 11, -1],
  [6, 11, 3, 6, 3, 5, 5, 3, 1, -1],
  [1, 2, 10, 9, 5, 11, 9, 11, 8, 11, 5, 6, -1],
  [0, 11, 3, 0, 6, 11, 0, 9, 6, 5, 6, 9, 1, 2, 10, -1],
  [11, 8, 5, 11, 5, 6, 8, 0, 5, 10, 5, 2, 0, 2, 5, -1],
  [6, 11, 3, 6, 3, 5, 2, 10, 3, 10, 5, 3, -1],
  [5, 8, 9, 5, 2, 8, 5, 6, 2, 3, 8, 2, -1],
  [9, 5, 6, 9, 6, 0, 0, 6, 2, -1],
  [1, 5, 8, 1, 8, 0, 5, 6, 8, 3, 8, 2, 6, 2, 8, -1],
  [1, 5, 6, 2, 1, 6, -1],
  [1, 3, 6, 1, 6, 10, 3, 8, 6, 5, 6, 9, 8, 9, 6, -1],
  [10, 1, 0, 10, 0, 6, 9, 5, 0, 5, 6, 0, -1],
  [0, 3, 8, 5, 6, 10, -1],
  [10, 5, 6, -1],
  [11, 5, 10, 7, 5, 11, -1],
  [11, 5, 10, 11, 7, 5, 8, 3, 0, -1],
  [5, 11, 7, 5, 10, 11, 1, 9, 0, -1],
  [10, 7, 5, 10, 11, 7, 9, 8, 1, 8, 3, 1, -1],
  [11, 1, 2, 11, 7, 1, 7, 5, 1, -1],
  [0, 8, 3, 1, 2, 7, 1, 7, 5, 7, 2, 11, -1],
  [9, 7, 5, 9, 2, 7, 9, 0, 2, 2, 11, 7, -1],
  [7, 5, 2, 7, 2, 11, 5, 9, 2, 3, 2, 8, 9, 8, 2, -1],
  [2, 5, 10, 2, 3, 5, 3, 7, 5, -1],
  [8, 2, 0, 8, 5, 2, 8, 7, 5, 10, 2, 5, -1],
  [9, 0, 1, 5, 10, 3, 5, 3, 7, 3, 10, 2, -1],
  [9, 8, 2, 9, 2, 1, 8, 7, 2, 10, 2, 5, 7, 5, 2, -1],
  [1, 3, 5, 3, 7, 5, -1],
  [0, 8, 7, 0, 7, 1, 1, 7, 5, -1],
  [9, 0, 3, 9, 3, 5, 5, 3, 7, -1],
  [9, 8, 7, 5, 9, 7, -1],
  [5, 8, 4, 5, 10, 8, 10, 11, 8, -1],
  [5, 0, 4, 5, 11, 0, 5, 10, 11, 11, 3, 0, -1],
  [0, 1, 9, 8, 4, 10, 8, 10, 11, 10, 4, 5, -1],
  [10, 11, 4, 10, 4, 5, 11, 3, 4, 9, 4, 1, 3, 1, 4, -1],
  [2, 5, 1, 2, 8, 5, 2, 11, 8, 4, 5, 8, -1],
  [0, 4, 11, 0, 11, 3, 4, 5, 11, 2, 11, 1, 5, 1, 11, -1],
  [0, 2, 5, 0, 5, 9, 2, 11, 5, 4, 5, 8, 11, 8, 5, -1],
  [9, 4, 5, 2, 11, 3, -1],
  [2, 5, 10, 3, 5, 2, 3, 4, 5, 3, 8, 4, -1],
  [5, 10, 2, 5, 2, 4, 4, 2, 0, -1],
  [3, 10, 2, 3, 5, 10, 3, 8, 5, 4, 5, 8, 0, 1, 9, -1],
  [5, 10, 2, 5, 2, 4, 1, 9, 2, 9, 4, 2, -1],
  [8, 4, 5, 8, 5, 3, 3, 5, 1, -1],
  [0, 4, 5, 1, 0, 5, -1],
  [8, 4, 5, 8, 5, 3, 9, 0, 5, 0, 3, 5, -1],
  [9, 4, 5, -1],
  [4, 11, 7, 4, 9, 11, 9, 10, 11, -1],
  [0, 8, 3, 4, 9, 7, 9, 11, 7, 9, 10, 11, -1],
  [1, 10, 11, 1, 11, 4, 1, 4, 0, 7, 4, 11, -1],
  [3, 1, 4, 3, 4, 8, 1, 10, 4, 7, 4, 11, 10, 11, 4, -1],
  [4, 11, 7, 9, 11, 4, 9, 2, 11, 9, 1, 2, -1],
  [9, 7, 4, 9, 11, 7, 9, 1, 11, 2, 11, 1, 0, 8, 3, -1],
  [11, 7, 4, 11, 4, 2, 2, 4, 0, -1],
  [11, 7, 4, 11, 4, 2, 8, 3, 4, 3, 2, 4, -1],
  [2, 9, 10, 2, 7, 9, 2, 3, 7, 7, 4, 9, -1],
  [9, 10, 7, 9, 7, 4, 10, 2, 7, 8, 7, 0, 2, 0, 7, -1],
  [3, 7, 10, 3, 10, 2, 7, 4, 10, 1, 10, 0, 4, 0, 10, -1],
  [1, 10, 2, 8, 7, 4, -1],
  [4, 9, 1, 4, 1, 7, 7, 1, 3, -1],
  [4, 9, 1, 4, 1, 7, 0, 8, 1, 8, 7, 1, -1],
  [4, 0, 3, 7, 4, 3, -1],
  [4, 8, 7, -1],
  [9, 10, 8, 10, 11, 8, -1],
  [3, 0, 9, 3, 9, 11, 11, 9, 10, -1],
  [0, 1, 10, 0, 10, 8, 8, 10, 11, -1],
  [3, 1, 10, 11, 3, 10, -1],
  [1, 2, 11, 1, 11, 9, 9, 11, 8, -1],
  [3, 0, 9, 3, 9, 11, 1, 2, 9, 2, 11, 9, -1],
  [0, 2, 11, 8, 0, 11, -1],
  [3, 2, 11, -1],
  [2, 3, 8, 2, 8, 10, 10, 8, 9, -1],
  [9, 10, 2, 0, 9, 2, -1],
  [2, 3, 8, 2, 8, 10, 0, 1, 8, 1, 10, 8, -1],
  [1, 10, 2, -1],
  [1, 3, 8, 9, 1, 8, -1],
  [0, 9, 1, -1],
  [0, 3, 8, -1],
  [-1],
];

const VMAP = new Map();

function marchingCubes(res, sdf, bounds) {
  const [x0, x1, y0, y1, z0, z1] = bounds;
  const dx = (x1 - x0) / (res - 1),
    dy = (y1 - y0) / (res - 1),
    dz = (z1 - z0) / (res - 1);
  const field = new Float32Array(res * res * res);
  for (let k = 0, idx = 0; k < res; k++)
    for (let j = 0; j < res; j++)
      for (let i = 0; i < res; i++, idx++)
        field[idx] = sdf(x0 + i * dx, y0 + j * dy, z0 + k * dz);

  let min = Infinity,
    max = -Infinity;
  for (let i = 0; i < field.length; i++) {
    const v = field[i];
    if (!Number.isFinite(v)) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  //console.log("SDF range inside marchingCubes:", min, max);

  // Preallocate — avoids thousands of Array.push reallocations
  const MAX_VERTS = res * res * res * 5; // safe upper bound
  const positions = new Float32Array(MAX_VERTS * 3);
  const indices = new Uint32Array(MAX_VERTS * 3);
  let vertexCount = 0;
  let indexCount = 0;

  // CLEAR the map instead of creating a new one
  VMAP.clear();

  const getVert = (v) => {
    // 1. Quantize the position to an integer grid
    // We use a larger epsilon or direct bit-shifting to pack 3 values into 32 bits
    const ix = (v.x * 100) | 0;
    const iy = (v.y * 100) | 0;
    const iz = (v.z * 100) | 0;

    // 2. Bit-packing (10 bits per axis: supports -512 to 511 range)
    // This is way faster than string concatenation
    const key = ((ix + 512) << 20) | ((iy + 512) << 10) | (iz + 512);

    if (VMAP.has(key)) return VMAP.get(key);

    const idx = vertexCount;
    positions[vertexCount * 3 + 0] = v.x;
    positions[vertexCount * 3 + 1] = v.y;
    positions[vertexCount * 3 + 2] = v.z;
    vertexCount++;

    VMAP.set(key, idx);
    return idx;
  };

  const lerp = (out, p1, p2, v1, v2) => {
    const t = Math.abs(v1 - v2) < 1e-10 ? 0 : -v1 / (v2 - v1);
    out.set(
      p1.x + t * (p2.x - p1.x),
      p1.y + t * (p2.y - p1.y),
      p1.z + t * (p2.z - p1.z),
    );
  };

  // Move outside — create only once
  const corners = new Array(8);
  for (let i = 0; i < 8; i++) corners[i] = new THREE.Vector3();

  const verts = new Array(12);
  for (let i = 0; i < 12; i++) verts[i] = new THREE.Vector3();

  const vals = new Float32Array(8); // even better than Array

  let nonZeroCubes = 0;
  let anyEdges = 0;

  for (let k = 0; k < res - 1; k++) {
    for (let j = 0; j < res - 1; j++) {
      for (let i = 0; i < res - 1; i++) {
        const x = x0 + i * dx,
          y = y0 + j * dy,
          z = z0 + k * dz;
        corners[0].set(x, y, z);
        corners[1].set(x + dx, y, z);
        corners[2].set(x + dx, y + dy, z);
        corners[3].set(x, y + dy, z);
        corners[4].set(x, y, z + dz);
        corners[5].set(x + dx, y, z + dz);
        corners[6].set(x + dx, y + dy, z + dz);
        corners[7].set(x, y + dy, z + dz);

        const base = k * res * res + j * res + i;

        vals[0] = field[base]; // (0,0,0)
        vals[1] = field[base + 1]; // (1,0,0)
        vals[2] = field[base + 1 + res]; // (1,1,0)
        vals[3] = field[base + res]; // (0,1,0)

        vals[4] = field[base + res * res]; // (0,0,1)
        vals[5] = field[base + 1 + res * res]; // (1,0,1)
        vals[6] = field[base + 1 + res + res * res]; // (1,1,1)
        vals[7] = field[base + res + res * res]; // (0,1,1)

        let ci = 0;
        for (let n = 0; n < 8; n++) if (vals[n] < 0) ci |= 1 << n;

        if (ci !== 0 && ci !== 255) nonZeroCubes++;
        if (edgeTable[ci]) anyEdges++;

        const e = edgeTable[ci];

        if (!e) continue;
        if (e & 1)
          lerp(verts[0], corners[0], corners[1], vals[0], vals[1]);
        if (e & 2)
          lerp(verts[1], corners[1], corners[2], vals[1], vals[2]);
        if (e & 4)
          lerp(verts[2], corners[2], corners[3], vals[2], vals[3]);
        if (e & 8)
          lerp(verts[3], corners[3], corners[0], vals[3], vals[0]);
        if (e & 16)
          lerp(verts[4], corners[4], corners[5], vals[4], vals[5]);
        if (e & 32)
          lerp(verts[5], corners[5], corners[6], vals[5], vals[6]);
        if (e & 64)
          lerp(verts[6], corners[6], corners[7], vals[6], vals[7]);
        if (e & 128)
          lerp(verts[7], corners[7], corners[4], vals[7], vals[4]);
        if (e & 256)
          lerp(verts[8], corners[0], corners[4], vals[0], vals[4]);
        if (e & 512)
          lerp(verts[9], corners[1], corners[5], vals[1], vals[5]);
        if (e & 1024)
          lerp(verts[10], corners[2], corners[6], vals[2], vals[6]);
        if (e & 2048)
          lerp(verts[11], corners[3], corners[7], vals[3], vals[7]);

        const tri = triTable[ci];
        for (let t = 0; tri[t] !== -1; t += 3) {
          const a = verts[tri[t]],
            b = verts[tri[t + 1]],
            c = verts[tri[t + 2]];

          if (!a || !b || !c) continue;

          const ia = getVert(a);
          const ib = getVert(b);
          const ic = getVert(c);

          if (ia !== ib && ib !== ic && ic !== ia) {
            // Typed array → manual index assignment (no .push)
            indices[indexCount++] = ia;
            indices[indexCount++] = ic;
            indices[indexCount++] = ib;
          }
        }
      }
    }
  }

  /*console.log(
          "MC stats: nonZeroCubes =",
          nonZeroCubes,
          "anyEdges =",
          anyEdges,
        );*/

  const geom = new THREE.BufferGeometry();
  geom.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      positions.subarray(0, vertexCount * 3),
      3,
    ),
  );
  geom.setIndex(
    new THREE.Uint32BufferAttribute(indices.subarray(0, indexCount), 1),
  );
  if (res > CONFIG.LOD_SPHERE0_RESOLUTION) {
    geom.computeVertexNormals();
  }
  return geom;
}

function createBoxImpostor(radii) {
  const r = radii.avgRadius;
  const sq = radii.squashRatio;
  return new THREE.BoxGeometry(r * 1.2, r * sq * 1.2, r * 1.2);
}
function createSphereImpostor0(radii) {
  const geom = new THREE.IcosahedronGeometry(1, 0);
  const r = radii.avgRadius;
  const sq = radii.squashRatio;
  geom.scale(r * 1.2, r * sq * 1.2, r * 1.2);
  return geom;
}

function createSphereImpostor1(radii) {
  const geom = new THREE.IcosahedronGeometry(1, 1);
  const r = radii.avgRadius;
  const sq = radii.squashRatio;
  geom.scale(r * 0.9, r * sq * 0.9, r * 0.9);
  return geom;
}

// ==========================================================
// SHADER DE LA ROCA  (copiado de ROCAS.html; ver cabecera)
// ==========================================================
function attachRockShader(material) {
  material.onBeforeCompile = (shader) => {
            // --- Per-instance uniforms ---
            material.userData.rockShader = shader;
            shader.uniforms.noiseOrigin = { value: NOISE_ORIGIN };
            // V102: el camino caro del shader (18 evaluaciones de ruido por
            // píxel entre fbm y perturbNormal) se limita a las rocas que están
            // muy cerca. Es un uniform para que el módulo de fluidez lo baje, o
            // lo ponga a cero, cuando la máquina no da más de sí.
            shader.uniforms.rockDetailDistance = ROCK_DETAIL_DISTANCE;
            shader.uniforms.seed = { value: 0.0 };
            shader.uniforms.colorTinge = { value: 0.0 };
            shader.uniforms.variation = {
              value: new THREE.Vector3(0.0, 0.0, 0.0),
            };

            // --- Use sun direction & color ---
            shader.uniforms.lightDir = {
              value: sun.position.clone().normalize(),
            };
            shader.uniforms.lightColor = {
              value: sun.color.clone().multiplyScalar(sun.intensity),
            };

            // --- Vertex shader: inject attributes & varyings ---
            shader.vertexShader =
              `
          attribute float seed;
          attribute float colorType;
          attribute vec4 variation;

          varying vec3 vWorldPos;
          varying vec3 vViewDir;

          varying float vSeed;
          varying float vColorType;
          varying vec3 vVariation;      // x: wetness, y: roughness, z: tinge

          varying vec3 vNormalComp;

          varying float vViewZ;
          varying float vGroundY;
          varying vec3 vNoisePos;
          uniform vec3 noiseOrigin;
        ` + shader.vertexShader;

            shader.vertexShader = shader.vertexShader.replace(
              "#include <begin_vertex>",
              `
       #include <begin_vertex>
            vec4 worldPos = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
            vWorldPos = worldPos.xyz;

            vec4 viewPos = viewMatrix * worldPos;
            vViewZ = -viewPos.z;

            mat3 nMat = mat3(modelMatrix) * mat3(instanceMatrix);
            vNormalComp = normalize(nMat * normal);
            vViewDir = normalize(cameraPosition - worldPos.xyz);

            vSeed = seed;
            vColorType = colorType;
            vVariation = variation.xyz;
            vGroundY = variation.w;
            vNoisePos = worldPos.xyz - noiseOrigin;
          `,
            );

            // --- Fragment shader: inject varyings & helper functions ---
            shader.fragmentShader =
              `            
            varying float vSeed;
            varying float vColorType;
            varying vec3 vVariation;            

            varying vec3 vWorldPos;
            varying vec3 vViewDir;

            varying vec3 vNormalComp;

            varying float vViewZ;
            varying float vGroundY;
            varying vec3 vNoisePos;

            uniform float rockDetailDistance;
            uniform vec3 lightDir;
            uniform vec3 lightColor;

            float hash(float n) { return fract(sin(n) * 43758.5453); }

            float noise(vec3 x) {
              vec3 p = floor(x);
              vec3 f = fract(x);
              f = f * f * (3.0 - 2.0 * f);
              float n = p.x + p.y * 57.0 + 113.0 * p.z;
              return mix(mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
                             mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y),
                         mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
                             mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y), f.z);
            }

            float fbm(vec3 p) {
              float f = 0.0;
              f += 0.500 * noise(p); p *= 2.02;
              f += 0.250 * noise(p); p *= 2.03;
              f += 0.125 * noise(p);
              return f;
            }

            vec3 perturbNormal(vec3 n, vec3 p, float scale, float strength) {
              float eps = ${NOISE_EPS};
              float n0 = fbm(p * scale);
              float nX = fbm((p + vec3(eps, 0.0, 0.0)) * scale);
              float nY = fbm((p + vec3(0.0, eps, 0.0)) * scale);
              float nZ = fbm((p + vec3(0.0, 0.0, eps)) * scale);
              vec3 grad = vec3(nX - n0, nY - n0, nZ - n0) / eps;
              return normalize(n - grad * strength);
            }

            // Color palette generator
            vec3 getRockColor(float t, float seed, float tinge) {
                float i = floor(t+0.5);
                vec3 base;
                if(i < 0.5) base = vec3(0.12,0.11,0.10);
                else if(i < 1.5) base = vec3(0.50,0.42,0.32);
                else if(i < 2.5) base = vec3(0.42,0.41,0.43);
                else if(i < 3.5) base = vec3(0.20,0.17,0.14);
                else if(i < 4.5) base = vec3(0.08,0.08,0.09);
                else if(i < 5.5) base = vec3(0.65,0.62,0.55);
                else base = vec3(0.38,0.36,0.33);

                float variation = hash(seed*0.1)*0.15 - 0.075;
                base *= (1.0 + variation);

                base.r += tinge;
                base.g += tinge*0.5;
                base.b -= tinge*0.3;

                return clamp(base,0.0,1.0);
            }

          ` + shader.fragmentShader;

            shader.fragmentShader = shader.fragmentShader.replace(
              "#include <dithering_fragment>",
              `
        #include <dithering_fragment>

        if (vWorldPos.y < vGroundY) discard;

        float wetness = vVariation.x;
        float roughness = vVariation.y;
        float colorTinge = vVariation.z;

        vec3 N;
        vec3 finalColor;
        float detail = 0.5; // Default neutral detail for distant rocks
        float nVal = 0.5;

        float detailThreshold = rockDetailDistance; // faraway LODs get flat normals and a simple color mix with zero noise calls

        if (vViewZ < detailThreshold) {
              // 1. Detailed Noise
              nVal = fbm(vNoisePos * ${NOISE_LOW} + vSeed);
              detail = fbm(vNoisePos * ${NOISE_HIGH} + vSeed);

              // 2. Perturb Normal
              N = perturbNormal(normalize(vNormalComp), vNoisePos, ${NOISE_HIGH}, 0.4 * (1.0 - wetness));

              // 3. COLOR MIXING
              vec3 instanceColor = getRockColor(vColorType, vSeed, colorTinge);
              vec3 sandColor = mix(instanceColor, vec3(0.6, 0.55, 0.5), 0.5);

              float upDot = dot(N, vec3(0.0, 1.0, 0.0));
              // The mixFactor average is roughly 0.5-0.6 depending on noise distribution
              float mixFactor = smoothstep(0.2, 0.8, nVal + detail * 0.5 + upDot * 0.2);
              finalColor = mix(instanceColor, sandColor, mixFactor * 0.5);
          } else {
              // OPTIMIZED PATH
              N = normalize(vNormalComp);
              vec3 instanceColor = getRockColor(vColorType, vSeed, colorTinge);

              // COMPENSATE FOR BRIGHTNESS:
              // We simulate the average "sand" contribution from the detailed path.
              // The detailed path mixes in 50% sandColor at a variable mixFactor.
              // Applying a 0.25 (25%) mix of sandColor here matches the median brightness.
              vec3 sandColor = mix(instanceColor, vec3(0.6, 0.55, 0.5), 0.5);
              finalColor = mix(instanceColor, sandColor, 0.25);
          }

          finalColor *= mix(1.0, 0.5, wetness);

          // 4. Lighting
          vec3 L = normalize(lightDir);
          vec3 V = vViewDir;
          vec3 H = normalize(L + V);

          float NdotL = max(dot(N, L), 0.0);
          float NdotH = max(dot(N, H), 0.0);

          vec3 lit = finalColor * (vec3(0.35) + lightColor * NdotL * 0.7);

          // Wet Specular
          float specPower = mix(10.0, 100.0, wetness * (2.0 - roughness));
          float specStrength = mix(0.05, 1.0, wetness);

          // Smooth transition for the mask
          // We assume an average mask of 0.8 for distant rocks to avoid the "darkening" pop
          float specMask = (vViewZ < detailThreshold) ? smoothstep(0.4, 0.6, detail) : 0.8;

          float spec = pow(NdotH, specPower) * specStrength * specMask;
          lit += lightColor * spec;

          // Fresnel (Small compensation for distant path)
          if (vViewZ < detailThreshold) {
              float fresnel = pow(1.0 - max(dot(N, V), 0.0), 4.0);
              lit += lightColor * fresnel * 0.3 * wetness;
          } else {
              // Add a tiny constant "rim" boost to distant wet rocks to match close-up Fresnel feel
              lit += lightColor * 0.05 * wetness;
          }

          gl_FragColor.rgb = lit;
          gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(1.1));
          `,
            );
  };
  material.customProgramCacheKey = () => 'gta-manucho-rocas-v101';
}


// ==========================================================
// GENERACIÓN DE LOS LOD (repartida entre fotogramas para no congelar nada)
// ==========================================================
const rockLODs = [];
const rockBoundingRadii = [];

function buildShape(s){
  const { sdf, scale } = createRockSDF(s * 7919 + 1337);

  const highestRes = CONFIG.LOD_RESOLUTIONS[0];
  const bounds = [-1.5, 1.5, -1.5, 1.5, -1.5, 1.5];
  const highGeom = marchingCubes(highestRes, sdf, bounds);

  const pos = highGeom.attributes.position.array;
  const vertCount = pos.length / 3;

  let cx = 0, cy = 0, cz = 0;
  for (let v = 0; v < vertCount; v++) { cx += pos[v*3]; cy += pos[v*3+1]; cz += pos[v*3+2]; }
  cx /= vertCount; cy /= vertCount; cz /= vertCount;

  let totalDist = 0, minY = Infinity, maxY = -Infinity;
  for (let v = 0; v < vertCount; v++) {
    const dx = pos[v*3] - cx, dy = pos[v*3+1] - cy, dz = pos[v*3+2] - cz;
    totalDist += Math.sqrt(dx*dx + dy*dy + dz*dz);
    minY = Math.min(minY, pos[v*3+1]);
    maxY = Math.max(maxY, pos[v*3+1]);
  }

  const avgRadius = totalDist / vertCount;
  const heightExtent = (maxY - minY) / 2;
  rockBoundingRadii[s] = {
    avgRadius,
    squashRatio: heightExtent / avgRadius,
    bottomY: minY,
    height: maxY - minY
  };

  rockLODs[s] = CONFIG.LOD_RESOLUTIONS.map((res, i) => {
    if (res <= CONFIG.LOD_BOX_RESOLUTION) return createBoxImpostor(rockBoundingRadii[s]);
    if (res <= CONFIG.LOD_SPHERE0_RESOLUTION) return createSphereImpostor0(rockBoundingRadii[s]);
    if (res <= CONFIG.LOD_SPHERE1_RESOLUTION) return createSphereImpostor1(rockBoundingRadii[s]);
    if (i === 0) return highGeom;
    return marchingCubes(res, sdf, [-1.5, 1.5, -1.5, 1.5, -1.5, 1.5]);
  });
}

// ==========================================================
// COLOCACIÓN: 14 flotantes por instancia
//   0:x 1:z 2:scale 3:rotY 4:rotX 5:rotZ 6:shape 7:colorType 8:seed
//   9:wetness 10:roughness 11:colorTinge 12:squash 13:groundY
// ==========================================================
const FLOATS_PER_INSTANCE = 14;
let instanceData = null;
let allMatrices = null;

function placeRocks(islands, groundAt){
  const buffer = [];
  const tempBox = [];
  let sumX = 0, sumZ = 0, weight = 0;

  for (let islandIndex = 0; islandIndex < islands.length; islandIndex++) {
    const island = islands[islandIndex];
    const landRadius = island.landRadius || island.radius || 0;
    if (!(landRadius > 0)) continue;

    sumX += island.x; sumZ += island.z; weight++;

    const rng = new SeededRNG(20250726 + islandIndex * 9911);
    // V110: bajado de 2600/2000. Salían 2554 rocas y el recorrido de nivel de
    // detalle las repasa TODAS cada fotograma. Con unas 900 se sigue viendo una
    // playa llena de piedras y ese recorrido cuesta un tercio.
    const attempts = islandIndex === 0 ? 950 : 700;

    for (let i = 0; i < attempts; i++) {
      const angle = rng.next() * Math.PI * 2;
      // Sesgo hacia la orilla: es donde de verdad se acumulan las piedras.
      const t = 0.22 + Math.pow(rng.next(), 0.55) * 1.24;
      const radius = landRadius * t;
      const x = island.x + Math.cos(angle) * radius;
      const z = island.z + Math.sin(angle) * radius;

      const ground = groundAt(x, z);
      if (!Number.isFinite(ground)) continue;                       // fuera de la malla
      if (ground < WATER_LEVEL - 5.5 * WORLD_SCALE) continue;       // demasiado hondo
      if (ground > WATER_LEVEL + 13 * WORLD_SCALE) continue;        // por encima de la cima

      const idx = buffer.length;
      for (let k = 0; k < FLOATS_PER_INSTANCE; k++) buffer.push(0);

      buffer[idx + 0] = x;
      buffer[idx + 1] = z;

      const bias = rng.next();
      const biased = bias * bias * bias;
      const baseScale = CONFIG.MIN_SCALE + biased * (CONFIG.MAX_SCALE - CONFIG.MIN_SCALE);
      const microMul = 0.92 + rng.next() * 0.16;
      buffer[idx + 2] = baseScale * microMul;

      buffer[idx + 3] = rng.next() * Math.PI * 2;
      buffer[idx + 4] = (rng.next() - 0.5) * 0.5;
      buffer[idx + 5] = (rng.next() - 0.5) * 0.5;

      buffer[idx + 6] = Math.floor(rng.next() * CONFIG.NUM_ROCK_SHAPES);
      buffer[idx + 7] = Math.floor(rng.next() * 7);
      buffer[idx + 8] = rng.next() * 1000;

      buffer[idx + 9]  = rng.range(CONFIG.MIN_WETNESS, CONFIG.MAX_WETNESS);
      buffer[idx + 10] = rng.range(CONFIG.MIN_ROUGHNESS, CONFIG.MAX_ROUGHNESS);
      buffer[idx + 11] = rng.range(CONFIG.MIN_COLOR_TINGE, CONFIG.MAX_COLOR_TINGE);
      buffer[idx + 12] = rng.range(CONFIG.MIN_SQUASH, CONFIG.MAX_SQUASH);
      buffer[idx + 13] = ground;

      tempBox.push(idx / FLOATS_PER_INSTANCE);
    }
  }

  if (weight) {
    clusterCenter.set(sumX / weight, WATER_LEVEL, sumZ / weight);
    NOISE_ORIGIN.copy(clusterCenter);
    clusterRadius = 0;
    for (const island of islands) {
      const r = Math.hypot(island.x - clusterCenter.x, island.z - clusterCenter.z) + (island.landRadius || 0) * 1.5;
      if (r > clusterRadius) clusterRadius = r;
    }
  }

  instanceData = new Float32Array(buffer);
  CONFIG.INSTANCE_COUNT = instanceData.length / FLOATS_PER_INSTANCE;
  return CONFIG.INSTANCE_COUNT;
}

function precomputeMatrices(){
  allMatrices = new Float32Array(CONFIG.INSTANCE_COUNT * 16);
  const tempObj = new THREE.Object3D();

  for (let i = 0; i < CONFIG.INSTANCE_COUNT; i++) {
    const idx = i * FLOATS_PER_INSTANCE;
    const scale = instanceData[idx + 2] * ROCK_UNIT;
    const squash = instanceData[idx + 12];
    const shape = instanceData[idx + 6];
    const rockInfo = rockBoundingRadii[shape];
    const bottomY = rockInfo.bottomY;
    const height = rockInfo.height;

    tempObj.rotation.set(instanceData[idx + 4], instanceData[idx + 3], instanceData[idx + 5]);
    tempObj.scale.set(scale, scale * squash, scale);

    const yOffset = -bottomY * scale * squash - height * scale * squash * CONFIG.GROUND_SINKING;

    tempObj.position.set(instanceData[idx + 0], instanceData[idx + 13] + yOffset, instanceData[idx + 1]);
    tempObj.updateMatrix();
    tempObj.matrix.toArray(allMatrices, i * 16);
  }
}

// Sólo los pedruscos grandes que sobresalen del agua se vuelven sólidos, y la
// caja de colisión va metida DENTRO de la piedra (nunca sobresale). Así se
// notan al chocar pero es imposible pisar un borde invisible, que es
// justamente el defecto que se estaba corrigiendo en las islas.
//
// El tope se queda bajo a propósito: cada consulta de suelo recorre las cajas
// cercanas, y las dos islas caben en muy pocas celdas del obstacleGrid. Con
// cientos de cajas ahí dentro, getGroundY se convertiría en un cuello de
// botella y volverían los tirones.
const MAX_SOLID_ROCKS = 120;

function registerRockObstacles(){
  if (typeof game?.addObstacle !== 'function') return 0;

  // 1) Candidatas: rocas grandes, apoyadas en tierra o justo en la orilla.
  const candidates = [];
  for (let i = 0; i < CONFIG.INSTANCE_COUNT; i++) {
    const idx = i * FLOATS_PER_INSTANCE;
    const ground = instanceData[idx + 13];
    if (ground < WATER_LEVEL - 0.5 * WORLD_SCALE) continue;
    const scale = instanceData[idx + 2] * ROCK_UNIT;
    const info = rockBoundingRadii[instanceData[idx + 6]];
    const radius = scale * info.avgRadius;
    if (radius < 2 * WORLD_SCALE) continue;
    candidates.push(i);
  }
  if (!candidates.length) return 0;

  // 2) Reparto uniforme: se recorren a saltos para que caigan en las dos islas
  //    y no se agote el tope en la primera.
  const step = Math.max(1, Math.floor(candidates.length / MAX_SOLID_ROCKS));
  let added = 0;
  for (let c = 0; c < candidates.length && added < MAX_SOLID_ROCKS; c += step) {
    const idx = candidates[c] * FLOATS_PER_INSTANCE;
    const scale = instanceData[idx + 2] * ROCK_UNIT;
    const squash = instanceData[idx + 12];
    const info = rockBoundingRadii[instanceData[idx + 6]];
    const radius = scale * info.avgRadius;
    const heightAbove = info.height * scale * squash * (1 - CONFIG.GROUND_SINKING);
    // Cuadrado inscrito en la piedra (lado = radio, no diámetro) y algo menos
    // de altura de la que se ve: la colisión queda siempre por dentro.
    game.addObstacle(
      instanceData[idx + 0], instanceData[idx + 1],
      radius, radius,
      Math.max(0.4 * WORLD_SCALE, heightAbove * 0.5),
      instanceData[idx + 13]
    );
    added++;
  }
  return added;
}

// ==========================================================
// LOD MANAGER (mismo esquema del adjunto, con grupo propio)
// ==========================================================
class LODInstanceManager {
  constructor(){
    this.meshes = [];
    this.maxPerMesh = Math.max(64, Math.min(CONFIG.INSTANCE_COUNT, 640));
    this.lodCounts = CONFIG.LOD_RESOLUTIONS.map(() => 0);
    this.totalVisible = 0;
    this.tempSphere = new THREE.Sphere(new THREE.Vector3(), 0);
    this.lodDistSq = CONFIG.LOD_DISTANCES.map(d => d * d);
    this.workingCounts = new Uint32Array(CONFIG.NUM_ROCK_SHAPES * CONFIG.LOD_RESOLUTIONS.length);
    this.workingHash = new Int32Array(CONFIG.NUM_ROCK_SHAPES * CONFIG.LOD_RESOLUTIONS.length);
    this.lastHash = new Int32Array(CONFIG.NUM_ROCK_SHAPES * CONFIG.LOD_RESOLUTIONS.length);
    this.init();
  }

  init(){
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 1.0,
      metalness: 0.0,
      flatShading: false,
      side: THREE.FrontSide,
      fog: true
    });
    attachRockShader(material);
    this.material = material;

    for (let s = 0; s < CONFIG.NUM_ROCK_SHAPES; s++) {
      for (let l = 0; l < CONFIG.LOD_RESOLUTIONS.length; l++) {
        const geom = rockLODs[s][l].clone();

        geom.setAttribute('seed', new THREE.InstancedBufferAttribute(new Float32Array(this.maxPerMesh), 1));
        geom.setAttribute('colorType', new THREE.InstancedBufferAttribute(new Float32Array(this.maxPerMesh), 1));
        geom.setAttribute('variation', new THREE.InstancedBufferAttribute(new Float32Array(this.maxPerMesh * 4), 4));

        const mesh = new THREE.InstancedMesh(geom, material, this.maxPerMesh);
        mesh.name = `ROCAS_ADJUNTAS_S${s}_LOD${l}`;
        mesh.count = 0;
        mesh.visible = false;
        mesh.frustumCulled = false;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        mesh._lastVisibleCount = 0;
        rockGroup.add(mesh);
        this.meshes.push(mesh);
      }
    }
  }

  hideAll(){
    if (this.totalVisible === 0) return;
    for (const mesh of this.meshes) { mesh.count = 0; mesh.visible = false; }
    this.totalVisible = 0;
  }

  update(camera){
    const camX = camera.position.x;
    const camZ = camera.position.z;
    const numLods = CONFIG.LOD_RESOLUTIONS.length;
    const maxDistSq = CONFIG.VIEW_DISTANCE * CONFIG.VIEW_DISTANCE;

    projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projScreenMatrix);

    this.workingCounts.fill(0);
    this.workingHash.fill(0);

    for (let i = 0; i < CONFIG.INSTANCE_COUNT; i++) {
      const idx = i * FLOATS_PER_INSTANCE;
      const x = instanceData[idx + 0];
      const z = instanceData[idx + 1];
      const scale = instanceData[idx + 2] * ROCK_UNIT;

      const dx = x - camX;
      const dz = z - camZ;
      const distSq = dx * dx + dz * dz;
      if (distSq > maxDistSq) continue;

      if (CONFIG.FRUSTUM_CULLING) {
        this.tempSphere.center.set(x, instanceData[idx + 13] + scale * 0.4, z);
        this.tempSphere.radius = scale * 1.7;
        if (!frustum.intersectsSphere(this.tempSphere)) continue;
      }

      let lod = numLods - 1;
      for (let ll = 0; ll < numLods - 1; ll++) {
        if (distSq < this.lodDistSq[ll + 1]) { lod = ll; break; }
      }

      const bucket = Math.floor(instanceData[idx + 6]) * numLods + lod;
      const j = this.workingCounts[bucket];
      if (j >= this.maxPerMesh) continue;

      const mesh = this.meshes[bucket];
      const matrixIdx = i * 16;
      mesh.instanceMatrix.array.set(allMatrices.subarray(matrixIdx, matrixIdx + 16), j * 16);
      mesh.geometry.attributes.seed.array[j] = instanceData[idx + 8];
      mesh.geometry.attributes.colorType.array[j] = instanceData[idx + 7];

      const vIdx = j * 4;
      const varArr = mesh.geometry.attributes.variation.array;
      varArr[vIdx + 0] = instanceData[idx + 9];
      varArr[vIdx + 1] = instanceData[idx + 10];
      varArr[vIdx + 2] = instanceData[idx + 11];
      // Cota de recorte: por debajo del terreno, con margen para las cuestas.
      varArr[vIdx + 3] = instanceData[idx + 13] - scale * 0.55;

      this.workingCounts[bucket]++;
      this.workingHash[bucket] = (this.workingHash[bucket] * 31 + i) | 0;
    }

    this.totalVisible = 0;
    this.lodCounts.fill(0);

    for (let bucket = 0; bucket < this.meshes.length; bucket++) {
      const mesh = this.meshes[bucket];
      const count = this.workingCounts[bucket];
      const changed = count !== mesh._lastVisibleCount || this.workingHash[bucket] !== this.lastHash[bucket];

      mesh.count = count;
      mesh.visible = count > 0;
      this.lodCounts[bucket % numLods] += count;
      this.totalVisible += count;

      if (changed && count > 0) {
        mesh.instanceMatrix.clearUpdateRanges();
        mesh.instanceMatrix.addUpdateRange(0, count * 16);
        mesh.instanceMatrix.needsUpdate = true;

        const seedAttr = mesh.geometry.attributes.seed;
        seedAttr.clearUpdateRanges(); seedAttr.addUpdateRange(0, count); seedAttr.needsUpdate = true;

        const ctAttr = mesh.geometry.attributes.colorType;
        ctAttr.clearUpdateRanges(); ctAttr.addUpdateRange(0, count); ctAttr.needsUpdate = true;

        const varAttr = mesh.geometry.attributes.variation;
        varAttr.clearUpdateRanges(); varAttr.addUpdateRange(0, count * 4); varAttr.needsUpdate = true;
      }
      mesh._lastVisibleCount = count;
      this.lastHash[bucket] = this.workingHash[bucket];
    }
  }
}

// ==========================================================
// SOL Y BUCLE
// ==========================================================
function refreshSun(){
  if (game?.sun?.isVector3) sun.position.copy(game.sun).normalize();
  if (game?.dLight) {
    sun.color.copy(game.dLight.color);
    sun.intensity = game.dLight.intensity || 1;
  }
  const shader = lodManager?.material?.userData?.rockShader;
  if (!shader?.uniforms) return;
  shader.uniforms.lightDir.value.copy(sun.position);
  shader.uniforms.lightColor.value.copy(sun.color).multiplyScalar(sun.intensity);
}

let lodTick = 0;

function frame(){
  requestAnimationFrame(frame);
  if (!lodManager || document.hidden || !window.__VICE_CITY_REVEALED__ || window.__VICE_ZONE_TRANSITION__) return;
  // V110: el nivel de detalle se recalcula cada dos fotogramas. A 60 fps son
  // 33 ms: imperceptible, y ahorra la mitad del recorrido de instancias.
  if ((lodTick = (lodTick + 1) % 2) !== 0) return;
  const camera = game?.camera;
  if (!camera) return;

  // Salida rápida: si el jugador no está en la zona marina no se toca nada.
  const dx = camera.position.x - clusterCenter.x;
  const dz = camera.position.z - clusterCenter.z;
  const reach = clusterRadius + CONFIG.VIEW_DISTANCE;
  if (dx * dx + dz * dz > reach * reach) { lodManager.hideAll(); return; }

  const now = performance.now();
  if (now >= nextSunRefresh) { nextSunRefresh = now + 900; refreshSun(); }

  camera.updateMatrixWorld();
  lodManager.update(camera);
}

// ==========================================================
// INSTALACIÓN
// ==========================================================
async function install(){
  if (installed) return;
  game = window.__VICE_CITY_GAME__;
  const groundAt = window.__GTA_ISLAND_GROUND_RAW__ || window.__GTA_ISLAND_GROUND__;
  const islands = window.__GTA_MANUCHO_ISLANDS__;
  if (!game?.scene || !groundAt || !islands?.length) return;
  installed = true;

  try {
    console.time('[rocas-v101] formas del adjunto');
    for (let s = 0; s < CONFIG.NUM_ROCK_SHAPES; s++) {
      buildShape(s);
      await nextFrame();           // una forma por fotograma: cero congelaciones
    }
    console.timeEnd('[rocas-v101] formas del adjunto');

    await idleTurn(500);
    const total = placeRocks(islands, groundAt);
    if (!total) { console.warn('[rocas-v101] Ninguna roca cayó sobre la malla de las islas.'); return; }

    await nextFrame();
    precomputeMatrices();
    await nextFrame();

    rockGroup = new THREE.Group();
    rockGroup.name = 'ROCAS_ADJUNTAS_GTA_MANUCHO_V101';
    game.scene.add(rockGroup);

    lodManager = new LODInstanceManager();
    refreshSun();
    await nextFrame();

    // V102: se compila el shader por adelantado. Si no, la primera vez que
    // aparece una roca el navegador compila y enlaza el programa en mitad del
    // fotograma, y eso es un congelamiento de pantalla de varios cientos de ms.
    try {
      if (typeof game.renderer?.compileAsync === 'function') {
        await game.renderer.compileAsync(rockGroup, game.camera, game.scene);
      } else {
        game.renderer?.compile?.(game.scene, game.camera);
      }
    } catch (compileError) {
      console.warn('[rocas-v101] Precompilado omitido.', compileError);
    }
    await nextFrame();

    const solid = registerRockObstacles();
    console.log(`[rocas-v101] ${total} rocas del archivo adjunto colocadas (${solid} sólidas).`);

    window.__GTA_MANUCHO_ROCAS__ = {
      group: rockGroup,
      lodManager,
      count: total,
      config: CONFIG,
      // Palancas para el módulo de fluidez.
      setDetailDistance(units) { ROCK_DETAIL_DISTANCE.value = Math.max(0, units); },
      setViewDistance(units) { CONFIG.VIEW_DISTANCE = Math.max(600, units); },
      get detailDistance() { return ROCK_DETAIL_DISTANCE.value; }
    };
    window.__GTA_ROCAS_READY__ = true;
    window.dispatchEvent(new CustomEvent('gta-manucho-rocas-ready'));
    requestAnimationFrame(frame);
  } catch (error) {
    console.warn('[rocas-v101] Las rocas adjuntas quedaron fuera por un error.', error);
  }
}

function boot(){
  if (window.__GTA_MANUCHO_ISLANDS__) { install(); return; }
  window.addEventListener('gta-manucho-islands-ready', () => install(), { once: true });
  const wait = setInterval(() => {
    if (!window.__GTA_MANUCHO_ISLANDS__) return;
    clearInterval(wait);
    install();
  }, 400);
  setTimeout(() => clearInterval(wait), 60000);
}
boot();
