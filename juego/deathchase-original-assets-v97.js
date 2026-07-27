/**
 * Integración fiel de los recursos entregados por el usuario.
 *
 * Modelos y configuración procedentes de:
 * "MOTO + ARBOLES + NPC + DISPARAR (1).html"
 *   - motorcycle_compressed.glb
 *   - rider_compressed.glb
 *   - arms_compressed.glb
 *
 * Generador procedente de:
 * "meter solo arboles reemplazar los arboles actuales... (1).html"
 *
 * No se crean sustitutos geométricos para las motos, los conductores ni los
 * árboles. Los límites de cantidad se aplican únicamente para mantener fluidez.
 */
import * as THREE from './bosque/libs/three.module.js';
import { GLTFLoader } from './bosque/bike-runtime/loaders/GLTFLoader.js';
import { DRACOLoader } from './bosque/bike-runtime/loaders/DRACOLoader.js';
import { KTX2Loader } from './bosque/bike-runtime/loaders/KTX2Loader.js';
import { clone as cloneSkeleton } from './bosque/bike-runtime/utils/SkeletonUtils.js';

const BIKE_MODEL = './deathchase-assets/models/motorcycle_compressed.glb';
const RIDER_MODEL = './deathchase-assets/models/rider_compressed.glb';
const ARMS_MODEL = './deathchase-assets/models/arms_compressed.glb';

const MODEL_CONFIG = Object.freeze({
  PLAYER_MODEL: {
    SCALE: 1,
    Y_OFFSET: -0.03,
    HEADING_CORRECTION: -Math.PI,
    BODY_COLOR: 0xc83232
  },
  ENEMY_MODEL: {
    SCALE: 1,
    Y_OFFSET: -0.031,
    HEADING_CORRECTION: -Math.PI
  },
  ARMS: {
    POS: { x: 0, y: -0.149, z: -0.43 },
    ROT: { x: 0.55, y: -Math.PI, z: 0 },
    SCALE: 0.65
  },
  RIDER: {
    POS: { x: 0, y: 0.25, z: -0.05 },
    ROT: { x: 0, y: -Math.PI, z: 0 },
    SCALE: 1
  }
});

let assetPromise = null;

function prepareRenderable(root, alwaysVisible = false) {
  root.traverse(node => {
    if (!node.isMesh) return;
    node.castShadow = false;
    node.receiveShadow = false;
    node.frustumCulled = !alwaysVisible;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of materials) {
      if (!material) continue;
      material.side = THREE.FrontSide;
      material.depthWrite = true;
    }
  });
  return root;
}

function centerBikeSubtree(subtree) {
  // Es el mismo tratamiento del HTML original: se ignora el motorista
  // incluido en algunas versiones del modelo antes de calcular el AABB.
  subtree.traverse(node => {
    if (node.isMesh && node.name?.includes('Jack')) node.visible = false;
  });
  subtree.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(subtree);
  if (box.isEmpty()) return new THREE.Vector3(1, 1, 2);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);
  subtree.position.x -= center.x;
  subtree.position.y -= box.min.y;
  subtree.position.z -= center.z;
  subtree.updateMatrixWorld(true);
  return size;
}

function cloneMaterials(root) {
  root.traverse(node => {
    if (!node.isMesh || !node.material) return;
    node.material = Array.isArray(node.material)
      ? node.material.map(material => material?.clone?.() || material)
      : node.material.clone();
  });
}

function recolorBikeBody(root, index, playerBike) {
  const enemyHues = [0.58, 0.09, 0.76, 0.47, 0.14];
  const color = new THREE.Color();
  if (playerBike) color.setHex(MODEL_CONFIG.PLAYER_MODEL.BODY_COLOR);
  else color.setHSL(enemyHues[index % enemyHues.length], 0.82, 0.56);
  root.traverse(node => {
    if (!node.isMesh || !node.material) return;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of materials) {
      if (material?.name === 'Mat_Body' && material.color) {
        material.color.copy(color);
        material.needsUpdate = true;
      }
    }
  });
}

function attachCosmetic(root, config, parent, alwaysVisible) {
  root.position.set(config.POS.x, config.POS.y, config.POS.z);
  root.rotation.set(config.ROT.x, config.ROT.y, config.ROT.z);
  root.scale.setScalar(config.SCALE);
  prepareRenderable(root, alwaysVisible);
  parent.add(root);
}

export function loadDeathchaseAssets(renderer) {
  if (assetPromise) return assetPromise;
  const dracoLoader = new DRACOLoader().setDecoderPath(
    './bosque/bike-runtime/libs/draco/'
  );
  const ktx2Loader = new KTX2Loader().setTranscoderPath(
    './bosque/bike-runtime/libs/basis/'
  );
  ktx2Loader.detectSupport(renderer);
  const loader = new GLTFLoader()
    .setDRACOLoader(dracoLoader)
    .setKTX2Loader(ktx2Loader);

  assetPromise = Promise.all([
    loader.loadAsync(BIKE_MODEL),
    loader.loadAsync(RIDER_MODEL),
    loader.loadAsync(ARMS_MODEL)
  ]).then(([bike, rider, arms]) => ({
    bike: bike.scene,
    rider: rider.scene,
    arms: arms.scene
  })).catch(error => {
    assetPromise = null;
    throw error;
  });
  return assetPromise;
}

export function createOriginalMotorcycle(assets, index, options = {}) {
  const playerBike = Boolean(options.playerBike);
  const root = new THREE.Group();
  root.name = `MOTO_ORIGINAL_DEATHCHASE_${index + 1}`;

  const visual = new THREE.Group();
  visual.name = 'MODELO_ORIGINAL_MOTO_NPC_BRAZOS';
  root.add(visual);

  const bikeHolder = new THREE.Group();
  const bike = cloneSkeleton(assets.bike);
  cloneMaterials(bike);
  const sourceSize = centerBikeSubtree(bike);
  const bikeConfig = playerBike
    ? MODEL_CONFIG.PLAYER_MODEL
    : MODEL_CONFIG.ENEMY_MODEL;
  bikeHolder.add(bike);
  bikeHolder.scale.setScalar(bikeConfig.SCALE);
  bikeHolder.position.y = bikeConfig.Y_OFFSET;
  bikeHolder.rotation.y = bikeConfig.HEADING_CORRECTION;
  prepareRenderable(bike);
  recolorBikeBody(bike, index, playerBike);
  visual.add(bikeHolder);

  const rider = cloneSkeleton(assets.rider);
  cloneMaterials(rider);
  attachCosmetic(rider, MODEL_CONFIG.RIDER, visual, false);

  const arms = cloneSkeleton(assets.arms);
  cloneMaterials(arms);
  attachCosmetic(arms, MODEL_CONFIG.ARMS, visual, true);
  arms.visible = false;

  // El modelo está creado en metros. Solo se convierte uniformemente a la
  // escala del mapa; no se alteran su forma, materiales ni proporciones.
  const sourceLength = Math.max(0.01, sourceSize.x, sourceSize.z);
  // 48 unidades equivalen a tres metros del mapa. La versión anterior
  // forzaba 76 y hacía que la moto quedara más grande que el jugador.
  const targetWorldLength = 48;
  const worldScale = targetWorldLength / sourceLength;
  visual.scale.setScalar(worldScale);
  visual.updateMatrixWorld(true);

  root.userData.deathchaseSource = {
    bike: BIKE_MODEL,
    rider: RIDER_MODEL,
    arms: ARMS_MODEL
  };
  return {
    root,
    rider,
    arms,
    wheels: [],
    dimensions: {
      length: sourceLength * worldScale,
      width: Math.max(15, Math.min(sourceSize.x, sourceSize.z) * worldScale),
      height: Math.max(24, sourceSize.y * worldScale)
    }
  };
}

/* ========================================================================== */
/* ÁRBOLES: clase y parámetros del HTML entregado por el usuario              */
/* ========================================================================== */

const FOREST_CONFIG = Object.freeze({
  CLEAR_RADIUS: 5,
  TRUNK_LENGTH_MIN: 4,
  TRUNK_LENGTH_MAX: 7,
  TRUNK_RADIUS_MIN: 0.18,
  TRUNK_RADIUS_MAX: 0.35,
  BRANCH_ANGLE_VARIANCE: 0.25,
  TWIST: 0.5,
  LEAF_SIZE: 0.8,
  LEAF_DENSITY: 4,
  LEAF_SPREAD: 0.8,
  BARK_COLOR: [0.24, 0.16, 0.09],
  LEAF_HUE_MIN: 0.25,
  LEAF_HUE_MAX: 0.35,
  LEAF_SATURATION: 0.55,
  LEAF_LIGHTNESS_MIN: 0.35,
  LEAF_LIGHTNESS_MAX: 0.5,
  LEAF_TINGE_PERCENT: 0.15,
  LEAF_TINGE_YELLOW_CHANCE: 0.5,
  LEAF_TINGE_HUE_SHIFT: 0.03,
  LEAF_TINGE_SAT_SHIFT: 0.28,
  LEAF_TINGE_LIGHT_SHIFT: 0.09,
  BARK_SEGMENTS: 8
});

function createLeafTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);

  const leafPath = () => {
    ctx.beginPath();
    ctx.moveTo(size * 0.5, size * 0.03);
    ctx.bezierCurveTo(size * 0.78, size * 0.18, size * 0.82, size * 0.65, size * 0.5, size * 0.97);
    ctx.bezierCurveTo(size * 0.18, size * 0.65, size * 0.22, size * 0.18, size * 0.5, size * 0.03);
  };
  const gradient = ctx.createLinearGradient(0, 0, 0, size);
  gradient.addColorStop(0, '#6ab560');
  gradient.addColorStop(0.3, '#5aa052');
  gradient.addColorStop(0.7, '#4a9045');
  gradient.addColorStop(1, '#3d8038');
  leafPath();
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.globalCompositeOperation = 'overlay';
  for (let i = 0; i < 600; i++) {
    const brightness = Math.random() * 40 - 20;
    ctx.fillStyle = `rgba(${128 + brightness},${128 + brightness},${128 + brightness},0.04)`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 3, 3);
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.save();
  leafPath();
  ctx.clip();
  ctx.strokeStyle = 'rgba(35,60,30,0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(size * 0.5, size * 0.08);
  ctx.quadraticCurveTo(size * 0.5, size * 0.5, size * 0.5, size * 0.92);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(40,65,35,0.1)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const y = size * (0.2 + i * 0.11);
    const spread = size * (0.18 + i * 0.02);
    ctx.beginPath();
    ctx.moveTo(size * 0.5, y);
    ctx.quadraticCurveTo(size * 0.5 - spread * 0.5, y + size * 0.04, size * 0.5 - spread, y + size * 0.06);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(size * 0.5, y);
    ctx.quadraticCurveTo(size * 0.5 + spread * 0.5, y + size * 0.04, size * 0.5 + spread, y + size * 0.06);
    ctx.stroke();
  }
  ctx.restore();
  ctx.globalCompositeOperation = 'source-atop';
  const edge = ctx.createRadialGradient(size / 2, size / 2, size * 0.15, size / 2, size / 2, size * 0.5);
  edge.addColorStop(0, 'rgba(0,0,0,0)');
  edge.addColorStop(0.7, 'rgba(0,0,0,0)');
  edge.addColorStop(1, 'rgba(0,0,0,0.08)');
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

function createBarkTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#4a3520';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 40; i++) {
    const lightness = Math.random() > 0.5 ? 25 : -25;
    ctx.fillStyle = `rgba(${100 + lightness},${60 + lightness},${30 + lightness},0.4)`;
    ctx.fillRect(Math.random() * size, 0, 1 + Math.random() * 4, size);
  }
  for (let i = 0; i < 20; i++) {
    const y = Math.random() * size;
    ctx.strokeStyle = `rgba(0,0,0,${0.15 + Math.random() * 0.25})`;
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < size; x += 8) ctx.lineTo(x, y + (Math.random() - 0.5) * 6);
    ctx.stroke();
  }
  for (let i = 0; i < 15; i++) {
    ctx.fillStyle = `rgba(160,120,80,${0.1 + Math.random() * 0.15})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 5 + Math.random() * 15, 20 + Math.random() * 40);
  }
  for (let i = 0; i < 800; i++) {
    const b = Math.random() > 0.5 ? 35 : -35;
    ctx.fillStyle = `rgba(${100 + b},${65 + b},${35 + b},0.15)`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
  }
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, 3 + Math.random() * 8, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(20,10,5,${0.3 + Math.random() * 0.3})`;
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

export class InstancedForest {
  constructor(options = {}) {
    this.treeCount = options.treeCount ?? 48;
    this.forestRadius = options.forestRadius ?? 210;
    this.unitScale = options.unitScale ?? 16;
    this.centerX = options.centerX ?? 0;
    this.centerZ = options.centerZ ?? 0;
    this.baseY = options.baseY ?? 0;
    this.branchMatrices = [];
    this.leafMatrices = [];
    this.leafColors = [];
    this.treeLocations = [];
    this.group = new THREE.Group();
    this.group.name = 'BOSQUE_INSTANCIADO_ORIGINAL_HTML';
    this._matrix = new THREE.Matrix4();
    this._quaternion = new THREE.Quaternion();
    this._scale = new THREE.Vector3();
    this._up = new THREE.Vector3(0, 1, 0);
    this._color = new THREE.Color();
    this._leafBottomY = -0.5;
  }

  _mulberry32(seed) {
    return () => {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  generate() {
    const treeTypes = [
      { levels: 4, branchAngle: 0.5, lengthFalloff: 0.7, radiusFalloff: 0.55, branches: 3 },
      { levels: 5, branchAngle: 0.4, lengthFalloff: 0.65, radiusFalloff: 0.5, branches: 2 },
      { levels: 4, branchAngle: 0.65, lengthFalloff: 0.72, radiusFalloff: 0.6, branches: 4 },
      { levels: 3, branchAngle: 0.55, lengthFalloff: 0.75, radiusFalloff: 0.58, branches: 3 },
      { levels: 4, branchAngle: 0.48, lengthFalloff: 0.68, radiusFalloff: 0.52, branches: 3 }
    ];

    for (let i = 0; i < this.treeCount; i++) {
      const rand = this._mulberry32(i * 54321 + 11111);
      const r = (FOREST_CONFIG.CLEAR_RADIUS + Math.sqrt(rand()) * this.forestRadius) * this.unitScale;
      const theta = rand() * Math.PI * 2;
      const treeX = this.centerX + Math.cos(theta) * r;
      const treeZ = this.centerZ + Math.sin(theta) * r;
      const treeRotation = rand() * Math.PI * 2;
      const treeType = treeTypes[Math.floor(rand() * treeTypes.length)];
      const treeScale = 0.6 + rand() * 0.8;
      const leafHue = FOREST_CONFIG.LEAF_HUE_MIN +
        rand() * (FOREST_CONFIG.LEAF_HUE_MAX - FOREST_CONFIG.LEAF_HUE_MIN);
      const leafLightness = FOREST_CONFIG.LEAF_LIGHTNESS_MIN +
        rand() * (FOREST_CONFIG.LEAF_LIGHTNESS_MAX - FOREST_CONFIG.LEAF_LIGHTNESS_MIN);
      const trunkLength = (FOREST_CONFIG.TRUNK_LENGTH_MIN +
        rand() * (FOREST_CONFIG.TRUNK_LENGTH_MAX - FOREST_CONFIG.TRUNK_LENGTH_MIN)) *
        treeScale * this.unitScale;
      const trunkRadius = (FOREST_CONFIG.TRUNK_RADIUS_MIN +
        rand() * (FOREST_CONFIG.TRUNK_RADIUS_MAX - FOREST_CONFIG.TRUNK_RADIUS_MIN)) *
        treeScale * this.unitScale;
      this.treeLocations.push({
        x: treeX,
        z: treeZ,
        radius: Math.max(12, trunkRadius * 2.25)
      });
      this._generateTree(
        new THREE.Vector3(treeX, this.baseY, treeZ),
        treeRotation,
        treeScale,
        leafHue,
        leafLightness,
        trunkLength,
        trunkRadius,
        treeType,
        rand
      );
    }
    this._buildMeshes(createLeafTexture(), createBarkTexture());
    return {
      group: this.group,
      treeLocations: this.treeLocations,
      stats: {
        trees: this.treeCount,
        branches: this.branchMatrices.length,
        leaves: this.leafMatrices.length
      }
    };
  }

  _generateTree(origin, rotation, treeScale, leafHue, leafLightness, trunkLength, trunkRadius, treeType, rand) {
    const direction = new THREE.Vector3(
      (rand() - 0.5) * 0.12,
      1,
      (rand() - 0.5) * 0.12
    ).normalize();
    this._branch(
      origin,
      direction,
      trunkLength,
      trunkRadius,
      0,
      rotation,
      treeScale,
      leafHue,
      leafLightness,
      treeType,
      rand
    );
  }

  _branch(start, direction, length, radius, level, treeRotation, treeScale, leafHue, leafLightness, treeType, rand) {
    if (level > treeType.levels || radius < 0.012 * this.unitScale) return;
    const end = start.clone().addScaledVector(direction, length);
    const mid = start.clone().lerp(end, 0.5);
    this._quaternion.setFromUnitVectors(this._up, direction.clone().normalize());
    const topRadius = radius * treeType.radiusFalloff;
    const averageRadius = (radius + topRadius) * 0.5;
    this._scale.set(averageRadius, length, averageRadius);
    this._matrix.compose(mid, this._quaternion, this._scale);
    this.branchMatrices.push(this._matrix.clone());

    if (level >= treeType.levels - 1) {
      this._addLeaves(
        end,
        direction,
        treeScale,
        leafHue,
        leafLightness,
        rand,
        topRadius,
        level,
        treeType.levels
      );
    }

    if (level >= treeType.levels) return;
    const numChildren = level === 0
      ? treeType.branches + Math.floor(rand() * 2)
      : Math.max(1, treeType.branches - Math.floor(level * 0.3));
    for (let i = 0; i < numChildren; i++) {
      const twistAngle = (i / numChildren) * Math.PI * 2 +
        rand() * FOREST_CONFIG.TWIST + treeRotation;
      const bendAngle = treeType.branchAngle +
        (rand() - 0.5) * FOREST_CONFIG.BRANCH_ANGLE_VARIANCE * 2;
      const perpendicular = new THREE.Vector3(1, 0, 0);
      if (Math.abs(direction.y) < 0.9) perpendicular.crossVectors(this._up, direction).normalize();
      else perpendicular.crossVectors(new THREE.Vector3(0, 0, 1), direction).normalize();
      const childDirection = direction.clone();
      childDirection.applyAxisAngle(perpendicular, bendAngle);
      childDirection.applyAxisAngle(direction, twistAngle);
      childDirection.normalize();
      const childStart = start.clone().lerp(end, 0.4 + rand() * 0.5);
      const childLength = length * treeType.lengthFalloff * (0.8 + rand() * 0.4);
      const childRadius = radius * treeType.radiusFalloff;
      this._branch(
        childStart,
        childDirection,
        childLength,
        childRadius,
        level + 1,
        treeRotation,
        treeScale,
        leafHue,
        leafLightness,
        treeType,
        rand
      );
    }
  }

  _addLeaves(branchEnd, branchDirection, treeScale, leafHue, leafLightness, rand, topRadius, level, maxLevel) {
    const count = FOREST_CONFIG.LEAF_DENSITY + Math.floor(rand() * 3);
    const size = FOREST_CONFIG.LEAF_SIZE * treeScale * this.unitScale;
    const perpendicular1 = new THREE.Vector3(1, 0, 0);
    if (Math.abs(branchDirection.y) > 0.9) perpendicular1.set(0, 0, 1);
    perpendicular1.crossVectors(branchDirection, perpendicular1).normalize();
    const perpendicular2 = new THREE.Vector3()
      .crossVectors(branchDirection, perpendicular1)
      .normalize();

    for (let i = 0; i < count; i++) {
      const aroundAngle = rand() * Math.PI * 2;
      const outward = new THREE.Vector3()
        .addScaledVector(perpendicular1, Math.cos(aroundAngle))
        .addScaledVector(perpendicular2, Math.sin(aroundAngle))
        .normalize();
      const attachPoint = branchEnd.clone().addScaledVector(outward, topRadius);
      const stemDirection = new THREE.Vector3()
        .addScaledVector(outward, 0.5 + rand() * 0.3)
        .addScaledVector(branchDirection, 0.3 + rand() * 0.4)
        .add(new THREE.Vector3(0, 0.2 + rand() * 0.3, 0))
        .normalize();
      const leafUp = stemDirection.clone();
      const leafNormal = new THREE.Vector3(0, 1, 0)
        .addScaledVector(outward, (rand() - 0.5) * 0.5);
      leafNormal.sub(leafUp.clone().multiplyScalar(leafNormal.dot(leafUp))).normalize();
      if (leafNormal.lengthSq() < 0.1) {
        leafNormal.copy(outward);
        leafNormal.sub(leafUp.clone().multiplyScalar(leafNormal.dot(leafUp))).normalize();
      }
      const leafRight = new THREE.Vector3().crossVectors(leafUp, leafNormal).normalize();
      leafNormal.crossVectors(leafRight, leafUp).normalize();
      const rotationMatrix = new THREE.Matrix4().makeBasis(leafRight, leafUp, leafNormal);
      const jitter = new THREE.Quaternion().setFromEuler(new THREE.Euler(
        (rand() - 0.5) * 0.3,
        (rand() - 0.5) * 0.3,
        (rand() - 0.5) * 0.2
      ));
      const leafQuaternion = new THREE.Quaternion()
        .setFromRotationMatrix(rotationMatrix)
        .multiply(jitter);
      const taper = 0.8 + 0.2 * (1 - level / maxLevel);
      const leafScale = size * (0.5 + rand() * 0.5) * taper;
      const rotatedBottom = new THREE.Vector3(0, this._leafBottomY, 0)
        .applyQuaternion(leafQuaternion);
      const leafPosition = attachPoint.clone()
        .sub(rotatedBottom.multiplyScalar(leafScale));
      this._scale.setScalar(leafScale);
      this._matrix.compose(leafPosition, leafQuaternion, this._scale);
      this.leafMatrices.push(this._matrix.clone());

      let hue = leafHue + (rand() - 0.5) * 0.05;
      let saturation = FOREST_CONFIG.LEAF_SATURATION + rand() * 0.15;
      let lightness = leafLightness + (rand() - 0.5) * 0.08;
      if (rand() < FOREST_CONFIG.LEAF_TINGE_PERCENT) {
        if (rand() < FOREST_CONFIG.LEAF_TINGE_YELLOW_CHANCE) {
          hue += FOREST_CONFIG.LEAF_TINGE_HUE_SHIFT;
          lightness = Math.min(1, lightness + FOREST_CONFIG.LEAF_TINGE_LIGHT_SHIFT);
        } else {
          saturation = Math.max(0, saturation - FOREST_CONFIG.LEAF_TINGE_SAT_SHIFT);
          lightness = Math.max(0, lightness - FOREST_CONFIG.LEAF_TINGE_LIGHT_SHIFT);
        }
      }
      this.leafColors.push(this._color.setHSL(hue, saturation, lightness).clone());
    }
  }

  _buildMeshes(leafTexture, barkTexture) {
    const barkGeometry = new THREE.CylinderGeometry(
      1,
      1,
      1,
      FOREST_CONFIG.BARK_SEGMENTS,
      1
    );
    const barkMaterial = new THREE.MeshLambertMaterial({
      map: barkTexture,
      color: new THREE.Color(...FOREST_CONFIG.BARK_COLOR)
    });
    const barkMesh = new THREE.InstancedMesh(
      barkGeometry,
      barkMaterial,
      this.branchMatrices.length
    );
    for (let i = 0; i < this.branchMatrices.length; i++) {
      barkMesh.setMatrixAt(i, this.branchMatrices[i]);
    }
    barkMesh.instanceMatrix.needsUpdate = true;
    barkMesh.castShadow = false;
    barkMesh.receiveShadow = false;
    barkMesh.frustumCulled = true;

    const leafGeometry = new THREE.PlaneGeometry(1, 1);
    const leafMaterial = new THREE.MeshLambertMaterial({
      map: leafTexture,
      alphaTest: 0.5,
      transparent: false,
      side: THREE.DoubleSide,
      vertexColors: true
    });
    const leafMesh = new THREE.InstancedMesh(
      leafGeometry,
      leafMaterial,
      this.leafMatrices.length
    );
    for (let i = 0; i < this.leafMatrices.length; i++) {
      leafMesh.setMatrixAt(i, this.leafMatrices[i]);
      leafMesh.setColorAt(i, this.leafColors[i]);
    }
    leafMesh.instanceMatrix.needsUpdate = true;
    if (leafMesh.instanceColor) leafMesh.instanceColor.needsUpdate = true;
    leafMesh.castShadow = false;
    leafMesh.receiveShadow = false;
    leafMesh.frustumCulled = true;
    this.group.add(barkMesh, leafMesh);
  }
}

export function buildOriginalForest(options) {
  return new InstancedForest(options).generate();
}
