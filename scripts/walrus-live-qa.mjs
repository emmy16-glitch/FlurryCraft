// Public, synthetic Testnet-only Walrus roundtrip. No user data and no keys.
// This tests external availability; passing mocked unit tests is not enough.
import {webcrypto} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {uploadWalrusBlueprint,fetchWalrusBlueprint,
  WALRUS_TESTNET_PUBLISHER,WALRUS_TESTNET_AGGREGATOR} from '../js/walrus-blueprints.js';
const publicSample={version:1,name:'FlurryCraft public Testnet QA crystal',
  author:'FlurryCraft QA bot',size:[2,2,2],
  blocks:[[0,0,0,35],[0,1,0,29],[1,0,1,79]]};
const timeout=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const start=Date.now();
const request=async(url,opts={})=>{
  const controller=new AbortController();
  const alarm=setTimeout(()=>controller.abort(),45000);
  try{return await fetch(url,{...opts,signal:controller.signal});}
  finally{clearTimeout(alarm);}
};
async function preflight(){
  // Browser CORS preflight is required because we issue a PUT with octet-stream.
  const url=WALRUS_TESTNET_PUBLISHER+'/v1/blobs?epochs=2&permanent=true';
  const response=await request(url,{method:'OPTIONS',headers:{
    origin:'https://emmy16-glitch.github.io',
    'access-control-request-method':'PUT',
    'access-control-request-headers':'content-type'
  }});
  const allow=response.headers.get('access-control-allow-origin');
  const methods=response.headers.get('access-control-allow-methods')||'';
  const headers=response.headers.get('access-control-allow-headers')||'';
  const valid=response.ok&&(allow==='*'||allow==='https://emmy16-glitch.github.io')&&
    /PUT/i.test(methods)&&(/content-type/i.test(headers)||headers==='*');
  console.log('Walrus publisher browser CORS preflight: '+JSON.stringify({
    status:response.status,allow,methods,headers,valid
  }));
  return valid;
}
try{
  const cors=await preflight();
  // Synthetic public test geometry; never upload a user's world or private build.
  const receipt=await uploadWalrusBlueprint(publicSample,{fetchImpl:request,subtle:webcrypto.subtle});
  console.log('Walrus Testnet public receipt: '+JSON.stringify(receipt));
  let downloaded,lastError;
  for(const wait of [0,3000,6000,12000]){
    if(wait)await timeout(wait);
    try{
      downloaded=await fetchWalrusBlueprint(receipt,{fetchImpl:request,subtle:webcrypto.subtle});
      break;
    }catch(e){lastError=e;console.log('Aggregator not ready: '+e.message);}
  }
  if(!downloaded)throw new Error('Uploaded public blueprint could not be verified: '+lastError?.message);
  if(downloaded.blueprint.blocks.length!==publicSample.blocks.length)
    throw new Error('Live Walrus blob has unexpected geometry');
  if(!cors)throw new Error('Publisher works for Node but NOT for browser CORS from GitHub Pages');
  mkdirSync('walrus-qa-artifacts',{recursive:true});
  writeFileSync('walrus-qa-artifacts/walrus-live-testnet-receipt.json',
    JSON.stringify({confirmedAt:new Date().toISOString(),source:'public synthetic testnet QA',
      receipt,aggregatorURL:WALRUS_TESTNET_AGGREGATOR+'/v1/blobs/'+receipt.blobId,
      byteLength:downloaded.bytes,readBackVerified:true,browserCors:true},null,2));
  console.log('WALRUS LIVE PASS: uploaded, read back and SHA-256 verified in '+(Date.now()-start)+'ms');
}catch(e){
  console.error('WALRUS LIVE FAIL: '+String(e.stack||e));process.exitCode=1;
}
