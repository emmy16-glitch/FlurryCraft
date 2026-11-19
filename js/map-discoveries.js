// FlurryCraft world-map discoveries. No network, geolocation or fabricated
// monster locations: only saved/scouted dungeon sites and currently loaded mobs.
import {worldToMap} from './explorer-map-core.js';
export const MAX_MAP_MONSTERS=12;
export const MONSTER_REVEAL_RADIUS=96; // chunks in actual memory, not a world radar
const safe=o=>o&&typeof o==='object'&&!Array.isArray(o)?o:{};
const coordinate=n=>Number.isFinite(n)&&Math.abs(n)<1000000?Math.floor(n):null;
const location=(site,name,id,offset=0,built=false,detail='')=>{
  const x=coordinate(site?.x),z=coordinate(site?.z);
  if(x===null||z===null)return null;
  return {id,name,x,z:z+offset,kind:'dungeon',built:!!built,
    detail:detail||(built?'Built':'Site discovered')};
};
export function discoveredDungeons(adventure){
  const a=safe(adventure),out=[];
  const frost=location(a.den,'Frost Ruins','map-frost-ruins',-6,a.denBuilt);
  if(frost)out.push(frost);
  const choices=[
    [a.storm,'Stormspire Keep','map-stormspire',-7],
    [a.aurora,'Aurora Citadel','map-aurora',-8],
    [a.abyss,'Frostbound Abyss','map-abyss',-8]
  ];
  for(const [state,name,id,offset] of choices){
    const entry=location(state?.site,name,id,offset,state?.built);
    if(entry)out.push(entry);
  }
  return out;
}
const MONSTER_NAMES=Object.freeze({
  frostling:'Frostling',snow_prowler:'Snow Prowler',
  glacier_guardian:'Glacier Guardian',storm_hound:'Storm Hound',
  rime_knight:'Rime Knight',blizzard_titan:'Blizzard Titan',
  aurora_wisp:'Aurora Wisp',prism_stalker:'Prism Stalker',
  boreal_sovereign:'Boreal Sovereign',rift_stalker:'Rift Stalker',
  umbral_sentinel:'Umbral Sentinel',abyss_keeper:'Abyss Keeper',
  zombie:'Zombie',skeleton:'Skeleton',creeper:'Creeper',spider:'Spider'
});
export function nearbyMonsterMarkers(mobs,player,radius=MONSTER_REVEAL_RADIUS,limit=MAX_MAP_MONSTERS){
  const px=coordinate(player?.x),pz=coordinate(player?.z);
  if(px===null||pz===null||!Array.isArray(mobs))return [];
  const maxRadius=Number.isFinite(radius)?Math.max(0,Math.min(128,radius)):0;
  const maxCount=Number.isFinite(limit)?Math.min(MAX_MAP_MONSTERS,Math.max(0,Math.floor(limit))):0;
  if(!maxRadius||!maxCount)return [];
  const matches=[];
  // We do not reveal invisible/unloaded enemies or peaceful animals.
  for(let i=0;i<mobs.length&&i<200;i++){
    const m=mobs[i],x=coordinate(m?.x),z=coordinate(m?.z);
    if(x===null||z===null||!m?.sp||m.sp.passive||m.dead||m.deadT>0)continue;
    const name=MONSTER_NAMES[m.kind];
    if(!name)continue;
    const distance=Math.hypot(m.x-player.x,m.z-player.z);
    if(distance>maxRadius)continue;
    matches.push({id:'live-monster-'+i,name,x,z,kind:'monster',
      detail:'Nearby · '+Math.round(distance)+' blocks',distance});
  }
  matches.sort((a,b)=>a.distance-b.distance);
  return matches.slice(0,maxCount).map(({distance,...rest})=>rest);
}
export function mapMarkerAt(markers,px,py,center,step,size,hitRadius=14){
  if(!Array.isArray(markers)||!Number.isFinite(px)||!Number.isFinite(py)||
     !Number.isFinite(step)||step<=0||!Number.isFinite(size)||size<=0)return null;
  let best=null,dist=hitRadius;
  for(const m of markers){
    if(!Number.isFinite(m?.x)||!Number.isFinite(m?.z))continue;
    const a=worldToMap(m.x,m.z,center.x,center.z,step,size);
    const d=Math.hypot(a.x-px,a.y-py);
    if(d<=dist){dist=d;best=m;}
  }
  return best;
}
