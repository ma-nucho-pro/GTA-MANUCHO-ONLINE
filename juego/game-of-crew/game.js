import * as THREE from '../bosque/libs/three.module.js';
import { GLTFLoader } from '../bosque/bike-runtime/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from '../bosque/bike-runtime/utils/SkeletonUtils.js';
import { MD2Loader } from '../skin-assets/loaders/MD2Loader.js';
import { OBJLoader } from '../weapon-assets/OBJLoader.js';

THREE.Cache.enabled = true;

const ui = Object.fromEntries(['loading','play','loadText','progress','warning','orangeScore','enemyScore','timer','health','ammo','kills','inventory','prompt','feed','cross','hit','exit','resume','result','resultTitle','resultText','restart','returnCity','damage','cameraMode'].map(id => [id, document.getElementById(id)]));
const MATCH_SECONDS = 300;
const SCORE_LIMIT = 150;
const PLAYER_MAX_HEALTH = 150;
const ARENA = { minX:-25, maxX:25, minZ:-19, maxZ:19 };
const PLAYER_RADIUS = .42;
const PLAYER_HEIGHT = 1.78;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x80b9d8);
scene.fog = new THREE.Fog(0x80b9d8, 42, 92);
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, .04, 160);
scene.add(camera);
const renderer = new THREE.WebGLRenderer({ antialias:false, powerPreference:'high-performance', stencil:false, preserveDrawingBuffer:false });
renderer.setPixelRatio(Math.min(devicePixelRatio, .75));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = false;
document.body.prepend(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xeaf7ff, 0x5b4432, 2.25));
const sun = new THREE.DirectionalLight(0xfff0d1, 2.6); sun.position.set(-18,30,16); scene.add(sun);

const keys = Object.create(null);
const obstacles = [];
const actors = [];
const pickups = [];
const tracers = [];
const enemyRoots = [];
const ray = new THREE.Raycaster();
const tempA = new THREE.Vector3(), tempB = new THREE.Vector3(), tempC = new THREE.Vector3(), tempD = new THREE.Vector3();
let started=false, ended=false, mouseDown=false, lastFrame=performance.now(), matchStart=0;
let orangeScore=0, enemyScore=0, aiAccumulator=0, hudAccumulator=0, damageFlash=0;
let cameraMode='third', nearestPickup=null, activeWeapon='pistol', lastShotAt=0, reloadUntil=0, inventoryDirty=true;
let playerModelSource=null, playerClips=[], playerAvatar=null, playerMixer=null, playerActions={}, playerAction='idle';
let md2Geometry=null, factionTextures={}, cerberusSource=null, viewWeapon=null, thirdWeapon=null;
let feedLines=['Prepárate para la batalla.'];

const player={ position:new THREE.Vector3(0,0,11), yaw:0, pitch:-.08, health:PLAYER_MAX_HEALTH, alive:true, respawnAt:0, kills:0, deaths:0 };
const WEAPONS={
  pistol:{label:'PISTOLA CERBERUS',damage:34,cooldown:270,magazine:12,reload:950,spread:.004,pellets:1},
  rifle:{label:'RIFLE',damage:24,cooldown:105,magazine:30,reload:1250,spread:.009,pellets:1},
  shotgun:{label:'ESCOPETA',damage:18,cooldown:680,magazine:6,reload:1450,spread:.055,pellets:7}
};
const inventory={pistol:{owned:true,magazine:12,reserve:72},rifle:{owned:false,magazine:0,reserve:0},shotgun:{owned:false,magazine:0,reserve:0}};
const factions={
  orange:{color:0xff7b18,texture:'../skin-assets/bandas/skins/grok.jpg',label:'NARANJA'},
  red:{color:0xff3e3e,texture:'../skin-assets/bandas/skins/ctf_r.png',label:'ROJA'},
  blue:{color:0x2f79ff,texture:'../skin-assets/bandas/skins/ctf_b.png',label:'AZUL'},
  green:{color:0x27d064,texture:'../skin-assets/bandas/skins/freedom.png',label:'VERDE'},
  purple:{color:0xb04cf0,texture:'../skin-assets/bandas/skins/darkam.png',label:'MORADA'}
};

function setLoading(text, value){ui.loadText.textContent=text;ui.progress.style.width=`${Math.max(5,Math.min(100,value))}%`;}
function addFeed(text){feedLines.unshift(text);feedLines=feedLines.slice(0,6);ui.feed.innerHTML=feedLines.join('<br>');}
function makeLabel(text,color){const c=document.createElement('canvas');c.width=256;c.height=64;const x=c.getContext('2d');x.fillStyle='rgba(3,8,15,.86)';x.fillRect(0,5,256,54);x.strokeStyle=color;x.lineWidth=5;x.strokeRect(3,8,250,48);x.fillStyle='#fff';x.font='900 24px Arial';x.textAlign='center';x.fillText(text,128,41);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false}));s.scale.set(2.7,.68,1);return s;}
function addBox(x,y,z,w,h,d,material,solid=true){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);scene.add(mesh);if(solid)obstacles.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});return mesh;}
function buildArena(){
  const floorMat=new THREE.MeshStandardMaterial({color:0xc8aa79,roughness:1});
  const wallMat=new THREE.MeshStandardMaterial({color:0x9c745b,roughness:.9});
  const trimMat=new THREE.MeshStandardMaterial({color:0x6a4b39,roughness:.85});
  addBox(0,-.3,0,54,.6,42,floorMat,false);
  addBox(0,2.4,-20.5,54,4.8,1,wallMat);addBox(0,2.4,20.5,54,4.8,1,wallMat);
  addBox(-26.5,2.4,0,1,4.8,42,wallMat);addBox(26.5,2.4,0,1,4.8,42,wallMat);
  for(const x of [-18,-9,0,9,18]){
    const col=new THREE.Mesh(new THREE.CylinderGeometry(.65,.78,5.2,10),trimMat);col.position.set(x,2.6,-7.5);scene.add(col);obstacles.push({minX:x-.8,maxX:x+.8,minZ:-8.3,maxZ:-6.7});
    const col2=col.clone();col2.position.z=7.5;scene.add(col2);obstacles.push({minX:x-.8,maxX:x+.8,minZ:6.7,maxZ:8.3});
  }
  addBox(-12,1.0,0,4,2,5,trimMat);addBox(12,1.0,0,4,2,5,trimMat);addBox(0,1.0,-13,6,2,3,trimMat);addBox(0,1.0,13,6,2,3,trimMat);
  const centerRing=new THREE.Mesh(new THREE.RingGeometry(4.4,4.7,48),new THREE.MeshBasicMaterial({color:0xff7b18,side:THREE.DoubleSide}));centerRing.rotation.x=-Math.PI/2;centerRing.position.y=.02;scene.add(centerRing);
  const grid=new THREE.GridHelper(52,26,0x725236,0x8e704f);grid.position.y=.015;scene.add(grid);
}
function collides(x,z,r=PLAYER_RADIUS){if(x<ARENA.minX+r||x>ARENA.maxX-r||z<ARENA.minZ+r||z>ARENA.maxZ-r)return true;return obstacles.some(o=>x+r>o.minX&&x-r<o.maxX&&z+r>o.minZ&&z-r<o.maxZ);}
function tryMove(position,dx,dz,r=PLAYER_RADIUS){let moved=false;if(!collides(position.x+dx,position.z,r)){position.x+=dx;moved=true;}if(!collides(position.x,position.z+dz,r)){position.z+=dz;moved=true;}return moved;}
function findClip(clips,names){for(const n of names){const c=clips.find(v=>String(v.name).toLowerCase()===n);if(c)return c;}for(const n of names){const c=clips.find(v=>String(v.name).toLowerCase().includes(n));if(c)return c;}return clips[0]||null;}
function normalize(object,height=PLAYER_HEIGHT){object.position.set(0,0,0);object.rotation.set(0,0,0);object.scale.set(1,1,1);object.updateMatrixWorld(true);let box=new THREE.Box3().setFromObject(object);const scale=height/Math.max(.001,box.max.y-box.min.y);object.scale.setScalar(scale);object.updateMatrixWorld(true);box=new THREE.Box3().setFromObject(object);const center=box.getCenter(new THREE.Vector3());object.position.set(-center.x,-box.min.y,-center.z);}
async function loadAssets(){
  setLoading('Cargando personaje, bandas y armas locales…',35);
  const textureLoader=new THREE.TextureLoader();
  md2Geometry=await new MD2Loader().loadAsync('../skin-assets/bandas/ogro.md2');md2Geometry.computeBoundingBox();
  factionTextures=Object.fromEntries(await Promise.all(Object.entries(factions).map(async([id,info])=>{const t=await textureLoader.loadAsync(info.texture);t.colorSpace=THREE.SRGBColorSpace;return[id,t];})));
  const soldier=await new GLTFLoader().loadAsync('../models/gltf/Soldier.glb');playerModelSource=soldier.scene;playerClips=soldier.animations||[];
  try{const [obj,diffuse]=await Promise.all([new OBJLoader().loadAsync('../weapon-assets/cerberus/Cerberus.obj'),textureLoader.loadAsync('../weapon-assets/cerberus/Cerberus_A.jpg')]);diffuse.colorSpace=THREE.SRGBColorSpace;const mat=new THREE.MeshStandardMaterial({map:diffuse,roughness:.48,metalness:.32});obj.traverse(o=>{if(o.isMesh)o.material=mat;});normalize(obj,1.2);cerberusSource=obj;}catch(e){console.warn(e);}
}
function createPlayerAvatar(){if(playerAvatar)return;const model=cloneSkeleton(playerModelSource);normalize(model,PLAYER_HEIGHT);model.traverse(o=>{if(o.isMesh||o.isSkinnedMesh){o.castShadow=false;o.receiveShadow=false;o.frustumCulled=true;}});const root=new THREE.Group();root.add(model);scene.add(root);playerMixer=new THREE.AnimationMixer(model);playerActions={idle:playerMixer.clipAction(findClip(playerClips,['idle'])),walk:playerMixer.clipAction(findClip(playerClips,['walk'])),run:playerMixer.clipAction(findClip(playerClips,['run']))};playerActions.idle?.play();playerAvatar={root,model};}
function setPlayerAction(name){if(playerAction===name)return;playerActions[playerAction]?.fadeOut(.12);playerActions[name]?.reset().fadeIn(.12).play();playerAction=name;}
function createActor(faction,team,index){const material=new THREE.MeshLambertMaterial({map:factionTextures[faction],color:0xffffff});const mesh=new THREE.Mesh(md2Geometry,material);const box=md2Geometry.boundingBox;const scale=PLAYER_HEIGHT/Math.max(.001,box.max.y-box.min.y);mesh.scale.setScalar(scale);mesh.position.y=-box.min.y*scale;mesh.rotation.y=Math.PI;const root=new THREE.Group();root.add(mesh);const label=makeLabel(team==='enemy'?`ENEMIGO ${factions[faction].label}`:'ALIADO NARANJA',`#${new THREE.Color(factions[faction].color).getHexString()}`);label.position.y=2.15;root.add(label);const ring=new THREE.Mesh(new THREE.RingGeometry(.52,.68,20),new THREE.MeshBasicMaterial({color:factions[faction].color,side:THREE.DoubleSide,transparent:true,opacity:.9}));ring.rotation.x=-Math.PI/2;ring.position.y=.035;root.add(ring);const mixer=new THREE.AnimationMixer(mesh);const clips=md2Geometry.animations||[];const actions={idle:mixer.clipAction(findClip(clips,['stand','idle','cstand'])),run:mixer.clipAction(findClip(clips,['run','walk','cwalk'])),attack:mixer.clipAction(findClip(clips,['attack','crattack']))};actions.idle?.play();const actor={index,faction,team,root,mesh,label,ring,mixer,actions,action:'idle',health:100,alive:true,nextShot:0,respawnAt:0,target:null,speed:team==='enemy'?2.35:2.55,phase:Math.random()*6.28};root.traverse(o=>{if(o.isMesh){o.userData.actor=actor;o.frustumCulled=true;}});scene.add(root);actors.push(actor);if(team==='enemy')enemyRoots.push(root);return actor;}
function setActorAction(a,name){if(a.action===name)return;a.actions[a.action]?.fadeOut(.1);a.actions[name]?.reset().fadeIn(.1).play();a.action=name;}
const spawnOrange=[[-17,14],[-11,15],[-20,8]];const spawnEnemy=[[17,-14],[11,-15],[20,-8],[15,4],[3,-16],[-5,-15],[20,12],[7,15]];
function spawnActor(a){const list=a.team==='enemy'?spawnEnemy:spawnOrange;const p=list[a.index%list.length];a.root.position.set(p[0]+(Math.random()-.5)*2,0,p[1]+(Math.random()-.5)*2);a.health=100;a.alive=true;a.root.visible=true;a.nextShot=performance.now()+500+Math.random()*700;setActorAction(a,'idle');}
function setupTeams(){for(let i=0;i<2;i++)createActor('orange','orange',i);const f=['red','blue','green','purple'];for(let i=0;i<4;i++)createActor(f[i],'enemy',i);actors.forEach(spawnActor);}
function chooseTarget(a){if(a.team==='enemy')return player.alive?player:actors.find(v=>v.team==='orange'&&v.alive)||null;let best=null,bestSq=Infinity;for(const e of actors){if(e.team!=='enemy'||!e.alive)continue;const d=a.root.position.distanceToSquared(e.root.position);if(d<bestSq){best=e;bestSq=d;}}return best;}
function targetPos(t){return t===player?player.position:t.root.position;}
function drawTracer(from,to,color){const g=new THREE.BufferGeometry().setFromPoints([from,to]);const m=new THREE.LineBasicMaterial({color,transparent:true,opacity:.95});const l=new THREE.Line(g,m);scene.add(l);tracers.push({line:l,g,m,life:.1});}
function damagePlayer(amount){if(!player.alive||ended)return;player.health=Math.max(0,player.health-amount*.62);ui.health.textContent=Math.ceil(player.health);damageFlash=.48;if(player.health<=0){player.alive=false;player.deaths++;enemyScore+=10;player.respawnAt=performance.now()+2400;updateScore();addFeed('Las bandas rivales te eliminaron.');}}
function damageActor(a,amount,byPlayer=false){if(!a?.alive||ended)return;a.health-=amount;if(a.health>0)return;a.alive=false;a.root.visible=false;a.respawnAt=performance.now()+3300;if(a.team==='enemy'){orangeScore+=byPlayer?10:7;if(byPlayer)player.kills++;dropWeapon(a.root.position);addFeed(`${byPlayer?'Tú':'Un aliado'} eliminó a la banda ${factions[a.faction].label}.`);}else{enemyScore+=10;addFeed('Un aliado naranja fue eliminado.');}updateScore();}
function updateActors(dt,now){for(const a of actors){a.mixer.update(dt);if(!a.alive){if(now>=a.respawnAt&&!ended)spawnActor(a);continue;}const target=chooseTarget(a);if(!target){setActorAction(a,'idle');continue;}const p=targetPos(target);tempA.subVectors(p,a.root.position);tempA.y=0;const dist=tempA.length();if(dist>8.5){tempA.normalize();const move=a.speed*dt;tryMove(a.root.position,tempA.x*move,tempA.z*move,.44);const yaw=Math.atan2(tempA.x,tempA.z)+Math.PI;a.root.rotation.y+=Math.atan2(Math.sin(yaw-a.root.rotation.y),Math.cos(yaw-a.root.rotation.y))*Math.min(1,dt*10);setActorAction(a,'run');}else{setActorAction(a,'attack');if(now>=a.nextShot){a.nextShot=now+650+Math.random()*450;const from=a.root.position.clone().add(new THREE.Vector3(0,1.2,0));const to=p.clone().add(new THREE.Vector3(0,1.1,0));drawTracer(from,to,a.team==='orange'?0xffa040:0x66b9ff);const accuracy=Math.max(.45,.82-dist*.025);if(Math.random()<accuracy){if(target===player)damagePlayer(5+Math.random()*3);else damageActor(target,8+Math.random()*5,false);}}}}}
function createFallbackWeapon(id){const g=new THREE.Group(),dark=new THREE.MeshStandardMaterial({color:0x20252b,metalness:.3,roughness:.5}),wood=new THREE.MeshStandardMaterial({color:0x75431f});if(id==='pistol'){g.add(new THREE.Mesh(new THREE.BoxGeometry(.72,.18,.16),dark));const h=new THREE.Mesh(new THREE.BoxGeometry(.17,.42,.16),dark);h.position.set(.2,-.24,0);g.add(h);}else{const b=new THREE.Mesh(new THREE.BoxGeometry(1.35,.16,.16),dark);g.add(b);const s=new THREE.Mesh(new THREE.BoxGeometry(.52,.25,.22),wood);s.position.x=.86;g.add(s);}return g;}
function weaponVisual(id,view=false){let v=id==='pistol'&&cerberusSource?cerberusSource.clone(true):createFallbackWeapon(id);if(view)v.traverse(o=>{if(o.isMesh){const mats=Array.isArray(o.material)?o.material:[o.material];const c=mats.map(m=>{const n=m.clone();n.depthTest=false;n.depthWrite=false;return n;});o.material=Array.isArray(o.material)?c:c[0];o.renderOrder=9999;o.frustumCulled=false;}});return v;}
function attachWeapons(){viewWeapon?.parent?.remove(viewWeapon);viewWeapon=weaponVisual(activeWeapon,true);viewWeapon.scale.setScalar(activeWeapon==='pistol'?.55:.7);viewWeapon.position.set(.42,-.36,-.78);viewWeapon.rotation.set(-.05,-.18,0);camera.add(viewWeapon);thirdWeapon?.parent?.remove(thirdWeapon);thirdWeapon=weaponVisual(activeWeapon,false);thirdWeapon.scale.setScalar(activeWeapon==='pistol'?.25:.36);thirdWeapon.position.set(.36,1.1,-.2);thirdWeapon.rotation.set(0,-Math.PI/2,.1);playerAvatar?.root.add(thirdWeapon);updateCameraMode();}
function dropWeapon(position){const ids=['pistol','rifle','shotgun'];const id=ids[Math.floor(Math.random()*ids.length)];const group=new THREE.Group();const v=weaponVisual(id);v.scale.setScalar(id==='pistol'?.45:.65);group.add(v);group.position.copy(position);group.position.y=.75;scene.add(group);pickups.push({id,group,baseY:.75,phase:Math.random()*6.28});}
function collectPickup(p){const st=inventory[p.id],spec=WEAPONS[p.id];st.owned=true;st.magazine=Math.max(st.magazine,spec.magazine);st.reserve+=spec.magazine*3;activeWeapon=p.id;p.group.parent?.remove(p.group);pickups.splice(pickups.indexOf(p),1);nearestPickup=null;inventoryDirty=true;attachWeapons();addFeed(`${spec.label} recogida.`);}
function updatePickups(t){nearestPickup=null;let best=2.4*2.4;for(const p of pickups){p.group.rotation.y+=.025;p.group.position.y=p.baseY+Math.sin(t*2.4+p.phase)*.14;const d=p.group.position.distanceToSquared(player.position);if(d<best){best=d;nearestPickup=p;}}ui.prompt.style.display=nearestPickup?'block':'none';if(nearestPickup)ui.prompt.textContent=`E · RECOGER ${WEAPONS[nearestPickup.id].label}`;}
function equip(id){if(!inventory[id]?.owned)return;activeWeapon=id;reloadUntil=0;inventoryDirty=true;attachWeapons();}
function reload(now=performance.now()){const st=inventory[activeWeapon],sp=WEAPONS[activeWeapon];if(now<reloadUntil||st.magazine>=sp.magazine||st.reserve<=0)return;reloadUntil=now+sp.reload;inventoryDirty=true;}
function finishReload(now){if(!reloadUntil||now<reloadUntil)return;const st=inventory[activeWeapon],sp=WEAPONS[activeWeapon],n=Math.min(sp.magazine-st.magazine,st.reserve);st.magazine+=n;st.reserve-=n;reloadUntil=0;inventoryDirty=true;}
function shoot(now){if(!started||ended||!player.alive)return;const sp=WEAPONS[activeWeapon],st=inventory[activeWeapon];if(now<reloadUntil||now-lastShotAt<sp.cooldown)return;if(st.magazine<=0){reload(now);return;}lastShotAt=now;st.magazine--;inventoryDirty=true;camera.updateMatrixWorld(true);for(let i=0;i<sp.pellets;i++){ray.setFromCamera(new THREE.Vector2((Math.random()-.5)*sp.spread,(Math.random()-.5)*sp.spread),camera);ray.far=100;const hits=ray.intersectObjects(enemyRoots,true);const hit=hits.find(h=>h.object?.userData?.actor?.alive);const end=hit?hit.point.clone():ray.ray.origin.clone().addScaledVector(ray.ray.direction,70);drawTracer(ray.ray.origin.clone().addScaledVector(ray.ray.direction,.45),end,0xffe29a);if(hit){const a=hit.object.userData.actor;damageActor(a,sp.damage*(hit.point.y-a.root.position.y>1.35?1.65:1),true);ui.hit.style.opacity='1';clearTimeout(ui.hit._t);ui.hit._t=setTimeout(()=>ui.hit.style.opacity='0',90);}}if(st.magazine<=0&&st.reserve>0)setTimeout(()=>reload(),180);}
function updateInventory(){if(!inventoryDirty)return;inventoryDirty=false;const stateKey=['pistol','rifle','shotgun'].map((id,i)=>`${id}:${inventory[id].owned}:${inventory[id].magazine}:${inventory[id].reserve}:${activeWeapon===id}`).join('|');if(ui.inventory.dataset.state!==stateKey){ui.inventory.dataset.state=stateKey;ui.inventory.innerHTML=['pistol','rifle','shotgun'].map((id,i)=>{const s=inventory[id];return `<div class="slot ${id===activeWeapon?'active':''} ${s.owned?'':'locked'}"><b>${i+1} · ${WEAPONS[id].label}</b>${s.owned?`${s.magazine} / ${s.reserve}`:'BLOQUEADA'}</div>`;}).join('');}const st=inventory[activeWeapon];ui.ammo.textContent=`${WEAPONS[activeWeapon].label} · ${reloadUntil?'RECARGANDO':`${st.magazine} / ${st.reserve}`}`;ui.kills.textContent=`BAJAS: ${player.kills} · MUERTES: ${player.deaths}`;}
function updateScore(){ui.orangeScore.textContent=orangeScore;ui.enemyScore.textContent=enemyScore;inventoryDirty=true;if(orangeScore>=SCORE_LIMIT||enemyScore>=SCORE_LIMIT)endMatch();}
function spawnPlayer(){player.position.set(-18,0,14);player.yaw=-.65;player.pitch=-.08;player.health=PLAYER_MAX_HEALTH;player.alive=true;ui.health.textContent=String(PLAYER_MAX_HEALTH);if(playerAvatar)playerAvatar.root.visible=cameraMode==='third';}
function updatePlayer(dt){if(!player.alive)return;const f=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0),s=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);const moving=Boolean(f||s),running=Boolean(keys.ShiftLeft||keys.ShiftRight);if(moving){const forward=tempA.set(-Math.sin(player.yaw),0,-Math.cos(player.yaw));const right=tempB.set(Math.cos(player.yaw),0,-Math.sin(player.yaw));const dir=tempC.set(0,0,0).addScaledVector(forward,f).addScaledVector(right,s).normalize();const speed=(running?5.8:3.6)*dt;tryMove(player.position,dir.x*speed,dir.z*speed);const yaw=Math.atan2(dir.x,dir.z)+Math.PI;playerAvatar.root.rotation.y+=Math.atan2(Math.sin(yaw-playerAvatar.root.rotation.y),Math.cos(yaw-playerAvatar.root.rotation.y))*Math.min(1,dt*13);}playerAvatar.root.position.copy(player.position);playerAvatar.root.visible=cameraMode==='third';setPlayerAction(moving?(running?'run':'walk'):'idle');playerMixer?.update(dt*(running?1.08:1));}
function updateCamera(dt){const eye=tempA.copy(player.position).add(new THREE.Vector3(0,1.58,0));const view=tempB.set(-Math.sin(player.yaw)*Math.cos(player.pitch),Math.sin(player.pitch),-Math.cos(player.yaw)*Math.cos(player.pitch)).normalize();if(cameraMode==='first'){camera.position.copy(eye);camera.lookAt(tempC.copy(eye).addScaledVector(view,12));}else{const flat=tempC.set(view.x,0,view.z).normalize();const desired=tempD.copy(eye).addScaledVector(flat,-4.4).add(new THREE.Vector3(0,1.0,0));camera.position.lerp(desired,1-Math.exp(-dt*12));camera.lookAt(eye.clone().add(new THREE.Vector3(0,.3,0)).addScaledVector(view,7));}if(viewWeapon)viewWeapon.visible=cameraMode==='first';if(thirdWeapon)thirdWeapon.visible=cameraMode==='third';}
function updateCameraMode(){ui.cameraMode.textContent=`CÁMARA: ${cameraMode==='first'?'PRIMERA PERSONA':'TERCERA PERSONA'} · V PARA CAMBIAR`;if(playerAvatar)playerAvatar.root.visible=cameraMode==='third'&&player.alive;if(viewWeapon)viewWeapon.visible=cameraMode==='first';if(thirdWeapon)thirdWeapon.visible=cameraMode==='third';}
function toggleCamera(){cameraMode=cameraMode==='first'?'third':'first';updateCameraMode();updateCamera(1);}
function updateTracers(dt){for(let i=tracers.length-1;i>=0;i--){const t=tracers[i];t.life-=dt;t.m.opacity=Math.max(0,t.life/.1);if(t.life<=0){t.line.parent?.remove(t.line);t.g.dispose();t.m.dispose();tracers.splice(i,1);}}}
function formatTime(sec){const v=Math.max(0,Math.ceil(sec));return `${String(Math.floor(v/60)).padStart(2,'0')}:${String(v%60).padStart(2,'0')}`;}
function endMatch(){if(ended)return;ended=true;document.exitPointerLock?.();const tie=orangeScore===enemyScore,won=orangeScore>enemyScore;ui.resultTitle.textContent=tie?'EMPATE':won?'¡BANDA NARANJA GANADORA!':'LAS BANDAS RIVALES GANARON';ui.resultTitle.style.color=tie?'#fff':won?'#ff8a24':'#75b7ff';ui.resultText.textContent=`Resultado: Naranja ${orangeScore} – Rivales ${enemyScore}. Tus bajas: ${player.kills}; muertes: ${player.deaths}.`;ui.result.style.display='grid';}
function startMatch(){for(const p of pickups)p.group.parent?.remove(p.group);pickups.length=0;inventory.pistol={owned:true,magazine:12,reserve:72};inventory.rifle={owned:false,magazine:0,reserve:0};inventory.shotgun={owned:false,magazine:0,reserve:0};activeWeapon='pistol';orangeScore=0;enemyScore=0;player.kills=0;player.deaths=0;ended=false;started=true;matchStart=performance.now();ui.loading.style.display='none';ui.result.style.display='none';actors.forEach(spawnActor);spawnPlayer();attachWeapons();updateScore();updateCameraMode();renderer.domElement.requestPointerLock?.();addFeed('Batalla iniciada: la banda naranja contra las bandas rivales.');}
function returnCity(){location.href='../index.html?from=game-of-crew';}

ui.play.addEventListener('click',startMatch);ui.restart.addEventListener('click',startMatch);ui.returnCity.addEventListener('click',returnCity);ui.exit.addEventListener('click',returnCity);ui.resume.addEventListener('click',()=>renderer.domElement.requestPointerLock?.());
renderer.domElement.addEventListener('click',()=>{if(started&&!ended&&document.pointerLockElement!==renderer.domElement)renderer.domElement.requestPointerLock?.();});
document.addEventListener('pointerlockchange',()=>{ui.resume.style.display=started&&!ended&&document.pointerLockElement!==renderer.domElement?'block':'none';});
document.addEventListener('mousemove',e=>{if(document.pointerLockElement!==renderer.domElement||!player.alive)return;player.yaw-=e.movementX*.0022;player.pitch=THREE.MathUtils.clamp(player.pitch-e.movementY*.0019,-1.05,.72);});
renderer.domElement.addEventListener('pointerdown',e=>{if(e.button!==0||!started||ended)return;e.preventDefault();mouseDown=true;if(document.pointerLockElement!==renderer.domElement)renderer.domElement.requestPointerLock?.();shoot(performance.now());});
document.addEventListener('pointerup',e=>{if(e.button===0)mouseDown=false;});
document.addEventListener('keydown',e=>{keys[e.code]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(e.repeat)return;if(e.code==='KeyV')toggleCamera();if(e.code==='KeyE'&&nearestPickup)collectPickup(nearestPickup);if(e.code==='KeyR')reload();if(e.code==='Digit1')equip('pistol');if(e.code==='Digit2')equip('rifle');if(e.code==='Digit3')equip('shotgun');if(e.code==='KeyF'||e.code==='ControlLeft')shoot(performance.now());},{passive:false});
document.addEventListener('keyup',e=>keys[e.code]=false);window.addEventListener('blur',()=>{Object.keys(keys).forEach(k=>keys[k]=false);mouseDown=false;});window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,.75));});

async function boot(){try{buildArena();setLoading('Cargando recursos locales…',20);await loadAssets();setLoading('Creando equipos visibles…',78);createPlayerAvatar();setupTeams();spawnPlayer();attachWeapons();updateInventory();ui.warning.textContent='Modo Sponza fluido: escenario local optimizado, sin descargas durante la partida.';setLoading('Todo listo.',100);ui.play.disabled=false;ui.play.textContent='ENTRAR A GAME OF CREW';try{renderer.compile(scene,camera);}catch{}}catch(e){console.error(e);ui.warning.textContent='No se pudieron cargar los modelos locales. Extrae el ZIP completo.';setLoading('Error de recursos.',100);}}
boot();

renderer.setAnimationLoop(()=>{const now=performance.now(),dt=Math.min(.04,Math.max(0,(now-lastFrame)/1000));lastFrame=now;if(started&&!ended){if(!player.alive&&now>=player.respawnAt)spawnPlayer();finishReload(now);if(mouseDown)shoot(now);updatePlayer(dt);aiAccumulator+=dt;if(aiAccumulator>=1/10){const step=Math.min(.1,aiAccumulator);aiAccumulator=0;updateActors(step,now);}updatePickups(now*.001);updateTracers(dt);updateCamera(dt);const remain=MATCH_SECONDS-(now-matchStart)/1000;ui.timer.textContent=formatTime(remain);if(remain<=0)endMatch();hudAccumulator+=dt;if(hudAccumulator>.18){hudAccumulator=0;updateInventory();}if(damageFlash>0){damageFlash=Math.max(0,damageFlash-dt*2.4);ui.damage.style.opacity=damageFlash;}}else updateCamera(dt);renderer.render(scene,camera);});
