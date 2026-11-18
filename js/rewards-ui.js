// The Rewards Hub displays local sandbox mission points; never real currency.
// No wallet signature, payout request, or server call is made by this module.
import {createRewardsState,rewardCards,collectLocalPoints,recordRewardPlacement,
  requestCryptoPayout,CRYPTO_REWARDS_ENABLED} from './rewards-core.js';

export function initRewardsHub({game,panel,openDialog,notify,onOpenMarketplace}){
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
  ].join('\n');
  const adventure=()=>game.adventure?.serialize?.()||{};
  function load(raw){
    state=createRewardsState(raw,adventure());
  }
  function serialize(){
    state=createRewardsState(state,adventure());
    return JSON.parse(JSON.stringify(state));
  }
  function recordPlacement(){
    if(game.state!=='play'||game.player?.creative)return;
    state=recordRewardPlacement(state,adventure());
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
  return {open,load,serialize,recordPlacement,get points(){return state.points;}};
}
