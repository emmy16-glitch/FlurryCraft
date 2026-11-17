import test from 'node:test';
import assert from 'node:assert/strict';
import {MAX_LEVEL,CHAPTER_CAP,xpToNext,safeAdventure,grantXP,
 winterMobLevel,chooseWinterMob,trialWaves,trialLocation,ruinBlocks,withinWard}
 from '../js/adventure-core.js';

test('player XP levels increment, cap at 100 and save states sanitize',()=>{
 assert.equal(MAX_LEVEL,100);assert.equal(CHAPTER_CAP,10);
 assert.ok(xpToNext(2)>xpToNext(1));
 const first=xpToNext(1);
 const gained=grantXP({},first+5);
 assert.equal(gained.level,2);assert.equal(gained.xp,5);assert.equal(gained.levelsGained,1);
 const max=grantXP({level:99,xp:xpToNext(99)-1},1000);
 assert.equal(max.level,100);assert.equal(max.xp,0);assert.equal(xpToNext(100),0);
 const clean=safeAdventure({level:Infinity,xp:-2,den:{x:Infinity,y:22,z:0},beacons:[{},null]});
 assert.equal(clean.level,1);assert.equal(clean.xp,0);assert.equal(clean.den,null);
 assert.equal(clean.swordClaimed,false);
 assert.deepEqual(clean.beacons,[]);
});
test('winter mobs unlock gradually rather than spawning a boss for level one',()=>{
 assert.equal(chooseWinterMob(1,.999),'frostling');
 assert.equal(chooseWinterMob(3,.95),'snow_prowler');
 assert.equal(chooseWinterMob(8,.99),'glacier_guardian');
 assert.equal(winterMobLevel(1,'frostling',.1),1);
 assert.ok(winterMobLevel(3,'snow_prowler',.95)>=3);
 assert.ok(winterMobLevel(100,'glacier_guardian',1)<=10);
});
test('first dungeon progresses from frostlings to ice boss',()=>{
 const waves=trialWaves(2);
 assert.equal(waves.length,3);
 assert.equal(waves[0].length,2);
 assert.equal(waves[2][0].kind,'glacier_guardian');
 assert.ok(waves.flat().every(m=>m.level>=1&&m.level<=10));
});
test('ruins have unique floor, entrance gaps and a stable nearby location',()=>{
 const col=(x,z)=>({h:40+Math.abs(x%3),biome:3});
 const p=trialLocation({x:0,z:0},{column:col});
 assert.ok(p);assert.ok(Math.hypot(p.x,p.z)>20);
 const blocks=ruinBlocks(p);
 assert.ok(blocks.length>150);
 assert.ok(blocks.some(c=>c[0]===p.x&&c[1]===p.y-1&&c[2]===p.z&&c[3]===79));
 assert.ok(!blocks.some(c=>c[0]===p.x&&c[1]===p.y&&c[2]===p.z-6));
});
test('ward containment is local, and only saved beacon coordinates count',()=>{
 const a=safeAdventure({beacons:[{x:4,y:10,z:5}]});
 assert.equal(withinWard(5,5,a.beacons),true);
 assert.equal(withinWard(34,5,a.beacons),false);
});
