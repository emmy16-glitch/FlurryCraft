import test from 'node:test';
import assert from 'node:assert/strict';
import {MAX_LEVEL,AURORA_CAP,FROST_CREATURES,safeAdventure,grantXP,
  chooseWinterMob,winterMobLevel,winterKillXP,auroraWaves} from '../js/adventure-core.js';
import {AURORA_VERSION,AURORA_UNLOCK_LEVEL,AURORA_ROOM_OFFSETS,
  AURORA_ROOM_NAMES,AURORA_FOOTPRINT,AURORA_REWARDS,
  findAuroraSite,auroraRoom,auroraGate,nearAuroraGate,inAuroraRoom,
  generateAuroraCitadel,borealPulse} from '../js/aurora-citadel.js';
import * as B from '../js/blocks.js';

const gen={column(){return {h:43,biome:3};}};

test('Chapter 3 adds level 21-30 enemies without changing the Level 100 XP cap',()=>{
  assert.equal(MAX_LEVEL,100);
  assert.equal(AURORA_CAP,30);
  assert.equal(AURORA_UNLOCK_LEVEL,20);
  assert.equal(AURORA_VERSION,1);
  assert.equal(FROST_CREATURES.boreal_sovereign.boss,true);
  assert.equal(chooseWinterMob(20,.999),'blizzard_titan');
  assert.equal(chooseWinterMob(21,.7),'aurora_wisp');
  assert.equal(chooseWinterMob(25,.91),'prism_stalker');
  assert.equal(chooseWinterMob(29,.998),'boreal_sovereign');
  assert.equal(winterMobLevel(1,'aurora_wisp',0),21);
  assert.equal(winterMobLevel(90,'boreal_sovereign',1),30);
  assert.ok(winterKillXP('aurora_wisp',27)>70);
  assert.ok(winterKillXP('boreal_sovereign',30)<1000);
  assert.equal(winterMobLevel(90,'glacier_guardian',1),10);
});

test('Aurora Citadel has four ordered encounters and its own boss',()=>{
  const waves=auroraWaves(20);
  assert.equal(waves.length,4);
  assert.deepEqual(waves.map(x=>x.length),[2,2,2,1]);
  assert.ok(waves[0].every(e=>e.kind==='aurora_wisp'));
  assert.equal(waves[1][0].kind,'prism_stalker');
  assert.equal(waves[2][0].kind,'prism_stalker');
  assert.equal(waves[3][0].kind,'boreal_sovereign');
  assert.ok(waves.flat().every(e=>e.level>=21&&e.level<=30));
  assert.ok(auroraWaves(100).flat().every(e=>e.level<=30));
});

test('Legacy world state loads without an Aurora Citadel and remains immutable to scouting',()=>{
  const prior=safeAdventure({level:20,kills:12,clears:2,
    den:{x:31,y:44,z:15},denBuilt:true,dungeonVersion:2,
    storm:{site:{x:107,y:48,z:12},built:true,version:1,clears:3},
    castle:{wins:5,losses:2,bestTier:3},
    beacons:[{x:2,y:44,z:3,tier:3}]});
  assert.deepEqual(prior.aurora,{site:null,built:false,version:0,clears:0});
  assert.equal(prior.storm.clears,3);
  assert.equal(prior.castle.wins,5);
  assert.equal(prior.beacons[0].tier,3);
  const withAurora=safeAdventure({...prior,aurora:{
    site:{x:192,y:46,z:21},built:true,version:1,clears:4}});
  const next=grantXP(withAurora,200);
  assert.deepEqual(next.aurora,withAurora.aurora);
  assert.deepEqual(next.storm,prior.storm);
  assert.deepEqual(next.den,prior.den);
  assert.equal(next.castle.wins,5);
  assert.deepEqual(safeAdventure({aurora:{site:{x:1,y:95,z:3},built:true}}).aurora,
    {site:null,built:false,version:0,clears:0});
});

test('Aurora site scouting keeps a large distance from previously built dungeons',()=>{
  const oldSites=[{x:31,z:17},{x:102,z:14}];
  const s=findAuroraSite({x:.5,z:.5},gen,oldSites);
  assert.ok(s);
  assert.ok(Math.hypot(s.x,s.z)>=180);
  assert.ok(oldSites.every(other=>Math.hypot(s.x-other.x,s.z-other.z)>=100));
  assert.equal(s.y,44);
  assert.equal(findAuroraSite({x:0,z:0},{column(){return {h:20};}}),null);
});

test('17 x 67 Aurora halls have walkable 3D corridors, clear northern entrance and glowing fixtures',()=>{
  const site={x:183,y:45,z:17};
  const blocks=new Map(generateAuroraCitadel(site,B,gen)
    .map(([x,y,z,id])=>[[x,y,z].join(','),id]));
  const at=(x,y,z)=>blocks.get([x,y,z].join(','));
  assert.equal(AURORA_FOOTPRINT,'17 × 67 blocks');
  assert.deepEqual(AURORA_ROOM_OFFSETS,[0,17,34,51]);
  assert.equal(AURORA_ROOM_NAMES.length,4);
  for(const z of [8,9,25,26,42,43])
    for(let x=-2;x<=2;x++)for(let y=site.y;y<=site.y+5;y++)
      assert.equal(at(site.x+x,y,site.z+z),B.AIR,
        'central corridor blocked at '+[x,y,z].join(','));
  for(const index of [0,1,2,3]){
    const room=auroraRoom(site,index);
    assert.equal(at(room.x,room.y-1,room.z),B.FROST_BRICK);
    assert.ok(inAuroraRoom({x:room.x+.5,y:room.y,z:room.z+.5},site,index));
  }
  assert.ok(nearAuroraGate(auroraGate(site),site));
  assert.equal(nearAuroraGate({x:0,y:20,z:0},site),false);
  assert.ok([...blocks.values()].some(v=>v===B.TORCH));
  assert.ok(blocks.size>3000);
});

test('Boreal Sovereign telegraphs two dodgeable phases with a true half-health threshold',()=>{
  const normal=borealPulse(100,175),enraged=borealPulse(87,175);
  assert.equal(normal.enraged,false);
  assert.equal(enraged.enraged,true);
  assert.ok(enraged.radius>normal.radius);
  assert.ok(enraged.chargeSeconds<normal.chargeSeconds);
  assert.ok(enraged.interval<normal.interval);
  assert.equal(borealPulse(0,175).enraged,false);
});

test('Aurora Blade is a real sword and Aurora Crystal has a visible craftable use',()=>{
  assert.equal(B.AURORA_CRYSTAL,279);
  assert.equal(B.AURORA_BLADE,324);
  assert.equal(B.ITEMS[B.AURORA_CRYSTAL].name,'Aurora Crystal');
  assert.equal(B.ITEMS[B.AURORA_BLADE].tool.type,'sword');
  assert.ok(B.ITEMS[B.AURORA_BLADE].tool.dmg>B.ITEMS[B.toolId(3,3)].tool.dmg);
  const recipe=B.RECIPES.find(r=>r.id===B.AURORA_BLADE);
  assert.ok(recipe);
  assert.equal(recipe.shaped,false);
  assert.deepEqual(recipe.list,
    [B.toolId(3,3),B.AURORA_CRYSTAL,B.AURORA_CRYSTAL,B.FROST_SHARD]
      .sort((a,b)=>a-b));
  assert.equal(AURORA_REWARDS.crystals,5);
});
