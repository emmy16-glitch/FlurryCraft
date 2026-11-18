import test from 'node:test';
import assert from 'node:assert/strict';
import {LOFI_TALK_RADIUS,nearLofi,lofiQuestDialogue,lofiWaypoint,
  expeditionGuideTarget} from '../js/expedition-guide.js';
import {createRewardsState,acceptExpeditionMission,collectExpeditionMission,
  rewardCards,CRYPTO_REWARDS_ENABLED} from '../js/rewards-core.js';

const NOW=Date.parse('2026-11-18T12:00:00Z');
const stats=(kills=0,clears=0)=>({level:1,kills,clears,storm:{clears:0},
  aurora:{clears:0},abyss:{clears:0}});
const board=(state,data)=>rewardCards(state,data,false,NOW).expedition;

test('Lofi proximity is bounded and cannot be spoofed by invalid positions',()=>{
  assert.equal(LOFI_TALK_RADIUS,6.2);
  assert.equal(nearLofi({x:0,z:0},{x:3,z:4}),true);
  assert.equal(nearLofi({x:0,z:0},{x:7,z:0}),false);
  assert.equal(nearLofi({x:0,z:0},{x:6.2,z:0}),true);
  assert.equal(nearLofi({x:0,y:80,z:0},{x:0,y:40,z:0}),false);
  assert.equal(nearLofi({x:0,y:42,z:0},{x:0,y:40,z:0}),true);
  assert.equal(nearLofi({x:Infinity,z:0},{x:0,z:0}),false);
  assert.equal(nearLofi({x:0,z:0},{x:NaN,z:0}),false);
  assert.equal(nearLofi(null,null),false);
  assert.equal(nearLofi({x:0,z:0},{x:0,z:0},-1),false);
  assert.deepEqual(lofiWaypoint({x:11.7,z:-8.1}),{
    id:'lofi-guide',name:'Lofi the Yeti',x:11,z:-9});
  assert.equal(lofiWaypoint(null),null);
});

test('Lofi conversation reacts to actual accepted/ready/completed mission state',()=>{
  const p=stats(4),start=createRewardsState(null,p,NOW);
  const offered=lofiQuestDialogue(board(start,p));
  assert.match(offered.greeting,/Accept a contract/);
  assert.match(offered.action,/Accept Frost Patrol/);
  assert.equal(offered.icon,'?');
  const started=acceptExpeditionMission(start,p,'frost-patrol',false,NOW);
  const active=lofiQuestDialogue(board(started,stats(6)));
  assert.match(active.greeting,/2 of 3/);
  assert.equal(active.icon,'!');
  const ready=lofiQuestDialogue(board(started,stats(7)));
  assert.match(ready.action,/Claim Frost Patrol/);
  assert.equal(ready.icon,'✓');
  const claimed=collectExpeditionMission(started,stats(7),'frost-patrol',false,NOW);
  assert.equal(lofiQuestDialogue(board(claimed.state,stats(7))).icon,'?');
  const creative=lofiQuestDialogue(board(start,p),true);
  assert.match(creative.greeting,/Survival/);
  assert.equal(creative.action,'View Expedition Board');
  assert.equal(CRYPTO_REWARDS_ENABLED,false);
  assert.equal(lofiQuestDialogue({done:true,mission:null}).icon,'★');
});

test('navigation only points to a known dungeon, never a fabricated monster spawn',()=>{
  const npc={mission:{id:'frost-patrol',active:true,ready:false,kind:'kills'}};
  assert.equal(expeditionGuideTarget(npc,{den:{x:23,z:77}}),null);
  const build={mission:{id:'winter-shelter',active:true,ready:false,kind:'blocks'}};
  assert.equal(expeditionGuideTarget(build,{den:{x:23,z:77}}),null);
  const dungeon={mission:{id:'ruins-expedition',active:true,ready:false,kind:'clears'}};
  assert.deepEqual(expeditionGuideTarget(dungeon,{den:{x:24.8,z:71.2}}),{
    id:'expedition-frost-ruins',name:'Frost Ruins entrance',x:24,z:65});
  assert.equal(expeditionGuideTarget(dungeon,{den:null}),null);
  assert.equal(expeditionGuideTarget(dungeon,{den:{x:Infinity,z:2}}),null);
  assert.equal(expeditionGuideTarget({mission:{...dungeon.mission,ready:true}},
    {den:{x:23,z:77}}),null);
  assert.equal(expeditionGuideTarget({mission:{...dungeon.mission,active:false}},
    {den:{x:23,z:77}}),null);
});
