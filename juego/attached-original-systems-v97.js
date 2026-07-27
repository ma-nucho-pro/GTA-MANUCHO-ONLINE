/**
 * GTA MANUCHO V97 — integración de los HTML entregados por el usuario.
 *
 * Las proporciones y generadores de este archivo proceden de:
 * - "meter balsa y que se pueda manejar en el mar(1).html"
 * - "meter esto de noche ... 12 hasta las 1215(1).html"
 * - "ROCAS(1).html"
 *
 * Solamente se adapta la escala de metros a la escala del mapa principal.
 */
import * as THREE from './bosque/libs/three.module.js';

/* ========================================================================== */
/* BARCA/BALSA ORIGINAL                                                        */
/* ========================================================================== */

export const ATTACHED_BOAT_CONFIG = Object.freeze({
  length: 2.4,
  width: 1.0,
  depth: 0.15,
  bowSharpness: 2.8,
  bowTaper: 0.98,
  bowStart: 0.2,
  sternSharpness: 4.0,
  sternTaper: 0.45,
  hullCurve: 8,
  segmentsX: 100,
  segmentsY: 50,
  hullThickness: 0.025
});

export function createAttachedBoatHullGeometry(config = ATTACHED_BOAT_CONFIG) {
  const {
    length, width, depth, bowSharpness, bowTaper, bowStart,
    sternSharpness, sternTaper, hullCurve, segmentsX, segmentsY, hullThickness
  } = config;
  const outerGeometry = new THREE.PlaneGeometry(length, width, segmentsX, segmentsY);
  const outerPos = outerGeometry.getAttribute('position');
  const outerVertices = [];
  const outerNormals = [];

  for (let i = 0; i < outerPos.count; i++) {
    const x = outerPos.getX(i);
    let y = outerPos.getY(i);
    const normX = x / (length / 2);
    const longTaper = Math.cos(normX * Math.PI / 2);
    let z = -depth * Math.exp(-hullCurve * y * y) * longTaper;
    const dX = 15 * Math.min(Math.abs(x - length / 2), Math.abs(x + length / 2));
    const clampedDX = Math.min(dX, Math.PI);
    const dY = 15 * Math.min(Math.abs(y - width / 2), Math.abs(y + width / 2));
    const clampedDY = Math.min(dY, Math.PI);
    z += 0.06 * Math.max(Math.cos(clampedDX) + 1, Math.cos(clampedDY) + 1);
    if (normX > bowStart) {
      const adjustedNormX = (normX - bowStart) / (1 - bowStart);
      y *= 1 - Math.pow(adjustedNormX, bowSharpness) * bowTaper;
    }
    if (normX < 0) {
      const sternFactor = Math.abs(normX);
      y *= 1 - Math.pow(sternFactor, sternSharpness) * sternTaper;
    }
    outerPos.setXYZ(i, x, y, z);
    outerVertices.push(new THREE.Vector3(x, y, z));
  }

  outerGeometry.computeVertexNormals();
  const normalAttr = outerGeometry.getAttribute('normal');
  for (let i = 0; i < normalAttr.count; i++) {
    outerNormals.push(new THREE.Vector3(
      normalAttr.getX(i), normalAttr.getY(i), normalAttr.getZ(i)
    ));
  }

  const innerVertices = outerVertices.map((vertex, index) =>
    vertex.clone().addScaledVector(outerNormals[index], hullThickness)
  );
  const vertices = [];
  const indices = [];
  for (const vertex of outerVertices) vertices.push(vertex.x, vertex.y, vertex.z);
  for (const vertex of innerVertices) vertices.push(vertex.x, vertex.y, vertex.z);

  const cols = segmentsX + 1;
  for (let row = 0; row < segmentsY; row++) {
    for (let col = 0; col < segmentsX; col++) {
      const a = row * cols + col;
      const b = a + 1;
      const c = (row + 1) * cols + col + 1;
      const d = c - 1;
      indices.push(a, b, c, a, c, d);
    }
  }
  const innerOffset = outerVertices.length;
  for (let row = 0; row < segmentsY; row++) {
    for (let col = 0; col < segmentsX; col++) {
      const a = innerOffset + row * cols + col;
      const b = a + 1;
      const c = innerOffset + (row + 1) * cols + col + 1;
      const d = c - 1;
      indices.push(a, c, b, a, d, c);
    }
  }
  for (let col = 0; col < segmentsX; col++) {
    const oa = col, ob = col + 1, ia = innerOffset + col, ib = ia + 1;
    indices.push(oa, ia, ob, ob, ia, ib);
    const bottom = segmentsY * cols;
    const boa = bottom + col, bob = boa + 1;
    const bia = innerOffset + boa, bib = bia + 1;
    indices.push(boa, bob, bia, bob, bib, bia);
  }
  for (let row = 0; row < segmentsY; row++) {
    const oa = row * cols, ob = (row + 1) * cols;
    const ia = innerOffset + oa, ib = innerOffset + ob;
    indices.push(oa, ob, ia, ob, ib, ia);
    const roa = oa + segmentsX, rob = ob + segmentsX;
    const ria = innerOffset + roa, rib = innerOffset + rob;
    indices.push(roa, ria, rob, rob, ria, rib);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  outerGeometry.dispose();
  return geometry;
}

export function createAttachedTrapezoidBench(frontWidth, backWidth, depth, thickness) {
  const halfFront = frontWidth / 2;
  const halfBack = backWidth / 2;
  const halfDepth = depth / 2;
  const halfThick = thickness / 2;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
    -halfDepth, -halfFront, halfThick, -halfDepth, halfFront, halfThick,
    halfDepth, -halfBack, halfThick, halfDepth, halfBack, halfThick,
    -halfDepth, -halfFront, -halfThick, -halfDepth, halfFront, -halfThick,
    halfDepth, -halfBack, -halfThick, halfDepth, halfBack, -halfThick
  ]), 3));
  geometry.setIndex([
    0,2,1, 1,2,3, 4,5,6, 5,7,6, 0,1,5, 0,5,4,
    2,6,7, 2,7,3, 0,4,6, 0,6,2, 1,3,7, 1,7,5
  ]);
  geometry.computeVertexNormals();
  return geometry;
}

export function createAttachedBoat(color, unitScale = 16) {
  const root = new THREE.Group();
  root.name = 'BALSA_BARCA_DEL_HTML_ADJUNTO_V97';
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.7,
    metalness: 0,
    side: THREE.DoubleSide,
    envMapIntensity: 0.2
  });
  const boat = new THREE.Mesh(createAttachedBoatHullGeometry(), material);
  boat.rotation.x = -Math.PI / 2;
  boat.position.y = 0.05;
  const benchThickness = 0.03;
  const benchDepth = 0.22;
  const frontWidth = ATTACHED_BOAT_CONFIG.width * 0.79;
  const frontBench = new THREE.Mesh(
    createAttachedTrapezoidBench(frontWidth, frontWidth, benchDepth, benchThickness),
    material
  );
  frontBench.position.set(0.2, 0, 0.04);
  const backWidth = ATTACHED_BOAT_CONFIG.width * 0.7;
  const backBench = new THREE.Mesh(
    createAttachedTrapezoidBench(backWidth, backWidth * 1.1, benchDepth, benchThickness),
    material
  );
  backBench.position.set(-0.65, 0, 0.04);
  boat.add(frontBench, backBench);
  root.add(boat);
  root.scale.setScalar(unitScale);
  root.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = false;
    object.receiveShadow = false;
    object.frustumCulled = true;
  });
  return root;
}

/* ========================================================================== */
/* ROCAS: SDF Y PARÁMETROS ORIGINALES DEL HTML                                */
/* ========================================================================== */

const ROCK_CONFIG = Object.freeze({
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
  MAX_SHAPE_SCALE_Z: 1.25
});

class AttachedSeededRNG {
  constructor(seed) { this.seed = seed; }
  next() {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }
  range(min, max) { return min + this.next() * (max - min); }
  vec3Norm(target = new THREE.Vector3()) {
    const theta = this.next() * Math.PI * 2;
    const phi = Math.acos(2 * this.next() - 1);
    return target.set(
      Math.sin(phi) * Math.cos(theta),
      Math.sin(phi) * Math.sin(theta),
      Math.cos(phi)
    );
  }
}

export function createAttachedRockSDF(seed) {
  const rng = new AttachedSeededRNG(seed);
  const numCuts = Math.floor(rng.range(ROCK_CONFIG.MIN_NUM_CUTS, ROCK_CONFIG.MAX_NUM_CUTS));
  const cuts = [];
  for (let i = 0; i < numCuts; i++) {
    const direction = rng.vec3Norm();
    cuts.push({
      dx: direction.x,
      dy: direction.y,
      dz: direction.z,
      radius: rng.range(ROCK_CONFIG.MIN_CUT_RADIUS, ROCK_CONFIG.MAX_CUT_RADIUS),
      ratio: rng.range(ROCK_CONFIG.MIN_CUT_RATIO, ROCK_CONFIG.MAX_CUT_RATIO),
      k: rng.range(ROCK_CONFIG.MIN_CUT_K, ROCK_CONFIG.MAX_CUT_K)
    });
  }
  const scale = new THREE.Vector3(
    rng.range(ROCK_CONFIG.MIN_SHAPE_SCALE_X, ROCK_CONFIG.MAX_SHAPE_SCALE_X),
    rng.range(ROCK_CONFIG.MIN_SHAPE_SCALE_Y, ROCK_CONFIG.MAX_SHAPE_SCALE_Y),
    rng.range(ROCK_CONFIG.MIN_SHAPE_SCALE_Z, ROCK_CONFIG.MAX_SHAPE_SCALE_Z)
  );
  const sdf = (x, y, z) => {
    const px = x / scale.x, py = y / scale.y, pz = z / scale.z;
    let distance = Math.sqrt(px * px + py * py + pz * pz) - 1.05;
    for (const cut of cuts) {
      const spx = px + cut.dx * cut.radius;
      const spy = py + cut.dy * cut.radius;
      const spz = pz + cut.dz * cut.radius;
      const sd = Math.sqrt(spx * spx + spy * spy + spz * spz) -
        cut.radius * cut.ratio;
      const h = Math.max(0, Math.min(1, 0.5 + (0.5 * (-sd - distance)) / cut.k));
      distance = distance * (1 - h) + -sd * h + cut.k * h * (1 - h);
    }
    return Math.min(distance, 0.3);
  };
  return { sdf, scale };
}

/**
 * Conserva el SDF y las 14–22 sustracciones del archivo ROCAS. Se proyecta
 * una malla icosaédrica subdividida hasta el cruce cero del SDF una sola vez
 * por variante; después el juego la reutiliza mediante InstancedMesh.
 */
export function createAttachedRockGeometry(seed, detail = 3) {
  const { sdf } = createAttachedRockSDF(seed);
  const geometry = new THREE.IcosahedronGeometry(1.45, detail);
  const position = geometry.getAttribute('position');
  const direction = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    direction.fromBufferAttribute(position, i).normalize();
    let low = 0.05;
    let high = 1.8;
    for (let iteration = 0; iteration < 14; iteration++) {
      const radius = (low + high) * 0.5;
      const value = sdf(
        direction.x * radius,
        direction.y * radius,
        direction.z * radius
      );
      if (value < 0) low = radius;
      else high = radius;
    }
    const radius = (low + high) * 0.5;
    position.setXYZ(
      i,
      direction.x * radius,
      direction.y * radius,
      direction.z * radius
    );
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/* ========================================================================== */
/* CEMENTERIO ORIGINAL                                                         */
/* ========================================================================== */

const GRAVE_CONFIG = Object.freeze({
  WORLD_RADIUS: 35,
  GROUND_COLOR: 0x1a1815,
  TOMBSTONE_COUNT: 18,
  CROSS_COUNT: 6,
  MOUND_COUNT: 10
});

function randomInCircle(radius) {
  const r = radius * Math.sqrt(Math.random());
  const theta = Math.random() * Math.PI * 2;
  return { x: r * Math.cos(theta), z: r * Math.sin(theta) };
}

export function createAttachedGraveyard(unitScale = 16) {
  const root = new THREE.Group();
  root.name = 'ISLA_CEMENTERIO_DEL_HTML_ADJUNTO_V97';
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x555560, roughness: 0.85, metalness: 0.05
  });
  const oldStoneMat = new THREE.MeshStandardMaterial({
    color: 0x6b6d70, roughness: 0.95, metalness: 0
  });
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x3a2a1a, roughness: 0.9, metalness: 0
  });
  const dirtMat = new THREE.MeshStandardMaterial({
    color: 0x251a12, roughness: 1, metalness: 0
  });
  const groundMat = new THREE.MeshStandardMaterial({
    color: GRAVE_CONFIG.GROUND_COLOR, roughness: 0.95, metalness: 0
  });
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(GRAVE_CONFIG.WORLD_RADIUS, 48),
    groundMat
  );
  ground.rotation.x = -Math.PI / 2;
  root.add(ground);

  function roundedTombstone(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = Math.random() * 0.5 - 0.25;
    const height = 1.25 + Math.random() * 0.35;
    const width = 0.55 + Math.random() * 0.15;
    const depth = 0.18 + Math.random() * 0.05;
    const material = Math.random() > 0.5 ? stoneMat : oldStoneMat;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    slab.position.y = height / 2;
    const topRadius = width / 2;
    const top = new THREE.Mesh(
      new THREE.CylinderGeometry(topRadius, topRadius, depth, 16, 1, false, 0, Math.PI),
      material
    );
    top.rotation.set(Math.PI / 2, Math.PI / 2, 0);
    top.position.y = height;
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.15, 0.12, depth + 0.08),
      material
    );
    base.position.y = 0.06;
    group.add(slab, top, base);
    root.add(group);
  }

  function pointedTombstone(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = Math.random() * 0.4 - 0.2;
    const height = 1.3 + Math.random() * 0.4;
    const width = 0.55 + Math.random() * 0.15;
    const depth = 0.18 + Math.random() * 0.05;
    const material = Math.random() > 0.4 ? stoneMat : oldStoneMat;
    material.side = THREE.DoubleSide;
    const shape = new THREE.Shape();
    const halfWidth = width / 2;
    shape.moveTo(halfWidth, 0);
    shape.lineTo(halfWidth, height * 0.7);
    shape.lineTo(0, height);
    shape.lineTo(-halfWidth, height * 0.7);
    shape.lineTo(-halfWidth, 0);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
    geometry.center();
    const body = new THREE.Mesh(geometry, material);
    body.position.set(0, height / 2, depth / 2);
    body.rotation.y = Math.PI;
    group.add(body);
    root.add(group);
  }

  function celticCross(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = Math.random() * 0.3 - 0.15;
    const height = 2 + Math.random() * 0.3;
    const armWidth = 0.75 + Math.random() * 0.2;
    const thickness = 0.18;
    const beamWidth = 0.18;
    const vertical = new THREE.Mesh(
      new THREE.BoxGeometry(beamWidth, height, thickness), stoneMat
    );
    vertical.position.y = height / 2;
    const horizontal = new THREE.Mesh(
      new THREE.BoxGeometry(armWidth, beamWidth, thickness), stoneMat
    );
    horizontal.position.y = height * 0.72;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(armWidth * 0.38, beamWidth * 0.5, 10, 28), stoneMat
    );
    ring.position.y = height * 0.72;
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35, 0.45), stoneMat);
    base.position.y = 0.175;
    group.add(vertical, horizontal, ring, base);
    root.add(group);
  }

  function woodenCross(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.set(
      (Math.random() - 0.5) * 0.05,
      Math.random() * 0.4 - 0.2,
      (Math.random() - 0.5) * 0.08
    );
    const height = 1.55 + Math.random() * 0.35;
    const armWidth = 0.65 + Math.random() * 0.15;
    const vertical = new THREE.Mesh(new THREE.BoxGeometry(0.12, height, 0.08), woodMat);
    vertical.position.y = height / 2;
    const horizontal = new THREE.Mesh(
      new THREE.BoxGeometry(armWidth, 0.108, 0.064), woodMat
    );
    horizontal.position.y = height * 0.75;
    group.add(vertical, horizontal);
    root.add(group);
  }

  function mound(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = Math.random() * Math.PI * 2;
    const moundMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      dirtMat
    );
    moundMesh.scale.set(2, 0.45, 1.1);
    const crossGroup = new THREE.Group();
    const height = 1.35 + Math.random() * 0.2;
    const arm = 0.85 + Math.random() * 0.1;
    const vertical = new THREE.Mesh(new THREE.BoxGeometry(0.08, height, 0.06), woodMat);
    vertical.position.y = height / 2;
    const horizontal = new THREE.Mesh(new THREE.BoxGeometry(arm, 0.07, 0.05), woodMat);
    horizontal.position.y = height * 0.7;
    crossGroup.position.x = 1.9;
    crossGroup.rotation.set(
      (Math.random() - 0.5) * 0.08,
      Math.PI / 2,
      (Math.random() - 0.5) * 0.12
    );
    crossGroup.add(vertical, horizontal);
    group.add(moundMesh, crossGroup);
    root.add(group);
  }

  const placed = [];
  const valid = (x, z) => placed.every(point => {
    const dx = x - point.x, dz = z - point.z;
    return dx * dx + dz * dz >= 4;
  });
  const find = (radius, exclusion = 0) => {
    for (let i = 0; i < 25; i++) {
      const point = randomInCircle(radius);
      if (Math.abs(point.x) < exclusion && Math.abs(point.z) < exclusion) continue;
      if (!valid(point.x, point.z)) continue;
      placed.push(point);
      return point;
    }
    return null;
  };
  for (let i = 0; i < GRAVE_CONFIG.TOMBSTONE_COUNT; i++) {
    const point = find(GRAVE_CONFIG.WORLD_RADIUS * 0.85, 2.5);
    if (point) (Math.random() > 0.5 ? roundedTombstone : pointedTombstone)(point.x, point.z);
  }
  for (let i = 0; i < GRAVE_CONFIG.CROSS_COUNT; i++) {
    const point = find(GRAVE_CONFIG.WORLD_RADIUS * 0.8, 3);
    if (point) (Math.random() > 0.4 ? celticCross : woodenCross)(point.x, point.z);
  }
  for (let i = 0; i < GRAVE_CONFIG.MOUND_COUNT; i++) {
    const point = find(GRAVE_CONFIG.WORLD_RADIUS * 0.75);
    if (point) mound(point.x, point.z);
  }

  root.scale.setScalar(unitScale);
  root.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = false;
    object.receiveShadow = false;
    object.frustumCulled = true;
  });
  root.userData.radius = GRAVE_CONFIG.WORLD_RADIUS * unitScale;
  return root;
}
