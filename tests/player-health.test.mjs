import test from 'node:test';
import assert from 'node:assert/strict';
import {Player} from '../js/player.js';
import {playerMaxHealth} from '../js/combat-progression.js';

test('real Player starts with 24 health and reflects Adventure level without setting a saved maxHealth field',()=>{
 const game={adventure:{level:1}};
 const p=new Player(game);
 assert.equal(p.health,24);
 assert.equal(p.maxHealth,24);
 assert.equal(Object.hasOwn(p,'maxHealth'),false);
 game.adventure.level=20;
 assert.equal(p.maxHealth,32);
 game.adventure.level=30;
 assert.equal(p.maxHealth,36);
 game.adventure.level=65;
 assert.equal(p.maxHealth,50);
});

test('real Player respawns with full level-appropriate health, not legacy 20 HP',()=>{
 const game={adventure:{level:30}};
 const p=new Player(game);
 p.health=2;p.hunger=2;p.dead=true;
 p.spawn={x:5,y:42,z:13};
 p.respawn();
 assert.equal(p.health,playerMaxHealth(30));
 assert.equal(p.health,36);
 assert.equal(p.hunger,20);
 assert.equal(p.dead,false);
 assert.deepEqual([p.x,p.y,p.z],[5,42,13]);
});
