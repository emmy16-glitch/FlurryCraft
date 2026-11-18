// FlurryCraft Sui Testnet storefront. Optional, wallet-free gameplay unaffected.
// Marketplace is disabled until an onchain ABI-verified package is configured.
import { SUI_PACKAGE_ID } from './sui-config.js';
import { packageId, canonicalBytes, toMist } from './sui-market-core.js';
import { drawBlueprintCard, blueprintSummary } from './creator-studio.js';

export function initSuiMarketUI({game,panel,openDialog,closeDialog,notify,startPreview}) {
  const pkg=packageId(SUI_PACKAGE_ID);
  let sdkPromise=null,mintTarget=null,lastDigest=null,tab='explore',busy=false,generation=0,readonlyOpen=false;
  const make=(tag,text,parent=panel)=>{
    const el=document.createElement(tag);if(text!==undefined)el.textContent=String(text);
    parent.appendChild(el);return el;
  };
  const button=(parent,text,fn,cls='')=>{
    const el=make('button',text,parent);el.type='button';el.className=cls;
    el.addEventListener('click',fn);return el;
  };
  const heading=title=>{openDialog(title);panel.classList.add('fc-sui-panel');};
  const short=v=>String(v||'').slice(0,7)+'…'+String(v||'').slice(-5);
  const walletModule=async()=>{
    if(!sdkPromise)sdkPromise=import('../dist/sui-bridge.js').catch(e=>{
      sdkPromise=null;throw new Error('Sui Wallet module failed to load. Refresh and try again.');
    });
    return sdkPromise;
  };
  const errorText=e=>e?.message||String(e);
  const isCurrent=n=>n===generation&&panel.isConnected&&game.state==='play';
  const text=(t,cls='')=>{const p=make('p',t);p.className=cls;return p;};
  const stamp=(value)=>{
    const item=make('span',value);item.className='fc-market-tag';return item;
  };
  const addCanvas=(parent,blueprint,large=false)=>{
    if(!blueprint)return;
    const canvas=make('canvas',undefined,parent);
    canvas.width=280;canvas.height=large?188:145;
    canvas.className=large?'fc-market-art large':'fc-market-art';
    canvas.setAttribute('aria-label','Isometric preview of '+blueprint.name);
    drawBlueprintCard(canvas,blueprint,id=>{
      // Buyer previews contain actual verified, onchain voxel geometry.
      const n=id%8;
      return ['#c6d6da','#e7f7fc','#acd9de','#b3a089','#95bcc4',
        '#d7ede9','#c2d3e0','#dde9ee'][n];
    });
  };
  const action=async(btn,callback,success,after='mine')=>{
    if(busy)return;
    busy=true;
    const label=btn.textContent;
    btn.disabled=true;btn.textContent='Confirming on Testnet…';
    try{
      const sdk=await walletModule();
      const digest=await callback(sdk);
      lastDigest=digest;
      notify(game,success);
      busy=false;open({tab:after});
    }catch(e){
      notify(game,errorText(e));
      btn.disabled=false;btn.textContent=label;
      busy=false;
    }
  };
  const transactionLink=()=>{
    if(!lastDigest)return;
    const a=make('a','Last transaction · Open Sui Explorer');
    a.href='https://suiscan.xyz/testnet/tx/'+encodeURIComponent(lastDigest);
    a.target='_blank';a.rel='noopener noreferrer';
    a.className='fc-market-link';
  };
  const stateNotice=()=>text('TESTNET · Public designs · No mainnet or real-money sales','fc-market-help');
  const card=(parent,title,description,blueprint)=>{
    const node=make('article',undefined,parent);node.className='fc-market-card';
    addCanvas(node,blueprint);
    const info=make('div',undefined,node);info.className='fc-market-body';
    make('strong',title,info);
    make('small',description,info);
    const actions=make('div',undefined,info);actions.className='fc-market-actions';
    return {node,info,actions};
  };
  function review({title,blueprint,lines,primary,submit,back='explore',success='Transaction confirmed',after='mine'}){
    generation++;
    heading(title);
    stateNotice();
    const region=make('div');region.className='fc-market-review';
    addCanvas(region,blueprint,true);
    for(const line of lines)text(line);
    text('Your wallet will request separate approval. Only Testnet SUI is used.','fc-market-help');
    button(panel,primary,e=>action(e.currentTarget,submit,success,after),'fc-market-primary');
    button(panel,'Back',()=>open({tab:back}),'fc-market-secondary');
  }
  async function wallet(sdk){
    const bar=make('div');bar.className='fc-market-wallet';
    const current=sdk.connection();
    if(current.address){
      const group=make('div',undefined,bar);group.className='fc-market-wallet-id';
      make('strong','Connected wallet',group);
      make('small',short(current.address),group);
      const balance=make('small','Checking balance…',group);
      sdk.testnetBalance().then(v=>{if(balance.isConnected)balance.textContent=v+' Testnet SUI';})
        .catch(()=>{if(balance.isConnected)balance.textContent='Testnet balance unavailable';});
      button(bar,'Disconnect',()=>actionConnect(async()=>{
        await sdk.disconnect();open({tab});
      }),'fc-market-outline');
      return true;
    }
    const wallets=sdk.wallets();
    if(!wallets.length){
      make('small','Connect from a compatible Sui wallet browser to trade.',bar);
    }else{
      const chooser=make('details',undefined,bar);
      make('summary','Connect Wallet',chooser);
      for(const item of wallets){
        button(chooser,'Connect '+item.name,()=>actionConnect(async()=>{
          await sdk.connect(item.index);notify(game,'Wallet connected');open({tab});
        }));
      }
    }
    return false;
  }
  async function actionConnect(callback){
    try{await callback();}catch(e){notify(game,errorText(e));}
  }
  function tabs(connected){
    const wrap=make('div');wrap.className='fc-market-tabs';
    for(const [value,label] of [['explore','Explore'],['mine','My NFTs'],['create','Create']]){
      if(value==='create'&&!mintTarget)continue;
      const el=button(wrap,label,()=>open({tab:value}),tab===value?'selected':'');
      if(value==='mine'&&!connected)el.title='Connect a wallet to see owned NFTs';
    }
  }
  async function explore(sdk,token,connected){
    const region=make('section');region.className='fc-market-gallery';
    const loading=make('p','Loading verified listings…',region);
    try{
      const results=await sdk.listings(pkg);
      if(!isCurrent(token))return;
      loading.remove();
      if(!results.length){
        make('p','No active Testnet listings yet.',region);return;
      }
      for(const item of results.slice(0,35)){
        const {actions}=card(region,item.title,
          item.priceSui+' Testnet SUI · '+item.blocks+' blocks',item.blueprint);
        button(actions,'Preview',()=>review({
          title:'Building Preview',blueprint:item.blueprint,
          lines:[item.title,item.blocks+' blocks · '+item.priceSui+' Testnet SUI',
            'Seller: '+short(item.seller),'Blueprint geometry is public, including without buying the NFT.'],
          primary:connected?'Buy for '+item.priceSui+' Testnet SUI':'Connect wallet to buy',
          back:'explore',after:'mine',success:'NFT purchased on Sui Testnet',
          submit:async sdk=>{
            if(!sdk.connection().address)throw new Error('Connect a Sui Testnet wallet first.');
            return sdk.buy(pkg,item.listingId,item.priceMist);
          }
        }),'fc-market-primary');
        if(sdk.connection().address?.toLowerCase()===item.seller.toLowerCase()){
          button(actions,'Cancel listing',()=>review({
            title:'Cancel Listing',blueprint:item.blueprint,
            lines:[item.title,'Return the NFT to your wallet. No sale will take place.'],
            primary:'Confirm cancellation',back:'explore',
            after:'mine',success:'Listing cancelled',
            submit:sdk=>sdk.cancel(pkg,item.listingId)
          }),'fc-market-secondary');
        }
      }
    }catch(e){
      if(isCurrent(token))loading.textContent='Marketplace unavailable: '+errorText(e);
    }
  }
  async function mine(sdk,token,connected){
    if(!connected){text('Connect a Sui Testnet wallet to see your NFTs.');return;}
    const region=make('section');region.className='fc-market-gallery';
    const loading=make('p','Verifying your NFTs on Sui…',region);
    try{
      const inventory=await sdk.owned(pkg);
      if(!isCurrent(token))return;
      loading.remove();
      if(!inventory.nfts.length)make('p','No building NFTs in this wallet yet.',region);
      for(const item of inventory.nfts){
        const {node,info,actions}=card(region,item.title,
          item.blocks+' blocks · Token '+short(item.objectId),item.blueprint);
        button(actions,'Install Building',()=>actionInstall(sdk,item),'fc-market-primary');
        const more=make('details',undefined,info);more.className='fc-market-more';
        make('summary','List for sale',more);
        const row=make('div',undefined,more);row.className='fc-market-price';
        const label=make('label','Testnet SUI price',row);
        const price=make('input',undefined,row);price.type='text';price.inputMode='decimal';
        price.value='0.1';price.setAttribute('aria-label','Testnet SUI listing price');
        button(row,'Review listing',()=>{
          try{
            const mist=toMist(price.value);const formatted=String(price.value).trim();
            review({
              title:'Review Listing',blueprint:item.blueprint,
              lines:[item.title,'Price: '+formatted+' Testnet SUI',
                'Your NFT will be held in escrow until it sells or you cancel.'],
              primary:'Confirm Listing',back:'mine',after:'explore',success:'Listing created',
              submit:sdk=>sdk.list(pkg,item.objectId,formatted),
            });
          }catch(e){notify(game,errorText(e));}
        },'fc-market-secondary');
      }
      if(inventory.invalid.length)text(inventory.invalid.length+' invalid NFT(s) hidden.','fc-market-help');
    }catch(e){
      if(isCurrent(token))loading.textContent='Could not read NFTs: '+errorText(e);
    }
  }
  async function actionInstall(sdk,item){
    if(busy)return;
    busy=true;
    try{
      const blueprint=await sdk.verifiedOwnedBlueprint(pkg,item.objectId);
      startPreview(blueprint,async()=>{
        await sdk.verifiedOwnedBlueprint(pkg,item.objectId);
      });
      notify(game,'Ownership will be checked again before placing.');
    }catch(e){notify(game,errorText(e));}
    finally{busy=false;}
  }
  function create(connected){
    if(!mintTarget){text('Choose a saved design in My Builds to mint it.');return;}
    const {actions}=card(panel,mintTarget.name,
      blueprintSummary(mintTarget).blockCount+' blocks',mintTarget);
    let size=0;
    try{size=canonicalBytes(mintTarget).length;}catch(e){
      text('Too large for Testnet NFT: '+errorText(e));return;
    }
    text('The '+size+'-byte blueprint becomes permanently public on Sui Testnet.','fc-market-help');
    button(actions,'Review Mint',()=>review({
      title:'Review NFT Mint',blueprint:mintTarget,
      lines:['Mint '+mintTarget.name+' as a Testnet NFT.',
        'Blocks will be publicly readable and copyable. The NFT does not grant copyright.'],
      primary:connected?'Confirm Mint':'Connect wallet to mint',
      back:'create',after:'mine',success:'Testnet NFT minted',
      submit:async sdk=>{
        if(!sdk.connection().address)throw new Error('Connect a wallet first.');
        const result=await sdk.mint(pkg,mintTarget);
        return result.digest;
      },
    }),'fc-market-primary');
  }
  async function open(options={}){
    if(options.blueprint)mintTarget=options.blueprint;
    if(options.tab)tab=options.tab;
    else if(options.blueprint)tab='create';
    if(game.state!=='play'||!game.world){notify(game,'Enter a world first.');return;}
    const token=++generation;
    heading('Sui Marketplace');stateNotice();
    if(!pkg){
      const state=make('section');state.className='fc-market-waiting';
      make('strong','Testnet launch in preparation',state);
      make('p','The marketplace contract has not been published to Sui Testnet. No NFT mint, listing or payment is possible yet.',state);
      make('p','You can still connect a compatible wallet in read-only mode to check Testnet connectivity and balance. A connection never signs a transaction by itself.',state);
      button(state,readonlyOpen?'Refresh read-only Testnet wallet':'Check Testnet Wallet (read only)',()=>{
        readonlyOpen=true;
        open({tab});
      },'fc-market-secondary');
      if(readonlyOpen){
        const status=make('p','Checking Sui Testnet without requesting a signature…',state);
        try{
          const sdk=await walletModule();
          const network=await sdk.testnetStatus();
          if(!isCurrent(token))return;
          status.textContent='Sui '+network.network+' RPC reachable. No contract deployed; trading is disabled.';
          await wallet(sdk);
          if(!isCurrent(token))return;
          text('Connecting a wallet here is optional and cannot initiate a mint, listing, purchase or cancellation.','fc-market-help');
        }catch(e){
          if(isCurrent(token))status.textContent='Wallet inspection unavailable: '+errorText(e);
        }
      }
      if(mintTarget){
        const {info}=card(panel,mintTarget.name,
          blueprintSummary(mintTarget).blockCount+' blocks · Ready for a future Testnet mint',mintTarget);
        try{
          make('small',canonicalBytes(mintTarget).length+' bytes · Testnet compatible',info);
        }catch(e){make('small',errorText(e),info);}
      }
      return;
    }
    const loading=text('Checking the Sui Testnet contract…','fc-market-help');
    try{
      const sdk=await walletModule();
      await sdk.checkPackage(pkg);
      if(!isCurrent(token))return;
      loading.remove();
      const connected=await wallet(sdk);
      if(!isCurrent(token))return;
      tabs(connected);
      transactionLink();
      if(tab==='mine')await mine(sdk,token,connected);
      else if(tab==='create')create(connected);
      else await explore(sdk,token,connected);
      const more=make('details');more.className='fc-market-more';
      make('summary','About this marketplace',more);
      make('p','Sui Testnet only. Original NFT ownership is checked against the blockchain. Designs can still be copied outside the game.',more);
      make('p','Contract: '+short(pkg),more);
    }catch(e){
      if(isCurrent(token))loading.textContent='Sui Testnet is not ready: '+errorText(e);
    }
  }
  const styles=make('style',undefined,document.head);
  styles.textContent=[
    '#flurryModal .fPanel.fc-sui-panel{width:min(600px,95vw);max-height:91dvh;overflow:auto}',
    '.fc-sui-panel .fc-market-help{font:550 11px/1.5 system-ui;color:#a6c3d4;margin:6px 0}',
    '.fc-market-wallet{border:1px solid #305d74;border-radius:12px;background:#143e50;display:flex;align-items:center;gap:8px;padding:9px;justify-content:space-between;margin:9px 0}',
    '.fc-market-wallet-id{display:flex;flex-direction:column;gap:2px}.fc-market-wallet-id strong{color:#ecfaff;font:750 12px system-ui}.fc-market-wallet-id small{color:#a4cfdf;font:600 10px system-ui}',
    '#flurryModal .fc-market-wallet button{margin:0;padding:8px 10px;min-height:35px}',
    '.fc-market-wallet details{margin:0}.fc-market-wallet summary{color:#a3f4ff;font:750 12px system-ui;cursor:pointer}',
    '.fc-market-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;background:#0b293a;border-radius:12px;padding:4px;margin:9px 0}',
    '#flurryModal .fc-market-tabs button{border:0;background:transparent;color:#b0cdd9;min-height:40px;margin:0;border-radius:9px;font:750 12px system-ui}',
    '#flurryModal .fc-market-tabs button.selected{background:#2c6279;color:#f2fcff}',
    '.fc-market-gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:9px}',
    '.fc-market-gallery>p{grid-column:1/-1}',
    '.fc-market-card{background:#12384d;border:1px solid #416c81;border-radius:14px;overflow:hidden;min-width:0}',
    '.fc-market-art{display:block;width:100%;height:118px;object-fit:cover;background:#173c50}',
    '.fc-market-art.large{height:180px;max-width:100%;border-radius:12px;margin:5px auto 12px}',
    '.fc-market-body{padding:10px;display:flex;flex-direction:column;gap:6px}',
    '.fc-market-body strong{color:#f0fcff;font:800 13px/1.2 system-ui}',
    '.fc-market-body small{color:#a9ccd8;font:600 11px/1.3 system-ui}',
    '.fc-market-actions{display:flex;flex-wrap:wrap;gap:6px}',
    '#flurryModal .fc-market-actions button{margin:0;min-width:0;min-height:38px;font:750 11px system-ui;border-radius:9px;padding:8px}',
    '#flurryModal button.fc-market-primary{background:#8ce5ef;border:1px solid #adeefa;border-radius:11px;color:#07364a;min-height:42px;font:800 12px system-ui;padding:9px 12px}',
    '#flurryModal button.fc-market-secondary{background:#1d536d;border:1px solid #548a9d;border-radius:11px;color:#e2faff;min-height:40px;font:750 12px system-ui;padding:9px 12px}',
    '#flurryModal button:disabled{opacity:.55;cursor:wait}',
    '.fc-market-more{margin-top:9px;padding:8px;border-top:1px solid #35647b}',
    '.fc-market-more summary{font:700 11px system-ui;color:#a9d9e7;cursor:pointer}',
    '.fc-market-more p{font:500 11px/1.5 system-ui;color:#a7c2d1}',
    '.fc-market-price{display:flex;flex-wrap:wrap;gap:7px;padding-top:8px}',
    '.fc-market-price label{width:100%;font:700 11px system-ui;color:#d8eff7}',
    '#flurryModal .fc-market-price input{width:100%;font:650 14px system-ui;margin:0;padding:9px}',
    '.fc-market-review{margin:8px 0}',
    '.fc-market-review~p{font:600 12px/1.5 system-ui;color:#d0e6f0}',
    '.fc-market-link{display:inline-block;color:#a2eeff;margin:8px 0;font:700 11px system-ui}',
    '.fc-market-waiting{border:1px solid #477a90;border-radius:13px;background:#153c51;padding:15px;margin:10px 0}',
    '.fc-market-waiting strong{font:800 15px system-ui;color:#ecfaff}.fc-market-waiting p{font:600 12px/1.5 system-ui;color:#b0d0dd}',
    '@media(max-height:520px){.fc-market-gallery .fc-market-art{height:83px}.fc-market-art.large{height:118px}#flurryModal .fPanel.fc-sui-panel{padding:10px}}',
  ].join('\n');
  return {open};
}
