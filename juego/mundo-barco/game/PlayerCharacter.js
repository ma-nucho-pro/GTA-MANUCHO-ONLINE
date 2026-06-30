import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Personaje navegable para GTA MANUCHO.
 * Usa exactamente los imports solicitados de Three.js y GLTFLoader.
 * Carga primero un personaje GLB local para que aparezca de inmediato y,
 * sin bloquear el juego, intenta sustituirlo por Soldier.glb animado.
 */
export class PlayerCharacter {
  constructor(scene) {
    this.scene = scene;
    this.model = null;
    this.mixer = null;
    this.actions = {};
    this.currentAction = 'Idle';
    this.modelYawOffset = 0;
    this.localRig = null;

    // Se muestra inmediatamente mientras GLTFLoader abre el GLB local.
    this.model = this.createFallback();
    this.scene.add(this.model);

    this.loadLocalCharacter();
  }

  createPart(geometry, material, x, y, z, parent) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  createFallback() {
    // El torso actúa como contenedor Object3D y evita una pantalla sin personaje.
    const uniform = new THREE.MeshStandardMaterial({ color: 0x304b36, roughness: 0.78, metalness: 0.08 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x101820, roughness: 0.72, metalness: 0.18 });
    const skin = new THREE.MeshStandardMaterial({ color: 0xb77855, roughness: 0.88, metalness: 0 });
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.05, 0.38), uniform);
    torso.name = 'GTA MANUCHO - personaje provisional';
    torso.scale.set(8, 8, 8);
    torso.castShadow = true;
    torso.receiveShadow = true;
    torso.userData.footOffset = 7.6;

    const head = this.createPart(new THREE.SphereGeometry(0.23, 12, 8), skin, 0, 0.86, 0, torso);
    this.createPart(new THREE.SphereGeometry(0.25, 12, 6), dark, 0, 0.99, 0, torso).scale.y = 0.55;
    const armL = this.createPart(new THREE.CylinderGeometry(0.11, 0.10, 0.9, 8), uniform, -0.52, 0.05, 0, torso);
    const armR = this.createPart(new THREE.CylinderGeometry(0.11, 0.10, 0.9, 8), uniform, 0.52, 0.05, 0, torso);
    const legL = this.createPart(new THREE.CylinderGeometry(0.13, 0.11, 1.0, 8), dark, -0.20, -0.98, 0, torso);
    const legR = this.createPart(new THREE.CylinderGeometry(0.13, 0.11, 1.0, 8), dark, 0.20, -0.98, 0, torso);
    this.createPart(new THREE.BoxGeometry(0.27, 0.16, 0.48), dark, -0.20, -1.52, 0.11, torso);
    this.createPart(new THREE.BoxGeometry(0.27, 0.16, 0.48), dark, 0.20, -1.52, 0.11, torso);
    this.localRig = { armL, armR, legL, legR, root: torso };
    return torso;
  }

  loadLocalCharacter() {
    const loader = new GLTFLoader();
    loader.load(
      '/models/personaje_navegante.glb',
      (gltf) => {
        this.installLocalCharacter(gltf);
        // La versión oficial se intenta después, sin detener océano, islas ni controles.
        window.__GTA_VENTARA_SOLDIER_READY__ = true;
      },
      undefined,
      (error) => {
        console.warn('No se pudo abrir el personaje GLB local; se conserva el modelo provisional.', error);
        window.__GTA_VENTARA_CHARACTER_READY__ = true;
        window.__GTA_VENTARA_SOLDIER_READY__ = true;
      }
    );
  }

  installLocalCharacter(gltf) {
    if (!gltf?.scene) return;
    const oldPosition = this.model?.position?.clone?.() || new THREE.Vector3();
    const oldRotation = this.model?.rotation?.y || 0;
    if (this.model?.parent) this.model.parent.remove(this.model);

    const character = gltf.scene;
    character.name = 'Personaje Three.js local - GTA MANUCHO';
    character.traverse((object) => {
      if (object?.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    character.scale.set(8.5, 8.5, 8.5);
    character.position.copy(oldPosition);
    character.rotation.y = oldRotation;
    character.userData.footOffset = 0;
    this.scene.add(character);
    this.model = character;
    this.modelYawOffset = Math.PI;
    this.mixer = null;
    this.actions = {};
    this.localRig = {
      armL: character.getObjectByName('Brazo izquierdo'),
      armR: character.getObjectByName('Brazo derecho'),
      legL: character.getObjectByName('Pierna superior izquierda'),
      legR: character.getObjectByName('Pierna superior derecha'),
      root: character
    };
    window.__GTA_VENTARA_CHARACTER_READY__ = true;
  }

  loadOfficialSoldier() {
    const loader = new GLTFLoader();
    loader.load(
      'https://threejs.org/examples/models/gltf/Soldier.glb',
      (gltf) => this.installOfficialSoldier(gltf),
      undefined,
      () => {
        // Es opcional: el personaje local ya está visible y jugable.
        window.__GTA_VENTARA_SOLDIER_READY__ = false;
      }
    );
  }

  installOfficialSoldier(gltf) {
    if (!gltf?.scene) return;
    const previousPosition = this.model?.position?.clone?.() || new THREE.Vector3();
    const previousRotation = this.model?.rotation?.y || 0;
    if (this.model?.parent) this.model.parent.remove(this.model);

    const soldier = gltf.scene;
    soldier.name = 'Soldier Three.js - GTA MANUCHO';
    soldier.traverse((object) => {
      if (object?.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    soldier.scale.set(8.5, 8.5, 8.5);
    soldier.position.copy(previousPosition);
    soldier.rotation.y = previousRotation;
    soldier.userData.footOffset = 0;
    this.scene.add(soldier);
    this.model = soldier;
    this.modelYawOffset = Math.PI;
    this.localRig = null;

    const clips = gltf.animations || [];
    const findClip = (name, fallbackIndex) =>
      clips.find((clip) => (clip.name || '').toLowerCase() === name.toLowerCase()) || clips[fallbackIndex];

    this.mixer = new THREE.AnimationMixer(soldier);
    const idle = findClip('Idle', 0);
    const run = findClip('Run', 1);
    const walk = findClip('Walk', 3) || clips[2];
    if (idle) this.actions.Idle = this.mixer.clipAction(idle);
    if (walk) this.actions.Walk = this.mixer.clipAction(walk);
    if (run) this.actions.Run = this.mixer.clipAction(run);
    this.actions.Idle?.reset().play();
    this.currentAction = 'Idle';
    window.__GTA_VENTARA_SOLDIER_READY__ = true;
    window.__GTA_VENTARA_CHARACTER_READY__ = true;
  }

  setAction(name) {
    if (name === this.currentAction) return;
    if (this.actions[name]) {
      this.actions[this.currentAction]?.fadeOut(0.18);
      this.actions[name].reset().fadeIn(0.18).play();
    }
    this.currentAction = name;
  }

  setWorldTransform(position, yaw) {
    if (!this.model) return;
    this.model.position.copy(position);
    this.model.position.y += this.model.userData?.footOffset || 0;
    this.model.rotation.y = yaw + this.modelYawOffset;
  }

  updateProceduralRig(action) {
    if (!this.localRig) return;
    const t = performance.now() * 0.001;
    const amplitude = action === 'Run' ? 0.85 : action === 'Walk' ? 0.48 : 0.04;
    const speed = action === 'Run' ? 11 : action === 'Walk' ? 7 : 1.8;
    const swing = Math.sin(t * speed) * amplitude;
    if (this.localRig.armL) this.localRig.armL.rotation.x = swing;
    if (this.localRig.armR) this.localRig.armR.rotation.x = -swing;
    if (this.localRig.legL) this.localRig.legL.rotation.x = -swing;
    if (this.localRig.legR) this.localRig.legR.rotation.x = swing;
  }

  update(delta, action) {
    this.mixer?.update(Math.min(delta, 0.05));
    this.setAction(action);
    this.updateProceduralRig(action);
  }
}
