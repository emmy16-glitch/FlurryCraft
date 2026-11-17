import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

test('browser HTML and bundled dependencies exist', () => {
  const html = readFileSync('index.html','utf8');
  assert.match(html, /<title>FlurryCraft/);
  assert.match(html, /Create Snow World/);
  assert.match(html, /id="fcAdvanced"/);
  assert.match(html, /vendor\/three\.module\.min\.js/);
  assert.match(html, /js\/main\.js/);
  assert.ok(existsSync('vendor/three.module.min.js'));
  assert.ok(existsSync('UPSTREAM_LICENSE.txt'));
});
test('all JavaScript game modules parse', () => {
  for (const file of readdirSync('js').filter(x => x.endsWith('.js'))) {
    const path = join('js',file);
    const result = spawnSync(process.execPath,['--check',path],{encoding:'utf8'});
    assert.equal(result.status,0,path+': '+result.stderr);
  }
});
test('custom game systems are connected', () => {
  const main = readFileSync('js/main.js','utf8');
  const flurry = readFileSync('js/flurry.js','utf8');
  assert.match(main,/initFlurry\(game\)/);
  assert.match(main,/game\.flurry\.onWorldReady/);
  assert.match(main,/game\.flurry\.update/);
  assert.match(flurry,/function createYeti/);
  assert.match(flurry,/function showBlueprint/);
  assert.match(flurry,/function placeBlueprint/);
  assert.match(readFileSync('js/worldgen.js','utf8'), /All open lakes, rivers and seas freeze/);
  assert.match(readFileSync('js/weather.js','utf8'), /Permanent snowfall/);
  assert.match(flurry,/function showBuildMenu/);
  assert.match(flurry,/function selectBlock/);
  assert.match(flurry,/openBlockLibrary:showBuildMenu/);
  assert.match(flurry,/fc-hotbar-all/);
  assert.match(flurry,/Object.values\(B.ITEMS\)/);
  assert.match(flurry,/search.addEventListener\('input',draw\)/);
  assert.match(readFileSync('js/player.js','utf8'),/s.flurryUnlimited/);
  assert.match(readFileSync('js/ui.js','utf8'),/s.flurryUnlimited/);
  assert.match(flurry,/daylightLocked/);
  assert.match(flurry,/Unstuck/);
  assert.match(readFileSync('js/touch.js','utf8'),/lastPlacementTip/);
  assert.match(flurry,/MeshBasicMaterial/);
});
