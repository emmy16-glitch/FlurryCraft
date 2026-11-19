// Deterministic, non-destructive snowy landmarks for the active world.
// Pure data functions: never modify voxel blocks, grant SUI or mint NFTs.
export const LANDMARK_CELL=128;
export const MAX_ACTIVE_LANDMARKS=6;
export const MAX_VISITED_LANDMARKS=24;
export const LANDMARK_INTERACT_RADIUS=6;
export const LANDMARK_VISIBLE_RADIUS=115;
export const TYPES=Object.freeze({
 refuge:Object.freeze({name:'Wayfarer Refuge',
  story:'A forgotten travel camp once guided Yetis through the endless snow. The fire still carries a little warmth.',
  action:'Rest and recover 6 health',description:'A warm shelter in the snow'}),
 spire:Object.freeze({name:'Aurora Waystone',
  story:'Ice crystals remember the aurora. Travelers once touched this stone to steady their sword arm.',
  action:'Restore your guard stamina',description:'A glowing ancient crystal'}),
 cairn:Object.freeze({name:'Frost Cairn',
  story:'Explorers left a cairn and a single frost shard to help whoever reached this silent crossing.',
  action:'Take one Frost Shard',description:'A memorial of the winter trail'})
});
const finite=n=>Number.isFinite(n)&&Math.abs(n)<1000000;
const location=v=>v&&finite(v.x)&&finite(v.z)
  ?{x:Math.floor(v.x),z:Math.floor(v.z)}:null;
const hash=(seed,x,z)=>{
  let h=Math.imul((Number.isFinite(seed)?seed:0)|0,0x9e3779b1)^
    Math.imul(x,0x85ebca6b)^Math.imul(z,0xc2b2ae35);
  h=Math.imul(h^(h>>>16),0x7feb352d);
  h=Math.imul(h^(h>>>15),0x846ca68b);
  return (h^(h>>>16))>>>0;
};
const flatSurface=(gen,x,z)=>{
  if(!gen||typeof gen.column!=='function')return null;
  const c=gen.column(x,z),h=c?.h;
  if(!Number.isFinite(h)||h<34||h>81||
     (c.biome!==3&&c.biome!==4))return null;
  for(const [dx,dz] of [[3,0],[-3,0],[0,3],[0,-3]]){
    const other=gen.column(x+dx,z+dz);
    if(!Number.isFinite(other?.h)||Math.abs(other.h-h)>3)return null;
  }
  return h+1;
};
const fromSite=(id,kind,x,z,y)=>{
  if(!TYPES[kind]||!finite(x)||!finite(z)||!Number.isFinite(y))return null;
  return {id,kind,x:Math.floor(x),z:Math.floor(z),y,
    name:TYPES[kind].name,detail:TYPES[kind].description};
};
export function winterSiteAtCell(seed,cx,cz,gen){
  if(!Number.isInteger(cx)||!Number.isInteger(cz)||
     Math.abs(cx)>10000||Math.abs(cz)>10000)return null;
  const h=hash(seed,cx,cz);
  if(h%100>=58)return null; // keep most terrain empty and quiet
  const x=cx*LANDMARK_CELL+22+((h>>>8)%80);
  const z=cz*LANDMARK_CELL+22+((h>>>17)%80);
  const y=flatSurface(gen,x,z);
  if(y===null)return null;
  const kind=['cairn','spire','refuge'][(h>>>4)%3];
  return fromSite('site:'+cx+':'+cz,kind,x,z,y);
}
export function starterWinterRefuge(seed,spawn,gen){
  const start=location(spawn);if(!start)return null;
  const offsets=[[40,10],[30,-30],[-38,12],[-30,-30],
    [17,44],[-14,47],[48,-18],[-49,-12]];
  const shift=hash(seed,Math.floor(start.x/16),Math.floor(start.z/16))%offsets.length;
  for(let i=0;i<offsets.length;i++){
    const [dx,dz]=offsets[(shift+i)%offsets.length];
    const x=start.x+dx,z=start.z+dz,y=flatSurface(gen,x,z);
    if(y!==null)return fromSite('starter', 'refuge',x,z,y);
  }
  return null; // never invent a fake or floating camp
}
export function nearbyWinterSites(seed,gen,player,spawn,limit=MAX_ACTIVE_LANDMARKS){
  const p=location(player);if(!p)return [];
  const sites=[];
  const intro=starterWinterRefuge(seed,spawn,gen);
  if(intro&&Math.hypot(intro.x-p.x,intro.z-p.z)<=LANDMARK_VISIBLE_RADIUS)
    sites.push(intro);
  const cx=Math.floor(p.x/LANDMARK_CELL),cz=Math.floor(p.z/LANDMARK_CELL);
  for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){
    const site=winterSiteAtCell(seed,cx+dx,cz+dz,gen);
    if(!site||Math.hypot(site.x-p.x,site.z-p.z)>LANDMARK_VISIBLE_RADIUS)
      continue;
    if(intro&&Math.hypot(intro.x-site.x,intro.z-site.z)<30)continue;
    if(spawn&&Math.hypot(site.x-spawn.x,site.z-spawn.z)<26)continue;
    sites.push(site);
  }
  sites.sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-
    Math.hypot(b.x-p.x,b.z-p.z));
  return sites.slice(0,Math.max(0,Math.min(MAX_ACTIVE_LANDMARKS,
    Number.isFinite(limit)?Math.floor(limit):0)));
}
const re=/^(starter|site:-?\d{1,5}:-?\d{1,5})$/;
function safeVisit(v){
  if(!v||typeof v.id!=='string'||!re.test(v.id)||
    !Object.hasOwn(TYPES,v.kind))return null;
  const p=location(v);if(!p)return null;
  return {id:v.id,kind:v.kind,x:p.x,z:p.z};
}
export function safeWinterLandmarks(raw){
  const visits=[],seen=new Set();
  for(const candidate of Array.isArray(raw?.visited)?raw.visited.slice(0,80):[]){
    const v=safeVisit(candidate);
    if(!v||seen.has(v.id)||visits.length>=MAX_VISITED_LANDMARKS)continue;
    visits.push(v);seen.add(v.id);
  }
  const used=[];
  for(const id of Array.isArray(raw?.used)?raw.used.slice(0,80):[]){
    if(typeof id==='string'&&seen.has(id)&&!used.includes(id))
      used.push(id);
  }
  return {version:1,visited:visits,used};
}
export function visitWinterSite(state,site){
  const s=safeWinterLandmarks(state),v=safeVisit(site);
  if(!v||s.visited.some(x=>x.id===v.id)||
    s.visited.length>=MAX_VISITED_LANDMARKS)
    return {state:s,first:false};
  s.visited.push(v);
  return {state:s,first:true};
}
export function useWinterSite(state,site){
  const s=safeWinterLandmarks(state);
  if(!site||!s.visited.some(x=>x.id===site.id)||
    s.used.includes(site.id))return {state:s,first:false};
  s.used.push(site.id);
  return {state:s,first:true};
}
export function nearestInteractableSite(sites,player,radius=LANDMARK_INTERACT_RADIUS){
  if(!Array.isArray(sites)||!location(player))return null;
  let found=null,distance=radius;
  for(const site of sites){
    if(!site||!Number.isFinite(site.y))continue;
    if(Number.isFinite(player.y)&&Math.abs(player.y-site.y)>5)continue;
    const d=Math.hypot(player.x-site.x,player.z-site.z);
    if(d<=distance){distance=d;found=site;}
  }
  return found;
}
export function visitedLandmarkPlaces(state){
  return safeWinterLandmarks(state).visited.map(x=>({
    ...x,name:TYPES[x.kind].name,detail:'Explored winter landmark',
    markerKind:'visited-landmark'}));
}
