// FlurryCraft Adventure: first chapter (levels 1–10), Frost Ruins trial,
// winter-specific enemy rewards and real protective Winter Ward blocks.
// Future chapters can reuse the 1–100 rules without cluttering gameplay.
import { xpToNext,safeAdventure,grantXP,trialLocation,ruinBlocks,
  FROST_CREATURES,winterMobLevel,trialWaves,withinWard,chooseWinterMob }
from './adventure-core.js';

export function initAdventure({game,B,openDialog,closeDialog,panel,notify,explorer}) {
  let progress=safeAdventure(),world=null,denPending=false,buildPlan=[],buildIndex=0;
  let trial=null,nextRun=0,lastTarget=null;
  const make=(tag,text,parent=panel)=>{
    const n=document.createElement(tag);if(text!==undefined)n.textContent=text;
    parent.appendChild(n);return n;
  };
  const button=(label,callback,parent=panel)=>{
    const el=make('button',label,parent);el.type='button';el.addEventListener('click',callback);return el;
  };
  const css=make('style',undefined,document.head);
  css.textContent=[
    '#fcAdventurePill{position:fixed;z-index:13;top:53px;left:12px;display:none;align-items:center;gap:6px;padding:5px 9px;border:1px solid #386f87;border-radius:10px;background:#092d41dc;color:#e9faff;font:800 10px/1 system-ui;pointer-events:none;backdrop-filter:blur(6px)}',
    '#fcAdventurePill .fc-xp-meter{width:50px;height:3px;background:#355a71;border-radius:3px;overflow:hidden}',
    '#fcAdventurePill .fc-xp-fill{width:0;height:100%;background:#91eaf6}',
    '#flurryModal .fc-adventure-stat{font:700 13px system-ui;color:#d5effa;margin:12px 0}',
    '#flurryModal .fc-adventure-meter{height:6px;background:#194357;border-radius:5px;overflow:hidden;margin:7px 0}',
    '#flurryModal .fc-adventure-meter i{display:block;height:100%;background:#8be4f0}',
    '#flurryModal .fc-adventure-card{padding:12px;border:1px solid #426c84;border-radius:13px;background:#12384d;margin:12px 0}',
    '#flurryModal .fc-adventure-card h3{font:800 15px system-ui;margin:0 0 8px;color:#f1fcff}',
    '#flurryModal .fc-adventure-card p{font:550 12px/1.45 system-ui;color:#bed9e6;margin:6px 0}',
    '#flurryModal .fc-adventure-card button{width:100%;min-height:42px;border-radius:10px;margin:8px 0 1px;background:#8de8f3;color:#09364c;font:800 12px system-ui}',
    '#flurryModal .fc-adventure-card button:disabled{opacity:.5}',
    '#flurryModal .fc-adventure-card button.muted{background:#225773;color:#e5f7ff}',
    '@media(max-height:520px){#fcAdventurePill{top:39px;left:7px;padding:4px 7px}.fc-adventure-card{padding:9px!important}}'
  ].join('\n');
  const pill=make('div',undefined,document.body);pill.id='fcAdventurePill';
  const pillLevel=make('span','LV 1',pill);
  const bar=make('div',undefined,pill);bar.className='fc-xp-meter';
  const barFill=make('div',undefined,bar);barFill.className='fc-xp-fill';
  const activeLabel=make('span','',pill);
  const totalXP=()=>progress.xp;
  const needed=()=>xpToNext(progress.level);
  function serialize(){return {...progress,beacons:progress.beacons.map(b=>({...b}))};}
  function load(raw){progress=safeAdventure(raw);world=game.world;trial=null;denPending=false;
    buildPlan=[];buildIndex=0;nextRun++;refreshPill();}
  function resetWorld(isNew){
    world=game.world;
    if(isNew&&!game.player.creative&&!progress.den){
      progress.den=trialLocation(game.player.spawn,world.gen);
      if(progress.den)buildRuins(false);
    }
    refreshPill();
  }
  function refreshPill(){
    pillLevel.textContent='LV '+progress.level;
    barFill.style.width=(needed()?Math.min(100,progress.xp/needed()*100):100)+'%';
    if(trial)activeLabel.textContent='TRIAL '+(trial.wave+1)+'/3';
    else activeLabel.textContent='';
  }
  function trackBlock(worldRef,x,y,z,before,after){
    if(worldRef!==world||before===after)return;
    const key=(v)=>v.x===x&&v.y===y&&v.z===z;
    if(before===B.WARD_BEACON)progress.beacons=progress.beacons.filter(v=>!key(v));
    if(after===B.WARD_BEACON&&!progress.beacons.some(key)){
      progress.beacons.push({x,y,z});
      if(progress.beacons.length>40)progress.beacons.shift();
    }
  }
  function isShielded(x,y,z){
    if(!world||world!==game.world)return false;
    for(const b of progress.beacons){
      if(Math.abs(b.y-y)>8||Math.hypot(b.x+.5-x,b.z+.5-z)>10)continue;
      if(world.loaded(b.x,b.z)&&world.getBlock(b.x,b.y,b.z)===B.WARD_BEACON)return true;
    }
    return false;
  }
  function mobLevel(kind){return winterMobLevel(progress.level,kind,Math.random());}
  function roamingKind(){return chooseWinterMob(progress.level,Math.random());}
  function monsterDefeated(mob,byPlayer){
    if(!mob.sp.iceNative||!world||game.state!=='play')return;
    if(byPlayer&&!game.player.creative){
      progress.kills++;
      const result=grantXP(progress,(FROST_CREATURES[mob.kind]?.xp||8)*Math.max(1,mob.level*.6));
      const old=progress.level;
      progress=result;
      if(progress.level>old){
        notify(game,'Level '+progress.level+' · New winter abilities ahead');
        game.sound.play('levelup',{vol:.5});
      }
      refreshPill();
    }
    if(trial&&mob.trialId===trial.id){
      trial.remaining.delete(mob);
      if(trial.remaining.size===0)trial.nextIn=.9;
    }
  }
  function safeItem(id,n){
    const remaining=game.player.addItem(id,n);
    if(remaining>0)game.spawnItem(id,remaining,game.player.x,game.player.y+.8,game.player.z);
  }
  function createPlan(){
    const den=progress.den;
    if(!den)return [];
    const cells=new Map();
    const key=(x,y,z)=>x+','+y+','+z;
    const put=(x,y,z,id)=>cells.set(key(x,y,z),[x,y,z,id]);
    // Flatten only for a first-time, explicitly accepted or newly created
    // world arena. This avoids unintentionally modifying existing castles.
    for(let dx=-6;dx<=6;dx++)for(let dz=-6;dz<=6;dz++){
      const x=den.x+dx,z=den.z+dz,ground=world.gen.column(x,z).h;
      for(let y=Math.max(1,den.y-9);y<den.y-1;y++){
        if(y>=ground+1)put(x,y,z,B.FROST_BRICK);
      }
      for(let y=den.y;y<=Math.min(den.y+5,95);y++)put(x,y,z,B.AIR);
    }
    for(const [x,y,z,id] of ruinBlocks(den))put(x,y,z,id);
    return [...cells.values()];
  }
  function buildRuins(fromMenu=false){
    if(!world||!progress.den||progress.denBuilt)return;
    buildPlan=createPlan();buildIndex=0;denPending=true;
    if(fromMenu)notify(game,'Preparing Frost Ruins');
  }
  function buildTick(){
    if(!denPending||!world||world!==game.world)return;
    const batch=18,end=Math.min(buildPlan.length,buildIndex+batch);
    // Avoid dropping portions of the arena when a chunk has not loaded yet.
    for(let i=buildIndex;i<end;i++){
      const [x,y,z]=buildPlan[i];
      if(!world.loaded(x,z))return;
    }
    for(;buildIndex<end;buildIndex++){
      const [x,y,z,id]=buildPlan[buildIndex];
      if(world.getBlock(x,y,z)!==id)world.setBlock(x,y,z,id);
    }
    if(buildIndex>=buildPlan.length){
      denPending=false;buildPlan=[];progress.denBuilt=true;
      notify(game,'Frost Ruins discovered');
    }
  }
  function trialSpawn(kind,level,index){
    const den=progress.den;
    const locations=[[-2,-2],[2,2],[-2,2],[2,-2],[0,0]];
    const [dx,dz]=locations[index%locations.length];
    const x=den.x+dx+.5,z=den.z+dz+.5;
    const mob=new game.Mob(game,kind,x,den.y+.05,z,{level,trialId:trial.id});
    game.mobs.push(mob);trial.remaining.add(mob);
    return mob;
  }
  function spawnWave(){
    if(!trial)return;
    const members=trialWaves(progress.level)[trial.wave]||[];
    trial.remaining=new Set();
    members.forEach((spec,index)=>trialSpawn(spec.kind,spec.level,index));
    refreshPill();
    const descriptions=['Frostlings approach','Snow Prowlers join the hunt','Glacier Guardian awakened'];
    notify(game,descriptions[trial.wave]);
  }
  function finishTrial(){
    trial=null;progress.clears++;
    safeItem(B.FROST_SHARD,5);
    safeItem(B.FROST_BRICK,16);
    if(progress.clears===1)safeItem(B.WARD_BEACON,1);
    const result=grantXP(progress,105);
    const old=progress.level;progress=result;
    refreshPill();
    notify(game,'Frost Ruins cleared! Froststone and a Winter Ward earned');
    if(progress.level>old)game.sound.play('levelup',{vol:.7});
  }
  function stopTrial(reason){
    if(!trial)return;
    for(const mob of trial.remaining){if(!mob.dead)mob.remove();}
    trial=null;refreshPill();
    if(reason)notify(game,reason);
  }
  function startTrial(){
    if(game.player.creative){notify(game,'Enter a Survival world for dungeon combat');return;}
    if(!progress.denBuilt){notify(game,'Frost Ruins are not ready yet');return;}
    if(trial)return;
    const p=game.player,d=progress.den;
    if(Math.hypot(p.x-d.x,p.z-d.z)>14){
      notify(game,'Get closer to Frost Ruins to begin');return;
    }
    if(game.difficulty<=0){notify(game,'Enable Easy or Normal combat to enter');return;}
    closeDialog();
    trial={id:++nextRun,wave:0,remaining:new Set(),nextIn:0};
    spawnWave();
  }
  function guide(){
    if(!progress.den)return;
    explorer.guideTo({id:'frost-ruins',name:'Frost Ruins',x:progress.den.x,z:progress.den.z});
  }
  function open(){
    if(game.state!=='play'||!world)return;
    openDialog('Winter Adventure');
    const stats=make('div',undefined,panel);stats.className='fc-adventure-stat';
    stats.textContent='Level '+progress.level+' · '+progress.kills+' creatures defeated';
    const meter=make('div',undefined,panel);meter.className='fc-adventure-meter';
    const fill=make('i',undefined,meter);fill.style.width=(needed()?progress.xp/needed()*100:100)+'%';
    make('p',progress.level===100?'Maximum level':progress.xp+' / '+needed()+' XP to next level');
    const den=make('section',undefined,panel);den.className='fc-adventure-card';
    make('h3','Frost Ruins',den);
    make('p','3 waves · Frostlings, Snow Prowlers, Glacier Guardian',den);
    make('p','Clear the ruins to earn Froststone, Frost Shards and your first Winter Ward.',den);
    if(!progress.den){
      button('Discover Frost Ruins',()=>{
        if(!confirm('Create the Frost Ruins near your spawn? This modifies nearby terrain.'))return;
        progress.den=trialLocation(game.player.spawn,world.gen);
        if(!progress.den){notify(game,'No safe site found near spawn');return;}
        buildRuins(true);closeDialog();
      },den);
    }else{
      make('p','X '+progress.den.x+' · Z '+progress.den.z+' · '+progress.clears+' clears',den);
      if(!progress.denBuilt){
        make('p',denPending?'Preparing the ruins…':'Visit the area to finish preparing the ruins.',den);
        button('Track Frost Ruins',guide,den);
        if(!denPending)button('Prepare Ruins',()=>{buildRuins(true);closeDialog();},den);
      }else if(trial){
        make('p','Wave '+(trial.wave+1)+' / 3 in progress',den);
        button('Return to Battle',closeDialog,den);
      }else{
        button('Track Frost Ruins',guide,den);
        button('Start Frost Trial',startTrial,den);
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
    const details=make('details',undefined,panel);
    make('summary','Future chapters · Levels 11–100',details);
    make('p','More ice regions, larger dungeons and castle tiers are planned. Only the first winter chapter is playable in this release.',details);
  }
  function update(dt){
    const play=game.state==='play'&&!game.paused;
    pill.style.display=play&&!game.player.creative&&!game.ui.isOpen?'flex':'none';
    if(play&&!trial){
      const target=game.player.mobTarget;
      const creature=target&&!target.dead?FROST_CREATURES[target.kind]:null;
      const label=creature?creature.name+' · Lv '+target.level:'';
      if(activeLabel.textContent!==label)activeLabel.textContent=label;
    }
    if(!play)return;
    if(denPending)buildTick();
    if(!trial)return;
    const p=game.player,d=progress.den;
    if(p.dead||p.creative||Math.hypot(p.x-d.x,p.z-d.z)>36){
      stopTrial('Frost Trial ended');return;
    }
    if(trial.nextIn>0){
      trial.nextIn-=dt;
      if(trial.nextIn<=0){
        if(trial.wave>=2)finishTrial();
        else{trial.wave++;spawnWave();}
      }
    }
  }
  refreshPill();
  return {serialize,load,resetWorld,open,update,mobLevel,roamingKind,
    monsterDefeated,trackBlock,isShielded,get level(){return progress.level;},
    get den(){return progress.den;}};
}
