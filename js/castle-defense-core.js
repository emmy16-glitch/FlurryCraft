// FlurryCraft Castle Defense: pure ward upgrade, siege and reward rules.
// State lives inside the existing world save; active waves are transient.
export const MAX_WARD_TIER=3;
export const WARD_CONFIG=Object.freeze({
  1:Object.freeze({radius:10,range:13,damage:2,cooldown:2.2,integrity:45}),
  2:Object.freeze({radius:13,range:17,damage:4,cooldown:1.5,integrity:70}),
  3:Object.freeze({radius:16,range:21,damage:6,cooldown:1.1,integrity:100})
});
export const WARD_COSTS=Object.freeze({
  2:Object.freeze({shards:8,bricks:16,minLevel:10,stormClears:0}),
  3:Object.freeze({shards:16,bricks:32,minLevel:15,stormClears:1})
});
export const REPAIR_COST=Object.freeze({shards:2,bricks:4});
export const REPAIR_INTEGRITY=22;
export const SIEGE_REWARDS=Object.freeze({
  1:Object.freeze({shards:4,bricks:10,xp:75}),
  2:Object.freeze({shards:7,bricks:16,xp:145}),
  3:Object.freeze({shards:11,bricks:24,xp:240})
});
const finite=(v,d=0)=>Number.isFinite(v)?v:d;
const bounded=(v,lo,hi,d=lo)=>Math.max(lo,Math.min(hi,Math.floor(finite(v,d))));
export const wardKey=ward=>[ward.x,ward.y,ward.z].join(',');
export function wardTier(raw){return bounded(raw?.tier,1,MAX_WARD_TIER,1);}
export function wardStats(ward){return WARD_CONFIG[wardTier(ward)];}
export function wardContains(ward,x,y,z){
  if(!ward||![x,y,z].every(Number.isFinite))return false;
  return Math.abs(y-(ward.y+.5))<=8&&
    Math.hypot(ward.x+.5-x,ward.z+.5-z)<=wardStats(ward).radius;
}
export function canUpgradeWard(ward,level,stormClears,shards,bricks){
  if(!ward)return {ok:false,reason:'Place a Winter Ward first'};
  const next=wardTier(ward)+1;
  if(next>MAX_WARD_TIER)return {ok:false,reason:'Ward is fully upgraded'};
  const cost=WARD_COSTS[next];
  if(level<cost.minLevel||stormClears<cost.stormClears)
    return {ok:false,reason:next===3?'Tier III needs Level 15 and one Stormspire clear':'Tier II unlocks at Level 10'};
  if(shards<cost.shards||bricks<cost.bricks)
    return {ok:false,reason:'Requires '+cost.shards+' Frost Shards and '+cost.bricks+' Froststone'};
  return {ok:true,next,cost};
}
export function siegeWaves(tier,level){
  const t=wardTier({tier});
  const l=Math.max(1,Math.floor(finite(level,1)));
  if(t===1)return [
    [{kind:'frostling',level:Math.min(10,Math.max(2,l))},{kind:'frostling',level:Math.min(10,Math.max(2,l))}],
    [{kind:'snow_prowler',level:Math.min(10,Math.max(3,l))},{kind:'frostling',level:Math.min(10,Math.max(2,l))}],
    [{kind:'glacier_guardian',level:Math.min(10,Math.max(8,l))}]
  ];
  if(t===2)return [
    [{kind:'storm_hound',level:Math.min(20,Math.max(11,l))},{kind:'storm_hound',level:Math.min(20,Math.max(11,l))}],
    [{kind:'rime_knight',level:Math.min(20,Math.max(14,l))},{kind:'storm_hound',level:Math.min(20,Math.max(11,l))}],
    [{kind:'rime_knight',level:Math.min(20,Math.max(15,l))},{kind:'rime_knight',level:Math.min(20,Math.max(15,l))}]
  ];
  return [
    [{kind:'storm_hound',level:Math.min(20,Math.max(15,l))},{kind:'rime_knight',level:Math.min(20,Math.max(15,l))}],
    [{kind:'rime_knight',level:Math.min(20,Math.max(16,l))},{kind:'rime_knight',level:Math.min(20,Math.max(16,l))}],
    [{kind:'blizzard_titan',level:Math.min(20,Math.max(18,l))}]
  ];
}
export function safeCastleDefense(raw){
  const a=raw&&typeof raw==='object'?raw:{};
  return {wins:bounded(a.wins,0,100000),losses:bounded(a.losses,0,100000),
    bestTier:bounded(a.bestTier,0,MAX_WARD_TIER),version:1};
}
export function canStartSiege({player,ward,world,level,clears,trialActive,raidActive}){
  if(!player||player.dead||player.creative)return {ok:false,reason:'Survival mode required'};
  if(!world||!ward)return {ok:false,reason:'Place a Winter Ward first'};
  if(trialActive||raidActive)return {ok:false,reason:'Finish the current battle first'};
  if(level<5||clears<1)return {ok:false,reason:'Reach Level 5 and clear Frost Ruins once'};
  if(Math.hypot(player.x-ward.x-.5,player.z-ward.z-.5)>16||
    Math.abs(player.y-ward.y) > 8)return {ok:false,reason:'Stand near your Winter Ward'};
  if(typeof world.loaded==='function'&&!world.loaded(ward.x,ward.z))
    return {ok:false,reason:'Wait for your castle area to load'};
  return {ok:true};
}
