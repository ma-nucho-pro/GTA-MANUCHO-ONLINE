/**
 * GTA MANUCHO V104 — PASAJEROS: VARIOS EN EL MISMO VEHÍCULO
 * Autor e integración: Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * Marca: ARKEA AI / Manucho. Uso permitido conforme a LICENSE; conserva los créditos.
 *
 * Sirve para cualquier vehículo del juego sin tocar ninguno de ellos: coche,
 * moto, barco, balsa, helicóptero, jet, avión y tanque. En vez de añadir
 * asientos a mano vehículo por vehículo, los asientos se DEDUCEN de la caja
 * envolvente real de cada uno, así que un vehículo nuevo funciona solo.
 *
 * Tres cosas separadas:
 *   1. Los aliados reclutados de tu banda suben contigo.
 *   2. Un amigo del modo online puede subirse a TU vehículo, y tú al suyo.
 *   3. Quién manda sobre la física: SIEMPRE el conductor. Los pasajeros no
 *      simulan nada, se limitan a colocarse en su asiento. Así no hay dos
 *      máquinas peleando por la posición del mismo vehículo, que es lo que
 *      hace que los vehículos compartidos vibren en otros juegos.
 */
import * as THREE from './bosque/libs/three.module.js';

const WORLD_SCALE = 16;
const MAX_SEATS = 5;
const BOARD_DISTANCE = 190;

let game = null;
let installed = false;

const box = new THREE.Box3();
const size = new THREE.Vector3();
const center = new THREE.Vector3();
const tempA = new THREE.Vector3();
const tempQ = new THREE.Quaternion();

// Cuando vamos de pasajeros en el vehículo de un amigo.
let ridingRemote = null;   // { id, seat }

// ---------------------------------------------------------------------------
// QUÉ VEHÍCULO LLEVA EL JUGADOR LOCAL
// ---------------------------------------------------------------------------
function localVehicle() {
  const w = window;
  const aircraft = w.__ACTIVE_AIRCRAFT__;
  if (aircraft?.root) return { root: aircraft.root, kind: 'aire' };
  const tank = w.__ACTIVE_TANK__;
  if (tank?.root) return { root: tank.root, kind: 'tierra' };
  if (game?.activeBoat) return { root: game.activeBoat, kind: 'agua' };
  if (game?.activeCar) {
    return { root: game.activeCar, kind: game.activeCar.userData?.v95BikeEntry ? 'moto' : 'tierra' };
  }
  if (game?.activeRiddenHorse?.root) return { root: game.activeRiddenHorse.root, kind: 'moto' };
  return null;
}

// ---------------------------------------------------------------------------
// ASIENTOS DEDUCIDOS DE LA CAJA REAL DEL VEHÍCULO
// ---------------------------------------------------------------------------
// Se mide una sola vez por vehículo y se guarda en su userData. Las plazas se
// reparten según la forma: un jet largo y estrecho las pone en fila, un coche
// ancho las pone de dos en dos, y una moto sólo admite un paquete detrás.
function seatsOf(root, kind) {
  const cached = root.userData.__v104Seats;
  if (cached) return cached;

  let seats;
  try {
    root.updateWorldMatrix(true, true);
    box.setFromObject(root);
    box.getSize(size);
    box.getCenter(center);
    // La caja está en mundo; se pasa a local para que valga con el vehículo girado.
    const localCenterY = center.y - root.position.y;
    const length = Math.max(size.x, size.z);
    const width = Math.min(size.x, size.z);
    const seatY = localCenterY + size.y * 0.12;

    if (kind === 'moto') {
      seats = [[0, seatY, -length * 0.22]];
    } else if (kind === 'agua') {
      seats = [
        [width * 0.24, seatY, -length * 0.12],
        [-width * 0.24, seatY, -length * 0.12],
        [0, seatY, -length * 0.3],
        [0, seatY, length * 0.22]
      ];
    } else if (kind === 'aire') {
      seats = [
        [width * 0.2, seatY, -length * 0.06],
        [-width * 0.2, seatY, -length * 0.06],
        [width * 0.2, seatY, -length * 0.2],
        [-width * 0.2, seatY, -length * 0.2],
        [0, seatY, -length * 0.32]
      ];
    } else {
      seats = [
        [width * 0.26, seatY, length * 0.04],
        [-width * 0.26, seatY, -length * 0.2],
        [width * 0.26, seatY, -length * 0.2],
        [0, seatY, -length * 0.32]
      ];
    }
  } catch {
    seats = [[38, 20, -46], [-38, 20, -46], [0, 20, -80]];
  }

  seats = seats.slice(0, MAX_SEATS).map(s => new THREE.Vector3(s[0], s[1], s[2]));
  root.userData.__v104Seats = seats;
  return seats;
}

function seatWorld(root, kind, index, out) {
  const seats = seatsOf(root, kind);
  const local = seats[index % seats.length];
  out.copy(local);
  root.updateMatrixWorld(true);
  return root.localToWorld(out);
}

// ---------------------------------------------------------------------------
// 1) LOS ALIADOS DE TU BANDA SUBEN CONTIGO
// ---------------------------------------------------------------------------
function crewMembers() {
  const crew = window.__CITY_LIFE_SYSTEM__?.recruitedGang;
  return Array.isArray(crew) ? crew : [];
}

function seatCrew(vehicle) {
  const crew = crewMembers();
  if (!crew.length) return;
  const seats = seatsOf(vehicle.root, vehicle.kind);
  const yaw = vehicle.root.rotation?.y || 0;

  for (let i = 0; i < crew.length; i++) {
    const ally = crew[i];
    const root = ally?.root;
    if (!root) continue;

    if (i >= seats.length || ally.dead) {
      // No caben todos: los que sobran se quedan a su aire, como siempre.
      if (root.userData.__v104Seated) {
        root.userData.__v104Seated = false;
        root.visible = true;
        if (ally.mixerPaused !== undefined) ally.mixerPaused = false;
      }
      continue;
    }

    // V111: DENTRO, NO ENCIMA. Antes se colocaba al aliado en un asiento
    // calculado por fuera de la carrocería y se le veía sobresaliendo del
    // vehículo. Ahora se le mete en el centro y se le oculta: va dentro, que es
    // lo que se pidió, y de paso deja de dibujarse un personaje con esqueleto
    // completo por cada acompañante, que no es poco trabajo.
    root.position.copy(vehicle.root.position);
    root.rotation.y = yaw;
    root.visible = false;
    root.userData.__v104Seated = true;
    // El aliado va sentado: no camina, no dispara desde el suelo y no le
    // afecta la gravedad mientras el vehículo se mueve.
    if (ally.state !== undefined) ally.state = 'passenger';
    if (ally.velocity?.set) ally.velocity.set(0, 0, 0);
  }
}

function releaseCrew() {
  for (const ally of crewMembers()) {
    const root = ally?.root;
    if (!root?.userData.__v104Seated) continue;
    root.userData.__v104Seated = false;
    root.visible = true;                 // al bajar, vuelve a verse
    if (ally.state === 'passenger') ally.state = 'idle';
  }
}

// ---------------------------------------------------------------------------
// 2) AMIGOS DEL MODO ONLINE
// ---------------------------------------------------------------------------
// El vehículo de cada amigo ya se replica como "ghost" en gta-manucho-online.
// Un pasajero remoto simplemente se coloca en el asiento de ese ghost, o en el
// de NUESTRO vehículo si se ha subido con nosotros. Nadie simula física ajena.
function onlineApi() { return window.__GTA_ONLINE__; }

function seatRemotePassengers(vehicle) {
  const online = onlineApi();
  if (!online?.remotes) return;

  for (const [, remote] of online.remotes) {
    const ride = remote.ride;
    if (!ride) continue;

    let hostRoot = null;
    let hostKind = 'tierra';
    if (ride.host === online.myId || ride.host === 'local') {
      if (!vehicle) continue;
      hostRoot = vehicle.root;
      hostKind = vehicle.kind;
    } else {
      const hostRemote = online.remotes.get(ride.host);
      const ghost = hostRemote?.vehicleGhost;
      if (!ghost?.visible) continue;
      hostRoot = ghost;
      hostKind = hostRemote?.vehicle?.type === 'BOAT' ? 'agua'
        : (hostRemote?.vehicle?.type ? 'aire' : 'tierra');
    }
    if (!hostRoot) continue;

    // El asiento 0 lo ocupa el conductor, los invitados empiezan en el 1.
    const index = Math.max(0, Number(ride.seat) || 0);
    // V111: el amigo va DENTRO. Se le coloca en el vehículo y se oculta su
    // figura: lo que se ve es el vehículo moviéndose, conducido por quien
    // corresponda. Antes se le veía sobresaliendo por fuera.
    remote.group.position.copy(hostRoot.position);
    hostRoot.getWorldQuaternion(tempQ);
    remote.group.quaternion.copy(tempQ);
    remote.tiltedByVehicle = true;
    remote.avatarRoot.visible = false;
    if (remote.vehicleGhost) remote.vehicleGhost.visible = false;
  }
}

// Subirse al vehículo de un amigo.
function nearestRemoteVehicle() {
  const online = onlineApi();
  if (!online?.connected || !game?.playerContainer) return null;
  const player = game.playerContainer.position;
  let best = null;
  let bestSq = BOARD_DISTANCE * BOARD_DISTANCE;
  for (const [id, remote] of online.remotes) {
    const ghost = remote.vehicleGhost;
    if (!ghost?.visible) continue;
    const d = ghost.position.distanceToSquared(player);
    if (d >= bestSq) continue;
    bestSq = d;
    best = { id, remote, ghost };
  }
  return best;
}

function boardRemote(target) {
  if (!target || ridingRemote) return false;
  // Asiento libre más bajo (el 0 es del conductor remoto).
  const taken = new Set([0]);
  for (const [, remote] of onlineApi().remotes) {
    if (remote.ride?.host === target.id) taken.add(Number(remote.ride.seat) || 0);
  }
  let seat = 1;
  while (taken.has(seat) && seat < MAX_SEATS) seat++;
  if (seat >= MAX_SEATS) { toast('EL VEHÍCULO DE TU AMIGO ESTÁ LLENO'); return false; }

  ridingRemote = { id: target.id, seat };
  if (game.state) {
    game.state.onGround = true;
    game.state.isFlying = false;
    game.state.inWater = false;
    game.state.isSubmerged = false;
    game.state.vy = 0;
  }
  window.__V104_RIDE__ = { host: target.id, seat };
  toast(`HAS SUBIDO CON ${String(target.remote.name || 'TU AMIGO').toUpperCase()} · E PARA BAJAR`);
  return true;
}

function unboardRemote() {
  if (!ridingRemote) return false;
  ridingRemote = null;
  if (game?.playerModel) game.playerModel.visible = true;
  window.__V104_RIDE__ = null;
  if (game?.state) { game.state.onGround = false; game.state.vy = 0; }
  toast('HAS BAJADO DEL VEHÍCULO DE TU AMIGO');
  return true;
}

// Mientras vamos de pasajeros, el jugador local sigue al asiento y no simula
// nada por su cuenta: el conductor manda.
function followRemoteSeat() {
  if (!ridingRemote) return;
  const online = onlineApi();
  const host = online?.remotes?.get(ridingRemote.id);
  const ghost = host?.vehicleGhost;
  if (!ghost?.visible) { unboardRemote(); return; }
  const kind = host?.vehicle?.type === 'BOAT' ? 'agua' : (host?.vehicle?.type ? 'aire' : 'tierra');
  // De pasajero se va dentro del vehículo del amigo, no encima.
  game.playerContainer.position.copy(ghost.position);
  game.playerContainer.rotation.y = ghost.rotation.y;
  if (game.playerModel) game.playerModel.visible = false;
  if (game.state) {
    game.state.onGround = true;
    game.state.vy = 0;
    game.state.inWater = false;
    game.state.isSubmerged = false;
  }
}

// ---------------------------------------------------------------------------
// AVISOS
// ---------------------------------------------------------------------------
function toast(text, duration = 3200) {
  let node = document.getElementById('gta-v104-toast');
  if (!node) {
    node = document.createElement('div');
    node.id = 'gta-v104-toast';
    node.style.cssText = 'position:fixed;left:50%;top:132px;transform:translateX(-50%);z-index:6600;padding:10px 18px;border:2px solid #47c9ff;background:rgba(4,10,16,.94);color:#dff3ff;font:900 13px "Arial Black",Arial,sans-serif;letter-spacing:.06em;pointer-events:none';
    document.body.appendChild(node);
  }
  node.textContent = text;
  node.style.display = 'block';
  clearTimeout(node.__timer);
  node.__timer = setTimeout(() => { node.style.display = 'none'; }, duration);
}

// ---------------------------------------------------------------------------
// BUCLE
// ---------------------------------------------------------------------------
let lastVehicle = null;

let tick = 0;

function frame() {
  requestAnimationFrame(frame);
  if (!game?.playerContainer || document.hidden) return;
  // V110: los asientos no necesitan recalcularse 60 veces por segundo. Cada
  // tres fotogramas es invisible y ahorra dos tercios del trabajo.
  if ((tick = (tick + 1) % 3) !== 0) return;

  const vehicle = localVehicle();

  if (vehicle) {
    seatCrew(vehicle);
    if (lastVehicle !== vehicle.root) {
      lastVehicle = vehicle.root;
      const seats = seatsOf(vehicle.root, vehicle.kind);
      if (crewMembers().length || onlineApi()?.connected) {
        toast(`${seats.length} PLAZA${seats.length === 1 ? '' : 'S'} LIBRE${seats.length === 1 ? '' : 'S'} EN ESTE VEHÍCULO`, 2400);
      }
    }
  } else if (lastVehicle) {
    lastVehicle = null;
    releaseCrew();
  }

  followRemoteSeat();
  seatRemotePassengers(vehicle);
}

// ---------------------------------------------------------------------------
// TECLA E: subir o bajar del vehículo de un amigo
// ---------------------------------------------------------------------------
// Se registra al final de la cadena a propósito: sólo actúa si ningún otro
// módulo se ha quedado con la E, es decir, si no hay un vehículo propio cerca.
function onKeyDown(event) {
  if (event.code !== 'KeyE' || event.repeat) return;
  if (document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;

  if (ridingRemote) {
    event.preventDefault();
    event.stopImmediatePropagation();
    unboardRemote();
    return;
  }
  if (localVehicle()) return;   // ya llevamos vehículo propio

  const target = nearestRemoteVehicle();
  if (!target) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  boardRemote(target);
}

function install() {
  if (installed || !game?.scene) return;
  installed = true;
  window.addEventListener('keydown', onKeyDown, true);
  window.__V104_PASSENGERS__ = {
    seatsOf,
    localVehicle,
    get riding() { return ridingRemote; },
    board: boardRemote,
    unboard: unboardRemote
  };
  requestAnimationFrame(frame);
  console.log('[pasajeros-v104] Listo: banda y amigos pueden subir al mismo vehículo.');
}

const wait = setInterval(() => {
  game = window.__VICE_CITY_GAME__ || game;
  if (!game?.scene || !game?.playerContainer) return;
  clearInterval(wait);
  install();
}, 120);
setTimeout(() => clearInterval(wait), 60000);
