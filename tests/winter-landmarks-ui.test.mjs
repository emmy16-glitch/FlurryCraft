import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {initWinterLandmarks} from '../js/winter-landmarks.js';
import {safeWinterLandmarks} from '../js/winter-landmarks-core.js';
class Element{
  constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.textContent='';
    this.style={};this.listeners={};this.className='';this.disabled=false;
    this.attributes={};this.classList={add(){},remove(){}};}
  appendChild(node){this.children.push(node);return node;}
  setAttribute(k,v){this.attributes[k]=v;}
  addEventListener(k,fn){this.listeners[k]=fn;}
  remove(){}
  replaceChildren(...nodes){this.children=nodes;}
}
function harness(){
  const original=globalThis.document;
  const head=new Element('head'),body=new Element('body'),panel=new Element('section');
  globalThis.document={head,body,visibilityState:'visible',
    createElement:tag=>new Element(tag)};
  const player={x:2.5,y:50,z:2.5,onGround:true,dead:false,
    creative:false,health:10,maxHealth:20,guardStamina:50,
    spawn:{x:2.5,y:50,z:2.5},canAccept:()=>true,
    addItem:()=>0};
  const world={seed:50,gen:{seed:50,column:()=>({h:49,biome:3})}};
  let saved=0,dialogs=0;const messages=[];
  const game={state:'play',paused:false,scene:new THREE.Scene(),
    world,player,ui:{isOpen:false,dirtyInv:false},
    saveRewards(){saved++;return true;}};
  const landmarks=initWinterLandmarks({game,panel,
    openDialog(){dialogs++;panel.replaceChildren();},
    closeDialog(){},notify:(_g,msg)=>messages.push(msg),isBusy:()=>false});
  return {game,player,world,landmarks,panel,messages,
    get saved(){return saved;},get dialogs(){return dialogs;},
    close(){landmarks.dispose();globalThis.document=original;}};
}
test('real 3D refuge can be found, inspected, healed once and saved per world',()=>{
  const h=harness();try{
    h.landmarks.load(null);h.landmarks.update(3);
    const sites=h.landmarks.sites;
    assert.ok(sites.length>=1);
    const intro=sites.find(s=>s.id==='starter');
    assert.ok(intro,'one real nearby camp ensures an exploration onboarding path');
    assert.ok(h.game.scene.children.length>=1,'actual 3D group is in scene');
    assert.ok(h.game.scene.children[0].children.length>5,'camp contains multiple 3D pieces');
    h.player.x=intro.x+.5;h.player.z=intro.z+.5;h.player.y=intro.y;
    h.landmarks.update(.5);
    assert.equal(h.landmarks.interact(),true);
    assert.equal(h.landmarks.visitedCount,1);
    assert.equal(h.dialogs,1);
    const claim=h.panel.children.find(e=>e.className==='fc-landmark-benefit');
    assert.ok(claim);assert.equal(claim.disabled,false);
    claim.listeners.click();
    assert.equal(h.player.health,16);
    assert.equal(h.landmarks.serialize().used.length,1);
    claim.listeners.click();
    assert.equal(h.player.health,16,'second click does not heal again');
    assert.equal(h.saved,2,'one save for authentic discovery and one for benefit');
    const data=JSON.parse(JSON.stringify(h.landmarks.serialize()));
    h.landmarks.load(data);h.landmarks.update(3);
    assert.equal(h.landmarks.interact(),true);
    const later=h.panel.children.find(e=>e.className==='fc-landmark-benefit');
    assert.equal(later.disabled,true,'benefit stays used after saving/loading');
    h.game.world={seed:51,gen:h.world.gen};h.landmarks.load(null);
    assert.equal(h.landmarks.visitedCount,0,'another world has separate discoveries');
    assert.deepEqual(h.landmarks.serialize(),safeWinterLandmarks(null));
    assert.equal(h.game.scene.children.length,0,'old 3D models are removed');
  }finally{h.close();}
});
test('landmarks cannot be remotely inspected or used while paused/dead/creative',()=>{
  const h=harness();try{
    h.landmarks.load(null);h.landmarks.update(3);
    assert.equal(h.landmarks.interact(),false,'remote interaction requires proximity');
    const site=h.landmarks.sites.find(x=>x.id==='starter');
    assert.ok(site);
    h.player.x=site.x;h.player.y=site.y;h.player.z=site.z;
    h.player.dead=true;assert.equal(h.landmarks.interact(),false);
    h.player.dead=false;h.game.paused=true;assert.equal(h.landmarks.interact(),false);
    h.game.paused=false;h.player.creative=true;
    assert.equal(h.landmarks.interact(),true,
      'Creative players can read lore, without receiving a Survival perk');
    const action=h.panel.children.find(e=>e.className==='fc-landmark-benefit');
    assert.equal(action.disabled,true);
    assert.equal(h.landmarks.serialize().used.length,0);
    assert.equal(h.player.health,10);
  }finally{h.close();}
});
