// Static integration checks: full WebGL visual tests still require a browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const render=read('js/render.js');
const main=read('js/main.js');
const third=read('js/flurry.js');
const blocks=read('js/blocks.js');
const player=read('js/player.js');

test('sword selection builds a real modeled 3D weapon instead of a block cube',()=>{
 assert.match(render,/export function makeSwordMesh\(id,size=1\)/);
 assert.match(render,/tool\?\.type==='sword'\)return makeSwordMesh\(id,size\)/);
 for(const part of ['hilt','pommel','crossguard','blade','cutting-edge','sword-point'])
   assert.ok(render.includes("'"+part+"'"),'missing modeled part '+part);
 assert.match(render,/new THREE\.ConeGeometry/);
 assert.match(render,/new THREE\.BoxGeometry/);
 assert.match(render,/aurora-crystal-core/);
 assert.match(render,/g\.userData\.sword3D=true/);
});

test('held weapon is drawn and animated in both camera modes',()=>{
 assert.match(main,/const s = player\.held\(\), id = s \? s\.id : -1/);
 assert.match(main,/makeItemMesh\(id, isBlock/);
 assert.match(main,/renderer\.render\(handScene, handCam\)/);
 assert.match(main,/sw \* 0\.9/);
 assert.match(third,/import \{ makeSwordMesh,setItemLight \}/);
 assert.match(third,/avatarSword=makeSwordMesh\(id,\.62\)/);
 assert.match(third,/avatar\.group\.add\(avatarSword\)/);
 assert.match(third,/const swing=Math\.sin\(game\.player\.swing\*Math\.PI\)/);
 assert.match(third,/discardAvatarSword\(\)/);
});

test('swords are equipable weapons with actual combat stats and durability',()=>{
 assert.match(blocks,/tool:\{type:'sword',tier:5,speed:9,dur:480,dmg:9\}/);
 assert.match(blocks,/kind === 'sword' \? 4 \+ t/);
 assert.match(player,/playerAttackDamage\(baseDmg,g\.adventure\?\.level\|\|1,crit\)/);
 assert.match(player,/this\.useHeld\(it\.tool\.type === 'sword' \? 1 : 2\)/);
});
