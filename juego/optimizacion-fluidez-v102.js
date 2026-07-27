/**
 * GTA MANUCHO V102 — FLUIDEZ Y FIN DE LOS CONGELAMIENTOS
 * Autor e integración: Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * Marca: ARKEA AI / Manucho. Uso permitido conforme a LICENSE; conserva los créditos.
 *
 * Sustituye a optimizacion-fluidez-v101.js. No se quita ni se sustituye nada del
 * juego: siguen los mismos NPC, tráfico, bandas, policía, vehículos y mundos.
 * Cambia cuánto se dibuja de todo eso y, sobre todo, se atacan las tres causas
 * de que la pantalla se quede congelada unos instantes:
 *
 *   1. COMPILACIÓN DE SHADERS EN MITAD DE LA PARTIDA. Cuando un material se ve
 *      por primera vez, el navegador compila y enlaza su programa GLSL en ese
 *      mismo fotograma. Son entre 100 y 600 ms de pantalla parada. Se precompila
 *      por adelantado y en trozos.
 *   2. MILES DE LLAMADAS DE DIBUJO. El puente, por ejemplo, son cientos de
 *      cajitas sueltas (tirantes, farolas, bombillas). Se fusionan por material
 *      en una sola malla, conservando exactamente el mismo aspecto.
 *   3. PICOS SUELTOS. Un solo fotograma largo ya se nota como tirón, y la media
 *      de FPS tarda en enterarse. Ahora un fotograma de más de 55 ms baja la
 *      calidad al instante, sin esperar a la media.
 */
import * as THREE from './bosque/libs/three.module.js';

const WORLD_SCALE = 16;
let game = null;
let installed = false;

// ---------------------------------------------------------------------------
// NIVEL DE EQUIPO
// ---------------------------------------------------------------------------
function detectTier() {
  const cores = navigator.hardwareConcurrency || 2;
  const ram = typeof navigator.deviceMemory === 'number' ? navigator.deviceMemory : 4;
  const dpr = window.devicePixelRatio || 1;
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');

  let score = 0;
  if (cores >= 8) score += 2; else if (cores >= 4) score += 1;
  if (ram >= 8) score += 2; else if (ram >= 4) score += 1;
  if (!mobile) score += 1;
  if (dpr <= 1.5) score += 1;

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    const info = gl?.getExtension('WEBGL_debug_renderer_info');
    const name = (info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : '') || '';
    if (/RTX|Radeon RX|Arc A|Apple M[1-9]/i.test(name)) score += 3;
    else if (/GTX|Radeon|Iris Xe/i.test(name)) score += 1;
    else if (/Intel.*(HD|UHD) Graphics|Mali|Adreno|PowerVR|SwiftShader|Software/i.test(name)) score -= 2;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {}

  if (score <= 1) return 'bajo';
  if (score <= 4) return 'medio';
  return 'alto';
}

// Arranque deliberadamente prudente: es mucho mejor empezar fluido y subir
// calidad al comprobar que la máquina aguanta, que empezar bonito y a tirones.
const TIERS = {
  bajo:  { ratio: 0.66, cull: 1050 * WORLD_SCALE, far: 24000, reflection: false, rockDetail: 0,               rockView: 110 * WORLD_SCALE },
  medio: { ratio: 0.86, cull: 1450 * WORLD_SCALE, far: 28000, reflection: false, rockDetail: 34 * WORLD_SCALE, rockView: 165 * WORLD_SCALE },
  // V110: el reflejo del agua queda apagado también en equipos buenos. Vuelve a
  // dibujar la escena ENTERA en un segundo pase, y eso cuesta más que cualquier
  // otra cosa que se pueda recortar.
  alto:  { ratio: 1.0,  cull: 1700 * WORLD_SCALE, far: 30000, reflection: false, rockDetail: 42 * WORLD_SCALE, rockView: 170 * WORLD_SCALE }
};

const LIMITS = {
  ratioMin: 0.5,  ratioMax: 1.25,
  cullMin: 800 * WORLD_SCALE, cullMax: 2400 * WORLD_SCALE
};

let tier = 'medio';
let target = TIERS.medio;
let currentRatio = 1;
let currentCull = TIERS.medio.cull;
let rawSetPixelRatio = null;
let reflectionsOn = true;
let quality = 1;            // 0 = mínimo, 1 = el del nivel detectado

// ---------------------------------------------------------------------------
// RESOLUCIÓN INTERNA (un solo dueño)
// ---------------------------------------------------------------------------
function ownPixelRatio(renderer) {
  if (renderer.__v101RatioOwned) return;
  renderer.__v101RatioOwned = true;
  rawSetPixelRatio = renderer.setPixelRatio.bind(renderer);
  renderer.setPixelRatio = function v102SetPixelRatio(value) {
    const asked = Number(value) || 1;
    rawSetPixelRatio(THREE.MathUtils.clamp(Math.min(asked, currentRatio), LIMITS.ratioMin, LIMITS.ratioMax));
  };
}

function applyRatio(value) {
  const next = THREE.MathUtils.clamp(value, LIMITS.ratioMin, LIMITS.ratioMax);
  if (Math.abs(next - currentRatio) < 0.015) return false;
  currentRatio = next;
  rawSetPixelRatio(next);
  game.renderer.setSize(window.innerWidth, window.innerHeight, false);
  return true;
}

function applyCull(value) {
  const next = THREE.MathUtils.clamp(value, LIMITS.cullMin, LIMITS.cullMax);
  if (Math.abs(next - currentCull) < WORLD_SCALE * 40) return false;
  currentCull = next;
  game.cullDistance = next;
  game.cullScanAnchor?.set?.(999999, 999999, 999999);
  game.cullScanPending = false;
  game.cullScanCursor = 0;
  return true;
}

// ---------------------------------------------------------------------------
// CULLING QUE TIENE EN CUENTA EL TAMAÑO DEL OBJETO
// ---------------------------------------------------------------------------
function installSmartCulling() {
  if (!game.city || game.__v101SmartCulling) return;
  game.__v101SmartCulling = true;

  const anchor = new THREE.Vector3(1e9, 1e9, 1e9);
  const box = new THREE.Box3();
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  let cursor = 0;
  let pending = false;
  const RESCAN = 700;

  game.processIncrementalVisibilityCulling = function v102Culling() {
    if (!this.city || !this.playerContainer) return;
    const player = this.playerContainer.position;

    if (!pending && player.distanceToSquared(anchor) > RESCAN * RESCAN) {
      anchor.copy(player); cursor = 0; pending = true;
    }
    if (!pending) return;

    const children = this.city.children;
    const limit = this.cullDistance;
    const started = performance.now();
    let processed = 0;
    let measuring = 5;

    while (cursor < children.length && processed < 140 && performance.now() - started < 1.0) {
      const child = children[cursor++];
      processed++;
      if (!child) continue;

      if (child._v101r === undefined) {
        if (measuring-- <= 0) { cursor--; break; }
        try {
          box.setFromObject(child);
          if (Number.isFinite(box.min.x) && box.min.x <= box.max.x) {
            box.getSize(size); box.getCenter(center);
            // V103: se guarda el DESPLAZAMIENTO respecto al objeto, no la
            // posición absoluta. Antes se guardaba el centro fijo y para todo
            // lo que se mueve (policía, NPC, coches) quedaba obsoleto al
            // instante: se ocultaba y se mostraba según dónde ESTUVO. Eso era
            // el parpadeo de los policías.
            child._v101ox = center.x - child.position.x;
            child._v101oz = center.z - child.position.z;
            child._v101r = Math.hypot(size.x, size.z) * 0.5;
          } else {
            child._v101ox = 0; child._v101oz = 0; child._v101r = 0;
          }
        } catch {
          child._v101ox = 0; child._v101oz = 0; child._v101r = 0;
        }
        const name = (child.name || '').toLowerCase();
        child._v101always = name.includes('ground') || name.includes('water') ||
          name.includes('ocean') || name.includes('foundation') || name.includes('island') ||
          name.includes('isla') || name.includes('sky') || name.includes('puente') || name.includes('bridge') ||
          // Nada que se mueva o que sea un personaje entra en el descarte por
          // distancia: de eso ya se encarga el frustum de la propia tarjeta.
          name.includes('polic') || name.includes('npc') || name.includes('ped') ||
          name.includes('soldier') || name.includes('gang') || name.includes('banda') ||
          name.includes('traffic') || name.includes('trafico') || name.includes('car') ||
          name.includes('coche') || name.includes('moto') || name.includes('bike') ||
          name.includes('horse') || name.includes('caballo') || name.includes('online');
        if (!child._v101always && child.userData) {
          child._v101always = Boolean(child.userData.isNPC || child.userData.isVehicle ||
            child.userData.dynamic || child.userData.v95BikeEntry || child.userData.v81BoatEntry);
        }
        // Un objeto con animación propia tampoco se toca.
        if (!child._v101always && child.animations?.length) child._v101always = true;
      }

      if (child._v101always) { if (!child.visible) child.visible = true; continue; }

      // El centro se recalcula en vivo a partir de la posición actual.
      const dx = child.position.x + child._v101ox - player.x;
      const dz = child.position.z + child._v101oz - player.z;
      // Margen de histéresis: sin él, un objeto justo en el borde entra y sale
      // en fotogramas alternos y se ve como un parpadeo.
      const reach = limit + child._v101r + (child.visible ? 900 : 0);
      const should = dx * dx + dz * dz <= reach * reach;
      if (child.visible !== should) child.visible = should;
    }

    if (cursor >= children.length) { pending = false; cursor = 0; }
  };
}

// ---------------------------------------------------------------------------
// PRECOMPILADO DE SHADERS  (contra los congelamientos al descubrir algo nuevo)
// ---------------------------------------------------------------------------
let precompiling = false;

async function precompileScene(reason) {
  if (precompiling || !game?.renderer || !game?.scene || !game?.camera) return;
  precompiling = true;
  try {
    if (typeof game.renderer.compileAsync === 'function') {
      await game.renderer.compileAsync(game.scene, game.camera);
    } else {
      game.renderer.compile(game.scene, game.camera);
    }
    console.log(`[fluidez-v102] shaders precompilados (${reason})`);
  } catch (error) {
    console.warn('[fluidez-v102] precompilado omitido', error);
  } finally {
    precompiling = false;
  }
}

// ---------------------------------------------------------------------------
// REFLEJO DEL AGUA Y DETALLE DE LAS ROCAS
// ---------------------------------------------------------------------------
// V112: ESTO NO FUNCIONABA. Al instalar el módulo, el mundo marino todavía no
// se ha cargado, así que "ocean" era undefined, la función se salía por aquí y
// reflectionsOn se quedaba en true PARA SIEMPRE. En el log del usuario se veía:
// "reflejo=true" en un equipo donde debía estar apagado. El reflejo vuelve a
// dibujar la escena entera en un segundo pase: por eso los 54 millones de
// triángulos se convertían en 108.
// Ahora, si el océano aún no existe, se recuerda la intención y se reintenta.
let pendingReflection = null;

function setReflections(enabled) {
  if (enabled === reflectionsOn) return;
  const ocean = (window.__V100_MARINE_WORLD__ || window.__V84_MARINE_WORLD__ || window.__V81_MARINE_WORLD__)?.ocean;
  if (!ocean) { pendingReflection = enabled; return; }
  pendingReflection = null;
  if (!enabled) {
    if (!ocean.__v101Hook) ocean.__v101Hook = ocean.onBeforeRender;
    ocean.onBeforeRender = () => {};
  } else if (ocean.__v101Hook) {
    ocean.onBeforeRender = ocean.__v101Hook;
  }
  reflectionsOn = enabled;
}

function applyRockQuality() {
  const rocks = window.__GTA_MANUCHO_ROCAS__;
  if (!rocks?.setDetailDistance) return;
  rocks.setDetailDistance(target.rockDetail * quality);
  rocks.setViewDistance(Math.max(70 * WORLD_SCALE, target.rockView * (0.55 + 0.45 * quality)));
}

// ---------------------------------------------------------------------------
// GOBERNADOR
// ---------------------------------------------------------------------------
const history = [];
let sampleStart = 0;
let frames = 0;
let lastAdjust = 0;
let lastFrameStamp = 0;
let spikes = 0;

// Baja un escalón de calidad. El orden va de lo que menos se nota a lo que más.
function stepDown(hard) {
  const step = hard ? 2 : 1;
  for (let i = 0; i < step; i++) {
    if (quality > 0.05) { quality = Math.max(0, quality - 0.34); applyRockQuality(); continue; }
    if (reflectionsOn) { setReflections(false); continue; }
    if (currentCull > LIMITS.cullMin + WORLD_SCALE * 50) { applyCull(currentCull - 200 * WORLD_SCALE); continue; }
    if (currentRatio > LIMITS.ratioMin + 0.02) { applyRatio(currentRatio - 0.08); continue; }
    break;
  }
}

function stepUp() {
  if (currentRatio < target.ratio - 0.02) { applyRatio(currentRatio + 0.03); return; }
  if (currentCull < target.cull) { applyCull(currentCull + 110 * WORLD_SCALE); return; }
  if (quality < 1) { quality = Math.min(1, quality + 0.2); applyRockQuality(); return; }
  if (target.reflection && !reflectionsOn) setReflections(true);
}

// V110: MODO DE EMERGENCIA. Si los FPS se hunden y ya no queda calidad que
// recortar, se apagan las rocas enteras. Es lo último que se sacrifica y lo
// primero que vuelve en cuanto el equipo respira.
let emergency = false;

function setEmergency(on) {
  if (on === emergency) return;
  emergency = on;
  const rocks = window.__GTA_MANUCHO_ROCAS__;
  if (rocks?.group) rocks.group.visible = !on;
  console.log(on ? '[fluidez-v110] Emergencia: rocas ocultas para recuperar FPS.'
                 : '[fluidez-v110] Emergencia desactivada: rocas de vuelta.');
}

function governor() {
  requestAnimationFrame(governor);
  const now = performance.now();

  // Reintento del reflejo: en cuanto aparezca el océano se aplica lo pedido.
  if (pendingReflection !== null) {
    const want = pendingReflection;
    reflectionsOn = !want;      // fuerza que setReflections no se salga
    setReflections(want);
  }

  if (document.hidden) { sampleStart = now; lastFrameStamp = now; frames = 0; return; }

  // Detector de picos: un solo fotograma largo ya se percibe como congelamiento,
  // y esperar a la media de FPS llega demasiado tarde. Los primeros fotogramas
  // tras cargar algo se ignoran, que siempre son lentos por naturaleza.
  const frameCost = lastFrameStamp ? now - lastFrameStamp : 0;
  lastFrameStamp = now;
  if (frameCost > 55 && frameCost < 900) {
    spikes++;
    if (spikes >= 2 && now - lastAdjust > 700) {
      lastAdjust = now;
      spikes = 0;
      stepDown(frameCost > 130);
    }
  } else if (spikes > 0 && frameCost < 24) {
    spikes = 0;
  }

  frames++;
  const elapsed = now - sampleStart;
  if (elapsed < 1000) return;

  const fps = (frames * 1000) / elapsed;
  frames = 0;
  sampleStart = now;
  history.push(fps);
  if (history.length > 5) history.shift();
  window.__V101_FPS__ = Math.round(fps);

  if (now - lastAdjust < 1200) return;
  const avg = history.reduce((a, b) => a + b, 0) / history.length;

  // V112: nada de emergencia durante los primeros 35 segundos. Al arrancar los
  // FPS son 0 porque se está cargando, no porque el equipo no pueda.
  const loading = now < 35000;
  if (avg < 26 && !loading) { lastAdjust = now; stepDown(true); setEmergency(true); }
  else if (avg < 32 && !loading) { lastAdjust = now; stepDown(true); }
  else if (avg < 46 && !loading) { lastAdjust = now; stepDown(false); }
  else if (avg > 50 && emergency) { lastAdjust = now; setEmergency(false); }
  else if (avg > 57 && history.length >= 3) { lastAdjust = now; stepUp(); }
}

// ---------------------------------------------------------------------------
// AJUSTES DE UNA SOLA VEZ
// ---------------------------------------------------------------------------
function tuneRenderer() {
  const renderer = game.renderer;
  renderer.shadowMap.enabled = false;
  renderer.shadowMap.autoUpdate = false;
  if (game.dLight) game.dLight.castShadow = false;
  if (game.camera && game.camera.far > target.far) {
    game.camera.far = target.far;
    game.camera.updateProjectionMatrix();
  }
}

function capTextures() {
  const renderer = game.renderer;
  const maxAnisotropy = tier === 'bajo' ? 1 : Math.min(4, renderer.capabilities?.getMaxAnisotropy?.() || 1);
  const seen = new Set();
  const pending = [game.scene];
  let budget = 6000;
  while (pending.length && budget-- > 0) {
    const node = pending.pop();
    if (!node || seen.has(node)) continue;
    seen.add(node);
    if (node.children?.length) pending.push(...node.children);
    if (!node.isMesh && !node.isSkinnedMesh) continue;
    node.frustumCulled = true;
    node.castShadow = false;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of materials) {
      if (!material) continue;
      for (const key of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap']) {
        const texture = material[key];
        if (!texture || texture.__v101Capped) continue;
        texture.__v101Capped = true;
        texture.anisotropy = Math.min(texture.anisotropy || 1, maxAnisotropy);
      }
    }
  }
}

function exposeBudget() {
  window.__V101_FRAME_BUDGET__ = {
    get fps() { return window.__V101_FPS__ || 60; },
    get tier() { return tier; },
    overBudget() { return (window.__V101_FPS__ || 60) < 40; },
    stats() {
      const info = game?.renderer?.info;
      return {
        fps: window.__V101_FPS__ || 0,
        equipo: tier,
        calidad: Number(quality.toFixed(2)),
        resolucion: Number(currentRatio.toFixed(2)),
        distancia: Math.round(currentCull),
        reflejo: reflectionsOn,
        detalleRocas: Math.round(window.__GTA_MANUCHO_ROCAS__?.detailDistance || 0),
        drawCalls: info?.render?.calls ?? 0,
        triangulos: info?.render?.triangles ?? 0,
        programas: info?.programs?.length ?? 0
      };
    }
  };
}

const idle = (fn, timeout) => ('requestIdleCallback' in window
  ? requestIdleCallback(fn, { timeout })
  : setTimeout(fn, Math.min(timeout, 250)));

function install() {
  if (installed || !game?.renderer || !game?.scene) return;
  installed = true;

  tier = detectTier();
  target = TIERS[tier] || TIERS.medio;

  ownPixelRatio(game.renderer);
  currentRatio = Math.min(window.devicePixelRatio || 1, target.ratio);
  rawSetPixelRatio(THREE.MathUtils.clamp(currentRatio, LIMITS.ratioMin, LIMITS.ratioMax));

  currentCull = game.cullDistance || target.cull;
  tuneRenderer();
  installSmartCulling();
  applyCull(target.cull);
  if (!target.reflection) setReflections(false);
  exposeBudget();

  idle(capTextures, 1500);


  window.addEventListener('vice-city-revealed', () => {
    // Sólo una compilación, y bien tarde: cuando ya se ha dejado de cargar.
    idle(capTextures, 1800);
    setTimeout(() => precompileScene('ciudad'), 30000);
  }, { once: true });
  window.addEventListener('gta-manucho-rocas-ready', () => applyRockQuality());


  // V103: vigilante de contenido nuevo. Los congelamientos al aparecer la
  // policía, al cambiar el clima o al conectarse alguien son la primera
  // compilación del shader de ese material, que ocurre dentro del fotograma en
  // que se ve. Si la escena crece, se recompila en segundo plano: para lo que
  // ya está compilado es casi gratis, y lo nuevo deja de congelar la pantalla.
  // V106: sólo se recompila cuando aparecen MATERIALES nuevos, no cuando crece
  // el número de objetos. Con NPC apareciendo sin parar el contador de hijos
  // sube siempre, y en el log se veía "shaders precompilados" una y otra vez:
  // compileAsync recorriendo la escena entera cada dos segundos costaba más de
  // lo que ahorraba. Ahora se lleva la cuenta de los materiales ya vistos y
  // además hay un mínimo de 20 segundos entre compilaciones.
  const seenMaterials = new Set();
  let lastPrecompile = 0;
  setInterval(() => {
    if (!game?.scene || document.hidden) return;
    // V108: en el log salía seis veces durante la carga. Cada llamada recorre
    // la escena entera y es cara: durante los primeros 45 segundos, cuando todo
    // está cargando de todas formas, no se toca nada.
    if (performance.now() < 45000) return;
    if (performance.now() - lastPrecompile < 45000) return;
    let fresh = 0;
    let budget = 1200;
    const stack = [game.scene];
    while (stack.length && budget-- > 0) {
      const node = stack.pop();
      if (!node) continue;
      if (node.children?.length) stack.push(...node.children);
      const materials = Array.isArray(node.material) ? node.material : (node.material ? [node.material] : null);
      if (!materials) continue;
      for (const material of materials) {
        if (!material || seenMaterials.has(material.uuid)) continue;
        seenMaterials.add(material.uuid);
        fresh++;
      }
    }
    if (fresh >= 25) {
      lastPrecompile = performance.now();
      precompileScene(`${fresh} materiales nuevos`);
    }
  }, 4000);

  // El nivel de búsqueda es el momento típico de tirón: se precompila antes.
  let lastWanted = 0;
  setInterval(() => {
    const wanted = Number(game?.crimeWorld?.getWantedLevel?.() ?? game?.wantedLevel ?? 0);
    if (wanted > 0 && lastWanted === 0) precompileScene('policía');
    lastWanted = wanted;
  }, 1200);

  // V111: el diagnóstico ahora SEPARA el tiempo de dibujar del resto del
  // fotograma. Es el dato que llevo pidiendo y que lo cambia todo:
  //   · si "dibujo" se lleva casi todo el fotograma, el cuello es la tarjeta
  //     gráfica y hay que recortar geometría, resolución o distancia;
  //   · si "dibujo" es pequeño y aun así el fotograma es largo, el cuello es el
  //     procesador: son los NPC, la física y la lógica de los módulos.
  // Se mide envolviendo render() y cronometrándolo, sin cambiar nada más.
  let renderMs = 0;
  let renderCount = 0;
  const renderer = game.renderer;
  const nativeRender = renderer.render.bind(renderer);
  renderer.render = function v111TimedRender(scene, camera) {
    const t0 = performance.now();
    const out = nativeRender(scene, camera);
    renderMs += performance.now() - t0;
    renderCount++;
    return out;
  };

  let lastReport = performance.now();
  setInterval(() => {
    if (document.hidden) return;
    const now = performance.now();
    const elapsed = now - lastReport;
    const st = window.__V101_FRAME_BUDGET__?.stats?.();
    if (st && renderCount) {
      const perFrameRender = renderMs / renderCount;
      const perFrameTotal = elapsed / renderCount;
      const share = Math.round((perFrameRender / perFrameTotal) * 100);
      console.log(
        `[fluidez-v111] ${st.fps} fps · fotograma ${perFrameTotal.toFixed(1)} ms ` +
        `(dibujo ${perFrameRender.toFixed(1)} ms = ${share} %) · ` +
        `${st.drawCalls} llamadas · ${(st.triangulos / 1000).toFixed(0)}k triángulos · ` +
        `cuello: ${share > 60 ? 'TARJETA GRÁFICA' : 'PROCESADOR'}`
      );
    }
    renderMs = 0; renderCount = 0; lastReport = now;
  }, 15000);

  applyRockQuality();
  sampleStart = performance.now();
  lastFrameStamp = sampleStart;
  requestAnimationFrame(governor);

  console.log(`[fluidez-v102] equipo=${tier} resolución=${currentRatio.toFixed(2)} distancia=${Math.round(currentCull)} lejano=${game.camera?.far} reflejo=${reflectionsOn}`);
  window.__V101_PERFORMANCE_READY__ = true;
  window.dispatchEvent(new CustomEvent('v101-performance-ready'));
}

const wait = setInterval(() => {
  game = window.__VICE_CITY_GAME__ || game;
  if (!game?.renderer || !game?.scene) return;
  clearInterval(wait);
  install();
}, 60);
setTimeout(() => clearInterval(wait), 40000);
