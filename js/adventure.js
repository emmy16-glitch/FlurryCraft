// FlurryCraft Adventure: Frost Ruins (1–10) and Stormspire Keep (11–20),
// winter-specific enemy rewards and real protective Winter Ward blocks.
// Future chapters can reuse the 1–100 rules without cluttering gameplay.
import { xpToNext,safeAdventure,grantXP,trialLocation,ruinBlocks,
  FROST_CREATURES,winterMobLevel,winterKillXP,trialWaves,stormspireWaves,withinWard,chooseWinterMob }
from './adventure-core.js';
import { DUNGEON_VERSION,ROOM_NAMES,ROOM_OFFSETS,chamberPosition,dungeonEntrance,
 withinDungeonEntry,enteredChamber,generateFrostDungeon } from './frost-dungeon.js';
import { aimedCreature,actionForTarget } from './combat-hud-core.js';
import { STORM_VERSION,STORM_UNLOCK_LEVEL,STORM_ROOM_NAMES,STORM_ROOM_OFFSETS,
  STORM_FOOTPRINT,stormRoom,nearStormGate,inStormRoom,stormSite,generateStormspire }
  from './stormspire-dungeon.js';
import { survivalVitals,checkFrostRecovery,recoveredHealth,
  FROST_RECOVERY_COST,FROST_RECOVERY_COOLDOWN } from './winter-survival-core.js';
import {MAX_WARD_TIER,WARD_COSTS,WARD_CONFIG,REPAIR_COST,REPAIR_INTEGRITY,
  SIEGE_REWARDS,wardKey,wardTier,wardStats,wardContains,canUpgradeWard,
  siegeWaves,canStartSiege} from './castle-defense-core.js';

export function initAdventure({game,B,openDialog,closeDialog,panel,notify,explorer,isInterfaceBusy=()=>false}) {
  let progress=safeAdventure(),world=null,denPending=false,buildPlan=[],buildIndex=0;
  let trial=null,nextRun=0,levelNoticeTime=0,lastTargetStamp='',lastTouchMode='';
  let entryLabel='',lastDungeonStatus='';
  let recoveryCooldown=0,vitalsTick=0,lastVitals='';
  let siege=null,siegeCounter=0,wardFireAcc=0,wardCooldowns=new Map();
  let stormPending=false,stormBuildPlan=[],stormBuildIndex=0,entryChapter='frost';
  const make=(tag,text,parent=panel)=>{
    const n=document.createElement(tag);if(text!==undefined)n.textContent=text;
    parent.appendChild(n);return n;
  };
  const button=(label,callback,parent=panel)=>{
    const el=make('button',label,parent);el.type='button';el.addEventListener('click',callback);return el;
  };
  const css=make('style',undefined,document.head);
  css.textContent=[
    '#fcAdventurePill{position:fixed;z-index:27;top:62px;left:12px;display:none;align-items:center;gap:8px;min-height:31px;padding:6px 10px;border:1px solid #386f87;border-radius:11px;background:#092d41eb;color:#e9faff;font:800 11px/1 system-ui;pointer-events:auto;backdrop-filter:blur(8px);cursor:pointer;touch-action:manipulation;box-shadow:0 4px 14px #001b2a55}',
    '#fcAdventurePill:focus-visible{outline:2px solid #b0f6ff;outline-offset:2px}',
    '#fcAdventurePill .fc-xp-meter{width:50px;height:3px;background:#355a71;border-radius:3px;overflow:hidden}',
    '#fcAdventurePill .fc-xp-fill{width:0;height:100%;background:#91eaf6;transition:width .18s ease}',
    '#fcEnemyHealth{position:fixed;z-index:18;top:54px;left:50%;transform:translateX(-50%);width:min(224px,47vw);padding:8px 11px 9px;background:#0b2d41e8;border:1px solid #50859d;border-radius:12px;box-shadow:0 5px 20px #001b2970;backdrop-filter:blur(7px);pointer-events:none;color:#edfbff}',
    '#fcEnemyHealth[hidden],#fcLevelNotice[hidden]{display:none!important}',
    '#fcEnemyHealth .fc-enemy-header{display:flex;align-items:baseline;justify-content:space-between;gap:8px;font:750 12px/1.3 system-ui}',
    '#fcEnemyHealth .fc-enemy-lv{font:700 10px system-ui;color:#a8cfe2;white-space:nowrap}',
    '#fcEnemyHealth .fc-enemy-track{height:5px;margin-top:6px;border-radius:5px;background:#2e4d60;overflow:hidden}',
    '#fcEnemyHealth .fc-enemy-fill{height:100%;width:100%;background:#a0e6f3;transition:width .12s linear}',
    '#fcEnemyHealth.boss{border-color:#b69a67}#fcEnemyHealth.boss .fc-enemy-fill{background:#edcb8a}',
    '#fcEnemyHealth .fc-enemy-count{margin-top:4px;text-align:right;font:600 10px system-ui;color:#a6c6d5}',
    '#fcEnemyHealth.is-hit{border-color:#a7f1f9;box-shadow:0 0 0 2px #8aebff33,0 4px 20px #001b2b75}',
    '#fcSurvivalVitals{position:fixed;z-index:27;top:100px;left:12px;display:none;width:184px;max-width:38vw;padding:8px 10px;border:1px solid #467d90;border-radius:11px;background:#0b2e42e9;color:#eafaff;backdrop-filter:blur(7px);pointer-events:auto;box-shadow:0 4px 14px #00182565}',
    '#fcSurvivalVitals .fc-vital-row{display:flex;align-items:center;justify-content:space-between;gap:8px;font:800 11px/1.4 system-ui}',
    '#fcSurvivalVitals .fc-vital-food{font:600 9px/1 system-ui;color:#aed1df}',
    '#fcSurvivalVitals .fc-hp-track{height:5px;margin-top:5px;overflow:hidden;border-radius:4px;background:#244c60}',
    '#fcSurvivalVitals .fc-hp-fill{height:100%;width:100%;background:#73d7cf;transition:width .2s linear}',
    '#fcSurvivalVitals.critical{border-color:#fb9a9a}#fcSurvivalVitals.critical .fc-hp-fill{background:#ff8585}',
    '#fcSurvivalVitals .fc-heal{display:block;width:100%;margin-top:6px;padding:5px 8px;border:1px solid #91dae5;border-radius:7px;background:#20566b;color:#e0f9ff;font:800 10px system-ui;touch-action:manipulation;cursor:pointer}',
    '#fcSurvivalVitals .fc-heal.ready{background:#9ae9ee;color:#063247;border-color:#c7fbff}',
    '#fcSiegeHUD{position:fixed;z-index:28;left:12px;top:185px;max-width:min(248px,40vw);border:1px solid #79d1e9;border-radius:12px;padding:8px 11px;background:#0a3046ed;color:#f1fdff;font:750 11px/1.4 system-ui;display:none;pointer-events:auto;box-shadow:0 8px 22px #001d2e88}',
    '#fcSiegeHUD .fc-siege-row{display:flex;gap:5px;margin-top:6px}',
    '#fcSiegeHUD button{min-height:32px;padding:5px 8px;border:1px solid #7fbcd0;background:#23526a;color:#eaf9ff;border-radius:8px;font:750 10px system-ui;touch-action:manipulation}',
    '#fcSiegeHUD button:disabled{opacity:.52}',
    '@media(max-height:520px){#fcSiegeHUD{top:171px;left:7px;max-width:35vw;padding:6px 8px}#fcSiegeHUD button{min-height:27px;padding:4px}}',
    '#fcDungeonEntry{position:fixed;z-index:27;top:179px;left:12px;display:none;min-height:43px;max-width:min(200px,46vw);padding:9px 13px;background:#88dce9;border:1px solid #bdf8ff;border-radius:12px;color:#092f42;font:800 12px system-ui;box-shadow:0 5px 20px #001b2b86;cursor:pointer;touch-action:manipulation}',
    '#fcDungeonEntry:focus-visible{outline:2px solid #e8ffff;outline-offset:2px}',
    '#fcDungeonStatus{position:fixed;z-index:25;top:12px;left:50%;transform:translateX(-50%);display:none;max-width:45vw;min-width:140px;padding:7px 12px;background:#0b3348df;border:1px solid #5087a0;border-radius:12px;color:#e8fbff;text-align:center;font:750 11px system-ui;pointer-events:none;backdrop-filter:blur(7px)}',
    '#fcLevelNotice{position:fixed;z-index:32;left:50%;top:72px;transform:translateX(-50%);min-width:164px;max-width:min(255px,60vw);padding:12px 19px;border:1px solid #a4ebf3;border-radius:15px;background:linear-gradient(160deg,#256581f5,#0a324be9);color:#f4feff;box-shadow:0 12px 32px #001b2b9c;text-align:center;pointer-events:none;animation:fcLevelEnter .3s ease-out}',
    '#fcLevelNotice strong{display:block;font:900 12px system-ui;letter-spacing:.16em;color:#a7f4ff}',
    '#fcLevelNotice span{display:block;margin-top:3px;font:900 22px/1.2 system-ui}',
    '@keyframes fcLevelEnter{from{opacity:0;transform:translate(-50%,-9px) scale(.96)}to{opacity:1;transform:translate(-50%,0) scale(1)}}',
    '#flurryModal .fc-level-overview{border:1px solid #417f96;border-radius:15px;background:#133b52;padding:14px;margin:10px 0 13px}',
    '#flurryModal .fc-level-top{display:flex;align-items:center;justify-content:space-between;gap:9px}',
    '#flurryModal .fc-level-top strong{color:#f3fcff;font:900 22px/1.2 system-ui}',
    '#flurryModal .fc-level-top span{font:700 11px system-ui;color:#aed1df}',
    '#flurryModal .fc-level-overview .fc-adventure-meter{margin:12px 0 5px;height:7px}',
    '#flurryModal .fc-level-overview .fc-level-xp{font:600 11px system-ui;color:#afd2e0}',
    '#flurryModal .fc-level-stats{display:flex;gap:18px;border-top:1px solid #2e5c72;margin-top:12px;padding-top:10px}',
    '#flurryModal .fc-level-stats span{font:600 11px system-ui;color:#b9d7e3}',
    '#flurryModal .fc-level-stats strong{color:#f5fcff;font:800 13px system-ui}',
    '@media(prefers-reduced-motion:reduce){#fcLevelNotice{animation:none}#fcAdventurePill .fc-xp-fill,#fcEnemyHealth .fc-enemy-fill{transition:none}}',
    '#flurryModal .fc-adventure-stat{font:700 13px system-ui;color:#d5effa;margin:12px 0}',
    '#flurryModal .fc-adventure-meter{height:6px;background:#194357;border-radius:5px;overflow:hidden;margin:7px 0}',
    '#flurryModal .fc-adventure-meter i{display:block;height:100%;background:#8be4f0}',
    '#flurryModal .fc-adventure-card{padding:12px;border:1px solid #426c84;border-radius:13px;background:#12384d;margin:12px 0}',
    '#flurryModal .fc-adventure-card h3{font:800 15px system-ui;margin:0 0 8px;color:#f1fcff}',
    '#flurryModal .fc-adventure-card p{font:550 12px/1.45 system-ui;color:#bed9e6;margin:6px 0}',
    '#flurryModal .fc-adventure-card button{width:100%;min-height:42px;border-radius:10px;margin:8px 0 1px;background:#8de8f3;color:#09364c;font:800 12px system-ui}',
    '#flurryModal .fc-adventure-card button:disabled{opacity:.5}',
    '#flurryModal .fc-adventure-card button.muted{background:#225773;color:#e5f7ff}',
    '@media(max-height:520px){#fcAdventurePill{top:50px;left:7px;padding:5px 8px}.fc-adventure-card{padding:9px!important}#fcEnemyHealth{top:52px;padding:6px 9px;width:min(190px,40vw)}#fcSurvivalVitals{top:87px;left:7px;max-width:33vw;padding:6px 8px}#fcSurvivalVitals .fc-heal{padding:4px 6px}#fcLevelNotice{top:52px;padding:8px 14px}#fcLevelNotice span{font-size:18px}#fcDungeonEntry{top:165px;left:7px;max-width:42vw;min-height:38px;padding:6px 9px;font-size:11px}#fcDungeonStatus{top:7px;padding:5px 9px}}'
  ].join('\n');
  const pill=make('button',undefined,document.body);pill.id='fcAdventurePill';
  pill.type='button';pill.setAttribute('aria-label','Open your level and adventure progress');
  pill.addEventListener('pointerdown',e=>e.stopPropagation());
  pill.addEventListener('click',e=>{e.stopPropagation();open();});
  const pillLevel=make('span','LV 1',pill);
  const bar=make('div',undefined,pill);bar.className='fc-xp-meter';
  const barFill=make('div',undefined,bar);barFill.className='fc-xp-fill';
  const activeLabel=make('span','',pill);
  const vitals=make('div',undefined,document.body);vitals.id='fcSurvivalVitals';
  const vitalsRow=make('div',undefined,vitals);vitalsRow.className='fc-vital-row';
  const healthText=make('strong','♥ 20 / 20',vitalsRow);
  const hungerText=make('span','Food 20 / 20',vitalsRow);hungerText.className='fc-vital-food';
  const healthTrack=make('div',undefined,vitals);healthTrack.className='fc-hp-track';
  const healthFill=make('div',undefined,healthTrack);healthFill.className='fc-hp-fill';
  const healButton=make('button','✦ Heal · 2 shards',vitals);
  healButton.type='button';healButton.className='fc-heal';
  healButton.addEventListener('pointerdown',e=>e.stopPropagation());
  healButton.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();tryFrostRecovery();});
  const enemyHUD=make('div',undefined,document.body);enemyHUD.id='fcEnemyHealth';
  enemyHUD.hidden=true;enemyHUD.setAttribute('role','status');
  const enemyHeader=make('div',undefined,enemyHUD);enemyHeader.className='fc-enemy-header';
  const enemyName=make('span','',enemyHeader);
  const enemyLevel=make('span','',enemyHeader);enemyLevel.className='fc-enemy-lv';
  const enemyTrack=make('div',undefined,enemyHUD);enemyTrack.className='fc-enemy-track';
  const enemyFill=make('div',undefined,enemyTrack);enemyFill.className='fc-enemy-fill';
  const enemyCount=make('div','',enemyHUD);enemyCount.className='fc-enemy-count';
  const levelNotice=make('div',undefined,document.body);levelNotice.id='fcLevelNotice';
  levelNotice.hidden=true;levelNotice.setAttribute('role','status');
  levelNotice.setAttribute('aria-live','polite');
  make('strong','LEVEL UP',levelNotice);
  const levelNoticeNumber=make('span','Level 2',levelNotice);
  const entryButton=make('button','Enter Frost Ruins',document.body);
  entryButton.id='fcDungeonEntry';entryButton.type='button';
  entryButton.setAttribute('aria-label','Enter Frost Ruins dungeon');
  entryButton.addEventListener('pointerdown',e=>e.stopPropagation());
  entryButton.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();startTrial(entryChapter);});
  const dungeonStatus=make('div','',document.body);dungeonStatus.id='fcDungeonStatus';
  const siegeHUD=make('section',undefined,document.body);siegeHUD.id='fcSiegeHUD';
  siegeHUD.setAttribute('role','status');
  const siegeText=make('div','',siegeHUD);
  const siegeActions=make('div',undefined,siegeHUD);siegeActions.className='fc-siege-row';
  const repairButton=button('Repair Ward',()=>repairSiege(),siegeActions);
  const retreatButton=button('End Defense',()=>stopSiege('Defense stopped · counted as a loss'),siegeActions);
  const totalXP=()=>progress.xp;
  const needed=()=>xpToNext(progress.level);
  function serialize(){
    const {levelsGained,...saved}=progress;
    return {...saved,beacons:progress.beacons.map(b=>({...b})),
      storm:{...progress.storm,site:progress.storm.site?{...progress.storm.site}:null}};
  }
  function load(raw){stopSiege(null,false);progress=safeAdventure(raw);world=game.world;trial=null;denPending=false;stormPending=false;
    buildPlan=[];buildIndex=0;stormBuildPlan=[];stormBuildIndex=0;nextRun++;levelNoticeTime=0;hitTimer=0;levelNotice.hidden=true;
    enemyHUD.hidden=true;entryButton.style.display='none';dungeonStatus.style.display='none';
    lastTargetStamp='';recoveryCooldown=0;vitalsTick=0;lastVitals='';vitals.style.display='none';siegeHUD.style.display='none';refreshPill();}
  function resetWorld(isNew){
    world=game.world;
    if(isNew&&!game.player.creative&&!progress.den){
      progress.den=trialLocation(game.player.spawn,world.gen);
      if(progress.den)buildRuins(false);
    }
    refreshPill();refreshVitals();
  }
  function refreshPill(){
    pillLevel.textContent='LV '+progress.level;
    barFill.style.width=(needed()?Math.min(100,progress.xp/needed()*100):100)+'%';
    if(siege)activeLabel.textContent='DEF '+(siege.wave+1)+'/3';
    else if(trial)activeLabel.textContent=(trial.chapter==='storm'?'SPIRE ':'WAVE ')+(trial.wave+1)+'/3';
    else activeLabel.textContent='';
    pill.setAttribute('aria-label','Level '+progress.level+', '+progress.xp+
      ' of '+needed()+' XP. Open Winter Adventure');
  }
  function refreshVitals(){
    const p=game.player;
    if(!p)return;
    const v=survivalVitals(p),shards=Number(p.countItem?.(B.FROST_SHARD)||0);
    const eligible=checkFrostRecovery(p,shards,recoveryCooldown);
    const signature=[v.healthLabel,v.hungerLabel,v.critical,shards,Math.ceil(recoveryCooldown)].join('|');
    if(signature===lastVitals)return;
    lastVitals=signature;
    healthText.textContent='♥ '+v.healthLabel;
    hungerText.textContent='Food '+v.hungerLabel;
    healthFill.style.width=v.percent+'%';
    vitals.classList.toggle('critical',v.critical);
    vitals.setAttribute('aria-label','Health '+v.healthLabel+', food '+v.hungerLabel);
    healButton.classList.toggle('ready',eligible.ok);
    healButton.textContent=eligible.ok?'✦ HEAL · +6 HP':
      p.health>=20?'✦ Health full':
      recoveryCooldown>0?'✦ Heal in '+Math.ceil(recoveryCooldown)+'s':
      '✦ Heal · 2 shards';
    healButton.title=eligible.ok?'Spend 2 Frost Shards to restore 6 HP':eligible.reason;
    healButton.setAttribute('aria-label',eligible.ok?'Heal for 2 Frost Shards':eligible.reason);
  }
  function tryFrostRecovery(){
    const p=game.player;
    const check=checkFrostRecovery(p,Number(p?.countItem?.(B.FROST_SHARD)||0),recoveryCooldown);
    if(!check.ok){notify(game,check.reason);return false;}
    for(let i=0;i<FROST_RECOVERY_COST;i++)p.takeItem(B.FROST_SHARD);
    const before=p.health;
    p.health=recoveredHealth(before);
    recoveryCooldown=FROST_RECOVERY_COOLDOWN;
    lastVitals='';refreshVitals();
    notify(game,'Recovered '+Math.round((p.health-before)*10)/10+' HP · 2 Frost Shards used');
    return true;
  }
  function levelUp(previous){
    if(progress.level<=previous)return;
    levelNoticeNumber.textContent='Level '+progress.level;
    levelNoticeTime=2.9;levelNotice.hidden=false;
    game.sound?.play?.('levelup',{vol:.6});
    if(previous<STORM_UNLOCK_LEVEL&&progress.level>=STORM_UNLOCK_LEVEL)
      notify(game,progress.clears>0?'Stormspire Keep unlocked · Open Winter Adventure':'Level 10! Clear Frost Ruins to unlock Stormspire Keep.');
  }
  function trackBlock(worldRef,x,y,z,before,after){
    if(worldRef!==world||before===after)return;
    const key=(v)=>v.x===x&&v.y===y&&v.z===z;
    if(before===B.WARD_BEACON){
      if(siege?.wardKey===x+','+y+','+z)stopSiege('Winter Ward removed · defense lost');
      progress.beacons=progress.beacons.filter(v=>!key(v));
    }
    if(after===B.WARD_BEACON&&!progress.beacons.some(key)){
      progress.beacons.push({x,y,z,tier:1});
      if(progress.beacons.length>40)progress.beacons.shift();
    }
  }
  function isShielded(x,y,z){
    if(!world||world!==game.world)return false;
    for(const b of progress.beacons){
      if(!wardContains(b,x,y,z))continue;
      if(world.loaded(b.x,b.z)&&world.getBlock(b.x,b.y,b.z)===B.WARD_BEACON)return true;
    }
    return false;
  }
  function currentWard(ward){
    if(!ward||!world||world!==game.world||!world.loaded(ward.x,ward.z))return null;
    if(world.getBlock(ward.x,ward.y,ward.z)!==B.WARD_BEACON)return null;
    return progress.beacons.find(b=>wardKey(b)===wardKey(ward))||null;
  }
  function nearbyWard(radius=16){
    const p=game.player;
    let closest=null,dist=Infinity;
    for(const ward of progress.beacons){
      if(!currentWard(ward))continue;
      const d=Math.hypot(p.x-ward.x-.5,p.z-ward.z-.5);
      if(d<dist&&d<=radius&&Math.abs(p.y-ward.y)<9){closest=ward;dist=d;}
    }
    return closest;
  }
  function upgradeWard(ward){
    const w=currentWard(ward),p=game.player;
    if(!w){notify(game,'Place or load this Ward before upgrading');return false;}
    if(!nearbyWard()||nearbyWard()!==w){notify(game,'Stand within 16 blocks of this Ward');return false;}
    const check=canUpgradeWard(w,progress.level,progress.storm.clears,
      p.countItem(B.FROST_SHARD),p.countItem(B.FROST_BRICK));
    if(!check.ok){notify(game,check.reason);return false;}
    for(let i=0;i<check.cost.shards;i++)p.takeItem(B.FROST_SHARD);
    for(let i=0;i<check.cost.bricks;i++)p.takeItem(B.FROST_BRICK);
    w.tier=check.next;
    notify(game,'Winter Ward upgraded to Tier '+w.tier+' · radius '+wardStats(w).radius);
    return true;
  }
  function stopSiege(reason,recordLoss=true){
    if(!siege)return;
    const old=siege;siege=null;
    for(const mob of old.remaining)if(!mob.dead&&typeof mob.remove==='function')mob.remove();
    siegeHUD.style.display='none';refreshPill();
    if(recordLoss)progress.castle.losses++;
    if(reason)notify(game,reason);
  }
  function siegeWardTarget(mob){
    if(!siege||mob?.raidId!==siege.id)return null;
    const ward=currentWard(siege.ward);
    return ward?{x:ward.x+.5,y:ward.y+.5,z:ward.z+.5}:null;
  }
  function siegeWardHit(mob,damage){
    if(!siege||mob?.raidId!==siege.id)return false;
    const ward=currentWard(siege.ward);
    if(!ward)return false;
    siege.integrity=Math.max(0,siege.integrity-Math.max(1,Number(damage)||1));
    if(siege.integrity===0)stopSiege('Ward shield collapsed · Defense lost');
    return true;
  }
  function findSiegeSpawn(ward,index){
    // Fixed ring positions keep raids deterministic and do not modify terrain.
    const spots=[[15,0],[-15,0],[0,15],[0,-15],[11,11],[-11,11],[11,-11],[-11,-11],
      [18,2],[-18,-2],[2,18],[-2,-18]];
    for(let step=0;step<spots.length;step++){
      const [ox,oz]=spots[(index*3+step)%spots.length];
      const x=Math.floor(ward.x+ox),z=Math.floor(ward.z+oz);
      if(!world.loaded(x,z))continue;
      const ground=world.gen?.column?.(x,z)?.h;
      if(!Number.isFinite(ground))continue;
      const y=Math.floor(ground)+1;
      if(Math.abs(y-ward.y)>9)continue;
      if(B.SOLID&&(!B.SOLID[world.getBlock(x,y-1,z)]||
        B.SOLID[world.getBlock(x,y,z)]||B.SOLID[world.getBlock(x,y+1,z)]))continue;
      return {x:x+.5,y:y+.05,z:z+.5};
    }
    return null;
  }
  function spawnSiegeWave(){
    if(!siege)return false;
    const ward=currentWard(siege.ward);
    if(!ward){stopSiege('Winter Ward unavailable · Defense stopped');return false;}
    const wave=siegeWaves(ward.tier,progress.level)[siege.wave]||[];
    const positions=wave.map((_,i)=>findSiegeSpawn(ward,i));
    if(positions.some(p=>!p)){
      stopSiege('Nearby terrain has no safe raid spawn points · Defense stopped',false);
      return false;
    }
    const current=siege;siege.remaining=new Set();siege.nextIn=0;
    wave.forEach((spec,i)=>{
      const p=positions[i];
      const mob=new game.Mob(game,spec.kind,p.x,p.y,p.z,
        {level:spec.level,raidId:current.id});
      mob.raidId=current.id;
      game.mobs.push(mob);current.remaining.add(mob);
    });
    refreshPill();
    notify(game,'Castle Defense · Wave '+(current.wave+1)+'/3 · '+wave.length+' attackers!');
    return true;
  }
  function startSiege(ward){
    const w=currentWard(ward);
    const check=canStartSiege({player:game.player,ward:w,world,level:progress.level,
      clears:progress.clears,trialActive:!!trial,raidActive:!!siege});
    if(!check.ok){notify(game,check.reason);return false;}
    closeDialog();
    const stats=wardStats(w);
    siege={id:++siegeCounter,ward:{x:w.x,y:w.y,z:w.z},wardKey:wardKey(w),
      wave:0,remaining:new Set(),nextIn:0,integrity:stats.integrity,
      maxIntegrity:stats.integrity,repairCd:0};
    const started=spawnSiegeWave();
    if(started)notify(game,'Defend your Ward! Your buildings are never destroyed by this trial.');
    return started;
  }
  function repairSiege(){
    if(!siege)return false;
    const p=game.player;
    if(siege.repairCd>0){notify(game,'Repair cooling down');return false;}
    if(siege.integrity>=siege.maxIntegrity){notify(game,'Ward shield already full');return false;}
    if(p.countItem(B.FROST_SHARD)<REPAIR_COST.shards||
       p.countItem(B.FROST_BRICK)<REPAIR_COST.bricks){
      notify(game,'Repair needs 2 Frost Shards and 4 Froststone');return false;
    }
    for(let i=0;i<REPAIR_COST.shards;i++)p.takeItem(B.FROST_SHARD);
    for(let i=0;i<REPAIR_COST.bricks;i++)p.takeItem(B.FROST_BRICK);
    siege.integrity=Math.min(siege.maxIntegrity,siege.integrity+REPAIR_INTEGRITY);
    siege.repairCd=1.5;
    notify(game,'Ward shield restored');
    return true;
  }
  function finishSiege(){
    if(!siege)return;
    const w=currentWard(siege.ward);
    const tier=wardTier(w||{tier:1}),reward=SIEGE_REWARDS[tier];
    siege=null;progress.castle.wins++;
    progress.castle.bestTier=Math.max(progress.castle.bestTier,tier);
    safeItem(B.FROST_SHARD,reward.shards);
    safeItem(B.FROST_BRICK,reward.bricks);
    const old=progress.level;progress=grantXP(progress,reward.xp);
    refreshPill();levelUp(old);
    siegeHUD.style.display='none';
    notify(game,'Castle defended! Tier '+tier+' cleared · XP, shards and Froststone earned');
  }
  function tickSiege(dt){
    if(!siege)return;
    const ward=currentWard(siege.ward),p=game.player;
    if(!ward||p.dead||p.creative||
       Math.abs(p.y-ward.y)>13||
       Math.hypot(p.x-ward.x-.5,p.z-ward.z-.5)>29){
      stopSiege('You left your Ward behind · Defense lost');return;
    }
    siege.repairCd=Math.max(0,siege.repairCd-dt);
    const count=Math.max(0,Math.ceil(siege.integrity));
    siegeText.textContent='⚔ CASTLE DEFENSE · '+(siege.wave+1)+'/3 · Ward '+count+'/'+siege.maxIntegrity+' shield';
    repairButton.disabled=siege.integrity>=siege.maxIntegrity||siege.repairCd>0||
      p.countItem(B.FROST_SHARD)<REPAIR_COST.shards||
      p.countItem(B.FROST_BRICK)<REPAIR_COST.bricks;
    siegeHUD.style.display='block';
    if(siege.remaining.size!==0)return;
    if(siege.nextIn>0){siege.nextIn-=dt;return;}
    if(siege.wave>=2){finishSiege();return;}
    siege.wave++;spawnSiegeWave();
  }
  function towerTick(dt){
    // A bounded, low-frequency scan; no extra per-frame geometry or projectiles.
    wardFireAcc+=dt;
    if(wardFireAcc<.22)return;
    const elapsed=wardFireAcc;wardFireAcc=0;
    for(const ward of progress.beacons){
      if(!currentWard(ward))continue;
      const key=wardKey(ward);
      const cd=Math.max(0,(wardCooldowns.get(key)||0)-elapsed);
      if(cd>0){wardCooldowns.set(key,cd);continue;}
      const stats=wardStats(ward);
      let target=null,distance=stats.range;
      for(const mob of game.mobs){
        if(!mob||mob.dead||mob.deadT>0||mob.sp?.passive||
          typeof mob.hurt!=='function'||!Number.isFinite(mob.hp)||mob.hp<=0)continue;
        if(mob.raidId&&(!siege||mob.raidId!==siege.id))continue;
        const d=Math.hypot(mob.x-ward.x-.5,mob.z-ward.z-.5);
        if(d>=distance||Math.abs(mob.y-ward.y)>9)continue;
        if(typeof world.raycast==='function'){
          const sx=ward.x+.5,sy=ward.y+1.6,sz=ward.z+.5;
          const dx=mob.x-sx,dy=mob.y+mob.h*.5-sy,dz=mob.z-sz;
          const length=Math.hypot(dx,dy,dz)||1;
          if(world.raycast(sx,sy,sz,dx/length,dy/length,dz/length,length))continue;
        }
        target=mob;distance=d;
      }
      if(!target){wardCooldowns.set(key,0);continue;}
      wardCooldowns.set(key,stats.cooldown);
      target.hurt(stats.damage,ward.x+.5,ward.z+.5,false);
      game.particles?.burst?.(target.x,target.y+Math.min(1.5,target.h*.6),target.z,
        [137,225,250],Math.min(8,3+wardTier(ward)),1.5);
    }
  }
  function mobLevel(kind){return winterMobLevel(progress.level,kind,Math.random());}
  function roamingKind(){return chooseWinterMob(progress.level,Math.random());}
  function monsterDefeated(mob,byPlayer){
    if(!mob.sp.iceNative||!world||game.state!=='play')return;
    if(siege&&mob.raidId===siege.id){
      siege.remaining.delete(mob);
      if(siege.remaining.size===0){
        siege.nextIn=.8;
        if(siege.wave<2)notify(game,'Wave cleared · Incoming attackers!');
      }
    }
    if(byPlayer&&!game.player.creative){
      progress.kills++;
      const result=grantXP(progress,winterKillXP(mob.kind,mob.level));
      const old=progress.level;
      progress=result;
      levelUp(old);
      refreshPill();
    }
    if(trial&&mob.trialId===trial.id){
      trial.remaining.delete(mob);
      if(trial.remaining.size===0){
        trial.nextIn=.75;
        if(trial.wave<2)notify(game,trial.chapter==='storm'?'Hall cleared · Continue toward the blizzard':'Chamber cleared · Walk deeper into the ruins');
      }
    }
  }
  function safeItem(id,n){
    const remaining=game.player.addItem(id,n);
    if(remaining>0)game.spawnItem(id,remaining,game.player.x,game.player.y+.8,game.player.z);
  }
  function canEnterStorm(){return progress.level>=STORM_UNLOCK_LEVEL&&progress.clears>=1;}
  function guideStorm(){
    const s=progress.storm.site;
    if(s)explorer.guideTo({id:'stormspire-keep',name:'Stormspire Keep',x:s.x,z:s.z-7});
  }
  function buildStormspire(fromMenu=false){
    const state=progress.storm;
    if(!world||!state.site||stormPending||(state.built&&state.version>=STORM_VERSION))return false;
    stormBuildPlan=generateStormspire(state.site,B,world.gen);
    stormBuildIndex=0;stormPending=true;
    if(fromMenu)notify(game,'Stormspire construction queued · Follow the map to the site');
    return true;
  }
  function stormBuildTick(){
    if(!stormPending||!world||world!==game.world)return;
    // Building offscreen is deliberately paused until its terrain is loaded.
    const end=Math.min(stormBuildPlan.length,stormBuildIndex+24);
    for(let i=stormBuildIndex;i<end;i++){
      const [x,y,z]=stormBuildPlan[i];
      if(!world.loaded(x,z))return;
    }
    for(;stormBuildIndex<end;stormBuildIndex++){
      const [x,y,z,id]=stormBuildPlan[stormBuildIndex];
      if(world.getBlock(x,y,z)!==id)world.setBlock(x,y,z,id);
    }
    if(stormBuildIndex>=stormBuildPlan.length){
      stormPending=false;stormBuildPlan=[];stormBuildIndex=0;
      progress.storm.built=true;progress.storm.version=STORM_VERSION;
      notify(game,'Stormspire Keep ready! Enter through the northern arch.');
    }
  }
  function createPlan(){
    return progress.den?generateFrostDungeon(progress.den,B,world.gen):[];
  }
  function buildRuins(fromMenu=false){
    if(!world||!progress.den||denPending||progress.dungeonVersion>=DUNGEON_VERSION)return;
    buildPlan=createPlan();buildIndex=0;denPending=true;
    if(fromMenu)notify(game,'Preparing three Frost Ruins chambers');
  }
  function buildTick(){
    if(!denPending||!world||world!==game.world)return;
    // Apply at most a dozen costly terrain and lighting edits per frame.
    const batch=12,end=Math.min(buildPlan.length,buildIndex+batch);
    for(let i=buildIndex;i<end;i++){
      const [x,y,z]=buildPlan[i];
      if(!world.loaded(x,z))return; // complete as more terrain loads
    }
    for(;buildIndex<end;buildIndex++){
      const [x,y,z,id]=buildPlan[buildIndex];
      if(world.getBlock(x,y,z)!==id)world.setBlock(x,y,z,id);
    }
    if(buildIndex>=buildPlan.length){
      denPending=false;buildPlan=[];progress.denBuilt=true;
      progress.dungeonVersion=DUNGEON_VERSION;
      notify(game,'Frost Ruins ready · Enter through the north gate');
    }
  }
  function trialSpawn(kind,level,index){
    const den=trial.chapter==='storm'?progress.storm.site:progress.den;
    const room=trial.chapter==='storm'?stormRoom(den,trial.wave):chamberPosition(den,trial.wave);
    const locations=[[-2,-2],[2,2],[-2,2],[2,-2],[0,0]];
    const [dx,dz]=locations[index%locations.length];
    const x=room.x+dx+.5,z=room.z+dz+.5;
    const mob=new game.Mob(game,kind,x,den.y+.05,z,{level,trialId:trial.id});
    game.mobs.push(mob);trial.remaining.add(mob);
    return mob;
  }
  function spawnWave(){
    if(!trial)return;
    const members=(trial.chapter==='storm'?stormspireWaves(progress.level):trialWaves(progress.level))[trial.wave]||[];
    trial.remaining=new Set();trial.waiting=false;trial.nextIn=0;
    members.forEach((spec,index)=>trialSpawn(spec.kind,spec.level,index));
    refreshPill();
    notify(game,(trial.chapter==='storm'?STORM_ROOM_NAMES:ROOM_NAMES)[trial.wave]+' · Defeat '+members.length+' '+(members.length===1?'enemy':'enemies'));
  }
  function finishTrial(){
    const chapter=trial?.chapter||'frost';
    trial=null;
    if(chapter==='storm'){
      const first=progress.storm.clears===0;
      progress.storm.clears++;
      safeItem(B.FROST_SHARD,9);
      safeItem(B.FROST_BRICK,24);
      if(first&&typeof B.toolId==='function')safeItem(B.toolId(3,2),1);
      const old=progress.level;progress=grantXP(progress,260);
      refreshPill();
      notify(game,first?'Stormspire cleared! Iron sword, XP and winter materials earned':
        'Stormspire cleared! 9 Frost Shards, 24 Froststone and XP earned');
      levelUp(old);
    }else{
      progress.clears++;
      safeItem(B.FROST_SHARD,5);
      safeItem(B.FROST_BRICK,16);
      if(progress.clears===1)safeItem(B.WARD_BEACON,1);
      const result=grantXP(progress,105);
      const old=progress.level;progress=result;
      refreshPill();
      notify(game,'Frost Ruins cleared! Froststone and a Winter Ward earned');
      levelUp(old);
    }
  }
  function stopTrial(reason){
    if(!trial)return;
    for(const mob of trial.remaining){if(!mob.dead)mob.remove();}
    trial=null;refreshPill();
    if(reason)notify(game,reason);
  }
  function startTrial(chapter='frost'){
    if(game.player.creative){notify(game,'Enter a Survival world for dungeon combat');return;}
    if(trial||siege){notify(game,'Finish your current fight before entering a dungeon');return;}
    const storm=chapter==='storm',p=game.player;
    if(storm){
      if(!canEnterStorm()){notify(game,'Level 10 and one Frost Ruins clear required');return;}
      if(!progress.storm.built||progress.storm.version<STORM_VERSION){
        notify(game,'Prepare Stormspire Keep first');return;
      }
      if(!nearStormGate(p,progress.storm.site)){
        notify(game,'Walk to the Stormspire entrance to begin');return;
      }
    }else{
      if(!progress.denBuilt||progress.dungeonVersion<DUNGEON_VERSION){
        notify(game,'Prepare the three-room Frost Ruins first');return;
      }
      if(!withinDungeonEntry(p,progress.den)){
        notify(game,'Go to the Frost Ruins entrance to begin');return;
      }
    }
    if(game.difficulty<=0){notify(game,'Enable Easy or Normal combat to enter');return;}
    closeDialog();
    trial={id:++nextRun,chapter:storm?'storm':'frost',wave:0,
      remaining:new Set(),nextIn:0,waiting:false};
    spawnWave();
  }
  function guide(){
    if(!progress.den)return;
    explorer.guideTo({id:'frost-ruins',name:'Frost Ruins',x:progress.den.x,z:progress.den.z});
  }
  function open(){
    if(game.state!=='play'||!world)return;
    openDialog('Winter Adventure');
    const hero=make('section',undefined,panel);hero.className='fc-level-overview';
    const head=make('div',undefined,hero);head.className='fc-level-top';
    make('strong','Level '+progress.level,head);
    make('span',progress.level<=10?'CHAPTER 1 · FROST RUINS':progress.level<=20?'CHAPTER 2 · STORMSPIRE':'WINTER ADVENTURER',head);
    const meter=make('div',undefined,hero);meter.className='fc-adventure-meter';
    meter.setAttribute('role','progressbar');meter.setAttribute('aria-label','Experience to next level');
    meter.setAttribute('aria-valuemin','0');
    meter.setAttribute('aria-valuemax',String(needed()||1));
    meter.setAttribute('aria-valuenow',String(progress.xp));
    const fill=make('i',undefined,meter);
    fill.style.width=(needed()?Math.min(100,progress.xp/needed()*100):100)+'%';
    const xp=make('div',progress.level===100?'Maximum level reached':
      progress.xp+' / '+needed()+' XP to Level '+(progress.level+1),hero);
    xp.className='fc-level-xp';
    const activity=make('div',undefined,hero);activity.className='fc-level-stats';
    make('span',progress.kills+' creatures defeated',activity);
    make('span',progress.clears+' Frost Ruins clears',activity);
    make('span',progress.storm.clears+' Stormspire clears',activity);
    if(!game.player.creative){
      const recovery=make('section',undefined,panel);recovery.className='fc-adventure-card';
      make('h3','Survival · Recover Health',recovery);
      const vit=survivalVitals(game.player);
      make('p','Health '+vit.healthLabel+' · Food '+vit.hungerLabel+
        ' · Frost Shards '+game.player.countItem(B.FROST_SHARD),recovery);
      make('p','Spend 2 Frost Shards to recover up to 6 HP. 12-second cooldown. You can also heal from the in-game health panel.',recovery);
      const status=checkFrostRecovery(game.player,game.player.countItem(B.FROST_SHARD),recoveryCooldown);
      const recoveryAction=button(status.ok?'Recover 6 HP · 2 Frost Shards':status.reason,()=>{
        if(tryFrostRecovery())open();
      },recovery);
      recoveryAction.disabled=!status.ok;
    }
    const starterId=B.toolId?.(3,0);
    if(!game.player.creative&&!progress.swordClaimed&&
       Number.isInteger(starterId)&&game.player.countItem(starterId)===0){
      const gear=make('section',undefined,panel);gear.className='fc-adventure-card';
      make('h3','Ready to Fight?',gear);
      make('p','Aim at a creature and tap ATTACK. Your first wooden sword is free.',gear);
      button('Get Starter Sword',()=>{
        if(!game.player.canAccept(starterId)){notify(game,'Free an inventory slot first');return;}
        progress.swordClaimed=true;
        safeItem(starterId,1);
        notify(game,'Wooden sword added to inventory');
        open();
      },gear);
    }
    const den=make('section',undefined,panel);den.className='fc-adventure-card';
    make('h3','Frost Ruins · 3 Chambers',den);
    make('p','Enter the gate, clear each room, then reach the Glacier Guardian.',den);
    make('p','Rewards: XP, Frost Shards, Froststone and a Winter Ward.',den);
    if(!progress.den){
      button('Discover Frost Ruins',()=>{
        if(!confirm('Create the Frost Ruins near your spawn? This modifies nearby terrain.'))return;
        progress.den=trialLocation(game.player.spawn,world.gen);
        if(!progress.den){notify(game,'No safe site found near spawn');return;}
        buildRuins(true);closeDialog();
      },den);
    }else{
      make('p','X '+progress.den.x+' · Z '+progress.den.z+' · '+progress.clears+' clears',den);
      button('Guide to Entrance',guide,den);
      if(!progress.denBuilt){
        make('p',denPending?'Building rooms as the area loads…':'The dungeon is not built yet.',den);
        if(!denPending)button('Prepare Dungeon',()=>{buildRuins(true);closeDialog();},den);
      }else if(progress.dungeonVersion<DUNGEON_VERSION){
        make('p','Your older Frost Ruins can become a three-room dungeon.',den);
        button('Upgrade to Walk-in Dungeon',()=>{
          if(typeof confirm==='function'&&!confirm(
            'Extend Frost Ruins into a three-room dungeon? This replaces terrain in a 13 × 41 area and may overwrite nearby builds.'))return;
          buildRuins(true);closeDialog();
        },den);
      }else if(trial?.chapter==='frost'){
        make('p',ROOM_NAMES[trial.wave]+' · Chamber '+(trial.wave+1)+' / 3',den);
        button('Return to Dungeon',closeDialog,den);
      }else{
        make('p','Walk through the gate at the marked entrance to begin.',den);
        button('Enter Dungeon',startTrial,den);
      }
    }
    const stormCard=make('section',undefined,panel);stormCard.className='fc-adventure-card';
    make('h3','Chapter 2 · Stormspire Keep',stormCard);
    make('p','Levels 11–20 · Fight Storm Hounds, Rime Knights, then the Blizzard Titan in three new halls.',stormCard);
    make('p','First clear: an Iron Sword, Frost Shards, Froststone and 260 XP. Repeat clears earn materials and XP.',stormCard);
    if(!canEnterStorm()){
      make('p','LOCKED · Reach Level 10 and clear Frost Ruins once. You need both achievements.',stormCard);
    }else if(!progress.storm.site){
      button('Scout Stormspire Site',()=>{
        const s=stormSite(game.player.spawn,world.gen,progress.den);
        if(!s){notify(game,'No suitable site found on this world seed');return;}
        progress.storm.site=s;
        guideStorm();notify(game,'Stormspire site marked on your map. Return to Winter Adventure to prepare it.');
        open();
      },stormCard);
    }else{
      const s=progress.storm.site;
      make('p','Map marker · X '+s.x+' · Z '+(s.z-7)+' · '+progress.storm.clears+' clears',stormCard);
      button('Guide to Stormspire',guideStorm,stormCard);
      if(!progress.storm.built||progress.storm.version<STORM_VERSION){
        make('p',stormPending?'Construction in progress · travel toward the marked site to load the terrain':
          'Only build this fortress when you are ready. It occupies '+STORM_FOOTPRINT+'.',stormCard);
        if(!stormPending)button('Build Stormspire · '+STORM_FOOTPRINT,()=>{
          if(typeof confirm==='function'&&!confirm(
            'Build Stormspire Keep? This replaces terrain and ANY EXISTING BUILDS in a '+STORM_FOOTPRINT+' area at X '+
            s.x+', Z '+s.z+'. Save/backup your world and ensure nothing valuable is there first.'))return;
          if(buildStormspire(true)){guideStorm();closeDialog();}
        },stormCard);
      }else if(trial?.chapter==='storm'){
        make('p',STORM_ROOM_NAMES[trial.wave]+' · Hall '+(trial.wave+1)+' / 3',stormCard);
        button('Return to Stormspire',closeDialog,stormCard);
      }else{
        make('p','Approach the northern arch to begin the three-hall challenge.',stormCard);
        button('Enter Stormspire',()=>startTrial('storm'),stormCard);
      }
    }
    const defense=make('section',undefined,panel);defense.className='fc-adventure-card';
    make('h3','Protect Your Castle',defense);
    make('p','Place a Winter Ward to protect buildings within 10 blocks. Its shield reduces damage and keeps hostile creatures from chasing you inside.',defense);
    make('p','Frost Shards: '+game.player.countItem(B.FROST_SHARD)+
      '  ·  Froststone: '+game.player.countItem(B.FROST_BRICK),defense);
    button('Craft Winter Ward · 5 shards + 12 bricks',()=>{
      const p=game.player;
      if(p.countItem(B.FROST_SHARD)<5||p.countItem(B.FROST_BRICK)<12){
        notify(game,'Collect 5 Frost Shards and 12 Froststone Bricks');return;
      }
      if(!p.canAccept(B.WARD_BEACON)){notify(game,'Make room in your inventory');return;}
      for(let i=0;i<5;i++)p.takeItem(B.FROST_SHARD);
      for(let i=0;i<12;i++)p.takeItem(B.FROST_BRICK);
      safeItem(B.WARD_BEACON,1);
      notify(game,'Winter Ward crafted');
      open();
    },defense);
    const fort=make('section',undefined,panel);fort.className='fc-adventure-card';
    make('h3','⚔ Castle Defense · Winter Wards',fort);
    make('p','Upgrade a placed Winter Ward and start a three-wave raid. The shield must survive. Upgraded Wards automatically strike hostile creatures in sight. Your buildings are never removed by raids.',fort);
    make('p','Defense victories: '+progress.castle.wins+' · Defeats: '+progress.castle.losses+
      ' · Best Tier '+(progress.castle.bestTier||'—'),fort);
    if(siege){
      make('p','ACTIVE DEFENSE · Wave '+(siege.wave+1)+'/3 · Shield '+Math.ceil(siege.integrity)+'/'+siege.maxIntegrity,fort);
      button('Return to Defense',closeDialog,fort);
    }else{
      const p=game.player;
      const placed=progress.beacons.filter(b=>!!currentWard(b)).sort((a,b)=>
        Math.hypot(p.x-a.x-.5,p.z-a.z-.5)-Math.hypot(p.x-b.x-.5,p.z-b.z-.5)).slice(0,6);
      if(!placed.length)make('p','Place a Winter Ward block near your castle to unlock the defense interface. Older wards upgrade automatically to Tier I.',fort);
      for(const ward of placed){
        const stats=wardStats(ward),row=make('div',undefined,fort);
        make('p','Winter Ward T'+wardTier(ward)+' · X '+ward.x+' Z '+ward.z+
          ' · Shield '+stats.integrity+' · Radius '+stats.radius+' · Damage '+stats.damage,row);
        const distance=Math.hypot(p.x-ward.x-.5,p.z-ward.z-.5);
        if(distance>16||Math.abs(p.y-ward.y)>8){
          button('Guide to this Ward',()=>{
            explorer.guideTo({id:'ward-'+wardKey(ward),name:'Winter Ward',x:ward.x,z:ward.z});
            closeDialog();
          },row);
        }else if(!p.creative){
          const check=canUpgradeWard(ward,progress.level,progress.storm.clears,
            p.countItem(B.FROST_SHARD),p.countItem(B.FROST_BRICK));
          if(wardTier(ward)<MAX_WARD_TIER){
            const cost=WARD_COSTS[wardTier(ward)+1];
            const btn=button('Upgrade to T'+(wardTier(ward)+1)+' · '+
              cost.shards+' Shards + '+cost.bricks+' Froststone',()=>{
              if(upgradeWard(ward))open();
            },row);
            btn.disabled=!check.ok;
            if(!check.ok)make('p',check.reason,row);
          }
          const gate=canStartSiege({player:p,ward,world,level:progress.level,
            clears:progress.clears,trialActive:!!trial,raidActive:false});
          const start=button('Start Defense Trial · Tier '+wardTier(ward),()=>{
            if(typeof confirm==='function'&&!confirm(
              'Start a 3-wave Castle Defense raid? Monsters will attack this Ward shield. Your buildings will not be destroyed.'))return;
            startSiege(ward);
          },row);
          start.disabled=!gate.ok;
          if(!gate.ok)make('p',gate.reason,row);
        }
      }
      make('p','Ward Tier II: Level 10 · 8 Shards + 16 Froststone. Tier III: Level 15 and one Stormspire clear · 16 Shards + 32 Froststone.',fort);
      make('p','During raids, tap Repair Ward to spend 2 Shards + 4 Froststone and restore 22 shield. Retreating or leaving the area counts as a loss; upgrades remain.',fort);
    }
    const details=make('details',undefined,panel);
    make('summary','Future chapters · Levels 21–100',details);
    make('p','Frost Ruins and Stormspire Keep are playable in this release. Content for Levels 21–100 and advanced castle defense remains planned.',details);
  }
  function hitFeedback(mob,damage){
    if(!mob||!game.player||game.player.mobTarget!==mob)return;
    enemyHUD.classList.add('is-hit');
    enemyCount.textContent='Hit · −'+Math.round(damage*10)/10;
    lastTargetStamp='';
    hitTimer=.3;
  }
  let hitTimer=0;
  function syncAimUI(visible){
    const info=visible?aimedCreature(game.player.mobTarget):null;
    enemyHUD.hidden=!info||levelNoticeTime>0;
    if(info){
      const stamp=info.name+'|'+info.level+'|'+Math.ceil(info.health)+'|'+Math.ceil(info.maxHp)+'|'+info.boss;
      if(lastTargetStamp!==stamp){
        enemyName.textContent=info.name;
        enemyLevel.textContent=info.level?'LV '+info.level:'';
        enemyFill.style.width=info.percent+'%';
        if(hitTimer<=0)enemyCount.textContent=Math.ceil(info.health)+' / '+Math.ceil(info.maxHp)+' HP';
        enemyHUD.classList.toggle('boss',info.boss);
        lastTargetStamp=stamp;
      }
    }else lastTargetStamp='';
    if(game.touchMode){
      const control=document.getElementById('tbBreak');
      if(control){
        const mode=visible?actionForTarget(game.player.mobTarget):'mine';
        if(mode!==lastTouchMode){
          control.dataset.action=mode;
          control.dataset.label=mode==='attack'?'ATTACK':'MINE';
          control.textContent=mode==='attack'?'⚔':'⚒';
          control.setAttribute('aria-label',mode==='attack'?'Hold to attack target':'Hold to mine block');
          control.title=mode==='attack'?'Tap or hold to attack':'Hold to mine';
          lastTouchMode=mode;
        }
      }
    }
  }
  function update(dt){
    if(game.player.dead&&siege)stopSiege('You fell defending your castle · Defense lost');
    const play=game.state==='play'&&!game.paused&&!game.player.dead&&!isInterfaceBusy();
    const unobstructed=play&&!game.ui.isOpen;
    pill.style.display=unobstructed&&!game.player.creative?'flex':'none';
    vitals.style.display=unobstructed&&!game.player.creative?'block':'none';
    if(play){
      recoveryCooldown=Math.max(0,recoveryCooldown-dt);
      vitalsTick-=dt;
      if(vitalsTick<=0){refreshVitals();vitalsTick=.18;}
    }
    syncAimUI(unobstructed);
    if(hitTimer>0){
      hitTimer-=dt;
      if(hitTimer<=0){enemyHUD.classList.remove('is-hit');lastTargetStamp='';}
    }
    if(levelNoticeTime>0){
      levelNoticeTime-=dt;
      if(levelNoticeTime<=0)levelNotice.hidden=true;
    }
    levelNotice.style.display=unobstructed&&!game.player.creative?'block':'none';
    if(!play){
      entryButton.style.display='none';dungeonStatus.style.display='none';siegeHUD.style.display='none';
      return;
    }
    if(denPending)buildTick();
    if(stormPending)stormBuildTick();
    towerTick(dt);
    if(siege)tickSiege(dt);
    const dungeonReady=!game.player.creative&&progress.denBuilt&&
      progress.dungeonVersion>=DUNGEON_VERSION;
    const atFrost=dungeonReady&&!trial&&withinDungeonEntry(game.player,progress.den);
    const atStorm=canEnterStorm()&&!trial&&progress.storm.built&&
      progress.storm.version>=STORM_VERSION&&nearStormGate(game.player,progress.storm.site);
    entryChapter=atStorm?'storm':'frost';
    entryButton.textContent=atStorm?'Enter Stormspire':'Enter Frost Ruins';
    entryButton.setAttribute('aria-label',atStorm?'Enter Stormspire Keep dungeon':'Enter Frost Ruins dungeon');
    entryButton.style.display=unobstructed&&(atStorm||atFrost)?'block':'none';
    if(!trial){
      dungeonStatus.style.display='none';
      return;
    }
    const p=game.player,stormRun=trial.chapter==='storm';
    const d=stormRun?progress.storm.site:progress.den;
    if(!d||p.dead||p.creative||Math.hypot(p.x-d.x,p.z-d.z)>(stormRun?54:38)){
      stopTrial((stormRun?'Stormspire':'Frost Ruins')+' run ended');return;
    }
    const names=stormRun?STORM_ROOM_NAMES:ROOM_NAMES;
    let stage=names[trial.wave]+' · '+(trial.wave+1)+'/3';
    if(trial.remaining.size===0&&trial.wave<2)stage='Room clear · Continue deeper';
    dungeonStatus.textContent=stage;
    dungeonStatus.style.display=unobstructed?'block':'none';
    if(trial.nextIn>0)trial.nextIn-=dt;
    if(trial.remaining.size===0&&trial.nextIn<=0){
      if(trial.wave>=2){finishTrial();return;}
      if((stormRun?inStormRoom(p,d,trial.wave+1):enteredChamber(p,d,trial.wave+1))){
        trial.wave++;spawnWave();
      }
    }
  }

  refreshPill();
  return {serialize,load,resetWorld,open,update,mobLevel,roamingKind,
    siegeWardTarget,siegeWardHit,isSiegeActive:()=>!!siege,
    monsterDefeated,hitFeedback,trackBlock,isShielded,markStarterSword(){progress.swordClaimed=true;},
    get level(){return progress.level;},
    get den(){return progress.den;}};
}
