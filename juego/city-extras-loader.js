/**
 * GTA MANUCHO V84 — cargador de sistemas de ciudad.
 * Roberto Manuel Jara Peche · GitHub: ma-nucho-pro · ARKEA AI.
 * Licencia y atribución: consulta LICENSE y NOTICE.md.
 */
// V36: NPC y coches se preparan detrás de la transición. La ciudad solo se
// descubre cuando sus modelos, materiales y primeras animaciones ya están listos.

const overlay = document.getElementById('npc-city-loading-overlay');
const subtitle = overlay?.querySelector('.npc-loading-subtitle');
let overlayHidden = false;

function nextFrame() {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function idle(timeout = 1000) {
  return new Promise(resolve => {
    if ('requestIdleCallback' in window) requestIdleCallback(() => resolve(), { timeout });
    else setTimeout(resolve, Math.min(timeout, 180));
  });
}

function setStatus(text) {
  if (subtitle) subtitle.textContent = text;
}

async function waitForBaseCity() {
  const started = performance.now();
  while (performance.now() - started < 18000) {
    const game = window.__VICE_CITY_GAME__;
    if (game?.renderer && game?.scene && game?.camera && game?.playerContainer) {
      await nextFrame();
      await nextFrame();
      window.__VICE_BASE_CITY_READY__ = true;
      window.dispatchEvent(new CustomEvent('vice-base-city-ready'));
      return game;
    }
    await delay(50);
  }
  return window.__VICE_CITY_GAME__;
}

async function importSafely(path, label) {
  try {
    await import(path);
    return true;
  } catch (error) {
    console.error(`[city-extras] No se pudo iniciar ${label}.`, error);
    return false;
  }
}

async function waitForFlag(flagName, eventName, timeout) {
  if (window[flagName]) return;
  await Promise.race([
    new Promise(resolve => window.addEventListener(eventName, resolve, { once: true })),
    delay(timeout)
  ]);
}


async function preparePoliceBeforeReveal() {
  const game = window.__VICE_CITY_GAME__;
  if (!game || typeof game.performShoot !== 'function') return;

  const oldMessage = game.currentMessage;
  const oldWeapon = game.activeWeapon;
  const oldBullets = Array.isArray(game.bullets) ? game.bullets.slice() : [];
  const hadCrimeWorld = Boolean(game.crimeWorld);
  const previousWanted = Number(game.crimeWorld?.wantedLevel || 0);
  const previousWantedAge = Number(game.crimeWorld?.wantedAge || 0);
  try {
    // La clase policial está encapsulada en el juego base. Ejecutar una sola vez
    // el camino de creación mientras la transición está visible construye la
    // piscina de agentes, geometrías y materiales antes de cualquier delito real.
    if (!game.crimeWorld) game.performShoot();
    const world = game.crimeWorld;
    if (!world) return;

    // Se conserva la policía procedural ya construida y se bloquea la descarga
    // tardía del Stormtrooper remoto, que era el tirón al aparecer el VCPD.
    world.policeModelRequested = true;
    world.loadPoliceModel = () => {};
    world.loadGangModel = () => {};
    world.requestNearbyModels = () => {};

    // Elimina simulaciones secundarias del mismo sistema y deja solo los policías.
    for (const agent of world.gangAgents || []) agent?.root?.parent?.remove(agent.root);
    world.gangAgents = [];
    world.agents = [...(world.policeAgents || [])];
    world.clouds?.parent?.remove(world.clouds);
    world.birdFlock?.parent?.remove(world.birdFlock);
    world.updateClouds = () => {};
    world.updateBirds = () => {};

    world.wantedLevel = hadCrimeWorld ? previousWanted : 0;
    world.wantedAge = hadCrimeWorld ? previousWantedAge : 0;
    for (const officer of world.policeAgents || []) {
      officer.root.visible = false;
      officer.root.updateMatrixWorld(true);
    }
    window.__POLICE_PREPARED__ = true;
  } catch (error) {
    console.warn('[city-extras] No se pudo precargar completamente la policía.', error);
  } finally {
    // Retira el disparo técnico usado únicamente para construir el sistema.
    if (Array.isArray(game.bullets)) {
      for (const bullet of game.bullets) {
        if (!oldBullets.includes(bullet)) bullet?.mesh?.parent?.remove(bullet.mesh);
      }
      game.bullets.length = 0;
      game.bullets.push(...oldBullets);
    }
    game.currentMessage = oldMessage;
    game.activeWeapon = oldWeapon;
    game.updateHUDState?.();
  }
}


async function prewarmActualCityScene() {
  const game = window.__VICE_CITY_GAME__;
  const renderer = game?.renderer;
  const scene = game?.scene;
  const camera = game?.camera;
  if (!renderer || !scene || !camera) return;

  const roots = [
    ...(window.__CITY_NPCS__ || []).map(entry => entry?.root),
    window.__ARCADE_HALL__?.hall,
    window.__CITY_BIRDS__,
    ...(window.__CUSTOM_CARS__ || []).map(entry => entry?.root),
    ...((window.__VICE_CITY_GAME__?.crimeWorld?.policeAgents) || []).map(entry => entry?.root),
    ...((window.__AIRCRAFT_SYSTEM__?.aircraft) || []).map(entry => entry?.root),
    ...((window.__POLICE_RESPONSE__?.tanks) || []).map(entry => entry?.root),
    window.__V81_MARINE_WORLD__?.ocean,
    window.__V81_MARINE_WORLD__?.marineGroup,
    window.__V81_MARINE_WORLD__?.underwaterGroup
  ].filter(Boolean);
  if (!roots.length) return;

  const saved = [];
  const oldTarget = renderer.getRenderTarget?.() || null;
  let target = null;
  try {
    // Fuerza una única compilación con la iluminación, niebla y entorno reales de
    // GTA MANUCHO. Así los modelos no estrenan shaders cuando entran en pantalla.
    for (const root of roots) {
      saved.push({ object: root, visible: root.visible });
      root.visible = true;
      root.traverse?.(object => {
        if (!object.isMesh && !object.isSkinnedMesh) return;
        saved.push({ object, frustumCulled: object.frustumCulled });
        object.frustumCulled = false;
      });
    }

    if (typeof renderer.compileAsync === 'function') {
      try { await renderer.compileAsync(scene, camera); } catch {}
    } else if (typeof renderer.compile === 'function') {
      try { renderer.compile(scene, camera); } catch {}
    }

    const THREE = await import('./bosque/libs/three.module.js');
    target = new THREE.WebGLRenderTarget(24, 24, { depthBuffer: true, stencilBuffer: false });
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    await nextFrame();
  } catch (error) {
    console.warn('[city-extras] Precalentamiento final incompleto.', error);
  } finally {
    try { renderer.setRenderTarget(oldTarget); } catch {}
    try { target?.dispose?.(); } catch {}
    for (let i = saved.length - 1; i >= 0; i--) {
      const state = saved[i];
      if ('frustumCulled' in state) state.object.frustumCulled = state.frustumCulled;
      if ('visible' in state) state.object.visible = state.visible;
    }
  }
}

async function revealCity() {
  if (overlayHidden) return;
  // Dos fotogramas con todos los sistemas preparados estabilizan matrices y shaders.
  await nextFrame();
  await nextFrame();
  window.__VICE_CITY_REVEALED__ = true;
  window.dispatchEvent(new CustomEvent('vice-city-revealed'));
  overlay?.classList.add('ready');
  setTimeout(() => overlay?.remove(), 650);
  overlayHidden = true;
}

function scheduleIdle(task, timeout = 1500) {
  if ('requestIdleCallback' in window) requestIdleCallback(() => task(), { timeout });
  else setTimeout(() => task(), Math.min(timeout, 600));
}

async function bootExtras() {
  setStatus('Cargando la ciudad base…');
  await waitForBaseCity();

  setStatus('Activando modo fluido…');
  await waitForFlag('__VICE_PERFORMANCE_READY__', 'vice-performance-ready', 3500);

  // Solo las correcciones físicas principales se aplican antes de mostrar el juego.
  // Ya no se cargan decenas de GLB ni se compilan coches durante la transición.
  setStatus('Preparando el terreno principal…');
  await importSafely('./integrated-zones.js?v=49', 'las zonas del mapa');

  setStatus('Preparando respuesta policial fluida…');
  await preparePoliceBeforeReveal();

  // Los modelos que más pesan se decodifican detrás de la pantalla animada. Así
  // no aparecen congelamientos varios segundos después de comenzar a caminar.
  setStatus('Preparando vehículos sin congelamientos…');
  await importSafely('./custom-cars.js?v=82', 'los Ferrari de Three.js');
  await waitForFlag('__CUSTOM_CARS_READY__', 'custom-cars-ready', 10000);

  setStatus('Preparando personajes de la ciudad…');
  await importSafely('./city-npcs.js?v=84', 'los NPC adjuntados de Three.js');
  await waitForFlag('__CITY_NPCS_READY__', 'city-npcs-ready', 9000);

  setStatus('Preparando policía, bandas y vehículos de servicio…');
  await importSafely('./territory-combat.js?v=84', 'la policía, las bandas y los servicios');
  await waitForFlag('__TERRITORY_COMBAT_READY__', 'territory-combat-ready', 26000);

  // V84: el mar, los barcos y los vehículos especiales se decodifican detrás
  // de la pantalla de carga. Así no aparecen congelamientos al acercarse por
  // primera vez al océano, al tanque o al hangar de aeronaves.
  setStatus('Preparando el mar y los barcos…');
  await importSafely('./marine-world-v84.js?v=84', 'el mar Water, las islas y los barcos');
  await waitForFlag('__GTA_MARINE_READY__', 'gta-manucho-marine-ready', 32000);

  setStatus('Preparando helicópteros y aeronaves…');
  await importSafely('./aircraft-system.js?v=84', 'las aeronaves y el helicóptero');
  await waitForFlag('__AIRCRAFT_SYSTEM_READY__', 'aircraft-system-ready', 6000);
  try { await window.__AIRCRAFT_SYSTEM__?.ensureExhibit?.(); } catch {}
  await waitForFlag('__ARKEA_AIRCRAFT_EXHIBIT_READY__', 'arkea-aircraft-exhibit-ready', 24000);

  setStatus('Preparando el tanque…');
  await importSafely('./police-response.js?v=84', 'el tanque y la respuesta policial');
  await waitForFlag('__POLICE_RESPONSE_READY__', 'police-response-ready', 7000);
  try { await window.__POLICE_RESPONSE__?.ensureParkedTank?.(); } catch {}
  await waitForFlag('__ARKEA_TANK_READY__', 'arkea-tank-ready', 12000);

  setStatus('Optimizando la primera escena…');
  await prewarmActualCityScene();

  setStatus('Entrando a GTA MANUCHO…');
  await revealCity();

  // Sistemas ligeros escalonados después de mostrar la ciudad. No dependen de la
  // cercanía del jugador y se reparten en varios fotogramas para evitar congelar.
  // V48: los modelos Three.js aparecen gradualmente después de mostrar la ciudad.
  // Se carga una sola Michelle y un solo Ferrari; los clones se reparten entre
  // turnos libres para evitar una pausa grande de decodificación o clonación.
  scheduleIdle(() => importSafely('./castle-world.js?v=49', 'el castillo y su mundo'), 400);
  scheduleIdle(() => importSafely('./desert-world.js?v=49', 'el iglú DESERT y su portal'), 800);
  scheduleIdle(() => importSafely('./city-birds.js?v=49', 'las aves'), 1400);
  scheduleIdle(() => importSafely('./wanted-stars.js?v=65', 'las estrellas de reducción de búsqueda'), 1600);
  scheduleIdle(() => importSafely('./police-foot-behavior.js?v=84', 'el comportamiento terrestre de la policía'), 2200);
  scheduleIdle(() => importSafely('./weapon-crates.js?v=82', 'las cajas y armas del inventario Q'), 6800);
  scheduleIdle(() => importSafely('./fog-city-horses.js?v=82', 'Fog City y sus caballos'), 8200);
  scheduleIdle(() => importSafely('./fog-city-jetpack.js?v=82', 'el jetpack físico de Fog City'), 8700);
  scheduleIdle(() => importSafely('./girlfriend-house.js?v=61', 'la casa de la novia y las estadísticas'), 9400);
  scheduleIdle(() => importSafely('./arcade-hall.js?v=49', 'el salón de juegos'), 11200);
  scheduleIdle(() => importSafely('./coliseum.js?v=49', 'el coliseo de carreras'), 14200);

  // La respuesta policial ya se preparó detrás de la transición. No se programa
  // una segunda inicialización tardía que pueda congelar la partida.
}

bootExtras().catch(error => {
  console.error('[city-extras] Error de arranque.', error);
  revealCity();
});

// Salvaguarda: aunque falle un recurso, la transición nunca queda bloqueada.
setTimeout(() => revealCity(), 62000);
