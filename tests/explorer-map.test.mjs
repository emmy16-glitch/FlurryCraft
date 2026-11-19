import test from 'node:test';
import assert from 'node:assert/strict';
import {mapToWorld,worldToMap,directionTo,markerKey,cleanPlace,sanitizePlaces,winterMapColor,dungeonChapterProgress,MAP_CELLS,MAX_PLACES} from '../js/explorer-map-core.js';
test('map projection rounds trip the same block at all zoom levels',()=>{
 for(const step of [2,4,7,12]){
  for(const [x,z] of [[0,0],[113,-79],[-283,231]]){
   const a=worldToMap(x,z,10,-20,step,320);
   const b=mapToWorld(a.x,a.y,10,-20,step,320);
   assert.deepEqual(b,{x,z});
  }
 }
 assert.equal(MAP_CELLS,96);
});
test('navigation bearing is relative to the player camera',()=>{
 assert.equal(directionTo(0,0,0,-10,0).angle,0);
 assert.ok(Math.abs(directionTo(0,0,10,0,0).angle+Math.PI/2)<1e-8);
 assert.equal(directionTo(0,0,3,4,0).distance,5);
 assert.ok(Math.abs(directionTo(0,0,-10,0,Math.PI/2).angle)<1e-8);
});
test('waypoints are bounded, per world, and ignore poisoned storage data',()=>{
 const all=Array.from({length:22},(_,i)=>({id:'a'+i,name:'Long '.repeat(10),x:i,z:i+3}));
 const input={home:{x:6.3,z:8,name:'wrong'},marks:[...all,{id:'a1',x:50,z:50},{id:'hack',x:Infinity,z:1},{id:'bad'}]};
 const parsed=sanitizePlaces(input);
 assert.equal(parsed.marks.length,MAX_PLACES);
 assert.equal(parsed.home.id,'home');
 assert.equal(parsed.home.name,'Home');
 assert.equal(parsed.marks[0].name.length,24);
 assert.equal(parsed.marks[1].x,1);
 assert.equal(cleanPlace({id:'x',x:Infinity,z:0}),null);
 assert.notEqual(markerKey('world-A'),markerKey('world-B'));
});
test('winter map colors are valid CSS and ocean differs from land',()=>{
 const ice=winterMapColor(23,5),land=winterMapColor(41,3),mountain=winterMapColor(80,4);
 for(const color of [ice,land,mountain])assert.match(color,/^#[0-9a-f]{6}$/);
 assert.notEqual(ice,land);assert.notEqual(land,mountain);
});

test('dungeon chapter map mirrors level and previous-clear unlock gates',()=>{
 const locked=dungeonChapterProgress({level:10,clears:0});
 assert.equal(locked[0].unlocked,true);
 assert.equal(locked[1].unlocked,false,'Level 10 alone is not enough');
 assert.match(locked[1].requirement,/clear Frost Ruins/);
 const storm=dungeonChapterProgress({level:10,clears:1,
   storm:{site:{x:40,y:50,z:-20},built:true,clears:0}});
 assert.equal(storm[1].unlocked,true);
 assert.equal(storm[1].built,true);
 assert.deepEqual(storm[1].site,{x:40,y:50,z:-20});
 assert.equal(storm[2].unlocked,false);
 const aurora=dungeonChapterProgress({level:20,clears:1,
   storm:{clears:1},aurora:{site:{x:80,y:55,z:90},built:true,clears:1}});
 assert.equal(aurora[2].unlocked,true);
 assert.equal(aurora[3].unlocked,false);
 const abyss=dungeonChapterProgress({level:30,clears:1,
   storm:{clears:1},aurora:{clears:1},abyss:{site:{x:-80,y:60,z:90},built:true}});
 assert.equal(abyss[3].unlocked,true);
 assert.equal(abyss[3].built,true);
});
test('chapter progress rejects malformed and fabricated coordinates',()=>{
 const chapters=dungeonChapterProgress({level:100,clears:1,
   storm:{site:{x:Infinity,y:50,z:0},built:true,clears:1},
   aurora:{site:{x:5,y:100,z:8},built:true,clears:1}});
 assert.equal(chapters[1].site,null);
 assert.equal(chapters[1].built,false);
 assert.equal(chapters[2].site,null);
 assert.equal(chapters[2].built,false);
 assert.equal(chapters[3].unlocked,true);
 assert.equal(chapters[3].site,null);
});
