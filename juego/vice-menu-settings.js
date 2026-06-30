/**
 * GTA MANUCHO V84 — código del proyecto.
 * Creado e integrado por Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * ARKEA AI / Manucho · conserva LICENSE, NOTICE.md y estos créditos al reutilizar.
 */
(() => {
  'use strict';

  const STORAGE_KEY = 'gta_manucho_settings_v80';
  const LEGACY_KEYS = ['gta_manucho_settings_v79', 'gta_manucho_settings_v78', 'gta_manucho_display_settings_v77', 'gta_manucho_display_settings_v76'];
  const ANIMATIONS = Array.from({ length: 7 }, (_, index) => `../menu-animations/${index + 1}.webp`);
  const SETTINGS_ART = {
    controls: './menu-settings-art/controls.png',
    audio: './menu-settings-art/audio.png',
    screen: './menu-settings-art/screen.png'
  };

  const DEFAULTS = {
    quality: 'medium',
    aspect: 'auto',
    scale: 85,
    brightness: 100,
    shadows: false,
    fpsLimit: 60,
    trafficDensity: 70,
    npcDensity: 70,
    masterVolume: 80,
    effectsVolume: 80,
    radioVolume: 65,
    radioUrl: '',
    radioEnabled: false,
    radioGenre: 'synthwave',
    radioMode: 'vehicle',
    radioStationName: '',
    radioStationUuid: '',
    radioStationCountry: '',
    radioStationCodec: '',
    radioStationBitrate: 0,
    radioStationFavicon: '',
    mouseSensitivity: 50,
    invertY: false,
    autoRun: false,
    radarMode: 'map-icons',
    viewerMode: 'third',
    legend: true,
    subtitles: true,
    saveGallery: true,
    language: 'es'
  };

  const QUALITY = {
    low:    { label: 'BAJA', pixelRatio: 0.48, cullDistance: 3300, carDistance: 2850, npcDistance: 2500, maxVisibleCars: 6 },
    medium: { label: 'MEDIA', pixelRatio: 0.72, cullDistance: 5000, carDistance: 4550, npcDistance: 3950, maxVisibleCars: 11 },
    high:   { label: 'ALTA', pixelRatio: 1.00, cullDistance: 6500, carDistance: 6300, npcDistance: 5550, maxVisibleCars: 16 },
    max:    { label: 'MÁXIMA', pixelRatio: 1.20, cullDistance: 8000, carDistance: 7900, npcDistance: 7000, maxVisibleCars: 20 }
  };

  let settings = loadSettings();
  let overlay = null;
  let currentPage = 'main';
  let currentParent = 'main';
  let startup = null;
  let startupTimer = 0;
  let radio = null;
  let radioStations = [];
  let radioStationIndex = -1;
  let radioFetchController = null;
  let radioStatus = 'RADIO APAGADA';
  let radioVehicleTick = 0;
  let gameWait = 0;
  let suppressUnlockUntil = 0;
  let lastAppliedSignature = '';
  let fpsValue = 0;
  let fpsFrames = 0;
  let fpsStamp = performance.now();
  let artSwapToken = 0;
  let settingsSaveTimer = 0;
  let liveApplyFrame = 0;

  function loadSettings() {
    let merged = { ...DEFAULTS };
    for (const key of LEGACY_KEYS) {
      try {
        const value = JSON.parse(localStorage.getItem(key) || 'null');
        if (value && typeof value === 'object') merged = { ...merged, ...value };
      } catch {}
    }
    try {
      const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (current && typeof current === 'object') merged = { ...merged, ...current };
    } catch {}
    return merged;
  }

  function saveSettings() {
    clearTimeout(settingsSaveTimer);
    settingsSaveTimer = 0;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch {}
  }

  function saveSettingsSoon() {
    clearTimeout(settingsSaveTimer);
    settingsSaveTimer = window.setTimeout(saveSettings, 120);
  }

  function scheduleLiveApply(callback) {
    if (typeof callback !== 'function') return;
    cancelAnimationFrame(liveApplyFrame);
    liveApplyFrame = requestAnimationFrame(() => {
      liveApplyFrame = 0;
      callback();
    });
  }

  function getGame() {
    return window.__VICE_CITY_GAME__ || null;
  }

  function clearMovementKeys() {
    const game = getGame();
    if (!game?.keys) return;
    for (const key of Object.keys(game.keys)) game.keys[key] = false;
  }

  function preloadImage(src) {
    const image = new Image();
    image.decoding = 'async';
    image.src = src;
  }

  function createStartup() {
    if (document.getElementById('vice-startup-screen')) return;
    startup = document.createElement('div');
    startup.id = 'vice-startup-screen';
    startup.innerHTML = `
      <div class="vice-startup-media" aria-hidden="true">
        <img id="vice-startup-animation" src="${ANIMATIONS[0]}" alt="">
      </div>
      <section class="vice-startup-card" aria-label="Cargando GTA MANUCHO">
        <div class="vice-startup-kicker">ARKEA AI PRESENTA</div>
        <div class="vice-startup-title">GTA MANUCHO</div>
        <div class="vice-startup-subtitle">CARGANDO LA CIUDAD</div>
        <div class="vice-loading-track"><span></span></div>
        <div class="vice-loading-status" id="vice-loading-status">PREPARANDO EL MUNDO…</div>
      </section>`;
    document.body.appendChild(startup);

    const statuses = [
      'PREPARANDO EL MUNDO…',
      'OPTIMIZANDO EL RENDIMIENTO…',
      'CARGANDO VEHÍCULOS Y PERSONAJES…',
      'ENTRANDO A GTA MANUCHO…'
    ];
    let imageIndex = 0;
    let statusIndex = 0;
    preloadImage(ANIMATIONS[1]);
    startupTimer = window.setInterval(() => {
      if (!startup?.isConnected || startup.classList.contains('vice-hidden')) {
        clearInterval(startupTimer);
        return;
      }
      imageIndex = (imageIndex + 1) % ANIMATIONS.length;
      const image = document.getElementById('vice-startup-animation');
      if (image) {
        image.classList.add('vice-switching');
        setTimeout(() => {
          if (!image.isConnected) return;
          image.src = ANIMATIONS[imageIndex];
          image.classList.remove('vice-switching');
          preloadImage(ANIMATIONS[(imageIndex + 1) % ANIMATIONS.length]);
        }, 160);
      }
      const status = document.getElementById('vice-loading-status');
      if (status) status.textContent = statuses[++statusIndex % statuses.length];
    }, 2100);

    const hide = () => {
      if (!startup?.isConnected || startup.classList.contains('vice-hidden')) return;
      startup.classList.add('vice-hidden');
      clearInterval(startupTimer);
      setTimeout(() => startup?.remove(), 700);
    };

    if (window.__VICE_CITY_REVEALED__) setTimeout(hide, 500);
    else window.addEventListener('vice-city-revealed', () => setTimeout(hide, 500), { once: true });
    setTimeout(hide, 18000);
  }

  function createOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'vice-pause-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.addEventListener('pointerdown', event => event.stopPropagation());
    overlay.addEventListener('pointerup', event => event.stopPropagation());
    overlay.addEventListener('click', event => event.stopPropagation());
    overlay.addEventListener('wheel', event => {
      event.stopPropagation();
      if (!event.target.closest('.vice-scrollable')) event.preventDefault();
    }, { passive: false });
    document.body.appendChild(overlay);
    renderMain();
    return overlay;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  }

  function safeHttpUrl(value) {
    try {
      const url = new URL(String(value || ''), location.href);
      return /^https?:$/.test(url.protocol) ? url.href : '';
    } catch {
      return '';
    }
  }

  function menuButton(label, action, options = {}) {
    const selected = options.selected ? ' vice-selected' : '';
    const art = options.art ? ` data-art="${options.art}"` : '';
    const danger = options.danger ? ' vice-danger' : '';
    return `<button type="button" class="vice-menu-button${selected}${danger}" data-action="${action}"${art}>${label}</button>`;
  }

  function pageShell(title, subtitle, body, options = {}) {
    const art = options.art ? sideArt(options.art, options.artTitle || title, options.artSubtitle || 'GTA MANUCHO') : '';
    const className = options.art ? ' vice-with-art' : '';
    return `<div class="vice-menu-shell${className}">
      <section class="vice-menu-left">
        <h1 class="vice-menu-heading">${title}</h1>
        <p class="vice-menu-caption">${subtitle}</p>
        ${body}
      </section>
      ${art}
    </div>`;
  }

  function sideArt(name, title, subtitle) {
    const src = SETTINGS_ART[name] || SETTINGS_ART.screen;
    return `<aside class="vice-menu-art" aria-label="Imagen de ajustes">
      <div class="vice-menu-art-card">
        <img class="vice-menu-art-image" src="${src}" alt="Imagen de ${escapeHtml(title)}">
        <div class="vice-menu-art-shade"></div>
        <div class="vice-menu-art-title">${title}<small>${subtitle}</small></div>
      </div>
    </aside>`;
  }

  function setSideArt(name, title = '', subtitle = 'GTA MANUCHO') {
    const image = overlay?.querySelector('.vice-menu-art-image');
    const titleNode = overlay?.querySelector('.vice-menu-art-title');
    const src = SETTINGS_ART[name];
    if (!image || !src || image.getAttribute('src') === src) {
      if (titleNode && title) titleNode.innerHTML = `${title}<small>${subtitle}</small>`;
      return;
    }
    const token = ++artSwapToken;
    image.classList.add('vice-switching');
    preloadImage(src);
    setTimeout(() => {
      if (token !== artSwapToken || !image.isConnected) return;
      image.src = src;
      image.classList.remove('vice-switching');
      if (titleNode && title) titleNode.innerHTML = `${title}<small>${subtitle}</small>`;
    }, 130);
  }

  function renderMain() {
    currentPage = 'main';
    currentParent = 'main';
    createOverlay();
    const body = `<div class="vice-menu-list vice-main-list">
      ${menuButton('REANUDAR', 'continue')}
      ${menuButton('INICIAR NUEVA PARTIDA', 'new-game', { selected: true })}
      ${menuButton('MAPA', 'map')}
      ${menuButton('ESTADÍSTICAS', 'statistics')}
      ${menuButton('INFORMACIÓN', 'information')}
      ${menuButton('OPCIONES', 'options')}
      ${menuButton('SALIR DE LA PARTIDA', 'exit-game', { danger: true })}
    </div>
    <p class="vice-menu-help">ESC · REANUDAR &nbsp;&nbsp; ENTER · SELECCIONAR &nbsp;&nbsp; FLECHAS · MOVERSE</p>`;
    overlay.innerHTML = pageShell('MENÚ DE PAUSA', 'GTA MANUCHO · SOMOS ARKEA AI', body);
    bindActions();
  }

  function renderOptions() {
    currentPage = 'options';
    currentParent = 'main';
    const body = `<div class="vice-menu-list">
      ${menuButton('CONFIG. CONTROLES', 'controls', { selected: true, art: 'controls' })}
      ${menuButton('CONFIG. SONIDO', 'sound', { art: 'audio' })}
      ${menuButton('RADIO', 'radio', { art: 'audio' })}
      ${menuButton('CONFIG. PANTALLA', 'screen', { art: 'screen' })}
      ${menuButton('IDIOMA', 'language', { art: 'controls' })}
      ${menuButton('CARGAR PARTIDA', 'load-save', { art: 'screen' })}
      ${menuButton('ATRÁS', 'back-main')}
    </div>
    <p class="vice-menu-help">Cada apartado muestra su propia imagen lateral. Todos los cambios se guardan automáticamente.</p>`;
    overlay.innerHTML = pageShell('OPCIONES', 'AJUSTES GENERALES DE GTA MANUCHO', body, {
      art: 'controls', artTitle: 'CONTROLES', artSubtitle: 'AJUSTES'
    });
    bindActions();
  }

  function controlRow(label, control, note = '') {
    return `<div class="vice-setting-row"><label class="vice-setting-label">${label}</label>${control}${note ? `<div class="vice-setting-note">${note}</div>` : ''}</div>`;
  }

  function selectControl(id, options, value) {
    return `<select id="${id}" class="vice-setting-control">${options.map(([itemValue, label]) => `<option value="${itemValue}" ${String(itemValue) === String(value) ? 'selected' : ''}>${label}</option>`).join('')}</select>`;
  }

  function rangeControl(id, min, max, step, value, suffix = '%') {
    return `<div class="vice-range-wrap"><input id="${id}" class="vice-setting-control vice-range" type="range" min="${min}" max="${max}" step="${step}" value="${value}"><output id="${id}-value">${value}${suffix}</output></div>`;
  }

  function renderControls() {
    currentPage = 'controls';
    currentParent = 'options';
    const body = `<div class="vice-settings-panel vice-scrollable">
      ${controlRow('CONFIGURACIÓN', selectControl('vice-control-scheme', [['classic','CLÁSICA · WASD'],['arrows','ALTERNATIVA · FLECHAS']], 'classic'))}
      ${controlRow('SENSIBILIDAD DEL RATÓN', rangeControl('vice-mouse-sensitivity', 10, 100, 5, settings.mouseSensitivity), 'Modifica la sensibilidad publicada para la cámara y los modos en primera persona.')}
      ${controlRow('INVERTIR EJE VERTICAL', selectControl('vice-invert-y', [['false','NO'],['true','SÍ']], String(settings.invertY)))}
      ${controlRow('CARRERA AUTOMÁTICA', selectControl('vice-auto-run', [['false','NO'],['true','SÍ']], String(settings.autoRun)))}
      ${controlRow('MODO DE VISOR', selectControl('vice-viewer-mode', [['third','TERCERA PERSONA'],['first','PRIMERA PERSONA']], settings.viewerMode))}
      <div class="vice-settings-actions single-column">
        ${menuButton('RESTABLECER CONTROLES', 'reset-controls')}
        ${menuButton('ATRÁS', 'back-options', { selected: true })}
      </div>
    </div>`;
    overlay.innerHTML = pageShell('CONTROLES', 'CONFIGURACIÓN DE MOVIMIENTO Y CÁMARA', body, {
      art: 'controls', artTitle: 'CONTROLES', artSubtitle: 'GTA MANUCHO'
    });
    bindActions();
    bindControlInputs();
  }

  function renderSound() {
    currentPage = 'sound';
    currentParent = 'options';
    const body = `<div class="vice-settings-panel vice-scrollable">
      ${controlRow('VOLUMEN GENERAL', rangeControl('vice-master-volume', 0, 100, 5, settings.masterVolume))}
      ${controlRow('EFECTOS DEL JUEGO', rangeControl('vice-effects-volume', 0, 100, 5, settings.effectsVolume), 'Ajusta motores, disparos, pasos, ambiente y sonidos de interfaz.')}
      <div class="vice-settings-actions single-column">
        ${menuButton('RESTABLECER SONIDO', 'reset-sound')}
        ${menuButton('ATRÁS', 'back-options', { selected: true })}
      </div>
    </div>`;
    overlay.innerHTML = pageShell('SONIDO', 'VOLUMEN GENERAL Y EFECTOS', body, {
      art: 'audio', artTitle: 'SONIDO', artSubtitle: 'GTA MANUCHO'
    });
    bindActions();
    bindSoundInputs();
  }

  function radioStationCardsHtml() {
    if (!radioStations.length) {
      const savedLogo = safeHttpUrl(settings.radioStationFavicon);
      if (settings.radioUrl) {
        return `<div class="vice-radio-grid"><button type="button" class="vice-radio-card is-selected" data-action="radio-play">
          <span class="vice-radio-logo">${savedLogo ? `<img src="${escapeHtml(savedLogo)}" alt="" loading="lazy" decoding="async">` : '<b>FM</b>'}</span>
          <span><strong>${escapeHtml(settings.radioStationName || 'EMISORA GUARDADA')}</strong><small>${escapeHtml(settings.radioStationCountry || 'RADIO BROWSER')}</small></span>
        </button></div>`;
      }
      return `<div class="vice-radio-empty"><span>FM</span><strong>BUSCA EMISORAS</strong><small>Selecciona un género y pulsa BUSCAR. Los canales aparecerán aquí con sus imágenes.</small></div>`;
    }
    return `<div class="vice-radio-grid">${radioStations.slice(0, 10).map((station, index) => {
      const favicon = safeHttpUrl(station.favicon);
      const selected = index === radioStationIndex ? ' is-selected' : '';
      const initials = escapeHtml((station.name || 'FM').trim().slice(0, 2).toUpperCase());
      return `<button type="button" class="vice-radio-card${selected}" data-action="radio-select" data-index="${index}">
        <span class="vice-radio-logo">${favicon ? `<img src="${escapeHtml(favicon)}" alt="" loading="lazy" decoding="async">` : `<b>${initials}</b>`}</span>
        <span><strong>${escapeHtml(station.name || 'EMISORA')}</strong><small>${escapeHtml([station.countrycode || station.country, station.codec].filter(Boolean).join(' · ') || 'RADIO ONLINE')}</small></span>
      </button>`;
    }).join('')}</div>`;
  }

  function renderRadio() {
    currentPage = 'radio';
    currentParent = 'options';
    const isPlaying = Boolean(radio && !radio.paused && radio.src);
    const radioLabel = isPlaying ? 'PAUSAR RADIO' : (settings.radioEnabled ? 'REANUDAR RADIO' : 'ENCENDER RADIO');
    const stationOptions = buildStationOptions();
    const currentName = settings.radioStationName || 'NINGUNA EMISORA SELECCIONADA';
    const currentMeta = [settings.radioStationCountry, settings.radioStationCodec, settings.radioStationBitrate ? `${settings.radioStationBitrate} KBPS` : '']
      .filter(Boolean).join(' · ') || 'RADIO BROWSER API';
    const body = `<div class="vice-settings-panel vice-scrollable vice-radio-panel">
      ${controlRow('VOLUMEN DE RADIO', rangeControl('vice-radio-volume', 0, 100, 5, settings.radioVolume))}
      ${controlRow('GÉNERO / ESTILO', selectControl('vice-radio-genre', [
        ['synthwave','SYNTHWAVE'],['retrowave','RETROWAVE'],['electronic','ELECTRÓNICA'],['rock','ROCK'],
        ['hip hop','HIP HOP'],['latin','LATINA'],['pop','POP'],['jazz','JAZZ'],['reggaeton','REGGAETÓN']
      ], settings.radioGenre))}
      ${controlRow('EMISORA', `<select id="vice-radio-station" class="vice-setting-control">${stationOptions}</select>`, 'La búsqueda es asíncrona y solo se ejecuta al pulsar BUSCAR EMISORAS.')}
      ${controlRow('MODO DE REPRODUCCIÓN', selectControl('vice-radio-mode', [['vehicle','SOLO EN VEHÍCULOS'],['always','SIEMPRE']], settings.radioMode), 'En modo vehículo se silencia al bajar y vuelve al subir.')}
      <section class="vice-radio-now" aria-live="polite">
        <div class="vice-radio-led ${settings.radioEnabled ? 'is-on' : ''}"></div>
        <div><strong id="vice-radio-station-name">${escapeHtml(currentName)}</strong><small id="vice-radio-station-meta">${escapeHtml(currentMeta)}</small></div>
        <span id="vice-radio-status">${escapeHtml(radioStatus)}</span>
      </section>
      <div class="vice-radio-actions">
        <button type="button" class="vice-small-button" data-action="radio-load">BUSCAR EMISORAS</button>
        <button type="button" class="vice-small-button" data-action="radio-prev">◀ ANTERIOR</button>
        <button type="button" class="vice-small-button vice-radio-primary" data-action="radio-play">${radioLabel}</button>
        <button type="button" class="vice-small-button" data-action="radio-next">SIGUIENTE ▶</button>
        <button type="button" class="vice-small-button" data-action="radio-stop">APAGAR</button>
      </div>
      <h2 class="vice-radio-channel-title">CANALES DE RADIO</h2>
      ${radioStationCardsHtml()}
      <div class="vice-settings-actions single-column">
        ${menuButton('RESTABLECER RADIO', 'reset-radio')}
        ${menuButton('ATRÁS', 'back-options', { selected: true })}
      </div>
    </div>`;
    overlay.innerHTML = pageShell('RADIO', 'EMISORAS EN DIRECTO · RADIO BROWSER', body, {
      art: 'audio', artTitle: 'RADIO', artSubtitle: 'GTA MANUCHO'
    });
    bindActions();
    bindRadioInputs();
    updateRadioUi();
  }

  function renderScreen() {
    currentPage = 'screen';
    currentParent = 'options';
    const body = `<div class="vice-settings-panel vice-scrollable">
      ${controlRow('BRILLO', rangeControl('vice-brightness', 65, 145, 5, settings.brightness))}
      ${controlRow('LEYENDA', selectControl('vice-legend', [['true','SÍ'],['false','NO']], String(settings.legend)))}
      ${controlRow('MODO RADAR', selectControl('vice-radar-mode', [['map-icons','MAPAS E ICONOS'],['map','SOLO MAPA'],['icons','SOLO ICONOS'],['off','DESACTIVADO']], settings.radarMode))}
      ${controlRow('MODO VISOR', selectControl('vice-screen-viewer-mode', [['third','TERCERA PERSONA'],['first','PRIMERA PERSONA']], settings.viewerMode))}
      ${controlRow('SUBTÍTULOS', selectControl('vice-subtitles', [['true','SÍ'],['false','NO']], String(settings.subtitles)))}
      ${controlRow('GUARDAR FOTOS DE GALERÍA', selectControl('vice-save-gallery', [['true','SÍ'],['false','NO']], String(settings.saveGallery)))}
      <div class="vice-settings-actions single-column">
        ${menuButton('AVANZADAS', 'advanced', { selected: true, art: 'screen' })}
        ${menuButton('RESTABLECER PREDETERMINADOS', 'defaults')}
        ${menuButton('ATRÁS', 'back-options')}
      </div>
    </div>`;
    overlay.innerHTML = pageShell('PANTALLA', 'CONFIGURACIÓN VISUAL Y DEL RADAR', body, {
      art: 'screen', artTitle: 'PANTALLA', artSubtitle: 'GTA MANUCHO'
    });
    bindActions();
    bindScreenInputs();
  }

  function renderAdvanced() {
    currentPage = 'advanced';
    currentParent = 'screen';
    const profile = QUALITY[settings.quality] || QUALITY.medium;
    const body = `<div class="vice-settings-panel vice-scrollable">
      ${controlRow(`CALIDAD GRÁFICA · <span class="vice-quality-badge">${profile.label}</span>`, selectControl('vice-quality', [['low','BAJA · MÁS FPS'],['medium','MEDIA · RECOMENDADA'],['high','ALTA'],['max','MÁXIMA']], settings.quality), 'La calidad baja reduce resolución, distancia de dibujo y cantidad de entidades visibles.')}
      ${controlRow('FORMATO', selectControl('vice-aspect', [['auto','AUTOMÁTICO'],['16:9','16:9 PANORÁMICO'],['4:3','4:3 CLÁSICO'],['1:1','1:1 CUADRADO']], settings.aspect))}
      ${controlRow('TAMAÑO DE PANTALLA', selectControl('vice-scale', [['55','PEQUEÑO · 55%'],['70','MEDIANO · 70%'],['85','GRANDE · 85%'],['100','COMPLETO · 100%']], settings.scale), 'Un tamaño menor dibuja menos píxeles y normalmente aumenta los FPS.')}
      ${controlRow('SOMBRAS', selectControl('vice-shadows', [['false','DESACTIVADAS · MÁS FPS'],['true','ACTIVADAS']], String(settings.shadows)))}
      ${controlRow('LÍMITE DE FPS', selectControl('vice-fps-limit', [['30','30 FPS'],['45','45 FPS'],['60','60 FPS'],['0','SIN LÍMITE']], settings.fpsLimit))}
      ${controlRow('DENSIDAD DE TRÁFICO', rangeControl('vice-traffic-density', 25, 100, 5, settings.trafficDensity))}
      ${controlRow('DENSIDAD DE PEATONES', rangeControl('vice-npc-density', 25, 100, 5, settings.npcDensity))}
      <div class="vice-settings-actions single-column">
        ${menuButton(document.fullscreenElement ? 'SALIR DE PANTALLA COMPLETA' : 'PANTALLA COMPLETA', 'fullscreen', { selected: true })}
        ${menuButton('APLICAR AHORA', 'apply-display')}
        ${menuButton('ATRÁS', 'back-screen')}
      </div>
    </div>`;
    overlay.innerHTML = pageShell('AVANZADAS', 'RENDIMIENTO, RESOLUCIÓN Y CALIDAD', body, {
      art: 'screen', artTitle: 'GRÁFICOS', artSubtitle: 'MODO AVANZADO'
    });
    bindActions();
    bindAdvancedInputs();
  }

  function renderLanguage() {
    currentPage = 'language';
    currentParent = 'options';
    const body = `<div class="vice-settings-panel vice-scrollable">
      ${controlRow('IDIOMA', selectControl('vice-language', [['es','ESPAÑOL'],['en','INGLÉS · PRÓXIMAMENTE']], settings.language), 'El menú y los ajustes se mantienen en español perfecto.')}
      <div class="vice-info-card"><strong>IDIOMA ACTIVO: ESPAÑOL</strong><p>Las misiones, controles, ajustes y mensajes principales de GTA MANUCHO se muestran en español.</p></div>
      <div class="vice-settings-actions single-column">${menuButton('ATRÁS', 'back-options', { selected: true })}</div>
    </div>`;
    overlay.innerHTML = pageShell('IDIOMA', 'CONFIGURACIÓN DE TEXTO', body, {
      art: 'controls', artTitle: 'IDIOMA', artSubtitle: 'ESPAÑOL'
    });
    bindActions();
    document.getElementById('vice-language')?.addEventListener('change', event => {
      settings.language = event.target.value === 'en' ? 'es' : event.target.value;
      event.target.value = settings.language;
      saveSettings();
    });
  }

  function renderStatistics() {
    currentPage = 'statistics';
    currentParent = 'main';
    const game = getGame();
    const pos = game?.playerContainer?.position;
    const properties = window.__PROPERTY_SYSTEM__?.properties || [];
    const ownedProperties = properties.filter(item => item?.owned).length;
    const inventory = window.__VICE_WEAPON_ITEMS__ || [];
    const gangs = (window.__CITY_LIFE_SYSTEM__?.entities || []).filter(item => item?.kind === 'gang' && !item.dead).length;
    const police = (game?.crimeWorld?.policeAgents || []).filter(item => item?.state !== 'dead').length;
    const cars = (window.__CUSTOM_CARS__ || []).length;
    const body = `<div class="vice-stat-grid">
      <div><span>VIDA</span><strong>${Math.round(Number(game?.health ?? 100))}</strong></div>
      <div><span>ARMADURA</span><strong>${Math.round(Number(game?.armor ?? 0))}</strong></div>
      <div><span>DINERO</span><strong>$${Math.round(Number(game?.money ?? 0)).toLocaleString('es-PE')}</strong></div>
      <div><span>NIVEL DE BÚSQUEDA</span><strong>${Math.round(Number(game?.wantedLevel ?? game?.crimeWorld?.wantedLevel ?? 0))}/5</strong></div>
      <div><span>FPS APROX.</span><strong>${fpsValue || '—'}</strong></div>
      <div><span>VEHÍCULOS CARGADOS</span><strong>${cars}</strong></div>
      <div><span>BANDAS ACTIVAS</span><strong>${gangs}</strong></div>
      <div><span>POLICÍAS ACTIVOS</span><strong>${police}</strong></div>
      <div><span>PROPIEDADES</span><strong>${ownedProperties}/${properties.length}</strong></div>
      <div><span>ARMAS EN INVENTARIO</span><strong>${inventory.length}</strong></div>
      <div class="wide"><span>POSICIÓN</span><strong>${pos ? `${Math.round(pos.x)}, ${Math.round(pos.y)}, ${Math.round(pos.z)}` : 'CARGANDO…'}</strong></div>
    </div>
    <div class="vice-settings-actions single-column">${menuButton('ATRÁS', 'back-main', { selected: true })}</div>`;
    overlay.innerHTML = pageShell('ESTADÍSTICAS', 'DATOS DE LA PARTIDA ACTUAL', body);
    bindActions();
  }

  function renderInformation() {
    currentPage = 'information';
    currentParent = 'main';
    const body = `<div class="vice-info-card vice-scrollable">
      <h2>GTA MANUCHO</h2>
      <p>Mundo abierto 3D creado y optimizado por <strong>ARKEA AI</strong>.</p>
      <p><strong>CONTROLES:</strong> WASD para moverte, SHIFT para correr, V para cambiar cámara, E para interactuar, TAB para abrir el mapa y ESC para abrir este menú.</p>
      <a href="https://www.instagram.com/robertmanuchojp/" target="_blank" rel="noopener noreferrer">INSTAGRAM · @ROBERTMANUCHOJP</a>
      <a href="https://www.youtube.com/@ManuchoAI" target="_blank" rel="noopener noreferrer">YOUTUBE · MANUCHO AI</a>
      <a href="https://www.linkedin.com/in/roberto-manuel-jara-peche-10867240b/" target="_blank" rel="noopener noreferrer">LINKEDIN · ROBERTO MANUEL JARA PECHE</a>
      <small>Easter egg: creado para jugar sin lagear.</small>
    </div>
    <div class="vice-settings-actions single-column">${menuButton('ATRÁS', 'back-main', { selected: true })}</div>`;
    overlay.innerHTML = pageShell('INFORMACIÓN', 'GTA MANUCHO · ARKEA AI', body);
    bindActions();
  }

  function renderConfirm(kind) {
    currentPage = `confirm-${kind}`;
    currentParent = 'main';
    const isNew = kind === 'new';
    const title = isNew ? 'INICIAR NUEVA PARTIDA' : 'SALIR DE LA PARTIDA';
    const text = isNew
      ? 'Se borrará el progreso local de la partida actual. Los ajustes gráficos y de audio se conservarán.'
      : 'Regresarás a la pantalla inicial de GTA MANUCHO.';
    const body = `<div class="vice-confirm-card"><p>${text}</p><div class="vice-confirm-actions">
      ${menuButton(isNew ? 'SÍ, NUEVA PARTIDA' : 'SÍ, SALIR', isNew ? 'confirm-new-game' : 'confirm-exit', { danger: true })}
      ${menuButton('NO, VOLVER', 'back-main', { selected: true })}
    </div></div>`;
    overlay.innerHTML = pageShell(title, 'CONFIRMACIÓN', body);
    bindActions();
  }

  function bindActions() {
    if (!overlay) return;
    overlay.querySelectorAll('[data-action]').forEach(button => {
      let pointerStart = null;
      const activate = event => {
        if (button.disabled) return;
        const now = performance.now();
        if (event.type === 'click' && now - Number(button.__vicePointerActivatedAt || 0) < 350) return;
        event.preventDefault();
        event.stopPropagation();
        button.__vicePointerActivatedAt = now;
        handleAction(button.dataset.action, button);
      };
      button.addEventListener('pointerdown', event => {
        if (event.button !== 0) return;
        pointerStart = { x: event.clientX, y: event.clientY };
        button.focus({ preventScroll: true });
      });
      button.addEventListener('pointerup', event => {
        if (event.button !== 0 || !pointerStart) return;
        const moved = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
        pointerStart = null;
        if (moved <= 8) activate(event);
      });
      button.addEventListener('click', activate);
      const artName = button.dataset.art;
      if (artName) {
        const update = () => setSideArt(artName, button.textContent.trim(), 'GTA MANUCHO');
        button.addEventListener('mouseenter', update, { passive: true });
        button.addEventListener('focus', update);
      }
      button.addEventListener('mouseenter', () => selectButton(button), { passive: true });
      button.addEventListener('focus', () => selectButton(button));
    });
    overlay.querySelectorAll('.vice-radio-logo img').forEach(image => {
      image.addEventListener('error', () => {
        image.hidden = true;
        image.parentElement?.classList.add('is-fallback');
      }, { once: true });
    });
  }

  function selectButton(button) {
    if (!button?.classList.contains('vice-menu-button')) return;
    overlay.querySelectorAll('.vice-menu-button').forEach(item => item.classList.remove('vice-selected'));
    button.classList.add('vice-selected');
  }

  function bindRange(id, key, apply, suffix = '%', options = {}) {
    const input = document.getElementById(id);
    if (!input) return;
    const live = options.live !== false;
    const updateValue = () => {
      settings[key] = Number(input.value);
      const output = document.getElementById(`${id}-value`);
      if (output) output.textContent = `${settings[key]}${suffix}`;
      saveSettingsSoon();
    };
    input.addEventListener('input', () => {
      updateValue();
      if (live) scheduleLiveApply(apply);
    }, { passive: true });
    input.addEventListener('change', () => {
      updateValue();
      saveSettings();
      if (!live) scheduleLiveApply(apply);
    });
  }

  function bindSelect(id, key, transform = value => value, apply) {
    const input = document.getElementById(id);
    input?.addEventListener('change', () => {
      settings[key] = transform(input.value);
      saveSettings();
      if (apply) requestAnimationFrame(() => apply());
    });
  }

  function bindControlInputs() {
    bindRange('vice-mouse-sensitivity', 'mouseSensitivity', publishControlSettings);
    bindSelect('vice-invert-y', 'invertY', value => value === 'true', publishControlSettings);
    bindSelect('vice-auto-run', 'autoRun', value => value === 'true', publishControlSettings);
    bindSelect('vice-viewer-mode', 'viewerMode', value => value, applyViewerSetting);
    publishControlSettings();
  }

  function bindSoundInputs() {
    bindRange('vice-master-volume', 'masterVolume', applyAudioSettings);
    bindRange('vice-effects-volume', 'effectsVolume', applyAudioSettings);
  }

  function bindRadioInputs() {
    bindRange('vice-radio-volume', 'radioVolume', applyAudioSettings);
    bindSelect('vice-radio-genre', 'radioGenre', value => value, () => {
      radioStations = [];
      radioStationIndex = -1;
      radioStatus = 'PULSA BUSCAR EMISORAS';
      updateRadioUi();
    });
    bindSelect('vice-radio-mode', 'radioMode', value => value === 'always' ? 'always' : 'vehicle', applyAudioSettings);
    const stationSelect = document.getElementById('vice-radio-station');
    stationSelect?.addEventListener('change', () => {
      const index = Number(stationSelect.value);
      if (Number.isInteger(index) && index >= 0) selectRadioStation(index, Boolean(settings.radioEnabled));
    });
  }

  function bindScreenInputs() {
    bindRange('vice-brightness', 'brightness', () => applyDisplaySettings(true), '%', { live: false });
    bindSelect('vice-legend', 'legend', value => value === 'true', applyHudSettings);
    bindSelect('vice-radar-mode', 'radarMode', value => value, applyHudSettings);
    bindSelect('vice-screen-viewer-mode', 'viewerMode', value => value, applyViewerSetting);
    bindSelect('vice-subtitles', 'subtitles', value => value === 'true', applyHudSettings);
    bindSelect('vice-save-gallery', 'saveGallery', value => value === 'true', publishUiSettings);
  }

  function bindAdvancedInputs() {
    bindSelect('vice-quality', 'quality', value => value, () => applyDisplaySettings(true));
    bindSelect('vice-aspect', 'aspect', value => value, () => applyDisplaySettings(true));
    bindSelect('vice-scale', 'scale', Number, () => applyDisplaySettings(true));
    bindSelect('vice-shadows', 'shadows', value => value === 'true', () => applyDisplaySettings(true));
    bindSelect('vice-fps-limit', 'fpsLimit', Number, publishPerformanceSettings);
    bindRange('vice-traffic-density', 'trafficDensity', publishPerformanceSettings, '%', { live: false });
    bindRange('vice-npc-density', 'npcDensity', publishPerformanceSettings, '%', { live: false });
  }

  function handleAction(action, sourceButton = null) {
    switch (action) {
      case 'continue': closeMenu(true); break;
      case 'new-game': renderConfirm('new'); break;
      case 'map': openMapFromMenu(); break;
      case 'statistics': renderStatistics(); break;
      case 'information': renderInformation(); break;
      case 'options': renderOptions(); break;
      case 'exit-game': renderConfirm('exit'); break;
      case 'controls': renderControls(); break;
      case 'sound': renderSound(); break;
      case 'radio': renderRadio(); break;
      case 'screen': renderScreen(); break;
      case 'advanced': renderAdvanced(); break;
      case 'language': renderLanguage(); break;
      case 'back-main': renderMain(); break;
      case 'back-options': renderOptions(); break;
      case 'back-screen': renderScreen(); break;
      case 'load-save': openLoadDialog(); break;
      case 'fullscreen': toggleFullscreen(); break;
      case 'apply-display': applyDisplaySettings(true); showToast('AJUSTES DE PANTALLA APLICADOS'); break;
      case 'defaults': resetAllSettings(); break;
      case 'reset-controls': resetControls(); break;
      case 'reset-sound': resetSound(); break;
      case 'reset-radio': resetRadio(); break;
      case 'radio-select': { const index = Number(sourceButton?.dataset?.index); if (Number.isInteger(index)) selectRadioStation(index, true).then(() => { if (currentPage === 'radio') renderRadio(); }); break; }
      case 'radio-load': loadRadioStations(true); break;
      case 'radio-prev': changeRadioStation(-1); break;
      case 'radio-play': toggleRadio(); break;
      case 'radio-next': changeRadioStation(1); break;
      case 'radio-stop': stopRadio(true); break;
      case 'confirm-new-game': startNewGame(); break;
      case 'confirm-exit': exitGame(); break;
    }
  }

  function openLoadDialog() {
    const loader = window.__PROPERTY_SYSTEM__?.openLoadDialog;
    if (typeof loader === 'function') {
      closeMenu(false);
      loader();
    } else showToast('EL SISTEMA DE PARTIDAS TODAVÍA SE ESTÁ CARGANDO');
  }

  function startNewGame() {
    const keep = new Set([STORAGE_KEY, ...LEGACY_KEYS]);
    const toRemove = [];
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (!key || keep.has(key)) continue;
      if (key.startsWith('vice_') || key.startsWith('vice-') || key.startsWith('viceCity') || key.startsWith('game_of_crew')) toRemove.push(key);
    }
    toRemove.forEach(key => localStorage.removeItem(key));
    location.href = `../index.html?newgame=1&v=81&t=${Date.now()}`;
  }

  function exitGame() {
    location.href = `../index.html?v=81&t=${Date.now()}`;
  }

  function openMapFromMenu() {
    suppressUnlockUntil = performance.now() + 1800;
    closeMenu(false);
    requestAnimationFrame(() => {
      const system = window.__CITY_LIFE_SYSTEM__;
      if (typeof system?.openMap === 'function') system.openMap();
      else {
        const event = new KeyboardEvent('keydown', { code: 'Tab', key: 'Tab', bubbles: true, cancelable: true });
        window.dispatchEvent(event);
      }
    });
  }

  function resetAllSettings() {
    stopRadio(false);
    settings = { ...DEFAULTS };
    saveSettings();
    applyAllSettings();
    renderScreen();
    showToast('AJUSTES RESTABLECIDOS');
  }

  function resetControls() {
    settings.mouseSensitivity = DEFAULTS.mouseSensitivity;
    settings.invertY = DEFAULTS.invertY;
    settings.autoRun = DEFAULTS.autoRun;
    settings.viewerMode = DEFAULTS.viewerMode;
    saveSettings();
    publishControlSettings();
    renderControls();
  }

  function resetSound() {
    settings.masterVolume = DEFAULTS.masterVolume;
    settings.effectsVolume = DEFAULTS.effectsVolume;
    saveSettings();
    applyAudioSettings();
    renderSound();
  }

  function resetRadio() {
    stopRadio(false);
    settings.radioVolume = DEFAULTS.radioVolume;
    settings.radioUrl = '';
    settings.radioEnabled = false;
    settings.radioGenre = DEFAULTS.radioGenre;
    settings.radioMode = DEFAULTS.radioMode;
    settings.radioStationName = '';
    settings.radioStationUuid = '';
    settings.radioStationCountry = '';
    settings.radioStationCodec = '';
    settings.radioStationBitrate = 0;
    settings.radioStationFavicon = '';
    radioStations = [];
    radioStationIndex = -1;
    radioStatus = 'RADIO APAGADA';
    saveSettings();
    applyAudioSettings();
    renderRadio();
  }

  function showToast(text, duration = 1800) {
    let toast = document.getElementById('vice-menu-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'vice-menu-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
  }

  function buildStationOptions() {
    if (radioStations.length) {
      return radioStations.map((station, index) => {
        const label = [station.name || 'EMISORA SIN NOMBRE', station.countrycode || station.country || '', station.codec || '']
          .filter(Boolean).join(' · ');
        return `<option value="${index}"${index === radioStationIndex ? ' selected' : ''}>${escapeHtml(label)}</option>`;
      }).join('');
    }
    if (settings.radioUrl) {
      return `<option value="0" selected>${escapeHtml(settings.radioStationName || 'EMISORA GUARDADA')}</option>`;
    }
    return '<option value="-1" selected>BUSCA EMISORAS PARA COMENZAR</option>';
  }

  function updateRadioUi() {
    const status = document.getElementById('vice-radio-status');
    const name = document.getElementById('vice-radio-station-name');
    const meta = document.getElementById('vice-radio-station-meta');
    const led = overlay?.querySelector('.vice-radio-led');
    if (status) status.textContent = radioStatus;
    if (name) name.textContent = settings.radioStationName || 'NINGUNA EMISORA SELECCIONADA';
    if (meta) {
      meta.textContent = [settings.radioStationCountry, settings.radioStationCodec, settings.radioStationBitrate ? `${settings.radioStationBitrate} KBPS` : '']
        .filter(Boolean).join(' · ') || 'RADIO BROWSER API';
    }
    led?.classList.toggle('is-on', Boolean(settings.radioEnabled && radio && !radio.paused));
  }

  function isPlayerInVehicle() {
    const game = getGame();
    return Boolean(
      game?.activeCar || game?.activeBoat || game?.activeRiddenHorse ||
      window.__ACTIVE_AIRCRAFT__ || window.__ACTIVE_TANK__ ||
      window.__CUSTOM_CAR_SYSTEM__?.active?.root
    );
  }

  function radioCanBeHeard() {
    return settings.radioMode === 'always' || isPlayerInVehicle();
  }

  function ensureRadio() {
    if (!radio) {
      radio = new Audio();
      radio.preload = 'none';
      radio.playsInline = true;
      radio.addEventListener('loadstart', () => {
        radioStatus = 'CONECTANDO CON LA EMISORA…';
        updateRadioUi();
      });
      radio.addEventListener('waiting', () => {
        radioStatus = 'CARGANDO TRANSMISIÓN…';
        updateRadioUi();
      });
      radio.addEventListener('playing', () => {
        radioStatus = settings.radioMode === 'vehicle' && !isPlayerInVehicle()
          ? 'ENCENDIDA · SUBE A UN VEHÍCULO PARA OÍRLA'
          : 'REPRODUCIENDO EN DIRECTO';
        settings.radioEnabled = true;
        saveSettings();
        applyAudioSettings();
        updateRadioUi();
      });
      radio.addEventListener('pause', () => {
        if (settings.radioEnabled) radioStatus = 'RADIO EN PAUSA';
        updateRadioUi();
      });
      radio.addEventListener('error', () => {
        settings.radioEnabled = false;
        radioStatus = 'EMISORA NO DISPONIBLE · PRUEBA SIGUIENTE';
        saveSettings();
        updateRadioUi();
      });
    }
    return radio;
  }

  async function fetchRadioJson(url, signal) {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
      credentials: 'omit',
      signal
    });
    if (!response.ok) throw new Error(`Radio Browser respondió ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Respuesta de radio no válida');
    return data;
  }

  async function loadRadioStations(autoPlay = false) {
    radioFetchController?.abort();
    radioFetchController = new AbortController();
    const timeout = setTimeout(() => radioFetchController?.abort(), 9000);
    const tag = String(settings.radioGenre || 'synthwave').trim() || 'synthwave';
    const query = new URLSearchParams({
      limit: '12',
      tag,
      hidebroken: 'true',
      order: 'clickcount',
      reverse: 'true'
    });
    const endpoints = [
      `https://de1.api.radio-browser.info/json/stations/search?${query}`,
      `https://all.api.radio-browser.info/json/stations/search?${query}`
    ];
    radioStatus = `BUSCANDO ${tag.toUpperCase()}…`;
    updateRadioUi();
    try {
      let data = null;
      let lastError = null;
      for (const endpoint of endpoints) {
        try {
          data = await fetchRadioJson(endpoint, radioFetchController.signal);
          if (data?.length) break;
        } catch (error) {
          lastError = error;
          if (radioFetchController.signal.aborted) throw error;
        }
      }
      if (!data?.length) throw lastError || new Error('No se encontraron emisoras');
      radioStations = data
        .filter(station => station && (station.url_resolved || station.url) && Number(station.lastcheckok ?? 1) !== 0)
        .map(station => ({
          name: String(station.name || 'Emisora sin nombre').trim(),
          url: String(station.url_resolved || station.url || '').trim(),
          uuid: String(station.stationuuid || ''),
          country: String(station.countrycode || station.country || '').trim(),
          countrycode: String(station.countrycode || '').trim(),
          codec: String(station.codec || '').trim(),
          bitrate: Number(station.bitrate || 0),
          hls: Number(station.hls || 0),
          favicon: String(station.favicon || '').trim()
        }))
        .filter(station => /^https?:\/\//i.test(station.url) && station.hls !== 1)
        .sort((a, b) => Number(/^https:/i.test(b.url)) - Number(/^https:/i.test(a.url)));
      if (!radioStations.length) throw new Error('No hay transmisiones compatibles');
      radioStationIndex = Math.max(0, radioStations.findIndex(station => station.uuid && station.uuid === settings.radioStationUuid));
      await selectRadioStation(radioStationIndex, autoPlay || settings.radioEnabled);
      if (currentPage === 'radio') renderRadio();
      showToast(`${radioStations.length} EMISORAS ENCONTRADAS`);
    } catch (error) {
      if (error?.name === 'AbortError') radioStatus = 'LA BÚSQUEDA TARDÓ DEMASIADO';
      else radioStatus = 'NO SE PUDO CONECTAR A RADIO BROWSER';
      updateRadioUi();
      showToast(`${radioStatus}. REVISA INTERNET.`, 3200);
    } finally {
      clearTimeout(timeout);
      radioFetchController = null;
    }
  }

  async function selectRadioStation(index, autoPlay = false) {
    const station = radioStations[index];
    if (!station) return false;
    radioStationIndex = index;
    settings.radioUrl = station.url;
    settings.radioStationName = station.name;
    settings.radioStationUuid = station.uuid;
    settings.radioStationCountry = station.country;
    settings.radioStationCodec = station.codec;
    settings.radioStationBitrate = station.bitrate;
    settings.radioStationFavicon = station.favicon || '';
    saveSettings();
    const player = ensureRadio();
    const current = player.currentSrc || player.src || '';
    if (current !== station.url) {
      player.pause();
      player.src = station.url;
      player.load();
    }
    radioStatus = `LISTA · ${station.name.toUpperCase()}`;
    updateRadioUi();
    const select = document.getElementById('vice-radio-station');
    if (select) select.value = String(index);
    if (autoPlay) return playRadio();
    return true;
  }

  async function changeRadioStation(direction) {
    if (!radioStations.length) {
      await loadRadioStations(true);
      return;
    }
    const next = (radioStationIndex + direction + radioStations.length) % radioStations.length;
    await selectRadioStation(next, true);
    if (currentPage === 'radio') renderRadio();
  }

  async function playRadio() {
    if (!settings.radioUrl) {
      await loadRadioStations(true);
      return;
    }
    const player = ensureRadio();
    const current = player.currentSrc || player.src || '';
    if (current !== settings.radioUrl) {
      player.src = settings.radioUrl;
      player.load();
    }
    settings.radioEnabled = true;
    saveSettings();
    applyAudioSettings();
    try {
      await player.play();
      radioStatus = settings.radioMode === 'vehicle' && !isPlayerInVehicle()
        ? 'ENCENDIDA · SUBE A UN VEHÍCULO PARA OÍRLA'
        : 'REPRODUCIENDO EN DIRECTO';
      updateRadioUi();
      return true;
    } catch (error) {
      settings.radioEnabled = false;
      saveSettings();
      radioStatus = 'NO SE PUDO REPRODUCIR · PRUEBA OTRA EMISORA';
      updateRadioUi();
      showToast('ESA EMISORA NO RESPONDE. PULSA SIGUIENTE.', 3000);
      return false;
    }
  }

  async function toggleRadio() {
    const player = ensureRadio();
    if (!player.paused && player.src) {
      player.pause();
      settings.radioEnabled = false;
      radioStatus = 'RADIO EN PAUSA';
      saveSettings();
      if (currentPage === 'radio') renderRadio();
      return;
    }
    await playRadio();
    if (currentPage === 'radio') renderRadio();
  }

  function stopRadio(render = false) {
    radioFetchController?.abort();
    if (radio) {
      radio.pause();
      try { radio.currentTime = 0; } catch {}
      radio.removeAttribute('src');
      radio.load();
    }
    settings.radioEnabled = false;
    radioStatus = 'RADIO APAGADA';
    saveSettings();
    updateRadioUi();
    if (render && currentPage === 'radio') renderRadio();
  }

  function updateRadioRuntime(now = performance.now()) {
    if (now - radioVehicleTick < 500) return;
    radioVehicleTick = now;
    if (!radio) return;
    applyRadioVolume();
    if (settings.radioEnabled && !radio.paused) {
      const nextStatus = settings.radioMode === 'vehicle' && !isPlayerInVehicle()
        ? 'ENCENDIDA · SUBE A UN VEHÍCULO PARA OÍRLA'
        : 'REPRODUCIENDO EN DIRECTO';
      if (radioStatus !== nextStatus) {
        radioStatus = nextStatus;
        updateRadioUi();
      }
    }
  }

  function applyRadioVolume() {
    if (!radio) return;
    const master = Math.max(0, Math.min(1, Number(settings.masterVolume || 0) / 100));
    const level = Math.max(0, Math.min(1, Number(settings.radioVolume || 0) / 100));
    const audible = settings.radioMode === 'always' || isPlayerInVehicle();
    radio.volume = audible ? master * level : 0;
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.({ navigationUI: 'hide' })
        .then(() => setTimeout(() => { applyDisplaySettings(true); if (currentPage === 'advanced') renderAdvanced(); }, 120))
        .catch(() => showToast('NO SE PUDO ACTIVAR LA PANTALLA COMPLETA'));
    } else {
      document.exitFullscreen?.()
        .then(() => setTimeout(() => { applyDisplaySettings(true); if (currentPage === 'advanced') renderAdvanced(); }, 120))
        .catch(() => {});
    }
  }

  function openMenu(reason = 'manual') {
    if (startup?.isConnected && !startup.classList.contains('vice-hidden')) return;
    if (window.__VICE_FULL_MAP_OPEN__) return;
    createOverlay();
    if (overlay.classList.contains('vice-open')) return;
    renderMain();
    overlay.classList.add('vice-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('vice-menu-active');
    window.__VICE_MENU_OPEN__ = true;
    clearMovementKeys();
    suppressUnlockUntil = performance.now() + 700;
    if (document.pointerLockElement) {
      try { document.exitPointerLock?.(); } catch {}
    }
    requestAnimationFrame(() => overlay.querySelector('.vice-selected, button')?.focus?.({ preventScroll: true }));
    window.dispatchEvent(new CustomEvent('gta-manucho-menu-open', { detail: { reason } }));
  }

  function closeMenu(tryPointerLock = false) {
    if (!overlay) return;
    overlay.classList.remove('vice-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('vice-menu-active');
    window.__VICE_MENU_OPEN__ = false;
    clearMovementKeys();
    window.dispatchEvent(new CustomEvent('gta-manucho-menu-close'));
    if (!tryPointerLock) return;
    const canvas = getGame()?.renderer?.domElement;
    if (!canvas?.isConnected) return;
    suppressUnlockUntil = performance.now() + 900;
    try {
      canvas.tabIndex = 0;
      canvas.focus({ preventScroll: true });
      const result = canvas.requestPointerLock?.();
      result?.catch?.(() => {});
    } catch {}
  }

  function goBack() {
    if (currentPage === 'main') return closeMenu(false);
    if (currentPage === 'advanced') return renderScreen();
    if (currentParent === 'options' || ['controls', 'sound', 'radio', 'screen', 'language'].includes(currentPage)) return renderOptions();
    return renderMain();
  }

  function computeViewport() {
    const scale = Math.max(0.45, Math.min(1, Number(settings.scale || 100) / 100));
    const availableWidth = Math.max(320, window.innerWidth);
    const availableHeight = Math.max(240, window.innerHeight);
    let maxW = Math.max(320, Math.floor(availableWidth * scale));
    let maxH = Math.max(240, Math.floor(availableHeight * scale));
    if (settings.aspect === 'auto') return { width: maxW, height: maxH };
    const [aw, ah] = settings.aspect.split(':').map(Number);
    const ratio = aw / ah;
    let width = maxW;
    let height = Math.round(width / ratio);
    if (height > maxH) {
      height = maxH;
      width = Math.round(height * ratio);
    }
    return { width: Math.max(240, width), height: Math.max(240, height) };
  }

  function publishVideoSettings(profile, viewport, pixelRatio, shadows) {
    const trafficFactor = Math.max(.25, Math.min(1, Number(settings.trafficDensity || 100) / 100));
    const npcFactor = Math.max(.25, Math.min(1, Number(settings.npcDensity || 100) / 100));
    window.__VICE_VIDEO_SETTINGS__ = {
      quality: settings.quality,
      pixelRatio,
      viewport,
      carDistance: profile.carDistance,
      npcDistance: profile.npcDistance,
      maxVisibleCars: Math.max(3, Math.round(profile.maxVisibleCars * trafficFactor)),
      trafficDensity: trafficFactor,
      npcDensity: npcFactor,
      fpsLimit: Number(settings.fpsLimit || 0),
      shadows
    };
    window.dispatchEvent(new CustomEvent('vice-video-settings-changed', { detail: window.__VICE_VIDEO_SETTINGS__ }));
  }

  function applyDisplaySettings(force = false) {
    const profile = QUALITY[settings.quality] || QUALITY.medium;
    const viewport = computeViewport();
    const pixelRatio = Math.max(0.42, Math.min(window.devicePixelRatio || 1, profile.pixelRatio));
    const signature = [settings.quality, settings.aspect, settings.scale, settings.brightness, settings.shadows, viewport.width, viewport.height, pixelRatio].join('|');
    const game = getGame();

    if (!game?.renderer?.domElement || !game?.camera) {
      publishVideoSettings(profile, viewport, pixelRatio, false);
      return false;
    }
    if (!force && signature === lastAppliedSignature) return true;
    lastAppliedSignature = signature;

    const renderer = game.renderer;
    const canvas = renderer.domElement;
    try {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewport.width, viewport.height, false);
      renderer.shadowMap.enabled = Boolean(settings.shadows && settings.quality !== 'low');
      renderer.shadowMap.autoUpdate = renderer.shadowMap.enabled;
    } catch {}
    game.camera.aspect = viewport.width / viewport.height;
    game.camera.updateProjectionMatrix?.();
    game.cullDistance = profile.cullDistance;

    canvas.style.setProperty('position', 'fixed', 'important');
    canvas.style.setProperty('left', '50%', 'important');
    canvas.style.setProperty('top', '50%', 'important');
    canvas.style.setProperty('transform', 'translate(-50%, -50%)', 'important');
    canvas.style.setProperty('width', `${viewport.width}px`, 'important');
    canvas.style.setProperty('height', `${viewport.height}px`, 'important');
    canvas.style.setProperty('max-width', '100vw', 'important');
    canvas.style.setProperty('max-height', '100vh', 'important');
    canvas.style.setProperty('filter', `brightness(${Number(settings.brightness || 100) / 100})`, 'important');
    canvas.style.setProperty('background', '#000', 'important');
    document.body.classList.toggle('vice-letterboxed', viewport.width < window.innerWidth - 2 || viewport.height < window.innerHeight - 2);

    publishVideoSettings(profile, viewport, pixelRatio, renderer.shadowMap.enabled);
    return true;
  }

  function applyAudioSettings() {
    const master = Math.max(0, Math.min(1, Number(settings.masterVolume || 0) / 100));
    const effects = Math.max(0, Math.min(1, Number(settings.effectsVolume || 0) / 100));
    const radioLevel = Math.max(0, Math.min(1, Number(settings.radioVolume || 0) / 100));
    document.querySelectorAll('audio, video').forEach(media => {
      if (media === radio) return;
      try { media.volume = master * effects; } catch {}
    });
    if (radio) applyRadioVolume();
    window.__VICE_MASTER_VOLUME__ = master;
    window.__VICE_EFFECTS_VOLUME__ = effects;
    window.dispatchEvent(new CustomEvent('vice-audio-settings-changed', { detail: { master, effects, radio: radioLevel } }));
  }

  function publishControlSettings() {
    window.__VICE_CONTROL_SETTINGS__ = {
      mouseSensitivity: Number(settings.mouseSensitivity || 50) / 50,
      invertY: Boolean(settings.invertY),
      autoRun: Boolean(settings.autoRun),
      viewerMode: settings.viewerMode
    };
    window.dispatchEvent(new CustomEvent('vice-control-settings-changed', { detail: window.__VICE_CONTROL_SETTINGS__ }));
  }

  function applyViewerSetting() {
    publishControlSettings();
    window.dispatchEvent(new CustomEvent('vice-view-mode-request', { detail: { mode: settings.viewerMode } }));
  }

  function publishPerformanceSettings() {
    applyDisplaySettings(true);
  }

  function publishUiSettings() {
    window.__VICE_UI_SETTINGS__ = {
      legend: Boolean(settings.legend),
      subtitles: Boolean(settings.subtitles),
      saveGallery: Boolean(settings.saveGallery),
      radarMode: settings.radarMode
    };
    window.__VICE_RADAR_MODE__ = settings.radarMode;
    window.dispatchEvent(new CustomEvent('vice-ui-settings-changed', { detail: window.__VICE_UI_SETTINGS__ }));
  }

  function applyHudSettings() {
    publishUiSettings();
    const system = window.__CITY_LIFE_SYSTEM__;
    if (typeof system?.setRadarMode === 'function') system.setRadarMode(settings.radarMode);
  }

  function applyAllSettings() {
    applyDisplaySettings(true);
    applyAudioSettings();
    publishControlSettings();
    applyHudSettings();
  }

  function waitForGame() {
    publishVideoSettings(QUALITY[settings.quality] || QUALITY.medium, computeViewport(), .72, false);
    if (applyDisplaySettings(true)) {
      applyAllSettings();
      return;
    }
    clearInterval(gameWait);
    gameWait = window.setInterval(() => {
      if (!applyDisplaySettings(true)) return;
      clearInterval(gameWait);
      gameWait = 0;
      applyAllSettings();
    }, 180);
    setTimeout(() => {
      clearInterval(gameWait);
      gameWait = 0;
    }, 20000);
  }

  function isEditableTarget(target) {
    return target?.matches?.('input, select, textarea, [contenteditable="true"]');
  }

  function navigateButtons(direction) {
    const buttons = [...overlay.querySelectorAll('.vice-menu-button:not([disabled]), .vice-small-button:not([disabled])')];
    if (!buttons.length) return;
    let index = buttons.indexOf(document.activeElement);
    if (index < 0) index = 0;
    else index = (index + direction + buttons.length) % buttons.length;
    buttons[index].focus({ preventScroll: true });
    selectButton(buttons[index]);
  }

  document.addEventListener('keydown', event => {
    if (overlay?.classList.contains('vice-open')) {
      if (event.code === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        goBack();
        return;
      }
      if (!isEditableTarget(event.target) && (event.code === 'ArrowDown' || event.code === 'ArrowUp')) {
        event.preventDefault();
        event.stopPropagation();
        navigateButtons(event.code === 'ArrowDown' ? 1 : -1);
        return;
      }
      if (event.code === 'Enter' && document.activeElement?.matches?.('button')) {
        event.preventDefault();
        document.activeElement.click();
        return;
      }
      if (event.code === 'Tab') {
        event.stopPropagation();
        return;
      }
      return;
    }

    if (event.code !== 'Escape' || event.repeat) return;
    if (startup?.isConnected && !startup.classList.contains('vice-hidden')) return;
    if (window.__VICE_FULL_MAP_OPEN__) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openMenu('escape-key');
  }, true);

  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement) return;
    if (performance.now() < suppressUnlockUntil) return;
    if (overlay?.classList.contains('vice-open')) return;
    if (startup?.isConnected && !startup.classList.contains('vice-hidden')) return;
    if (window.__VICE_FULL_MAP_OPEN__ || window.__VICE_ZONE_TRANSITION__) return;
    if (!getGame()?.renderer?.domElement) return;
    setTimeout(() => {
      if (document.pointerLockElement || overlay?.classList.contains('vice-open')) return;
      if (window.__VICE_FULL_MAP_OPEN__ || performance.now() < suppressUnlockUntil) return;
      openMenu('pointer-unlock');
    }, 90);
  });

  window.addEventListener('vice-map-visibility-changed', event => {
    if (event.detail?.visible) suppressUnlockUntil = performance.now() + 1800;
  });

  window.addEventListener('resize', () => requestAnimationFrame(() => applyDisplaySettings(true)));
  document.addEventListener('fullscreenchange', () => setTimeout(() => applyDisplaySettings(true), 80));
  document.addEventListener('play', applyAudioSettings, true);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearMovementKeys();
  });

  function fpsLoop(now) {
    updateRadioRuntime(now);
    fpsFrames++;
    if (now - fpsStamp >= 1000) {
      fpsValue = Math.round((fpsFrames * 1000) / (now - fpsStamp));
      fpsFrames = 0;
      fpsStamp = now;
    }
    requestAnimationFrame(fpsLoop);
  }

  document.addEventListener('DOMContentLoaded', () => {
    createStartup();
    createOverlay();
    waitForGame();
    requestAnimationFrame(fpsLoop);
  }, { once: true });

  window.__VICE_SETTINGS_MENU__ = {
    open: openMenu,
    close: closeMenu,
    apply: applyAllSettings,
    showPage(page) {
      if (!overlay?.classList.contains('vice-open')) openMenu('api');
      if (page === 'options') renderOptions();
      else if (page === 'screen') renderScreen();
      else renderMain();
    },
    get settings() { return { ...settings }; }
  };
  window.__GTA_RADIO__ = {
    play: playRadio,
    pause: toggleRadio,
    stop: () => stopRadio(false),
    next: () => changeRadioStation(1),
    previous: () => changeRadioStation(-1),
    search: genre => {
      if (genre) settings.radioGenre = String(genre);
      return loadRadioStations(false);
    },
    get station() { return settings.radioStationName || ''; },
    get element() { return radio; }
  };
})();
