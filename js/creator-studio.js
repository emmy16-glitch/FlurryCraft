// FlurryCraft Creator Studio: deterministic blueprints, integrity hashes, free starter builds.
// Pure data functions are testable in Node and do not require Three.js or a wallet.
export const MAX_BLUEPRINT_BLOCKS = 6000;
export const MAX_BLUEPRINT_SIDE = 32;
export function normalizeBlueprint(input, allowed = id => id >= 1 && id < 128) {
  if (!input || typeof input !== 'object' || input.version !== 1 ||
      !Array.isArray(input.size) || input.size.length !== 3 ||
      !Array.isArray(input.blocks)) throw new Error('Unrecognized FlurryCraft blueprint.');
  const size = input.size;
  if (!size.every(v => Number.isInteger(v) && v > 0 && v <= MAX_BLUEPRINT_SIDE) ||
      size[0] * size[1] * size[2] > 32768) throw new Error('Blueprint dimensions exceed 32 blocks per side.');
  if (input.blocks.length < 1 || input.blocks.length > MAX_BLUEPRINT_BLOCKS)
    throw new Error('Blueprint must contain 1–6,000 blocks.');
  const seen = new Set(), blocks = [];
  for (const block of input.blocks) {
    if (!Array.isArray(block) || block.length !== 4 || !block.every(Number.isInteger))
      throw new Error('Invalid blueprint block entry.');
    const [x,y,z,id] = block;
    if (x < 0 || x >= size[0] || y < 0 || y >= size[1] || z < 0 || z >= size[2] ||
        !allowed(id)) throw new Error('Blueprint contains an invalid or unsafe block.');
    const key = x+','+y+','+z;
    if (seen.has(key)) throw new Error('Blueprint contains overlapping blocks.');
    seen.add(key);
    blocks.push([x,y,z,id]);
  }
  // Stable, independent of upload/order, creator/title or in-memory object layout.
  blocks.sort((a,b) => a[1]-b[1] || a[2]-b[2] || a[0]-b[0]);
  return {
    version:1,
    name:String(input.name || 'Untitled creation').trim().slice(0,48) || 'Untitled creation',
    author:String(input.author || 'Yeti Builder').trim().slice(0,48) || 'Yeti Builder',
    size:[...size],
    blocks
  };
}
export function canonicalBlueprintContent(input) {
  const data = normalizeBlueprint(input);
  return JSON.stringify(['FlurryCraft:voxel-blueprint:v1', data.size, data.blocks]);
}
export async function blueprintFingerprint(input, subtle = globalThis.crypto?.subtle) {
  if (!subtle || typeof subtle.digest !== 'function')
    throw new Error('SHA-256 requires a secure browser context (HTTPS).');
  const bytes = new TextEncoder().encode(canonicalBlueprintContent(input));
  const buffer = await subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(buffer)].map(n=>n.toString(16).padStart(2,'0')).join('');
}
export function blueprintSummary(input) {
  const data=normalizeBlueprint(input);
  const materials=new Map();
  for (const item of data.blocks) materials.set(item[3],(materials.get(item[3])||0)+1);
  return {
    blockCount:data.blocks.length,
    dimensions:data.size.join(' × '),
    materialCount:materials.size,
    dominantId:[...materials].sort((a,b)=>b[1]-a[1])[0][0],
    volume:data.size[0]*data.size[1]*data.size[2],
  };
}
export function downloadName(name) {
  const slug=String(name||'creation').toLowerCase().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'').slice(0,38);
  return 'flurrycraft-'+(slug||'creation')+'.json';
}
export function makeStarterBlueprints(B) {
  const build=(name,author,size,draw)=>{
    const cells=new Map();
    const put=(x,y,z,id)=>{
      if(x<0||x>=size[0]||y<0||y>=size[1]||z<0||z>=size[2])
        throw new Error('Invalid starter design');
      cells.set(x+','+y+','+z,[x,y,z,id]);
    };
    draw(put);
    return normalizeBlueprint({version:1,name,author,size,blocks:[...cells.values()]});
  };
  const cabin=build('Cozy Snow Cabin','FlurryCraft Starter Designs',[9,6,9],put=>{
    for(let x=0;x<9;x++)for(let z=0;z<9;z++){
      put(x,0,z,B.SPRUCE_PLANKS);
      put(x,5,z,B.SNOW);
    }
    for(let y=1;y<=4;y++)for(let n=0;n<9;n++){
      put(n,y,0,B.SPRUCE_PLANKS);put(n,y,8,B.SPRUCE_PLANKS);
      put(0,y,n,B.SPRUCE_PLANKS);put(8,y,n,B.SPRUCE_PLANKS);
    }
    for(const y of [1,2]) put(4,y,0,B.DOOR_CLOSED);
    for(const [x,y,z] of [[2,2,0],[6,2,0],[0,2,4],[8,2,4],[4,2,8]])
      put(x,y,z,B.WINDOW_PANE);
    put(3,1,4,B.WOOD_TABLE);put(3,1,5,B.WOOD_CHAIR);
    put(6,1,6,B.FIREPLACE);put(6,1,3,B.COZY_BED);
  });
  const workshop=build('Crystal Ice Workshop','FlurryCraft Starter Designs',[9,6,9],put=>{
    for(let x=0;x<9;x++)for(let z=0;z<9;z++){
      put(x,0,z,B.STONE_BRICKS);
      put(x,5,z,B.ICE);
    }
    for(let y=1;y<=4;y++)for(let n=0;n<9;n++){
      put(n,y,0,B.ICE);put(n,y,8,B.ICE);
      put(0,y,n,B.ICE);put(8,y,n,B.ICE);
    }
    for(const y of [1,2])put(4,y,0,B.DOOR_CLOSED);
    for(const [x,y,z] of [[2,2,0],[6,2,0],[0,2,3],[0,2,6],[8,2,3],[8,2,6]])
      put(x,y,z,B.WINDOW_PANE);
    put(3,1,4,B.WOOD_TABLE);put(5,1,4,B.WOOD_CHAIR);
    put(3,1,6,B.CRAFTING);put(6,1,6,B.FIREPLACE);
  });
  return [cabin,workshop];
}
// Tiny isometric schematic thumbnail: a convenience preview, not a screenshot.
export function drawBlueprintCard(canvas,input,blockColor=()=> '#8ad5f0') {
  if(!canvas?.getContext)return;
  const data=normalizeBlueprint(input),ctx=canvas.getContext('2d');
  if(!ctx)return;
  const w=canvas.width||260,h=canvas.height||150;
  ctx.clearRect(0,0,w,h);
  const bg=ctx.createLinearGradient(0,0,0,h);
  bg.addColorStop(0,'#153e59');bg.addColorStop(1,'#071e31');
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  const [sx,sy,sz]=data.size;
  const scale=Math.max(2.5,Math.min(11,(w-24)/(sx+sz+1),(h-20)/(0.56*(sx+sz)+1.3*sy)));
  const x0=w/2+(sz-sx)*scale*.06,y0=h-14-(sx+sz)*scale*.44;
  const columns=new Map();
  for(const [x,y,z,id] of data.blocks){
    const k=x+','+z,old=columns.get(k);
    if(!old||y>old.y)columns.set(k,{x,y,z,id});
  }
  const cells=[...columns.values()].sort((a,b)=>a.x+a.z-b.x-b.z);
  const poly=(points,color)=>{
    ctx.beginPath();ctx.moveTo(...points[0]);
    for(const p of points.slice(1))ctx.lineTo(...p);
    ctx.closePath();ctx.fillStyle=color;ctx.fill();
  };
  const vary=(color,scale)=>{
    const c=String(color||'#7ec0dd').match(/^#([0-9a-f]{6})$/i);
    if(!c)return '#52829a';
    const hex=c[1],out=[0,2,4].map(i=>Math.max(0,Math.min(255,Math.round(parseInt(hex.slice(i,i+2),16)*scale))));
    return '#'+out.map(n=>n.toString(16).padStart(2,'0')).join('');
  };
  for(const {x,y,z,id} of cells){
    const px=x0+(x-z)*scale,py=y0+(x+z)*scale*.43-y*scale*.87;
    const col=blockColor(id);
    poly([[px,py],[px+scale,py+scale*.43],[px,py+scale*.86],[px-scale,py+scale*.43]],vary(col,1.07));
    poly([[px-scale,py+scale*.43],[px,py+scale*.86],[px,py+scale*.86+scale*.7],[px-scale,py+scale*.43+scale*.7]],vary(col,.75));
    poly([[px,py+scale*.86],[px+scale,py+scale*.43],[px+scale,py+scale*.43+scale*.7],[px,py+scale*.86+scale*.7]],vary(col,.89));
  }
  ctx.fillStyle='#d7f8ff';ctx.font='600 11px system-ui';
  ctx.fillText(data.size.join(' × ')+' · '+data.blocks.length+' blocks',9,h-7);
}
