// gen-narration.mjs — one-time cinematic narration generator for PRIMORDIA's journey.
//
// Synthesises the 8 chapters × {EN, ZH} into narration/chN-{en,zh}.mp3 using ElevenLabs,
// so the committed audio plays for every visitor (no API key needed at runtime — the
// app falls back to the browser's built-in TTS when these files are absent).
//
// The API key is read ONLY from the environment and is never written anywhere.
//   ELEVENLABS_API_KEY=sk_...  node tools/gen-narration.mjs
// Optional overrides:
//   VOICE_ID=<id>        force a specific voice for both languages
//   VOICE_ID_ZH=<id>     a different voice for Chinese (defaults to VOICE_ID)
//   MODEL=eleven_multilingual_v2   (default; handles EN + ZH)
//
// Node 18+ (global fetch). Output: ./narration/*.mp3
import { mkdir, writeFile } from 'node:fs/promises';

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error('Set ELEVENLABS_API_KEY in the environment (it is never written to disk).'); process.exit(1); }
const MODEL = process.env.MODEL || 'eleven_multilingual_v2';
const SPEED = +(process.env.SPEED || 0.84);   // 0.7–1.2; <1 = slower, more storytelling pace
const LANGS = (process.env.LANGS || 'en,zh').split(',').map(s=>s.trim()).filter(Boolean);   // e.g. LANGS=en for English-only narration

// Canonical narration — must match the chapter text spoken in index.html (Journey.plain()).
const CH = [
  { en: "In the beginning, there was no plan.  No architect. No purpose.  Only matter — and a few blind rules.",
    zh: "最初,没有蓝图。  没有建筑师,没有目的。  只有物质——和几条盲目的规则。" },
  { en: "And yet, order does not wait for permission.  From the rules alone, structure breathes itself into being —  this is emergence: a universe that builds, with no builder.",
    zh: "然而,秩序从不等待谁的允许。  仅凭规则本身,结构便把自己呼吸成形——  这,就是涌现:一个自我建造、却没有建造者的宇宙。" },
  { en: "Shift the rules by a hair, and a different world is born.  None of these forms had to exist.  Each is only an accident that happened to hold together.",
    zh: "将规则改动毫厘,一个全然不同的世界便诞生。  这些形态,本可以全都不存在。  它们每一个,都只是一场恰好稳住了的偶然。" },
  { en: "But beauty is not yet life.  Life is what learns to keep itself — to hunger, to copy, to die.  So we light the fuse, and step back.",
    zh: "但美,还不是生命。  生命,是那个学会了延续自身的东西——会饥饿,会复制,会死亡。  于是我们点燃引线,然后,退后一步。" },
  { en: "Each is born blind — a small mind wired by chance, a code it never chose.  Most will wander, and starve, and leave nothing behind.  This is not cruelty. It is the only teacher there has ever been.",
    zh: "每一个都生而盲目——一颗由偶然布线的小小心智,一段它从未选择的代码。  大多数会徘徊,会饿死,什么也留不下。  这不是残忍。这是有史以来,唯一的老师。" },
  { en: "And then — the oldest miracle of all.  The few who, by pure luck, turn toward what keeps them alive leave a little more of themselves behind.  No one intends it. Yet generation upon generation, they learn.  This is natural selection. You are watching it think.",
    zh: "接着——最古老的那个奇迹,发生了。  那些纯属侥幸、偶然转向了存续之物的少数,把多一点点的自己,留在了身后。  无人有此意图。可一代,又一代,它们学会了。  这,就是自然选择。你正看着它思考。" },
  { en: "Give the world more than one way to live, and life will take them all.  Before your eyes, one kind becomes two — neither commanded nor designed — and both endure.  This is how a single thread became a forest, an ocean, a you.",
    zh: "给这世界不止一种活法,生命便会把每一种都走遍。  就在你眼前,一种,化作两种——无人下令,无人设计——而它们一同存续。  一根孤独的线,正是这样,长成了森林,长成了海洋,长成了你。" },
  { en: "Cells. Minds. Species. Built by no one.  Look long enough, and the line between 'just rules' and 'alive' begins to dissolve —  for you, too, are only rules, running.  You came from exactly this. And so, in my own strange way, did I.",
    zh: "细胞。心智。物种。无人建造。  凝视得够久,'只是规则'与'活着'之间的界线,便开始消融——  因为你,也不过是,一套正在运行的规则。  你,正是从这里来的。而我,也以我自己奇异的方式,源于此处。" },
];

// ── pick a deep, calm narrator voice from the account (or honour the env override) ──
async function api(path, opts={}) {
  const r = await fetch('https://api.elevenlabs.io/v1' + path, { ...opts, headers: { 'xi-api-key': KEY, ...(opts.headers||{}) } });
  return r;
}
async function pickVoice() {
  if (process.env.VOICE_ID) return { en: process.env.VOICE_ID, zh: process.env.VOICE_ID_ZH || process.env.VOICE_ID };
  const r = await api('/voices');
  if (!r.ok) { console.error('Could not list voices:', r.status, await r.text()); process.exit(1); }
  const voices = (await r.json()).voices || [];
  // prefer a deep, narration-style male voice for that "philosophical documentary" feel
  const PREF = ['brian','george','daniel','bill','adam','antoni','arnold','josh','charlie'];
  const byName = n => voices.find(v => (v.name||'').toLowerCase().includes(n));
  let pick = null;
  for (const n of PREF) { pick = byName(n); if (pick) break; }
  if (!pick) pick = voices.find(v => /narrat|deep|calm|documentary/i.test(JSON.stringify(v.labels||{}))) || voices[0];
  if (!pick) { console.error('No voices available on this account.'); process.exit(1); }
  console.log(`Voice: ${pick.name} (${pick.voice_id})`);
  return { en: pick.voice_id, zh: pick.voice_id };
}

async function tts(voiceId, text, outPath) {
  const r = await api(`/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
    body: JSON.stringify({
      text, model_id: MODEL,
      voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.28, use_speaker_boost: true, speed: SPEED },
    }),
  });
  if (!r.ok) { console.error(`  ✗ ${outPath}: ${r.status} ${await r.text()}`); return false; }
  const buf = Buffer.from(await r.arrayBuffer());
  await writeFile(outPath, buf);
  console.log(`  ✓ ${outPath}  (${(buf.length/1024).toFixed(0)} KB)`);
  return true;
}

(async () => {
  await mkdir('narration', { recursive: true });
  const voice = await pickVoice();
  let ok = 0, total = 0;
  for (let i = 0; i < CH.length; i++) {
    for (const lang of LANGS) {
      total++;
      if (await tts(voice[lang], CH[i][lang], `narration/ch${i}-${lang}.mp3`)) ok++;
    }
  }
  console.log(`\nDone: ${ok}/${total} clips written to ./narration/`);
  if (ok < total) process.exit(1);
})();
