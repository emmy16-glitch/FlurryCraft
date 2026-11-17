// Browser-only Creator Studio. No wallet or marketplace payments.
import { normalizeBlueprint, canonicalBlueprintContent, blueprintFingerprint,
 blueprintSummary, downloadName, makeStarterBlueprints, drawBlueprintCard } from './creator-studio.js';
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
export function initCreatorStudioUI({game,B,panel,openDialog,closeDialog,showCapture,startPreview,notify}){
 const valid=data=>normalizeBlueprint(data,id=>id>0&&id<B.N_BLOCKS&&!!B.BLOCKS[id]&&
  id!==B.WATER&&id!==B.LAVA&&id!==B.BEDROCK&&id!==B.TALLGRASS);
 const demos=makeStarterBlueprints(B);
 const upload=el('input');upload.type='file';upload.accept='.json,application/json';upload.style.display='none';document.body.appendChild(upload);
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
  text('A fingerprint identifies block geometry. It does not prove authorship, ownership, NFT status or financial value.');
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
  if(game.state!=='play'||!game.world){notify(game,'Enter a game world first.');return;}
  heading('🏠 Creator Studio');
  text('Build, preview and share real houses. This is a free local gallery, NOT an NFT marketplace.');
  const tools=el('div');tools.className='fc-studio-toolbar';panel.appendChild(tools);
  btn(tools,'📦 Capture House',showCapture);
  btn(tools,'📂 Import JSON',()=>{closeDialog();upload.click();});
  btn(tools,'⬇ Back Up All',()=>{
   const all=entries().map(item=>item.blueprint);
   if(!all.length){notify(game,'No saved creations yet.');return;}
   downloadJSON({format:'flurrycraft-library-v1',blueprints:all},'flurrycraft-my-builds-backup.json');
  });
  const hint=text('Saved locally on this device. Download a backup before clearing browser data.');
  hint.className='flurryLibraryHint';
  const search=el('input');search.type='search';search.className='fc-studio-search';
  search.placeholder='Search creations and creators';search.setAttribute('aria-label','Search creations');
  panel.appendChild(search);
  const gallery=el('div');gallery.className='fc-studio-gallery';panel.appendChild(gallery);
  function render(){
   gallery.replaceChildren();
   const q=search.value.trim().toLowerCase();
   const all=[...entries().reverse().map(x=>({...x,kind:'saved'})),
    ...demos.map(blueprint=>({blueprint,index:null,kind:'starter'}))]
    .filter(x=>(x.blueprint.name+' '+x.blueprint.author).toLowerCase().includes(q));
   if(!all.length){gallery.appendChild(el('p','No designs match. Try a free starter house.'));return;}
   for(const item of all){
    const {blueprint:data,index,kind}=item,card=el('article');card.className='fc-studio-card';
    const canvas=el('canvas');canvas.width=260;canvas.height=148;
    canvas.setAttribute('aria-label','Isometric diagram of '+data.name);
    drawBlueprintCard(canvas,data,color);
    const body=el('div');body.className='fc-studio-card-body';
    const tag=el('div',kind==='starter'?'FREE STARTER DESIGN':'SAVED ON THIS DEVICE');tag.className='fc-studio-tag';
    const title=el('span',data.name);title.className='fc-studio-card-title';
    const summary=blueprintSummary(data);
    const meta=el('div',data.author+' · '+summary.dimensions+' · '+summary.blockCount+' blocks');meta.className='fc-studio-card-meta';
    const actions=el('div');actions.className='fc-studio-card-actions';
    btn(actions,'▶ Preview',()=>startPreview(data),'primary');
    btn(actions,'↓ File',()=>download(data));
    btn(actions,'↗ Share',()=>share(data));
    btn(actions,'🔐 ID',()=>proof(data));
    if(kind==='saved'){
     btn(actions,'✕ Delete',()=>{
      if(!confirm('Delete "'+data.name+'" from this device? Download a backup first.'))return;
      const current=read();if(index<0||index>=current.length)return;
      current.splice(index,1);
      if(!write(current)){notify(game,'Could not update browser storage.');return;}
      render();
     },'delete');
    }else{
     btn(actions,'+ Save',()=>{
      const status=add(data);
      notify(game,status==='saved'?'Starter design added to My Builds.':
       status==='exists'?'Already saved locally.':
       status==='full'?'Gallery is full. Download backups or delete an old design.':
       'Device storage full. Download the JSON instead.');
      if(status==='saved')render();
     });
    }
    body.append(tag,title,meta,actions);card.append(canvas,body);gallery.appendChild(card);
   }
  }
  search.addEventListener('input',render);render();
  btn(panel,'Close Studio',closeDialog,'muted');
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
