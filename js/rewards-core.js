// FlurryCraft Rewards Hub: OFFLINE GAME POINTS ONLY.
// Browser saves can be modified. Nothing in this module authorizes or pays SUI.
export const REWARD_SCHEMA=1;
export const CRYPTO_REWARDS_ENABLED=false;
export const MILESTONES=Object.freeze([
  {id:'lv10',title:'Reach Level 10',kind:'level',target:10,points:100},
  {id:'lv20',title:'Reach Level 20',kind:'level',target:20,points:200},
  {id:'lv30',title:'Reach Level 30',kind:'level',target:30,points:300},
  {id:'lv40',title:'Reach Level 40',kind:'level',target:40,points:400},
  {id:'lv50',title:'Reach Level 50',kind:'level',target:50,points:500},
  {id:'lv75',title:'Reach Level 75',kind:'level',target:75,points:750},
  {id:'lv100',title:'Reach Level 100',kind:'level',target:100,points:1000},
  {id:'frost',title:'Clear Frost Ruins',kind:'frost',target:1,points:75},
  {id:'storm',title:'Clear Stormspire Keep',kind:'storm',target:1,points:125},
  {id:'aurora',title:'Clear Aurora Citadel',kind:'aurora',target:1,points:200},
  {id:'abyss',title:'Clear Frostbound Abyss',kind:'abyss',target:1,points:300},
]);
export const DAILY_MISSIONS=Object.freeze([
  {id:'daily-monsters',title:'Defeat 3 monsters',kind:'kills',target:3,points:20},
  {id:'daily-build',title:'Place 10 blocks',kind:'blocks',target:10,points:25},
  {id:'daily-dungeon',title:'Clear a dungeon',kind:'clears',target:1,points:75},
]);
export const WEEKLY_MISSIONS=Object.freeze([
  {id:'weekly-monsters',title:'Defeat 20 monsters',kind:'kills',target:20,points:150},
  {id:'weekly-build',title:'Place 60 blocks',kind:'blocks',target:60,points:120},
  {id:'weekly-dungeons',title:'Clear 2 dungeons',kind:'clears',target:2,points:200},
]);
const num=(v,max=1000000)=>Number.isFinite(v)?Math.min(max,Math.max(0,Math.floor(v))):0;
const dictionary=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const utcDay=now=>new Date(now).toISOString().slice(0,10);
const utcWeek=now=>{const date=new Date(now);date.setUTCHours(0,0,0,0);
  date.setUTCDate(date.getUTCDate()-((date.getUTCDay()+6)%7));
  return date.toISOString().slice(0,10);};
const STAT_CAP=1000000;
export function rewardTotals(adventure){
  const p=dictionary(adventure);
  const frost=num(p.clears,STAT_CAP),storm=num(p.storm?.clears,STAT_CAP);
  const aurora=num(p.aurora?.clears,STAT_CAP),abyss=num(p.abyss?.clears,STAT_CAP);
  return {level:Math.max(1,Math.min(100,num(p.level,100))),
    kills:num(p.kills,STAT_CAP),clears:Math.min(STAT_CAP,frost+storm+aurora+abyss),
    frost,storm,aurora,abyss};
}
function baseline(source,totals){
  const s=dictionary(source);
  return {kills:Math.min(totals.kills,num(s.kills,STAT_CAP)),
    clears:Math.min(totals.clears,num(s.clears,STAT_CAP))};
}
export function createRewardsState(raw,adventure,now=Date.now()){
  const total=rewardTotals(adventure),r=dictionary(raw),day=utcDay(now),week=utcWeek(now);
  const valid=r.version===REWARD_SCHEMA;
  const priorClaimed=dictionary(valid?r.claimed:null),claimed=Object.create(null);
  // Retain permanent milestones and only the current day/week claim IDs.
  // This prevents re-claiming old milestones after hundreds of daily missions.
  for(const [id,flag] of Object.entries(priorClaimed).slice(-4000)){
    if(!(id.startsWith('once:')||id.startsWith('daily:'+day+':')||id.startsWith('weekly:'+week+':')))continue;
    if(/^(?:once:[a-z0-9-]+|daily:\d{4}-\d{2}-\d{2}:[a-z0-9-]+|weekly:\d{4}-\d{2}-\d{2}:[a-z0-9-]+)$/.test(id) &&flag===true)
      claimed[id]=true;
  }
  const oldDay=valid&&r.day===day,oldWeek=valid&&r.week===week;
  return {version:REWARD_SCHEMA,claimed,points:num(valid?r.points:0,10000000),
    history:Array.isArray(r.history)?r.history.filter(h=>h&&typeof h==='object'&&
      typeof h.id==='string'&&typeof h.title==='string'&&Number.isInteger(h.points)&&
      h.points>0&&h.points<=1000).slice(-60).map(h=>({
      id:h.id.slice(0,80),title:h.title.slice(0,100),points:h.points,at:num(h.at,8.64e15)})):[],
    day,week,
    dayBase:baseline(oldDay?r.dayBase:total,total),
    weekBase:baseline(oldWeek?r.weekBase:total,total),
    dailyBlocks:oldDay?num(r.dailyBlocks,500):0,
    weeklyBlocks:oldWeek?num(r.weeklyBlocks,2000):0};
}
export function rewardCards(state,adventure,creative=false,now=Date.now()){
  const s=createRewardsState(state,adventure,now),totals=rewardTotals(adventure);
  const progress=(m)=>{
    if(m.kind==='blocks')return m.id.startsWith('daily')?s.dailyBlocks:s.weeklyBlocks;
    if(m.kind==='kills'||m.kind==='clears'){
      const base=m.id.startsWith('daily')?s.dayBase:s.weekBase;
      return Math.max(0,totals[m.kind]-base[m.kind]);
    }
    return totals[m.kind]||0;
  };
  const convert=(m,key)=>({
    ...m,key,progress:Math.min(m.target,progress(m)),claimed:!!s.claimed[key],
    ready:!creative&&!s.claimed[key]&&progress(m)>=m.target
  });
  return {
    state:s,totals,
    milestones:MILESTONES.map(m=>convert(m,'once:'+m.id)),
    daily:DAILY_MISSIONS.map(m=>convert(m,'daily:'+s.day+':'+m.id)),
    weekly:WEEKLY_MISSIONS.map(m=>convert(m,'weekly:'+s.week+':'+m.id)),
    sandbox:!!creative,cryptoEnabled:CRYPTO_REWARDS_ENABLED
  };
}
export function recordRewardPlacement(state,adventure,now=Date.now()){
  const s=createRewardsState(state,adventure,now);
  s.dailyBlocks=Math.min(500,s.dailyBlocks+1);
  s.weeklyBlocks=Math.min(2000,s.weeklyBlocks+1);
  return s;
}
export function collectLocalPoints(state,adventure,key,creative=false,now=Date.now()){
  const snap=rewardCards(state,adventure,creative,now);
  const item=[...snap.milestones,...snap.daily,...snap.weekly].find(x=>x.key===key);
  if(!item||!item.ready)throw new Error('Mission has not been completed or was already collected.');
  const s=snap.state;
  if(s.points+item.points>10000000)throw new Error('Local points limit reached.');
  s.claimed[item.key]=true;s.points+=item.points;
  s.history.push({id:item.key,title:item.title,points:item.points,at:now});
  if(s.history.length>60)s.history.splice(0,s.history.length-60);
  return s;
}
// An intentional hard stop. A backend-signed, funded, replay-resistant
// Mainnet claim must be implemented separately. Never convert local points.
export function requestCryptoPayout(){throw new Error(
  'Crypto payouts are unavailable. Local browser achievements are not verified and the reward treasury is not funded.');}
