// Lightweight Explorer's Journal UI. Designed for tiny mobile landscape
// screens and existing FlurryCraft dialogs. World data stays in validated saves.
import {safeExplorerJournal,visitExplorerLocation,journalStats,
  explorerMapPlaces,TERRAIN,MAX_SURVEY_POINTS,DUNGEON_IDS} from './explorer-journal-core.js';
import {discoveredDungeons} from './map-discoveries.js';
export function initExplorerJournal({game,panel,openDialog,notify,explorer,isBusy=()=>false}){
  let state=safeExplorerJournal(null),world=null,tick=0;
  let noticeTimer=null;
  const el=(tag,text,parent=panel)=>{
    const n=document.createElement(tag);
    if(text!==undefined)n.textContent=text;
    parent.appendChild(n);return n;
  };
  const button=(parent,label,callback)=>{
    const n=el('button',label,parent);n.type='button';
    n.addEventListener('click',callback);return n;
  };
  const style=el('style',undefined,document.head);
  style.textContent=[
    '#flurryModal .fc-journal-overview{border:1px solid #4c8197;border-radius:13px;background:#163c51;padding:12px;margin:8px 0 14px}',
    '#flurryModal .fc-journal-stats{display:flex;flex-wrap:wrap;gap:7px;font:800 11px system-ui;color:#d7f9ff}',
    '#flurryModal .fc-journal-stats span{background:#22546b;padding:7px 10px;border-radius:9px}',
    '#flurryModal .fc-journal-help{font:600 11px/1.5 system-ui;color:#b5d5e2;margin:9px 0}',
    '#flurryModal .fc-journal-section{font:850 11px system-ui;letter-spacing:.13em;color:#aff2ff;margin:13px 0 7px}',
    '#flurryModal .fc-journal-entry{display:flex;align-items:center;gap:9px;background:#173d54;border:1px solid #416c83;border-radius:11px;padding:8px;margin:6px 0}',
    '#flurryModal .fc-journal-icon{flex:none;width:31px;height:31px;display:grid;place-items:center;background:#245d76;color:#e8ffff;border-radius:9px;font:800 15px system-ui}',
    '#flurryModal .fc-journal-entry-main{min-width:0;flex:1}',
    '#flurryModal .fc-journal-entry-main strong{display:block;font:800 12px system-ui;color:#ecfbff}',
    '#flurryModal .fc-journal-entry-main small{display:block;font:600 10px/1.4 system-ui;color:#b7d9e5}',
    '#flurryModal .fc-journal-entry button{flex:none;margin:0;padding:7px 9px;min-height:32px;border:1px solid #77b1c7;border-radius:8px;background:#235c73;font:800 11px system-ui;color:#edfdff}',
    '#flurryModal .fc-journal-locked{font:650 11px/1.6 system-ui;color:#99b8c8;padding:9px 4px}',
    '#fcDiscoveryNotice{position:fixed;top:18%;left:50%;transform:translateX(-50%);z-index:35;display:none;pointer-events:none;border:1px solid #b5f1ff;border-radius:15px;padding:12px 17px;max-width:min(340px,78vw);background:#0d3852f2;box-shadow:0 10px 32px #001c2aa8;text-align:center;color:#eaffff;font:800 13px/1.5 system-ui}',
    '#fcDiscoveryNotice.show{display:block;animation:fcDiscover .26s ease-out}',
    '@keyframes fcDiscover{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translate(-50%,0)}}',
    '@media(max-height:520px){#fcDiscoveryNotice{top:9%;padding:8px 11px;font-size:11px}#flurryModal .fc-journal-overview{padding:8px}}',
    '@media(prefers-reduced-motion:reduce){#fcDiscoveryNotice.show{animation:none}}'
  ].join('\n');
  const notice=el('div','',document.body);notice.id='fcDiscoveryNotice';
  notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
  function announce(found){
    const important=found.find(e=>e.kind==='biome'||e.kind==='dungeon');
    if(!important)return;
    clearTimeout(noticeTimer);
    notice.textContent='📖 '+(important.kind==='biome'?'New landscape: ':'Landmark visited: ')+
      important.name+' · Added to your Journal';
    notice.classList.remove('show');
    void notice.offsetWidth;
    notice.classList.add('show');
    noticeTimer=setTimeout(()=>notice.classList.remove('show'),2700);
  }
  function load(raw){
    state=safeExplorerJournal(raw);world=game.world;tick=0;
    clearTimeout(noticeTimer);notice.classList.remove('show');
  }
  function serialize(){return safeExplorerJournal(state);}
  function mapPlaces(){return explorerMapPlaces(state);}
  function stats(){return journalStats(state);}
  function scan(){
    if(game.state!=='play'||game.paused||game.player?.dead||isBusy()||
      document.visibilityState==='hidden'||game.world!==world)return [];
    const p=game.player,w=game.world;
    if(!p?.onGround||p.flying||!w?.gen)return [];
    const x=Math.floor(p.x),z=Math.floor(p.z);
    const raw=w.gen.column(x,z);
    const sampled={h:raw.h,biome:raw.biome};
    const dungeons=discoveredDungeons(game.adventure?.serialize?.());
    const next=visitExplorerLocation(state,p,sampled,dungeons);
    if(next.added.length){
      state=next.state;
      announce(next.added);
    }
    return next.added;
  }
  function update(dt){
    if(!Number.isFinite(dt)||dt<=0)return;
    tick+=dt;
    if(tick<1.4)return;
    tick=0;
    scan();
  }
  function open(){
    scan();
    openDialog('📖 Explorer’s Field Journal');
    const totals=stats();
    const info=el('section',undefined);info.className='fc-journal-overview';
    const numbers=el('div',undefined,info);numbers.className='fc-journal-stats';
    el('span',totals.terrain+'/4 landscapes',numbers);
    el('span',totals.dungeons+'/4 dungeons visited',numbers);
    el('span',totals.trails+'/'+MAX_SURVEY_POINTS+' trail markers',numbers);
    el('span',(game.landmarks?.visitedCount||0)+' winter landmarks',numbers);
    const description=el('p','Walk across snowy terrain, discover trail markers, visit built dungeons and inspect real 3D winter landmarks. All discoveries stay in your world save.',info);
    description.className='fc-journal-help';
    const group=(title,kind,icon,placeholder)=>{
      const heading=el('div',title);heading.className='fc-journal-section';
      const items=state.entries.filter(e=>e.kind===kind);
      if(!items.length){const empty=el('p',placeholder);empty.className='fc-journal-locked';return;}
      for(const entry of items){
        const line=el('div');line.className='fc-journal-entry';
        const badge=el('span',icon,line);badge.className='fc-journal-icon';
        const main=el('div',undefined,line);main.className='fc-journal-entry-main';
        el('strong',entry.name,main);
        el('small','X '+entry.x+' · Z '+entry.z,main);
        const go=button(line,'Guide',()=>explorer.guideTo(entry));
        go.setAttribute('aria-label','Navigate to '+entry.name);
      }
    };
    group('LANDSCAPES DISCOVERED','biome','❄','Explore snowy tundra, peaks, ice shores and frozen water to fill your journal.');
    group('DUNGEON ENTRANCES VISITED','dungeon','⌂','Travel to a known, built dungeon entrance to record a visit.');
    group('TRAIL MARKERS','survey','◇','Walk farther from previous surveyed sites to leave trail markers.');
    const siteHeading=el('div','WINTER LANDMARKS EXPLORED');
    siteHeading.className='fc-journal-section';
    const sites=game.landmarks?.visited?.()||[];
    if(!sites.length){
      const empty=el('p','Find a glowing waystone, frost cairn or refuge in the 3D world. Inspect it to add it here.');
      empty.className='fc-journal-locked';
    }
    for(const site of sites){
      const line=el('div');line.className='fc-journal-entry';
      const icon=el('span','✦',line);icon.className='fc-journal-icon';
      const info=el('div',undefined,line);info.className='fc-journal-entry-main';
      el('strong',site.name,info);
      el('small','X '+site.x+' · Z '+site.z,info);
      const nav=button(line,'Guide',()=>explorer.guideTo(site));
      nav.setAttribute('aria-label','Navigate to '+site.name);
    }
    const note=el('p','Journal discoveries are saved with this world and its backups. Your personal map pins remain independent.',panel);
    note.className='fc-journal-help';
  }
  return {load,serialize,update,scan,open,mapPlaces,stats,
    get entries(){return state.entries.map(e=>({...e}));}};
}
