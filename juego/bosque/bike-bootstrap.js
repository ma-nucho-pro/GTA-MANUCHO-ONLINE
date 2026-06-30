(() => {
  'use strict';
  const start = () => {
    import('./bicycle-controller.js').catch(error => {
      console.error('[BICICLETA] La integración no pudo iniciar, pero el bosque seguirá funcionando.', error);
      let node = document.getElementById('bosque-bike-hud');
      if (!node) {
        node = document.createElement('div');
        node.id = 'bosque-bike-hud';
        node.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2200;padding:10px 15px;border-radius:12px;background:rgba(4,9,12,.82);border:1px solid #ff7373;color:#fff;font:700 12px Arial;pointer-events:none';
        document.body.appendChild(node);
      }
      node.textContent = 'El bosque abrió, pero no se pudo cargar la bicicleta.';
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
