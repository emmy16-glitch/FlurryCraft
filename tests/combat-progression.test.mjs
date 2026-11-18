import test from 'node:test';
import assert from 'node:assert/strict';
import {ATTACK_BONUS_STEP,ATTACK_BONUS_PER_STEP,MAX_ATTACK_BONUS,
  playerAttackBonus,playerAttackDamage,hitsToDefeat} from '../js/combat-progression.js';

test('combat progression earns attack power every five levels without runaway scaling',()=>{
  assert.equal(ATTACK_BONUS_STEP,5);
  assert.equal(ATTACK_BONUS_PER_STEP,.75);
  assert.equal(MAX_ATTACK_BONUS,4.5);
  assert.equal(playerAttackBonus(1),0);
  assert.equal(playerAttackBonus(4),0);
  assert.equal(playerAttackBonus(5),.75);
  assert.equal(playerAttackBonus(10),1.5);
  assert.equal(playerAttackBonus(20),3);
  assert.equal(playerAttackBonus(30),4.5);
  assert.equal(playerAttackBonus(100),4.5);
  assert.equal(playerAttackBonus(Infinity),0);
  assert.equal(playerAttackBonus(-20),0);
});

test('good weapons and higher player level BOTH contribute to tougher fights',()=>{
  assert.equal(playerAttackDamage(4,1),4,'wooden sword at Level 1');
  assert.equal(playerAttackDamage(4,20),7,'wooden sword at Level 20');
  assert.equal(playerAttackDamage(7,1),7,'diamond sword at Level 1');
  assert.equal(playerAttackDamage(9,30),13.5,'Aurora Blade at Level 30');
  assert.equal(playerAttackDamage(9,30,true),20.3,'falling critical');
  assert.equal(playerAttackDamage(1,30),3.3,'unarmed gains half the bonus');
  assert.equal(playerAttackDamage(0,1),0,'broken base damage is not negative');
});

test('stronger adventurers defeat weak enemies quicker without trivializing bosses',()=>{
  const frostlingLv1=12;
  const frostlingLv10=Math.round(12*(1+9*.09));
  const borealBossLv28=Math.round(175*(1+27*.09));
  assert.equal(hitsToDefeat(frostlingLv1,playerAttackDamage(4,1)),3);
  assert.equal(hitsToDefeat(frostlingLv1,playerAttackDamage(9,30)),1);
  assert.ok(hitsToDefeat(frostlingLv10,playerAttackDamage(9,30))>=2);
  assert.ok(hitsToDefeat(borealBossLv28,playerAttackDamage(9,30))>=30);
  assert.equal(hitsToDefeat(0,10),0);
  assert.equal(hitsToDefeat(10,0),Infinity);
});

test('invalid damage and level inputs remain finite and bounded',()=>{
  assert.equal(playerAttackDamage(-100,100),2.3);
  assert.equal(playerAttackDamage(NaN,1),1);
  assert.equal(playerAttackDamage(9,NaN),9);
});
