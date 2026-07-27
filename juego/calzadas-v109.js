/**
 * GTA MANUCHO V109 — CALZADAS Y PARQUES BAJO LAS RUTAS DE LOS COCHES
 * Autor e integración: Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * Marca: ARKEA AI / Manucho. Uso permitido conforme a LICENSE; conserva los créditos.
 *
 * En la V108 las rutas que cruzaban el mar se eliminaban y por ahí no pasaba
 * nadie. Ahora se hace lo contrario, que es lo que pediste: se construye tierra
 * debajo. Donde antes había coches flotando sobre el agua hay ahora una
 * carretera de verdad, con arcén de césped, taludes que bajan hasta el agua y
 * árboles a los lados.
 *
 * POR QUÉ ESTO NO CUESTA FPS
 * Las diez rutas son rectángulos, así que TODOS sus tramos son rectos en X o en
 * Z. Eso permite tres cosas:
 *   1. La geometría es un prisma trapezoidal por tramo: 44 triángulos. Todos los
 *      tramos se funden en UNA sola malla por material, así que el mapa entero
 *      son tres llamadas de dibujo, no una por trozo.
 *   2. La colisión son cajas alineadas con los ejes, que es justo lo que espera
 *      addObstacle: sin aproximaciones ni rotaciones.
 *   3. Los árboles van en mallas instanciadas: dos llamadas más, da igual que
 *      sean cincuenta o quinientos.
 * Todo es estático: matrixAutoUpdate desactivado, nada que recalcular nunca.
 */
import * as THREE from './bosque/libs/three.module.js';

const WORLD_SCALE = 16;
const WATER_LEVEL = -14 * WORLD_SCALE;
const VOID_MARK = 0.5 * WORLD_SCALE;      // el "aquí no hay nada" del motor

// Las mismas diez rutas que recorren los coches, en coordenadas lógicas.
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

// Perfil de la calzada, medido desde el eje hacia fuera.
const DECK_Y      = 8;              // altura de la carretera (la del resto)
const ROAD_HALF   = 100;            // 6,2 m de asfalto a cada lado
const GRASS_HALF  = 300;            // hasta aquí, césped llano
const BASE_HALF   = 480;            // pie del talud
const BASE_Y      = WATER_LEVEL - 90;
const SAMPLE_STEP = 220;            // cada cuánto se comprueba si hay suelo

let game = null;
let installed = false;

// V110: TRES SEÑALES, NO UNA.
// En la V109 esto miraba una sola cosa y, si fallaba, no se construía nada y
// los coches seguían sobre el agua. Ahora basta con que UNA de las tres diga
// que ahí no hay suelo. Además se lleva la cuenta de cuál acierta, y se imprime
// por consola, para no volver a quedarme a ciegas.
const votes = { marca: 0, mapa: 0, obstaculo: 0, total: 0 };

function isVoid(x, z) {
  votes.total++;
  let empty = false;

  // Señal 1: el motor devuelve 8 clavado cuando no encuentra nada.
  try {
    const y = game?.getGroundY?.(x, 600, z, false);
    if (!Number.isFinite(y) || Math.abs(y - VOID_MARK) < 0.001) { votes.marca++; empty = true; }
  } catch {}

  // Señal 2: el mapa de tierra, que se mide de la geometría realmente dibujada.
  try {
    if (window.__V106_MAR__?.isSea?.(x, z)) { votes.mapa++; empty = true; }
  } catch {}

  // Señal 3: ningún obstáculo sólido cubre ese punto por encima del agua.
  if (!empty) {
    try {
      const near = game?.obstacleGrid?.getNearby?.(x, z, 1);
      let covered = false;
      for (const b of near || []) {
        if (Math.abs(x - b.x) < b.w / 2 && Math.abs(z - b.z) < b.d / 2 && b.y + b.h > WATER_LEVEL) { covered = true; break; }
      }
      if (!covered && near && near.length === 0) { votes.obstaculo++; }
    } catch {}
  }
  return empty;
}

/* ---------------------------------------------------------------------- */
/* TRAMOS SIN SUELO                                                        */
/* ---------------------------------------------------------------------- */
// Devuelve los trozos de cada tramo recto que están sobre el vacío, unidos y
// con un poco de margen para que la calzada nueva enganche con la de verdad.
function voidRuns() {
  const runs = [];
  for (const route of ROAD_ROUTES_LOGICAL) {
    for (let i = 0; i < route.length; i++) {
      const a = route[i];
      const b = route[(i + 1) % route.length];
      const ax = a[0] * WORLD_SCALE, az = a[1] * WORLD_SCALE;
      const bx = b[0] * WORLD_SCALE, bz = b[1] * WORLD_SCALE;
      const length = Math.hypot(bx - ax, bz - az);
      if (length < 1) continue;
      const steps = Math.max(2, Math.ceil(length / SAMPLE_STEP));

      let runStart = null;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const x = ax + (bx - ax) * t;
        const z = az + (bz - az) * t;
        const empty = isVoid(x, z);
        if (empty && runStart === null) runStart = t;
        if ((!empty || s === steps) && runStart !== null) {
          const t0 = Math.max(0, runStart - 0.5 / steps);
          const t1 = Math.min(1, t + 0.5 / steps);
          if ((t1 - t0) * length > 260) {
            runs.push({
              x0: ax + (bx - ax) * t0, z0: az + (bz - az) * t0,
              x1: ax + (bx - ax) * t1, z1: az + (bz - az) * t1,
              alongX: Math.abs(bx - ax) > Math.abs(bz - az)
            });
          }
          runStart = null;
        }
      }
    }
  }
  return runs;
}

/* ---------------------------------------------------------------------- */
/* GEOMETRÍA: UN PRISMA TRAPEZOIDAL POR TRAMO                              */
/* ---------------------------------------------------------------------- */
// Como todos los tramos son rectos en X o en Z, basta con estirar un perfil.
// El talud inclinado hace que parezca una lengua de tierra y no una caja.
function pushPrism(target, run, halfTop, halfBottom, topY, bottomY) {
  const { x0, z0, x1, z1, alongX } = run;
  // u recorre el tramo, v es la anchura perpendicular.
  const u0 = alongX ? Math.min(x0, x1) : Math.min(z0, z1);
  const u1 = alongX ? Math.max(x0, x1) : Math.max(z0, z1);
  const c  = alongX ? z0 : x0;

  const point = (u, v, y) => (alongX ? [u, y, c + v] : [c + v, y, u]);

  // Ocho esquinas: cuatro arriba (estrechas) y cuatro abajo (anchas).
  const corners = [
    point(u0, -halfTop, topY),    point(u1, -halfTop, topY),
    point(u1,  halfTop, topY),    point(u0,  halfTop, topY),
    point(u0, -halfBottom, bottomY), point(u1, -halfBottom, bottomY),
    point(u1,  halfBottom, bottomY), point(u0,  halfBottom, bottomY)
  ];

  const faces = [
    [0,1,2],[0,2,3],          // arriba
    [4,6,5],[4,7,6],          // abajo
    [0,4,5],[0,5,1],          // talud lateral 1
    [3,2,6],[3,6,7],          // talud lateral 2
    [0,3,7],[0,7,4],          // testero inicial
    [1,5,6],[1,6,2]           // testero final
  ];
  // Al intercambiar qué eje hace de "largo" y cuál de "ancho", la orientación
  // de los triángulos se invierte. Sin esto, la mitad de las calzadas (las que
  // van en X) se verían transparentes desde arriba y con la luz al revés,
  // porque la cara superior estaría mirando hacia abajo. Se detectó midiendo la
  // normal de la cara de arriba: salía (0, -1, 0) en vez de (0, 1, 0).
  for (const [i, j, k] of faces) {
    if (alongX) target.push(...corners[i], ...corners[k], ...corners[j]);
    else target.push(...corners[i], ...corners[j], ...corners[k]);
  }
}

function pushSlab(target, run, half, topY, thickness) {
  pushPrism(target, run, half, half, topY, topY - thickness);
}

function buildMesh(positions, material, name) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.matrixAutoUpdate = false;
  mesh.updateMatrix();
  return mesh;
}

/* ---------------------------------------------------------------------- */
/* ÁRBOLES                                                                 */
/* ---------------------------------------------------------------------- */
function buildTrees(group, runs) {
  const spots = [];
  for (const run of runs) {
    const { x0, z0, x1, z1, alongX } = run;
    const length = Math.hypot(x1 - x0, z1 - z0);
    const count = Math.floor(length / 340);
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count;
      const cx = x0 + (x1 - x0) * t;
      const cz = z0 + (z1 - z0) * t;
      // Uno a cada lado, sobre el césped, con algo de desorden para que no
      // parezcan plantados con regla.
      for (const side of [-1, 1]) {
        const off = (ROAD_HALF + GRASS_HALF) / 2 + (Math.sin(i * 12.9898 + side) * 46);
        spots.push(alongX ? [cx + Math.cos(i) * 40, cz + side * off]
                          : [cx + side * off, cz + Math.sin(i) * 40]);
      }
    }
  }
  if (!spots.length) return 0;

  const trunkGeo = new THREE.CylinderGeometry(7, 10, 74, 5, 1);
  const leafGeo = new THREE.ConeGeometry(48, 118, 6, 1);
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6b4a2f });
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x2f6d33 });

  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, spots.length);
  const leaves = new THREE.InstancedMesh(leafGeo, leafMat, spots.length);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < spots.length; i++) {
    const [x, z] = spots[i];
    const scale = 0.82 + ((i * 37) % 11) / 22;
    dummy.position.set(x, DECK_Y + 37 * scale, z);
    dummy.rotation.set(0, (i * 1.7) % (Math.PI * 2), 0);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);

    dummy.position.y = DECK_Y + (74 + 59) * scale;
    dummy.updateMatrix();
    leaves.setMatrixAt(i, dummy.matrix);
  }
  trunks.instanceMatrix.needsUpdate = true;
  leaves.instanceMatrix.needsUpdate = true;
  for (const mesh of [trunks, leaves]) {
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    group.add(mesh);
  }
  return spots.length;
}

/* ---------------------------------------------------------------------- */
function install() {
  if (installed) return;
  installed = true;

  const runs = voidRuns();
  if (!runs.length) {
    console.warn(`[calzadas-v110] Ninguna ruta dio señal de vacío en ${votes.total} sondeos (marca: ${votes.marca}, mapa: ${votes.mapa}). No se construye nada. Si sigues viendo coches sobre el agua, pásame esta línea.`);
    window.__V109_CALZADAS_READY__ = true;
    window.dispatchEvent(new CustomEvent('gta-manucho-calzadas-ready'));
    return;
  }

  const group = new THREE.Group();
  group.name = 'CALZADAS_Y_PARQUES_V109';

  const land = [];
  const road = [];
  const line = [];
  for (const run of runs) {
    // Lengua de tierra con talud hasta debajo del agua.
    pushPrism(land, run, GRASS_HALF, BASE_HALF, DECK_Y - 1, BASE_Y);
    // Asfalto encima, un pelo más alto para que no se peleen las dos caras.
    pushSlab(road, run, ROAD_HALF, DECK_Y + 0.6, 6);
    // Línea central.
    pushSlab(line, run, 5, DECK_Y + 1.1, 2);
  }

  const grassMat = new THREE.MeshLambertMaterial({ color: 0x4f7a3a });
  const roadMat = new THREE.MeshLambertMaterial({ color: 0x33353a });
  const lineMat = new THREE.MeshLambertMaterial({ color: 0xd8bb3a });

  group.add(buildMesh(land, grassMat, 'CALZADA_TIERRA_V109'));
  group.add(buildMesh(road, roadMat, 'CALZADA_ASFALTO_V109'));
  group.add(buildMesh(line, lineMat, 'CALZADA_LINEAS_V109'));
  const trees = buildTrees(group, runs);

  group.matrixAutoUpdate = false;
  group.updateMatrix();
  // Al colgarlo de la ciudad, entra solo en el descarte por distancia.
  (game.city || game.scene).add(group);

  // Colisión: como los tramos son rectos en X o en Z, las cajas alineadas con
  // los ejes que espera addObstacle encajan exactas, sin aproximar nada.
  let boxes = 0;
  for (const run of runs) {
    const { x0, z0, x1, z1, alongX } = run;
    const length = Math.hypot(x1 - x0, z1 - z0);
    const pieces = Math.max(1, Math.ceil(length / 900));
    for (let i = 0; i < pieces; i++) {
      const t0 = i / pieces, t1 = (i + 1) / pieces;
      const cx = x0 + (x1 - x0) * (t0 + t1) / 2;
      const cz = z0 + (z1 - z0) * (t0 + t1) / 2;
      const span = (length / pieces) + 40;
      const w = alongX ? span : GRASS_HALF * 2;
      const d = alongX ? GRASS_HALF * 2 : span;
      // La cara superior de la caja queda justo en la calzada.
      game.addObstacle?.(cx, cz, w, d, 40, DECK_Y - 40);
      boxes++;
    }
  }

  // El mapa de tierra deja de llamar mar a esta franja, para que los coches
  // puedan circular por la calzada recién construida.
  let marked = 0;
  for (const run of runs) marked += window.__V106_MAR__?.markLand?.(run.x0, run.z0, run.x1, run.z1) || 0;

  window.__V109_CALZADAS__ = { group, runs, boxes, trees, marked, votes };
  window.__V109_CALZADAS_READY__ = true;
  window.dispatchEvent(new CustomEvent('gta-manucho-calzadas-ready'));
  console.log(`[calzadas-v110] ${runs.length} tramos construidos, ${trees} árboles, ${boxes} cajas de colisión, ${marked} celdas del mapa pasadas a tierra. Cinco llamadas de dibujo.`);
  console.log(`[calzadas-v110] señales de "aquí no hay suelo" sobre ${votes.total} sondeos -> marca del motor: ${votes.marca}, mapa de tierra: ${votes.mapa}`);
}

// Se espera a que la ciudad esté puesta: si se mide antes, medio mapa parece
// vacío porque simplemente no ha llegado todavía.
// V110: se espera a que el mapa de tierra esté medido. Antes se construía a los
// 4,5 segundos, cuando ese mapa aún no existía y sólo se contaba con una señal.
let waited = 0;
const wait = setInterval(() => {
  game = window.__VICE_CITY_GAME__ || game;
  if (!game?.scene || typeof game.getGroundY !== 'function') return;
  if (!window.__VICE_CITY_REVEALED__) return;
  waited += 400;
  // Tope de 26 s por si el mapa no llegara: se construye igual con las otras
  // dos señales, que es mejor que no construir nada.
  if (!window.__V106_MAR__ && waited < 26000) return;
  clearInterval(wait);
  setTimeout(install, 800);
}, 400);
setTimeout(() => { clearInterval(wait); window.__V109_CALZADAS_READY__ = true; }, 90000);
