/**
 * GTA MANUCHO V84 — código del proyecto.
 * Creado e integrado por Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * ARKEA AI / Manucho · conserva LICENSE, NOTICE.md y estos créditos al reutilizar.
 */
import * as THREE from './bosque/libs/three.module.js';
import { GLTFLoader } from './bosque/libs/GLTFLoader.js';
import { FBXLoader } from './npc-extra-assets/loaders/FBXLoader.js';
import { MD2Loader } from './npc-extra-assets/loaders/MD2Loader.js';
import { clone as cloneSkeleton } from './bosque/bike-runtime/utils/SkeletonUtils.js';

const WORLD_SCALE = 16;
const EXTRA_NPCS = [];
const HEALTH_PICKUPS = [];
const TAXIS = [];
const mixers = [];
const tempA = new THREE.Vector3();
const tempB = new THREE.Vector3();
const tempC = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const clock = new THREE.Clock();
let game = null;
let city = null;
let installed = false;
let lastNow = performance.now();
let aiAccumulator = 0;
let visualAccumulator = 0;
let clampIndex = 0;
let activeMission = null;
let companionPassenger = null;
let rightShotAt = 0;
let meleeAt = 0;
let noticeNode = null;
let missionNode = null;
let modelTargetHeight = 48;
let playerLastVehicle = null;
let companionOfferAt = 0;

const ROUTE_POINTS = [
  [-1850,-4100],[-1320,-4100],[-850,-4100],[-450,-3200],[-1450,-3200],[-2050,-2400],
  [-1750,-850],[-950,-850],[-250,-850],[650,-850],[1450,-850],[1850,250],
  [1450,1150],[650,1150],[-250,1150],[-1150,1150],[-1750,2150],[-600,3150],
  [550,3150],[1450,3150],[1900,4150],[800,4550],[-650,4550],[-1750,3900]
].map(([x,z])=>new THREE.Vector3(x*WORLD_SCALE,0,z*WORLD_SCALE));

function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
function idleTurn(timeout=900){return new Promise(resolve=>{if('requestIdleCallback' in window)requestIdleCallback(()=>resolve(),{timeout});else setTimeout(resolve,Math.min(timeout,300));});}
function groundAt(x,z,fallback=0){
  try { const y=game?.getGroundY?.(x,fallback+900,z,false); return Number.isFinite(y)?y:fallback; }
  catch { return fallback; }
}
function randomRoutePoint(){
  const source=ROUTE_POINTS[Math.floor(Math.random()*ROUTE_POINTS.length)].clone();
  source.x+=(Math.random()-.5)*220; source.z+=(Math.random()-.5)*220;
  source.y=groundAt(source.x,source.z,0); return source;
}
function playerPosition(){
  return window.__CUSTOM_CAR_SYSTEM__?.active?.root?.position || game?.playerContainer?.position || tempA.set(0,0,0);
}
function getActiveCar(){return window.__CUSTOM_CAR_SYSTEM__?.active || null;}
function selectedWeapon(){return window.__WEAPON_CRATES__?.selectedWeapon || game?.activeWeapon || 'fist';}
function setMoney(value){game.money=Math.max(0,Math.round(value));game.updateHUDState?.();}
function addMoney(value){setMoney(Number(game.money||0)+value);}
function setHealth(value){game.health=THREE.MathUtils.clamp(value,0,200);game.updateHUDState?.();}
function addHealth(value){setHealth(Number(game.health||0)+value);}

function ensureUi(){
  if(noticeNode)return;
  const style=document.createElement('style');
  style.textContent=`
  #v71-notice{position:fixed;top:21%;left:50%;transform:translateX(-50%);z-index:25020;display:none;padding:13px 22px;border:2px solid #ff9c2a;background:rgba(5,10,16,.94);box-shadow:0 0 20px rgba(255,140,30,.42);font:1000 16px/1.2 Arial;color:#fff;letter-spacing:1px;text-align:center;border-radius:8px;pointer-events:none}
  #v71-mission{position:fixed;right:24px;bottom:24px;z-index:25010;display:none;width:min(330px,42vw);padding:12px 16px;background:rgba(6,13,20,.9);border:2px solid #47c7ff;border-radius:9px;color:#fff;font:900 13px/1.35 Arial;letter-spacing:.5px;box-shadow:0 0 18px rgba(50,185,255,.25);pointer-events:none}
  #v71-mission b{display:block;color:#5ed8ff;font-size:15px;margin-bottom:4px}
  `;
  document.head.appendChild(style);
  noticeNode=document.createElement('div');noticeNode.id='v71-notice';
  missionNode=document.createElement('div');missionNode.id='v71-mission';
  document.body.append(noticeNode,missionNode);
}
function notice(text,duration=2200){
  ensureUi(); noticeNode.textContent=text; noticeNode.style.display='block';
  clearTimeout(noticeNode._timer); noticeNode._timer=setTimeout(()=>noticeNode.style.display='none',duration);
}
function setMission(title,text){
  ensureUi();
  if(!title){missionNode.style.display='none';missionNode.innerHTML='';return;}
  missionNode.innerHTML=`<b>${title}</b>${text}`;missionNode.style.display='block';
}

function playerHeight(){
  try { const box=new THREE.Box3().setFromObject(game.playerModel||game.playerContainer); const h=box.max.y-box.min.y; return Number.isFinite(h)&&h>10?THREE.MathUtils.clamp(h,34,68):48; }
  catch{return 48;}
}
function prepareVisual(object,targetHeight=modelTargetHeight){
  object.traverse(child=>{
    if(!child.isMesh&&!child.isSkinnedMesh)return;
    child.castShadow=false;child.receiveShadow=false;child.frustumCulled=true;
    if(Array.isArray(child.material)) child.material=child.material.map(m=>m?.clone?.()||m);
    else if(child.material) child.material=child.material.clone?.()||child.material;
  });
  object.position.set(0,0,0);object.rotation.set(0,0,0);object.scale.set(1,1,1);object.updateMatrixWorld(true);
  let box=new THREE.Box3().setFromObject(object);let size=new THREE.Vector3();box.getSize(size);
  if(size.y>.001)object.scale.setScalar(targetHeight/size.y);
  object.updateMatrixWorld(true);box=new THREE.Box3().setFromObject(object);
  object.position.y-=box.min.y;
  object.updateMatrixWorld(true);
  return object;
}
function actorContainer(visual,name){
  const root=new THREE.Group();root.name=name;root.add(visual);game.scene.add(root);return root;
}
function faceDirection(root,dx,dz){if(Math.abs(dx)+Math.abs(dz)>.01)root.rotation.y=Math.atan2(dx,dz);}
function moveActor(actor,target,speed,dt){
  if(!actor?.root||actor.dead)return 0;
  tempA.subVectors(target,actor.root.position);tempA.y=0;const dist=tempA.length();
  if(dist<8)return dist;
  tempA.multiplyScalar(1/dist);const step=Math.min(dist,speed*dt);
  actor.root.position.addScaledVector(tempA,step);faceDirection(actor.root,tempA.x,tempA.z);
  actor.root.position.y=groundAt(actor.root.position.x,actor.root.position.z,actor.root.position.y);
  actor.moving=true;return dist;
}
function createFallbackActor(color=0xdd3344){
  const root=new THREE.Group();
  const mat=new THREE.MeshLambertMaterial({color});
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(7,18,3,6),mat);torso.position.y=25;
  const head=new THREE.Mesh(new THREE.SphereGeometry(7,10,8),new THREE.MeshLambertMaterial({color:0xd3a178}));head.position.y=46;
  const legs=new THREE.Mesh(new THREE.BoxGeometry(12,20,8),mat);legs.position.y=10;
  root.add(torso,head,legs);return root;
}
function makeWorldLabel(text,color){
  const c=document.createElement('canvas');c.width=256;c.height=64;const x=c.getContext('2d');
  x.fillStyle='rgba(4,7,11,.88)';x.fillRect(0,8,256,48);x.strokeStyle=color;x.lineWidth=5;x.strokeRect(2,10,252,44);
  x.fillStyle='#fff';x.font='900 25px Arial';x.textAlign='center';x.textBaseline='middle';x.fillText(text,128,32);
  const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));spr.scale.set(72,18,1);spr.position.y=modelTargetHeight+16;return spr;
}

async function loadDamaTemplate(){
  try {
    const fbx=await new FBXLoader().loadAsync('./npc-extra-assets/dama/SambaDancing.fbx');
    prepareVisual(fbx,modelTargetHeight*.94);return {visual:fbx,animations:fbx.animations||[]};
  } catch(error){console.warn('[v71] dama fallback',error);return {visual:createFallbackActor(0xef71b8),animations:[]};}
}
async function loadRobber1Template(){
  try {
    const [geometry,texture]=await Promise.all([
      new MD2Loader().loadAsync('./npc-extra-assets/ladron1/ratamahatta.md2'),
      new THREE.TextureLoader().loadAsync('./npc-extra-assets/ladron1/gearwhore.png')
    ]);
    texture.colorSpace=THREE.SRGBColorSpace;
    const mesh=new THREE.Mesh(geometry,new THREE.MeshLambertMaterial({map:texture,morphTargets:true}));
    prepareVisual(mesh,modelTargetHeight);return {visual:mesh,animations:geometry.animations||[],md2:true};
  } catch(error){console.warn('[v71] ladron1 fallback',error);return {visual:createFallbackActor(0x7f2020),animations:[]};}
}
async function loadRobber2Template(){
  try {
    const gltf=await new GLTFLoader().loadAsync('./npc-extra-assets/ladron2/monster.glb');
    prepareVisual(gltf.scene,modelTargetHeight*1.02);return {visual:gltf.scene,animations:gltf.animations||[]};
  } catch(error){console.warn('[v71] ladron2 fallback',error);return {visual:createFallbackActor(0x4f1515),animations:[]};}
}
function cloneTemplate(template){
  let visual;
  try{visual=cloneSkeleton(template.visual);}catch{visual=template.visual.clone(true);}
  const mixer=template.animations?.length?new THREE.AnimationMixer(visual):null;
  if(mixer){
    const preferred=template.animations.find(c=>/run|walk|samba|stand|idle/i.test(c.name))||template.animations[0];
    if(preferred){const action=mixer.clipAction(preferred);action.play();action.timeScale=.72;}
    mixers.push(mixer);
  }
  return {visual,mixer};
}
function registerExtra(actor,type,faction){
  actor.entity={type,faction,root:actor.root,health:actor.maxHealth,maxHealth:actor.maxHealth,dead:false,state:'wander'};
  city?.registerEntity?.(actor.entity);actor.root.userData.v71Actor=actor;
  actor.root.traverse(o=>o.userData.v71Actor=actor);return actor;
}

async function spawnExtraNpcs(){
  await idleTurn(1800);
  const damaTemplate=await loadDamaTemplate();
  const damaStarts=[[-1520,-2560],[-730,-900],[710,-930],[1370,1110]];
  for(let i=0;i<damaStarts.length;i++){
    const {visual,mixer}=cloneTemplate(damaTemplate);const root=actorContainer(visual,`ACOMPANANTE_${i+1}`);
    const [lx,lz]=damaStarts[i];root.position.set(lx*WORLD_SCALE,0,lz*WORLD_SCALE);root.position.y=groundAt(root.position.x,root.position.z,0);
    const actor={kind:'dama',root,mixer,maxHealth:85,target:randomRoutePoint(),speed:34+Math.random()*12,phase:Math.random()*5,passenger:false,dead:false};
    registerExtra(actor,'civilian',null);EXTRA_NPCS.push(actor);window.__V71_EXTRA_NPCS__=EXTRA_NPCS;
    await idleTurn(240);
  }
  await idleTurn(1400);
  const robber1Template=await loadRobber1Template();
  const {visual:visual1,mixer:mixer1}=cloneTemplate(robber1Template);const root1=actorContainer(visual1,'LADRON_1');
  root1.position.set(-1000*WORLD_SCALE,0,1200*WORLD_SCALE);root1.position.y=groundAt(root1.position.x,root1.position.z,0);
  const robber1={kind:'robber',root:root1,mixer:mixer1,maxHealth:130,target:randomRoutePoint(),speed:52,phase:Math.random()*5,passenger:false,dead:false,nextAttack:0,theft:0,respawnAt:0};
  registerExtra(robber1,'gang','robber');EXTRA_NPCS.push(robber1);window.__V71_EXTRA_NPCS__=EXTRA_NPCS;
  await idleTurn(2200);
  const robber2Template=await loadRobber2Template();
  const {visual:visual2,mixer:mixer2}=cloneTemplate(robber2Template);const root2=actorContainer(visual2,'LADRON_2');
  root2.position.set(1280*WORLD_SCALE,0,-2200*WORLD_SCALE);root2.position.y=groundAt(root2.position.x,root2.position.z,0);
  const robber2={kind:'robber',root:root2,mixer:mixer2,maxHealth:145,target:randomRoutePoint(),speed:57,phase:Math.random()*5,passenger:false,dead:false,nextAttack:0,theft:0,respawnAt:0};
  registerExtra(robber2,'gang','robber');EXTRA_NPCS.push(robber2);window.__V71_EXTRA_NPCS__=EXTRA_NPCS;
}
function makeHeart(){
  const g=new THREE.Group();const mat=new THREE.MeshLambertMaterial({color:0xff284c,emissive:0x43000b});
  const a=new THREE.Mesh(new THREE.SphereGeometry(7,12,8),mat);const b=a.clone();a.position.set(-5,5,0);b.position.set(5,5,0);
  const tip=new THREE.Mesh(new THREE.ConeGeometry(11,20,4),mat);tip.rotation.y=Math.PI/4;tip.position.y=-5;g.add(a,b,tip);return g;
}
function makeAspirin(){
  const g=new THREE.Group();const capsule=new THREE.Mesh(new THREE.CapsuleGeometry(5,13,5,10),new THREE.MeshLambertMaterial({color:0xf4f7ff,emissive:0x222633}));capsule.rotation.z=Math.PI/2;g.add(capsule);return g;
}
function spawnHealthPickups(){
  const specs=[
    ['heart',-1960,-4490],['aspirin',-1680,-3150],['heart',-350,-900],['aspirin',950,-850],
    ['heart',1350,3050],['aspirin',-1200,4300],['heart',1750,900],['aspirin',500,3150]
  ];
  for(const [kind,lx,lz] of specs){
    const root=kind==='heart'?makeHeart():makeAspirin();root.name=`SALUD_${kind}`;game.scene.add(root);
    root.position.set(lx*WORLD_SCALE,0,lz*WORLD_SCALE);root.position.y=groundAt(root.position.x,root.position.z,0)+18;
    HEALTH_PICKUPS.push({kind,root,baseY:root.position.y,phase:Math.random()*6,respawnAt:0});
  }
  window.__V71_HEALTH_PICKUPS__=HEALTH_PICKUPS;
}

function addTaxiSign(car){
  if(car.root.userData.taxi)return;
  car.root.traverse(obj=>{
    if(!obj.isMesh)return;
    const name=String(obj.name||'').toLowerCase();
    const mats=Array.isArray(obj.material)?obj.material:[obj.material];
    const replaced=mats.map(mat=>{
      const mn=String(mat?.name||'').toLowerCase();
      if(!(mn.includes('body')||name==='body'||name.includes('paint')))return mat;
      const copy=mat.clone();copy.color?.setHex(0xffcc18);return copy;
    });
    obj.material=Array.isArray(obj.material)?replaced:replaced[0];
  });
  const sign=new THREE.Group();
  const box=new THREE.Mesh(new THREE.BoxGeometry(28,10,12),new THREE.MeshLambertMaterial({color:0xffda29,emissive:0x332500}));box.position.y=car.height+7;
  const c=document.createElement('canvas');c.width=256;c.height=80;const x=c.getContext('2d');x.fillStyle='#ffd11a';x.fillRect(0,0,256,80);x.fillStyle='#101010';x.font='1000 48px Arial';x.textAlign='center';x.textBaseline='middle';x.fillText('TAXI',128,40);
  const label=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true}));label.scale.set(34,11,1);label.position.set(0,car.height+7,6.2);
  sign.add(box,label);car.root.add(sign);car.root.userData.taxi=true;car.isTaxi=true;TAXIS.push(car);
}
async function setupTaxis(){
  const started=performance.now();
  while(!(window.__CUSTOM_CARS__||[]).length&&performance.now()-started<22000)await wait(250);
  const cars=(window.__CUSTOM_CARS__||[]).slice(0,3);cars.forEach(addTaxiSign);window.__V71_TAXIS__=TAXIS;
}

function activeCarType(car){
  if(!car)return '';
  if(car.root.userData.taxi||car.isTaxi)return 'taxi';
  const entry=car.serviceEntry||car.root.userData.serviceVehicleEntry||car.root.userData.serviceEntry;
  if(entry?.kind==='ambulance'||/AMBULANCIA/i.test(car.root.name||''))return 'ambulance';
  if(entry?.kind==='police'||/VCPD|POLICE|PATRULLA/i.test(car.root.name||''))return 'police';
  return '';
}
function missionWaypoint(position){if(position)city?.setWaypoint?.(position.x,position.z);else city?.clearWaypoint?.();}
function cancelMission(message='MISIÓN CANCELADA'){
  if(activeMission?.passenger?.root){
    const p=activeMission.passenger;p.passenger=false;p.root.visible=true;
    p.root.position.copy(playerPosition()).add(new THREE.Vector3(35,0,35));p.root.position.y=groundAt(p.root.position.x,p.root.position.z,0);
  }
  activeMission=null;missionWaypoint(null);setMission(null);if(message)notice(message);
}
function startAmbulanceMission(){
  const candidates=(window.__CITY_NPCS__||[]).filter(n=>n?.root?.visible);let victim=candidates[Math.floor(Math.random()*candidates.length)]||null;
  if(!victim){notice('NO HAY HERIDOS DISPONIBLES');return;}
  activeMission={type:'ambulance',stage:'pickup',victim,reward:900};victim.root.userData.v71Injured=true;
  missionWaypoint(victim.root.position);setMission('MISIÓN AMBULANCIA','Recoge al herido marcado y llévalo al hospital.');notice('MISIÓN DE RESCATE INICIADA');
}
function startPoliceMission(){
  const targets=EXTRA_NPCS.filter(n=>n.kind==='robber'&&!n.dead&&n.root.visible);
  const target=targets[0]||null;if(!target){notice('NO HAY DELINCUENTES ACTIVOS');return;}
  activeMission={type:'police',stage:'pursuit',target,reward:1200};missionWaypoint(target.root.position);
  setMission('MISIÓN VIGILANTE','Persigue al ladrón. Atácalo o acércate para arrestarlo.');notice('OBJETIVO POLICIAL MARCADO');
}
function startTaxiMission(){
  const candidates=(window.__CITY_NPCS__||[]).filter(n=>n?.root?.visible);const passenger=candidates[Math.floor(Math.random()*candidates.length)]||EXTRA_NPCS.find(n=>n.kind==='dama'&&!n.passenger);
  if(!passenger?.root){notice('NO HAY PASAJEROS DISPONIBLES');return;}
  activeMission={type:'taxi',stage:'pickup',passenger,destination:randomRoutePoint(),reward:650};missionWaypoint(passenger.root.position);
  setMission('MISIÓN TAXI','Recoge al pasajero marcado.');notice('CLIENTE DE TAXI MARCADO');
}
function startVehicleMission(){
  const car=getActiveCar();if(!car)return;
  if(activeMission){cancelMission();return;}
  const type=activeCarType(car);
  if(type==='ambulance')startAmbulanceMission();
  else if(type==='police')startPoliceMission();
  else if(type==='taxi')startTaxiMission();
  else notice('ESTE VEHÍCULO NO TIENE MISIÓN · USA AMBULANCIA, PATRULLA O TAXI');
}
function attachPassenger(actor,car,hide=true){
  actor.passenger=true;actor.root.userData.passenger=true;
  if(hide)actor.root.visible=false;
  else {
    actor.root.traverse?.(object=>{if(object.isSprite){object.userData.v71WasVisible=object.visible;object.visible=false;}});
    car.root.attach(actor.root);actor.root.position.set(car.width*.16,Math.max(5,car.height*.08),-car.length*.02);actor.root.rotation.set(0,Math.PI,0);actor.root.scale.setScalar(.72);
  }
}
function releasePassenger(actor,car){
  if(!actor?.root)return;
  game.scene.attach(actor.root);actor.root.scale.setScalar(1);actor.root.visible=true;actor.root.traverse?.(object=>{if(object.isSprite&&object.userData.v71WasVisible!==undefined){object.visible=object.userData.v71WasVisible;delete object.userData.v71WasVisible;}});actor.passenger=false;actor.root.userData.passenger=false;
  const side=new THREE.Vector3((car?.width||50)*.75,0,0).applyQuaternion(car?.root?.quaternion||new THREE.Quaternion());
  actor.root.position.copy(car?.root?.position||playerPosition()).add(side);actor.root.position.y=groundAt(actor.root.position.x,actor.root.position.z,0);actor.target=randomRoutePoint();
}
function updateMission(){
  if(!activeMission)return;
  const car=getActiveCar();const carPos=car?.root?.position;
  if(!car||!carPos){return;}
  const type=activeMission.type;
  if(type==='ambulance'){
    const m=activeMission;const target=m.victim?.root;
    if(m.stage==='pickup'){
      if(!target?.visible){cancelMission('EL HERIDO YA NO ESTÁ DISPONIBLE');return;}
      missionWaypoint(target.position);
      if(carPos.distanceTo(target.position)<85&&Math.abs(car.root.carSpeed||0)<80){target.visible=false;m.stage='hospital';missionWaypoint(city.hospital?.door);setMission('MISIÓN AMBULANCIA','Herido a bordo. Regresa al hospital.');notice('HERIDO RECOGIDO');}
    }else if(m.stage==='hospital'){
      const dest=city.hospital?.door;if(dest&&carPos.distanceTo(dest)<145){target.visible=true;target.position.copy(dest).add(new THREE.Vector3(55,0,15));target.position.y=groundAt(target.position.x,target.position.z,0);delete target.userData.v71Injured;addMoney(m.reward);notice(`RESCATE COMPLETADO +$${m.reward}`,3300);activeMission=null;missionWaypoint(null);setMission(null);}
    }
  }else if(type==='police'){
    const m=activeMission,t=m.target;
    if(!t||t.dead||t.entity?.dead){addMoney(m.reward);notice(`OBJETIVO DETENIDO +$${m.reward}`,3300);activeMission=null;missionWaypoint(null);setMission(null);return;}
    missionWaypoint(t.root.position);
    if(carPos.distanceTo(t.root.position)<72&&Math.abs(car.root.carSpeed||0)<35){city.damageEntity?.(t.entity,999,'police_mission');addMoney(m.reward);notice(`LADRÓN ARRESTADO +$${m.reward}`,3300);activeMission=null;missionWaypoint(null);setMission(null);}
  }else if(type==='taxi'){
    const m=activeMission,p=m.passenger;
    if(m.stage==='pickup'){
      missionWaypoint(p.root.position);
      if(carPos.distanceTo(p.root.position)<80&&Math.abs(car.root.carSpeed||0)<70){attachPassenger(p,car,true);m.stage='dropoff';missionWaypoint(m.destination);setMission('MISIÓN TAXI','Pasajero a bordo. Llévalo al destino naranja.');notice('PASAJERO A BORDO');}
    }else if(m.stage==='dropoff'){
      if(carPos.distanceTo(m.destination)<115){releasePassenger(p,car);addMoney(m.reward);notice(`VIAJE COMPLETADO +$${m.reward}`,3300);activeMission=null;missionWaypoint(null);setMission(null);}
    }
  }
}

function tryCompanionPickup(){
  const car=getActiveCar();if(!car||companionPassenger||activeMission)return;
  if(Math.abs(car.root.carSpeed||0)>35)return;
  let best=null,bestD=105;
  for(const actor of EXTRA_NPCS){
    if(actor.kind!=='dama'||actor.passenger||actor.dead||!actor.root.visible)continue;
    const d=actor.root.position.distanceTo(car.root.position);if(d<bestD){best=actor;bestD=d;}
  }
  if(!best)return;
  if(Number(game.money||0)<100){if(performance.now()>companionOfferAt){companionOfferAt=performance.now()+3500;notice('NECESITAS $100 PARA EL VIAJE DE ACOMPAÑAMIENTO');}return;}
  setMoney(Number(game.money||0)-100);attachPassenger(best,car,false);companionPassenger={actor:best,car,joinedAt:performance.now()};notice('ACOMPAÑANTE A BORDO · -$100',2800);
}
function updateCompanion(){
  if(!companionPassenger)return;
  const active=getActiveCar();
  if(active!==companionPassenger.car||performance.now()-companionPassenger.joinedAt>35000){releasePassenger(companionPassenger.actor,companionPassenger.car);companionPassenger=null;notice('LA ACOMPAÑANTE HA BAJADO',1800);}
}

function syncActorDeath(actor){
  if(!actor.entity)return;
  if(actor.entity.dead&&!actor.dead){actor.dead=true;actor.respawnAt=performance.now()+22000;actor.root.visible=false;}
  if(actor.dead&&performance.now()>actor.respawnAt){actor.dead=false;actor.entity.dead=false;actor.entity.health=actor.entity.maxHealth;actor.root.visible=true;actor.root.position.copy(randomRoutePoint());actor.target=randomRoutePoint();}
}
function updateDama(actor,dt){
  if(actor.passenger)return;
  if(actor.root.position.distanceToSquared(actor.target)<70*70)actor.target=randomRoutePoint();
  moveActor(actor,actor.target,actor.speed,dt);
}
function updateRobber(actor,dt,now){
  const player=playerPosition();const dist=actor.root.position.distanceTo(player);const car=getActiveCar();
  if(dist<430){
    moveActor(actor,player,actor.speed*1.45,dt);
    if(dist<80&&now>actor.nextAttack){actor.nextAttack=now+1250;city.damagePlayer?.(2.2,'ATAQUE DE LADRÓN');}
    if(car&&dist<105&&Math.abs(car.root.carSpeed||0)<55){
      actor.theft+=dt;
      if(actor.theft>4.5){stealPlayerCar(actor,car);actor.theft=0;}
    }else actor.theft=Math.max(0,actor.theft-dt*1.4);
  }else{
    actor.theft=0;if(actor.root.position.distanceToSquared(actor.target)<80*80)actor.target=randomRoutePoint();moveActor(actor,actor.target,actor.speed,dt);
  }
}
function stealPlayerCar(actor,car){
  notice('UN LADRÓN ESTÁ ROBANDO TU VEHÍCULO',2600);
  try{window.__CUSTOM_CAR_SYSTEM__?.exit?.();}catch{}
  car.root.userData.playerOwned=false;car.playerOwned=false;actor.root.visible=false;actor.stolenCar=car;car.autopilot=Boolean(car.roadRoute);
  if(!car.roadRoute){
    car.root.userData.v71RobberDriveUntil=performance.now()+9000;car.root.userData.v71RobberSpeed=230;
  }
  setTimeout(()=>{actor.root.visible=true;actor.root.position.copy(car.root.position).add(new THREE.Vector3(45,0,30));actor.root.position.y=groundAt(actor.root.position.x,actor.root.position.z,0);actor.stolenCar=null;},10000);
}
function updateRobberDrivenCars(dt){
  for(const car of window.__CUSTOM_CARS__||[]){
    const until=car.root?.userData?.v71RobberDriveUntil||0;if(!until)continue;
    if(performance.now()>until){delete car.root.userData.v71RobberDriveUntil;car.root.userData.v71RobberSpeed=0;continue;}
    tempA.set(0,0,-1).applyQuaternion(car.root.quaternion);car.root.position.addScaledVector(tempA,(car.root.userData.v71RobberSpeed||180)*dt);
    car.root.rotation.y+=Math.sin(performance.now()*.0013)*.003;car.root.position.y=groundAt(car.root.position.x,car.root.position.z,car.root.position.y)+.35;
  }
}

function updatePickups(dt,now){
  const p=playerPosition();
  for(const pickup of HEALTH_PICKUPS){
    if(!pickup.root.visible){if(now>pickup.respawnAt)pickup.root.visible=true;continue;}
    pickup.root.rotation.y+=dt*1.4;pickup.root.position.y=pickup.baseY+Math.sin(now*.003+pickup.phase)*5;
    if(pickup.root.position.distanceToSquared(p)<58*58){
      const gain=pickup.kind==='heart'?50:25;addHealth(gain);pickup.root.visible=false;pickup.respawnAt=now+35000;
      notice(`${pickup.kind==='heart'?'CORAZÓN':'ASPIRINA'} · VIDA +${gain}`,1800);
    }
  }
}
function clampOneCar(){
  const cars=[...(window.__CUSTOM_CARS__||[]),...(city?.serviceVehicles||[])].filter(c=>c?.root?.position);
  if(!cars.length)return;const car=cars[clampIndex++%cars.length];
  if(car===getActiveCar()&&Math.abs(car.root.position.y-groundAt(car.root.position.x,car.root.position.z,car.root.position.y))<35)return;
  const ground=groundAt(car.root.position.x,car.root.position.z,car.root.position.y);
  const desired=ground+.35;if(car.root.position.y>desired+25||car.root.position.y<desired-12){car.root.position.y=desired;car.root.carSpeed*=.65;}
}

function collectShootTargets(){
  return (city?.entities||[]).filter(e=>!e.dead&&e.root?.visible).map(e=>e.root);
}
function makeTracer(origin,end){
  const geometry=new THREE.BufferGeometry().setFromPoints([origin,end]);const line=new THREE.Line(geometry,new THREE.LineBasicMaterial({color:0xffe47a,transparent:true,opacity:.9,depthWrite:false}));
  game.scene.add(line);setTimeout(()=>{game.scene.remove(line);geometry.dispose();line.material.dispose();},90);
}
function fireFromRightSide(){
  const car=getActiveCar();if(!car||performance.now()-rightShotAt<260)return;
  if(selectedWeapon()==='fist'){notice('RECOGE UN ARMA PARA DISPARAR DESDE EL VEHÍCULO',1500);return;}
  rightShotAt=performance.now();
  const side=tempA.set(1,0,0).applyQuaternion(car.root.quaternion).normalize();
  const origin=car.root.position.clone().addScaledVector(side,car.width*.62);origin.y+=car.height*.62;
  raycaster.set(origin,side);raycaster.far=1800;
  const hit=raycaster.intersectObjects(collectShootTargets(),true)[0];const end=hit?.point||origin.clone().addScaledVector(side,900);makeTracer(origin,end);
  if(hit){let obj=hit.object,entity=null;while(obj&&!entity){entity=obj.userData?.entityRef;obj=obj.parent;}if(entity)city.damageEntity?.(entity,selectedWeapon()==='shotgun'?55:selectedWeapon()==='akm'?30:38,'player');}
  city.addWanted?.(1,'DISPARO DESDE VEHÍCULO');
}
function onMouseDown(event){
  if(event.button===2&&getActiveCar()){event.preventDefault();event.stopPropagation();fireFromRightSide();return;}
  if(event.button===0&&!getActiveCar()&&selectedWeapon()==='fist'&&performance.now()-meleeAt>360){meleeAt=performance.now();city.meleeAttack?.();}
}
function onContext(event){if(getActiveCar())event.preventDefault();}
function onKey(event){
  if(event.code==='KeyY'&&!event.repeat){event.preventDefault();startVehicleMission();}
}

function updateMissionsAndActors(dt,now){
  updateMission();updateCompanion();tryCompanionPickup();updateRobberDrivenCars(dt);
  for(const actor of EXTRA_NPCS){
    syncActorDeath(actor);if(actor.dead||!actor.root.visible||actor.passenger)continue;
    if(actor.kind==='dama')updateDama(actor,dt);else updateRobber(actor,dt,now);
  }
}
function updatePassengerOnVehicleChange(){
  const active=getActiveCar();
  if(active && /ATROPELL/i.test(String(game.currentMessage||''))){game.currentMessage=undefined;game.updateHUDState?.();}
  if(playerLastVehicle&&!active&&companionPassenger){releasePassenger(companionPassenger.actor,companionPassenger.car);companionPassenger=null;}
  playerLastVehicle=active;
}
function animate(){
  requestAnimationFrame(animate);if(document.hidden)return;
  const now=performance.now(),dt=Math.min(.08,Math.max(0,(now-lastNow)/1000));lastNow=now;aiAccumulator+=dt;visualAccumulator+=dt;
  if(visualAccumulator>=1/15){const step=visualAccumulator;visualAccumulator=0;for(const mixer of mixers)mixer.update(step);updatePickups(step,now);}
  if(aiAccumulator>=1/10){const step=Math.min(.16,aiAccumulator);aiAccumulator=0;updateMissionsAndActors(step,now);updatePassengerOnVehicleChange();clampOneCar();}
}

async function install(){
  if(installed)return;game=window.__VICE_CITY_GAME__;city=window.__CITY_LIFE_SYSTEM__;
  if(!game?.scene||!game?.playerContainer||!city)return;installed=true;ensureUi();modelTargetHeight=playerHeight();
  game.maxHealth=200;game.health=Math.max(150,Number(game.health||0));game.updateHUDState?.();
  window.__V71_EXTRA_NPCS__=EXTRA_NPCS;window.__V71_HEALTH_PICKUPS__=HEALTH_PICKUPS;window.__V71_TAXIS__=TAXIS;
  spawnHealthPickups();setupTaxis();
  window.addEventListener('keydown',onKey,true);window.addEventListener('mousedown',onMouseDown,true);window.addEventListener('contextmenu',onContext,true);
  animate();
  spawnExtraNpcs().catch(error=>console.error('[v72-npcs]',error));
}

const ready=setInterval(()=>{
  game=window.__VICE_CITY_GAME__||game;city=window.__CITY_LIFE_SYSTEM__||city;
  if(!game?.scene||!game?.playerContainer||!city)return;
  clearInterval(ready);install().catch(error=>console.error('[v71-city-features]',error));
},220);
setTimeout(()=>clearInterval(ready),45000);
