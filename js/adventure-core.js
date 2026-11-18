// FlurryCraft Adventure progression. Pure, deterministic rules, no renderer.
// The 1–100 XP curve is defined here; Chapter 1 plays at 1–10, Chapter 2 at 11–20.
export const MAX_LEVEL=100;
export const CHAPTER_CAP=10;
export const STORM_CAP=20;
export const FROST_CREATURES=Object.freeze({
  frostling: Object.freeze({name:'Frostling',minLevel:1,xp:16}),
  snow_prowler: Object.freeze({name:'Snow Prowler',minLevel:3,xp:22}),
  glacier_guardian: Object.freeze({name:'Glacier Guardian',minLevel:8,xp:110,boss:true}),
  storm_hound: Object.freeze({name:'Storm Hound',minLevel:11,xp:35,chapter:2}),
  rime_knight: Object.freeze({name:'Rime Knight',minLevel:14,xp:48,chapter:2}),
  blizzard_titan: Object.freeze({name:'Blizzard Titan',minLevel:18,xp:240,boss:true,chapter:2}),
});
export function xpToNext(level){
  const n=Math.max(1,Math.min(MAX_LEVEL,Math.floor(Number(level)||1)));
  return n===MAX_LEVEL?0:Math.round(35+n*19+n*n*.8);
}
export function safeAdventure(raw){
  const a=raw&&typeof raw==='object'?raw:{};
  const clamp=(v,low,high,otherwise=low)=>Number.isFinite(v)?Math.max(low,Math.min(high,Math.floor(v))):otherwise;
  const level=clamp(a.level,1,MAX_LEVEL);
  const xp=level===MAX_LEVEL?0:clamp(a.xp,0,xpToNext(level)-1);
  const pos=a.den&&[a.den.x,a.den.y,a.den.z].every(Number.isFinite)&&
    Math.abs(a.den.x)<1000000&&Math.abs(a.den.z)<1000000?
    {x:Math.floor(a.den.x),y:Math.max(2,Math.min(88,Math.floor(a.den.y))),z:Math.floor(a.den.z)}:null;
  const stormRaw=a.storm&&typeof a.storm==='object'?a.storm:{};
  const s=stormRaw.site;
  const stormSite=s&&[s.x,s.y,s.z].every(Number.isInteger)&&
    Math.abs(s.x)<1000000&&Math.abs(s.z)<1000000&&s.y>=2&&s.y<=85?
    {x:s.x,y:s.y,z:s.z}:null;
  const storm={site:stormSite,built:!!stormSite&&!!stormRaw.built,
    version:stormSite&&stormRaw.built?clamp(stormRaw.version,0,1):0,
    clears:clamp(stormRaw.clears,0,10000)};
  const beacons=Array.isArray(a.beacons)?a.beacons.slice(0,40).filter(b=>b&&
    [b.x,b.y,b.z].every(Number.isInteger)&&Math.abs(b.x)<1000000&&
    Math.abs(b.z)<1000000&&b.y>0&&b.y<96).map(b=>({x:b.x,y:b.y,z:b.z,
      tier:Number.isFinite(b.tier)?Math.max(1,Math.min(3,Math.floor(b.tier))):1})):[];
  return {level,xp,kills:clamp(a.kills,0,100000),clears:clamp(a.clears,0,10000),
    den:pos,denBuilt:!!a.denBuilt&&!!pos,
    dungeonVersion:!!pos&&!!a.denBuilt?clamp(a.dungeonVersion,0,2,0):0,
    swordClaimed:!!a.swordClaimed,storm,
    castle:a.castle&&typeof a.castle==='object'?{
      wins:clamp(a.castle.wins,0,100000),losses:clamp(a.castle.losses,0,100000),
      bestTier:clamp(a.castle.bestTier,0,3),version:1
    }:{wins:0,losses:0,bestTier:0,version:1},beacons};
}
export function grantXP(state,amount) {
  const next=safeAdventure(state),gain=Math.max(0,Math.min(2000,Math.floor(Number(amount)||0)));
  let climbed=0;next.xp+=gain;
  while(next.level<MAX_LEVEL&&next.xp>=xpToNext(next.level)){
    next.xp-=xpToNext(next.level);next.level++;climbed++;
  }
  if(next.level===MAX_LEVEL)next.xp=0;
  return {...next,levelsGained:climbed};
}
export function winterMobLevel(playerLevel,kind,roll=0.5){
  const low=FROST_CREATURES[kind]?.minLevel||1;
  const cap=FROST_CREATURES[kind]?.chapter===2?STORM_CAP:CHAPTER_CAP;
  const p=Math.max(1,Math.min(cap,Math.floor(playerLevel)||1));
  const delta=Math.max(0,Math.min(1,Number(roll)||0))<.76?0:1;
  return Math.max(low,Math.min(cap,p+delta));
}
export function chooseWinterMob(playerLevel,roll=0.5){
  const p=Math.max(1,Math.floor(Number(playerLevel)||1));
  const r=Math.max(0,Math.min(.99999,Number(roll)||0));
  if(p>=18&&r>.982)return 'blizzard_titan';
  if(p>=14&&r>.82)return 'rime_knight';
  if(p>=11&&r>.55)return 'storm_hound';
  if(p>=8&&r>.965)return 'glacier_guardian';
  if(p>=3&&r>.48)return 'snow_prowler';
  return 'frostling';
}
export function trialWaves(level=1){
  const n=Math.max(1,Math.min(CHAPTER_CAP,Math.floor(level)||1));
  return [
    [{kind:'frostling',level:Math.min(4,n+1)},{kind:'frostling',level:Math.min(4,n+1)}],
    [{kind:'snow_prowler',level:Math.max(3,Math.min(7,n+2))},
     {kind:'frostling',level:Math.max(2,Math.min(6,n+1))}],
    [{kind:'glacier_guardian',level:Math.max(8,Math.min(10,n+3))}]
  ];
}
// Chapter 2 uses a gentler curve so one dungeon clear does not skip ten levels.
export function winterKillXP(kind,level){
  const creature=FROST_CREATURES[kind];
  const base=creature?.xp||8;
  const n=Math.max(1,Math.min(STORM_CAP,Math.floor(Number(level)||1)));
  const multiplier=creature?.chapter===2?1+Math.max(0,n-10)*.22:Math.max(1,n*.6);
  return Math.floor(base*multiplier);
}
export function stormspireWaves(level=10){
  const n=Math.max(10,Math.min(STORM_CAP,Math.floor(level)||10));
  return [
    [{kind:'storm_hound',level:Math.max(11,Math.min(16,n+1))},
     {kind:'storm_hound',level:Math.max(11,Math.min(16,n+1))}],
    [{kind:'rime_knight',level:Math.max(14,Math.min(18,n+2))},
     {kind:'storm_hound',level:Math.max(12,Math.min(17,n+1))}],
    [{kind:'blizzard_titan',level:Math.max(16,Math.min(20,n+3))}]
  ];
}
export function trialLocation(spawn,gen){
  // Try multiple nearby patches rather than generating over the player's home.
  const baseX=Math.floor(spawn.x),baseZ=Math.floor(spawn.z);
  const candidates=[[31,17],[-31,19],[25,-28],[-29,-26],[40,4],[-40,-4]];
  let best=null,score=Infinity;
  for(const [dx,dz] of candidates){
    const x=baseX+dx,z=baseZ+dz;
    let lo=Infinity,hi=-Infinity,wet=false;
    for(let i=-6;i<=6;i+=3)for(let j=-6;j<=6;j+=3){
      const col=gen.column(x+i,z+j);
      lo=Math.min(lo,col.h);hi=Math.max(hi,col.h);
      if(col.h<=32)wet=true;
    }
    if(wet)continue;
    const difficulty=hi-lo;
    if(difficulty<score){score=difficulty;best={x,y:Math.max(35,Math.min(84,hi+1)),z};}
  }
  return best;
}
export function ruinBlocks(center){
  const out=[],{x,y,z}=center;
  const put=(dx,dy,dz,id)=>out.push([x+dx,y+dy,z+dz,id]);
  // 13x13 exposed outdoor dungeon: flat ice/stone platform, four ruin
  // pillars, braziers, a low wall and a walkable open entrance facing home.
  for(let dx=-6;dx<=6;dx++)for(let dz=-6;dz<=6;dz++){
    put(dx,-1,dz,(Math.abs(dx)>=5||Math.abs(dz)>=5)?35:29); // floor
    const edge=Math.abs(dx)===6||Math.abs(dz)===6;
    if(edge&&!(dz===-6&&Math.abs(dx)<=2)&&!(dx===-6&&Math.abs(dz)<=1)){
      put(dx,0,dz,35);
      if((Math.abs(dx)===6&&Math.abs(dz)>=4)||(Math.abs(dz)===6&&Math.abs(dx)>=4))
        put(dx,1,dz,79);
    }
  }
  for(const dx of [-4,4])for(const dz of [-4,4]){
    put(dx,0,dz,35);put(dx,1,dz,79);put(dx,2,dz,29);
    put(dx,3,dz,22); // torchlight at ruin pillars
  }
  for(const [dx,dz] of [[0,0],[2,2],[-2,-2]])put(dx,-1,dz,79);
  return out;
}
export function withinWard(x,z,beacons,radius=10){
  for(const b of beacons||[])if(Math.hypot(b.x+.5-x,b.z+.5-z)<=radius)return true;
  return false;
}
