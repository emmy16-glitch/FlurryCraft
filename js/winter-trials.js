// Small pure helpers for Winter Trials, awarding only offline Flurry Points.
// Caller verifies Survival/active gameplay. These checks limit phantom travel
// caused by tab stalls, teleports, knockback and invalid physics values.
export const TRIAL_MAX_STEP_SECONDS=.12;
export const TRIAL_MAX_WALK_SPEED=8.5; // normal/sprint/jump movement < this.
export const TRIAL_MAX_BATCH_DISTANCE=4;
export const TRIAL_MAX_SAVED_DISTANCE=2400;
export function isValidTravelStep(distance,dt){
  return Number.isFinite(distance)&&Number.isFinite(dt)&&
    dt>0&&dt<=TRIAL_MAX_STEP_SECONDS&&distance>0&&
    distance<=TRIAL_MAX_WALK_SPEED*dt+.035;
}
export function addTrialDistance(value,distance){
  if(!Number.isFinite(distance)||distance<=0||
     distance>TRIAL_MAX_BATCH_DISTANCE)return Math.max(0,Math.min(
       TRIAL_MAX_SAVED_DISTANCE,Number.isFinite(value)?value:0));
  const start=Number.isFinite(value)?Math.max(0,Math.min(value,TRIAL_MAX_SAVED_DISTANCE)):0;
  return Math.min(TRIAL_MAX_SAVED_DISTANCE,
    Math.round((start+distance)*1000)/1000);
}
export function trialProgressText(cards){
  const trials=Array.isArray(cards)?cards.filter(x=>
    x&&(x.kind==='parries'||x.kind==='travel')):[];
  return {total:trials.length,ready:trials.filter(x=>x.ready).length,
    completed:trials.filter(x=>x.claimed).length};
}
