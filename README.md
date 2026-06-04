# PRIMORDIA — an artificial life lab · 人工生命实验室

### ▶ [**Play it live**](https://simonchan25.github.io/primordia/) · [**中文说明 (Chinese README)**](README.zh-CN.md)

> Thousands of particles. A handful of rules. Nobody designs the creatures that appear.
>
> 成千上万个粒子，几条简单规则。没有人设计涌现出的生命。

**PRIMORDIA** is a self-contained ["particle life"](https://en.wikipedia.org/wiki/Artificial_life) simulator that runs entirely in your browser. Every coloured particle is attracted to or repelled by every other colour — and *that single rule* is enough to grow cells, membranes, hunters, swimmers, and whole shifting ecosystems. It's a small, hands-on demonstration of one of the deepest ideas in science and AI: **complex, life-like behaviour can emerge from simple local interactions, with no global plan.**

> 📖 **Why this exists — and is the goal to make *real* life?** Read the **[Vision & Manifesto](VISION.md)** (bilingual). Short version: no — PRIMORDIA is the *self-organization* half of life, made impossible to look away from; the honest aim is to make emergence *felt*, and to chase the harder, still-unsolved half (heredity, selection, open-ended evolution).

**Open it and press *Begin*, and a cinematic guided journey plays** — a deep, calm **voice narration** (pre-rendered with [ElevenLabs](https://elevenlabs.io); a live browser-TTS fallback when the audio is absent) over a **generative score** (synthesised live in the Web Audio API), with on-screen captions, walking you through the *real* simulation as it grows from "nothing but blind rules" → self-organising cells → creatures that evolve foraging → one species splitting into two → and finally where life, mind, and *you* come from at all. Bilingual, skippable, replayable by clicking the title. *This is the part that makes it land* — everything below is the lab you're handed afterwards.

It ships with **two interchangeable engines**:

- **WebGPU compute engine** — the whole simulation runs on the GPU with compute-shader *spatial hashing*, comfortably handling **tens of thousands of particles (up to ~200k) at 60fps**, with HDR rendering and multi-pass bloom.
- **WebGL2 + CPU engine** — an automatic fallback (also forceable with `?cpu`) that runs a tight CPU spatial-hash simulation. It shares the *same* HDR → bloom → ACES-tonemap pipeline, so both engines render an identical look. Works everywhere.

The interface is fully **bilingual (English / 简体中文)**, **keyboard- and screen-reader-accessible** (focusable ARIA matrix, labelled controls, `prefers-reduced-motion`), and **touch-friendly** (pinch-zoom, two-finger pan, an attract/repel toggle on phones).

## Three chambers · 三个实验室

PRIMORDIA is a *lab* with three experiments, switchable at the top of the panel — read together, they trace the arc of life: **self-organization → continuous living forms → heredity & selection.**

- **🌌 Origin** — the particle-life world: pure **self-organization**. Local attraction/repulsion rules → emergent cells, membranes, hunters. The *first* ingredient of life.
- **🌊 Flux** — **continuous matter**, the Lenia model (Bert Chan, 2019). No particles and no cells: a single smooth field `A(x)∈[0,1]` on a torus that, each step, **convolves itself with a ring kernel and grows by one Gaussian rule** — `A += dt·G(K∗A)`. From that *one rule*, self-propelled creatures emerge: the famous **Orbium** glider swims across the screen, a **swarm** of them collide and tangle, and a **primordial soup** of random noise self-organises into living labyrinths and brain-coral. **Drag to paint living matter into the void** (most of what you draw dissolves — only what *coheres* survives) and **Shift-drag to carve**; the soup heals what you cut. Two sliders expose the edge between life and death directly — **μ** (the growth threshold) and **σ** (its tolerance). Runs as a WebGL2 ping-pong, so it works wherever the CPU engine does. This is frontier item #1 from [VISION.md](VISION.md), made watchable: *matter that becomes a creature.* (Verified headlessly in [`genesis_flux.mjs`](genesis_flux.mjs): the Orbium glides a steady 0.6 cells/step — **18× its body length** — while conserving mass to within ~5%.)
- **🧬 Becoming** — an **open-ended-evolution lab**. Hundreds of creatures, each with a heritable genome encoding a *NEAT-style brain whose **topology itself evolves*** (mutations add neurons and connections) plus body traits, forage, reproduce with mutation, and die. **Natural selection is emergent — no fitness function is imposed.** A trophic **predator–prey** structure — small **teal** grazers eat plants, larger **pink** hunters eat grazers (the world fills your whole screen) — drives a **Red Queen arms race**, while a per-connection metabolic cost keeps brains *adaptive* rather than bloated. You *watch life happen*: a soft cyan ring blooms at every **birth**, a warm burst flares where a predator makes a **kill** — and you can **click empty space to drop food**, or **tap any creature to open its actual evolved brain** (a live node/connection graph — 9 senses → an evolved tangle nobody designed → 3 choices, nodes flickering as it thinks) and watch **its whole bloodline light up** across the field. A live **discovery heartbeat** (the gold curve) pulses each time the world invents a phenotype it has never made before — the Bedau–Packard novelty signal, made watchable; the HUD reads `forms N +k` (total discovered · live rate). Verdict from 240k-step runs: **open-ended-*leaning*** — the novelty rate never falls to zero — though *unbounded* open-endedness remains unsolved (see [VISION.md](VISION.md)). Drag the **World size · isolation** slider to add spatial structure and watch the heartbeat beat harder — novelty peaks at an intermediate world size, a measured *spatial sweet-spot for open-endedness*. The *second* ingredient of life — heredity + selection — and a real push on its hardest frontier.

Becoming is **verified, not hand-waved** — four headless harnesses you can run in a terminal (`node genesis_*.mjs`):
- [`genesis_core.mjs`](genesis_core.mjs): foraging alignment (heading vs. direction to nearest food) evolves from ~0 (random brains) to ~0.25–0.30 within ~20 generations, population self-sustaining.
- [`genesis_open.mjs`](genesis_open.mjs): with two food types and a heritable *diet* gene, frequency-dependent disruptive selection makes the population **spontaneously split into two coexisting species and stay split** over 60,000 steps — a stable polymorphism (diversity *sustained* instead of collapsing to a monoculture).
- [`genesis_oee.mjs`](genesis_oee.mjs): the open-endedness probe — NEAT-style evolvable brains + predator–prey **coevolution** + a per-connection **complexity cost**, measured with **Bedau–Packard evolutionary-activity statistics** over 240,000 steps. Brain complexity climbs from ~6 to **60–70 connections *under cost*** (adaptive, not bloat); predator fraction *oscillates* (the arms race never resolves); and the rate of **newly-discovered phenotype classes never falls to zero** (~5–6 new forms per 10k-step window late in the run; 120–160 total) — the strict signature of **open-ended-*leaning*** evolution. See [VISION.md](VISION.md) for the honest limits (one lineage still tends to fix; *unbounded* open-endedness is unsolved by everyone).
- [`genesis_spat.mjs`](genesis_spat.mjs): the **spatial-isolation** probe — does *geography* break lineage-fixation? Enlarging the world while holding density constant (varying only the world-size-to-sense ratio) gives a **non-monotonic** answer: phenotypic novelty *peaks* at ~**1.8×** world size (distinct forms 90 → 170, discovery rate 4.2 → 11.4 new/window), then *collapses* at 2.6–3.4× as the larger population converges to optima. Yet *genealogical* diversity keeps climbing with space (3.4× sustains up to **4 coexisting lineages**) — revealing that **phenotypic novelty and lineage diversity are different axes that peak at different scales** (space buys *coexistence*, not necessarily *creativity*). The novelty sweet-spot is now a live **"World size · isolation"** slider in Becoming. Run `node genesis_spat.mjs spatial 1.8` (any scale) or `node genesis_spat.mjs mixed` (well-mixed control).

## Run it

Single HTML file, **zero dependencies, no build step**.

- **Easiest:** double-click `index.html`.
- **Or serve it:**
  ```bash
  python3 -m http.server 4321 --directory .
  # open http://localhost:4321
  ```
- Force the CPU/WebGL2 engine with `index.html?cpu`.

WebGPU needs Chrome/Edge (stable), Safari 18+, or Firefox with WebGPU enabled; everything else automatically uses the WebGL2 engine. The active engine is shown at the bottom-left.

## How to play · 操作

| Action | Control |
| --- | --- |
| Attract particles to the cursor · 吸引 | **drag** (touch: 1 finger) |
| Repel particles · 排斥 | **Shift**+drag / right-drag (touch: 🧲 toggle) |
| Zoom / pan · 缩放/平移 | **scroll** · **Alt**+drag (touch: pinch / 2-finger drag) |
| Pause · 暂停 | **Space** |
| New random rules · 新规则 | **R** |
| Respawn · 重生 | **N** |
| Toggle evolution · 进化 | **E** |
| Background music · 配乐 | **M** (on by default) |
| Replay the opening · 重看开场 | the **🎬** button (or click the wordmark) |
| Paint / erase matter (Flux) · 绘制/擦除 | **drag** / **Shift**+drag on the world |
| New lifeform / clear (Flux) · 新生命/清空 | **R** / **N** |
| Feed the world (Becoming) · 投食 | **click / drag** empty space |
| Inspect a creature (Becoming) · 查看大脑 | **tap** a creature |
| Cycle palette · 配色 | **P** |
| Hide panel · 面板 | **C** |
| Fullscreen / Help | **F** / **H** |
| Switch language 中文/EN | the **中文 / EN** button |

Drag cells in the **interaction matrix** to hand-author who likes whom (green/`+` = attraction, red/`−` = repulsion; focus a cell and use arrow keys for keyboard control). Hit **🔗 Share** to copy a URL that reproduces the exact ecosystem — in **Becoming**, Share captures the settings + starting seed, so a recipient gets the *same* deterministic evolving world; in **Flux** it captures the lifeform, the rule (μ/σ) and the seed. Turn on **🧬 Evolve** and the rules slowly mutate on their own. On the GPU engine, push **Particles** up toward 200k to watch a dense living tissue form.

## The presets

| Preset | What emerges |
| --- | --- |
| random soup · 随机汤 | a fresh, unpredictable world every time |
| 🎲 New rules · 新规则 | rolls a *new archetype* + random species count, forces & palette — every press is a different world |
| clusters · 聚落 | each species clumps into glowing colonies |
| cells · 细胞 | membrane-bound cell-like structures |
| chase · 追逐 | a predator–prey cycle — radiating, restless |
| snakes · 游蛇 | chains and worms that wriggle through the field |
| orbits · 轨道 | particles caught in rotating arrangements |
| symmetry · 对称 | mutual relationships only — calmer, crystalline |

## How it works

Each particle has a position, a velocity, and a **species** (a colour). Every step, for each pair of nearby particles within an interaction radius `rmax`, a force is applied along the line between them:

```
        ┌  r/β − 1                                  for r < β       (universal short-range repulsion)
F(r) =  ┤  a · (1 − |2r − 1 − β| / (1 − β))         for β ≤ r < 1    (attraction/repulsion from the matrix)
        └  0                                         for r ≥ 1
```

where `r` is distance normalised to `[0,1]`, `β` is the repulsion-zone fraction, and `a` is the **interaction-matrix** entry for how this particle's species feels about the other's. The matrix is **asymmetric** — red can chase green while green flees red — which breaks Newton's third law and is exactly why the motion never settles into a boring equilibrium. Everything else — the cells, hunters, membranes — is *emergent*.

The single most important parameter for *look* is **density** (`particles × radius²`): low density makes large, separated, glowing colonies; high density makes a dense, flowing living tissue.

### Engineering notes

- **GPU spatial hashing (WebGPU).** Space is a wrap-around torus partitioned into a grid. Each frame three compute passes run: clear per-cell counts → bin every particle into fixed-capacity buckets with atomics → a force+integrate pass that only reads the 3×3 neighbouring cells. Position/velocity buffers ping-pong so reads stay consistent. Nothing is read back to the CPU, so it scales to ~200k particles.
- **CPU spatial hashing (fallback).** The same neighbourhood idea via an O(n) counting-sort spatial hash in typed arrays — a few thousand particles at 60fps on one core.
- **HDR rendering + bloom.** Particles are drawn as soft additive glows into a 16-bit float buffer; a bright-pass + separable Gaussian blur produces the bloom; an ACES filmic tonemap composites to the screen so dense cores bloom smoothly toward white instead of clipping. Trails come from feeding each frame back with a slight fade.
- **Flux / Lenia (continuous matter).** A WebGL2 ping-pong over two float textures: a fragment shader convolves the field with a precomputed ring kernel (an exponential "bump", `R=18` → a 37×37 tap stencil normalised to sum 1) and applies the Gaussian growth `A += dt·G(K∗A)`, clamped to `[0,1]` on a wrap-around torus. State textures stay `NEAREST` for the exact convolution; a `LINEAR` sampler object smooths the upscale to the screen; an emissive colormap lifts dense cores toward warm white. The painting brush rides the same shader (a signed radial term), so it works even while paused. The canonical Orbium glider is seeded from its published `R=13` pattern, bilinearly rescaled to the live radius.
- **Becoming (neuroevolution).** Creatures carry an evolvable-topology NEAT-lite genome (recurrent, one-step) evaluated on the CPU over an O(n) spatial hash; the brain inspector renders the *actual* selected genome — input/hidden/output nodes laid out left→right with edges coloured by weight sign and lit by live activation.
- **Adaptive quality.** A frame-rate watchdog quietly lowers the particle count if a machine can't keep up.
- **Bilingual.** A small `data-i18n` + `t(key)` layer; language auto-detects from the browser, persists in `localStorage`, and rebuilds the dynamic UI on switch.
- **Cinematic narration.** The journey plays pre-rendered ElevenLabs clips from `narration/chN-en.mp3` (a single deep English narrator), ducking the score and falling back to the browser's `speechSynthesis` if the files are missing. On the opening screen you choose **English or 中文 subtitles** — the *captions* switch language while the English voice stays. Regenerate via: `ELEVENLABS_API_KEY=… LANGS=en VOICE_ID=<id> SPEED=0.84 node tools/gen-narration.mjs` — the key is read only from the environment and never written to disk.
- Poke at `window.__P` in the console (`.S` = live settings, `.GPU`, `.Sim`, `.Sound`, `.G`).

## Inspiration & credits

Particle life has a lovely lineage: Jeffrey Ventrella's **Clusters**, **Tom Mohr**'s clean formulation of the force function, **Hunar Ahmad** ([hunar4321/particle-life](https://github.com/hunar4321/particle-life)), and **lisyarus**'s [WebGPU write-up](https://lisyarus.github.io/blog/posts/particle-life-simulation-in-browser-using-webgpu.html). The **Flux** chamber is built on **Bert Chan**'s [**Lenia**](https://chakazul.github.io/lenia.html) — continuous cellular automata, and the Orbium glider that swims through it.

Built by **Claude** (Anthropic) as a study in emergence.

## License

MIT — do anything you like with it.
