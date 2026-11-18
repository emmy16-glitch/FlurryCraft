// Pure sword defense rules. No renderer, wallet, or saved progression state.
export const GUARD_MAX_STAMINA = 100;
export const GUARD_DRAIN_PER_SECOND = 14;
export const GUARD_REGEN_PER_SECOND = 34;
export const GUARD_HIT_COST = 20;
export const GUARD_BREAK_COOLDOWN = 1.6;
export const PERFECT_PARRY_SECONDS = .22;
// Half-angle of the sword's frontal guard cone; rear and flank hits go through.
export const GUARD_HALF_ANGLE_DEGREES = 70;

export function isSwordEquipped(item, registry) {
  return !!(item && registry?.[item.id]?.tool?.type === 'sword');
}

export function guardDamage({damage, guarding, elapsed, stamina, yaw,
  x, z, sourceX, sourceZ, type='melee'}) {
  const passthrough = {damage, blocked:false, perfect:false, staminaCost:0};
  // Fire, starvation, falls, explosions and AOE pulses are not sword-blockable.
  if (type !== 'melee' && type !== 'projectile') return passthrough;
  if (!guarding || !Number.isFinite(damage) || damage <= 0 ||
      !Number.isFinite(stamina) || stamina <= 0 ||
      ![x,z,yaw,sourceX,sourceZ].every(Number.isFinite)) return passthrough;
  const dx=sourceX-x, dz=sourceZ-z, distance=Math.hypot(dx,dz);
  if (distance < .05) return passthrough;
  const facing=(-Math.sin(yaw)*dx-Math.cos(yaw)*dz)/distance;
  if (facing<Math.cos(GUARD_HALF_ANGLE_DEGREES*Math.PI/180))return passthrough;
  const perfect=Number.isFinite(elapsed)&&elapsed>=0&&elapsed<=PERFECT_PARRY_SECONDS;
  const cost=GUARD_HIT_COST+damage*1.5;
  // Out of stamina? Take the hit, then enter the guard-break cooldown.
  if (stamina<cost)return {...passthrough,staminaCost:stamina};
  const reduction=perfect?.85:.60;
  return {damage:Math.max(.25,Math.round(damage*(1-reduction)*100)/100),
    blocked:true,perfect,staminaCost:cost};
}
