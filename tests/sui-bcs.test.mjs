// Runs after npm install to verify @mysten/sui v2 BCS compatibility
// without a wallet, network connection, or Testnet signer.
import test from 'node:test';
import assert from 'node:assert/strict';
import {bcs} from '@mysten/sui/bcs';

const nft=bcs.struct('BuildNFT',{
 id:bcs.Address,
 name:bcs.vector(bcs.u8()),
 creator:bcs.Address,
 digest:bcs.vector(bcs.u8()),
 geometry:bcs.vector(bcs.u8()),
});
const listing=bcs.struct('Listing',{
 id:bcs.Address,seller:bcs.Address,price:bcs.u64(),
 name:bcs.vector(bcs.u8()),digest:bcs.vector(bcs.u8()),
 nft:bcs.option(nft),
});
const seller='0x'+'a'.repeat(64);
const buyer='0x'+'b'.repeat(64);
const data={
 id:buyer,name:Array.from(new TextEncoder().encode('Snow Cottage')),creator:seller,
 digest:Array(32).fill(23),geometry:[91,2,42,93],
};

test('Sui v2 BCS decodes a voxel NFT and its content digest',()=>{
 const encoded=nft.serialize(data).toBytes();
 const parsed=nft.parse(encoded);
 assert.equal(parsed.id.toLowerCase(),buyer);
 assert.equal(parsed.creator.toLowerCase(),seller);
 assert.deepEqual(parsed.geometry,data.geometry);
 assert.deepEqual(parsed.digest,data.digest);
 assert.equal(new TextDecoder().decode(Uint8Array.from(parsed.name)),'Snow Cottage');
});

test('Move Option<BuildNFT> listing BCS decodes both active and empty escrow',()=>{
 const item={id:seller,seller,price:1500000000n,
   name:data.name,digest:data.digest,nft:data};
 const live=listing.parse(listing.serialize(item).toBytes());
 assert.equal(BigInt(live.price),1500000000n);
 assert.equal(live.nft.creator.toLowerCase(),seller);
 const ended=listing.parse(listing.serialize({...item,nft:null}).toBytes());
 assert.equal(ended.nft,null);
});
