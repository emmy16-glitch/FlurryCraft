// Optional Walrus TESTNET storage for player-created public building blueprints.
// Never uploads entire worlds, inventory, private data or wallet secrets.
// Walrus blobs are public, and are NOT NFTs or proof of legal ownership.
import {canonicalBytes,parseOnchainContent,hashBytes} from './sui-market-core.js';

export const WALRUS_TESTNET_AGGREGATOR='https://aggregator.walrus-testnet.walrus.space';
export const WALRUS_TESTNET_PUBLISHER='https://publisher.walrus-testnet.walrus.space';
export const WALRUS_BLUEPRINT_MAX_BYTES=24000;
export const WALRUS_EPOCHS=2;

export function validateWalrusBlobId(blobId){
  const value=String(blobId??'').trim();
  // A 32-byte blob ID uses unpadded Base64url (43 characters).
  if(!/^[A-Za-z0-9_-]{43}$/.test(value))
    throw new Error('Enter a valid 43-character Walrus Testnet blob ID.');
  return value;
}
export function walrusTestnetURL(blobId){
  return WALRUS_TESTNET_AGGREGATOR+'/v1/blobs/'+validateWalrusBlobId(blobId);
}
export function walrusBlueprintReceipt(input){
  if(!input||input.format!=='flurrycraft-walrus-blueprint-v1')
    throw new Error('Not a FlurryCraft Walrus blueprint receipt.');
  const blobId=validateWalrusBlobId(input.blobId);
  const digest=String(input.digest||'').toLowerCase();
  if(!/^[a-f0-9]{64}$/.test(digest))throw new Error('Invalid Walrus receipt SHA-256 digest.');
  return {format:'flurrycraft-walrus-blueprint-v1',network:'testnet',
    blobId,digest,
    name:String(input.name||'Walrus Building').slice(0,64),
    author:String(input.author||'Creator').slice(0,64)};
}
export async function uploadWalrusBlueprint(blueprint,{fetchImpl=globalThis.fetch,subtle=globalThis.crypto?.subtle}={}){
  if(typeof fetchImpl!=='function')throw new Error('Browser networking unavailable.');
  const bytes=canonicalBytes(blueprint);
  const digest=await hashBytes(bytes,subtle);
  const response=await fetchImpl(
    WALRUS_TESTNET_PUBLISHER+'/v1/blobs?epochs='+WALRUS_EPOCHS+'&permanent=true',
    {method:'PUT',headers:{'content-type':'application/octet-stream'},body:bytes}
  );
  if(!response?.ok)throw new Error('Walrus Testnet upload failed (HTTP '+(response?.status??'?')+').');
  const result=await response.json();
  const blobId=validateWalrusBlobId(result?.newlyCreated?.blobObject?.blobId||
    result?.alreadyCertified?.blobId);
  return walrusBlueprintReceipt({format:'flurrycraft-walrus-blueprint-v1',
    blobId,digest,name:blueprint.name,author:blueprint.author});
}
export async function fetchWalrusBlueprint(reference,{
  fetchImpl=globalThis.fetch,subtle=globalThis.crypto?.subtle
}={}){
  if(typeof fetchImpl!=='function')throw new Error('Browser networking unavailable.');
  const receipt=typeof reference==='string'?{blobId:validateWalrusBlobId(reference),
    name:'Walrus Building',author:'Walrus Testnet',digest:null}:
    walrusBlueprintReceipt(reference);
  const response=await fetchImpl(walrusTestnetURL(receipt.blobId),{method:'GET'});
  if(!response?.ok)throw new Error('Walrus Testnet download failed (HTTP '+(response?.status??'?')+').');
  const header=Number(response.headers?.get?.('content-length')??0);
  if(header>WALRUS_BLUEPRINT_MAX_BYTES)
    throw new Error('Walrus blob exceeds the 24 KB public blueprint limit.');
  let bytes;
  if(response.body?.getReader){
    const reader=response.body.getReader(),parts=[];
    let length=0;
    try{
      while(true){
        const {value,done}=await reader.read();
        if(done)break;
        length+=value.length;
        if(length>WALRUS_BLUEPRINT_MAX_BYTES)
          throw new Error('Walrus blob exceeds the 24 KB public blueprint limit.');
        parts.push(value);
      }
    }finally{reader.releaseLock?.();}
    bytes=new Uint8Array(length);
    let offset=0;
    for(const part of parts){bytes.set(part,offset);offset+=part.length;}
  }else{
    bytes=new Uint8Array(await response.arrayBuffer());
    if(bytes.length>WALRUS_BLUEPRINT_MAX_BYTES)
      throw new Error('Walrus blob exceeds the 24 KB public blueprint limit.');
  }
  if(!bytes.length)throw new Error('Walrus blob was empty.');
  const digest=await hashBytes(bytes,subtle);
  if(receipt.digest&&digest!==receipt.digest)
    throw new Error('Walrus blueprint SHA-256 does not match the receipt.');
  const blueprint=parseOnchainContent(bytes,receipt.name,receipt.author);
  return {blueprint,blobId:receipt.blobId,digest,bytes:bytes.length};
}
