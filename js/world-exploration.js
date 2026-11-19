// Fog-of-war exploration scanner. Reads only chunks already loaded by the
// game and existing live mobs; it never generates terrain or grants rewards.
import * as B from './blocks.js';
import {safeWorldExploration,recordWorldDiscovery,worldDiscoveryStats,
  discoveredWorldPlaces,scanCaveEntrances,scanGeneratedLoot,
  scanMonsterTerritories} from './world-exploration-core.js';

export function initWorldExploration({game,notify}){
  let state=safeWorldExploration(null),world=null,tick=0;
  function load(raw){
    state=safeWorldExploration(raw);
    world=game.world;tick=0;
  }
  function serialize(){return safeWorldExploration(state);}
  function mapPlaces(){return discoveredWorldPlaces(state);}
  function stats(){return worldDiscoveryStats(state);}
  function scan(){
    const p=game.player,w=game.world;
    if(game.state!=='play'||game.paused||p?.dead||w!==world||
      !p||!w?.chunks||document.visibilityState==='hidden')return [];
    const candidates=[
      ...scanCaveEntrances(w,p,B.SOLID),
      ...scanGeneratedLoot(w,p),
      ...scanMonsterTerritories(game.mobs,p)
    ];
    const added=[];
    for(const candidate of candidates){
      const result=recordWorldDiscovery(state,candidate);
      if(result.first){state=result.state;added.push(result.entry);}
    }
    if(added.length){
      // Save once per scan, not once per pin. The normal world backup path
      // retains the discovery ledger without changing existing world edits.
      game.saveRewards?.();
      const important=added.find(v=>v.kind==='crypt')||
        added.find(v=>v.kind==='cave')||
        added.find(v=>v.kind==='treasure')||
        added.find(v=>v.kind==='territory');
      if(important){
        const messages={
          cave:'🕳 Cave discovered: '+important.name,
          crypt:'⌂ Hidden dungeon discovered: '+important.name,
          treasure:'✦ Treasure located: '+important.name,
          territory:'⚠ Monster territory discovered: '+important.name
        };
        notify(game,messages[important.kind]);
      }
    }
    return added;
  }
  function update(dt){
    if(!Number.isFinite(dt)||dt<=0)return;
    tick+=Math.min(dt,.25);
    if(tick<2.25)return;
    tick=0;scan();
  }
  return {load,serialize,mapPlaces,stats,scan,update,
    get discoveries(){return mapPlaces();}};
}
