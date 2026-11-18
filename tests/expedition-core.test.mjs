import test from 'node:test';
import assert from 'node:assert/strict';
import {EXPEDITION_STEPS,safeExpedition,expeditionCard,acceptExpedition,
  recordExpeditionPlacement,finishExpedition} from '../js/expedition-core.js';
import {createRewardsState,rewardCards,acceptExpeditionMission,
  collectExpeditionMission,recordRewardPlacement,CRYPTO_REWARDS_ENABLED}
  from '../js/rewards-core.js';

const NOW=Date.parse('2026-11-18T12:00:00Z');
const TOMORROW=Date.parse('2026-11-19T12:00:00Z');
const totals=(kills=0,clears=0)=>({level:1,kills,clears,storm:{clears:0},aurora:{clears:0},abyss:{clears:0}});
const view=(s,p,now=NOW)=>rewardCards(s,p,false,now).expedition;
const start=(s,p,id,creative=false)=>acceptExpeditionMission(s,p,id,creative,NOW);

test('contract board starts unaccepted: old kills do not count retroactively',()=>{
  const history=totals(999,11);
  const s=createRewardsState(null,history,NOW);
  const board=view(s,history);
  assert.equal(board.mission.id,'frost-patrol');
  assert.equal(board.mission.active,false);
  assert.equal(board.mission.progress,0);
  assert.equal(board.mission.ready,false);
  assert.equal(board.mission.available,true);
  assert.equal(CRYPTO_REWARDS_ENABLED,false);
});

test('accepting a real contract requires Survival and the next ordered step',()=>{
  const p=totals(4,1),s=createRewardsState(null,p,NOW);
  assert.throws(()=>start(s,p,'ruins-expedition'),/Finish your current/);
  assert.throws(()=>start(s,p,'frost-patrol',true),/Survival/);
  const a=start(s,p,'frost-patrol');
  assert.equal(a.expedition.active,'frost-patrol');
  assert.equal(a.expedition.base.kills,4);
  assert.throws(()=>start(a,p,'frost-patrol'),/Finish your current/);
  assert.equal(view(a,totals(6,1)).mission.progress,2);
  assert.equal(view(a,totals(4,1)).mission.ready,false);
});

test('actual winter kills complete contract once; points and XP are issued once',()=>{
  const p=totals(8),s=start(createRewardsState(null,p,NOW),p,'frost-patrol');
  const after=totals(11);
  const mission=view(s,after).mission;
  assert.equal(mission.progress,3);
  assert.equal(mission.ready,true);
  const earned=collectExpeditionMission(s,after,'frost-patrol',false,NOW);
  assert.equal(earned.state.points,35);
  assert.equal(earned.xp,45);
  assert.equal(earned.state.history.at(-1).title,'Frost Patrol');
  assert.deepEqual(earned.state.expedition.claimed,['frost-patrol']);
  assert.throws(()=>collectExpeditionMission(earned.state,after,'frost-patrol',false,NOW),
    /incomplete or already claimed/);
  assert.equal(view(earned.state,after).mission.id,'winter-shelter');
  assert.equal(view(earned.state,after).mission.progress,0);
});

test('shelter counts only player-validated placements after acceptance',()=>{
  const before=totals(3),first=start(createRewardsState(null,before,NOW),before,'frost-patrol');
  let s=collectExpeditionMission(first,totals(6),'frost-patrol',false,NOW).state;
  s=start(s,totals(6),'winter-shelter');
  for(let i=0;i<11;i++)s=recordRewardPlacement(s,totals(6),NOW);
  assert.equal(view(s,totals(6)).mission.progress,11);
  assert.equal(view(s,totals(6)).mission.ready,false);
  s=recordRewardPlacement(s,totals(6),NOW);
  assert.equal(view(s,totals(6)).mission.ready,true);
  assert.throws(()=>collectExpeditionMission(s,totals(6),'winter-shelter',true,NOW),/incomplete/);
  const earned=collectExpeditionMission(s,totals(6),'winter-shelter',false,NOW);
  assert.equal(earned.points,45);
  assert.equal(earned.xp,55);
  assert.equal(earned.state.points,80);
  assert.equal(earned.state.expedition.blocks,0);
});

test('dungeon clear and veteran kills must happen after accepting the exact step',()=>{
  let p=totals(0,10),s=createRewardsState(null,p,NOW);
  s=start(s,p,'frost-patrol');
  s=collectExpeditionMission(s,totals(3,10),'frost-patrol',false,NOW).state;
  s=start(s,totals(3,10),'winter-shelter');
  for(let i=0;i<12;i++)s=recordRewardPlacement(s,totals(3,10),NOW);
  s=collectExpeditionMission(s,totals(3,10),'winter-shelter',false,NOW).state;
  s=start(s,totals(3,10),'ruins-expedition');
  assert.equal(view(s,totals(3,10)).mission.progress,0,'previous clears do not count');
  assert.equal(view(s,totals(3,11)).mission.ready,true);
  const raider=collectExpeditionMission(s,totals(3,11),'ruins-expedition',false,NOW);
  assert.equal(raider.xp,130);
  s=start(raider.state,totals(3,11),'frost-veteran');
  assert.equal(view(s,totals(12,11)).mission.progress,9);
  const finished=collectExpeditionMission(s,totals(13,11),'frost-veteran',false,NOW);
  assert.equal(finished.state.points,280);
  assert.equal(finished.xp,140);
  assert.equal(view(finished.state,totals(13,11)).done,true);
  assert.equal(view(finished.state,totals(13,11)).mission,null);
  assert.throws(()=>start(finished.state,totals(13,11),'frost-patrol'),/already been completed/);
});

test('daily UTC resets do not reset or duplicate ongoing expeditions',()=>{
  const p=totals(2);
  const active=start(createRewardsState(null,p,NOW),p,'frost-patrol');
  const day2=createRewardsState(active,totals(3),TOMORROW);
  assert.equal(view(day2,totals(3),TOMORROW).mission.progress,1);
  const saved=JSON.parse(JSON.stringify(day2));
  assert.equal(view(saved,totals(5),TOMORROW).mission.ready,true);
  const reward=collectExpeditionMission(saved,totals(5),'frost-patrol',false,TOMORROW);
  assert.equal(reward.state.points,35);
  const reboot=createRewardsState(JSON.parse(JSON.stringify(reward.state)),totals(5),TOMORROW);
  assert.deepEqual(reboot.expedition.claimed,['frost-patrol']);
  assert.equal(reboot.points,35);
});

test('corrupt expedition saves are bounded, validated and do not skip unclaimed quests',()=>{
  const p={kills:200,clears:2};
  const broken={claimed:['frost-patrol','ruins-expedition'],active:'frost-veteran',
    base:{kills:-500,clears:Infinity},blocks:Infinity};
  const sanitized=safeExpedition(broken,p);
  assert.deepEqual(sanitized.claimed,['frost-patrol']);
  assert.equal(sanitized.active,null);
  assert.equal(sanitized.blocks,0);
  assert.equal(expeditionCard(sanitized,p).mission.id,'winter-shelter');
  const bad={claimed:['frost-patrol','winter-shelter'],active:'ruins-expedition',
    base:{kills:Infinity,clears:99},blocks:1000000};
  const safe=safeExpedition(bad,p);
  assert.equal(safe.base.kills,0);
  assert.equal(safe.base.clears,2);
  assert.equal(safe.blocks,0);
  assert.equal(EXPEDITION_STEPS.length,4);
});

test('planted blocks outside a building contract cannot be retroactively claimed',()=>{
  let p=totals(0),s=createRewardsState(null,p,NOW);
  for(let i=0;i<30;i++)s=recordRewardPlacement(s,p,NOW);
  s=start(s,p,'frost-patrol');
  assert.equal(view(s,p).mission.progress,0);
  s=collectExpeditionMission(s,totals(3),'frost-patrol',false,NOW).state;
  s=start(s,totals(3),'winter-shelter');
  assert.equal(view(s,totals(3)).mission.progress,0);
});
