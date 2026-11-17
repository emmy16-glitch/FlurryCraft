// A small, unobtrusive touch-only melee aim assist.
// Works in world coordinates; walls still block hits.
export function assistedMeleeTarget(origin,dir,mobs,blockDistance=Infinity,maxReach=5.2){
  if(!origin||!dir||!Array.isArray(mobs))return null;
  const [ox,oy,oz]=origin,[dx,dy,dz]=dir;
  if(![ox,oy,oz,dx,dy,dz].every(Number.isFinite))return null;
  let best=null,bestScore=Infinity;
  for(const m of mobs){
    if(!m||m.dead||m.deadT>0||!(m.hp>0)||!Number.isFinite(m.x)||!Number.isFinite(m.y)||!Number.isFinite(m.z))continue;
    const height=Math.max(.5,Number(m.h)||1.5),radius=Math.max(.28,Number(m.hw)||.35);
    for(const proportion of [.45,.73]){
      const ax=m.x-ox,ay=m.y+height*proportion-oy,az=m.z-oz;
      const forward=ax*dx+ay*dy+az*dz;
      if(forward<.05||forward>maxReach+radius)continue;
      // The block raycast must not terminate in front of the creature.
      if(Number.isFinite(blockDistance)&&blockDistance<forward-Math.max(.4,radius))continue;
      const lateral=Math.hypot(ax-dx*forward,ay-dy*forward,az-dz*forward);
      const allowed=radius+.28+Math.min(.32,forward*.055);
      if(lateral>allowed)continue;
      const score=lateral/allowed+forward*.015;
      if(score<bestScore){bestScore=score;best=m;}
    }
  }
  return best;
}
