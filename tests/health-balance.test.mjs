import test from 'node:test';
import assert from 'node:assert/strict';
import {
  playerMaxHealth,PLAYER_BASE_HEALTH,PLAYER_HEALTH_CAP,
  playerAttackDamage,playerAttackBonus,hitsToDefeat,
  migratePlayerHealth,healthAfterLevelUp,monsterMaxHealth
} from '../js/combat-progression.js';

test('player starts with 24 HP, earns +2 HP each 5 levels, caps at 50',()=>{
  assert.equal(PLAYER_BASE_HEALTH,24);
  assert.equal(PLAYER_HEALTH_CAP,50);
  const samples={1:24,4:24,5:26,10:28,20:32,30:36,50:44,65:50,75:50,100:50};
  for(const [level,hp] of Object.entries(samples))
    assert.equal(playerMaxHealth(Number(level)),hp,'level '+level);
  assert.equal(playerMaxHealth(Infinity),24);
  assert.equal(playerMaxHealth(-5),24);
  for(let level=2;level<=100;level++)
    assert.ok(playerMaxHealth(level)>=playerMaxHealth(level-1));
});

test('level-up health credits only extra capacity and never resets injuries',()=>{
  assert.equal(healthAfterLevelUp(11,4,5),13);
  assert.equal(healthAfterLevelUp(23,4,5),25);
  assert.equal(healthAfterLevelUp(0,4,5),0,'dead players do not resurrect');
  assert.equal(healthAfterLevelUp(10,6,9),10,'no HP gain outside a milestone');
  assert.equal(healthAfterLevelUp(47,64,65),49);
  assert.equal(healthAfterLevelUp(49,65,75),49,'HP cap must not exceed 50');
});

test('legacy save migration preserves missing health rather than granting full heal',()=>{
  assert.equal(migratePlayerHealth(20,undefined,36),36);
  assert.equal(migratePlayerHealth(5,undefined,36),21,'old save missing 15 HP remains missing 15');
  assert.equal(migratePlayerHealth(0,undefined,36),0);
  assert.equal(migratePlayerHealth(26,26,26),26,'repeat loads never stack health');
  assert.equal(migratePlayerHealth(13,26,26),13);
  assert.equal(migratePlayerHealth(999,20,50),50);
  assert.equal(migratePlayerHealth(-999,20,50),0);
});

test('monster HP grows only inside its own chapter, avoiding oversized bosses',()=>{
  assert.equal(monsterMaxHealth(12,1,1),12);
  assert.equal(monsterMaxHealth(12,10,1),17);
  assert.equal(monsterMaxHealth(12,90,1),17,'chapter one stays capped at 10');
  assert.equal(monsterMaxHealth(27,11,2),27);
  assert.equal(monsterMaxHealth(27,20,2),44);
  assert.equal(monsterMaxHealth(120,20,2),196,'blizzard titan no longer has extreme HP');
  assert.equal(monsterMaxHealth(32,21,3),32);
  assert.equal(monsterMaxHealth(175,28,3),249);
  assert.equal(monsterMaxHealth(175,30,3),270);
  assert.equal(monsterMaxHealth(175,100,3),270);
});

test('high levels can dispatch low-level creatures quickly but bosses still require a fight',()=>{
  const sword1=playerAttackDamage(4,1);
  const aurora30=playerAttackDamage(9,30);
  assert.equal(sword1,4);
  assert.equal(aurora30,13.5);
  assert.equal(playerAttackBonus(30),4.5);
  assert.equal(hitsToDefeat(monsterMaxHealth(12,1,1),sword1),3);
  assert.equal(hitsToDefeat(monsterMaxHealth(12,1,1),aurora30),1);
  assert.equal(hitsToDefeat(monsterMaxHealth(12,10,1),aurora30),2);
  assert.equal(hitsToDefeat(monsterMaxHealth(175,30,3),aurora30),20);
  assert.ok(hitsToDefeat(monsterMaxHealth(175,30,3),aurora30)>=15);
});
