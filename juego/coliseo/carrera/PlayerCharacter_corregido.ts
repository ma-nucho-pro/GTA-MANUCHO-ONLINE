import * as THREE from 'three';

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
    walkSpeed: 10.0 * WORLD_SCALE, // Ajustada para escala típica
    runSpeed: 22.0 * WORLD_SCALE,   // Ajustada para escala típica
    flySpeed: 30.0 * WORLD_SCALE,   // Ajustada para escala típica
    zone: 'ZONE_EXPLORATION'
  };

  // Callback de altura de terreno personalizado
  public getTerrainHeight: (x: number, z: number) => number = () => 0.0;

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

  // Inicializa un personaje procedimental incluido en el propio código.
  // No descarga modelos externos, por lo que funciona sin conexión.
  private init() {
    this.createFallbackModel();
  }

  // Genera un substituto visual elegante si la red falla al bajar el .glb de ThreeJS
  private createFallbackModel() {
    this.model = new THREE.Group() as any;
    
    // Cuerpo / Torso
    const torsoGeo = new THREE.CylinderGeometry(0.2, 0.15, 0.8, 8);
    const torsoMat = new THREE.MeshStandardMaterial({ color: 0x3b593f, metalness: 0.1, roughness: 0.8 });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 0.7;
    torso.castShadow = true;
    torso.receiveShadow = true;
    this.model!.add(torso);

    // Cabeza
    const headGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.9 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.2;
    head.castShadow = true;
    this.model!.add(head);

    // Casco militar
    const helmetGeo = new THREE.SphereGeometry(0.15, 8, 8, 0, Math.PI*2, 0, Math.PI/2);
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0x243b27, roughness: 0.7 });
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.y = 1.28;
    helmet.scale.set(1.1, 1.1, 1.1);
    this.model!.add(helmet);

    // Piernas (Dos cilindros)
    const legGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.4, 8);
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1d2c1f, roughness: 0.9 });
    
    const legL = new THREE.Mesh(legGeo, pantsMat);
    legL.position.set(-0.1, 0.2, 0);
    legL.castShadow = true;
    this.model!.add(legL);

    const legR = legL.clone();
    legR.position.x = 0.1;
    this.model!.add(legR);

    this.modelGroup.add(this.model!);

    // Jetpack procedimental
    const jpData = createProceduralJetpack();
    this.jetpackMesh = jpData.mesh;
    this.jetpackFlames = jpData.flames;
    this.jetpackMesh.visible = false;
    this.jetpackMesh.position.set(0, 0.7, -0.22);
    this.modelGroup.add(this.jetpackMesh);

    // Mochila
    this.parachuteBackpackMesh = createProceduralParachuteBackpack();
    this.parachuteBackpackMesh.visible = false;
    this.parachuteBackpackMesh.position.set(0, 0.7, -0.22);
    this.parachuteBackpackMesh.rotation.set(0, Math.PI, 0);
    this.parachuteBackpackMesh.scale.set(1.0, 1.0, 1.0);
    this.modelGroup.add(this.parachuteBackpackMesh);

    // Pistola
    this.pistolMesh = createProceduralPistol();
    this.pistolMesh.visible = false;
    this.pistolMesh.scale.set(0.08, 0.08, 0.08);
    this.pistolMesh.position.set(0.15, 0.6, 0.2);
    this.modelGroup.add(this.pistolMesh);

    this.fpPistolMesh = createProceduralPistol();
    this.fpPistolMesh.visible = false;
    this.fpPistolMesh.position.set(1.5 * WORLD_SCALE, -2.2 * WORLD_SCALE, -4.5 * WORLD_SCALE);
    this.fpPistolMesh.rotation.set(0.1, Math.PI, 0);
    this.fpPistolMesh.scale.set(1.2, 1.2, 1.3);
    this.camera.add(this.fpPistolMesh);
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
    // Si el modelo aún no se ha cargado/generado, evitar loops
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
    
    // Obtener altura del terreno y comprobar agua
    const terrainHeight = this.getTerrainHeight(this.container.position.x, this.container.position.z);
    
    this.state.inWater = terrainHeight < WATER_LEVEL;
    if (this.state.inWater) {
      currentSpeed = this.state.walkSpeed * 0.5;
    }

    let inputX = 0;
    let inputZ = 0;
    
    // Suporting KeyW/KeyS/KeyA/KeyD and standard chars/arrow keys
    if (keys['KeyW'] || keys['w'] || keys['ArrowUp']) inputZ -= 1;
    if (keys['KeyS'] || keys['s'] || keys['ArrowDown']) inputZ += 1;
    if (keys['KeyA'] || keys['a'] || keys['ArrowLeft']) inputX -= 1;
    if (keys['KeyD'] || keys['d'] || keys['ArrowRight']) inputX += 1;

    let moving = false;
    let movementYaw: number | null = null;

    // Calcular el desplazamiento según la dirección horizontal de la cámara.
    if (inputX !== 0 || inputZ !== 0) {
      moving = true;

      const forward = this.tempVec1.set(0, 0, -1).applyQuaternion(this.camera.quaternion);
      forward.y = 0;
      forward.normalize();

      const right = this.tempVec2.set(1, 0, 0).applyQuaternion(this.camera.quaternion);
      right.y = 0;
      right.normalize();

      const dMove = this.tempVec3.set(0, 0, 0);

      if (inputZ < 0) dMove.addScaledVector(forward, currentSpeed * dt);
      if (inputZ > 0) dMove.addScaledVector(forward, -currentSpeed * dt);
      if (inputX < 0) dMove.addScaledVector(right, -currentSpeed * 0.7 * dt);
      if (inputX > 0) dMove.addScaledVector(right, currentSpeed * 0.7 * dt);

      // El Soldier.glb está girado 180° dentro de modelGroup. Por eso el yaw
      // del contenedor debe orientar su eje -Z exactamente hacia el movimiento.
      movementYaw = Math.atan2(-dMove.x, -dMove.z);

      const nextX = this.container.position.x + dMove.x;
      const nextZ = this.container.position.z + dMove.z;

      const hasCollision = this.collisionCheck(nextX, nextZ);
      if (!hasCollision) {
        this.container.position.x = nextX;
        this.container.position.z = nextZ;
      }
    }

    // --- ANIMACIONES ANATÓMICAS DE CAÍDA/FLOTACIÓN LIBRE (Si hay huesos cargados) ---
    const rotX = (bone: any, angle: number) => {
      if (bone) bone.rotation.x = THREE.MathUtils.lerp(bone.rotation.x, angle, 0.2);
    };

    if (!this.state.onGround && !this.state.inWater && !this.state.isFlying && this.bones.leftUp) {
      // Abre levemente las piernas en pose de caída libre táctica
      rotX(this.bones.leftUp, -1.8);
      rotX(this.bones.rightUp, -1.4 + Math.sin(time * 20) * 0.3);
      rotX(this.bones.leftLow, 2.0);
      rotX(this.bones.rightLow, 2.0);
    } else if (this.state.inWater && this.bones.leftUp) {
      // --- MOVIMIENTO CONTINUO DE PALIQUE / NATACIÓN ---
      // Pataleo continuo (flutter-kick)
      const swimAngleL = Math.sin(time * 12) * 0.45;
      const swimAngleR = -Math.sin(time * 12) * 0.45;
      rotX(this.bones.leftUp, swimAngleL);
      rotX(this.bones.rightUp, swimAngleR);
      rotX(this.bones.leftLow, 0.5);
      rotX(this.bones.rightLow, 0.5);

      // Brazadas circulares/de natación alternas
      const armLRotation = -0.8 + Math.cos(time * 6) * 0.35;
      const armRRotation = -0.8 - Math.cos(time * 6) * 0.35;
      if (this.bones.armL) {
        this.bones.armL.rotation.x = THREE.MathUtils.lerp(this.bones.armL.rotation.x, armLRotation, 0.2);
        this.bones.armL.rotation.z = THREE.MathUtils.lerp(this.bones.armL.rotation.z, -0.4, 0.2);
      }
      if (this.bones.armR) {
        this.bones.armR.rotation.x = THREE.MathUtils.lerp(this.bones.armR.rotation.x, armRRotation, 0.2);
        this.bones.armR.rotation.z = THREE.MathUtils.lerp(this.bones.armR.rotation.z, 0.4, 0.2);
      }
      if (this.bones.spine) {
        this.bones.spine.rotation.x = THREE.MathUtils.lerp(this.bones.spine.rotation.x, 0.15, 0.15);
      }
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
      let targetAngle = this.modelGroup.rotation.y;

      if (this.activeWeapon === 'pistol') {
        // En combate, el cuerpo mira exactamente hacia donde apunta la cámara.
        const camDir = this.tempVec1.set(0, 0, -1).applyQuaternion(this.camera.quaternion);
        camDir.y = 0;
        camDir.normalize();
        targetAngle = Math.atan2(-camDir.x, -camDir.z);
      } else if (moving && movementYaw !== null) {
        // En exploración, el cuerpo mira en la misma dirección en la que se desplaza.
        targetAngle = movementYaw;
      }

      // Interpolar la rotación por el camino angular más corto.
      let diff = targetAngle - this.modelGroup.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.modelGroup.rotation.y += diff * 0.2;

      // Postura horizontal normal al nadar: boca abajo y hacia delante.
      if (this.state.inWater) {
        this.modelGroup.rotation.x = THREE.MathUtils.lerp(this.modelGroup.rotation.x, -Math.PI / 2.3, 0.12);
        this.modelGroup.rotation.z = THREE.MathUtils.lerp(this.modelGroup.rotation.z, 0, 0.12);
      } else {
        this.modelGroup.rotation.x = THREE.MathUtils.lerp(this.modelGroup.rotation.x, 0, 0.12);
        this.modelGroup.rotation.z = THREE.MathUtils.lerp(this.modelGroup.rotation.z, 0, 0.12);
      }
    }

    // --- FÍSICA DE JETPACK, AGUA Y GRAVEDAD ---
    const floorY = terrainHeight;

    if (this.state.isFlying) {
      this.state.onGround = false;
      this.state.vy = 0;
      if (keys['Space'] || keys[' ']) this.container.position.y += 12 * WORLD_SCALE * dt;
      if (keys['ShiftLeft']) this.container.position.y -= 12 * WORLD_SCALE * dt;
      
      // Límite inferior al volar
      if (this.container.position.y < floorY) {
        this.container.position.y = floorY;
      }
    } else if (this.state.inWater) {
      // Gravedad amortiguada en agua / natación
      this.state.onGround = false;
      const targetWaterSurface = WATER_LEVEL + 0.3;
      
      // Si está muy abajo, flota lentamente hacia arriba
      if (this.container.position.y < targetWaterSurface - 1.0) {
        this.state.vy = THREE.MathUtils.lerp(this.state.vy, 2.5, 0.1);
        this.state.isSubmerged = true;
      } else {
        // Flota en la superficie
        this.container.position.y = THREE.MathUtils.lerp(this.container.position.y, targetWaterSurface, 0.1);
        this.state.vy = 0;
        this.state.isSubmerged = false;
      }
      
      if (keys['Space'] || keys[' ']) {
        this.state.vy = 3.5;
        this.container.position.y += this.state.vy * dt;
      }
    } else {
      // Gravedad normal del mundo real
      if (this.container.position.y > floorY) {
        this.state.vy -= 26 * WORLD_SCALE * dt; // Caída
        this.state.onGround = false;
      } else {
        this.container.position.y = floorY;
        this.state.vy = 0;
        this.state.onGround = true;
      }

      // Salto
      if ((keys['Space'] || keys[' ']) && this.state.onGround) {
        this.state.vy = 10 * WORLD_SCALE;
        this.state.onGround = false;
      }
    }

    // Aplicar velocidad vertical
    this.container.position.y += this.state.vy * dt;
    
    // Límite inferior absoluto secundario
    if (this.container.position.y < floorY) {
      this.container.position.y = floorY;
      this.state.vy = 0;
      this.state.onGround = true;
    }
  }

  public staticObstacles: THREE.Box3[] = [];

  // Método de detección de colisiones personalizado (rellenable)
  private collisionCheck(x: number, z: number): boolean {
    // Evitar que el personaje salga volando del mapa principal
    const maxBoundary = 250;
    if (Math.abs(x) > maxBoundary || Math.abs(z) > maxBoundary) {
      return true;
    }
    
    // Verificar colisiones con obstáculos estáticos (muros, árboles, postes, etc.)
    if (this.staticObstacles && this.staticObstacles.length > 0) {
      const playerRadius = 0.6;
      // Crear caja de colisión tentativa temporal para el jugador en la nueva posición
      const playerBox = new THREE.Box3(
        new THREE.Vector3(x - playerRadius, this.container.position.y, z - playerRadius),
        new THREE.Vector3(x + playerRadius, this.container.position.y + 1.8, z + playerRadius)
      );
      
      for (let i = 0; i < this.staticObstacles.length; i++) {
        if (playerBox.intersectsBox(this.staticObstacles[i])) {
          return true; // Colisión detectada
        }
      }
    }
    return false;
  }
}
