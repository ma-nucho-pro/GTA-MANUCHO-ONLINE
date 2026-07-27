/**
 * GTA MANUCHO V96 — Menú principal.
 * Se muestra ANTES de la cinemática y del tutorial:
 *   · INICIAR PARTIDA  → cinemática + tutorial + juego (flujo normal).
 *   · OPCIONES         → continuar la última partida, cargar un archivo .vcsave,
 *                        entrar directo al juego, pantalla completa.
 *   · SALIR DEL JUEGO  → intenta cerrar la pestaña / muestra despedida.
 * Conserva los créditos de Roberto Manuel Jara Peche (ma-nucho-pro) · ARKEA AI.
 */
(() => {
  'use strict';

  const AUTOSAVE_KEY = 'gta_manucho_v93_autosave';
  const PENDING_LOAD_KEY = 'vice_city_v70_pending_loaded_save';
  const GAME_URL = './juego/index.html?noprogressive=1';

  const menu = document.createElement('div');
  menu.id = 'gta-main-menu';
  document.body.appendChild(menu);

  let items = [];
  let selected = 0;
  let closed = false;

  function readAutosave() {
    try {
      const save = JSON.parse(localStorage.getItem(AUTOSAVE_KEY) || 'null');
      if (save && save.player && Number.isFinite(Number(save.player.x))) return save;
    } catch {}
    return null;
  }

  function autosaveLabel(save) {
    try {
      const date = new Date(Number(save.savedAt) || Date.now());
      const money = Math.round(Number(save.player.money) || 0).toLocaleString('es-PE');
      return `${date.toLocaleDateString('es-PE')} ${date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })} · $${money}`;
    } catch { return 'PARTIDA GUARDADA'; }
  }

  function goToGame(loaded) {
    location.href = GAME_URL + (loaded ? '&loaded=1' : '');
  }

  function continueGame() {
    const save = readAutosave();
    if (!save) return;
    try {
      localStorage.setItem(PENDING_LOAD_KEY, JSON.stringify({
        player: save.player,
        runtime: save.runtime || {},
        loadedAt: Date.now()
      }));
    } catch {}
    goToGame(true);
  }

  function loadSaveFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.vcsave,.json,application/json';
    input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      input.remove();
      if (!file) return;
      try {
        const save = JSON.parse(await file.text());
        if (!save || typeof save !== 'object' || !save.player) throw new Error('sin datos de jugador');
        if (save.localStorage && typeof save.localStorage === 'object') {
          for (const [key, value] of Object.entries(save.localStorage)) {
            if (!(key.startsWith('vice_') || key.startsWith('vice-') || key.startsWith('game_of_crew'))) continue;
            if (typeof value === 'string') { try { localStorage.setItem(key, value); } catch {} }
          }
        }
        localStorage.setItem(PENDING_LOAD_KEY, JSON.stringify({
          player: save.player,
          runtime: save.runtime || {},
          loadedAt: Date.now()
        }));
        goToGame(true);
      } catch (error) {
        console.error('[main-menu] Archivo de partida inválido.', error);
        alert('EL ARCHIVO NO ES UNA PARTIDA VÁLIDA DE GTA MANUCHO (.vcsave)');
      }
    });
    input.click();
  }

  function startGame() {
    if (closed) return;
    closed = true;
    window.__GTA_MENU_STARTED__ = true;
    window.removeEventListener('keydown', onMenuKey, true);
    menu.classList.add('gta-menu-hidden');
    window.dispatchEvent(new Event('gta-main-menu-start'));
    setTimeout(() => menu.remove(), 800);
  }

  function toggleFullscreen(button) {
    const active = Boolean(document.fullscreenElement);
    try {
      if (active) document.exitFullscreen?.();
      else document.documentElement.requestFullscreen?.();
    } catch {}
    setTimeout(() => {
      const nowActive = Boolean(document.fullscreenElement);
      const small = button.querySelector('small');
      if (small) small.textContent = nowActive ? 'ACTIVADA · PULSA PARA SALIR' : 'PANTALLA NORMAL · PULSA PARA ACTIVAR';
    }, 260);
  }

  function exitGame() {
    try { window.close(); } catch {}
    setTimeout(() => {
      if (document.hidden) return;
      renderGoodbye();
    }, 320);
  }

  function shell(inner) {
    menu.innerHTML = `
      <div class="gta-menu-bg"></div>
      <div class="gta-menu-shade"></div>
      <div class="gta-menu-grain"></div>
      <div class="gta-menu-version">V96 · RECURSOS ORIGINALES INTEGRADOS</div>
      ${inner}
      <div class="gta-menu-foot">
        <span><b>↑ ↓</b> MOVERSE &nbsp;&nbsp; <b>ENTER</b> SELECCIONAR &nbsp;&nbsp; <b>CLIC</b> TAMBIÉN FUNCIONA</span>
        <span>GTA MANUCHO · ROBERTO MANUEL JARA PECHE · ma-nucho-pro · SOMOS ARKEA AI</span>
      </div>`;
  }

  function bindList() {
    items = Array.from(menu.querySelectorAll('.gta-menu-item:not([disabled])'));
    selected = Math.min(selected, Math.max(0, items.length - 1));
    items.forEach((item, index) => {
      item.addEventListener('mouseenter', () => selectItem(index));
      item.addEventListener('click', () => { selectItem(index); activate(item); });
    });
    selectItem(0);
  }

  function selectItem(index) {
    if (!items.length) return;
    selected = (index + items.length) % items.length;
    items.forEach((item, i) => item.classList.toggle('gta-selected', i === selected));
  }

  function activate(item) {
    const action = item?.dataset?.action;
    if (action === 'start') startGame();
    else if (action === 'options') renderOptions();
    else if (action === 'exit') exitGame();
    else if (action === 'continue') continueGame();
    else if (action === 'load') loadSaveFile();
    else if (action === 'direct') goToGame(false);
    else if (action === 'fullscreen') toggleFullscreen(item);
    else if (action === 'back') renderMain();
    else if (action === 'back-menu') renderMain();
  }

  function renderMain() {
    shell(`
      <div class="gta-menu-panel">
        <div>
          <div class="gta-menu-kicker">ARKEA AI PRESENTA</div>
          <div class="gta-menu-title">GTA<br><em>MANUCHO</em></div>
          <div class="gta-menu-sub">MENÚ PRINCIPAL · MUNDO ABIERTO 3D</div>
        </div>
        <div class="gta-menu-list">
          <button type="button" class="gta-menu-item" data-action="start">INICIAR PARTIDA<small>Cinemática · tutorial · ciudad</small></button>
          <button type="button" class="gta-menu-item" data-action="options">OPCIONES<small>Cargar partida · pantalla · más</small></button>
          <button type="button" class="gta-menu-item" data-action="exit">SALIR DEL JUEGO<small>Cerrar GTA MANUCHO</small></button>
        </div>
      </div>`);
    bindList();
  }

  function renderOptions() {
    const save = readAutosave();
    shell(`
      <div class="gta-menu-panel">
        <div>
          <div class="gta-menu-kicker">GTA MANUCHO</div>
          <div class="gta-menu-title"><em>OPCIONES</em></div>
        </div>
        <div class="gta-menu-list">
          <button type="button" class="gta-menu-item" data-action="continue" ${save ? '' : 'disabled'}>CONTINUAR PARTIDA<small>${save ? autosaveLabel(save) : 'Aún no hay partida guardada automáticamente'}</small></button>
          <button type="button" class="gta-menu-item" data-action="load">CARGAR PARTIDA (ARCHIVO)<small>Abrir un archivo .vcsave guardado en una propiedad</small></button>
          <button type="button" class="gta-menu-item" data-action="direct">ENTRAR DIRECTO AL JUEGO<small>Sin cinemática ni tutorial</small></button>
          <button type="button" class="gta-menu-item" data-action="fullscreen">PANTALLA COMPLETA<small>${document.fullscreenElement ? 'ACTIVADA · PULSA PARA SALIR' : 'PANTALLA NORMAL · PULSA PARA ACTIVAR'}</small></button>
          <button type="button" class="gta-menu-item" data-action="back">ATRÁS<small>Volver al menú principal</small></button>
        </div>
        <div class="gta-menu-note">CONTROLES, SONIDO, RADIO, IDIOMA Y MÁS AJUSTES ESTÁN DENTRO DEL JUEGO PULSANDO <b>ESC</b>. LA PARTIDA SE GUARDA AUTOMÁTICAMENTE MIENTRAS JUEGAS Y TAMBIÉN EN LOS DISQUETES DE TUS PROPIEDADES.</div>
      </div>`);
    bindList();
  }

  function renderGoodbye() {
    shell(`
      <div class="gta-menu-bye">
        <h2>GRACIAS POR JUGAR <em>GTA MANUCHO</em></h2>
        <p>EL NAVEGADOR NO PERMITE CERRAR ESTA PESTAÑA AUTOMÁTICAMENTE.<br>YA PUEDES CERRARLA TÚ MISMO CUANDO QUIERAS.</p>
        <div class="gta-menu-list">
          <button type="button" class="gta-menu-item" data-action="back-menu">VOLVER AL MENÚ</button>
        </div>
      </div>`);
    bindList();
  }

  function onMenuKey(event) {
    if (closed) return;
    if (isEditable(event.target)) return;
    if (event.code === 'ArrowDown' || event.code === 'KeyS') { event.preventDefault(); event.stopImmediatePropagation(); selectItem(selected + 1); }
    else if (event.code === 'ArrowUp' || event.code === 'KeyW') { event.preventDefault(); event.stopImmediatePropagation(); selectItem(selected - 1); }
    else if (event.code === 'Enter' || event.code === 'Space' || event.code === 'NumpadEnter') { event.preventDefault(); event.stopImmediatePropagation(); activate(items[selected]); }
    else if (event.code === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); renderMain(); }
  }

  function isEditable(target) {
    return target && target.matches && target.matches('input, select, textarea, [contenteditable="true"]');
  }

  window.addEventListener('keydown', onMenuKey, true);
  renderMain();
})();
