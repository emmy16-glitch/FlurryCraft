// FlurryCraft local world-save safety helpers.
// Never upload, reset, or silently replace player worlds.
// Browser localStorage is still the source of truth. Backup is best-effort.
export const BACKUP_LIMIT=1200000; // characters; don't double enormous worlds
export const BACKUP_INTERVAL_MS=3*60*1000;
const backedUpAt=new Map();
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const isObj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);

export function validateWorldSave(data){
  if(!isObj(data)||!Number.isFinite(data.seed))throw new Error('World save has no valid seed');
  if(!isObj(data.player)||!Array.isArray(data.player.inv)||
     data.player.inv.length!==36)throw new Error('World save has no valid player inventory');
  const p=data.player;
  if(![p.x,p.y,p.z].every(Number.isFinite))throw new Error('World player coordinates are invalid');
  if(!isObj(data.edits))throw new Error('World block edits are invalid');
  if(own(data,'__proto__')||own(p,'__proto__')||own(data.edits,'__proto__'))
    throw new Error('Invalid reserved property in world save');
  // The game's world loader iterates values in pairs; reject malformed edits
  // before writing any of them back to the voxel world.
  const keys=Object.keys(data.edits);
  if(keys.length>200000)throw new Error('World has too many edited chunks');
  for(const key of keys){
    const coords=data.edits[key];
    if(!/^-?\d+$/.test(key)||!Array.isArray(coords)||coords.length%2!==0)
      throw new Error('Malformed block edits in saved world');
    if(coords.length>50000)throw new Error('Invalid oversized chunk edit list');
    for(let i=0;i<coords.length;i+=2){
      const cell=coords[i],block=coords[i+1];
      if(!Number.isInteger(cell)||cell<0||cell>=16*16*96||
         !Number.isInteger(block)||block<0||block>=128)
        throw new Error('Invalid block edit entry in saved world');
    }
  }
  return data;
}

export function parseWorldSave(raw){
  if(typeof raw!=='string'||!raw.length)throw new Error('No saved world');
  return validateWorldSave(JSON.parse(raw));
}

export function loadWorldSafely(storage,id){
  const key='vc_world_'+id;
  const raw=storage.getItem(key);
  if(!raw)return {world:null,recovered:false};
  try{return {world:parseWorldSave(raw),recovered:false};}
  catch(error){
    const backup=storage.getItem(key+'_backup');
    if(!backup)throw new Error('Save is damaged and no backup is available: '+error.message);
    try{return {world:parseWorldSave(backup),recovered:true};}
    catch{throw new Error('Both the world save and backup are damaged');}
  }
}

export function saveWorldSafely(storage,id,world,now=Date.now()){
  const key='vc_world_'+id;
  validateWorldSave(world);
  const serialized=JSON.stringify(world);
  // A backup is optional; lack of space must not prevent primary world saving.
  const last=backedUpAt.get(key)??-Infinity;
  if(now-last>=BACKUP_INTERVAL_MS){
    let prior=null;
    try{prior=storage.getItem(key);}catch{}
    if(prior&&prior.length<=BACKUP_LIMIT){
      try{
        parseWorldSave(prior);
        storage.setItem(key+'_backup',prior);
        backedUpAt.set(key,now);
      }catch{
        // Invalid previous saves are never copied into the backup.
      }
    }
  }
  try{storage.setItem(key,serialized);}
  catch(error){
    // The optional backup may have filled quota. Remove only the backup and
    // retry writing the authoritative save; never delete the primary file.
    try{
      storage.removeItem(key+'_backup');
      storage.setItem(key,serialized);
    }catch{throw error;}
  }
  return true;
}


// Portable backup files contain actual world data, not wallet credentials.
// Import always creates a fresh world ID to avoid overwriting an older save.
export const WORLD_BACKUP_FORMAT='flurrycraft-world-backup-v1';
export const WORLD_BACKUP_MAX_CHARS=20_000_000;
export function exportWorldBackup(storage,id,{name='Snow World',now=Date.now()}={}){
  const {world}=loadWorldSafely(storage,id);
  if(!world)throw new Error('No world exists in that save slot.');
  const backup={
    format:WORLD_BACKUP_FORMAT,
    name:String(name||'Snow World').trim().slice(0,60)||'Snow World',
    createdAt:Number.isFinite(now)?now:Date.now(),
    world
  };
  const raw=JSON.stringify(backup);
  if(raw.length>WORLD_BACKUP_MAX_CHARS)
    throw new Error('World exceeds the 20 MB portable-backup limit.');
  return raw;
}
export function parseWorldBackup(raw){
  if(typeof raw!=='string'||!raw||raw.length>WORLD_BACKUP_MAX_CHARS)
    throw new Error('World backup must be a JSON file smaller than 20 MB.');
  const obj=JSON.parse(raw);
  if(!isObj(obj)||obj.format!==WORLD_BACKUP_FORMAT)
    throw new Error('Not a recognized FlurryCraft world backup.');
  const world=validateWorldSave(obj.world);
  return {name:String(obj.name||'Imported Snow World').trim().slice(0,60)||
    'Imported Snow World',world};
}
export function importWorldBackup(storage,newId,raw){
  if(!/^[A-Za-z0-9_-]{1,64}$/.test(String(newId)))
    throw new Error('Invalid new world slot ID.');
  const key='vc_world_'+newId;
  if(storage.getItem(key)!==null)
    throw new Error('World slot already exists. Existing worlds are never overwritten.');
  const result=parseWorldBackup(raw);
  const serialized=JSON.stringify(result.world);
  storage.setItem(key,serialized);
  return {id:newId,name:result.name,world:result.world};
}
