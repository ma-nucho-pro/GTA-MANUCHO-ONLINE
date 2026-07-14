/**
 * GTA MANUCHO V88 — arranque seguro del núcleo de la ciudad.
 * Usa el núcleo estable de V85 con una URL nueva para evitar caché dañada.
 */
const root = document.getElementById('root');
const loading = () => window.__GTA_LOADING__;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function hasStarted() {
  return Boolean(window.__VICE_CITY_GAME__ || root?.children?.length || document.querySelector('#game-canvas-container canvas, #root canvas'));
}

async function importCore(path, label) {
  loading()?.setStatus?.(label);
  loading()?.setProgress?.(24);
  await import(path);
  window.__GTA_CORE_MODULE_LOADED__ = true;
  window.dispatchEvent(new CustomEvent('gta-core-module-loaded'));
}

async function boot() {
  try {
    // Se importa sin query para que los módulos dinámicos (casa, NASA y otros)
    // reutilicen exactamente la misma instancia del núcleo y no creen otra ciudad.
    await importCore('./assets/index-CXrFrkSv.js', 'Iniciando la ciudad…');
    loading()?.setProgress?.(68);
    try { sessionStorage.removeItem('gta_manucho_v88_auto_retry'); } catch {}
    return;
  } catch (error) {
    console.error('[GTA MANUCHO V88] Falló el núcleo estable.', error);
    if (hasStarted()) {
      window.__GTA_CORE_MODULE_LOADED__ = true;
      window.dispatchEvent(new CustomEvent('gta-core-module-loaded'));
      return;
    }

    // Recuperación automática una sola vez. El servidor V88 obliga a revalidar
    // JavaScript, por lo que la recarga obtiene el archivo reparado y no V87.
    const retryKey = 'gta_manucho_v88_auto_retry';
    let alreadyRetried = false;
    try { alreadyRetried = sessionStorage.getItem(retryKey) === '1'; } catch {}
    if (!alreadyRetried) {
      try { sessionStorage.setItem(retryKey, '1'); } catch {}
      const url = new URL(location.href);
      url.searchParams.set('boot', Date.now().toString(36));
      location.replace(url.href);
      return;
    }

    loading()?.reveal?.('core-error');
    if (root && !root.children.length) {
      root.innerHTML = `
        <main style="position:fixed;inset:0;display:grid;place-items:center;background:#080503;color:#fff;font-family:Arial,sans-serif;padding:24px;text-align:center">
          <section style="max-width:620px;border-left:7px solid #ff870f;background:#140d08;padding:24px 28px;box-shadow:0 20px 70px #000">
            <h1 style="margin:0 0 12px;font:900 36px Impact,Arial,sans-serif">GTA <span style="color:#ff870f">MANUCHO</span></h1>
            <p style="margin:0;color:#ffd8a3;line-height:1.55">No se pudo abrir el motor 3D. Inicia el proyecto mediante <b>server.py</b> o <b>server.js</b>, no abriendo el HTML directamente.</p>
          </section>
        </main>`;
    }
  }
}

boot();
