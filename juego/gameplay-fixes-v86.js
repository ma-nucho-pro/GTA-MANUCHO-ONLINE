/** GTA MANUCHO V86 — balance policial, colisiones y estabilidad. */
const WORLD_SCALE = 16;
let game = null;
let patchedWorld = null;

function flash(text, duration = 1500) {
  if (!game) return;
  game.currentMessage = text;
  game.updateHUDState?.();
  clearTimeout(flash.timer);
  flash.timer = setTimeout(() => {
    if (game.currentMessage === text) {
      game.currentMessage = undefined;
      game.updateHUDState?.();
    }
  }, duration);
}
function wanted(world) {
  return Math.max(0,Math.min(5,Number(world?.getWantedLevel?.() ?? world?.wantedLevel ?? 0)));
}
function movePoliceFar(world) {
  const player=game?.playerContainer?.position;
  if(!player)return;
  const officers=(world.policeAgents||[]).filter(entry=>entry?.root);
  for(let i=0;i<officers.length;i++){
    const officer=officers[i];
    const dx=officer.root.position.x-player.x,dz=officer.root.position.z-player.z;
    if(Math.hypot(dx,dz)>=520)continue;
    const angle=(i/Math.max(1,officers.length))*Math.PI*2+performance.now()*.00017;
    const distance=850+i*130;
    const x=player.x+Math.cos(angle)*distance;
    const z=player.z+Math.sin(angle)*distance;
    let y=player.y;
    try{const ground=game.getGroundY?.(x,player.y+900,z,false);if(Number.isFinite(ground))y=ground+.1;}catch{}
    officer.root.position.set(x,y,z);
    officer.root.visible=false;
  }
}
function separatePolice(world) {
  const player=game?.playerContainer?.position;if(!player)return;
  for(const officer of world.policeAgents||[]){
    if(!officer?.root?.visible)continue;
    const dx=officer.root.position.x-player.x,dz=officer.root.position.z-player.z;
    const distance=Math.hypot(dx,dz);
    const gap=42;
    if(distance>.001&&distance<gap){
      officer.root.position.x=player.x+dx/distance*gap;
      officer.root.position.z=player.z+dz/distance*gap;
      if(officer.velocity?.set)officer.velocity.set(0,0,0);
    }
  }
}
function patchWorld(world) {
  if(!world||world===patchedWorld||world.__v86Balanced)return;
  patchedWorld=world;world.__v86Balanced=true;
  world.__v86ShotCount=0;world.__v86ShotWindowStart=0;world.__v86LastCrimeAt=0;

  const originalGunshot=typeof world.reportGunshot==='function'?world.reportGunshot.bind(world):null;
  if(originalGunshot){
    world.reportGunshot=function v86Gunshot(...args){
      const now=performance.now();
      if(now-(world.__v86ShotWindowStart||0)>6000){world.__v86ShotWindowStart=now;world.__v86ShotCount=0;}
      world.__v86ShotCount++;
      if(wanted(world)===0&&world.__v86ShotCount<3){
        flash(`DISPARO ${world.__v86ShotCount}/3 · VCPD AÚN NO ALERTADA`,900);
        return;
      }
      if(wanted(world)>0&&now-(world.__v86LastGunshotWantedAt||0)<8500)return;
      world.__v86LastGunshotWantedAt=now;
      const before=wanted(world);
      const result=originalGunshot(...args);
      if(wanted(world)>before+1)world.wantedLevel=before+1;
      setTimeout(()=>movePoliceFar(world),0);
      return result;
    };
  }

  const originalCrime=typeof world.reportCrime==='function'?world.reportCrime.bind(world):null;
  if(originalCrime){
    world.reportCrime=function v86Crime(amount=1,message='DELITO REPORTADO',...rest){
      const now=performance.now();
      const isShot=/DISPARO|SHOT|ARMA/i.test(String(message));
      if(isShot&&wanted(world)===0){
        if(now-(world.__v86ShotWindowStart||0)>6000){world.__v86ShotWindowStart=now;world.__v86ShotCount=0;}
        world.__v86ShotCount++;
        if(world.__v86ShotCount<3){flash(`DISPARO ${world.__v86ShotCount}/3 · VCPD AÚN NO ALERTADA`,900);return;}
      }
      if(now-(world.__v86LastCrimeAt||0)<6500)return;
      world.__v86LastCrimeAt=now;
      const before=wanted(world);
      const result=originalCrime(Math.min(1,Math.max(1,Number(amount)||1)),message,...rest);
      if(wanted(world)>before+1)world.wantedLevel=before+1;
      setTimeout(()=>movePoliceFar(world),0);
      return result;
    };
  }

  const originalActivate=typeof world.activatePolice==='function'?world.activatePolice.bind(world):null;
  if(originalActivate){
    world.activatePolice=function v86Activate(...args){
      const result=originalActivate(...args);
      if(wanted(world)===1){
        for(let i=1;i<(world.policeAgents||[]).length;i++)if(world.policeAgents[i]?.root)world.policeAgents[i].root.visible=false;
      }
      movePoliceFar(world);
      return result;
    };
  }

  const originalUpdate=typeof world.update==='function'?world.update.bind(world):null;
  if(originalUpdate){
    world.update=function v86PoliceUpdate(dt,...args){
      const result=originalUpdate(Math.min(.09,Math.max(0,Number(dt)||0)),...args);
      separatePolice(world);
      return result;
    };
  }
}
function monitor(){
  game=window.__VICE_CITY_GAME__||game;
  if(game?.crimeWorld)patchWorld(game.crimeWorld);
  setTimeout(monitor,180);
}
monitor();
