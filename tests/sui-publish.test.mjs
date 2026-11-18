import test from 'node:test';
import assert from 'node:assert/strict';
import {PUBLISH_FORMAT,MAX_PUBLISH_BYTES,validatePublishManifest}
  from '../js/sui-publish-core.js';

const sample=()=>({
  format:PUBLISH_FORMAT,network:'testnet',
  packageName:'flurrycraft',sourceRevision:'a'.repeat(40),
  modules:['A'.repeat(32)+'=='],dependencies:['0x2','0x1'],
  digest:Array(32).fill(0x42),
});
test('CI bytecode manifest is valid only for FlurryCraft Testnet',()=>{
  const m=validatePublishManifest(sample());
  assert.equal(m.network,'testnet');
  assert.equal(m.sourceRevision,'a'.repeat(40));
  assert.equal(m.modules.length,1);
  assert.deepEqual(m.dependencies,['0x2','0x1']);
  assert.equal(m.digest.length,32);
  assert.ok(m.byteLength>0);
  assert.ok(m.byteLength<MAX_PUBLISH_BYTES);
});
test('never accept arbitrary remote networks, package names or missing source SHA',()=>{
  for(const [key,value] of [
    ['network','mainnet'],['network','devnet'],
    ['format','wallet-private-key-v1'],['packageName','malicious'],
    ['sourceRevision','unknown'],['sourceRevision','0x1234'],
  ]){
    assert.throws(()=>validatePublishManifest({...sample(),[key]:value}));
  }
  assert.throws(()=>validatePublishManifest(null),/approved/);
  assert.throws(()=>validatePublishManifest([]),/approved/);
});
test('reject oversized, invalid, missing or suspicious module bytes',()=>{
  for(const modules of [
    [],[''],[0],['../../x'],['C'.repeat(800004)],new Array(13).fill('A'.repeat(64)),
    ['AAAA='],['abcd%2F'],['abcd<script>alert(1)</script>']
  ])assert.throws(()=>validatePublishManifest({...sample(),modules}));
});
test('reject malformed dependency IDs, missing digest and invalid byte ranges',()=>{
 for(const dependencies of [[],['https://evil.example'],['0xzz'],['0x'+'0'.repeat(65)],new Array(51).fill('0x2')])
  assert.throws(()=>validatePublishManifest({...sample(),dependencies}));
 for(const digest of [null,[],new Array(31).fill(0),new Array(32).fill(256),new Array(32).fill(0.5)])
  assert.throws(()=>validatePublishManifest({...sample(),digest}));
});
test('the compiled bytecode payload is not a wallet key or a connected package',()=>{
 const m=validatePublishManifest(sample());
 assert.equal(m.packageId,undefined);
 assert.equal(m.privateKey,undefined);
 assert.equal(m.signature,undefined);
});
