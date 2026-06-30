/**
 * GTA MANUCHO V84 — código del proyecto.
 * Creado e integrado por Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * ARKEA AI / Manucho · conserva LICENSE, NOTICE.md y estos créditos al reutilizar.
 */
// GTA MANUCHO V82: los sistemas secundarios se cargan de forma escalonada para
// que la entrada a la ciudad no decodifique todos los modelos en el mismo frame.
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const idle = timeout => new Promise(resolve => {
  if ('requestIdleCallback' in window) requestIdleCallback(() => resolve(), { timeout });
  else setTimeout(resolve, Math.min(timeout, 350));
});

async function importFeature(path, label) {
  try {
    await idle(1200);
    await import(path);
  } catch (error) {
    console.error(`[GTA MANUCHO] No se pudo cargar ${label}.`, error);
  }
}

async function waitForCity() {
  if (window.__VICE_CITY_REVEALED__ || window.__VICE_BASE_CITY_READY__) return;
  await Promise.race([
    new Promise(resolve => window.addEventListener('vice-city-revealed', resolve, { once: true })),
    new Promise(resolve => window.addEventListener('vice-base-city-ready', resolve, { once: true })),
    delay(12000)
  ]);
}

(async () => {
  await waitForCity();
  await delay(500);
  await importFeature('./property-save-system.js?v=81', 'el sistema de partidas');
  await delay(450);
  await importFeature('./starter-house.js?v=81', 'la casa inicial');
  await delay(650);
  await importFeature('./v71-city-features.js?v=81', 'las misiones y personajes de ciudad');
  await delay(700);
  await importFeature('./second-girlfriend-house.js?v=81', 'la casa de la segunda novia');
  await delay(900);
  await importFeature('./city-billboards.js?v=81', 'los carteles publicitarios');

  // V82: se retiraron los coches cúbicos y peatones procedurales. La ciudad usa
  // únicamente los Ferrari y los NPC adjuntados, con distancia de dibujado.
  await delay(550);
  void importFeature('./boat-world-portal.js?v=82', 'la entrada a Mundo Barco');

  // V84: el mar, los barcos, el tanque y las aeronaves ya se prepararon detrás
  // de la pantalla de carga para evitar tirones al acercarse por primera vez.
})();
