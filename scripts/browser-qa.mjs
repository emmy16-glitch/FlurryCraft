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
  await page.locator('#bJudgeDemo').waitFor({state:'visible',timeout:10000});
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
    // Exercise real visible graphics settings before entering the world.
    await page.locator('#fcAdvanced > summary').click({timeout:10000});
    await page.locator('#mGraphics').selectOption('performance',{timeout:10000});
    let graphics=await page.evaluate(()=>window.game?.graphics?.mode);
    if(graphics!=='performance')throw new Error('Performance preset did not apply');
    await page.locator('#mGraphics').selectOption('auto',{timeout:10000});
    graphics=await page.evaluate(()=>window.game?.graphics?.mode);
    if(graphics!=='auto')throw new Error('Auto graphics preset did not apply');
    await page.locator('#bJudgeDemo').click({timeout:10000});
    await page.waitForFunction(()=>window.game?.state==='play',{timeout:120000});
    // Gameplay must truly have a rendered canvas and a visible world.
    await page.waitForFunction(()=>document.querySelector('#gl')?.width>100
      && document.querySelector('#gl')?.height>100,{timeout:10000});
    await page.locator('#fcJudgeTour').waitFor({state:'visible',timeout:12000});
    await page.screenshot({path:out+'/'+label+'-play.png'});
    const tour=page.locator('#fcJudgeTour');
    if(!(await tour.innerText()).includes('Meet Lofi'))throw new Error('Tour first step missing');
    await page.locator('.fc-tour-next').click({timeout:10000});
    if(!(await tour.innerText()).includes('Survive the winter'))throw new Error('Adventure tour step missing');
    await page.locator('.fc-tour-next').click({timeout:10000});
    await page.locator('.fc-tour-next').click({timeout:10000});
    if(!(await tour.innerText()).includes('Complete quests'))throw new Error('Rewards tour step missing');
    await page.locator('.fc-tour-open').click({timeout:10000});
    await page.getByText('LOCAL GAME POINTS — NOT CRYPTO').waitFor({state:'visible',timeout:15000});
    await page.screenshot({path:out+'/'+label+'-rewards.png'});
    await page.locator('#flurryModal .fc-dialog-close').click({timeout:10000});
    await tour.waitFor({state:'visible',timeout:10000});
    await page.locator('.fc-tour-close').click({timeout:10000});
    await tour.waitFor({state:'hidden',timeout:10000});
    // Actual player movement: keyboard on desktop and captured touch joystick
    // in the landscape emulation. No coordinate teleporting or fake XP.
    const position=()=>page.evaluate(()=>({x:window.game.player.x,z:window.game.player.z}));
    const before=await position();
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
    // Browser rAF timing is a software-renderer diagnostic, not a real
    // physical phone FPS claim. Capture a distribution, not one FPS guess.
    const timing=await page.evaluate(()=>new Promise(resolve=>{
      const deltas=[],started=performance.now();let previous=started;
      const measure=now=>{
        if(now>previous&&now-previous<250)deltas.push(now-previous);
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
    await page.screenshot({path:out+'/'+label+'-moving.png'});
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
