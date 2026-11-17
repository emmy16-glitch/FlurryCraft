// FlurryCraft-specific gameplay layer: Yetis, quests, starter shack and local blueprints.
// This module intentionally contains NO wallet calls or real-money listings.
// NFT mint/list/buy requires audited Move contracts and an ownership-aware backend.
import * as THREE from 'three';
import * as B from './blocks.js';

const PREFERENCES = 'flurrycraft_yeti_v1';
const BLUEPRINTS = 'flurrycraft_blueprints_v1';
const QUEST = 'flurrycraft_quest_v1';
const MAX_BLOCKS = 6000;
const $ = id => document.getElementById(id);
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; } };
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
const notify = (game, message) => game.ui ? game.ui.toast(message) : alert(message);

function createYeti(colors, isLofi = false) {
  const group = new THREE.Group();
  const parts = {};
  const cube = (name, w, h, d, x, y, z, color) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color, flatShading: true }));
    mesh.position.set(x, y, z); mesh.castShadow = false;
    group.add(mesh); parts[name] = mesh; return mesh;
  };
  const fur = isLofi ? '#f3fbff' : colors.fur;
  const scarf = isLofi ? '#57d5fa' : colors.scarf;
  cube('body', .94, .89, .65, 0, 1.01, 0, fur);
  cube('head', 1.02, .87, .81, 0, 1.73, -.05, fur);
  cube('leftArm', .3, .88, .54, -.62, 1.0, -.01, fur);
  cube('rightArm', .3, .88, .54, .62, 1.0, -.01, fur);
  cube('leftLeg', .36, .57, .52, -.26, .30, 0, fur);
  cube('rightLeg', .36, .57, .52, .26, .30, 0, fur);
  cube('hornL', .2, .38, .23, -.34, 2.26, .01, '#dfecf3');
  cube('hornR', .2, .38, .23, .34, 2.26, .01, '#dfecf3');
  cube('face', .62, .38, .08, 0, 1.62, -.49, '#d8eafa');
  cube('eyeL', .12, .15, .07, -.23, 1.83, -.51, '#183248');
  cube('eyeR', .12, .15, .07, .23, 1.83, -.51, '#183248');
  cube('nose', .13, .09, .07, 0, 1.59, -.56, '#31546a');
  cube('scarf', 1.04, .18, .71, 0, 1.36, .0, scarf);
  cube('scarfTail', .2, .43, .12, .28, 1.1, -.39, scarf);
  cube('hat', .78, .23, .73, 0, 2.24, -.07, '#344f72');
  cube('hatPom', .23, .23, .23, 0, 2.43, -.07, '#ecfdff');
  function recolor(next) {
    for (const n of ['body','head','leftArm','rightArm','leftLeg','rightLeg']) parts[n].material.color.set(next.fur);
    parts.scarf.material.color.set(next.scarf);
    parts.scarfTail.material.color.set(next.scarf);
    parts.hat.visible = parts.hatPom.visible = next.hat === 'yes';
  }
  if (!isLofi) recolor(colors);
  return { group, parts, recolor };
}

function validateBlueprint(candidate) {
  if (!candidate || candidate.version !== 1 || !Array.isArray(candidate.blocks)) throw new Error('Invalid FlurryCraft blueprint format.');
  if (!Array.isArray(candidate.size) || candidate.size.length !== 3) throw new Error('Blueprint dimensions missing.');
  const size = candidate.size;
  if (!size.every(v => Number.isInteger(v) && v > 0 && v <= 32) || size[0] * size[1] * size[2] > 32768) throw new Error('Blueprint dimensions are too large.');
  if (candidate.blocks.length === 0 || candidate.blocks.length > MAX_BLOCKS) throw new Error('Invalid number of blocks.');
  for (const p of candidate.blocks) {
    if (!Array.isArray(p) || p.length !== 4 || p.some(v => !Number.isInteger(v)) ||
        p[0] < 0 || p[0] >= size[0] || p[1] < 0 || p[1] >= size[1] || p[2] < 0 || p[2] >= size[2] ||
        p[3] < 1 || p[3] > 255 || !B.BLOCKS[p[3]]) throw new Error('Blueprint contains an invalid block.');
  }
  return { version:1, name: String(candidate.name || 'Untitled creation').slice(0,48),
    size, blocks:candidate.blocks, author:String(candidate.author || 'Yeti creator').slice(0,48) };
}

export function initFlurry(game) {
  let colors = Object.assign({ fur:'#f3f9ff', scarf:'#35c5ee', hat:'yes' }, read(PREFERENCES, {}));
  let quest = Math.max(0, Math.min(4, Number(read(QUEST, 0)) || 0));
  let placed = 0;
  let npcPosition = null;
  let avatar = createYeti(colors);
  let lofi = createYeti(colors, true);
  avatar.group.visible = false; lofi.group.visible = false;
  game.scene.add(avatar.group, lofi.group);
  let third = false, lastQuestText = '', questPoll = 0;
  const questNames = [
    'Find Lofi the Yeti near the starter shack',
    'Collect at least 6 wood blocks (mine trees)',
    'Build something: place 8 blocks',
    'Save a creation as a local blueprint',
    'Adventure completed! Keep building'
  ];
  const style = document.createElement('style');
  style.textContent = [
    ':root{--flurry-cyan:#a6ebff}',
    '#flurryActions{position:fixed;z-index:26;top:12px;left:12px;display:none;gap:7px;flex-wrap:wrap;max-width:min(530px,64vw);pointer-events:auto}',
    '.flurryBtn{padding:9px 11px;border:1px solid #b7eafa;border-radius:13px;color:white;background:rgba(17,43,60,.85);font:700 12px system-ui;box-shadow:0 4px 18px #0018;cursor:pointer;touch-action:manipulation}',
    '.flurryBtn:active{background:#1684a5}',
    '#flurryQuest{position:fixed;z-index:14;left:12px;top:65px;max-width:250px;padding:10px 12px;border-radius:12px;color:#e7faff;background:rgba(9,36,50,.74);font:600 12px/1.5 system-ui;pointer-events:none;display:none}',
    '#flurryQuest strong{display:block;color:#90ebff;letter-spacing:.06em;font-size:10px;margin-bottom:2px}',
    '#flurryModal{position:fixed;inset:0;z-index:100;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(1,15,28,.85);color:#e7faff;font:14px/1.5 system-ui}',
    '#flurryModal .fPanel{width:min(440px,94vw);max-height:90vh;overflow:auto;border:1px solid #78cde5;border-radius:18px;padding:20px;background:linear-gradient(165deg,#214b65,#0c2332);box-shadow:0 14px 50px #0009}',
    '#flurryModal h2{margin:0 0 8px;font-size:24px;color:#fff}',
    '#flurryModal label{display:block;margin:12px 0 6px;color:#ceeefd;font-weight:600}',
    '#flurryModal input,#flurryModal select{background:#061b29;border:1px solid #579ab1;border-radius:10px;color:white;padding:9px;width:100%;font:inherit}',
    '#flurryModal input[type=color]{padding:2px;width:68px;height:43px;cursor:pointer}',
    '#flurryModal button{padding:10px 14px;margin:12px 6px 0 0;border:1px solid #b6f0ff;border-radius:10px;background:#186c87;color:white;font:700 13px system-ui;cursor:pointer}',
    '#flurryModal button.muted{background:#16394d}',
    '#flurryMenuButton{background:linear-gradient(90deg,#2b7797,#4b91ae);border-color:#81d9fa;color:white}',
    '#flurryModal .note{font:12px/1.5 system-ui;color:#b1d3e4;margin:10px 0}',
    '@media(max-height:520px){#flurryActions{top:5px;left:7px;gap:4px} .flurryBtn{padding:6px 7px;font-size:10px}#flurryQuest{top:38px;font-size:10px;padding:5px 7px}#flurryModal .fPanel{padding:10px}}'
  ].join('\n'); document.head.appendChild(style);

  const actions = document.createElement('div'); actions.id = 'flurryActions';
  const action = (label, callback) => {
    const button = document.createElement('button'); button.className='flurryBtn'; button.textContent=label;
    button.addEventListener('click', e => { e.stopPropagation(); callback(); }); actions.appendChild(button); return button;
  };
  action('👁 View', () => { third=!third; notify(game, third ? 'Third-person Yeti view' : 'First-person building view'); });
  action('🎨 Yeti', () => showCustomizer());
  action('🏠 Blueprint', () => showBlueprint());
  action('📂 Import', () => chooseImport());
  document.body.appendChild(actions);
  const questView = document.createElement('div'); questView.id='flurryQuest'; document.body.appendChild(questView);
  const overlay = document.createElement('div'); overlay.id='flurryModal'; overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-modal','true');
  const panel = document.createElement('div'); panel.className='fPanel'; overlay.appendChild(panel); document.body.appendChild(overlay);
  const file = document.createElement('input'); file.type='file'; file.accept='.json,application/json'; file.style.display='none'; document.body.appendChild(file);
  const menuButton = document.createElement('div'); menuButton.id='flurryMenuButton'; menuButton.className='btn'; menuButton.textContent='🎨 Customize your Yeti';
  const newWorldButton=$('bNew'); if (newWorldButton) newWorldButton.insertAdjacentElement('afterend',menuButton);
  menuButton.addEventListener('click', () => showCustomizer());

  const close = () => { overlay.style.display='none'; panel.replaceChildren(); };
  overlay.addEventListener('pointerdown', e => { if(e.target===overlay) close(); });
  const make = (tag,text,parent=panel) => { const el=document.createElement(tag); if(text!==undefined) el.textContent=text; parent.appendChild(el); return el; };
  const button = (title, fn, muted=false) => {const el=make('button',title); if(muted)el.className='muted'; el.addEventListener('click',fn); return el;};
  const open = title => {panel.replaceChildren(); make('h2',title); overlay.style.display='flex';};
  const label = text=>make('label',text);
  const input = (value='',type='text')=>{const el=make('input');el.value=value;el.type=type;return el;};
  const complete = () => {quest=Math.min(4,quest+1); save(QUEST,quest); placed=0; lastQuestText=''; notify(game,quest===4?'Lofi: Amazing! You are a true Yeti creator!':'Quest completed! '+questNames[quest]);};
  function showCustomizer() {
    open('Customize your Yeti');
    make('p','Design your snowy avatar. Your choices are saved on this device.');
    label('Fur color'); const fur=input(colors.fur,'color');
    label('Scarf color'); const scarf=input(colors.scarf,'color');
    label('Wear a winter hat'); const hat=make('select');
    for(const v of ['yes','no']){const op=document.createElement('option');op.value=v;op.textContent=v==='yes'?'Yes — winter hat':'No hat';hat.appendChild(op);}hat.value=colors.hat;
    button('Save my Yeti',()=>{colors={fur:fur.value,scarf:scarf.value,hat:hat.value}; avatar.recolor(colors); save(PREFERENCES,colors);close();notify(game,'Yeti appearance saved!');});
    button('Cancel',close,true);
  }
  function showBlueprint() {
    if(game.state!=='play' || !game.world){notify(game,'Start or open a world first.');return;}
    open('Save your building');
    make('p','Stand near the center of your house. Captures blocks in an 11×12×11 area around you. This is a LOCAL blueprint, not an NFT.');
    label('Creation name');const name=input('My snowy cabin');
    label('Creator name');const author=input('Yeti builder');
    button('Save + download JSON',()=>{
      const world=game.world, p=game.player;
      const origin=[Math.floor(p.x)-5,Math.floor(p.y)-1,Math.floor(p.z)-5], size=[11,12,11];
      const blocks=[];
      for(let y=0;y<size[1];y++)for(let z=0;z<size[2];z++)for(let x=0;x<size[0];x++){
        const wx=origin[0]+x, wy=origin[1]+y, wz=origin[2]+z;
        if(!world.loaded(wx,wz)){notify(game,'Nearby chunks are loading. Try again in a moment.');return;}
        const id=world.getBlock(wx,wy,wz);
        if(id!==B.AIR && B.BLOCKS[id] && id!==B.WATER && id!==B.LAVA && id!==B.BEDROCK && id!==B.TALLGRASS){blocks.push([x,y,z,id]);}
      }
      if(!blocks.length){notify(game,'No building blocks found in the selected area.');return;}
      const blueprint=validateBlueprint({version:1,name:name.value,author:author.value,size,blocks});
      const library=read(BLUEPRINTS,[]); library.push(blueprint); if(library.length>15)library.shift();
      if(!save(BLUEPRINTS,library))notify(game,'Device storage is full. You can still download your blueprint.');
      const blob=new Blob([JSON.stringify(blueprint)],{type:'application/json'});
      const url=URL.createObjectURL(blob), a=document.createElement('a');a.href=url;
      a.download='flurrycraft-'+blueprint.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,32)+'.json';
      a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);close();
      if(quest===3)complete();notify(game,'Building blueprint saved! Marketplace and NFT minting come later.');
    });
    button('Close',close,true);
  }
  function placeBlueprint(candidate) {
    let data;try{data=validateBlueprint(candidate);}catch(err){notify(game,err.message);return;}
    if(game.state!=='play' || !game.world){notify(game,'Enter a game world before importing.');return;}
    const world=game.world,p=game.player;
    const dx=Math.round(-Math.sin(p.yaw)*9),dz=Math.round(-Math.cos(p.yaw)*9);
    const ox=Math.floor(p.x)+dx-Math.floor(data.size[0]/2),oy=Math.floor(p.y),oz=Math.floor(p.z)+dz-Math.floor(data.size[2]/2);
    for(const [x,y,z] of data.blocks){
      const X=ox+x,Y=oy+y,Z=oz+z;
      if(!world.loaded(X,Z)){notify(game,'Move closer so the destination loads.');return;}
      if(world.getBlock(X,Y,Z)!==B.AIR){notify(game,'Destination obstructed! Face a clear, flat area and retry.');return;}
    }
    if(!confirm('Place '+data.name+' ('+data.blocks.length+' blocks) into this world? This uses a local blueprint, not an NFT.'))return;
    for(const [x,y,z,id] of data.blocks) world.setBlock(ox+x,oy+y,oz+z,id);
    notify(game,'Placed '+data.name+'! World autosaves periodically.');
  }
  function chooseImport(){
    open('Import a creation');
    make('p','Install a saved blueprint into your world. Stand on flat ground and FACE the space where it should appear. Imports cannot overwrite existing blocks.');
    const library=read(BLUEPRINTS,[]);
    if(library.length){label('Your saved blueprints');for(const item of library.slice().reverse()){
      const b=button('Place '+String(item.name).slice(0,36),()=>{close();placeBlueprint(item);}); b.style.display='block';
    }}
    button('Choose blueprint JSON',()=>{close();file.click();});
    button('Cancel',close,true);
  }
  file.addEventListener('change',async()=>{
    const source=file.files && file.files[0];file.value='';if(!source)return;
    if(source.size>1_000_000){notify(game,'Blueprint file is too large.');return;}
    try{const data=JSON.parse(await source.text());placeBlueprint(data);}catch(err){notify(game,'Could not open blueprint: '+err.message);}
  });
  function onWorldReady(isNew){
    const p=game.player,w=game.world;
    const baseX=Math.floor(p.spawn.x)+8, baseZ=Math.floor(p.spawn.z)+3;
    const baseY=Math.max(2,Math.min(115,w.gen.column(baseX,baseZ).h+1));
    if(isNew){
      // A simple Lofi starter shack. Changes are recorded in the world save.
      for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++){
        w.setBlock(baseX+x,baseY-1,baseZ+z,B.SPRUCE_PLANKS);
        w.setBlock(baseX+x,baseY+4,baseZ+z,B.SNOW);
      }
      for(let y=0;y<4;y++)for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++){
        if(Math.abs(x)!==2&&Math.abs(z)!==2)continue;
        const door=z===-2&&x===0&&y<2;
        const window=y===2&&((Math.abs(x)===2&&z===0)||(Math.abs(z)===2&&Math.abs(x)===1));
        w.setBlock(baseX+x,baseY+y,baseZ+z,door?B.AIR:(window?B.GLASS:B.SPRUCE_PLANKS));
      }
    }
    // Lofi is a local quest guide — not a connected NFT character.
    const lx=baseX-4,lz=baseZ-3;
    npcPosition={x:lx+.5,y:w.gen.column(lx,lz).h+1,z:lz+.5};
    lofi.group.position.set(npcPosition.x,npcPosition.y,npcPosition.z);lofi.group.visible=true;
    if(isNew)notify(game,'❄️ Welcome! Meet Lofi by the starter shack.');
  }
  function update(dt) {
    const isPlaying=game.state==='play' && !game.paused;
    actions.style.display=isPlaying&&!game.ui.isOpen?'flex':'none';
    questView.style.display=isPlaying?'block':'none';
    if(!isPlaying){avatar.group.visible=false;return;}
    const p=game.player;
    avatar.group.visible=third&&!p.dead;
    avatar.group.position.set(p.x,p.y,p.z);
    avatar.group.rotation.y=p.yaw;
    if(third&&!p.dead){
      const distance=3.8, delta=new THREE.Vector3(0,0,distance).applyQuaternion(game.camera.quaternion);
      const start=game.camera.position.clone();
      const target=start.clone().add(delta);target.y+=0.4;
      // Keep the camera out of terrain. Collision probe uses existing voxel solids.
      const from=start.clone(), diff=target.clone().sub(from);
      for(let n=1;n<=12;n++){const test=from.clone().addScaledVector(diff,n/12);
        if(game.world.isSolid(test.x,test.y,test.z)){target.copy(from).addScaledVector(diff,(n-1)/12);break;}
      }
      game.camera.position.copy(target);
    }
    if(npcPosition&&lofi.group.visible){
      lofi.group.rotation.y+=dt*.28;
      const d=Math.hypot(p.x-npcPosition.x,p.z-npcPosition.z);
      if(d<4.4&&quest===0){complete();notify(game,'Lofi: Help me build a warm winter village!');}
    }
    questPoll-=dt;
    if(questPoll<=0){
      questPoll=.4;
      if(quest===1 && p.countItem(B.LOG)+p.countItem(B.SPRUCE_LOG)+p.countItem(B.BIRCH_LOG)>=6)complete();
      if(quest===2 && placed>=8)complete();
      const suffix=quest===2?' ('+placed+'/8)':quest===1?' ('+(p.countItem(B.LOG)+p.countItem(B.SPRUCE_LOG)+p.countItem(B.BIRCH_LOG))+'/6)':'';
      const text='LOFI QUEST '+(quest+1)+'/5|'+questNames[quest]+suffix;
      if(text!==lastQuestText){lastQuestText=text;questView.replaceChildren();const strong=document.createElement('strong');strong.textContent='❄️ '+text.split('|')[0];questView.appendChild(strong);questView.appendChild(document.createTextNode(text.split('|')[1]));}
    }
  }
  // Only count player placements within reach, never world generation.
  const countPlayerPlacement = (x,y,z,oldId,newId) => {
    if(game.state!=='play'||quest!==2||oldId!==B.AIR||newId===B.AIR)return;
    const p=game.player;
    if(Math.hypot(x-p.x,y-p.y,z-p.z)<7)placed++;
  };
  game.flurry={update,onWorldReady,countPlayerPlacement,isThird:()=>third};
  document.addEventListener('keydown', e=>{
    if(e.target && /INPUT|TEXTAREA/.test(e.target.tagName))return;
    if(e.code==='Escape' && overlay.style.display==='flex'){close();e.stopImmediatePropagation();return;}
    if(game.state!=='play'||game.ui.isOpen||game.paused)return;
    if(e.code==='KeyV'){third=!third;notify(game,third?'Third-person camera':'First-person camera');}
    if(e.code==='KeyB')showBlueprint();
  });
}
