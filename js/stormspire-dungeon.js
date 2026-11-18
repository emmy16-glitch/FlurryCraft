// Stormspire Keep — Chapter 2 (Levels 11–20). A distinct, opt-in dungeon.
// Building is always explicitly confirmed by the player, to protect existing saves.
export const STORM_VERSION=1;
export const STORM_UNLOCK_LEVEL=10;
export const STORM_ROOM_OFFSETS=Object.freeze([0,18,36]);
export const STORM_ROOM_NAMES=Object.freeze(['Hound Courtyard','Rime Guard Hall','Eye of the Blizzard']);
export const STORM_FOOTPRINT='15 × 51 blocks';

export function stormRoom(site,index){
  const i=Math.max(0,Math.min(2,Math.floor(index)||0));
  return {x:site.x,y:site.y,z:site.z+STORM_ROOM_OFFSETS[i]};
}
export function stormGate(site){
  return site?{x:site.x+.5,y:site.y+.25,z:site.z-7.5}:null;
}
export function nearStormGate(player,site){
  const door=stormGate(site);
  return !!(player&&door&&Math.abs(player.y-door.y)<7&&
    Math.hypot(player.x-door.x,player.z-door.z)<6.5);
}
export function inStormRoom(player,site,index){
  if(!player||!site)return false;
  const r=stormRoom(site,index);
  return Math.abs(player.x-r.x-.5)<5&&
    Math.abs(player.z-r.z-.5)<6.5&&Math.abs(player.y-r.y)<6;
}
export function stormSite(spawn,gen,previousSite=null){
  if(!spawn||!gen||typeof gen.column!=='function')return null;
  const bx=Math.floor(spawn.x),bz=Math.floor(spawn.z);
  const offsets=[[102,14],[-102,14],[10,107],[-10,-108],[80,-90],[-83,91],[124,32],[-121,31]];
  let best=null,score=Infinity;
  for(const [dx,dz] of offsets){
    const x=bx+dx,z=bz+dz;
    if(previousSite&&Math.hypot(x-previousSite.x,z-previousSite.z)<65)continue;
    let low=Infinity,high=-Infinity,wet=false;
    // Inspect all three rooms, not just the entrance.
    for(let zz=-7;zz<=43;zz+=5)for(let xx=-7;xx<=7;xx+=3){
      const h=gen.column(x+xx,z+zz).h;
      if(!Number.isFinite(h)||h<=32||h>82)wet=true;
      low=Math.min(low,h);high=Math.max(high,h);
    }
    if(wet||high-low>15)continue;
    const rating=high-low+Math.abs(dx)*.001+Math.abs(dz)*.001;
    if(rating<score){score=rating;best={x,y:Math.max(34,Math.min(85,high+1)),z};}
  }
  return best;
}
export function generateStormspire(site,B,gen){
  if(!site||![site.x,site.y,site.z].every(Number.isFinite))
    throw new Error('Stormspire site missing');
  const map=new Map();
  const put=(x,y,z,id)=>{
    if(y<1||y>=95)return;
    map.set(x+','+y+','+z,[x,y,z,id]);
  };
  // 15-wide, 51-deep raised froststone fortress; the three halls connect
  // through doorways so players walk from fight to fight without teleporting.
  for(let zz=-7;zz<=43;zz++)for(let xx=-7;xx<=7;xx++){
    const x=site.x+xx,z=site.z+zz;
    const ground=gen.column(x,z).h;
    for(let y=Math.max(1,site.y-9);y<site.y-1;y++)
      if(y>=ground+1)put(x,y,z,B.STONE_BRICKS);
    // Clear the full headroom — no invisible barriers on touch devices.
    for(let y=site.y;y<=site.y+5;y++)put(x,y,z,B.AIR);
    const side=Math.abs(xx)===7;
    const cross=[-7,8,9,10,26,27,28,43].includes(zz);
    const openDoor=Math.abs(xx)<=2&&zz!==43;
    const wall=side||(cross&&!openDoor);
    if(wall)for(let k=0;k<5;k++)
      put(x,site.y+k,z,k===0||k===4?B.STONE_BRICKS:B.FROST_BRICK);
    const chamber=zz<=9?0:zz<=27?1:2;
    const center=Math.abs(xx)<=1,edge=Math.abs(xx)>=6||zz===-7||zz===43;
    const floor=edge?B.STONE_BRICKS:
      center?B.FROST_BRICK:
      chamber===1?B.STONE_BRICKS:B.ICE;
    put(x,site.y-1,z,floor);
    // Alternating ice roof and skylights. Torches provide in-game light.
    if(!(center&&STORM_ROOM_OFFSETS.includes(zz)))
      put(x,site.y+6,z,(side||cross||chamber===2)?B.FROST_BRICK:B.ICE);
  }
  // Four columns per hall, with beacons made of real, luminous torches.
  for(const offset of STORM_ROOM_OFFSETS)for(const xx of [-5,5])
    for(const zz of [-4,4]){
      const x=site.x+xx,z=site.z+offset+zz;
      for(let k=0;k<3;k++)put(x,site.y+k,z,k===1?B.ICE:B.STONE_BRICKS);
      put(x,site.y+3,z,B.TORCH);
    }
  // Stair-free entry with a high arch and visible side towers.
  for(const xx of [-4,4]){
    for(let k=0;k<6;k++)put(site.x+xx,site.y+k,site.z-7,B.FROST_BRICK);
    put(site.x+xx,site.y+6,site.z-7,B.ICE);
  }
  for(let xx=-3;xx<=3;xx++)
    put(site.x+xx,site.y+5,site.z-7,B.STONE_BRICKS);
  // Re-open connecting doors after columns and roof placement.
  for(const zz of [8,9,10,26,27,28])for(let xx=-2;xx<=2;xx++)
    for(let k=0;k<=4;k++)put(site.x+xx,site.y+k,site.z+zz,B.AIR);
  // Contrasting storm-sigil emblems in the floor.
  for(const offset of STORM_ROOM_OFFSETS)
    for(const [xx,zz] of [[0,0],[1,1],[-1,-1],[-1,1],[1,-1],[0,2],[0,-2]])
      put(site.x+xx,site.y-1,site.z+offset+zz,B.FROST_BRICK);
  return [...map.values()];
}
