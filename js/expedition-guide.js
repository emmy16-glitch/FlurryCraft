// Quest-giver presentation and world guidance. Pure functions, no wallet or saved state.
// Never guess a destination for randomized monster spawns or player-built shelters.
const finite=(x)=>Number.isFinite(x);
export const LOFI_TALK_RADIUS=6.2;
export function nearLofi(player,npc,radius=LOFI_TALK_RADIUS){
  if(!player||!npc||![player.x,player.z,npc.x,npc.z,radius].every(finite)||radius<=0)return false;
  if(Number.isFinite(player.y)&&Number.isFinite(npc.y)&&
     Math.abs(player.y-npc.y)>4.5)return false;
  return Math.hypot(player.x-npc.x,player.z-npc.z)<=radius;
}
export function lofiQuestDialogue(expedition,creative=false){
  const board=expedition||{},m=board.mission;
  if(creative)return {
    greeting:'Welcome to my winter workshop! Switch to Survival to earn Expedition XP and local points.',
    action:'View Expedition Board',icon:'?',status:'Creative Mode'
  };
  if(board.done)return {
    greeting:'You finished every winter expedition! I knew you had the courage to protect this snowy world.',
    action:'View your achievements',icon:'★',status:'All contracts completed'
  };
  if(!m||!m.active)return {
    greeting:'The frost is spreading. Will you help me protect our village? Accept a contract and I will track every step.',
    action:m?'Accept '+m.title:'View Expedition Board',icon:'?',status:'New contract'
  };
  if(m.ready)return {
    greeting:'You did it! Your mission is complete. Come collect the reward you earned.',
    action:'Claim '+m.title,icon:'✓',status:'Reward ready'
  };
  const guidance=m.kind==='clears'?
    'Follow the world-map compass to the Frost Ruins entrance.':
    m.kind==='kills'?'Use your sword and guard against winter creatures.':
    'Place blocks yourself near your character to build shelter.';
  return {
    greeting:m.title+': '+m.progress+' of '+m.target+' completed. '+guidance,
    action:'View Expedition Board',icon:'!',status:'Mission in progress'
  };
}
export function expeditionGuideTarget(expedition,adventure){
  const m=expedition?.mission;
  if(!m?.active||m.ready||m.kind!=='clears')return null;
  const den=adventure?.den;
  if(!den||![den.x,den.z].every(finite))return null;
  if(Math.abs(den.x)>1000000||Math.abs(den.z)>1000000)return null;
  // Entry is on the north side of the multi-room Frost Ruins.
  return {id:'expedition-frost-ruins',name:'Frost Ruins entrance',
    x:Math.floor(den.x),z:Math.floor(den.z-6)};
}
export function lofiWaypoint(npc){
  if(!npc||![npc.x,npc.z].every(finite))return null;
  return {id:'lofi-guide',name:'Lofi the Yeti',
    x:Math.floor(npc.x),z:Math.floor(npc.z)};
}
