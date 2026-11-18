import test from 'node:test';
import assert from 'node:assert/strict';
import {initRewardsHub} from '../js/rewards-ui.js';

class Element{
  constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.style={};
    this.className='';this.textContent='';this.listeners={};this.hidden=false;
    this.disabled=false;this.attributes={};this.dataset={};
    this.classList={toggle(){},add(){},remove(){}};}
  appendChild(child){this.children.push(child);return child;}
  setAttribute(k,v){this.attributes[k]=v;}
  addEventListener(type,fn){this.listeners[type]=fn;}
  replaceChildren(...nodes){this.children=nodes;}
  findText(text){
    if(this.textContent?.includes(text))return this;
    for(const c of this.children){const n=c.findText?.(text);if(n)return n;}
    return null;
  }
}
const NOW=Date.parse('2026-11-18T12:00:00Z');
function harness(){
  const original=globalThis.document;
  const head=new Element('head'),body=new Element('body'),panel=new Element('section');
  globalThis.document={head,body,createElement:tag=>new Element(tag),
    getElementById:()=>null};
  const p={creative:false,dead:false};
  const progress={level:1,kills:0,clears:0,storm:{clears:0},
    aurora:{clears:0},abyss:{clears:0}};
  let xp=0,saves=0;
  const notes=[],events=[],routes=[];
  const game={state:'play',paused:false,player:p,ui:{isOpen:false},
    adventure:{serialize:()=>structuredClone(progress),
      awardExpeditionXP(amount){xp+=amount;return !p.creative&&!p.dead;}},
    saveRewards(){saves++;return true;}};
  const hub=initRewardsHub({game,panel,openDialog(){panel.replaceChildren();},
    notify:(_,msg)=>notes.push(msg),onOpenMarketplace(){},
    onNavigate:place=>routes.push(place),onExpeditionEvent:ev=>events.push(ev)});
  return {game,hub,p,progress,notes,events,routes,
    get xp(){return xp;},get saves(){return saves;},
    close(){globalThis.document=original;}};
}
test('NPC and Hub share the exact one-time accept/claim progression path',()=>{
  const h=harness();try{
    const {hub,progress,events}=h;
    hub.load(null);
    assert.equal(hub.current().mission.id,'frost-patrol');
    hub.acceptMission('frost-patrol');
    assert.equal(hub.current().mission.active,true);
    assert.equal(events.length,1);
    assert.equal(events[0].type,'accepted');
    assert.throws(()=>hub.acceptMission('frost-patrol'),/Finish your current/);
    assert.throws(()=>hub.claimMission('frost-patrol'),/incomplete/);
    progress.kills=3;
    assert.equal(hub.current().mission.ready,true);
    const result=hub.claimMission('frost-patrol');
    assert.equal(result.points,35);
    assert.equal(hub.points,35);
    assert.equal(h.xp,45);
    assert.equal(h.saves,2);
    assert.equal(events.length,2);
    assert.equal(events.at(-1).type,'completed');
    assert.throws(()=>hub.claimMission('frost-patrol'),/incomplete/);
    assert.equal(hub.points,35);
    assert.equal(h.xp,45);
    assert.equal(hub.current().mission.id,'winter-shelter');
    const backup=hub.serialize();
    hub.load(JSON.parse(JSON.stringify(backup)));
    assert.equal(hub.current().mission.id,'winter-shelter');
    assert.equal(hub.points,35);
    assert.equal(hub.current().state.claimed.length,1);
  }finally{h.close();}
});
test('blocked or Creative gameplay cannot use Lofi to bypass mission gates',()=>{
 const h=harness();try{
   h.hub.load(null);
   h.p.creative=true;
   assert.throws(()=>h.hub.acceptMission('frost-patrol'),/Survival/);
   h.p.creative=false;h.p.dead=true;
   assert.throws(()=>h.hub.acceptMission('frost-patrol'),/living Survival/);
   h.p.dead=false;h.game.paused=true;
   assert.throws(()=>h.hub.acceptMission('frost-patrol'),/living Survival/);
   h.game.paused=false;h.hub.acceptMission('frost-patrol');
   h.progress.kills=3;h.p.creative=true;
   assert.throws(()=>h.hub.claimMission('frost-patrol'),/incomplete/);
   assert.equal(h.xp,0);assert.equal(h.hub.points,0);
 }finally{h.close();}
});
test('quest-guidance only navigates for real active dungeon contracts',()=>{
 const h=harness();try{
   h.hub.load(null);
   assert.equal(h.hub.guideMission(),false);
   assert.deepEqual(h.routes,[]);
   // A legacy save with the two earlier contracts completed can begin
   // the dungeon contract without claiming anything during this test.
   h.hub.load({version:1,points:80,day:'2026-11-18',
     expedition:{claimed:['frost-patrol','winter-shelter'],
       active:'ruins-expedition',base:{kills:0,clears:0},blocks:0}});
   h.progress.den={x:64,z:120};
   assert.equal(h.hub.guideMission(),true);
   assert.equal(h.routes.length,1);
   assert.equal(h.routes[0].x,64);
   assert.equal(h.routes[0].z,114);
   assert.equal(h.hub.points,80);
 }finally{h.close();}
});

test('Winter Trials record real hooks, batch walking, persist and honor player state',()=>{
  const h=harness();try{
    h.hub.load(null);
    h.hub.recordParry();
    h.hub.recordParry();
    let ledger=h.hub.serialize();
    assert.equal(ledger.dailyParries,2);
    assert.equal(ledger.weeklyParries,2);
    assert.equal(h.hub.winterTrials().ready,1,'Lofi sees parry trial ready');
    assert.ok(h.notes.some(n=>n.includes('Daily Sword Trial')));

    // Several real frame-sized steps are batched before writing saved state.
    for(let i=0;i<12;i++)h.hub.recordTravel(.25,.05);
    ledger=h.hub.serialize();
    assert.equal(ledger.dailyTravel,3);
    assert.equal(ledger.weeklyTravel,3);
    assert.equal(h.hub.points,0,'progress never auto-pays local points');

    h.hub.recordTravel(99,.05); // Teleport-sized delta
    h.hub.recordTravel(.25,2); // Background stall
    assert.equal(h.hub.serialize().dailyTravel,3);

    h.p.creative=true;h.hub.recordParry();h.hub.recordTravel(.2,.05);
    h.p.creative=false;h.p.dead=true;
    h.hub.recordParry();h.hub.recordTravel(.2,.05);
    h.p.dead=false;h.game.paused=true;
    h.hub.recordParry();h.hub.recordTravel(.2,.05);
    h.game.paused=false;
    assert.equal(h.hub.serialize().dailyParries,2);
    assert.equal(h.hub.serialize().dailyTravel,3);
    const prior=h.hub.serialize();
    h.hub.load(JSON.parse(JSON.stringify(prior)));
    assert.equal(h.hub.serialize().dailyParries,2);
    assert.equal(h.hub.serialize().dailyTravel,3);
    assert.equal(h.hub.winterTrials().ready,1);
  }finally{h.close();}
});
test('Winter Trial travel buffer cannot leak when the player switches worlds',()=>{
  const h=harness();try{
    h.hub.load(null);
    h.hub.recordTravel(.25,.05);
    h.hub.recordTravel(.25,.05);
    h.hub.load(null);
    assert.equal(h.hub.serialize().dailyTravel,0);
    h.hub.recordTravel(.2,.05);
    assert.equal(h.hub.serialize().dailyTravel,.2);
  }finally{h.close();}
});
