/**
 * GTA MANUCHO V113 — CÓDIGOS Y VEHÍCULOS DE MISIÓN
 * Autor e integración: Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * Marca: ARKEA AI / Manucho. Uso permitido conforme a LICENSE; conserva los créditos.
 *
 * Se escriben con el teclado, sin abrir ninguna ventana, como en los GTA
 * clásicos. No hace falta pulsar Intro: en cuanto las últimas letras tecleadas
 * coinciden con un código, se activa.
 *
 *   MOTORA      aparece una moto
 *   TAXU        aparece un taxi          -> Y para misiones de taxi
 *   YUTA        aparece un coche patrulla -> Y para misiones de policía
 *   PARAMEDIC   aparece una ambulancia    -> Y para misiones de ambulancia
 *
 * CÓMO SE ENGANCHAN CON LAS MISIONES QUE YA EXISTÍAN
 * El juego ya traía las tres misiones en v71-city-features.js, pero sólo
 * arrancaban si el coche que conducías era reconocido como taxi, patrulla o
 * ambulancia. Ese reconocimiento se hace mirando dos cosas: userData.taxi y el
 * nombre del objeto. Así que los códigos no inventan un sistema nuevo: cogen un
 * coche, lo marcan exactamente como espera esa función y lo dejan a tu lado.
 * Por eso las misiones funcionan de verdad y no son un adorno.
 */
import * as THREE from './bosque/libs/three.module.js';

const WORLD_SCALE = 16;

const CODES = {
  MOTORA:    { kind: 'moto',      label: 'MOTO' },
  TAXU:      { kind: 'taxi',      label: 'TAXI',      color: 0xf5c518, mission: 'taxi' },
  YUTA:      { kind: 'police',    label: 'PATRULLA',  color: 0x1b3f8f, mission: 'policía' },
  PARAMEDIC: { kind: 'ambulance', label: 'AMBULANCIA', color: 0xf2f2f2, mission: 'ambulancia' }
};
const LONGEST = Math.max(...Object.keys(CODES).map(c => c.length));

let game = null;
let installed = false;
let buffer = '';

/* ---------------------------------------------------------------------- */
/* AVISO EN PANTALLA                                                       */
/* ---------------------------------------------------------------------- */
// Propio, porque los carteles del juego están ocultos desde la V105 y este sí
// hay que verlo: si escribes un código y no pasa nada visible, parece roto.
function banner(title, detail) {
  let node = document.getElementById('gta-codigos-v113');
  if (!node) {
    node = document.createElement('div');
    node.id = 'gta-codigos-v113';
    node.style.cssText = [
      'position:fixed', 'left:50%', 'top:96px', 'transform:translateX(-50%)',
      'z-index:2147483000', 'padding:12px 22px', 'text-align:center',
      'border:2px solid #ffd23f', 'border-radius:8px',
      'background:rgba(8,14,22,.94)', 'color:#ffd23f',
      'font:900 15px/1.4 "Arial Black",Arial,sans-serif', 'letter-spacing:.08em',
      'pointer-events:none', 'box-shadow:0 0 22px rgba(255,210,63,.28)'
    ].join(';');
    document.body.appendChild(node);
  }
  node.innerHTML = `${title}${detail ? `<div style="margin-top:5px;font:700 11px Arial;color:#cfe6ff;letter-spacing:.05em">${detail}</div>` : ''}`;
  node.style.display = 'block';
  clearTimeout(node.__timer);
  node.__timer = setTimeout(() => { node.style.display = 'none'; }, 4600);
}

/* ---------------------------------------------------------------------- */
/* COLOCAR EL VEHÍCULO AL LADO DEL JUGADOR                                 */
/* ---------------------------------------------------------------------- */
function dropBesidePlayer(root, sideDistance = 120) {
  const player = game.playerContainer?.position;
  if (!player || !root) return;
  const yaw = game.playerContainer.rotation.y || 0;
  // A la derecha del jugador, no encima: si aparece dentro se empujan.
  const x = player.x + Math.cos(yaw) * sideDistance;
  const z = player.z - Math.sin(yaw) * sideDistance;
  let y = player.y;
  try {
    const ground = game.getGroundY(x, player.y + 120, z, false);
    if (Number.isFinite(ground)) y = ground;
  } catch {}
  root.position.set(x, y + 6, z);
  root.rotation.y = yaw;
  root.visible = true;
  root.updateMatrixWorld(true);
}

function paint(root, color) {
  if (!color) return;
  const tint = new THREE.Color(color);
  let painted = 0;
  root.traverse(node => {
    if (!node.isMesh || painted > 40) return;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of materials) {
      if (!material?.color) continue;
      // Cristales y ruedas se dejan como están.
      const name = (material.name || '').toLowerCase();
      if (name.includes('glass') || name.includes('window') || name.includes('tire') || name.includes('wheel')) continue;
      if (!material.__v113Original) material.__v113Original = material.color.clone();
      material.color.copy(tint);
      painted++;
    }
  });
}

/* ---------------------------------------------------------------------- */
/* CADA CÓDIGO                                                            */
/* ---------------------------------------------------------------------- */
function freeCustomCar() {
  const system = window.__CUSTOM_CAR_SYSTEM__;
  const cars = system?.cars || window.__CUSTOM_CARS__ || [];
  if (!cars.length) return null;
  const active = system?.active;
  const player = game.playerContainer?.position;
  // El más cercano que no esté ocupado, para no robarle el coche a nadie.
  let best = null;
  let bestSq = Infinity;
  for (const car of cars) {
    if (!car?.root || car === active) continue;
    const d = player ? car.root.position.distanceToSquared(player) : 0;
    if (d < bestSq) { bestSq = d; best = car; }
  }
  return best;
}

function spawnServiceCar(code) {
  const car = freeCustomCar();
  if (!car) { banner('NO HAY COCHES DISPONIBLES', 'Aléjate un poco y vuelve a probarlo'); return; }

  // Se marca EXACTAMENTE como espera activeCarType() de v71-city-features.js:
  // es lo que hace que la misión correspondiente arranque al pulsar Y.
  car.root.userData.taxi = false;
  car.isTaxi = false;
  if (code.kind === 'taxi') {
    car.root.userData.taxi = true;
    car.isTaxi = true;
    car.root.name = 'TAXI GTA MANUCHO';
  } else if (code.kind === 'police') {
    car.root.name = 'PATRULLA VCPD';
  } else if (code.kind === 'ambulance') {
    car.root.name = 'AMBULANCIA';
  }
  car.root.userData.v113Service = code.kind;

  paint(car.root, code.color);
  dropBesidePlayer(car.root);
  banner(`${code.label} A TU LADO`, `Pulsa E para subir · luego Y para empezar la misión de ${code.mission}`);
}

function spawnBike() {
  const api = window.__V100_BIKE_API__;
  if (typeof api?.nearestBike !== 'function') { banner('LAS MOTOS AÚN NO ESTÁN LISTAS', 'Prueba dentro de unos segundos'); return; }
  // Se busca en todo el mapa y se trae la más cercana.
  const entry = api.nearestBike(1e9);
  if (!entry?.root) { banner('NO HAY NINGUNA MOTO EN EL MAPA', ''); return; }
  dropBesidePlayer(entry.root, 105);
  if (entry.speed !== undefined) entry.speed = 0;
  if (entry.cameraStableY !== undefined) entry.cameraStableY = entry.root.position.y;
  banner('MOTO A TU LADO', 'Pulsa E para subir · V cambia de cámara');
}

function activate(name) {
  const code = CODES[name];
  if (!code) return;
  try {
    if (code.kind === 'moto') spawnBike();
    else spawnServiceCar(code);
    console.log(`[codigos-v113] Código ${name} activado.`);
  } catch (error) {
    console.warn(`[codigos-v113] El código ${name} falló.`, error);
    banner('ESE CÓDIGO NO SE PUDO ACTIVAR', 'Mira la consola con F12');
  }
}

/* ---------------------------------------------------------------------- */
/* ESCUCHA DE TECLADO                                                      */
/* ---------------------------------------------------------------------- */
function onKeyDown(event) {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
  const node = document.activeElement;
  if (node && (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA' || node.isContentEditable)) return;
  const key = event.key;
  if (!key || key.length !== 1 || !/[a-zA-Z]/.test(key)) return;

  buffer = (buffer + key.toUpperCase()).slice(-LONGEST);
  for (const name of Object.keys(CODES)) {
    if (buffer.endsWith(name)) {
      buffer = '';
      activate(name);
      return;
    }
  }
}

function install() {
  if (installed || !game?.scene) return;
  installed = true;
  window.addEventListener('keydown', onKeyDown, false);   // sin captura: no estorba a nadie
  window.__V113_CODIGOS__ = { activate, codes: Object.keys(CODES) };
  console.log(`[codigos-v113] Códigos listos: ${Object.keys(CODES).join(' · ')}`);
}

const wait = setInterval(() => {
  game = window.__VICE_CITY_GAME__ || game;
  if (!game?.scene || !game?.playerContainer) return;
  clearInterval(wait);
  install();
}, 300);
setTimeout(() => clearInterval(wait), 90000);
