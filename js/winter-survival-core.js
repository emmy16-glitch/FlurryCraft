// Pure Survival UI and recovery rules. No renderer or storage dependencies.
import {playerMaxHealth,PLAYER_BASE_HEALTH} from './combat-progression.js';
export const MAX_HEALTH = PLAYER_BASE_HEALTH; // Starting cap, not a permanent ceiling.
export const FROST_RECOVERY_COST = 2;
export const FROST_RECOVERY_HEAL = 6;
export const FROST_RECOVERY_COOLDOWN = 12;

const finite = (value, fallback) => Number.isFinite(value) ? value : fallback;

export function healthLimit(player){
  const explicit=player?.maxHealth;
  return Number.isFinite(explicit)&&explicit>=MAX_HEALTH?
    Math.max(MAX_HEALTH,Math.min(50,Math.floor(explicit))):
    playerMaxHealth(player?.level||1);
}
export function survivalVitals(player) {
  const maxHealth=healthLimit(player);
  const health = Math.max(0, Math.min(maxHealth, finite(player?.health, maxHealth)));
  const hunger = Math.max(0, Math.min(20, finite(player?.hunger, 20)));
  return {
    health, hunger,
    healthLabel: Math.ceil(health) + ' / ' + maxHealth,
    hungerLabel: Math.ceil(hunger) + ' / 20',
    percent: Math.round(100 * health / maxHealth),
    critical: health<=Math.max(6,Math.floor(maxHealth*.25))
  };
}

export function checkFrostRecovery(player, shards, cooldown = 0) {
  if (!player || player.dead || player.creative) return { ok: false, reason: 'Recovery requires a living Survival player' };
  if (!Number.isFinite(player.health) || player.health <= 0) return { ok: false, reason: 'Respawn before recovering' };
  if (player.health >= healthLimit(player)) return { ok: false, reason: 'Health is already full' };
  if (finite(cooldown, 0) > 0) return { ok: false, reason: 'Recovery ready in ' + Math.ceil(cooldown) + 's' };
  if (!Number.isFinite(shards) || shards < FROST_RECOVERY_COST)
    return { ok: false, reason: 'Need 2 Frost Shards' };
  return { ok: true, reason: '' };
}

export function recoveredHealth(health,maxHealth=MAX_HEALTH) {
  const limit=Number.isFinite(maxHealth)?Math.max(MAX_HEALTH,Math.min(50,maxHealth)):MAX_HEALTH;
  return Math.min(limit, Math.max(0, finite(health, 0)) + FROST_RECOVERY_HEAL);
}

/** Comfortable minimum spacing for winter creatures on a first-person phone screen. */
export function winterMeleeSpacing(kind) {
  if(kind==='abyss_keeper')return {stop:3.0,attack:3.5};
  if(kind==='umbral_sentinel')return {stop:2.15,attack:2.55};
  if(kind==='rift_stalker')return {stop:1.9,attack:2.3};
  if(kind==='boreal_sovereign')return {stop:2.8,attack:3.3};
  if(kind==='prism_stalker')return {stop:1.9,attack:2.25};
  if(kind==='aurora_wisp')return {stop:1.9,attack:2.25};
  if (kind === 'glacier_guardian') return { stop: 2.35, attack: 2.85 };
  if (kind === 'snow_prowler') return { stop: 1.65, attack: 1.9 };
  if (kind === 'frostling') return { stop: 1.65, attack: 1.9 };
  return { stop: 1.15, attack: 1.3 };
}
