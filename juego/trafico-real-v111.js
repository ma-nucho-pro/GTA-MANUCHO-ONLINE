/**
 * GTA MANUCHO V111 — LOS COCHES DISPERSOS DEL MOTOR
 * Autor e integración: Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * Marca: ARKEA AI / Manucho. Uso permitido conforme a LICENSE; conserva los créditos.
 *
 * AQUÍ ESTABAN LOS COCHES DEL AGUA. Llevaba varias versiones buscándolos en el
 * sitio equivocado.
 *
 * No venían de ningún módulo: los crea el propio motor, en spawnScatteredCars().
 * Su código hace literalmente esto:
 *
 *     for (let i = 0; i < 150; i++) {
 *       const x = (Math.random() - 0.5) * 40000;
 *       const z = (Math.random() - 0.5) * 40000;
 *       const y = 0.5 * WORLD_SCALE;          // altura fija, 8
 *       ...
 *     }
 *
 * Ciento cincuenta coches tirados COMPLETAMENTE AL AZAR sobre un cuadrado de
 * 40.000 x 40.000 unidades, todos a la misma altura y sin preguntar ni una sola
 * vez si debajo hay suelo. Los que caen sobre la bahía se quedan flotando ahí,
 * y como el motor los mueve por su cuenta, los que empiezan en tierra pueden
 * meterse al agua conduciendo.
 *
 * Por eso ni el mapa de tierra ni el filtro de instancias los tocaban: son otro
 * sistema distinto, con su propia lista (scatteredCarData) y sus propias mallas.
 *
 * Este módulo hace dos cosas, las dos baratas:
 *   1. Apaga los que están sobre el agua y deja su matriz a escala cero, así que
 *      desaparecen de verdad (el motor ya los ignora al ver active = false).
 *   2. Recorta el total, porque 150 coches de un modelo detallado es mucho más
 *      de lo que hace falta para que la ciudad parezca viva.
 */
import * as THREE from './bosque/libs/three.module.js';

const WORLD_SCALE = 16;
const WATER_LEVEL = -14 * WORLD_SCALE;
const VOID_MARK = 0.5 * WORLD_SCALE;

// AQUÍ ESTABA EL 98 % DEL PROBLEMA DE RENDIMIENTO.
//
// El modelo que carga el motor para estos coches es el Ferrari de los ejemplos
// de three.js: un modelo de escaparate de unos 360.000 triángulos. Multiplicado
// por 150 instancias son CINCUENTA Y CUATRO MILLONES de triángulos por
// fotograma, y con el reflejo del agua encendido, ciento ocho millones. Un
// juego normal usa entre uno y tres millones. En los fotogramas buenos el resto
// de la escena eran 162.000: estos coches pesaban trescientas veces más que
// todo lo demás junto.
//
// Y MI ARREGLO DE LA V111 NO SERVÍA: puse su matriz a escala cero, así que no
// se veían, pero la tarjeta gráfica seguía procesando las 150 instancias
// enteras. Lo que hay que bajar es mesh.count, que es lo único que de verdad
// le dice a la GPU cuántas dibujar.
//
// La solución conserva los coches sin pagarlos: se dibujan sólo los MÁS
// CERCANOS. Están repartidos por 40.000 unidades y la distancia de dibujado son
// 27.200, así que de todos modos nunca se veían más que unos pocos a la vez.
const VISIBLE_CARS = 6;          // 6 x 360k = 2,2 M de triángulos, asumible
const REORDER_MS = 900;

let game = null;
let installed = false;
let hiddenMatrix = null;
let lastOrder = 0;
let reported = false;

function isVoid(x, z) {
  try {
    const y = game?.getGroundY?.(x, 600, z, false);
    if (!Number.isFinite(y) || Math.abs(y - VOID_MARK) < 0.001) return true;
    if (y <= WATER_LEVEL) return true;
  } catch {}
  try {
    if (window.__V106_MAR__?.isSea?.(x, z)) return true;
  } catch {}
  return false;
}

// Reordena: los seis coches en tierra más cercanos ocupan las ranuras 0..5, y
// mesh.count baja a seis. El resto quedan inactivos, así que el motor ni los
// mueve ni los dibuja.
function reorder() {
  const cars = game.scatteredCarData;
  const meshes = game.instancedCarMeshes;
  if (!Array.isArray(cars) || !cars.length || !Array.isArray(meshes) || !meshes.length) return;
  const player = game.playerContainer?.position;
  if (!player) return;

  let onLand = 0;
  const candidates = [];
  for (const data of cars) {
    if (isVoid(data.x, data.z)) { data.active = false; continue; }
    onLand++;
    const dx = data.x - player.x;
    const dz = data.z - player.z;
    candidates.push({ data, distSq: dx * dx + dz * dz });
  }
  candidates.sort((a, b) => a.distSq - b.distSq);

  const keep = Math.min(VISIBLE_CARS, candidates.length);
  for (let i = 0; i < candidates.length; i++) {
    const data = candidates[i].data;
    if (i < keep) { data.active = true; data.index = i; }
    else { data.active = false; }
  }
  // Las ranuras que sobran se vacían por si quedaba una matriz vieja dentro.
  for (const entry of meshes) {
    const mesh = entry?.instanced;
    if (!mesh) continue;
    for (let i = keep; i < Math.min(mesh.instanceMatrix.count, keep + 4); i++) {
      mesh.setMatrixAt(i, hiddenMatrix);
    }
    mesh.count = keep;                 // ESTO es lo que ahorra los millones
    mesh.instanceMatrix.needsUpdate = true;
  }

  if (!reported) {
    reported = true;
    const tris = meshes.reduce((sum, e) => {
      const g = e?.instanced?.geometry;
      const n = g?.index ? g.index.count / 3 : (g?.attributes?.position?.count || 0) / 3;
      return sum + n;
    }, 0);
    console.log(
      `[trafico-v112] Coches dispersos del motor: ${cars.length} creados, ` +
      `${cars.length - onLand} sobre el agua, ${keep} dibujándose a la vez.`);
    console.log(
      `[trafico-v112] Cada coche son ${Math.round(tris / 1000)}k triángulos. ` +
      `Antes: ${cars.length} x eso = ${(cars.length * tris / 1e6).toFixed(0)} millones por fotograma. ` +
      `Ahora: ${(keep * tris / 1e6).toFixed(1)} millones.`);
  }
}

let tick = 0;

function frame() {
  requestAnimationFrame(frame);
  if (!game || document.hidden) return;
  const now = performance.now();
  if (now - lastOrder < REORDER_MS) return;
  lastOrder = now;
  try { reorder(); } catch {}
}

function install() {
  if (installed) return;
  installed = true;
  hiddenMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
  reorder();
  window.__V112_TRAFICO__ = {
    reorder,
    get total() { return game.scatteredCarData?.length || 0; },
    get visible() { return VISIBLE_CARS; }
  };
  requestAnimationFrame(frame);
}

// Se espera a que el motor los haya creado: los genera con retardo, diez
// segundos después de arrancar, y hasta entonces la lista no existe.
const wait = setInterval(() => {
  game = window.__VICE_CITY_GAME__ || game;
  if (!game?.scatteredCarData?.length || !game?.instancedCarMeshes?.length) return;
  if (!window.__VICE_CITY_REVEALED__) return;
  install();
  if (installed) clearInterval(wait);
}, 700);
setTimeout(() => clearInterval(wait), 120000);
