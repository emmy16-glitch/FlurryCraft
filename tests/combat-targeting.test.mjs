import test from 'node:test';
import assert from 'node:assert/strict';
import {assistedMeleeTarget} from '../js/combat-targeting.js';
const mob=(x,z,extras={})=>({x,y:0,z,hw:.3,h:1.3,hp:12,dead:false,deadT:0,...extras});
test('mobile melee forgivingly locks a near-crosshair frostling',()=>{
 const enemies=[mob(.45,-3)];
 const hit=assistedMeleeTarget([0,1.62,0],[0,0,-1],enemies);
 assert.equal(hit,enemies[0]);
});
test('no targeting enemies behind solid blocks, too far, or to the side',()=>{
 assert.equal(assistedMeleeTarget([0,1.62,0],[0,0,-1],[mob(.35,-3)],1.5),null);
 assert.equal(assistedMeleeTarget([0,1.62,0],[0,0,-1],[mob(.25,-8)]),null);
 assert.equal(assistedMeleeTarget([0,1.62,0],[0,0,-1],[mob(3,-2)]),null);
 assert.equal(assistedMeleeTarget([0,1.62,0],[0,0,-1],[mob(0,3)]),null);
});
test('no hit on dead creatures, closer enemy is preferred',()=>{
 const near=mob(.2,-2),far=mob(.1,-4),dead=mob(0,-1,{dead:true});
 assert.equal(assistedMeleeTarget([0,1,0],[0,0,-1],[dead,far,near]),near);
 assert.equal(assistedMeleeTarget([0,1,0],[mob(0,-2)],[]),null);
});
test('aim assist can target a large guardian without aiming at its forehead',()=>{
 const boss=mob(.55,-3.8,{h:2.7,hw:.67,hp:65});
 assert.equal(assistedMeleeTarget([0,1.62,0],[0,0,-1],[boss]),boss);
});
