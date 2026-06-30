/**
 * GTA MANUCHO V84 — presentación web aleatoria.
 * Creado por Roberto Manuel Jara Peche (GitHub: ma-nucho-pro) y ARKEA AI.
 * Conserva estos créditos al reutilizar el código. Consulta LICENSE y NOTICE.md.
 */
(() => {
  'use strict';

  const cover = {
    src: './docs/media/Portada.png',
    alt: 'Portada de GTA MANUCHO',
    caption: 'GTA MANUCHO · MUNDO ABIERTO'
  };
  const suppliedMedia = [
    { src: './docs/media/GTA-MANUCHO-1.png', alt: 'Captura 1 de GTA MANUCHO', caption: 'CIUDAD · ACCIÓN · EXPLORACIÓN' },
    { src: './docs/media/GTA-MANUCHO-2.png', alt: 'Captura 2 de GTA MANUCHO', caption: 'COCHES · CARRERAS · MISIONES' },
    { src: './docs/media/GTA-MANUCHO-3.png', alt: 'Captura 3 de GTA MANUCHO', caption: 'POLICÍA · BANDAS · COMBATE' },
    { src: './docs/media/GTA-MANUCHO-4.png', alt: 'Captura 4 de GTA MANUCHO', caption: 'MAR · NATACIÓN · BARCOS' },
    { src: './docs/media/GTA-MANUCHO-5.png', alt: 'Captura 5 de GTA MANUCHO', caption: 'AERONAVES · HELICÓPTEROS · TANQUES' },
    { src: './docs/media/GTA-MANUCHO-6.png', alt: 'Captura 6 de GTA MANUCHO', caption: 'PRIMERA Y TERCERA PERSONA' },
    { src: './docs/media/GTA-MANUCHO-7.png', alt: 'Captura 7 de GTA MANUCHO', caption: 'MAPA ABIERTO · DESCUBRE EL MUNDO' },
    { src: './docs/media/GTA-MANUCHO-8.png', alt: 'Captura 8 de GTA MANUCHO', caption: 'ARKEA AI PRESENTA' },
    { src: './docs/media/GTA-MANUCHO-9.png', alt: 'Captura 9 de GTA MANUCHO', caption: 'GTA MANUCHO · V84' },
    { src: './docs/media/GTA-MANUCHO-10.png', alt: 'Captura 10 de GTA MANUCHO', caption: 'CREADO POR ROBERTO MANUEL JARA PECHE' },
    { src: './docs/media/GTA-MANUCHO-VIDEO-1.webp', alt: 'Video animado 1 de GTA MANUCHO', caption: 'SECUENCIA CINEMATOGRÁFICA' },
    { src: './docs/media/GTA-MANUCHO-VIDEO-2.webp', alt: 'Video animado 2 de GTA MANUCHO', caption: 'ACCIÓN EN MOVIMIENTO' },
    { src: './docs/media/GTA-MANUCHO-VIDEO-3.webp', alt: 'Video animado 3 de GTA MANUCHO', caption: 'ENTRA AL MUNDO DE MANUCHO' }
  ];
  const fallbackMedia = Array.from({ length: 7 }, (_, index) => ({
    src: `./menu-animations/${index + 1}.webp`,
    alt: `Animación ${index + 1} de GTA MANUCHO`,
    caption: 'PREPARANDO GTA MANUCHO…'
  }));

  function shuffled(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const other = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[other]] = [copy[other], copy[index]];
    }
    return copy;
  }

  // La portada abre la presentación; las imágenes y los WebP entregados aparecen
  // después en un orden distinto en cada carga para dar una intro dinámica.
  const media = [cover, ...shuffled(suppliedMedia).slice(0, 10), ...shuffled(fallbackMedia).slice(0, 1)];
  const body = document.body;
  const root = document.getElementById('root');
  body.classList.add('gta-intro-active');

  const intro = document.createElement('div');
  intro.id = 'gta-manucho-intro';
  intro.innerHTML = `
    <img class="gta-intro-image" src="${media[0].src}" alt="${media[0].alt}" decoding="async" fetchpriority="high">
    <div class="gta-intro-vignette"></div>
    <div class="gta-intro-brand">
      <div class="gta-intro-kicker">ARKEA AI PRESENTA</div>
      <div class="gta-intro-title">GTA<br>MANUCHO</div>
      <div class="gta-intro-status" id="gta-intro-status">${media[0].caption}</div>
      <div class="gta-intro-progress"><span id="gta-intro-progress"></span></div>
      <div class="gta-intro-credit">CREADO POR ROBERTO MANUEL JARA PECHE · ma-nucho-pro</div>
    </div>
    <div class="gta-intro-skip">CLIC, ENTER O ESPACIO · OMITIR</div>`;
  body.appendChild(intro);

  let index = 0;
  let finishedSequence = false;
  let tutorialRequested = false;
  let interval = 0;
  const image = intro.querySelector('.gta-intro-image');
  const status = intro.querySelector('#gta-intro-status');
  const progress = intro.querySelector('#gta-intro-progress');

  function preload(nextIndex) {
    const item = media[nextIndex % media.length];
    if (!item) return;
    const next = new Image();
    next.decoding = 'async';
    next.src = item.src;
  }

  function showIndex(nextIndex) {
    index = Math.min(nextIndex, media.length - 1);
    const item = media[index];
    image.classList.add('gta-intro-switching');
    setTimeout(() => {
      image.src = item.src;
      image.alt = item.alt;
      image.classList.remove('gta-intro-switching');
      preload(index + 1);
    }, 160);
    progress.style.width = `${Math.round(((index + 1) / media.length) * 82)}%`;
    status.textContent = index < media.length - 1 ? item.caption : 'PREPARANDO LA SECUENCIA INICIAL…';
  }

  image.addEventListener('error', () => {
    const fallback = fallbackMedia[index % fallbackMedia.length];
    if (fallback && image.src !== new URL(fallback.src, location.href).href) image.src = fallback.src;
  });

  function appendScript(src, options = {}) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      if (options.module) script.type = 'module';
      script.async = false;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  function waitForTutorialReady(timeout = 15000) {
    const started = performance.now();
    return new Promise(resolve => {
      const check = () => {
        const ready = root && (root.querySelector('canvas') || root.children.length > 0);
        if (ready || performance.now() - started > timeout) return resolve(Boolean(ready));
        requestAnimationFrame(check);
      };
      check();
    });
  }

  async function startTutorial() {
    if (tutorialRequested) return;
    tutorialRequested = true;
    clearInterval(interval);
    status.textContent = 'CARGANDO LA SECUENCIA INICIAL…';
    progress.style.width = '88%';
    try {
      await appendScript('./assets/index-BSql1GU8-PIE-INVERTIDO-BICI-IGUAL-V14.js?v=84', { module: true });
      await appendScript('./tutorial-fixes.js?v=84');
      appendScript('./tutorial-rider-fix.js?v=84', { module: true }).catch(() => {});
      await waitForTutorialReady();
      progress.style.width = '100%';
      status.textContent = 'GTA MANUCHO V84';
      setTimeout(() => {
        body.classList.remove('gta-intro-active');
        intro.classList.add('gta-intro-hidden');
        setTimeout(() => intro.remove(), 800);
      }, 500);
    } catch (error) {
      console.error('[GTA MANUCHO V84] No se pudo iniciar la secuencia.', error);
      status.textContent = 'NO SE PUDO INICIAR. RECARGA LA PÁGINA.';
      status.classList.add('gta-intro-error');
    }
  }

  function finishSequence() {
    if (finishedSequence) return;
    finishedSequence = true;
    window.removeEventListener('keydown', skip, true);
    showIndex(media.length - 1);
    setTimeout(startTutorial, 850);
  }

  preload(1);
  progress.style.width = '8%';
  interval = window.setInterval(() => {
    if (index >= media.length - 1) return finishSequence();
    showIndex(index + 1);
  }, 1180);

  function skip(event) {
    if (event?.type === 'keydown' && !['Enter', 'Space'].includes(event.code)) return;
    event?.preventDefault?.();
    finishSequence();
  }
  intro.addEventListener('pointerdown', skip, { once: true });
  window.addEventListener('keydown', skip, true);
})();
