import test from 'node:test';
import assert from 'node:assert/strict';
import {createRewardsState,rewardTotals,rewardCards,recordRewardPlacement,
  collectLocalPoints,requestCryptoPayout,CRYPTO_REWARDS_ENABLED} from '../js/rewards-core.js';
const NOV18=Date.parse('2026-11-18T12:00:00Z');
const NOV19=Date.parse('2026-11-19T12:00:00Z');
const NOV23=Date.parse('2026-11-23T12:00:00Z');
const progress=(level=1,kills=0,clears=0)=>({level,kills,clears,
  storm:{clears:0},aurora:{clears:0},abyss:{clears:0}});
const get=(cards,id)=>[...cards.daily,...cards.weekly,...cards.milestones].find(c=>c.id===id);
test('new saves do not retroactively farm daily/weekly missions from lifetime kills',()=>{
  const p=progress(15,999,3),state=createRewardsState(null,p,NOV18);
  const view=rewardCards(state,p,false,NOV18);
  assert.equal(get(view,'daily-monsters').progress,0);
  assert.equal(get(view,'weekly-monsters').progress,0);
  assert.equal(get(view,'daily-dungeon').progress,0);
  assert.equal(get(view,'lv10').ready,true);
  assert.equal(get(view,'frost').ready,true);
});
test('monster mission completes from gameplay stat difference and can only be collected once',()=>{
  const before=progress(1,12),state=createRewardsState(null,before,NOV18);
  const after=progress(1,15),key='daily:2026-11-18:daily-monsters';
  const view=rewardCards(state,after,false,NOV18);
  assert.equal(get(view,'daily-monsters').ready,true);
  const earned=collectLocalPoints(state,after,key,false,NOV18);
  assert.equal(earned.points,20);
  assert.equal(earned.history.length,1);
  assert.throws(()=>collectLocalPoints(earned,after,key,false,NOV18),/already collected/);
});
test('new daily period resets progress and blocks but retains lifetime points',()=>{
  let s=createRewardsState(null,progress(1,0),NOV18);
  s=recordRewardPlacement(s,progress(1,0),NOV18);
  const newDay=rewardCards(s,progress(1,3),false,NOV19);
  assert.equal(get(newDay,'daily-build').progress,0);
  assert.equal(get(newDay,'daily-monsters').progress,0);
  assert.equal(get(newDay,'weekly-monsters').progress,3);
  assert.equal(newDay.state.day,'2026-11-19');
});
test('new week resets weekly progress independently from daily progress',()=>{
  const p=progress(1,0),s=createRewardsState(null,p,NOV18);
  const v=rewardCards(s,progress(1,10),false,NOV23);
  assert.equal(get(v,'weekly-monsters').progress,0);
  assert.equal(get(v,'daily-monsters').progress,0);
  assert.equal(v.state.week,'2026-11-23');
});
test('survival placement counts towards daily and weekly goals only when called',()=>{
  let s=createRewardsState(null,progress(),NOV18);
  for(let i=0;i<10;i++)s=recordRewardPlacement(s,progress(),NOV18);
  const view=rewardCards(s,progress(),false,NOV18);
  assert.equal(get(view,'daily-build').ready,true);
  const earned=collectLocalPoints(s,progress(),'daily:2026-11-18:daily-build',false,NOV18);
  assert.equal(earned.points,25);
  assert.equal(earned.dailyBlocks,10);
  assert.equal(get(rewardCards(earned,progress(),false,NOV18),'daily-build').claimed,true);
});
test('creative mode may view progress but cannot redeem local points',()=>{
  const s=createRewardsState(null,progress(50,100,2),NOV18);
  const c=rewardCards(s,progress(50,100,2),true,NOV18);
  assert.equal(get(c,'lv50').ready,false);
  assert.throws(()=>collectLocalPoints(s,progress(50,100,2),'once:lv50',true,NOV18),/not been completed/);
});
test('one-time milestone survives reload, does not reset next day',()=>{
  const p=progress(20,0),s=createRewardsState(null,p,NOV18);
  const earned=collectLocalPoints(s,p,'once:lv20',false,NOV18);
  const persisted=JSON.parse(JSON.stringify(earned));
  const view=rewardCards(persisted,p,false,NOV19);
  assert.equal(get(view,'lv20').claimed,true);
  assert.equal(view.state.points,200);
});
test('chapter clears each have independent one-time milestones',()=>{
  const p=progress(40,0,2);p.storm.clears=1;p.aurora.clears=1;p.abyss.clears=1;
  const view=rewardCards(createRewardsState(null,p,NOV18),p,false,NOV18);
  for(const id of ['frost','storm','aurora','abyss'])assert.equal(get(view,id).ready,true);
  assert.equal(rewardTotals(p).clears,5);
});
test('per-world state starts isolated; malicious or invalid ledger entries rejected',()=>{
  const a=createRewardsState(null,progress(),NOV18);a.points=99;a.claimed['once:lv10']=true;
  const b=createRewardsState(null,progress(),NOV18);assert.equal(b.points,0);
  assert.equal(b.claimed['once:lv10'],undefined);
  const c=createRewardsState({version:1,points:-300,claimed:{'once:lv10':true,
    'crypto:mint':true,'__proto__':true},history:[{title:'fake',id:'bad',points:-20,at:0}]},progress(),NOV18);
  assert.equal(c.points,0);assert.equal(c.claimed['once:lv10'],true);
  assert.equal(c.claimed['crypto:mint'],undefined);
  assert.equal(c.history.length,0);
});
test('crypto withdrawals hard fail closed even if fake wallet or points exist',()=>{
  assert.equal(CRYPTO_REWARDS_ENABLED,false);
  assert.throws(()=>requestCryptoPayout({wallet:'0x123',points:1e7}),/not verified/);
});
