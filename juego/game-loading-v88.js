/** GTA MANUCHO V90 — transición visual automática, esperando ciudad real y sin pantalla negra. */
(() => {
  'use strict';
  const items = [
    { src: '../docs/media/Portada.png', zone: 'Ciudad Manucho' },
    { src: '../docs/media/GTA-MANUCHO-VIDEO-2.webp', zone: 'Acción en movimiento' },
    { src: '../docs/media/GTA-MANUCHO-1.png', zone: 'Centro de la ciudad' },
    { src: '../docs/media/GTA-MANUCHO-4.png', zone: 'Costa del Pacífico' },
    { src: '../docs/media/GTA-MANUCHO-VIDEO-1.webp', zone: 'Secuencia cinematográfica' },
    { src: '../docs/media/GTA-MANUCHO-7.png', zone: 'Mapa abierto' },
    { src: '../docs/media/GTA-MANUCHO-9.png', zone: 'Modo Online' }
  ];

  const startedAt = performance.now();
  let index = 0;
  let progress = 6;
  let revealed = false;
  let mediaTimer = 0;
  let monitorTimer = 0;

  function nodes() {
    const overlay = document.getElementById('npc-city-loading-overlay');
    return {
      overlay,
      image: overlay?.querySelector('.npc-loading-media'),
      subtitle: overlay?.querySelector('.npc-loading-subtitle'),
      bar: overlay?.querySelector('.npc-loading-bar'),
      zone: overlay?.querySelector('.npc-loading-zone')
    };
  }

  function setStatus(text) {
    const { subtitle } = nodes();
    if (subtitle && text) subtitle.textContent = text;
  }

  function setProgress(value) {
    progress = Math.max(progress, Math.min(100, Number(value) || 0));
    const { bar } = nodes();
    if (bar) bar.style.width = `${progress}%`;
  }

  function reveal(reason = 'ready') {
    if (revealed) return;
    const { overlay } = nodes();
    revealed = true;
    clearInterval(mediaTimer);
    clearInterval(monitorTimer);
    setProgress(100);
    setStatus('Entrando a GTA MANUCHO…');
    if (!overlay) return;
    overlay.dataset.revealReason = reason;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      overlay.classList.add('ready');
      setTimeout(() => overlay.remove(), 520);
    }));
  }

  function preload(nextIndex) {
    const item = items[nextIndex % items.length];
    const image = new Image();
    image.decoding = 'async';
    image.src = item.src;
  }

  function rotateMedia() {
    const { image, zone } = nodes();
    if (!image) return;
    index = (index + 1) % items.length;
    const item = items[index];
    image.classList.add('switching');
    setTimeout(() => {
      image.src = item.src;
      image.alt = item.zone;
      if (zone) zone.textContent = item.zone;
      image.classList.remove('switching');
      preload(index + 1);
    }, 160);
  }

  function canvasReady() {
    const canvas = window.__VICE_CITY_GAME__?.renderer?.domElement || document.querySelector('#root canvas');
    if (!canvas) return false;
    const rect = canvas.getBoundingClientRect?.();
    return canvas.width > 0 && canvas.height > 0 && (!rect || (rect.width > 4 && rect.height > 4));
  }

  function cityReadyState() {
    const game = window.__VICE_CITY_GAME__;
    const hasRenderer = Boolean(game?.renderer && game?.scene && game?.camera);
    const hasPlayer = Boolean(game?.playerContainer);
    const coreReady = Boolean(game?.coreWorldReady || window.__VICE_BASE_CITY_READY__ || window.__VICE_CITY_REVEALED__);
    const extrasReady = Boolean(window.__VICE_CITY_EXTRAS_READY__);
    const worldReady = Boolean(window.__VICE_WORLD_VISIBILITY_READY__);
    const territoryReady = !window.__VICE_TERRITORY_LOADING_REQUIRED__ || Boolean(window.__TERRITORY_COMBAT_READY__);
    const onlineReady = !window.__VICE_ONLINE_LOADING_REQUIRED__ || Boolean(window.__GTA_ONLINE__);
    return { game, hasRenderer, hasPlayer, coreReady, worldReady, extrasReady, territoryReady, onlineReady };
  }

  function monitor() {
    if (revealed) return;
    const elapsed = performance.now() - startedAt;
    const rootHasUI = Boolean(document.getElementById('root')?.children.length);
    const ready = cityReadyState();

    if (window.__GTA_CORE_MODULE_LOADED__) {
      setProgress(30);
      setStatus('Cargando motor principal…');
    }
    if (rootHasUI) setProgress(46);
    if (ready.hasRenderer) {
      setProgress(60);
      setStatus('Preparando cámara y render…');
    }
    if (ready.hasPlayer) {
      setProgress(72);
      setStatus('Posicionando al jugador…');
    }
    if (ready.coreReady) {
      setProgress(84);
      setStatus('Cargando ciudad base y pistas…');
    }
    if (ready.worldReady) {
      setProgress(88);
      setStatus('Pistas y edificios listos…');
    }
    if (ready.extrasReady) {
      setProgress(92);
      setStatus('Integrando mapa, casa y extras…');
    }
    if (ready.territoryReady && ready.onlineReady) {
      setProgress(96);
      setStatus('Sincronizando sistemas finales…');
    }

    const fullyReady = canvasReady() && ready.hasRenderer && ready.hasPlayer && ready.coreReady && ready.worldReady && ready.extrasReady && ready.territoryReady && ready.onlineReady;
    if (fullyReady && elapsed > 1400) {
      reveal('city-fully-ready');
      return;
    }

    // Nunca revelar demasiado pronto: evitamos aparecer en suelo negro o sin pistas.
    if (elapsed > 26000 && canvasReady() && ready.hasRenderer && ready.hasPlayer && ready.coreReady && ready.worldReady) {
      reveal('extended-safety-timeout');
      return;
    }

    if (elapsed > 32000) {
      reveal('hard-timeout');
    }
  }

  function start() {
    const { image } = nodes();
    if (!image) return;
    image.addEventListener('error', () => {
      if (!image.src.endsWith('/Portada.png')) image.src = '../docs/media/Portada.png';
    });
    preload(1);
    setProgress(progress);
    mediaTimer = setInterval(rotateMedia, 1750);
    monitorTimer = setInterval(monitor, 80);
    monitor();
  }

  window.__GTA_LOADING__ = { setStatus, setProgress, reveal };
  window.addEventListener('gta-core-module-loaded', () => setProgress(30), { once: true });
  window.addEventListener('vice-base-city-ready', () => {
    window.__VICE_BASE_CITY_READY__ = true;
    setProgress(84);
  }, { once: true });
  window.addEventListener('vice-world-visibility-ready', () => setProgress(88), { once: true });
  window.addEventListener('vice-city-extras-ready', () => setProgress(92), { once: true });
  window.addEventListener('territory-combat-ready', () => setProgress(96), { once: true });
  window.addEventListener('vice-city-revealed', () => reveal('city-event'), { once: true });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
