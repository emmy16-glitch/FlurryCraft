// Plain JavaScript helpers for transaction safety and testability.
import { normalizeBlueprint, canonicalBlueprintContent } from './creator-studio.js';
export const MIST_PER_SUI=1000000000n;
export const MAX_CONTENT_BYTES=24000;
export function packageId(value) {
  const s=String(value||'').trim();
  if(!/^0x[0-9a-fA-F]{64}$/.test(s))return null;
  if(/^0x0+$/.test(s))return null;
  return s.toLowerCase();
}
export function toMist(input) {
  const s=String(input).trim();
  if(!/^(?:0|[1-9]\d{0,10})(?:\.\d{1,9})?$/.test(s))
    throw new Error('Enter a positive SUI price with up to 9 decimal places.');
  const [whole,decimal='']=s.split('.');
  const value=BigInt(whole)*MIST_PER_SUI+BigInt((decimal+'000000000').slice(0,9));
  if(value<1n || value>1000000000000000000n)throw new Error('Price is outside the Testnet safety limit.');
  return value;
}
export function fromMist(value) {
  const n=BigInt(value),whole=n/MIST_PER_SUI,frac=(n%MIST_PER_SUI).toString().padStart(9,'0').replace(/0+$/,'');
  return whole.toString()+(frac?'.'+frac:'');
}
export function canonicalBytes(input) {
  const blueprint=normalizeBlueprint(input,id=>id>0&&id<128&&![10,11,12,23].includes(id));
  const bytes=new TextEncoder().encode(canonicalBlueprintContent(blueprint));
  if(bytes.length>MAX_CONTENT_BYTES)throw new Error('This house is too large for the Testnet NFT (24 KB limit). Try a smaller selection.');
  return bytes;
}
export function parseOnchainContent(bytes,name,creator) {
  const text=new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(bytes));
  const data=JSON.parse(text);
  if(!Array.isArray(data)||data.length!==3||data[0]!=='FlurryCraft:voxel-blueprint:v1')
    throw new Error('NFT does not contain FlurryCraft geometry.');
  const result=normalizeBlueprint({
    version:1,name:String(name||'Onchain building'),author:String(creator||'Sui creator'),
    size:data[1],blocks:data[2],
  },id=>id>0&&id<128&&![10,11,12,23].includes(id));
  if(canonicalBlueprintContent(result)!==text)
    throw new Error('NFT geometry is not canonically encoded.');
  return result;
}
export function toHex(bytes) { return [...Uint8Array.from(bytes)].map(b=>b.toString(16).padStart(2,'0')).join(''); }
export async function hashBytes(bytes,subtle=globalThis.crypto?.subtle) {
  if(!subtle)throw new Error('SHA-256 requires HTTPS.');
  return toHex(new Uint8Array(await subtle.digest('SHA-256',Uint8Array.from(bytes))));
}
