// Optional Testnet marketplace UI. The original voxel game remains wallet-free.
// Public Web3 data only; no seed phrases, secret keys or paid mainnet endpoints.
import { SUI_PACKAGE_ID, SUI_NETWORK } from './sui-config.js';
import { packageId, canonicalBytes } from './sui-market-core.js';

export function initSuiMarketUI({game,panel,openDialog,closeDialog,notify,startPreview}) {
  let sdkPromise=null, mintTarget=null, lastDigest=null, busy=false;
  const id=packageId(SUI_PACKAGE_ID);
  const h=(tag,text,parent=panel)=>{
    const e=document.createElement(tag);if(text!==undefined)e.textContent=text;
    parent.appendChild(e);return e;
  };
  const b=(text,callback,parent=panel)=>{
    const e=h('button',text,parent);e.type='button';
    e.addEventListener('click',callback);return e;
  };
  const showError=e=>notify(game,e?.message||String(e));
  const truncate=s=>s ? String(s).slice(0,6)+'…'+String(s).slice(-4) : '—';
  const title=text=>{openDialog(text);panel.classList.add('fc-sui-panel');};
  function status(message){
    const hint=h('p',message);hint.className='fc-chain-info';return hint;
  }
  const loadSDK=async()=>{
    if(!sdkPromise){
      sdkPromise=import('../dist/sui-bridge.js').catch(e=>{
        sdkPromise=null;throw new Error('Blockchain module unavailable. The Testnet SDK bundle has not been deployed: '+e.message);
      });
    }
    return await sdkPromise;
  };
  const run=async(fn)=>{
    if(busy)return;
    busy=true;
    try{return await fn();}
    catch(e){showError(e);}
    finally{busy=false;}
  };
  const openExplorer=(sdk,digest)=>{
    const a=h('a','View transaction on Sui Testnet explorer');
    a.href=sdk.explorer(digest);a.target='_blank';a.rel='noopener noreferrer';
  };
  const pendingPackage=()=>!id;
  async function renderConnected(sdk,host){
    const conn=sdk.connection(),row=h('div','',host);
    row.className='fc-sui-connection';
    h('strong',conn.address?'Wallet '+truncate(conn.address):'No wallet connected',row);
    if(conn.address){
      b('Disconnect',()=>run(async()=>{await sdk.disconnect();open();}),row);
      return true;
    }
    const wallets=sdk.wallets();
    if(!wallets.length){
      h('p','No compatible Sui wallet is available. On Android, open this game inside the browser of a Sui Wallet Standard wallet.',row);
      b('Search again',()=>open(),row);
      return false;
    }
    for(const wallet of wallets){
      b('Connect '+wallet.name,()=>run(async()=>{
        await sdk.connect(wallet.index);notify(game,'Connected to Sui Testnet wallet.');open();
      }),row);
    }
    return false;
  }
  async function renderOwned(sdk){
    const wrap=h('section');h('h3','My Testnet Buildings',wrap);
    const loading=h('p','Checking Sui ownership and SHA-256…',wrap);
    try{
      const inventory=await sdk.owned(id);
      loading.remove();
      if(!inventory.nfts.length)h('p','No verified FlurryCraft NFTs owned by this wallet.',wrap);
      for(const item of inventory.nfts){
        const card=h('div','',wrap);card.className='fc-sui-card';
        h('strong',item.title,card);
        h('p',item.blocks+' blocks · NFT '+truncate(item.objectId),card);
        h('p','SHA-256 '+item.digest.slice(0,15)+'…',card);
        b('▶ Install owned build',()=>run(async()=>{
          const blueprint=await sdk.verifiedOwnedBlueprint(id,item.objectId);
          startPreview(blueprint,async()=>{
            await sdk.verifiedOwnedBlueprint(id,item.objectId);
          });
          notify(game,'Sui ownership will be rechecked before installation.');
        }),card);
        b('List for Testnet SUI',()=>{
          const amount=prompt('List '+item.title+' for how many TESTNET SUI? Example: 0.1','0.1');
          if(amount===null)return;
          if(!confirm('This escrows the NFT on Sui Testnet. You cannot use it while listed. Publish listing for '+amount+' TESTNET SUI?'))return;
          run(async()=>{
            const digest=await sdk.list(id,item.objectId,amount);
            lastDigest=digest;notify(game,'Testnet listing created.');open();
          });
        },card);
      }
      if(inventory.invalid.length)status(inventory.invalid.length+' invalid or unreadable NFT(s) were ignored.');
    }catch(e){loading.textContent='Could not read Testnet NFTs: '+e.message;}
  }
  async function renderListings(sdk){
    const wrap=h('section');h('h3','Active Testnet Listings',wrap);
    const loading=h('p','Loading live contract listings…',wrap);
    try{
      const market=await sdk.listings(id);
      loading.remove();
      if(!market.length)h('p','No active listings found in the recent Testnet event history.',wrap);
      const conn=sdk.connection();
      for(const item of market){
        const card=h('div','',wrap);card.className='fc-sui-card';
        h('strong',item.title,card);
        h('p',item.priceSui+' TESTNET SUI · Seller '+truncate(item.seller),card);
        h('p','Listing '+truncate(item.listingId),card);
        if(conn.address&&conn.address.toLowerCase()===item.seller.toLowerCase()){
          b('Cancel my listing',()=>run(async()=>{
            if(!confirm('Cancel this Testnet listing and return your NFT?'))return;
            const digest=await sdk.cancel(id,item.listingId);
            lastDigest=digest;notify(game,'Listing cancelled.');open();
          }),card);
        }else{
          b('Buy for '+item.priceSui+' TESTNET SUI',()=>run(async()=>{
            if(!confirm('Buy this NFT for '+item.priceSui+' TESTNET SUI? Your wallet must approve the transaction.'))return;
            const digest=await sdk.buy(id,item.listingId,item.priceMist);
            lastDigest=digest;notify(game,'Testnet purchase submitted. Refresh My Testnet Buildings to verify ownership.');open();
          }),card);
        }
      }
    }catch(e){loading.textContent='Could not load Testnet listings: '+e.message;}
  }
  async function open(options={}) {
    if(options.blueprint)mintTarget=options.blueprint;
    if(game.state!=='play'||!game.world){notify(game,'Enter a world first.');return;}
    title('⛓ Sui Testnet Market');
    status('TESTNET ONLY · No real-money fees or mainnet transactions. The game remains free without a wallet.');
    if(pendingPackage()){
      const block=h('div');
      block.className='fc-sui-notice';
      h('strong','Smart contract not deployed yet',block);
      h('p','The Move package is in the GitHub source, but a verified Testnet package ID is required before minting, listing, buying or ownership verification.',block);
      h('p','Developers: publish move/flurrycraft using Sui CLI, then set SUI_PACKAGE_ID in js/sui-config.js. Do not publish unreviewed code to Mainnet.',block);
    }else{
      status('Verified package configuration: '+truncate(id)+' · network '+SUI_NETWORK);
    }
    if(mintTarget){
      const card=h('div');card.className='fc-sui-card';
      h('strong','Selected creation: '+mintTarget.name,card);
      h('p',mintTarget.blocks.length+' blocks · your mint will store the real block data publicly on Testnet.',card);
      try{h('p',canonicalBytes(mintTarget).length+' bytes of canonical onchain geometry',card);}
      catch(e){h('p','Not mintable: '+e.message,card);}
      if(!pendingPackage())b('Mint this design on Testnet',()=>run(async()=>{
        const sdk=await loadSDK();
        if(!confirm('Mint "'+mintTarget.name+'" on Sui TESTNET? The building data becomes permanently public and your wallet pays Testnet gas.'))return;
        const minted=await sdk.mint(id,mintTarget);
        lastDigest=minted.digest;
        notify(game,'Testnet NFT minted. Recheck your wallet ownership before installing.');
        open();
      }),card);
      b('Clear selected design',()=>{mintTarget=null;open();},card);
    }
    const wallets=h('div','');wallets.className='fc-sui-wallets';
    status('Wallet features load only when you open this screen. Private keys never enter FlurryCraft.');
    const refresh=b('Connect / Refresh Wallet',()=>run(async()=>{
      const sdk=await loadSDK();
      wallets.replaceChildren();
      const connected=await renderConnected(sdk,wallets);
      if(connected&&!pendingPackage()){
        await renderOwned(sdk);await renderListings(sdk);
      }
    }));
    refresh.disabled=false;
    if(lastDigest){
      h('p','Last confirmed Testnet digest: '+lastDigest);
      const a=h('a','View on Sui Testnet explorer');
      a.href='https://suiscan.xyz/testnet/tx/'+encodeURIComponent(lastDigest);
      a.target='_blank';a.rel='noopener noreferrer';
    }
    b('Close',closeDialog);
  }
  const style=document.createElement('style');
  style.textContent=[
    '#flurryModal .fPanel.fc-sui-panel{width:min(610px,94vw);max-height:91vh}',
    '.fc-sui-panel h3{font:800 15px system-ui;color:#a8edff;margin:14px 0 8px}',
    '.fc-sui-panel .fc-sui-card,.fc-sui-panel .fc-sui-notice{border:1px solid #477f9d;border-radius:12px;background:#13384d;padding:10px;margin:10px 0}',
    '.fc-sui-panel .fc-sui-notice{border-color:#dfad73;background:#382f31}',
    '.fc-sui-panel .fc-sui-card p,.fc-sui-panel .fc-sui-notice p{font:500 12px/1.45 system-ui;color:#c6e0e9;margin:5px 0}',
    '.fc-sui-panel .fc-chain-info{font:550 11px/1.4 system-ui;color:#b2d5df}',
    '.fc-sui-panel .fc-sui-connection{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}',
    '.fc-sui-panel .fc-sui-connection strong{width:100%}',
    '.fc-sui-panel a{color:#8ff5ff;text-decoration:underline;font:700 12px system-ui}',
    '@media(max-height:520px){#flurryModal .fPanel.fc-sui-panel{max-height:94vh}}'
  ].join('\n');
  document.head.appendChild(style);
  return {open};
}
