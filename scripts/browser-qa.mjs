// Automated *real Chromium* smoke test. Does not pretend to be physical Android
// hardware, a signed Sui wallet, or a successful Walrus upload.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync,existsSync } from 'node:fs';

const host='http://127.0.0.1:4173/';
const out='browser-qa-artifacts';
mkdirSync(out,{recursive:true});
const server=spawn('python3',['-m','http.server','4173','--bind','127.0.0.1'],{
  stdio:'ignore'
});
let browser;
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const errors=[];
async function pageReady(page,label){
  page.on('pageerror',error=>errors.push(label+': '+String(error?.message||error)));
  const response=await page.goto(host,{waitUntil:'domcontentloaded',timeout:20000});
  if(!response?.ok())throw new Error(label+': web site returned '+response?.status());
  await page.locator('#bNew').waitFor({state:'visible',timeout:10000});
  if(await page.locator('#fcJudgeTour').count()!==1){
    // The game should load its JS module even before starting a world.
    await page.waitForFunction(()=>!!window.game?.flurry,{timeout:25000});
  }
}
async function smoke(label,options){
  const context=await browser.newContext({
    viewport:options.viewport,isMobile:options.isMobile,
    hasTouch:options.isMobile,deviceScaleFactor:1,
    acceptDownloads:false,recordVideo:{dir:out,size:{width:options.viewport.width,height:options.viewport.height}}
  });
  const page=await context.newPage();
  try{
    await pageReady(page,label);
    await page.screenshot({path:out+'/'+label+'-menu.png'});
    // First screen is intentionally simple; saves and demo are secondary.
    if(!(await page.locator('#bContinue').isDisabled())||
      !(await page.locator('#fcLoadPanel').isHidden())||
      !(await page.locator('#fcNewChoices').isHidden()))
      throw new Error('Clean start menu did not hide advanced save controls');
    await page.locator('#bNew').click({timeout:10000});
    await page.locator('#fcNewSurvival').waitFor({state:'visible',timeout:10000});
    await page.locator('#fcNewCreative').waitFor({state:'visible',timeout:10000});
    await page.locator('#fcNewBack').click({timeout:10000});
    await page.locator('#bLoad').click({timeout:10000});
    await page.locator('#fcLoadPanel').waitFor({state:'visible',timeout:10000});
    await page.locator('#bLoad').click({timeout:10000});
    // Exercise real visible graphics settings before entering the world.
    await page.locator('#fcAdvanced > summary').click({timeout:10000});
    await page.locator('#mGraphics').selectOption('performance',{timeout:10000});
    let graphics=await page.evaluate(()=>window.game?.graphics?.mode);
    if(graphics!=='performance')throw new Error('Performance preset did not apply');
    await page.locator('#mGraphics').selectOption('auto',{timeout:10000});
    graphics=await page.evaluate(()=>window.game?.graphics?.mode);
    if(graphics!=='auto')throw new Error('Auto graphics preset did not apply');
    await page.locator('#fcMore > summary').click({timeout:10000});
    await page.locator('#bJudgeDemo').click({timeout:10000});
    await page.waitForFunction(()=>window.game?.state==='play',{timeout:120000});
    // Gameplay must truly have a rendered canvas and a visible world.
    await page.waitForFunction(()=>document.querySelector('#gl')?.width>100
      && document.querySelector('#gl')?.height>100,{timeout:10000});
    await page.locator('#fcJudgeTour').waitFor({state:'visible',timeout:12000});
    await page.screenshot({path:out+'/'+label+'-play.png'});
    const daytime=await page.evaluate(()=>window.game.env.tod);
    if(Math.abs(daytime-.25)>1e-6)
      throw new Error('Fresh Survival demo is not set to permanent daytime: '+daytime);
    const tour=page.locator('#fcJudgeTour');
    if(!(await tour.innerText()).includes('Meet Lofi'))throw new Error('Tour first step missing');
    await page.locator('.fc-tour-next').click({timeout:10000});
    if(!(await tour.innerText()).includes('Survive the winter'))throw new Error('Adventure tour step missing');
    await page.locator('.fc-tour-next').click({timeout:10000});
    await page.locator('.fc-tour-next').click({timeout:10000});
    if(!(await tour.innerText()).includes('Complete quests'))throw new Error('Rewards tour step missing');
    await page.locator('.fc-tour-open').click({timeout:10000});
    await page.getByText('LOCAL GAME POINTS — NOT CRYPTO').waitFor({state:'visible',timeout:15000});
    // New objectives must render on both desktop and touch browsers, without
    // adding any invented progress to a fresh world.
    await page.getByText('Daily Winter Trials · sword skill and exploration')
      .waitFor({state:'visible',timeout:10000});
    const initialTrials=await page.evaluate(()=>{
      const r=window.game.rewards.serialize();
      return {parries:r.dailyParries,travel:r.dailyTravel,points:r.points};
    });
    if(initialTrials.parries!==0||initialTrials.travel!==0||initialTrials.points!==0)
      throw new Error('Winter Trials started with fabricated credit: '+JSON.stringify(initialTrials));
    // Accept a real expedition via the visible UI, without awarding fake kills
    // or scripted XP. Claimed/active status persists in the world-scoped ledger.
    await page.locator('#flurryModal .fc-expedition-card button')
      .getByText('Accept Expedition').click({timeout:10000});
    await page.waitForFunction(()=>window.game?.rewards?.serialize?.()?.expedition?.active==='frost-patrol');
    const contract=await page.evaluate(()=>{
      const g=window.game,r=g.rewards.serialize();
      return {active:r.expedition.active,completed:r.expedition.claimed.length,
        points:r.points,killsBase:r.expedition.base.kills};
    });
    if(contract.active!=='frost-patrol'||contract.completed!==0||contract.points!==0)
      throw new Error('Expedition acceptance fabricated rewards: '+JSON.stringify(contract));
    console.log(label+' Expedition acceptance saved '+JSON.stringify(contract));
    await page.screenshot({path:out+'/'+label+'-rewards.png'});
    await page.locator('#flurryModal .fc-dialog-close').click({timeout:10000});
    await tour.waitFor({state:'visible',timeout:10000});
    await page.locator('.fc-tour-close').click({timeout:10000});
    await tour.waitFor({state:'hidden',timeout:10000});
    // Accepted mission is visible in the actual world as a click-to-open HUD,
    // not only in a menu. This must not cover the touch attack controls.
    await page.locator('#fcExpeditionTracker').waitFor({state:'visible',timeout:10000});
    if(!(await page.locator('#fcExpeditionTracker').innerText()).includes('Frost Patrol'))
      throw new Error('Accepted expedition missing from in-world tracker');
    // Visit the real Lofi model in this disposable QA world and open its
    // contextual dialogue. Temporarily move the player for interaction QA,
    // restore position afterwards, and never forge kills, XP or rewards.
    const npcSnapshot=await page.evaluate(()=>{
      const p=window.game.player,npc=window.game.flurry.getLofiPosition();
      if(!npc)throw Error('Lofi did not spawn beside the starter shack');
      const saved={x:p.x,y:p.y,z:p.z,vx:p.vx,vy:p.vy,vz:p.vz,
        onGround:p.onGround,health:p.health,yaw:p.yaw,pitch:p.pitch};
      p.x=npc.x+1.6;p.z=npc.z+1.5;p.y=npc.y+.1;
      p.vx=p.vy=p.vz=0;
      return saved;
    });
    await page.locator('#fcTalkLofi').waitFor({state:'visible',timeout:12000});
    if(options.isMobile)await page.locator('#fcTalkLofi').click({timeout:10000});
    else await page.keyboard.press('f');
    await page.getByText('Lofi the Yeti · Expedition Captain').waitFor({
      state:'visible',timeout:10000
    });
    if(!(await page.locator('#flurryModal .fc-lofi-dialogue').innerText()).includes('Frost Patrol'))
      throw new Error('Lofi does not react to accepted quest progress');
    await page.getByRole('button',{name:'📖 Explorer Journal'}).waitFor({state:'visible',timeout:10000});
    await page.getByRole('button',{name:'Open Expedition Board'}).click({timeout:10000});
    await page.getByText('LOCAL GAME POINTS — NOT CRYPTO').waitFor({
      state:'visible',timeout:10000
    });
    await page.locator('#flurryModal .fc-dialog-close').click({timeout:10000});
    await page.evaluate(saved=>{
      Object.assign(window.game.player,saved);
    },npcSnapshot);
    const afterLofi=await page.evaluate(()=>{
      const s=window.game.rewards.serialize();
      return {active:s.expedition.active,claimed:s.expedition.claimed.length,
        points:s.points};
    });
    if(afterLofi.active!=='frost-patrol'||afterLofi.claimed!==0||afterLofi.points!==0)
      throw new Error('Talking with Lofi fabricated mission claims: '+JSON.stringify(afterLofi));
    if(!(await page.evaluate(()=>window.game.flurry.guideToLofi())))
      throw new Error('World map cannot follow Lofi');
    await page.waitForFunction(()=>document.querySelector('#fcMiniMap .fc-mini-label')?.
      textContent.includes('Lofi the Yeti'),{timeout:10000});
    console.log(label+' Lofi NPC dialogue, quest safety and minimap navigation passed');
    // Map must show real dungeon landmarks and a currently loaded hostile mob.
    // The map test creature is not defeated and therefore grants zero XP/loot.
    await page.evaluate(()=>{
      const g=window.game,p=g.player;
      const mob=new g.Mob(g,'frostling',p.x+4,p.y,p.z+5,{level:1});
      g.mobs.push(mob);
      window.__mapSmokeMob=mob;
    });
    if(options.isMobile)await page.locator('#fcMiniMap').tap({timeout:10000});
    else await page.keyboard.press('m');
    await page.getByText('KNOWN DUNGEONS',{exact:true})
      .waitFor({state:'visible',timeout:10000});
    const dungeonPin=page.locator('#flurryModal .fc-map-pin.is-dungeon')
      .first().locator('button.fc-map-pin-save');
    // Desktop supports keyboard navigation; mobile uses a genuine touch tap.
    if(options.isMobile)await dungeonPin.tap({timeout:10000});
    else {await dungeonPin.focus();await page.keyboard.press('Enter');}
    await page.getByText('YOUR SAVED PINS',{exact:true})
      .waitFor({state:'visible',timeout:10000});
    await page.locator('#flurryModal .fc-map-pin.is-monster').first()
      .waitFor({state:'visible',timeout:10000});
    const monsterPin=page.locator('#flurryModal .fc-map-pin.is-monster')
      .first().locator('button.fc-map-pin-save');
    if(options.isMobile)await monsterPin.tap({timeout:10000});
    else {await monsterPin.focus();await page.keyboard.press('Enter');}
    const mapPins=await page.locator('#flurryModal .fc-map-pin')
      .filter({hasText:'sighting'}).count();
    if(mapPins<1)throw new Error('Could not save live monster sighting as map pin');
    // Desktop can dismiss the map through Escape even with mouse capture;
    // touch landscape exercises the real visible close button.
    if(options.isMobile)
      await page.locator('#flurryModal .fc-dialog-close').tap({timeout:10000});
    else{
      await page.locator('#flurryModal .fc-dialog-close').focus();
      await page.keyboard.press('Enter');
    }
    await page.evaluate(()=>{
      const g=window.game,m=window.__mapSmokeMob;
      if(m){const i=g.mobs.indexOf(m);if(i>=0)g.mobs.splice(i,1);m.remove();}
      delete window.__mapSmokeMob;
    });
    console.log(label+' true dungeon and live-monster map pins passed');
    // Actual player movement: keyboard on desktop and captured touch joystick
    // in the landscape emulation. No coordinate teleporting or fake XP.
    const position=()=>page.evaluate(()=>({x:window.game.player.x,z:window.game.player.z}));
    const before=await position();
    const travelBefore=await page.evaluate(()=>window.game.rewards.serialize().dailyTravel);
    if(options.isMobile){
      const box=await page.locator('#joyzone').boundingBox();
      if(!box)throw new Error('Touch joystick not visible');
      const x=box.x+Math.min(box.width*.25,85),y=box.y+Math.min(box.height*.5,80);
      await page.mouse.move(x,y);await page.mouse.down();
      await page.mouse.move(x,y+46,{steps:6});
      await page.waitForTimeout(1000);await page.mouse.up();
    }else{
      await page.keyboard.down('s');await page.waitForTimeout(1000);
      await page.keyboard.up('s');
    }
    const after=await position();
    const travelled=Math.hypot(after.x-before.x,after.z-before.z);
    if(travelled<.08)throw new Error('Live movement failed: '+travelled.toFixed(3)+' blocks');
    const travelAfter=await page.evaluate(()=>window.game.rewards.serialize().dailyTravel);
    if(!(travelAfter>travelBefore))
      throw new Error('On-foot Winter Trial did not reflect real movement: '+
        JSON.stringify({travelBefore,travelAfter,travelled}));
    // A genuine walk in a known procedural terrain biome should populate the
    // new world-scoped Field Journal without awarding XP or local points.
    await page.waitForFunction(()=>window.game.journal?.stats()?.terrain>=1,{timeout:12000});
    const discovery=await page.evaluate(()=>{
      const g=window.game,raw=g.journal.serialize();
      const beforePoints=g.rewards.points;
      if(!g.saveRewards())throw Error('Could not persist journal with world save');
      const world=JSON.parse(localStorage.getItem('vc_world_'+g.worldId));
      const saved=world?.journal?.entries||[];
      if(saved.length!==raw.entries.length)
        throw Error('Journal not preserved in existing save: '+saved.length);
      g.journal.load(world.journal); // real loader exercised without a new world
      return {terrain:g.journal.stats().terrain,saved:saved.length,
        pointsBefore:beforePoints,pointsAfter:g.rewards.points};
    });
    if(discovery.terrain<1||discovery.saved<2||
      discovery.pointsBefore!==discovery.pointsAfter)
      throw new Error('Explorer Journal invented progress or lost records: '+
        JSON.stringify(discovery));
    await page.evaluate(()=>window.game.journal.open());
    await page.getByText('Explorer’s Field Journal').waitFor({state:'visible',timeout:10000});
    await page.getByText('LANDSCAPES DISCOVERED').waitFor({state:'visible',timeout:10000});
    await page.locator('#flurryModal .fc-journal-entry').first().waitFor({state:'visible',timeout:10000});
    if(options.isMobile)await page.locator('#flurryModal .fc-dialog-close').tap();
    else{
      await page.locator('#flurryModal .fc-dialog-close').focus();
      await page.keyboard.press('Enter');
    }
    if(options.isMobile)await page.locator('#fcMiniMap').tap({timeout:10000});
    else await page.keyboard.press('m');
    const diaryMap=await page.evaluate(()=>({
      stats:window.game.journal?.stats?.(),paused:window.game.paused,state:window.game.state,
      pins:window.game.journal?.mapPlaces?.()?.length,
      dialog:document.querySelector('#flurryModal')?.style.display,
      title:document.querySelector('#flurryModal h2')?.textContent,
      headings:[...document.querySelectorAll('#flurryModal .fc-map-group')].map(x=>x.textContent),
      mapPinCount:document.querySelectorAll('#flurryModal .fc-map-pin.is-discovery').length
    }));
    console.log(label+' field journal map status '+JSON.stringify(diaryMap));
    await page.getByText('FIELD JOURNAL · VISITED PLACES')
      .waitFor({state:'visible',timeout:10000});
    if(options.isMobile)await page.locator('#flurryModal .fc-dialog-close').tap();
    else{
      await page.locator('#flurryModal .fc-dialog-close').focus();
      await page.keyboard.press('Enter');
    }
    console.log(label+' real terrain discoveries, journal save/restore and map passed');
    // Test an actual deterministic 3D landmark, proximity-based inspection,
    // and a once-per-world perk on both desktop and touch emulation.
    const landmarkStart=await page.evaluate(()=>{
      const g=window.game,p=g.player;
      const original={x:p.x,y:p.y,z:p.z,health:p.health,
        guardStamina:p.guardStamina,creative:p.creative};
      g.landmarks.update(3);
      const site=g.landmarks.sites[0];
      if(!site)throw new Error('No snowy 3D landmark generated near demo spawn');
      const model=g.scene.children.find(child=>child.position&&
        Math.abs(child.position.x-site.x-.5)<.001&&
        Math.abs(child.position.z-site.z-.5)<.001&&child.children?.length>4);
      if(!model)throw new Error('A map marker exists without real 3D landmark geometry');
      p.x=site.x+.5;p.y=site.y;p.z=site.z+.5;
      p.health=Math.min(10,p.maxHealth-7);p.guardStamina=12;p.creative=false;
      g.landmarks.update(.5);
      const before={points:g.rewards.points,xp:g.adventure.serialize().xp};
      if(document.querySelector('#fcInspectLandmark')?.style.display!=='block')
        throw new Error('No visible touch/keyboard Inspect button at a real landmark');
      return {original,site,before};
    });
    // Simulate the real user control: desktop F, mobile visible touch Explore.
    if(options.isMobile)await page.locator('#fcInspectLandmark').tap({timeout:10000});
    else await page.keyboard.press('f');
    await page.getByText(landmarkStart.site.name,{exact:false}).first()
      .waitFor({state:'visible',timeout:10000});
    const landmarkPerk=page.locator('#flurryModal .fc-landmark-benefit');
    await landmarkPerk.waitFor({state:'visible',timeout:10000});
    if(await landmarkPerk.isDisabled())
      throw new Error('New winter landmark perk incorrectly disabled');
    if(options.isMobile)await landmarkPerk.tap({timeout:10000});
    else{await landmarkPerk.focus();await page.keyboard.press('Enter');}
    const landmarkResult=await page.evaluate(()=>{
      const g=window.game;
      const saved=JSON.parse(localStorage.getItem('vc_world_'+g.worldId));
      return {visited:g.landmarks.serialize().visited.length,
        used:g.landmarks.serialize().used.length,
        storedVisited:saved.winterLandmarks?.visited?.length,
        storedUsed:saved.winterLandmarks?.used?.length,
        points:g.rewards.points,xp:g.adventure.serialize().xp};
    });
    if(landmarkResult.visited!==1||landmarkResult.used!==1||
       landmarkResult.storedVisited!==1||landmarkResult.storedUsed!==1||
       landmarkResult.points!==landmarkStart.before.points||
       landmarkResult.xp!==landmarkStart.before.xp)
      throw new Error('Landmark exploration not reliably saved or issued fake rewards: '+
        JSON.stringify(landmarkResult));
    if(!await landmarkPerk.isDisabled())
      throw new Error('A one-time landmark perk remained claimable twice');
    if(options.isMobile)await page.locator('#flurryModal .fc-dialog-close').tap();
    else{await page.locator('#flurryModal .fc-dialog-close').focus();
      await page.keyboard.press('Enter');}
    const reopen=await page.evaluate(start=>{
      const g=window.game,p=g.player;
      const saved=JSON.parse(localStorage.getItem('vc_world_'+g.worldId));
      g.landmarks.load(saved.winterLandmarks);
      g.landmarks.update(3);
      const ok=g.landmarks.serialize().used.includes(start.site.id);
      Object.assign(p,start.original);
      g.landmarks.update(3);
      return {ok,sites:g.landmarks.sites.length};
    },landmarkStart);
    if(!reopen.ok)throw new Error('Landmark one-time use lost after a world reload');
    console.log(label+' actual 3D landmark, one-time perk and persistent visit passed');
    // Browser rAF timing is a software-renderer diagnostic, not a real
    // physical phone FPS claim. Capture a distribution, not one FPS guess.
    const timing=await page.evaluate(()=>new Promise(resolve=>{
      const deltas=[],started=performance.now();let previous=started;
      const measure=now=>{
        if(now>previous)deltas.push(now-previous); // Count slow frames too.
        previous=now;
        if(now-started<3000){requestAnimationFrame(measure);return;}
        deltas.sort((a,b)=>a-b);
        const percentile=p=>deltas[Math.min(deltas.length-1,Math.floor((deltas.length-1)*p))]||0;
        resolve({frames:deltas.length,medianMs:Math.round(percentile(.5)*10)/10,
          p95Ms:Math.round(percentile(.95)*10)/10});
      };
      requestAnimationFrame(measure);
    }));
    console.log(label+' movement '+travelled.toFixed(2)+' blocks; rAF frame timing '+JSON.stringify(timing));
    // Run a deterministic Frostling combat *test encounter* through the
    // real targeting + melee damage pipeline. No fabricated kill count, loot,
    // token claims or saved-world achievements are awarded.
    const combat=await page.evaluate(()=>{
      const g=window.game,p=g.player;
      const savedYaw=p.yaw,savedPitch=p.pitch;
      let creature=null,aimed=false;
      for(const offset of [0,Math.PI/2,Math.PI,-Math.PI/2]){
        const yaw=savedYaw+offset,d=1.45;
        const x=p.x-Math.sin(yaw)*d,z=p.z-Math.cos(yaw)*d;
        const mob=new g.Mob(g,'frostling',x,p.y,z,{level:1});
        g.mobs.push(mob);
        p.yaw=yaw;p.pitch=-.28;p.aim();
        if(p.mobTarget===mob){creature=mob;aimed=true;break;}
        g.mobs.pop();mob.remove();
      }
      let damage=0;
      if(aimed){
        const start=creature.hp;
        p.attackCd=0;
        p.updateInteraction(.05,{left:true,attackPressed:true,right:false,rightPressed:false});
        damage=start-creature.hp;
        const i=g.mobs.indexOf(creature);
        if(i>=0)g.mobs.splice(i,1);
        creature.remove();
      }
      p.yaw=savedYaw;p.pitch=savedPitch;p.aim();
      return {aimed,damage};
    });
    if(!combat.aimed||combat.damage<=0)
      throw new Error('Frostling target/attack pipeline failed: '+JSON.stringify(combat));
    console.log(label+' controlled Frostling combat passed '+JSON.stringify(combat));
    // Exercise the real sword-guard input and hurt pipeline inside WebGL.
    // Restore all temporary player attributes: this is a QA encounter,
    // not an achievement, score, NFT or cryptographic reward.
    const parriesBefore=await page.evaluate(()=>window.game.rewards.serialize().dailyParries);
    const defense=await page.evaluate(async()=>{
      const B=await import('/js/blocks.js');
      const p=window.game.player;
      const snapshot={health:p.health,invuln:p.invuln,guarding:p.guarding,
        guardStamina:p.guardStamina,guardCooldown:p.guardCooldown,
        guardElapsed:p.guardElapsed,creative:p.creative,flying:p.flying,
        x:p.x,y:p.y,z:p.z,vx:p.vx,vy:p.vy,vz:p.vz,
        kbx:p.kbx,kbz:p.kbz,yaw:p.yaw,onGround:p.onGround};
      const slot=p.sel,held=p.inv[slot];
      try{
        p.creative=false;p.flying=false;p.inv[slot]={id:B.toolId(3,0),n:1};
        p.health=p.maxHealth;p.invuln=0;p.guardStamina=100;p.guardCooldown=0;
        p.guarding=false;p.guardElapsed=0;
        p.update(.016,{guard:true,fwd:0,strafe:0,jump:false,
          sneak:false,sprint:false,left:false,right:false});
        const active=p.guarding;
        const sx=p.x-Math.sin(p.yaw)*2,sz=p.z-Math.cos(p.yaw)*2;
        const baseline=p.health;
        p.hurt(8,sx,sz,'melee');
        const guarded=Math.round((baseline-p.health)*100)/100;
        p.invuln=0;p.guarding=false;p.health=baseline;
        p.hurt(8,sx,sz,'melee');
        const unguarded=Math.round((baseline-p.health)*100)/100;
        return {active,guarded,unguarded};
      }finally{
        Object.assign(p,snapshot);p.inv[slot]=held;
      }
    });
    if(!defense.active||defense.guarded<=0||
        defense.guarded>=defense.unguarded*.5)
      throw new Error('Real sword guard failed: '+JSON.stringify(defense));
    console.log(label+' real sword guard passed '+JSON.stringify(defense));
    const parryLedger=await page.evaluate(()=>{
      const r=window.game.rewards.serialize();
      return {parries:r.dailyParries,points:r.points};
    });
    if(parryLedger.parries!==parriesBefore+1||parryLedger.points!==0)
      throw new Error('Perfect Parry trial event invalid: '+JSON.stringify({
        parriesBefore,...parryLedger}));
    // Press the *actual keyboard key* on desktop. Earlier Blocks shortcut G
    // collided with Guard; G now raises sword while N opens the block catalog.
    if(!options.isMobile){
      const oldSlot=await page.evaluate(()=>{
        const g=window.game,p=g.player;
        const index=p.inv.findIndex(s=>s&&s.id>=0&&
          [280+3*4,280+3*4+1,280+3*4+2,280+3*4+3].includes(s.id));
        const previous=p.sel;
        if(index>=0)p.sel=index;
        return {index,previous};
      });
      if(oldSlot.index<0)throw new Error('Guided Survival player has no starter sword');
      await page.keyboard.down('g');
      await page.waitForFunction(()=>window.game.player.guarding===true,{timeout:8000});
      if(await page.locator('#flurryModal').evaluate(el=>el.style.display==='flex'))
        throw new Error('Guard key reopened the Blocks dialog');
      await page.keyboard.up('g');
      await page.waitForFunction(()=>window.game.player.guarding===false,{timeout:8000});
      await page.evaluate(index=>{window.game.player.sel=index;},oldSlot.previous);
    }

    await page.screenshot({path:out+'/'+label+'-moving.png'});
    // Simulate a legacy dark saved time. The renderer must restore daytime,
    // regardless of the old world clock or Creative/Survival selection.
    if(!options.isMobile){
      await page.evaluate(()=>{
        const g=window.game;
        g.env.tod=.83;
        g.player.pitch=.37;g.player.yaw=Math.PI;
      });
      await page.waitForTimeout(700);
      const locked=await page.evaluate(()=>window.game.env.tod);
      if(Math.abs(locked-.25)>1e-6)
        throw new Error('World fell back to night after an old save: '+locked);
      await page.screenshot({path:out+'/'+label+'-daylight.png'});
    }
    const result=await page.evaluate(()=>({
      state:window.game?.state,mode:window.game?.player?.creative?'creative':'survival',
      level:window.game?.adventure?.level??null,
      rendererSize:[document.querySelector('#gl')?.width,document.querySelector('#gl')?.height],
      title:document.title,
      graphics:window.game?.graphics?.mode,
      gpuPixelRatio:window.game?.graphics?.ratio,
      loadedChunks:window.game?.world?.chunks?.size
    }));
    console.log(label+' passed '+JSON.stringify(result));
    if(result.mode!=='survival')throw Error('Tour was not Survival mode');
    return result;
  }catch(error){
    await page.screenshot({path:out+'/'+label+'-failure.png'}).catch(()=>{});
    throw new Error(label+': '+error.message);
  }finally{
    await context.close();
  }
}
try{
  await pause(900);
  const chrome=existsSync('/usr/bin/google-chrome')?'/usr/bin/google-chrome':
    existsSync('/usr/bin/google-chrome-stable')?'/usr/bin/google-chrome-stable':null;
  browser=await chromium.launch({
    ...(chrome?{executablePath:chrome}:{}),
    headless:true,
    args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader',
      '--enable-unsafe-swiftshader','--disable-dev-shm-usage']
  });
  await smoke('desktop',{viewport:{width:1280,height:720},isMobile:false});
  await smoke('mobile-landscape',{viewport:{width:873,height:393},isMobile:true});
  if(errors.length)throw new Error('Unexpected browser errors:\n'+errors.join('\n').slice(0,8000));
  console.log('BROWSER QA PASS: both desktop and touch landscape launched a real world,');
  console.log('guided demo and Rewards Hub opened, and browser errors list was empty.');
}catch(error){
  console.error('BROWSER QA FAIL: '+error.stack);
  process.exitCode=1;
}finally{
  if(browser)await browser.close();
  server.kill('SIGTERM');
}
