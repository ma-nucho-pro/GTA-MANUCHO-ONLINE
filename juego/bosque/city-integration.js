import * as THREE from 'three';

let installed = false;
let exiting = false;
let spawn = null;
let gate = null;
let armed = false;

function exitToCity() {
  if (exiting) return;
  exiting = true;
  try { document.exitPointerLock?.(); } catch {}
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:999999;background:#07120d;color:#baffd5;display:flex;align-items:center;justify-content:center;font:800 20px Arial;letter-spacing:.12em';
  overlay.textContent = 'REGRESANDO A GTA MANUCHO…';
  document.body.appendChild(overlay);
  setTimeout(() => location.replace('../index.html?from=bosque'), 80);
}

function install() {
  if (installed) return;
  const engine = window.__gtaVentaraEngine;
  const controller = window.__gtaVentaraController;
  if (!engine?.scene || !controller?.basePos) return;
  installed = true;

  // Keep the supplied world intact; only cap internal pixel density.
  try { engine.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 0.9)); } catch {}

  spawn = controller.basePos.clone();
  let ground = spawn.y - 1.7;
  try {
    const hit = controller.groundProbe?.(spawn.x, spawn.z);
    if (Number.isFinite(hit?.ground)) ground = hit.ground;
  } catch {}

  gate = new THREE.Group();
  gate.name = 'SALIDA_A_VICE_CITY';
  gate.position.set(spawn.x, ground, spawn.z + 11);
  const stone = new THREE.MeshStandardMaterial({ color: 0x554a3b, roughness: 0.96 });
  const glow = new THREE.MeshBasicMaterial({ color: 0x72ffad, transparent: true, opacity: 0.48, side: THREE.DoubleSide, depthWrite: false });
  const left = new THREE.Mesh(new THREE.BoxGeometry(1.3, 6.2, 1.3), stone);
  const right = left.clone(); left.position.set(-3.2,3.1,0); right.position.set(3.2,3.1,0);
  const top = new THREE.Mesh(new THREE.BoxGeometry(7.7,1.3,1.3), stone); top.position.set(0,5.8,0);
  const portal = new THREE.Mesh(new THREE.PlaneGeometry(5.5,5), glow); portal.position.set(0,2.8,0.08);
  gate.add(left,right,top,portal); engine.scene.add(gate);

  const label = document.createElement('div');
  label.textContent = 'SALIDA A GTA MANUCHO';
  label.style.cssText = 'position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:2200;padding:9px 15px;border-radius:11px;background:rgba(4,18,12,.78);border:1px solid #70f0aa;color:#baffd5;font:800 13px Arial;letter-spacing:.12em;pointer-events:none';
  document.body.appendChild(label);

  engine.onUpdate(() => {
    if (!spawn || !gate || exiting) return;
    const p = controller.basePos;
    if (p.distanceTo(spawn) > 15) armed = true;
    if (armed && Math.hypot(p.x-gate.position.x,p.z-gate.position.z) < 3.5) exitToCity();
  });
}

addEventListener('keydown', (event) => {
  if (event.code === 'Escape') exitToCity();
}, true);
setInterval(install, 120);
setTimeout(install, 0);
