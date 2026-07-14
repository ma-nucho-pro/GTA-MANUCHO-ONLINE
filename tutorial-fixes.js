(() => {
  'use strict';
  const held = new Set();
  const recent = new Map();
  const WINDOW_MS = 2200;
  let skipping = false;
  const now = () => performance.now();
  const recentEnough = code => now() - (recent.get(code) ?? -Infinity) <= WINDOW_MS;
  const shiftReady = event => Boolean(event?.shiftKey) || held.has('ShiftLeft') || held.has('ShiftRight') || recentEnough('ShiftLeft') || recentEnough('ShiftRight');
  const comboReady = event => shiftReady(event) && (held.has('KeyI') || recentEnough('KeyI')) && (held.has('KeyL') || recentEnough('KeyL'));

  function releaseMovement() {
    for (const [code, key] of [['KeyW','w'],['KeyA','a'],['KeyS','s'],['KeyD','d'],['ShiftLeft','Shift'],['ShiftRight','Shift'],['Space',' ']]) {
      window.dispatchEvent(new KeyboardEvent('keyup', { code, key, bubbles: true, cancelable: true }));
      document.dispatchEvent(new KeyboardEvent('keyup', { code, key, bubbles: true, cancelable: true }));
    }
  }
  function notice() {
    document.getElementById('tutorial-skip-notice')?.remove();
    const node = document.createElement('div');
    node.id = 'tutorial-skip-notice';
    node.textContent = 'TUTORIAL COMPLETADO — INICIANDO JUEGO…';
    node.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:2147483647;padding:18px 26px;border-radius:4px;border:2px solid #ff8a00;background:rgba(12,8,3,.97);color:#ffe1b5;font:700 15px/1.4 monospace;letter-spacing:.08em;pointer-events:none';
    document.body.appendChild(node);
  }
  function skip(event) {
    if (skipping) return;
    skipping = true;
    event?.preventDefault?.();
    event?.stopPropagation?.();
    event?.stopImmediatePropagation?.();
    releaseMovement();
    try { document.exitPointerLock?.(); } catch {}
    try { window.speechSynthesis?.cancel(); } catch {}
    try { localStorage.setItem('exodo_tutorial_completed', '1'); localStorage.removeItem('vice_city_v72_started'); } catch {}
    notice();
    setTimeout(() => location.replace('./juego/index.html?noprogressive=1&v=88'), 140);
  }
  function down(event) {
    const code = event.code || '';
    held.add(code);
    recent.set(code, now());
    if (comboReady(event)) skip(event);
  }
  function up(event) { held.delete(event.code || ''); }
  window.addEventListener('keydown', down, true);
  document.addEventListener('keydown', down, true);
  window.addEventListener('keyup', up, true);
  document.addEventListener('keyup', up, true);
  setInterval(() => { if (!skipping && comboReady()) skip(); }, 35);
  window.addEventListener('blur', () => held.clear());
  document.addEventListener('visibilitychange', () => { if (document.hidden) held.clear(); });
  window.__SKIP_EXODO_TUTORIAL__ = skip;
})();

(() => {
  'use strict';
  window.__sayBikePhrase = function sayBikePhrase(language) {
    const isEnglish = String(language || '').toLowerCase().startsWith('en');
    try { sessionStorage.setItem('game_language', isEnglish ? 'en' : 'es'); } catch {}
    const text = isEnglish ? 'Oh shit, here we go again' : 'Oh mierda, aquí vamos de nuevo';
    try {
      const synth = window.speechSynthesis;
      if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = isEnglish ? 'en-US' : 'es-PE';
      utterance.rate = 0.94;
      utterance.pitch = 0.86;
      utterance.volume = 1;
      synth.speak(utterance);
    } catch (error) {
      console.warn('[bicicleta] No se pudo reproducir la frase.', error);
    }
  };
})();

// V15: Enter baja de la bicicleta en el tutorial sin cambiar el montaje ni los controles.
(() => {
  'use strict';

  function dismountWithEnter(event) {
    if (event.repeat) return;
    if (event.code !== 'Enter' && event.code !== 'NumpadEnter' && event.key !== 'Enter') return;

    const game = window.__tutorialGame;
    if (!game?.isRidingBike) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    // Reutiliza exactamente la lógica existente de la tecla E para desmontar.
    window.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'e',
      code: 'KeyE',
      bubbles: true,
      cancelable: true
    }));
    window.dispatchEvent(new KeyboardEvent('keyup', {
      key: 'e',
      code: 'KeyE',
      bubbles: true,
      cancelable: true
    }));
  }

  window.addEventListener('keydown', dismountWithEnter, true);
})();
