// GENESIS-SPAT — does SPATIAL STRUCTURE break lineage-fixation? (Node research sandbox)
//
// The honest caveat of genesis_oee.mjs: novelty stayed positive (open-ended-LEANING),
// but ONE lineage tended to fix (domShare → 1). In a well-mixed world the single best
// family sweeps everywhere. The literature's most-cited remedy is SPATIAL STRUCTURE:
// make the world large relative to how far a creature can sense/move, so geographically
// separated subpopulations persist and diverge in semi-isolation (allopatric speciation).
// Spatially-embedded ALife (e.g. Channon's Geb) is exactly where open-ended tests have
// actually been passed.
//
// This file is genesis_oee.mjs with ONE change in spirit: the world is enlarged while
// DENSITY (pop/area, food/area) is held constant and sense/speed are UNCHANGED — so the
// only thing that varies is the world-size-to-sense ratio (the degree of spatial mixing).
// We then measure whether MORE lineages coexist and whether novelty is sustained.
//
// Run:  node genesis_spat.mjs           (spatial config)
//       node genesis_spat.mjs mixed     (well-mixed control, == oee baseline)
// Honest expectation reported either way.

const MODE = process.argv[2]==='mixed' ? 'mixed' : 'spatial';

// density-matched scaling. baseline (mixed) == genesis_oee.mjs exactly.
const BASE = { WORLD:1000, POP_CAP:700, POP_START:300, FOOD_CAP:1400 };
const SCALE = MODE==='spatial' ? (parseFloat(process.argv[3])||1.8) : 1.0;   // linear; area = SCALE²
const A = SCALE*SCALE;
export const P = {
  WORLD:Math.round(BASE.WORLD*SCALE),
  POP_CAP:Math.round(BASE.POP_CAP*A), POP_START:Math.round(BASE.POP_START*A), MIN_POP:25,
  FOOD_CAP:Math.round(BASE.FOOD_CAP*A), FOOD_SPAWN:Math.round(9*A), FOOD_ENERGY:34, START_ENERGY:60,
  BASE_META:0.05, SIZE_META:0.05, SENSE_META:0.0005, MOVE_META:0.06,
  MAX_TURN:0.5, EAT_RADIUS:9, REPRO_FRAC:0.62, CHILD_FRAC:0.5,
  PREY_RATIO:0.78, BITE_GAIN:0.55,
  CONN_COST:0.0028, PLANT_FALLOFF:6,
  W_PERTURB:0.85, W_SIG:0.4, W_RESET:0.08, ADD_CONN:0.07, ADD_NODE:0.035, TOGGLE:0.02,
  BODY_SIG:0.12, MAX_NODES:48, MAX_CONNS:150,
};
const NIN=9, NOUT=3, N0=NIN+NOUT;

let rng=20260603>>>0;
function rnd(){ let x=rng; x^=x<<13; x^=x>>>17; x^=x<<5; rng=x>>>0; return rng/4294967296; }
function gauss(){ let u=0,v=0; while(u===0)u=rnd(); while(v===0)v=rnd(); return Math.sqrt(-2*Math.log(u))*Math.cos(6.283185*v); }
const sig=x=>1/(1+Math.exp(-x));
const tanh=Math.tanh;
const geneMap=(g,lo,hi)=>lo+(hi-lo)*sig(g);

function minimalGenome(){
  const nodes=[]; for(let k=0;k<NIN;k++)nodes.push(0); for(let k=0;k<NOUT;k++)nodes.push(2);
  const conns=[];
  for(let o=0;o<NOUT;o++){ const oid=NIN+o; const nlinks=1+((rnd()*3)|0);
    for(let l=0;l<nlinks;l++){ const i=(rnd()*NIN)|0; conns.push({i, o:oid, w:gauss()*1.2, en:true}); } }
  return {nodes, conns};
}
function cloneGenome(g){ return { nodes:g.nodes.slice(), conns:g.conns.map(c=>({i:c.i,o:c.o,w:c.w,en:c.en})) }; }
function mutateGenome(g){
  for(const c of g.conns){ if(rnd()<P.W_PERTURB) c.w += gauss()*P.W_SIG; if(rnd()<P.W_RESET) c.w=gauss()*1.2; if(rnd()<P.TOGGLE) c.en=!c.en; }
  if(rnd()<P.ADD_CONN && g.conns.length<P.MAX_CONNS){
    const nN=g.nodes.length; const i=(rnd()*nN)|0; let o=(rnd()*nN)|0;
    if(g.nodes[o]!==0 && i!==o && !g.conns.some(c=>c.i===i&&c.o===o)) g.conns.push({i,o,w:gauss()*1.2,en:true});
  }
  if(rnd()<P.ADD_NODE && g.nodes.length<P.MAX_NODES){
    const en=g.conns.filter(c=>c.en); if(en.length){ const c=en[(rnd()*en.length)|0]; c.en=false;
      const nid=g.nodes.length; g.nodes.push(1);
      g.conns.push({i:c.i,o:nid,w:1,en:true}); g.conns.push({i:nid,o:c.o,w:c.w,en:true}); }
  }
  return g;
}
const complexity=g=>{ let hid=0; for(let k=N0;k<g.nodes.length;k++)hid++; let en=0; for(const c of g.conns)if(c.en)en++; return hid+en; };

const _sum=new Float32Array(P.MAX_NODES+8);
function evalBrain(g, act, inp, out){
  const nN=g.nodes.length;
  for(let k=0;k<NIN;k++) act[k]=inp[k];
  for(let k=0;k<nN;k++) _sum[k]=0;
  const cs=g.conns; for(let m=0;m<cs.length;m++){ const c=cs[m]; if(c.en) _sum[c.o]+=c.w*act[c.i]; }
  for(let k=NIN;k<nN;k++) act[k]=tanh(_sum[k]);
  out[0]=(act[NIN]*0.5+0.5); out[1]=act[NIN+1]; out[2]=(act[NIN+2]*0.5+0.5);
}

export function makeWorld(){
  const C=P.POP_CAP;
  const w={ n:0,cap:C, x:new Float32Array(C),y:new Float32Array(C),dir:new Float32Array(C),
    energy:new Float32Array(C),age:new Float32Array(C),gen:new Int32Array(C),alive:new Uint8Array(C),
    size:new Float32Array(C),spd:new Float32Array(C),sense:new Float32Array(C),
    sizeG:new Float32Array(C),spdG:new Float32Array(C),senseG:new Float32Array(C),
    lin:new Int32Array(C), preyE:new Float32Array(C), cx:new Float32Array(C),
    geno:new Array(C), act:new Array(C),
    fx:new Float32Array(P.FOOD_CAP),fy:new Float32Array(P.FOOD_CAP),fn:0,
    free:[],births:[],steps:0,maxGen:0,kills:0,nextLin:1 };
  for(let i=0;i<P.POP_START;i++) spawnFounder(w);
  for(let i=0;i<P.FOOD_CAP*0.5;i++) spawnFood(w);
  return w;
}
function spawnFounder(w){ const i=alloc(w); if(i<0)return -1;
  w.geno[i]=minimalGenome(); w.act[i]=new Float32Array(w.geno[i].nodes.length);
  w.sizeG[i]=gauss(); w.spdG[i]=gauss(); w.senseG[i]=gauss();
  initBody(w,i,rnd()*P.WORLD,rnd()*P.WORLD,0,P.START_ENERGY,w.nextLin++); return i; }
function alloc(w){ if(w.free.length)return w.free.pop(); if(w.n<w.cap)return w.n++; return -1; }
function initBody(w,i,x,y,gen,e,lin){ w.x[i]=x;w.y[i]=y;w.dir[i]=rnd()*6.283;w.energy[i]=e;w.age[i]=0;w.gen[i]=gen;w.alive[i]=1;w.lin[i]=lin;w.preyE[i]=0;
  w.size[i]=geneMap(w.sizeG[i],3,12); w.spd[i]=geneMap(w.spdG[i],1.4,5.6); w.sense[i]=geneMap(w.senseG[i],55,240); w.cx[i]=complexity(w.geno[i]); if(gen>w.maxGen)w.maxGen=gen; }
function spawnFood(w){ if(w.fn>=P.FOOD_CAP)return; w.fx[w.fn]=rnd()*P.WORLD; w.fy[w.fn]=rnd()*P.WORLD; w.fn++; }
function kill(w,i){ if(!w.alive[i])return; w.alive[i]=0; w.free.push(i); }

function gGrid(px,py,n,cell,W){ const cols=Math.max(1,Math.floor(W/cell)); const heads=new Int32Array(cols*cols).fill(-1); const next=new Int32Array(n).fill(-1);
  for(let i=0;i<n;i++){ let cx=(px[i]/cell)|0,cy=(py[i]/cell)|0; if(cx<0)cx=0;else if(cx>=cols)cx=cols-1; if(cy<0)cy=0;else if(cy>=cols)cy=cols-1; const c=cx+cy*cols; next[i]=heads[c]; heads[c]=i; } return {cols,cell,heads,next}; }
function wrap(d,W){ if(d>W*0.5)d-=W; else if(d<-W*0.5)d+=W; return d; }
function near(g,px,py,x,y,R,W,skip,aliveArr){ const {cols,cell,heads,next}=g; const r=Math.ceil(R/cell); let cx=(x/cell)|0,cy=(y/cell)|0; if(cx<0)cx=0;else if(cx>=cols)cx=cols-1; if(cy<0)cy=0;else if(cy>=cols)cy=cols-1; let best=-1,bd2=R*R;
  for(let oy=-r;oy<=r;oy++){ let ny=((cy+oy)%cols+cols)%cols; for(let ox=-r;ox<=r;ox++){ let nx=((cx+ox)%cols+cols)%cols; let p=heads[nx+ny*cols];
    while(p!==-1){ if(p!==skip&&(!aliveArr||aliveArr[p])){ const dx=wrap(px[p]-x,W),dy=wrap(py[p]-y,W); const d2=dx*dx+dy*dy; if(d2<bd2){bd2=d2;best=p;} } p=next[p]; } } } return best>=0?{i:best,d:Math.sqrt(bd2)}:null; }

const _inp=new Float32Array(NIN), _out=new Float32Array(NOUT);
export function step(w){
  const W=P.WORLD;
  for(let s=0;s<P.FOOD_SPAWN;s++) spawnFood(w);
  const cre=gGrid(w.x,w.y,w.n,130,W), food=gGrid(w.fx,w.fy,w.fn,130,W);
  w.births.length=0; const fEat=new Uint8Array(w.fn);
  for(let i=0;i<w.n;i++){
    if(!w.alive[i])continue;
    const size=w.size[i],maxSpd=w.spd[i],sense=w.sense[i]; const x=w.x[i],y=w.y[i],dir=w.dir[i],maxE=45+size*9;
    const nf=near(food,w.fx,w.fy,x,y,sense,W,-1,null);
    const nc=near(cre,w.x,w.y,x,y,sense,W,i,w.alive);
    _inp[0]=1; _inp[1]=Math.min(1,w.energy[i]/maxE);
    if(nf){ const a=Math.atan2(wrap(w.fy[nf.i]-y,W),wrap(w.fx[nf.i]-x,W))-dir; _inp[2]=1-nf.d/sense; _inp[3]=Math.sin(a); _inp[4]=Math.cos(a); } else { _inp[2]=0;_inp[3]=0;_inp[4]=0; }
    if(nc){ const a=Math.atan2(wrap(w.y[nc.i]-y,W),wrap(w.x[nc.i]-x,W))-dir; _inp[5]=1-nc.d/sense; _inp[6]=Math.sin(a); _inp[7]=Math.cos(a); _inp[8]=tanh((w.size[nc.i]-size)*0.3); } else { _inp[5]=0;_inp[6]=0;_inp[7]=0;_inp[8]=0; }
    evalBrain(w.geno[i], w.act[i], _inp, _out);
    let nd=dir+_out[1]*P.MAX_TURN; if(nd>Math.PI)nd-=6.283;else if(nd<-Math.PI)nd+=6.283;
    const spd=_out[0]*maxSpd; let nx=x+Math.cos(nd)*spd, ny=y+Math.sin(nd)*spd; nx-=Math.floor(nx/W)*W; ny-=Math.floor(ny/W)*W;
    w.dir[i]=nd; w.x[i]=nx; w.y[i]=ny; w.age[i]++;
    w.energy[i]-= P.BASE_META + P.SIZE_META*size + P.SENSE_META*sense + P.MOVE_META*spd + P.CONN_COST*w.cx[i];
    const er=P.EAT_RADIUS+size; const fn=near(food,w.fx,w.fy,nx,ny,er,W,-1,null);
    if(fn&&!fEat[fn.i]){ fEat[fn.i]=1; const fe=Math.max(0.05,1-(size-4)/P.PLANT_FALLOFF); w.energy[i]+=P.FOOD_ENERGY*fe; }
    if(_out[2]>0.55 && nc){ const os=w.size[nc.i];
      if(w.alive[nc.i] && os<size*P.PREY_RATIO && nc.d<er+os){ const a=Math.atan2(wrap(w.y[nc.i]-ny,W),wrap(w.x[nc.i]-nx,W))-w.dir[i];
        if(Math.cos(a)>0.25){ const g=Math.min(maxE,w.energy[nc.i]*P.BITE_GAIN); w.energy[i]+=g; w.preyE[i]+=g; w.kills++; kill(w,nc.i); } } }
    if(w.energy[i]>maxE)w.energy[i]=maxE;
    if(w.energy[i]>P.REPRO_FRAC*maxE){ const give=w.energy[i]*P.CHILD_FRAC; w.energy[i]-=give; w.births.push(i); w.births.push(give); }
    if(w.energy[i]<=0) kill(w,i);
  }
  for(let b=0;b<w.births.length;b+=2){ const par=w.births[b], give=w.births[b+1]; const ci=alloc(w); if(ci<0)break;
    w.geno[ci]=mutateGenome(cloneGenome(w.geno[par])); w.act[ci]=new Float32Array(w.geno[ci].nodes.length);
    w.sizeG[ci]=w.sizeG[par]+gauss()*P.BODY_SIG; w.spdG[ci]=w.spdG[par]+gauss()*P.BODY_SIG; w.senseG[ci]=w.senseG[par]+gauss()*P.BODY_SIG;
    const ang=rnd()*6.283, rad=8+w.size[par]*1.5; let bx=w.x[par]+Math.cos(ang)*rad, by=w.y[par]+Math.sin(ang)*rad; bx-=Math.floor(bx/W)*W; by-=Math.floor(by/W)*W;
    initBody(w,ci,bx,by,w.gen[par]+1,give,w.lin[par]); }
  let k=0; for(let f=0;f<w.fn;f++){ if(!fEat[f]){ w.fx[k]=w.fx[f]; w.fy[k]=w.fy[f]; k++; } } w.fn=k;
  let pop=0; for(let i=0;i<w.n;i++)if(w.alive[i])pop++;
  while(pop<P.MIN_POP){ if(spawnFounder(w)<0)break; pop++; }
  w.steps++;
}

export function metrics(w){
  let pop=0,cx=0,cmax=0,szS=0,szS2=0,carn=0; const lc={};
  for(let i=0;i<w.n;i++){ if(!w.alive[i])continue; pop++; const c=complexity(w.geno[i]); cx+=c; if(c>cmax)cmax=c;
    const sz=w.size[i]; szS+=sz; szS2+=sz*sz; if(w.preyE[i]>w.age[i]*0.02)carn++; lc[w.lin[i]]=(lc[w.lin[i]]||0)+1; }
  let dom=0,domLin=-1,distinct=0; let simpson=0; for(const L in lc){ if(lc[L]>dom){dom=lc[L];domLin=+L;} if(lc[L]/pop>0.05)distinct++; const p=lc[L]/pop; simpson+=p*p; }
  const mean=pop?szS/pop:0;
  return { steps:w.steps, pop, gen:w.maxGen, kills:w.kills,
    cxMean:+(pop?cx/pop:0).toFixed(2), cxMax:cmax,
    sizeStd:+(pop?Math.sqrt(Math.max(0,szS2/pop-mean*mean)):0).toFixed(2),
    carnFrac:+(pop?carn/pop:0).toFixed(2), distinctLin:distinct, domLin, domShare:+(pop?dom/pop:0).toFixed(2),
    linDiversity:+(pop?1/simpson:0).toFixed(1) };   // effective # of lineages (inverse-Simpson)
}

function occupiedBins(w){ const s=new Set(); for(let i=0;i<w.n;i++){ if(!w.alive[i])continue; const carn=w.preyE[i]>w.age[i]*0.02?1:0; s.add(Math.round(w.size[i])+'|'+carn+'|'+Math.round(w.cx[i]/8)+'|'+Math.round(w.spd[i])); } return s; }

if(process.argv[1] && process.argv[1].endsWith('genesis_spat.mjs')){
  const w=makeWorld();
  console.log(`SPATIAL open-endedness test · mode=${MODE} · WORLD=${P.WORLD} POP_START=${P.POP_START} (density held constant)\n`);
  const STEPS=(parseInt(process.argv[4])||120000), REP=10000; const novSeries=[]; const seen=new Set(); let t0=Date.now();
  let domSum=0, divSum=0, samp=0, maxDistinct=0;
  for(let s=0;s<=STEPS;s++){ step(w);
    if(s>0 && s%REP===0){ const m=metrics(w);
      const occ=occupiedBins(w); let nw=0; occ.forEach(k=>{ if(!seen.has(k)){ seen.add(k); nw++; } }); novSeries.push(nw);
      domSum+=m.domShare; divSum+=m.linDiversity; samp++; if(m.distinctLin>maxDistinct)maxDistinct=m.distinctLin;
      console.log(`t=${String(m.steps).padStart(6)} pop=${String(m.pop).padStart(4)} gen=${String(m.gen).padStart(4)} cx=${String(m.cxMean).padStart(5)} carn=${m.carnFrac} occ=${String(occ.size).padStart(3)} NEW=${nw} linEff=${String(m.linDiversity).padStart(4)} domShare=${m.domShare} kills=${m.kills}`); } }
  const tail=novSeries.slice(Math.floor(novSeries.length*0.6));
  const lateNov=tail.reduce((a,b)=>a+b,0)/Math.max(1,tail.length);
  console.log(`\n[SPATIAL diagnostics]  (${((Date.now()-t0)/1000).toFixed(0)}s)`);
  console.log(`  distinct phenotype classes ever discovered: ${seen.size}`);
  console.log(`  NEW classes per 10k steps, late 40%: ${lateNov.toFixed(2)}`);
  console.log(`  mean dominant-lineage share: ${(domSum/samp).toFixed(2)}   (1.00 = one family fixes; lower = coexistence)`);
  console.log(`  mean effective # lineages (inv-Simpson): ${(divSum/samp).toFixed(2)}   max distinct(>5%): ${maxDistinct}`);
  console.log(`  baseline (mixed oee) for comparison: domShare≈1.0, linEff≈1, lateNov≈5.7`);
  console.log( (domSum/samp) < 0.8
    ? '*** SPATIAL STRUCTURE SUSTAINS MULTIPLE LINEAGES — fixation softened (allopatric coexistence).'
    : '... One lineage still tends to dominate even with space — fixation persists. Honest negative.');
}
