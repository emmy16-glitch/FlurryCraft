import test from 'node:test';
import assert from 'node:assert/strict';
import {isValidTravelStep,addTrialDistance,trialProgressText} from '../js/winter-trials.js';
import {createRewardsState,rewardCards,recordRewardParry,recordRewardTravel,
  collectLocalPoints,CRYPTO_REWARDS_ENABLED} from '../js/rewards-core.js';

const NOV18=Date.parse('2026-11-18T12:00:00Z');
const NOV19=Date.parse('2026-11-19T12:00:00Z');
const NOV23=Date.parse('2026-11-23T12:00:00Z');
const adventure={level:4,kills:6,clears:1,storm:{clears:0},
  aurora:{clears:0},abyss:{clears:0}};
const card=(state,id,now=NOV18)=>{
  const c=rewardCards(state,adventure,false,now);
  return [...c.daily,...c.weekly].find(x=>x.id===id);
};

test('fresh and legacy world ledgers start daily/weekly Winter Trials at zero',()=>{
  const fresh=createRewardsState(null,adventure,NOV18);
  const legacy=createRewardsState({version:1,points:19,
    day:'2026-11-18',week:'2026-11-16',dailyBlocks:8},adventure,NOV18);
  for(const state of [fresh,legacy]){
    assert.equal(state.dailyParries,0);
    assert.equal(state.weeklyParries,0);
    assert.equal(state.dailyTravel,0);
    assert.equal(state.weeklyTravel,0);
    assert.equal(card(state,'daily-parry').progress,0);
    assert.equal(card(state,'daily-travel').progress,0);
    assert.equal(card(state,'weekly-parry').progress,0);
    assert.equal(card(state,'weekly-travel').progress,0);
  }
  assert.equal(legacy.points,19,'legacy local points remain intact');
  assert.equal(legacy.dailyBlocks,8);
  assert.equal(CRYPTO_REWARDS_ENABLED,false);
});

test('perfect parries count once per recorded real hit and can be claimed once',()=>{
  let s=createRewardsState(null,adventure,NOV18);
  s=recordRewardParry(s,adventure,NOV18);
  assert.equal(card(s,'daily-parry').progress,1);
  assert.equal(card(s,'daily-parry').ready,false);
  assert.equal(card(s,'weekly-parry').progress,1);
  s=recordRewardParry(s,adventure,NOV18);
  assert.equal(card(s,'daily-parry').ready,true);
  const earned=collectLocalPoints(s,adventure,'daily:2026-11-18:daily-parry',false,NOV18);
  assert.equal(earned.points,45);
  assert.equal(earned.dailyParries,2);
  assert.throws(()=>collectLocalPoints(earned,adventure,
    'daily:2026-11-18:daily-parry',false,NOV18),/already collected/);
  assert.throws(()=>collectLocalPoints(s,adventure,
    'daily:2026-11-18:daily-parry',true,NOV18),/not been completed/);
});

test('on-foot travel accumulates fractions and awards no currency until claimed',()=>{
  let s=createRewardsState(null,adventure,NOV18);
  for(let i=0;i<60;i++)s=recordRewardTravel(s,adventure,2,NOV18);
  assert.equal(s.dailyTravel,120);
  assert.equal(s.weeklyTravel,120);
  assert.equal(card(s,'daily-travel').progress,120);
  assert.equal(card(s,'daily-travel').ready,true);
  assert.equal(card(s,'weekly-travel').progress,120);
  assert.equal(s.points,0);
  const earned=collectLocalPoints(s,adventure,'daily:2026-11-18:daily-travel',false,NOV18);
  assert.equal(earned.points,40);
  assert.equal(card(earned,'daily-travel').claimed,true);
  const copied=JSON.parse(JSON.stringify(earned));
  assert.equal(card(copied,'daily-travel').claimed,true);
  assert.equal(copied.dailyTravel,120);
  assert.equal(CRYPTO_REWARDS_ENABLED,false);
});

test('daily rollover resets skill/travel only for new UTC day; weekly carries',()=>{
  let s=createRewardsState(null,adventure,NOV18);
  s=recordRewardParry(s,adventure,NOV18);
  s=recordRewardTravel(s,adventure,2.75,NOV18);
  const next=createRewardsState(s,adventure,NOV19);
  assert.equal(next.dailyParries,0);
  assert.equal(next.dailyTravel,0);
  assert.equal(next.weeklyParries,1);
  assert.equal(next.weeklyTravel,2.75);
  const week=createRewardsState(next,adventure,NOV23);
  assert.equal(week.dailyParries,0);
  assert.equal(week.weeklyParries,0);
  assert.equal(week.weeklyTravel,0);
});

test('winter travel validator rejects teleports, stalls and NaN while accepting walking',()=>{
  assert.equal(isValidTravelStep(.18,.05),true);
  assert.equal(isValidTravelStep(.42,.05),true);
  assert.equal(isValidTravelStep(9,.05),false);
  assert.equal(isValidTravelStep(5,2),false);
  assert.equal(isValidTravelStep(Infinity,.03),false);
  assert.equal(isValidTravelStep(NaN,.03),false);
  assert.equal(isValidTravelStep(0,.03),false);
  assert.equal(isValidTravelStep(.2,0),false);
  assert.equal(isValidTravelStep(.2,Infinity),false);
  assert.equal(isValidTravelStep(.2,-.02),false);
});

test('travel batches are bounded, sanitized and never credit impossible increments',()=>{
  assert.equal(addTrialDistance(0,2.1354),2.135);
  assert.equal(addTrialDistance(1,Infinity),1);
  assert.equal(addTrialDistance(1,50),1);
  assert.equal(addTrialDistance(1,-2),1);
  assert.equal(addTrialDistance(Infinity,2),2);
  assert.equal(addTrialDistance(2399.5,3),2400);
  let s=createRewardsState({version:1,day:'2026-11-18',week:'2026-11-16',
    dailyParries:Infinity,weeklyParries:-4,
    dailyTravel:Infinity,weeklyTravel:1e15},adventure,NOV18);
  assert.equal(s.dailyParries,0);
  assert.equal(s.weeklyParries,0);
  assert.equal(s.dailyTravel,0);
  assert.equal(s.weeklyTravel,2400);
  s=recordRewardTravel(s,adventure,9000,NOV18);
  assert.equal(s.dailyTravel,0);
  assert.equal(s.weeklyTravel,2400);
});

test('weekly Winter Trial reaches full progress and remains available next week',()=>{
  let s=createRewardsState(null,adventure,NOV18);
  for(let i=0;i<12;i++)s=recordRewardParry(s,adventure,NOV18);
  assert.equal(card(s,'weekly-parry').ready,true);
  for(let i=0;i<212;i++)s=recordRewardTravel(s,adventure,4,NOV18);
  s=recordRewardTravel(s,adventure,2,NOV18);
  assert.equal(card(s,'weekly-travel').ready,true);
  const a=collectLocalPoints(s,adventure,'weekly:2026-11-16:weekly-parry',false,NOV18);
  const b=collectLocalPoints(a,adventure,'weekly:2026-11-16:weekly-travel',false,NOV18);
  assert.equal(b.points,370);
  assert.equal(b.history.length,2);
  assert.equal(card(createRewardsState(b,adventure,NOV23),'weekly-parry',NOV23).progress,0);
});

test('Lofi ready-trial summary counts only parry and exploration tasks',()=>{
  const sample=[
    {id:'daily-parry',kind:'parries',ready:true,claimed:false},
    {id:'daily-travel',kind:'travel',ready:false,claimed:false},
    {id:'daily-build',kind:'blocks',ready:true,claimed:false},
    {id:'weekly-parry',kind:'parries',ready:false,claimed:true}
  ];
  assert.deepEqual(trialProgressText(sample),{total:3,ready:1,completed:1});
  assert.deepEqual(trialProgressText(undefined),{total:0,ready:0,completed:0});
});
