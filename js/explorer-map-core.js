// FlurryCraft Explorer Map — pure coordinate, marker and color helpers.
// Deliberately does not need browser permissions, geolocation or network access.
export const MAP_CELLS=96;
export const MAP_STEPS=Object.freeze([2,4,7,12]);
export const MAX_PLACES=8;
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export function mapToWorld(px,py,centerX,centerZ,step=4,side=320){
  if(![px,py,centerX,centerZ,step,side].every(Number.isFinite)||step<=0||side<=0)
    throw new Error('Invalid map position');
  return {
    x:Math.round(centerX+(px/side-.5)*MAP_CELLS*step)||0,
    z:Math.round(centerZ+(py/side-.5)*MAP_CELLS*step)||0,
  };
}
export function worldToMap(x,z,centerX,centerZ,step=4,side=320){
  if(![x,z,centerX,centerZ,step,side].every(Number.isFinite)||step<=0||side<=0)
    throw new Error('Invalid map position');
  return {x:(.5+(x-centerX)/(MAP_CELLS*step))*side,
    y:(.5+(z-centerZ)/(MAP_CELLS*step))*side};
}
export function directionTo(x,z,targetX,targetZ,yaw=0){
  if(![x,z,targetX,targetZ,yaw].every(Number.isFinite))
    return {distance:0,angle:0};
  const dx=targetX-x,dz=targetZ-z;
  const absolute=Math.atan2(-dx,-dz);
  // Player yaw 0 faces north (-Z); positive yaw faces west (-X).
  const angle=Math.atan2(Math.sin(absolute-yaw),Math.cos(absolute-yaw));
  return {distance:Math.round(Math.hypot(dx,dz)),angle:angle||0};
}
export function markerKey(worldId){
  return 'flurrycraft_places_v1_'+String(worldId||'unknown').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,48);
}
export function cleanPlace(value){
  if(!value||typeof value!=='object'||!Number.isFinite(value.x)||!Number.isFinite(value.z))
    return null;
  const x=Math.round(value.x),z=Math.round(value.z);
  if(Math.abs(x)>10000000||Math.abs(z)>10000000)return null;
  const name=String(value.name||'Place').trim().replace(/\s+/g,' ').slice(0,24)||'Place';
  const id=String(value.id||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,48);
  if(!id)return null;
  return {id,name,x,z};
}
export function sanitizePlaces(value){
  const input=value&&typeof value==='object'?value:{};
  const home=input.home?cleanPlace({...input.home,id:'home',name:'Home'}):null;
  const seen=new Set(),marks=[];
  for(const entry of Array.isArray(input.marks)?input.marks:[]){
    const m=cleanPlace(entry);
    if(!m||m.id==='home'||m.id==='spawn'||seen.has(m.id))continue;
    seen.add(m.id);marks.push(m);
    if(marks.length===MAX_PLACES)break;
  }
  return {home,marks};
}
// Fixed colors based on winter biome and altitude, shaded by elevation.
// No random texture or WebGL work in the map render loop.
export function winterMapColor(height,biome,variation=0){
  const h=Number.isFinite(height)?height:36;
  const n=clamp(Number.isFinite(variation)?variation:0,-1,1);
  let rgb;
  if(h<30||biome===5)rgb=[119,184,204];             // frozen ocean
  else if(biome===6)rgb=[229,244,246];               // snowy shoreline
  else if(h>=69||biome===4)rgb=[205,222,231];        // glacier ridge
  else if(h>=55)rgb=[228,239,243];                    // high snowfield
  else rgb=[211,232,234];                            // lowland frost
  const lift=clamp((h-36)*.26+n*6,-12,13);
  return '#'+rgb.map(v=>clamp(Math.round(v+lift),0,255).toString(16).padStart(2,'0')).join('');
}
