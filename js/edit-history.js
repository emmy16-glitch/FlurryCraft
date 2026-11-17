// FlurryCraft's bounded, session-only voxel edit history.
// Keeps browser storage clean and never records terrain generation automatically.
// The game explicitly opens edit transactions for player actions and smart builds.
export class EditHistory {
  constructor({maxSteps=40,maxCells=6000}={}) {
    this.maxSteps=maxSteps;this.maxCells=maxCells;
    this.world=null;this.undoStack=[];this.redoStack=[];
    this.active=null;this.applying=false;
  }
  reset(world){
    this.world=world;this.undoStack=[];this.redoStack=[];
    this.active=null;this.applying=false;
  }
  begin(world,label='Build'){
    if(!world||this.applying||this.active)return false;
    if(this.world!==world)this.reset(world);
    this.active={world,label:String(label).slice(0,48),cells:new Map(),overflow:false};
    return true;
  }
  record(world,x,y,z,oldId,newId){
    const tx=this.active;
    if(this.applying||!tx||tx.world!==world||oldId===newId||tx.overflow)return;
    if(![x,y,z,oldId,newId].every(Number.isInteger))return;
    const key=x+','+y+','+z,previous=tx.cells.get(key);
    if(previous){previous[4]=newId;return;}
    if(tx.cells.size>=this.maxCells){tx.overflow=true;tx.cells.clear();return;}
    tx.cells.set(key,[x,y,z,oldId,newId]);
  }
  finish(){
    const tx=this.active;this.active=null;
    if(!tx||tx.overflow)return {ok:false,reason:tx?.overflow?'too_large':'empty'};
    return this.push(tx.world,tx.label,[...tx.cells.values()]);
  }
  cancel(){this.active=null;}
  push(world,label,changes){
    if(!world||this.applying||!Array.isArray(changes)||changes.length>this.maxCells)
      return {ok:false,reason:'too_large'};
    if(this.world!==world)this.reset(world);
    const map=new Map();
    for(const c of changes){
      if(!Array.isArray(c)||c.length!==5||!c.every(Number.isInteger))
        return {ok:false,reason:'invalid'};
      const key=c[0]+','+c[1]+','+c[2],first=map.get(key);
      if(first)first[4]=c[4];
      else map.set(key,[...c]);
    }
    const edits=[...map.values()].filter(c=>c[3]!==c[4]);
    if(!edits.length)return {ok:false,reason:'empty'};
    if(edits.length>this.maxCells)return {ok:false,reason:'too_large'};
    this.undoStack.push({label:String(label||'Build').slice(0,48),edits});
    if(this.undoStack.length>this.maxSteps)this.undoStack.shift();
    this.redoStack.length=0;
    return {ok:true,count:edits.length};
  }
  get canUndo(){return !!this.undoStack.length;}
  get canRedo(){return !!this.redoStack.length;}
  apply(world,direction,canWrite=()=>true){
    if(this.applying||this.active)return {ok:false,reason:'busy'};
    if(this.world!==world)return {ok:false,reason:'world'};
    const undo=direction==='undo';
    const from=undo?this.undoStack:this.redoStack,to=undo?this.redoStack:this.undoStack;
    const tx=from[from.length-1];
    if(!tx)return {ok:false,reason:'empty'};
    // Preflight *all* cells: never silently erase work built afterward.
    for(const [x,y,z,before,after] of tx.edits){
      const expected=undo?after:before,target=undo?before:after;
      if(!world.loaded(x,z)||world.getBlock(x,y,z)!==expected)return {ok:false,reason:'changed'};
      if(!canWrite(x,y,z,target))return {ok:false,reason:'blocked'};
    }
    this.applying=true;
    const applied=[];
    try{
      for(const [x,y,z,before,after] of tx.edits){
        const previous=undo?after:before,target=undo?before:after;
        if(world.setBlock(x,y,z,target)===false)
          throw new Error('World could not apply an edit');
        applied.push([x,y,z,previous]);
      }
    }catch{
      // Best-effort rollback if a chunk becomes unavailable unexpectedly.
      for(let i=applied.length-1;i>=0;i--){
        const [x,y,z,id]=applied[i];if(world.loaded(x,z))world.setBlock(x,y,z,id);
      }
      return {ok:false,reason:'failed'};
    }finally{this.applying=false;}
    from.pop();to.push(tx);
    return {ok:true,count:tx.edits.length,label:tx.label};
  }
  undo(world,canWrite){return this.apply(world,'undo',canWrite);}
  redo(world,canWrite){return this.apply(world,'redo',canWrite);}
}
