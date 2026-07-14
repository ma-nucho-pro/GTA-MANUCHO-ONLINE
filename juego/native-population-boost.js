/**
 * GTA MANUCHO V89 — refuerzo de población nativa.
 * No crea NPC ni coches con Three.js: solo reutiliza el sistema original del juego.
 */

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
let installed = false;

function cleanupGeneratedExtras() {
  // Si por alguna migración antigua llegaron a cargarse extras manuales, se limpian.
  for (const actor of window.__V71_EXTRA_NPCS__ || []) {
    try { actor?.root?.parent?.remove(actor.root); } catch {}
  }
  for (const taxi of window.__V71_TAXIS__ || []) {
    try { taxi?.root?.parent?.remove(taxi.root); } catch {}
  }
  window.__V71_EXTRA_NPCS__ = [];
  window.__V71_TAXIS__ = [];
}

async function topUpNativePopulation(game) {
  if (!game) return;
  const npcCount = Array.isArray(game.npcs) ? game.npcs.length : 0;
  const trafficCount = Array.isArray(game.trafficCars) ? game.trafficCars.length : 0;
  const scatteredCount = Array.isArray(game.scatteredCarData) ? game.scatteredCarData.length : 0;

  if (!game.__nativeNpcBoosted && npcCount < 24 && typeof game.loadNPCAssets === 'function' && typeof game.spawnNPCs === 'function') {
    game.__nativeNpcBoosted = true;
    try {
      await game.loadNPCAssets();
      await wait(80);
      game.spawnNPCs();
    } catch (error) {
      console.warn('[native-population-boost] No se pudo reforzar NPC nativos.', error);
    }
  }

  if (!game.__nativeTrafficBoosted && trafficCount < 16 && typeof game.initTraffic === 'function') {
    game.__nativeTrafficBoosted = true;
    try {
      game.initTraffic();
    } catch (error) {
      console.warn('[native-population-boost] No se pudo reforzar tráfico nativo.', error);
    }
  }

  if (!game.__nativeScatteredBoosted && scatteredCount < 48 && typeof game.spawnScatteredCars === 'function') {
    game.__nativeScatteredBoosted = true;
    try {
      game.spawnScatteredCars();
    } catch (error) {
      console.warn('[native-population-boost] No se pudo reforzar coches del mapa.', error);
    }
  }
}

async function install() {
  if (installed) return;
  const game = window.__VICE_CITY_GAME__;
  if (!game?.scene || !game?.city || !game?.playerContainer || !game?.coreWorldReady) return;
  installed = true;
  cleanupGeneratedExtras();

  // Espera a que la entrada termine para evitar tirones iniciales.
  await wait(1300);
  await topUpNativePopulation(game);

  // Segundo relleno ligero, por si la ciudad nativa todavía iba completando sus tareas.
  await wait(2200);
  await topUpNativePopulation(game);

  window.__NATIVE_POPULATION_BOOST_READY__ = true;
}

const timer = setInterval(() => {
  void install();
  if (installed) clearInterval(timer);
}, 350);
setTimeout(() => clearInterval(timer), 30000);
