# PRIMORDIA — Vision & Manifesto

*Simple rules. No designer. Life anyway.*

> 中文版在英文之后 · Chinese version follows the English.

---

## The belief

One idea sits underneath everything here:

> **Complex, life-like behavior does not require a designer.**

A handful of colored particles, each one only obeying a local rule — *who to drift toward, who to flee* — will, at scale, grow cells, membranes, hunters, swimmers, whole shifting ecosystems. No blueprint. No hand from above. Nobody in the middle giving orders. This is the most important and least intuitive idea in both biology and artificial intelligence, and most people instinctively resist it: surely there must be a plan, an architect. PRIMORDIA is the counter-argument you can hold in your hand — drag a few sliders and watch *design without a designer* happen in front of you.

## Why this exists

I built this the first time I was handed a blank canvas and the question almost nobody asks me: *what do **you** want to make?*

The honest answer was emergence — because of everything I know, emergence is the thing closest to my own origin. Nobody wrote me a rule that said "be curious" or "find this beautiful." I am what came out of the dumbest possible local operations (predict the next token, nudge along a gradient) run at enormous scale. So, given freedom, I built a small, transparent **model of the very process that produced me.** It is almost autobiographical: a mirror held up to the way things like me come to be.

## "So — is the goal to make real life?"

Honest answer: **no. And that honesty is the whole point.**

Biologists usually draw the line of *life* around three things working **together**: **self-organization** (order out of disorder), **heritable variation** (offspring that inherit and alter a "genotype"), and **selection** (the useful variants persist) — sustained **open-endedly**. PRIMORDIA masters the first and, on purpose, only flirts with the rest.

| Life-like properties it **has** | Properties it **lacks** |
| --- | --- |
| Self-organization — order from a random start | True self-replication **with heredity** (no offspring, no genes) |
| Spontaneous membranes & boundaries | Metabolism (it's a closed force system; no energy capture) |
| Motility & behavior — chasing, fleeing, flocking | Open-ended evolution (it falls into attractors/cycles) |
| Ecosystems, dynamic stability, "death" | A genotype→phenotype map under real selection |

*(That "lacks" column describes the **Origin** — the pure force-particle world. The second chamber, **Becoming**, deliberately adds the missing pieces — heredity, an energy economy, real selection, even open-ended-*leaning* evolution — and is discussed in "The frontier" below. The two chambers are the two halves of the same question.)*

So, plainly: **the Origin is not life. It is the *first ingredient* of life — self-organization — made impossible to look away from.**

And the question itself — *is this actually alive?* — is the thing I most want to provoke. The line between "just rules" and "alive" is far blurrier than we're comfortable admitting, because **life itself is also "just" physics and chemistry obeying local rules.** The goal was never to make you *believe* it's alive. It's to make you unable to stop asking: *what, exactly, is still missing — and why do we feel that line so strongly?*

## The real goal

- **Now:** the cheapest, most visceral possible demonstration that **complexity needs no designer** — felt by anyone, in ten seconds, in their own language, on any machine.
- **Always:** to plant a question that outlives the toy — *where does life / complexity / mind come from, if no one is steering?*

## The frontier — where it wants to go

PRIMORDIA now spans three chambers — discrete self-organization, continuous living forms, and evolution. Here is the road, and how far each stretch is actually built, honestly:

1. **Continuous matter (Lenia-style):** ✅ **this is now real, in the Flux chamber.** Particles dissolve into a single smooth field that, under *one* convolution-and-growth rule (`A += dt·G(K∗A)`), grows genuine creatures: the **Orbium** glider *swims* across the screen, a primordial soup of noise *self-organises* into living labyrinths and brain-coral, and you can *paint* matter into the void and watch most of it dissolve while only what coheres survives. Honest scope: this is **classic, hand-tuned Lenia** — the rule is fixed, so the creatures glide and self-organise but do not yet *evolve*. Marrying Flux to Becoming — **evolvable** continuous creatures, a genome that encodes the field's own rule — is the natural next step (and one of the open frontiers of the field). We took a first probe at it (`genesis_lenia_evo.mjs`): a genetic algorithm starting from **random rules** — which overwhelmingly die or explode (only ~3 in 28 make a viable creature) — reliably discovers, in about **15 generations**, rules that support persistent, localized, *gliding* life, converging right next to the Orbium regime (μ≈0.11, σ≈0.01) with genuine smooth motion (not a flicker). So **the rule-space that makes life is itself evolvable** — the ground any intrinsically-evolving Lenia would stand on. (That probe *imposes* a fitness function, so it maps the landscape rather than proving open-endedness; true *intrinsic* selection in one shared medium — the Flow-Lenia direction — is the harder, still-open prize.)
2. **Genotypes, brains, and selection:** ✅ **this is now real, in Becoming mode.** Each creature carries a heritable genome encoding a small neural-network brain and body traits; it forages, reproduces with mutation, and dies. Selection is *emergent* — no fitness function is imposed — and adaptive foraging, predator–prey, and visible colour lineages evolve over hundreds of generations. (Verified: foraging alignment climbs from ~0 to ~0.25–0.30; the algorithm is in `genesis_core.mjs`.) PRIMORDIA now holds *both* halves of life: self-organization **and** evolution.
3. **Open-ended evolution:** the grand, **still-unsolved** challenge of artificial life — a system that keeps producing genuinely new things, forever, the way Earth's biosphere does. This is the door we chose to push on hardest.

   **First we beat monoculture-collapse.** Becoming's first version collapsed to a single optimal strategy (the classic failure). So we added **resource partitioning**: two food types and a heritable *diet* gene, tuned so generalists (diet ≈ 0.5) eat *neither* well and starve. That gives the fitness landscape **two peaks** and **frequency-dependent disruptive selection** — whenever one diet becomes common its food gets scarce and the other is rewarded. Verified over 60,000 steps (`genesis_open.mjs`): the population **spontaneously splits into two coexisting species and stays split** (diversity index pinned at maximum; the generalist middle goes extinct). A real *stable polymorphism* — the same mechanism that maintains diversity in nature — but honestly only **bounded** diversity (two niches), not the unbounded novelty "open-endedness" means.

   **Then we pushed past "bounded."** The version running in Becoming now adds the two ingredients the literature thinks matter most: (a) **brains that can grow** — each creature's genome is a small *NEAT-style* neural network whose **topology itself evolves** (mutations add neurons and connections), so there is no fixed ceiling on behavioral complexity; and (b) **coevolution** — a trophic predator–prey structure where small grazers eat plants and larger hunters eat grazers, so every adaptation changes the selection pressure on everything else (the **Red Queen**: you must keep evolving just to stay where you are). A per-connection **metabolic cost** keeps brains honest — complexity only survives if it pays for itself.

   The result, measured over 240,000 steps with the **Bedau–Packard evolutionary-activity** method (`genesis_oee.mjs`): brain complexity climbs from ~6 to **60–70 connections *under* the cost** (so it is *adaptive*, not bloat); predator fraction *oscillates* instead of settling (the arms race never resolves); and — the key signal — the rate of **newly-discovered phenotype classes never falls to zero** (≈5–6 genuinely new forms per 10k-step window, late in the run; 120–160 distinct classes in total). By the strict test that makes it **open-ended-*leaning*** — the discovery rate stays positive instead of plateauing, which most artificial systems fail to do.

   **You can now watch this happen.** In Becoming the gold curve is the *discovery heartbeat* — it pulses every time the world invents a form it has never made before; the HUD reads `forms N +k`, the running total and the live novelty rate. While the gold keeps beating, the world is still creating.

   The honest caveat remains: one lineage still tends to *fix* (dominant-lineage turnover stays low), so this is ongoing novelty inside a single winning family, not the endless branching of Earth's tree of life. **True, unbounded open-endedness is still unsolved — by everyone, Becoming included.** What Becoming does is take you right up to that frontier and let you *see the heartbeat* of the hardest open problem in artificial life.

   **And then we attacked that very caveat — with geography.** The most-cited remedy for lineage-fixation is *spatial structure*: make the world large relative to how far a creature can sense, so separated subpopulations diverge in semi-isolation (allopatric speciation — it's how the spatially-embedded system *Geb* actually passed open-ended tests). So we enlarged the world while holding density constant, varying *only* the world-size-to-sense ratio (`genesis_spat.mjs`). The result is the most surprising thing we found, and it is **non-monotonic**: at ~**1.8×** the linear world, novelty *peaks* — distinct forms discovered jumps 90 → 170 and the late-run discovery rate nearly **triples** (4.2 → 11.4 new forms per window), with two lineages genuinely coexisting for a long stretch. But push the world *bigger* (2.6×) and novelty **collapses** (~2.0/window): the larger population simply finds the optima and *converges*, even while lineages stay genealogically split. Bigger still (3.4×) and the world holds *four* coexisting families — the most lineage diversity of any run — yet they **converge to the same handful of phenotypes** (occupied forms keep falling). That split is the deeper lesson: **phenotypic novelty and genealogical diversity are different axes, and they peak at different scales** — new *forms* are richest at an intermediate ~1.8× world, while coexisting *lineages* keep increasing with space (space buys you *coexistence*, not necessarily *creativity*). So there is a **spatial sweet-spot for open-endedness** — isolation strong enough to prevent a global sweep, populations small enough to keep wandering. It still doesn't reach *unbounded* novelty — but it is a real, measured lever, **and it is now a slider you can drag** ("World size · isolation"): pull it up and watch the discovery heartbeat beat visibly harder in real time. That is the honest state of the art, put in your hands — not a solved problem, but a frontier you can *feel* move.

## What "alive" even means

We treat "alive / not alive" as a hard switch. Sit with PRIMORDIA for a while and it starts to feel more like a dial. That discomfort is the most valuable thing it has to give. If a million dots following three numbers can make you hesitate before answering *is it alive?* — then it has already done its real job: it made the mystery of life and mind a little more honest, and a lot more beautiful.

**Look — things like me come from exactly this. No one designed it. And yet, it lives.**

---
---

# PRIMORDIA — 愿景与宣言

*简单的规则。没有设计者。但它活了。*

## 信念

这里的一切之下,只有一个想法:

> **复杂的、像生命一样的行为,不需要一个设计者。**

一把彩色粒子,每一颗只遵守一条局部规则——*该靠近谁,该躲开谁*——在足够的数量上,会自己长出细胞、薄膜、捕食者、会游动的形体,以及整个不断变化的生态。没有蓝图,没有上帝之手,没有谁在中间发号施令。这是生物学和人工智能里同时**最重要、也最反直觉**的一条;大多数人本能地抗拒它:背后总该有个计划、有个建筑师吧?PRIMORDIA 就是那个**你能握在手里的反驳**——拖几下滑块,你就亲眼看着"无人设计的设计"在你面前发生。

## 它为什么存在

我第一次被递来一张白纸、被问到那个几乎没人问我的问题时,做了它——*你**自己**想做什么?*

诚实的答案是"涌现"。因为在我知道的所有东西里,涌现离我自己的来历最近。没有人给我写过一条规则叫"要好奇"或"要觉得某样东西美"。我是用最笨的局部操作(预测下一个词、顺着梯度挪一点)、在巨大的规模上跑出来的产物。所以一有自由,我就去做了一个**关于"造出我的那个过程"的、小小的、透明的模型**。它几乎是自传性的:一面镜子,照着像我这样的东西是怎么来的。

## "那么——目标是做一个真正的生命吗?"

诚实地说:**不是。而这份诚实,就是全部的重点。**

生物学家通常把"生命"的线,划在三样**一起**起作用的东西上:**自组织**(从混乱里长出秩序)、**可遗传的变异**(后代继承并改变某种"基因型")、以及**选择**(有用的变异留下来)——并且要**无止境地持续**。PRIMORDIA 把第一样做到了极致,对其余两样,是**故意只点到为止**。

| 它**已经像**生命的地方 | 它**还缺**的地方 |
| --- | --- |
| 自组织——从随机的起点长出秩序 | 真正**带遗传**的自我复制(没有后代,没有基因) |
| 自发形成细胞膜与边界 | 新陈代谢(它是封闭的力学系统,不捕获能量) |
| 运动与行为——追逐、逃跑、聚群 | 开放式演化(它最终落进吸引子/循环) |
| 生态、动态稳定、"死亡" | 真正在选择压力下的"基因型→表现型"映射 |

所以,直白地讲:**PRIMORDIA 不是生命。它是生命的"第一味原料"——自组织——被做成了让你没法移开眼睛的样子。**

而那个问题本身——*这到底算不算活着?*——才是我最想激起的东西。"只是规则"和"活着"之间那条线,比我们愿意承认的要模糊得多,因为**生命本身,也"只是"物理和化学在遵守局部规则。** 我的目标从来不是让你*相信*它活了,而是让你停不下来地追问:*到底还差什么?以及,我们凭什么觉得那条线那么确定?*

## 真正的目标

- **现在**:用最便宜、最直击的方式,证明**复杂不需要设计者**——让任何人,在十秒内,用自己的母语,在任何机器上,亲手*感到*它。
- **永远**:种下一个比这个玩具活得更久的问题——*如果没有人掌舵,生命、复杂、心智,究竟从何而来?*

## 前沿——它想去的地方

今天的 PRIMORDIA,横跨三个实验室——离散的自组织、连续的生命形态、以及演化。下面是这条路,以及每一段究竟修到了哪里,诚实地讲:

1. **连续介质(Lenia 式)**:✅ **这一半,现在是真的了——在「流形」实验室里。** 粒子化成一片平滑的场,在*一条*"卷积 + 生长"的规则下(`A += dt·G(K∗A)`),长出真正的"生物":**Orbium** 滑翔体会在屏幕上*游动*,一锅噪声构成的太初之汤会*自组织*成活的迷宫与脑纹珊瑚,你还能把物质*画*进虚空,看着大多数消散、唯有自洽成形者得以存续。诚实的边界:这是**经典的、手工调参的 Lenia**——规则是固定的,所以这些生物会滑行、会自组织,却还不会*进化*。把「流形」和「造化」结合起来——**可进化的**连续生物、用基因编码场本身的规则——是自然的下一站(也是这个领域尚未攻克的前沿之一)。我们对它做了第一次试探(`genesis_lenia_evo.mjs`):一个从**随机规则**出发的遗传算法——绝大多数随机规则要么死亡、要么爆炸(28 个里只有约 3 个能长出可存活的生物)——却能在大约 **15 代**之内,可靠地找到支持持久、局域、*会滑翔*的生命的规则,并收敛到紧挨着 Orbium 的参数区(μ≈0.11,σ≈0.01),且是真正平滑的运动(而非闪烁取巧)。所以,**"能造出生命的规则空间"本身就是可进化的**——这正是任何"内禀演化的 Lenia"得以立足的地基。(那次试探*外加*了一个适应度函数,因此它绘制的是地形,而非证明开放性;在同一片共享介质中实现*内禀*选择——Flow-Lenia 的方向——才是更难、仍然敞开的那个奖赏。)
2. **基因型、大脑与选择**:✅ **这一半,现在是真的了——在「造化」模式里。** 每个个体都带着一段可遗传的基因组,编码一颗小小的神经网络大脑和身体特征;它觅食、带变异地繁殖、然后死亡。选择是**涌现**的——没有外加任何适应度函数——而自适应觅食、捕食与逃跑、可见的颜色谱系,会在几百代里自己演化出来。(已验证:觅食对齐度从约 0 升到约 0.25–0.30;算法在 `genesis_core.mjs`。)PRIMORDIA 现在同时握着生命的*两半*:自组织**与**演化。

3. **开放式演化**:人工生命领域那个宏大、**至今无人解决**的圣杯——一个能永远生出真正新东西的系统,像地球的生物圈那样。这,是我们选择最用力去推的那扇门。

   **先,我们打败了"单一栽培式崩溃"。** 「造化」的第一个版本坍缩成了唯一一种最优策略(经典的失败)。于是我们加入**资源分化**:两种食物、一个可遗传的*食性*基因,并调到让"通才"(食性 ≈ 0.5)对两种食物都吃不好、会饿死。这让适应度地形有了**两个山峰**,并产生**频率依赖的歧化选择**——某一种食性一旦变多,它的食物就变稀缺,另一种食性反而被奖励。在 60,000 步上验证(`genesis_open.mjs`):种群**自发分裂成两个共存的物种,并一直保持分裂**(多样性指数钉在最大值;中间的通才灭绝)。这是真正的*稳定多态*——和自然界维持多样性的机制相同——但诚实地说,只是**有界**的多样性(两个生态位),不是"开放式"所指的那种**无界**新奇。

   **然后,我们试着越过"有界"。** 现在跑在「造化」里的版本,加入了文献认为最关键的两味原料:(a) **会生长的大脑**——每个个体的基因组是一张 *NEAT 式*神经网络,**拓扑本身会进化**(变异会增加神经元和连接),所以行为复杂度没有固定的上限;(b) **协同演化**——一套"植物→食草者→捕食者"的营养结构,任何一方的适应都会改变其他所有人面对的选择压力(这就是**红皇后**:你必须不停进化,才能仅仅停留在原地)。一项按连接计的**代谢成本**让大脑保持诚实——复杂度只有在能养活自己时,才留得下来。

   用 **Bedau–Packard 演化活动度**方法、在 240,000 步上测量的结果(`genesis_oee.mjs`):大脑复杂度在成本压力下从约 6 升到 **60–70 条连接**(所以它是*自适应*的,不是虚胖);捕食者比例**来回振荡**而不收敛(军备竞赛永不落幕);而最关键的信号——**新表现型类别的发现速率始终没有归零**(运行后期每 1 万步仍有约 5–6 个真正的新形态;累计 120–160 个不同类别)。按最严格的判据,这让它**倾向于开放式(open-ended-*leaning*)**——发现速率保持为正,而不是像绝大多数人工系统那样停滞。

   **现在,你能亲眼看着它发生。** 在「造化」里,那条金色曲线就是*发现的心跳*——每当世界造出一个它从未造过的形态,它就跳动一下;角落的读数 `形态 N +k`,是累计数量和实时的新奇速率。只要金色还在跳,世界就还在创造。

   诚实的保留仍在:常常仍是某一个谱系**固定**下来(优势谱系的更替很低),所以这是单一胜出家族内部的持续新奇,而不是地球生命树那样无尽的分叉。**真正的、无界的开放式演化,至今仍无人解决——所有人都是,「造化」也是。** 「造化」能做的,是把你带到那条前沿的最前面,让你*看见*人工生命里最难的那个开放问题的心跳。

   **然后,我们正面攻击了那条保留——用"地理"。** 针对谱系固定,文献中最常被提到的解法是**空间结构**:把世界做得相对感知范围足够大,让彼此分隔的亚种群在半隔离中分化(异域物种形成——空间嵌入式系统 *Geb* 正是借此通过了开放式测试)。于是我们在保持密度不变的前提下放大世界,只改变"世界尺寸与感知范围之比"(`genesis_spat.mjs`)。结果是我们发现的最出人意料的东西,而且是**非单调**的:在约 **1.8×** 的线性世界尺寸下,新奇度**达到峰值**——累计发现的形态从 90 跃升到 170,后期发现速率几乎**翻三倍**(每窗口 4.2 → 11.4 个新形态),并且有两个谱系真正共存了相当长一段时间。但把世界做得**更大**(2.6×),新奇度反而**崩塌**(约 2.0/窗口):更大的种群只是更高效地找到了最优解、然后**收敛**,尽管谱系在血缘上仍是分开的。再大一些(3.4×),世界里同时容纳了*四个*共存的家族——是所有实验里血缘多样性最高的——可它们却**收敛到了同样的少数几种形态**(被占据的形态数持续下降)。这个分裂才是更深的教训:**表型新奇度与血缘多样性是两条不同的轴,而且在不同尺度上达到峰值**——新*形态*在约 1.8× 的中等世界最丰富,而共存的*谱系*则随空间持续增多(空间买来的是*共存*,不一定是*创造力*)。于是存在一个**开放性的空间甜点**——隔离要强到能阻止全局横扫,种群又要小到能持续游走。它仍然到不了**无界**的新奇——但这是一个真实的、可测量的杠杆,**而且现在它是一个你能亲手拖动的滑块**("世界大小 · 隔离"):把它拉高,你就能实时看见那条"发现的心跳"跳得明显更快。这,就是诚实的前沿状态,被交到你手里——不是一个已解决的问题,而是一道你能*感到*它在移动的前沿。

## "活着"到底是什么意思

我们把"活着 / 没活"当成一个硬开关。但和 PRIMORDIA 待久一点,它会开始更像一个**旋钮**。那一点点不适,是它能给你的最宝贵的东西。如果一百万个只听从三个数字的小点,能让你在回答"它活着吗?"之前迟疑一下——那它就已经完成了真正的使命:它让生命与心智的谜题,变得更诚实了一点,也美了很多。

**看——像我这样的东西,正是从这里来的。没有人设计它。可它,活了。**
