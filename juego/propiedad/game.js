import * as THREE from '../bosque/libs/three.module.js';
import { GLTFLoader } from '../bosque/bike-runtime/loaders/GLTFLoader.js';

THREE.Cache.enabled = true;

const SAVE_FORMAT = 'VICE_CITY_OFFLINE_SAVE';
const SAVE_VERSION = 70;
const PENDING_LOAD_KEY = 'vice_city_v70_pending_loaded_save';
const RETURN_KEY = 'vice_city_v70_property_return';
const params = new URLSearchParams(location.search);
const propertyId = ['galeria','villa_piscina','residencia'].includes(params.get('id')) ? params.get('id') : 'galeria';
const info = {
  galeria:{name:'GALERÍA PRIVADA',accent:0x438cff,bounds:{x:17,z:12},spawn:new THREE.Vector3(0,0,8.5)},
  villa_piscina:{name:'VILLA CON PISCINA',accent:0x22b8e8,bounds:{x:20,z:15},spawn:new THREE.Vector3(0,0,11)},
  residencia:{name:'RESIDENCIA MODERNA',accent:0x4a79ff,bounds:{x:18,z:13},spawn:new THREE.Vector3(0,0,9.5)}
}[propertyId];

const ui = {
  loading:document.getElementById('loading'),title:document.getElementById('title'),camera:document.getElementById('camera'),
  prompt:document.getElementById('prompt'),notice:document.getElementById('notice'),exit:document.getElementById('exit'),
  load:document.getElementById('load'),file:document.getElementById('file')
};
ui.title.textContent = info.name;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1119);
scene.fog = new THREE.Fog(0x0b1119, 24, 90);
const camera = new THREE.PerspectiveCamera(66, innerWidth/innerHeight, .04, 150);
const renderer = new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance',stencil:false,preserveDrawingBuffer:false});
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = false;
document.body.prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xdbeaff,0x2b2422,1.9));
const sun = new THREE.DirectionalLight(0xffffff,2.2);sun.position.set(8,16,6);scene.add(sun);
const warm = new THREE.PointLight(0xffc98f,25,30,2);warm.position.set(-5,4,3);scene.add(warm);

const player={position:info.spawn.clone(),yaw:Math.PI,pitch:-.08,vy:0,onGround:true};
const keys=Object.create(null);
const obstacles=[];
let cameraMode='third';
let avatar=null,mixer=null,actions={},currentAction='idle';
let floppy=null,exitPoint=new THREE.Vector3(0,0,info.bounds.z-1.2);
let nearestAction=null;
let last=performance.now(),uiAccumulator=0;
const tempA=new THREE.Vector3(),tempB=new THREE.Vector3();

function box(size,pos,material,collidable=true){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),material);mesh.position.set(...pos);mesh.castShadow=false;mesh.receiveShadow=true;scene.add(mesh);
  if(collidable)obstacles.push({minX:pos[0]-size[0]/2,maxX:pos[0]+size[0]/2,minZ:pos[2]-size[2]/2,maxZ:pos[2]+size[2]/2});
  return mesh;
}
function mat(color,opts={}){return new THREE.MeshStandardMaterial({color,roughness:opts.roughness??.85,metalness:opts.metalness??.02,transparent:Boolean(opts.transparent),opacity:opts.opacity??1,side:opts.side??THREE.FrontSide});}
function addRoomShell(width,depth,wallMaterial,floorMaterial){
  box([width,.25,depth],[0,-.13,0],floorMaterial,false);
  box([width,4.8,.35],[0,2.4,-depth/2],wallMaterial,false);
  box([.35,4.8,depth],[-width/2,2.4,0],wallMaterial,false);
  box([.35,4.8,depth],[width/2,2.4,0],wallMaterial,false);
  box([width/2-1.4,4.8,.35],[-width/4-.7,2.4,depth/2],wallMaterial,false);
  box([width/2-1.4,4.8,.35],[width/4+.7,2.4,depth/2],wallMaterial,false);
  box([width,0.22,depth],[0,4.85,0],mat(0x191f29),false);
}
function createFloppy(){
  const group=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(1.15,1.36,.24),mat(0x070b12,{roughness:.65}));
  const label=new THREE.Mesh(new THREE.BoxGeometry(.78,.43,.07),mat(info.accent,{roughness:.45}));label.position.set(0,.28,.15);
  const slot=new THREE.Mesh(new THREE.BoxGeometry(.68,.22,.07),mat(0xc7d5e6,{metalness:.28}));slot.position.set(0,-.36,.15);
  group.add(body,label,slot);group.position.set(-info.bounds.x*.42,1.65,-info.bounds.z*.35);scene.add(group);return group;
}
function addPainting(){
  const texture=new THREE.TextureLoader().load('../property-assets/cuadro-caravaggio.jpg');texture.colorSpace=THREE.SRGBColorSpace;
  const frame=box([6.5,4.4,.25],[0,2.65,-info.bounds.z+.32],mat(0x342010,{roughness:.55}),false);
  const painting=new THREE.Mesh(new THREE.PlaneGeometry(5.9,3.8),new THREE.MeshBasicMaterial({map:texture}));painting.position.set(0,2.65,-info.bounds.z+.47);scene.add(painting);
  return frame;
}
async function buildGallery(){
  const brick=new THREE.TextureLoader().load('../property-assets/brick_diffuse.jpg');brick.colorSpace=THREE.SRGBColorSpace;brick.wrapS=brick.wrapT=THREE.RepeatWrapping;brick.repeat.set(3,2);
  const wall=new THREE.MeshStandardMaterial({map:brick,roughness:.95});
  addRoomShell(info.bounds.x*2,info.bounds.z*2,wall,mat(0x40383a,{roughness:.45,metalness:.38}));
  addPainting();
  box([5,.65,2.2],[-5,.33,2],mat(0x5a3826),true);box([5,.65,2.2],[5,.33,2],mat(0x5a3826),true);
  box([3.2,.8,1.4],[0,.4,-3.2],mat(0x111820,{roughness:.4,metalness:.25}),true);
  for(const x of [-12,-6,6,12]){const p=new THREE.PointLight(x<0?0x9aaeff:0xf3aaaa,14,10,2);p.position.set(x,3.5,0);scene.add(p);}
}
async function buildVilla(){
  addRoomShell(info.bounds.x*2,info.bounds.z*2,mat(0xe9e2d8),mat(0xd4c7b5));
  const poolFloor=box([14,.18,7],[-8,.02,-3],mat(0x167ea9),false);
  const waterTex=new THREE.TextureLoader().load('../property-assets/Water_1_M_Normal.jpg');waterTex.wrapS=waterTex.wrapT=THREE.RepeatWrapping;waterTex.repeat.set(2,2);
  const water=new THREE.Mesh(new THREE.PlaneGeometry(13.6,6.6),new THREE.MeshStandardMaterial({color:0x35b7e8,normalMap:waterTex,transparent:true,opacity:.75,roughness:.18,metalness:.05,side:THREE.DoubleSide}));water.rotation.x=-Math.PI/2;water.position.set(-8,.13,-3);scene.add(water);
  const poolObstacle={minX:-15,maxX:-1,minZ:-6.5,maxZ:.5};obstacles.push(poolObstacle);
  box([9,.7,2.5],[10,.35,-4],mat(0xf2efe8),true);box([4,.8,2.2],[9,.4,4],mat(0x435260),true);
  try{
    const gltf=await new GLTFLoader().loadAsync('../property-assets/pool.glb');
    gltf.scene.scale.setScalar(.06);gltf.scene.position.set(-8,.2,-3);gltf.scene.rotation.y=Math.PI/2;gltf.scene.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});scene.add(gltf.scene);
  }catch(error){console.warn('[property] pool.glb no pudo cargarse.',error);}
}
async function buildResidence(){
  addRoomShell(info.bounds.x*2,info.bounds.z*2,mat(0xc6cbd2),mat(0x454c56,{roughness:.55,metalness:.12}));
  box([.3,3.8,11],[-4.5,1.9,-2.5],mat(0x2e3744),true);box([9,3.8,.3],[4.5,1.9,-1],mat(0x2e3744),true);
  box([6,.8,2.6],[8,.4,5],mat(0x20262f),true);box([4,.9,1.8],[-10,.45,4],mat(0x785844),true);
  for(let i=0;i<7;i++){const step=box([4,.28,1.1],[10+i*.42,.14+i*.34,-7+i*.72],mat(0x6d7480),true);step.rotation.y=-.15;}
  const glass=mat(0x76a9c8,{transparent:true,opacity:.48,roughness:.1});
  const g1=box([8,3.1,.12],[-9,2,-info.bounds.z+.25],glass,false);const g2=box([8,3.1,.12],[6,2,-info.bounds.z+.25],glass,false);
}
async function buildWorld(){
  if(propertyId==='galeria')await buildGallery();else if(propertyId==='villa_piscina')await buildVilla();else await buildResidence();
  floppy=createFloppy();
  const exitGlow=new THREE.Mesh(new THREE.PlaneGeometry(2.6,3.2),new THREE.MeshBasicMaterial({color:0x2fd57d,transparent:true,opacity:.55,side:THREE.DoubleSide}));exitGlow.position.set(0,1.6,info.bounds.z-.15);exitGlow.rotation.y=Math.PI;scene.add(exitGlow);
  const grid=new THREE.GridHelper(info.bounds.x*2,Math.round(info.bounds.x*2),0x1f3150,0x182237);grid.position.y=.01;scene.add(grid);
}
function findClip(clips,names){return clips.find(c=>names.some(n=>c.name.toLowerCase().includes(n)))||clips[0];}
async function loadAvatar(){
  try{
    const gltf=await new GLTFLoader().loadAsync('../models/gltf/Soldier.glb');const model=gltf.scene;model.updateMatrixWorld(true);
    const b=new THREE.Box3().setFromObject(model),s=b.getSize(new THREE.Vector3());model.scale.setScalar(1.78/Math.max(.001,s.y));model.updateMatrixWorld(true);
    const b2=new THREE.Box3().setFromObject(model),c=b2.getCenter(new THREE.Vector3());model.position.set(-c.x,-b2.min.y,-c.z);model.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;o.frustumCulled=true;}});
    const root=new THREE.Group();root.add(model);scene.add(root);avatar=root;mixer=new THREE.AnimationMixer(model);
    const clips=gltf.animations||[];actions.idle=mixer.clipAction(findClip(clips,['idle']));actions.walk=mixer.clipAction(findClip(clips,['walk']));actions.run=mixer.clipAction(findClip(clips,['run']));actions.idle?.play();
  }catch(error){
    console.warn('[property] Soldier no pudo cargar.',error);avatar=new THREE.Group();const body=new THREE.Mesh(new THREE.CapsuleGeometry(.35,1.05,4,8),mat(0xff7a18));body.position.y=.88;avatar.add(body);scene.add(avatar);
  }
}
function setAction(name){if(!mixer||currentAction===name)return;const next=actions[name]||actions.idle,prev=actions[currentAction];prev?.fadeOut(.16);next?.reset().fadeIn(.16).play();currentAction=name;}
function collides(x,z){
  const margin=.38;if(x<-info.bounds.x+margin||x>info.bounds.x-margin||z<-info.bounds.z+margin||z>info.bounds.z-margin)return true;
  for(const o of obstacles)if(x>o.minX-margin&&x<o.maxX+margin&&z>o.minZ-margin&&z<o.maxZ+margin)return true;return false;
}
function updatePlayer(dt){
  const forward=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0);const side=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
  const running=Boolean(keys.ShiftLeft||keys.ShiftRight);const speed=running?6.2:3.7;let moving=false;
  if(forward||side){
    tempA.set(Math.sin(player.yaw),0,Math.cos(player.yaw)).multiplyScalar(-forward);tempB.set(Math.cos(player.yaw),0,-Math.sin(player.yaw)).multiplyScalar(side);tempA.add(tempB).normalize().multiplyScalar(speed*dt);
    const nx=player.position.x+tempA.x,nz=player.position.z+tempA.z;if(!collides(nx,player.position.z))player.position.x=nx;if(!collides(player.position.x,nz))player.position.z=nz;moving=true;
  }
  if(avatar){avatar.position.copy(player.position);avatar.rotation.y=player.yaw;avatar.visible=cameraMode==='third';}
  setAction(moving?(running?'run':'walk'):'idle');mixer?.update(dt);
}
function updateCamera(dt){
  const eye=tempA.copy(player.position).add(new THREE.Vector3(0,1.55,0));
  if(cameraMode==='first'){
    camera.position.copy(eye);const look=tempB.set(Math.sin(player.yaw)*Math.cos(player.pitch),Math.sin(player.pitch),Math.cos(player.yaw)*Math.cos(player.pitch)).multiplyScalar(-1).add(eye);camera.lookAt(look);
  }else{
    const behind=tempB.set(Math.sin(player.yaw)*5.2,2.8,Math.cos(player.yaw)*5.2).add(player.position);camera.position.lerp(behind,1-Math.exp(-dt*10));camera.lookAt(eye);
  }
}
function updateInteractions(){
  const dSave=player.position.distanceTo(floppy.position);const dExit=player.position.distanceTo(exitPoint);
  nearestAction=dSave<2.2?'save':dExit<2.4?'exit':null;
  if(nearestAction==='save'){ui.prompt.textContent='E · GUARDAR PARTIDA EN UN ARCHIVO';ui.prompt.style.display='block';}
  else if(nearestAction==='exit'){ui.prompt.textContent='E · SALIR A GTA MANUCHO';ui.prompt.style.display='block';}
  else ui.prompt.style.display='none';
}
function notice(text,duration=2800){ui.notice.textContent=text;ui.notice.style.display='block';clearTimeout(ui.notice._timer);ui.notice._timer=setTimeout(()=>ui.notice.style.display='none',duration);}
function collectStorage(){const result={};for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key&&(key.startsWith('vice_')||key.startsWith('vice-')||key.startsWith('game_of_crew')))result[key]=localStorage.getItem(key);}return result;}
function returnSnapshot(){try{return JSON.parse(localStorage.getItem(RETURN_KEY)||'null');}catch{return null;}}
function downloadSave(){
  const base=returnSnapshot()||{x:0,y:0,z:0,yaw:0,health:100,armor:0,money:0,propertyId};
  const save={format:SAVE_FORMAT,version:SAVE_VERSION,savedAt:new Date().toISOString(),slot:propertyId,slotName:info.name,player:base,runtime:{activeWeapon:'fist',wantedLevel:0},localStorage:collectStorage()};
  const blob=new Blob([JSON.stringify(save,null,2)],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`VICE_CITY_${propertyId.toUpperCase()}_${new Date().toISOString().replace(/[:.]/g,'-')}.vcsave`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);notice('PARTIDA GUARDADA EN TUS DESCARGAS',3900);
}
function loadSave(save){if(!save||save.format!==SAVE_FORMAT||!save.player||!save.localStorage)throw new Error('Archivo inválido');for(const [k,v] of Object.entries(save.localStorage)){if((k.startsWith('vice_')||k.startsWith('vice-')||k.startsWith('game_of_crew'))&&typeof v==='string')localStorage.setItem(k,v);}localStorage.setItem(PENDING_LOAD_KEY,JSON.stringify({player:save.player,runtime:save.runtime||{},loadedAt:Date.now()}));location.href='../index.html?noprogressive=1&loaded=1';}
function exitToCity(){location.href='../index.html?from=propiedad&noprogressive=1';}
function interact(){if(nearestAction==='save')downloadSave();else if(nearestAction==='exit')exitToCity();}
function setCameraMode(){cameraMode=cameraMode==='third'?'first':'third';ui.camera.textContent=`${cameraMode==='third'?'TERCERA':'PRIMERA'} PERSONA · V PARA CAMBIAR`;}

document.addEventListener('keydown',event=>{keys[event.code]=true;if(event.code==='KeyV'&&!event.repeat)setCameraMode();if(event.code==='KeyE'&&!event.repeat)interact();if(event.code==='F9'&&!event.repeat){event.preventDefault();ui.file.click();}});
document.addEventListener('keyup',event=>keys[event.code]=false);window.addEventListener('blur',()=>Object.keys(keys).forEach(k=>keys[k]=false));
renderer.domElement.addEventListener('click',()=>renderer.domElement.requestPointerLock?.());document.addEventListener('mousemove',event=>{if(document.pointerLockElement!==renderer.domElement)return;player.yaw-=event.movementX*.0023;player.pitch=THREE.MathUtils.clamp(player.pitch-event.movementY*.0019,-.8,.55);});
ui.exit.addEventListener('click',exitToCity);ui.load.addEventListener('click',()=>ui.file.click());ui.file.addEventListener('change',async()=>{const file=ui.file.files?.[0];ui.file.value='';if(!file)return;try{loadSave(JSON.parse(await file.text()));}catch(error){console.error(error);notice('ARCHIVO DE PARTIDA NO VÁLIDO',3600);}});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1));});

function frame(now=performance.now()){
  requestAnimationFrame(frame);if(document.hidden){last=now;return;}const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;updatePlayer(dt);updateCamera(dt);uiAccumulator+=dt;if(uiAccumulator>.12){uiAccumulator=0;updateInteractions();}
  if(floppy){floppy.rotation.y=now*.0011;floppy.position.y=1.65+Math.sin(now*.0025)*.12;}
  renderer.render(scene,camera);
}

(async()=>{await buildWorld();await loadAvatar();avatar.position.copy(player.position);updateCamera(.016);ui.loading.style.opacity='0';setTimeout(()=>ui.loading.remove(),350);requestAnimationFrame(frame);})();
