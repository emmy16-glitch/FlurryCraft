import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GRAPHICS_MODES,normalizeGraphicsMode,graphicsPixelRatios,
  createGraphicsController
} from '../js/graphics-quality.js';
function frames(controller,seconds,fps,active=true){
  const n=Math.ceil(seconds*fps);
  let changed=0;
  for(let i=0;i<n;i++)if(controller.sample(1/fps,active))changed++;
  return changed;
}
test('quality presets are bounded by physical display pixel density',()=>{
  assert.deepEqual(GRAPHICS_MODES,['auto','crisp','performance']);
  assert.equal(normalizeGraphicsMode('fake'),'auto');
  for(const device of [0.5,1,1.25,2.75,3,200,NaN]){
    for(const touch of [true,false]){
      for(const mode of GRAPHICS_MODES){
        const r=graphicsPixelRatios(mode,touch,device);
        assert.ok(Number.isFinite(r.initial));
        assert.ok(r.initial>=r.lower&&r.initial<=r.upper);
        assert.ok(r.upper<=r.physical);
        assert.ok(r.initial>0);
      }
    }
  }
  assert.ok(graphicsPixelRatios('crisp',true,3).initial>
    graphicsPixelRatios('performance',true,3).initial);
});
test('adaptive quality reduces GPU pixel ratio after sustained poor FPS',()=>{
  const g=createGraphicsController('auto',true,2.75);
  const initial=g.ratio;
  assert.ok(frames(g,2.6,30)>=1);
  assert.ok(g.ratio<initial);
  assert.equal(g.measuredFPS,30);
});
test('stable high FPS slowly restores sharpness without oscillating each frame',()=>{
  const g=createGraphicsController('auto',false,2);
  frames(g,15,25);
  const slow=g.ratio;
  assert.ok(slow<g.range.upper);
  frames(g,20,60);
  assert.ok(g.ratio>slow);
  assert.ok(g.ratio<=g.range.upper);
  assert.ok(g.changes<15,'must not reallocate GPU every few frames');
});
test('hidden tabs, pauses and delayed frames never trigger false slow-GPU transitions',()=>{
  const g=createGraphicsController('auto',true,3);
  const initial=g.ratio;
  frames(g,10,10,false);
  for(const invalid of [NaN,Infinity,-1,0,5])g.sample(invalid,true);
  assert.equal(g.ratio,initial);
  assert.equal(g.changes,0);
});
test('fixed graphic presets never adapt but can be changed explicitly',()=>{
  const g=createGraphicsController('crisp',true,3);
  const crisp=g.ratio;
  assert.equal(frames(g,10,15),0);
  assert.equal(g.ratio,crisp);
  const performance=g.reset('performance');
  assert.ok(performance<crisp);
  assert.equal(frames(g,10,15),0);
  assert.equal(g.ratio,performance);
  const auto=g.reset('unknown');
  assert.equal(g.mode,'auto');
  assert.ok(auto>performance);
});
test('game wires live graphics selectors, budgeted remesh and hidden-tab throttle',async()=>{
  const {readFileSync}=await import('node:fs');
  const main=readFileSync('js/main.js','utf8');
  const world=readFileSync('js/world.js','utf8');
  const weather=readFileSync('js/weather.js','utf8');
  const html=readFileSync('index.html','utf8');
  assert.match(main,/createGraphicsController/);
  assert.match(main,/graphics\.sample\(elapsed/);
  assert.match(main,/renderer\.setPixelRatio\(graphics\.ratio\)/);
  assert.match(main,/document\.visibilityState==='hidden'/);
  assert.match(main,/w\.flushUrgent\(touchMode \? 2 : 3/);
  assert.match(world,/flushUrgent\(maxN = 8, budgetMs = Infinity\)/);
  assert.match(weather,/graphicsPreset==='performance'/);
  assert.match(html,/id="mGraphics"/);
  assert.match(html,/id="pGraphics"/);
});
