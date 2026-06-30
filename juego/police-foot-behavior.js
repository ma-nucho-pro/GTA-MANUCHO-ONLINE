/**
 * GTA MANUCHO V84 — código del proyecto.
 * Creado e integrado por Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * ARKEA AI / Manucho · conserva LICENSE, NOTICE.md y estos créditos al reutilizar.
 */
const WORLD_SCALE = 16;
const ARREST_DISTANCE = 4.2 * WORLD_SCALE;
const ARREST_TIME = 5.5;
const POLICE_SHOT_INTERVAL = 1250;
const MAX_FOOT_SHOT_DAMAGE = 4.2;

let game = null;
let patchedWorld = null;
let arrestProgress = 0;

function groundAt(x, z, fallback = 0) {
  try {
    const value = game?.getGroundY?.(x, fallback + 900, z, false);
    return Number.isFinite(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function wantedLevel(world) {
  try {
    const value = typeof world.getWantedLevel === 'function' ? world.getWantedLevel() : world.wantedLevel;
    return Number.isFinite(value) ? Math.max(0, Math.min(5, value)) : 0;
  } catch {
    return 0;
  }
}

function keepOfficersGrounded(world) {
  for (const officer of world.policeAgents || []) {
    const root = officer?.root;
    if (!root) continue;
    let y = groundAt(root.position.x, root.position.z, root.position.y);
    if (!Number.isFinite(y) || y < -2 * WORLD_SCALE) {
      const player = game?.playerContainer?.position;
      if (player) {
        const index = Math.max(0, (world.policeAgents || []).indexOf(officer));
        const angle = index * 2.399963229728653;
        root.position.x = player.x + Math.cos(angle) * 9 * WORLD_SCALE;
        root.position.z = player.z + Math.sin(angle) * 9 * WORLD_SCALE;
        y = groundAt(root.position.x, root.position.z, player.y);
      }
    }
    root.position.y = y + .08;
    root.rotation.x = 0;
    root.rotation.z = 0;
    // La skin Collada adjunta usa Z-UP. La IA base puede volver a modificar la
    // transformación visual al perseguir o arrestar; se restablece cada cuadro
    // para que los pies permanezcan abajo y el agente mire hacia delante.
    if (officer.visual?.userData?.v66PoliceSkin) {
      const base = officer.visual.userData.v74PoliceBaseRotation || { x:0, y:Math.PI, z:0 };
      officer.visual.rotation.set(0, base.y, 0);
      officer.visual.updateMatrixWorld?.(true);
    }
    if (officer.velocity?.isVector3) officer.velocity.y = 0;
    if (officer.home?.isVector3) officer.home.y = groundAt(officer.home.x, officer.home.z, officer.home.y);
  }
}

function closestVisibleOfficer(world) {
  const player = game?.playerContainer?.position;
  if (!player) return null;
  let best = null;
  let bestSq = Infinity;
  for (const officer of world.policeAgents || []) {
    const root = officer?.root;
    if (!root?.visible || officer.state === 'dead') continue;
    const distanceSq = root.position.distanceToSquared(player);
    if (distanceSq < bestSq) {
      bestSq = distanceSq;
      best = officer;
    }
  }
  return best ? { officer: best, distance: Math.sqrt(bestSq) } : null;
}

function arrestPlayer(world) {
  if (window.__CITY_LIFE_SYSTEM__?.arrest) { window.__CITY_LIFE_SYSTEM__.arrest('ARRESTADO POR VCPD'); arrestProgress = 0; return; }
  arrestProgress = 0;
  world.wantedLevel = 0;
  world.wantedAge = 0;
  for (const officer of world.policeAgents || []) {
    officer.root.visible = false;
    officer.state = 'idle';
  }
  const x = -1870 * WORLD_SCALE;
  const z = -3370 * WORLD_SCALE;
  const y = groundAt(x, z, game.playerContainer.position.y);
  game.playerContainer.position.set(x, y + .4, z);
  game.state.vy = 0;
  game.state.onGround = true;
  game.state.inWater = false;
  game.health = Math.max(65, game.health || 0);
  game.money = Math.max(0, Number(game.money || 0) - 500);
  game.currentMessage = 'ARRESTADO POR VCPD · MULTA $500';
  game.updateHUDState?.();
  setTimeout(() => {
    if (game.currentMessage === 'ARRESTADO POR VCPD · MULTA $500') {
      game.currentMessage = undefined;
      game.updateHUDState?.();
    }
  }, 2500);
}

function updateArrest(world, dt) {
  const wanted = wantedLevel(world);
  if (wanted < 1 || wanted >= 3 || game.activeCar || game.activeBoat || window.__ACTIVE_AIRCRAFT__ || window.__ACTIVE_TANK__) {
    arrestProgress = 0;
    return;
  }
  const closest = closestVisibleOfficer(world);
  if (!closest || closest.distance > ARREST_DISTANCE) {
    arrestProgress = Math.max(0, arrestProgress - dt * .9);
    return;
  }
  arrestProgress += dt;
  closest.officer.state = 'arrest';
  world.playAction?.(closest.officer, 'idle');
  if (arrestProgress >= ARREST_TIME) arrestPlayer(world);
}

function patchWorld(world) {
  if (!world || world === patchedWorld || world.__v61GroundPolicePatched) return;
  patchedWorld = world;
  world.__v61GroundPolicePatched = true;

  // Solo cuatro agentes del sistema base permanecen activos. Las unidades extra
  // se retiraban visualmente, pero seguían calculando rutas y disparos fuera de
  // pantalla, causando congelamientos al comenzar una persecución.
  if ((world.policeAgents || []).length > 4) {
    const keep = world.policeAgents.slice(0, 4);
    for (const officer of world.policeAgents.slice(4)) officer?.root?.parent?.remove(officer.root);
    world.policeAgents = keep;
    world.agents = keep;
  }

  const originalShoot = typeof world.agentShoot === 'function' ? world.agentShoot.bind(world) : null;
  if (originalShoot) {
    world.agentShoot = function balancedGroundPoliceShot(agent, target) {
      const wanted = wantedLevel(world);
      if (wanted < 2 || agent?.faction !== 'police') return;
      const now = performance.now();
      if (now - (world.__v61LastPoliceShot || 0) < POLICE_SHOT_INTERVAL) return;
      world.__v61LastPoliceShot = now;
      const healthBefore = Number(game.health || 0);
      originalShoot(agent, target);
      const minimumHealth = healthBefore - MAX_FOOT_SHOT_DAMAGE;
      if (game.health < minimumHealth) game.health = minimumHealth;
    };
  }

  // La policía visible y el arresto los gestiona territory-combat.js. El mundo
  // base se conserva solo para estrellas/tiempo de búsqueda y se actualiza a 4 Hz,
  // evitando dos IA, dos rutas y dos grupos de disparos simultáneos.
  world.agentShoot = () => {};
  const originalUpdate = typeof world.update === 'function' ? world.update.bind(world) : null;
  if (originalUpdate) {
    let policeAccumulator = 0;
    world.update = function groundedPoliceUpdate(dt, elapsed) {
      const safeDt = Math.min(.1, Math.max(0, Number(dt) || 0));
      policeAccumulator += safeDt;
      if (policeAccumulator < .25) return;
      const step = Math.min(.3, policeAccumulator);
      policeAccumulator = 0;
      originalUpdate(step, elapsed);
      for (const officer of world.policeAgents || []) {
        if (!officer?.root) continue;
        officer.root.visible = false;
        officer.state = 'idle';
      }
      if (Number(game.health || 0) <= 0) window.__CITY_LIFE_SYSTEM__?.hospitalize?.('ABATIDO POR VCPD');
    };
  }
  for (const officer of world.policeAgents || []) if (officer?.root) officer.root.visible = false;
}

function monitor() {
  game = window.__VICE_CITY_GAME__ || game;
  if (game?.crimeWorld) patchWorld(game.crimeWorld);
  setTimeout(monitor, 180);
}

monitor();
