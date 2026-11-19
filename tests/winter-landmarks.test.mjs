import test from 'node:test';
import assert from 'node:assert/strict';
import {LANDMARK_CELL,MAX_ACTIVE_LANDMARKS,MAX_VISITED_LANDMARKS,
  LANDMARK_INTERACT_RADIUS,TYPES,starterWinterRefuge,winterSiteAtCell,
  nearbyWinterSites,safeWinterLandmarks,visitWinterSite,useWinterSite,
  nearestInteractableSite,visitedLandmarkPlaces} from '../js/winter-landmarks-core.js';
import {validateWorldSave} from '../js/world-save-guard.js';

const ground={column(){return {h:49,biome:3};}};
const start={x:2.5,y:50,z:2.5};
const site={id:'starter',kind:'refuge',x:42,z:12,y:50,name:'Wayfarer Refuge'};
const serial=v=>JSON.parse(JSON.stringify(v));

test('seeded sites are stable, terrain-suited and generate recognizable encounters',()=>{
  const spot=starterWinterRefuge(555,start,ground);
  assert.ok(spot);assert.equal(spot.id,'starter');assert.equal(spot.kind,'refuge');
  assert.deepEqual(starterWinterRefuge(555,start,ground),spot);
  assert.equal(spot.y,50);
  const a=[];
  for(let x=-4;x<=4;x++)for(let z=-4;z<=4;z++){
    const result=winterSiteAtCell(555,x,z,ground);
    if(result)a.push(result);
  }
  assert.ok(a.length>8,'real optional landmarks distribute throughout seeded world');
  assert.equal(new Set(a.map(x=>x.id)).size,a.length);
  assert.ok(a.some(x=>x.kind==='cairn'));
  assert.ok(a.some(x=>x.kind==='spire'));
  assert.ok(a.some(x=>x.kind==='refuge'));
  for(const s of a){
    assert.equal(s.y,50);
    assert.ok(Object.hasOwn(TYPES,s.kind));
    assert.ok(Math.floor(s.x/LANDMARK_CELL)>=-4);
  }
  assert.deepEqual(winterSiteAtCell(555,0,0,ground),
    winterSiteAtCell(555,0,0,ground));
});

test('unusable/cliff/ocean coordinates never spawn a floating permanent model',()=>{
  assert.equal(starterWinterRefuge(42,start,{column:()=>({h:27,biome:5})}),null);
  assert.equal(winterSiteAtCell(42,0,0,{column:()=>({h:28,biome:3})}),null);
  const cliff={column(x){return {h: x%2===0?70:40,biome:3};}};
  assert.equal(starterWinterRefuge(55,start,cliff),null);
  assert.equal(winterSiteAtCell(55,0,0,cliff),null);
  assert.equal(winterSiteAtCell(55,1.3,2,ground),null);
  assert.equal(winterSiteAtCell(55,10001,2,ground),null);
  assert.equal(starterWinterRefuge(55,{x:NaN,z:0},ground),null);
});

test('nearby list has strict radius and mesh budget, excludes camp overlap',()=>{
  const first=nearbyWinterSites(123,ground,start,start);
  const again=nearbyWinterSites(123,ground,start,start);
  assert.deepEqual(first,again);
  assert.ok(first.length>=1);
  assert.ok(first.length<=MAX_ACTIVE_LANDMARKS);
  assert.ok(first.some(s=>s.id==='starter'));
  assert.ok(first.every(s=>Math.hypot(s.x-start.x,s.z-start.z)<=115));
  assert.ok(first.every(s=>s.id==='starter'||Math.hypot(s.x-start.x,s.z-start.z)>=26));
  assert.equal(nearbyWinterSites(123,ground,null,start).length,0);
  assert.deepEqual(nearbyWinterSites(123,ground,start,start,0),[]);
});

test('saving one landmark visit and benefit never allows a double-claim',()=>{
  const raw=safeWinterLandmarks(null);
  assert.deepEqual(raw,{version:1,visited:[],used:[]});
  const first=visitWinterSite(raw,site);
  assert.equal(first.first,true);
  assert.equal(first.state.visited.length,1);
  assert.equal(visitWinterSite(first.state,site).first,false);
  const claim=useWinterSite(first.state,site);
  assert.equal(claim.first,true);
  assert.deepEqual(claim.state.used,['starter']);
  assert.equal(useWinterSite(claim.state,site).first,false);
  assert.equal(useWinterSite(null,site).first,false,
    'cannot benefit from a site before physically inspecting it');
  assert.equal(serial(claim.state).visited[0].id,'starter');
  assert.deepEqual(safeWinterLandmarks(serial(claim.state)),claim.state);
  assert.deepEqual(visitedLandmarkPlaces(claim.state).map(x=>x.name),['Wayfarer Refuge']);
});

test('untrusted and malformed saves are bounded without mutating older data',()=>{
  const mixed={
    visited:[
      {id:'starter',kind:'refuge',x:42.8,z:2.3},
      {id:'starter',kind:'refuge',x:400,z:400},
      {id:'site:3:-2',kind:'spire',x:-32,z:-90},
      {id:'site:3:-2',kind:'cairn',x:22,z:44},
      {id:'site:3:50',kind:'bogus',x:5,z:3},
      {id:'site:444444444444:8',kind:'refuge',x:2,z:3},
      {id:'site:2:4',kind:'cairn',x:Infinity,z:2},
    ],
    used:['not-a-visited-site','starter','starter','site:3:-2']
  };
  const cleaned=safeWinterLandmarks(mixed);
  assert.equal(cleaned.visited.length,2);
  assert.equal(cleaned.used.length,2);
  assert.equal(cleaned.visited[0].x,42);
  assert.equal(cleaned.visited[0].z,2);
  assert.equal(safeWinterLandmarks({visited:'bad',used:123}).visited.length,0);
  const many=Array.from({length:100},(_,i)=>({
    id:'site:'+i+':0',kind:'cairn',x:i*128,z:0}));
  assert.equal(safeWinterLandmarks({visited:many}).visited.length,MAX_VISITED_LANDMARKS);
  assert.equal(safeWinterLandmarks({visited:many,used:many.map(x=>x.id)}).used.length,
    MAX_VISITED_LANDMARKS);
});

test('interact range requires actual 3D proximity, not a remote or dead marker',()=>{
  const other={...site,id:'site:2:1',x:130};
  assert.equal(nearestInteractableSite([site],{x:42.2,y:50,z:12.2})?.id,'starter');
  assert.equal(nearestInteractableSite([site],{x:42.2,y:77,z:12.2}),null);
  assert.equal(nearestInteractableSite([site],{x:100,y:50,z:12}),null);
  assert.equal(nearestInteractableSite([site,other],{x:130,y:50,z:12})?.id,'site:2:1');
  assert.equal(nearestInteractableSite([],start),null);
  assert.equal(LANDMARK_INTERACT_RADIUS,6);
});

test('optional per-world landmark save remains portable and does not replace legacy saves',()=>{
  const before={seed:124,player:{x:0,y:45,z:0,inv:Array(36).fill(null)},edits:{}};
  const record=useWinterSite(visitWinterSite(null,site).state,site).state;
  const expanded={...before,winterLandmarks:record};
  assert.deepEqual(validateWorldSave(expanded).winterLandmarks,record);
  assert.equal(validateWorldSave(before).winterLandmarks,undefined);
});
