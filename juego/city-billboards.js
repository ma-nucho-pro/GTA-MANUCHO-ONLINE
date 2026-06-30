/**
 * GTA MANUCHO V84 — código del proyecto.
 * Creado e integrado por Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * ARKEA AI / Manucho · conserva LICENSE, NOTICE.md y estos créditos al reutilizar.
 */
import * as THREE from './bosque/libs/three.module.js';

THREE.Cache.enabled = true;

const IMAGE_ADS = [
  './ad-assets/ad01.png',
  './ad-assets/ad02.png',
  './ad-assets/ad03.png',
  './ad-assets/ad04.png',
  './ad-assets/ad05.png',
  './ad-assets/ad06.png',
  './ad-assets/ad07.png',
  './ad-assets/ad08.png',
  './ad-assets/ad09.png',
  './ad-assets/ad10.png'
];

const PAYPAL_URL = 'https://www.paypal.com/paypalme/gtamanucho';
const VIMEO_URL = 'https://player.vimeo.com/video/1205374835?badge=0&autopause=0&player_id=vice_city_ad_video&app_id=58479&autoplay=1&muted=1&loop=1&background=1';

// Posiciones repartidas por la ciudad. Los carteles están a los lados de las vías
// para que sean visibles caminando o conduciendo sin bloquear la circulación.
const IMAGE_PLACEMENTS = [
  { x: -1520, z: -880, ry: 0.20, width: 195 },
  { x: -1040, z:  420, ry: 1.10, width: 190 },
  { x:  -540, z: -1420, ry: 0.05, width: 205 },
  { x:   120, z:  -760, ry: 0.90, width: 220 },
  { x:   770, z:  -180, ry: -0.35, width: 220 },
  { x:  1370, z:   620, ry: 1.52, width: 210 },
  { x:  1100, z:  1810, ry: -0.15, width: 210 },
  { x:  -420, z:  2230, ry: 1.57, width: 125 },
  { x:   970, z:  2690, ry: 3.08, width: 215 },
  { x:  -620, z:  3160, ry: 1.62, width: 190 }
];

const EMPTY_PLACEMENTS = [
  { x: -1850, z:  1250, ry: 0.12, width: 205 },
  { x:  1760, z: -1180, ry: 1.48, width: 210 },
  { x:  1580, z:  2100, ry: 3.05, width: 205 },
  { x: -1210, z:  2860, ry: 0.05, width: 220 },
  { x:   180, z:  3720, ry: 1.55, width: 215 },
  { x: -1960, z: -4480, ry: 0.08, width: 200 }
];

const VIDEO_PLACEMENT = { x: 430, z: 980, ry: 0.10, width: 225, height: 126 };

let game = null;
let root = null;
let videoBillboard = null;
let videoOverlay = null;
let videoIframe = null;
let videoUnloadTimer = 0;
let lastProjection = 0;
let lastPlayerCheck = 0;
let nearbyVideo = false;
let installed = false;

const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x111722, roughness: 0.72, metalness: 0.55 });
const postMaterial = new THREE.MeshStandardMaterial({ color: 0x26303a, roughness: 0.68, metalness: 0.65 });
const glowMaterial = new THREE.MeshBasicMaterial({ color: 0x37a8ff, transparent: true, opacity: 0.2, depthWrite: false });

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForGame() {
  const started = performance.now();
  while (performance.now() - started < 25000) {
    const candidate = window.__VICE_CITY_GAME__;
    if (candidate?.scene && candidate?.camera && candidate?.renderer && candidate?.playerContainer) return candidate;
    await wait(80);
  }
  return window.__VICE_CITY_GAME__ || null;
}

function safeGroundY(x, z) {
  try {
    const y = game.getGroundY?.(x, 900, z, false);
    if (Number.isFinite(y) && y > -120 && y < 500) return y;
  } catch {}
  return 1.5;
}

function createAdvertiseTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 1024, 512);
  gradient.addColorStop(0, '#07101d');
  gradient.addColorStop(0.52, '#0c2746');
  gradient.addColorStop(1, '#09111d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 512);

  ctx.strokeStyle = '#2ea8ff';
  ctx.lineWidth = 18;
  ctx.strokeRect(16, 16, 992, 480);
  ctx.strokeStyle = 'rgba(255,255,255,.18)';
  ctx.lineWidth = 3;
  ctx.strokeRect(38, 38, 948, 436);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 96px Arial, sans-serif';
  ctx.fillText('ANÚNCIATE:', 512, 190);

  ctx.fillStyle = '#62b7ff';
  ctx.font = '800 35px Arial, sans-serif';
  ctx.fillText('TU PUBLICIDAD AQUÍ', 512, 260);

  ctx.fillStyle = '#f4f8ff';
  ctx.font = '700 25px Arial, sans-serif';
  ctx.fillText('https://www.paypal.com/paypalme/gtamanucho', 512, 342);

  ctx.fillStyle = 'rgba(255,255,255,.72)';
  ctx.font = '600 20px Arial, sans-serif';
  ctx.fillText('ESPACIOS DISPONIBLES EN GTA MANUCHO', 512, 407);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = Math.min(2, game?.renderer?.capabilities?.getMaxAnisotropy?.() || 1);
  return texture;
}

function createVideoPlaceholderTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 1280, 720);
  gradient.addColorStop(0, '#07090f');
  gradient.addColorStop(.5, '#182338');
  gradient.addColorStop(1, '#06070c');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1280, 720);
  ctx.strokeStyle = '#ff9f28';
  ctx.lineWidth = 28;
  ctx.strokeRect(18, 18, 1244, 684);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = '900 92px Arial';
  ctx.fillText('PANTALLA DE VIDEO', 640, 300);
  ctx.fillStyle = '#ffb34b';
  ctx.font = '800 44px Arial';
  ctx.fillText('PUBLICIDAD DIGITAL · GTA MANUCHO', 640, 390);
  ctx.fillStyle = 'rgba(255,255,255,.76)';
  ctx.font = '700 30px Arial';
  ctx.fillText('REPRODUCCIÓN AUTOMÁTICA SIN SONIDO', 640, 475);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 1;
  return texture;
}

function createBillboard(texture, placement, options = {}) {
  const width = placement.width || 190;
  const aspect = options.aspect || (texture?.image?.width && texture?.image?.height ? texture.image.width / texture.image.height : 2);
  const height = placement.height || Math.max(58, Math.min(126, width / Math.max(.7, aspect)));
  const baseY = safeGroundY(placement.x, placement.z);
  const bottom = options.bottom ?? 52;

  const group = new THREE.Group();
  group.name = options.name || 'CARTEL_PUBLICITARIO_V73';
  group.position.set(placement.x, baseY, placement.z);
  group.rotation.y = placement.ry || 0;
  group.userData.billboardWidth = width;
  group.userData.billboardHeight = height;

  const backing = new THREE.Mesh(new THREE.BoxGeometry(width + 12, height + 12, 6), frameMaterial);
  backing.position.y = bottom + height * .5;
  backing.castShadow = false;
  backing.receiveShadow = false;
  group.add(backing);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: texture, color: 0xffffff, toneMapped: false, side: THREE.DoubleSide })
  );
  screen.name = 'PANTALLA_CARTEL_PUBLICITARIO';
  screen.position.set(0, bottom + height * .5, 3.15);
  screen.castShadow = false;
  screen.receiveShadow = false;
  screen.renderOrder = 2;
  group.add(screen);

  const topGlow = new THREE.Mesh(new THREE.BoxGeometry(width + 18, 3, 2), glowMaterial);
  topGlow.position.set(0, bottom + height + 8, 4);
  group.add(topGlow);

  const postGeo = new THREE.BoxGeometry(7, bottom + 8, 7);
  for (const sx of [-1, 1]) {
    const post = new THREE.Mesh(postGeo, postMaterial);
    post.position.set(sx * Math.min(width * .32, 58), (bottom + 8) * .5, -1);
    post.castShadow = false;
    post.receiveShadow = true;
    group.add(post);
  }

  group.traverse(object => {
    if (object.isMesh) {
      object.matrixAutoUpdate = false;
      object.updateMatrix();
    }
  });

  game.scene.add(group);
  return { group, screen, width, height, bottom };
}

async function loadTexture(path) {
  const texture = await new THREE.TextureLoader().loadAsync(path);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = Math.min(2, game?.renderer?.capabilities?.getMaxAnisotropy?.() || 1);
  return texture;
}

function ensureVideoOverlay() {
  if (videoOverlay) return videoOverlay;
  const overlay = document.createElement('div');
  overlay.id = 'vice-video-billboard-overlay';
  overlay.style.cssText = [
    'position:fixed', 'left:0', 'top:0', 'display:none', 'overflow:hidden',
    'background:#05070b', 'border:4px solid #111722', 'box-sizing:border-box',
    'box-shadow:0 0 12px rgba(0,0,0,.8)', 'pointer-events:none',
    'z-index:3', 'transform-origin:center center', 'will-change:left,top,width,height,opacity'
  ].join(';');
  document.body.appendChild(overlay);
  videoOverlay = overlay;
  return overlay;
}

function startVideoIframe() {
  if (videoIframe || !nearbyVideo) return;
  const overlay = ensureVideoOverlay();
  const iframe = document.createElement('iframe');
  iframe.id = 'vice-city-ad-vimeo';
  iframe.src = VIMEO_URL;
  iframe.title = 'Publicidad de video en GTA MANUCHO';
  iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  iframe.loading = 'lazy';
  iframe.setAttribute('frameborder', '0');
  iframe.style.cssText = 'position:absolute;inset:-1px;width:calc(100% + 2px);height:calc(100% + 2px);border:0;pointer-events:none;background:#05070b';
  overlay.appendChild(iframe);
  videoIframe = iframe;
}

function stopVideoIframe() {
  if (!videoIframe) return;
  try { videoIframe.remove(); } catch {}
  videoIframe = null;
  if (videoOverlay) videoOverlay.style.display = 'none';
}

function projectVideoScreen(now) {
  if (!videoBillboard || !game?.camera || !game?.renderer) return;
  if (now - lastProjection < 80) return; // 12.5 actualizaciones por segundo, suficiente y fluido.
  lastProjection = now;

  const player = game.playerContainer?.position;
  if (!player) return;

  if (now - lastPlayerCheck > 350) {
    lastPlayerCheck = now;
    const dx = player.x - VIDEO_PLACEMENT.x;
    const dz = player.z - VIDEO_PLACEMENT.z;
    const distanceSq = dx * dx + dz * dz;
    nearbyVideo = distanceSq < 2300 * 2300;
    if (nearbyVideo) {
      clearTimeout(videoUnloadTimer);
      videoUnloadTimer = 0;
      startVideoIframe();
    } else if (videoIframe && !videoUnloadTimer) {
      videoUnloadTimer = setTimeout(() => {
        videoUnloadTimer = 0;
        if (!nearbyVideo) stopVideoIframe();
      }, 9000);
    }
  }

  if (!nearbyVideo || document.hidden || !videoIframe) {
    if (videoOverlay) videoOverlay.style.display = 'none';
    return;
  }

  const mesh = videoBillboard.screen;
  mesh.updateMatrixWorld(true);
  const camera = game.camera;
  const rendererRect = game.renderer.domElement.getBoundingClientRect();
  const hw = videoBillboard.width * .5;
  const hh = videoBillboard.height * .5;
  const corners = [
    new THREE.Vector3(-hw, hh, 0),
    new THREE.Vector3(hw, hh, 0),
    new THREE.Vector3(hw, -hh, 0),
    new THREE.Vector3(-hw, -hh, 0)
  ];

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  let valid = true;
  for (const corner of corners) {
    corner.applyMatrix4(mesh.matrixWorld).project(camera);
    if (!Number.isFinite(corner.x) || !Number.isFinite(corner.y) || corner.z < -1 || corner.z > 1) {
      valid = false;
      break;
    }
    const sx = rendererRect.left + (corner.x * .5 + .5) * rendererRect.width;
    const sy = rendererRect.top + (-corner.y * .5 + .5) * rendererRect.height;
    minX = Math.min(minX, sx); maxX = Math.max(maxX, sx);
    minY = Math.min(minY, sy); maxY = Math.max(maxY, sy);
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const onScreen = valid && width > 42 && height > 24 && maxX > rendererRect.left && minX < rendererRect.right && maxY > rendererRect.top && minY < rendererRect.bottom;
  if (!onScreen) {
    videoOverlay.style.display = 'none';
    return;
  }

  const clippedLeft = Math.max(rendererRect.left, minX);
  const clippedTop = Math.max(rendererRect.top, minY);
  const clippedRight = Math.min(rendererRect.right, maxX);
  const clippedBottom = Math.min(rendererRect.bottom, maxY);
  videoOverlay.style.display = 'block';
  videoOverlay.style.left = `${clippedLeft}px`;
  videoOverlay.style.top = `${clippedTop}px`;
  videoOverlay.style.width = `${Math.max(1, clippedRight - clippedLeft)}px`;
  videoOverlay.style.height = `${Math.max(1, clippedBottom - clippedTop)}px`;
  videoOverlay.style.opacity = `${THREE.MathUtils.clamp((width - 30) / 170, .55, 1)}`;
}

async function buildBillboards() {
  root = new THREE.Group();
  root.name = 'PUBLICIDAD_URBANA_V73';
  game.scene.add(root);

  // Carga las imágenes gradualmente para no crear un tirón al iniciar la ciudad.
  for (let i = 0; i < IMAGE_ADS.length; i++) {
    try {
      const texture = await loadTexture(IMAGE_ADS[i]);
      const placement = IMAGE_PLACEMENTS[i];
      const aspect = texture.image.width / Math.max(1, texture.image.height);
      const entry = createBillboard(texture, placement, { name: `CARTEL_IMAGEN_${i + 1}`, aspect });
      root.attach(entry.group);
      await new Promise(resolve => requestAnimationFrame(resolve));
    } catch (error) {
      console.warn(`[publicidad] No se pudo cargar el cartel ${i + 1}.`, error);
    }
  }

  const emptyTexture = createAdvertiseTexture();
  for (let i = 0; i < EMPTY_PLACEMENTS.length; i++) {
    const entry = createBillboard(emptyTexture, EMPTY_PLACEMENTS[i], { name: `CARTEL_ANUNCIATE_${i + 1}`, aspect: 2 });
    root.attach(entry.group);
  }

  const videoTexture = createVideoPlaceholderTexture();
  videoBillboard = createBillboard(videoTexture, VIDEO_PLACEMENT, {
    name: 'CARTEL_VIDEO_VIMEO',
    aspect: 16 / 9,
    bottom: 62
  });
  root.attach(videoBillboard.group);

  root.traverse(object => {
    object.frustumCulled = true;
    if (object.isMesh) object.castShadow = false;
  });

  window.__VICE_CITY_BILLBOARDS__ = {
    root,
    imageCount: IMAGE_ADS.length,
    advertiseCount: EMPTY_PLACEMENTS.length,
    video: videoBillboard,
    paypalUrl: PAYPAL_URL
  };
  window.__VICE_CITY_BILLBOARDS_READY__ = true;
  window.dispatchEvent(new CustomEvent('vice-city-billboards-ready'));
}

function animate(now) {
  if (!installed) return;
  projectVideoScreen(now || performance.now());
  requestAnimationFrame(animate);
}

async function install() {
  if (installed) return;
  game = await waitForGame();
  if (!game) {
    console.warn('[publicidad] No se encontró el juego principal.');
    return;
  }
  installed = true;
  await buildBillboards();
  requestAnimationFrame(animate);
}

install().catch(error => console.error('[publicidad] Error al instalar los carteles.', error));
