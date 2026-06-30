/**
 * GTA MANUCHO V84 — código del proyecto.
 * Creado e integrado por Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * ARKEA AI / Manucho · conserva LICENSE, NOTICE.md y estos créditos al reutilizar.
 */
import * as THREE from './bosque/libs/three.module.js';

const WORLD_SCALE = 16;

const STAR_POINTS = [
  [-2200,-5000],[-900,-4400],[-2100,-2800],[-800,-900],[-2100,2100],
  [900,-5000],[2050,-3900],[900,-1800],[2050,1500],[950,3100],
  [-300,-300],[280,-120],[-1900,900],[1700,-1200]
];

const entries = [];
const consumed = new Set();
let game = null;
let installed = false;
let noticeNode = null;

function groundAt(x, z, fallback = 0) {
  try {
    const value = game?.getGroundY?.(x, fallback + 220, z, false);
    return Number.isFinite(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function notice(text) {
  if (!noticeNode) {
    noticeNode = document.createElement('div');
    noticeNode.style.cssText = 'position:fixed;left:50%;top:24%;transform:translateX(-50%);z-index:9100;padding:9px 15px;border-radius:10px;background:rgba(5,10,18,.92);border:1px solid #ffe16a;color:#fff8c4;font:900 13px Arial,sans-serif;letter-spacing:.05em;display:none;pointer-events:none';
    document.body.appendChild(noticeNode);
  }
  noticeNode.textContent = text;
  noticeNode.style.display = 'block';
  clearTimeout(noticeNode.__timer);
  noticeNode.__timer = setTimeout(() => { noticeNode.style.display = 'none'; }, 1800);
}

function createStarGeometry() {
  const shape = new THREE.Shape();
  const outer = 13;
  const inner = 5.8;
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + i * Math.PI / 5;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: 3.2, bevelEnabled: true, bevelSize: 1.1, bevelThickness: 1.1, bevelSegments: 1 });
}

function wantedLevel() {
  const world = game?.crimeWorld;
  if (!world) return 0;
  try {
    const value = typeof world.getWantedLevel === 'function' ? world.getWantedLevel() : world.wantedLevel;
    return Number.isFinite(value) ? Math.max(0, Math.min(5, value)) : 0;
  } catch {
    return 0;
  }
}

function lowerWanted() {
  const world = game?.crimeWorld;
  if (!world) return false;
  const before = wantedLevel();
  if (before <= 0) return false;
  const next = Math.max(0, before - 1);
  world.wantedLevel = next;
  if ('_wantedLevel' in world) world._wantedLevel = next;
  game.wantedLevel = next;
  world.wantedAge = 0;
  if (world.wantedLevel === 0) {
    for (const officer of world.policeAgents || []) {
      officer.root.visible = false;
      officer.state = 'idle';
    }
  }
  game.updateHUDState?.();
  notice(`NIVEL DE BÚSQUEDA REDUCIDO · ${world.wantedLevel} ESTRELLA${world.wantedLevel === 1 ? '' : 'S'}`);
  return true;
}

function placeEntry(entry, index) {
  if (consumed.has(index)) {
    entry.mesh.visible = false;
    entry.active = false;
    return;
  }
  const point = STAR_POINTS[index % STAR_POINTS.length];
  const x = (point[0] + (Math.random() - .5) * 22) * WORLD_SCALE;
  const z = (point[1] + (Math.random() - .5) * 22) * WORLD_SCALE;
  entry.mesh.position.set(x, groundAt(x, z, 0) + 24, z);
  entry.mesh.visible = true;
  entry.active = true;
}

function collect(entry) {
  if (!entry.active || !lowerWanted()) return;
  entry.active = false;
  entry.mesh.visible = false;
  consumed.add(entry.index);
}

function update(now = performance.now()) {
  requestAnimationFrame(update);
  const player = game?.playerContainer?.position;
  if (!player) return;
  const time = now * .001;
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry.active) continue;
    entry.mesh.rotation.y = time * 1.7 + entry.phase;
    entry.mesh.rotation.z = Math.sin(time * 1.2 + entry.phase) * .12;
    if (wantedLevel() > 0 && entry.mesh.position.distanceToSquared(player) < 58 * 58) collect(entry);
  }
}

function install() {
  if (installed) return;
  game = window.__VICE_CITY_GAME__;
  if (!game?.city || !game?.playerContainer) return;
  installed = true;
  const geometry = createStarGeometry();
  const material = new THREE.MeshBasicMaterial({ color: 0xffd84d, side: THREE.DoubleSide });
  const edgeMaterial = new THREE.MeshBasicMaterial({ color: 0xff8c00 });
  for (let i = 0; i < 12; i++) {
    const group = new THREE.Group();
    const star = new THREE.Mesh(geometry, material);
    star.rotation.x = -0.12;
    group.add(star);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(17, 1.4, 6, 18), edgeMaterial);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    group.scale.setScalar(1.15);
    group.traverse(object => {
      if (object.isMesh) {
        object.castShadow = false;
        object.receiveShadow = false;
      }
    });
    game.city.add(group);
    const entry = { mesh: group, active: true, phase: Math.random() * Math.PI * 2, index: i };
    entries.push(entry);
    placeEntry(entry, i);
  }
  window.__WANTED_STAR_PICKUPS__ = entries;
  requestAnimationFrame(update);
}

const wait = setInterval(() => {
  game = window.__VICE_CITY_GAME__ || game;
  if (!game?.city || !game?.playerContainer) return;
  clearInterval(wait);
  install();
}, 120);
setTimeout(() => clearInterval(wait), 30000);
