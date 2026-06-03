// GENESIS-OPEN — pushing toward open-endedness (Node research sandbox).
// Hypothesis: resource partitioning (two food types + a heritable diet gene) creates
// frequency-dependent DISRUPTIVE selection, so the population should spontaneously SPLIT
// into two coexisting diet-niches and STAY split — sustained diversity, not monoculture.
// Plus corpse->food nutrient recycling for ongoing dynamism.
// We MEASURE diet bimodality + trait spread over a long run and report honestly.

export const P = {
  WORLD:1000, POP_CAP:1800, POP_START:400, MIN_POP:30,
  FOOD_CAP:2200, FOOD_SPAWN:11, FOOD_ENERGY:32, START_ENERGY:55,
  BASE_META:0.05, SIZE_META:0.055, SENSE_META:0.0004, MOVE_META:0.07,
  MAX_TURN:0.5, EAT_RADIUS:9, REPRO_FRAC:0.62, CHILD_FRAC:0.5,
  MUT_SIGMA:0.16, MUT_P:0.5, MUT_BIG_P:0.03, CARNIVORY:true, BITE_GAIN:0.5, PREY_RATIO:0.7,
  DIET_FILTER:0.58,       // >0.5 makes generalists (diet~0.5) unable to eat either type → disruptive selection
  CORPSE_FOOD:true,       // dead creatures drop a pellet
};
const I=10,H=8,O=3, BRAIN=I*H+H+H*O+O, NB=5, GLEN=NB+BRAIN; // genes: size,speed,sense,hue,diet
let rng=987654321;
function rnd(){let x=rng;x^=x<<13;x^=x>>>17;x^=x<<5;rng=x>>>0;return rng/4294967296;}
function gauss(){let u=0,v=0;while(u===0)u=rnd();while(v===0)v=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(6.283185*v);}
const sig=x=>1/(1+Math.exp(-x));
const gSize=g=>3+9*sig(g), gSpeed=g=>1.4+4.2*sig(g), gSense=g=>55+185*sig(g), gHue=g=>{let h=g%1;return h<0?h+1:h;}, gDiet=g=>sig(g);
// eating efficiency of a pellet of type t (0|1) for a creature with diet d in [0,1]
const eff=(d,t)=> t? d : 1-d;

export function makeWorld(){
  const C=P.POP_CAP;
  const w={n:0,cap:C, x:new Float32Array(C),y:new Float32Array(C),dir:new Float32Array(C),
    energy:new Float32Array(C),age:new Float32Array(C),gen:new Int32Array(C),alive:new Uint8Array(C),
    gene:new Float32Array(C*GLEN), fx:new Float32Array(P.FOOD_CAP),fy:new Float32Array(P.FOOD_CAP),ft:new Uint8Array(P.FOOD_CAP),fn:0,
    free:[],births:[],steps:0,maxGen:0,deaths:0,kills:0,_aS:0,_aN:0};
  for(let i=0;i<P.POP_START;i++) spawnRandom(w);
  for(let i=0;i<P.FOOD_CAP*0.5;i++) spawnFood(w,-1);
  return w;
}
function spawnRandom(w){const i=alloc(w);if(i<0)return -1;for(let k=0;k<GLEN;k++)w.gene[i*GLEN+k]=gauss();initC(w,i,rnd()*P.WORLD,rnd()*P.WORLD,0,P.START_ENERGY);return i;}
function alloc(w){if(w.free.length)return w.free.pop();if(w.n<w.cap)return w.n++;return -1;}
function initC(w,i,x,y,gen,e){w.x[i]=x;w.y[i]=y;w.dir[i]=rnd()*6.283;w.energy[i]=e;w.age[i]=0;w.gen[i]=gen;w.alive[i]=1;if(gen>w.maxGen)w.maxGen=gen;}
function spawnFood(w,type){if(w.fn>=P.FOOD_CAP)return;w.fx[w.fn]=rnd()*P.WORLD;w.fy[w.fn]=rnd()*P.WORLD;w.ft[w.fn]=type<0?(rnd()<0.5?0:1):type;w.fn++;}
function spawnFoodAt(w,x,y,type){if(w.fn>=P.FOOD_CAP)return;w.fx[w.fn]=x;w.fy[w.fn]=y;w.ft[w.fn]=type;w.fn++;}
function kill(w,i){if(!w.alive[i])return;w.alive[i]=0;w.free.push(i);w.deaths++; if(P.CORPSE_FOOD) spawnFoodAt(w,w.x[i],w.y[i],rnd()<0.5?0:1);}

function gGrid(px,py,n,cell,W){const cols=Math.max(1,Math.floor(W/cell));const heads=new Int32Array(cols*cols).fill(-1);const next=new Int32Array(n).fill(-1);
  for(let i=0;i<n;i++){let cx=(px[i]/cell)|0,cy=(py[i]/cell)|0;if(cx<0)cx=0;else if(cx>=cols)cx=cols-1;if(cy<0)cy=0;else if(cy>=cols)cy=cols-1;const c=cx+cy*cols;next[i]=heads[c];heads[c]=i;}return {cols,cell,heads,next};}
function wrap(d,W){if(d>W*0.5)d-=W;else if(d<-W*0.5)d+=W;return d;}
function nearCre(g,w,x,y,R,W,skip){const {cols,cell,heads,next}=g;const r=Math.ceil(R/cell);let cx=(x/cell)|0,cy=(y/cell)|0;if(cx<0)cx=0;else if(cx>=cols)cx=cols-1;if(cy<0)cy=0;else if(cy>=cols)cy=cols-1;let best=-1,bd2=R*R;
  for(let oy=-r;oy<=r;oy++){let ny=((cy+oy)%cols+cols)%cols;for(let ox=-r;ox<=r;ox++){let nx=((cx+ox)%cols+cols)%cols;let p=heads[nx+ny*cols];
    while(p!==-1){if(p!==skip&&w.alive[p]){const dx=wrap(w.x[p]-x,W),dy=wrap(w.y[p]-y,W);const d2=dx*dx+dy*dy;if(d2<bd2){bd2=d2;best=p;}}p=next[p];}}}return best>=0?{i:best,d:Math.sqrt(bd2)}:null;}
// nearest food the creature can actually use (efficiency > DIET_FILTER)
function nearFood(g,w,x,y,R,W,diet){const {cols,cell,heads,next}=g;const r=Math.ceil(R/cell);let cx=(x/cell)|0,cy=(y/cell)|0;if(cx<0)cx=0;else if(cx>=cols)cx=cols-1;if(cy<0)cy=0;else if(cy>=cols)cy=cols-1;let best=-1,bd2=R*R;
  for(let oy=-r;oy<=r;oy++){let ny=((cy+oy)%cols+cols)%cols;for(let ox=-r;ox<=r;ox++){let nx=((cx+ox)%cols+cols)%cols;let p=heads[nx+ny*cols];
    while(p!==-1){ if(eff(diet,w.ft[p])>P.DIET_FILTER){const dx=wrap(w.fx[p]-x,W),dy=wrap(w.fy[p]-y,W);const d2=dx*dx+dy*dy;if(d2<bd2){bd2=d2;best=p;}} p=next[p];}}}return best>=0?{i:best,d:Math.sqrt(bd2)}:null;}

const _h=new Float32Array(H),_in=new Float32Array(I);
function think(gene,off){const bw=off+NB;for(let j=0;j<H;j++){let s=gene[bw+I*H+j];for(let i=0;i<I;i++)s+=_in[i]*gene[bw+i*H+j];_h[j]=Math.tanh(s);}
  const w2=bw+I*H+H,ob=w2+H*O;let o0=gene[ob],o1=gene[ob+1],o2=gene[ob+2];for(let j=0;j<H;j++){o0+=_h[j]*gene[w2+j*O];o1+=_h[j]*gene[w2+j*O+1];o2+=_h[j]*gene[w2+j*O+2];}
  return [sig(o0),Math.tanh(o1),sig(o2)];}

export function step(w){
  const W=P.WORLD;
  for(let s=0;s<P.FOOD_SPAWN;s++) spawnFood(w,-1);
  const cre=gGrid(w.x,w.y,w.n,120,W), food=gGrid(w.fx,w.fy,w.fn,120,W);
  w.births.length=0; let aS=0,aN=0; const fEat=new Uint8Array(w.fn);
  for(let i=0;i<w.n;i++){
    if(!w.alive[i])continue;const off=i*GLEN;
    const size=gSize(w.gene[off]),maxSpd=gSpeed(w.gene[off+1]),sense=gSense(w.gene[off+2]),diet=gDiet(w.gene[off+4]);
    const x=w.x[i],y=w.y[i],dir=w.dir[i],maxE=45+size*9;
    const nf=nearFood(food,w,x,y,sense,W,diet);
    const nc=nearCre(cre,w,x,y,sense,W,i);
    _in[0]=1;_in[1]=Math.min(1,w.energy[i]/maxE);_in[2]=0;
    if(nf){const a=Math.atan2(wrap(w.fy[nf.i]-y,W),wrap(w.fx[nf.i]-x,W))-dir;_in[3]=1-nf.d/sense;_in[4]=Math.sin(a);_in[5]=Math.cos(a);aS+=Math.cos(a);aN++;}else{_in[3]=0;_in[4]=0;_in[5]=0;}
    if(nc){const a=Math.atan2(wrap(w.y[nc.i]-y,W),wrap(w.x[nc.i]-x,W))-dir;const os=gSize(w.gene[nc.i*GLEN]);_in[6]=1-nc.d/sense;_in[7]=Math.sin(a);_in[8]=Math.cos(a);_in[9]=Math.tanh((os-size)*0.3);}else{_in[6]=0;_in[7]=0;_in[8]=0;_in[9]=0;}
    const o=think(w.gene,off);const thrust=o[0],turn=o[1],bite=o[2];
    let nd=dir+turn*P.MAX_TURN;if(nd>Math.PI)nd-=6.283;else if(nd<-Math.PI)nd+=6.283;
    const spd=thrust*maxSpd;let nx=x+Math.cos(nd)*spd,ny=y+Math.sin(nd)*spd;nx-=Math.floor(nx/W)*W;ny-=Math.floor(ny/W)*W;
    w.dir[i]=nd;w.x[i]=nx;w.y[i]=ny;w.age[i]++;
    w.energy[i]-=P.BASE_META+P.SIZE_META*size+P.SENSE_META*sense+P.MOVE_META*spd;
    const er=P.EAT_RADIUS+size;const fn=nearFood(food,w,nx,ny,er,W,diet);
    if(fn&&!fEat[fn.i]){fEat[fn.i]=1;w.energy[i]+=P.FOOD_ENERGY*eff(diet,w.ft[fn.i]);}
    if(P.CARNIVORY&&bite>0.55&&nc){const os=gSize(w.gene[nc.i*GLEN]);
      if(w.alive[nc.i]&&os<size*P.PREY_RATIO&&nc.d<er+os){const a=Math.atan2(wrap(w.y[nc.i]-ny,W),wrap(w.x[nc.i]-nx,W))-w.dir[i];
        if(Math.cos(a)>0.3){w.energy[i]+=Math.min(maxE,w.energy[nc.i]*P.BITE_GAIN);w.kills++;kill(w,nc.i);}}}
    if(w.energy[i]>maxE)w.energy[i]=maxE;
    if(w.energy[i]>P.REPRO_FRAC*maxE){const give=w.energy[i]*P.CHILD_FRAC;w.energy[i]-=give;w.births.push(i);w.births.push(give);}
    if(w.energy[i]<=0)kill(w,i);
  }
  for(let b=0;b<w.births.length;b+=2){const parent=w.births[b],give=w.births[b+1];const ci=alloc(w);if(ci<0)break;const po=parent*GLEN,co=ci*GLEN;
    for(let k=0;k<GLEN;k++){let g=w.gene[po+k];if(rnd()<P.MUT_P)g+=gauss()*P.MUT_SIGMA;if(rnd()<P.MUT_BIG_P)g+=gauss();w.gene[co+k]=g;}
    const ang=rnd()*6.283,rad=8+gSize(w.gene[po])*1.5;let bx=w.x[parent]+Math.cos(ang)*rad,by=w.y[parent]+Math.sin(ang)*rad;bx-=Math.floor(bx/W)*W;by-=Math.floor(by/W)*W;initC(w,ci,bx,by,w.gen[parent]+1,give);}
  let k=0;for(let f=0;f<w.fn;f++){if(!fEat[f]){w.fx[k]=w.fx[f];w.fy[k]=w.fy[f];w.ft[k]=w.ft[f];k++;}}w.fn=k;
  let pop=0;for(let i=0;i<w.n;i++)if(w.alive[i])pop++;
  while(pop<P.MIN_POP){if(spawnRandom(w)<0)break;pop++;}
  w.steps++;w._aS=aS;w._aN=aN;
}

export function metrics(w){
  let pop=0,low=0,mid=0,high=0,t0=0,t1=0;
  for(let i=0;i<w.n;i++){if(!w.alive[i])continue;pop++;const d=gDiet(w.gene[i*GLEN+4]);if(d<0.45)low++;else if(d>0.55)high++;else mid++;}
  for(let f=0;f<w.fn;f++){if(w.ft[f])t1++;else t0++;}
  const align=w._aN?w._aS/w._aN:0;
  // Simpson diversity across the 3 diet classes (1 = even split, 0 = one class)
  const fr=[low/pop,mid/pop,high/pop]; const simpson=1-(fr[0]*fr[0]+fr[1]*fr[1]+fr[2]*fr[2]);
  return {steps:w.steps,pop,gen:w.maxGen,align:+align.toFixed(2),
    dietLow:+(low/pop).toFixed(2),dietMid:+(mid/pop).toFixed(2),dietHigh:+(high/pop).toFixed(2),
    simpson:+simpson.toFixed(2), foodT0:t0,foodT1:t1};
}

if(process.argv[1]&&process.argv[1].endsWith('genesis_open.mjs')){
  const w=makeWorld();
  console.log('resource-partitioning experiment · genome',GLEN);
  const STEPS=60000,REP=4000; const simpsons=[];
  for(let s=0;s<=STEPS;s++){ step(w);
    if(s>0&&s%REP===0){const m=metrics(w); if(s>=STEPS*0.4)simpsons.push(m.simpson);
      console.log(`t=${String(m.steps).padStart(6)} pop=${String(m.pop).padStart(4)} gen=${String(m.gen).padStart(3)} diet[lo|mid|hi]=${m.dietLow} ${m.dietMid} ${m.dietHigh}  Simpson=${m.simpson}  align=${m.align}  food[t0|t1]=${m.foodT0}|${m.foodT1}`);}}
  const avgS=simpsons.reduce((a,b)=>a+b,0)/simpsons.length;
  console.log(`\nsustained diet diversity (avg Simpson over 2nd half) = ${avgS.toFixed(2)}  (0 = monoculture, ~0.5+ = stable multi-niche)`);
  console.log(avgS>0.4 ? '*** SUSTAINED DIVERSITY: the population stayed split into coexisting diet-niches ***' : '... diversity collapsed toward one strategy (the open-endedness problem)');
}
