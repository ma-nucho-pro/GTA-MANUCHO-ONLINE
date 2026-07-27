/**
 * GTA MANUCHO V104 — MAPA 3D RENDERIZADO
 * Autor e integración: Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * Marca: ARKEA AI / Manucho. Uso permitido conforme a LICENSE; conserva los créditos.
 *
 * El mapa de TAB pasa de ser un dibujo vectorial a ser una foto cenital del
 * mundo de verdad, con sus edificios, calles, playas, islas y puente.
 *
 * CÓMO NO CUESTA FPS
 * No se renderiza cada fotograma: se hace UNA sola vez, con una cámara
 * ortográfica mirando el mapa desde arriba, hacia una textura fuera de
 * pantalla. Esa textura se pasa a un PNG y a partir de ahí el mapa es una
 * imagen normal. Durante la partida el coste es exactamente cero.
 *
 * CUÁNDO SE HACE
 * En segundo plano, cuando el juego lleva un rato tranquilo, nunca durante la
 * carga. Y como el descarte por distancia oculta lo lejano, antes de la foto se
 * hace visible todo el mapa y después se deja tal y como estaba.
 *
 * El radar de la esquina no se toca: sigue siendo el de siempre.
 */
import * as THREE from './bosque/libs/three.module.js';

const WORLD_SCALE = 16;
// Misma región que usa el mapa vectorial del juego, en unidades lógicas.
const MAP_VB = { x: -14000, y: -10000, w: 38000, h: 34000 };
// V108: bajado de 2048 a 1024. El paso caro no es dibujar, es traer los píxeles
// de la tarjeta a la memoria (readRenderTargetPixels) y comprimirlos a JPEG.
// A 2048x1832 eso son 3,7 millones de píxeles y 15 MB de transferencia
// SÍNCRONA: el navegador se queda parado varios segundos. Y en el log del
// usuario ocurría durante la carga, que es el peor momento posible.
// A 1024 son cuatro veces menos píxeles y el mapa se sigue viendo bien.
const RENDER_SIZE = 1024;

let game = null;
let installed = false;
let mapImage = null;      // dataURL del render
let capturing = false;
let layer = null;
let attempts = 0;

function mapSvg() {
  const exact = document.querySelector('svg[viewBox="-14000 -10000 38000 34000"]');
  if (exact) return exact;
  for (const svg of document.querySelectorAll('svg[viewBox]')) {
    const parts = String(svg.getAttribute('viewBox')).trim().split(/[\s,]+/).map(Number);
    if (parts.length !== 4 || parts.some(n => !Number.isFinite(n))) continue;
    if (Math.abs(parts[2]) < 5000 || Math.abs(parts[3]) < 5000) continue;
    const rect = svg.getBoundingClientRect();
    if (rect.width > 240 && rect.height > 240) return svg;
  }
  return null;
}

// ---------------------------------------------------------------------------
// LA FOTO CENITAL
// ---------------------------------------------------------------------------
async function capture() {
  if (capturing || mapImage || !game?.renderer || !game?.scene) return;
  capturing = true;

  const renderer = game.renderer;
  const scene = game.scene;
  const restore = [];
  let target = null;

  try {
    // 1. Todo visible. El descarte por distancia tiene oculto casi todo el mapa
    //    y saldría medio vacío. Se guarda el estado para devolverlo tal cual.
    scene.traverse(node => {
      if (node.isMesh || node.isGroup || node.isPoints) {
        if (!node.visible) { restore.push(node); node.visible = true; }
      }
    });
    // El jugador y la interfaz 3D no salen en la foto.
    const hidden = [];
    for (const key of ['playerModel', 'soldierModel', 'playerContainer']) {
      const node = game[key];
      if (node?.visible) { node.visible = false; hidden.push(node); }
    }

    // 2. Cámara ortográfica cenital que cubre exactamente la región del mapa.
    const worldW = MAP_VB.w * WORLD_SCALE;
    const worldH = MAP_VB.h * WORLD_SCALE;
    const cx = (MAP_VB.x + MAP_VB.w / 2) * WORLD_SCALE;
    const cz = (MAP_VB.y + MAP_VB.h / 2) * WORLD_SCALE;
    const camera = new THREE.OrthographicCamera(-worldW / 2, worldW / 2, worldH / 2, -worldH / 2, 1, 260000);
    camera.position.set(cx, 120000, cz);
    camera.up.set(0, 0, -1);          // el norte del mapa apunta a -Z
    camera.lookAt(cx, 0, cz);
    camera.updateMatrixWorld(true);

    // 3. A textura, no a pantalla.
    const aspect = worldH / worldW;
    const width = RENDER_SIZE;
    const height = Math.round(RENDER_SIZE * aspect);
    target = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat
    });

    const previousTarget = renderer.getRenderTarget();
    const previousFog = scene.fog;
    scene.fog = null;                  // la niebla borraría el mapa entero
    renderer.setRenderTarget(target);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(previousTarget);
    scene.fog = previousFog;

    // 4. Píxeles -> PNG.
    const pixels = new Uint8Array(width * height * 4);
    renderer.readRenderTargetPixels(target, 0, 0, width, height, pixels);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const image = ctx.createImageData(width, height);
    // WebGL entrega las filas al revés que el canvas.
    for (let y = 0; y < height; y++) {
      const from = (height - 1 - y) * width * 4;
      const to = y * width * 4;
      image.data.set(pixels.subarray(from, from + width * 4), to);
    }
    ctx.putImageData(image, 0, 0);
    mapImage = canvas.toDataURL('image/jpeg', 0.82);

    for (const node of hidden) node.visible = true;
    console.log(`[mapa3d-v104] Mapa renderizado ${width}x${height}. A partir de ahora es una imagen: coste cero por fotograma.`);
    window.__V104_MAP3D__ = { image: mapImage, recapture };
  } catch (error) {
    console.warn('[mapa3d-v104] No se pudo renderizar el mapa, se queda el vectorial.', error);
  } finally {
    for (const node of restore) node.visible = false;
    target?.dispose?.();
    capturing = false;
    // Que el descarte por distancia vuelva a repasar la ciudad.
    if (game.cullScanAnchor?.set) { game.cullScanAnchor.set(999999, 999999, 999999); game.cullScanPending = false; }
  }
}

function recapture() { mapImage = null; capture(); }

// ---------------------------------------------------------------------------
// COLOCAR LA IMAGEN DEBAJO DEL MAPA VECTORIAL
// ---------------------------------------------------------------------------
// La imagen se pone justo encima del panel, y el SVG vectorial se deja
// semitransparente por encima: así se ven las calles y las etiquetas de
// siempre sobre la foto real del mundo.
function ensureLayer() {
  if (layer) return layer;
  layer = document.createElement('div');
  layer.id = 'gta-v104-map3d';
  layer.style.cssText = 'position:fixed;pointer-events:none;z-index:2147482000;background-size:100% 100%;background-repeat:no-repeat;opacity:0;transition:opacity .25s;';
  document.body.appendChild(layer);
  return layer;
}

function syncLayer() {
  const svg = mapSvg();
  const node = ensureLayer();
  if (!svg || !mapImage) { node.style.opacity = '0'; return; }
  const rect = svg.getBoundingClientRect();
  if (!rect.width || !rect.height) { node.style.opacity = '0'; return; }

  // La imagen cubre exactamente la misma región que el viewBox del SVG, para
  // que un punto de la foto y un punto del vector caigan en el mismo sitio.
  const scale = Math.min(rect.width / MAP_VB.w, rect.height / MAP_VB.h);
  const drawW = MAP_VB.w * scale;
  const drawH = MAP_VB.h * scale;
  node.style.left = `${rect.left + (rect.width - drawW) / 2}px`;
  node.style.top = `${rect.top + (rect.height - drawH) / 2}px`;
  node.style.width = `${drawW}px`;
  node.style.height = `${drawH}px`;
  node.style.backgroundImage = `url(${mapImage})`;
  node.style.opacity = '1';

  // El vector se deja translúcido por encima: calles y nombres siguen ahí.
  if (svg.style.opacity !== '0.42') {
    svg.style.opacity = '0.42';
    svg.dataset.v104Dimmed = '1';
  }
}

function clearLayer() {
  if (layer) layer.style.opacity = '0';
  const svg = document.querySelector('svg[data-v104-dimmed="1"]');
  if (svg) { svg.style.opacity = ''; delete svg.dataset.v104Dimmed; }
}

let mapOpen = false;
window.addEventListener('gta-map-toggle', event => {
  mapOpen = Boolean(event.detail?.open);
  if (!mapOpen) { clearLayer(); return; }
  if (!mapImage && !capturing && attempts < 3) {
    attempts++;
    // El juego ya está en pausa con el mapa abierto, así que este parón de
    // medio segundo no se nota. Sólo ocurre la primera vez.
    capture().then(syncLayer);
  }
  const loop = () => { if (!mapOpen) return; syncLayer(); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
});

function install() {
  if (installed) return;
  installed = true;
  // V108: ya NO se toma la foto sola. Se toma la primera vez que abres el mapa
  // con TAB, que es el único momento en que de verdad hace falta y además el
  // juego ya está en pausa, así que el parón no se nota. Antes se disparaba en
  // segundo plano durante la carga y era uno de los congelamientos gordos.
  console.log('[mapa3d-v108] Preparado. El mapa se fotografiará la primera vez que abras TAB.');
}

const wait = setInterval(() => {
  game = window.__VICE_CITY_GAME__ || game;
  if (!game?.renderer || !game?.scene) return;
  clearInterval(wait);
  install();
}, 200);
setTimeout(() => clearInterval(wait), 90000);
