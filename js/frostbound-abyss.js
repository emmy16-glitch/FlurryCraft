// Chapter 4: Frostbound Abyss (Levels 31–40).
// Remote four-hall fortress. Scouting is read-only; building requires consent.
export const ABYSS_VERSION=1;
export const ABYSS_UNLOCK_LEVEL=30;
export const ABYSS_ROOM_OFFSETS=Object.freeze([0,19,38,57]);
export const ABYSS_ROOM_NAMES=Object.freeze([
  'Crevasse Gate','Umbral Hunting Grounds',
  'Obsidian Sentinel Vault','Heart of the Abyss'
]);
export const ABYSS_FOOTPRINT='19 × 75 blocks';
export const ABYSS_REWARDS=Object.freeze({crystals:7,shards:16,bricks:36,xp:520});

export function abyssPulse(hp,maxHp){
  const enraged=Number.isFinite(hp)&&Number.isFinite(maxHp)&&hp>0&&
    maxHp>0&&hp<=maxHp*.45;
  return {enraged,radius:enraged?5.8:4.8,
    interval:enraged?5.8:7.8,chargeSeconds:enraged?1.15:1.8,
    damage:enraged?4.0:3.3};
}
export function abyssRoom(site,index){
  const i=Math.max(0,Math.min(3,Number.isFinite(index)?Math.floor(index):0));
  return {x:site.x,y:site.y,z:site.z+ABYSS_ROOM_OFFSETS[i]};
}
export function abyssGate(site){
  return site?{x:site.x+.5,y:site.y+.3,z:site.z-8.5}:null;
}
export function nearAbyssGate(player,site,radius=6.8){
  const g=abyssGate(site);
  return !!(player&&g&&[player.x,player.y,player.z].every(Number.isFinite)&&
    Math.abs(player.y-g.y)<7&&Math.hypot(player.x-g.x,player.z-g.z)<=radius);
}
export function inAbyssRoom(player,site,index){
  if(!player||!site||![player.x,player.y,player.z].every(Number.isFinite))return false;
  const room=abyssRoom(site,index);
  return Math.abs(player.x-room.x-.5)<7&&
    Math.abs(player.z-room.z-.5)<8&&Math.abs(player.y-room.y)<6;
}
export function findAbyssSite(spawn,gen,oldSites=[]){
  if(!spawn||![spawn.x,spawn.z].every(Number.isFinite)||
     !gen||typeof gen.column!=='function')return null;
  const x0=Math.floor(spawn.x),z0=Math.floor(spawn.z);
  // Long enough away to keep earlier dungeons and buildings separate.
  const candidates=[[264,12],[-265,19],[16,268],[18,-270],
    [232,147],[-235,-144],[244,-152],[-244,151],
    [310,8],[-308,-8],[10,310],[-10,-308]];
  let winner=null,score=Infinity;
  for(const [dx,dz] of candidates){
    const x=x0+dx,z=z0+dz;
    if(oldSites.some(s=>s&&Math.hypot(x-s.x,z-s.z)<105))continue;
    let lo=Infinity,hi=-Infinity,valid=true;
    for(let zz=-8;zz<=66&&valid;zz+=5)for(let xx=-9;xx<=9;xx+=3){
      const height=gen.column(x+xx,z+zz)?.h;
      if(!Number.isFinite(height)||height<34||height>77){valid=false;break;}
      lo=Math.min(lo,height);hi=Math.max(hi,height);
    }
    if(!valid||hi-lo>11)continue;
    const rank=(hi-lo)+Math.hypot(dx,dz)*.004;
    if(rank<score){score=rank;winner={x,z,y:Math.min(82,Math.max(36,hi+1))};}
  }
  return winner;
}
export function generateFrostboundAbyss(site,B,gen){
  if(!site||![site.x,site.y,site.z].every(Number.isInteger)||
     site.y<2||site.y>82)throw new Error('Invalid Frostbound Abyss site');
  const cells=new Map();
  const put=(x,y,z,id)=>{
    if(y<1||y>=95)return;
    cells.set(x+','+y+','+z,[x,y,z,id]);
  };
  // A four-room frost-and-shadow stone keep, connected through safe arches.
  // Clear seven vertical blocks so tall bosses and third-person camera fit.
  for(let zz=-8;zz<=66;zz++)for(let xx=-9;xx<=9;xx++){
    const x=site.x+xx,z=site.z+zz,height=gen.column(x,z)?.h??site.y-2;
    for(let y=Math.max(1,site.y-11);y<site.y-1;y++)
      if(y>height)put(x,y,z,B.STONE_BRICKS);
    for(let yy=site.y;yy<=site.y+7;yy++)put(x,yy,z,B.AIR);
    const side=Math.abs(xx)===9,front=zz===-8,back=zz===66;
    const partition=[9,10,28,29,47,48].includes(zz);
    const door=Math.abs(xx)<=2&&!back;
    const wall=side||((front||back||partition)&&!door);
    if(wall)for(let y=0;y<=6;y++)put(x,site.y+y,z,
      y===0||y===6?B.FROST_BRICK:y%2?B.STONE_BRICKS:B.ICE);
    const aisle=Math.abs(xx)<=2;
    const tile=side||front||back?B.STONE_BRICKS:
      aisle?B.ICE:zz<=10?B.FROST_BRICK:
      zz<=29?B.STONE_BRICKS:zz<=48?B.ICE:B.FROST_BRICK;
    put(x,site.y-1,z,tile);
    // Roof border deliberately leaves a wide sky-lit arena for touch cameras.
    if(side||front||back||partition)
      put(x,site.y+8,z,B.FROST_BRICK);
  }
  // Four recognizable chambers: paired six-block crystal columns.
  for(const offset of ABYSS_ROOM_OFFSETS){
    for(const x0 of [-7,7])for(const z0 of [-5,5]){
      for(let i=0;i<6;i++)put(site.x+x0,site.y+i,site.z+offset+z0,
        i%2?B.ICE:B.FROST_BRICK);
      put(site.x+x0,site.y+6,site.z+offset+z0,B.TORCH);
    }
    for(const [x,z] of [[0,0],[3,0],[-3,0],[0,3],[0,-3]])
      put(site.x+x,site.y-1,site.z+offset+z,B.FROST_BRICK);
  }
  // Archway through the outer facade.
  for(const xx of [-6,6]){
    for(let i=0;i<9;i++)
      put(site.x+xx,site.y+i,site.z-8,i%2?B.ICE:B.FROST_BRICK);
    put(site.x+xx,site.y+9,site.z-8,B.TORCH);
  }
  for(let xx=-5;xx<=5;xx++)
    put(site.x+xx,site.y+8,site.z-8,B.FROST_BRICK);
  for(const zz of [-8,9,10,28,29,47,48])for(let xx=-2;xx<=2;xx++)
    for(let yy=0;yy<=6;yy++)put(site.x+xx,site.y+yy,site.z+zz,B.AIR);
  return [...cells.values()];
}
