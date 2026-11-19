import test from 'node:test';
import assert from 'node:assert/strict';
import {safeExplorerJournal,visitExplorerLocation,journalStats,explorerMapPlaces,
  MAX_SURVEY_POINTS,MIN_SURVEY_SPACING,MAX_JOURNAL_ENTRIES,TERRAIN}
  from '../js/explorer-journal-core.js';
import {discoveredDungeons} from '../js/map-discoveries.js';
const p=(x=0,z=0,y=45)=>({x,y,z,onGround:true,flying:false,dead:false});
const sample=(biome=3,h=44)=>({biome,h});
const step=(raw,player,column,sites)=>visitExplorerLocation(raw,player,column,sites);

test('new and legacy saves contain no invented discovered places',()=>{
  const raw=safeExplorerJournal(null);
  assert.deepEqual(raw,{version:1,entries:[]});
  assert.deepEqual(safeExplorerJournal({version:0}),raw);
  assert.deepEqual(journalStats(raw),{terrain:0,dungeons:0,trails:0,total:0});
  assert.deepEqual(explorerMapPlaces(raw),[]);
  assert.equal(MAX_JOURNAL_ENTRIES,18);
  assert.equal(MAX_SURVEY_POINTS,10);
  assert.equal(MIN_SURVEY_SPACING,160);
});

test('only standing on actual snowy biome ground records one unique landscape',()=>{
  let state=null;
  let r=step(state,p(),sample());
  state=r.state;
  assert.deepEqual(r.added.map(e=>e.kind),['biome','survey']);
  assert.equal(state.entries[0].name,'Snowy Tundra');
  assert.equal(step(state,p(1,2),sample()).added.length,0);
  for(const [id,height,y] of [[4,70,71],[5,21,31],[6,30,31]]){
    r=step(state,p(70*id,0,y),sample(id,height));
    state=r.state;
    assert.ok(r.added.some(e=>e.id===TERRAIN[id].id),id+' recorded');
  }
  assert.equal(journalStats(state).terrain,4);
  assert.equal(step(state,p(2,1),sample(4,44)).added.length,0,
    'terrain biome card is one-time per world');
});

test('floating, dead, invalid or underground positions never become discoveries',()=>{
  const invalid=[
    {...p(),onGround:false},{...p(),flying:true},{...p(),dead:true},
    {...p(),y:400},{...p(),y:-10},{...p(),x:Infinity},
    {...p(),z:NaN}
  ];
  for(const player of invalid){
    assert.deepEqual(step(null,player,sample()).added,[],
      'must not credit invalid character '+JSON.stringify(player));
  }
  assert.deepEqual(step(null,p(),{biome:999,h:NaN}).added,[]);
  assert.deepEqual(step(null,p(),{biome:'3',h:44}).added,[]);
  assert.deepEqual(step(null,null,sample()).added,[]);
});

test('survey sites require real distance and are capped at ten and unique cells',()=>{
  let s=null;
  for(let i=0;i<16;i++){
    const x=i*192;
    s=step(s,p(x,0),sample()).state;
  }
  const trails=s.entries.filter(e=>e.kind==='survey');
  assert.equal(trails.length,MAX_SURVEY_POINTS);
  assert.equal(new Set(trails.map(e=>e.id)).size,MAX_SURVEY_POINTS);
  assert.equal(trails[0].x,0);
  assert.equal(trails.at(-1).x,9*192);
  assert.equal(step(s,p(3000,0),sample()).added.length,0);
  const map=explorerMapPlaces(s);
  assert.equal(map.length,11,'only one biome + ten trails');
  assert.ok(map.every(e=>e.x===Math.floor(e.x)&&e.z===Math.floor(e.z)));
});

test('dungeon visits only record real built known entrances within 20 blocks',()=>{
  const worldSites=discoveredDungeons({
    den:{x:200,z:300},denBuilt:true,
    storm:{site:{x:900,z:120},built:false},
    aurora:{site:{x:-300,z:100},built:true},
    abyss:{site:null,built:false}
  });
  let s=step(null,p(0,0),sample(),worldSites).state;
  assert.equal(journalStats(s).dungeons,0);
  s=step(s,p(200,294),sample(),worldSites).state;
  assert.equal(journalStats(s).dungeons,1);
  assert.equal(s.entries.find(e=>e.kind==='dungeon').name,'Frost Ruins');
  s=step(s,p(900,113),sample(),worldSites).state;
  assert.equal(journalStats(s).dungeons,1,'unbuilt fortress not visited');
  s=step(s,p(-300,92),sample(),worldSites).state;
  assert.equal(journalStats(s).dungeons,2);
  assert.equal(step(s,p(-300,92),sample(),worldSites).added.length,0);
  assert.equal(step(null,p(22,10),sample(),[
    {id:'map-frost-ruins',x:22,z:10,built:false}]).added.some(e=>e.kind==='dungeon'),false);
  assert.equal(step(null,p(22,10),sample(),[
    {id:'fake-dungeon',x:22,z:10,built:true}]).added.some(e=>e.kind==='dungeon'),false);
});

test('loading malformed and adversarial journal data never crashes or overflows',()=>{
  const raw={entries:[
    {id:'biome:3',name:'Spoof name',kind:'biome',x:4.8,z:-3.1},
    {id:'biome:3',name:'Duplicate',kind:'biome',x:5,z:4},
    {id:'dungeon:fake-dungeon',kind:'dungeon',x:0,z:1},
    {id:'survey:0:0',kind:'survey',x:2,z:3},
    {id:'survey:0:0',kind:'survey',x:4,z:5},
    {id:'survey:1:0',kind:'survey',x:100,z:0}, // too close to previous
    {id:'survey:2:0',kind:'survey',x:400,z:0},
    {id:'biome:4',kind:'biome',x:Infinity,z:0},
    {id:'dungeon:map-frost-ruins',kind:'dungeon',x:99999999,z:0}
  ]};
  const normal=safeExplorerJournal(raw);
  assert.equal(normal.entries.length,3);
  assert.equal(normal.entries[0].name,'Snowy Tundra');
  assert.ok(normal.entries.some(e=>e.id==='survey:2:0'));
  assert.deepEqual(safeExplorerJournal(JSON.parse(JSON.stringify(normal))),normal,
    'repeated load/save is stable');
  assert.equal(safeExplorerJournal({entries:new Array(10000).fill(null)}).entries.length,0);
  assert.equal(safeExplorerJournal({entries:'untrusted'}).entries.length,0);
});

test('portable world-save validator preserves optional journal from previous saves',async()=>{
  const {validateWorldSave}=await import('../js/world-save-guard.js');
  const base={seed:9,player:{x:0,y:45,z:0,inv:Array(36).fill(null)},
    edits:{},containers:{}};
  const withJournal={...base,journal:step(null,p(),sample()).state};
  assert.deepEqual(validateWorldSave(withJournal).journal,withJournal.journal);
  assert.equal(validateWorldSave(base).journal,undefined);
});
