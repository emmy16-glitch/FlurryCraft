// Procedural three-chamber walk-in Frost Ruins. World block edits are
// generated deterministically and placed in small batches by adventure.js.
export const DUNGEON_VERSION=2;
export const ROOM_OFFSETS=Object.freeze([0,14,28]);
export const ROOM_NAMES=Object.freeze(['Frostling Hall','Prowler Gallery','Glacier Sanctum']);
export const ENTRANCE_OFFSET=-6;
export function chamberPosition(den,index){
  const i=Math.max(0,Math.min(2,Math.floor(index)||0));
  return {x:den.x,y:den.y,z:den.z+ROOM_OFFSETS[i]};
}
export function dungeonEntrance(den){
  return {x:den.x+.5,y:den.y+.25,z:den.z+ENTRANCE_OFFSET-.5};
}
export function withinDungeonEntry(player,den,radius=6.5){
  if(!den||!player)return false;
  const door=dungeonEntrance(den);
  return Math.abs(player.y-door.y)<7 &&
    Math.hypot(player.x-door.x,player.z-door.z)<=radius;
}
export function enteredChamber(player,den,index){
  const room=chamberPosition(den,index);
  return player&&Math.abs(player.x-(room.x+.5))<4.7 &&
    Math.abs(player.z-(room.z+.5))<5.7 &&Math.abs(player.y-room.y)<5;
}
export function generateFrostDungeon(den,B,gen){
  if(!den||![den.x,den.y,den.z].every(Number.isFinite))
    throw new Error('Dungeon site unavailable');
  const map=new Map();
  const put=(x,y,z,id)=>{
    if(y<1||y>94)return;
    map.set(x+','+y+','+z,[x,y,z,id]);
  };
  // A roofed walk-through complex, 13 blocks wide, 41 blocks deep.
  // The three 13x13 rooms join through short archways.
  for(let z=-6;z<=34;z++)for(let x=-6;x<=6;x++){
    const wx=den.x+x,wz=den.z+z;
    const ground=gen.column(wx,wz).h;
    for(let y=Math.max(1,den.y-8);y<den.y-1;y++)
      if(y>=ground+1)put(wx,y,wz,B.FROST_BRICK);
    // Clear passage for headroom and floor leveling.
    for(let y=den.y;y<=den.y+4;y++)put(wx,y,wz,B.AIR);
    const edge=Math.abs(x)===6;
    const entrance=z===-6 || z===34;
    const separator=[6,8,20,22].includes(z);
    const gap=Math.abs(x)<=2;
    const wall=edge||(entrance||separator)&&(!gap||z===34);
    const wallHeight=z===34?4:edge?3:2;
    if(wall)for(let y=0;y<wallHeight;y++)
      put(wx,den.y+y,wz,y===0?B.STONE_BRICKS:B.FROST_BRICK);
    // Floor themes shift subtly, keeping a clean walkable route.
    const central=Math.abs(x)<=1;
    const chamber=z<=6?0:z<22?1:2;
    const tile=central?B.FROST_BRICK:
      chamber===0?B.ICE:chamber===1?B.STONE_BRICKS:B.FROST_BRICK;
    put(wx,den.y-1,wz,(Math.abs(x)>=5||z===-6||z===34)?B.STONE_BRICKS:tile);
    if(!wall){
      // Ice-glass roof with a few narrow skylights for directional daylight.
      const open=central&&(z===0||z===14||z===28);
      if(!open)put(wx,den.y+5,wz,(Math.abs(x)>4||z===-6||z===34)?B.FROST_BRICK:B.ICE);
    }else put(wx,den.y+5,wz,B.FROST_BRICK);
  }
  // Chunky chamber columns, glowing torch pedestals, and a distinct entry arch.
  for(const cz of ROOM_OFFSETS)for(const cx of [-4,4])for(const dz of [-3,3]){
    const px=den.x+cx,pz=den.z+cz+dz;
    for(let y=0;y<3;y++)put(px,den.y+y,pz,y===2?B.ICE:B.STONE_BRICKS);
    put(px,den.y+3,pz,B.TORCH);
  }
  // Big visible entry flanked by paired ice buttresses.
  for(const dx of [-3,3]){
    for(let y=0;y<4;y++)put(den.x+dx,den.y+y,den.z-6,B.FROST_BRICK);
    put(den.x+dx,den.y+4,den.z-6,B.ICE);
  }
  for(let x=-2;x<=2;x++)put(den.x+x,den.y+4,den.z-6,B.FROST_BRICK);
  // Corridor openings must remain walkable and free of ceilings below head.
  for(const z of [6,7,8,20,21,22])for(let x=-2;x<=2;x++)
    for(let y=0;y<=3;y++)put(den.x+x,den.y+y,den.z+z,B.AIR);
  // Replace selected floor stones with a crystal sigil in each room.
  for(const cz of ROOM_OFFSETS){
    for(const [dx,dz] of [[0,0],[-2,0],[2,0],[0,-2],[0,2]])
      put(den.x+dx,den.y-1,den.z+cz+dz,B.FROST_BRICK);
  }
  return [...map.values()];
}
