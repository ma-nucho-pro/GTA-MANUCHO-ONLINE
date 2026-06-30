/**
 * GTA MANUCHO V84 — código del proyecto.
 * Creado e integrado por Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * ARKEA AI / Manucho · conserva LICENSE, NOTICE.md y estos créditos al reutilizar.
 */
import * as THREE from './bosque/libs/three.module.js';
import { GLTFLoader } from './bosque/bike-runtime/loaders/GLTFLoader.js';
import { DRACOLoader } from './bosque/bike-runtime/loaders/DRACOLoader.js';

THREE.Cache.enabled = true;

const WORLD_SCALE = 16;
const HOUSE_LOGICAL = { x: 1900, z: 3720 };
const HOUSE_POS = new THREE.Vector3(HOUSE_LOGICAL.x * WORLD_SCALE, 0, HOUSE_LOGICAL.z * WORLD_SCALE);
const STATE_KEY = 'vice_city_v74_second_girlfriend';
const REWARD = 750;
const ROSE_POINTS = [
  { x:-1120, z:-1180 },
  { x:1180, z:-4320 },
  { x:1760, z:720 },
  { x:-1880, z:1960 }
];

let game = null;
let installed = false;
let root = null;
let roof = null;
let door = null;
let insideDoor = null;
let prompt = null;
let noticeNode = null;
let inside = false;
let savedOutside = null;
let carrying = false;
let carriedBouquet = null;
let kira = null;
let kiraLoading = null;
let lastCheck = 0;
const roses = [];

function groundAt(x,z,fallback=0){
  try{
    const y=game?.getGroundY?.(x,fallback+900,z,false);
    return Number.isFinite(y)?y:fallback;
  }catch{return fallback;}
}

function loadState(){
  try{
    const value=JSON.parse(localStorage.getItem(STATE_KEY)||'null');
    return value&&typeof value==='object'?value:{deliveries:0,carrying:false};
  }catch{return {deliveries:0,carrying:false};}
}
const state=loadState();
carrying=Boolean(state.carrying);

function saveState(){
  try{localStorage.setItem(STATE_KEY,JSON.stringify({deliveries:Number(state.deliveries||0),carrying}));}catch{}
}

function showNotice(text,duration=2400){
  if(!noticeNode){
    noticeNode=document.createElement('div');
    noticeNode.id='second-girlfriend-notice';
    noticeNode.style.cssText='position:fixed;left:50%;bottom:62px;transform:translateX(-50%);z-index:28000;display:none;padding:11px 17px;border-radius:10px;background:rgba(35,7,24,.95);border:1px solid #ff72b9;color:#fff;font:900 13px Arial;letter-spacing:.045em;pointer-events:none;box-shadow:0 12px 36px #0009';
    document.body.appendChild(noticeNode);
  }
  noticeNode.textContent=text;
  noticeNode.style.display='block';
  clearTimeout(noticeNode._timer);
  noticeNode._timer=setTimeout(()=>noticeNode.style.display='none',duration);
}

function ensurePrompt(){
  prompt=document.createElement('div');
  prompt.id='second-girlfriend-prompt';
  prompt.style.cssText='position:fixed;left:50%;bottom:112px;transform:translateX(-50%);z-index:27900;display:none;padding:10px 15px;border-radius:8px;background:rgba(34,7,25,.94);border:1px solid #ff72b9;color:#fff;font:900 12px Arial;letter-spacing:.055em;pointer-events:none;box-shadow:0 8px 28px #0009';
  document.body.appendChild(prompt);
}

function heartTexture(){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
  const c=canvas.getContext('2d');
  c.fillStyle='#351025';c.fillRect(0,0,512,256);
  c.strokeStyle='#ff75bb';c.lineWidth=12;c.strokeRect(8,8,496,240);
  c.fillStyle='#ff5f9f';c.beginPath();c.moveTo(256,205);
  c.bezierCurveTo(70,95,145,20,256,88);c.bezierCurveTo(367,20,442,95,256,205);c.fill();
  c.fillStyle='#fff';c.textAlign='center';c.font='900 38px Arial';c.fillText('CASA DE MI NOVIA',256,56);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=2;return texture;
}

function makeBouquet(scale=1){
  const group=new THREE.Group();
  const stemMat=new THREE.MeshLambertMaterial({color:0x2e7d45});
  const leafMat=new THREE.MeshLambertMaterial({color:0x3f9855});
  const flowerMat=new THREE.MeshLambertMaterial({color:0xe62f55,emissive:0x35040e,emissiveIntensity:.15});
  const centerMat=new THREE.MeshLambertMaterial({color:0xffcc57});
  for(let i=0;i<7;i++){
    const angle=i*Math.PI*2/7;
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(.65*scale,.9*scale,18*scale,6),stemMat);
    stem.position.set(Math.cos(angle)*2.2*scale,8.5*scale,Math.sin(angle)*2.2*scale);
    stem.rotation.z=(Math.random()-.5)*.12;group.add(stem);
    const flower=new THREE.Group();
    flower.position.set(Math.cos(angle)*3.1*scale,18*scale+Math.sin(i)*1.2*scale,Math.sin(angle)*3.1*scale);
    for(let p=0;p<6;p++){
      const petal=new THREE.Mesh(new THREE.SphereGeometry(2.4*scale,7,5),flowerMat);
      const a=p*Math.PI*2/6;petal.position.set(Math.cos(a)*2.1*scale,0,Math.sin(a)*2.1*scale);petal.scale.set(1,.5,1);flower.add(petal);
    }
    flower.add(new THREE.Mesh(new THREE.SphereGeometry(1.4*scale,7,5),centerMat));group.add(flower);
    if(i%2===0){
      const leaf=new THREE.Mesh(new THREE.SphereGeometry(2.4*scale,6,4),leafMat);
      leaf.scale.set(.45,1.8,.65);leaf.position.set(Math.cos(angle)*4*scale,7*scale,Math.sin(angle)*4*scale);leaf.rotation.z=angle;group.add(leaf);
    }
  }
  const wrap=new THREE.Mesh(new THREE.ConeGeometry(6*scale,10*scale,8,1,true),new THREE.MeshLambertMaterial({color:0xf2d0df,side:THREE.DoubleSide}));
  wrap.position.y=6*scale;wrap.rotation.x=Math.PI;group.add(wrap);
  group.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;o.frustumCulled=true;}});
  return group;
}

function buildHouse(){
  const x=HOUSE_POS.x,z=HOUSE_POS.z,y=groundAt(x,z,0);HOUSE_POS.y=y;
  const g=new THREE.Group();g.name='SECOND_GIRLFRIEND_HOUSE_V74';g.position.set(x,y,z);
  const wall=new THREE.MeshLambertMaterial({color:0xf0c4d6});
  const trim=new THREE.MeshLambertMaterial({color:0xfff4f8});
  const roofMat=new THREE.MeshLambertMaterial({color:0x6c2449});
  const glass=new THREE.MeshLambertMaterial({color:0x9ed7e5,transparent:true,opacity:.62});
  const floorTexture=new THREE.TextureLoader().load('./second-girlfriend-assets/rose-floor-diffuse.jpg');
  floorTexture.colorSpace=THREE.SRGBColorSpace;floorTexture.wrapS=floorTexture.wrapT=THREE.RepeatWrapping;floorTexture.repeat.set(6,5);
  const floorMat=new THREE.MeshLambertMaterial({map:floorTexture,color:0xdadada});

  const floor=new THREE.Mesh(new THREE.BoxGeometry(300,5,230),floorMat);floor.position.y=2.5;
  const back=new THREE.Mesh(new THREE.BoxGeometry(300,125,12),wall);back.position.set(0,62,-109);
  const left=new THREE.Mesh(new THREE.BoxGeometry(12,125,220),wall);left.position.set(-144,62,0);
  const right=left.clone();right.position.x=144;
  const frontL=new THREE.Mesh(new THREE.BoxGeometry(108,125,12),wall);frontL.position.set(-96,62,109);
  const frontR=frontL.clone();frontR.position.x=96;
  roof=new THREE.Mesh(new THREE.BoxGeometry(316,10,246),roofMat);roof.position.y=132;
  const porch=new THREE.Mesh(new THREE.BoxGeometry(100,6,70),trim);porch.position.set(0,3,144);
  const doorGlow=new THREE.Mesh(new THREE.PlaneGeometry(70,100),new THREE.MeshBasicMaterial({color:0xff78b8,transparent:true,opacity:.22,side:THREE.DoubleSide}));doorGlow.position.set(0,52,116);doorGlow.rotation.y=Math.PI;
  g.add(floor,back,left,right,frontL,frontR,roof,porch,doorGlow);

  for(const px of [-94,94]){
    const win=new THREE.Mesh(new THREE.PlaneGeometry(58,55),glass);win.position.set(px,75,116);win.rotation.y=Math.PI;g.add(win);
  }
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(155,77),new THREE.MeshBasicMaterial({map:heartTexture(),toneMapped:false,side:THREE.DoubleSide}));
  sign.position.set(0,172,112);sign.rotation.y=Math.PI;g.add(sign);

  const sofa=new THREE.Mesh(new THREE.BoxGeometry(92,28,38),new THREE.MeshLambertMaterial({color:0x8d315d}));sofa.position.set(-70,18,-55);g.add(sofa);
  const table=new THREE.Mesh(new THREE.CylinderGeometry(30,34,18,12),new THREE.MeshLambertMaterial({color:0x8a5b45}));table.position.set(45,10,-22);g.add(table);
  const lamp=new THREE.PointLight(0xff9bc7,1.4,280);lamp.position.set(0,104,0);g.add(lamp);

  g.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;o.frustumCulled=true;}});
  game.city.add(g);root=g;
  door=new THREE.Vector3(x,y+3,z+164);
  insideDoor=new THREE.Vector3(x,y+3,z+78);

  if(typeof game.addObstacle==='function'){
    game.addObstacle(x,z-109,300,12,125,y);
    game.addObstacle(x-144,z,12,220,125,y);
    game.addObstacle(x+144,z,12,220,125,y);
    game.addObstacle(x-96,z+109,108,12,125,y);
    game.addObstacle(x+96,z+109,108,12,125,y);
  }
}

async function loadGirlfriend(){
  if(kira||kiraLoading)return kiraLoading;
  kiraLoading=(async()=>{
    try{
      const draco=new DRACOLoader();
      const loader=new GLTFLoader();
      loader.setDRACOLoader(draco);
      const gltf=await loader.loadAsync('./second-girlfriend-assets/kira.glb');
      draco.dispose?.();
      const model=gltf.scene;model.updateMatrixWorld(true);
      const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3());
      model.scale.setScalar(62/Math.max(.001,size.y));model.updateMatrixWorld(true);
      const box2=new THREE.Box3().setFromObject(model);
      const floorLift=-box2.min.y;
      model.position.set(38,5+floorLift,-45);model.rotation.y=-.55;
      model.traverse(o=>{if(o.isMesh||o.isSkinnedMesh){o.castShadow=false;o.receiveShadow=true;o.frustumCulled=true;}});
      root.add(model);kira=model;
    }catch(error){console.warn('[second-girlfriend] No se pudo cargar Kira.',error);}
    return kira;
  })();
  return kiraLoading;
}

function spawnRoses(){
  for(let i=0;i<ROSE_POINTS.length;i++){
    const p=ROSE_POINTS[i],x=p.x*WORLD_SCALE,z=p.z*WORLD_SCALE,y=groundAt(x,z,0);
    const bouquet=makeBouquet(1.25);bouquet.position.set(x,y+2,z);bouquet.userData.baseY=y+2;bouquet.userData.phase=i*1.3;
    game.city.add(bouquet);roses.push({root:bouquet,collected:false});
    if(carrying)bouquet.visible=false;
  }
}

function setCarriedVisual(){
  if(carriedBouquet){carriedBouquet.parent?.remove(carriedBouquet);carriedBouquet=null;}
  if(!carrying||!game?.playerContainer)return;
  carriedBouquet=makeBouquet(.58);carriedBouquet.position.set(14,30,3);carriedBouquet.rotation.z=-.45;game.playerContainer.add(carriedBouquet);
}

function nearestRose(max=80){
  if(carrying)return null;let best=null,bestSq=max*max;
  for(const rose of roses){
    if(!rose.root.visible)continue;
    const d=rose.root.position.distanceToSquared(game.playerContainer.position);
    if(d<bestSq){best=rose;bestSq=d;}
  }
  return best;
}

function near(pos,max=115){return Boolean(pos&&game.playerContainer.position.distanceToSquared(pos)<=max*max);}

function collectRose(rose){
  if(!rose)return;
  for(const item of roses){item.root.visible=false;}
  rose.collected=true;carrying=true;saveState();setCarriedVisual();showNotice('RAMO DE ROSAS GUARDADO · LLÉVALO A LA CASA CON EL CORAZÓN',3200);
}

function deliver(){
  if(!carrying)return false;
  carrying=false;state.deliveries=Number(state.deliveries||0)+1;saveState();setCarriedVisual();
  game.money=Math.max(0,Number(game.money||0)+REWARD);game.updateHUDState?.();
  showNotice(`RAMO ENTREGADO · GANASTE $${REWARD}`,3600);
  setTimeout(()=>{for(const rose of roses){rose.root.visible=true;rose.collected=false;}},60000);
  return true;
}

function enterHouse(){
  if(game.activeCar||game.activeBoat||window.__CUSTOM_CAR_SYSTEM__?.active){showNotice('BAJA DEL VEHÍCULO PARA ENTRAR');return;}
  savedOutside={x:game.playerContainer.position.x,y:game.playerContainer.position.y,z:game.playerContainer.position.z,yaw:game.playerContainer.rotation.y||0};
  deliver();inside=true;roof.visible=false;
  game.playerContainer.position.copy(insideDoor);game.playerContainer.rotation.y=Math.PI;
  game.state.vy=0;game.state.onGround=true;game.state.inWater=false;
  loadGirlfriend();
}

function exitHouse(){
  inside=false;roof.visible=true;
  if(savedOutside){
    game.playerContainer.position.set(savedOutside.x,savedOutside.y,savedOutside.z);
    game.playerContainer.rotation.y=savedOutside.yaw;
  }else game.playerContainer.position.copy(door);
  game.state.vy=0;game.state.onGround=true;game.state.inWater=false;
}

function onKey(event){
  if(event.code!=='KeyE'||event.repeat)return;
  const rose=nearestRose();
  if(rose){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();collectRose(rose);return;}
  if(!inside&&near(door)){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();enterHouse();return;}
  if(inside&&near(insideDoor,90)){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();exitHouse();}
}

function update(now){
  if(now-lastCheck<110)return;lastCheck=now;
  for(const rose of roses){
    if(!rose.root.visible)continue;
    rose.root.rotation.y+=.08;
    rose.root.position.y=rose.root.userData.baseY+Math.sin(now*.003+rose.root.userData.phase)*3;
  }
  const rose=nearestRose();
  if(rose){prompt.textContent='E · RECOGER RAMO DE ROSAS';prompt.style.display='block';return;}
  if(!inside&&near(door)){prompt.textContent=carrying?'E · ENTREGAR ROSAS Y ENTRAR':'E · ENTRAR A CASA DE TU NOVIA';prompt.style.display='block';return;}
  if(inside&&near(insideDoor,90)){prompt.textContent='E · SALIR DE LA CASA';prompt.style.display='block';return;}
  prompt.style.display='none';
}

function loop(now=performance.now()){requestAnimationFrame(loop);if(document.hidden)return;update(now);}

function install(){
  if(installed)return;game=window.__VICE_CITY_GAME__;
  if(!game?.city||!game?.playerContainer)return;installed=true;ensurePrompt();buildHouse();spawnRoses();setCarriedVisual();
  window.addEventListener('keydown',onKey,true);
  window.__SECOND_GIRLFRIEND_HOUSE__={root,door,roses,state,get carrying(){return carrying;}};
  window.dispatchEvent(new CustomEvent('second-girlfriend-house-ready'));
  if('requestIdleCallback'in window)requestIdleCallback(()=>loadGirlfriend(),{timeout:12000});else setTimeout(()=>loadGirlfriend(),9000);
  requestAnimationFrame(loop);
}

const wait=setInterval(()=>{game=window.__VICE_CITY_GAME__||game;if(!game?.city||!game?.playerContainer)return;clearInterval(wait);install();},180);
setTimeout(()=>clearInterval(wait),30000);
