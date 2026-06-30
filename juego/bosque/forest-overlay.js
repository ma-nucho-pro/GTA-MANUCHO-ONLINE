import * as THREE from 'three';

const overlay = document.getElementById('forest-load');
const msg = document.getElementById('forest-load-msg');
const bar = document.getElementById('forest-load-bar');
const worldStatus = document.getElementById('world-status');

const setProgress = (p, text) => {
  if (msg) msg.textContent = text;
  if (bar) bar.style.width = `${Math.max(0, Math.min(100, p))}%`;
};
const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function seeded(seed = 184729) {
  let x = seed >>> 0;
  return () => ((x = Math.imul(x ^ (x >>> 15), 1 | x), x ^= x + Math.imul(x ^ (x >>> 7), 61 | x), ((x ^ (x >>> 14)) >>> 0) / 4294967296));
}

// Texturas procedimentales más pequeñas: mantienen el aspecto del bosque y se
// generan mucho más rápido que los atlas de 256/512 px.
function makeBarkTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d', { alpha: false });
  x.fillStyle = '#563923';
  x.fillRect(0, 0, 128, 128);
  const rnd = seeded(7419);
  for (let i = 0; i < 310; i++) {
    const px = rnd() * 128;
    const py = rnd() * 128;
    const w = 1 + rnd() * 3;
    const h = 5 + rnd() * 24;
    x.fillStyle = rnd() > .5
      ? `rgba(28,14,7,${.08 + rnd() * .24})`
      : `rgba(184,124,70,${.05 + rnd() * .18})`;
    x.fillRect(px, py, w, h);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 6);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 1;
  t.needsUpdate = true;
  return t;
}

function makeLeafTexture(base, light) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d', { alpha: false });
  const g = x.createRadialGradient(45, 35, 5, 64, 64, 90);
  g.addColorStop(0, light);
  g.addColorStop(1, base);
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  const rnd = seeded(parseInt(base.slice(1), 16));
  for (let i = 0; i < 180; i++) {
    x.fillStyle = `rgba(8,35,14,${.03 + rnd() * .14})`;
    x.beginPath();
    x.arc(rnd() * 128, rnd() * 128, 1 + rnd() * 4, 0, Math.PI * 2);
    x.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 1;
  t.needsUpdate = true;
  return t;
}

function median(values) {
  const a = values.filter(Number.isFinite).sort((a, b) => a - b);
  return a.length ? a[Math.floor(a.length / 2)] : NaN;
}

async function waitForWorld() {
  setProgress(4, 'Cargando el terreno exacto de bosque(8)…');
  for (let i = 0; i < 900; i++) {
    const engine = window.__gtaVentaraEngine;
    const controller = window.__gtaVentaraController;
    if (engine?.scene && controller?.groundProbe && window.__laas?.ready) return { engine, controller };
    await sleep(50);
  }
  throw new Error('El terreno no terminó de iniciar.');
}

function syncSpecies(species) {
  species.forEach(q => {
    q.trunk.count = q.crownA.count = q.crownB.count = q.count;
    q.trunk.instanceMatrix.needsUpdate = true;
    q.crownA.instanceMatrix.needsUpdate = true;
    q.crownB.instanceMatrix.needsUpdate = true;
  });
}

function createPhysicalPathProbe(controller, originalProbe, surfaces) {
  if (!surfaces.length || controller.groundProbe?.__bosque8PhysicalPath) return;

  const wrappedProbe = (x, z) => {
    let hit;
    try {
      hit = originalProbe(x, z) || {};
    } catch {
      hit = {};
    }

    let pathGround = -Infinity;
    for (let i = 0; i < surfaces.length; i++) {
      const s = surfaces[i];
      const dx = x - s.x;
      const dz = z - s.z;
      // Transformación inversa al espacio local del escalón.
      const localX = s.cos * dx + s.sin * dz;
      const localZ = -s.sin * dx + s.cos * dz;
      if (Math.abs(localX) <= s.halfW && Math.abs(localZ) <= s.halfD) {
        pathGround = Math.max(pathGround, s.topY);
      }
    }

    const terrainGround = Number.isFinite(hit?.ground) ? hit.ground : -Infinity;
    if (Number.isFinite(pathGround) && pathGround >= terrainGround - .05) {
      return {
        ...hit,
        ground: pathGround,
        normal: new THREE.Vector3(0, 1, 0),
        onBridge: true
      };
    }
    return hit;
  };

  wrappedProbe.__bosque8PhysicalPath = true;
  wrappedProbe.__baseProbe = originalProbe;
  controller.groundProbe = wrappedProbe;
  if (window.__laas) window.__laas.groundProbe = wrappedProbe;
  window.__bosque8PathSurfaces = surfaces;
}

async function buildForest(engine, controller) {
  const scene = engine.scene;
  const originalProbe = controller.groundProbe.bind(controller);
  const probe = originalProbe;
  const rand = seeded(20260626);
  const root = new THREE.Group();
  root.name = 'BOSQUE8_VEGETACION_EXACTA_COMPATIBLE';
  scene.add(root);

  setProgress(10, 'Preparando materiales ligeros…');
  const barkTex = makeBarkTexture();
  const leafTex = [
    makeLeafTexture('#143d21', '#3f7b43'),
    makeLeafTexture('#1b512c', '#5c8d43'),
    makeLeafTexture('#335f2b', '#829a4b'),
    makeLeafTexture('#234f35', '#6e9a62')
  ];

  const trunkMats = [0x5a3823, 0x68432a, 0x7a6b57, 0x4b3020].map(color =>
    new THREE.MeshStandardMaterial({ color, map: barkTex, roughness: .96, metalness: 0 })
  );
  const leafColors = [0x315f35, 0x426f38, 0x6d7d3a, 0x427153];
  const leafMats = leafTex.map((map, i) =>
    new THREE.MeshStandardMaterial({ color: leafColors[i], map, roughness: .9, metalness: 0 })
  );

  const trunkGeo = new THREE.CylinderGeometry(.55, .78, 1, 7, 1, false);
  const crownGeo = [
    new THREE.ConeGeometry(1, 1, 8),
    new THREE.ConeGeometry(1, 1, 8),
    new THREE.IcosahedronGeometry(1, 1),
    new THREE.IcosahedronGeometry(1, 1)
  ];

  const CAP = 340;
  const species = [];
  for (let i = 0; i < 4; i++) {
    const trunk = new THREE.InstancedMesh(trunkGeo, trunkMats[i], CAP);
    const crownA = new THREE.InstancedMesh(crownGeo[i], leafMats[i], CAP);
    const crownB = new THREE.InstancedMesh(crownGeo[i], leafMats[i], CAP);
    trunk.count = crownA.count = crownB.count = 0;
    trunk.castShadow = false;
    trunk.receiveShadow = true;
    crownA.castShadow = crownB.castShadow = false;
    trunk.frustumCulled = crownA.frustumCulled = crownB.frustumCulled = true;
    trunk.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    crownA.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    crownB.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    root.add(trunk, crownA, crownB);
    species.push({ trunk, crownA, crownB, count: 0 });
  }

  const dummy = new THREE.Object3D();
  const radius = 1500;
  const TOTAL_TARGET = 1120;
  const INITIAL_TARGET = 430;
  const MAX_ATTEMPTS = TOTAL_TARGET * 10;
  let placed = 0;
  let attempts = 0;

  const tryPlaceTree = () => {
    attempts++;
    const ang = rand() * Math.PI * 2;
    const rr = Math.sqrt(rand()) * radius;
    const x = Math.cos(ang) * rr;
    const z = Math.sin(ang) * rr;
    if (Math.hypot(x, z) < 55) return false;

    let hit;
    try { hit = probe(x, z); } catch { return false; }
    const ground = hit?.ground;
    const water = hit?.water;
    if (!Number.isFinite(ground)) return false;
    if (Number.isFinite(water) && ground < water + .55) return false;

    let slope = 0;
    try {
      const a = probe(x + 4, z)?.ground;
      const b = probe(x - 4, z)?.ground;
      const c = probe(x, z + 4)?.ground;
      const d = probe(x, z - 4)?.ground;
      slope = Math.max(Math.abs(a - b), Math.abs(c - d)) / 8;
    } catch {}
    if (slope > .52) return false;

    const si = ground > 70 ? (rand() < .7 ? 0 : 1) : (rand() < .48 ? 2 : (rand() < .55 ? 1 : 3));
    const sp = species[si];
    if (sp.count >= CAP) return false;
    const k = sp.count++;
    const scale = .72 + rand() * 1.25;
    const trunkH = (si < 2 ? 10 : 8.2) * scale;
    const trunkR = (si === 2 ? .52 : .66) * scale;

    dummy.position.set(x, ground + trunkH / 2, z);
    dummy.rotation.set(0, rand() * Math.PI * 2, 0);
    dummy.scale.set(trunkR, trunkH, trunkR);
    dummy.updateMatrix();
    sp.trunk.setMatrixAt(k, dummy.matrix);

    const crownY = ground + trunkH + (si < 2 ? 3.8 : 2.2) * scale;
    if (si < 2) {
      dummy.position.set(x, crownY, z);
      dummy.rotation.set(0, rand() * Math.PI * 2, 0);
      dummy.scale.set(4.7 * scale, 10.5 * scale, 4.7 * scale);
      dummy.updateMatrix();
      sp.crownA.setMatrixAt(k, dummy.matrix);

      dummy.position.set(x, ground + trunkH + 7.1 * scale, z);
      dummy.rotation.set(0, rand() * Math.PI * 2, 0);
      dummy.scale.set(3.2 * scale, 7.5 * scale, 3.2 * scale);
      dummy.updateMatrix();
      sp.crownB.setMatrixAt(k, dummy.matrix);
    } else {
      dummy.position.set(x, crownY, z);
      dummy.rotation.set(rand() * .15, rand() * Math.PI * 2, rand() * .15);
      dummy.scale.set(5.5 * scale, 4.7 * scale, 5.5 * scale);
      dummy.updateMatrix();
      sp.crownA.setMatrixAt(k, dummy.matrix);

      dummy.position.set(
        x + (.8 - rand() * 1.6) * scale,
        crownY + 2.5 * scale,
        z + (.8 - rand() * 1.6) * scale
      );
      dummy.rotation.set(rand() * .2, rand() * Math.PI * 2, rand() * .2);
      dummy.scale.set(4.1 * scale, 3.5 * scale, 4.1 * scale);
      dummy.updateMatrix();
      sp.crownB.setMatrixAt(k, dummy.matrix);
    }
    placed++;
    return true;
  };

  setProgress(18, 'Plantando la vegetación visible…');
  while (placed < INITIAL_TARGET && attempts < MAX_ATTEMPTS) {
    const startCount = placed;
    const deadline = performance.now() + 8;
    while (placed < INITIAL_TARGET && attempts < MAX_ATTEMPTS && performance.now() < deadline) {
      tryPlaceTree();
    }
    if (placed !== startCount) syncSpecies(species);
    setProgress(18 + (placed / INITIAL_TARGET) * 48, `Plantando vegetación… ${placed}/${INITIAL_TARGET}`);
    await nextFrame();
  }
  syncSpecies(species);

  setProgress(70, 'Añadiendo rocas, agua y camino físico…');
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x686a62, roughness: 1 });
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, 150);
  rocks.castShadow = false;
  rocks.receiveShadow = true;
  let rc = 0;
  for (let i = 0; i < 650 && rc < 150; i++) {
    const ang = rand() * Math.PI * 2;
    const rr = Math.sqrt(rand()) * 1350;
    const x = Math.cos(ang) * rr;
    const z = Math.sin(ang) * rr;
    let h;
    try { h = probe(x, z)?.ground; } catch {}
    if (!Number.isFinite(h)) continue;
    const sc = .5 + rand() * 2.4;
    dummy.position.set(x, h + .55 * sc, z);
    dummy.rotation.set(rand(), rand() * Math.PI * 2, rand());
    dummy.scale.set(sc * (.7 + rand() * .8), sc * .65, sc * (.7 + rand() * .8));
    dummy.updateMatrix();
    rocks.setMatrixAt(rc++, dummy.matrix);
  }
  rocks.count = rc;
  rocks.instanceMatrix.needsUpdate = true;
  root.add(rocks);

  const waters = [];
  for (let x = -900; x <= 900; x += 450) {
    for (let z = -900; z <= 900; z += 450) {
      try { waters.push(probe(x, z)?.water); } catch {}
    }
  }
  const waterY = median(waters);
  if (Number.isFinite(waterY)) {
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(3800, 3800, 1, 1),
      new THREE.MeshPhysicalMaterial({
        color: 0x2c7891,
        transparent: true,
        opacity: .58,
        roughness: .28,
        metalness: .05,
        clearcoat: .5,
        depthWrite: false
      })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = waterY + .03;
    water.receiveShadow = false;
    root.add(water);
  }

  // Camino/escalones sólidos. Además de verse, ahora modifican la altura física
  // consultada por el controlador para que el jugador camine encima y no los atraviese.
  const start = controller.basePos.clone();
  const pathMat = new THREE.MeshStandardMaterial({ color: 0x7d6547, roughness: 1 });
  const pathSurfaces = [];
  const PATH_W = 9;
  const PATH_D = 14;
  const PATH_H = .24;
  for (let i = 0; i < 58; i++) {
    const z = start.z + i * 13;
    const x = start.x + Math.sin(i * .18) * 34;
    let h;
    try { h = probe(x, z)?.ground; } catch {}
    if (!Number.isFinite(h)) continue;

    const nextX = start.x + Math.sin((i + 1) * .18) * 34;
    const rotationY = Math.atan2(nextX - x, 13);
    const seg = new THREE.Mesh(new THREE.BoxGeometry(PATH_W, PATH_H, PATH_D), pathMat);
    seg.position.set(x, h + PATH_H / 2 + .02, z);
    seg.rotation.y = rotationY;
    seg.receiveShadow = true;
    seg.matrixAutoUpdate = false;
    seg.updateMatrix();
    root.add(seg);

    pathSurfaces.push({
      x,
      z,
      topY: seg.position.y + PATH_H / 2,
      halfW: PATH_W / 2 + .2,
      halfD: PATH_D / 2 + .25,
      cos: Math.cos(rotationY),
      sin: Math.sin(rotationY)
    });
  }
  createPhysicalPathProbe(controller, originalProbe, pathSurfaces);

  // Resolución interna estable; el canvas sigue ocupando toda la pantalla.
  engine.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, .78));

  setProgress(100, 'Bosque(8) listo');
  if (worldStatus) worldStatus.textContent = 'Bosque listo · completando árboles lejanos en segundo plano…';
  await sleep(120);
  if (overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 320);
  }

  // Completa el resto de los árboles en tiempos muertos del navegador. El jugador
  // puede empezar a moverse inmediatamente y no espera toda la plantación.
  const scheduleIdle = callback => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(callback, { timeout: 80 });
    } else {
      setTimeout(() => callback({ timeRemaining: () => 6, didTimeout: true }), 16);
    }
  };

  const backgroundPlant = deadline => {
    const started = performance.now();
    let changed = false;
    while (placed < TOTAL_TARGET && attempts < MAX_ATTEMPTS) {
      changed = tryPlaceTree() || changed;
      const idleTime = typeof deadline?.timeRemaining === 'function' ? deadline.timeRemaining() : 0;
      if ((idleTime < 1 && performance.now() - started > 4) || performance.now() - started > 7) break;
    }
    if (changed) syncSpecies(species);

    if (placed < TOTAL_TARGET && attempts < MAX_ATTEMPTS) {
      scheduleIdle(backgroundPlant);
    } else if (worldStatus) {
      worldStatus.textContent = `Bosque listo · ${placed} árboles`;
      setTimeout(() => {
        worldStatus.style.opacity = '0';
        setTimeout(() => worldStatus.remove(), 550);
      }, 1800);
    }
  };
  scheduleIdle(backgroundPlant);
}

(async () => {
  try {
    const { engine, controller } = await waitForWorld();
    await buildForest(engine, controller);
  } catch (error) {
    console.error('[bosque8]', error);
    if (msg) msg.textContent = 'No se pudo iniciar el bosque: ' + (error?.message || error);
    if (bar) bar.style.background = '#ef4444';
  }
})();
