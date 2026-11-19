// Low-cost, in-world 3D winter landmarks and optional one-time Survival perks.
// Rendering is visual-only and does not write or overwrite player-built voxels.
import * as THREE from 'three';
import * as B from './blocks.js';
import {TYPES,MAX_ACTIVE_LANDMARKS,nearbyWinterSites,
  nearestInteractableSite,safeWinterLandmarks,visitWinterSite,
  useWinterSite,visitedLandmarkPlaces} from './winter-landmarks-core.js';

export function initWinterLandmarks({game,panel,openDialog,closeDialog,
  notify,isBusy=()=>false}){
  let state=safeWinterLandmarks(null),world=null;
  let renderTick=0,nearTick=0,sites=[],near=null;
  const models=new Map(),geometry=new THREE.BoxGeometry(1,1,1);
  const materials=Object.fromEntries(Object.entries({
    snow:'#d9f2f6',deep:'#2f6279',ice:'#8cf0f5',cyan:'#41cadb',
    wood:'#624a42',roof:'#51849e',fire:'#ffbd72',
    rock:'#718b9c',light:'#effdff',gold:'#ebd195'
  }).map(([k,c])=>[k,new THREE.MeshBasicMaterial({color:c})]));
  const add=(group,color,x,y,z,w,h,d)=>{
    const mesh=new THREE.Mesh(geometry,materials[color]);
    mesh.position.set(x,y,z);mesh.scale.set(w,h,d);
    mesh.castShadow=false;mesh.receiveShadow=false;
    group.add(mesh);return mesh;
  };
  function model(site){
    const group=new THREE.Group();
    group.position.set(site.x+.5,site.y,site.z+.5);
    if(site.kind==='refuge'){
      // Compact roofed trail shelter: platform, posts, blue roof, firepit.
      add(group,'wood',0,.08,0,3.4,.2,3.4);
      for(const x of [-1.2,1.2])for(const z of [-1.2,1.2])
        add(group,'wood',x,1.25,z,.22,2.5,.22);
      add(group,'roof',0,2.65,0,3.8,.32,3.8);
      add(group,'snow',0,2.88,0,3.4,.13,3.4);
      for(const x of [-.42,.42])add(group,'rock',x,.31,.3,.54,.28,.65);
      add(group,'fire',0,.7,.3,.35,.7,.35);
      add(group,'gold',0,1.12,.3,.15,.15,.15);
    }else if(site.kind==='spire'){
      add(group,'rock',0,.18,0,2.8,.37,2.8);
      for(const x of [-1.05,1.05])for(const z of [-1.05,1.05])
        add(group,'ice',x,.6,z,.35,1,.35);
      add(group,'deep',0,1.4,0,1.1,2.6,1.1);
      add(group,'ice',0,2.9,0,.9,1.3,.9);
      add(group,'cyan',0,3.7,0,.54,1.4,.54);
      add(group,'light',0,4.55,0,.22,.55,.22);
    }else{
      add(group,'rock',0,.16,0,3.2,.3,3.2);
      add(group,'deep',0,.58,0,1.8,.68,1.8);
      add(group,'rock',0,1.17,0,1.45,.6,1.45);
      add(group,'snow',0,1.65,0,1.18,.42,1.18);
      add(group,'ice',0,2.2,0,.48,.78,.48);
      for(const x of [-1.25,1.25])add(group,'rock',x,.55,.1,.38,.62,.38);
    }
    group.visible=true;game.scene.add(group);return group;
  }
  const prompt=document.createElement('button');
  prompt.id='fcInspectLandmark';prompt.type='button';
  prompt.setAttribute('aria-label','Inspect nearby winter landmark');
  prompt.addEventListener('pointerdown',e=>e.stopPropagation());
  prompt.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();interact();});
  prompt.style.display='none';document.body.appendChild(prompt);
  const style=document.createElement('style');document.head.appendChild(style);
  style.textContent=[
    '#fcInspectLandmark{position:fixed;z-index:28;left:50%;bottom:145px;transform:translateX(-50%);display:none;min-height:44px;max-width:62vw;padding:9px 14px;border:2px solid #a7ecfa;border-radius:13px;background:#175b73ed;color:#f1fdff;font:850 12px system-ui;box-shadow:0 5px 19px #001b2ca6;touch-action:manipulation;cursor:pointer}',
    '#fcInspectLandmark:focus-visible{outline:3px solid #b5f7ff;outline-offset:2px}',
    '#flurryModal .fc-landmark-note{border:1px solid #588ea1;background:#17455a;border-radius:13px;padding:13px;margin:10px 0;font:650 13px/1.55 system-ui;color:#e1f9ff}',
    '#flurryModal .fc-landmark-note strong{color:#aaf3ff;display:block;margin-bottom:7px;font:850 12px system-ui}',
    '#flurryModal .fc-landmark-note small{display:block;color:#aed1dc;margin-top:10px;font:650 11px system-ui}',
    '#flurryModal .fc-landmark-benefit{margin:12px 0 4px;width:100%;min-height:43px;background:#90e3ee;border:1px solid #b7f5ff;border-radius:10px;color:#0b3b4d;font:850 12px system-ui;touch-action:manipulation}',
    '#flurryModal .fc-landmark-benefit:disabled{opacity:.58;cursor:default}',
    '@media(max-height:520px){#fcInspectLandmark{bottom:117px;min-height:36px;padding:6px 10px;font-size:10px}#flurryModal .fc-landmark-note{padding:9px;font-size:11px}}'
  ].join('\n');
  function clearModels(){
    for(const group of models.values())game.scene.remove(group);
    models.clear();sites=[];near=null;
    prompt.style.display='none';
  }
  function load(raw){
    clearModels();state=safeWinterLandmarks(raw);
    world=game.world;renderTick=0;nearTick=0;
  }
  function serialize(){return safeWinterLandmarks(state);}
  function visited(){return visitedLandmarkPlaces(state);}
  function nearby(){return sites.map(site=>({...site,
    detail:state.visited.some(v=>v.id===site.id)?'Visited · '+site.detail:
      'Unexplored · '+site.detail}));}
  function refreshSites(){
    if(game.world!==world||!world?.gen||!game.player)return;
    const p=game.player;
    const found=nearbyWinterSites(world.seed??world.gen.seed,world.gen,p,
      p.spawn,MAX_ACTIVE_LANDMARKS);
    const current=new Set(found.map(s=>s.id));
    for(const [id,group] of models)if(!current.has(id)){
      game.scene.remove(group);models.delete(id);
    }
    for(const site of found)if(!models.has(site.id))models.set(site.id,model(site));
    sites=found;
  }
  function canInteract(){
    return game.state==='play'&&!game.paused&&!game.player?.dead&&
      !game.ui?.isOpen&&!isBusy()&&
      document.visibilityState!=='hidden';
  }
  function nearbySite(){
    return nearestInteractableSite(sites,game.player);
  }
  function perkAvailable(site){
    const p=game.player;
    if(!site||p?.creative||p?.dead||state.used.includes(site.id))return false;
    if(site.kind==='refuge')return p.health<p.maxHealth;
    if(site.kind==='spire')return p.guardStamina<99;
    return !!p.canAccept?.(B.FROST_SHARD);
  }
  function claimPerk(site){
    // A modal must be open, but the player cannot move to a different site.
    const p=game.player;
    if(game.state!=='play'||game.paused||p.dead||p.creative||
       nearestInteractableSite(sites,p)?.id!==site.id||
       !perkAvailable(site))return false;
    const v=useWinterSite(state,site);
    if(!v.first)return false;
    if(site.kind==='refuge')p.health=Math.min(p.maxHealth,p.health+6);
    else if(site.kind==='spire')p.guardStamina=100;
    else if(p.addItem(B.FROST_SHARD,1)!==0)return false;
    state=v.state;
    game.saveRewards?.();
    notify(game,'❄ '+TYPES[site.kind].name+' · '+(
      site.kind==='refuge'?'Rested and recovered':
      site.kind==='spire'?'Guard stamina restored':'Frost Shard collected'));
    return true;
  }
  function interact(){
    if(!canInteract())return false;
    const site=nearbySite();if(!site)return false;
    const visit=visitWinterSite(state,site);
    if(visit.first){
      state=visit.state;game.saveRewards?.();
      notify(game,'📖 New landmark: '+site.name+' · added to Explorer Journal');
    }
    openDialog('❄ '+site.name);
    const container=document.createElement('section');
    container.className='fc-landmark-note';panel.appendChild(container);
    const header=document.createElement('strong');
    header.textContent=site.name+' · X '+site.x+' · Z '+site.z;
    container.appendChild(header);
    const story=document.createElement('p');story.textContent=TYPES[site.kind].story;
    container.appendChild(story);
    const note=document.createElement('small');
    note.textContent='An authentic world-seeded encounter. This location is now saved to your Field Journal.';
    container.appendChild(note);
    const button=document.createElement('button');button.type='button';
    button.className='fc-landmark-benefit';
    const updateButton=()=>{
      button.textContent=state.used.includes(site.id)?'✓ Already used in this world':
        game.player.creative?'Survival only · observe the monument':
        perkAvailable(site)?TYPES[site.kind].action:
        site.kind==='refuge'?'Return when injured':
        site.kind==='spire'?'Return when guard stamina is low':'Inventory full';
      button.disabled=!perkAvailable(site);
    };
    updateButton();
    button.addEventListener('click',()=>{
      if(claimPerk(site)){updateButton();}
    });panel.appendChild(button);
    return true;
  }
  function update(dt){
    if(game.world!==world||!Number.isFinite(dt)||dt<=0){prompt.style.display='none';return;}
    if(game.state!=='play'){prompt.style.display='none';return;}
    renderTick-=dt;nearTick-=dt;
    if(renderTick<=0){
      renderTick=2.5;refreshSites();
    }
    if(nearTick<=0){
      nearTick=.22;
      near=canInteract()?nearbySite():null;
      prompt.style.display=near?'block':'none';
      if(near){
        prompt.textContent='✦ Explore '+near.name+' · F';
        prompt.setAttribute('aria-label','Inspect '+near.name);
      }
    }
  }
  function dispose(){
    clearModels();
    geometry.dispose();
    for(const material of Object.values(materials))material.dispose();
    style.remove();prompt.remove();
  }
  return {load,serialize,update,interact,nearby,visited,dispose,
    get sites(){return [...sites]},get visitedCount(){return state.visited.length;}};
}
