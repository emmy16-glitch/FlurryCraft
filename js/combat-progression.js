// Pure combat progression rules for FlurryCraft Survival.
// Every five adventure levels grants +0.75 weapon damage, capped at +4.5.
// Weapon quality remains the larger component of the combat power curve.
export const ATTACK_BONUS_STEP=5;
export const ATTACK_BONUS_PER_STEP=.75;
export const MAX_ATTACK_BONUS=4.5;

export function playerAttackBonus(level){
  const n=Number.isFinite(level)?Math.max(1,Math.min(100,Math.floor(level))):1;
  return Math.min(MAX_ATTACK_BONUS,Math.floor(n/ATTACK_BONUS_STEP)*ATTACK_BONUS_PER_STEP);
}

export function playerAttackDamage(baseDamage,level,critical=false){
  const base=Number.isFinite(baseDamage)?Math.max(0,baseDamage):1;
  const bonus=playerAttackBonus(level)*(base>=4?1:.5);
  return Math.round((base+bonus)*(critical?1.5:1)*10)/10;
}

export function hitsToDefeat(health,damage){
  if(!Number.isFinite(health)||health<=0)return 0;
  if(!Number.isFinite(damage)||damage<=0)return Infinity;
  return Math.ceil(health/damage);
}
