import * as THREE from 'three';
import { weatherProfile, stormIntensity, snowParticleBudget, isShelteredSurface } from './winter-weather.js';

// Winter World 2.0: permanent snow, wind-driven whiteouts, and a tiny GPU footprint.
// Snow rendering uses two reusable geometry buffers and two draw calls; no new
// sprites, textures or DOM nodes are created in the animation loop.
function createSnowflakeTexture() {
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=48;
  const ctx=canvas.getContext('2d');
  const gradient=ctx.createRadialGradient(24,24,2,24,24,23);
  gradient.addColorStop(0,'rgba(255,255,255,1)');
  gradient.addColorStop(.36,'rgba(255,255,255,.95)');
  gradient.addColorStop(.72,'rgba(232,246,255,.52)');
  gradient.addColorStop(1,'rgba(232,246,255,0)');
  ctx.fillStyle=gradient;
  ctx.fillRect(0,0,48,48);
  const tex=new THREE.CanvasTexture(canvas);
  tex.minFilter=THREE.LinearFilter;
  tex.magFilter=THREE.LinearFilter;
  tex.generateMipmaps=false;
  return tex;
}
function createSnowField(scene,count,radius,size,texture,opacity){
  const positions=new Float32Array(count*3);
  const offsets=new Float32Array(count*3);
  for(let i=0;i<count;i++){
    const k=i*3;
    const a=Math.random()*Math.PI*2;
    const distance=Math.sqrt(Math.random())*radius;
    offsets[k]=Math.cos(a)*distance;
    offsets[k+1]=Math.random()*32-9;
    offsets[k+2]=Math.sin(a)*distance;
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geometry.boundingSphere=new THREE.Sphere(new THREE.Vector3(0,0,0),1e5);
  const material=new THREE.PointsMaterial({
    color:0xf8fcff,size,map:texture,transparent:true,opacity,
    depthWrite:false,depthTest:true,alphaTest:.015,sizeAttenuation:true,
  });
  const points=new THREE.Points(geometry,material);
  points.frustumCulled=false;
  points.visible=false;
  points.renderOrder=14;
  scene.add(points);
  return {positions,offsets,geometry,material,points,count,radius};
}
export class Weather {
  constructor(scene,game){
    this.game=game;this.scene=scene;
    this.mode='storm';
    this.time=0;this.phase=0;this.timer=0;
    this.intensity=.84;this.target=.84;
    this.flash=0;this.thunderIn=-1;this.wind=0;
    this._fpsAccumulator=0;this._frames=0;this._quality=1;
    this._isCoarse=(typeof matchMedia==='function'&&matchMedia('(pointer: coarse)').matches) ||
      (typeof navigator!=='undefined'&&navigator.maxTouchPoints>0);
    const n=this._isCoarse?580:1080;
    this.texture=createSnowflakeTexture();
    this.near=createSnowField(scene,Math.floor(n*.3),9,.49,this.texture,.87);
    this.far=createSnowField(scene,n,27,.32,this.texture,.78);
    this.snow=this.far.points; // Retain reference for existing browser integrations.
    this.rain=null; // A winter-only world should never spawn rain streaks.
    this.windNode=null;
  }
  get raining(){return this.intensity>.45;}
  setMode(input){
    const mode=typeof input==='string'?input:'storm';
    this.mode=['storm','snowfall','calm'].includes(mode)?mode:'storm';
    const p=weatherProfile(this.mode);
    this.target=(p.min+p.max)/2;
    this.intensity=this.target;
    this.timer=0;
    return this.mode;
  }
  _adaptQuality(dt){
    this._fpsAccumulator+=dt;this._frames++;
    if(this._fpsAccumulator<2)return;
    const fps=this._frames/this._fpsAccumulator;
    // No sudden reallocations or sharp quality jumps during a storm.
    if(fps<23)this._quality=Math.max(.5,this._quality-.16);
    else if(fps>44)this._quality=Math.min(1,this._quality+.09);
    this._frames=0;this._fpsAccumulator=0;
  }
  _moveSnow(field,cam,world,dt,wind,intensity,limit,seed){
    const {positions,offsets,count,geometry,points,radius}=field;
    const num=Math.max(0,Math.min(count,limit));
    const t=this.time;
    const drift=wind*(.4+intensity*.35);
    for(let i=0;i<num;i++){
      const k=i*3;
      let altitude=offsets[k+1]-dt*(3+intensity*3.2)*(0.85+(i%7)*.052);
      if(altitude< -9)altitude+=32;
      offsets[k+1]=altitude;
      const sway=Math.sin(t*(.7+i%5*.06)+i*1.78)*(.16+intensity*.23);
      const x=cam.position.x+offsets[k]+Math.sin(t*.11+seed)*drift*1.5+sway;
      const y=cam.position.y+altitude;
      const z=cam.position.z+offsets[k+2]+Math.cos(t*.086+seed)*drift*1.2+
        Math.sin(t*.45+i*.57)*.18;
      let hidden=y<cam.position.y-9;
      if(!hidden){
        const chunk=world.getChunk(Math.floor(x/16),Math.floor(z/16));
        if(chunk){
          const top=chunk.hm[(Math.floor(x)&15)+((Math.floor(z)&15)<<4)];
          if(isShelteredSurface(top,y))hidden=true;
        }
      }
      positions[k]=hidden?cam.position.x:x;
      positions[k+1]=hidden?-1000:y;
      positions[k+2]=hidden?cam.position.z:z;
    }
    geometry.attributes.position.needsUpdate=true;
    geometry.setDrawRange(0,num);
    points.visible=num>0;
  }
  _updateWindAudio(sound,player,intensity){
    if(!sound?.ctx)return;
    const c=sound.ctx;
    if(!this.windNode&&sound.noise&&sound.sfx){
      const src=c.createBufferSource();
      src.buffer=sound.noise;src.loop=true;
      const filter=c.createBiquadFilter();
      filter.type='lowpass';filter.frequency.value=430;
      const gain=c.createGain();gain.gain.value=0;
      src.connect(filter);filter.connect(gain);gain.connect(sound.sfx);
      src.start();
      this.windNode={src,filter,gain};
    }
    if(!this.windNode)return;
    const outdoor=player.headWater?.14:1;
    const volume=weatherProfile(this.mode).wind*(.018+intensity*.022)*outdoor;
    this.windNode.gain.gain.setTargetAtTime(volume,c.currentTime,.28);
    this.windNode.filter.frequency.setTargetAtTime(350+intensity*520,c.currentTime,.35);
  }
  update(dt,cam,player,world,sound){
    if(!world||!player||!cam)return;
    this.time+=dt;
    this._adaptQuality(dt);
    const mode=this.mode,profile=weatherProfile(mode);
    this.phase+=dt*(mode==='storm'?.14:mode==='snowfall'?.1:.07);
    // Permanent snowfall: storms rise and ease without ever revealing rain.
    const oscillation=stormIntensity(mode,this.phase);
    this.target=oscillation;
    this.intensity+=(this.target-this.intensity)*Math.min(1,dt*.8);
    this.intensity=Math.max(profile.min,Math.min(profile.max,this.intensity));
    const gust=Math.sin(this.time*.41)+.4*Math.sin(this.time*1.23+.7);
    this.wind=profile.wind+profile.gust*gust;
    // Performance preset trims snow-fill cost without changing the storm mode.
    const budget=this._quality*(this.graphicsPreset==='performance'?.72:1);
    const nearCount=snowParticleBudget(this.near.count,mode,budget,this.intensity);
    const farCount=snowParticleBudget(this.far.count,mode,budget,this.intensity);
    this._moveSnow(this.far,cam,world,dt,this.wind,this.intensity,farCount,0);
    this._moveSnow(this.near,cam,world,dt,this.wind*1.3,this.intensity,nearCount,2.5);
    this.far.material.opacity=Math.min(.94,.46+.42*this.intensity);
    this.near.material.opacity=Math.min(.98,.68+.26*this.intensity);
    this._updateWindAudio(sound,player,this.intensity);
    this.flash=0; // No summer lightning in a perpetual snow world.
  }
}
