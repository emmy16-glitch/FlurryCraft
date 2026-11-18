import test from 'node:test';
import assert from 'node:assert/strict';
import {FROST_CREATURES,CHAPTER_CAP,STORM_CAP,safeAdventure,grantXP,
  stormspireWaves,chooseWinterMob,winterMobLevel} from '../js/adventure-core.js';
import {STORM_VERSION,STORM_UNLOCK_LEVEL,STORM_ROOM_OFFSETS,
  STORM_FOOTPRINT,stormRoom,stormGate,nearStormGate,inStormRoom,
  stormSite,generateStormspire} from '../js/stormspire-dungeon.js';

const B={AIR:0,STONE_BRICKS:35,ICE:29,TORCH:22,FROST_BRICK:79};
const gen={column(){return {h:42};}};

test('chapter 2 unlock rules and monster tiers keep Frost Ruins capped at level 10',()=>{
  assert.equal(CHAPTER_CAP,10);
  assert.equal(STORM_CAP,20);
  assert.equal(STORM_UNLOCK_LEVEL,10);
  assert.equal(STORM_VERSION,1);
  assert.ok(FROST_CREATURES.storm_hound.xp>FROST_CREATURES.frostling.xp);
  assert.ok(FROST_CREATURES.blizzard_titan.boss);
  assert.ok(winterMobLevel(20,'storm_hound',1)<=20);
  assert.ok(winterMobLevel(100,'rime_knight',1)<=20);
  assert.ok(winterMobLevel(100,'glacier_guardian',1)<=10);
  assert.equal(chooseWinterMob(1,.9),'frostling');
  assert.equal(chooseWinterMob(13,.7),'storm_hound');
  assert.equal(chooseWinterMob(15,.9),'rime_knight');
  assert.equal(chooseWinterMob(20,.99),'blizzard_titan');
});

test('Chapter 2 has three ordered fights ending with the Blizzard Titan',()=>{
  const waves=stormspireWaves(12);
  assert.equal(waves.length,3);
  assert.deepEqual(waves.map(w=>w.length),[2,2,1]);
  assert.equal(waves[0][0].kind,'storm_hound');
  assert.equal(waves[1][0].kind,'rime_knight');
  assert.equal(waves[2][0].kind,'blizzard_titan');
  assert.ok(waves.flat().every(e=>e.level>=11&&e.level<=20));
});

test('old Survival saves gain empty Stormspire state without losing any history',()=>{
  const old=safeAdventure({level:10,xp:8,kills:11,clears:3,
    den:{x:30,y:43,z:15},denBuilt:true,dungeonVersion:2,swordClaimed:true});
  assert.deepEqual(old.storm,{site:null,built:false,version:0,clears:0});
  const withStorm=safeAdventure({...old,storm:{
    site:{x:110,y:50,z:40},built:true,version:1,clears:2}});
  assert.equal(grantXP(withStorm,200).storm.clears,2);
  assert.equal(grantXP(withStorm,200).clears,3);
  assert.deepEqual(grantXP(withStorm,200).den,old.den);
  assert.deepEqual(safeAdventure({storm:{site:{x:Infinity,y:99,z:1},built:true}}).storm,
    {site:null,built:false,version:0,clears:0});
});

test('Stormspire chooses a remote dry site away from the existing Frost Ruins',()=>{
  const site=stormSite({x:0.5,z:0.5},gen,{x:31,z:17});
  assert.ok(site);
  assert.ok(Math.hypot(site.x-31,site.z-17)>65);
  assert.equal(site.y,43);
  assert.equal(stormSite({x:0,z:0},{column(){return {h:20};}}),null);
});

test('Stormspire rooms and corridors are traversable and the gate is approachable',()=>{
  const site={x:120,y:44,z:60};
  const blocks=new Map(generateStormspire(site,B,gen).map(([x,y,z,id])=>[
    [x,y,z].join(','),id]));
  const at=(x,y,z)=>blocks.get([x,y,z].join(','));
  assert.equal(STORM_FOOTPRINT,'15 × 51 blocks');
  assert.deepEqual(STORM_ROOM_OFFSETS,[0,18,36]);
  for(const z of [8,9,10,26,27,28])
    for(let x=-2;x<=2;x++)for(let y=site.y;y<=site.y+4;y++)
      assert.equal(at(site.x+x,y,site.z+z),B.AIR,'blocked arch '+[x,y,z]);
  for(const i of [0,1,2]){
    const room=stormRoom(site,i);
    assert.equal(at(room.x,room.y-1,room.z),B.FROST_BRICK);
    assert.ok(inStormRoom({x:room.x+.5,y:room.y,z:room.z+.5},site,i));
  }
  assert.ok(nearStormGate(stormGate(site),site));
  assert.equal(nearStormGate({x:0,y:20,z:0},site),false);
  assert.ok(blocks.size>2000);
});
