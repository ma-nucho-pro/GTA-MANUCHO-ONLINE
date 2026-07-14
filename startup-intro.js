/**
 * GTA MANUCHO V88 — intro cinematográfica estilo GTA.
 * Creado por Roberto Manuel Jara Peche (GitHub: ma-nucho-pro) y ARKEA AI.
 * Conserva estos créditos al reutilizar el código. Consulta LICENSE y NOTICE.md.
 */
(() => {
  'use strict';

  const cover = {
    src: './docs/media/Portada.png',
    alt: 'Portada de GTA MANUCHO',
    zone: 'Ciudad Manucho',
    brief: 'Año presente. Una ciudad abierta, sin reglas.\nTú decides cómo empezar tu historia.'
  };
  const suppliedMedia = [
    { src: './docs/media/GTA-MANUCHO-1.png', alt: 'Captura 1', zone: 'Centro de la ciudad', brief: 'Explora cada calle. Cada esquina esconde algo.' },
    { src: './docs/media/GTA-MANUCHO-2.png', alt: 'Captura 2', zone: 'Avenida principal', brief: 'Roba un coche. Pisa el acelerador.\nLa policía no perdona.' },
    { src: './docs/media/GTA-MANUCHO-3.png', alt: 'Captura 3', zone: 'Territorio en disputa', brief: 'Bandas, estrellas de búsqueda y la VCPD tras tus pasos.' },
    { src: './docs/media/GTA-MANUCHO-4.png', alt: 'Captura 4', zone: 'Costa del Pacífico', brief: 'Nada mar adentro. Roba un barco.\nCuidado con lo que nada debajo.' },
    { src: './docs/media/GTA-MANUCHO-5.png', alt: 'Captura 5', zone: 'Espacio aéreo restringido', brief: 'Helicópteros, aeronaves y tanques.\nEl cielo también es tuyo.' },
    { src: './docs/media/GTA-MANUCHO-6.png', alt: 'Captura 6', zone: 'Modo cámara libre', brief: 'Primera o tercera persona. Tú eliges cómo ver el caos.' },
    { src: './docs/media/GTA-MANUCHO-7.png', alt: 'Captura 7', zone: 'Mapa abierto', brief: 'Museo, bosque, coliseo, castillo, desierto…\nMundos dentro del mundo.' },
    { src: './docs/media/GTA-MANUCHO-8.png', alt: 'Captura 8', zone: 'ARKEA AI presenta', brief: 'Un mundo creado por una sola persona y mucha ambición.' },
    { src: './docs/media/GTA-MANUCHO-9.png', alt: 'Captura 9', zone: 'GTA MANUCHO · V88', brief: 'Ahora con MODO ONLINE.\nJuega con tus amigos en el mismo servidor.' },
    { src: './docs/media/GTA-MANUCHO-10.png', alt: 'Captura 10', zone: 'Roberto Manuel Jara Peche', brief: 'Historia, código y mundo por ma-nucho-pro.' },
    { src: './docs/media/GTA-MANUCHO-VIDEO-1.webp', alt: 'Video 1', zone: 'Secuencia cinematográfica', brief: 'Todo empieza con un tutorial.\nDespués, la ciudad es tuya.' },
    { src: './docs/media/GTA-MANUCHO-VIDEO-2.webp', alt: 'Video 2', zone: 'Acción en movimiento', brief: 'Corre. Conduce. Dispara. Sobrevive.' },
    { src: './docs/media/GTA-MANUCHO-VIDEO-3.webp', alt: 'Video 3', zone: 'Bienvenido a Manucho', brief: 'Pulsa ENTER cuando estés listo.' }
  ];
  const fallbackMedia = Array.from({ length: 7 }, (_, index) => ({
    src: `./menu-animations/${index + 1}.webp`,
    alt: `Animación ${index + 1}`,
    zone: 'Preparando GTA MANUCHO…',
    brief: 'Cargando el mundo…'
  }));

  function shuffled(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const other = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[other]] = [copy[other], copy[index]];
    }
    return copy;
  }

  const media = [cover, ...shuffled(suppliedMedia).slice(0, 9), ...shuffled(fallbackMedia).slice(0, 1)];

  // V87: descarga anticipadamente solo la entrada ligera del juego mientras el
  // usuario ve la introducción y el tutorial. No crea una segunda escena WebGL.
  function warmGameEntry() {
    const resources = [
      { rel: 'modulepreload', href: './juego/assets/index-CXrFrkSv.js' },
      { rel: 'modulepreload', href: './juego/performance-boost.js?v=88' },
      { rel: 'preload', href: './juego/assets/index-Bm4n6MBW.css', as: 'style' },
      { rel: 'preload', href: './juego/game-loading-v88.css', as: 'style' },
      { rel: 'prefetch', href: './juego/index.html?noprogressive=1&v=88', as: 'document' }
    ];
    for (const resource of resources) {
      if (document.head.querySelector(`link[href="${resource.href}"]`)) continue;
      const link = document.createElement('link');
      link.rel = resource.rel;
      link.href = resource.href;
      if (resource.as) link.as = resource.as;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  }
  warmGameEntry();

  const body = document.body;
  const root = document.getElementById('root');
  body.classList.add('gta-intro-active');

  const intro = document.createElement('div');
  intro.id = 'gta-manucho-intro';
  intro.innerHTML = `
    <img class="gta-intro-image" src="${media[0].src}" alt="${media[0].alt}" decoding="async" fetchpriority="high">
    <div class="gta-intro-vignette"></div>
    <div class="gta-intro-grain"></div>
    <div class="gta-intro-bar top"></div>
    <div class="gta-intro-bar bottom"></div>
    <div class="gta-intro-brand">
      <div class="gta-intro-kicker">ARKEA AI PRESENTA</div>
      <div class="gta-intro-title">GTA<br><em>MANUCHO</em></div>
      <div class="gta-intro-brief" id="gta-intro-brief"></div>
      <div class="gta-intro-progress"><span id="gta-intro-progress"></span></div>
      <div class="gta-intro-status" id="gta-intro-status"></div>
      <div class="gta-intro-credit">CREADO POR ROBERTO MANUEL JARA PECHE · ma-nucho-pro · V88 ONLINE</div>
    </div>
    <div class="gta-intro-zone" id="gta-intro-zone">${media[0].zone}</div>
    <div class="gta-intro-skip">ENTER / CLIC · SALTAR CINEMÁTICA</div>`;
  body.appendChild(intro);

  let index = 0;
  let finishedSequence = false;
  let tutorialRequested = false;
  let interval = 0;
  let typeTimer = 0;
  const image = intro.querySelector('.gta-intro-image');
  const status = intro.querySelector('#gta-intro-status');
  const progress = intro.querySelector('#gta-intro-progress');
  const zone = intro.querySelector('#gta-intro-zone');
  const brief = intro.querySelector('#gta-intro-brief');

  // Efecto máquina de escribir para el briefing de misión.
  function typeBrief(text) {
    clearInterval(typeTimer);
    brief.textContent = '';
    let position = 0;
    typeTimer = window.setInterval(() => {
      position += 2;
      brief.textContent = text.slice(0, position);
      if (position >= text.length) clearInterval(typeTimer);
    }, 22);
  }

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
    }, 200);
    progress.style.width = `${Math.round(((index + 1) / media.length) * 82)}%`;
    zone.style.animation = 'none';
    void zone.offsetWidth;
    zone.style.animation = '';
    zone.textContent = item.zone;
    typeBrief(index < media.length - 1 ? item.brief : 'Preparando el tutorial de inicio…');
    status.textContent = '';
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

  function appendStyle(href) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
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

  // gta-v86-root-safety: evita que el tutorial quede invisible por un recurso lento.
  setTimeout(() => body.classList.remove('gta-intro-active'), 22000);

  async function startTutorial() {
    if (tutorialRequested) return;
    tutorialRequested = true;
    clearInterval(interval);
    status.textContent = 'PREPARANDO EL TUTORIAL…';
    progress.style.width = '88%';
    try {
      // Reskin GTA del tutorial: elimina la paleta azul/cian del interfaz.
      appendStyle('./tutorial-gta-reskin.css?v=88');
      await appendScript('./assets/index-BSql1GU8-PIE-INVERTIDO-BICI-IGUAL-V14.js?v=88', { module: true });
      await appendScript('./tutorial-fixes.js?v=88');
      appendScript('./tutorial-rider-fix.js?v=88', { module: true }).catch(() => {});
      await waitForTutorialReady();
      progress.style.width = '100%';
      status.textContent = 'GTA MANUCHO V88';
      setTimeout(() => {
        body.classList.remove('gta-intro-active');
        intro.classList.add('gta-intro-hidden');
        setTimeout(() => intro.remove(), 900);
      }, 500);
    } catch (error) {
      console.error('[GTA MANUCHO V88] No se pudo iniciar la secuencia.', error);
      status.textContent = 'NO SE PUDO INICIAR. RECARGA LA PÁGINA.';
      status.classList.add('gta-intro-error');
    }
  }

  function finishSequence() {
    if (finishedSequence) return;
    finishedSequence = true;
    window.removeEventListener('keydown', skip, true);
    showIndex(media.length - 1);
    setTimeout(startTutorial, 900);
  }

  preload(1);
  progress.style.width = '8%';
  typeBrief(media[0].brief);
  interval = window.setInterval(() => {
    if (index >= media.length - 1) return finishSequence();
    showIndex(index + 1);
  }, 2400);

  function skip(event) {
    if (event?.type === 'keydown' && !['Enter', 'Space'].includes(event.code)) return;
    event?.preventDefault?.();
    finishSequence();
  }
  intro.addEventListener('pointerdown', skip, { once: true });
  window.addEventListener('keydown', skip, true);
})();
