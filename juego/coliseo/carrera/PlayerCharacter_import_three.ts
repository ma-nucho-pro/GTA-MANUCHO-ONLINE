import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// ==========================================
// 1. CONFIGURACIÓN Y TIPOS GLOBALES
// ==========================================
export const WORLD_SCALE = 1.0; // Cambiar si el mundo tiene otra escala
export const WATER_LEVEL = -5.0; // Nivel de flotación de agua

export interface PlayerState {
  vy: number;
  onGround: boolean;
  inWater: boolean;
  isSubmerged: boolean;
  isFlying: boolean;
  walkSpeed: number;
  runSpeed: number;
  flySpeed: number;
  zone: string;
}

export interface BoneRig {
  leftUp: THREE.Object3D | null;
  rightUp: THREE.Object3D | null;
  leftLow: THREE.Object3D | null;
  rightLow: THREE.Object3D | null;
  armL: THREE.Object3D | null;
  armR: THREE.Object3D | null;
  forearmL: THREE.Object3D | null;
  forearmR: THREE.Object3D | null;
  handL: THREE.Object3D | null;
  handR: THREE.Object3D | null;
  spine: THREE.Object3D | null;
  spine1: THREE.Object3D | null;
  head: THREE.Object3D | null;
}

// ==========================================
// 2. MODELADORES PROCEDIMENTALES DE OBJETOS
// ==========================================

// Genera un Jetpack 3D procedimental
export function createProceduralJetpack() {
  const group = new THREE.Group();
  
  // Placa trasera principal
  const backMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 });
  const backGeo = new THREE.BoxGeometry(0.3 * WORLD_SCALE, 0.4 * WORLD_SCALE, 0.1 * WORLD_SCALE);
  const backMesh = new THREE.Mesh(backGeo, backMat);
  group.add(backMesh);

  // Cilindros propulsores del Jetpack (izq/der)
  const thrusterMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.1 });
  const cylGeo = new THREE.CylinderGeometry(0.08 * WORLD_SCALE, 0.08 * WORLD_SCALE, 0.45 * WORLD_SCALE, 8);
  
  const cylL = new THREE.Mesh(cylGeo, thrusterMat);
  cylL.position.set(-0.18 * WORLD_SCALE, 0, 0);
  group.add(cylL);

  const cylR = cylL.clone();
  cylR.position.x = 0.18 * WORLD_SCALE;
  group.add(cylR);

  // Conectores metálicos
  const connGeo = new THREE.BoxGeometry(0.4 * WORLD_SCALE, 0.04 * WORLD_SCALE, 0.04 * WORLD_SCALE);
  const conn = new THREE.Mesh(connGeo, backMat);
  conn.position.set(0, 0, -0.02 * WORLD_SCALE);
  group.add(conn);

  // Toberas finales que expulsarán llamas
  const nozzleGeo = new THREE.CylinderGeometry(0.06 * WORLD_SCALE, 0.04 * WORLD_SCALE, 0.08 * WORLD_SCALE, 8);
  const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
  
  const nozzleL = new THREE.Mesh(nozzleGeo, nozzleMat);
  nozzleL.position.set(-0.18 * WORLD_SCALE, -0.25 * WORLD_SCALE, 0);
  group.add(nozzleL);

  const nozzleR = nozzleL.clone();
  nozzleR.position.x = 0.18 * WORLD_SCALE;
  group.add(nozzleR);

  // Llamas decorativas del propulsor
  const flameGeo = new THREE.ConeGeometry(0.05 * WORLD_SCALE, 0.2 * WORLD_SCALE, 5);
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.8 });
  
  const flameL = new THREE.Mesh(flameGeo, flameMat);
  flameL.position.set(-0.18 * WORLD_SCALE, -0.35 * WORLD_SCALE, 0);
  flameL.rotation.x = Math.PI;
  group.add(flameL);

  const flameR = flameL.clone();
  flameR.position.x = 0.18 * WORLD_SCALE;
  group.add(flameR);

  return { mesh: group, flames: [flameL, flameR] };
}

// Genera una Mochila de Paracaídas procedimental militar
export function createProceduralParachuteBackpack(): THREE.Group {
  const group = new THREE.Group();
  
  // Contenedor principal de lona
  const packGeo = new THREE.BoxGeometry(0.28 * WORLD_SCALE, 0.42 * WORLD_SCALE, 0.14 * WORLD_SCALE);
  const packMat = new THREE.MeshStandardMaterial({ color: 0x223625, roughness: 0.9, metalness: 0.0 });
  const pack = new THREE.Mesh(packGeo, packMat);
  group.add(pack);

  // Correas acolchadas (Arnés izquierdo y derecho)
  const strapGeo = new THREE.BoxGeometry(0.04 * WORLD_SCALE, 0.44 * WORLD_SCALE, 0.02 * WORLD_SCALE);
  const strapMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  
  const strapL = new THREE.Mesh(strapGeo, strapMat);
  strapL.position.set(-0.12 * WORLD_SCALE, 0, 0.07 * WORLD_SCALE);
  group.add(strapL);

  const strapR = strapL.clone();
  strapR.position.x = 0.12 * WORLD_SCALE;
  group.add(strapR);

  // Agarre del pin de liberación rápido
  const pinGeo = new THREE.CylinderGeometry(0.015 * WORLD_SCALE, 0.015 * WORLD_SCALE, 0.06 * WORLD_SCALE, 8);
  const pinMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9 });
  const pin = new THREE.Mesh(pinGeo, pinMat);
  pin.position.set(0, -0.1 * WORLD_SCALE, 0.08 * WORLD_SCALE);
  pin.rotation.z = Math.PI / 2;
  group.add(pin);

  return group;
}

// Genera una Pistola Táctica 3D procedimental
export function createProceduralPistol(): THREE.Group {
  const group = new THREE.Group();
  
  const mMat = new THREE.MeshStandardMaterial({ color: 0x18181c, roughness: 0.4, metalness: 0.75 });
  const gMat = new THREE.MeshStandardMaterial({ color: 0x2e2e33, roughness: 0.8 });

  // Cañón (Upper slide receiver)
  const barrelGeo = new THREE.BoxGeometry(0.08 * WORLD_SCALE, 0.06 * WORLD_SCALE, 0.3 * WORLD_SCALE);
  const barrel = new THREE.Mesh(barrelGeo, mMat);
  barrel.position.set(0, 0.05 * WORLD_SCALE, 0.05 * WORLD_SCALE);
  group.add(barrel);

  // Empuñadura (Handgrip)
  const gripGeo = new THREE.BoxGeometry(0.07 * WORLD_SCALE, 0.16 * WORLD_SCALE, 0.06 * WORLD_SCALE);
  const grip = new THREE.Mesh(gripGeo, gMat);
  grip.position.set(0, -0.05 * WORLD_SCALE, -0.04 * WORLD_SCALE);
  grip.rotation.x = -0.25; // leve inclinación anatómica
  group.add(grip);

  // Gatillo protector (Triggerguard)
  const guardGeo = new THREE.BoxGeometry(0.03 * WORLD_SCALE, 0.05 * WORLD_SCALE, 0.05 * WORLD_SCALE);
  const guard = new THREE.Mesh(guardGeo, mMat);
  guard.position.set(0, 0.01 * WORLD_SCALE, 0.02 * WORLD_SCALE);
  group.add(guard);

  return group;
}

// ==========================================
// 3. CLASE MAESTRA DEL PERSONAJE PRINCIPAL
// ==========================================
export class PlayerCharacter {
  public scene: THREE.Scene;
  public camera: THREE.Camera;
  
  // Contenedores del personaje
  public container: THREE.Group; // Maneja la posición en el mundo real
  public modelGroup: THREE.Group; // Maneja rotaciones visuales y attachments
  
  // Componentes esqueléticos y animaciones
  public model: THREE.Group | null = null;
  public mixer: THREE.AnimationMixer | null = null;
  public actions: Record<string, THREE.AnimationAction> = {};
  public currentAction = 'Idle';
  public bones: BoneRig;

  // Dispositivos y Acoples Visuales
  public jetpackMesh!: THREE.Group;
  public jetpackFlames: THREE.Mesh[] = [];
  public parachuteBackpackMesh!: THREE.Group;
  public pistolMesh!: THREE.Group;
  public fpPistolMesh!: THREE.Group;
  public activeWeapon = 'fist';

  // Movimiento y Física
  public state: PlayerState = {
    vy: 0,
    onGround: true,
    inWater: false,
    isSubmerged: false,
    isFlying: false,
    walkSpeed: 38.0 * WORLD_SCALE,
    runSpeed: 88.0 * WORLD_SCALE,
    flySpeed: 100.0 * WORLD_SCALE,
    zone: 'VICE CITY'
  };

  // Variables Temporales de Cálculo para optimizar memoria (Garbage Collection)
  private tempVec1 = new THREE.Vector3();
  private tempVec2 = new THREE.Vector3();
  private tempVec3 = new THREE.Vector3();

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene;
    this.camera = camera;

    // Crear la jerarquía de grupos para evitar colisiones rotacionales entre cámara y modelo
    this.container = new THREE.Group();
    this.container.position.set(0, 5 * WORLD_SCALE, 0); // Posición inicial por defecto
    this.scene.add(this.container);

    this.modelGroup = new THREE.Group();
    this.modelGroup.rotation.order = 'YXZ'; // Clave para rotación tipo FPS/Gimbal
    this.container.add(this.modelGroup);

    this.bones = {
      leftUp: null, rightUp: null, leftLow: null, rightLow: null,
      armL: null, armR: null, forearmL: null, forearmR: null,
      handL: null, handR: null, spine: null, spine1: null, head: null
    };

    this.init();
  }

  // Inicializa el modelo original Soldier de Three.js y acopla los items
  private init() {
    const loader = new GLTFLoader();
    loader.load('https://threejs.org/examples/models/gltf/Soldier.glb', (gltf) => {
      this.model = gltf.scene;

      this.model.traverse((o: any) => {
        if (o instanceof THREE.Mesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });

      this.model.rotation.y = Math.PI; // Invertir para que mire al frente del vector de rotación
      this.model.scale.set(20.0, 20.0, 20.0); // Ajustar tamaño del rig de glTF que mide apenas 1 metro
      this.modelGroup.add(this.model);

      // --- MAPEADO DE HUESOS (RIGGING) ---
      this.bones.leftUp = this.model.getObjectByName('LeftUpLeg') || this.model.getObjectByName('mixamorigLeftUpLeg') || null;
      this.bones.rightUp = this.model.getObjectByName('RightUpLeg') || this.model.getObjectByName('mixamorigRightUpLeg') || null;
      this.bones.leftLow = this.model.getObjectByName('LeftLeg') || this.model.getObjectByName('mixamorigLeftLeg') || null;
      this.bones.rightLow = this.model.getObjectByName('RightLeg') || this.model.getObjectByName('mixamorigRightLeg') || null;
      this.bones.armL = this.model.getObjectByName('LeftArm') || this.model.getObjectByName('mixamorigLeftArm') || null;
      this.bones.armR = this.model.getObjectByName('RightArm') || this.model.getObjectByName('mixamorigRightArm') || null;
      this.bones.forearmL = this.model.getObjectByName('LeftForeArm') || this.model.getObjectByName('mixamorigLeftForeArm') || null;
      this.bones.forearmR = this.model.getObjectByName('RightForeArm') || this.model.getObjectByName('mixamorigRightForeArm') || null;
      this.bones.handL = this.model.getObjectByName('LeftHand') || this.model.getObjectByName('mixamorigLeftHand') || null;
      this.bones.handR = this.model.getObjectByName('RightHand') || this.model.getObjectByName('mixamorigRightHand') || null;
      this.bones.spine = this.model.getObjectByName('Spine') || this.model.getObjectByName('mixamorigSpine') || null;
      this.bones.spine1 = this.model.getObjectByName('Spine1') || this.model.getObjectByName('mixamorigSpine1') || this.model.getObjectByName('Chest') ||_this.model.getObjectByName('mixamorigChest') || null;
      this.bones.head = this.model.getObjectByName('Head') || this.model.getObjectByName('mixamorigHead') || null;

      // --- MÁQUINA DE ANIMACIÓN ---
      this.mixer = new THREE.AnimationMixer(this.model);
      this.actions['Idle'] = this.mixer.clipAction(gltf.animations[0]);
      this.actions['Run'] = this.mixer.clipAction(gltf.animations[1]);
      this.actions['Walk'] = this.mixer.clipAction(gltf.animations[3]);
      
      // Ajustar velocidad de playback
      this.actions['Walk'].timeScale = 1.1;
      this.actions['Run'].timeScale = 0.9;
      
      this.actions['Idle'].play();

      // --- ACOPLAR DISPOSITIVOS EN HUESOS DINÁMICOS ---
      
      // Jetpack procedimental
      const jpData = createProceduralJetpack();
      this.jetpackMesh = jpData.mesh;
      this.jetpackFlames = jpData.flames;
      this.jetpackMesh.visible = false;
      this.jetpackMesh.position.set(0, 1.4, -0.25);
      this.modelGroup.add(this.jetpackMesh);

      // Mochila de paracaídas (acoplada a Spine1 si existe, de lo contrario en el Spine principal)
      this.parachuteBackpackMesh = createProceduralParachuteBackpack();
      this.parachuteBackpackMesh.visible = false;
      if (this.bones.spine1) {
        this.bones.spine1.add(this.parachuteBackpackMesh);
        this.parachuteBackpackMesh.position.set(0, 0.12, -0.16);
        this.parachuteBackpackMesh.rotation.set(0, Math.PI, 0); 
        this.parachuteBackpackMesh.scale.set(1.35, 1.35, 1.35);    
      } else {
        this.modelGroup.add(this.parachuteBackpackMesh);
        this.parachuteBackpackMesh.position.set(0, 27.0, -2.5);
        this.parachuteBackpackMesh.rotation.set(0, Math.PI, 0);
        this.parachuteBackpackMesh.scale.set(20.0, 20.0, 20.0);
      }

      // Pistola en mano derecha (Third-Person)
      this.pistolMesh = createProceduralPistol();
      this.pistolMesh.visible = false;
      this.pistolMesh.scale.set(0.08, 0.08, 0.08);
      if (this.bones.handR) {
        this.bones.handR.add(this.pistolMesh);
        this.pistolMesh.position.set(-0.01, -0.05, 0.08);
        this.pistolMesh.rotation.set(Math.PI / 2, 0, Math.PI / 1.1);
      } else {
        this.modelGroup.add(this.pistolMesh);
        this.pistolMesh.position.set(0, 20 * WORLD_SCALE, 2 * WORLD_SCALE);
      }

      // Pistola táctica para Primera Persona (Acoplada a la cámara directamente)
      this.fpPistolMesh = createProceduralPistol();
      this.fpPistolMesh.visible = false;
      this.fpPistolMesh.position.set(1.5 * WORLD_SCALE, -2.2 * WORLD_SCALE, -4.5 * WORLD_SCALE);
      this.fpPistolMesh.rotation.set(0.1, Math.PI, 0);
      this.fpPistolMesh.scale.set(1.2, 1.2, 1.3);
      this.camera.add(this.fpPistolMesh);
    });
  }

  // Activa el arma actual en base al inventario
  public setWeapon(weaponId: string) {
    this.activeWeapon = weaponId;
    
    const isPistol = (weaponId === 'pistol');
    
    if (this.pistolMesh) this.pistolMesh.visible = isPistol;
    if (this.fpPistolMesh) this.fpPistolMesh.visible = isPistol; // visible solo en cámara FPS
  }

  // Cambia el estado visual de Jetpack o Paracaídas
  public setFlightUtilities(flying: boolean, parachuting: boolean) {
    this.state.isFlying = flying;
    if (this.jetpackMesh) {
      this.jetpackMesh.visible = flying;
      this.jetpackFlames.forEach(f => f.visible = flying);
    }
    if (this.parachuteBackpackMesh) {
      this.parachuteBackpackMesh.visible = parachuting;
    }
  }

  // --- LOOP PRINCIPAL DE ACTUALIZACIÓN DEL PERSONAJE ---
  public update(dt: number, keys: Record<string, boolean>, isMouseDown: boolean) {
    // Si el modelo glTF aún no se ha cargado en segundo plano, evitar loops
    if (!this.model) return;

    const time = Date.now() * 0.001;

    // Actualizar mixer del esqueleto animado
    if (this.mixer) this.mixer.update(dt);

    // Animación de parpadeo de llamas si el Jetpack está encendido
    if (this.state.isFlying && this.jetpackFlames.length > 0) {
      this.jetpackFlames.forEach((flame, index) => {
        const flicker = 0.8 + Math.sin(time * 35 + index) * 0.25;
        flame.scale.set(flicker, flicker * 1.5, flicker);
      });
    }

    // Comprobar variables de control de movimiento
    const isRunning = keys['ShiftLeft'] || keys['ShiftRight'] || false;
    let currentSpeed = this.state.walkSpeed;
    if (isRunning) currentSpeed = this.state.runSpeed;
    if (this.state.isFlying) currentSpeed = this.state.flySpeed;
    if (this.state.inWater) currentSpeed = this.state.walkSpeed * 0.5;

    let inputX = 0;
    let inputZ = 0;
    if (keys['KeyW'] || keys['w']) inputZ -= 1;
    if (keys['KeyS'] || keys['s']) inputZ += 1;
    if (keys['KeyA'] || keys['a']) inputX -= 1;
    if (keys['KeyD'] || keys['d']) inputX += 1;

    let moving = false;

    // Calcular dirección en base al contenedor de la cámara
    if (inputX !== 0 || inputZ !== 0) {
      moving = true;
      
      const forward = this.tempVec1.set(0, 0, -1).applyQuaternion(this.container.quaternion);
      const right = this.tempVec2.set(1, 0, 0).applyQuaternion(this.container.quaternion);
      const dMove = this.tempVec3.set(0, 0, 0);

      if (inputZ < 0) dMove.addScaledVector(forward, currentSpeed * dt);
      if (inputZ > 0) dMove.addScaledVector(forward, -currentSpeed * dt);
      if (inputX < 0) dMove.addScaledVector(right, -currentSpeed * 0.7 * dt);
      if (inputX > 0) dMove.addScaledVector(right, currentSpeed * 0.7 * dt);

      // Calcular nueva posición
      const nextX = this.container.position.x + dMove.x;
      const nextZ = this.container.position.z + dMove.z;

      // Colisión (Opcional, hook para insertar tus clases de mapas)
      const hasCollision = this.collisionCheck(nextX, nextZ);
      if (!hasCollision) {
        this.container.position.x = nextX;
        this.container.position.z = nextZ;
      }
    }

    // --- ANIMACIONES ANATÓMICAS DE CAÍDA/FLOTACIÓN LIBRE ---
    const rotX = (bone: any, angle: number) => {
      if (bone) bone.rotation.x = THREE.MathUtils.lerp(bone.rotation.x, angle, 0.2);
    };

    if (!this.state.onGround && !this.state.inWater && !this.state.isFlying) {
      // Abre levemente las piernas en pose de caída libre táctica
      rotX(this.bones.leftUp, -1.8);
      rotX(this.bones.rightUp, -1.4 + Math.sin(time * 20) * 0.3);
      rotX(this.bones.leftLow, 2.0);
      rotX(this.bones.rightLow, 2.0);
    }

    // --- MANEJO DE TRANSICIONES DE MÁQUINA DE ANIMACIÓN ---
    let nextAction = 'Idle';
    if (moving) {
      nextAction = isRunning ? 'Run' : 'Walk';
    } else if (this.state.inWater) {
      nextAction = 'Walk';
    }

    if (nextAction !== this.currentAction && this.actions[nextAction]) {
      const prev = this.actions[this.currentAction];
      const next = this.actions[nextAction];
      if (prev && next) {
        prev.fadeOut(0.25);
        next.reset().fadeIn(0.25).play();
        this.currentAction = nextAction;
      } else if (next) {
        next.reset().play();
        this.currentAction = nextAction;
      }
    }

    // --- ROTACIÓN Y DIRECCIÓN DEL MODELO ---
    if (this.modelGroup) {
      let targetAngle = 0;
      let rotationSpeed = 0.2;

      if (this.activeWeapon === 'pistol') {
        // En modo combate, el cuerpo se enfoca perfectamente paralelo a la retícula de disparo
        targetAngle = Math.PI;
        rotationSpeed = 0.35;
      } else if (moving) {
        // En modo exploración común, el modelo rota hacia la dirección WASD en la que camina
        targetAngle = Math.atan2(inputX, inputZ);
        rotationSpeed = 0.2;
      } else {
        targetAngle = this.modelGroup.rotation.y;
      }

      // Interpolar rotación de la malla sin saltos bruscos de eje (360 -> 0)
      let diff = targetAngle - this.modelGroup.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.modelGroup.rotation.y += diff * rotationSpeed;
    }

    // --- FÍSICA DE JETPACK, AGUA Y GRAVEDAD ---
    if (this.state.isFlying) {
      this.state.onGround = false;
      this.state.vy = 0;
      if (keys['Space'] || keys[' ']) this.container.position.y += 20 * WORLD_SCALE * dt;
      if (keys['ShiftLeft']) this.container.position.y -= 20 * WORLD_SCALE * dt;
    } else if (this.state.inWater) {
      // Gravedad amortiguada de nado
      if (isMouseDown) this.state.vy -= 15 * WORLD_SCALE * dt;
      if (keys['Space'] || keys[' ']) {
        if (this.state.isSubmerged) this.state.vy += 15 * WORLD_SCALE * dt;
      }
    } else {
      // Gravedad normal del mundo real
      if (!this.state.onGround) {
        this.state.vy -= 40 * WORLD_SCALE * dt; // Caída
      } else if (keys['Space'] || keys[' ']) {
        // Salto
        this.state.vy = 18 * WORLD_SCALE;
        this.state.onGround = false;
      }
    }

    // Aplicar velocidad vertical y límite de altura de suelo
    this.container.position.y += this.state.vy * dt;
    if (this.container.position.y < 0) { // Piso absoluto
      this.container.position.y = 0;
      this.state.vy = 0;
      this.state.onGround = true;
    }
  }

  // Método de detección de colisiones personalizado (rellenable)
  private collisionCheck(x: number, z: number): boolean {
    // Si tu proyecto usa mallas estáticas u octrees de colisiones, se verifica aquí
    return false;
  }
}
💡 Instrucciones para usar esta clase en otro proyecto:
Instalar dependencias: Asegúrate de tener three (e instalar @types/three como devDependency) en tu proyecto.
Instanciación: Reutilízalo en tu loop de renderizado básico de la siguiente manera:
code
TypeScript
import { PlayerCharacter } from './PlayerCharacter';

// Al inicializar tu escena
const player = new PlayerCharacter(scene, camera);

// Definir el arma inicial
player.setWeapon('pistol'); // Opciones: 'fist', 'pistol'

// En tu loop tick/requestAnimationFrame
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  
  // Le envías el delta, el mapa de teclas pulsadas, y el estado del ratón
  player.update(dt, activeKeys, isMouseDown);
  
  renderer.render(scene, camera);
}
