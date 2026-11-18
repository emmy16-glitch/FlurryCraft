import test from 'node:test';
import assert from 'node:assert/strict';
import {successfulSuiDigest,boundedSuiBcs,
 SUI_NFT_BCS_MAX_BYTES,SUI_LISTING_BCS_MAX_BYTES} from '../js/sui-response-guard.js';

test('Sui transaction guard requires successful onchain status and a real digest',()=>{
 const digest='A'.repeat(44);
 assert.equal(successfulSuiDigest({Transaction:{digest,status:{success:true}}}),digest);
 for(const result of [
   null,{}, {Transaction:{digest}},
   {Transaction:{digest,status:{success:false}}},
   {Transaction:{digest:'',status:{success:true}}},
   {$kind:'FailedTransaction'},
   {FailedTransaction:{status:{error:{message:'Move aborted'}}}},
 ]){
   assert.throws(()=>successfulSuiDigest(result),/Sui Testnet|Move aborted/);
 }
});
test('Sui BCS reader accepts both direct bytes and asynchronous transport bytes',async()=>{
 const bytes=new Uint8Array([1,2,3,4]);
 assert.deepEqual(await boundedSuiBcs(bytes),bytes);
 assert.deepEqual(await boundedSuiBcs(Promise.resolve(bytes)),bytes);
 assert.deepEqual(await boundedSuiBcs(bytes.buffer),bytes);
 const padded=new Uint8Array([20,1,2,3,20]);
 assert.deepEqual(await boundedSuiBcs(padded.subarray(1,4)),new Uint8Array([1,2,3]));
});
test('Sui BCS size caps reject malicious responses before parsing',async()=>{
 assert.equal(SUI_NFT_BCS_MAX_BYTES,24500);
 assert.equal(SUI_LISTING_BCS_MAX_BYTES,26000);
 await assert.rejects(()=>boundedSuiBcs(Promise.resolve('{"fake":"bytes"}')),/unreadable/);
 await assert.rejects(()=>boundedSuiBcs(new Uint8Array()),/exceeds allowed size/);
 await assert.rejects(()=>boundedSuiBcs(new Uint8Array(26001),26000),/exceeds allowed size/);
 await assert.rejects(()=>boundedSuiBcs(new Uint8Array(24501),SUI_NFT_BCS_MAX_BYTES),/exceeds allowed size/);
});
