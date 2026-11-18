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

// Survival health begins above the legacy 20-HP limit and grows with levels.
// +2 HP every 5 levels, maximum 50 HP at Level 65.
export const PLAYER_BASE_HEALTH=24;
export const PLAYER_HEALTH_STEP=5;
export const PLAYER_HEALTH_PER_STEP=2;
export const PLAYER_HEALTH_CAP=50;
export const LEGACY_HEALTH_CAP=20;

export function playerMaxHealth(level){
  const n=Number.isFinite(level)?Math.max(1,Math.min(100,Math.floor(level))):1;
  return Math.min(PLAYER_HEALTH_CAP,
    PLAYER_BASE_HEALTH+Math.floor(n/PLAYER_HEALTH_STEP)*PLAYER_HEALTH_PER_STEP);
}

// Preserve how much HP the player was missing, rather than unfairly
// restoring all injuries on reload. Legacy worlds assumed a 20-HP maximum.
export function migratePlayerHealth(health,oldCap,newCap){
  const target=Number.isFinite(newCap)?Math.max(1,newCap):PLAYER_BASE_HEALTH;
  const was=Number.isFinite(oldCap)?Math.max(1,oldCap):LEGACY_HEALTH_CAP;
  const value=Number.isFinite(health)?health:was;
  if(value<=0)return 0;
  return Math.max(0,Math.min(target,value+(target-was)));
}

export function healthAfterLevelUp(health,oldLevel,newLevel){
  return migratePlayerHealth(health,playerMaxHealth(oldLevel),playerMaxHealth(newLevel));
}

// Monster HP scaling now starts from each creature's actual chapter.
// Otherwise a Level 28 boss incorrectly receives 27 early-game HP bonuses.
export function monsterMaxHealth(baseHp,level,chapter=1){
  const base=Number.isFinite(baseHp)?Math.max(1,baseHp):1;
  const tier=chapter===4?4:chapter===3?3:chapter===2?2:1;
  const start=tier===4?31:tier===3?21:tier===2?11:1;
  const cap=tier===4?40:tier===3?30:tier===2?20:10;
  const step=tier===4?.055:tier===3?.06:tier===2?.07:.05;
  const lv=Number.isFinite(level)?Math.max(start,Math.min(cap,Math.floor(level))):start;
  return Math.round(base*(1+(lv-start)*step));
}
