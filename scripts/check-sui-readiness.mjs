// Read-only Sui Testnet deployment preflight. No private keys or signatures.
import {SuiGrpcClient} from '@mysten/sui/grpc';
import {SUI_NETWORK,SUI_PACKAGE_ID,SUI_TESTNET_RPC} from '../js/sui-config.js';
import {packageId} from '../js/sui-market-core.js';

const packageAddress=packageId(SUI_PACKAGE_ID);
if(SUI_NETWORK!=='testnet'||!SUI_TESTNET_RPC.startsWith('https://')){
  console.error('Sui NFT configuration must use Sui Testnet and HTTPS.');
  process.exitCode=1;
}else if(!packageAddress){
  console.log('SUI PACKAGE: UNPUBLISHED — read-only wallet inspector is available.');
  console.log('NFT mint/list/buy/cancel intentionally remain disabled.');
  console.log('To enable NFT trading, publish the Move package from an authorized Testnet wallet,');
  console.log('verify its source and insert the 0x + 64-hex package ID into js/sui-config.js.');
}else{
  try{
    const client=new SuiGrpcClient({network:'testnet',baseUrl:SUI_TESTNET_RPC});
    const expected={mint:3,list:3,buy:3,cancel:2};
    for(const [name,parameterCount] of Object.entries(expected)){
      const {function:fn}=await client.getMoveFunction({
        packageId:packageAddress,moduleName:'market',name,
      });
      if(String(fn?.visibility).toLowerCase()!=='public'||
         !Array.isArray(fn.parameters)||fn.parameters.length!==parameterCount||
         (Array.isArray(fn.typeParameters)&&fn.typeParameters.length)){
        throw new Error('Unexpected contract ABI for '+name);
      }
      console.log('Verified Testnet ABI: market::'+name+' ('+parameterCount+' parameters)');
    }
    console.log('Package ABI verified against Sui Testnet: '+packageAddress);
    console.log('ABI verification does NOT prove source provenance or contract security.');
    console.log('Perform sui client verify-source and test two independent wallets before launch.');
  }catch(error){
    console.error('Sui Testnet contract is NOT ready:',error.message);
    process.exitCode=1;
  }
}
