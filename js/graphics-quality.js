// GPU resolution scaling without changing game state, save format or world geometry.
// Controller is pure and browser-independent so that low-FPS behaviour is tested.
export const GRAPHICS_MODES=Object.freeze(['auto','crisp','performance']);
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export const normalizeGraphicsMode=value=>GRAPHICS_MODES.includes(value)?value:'auto';

export function graphicsPixelRatios(mode,touch=false,deviceDpr=1){
  const selected=normalizeGraphicsMode(mode);
  const physical=clamp(Number.isFinite(deviceDpr)?deviceDpr:1,.5,3);
  // Render at CSS resolution on low-DPI screens; never supersample those.
  const available=Math.min(physical,touch?1.5:1.9);
  const lower=Math.min(available,touch?.82:.85);
  const upper=Math.min(available,touch?1.45:1.85);
  const balanced=Math.min(upper,touch?1.25:1.7);
  const performance=Math.min(upper,touch?.92:1);
  const initial=selected==='crisp'?upper:selected==='performance'?performance:balanced;
  return {mode:selected,lower,upper,initial,physical};
}

export function createGraphicsController(mode='auto',touch=false,deviceDpr=1){
  let ranges=graphicsPixelRatios(mode,touch,deviceDpr);
  let ratio=ranges.initial, seconds=0, frames=0, changes=0, measuredFPS=0;
  // Slow hysteresis reduces repeated resolution jumps while moving between biomes.
  let cooldown=0, stableFastWindows=0;
  function reset(nextMode=mode){
    mode=normalizeGraphicsMode(nextMode);
    ranges=graphicsPixelRatios(mode,touch,deviceDpr);
    ratio=ranges.initial;
    seconds=0;frames=0;changes=0;measuredFPS=0;
    cooldown=0;stableFastWindows=0;
    return ratio;
  }
  function sample(elapsed,active=true){
    if(mode!=='auto'||!active||!Number.isFinite(elapsed)||elapsed<=0||elapsed>1){
      // A hidden tab, loading pause or window being dragged is not a slow GPU.
      seconds=0;frames=0;stableFastWindows=0;
      return false;
    }
    // Very slow foreground frames are evidence of load, not a reason to
    // disable adaptation; clamp their influence instead of discarding them.
    seconds+=Math.min(elapsed,.5);frames++;
    if(seconds<2.5)return false;
    const fps=frames/seconds;
    measuredFPS=Math.round(fps);
    seconds=0;frames=0;
    if(cooldown>0){cooldown--;return false;}
    const target=touch?44:50;
    const old=ratio;
    if(fps<target-6){
      ratio=clamp(Math.round((ratio-.12)*100)/100,ranges.lower,ranges.upper);
      stableFastWindows=0;
      cooldown=1;
    }else if(fps>target+8){
      stableFastWindows++;
      if(stableFastWindows>=2){
        ratio=clamp(Math.round((ratio+.08)*100)/100,ranges.lower,ranges.upper);
        stableFastWindows=0;
        cooldown=1;
      }
    }else stableFastWindows=0;
    if(Math.abs(old-ratio)<.005)return false;
    changes++;
    return true;
  }
  return {
    reset,sample,
    get mode(){return mode;},
    get ratio(){return ratio;},
    get measuredFPS(){return measuredFPS;},
    get changes(){return changes;},
    get range(){return {...ranges};}
  };
}
