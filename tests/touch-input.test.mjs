import test from 'node:test';
import assert from 'node:assert/strict';
import { initTouch } from '../js/touch.js';

// Minimal pointer-capture DOM; tests exercise actual handlers without WebGL.
function pointer(type,id,x=40,y=40) {
  const e=new Event(type,{cancelable:true});
  Object.assign(e,{pointerId:id,clientX:x,clientY:y});
  return e;
}
const fire=(el,type,id,x,y)=>el.dispatchEvent(pointer(type,id,x,y));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function setup() {
  const names=['touch','joyzone','joybase','joyknob','lookzone','tbJump',
    'tbBreak','tbPlace','tbGuard','tbSneak','tbInv','tbMenu','tbDrop','hotbar','flurryModal'];
  const classes=()=>{const set=new Set();return {
    add:v=>set.add(v),remove:v=>set.delete(v),contains:v=>set.has(v),
    toggle:(v,on)=>on?set.add(v):set.delete(v)
  };};
  class El extends EventTarget {
    constructor(){super();this.style={display:'none'};this.classList=classes();this.capture=null;}
    setPointerCapture(id){this.capture=id;}
    hasPointerCapture(id){return this.capture===id;}
    releasePointerCapture(id){
      if(this.capture!==id)return;
      this.capture=null;this.dispatchEvent(pointer('lostpointercapture',id));
    }
  }
  const nodes=new Map(names.map(id=>[id,new El()]));
  const document=new EventTarget();
  document.visibilityState='visible';document.body={classList:classes()};
  document.getElementById=id=>nodes.get(id)||null;
  const window=new EventTarget();
  globalThis.document=document;globalThis.window=window;
  const game={state:'play',paused:false,spawnItem(){}};
  const player={yaw:0,pitch:0,dead:false,creative:false,
    held:()=>({id:1,n:1,d:0}),target:{},sel:0,inv:[]};
  const ui={isOpen:false,dirtyInv:false,toast(){},openInventory(){this.isOpen=true;}};
  let pauses=0;
  initTouch(game,player,ui,{settings:{sens:100},pause(){pauses++;game.paused=true;}});
  return {game,player,ui,document,window,el:id=>nodes.get(id),pauses:()=>pauses};
}

test('move+look pointers remain independent; cancel never places',()=>{
  const {game,player,el}=setup();
  fire(el('joyzone'),'pointerdown',1,40,40);
  fire(el('joyzone'),'pointermove',1,40,87);
  assert.ok(game.touch.fwd<-.8);
  fire(el('lookzone'),'pointerdown',2,550,160);
  fire(el('lookzone'),'pointermove',2,575,175);
  assert.ok(player.yaw<0&&player.pitch<0);
  assert.ok(game.touch.fwd<-.8);
  fire(el('lookzone'),'pointercancel',2,575,175);
  assert.equal(game.touch.rightPressed,false);
  assert.ok(game.touch.fwd<-.8);
  fire(el('joyzone'),'pointercancel',1,40,87);
  assert.equal(game.touch.fwd,0);
  fire(el('joyzone'),'pointerdown',3,40,40);
  fire(el('joyzone'),'pointermove',3,72,40);
  assert.ok(game.touch.strafe>.5);
  fire(el('joyzone'),'pointerup',3,72,40);
});

test('completed tap places, but cancelled/lost capture and long hold do not',async()=>{
  const {game,el}=setup();
  fire(el('lookzone'),'pointerdown',1,500,200);
  fire(el('lookzone'),'pointercancel',1,500,200);
  assert.equal(game.touch.rightPressed,false);
  fire(el('lookzone'),'pointerdown',2,500,200);
  el('lookzone').releasePointerCapture(2);
  assert.equal(game.touch.rightPressed,false);
  fire(el('lookzone'),'pointerdown',3,500,200);
  fire(el('lookzone'),'pointerup',3,500,200);
  assert.equal(game.touch.rightPressed,true);
  assert.equal(game.touch.right,true);
  await sleep(130);
  assert.equal(game.touch.right,false);
  game.touch.rightPressed=false; // consumed by game's frame loop
  fire(el('lookzone'),'pointerdown',4,500,200);
  await sleep(345);
  assert.equal(game.touch.left,true);
  fire(el('lookzone'),'pointerup',4,500,200);
  assert.equal(game.touch.left,false);
  assert.equal(game.touch.rightPressed,false);
});

test('one mining gesture cannot cancel another held attack button',async()=>{
  const {game,el}=setup();
  fire(el('lookzone'),'pointerdown',1,500,200);
  await sleep(345);
  assert.equal(game.touch.left,true);
  fire(el('tbBreak'),'pointerdown',2);
  fire(el('lookzone'),'pointerup',1,500,200);
  assert.equal(game.touch.left,true);
  fire(el('tbBreak'),'pointerup',2);
  assert.equal(game.touch.left,false);
});

test('blur releases captured buttons and cancels delayed ghost mining',async()=>{
  const {game,window,el}=setup();
  fire(el('joyzone'),'pointerdown',1,40,40);
  fire(el('joyzone'),'pointermove',1,40,94);
  fire(el('lookzone'),'pointerdown',2,500,200);
  fire(el('tbJump'),'pointerdown',3);
  fire(el('tbPlace'),'pointerdown',4);
  assert.equal(game.touch.right,true);
  window.dispatchEvent(new Event('blur'));
  for(const name of ['fwd','strafe','left','jump','right','rightPressed','attackPressed','guard'])
    assert.equal(game.touch[name],name==='fwd'||name==='strafe'?0:false,name);
  assert.equal(el('tbJump').classList.contains('down'),false);
  assert.equal(el('joyzone').capture,null);
  assert.equal(el('lookzone').capture,null);
  await sleep(345);
  assert.equal(game.touch.left,false);
  fire(el('lookzone'),'pointerup',2,500,200);
  assert.equal(game.touch.rightPressed,false);
  fire(el('joyzone'),'pointerdown',5,40,40);
  fire(el('joyzone'),'pointermove',5,40,85);
  assert.ok(game.touch.fwd<-.7);
  fire(el('joyzone'),'pointerup',5,40,85);
});

test('hidden tab, dialog, inventory and pause block new gameplay input',()=>{
  const {game,ui,document,el,pauses}=setup();
  el('flurryModal').style.display='flex';
  fire(el('joyzone'),'pointerdown',1,40,40);
  fire(el('joyzone'),'pointermove',1,40,90);
  assert.equal(game.touch.fwd,0);
  el('flurryModal').style.display='none';
  fire(el('joyzone'),'pointerdown',2,40,40);
  fire(el('joyzone'),'pointermove',2,40,90);
  assert.ok(game.touch.fwd<0);
  document.visibilityState='hidden';
  document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(game.touch.fwd,0);
  document.visibilityState='visible';
  fire(el('tbInv'),'pointerdown',3);
  assert.equal(ui.isOpen,true);
  assert.equal(game.touch.left,false);
  fire(el('tbPlace'),'pointerdown',4);
  assert.equal(game.touch.right,false);
  ui.isOpen=false;
  fire(el('tbMenu'),'pointerdown',5);
  assert.equal(pauses(),1);
  fire(el('tbBreak'),'pointerdown',6);
  assert.equal(game.touch.left,false);
});
