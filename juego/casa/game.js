import * as THREE from 'three';
import { GLTFLoader } from './libs/three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from './libs/three/examples/jsm/loaders/DRACOLoader.js';

const boot=document.getElementById('boot');
const modeEl=document.getElementById('mode');
const statusEl=document.getElementById('status');
const crosshair=document.getElementById('crosshair');

const scene=new THREE.Scene();
scene.background=new THREE.Color(0xcbd5e1);
scene.fog=new THREE.Fog(0xcbd5e1,12,28);

const camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.03,140);
camera.position.set(0,1.7,4.2);

const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:true});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.08;
document.body.prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xf4f7ff,0x4a4a45,2.3));
const sun=new THREE.DirectionalLight(0xfff1d5,3.2);
sun.position.set(-3,7,4);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
const lamp=new THREE.PointLight(0xffd6a6,22,10,2);lamp.position.set(-1.8,2.2,-1.3);scene.add(lamp);

// Habitación ampliada 3 veces, manteniendo muebles y personaje a escala original.
const ROOM_W=21.3,ROOM_D=15.9,ROOM_H=9.15;
const fallbackRoom=new THREE.Group();
const floorMat=new THREE.MeshStandardMaterial({color:0xb58a61,roughness:.9,metalness:0});
const floor=new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W,ROOM_D),floorMat);
floor.rotation.x=-Math.PI/2;floor.position.y=0;floor.receiveShadow=true;fallbackRoom.add(floor);
const wallMat=new THREE.MeshStandardMaterial({color:0xeee7de,roughness:.94,side:THREE.DoubleSide});
const back=new THREE.Mesh(new THREE.BoxGeometry(ROOM_W,ROOM_H,.12),wallMat);back.position.set(0,ROOM_H*.5,-ROOM_D*.5);back.receiveShadow=true;fallbackRoom.add(back);
const leftWall=new THREE.Mesh(new THREE.BoxGeometry(.12,ROOM_H,ROOM_D),wallMat);leftWall.position.set(-ROOM_W*.5,ROOM_H*.5,0);leftWall.receiveShadow=true;fallbackRoom.add(leftWall);
const ceiling=new THREE.Mesh(new THREE.BoxGeometry(ROOM_W,.12,ROOM_D),new THREE.MeshStandardMaterial({color:0xf4eee7,roughness:.96}));
ceiling.position.set(0,ROOM_H,0);ceiling.receiveShadow=true;fallbackRoom.add(ceiling);

const DOOR_Z=3.95,DOOR_W=1.72,DOOR_H=2.45;
const WINDOW_Z=-1.1,WINDOW_W=5.4,WINDOW_H=3.7,WINDOW_Y=3.25;
const makePanel=(w,h,d,x,y,z,mat=wallMat)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.receiveShadow=true;m.castShadow=false;return m};
const rightWallGroup=new THREE.Group();
const wallX=ROOM_W*.5, minZ=-ROOM_D*.5, maxZ=ROOM_D*.5;
const windowMinZ=WINDOW_Z-WINDOW_W*.5, windowMaxZ=WINDOW_Z+WINDOW_W*.5;
const doorMinZ=DOOR_Z-DOOR_W*.5, doorMaxZ=DOOR_Z+DOOR_W*.5;
const topH=ROOM_H-(WINDOW_Y+WINDOW_H*.5), bottomH=WINDOW_Y-WINDOW_H*.5;
rightWallGroup.add(makePanel(.12,ROOM_H,windowMinZ-minZ,wallX,ROOM_H*.5,(minZ+windowMinZ)*.5));
rightWallGroup.add(makePanel(.12,ROOM_H,doorMinZ-windowMaxZ,wallX,ROOM_H*.5,(windowMaxZ+doorMinZ)*.5));
rightWallGroup.add(makePanel(.12,ROOM_H,maxZ-doorMaxZ,wallX,ROOM_H*.5,(doorMaxZ+maxZ)*.5));
rightWallGroup.add(makePanel(.12,bottomH,WINDOW_W,wallX,bottomH*.5,WINDOW_Z));
rightWallGroup.add(makePanel(.12,topH,WINDOW_W,wallX,ROOM_H-topH*.5,WINDOW_Z));
rightWallGroup.add(makePanel(.12,ROOM_H-DOOR_H,DOOR_W,wallX,DOOR_H+(ROOM_H-DOOR_H)*.5,DOOR_Z));
fallbackRoom.add(rightWallGroup);
// Ventanal amplio y puerta funcional en la pared derecha.
const windowFrame=new THREE.Group();
const glass=new THREE.Mesh(new THREE.PlaneGeometry(WINDOW_W,WINDOW_H),new THREE.MeshStandardMaterial({color:0xbcd7ec,roughness:.18,metalness:.05,transparent:true,opacity:.72,side:THREE.DoubleSide}));
glass.rotation.y=-Math.PI/2;glass.position.set(wallX-.07,WINDOW_Y,WINDOW_Z);windowFrame.add(glass);
const frameMat=new THREE.MeshStandardMaterial({color:0x15191d,roughness:.55});
for(const y of [WINDOW_Y-WINDOW_H*.5,WINDOW_Y,WINDOW_Y+WINDOW_H*.5]){const bar=new THREE.Mesh(new THREE.BoxGeometry(.09,.10,WINDOW_W),frameMat);bar.rotation.y=-Math.PI/2;bar.position.set(wallX-.13,y,WINDOW_Z);windowFrame.add(bar)}
for(const z of [windowMinZ,WINDOW_Z,windowMaxZ]){const bar=new THREE.Mesh(new THREE.BoxGeometry(.09,WINDOW_H+.08,.10),frameMat);bar.position.set(wallX-.13,WINDOW_Y,z);windowFrame.add(bar)}
fallbackRoom.add(windowFrame);
const doorMat=new THREE.MeshStandardMaterial({color:0x7a5438,roughness:.8,metalness:.05});
const doorFrameMat=new THREE.MeshStandardMaterial({color:0x262626,roughness:.6});
const doorFrame=new THREE.Group();
doorFrame.add(makePanel(.14,DOOR_H+.12,.08,wallX-.04,(DOOR_H+.12)*.5,DOOR_Z-DOOR_W*.5-.04,doorFrameMat));
doorFrame.add(makePanel(.14,DOOR_H+.12,.08,wallX-.04,(DOOR_H+.12)*.5,DOOR_Z+DOOR_W*.5+.04,doorFrameMat));
doorFrame.add(makePanel(.14,.10,DOOR_W+.16,wallX-.04,DOOR_H+.06,DOOR_Z,doorFrameMat));
fallbackRoom.add(doorFrame);
const doorPivot=new THREE.Group();doorPivot.position.set(wallX-.06,0,doorMinZ+.03);
const doorLeaf=new THREE.Mesh(new THREE.BoxGeometry(.055,DOOR_H-.06,DOOR_W-.08),doorMat);doorLeaf.position.set(.02,(DOOR_H-.06)*.5,DOOR_W*.5-.04);doorLeaf.castShadow=true;doorLeaf.receiveShadow=true;doorPivot.add(doorLeaf);doorPivot.rotation.y=-Math.PI/2+.95;fallbackRoom.add(doorPivot);
// Suelo y paredes de la zona exterior accesible por la puerta.
const EXT_W=9.8, EXT_D=11.8;
const exteriorFloor=new THREE.Mesh(new THREE.PlaneGeometry(EXT_W,EXT_D),new THREE.MeshStandardMaterial({color:0xd8c4aa,roughness:.95}));
exteriorFloor.rotation.x=-Math.PI/2;exteriorFloor.receiveShadow=true;exteriorFloor.position.set(wallX+EXT_W*.5,0,2.1);fallbackRoom.add(exteriorFloor);
const exteriorWallMat=new THREE.MeshStandardMaterial({color:0xe7e0d7,roughness:.96});
const extBack=makePanel(EXT_W,ROOM_H*.8,.14,wallX+EXT_W*.5,ROOM_H*.4,2.1-EXT_D*.5,exteriorWallMat);
const extFront=makePanel(EXT_W,ROOM_H*.8,.14,wallX+EXT_W*.5,ROOM_H*.4,2.1+EXT_D*.5,exteriorWallMat);
const extRight=makePanel(.14,ROOM_H*.8,EXT_D,wallX+EXT_W,ROOM_H*.4,2.1,exteriorWallMat);
fallbackRoom.add(extBack,extFront,extRight);
// Segunda puerta funcional en la pared interior derecha del área exterior.
const INNER_DOOR_Z=3.75, INNER_DOOR_W=1.6, INNER_DOOR_H=2.45;
const innerDoorFrame=new THREE.Group();
innerDoorFrame.add(makePanel(.14,INNER_DOOR_H+.12,.08,wallX+EXT_W-.04,(INNER_DOOR_H+.12)*.5,INNER_DOOR_Z-INNER_DOOR_W*.5-.04,doorFrameMat));
innerDoorFrame.add(makePanel(.14,INNER_DOOR_H+.12,.08,wallX+EXT_W-.04,(INNER_DOOR_H+.12)*.5,INNER_DOOR_Z+INNER_DOOR_W*.5+.04,doorFrameMat));
innerDoorFrame.add(makePanel(.14,.10,INNER_DOOR_W+.16,wallX+EXT_W-.04,INNER_DOOR_H+.06,INNER_DOOR_Z,doorFrameMat));
fallbackRoom.add(innerDoorFrame);
const innerDoorPivot=new THREE.Group();innerDoorPivot.position.set(wallX+EXT_W-.06,0,INNER_DOOR_Z-INNER_DOOR_W*.5+.03);
const innerDoorLeaf=new THREE.Mesh(new THREE.BoxGeometry(.055,INNER_DOOR_H-.06,INNER_DOOR_W-.08),doorMat);innerDoorLeaf.position.set(.02,(INNER_DOOR_H-.06)*.5,INNER_DOOR_W*.5-.04);innerDoorLeaf.castShadow=true;innerDoorLeaf.receiveShadow=true;innerDoorPivot.add(innerDoorLeaf);innerDoorPivot.rotation.y=-Math.PI/2+.95;fallbackRoom.add(innerDoorPivot);
// Pequeña estancia adicional detrás de la segunda puerta.
const ANNEX_W=7.0, ANNEX_D=8.2, annexCenterX=wallX+EXT_W+ANNEX_W*.5, annexCenterZ=3.2;
const annexFloor=new THREE.Mesh(new THREE.PlaneGeometry(ANNEX_W,ANNEX_D),new THREE.MeshStandardMaterial({color:0xdfcbb0,roughness:.96}));
annexFloor.rotation.x=-Math.PI/2;annexFloor.position.set(annexCenterX,0,annexCenterZ);annexFloor.receiveShadow=true;fallbackRoom.add(annexFloor);
const annexLeft=makePanel(.14,ROOM_H*.7,ANNEX_D,wallX+EXT_W,ROOM_H*.35,annexCenterZ,exteriorWallMat);
const annexBack=makePanel(ANNEX_W,ROOM_H*.7,.14,annexCenterX,ROOM_H*.35,annexCenterZ-ANNEX_D*.5,exteriorWallMat);
const annexFront=makePanel(ANNEX_W,ROOM_H*.7,.14,annexCenterX,ROOM_H*.35,annexCenterZ+ANNEX_D*.5,exteriorWallMat);
const annexRight=makePanel(.14,ROOM_H*.7,ANNEX_D,wallX+EXT_W+ANNEX_W,ROOM_H*.35,annexCenterZ,exteriorWallMat);
fallbackRoom.add(annexLeft,annexBack,annexFront,annexRight);
// Estante decorativo corregido junto a la ventana, visible y sólido.
const shelf=new THREE.Group();
const shelfAccentMat=new THREE.MeshStandardMaterial({color:0xf4f0e8,roughness:.88});
const shelfBracketMat=new THREE.MeshStandardMaterial({color:0x161616,roughness:.78});
const decoWallX=5.1, decoWallZ=-0.25;
for(const [y,w] of [[2.42,.54],[1.72,.62],[1.02,.48]]){
  const board=new THREE.Mesh(new THREE.BoxGeometry(.16,.05,w),shelfAccentMat);
  board.position.set(decoWallX,y,decoWallZ+(w===.62?0.02:0));
  board.castShadow=true;board.receiveShadow=true;shelf.add(board);
  const bracket=new THREE.Mesh(new THREE.BoxGeometry(.05,.18,.04),shelfBracketMat);
  bracket.position.set(decoWallX-.08,y-.08,decoWallZ);shelf.add(bracket);
}
const bunnyMat=new THREE.MeshStandardMaterial({color:0x555555,roughness:.95});
const bunny=new THREE.Group();
const bunnyBody=new THREE.Mesh(new THREE.SphereGeometry(.12,14,12),bunnyMat);bunnyBody.scale.set(.9,1.1,.85);bunny.add(bunnyBody);
const bunnyHead=new THREE.Mesh(new THREE.SphereGeometry(.08,12,10),bunnyMat);bunnyHead.position.y=.18;bunny.add(bunnyHead);
for(const sx of [-.032,.032]){const ear=new THREE.Mesh(new THREE.CapsuleGeometry(.016,.1,4,8),bunnyMat);ear.position.set(sx,.31,0);bunny.add(ear);const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.015,.08,4,8),bunnyMat);leg.position.set(sx*1.2,-.14,.02);bunny.add(leg)}
bunny.rotation.y=-Math.PI/2;bunny.position.set(decoWallX,1.19,decoWallZ+.02);shelf.add(bunny);
for(const [x,y,z,c,sx] of [[0,1.72,-.1,0xf4efe6,-.14],[0,1.72,.0,0xbe9059,0.0],[0,1.72,.1,0x7b5f47,.14],[0,2.42,-.05,0xe9e1d2,-.04],[0,2.42,.08,0xd6d0c8,.09]]){
  const book=new THREE.Mesh(new THREE.BoxGeometry(.045,.2,.1),new THREE.MeshStandardMaterial({color:c,roughness:.88}));
  book.position.set(decoWallX+.01,y+.11,decoWallZ+sx);book.rotation.y=Math.PI/2;book.rotation.z=sx<0?-0.1:0.08;shelf.add(book)
}
const bowl=new THREE.Mesh(new THREE.SphereGeometry(.06,12,10,0,Math.PI*2,0,Math.PI*.6),new THREE.MeshStandardMaterial({color:0xa8896d,roughness:.82}));
bowl.rotation.z=Math.PI;bowl.position.set(decoWallX+.01,2.55,decoWallZ-.11);shelf.add(bowl);
fallbackRoom.add(shelf);
// Muebles exteriores para que no quede vacío.
const outdoor=new THREE.Group();
const woodMat=new THREE.MeshStandardMaterial({color:0x8f6849,roughness:.88});
const fabricMat=new THREE.MeshStandardMaterial({color:0xcdb29a,roughness:.97});
const darkMat=new THREE.MeshStandardMaterial({color:0x2e2b28,roughness:.8});
const makeBox=(w,h,d,mat,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;return m};

// Plantas y adornos en el exterior del primer departamento.
const plantDecor=new THREE.Group();
const terracottaMat=new THREE.MeshStandardMaterial({color:0x9a6849,roughness:.96});
const ceramicMat=new THREE.MeshStandardMaterial({color:0xe5ded2,roughness:.88});
const darkCeramicMat=new THREE.MeshStandardMaterial({color:0x343230,roughness:.9});
const leafMats=[
  new THREE.MeshStandardMaterial({color:0x446b42,roughness:.95}),
  new THREE.MeshStandardMaterial({color:0x5b7f4f,roughness:.95}),
  new THREE.MeshStandardMaterial({color:0x78945e,roughness:.95})
];
function makePlant(x,z,scale=1,potStyle=0){
  const g=new THREE.Group();
  const potMat=potStyle===0?terracottaMat:potStyle===1?ceramicMat:darkCeramicMat;
  const pot=new THREE.Mesh(new THREE.CylinderGeometry(.22*scale,.28*scale,.42*scale,14),potMat);
  pot.position.y=.21*scale;pot.castShadow=true;pot.receiveShadow=true;g.add(pot);
  const soil=new THREE.Mesh(new THREE.CylinderGeometry(.2*scale,.2*scale,.035*scale,14),new THREE.MeshStandardMaterial({color:0x3f2c20,roughness:1}));
  soil.position.y=.43*scale;g.add(soil);
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.025*scale,.035*scale,.82*scale,8),new THREE.MeshStandardMaterial({color:0x4f6337,roughness:1}));
  stem.position.y=.82*scale;stem.castShadow=true;g.add(stem);
  for(let i=0;i<8;i++){
    const a=i*Math.PI*.76;
    const leaf=new THREE.Mesh(new THREE.CapsuleGeometry(.055*scale,.34*scale,4,8),leafMats[i%leafMats.length]);
    leaf.position.set(Math.cos(a)*.16*scale,.62*scale+i*.085*scale,Math.sin(a)*.16*scale);
    leaf.rotation.z=.55*Math.cos(a);leaf.rotation.x=.45*Math.sin(a);leaf.rotation.y=a;
    leaf.castShadow=true;g.add(leaf)
  }
  g.position.set(x,0,z);plantDecor.add(g);return g
}
function makePalm(x,z,scale=1,potStyle=1){
  const g=new THREE.Group();
  const potMat=potStyle===0?terracottaMat:potStyle===1?ceramicMat:darkCeramicMat;
  const pot=new THREE.Mesh(new THREE.CylinderGeometry(.25*scale,.32*scale,.48*scale,16),potMat);
  pot.position.y=.24*scale;pot.castShadow=true;pot.receiveShadow=true;g.add(pot);
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.045*scale,.07*scale,1.18*scale,9),new THREE.MeshStandardMaterial({color:0x6b543a,roughness:1}));
  trunk.position.y=.96*scale;trunk.castShadow=true;g.add(trunk);
  for(let i=0;i<9;i++){
    const a=i*Math.PI*2/9;
    const leaf=new THREE.Mesh(new THREE.CapsuleGeometry(.04*scale,.46*scale,4,8),leafMats[(i+1)%leafMats.length]);
    leaf.position.set(Math.cos(a)*.28*scale,1.58*scale,Math.sin(a)*.28*scale);
    leaf.rotation.y=a;leaf.rotation.z=Math.PI/2-.32;leaf.rotation.x=.16*Math.sin(a);
    leaf.castShadow=true;g.add(leaf)
  }
  g.position.set(x,0,z);plantDecor.add(g);return g
}
makePlant(wallX+1.15,-2.55,1.05,0);
makePalm(wallX+2.55,-2.85,.95,1);
makePlant(wallX+4.25,-2.65,.82,2);
makePlant(wallX+7.45,-2.75,1.15,0);
makePalm(wallX+8.55,.1,.9,2);
makePlant(wallX+1.35,6.35,1.1,1);
makePalm(wallX+3.15,6.55,.92,0);
makePlant(wallX+6.65,6.35,1.0,2);
makePlant(wallX+8.35,6.0,.86,1);

// Adornos: pedestales, jarrones, lámparas y cuadros decorativos.
const pedestalMat=new THREE.MeshStandardMaterial({color:0xd8d0c5,roughness:.9});
const brassMat=new THREE.MeshStandardMaterial({color:0x9a7b42,roughness:.45,metalness:.45});
const accentMat=new THREE.MeshStandardMaterial({color:0x5f7184,roughness:.75});
for(const [x,z,h] of [[wallX+1.65,.45,.78],[wallX+8.05,4.85,.92]]){
  const pedestal=makeBox(.46,h,.46,pedestalMat,x,h/2,z);plantDecor.add(pedestal);
  const vase=new THREE.Mesh(new THREE.LatheGeometry([
    new THREE.Vector2(.08,0),new THREE.Vector2(.16,.06),new THREE.Vector2(.18,.28),new THREE.Vector2(.11,.46),new THREE.Vector2(.075,.55)
  ],18),accentMat);
  vase.scale.set(.78,.78,.78);vase.position.set(x,h,z);vase.castShadow=true;plantDecor.add(vase)
}
for(const [x,z] of [[wallX+4.8,6.45],[wallX+7.1,-2.0]]){
  const base=new THREE.Mesh(new THREE.CylinderGeometry(.16,.22,.08,16),brassMat);base.position.set(x,.04,z);plantDecor.add(base);
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.35,10),brassMat);pole.position.set(x,.74,z);plantDecor.add(pole);
  const shade=new THREE.Mesh(new THREE.ConeGeometry(.24,.34,18,1,true),new THREE.MeshStandardMaterial({color:0xf1dfb8,roughness:.86,side:THREE.DoubleSide}));shade.position.set(x,1.48,z);shade.rotation.x=Math.PI;shade.castShadow=true;plantDecor.add(shade)
}
const artMatA=new THREE.MeshStandardMaterial({color:0x7890a8,roughness:.78});
const artMatB=new THREE.MeshStandardMaterial({color:0xc38d68,roughness:.78});
for(const [x,z,c] of [[wallX+.16,-1.35,artMatA],[wallX+.16,1.0,artMatB]]){
  const frame=new THREE.Mesh(new THREE.BoxGeometry(.08,1.15,1.05),darkMat);frame.position.set(x,2.1,z);plantDecor.add(frame);
  const art=new THREE.Mesh(new THREE.BoxGeometry(.085,.95,.85),c);art.position.set(x+.01,2.1,z);plantDecor.add(art)
}
const sculptureBase=makeBox(.62,.18,.62,darkCeramicMat,wallX+5.25,.09,-2.65);plantDecor.add(sculptureBase);
const sculpture=new THREE.Mesh(new THREE.TorusKnotGeometry(.17,.05,60,10),brassMat);sculpture.position.set(wallX+5.25,.52,-2.65);sculpture.castShadow=true;plantDecor.add(sculpture);
fallbackRoom.add(plantDecor);
const sofa=new THREE.Group();
sofa.add(makeBox(2.2,.42,.88,fabricMat,wallX+5.6,.22,4.65));
sofa.add(makeBox(2.2,.48,.16,fabricMat,wallX+5.6,.64,4.28));
sofa.add(makeBox(.16,.48,.88,fabricMat,wallX+4.54,.46,4.65));
sofa.add(makeBox(.16,.48,.88,fabricMat,wallX+6.66,.46,4.65));
outdoor.add(sofa);
const table=new THREE.Group();
table.add(makeBox(1.45,.08,.9,woodMat,wallX+6.2,.44,1.05));
for(const sx of [-.58,.58]) for(const sz of [-.3,.3]) table.add(makeBox(.08,.8,.08,darkMat,wallX+6.2+sx,.04,1.05+sz));
outdoor.add(table);
const cabinet=new THREE.Group();
cabinet.add(makeBox(1.8,1.15,.42,new THREE.MeshStandardMaterial({color:0x3a3735,roughness:.82}),wallX+2.55,.58,-2.95));
for(const cx of [-.42,.42]) cabinet.add(makeBox(.65,.04,.01,new THREE.MeshStandardMaterial({color:0xcaa77f,roughness:.5}),wallX+2.55+cx,.58,-2.74));
outdoor.add(cabinet);
const plantBase=makeBox(.38,.46,.38,new THREE.MeshStandardMaterial({color:0x8e6b4f,roughness:.95}),wallX+8.25,.23,-3.8);
outdoor.add(plantBase);
for(const ang of [0,.9,1.8,2.7,3.6]){const leaf=new THREE.Mesh(new THREE.CapsuleGeometry(.05,.65,4,8),new THREE.MeshStandardMaterial({color:0x5a7a4b,roughness:.95}));leaf.position.set(wallX+8.25+Math.cos(ang)*.16,.78, -3.8+Math.sin(ang)*.16);leaf.rotation.z=.45*Math.cos(ang);leaf.rotation.x=.2;outdoor.add(leaf)}
const bench=new THREE.Group();
bench.add(makeBox(1.5,.09,.45,woodMat,wallX+2.7,.54,4.95));
for(const sx of [-.62,.62]) for(const sz of [-.14,.14]) bench.add(makeBox(.07,.55,.07,darkMat,wallX+2.7+sx,.275,4.95+sz));
outdoor.add(bench);
// Más muebles visibles en el exterior.
const rug1=new THREE.Mesh(new THREE.PlaneGeometry(2.6,1.8),new THREE.MeshStandardMaterial({color:0xc7b39d,roughness:1}));
rug1.rotation.x=-Math.PI/2;rug1.position.set(wallX+3.15,.01,1.65);outdoor.add(rug1);
const rug2=new THREE.Mesh(new THREE.PlaneGeometry(2.2,1.6),new THREE.MeshStandardMaterial({color:0xd7c5ae,roughness:1}));
rug2.rotation.x=-Math.PI/2;rug2.position.set(wallX+7.2,.01,5.2);outdoor.add(rug2);
const chairA=new THREE.Group();
chairA.add(makeBox(.72,.12,.72,fabricMat,wallX+2.3,.38,1.35));
chairA.add(makeBox(.72,.42,.12,fabricMat,wallX+2.3,.64,1.03));
chairA.add(makeBox(.12,.42,.72,fabricMat,wallX+1.99,.6,1.35));
outdoor.add(chairA);
const chairB=chairA.clone();chairB.position.set(4.75,0,4.15);outdoor.add(chairB);
const lowTable=new THREE.Group();
lowTable.add(makeBox(1.1,.08,.7,woodMat,wallX+3.5,.34,3.2));
for(const sx of [-.42,.42]) for(const sz of [-.22,.22]) lowTable.add(makeBox(.07,.6,.07,darkMat,wallX+3.5+sx,.04,3.2+sz));
outdoor.add(lowTable);
const cabinet2=new THREE.Group();
cabinet2.add(makeBox(1.5,.95,.38,new THREE.MeshStandardMaterial({color:0x74614f,roughness:.88}),wallX+7.7,.48,-.45));
for(const cx of [-.34,.34]) cabinet2.add(makeBox(.5,.03,.01,new THREE.MeshStandardMaterial({color:0xd0b18b,roughness:.55}),wallX+7.7+cx,.48,-.25));
outdoor.add(cabinet2);
const annexFurniture=new THREE.Group();
annexFurniture.add(makeBox(1.8,.42,.82,fabricMat,24.05,.22,2.3));
annexFurniture.add(makeBox(1.8,.42,.14,fabricMat,24.05,.62,1.95));
annexFurniture.add(makeBox(.14,.4,.82,fabricMat,23.2,.42,2.3));
const annexDesk=new THREE.Group();
annexDesk.add(makeBox(1.45,.08,.72,woodMat,26.0,.43,4.7));
for(const sx of [-.55,.55]) for(const sz of [-.24,.24]) annexDesk.add(makeBox(.07,.78,.07,darkMat,26.0+sx,.04,4.7+sz));
annexFurniture.add(annexDesk);
const annexShelf=new THREE.Group();
annexShelf.add(makeBox(.78,1.45,.28,new THREE.MeshStandardMaterial({color:0x2d2622,roughness:.82}),23.95,.72,5.55));
for(const y of [.42,.82,1.22]) annexShelf.add(makeBox(.7,.04,.22,new THREE.MeshStandardMaterial({color:0xf0ebe3,roughness:.92}),23.95,y,5.55));
annexFurniture.add(annexShelf);
fallbackRoom.add(annexFurniture);
const sideWardrobeInside=new THREE.Group();
sideWardrobeInside.add(makeBox(.92,2.05,.42,new THREE.MeshStandardMaterial({color:0x1f1a17,roughness:.8}),4.45,1.03,3.55));
for(const y of [.56,1.08,1.6]) sideWardrobeInside.add(makeBox(.82,.04,.32,new THREE.MeshStandardMaterial({color:0xf0ebe3,roughness:.92}),4.45,y,3.55));
sideWardrobeInside.add(makeBox(.22,.32,.18,new THREE.MeshStandardMaterial({color:0xb38d66,roughness:.9}),4.28,1.1,3.55));
sideWardrobeInside.add(makeBox(.18,.28,.14,new THREE.MeshStandardMaterial({color:0xd7d2cb,roughness:.92}),4.58,1.58,3.55));
fallbackRoom.add(sideWardrobeInside);
fallbackRoom.add(outdoor);
scene.add(fallbackRoom);
scene.fog=new THREE.Fog(0xcbd5e1,32,74);

const player=new THREE.Group();
player.position.set(0,0,1.35);scene.add(player);
let visual=createFallbackHuman();player.add(visual);
let mixer=null, actions={}, currentAction='Idle';
function createFallbackHuman(){
  const g=new THREE.Group(),bodyMat=new THREE.MeshStandardMaterial({color:0x34483a,roughness:.75}),dark=new THREE.MeshStandardMaterial({color:0x18251d,roughness:.8}),skin=new THREE.MeshStandardMaterial({color:0xd3a47f,roughness:.85});
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.25,.62,5,8),bodyMat);torso.position.y=1.05;torso.castShadow=true;g.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.18,14,10),skin);head.position.y=1.62;head.castShadow=true;g.add(head);
  const helmet=new THREE.Mesh(new THREE.SphereGeometry(.2,14,8,0,Math.PI*2,0,Math.PI/2),dark);helmet.position.y=1.68;helmet.castShadow=true;g.add(helmet);
  const limb=(x,y,h,mat)=>{const m=new THREE.Mesh(new THREE.CapsuleGeometry(.07,h,4,7),mat);m.position.set(x,y,0);m.castShadow=true;g.add(m);return m};
  const armL=limb(-.34,1.08,.5,bodyMat),armR=limb(.34,1.08,.5,bodyMat),legL=limb(-.12,.43,.65,dark),legR=limb(.12,.43,.65,dark);
  g.userData.rig={armL,armR,legL,legR};return g;
}
function installSoldier(gltf){
  const model=gltf.scene;
  const box=new THREE.Box3().setFromObject(model),size=new THREE.Vector3();box.getSize(size);
  const scale=1.72/Math.max(size.y,.001);model.scale.setScalar(scale);
  const box2=new THREE.Box3().setFromObject(model);model.position.y=-box2.min.y;
  model.rotation.y=Math.PI;
  model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
  player.remove(visual);visual=model;player.add(visual);
  if(gltf.animations?.length){
    mixer=new THREE.AnimationMixer(model);
    const find=(name,fallback)=>gltf.animations.find(c=>c.name.toLowerCase()===name.toLowerCase())||gltf.animations[fallback];
    const idle=find('Idle',0),run=find('Run',1),walk=find('Walk',3)||find('Walk',2);
    if(idle)actions.Idle=mixer.clipAction(idle);if(walk)actions.Walk=mixer.clipAction(walk);if(run)actions.Run=mixer.clipAction(run);
    actions.Idle?.play();currentAction='Idle';
  }
  statusEl.textContent='Habitación y Soldier animado listos';
}
function setAction(name){
  if(name===currentAction)return;
  if(actions[name]){actions[currentAction]?.fadeOut(.16);actions[name].reset().fadeIn(.16).play();currentAction=name}
}

const loader=new GLTFLoader();
const draco=new DRACOLoader();draco.setDecoderPath('./libs/draco/');loader.setDRACOLoader(draco);
loader.load('./models/bedroom4-transformed.glb',gltf=>{
  const room=gltf.scene;
  // Se conservan todos los muebles a su escala original. Solo se ocultan el piso,
  // las paredes y el techo originales porque ahora existe una habitación 3 veces mayor.
  const structuralNames=new Set(['teto','wall','back_wall','parquet']);
  room.traverse(o=>{
    const cleanName=(o.name||'').trim().toLowerCase();
    if(structuralNames.has(cleanName))o.visible=false;
    if(o.isMesh){o.castShadow=false;o.receiveShadow=true}
  });
  scene.add(room);
  statusEl.textContent='Habitación ampliada y muebles originales listos; cargando Soldier animado…';
},p=>{if(p.total)statusEl.textContent=`Cargando muebles originales ${Math.round(p.loaded/p.total*100)}%`},()=>{statusEl.textContent='No se pudieron cargar los muebles originales; se mantiene la habitación ampliada'});

// El juego comienza de inmediato. Soldier se carga después y nunca bloquea el inicio.
setTimeout(()=>loader.load('./models/Soldier.glb',installSoldier,undefined,()=>loader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Soldier.glb',installSoldier,undefined,()=>{statusEl.textContent='Sin conexión: usando personaje humano local'})),450);
setTimeout(()=>{boot.classList.add('hide');setTimeout(()=>boot.remove(),320)},420);

const keys=Object.create(null);let firstPerson=false,yaw=0,pitch=.28,drag=false,lastX=0,lastY=0,vy=0,onGround=true;
addEventListener('keydown',e=>{
  keys[e.code]=true;
  if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','Space'].includes(e.code))e.preventDefault();
  if(e.code==='KeyV'&&!e.repeat){firstPerson=!firstPerson;modeEl.textContent=firstPerson?'PRIMERA PERSONA':'TERCERA PERSONA';crosshair.style.display=firstPerson?'block':'none'}
});
addEventListener('keyup',e=>keys[e.code]=false);addEventListener('blur',()=>Object.keys(keys).forEach(k=>keys[k]=false));
renderer.domElement.addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture?.(e.pointerId)});
renderer.domElement.addEventListener('pointermove',e=>{if(!drag)return;yaw-=(e.clientX-lastX)*.006;pitch=THREE.MathUtils.clamp(pitch-(e.clientY-lastY)*.004,-.65,1.05);lastX=e.clientX;lastY=e.clientY});
renderer.domElement.addEventListener('pointerup',()=>drag=false);

const clock=new THREE.Clock();
const target=new THREE.Vector3(),desired=new THREE.Vector3(),forward=new THREE.Vector3(),right=new THREE.Vector3(),move=new THREE.Vector3();

// Superficies físicas y límites sólidos de la habitación y la zona exterior.
const ROOM_FLOOR_Y=.018;
const STEP_HEIGHT=.58;
const EXTERIOR_MIN_X=ROOM_W*.5+.10, EXTERIOR_MAX_X=ROOM_W*.5+9.7, EXTERIOR_MIN_Z=-3.6, EXTERIOR_MAX_Z=8.0;
const INTERIOR_BOUNDS={minX:-ROOM_W*.5+.65,maxX:ROOM_W*.5-.18,minZ:-ROOM_D*.5+.65,maxZ:ROOM_D*.5-.65};
const EXTERIOR_BOUNDS={minX:EXTERIOR_MIN_X,maxX:EXTERIOR_MAX_X,minZ:EXTERIOR_MIN_Z,maxZ:EXTERIOR_MAX_Z};
const DOOR_PASS_MIN_Z=DOOR_Z-DOOR_W*.5+.08, DOOR_PASS_MAX_Z=DOOR_Z+DOOR_W*.5-.08;
const DOORWAY_BOUNDS={minX:ROOM_W*.5-.55,maxX:ROOM_W*.5+.6,minZ:DOOR_PASS_MIN_Z,maxZ:DOOR_PASS_MAX_Z};
const INNER_DOOR_PASS_MIN_Z=INNER_DOOR_Z-INNER_DOOR_W*.5+.08, INNER_DOOR_PASS_MAX_Z=INNER_DOOR_Z+INNER_DOOR_W*.5-.08;
const ANNEX_BOUNDS={minX:wallX+EXT_W+.05,maxX:wallX+EXT_W+ANNEX_W-.15,minZ:annexCenterZ-ANNEX_D*.5+.15,maxZ:annexCenterZ+ANNEX_D*.5-.15};
const INNER_DOORWAY_BOUNDS={minX:wallX+EXT_W-.55,maxX:wallX+EXT_W+.55,minZ:INNER_DOOR_PASS_MIN_Z,maxZ:INNER_DOOR_PASS_MAX_Z};
const solidPlatforms=[
  {name:'cama',minX:-1.31,maxX:.93,minZ:-1.95,maxZ:.31,topY:.49},
  {name:'cojin',minX:1.65,maxX:2.85,minZ:-.75,maxZ:.37,topY:.43},
  {name:'mesita derecha',minX:1.17,maxX:2.00,minZ:-2.18,maxZ:-1.65,topY:.47},
  {name:'mesita izquierda',minX:-2.36,maxX:-1.53,minZ:-2.18,maxZ:-1.65,topY:.47},
  {name:'mesa exterior',minX:15.95,maxX:17.35,minZ:.6,maxZ:1.5,topY:.89},
  {name:'banco exterior',minX:12.15,maxX:13.25,minZ:4.72,maxZ:5.18,topY:.63},
  {name:'mesa anexo',minX:23.45,maxX:24.75,minZ:1.85,maxZ:2.65,topY:.82}
];
const obstacleBoxes=[
  {minX:14.55,maxX:16.65,minZ:4.18,maxZ:5.12,maxY:1.15},
  {minX:12.05,maxX:13.05,minZ:-3.25,maxZ:-2.65,maxY:1.35},
  {minX:18.0,maxX:18.55,minZ:-4.1,maxZ:-3.45,maxY:1.45},
  {minX:17.75,maxX:18.55,minZ:1.95,maxZ:2.45,maxY:1.8},
  {minX:3.88,maxX:4.62,minZ:-2.1,maxZ:-1.75,maxY:2.55},
  {minX:3.88,maxX:4.82,minZ:3.72,maxZ:4.18,maxY:2.2},
  {minX:23.25,maxX:24.95,minZ:1.65,maxZ:2.85,maxY:1.1},
  {minX:25.65,maxX:26.45,minZ:4.35,maxZ:5.05,maxY:1.5},
  {minX:11.45,maxX:12.15,minZ:-2.9,maxZ:-2.2,maxY:1.5},
  {minX:12.85,maxX:13.55,minZ:-3.2,maxZ:-2.5,maxY:1.8},
  {minX:18.55,maxX:19.35,minZ:-3.1,maxZ:-2.35,maxY:1.7},
  {minX:11.5,maxX:12.25,minZ:5.95,maxZ:6.75,maxY:1.7},
  {minX:13.35,maxX:14.05,minZ:6.15,maxZ:6.9,maxY:1.8},
  {minX:18.55,maxX:19.35,minZ:5.55,maxZ:6.45,maxY:1.5}
];
function inRect(x,z,r){return x>=r.minX&&x<=r.maxX&&z>=r.minZ&&z<=r.maxZ}
function areaAt(x,z){
  if(inRect(x,z,DOORWAY_BOUNDS))return 'doorway';
  if(inRect(x,z,INNER_DOORWAY_BOUNDS))return 'innerDoorway';
  if(inRect(x,z,INTERIOR_BOUNDS))return 'interior';
  if(inRect(x,z,EXTERIOR_BOUNDS))return 'exterior';
  if(inRect(x,z,ANNEX_BOUNDS))return 'annex';
  return null
}
function doorPass(z){return z>=DOOR_PASS_MIN_Z&&z<=DOOR_PASS_MAX_Z}
function platformAt(x,z,padding=0){
  let hit=null;
  for(const p of solidPlatforms){
    if(x>=p.minX-padding&&x<=p.maxX+padding&&z>=p.minZ-padding&&z<=p.maxZ+padding){
      if(!hit||p.topY>hit.topY)hit=p;
    }
  }
  return hit;
}
function supportHeightAt(x,z){
  return platformAt(x,z)?.topY??ROOM_FLOOR_Y;
}
function isBlockedByObstacle(x,z){
  for(const o of obstacleBoxes){
    if(x>=o.minX&&x<=o.maxX&&z>=o.minZ&&z<=o.maxZ&&player.position.y<o.maxY-.05) return true;
  }
  return false;
}
function canMoveTo(x,z){
  const currentArea=areaAt(player.position.x,player.position.z)||'interior',nextArea=areaAt(x,z);
  if(!nextArea) return false;
  const same=currentArea===nextArea;
  const allowed=(currentArea==='interior'&&nextArea==='doorway')||
                (currentArea==='doorway'&&(nextArea==='interior'||nextArea==='exterior'||nextArea==='doorway'))||
                (currentArea==='exterior'&&nextArea==='doorway')||
                (currentArea==='exterior'&&nextArea==='innerDoorway')||
                (currentArea==='innerDoorway'&&(nextArea==='exterior'||nextArea==='annex'||nextArea==='innerDoorway'))||
                (currentArea==='annex'&&nextArea==='innerDoorway');
  if(!(same||allowed)) return false;
  if(isBlockedByObstacle(x,z)) return false;
  const p=platformAt(x,z,.035);
  if(!p) return true;
  return p.topY-player.position.y<=STEP_HEIGHT || player.position.y>=p.topY-.08 || vy>0;
}
function updatePlayer(dt){
  let ix=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),iz=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0);
  const moving=ix!==0||iz!==0,running=keys.ShiftLeft||keys.ShiftRight,speed=running?2.65:1.45;
  if(moving){
    const len=Math.hypot(ix,iz);ix/=len;iz/=len;
    forward.set(-Math.sin(yaw),0,-Math.cos(yaw));right.set(Math.cos(yaw),0,-Math.sin(yaw));
    move.set(0,0,0).addScaledVector(forward,iz).addScaledVector(right,ix).normalize();
    const nx=player.position.x+move.x*speed*dt,nz=player.position.z+move.z*speed*dt;
    if(canMoveTo(nx,nz)){player.position.x=nx;player.position.z=nz}
    const angle=Math.atan2(move.x,move.z),diff=Math.atan2(Math.sin(angle-player.rotation.y),Math.cos(angle-player.rotation.y));player.rotation.y+=diff*Math.min(1,dt*12);
    setAction(running?'Run':'Walk');
  }else setAction('Idle');
  if(!mixer){const rig=visual.userData.rig,t=performance.now()*.001,amp=moving?Math.sin(t*(running?11:7))*(running?.65:.38):0;if(rig){rig.armL.rotation.x=amp;rig.armR.rotation.x=-amp;rig.legL.rotation.x=-amp;rig.legR.rotation.x=amp}}
  const groundY=supportHeightAt(player.position.x,player.position.z);
  if(keys.Space&&onGround){vy=4.4;onGround=false;keys.Space=false}
  if(!onGround||player.position.y>groundY+.025){
    vy-=11.5*dt;player.position.y+=vy*dt;
    if(player.position.y<=groundY){player.position.y=groundY;vy=0;onGround=true}
  }else{
    player.position.y=groundY;vy=0;onGround=true;
  }
  visual.visible=!firstPerson;
}
function updateCamera(dt){
  target.set(player.position.x,player.position.y+1.42,player.position.z);
  if(firstPerson){
    desired.set(player.position.x,player.position.y+1.56,player.position.z);
    camera.position.lerp(desired,1-Math.exp(-dt*20));
    const look=new THREE.Vector3(-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch));camera.lookAt(camera.position.clone().add(look));
  }else{
    const radius=3.25,horiz=Math.cos(pitch)*radius;
    desired.set(target.x+Math.sin(yaw)*horiz,target.y+Math.sin(pitch)*radius+0.25,target.z+Math.cos(yaw)*horiz);
    desired.y=Math.max(desired.y,.45);camera.position.lerp(desired,1-Math.exp(-dt*9));camera.lookAt(target);
  }
}
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);mixer?.update(dt);updatePlayer(dt);updateCamera(dt);renderer.render(scene,camera)}animate();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5))});

// ================================================================
// V72 · Casa inicial: guardado, cámara e inventario de ropa
// ================================================================
const V72_HOUSE_RETURN_KEY='vice_city_v72_house_return';
const V72_RETURNING_KEY='vice_city_v72_house_returning';
const V72_CAMERA_KEY='vice_city_v72_camera_owned';
const V72_OUTFIT_KEY='vice_city_v72_outfit';
let v72Prompt=null,v72Notice=null,v72Viewfinder=null,v72CameraEquipped=false,v72PointerStart=null;

function v72EnsureUi(){
  if(!v72Prompt){
    v72Prompt=document.createElement('div');
    v72Prompt.style.cssText='position:fixed;left:50%;bottom:32px;transform:translateX(-50%);z-index:80;display:none;padding:10px 15px;border-radius:8px;background:rgba(5,10,16,.94);border:1px solid #77baff;color:#fff;font:900 12px Arial;letter-spacing:.06em;pointer-events:none;box-shadow:0 8px 26px #0008';
    document.body.appendChild(v72Prompt);
  }
  if(!v72Notice){
    v72Notice=document.createElement('div');
    v72Notice.style.cssText='position:fixed;left:50%;top:18%;transform:translateX(-50%);z-index:85;display:none;padding:11px 17px;border-radius:8px;background:rgba(5,10,16,.95);border:1px solid #77baff;color:#fff;font:900 13px Arial;letter-spacing:.05em;pointer-events:none';
    document.body.appendChild(v72Notice);
  }
  if(!v72Viewfinder){
    v72Viewfinder=document.createElement('div');
    v72Viewfinder.style.cssText='position:fixed;inset:0;z-index:70;display:none;pointer-events:none;border:28px solid rgba(0,0,0,.7);box-shadow:inset 0 0 0 2px #fff';
    v72Viewfinder.innerHTML='<div style="position:absolute;left:50%;top:50%;width:48px;height:48px;transform:translate(-50%,-50%);border:2px solid #fff;border-radius:50%"></div><div style="position:absolute;left:50%;bottom:36px;transform:translateX(-50%);padding:7px 12px;border-radius:6px;background:#000b;color:#fff;font:900 11px Arial">CLIC · TOMAR FOTO &nbsp; C · GUARDAR CÁMARA</div>';
    document.body.appendChild(v72Viewfinder);
  }
}
function v72Show(text,duration=2200){v72EnsureUi();v72Notice.textContent=text;v72Notice.style.display='block';clearTimeout(v72Notice._t);v72Notice._t=setTimeout(()=>v72Notice.style.display='none',duration)}
function v72Box(w,h,d,color,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.72,metalness:.06}));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;return m}
function v72MakeDisk(){const g=new THREE.Group();g.add(v72Box(.62,.72,.12,0x0a0f18,0,0,0),v72Box(.42,.24,.04,0x287bd9,0,.16,.08),v72Box(.34,.12,.04,0xd8e6f2,0,-.17,.08));g.position.set(-3.7,.9,4.8);scene.add(g);return g}
function v72MakeCameraFallback(){const g=new THREE.Group();g.add(v72Box(.64,.42,.32,0x17191c,0,0,0));const lens=new THREE.Mesh(new THREE.CylinderGeometry(.15,.2,.25,16),new THREE.MeshStandardMaterial({color:0x101218,roughness:.25,metalness:.4}));lens.rotation.x=Math.PI/2;lens.position.z=.27;g.add(lens);const flash=v72Box(.18,.12,.08,0xd8e8f4,.2,.25,.03);g.add(flash);return g}
function v72MakeRack(){const g=new THREE.Group();const bar=v72Box(2.4,.07,.07,0x34383d,0,1.65,0);const left=v72Box(.08,1.8,.08,0x34383d,-1.08,.8,0);const right=left.clone();right.position.x=1.08;g.add(bar,left,right);const colors=[0xc55a16,0x244f86,0x202226];for(let i=0;i<3;i++){const shirt=v72Box(.48,.72,.18,colors[i],-.7+i*.7,1.18,0);g.add(shirt)}g.position.set(6.3,0,-3.8);scene.add(g);return g}
function v72MakeExitMat(){const m=new THREE.Mesh(new THREE.PlaneGeometry(2.2,1.25),new THREE.MeshStandardMaterial({color:0x30475c,roughness:1}));m.rotation.x=-Math.PI/2;m.position.set(0,.025,6.6);scene.add(m);return m}
const v72Disk=v72MakeDisk();
let v72Camera=null;
const v72Rack=v72MakeRack();
const v72Exit=v72MakeExitMat();
if(localStorage.getItem(V72_CAMERA_KEY)!=='1'){
  loader.load('./models/camera-ventara.glb',gltf=>{v72Camera=gltf.scene;const b=new THREE.Box3().setFromObject(v72Camera),s=new THREE.Vector3();b.getSize(s);v72Camera.scale.setScalar(.7/Math.max(s.y,.001));const b2=new THREE.Box3().setFromObject(v72Camera);v72Camera.position.set(2.8,.62-b2.min.y,4.65);v72Camera.rotation.y=Math.PI;v72Camera.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});scene.add(v72Camera)},undefined,()=>{v72Camera=v72MakeCameraFallback();v72Camera.position.set(2.8,.72,4.65);scene.add(v72Camera)});
}
function v72DistanceTo(obj){if(!obj)return Infinity;return player.position.distanceTo(obj.position)}
function v72Nearest(){
  const entries=[{id:'salir',obj:v72Exit,text:'E · SALIR A GTA MANUCHO'},{id:'guardar',obj:v72Disk,text:'E · GUARDAR PARTIDA EN ARCHIVO'},{id:'ropa',obj:v72Rack,text:'E · CAMBIAR ROPA'}];
  if(v72Camera)entries.push({id:'camara',obj:v72Camera,text:'E · RECOGER CÁMARA'});
  let best=null,dist=1.55;for(const e of entries){const d=v72DistanceTo(e.obj);if(d<dist){best=e;dist=d}}return best;
}
function v72CollectStorage(){const out={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&(k.startsWith('vice_')||k.startsWith('vice-')||k.startsWith('game_of_crew')))out[k]=localStorage.getItem(k)}return out}
function v72CityState(){try{return JSON.parse(localStorage.getItem(V72_HOUSE_RETURN_KEY)||'null')}catch{return null}}
function v72DownloadSave(){const state=v72CityState()||{x:-2200*16,y:1,z:-5000*16+286,yaw:Math.PI,health:150,armor:85,money:200};const save={format:'VICE_CITY_OFFLINE_SAVE',version:72,savedAt:new Date().toISOString(),slot:'casa_inicial',slotName:'CASA INICIAL',player:state,runtime:{activeWeapon:'fist',wantedLevel:0},localStorage:v72CollectStorage()};const blob=new Blob([JSON.stringify(save,null,2)],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`VICE_CITY_CASA_${new Date().toISOString().replace(/[:.]/g,'-')}.vcsave`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);v72Show('PARTIDA GUARDADA EN TU COMPUTADORA',3200)}
function v72ExitHouse(){localStorage.setItem(V72_RETURNING_KEY,'1');location.href='../index.html?noprogressive=1&house=1'}
function v72ApplyOutfit(){const id=localStorage.getItem(V72_OUTFIT_KEY)||'naranja';const palette=id==='azul'?[0x244f86,0x14283f]:id==='oscuro'?[0x202226,0x08090b]:[0xc55a16,0x17120e];let idx=0;visual.traverse?.(o=>{if(!o.isMesh&&!o.isSkinnedMesh)return;const n=`${o.name||''} ${o.material?.name||''}`.toLowerCase();if(/head|face|skin|hand|eye|teeth/.test(n))return;const mats=Array.isArray(o.material)?o.material:[o.material];const next=mats.map(m=>{if(!m?.clone)return m;if(!m.userData?.v72HouseClone){const c=m.clone();c.userData={...(m.userData||{}),v72HouseClone:true};m=c}m.color?.setHex(palette[idx++%2]);return m});o.material=Array.isArray(o.material)?next:next[0]})}
function v72CycleOutfit(){const order=['naranja','azul','oscuro'];const current=localStorage.getItem(V72_OUTFIT_KEY)||'naranja';const next=order[(order.indexOf(current)+1)%order.length];localStorage.setItem(V72_OUTFIT_KEY,next);v72ApplyOutfit();v72Show(`ROPA CAMBIADA · ${next.toUpperCase()}`)}
function v72PickupCamera(){localStorage.setItem(V72_CAMERA_KEY,'1');if(v72Camera?.parent)v72Camera.parent.remove(v72Camera);v72Camera=null;v72Show('CÁMARA GUARDADA EN EL INVENTARIO · C PARA USARLA',3200)}
function v72SetCamera(on){v72CameraEquipped=Boolean(on&&localStorage.getItem(V72_CAMERA_KEY)==='1');v72Viewfinder.style.display=v72CameraEquipped?'block':'none';if(v72CameraEquipped){firstPerson=true;modeEl.textContent='CÁMARA';crosshair.style.display='none'}else{modeEl.textContent=firstPerson?'PRIMERA PERSONA':'TERCERA PERSONA';crosshair.style.display=firstPerson?'block':'none'}}
function v72TakePhoto(){renderer.render(scene,camera);renderer.domElement.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`CASA_FOTO_${new Date().toISOString().replace(/[:.]/g,'-')}.png`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);v72Show('FOTO GUARDADA EN TU COMPUTADORA',1800)},'image/png')}
addEventListener('keydown',e=>{
  if(e.code==='KeyC'&&!e.repeat&&localStorage.getItem(V72_CAMERA_KEY)==='1'){e.preventDefault();e.stopImmediatePropagation();v72SetCamera(!v72CameraEquipped);return}
  if(e.code!=='KeyE'||e.repeat)return;const n=v72Nearest();if(!n)return;e.preventDefault();e.stopImmediatePropagation();if(n.id==='salir')v72ExitHouse();else if(n.id==='guardar')v72DownloadSave();else if(n.id==='camara')v72PickupCamera();else if(n.id==='ropa')v72CycleOutfit();
},true);
renderer.domElement.addEventListener('pointerdown',e=>{v72PointerStart={x:e.clientX,y:e.clientY}},true);
renderer.domElement.addEventListener('pointerup',e=>{if(!v72CameraEquipped||e.button!==0||!v72PointerStart)return;const d=Math.hypot(e.clientX-v72PointerStart.x,e.clientY-v72PointerStart.y);v72PointerStart=null;if(d<8){e.preventDefault();e.stopImmediatePropagation();v72TakePhoto()}},true);
setInterval(()=>{v72EnsureUi();const n=v72Nearest();v72Prompt.style.display=n?'block':'none';if(n)v72Prompt.textContent=n.text;v72ApplyOutfit()},140);
setTimeout(v72ApplyOutfit,700);
