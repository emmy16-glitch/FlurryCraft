// Pure Sui SDK response guards. Keep signing and network dependencies
// outside this module so error handling can be regression-tested offline.
export const SUI_NFT_BCS_MAX_BYTES=24500;
export const SUI_LISTING_BCS_MAX_BYTES=26000;

export function successfulSuiDigest(response){
  const failed=response?.FailedTransaction;
  if(failed||response?.$kind==='FailedTransaction')
    throw new Error(failed?.status?.error?.message||
      'Sui Testnet execution failed. No successful NFT transfer was recorded.');
  const tx=response?.Transaction;
  if(!tx||tx.status?.success!==true||
     typeof tx.digest!=='string'||tx.digest.length<8||
     tx.digest.length>128)
    throw new Error('Sui Testnet did not confirm a successful transaction.');
  return tx.digest;
}

export async function boundedSuiBcs(value,maxBytes=SUI_LISTING_BCS_MAX_BYTES){
  const resolved=await value;
  let bytes;
  if(resolved instanceof Uint8Array)bytes=resolved;
  else if(resolved instanceof ArrayBuffer)bytes=new Uint8Array(resolved);
  else if(ArrayBuffer.isView(resolved))
    bytes=new Uint8Array(resolved.buffer,resolved.byteOffset,resolved.byteLength);
  else throw new Error('Sui returned an unreadable BCS payload.');
  if(bytes.byteLength<1||bytes.byteLength>maxBytes)
    throw new Error('Sui NFT/listing BCS payload exceeds allowed size.');
  return bytes;
}
