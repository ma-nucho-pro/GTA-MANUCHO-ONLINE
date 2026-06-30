/**
 * GTA MANUCHO V84 — código del proyecto.
 * Creado e integrado por Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * ARKEA AI / Manucho · conserva LICENSE, NOTICE.md y estos créditos al reutilizar.
 */
import * as THREE from './bosque/libs/three.module.js';
import { GLTFLoader } from './bosque/bike-runtime/loaders/GLTFLoader.js';
import { DRACOLoader } from './bosque/bike-runtime/loaders/DRACOLoader.js';
import { clone as cloneSkeleton } from './bosque/bike-runtime/utils/SkeletonUtils.js';

THREE.Cache.enabled = true;

// GTA MANUCHO V82 · mar, nubes, islas, barcos y vida submarina.
// Adaptación ligera de los ejemplos adjuntos de nubes volumétricas y océano:
// no usa postprocesado ni cálculos por píxel en CPU y reparte la carga de GLB.

const WORLD_SCALE = 16;
const WATER_LEVEL = -14 * WORLD_SCALE;
const SEA_FLOOR = WATER_LEVEL - 900;
const MARINE_CENTER = new THREE.Vector3(0, WATER_LEVEL, 2080 * WORLD_SCALE);
const UPDATE_STEP = 1 / 12;
const SAFETY_STEP = .28;
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
let cloudMeshes = [];
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
const drownTimers = new WeakMap();
const carSinkTimers = new WeakMap();

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
  if(game.water?.parent){ try{game.water.visible=false;}catch{} }
  const geometry=new THREE.PlaneGeometry(1000000,1000000,40,40);
  const textureLoader=new THREE.TextureLoader();
  const waterNormal=textureLoader.load('./marine-assets/textures/waternormals-v82.jpg');
  const foamTexture=textureLoader.load('./marine-assets/textures/foam.jpg');
  for(const texture of [waterNormal,foamTexture]){
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
    texture.anisotropy=Math.min(4,game.renderer?.capabilities?.getMaxAnisotropy?.()||1);
  }
  foamTexture.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.ShaderMaterial({
    uniforms:{
      time:{value:0},
      deep:{value:new THREE.Color(0x063f64)},
      shallow:{value:new THREE.Color(0x1b9ac2)},
      foam:{value:new THREE.Color(0xb8eff4)},
      waterNormal:{value:waterNormal},
      foamTexture:{value:foamTexture}
    },
    vertexShader:`
      uniform float time;
      varying float vWave;
      varying vec2 vUv2;
      void main(){
        vec3 p=position;
        float w1=sin((p.x+time*58.0)*0.00052)*4.0;
        float w2=cos((p.y-time*43.0)*0.00068)*3.2;
        float w3=sin((p.x+p.y+time*31.0)*0.00031)*2.2;
        p.z=w1+w2+w3;
        vWave=(w1+w2+w3)/9.4;
        vUv2=uv;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
      }
    `,
    fragmentShader:`
      uniform vec3 deep;
      uniform vec3 shallow;
      uniform vec3 foam;
      uniform float time;
      uniform sampler2D waterNormal;
      uniform sampler2D foamTexture;
      varying float vWave;
      varying vec2 vUv2;
      void main(){
        vec2 flowA=vUv2*210.0+vec2(time*0.010,time*0.006);
        vec2 flowB=vUv2*137.0+vec2(-time*0.007,time*0.009);
        vec2 flowC=vUv2*360.0+vec2(time*0.004,-time*0.006);
        vec3 nA=texture2D(waterNormal,flowA).xyz*2.0-1.0;
        vec3 nB=texture2D(waterNormal,flowB).xyz*2.0-1.0;
        vec3 nC=texture2D(waterNormal,flowC).xyz*2.0-1.0;
        float ripple=clamp((nA.x+nA.y+nB.x+nB.y)*0.18,-0.34,0.34);
        float detail=clamp((nC.x+nC.y)*0.5+0.5,0.0,1.0);
        float bands=sin((vUv2.x+vUv2.y)*330.0+time*1.05)*0.5+0.5;
        float foamMask=texture2D(foamTexture,vUv2*76.0+vec2(time*0.003,-time*0.002)).r;
        float crest=smoothstep(0.48,0.94,vWave*0.5+0.5+ripple)*mix(.48,1.0,foamMask)*bands;
        float streak=smoothstep(0.58,0.90,detail+ripple*0.42);
        vec3 base=mix(deep,shallow,clamp(vWave*0.23+0.54+ripple,0.0,1.0));
        base+=vec3(0.015,0.080,0.115)*streak;
        base=mix(base,foam,crest*0.34);
        gl_FragColor=vec4(base,1.0);
      }
    `,
    side:THREE.DoubleSide,
    fog:true
  });
  ocean=new THREE.Mesh(geometry,material);
  ocean.name='GTA_MANUCHO_OCEANO_V81';
  ocean.rotation.x=-Math.PI/2;
  ocean.position.y=WATER_LEVEL;
  ocean.frustumCulled=true;
  ocean.receiveShadow=false;
  game.scene.add(ocean);
  game.water=ocean;
}

function createClouds(){
  const geometry=new THREE.IcosahedronGeometry(1,1);
  const materials=[
    new THREE.MeshBasicMaterial({color:0xf3f6fb,transparent:true,opacity:.50,depthWrite:false,fog:true}),
    new THREE.MeshBasicMaterial({color:0xdde7f1,transparent:true,opacity:.40,depthWrite:false,fog:true}),
    new THREE.MeshBasicMaterial({color:0xc9d5e2,transparent:true,opacity:.28,depthWrite:false,fog:true})
  ];
  cloudMeshes=materials.map((material,index)=>{
    const mesh=new THREE.InstancedMesh(geometry,material,26);
    mesh.name=`NUBES_VOLUMETRICAS_LIGERAS_${index}`;
    mesh.frustumCulled=false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    game.scene.add(mesh);
    return mesh;
  });
  updateClouds(0,true);
}

function updateClouds(elapsed,force=false){
  if(!cloudMeshes.length||!game?.playerContainer)return;
  const p=game.playerContainer.position;
  for(let i=0;i<26;i++){
    const seed=i*97.13;
    const angle=(i/26)*Math.PI*2+seed*.001;
    const radius=2600+(i%7)*850;
    const drift=(elapsed*5.5+i*310)%9000;
    const x=p.x+Math.cos(angle)*radius+drift-4500;
    const z=p.z+Math.sin(angle)*radius+(i%3-1)*1200;
    const y=1850+(i%6)*210;
    const sx=310+(i%5)*75;
    const sy=75+(i%4)*18;
    const sz=190+(i%6)*45;
    for(let layer=0;layer<cloudMeshes.length;layer++){
      dummy.position.set(x+(layer-1)*sx*.38,y+layer*20,z+(1-layer)*sz*.25);
      dummy.rotation.set(0,angle*.25,0);
      dummy.scale.set(sx*(1-layer*.08),sy*(1-layer*.06),sz*(1+layer*.05));
      dummy.updateMatrix();
      cloudMeshes[layer].setMatrixAt(i,dummy.matrix);
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
  if(!root||root.userData?.v81MarineSafe)return;
  const now=performance.now();
  let started=drownTimers.get(root);
  if(!started){drownTimers.set(root,now);started=now;}
  const age=now-started;
  root.position.y-=age>650?10:3;
  root.rotation.z+=.06;
  if(age>1350){
    if(entity){entity.dead=true;entity.health=0;entity.state='dead';}
    root.visible=false;
    drownTimers.delete(root);
  }
}
function clearDrown(root){if(root)drownTimers.delete(root);}

function sweepCharacters(){
  const entities=window.__CITY_LIFE_SYSTEM__?.entities||[];
  for(const entity of entities){
    const root=entity?.root;
    if(!root||entity.dead||!root.visible||root.userData?.v81MarineSafe)continue;
    const p=root.position;
    if(!insideMainBounds(p.x,p.z)){clearDrown(root);continue;}
    if(!onLand(p.x,p.z)&&p.y<WATER_LEVEL+430)markDrownedRoot(root,entity);else clearDrown(root);
  }
  for(const officer of game?.crimeWorld?.policeAgents||[]){
    const root=officer?.root;if(!root||!root.visible||officer.state==='dead')continue;
    const p=root.position;if(insideMainBounds(p.x,p.z)&&!onLand(p.x,p.z)&&p.y<WATER_LEVEL+430)markDrownedRoot(root,officer);else clearDrown(root);
  }
  for(const npc of window.__CITY_NPCS__||[]){
    const root=npc?.root;if(!root||!root.visible)continue;
    const p=root.position;if(insideMainBounds(p.x,p.z)&&!onLand(p.x,p.z)&&p.y<WATER_LEVEL+430)markDrownedRoot(root,npc);else clearDrown(root);
  }
}

function sinkCar(entry){
  const root=entry?.root||entry;if(!root||root.userData?.v81MarineSafe||!root.visible)return;
  const now=performance.now();let started=carSinkTimers.get(root);
  if(!started){carSinkTimers.set(root,now);started=now;}
  if(game.activeCar===root){
    try{window.__CUSTOM_CAR_SYSTEM__?.exit?.();}catch{}
    game.activeCar=null;
    game.playerContainer.position.set(root.position.x,WATER_LEVEL+4,root.position.z);
    game.state.inWater=true;game.state.isSubmerged=false;game.state.vy=0;
  }
  entry.autopilot=false;
  root.carSpeed=0;
  root.position.y-=14;
  root.rotation.z+=.045;
  if(now-started>1700){root.visible=false;root.userData.v81Sunk=true;carSinkTimers.delete(root);}
}
function clearCarSink(root){if(root)carSinkTimers.delete(root);}

function sweepCars(){
  const roots=[];
  for(const car of window.__CUSTOM_CARS__||[])roots.push(car);
  for(const car of window.__CITY_LIFE_SYSTEM__?.serviceVehicles||[])roots.push(car);
  const seen=new Set();
  for(const entry of roots){
    const root=entry?.root||entry;if(!root||seen.has(root)||!root.visible)continue;seen.add(root);
    const p=root.position;
    if(!insideMainBounds(p.x,p.z)){clearCarSink(root);continue;}
    if(!onLand(p.x,p.z)&&p.y<WATER_LEVEL+430)sinkCar(entry);else clearCarSink(root);
  }
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
  if(document.hidden||window.__VICE_ZONE_TRANSITION__){last=now;return;}
  const dt=Math.min(.08,Math.max(0,(now-last)/1000));last=now;
  accumulator+=dt;safetyAccumulator+=dt;cloudAccumulator+=dt;
  if(ocean?.material?.uniforms?.time)ocean.material.uniforms.time.value=now/1000;
  if(accumulator>=UPDATE_STEP){
    const step=Math.min(.12,accumulator);accumulator=0;
    const elapsed=now/1000;
    updateBoats(step,elapsed);updateFishAndSharks(step,elapsed);updatePrompts();
    setUnderwaterLook(Boolean(game.state.isSubmerged));
  }
  if(cloudAccumulator>=.45){cloudAccumulator=0;updateClouds(now/1000);}
  if(safetyAccumulator>=SAFETY_STEP){safetyAccumulator=0;sweepCharacters();sweepCars();}
}

async function install(){
  if(installed)return;
  game=window.__VICE_CITY_GAME__;
  if(!game?.scene||!game?.playerContainer||typeof game.getGroundY!=='function')return;
  installed=true;
  patchIslandGround();
  ensureUi();
  createOcean();
  createClouds();
  createUnderwaterBase();
  createPhysicalIslands();
  createSharks();
  patchBoatController();
  window.addEventListener('keydown',onKeyDown,true);

  // Los modelos se cargan por turnos y nunca todos en un mismo fotograma.
  await idleTurn(1200);await loadIslandVisuals();
  await idleTurn(1400);await loadPlantsAndRocks();
  await idleTurn(1200);await loadFish();
  await idleTurn(1500);await createBoats();

  window.__V81_MARINE_WORLD__={ocean,marineGroup,underwaterGroup,mainBoat,npcBoat,fish,sharks,islands:ISLANDS,waterLevel:WATER_LEVEL};
  window.dispatchEvent(new CustomEvent('gta-manucho-marine-ready'));
  requestAnimationFrame(frame);
}

const wait=setInterval(()=>{
  game=window.__VICE_CITY_GAME__||game;
  if(!game?.scene||!game?.playerContainer||typeof game.getGroundY!=='function')return;
  clearInterval(wait);
  install().catch(error=>console.error('[marine-v81] Error de instalación.',error));
},150);
setTimeout(()=>clearInterval(wait),30000);
