import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const boot = document.getElementById('boot');
const bootText = boot?.querySelector('span');
const modeEl = document.getElementById('mode');
const statusEl = document.getElementById('status');
const crosshair = document.getElementById('crosshair');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(64, innerWidth / innerHeight, 0.03, 180);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xcfe7ff, 0x30291f, 2.2));
const sun = new THREE.DirectionalLight(0xfff2d8, 3.4);
sun.position.set(-5, 9, 4);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -18;
sun.shadow.camera.right = 18;
sun.shadow.camera.top = 18;
sun.shadow.camera.bottom = -18;
scene.add(sun);

function createPanorama() {
  const textures = Array.from({ length: 6 }, () => new THREE.Texture());
  new THREE.ImageLoader().load(
    './examples/textures/cube/sun_temple_stripe.jpg',
    image => {
      const tile = image.height;
      textures.forEach((texture, i) => {
        const canvas = document.createElement('canvas');
        canvas.width = tile;
        canvas.height = tile;
        canvas.getContext('2d').drawImage(image, tile * i, 0, tile, tile, 0, 0, tile, tile);
        texture.image = canvas;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
      });
    },
    undefined,
    () => { statusEl.textContent = 'El panorama no cargó, pero el Soldier sigue disponible'; }
  );

  const materials = textures.map(map => new THREE.MeshBasicMaterial({ map, side: THREE.BackSide, fog: false }));
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(120, 120, 120), materials));
}
createPanorama();

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(24, 96),
  new THREE.MeshStandardMaterial({ color: 0x6f6658, roughness: 0.92, transparent: true, opacity: 0.76 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const ring = new THREE.Mesh(
  new THREE.RingGeometry(23.5, 24, 96),
  new THREE.MeshBasicMaterial({ color: 0xc9ad79, side: THREE.DoubleSide })
);
ring.rotation.x = -Math.PI / 2;
ring.position.y = 0.012;
scene.add(ring);


// ============================================================
// GALERÍA THREE.JS INTEGRADA EN EL ESCENARIO
// Cuadros, escultura, video y paneles de Texture2DArray.
// ============================================================

const galleryUpdaters = [];
const galleryObstacles = [];
let galleryTime = 0;

function registerObstacle(x, z, width, depth, padding = 0) {
  galleryObstacles.push({
    minX: x - width / 2 - padding,
    maxX: x + width / 2 + padding,
    minZ: z - depth / 2 - padding,
    maxZ: z + depth / 2 + padding
  });
}

function isGalleryBlocked(x, z, radius = 0.44) {
  return galleryObstacles.some(obstacle =>
    x + radius > obstacle.minX &&
    x - radius < obstacle.maxX &&
    z + radius > obstacle.minZ &&
    z - radius < obstacle.maxZ
  );
}

function makeCanvasTexture(canvas, srgb = true) {
  const texture = new THREE.CanvasTexture(canvas);
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.needsUpdate = true;
  return texture;
}

function createPlaqueTexture(title, subtitle = '') {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 220;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, '#071522');
  gradient.addColorStop(0.5, '#102a3d');
  gradient.addColorStop(1, '#071522');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#78e7ff';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ecfbff';
  ctx.font = '700 58px Arial';
  ctx.fillText(title, canvas.width / 2, 83);

  if (subtitle) {
    ctx.fillStyle = '#9fd9e7';
    ctx.font = '32px Arial';
    ctx.fillText(subtitle, canvas.width / 2, 158);
  }

  return makeCanvasTexture(canvas);
}

function createWall(x, y, z, width, height, depth, color = 0xddd8cd) {
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.82,
      metalness: 0.02
    })
  );
  wall.position.set(x, y, z);
  wall.receiveShadow = true;
  wall.castShadow = true;
  scene.add(wall);
  registerObstacle(x, z, width, depth, 0.12);
  return wall;
}

function createFramedPanel({
  material,
  width,
  height,
  position,
  rotationY = 0,
  title,
  subtitle = '',
  frameColor = 0x2a1b11,
  plaqueWidth = null
}) {
  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = rotationY;

  const backing = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.32, height + 0.32, 0.13),
    new THREE.MeshStandardMaterial({ color: 0x111318, roughness: 0.66, metalness: 0.18 })
  );
  backing.position.z = -0.05;
  backing.castShadow = true;
  group.add(backing);

  const picture = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  picture.position.z = 0.03;
  group.add(picture);

  const borderMaterial = new THREE.MeshStandardMaterial({
    color: frameColor,
    roughness: 0.4,
    metalness: 0.45
  });
  const thickness = 0.16;
  const depth = 0.19;

  const top = new THREE.Mesh(new THREE.BoxGeometry(width + 0.42, thickness, depth), borderMaterial);
  top.position.set(0, height / 2 + thickness / 2, 0.06);
  const bottom = top.clone();
  bottom.position.y = -height / 2 - thickness / 2;

  const side = new THREE.Mesh(new THREE.BoxGeometry(thickness, height + 0.42, depth), borderMaterial);
  side.position.set(-width / 2 - thickness / 2, 0, 0.06);
  const side2 = side.clone();
  side2.position.x = width / 2 + thickness / 2;

  [top, bottom, side, side2].forEach(part => {
    part.castShadow = true;
    group.add(part);
  });

  const plaqueW = plaqueWidth || Math.min(width + 0.1, 5.8);
  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(plaqueW, plaqueW * 0.215),
    new THREE.MeshBasicMaterial({
      map: createPlaqueTexture(title, subtitle),
      transparent: false,
      toneMapped: false
    })
  );
  plaque.position.set(0, -height / 2 - 0.62, 0.12);
  group.add(plaque);

  scene.add(group);
  return group;
}

function createDisplayLight(x, y, z, color, intensity = 16, distance = 9) {
  const light = new THREE.PointLight(color, intensity, distance, 2);
  light.position.set(x, y, z);
  scene.add(light);
  return light;
}

// Tres paredes de galería abiertas hacia el centro.
createWall(0, 3.55, -18.55, 34, 7.1, 0.48);
createWall(-18.55, 3.55, -6.0, 0.48, 7.1, 25.6);
createWall(18.55, 3.55, -6.0, 0.48, 7.1, 25.6);

const galleryCeilingTrimMaterial = new THREE.MeshStandardMaterial({
  color: 0x3c3228,
  roughness: 0.4,
  metalness: 0.35
});
[
  [0, 7.02, -18.19, 34, 0.18, 0.22],
  [-18.19, 7.02, -6, 0.22, 0.18, 25.6],
  [18.19, 7.02, -6, 0.22, 0.18, 25.6]
].forEach(([x, y, z, w, h, d]) => {
  const trim = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), galleryCeilingTrimMaterial);
  trim.position.set(x, y, z);
  scene.add(trim);
});

// ---- CUADRO EXR: la imagen Memorial del ejemplo oficial ----
const memorialTexture = new THREE.TextureLoader().load('./assets/gallery/memorial.png');
memorialTexture.colorSpace = THREE.SRGBColorSpace;
memorialTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

createFramedPanel({
  material: new THREE.MeshStandardMaterial({
    map: memorialTexture,
    roughness: 0.54,
    metalness: 0.02,
    emissive: 0x1d0d02,
    emissiveIntensity: 0.13
  }),
  width: 3.25,
  height: 4.88,
  position: new THREE.Vector3(-13.1, 3.65, -18.26),
  title: 'MEMORIAL · EXR',
  subtitle: 'Cuadro HDR del ejemplo Three.js',
  frameColor: 0x8a5b22,
  plaqueWidth: 3.9
});
createDisplayLight(-13.1, 5.8, -15.9, 0xffa63c, 11, 7.5);

// ---- CUADRO CARAVAGGIO: filtros mipmap visibles a distancia ----
const caravaggioTexture = new THREE.TextureLoader().load('./assets/gallery/caravaggio.jpg');
caravaggioTexture.colorSpace = THREE.SRGBColorSpace;
caravaggioTexture.minFilter = THREE.LinearMipmapLinearFilter;
caravaggioTexture.magFilter = THREE.LinearFilter;
caravaggioTexture.generateMipmaps = true;
caravaggioTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

createFramedPanel({
  material: new THREE.MeshStandardMaterial({
    map: caravaggioTexture,
    roughness: 0.72,
    metalness: 0.01
  }),
  width: 5.35,
  height: 4.24,
  position: new THREE.Vector3(-7.6, 3.7, -18.26),
  title: 'CARAVAGGIO · MIPMAP',
  subtitle: 'Canestra di frutta',
  frameColor: 0x7b4c18,
  plaqueWidth: 5.3
});
createDisplayLight(-7.6, 5.9, -15.7, 0xffd49c, 10, 8);

// ---- VIDEO TEXTURE: panel HTMLVideoElement + THREE.VideoTexture ----
const galleryVideo = document.createElement('video');
galleryVideo.src = './assets/gallery/gallery_video.mp4';
galleryVideo.loop = true;
galleryVideo.muted = true;
galleryVideo.autoplay = true;
galleryVideo.playsInline = true;
galleryVideo.preload = 'auto';
galleryVideo.setAttribute('webkit-playsinline', '');
galleryVideo.play().catch(() => {});

const videoTexture = new THREE.VideoTexture(galleryVideo);
videoTexture.colorSpace = THREE.SRGBColorSpace;
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.magFilter = THREE.LinearFilter;
videoTexture.generateMipmaps = false;

createFramedPanel({
  material: new THREE.MeshBasicMaterial({
    map: videoTexture,
    toneMapped: false
  }),
  width: 6.2,
  height: 3.49,
  position: new THREE.Vector3(0.0, 3.55, -18.25),
  title: 'VIDEO TEXTURE',
  subtitle: 'Panel animado reproducido dentro del mundo',
  frameColor: 0x183e51,
  plaqueWidth: 5.8
});
createDisplayLight(0, 5.6, -15.9, 0x56dfff, 12, 8.5);

const ensureGalleryVideo = () => galleryVideo.play().catch(() => {});
addEventListener('pointerdown', ensureGalleryVideo, { passive: true });
addEventListener('keydown', ensureGalleryVideo);

// ---- ESCULTURA ESTILIZADA DE NEFERTITI CON NORMAL MAP OBJECT SPACE ----
function createObjectSpaceNormalTexture(size = 128) {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / (size - 1);
      const v = y / (size - 1);
      const nx = Math.sin(u * Math.PI * 8) * 0.19;
      const ny = Math.cos(v * Math.PI * 10) * 0.18;
      const nz = Math.sqrt(Math.max(0.02, 1 - nx * nx - ny * ny));
      const index = (y * size + x) * 4;
      data[index] = Math.round((nx * 0.5 + 0.5) * 255);
      data[index + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      data[index + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      data[index + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.needsUpdate = true;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

function createNefertitiSculpture() {
  const group = new THREE.Group();
  group.position.set(10.4, 0, -12.3);

  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(1.18, 1.38, 1.05, 48),
    new THREE.MeshStandardMaterial({ color: 0x20252a, roughness: 0.34, metalness: 0.58 })
  );
  pedestal.position.y = 0.53;
  pedestal.castShadow = true;
  pedestal.receiveShadow = true;
  group.add(pedestal);
  registerObstacle(group.position.x, group.position.z, 2.55, 2.55, 0.2);

  const normalTexture = createObjectSpaceNormalTexture();
  const stone = new THREE.MeshStandardMaterial({
    color: 0xbca978,
    roughness: 0.34,
    metalness: 0.2,
    normalMap: normalTexture,
    normalMapType: THREE.ObjectSpaceNormalMap,
    normalScale: new THREE.Vector2(0.65, 0.65)
  });

  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(1.28, 64, 36), stone);
  shoulders.scale.set(1.35, 0.58, 0.72);
  shoulders.position.y = 1.43;
  shoulders.castShadow = true;
  group.add(shoulders);

  const chestCut = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 1.3, 1.0, 48),
    stone
  );
  chestCut.scale.z = 0.68;
  chestCut.position.y = 1.35;
  chestCut.castShadow = true;
  group.add(chestCut);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.55, 1.05, 48), stone);
  neck.position.y = 2.22;
  neck.castShadow = true;
  group.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.72, 64, 48), stone);
  head.scale.set(0.77, 1.08, 0.78);
  head.position.set(0, 3.12, 0.03);
  head.castShadow = true;
  group.add(head);

  const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.58, 48, 32), stone);
  jaw.scale.set(0.82, 0.65, 0.76);
  jaw.position.set(0, 2.72, 0.08);
  jaw.castShadow = true;
  group.add(jaw);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.48, 20), stone);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 3.12, 0.65);
  nose.castShadow = true;
  group.add(nose);

  const lipMaterial = stone.clone();
  lipMaterial.color.setHex(0x826a55);
  const lips = new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 16), lipMaterial);
  lips.scale.set(1.35, 0.34, 0.38);
  lips.position.set(0, 2.87, 0.63);
  group.add(lips);

  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0x111820,
    roughness: 0.18,
    metalness: 0.15
  });
  [-0.25, 0.25].forEach(x => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 20, 12), eyeMaterial);
    eye.scale.set(1.5, 0.48, 0.45);
    eye.position.set(x, 3.25, 0.64);
    group.add(eye);
  });

  const crownMaterial = new THREE.MeshStandardMaterial({
    color: 0x174965,
    roughness: 0.3,
    metalness: 0.42,
    normalMap: normalTexture,
    normalMapType: THREE.ObjectSpaceNormalMap
  });
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.72, 1.82, 48), crownMaterial);
  crown.position.y = 4.35;
  crown.rotation.z = -0.055;
  crown.castShadow = true;
  group.add(crown);

  const crownBandMaterial = new THREE.MeshStandardMaterial({
    color: 0xb58a2d,
    roughness: 0.24,
    metalness: 0.78
  });
  const lowerBand = new THREE.Mesh(new THREE.TorusGeometry(0.69, 0.075, 12, 48), crownBandMaterial);
  lowerBand.rotation.x = Math.PI / 2;
  lowerBand.position.y = 3.46;
  group.add(lowerBand);

  const topBand = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.055, 12, 48), crownBandMaterial);
  topBand.rotation.x = Math.PI / 2;
  topBand.position.y = 5.25;
  group.add(topBand);

  const badge = new THREE.Mesh(new THREE.SphereGeometry(0.105, 20, 14), crownBandMaterial);
  badge.position.set(0, 4.48, 0.52);
  badge.scale.set(0.62, 1.65, 0.45);
  group.add(badge);

  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(4.8, 1.03),
    new THREE.MeshBasicMaterial({
      map: createPlaqueTexture('NEFERTITI', 'Normal map en espacio de objeto'),
      toneMapped: false
    })
  );
  plaque.position.set(0, 0.53, 1.42);
  plaque.rotation.x = -0.09;
  group.add(plaque);

  scene.add(group);

  const sculptureLight = new THREE.SpotLight(0xffe2a8, 52, 14, Math.PI / 6.3, 0.45, 1.4);
  sculptureLight.position.set(10.4, 7.6, -7.8);
  sculptureLight.target.position.set(10.4, 2.7, -12.3);
  sculptureLight.castShadow = true;
  scene.add(sculptureLight, sculptureLight.target);

  galleryUpdaters.push((time, dt) => {
    group.rotation.y = Math.sin(time * 0.28) * 0.12;
    crownMaterial.normalScale.setScalar(0.48 + Math.sin(time * 0.8) * 0.08);
  });

  return group;
}
createNefertitiSculpture();

// ---- TEXTURE 2D ARRAY: escáner volumétrico sintético real ----
const arrayVertexShader = `
  out vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

function createArrayShader(texture, depth = 0, mode = 0) {
  return new THREE.ShaderMaterial({
    uniforms: {
      diffuseArray: { value: texture },
      depth: { value: depth },
      pulse: { value: 0 },
      mode: { value: mode }
    },
    vertexShader: arrayVertexShader,
    fragmentShader: `
      precision highp float;
      precision highp sampler2DArray;
      in vec2 vUv;
      out vec4 outColor;
      uniform sampler2DArray diffuseArray;
      uniform float depth;
      uniform float pulse;
      uniform float mode;

      void main() {
        vec4 color = texture(diffuseArray, vec3(vUv, depth));
        if (mode < 0.5) {
          float grid = smoothstep(0.96, 1.0, max(fract(vUv.x * 12.0), fract(vUv.y * 12.0)));
          vec3 scan = mix(color.rgb * vec3(0.48, 0.88, 1.18), vec3(0.12, 0.95, 1.0), grid * 0.18);
          float line = smoothstep(0.025, 0.0, abs(vUv.y - fract(pulse)));
          scan += vec3(0.0, 0.65, 0.95) * line * 0.36;
          outColor = vec4(scan, 1.0);
        } else {
          float vignette = smoothstep(0.84, 0.28, distance(vUv, vec2(0.5)));
          color.rgb *= 0.65 + vignette * 0.55;
          color.rgb += 0.08 * sin(vec3(0.0, 2.0, 4.0) + pulse * 6.2831);
          outColor = vec4(color.rgb, 1.0);
        }
      }
    `,
    glslVersion: THREE.GLSL3,
    side: THREE.DoubleSide,
    toneMapped: false
  });
}

function createHeadScanArray(width = 128, height = 128, depth = 36) {
  const data = new Uint8Array(width * height * depth * 4);
  for (let z = 0; z < depth; z++) {
    const zn = (z / (depth - 1)) * 2 - 1;
    const sliceScale = Math.sqrt(Math.max(0, 1 - zn * zn));
    for (let y = 0; y < height; y++) {
      const ny = (y / (height - 1)) * 2 - 1;
      for (let x = 0; x < width; x++) {
        const nx = (x / (width - 1)) * 2 - 1;
        const skull = Math.sqrt((nx / (0.72 * sliceScale + 0.08)) ** 2 + (ny / (0.93 * sliceScale + 0.08)) ** 2);
        const brain = Math.sqrt((nx / (0.59 * sliceScale + 0.06)) ** 2 + ((ny + 0.04) / (0.74 * sliceScale + 0.06)) ** 2);
        const sinus = Math.exp(-((nx * 4.5) ** 2 + ((ny - 0.38) * 8.0) ** 2));
        const eyes = Math.exp(-(((Math.abs(nx) - 0.24) * 11.0) ** 2 + ((ny - 0.12) * 9.5) ** 2));
        let value = 6;
        if (skull < 1.0) value = 54 + (1 - skull) * 50;
        if (brain < 1.0) value = 80 + (1 - brain) * 74 + 12 * Math.sin((nx + ny + zn) * 22);
        if (skull > 0.91 && skull < 1.035) value = 245;
        value += sinus * 78 + eyes * 42;
        value = THREE.MathUtils.clamp(value, 0, 255);
        const index = ((z * height + y) * width + x) * 4;
        data[index] = value * 0.72;
        data[index + 1] = value * 0.94;
        data[index + 2] = value;
        data[index + 3] = 255;
      }
    }
  }
  const texture = new THREE.DataArrayTexture(data, width, height, depth);
  texture.format = THREE.RGBAFormat;
  texture.type = THREE.UnsignedByteType;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

const headArrayDepth = 36;
const headArrayTexture = createHeadScanArray(128, 128, headArrayDepth);
const headArrayMaterial = createArrayShader(headArrayTexture, 0, 0);

createFramedPanel({
  material: headArrayMaterial,
  width: 5.4,
  height: 4.35,
  position: new THREE.Vector3(18.25, 3.65, -13.25),
  rotationY: -Math.PI / 2,
  title: 'TEXTURE 2D ARRAY',
  subtitle: 'Escáner volumétrico por capas',
  frameColor: 0x174d5e,
  plaqueWidth: 5.35
});
createDisplayLight(15.7, 5.8, -13.25, 0x4ce9ff, 12, 7.5);

galleryUpdaters.push(time => {
  headArrayMaterial.uniforms.depth.value =
    Math.floor((0.5 + 0.5 * Math.sin(time * 0.82)) * (headArrayDepth - 1));
  headArrayMaterial.uniforms.pulse.value = time * 0.18;
});

// ---- 2D ARRAY "COMPRIMIDA": secuencia multicapa de estilo cinematográfico ----
function createCinematicArray(width = 128, height = 96, depth = 32) {
  const data = new Uint8Array(width * height * depth * 4);
  for (let z = 0; z < depth; z++) {
    const phase = z / depth * Math.PI * 2;
    for (let y = 0; y < height; y++) {
      const v = y / (height - 1);
      for (let x = 0; x < width; x++) {
        const u = x / (width - 1);
        const wave = 0.5 + 0.5 * Math.sin(u * 11 + phase + Math.sin(v * 8 - phase) * 1.7);
        const ring = Math.exp(-Math.abs(Math.hypot(u - 0.5 - Math.sin(phase) * 0.08, v - 0.5) - 0.27) * 18);
        const streak = Math.pow(Math.max(0, Math.sin((u + v) * 16 - phase * 2)), 8);
        const index = ((z * height + y) * width + x) * 4;
        data[index] = THREE.MathUtils.clamp(20 + wave * 90 + ring * 150, 0, 255);
        data[index + 1] = THREE.MathUtils.clamp(18 + (1 - v) * 74 + streak * 120, 0, 255);
        data[index + 2] = THREE.MathUtils.clamp(45 + (1 - wave) * 150 + ring * 55, 0, 255);
        data[index + 3] = 255;
      }
    }
  }
  const texture = new THREE.DataArrayTexture(data, width, height, depth);
  texture.format = THREE.RGBAFormat;
  texture.type = THREE.UnsignedByteType;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

const cinematicDepth = 32;
const cinematicTexture = createCinematicArray(128, 96, cinematicDepth);
const cinematicMaterial = createArrayShader(cinematicTexture, 0, 1);

createFramedPanel({
  material: cinematicMaterial,
  width: 5.45,
  height: 4.08,
  position: new THREE.Vector3(18.25, 3.55, -6.3),
  rotationY: -Math.PI / 2,
  title: '2D ARRAY COMPRIMIDA',
  subtitle: 'Secuencia multicapa animada',
  frameColor: 0x3a214f,
  plaqueWidth: 5.35
});
createDisplayLight(15.7, 5.5, -6.3, 0xb45cff, 11, 7.5);

galleryUpdaters.push(time => {
  cinematicMaterial.uniforms.depth.value = Math.floor((time * 11) % cinematicDepth);
  cinematicMaterial.uniforms.pulse.value = time * 0.3;
});

// ---- LAYER UPDATE: actualiza capas individuales usando addLayerUpdate() ----
function createLayerUpdateArray(width = 96, height = 96, depth = 8) {
  const data = new Uint8Array(width * height * depth * 4);
  const paintLayer = (layer, time) => {
    const offset = layer * width * height * 4;
    for (let y = 0; y < height; y++) {
      const v = y / (height - 1);
      for (let x = 0; x < width; x++) {
        const u = x / (width - 1);
        const pulse = 0.5 + 0.5 * Math.sin((u * 10 + v * 12) + time * 4 + layer);
        const orb = Math.exp(-((u - (0.2 + 0.6 * ((Math.sin(time + layer) + 1) / 2))) ** 2 +
          (v - (0.25 + 0.5 * ((Math.cos(time * 0.8 + layer) + 1) / 2))) ** 2) * 40);
        const index = offset + (y * width + x) * 4;
        data[index] = 20 + layer * 20 + orb * 160;
        data[index + 1] = 45 + pulse * 90 + orb * 90;
        data[index + 2] = 105 + (1 - pulse) * 120;
        data[index + 3] = 255;
      }
    }
  };
  for (let layer = 0; layer < depth; layer++) paintLayer(layer, layer * 0.4);

  const texture = new THREE.DataArrayTexture(data, width, height, depth);
  texture.format = THREE.RGBAFormat;
  texture.type = THREE.UnsignedByteType;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  return { texture, data, paintLayer, width, height, depth };
}

const layerArray = createLayerUpdateArray();
const layerMaterial = new THREE.ShaderMaterial({
  uniforms: {
    diffuseArray: { value: layerArray.texture },
    time: { value: 0 }
  },
  vertexShader: arrayVertexShader,
  fragmentShader: `
    precision highp float;
    precision highp sampler2DArray;
    in vec2 vUv;
    out vec4 outColor;
    uniform sampler2DArray diffuseArray;
    uniform float time;

    void main() {
      vec2 tiles = vec2(4.0, 2.0);
      vec2 tiledUv = fract(vUv * tiles);
      float column = floor(vUv.x * tiles.x);
      float row = floor(vUv.y * tiles.y);
      float layer = column + row * tiles.x;
      vec4 color = texture(diffuseArray, vec3(tiledUv, layer));
      float edge = smoothstep(0.035, 0.0, min(min(tiledUv.x, 1.0 - tiledUv.x), min(tiledUv.y, 1.0 - tiledUv.y)));
      color.rgb += vec3(0.1, 0.8, 1.0) * edge * 0.55;
      color.rgb *= 0.8 + 0.2 * sin(time + layer);
      outColor = vec4(color.rgb, 1.0);
    }
  `,
  glslVersion: THREE.GLSL3,
  toneMapped: false
});

createFramedPanel({
  material: layerMaterial,
  width: 5.45,
  height: 3.85,
  position: new THREE.Vector3(18.25, 3.45, 0.45),
  rotationY: -Math.PI / 2,
  title: 'LAYER UPDATE',
  subtitle: 'Actualización independiente de 8 capas',
  frameColor: 0x184b57,
  plaqueWidth: 5.35
});
createDisplayLight(15.7, 5.4, 0.45, 0x50eaff, 10, 7.2);

let nextLayerUpdate = 0;
let layerCursor = 0;
galleryUpdaters.push(time => {
  layerMaterial.uniforms.time.value = time;
  if (time >= nextLayerUpdate) {
    layerArray.paintLayer(layerCursor, time);
    layerArray.texture.addLayerUpdate(layerCursor);
    layerArray.texture.needsUpdate = true;
    layerCursor = (layerCursor + 1) % layerArray.depth;
    nextLayerUpdate = time + 0.12;
  }
});

// Luz ambiental cálida de la galería.
const galleryFill = new THREE.PointLight(0xffefd2, 22, 28, 1.5);
galleryFill.position.set(0, 6.4, -10.5);
scene.add(galleryFill);



// PUERTA DE SALIDA INTEGRADA: al cruzarla se vuelve automáticamente a GTA MANUCHO.
const exitDoor = new THREE.Group();
exitDoor.position.set(0, 0, 20.75);
const exitFrameMaterial = new THREE.MeshStandardMaterial({ color: 0x5c3a1f, roughness: 0.62, metalness: 0.12 });
const exitGlowMaterial = new THREE.MeshBasicMaterial({ color: 0x5ee8ff, transparent: true, opacity: 0.28, side: THREE.DoubleSide });
const exitColumnGeometry = new THREE.BoxGeometry(0.45, 4.6, 0.55);
const exitLeft = new THREE.Mesh(exitColumnGeometry, exitFrameMaterial);
exitLeft.position.set(-2.65, 2.3, 0);
const exitRight = exitLeft.clone();
exitRight.position.x = 2.65;
const exitTop = new THREE.Mesh(new THREE.BoxGeometry(5.75, 0.52, 0.55), exitFrameMaterial);
exitTop.position.set(0, 4.6, 0);
const exitPortal = new THREE.Mesh(new THREE.PlaneGeometry(4.75, 4.05), exitGlowMaterial);
exitPortal.position.set(0, 2.2, 0.20);
const exitFloor = new THREE.Mesh(
  new THREE.BoxGeometry(5.3, 0.08, 2.1),
  new THREE.MeshStandardMaterial({ color: 0x2b2018, roughness: 0.92 })
);
exitFloor.position.set(0, 0.04, -0.25);
[exitLeft, exitRight, exitTop, exitFloor].forEach(part => { part.castShadow = true; part.receiveShadow = true; });
exitDoor.add(exitLeft, exitRight, exitTop, exitPortal, exitFloor);
scene.add(exitDoor);

const exitCanvas = document.createElement('canvas');
exitCanvas.width = 768; exitCanvas.height = 160;
const exitCtx = exitCanvas.getContext('2d');
exitCtx.fillStyle = '#17100b'; exitCtx.fillRect(0, 0, exitCanvas.width, exitCanvas.height);
exitCtx.strokeStyle = '#79eaff'; exitCtx.lineWidth = 10; exitCtx.strokeRect(8, 8, exitCanvas.width - 16, exitCanvas.height - 16);
exitCtx.fillStyle = '#ffffff'; exitCtx.font = 'bold 52px Arial'; exitCtx.textAlign = 'center'; exitCtx.textBaseline = 'middle';
exitCtx.fillText('SALIDA A GTA MANUCHO', exitCanvas.width / 2, exitCanvas.height / 2);
const exitSign = new THREE.Mesh(
  new THREE.PlaneGeometry(5.4, 1.12),
  new THREE.MeshBasicMaterial({ map: makeCanvasTexture(exitCanvas), toneMapped: false })
);
exitSign.position.set(0, 5.45, 20.72);
scene.add(exitSign);

let returningToCity = false;
function returnToViceCityThroughDoor() {
  if (returningToCity) return;
  returningToCity = true;
  try { document.exitPointerLock?.(); } catch (_) {}
  statusEl.textContent = 'Regresando a GTA MANUCHO…';
  window.location.href = '../index.html?from=museo';
}

// Contenedor físico del jugador. El modelo Soldier oficial va dentro de este grupo.
const player = new THREE.Group();
player.position.set(0, 0.02, 15.5);
scene.add(player);

const modelGroup = new THREE.Group();
modelGroup.rotation.order = 'YXZ';
player.add(modelGroup);

let soldierModel = null;
let mixer = null;
const actions = {};
let currentAction = '';
let modelReady = false;

function finishBoot() {
  boot?.classList.add('hide');
  setTimeout(() => boot?.remove(), 300);
}

function fadeToAction(name, duration = 0.20) {
  const next = actions[name];
  if (!next || currentAction === name) return;

  const previous = actions[currentAction];
  if (previous) previous.fadeOut(duration);
  next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(duration).play();
  currentAction = name;
}

function installOfficialSoldier(gltf) {
  soldierModel = gltf.scene;
  soldierModel.name = 'Soldier_Oficial_ThreeJS';

  soldierModel.traverse(object => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
      object.frustumCulled = false;
    }
  });

  // Configuración pedida: Soldier.glb original, escala 1 y orientación frontal invertida.
  soldierModel.rotation.y = Math.PI;
  soldierModel.scale.set(1, 1, 1);
  soldierModel.updateMatrixWorld(true);

  // Apoyar exactamente los pies en el suelo sin deformar ni sustituir el personaje.
  const bounds = new THREE.Box3().setFromObject(soldierModel);
  soldierModel.position.y -= bounds.min.y;
  soldierModel.updateMatrixWorld(true);
  modelGroup.add(soldierModel);

  // Índices exactos usados por el código entregado por el usuario.
  mixer = new THREE.AnimationMixer(soldierModel);
  actions.Idle = mixer.clipAction(gltf.animations[0]);
  actions.Run = mixer.clipAction(gltf.animations[1]);
  actions.Walk = mixer.clipAction(gltf.animations[3]);
  actions.Walk.timeScale = 1.1;
  actions.Run.timeScale = 0.9;
  actions.Idle.play();
  currentAction = 'Idle';

  modelReady = true;
  statusEl.textContent = 'Soldier y galería Three.js listos · V cambia la cámara';
  if (bootText) bootText.textContent = 'Soldier oficial cargado';
  finishBoot();
}

function showSoldierError(error) {
  console.error('No se pudo cargar el Soldier.glb oficial.', error);
  modelReady = false;
  statusEl.textContent = 'ERROR: no se pudo cargar models/Soldier.glb';
  statusEl.style.borderColor = '#ff5b5b';
  statusEl.style.color = '#ffd5d5';
  if (bootText) bootText.textContent = 'No se pudo cargar models/Soldier.glb';
  setTimeout(finishBoot, 1200);
}

// Se carga desde el propio ZIP. No existe robot ni personaje alternativo de respaldo.
new GLTFLoader().load('./models/Soldier.glb', installOfficialSoldier, undefined, showSoldierError);

const keys = Object.create(null);
let firstPerson = false;
let yaw = 0;
let pitch = 0.22;
let dragging = false;
let lastX = 0;
let lastY = 0;
let verticalSpeed = 0;
let onGround = true;
let thirdPersonDistance = 4.2;

function setCameraMode(enabled) {
  firstPerson = enabled;
  modeEl.textContent = firstPerson ? 'PRIMERA PERSONA' : 'TERCERA PERSONA';
  crosshair.style.display = firstPerson ? 'block' : 'none';

  if (soldierModel) soldierModel.visible = !firstPerson;

  statusEl.textContent = firstPerson
    ? 'Primera persona · Haz clic para fijar el ratón · V para volver'
    : `${modelReady ? 'Soldier y galería listos' : 'Soldier cargando'} · V cambia la cámara`;

  if (!firstPerson && document.pointerLockElement === renderer.domElement) {
    document.exitPointerLock?.();
  }
}

addEventListener('keydown', event => {
  keys[event.code] = true;
  if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight', 'Space'].includes(event.code)) {
    event.preventDefault();
  }
  if (event.code === 'KeyV' && !event.repeat) setCameraMode(!firstPerson);
});
addEventListener('keyup', event => { keys[event.code] = false; });
addEventListener('blur', () => Object.keys(keys).forEach(key => { keys[key] = false; }));

renderer.domElement.addEventListener('pointerdown', event => {
  if (firstPerson && document.pointerLockElement !== renderer.domElement) {
    renderer.domElement.requestPointerLock?.();
    return;
  }
  dragging = true;
  lastX = event.clientX;
  lastY = event.clientY;
  renderer.domElement.setPointerCapture?.(event.pointerId);
});
renderer.domElement.addEventListener('pointermove', event => {
  if (document.pointerLockElement === renderer.domElement || !dragging) return;
  yaw -= (event.clientX - lastX) * 0.006;
  pitch = THREE.MathUtils.clamp(
    pitch - (event.clientY - lastY) * 0.004,
    firstPerson ? -1.2 : -0.45,
    firstPerson ? 1.2 : 0.85
  );
  lastX = event.clientX;
  lastY = event.clientY;
});
renderer.domElement.addEventListener('pointerup', () => { dragging = false; });
renderer.domElement.addEventListener('wheel', event => {
  if (!firstPerson) {
    thirdPersonDistance = THREE.MathUtils.clamp(thirdPersonDistance + event.deltaY * 0.004, 2.4, 7.0);
  }
}, { passive: true });
addEventListener('mousemove', event => {
  if (document.pointerLockElement !== renderer.domElement) return;
  yaw -= event.movementX * 0.0024;
  pitch = THREE.MathUtils.clamp(pitch - event.movementY * 0.0021, -1.2, 1.2);
});

const clock = new THREE.Clock();
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const movement = new THREE.Vector3();
const target = new THREE.Vector3();
const desired = new THREE.Vector3();
const lookDirection = new THREE.Vector3();

function updatePlayer(dt) {
  let inputX = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  let inputZ = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
  const moving = inputX !== 0 || inputZ !== 0;
  const running = Boolean(keys.ShiftLeft || keys.ShiftRight);
  const speed = running ? 5.2 : 2.8;

  if (moving) {
    const inputLength = Math.hypot(inputX, inputZ);
    inputX /= inputLength;
    inputZ /= inputLength;

    forward.set(-Math.sin(yaw), 0, -Math.cos(yaw));
    right.set(Math.cos(yaw), 0, -Math.sin(yaw));
    movement.set(0, 0, 0)
      .addScaledVector(forward, inputZ)
      .addScaledVector(right, inputX)
      .normalize();

    const nextX = player.position.x + movement.x * speed * dt;
    const nextZ = player.position.z + movement.z * speed * dt;
    if (Math.hypot(nextX, nextZ) < 22.5 && !isGalleryBlocked(nextX, nextZ)) {
      player.position.x = nextX;
      player.position.z = nextZ;
    }

    const targetRotation = firstPerson ? yaw + Math.PI : Math.atan2(movement.x, movement.z);
    const difference = Math.atan2(
      Math.sin(targetRotation - player.rotation.y),
      Math.cos(targetRotation - player.rotation.y)
    );
    player.rotation.y += difference * Math.min(1, dt * 12);
    fadeToAction(running ? 'Run' : 'Walk');
  } else {
    if (firstPerson) {
      const targetRotation = yaw + Math.PI;
      const difference = Math.atan2(
        Math.sin(targetRotation - player.rotation.y),
        Math.cos(targetRotation - player.rotation.y)
      );
      player.rotation.y += difference * Math.min(1, dt * 14);
    }
    fadeToAction('Idle');
  }

  if (keys.Space && onGround) {
    verticalSpeed = 5.2;
    onGround = false;
    keys.Space = false;
  }

  if (!onGround || player.position.y > 0.021) {
    verticalSpeed -= 13 * dt;
    player.position.y += verticalSpeed * dt;
    if (player.position.y <= 0.02) {
      player.position.y = 0.02;
      verticalSpeed = 0;
      onGround = true;
    }
  }

  // La puerta sur es la salida física: no requiere Enter ni un botón.
  if (!returningToCity && player.position.z > 20.15 && Math.abs(player.position.x) < 2.45) {
    returnToViceCityThroughDoor();
    return;
  }

  if (soldierModel) soldierModel.visible = !firstPerson;
  if (mixer) mixer.update(dt);
}

function updateCamera(dt) {
  target.set(player.position.x, player.position.y + 1.42, player.position.z);

  if (firstPerson) {
    desired.set(player.position.x, player.position.y + 1.64, player.position.z);
    camera.position.lerp(desired, 1 - Math.exp(-dt * 25));
    lookDirection.set(
      -Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      -Math.cos(yaw) * Math.cos(pitch)
    );
    camera.lookAt(camera.position.clone().add(lookDirection));
  } else {
    const horizontalDistance = Math.cos(pitch) * thirdPersonDistance;
    desired.set(
      target.x + Math.sin(yaw) * horizontalDistance,
      target.y + Math.sin(pitch) * thirdPersonDistance + 0.35,
      target.z + Math.cos(yaw) * horizontalDistance
    );
    desired.y = Math.max(desired.y, 0.48);
    camera.position.lerp(desired, 1 - Math.exp(-dt * 9));
    camera.lookAt(target);
  }
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  galleryTime += dt;
  updatePlayer(dt);
  updateCamera(dt);
  for (const updateGalleryItem of galleryUpdaters) updateGalleryItem(galleryTime, dt);
  renderer.render(scene, camera);
}
animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
});
