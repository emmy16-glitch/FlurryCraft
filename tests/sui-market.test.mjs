import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { packageId,toMist,fromMist,canonicalBytes,parseOnchainContent,hashBytes,MAX_CONTENT_BYTES } from '../js/sui-market-core.js';
import { canonicalBlueprintContent,makeStarterBlueprints } from '../js/creator-studio.js';

const sample={version:1,name:'Snow Cabin',author:'Creator',size:[3,2,3],
  blocks:[[0,0,0,38],[1,0,0,38],[0,1,0,19],[2,0,2,17]]};

test('only valid 32-byte Sui package IDs can authorize transactions',()=>{
  assert.equal(packageId(''),null);
  assert.equal(packageId('0x1234'),null);
  assert.equal(packageId('0x'+'0'.repeat(64)),null);
  assert.equal(packageId('0x'+'f'.repeat(64)),'0x'+'f'.repeat(64));
});

test('exact decimal SUI amounts produce integer MIST with no float rounding',()=>{
  assert.equal(toMist('0.000000001'),1n);
  assert.equal(toMist('0.1'),100000000n);
  assert.equal(toMist('1'),1000000000n);
  assert.equal(toMist('3.123456789'),3123456789n);
  assert.equal(fromMist(3123456789n),'3.123456789');
  assert.equal(fromMist(100000000n),'0.1');
  for(const invalid of ['0','0.000000000','1e6','-1','1.0000000001','1.2.3','NaN','999999999999999999999']){
    assert.throws(()=>toMist(invalid),/price|Price/);
  }
});

test('NFT geometry round-trips into a playable canonical blueprint',async()=>{
  const bytes=canonicalBytes(sample);
  assert.equal(new TextDecoder().decode(bytes),canonicalBlueprintContent(sample));
  const parsed=parseOnchainContent(bytes,'Onchain Name','0x1234');
  assert.equal(parsed.name,'Onchain Name');
  assert.equal(parsed.author,'0x1234');
  assert.deepEqual(parsed.size,sample.size);
  assert.deepEqual(parsed.blocks,[...sample.blocks].sort((a,b)=>a[1]-b[1]||a[2]-b[2]||a[0]-b[0]));
  assert.match(await hashBytes(bytes,webcrypto.subtle),/^[a-f0-9]{64}$/);
});

test('reject noncanonical, unsafe, oversized and invalid NFT geometry',()=>{
  const canonical=new TextEncoder().encode(canonicalBlueprintContent(sample));
  assert.throws(()=>parseOnchainContent(new TextEncoder().encode('{"hello":"world"}'),'a','b'),/FlurryCraft geometry/);
  assert.throws(()=>parseOnchainContent(new TextEncoder().encode('["FlurryCraft:voxel-blueprint:v1",[2,1,2],[[0,0,0,38],[0,0,0,38]]]'),'a','b'),/overlapping/);
  const padded=new TextEncoder().encode(new TextDecoder().decode(canonical)+' ');
  assert.throws(()=>parseOnchainContent(padded,'a','b'),/not canonically encoded/);
  assert.throws(()=>canonicalBytes({...sample,blocks:[[0,0,0,10]]}),/unsafe/);
  assert.throws(()=>parseOnchainContent(new TextEncoder().encode('["FlurryCraft:voxel-blueprint:v1",[1,1,1],[[0,0,0,12]]]'),'a','b'),/unsafe/);
  const big=makeStarterBlueprints({
    SPRUCE_PLANKS:38,SNOW:17,DOOR_CLOSED:72,WINDOW_PANE:78,
    WOOD_TABLE:74,WOOD_CHAIR:75,FIREPLACE:77,COZY_BED:76,
    STONE_BRICKS:35,ICE:29,CRAFTING:20
  })[0];
  assert.ok(canonicalBytes(big).length<MAX_CONTENT_BYTES);
  const huge={version:1,name:'Big',author:'Tester',size:[32,10,32],blocks:[]};
  for(let y=0;y<5;y++)for(let x=0;x<32;x++)for(let z=0;z<32;z++)huge.blocks.push([x,y,z,38]);
  assert.throws(()=>canonicalBytes(huge),/24 KB limit/);
});
