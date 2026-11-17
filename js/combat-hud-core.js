// Presentation-only combat helpers. No DOM, rendering, or gameplay changes.
export function aimedCreature(mob) {
  if(!mob||mob.dead||mob.deadT>0||!Number.isFinite(mob.hp)||mob.hp<=0)return null;
  const maxHp=Number.isFinite(mob.maxHp)&&mob.maxHp>0?mob.maxHp:
    Number.isFinite(mob.sp?.hp)&&mob.sp.hp>0?mob.sp.hp:Math.max(1,mob.hp);
  const health=Math.max(0,Math.min(maxHp,mob.hp));
  const raw=String(mob.sp?.displayName||mob.kind||'Creature');
  const name=raw.replace(/[_-]+/g,' ').replace(/\b\w/g,m=>m.toUpperCase()).slice(0,32);
  const level=Number.isFinite(mob.level)?Math.max(1,Math.min(100,Math.floor(mob.level))):null;
  return {name,level,health,maxHp,percent:Math.max(0,Math.min(100,health/maxHp*100)),
    boss:!!mob.sp?.boss,passive:!!mob.sp?.passive};
}
export function actionForTarget(mob){
  return aimedCreature(mob)?'attack':'mine';
}
