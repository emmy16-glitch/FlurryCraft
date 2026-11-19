// World-scoped, read-only-in-game exploration discoveries. Pure rules: only
// real terrain classifications, walked survey points, or visited built dungeons.
// Never issues XP, Flurry Points, SUI, NFT mints or external transactions.
export const MAX_SURVEY_POINTS=10;
export const MIN_SURVEY_SPACING=160;
export const MAX_JOURNAL_ENTRIES=18;
export const TERRAIN={
  3:{id:'biome:3',name:'Snowy Tundra',description:'Open winter plains'},
  4:{id:'biome:4',name:'Snowy Peaks',description:'High glacial ridges'},
  5:{id:'biome:5',name:'Frozen Sea',description:'Icy ocean crossing'},
  6:{id:'biome:6',name:'Ice Shore',description:'Where snow meets frozen water'}
};
export const DUNGEON_IDS=Object.freeze([
  'map-frost-ruins','map-stormspire','map-aurora','map-abyss'
]);
const finite=n=>Number.isFinite(n)&&Math.abs(n)<=1e6;
const isObj=v=>v&&typeof v==='object'&&!Array.isArray(v);
const point=v=>isObj(v)&&finite(v.x)&&finite(v.z)
  ?{x:Math.floor(v.x),z:Math.floor(v.z)}:null;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const VALID_ID=/^survey:-?\d+:-?\d+$/;
function sanitizeEntry(v){
  const p=point(v);if(!p||typeof v.id!=='string')return null;
  if(v.kind==='biome'){
    const config=Object.values(TERRAIN).find(x=>x.id===v.id);
    if(!config)return null;
    return {...p,id:config.id,name:config.name,kind:'biome'};
  }
  if(v.kind==='dungeon'){
    const id=v.id.replace(/^dungeon:/,'');
    if(!DUNGEON_IDS.includes(id)||v.id!=='dungeon:'+id)return null;
    // Names for visited dungeons come from the persisted genuine site label.
    const names={'map-frost-ruins':'Frost Ruins','map-stormspire':'Stormspire Keep',
      'map-aurora':'Aurora Citadel','map-abyss':'Frostbound Abyss'};
    return {...p,id:v.id,name:names[id],kind:'dungeon'};
  }
  if(v.kind==='survey'&&VALID_ID.test(v.id)){
    const cx=Math.floor(p.x/192),cz=Math.floor(p.z/192);
    if(v.id!==`survey:${cx}:${cz}`)return null;
    return {...p,id:v.id,name:'Trail Marker',kind:'survey'};
  }
  return null;
}
export function safeExplorerJournal(raw){
  const src=Array.isArray(raw?.entries)?raw.entries:[];
  const entries=[],ids=new Set();
  let surveyed=0;
  for(const item of src.slice(0,128)){
    const e=sanitizeEntry(item);
    if(!e||ids.has(e.id)||entries.length>=MAX_JOURNAL_ENTRIES)continue;
    if(e.kind==='survey'){
      if(surveyed>=MAX_SURVEY_POINTS||
        entries.some(p=>p.kind==='survey'&&distance(p,e)<MIN_SURVEY_SPACING))continue;
      surveyed++;
    }
    ids.add(e.id);entries.push(e);
  }
  return {version:1,entries};
}
export function journalStats(raw){
  const entries=safeExplorerJournal(raw).entries;
  return {terrain:entries.filter(p=>p.kind==='biome').length,
    dungeons:entries.filter(p=>p.kind==='dungeon').length,
    trails:entries.filter(p=>p.kind==='survey').length,
    total:entries.length};
}
export function visitExplorerLocation(raw,player,sample,dungeons=[]){
  const state=safeExplorerJournal(raw),added=[];
  const p=point(player);
  if(!p||!isObj(sample)||!Number.isInteger(sample.biome)||
     !finite(sample.h)||!player.onGround||player.flying||player.dead)
    return {state,added};
  // Standing on generated terrain (or frozen sea ice), not flying over a biome
  // or teleporting across a valley. A small tolerance permits shallow slopes.
  const surface=sample.biome===5?Math.max(31,sample.h+1):sample.h+1;
  if(!finite(player.y)||Math.abs(player.y-surface)>4)return {state,added};
  const ids=new Set(state.entries.map(e=>e.id));
  const add=e=>{
    if(ids.has(e.id)||state.entries.length>=MAX_JOURNAL_ENTRIES)return;
    ids.add(e.id);state.entries.push(e);added.push(e);
  };
  const terrain=TERRAIN[sample.biome];
  if(terrain)add({...p,id:terrain.id,name:terrain.name,kind:'biome'});
  const surveys=state.entries.filter(e=>e.kind==='survey');
  const cellX=Math.floor(p.x/192),cellZ=Math.floor(p.z/192);
  const id=`survey:${cellX}:${cellZ}`;
  if(surveys.length<MAX_SURVEY_POINTS&&
    !surveys.some(e=>distance(e,p)<MIN_SURVEY_SPACING)){
    add({...p,id,name:'Trail Marker',kind:'survey'});
  }
  if(Array.isArray(dungeons)){
    for(const site of dungeons.slice(0,4)){
      const here=point(site);
      if(!here||!DUNGEON_IDS.includes(site.id)||!site.built||
        distance(here,p)>20)continue;
      add({...here,id:'dungeon:'+site.id,name:site.name,kind:'dungeon'});
    }
  }
  return {state,added};
}
export function explorerMapPlaces(raw){
  return safeExplorerJournal(raw).entries.map(e=>({...e,
    detail:e.kind==='biome'?'Terrain discovered':
      e.kind==='dungeon'?'Entrance visited':'Trail surveyed'}));
}
