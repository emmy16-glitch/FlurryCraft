// Expedition Contracts: sequential, one-time OFFLINE adventure missions.
// Not blockchain verification: progress and points remain local browser data.
export const EXPEDITION_STEPS=Object.freeze([
  Object.freeze({id:'frost-patrol',title:'Frost Patrol',detail:'Defeat 3 winter creatures in Survival',kind:'kills',target:3,points:35,xp:45}),
  Object.freeze({id:'winter-shelter',title:'Build a Winter Shelter',detail:'Place 12 blocks yourself in Survival',kind:'blocks',target:12,points:45,xp:55}),
  Object.freeze({id:'ruins-expedition',title:'Ruins Expedition',detail:'Clear any winter dungeon after accepting',kind:'clears',target:1,points:90,xp:130}),
  Object.freeze({id:'frost-veteran',title:'Winter Veteran',detail:'Defeat 10 more winter creatures',kind:'kills',target:10,points:110,xp:140}),
]);
const capped=(n,max)=>Number.isFinite(n)?Math.max(0,Math.min(max,Math.floor(n))):0;
const obj=o=>o&&typeof o==='object'&&!Array.isArray(o)?o:{};
const MAX_STAT=1000000;
export function safeExpedition(raw,totals){
  const r=obj(raw),t=obj(totals);
  const claimed=[],prior=Array.isArray(r.claimed)?r.claimed:[];
  // Only a strict prefix of ordered completed contracts is valid.
  for(const mission of EXPEDITION_STEPS){
    if(prior[claimed.length]!==mission.id)break;
    claimed.push(mission.id);
  }
  const next=EXPEDITION_STEPS[claimed.length];
  const active=next&&r.active===next.id?next.id:null;
  const base=obj(r.base);
  return {
    claimed,active,
    base:{kills:Math.min(capped(t.kills,MAX_STAT),capped(base.kills,MAX_STAT)),
      clears:Math.min(capped(t.clears,MAX_STAT),capped(base.clears,MAX_STAT))},
    blocks:active&&next.kind==='blocks'?capped(r.blocks,next.target):0
  };
}
export function expeditionCard(state,totals,creative=false){
  const s=safeExpedition(state,totals);
  const next=EXPEDITION_STEPS[s.claimed.length]||null;
  if(!next)return {state:s,mission:null,done:true,total:EXPEDITION_STEPS.length};
  const active=s.active===next.id;
  const current=next.kind==='blocks'?s.blocks:
    Math.max(0,capped(totals?.[next.kind],MAX_STAT)-s.base[next.kind]);
  const progress=active?Math.min(next.target,current):0;
  return {state:s,mission:{...next,progress,ready:active&&!creative&&progress>=next.target,
    active,available:!active&&!creative,claimed:false,index:s.claimed.length+1},
    done:false,total:EXPEDITION_STEPS.length};
}
export function acceptExpedition(state,totals,id,creative=false){
  const card=expeditionCard(state,totals,creative);
  if(creative)throw new Error('Expeditions require Survival Mode.');
  if(card.done)throw new Error('All expeditions have already been completed.');
  if(card.mission.id!==id||card.state.active)
    throw new Error('Finish your current expedition before accepting another.');
  return {...card.state,active:id,
    base:{kills:capped(totals?.kills,MAX_STAT),clears:capped(totals?.clears,MAX_STAT)},blocks:0};
}
export function recordExpeditionPlacement(state,totals){
  const s=safeExpedition(state,totals),next=EXPEDITION_STEPS[s.claimed.length];
  if(s.active!==next?.id||next.kind!=='blocks')return s;
  return {...s,blocks:Math.min(next.target,s.blocks+1)};
}
export function finishExpedition(state,totals,id,creative=false){
  const card=expeditionCard(state,totals,creative),mission=card.mission;
  if(!mission||!mission.ready||mission.id!==id)
    throw new Error('Expedition is incomplete or already claimed.');
  return {mission,state:{
    claimed:[...card.state.claimed,id],active:null,base:{kills:0,clears:0},blocks:0
  }};
}
