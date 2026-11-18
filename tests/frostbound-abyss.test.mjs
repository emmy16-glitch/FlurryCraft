import test from 'node:test';
import assert from 'node:assert/strict';
import * as B from '../js/blocks.js';
import {ABYSS_CAP,FROST_CREATURES,safeAdventure,grantXP,
  winterMobLevel,chooseWinterMob,winterKillXP,abyssWaves} from '../js/adventure-core.js';
import {ABYSS_VERSION,ABYSS_UNLOCK_LEVEL,ABYSS_ROOM_OFFSETS,
  ABYSS_ROOM_NAMES,ABYSS_FOOTPRINT,ABYSS_REWARDS,abyssPulse,
  abyssRoom,abyssGate,nearAbyssGate,inAbyssRoom,
  findAbyssSite,generateFrostboundAbyss} from '../js/frostbound-abyss.js';
import {monsterMaxHealth,playerMaxHealth,playerAttackDamage,hitsToDefeat} from '../js/combat-progression.js';

const gen={column(){return {h:42,biome:3};}};
test('Chapter 4 opens Levels 31–40 and retains the level-100 XP curve',()=>{
  assert.equal(ABYSS_CAP,40);
  assert.equal(ABYSS_UNLOCK_LEVEL,30);
  assert.equal(ABYSS_VERSION,1);
  assert.equal(FROST_CREATURES.rift_stalker.minLevel,31);
  assert.equal(FROST_CREATURES.umbral_sentinel.chapter,4);
  assert.equal(FROST_CREATURES.abyss_keeper.boss,true);
  assert.equal(chooseWinterMob(30,.9),'prism_stalker');
  assert.equal(chooseWinterMob(31,.7),'rift_stalker');
  assert.equal(chooseWinterMob(34,.9),'umbral_sentinel');
  assert.equal(chooseWinterMob(39,.998),'abyss_keeper');
  assert.equal(winterMobLevel(1,'rift_stalker',.2),31);
  assert.ok(winterMobLevel(100,'abyss_keeper',1)<=40);
  assert.ok(winterKillXP('rift_stalker',40)>98);
  assert.equal(playerMaxHealth(40),40);
});
test('four encounters ascend through Stalkers and Sentinels to a single boss',()=>{
  const waves=abyssWaves(30);
  assert.deepEqual(waves.map(w=>w.length),[2,2,2,1]);
  assert.ok(waves[0].every(m=>m.kind==='rift_stalker'));
  assert.ok(waves[1].some(m=>m.kind==='umbral_sentinel'));
  assert.ok(waves[2].every(m=>m.kind==='umbral_sentinel'));
  assert.equal(waves[3][0].kind,'abyss_keeper');
  assert.ok(abyssWaves(100).flat().every(m=>m.level<=40));
  assert.ok(waves.flat().every(m=>m.level>=31));
});
test('new Abyss world progress migrates without changing any earlier chapter',()=>{
  const legacy=safeAdventure({level:30,clears:3,
    den:{x:22,y:43,z:18},
    storm:{site:{x:110,y:43,z:17},built:true,version:1,clears:2},
    aurora:{site:{x:188,y:43,z:11},built:true,version:1,clears:1},
    castle:{wins:2,losses:1,bestTier:3},
    beacons:[{x:5,y:43,z:6,tier:3}]});
  assert.deepEqual(legacy.abyss,{site:null,built:false,version:0,clears:0});
  const state=safeAdventure({...legacy,abyss:{
    site:{x:260,y:43,z:10},built:true,version:1,clears:3}});
  const upgraded=grantXP(state,200);
  assert.equal(upgraded.abyss.clears,3);
  assert.deepEqual(upgraded.storm,legacy.storm);
  assert.deepEqual(upgraded.aurora,legacy.aurora);
  assert.deepEqual(upgraded.beacons,legacy.beacons);
  assert.equal(upgraded.castle.wins,2);
  assert.equal(safeAdventure({abyss:{site:{x:100,y:99,z:0},built:true}}).abyss.site,null);
});
test('scouting stays remote, and four rooms are connected through open arches',()=>{
  const site=findAbyssSite({x:0,z:0},gen,
    [{x:28,y:43,z:17},{x:110,y:43,z:11},{x:186,y:43,z:19}]);
  assert.ok(site);
  assert.ok(Math.hypot(site.x,site.z)>220);
  for(const previous of [{x:28,z:17},{x:110,z:11},{x:186,z:19}])
    assert.ok(Math.hypot(site.x-previous.x,site.z-previous.z)>104);
  assert.equal(ABYSS_ROOM_OFFSETS.length,4);
  assert.deepEqual(ABYSS_ROOM_OFFSETS,[0,19,38,57]);
  assert.equal(ABYSS_ROOM_NAMES.length,4);
  assert.equal(ABYSS_FOOTPRINT,'19 × 75 blocks');
  const plan=generateFrostboundAbyss(site,B,gen);
  assert.ok(plan.length>1500);
  const map=new Map(plan.map(([x,y,z,id])=>[x+','+y+','+z,id]));
  const get=(x,y,z)=>map.get(x+','+y+','+z);
  assert.equal(get(site.x,site.y-1,site.z),B.FROST_BRICK);
  for(const zOffset of [9,10,28,29,47,48]){
    assert.equal(get(site.x,site.y,site.z+zOffset),B.AIR);
    assert.equal(get(site.x,site.y+2,site.z+zOffset),B.AIR);
  }
  assert.equal(get(site.x,site.y,site.z-8),B.AIR);
  assert.ok(nearAbyssGate(abyssGate(site),site));
  assert.equal(nearAbyssGate({x:0,y:43,z:0},site),false);
  for(let i=0;i<4;i++){
    const hall=abyssRoom(site,i);
    assert.ok(inAbyssRoom({x:hall.x+.5,y:hall.y,z:hall.z+.5},site,i));
  }
});
test('keeper shockwave is telegraphed with faster but dodgeable enrage below 45%',()=>{
  const normal=abyssPulse(100,100),enraged=abyssPulse(45,100);
  assert.equal(normal.enraged,false);
  assert.equal(enraged.enraged,true);
  assert.ok(enraged.radius>normal.radius);
  assert.ok(enraged.chargeSeconds>=1);
  assert.ok(enraged.interval<normal.interval);
  assert.ok(enraged.damage>normal.damage);
  assert.equal(abyssPulse(0,100).enraged,false);
});
test('Abyss Blade is usable equipment and its recipe requires chapter rewards',()=>{
  assert.equal(B.ABYSS_CRYSTAL,325);
  assert.equal(B.ABYSS_BLADE,326);
  assert.equal(B.ITEMS[B.ABYSS_BLADE].tool.type,'sword');
  assert.equal(B.ITEMS[B.ABYSS_BLADE].tool.dmg,11);
  assert.ok(B.ITEMS[B.ABYSS_BLADE].tool.dmg>B.ITEMS[B.AURORA_BLADE].tool.dmg);
  const recipe=B.RECIPES.find(r=>r.id===B.ABYSS_BLADE);
  assert.ok(recipe);
  assert.deepEqual(recipe.list,
    [B.AURORA_BLADE,B.ABYSS_CRYSTAL,B.ABYSS_CRYSTAL,B.FROST_SHARD].sort((a,b)=>a-b));
  assert.equal(ABYSS_REWARDS.crystals,7);
  const hp=monsterMaxHealth(230,40,4);
  const damage=playerAttackDamage(11,40);
  assert.ok(hitsToDefeat(hp,damage)>15);
  assert.ok(hitsToDefeat(hp,damage)<28);
});
