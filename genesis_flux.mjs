// GENESIS flux — headless verification of the Lenia (continuous-matter) engine (Node).
// Goal: prove the Flux chamber's math is correct — the canonical Orbium GLIDES (its
// centre of mass travels) and the field CONSERVES MASS (it neither explodes nor dies).
// This mirrors the WebGL2 shader in index.html, on the CPU, so the claim in the README
// ("the Orbium glider swims") is verified, not hand-waved.  Run: node genesis_flux.mjs

// ---- the rule of life ----
const R = 13, MU = 0.15, SIGMA = 0.015, DT = 0.1;   // canonical Orbium (Bert Chan), R=13
const GW = 110, GH = 110;                            // a torus comfortably bigger than the creature

// canonical Orbium (orbium unicaudatus, R=13) — the famous Lenia glider
const ORB = [
[0,0,0,0,0,0,0.1,0.14,0.1,0,0,0.03,0.03,0,0,0.3,0,0,0,0],
[0,0,0,0,0,0.08,0.24,0.3,0.3,0.18,0.14,0.15,0.16,0.15,0.09,0.2,0,0,0,0],
[0,0,0,0,0,0.15,0.34,0.44,0.46,0.38,0.18,0.14,0.11,0.13,0.19,0.18,0.45,0,0,0],
[0,0,0,0,0.06,0.13,0.39,0.5,0.5,0.37,0.06,0,0,0,0.02,0.16,0.68,0,0,0],
[0,0,0,0.11,0.17,0.17,0.33,0.4,0.38,0.28,0.14,0,0,0,0,0,0.18,0.42,0,0],
[0,0,0.09,0.18,0.13,0.06,0.08,0.26,0.32,0.32,0.27,0,0,0,0,0,0,0.82,0,0],
[0.27,0,0.16,0.12,0,0,0,0.25,0.38,0.44,0.45,0.34,0,0,0,0,0,0.22,0.17,0],
[0,0.07,0.2,0.02,0,0,0,0.31,0.48,0.57,0.6,0.57,0,0,0,0,0,0,0.49,0],
[0,0.59,0.19,0,0,0,0,0.2,0.57,0.69,0.76,0.76,0.49,0,0,0,0,0,0.36,0],
[0,0.58,0.19,0,0,0,0,0,0.67,0.83,0.9,0.92,0.87,0.12,0,0,0,0,0.22,0.07],
[0,0,0.46,0,0,0,0,0,0.7,0.93,1,1,1,0.61,0,0,0,0,0.18,0.11],
[0,0,0.82,0,0,0,0,0,0.47,1,1,0.98,1,0.96,0.27,0,0,0,0.19,0.1],
[0,0,0.46,0,0,0,0,0,0.25,0.94,1,0.97,1,1,0.84,0,0,0,0.21,0.05],
[0,0,0,0.4,0,0,0,0,0.09,0.8,1,0.82,0.8,0.85,0.63,0.05,0,0.18,0.21,0.01],
[0,0,0,0.36,0.1,0,0,0,0.05,0.54,0.86,0.79,0.74,0.72,0.6,0.39,0.28,0.24,0.13,0],
[0,0,0,0.01,0.3,0.07,0,0,0.08,0.36,0.64,0.7,0.64,0.6,0.51,0.39,0.29,0.19,0.04,0],
[0,0,0,0,0.1,0.24,0.14,0.1,0.15,0.29,0.45,0.53,0.52,0.46,0.4,0.31,0.21,0.08,0,0],
[0,0,0,0,0,0.08,0.21,0.21,0.22,0.29,0.36,0.39,0.37,0.33,0.26,0.18,0.09,0,0,0],
[0,0,0,0,0,0,0.03,0.13,0.19,0.22,0.24,0.24,0.23,0.18,0.13,0.05,0,0,0,0],
[0,0,0,0,0,0,0,0,0.02,0.06,0.08,0.09,0.07,0.05,0.01,0,0,0,0,0]];
const ORBH = ORB.length, ORBW = ORB[0].length;

// ---- ring kernel: exponential "bump", peak at r=0.5, normalised to sum 1 ----
const D = 2 * R + 1;
const K = new Float32Array(D * D);
{ let sum = 0;
  for (let y = 0; y < D; y++) for (let x = 0; x < D; x++) {
    const dx = x - R, dy = y - R, r = Math.sqrt(dx * dx + dy * dy) / R;
    let v = 0; if (r > 0 && r < 1) v = Math.exp(4 - 1 / (r * (1 - r)));
    K[y * D + x] = v; sum += v;
  }
  for (let i = 0; i < D * D; i++) K[i] /= sum;
}

function makeField() {
  const A = new Float32Array(GW * GH);
  const ox = (GW / 2 - ORBW / 2) | 0, oy = (GH / 2 - ORBH / 2) | 0;
  for (let y = 0; y < ORBH; y++) for (let x = 0; x < ORBW; x++) {
    const v = ORB[y][x]; if (v > 0) A[((oy + y + GH) % GH) * GW + ((ox + x + GW) % GW)] = v;
  }
  return A;
}

// one Lenia step: A += dt · G(K ∗ A), clamped to [0,1] on a torus
function step(A) {
  const out = new Float32Array(GW * GH);
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    let u = 0;
    for (let ky = -R; ky <= R; ky++) {
      const yy = ((y + ky) % GH + GH) % GH;
      for (let kx = -R; kx <= R; kx++) {
        const w = K[(ky + R) * D + (kx + R)]; if (w === 0) continue;
        u += w * A[yy * GW + (((x + kx) % GW + GW) % GW)];
      }
    }
    const g = 2 * Math.exp(-((u - MU) * (u - MU)) / (2 * SIGMA * SIGMA)) - 1;
    let a = A[y * GW + x] + DT * g; out[y * GW + x] = a < 0 ? 0 : a > 1 ? 1 : a;
  }
  return out;
}

function mass(A) { let s = 0; for (let i = 0; i < A.length; i++) s += A[i]; return s; }

// torus-aware centre of mass (circular mean), so a wrapping glider is handled correctly
function centroid(A) {
  let sx = 0, cx = 0, sy = 0, cy = 0, m = 0;
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const a = A[y * GW + x]; if (a <= 0) continue;
    const ax = 2 * Math.PI * x / GW, ay = 2 * Math.PI * y / GH;
    cx += a * Math.cos(ax); sx += a * Math.sin(ax); cy += a * Math.cos(ay); sy += a * Math.sin(ay); m += a;
  }
  const px = (Math.atan2(sx, cx) / (2 * Math.PI) * GW + GW) % GW;
  const py = (Math.atan2(sy, cy) / (2 * Math.PI) * GH + GH) % GH;
  return { x: px, y: py, m };
}
const wrap = (d, W) => { if (d > W / 2) d -= W; else if (d < -W / 2) d += W; return d; };

if (process.argv[1] && process.argv[1].endsWith('genesis_flux.mjs')) {
  let A = makeField();
  const m0 = mass(A); let prev = centroid(A), travelled = 0, mMin = m0, mMax = m0;
  const STEPS = 600, REPORT = 100;
  console.log(`Lenia  R=${R}  μ=${MU}  σ=${SIGMA}  dt=${DT}  grid=${GW}×${GH}  kernel=${D}×${D}`);
  console.log(`seed: Orbium  mass0=${m0.toFixed(1)}\n`);
  for (let s = 1; s <= STEPS; s++) {
    A = step(A);
    const c = centroid(A); travelled += Math.hypot(wrap(c.x - prev.x, GW), wrap(c.y - prev.y, GH)); prev = c;
    const m = c.m; if (m < mMin) mMin = m; if (m > mMax) mMax = m;
    if (s % REPORT === 0) console.log(`t=${String(s).padStart(4)}  mass=${m.toFixed(1)}  (${(100 * m / m0).toFixed(0)}% of seed)  travelled=${travelled.toFixed(1)} cells  speed=${(travelled / s).toFixed(3)} cells/step`);
  }
  const mEnd = mass(A), drift = Math.abs(mEnd - m0) / m0;
  const alive = mEnd > 0.4 * m0;
  const glides = travelled > 3 * ORBW;          // moved much farther than its own body length
  const conserves = (mMax - mMin) / m0 < 0.25;   // mass stays in a tight band (a soliton, not a blowup/decay)
  console.log(`\nfinal mass=${mEnd.toFixed(1)}  (drift ${(100 * drift).toFixed(1)}%)  mass band=[${mMin.toFixed(1)}, ${mMax.toFixed(1)}]  total travel=${travelled.toFixed(1)} cells (${(travelled / ORBW).toFixed(1)}× body length)`);
  console.log((alive && glides && conserves)
    ? '*** FLUX CONFIRMED: the Orbium is a self-propelled soliton — it glides while conserving mass ***'
    : `!!! check failed — alive:${alive} glides:${glides} conserves:${conserves}`);
}
