// GENESIS core — headless neuroevolution ecosystem for tuning/verification (Node).
// Goal: prove that adaptive foraging EVOLVES from random brains (selection, not drift).
// Once verified here, this logic is ported into index.html.

// ---- tunable parameters ----
export const P = {
  WORLD: 1000,
  POP_CAP: 1600,
  POP_START: 400,
  MIN_POP: 30,            // immigration floor (anti-extinction)
  FOOD_CAP: 2000,
  FOOD_SPAWN: 10,         // pellets added per step (until cap)
  FOOD_ENERGY: 30,        // richer pellets → worth seeking
  START_ENERGY: 55,
  BASE_META: 0.05,        // energy/step just to exist
  SIZE_META: 0.055,       // * size  (makes big bodies genuinely expensive)
  SENSE_META: 0.0004,     // * senseRadius (cheaper sight → vision niche viable)
  MOVE_META: 0.07,        // * actualSpeed (real cost → speed optimum, not always max)
  MAX_TURN: 0.5,          // rad/step at |turn|=1
  EAT_RADIUS: 9,          // + size to consume food
  REPRO_FRAC: 0.62,       // reproduce when energy > frac*maxEnergy
  CHILD_FRAC: 0.5,        // child gets this share of parent energy
  MUT_SIGMA: 0.16,        // gaussian std added to mutated genes
  MUT_P: 0.5,             // prob each gene mutates a little
  MUT_BIG_P: 0.03,        // prob of a large mutation per gene
  CARNIVORY: true,
  BITE_GAIN: 0.5,         // share of victim energy gained
  PREY_RATIO: 0.7,        // can only eat creatures smaller than size*PREY_RATIO
};

// brain shape
const I = 10, H = 8, O = 3;
const BRAIN = I*H + H + H*O + O;        // 115
const NB = 4;                            // body genes: size, speed, sense, hue
const GLEN = NB + BRAIN;                 // genome length

// ---- RNG (deterministic) ----
let rng = 1234567;
function rnd(){ let x=rng; x^=x<<13; x^=x>>>17; x^=x<<5; rng=x>>>0; return rng/4294967296; }
function gauss(){ let u=0,v=0; while(u===0)u=rnd(); while(v===0)v=rnd(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
const sigmoid = x => 1/(1+Math.exp(-x));

// ---- gene → trait maps ----
const geneSize  = g => 3 + sigmoid(g)*9;       // [3,12]
const geneSpeed = g => 1.4 + sigmoid(g)*4.2;    // [1.4,5.6]
const geneSense = g => 55 + sigmoid(g)*185;     // [55,240]
const geneHue   = g => { let h=g%1; return h<0?h+1:h; };

export function makeWorld(){
  const C = P.POP_CAP;
  const w = {
    n:0, cap:C,
    x:new Float32Array(C), y:new Float32Array(C), dir:new Float32Array(C),
    energy:new Float32Array(C), age:new Float32Array(C), gen:new Int32Array(C),
    alive:new Uint8Array(C), eaten:new Float32Array(C),
    gene:new Float32Array(C*GLEN),
    // food
    fx:new Float32Array(P.FOOD_CAP), fy:new Float32Array(P.FOOD_CAP), fn:0,
    free:[], births:[], steps:0, maxGen:0, totalDeaths:0, killEvents:0,
    // metrics
    _alignSum:0, _alignN:0,
  };
  for(let i=0;i<P.POP_START;i++) spawnRandom(w);
  for(let i=0;i<P.FOOD_CAP*0.6;i++) spawnFood(w);
  return w;
}

function randomGenome(out, off){
  for(let k=0;k<GLEN;k++) out[off+k]=gauss()*1.0;
}
function spawnRandom(w){
  const i = allocCreature(w); if(i<0) return -1;
  randomGenome(w.gene, i*GLEN);
  initCreature(w, i, rnd()*P.WORLD, rnd()*P.WORLD, 0, P.START_ENERGY);
  return i;
}
function allocCreature(w){
  if(w.free.length) { const i=w.free.pop(); return i; }
  if(w.n<w.cap) return w.n++;
  return -1;
}
function initCreature(w,i,x,y,gen,energy){
  w.x[i]=x; w.y[i]=y; w.dir[i]=rnd()*Math.PI*2;
  w.energy[i]=energy; w.age[i]=0; w.gen[i]=gen; w.alive[i]=1; w.eaten[i]=0;
  if(gen>w.maxGen) w.maxGen=gen;
}
function spawnFood(w){
  if(w.fn>=P.FOOD_CAP) return;
  w.fx[w.fn]=rnd()*P.WORLD; w.fy[w.fn]=rnd()*P.WORLD; w.fn++;
}

// ---- spatial hash ----
function buildGrid(px,py,n,cell,W){
  const cols=Math.max(1,Math.floor(W/cell));
  const heads=new Int32Array(cols*cols).fill(-1);
  const next=new Int32Array(n).fill(-1);
  for(let i=0;i<n;i++){
    let cx=(px[i]/cell)|0, cy=(py[i]/cell)|0;
    if(cx<0)cx=0;else if(cx>=cols)cx=cols-1;
    if(cy<0)cy=0;else if(cy>=cols)cy=cols-1;
    const c=cx+cy*cols; next[i]=heads[c]; heads[c]=i;
  }
  return {cols,cell,heads,next};
}
function wrapDelta(d,W){ if(d>W*0.5)d-=W; else if(d<-W*0.5)d+=W; return d; }

function nearest(grid,px,py,n,x,y,R,W,skip,aliveArr){
  const {cols,cell,heads,next}=grid;
  const r=Math.ceil(R/cell);
  let cx=(x/cell)|0, cy=(y/cell)|0;
  let best=-1, bestD2=R*R;
  for(let oy=-r;oy<=r;oy++){
    let ny=cy+oy; ny=((ny%cols)+cols)%cols;
    for(let ox=-r;ox<=r;ox++){
      let nx=cx+ox; nx=((nx%cols)+cols)%cols;
      let p=heads[nx+ny*cols];
      while(p!==-1){
        if(p!==skip && (!aliveArr || aliveArr[p])){
          const dx=wrapDelta(px[p]-x,W), dy=wrapDelta(py[p]-y,W);
          const d2=dx*dx+dy*dy;
          if(d2<bestD2){ bestD2=d2; best=p; }
        }
        p=next[p];
      }
    }
  }
  return best>=0 ? {i:best, d:Math.sqrt(bestD2)} : null;
}

// ---- brain ----
const _h=new Float32Array(H), _in=new Float32Array(I);
function think(gene, off, inp){
  let bw=off+NB;
  for(let j=0;j<H;j++){
    let s=gene[bw + I*H + j]; // b1
    for(let i=0;i<I;i++) s+=inp[i]*gene[bw + i*H + j];
    _h[j]=Math.tanh(s);
  }
  let w2=bw+I*H+H;
  const o0base=w2+H*O;
  let o0=gene[o0base], o1=gene[o0base+1], o2=gene[o0base+2];
  for(let j=0;j<H;j++){ o0+=_h[j]*gene[w2+j*O]; o1+=_h[j]*gene[w2+j*O+1]; o2+=_h[j]*gene[w2+j*O+2]; }
  return [sigmoid(o0), Math.tanh(o1), sigmoid(o2)];
}

// ---- step ----
export function step(w){
  const W=P.WORLD;
  // spawn food
  for(let s=0;s<P.FOOD_SPAWN;s++) spawnFood(w);
  // grids
  const cre = buildGrid(w.x,w.y,w.n,120,W);   // creatures
  const foodGrid = buildGrid(w.fx,w.fy,w.fn,120,W);
  w.births.length=0;
  let alignSum=0, alignN=0;
  const foodEaten=new Uint8Array(w.fn);

  for(let i=0;i<w.n;i++){
    if(!w.alive[i]) continue;
    const off=i*GLEN;
    const size=geneSize(w.gene[off]), maxSpd=geneSpeed(w.gene[off+1]), sense=geneSense(w.gene[off+2]);
    const x=w.x[i], y=w.y[i], dir=w.dir[i];
    const maxE = 45 + size*9;

    // ---- sense ----
    const nf = nearest(foodGrid, w.fx,w.fy,w.fn, x,y, sense, W, -1, null);
    const nc = nearest(cre, w.x,w.y,w.n, x,y, sense, W, i, w.alive);
    _in[0]=1; // bias
    _in[1]=Math.min(1,w.energy[i]/maxE);
    _in[2]=0; // filled after we know speed; use last speed proxy -> use thrust later; set 0
    if(nf){ const dx=wrapDelta(w.fx[nf.i]-x,W), dy=wrapDelta(w.fy[nf.i]-y,W); const a=Math.atan2(dy,dx)-dir;
      _in[3]=1-nf.d/sense; _in[4]=Math.sin(a); _in[5]=Math.cos(a);
      // foraging alignment metric: heading vs food dir
      const fa=Math.cos(a); alignSum+=fa; alignN++;
    } else { _in[3]=0;_in[4]=0;_in[5]=0; }
    if(nc){ const dx=wrapDelta(w.x[nc.i]-x,W), dy=wrapDelta(w.y[nc.i]-y,W); const a=Math.atan2(dy,dx)-dir;
      const osize=geneSize(w.gene[nc.i*GLEN]);
      _in[6]=1-nc.d/sense; _in[7]=Math.sin(a); _in[8]=Math.cos(a); _in[9]=Math.tanh((osize-size)*0.3);
    } else { _in[6]=0;_in[7]=0;_in[8]=0;_in[9]=0; }

    // ---- think ----
    const [thrust,turn,bite]=think(w.gene,off,_in);

    // ---- act ----
    let nd=dir+turn*P.MAX_TURN; if(nd>Math.PI)nd-=2*Math.PI; else if(nd<-Math.PI)nd+=2*Math.PI;
    const spd=thrust*maxSpd;
    let nx=x+Math.cos(nd)*spd, ny=y+Math.sin(nd)*spd;
    nx-=Math.floor(nx/W)*W; ny-=Math.floor(ny/W)*W;
    w.dir[i]=nd; w.x[i]=nx; w.y[i]=ny; w.age[i]++;

    // metabolism
    let cost=P.BASE_META + P.SIZE_META*size + P.SENSE_META*sense + P.MOVE_META*spd;
    w.energy[i]-=cost;

    // eat food
    const er=P.EAT_RADIUS+size;
    const fnear=nearest(foodGrid, w.fx,w.fy,w.fn, nx,ny, er, W, -1, null);
    if(fnear && !foodEaten[fnear.i]){ foodEaten[fnear.i]=1; w.energy[i]+=P.FOOD_ENERGY; w.eaten[i]++; }

    // bite (carnivory): eat a smaller creature in front
    if(P.CARNIVORY && bite>0.55 && nc){
      const osize=geneSize(w.gene[nc.i*GLEN]);
      if(w.alive[nc.i] && osize < size*P.PREY_RATIO && nc.d < er+geneSize(w.gene[nc.i*GLEN])){
        // must be roughly in front
        const dx=wrapDelta(w.x[nc.i]-nx,W), dy=wrapDelta(w.y[nc.i]-ny,W); const a=Math.atan2(dy,dx)-w.dir[i];
        if(Math.cos(a)>0.3){ w.energy[i]+=Math.min(maxE, w.energy[nc.i]*P.BITE_GAIN); w.eaten[i]++; w.killEvents=(w.killEvents|0)+1; killCreature(w,nc.i); }
      }
    }

    if(w.energy[i]>maxE) w.energy[i]=maxE;

    // reproduce
    if(w.energy[i] > P.REPRO_FRAC*maxE){
      const give=w.energy[i]*P.CHILD_FRAC; w.energy[i]-=give;
      w.births.push({parent:i, energy:give});
    }
    // death
    if(w.energy[i]<=0){ killCreature(w,i); }
  }

  // apply births
  for(const b of w.births){
    const ci=allocCreature(w); if(ci<0) break;
    const po=b.parent*GLEN, co=ci*GLEN;
    for(let k=0;k<GLEN;k++){
      let g=w.gene[po+k];
      if(rnd()<P.MUT_P) g+=gauss()*P.MUT_SIGMA;
      if(rnd()<P.MUT_BIG_P) g+=gauss()*1.0;
      w.gene[co+k]=g;
    }
    const ang=rnd()*Math.PI*2, rad=8+geneSize(w.gene[po])*1.5;
    let bx=w.x[b.parent]+Math.cos(ang)*rad, by=w.y[b.parent]+Math.sin(ang)*rad;
    bx-=Math.floor(bx/W)*W; by-=Math.floor(by/W)*W;
    initCreature(w, ci, bx, by, w.gen[b.parent]+1, b.energy);
  }

  // remove eaten food (compact)
  let k=0; for(let f=0;f<w.fn;f++){ if(!foodEaten[f]){ w.fx[k]=w.fx[f]; w.fy[k]=w.fy[f]; k++; } } w.fn=k;

  // immigration floor
  let pop=countAlive(w);
  while(pop<P.MIN_POP){ if(spawnRandom(w)<0) break; pop++; }

  w.steps++;
  w._alignSum=alignSum; w._alignN=alignN;
}

function killCreature(w,i){ if(!w.alive[i])return; w.alive[i]=0; w.free.push(i); w.totalDeaths++; }
function countAlive(w){ let c=0; for(let i=0;i<w.n;i++) if(w.alive[i])c++; return c; }

export function metrics(w){
  let pop=0,energy=0,age=0,size=0,size2=0,sense=0,spd=0;
  for(let i=0;i<w.n;i++){ if(!w.alive[i])continue; pop++; energy+=w.energy[i]; age+=w.age[i];
    const sz=geneSize(w.gene[i*GLEN]); size+=sz; size2+=sz*sz;
    sense+=geneSense(w.gene[i*GLEN+2]); spd+=geneSpeed(w.gene[i*GLEN+1]); }
  const align = w._alignN? w._alignSum/w._alignN : 0;
  const mean=pop?size/pop:0;
  return { steps:w.steps, pop, food:w.fn, maxGen:w.maxGen,
    align:+align.toFixed(3),                       // KEY: heading·foodDir, ~0 random, >0 foraging
    avgEnergy:+(pop?energy/pop:0).toFixed(1),
    avgAge:+(pop?age/pop:0).toFixed(0),
    avgSize:+mean.toFixed(2),
    sizeStd:+(pop?Math.sqrt(Math.max(0,size2/pop-mean*mean)):0).toFixed(2),
    avgSense:+(pop?sense/pop:0).toFixed(0),
    avgSpeed:+(pop?spd/pop:0).toFixed(2),
    kills:w.killEvents||0 };
}

// ---- headless evolution test ----
if(process.argv[1] && process.argv[1].endsWith('genesis_core.mjs')){
  const w=makeWorld();
  console.log('genome length', GLEN, 'brain', BRAIN);
  const STEPS=24000, REPORT=2000;
  let early=null; const lateA=[];
  for(let s=0;s<=STEPS;s++){
    step(w);
    if(s===1) early=metrics(w).align;
    if(s>0 && s%REPORT===0){ const m=metrics(w); if(s>=STEPS-3*REPORT) lateA.push(m.align);
      console.log(`t=${String(m.steps).padStart(6)} pop=${String(m.pop).padStart(4)} gen=${String(m.maxGen).padStart(3)} align=${(m.align>=0?' ':'')}${m.align.toFixed(3)} age=${String(m.avgAge).padStart(4)} E=${m.avgEnergy} size=${m.avgSize}±${m.sizeStd} sense=${m.avgSense} spd=${m.avgSpeed} kills=${m.kills} food=${m.food}`); }
  }
  const late=lateA.reduce((a,b)=>a+b,0)/lateA.length;
  console.log(`\nforaging alignment: random(t=1)=${early}  evolved(late avg)=${late.toFixed(3)}`);
  console.log((late>0.15 && late>early+0.1) ? '*** EVOLUTION CONFIRMED: directed foraging emerged from random brains ***' : '!!! needs tuning');
}
