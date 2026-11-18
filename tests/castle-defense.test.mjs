import test from 'node:test';
import assert from 'node:assert/strict';
import {MAX_WARD_TIER,WARD_COSTS,WARD_CONFIG,REPAIR_COST,REPAIR_INTEGRITY,
  SIEGE_REWARDS,wardKey,wardTier,wardStats,wardContains,canUpgradeWard,
  siegeWaves,canStartSiege,safeCastleDefense} from '../js/castle-defense-core.js';
import {safeAdventure,grantXP} from '../js/adventure-core.js';

test('legacy worlds and old Winter Wards upgrade without changing saved locations',()=>{
  const original={level:14,clears:2,den:{x:31,y:43,z:17},
    beacons:[{x:3,y:44,z:4},{x:-9,y:50,z:2,tier:3}]};
  const state=safeAdventure(original);
  assert.equal(state.beacons.length,2);
  assert.deepEqual(state.beacons[0],{x:3,y:44,z:4,tier:1});
  assert.deepEqual(state.beacons[1],{x:-9,y:50,z:2,tier:3});
  assert.deepEqual(state.castle,{wins:0,losses:0,bestTier:0,version:1});
  assert.deepEqual(state.den,original.den);
  const progress=grantXP({...state,castle:{wins:5,losses:2,bestTier:3}},100);
  assert.equal(progress.castle.wins,5);
  assert.equal(progress.castle.bestTier,3);
  assert.equal(progress.beacons[1].tier,3);
  assert.equal(safeAdventure({beacons:[{x:1,y:2,z:3,tier:999}]}).beacons[0].tier,3);
  assert.equal(safeAdventure({beacons:[{x:1,y:2,z:3,tier:-10}]}).beacons[0].tier,1);
  assert.deepEqual(safeCastleDefense({wins:-3,losses:Infinity,bestTier:99}),
    {wins:0,losses:0,bestTier:3,version:1});
});

test('three Ward tiers increase protection, strike damage and shield integrity',()=>{
  assert.equal(MAX_WARD_TIER,3);
  const base={x:8,y:44,z:11,tier:1};
  assert.equal(wardKey(base),'8,44,11');
  assert.equal(wardTier(base),1);
  assert.equal(wardStats(base).radius,10);
  assert.equal(wardStats({...base,tier:2}).radius,13);
  assert.equal(wardStats({...base,tier:3}).radius,16);
  assert.ok(WARD_CONFIG[3].damage>WARD_CONFIG[1].damage);
  assert.ok(WARD_CONFIG[3].integrity>WARD_CONFIG[1].integrity);
  assert.equal(wardContains(base,21,44,11),false);
  assert.equal(wardContains({...base,tier:3},21,44,11),true);
  assert.equal(wardContains(base,8,70,11),false);
});

test('upgrades require resources and story progression',()=>{
  const ward={x:0,y:40,z:0,tier:1};
  assert.equal(canUpgradeWard(ward,9,0,50,50).ok,false);
  assert.equal(canUpgradeWard(ward,10,0,7,16).ok,false);
  assert.equal(canUpgradeWard(ward,10,0,8,16).ok,true);
  assert.equal(canUpgradeWard({...ward,tier:2},15,0,50,50).ok,false);
  assert.equal(canUpgradeWard({...ward,tier:2},15,1,15,32).ok,false);
  assert.equal(canUpgradeWard({...ward,tier:2},15,1,16,32).ok,true);
  assert.equal(canUpgradeWard({...ward,tier:3},20,5,100,100).ok,false);
  assert.equal(WARD_COSTS[2].bricks,16);
  assert.equal(WARD_COSTS[3].shards,16);
});

test('three raid waves scale with Ward tier and never unlock titan too early',()=>{
  for(const tier of [1,2,3]){
    const waves=siegeWaves(tier,20);
    assert.equal(waves.length,3);
    assert.deepEqual(waves.map(w=>w.length),[2,2,tier===2?2:1]);
    assert.ok(waves.flat().every(spec=>spec.level>=1&&spec.level<=20));
  }
  assert.equal(siegeWaves(1,20)[2][0].kind,'glacier_guardian');
  assert.equal(siegeWaves(2,20)[2][0].kind,'rime_knight');
  assert.equal(siegeWaves(3,20)[2][0].kind,'blizzard_titan');
  assert.equal(SIEGE_REWARDS[1].xp,75);
  assert.ok(SIEGE_REWARDS[3].bricks>SIEGE_REWARDS[1].bricks);
});

test('a raid starts only near an actual Ward, in Survival and outside dungeons',()=>{
  const base={player:{x:.5,y:44,z:.5,dead:false,creative:false},
    ward:{x:0,y:44,z:0,tier:1},world:{loaded(){return true;}},
    level:5,clears:1,trialActive:false,raidActive:false};
  assert.equal(canStartSiege(base).ok,true);
  assert.equal(canStartSiege({...base,level:4}).ok,false);
  assert.equal(canStartSiege({...base,clears:0}).ok,false);
  assert.equal(canStartSiege({...base,trialActive:true}).ok,false);
  assert.equal(canStartSiege({...base,raidActive:true}).ok,false);
  assert.equal(canStartSiege({...base,player:{...base.player,creative:true}}).ok,false);
  assert.equal(canStartSiege({...base,player:{...base.player,x:200}}).ok,false);
  assert.equal(canStartSiege({...base,world:{loaded(){return false;}}}).ok,false);
  assert.equal(REPAIR_COST.shards,2);
  assert.equal(REPAIR_INTEGRITY,22);
});
