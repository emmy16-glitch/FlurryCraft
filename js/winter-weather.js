// Pure FlurryCraft Winter World weather profiles. No browser/Three.js dependencies.
// Keeping this separate makes animation and visibility rules unit-testable.
export const WEATHER_MODES = Object.freeze(['storm','snowfall','calm']);
const PROFILES=Object.freeze({
  calm: Object.freeze({min:0.22,max:0.35,wind:0.3,gust:0.1,density:0.43,fog:0.10,label:'Calm'}),
  snowfall: Object.freeze({min:0.49,max:0.69,wind:0.8,gust:0.3,density:0.78,fog:0.34,label:'Snowfall'}),
  storm: Object.freeze({min:0.76,max:0.96,wind:2.0,gust:1.25,density:1,fog:0.85,label:'Storm'}),
});
export function weatherProfile(mode){
  return PROFILES[WEATHER_MODES.includes(mode)?mode:'storm'];
}
export function cycleWeatherMode(mode){
  const index=WEATHER_MODES.indexOf(mode);
  return WEATHER_MODES[(index+1+WEATHER_MODES.length)%WEATHER_MODES.length];
}
export function stormIntensity(mode,phase=0) {
  const profile=weatherProfile(mode);
  const t=Math.max(0,Math.min(1,0.5+0.5*Math.sin(phase)));
  return profile.min+(profile.max-profile.min)*t;
}
export function snowParticleBudget(max,mode,quality=1,intensity=1){
  const profile=weatherProfile(mode);
  if(!Number.isFinite(max)||max<1)return 0;
  return Math.max(1,Math.min(Math.floor(max),Math.floor(max*profile.density*Math.max(0.35,Math.min(1,quality))*
    Math.max(0.7,Math.min(1,intensity/profile.max)))));
}
export function isShelteredSurface(surfaceY,particleY){
  return Number.isFinite(surfaceY) && particleY<surfaceY+1.2;
}
