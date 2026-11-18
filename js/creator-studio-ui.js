// Browser-only Creator Studio. No wallet or marketplace payments.
import { normalizeBlueprint, canonicalBlueprintContent, blueprintFingerprint,
 blueprintSummary, downloadName, makeStarterBlueprints, drawBlueprintCard } from './creator-studio.js';
import {uploadWalrusBlueprint,fetchWalrusBlueprint,walrusTestnetURL,walrusBlueprintReceipt}
 from './walrus-blueprints.js';
const KEY='flurrycraft_blueprints_v1',LIMIT=30;
const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
const read=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v:[];}catch{return [];}};
const write=v=>{try{localStorage.setItem(KEY,JSON.stringify(v));return true;}catch{return false;}};
function downloadJSON(data,name){
 const blob=new Blob([JSON.stringify(data)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download=name;
 document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2500);
}
export function initCreatorStudioUI({game,B,panel,openDialog,closeDialog,showCapture,startPreview,notify,onMintTestnet}){
 const valid=data=>normalizeBlueprint(data,id=>id>0&&id<B.N_BLOCKS&&!!B.BLOCKS[id]&&
  id!==B.WATER&&id!==B.LAVA&&id!==B.BEDROCK&&id!==B.TALLGRASS);
 const demos=makeStarterBlueprints(B);
 const upload=el('input');upload.type='file';upload.accept='.json,application/json';upload.style.display='none';document.body.appendChild(upload);
 const receiptUpload=el('input');receiptUpload.type='file';receiptUpload.accept='.json,application/json';
 receiptUpload.style.display='none';receiptUpload.setAttribute('aria-label','Walrus verification receipt');
 document.body.appendChild(receiptUpload);
 receiptUpload.addEventListener('change',async()=>{
  const file=receiptUpload.files?.[0];receiptUpload.value='';
  if(!file)return;
  if(file.size>8192){notify(game,'Walrus receipt must be smaller than 8 KB.');return;}
  try{
   const receipt=walrusBlueprintReceipt(JSON.parse(await file.text()));
   const found=await fetchWalrusBlueprint(receipt);
   const status=add(found.blueprint);
   if(status==='saved'){notify(game,'Verified Walrus receipt imported: '+found.blueprint.name);open();}
   else notify(game,status==='exists'?'Already in My Builds':
     status==='full'?'My Builds is full. Export a backup first.':'Local storage unavailable.');
  }catch(error){notify(game,'Walrus receipt import failed: '+error.message);}
 });
 const style=el('style');
 style.textContent=[
 '#flurryModal .fPanel.fc-studio-wide{width:min(760px,96vw);max-height:90vh;padding:16px}',
 '.fc-studio-gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:10px 0}',
 '.fc-studio-card{min-width:0;border:1px solid #4d93b5;border-radius:14px;background:#113349;overflow:hidden}',
 '.fc-studio-card canvas{width:100%;height:105px;display:block}',
 '.fc-studio-card-body{padding:9px}',
 '.fc-studio-card-title{font:800 13px/1.25 system-ui;color:#fff;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
 '.fc-studio-card-meta{font:500 10px/1.4 system-ui;color:#aad3e3;margin-top:4px}',
 '.fc-studio-card-actions{display:flex;gap:4px;flex-wrap:wrap;margin-top:7px}',
 '#flurryModal .fc-studio-card-actions button{font:700 11px system-ui;margin:0;padding:7px 9px;border-radius:8px;background:#206483}',
 '#flurryModal .fc-studio-card-actions button.primary{background:#42cde7;color:#09354a}',
 '#flurryModal .fc-studio-card-actions button.delete{background:#3a3447;color:#f1c6d8;border-color:#80566d}',
 '.fc-studio-toolbar{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:9px 0}',
 '#flurryModal .fc-studio-toolbar button{margin:0;padding:8px 10px;border-radius:9px}',
 '#flurryModal .fc-studio-search{margin:7px 0;width:100%}',
 '.fc-studio-tag{font:800 9px system-ui;letter-spacing:.08em;color:#8eecff}',
 '.fc-studio-hash{word-break:break-all;white-space:pre-wrap;background:#092637;padding:10px;border-radius:10px;color:#a6f4e7;font:700 12px monospace}',
 '.fc-studio-tabs{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin:9px 0;background:#0a2a3c;border-radius:12px;padding:4px}',
 '#flurryModal .fc-studio-tabs button{margin:0;border:0;border-radius:9px;min-height:39px;background:transparent;color:#a6c7d6;font:750 12px system-ui}',
 '#flurryModal .fc-studio-tabs button.selected{background:#315c73;color:#f1fcff;box-shadow:0 2px 8px #001a2b77}',
 '#flurryModal .fc-studio-toolbar button{margin:0;min-height:40px}',
 '#flurryModal .fc-studio-toolbar button.primary{background:#8ee4f0;color:#053347;border-color:#bff9ff}',
 '.fc-studio-advanced{padding:5px 2px;border-bottom:1px solid #33586e;margin:2px 0 7px}',
 '.fc-studio-advanced summary{list-style:none;cursor:pointer;padding:7px 2px;color:#9bc4d5;font:600 11px system-ui}',
 '.fc-studio-advanced summary::-webkit-details-marker{display:none}',
 '.fc-studio-backup{padding:8px;background:#0c3043;border-radius:8px}',
 '.fc-studio-backup p{font:500 11px/1.4 system-ui;color:#9cbdcd;margin:5px 2px}',
 '.fc-studio-empty{grid-column:1/-1;text-align:center;padding:22px 10px;border:1px dashed #46778d;border-radius:12px;color:#bddbe7}',
 '.fc-studio-empty p{font:600 13px system-ui}',
 '.fc-studio-card-more{border-top:1px solid #275168;margin-top:8px;padding-top:6px}',
 '.fc-studio-card-more summary{list-style:none;font:650 11px system-ui;color:#9dcee0;cursor:pointer;padding:3px 0}',
 '.fc-studio-card-more summary::-webkit-details-marker{display:none}',
 '#flurryModal .fc-studio-card-actions button.primary{background:#8ee4f0;border-color:#adf3ff;color:#07364a;min-height:38px;flex:1}',
 '#flurryModal .fc-studio-card-actions button{min-height:34px}',
 '@media(max-height:520px){#flurryModal .fPanel.fc-studio-wide{padding:10px}.fc-studio-card canvas{height:82px}.fc-studio-card-body{padding:6px}}'
 ].join('\n');
 document.head.appendChild(style);
 const btn=(host,title,fn,cls='')=>{const b=el('button',title);b.type='button';b.className=cls;b.addEventListener('click',fn);host.appendChild(b);return b;};
 const text=(message)=>{const p=el('p',message);panel.appendChild(p);return p;};
 const heading=title=>{openDialog(title);panel.classList.add('fc-studio-wide');};
 const entries=()=>{const a=[];read().forEach((v,i)=>{try{a.push({blueprint:valid(v),index:i});}catch{}});return a;};
 function add(input){
  const data=valid(input),all=read(),identity=canonicalBlueprintContent(data);
  if(all.some(x=>{try{return canonicalBlueprintContent(valid(x))===identity;}catch{return false;}}))return 'exists';
  if(all.length>=LIMIT)return 'full';
  all.push(data);return write(all)?'saved':'storage';
 }
 const download=data=>{const clean=valid(data);downloadJSON(clean,downloadName(clean.name));};
 async function shareWalrus(data){
  const clean=valid(data);
  // Unlike local browser saves, uploads can be copied by anyone and may
  // remain readable through the storage epochs. Explicit opt-in required.
  if(typeof confirm==='function'&&!confirm(
    'Publish "'+clean.name+'" to PUBLIC Walrus TESTNET storage? Anyone with the blob ID can copy the building. This is NOT an NFT or private backup. Continue?'))return;
  heading('Walrus Testnet · Share Building');
  const status=text('Uploading public blueprint to Walrus Testnet…');
  try{
   const receipt=await uploadWalrusBlueprint(clean);
   if(!status.isConnected)return;
   status.textContent='Walrus Testnet stored '+clean.blocks.length+
    ' blocks. Save the receipt to verify this exact design later.';
   const info=el('div');info.className='fc-studio-hash';
   info.textContent='Blob ID: '+receipt.blobId+'\nSHA-256: '+receipt.digest;
   panel.appendChild(info);
   const link=el('a','View public Walrus blob');
   link.href=walrusTestnetURL(receipt.blobId);
   link.target='_blank';link.rel='noopener noreferrer';panel.appendChild(link);
   btn(panel,'Download Verification Receipt',()=>downloadJSON(
    receipt,'flurrycraft-walrus-receipt.json'));
   btn(panel,'Copy Blob ID',()=>{
    if(navigator.clipboard?.writeText)navigator.clipboard.writeText(receipt.blobId)
      .then(()=>notify(game,'Walrus blob ID copied'))
      .catch(()=>notify(game,'Copy unavailable. Select the ID manually.'));
    else notify(game,'Select the ID from the screen to copy it.');
   });
  }catch(error){status.textContent='Walrus upload unavailable: '+error.message;}
  btn(panel,'Back to My Builds',open);
 }
 async function share(data){
  const clean=valid(data),file=new File([JSON.stringify(clean)],downloadName(clean.name),{type:'application/json'});
  if(navigator.share&&navigator.canShare?.({files:[file]})){
   try{await navigator.share({files:[file],title:clean.name,text:'FlurryCraft building blueprint (not an NFT)'});}
   catch(err){if(err?.name!=='AbortError')notify(game,'Sharing unavailable. Download the file instead.');}
  }else{download(clean);notify(game,'Blueprint downloaded. You can send it as a file.');}
 }
 function color(id){
  const n=(B.BLOCKS[id]?.name||'').toLowerCase();
  if(n.includes('glass')||n.includes('ice'))return '#82d8ee';
  if(n.includes('snow')||n.includes('wool'))return '#e7f7fc';
  if(n.includes('wood')||n.includes('spruce')||n.includes('plank')||n.includes('log'))return '#b78e69';
  if(n.includes('stone')||n.includes('brick'))return '#c1c8d8';
  if(n.includes('torch')||n.includes('fire'))return '#f6b46e';
  return '#8bcba8';
 }
 function proof(value){
  const data=valid(value);heading('🔐 Creation Fingerprint');
  const caption=text('Generating SHA-256 fingerprint…');
  const output=el('div');output.className='fc-studio-hash';panel.appendChild(output);
  text('Identifies the exact blocks, not ownership.');
  btn(panel,'Back to Studio',open,'muted');
  blueprintFingerprint(data).then(hash=>{
   if(!output.isConnected)return;
   caption.textContent='SHA-256 · '+data.blocks.length+' blocks · '+data.size.join(' × ');
   output.textContent=hash;
   btn(panel,'Copy SHA-256',()=>{
    if(navigator.clipboard?.writeText)navigator.clipboard.writeText(hash)
      .then(()=>notify(game,'Fingerprint copied.'))
      .catch(()=>notify(game,'Copy unavailable. Select the text manually.'));
    else notify(game,'Select the fingerprint to copy it.');
   });
  }).catch(err=>{caption.textContent='Fingerprint unavailable on this browser.';output.textContent=err.message;});
 }
 function open(){
  if(game.state!=='play'||!game.world){notify(game,'Enter a world first.');return;}
  heading('My Builds');
  const tools=el('div');tools.className='fc-studio-toolbar';panel.appendChild(tools);
  btn(tools,'＋ Save Building',showCapture,'primary');
  btn(tools,'Import File',()=>{closeDialog();upload.click();});
  const advanced=el('details');advanced.className='fc-studio-advanced';
  advanced.appendChild(el('summary','Storage & Backup'));
  const backup=el('div');backup.className='fc-studio-backup';
  btn(backup,'Download All Builds',()=>{
   const all=entries().map(item=>item.blueprint);
   if(!all.length){notify(game,'No saved buildings yet.');return;}
   downloadJSON({format:'flurrycraft-library-v1',blueprints:all},'flurrycraft-my-builds-backup.json');
  });
  backup.appendChild(el('p','Builds are saved on this device. Back up before clearing browser data.'));
  backup.appendChild(el('p','Walrus Testnet is optional, PUBLIC storage for shareable building designs, not a private world backup or NFT.'));
  btn(backup,'Import Walrus Receipt File',()=>receiptUpload.click());
  const blobInput=el('input');blobInput.type='text';
  blobInput.placeholder='Walrus Testnet blob ID (43 characters)';
  blobInput.setAttribute('aria-label','Walrus Testnet blob ID');
  blobInput.style.width='100%';backup.appendChild(blobInput);
  const digestInput=el('input');digestInput.type='text';
  digestInput.placeholder='SHA-256 from receipt (optional)';
  digestInput.setAttribute('aria-label','Expected Walrus SHA-256 digest');
  digestInput.style.width='100%';backup.appendChild(digestInput);
  btn(backup,'Import Walrus Blueprint',async()=>{
   const id=blobInput.value.trim(),hash=digestInput.value.trim();
   if(!id){notify(game,'Enter the Walrus blob ID.');return;}
   try{
    const source=hash?{
     format:'flurrycraft-walrus-blueprint-v1',
     blobId:id,digest:hash,name:'Walrus Building',author:'Walrus Testnet',
    }:id;
    const result=await fetchWalrusBlueprint(source);
    const status=add(result.blueprint);
    if(status==='saved'){notify(game,'Verified Walrus blueprint imported safely.');open();}
    else notify(game,status==='exists'?'Already in My Builds':
      status==='full'?'My Builds is full. Remove a design or export a backup.':
      'Local storage unavailable.');
   }catch(error){notify(game,'Walrus import failed: '+error.message);}
  });
  advanced.appendChild(backup);panel.appendChild(advanced);
  const tabs=el('div');tabs.className='fc-studio-tabs';tabs.setAttribute('role','tablist');panel.appendChild(tabs);
  let source=entries().length?'mine':'starter';
  const search=el('input');search.type='search';search.className='fc-studio-search';
  search.placeholder='Search buildings';search.setAttribute('aria-label','Search buildings');panel.appendChild(search);
  const gallery=el('div');gallery.className='fc-studio-gallery';panel.appendChild(gallery);
  const mine=btn(tabs,'My Builds',()=>changeTab('mine'));
  const starters=btn(tabs,'Starter Homes',()=>changeTab('starter'));
  mine.setAttribute('role','tab');starters.setAttribute('role','tab');
  function updateTabs(){
   for(const [tab,id] of [[mine,'mine'],[starters,'starter']]){
    const on=source===id;tab.classList.toggle('selected',on);tab.setAttribute('aria-selected',String(on));
   }
  }
  function changeTab(next){source=next;search.value='';updateTabs();render();}
  function render(){
   gallery.replaceChildren();
   const query=search.value.trim().toLowerCase();
   const all=(source==='mine'
     ? entries().reverse().map(x=>({...x,kind:'saved'}))
     : demos.map(blueprint=>({blueprint,index:null,kind:'starter'})))
     .filter(x=>(x.blueprint.name+' '+x.blueprint.author).toLowerCase().includes(query));
   if(!all.length){
    const empty=el('div');empty.className='fc-studio-empty';
    empty.appendChild(el('p',query?'No matching buildings.':
      source==='mine'?'No saved buildings yet.':'No starter homes found.'));
    if(source==='mine'&&!query)btn(empty,'Browse Starter Homes',()=>changeTab('starter'),'primary');
    gallery.appendChild(empty);return;
   }
   for(const item of all){
    const {blueprint:data,index,kind}=item,card=el('article');card.className='fc-studio-card';
    const canvas=el('canvas');canvas.width=260;canvas.height=148;
    canvas.setAttribute('aria-label','Preview of '+data.name);
    drawBlueprintCard(canvas,data,color);
    const body=el('div');body.className='fc-studio-card-body';
    const title=el('span',data.name);title.className='fc-studio-card-title';
    const size=blueprintSummary(data);
    const meta=el('div',size.dimensions+' · '+size.blockCount+' blocks');meta.className='fc-studio-card-meta';
    const primary=el('div');primary.className='fc-studio-card-actions';
    btn(primary,'Preview & Place',()=>startPreview(data),'primary');
    if(kind==='starter'){
     btn(primary,'Save',()=>{
      const status=add(data);
      if(status==='saved'){notify(game,'Saved to My Builds');changeTab('mine');}
      else notify(game,status==='exists'?'Already in My Builds':
       status==='full'?'Gallery full. Remove an old build or download a backup.':
       'Storage full. Download the blueprint instead.');
     });
    }
    const options=el('details');options.className='fc-studio-card-more';
    options.appendChild(el('summary','More options'));
    const actions=el('div');actions.className='fc-studio-card-actions';
    btn(actions,'Download',()=>download(data));
    btn(actions,'Share',()=>share(data));
    btn(actions,'Fingerprint',()=>proof(data));
    btn(actions,'Walrus Testnet Share',()=>shareWalrus(data));
    if(onMintTestnet)btn(actions,'NFT Testnet',()=>onMintTestnet(data));
    if(kind==='saved'){
     btn(actions,'Delete',()=>{
      if(!confirm('Delete "'+data.name+'" from this device?'))return;
      const current=read();if(index<0||index>=current.length)return;
      current.splice(index,1);
      if(!write(current)){notify(game,'Could not update storage.');return;}
      render();
     },'delete');
    }
    options.appendChild(actions);
    body.append(title,meta,primary,options);card.append(canvas,body);gallery.appendChild(card);
   }
  }
  search.addEventListener('input',render);updateTabs();render();
 }
 async function importSource(source){
  if(!source)return;
  if(source.size>6_000_000){notify(game,'File exceeds the 6 MB limit.');return;}
  try{
   const data=JSON.parse(await source.text());
   if(data?.format==='flurrycraft-library-v1'&&Array.isArray(data.blueprints)){
    if(data.blueprints.length>LIMIT){notify(game,'Backup exceeds 30 designs.');return;}
    let count=0,skipped=0;
    for(const item of data.blueprints){
     try{if(add(item)==='saved')count++;else skipped++;}catch{skipped++;}
    }
    notify(game,'Restored '+count+' designs.'+(skipped?' '+skipped+' skipped or duplicates.':''));
    open();
   }else{
    const clean=valid(data),status=add(clean);
    if(status==='full'||status==='storage')notify(game,'Device storage full; imported design is only in this preview.');
    startPreview(clean);
   }
  }catch(err){notify(game,'Cannot import JSON: '+err.message);}
 }
 upload.addEventListener('change',()=>{
  const chosen=upload.files?.[0];upload.value='';importSource(chosen);
 });
 return {open,add,download,importSource,entries};
}
