import test from 'node:test';
import assert from 'node:assert/strict';
import {JUDGE_TOUR_STEPS,tourStep} from '../js/judge-tour-core.js';
import {readFileSync} from 'node:fs';
const code=path=>readFileSync(path,'utf8');
test('a short complete judge flow shows actual gameplay and each relevant Sui Stack part',()=>{
  assert.equal(JUDGE_TOUR_STEPS.length,6);
  assert.deepEqual(JUDGE_TOUR_STEPS.map(s=>s.id),
    ['meet','battle','build','rewards','creator','sui']);
  assert.deepEqual(JUDGE_TOUR_STEPS.map(s=>s.action),
    [null,'adventure','blocks','rewards','studio','marketplace']);
  for(const s of JUDGE_TOUR_STEPS){
    assert.ok(s.title&&s.description&&s.tip);
    assert.ok(s.description.length>=30);
    assert.doesNotMatch(s.description,/guaranteed|free real crypto|live mainnet/i);
  }
});
test('invalid tour index clamps rather than causing an empty modal',()=>{
  assert.equal(tourStep(-10),JUDGE_TOUR_STEPS[0]);
  assert.equal(tourStep(999),JUDGE_TOUR_STEPS.at(-1));
  assert.equal(tourStep(NaN),JUDGE_TOUR_STEPS[0]);
});
test('tour cannot modify game state, grant fake achievements or trigger transaction signing',()=>{
  const codebase=code('js/judge-tour.js')+code('js/judge-tour-core.js');
  for(const forbidden of ['grantXP','mintNFT','tx.publish','signAndExecuteTransaction',
    'localStorage.setItem','rewards.points+=','game.onKill']){
    assert.ok(!codebase.includes(forbidden),'tour must not run '+forbidden);
  }
  assert.match(codebase,/isDialogOpen/);
  assert.match(codebase,/root.hidden/);
  assert.match(codebase,/judge/i);
});
test('guided demo creates only a new Survival world and is available from menu',()=>{
  const main=code('js/main.js'),flurry=code('js/flurry.js'),html=code('index.html');
  assert.match(html,/id="bJudgeDemo"/);
  assert.match(main,/judgeDemoRequested=true/);
  assert.match(main,/settings.mode='s';settings.diff=1/);
  assert.match(main,/startGame\(false\)/);
  assert.match(main,/saveGame\(\); \/\/ Save as a new world/);
  assert.match(flurry,/startJudgeTour/);
  assert.match(flurry,/▶ Guided Tour/);
  assert.match(flurry,/initJudgeTour/);
  assert.match(flurry,/judgeTour\.close\(\)/);
});

test('desktop input never captures camera or attacks while judge UI and dialogs are active',()=>{
  const main=code('js/main.js');
  assert.match(main,/const interactiveUI=game\.tourActive/);
  assert.match(main,/#flurryModal,#fcJudgeTour,#fcQuickMenu,#flurryActions/);
  assert.match(main,/!touchMode && !interactiveUI/);
  assert.match(main,/if \(game\.paused \|\| ui\.isOpen \|\| interactiveUI\) return/);
});
