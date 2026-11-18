// Chapter 3: Aurora Citadel (Levels 21–30).
// Opt-in 17 × 67 structure; generated only after player confirms the edit.
export const AURORA_VERSION=1;
export const AURORA_UNLOCK_LEVEL=20;
export const AURORA_ROOM_OFFSETS=Object.freeze([0,17,34,51]);
export const AURORA_ROOM_NAMES=Object.freeze([
  'Wisp Lantern Court','Prism Stalker Gallery',
  'Crystal Sentinel Hall','Throne of the Boreal Sovereign'
]);
export const AURORA_FOOTPRINT='17 × 67 blocks';
export const AURORA_REWARDS=Object.freeze({crystals:5,shards:12,bricks:28,xp:370});

// One source of truth for the boss's visible two-phase area attack.
export function borealPulse(hp,maxHp){
  const enraged=Number.isFinite(hp)&&Number.isFinite(maxHp)&&maxHp>0&&
    hp>0&&hp<=maxHp*.5;
  return {enraged,radius:enraged?5.3:4.6,
    interval:enraged?5.5:7,chargeSeconds:enraged?1:1.5,damage:3.25};
}
export function auroraRoom(site,index){
  const i=Math.max(0,Math.min(3,Number.isFinite(index)?Math.floor(index):0));
  return {x:site.x,y:site.y,z:site.z+AURORA_ROOM_OFFSETS[i]};
}
export function auroraGate(site){
  return site?{x:site.x+.5,y:site.y+.2,z:site.z-8.5}:null;
}
export function nearAuroraGate(player,site,radius=6.8){
  const gate=auroraGate(site);
  return !!(player&&gate&&Number.isFinite(player.x)&&
    Math.abs(player.y-gate.y)<7&&
    Math.hypot(player.x-gate.x,player.z-gate.z)<=radius);
}
export function inAuroraRoom(player,site,index){
  if(!player||!site)return false;
  const room=auroraRoom(site,index);
  return Math.abs(player.x-room.x-.5)<6&&
    Math.abs(player.z-room.z-.5)<7&&Math.abs(player.y-room.y)<6;
}
export function findAuroraSite(spawn,gen,oldSites=[]){
  if(!spawn||![spawn.x,spawn.z].every(Number.isFinite)||!gen||typeof gen.column!=='function')
    return null;
  const cx=Math.floor(spawn.x),cz=Math.floor(spawn.z);
  const offsets=[[186,16],[-188,-15],[15,190],[-20,-190],[166,132],
    [-164,133],[170,-139],[-174,-141],[215,9],[-213,8]];
  let best=null,score=Infinity;
  for(const [dx,dz] of offsets){
    const x=cx+dx,z=cz+dz;
    if(oldSites.some(s=>s&&Math.hypot(s.x-x,s.z-z)<100))continue;
    let lo=Infinity,hi=-Infinity,valid=true;
    // Check all four halls and the whole 67-block depth, not just the gate.
    for(let zz=-8;zz<=58;zz+=5)for(let xx=-8;xx<=8;xx+=4){
      const col=gen.column(x+xx,z+zz),height=col?.h;
      if(!Number.isFinite(height)||height<=33||height>79){valid=false;break;}
      lo=Math.min(lo,height);hi=Math.max(hi,height);
    }
    if(!valid||hi-lo>12)continue;
    const rank=hi-lo+Math.hypot(dx,dz)*.005;
    if(rank<score){score=rank;best={x,y:Math.max(35,Math.min(82,hi+1)),z};}
  }
  return best;
}
export function generateAuroraCitadel(site,B,gen){
  if(!site||![site.x,site.y,site.z].every(Number.isInteger)||site.y<2||site.y>82)
    throw new Error('Aurora Citadel site unavailable');
  const cells=new Map();
  const put=(x,y,z,id)=>{
    if(y<1||y>=95)return;
    cells.set(x+','+y+','+z,[x,y,z,id]);
  };
  // Four connected 17x16 chambers: froststone foundations, pale ice floors,
  // raised buttresses and sky-lit central aisles for mobile camera visibility.
  for(let zz=-8;zz<=58;zz++)for(let xx=-8;xx<=8;xx++){
    const x=site.x+xx,z=site.z+zz;
    const ground=gen.column(x,z).h;
    for(let y=Math.max(1,site.y-10);y<site.y-1;y++)
      if(y>=ground+1)put(x,y,z,B.STONE_BRICKS);
    for(let y=site.y;y<=site.y+6;y++)put(x,y,z,B.AIR);
    const side=Math.abs(xx)===8,front=zz===-8,back=zz===58;
    const partition=[8,9,25,26,42,43].includes(zz);
    const door=Math.abs(xx)<=2&&!back;
    const wall=side||((front||back||partition)&&!door);
    if(wall)for(let k=0;k<6;k++)put(x,site.y+k,z,
      k===0||k===5?B.STONE_BRICKS:k%2===0?B.ICE:B.FROST_BRICK);
    const core=Math.abs(xx)<=1,outer=Math.abs(xx)>=7||front||back;
    const tile=outer?B.STONE_BRICKS:core?B.FROST_BRICK:
      zz<=9?B.ICE:zz<=26?B.STONE_BRICKS:
      zz<=43?B.ICE:B.FROST_BRICK;
    put(x,site.y-1,z,tile);
    // Arched roof rim; center stays open to the sky in each arena.
    if(!core||partition)put(x,site.y+7,z,
      side||back||front||partition?B.FROST_BRICK:B.ICE);
  }
  // Prism pylons define an instantly recognisable purple-cyan crystal garden
  // without introducing expensive shader passes or new block types.
  for(const zOff of AURORA_ROOM_OFFSETS){
    for(const xOff of [-6,6])for(const dz of [-5,5]){
      const x=site.x+xOff,z=site.z+zOff+dz;
      for(let k=0;k<5;k++)put(x,site.y+k,z,
        k===1||k===3?B.ICE:B.FROST_BRICK);
      put(x,site.y+5,z,B.TORCH);
    }
    for(const [dx,dz] of [[0,0],[-3,0],[3,0],[0,-3],[0,3]]){
      put(site.x+dx,site.y-1,site.z+zOff+dz,B.FROST_BRICK);
    }
  }
  // Entrance: two blue-white spires around the player-size arch.
  for(const xOff of [-5,5]){
    for(let k=0;k<8;k++)put(site.x+xOff,site.y+k,site.z-8,
      k%3===1?B.ICE:B.FROST_BRICK);
    put(site.x+xOff,site.y+8,site.z-8,B.TORCH);
  }
  for(let x=-4;x<=4;x++)put(site.x+x,site.y+7,site.z-8,B.STONE_BRICKS);
  // Re-open both arches at every chamber join. The passage needs full
  // standing headroom and never creates a wall across the central route.
  for(const zz of [8,9,25,26,42,43])
    for(let xx=-2;xx<=2;xx++)
      for(let k=0;k<=5;k++)put(site.x+xx,site.y+k,site.z+zz,B.AIR);
  return [...cells.values()];
}
