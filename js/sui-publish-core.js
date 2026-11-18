// Offline validation for the opt-in Sui Testnet Move package publication flow.
// Publishing requires a separate wallet signature; never accept arbitrary remote
// code URLs or private keys as "deployment credentials".
export const PUBLISH_FORMAT='flurrycraft-testnet-publish-v1';
export const MAX_PUBLISH_BYTES=600000;

export function validatePublishManifest(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||
     input.format!==PUBLISH_FORMAT||input.network!=='testnet')
    throw new Error('Not an approved FlurryCraft Testnet publish bundle.');
  if(!/^[a-f0-9]{40}$/.test(String(input.sourceRevision||'')))
    throw new Error('Testnet publish bundle has no valid source revision.');
  if(!Array.isArray(input.modules)||input.modules.length<1||input.modules.length>12)
    throw new Error('Missing or invalid compiled Move modules.');
  let bytes=0;
  const modules=input.modules.map(module=>{
    if(typeof module!=='string'||module.length<16||module.length>500000||
       !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(module))
      throw new Error('Invalid compiled Move bytecode.');
    const size=module.length*3/4-(module.endsWith('==')?2:module.endsWith('=')?1:0);
    bytes+=size;
    return module;
  });
  if(bytes>MAX_PUBLISH_BYTES)
    throw new Error('The Move package exceeds the Testnet size limit.');
  if(!Array.isArray(input.dependencies)||input.dependencies.length<1||input.dependencies.length>50)
    throw new Error('Invalid Move package dependencies.');
  const deps=input.dependencies.map(id=>{
    if(typeof id!=='string'||!/^0x[a-fA-F0-9]{1,64}$/.test(id))
      throw new Error('Invalid Move package dependency address.');
    return id;
  });
  if(!Array.isArray(input.digest)||input.digest.length!==32||
     !input.digest.every(n=>Number.isInteger(n)&&n>=0&&n<=255))
    throw new Error('Compiled Move package digest is invalid.');
  if(input.packageName!=='flurrycraft')
    throw new Error('The bundle does not name the FlurryCraft Move package.');
  return {sourceRevision:input.sourceRevision,
    packageName:'flurrycraft',network:'testnet',modules,
    dependencies:deps,digest:input.digest,byteLength:bytes};
}
