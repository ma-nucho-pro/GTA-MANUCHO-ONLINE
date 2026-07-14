/**
 * GTA MANUCHO V89 — carga secundaria escalonada sin bloquear la entrada.
 * Elimina extras de NPC/coches creados a mano y refuerza solo población nativa.
 */
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function idleRun(task, timeout = 1600) {
  return new Promise(resolve => {
    const run = async () => {
      try { await task(); } finally { resolve(); }
    };
    if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout });
    else setTimeout(run, 40);
  });
}

async function importFeature(path, label) {
  try {
    await import(path);
    return true;
  } catch (error) {
    console.error(`[GTA MANUCHO] No se pudo cargar ${label}.`, error);
    return false;
  }
}

async function waitForCity() {
  if (window.__VICE_CITY_REVEALED__) return;
  await Promise.race([
    new Promise(resolve => window.addEventListener('vice-city-revealed', resolve, { once: true })),
    delay(12000)
  ]);
}

function scheduleFeature(delayMs, path, label) {
  setTimeout(() => {
    void idleRun(() => importFeature(path, label));
  }, delayMs);
}

(async () => {
  await waitForCity();

  setTimeout(() => {
    void idleRun(async () => {
      await importFeature('./property-save-system.js?v=89', 'el sistema de partidas');
      await delay(120);
      await importFeature('./starter-house.js?v=89', 'la casa inicial');
    }, 1100);
  }, 350);

  // En vez de crear NPC/coches con Three.js, reforzamos únicamente la población nativa ya existente.
  scheduleFeature(4300, './native-population-boost.js?v=89', 'el refuerzo de población nativa');
  scheduleFeature(7100, './second-girlfriend-house.js?v=87', 'la casa de la segunda novia');
  scheduleFeature(9600, './city-billboards.js?v=87', 'los carteles publicitarios');
  scheduleFeature(12100, './boat-world-portal.js?v=87', 'la entrada a Mundo Barco');
})();
