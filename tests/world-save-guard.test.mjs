import test from 'node:test';
import assert from 'node:assert/strict';
import {BACKUP_LIMIT,BACKUP_INTERVAL_MS,validateWorldSave,
  parseWorldSave,loadWorldSafely,saveWorldSafely,
  WORLD_BACKUP_FORMAT,WORLD_BACKUP_MAX_CHARS,
  exportWorldBackup,parseWorldBackup,importWorldBackup} from '../js/world-save-guard.js';

const sample=(hp=20)=>({seed:12345,
  player:{x:3.5,y:43,z:9.5,health:hp,inv:Array(36).fill(null)},
  edits:{'2147549184':[0,29,256,39,24575,0]},
  adventure:{level:31,storm:{clears:2},aurora:{clears:1},abyss:{clears:0}},
  containers:{},adv:[],played:1200});
function memoryStore(){
 const d=new Map();
 return {
  getItem:k=>d.has(k)?d.get(k):null,
  setItem(k,v){d.set(k,String(v));},
  removeItem(k){d.delete(k);},
  get keys(){return [...d.keys()];}
 };
}

test('validated world saves preserve full game state and all dungeon keys',()=>{
 const storage=memoryStore();
 assert.equal(saveWorldSafely(storage,'a',sample(20),10000),true);
 const {world,recovered}=loadWorldSafely(storage,'a');
 assert.equal(recovered,false);
 assert.equal(world.player.health,20);
 assert.equal(world.adventure.abyss.clears,0);
 assert.deepEqual(world.edits['2147549184'],[0,29,256,39,24575,0]);
 assert.equal(world.player.inv.length,36);
});
test('backup recovers from malformed primary without deleting the damaged data',()=>{
 const storage=memoryStore();
 saveWorldSafely(storage,'b',sample(15),10000);
 saveWorldSafely(storage,'b',sample(12),20000);
 assert.equal(storage.getItem('vc_world_b_backup')!==null,true);
 storage.setItem('vc_world_b','{not json');
 const recovered=loadWorldSafely(storage,'b');
 assert.equal(recovered.recovered,true);
 assert.equal(recovered.world.player.health,15);
 assert.equal(storage.getItem('vc_world_b'),'{not json');
});
test('repeated autosaves are throttled to avoid duplicating localStorage',()=>{
 const storage=memoryStore();
 saveWorldSafely(storage,'c',sample(20),10000);
 saveWorldSafely(storage,'c',sample(19),20000);
 assert.equal(JSON.parse(storage.getItem('vc_world_c_backup')).player.health,20);
 saveWorldSafely(storage,'c',sample(18),30000);
 assert.equal(JSON.parse(storage.getItem('vc_world_c_backup')).player.health,20);
 saveWorldSafely(storage,'c',sample(17),20000+BACKUP_INTERVAL_MS);
 assert.equal(JSON.parse(storage.getItem('vc_world_c_backup')).player.health,18);
 assert.equal(BACKUP_LIMIT,1200000);
});
test('backup is optional and quota failures never replace a valid primary',()=>{
 const storage=memoryStore();
 saveWorldSafely(storage,'d',sample(15),10000);
 let blocked=false;
 const quota={
  getItem:storage.getItem,
  removeItem:storage.removeItem,
  setItem(k,v){
    if(k.endsWith('_backup'))throw new Error('quota exceeded');
    storage.setItem(k,v);
  },
 };
 assert.equal(saveWorldSafely(quota,'d',sample(11),20000),true);
 assert.equal(loadWorldSafely(storage,'d').world.player.health,11);
});
test('malformed saves are rejected before any world blocks get changed',()=>{
 const invalid=[
  null,{}, {seed:4,player:{}}, {...sample(),edits:[]},
  {...sample(),player:{...sample().player,inv:Array(35).fill(null)}},
  {...sample(),player:{...sample().player,x:Infinity}},
  {...sample(),edits:{x:[0,1]}},
  {...sample(),edits:{1:[24576,1]}},
  {...sample(),edits:{1:[0,128]}},
  {...sample(),edits:{1:[0]}},
  JSON.parse('{"seed":1,"player":{"x":0,"y":10,"z":0,"inv":[], "__proto__":{}},"edits":{}}'),
 ];
 for(const world of invalid)assert.throws(()=>validateWorldSave(world));
 assert.throws(()=>parseWorldSave('{'),/SyntaxError|JSON/i);
 const storage=memoryStore();
 storage.setItem('vc_world_bad','malformed');
 assert.throws(()=>loadWorldSafely(storage,'bad'),/damaged/i);
});

test('portable export includes player inventory, castle progress, world edits and level',()=>{
 const storage=memoryStore();
 const state=sample(17);
 state.adventure.abyss.clears=3;
 state.adventure.castle={wins:5,bestTier:3};
 state.player.inv[0]={id:326,n:1,d:580};
 state.containers={'2,43,8':{type:'chest',slots:[{id:278,n:5}]}};
 saveWorldSafely(storage,'home',state,10000);
 const exportFile=exportWorldBackup(storage,'home',{name:'My Snow Castle',now:20000});
 const raw=JSON.parse(exportFile);
 assert.equal(raw.format,WORLD_BACKUP_FORMAT);
 assert.equal(raw.createdAt,20000);
 const parsed=parseWorldBackup(exportFile);
 assert.equal(parsed.name,'My Snow Castle');
 assert.equal(parsed.world.player.health,17);
 assert.equal(parsed.world.player.inv[0].id,326);
 assert.equal(parsed.world.adventure.abyss.clears,3);
 assert.equal(parsed.world.adventure.castle.wins,5);
 assert.deepEqual(parsed.world.containers,state.containers);
 assert.deepEqual(parsed.world.edits,state.edits);
});
test('restore creates a new save without overwriting original and can reopen it',()=>{
 const storage=memoryStore(),old=sample(12);
 saveWorldSafely(storage,'original',old,10000);
 const exportFile=exportWorldBackup(storage,'original',{name:'Old Castle'});
 const before=storage.getItem('vc_world_original');
 const imported=importWorldBackup(storage,'imported-1',exportFile);
 assert.equal(imported.id,'imported-1');
 assert.equal(imported.name,'Old Castle');
 assert.equal(storage.getItem('vc_world_original'),before);
 assert.equal(loadWorldSafely(storage,'imported-1').world.player.health,12);
 assert.throws(()=>importWorldBackup(storage,'original',exportFile),/never overwritten/);
 assert.equal(storage.getItem('vc_world_original'),before);
});
test('portable backup importer rejects malicious, oversized and unknown-format files',()=>{
 const storage=memoryStore();
 const ok=JSON.stringify({format:WORLD_BACKUP_FORMAT,name:'Valid',world:sample()});
 for(const input of [
  '{}',
  JSON.stringify({...JSON.parse(ok),format:'flurrycraft-wallet-private-key-v1'}),
  JSON.stringify({...JSON.parse(ok),world:{...sample(),edits:{1:[0,65535]}}}),
  'x'.repeat(WORLD_BACKUP_MAX_CHARS+1),
 ])assert.throws(()=>parseWorldBackup(input));
 assert.throws(()=>importWorldBackup(storage,'unsafe/slot',ok),/Invalid new world slot/);
 assert.equal(storage.keys.length,0,'invalid imports must not write anything');
});
test('can export a recovered world safely while retaining damaged primary',()=>{
 const storage=memoryStore();
 saveWorldSafely(storage,'recovery',sample(16),10000);
 saveWorldSafely(storage,'recovery',sample(10),20000);
 storage.setItem('vc_world_recovery','damaged primary');
 const payload=exportWorldBackup(storage,'recovery',{name:'Recovered World'});
 assert.equal(parseWorldBackup(payload).world.player.health,16);
 assert.equal(storage.getItem('vc_world_recovery'),'damaged primary');
});
