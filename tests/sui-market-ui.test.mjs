import test from 'node:test';
import assert from 'node:assert/strict';
import { initSuiMarketUI } from '../js/sui-market-ui.js';
import { SUI_PACKAGE_ID } from '../js/sui-config.js';

const example={version:1,name:'Frost Cottage',author:'Yeti',size:[2,2,2],
 blocks:[[0,0,0,38],[1,0,0,38],[0,1,0,17]]};

class MockElement {
 constructor(tag='div'){
  this.tagName=tag.toUpperCase();
  this.children=[];this.className='';this.textContent='';this.attributes={};
  this.width=280;this.height=145;this.isConnected=true;
  this.events={};this.classList={add(){},remove(){}};
 }
 appendChild(el){this.children.push(el);return el;}
 setAttribute(k,v){this.attributes[k]=v;}
 addEventListener(k,fn){this.events[k]=fn;}
 getContext(){
  const gradient={addColorStop(){}};
  return {createLinearGradient:()=>gradient,clearRect(){},fillRect(){},
    beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},
    fillText(){},stroke(){},measureText(s){return {width:s.length*5};}};
 }
 get renderedText(){
  return [this.textContent,...this.children.map(c=>c.renderedText)].join(' ');
 }
}
test('unpublished Testnet package shows a calm non-trading experience',async()=>{
 assert.equal(SUI_PACKAGE_ID,'','do not silently enable an unverified package');
 const document={head:new MockElement('head'),createElement:tag=>new MockElement(tag)};
 const previous=globalThis.document;
 globalThis.document=document;
 try{
  const panel=new MockElement('section'),game={state:'play',world:{},player:{}};
  const calls=[],startPreview=()=>calls.push('preview');
  const openDialog=title=>{calls.push(title);panel.children.length=0;};
  const ui=initSuiMarketUI({
   game,panel,openDialog,closeDialog:()=>{},notify:()=>{},startPreview,
  });
  assert.equal(typeof ui.open,'function');
  await ui.open({blueprint:example});
  const content=panel.renderedText;
  assert.match(content,/Marketplace has not launched yet/);
  assert.match(content,/NOT LIVE/);
  assert.match(content,/NFT minting Disabled/);
  assert.match(content,/Listings and purchases Disabled/);
  assert.match(content,/Marketplace payments Unavailable/);
  assert.match(content,/Check Testnet Wallet \(read only\)/);
  assert.match(content,/not been published and independently verified/);
  assert.match(content,/No real-money sales are enabled/);
  assert.match(content,/it does not sign or submit a transaction/);
  assert.match(content,/Frost Cottage/);
  assert.doesNotMatch(content,/Confirm Purchase|Confirm Mint|Connect Wallet/);
  assert.equal(calls.includes('Sui Marketplace'),true);
  assert.equal(calls.includes('preview'),false);
  assert.equal(panel.children.some(x=>x.tagName==='CANVAS'),false,
   'canvas is nested inside a building card instead of cluttering root');
 }finally{globalThis.document=previous;}
});
