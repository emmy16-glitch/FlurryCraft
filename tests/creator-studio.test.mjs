import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import {
 normalizeBlueprint, canonicalBlueprintContent, blueprintFingerprint,
 blueprintSummary, downloadName, makeStarterBlueprints, MAX_BLUEPRINT_BLOCKS
} from '../js/creator-studio.js';

const sample={version:1,name:'A House',author:'Builder One',size:[3,2,3],
 blocks:[[2,0,0,38],[0,0,0,19],[0,1,2,17],[0,0,2,38]]};

test('blueprints normalize with a deterministic order and metadata cleanup',()=>{
 const result=normalizeBlueprint(sample);
 assert.deepEqual(result.blocks,[[0,0,0,19],[0,0,2,38],[2,0,0,38],[0,1,2,17]]);
 assert.equal(result.name,'A House');
 assert.deepEqual(result.size,[3,2,3]);
 assert.notStrictEqual(result.blocks,sample.blocks);
});

test('identical block geometry has identical canonical content and SHA-256',async()=>{
 const a=normalizeBlueprint(sample);
 const b={...a,name:'Different title',author:'Someone Else',blocks:[...a.blocks].reverse()};
 assert.equal(canonicalBlueprintContent(a),canonicalBlueprintContent(b));
 const hash=await blueprintFingerprint(a,webcrypto.subtle);
 assert.match(hash,/^[a-f0-9]{64}$/);
 assert.equal(hash,await blueprintFingerprint(b,webcrypto.subtle));
 const modified={...a,blocks:a.blocks.map((v,i)=>i? v : [v[0],v[1],v[2],27])};
 assert.notEqual(hash,await blueprintFingerprint(modified,webcrypto.subtle));
});

test('invalid sizes, duplicates and out-of-range blocks are rejected',()=>{
 assert.throws(()=>normalizeBlueprint({...sample,version:2}),/Unrecognized/);
 assert.throws(()=>normalizeBlueprint({...sample,size:[33,2,3]}),/dimensions/);
 assert.throws(()=>normalizeBlueprint({...sample,blocks:[[0,0,0,38],[0,0,0,19]]}),/overlapping/);
 assert.throws(()=>normalizeBlueprint({...sample,blocks:[[100,0,0,38]]}),/unsafe/);
 assert.throws(()=>normalizeBlueprint({...sample,blocks:[[0,0,0,999]]}),/unsafe/);
 assert.throws(()=>normalizeBlueprint({...sample,blocks:[[0,0,0,0]]}),/unsafe/);
 assert.throws(()=>normalizeBlueprint({...sample,blocks:[]}),/1–6,000/);
 assert.throws(()=>normalizeBlueprint({...sample,blocks:Array(MAX_BLUEPRINT_BLOCKS+1).fill([0,0,0,38])}),/1–6,000/);
});

test('summaries and file names are safe for the creator gallery',()=>{
 const summary=blueprintSummary(sample);
 assert.equal(summary.blockCount,4);
 assert.equal(summary.materialCount,3);
 assert.equal(summary.dominantId,38);
 assert.equal(summary.dimensions,'3 × 2 × 3');
 assert.equal(downloadName('Ice Castle: My #1?'),'flurrycraft-ice-castle-my-1.json');
 assert.equal(downloadName('../../'), 'flurrycraft-creation.json');
});

const blocks={
 SPRUCE_PLANKS:38,SNOW:17,DOOR_CLOSED:72,WINDOW_PANE:78,
 WOOD_TABLE:74,WOOD_CHAIR:75,FIREPLACE:77,COZY_BED:76,
 STONE_BRICKS:35,ICE:29,CRAFTING:20
};
test('starter designs are fully normalized, unique and importable',()=>{
 const builds=makeStarterBlueprints(blocks);
 assert.equal(builds.length,2);
 for(const blueprint of builds){
  assert.ok(blueprint.blocks.length>100);
  assert.ok(blueprint.size.every(n=>n<=32));
  assert.doesNotThrow(()=>normalizeBlueprint(blueprint));
  const coords=new Set(blueprint.blocks.map(([x,y,z])=>x+','+y+','+z));
  assert.equal(coords.size,blueprint.blocks.length);
  const doors=blueprint.blocks.filter(block=>block[3]===72);
  assert.equal(doors.length,2,'door is a two-block-high opening');
  assert.ok(doors.some(d=>d[1]===1));
  assert.ok(doors.some(d=>d[1]===2));
 }
});
