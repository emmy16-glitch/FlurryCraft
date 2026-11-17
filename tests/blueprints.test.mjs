import test from 'node:test';
import assert from 'node:assert/strict';
import { rotatedSize, rotateXZ, selectionBounds } from '../js/blueprints.js';
test('rotate four times returns to original positions',()=>{
 const size=[8,5,6];
 for(let x=0;x<size[0];x++)for(let z=0;z<size[2];z++){
  const a=rotateXZ(x,z,size,1);
  const b=rotateXZ(a[0],a[1],rotatedSize(size,1),1);
  const c=rotateXZ(b[0],b[1],rotatedSize(size,2),1);
  const d=rotateXZ(c[0],c[1],rotatedSize(size,3),1);
  assert.deepEqual(d,[x,z]);
 }
});
test('rotation preserves every unique voxel location and swaps axes',()=>{
 const size=[8,4,6];
 assert.deepEqual(rotatedSize(size,1),[6,4,8]);
 for(let turn=0;turn<4;turn++){
  const n=rotatedSize(size,turn),set=new Set();
  for(let x=0;x<size[0];x++)for(let z=0;z<size[2];z++){
   const p=rotateXZ(x,z,size,turn);
   assert.ok(p[0]>=0&&p[0]<n[0]&&p[1]>=0&&p[1]<n[2]);
   set.add(p.join(','));
  }
  assert.equal(set.size,size[0]*size[2]);
 }
});
test('two corners capture inclusive bounds within limits',()=>{
 assert.deepEqual(selectionBounds({x:10,y:7,z:6},{x:4,y:3,z:1}),{min:[4,3,1],size:[7,5,6]});
 assert.throws(()=>selectionBounds({x:0,y:0,z:0},{x:32,y:0,z:0}),/32 blocks/);
 assert.throws(()=>selectionBounds({x:0,y:96,z:0},{x:0,y:96,z:0}),/world height/);
});
