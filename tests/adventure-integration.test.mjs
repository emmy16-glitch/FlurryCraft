import test from 'node:test';
import assert from 'node:assert/strict';
import {initAdventure} from '../js/adventure.js';

class Element {
 constructor(tag='div'){
  this.tagName=tag.toUpperCase();this.children=[];this.textContent='';
  this.className='';this.style={};this.listeners={};this.disabled=false;
  this.attributes={};this.dataset={};this.hidden=false;
  this.classList={toggle(){},add(){},remove(){}};
  this.isConnected=true;
 }
 appendChild(e){this.children.push(e);return e;}
 setAttribute(name,value){this.attributes[name]=String(value);}
 addEventListener(type,fn){this.listeners[type]=fn;}
 get renderedText(){return this.textContent+' '+this.children.map(x=>x.renderedText).join(' ');}
 findButton(label){if(this.tagName==='BUTTON'&&this.textContent.includes(label))return this;
  for(const child of this.children){const found=child.findButton(label);if(found)return found;}
  return null;
 }
}
function createHarness(){
 const priorDoc=globalThis.document;
 const document={head:new Element('head'),body:new Element('body'),
  createElement:tag=>new Element(tag)};
 globalThis.document=document;
 const cells=new Map();
 const world={
  gen:{column(x,z){return {h:42,biome:3};}},
  loaded(){return true;},
  getBlock(x,y,z){return cells.get(x+','+y+','+z)||0;},
  setBlock(x,y,z,id){
   const k=x+','+y+','+z,old=this.getBlock(x,y,z);
   cells.set(k,id);game.adventure?.trackBlock(this,x,y,z,old,id);
   return true;
  },
 };
 const inventory=new Map(),notifications=[],panel=new Element('section');
 const game={
  state:'play',paused:false,world,difficulty:1,
  player:{x:0.5,y:43,z:0.5,spawn:{x:0.5,z:0.5,y:43},creative:false,dead:false,
   countItem(id){return inventory.get(id)||0;},
   canAccept(){return true;},
   addItem(id,n){inventory.set(id,(inventory.get(id)||0)+n);return 0;},
   takeItem(id){const n=inventory.get(id)||0;if(!n)return false;inventory.set(id,n-1);return true;}},
  sound:{play(){}},ui:{isOpen:false},mobs:[],spawnItem(){},
  Mob:class{
   constructor(game,kind,x,y,z,options={}){
    this.kind=kind;this.x=x;this.y=y;this.z=z;this.level=options.level||1;
    this.trialId=options.trialId||null;
    this.sp={iceNative:true};this.dead=false;
   }
   remove(){this.dead=true;}
  }
 };
 const B={AIR:0,ICE:29,STONE_BRICKS:35,SNOW:17,TORCH:22,FROST_BRICK:79,
  WARD_BEACON:80,FROST_SHARD:278};
 const nav=[];
 const explorer={guideTo(where){nav.push(where);}};
 const openDialog=()=>{panel.children.length=0;};
 const closeDialog=()=>{};
 const notify=(_,message)=>notifications.push(message);
 const adventure=game.adventure=initAdventure({game,B,openDialog,closeDialog,panel,notify,explorer});
 return {game,world,panel,B,adventure,inventory,notifications,nav,restore:()=>{globalThis.document=priorDoc;}};
}
test('fresh survival world creates an approachable Frost Ruins dungeon and persists it',()=>{
 const h=createHarness();try{
  h.adventure.load(null);h.adventure.resetWorld(true);
  assert.ok(h.adventure.den);
  for(let i=0;i<350;i++)h.adventure.update(.02);
  const data=h.adventure.serialize();
  assert.equal(data.denBuilt,true,'dungeon build is complete');
  assert.equal(h.world.getBlock(data.den.x,data.den.y-1,data.den.z),79);
  assert.equal(h.game.player.countItem(h.B.FROST_SHARD),0);
  h.adventure.open();
  assert.ok(h.panel.findButton('Track Frost Ruins'));
  h.panel.findButton('Track Frost Ruins').listeners.click();
  assert.equal(h.nav[0].name,'Frost Ruins');
 }finally{h.restore();}
});
test('clearing all three ice-native dungeon waves awards materials and XP',()=>{
 const h=createHarness();try{
  h.adventure.load(null);h.adventure.resetWorld(true);
  for(let i=0;i<350;i++)h.adventure.update(.02);
  const d=h.adventure.den;
  h.game.player.x=d.x+.5;h.game.player.z=d.z+.5;
  h.adventure.open();
  const button=h.panel.findButton('Start Frost Trial');
  assert.ok(button);
  button.listeners.click();
  assert.equal(h.game.mobs.length,2);
  for(let wave=0;wave<3;wave++){
   const live=h.game.mobs.filter(m=>!m.dead&&m.trialId);
   for(const mob of live){mob.dead=true;h.adventure.monsterDefeated(mob,true);}
   h.adventure.update(1);
  }
  const s=h.adventure.serialize();
  assert.equal(s.clears,1);
  assert.ok(s.level>=2);
  assert.ok(h.game.player.countItem(h.B.FROST_BRICK)>=16);
  assert.ok(h.game.player.countItem(h.B.WARD_BEACON)>=1);
 }finally{h.restore();}
});
test('Winter Ward is saved, protects nearby positions, and loses protection if removed',()=>{
 const h=createHarness();try{
  h.adventure.load(null);h.adventure.resetWorld(false);
  h.world.setBlock(2,42,3,h.B.WARD_BEACON);
  assert.equal(h.adventure.isShielded(2.5,43,3.5),true);
  assert.equal(h.adventure.isShielded(50,43,50),false);
  const state=h.adventure.serialize();
  assert.equal(state.beacons.length,1);
  h.world.setBlock(2,42,3,h.B.AIR);
  assert.equal(h.adventure.isShielded(2.5,43,3.5),false);
  h.adventure.load(state);
  assert.equal(h.adventure.isShielded(2.5,43,3.5),false,'stale saved beacon does not protect');
 }finally{h.restore();}
});
