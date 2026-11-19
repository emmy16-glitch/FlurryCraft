import test from 'node:test';
import assert from 'node:assert/strict';
import {Gen} from '../js/worldgen.js';
import {
  MAX_WORLD_DISCOVERIES,CAVE_REVEAL_RADIUS,LOOT_REVEAL_RADIUS,
  safeWorldExploration,recordWorldDiscovery,worldDiscoveryStats,
  discoveredWorldPlaces,scanCaveEntrances,scanGeneratedLoot,
  scanMonsterTerritories
} from '../js/world-exploration-core.js';

const solid=new Uint8Array(128);solid[1]=1;solid[35]=1;solid[79]=1;
const makeChunk=(cx=0,cz=0)=>{
  const blocks=new Uint8Array(16*16*96);
  return {cx,cz,blocks,hm:new Int16Array(256).fill(50),
    light:new Uint8Array(16*16*96)};
};
const put=(chunk,x,y,z,id)=>{
  chunk.blocks[x+(z<<4)+(y<<8)]=id;
};
const serial=v=>JSON.parse(JSON.stringify(v));

test('fog-of-war state is bounded, world-safe and rejects malformed discovery pins',()=>{
  const raw={discoveries:[
    {id:'cave:0:0:8:8',kind:'cave',name:'Natural Cave Mouth',x:8.8,z:8.1},
    {id:'cave:0:0:8:8',kind:'cave',name:'Duplicate',x:10,z:10},
    {id:'crypt:1:-2',kind:'crypt',name:'Buried Crypt',x:40,z:-30},
    {id:'treasure:cabin:1:2',kind:'treasure',name:'Cabin Cache',x:3,z:4},
    {id:'territory:frostling:0:0',kind:'territory',name:'Frostling Territory',x:2,z:2,radius:38},
    {id:'cave:bad',kind:'unknown',name:'Invalid',x:0,z:0},
    {id:'cave:evil',kind:'cave',name:'Invalid ID',x:Infinity,z:0},
    null
  ]};
  const cleaned=safeWorldExploration(raw);
  assert.equal(cleaned.version,1);
  assert.equal(cleaned.discoveries.length,4);
  assert.equal(cleaned.discoveries[0].x,8);
  assert.equal(cleaned.discoveries[0].z,8);
  assert.equal(cleaned.discoveries[3].radius,38);
  const many=Array.from({length:100},(_,i)=>({
    id:'cave:0:0:'+i+':1',kind:'cave',name:'Cave '+i,x:i,z:1
  }));
  assert.equal(safeWorldExploration({discoveries:many}).discoveries.length,
    MAX_WORLD_DISCOVERIES);
  assert.deepEqual(safeWorldExploration({discoveries:'bad'}).discoveries,[]);
});

test('new discoveries are recorded once and stats stay category-specific',()=>{
  const cave={id:'cave:0:0:8:8',kind:'cave',name:'Natural Cave Mouth',x:8,z:8};
  const first=recordWorldDiscovery(null,cave);
  assert.equal(first.first,true);
  assert.equal(recordWorldDiscovery(first.state,cave).first,false);
  let state=first.state;
  for(const item of [
    {id:'crypt:1:1',kind:'crypt',name:'Buried Crypt',x:20,z:20},
    {id:'treasure:crypt:1:1:0',kind:'treasure',name:'Crypt Chest',x:21,z:21},
    {id:'territory:frostling:1:1',kind:'territory',name:'Frostling Territory',x:25,z:25,radius:38}
  ])state=recordWorldDiscovery(state,item).state;
  assert.deepEqual(worldDiscoveryStats(state),
    {caves:1,crypts:1,treasures:1,territories:1,total:4});
  assert.equal(discoveredWorldPlaces(serial(state)).length,4);
});

test('cave scanner finds only real loaded open shafts with a floor, light and raised sides',()=>{
  const chunk=makeChunk(0,0);
  const x=8,z=8,floor=40,i=x+(z<<4);
  chunk.hm[i]=floor;
  put(chunk,x,floor,z,1);
  for(let y=floor+1;y<=floor+4;y++)put(chunk,x,y,z,0);
  chunk.light[i+((floor+1)<<8)]=0xf0;
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const ni=(x+dx)+((z+dz)<<4);
    chunk.hm[ni]=50;
    put(chunk,x+dx,floor+1,z+dz,35);
  }
  const world={chunks:new Map([['0',chunk]])};
  const found=scanCaveEntrances(world,{x:8,z:8},solid);
  assert.equal(found.length,1);
  assert.equal(found[0].kind,'cave');
  assert.equal(found[0].x,8);
  assert.equal(found[0].z,8);
  assert.match(found[0].id,/^cave:/);
  assert.ok(CAVE_REVEAL_RADIUS>0);

  const roofed=makeChunk(0,0);
  roofed.hm[i]=floor;put(roofed,x,floor,z,1);
  for(let y=floor+1;y<=floor+4;y++)put(roofed,x,y,z,35);
  roofed.light[i+((floor+1)<<8)]=0xf0;
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[-1,0]]){
    const ni=(x+dx)+((z+dz)<<4);roofed.hm[ni]=50;
    put(roofed,x+dx,floor+1,z+dz,35);
  }
  assert.equal(scanCaveEntrances({chunks:new Map([['r',roofed]])},
    {x:8,z:8},solid).length,0,'solid roof/walls are not a cave mouth');

  const dark=makeChunk(0,0);dark.hm[i]=floor;put(dark,x,floor,z,1);
  for(let y=floor+1;y<=floor+4;y++)put(dark,x,y,z,0);
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const ni=(x+dx)+((z+dz)<<4);dark.hm[ni]=50;
    put(dark,x+dx,floor+1,z+dz,35);
  }
  assert.equal(scanCaveEntrances({chunks:new Map([['d',dark]])},
    {x:8,z:8},solid).length,0,'unlit or unverified holes do not reveal');
});

test('real generated cabin and crypt loot exposes metadata without inventing chests',()=>{
  const world={chunks:new Map([['0',{cx:0,cz:0,loot:[
    {x:10,y:50,z:11,kind:'cabin',siteId:'cabin:0:0',items:[{id:1,n:2}]},
    {x:21,y:18,z:21,kind:'crypt',siteId:'crypt:0:0',
      entrance:{x:18,z:18},chestIndex:0,items:[{id:2,n:1}]},
    {x:25,y:18,z:25,kind:'crypt',siteId:'crypt:0:0',
      entrance:{x:18,z:18},chestIndex:1,items:[{id:3,n:1}]}
  ]}]])};
  const found=scanGeneratedLoot(world,{x:20,z:20});
  assert.equal(found.length,4);
  assert.equal(found.filter(x=>x.kind==='crypt').length,1);
  assert.equal(found.filter(x=>x.kind==='treasure').length,3);
  assert.ok(found.some(x=>x.id==='crypt:0:0'&&x.x===18&&x.z===18));
  assert.ok(found.some(x=>x.id==='treasure:cabin:0:0'));
  assert.ok(found.some(x=>x.id==='treasure:crypt:0:0:0'));
  assert.ok(found.some(x=>x.id==='treasure:crypt:0:0:1'));
  assert.deepEqual(scanGeneratedLoot(world,{x:1000,z:1000}),[]);
  assert.ok(LOOT_REVEAL_RADIUS>0);
});

test('world generator attaches stable metadata to existing cabin and underground crypt chests',()=>{
  const gen=new Gen(20261119);
  let cabin=null,crypt=null;
  // A bounded deterministic sample of chunk coordinates. Generation writes
  // only to this temporary test chunk; no running player's world is changed.
  for(let cz=-4;cz<4&&(!cabin||!crypt);cz++)for(let cx=-4;cx<4&&(!cabin||!crypt);cx++){
    const chunk={cx,cz,blocks:new Uint8Array(16*16*96),biome:new Uint8Array(256)};
    gen.generate(chunk,null);
    for(const loot of chunk.loot||[]){
      if(loot.kind==='cabin')cabin=loot;
      if(loot.kind==='crypt')crypt=loot;
    }
  }
  assert.ok(cabin,'sample contains a real generated cabin cache');
  assert.match(cabin.siteId,/^cabin:-?\d+:-?\d+$/);
  assert.ok(Number.isFinite(cabin.x)&&Number.isFinite(cabin.y)&&Number.isFinite(cabin.z));
  assert.ok(crypt,'sample contains a real generated underground crypt');
  assert.match(crypt.siteId,/^crypt:-?\d+:-?\d+$/);
  assert.ok(Number.isFinite(crypt.entrance.x)&&Number.isFinite(crypt.entrance.z));
  assert.ok([0,1].includes(crypt.chestIndex));
  assert.ok(Array.isArray(crypt.items)&&crypt.items.length>0);
});

test('monster territories are inferred from multiple living hostile mobs only',()=>{
  const mobs=[
    {kind:'frostling',x:12,y:50,z:12,sp:{passive:false}},
    {kind:'frostling',x:17,y:50,z:18,sp:{passive:false}},
    {kind:'cow',x:14,y:50,z:14,sp:{passive:true}},
    {kind:'snow_prowler',x:30,y:50,z:30,dead:true,sp:{passive:false}},
    {kind:'zombie',x:400,y:50,z:400,sp:{passive:false}}
  ];
  const found=scanMonsterTerritories(mobs,{x:10,z:10});
  assert.equal(found.length,1);
  assert.equal(found[0].kind,'territory');
  assert.equal(found[0].name,'Frostling Territory');
  assert.equal(found[0].radius,38);
  assert.equal(scanMonsterTerritories([
    {kind:'frostling',x:12,z:12,sp:{passive:false}}
  ],{x:10,z:10}).length,0,'one passing enemy is not a territory');
  assert.equal(scanMonsterTerritories(mobs,{x:1000,z:1000}).length,0);
});
