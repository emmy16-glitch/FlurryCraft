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
  // An original 3D character with the same winter-cartoon design language as
  // the SVG portraits: white furry silhouette, big blue expressive face,
  // friendly brows, ears, and a scarf. Low-poly on purpose for mobile WebGL.
  const group = new THREE.Group(), parts = {};
  const cube = (name, w, h, d, x, y, z, color) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshBasicMaterial({ color, fog:false })
    );
    mesh.position.set(x,y,z);
    mesh.castShadow=false;
    group.add(mesh);
    parts[name]=mesh;
    return mesh;
  };
  const fur = isLofi ? '#f7fdff' : (colors.fur || '#f7fdff');
  const face = isLofi ? '#4e9cd0' : (colors.face || '#4e9cd0');
  const scarf = isLofi ? '#45cdeb' : (colors.scarf || '#37c5e1');
  const ivory='#e6f7fc', ice='#b8dce8', dark='#1c3b59';
  // Boots and legs create a readable shape at a distance.
  cube('legL',.34,.59,.49,-.26,.28,0,fur);
  cube('legR',.34,.59,.49,.26,.28,0,fur);
  cube('footL',.40,.19,.63,-.26,.10,-.13,face);
  cube('footR',.40,.19,.63,.26,.10,-.13,face);
  cube('body',.98,1.06,.67,0,1.03,0,fur);
  cube('belly',.71,.54,.07,0,.88,-.37,ivory);
  cube('armL',.32,.78,.51,-.64,1.03,0,fur);
  cube('armR',.32,.78,.51,.64,1.03,0,fur);
  cube('handL',.29,.23,.51,-.64,.61,-.03,face);
  cube('handR',.29,.23,.51,.64,.61,-.03,face);
  // Shaggy silhouette: tiny white fur clumps, without big overlapping meshes.
  for(const [name,x,y,z] of [
    ['furL1',-.51,1.36,.02],['furL2',-.58,.86,.06],
    ['furR1',.51,1.35,.03],['furR2',.57,.85,.06],
    ['furTopL',-.46,1.98,-.04],['furTopR',.46,1.98,-.04]
  ]) cube(name,.20,.22,.30,x,y,z,fur);
  cube('head',1.08,.82,.81,0,1.75,-.04,fur);
  cube('earL',.25,.35,.20,-.65,1.76,-.09,face);
  cube('earR',.25,.35,.20,.65,1.76,-.09,face);
  cube('hornL',.19,.38,.19,-.35,2.27,.01,ice);
  cube('hornR',.19,.38,.19,.35,2.27,.01,ice);
  cube('tuftL',.19,.22,.22,-.18,2.18,-.31,fur);
  cube('tuftR',.19,.23,.22,.19,2.19,-.31,fur);
  // The thick blue face, white eyes and smiling mouth are readable at phone size.
  cube('face',.85,.59,.10,0,1.72,-.49,face);
  cube('cheekL',.19,.18,.11,-.41,1.52,-.49,face);
  cube('cheekR',.19,.18,.11,.41,1.52,-.49,face);
  cube('eyeL',.25,.21,.07,-.21,1.84,-.57,'#ffffff');
  cube('eyeR',.25,.21,.07,.21,1.84,-.57,'#ffffff');
  cube('pupilL',.10,.15,.05,-.17,1.82,-.62,dark);
  cube('pupilR',.10,.15,.05,.25,1.82,-.62,dark);
  cube('browL',.30,.055,.08,-.22,2.0,-.57,'#245983');
  cube('browR',.30,.055,.08,.22,2.0,-.57,'#245983');
  cube('nose',.16,.11,.09,0,1.66,-.61,'#255c83');
  cube('mouth',.44,.08,.07,0,1.49,-.59,'#15334e');
  cube('smile',.28,.035,.07,0,1.52,-.635,'#d3f8ff');
  cube('scarf',1.04,.18,.76,0,1.38,.01,scarf);
  cube('scarfTail',.20,.41,.12,.30,1.14,-.41,scarf);
  cube('hat',.81,.21,.78,0,2.22,-.04,'#2b607d');
  cube('hatPom',.20,.20,.21,0,2.37,-.04,ivory);
  function recolor(next) {
    for(const n of ['body','head','armL','armR','legL','legR','furL1','furL2','furR1','furR2','furTopL','furTopR']) parts[n].material.color.set(next.fur||'#f7fdff');
    for(const n of ['face','cheekL','cheekR','earL','earR','handL','handR','footL','footR']) parts[n].material.color.set(next.face||'#4e9cd0');
    for(const n of ['scarf','scarfTail']) parts[n].material.color.set(next.scarf||'#37c5e1');
    parts.hat.visible=parts.hatPom.visible=next.hat==='yes';
  }
  if(!isLofi)recolor(colors);
  else {parts.hat.visible=parts.hatPom.visible=false;}
  return {group,parts,recolor};
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
  let colors = Object.assign({ fur:'#f7fdff', face:'#4e9cd0', scarf:'#37c5e1', hat:'yes' }, read(PREFERENCES, {}));
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
    '#flurryActions{position:fixed;z-index:26;top:10px;left:10px;display:none;gap:6px;flex-wrap:wrap;max-width:min(420px,60vw);pointer-events:auto}',
    '.flurryBtn{padding:9px 11px;border:1px solid #b7eafa;border-radius:13px;color:white;background:rgba(17,43,60,.85);font:700 12px system-ui;box-shadow:0 4px 18px #0018;cursor:pointer;touch-action:manipulation}',
    '.flurryBtn:active{background:#1684a5}',
    '.flurryBtn.build{background:#168c9a;border:2px solid #d2faff;box-shadow:0 0 0 2px #003343,0 3px 16px #0008;font-weight:900;letter-spacing:.04em}',
    '.flurryTiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:12px 0}',
    '.flurryCategories{display:flex;gap:6px;flex-wrap:wrap;margin:9px 0}',
    '#flurryModal button.flurryCategory{margin:0;padding:7px 11px;border:1px solid #5b9ab3;border-radius:999px;background:#143c53;color:#d9f5ff;font:700 12px system-ui}',
    '#flurryModal button.flurryCategory.selected{background:#a0edff;border-color:#d5f8ff;color:#063044}',
    '.fc-hotbar-all{cursor:pointer;display:flex!important;flex-direction:column;align-items:center;justify-content:center;background:#167d96!important;border:2px solid #baf4ff!important;color:#fff!important;line-height:1;font-family:system-ui}',
    '.fc-hotbar-all .fc-plus{font-size:23px;font-weight:800;line-height:1}',
    '.fc-hotbar-all .fc-all-text{font-size:9px;font-weight:900;letter-spacing:.04em}',
    '#hotbar{width:min(96vw,530px);max-width:calc(100vw - 8px);gap:2px}',
    '#hotbar .slot{width:auto!important;min-width:0;flex:1 1 0;height:auto;aspect-ratio:1/1}',
    '#hotbar .slot img{width:80%;height:80%;max-width:36px;max-height:36px}',
    '.flurryLibraryHint{color:#b7dbe9;font-size:12px;margin:7px 0}',

    '#flurryModal .flurryTile{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;padding:9px 3px;margin:0;min-height:74px;background:#16465e;box-shadow:inset 0 0 0 1px #5bb3c8}',
    '.flurryTile img{width:36px;height:36px;object-fit:contain;image-rendering:pixelated}',
    '#flurryHelp{position:fixed;left:50%;bottom:69px;transform:translateX(-50%);width:max-content;max-width:78vw;z-index:14;padding:7px 13px;border:1px solid #a4e9ff;border-radius:12px;background:#082b40d9;color:#f0fcff;font:700 12px/1.3 system-ui;pointer-events:none;text-align:center;text-shadow:1px 1px #012;display:none}',
    '#flurryQuest{position:fixed;z-index:14;left:12px;top:58px;max-width:250px;padding:10px 12px;border-radius:12px;color:#e7faff;background:rgba(9,36,50,.74);font:600 12px/1.5 system-ui;pointer-events:none;display:none}',
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
    '@media(max-height:520px){#flurryHelp{bottom:55px;max-width:65vw;font-size:10px;padding:5px 8px} .flurryTiles{grid-template-columns:repeat(4,minmax(0,1fr))} #flurryModal .flurryTile{min-height:57px;padding:5px 2px}.flurryTile img{width:28px;height:28px}}',
    '@media(max-height:520px){#flurryActions{top:5px;left:7px;gap:4px} .flurryBtn{padding:6px 7px;font-size:10px}#flurryQuest{top:37px;font-size:10px;padding:5px 7px}#flurryModal .fPanel{padding:10px}}',
    '#flurryQuest{padding-left:54px;min-height:55px;background-image:url("./assets/yeti-guide.svg");background-repeat:no-repeat;background-size:43px 53px;background-position:5px center}',
    '.fc-customize-preview{display:flex;align-items:center;gap:12px;margin:7px 0;background:#11374d;border:1px solid #397a94;border-radius:14px;padding:9px}',
    '.fc-customize-preview img{height:110px;width:95px;object-fit:contain;flex-shrink:0}',
    '.fc-customize-preview p{font-size:12px;color:#daeff8;margin:0}',
    '@media(max-height:520px){.fc-customize-preview img{height:66px;width:65px}}'
  ].join('\n'); document.head.appendChild(style);

  const actions = document.createElement('div'); actions.id = 'flurryActions';
  const action = (label, callback) => {
    const button = document.createElement('button'); button.className='flurryBtn'; button.textContent=label;
    button.addEventListener('click', e => { e.stopPropagation(); callback(); }); actions.appendChild(button); return button;
  };
  const buildAction = action('🧱 BUILD', () => showBuildMenu()); buildAction.classList.add('build');
  action('👁 View', () => { third=!third; notify(game, third ? 'Third-person Yeti view' : 'First-person building view'); });
  let brightWorld = read('flurrycraft_bright_world_v1', true) !== false;
  const toggleDay = () => {
    brightWorld = !brightWorld;
    save('flurrycraft_bright_world_v1', brightWorld);
    if (brightWorld) game.env.tod = 0.25;
    daylightBtn.textContent = brightWorld ? '☀ Day: ON' : '🌙 Day: OFF';
    notify(game, brightWorld ? 'Bright winter daylight enabled!' : 'Natural day/night cycle enabled.');
  };
  const rescue = () => {
    if(game.state !== 'play' || !game.world) return;
    const p=game.player, sp=p.spawn;
    if (!sp || !Number.isFinite(sp.x) || !Number.isFinite(sp.z)) {notify(game,'Spawn point is unavailable.');return;}
    // Hover above the saved spawn; never overwrite existing structures/terrain.
    // Free-flight avoids trapping the player in the same dug-out hole again.
    enterBuildMode();
    const y=Math.min(88, Math.max(8,sp.y+10));
    game.tp(sp.x,y,sp.z);
    p.vx=p.vy=p.vz=0;p.onGround=false;p.flying=true;
    third=false;
    notify(game,'Back near spawn! Flying enabled: JUMP goes up, DOWN goes down.');
  };
  const extras = [
    action('🎨 Yeti', () => showCustomizer()),
    action('🏠 Save Build', () => showBlueprint()),
    action('📂 Import', () => chooseImport()),
    action('↗ Unstuck', rescue),
    action('🪽 Fly', () => {
      const p=game.player; enterBuildMode(); p.flying=!p.flying;
      if(p.flying) p.vy=0;
      notify(game,p.flying?'Flying enabled: JUMP ↑ and DOWN ↓.':'Flying disabled.');
    }),
    action(brightWorld?'☀ Day: ON':'🌙 Day: OFF', toggleDay)
  ];
  const daylightBtn=extras[extras.length-1];
  extras.forEach(btn => btn.style.display = 'none');
  let moreOpen = false;
  const more = action('⋯ More', () => {
    moreOpen = !moreOpen;
    extras.forEach(btn => btn.style.display = moreOpen ? 'flex' : 'none');
    more.textContent = moreOpen ? '✕ Close' : '⋯ More';
  });
  document.body.appendChild(actions);
  const questView = document.createElement('div'); questView.id='flurryQuest'; document.body.appendChild(questView);
  const helpView = document.createElement('div'); helpView.id='flurryHelp'; document.body.appendChild(helpView);
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
  // Beginners should be able to build immediately, without finding a recipe book.
  // Derive the library from the engine registry instead of maintaining a
  // hard-coded 12-block selection. All supported placeable inventory blocks
  // are available in both Creative and Survival.
  const BUILD_PALETTE = Object.values(B.ITEMS)
    .filter(item => item && item.block && B.BLOCKS[item.id] &&
      item.id !== B.BEDROCK && item.id !== B.TNT && item.id !== B.FARMLAND)
    .map(item => [item.id, item.name])
    .sort((a,b) => a[1].localeCompare(b[1]));
  const utilityIds = new Set([B.CRAFTING,B.FURNACE,B.CHEST,B.TORCH,B.FIREPLACE]);
  const natureIds = new Set([B.STONE,B.GRASS,B.DIRT,B.COBBLE,B.SAND,B.GRAVEL,
    B.LEAVES,B.LOG,B.BIRCH_LOG,B.SPRUCE_LOG,B.ICE,B.SNOW,B.CACTUS,
    B.COAL_ORE,B.IRON_ORE,B.GOLD_ORE,B.DIAMOND_ORE]);
  function blockCategory(id) {
    return utilityIds.has(id) ? 'Utility' : natureIds.has(id) ? 'Nature' : 'Building';
  }
  function enterBuildMode() {
    const player = game.player;
    if (!player.creative) {
      player.creative = true;
      player.flying = false;
      game.settings.mode = 'c';
      try { localStorage.setItem('flurrycraft_settings_v1', JSON.stringify(game.settings)); } catch {}
      notify(game, 'Creative Build Mode enabled: unlimited blocks!');
    }
  }
  function selectBlock(id, targetSlot) {
    if (game.state !== 'play' || !BUILD_PALETTE.some(block => block[0]===id)) return;
    const player=game.player;
    // A chosen library block is unlimited in either game mode. Survival's
    // enemies/health still apply; we never silently switch its mode.
    // Catalog selection always replaces the current selected slot, or the
    // exact hotbar slot tapped/held to open this library.
    const slot=Number.isInteger(targetSlot)&&targetSlot>=0&&targetSlot<9
      ? targetSlot : player.sel;
    const previous=player.inv[slot];
    if(previous && previous.id!==id && !previous.flurryUnlimited && !player.creative) {
      const spare=player.inv.findIndex((s,i)=>i>=9&&!s);
      if(spare<0){notify(game,'Inventory full! Free space before replacing this slot.');return;}
      player.inv[spare]=previous; // Preserve items earned in Survival.
    }
    // Precision placement remains first-person when selecting from library.
    third=false;
    player.inv[slot]={id,n:64,flurryUnlimited:true};
    player.sel=slot;
    game.ui.dirtyInv=true;
    close();
    notify(game,B.itemName(id)+' equipped. Tap PLACE to build.');
  }
  function equipStarterBlocks() {
    const p=game.player;
    if (!p.creative || p.inv.slice(0,9).some(Boolean)) return;
    [B.SPRUCE_PLANKS,B.GLASS,B.STONE_BRICKS,B.SNOW,B.ICE,B.BRICKS,B.PLANKS,B.TORCH].forEach((id,i)=>{p.inv[i]={id,n:64};});
    p.sel=0;
    game.ui.dirtyInv=true;
  }
  function showBuildMenu(targetSlot=null) {
    if (game.state !== 'play' || !game.world) { notify(game,'Enter a world first!'); return; }
    open('🧱 ALL BLOCKS');
    make('p','Tap a block to equip it instantly in your hotbar. This works in Creative and Survival without changing your mode.');
    const hint=make('div','Use the + ALL button on the bottom bar anytime, or hold any hotbar slot to replace it.');
    hint.className='flurryLibraryHint';
    const search=input('','search');
    search.placeholder='Search blocks: snow, glass, stairs...';
    search.setAttribute('aria-label','Search available blocks');
    const categories=make('div');categories.className='flurryCategories';
    const grid=make('div');grid.className='flurryTiles';
    let category='All';
    const draw=()=>{
      grid.replaceChildren();
      const q=search.value.trim().toLowerCase();
      const visible=BUILD_PALETTE.filter(([id,name])=>
        (category==='All'||blockCategory(id)===category) && name.toLowerCase().includes(q));
      if(!visible.length){const empty=document.createElement('p');empty.textContent='No blocks match. Try another search.';grid.appendChild(empty);return;}
      for(const [id,name] of visible){
        const b=document.createElement('button');b.className='flurryTile';b.type='button';
        const img=document.createElement('img');img.src=B.iconURL(id);img.alt='';
        const caption=document.createElement('span');caption.textContent=name;
        b.append(img,caption);b.addEventListener('click',()=>selectBlock(id,targetSlot));grid.appendChild(b);
      }
    };
    for(const c of ['All','Building','Nature','Utility']){
      const tab=document.createElement('button');tab.type='button';tab.className='flurryCategory';
      tab.textContent=c;tab.setAttribute('aria-pressed',String(c===category));
      if(c===category)tab.classList.add('selected');
      tab.addEventListener('click',()=>{
        category=c;
        for(const t of categories.children){const on=t.textContent===c;t.classList.toggle('selected',on);t.setAttribute('aria-pressed',String(on));}
        draw();
      });
      categories.appendChild(tab);
    }
    search.addEventListener('input',draw);draw();
    button('Give me a starter set of blocks',()=>{
      const p=game.player;
      const ids=[B.SPRUCE_PLANKS,B.GLASS,B.STONE_BRICKS,B.SNOW,B.ICE,B.BRICKS,B.PLANKS,B.TORCH];
      const preserved=p.inv.slice(0,ids.length).filter(item=>item&&!item.flurryUnlimited);
      const spare=[];
      for(let i=9;i<p.inv.length;i++)if(!p.inv[i])spare.push(i);
      if(!p.creative && preserved.length>spare.length){
        notify(game,'Not enough inventory space for your existing Survival items. Empty some slots first.');return;
      }
      if(!p.creative)preserved.forEach((item,index)=>{p.inv[spare[index]]=item;});
      ids.forEach((id,i)=>{p.inv[i]={id,n:64,flurryUnlimited:true};});
      p.sel=0;game.ui.dirtyInv=true;third=false;close();
      notify(game,'Starter blocks equipped — tap a hotbar slot to switch.');
    });
    button('Close',close,true);
  }
  function showCustomizer() {
    open('Customize your Yeti');
    const art=make('div');art.className='fc-customize-preview';
    const img=document.createElement('img');img.src='./assets/yeti-guide.svg';img.alt='Original winter Yeti illustration';
    art.appendChild(img);
    const helper=document.createElement('p');helper.textContent='Your choices change your in-game 3D Yeti. The drawing is an illustrated style reference.';art.appendChild(helper);
    label('Fur color'); const fur=input(colors.fur,'color');
    label('Face, hands and feet'); const face=input(colors.face,'color');
    label('Scarf color'); const scarf=input(colors.scarf,'color');
    label('Wear a winter hat'); const hat=make('select');
    for(const v of ['yes','no']){const op=document.createElement('option');op.value=v;op.textContent=v==='yes'?'Yes — winter hat':'No hat';hat.appendChild(op);}hat.value=colors.hat;
    button('Save my Yeti',()=>{colors={fur:fur.value,face:face.value,scarf:scarf.value,hat:hat.value}; avatar.recolor(colors); save(PREFERENCES,colors);close();notify(game,'Yeti appearance saved!');});
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
    equipStarterBlocks();
    if (p.creative && brightWorld) game.env.tod=0.25;
    // Existing survival worlds used to start with an empty hotbar. Show
    // the building picker the first time a returning player opens one.
    if (!read('flurrycraft_builder_help_seen_v2',false) && p.inv.slice(0,9).every(s=>!s)) {
      save('flurrycraft_builder_help_seen_v2',true);
      setTimeout(()=>{if(game.state==='play')showBuildMenu();},550);
    }
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
    helpView.style.display=isPlaying&&!game.ui.isOpen&&overlay.style.display!=='flex'?'block':'none';
    if(isPlaying){
      const id=game.player.held()?.id;
      const text=id&&B.ITEMS[id] ? B.itemName(id)+' · PLACE □' : 'Tap + ALL on the bottom bar to choose a block';
      if(helpView.textContent!==text)helpView.textContent=text;
    }
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
      if(quest===1 && (p.creative || p.countItem(B.LOG)+p.countItem(B.SPRUCE_LOG)+p.countItem(B.BIRCH_LOG)>=6))complete();
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
  // Bottom hotbar is interactive on ALL devices (not just when touch is active).
  // Tapping a filled slot equips it. Tapping an empty slot opens the library.
  // Long-pressing a filled slot opens the library to replace that exact slot.
  const hotbar=$('hotbar');
  hotbar.setAttribute('role','toolbar');
  hotbar.setAttribute('aria-label','Choose building blocks');
  hotbar.style.pointerEvents='auto';hotbar.style.zIndex='16';
  game.ui.hbEls.forEach((el,i)=>{
    el.style.pointerEvents='auto';
    el.style.cursor='pointer';
    el.setAttribute('role','button');
    el.setAttribute('tabindex','0');
    el.setAttribute('aria-label','Hotbar slot '+(i+1));
    let holdTimer=null,wasLong=false;
    const begin=e=>{
      if(game.state!=='play'||game.paused||game.ui.isOpen)return;
      e.preventDefault();e.stopPropagation();
      wasLong=false;game.player.sel=i;game.ui.dirtyInv=true;
      if(!game.player.inv[i]){showBuildMenu(i);return;}
      holdTimer=setTimeout(()=>{wasLong=true;showBuildMenu(i);},550);
    };
    const end=()=>{if(holdTimer){clearTimeout(holdTimer);holdTimer=null;}};
    el.addEventListener('pointerdown',begin);
    el.addEventListener('pointerup',end);
    el.addEventListener('pointercancel',end);
    el.addEventListener('pointerleave',end);
    el.addEventListener('keydown',e=>{
      if(e.key==='Enter'||e.key===' '){e.preventDefault();game.player.sel=i;game.ui.dirtyInv=true;if(!game.player.inv[i])showBuildMenu(i);}
    });
  });
  const all=document.createElement('button');
  all.type='button';all.className='slot fc-hotbar-all';all.setAttribute('aria-label','Open all available blocks');
  all.innerHTML='<span class="fc-plus">+</span><span class="fc-all-text">ALL</span>';
  all.style.pointerEvents='auto';
  all.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();showBuildMenu();});
  hotbar.appendChild(all);
  game.flurry={update,onWorldReady,countPlayerPlacement,isThird:()=>third,daylightLocked:()=>brightWorld,openBlockLibrary:showBuildMenu};
  document.addEventListener('keydown', e=>{
    if(e.target && /INPUT|TEXTAREA/.test(e.target.tagName))return;
    if(e.code==='Escape' && overlay.style.display==='flex'){close();e.stopImmediatePropagation();return;}
    if(game.state!=='play'||game.ui.isOpen||game.paused)return;
    if(e.code==='KeyV'){third=!third;notify(game,third?'Third-person camera':'First-person camera');}
    if(e.code==='KeyB')showBlueprint();
    if(e.code==='KeyG')showBuildMenu();
  });
}
