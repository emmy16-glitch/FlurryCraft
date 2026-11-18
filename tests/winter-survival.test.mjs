import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_HEALTH, FROST_RECOVERY_COST, FROST_RECOVERY_HEAL,
  FROST_RECOVERY_COOLDOWN, survivalVitals, checkFrostRecovery, recoveredHealth }
  from '../js/winter-survival-core.js';

test('survival HUD displays real health, hunger and danger levels', () => {
  assert.deepEqual(survivalVitals({ health: 5.2, hunger: 9 }), {
    health: 5.2, hunger: 9, healthLabel: '6 / 20',
    hungerLabel: '9 / 20', percent: 26, critical: true
  });
  assert.equal(survivalVitals({ health: 20, hunger: 20 }).critical, false);
  assert.equal(survivalVitals({ health: -50, hunger: 100 }).percent, 0);
  assert.equal(survivalVitals(null).health, 20);
});
test('frost recovery costs shards, respects cooldown and never heals above 20 HP', () => {
  const player = { health: 9, creative: false, dead: false };
  assert.equal(MAX_HEALTH, 20);
  assert.equal(FROST_RECOVERY_COST, 2);
  assert.equal(FROST_RECOVERY_HEAL, 6);
  assert.equal(FROST_RECOVERY_COOLDOWN, 12);
  assert.equal(checkFrostRecovery(player, 2).ok, true);
  assert.equal(checkFrostRecovery(player, 1).ok, false);
  assert.match(checkFrostRecovery(player, 2, 2.1).reason, /3s/);
  assert.equal(checkFrostRecovery({ ...player, health: 20 }, 2).ok, false);
  assert.equal(checkFrostRecovery({ ...player, creative: true }, 2).ok, false);
  assert.equal(checkFrostRecovery({ ...player, dead: true }, 2).ok, false);
  assert.equal(recoveredHealth(9), 15);
  assert.equal(recoveredHealth(18), 20);
});
