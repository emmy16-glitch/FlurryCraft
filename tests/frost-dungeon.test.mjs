import test from 'node:test';
import assert from 'node:assert/strict';
import {DUNGEON_VERSION,ROOM_OFFSETS,ROOM_NAMES,ENTRANCE_OFFSET,generateFrostDungeon,
 dungeonEntrance,withinDungeonEntry,enteredChamber,chamberPosition} from '../js/frost-dungeon.js';
const B={AIR:0,FROST_BRICK:79,STONE_BRICKS:35,ICE:29,TORCH:22};
const den={x:38,y:44,z:13};
const gen={column(){return {h:42}}};
test('Frost Ruins create three connected chambers with open doorway and a boss sanctuary',()=>{
 const edits=generateFrostDungeon(den,B,gen);
 const voxels=new Map(edits.map(([x,y,z,id])=>[x+','+y+','+z,id]));
 const get=(x,y,z)=>voxels.get(x+','+y+','+z);
 assert.ok(edits.length>2000);
 assert.equal(edits.length,voxels.size);
 for(const dz of [6,7,8,20,21,22])for(const dx of [-2,-1,0,1,2])
  for(let dy=0;dy<=3;dy++)assert.equal(get(den.x+dx,den.y+dy,den.z+dz),B.AIR);
 for(const center of ROOM_OFFSETS){
  assert.equal(get(den.x,den.y-1,den.z+center),B.FROST_BRICK);
  assert.equal(get(den.x,den.y+1,den.z+center),B.AIR);
 }
 assert.equal(get(den.x,den.y+1,den.z+ENTRANCE_OFFSET),B.AIR);
 assert.equal(get(den.x,den.y+1,den.z+34),B.FROST_BRICK);
 assert.deepEqual(ROOM_NAMES,['Frostling Hall','Prowler Gallery','Glacier Sanctum']);
 assert.equal(DUNGEON_VERSION,2);
});
test('proximity entrance and room transitions are physical, not a remote teleport',()=>{
 const door=dungeonEntrance(den);
 assert.equal(withinDungeonEntry(door,den),true);
 assert.equal(withinDungeonEntry({...door,x:100},den),false);
 assert.equal(withinDungeonEntry({...door,y:100},den),false);
 for(let i=0;i<3;i++){
  const room=chamberPosition(den,i);
  assert.equal(enteredChamber({x:room.x+.5,z:room.z+.5,y:room.y},den,i),true);
 }
 assert.equal(enteredChamber({x:den.x,z:den.z,y:den.y},den,2),false);
});
test('site validation prevents impossible out-of-world construction',()=>{
 assert.throws(()=>generateFrostDungeon(null,B,gen),/site/i);
 assert.throws(()=>generateFrostDungeon({x:NaN,y:30,z:2},B,gen),/site/i);
 const upper=generateFrostDungeon({x:0,y:94,z:0},B,gen);
 assert.ok(upper.every(p=>p[1]<95));
});
