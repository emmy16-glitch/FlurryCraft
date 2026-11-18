// FlurryCraft-specific gameplay layer: Yetis, quests, starter shack and local blueprints.
// This module intentionally contains NO wallet calls or real-money listings.
// NFT mint/list/buy requires audited Move contracts and an ownership-aware backend.
import * as THREE from 'three';
import * as B from './blocks.js';
import { rotateXZ, rotatedSize, selectionBounds } from './blueprints.js';
import { normalizeBlueprint } from './creator-studio.js';
import { initCreatorStudioUI } from './creator-studio-ui.js';
import { initSuiMarketUI } from './sui-market-ui.js';
import { EditHistory } from './edit-history.js';
import { weatherProfile,cycleWeatherMode } from './winter-weather.js';
import { initExplorerMap } from './explorer-map.js';
import { initAdventure } from './adventure.js';
import { initJudgeTour } from './judge-tour.js';
import { initRewardsHub } from './rewards-ui.js';
import { makeSwordMesh,setItemLight } from './render.js';

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
  // Legacy JSON v1 remains valid; reject malformed, duplicated and unsafe blocks.
  return normalizeBlueprint(candidate,id =>
    id>0 && id<B.N_BLOCKS && !!B.BLOCKS[id] && id!==B.WATER &&
    id!==B.LAVA && id!==B.BEDROCK && id!==B.TALLGRASS);
}

export function initFlurry(game) {
  let colors = Object.assign({ fur:'#f7fdff', face:'#4e9cd0', scarf:'#37c5e1', hat:'yes' }, read(PREFERENCES, {}));
  let quest = Math.max(0, Math.min(4, Number(read(QUEST, 0)) || 0));
  let placed = 0;
  const editHistory=new EditHistory({maxSteps:40,maxCells:6000});
  let npcPosition = null;
  let avatar = createYeti(colors);
  let lofi = createYeti(colors, true);
  avatar.group.visible = false; lofi.group.visible = false;
  game.scene.add(avatar.group, lofi.group);
  let avatarSword=null,avatarSwordId=-1;
  function discardAvatarSword(){
    if(!avatarSword)return;
    avatar.group.remove(avatarSword);
    const geometries=new Set(),materials=new Set();
    avatarSword.traverse(o=>{
      if(o.geometry)geometries.add(o.geometry);
      if(Array.isArray(o.material))o.material.forEach(m=>materials.add(m));
      else if(o.material)materials.add(o.material);
    });
    for(const g of geometries)g.dispose();
    for(const m of materials)m.dispose();
    avatarSword=null;avatarSwordId=-1;
  }
  function syncAvatarSword(){
    const id=game.player.held()?.id??-1;
    if(!third||B.ITEMS[id]?.tool?.type!=='sword'){
      discardAvatarSword();return;
    }
    if(avatarSwordId!==id){
      discardAvatarSword();
      avatarSword=makeSwordMesh(id,.62);
      avatarSwordId=id;
      avatar.group.add(avatarSword);
    }
    const swing=Math.sin(game.player.swing*Math.PI);
    avatarSword.position.set(.83,.77,-.30);
    avatarSword.rotation.set(-.28-swing*.65,0,-.35+swing*.75);
    if(typeof game.lightAt==='function')
      setItemLight(avatarSword,game.lightAt(game.player.x,game.player.y+1.2,game.player.z));
  }
  // One lightweight, reusable outline shows exactly where the next block
  // would go, without spawning a new mesh for every tap or covering the HUD.
  const placementGeo=new THREE.BoxGeometry(1.008,1.008,1.008);
  const placementEdges=new THREE.LineSegments(
    new THREE.EdgesGeometry(placementGeo),
    new THREE.LineBasicMaterial({color:0x85e5fa,transparent:true,opacity:0.87,depthTest:true,depthWrite:false})
  );
  const placementFill=new THREE.Mesh(
    new THREE.BoxGeometry(0.987,0.987,0.987),
    new THREE.MeshBasicMaterial({color:0x7eddf5,transparent:true,opacity:0.085,depthWrite:false,depthTest:true})
  );
  const placementGhost=new THREE.Group();
  placementGhost.name='FlurryCraft placement hint';
  placementGhost.add(placementFill,placementEdges);placementGhost.visible=false;
  game.scene.add(placementGhost);
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
    '#fcBuildProgress{position:fixed;z-index:32;left:50%;top:10px;transform:translateX(-50%);width:160px;max-width:34vw;padding:6px 8px;border:1px solid #4f98b4;border-radius:10px;background:#0c3246ee;color:#c3edfc;font:700 10px/1.2 system-ui;pointer-events:none;box-shadow:0 4px 14px #001b297a}',
    '#fcBuildProgress[hidden]{display:none!important}',
    '#fcBuildProgress .fc-progress-track{height:3px;border-radius:3px;background:#305c70;margin-top:4px;overflow:hidden}',
    '#fcBuildProgress .fc-progress-fill{width:0;height:100%;border-radius:3px;background:#a3f0f9;transition:width .1s linear}',
    '.flurryTile img{width:36px;height:36px;object-fit:contain;image-rendering:pixelated}',
    '#flurryHelp{position:fixed;left:50%;bottom:69px;transform:translateX(-50%);width:max-content;max-width:78vw;z-index:14;padding:7px 13px;border:1px solid #a4e9ff;border-radius:12px;background:#082b40d9;color:#f0fcff;font:700 12px/1.3 system-ui;pointer-events:none;text-align:center;text-shadow:1px 1px #012;display:none}',
    '#flurryQuest{position:fixed;z-index:14;left:12px;top:58px;max-width:250px;padding:10px 12px;border-radius:12px;color:#e7faff;background:rgba(9,36,50,.74);font:600 12px/1.5 system-ui;pointer-events:none;display:none}',
    '#flurryQuest strong{display:block;color:#90ebff;letter-spacing:.06em;font-size:10px;margin-bottom:2px}',
    '#flurryModal{position:fixed;inset:0;z-index:100;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(1,15,28,.85);color:#e7faff;font:14px/1.5 system-ui}',
    '#flurryModal .fPanel{width:min(440px,94vw);max-height:90vh;overflow:auto;border:1px solid #78cde5;border-radius:18px;padding:20px;background:linear-gradient(165deg,#214b65,#0c2332);box-shadow:0 14px 50px #0009}',
    '#fcBlueprintPreview{position:fixed;top:8px;right:8px;z-index:35;display:none;width:min(292px,48vw);padding:9px;border-radius:14px;background:#0b344aed;color:#f3fcff;border:1px solid #8fe5f9;box-shadow:0 6px 24px #0017;pointer-events:auto;font:600 11px/1.4 system-ui}',
    '#fcBlueprintPreview strong{display:block;font-size:13px;margin-bottom:3px}',
    '#fcBlueprintPreview .fc-preview-status{font-size:11px;color:#b8e5f3;max-height:36px;overflow:auto;margin-bottom:4px}',
    '#fcBlueprintPreview .fc-preview-buttons{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}',
    '#fcBlueprintPreview button{min-width:0;min-height:34px;border:1px solid #75b6d1;border-radius:9px;background:#205b78;color:white;font:700 12px system-ui;touch-action:manipulation;cursor:pointer}',
    '#fcBlueprintPreview button.fc-place{background:#23a883;color:#052c30;border-color:#9bf0d4}',
    '#fcBlueprintPreview button.fc-place:disabled{opacity:.45;cursor:not-allowed}',
    '@media(max-height:530px){#fcBlueprintPreview{top:4px;right:5px;padding:6px;width:min(245px,43vw)}#fcBlueprintPreview button{min-height:27px;font-size:10px}#fcBlueprintPreview strong{font-size:11px}}',
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
    '@media(max-height:520px){.fc-customize-preview img{height:66px;width:65px}}',
    '#flurryActions{max-width:min(520px,68vw);gap:7px;align-items:flex-start}',
    '.flurryBtn{border-color:rgba(181,224,244,.25);background:rgba(9,32,48,.87);box-shadow:0 4px 14px #0014;transition:background .16s ease,border-color .16s ease}',
    '.flurryBtn.build{background:#7adbee;border:1px solid #a9f3ff;box-shadow:0 5px 16px #032b43aa;color:#082f42}',
    '.flurryBtn.is-open{border-color:#84ddf1;background:#15546a}',
    '#fcQuickMenu{position:absolute;top:calc(100% + 8px);left:0;width:min(278px,80vw);max-height:calc(100dvh - 65px);overflow:auto;overscroll-behavior:contain;border:1px solid #356c84;border-radius:17px;padding:10px;background:rgba(9,32,47,.98);box-shadow:0 12px 35px #001b29aa;backdrop-filter:blur(12px);touch-action:pan-y}',
    '#fcQuickMenu[hidden]{display:none!important}',
    '#fcQuickMenu .fc-menu-section{font:800 10px/1.4 system-ui;letter-spacing:.14em;color:#81b1c5;padding:9px 9px 4px}',
    '#fcQuickMenu .fc-menu-item{display:block;width:100%;min-height:38px;text-align:left;border:0;border-radius:9px;background:transparent;color:#e4f5fb;padding:9px 11px;font:650 13px/1.2 system-ui;cursor:pointer}',
    '#fcQuickMenu .fc-menu-item:active{background:#245e76}',
    '#flurryModal{background:rgba(5,17,29,.69);backdrop-filter:blur(8px);padding:8px}',
    '#flurryModal .fPanel{width:min(500px,95vw);max-height:92dvh;background:#102e43;border:1px solid #376982;border-radius:20px;padding:17px;box-shadow:0 18px 55px #001b2bcc}',
    '#flurryModal .fc-dialog-head{position:sticky;top:-17px;z-index:5;display:flex;gap:12px;align-items:center;justify-content:space-between;padding:3px 0 10px;background:#102e43}',
    '#flurryModal .fc-dialog-head h2{font:800 19px/1.25 system-ui;letter-spacing:-.02em;margin:0;color:#f4fcff}',
    '#flurryModal button.fc-dialog-close{margin:0;padding:0;flex:none;min-width:42px;width:42px;height:42px;border:1px solid #4a7c93;border-radius:12px;background:#1c445a;color:#e7faff;font:700 18px system-ui}',
    '#flurryModal .fPanel>p{font:500 12px/1.5 system-ui;color:#b9d1dd;margin:8px 0}',
    '#flurryModal button{transition:background .14s ease,transform .14s ease;touch-action:manipulation}',
    '#flurryModal button:active{transform:scale(.98)}',
    '#flurryModal button:focus-visible,.flurryBtn:focus-visible,#fcQuickMenu button:focus-visible{outline:2px solid #a4f2ff;outline-offset:2px}',
    '#flurryQuest{top:57px;max-width:220px;padding:8px 8px 8px 44px;min-height:45px;background-size:35px 43px;background-position:4px center;border:1px solid #3b7991;font-size:10px;line-height:1.3}',
    '@media(max-height:520px){#flurryActions{top:6px;left:7px;gap:5px}.flurryBtn{padding:8px 10px;font-size:11px}.flurryBtn.build{padding:8px 11px}#flurryModal .fPanel{padding:10px 12px}#flurryModal .fc-dialog-head{top:-10px}#fcQuickMenu{max-height:calc(100dvh - 55px);width:245px}}',
    '@media(prefers-reduced-motion:reduce){#flurryModal *,#flurryActions *{transition:none!important}}',
  ].join('\n'); document.head.appendChild(style);

  const actions = document.createElement('div'); actions.id = 'flurryActions';
  const action = (label, callback) => {
    const button = document.createElement('button'); button.className='flurryBtn'; button.textContent=label;
    button.addEventListener('click', e => { e.stopPropagation(); callback(); }); actions.appendChild(button); return button;
  };
  // Three clear entry points. All other actions remain accessible in Menu.
  const buildAction=action('▦ Blocks',()=>showBuildMenu());buildAction.classList.add('build');
  let toolState=null,selectionState=null,previewState=null,buildJob=null;
  const markAction=action('Mark first',()=>selectionState?markCapturePoint():markToolPoint());
  const stopTool=action('✕ Cancel',()=>{toolState=null;selectionState=null;refreshToolActions();notify(game,'Cancelled.');});
  markAction.style.display=stopTool.style.display='none';
  function refreshToolActions(){
    const showing=!!(toolState||selectionState);
    markAction.style.display=stopTool.style.display=showing?'inline-flex':'none';
    if(selectionState)markAction.textContent=selectionState.start?'Capture second':'Capture first';
    else if(toolState)markAction.textContent=toolState.start?'Build second':'Mark first';
  }
  let creatorStudio,suiMarket,explorer;
  action('⌂ My Builds',()=>creatorStudio.open());
  let brightWorld=read('flurrycraft_bright_world_v1',true)!==false;
  let winterMode=game.weather.setMode(read('flurrycraft_winter_weather_v1','snowfall'));
  let questVisible=read('fc_quest_visible_v1',false)===true;
  const menuToggle=action('☰ Menu',()=>setMoreMenu(menu.hidden));
  menuToggle.setAttribute('aria-expanded','false');
  menuToggle.setAttribute('aria-controls','fcQuickMenu');
  menuToggle.setAttribute('aria-haspopup','menu');
  const menu=document.createElement('nav');
  menu.id='fcQuickMenu';menu.hidden=true;menu.setAttribute('aria-label','Game options');
  function menuSection(name){
    const title=document.createElement('div');title.className='fc-menu-section';title.textContent=name;menu.appendChild(title);
  }
  function menuItem(text,callback){
    const b=document.createElement('button');b.type='button';b.className='fc-menu-item';b.textContent=text;
    b.addEventListener('click',e=>{e.stopPropagation();setMoreMenu(false);callback();});
    menu.appendChild(b);return b;
  }
  function setMoreMenu(open){
    menu.hidden=!open;
    menuToggle.setAttribute('aria-expanded',String(open));
    menuToggle.classList.toggle('is-open',open);
  }
  function toggleDay(){
    brightWorld=!brightWorld;
    save('flurrycraft_bright_world_v1',brightWorld);
    if(brightWorld)game.env.tod=.25;
    dayButton.textContent=brightWorld?'Daylight: On':'Daylight: Off';
    notify(game,brightWorld?'Daylight on':'Day/night cycle on');
  }
  function rescue(){
    if(game.state!=='play'||!game.world)return;
    const p=game.player,sp=p.spawn;
    if(!sp||!Number.isFinite(sp.x)||!Number.isFinite(sp.z)){notify(game,'Spawn not available');return;}
    enterBuildMode();
    game.tp(sp.x,Math.min(88,Math.max(8,sp.y+10)),sp.z);
    p.vx=p.vy=p.vz=0;p.onGround=false;p.flying=true;third=false;
    notify(game,'Back at spawn. Flying on.');
  }
  function dropHeld(){
    const p=game.player,s=p.held();
    if(!s){notify(game,'Select an item first');return;}
    if(s.flurryUnlimited){notify(game,'Choose a different block instead');return;}
    const cp=Math.cos(p.pitch);
    game.spawnItem(s.id,1,p.x,p.eyeY-.3,p.z,s.d,[-Math.sin(p.yaw)*cp*5,Math.sin(p.pitch)*5+1.5,-Math.cos(p.yaw)*cp*5]);
    s.n--;if(s.n<=0)p.inv[p.sel]=null;
    game.ui.dirtyInv=true;
  }
  menuSection('ADVENTURE');
  menuItem('▶ Guided Tour',()=>judgeTour.start());
  menuItem('Winter Adventure',()=>game.adventure.open());
  menuItem('✦ Rewards Hub',()=>game.rewards.open());
  menuSection('BUILD');
  menuItem('Walls & Floors',()=>showSmartBuilder());
  menuItem('Save Building',()=>showBlueprint());
  menuItem('Undo',()=>undoSmartBuild());
  menuItem('Redo',()=>redoLastEdit());
  menuSection('WORLD');
  menuItem('World Map',()=>explorer.open());
  menuItem('Switch Camera',()=>{third=!third;notify(game,third?'Third person':'First person');});
  menuItem('My Yeti',()=>showCustomizer());
  menuItem('Fly On / Off',()=>{
    const p=game.player;enterBuildMode();p.flying=!p.flying;
    if(p.flying)p.vy=0;
    notify(game,p.flying?'Flying on':'Flying off');
  });
  const dayButton=menuItem(brightWorld?'Daylight: On':'Daylight: Off',toggleDay);
  const weatherButton=menuItem('Weather: '+weatherProfile(winterMode).label,()=>{
    winterMode=game.weather.setMode(cycleWeatherMode(winterMode));
    save('flurrycraft_winter_weather_v1',winterMode);
    weatherButton.textContent='Weather: '+weatherProfile(winterMode).label;
    notify(game,'Snow: '+weatherProfile(winterMode).label);
  });
  menuItem('Return to Spawn',rescue);
  const questButton=menuItem(questVisible?'Hide Quest':'Show Quest',()=>{
    questVisible=!questVisible;
    save('fc_quest_visible_v1',questVisible);
    questButton.textContent=questVisible?'Hide Quest':'Show Quest';
  });
  menuItem('Drop Item',dropHeld);
  menuSection('EXPERIMENTAL');
  menuItem('Sui Testnet',()=>suiMarket.open());
  actions.appendChild(menu);
  document.addEventListener('pointerdown',e=>{
    if(!menu.hidden&&!actions.contains(e.target))setMoreMenu(false);
  });
  document.body.appendChild(actions);
  const questView = document.createElement('div'); questView.id='flurryQuest'; document.body.appendChild(questView);
  const helpView = document.createElement('div'); helpView.id='flurryHelp'; document.body.appendChild(helpView);
  const progress=document.createElement('div');progress.id='fcBuildProgress';progress.hidden=true;
  progress.setAttribute('role','progressbar');progress.setAttribute('aria-label','Building progress');
  progress.setAttribute('aria-valuemin','0');progress.setAttribute('aria-valuemax','100');
  const progressTitle=document.createElement('span');progressTitle.textContent='Building';
  const progressTrack=document.createElement('div');progressTrack.className='fc-progress-track';
  const progressFill=document.createElement('div');progressFill.className='fc-progress-fill';
  progressTrack.appendChild(progressFill);progress.append(progressTitle,progressTrack);
  document.body.appendChild(progress);
  const overlay = document.createElement('div'); overlay.id='flurryModal'; overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-modal','true');
  const panel = document.createElement('div'); panel.className='fPanel'; overlay.appendChild(panel); document.body.appendChild(overlay);

  // Non-modal preview controls let players see the actual world while moving
  // and rotating the hologram. These are independent of touch joystick input.
  const previewPanel=document.createElement('div');
  previewPanel.id='fcBlueprintPreview';
  previewPanel.setAttribute('role','group');
  previewPanel.setAttribute('aria-label','Blueprint preview controls');
  const previewName=document.createElement('strong');
  const previewStatus=document.createElement('div');previewStatus.className='fc-preview-status';
  const previewButtons=document.createElement('div');previewButtons.className='fc-preview-buttons';
  previewPanel.append(previewName,previewStatus,previewButtons);
  const previewButton=(text,fn,cls='')=>{
    const b=document.createElement('button');b.type='button';b.textContent=text;b.className=cls;
    b.addEventListener('pointerdown',e=>e.stopPropagation());
    b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();fn();});
    previewButtons.appendChild(b);return b;
  };
  previewButton('↺ Rotate',()=>shiftPreview(0,0,0,1));
  previewButton('⬇ Ground',()=>snapPreviewToTerrain());
  previewButton('← Left',()=>shiftPreview(-1,0,0));
  previewButton('Right →',()=>shiftPreview(1,0,0));
  previewButton('↑ Forward',()=>shiftPreview(0,0,-1));
  previewButton('↓ Back',()=>shiftPreview(0,0,1));
  previewButton('↟ Up',()=>shiftPreview(0,1,0));
  previewButton('↡ Down',()=>shiftPreview(0,-1,0));
  const installButton=previewButton('✓ Place',()=>installBlueprint(),'fc-place');
  previewButton('✕ Cancel',()=>clearPreview());
  document.body.appendChild(previewPanel);

  const menuButton = document.createElement('div'); menuButton.id='flurryMenuButton'; menuButton.className='btn'; menuButton.textContent='🎨 Customize your Yeti';
  const newWorldButton=$('bNew'); if (newWorldButton) newWorldButton.insertAdjacentElement('afterend',menuButton);
  menuButton.addEventListener('click', () => showCustomizer());

  const close = () => { overlay.style.display='none'; panel.replaceChildren(); panel.classList.remove('fc-studio-wide','fc-sui-panel','fc-map-panel'); };
  overlay.addEventListener('pointerdown', e => { if(e.target===overlay) close(); });
  const make = (tag,text,parent=panel) => { const el=document.createElement(tag); if(text!==undefined) el.textContent=text; parent.appendChild(el); return el; };
  const button = (title, fn, muted=false) => {const el=make('button',title); if(muted)el.className='muted'; el.addEventListener('click',fn); return el;};
  const open = title => {
    setMoreMenu(false);
    // Cancel captured gestures and their timers, not only boolean input flags.
    game.resetTouchControls?.();
    if(game.touch){
      game.touch.left=false;game.touch.attackPressed=false;game.touch.right=false;game.touch.rightPressed=false;
      game.touch.jump=false;game.touch.fwd=0;game.touch.strafe=0;
      game.touch.sprint=false;
    }
    panel.replaceChildren();panel.classList.remove('fc-studio-wide','fc-sui-panel','fc-map-panel');
    const head=make('header');head.className='fc-dialog-head';
    const h=document.createElement('h2');h.textContent=title;
    const exit=document.createElement('button');exit.className='fc-dialog-close';exit.type='button';
    exit.textContent='✕';exit.setAttribute('aria-label','Close and return to game');
    exit.addEventListener('click',close);
    head.append(h,exit);overlay.style.display='flex';
  };
  const label = text=>make('label',text);
  const input = (value='',type='text')=>{const el=make('input');el.value=value;el.type=type;return el;};
  const complete = () => {quest=Math.min(4,quest+1); save(QUEST,quest); placed=0; lastQuestText=''; notify(game,quest===4?'Lofi: Amazing! You are a true Yeti creator!':'Quest completed! '+questNames[quest]);};
  creatorStudio=initCreatorStudioUI({
    game,B,panel,openDialog:open,closeDialog:close,showCapture:showBlueprint,
    startPreview,notify,onMintTestnet:blueprint=>suiMarket.open({blueprint})
  });
  suiMarket=initSuiMarketUI({game,panel,openDialog:open,closeDialog:close,notify,startPreview});
  explorer=initExplorerMap({game,panel,openDialog:open,closeDialog:close,notify,
    dialogOpen:()=>overlay.style.display==='flex',
    isBlocked:()=>!!previewState||!menu.hidden});
  game.adventure=initAdventure({game,B,openDialog:open,closeDialog:close,panel,notify,explorer,
    isInterfaceBusy:()=>overlay.style.display==='flex'||!menu.hidden||!!previewState});
  const judgeTour=initJudgeTour({game,
    openAdventure:()=>game.adventure.open(),openBlocks:()=>showBuildMenu(),
    openRewards:()=>game.rewards.open(),openStudio:()=>creatorStudio.open(),
    openMarketplace:()=>suiMarket.open(),
    isDialogOpen:()=>overlay.style.display==='flex'||!menu.hidden});
  game.rewards=initRewardsHub({game,panel,openDialog:open,notify,
    onOpenMarketplace:()=>suiMarket.open()});
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
    open('Blocks');
    const hint=make('p','Tap a block to equip it.');hint.className='flurryLibraryHint';
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
    // The universal ✕ header closes this panel.
  }
  // Two-point construction: use the same block currently selected in the hotbar.
  // This deliberately avoids new save formats; edits go through World.setBlock.
  function showSmartBuilder(){
    if(game.state!=='play'||!game.world){notify(game,'Enter a world first.');return;}
    const held=game.player.held(), id=held?.id;
    if(!held||!B.BLOCKS[id]||B.SHAPE[id]!==0||!B.ITEMS[id]?.block){
      notify(game,'Select a solid building block in the bottom hotbar first.');return;
    }
    open('📐 Smart Build');
    make('p','Build a wall or floor in two taps. First select a normal block (wood, glass, stone, etc.) from + ALL.');
    make('p','1. Choose a tool. 2. Tap Start. 3. Aim the + at the ground and tap MARK 1. 4. Move your view, aim at another point and tap MARK 2 + BUILD.');
    label('Building shape');
    const type=make('select');
    for(const [value,name] of [['wall','Straight wall'],['floor','Flat floor or roof']]){
      const op=document.createElement('option');op.value=value;op.textContent=name;type.appendChild(op);
    }
    label('Wall height (blocks)');
    const height=input('3','number');height.min='1';height.max='6';height.step='1';
    type.addEventListener('change',()=>height.disabled=type.value!=='wall');
    make('p','Material: '+B.itemName(id)+'. Maximum 96 new blocks per operation. Existing blocks will not be overwritten.');
    button('Start selecting corners',()=>{
      toolState={kind:type.value,height:Math.min(6,Math.max(1,parseInt(height.value,10)||3)),id,world:game.world,start:null};
      third=false;close();refreshToolActions();
      // Collapse the More submenu so the mark button is easy to see on phones.
      setMoreMenu(false);
      notify(game,'Aim at a surface, then tap 📍 Mark 1 at the top.');
    });
    button('Cancel',close,true);
  }
  function aimBuildPoint(){
    const t=game.player.target;
    if(!t){notify(game,'Aim the + at a nearby ground block or wall.');return null;}
    const point={x:t.x+t.nx,y:t.y+t.ny,z:t.z+t.nz};
    if(![point.x,point.y,point.z].every(Number.isInteger)||point.y<1||point.y>=96){
      notify(game,'Choose a build point within the world.');return null;
    }
    return point;
  }
  function markToolPoint(){
    if(!toolState||toolState.world!==game.world||game.state!=='play')return;
    const point=aimBuildPoint();if(!point)return;
    if(!toolState.start){
      toolState.start=point;refreshToolActions();
      notify(game,'Corner 1 marked. Aim elsewhere and tap Mark 2 + Build.');
      return;
    }
    const a=toolState.start,b=point,locations=[];
    if(toolState.kind==='floor'){
      const loX=Math.min(a.x,b.x),hiX=Math.max(a.x,b.x),loZ=Math.min(a.z,b.z),hiZ=Math.max(a.z,b.z);
      for(let x=loX;x<=hiX;x++)for(let z=loZ;z<=hiZ;z++)locations.push([x,a.y,z]);
    }else{
      const axis=Math.abs(b.x-a.x)>=Math.abs(b.z-a.z)?'x':'z';
      const first=axis==='x'?a.x:a.z,last=axis==='x'?b.x:b.z,dir=first<=last?1:-1;
      for(let n=first;dir>0?n<=last:n>=last;n+=dir){
        for(let h=0;h<toolState.height;h++){
          locations.push(axis==='x'?[n,a.y+h,a.z]:[a.x,a.y+h,n]);
        }
      }
    }
    if(!locations.length||locations.length>96){
      notify(game,'Area is too large. Select a smaller wall or floor (96 blocks max).');return;
    }
    const world=game.world,id=toolState.id,changes=[];
    for(const [x,y,z] of locations){
      if(y<1||y>=96||!world.loaded(x,z)){notify(game,'The area is outside the loaded world. Move closer.');return;}
      const existing=world.getBlock(x,y,z);
      if(existing===id)continue;
      if(existing!==B.AIR){notify(game,'A block is already in the selected area. Clear it or choose another spot.');return;}
      const p=game.player;
      if(B.SOLID[id] && x+1>p.x-p.hw&&x<p.x+p.hw&&
          z+1>p.z-p.hw&&z<p.z+p.hw&&y+1>p.y&&y<p.y+p.h){
        notify(game,'Move outside the wall/floor area before building.');return;
      }
      changes.push([x,y,z,id]);
    }
    if(!changes.length){notify(game,'Those blocks already exist. Choose a different area.');return;}
    if(!game.player.creative && !game.player.held()?.flurryUnlimited){
      notify(game,'Smart tools require a Creative world or a block equipped from + ALL.');return;
    }
    const label=toolState.kind==='floor'?'Floor':'Wall';
    toolState=null;refreshToolActions();
    runBuildBatch(world,label,changes);
    game.ui.dirtyInv=true;
  }
  function runBuildBatch(world,label,changes){
    if(buildJob){notify(game,'Finish the current build first');return false;}
    if(!changes.length)return false;
    const job={world,label,changes,at:0,applied:[]};
    buildJob=job;
    progress.hidden=false;
    progressTitle.textContent='Building';
    progressFill.style.width='0%';
    progress.setAttribute('aria-valuenow','0');
    const budget=game.touchMode?10:24;
    const tick=()=>{
      if(buildJob!==job)return;
      if(game.world!==world||game.state!=='play'){
        buildJob=null;progress.hidden=true;return;
      }
      const end=Math.min(changes.length,job.at+budget);
      // A single block can trigger expensive lighting work. Limit by elapsed
      // time as well as count to avoid a visible freeze on giant blueprints.
      const deadline=performance.now()+(game.touchMode?2.5:4);
      while(job.at<end){
        const [x,y,z,id]=changes[job.at++];
        // Never overwrite terrain or a new edit made since preview.
        if(world.loaded(x,z)&&world.getBlock(x,y,z)===B.AIR&&world.setBlock(x,y,z,id)!==false)
          job.applied.push([x,y,z,B.AIR,id]);
        if(performance.now()>=deadline)break; // Always process at least one.
      }
      const pct=Math.round(100*job.at/changes.length);
      progressFill.style.width=pct+'%';
      progress.setAttribute('aria-valuenow',String(pct));
      if(job.at<changes.length){requestAnimationFrame(tick);return;}
      buildJob=null;progress.hidden=true;
      if(job.applied.length)editHistory.push(world,label,job.applied);
      const skipped=changes.length-job.applied.length;
      notify(game,'Placed '+job.applied.length+' blocks'+(skipped?' · '+skipped+' skipped':''));
    };
    requestAnimationFrame(tick);return true;
  }
  function restoreSafe(x,y,z,newId){
    if(!B.SOLID[newId])return true;
    const p=game.player;
    if(x+1>p.x-p.hw&&x<p.x+p.hw&&z+1>p.z-p.hw&&z<p.z+p.hw&&y+1>p.y&&y<p.y+p.h)
      return false;
    for(const m of game.mobs){
      if(!m.dead&&x+1>m.x-m.hw&&x<m.x+m.hw&&z+1>m.z-m.hw&&z<m.z+m.hw&&y+1>m.y&&y<m.y+m.h)
        return false;
    }
    return true;
  }
  function feedbackEdit(result,verb){
    if(result.ok){notify(game,verb+' '+result.count+' blocks');return;}
    const reason=result.reason;
    notify(game,reason==='empty'?'Nothing to '+verb.toLowerCase():
      reason==='blocked'?'Move away from the build first':
      reason==='changed'?'The area has changed. Cannot '+verb.toLowerCase():
      reason==='busy'?'Finish your current action first':
      'Cannot '+verb.toLowerCase()+' this build');
  }
  function undoSmartBuild(){
    if(buildJob){notify(game,'Finish building first');return;}
    feedbackEdit(editHistory.undo(game.world,restoreSafe),'Undid');
  }
  function redoLastEdit(){
    if(buildJob){notify(game,'Finish building first');return;}
    feedbackEdit(editHistory.redo(game.world,restoreSafe),'Redid');
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
    if(game.state!=='play'||!game.world){notify(game,'Enter a game world first.');return;}
    open('📦 Save a Building Blueprint');
    make('p','Select two opposite corners of your house. You decide which blocks belong in the blueprint, up to 32 blocks per side and 6,000 filled blocks.');
    make('p','How: Tap Start, aim your + at the first corner block and tap CAPTURE CORNER 1. Aim at the opposite corner (including roof) and tap CAPTURE CORNER 2.');
    make('p','Tip: To include the floor and roof, mark a bottom corner and a top corner. Only real blocks within those boundaries will be saved.');
    button('Start 2-corner selection',()=>{
      toolState=null;
      selectionState={world:game.world,start:null};
      third=false;close();refreshToolActions();
      setMoreMenu(false);
      notify(game,'Aim at the first block of your building, then tap CAPTURE CORNER 1.');
    });
    button('Cancel',close,true);
  }
  function markCapturePoint(){
    if(!selectionState||selectionState.world!==game.world||game.state!=='play')return;
    const t=game.player.target;
    if(!t){notify(game,'Aim directly at a block in your building.');return;}
    const point={x:t.x,y:t.y,z:t.z};
    if(!selectionState.start){
      selectionState.start=point;refreshToolActions();
      notify(game,'First corner saved. Aim at the opposite top corner.');
      return;
    }
    let selection;
    try{selection=selectionBounds(selectionState.start,point);}catch(e){notify(game,e.message);return;}
    selectionState=null;refreshToolActions();
    open('📦 Name your creation');
    make('p','Selected '+selection.size.join(' × ')+' blocks. Confirm the selection and save it as an editable building blueprint.');
    label('Creation name');const name=input('My winter house');
    label('Creator name');const author=input('Yeti Builder');
    button('Save + Download Blueprint',()=>captureBlueprint(selection,name.value,author.value));
    button('Cancel',close,true);
  }
  function captureBlueprint(selection,name,author){
    const world=game.world;
    const {min,size}=selection,blocks=[];
    const exclude=new Set([B.AIR,B.WATER,B.LAVA,B.BEDROCK,B.TALLGRASS]);
    for(let y=0;y<size[1];y++)for(let z=0;z<size[2];z++)for(let x=0;x<size[0];x++){
      const wx=min[0]+x, wy=min[1]+y, wz=min[2]+z;
      if(!world.loaded(wx,wz)){notify(game,'Part of your house is not loaded. Move closer to it and try again.');return;}
      const id=world.getBlock(wx,wy,wz);
      if(!exclude.has(id)&&B.BLOCKS[id])blocks.push([x,y,z,id]);
      if(blocks.length>MAX_BLOCKS){notify(game,'This selection contains over 6,000 filled blocks. Choose a smaller area.');return;}
    }
    if(!blocks.length){notify(game,'No building blocks found inside this selection.');return;}
    const blueprint=validateBlueprint({version:1,name,author,size,blocks});
    const status=creatorStudio.add(blueprint);
    // Do not interrupt a successful browser save with a surprise download.
    if(status==='full'||status==='storage')creatorStudio.download(blueprint);
    close();
    if(quest===3)complete();
    notify(game,status==='saved'?'Saved to My Builds':
      status==='exists'?'Already in My Builds':
      status==='full'?'Gallery full. Blueprint downloaded.':'Storage full. Blueprint downloaded.');
  }
  function clearPreview(){
    if(previewState){
      const {group}=previewState;
      game.scene.remove(group);
      group.traverse(obj=>{
        if(obj.geometry)obj.geometry.dispose();
        if(obj.material){if(Array.isArray(obj.material))obj.material.forEach(m=>m.dispose());else obj.material.dispose();}
      });
      previewState=null;
    }
    previewPanel.style.display='none';
  }
  function previewCoordinates(data,ox,oy,oz,turn){
    const [sx,sy,sz]=rotatedSize(data.size,turn);
    return {size:[sx,sy,sz],ox,oy,oz};
  }
  function checkPlacement(){
    if(!previewState||previewState.world!==game.world)return {ok:false,message:'World changed; cancel and reload.'};
    const {data,origin,turn}=previewState,w=game.world,p=game.player;
    const size=rotatedSize(data.size,turn);
    if(origin.y<1||origin.y+size[1]>96)return {ok:false,message:'Move the blueprint up/down to fit inside world height.'};
    for(const [x,y,z,id] of data.blocks){
      const [dx,dz]=rotateXZ(x,z,data.size,turn);
      const X=origin.x+dx,Y=origin.y+y,Z=origin.z+dz;
      if(!w.loaded(X,Z))return {ok:false,message:'Destination chunks are still loading. Move closer.'};
      if(w.getBlock(X,Y,Z)!==B.AIR)return {ok:false,message:'Destination obstructed. Move or lift the hologram.'};
      if(B.SOLID[id]&&X+1>p.x-p.hw&&X<p.x+p.hw&&
         Z+1>p.z-p.hw&&Z<p.z+p.hw&&Y+1>p.y&&Y<p.y+p.h){
        return {ok:false,message:'Move away from the blueprint before placing it.'};
      }
    }
    return {ok:true,message:'Clear area · '+data.blocks.length+' blocks ready to place'};
  }
  function refreshPreview(){
    if(!previewState)return;
    const s=previewState;
    let {data,turn,origin,ghost,bounds}=s;
    const size=rotatedSize(data.size,turn);
    s.group.position.set(origin.x,origin.y,origin.z);
    s.group.remove(bounds);
    bounds.geometry.dispose();
    bounds.material.dispose();
    const cube=new THREE.BoxGeometry(size[0],size[1],size[2]);
    const boxGeo=new THREE.EdgesGeometry(cube);
    cube.dispose();
    bounds=new THREE.LineSegments(boxGeo,new THREE.LineBasicMaterial({color:'#80eaff',transparent:true,opacity:.9,depthTest:false}));
    bounds.position.set(size[0]/2,size[1]/2,size[2]/2);
    bounds.renderOrder=19;
    s.group.add(bounds);s.bounds=bounds;
    const obj=new THREE.Object3D();
    const stride=Math.max(1,Math.ceil(data.blocks.length/650));
    let placed=0;
    for(let i=0;i<data.blocks.length&&placed<ghost.count;i+=stride){
      const [x,y,z,id]=data.blocks[i], [dx,dz]=rotateXZ(x,z,data.size,turn);
      obj.position.set(dx+.5,y+.5,dz+.5);obj.scale.set(.90,.90,.90);obj.updateMatrix();
      ghost.setMatrixAt(placed,obj.matrix);
      const name=(B.BLOCKS[id]?.name||'').toLowerCase();
      const color=name.includes('glass')||name.includes('ice')?'#86dfff':
        name.includes('snow')||name.includes('wool')?'#edfaff':
        name.includes('stone')||name.includes('brick')?'#c2cada':
        name.includes('wood')||name.includes('spruce')||name.includes('plank')||name.includes('log')?'#c7996b':'#8fdcc0';
      ghost.setColorAt(placed,new THREE.Color(color));
      placed++;
    }
    ghost.count=placed;ghost.instanceMatrix.needsUpdate=true;
    if(ghost.instanceColor)ghost.instanceColor.needsUpdate=true;
    const valid=checkPlacement();
    previewStatus.textContent=valid.message+' · Rotation '+(turn*90)+'°';
    installButton.disabled=!valid.ok;
    bounds.material.color.set(valid.ok?'#8bf8ce':'#ff9caa');
    previewPanel.style.display='block';
  }
  function startPreview(candidate,verifyOwnership=null){
    let data;
    try{data=validateBlueprint(candidate);}catch(e){notify(game,'Invalid blueprint: '+e.message);return;}
    if(game.state!=='play'||!game.world){notify(game,'Enter a world before importing.');return;}
    clearPreview();close();
    const p=game.player;
    const dx=Math.round(-Math.sin(p.yaw)*11),dz=Math.round(-Math.cos(p.yaw)*11);
    const origin={x:Math.floor(p.x)+dx-Math.floor(data.size[0]/2),y:Math.floor(p.y),z:Math.floor(p.z)+dz-Math.floor(data.size[2]/2)};
    const group=new THREE.Group();group.name='FlurryCraft Blueprint Hologram';
    const maxInstances=Math.min(650,data.blocks.length);
    const ghost=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),
      new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.38,depthWrite:false,depthTest:false,fog:false}),maxInstances);
    ghost.count=maxInstances;ghost.frustumCulled=false;ghost.renderOrder=17;
    group.add(ghost);game.scene.add(group);
    const bounds=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1,1,1)),
      new THREE.LineBasicMaterial({color:'#8bf8ce',depthTest:false,transparent:true,opacity:.9}));
    group.add(bounds);
    previewState={world:game.world,data,turn:0,origin,group,ghost,bounds,verifyOwnership};
    previewName.textContent='📐 '+data.name;
    third=false;
    setMoreMenu(false);
    if(!snapPreviewToTerrain(true))refreshPreview();
    notify(game,'Blueprint preview: rotate, move or snap to the ground, then tap Place.');
  }
  function snapPreviewToTerrain(initial=false) {
    if(!previewState||previewState.world!==game.world)return false;
    const {data,origin,turn,world}=previewState;
    const [sx,sy,sz]=rotatedSize(data.size,turn);
    let highest=1;
    for(let x=0;x<sx;x++)for(let z=0;z<sz;z++){
      const wx=origin.x+x,wz=origin.z+z;
      if(!world.loaded(wx,wz)) {
        if(!initial)notify(game,'Move closer to the target area so the terrain can load.');
        return false;
      }
      // Scan the actual edited world, including snow, existing buildings and trees.
      // This action never deletes terrain; it only lifts the hologram above it.
      for(let y=94;y>=0;y--){
        const id=world.getBlock(wx,y,wz);
        if(id!==B.AIR && B.SOLID[id]){highest=Math.max(highest,y+1);break;}
      }
    }
    origin.y=Math.min(96-sy,highest);
    refreshPreview();
    if(!initial)notify(game,'Blueprint moved above the highest surface in this area.');
    return true;
  }
  function shiftPreview(dx=0,dy=0,dz=0,rotate=0){
    if(!previewState)return;
    if(rotate)previewState.turn=(previewState.turn+rotate)%4;
    previewState.origin.x+=dx;
    previewState.origin.y+=dy;
    previewState.origin.z+=dz;
    refreshPreview();
  }
  async function installBlueprint(){
    if(!previewState||previewState.installing||buildJob)return;
    const s=previewState;
    s.installing=true;
    const valid=checkPlacement();
    if(!valid.ok){s.installing=false;notify(game,valid.message);return;}
    if(s.verifyOwnership){
      installButton.disabled=true;
      notify(game,'Verifying current NFT ownership on Sui Testnet…');
      try{
        await s.verifyOwnership();
        if(previewState!==s)return;
      }catch(err){
        s.installing=false;
        if(previewState===s)refreshPreview();
        notify(game,'NFT ownership check failed: '+err.message);
        return;
      }
    }
    const renewed=checkPlacement();
    if(!renewed.ok){s.installing=false;notify(game,renewed.message);return;}
    const world=s.world,data=s.data;
    const moves=data.blocks.map(([x,y,z,id])=>{
      const [dx,dz]=rotateXZ(x,z,data.size,s.turn);
      return [s.origin.x+dx,s.origin.y+y,s.origin.z+dz,id];
    });
    clearPreview();
    // All 3D placements share the same smooth, bounded-frame builder.
    // One finished operation is one Undo step (and can be redone).
    runBuildBatch(world,'Install '+data.name,moves);
  }
  function chooseImport(){creatorStudio.open();}
  function onWorldReady(isNew){
    const p=game.player,w=game.world;
    toolState=null;selectionState=null;buildJob=null;progress.hidden=true;editHistory.reset(w);clearPreview();refreshToolActions();
    explorer.reset();
    judgeTour.close();
    game.adventure.resetWorld(isNew);
    // A fresh guided tour showcases the snowy scenery instead of opening in
    // a grey whiteout. Existing player weather preferences remain untouched.
    winterMode=game.weather.setMode(game.isJudgeDemo?'calm':
      read('flurrycraft_winter_weather_v1','snowfall'));
    weatherButton.textContent='Weather: '+weatherProfile(winterMode).label;
    equipStarterBlocks();
    // New survival players should be able to defeat their first Frostling
    // without crafting for several minutes or using bare-hand melee.
    if(isNew&&!p.creative&&!p.inv.some(it=>it?.id===B.toolId(3,0))){
      const swordSlot=p.inv.findIndex(it=>!it);
      if(swordSlot>=0){
        p.inv[swordSlot]={id:B.toolId(3,0),n:1};
        game.adventure?.markStarterSword();
        p.sel=swordSlot<9?swordSlot:p.sel;
        game.ui.dirtyInv=true;
      }
    }
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
    if(isNew&&game.isJudgeDemo){
      // Point towards the real Lofi guide before enabling navigation.
      const dx=npcPosition.x-p.x,dz=npcPosition.z-p.z;
      p.yaw=Math.atan2(-dx,-dz);
      p.pitch=0;
    }
    if(isNew)notify(game,'❄️ Welcome! Meet Lofi by the starter shack.');
  }
  function updatePlacementGhost(isPlaying){
    placementGhost.visible=false;
    if(!isPlaying||third||previewState||selectionState||toolState||game.ui.isOpen||overlay.style.display==='flex')return;
    const p=game.player,world=game.world,t=p.target,held=p.held();
    if(!world||!t||!held||!B.ITEMS[held.id]?.block||!B.BLOCKS[held.id])return;
    if(!p.sneaking&&p.isUsable(t.block))return;
    const shape=B.SHAPE[held.id];
    if(shape===1||shape===2||shape===3||held.id===B.TORCH)return;
    const x=t.x+t.nx,y=t.y+t.ny,z=t.z+t.nz;
    if(y<1||y>=96||!world.loaded(x,z))return;
    const old=world.getBlock(x,y,z);
    if(old!==B.AIR&&old!==B.WATER&&old!==B.LAVA&&B.SHAPE[old]!==1)return;
    if(B.SOLID[held.id]){
      if(x+1>p.x-p.hw&&x<p.x+p.hw&&z+1>p.z-p.hw&&z<p.z+p.hw&&y+1>p.y&&y<p.y+p.h)return;
      for(const m of game.mobs){
        if(!m.dead&&x+1>m.x-m.hw&&x<m.x+m.hw&&z+1>m.z-m.hw&&z<m.z+m.hw&&y+1>m.y&&y<m.y+m.h)return;
      }
    }
    placementGhost.position.set(x+.5,y+.5,z+.5);
    placementGhost.visible=true;
  }
  function update(dt) {
    judgeTour.update();
    game.adventure.update(dt);
    game.rewards?.update?.(dt);
    explorer.update(dt);
    const isPlaying=game.state==='play' && !game.paused;
    actions.style.display=isPlaying&&!game.ui.isOpen&&!previewState&&overlay.style.display!=='flex'?'flex':'none';
    if(!isPlaying||game.ui.isOpen||previewState)setMoreMenu(false);
    questView.style.display=isPlaying&&questVisible&&overlay.style.display!=='flex'?'block':'none';
    helpView.style.display=isPlaying&&!game.ui.isOpen&&overlay.style.display!=='flex'&&!!(toolState||selectionState)?'block':'none';
    if(isPlaying){
      const id=game.player.held()?.id;
      const text=previewState ? '📐 Move / rotate hologram → tap Place when green' : selectionState ? (selectionState.start ? '📦 Aim at opposite top block → CAPTURE CORNER 2' : '📦 Aim at first block → CAPTURE CORNER 1') : toolState ? (toolState.start ?
        '📐 Aim at second corner → tap MARK 2 + BUILD' :
        '📐 Aim at first corner → tap MARK 1') :
        (id&&B.ITEMS[id] ? B.itemName(id)+' · PLACE □' : 'Tap + ALL on the bottom bar to choose a block');
      if(helpView.textContent!==text)helpView.textContent=text;
    }
    if(!isPlaying){avatar.group.visible=false;discardAvatarSword();placementGhost.visible=false;return;}
    updatePlacementGhost(isPlaying);
    const p=game.player;
    avatar.group.visible=third&&!p.dead;
    syncAvatarSword();
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
      // The guide should look at the player during the official demo,
      // rather than presenting its back to the judge.
      lofi.group.rotation.y=game.isJudgeDemo
        ?Math.atan2(-(p.x-npcPosition.x),-(p.z-npcPosition.z))
        :lofi.group.rotation.y+dt*.28;
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
    if(editHistory.applying||game.state!=='play'||quest!==2||oldId!==B.AIR||newId===B.AIR)return;
    const p=game.player;
    if(Math.hypot(x-p.x,y-p.y,z-p.z)<7)placed++;
  };
  const recordChange=(world,x,y,z,oldId,newId)=>editHistory.record(world,x,y,z,oldId,newId);
  // Capture precisely the edits resulting from each interaction. Natural
  // terrain generation and simulation run outside transactions, so they aren't
  // mistakenly added to Undo.
  const nativeRightAction=game.player.rightAction;
  game.player.rightAction=function(...args){
    if(buildJob)return false;
    const tracked=this.creative||!!this.held()?.flurryUnlimited;
    if(!tracked||!game.world)return nativeRightAction.apply(this,args);
    const started=editHistory.begin(game.world,'Place');
    try{return nativeRightAction.apply(this,args);}
    finally{if(started)editHistory.finish();}
  };
  const nativeBreakBlock=game.player.breakBlock;
  game.player.breakBlock=function(...args){
    if(buildJob)return false;
    if(!this.creative||!game.world)return nativeBreakBlock.apply(this,args);
    const started=editHistory.begin(game.world,'Mine');
    try{return nativeBreakBlock.apply(this,args);}
    finally{if(started)editHistory.finish();}
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
  game.flurry={update,onWorldReady,countPlayerPlacement,recordChange,isApplyingEdit:()=>editHistory.applying,buildInProgress:()=>!!buildJob,isThird:()=>third,daylightLocked:()=>brightWorld,openBlockLibrary:showBuildMenu,openCreatorStudio:()=>creatorStudio.open(),openMarketplace:()=>suiMarket.open(),startJudgeTour:()=>judgeTour.start(),showSmartBuilder,undoEdit:undoSmartBuild,redoEdit:redoLastEdit};
  document.addEventListener('keydown', e=>{
    if(e.target && /INPUT|TEXTAREA/.test(e.target.tagName))return;
    if(e.code==='Escape' && overlay.style.display==='flex'){close();e.stopImmediatePropagation();return;}
    if(e.code==='Escape'&&!menu.hidden){setMoreMenu(false);e.stopImmediatePropagation();return;}
    if((e.ctrlKey||e.metaKey)&&e.code==='KeyZ'&&game.state==='play'&&!game.ui.isOpen&&!game.paused){
      e.preventDefault();
      if(e.shiftKey)redoLastEdit();else undoSmartBuild();
      return;
    }
    if((e.ctrlKey||e.metaKey)&&e.code==='KeyY'&&game.state==='play'&&!game.ui.isOpen&&!game.paused){
      e.preventDefault();redoLastEdit();return;
    }
    if(game.state!=='play'||game.ui.isOpen||game.paused)return;
    if(e.code==='KeyV'){third=!third;notify(game,third?'Third-person camera':'First-person camera');}
    if(e.code==='KeyB')showBlueprint();
    if(e.code==='KeyEscape' && previewState)clearPreview();
    // G is reserved for Sword Guard; N opens the building catalog.
    if(e.code==='KeyN')showBuildMenu();
  });
}
