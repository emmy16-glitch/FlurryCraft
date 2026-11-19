// FlurryCraft Explorer Map. Offline procedural terrain, world-specific places.
// No geolocation or remote tiles. The tiny minimap renders on movement, not every frame.
import {
 MAP_CELLS,MAP_STEPS,MAX_PLACES,mapToWorld,worldToMap,directionTo,
 markerKey,cleanPlace,sanitizePlaces,winterMapColor,dungeonChapterProgress
} from './explorer-map-core.js';
import {discoveredDungeons,nearbyMonsterMarkers,mapMarkerAt} from './map-discoveries.js';

export function initExplorerMap({game,panel,openDialog,closeDialog,notify,dialogOpen,isBlocked=()=>false}){
  let places={home:null,marks:[]},active=null,loadedWorld=null;
  let zoom=1,renderToken=0,mapOpened=false,renderClock=0;
  let mapRefreshTick=0,refreshOpenMap=null;
  const dungeonPins=()=>discoveredDungeons(game.adventure?.serialize?.());
  const journalPins=()=>game.journal?.mapPlaces?.()||[];
  const nearbyLandmarks=()=>game.landmarks?.nearby?.()||[];
  const visitedLandmarks=()=>game.landmarks?.visited?.()||[];
  const explorationPins=()=>game.exploration?.mapPlaces?.()||[];
  const expeditionSnapshot=()=>game.rewards?.current?.()||null;
  let mapFilter='all';
  const monsterPins=()=>nearbyMonsterMarkers(game.mobs,game.player);
  const MINI_SIZE=120, MINI_SAMPLES=48, MINI_STEP=2, MINI_RADIUS=MINI_SAMPLES*4;
  let miniTerrain=null,miniCenter=null,miniTimer=0,miniJob=0,miniDrawing=null;
  let miniFirstDraw=true;
  const $=(tag,text,parent)=>{
    const e=document.createElement(tag);
    if(text!==undefined)e.textContent=text;
    if(parent)parent.appendChild(e);
    return e;
  };
  const button=(parent,text,fn,className='')=>{
    const b=$('button',text,parent);b.type='button';b.className=className;
    b.addEventListener('click',fn);return b;
  };
  const pos=()=>({x:Math.floor(game.player.x),z:Math.floor(game.player.z)});
  const worldKey=()=>markerKey(game.worldId||'seed_'+String(game.world?.seed||0));
  function load(){
    let value;
    try{value=JSON.parse(localStorage.getItem(worldKey())||'{}');}catch{value={};}
    places=sanitizePlaces(value);
    loadedWorld=game.world;
    active=null;
    miniCenter=null;miniTerrain=null;miniJob++;miniDrawing=false;miniFirstDraw=true;miniTimer=0;
  }
  function persist(next){
    const cleaned=sanitizePlaces(next);
    try{
      localStorage.setItem(worldKey(),JSON.stringify(cleaned));
      places=cleaned;return true;
    }catch{
      notify(game,'Cannot save places. Browser storage may be full.');
      return false;
    }
  }
  function ensureWorld(){
    if(game.world!==loadedWorld)load();
  }
  function startNavigation(place){
    const clean=cleanPlace(place);
    if(!clean)return;
    active=clean;
    closeDialog();mapOpened=false;refreshOpenMap=null;renderToken++;
    notify(game,'Following '+clean.name);
    updateNavigation();drawMini();
  }
  function stopNavigation(){
    active=null;nav.hidden=true;drawMini();
  }
  function updateNavigation(){
    if(!active||game.state!=='play'||game.paused||dialogOpen()||isBlocked()||game.ui?.isOpen){
      nav.hidden=true;return;
    }
    const bearing=directionTo(game.player.x,game.player.z,active.x,active.z,game.player.yaw);
    const turn=Math.abs(bearing.angle)>2.5?'Behind':
      bearing.angle<-.22?'Right':bearing.angle>.22?'Left':'Ahead';
    navArrow.style.transform='rotate('+bearing.angle+'rad)';
    navTitle.textContent=active.name;
    navDistance.textContent=bearing.distance+' blocks · '+turn;
    nav.setAttribute('aria-label','Guiding to '+active.name+', '+bearing.distance+' blocks, '+turn);
    nav.hidden=false;
  }
  const style=$('style');
  style.textContent=[
    '#flurryModal .fPanel.fc-map-panel{width:min(760px,96vw);height:calc(100dvh - 24px);max-height:calc(100dvh - 24px);overflow:hidden;display:flex;flex-direction:column}',
    '#flurryModal .fc-map-layout{flex:1;min-height:0;overflow:hidden}',
    '#flurryModal .fc-map-layout>section{min-height:0;overflow-y:auto;overscroll-behavior:contain}',
    '#flurryModal .fc-map-layout .fc-map-side{position:relative;z-index:10;max-height:min(68dvh,560px);overflow:hidden;pointer-events:auto;display:flex;flex-direction:column}',
    '.fc-map-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(180px,.72fr);gap:14px;align-items:start}',
    '.fc-map-toolbar{display:flex;align-items:center;justify-content:space-between;gap:6px;margin:0 0 7px}',
    '#flurryModal .fc-map-toolbar button{min-width:36px;min-height:36px;margin:0;padding:7px 12px;background:#254f65;border:1px solid #4d7d92;border-radius:10px}',
    '.fc-map-zoom{display:flex;align-items:center;gap:6px}',
    '.fc-map-frame{position:relative;overflow:hidden;border:1px solid #6098b1;border-radius:15px;background:#193e54;aspect-ratio:1/1;box-shadow:inset 0 0 0 1px #123549}',
    '.fc-map-frame canvas{display:block;width:100%;height:100%;image-rendering:pixelated;cursor:crosshair;touch-action:manipulation}',
    '.fc-map-wait{position:absolute;inset:auto 11px 11px auto;background:#0b2a3dcc;border:1px solid #5b8ea2;border-radius:7px;color:#b9e9f5;font:700 10px system-ui;padding:5px 7px;pointer-events:none}',
    '.fc-map-wait[hidden]{display:none!important}',
    '.fc-map-caption{display:flex;justify-content:space-between;color:#91bccc;font:600 10px system-ui;margin:6px 2px 0;gap:6px}',
    '.fc-map-side h3{font:800 13px system-ui;color:#f0faff;margin:0 0 9px;letter-spacing:0}',
    '.fc-map-pin-list{display:flex;flex:1;min-height:0;flex-direction:column;gap:7px;overflow-y:auto;overscroll-behavior:contain;padding:2px 3px 8px 0;scrollbar-width:thin}',
    // Keep sidebar actions inside the dialog hit area at desktop and mobile
    // sizes. Otherwise the modal backdrop catches taps on lower Pin buttons.
    '.fc-map-side{display:flex;flex-direction:column;min-height:0;max-height:min(68dvh,560px);overflow:hidden;overscroll-behavior:contain;padding-right:5px;scrollbar-width:thin}',
    '@media(max-height:520px){#flurryModal .fc-map-layout .fc-map-side{max-height:calc(100dvh - 94px)}.fc-map-frame{width:min(100%,min(280px,64dvh));margin:auto}.fc-map-toolbar{gap:4px}.fc-map-caption{font-size:9px}.fc-map-pin{padding:5px}.fc-map-filterbar{padding:4px 1px 6px}#fcNavBeacon{top:calc(env(safe-area-inset-top) + 100px);max-width:64vw}}',
    '.fc-map-pin{display:flex;align-items:center;gap:7px;background:#163e55;border:1px solid #416d83;border-radius:11px;padding:8px}',
    '.fc-map-pin-icon{width:30px;height:30px;flex:none;border-radius:8px;background:#274f64;display:grid;place-items:center;color:#d2f2fb;font:700 15px system-ui}',
    '.fc-map-pin-main{flex:1;min-width:0}',
    '.fc-map-pin-main strong{display:block;color:#eef9fc;font:750 12px system-ui;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.fc-map-pin-main small{color:#9dc4d5;font:600 10px system-ui}',
    '#flurryModal .fc-map-pin button{flex:none;margin:0;padding:7px 8px;border:0;background:#2b657c;border-radius:8px;color:#def9ff;font:750 11px system-ui}',
    '#flurryModal .fc-map-pin button.fc-delete{background:transparent;color:#a5c6d5;border:1px solid #476678;padding:5px 7px}',
    '.fc-map-side .fc-map-divider{margin:12px 0;border:0;border-top:1px solid #315971}',
    '#flurryModal button.fc-map-home{width:100%;margin:0 0 9px;background:#92e7f5;color:#092f42;border-color:#baf3fa;border-radius:10px;min-height:41px}',
    '.fc-map-chooser{display:none;margin-top:9px;padding:11px;background:#14384d;border:1px solid #416e87;border-radius:12px}',
    '.fc-map-chooser.is-visible{display:block}',
    '.fc-map-chooser strong{display:block;color:#eff9fc;font:750 12px system-ui;margin-bottom:7px}',
    '#flurryModal .fc-map-chooser input{width:100%;padding:9px;font-size:13px;margin:0}',
    '.fc-map-chooser-buttons{display:flex;gap:6px}',
    '#flurryModal .fc-map-chooser-buttons button{margin:8px 0 0;flex:1;padding:9px;border-radius:9px}',
    '.fc-map-empty{font:600 12px/1.5 system-ui;color:#99bfcd;padding:11px 0}',
    '.fc-map-legend{margin:8px 2px;font:700 10px/1.5 system-ui;color:#b9dce9}',
    '.fc-map-legend .fc-dungeon-dot{color:#ffd48a}.fc-map-legend .fc-monster-dot{color:#ff989d}.fc-map-legend .fc-pin-dot{color:#c5f6e5}',
    '.fc-map-group{font:850 10px system-ui;letter-spacing:.11em;color:#a5ddeb;margin:12px 0 6px}',
    '#flurryModal .fc-map-pin button.fc-map-pin-save{background:transparent;color:#bfeff8;border:1px solid #47768e}',
    '.fc-map-pin.is-monster{border-color:#a36770}.fc-map-pin.is-dungeon{border-color:#a98d5a}.fc-map-pin.is-discovery{border-color:#60a8c1}.fc-map-pin.is-landmark{border-color:#65b6c8}',
    '.fc-map-pin.is-cave{border-color:#82c9e2}.fc-map-pin.is-crypt{border-color:#a994d2}.fc-map-pin.is-treasure{border-color:#d8b56c}.fc-map-pin.is-territory{border-color:#c47782}',
    '.fc-map-filterbar{position:sticky;top:0;z-index:12;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));flex:none;gap:5px;overflow:visible;padding:6px 1px 8px;background:#102e43;border-bottom:1px solid #315d72;pointer-events:auto}',
    '#flurryModal .fc-map-filterbar button{position:relative;z-index:8;flex:none;min-height:31px;margin:0;padding:6px 9px;border:1px solid #46758b;border-radius:9px;background:#1a435a;color:#c7e8f1;font:750 10px system-ui;pointer-events:auto;touch-action:manipulation}',
    '#flurryModal .fc-map-filterbar button[aria-pressed="true"]{background:#8ce4f0;color:#0a3549;border-color:#baf4fc}',
    '.fc-map-filter-count{display:inline-grid;place-items:center;min-width:16px;height:16px;margin-left:3px;padding:0 3px;border-radius:8px;background:#0b3045;color:#d5f5fc;font:850 9px system-ui}',
    '#flurryModal .fc-map-filterbar button[aria-pressed="true"] .fc-map-filter-count{background:#d2faff;color:#0a3549}',
    '.fc-map-objective{flex:none;border:1px solid #6eb6ca;border-radius:12px;padding:10px;background:#123d53;margin:4px 0 8px}',
    '.fc-map-objective strong{display:block;color:#a9f0fb;font:850 10px/1.4 system-ui;letter-spacing:.08em}',
    '.fc-map-objective p{color:#e8f8fc;font:750 12px/1.4 system-ui;margin:5px 0}',
    '.fc-map-objective small{display:block;color:#b1d3e0;font:600 10px/1.4 system-ui}',
    '.fc-map-objective .fc-map-objective-meter{height:6px;background:#244b60;border-radius:5px;overflow:hidden;margin:8px 0}',
    '.fc-map-objective .fc-map-objective-meter i{display:block;height:100%;background:#8be5f2}',
    '.fc-map-objective .fc-map-objective-actions{display:flex;gap:6px;flex-wrap:wrap}',
    '#flurryModal .fc-map-objective .fc-map-objective-actions button{margin:0;min-height:34px;padding:6px 9px}',
    '.fc-map-chapter{border-style:dashed;background:#13384d}',
    '.fc-map-chapter.is-locked{opacity:.78;border-color:#526a78}',
    '.fc-map-discovery-summary{font:650 10px/1.45 system-ui;color:#9dc6d5;margin:0 0 7px;padding:7px 8px;border:1px solid #315c73;border-radius:9px;background:#10364b}',
    '#fcNavBeacon{position:fixed;top:calc(env(safe-area-inset-top) + 110px);left:50%;right:auto;transform:translateX(-50%);z-index:24;display:flex;align-items:center;gap:7px;width:max-content;max-width:min(300px,58vw);padding:7px 9px;border:1px solid #4e96b0;border-radius:13px;color:#e9fbff;background:#0b3044ed;box-shadow:0 5px 20px #001a2a80;backdrop-filter:blur(9px);font:700 11px system-ui;pointer-events:auto}',
    '#fcNavBeacon[hidden]{display:none!important}',
    '#fcNavBeacon .fc-nav-arrow{font:900 27px/1 system-ui;color:#8ae7ef;display:block;transform-origin:50% 50%;width:26px;text-align:center}',
    '#fcNavBeacon .fc-nav-text{min-width:0;max-width:120px}',
    '#fcNavBeacon .fc-nav-text strong{display:block;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font:750 11px system-ui}',
    '#fcNavBeacon .fc-nav-text small{color:#afd3df;font:600 10px system-ui}',
    '#fcNavBeacon .fc-nav-stop{border:0;background:#245069;color:#d4f4fa;min-width:30px;height:30px;border-radius:8px;font:800 13px system-ui}',
    '#fcMiniMap{position:fixed;top:10px;right:10px;z-index:27;width:110px;display:none;flex-direction:column;gap:0;overflow:hidden;padding:4px;background:rgba(8,32,46,.91);border:1px solid #6b9db1;border-radius:14px;box-shadow:0 5px 24px #001d2c8c;backdrop-filter:blur(6px);cursor:pointer;touch-action:manipulation;pointer-events:auto;transition:border-color .18s ease}',
    '#fcMiniMap:active{border-color:#a6edfc}',
    '#fcMiniMap:focus-visible{outline:2px solid #a5efff;outline-offset:2px}',
    '#fcMiniMap canvas{width:100%;height:auto;aspect-ratio:1;display:block;border-radius:10px;background:#254e61;image-rendering:pixelated;pointer-events:none}',
    '#fcMiniMap .fc-mini-label{display:block;color:#d4eff7;font:750 10px/1.4 system-ui;max-width:100%;text-overflow:ellipsis;white-space:nowrap;overflow:hidden;text-align:center;padding:4px 1px 1px;pointer-events:none}',
    '#fcMiniMap .fc-mini-label[data-guiding="true"]{color:#a2f6d2}',
    'body.touch #fcMiniMap{top:max(76px,calc(env(safe-area-inset-top) + 72px));right:112px;width:98px}',
    '@media(max-height:520px){body.touch #fcMiniMap{top:max(73px,calc(env(safe-area-inset-top) + 68px));width:90px;right:112px}#fcMiniMap{width:98px}}',
    '@media(max-width:570px){.fc-map-layout{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr)}.fc-map-frame{width:min(100%,min(270px,32dvh));margin:auto}#flurryModal .fc-map-layout .fc-map-side{max-height:40dvh;padding:4px 0}.fc-map-pin{padding:6px}.fc-map-filterbar{margin:0 -2px;grid-template-columns:repeat(3,minmax(0,1fr))}}',
    '@media(max-height:500px){#flurryModal .fPanel.fc-map-panel{padding:9px}.fc-map-layout{gap:8px}.fc-map-frame{max-height:62dvh;width:100%;max-width:300px;margin:auto}.fc-map-side .fc-map-pin-list{max-height:170px;overflow:auto}#fcNavBeacon{top:51px;right:5px;padding:5px 6px}}'
  ].join('\n');
  document.head.appendChild(style);

  const nav=$('div');nav.id='fcNavBeacon';nav.hidden=true;
  const navArrow=$('span','↑',nav);navArrow.className='fc-nav-arrow';
  const navText=$('div',undefined,nav);navText.className='fc-nav-text';
  const navTitle=$('strong','',navText),navDistance=$('small','',navText);
  const stop=button(nav,'✕',stopNavigation,'fc-nav-stop');stop.setAttribute('aria-label','Stop navigation');
  document.body.appendChild(nav);
  // Mini navigator is one tap-target above the game, just below touch
  // Inventory/Pause controls. No additional draggable widgets.
  const mini=$('button');mini.id='fcMiniMap';mini.type='button';
  mini.setAttribute('aria-label','Expand world map');
  mini.setAttribute('title','Open World Map');
  const miniCanvas=$('canvas',undefined,mini);miniCanvas.width=miniCanvas.height=MINI_SIZE;
  const miniLabel=$('span','Map',mini);miniLabel.className='fc-mini-label';
  mini.addEventListener('pointerdown',e=>e.stopPropagation());
  mini.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openMap();});
  document.body.appendChild(mini);
  const miniCtx=miniCanvas.getContext('2d',{alpha:false});
  const miniCache=$('canvas');miniCache.width=miniCache.height=MINI_SIZE;
  const miniCacheCtx=miniCache.getContext('2d',{alpha:false});
  const miniWork=$('canvas');miniWork.width=miniWork.height=MINI_SIZE;
  const miniWorkCtx=miniWork.getContext('2d',{alpha:false});

  function drawMini(){
    if(!miniTerrain||!miniCenter||!miniCtx)return;
    miniCtx.drawImage(miniCache,0,0);
    const me=pos(),side=MINI_SIZE;
    const coord=(x,z)=>worldToMap(x,z,miniCenter.x,miniCenter.z,MINI_STEP,side);
    const player=coord(me.x,me.z);
    if(active){
      const dest=coord(active.x,active.z);
      const dx=dest.x-player.x,dz=dest.y-player.y;
      const magnitude=Math.hypot(dx,dz)||1;
      const maxDist=(side*.5)-8;
      const factor=Math.min(1,maxDist/magnitude);
      const ax=player.x+dx*factor,ay=player.y+dz*factor;
      miniCtx.beginPath();miniCtx.moveTo(player.x,player.y);miniCtx.lineTo(ax,ay);
      miniCtx.lineWidth=2;miniCtx.strokeStyle='#f5ca7c';
      miniCtx.setLineDash([3,3]);miniCtx.stroke();miniCtx.setLineDash([]);
      // Destination marker remains on the map edge when it's far away.
      miniCtx.save();miniCtx.translate(ax,ay);
      if(factor<1){
        miniCtx.rotate(Math.atan2(dz,dx)+Math.PI/2);
        miniCtx.fillStyle='#ffda89';miniCtx.beginPath();
        miniCtx.moveTo(0,-5);miniCtx.lineTo(4,4);miniCtx.lineTo(-4,4);miniCtx.closePath();
        miniCtx.fill();
      }else{
        miniCtx.fillStyle='#ffda89';miniCtx.beginPath();miniCtx.arc(0,0,4,0,Math.PI*2);miniCtx.fill();
      }
      miniCtx.restore();
    }
    const home=places.home;
    if(home){
      const p=coord(home.x,home.z);
      if(p.x>5&&p.x<side-5&&p.y>5&&p.y<side-5){
        miniCtx.beginPath();miniCtx.arc(p.x,p.y,3,0,Math.PI*2);
        miniCtx.fillStyle='#9ef8ce';miniCtx.fill();
      }
    }
    // Dungeon sites exist only once Adventure has actually discovered them.
    for(const marker of dungeonPins()){
      const p=coord(marker.x,marker.z);
      if(p.x>4&&p.x<side-4&&p.y>4&&p.y<side-4){
        miniCtx.fillStyle='#ffdf8d';miniCtx.fillRect(p.x-3,p.y-3,6,6);
        miniCtx.fillStyle='#594020';miniCtx.fillRect(p.x-1,p.y-1,2,2);
      }
    }
    // Recorded discoveries stay world-specific and bounded to eighteen pins.
    for(const marker of journalPins()){
      const p=coord(marker.x,marker.z);
      if(p.x>4&&p.x<side-4&&p.y>4&&p.y<side-4){
        miniCtx.fillStyle=marker.kind==='dungeon'?'#f2ca91':'#acfcf3';
        miniCtx.beginPath();miniCtx.arc(p.x,p.y,2.4,0,Math.PI*2);miniCtx.fill();
      }
    }
    // Deterministic visible winter sites (not discovered/claimed until inspected).
    for(const marker of nearbyLandmarks()){
      const p=coord(marker.x,marker.z);
      if(p.x>4&&p.x<side-4&&p.y>4&&p.y<side-4){
        miniCtx.fillStyle='#8ceeff';miniCtx.fillRect(p.x-2.5,p.y-2.5,5,5);
      }
    }
    for(const marker of explorationPins()){
      const p=coord(marker.x,marker.z);
      if(p.x<=4||p.x>=side-4||p.y<=4||p.y>=side-4)continue;
      miniCtx.fillStyle=marker.kind==='cave'?'#9be8ff':
        marker.kind==='crypt'?'#c8b4f1':marker.kind==='treasure'?'#ffdc85':'#ff929c';
      if(marker.kind==='territory'&&marker.radius){
        miniCtx.beginPath();miniCtx.arc(p.x,p.y,Math.max(4,marker.radius/(MINI_STEP*MAP_CELLS)*side),0,Math.PI*2);
        miniCtx.strokeStyle='#ff9aa080';miniCtx.lineWidth=1;miniCtx.stroke();
      }
      miniCtx.beginPath();miniCtx.arc(p.x,p.y,2.8,0,Math.PI*2);miniCtx.fill();
    }
    // Only currently loaded nearby monsters, capped at twelve per draw.
    for(const marker of monsterPins()){
      const p=coord(marker.x,marker.z);
      if(p.x>4&&p.x<side-4&&p.y>4&&p.y<side-4){
        miniCtx.fillStyle='#fa888c';
        miniCtx.beginPath();miniCtx.arc(p.x,p.y,3,0,Math.PI*2);miniCtx.fill();
      }
    }
    for(const mark of places.marks){
      const p=coord(mark.x,mark.z);
      if(p.x>5&&p.x<side-5&&p.y>5&&p.y<side-5){
        miniCtx.beginPath();miniCtx.arc(p.x,p.y,2.5,0,Math.PI*2);
        miniCtx.fillStyle='#ffe3a4';miniCtx.fill();
      }
    }
    miniCtx.save();miniCtx.translate(player.x,player.y);miniCtx.rotate(-game.player.yaw);
    miniCtx.lineWidth=2;miniCtx.strokeStyle='#073348';miniCtx.fillStyle='#70e6ff';
    miniCtx.beginPath();miniCtx.moveTo(0,-10);miniCtx.lineTo(6.5,8);miniCtx.lineTo(0,4);
    miniCtx.lineTo(-6.5,8);miniCtx.closePath();miniCtx.fill();miniCtx.stroke();miniCtx.restore();
    miniCtx.font='bold 10px system-ui';miniCtx.fillStyle='#effcff';miniCtx.fillText('N',6,12);
    if(active){
      const b=directionTo(game.player.x,game.player.z,active.x,active.z,game.player.yaw);
      const turn=Math.abs(b.angle)>2.5?'Behind':b.angle<-.22?'Right':b.angle>.22?'Left':'Ahead';
      const arrow=turn==='Right'?'→':turn==='Left'?'←':turn==='Behind'?'↓':'↑';
      miniLabel.textContent=active.name+' · '+arrow+' '+b.distance+'b';
      miniLabel.title='Guiding to '+active.name+' · '+turn;
      miniLabel.dataset.guiding='true';
      mini.setAttribute('aria-label','Open map. Guiding to '+active.name+', '+b.distance+' blocks away, '+turn);
    }else{
      miniLabel.textContent='Map';
      miniLabel.dataset.guiding='false';
      mini.setAttribute('aria-label','Expand world map');
    }
  }
  function scheduleMiniTerrain(){
    if(!game.world||!miniCacheCtx||!miniCtx||!miniWorkCtx||miniDrawing)return;
    miniDrawing=true;
    const token=++miniJob;
    const c=pos(),world=game.world;
    let index=0;
    miniWorkCtx.fillStyle='#254e61';miniWorkCtx.fillRect(0,0,MINI_SIZE,MINI_SIZE);
    const columnHeights=new Int16Array(MINI_SAMPLES);
    function frame(){
      if(token!==miniJob||game.world!==world||game.state!=='play')return;
      const end=Math.min(MINI_SAMPLES*MINI_SAMPLES,index+280);
      for(;index<end;index++){
        const row=Math.floor(index/MINI_SAMPLES),col=index%MINI_SAMPLES;
        const wx=c.x+(col-MINI_SAMPLES/2)*4;
        const wz=c.z+(row-MINI_SAMPLES/2)*4;
        const sampled=world.gen.column(wx,wz),height=sampled.h;
        const variation=row?Math.max(-1,Math.min(1,(columnHeights[col]-height)/5)):0;
        columnHeights[col]=height;
        miniWorkCtx.fillStyle=winterMapColor(height,sampled.biome,variation);
        const x=Math.floor(col*MINI_SIZE/MINI_SAMPLES),y=Math.floor(row*MINI_SIZE/MINI_SAMPLES);
        const x2=Math.ceil((col+1)*MINI_SIZE/MINI_SAMPLES);
        const y2=Math.ceil((row+1)*MINI_SIZE/MINI_SAMPLES);
        miniWorkCtx.fillRect(x,y,x2-x,y2-y);
      }
      if(index<MINI_SAMPLES*MINI_SAMPLES){requestAnimationFrame(frame);return;}
      // Publish the complete frame atomically, never show half-drawn terrain.
      miniCacheCtx.clearRect(0,0,MINI_SIZE,MINI_SIZE);
      miniCacheCtx.drawImage(miniWork,0,0);
      miniCenter=c;miniDrawing=false;
      miniTerrain=true;miniFirstDraw=false;drawMini();
    }
    requestAnimationFrame(frame);
  }

  function drawMarker(ctx,x,z,center,step,side,label,type){
    const p=worldToMap(x,z,center.x,center.z,step,side);
    if(p.x<9||p.y<9||p.x>side-9||p.y>side-9)return;
    ctx.save();
    if(type==='player'){
      ctx.translate(p.x,p.y);ctx.rotate(-game.player.yaw);
      ctx.fillStyle='#073549';ctx.beginPath();
      ctx.moveTo(0,-12);ctx.lineTo(8,9);ctx.lineTo(0,5);ctx.lineTo(-8,9);ctx.closePath();ctx.fill();
      ctx.fillStyle='#6aebff';ctx.beginPath();
      ctx.moveTo(0,-9);ctx.lineTo(5,6);ctx.lineTo(0,3);ctx.lineTo(-5,6);ctx.closePath();ctx.fill();
    }else{
      ctx.fillStyle='#0d3247';ctx.beginPath();ctx.arc(p.x,p.y,8.6,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=type==='landmark'?'#74ecff':type==='cave'?'#91e5ff':
        type==='crypt'?'#c8b1f0':type==='treasure'?'#ffd47d':
        type==='territory'?'#ff929c':type==='discovery'?'#9bf5f5':
        type==='monster'?'#f98890':type==='dungeon'?'#ffdf8d':
        type==='selected'?'#ffd68b':type==='home'?'#9ef8ce':
        type==='spawn'?'#c0deff':'#ffe4ab';
      ctx.beginPath();ctx.arc(p.x,p.y,5.5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#0c3348';ctx.beginPath();ctx.arc(p.x,p.y,2,0,Math.PI*2);ctx.fill();
    }
    if(label){
      ctx.font='700 11px system-ui';
      const width=Math.min(side-10,Math.ceil(ctx.measureText(label).width)+12);
      const px=Math.max(4,Math.min(side-width-4,p.x+11));
      const py=Math.max(15,Math.min(side-5,p.y-18));
      ctx.fillStyle='#0a2e43ed';ctx.fillRect(px,py-13,width,18);
      ctx.fillStyle='#f3fbff';ctx.fillText(label,px+6,py,Math.max(10,width-10));
    }
    ctx.restore();
  }
  function openMap(){
    if(game.state!=='play'||!game.world){notify(game,'Enter your world first.');return;}
    ensureWorld();mapOpened=true;
    openDialog('World Map');
    // The shared dialog panel may retain scroll from a long journal/adventure
    // screen. Start the map at its title and first filter row every time.
    panel.scrollTop=0;panel.classList.add('fc-map-panel');
    const layout=$('div',undefined,panel);layout.className='fc-map-layout';
    const left=$('section',undefined,layout);
    const toolbar=$('div',undefined,left);toolbar.className='fc-map-toolbar';
    const zoomBox=$('div',undefined,toolbar);zoomBox.className='fc-map-zoom';
    const out=button(zoomBox,'−',()=>changeZoom(1));out.setAttribute('aria-label','Zoom out');
    const zoomLabel=$('span','',zoomBox);zoomLabel.style.cssText='font:750 11px system-ui;color:#b7d7e4;min-width:52px;text-align:center';
    const inc=button(zoomBox,'+',()=>changeZoom(-1));inc.setAttribute('aria-label','Zoom in');
    button(toolbar,'Center me',()=>{const me=pos();center={...me};renderTerrain();});
    button(toolbar,'Mark here',()=>{
      selected=pos();
      active=cleanPlace({id:'destination',name:'My Location',...selected});
      nameInput.value='My Location';
      pickTitle.textContent='Save your current position as a pin';
      composer.classList.add('is-visible');
      drawOverlay();drawMini();
    });
    const frame=$('div',undefined,left);frame.className='fc-map-frame';
    const canvas=$('canvas',undefined,frame);canvas.width=canvas.height=336;
    canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Interactive winter terrain map. Tap to mark a place.');
    const wait=$('div','Loading map',frame);wait.className='fc-map-wait';
    const legend=$('p',undefined,left);legend.className='fc-map-legend';
    legend.textContent='■ Dungeons  ▣ Caves  ✦ Landmarks  ✧ Treasure  ● Threats  ◆ Pins';
    const caption=$('div',undefined,left);caption.className='fc-map-caption';
    const coordinates=$('span','',caption);const scale=$('span','',caption);
    const side=$('section',undefined,layout);side.className='fc-map-side';
    const heading=$('h3','Exploration & Places',side);
    const summary=$('p','',side);summary.className='fc-map-discovery-summary';
    const filterBar=$('div',undefined,side);filterBar.className='fc-map-filterbar';
    const homeAction=button(side,'⌂ Set Home Here',()=>{
      const me=pos();
      if(!persist({...places,home:{id:'home',name:'Home',...me}}))return;
      notify(game,'Home saved');drawOverlay();refreshList();
    },'fc-map-home');
    const filterOptions=[
      ['all','🧭 All'],['cave','◒ Caves'],['dungeon','⌂ Dungeons'],
      ['treasure','✧ Treasure'],['threat','⚠ Threats'],['landmark','✦ Landmarks']
    ];
    const filterButtons=new Map(),filterCountNodes=new Map();
    const list=$('div',undefined,side);list.className='fc-map-pin-list';
    function filterMatches(kind){
      if(mapFilter==='all')return true;
      if(mapFilter==='cave')return kind==='cave';
      if(mapFilter==='dungeon')return kind==='dungeon'||kind==='crypt';
      if(mapFilter==='treasure')return kind==='treasure';
      if(mapFilter==='threat')return kind==='territory'||kind==='monster';
      if(mapFilter==='landmark')return kind==='landmark'||kind==='discovery';
      return false;
    }
    function filterCounts(){
      const discoveries=explorationPins();
      const caves=discoveries.filter(v=>v.kind==='cave').length;
      const crypts=discoveries.filter(v=>v.kind==='crypt').length;
      const treasures=discoveries.filter(v=>v.kind==='treasure').length;
      const territories=discoveries.filter(v=>v.kind==='territory').length;
      const dungeons=dungeonPins().length+crypts;
      const threats=territories+monsterPins().length;
      const landmarks=[...nearbyLandmarks(),...visitedLandmarks(),...journalPins()];
      const landmarkCount=new Set(landmarks.map(v=>v.id||v.name+'@'+v.x+','+v.z)).size;
      return {all:dungeons+caves+treasures+threats+landmarkCount+places.marks.length+1,
        cave:caves,dungeon:dungeons,treasure:treasures,threat:threats,landmark:landmarkCount};
    }
    function updateFilterButtons(){
      const counts=filterCounts();
      for(const [key,b] of filterButtons){
        b.setAttribute('aria-pressed',String(mapFilter===key));
        const count=filterCountNodes.get(key);if(count)count.textContent=String(counts[key]||0);
      }
    }
    for(const [key,label] of filterOptions){
      const b=button(filterBar,label,()=>{
        mapFilter=key;updateFilterButtons();refreshList();drawOverlay();
      });
      b.dataset.filter=key;b.setAttribute('aria-label',label.replace(/^\\S+\\s/,'')+' filter');
      b.setAttribute('aria-pressed',String(mapFilter===key));
      const count=$('span','0',b);count.className='fc-map-filter-count';
      filterCountNodes.set(key,count);filterButtons.set(key,b);
    }
    const composer=$('div',undefined,side);composer.className='fc-map-chooser';
    const pickTitle=$('strong','Destination selected',composer);
    const nameInput=$('input',undefined,composer);nameInput.type='text';
    nameInput.maxLength=24;nameInput.placeholder='Place name';nameInput.setAttribute('aria-label','Marker name');
    const compBtns=$('div',undefined,composer);compBtns.className='fc-map-chooser-buttons';
    button(compBtns,'Save Pin',()=>{
      if(!selected)return;
      if(places.marks.length>=MAX_PLACES){notify(game,'Maximum of '+MAX_PLACES+' places');return;}
      const marker=cleanPlace({id:'p'+Date.now().toString(36)+Math.floor(Math.random()*10000).toString(36),
        name:nameInput.value.trim()||'My Place',x:selected.x,z:selected.z});
      if(!marker)return;
      if(!persist({...places,marks:[...places.marks,marker]}))return;
      if(active?.id==='destination'&&active.x===marker.x&&active.z===marker.z)active=marker;
      selected=null;composer.classList.remove('is-visible');
      drawOverlay();drawMini();refreshList();notify(game,'Place saved');
    });
    button(compBtns,'Stop Guide',()=>{
      selected=null;stopNavigation();composer.classList.remove('is-visible');drawOverlay();
    },'muted');
    let center=pos(),selected=null,basePixels=null,token=0;
    const ctx=canvas.getContext('2d',{alpha:false});
    const step=()=>MAP_STEPS[zoom];
    function changeZoom(delta){
      zoom=Math.max(0,Math.min(MAP_STEPS.length-1,zoom+delta));
      renderTerrain();
    }
    function drawOverlay(){
      if(!basePixels||!canvas.isConnected)return;
      ctx.putImageData(basePixels,0,0);
      const n=step(),size=canvas.width;
      if(mapFilter==='all'){
        const sp=game.player.spawn;
        if(sp)drawMarker(ctx,sp.x,sp.z,center,n,size,'Spawn','spawn');
        if(places.home)drawMarker(ctx,places.home.x,places.home.z,center,n,size,'Home','home');
        for(const marker of places.marks)drawMarker(ctx,marker.x,marker.z,center,n,size,marker.name,'marker');
      }
      if(filterMatches('dungeon'))for(const marker of dungeonPins())
        drawMarker(ctx,marker.x,marker.z,center,n,size,marker.name,'dungeon');
      if(filterMatches('landmark')){
        for(const marker of journalPins())drawMarker(ctx,marker.x,marker.z,center,n,size,'','discovery');
        for(const marker of visitedLandmarks())drawMarker(ctx,marker.x,marker.z,center,n,size,'','discovery');
        for(const marker of nearbyLandmarks())drawMarker(ctx,marker.x,marker.z,center,n,size,marker.name,'landmark');
      }
      for(const marker of explorationPins()){
        if(!filterMatches(marker.kind))continue;
        if(marker.kind==='territory'&&marker.radius){
          const p=worldToMap(marker.x,marker.z,center.x,center.z,n,size);
          const radius=marker.radius/(MAP_CELLS*n)*size;
          if(radius>1&&p.x>-radius&&p.y>-radius&&p.x<size+radius&&p.y<size+radius){
            ctx.save();ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);
            ctx.fillStyle='#f27e8d18';ctx.strokeStyle='#f39aa577';
            ctx.lineWidth=1.4;ctx.fill();ctx.stroke();ctx.restore();
          }
        }
        drawMarker(ctx,marker.x,marker.z,center,n,size,marker.name,marker.kind);
      }
      if(filterMatches('monster'))for(const marker of monsterPins())
        drawMarker(ctx,marker.x,marker.z,center,n,size,'','monster');
      const me=pos();
      if(active){
        const from=worldToMap(me.x,me.z,center.x,center.z,n,size);
        const to=worldToMap(active.x,active.z,center.x,center.z,n,size);
        ctx.save();ctx.beginPath();ctx.rect(0,0,size,size);ctx.clip();
        ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.lineTo(to.x,to.y);
        ctx.strokeStyle='#f9bf71';ctx.lineWidth=2.5;ctx.setLineDash([7,5]);ctx.stroke();
        ctx.restore();
        drawMarker(ctx,active.x,active.z,center,n,size,active.name,'selected');
      }
      drawMarker(ctx,me.x,me.z,center,n,size,'You','player');
      if(selected&&!active)drawMarker(ctx,selected.x,selected.z,center,n,size,'New','selected');
      ctx.save();ctx.font='800 13px system-ui';ctx.fillStyle='#163d52';ctx.fillText('N',13,21);
      ctx.fillStyle='#f7feff';ctx.fillText('N',12,20);ctx.restore();
    }
    function renderTerrain(){
      if(!canvas.isConnected)return;
      token=++renderToken;
      const current=token,n=step(),size=canvas.width,cells=MAP_CELLS;
      let i=0;const lastHeights=new Int16Array(cells);
      basePixels=null;
      wait.hidden=false;zoomLabel.textContent=n+'×';
      const me=pos();coordinates.textContent='X '+me.x+'  ·  Z '+me.z;
      scale.textContent=(n*cells)+'-block view';
      ctx.fillStyle='#173f54';ctx.fillRect(0,0,size,size);
      function frame(){
        if(token!==renderToken||!canvas.isConnected||game.world!==loadedWorld)return;
        const until=Math.min(cells*cells,i+480);
        for(;i<until;i++){
          const row=Math.floor(i/cells),col=i%cells;
          const wx=Math.round(center.x+(col-cells/2+.5)*n);
          const wz=Math.round(center.z+(row-cells/2+.5)*n);
          const sample=game.world.gen.column(wx,wz);
          const h=sample.h,biome=sample.biome;
          const slope=row?lastHeights[col]-h:0;lastHeights[col]=h;
          const variation=Math.max(-1,Math.min(1,slope/5));
          const shade=winterMapColor(h,biome,variation);
          const x0=Math.floor(col*size/cells),y0=Math.floor(row*size/cells);
          const x1=Math.ceil((col+1)*size/cells),y1=Math.ceil((row+1)*size/cells);
          ctx.fillStyle=shade;ctx.fillRect(x0,y0,x1-x0,y1-y0);
        }
        if(i<cells*cells){requestAnimationFrame(frame);return;}
        basePixels=ctx.getImageData(0,0,size,size);
        wait.hidden=true;drawOverlay();
      }
      requestAnimationFrame(frame);
    }
    function refreshList(){
      const oldScroll=list.scrollTop||0;
      list.replaceChildren();
      updateFilterButtons();
      const addRow=(name,where,icon,kind)=>{
        if(!filterMatches(kind))return;
        const row=$('div',undefined,list);
        row.className='fc-map-pin'+
          (kind==='monster'?' is-monster':kind==='dungeon'?' is-dungeon':
          kind==='discovery'?' is-discovery':kind==='landmark'?' is-landmark':
          kind==='cave'?' is-cave':kind==='crypt'?' is-crypt':
          kind==='treasure'?' is-treasure':kind==='territory'?' is-territory':'');
        const symbol=$('span',icon,row);symbol.className='fc-map-pin-icon';
        const main=$('div',undefined,row);main.className='fc-map-pin-main';
        $('strong',name,main);
        $('small',(where.detail?where.detail+' · ':'')+'X '+where.x+' · Z '+where.z,main);
        const go=button(row,'Guide',()=>startNavigation(where));
        go.setAttribute('aria-label','Navigate to '+name);
        if(['monster','dungeon','landmark','cave','crypt','treasure','territory'].includes(kind)){
          const pin=button(row,'Pin',()=>{
            if(places.marks.length>=MAX_PLACES){
              notify(game,'Maximum of '+MAX_PLACES+' saved pins');return;
            }
            const marker=cleanPlace({
              id:'p'+Date.now().toString(36)+Math.floor(Math.random()*10000).toString(36),
              name:kind==='monster'?name+' sighting':name,x:where.x,z:where.z});
            if(!marker)return;
            if(persist({...places,marks:[...places.marks,marker]})){
              notify(game,'Pinned '+marker.name+' at these coordinates');
              refreshList();drawOverlay();drawMini();
            }
          },'fc-map-pin-save');
          pin.setAttribute('aria-label','Save a pin at '+name);
        }
        if(kind==='mark'){
          const remove=button(row,'✕',()=>{
            const next=places.marks.filter(m=>m.id!==where.id);
            if(persist({...places,marks:next})){refreshList();drawOverlay();}
          },'fc-delete');
          remove.setAttribute('aria-label','Remove '+name);
        }
      };
      const discovery=explorationPins();
      const stats=game.exploration?.stats?.()||{caves:0,crypts:0,treasures:0,territories:0};
      summary.textContent='Discovered · '+stats.caves+' caves · '+stats.crypts+
        ' hidden dungeons · '+stats.treasures+' caches · '+stats.territories+' territories';
      const expedition=expeditionSnapshot()?.mission;
      if(mapFilter==='all'&&expedition?.active){
        const card=$('article',undefined,list);card.className='fc-map-objective';
        $('strong','ACTIVE EXPEDITION · '+expedition.title,card);
        $('p',expedition.detail,card);
        $('small','Progress '+expedition.progress+' / '+expedition.target+
          (expedition.ready?' · Reward ready':' · Tracked after acceptance'),card);
        const meter=$('div',undefined,card);meter.className='fc-map-objective-meter';
        const fill=$('i',undefined,meter);
        fill.style.width=Math.min(100,expedition.progress/expedition.target*100)+'%';
        const actions=$('div',undefined,card);actions.className='fc-map-objective-actions';
        if(expedition.ready){
          button(actions,'Claim reward',()=>game.rewards?.open?.());
        }else if(expedition.kind==='clears'){
          button(actions,'Guide to Frost Ruins',()=>{
            if(!game.rewards?.guideMission?.())notify(game,'Frost Ruins entrance is not available yet.');
          });
        }else if(expedition.kind==='kills'){
          button(actions,'Show nearby threats',()=>{
            mapFilter='threat';updateFilterButtons();refreshList();drawOverlay();
          });
        }else{
          button(actions,'Center on me',()=>{
            center=pos();renderTerrain();
          });
        }
        button(actions,'Open Board',()=>game.rewards?.open?.(),'muted');
      }
      const addStatusRow=(name,detail,icon,action,actionLabel='Open')=>{
        const row=$('div',undefined,list);row.className='fc-map-pin fc-map-chapter'+(action?'':' is-locked');
        const symbol=$('span',icon,row);symbol.className='fc-map-pin-icon';
        const main=$('div',undefined,row);main.className='fc-map-pin-main';
        $('strong',name,main);$('small',detail,main);
        if(action)button(row,actionLabel,action);
      };
      if(mapFilter==='all'||mapFilter==='dungeon'){
        const chapters=dungeonChapterProgress(game.adventure?.serialize?.());
        const pins=dungeonPins();
        const group=$('div','DUNGEON CHAPTER PROGRESSION',list);group.className='fc-map-group';
        const mapIds={frost:'map-frost-ruins',storm:'map-stormspire',aurora:'map-aurora',abyss:'map-abyss'};
        for(const chapter of chapters){
          const destination=pins.find(v=>v.id===mapIds[chapter.id]);
          const detail=!chapter.unlocked?'Locked · '+chapter.requirement:
            chapter.site?(chapter.built?'Built':'Site found · prepare in Winter Adventure')+' · '+chapter.clears+' clears':
            'Unlocked · open Winter Adventure to prepare its site';
          if(destination)addRow(chapter.name,{...destination,detail},'⌂','dungeon');
          else addStatusRow(chapter.name,detail,chapter.unlocked?'◇':'🔒',
            chapter.unlocked?()=>game.adventure?.open?.():null,'Adventure');
        }
        const crypts=discovery.filter(v=>v.kind==='crypt');
        if(crypts.length){
          const group=$('div','HIDDEN DUNGEONS · DISCOVERED',list);group.className='fc-map-group';
          for(const item of crypts)addRow(item.name,item,'▣','crypt');
        }
      }
      if(mapFilter==='all'){
        if(places.home)addRow('Home',places.home,'⌂','home');
        else{
          const label=$('p','Set Home to save your current location.',list);
          label.className='fc-map-empty';
        }
        if(game.player.spawn){
          const sp=game.player.spawn;
          addRow('Spawn',{id:'spawn',name:'Spawn',x:Math.round(sp.x),z:Math.round(sp.z)},'◇','spawn');
        }
      }
      const caves=discovery.filter(v=>v.kind==='cave');
      if(caves.length){
        const group=$('div','CAVES · FOUND',list);group.className='fc-map-group';
        for(const item of caves)addRow(item.name,item,'◒','cave');
      }else if(mapFilter==='cave'){
        const empty=$('p','No cave mouths discovered yet. Explore steep snowy ground and inspect natural openings.',list);
        empty.className='fc-map-empty';
      }
      const treasures=discovery.filter(v=>v.kind==='treasure');
      if(treasures.length){
        const group=$('div','TREASURE · REAL WORLD CHESTS',list);group.className='fc-map-group';
        for(const item of treasures)addRow(item.name,item,'✧','treasure');
      }else if(mapFilter==='treasure'){
        const empty=$('p','No treasure caches discovered yet. Search cabins and investigate marked crypt entrances.',list);
        empty.className='fc-map-empty';
      }
      const territories=discovery.filter(v=>v.kind==='territory');
      if(territories.length){
        const group=$('div','MONSTER TERRITORIES · CONFIRMED',list);group.className='fc-map-group';
        for(const item of territories)addRow(item.name,item,'⚠','territory');
      }
      if(mapFilter==='all'||mapFilter==='landmark'){
        const sites=nearbyLandmarks();
        if(sites.length){
          const group=$('div','WINTER LANDMARKS · NEARBY',list);group.className='fc-map-group';
          for(const item of sites)addRow(item.name,item,'✦','landmark');
        }
        const visitedSites=visitedLandmarks().filter(site=>!sites.some(v=>v.id===site.id));
        if(visitedSites.length){
          const group=$('div','WINTER LANDMARKS · VISITED',list);group.className='fc-map-group';
          for(const item of visitedSites)addRow(item.name,item,'✧','discovery');
        }
        const knownSites=[...dungeonPins(),...sites,...visitedSites];
        const visited=journalPins().filter(item=>!knownSites.some(site=>
          site.id===item.id||Math.hypot(site.x-item.x,site.z-item.z)<=8));
        if(visited.length){
          const group=$('div','FIELD JOURNAL · VISITED PLACES',list);group.className='fc-map-group';
          for(const item of visited)addRow(item.name,item,'◇','discovery');
        }
      }
      if(mapFilter==='all'||mapFilter==='threat'){
        const monsters=monsterPins();
        const group=$('div','NEARBY MONSTERS · LIVE',list);group.className='fc-map-group';
        if(!monsters.length){
          const note=$('p','No living hostile monsters detected in loaded nearby chunks.',list);
          note.className='fc-map-empty';
        }else for(const item of monsters)addRow(item.name,item,'!','monster');
      }
      if(mapFilter==='all'&&places.marks.length){
        const group=$('div','YOUR SAVED PINS',list);group.className='fc-map-group';
        for(const item of places.marks)addRow(item.name,item,'◆','mark');
      }
      if(!list.children.length){
        const empty=$('p','Nothing discovered in this category yet. Keep exploring the world to reveal real locations.',list);
        empty.className='fc-map-empty';
      }
      list.scrollTop=oldScroll;
    }
    canvas.addEventListener('click',e=>{
      if(!basePixels)return;
      const rect=canvas.getBoundingClientRect();
      const px=(e.clientX-rect.left)*canvas.width/rect.width;
      const py=(e.clientY-rect.top)*canvas.height/rect.height;
      if(px<0||py<0||px>canvas.width||py>canvas.height)return;
      const candidates=[
        ...(filterMatches('monster')?monsterPins():[]),
        ...(filterMatches('dungeon')?dungeonPins():[]),
        ...(filterMatches('landmark')?[...nearbyLandmarks(),...visitedLandmarks(),...journalPins()]:[]),
        ...explorationPins().filter(v=>filterMatches(v.kind)),
        ...(mapFilter==='all'?places.marks:[])
      ];
      const hit=mapMarkerAt(candidates,px,py,center,step(),canvas.width);
      selected=hit?{x:hit.x,z:hit.z}:mapToWorld(px,py,center.x,center.z,step(),canvas.width);
      // Tapping a known marker navigates to its current/last-seen coordinates.
      active=cleanPlace({id:'destination',name:hit?.name||'Destination',...selected});
      nameInput.value=hit?(hit.kind==='monster'?hit.name+' sighting':hit.name):'My Place';
      pickTitle.textContent=(hit?hit.name+' · ':'')+'Guiding to X '+selected.x+' · Z '+selected.z;
      composer.classList.add('is-visible');
      drawOverlay();drawMini();
    });
    refreshList();renderTerrain();
    // Keep the action buttons stable on touch devices: gameplay is paused
    // behind the world-map dialog, so its marker list is a stable snapshot.
    // The terrain/map overlay may redraw, but never replace a button mid-tap.
    // Reopening the map refreshes the nearby monster roster.
    refreshOpenMap=()=>{drawOverlay();};mapRefreshTick=1;
  }
  function reset(){
    renderToken++;mapOpened=false;refreshOpenMap=null;load();
    nav.hidden=true;mini.style.display='none';
    miniTimer=0;
  }
  function update(dt){
    const playing=game.state==='play'&&!game.paused&&!game.player.dead;
    // Keep the mini always present during regular gameplay but never over
    // inventory, fullscreen menus or blueprint placement controls.
    const visible=playing&&!game.ui?.isOpen&&!dialogOpen()&&!isBlocked();
    mini.style.display=visible?'flex':'none';
    updateNavigation();
    if(!playing)return;
    if(mapOpened&&dialogOpen()&&panel.classList.contains('fc-map-panel')){
      mapRefreshTick-=dt;
      if(mapRefreshTick<=0){
        mapRefreshTick=1;
        refreshOpenMap?.();
      }
    }
    miniTimer-=dt;
    const me=pos();
    const move=miniCenter?Math.hypot(me.x-miniCenter.x,me.z-miniCenter.z):Infinity;
    if(visible&&miniTimer<=0){
      miniTimer=.22;
      if(!miniDrawing&&(!miniTerrain||!miniCenter||move>13)){
        // Rate-limit terrain generation as the player walks. Fine detail is
        // rendered only in the expanded map when requested.
        scheduleMiniTerrain();
      }
      if(miniTerrain)drawMini();
    }
    if(active){
      const b=directionTo(game.player.x,game.player.z,active.x,active.z,game.player.yaw);
      if(b.distance<3){
        notify(game,'Reached '+active.name);
        stopNavigation();
      }
    }
  }

  return {open:openMap,reset,update,stop:stopNavigation,guideTo:startNavigation};
}
