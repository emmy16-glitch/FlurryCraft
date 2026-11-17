import test from 'node:test';
import assert from 'node:assert/strict';
import {initAdventure} from '../js/adventure.js';
import {xpToNext} from '../js/adventure-core.js';

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
 findById(id){if(this.id===id)return this;for(const child of this.children){
  const found=child.findById(id);if(found)return found;
 }return null;}
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
 document.getElementById=id=>document.body.findById(id);
 const breakControl=new Element('div');breakControl.id='tbBreak';
 document.body.appendChild(breakControl);
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
 const B={toolId:(kind,tier)=>280+kind*4+tier,AIR:0,ICE:29,STONE_BRICKS:35,SNOW:17,TORCH:22,FROST_BRICK:79,
  WARD_BEACON:80,FROST_SHARD:278};
 const nav=[];
 const explorer={guideTo(where){nav.push(where);}};
 const openDialog=()=>{panel.children.length=0;};
 const closeDialog=()=>{};
 const notify=(_,message)=>notifications.push(message);
 const adventure=game.adventure=initAdventure({game,B,openDialog,closeDialog,panel,notify,explorer});
 return {game,world,panel,B,adventure,inventory,notifications,nav,document,breakControl,
  restore:()=>{globalThis.document=priorDoc;}};
}
test('fresh survival world creates an approachable Frost Ruins dungeon and persists it',()=>{
 const h=createHarness();try{
  h.adventure.load(null);h.adventure.resetWorld(true);
  assert.ok(h.adventure.den);
  for(let i=0;i<850;i++)h.adventure.update(.02);
  const data=h.adventure.serialize();
  assert.equal(data.denBuilt,true,'dungeon build is complete');
  assert.equal(data.dungeonVersion,2);
  assert.equal(h.world.getBlock(data.den.x,data.den.y+1,data.den.z+14),0);
  assert.equal(h.world.getBlock(data.den.x,data.den.y+1,data.den.z+28),0);
  assert.equal(h.world.getBlock(data.den.x,data.den.y-1,data.den.z),79);
  assert.equal(h.game.player.countItem(h.B.FROST_SHARD),0);
  h.adventure.open();
  assert.ok(h.panel.findButton('Guide to Entrance'));
  h.panel.findButton('Guide to Entrance').listeners.click();
  assert.equal(h.nav[0].name,'Frost Ruins');
 }finally{h.restore();}
});
test('clearing all three ice-native dungeon waves awards materials and XP',()=>{
 const h=createHarness();try{
  h.adventure.load(null);h.adventure.resetWorld(true);
  for(let i=0;i<850;i++)h.adventure.update(.02);
  const d=h.adventure.den;
  h.game.player.x=d.x+.5;h.game.player.z=d.z-6.5;
  h.adventure.open();
  const button=h.panel.findButton('Enter Dungeon');
  assert.ok(button);
  button.listeners.click();
  assert.equal(h.game.mobs.length,2);
  for(let wave=0;wave<3;wave++){
   const live=h.game.mobs.filter(m=>!m.dead&&m.trialId);
   for(const mob of live){mob.dead=true;h.adventure.monsterDefeated(mob,true);}
   if(wave<2){
     h.game.player.x=d.x+.5;h.game.player.z=d.z+14*(wave+1)+.5;
   }
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

test('Android Mine button becomes Attack for a living creature and reverts after aiming away',()=>{
 const h=createHarness();try{
  h.game.touchMode=true;
  h.adventure.load(null);h.adventure.resetWorld(false);
  const mob={kind:'snow_prowler',level:4,hp:9,maxHp:17,dead:false,deadT:0,
   sp:{hp:17,iceNative:true}};
  h.game.player.mobTarget=mob;
  h.adventure.update(.016);
  assert.equal(h.breakControl.dataset.action,'attack');
  assert.equal(h.breakControl.textContent,'⚔');
  assert.equal(h.breakControl.attributes['aria-label'],'Hold to attack target');
  const health=h.document.getElementById('fcEnemyHealth');
  assert.equal(health.hidden,false);
  assert.match(health.renderedText,/Snow Prowler/);
  assert.match(health.renderedText,/9 \/ 17 HP/);
  h.game.player.mobTarget=null;
  h.adventure.update(.016);
  assert.equal(h.breakControl.dataset.action,'mine');
  assert.equal(h.breakControl.textContent,'⚒');
  assert.equal(health.hidden,true);
 }finally{h.restore();}
});
test('level-up gives a brief celebration and tappable progress panel, without false unlock text',()=>{
 const h=createHarness();try{
  h.adventure.load({level:1,xp:xpToNext(1)-1});
  h.game.player.mobTarget=null;
  h.adventure.monsterDefeated({kind:'frostling',level:1,
    sp:{iceNative:true}},true);
  assert.equal(h.adventure.level,2);
  const toast=h.document.getElementById('fcLevelNotice');
  assert.equal(toast.hidden,false);
  assert.match(toast.renderedText,/Level 2/);
  const level=h.document.getElementById('fcAdventurePill');
  assert.match(level.renderedText,/LV 2/);
  level.listeners.click({stopPropagation(){}});
  assert.match(h.panel.renderedText,/Level 2/);
  assert.match(h.panel.renderedText,/XP to Level 3/);
  h.adventure.update(3.05);
  assert.equal(toast.hidden,true);
  assert.ok(!Object.keys(h.adventure.serialize()).includes('levelsGained'),
    'transient level-up animation state does not leak into saved worlds');
 }finally{h.restore();}
});
test('combat feedback is hidden behind menus or while paused',()=>{
 const h=createHarness();try{
  h.adventure.load(null);
  h.game.touchMode=true;
  h.game.player.mobTarget={kind:'frostling',level:2,hp:12,maxHp:14,sp:{iceNative:true}};
  h.adventure.update(.016);
  assert.equal(h.breakControl.dataset.action,'attack');
  h.game.ui.isOpen=true;
  h.adventure.update(.016);
  assert.equal(h.document.getElementById('fcEnemyHealth').hidden,true);
  assert.equal(h.breakControl.dataset.action,'mine');
  h.game.ui.isOpen=false;
  h.game.paused=true;
  h.adventure.update(.016);
  assert.equal(h.document.getElementById('fcAdventurePill').style.display,'none');
 }finally{h.restore();}
});


test('legacy outdoor ruins are not extended until their owner opts in',()=>{
 const h=createHarness();try{
  const den={x:42,y:44,z:17};
  h.adventure.load({level:5,den,denBuilt:true,clears:2,dungeonVersion:0});
  h.adventure.resetWorld(false);
  assert.equal(h.adventure.serialize().dungeonVersion,0);
  assert.equal(h.world.getBlock(den.x,den.y-1,den.z+28),0);
  h.adventure.open();
  const upgrade=h.panel.findButton('Upgrade to Walk-in Dungeon');
  assert.ok(upgrade);
  upgrade.listeners.click();
  for(let i=0;i<850;i++)h.adventure.update(.03);
  const state=h.adventure.serialize();
  assert.equal(state.dungeonVersion,2);
  assert.equal(state.clears,2,'existing dungeon accomplishments preserved');
  assert.equal(h.world.getBlock(den.x,den.y-1,den.z+28),h.B.FROST_BRICK);
 }finally{h.restore();}
});
test('dungeon entrance appears in world, not when remote or while inside menus',()=>{
 const h=createHarness();try{
  h.adventure.load(null);h.adventure.resetWorld(true);
  for(let i=0;i<850;i++)h.adventure.update(.02);
  const den=h.adventure.den,entry=h.document.getElementById('fcDungeonEntry');
  h.game.player.x=den.x+.5;h.game.player.y=den.y;
  h.game.player.z=den.z-6.5;
  h.adventure.update(.016);
  assert.equal(entry.style.display,'block');
  h.game.player.x=den.x+60;
  h.adventure.update(.016);assert.equal(entry.style.display,'none');
  h.game.player.x=den.x+.5;
  h.game.ui.isOpen=true;
  h.adventure.update(.016);assert.equal(entry.style.display,'none');
 }finally{h.restore();}
});

test('an existing survival world may claim exactly one starter sword',()=>{
 const h=createHarness();try{
  h.adventure.load({level:3,swordClaimed:false});
  h.adventure.resetWorld(false);
  h.adventure.open();
  const claim=h.panel.findButton('Get Starter Sword');
  assert.ok(claim);
  claim.listeners.click();
  const id=h.B.toolId(3,0);
  assert.equal(h.game.player.countItem(id),1);
  assert.equal(h.adventure.serialize().swordClaimed,true);
  h.adventure.open();
  assert.equal(h.panel.findButton('Get Starter Sword'),null);
  h.adventure.load(h.adventure.serialize());
  h.adventure.open();
  assert.equal(h.panel.findButton('Get Starter Sword'),null);
 }finally{h.restore();}
});
