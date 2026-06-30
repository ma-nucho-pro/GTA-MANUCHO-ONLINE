window.__GTA_VENTARA_MODULE_STARTED__ = true;
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';

const statusNode = document.getElementById('status');
const helpNode = document.getElementById('help');
const progressNode = document.querySelector('#progress i');
const errorNode = document.getElementById('error');
const setStatus=(text,percent)=>{statusNode.textContent=text;if(Number.isFinite(percent))progressNode.style.width=`${Math.max(4,Math.min(100,percent))}%`};
const showError=(message)=>{console.error(message);errorNode.textContent=String(message);errorNode.style.display='block';setTimeout(()=>errorNode.style.display='none',7000)};
window.addEventListener('error',e=>showError(e.error?.message||e.message));
window.addEventListener('unhandledrejection',e=>showError(e.reason?.message||e.reason||'Error de carga'));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87c9ed);
scene.fog = new THREE.FogExp2(0x8fcbe8, 0.00012);
const camera = new THREE.PerspectiveCamera(58,innerWidth/innerHeight,0.1,12000);
camera.position.set(-500,110,150);
const renderer = new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xd8f3ff,0x34526b,2.2));
const sun=new THREE.DirectionalLight(0xfff3d4,3.5);sun.position.set(-700,900,350);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-1400;sun.shadow.camera.right=1400;sun.shadow.camera.top=1400;sun.shadow.camera.bottom=-1400;scene.add(sun);
const sunBall=new THREE.Mesh(new THREE.SphereGeometry(55,24,16),new THREE.MeshBasicMaterial({color:0xfff1b4}));sunBall.position.set(-1300,620,-2400);scene.add(sunBall);

const waterUniforms={uTime:{value:0},uDeep:{value:new THREE.Color(0x073b63)},uShallow:{value:new THREE.Color(0x168fbb)},uSun:{value:new THREE.Vector3(-.4,.7,-.5).normalize()}};
const oceanGeo=new THREE.PlaneGeometry(9000,9000,180,180);
const oceanMat=new THREE.ShaderMaterial({uniforms:waterUniforms,side:THREE.DoubleSide,vertexShader:`
uniform float uTime; varying float vWave; varying vec3 vWorld;
void main(){vec3 p=position;float w=sin(p.x*.012+uTime*1.25)*2.0+sin(p.y*.018-uTime*.85)*1.3+sin((p.x+p.y)*.006+uTime*.45)*2.4;p.z+=w;vWave=w;vec4 world=modelMatrix*vec4(p,1.0);vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}`,
fragmentShader:`
uniform vec3 uDeep;uniform vec3 uShallow;varying float vWave;varying vec3 vWorld;
void main(){float bands=.5+.5*sin(vWorld.x*.022+vWorld.z*.018+vWave*.8);vec3 col=mix(uDeep,uShallow,.42+vWave*.045);col+=bands*.025;gl_FragColor=vec4(col,1.0);}`});
const ocean=new THREE.Mesh(oceanGeo,oceanMat);ocean.rotation.x=-Math.PI/2;ocean.position.y=-2;ocean.receiveShadow=true;scene.add(ocean);

const world=new THREE.Group();scene.add(world);
const boatRoot=new THREE.Group();boatRoot.position.set(-600,0,0);boatRoot.rotation.y=Math.PI;world.add(boatRoot);
const fallbackBoat=new THREE.Group();
const hull=new THREE.Mesh(new THREE.BoxGeometry(28,9,85),new THREE.MeshStandardMaterial({color:0x5b2c1e,roughness:.7,metalness:.05}));hull.position.y=5;hull.castShadow=true;fallbackBoat.add(hull);
const deck=new THREE.Mesh(new THREE.BoxGeometry(25,2,62),new THREE.MeshStandardMaterial({color:0xb78245,roughness:.85}));deck.position.set(0,10,-2);deck.castShadow=true;fallbackBoat.add(deck);
const cabin=new THREE.Mesh(new THREE.BoxGeometry(14,10,18),new THREE.MeshStandardMaterial({color:0xd8d0bd,roughness:.65}));cabin.position.set(0,16,-10);cabin.castShadow=true;fallbackBoat.add(cabin);boatRoot.add(fallbackBoat);

const dock=new THREE.Group();dock.position.set(-555,3,0);world.add(dock);
const dockMat=new THREE.MeshStandardMaterial({color:0x76502e,roughness:.9});
const dockBase=new THREE.Mesh(new THREE.BoxGeometry(65,4,115),dockMat);dockBase.castShadow=true;dockBase.receiveShadow=true;dock.add(dockBase);
for(let z=-50;z<=50;z+=10){const plank=new THREE.Mesh(new THREE.BoxGeometry(62,1,6),new THREE.MeshStandardMaterial({color:z%20===0?0x9c7042:0x865f38,roughness:.95}));plank.position.set(0,2.5,z);plank.castShadow=true;dock.add(plank)}

function createFallbackCharacter(){
 const g=new THREE.Group(),uniform=new THREE.MeshStandardMaterial({color:0x304b36,roughness:.8}),dark=new THREE.MeshStandardMaterial({color:0x121a20,roughness:.75}),skin=new THREE.MeshStandardMaterial({color:0xb77855,roughness:.88});
 const torso=new THREE.Mesh(new THREE.BoxGeometry(2.6,4,1.6),uniform);torso.position.y=6;g.add(torso);
 const head=new THREE.Mesh(new THREE.SphereGeometry(1.05,14,10),skin);head.position.y=9;g.add(head);
 const helmet=new THREE.Mesh(new THREE.SphereGeometry(1.18,14,8,0,Math.PI*2,0,Math.PI/2),dark);helmet.position.y=9.5;g.add(helmet);
 const limb=(x,y,h,mat)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(.48,.42,h,8),mat);m.position.set(x,y,0);m.castShadow=true;g.add(m);return m};
 const armL=limb(-1.8,5.9,3.9,uniform),armR=limb(1.8,5.9,3.9,uniform),legL=limb(-.72,2.5,4.6,dark),legR=limb(.72,2.5,4.6,dark);g.userData.rig={armL,armR,legL,legR};g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});return g
}
let player=createFallbackCharacter();world.add(player);player.position.set(-520,5,0);player.rotation.y=-Math.PI/2;
let playerMixer=null,playerActions={},currentAction='Idle';

const draco=new DRACOLoader();draco.setDecoderPath('./libs/draco/');
const loader=new GLTFLoader();loader.setDRACOLoader(draco);
const loadGLB=(url)=>loader.loadAsync(url);
function setupShadows(root){root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material?.map)o.material.map.colorSpace=THREE.SRGBColorSpace}})}

let loaded=0;const totalLoads=8;
function completed(label){loaded++;setStatus(label,12+loaded/totalLoads*88)}
async function loadOriginalBoat(){try{const gltf=await loadGLB('./models/dutch_ship_medium_2k.glb');const model=gltf.scene;setupShadows(model);model.scale.setScalar(15);model.position.set(0,0,0);model.rotation.y=0;boatRoot.add(model);fallbackBoat.visible=false;completed('Barco original cargado')}catch(e){showError('El barco original no pudo cargarse; se mantiene el barco visible de respaldo.');completed('Barco de respaldo listo')}}
async function loadMainIsland(){try{const gltf=await loadGLB('./models/island.glb');const island=gltf.scene;setupShadows(island);island.position.set(500,70,-500);island.scale.setScalar(20);island.rotation.set(Math.PI/2,-Math.PI,0);world.add(island);completed('Isla original cargada')}catch(e){showError('No se pudo cargar la isla original.');completed('Océano activo')}}
async function loadBuoys(){try{const gltf=await loadGLB('./models/buoy.glb');setupShadows(gltf.scene);for(let i=0;i<12;i++){const b=gltf.scene.clone(true),a=i/12*Math.PI*2;b.scale.setScalar(5);b.position.set(500+1000*Math.cos(a),0,-500+1000*Math.sin(a));world.add(b)}completed('Boyas originales cargadas')}catch(e){completed('Boyas omitidas')}}
function randomAround(cx,cz,r,minDist=0){const a=Math.random()*Math.PI*2,d=minDist+Math.random()*(r-minDist);return new THREE.Vector3(cx+Math.cos(a)*d,0,cz+Math.sin(a)*d)}
async function loadRocks(){try{const gltf=await loadGLB('./models/rocks.glb');setupShadows(gltf.scene);for(let i=0;i<24;i++){const r=gltf.scene.clone(true),p=randomAround(500,-500,780,250);r.position.set(p.x,-92,p.z);const sc=55+Math.random()*55;r.scale.setScalar(sc);r.rotation.y=Math.random()*Math.PI*2;world.add(r)}completed('Rocas originales cargadas')}catch(e){completed('Rocas omitidas')}}
async function loadVegetation(){try{const [a,b,c]=await Promise.all([loadGLB('./models/seaweed.glb'),loadGLB('./models/seaweed_tall.glb'),loadGLB('./models/grass.glb')]);[a.scene,b.scene,c.scene].forEach(setupShadows);for(let i=0;i<42;i++){const src=i%3===0?b.scene:i%2===0?a.scene:c.scene,v=src.clone(true),p=randomAround(500,-500,720,160);v.position.set(p.x,-98,p.z);v.scale.setScalar(src===c.scene?1.4+Math.random():10+Math.random()*10);v.rotation.y=Math.random()*Math.PI*2;world.add(v)}completed('Vegetación submarina cargada')}catch(e){completed('Vegetación omitida')}}
let fish=[];
async function loadFish(){try{const gltf=await loadGLB('./models/fish.glb');setupShadows(gltf.scene);for(let i=0;i<10;i++){const f=cloneSkinned(gltf.scene),p=randomAround(500,-500,480,80),sc=9+Math.random()*8;f.position.set(p.x,-30-Math.random()*35,p.z);f.scale.setScalar(sc);f.userData={angle:Math.random()*Math.PI*2,speed:6+Math.random()*7,radius:80+Math.random()*380};world.add(f);fish.push(f);if(gltf.animations?.length){const mix=new THREE.AnimationMixer(f);mix.clipAction(gltf.animations[0]).play();f.userData.mixer=mix}}completed('Peces originales cargados')}catch(e){completed('Peces omitidos')}}
async function loadCharacter(){try{const gltf=await loadGLB('./models/personaje_navegante.glb');const char=gltf.scene;setupShadows(char);char.scale.setScalar(8.5);char.position.copy(player.position);char.rotation.copy(player.rotation);world.remove(player);player=char;world.add(player);if(gltf.animations?.length){playerMixer=new THREE.AnimationMixer(player);const clips=gltf.animations;const pick=(name,index)=>clips.find(c=>c.name.toLowerCase()===name.toLowerCase())||clips[index];[['Idle',pick('Idle',0)],['Run',pick('Run',1)],['Walk',pick('Walk',3)||pick('Walk',2)]].forEach(([n,c])=>{if(c)playerActions[n]=playerMixer.clipAction(c)});playerActions.Idle?.play()}completed('Personaje Three.js cargado')}catch(e){completed('Personaje visible de respaldo listo')}}
async function loadHDR(){try{const tex=await new THREE.TextureLoader().loadAsync('./hdris/citrus_orchard_road_puresky_4k.jpg');tex.colorSpace=THREE.SRGBColorSpace;tex.mapping=THREE.EquirectangularReflectionMapping;scene.environment=tex;completed('Iluminación original cargada')}catch(e){completed('Iluminación base activa')}}

const keys=Object.create(null);let mode='foot',boatSpeed=0,playerYaw=-Math.PI/2,drag=false,lastX=0,lastY=0,orbitYaw=2.45,orbitPitch=.38,orbitDistance=145;
addEventListener('keydown',e=>{keys[e.code]=true;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','KeyF'].includes(e.code))e.preventDefault();if(e.code==='KeyF'&&!e.repeat)toggleBoat()});
addEventListener('keyup',e=>keys[e.code]=false);addEventListener('blur',()=>Object.keys(keys).forEach(k=>keys[k]=false));
addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX;lastY=e.clientY});addEventListener('pointermove',e=>{if(!drag)return;orbitYaw-=(e.clientX-lastX)*.005;orbitPitch=THREE.MathUtils.clamp(orbitPitch+(e.clientY-lastY)*.003,.12,1.05);lastX=e.clientX;lastY=e.clientY});addEventListener('pointerup',()=>drag=false);addEventListener('wheel',e=>orbitDistance=THREE.MathUtils.clamp(orbitDistance+e.deltaY*.08,55,260),{passive:true});
function toggleBoat(){
 if(mode==='foot'){
   const d=player.position.distanceTo(boatRoot.position);if(d>95){setStatus(`Acércate más al barco (${Math.round(d)} m)`,100);return}
   mode='driving';boatSpeed=0;helpNode.textContent='W/S acelerar · A/D girar · F bajar del barco · ratón mover cámara';setStatus('Manejando el barco',100)
 }else{
   mode='foot';const side=new THREE.Vector3(42,5,0).applyQuaternion(boatRoot.quaternion);player.position.copy(boatRoot.position).add(side);helpNode.textContent='WASD caminar · Shift correr · F subir al barco';setStatus('Bajaste del barco',100)
 }
}
function setPlayerAction(name){if(name===currentAction)return;if(playerActions[name]){playerActions[currentAction]?.fadeOut(.15);playerActions[name].reset().fadeIn(.15).play()}currentAction=name}
function updatePlayer(dt){
 const x=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),z=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0),moving=x||z,run=keys.ShiftLeft||keys.ShiftRight;
 if(moving){const len=Math.hypot(x,z),speed=run?38:20;const camForward=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);camForward.y=0;camForward.normalize();const right=new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion);right.y=0;right.normalize();const move=new THREE.Vector3().addScaledVector(right,x/len).addScaledVector(camForward,-z/len).normalize();player.position.addScaledVector(move,speed*dt);player.position.x=THREE.MathUtils.clamp(player.position.x,-640,-510);player.position.z=THREE.MathUtils.clamp(player.position.z,-55,55);player.position.y=5;playerYaw=Math.atan2(move.x,move.z);player.rotation.y=playerYaw;setPlayerAction(run?'Run':'Walk')}else setPlayerAction('Idle');
 const rig=player.userData?.rig;if(rig){const t=performance.now()*.001,s=moving?Math.sin(t*(run?10:6))*(run?.8:.45):0;rig.armL.rotation.x=s;rig.armR.rotation.x=-s;rig.legL.rotation.x=-s;rig.legR.rotation.x=s}
}
function updateBoat(dt){
 const throttle=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0),steer=(keys.KeyA||keys.ArrowLeft?1:0)-(keys.KeyD||keys.ArrowRight?1:0);boatSpeed+=throttle*30*dt;boatSpeed*=Math.exp(-dt*(throttle?.45:1.2));boatSpeed=THREE.MathUtils.clamp(boatSpeed,-12,50);if(Math.abs(boatSpeed)>.2)boatRoot.rotation.y+=steer*dt*(.22+Math.abs(boatSpeed)*.007)*Math.sign(boatSpeed);const f=new THREE.Vector3(0,0,-1).applyQuaternion(boatRoot.quaternion);boatRoot.position.addScaledVector(f,boatSpeed*dt);const helm=new THREE.Vector3(0,20,-8);boatRoot.localToWorld(helm);player.position.copy(helm);player.rotation.y=boatRoot.rotation.y+Math.PI;setPlayerAction('Idle');setStatus(`Manejando el barco · ${Math.round(Math.abs(boatSpeed)*2.2)} km/h`,100)
}
function updateCamera(dt){const target=mode==='driving'?boatRoot.position.clone().add(new THREE.Vector3(0,22,0)):player.position.clone().add(new THREE.Vector3(0,8,0));const h=Math.cos(orbitPitch)*orbitDistance,desired=new THREE.Vector3(target.x+Math.sin(orbitYaw)*h,target.y+Math.sin(orbitPitch)*orbitDistance,target.z+Math.cos(orbitYaw)*h);camera.position.lerp(desired,1-Math.exp(-dt*5));camera.lookAt(target)}

const clock=new THREE.Clock();
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05),time=clock.elapsedTime;waterUniforms.uTime.value=time;playerMixer?.update(dt);if(mode==='driving')updateBoat(dt);else updatePlayer(dt);updateCamera(dt);for(const f of fish){f.userData.mixer?.update(dt);f.userData.angle+=dt*f.userData.speed*.02;f.position.x=500+Math.cos(f.userData.angle)*f.userData.radius;f.position.z=-500+Math.sin(f.userData.angle)*f.userData.radius;f.rotation.y=-f.userData.angle+Math.PI/2}boatRoot.position.y=Math.sin(time*.85)*1.1;boatRoot.rotation.z=Math.sin(time*.7)*.012;renderer.render(scene,camera)}
animate();setStatus('Océano y controles listos; cargando modelos originales…',12);
Promise.allSettled([loadOriginalBoat(),loadMainIsland(),loadBuoys(),loadRocks(),loadVegetation(),loadFish(),loadCharacter(),loadHDR()]).then(()=>{setStatus('GTA MANUCHO listo: océano, isla, barco y personaje cargados',100);setTimeout(()=>progressNode.parentElement.style.display='none',1300)});

addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5))});
