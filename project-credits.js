/**
 * GTA MANUCHO — créditos permanentes del proyecto.
 * Creado e integrado por Roberto Manuel Jara Peche.
 * GitHub: ma-nucho-pro · Marca: ARKEA AI / Manucho.
 * Instagram: https://www.instagram.com/robertmanuchojp/
 * YouTube: https://www.youtube.com/@ManuchoAI
 * LinkedIn: https://www.linkedin.com/in/roberto-manuel-jara-peche-10867240b/
 * Código original disponible conforme a LICENSE. Al reutilizar, conserva la atribución.
 */
(() => {
  'use strict';
  const credits = Object.freeze({
    project: 'GTA MANUCHO',
    version: 'V84',
    creator: 'Roberto Manuel Jara Peche',
    githubUser: 'ma-nucho-pro',
    brand: 'ARKEA AI / Manucho',
    instagram: 'https://www.instagram.com/robertmanuchojp/',
    youtube: 'https://www.youtube.com/@ManuchoAI',
    linkedin: 'https://www.linkedin.com/in/roberto-manuel-jara-peche-10867240b/',
    license: 'MIT para el código original; los recursos de terceros conservan sus licencias.'
  });
  Object.defineProperty(window, 'GTA_MANUCHO_CREDITS', {
    value: credits,
    writable: false,
    configurable: false,
    enumerable: true
  });
  console.info(
    '%cGTA MANUCHO V84%c · Roberto Manuel Jara Peche · ARKEA AI · GitHub: ma-nucho-pro',
    'font-weight:900;color:#ff80c8;background:#080b14;padding:4px 8px;border-radius:4px',
    'color:#d9e7ff'
  );
})();
