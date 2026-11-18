// This module bundles with the Sui wallet SDK. It is never loaded while
// playing the regular game without opening the optional marketplace.
// Only the optional Sui Testnet interface imports this bundled module.
// Sui dApp Kit (2026), Wallet Standard, Sui gRPC. No private keys.
import { createDAppKit } from '@mysten/dapp-kit-core';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';
import { SUI_TESTNET_RPC } from './sui-config.js';
import { packageId, toMist, fromMist, canonicalBytes, parseOnchainContent, hashBytes, toHex } from './sui-market-core.js';

const kit=createDAppKit({
  networks:['testnet'],defaultNetwork:'testnet',
  createClient:network=>new SuiGrpcClient({network,baseUrl:SUI_TESTNET_RPC}),
  autoConnect:false,
});
const nftBcs=bcs.struct('BuildNFT',{
  id:bcs.Address,name:bcs.vector(bcs.u8()),creator:bcs.Address,
  digest:bcs.vector(bcs.u8()),geometry:bcs.vector(bcs.u8()),
});
const listingBcs=bcs.struct('Listing',{
  id:bcs.Address,seller:bcs.Address,price:bcs.u64(),
  name:bcs.vector(bcs.u8()),digest:bcs.vector(bcs.u8()),
  nft:bcs.option(nftBcs),
});
const decoder=new TextDecoder('utf-8',{fatal:true});
const decodeString=bytes=>decoder.decode(Uint8Array.from(bytes));
const client=()=>kit.getClient('testnet');
const nftType=pkg=>pkg+'::market::BuildNFT';
const listingType=pkg=>pkg+'::market::Listing';
let checkedPackage=null;
export async function checkPackage(value){
  const id=verifiedPackage(value);
  if(checkedPackage===id)return id;
  // Reject a syntactically valid but unknown package before any wallet signing.
  // This ABI check catches accidental package ID mix-ups but is NOT a
  // cryptographic substitute for verifying published source / bytecode.
  const expected={mint:3,list:3,buy:3,cancel:2};
  for(const [name,arity] of Object.entries(expected)){
    const result=await client().getMoveFunction({packageId:id,moduleName:'market',name});
    const fn=result?.function;
    if(!fn||String(fn.visibility).toLowerCase()!=='public'||
       !Array.isArray(fn.parameters)||fn.parameters.length!==arity||
       (Array.isArray(fn.typeParameters)&&fn.typeParameters.length>0))
      throw new Error('The package ABI is not the expected FlurryCraft marketplace. Verify the published source and package ID.');
  }
  checkedPackage=id;
  return id;
}
// Read-only Testnet endpoint check. No wallet signature is requested.
export async function testnetStatus(){
  const price=await client().getReferenceGasPrice();
  return {network:'testnet',reachable:true,referenceGasPrice:String(price?.referenceGasPrice ?? 'unknown')};
}
export async function testnetBalance(){
  const owner=requireAccount();
  const result=await client().getBalance({owner});
  return fromMist(result.balance?.balance ?? 0);
}
function verifiedPackage(value){
  const id=packageId(value);
  if(!id)throw new Error('The FlurryCraft contract is not yet published/configured on Sui Testnet. No transaction can be signed.');
  return id;
}
export function wallets(){
  return kit.stores.$wallets.get().map((wallet,index)=>({index,name:wallet.name}));
}
export function connection(){
  const c=kit.stores.$connection.get();
  return {connected:!!c?.isConnected,address:c?.account?.address||null};
}
export function subscribe(callback){
  return kit.stores.$connection.subscribe(()=>callback(connection()));
}
export async function connect(index){
  const wallet=kit.stores.$wallets.get()[index];
  if(!wallet)throw new Error('Sui wallet not detected. On Android, open FlurryCraft inside a compatible Sui wallet browser.');
  await kit.connectWallet({wallet});
  const account=connection();
  if(!account.address)throw new Error('No Sui account was authorized.');
  return account;
}
export async function disconnect(){await kit.disconnectWallet();return connection();}
function requireAccount(){
  const c=connection();
  if(!c.address)throw new Error('Connect your wallet first.');
  return c.address;
}
async function submit(tx){
  requireAccount();
  const result=await kit.signAndExecuteTransaction({transaction:tx,network:'testnet'});
  if(result.FailedTransaction||result.$kind==='FailedTransaction')
    throw new Error(result.FailedTransaction.status?.error?.message||'Sui Testnet execution failed.');
  if(!result.Transaction?.digest||result.Transaction.status?.success===false)
    throw new Error('No successful Sui transaction was confirmed.');
  // Indexes can lag execution; wait before refreshing ownership or listings.
  await client().waitForTransaction({digest:result.Transaction.digest});
  return result.Transaction.digest;
}
async function validateParsedNFT(nft){
  const bytes=Uint8Array.from(nft.geometry),digest=toHex(nft.digest);
  if(digest!==(await hashBytes(bytes)))throw new Error('Onchain blueprint digest is invalid.');
  const title=decodeString(nft.name);
  const blueprint=parseOnchainContent(bytes,title,nft.creator);
  return {title,creator:nft.creator,digest,blueprint,
    size:blueprint.size,blocks:blueprint.blocks.length};
}
async function decodeNFT(raw,objectId){
  const parsed=await validateParsedNFT(nftBcs.parse(raw));
  return {objectId,...parsed};
}
export async function mint(pkg,blueprint){
  const id=await checkPackage(pkg),content=canonicalBytes(blueprint);
  const title=new TextEncoder().encode(String(blueprint.name||'My building').slice(0,48));
  if(title.length<1||title.length>48)throw new Error('Name must be 1–48 bytes.');
  const tx=new Transaction();
  tx.moveCall({target:id+'::market::mint',arguments:[
    tx.pure.vector('u8',[...title]),tx.pure.vector('u8',[...content])
  ]});
  return {digest:await submit(tx),contentBytes:content.length};
}
export async function owned(pkg){
  const id=verifiedPackage(pkg),owner=requireAccount();
  const nfts=[],invalid=[];
  let page=await client().listOwnedObjects({owner,type:nftType(id),limit:50,include:{content:true}});
  let n=0;
  for(;;){
    for(const o of page.objects||[]){
      try{if(o.content)nfts.push(await decodeNFT(o.content,o.objectId));}
      catch(err){invalid.push({objectId:o.objectId,error:err.message});}
    }
    if(!page.hasNextPage||++n>=10)break;
    page=await client().listOwnedObjects({owner,type:nftType(id),cursor:page.cursor,limit:50,include:{content:true}});
  }
  // Wallets can change accounts while an asynchronous inventory query runs.
  // Never display assets from a previous account as if they belong to the new one.
  if(requireAccount().toLowerCase()!==owner.toLowerCase())
    throw new Error('Wallet account changed during NFT verification. Refresh the marketplace.');
  return {nfts,invalid};
}
export async function getListing(pkg,listingId){
  const id=verifiedPackage(pkg);
  if(!/^0x[0-9a-fA-F]{1,64}$/.test(String(listingId)))throw new Error('Invalid listing ID.');
  const {object}=await client().getObject({objectId:listingId,include:{content:true}});
  if(!object?.content)throw new Error('Listing not found on Sui Testnet.');
  if(object.type!==listingType(id))throw new Error('Wrong contract package for listing.');
  if(object.owner?.$kind!=='Shared')throw new Error('Listing is not a shared escrow object.');
  const parsed=listingBcs.parse(object.content);
  if(BigInt(parsed.price)<=0n||parsed.digest?.length!==32)
    throw new Error('Listing has invalid price or digest metadata.');
  // Never offer a sale in the UI without verifying the escrowed voxel bytes,
  // their SHA-256 and the listing's declared digest/title.
  let blocks=0,blueprint=null;
  if(parsed.nft){
    const checked=await validateParsedNFT(parsed.nft);
    if(checked.digest!==toHex(parsed.digest)||checked.title!==decodeString(parsed.name))
      throw new Error('Listing metadata does not match its NFT.');
    blocks=checked.blocks;
    blueprint=checked.blueprint;
  }
  return {listingId,seller:parsed.seller,priceMist:BigInt(parsed.price).toString(),
    priceSui:fromMist(parsed.price),title:decodeString(parsed.name),
    digest:toHex(parsed.digest),active:!!parsed.nft,nftId:parsed.nft?.id||null,blocks,blueprint};
}
export async function listings(pkg){
  const id=verifiedPackage(pkg),found=[],seen=new Set();
  let page=await client().listEvents({
    filter:{eventType:id+'::market::Listed'},order:'descending',limit:40,
  });
  const events=[...(page.events||[])];
  // Bounded discovery; production would use a complete marketplace indexer.
  for(let i=0;i<2&&events.length<90&&page.hasNextPage&&page.endCursor;i++){
    page=await client().listEvents({
      filter:{eventType:id+'::market::Listed'},order:'descending',
      before:page.endCursor,limit:30,
    });
    events.push(...(page.events||[]));
  }
  const candidateIds=[];
  for(const event of events){
    const json=event.json||{},oid=String(json.listing_id||json.listingId||'');
    if(!/^0x[0-9a-fA-F]{1,64}$/.test(oid)||seen.has(oid))continue;
    seen.add(oid);
    candidateIds.push(oid);
  }
  // Limit to six concurrent integrity checks to keep mobile RPC use bounded.
  const ids=candidateIds.slice(0,55);
  for(let i=0;i<ids.length;i+=6){
    const batch=await Promise.all(ids.slice(i,i+6).map(async oid=>{
      try{return await getListing(id,oid);}catch{return null;}
    }));
    for(const item of batch)if(item?.active)found.push(item);
    if(found.length>=35)break;
  }
  return found.slice(0,35);
}
export async function list(pkg,nftId,priceText){
  const id=await checkPackage(pkg);requireAccount();
  const assets=await owned(id);
  if(!assets.nfts.some(n=>n.objectId===nftId))
    throw new Error('You do not own this NFT.');
  const price=toMist(priceText),tx=new Transaction();
  tx.moveCall({target:id+'::market::list',arguments:[
    tx.object(nftId),tx.pure.u64(price.toString())
  ]});
  return await submit(tx);
}
export async function cancel(pkg,listingId){
  const id=await checkPackage(pkg),addr=requireAccount();
  const item=await getListing(id,listingId);
  if(!item.active)throw new Error('The listing has ended.');
  if(item.seller.toLowerCase()!==addr.toLowerCase())throw new Error('Only its seller can cancel.');
  const tx=new Transaction();
  tx.moveCall({target:id+'::market::cancel',arguments:[tx.object(listingId)]});
  return await submit(tx);
}
export async function buy(pkg,listingId,expectedPriceMist){
  const id=await checkPackage(pkg),addr=requireAccount();
  const item=await getListing(id,listingId);
  if(!item.active)throw new Error('Listing no longer active.');
  if(item.seller.toLowerCase()===addr.toLowerCase())throw new Error('You already own the listing.');
  if(item.priceMist!==String(expectedPriceMist))
    throw new Error('Listing price changed. Refresh before buying.');
  const tx=new Transaction();
  // Sui v2 balances may be held as address balance, not a gas coin object.
  // tx.coin resolves either source while keeping the exact requested MIST.
  const payment=tx.coin({balance:BigInt(item.priceMist)});
  tx.moveCall({target:id+'::market::buy',arguments:[tx.object(listingId),payment]});
  return await submit(tx);
}
export async function verifiedOwnedBlueprint(pkg,nftId){
  // Fresh Sui owner query, not a locally cached entitlement.
  const assets=await owned(pkg),nft=assets.nfts.find(x=>x.objectId===nftId);
  if(!nft)throw new Error('Current onchain ownership not verified. Installation denied.');
  return nft.blueprint;
}
export const explorer=digest=>'https://suiscan.xyz/testnet/tx/'+encodeURIComponent(digest);
