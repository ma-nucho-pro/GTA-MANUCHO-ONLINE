import * as THREE from 'three';
import { GLTFLoader } from './libs/GLTFLoader.js';

const EYE_HEIGHT = 1.7;
const THIRD_DISTANCE = 6.2;
const THIRD_HEIGHT = 2.55;
const keys = new Set();
let viewMode = 'third';
let playerRoot = null;
let playerVisual = null;
let fallbackVisual = null;
let mixer = null;
let actions = {};
let currentAction = '';
let engine = null;
let controller = null;
let installed = false;
let modelLoading = false;
const cameraGoal = new THREE.Vector3();
const focusGoal = new THREE.Vector3();
const forward = new THREE.Vector3();
const smoothPos = new THREE.Vector3();

function makeHud() {
  const hud = document.createElement('div');
  hud.id = 'gta-camera-hud';
  hud.innerHTML = '<b>GTA MANUCHO</b><span data-camera>TERCERA PERSONA</span><small>WASD: moverse · Shift: correr · Espacio: saltar · V: cambiar cámara</small>';
  hud.style.cssText = [
    'position:fixed','top:18px','left:50%','transform:translateX(-50%)','z-index:2000',
    'display:flex','gap:14px','align-items:center','padding:9px 14px','border-radius:12px',
    'background:rgba(5,10,13,.74)','border:1px solid rgba(255,255,255,.24)','color:#fff',
    'font:12px/1.2 Arial,sans-serif','backdrop-filter:blur(7px)','pointer-events:none'
  ].join(';');
  hud.querySelector('b').style.cssText = 'letter-spacing:.15em;color:#68f5a4';
  hud.querySelector('[data-camera]').style.cssText = 'font-weight:800;color:#ffe26a';
  hud.querySelector('small').style.cssText = 'opacity:.8';
  document.body.appendChild(hud);
  return hud;
}
const hud = makeHud();

function updateHud() {
  const node = hud.querySelector('[data-camera]');
  if (node) node.textContent = viewMode === 'third' ? 'TERCERA PERSONA' : 'PRIMERA PERSONA';
}

window.addEventListener('keydown', (event) => {
  keys.add(event.code);
  if (event.code === 'KeyV' && !event.repeat) {
    viewMode = viewMode === 'third' ? 'first' : 'third';
    updateHud();
    if (playerRoot) playerRoot.visible = viewMode === 'third';

    // Reinicia el suavizado y coloca la cámara inmediatamente en el modo nuevo.
    // Esto evita que la cámara conserve la posición de tercera persona y parezca congelada.
    smoothPos.set(0, 0, 0);
    if (engine?.camera && controller) {
      const base = controller.basePos || engine.camera.position;
      if (viewMode === 'first') {
        engine.camera.position.copy(base);
        engine.camera.rotation.set(0, 0, 0);
        engine.camera.rotateY(controller.yaw || 0);
        engine.camera.rotateX(controller.pitch || 0);
        engine.camera.updateMatrixWorld(true);
      }
    }
    event.preventDefault();
  }
}, true);
window.addEventListener('keyup', (event) => keys.delete(event.code), true);
window.addEventListener('blur', () => keys.clear());

function createFallbackHuman() {
  const group = new THREE.Group();
  const green = new THREE.MeshStandardMaterial({ color: 0x355c3b, roughness: 0.82 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x18251c, roughness: 0.9 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xd7a274, roughness: 0.88 });
  const black = new THREE.MeshStandardMaterial({ color: 0x111617, roughness: 0.7 });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(.56,.8,.3), green); torso.position.y=1.18;
  const head = new THREE.Mesh(new THREE.SphereGeometry(.19,16,12), skin); head.position.y=1.82;
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(.205,16,8,0,Math.PI*2,0,Math.PI*.55), dark); helmet.position.y=1.91;
  const visor = new THREE.Mesh(new THREE.BoxGeometry(.28,.08,.035), black); visor.position.set(0,1.84,-.18);
  const armGeo = new THREE.CapsuleGeometry(.09,.55,6,10);
  const legGeo = new THREE.CapsuleGeometry(.105,.64,6,10);
  const armL = new THREE.Mesh(armGeo, green); armL.position.set(-.38,1.18,0);
  const armR = armL.clone(); armR.position.x=.38;
  const legL = new THREE.Mesh(legGeo, dark); legL.position.set(-.16,.48,0);
  const legR = legL.clone(); legR.position.x=.16;
  const bootL = new THREE.Mesh(new THREE.BoxGeometry(.2,.15,.34), black); bootL.position.set(-.16,.08,-.07);
  const bootR = bootL.clone(); bootR.position.x=.16;
  group.add(torso,head,helmet,visor,armL,armR,legL,legR,bootL,bootR);
  group.userData.limbs={armL,armR,legL,legR};
  group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  return group;
}

function setAction(name) {
  if (!actions[name] || currentAction === name) return;
  const previous = actions[currentAction];
  if (previous) previous.fadeOut(.18);
  actions[name].reset().fadeIn(.18).play();
  currentAction = name;
}

function configureSoldier(gltf) {
  const model = gltf.scene;
  model.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
      if (object.material) object.material.envMapIntensity = .75;
    }
  });
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const scale = size.y > 0 ? 1.82 / size.y : .01;
  model.scale.setScalar(scale);
  model.updateMatrixWorld(true);
  const adjusted = new THREE.Box3().setFromObject(model);
  model.position.y -= adjusted.min.y;
  model.rotation.y = 0;
  mixer = new THREE.AnimationMixer(model);
  const clips = gltf.animations || [];
  const find = (pattern, fallbackIndex) => clips.find(c=>pattern.test(c.name)) || clips[fallbackIndex] || null;
  const idle = find(/idle/i,0), run = find(/run/i,1), walk = find(/walk/i,2);
  actions = {};
  if (idle) actions.Idle = mixer.clipAction(idle);
  if (walk) actions.Walk = mixer.clipAction(walk);
  if (run) actions.Run = mixer.clipAction(run);
  if (actions.Idle) { actions.Idle.play(); currentAction='Idle'; }
  return model;
}

async function tryLoadSoldier() {
  if (modelLoading) return;
  modelLoading = true;
  const loader = new GLTFLoader();
  const sources = ['./assets/Soldier.glb','https://threejs.org/examples/models/gltf/Soldier.glb'];
  for (const url of sources) {
    try {
      const gltf = await loader.loadAsync(url);
      const soldier = configureSoldier(gltf);
      if (playerVisual) playerRoot.remove(playerVisual);
      playerVisual = soldier;
      playerRoot.add(playerVisual);
      fallbackVisual = null;
      const status=document.getElementById('character-status');
      if(status) status.remove();
      return;
    } catch (error) {
      console.warn('[GTA MANUCHO] No se pudo cargar Soldier desde',url,error);
    }
  }
  modelLoading = false;
}

function install() {
  if (installed) return;
  engine = window.__gtaVentaraEngine;
  controller = window.__gtaVentaraController;
  if (!engine || !controller || !engine.scene || !engine.camera) return;
  installed = true;
  try { engine.renderer.setClearColor(0x93b9ca,1); } catch {}
  playerRoot = new THREE.Group();
  playerRoot.name = 'GTA_MANUCHO_SOLDIER';
  fallbackVisual = createFallbackHuman();
  playerVisual = fallbackVisual;
  playerRoot.add(playerVisual);
  engine.scene.add(playerRoot);
  playerRoot.visible = viewMode === 'third';

  const status=document.createElement('div');
  status.id='character-status';
  status.textContent='Cargando personaje Soldier en segundo plano…';
  status.style.cssText='position:fixed;right:14px;bottom:14px;z-index:1600;padding:7px 10px;border-radius:9px;background:rgba(0,0,0,.55);color:#dceaff;font:11px Arial;pointer-events:none';
  document.body.appendChild(status);
  tryLoadSoldier();

  engine.onUpdate((dt) => {
    if (!controller.groundProbe && window.__laas?.groundProbe) controller.groundProbe = window.__laas.groundProbe;
    if (controller.groundProbe && controller.mode !== 'walk') {
      try { controller.setMode('walk'); } catch {}
    }
    const base = controller.basePos || engine.camera.position;
    const velocity = controller.vel || {x:0,z:0};
    const speed = Math.hypot(velocity.x||0,velocity.z||0);

    // Altura física real del terreno. El personaje nunca puede quedar debajo
    // de la superficie aunque el terreno termine de cargarse después.
    let surfaceY = base.y - EYE_HEIGHT;
    if (controller.groundProbe) {
      try {
        const hit = controller.groundProbe(base.x, base.z);
        if (hit && Number.isFinite(hit.ground)) {
          surfaceY = hit.ground;
          const minimumEyeY = surfaceY + EYE_HEIGHT;
          const fallingNearFloor = (controller.velY || 0) <= 0 && base.y < minimumEyeY + .24;
          if (controller.mode === 'walk' && (controller.grounded || base.y < minimumEyeY || fallingNearFloor)) {
            base.y = minimumEyeY;
            controller.velY = 0;
            controller.grounded = true;
          }
        }
      } catch (error) {
        console.warn('[GTA MANUCHO] No se pudo consultar la altura del terreno', error);
      }
    }
    const feetY = Math.max(surfaceY + .035, base.y - EYE_HEIGHT);
    playerRoot.position.set(base.x, feetY, base.z);
    if (speed > .08) {
      const targetYaw = Math.atan2(-(velocity.x||0), -(velocity.z||0));
      let diff = targetYaw - playerRoot.rotation.y;
      while (diff > Math.PI) diff -= Math.PI*2;
      while (diff < -Math.PI) diff += Math.PI*2;
      playerRoot.rotation.y += diff * (1-Math.exp(-dt*12));
    }
    const running = (controller.keys?.has('ShiftLeft') || controller.keys?.has('ShiftRight')) && speed>.2;
    if (mixer) {
      setAction(speed < .12 ? 'Idle' : running ? 'Run' : 'Walk');
      mixer.update(dt);
    } else if (fallbackVisual?.userData?.limbs) {
      const phase=performance.now()*.009*(running?1.7:1);
      const amount=speed>.1?Math.min(.65,speed*.12):0;
      const {armL,armR,legL,legR}=fallbackVisual.userData.limbs;
      armL.rotation.x=Math.sin(phase)*amount; armR.rotation.x=-Math.sin(phase)*amount;
      legL.rotation.x=-Math.sin(phase)*amount; legR.rotation.x=Math.sin(phase)*amount;
    }

    playerRoot.visible = viewMode === 'third';
    if (viewMode === 'third') {
      const yaw = controller.yaw || 0;
      const pitch = Math.max(-.7,Math.min(.8,controller.pitch||0));
      forward.set(-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch));
      focusGoal.set(base.x,feetY+1.35,base.z).addScaledVector(forward,2.7);
      cameraGoal.set(base.x + Math.sin(yaw)*THIRD_DISTANCE, feetY+THIRD_HEIGHT+pitch*1.1, base.z + Math.cos(yaw)*THIRD_DISTANCE);
      // Evita que la cámara quede debajo o dentro de montañas situadas detrás.
      if (controller.groundProbe) {
        try {
          const cameraFloor = controller.groundProbe(cameraGoal.x, cameraGoal.z);
          if (cameraFloor && Number.isFinite(cameraFloor.ground)) {
            cameraGoal.y = Math.max(cameraGoal.y, cameraFloor.ground + 1.15);
          }
        } catch {}
      }
      if (smoothPos.lengthSq()===0) smoothPos.copy(cameraGoal);
      smoothPos.lerp(cameraGoal,1-Math.exp(-dt*10));
      engine.camera.position.copy(smoothPos);
      engine.camera.lookAt(focusGoal.x,focusGoal.y,focusGoal.z);
      engine.camera.updateMatrixWorld(true);
    } else {
      // Primera persona estable: se fija cada fotograma a la posición de los ojos
      // y usa el yaw/pitch del controlador original. No depende de la cámara previa.
      smoothPos.set(0, 0, 0);
      // La cámara de los ojos también se mantiene siempre sobre el suelo.
      if (controller.groundProbe) {
        try {
          const eyeFloor = controller.groundProbe(base.x, base.z);
          if (eyeFloor && Number.isFinite(eyeFloor.ground)) base.y = Math.max(base.y, eyeFloor.ground + EYE_HEIGHT);
        } catch {}
      }
      engine.camera.position.copy(base);
      engine.camera.rotation.set(0, 0, 0);
      engine.camera.rotateY(controller.yaw || 0);
      engine.camera.rotateX(controller.pitch || 0);
      engine.camera.updateMatrixWorld(true);
    }
  });
}

const poll=setInterval(()=>{
  install();
  if(installed) clearInterval(poll);
},50);
setTimeout(()=>install(),0);
