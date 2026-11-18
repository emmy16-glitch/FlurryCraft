import test from 'node:test';
import assert from 'node:assert/strict';
import * as B from '../js/blocks.js';
import {Player} from '../js/player.js';
import {guardDamage,isSwordEquipped,GUARD_MAX_STAMINA,GUARD_BREAK_COOLDOWN}
  from '../js/combat-guard.js';

const strike=(overrides={})=>guardDamage({
  damage:10,guarding:true,elapsed:.1,stamina:100,yaw:0,x:0,z:0,
  sourceX:0,sourceZ:-2,type:'melee',...overrides
});

test('sword recognition requires an actual registered sword item',()=>{
  assert.equal(isSwordEquipped({id:B.toolId(3,0)},B.ITEMS),true);
  assert.equal(isSwordEquipped({id:B.AURORA_BLADE},B.ITEMS),true);
  assert.equal(isSwordEquipped({id:B.toolId(0,0)},B.ITEMS),false);
  assert.equal(isSwordEquipped(null,B.ITEMS),false);
  assert.equal(isSwordEquipped({id:123456},B.ITEMS),false);
});

test('perfect parry reduces damage by 85%, costs stamina and has a narrow window',()=>{
  const perfect=strike();
  assert.equal(perfect.blocked,true);
  assert.equal(perfect.perfect,true);
  assert.equal(perfect.damage,1.5);
  assert.equal(perfect.staminaCost,35);
  const ordinary=strike({elapsed:.3});
  assert.equal(ordinary.blocked,true);
  assert.equal(ordinary.perfect,false);
  assert.equal(ordinary.damage,4);
  assert.equal(strike({elapsed:.22}).perfect,true);
  assert.equal(strike({elapsed:.221}).perfect,false);
});

test('guard only protects facing enemy; rear, flanks and environmental damage bypass',()=>{
  assert.equal(strike({sourceZ:2}).blocked,false);
  assert.equal(strike({sourceX:4,sourceZ:0}).blocked,false);
  assert.equal(strike({type:'environment'}).blocked,false);
  assert.equal(strike({type:'explosion'}).blocked,false);
  assert.equal(strike({type:'pulse'}).blocked,false);
  assert.equal(strike({guarding:false}).blocked,false);
  assert.equal(strike({sourceX:0,sourceZ:0}).blocked,false);
  assert.equal(strike({sourceX:Infinity}).blocked,false);
  const projectile=strike({type:'projectile'});
  assert.equal(projectile.blocked,true);
});

test('stamina exhaustion cannot provide free perfect parries',()=>{
  const noStamina=strike({stamina:0});
  assert.equal(noStamina.blocked,false);
  assert.equal(noStamina.staminaCost,0);
  const exhausted=strike({stamina:10});
  assert.equal(exhausted.blocked,false);
  assert.equal(exhausted.damage,10);
  assert.equal(exhausted.staminaCost,10);
  assert.equal(strike({damage:1000,stamina:100}).blocked,false);
  assert.equal(GUARD_MAX_STAMINA,100);
});

function gameForPlayer(){
  const history=[];
  const game={adventure:{level:1,isShielded:()=>false},difficulty:1,
    sound:{play:(...args)=>history.push(args)},
    ui:{dirtyInv:false,toast:message=>history.push(message)},
    mobs:[],world:{
      getBlock(){return 0;},raycast(){return null;},collides(){return false;},
      moveEntity(p,dx,dy,dz){p.x+=dx;p.y+=dy;p.z+=dz;p.onGround=true;}
    },
    particles:{burst(){}},
    spawnItem(){},onPlayerDeath(){}};
  return {game,history};
}
test('real Player guards a frontal monster hit but not a rear hit or fall',()=>{
  const {game,history}=gameForPlayer(),p=new Player(game);
  game.player=p;
  p.inv[0]={id:B.toolId(3,0),n:1};
  p.x=0;p.z=0;p.yaw=0;p.creative=false;
  p.guarding=true;p.guardElapsed=.1;p.guardStamina=100;
  p.hurt(10,0,-2,'melee');
  assert.equal(p.health,22.5);
  assert.equal(p.guardStamina,65);
  assert.ok(history.includes('✦ Perfect Parry!'));
  p.invuln=0;
  p.hurt(5,0,2,'melee');
  assert.equal(p.health,17.5);
  p.invuln=0;
  p.hurt(3);
  assert.equal(p.health,14.5);
});

test('real Player breaks guard when stamina cannot cover a hit and resets on respawn',()=>{
  const {game}=gameForPlayer(),p=new Player(game);game.player=p;
  p.guarding=true;p.guardElapsed=.1;p.guardStamina=10;
  p.hurt(10,0,-2,'melee');
  assert.equal(p.health,14);
  assert.equal(p.guardStamina,0);
  assert.equal(p.guarding,false);
  assert.equal(p.guardCooldown,GUARD_BREAK_COOLDOWN);
  p.dead=true;p.respawn();
  assert.equal(p.guardStamina,100);
  assert.equal(p.guardCooldown,0);
  assert.equal(p.guarding,false);
});

test('guard stance prevents simultaneous block mining, attack and placement',()=>{
  const {game}=gameForPlayer(),p=new Player(game);game.player=p;
  p.inv[0]={id:B.toolId(3,0),n:1};
  const neutral={fwd:0,strafe:0,sneak:false,sprint:false,jump:false,
    guard:true,left:true,attackPressed:true,right:true,rightPressed:true};
  p.onGround=true;
  p.update(.016,neutral);
  assert.equal(p.guarding,true);
  assert.ok(p.guardStamina<100);
  assert.equal(p.sprinting,false);
  p.mineKey='old';p.mineT=12;
  p.updateInteraction(.016,neutral);
  assert.equal(p.mineKey,'');
  assert.equal(p.mineT,0);
  assert.equal(p.mineProgress,0);
  assert.equal(p.attackCd,0);
  assert.equal(p.placeCd,0);
  p.update(.016,{...neutral,guard:false,left:false,attackPressed:false,right:false});
  assert.equal(p.guarding,false);
  p.inv[0]={id:B.toolId(0,0),n:1};
  p.update(.016,neutral);
  assert.equal(p.guarding,false,'a pickaxe cannot raise sword guard');
});
