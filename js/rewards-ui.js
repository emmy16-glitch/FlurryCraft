// The Rewards Hub displays local sandbox mission points; never real currency.
// No wallet signature, payout request, or server call is made by this module.
import {createRewardsState,rewardCards,collectLocalPoints,recordRewardPlacement,
  requestCryptoPayout,CRYPTO_REWARDS_ENABLED,acceptExpeditionMission,
  collectExpeditionMission} from './rewards-core.js';
import {expeditionGuideTarget} from './expedition-guide.js';

export function initRewardsHub({game,panel,openDialog,notify,onOpenMarketplace,
  onNavigate=()=>{},onExpeditionEvent=()=>{}}){
  let state=createRewardsState(null,null);
  const el=(tag,text,parent=panel)=>{
    const node=document.createElement(tag);if(text!==undefined)node.textContent=String(text);
    parent.appendChild(node);return node;
  };
  const css=el('style',undefined,document.head);
  css.textContent=[
    '#flurryModal .fc-reward-intro{font:600 12px/1.55 system-ui;color:#cce8f3;margin:8px 0 12px}',
    '#flurryModal .fc-reward-status{padding:12px 14px;border:1px solid #447a91;border-radius:13px;background:#123b52;margin:10px 0}',
    '#flurryModal .fc-reward-status strong{display:block;color:#d8faff;font:900 21px system-ui}',
    '#flurryModal .fc-reward-status span{display:block;color:#b7d5e1;font:600 11px/1.5 system-ui;margin-top:3px}',
    '#flurryModal .fc-reward-label{font:850 13px system-ui;color:#e7faff;margin:17px 0 8px}',
    '#flurryModal .fc-reward-card{border:1px solid #3e7187;border-radius:12px;background:#13374d;padding:10px 12px;margin:7px 0}',
    '#flurryModal .fc-reward-title{font:750 12px/1.4 system-ui;color:#f2fbff}',
    '#flurryModal .fc-reward-sub{font:600 11px/1.5 system-ui;color:#b4d3e0;margin:4px 0}',
    '#flurryModal .fc-reward-card button,#flurryModal .fc-reward-action{min-height:39px;border-radius:9px;background:#8be5f2;color:#063346;font:850 12px system-ui;padding:8px 12px;margin-top:7px;width:100%}',
    '#flurryModal .fc-reward-card button:disabled,#flurryModal .fc-reward-action:disabled{opacity:.6;background:#355c71;color:#d0e6ed}',
    '#flurryModal .fc-reward-safety{font:600 11px/1.5 system-ui;color:#f1d8b2;padding:11px;border:1px solid #987b4a;border-radius:12px;background:#3c352b}',
    '#flurryModal .fc-expedition-card{border:1px solid #79cddd;background:#123b50;border-radius:13px;padding:12px;margin:8px 0 13px}',
    '#flurryModal .fc-expedition-meter{height:7px;overflow:hidden;background:#24465b;border-radius:8px;margin-top:10px}',
    '#flurryModal .fc-expedition-fill{height:100%;background:#78e6ed;transition:width .2s;width:0}',
    '#fcExpeditionTracker{display:none;position:fixed;z-index:27;right:10px;top:77px;width:min(190px,29vw);padding:7px 10px;border:1px solid #77bed1;border-radius:10px;background:#0b3046ee;color:#dbf7ff;font:700 10px/1.4 system-ui;text-align:left;box-shadow:0 4px 14px #00182777;cursor:pointer;touch-action:manipulation}',
    '#fcExpeditionTracker strong{display:block;color:#92e5f6;font-size:10px}',
    '#fcExpeditionTracker.ready{border-color:#b3f5d0;color:#b8ffe5}',
    '@media(max-height:520px){#fcExpeditionTracker{right:5px;top:55px;width:min(155px,27vw);font-size:9px;padding:5px 7px}}',
  ].join('\n');
  const tracker=el('button',undefined,document.body);
  tracker.type='button';tracker.id='fcExpeditionTracker';
  tracker.setAttribute('aria-label','Open current Expedition mission in Rewards Hub');
  tracker.addEventListener('pointerdown',e=>e.stopPropagation());
  tracker.addEventListener('click',e=>{e.stopPropagation();open();});
  let hudTick=0,hudText='';
  const adventure=()=>game.adventure?.serialize?.()||{};
  function update(dt=0){
    hudTick-=Number.isFinite(dt)?dt:0;
    if(hudTick>0)return;
    hudTick=.3;
    const eligible=game.state==='play'&&!game.paused&&!game.ui?.isOpen&&
      !game.player?.dead&&!game.player?.creative&&!game.tourActive&&
      document.getElementById('flurryModal')?.style?.display!=='flex';
    if(!eligible){tracker.style.display='none';return;}
    const view=rewardCards(state,adventure(),false);
    const m=view.expedition.mission;
    if(!m||!m.active){tracker.style.display='none';return;}
    const label='EXPEDITION '+m.index+'/'+view.expedition.total+' · '+m.title+
      ' · '+m.progress+'/'+m.target+(m.ready?' · CLAIM REWARD':'');
    if(hudText!==label){hudText=label;tracker.textContent=label;}
    tracker.classList.toggle('ready',m.ready);
    tracker.style.display='block';
  }
  function load(raw){
    state=createRewardsState(raw,adventure());
    hudTick=0;update();
  }
  function serialize(){
    state=createRewardsState(state,adventure());
    return JSON.parse(JSON.stringify(state));
  }
  function recordPlacement(){
    if(game.state!=='play'||game.player?.creative)return;
    state=recordRewardPlacement(state,adventure());
    hudTick=0;
  }
  const current=()=>rewardCards(state,adventure(),!!game.player?.creative).expedition;
  function publishEvent(event){
    // Visual feedback must never roll back a previously committed mission.
    try{onExpeditionEvent(event);}catch(error){console.warn('Quest feedback unavailable',error);}
  }
  function acceptMission(id){
    if(game.state!=='play'||game.paused||game.player?.dead)
      throw new Error('Enter a living Survival world to accept a mission.');
    const before=current().mission;
    state=acceptExpeditionMission(state,adventure(),id,!!game.player?.creative);
    const saved=game.saveRewards?.();
    if(saved===false)notify(game,'Mission accepted, but storage save failed. Export a world backup.');
    notify(game,'Mission accepted: '+before.title);
    hudTick=0;publishEvent({type:'accepted',title:before.title});
    return current();
  }
  function claimMission(id){
    if(game.state!=='play'||game.paused||game.player?.dead)
      throw new Error('Return to Survival gameplay to claim your mission.');
    const claimed=collectExpeditionMission(state,adventure(),id,!!game.player?.creative);
    if(!game.adventure?.awardExpeditionXP?.(claimed.xp))
      throw new Error('Adventure XP could not be awarded; retry in Survival.');
    state=claimed.state; // Points are recorded after XP is successfully awarded.
    const saved=game.saveRewards?.();
    if(saved===false)notify(game,'Reward claimed, but storage save failed. Export a world backup.');
    notify(game,claimed.title+' complete! +'+claimed.points+' Flurry Points · +'+claimed.xp+' XP');
    hudTick=0;publishEvent({type:'completed',title:claimed.title,
      points:claimed.points,xp:claimed.xp});
    return claimed;
  }
  function guideMission(){
    const point=expeditionGuideTarget(current(),adventure());
    if(!point)return false;
    onNavigate(point);
    return true;
  }
  const section=(title)=>{const h=el('h3',title);h.className='fc-reward-label';};
  const message=text=>{const p=el('p',text);p.className='fc-reward-intro';return p;};
  function open(){
    state=createRewardsState(state,adventure());
    const view=rewardCards(state,adventure(),!!game.player?.creative);
    openDialog('✦ Flurry Rewards Hub');
    const banner=el('div',undefined);banner.className='fc-reward-status';
    el('strong',state.points.toLocaleString()+' Flurry Points',banner);
    el('span','Level '+view.totals.level+' · '+view.totals.kills+' monster defeats · '+view.totals.clears+' dungeon clears',banner);
    message('Earn game points by leveling up, building and completing missions. Your rewards belong to this saved world.');
    const safe=el('div',undefined);safe.className='fc-reward-safety';
    el('strong','LOCAL GAME POINTS — NOT CRYPTO',safe);
    el('div','Points cannot be withdrawn, exchanged for SUI or converted into real money. Browser progress is not independently verified. Sui Testnet coins also have no intended monetary value.',safe);
    if(view.sandbox)message('Creative Mode is for free building. Mission point collection is available in Survival Mode only.');
    section('Expedition Board · story contracts');
    const expedition=view.expedition;
    const ec=el('div',undefined);ec.className='fc-expedition-card';
    if(expedition.done){
      el('div','✓ All four winter expeditions completed',ec).className='fc-reward-title';
      el('p','You finished the full contract path in this saved world. Explore higher-level chapters and weekly missions!',ec).className='fc-reward-intro';
    }else{
      const m=expedition.mission;
      el('div','Contract '+m.index+' of '+expedition.total+' · '+m.title,ec).className='fc-reward-title';
      el('p',m.detail,ec).className='fc-reward-intro';
      const status=m.active?m.progress+' / '+m.target+(m.ready?' · Ready to claim':''):
        'Accept this contract to begin tracking new progress.';
      el('div',status,ec).className='fc-reward-sub';
      el('div','Reward: +'+m.points+' local Flurry Points and +'+m.xp+' Adventure XP',ec).className='fc-reward-sub';
      const meter=el('div',undefined,ec);meter.className='fc-expedition-meter';
      const fill=el('div',undefined,meter);fill.className='fc-expedition-fill';
      fill.style.width=(m.progress/m.target*100)+'%';
      const label=m.active?(m.ready?'✓ Claim Expedition Reward':'Mission in progress'):
        'Accept Expedition';
      const btn=el('button',label,ec);btn.type='button';
      btn.disabled=!!view.sandbox||(m.active&&!m.ready);
      btn.addEventListener('click',()=>{
        btn.disabled=true; // ignore double taps until ledger is updated
        try{
          if(!m.active)acceptMission(m.id);
          else claimMission(m.id);
          update();open();
        }catch(error){notify(game,error.message);btn.disabled=false;}
      });
    }
    if(expeditionGuideTarget(expedition,adventure())){
      const navButton=el('button','🧭 Guide to Frost Ruins',ec);
      navButton.type='button';
      navButton.addEventListener('click',()=>{if(!guideMission())notify(game,'Dungeon entrance not yet available.');});
    }
    message('Expedition progress only counts after accepting each contract in Survival. Claims are one-time and saved per world.');
    const renderGroup=(heading,cards)=>{
      section(heading);
      for(const card of cards){
        const box=el('div',undefined);box.className='fc-reward-card';
        el('div',card.title+' · +'+card.points+' points',box).className='fc-reward-title';
        const status=card.claimed?'Collected':card.progress+' / '+card.target+
          (view.sandbox?' · Survival only':'');
        el('div',status,box).className='fc-reward-sub';
        const button=el('button',card.claimed?'✓ Collected':card.ready?'Collect Flurry Points':'Not completed',box);
        button.type='button';button.disabled=!card.ready;
        button.addEventListener('click',()=>{
          try{
            state=collectLocalPoints(state,adventure(),card.key,!!game.player?.creative);
            const saved=game.saveRewards?.();
            if(saved===false)notify(game,'Points collected, but storage save failed. Download a world backup.');
            else notify(game,'+'+card.points+' Flurry Points · '+card.title);
            open();
          }catch(error){notify(game,error.message);}
        });
      }
    };
    renderGroup('Daily missions · reset 00:00 UTC',view.daily);
    renderGroup('Weekly missions · reset Monday UTC',view.weekly);
    renderGroup('Level and dungeon milestones · one-time',view.milestones);
    section('Crypto and marketplace');
    message('Crypto payouts are locked until a funded treasury, a trusted gameplay-verification server, secure identity/anti-abuse checks and a verified blockchain contract are live.');
    const payout=el('button','Crypto withdrawals — not enabled');payout.className='fc-reward-action';
    payout.type='button';payout.disabled=!CRYPTO_REWARDS_ENABLED;
    // Fail closed even if a future configuration accidentally toggles the UI.
    payout.addEventListener('click',()=>{try{requestCryptoPayout();}catch(error){notify(game,error.message);}});
    const market=el('button','View Sui Testnet NFT marketplace');market.className='fc-reward-action';
    market.type='button';market.addEventListener('click',onOpenMarketplace);
    section('Local point history');
    if(!state.history.length)message('Complete an eligible mission and tap Collect to begin your point history.');
    else for(const h of state.history.slice(-12).reverse()){
      const row=el('div',h.title+' · +'+h.points+' points');row.className='fc-reward-sub';
      row.style.margin='6px 0';row.title=new Date(h.at).toISOString();
    }
    message('NFT sale proceeds, if any, are separate on-chain payments. No NFT sale or wallet balance is inferred from local points.');
  }
  return {open,load,serialize,recordPlacement,update,current,acceptMission,claimMission,
    guideMission,get points(){return state.points;}};
}
