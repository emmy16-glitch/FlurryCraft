import test from 'node:test';
import assert from 'node:assert/strict';
import {EditHistory} from '../js/edit-history.js';

function world(){
 const cells=new Map(),loaded=()=>true;
 return {
  loaded,
  getBlock(x,y,z){return cells.get(x+','+y+','+z)||0;},
  setBlock(x,y,z,id){
   const key=x+','+y+','+z;
   if(this.getBlock(x,y,z)===id)return false;
   if(id)cells.set(key,id);else cells.delete(key);
   return true;
  },
 };
}
test('a player edit can be undone and redone without resetting the world',()=>{
 const w=world(),h=new EditHistory();
 h.begin(w,'Place');assert.equal(w.setBlock(4,8,4,25),true);
 h.record(w,4,8,4,0,25);assert.deepEqual(h.finish(),{ok:true,count:1});
 assert.equal(h.canUndo,true);assert.equal(h.canRedo,false);
 assert.deepEqual(h.undo(w),{ok:true,count:1,label:'Place'});
 assert.equal(w.getBlock(4,8,4),0);
 assert.equal(h.canRedo,true);
 assert.deepEqual(h.redo(w),{ok:true,count:1,label:'Place'});
 assert.equal(w.getBlock(4,8,4),25);
});
test('many mutations of one cell coalesce and no-op edits are ignored',()=>{
 const w=world(),h=new EditHistory();
 h.begin(w,'Door');w.setBlock(0,0,0,72);h.record(w,0,0,0,0,72);
 w.setBlock(0,0,0,73);h.record(w,0,0,0,72,73);
 assert.equal(h.finish().count,1);
 h.undo(w);assert.equal(w.getBlock(0,0,0),0);
 h.redo(w);assert.equal(w.getBlock(0,0,0),73);
 h.begin(w,'No change');h.record(w,2,0,0,0,15);h.record(w,2,0,0,15,0);
 assert.deepEqual(h.finish(),{ok:false,reason:'empty'});
});
test('undo refuses overwrites when someone edited the area afterward',()=>{
 const w=world(),h=new EditHistory();
 w.setBlock(2,4,2,14);h.push(w,'Building',[[2,4,2,0,14]]);
 w.setBlock(2,4,2,99);
 assert.equal(h.undo(w).reason,'changed');
 assert.equal(w.getBlock(2,4,2),99);
});
test('undo is atomic when an edited block would overlap player or be blocked',()=>{
 const w=world(),h=new EditHistory();
 w.setBlock(0,1,0,13);w.setBlock(1,1,0,13);
 h.push(w,'Wall',[[0,1,0,0,13],[1,1,0,0,13]]);
 assert.equal(h.undo(w,()=>false).reason,'blocked');
 assert.equal(w.getBlock(0,1,0),13);
 assert.equal(w.getBlock(1,1,0),13);
});
test('fresh edits invalidate redo and bounded history is capped',()=>{
 const w=world(),h=new EditHistory({maxSteps:2});
 for(let i=0;i<3;i++){w.setBlock(i,2,0,14);h.push(w,'Place',[[i,2,0,0,14]]);}
 assert.equal(h.undoStack.length,2);
 h.undo(w);assert.equal(h.canRedo,true);
 w.setBlock(9,2,0,15);h.push(w,'New edit',[[9,2,0,0,15]]);
 assert.equal(h.canRedo,false);
 const w2=world();h.reset(w2);assert.equal(h.canUndo,false);
});
test('rejects oversized and malformed history without modifying world',()=>{
 const w=world(),h=new EditHistory({maxCells:2});
 assert.equal(h.push(w,'Too many',[[0,0,0,0,1],[1,0,0,0,1],[2,0,0,0,1]]).reason,'too_large');
 h.begin(w);for(let i=0;i<3;i++)h.record(w,i,0,0,0,1);
 assert.equal(h.finish().reason,'too_large');
 assert.equal(h.canUndo,false);
 assert.equal(h.push(w,'Invalid',[[1,2,3,4]]).reason,'invalid');
});
