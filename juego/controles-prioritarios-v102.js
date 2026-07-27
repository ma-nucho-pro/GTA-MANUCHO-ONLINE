/**
 * GTA MANUCHO V102 — CONTROLES PRIORITARIOS (E y V)
 * Autor e integración: Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * Marca: ARKEA AI / Manucho. Uso permitido conforme a LICENSE; conserva los créditos.
 *
 * POR QUÉ ESTE ARCHIVO NO ES UN MÓDULO
 * Los <script type="module"> se ejecutan aplazados, después de analizar todo el
 * HTML. Un <script> normal se ejecuta en el momento. Al colocarlo el primero de
 * la página, este escuchador queda registrado ANTES que el del motor y que el de
 * cualquier módulo, así que en la fase de captura es el primero en recibir la
 * tecla. Ese era exactamente el problema de la E: otro escuchador anterior se
 * quedaba con la pulsación y llamaba a stopImmediatePropagation, de modo que la
 * primera E no llegaba nunca a bajar de la moto y hacía falta pulsarla dos veces.
 *
 * Sólo intercepta cuando ya se va montado. Si el jugador está a pie, deja pasar
 * la tecla para que los módulos de siempre se encarguen de subir al vehículo.
 */
(function () {
  'use strict';

  var held = Object.create(null);

  function api() { return window.__V100_BIKE_API__ || null; }
  function game() { return window.__VICE_CITY_GAME__ || null; }

  function typingSomewhere() {
    var node = document.activeElement;
    if (!node) return false;
    var tag = node.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || node.isContentEditable === true;
  }

  function consume(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    var g = game();
    if (g && g.keys) {
      g.keys[event.code] = false;
      g.keys[event.key] = false;
      if (event.code === 'KeyE') { g.keys.KeyE = false; g.keys.e = false; g.keys.E = false; }
      if (event.code === 'KeyV') { g.keys.KeyV = false; g.keys.v = false; g.keys.V = false; }
    }
  }

  function onKeyDown(event) {
    if (event.code !== 'KeyE' && event.code !== 'KeyV') return;
    if (typingSomewhere()) return;

    // Una acción por pulsación física: ni la repetición del teclado ni un
    // segundo escuchador pueden colar un disparo extra.
    if (event.repeat || held[event.code]) {
      if (event.repeat) { event.preventDefault(); event.stopImmediatePropagation(); }
      return;
    }

    var bikes = api();
    if (!bikes) return;

    if (event.code === 'KeyV') {
      if (!bikes.activeBike) return;   // en coche o a pie, que decidan los demás
      held.KeyV = true;
      consume(event);
      try { bikes.cycleBikeCamera(); } catch (error) { console.warn('[controles-v102] cámara de moto', error); }
      return;
    }

    // KeyE: sólo se intercepta para BAJAR. Subirse sigue en manos de los
    // módulos normales, que ya saben qué vehículo hay cerca.
    if (bikes.activeBike) {
      held.KeyE = true;
      consume(event);
      try { bikes.exitBike(); } catch (error) { console.warn('[controles-v102] bajar de la moto', error); }
      return;
    }
    if (bikes.activeRaft) {
      held.KeyE = true;
      consume(event);
      try { bikes.exitRaft(); } catch (error) { console.warn('[controles-v102] bajar de la balsa', error); }
    }
  }

  function onKeyUp(event) {
    if (event.code === 'KeyE' || event.code === 'KeyV') held[event.code] = false;
  }

  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('keyup', onKeyUp, true);
  window.addEventListener('blur', function () { held = Object.create(null); });


  /* ==================================================================== */
  /* V104 · CORTAFUEGOS DE RED                                            */
  /* ==================================================================== */
  /* En la consola del usuario se ven estas peticiones fallando una y otra
     vez durante la carga:
        threejs.org/examples/webgl_materials_car.glb          -> 404
        threejs.org/examples/models/gltf/Ferrari.glb          -> 404
        unpkg.com/.../ldraw/.../Q-Wing Star Fighter.mpd       -> bloqueado por CORS
     El motor las pide, espera el viaje de ida y vuelta completo, falla y
     entonces pasa al plan B. Son varios segundos de carga tirados y varios
     parones. Aquí se rechazan al instante, sin tocar la red, así que el motor
     va directo a su modelo de reserva sin esperar a nadie. */
  var DEAD_URLS = [
    'threejs.org/examples/webgl_materials_car.glb',
    'threejs.org/examples/models/gltf/Ferrari.glb',
    'unpkg.com/three@0.184.0/examples/models/ldraw/',
    'threejs.org/examples/models/ldraw/',
    /* V107: las dos casas japonesas del Parque del Retiro. Es el modelo
       LittlestTokyo de los ejemplos de three.js, que el juego se descarga de
       internet probando cinco espejos distintos. Bloqueándolo desaparecen las
       casas, se ahorran unos 3 MB y varios reintentos de red en la carga, que
       es parte de por qué el arranque va tan pesado. */
    /* V112: los otros dos espejos del Ferrari. Bloqueado el de threejs.org
       pero no estos, el motor se descargaba el modelo por aquí y montaba sus
       150 instancias de 360.000 triángulos cada una. Con estos dos fuera, el
       motor usa su coche procedural sencillo. */
    'raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/ferrari.glb',
    'cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/models/gltf/ferrari.glb',
    'models/gltf/LittlestTokyo.glb',
    '/models/gltf/webgl_loader_ifc.glb'
  ];

  function isDead(url) {
    if (!url) return false;
    var text = String(url);
    for (var i = 0; i < DEAD_URLS.length; i++) {
      if (text.indexOf(DEAD_URLS[i]) !== -1) return true;
    }
    return false;
  }

  var nativeFetch = window.fetch;
  if (typeof nativeFetch === 'function') {
    window.fetch = function v104Fetch(input, init) {
      var url = typeof input === 'string' ? input : (input && input.url);
      if (isDead(url)) {
        return Promise.resolve(new Response('', { status: 404, statusText: 'Not Found (V104: recurso muerto, se omite)' }));
      }
      return nativeFetch.call(this, input, init);
    };
  }

  var nativeOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function v104Open(method, url) {
    this.__v104Dead = isDead(url);
    return nativeOpen.apply(this, arguments);
  };
  var nativeSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function v104Send() {
    if (this.__v104Dead) {
      var xhr = this;
      setTimeout(function () {
        try { xhr.dispatchEvent(new ProgressEvent('error')); } catch (e) {}
      }, 0);
      return;
    }
    return nativeSend.apply(this, arguments);
  };

  /* ==================================================================== */
  /* V104 · FRENO AL SPAM DE CONSOLA                                      */
  /* ==================================================================== */
  /* Un error que se repite en cada fotograma no sólo rompe lo suyo: imprimir
     la traza cuesta milisegundos, y con la consola abierta muchísimo más. Eso
     por sí solo convierte 60 fps en una presentación de diapositivas. A partir
     de la repetición número 8 del mismo mensaje se calla y se avisa una vez.
     No se oculta nada nuevo: el primer aviso siempre se ve. */
  function throttleConsole(name) {
    var original = console[name];
    if (typeof original !== 'function') return;
    var counts = Object.create(null);
    console[name] = function v104Console() {
      var key;
      try {
        /* Se normaliza: fuera UUIDs, hexadecimales y números. Sin esto, avisos
           como "No target node found for track: <UUID>.position" cuentan como
           mensajes distintos y no se agrupan nunca. En el log del usuario había
           972 seguidos, cada uno con su traza: eso solo ya son segundos de
           parón, porque además THREE recorre el árbol entero por cada fallo. */
        key = String(arguments[0])
          .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<id>')
          .replace(/\b\d+(\.\d+)?\b/g, '<n>')
          .slice(0, 160);
      } catch (e) { key = '?'; }
      var n = (counts[key] = (counts[key] || 0) + 1);
      if (n <= 8) return original.apply(console, arguments);
      if (n === 9) return original.call(console, '[V104] Mensaje repetido más de 8 veces, se silencia para no hundir los FPS:', key);
    };
  }
  throttleConsole('error');
  throttleConsole('warn');

  window.addEventListener('error', function (event) {
    // Una excepción por fotograma es el peor enemigo de la fluidez. Se cuenta
    // y se avisa una sola vez con el sitio exacto, sin repetir la traza.
    var key = (event.message || '') + '@' + (event.filename || '') + ':' + (event.lineno || 0);
    window.__V104_ERRORS__ = window.__V104_ERRORS__ || Object.create(null);
    window.__V104_ERRORS__[key] = (window.__V104_ERRORS__[key] || 0) + 1;
    if (window.__V104_ERRORS__[key] === 30) {
      try { console.info('[V104] Este error se repite constantemente y está costando FPS:', key); } catch (e) {}
    }
  }, true);

  window.__V102_PRIORITY_CONTROLS__ = true;
  window.__V104_NET_FIREWALL__ = true;
})();
