/**
 * GTA MANUCHO V84 — código del proyecto.
 * Creado e integrado por Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * ARKEA AI / Manucho · conserva LICENSE, NOTICE.md y estos créditos al reutilizar.
 */
import * as THREE from './bosque/libs/three.module.js';

THREE.Cache.enabled = true;

const CHURCH = { x: 1500, zMin: 165, zMax: 315, halfWidth: 95, y: 1.5, returnZ: 210 };
const FOREST = {
  centerX: 1500,
  centerZ: -1900,
  halfX: 700,
  halfZ: 420,
  groundY: 2.05,
  gateX: 1500,
  gateZ: -2250,
  returnZ: -2188
};

let game = null;
let initialized = false;
let returnHandled = false;
let forestTransition = false;
let forestGateCooldownUntil = 0;

function createGroundTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 256, 256);
  gradient.addColorStop(0, '#315c32');
  gradient.addColorStop(0.45, '#456c35');
  gradient.addColorStop(1, '#284d2d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  let seed = 917331;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 650; i++) {
    const x = rand() * 256;
    const y = rand() * 256;
    const r = 0.5 + rand() * 3.5;
    ctx.fillStyle = rand() > 0.48 ? `rgba(111,82,47,${0.04 + rand() * 0.1})` : `rgba(18,70,31,${0.04 + rand() * 0.13})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(34, 22);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 2;
  return texture;
}

function createPathTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#806347';
  ctx.fillRect(0, 0, 256, 256);
  let seed = 22919;
  const rand = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
  for (let i = 0; i < 650; i++) {
    const shade = 70 + Math.floor(rand() * 55);
    ctx.fillStyle = `rgba(${shade + 22},${shade},${Math.max(38, shade - 28)},${0.15 + rand() * 0.22})`;
    ctx.fillRect(rand() * 256, rand() * 256, 1 + rand() * 4, 1 + rand() * 3);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 34);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 2;
  return texture;
}

function addChurchFloor() {
  if (!game || game.__churchFloorInstalled) return;
  game.__churchFloorInstalled = true;

  const original = game.getGroundY.bind(game);
  game.getGroundY = function(x, y, z, strict = true) {
    const value = original(x, y, z, strict);
    if (Math.abs(x - CHURCH.x) <= CHURCH.halfWidth && z >= CHURCH.zMin && z <= CHURCH.zMax) {
      return Math.max(Number.isFinite(value) ? value : -Infinity, CHURCH.y);
    }
    if (
      x >= FOREST.centerX - FOREST.halfX && x <= FOREST.centerX + FOREST.halfX &&
      z >= FOREST.centerZ - FOREST.halfZ && z <= FOREST.centerZ + FOREST.halfZ
    ) {
      return Math.max(Number.isFinite(value) ? value : -Infinity, FOREST.groundY);
    }
    return value;
  };

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(CHURCH.halfWidth * 2, 4, CHURCH.zMax - CHURCH.zMin),
    new THREE.MeshStandardMaterial({ color: 0x6f6a61, roughness: 0.96, metalness: 0.02 })
  );
  floor.name = 'PISO_SOLIDO_IGLESIA_RETIRO';
  floor.position.set(CHURCH.x, CHURCH.y - 2, (CHURCH.zMin + CHURCH.zMax) / 2);
  floor.receiveShadow = true;
  floor.matrixAutoUpdate = false;
  floor.updateMatrix();
  game.city.add(floor);

  const threshold = new THREE.Mesh(
    new THREE.BoxGeometry(48, 4, 40),
    new THREE.MeshStandardMaterial({ color: 0x7b7164, roughness: 0.92 })
  );
  threshold.name = 'UMBRAL_SOLIDO_MUSEO';
  threshold.position.set(CHURCH.x, CHURCH.y - 2, 250);
  threshold.receiveShadow = true;
  threshold.matrixAutoUpdate = false;
  threshold.updateMatrix();
  game.city.add(threshold);
}

function removeCollectibles() {
  if (!game || game.__collectiblesRemovedByIntegration) return;
  game.__collectiblesRemovedByIntegration = true;
  for (const entry of [...(game.goldenBunnies || []), ...(game.goldenDragons || [])]) {
    if (entry?.mesh?.parent) entry.mesh.parent.remove(entry.mesh);
  }
  game.goldenBunnies = [];
  game.goldenDragons = [];
  game.collectedBunniesCount = 0;
  game.collectedDragonsCount = 0;
}

function installCitySizedForest() {
  if (!game || game.__citySizedForestInstalled) return;
  game.__citySizedForestInstalled = true;

  const group = new THREE.Group();
  group.name = 'BOSQUE5_TAMANO_CIUDAD_VISTA_EXTERIOR';
  group.position.set(FOREST.centerX, 0, FOREST.centerZ);

  const soil = new THREE.Mesh(
    new THREE.BoxGeometry(FOREST.halfX * 2, 4, FOREST.halfZ * 2),
    new THREE.MeshStandardMaterial({ map: createGroundTexture(), color: 0xb5c69a, roughness: 1, metalness: 0 })
  );
  soil.position.y = FOREST.groundY - 2;
  soil.receiveShadow = false;
  soil.castShadow = false;
  soil.matrixAutoUpdate = false;
  soil.updateMatrix();
  group.add(soil);

  const path = new THREE.Mesh(
    new THREE.BoxGeometry(34, 0.35, FOREST.halfZ * 2 - 26),
    new THREE.MeshStandardMaterial({ map: createPathTexture(), color: 0xd1b28a, roughness: 1 })
  );
  path.position.set(0, FOREST.groundY + 0.19, 0);
  path.receiveShadow = false;
  path.matrixAutoUpdate = false;
  path.updateMatrix();
  group.add(path);

  const trunkGeo = new THREE.CylinderGeometry(1.1, 1.75, 11.5, 6);
  const crownGeo = new THREE.DodecahedronGeometry(5.6, 0);
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5b3824 });
  const leafMats = [
    new THREE.MeshLambertMaterial({ color: 0x174b28 }),
    new THREE.MeshLambertMaterial({ color: 0x266538 }),
    new THREE.MeshLambertMaterial({ color: 0x3a7840 })
  ];

  const capacity = 320;
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, capacity);
  const crowns = leafMats.map(material => new THREE.InstancedMesh(crownGeo, material, capacity));
  trunks.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  crowns.forEach(mesh => mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage));
  trunks.castShadow = trunks.receiveShadow = false;
  crowns.forEach(mesh => { mesh.castShadow = mesh.receiveShadow = false; });

  const dummy = new THREE.Object3D();
  let seed = 77121;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const crownCounts = [0, 0, 0];
  let trunkCount = 0;

  for (let attempts = 0; attempts < capacity * 4 && trunkCount < capacity; attempts++) {
    const x = (rand() * 2 - 1) * (FOREST.halfX - 24);
    const z = (rand() * 2 - 1) * (FOREST.halfZ - 22);
    if (Math.abs(x) < 30) continue;
    if (z > FOREST.halfZ - 74 && Math.abs(x) < 120) continue;

    const scale = 0.72 + rand() * 1.05;
    const rotation = rand() * Math.PI * 2;
    dummy.position.set(x, FOREST.groundY + 5.75 * scale, z);
    dummy.rotation.set(0, rotation, 0);
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();
    trunks.setMatrixAt(trunkCount++, dummy.matrix);

    const materialIndex = Math.floor(rand() * leafMats.length);
    const crownIndex = crownCounts[materialIndex]++;
    dummy.position.set(x, FOREST.groundY + 13.1 * scale, z);
    dummy.rotation.set(rand() * 0.12, rotation, rand() * 0.12);
    dummy.scale.set((0.8 + rand() * 0.7) * scale, (0.85 + rand() * 0.75) * scale, (0.8 + rand() * 0.7) * scale);
    dummy.updateMatrix();
    crowns[materialIndex].setMatrixAt(crownIndex, dummy.matrix);
  }

  trunks.count = trunkCount;
  trunks.instanceMatrix.needsUpdate = true;
  group.add(trunks);
  crowns.forEach((mesh, index) => {
    mesh.count = crownCounts[index];
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
  });

  const rockGeo = new THREE.DodecahedronGeometry(2.4, 0);
  const rockMat = new THREE.MeshLambertMaterial({ color: 0x65675f });
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, 40);
  rocks.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  for (let i = 0; i < 40; i++) {
    const x = (rand() * 2 - 1) * (FOREST.halfX - 32);
    const z = (rand() * 2 - 1) * (FOREST.halfZ - 28);
    if (Math.abs(x) < 28) { i--; continue; }
    const scale = 0.45 + rand() * 1.4;
    dummy.position.set(x, FOREST.groundY + 0.9 * scale, z);
    dummy.rotation.set(rand() * 0.6, rand() * Math.PI * 2, rand() * 0.6);
    dummy.scale.set(scale * (0.8 + rand()), scale * 0.7, scale * (0.8 + rand()));
    dummy.updateMatrix();
    rocks.setMatrixAt(i, dummy.matrix);
  }
  rocks.instanceMatrix.needsUpdate = true;
  group.add(rocks);

  const gateLocalZ = FOREST.gateZ - FOREST.centerZ;
  const gate = new THREE.Group();
  gate.position.set(0, FOREST.groundY, gateLocalZ);
  const stone = new THREE.MeshStandardMaterial({ color: 0x4e4031, roughness: 0.98 });
  const glow = new THREE.MeshBasicMaterial({ color: 0x72ffad, transparent: true, opacity: 0.38, side: THREE.DoubleSide, depthWrite: false });
  const left = new THREE.Mesh(new THREE.BoxGeometry(4, 24, 4), stone);
  const right = left.clone();
  left.position.set(-13, 12, 0);
  right.position.set(13, 12, 0);
  const top = new THREE.Mesh(new THREE.BoxGeometry(30, 4, 4), stone);
  top.position.set(0, 22, 0);
  const portal = new THREE.Mesh(new THREE.PlaneGeometry(22, 18), glow);
  portal.position.set(0, 11, 0.2);
  gate.add(left, right, top, portal);
  group.add(gate);

  const signCanvas = document.createElement('canvas');
  signCanvas.width = 1024;
  signCanvas.height = 256;
  const signCtx = signCanvas.getContext('2d');
  signCtx.fillStyle = '#10251b';
  signCtx.fillRect(0, 0, 1024, 256);
  signCtx.strokeStyle = '#d7c18d';
  signCtx.lineWidth = 18;
  signCtx.strokeRect(12, 12, 1000, 232);
  signCtx.fillStyle = '#f4e7bf';
  signCtx.textAlign = 'center';
  signCtx.font = 'bold 72px Georgia';
  signCtx.fillText('BOSQUE 6', 512, 105);
  signCtx.fillStyle = '#aaf0bf';
  signCtx.font = 'bold 34px Arial';
  signCtx.fillText('ATRAVIESA LA PUERTA PARA ENTRAR AL MUNDO COMPLETO', 512, 180);
  const signTexture = new THREE.CanvasTexture(signCanvas);
  signTexture.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(54, 13.5), new THREE.MeshBasicMaterial({ map: signTexture }));
  sign.position.set(0, FOREST.groundY + 30, gateLocalZ - 2.2);
  group.add(sign);


  game.city.add(group);
}

function installRoadAndCityExpansion() {
  if (!game || game.__viceCityExpansionInstalled) return;
  game.__viceCityExpansionInstalled = true;

  // V39: se elimina la malla de pistas artificiales. Solo se añade una pequeña
  // ciudad extra sobre una base sólida, con un rascacielos principal inspirado
  // en el ejemplo del generador de edificios enviado por el usuario.
  const group = new THREE.Group();
  group.name = 'VICE_CITY_EXPANSION_V39';

  const CITY = {
    centerX: 420,
    centerZ: 2480,
    halfX: 980,
    halfZ: 360,
    topY: 1.25,
    baseDepth: 62
  };

  const concreteMat = new THREE.MeshStandardMaterial({ color: 0xc4c8d2, roughness: 0.96, metalness: 0.02 });
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0x8e949f, roughness: 0.98, metalness: 0.02 });
  const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x4b4f58, roughness: 1, metalness: 0 });
  const grassMat = new THREE.MeshLambertMaterial({ color: 0x8db18a });
  const terracottaA = new THREE.MeshLambertMaterial({ color: 0xb96842 });
  const terracottaB = new THREE.MeshLambertMaterial({ color: 0x92533a });
  const terracottaC = new THREE.MeshLambertMaterial({ color: 0xd28a5d });
  const windowMat = new THREE.MeshBasicMaterial({ color: 0x2f405e });
  const smallTowerMats = [
    new THREE.MeshLambertMaterial({ color: 0xd9deea }),
    new THREE.MeshLambertMaterial({ color: 0xb7c2db }),
    new THREE.MeshLambertMaterial({ color: 0xc4bfda })
  ];
  const dummy = new THREE.Object3D();

  const foundation = new THREE.Mesh(
    new THREE.BoxGeometry(CITY.halfX * 2, CITY.baseDepth, CITY.halfZ * 2),
    concreteMat
  );
  foundation.position.set(CITY.centerX, CITY.topY - CITY.baseDepth * 0.5, CITY.centerZ);
  foundation.castShadow = false;
  foundation.receiveShadow = true;
  foundation.matrixAutoUpdate = false;
  foundation.updateMatrix();
  group.add(foundation);

  const seawall = new THREE.Mesh(
    new THREE.BoxGeometry(CITY.halfX * 2 + 24, 8, CITY.halfZ * 2 + 24),
    edgeMat
  );
  seawall.position.set(CITY.centerX, CITY.topY + 3.2, CITY.centerZ);
  seawall.castShadow = false;
  seawall.receiveShadow = true;
  seawall.matrixAutoUpdate = false;
  seawall.updateMatrix();
  group.add(seawall);

  const topPlate = new THREE.Mesh(
    new THREE.BoxGeometry(CITY.halfX * 2, 2.2, CITY.halfZ * 2),
    concreteMat
  );
  topPlate.position.set(CITY.centerX, CITY.topY, CITY.centerZ);
  topPlate.castShadow = false;
  topPlate.receiveShadow = true;
  topPlate.matrixAutoUpdate = false;
  topPlate.updateMatrix();
  group.add(topPlate);

  const parkStrip = new THREE.Mesh(
    new THREE.BoxGeometry(CITY.halfX * 2 - 80, 0.6, 180),
    grassMat
  );
  parkStrip.position.set(CITY.centerX, CITY.topY + 1.35, CITY.centerZ - 120);
  parkStrip.castShadow = false;
  parkStrip.receiveShadow = true;
  parkStrip.matrixAutoUpdate = false;
  parkStrip.updateMatrix();
  group.add(parkStrip);

  const mainStreet = new THREE.Mesh(
    new THREE.BoxGeometry(CITY.halfX * 2 - 90, 0.5, 88),
    asphaltMat
  );
  mainStreet.position.set(CITY.centerX, CITY.topY + 1.3, CITY.centerZ + 90);
  mainStreet.castShadow = false;
  mainStreet.receiveShadow = true;
  mainStreet.matrixAutoUpdate = false;
  mainStreet.updateMatrix();
  group.add(mainStreet);

  const crossStreet = new THREE.Mesh(
    new THREE.BoxGeometry(88, 0.5, CITY.halfZ * 2 - 110),
    asphaltMat
  );
  crossStreet.position.set(CITY.centerX - 220, CITY.topY + 1.31, CITY.centerZ);
  crossStreet.castShadow = false;
  crossStreet.receiveShadow = true;
  crossStreet.matrixAutoUpdate = false;
  crossStreet.updateMatrix();
  group.add(crossStreet);

  // Calles internas de la ampliación: válidas solo dentro de la nueva plataforma.
  const stripeMat = new THREE.MeshBasicMaterial({ color: 0xf4d24a });
  const stripes = new THREE.InstancedMesh(new THREE.BoxGeometry(26, 0.04, 2.8), stripeMat, 36);
  stripes.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  let stripeIndex = 0;
  for (let i = 0; i < 20; i++) {
    dummy.position.set(CITY.centerX - CITY.halfX + 110 + i * 90, CITY.topY + 1.58, CITY.centerZ + 90);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    stripes.setMatrixAt(stripeIndex++, dummy.matrix);
  }
  for (let i = 0; i < 16; i++) {
    dummy.position.set(CITY.centerX - 220, CITY.topY + 1.58, CITY.centerZ - CITY.halfZ + 100 + i * 40);
    dummy.rotation.set(0, Math.PI * 0.5, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    stripes.setMatrixAt(stripeIndex++, dummy.matrix);
  }
  stripes.count = stripeIndex;
  stripes.instanceMatrix.needsUpdate = true;
  group.add(stripes);

  const cityGroup = new THREE.Group();
  cityGroup.name = 'CIUDAD_NUEVA_CERCANA_V39';
  cityGroup.position.set(CITY.centerX, CITY.topY + 2.2, CITY.centerZ);

  // Rascacielos principal tipo terracotta / neo-gótico, inspirado en el ejemplo.
  const skyscraper = new THREE.Group();
  skyscraper.name = 'SKYSCRAPER_GENERADOR_REFERENCIA_V39';
  const baseBlock = new THREE.Mesh(new THREE.BoxGeometry(170, 210, 150), terracottaA);
  baseBlock.position.y = 105;
  skyscraper.add(baseBlock);
  const midBlock = new THREE.Mesh(new THREE.BoxGeometry(138, 150, 126), terracottaB);
  midBlock.position.y = 290;
  skyscraper.add(midBlock);
  const upperBlock = new THREE.Mesh(new THREE.BoxGeometry(102, 122, 96), terracottaA);
  upperBlock.position.y = 426;
  skyscraper.add(upperBlock);
  const crown = new THREE.Mesh(new THREE.BoxGeometry(74, 70, 70), terracottaC);
  crown.position.y = 522;
  skyscraper.add(crown);
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0, 18, 70, 6), terracottaB);
  spire.position.y = 592;
  skyscraper.add(spire);

  const pilasterGeo = new THREE.BoxGeometry(8, 200, 10);
  const pilasterMat = terracottaC;
  const pilasterOffsets = [
    [-73, 100, -66], [73, 100, -66], [-73, 100, 66], [73, 100, 66],
    [-56, 285, -55], [56, 285, -55], [-56, 285, 55], [56, 285, 55]
  ];
  for (const [x, y, z] of pilasterOffsets) {
    const p = new THREE.Mesh(pilasterGeo, pilasterMat);
    p.position.set(x, y, z);
    skyscraper.add(p);
  }

  const windowGeo = new THREE.BoxGeometry(8, 12, 1.2);
  const windowInstances = new THREE.InstancedMesh(windowGeo, windowMat, 480);
  windowInstances.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  let win = 0;
  function addWindowFace(faceZ, width, height, rows, cols, yStart, zSign, xInset = 18) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = -width * 0.5 + xInset + c * ((width - xInset * 2) / Math.max(1, cols - 1));
        const y = yStart + r * ((height - 32) / Math.max(1, rows - 1));
        dummy.position.set(x, y, faceZ + zSign * 0.7);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        windowInstances.setMatrixAt(win++, dummy.matrix);
      }
    }
  }
  addWindowFace(75, 170, 180, 10, 9, 24, 1);
  addWindowFace(-75, 170, 180, 10, 9, 24, -1);
  addWindowFace(63, 138, 130, 7, 7, 232, 1, 16);
  addWindowFace(-63, 138, 130, 7, 7, 232, -1, 16);
  addWindowFace(48, 102, 104, 5, 5, 378, 1, 14);
  addWindowFace(-48, 102, 104, 5, 5, 378, -1, 14);
  windowInstances.count = win;
  windowInstances.instanceMatrix.needsUpdate = true;
  skyscraper.add(windowInstances);

  skyscraper.position.set(380, 0, 0);
  skyscraper.traverse(obj => {
    if (obj.isMesh || obj.isInstancedMesh) {
      obj.castShadow = false;
      obj.receiveShadow = true;
      if (!obj.isInstancedMesh) {
        obj.matrixAutoUpdate = false;
        obj.updateMatrix();
      }
    }
  });
  cityGroup.add(skyscraper);

  // Edificios secundarios cercanos para que se vea ciudad y no una sola torre.
  let seed = 62811;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 18; i++) {
    const width = 70 + rand() * 70;
    const depth = 70 + rand() * 70;
    const height = 90 + rand() * 190;
    const row = Math.floor(i / 9);
    const col = i % 9;
    const tower = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), smallTowerMats[i % smallTowerMats.length]);
    tower.position.set(-760 + col * 160, height * 0.5, row === 0 ? -80 : 120);
    tower.castShadow = false;
    tower.receiveShadow = true;
    tower.matrixAutoUpdate = false;
    tower.updateMatrix();
    cityGroup.add(tower);
  }

  group.add(cityGroup);
  game.city.add(group);

  // Suelo sólido para la nueva zona, de modo que el edificio y la ciudad queden firmes.
  const previousGround = game.getGroundY.bind(game);
  game.getGroundY = function(x, y, z, strict = true) {
    const value = previousGround(x, y, z, strict);
    if (
      x >= CITY.centerX - CITY.halfX && x <= CITY.centerX + CITY.halfX &&
      z >= CITY.centerZ - CITY.halfZ && z <= CITY.centerZ + CITY.halfZ
    ) {
      return Math.max(Number.isFinite(value) ? value : -Infinity, CITY.topY + 2.1);
    }
    return value;
  };
}

function showTransition() {
  let overlay = document.getElementById('forest-transition-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'forest-transition-overlay';
    overlay.innerHTML = '<div><b>ENTRANDO AL BOSQUE 6</b><span>Cerrando la ciudad para liberar la memoria gráfica…</span><i></i></div>';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:100000;background:#102018;display:flex;align-items:center;justify-content:center;color:white;font-family:Arial,sans-serif';
    overlay.querySelector('div').style.cssText = 'width:min(520px,82vw);padding:28px;border:1px solid rgba(160,255,190,.28);border-radius:18px;background:rgba(3,12,7,.78);text-align:center;box-shadow:0 25px 90px rgba(0,0,0,.55)';
    overlay.querySelector('b').style.cssText = 'display:block;color:#8dffb4;letter-spacing:.16em;font-size:22px;margin-bottom:10px';
    overlay.querySelector('span').style.cssText = 'display:block;opacity:.82;font-size:13px;margin-bottom:18px';
    overlay.querySelector('i').style.cssText = 'display:block;width:100%;height:7px;border-radius:8px;background:linear-gradient(90deg,#3fbd72,#98f5b7,#3fbd72);background-size:200% 100%;animation:forestLoad 1s linear infinite';
    const style = document.createElement('style');
    style.textContent = '@keyframes forestLoad{to{background-position:-200% 0}}';
    document.head.appendChild(style);
    document.body.appendChild(overlay);
  }
}

function enterForestWorld() {
  if (forestTransition || Date.now() < forestGateCooldownUntil) return;
  forestTransition = true;
  window.__VICE_ZONE_TRANSITION__ = true;
  try { document.exitPointerLock?.(); } catch {}
  if (game?.keys) for (const key of Object.keys(game.keys)) game.keys[key] = false;
  showTransition();

  // No se crea un segundo renderer oculto. La ciudad se descarga primero y después
  // se abre el mundo exacto de bosque(7), evitando dos escenas WebGPU/WebGL simultáneas.
  setTimeout(() => {
    window.location.assign('./bosque/index.html?integrated=1&fast=1&dpr=0.78&nogate=1');
  }, 90);
}

function handleReturns() {
  if (returnHandled || !game?.playerContainer) return;
  const params = new URLSearchParams(location.search);
  const source = params.get('from');
  if (!source) return;
  returnHandled = true;

  if (source === 'museo') {
    game.playerContainer.position.set(CHURCH.x, CHURCH.y + 6.5, CHURCH.returnZ);
    game.lastSafeGroundY = CHURCH.y;
    window.__CHURCH_RETURN_PROTECTION_UNTIL__ = performance.now() + 5000;
  } else if (source === 'bosque') {
    game.playerContainer.position.set(FOREST.gateX, FOREST.groundY + 2.4, FOREST.returnZ);
    game.lastSafeGroundY = FOREST.groundY;
    forestGateCooldownUntil = Date.now() + 4500;
  } else if (source === 'arcade') {
    // V41: conserva el lugar exacto dentro del salón. Antes se usaba una
    // posición fija fuera del cuarto y por eso parecía que regresaba al inicio.
    let saved = null;
    try { saved = JSON.parse(sessionStorage.getItem('vice-arcade-return') || 'null'); } catch {}
    const x = Number.isFinite(saved?.x) ? saved.x : 930;
    const y = Number.isFinite(saved?.y) ? saved.y : 2.75;
    const z = Number.isFinite(saved?.z) ? saved.z : 1042;
    game.playerContainer.position.set(x, y, z);
    if (Number.isFinite(saved?.rotationY)) game.playerContainer.rotation.y = saved.rotationY;
    game.lastSafeGroundY = 1.65;
    window.__ARCADE_RETURN_LOCK__ = { x, z };
    window.__ARCADE_RETURN_COOLDOWN_UNTIL__ = performance.now() + 8000;
  }

  game.lastSafePlayerPosition?.copy(game.playerContainer.position);
  if (game.state) {
    game.state.vy = 0;
    game.state.onGround = false;
    game.state.inWater = false;
  }
  history.replaceState({}, '', location.pathname);
}

function enforceChurchFloor() {
  if (!game?.playerContainer) return;
  const p = game.playerContainer.position;
  const inside = Math.abs(p.x - CHURCH.x) <= CHURCH.halfWidth && p.z >= CHURCH.zMin && p.z <= CHURCH.zMax;
  if (!inside) return;

  const minimumY = CHURCH.y + 0.08;
  const protectedReturn = performance.now() < (window.__CHURCH_RETURN_PROTECTION_UNTIL__ || 0);
  if (p.y < minimumY || (protectedReturn && p.y < CHURCH.y + 0.35)) {
    p.y = protectedReturn ? CHURCH.y + 0.35 : minimumY;
    if (game.state) {
      game.state.vy = 0;
      game.state.onGround = true;
      game.state.inWater = false;
      game.state.isSubmerged = false;
    }
  }
  game.lastSafeGroundY = CHURCH.y;
  game.lastSafePlayerPosition?.set(p.x, Math.max(p.y, CHURCH.y), p.z);
}

function monitorForestGate() {
  if (!game?.playerContainer || forestTransition || Date.now() < forestGateCooldownUntil) return;
  const p = game.playerContainer.position;
  const nearX = Math.abs(p.x - FOREST.gateX) < 18;
  const nearZ = Math.abs(p.z - FOREST.gateZ) < 12;
  if (nearX && nearZ) enterForestWorld();
}

function initialize() {
  if (initialized) return;
  game = window.__VICE_CITY_GAME__;
  if (!game?.city || !game?.playerContainer || typeof game.getGroundY !== 'function') return;
  initialized = true;
  addChurchFloor();
  removeCollectibles();
  installCitySizedForest();
  installRoadAndCityExpansion();
  handleReturns();
  setInterval(() => { enforceChurchFloor(); monitorForestGate(); }, 160);
}

const waitForGame = setInterval(() => {
  game = window.__VICE_CITY_GAME__ || game;
  initialize();
  if (initialized) clearInterval(waitForGame);
}, 120);
