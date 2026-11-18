// Pure Survival UI and recovery rules. No renderer or storage dependencies.
export const MAX_HEALTH = 20;
export const FROST_RECOVERY_COST = 2;
export const FROST_RECOVERY_HEAL = 6;
export const FROST_RECOVERY_COOLDOWN = 12;

const finite = (value, fallback) => Number.isFinite(value) ? value : fallback;

export function survivalVitals(player) {
  const health = Math.max(0, Math.min(MAX_HEALTH, finite(player?.health, MAX_HEALTH)));
  const hunger = Math.max(0, Math.min(20, finite(player?.hunger, 20)));
  return {
    health, hunger,
    healthLabel: Math.ceil(health) + ' / ' + MAX_HEALTH,
    hungerLabel: Math.ceil(hunger) + ' / 20',
    percent: Math.round(100 * health / MAX_HEALTH),
    critical: health <= 6
  };
}

export function checkFrostRecovery(player, shards, cooldown = 0) {
  if (!player || player.dead || player.creative) return { ok: false, reason: 'Recovery requires a living Survival player' };
  if (!Number.isFinite(player.health) || player.health <= 0) return { ok: false, reason: 'Respawn before recovering' };
  if (player.health >= MAX_HEALTH) return { ok: false, reason: 'Health is already full' };
  if (finite(cooldown, 0) > 0) return { ok: false, reason: 'Recovery ready in ' + Math.ceil(cooldown) + 's' };
  if (!Number.isFinite(shards) || shards < FROST_RECOVERY_COST)
    return { ok: false, reason: 'Need 2 Frost Shards' };
  return { ok: true, reason: '' };
}

export function recoveredHealth(health) {
  return Math.min(MAX_HEALTH, Math.max(0, finite(health, 0)) + FROST_RECOVERY_HEAL);
}

/** Comfortable minimum spacing for winter creatures on a first-person phone screen. */
export function winterMeleeSpacing(kind) {
  if (kind === 'glacier_guardian') return { stop: 2.35, attack: 2.85 };
  if (kind === 'snow_prowler') return { stop: 1.65, attack: 1.9 };
  if (kind === 'frostling') return { stop: 1.65, attack: 1.9 };
  return { stop: 1.15, attack: 1.3 };
}
