import test from 'node:test';
import assert from 'node:assert/strict';
import {discoveredDungeons,nearbyMonsterMarkers,mapMarkerAt,MAX_MAP_MONSTERS,
  MONSTER_REVEAL_RADIUS} from '../js/map-discoveries.js';
import {worldToMap} from '../js/explorer-map-core.js';

test('known dungeon pins use actual scouted positions and entrance offsets',()=>{
 const progress={
   den:{x:100,z:80},denBuilt:true,
   storm:{site:{x:-50,z:200},built:false},
   aurora:{site:{x:300,z:-400},built:true},
   abyss:{site:{x:-900,z:40},built:false}
 };
 const pins=discoveredDungeons(progress);
 assert.equal(pins.length,4);
 assert.deepEqual(pins.map(p=>({id:p.id,x:p.x,z:p.z,built:p.built})),[
  {id:'map-frost-ruins',x:100,z:74,built:true},
  {id:'map-stormspire',x:-50,z:193,built:false},
  {id:'map-aurora',x:300,z:-408,built:true},
  {id:'map-abyss',x:-900,z:32,built:false}
 ]);
 assert.ok(pins.every(p=>p.kind==='dungeon'));
 assert.equal(discoveredDungeons({}).length,0,'no fake dungeons in undiscovered worlds');
 assert.equal(discoveredDungeons({den:{x:NaN,z:3}}).length,0);
 assert.equal(discoveredDungeons({storm:{site:{x:Infinity,z:2}}}).length,0);
});

test('live monster radar only reveals hostile living nearby engine entities',()=>{
 const monsters=[
   {kind:'frostling',x:2,z:5,sp:{iceNative:true},dead:false},
   {kind:'snow_prowler',x:15,z:4,sp:{iceNative:true},dead:false},
   {kind:'cow',x:1,z:1,sp:{passive:true}},
   {kind:'zombie',x:5,z:0,sp:{dmg:2},dead:true},
   {kind:'skeleton',x:5,z:0,sp:{ranged:true},deadT:2},
   {kind:'creeper',x:140,z:0,sp:{creeper:true}},
   {kind:'unknown_mod',x:2,z:0,sp:{}},
   {kind:'spider',x:0,z:6,sp:{dmg:1}}
 ];
 const markers=nearbyMonsterMarkers(monsters,{x:0,z:0});
 assert.deepEqual(markers.map(m=>m.name),['Frostling','Spider','Snow Prowler']);
 assert.ok(markers.every(m=>m.kind==='monster'));
 assert.equal(nearbyMonsterMarkers(monsters,{x:500,z:500}).length,0);
 assert.equal(nearbyMonsterMarkers(monsters,{x:NaN,z:0}).length,0);
 assert.equal(nearbyMonsterMarkers(null,{x:0,z:0}).length,0);
 assert.equal(MONSTER_REVEAL_RADIUS,96);
});

test('monster icon count has a fixed budget and chooses nearest encounters',()=>{
 const mobs=Array.from({length:45},(_,i)=>({kind:'frostling',
   x:2+i,z:1,sp:{iceNative:true},dead:false}));
 const markers=nearbyMonsterMarkers(mobs,{x:0,z:0});
 assert.equal(markers.length,MAX_MAP_MONSTERS);
 assert.equal(markers[0].x,2);
 assert.equal(markers.at(-1).x,13);
 assert.equal(nearbyMonsterMarkers(mobs,{x:0,z:0},50,2).length,2);
 assert.equal(nearbyMonsterMarkers(mobs,{x:0,z:0},50,10000).length,MAX_MAP_MONSTERS);
 assert.equal(nearbyMonsterMarkers(mobs,{x:0,z:0},NaN).length,0);
});

test('tapping a real map marker picks it before choosing a background location',()=>{
 const center={x:50,z:60},step=4,size=336;
 const entries=[
   {id:'dungeon',name:'Frost Ruins',x:50,z:80},
   {id:'monster',name:'Frostling',x:70,z:90}
 ];
 const where=worldToMap(entries[0].x,entries[0].z,center.x,center.z,step,size);
 assert.equal(mapMarkerAt(entries,where.x+5,where.y+3,center,step,size)?.id,'dungeon');
 assert.equal(mapMarkerAt(entries,where.x+40,where.y+40,center,step,size),null);
 assert.equal(mapMarkerAt(entries,NaN,3,center,step,size),null);
 assert.equal(mapMarkerAt([],10,10,center,step,size),null);
 assert.equal(mapMarkerAt(entries,where.x,where.y,center,-1,size),null);
});
