import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { installDesertAircraft, updateDesertAircraft } from './aircraft-runtime.js?v=57';

const ui = {
  status: document.getElementById('status'), speed: document.getElementById('speed'),
  prompt: document.getElementById('prompt'), loading: document.getElementById('loading'),
  loadText: document.getElementById('loadText'), fill: document.getElementById('fill'),
  play: document.getElementById('play'), resume: document.getElementById('resume')
};

const TERRAIN_SIZE = 100;
const OUTER_TERRAIN_SIZE = 280;
const RAYCAST_TERRAIN_SIZE = 480;
const WORLD_LIMIT = RAYCAST_TERRAIN_SIZE / 2 - 3;
const TERRAIN_SEGMENTS = 127;
const TERRAIN_WIDTH = TERRAIN_SEGMENTS + 1;
const TERRAIN_MIN = -2;
const TERRAIN_MAX = 8;
const PLAYER_RADIUS = 0.42;
const BOARD_SCALE = 0.62;
const BOARD_CLEARANCE = 0.15;
const BOARD_RIDER_OFFSET = 0.05;
const keys = Object.create(null);
const clock = new THREE.Clock();
const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), tmpC = new THREE.Vector3(), tmpD = new THREE.Vector3();
const tmpE = new THREE.Vector3(), tmpF = new THREE.Vector3();
const boardTargetQuat = new THREE.Quaternion();
const boardTargetMatrix = new THREE.Matrix4();
let scene, camera, renderer, terrainMesh, outerTerrainGroup, raycastTerrainGroup, raycastMarker;
const terrainRaycaster = new THREE.Raycaster();
const terrainRayPointer = new THREE.Vector2(0, 0);
let physicsWorld = { lightweight: true };
let heightData;
const outerNoise = new ImprovedNoise();
const raycastTerrainNoise = new ImprovedNoise();
let started = false, firstPerson = false, yaw = 0, pitch = -0.13;
let playerRoot, soldier, mixer, actions = {}, currentAction = '';
let playerVy = 0, playerGrounded = true, jumpRequested = false;
let mounted = false, board, boardSpeed = 0, boardYaw = 0, boardVy = 0, boardGrounded = true;
let boardWheels = [], markerRing, markerLabel;
const dynamicObjects = [];
let spawnTimer = 0;

window.__GAME_STATUS = { ready: false, soldier: false, physics: false };

boot().catch(err => fail(err));

async function boot(){
  ui.fill.style.width = '12%';
  ui.loadText.textContent = 'Preparando rampa central y dos terrenos exteriores físicos…';
  initScene();
  initTerrain();
  initPhysics();
  createSkateboard();
  createPlayer();
  await loadSoldier();
  await installDesertAircraft({
    scene, camera, renderer, playerRoot, sampleHeight, ui,
    setPlayerVisible(value){ if(soldier) soldier.visible = value; }
  });
  setupInput();
  window.__GAME_STATUS.ready = true;
  ui.fill.style.width = '100%';
  ui.loadText.textContent = 'Rampa central, terreno exterior y zona raycast física listos.';
  ui.play.disabled = false;
  ui.status.textContent = 'Listo · puedes explorar la rampa y los dos terrenos exteriores';
  renderer.setAnimationLoop(animate);
}

function fail(err){
  console.error(err);
  ui.loadText.textContent = 'Error al preparar el juego: ' + (err?.message || err);
  ui.status.textContent = 'No se pudo iniciar';
}

function initScene(){
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb7cad9);
  scene.fog = new THREE.Fog(0xd8bea0, 125, 445);
  camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.08, 720);
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.getElementById('game').appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xddeeff, 0x604126, 2.3));
  const sun = new THREE.DirectionalLight(0xfff2d2, 3.2);
  sun.position.set(30, 55, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -55; sun.shadow.camera.right = 55;
  sun.shadow.camera.top = 55; sun.shadow.camera.bottom = -55;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 150;
  scene.add(sun);

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(330, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0xb7cad9, side: THREE.BackSide })
  );
  scene.add(sky);
  addEventListener('resize', onResize);
}

function generateHeight(){
  const data = new Float32Array(TERRAIN_WIDTH * TERRAIN_WIDTH);
  const half = TERRAIN_WIDTH / 2;
  const range = TERRAIN_MAX - TERRAIN_MIN;
  let p = 0;
  for(let j = 0; j < TERRAIN_WIDTH; j++){
    for(let i = 0; i < TERRAIN_WIDTH; i++){
      const radius = Math.sqrt(Math.pow((i-half)/half,2) + Math.pow((j-half)/half,2));
      data[p++] = (Math.sin(radius * 12) + 1) * 0.5 * range + TERRAIN_MIN;
    }
  }
  return data;
}

function makeBrownTexture(){
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#70472b'; ctx.fillRect(0,0,256,256);
  for(let i=0;i<2600;i++){
    const v = 65 + Math.random()*80;
    ctx.fillStyle = `rgba(${v+25},${v*.65},${v*.38},${0.04+Math.random()*.12})`;
    const s = .5 + Math.random()*2.2;
    ctx.fillRect(Math.random()*256,Math.random()*256,s,s);
  }
  ctx.strokeStyle='rgba(48,25,13,.15)'; ctx.lineWidth=1;
  for(let i=0;i<35;i++){
    ctx.beginPath(); const y=Math.random()*256; ctx.moveTo(0,y);
    for(let x=0;x<=256;x+=16) ctx.lineTo(x,y+Math.sin(x*.08+i)*3);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(24,24);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return tex;
}

function makeOuterTerrainTexture(){
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  const image = ctx.createImageData(c.width,c.height);
  const d = image.data;
  for(let y=0;y<c.height;y++){
    for(let x=0;x<c.width;x++){
      const i=(y*c.width+x)*4;
      const broad=Math.sin(x*.035)+Math.cos(y*.031)+Math.sin((x+y)*.012);
      const grain=(Math.random()-.5)*24;
      d[i]=THREE.MathUtils.clamp(145+broad*13+grain,0,255);
      d[i+1]=THREE.MathUtils.clamp(91+broad*9+grain*.55,0,255);
      d[i+2]=THREE.MathUtils.clamp(52+broad*5+grain*.3,0,255);
      d[i+3]=255;
    }
  }
  ctx.putImageData(image,0,0);
  ctx.globalAlpha=.16;
  ctx.strokeStyle='#3a2416';
  ctx.lineWidth=1;
  for(let i=0;i<70;i++){
    ctx.beginPath();
    const sy=Math.random()*512;
    ctx.moveTo(0,sy);
    for(let x=0;x<=512;x+=18) ctx.lineTo(x,sy+Math.sin(x*.025+i)*5);
    ctx.stroke();
  }
  const tex=new THREE.CanvasTexture(c);
  tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
  tex.repeat.set(16,16);
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  return tex;

}

function makeRaycastTerrainTexture(){
  // Textura horneada inspirada en webgl_geometry_terrain_raycast:
  // el color se calcula desde la altura y una luz direccional, sin texturas externas.
  const size=256;
  const c=document.createElement('canvas');
  c.width=c.height=size;
  const ctx=c.getContext('2d');
  const image=ctx.createImageData(size,size);
  const d=image.data;
  const sun=new THREE.Vector3(1,.85,.65).normalize();
  const normal=new THREE.Vector3();
  const step=RAYCAST_TERRAIN_SIZE/size;
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      const wx=(x/(size-1)-.5)*RAYCAST_TERRAIN_SIZE;
      const wz=(y/(size-1)-.5)*RAYCAST_TERRAIN_SIZE;
      const h=raycastRawHeight(wx,wz);
      const hx=raycastRawHeight(wx+step,wz)-raycastRawHeight(wx-step,wz);
      const hz=raycastRawHeight(wx,wz+step)-raycastRawHeight(wx,wz-step);
      normal.set(-hx,step*1.7,-hz).normalize();
      const shade=Math.max(.08,normal.dot(sun));
      const grain=(Math.random()-.5)*8;
      const k=THREE.MathUtils.clamp(.72+(h+3)*.025,.65,1.12);
      const i=(y*size+x)*4;
      d[i]=THREE.MathUtils.clamp((100+shade*116)*k+grain,0,255);
      d[i+1]=THREE.MathUtils.clamp((43+shade*72)*k+grain*.55,0,255);
      d[i+2]=THREE.MathUtils.clamp((19+shade*46)*k+grain*.28,0,255);
      d[i+3]=255;
    }
  }
  ctx.putImageData(image,0,0);
  const scaled=document.createElement('canvas');
  scaled.width=scaled.height=512;
  const sctx=scaled.getContext('2d');
  sctx.imageSmoothingEnabled=true;
  sctx.drawImage(c,0,0,512,512);
  const tex=new THREE.CanvasTexture(scaled);
  tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
  tex.repeat.set(3.5,3.5);
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  return tex;
}

function initTerrain(){
  heightData = generateHeight();
  const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS);
  geo.rotateX(-Math.PI/2);
  const pos = geo.attributes.position;
  for(let i=0;i<pos.count;i++) pos.setY(i,heightData[i]);
  pos.needsUpdate = true; geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ map: makeBrownTexture(), roughness: .96, metalness: 0, color: 0xffffff });
  terrainMesh = new THREE.Mesh(geo,mat);
  terrainMesh.receiveShadow = true;
  terrainMesh.name='RampaCentralMarron';
  scene.add(terrainMesh);

  // Terreno exterior basado en el ejemplo oficial webgl_geometry_terrain.
  // Se construye en cuatro franjas para dejar libre la rampa central y evitar z-fighting.
  outerTerrainGroup=new THREE.Group();
  outerTerrainGroup.name='TerrenoExteriorFisico';
  const outerMat=new THREE.MeshStandardMaterial({
    map:makeOuterTerrainTexture(),
    color:0xffffff,
    roughness:.97,
    metalness:0
  });
  const half=TERRAIN_SIZE/2;
  const outerHalf=OUTER_TERRAIN_SIZE/2;
  const band=outerHalf-half;
  const addStrip=(width,depth,cx,cz,segX,segZ)=>{
    const g=new THREE.PlaneGeometry(width,depth,segX,segZ);
    g.rotateX(-Math.PI/2);
    const p=g.attributes.position;
    for(let i=0;i<p.count;i++){
      const wx=p.getX(i)+cx, wz=p.getZ(i)+cz;
      p.setY(i,sampleOuterHeight(wx,wz));
    }
    p.needsUpdate=true;
    g.computeVertexNormals();
    const m=new THREE.Mesh(g,outerMat);
    m.position.set(cx,0,cz);
    m.receiveShadow=true;
    outerTerrainGroup.add(m);
  };
  addStrip(OUTER_TERRAIN_SIZE,band,0,half+band/2,144,48);
  addStrip(OUTER_TERRAIN_SIZE,band,0,-half-band/2,144,48);
  addStrip(band,TERRAIN_SIZE,half+band/2,0,48,64);
  addStrip(band,TERRAIN_SIZE,-half-band/2,0,48,64);
  scene.add(outerTerrainGroup);

  // Segunda corona exterior basada en webgl_geometry_terrain_raycast.
  // Se integra como heightfield físico para caminar y patinar sobre ella.
  raycastTerrainGroup=new THREE.Group();
  raycastTerrainGroup.name='TerrenoRaycastExteriorFisico';
  const raycastMat=new THREE.MeshStandardMaterial({
    map:makeRaycastTerrainTexture(),
    color:0xffffff,
    roughness:.985,
    metalness:0
  });
  const midHalf=OUTER_TERRAIN_SIZE/2;
  const farHalf=RAYCAST_TERRAIN_SIZE/2;
  const farBand=farHalf-midHalf;
  const addRaycastStrip=(width,depth,cx,cz,segX,segZ)=>{
    const g=new THREE.PlaneGeometry(width,depth,segX,segZ);
    g.rotateX(-Math.PI/2);
    const p=g.attributes.position;
    for(let i=0;i<p.count;i++){
      const wx=p.getX(i)+cx, wz=p.getZ(i)+cz;
      p.setY(i,sampleRaycastHeight(wx,wz));
    }
    p.needsUpdate=true;
    g.computeVertexNormals();
    const m=new THREE.Mesh(g,raycastMat);
    m.position.set(cx,0,cz);
    m.receiveShadow=true;
    raycastTerrainGroup.add(m);
  };
  addRaycastStrip(RAYCAST_TERRAIN_SIZE,farBand,0,midHalf+farBand/2,176,40);
  addRaycastStrip(RAYCAST_TERRAIN_SIZE,farBand,0,-midHalf-farBand/2,176,40);
  addRaycastStrip(farBand,OUTER_TERRAIN_SIZE,midHalf+farBand/2,0,40,104);
  addRaycastStrip(farBand,OUTER_TERRAIN_SIZE,-midHalf-farBand/2,0,40,104);
  scene.add(raycastTerrainGroup);

  // Marcador del ejemplo raycast: con un clic señala el terreno que miras.
  const markerGeo=new THREE.ConeGeometry(.34,1.2,5);
  markerGeo.translate(0,.6,0);
  raycastMarker=new THREE.Mesh(markerGeo,new THREE.MeshNormalMaterial());
  raycastMarker.visible=false;
  scene.add(raycastMarker);

  // Señales bajas en las cuatro salidas; no bloquean al personaje ni al skate.
  const postMat=new THREE.MeshStandardMaterial({color:0x4a2e1c,roughness:.92});
  const postGeo=new THREE.CylinderGeometry(.12,.16,1.25,8);
  for(const [x,z] of [[-5,-50],[5,-50],[-5,50],[5,50],[-50,-5],[-50,5],[50,-5],[50,5]]){
    const m=new THREE.Mesh(postGeo,postMat);
    m.position.set(x,sampleHeight(x,z)+.62,z);
    m.castShadow=true;m.receiveShadow=true;
    scene.add(m);
  }
}

function smoothStep01(t){
  t=THREE.MathUtils.clamp(t,0,1);
  return t*t*(3-2*t);
}

function outerRawHeight(x,z){
  const n1=Math.abs(outerNoise.noise(x*.016,z*.016,10.5))*5.2;
  const n2=outerNoise.noise(x*.038,z*.038,3.7)*1.45;
  const n3=outerNoise.noise(x*.085,z*.085,1.2)*.5;
  return -1.4+n1+n2+n3+Math.sin(x*.018)*.45+Math.cos(z*.021)*.4;
}

function sampleOuterHeight(x,z){
  const innerHalf=TERRAIN_SIZE/2;
  const edgeX=THREE.MathUtils.clamp(x,-innerHalf,innerHalf);
  const edgeZ=THREE.MathUtils.clamp(z,-innerHalf,innerHalf);
  const edgeHeight=sampleInnerHeight(edgeX,edgeZ);
  const distanceOutside=Math.max(Math.abs(x)-innerHalf,Math.abs(z)-innerHalf,0);
  const blend=smoothStep01(distanceOutside/18);
  return THREE.MathUtils.lerp(edgeHeight,outerRawHeight(x,z),blend);
}
function raycastRawHeight(x,z){
  // Ruido multiescala equivalente al terreno del ejemplo raycast,
  // ajustado a la escala jugable del Soldier y del skate.
  const n1=Math.abs(raycastTerrainNoise.noise(x*.0105,z*.0105,41.7))*7.8;
  const n2=Math.abs(raycastTerrainNoise.noise(x*.027,z*.027,13.2))*2.65;
  const n3=raycastTerrainNoise.noise(x*.071,z*.071,4.8)*.72;
  return -2.35+n1+n2+n3;
}

function sampleRaycastHeight(x,z){
  const midHalf=OUTER_TERRAIN_SIZE/2;
  const edgeX=THREE.MathUtils.clamp(x,-midHalf,midHalf);
  const edgeZ=THREE.MathUtils.clamp(z,-midHalf,midHalf);
  const edgeHeight=sampleOuterHeight(edgeX,edgeZ);
  const distanceOutside=Math.max(Math.abs(x)-midHalf,Math.abs(z)-midHalf,0);
  const blend=smoothStep01(distanceOutside/26);
  return THREE.MathUtils.lerp(edgeHeight,raycastRawHeight(x,z),blend);
}

function sampleInnerHeight(x,z){
  const half = TERRAIN_SIZE/2;
  const fx = THREE.MathUtils.clamp((x+half)/TERRAIN_SIZE*TERRAIN_SEGMENTS,0,TERRAIN_SEGMENTS);
  const fz = THREE.MathUtils.clamp((z+half)/TERRAIN_SIZE*TERRAIN_SEGMENTS,0,TERRAIN_SEGMENTS);
  const x0=Math.floor(fx), z0=Math.floor(fz), x1=Math.min(TERRAIN_SEGMENTS,x0+1), z1=Math.min(TERRAIN_SEGMENTS,z0+1);
  const tx=fx-x0,tz=fz-z0;
  const h00=heightData[z0*TERRAIN_WIDTH+x0], h10=heightData[z0*TERRAIN_WIDTH+x1];
  const h01=heightData[z1*TERRAIN_WIDTH+x0], h11=heightData[z1*TERRAIN_WIDTH+x1];
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(h00,h10,tx),THREE.MathUtils.lerp(h01,h11,tx),tz);
}

function sampleHeight(x,z){
  const half=TERRAIN_SIZE/2;
  const outerHalf=OUTER_TERRAIN_SIZE/2;
  if(Math.abs(x)<=half&&Math.abs(z)<=half) return sampleInnerHeight(x,z);
  if(Math.abs(x)<=outerHalf&&Math.abs(z)<=outerHalf) return sampleOuterHeight(x,z);
  return sampleRaycastHeight(x,z);
}

function initPhysics(){
  // Física ligera local: evita depender de Ammo/WebAssembly y conserva
  // suelo sólido, gravedad, rebotes y deslizamiento sobre el heightfield.
  physicsWorld = { lightweight: true };
  window.__GAME_STATUS.physics = true;
  ui.fill.style.width = '48%';
}

function spawnPhysicsObject(){
  if(dynamicObjects.length >= 10) return;
  const box = Math.random() > .45;
  const size = .6 + Math.random() * 1.15;
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(Math.random(), .55, .48),
    roughness: box ? .68 : .56
  });
  const mesh = box
    ? new THREE.Mesh(new THREE.BoxGeometry(size,size,size), material)
    : new THREE.Mesh(new THREE.SphereGeometry(size*.52,16,12), material);
  mesh.position.set((Math.random()-.5)*90, 13+Math.random()*8, (Math.random()-.5)*90);
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.userData.velocity = new THREE.Vector3((Math.random()-.5)*1.2, 0, (Math.random()-.5)*1.2);
  mesh.userData.angularVelocity = new THREE.Vector3(
    (Math.random()-.5)*2.2,
    (Math.random()-.5)*2.2,
    (Math.random()-.5)*2.2
  );
  mesh.userData.clearance = box ? size*.5 : size*.52;
  mesh.userData.bounces = 0;
  scene.add(mesh);
  dynamicObjects.push(mesh);
}

function createSkateboard(){
  board = new THREE.Group(); board.name='Skateboard';
  const wood = new THREE.MeshStandardMaterial({color:0x9a5f2d,roughness:.68,metalness:.02});
  const grip = new THREE.MeshStandardMaterial({color:0x161616,roughness:1});
  const metal = new THREE.MeshStandardMaterial({color:0xbac0c4,roughness:.34,metalness:.82});
  const wheelMat = new THREE.MeshStandardMaterial({color:0xe8d6a4,roughness:.76});

  // Skate proporcionado al Soldier: cerca de 1 metro de largo.
  const deckGeo = new THREE.CapsuleGeometry(.29,1.03,5,18);
  deckGeo.rotateX(Math.PI/2);
  const deck = new THREE.Mesh(deckGeo,wood);
  deck.scale.set(1,.14,1);deck.castShadow=deck.receiveShadow=true;board.add(deck);

  const topGeo = new THREE.CapsuleGeometry(.27,.98,4,16);
  topGeo.rotateX(Math.PI/2);
  const top = new THREE.Mesh(topGeo,grip);
  top.scale.set(1,.018,1);top.position.y=.052;board.add(top);

  const wheelGeo = new THREE.CylinderGeometry(.082,.082,.072,16);
  wheelGeo.rotateZ(Math.PI/2);
  for(const z of [-.43,.43]){
    const truck=new THREE.Mesh(new THREE.BoxGeometry(.62,.065,.105),metal);truck.position.set(0,-.095,z);truck.castShadow=true;board.add(truck);
    const axleGeo = new THREE.CylinderGeometry(.018,.018,.76,10);axleGeo.rotateZ(Math.PI/2);
    const axle=new THREE.Mesh(axleGeo,metal);axle.position.set(0,-.132,z);board.add(axle);
    for(const x of [-.37,.37]){
      const w=new THREE.Mesh(wheelGeo,wheelMat);w.position.set(x,-.155,z);w.castShadow=true;board.add(w);boardWheels.push(w);
    }
  }
  board.scale.setScalar(BOARD_SCALE);
  board.position.set(43,sampleHeight(43,0)+BOARD_CLEARANCE,0);boardYaw=0;scene.add(board);
  alignBoardToTerrain(1);
  markerRing = new THREE.Mesh(new THREE.TorusGeometry(.78,.048,10,36),new THREE.MeshBasicMaterial({color:0xffd27b}));
  markerRing.rotation.x=Math.PI/2;markerRing.position.set(board.position.x,sampleHeight(board.position.x,board.position.z)+.08,board.position.z);scene.add(markerRing);
  const labelCanvas=document.createElement('canvas');labelCanvas.width=256;labelCanvas.height=72;const lctx=labelCanvas.getContext('2d');
  lctx.fillStyle='rgba(28,16,8,.82)';lctx.roundRect(4,4,248,64,18);lctx.fill();lctx.strokeStyle='#ffd27b';lctx.lineWidth=4;lctx.stroke();
  lctx.fillStyle='#fff4dc';lctx.font='bold 34px Arial';lctx.textAlign='center';lctx.textBaseline='middle';lctx.fillText('SKATE',128,37);
  const labelTex=new THREE.CanvasTexture(labelCanvas);labelTex.colorSpace=THREE.SRGBColorSpace;markerLabel=new THREE.Sprite(new THREE.SpriteMaterial({map:labelTex,transparent:true,depthTest:false}));
  markerLabel.scale.set(3.1,.88,1);markerLabel.position.set(board.position.x,board.position.y+1.8,board.position.z);scene.add(markerLabel);
}
function createPlayer(){
  playerRoot = new THREE.Group();
  playerRoot.position.set(38,sampleHeight(38,0)+.03,0);
  scene.add(playerRoot);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.46,24),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.22,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2;shadow.position.y=.015;playerRoot.add(shadow);
}

function loadSoldier(){
  ui.loadText.textContent='Cargando Soldier animado…';ui.fill.style.width='70%';
  return new Promise((resolve,reject)=>{
    new GLTFLoader().load('./examples/models/gltf/Soldier.glb',g=>{
      soldier=g.scene;soldier.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false}});
      soldier.scale.set(1,1,1);soldier.rotation.y=0;playerRoot.add(soldier);
      mixer=new THREE.AnimationMixer(soldier);
      g.animations.forEach(clip=>actions[clip.name]=mixer.clipAction(clip));
      actions.Idle ||= g.animations[0] ? mixer.clipAction(g.animations[0]) : null;
      actions.Run ||= g.animations[1] ? mixer.clipAction(g.animations[1]) : null;
      actions.Walk ||= g.animations[3] ? mixer.clipAction(g.animations[3]) : null;
      if(actions.Walk)actions.Walk.timeScale=1.08;if(actions.Run)actions.Run.timeScale=.92;
      fadeTo('Idle',0);window.__GAME_STATUS.soldier=true;resolve();
    },e=>{if(e.total)ui.fill.style.width=(70+Math.round(e.loaded/e.total*25))+'%'},reject);
  });
}

function fadeTo(name,duration=.2){
  const next=actions[name];if(!next||currentAction===name)return;
  const prev=actions[currentAction];if(prev)prev.fadeOut(duration);
  next.reset().fadeIn(duration).play();currentAction=name;
}

function setupInput(){
  const lock=()=>renderer.domElement.requestPointerLock?.();
  ui.play.onclick=()=>{started=true;ui.loading.style.display='none';lock()};
  ui.resume.onclick=lock;
  renderer.domElement.addEventListener('click',()=>{
    if(started&&document.pointerLockElement!==renderer.domElement){lock();return}
    if(started&&document.pointerLockElement===renderer.domElement)placeRaycastMarker();
  });
  document.addEventListener('pointerlockchange',()=>ui.resume.style.display=started&&document.pointerLockElement!==renderer.domElement?'block':'none');
  document.addEventListener('mousemove',e=>{
    if(document.pointerLockElement!==renderer.domElement)return;
    yaw += e.movementX*.0022;
    pitch = THREE.MathUtils.clamp(pitch-e.movementY*.0018,-.72,.48);
  });
  addEventListener('keydown',e=>{
    keys[e.code]=true;
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Enter'].includes(e.code))e.preventDefault();
    if(e.code==='Space'&&!e.repeat)jumpRequested=true;
    if(e.code==='KeyV'&&!e.repeat){firstPerson=!firstPerson;ui.status.textContent=firstPerson?'Cámara en primera persona':'Cámara en tercera persona'}
    if(e.code==='Enter'&&!e.repeat)toggleBoard();
  },{passive:false});
  addEventListener('keyup',e=>keys[e.code]=false);
  addEventListener('blur',()=>Object.keys(keys).forEach(k=>keys[k]=false));
}

function placeRaycastMarker(){
  if(!raycastMarker)return;
  terrainRaycaster.setFromCamera(terrainRayPointer,camera);
  const targets=[terrainMesh,...outerTerrainGroup.children,...raycastTerrainGroup.children];
  const hit=terrainRaycaster.intersectObjects(targets,false)[0];
  if(hit){
    raycastMarker.visible=true;
    raycastMarker.position.copy(hit.point).addScaledVector(hit.face?.normal||tmpA.set(0,1,0),.04);
    if(hit.face?.normal){
      const normal=hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
      raycastMarker.quaternion.setFromUnitVectors(tmpB.set(0,1,0),normal);
    }
  }
}

function toggleBoard(){
  if(!started||!soldier)return;
  if(mounted){
    mounted=false;boardSpeed*=.35;
    const right=tmpA.set(Math.cos(boardYaw),0,Math.sin(boardYaw));
    playerRoot.position.copy(board.position).addScaledVector(right,1.05);
    playerRoot.position.y=sampleHeight(playerRoot.position.x,playerRoot.position.z)+.03;
    soldier.position.set(0,0,0);soldier.rotation.set(0,0,0);fadeTo('Idle');
    ui.status.textContent='Bajaste del skate';
    return;
  }
  if(playerRoot.position.distanceTo(board.position)<=1.85){
    mounted=true;boardSpeed=0;
    playerRoot.position.copy(board.position);playerRoot.position.y=board.position.y+BOARD_RIDER_OFFSET;
    playerRoot.rotation.set(0,-boardYaw,0);soldier.position.set(0,0,0);soldier.rotation.set(.035,0,0);fadeTo('Idle');
    ui.status.textContent='Sobre el skate · W acelera · Espacio hace ollie';
  }
}

function updateFoot(dt){
  const forwardInput=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0);
  const sideInput=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
  const running=!!(keys.ShiftLeft||keys.ShiftRight);
  const moving=forwardInput!==0||sideInput!==0;
  if(jumpRequested&&playerGrounded){playerVy=7.2;playerGrounded=false}jumpRequested=false;
  if(moving){
    const forward=tmpA.set(Math.sin(yaw),0,-Math.cos(yaw));
    const right=tmpB.set(Math.cos(yaw),0,Math.sin(yaw));
    const dir=tmpC.set(0,0,0).addScaledVector(forward,forwardInput).addScaledVector(right,sideInput).normalize();
    const speed=running?7.4:3.7;
    const nx=THREE.MathUtils.clamp(playerRoot.position.x+dir.x*speed*dt,-WORLD_LIMIT,WORLD_LIMIT);
    const nz=THREE.MathUtils.clamp(playerRoot.position.z+dir.z*speed*dt,-WORLD_LIMIT,WORLD_LIMIT);
    const nh=sampleHeight(nx,nz),ch=sampleHeight(playerRoot.position.x,playerRoot.position.z);
    if(!playerGrounded||nh-ch<1.15){playerRoot.position.x=nx;playerRoot.position.z=nz}
    const target=Math.atan2(dir.x,dir.z)+Math.PI;
    const diff=Math.atan2(Math.sin(target-playerRoot.rotation.y),Math.cos(target-playerRoot.rotation.y));
    playerRoot.rotation.y+=diff*Math.min(1,dt*12);
  }
  playerVy-=18*dt;playerRoot.position.y+=playerVy*dt;
  const floor=sampleHeight(playerRoot.position.x,playerRoot.position.z)+.03;
  if(playerRoot.position.y<=floor&&playerVy<=0){playerRoot.position.y=floor;playerVy=0;playerGrounded=true}else playerGrounded=false;
  if(!playerGrounded)fadeTo(running?'Run':'Walk',.12);else if(moving)fadeTo(running?'Run':'Walk');else fadeTo('Idle',.24);
  soldier.position.y=0;soldier.rotation.x=THREE.MathUtils.lerp(soldier.rotation.x,0,Math.min(1,dt*9));soldier.rotation.z=THREE.MathUtils.lerp(soldier.rotation.z,0,Math.min(1,dt*9));
  ui.speed.textContent='';
}

function updateBoard(dt){
  const throttle=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0);
  const steer=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
  const turbo=!!(keys.ShiftLeft||keys.ShiftRight);
  const maxSpeed=turbo?18:12;

  // Aceleración y freno más suaves para evitar tirones.
  if(throttle>0) boardSpeed += (turbo?10.5:7.2)*dt;
  else if(throttle<0){
    if(boardSpeed>0.4) boardSpeed -= 12*dt;
    else boardSpeed -= 4.5*dt;
  }else{
    boardSpeed *= Math.exp(-.62*dt);
  }
  boardSpeed=THREE.MathUtils.clamp(boardSpeed,-3.5,maxSpeed);
  if(Math.abs(boardSpeed)<.015) boardSpeed=0;

  // D gira físicamente hacia la derecha y A hacia la izquierda.
  const steerStrength=THREE.MathUtils.clamp(Math.abs(boardSpeed)/5,.12,1);
  boardYaw += steer*1.18*steerStrength*dt*(boardSpeed>=0?1:-1);

  if(jumpRequested&&boardGrounded){boardVy=6.1;boardGrounded=false}jumpRequested=false;
  const dir=tmpA.set(Math.sin(boardYaw),0,-Math.cos(boardYaw));
  const nx=THREE.MathUtils.clamp(board.position.x+dir.x*boardSpeed*dt,-WORLD_LIMIT,WORLD_LIMIT);
  const nz=THREE.MathUtils.clamp(board.position.z+dir.z*boardSpeed*dt,-WORLD_LIMIT,WORLD_LIMIT);
  const nh=sampleHeight(nx,nz),ch=sampleHeight(board.position.x,board.position.z);
  if(!boardGrounded||nh-ch<.9){board.position.x=nx;board.position.z=nz}else boardSpeed*=.2;

  boardVy-=16*dt;board.position.y+=boardVy*dt;
  const floor=sampleHeight(board.position.x,board.position.z)+BOARD_CLEARANCE;
  if(board.position.y<=floor&&boardVy<=0){
    board.position.y=floor;boardVy=0;boardGrounded=true;alignBoardToTerrain(dt);
  }else{
    boardGrounded=false;
    // En el aire conserva la dirección sin voltearse de manera extraña.
    boardTargetQuat.setFromEuler(new THREE.Euler(THREE.MathUtils.clamp(-boardVy*.012,-.13,.13),-boardYaw,0,'YXZ'));
    board.quaternion.slerp(boardTargetQuat,1-Math.exp(-5*dt));
  }
  for(const w of boardWheels)w.rotation.x-=boardSpeed*dt*8.5;

  playerRoot.position.copy(board.position);playerRoot.position.y+=BOARD_RIDER_OFFSET;
  // El Soldier y el skate miran exactamente hacia la dirección de desplazamiento.
  playerRoot.rotation.y=-boardYaw;
  soldier.position.y=0;
  soldier.rotation.x=THREE.MathUtils.lerp(soldier.rotation.x,.035,1-Math.exp(-7*dt));
  soldier.rotation.z=THREE.MathUtils.lerp(soldier.rotation.z,-steer*.08,1-Math.exp(-7*dt));
  fadeTo('Idle',.15);
  ui.speed.textContent=`Velocidad del skate: ${Math.abs(boardSpeed*4.2).toFixed(0)} km/h${turbo?' · TURBO':''}`;
}
function alignBoardToTerrain(dt=.016){
  const x=board.position.x,z=board.position.z,d=.42;
  const sx=(sampleHeight(x+d,z)-sampleHeight(x-d,z))/(2*d);
  const sz=(sampleHeight(x,z+d)-sampleHeight(x,z-d))/(2*d);

  // Normal real del terreno.
  const normal=tmpB.set(-sx,1,-sz).normalize();
  // Dirección de movimiento proyectada sobre la pendiente.
  const forward=tmpC.set(Math.sin(boardYaw),0,-Math.cos(boardYaw));
  forward.addScaledVector(normal,-forward.dot(normal)).normalize();
  // El eje local -Z del skate apunta hacia adelante.
  const zAxis=tmpD.copy(forward).multiplyScalar(-1);
  const xAxis=tmpE.crossVectors(normal,zAxis).normalize();
  const yAxis=tmpF.crossVectors(zAxis,xAxis).normalize();
  boardTargetMatrix.makeBasis(xAxis,yAxis,zAxis);
  boardTargetQuat.setFromRotationMatrix(boardTargetMatrix);
  board.quaternion.slerp(boardTargetQuat,dt>=1?1:1-Math.exp(-10*dt));
}
function updatePrompt(){
  if(mounted){ui.prompt.style.display='block';ui.prompt.textContent='ENTER: bajar del skate';markerRing.visible=false;if(markerLabel)markerLabel.visible=false;return}
  const dist=playerRoot.position.distanceTo(board.position);
  markerRing.visible=true;if(markerLabel){markerLabel.visible=true;markerLabel.position.set(board.position.x,board.position.y+1.8,board.position.z)}markerRing.rotation.z+=.012;markerRing.position.set(board.position.x,sampleHeight(board.position.x,board.position.z)+.1,board.position.z);
  if(dist<1.85){ui.prompt.style.display='block';ui.prompt.textContent='ENTER: subir al skate'}else{ui.prompt.style.display='none'}
}

function updateCamera(dt){
  const anchor=tmpA.copy(playerRoot.position).add(tmpB.set(0,mounted?1.55:1.58,0));
  const view=tmpC.set(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)).normalize();
  if(firstPerson){
    camera.position.copy(anchor);camera.lookAt(tmpD.copy(anchor).addScaledVector(view,10));
    if(soldier)soldier.visible=false;
  }else{
    if(soldier)soldier.visible=true;
    const distance=mounted?5.6:5.1;
    const desired=tmpD.copy(anchor).addScaledVector(view,-distance);desired.y+=mounted?.75:.45;
    camera.position.lerp(desired,1-Math.pow(.001,dt));camera.lookAt(anchor);
  }
}

function updatePhysics(dt){
  if(!physicsWorld) return;
  dt = Math.min(dt, .033);
  for(const obj of dynamicObjects){
    const v = obj.userData.velocity;
    const av = obj.userData.angularVelocity;
    if(!v || !av) continue;

    v.y -= 12.5 * dt;
    obj.position.addScaledVector(v, dt);
    obj.rotation.x += av.x * dt;
    obj.rotation.y += av.y * dt;
    obj.rotation.z += av.z * dt;

    obj.position.x = THREE.MathUtils.clamp(obj.position.x, -WORLD_LIMIT, WORLD_LIMIT);
    obj.position.z = THREE.MathUtils.clamp(obj.position.z, -WORLD_LIMIT, WORLD_LIMIT);
    const floor = sampleHeight(obj.position.x, obj.position.z) + obj.userData.clearance;

    if(obj.position.y <= floor){
      obj.position.y = floor;
      if(Math.abs(v.y) > .7){
        v.y = -v.y * .34;
        obj.userData.bounces++;
      }else{
        v.y = 0;
      }

      // Deslizamiento natural por la pendiente del terreno.
      const d = .28;
      const sx = (sampleHeight(obj.position.x+d,obj.position.z)-sampleHeight(obj.position.x-d,obj.position.z))/(2*d);
      const sz = (sampleHeight(obj.position.x,obj.position.z+d)-sampleHeight(obj.position.x,obj.position.z-d))/(2*d);
      v.x += -sx * 3.2 * dt;
      v.z += -sz * 3.2 * dt;
      v.x *= Math.exp(-1.9*dt);
      v.z *= Math.exp(-1.9*dt);
      av.multiplyScalar(Math.exp(-1.1*dt));
    }
  }
  spawnTimer += dt;
  if(spawnTimer > 2.6 && dynamicObjects.length < 10){
    spawnTimer = 0;
    spawnPhysicsObject();
  }
}

function animate(){
  const dt=Math.min(clock.getDelta(),.05);
  if(mixer)mixer.update(dt);
  const aircraftActive=updateDesertAircraft(dt);
  if(started&&soldier&&!aircraftActive){if(mounted)updateBoard(dt);else updateFoot(dt);updatePrompt()}
  updatePhysics(dt);if(!aircraftActive)updateCamera(dt);
  renderer.render(scene,camera);
  if(started){
    const edge=Math.max(Math.abs(playerRoot.position.x),Math.abs(playerRoot.position.z));
    const zone=edge>OUTER_TERRAIN_SIZE/2?'zona exterior raycast':edge>TERRAIN_SIZE/2?'terreno exterior rojizo':'rampa central';
    ui.status.textContent=mounted?`Skate activo · ${zone}`:playerGrounded?`Explorando ${zone}`:'Saltando';
  }
}

function onResize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5))}
