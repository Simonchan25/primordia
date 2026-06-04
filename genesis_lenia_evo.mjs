// GENESIS lenia-evo — an honest probe of EVOLVABLE Lenia (Node, headless).
//
// Question: VISION.md's frontier asks for continuous creatures that *evolve*.
// Classic Lenia (the Flux chamber) has a FIXED rule. Here we ask the prior
// question that has to be true first: is the Lenia rule-space itself evolvable —
// can a genetic algorithm, starting from RANDOM rules (which overwhelmingly
// die or explode), DISCOVER rules that support persistent, localized, *moving*
// life? If yes, then "rules that make life" sit on an evolvable gradient — the
// foundation any intrinsically-evolving Lenia (e.g. Flow Lenia) would stand on.
//
// This DOES impose a fitness function (unlike Becoming's emergent selection), so
// it's a probe of the rule-landscape, not a claim of open-ended evolution.
// Run:  node genesis_lenia_evo.mjs
//
// Genome = [μ, σ, b0, b1]  (growth centre/width + a 2-ring kernel shape).

const GW = 64, GH = 64, R = 10, DT = 0.12, STEPS = 130;
const D = 2 * R + 1, AREA = GW * GH;

// ---- deterministic RNG ----
let rng = 20260604 >>> 0;
function rnd(){ let x = rng; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; rng = x >>> 0; return rng / 4294967296; }
function gauss(){ let u = 0, v = 0; while (u === 0) u = rnd(); while (v === 0) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283185 * v); }
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

// ---- a fixed, ASYMMETRIC seed (asymmetry is what lets a creature glide) ----
function seedField(){
  const A = new Float32Array(AREA);
  const blob = (cx, cy, rad, pk) => { for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++){
    const d = Math.hypot(dx, dy); if (d > rad) continue; const x = ((cx + dx) % GW + GW) % GW, y = ((cy + dy) % GH + GH) % GH;
    const v = pk * (1 - d / rad); if (v > A[y * GW + x]) A[y * GW + x] = v; } };
  blob(30, 32, 9, 1.0); blob(37, 30, 6, 0.9); blob(33, 38, 5, 0.8);   // off-centre, lopsided
  return A;
}
const SEED = seedField(), SEED_MASS = SEED.reduce((a, b) => a + b, 0);

// ---- 2-ring kernel from genome shape (b0 inner shell, b1 outer shell) ----
function buildKernel(b0, b1){
  const K = new Float32Array(D * D); let sum = 0;
  for (let y = 0; y < D; y++) for (let x = 0; x < D; x++){
    const dx = x - R, dy = y - R, r = Math.sqrt(dx * dx + dy * dy) / R;
    let v = 0; if (r > 0 && r < 1){ const seg = r < 0.5 ? 0 : 1, rr = r < 0.5 ? r / 0.5 : (r - 0.5) / 0.5;
      const bump = Math.exp(4 - 1 / (rr * (1 - rr))); v = (seg === 0 ? b0 : b1) * bump; }
    K[y * D + x] = v; sum += v;
  }
  if (sum > 0) for (let i = 0; i < D * D; i++) K[i] /= sum;
  return K;
}

function stepInto(A, out, K, mu, sig){
  const inv = 1 / (2 * sig * sig);
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++){
    let u = 0;
    for (let ky = -R; ky <= R; ky++){ const yy = ((y + ky) % GH + GH) % GH;
      for (let kx = -R; kx <= R; kx++){ const w = K[(ky + R) * D + (kx + R)]; if (w === 0) continue;
        u += w * A[yy * GW + (((x + kx) % GW + GW) % GW)]; } }
    const g = 2 * Math.exp(-((u - mu) * (u - mu)) * inv) - 1;
    let a = A[y * GW + x] + DT * g; out[y * GW + x] = a < 0 ? 0 : a > 1 ? 1 : a;
  }
}
const wrap = (d, W) => { if (d > W / 2) d -= W; else if (d < -W / 2) d += W; return d; };
function centroid(A){ let sx = 0, cx = 0, sy = 0, cy = 0, m = 0, occ = 0;
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++){ const a = A[y * GW + x]; if (a <= 0.05) continue; occ++;
    const ax = 2 * Math.PI * x / GW, ay = 2 * Math.PI * y / GH;
    cx += a * Math.cos(ax); sx += a * Math.sin(ax); cy += a * Math.cos(ay); sy += a * Math.sin(ay); m += a; }
  return { x: (Math.atan2(sx, cx) / (2 * Math.PI) * GW + GW) % GW, y: (Math.atan2(sy, cy) / (2 * Math.PI) * GH + GH) % GH, m, occ };
}

// ---- fitness: reward a creature that PERSISTS, stays LOCALIZED, and GLIDES smoothly ----
// (a real glider drifts <~1 cell/step; a flickering pattern teleports its centroid — that's
//  fitness-hacking, not motion, so steps that jump too far score 0 and are penalised.)
function fitness(gene){
  const [mu, sig, b0, b1] = gene; const K = buildKernel(b0, b1);
  let A = SEED.slice(), B = new Float32Array(AREA);
  let prev = centroid(A), smooth = 0, jumps = 0, viable = 0;
  for (let s = 0; s < STEPS; s++){
    stepInto(A, B, K, mu, sig); const t = A; A = B; B = t;
    const c = centroid(A);
    const localized = c.occ < AREA * 0.34;            // hasn't filled the world (not a blowup)
    const aliveBand = c.m > 0.25 * SEED_MASS && c.m < 4 * SEED_MASS;   // neither dead nor exploded
    if (localized && aliveBand) viable++;
    const d = Math.hypot(wrap(c.x - prev.x, GW), wrap(c.y - prev.y, GH));
    if (d <= 1.6) smooth += d; else jumps++;          // smooth glide vs teleport-flicker
    prev = c;
  }
  const end = centroid(A), survFrac = viable / STEPS, jumpFrac = jumps / STEPS;
  if (!(end.m > 0.25 * SEED_MASS) || end.occ > AREA * 0.5) return { f: survFrac * 0.3, travel: smooth, surv: survFrac, m: end.m, jump: jumpFrac };
  const moveScore = Math.min(1, smooth / (STEPS * 0.3));     // genuine drift only
  const f = survFrac * (0.4 + 0.6 * moveScore) * (1 - 0.85 * jumpFrac);   // flickerers get crushed
  return { f, travel: smooth, surv: survFrac, m: end.m, jump: jumpFrac };
}

function randGene(){ return [0.05 + rnd() * 0.33, 0.006 + rnd() * 0.07, rnd(), rnd()]; }
function mutate(g){ const n = g.slice();
  n[0] = clamp(n[0] + gauss() * 0.03, 0.02, 0.45); n[1] = clamp(n[1] + gauss() * 0.008, 0.004, 0.09);
  n[2] = clamp(n[2] + gauss() * 0.12, 0, 1); n[3] = clamp(n[3] + gauss() * 0.12, 0, 1); return n; }

if (process.argv[1] && process.argv[1].endsWith('genesis_lenia_evo.mjs')){
  const POP = 28, GENS = 22, ELITE = 6;
  console.log(`evolvable-Lenia probe · grid ${GW}×${GH} · R=${R} · pop ${POP} · ${GENS} gens · ${STEPS} steps/eval`);
  console.log('genome = [μ, σ, kernel b0, b1]. Starting from RANDOM rules:\n');
  let pop = Array.from({ length: POP }, randGene).map(g => ({ g, s: fitness(g) }));
  const gen0Best = pop.reduce((a, b) => b.s.f > a.s.f ? b : a).s.f;
  let gen0Alive = pop.filter(p => p.s.surv > 0.6).length;
  for (let gen = 1; gen <= GENS; gen++){
    pop.sort((a, b) => b.s.f - a.s.f);
    const best = pop[0], alive = pop.filter(p => p.s.surv > 0.6).length;
    if (gen === 1 || gen % 3 === 0 || gen === GENS)
      console.log(`gen ${String(gen).padStart(2)}  bestFit=${best.s.f.toFixed(3)}  μ=${best.g[0].toFixed(3)} σ=${best.g[1].toFixed(3)} kern=[${best.g[2].toFixed(2)},${best.g[3].toFixed(2)}]  glide=${best.s.travel.toFixed(0)}cells (${(best.s.travel / STEPS).toFixed(2)}/step)  survivors(>60%)=${alive}/${POP}`);
    const next = pop.slice(0, ELITE).map(p => ({ g: p.g, s: p.s }));   // elitism
    while (next.length < POP){ const p = pop[(rnd() * ELITE) | 0].g; const c = mutate(p); next.push({ g: c, s: fitness(c) }); }
    pop = next;
  }
  pop.sort((a, b) => b.s.f - a.s.f); const champ = pop[0];
  console.log(`\nstart: best fitness ${gen0Best.toFixed(3)}, ${gen0Alive}/${POP} random rules made a viable creature`);
  console.log(`end:   best fitness ${champ.s.f.toFixed(3)}  μ=${champ.g[0].toFixed(3)} σ=${champ.g[1].toFixed(3)} kernel=[${champ.g[2].toFixed(2)}, ${champ.g[3].toFixed(2)}]  glided ${champ.s.travel.toFixed(0)} cells (${(champ.s.travel / STEPS).toFixed(2)}/step, jump-frac ${champ.s.jump.toFixed(2)})`);
  const improved = champ.s.f > gen0Best + 0.1;
  console.log(improved
    ? '*** EVOLVABLE: selection discovered Lenia rules that support persistent, moving life from random starts ***'
    : '!!! inconclusive — the rule landscape did not yield to selection here (try more gens / pop)');
}
