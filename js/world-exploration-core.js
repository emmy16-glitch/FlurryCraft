// Seed-local exploration discoveries. Every marker comes from a real loaded
// world feature: exposed cave geometry, generated chest metadata or living mobs.
export const MAX_WORLD_DISCOVERIES=48;
export const CAVE_SCAN_RADIUS=104;
export const CAVE_REVEAL_RADIUS=36;
export const LOOT_REVEAL_RADIUS=54;
export const TERRITORY_REVEAL_RADIUS=58;
export const TERRITORY_RADIUS=38;
const TYPES=new Set(['cave','crypt','treasure','territory']);
const ID=/^(?:cave|crypt|treasure|territory):[a-z0-9:_-]{1,112}$/i;
const finite=n=>Number.isFinite(n)&&Math.abs(n)<1000000;
const pos=v=>v&&finite(v.x)&&finite(v.z)?{x:Math.floor(v.x),z:Math.floor(v.z)}:null;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const names=Object.freeze({
 frostling:'Frostling',snow_prowler:'Snow Prowler',
 glacier_guardian:'Glacier Guardian',storm_hound:'Storm Hound',
 rime_knight:'Rime Knight',blizzard_titan:'Blizzard Titan',
 aurora_wisp:'Aurora Wisp',prism_stalker:'Prism Stalker',
 boreal_sovereign:'Boreal Sovereign',rift_stalker:'Rift Stalker',
 umbral_sentinel:'Umbral Sentinel',abyss_keeper:'Abyss Keeper',
 zombie:'Zombie',skeleton:'Skeleton',creeper:'Creeper',spider:'Spider'
});
function cleanDiscovery(v){
  const p=pos(v);
  if(!p||typeof v.id!=='string'||!ID.test(v.id)||
     !TYPES.has(v.kind))return null;
  const name=String(v.name||'Discovery').replace(/[<>]/g,'').trim().slice(0,40);
  const detail=String(v.detail||'Explored location').replace(/[<>]/g,'').trim().slice(0,100);
  const radius=Number.isFinite(v.radius)?Math.max(0,Math.min(120,Math.floor(v.radius))):0;
  return {id:v.id,kind:v.kind,name:name||'Discovery',detail:detail||'Explored location',
    x:p.x,z:p.z,radius};
}
export function safeWorldExploration(raw){
  const discoveries=[],seen=new Set();
  const src=Array.isArray(raw?.discoveries)?raw.discoveries.slice(0,128):[];
  for(const item of src){
    const clean=cleanDiscovery(item);
    if(!clean||seen.has(clean.id)||discoveries.length>=MAX_WORLD_DISCOVERIES)continue;
    seen.add(clean.id);discoveries.push(clean);
  }
  return {version:1,discoveries};
}
export function recordWorldDiscovery(raw,candidate){
  const state=safeWorldExploration(raw),entry=cleanDiscovery(candidate);
  if(!entry||state.discoveries.some(v=>v.id===entry.id)||
     state.discoveries.length>=MAX_WORLD_DISCOVERIES)
    return {state,first:false};
  state.discoveries.push(entry);
  return {state,first:true,entry};
}
export function worldDiscoveryStats(raw){
  const entries=safeWorldExploration(raw).discoveries;
  return {caves:entries.filter(v=>v.kind==='cave').length,
    crypts:entries.filter(v=>v.kind==='crypt').length,
    treasures:entries.filter(v=>v.kind==='treasure').length,
    territories:entries.filter(v=>v.kind==='territory').length,
    total:entries.length};
}

// A cave marker is only returned when a loaded chunk contains a genuine
// exposed opening: four clear vertical air cells, a solid floor, and at least
// two raised solid sides. This deliberately ignores unseen/unloaded terrain.
export function scanCaveEntrances(world,player,solid){
  const p=pos(player);if(!p||!world?.chunks||!solid)return [];
  const found=[];
  for(const chunk of world.chunks.values()){
    if(!chunk?.blocks||!chunk?.hm||!chunk?.light)continue;
    const cx=chunk.cx*16,cz=chunk.cz*16;
    if(Math.hypot(cx+8-p.x,cz+8-p.z)>CAVE_SCAN_RADIUS+12)continue;
    const blocks=chunk.blocks,hm=chunk.hm,light=chunk.light;
    for(let z=1;z<15;z++)for(let x=1;x<15;x++){
      const i=x+(z<<4),floor=hm[i];
      if(floor<32||floor>87||floor+5>=96)continue;
      const at=(y)=>i+(y<<8);
      if(!solid[blocks[at(floor)]])continue;
      let open=true;
      for(let y=floor+1;y<=floor+4;y++)if(blocks[at(y)]!==0){open=false;break;}
      if(!open||(light[at(floor+1)]>>4)<8)continue;
      let walls=0;
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const ni=(x+dx)+((z+dz)<<4),neighbor=hm[ni];
        if(neighbor<floor+4)continue;
        if(solid[blocks[ni+((floor+1)<<8)]])walls++;
      }
      if(walls<2)continue;
      const candidate={id:'cave:'+chunk.cx+':'+chunk.cz+':'+x+':'+z,
        kind:'cave',name:'Natural Cave Mouth',
        detail:'Exposed cave opening · inspect the drop before entering',
        x:cx+x,z:cz+z,radius:0};
      if(dist(candidate,p)>CAVE_REVEAL_RADIUS)continue;
      if(found.some(v=>dist(v,candidate)<9))continue;
      found.push(candidate);
    }
  }
  return found.sort((a,b)=>dist(a,p)-dist(b,p)).slice(0,8);
}

// Chunk loot is created by the actual world generator. Metadata only describes
// where its existing chest/shaft is; it never creates, moves or grants loot.
export function scanGeneratedLoot(world,player){
  const p=pos(player);if(!p||!world?.chunks)return [];
  const found=[],seen=new Set();
  for(const chunk of world.chunks.values()){
    if(!Array.isArray(chunk?.loot))continue;
    for(const loot of chunk.loot){
      const entrance=pos(loot.entrance||loot);
      if(!entrance||dist(entrance,p)>LOOT_REVEAL_RADIUS)continue;
      if(loot.kind==='cabin'&&typeof loot.siteId==='string'){
        const id='treasure:'+loot.siteId;
        if(seen.has(id))continue;seen.add(id);
        found.push({id,kind:'treasure',name:'Abandoned Cabin Cache',
          detail:'Real cabin chest · contents remain in the world chest',
          x:loot.x,z:loot.z,radius:0});
      }else if(loot.kind==='crypt'&&typeof loot.siteId==='string'){
        const cryptId=loot.siteId;
        const dungeonId=cryptId;
        if(!seen.has(dungeonId)){
          seen.add(dungeonId);
          found.push({id:dungeonId,kind:'crypt',name:'Buried Crypt',
            detail:'Hidden underground chamber · follow the marked water shaft',
            x:entrance.x,z:entrance.z,radius:0});
        }
        const chestId='treasure:'+cryptId+':'+String(loot.chestIndex??0);
        if(!seen.has(chestId)){
          seen.add(chestId);
          found.push({id:chestId,kind:'treasure',name:'Crypt Treasure Chest',
            detail:'Existing chest inside the discovered Buried Crypt',
            x:loot.x,z:loot.z,radius:0});
        }
      }
    }
  }
  return found;
}
export function scanMonsterTerritories(mobs,player){
  const p=pos(player);if(!p||!Array.isArray(mobs))return [];
  const groups=new Map();
  for(let i=0;i<mobs.length&&i<240;i++){
    const mob=mobs[i],where=pos(mob);
    if(!where||!mob?.sp||mob.sp.passive||mob.dead||mob.deadT>0||
      typeof mob.kind!=='string'||!names[mob.kind])continue;
    if(dist(where,p)>CAVE_SCAN_RADIUS)continue;
    const gx=Math.floor(where.x/72),gz=Math.floor(where.z/72);
    const key=mob.kind+':'+gx+':'+gz;
    if(!groups.has(key))groups.set(key,{kind:mob.kind,gx,gz,mobs:[]});
    groups.get(key).mobs.push(where);
  }
  const found=[];
  for(const group of groups.values()){
    if(group.mobs.length<2)continue;
    const center={x:group.mobs.reduce((n,v)=>n+v.x,0)/group.mobs.length,
      z:group.mobs.reduce((n,v)=>n+v.z,0)/group.mobs.length};
    if(dist(center,p)>TERRITORY_REVEAL_RADIUS)continue;
    found.push({id:'territory:'+group.kind+':'+group.gx+':'+group.gz,
      kind:'territory',name:names[group.kind]+' Territory',
      detail:'Approximate roaming zone · confirmed by multiple live hostiles',
      x:Math.round(center.x),z:Math.round(center.z),radius:TERRITORY_RADIUS});
  }
  return found.sort((a,b)=>dist(a,p)-dist(b,p)).slice(0,6);
}
export function discoveredWorldPlaces(raw){
  return safeWorldExploration(raw).discoveries.map(v=>({...v}));
}
