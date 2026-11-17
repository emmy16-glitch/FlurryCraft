import test from 'node:test';
import assert from 'node:assert/strict';
import {WEATHER_MODES,weatherProfile,cycleWeatherMode,stormIntensity,snowParticleBudget,isShelteredSurface} from '../js/winter-weather.js';
test('storm stays snowy and is the default winter weather',()=>{
  assert.deepEqual(WEATHER_MODES,['storm','snowfall','calm']);
  assert.equal(weatherProfile('nonsense').label,'Storm');
  assert.ok(weatherProfile('storm').min>weatherProfile('snowfall').max);
  assert.ok(weatherProfile('snowfall').min>weatherProfile('calm').max);
});
test('weather picker cycles in a predictable loop',()=>{
  assert.equal(cycleWeatherMode('storm'),'snowfall');
  assert.equal(cycleWeatherMode('snowfall'),'calm');
  assert.equal(cycleWeatherMode('calm'),'storm');
  assert.equal(cycleWeatherMode('unknown'),'storm');
});
test('intensity never leaves profile bounds',()=>{
  for(const mode of WEATHER_MODES){
    const p=weatherProfile(mode);
    for(let i=-12;i<=12;i++){
      const n=stormIntensity(mode,i*.6);
      assert.ok(n>=p.min-1e-9 && n<=p.max+1e-9);
    }
  }
});
test('particle budget is bounded and adapts to quality',()=>{
  const full=snowParticleBudget(800,'storm',1,.9);
  const reduced=snowParticleBudget(800,'storm',.6,.9);
  assert.ok(full<=800 && full>=1 && reduced<full);
  assert.ok(snowParticleBudget(800,'calm',1,.3)<full);
  assert.equal(snowParticleBudget(0,'storm',1,1),0);
});
test('snow respects sheltered roof height',()=>{
  assert.equal(isShelteredSurface(28,29),true);
  assert.equal(isShelteredSurface(28,31),false);
  assert.equal(isShelteredSurface(undefined,1),false);
});
