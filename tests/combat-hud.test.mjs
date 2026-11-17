import test from 'node:test';
import assert from 'node:assert/strict';
import {aimedCreature,actionForTarget} from '../js/combat-hud-core.js';
const creature=(patch={})=>({kind:'snow_prowler',hp:14,maxHp:18,level:4,
 sp:{hp:17,iceNative:true},dead:false,deadT:0,...patch});
test('aiming at living ice monster switches touch Mine to Attack',()=>{
  assert.equal(actionForTarget(null),'mine');
  assert.equal(actionForTarget(creature()),'attack');
  assert.equal(actionForTarget(creature({hp:0})),'mine');
  assert.equal(actionForTarget(creature({deadT:.2})),'mine');
  assert.equal(actionForTarget(creature({dead:true})),'mine');
  assert.equal(actionForTarget(creature({hp:NaN})),'mine');
});
test('target health display is bounded, named, and respects boss and levels',()=>{
  const a=aimedCreature(creature());
  assert.equal(a.name,'Snow Prowler');assert.equal(a.level,4);
  assert.equal(a.percent,14/18*100);
  assert.equal(aimedCreature(creature({hp:999,level:999})).percent,100);
  assert.equal(aimedCreature(creature({hp:999,level:999})).level,100);
  const b=aimedCreature(creature({kind:'glacier_guardian',level:9,sp:{boss:true,hp:65}}));
  assert.equal(b.name,'Glacier Guardian');assert.equal(b.boss,true);
  assert.equal(aimedCreature(creature({maxHp:0,sp:{hp:0}})).maxHp,14);
  assert.equal(aimedCreature(creature({level:undefined})).level,null);
});
test('creative and passive mobs still resolve to existing attack input',()=>{
  assert.equal(actionForTarget(creature({kind:'sheep',sp:{passive:true}})),'attack');
  assert.equal(actionForTarget({kind:'frostling',hp:1,sp:{hp:1}}),'attack');
});
