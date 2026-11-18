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
    for(let i=0;i<coords.length;i++){
      const n=coords[i];
      if(!Number.isInteger(n)||n<0||n>65535)
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
