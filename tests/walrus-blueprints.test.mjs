import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {canonicalBytes} from '../js/sui-market-core.js';
import {
 WALRUS_TESTNET_AGGREGATOR,WALRUS_TESTNET_PUBLISHER,
 validateWalrusBlobId,walrusTestnetURL,walrusBlueprintReceipt,
 uploadWalrusBlueprint,fetchWalrusBlueprint,
} from '../js/walrus-blueprints.js';

const example={version:1,name:'Snowy Guard Tower',author:'Lofi Builder',
 size:[2,2,2],blocks:[[0,0,0,35],[0,1,0,29],[1,0,1,79]]};
const id='Q'.repeat(43);
test('Walrus Testnet blob IDs are strict and cannot be used for URL injection',()=>{
 assert.equal(validateWalrusBlobId(id),id);
 assert.equal(walrusTestnetURL(id),
  WALRUS_TESTNET_AGGREGATOR+'/v1/blobs/'+id);
 for(const bad of ['',id+'/',id+'.bad','http://evil', '../'+id,'A'.repeat(42)]){
   assert.throws(()=>validateWalrusBlobId(bad),/Walrus/);
 }
});
test('uploads use only canonical safe blueprint bytes and return a digest receipt',async()=>{
 let called=false;
 const response=await uploadWalrusBlueprint(example,{
  subtle:webcrypto.subtle,
  fetchImpl:async(url,opts)=>{
   called=true;
   assert.equal(url,WALRUS_TESTNET_PUBLISHER+'/v1/blobs?epochs=2&permanent=true');
   assert.equal(opts.method,'PUT');
   assert.equal(opts.headers['content-type'],'application/octet-stream');
   assert.deepEqual([...opts.body],[...canonicalBytes(example)]);
   return {ok:true,json:async()=>({newlyCreated:{blobObject:{blobId:id}}})};
  },
 });
 assert.equal(called,true);
 assert.equal(response.blobId,id);
 assert.equal(response.format,'flurrycraft-walrus-blueprint-v1');
 assert.match(response.digest,/^[a-f0-9]{64}$/);
 assert.equal(response.name,example.name);
});
test('can verify and restore the same public building without Sui wallet',async()=>{
 const bytes=canonicalBytes(example);
 const uploaded=await uploadWalrusBlueprint(example,{
  subtle:webcrypto.subtle,
  fetchImpl:async()=>({ok:true,json:async()=>({alreadyCertified:{blobId:id}})}),
 });
 const fetched=await fetchWalrusBlueprint(uploaded,{
  subtle:webcrypto.subtle,
  fetchImpl:async(url,opts)=>{
   assert.equal(url,walrusTestnetURL(id));
   assert.equal(opts.method,'GET');
   return {ok:true,headers:{get:k=>k==='content-length'?String(bytes.length):null},
    arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};
  },
 });
 assert.equal(fetched.blueprint.name,example.name);
 assert.equal(fetched.blueprint.author,example.author);
 assert.deepEqual(fetched.blueprint.blocks,
  [...example.blocks].sort((a,b)=>a[1]-b[1]||a[2]-b[2]||a[0]-b[0]));
 assert.equal(fetched.digest,uploaded.digest);
});
test('untrusted publisher, tampered content and huge Walrus responses fail closed',async()=>{
 const uploaded=await uploadWalrusBlueprint(example,{
  subtle:webcrypto.subtle,
  fetchImpl:async()=>({ok:true,json:async()=>({newlyCreated:{blobObject:{blobId:id}}})}),
 });
 await assert.rejects(()=>fetchWalrusBlueprint(uploaded,{
  subtle:webcrypto.subtle,
  fetchImpl:async()=>({ok:true,headers:{get:()=>null},
   arrayBuffer:async()=>new TextEncoder().encode('evil').buffer}),
 }),/SHA-256/);
 await assert.rejects(()=>fetchWalrusBlueprint(id,{
  subtle:webcrypto.subtle,
  fetchImpl:async()=>({ok:true,headers:{get:()=>String(24001)}}),
 }),/24 KB/);
 await assert.rejects(()=>uploadWalrusBlueprint(example,{
  subtle:webcrypto.subtle,
  fetchImpl:async()=>({ok:false,status:503}),
 }),/HTTP 503/);
});
test('only explicit well-formed Testnet verification receipts are accepted',()=>{
 assert.deepEqual(
  walrusBlueprintReceipt({format:'flurrycraft-walrus-blueprint-v1',blobId:id,
    digest:'a'.repeat(64),name:'Snow Cabin',author:'Yeti'}),
  {format:'flurrycraft-walrus-blueprint-v1',network:'testnet',
   blobId:id,digest:'a'.repeat(64),name:'Snow Cabin',author:'Yeti'});
 assert.throws(()=>walrusBlueprintReceipt({format:'other',blobId:id}),/receipt/);
 assert.throws(()=>walrusBlueprintReceipt({
  format:'flurrycraft-walrus-blueprint-v1',network:'mainnet',
  blobId:id,digest:'a'.repeat(64)
 }),/not for Testnet/);
 assert.throws(()=>walrusBlueprintReceipt({format:'flurrycraft-walrus-blueprint-v1',
  blobId:id,digest:'invalid'}),/SHA-256/);
});
