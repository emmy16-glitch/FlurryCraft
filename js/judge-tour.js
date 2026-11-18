// Short, dismissible judge-first walkthrough. It never grants items, XP,
// cryptocurrency, NFT ownership or simulated wins.
import {JUDGE_TOUR_STEPS,tourStep} from './judge-tour-core.js';
export function initJudgeTour({game,openAdventure,openBlocks,openRewards,openStudio,openMarketplace,isDialogOpen}){
  let active=false,index=0,lastVisible=false;
  const root=document.createElement('aside');
  root.id='fcJudgeTour';root.setAttribute('aria-label','FlurryCraft guided demonstration');
  root.hidden=true;
  root.innerHTML='<div class="fc-tour-top"><span class="fc-tour-eyebrow">❄️ FLURRYCRAFT TOUR</span><button type="button" class="fc-tour-close" aria-label="Exit guided tour">✕</button></div><div class="fc-tour-progress"></div><strong class="fc-tour-heading"></strong><p class="fc-tour-body"></p><div class="fc-tour-tip"></div><div class="fc-tour-actions"><button type="button" class="fc-tour-back">Back</button><button type="button" class="fc-tour-open">Explore feature</button><button type="button" class="fc-tour-next">Next</button></div>';
  const style=document.createElement('style');
  style.textContent=`
    #fcJudgeTour{position:fixed;z-index:32;top:52px;right:12px;width:min(335px,42vw);
      max-height:calc(100dvh - 75px);overflow:auto;pointer-events:auto;
      padding:12px 14px;background:linear-gradient(145deg,#12374eeb,#081c30f5);
      border:1px solid #78d6e9;border-radius:17px;box-shadow:0 8px 34px #000a;
      color:#f3fbff;font:600 12px/1.43 system-ui;backdrop-filter:blur(12px)}
    #fcJudgeTour[hidden]{display:none!important}
    #fcJudgeTour .fc-tour-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
    #fcJudgeTour .fc-tour-eyebrow{color:#8fe5f7;font:900 10px/1.5 system-ui;letter-spacing:.13em}
    #fcJudgeTour .fc-tour-close{padding:4px 7px;color:#dff8ff;background:#173e55;border:1px solid #3c7189;border-radius:8px;min-width:27px}
    #fcJudgeTour .fc-tour-progress{margin-top:5px;color:#a8d7e7;font:700 10px/1.45 system-ui}
    #fcJudgeTour .fc-tour-heading{display:block;color:#fff;font:850 17px/1.3 system-ui;margin:6px 0}
    #fcJudgeTour .fc-tour-body{font:600 11px/1.5 system-ui;color:#cce5ed;margin:6px 0}
    #fcJudgeTour .fc-tour-tip{font:550 10px/1.45 system-ui;color:#b1d2dc;border-left:2px solid #54bbd0;padding:3px 8px;margin:8px 0}
    #fcJudgeTour .fc-tour-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
    #fcJudgeTour .fc-tour-actions button{min-height:35px;padding:6px 9px;border:1px solid #4b8ea6;border-radius:9px;color:#e9faff;background:#1c4a63;font:800 11px system-ui;cursor:pointer}
    #fcJudgeTour .fc-tour-actions button:disabled{opacity:.45}
    #fcJudgeTour .fc-tour-actions .fc-tour-next{background:#83e0ee;color:#083142;border-color:#aff4fc}
    #fcJudgeTour .fc-tour-actions .fc-tour-open{background:#2e7894}
    #fcJudgeTour button:focus-visible{outline:2px solid white;outline-offset:2px}
    @media(max-height:520px){#fcJudgeTour{top:8px;right:8px;width:min(280px,42vw);
      max-height:calc(100dvh - 16px);padding:9px 10px}
      #fcJudgeTour .fc-tour-heading{font-size:14px;margin:3px 0}
      #fcJudgeTour .fc-tour-body{font-size:10px;margin:3px 0}
      #fcJudgeTour .fc-tour-tip{font-size:9px;margin:5px 0}
      #fcJudgeTour .fc-tour-actions button{min-height:31px;padding:5px 7px;font-size:10px}}
    @media(max-width:600px) and (orientation:portrait){#fcJudgeTour{width:min(300px,92vw);top:54px;right:50%;transform:translateX(50%)}}
    @media(prefers-reduced-motion:reduce){#fcJudgeTour *{transition:none!important}}
  `;
  document.head.appendChild(style);
  document.body.appendChild(root);
  const $=cls=>root.querySelector('.'+cls);
  const actions={
    adventure:openAdventure,
    blocks:openBlocks,
    rewards:openRewards,
    studio:openStudio,
    marketplace:openMarketplace,
  };
  function draw(){
    const step=tourStep(index);
    $('fc-tour-progress').textContent=step.tag+' · '+(index+1)+' of '+JUDGE_TOUR_STEPS.length;
    $('fc-tour-heading').textContent=step.title;
    $('fc-tour-body').textContent=step.description;
    $('fc-tour-tip').textContent=step.tip;
    $('fc-tour-back').disabled=index===0;
    $('fc-tour-open').hidden=!step.action;
    $('fc-tour-open').textContent=step.id==='sui'?'Open Testnet UI':step.id==='creator'?'Open My Builds':
      step.id==='battle'?'Open Adventure':step.id==='rewards'?'Open Rewards':'Choose blocks';
    $('fc-tour-next').textContent=index===JUDGE_TOUR_STEPS.length-1?'Finish':'Next →';
  }
  function close(){active=false;root.hidden=true;lastVisible=false;}
  function update(){
    const show=active&&game.state==='play'&&!game.paused&&!game.player?.dead&&
      !game.ui?.isOpen&&!isDialogOpen();
    if(show!==lastVisible){root.hidden=!show;lastVisible=show;}
  }
  function start(){if(game.state!=='play')return false;active=true;index=0;draw();update();return true;}
  $('fc-tour-close').addEventListener('click',close);
  $('fc-tour-back').addEventListener('click',()=>{index=Math.max(0,index-1);draw();});
  $('fc-tour-next').addEventListener('click',()=>{
    if(index>=JUDGE_TOUR_STEPS.length-1){close();return;}
    index++;draw();
  });
  $('fc-tour-open').addEventListener('click',()=>{
    const action=actions[tourStep(index).action];if(action)action();
    update();
  });
  // Avoid clicks leaking into the 3D world while using guided controls.
  root.addEventListener('pointerdown',e=>e.stopPropagation());
  root.addEventListener('mousedown',e=>e.stopPropagation());
  root.addEventListener('touchstart',e=>e.stopPropagation(),{passive:true});
  return {start,close,update,get active(){return active;},get step(){return index;}};
}
