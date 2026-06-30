/**
 * GTA MANUCHO V84 — módulo marino, natación, seguridad acuática y nubes.
 * Autor e integración: Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * Marca: ARKEA AI / Manucho. Uso permitido conforme a LICENSE; conserva los créditos.
 * Instagram: https://www.instagram.com/robertmanuchojp/
 * YouTube: https://www.youtube.com/@ManuchoAI
 * LinkedIn: https://www.linkedin.com/in/roberto-manuel-jara-peche-10867240b/
 */
import * as THREE from './bosque/libs/three.module.js';
import { GLTFLoader } from './bosque/bike-runtime/loaders/GLTFLoader.js';
import { DRACOLoader } from './bosque/bike-runtime/loaders/DRACOLoader.js';
import { clone as cloneSkeleton } from './bosque/bike-runtime/utils/SkeletonUtils.js';
import { Water } from './marine-assets/Water.js';

THREE.Cache.enabled = true;

// Basado en Water y en la estrategia de ruido/nubes de los ejemplos oficiales de Three.js.
// La textura de nubes incluida se genera localmente y no depende de recursos remotos.

const WORLD_SCALE = 16;
const WATER_LEVEL = -14 * WORLD_SCALE;
const SEA_FLOOR = WATER_LEVEL - 900;
const MARINE_CENTER = new THREE.Vector3(0, WATER_LEVEL, 2080 * WORLD_SCALE);
const UPDATE_STEP = 1 / 12;
const SAFETY_STEP = .14;
const MAIN_BOUNDS = { xMin:-2800*WORLD_SCALE,xMax:2500*WORLD_SCALE,zMin:-5600*WORLD_SCALE,zMax:4500*WORLD_SCALE };
const SAFE_SURFACES = [
  { xMin:-2400,xMax:-600,zMin:-5350,zMax:-3350 },
  { xMin:-2500,xMax:-500,zMin:-3600,zMax:-600 },
  { xMin:-2500,xMax:-500,zMin:-300,zMax:2700 },
  { xMin:750,xMax:2250,zMin:-5350,zMax:-3350 },
  { xMin:750,xMax:2250,zMin:-3600,zMax:-600 },
  { xMin:750,xMax:2250,zMin:-900,zMax:2100 },
  { xMin:750,xMax:2250,zMin:2700,zMax:4200 },
  { xMin:-400,xMax:400,zMin:-525,zMax:75 },
  { xMin:-1050,xMax:-450,zMin:-275,zMax:-175 },
  { xMin:450,xMax:1050,zMin:-275,zMax:-175 },
  { xMin:-1000,xMax:1000,zMin:1200,zMax:1350 }
].map(s => ({xMin:s.xMin*WORLD_SCALE,xMax:s.xMax*WORLD_SCALE,zMin:s.zMin*WORLD_SCALE,zMax:s.zMax*WORLD_SCALE}));

const ISLANDS = [
  { id:'isla_oeste', x:-205*WORLD_SCALE, z:2050*WORLD_SCALE, radius:150*WORLD_SCALE, top:WATER_LEVEL+104 },
  { id:'isla_este', x:245*WORLD_SCALE, z:2290*WORLD_SCALE, radius:120*WORLD_SCALE, top:WATER_LEVEL+82 }
];

let game = null;
let installed = false;
let ocean = null;
let hiddenBaseWater = null;
let nextReflectionAt = 0;
let waterReflectionHook = null;
let waterFailed = false;
const lastReflectionCameraPos = new THREE.Vector3(1e9,1e9,1e9);
const lastReflectionCameraQuat = new THREE.Quaternion();
let lastReflectionAt = -Infinity;
let cloudMeshes = [];
let cloudData = [];
let marineGroup = null;
let underwaterGroup = null;
let boatPrompt = null;
let swimPrompt = null;
let overlay = null;
let mainBoat = null;
let npcBoat = null;
let fish = [];
let sharks = [];
let boatCrewMixers = [];
let last = performance.now();
let accumulator = 0;
let safetyAccumulator = 0;
let cloudAccumulator = 0;
let underwaterMode = false;
let originalFog = null;
let originalBackground = null;
let originalUpdateActiveBoat = null;
let originalGetGroundY = null;
const tempA = new THREE.Vector3();
const tempB = new THREE.Vector3();
const tempC = new THREE.Vector3();
const dummy = new THREE.Object3D();
const tempD = new THREE.Vector3();
const lastSafeCharacterPositions = new WeakMap();
const lastSafeVehiclePositions = new WeakMap();
let lastVehicleWaterNoticeAt = -Infinity;
let lastFrameDt = 1 / 60;

function idleTurn(timeout=1000) {
  return new Promise(resolve => {
    if ('requestIdleCallback' in window) requestIdleCallback(() => resolve(),{timeout});
    else setTimeout(resolve,Math.min(timeout,220));
  });
}
function nextFrame(){ return new Promise(resolve => requestAnimationFrame(() => resolve())); }
function notice(text,ms=2600){
  if(!game)return;
  game.currentMessage=text;
  game.updateHUDState?.();
  setTimeout(()=>{if(game.currentMessage===text){game.currentMessage=undefined;game.updateHUDState?.();}},ms);
}

function insideMainBounds(x,z){ return x>=MAIN_BOUNDS.xMin&&x<=MAIN_BOUNDS.xMax&&z>=MAIN_BOUNDS.zMin&&z<=MAIN_BOUNDS.zMax; }
function insideIsland(x,z){ return ISLANDS.some(i => (x-i.x)**2+(z-i.z)**2 <= i.radius*i.radius); }
function onLand(x,z){
  if(insideIsland(x,z))return true;
  return SAFE_SURFACES.some(s => x>=s.xMin&&x<=s.xMax&&z>=s.zMin&&z<=s.zMax);
}

function isOpenWater(x,z,y=WATER_LEVEL){
  if(!insideMainBounds(x,z)||onLand(x,z))return false;
  return !Number.isFinite(y)||y<WATER_LEVEL+18*WORLD_SCALE;
}

function disableWaterGroundRaycast(object){
  if(!object)return;
  const disable=node=>{
    if(!node?.isMesh)return;
    node.userData.gtaManuchoWaterVisual=true;
    node.userData.ignoreGroundRaycast=true;
    node.raycast=()=>{};
  };
  disable(object);
  object.traverse?.(disable);
}

function getWorldPosition(root,target=tempD){
  if(!root)return target.set(0,0,0);
  try{return root.getWorldPosition(target);}catch{return target.copy(root.position);}
}

function setWorldPosition(root,worldPosition){
  if(!root)return;
  if(root.parent){
    tempA.copy(worldPosition);
    try{root.parent.worldToLocal(tempA);}catch{}
    root.position.copy(tempA);
  }else root.position.copy(worldPosition);
}

function rememberSafePosition(root,map){
  if(!root)return;
  const world=getWorldPosition(root,tempD);
  if(!onLand(world.x,world.z)||world.y<WATER_LEVEL+10)return;
  let saved=map.get(root);
  if(!saved){saved={position:new THREE.Vector3(),rotationY:0};map.set(root,saved);}
  saved.position.copy(world);
  saved.rotationY=root.rotation.y;
}

function nearestSafeLandPosition(x,z,vehicle=false){
  let best=null;
  let bestDistance=Infinity;
  const margin=8*WORLD_SCALE;
  for(const surface of SAFE_SURFACES){
    const px=THREE.MathUtils.clamp(x,surface.xMin+margin,surface.xMax-margin);
    const pz=THREE.MathUtils.clamp(z,surface.zMin+margin,surface.zMax-margin);
    const distance=(px-x)**2+(pz-z)**2;
    if(distance<bestDistance){bestDistance=distance;best={x:px,z:pz};}
  }
  for(const island of ISLANDS){
    const dx=x-island.x,dz=z-island.z;
    const length=Math.max(1,Math.hypot(dx,dz));
    const radius=island.radius*.58;
    const px=island.x+dx/length*radius;
    const pz=island.z+dz/length*radius;
    const distance=(px-x)**2+(pz-z)**2;
    if(distance<bestDistance){bestDistance=distance;best={x:px,z:pz};}
  }
  if(!best)best={x:0,z:0};
  let ground=islandGround(best.x,best.z);
  if(!Number.isFinite(ground)){
    try{ground=originalGetGroundY?.(best.x,WATER_LEVEL+3000,best.z,true);}catch{ground=-Infinity;}
  }
  if(!Number.isFinite(ground)||ground<WATER_LEVEL+20)ground=0;
  return new THREE.Vector3(best.x,ground+(vehicle?2.4*WORLD_SCALE:0),best.z);
}

function restoreToSafeLand(root,map,{vehicle=false,entry=null}={}){
  if(!root)return null;
  const current=getWorldPosition(root,tempD);
  const saved=map.get(root);
  const destination=saved?.position?.clone?.()||nearestSafeLandPosition(current.x,current.z,vehicle);
  setWorldPosition(root,destination);
  if(saved)root.rotation.y=saved.rotationY;
  root.rotation.x=0;
  root.rotation.z=0;
  root.visible=true;
  root.updateMatrixWorld?.(true);
  if(entry?.target?.isVector3)entry.target.copy(destination);
  if(entry?.destination?.isVector3)entry.destination.copy(destination);
  return destination;
}
function islandGround(x,z){
  let best=-Infinity;
  for(const island of ISLANDS){
    const d=Math.hypot(x-island.x,z-island.z);
    if(d>island.radius)continue;
    const t=d/island.radius;
    best=Math.max(best,island.top - t*t*54);
  }
  return best;
}

function patchIslandGround(){
  if(game.__v81MarineGroundPatched)return;
  game.__v81MarineGroundPatched=true;
  originalGetGroundY=game.getGroundY.bind(game);
  game.getGroundY=function v81MarineGround(x,y,z,strict=true){
    let base;
    try{base=originalGetGroundY(x,y,z,strict);}catch{base=-Infinity;}
    const islandY=islandGround(x,z);
    if(Number.isFinite(islandY))return Math.max(Number.isFinite(base)?base:-Infinity,islandY);
    return base;
  };
}

function createOcean(){
  // El agua visual no debe formar parte de las colisiones ni de los raycasts de suelo.
  // Esa separación evita que el personaje, los NPC y los coches "caminen" sobre el mar.
  hiddenBaseWater=game.water||null;
  if(hiddenBaseWater){
    try{hiddenBaseWater.visible=false;}catch{}
    disableWaterGroundRaycast(hiddenBaseWater);
  }

  const geometry=new THREE.PlaneGeometry(1000000,1000000,1,1);
  const textureLoader=new THREE.TextureLoader();
  const waterNormals=textureLoader.load(
    './marine-assets/textures/waternormals-official.jpg',
    texture=>{
      texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
      texture.anisotropy=Math.min(4,game.renderer?.capabilities?.getMaxAnisotropy?.()||1);
      texture.needsUpdate=true;
    }
  );

  ocean=new Water(geometry,{
    textureWidth:128,
    textureHeight:128,
    waterNormals,
    sunDirection:(game.sun?.clone?.()||new THREE.Vector3(.4,.8,.2)).normalize(),
    sunColor:0xffffff,
    waterColor:0x001e0f,
    distortionScale:3.7,
    fog:Boolean(game.scene.fog)
  });
  ocean.name='GTA_MANUCHO_OCEANO_WATER_V84';
  ocean.rotation.x=-Math.PI/2;
  ocean.position.y=WATER_LEVEL;
  ocean.frustumCulled=true;
  ocean.receiveShadow=false;
  ocean.castShadow=false;
  ocean.visible=false;
  disableWaterGroundRaycast(ocean);

  waterReflectionHook=ocean.onBeforeRender;
  ocean.onBeforeRender=function throttledWaterReflection(renderer,scene,camera,geometryArg,materialArg,groupArg){
    if(waterFailed||document.hidden||window.__VICE_ZONE_TRANSITION__)return;
    const now=performance.now();
    // Si un fotograma anterior fue pesado, se aplaza el reflejo en vez de provocar un tirón.
    if((game?.lastFrameCostMs||0)>27||lastFrameDt>.042){nextReflectionAt=Math.max(nextReflectionAt,now+900);return;}
    const player=game?.playerContainer?.position;
    const altitude=player?Math.abs(player.y-WATER_LEVEL):0;
    const horizontal=player?Math.hypot(player.x-MARINE_CENTER.x,player.z-MARINE_CENTER.z):0;
    const interval=altitude<420&&horizontal<24000?700:(altitude<1200?1500:3400);
    if(now<nextReflectionAt)return;
    camera.getWorldPosition(tempC);
    const moved=tempC.distanceToSquared(lastReflectionCameraPos)>55*55;
    const turned=1-Math.abs(camera.quaternion.dot(lastReflectionCameraQuat))>.003;
    if(!moved&&!turned&&now-lastReflectionAt<3200)return;
    nextReflectionAt=now+interval;
    lastReflectionAt=now;
    lastReflectionCameraPos.copy(tempC);
    lastReflectionCameraQuat.copy(camera.quaternion);
    const underwaterWasVisible=underwaterGroup?.visible;
    if(underwaterGroup)underwaterGroup.visible=false;
    try{
      waterReflectionHook.call(ocean,renderer,scene,camera,geometryArg,materialArg,groupArg);
    }catch(error){
      waterFailed=true;
      console.warn('[marine-v84] Se desactivó el reflejo del agua por compatibilidad.',error);
      ocean.onBeforeRender=()=>{};
    }finally{
      if(underwaterGroup)underwaterGroup.visible=Boolean(underwaterWasVisible);
    }
  };

  game.scene.add(ocean);

  if(typeof game.setPerformanceSetting==='function'&&!game.__v84WaterSettingsPatched){
    game.__v84WaterSettingsPatched=true;
    const original=game.setPerformanceSetting.bind(game);
    game.setPerformanceSetting=function v84PerformanceSetting(...args){
      const result=original(...args);
      if(this.water&&this.water!==ocean){this.water.visible=false;disableWaterGroundRaycast(this.water);}
      if(ocean&&!ocean.parent)this.scene.add(ocean);
      return result;
    };
  }
}



function createClouds(){
  const texture=new THREE.TextureLoader().load(
    './marine-assets/textures/cloud-alpha-threejs-inspired.png',
    loaded=>{
      loaded.colorSpace=THREE.SRGBColorSpace;
      loaded.wrapS=THREE.ClampToEdgeWrapping;
      loaded.wrapT=THREE.ClampToEdgeWrapping;
      loaded.anisotropy=Math.min(4,game.renderer?.capabilities?.getMaxAnisotropy?.()||1);
      loaded.needsUpdate=true;
    }
  );
  const geometry=new THREE.PlaneGeometry(1,1,1,1);
  const materials=[
    new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:.72,depthWrite:false,alphaTest:.025,fog:true,side:THREE.DoubleSide}),
    new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:.34,depthWrite:false,alphaTest:.018,fog:true,side:THREE.DoubleSide})
  ];
  cloudMeshes=materials.map((material,index)=>{
    const mesh=new THREE.InstancedMesh(geometry,material,18);
    mesh.name=`NUBES_TEXTURIZADAS_REALISTAS_V84_${index}`;
    mesh.frustumCulled=false;
    mesh.renderOrder=-3+index;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    game.scene.add(mesh);
    return mesh;
  });
  const pseudo=index=>{
    const value=Math.sin(index*91.713+17.31)*43758.5453;
    return value-Math.floor(value);
  };
  cloudData=Array.from({length:18},(_,index)=>({
    angle:index/18*Math.PI*2+pseudo(index)*.42,
    radius:4300+pseudo(index+3)*6800,
    height:2100+pseudo(index+8)*1450,
    width:1350+pseudo(index+13)*1900,
    heightScale:380+pseudo(index+21)*500,
    speed:12+pseudo(index+34)*24,
    phase:pseudo(index+55)*18000,
    zOffset:(pseudo(index+89)-.5)*4300
  }));
  updateClouds(0,true);
}



function updateClouds(elapsed,force=false){
  if(!cloudMeshes.length||!game?.playerContainer||!game?.camera)return;
  const player=game.playerContainer.position;
  const cameraQuaternion=game.camera.getWorldQuaternion(new THREE.Quaternion());
  for(let index=0;index<cloudData.length;index++){
    const data=cloudData[index];
    const drift=((elapsed*data.speed+data.phase)%18000)-9000;
    const baseX=player.x+Math.cos(data.angle)*data.radius+drift;
    const baseZ=player.z+Math.sin(data.angle)*data.radius+data.zOffset;
    for(let layer=0;layer<cloudMeshes.length;layer++){
      dummy.position.set(baseX+(layer?data.width*.12:0),data.height+layer*110,baseZ+(layer?-data.width*.08:0));
      dummy.quaternion.copy(cameraQuaternion);
      dummy.scale.set(data.width*(layer?1.18:1),data.heightScale*(layer?.78:1),1);
      dummy.updateMatrix();
      cloudMeshes[layer].setMatrixAt(index,dummy.matrix);
    }
  }
  for(const mesh of cloudMeshes)mesh.instanceMatrix.needsUpdate=true;
}



function createUnderwaterBase(){
  underwaterGroup=new THREE.Group();
  underwaterGroup.name='MUNDO_SUBMARINO_GTA_MANUCHO_V81';
  const sandTexture=new THREE.TextureLoader().load('./marine-assets/textures/sand_diff.jpg');
  sandTexture.wrapS=sandTexture.wrapT=THREE.RepeatWrapping;
  sandTexture.repeat.set(24,24);
  sandTexture.colorSpace=THREE.SRGBColorSpace;
  const floor=new THREE.Mesh(
    new THREE.PlaneGeometry(18000,18000,1,1),
    new THREE.MeshLambertMaterial({map:sandTexture,color:0x8b8870,roughness:1})
  );
  floor.rotation.x=-Math.PI/2;
  floor.position.set(MARINE_CENTER.x,SEA_FLOOR,MARINE_CENTER.z);
  floor.receiveShadow=false;
  floor.matrixAutoUpdate=false;
  floor.updateMatrix();
  underwaterGroup.add(floor);
  game.scene.add(underwaterGroup);
}

function createPhysicalIslands(){
  marineGroup=new THREE.Group();
  marineGroup.name='ISLAS_Y_BARCOS_GTA_MANUCHO';
  const sand=new THREE.MeshLambertMaterial({color:0xb99a60});
  const rock=new THREE.MeshLambertMaterial({color:0x655c4d});
  for(const island of ISLANDS){
    const base=new THREE.Mesh(new THREE.CylinderGeometry(island.radius*.72,island.radius*1.03,250,20),rock);
    base.position.set(island.x,island.top-145,island.z);
    base.scale.y=1;
    base.matrixAutoUpdate=false;base.updateMatrix();
    const top=new THREE.Mesh(new THREE.CylinderGeometry(island.radius*.68,island.radius*.77,36,20),sand);
    top.position.set(island.x,island.top-18,island.z);
    top.matrixAutoUpdate=false;top.updateMatrix();
    marineGroup.add(base,top);
  }
  game.scene.add(marineGroup);
}

function makeShark(index){
  const root=new THREE.Group();
  const mat=new THREE.MeshLambertMaterial({color:index%2?0x5d7181:0x687d88});
  const belly=new THREE.MeshLambertMaterial({color:0xa8b4b8});
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(15,70,5,10),mat);body.rotation.x=Math.PI/2;
  const snout=new THREE.Mesh(new THREE.ConeGeometry(15,28,10),mat);snout.rotation.x=-Math.PI/2;snout.position.z=-52;
  const tailPivot=new THREE.Group();tailPivot.position.z=54;
  const tail=new THREE.Mesh(new THREE.ConeGeometry(25,36,3),mat);tail.rotation.z=Math.PI/2;tail.rotation.x=Math.PI/2;tailPivot.add(tail);
  const fin=new THREE.Mesh(new THREE.ConeGeometry(18,30,3),mat);fin.position.y=14;fin.rotation.z=Math.PI;
  const underside=new THREE.Mesh(new THREE.CapsuleGeometry(10,55,4,8),belly);underside.rotation.x=Math.PI/2;underside.position.y=-8;
  root.add(body,snout,tailPivot,fin,underside);
  root.scale.setScalar(1.35);
  root.userData.tailPivot=tailPivot;
  return root;
}

function setupMesh(root){
  root.traverse(o=>{
    if(!o.isMesh&&!o.isSkinnedMesh)return;
    o.castShadow=false;o.receiveShadow=false;o.frustumCulled=true;
    const mats=Array.isArray(o.material)?o.material:[o.material];
    for(const mat of mats){if(mat&&'roughness'in mat)mat.roughness=Math.max(.5,mat.roughness??.5);}
  });
}

function normalizeCharacter(root,targetHeight=48){
  root.position.set(0,0,0);root.rotation.set(0,0,0);root.scale.set(1,1,1);root.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(root);const size=box.getSize(new THREE.Vector3());
  root.scale.setScalar(targetHeight/Math.max(.01,size.y));root.updateMatrixWorld(true);
  const b=new THREE.Box3().setFromObject(root);const center=b.getCenter(new THREE.Vector3());
  root.position.x-=center.x;root.position.z-=center.z;root.position.y-=b.min.y;root.updateMatrixWorld(true);
}

function loader(){
  const draco=new DRACOLoader();
  draco.setDecoderPath(new URL('./bosque/bike-runtime/libs/draco/',import.meta.url).href);
  draco.setWorkerLimit(1);
  const gltf=new GLTFLoader();gltf.setDRACOLoader(draco);
  return {gltf,draco};
}

async function loadIslandVisuals(){
  const {gltf,draco}=loader();
  try{
    const data=await gltf.loadAsync('./marine-assets/models/island.glb');
    setupMesh(data.scene);
    for(let i=0;i<ISLANDS.length;i++){
      const island=ISLANDS[i];
      const visual=data.scene.clone(true);
      visual.name=`ISLA_ADJUNTA_${i+1}`;
      visual.position.set(island.x,island.top-95,island.z);
      visual.rotation.set(Math.PI/2,-Math.PI+i*.55,0);
      visual.scale.setScalar(i===0?18:14);
      marineGroup.add(visual);
      await nextFrame();
    }
  }catch(error){console.warn('[marine-v81] Isla GLB omitida; permanece la isla física.',error);}finally{draco.dispose();}
}

async function loadPlantsAndRocks(){
  const {gltf,draco}=loader();
  try{
    const [seaweed,seaweedTall,grass,rocks]=await Promise.all([
      gltf.loadAsync('./marine-assets/models/seaweed.glb'),
      gltf.loadAsync('./marine-assets/models/seaweed_tall.glb'),
      gltf.loadAsync('./marine-assets/models/grass.glb'),
      gltf.loadAsync('./marine-assets/models/rocks.glb')
    ]);
    [seaweed.scene,seaweedTall.scene,grass.scene,rocks.scene].forEach(setupMesh);
    const sources=[seaweed.scene,seaweedTall.scene,grass.scene];
    for(let i=0;i<30;i++){
      const source=sources[i%sources.length];
      const plant=source.clone(true);
      const angle=(i/30)*Math.PI*2;
      const radius=900+(i%8)*360;
      plant.position.set(MARINE_CENTER.x+Math.cos(angle)*radius,SEA_FLOOR+2,MARINE_CENTER.z+Math.sin(angle)*radius);
      plant.rotation.y=angle*1.7;
      plant.scale.setScalar(source===grass.scene?1.6+(i%3)*.4:8+(i%5)*2);
      underwaterGroup.add(plant);
      if(i%6===5)await nextFrame();
    }
    for(let i=0;i<10;i++){
      const rock=rocks.scene.clone(true);
      const angle=(i/10)*Math.PI*2+.4;
      const radius=1200+(i%5)*650;
      rock.position.set(MARINE_CENTER.x+Math.cos(angle)*radius,SEA_FLOOR,MARINE_CENTER.z+Math.sin(angle)*radius);
      rock.rotation.y=angle;
      rock.scale.setScalar(22+(i%4)*8);
      underwaterGroup.add(rock);
    }
  }catch(error){console.warn('[marine-v81] Vegetación o rocas incompletas.',error);}finally{draco.dispose();}
}

async function loadFish(){
  const {gltf,draco}=loader();
  try{
    const data=await gltf.loadAsync('./marine-assets/models/fish.glb');
    setupMesh(data.scene);
    for(let i=0;i<12;i++){
      let model;try{model=cloneSkeleton(data.scene);}catch{model=data.scene.clone(true);}
      model.scale.setScalar(10+(i%5)*2.5);
      const angle=(i/12)*Math.PI*2;
      const radius=550+(i%6)*390;
      model.position.set(MARINE_CENTER.x+Math.cos(angle)*radius,WATER_LEVEL-140-(i%5)*110,MARINE_CENTER.z+Math.sin(angle)*radius);
      underwaterGroup.add(model);
      const mixer=data.animations?.length?new THREE.AnimationMixer(model):null;
      mixer?.clipAction(data.animations[0]).play();
      fish.push({model,mixer,angle,radius,speed:.18+(i%4)*.035,height:model.position.y,offset:i*.73});
      if(i%3===2)await nextFrame();
    }
  }catch(error){console.warn('[marine-v81] Peces GLB omitidos.',error);}finally{draco.dispose();}
}

async function loadNavigatorTemplate(){
  const {gltf,draco}=loader();
  try{
    let data;
    try{
      data=await gltf.loadAsync('./marine-assets/models/boat_crew.glb');
    }catch(primaryError){
      console.warn('[marine-v81] NPC de npcbarco.zip no cargó; se usa el navegante de la isla.',primaryError);
      data=await gltf.loadAsync('./marine-assets/models/personaje_navegante.glb');
    }
    setupMesh(data.scene);normalizeCharacter(data.scene,50);
    return {scene:data.scene,animations:data.animations||[]};
  }catch(error){console.warn('[marine-v81] NPC navegante omitido.',error);return null;}finally{draco.dispose();}
}

function createFallbackBoat(){
  const root=new THREE.Group();
  const hull=new THREE.Mesh(new THREE.BoxGeometry(90,24,260),new THREE.MeshLambertMaterial({color:0x6b3d25}));hull.position.y=18;
  const deck=new THREE.Mesh(new THREE.BoxGeometry(76,8,190),new THREE.MeshLambertMaterial({color:0xd2a875}));deck.position.y=34;
  const cabin=new THREE.Mesh(new THREE.BoxGeometry(55,36,70),new THREE.MeshLambertMaterial({color:0xd8e2e8}));cabin.position.set(0,55,35);
  root.add(hull,deck,cabin);return root;
}

async function loadBoatBase(){
  const {gltf,draco}=loader();
  try{
    const data=await gltf.loadAsync('./marine-assets/models/dutch_ship_medium_2k.glb');
    setupMesh(data.scene);
    data.scene.scale.setScalar(15);
    data.scene.rotation.y=Math.PI;
    return data.scene;
  }catch(error){console.warn('[marine-v81] Barco GLB de respaldo activo.',error);return createFallbackBoat();}finally{draco.dispose();}
}

function makeBoatEntry(model,name,x,z,playerDriveable){
  const root=new THREE.Group();
  root.name=name;
  root.userData.v81MarineSafe=true;
  root.userData.v81MarineBoat=true;
  root.add(model);
  root.position.set(x,WATER_LEVEL+3,z);
  root.rotation.y=playerDriveable?Math.PI*.2:-Math.PI*.55;
  game.scene.add(root);
  return {root,speed:0,playerDriveable,angle:Math.random()*Math.PI*2,radius:1900,baseY:WATER_LEVEL+3};
}

async function createBoats(){
  const [base,navigator]=await Promise.all([loadBoatBase(),loadNavigatorTemplate()]);
  mainBoat=makeBoatEntry(base,'BARCO_JUGABLE_GTA_MANUCHO',MARINE_CENTER.x-1200,MARINE_CENTER.z-1300,true);
  const second=base.clone(true);
  npcBoat=makeBoatEntry(second,'BARCO_NPC_GTA_MANUCHO',MARINE_CENTER.x+2100,MARINE_CENTER.z+700,false);
  if(navigator?.scene){
    let driverA,driverB;
    try{driverA=cloneSkeleton(navigator.scene);driverB=cloneSkeleton(navigator.scene);}catch{driverA=navigator.scene.clone(true);driverB=navigator.scene.clone(true);}
    driverA.position.set(0,67,25);driverA.rotation.y=Math.PI;driverA.userData.v81MarineSafe=true;mainBoat.root.add(driverA);
    driverB.position.set(0,67,25);driverB.rotation.y=Math.PI;driverB.userData.v81MarineSafe=true;npcBoat.root.add(driverB);
    for(const driver of [driverA,driverB]){
      if(!navigator.animations?.length)continue;
      const mixer=new THREE.AnimationMixer(driver);
      mixer.clipAction(navigator.animations[0]).play();
      boatCrewMixers.push(mixer);
    }
  }
  window.__V81_MARINE_MARKERS__={
    boat:mainBoat.root,
    npcBoat:npcBoat.root,
    islands:ISLANDS.map(i=>({position:new THREE.Vector3(i.x,i.top,i.z),id:i.id}))
  };
}

function createSharks(){
  for(let i=0;i<3;i++){
    const root=makeShark(i);
    const angle=i/3*Math.PI*2;
    const radius=1300+i*550;
    root.position.set(MARINE_CENTER.x+Math.cos(angle)*radius,WATER_LEVEL-260-i*80,MARINE_CENTER.z+Math.sin(angle)*radius);
    underwaterGroup.add(root);
    sharks.push({root,angle,radius,speed:.10+i*.025,height:root.position.y,phase:i*1.7});
  }
}

function ensureUi(){
  boatPrompt=document.createElement('div');
  boatPrompt.style.cssText='position:fixed;left:50%;bottom:88px;transform:translateX(-50%);z-index:80;padding:10px 18px;border:1px solid #69d9ff;background:rgba(4,12,20,.88);color:#fff;font:900 14px/1.2 "Arial Narrow",Arial,sans-serif;letter-spacing:1.4px;border-radius:8px;display:none;pointer-events:none';
  document.body.appendChild(boatPrompt);
  swimPrompt=document.createElement('div');
  swimPrompt.textContent='MAR · WASD NADAR · CLIC BAJAR · ESPACIO SUBIR';
  swimPrompt.style.cssText='position:fixed;left:50%;bottom:50px;transform:translateX(-50%);z-index:79;padding:8px 14px;background:rgba(0,42,67,.72);border:1px solid rgba(110,226,255,.7);color:#dffaff;font:800 12px Arial;letter-spacing:1px;border-radius:7px;display:none;pointer-events:none';
  document.body.appendChild(swimPrompt);
  overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;z-index:34;pointer-events:none;opacity:0;background:linear-gradient(rgba(0,88,120,.20),rgba(0,26,58,.34));mix-blend-mode:multiply;transition:opacity .25s';
  document.body.appendChild(overlay);
}

function patchBoatController(){
  if(game.__v81BoatControllerPatched)return;
  game.__v81BoatControllerPatched=true;
  originalUpdateActiveBoat=typeof game.updateActiveBoat==='function'?game.updateActiveBoat.bind(game):null;
  game.updateActiveBoat=function v81UpdateBoat(dt,elapsed){
    const root=this.activeBoat;
    const entry=root?.userData?.v81BoatEntry;
    if(!entry)return originalUpdateActiveBoat?.(dt,elapsed);
    dt=Math.min(.05,Math.max(0,dt||0));
    const forward=this.keys.KeyW||this.keys.w||this.keys.ArrowUp;
    const reverse=this.keys.KeyS||this.keys.s||this.keys.ArrowDown;
    const left=this.keys.KeyA||this.keys.a||this.keys.ArrowLeft;
    const right=this.keys.KeyD||this.keys.d||this.keys.ArrowRight;
    if(forward)entry.speed=Math.min(430,entry.speed+250*dt);
    else if(reverse)entry.speed=Math.max(-120,entry.speed-210*dt);
    else entry.speed*=Math.exp(-1.35*dt);
    const steer=(left?1:0)-(right?1:0);
    root.rotation.y+=steer*Math.sign(entry.speed||1)*.78*dt*Math.min(1,.25+Math.abs(entry.speed)/130);
    tempA.set(0,0,-1).applyQuaternion(root.quaternion);
    const nx=root.position.x+tempA.x*entry.speed*dt;
    const nz=root.position.z+tempA.z*entry.speed*dt;
    if(onLand(nx,nz))entry.speed*=-.22;
    else{root.position.x=nx;root.position.z=nz;}
    root.position.y=WATER_LEVEL+3+Math.sin(elapsed*.9)*2.2;
    root.rotation.z=Math.sin(elapsed*.65)*.012;
    root.userData.v81BoatEntry=entry;
    tempB.set(0,72,10);root.localToWorld(tempB);
    this.playerContainer.position.copy(tempB);
    this.playerContainer.rotation.y=root.rotation.y;
    this.state.inWater=false;this.state.isSubmerged=false;this.state.onGround=true;this.state.vy=0;
  };
}

function enterBoat(entry){
  if(!entry||game.activeBoat||game.activeCar||game.activeRiddenHorse)return;
  game.activeBoat=entry.root;
  entry.root.userData.v81BoatEntry=entry;
  entry.speed=0;
  game.boatCamMode=0;
  notice('BARCO · W/S ACELERAR · A/D GIRAR · V CÁMARA · E BAJAR',3500);
}
function exitBoat(){
  const root=game.activeBoat;
  const entry=root?.userData?.v81BoatEntry;
  if(!entry)return false;
  tempA.set(60,8,10);root.localToWorld(tempA);
  game.activeBoat=null;
  game.playerContainer.position.copy(tempA);
  game.playerContainer.position.y=WATER_LEVEL+4;
  game.playerContainer.rotation.y=root.rotation.y;
  game.state.inWater=true;game.state.isSubmerged=false;game.state.onGround=false;game.state.vy=0;
  notice('HAS BAJADO DEL BARCO');
  return true;
}

function nearestBoat(){
  if(!mainBoat?.root||!game?.playerContainer)return null;
  const d=mainBoat.root.position.distanceTo(game.playerContainer.position);
  return d<240?{entry:mainBoat,distance:d}:null;
}

function onKeyDown(event){
  if(event.repeat)return;
  if(event.code==='KeyE'){
    if(exitBoat()){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();return;}
    if(game.activeCar||game.activeBoat||game.activeRiddenHorse)return;
    const near=nearestBoat();
    if(near){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();enterBoat(near.entry);}
  }
}

function updateBoats(dt,elapsed){
  for(const mixer of boatCrewMixers)mixer.update(dt);
  if(mainBoat?.root&&game.activeBoat!==mainBoat.root){
    mainBoat.root.position.y=WATER_LEVEL+3+Math.sin(elapsed*.8)*1.8;
    mainBoat.root.rotation.z=Math.sin(elapsed*.55)*.01;
  }
  if(npcBoat?.root){
    npcBoat.angle+=dt*.055;
    npcBoat.root.position.x=MARINE_CENTER.x+Math.cos(npcBoat.angle)*npcBoat.radius;
    npcBoat.root.position.z=MARINE_CENTER.z+Math.sin(npcBoat.angle)*npcBoat.radius;
    npcBoat.root.position.y=WATER_LEVEL+4+Math.sin(elapsed*.9+npcBoat.angle)*2;
    npcBoat.root.rotation.y=-npcBoat.angle-Math.PI/2;
    npcBoat.root.rotation.z=Math.sin(elapsed*.7)*.012;
  }
}

function updateFishAndSharks(dt,elapsed){
  const player=game?.playerContainer?.position;
  const near=player&&((player.x-MARINE_CENTER.x)**2+(player.z-MARINE_CENTER.z)**2<19000**2||game.state.inWater);
  if(underwaterGroup)underwaterGroup.visible=Boolean(near);
  if(!near)return;
  for(const f of fish){
    f.mixer?.update(dt);
    f.angle+=dt*f.speed;
    f.model.position.x=MARINE_CENTER.x+Math.cos(f.angle)*f.radius;
    f.model.position.z=MARINE_CENTER.z+Math.sin(f.angle)*f.radius;
    f.model.position.y=f.height+Math.sin(elapsed*.9+f.offset)*24;
    f.model.rotation.y=-f.angle+Math.PI/2;
  }
  for(const s of sharks){
    s.angle+=dt*s.speed;
    s.root.position.x=MARINE_CENTER.x+Math.cos(s.angle)*s.radius;
    s.root.position.z=MARINE_CENTER.z+Math.sin(s.angle)*s.radius;
    s.root.position.y=s.height+Math.sin(elapsed*.45+s.phase)*30;
    s.root.rotation.y=-s.angle-Math.PI/2;
    s.root.userData.tailPivot.rotation.y=Math.sin(elapsed*4+s.phase)*.42;
  }
}

function setUnderwaterLook(active){
  if(active===underwaterMode)return;
  underwaterMode=active;
  if(active){
    originalBackground=game.scene.background?.clone?.()||game.scene.background;
    originalFog=game.scene.fog?{color:game.scene.fog.color.clone(),density:game.scene.fog.density}:null;
    game.scene.background=new THREE.Color(0x032f48);
    if(game.scene.fog?.isFogExp2){game.scene.fog.color.setHex(0x07394d);game.scene.fog.density=.00042;}
    overlay.style.opacity='1';
  }else{
    if(originalBackground)game.scene.background=originalBackground;
    if(originalFog&&game.scene.fog?.isFogExp2){game.scene.fog.color.copy(originalFog.color);game.scene.fog.density=originalFog.density;}
    overlay.style.opacity='0';
  }
}

function markDrownedRoot(root,entity){
  // V84: los NPC ya no se ahogan ni desaparecen. Se devuelven a su última zona firme.
  const destination=restoreToSafeLand(root,lastSafeCharacterPositions,{entry:entity});
  if(!destination)return;
  if(entity){
    if(entity.dead===true&&entity.health>0)entity.dead=false;
    if(entity.state!=='dead')entity.state='idle';
    entity.timer=1.2+Math.random()*1.8;
    if(entity.velocity?.set)entity.velocity.set(0,0,0);
  }
}


function clearDrown(root){
  rememberSafePosition(root,lastSafeCharacterPositions);
}



function sweepCharacters(){
  const entries=[];
  for(const entity of window.__CITY_LIFE_SYSTEM__?.entities||[])entries.push(entity);
  for(const officer of game?.crimeWorld?.policeAgents||[])entries.push(officer);
  for(const npc of window.__CITY_NPCS__||[])entries.push(npc);
  for(const npc of window.__V71_EXTRA_NPCS__||[])entries.push(npc);
  for(const npc of game?.npcs||[])entries.push(npc);
  const seen=new Set();
  for(const entity of entries){
    const root=entity?.root||entity?.mesh||entity;
    if(!root||seen.has(root)||!root.visible||root.userData?.v81MarineSafe)continue;
    seen.add(root);
    const world=getWorldPosition(root,tempD);
    if(!insideMainBounds(world.x,world.z))continue;
    if(isOpenWater(world.x,world.z,world.y)&&world.y<WATER_LEVEL+430)markDrownedRoot(root,entity);
    else rememberSafePosition(root,lastSafeCharacterPositions);
  }
}



function sinkCar(entry){
  // V84: ningún coche, patrulla ni tanque puede circular por el agua.
  const root=entry?.root||entry;
  if(!root||root.userData?.v81MarineSafe||!root.visible)return;
  const destination=restoreToSafeLand(root,lastSafeVehiclePositions,{vehicle:true,entry});
  if(!destination)return;
  const zeroNumber=object=>{
    if(!object)return;
    for(const key of ['speed','carSpeed','currentSpeed','targetSpeed','velocityY','steer','steering']){
      if(typeof object[key]==='number')object[key]=0;
    }
    object.velocity?.set?.(0,0,0);
    object.angularVelocity?.set?.(0,0,0);
  };
  zeroNumber(root);zeroNumber(entry);zeroNumber(entry?.driveData);zeroNumber(root.userData);
  if(entry?.target?.isVector3)entry.target.copy(destination);
  if(entry?.waypoint?.isVector3)entry.waypoint.copy(destination);
  const isActive=game.activeCar===root||game.activeCar===entry;
  if(isActive){
    game.playerContainer.position.copy(destination);
    game.playerContainer.rotation.y=root.rotation.y;
    game.state.inWater=false;
    game.state.isSubmerged=false;
    game.state.onGround=false;
    game.state.vy=0;
    const now=performance.now();
    if(now-lastVehicleWaterNoticeAt>2600){lastVehicleWaterNoticeAt=now;notice('LOS VEHÍCULOS NO PUEDEN ENTRAR AL MAR');}
  }
}


function clearCarSink(root){
  rememberSafePosition(root,lastSafeVehiclePositions);
}



function sweepCars(){
  const entries=[];
  for(const car of window.__CUSTOM_CARS__||[])entries.push(car);
  for(const car of window.__CITY_LIFE_SYSTEM__?.serviceVehicles||[])entries.push(car);
  for(const car of window.__CITY_LIFE_SYSTEM__?.trafficVehicles||[])entries.push(car);
  for(const car of game?.trafficCars||[])entries.push(car);
  for(const tank of window.__POLICE_RESPONSE__?.tanks||[])entries.push(tank);
  if(game?.activeCar)entries.push(game.activeCar);
  const seen=new Set();
  for(const entry of entries){
    const root=entry?.root||entry;
    if(!root||seen.has(root)||!root.visible||root.userData?.v81MarineSafe)continue;
    seen.add(root);
    const world=getWorldPosition(root,tempD);
    if(!insideMainBounds(world.x,world.z))continue;
    if(isOpenWater(world.x,world.z,world.y)&&world.y<WATER_LEVEL+500)sinkCar(entry);
    else rememberSafePosition(root,lastSafeVehiclePositions);
  }
}



function hasSwimMovementInput(){
  const keys=game?.keys||{};
  return Boolean(keys.KeyW||keys.w||keys.ArrowUp||keys.KeyS||keys.s||keys.ArrowDown||keys.KeyA||keys.a||keys.ArrowLeft||keys.KeyD||keys.d||keys.ArrowRight);
}

function applySwimPose(elapsed){
  if(!game?.state?.inWater||game.activeBoat||game.activeCar||game.activeRiddenHorse||!game.playerModel)return;
  const moving=hasSwimMovementInput();
  const sprint=Boolean(game.keys?.ShiftLeft||game.keys?.ShiftRight);
  const speed=sprint?6.4:(moving?4.2:1.7);
  const phase=elapsed*speed;
  const targetBody=Math.PI/2+(moving?(game.state.pitch||0)*.75:.04*Math.sin(phase));
  game.playerModel.rotation.x=THREE.MathUtils.lerp(game.playerModel.rotation.x,targetBody,.28);
  game.playerModel.position.y=THREE.MathUtils.lerp(game.playerModel.position.y,Math.sin(phase*1.1)*.8,.2);
  const bones=game.bones||{};
  const blend=(bone,key,value)=>{if(bone?.rotation)bone.rotation[key]=THREE.MathUtils.lerp(bone.rotation[key],value,.34);};
  if(moving){
    blend(bones.armR,'x',1.15+Math.sin(phase)*1.25);
    blend(bones.armL,'x',1.15+Math.sin(phase+Math.PI)*1.25);
    blend(bones.armR,'z',-.35);
    blend(bones.armL,'z',.35);
    blend(bones.leftUp,'x',Math.sin(phase+Math.PI)*.48);
    blend(bones.rightUp,'x',Math.sin(phase)*.48);
    blend(bones.leftLow,'x',.22+Math.max(0,Math.sin(phase))*.5);
    blend(bones.rightLow,'x',.22+Math.max(0,Math.sin(phase+Math.PI))*.5);
  }else{
    const idle=.72+Math.sin(phase)*.25;
    blend(bones.armR,'x',idle);blend(bones.armL,'x',idle);
    blend(bones.armR,'z',-.42+Math.sin(phase)*.12);
    blend(bones.armL,'z',.42-Math.sin(phase)*.12);
    blend(bones.leftUp,'x',Math.sin(phase)*.16);
    blend(bones.rightUp,'x',-Math.sin(phase)*.16);
  }
}

function enforcePlayerSwimming(dt=lastFrameDt,elapsed=performance.now()/1000){
  if(!game?.playerContainer||!game?.state)return false;
  if(game.activeBoat||game.activeCar||game.activeRiddenHorse||game.state.isFlying)return false;
  const position=game.playerContainer.position;
  if(!isOpenWater(position.x,position.z,position.y))return false;
  game.state.inWater=true;
  game.state.onGround=false;
  game.state.isFlying=false;
  game.state.isSubmerged=position.y<WATER_LEVEL-5*WORLD_SCALE;
  const surfaceTop=WATER_LEVEL+4*WORLD_SCALE;
  const bottom=WATER_LEVEL-200*WORLD_SCALE;
  if(position.y>surfaceTop)position.y=THREE.MathUtils.lerp(position.y,surfaceTop,Math.min(1,dt*6));
  if(position.y<bottom){position.y=bottom;game.state.vy=0;}
  game.state.vy=THREE.MathUtils.clamp(Number(game.state.vy)||0,-28*WORLD_SCALE,38*WORLD_SCALE);
  applySwimPose(elapsed);
  return true;
}

function patchPlayerSwimRender(){
  if(!game?.renderer||game.renderer.__gtaManuchoSwimRenderPatched)return;
  game.renderer.__gtaManuchoSwimRenderPatched=true;
  const originalRender=game.renderer.render.bind(game.renderer);
  game.renderer.render=function gtaManuchoRenderWithSwimming(scene,camera){
    enforcePlayerSwimming(lastFrameDt,performance.now()/1000);
    return originalRender(scene,camera);
  };
}

function updatePrompts(){
  if(game.activeBoat?.userData?.v81BoatEntry){boatPrompt.textContent='E · BAJAR DEL BARCO · V · CAMBIAR CÁMARA';boatPrompt.style.display='block';}
  else{
    const near=nearestBoat();
    if(near&&!game.activeCar&&!game.activeRiddenHorse){boatPrompt.textContent=`E · SUBIR AL BARCO · ${Math.round(near.distance)} m`;boatPrompt.style.display='block';}
    else boatPrompt.style.display='none';
  }
  swimPrompt.style.display=game.state.inWater&&!game.activeBoat?'block':'none';
}

function frame(now=performance.now()){
  requestAnimationFrame(frame);
  if(document.hidden||!window.__VICE_CITY_REVEALED__||window.__VICE_ZONE_TRANSITION__){last=now;return;}
  const dt=Math.min(.08,Math.max(0,(now-last)/1000));last=now;lastFrameDt=dt||lastFrameDt;
  enforcePlayerSwimming(dt,now/1000);
  accumulator+=dt;safetyAccumulator+=dt;cloudAccumulator+=dt;
  if(ocean?.material?.uniforms){
    const uniforms=ocean.material.uniforms;
    if(uniforms.time)uniforms.time.value+=Math.min(.05,dt)*.8;
    if(uniforms.eye&&game?.camera){game.camera.getWorldPosition(tempC);uniforms.eye.value.copy(tempC);}
    if(uniforms.sunDirection&&game?.sun)uniforms.sunDirection.value.copy(game.sun).normalize();
  }
  if(accumulator>=UPDATE_STEP){
    const step=Math.min(.12,accumulator);accumulator=0;
    const elapsed=now/1000;
    updateBoats(step,elapsed);updateFishAndSharks(step,elapsed);updatePrompts();
    setUnderwaterLook(Boolean(game.state.isSubmerged));
  }
  if(cloudAccumulator>=.16){cloudAccumulator=0;updateClouds(now/1000);}
  if(safetyAccumulator>=SAFETY_STEP){safetyAccumulator=0;sweepCharacters();sweepCars();}
}



async function prewarmMarineScene(){
  if(!game?.renderer||!ocean)return;
  const renderer=game.renderer;
  const oldTarget=renderer.getRenderTarget?.()||null;
  let target=null;
  try{
    ocean.visible=true;
    if(typeof renderer.compileAsync==='function'){
      try{await renderer.compileAsync(game.scene,game.camera);}catch{}
    }else{
      try{renderer.compile?.(game.scene,game.camera);}catch{}
    }
    target=new THREE.WebGLRenderTarget(32,32,{depthBuffer:true,stencilBuffer:false});
    renderer.setRenderTarget(target);
    renderer.render(game.scene,game.camera);
    await nextFrame();
  }catch(error){
    console.warn('[marine-v84] Precalentamiento marino incompleto.',error);
  }finally{
    try{renderer.setRenderTarget(oldTarget);}catch{}
    try{target?.dispose?.();}catch{}
    ocean.visible=true;
  }
}

async function install(){
  if(installed)return;
  game=window.__VICE_CITY_GAME__;
  if(!game?.scene||!game?.playerContainer||typeof game.getGroundY!=='function')return;
  installed=true;
  patchIslandGround();
  window.__GTA_MANUCHO_OPEN_WATER__=(x,z,y)=>isOpenWater(x,z,y);
  ensureUi();
  createOcean();
  createClouds();
  patchPlayerSwimRender();
  createUnderwaterBase();
  createPhysicalIslands();
  createSharks();
  patchBoatController();
  window.addEventListener('keydown',onKeyDown,true);

  // Los modelos se cargan por turnos y nunca todos en un mismo fotograma.
  await idleTurn(700);await loadIslandVisuals();
  await nextFrame();
  await idleTurn(850);await loadPlantsAndRocks();
  await nextFrame();
  await idleTurn(700);await loadFish();
  await nextFrame();
  await idleTurn(900);await createBoats();
  await prewarmMarineScene();

  window.__V84_MARINE_WORLD__={ocean,marineGroup,underwaterGroup,mainBoat,npcBoat,fish,sharks,islands:ISLANDS,waterLevel:WATER_LEVEL};
  window.__V81_MARINE_WORLD__=window.__V84_MARINE_WORLD__; // alias para compatibilidad
  window.__GTA_MARINE_READY__=true;
  window.dispatchEvent(new CustomEvent('gta-manucho-marine-ready'));
  requestAnimationFrame(frame);
}

const wait=setInterval(()=>{
  game=window.__VICE_CITY_GAME__||game;
  if(!game?.scene||!game?.playerContainer||typeof game.getGroundY!=='function')return;
  clearInterval(wait);
  install().catch(error=>console.error('[marine-v84] Error de instalación.',error));
},150);
setTimeout(()=>clearInterval(wait),30000);
