/**
 * GTA MANUCHO V84 — código del proyecto.
 * Creado e integrado por Roberto Manuel Jara Peche (GitHub: ma-nucho-pro).
 * ARKEA AI / Manucho · conserva LICENSE, NOTICE.md y estos créditos al reutilizar.
 */
import * as THREE from './bosque/libs/three.module.js';

const WORLD_SCALE = 16;
const STORAGE_KEY = 'vice_city_v67_game_of_crew_return';
let game = null;
let terminal = null;
let prompt = null;
let installed = false;
let lastCheck = 0;

function groundAt(x,z,fallback=0){
  try{
    const y=game?.getGroundY?.(x,fallback+700,z,false);
    return Number.isFinite(y)?y:fallback;
  }catch{return fallback;}
}
function makeSign(text){
  const canvas=document.createElement('canvas');canvas.width=720;canvas.height=180;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#07121c';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle='#55d8ff';ctx.lineWidth=10;ctx.strokeRect(7,7,canvas.width-14,canvas.height-14);
  ctx.fillStyle='#f4fbff';ctx.font='900 68px Arial Narrow,Arial,sans-serif';
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,canvas.width/2,canvas.height/2);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(260,65),
    new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide})
  );
}
function buildTerminal(){
  const lx=2100,lz=1650,x=lx*WORLD_SCALE,z=lz*WORLD_SCALE,y=groundAt(x,z,0);
  const root=new THREE.Group();root.name='MUNDO_BARCO_TERMINAL_V82';root._isAlwaysVisible=true;
  const wall=new THREE.MeshLambertMaterial({color:0x102c3e});
  const trim=new THREE.MeshLambertMaterial({color:0x39b9dc,emissive:0x0b6380,emissiveIntensity:.26});
  const floor=new THREE.Mesh(new THREE.BoxGeometry(250,8,190),wall);floor.position.y=4;
  const back=new THREE.Mesh(new THREE.BoxGeometry(250,110,14),wall);back.position.set(0,55,-88);
  const left=new THREE.Mesh(new THREE.BoxGeometry(14,110,176),wall);left.position.set(-118,55,0);
  const right=left.clone();right.position.x=118;
  const roof=new THREE.Mesh(new THREE.BoxGeometry(262,12,202),trim);roof.position.y=116;
  const gateL=new THREE.Mesh(new THREE.BoxGeometry(74,110,14),wall);gateL.position.set(-86,55,88);
  const gateR=gateL.clone();gateR.position.x=86;
  const glow=new THREE.Mesh(
    new THREE.PlaneGeometry(70,96),
    new THREE.MeshBasicMaterial({color:0x43dfff,transparent:true,opacity:.34,side:THREE.DoubleSide})
  );
  glow.position.set(0,50,96);glow.rotation.y=Math.PI;
  const sign=makeSign('MUNDO BARCO');sign.position.set(0,148,92);sign.rotation.y=Math.PI;
  root.add(floor,back,left,right,roof,gateL,gateR,glow,sign);
  root.position.set(x,y,z);
  root.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;}});
  game.city.add(root);
  if(typeof game.addObstacle==='function'){
    game.addObstacle(x,z-88,250,14,110,y);
    game.addObstacle(x-118,z,14,176,110,y);
    game.addObstacle(x+118,z,14,176,110,y);
  }
  terminal={root,kind:'mundo-barco',label:'MUNDO BARCO',door:new THREE.Vector3(x,y+4,z+132),respawn:new THREE.Vector3(x,y+4,z+178)};
  window.__BOAT_WORLD_TERMINAL__=terminal;
  window.dispatchEvent(new CustomEvent('boat-world-terminal-ready'));
}
function ensurePrompt(){
  prompt=document.createElement('div');
  prompt.style.cssText='position:fixed;left:50%;bottom:150px;transform:translateX(-50%);z-index:15500;padding:9px 15px;border-radius:9px;background:rgba(3,12,20,.94);border:1px solid #56dcff;color:#eafbff;font:900 12px Arial,sans-serif;letter-spacing:.08em;display:none;pointer-events:none';
  prompt.textContent='E · ENTRAR A MUNDO BARCO';
  document.body.appendChild(prompt);
}
function near(){
  if(!terminal||!game?.playerContainer||game.activeCar||game.activeBoat||game.activeRiddenHorse)return false;
  return terminal.door.distanceToSquared(game.playerContainer.position)<145*145;
}
function saveReturn(){
  try{
    const p=game.playerContainer.position;
    localStorage.setItem(STORAGE_KEY,JSON.stringify({
      x:p.x,y:p.y,z:p.z,yaw:game.playerContainer.rotation.y||0,
      health:Number(game.health||100),armor:Number(game.armor||0),money:Number(game.money||0)
    }));
  }catch{}
}
function enter(){
  saveReturn();
  window.__VICE_ZONE_TRANSITION__=true;
  if(prompt)prompt.style.display='none';
  setTimeout(()=>location.href='./mundo-barco/index.html',120);
}
function keydown(event){
  if(event.repeat||event.code!=='KeyE'||!near())return;
  event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();enter();
}
function frame(now=performance.now()){
  requestAnimationFrame(frame);
  if(document.hidden)return;
  if(now-lastCheck<220)return;lastCheck=now;
  if(prompt)prompt.style.display=near()?'block':'none';
}
function install(){
  if(installed)return;
  game=window.__VICE_CITY_GAME__;
  if(!game?.city||!game?.playerContainer)return;
  installed=true;buildTerminal();ensurePrompt();
  window.addEventListener('keydown',keydown,true);
  requestAnimationFrame(frame);
}
const timer=setInterval(()=>{
  game=window.__VICE_CITY_GAME__||game;
  if(!game?.city||!game?.playerContainer)return;
  clearInterval(timer);install();
},150);
setTimeout(()=>clearInterval(timer),30000);
