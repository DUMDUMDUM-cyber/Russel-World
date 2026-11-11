// Russel World: sound effects and gentle acoustic music, all synthesized in the browser.
(function () {
'use strict';
const RW = window.RW;
if (RW.failed) return;

let ctx = null, master = null, musicBus = null, sfxBus = null, noiseBuf = null;
const state = { musicOn: true, sfxOn: true, musicVol: 0.34, sfxVol: 0.9 };
const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

function ensure() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
  try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; return false; }
  master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination);
  musicBus = ctx.createGain(); musicBus.gain.value = state.musicOn ? state.musicVol : 0; musicBus.connect(master);
  sfxBus = ctx.createGain(); sfxBus.gain.value = state.sfxOn ? state.sfxVol : 0; sfxBus.connect(master);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return true;
}
function setMusic(on) { state.musicOn = on; if (musicBus) musicBus.gain.setTargetAtTime(on ? state.musicVol : 0, ctx.currentTime, 0.2); }
function setMusicVol(v) { state.musicVol = v; if (musicBus && state.musicOn) musicBus.gain.setTargetAtTime(v, ctx.currentTime, 0.1); }
function setSfxVol(v) { state.sfxVol = v; if (sfxBus && state.sfxOn) sfxBus.gain.setTargetAtTime(v, ctx.currentTime, 0.05); }
function setSfx(on) { state.sfxOn = on; if (sfxBus) sfxBus.gain.setTargetAtTime(on ? state.sfxVol : 0, ctx.currentTime, 0.05); }

// ---------- effects ----------
function tone(freq, dur, type, vol, slide, delay) {
  if (!ctx || !state.sfxOn) return;
  const t0 = ctx.currentTime + (delay || 0), o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(sfxBus); o.start(t0); o.stop(t0 + dur + 0.03);
}
function noise(dur, freq, q, vol, delay, bus) {
  if (!ctx) return;
  if (!bus && !state.sfxOn) return;
  const t0 = ctx.currentTime + (delay || 0), s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q || 1;
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.1, t0 + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f); f.connect(g); g.connect(bus || sfxBus); s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.02);
}
const sfx = {
  hit() { tone(430, 0.09, 'triangle', 0.18, 210); noise(0.05, 1800, 1, 0.06); },
  heavy() { tone(220, 0.16, 'triangle', 0.22, 90); tone(520, 0.08, 'square', 0.06, 260, 0.01); noise(0.09, 900, 0.8, 0.09); },
  crit() { tone(700, 0.14, 'square', 0.1, 350); tone(1050, 0.12, 'triangle', 0.1, 0, 0.03); noise(0.06, 2500, 1, 0.07); },
  miss() { noise(0.12, 1400, 2, 0.05); },
  swing() { noise(0.1, 2200, 1.5, 0.04); },
  throw() { noise(0.14, 1600, 2, 0.05); tone(500, 0.1, 'sine', 0.03, 700); },
  hurt() { tone(190, 0.13, 'sawtooth', 0.06, 120); },
  melt() { tone(640, 0.42, 'sine', 0.13, 140); },
  spore() { tone(520, 0.3, 'triangle', 0.1, 900); noise(0.35, 3000, 0.7, 0.05); },
  pick() { tone(880, 0.08, 'triangle', 0.13); tone(1320, 0.14, 'triangle', 0.11, 0, 0.07); },
  coin() { tone(1568, 0.07, 'square', 0.04); tone(2093, 0.12, 'square', 0.035, 0, 0.06); },
  skill() { tone(320, 0.2, 'sawtooth', 0.06, 760); },
  potion() { tone(520, 0.18, 'sine', 0.12, 980); tone(780, 0.12, 'sine', 0.06, 1200, 0.08); },
  deny() { tone(210, 0.1, 'square', 0.05, 170); },
  click() { tone(660, 0.05, 'triangle', 0.06); },
  point() { tone(784, 0.08, 'triangle', 0.1); tone(1175, 0.1, 'triangle', 0.08, 0, 0.06); },
  buy() { tone(1319, 0.06, 'square', 0.04); tone(1760, 0.1, 'square', 0.04, 0, 0.05); tone(2349, 0.14, 'triangle', 0.05, 0, 0.1); },
  level() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.24, 'triangle', 0.15, 0, i * 0.11)); tone(1568, 0.6, 'sine', 0.08, 0, 0.46); },
  faint() { [392, 349, 311, 262].forEach((f, i) => tone(f, 0.3, 'triangle', 0.09, 0, i * 0.18)); },
  revive() { [523, 784, 1047].forEach((f, i) => tone(f, 0.3, 'sine', 0.08, 0, i * 0.1)); },
  // each speaker has their own voice pitch (Olly high, Bolt low)
  talk(base) { const b = base || 500; tone(b + Math.random() * b * 0.5, 0.04, 'square', 0.025); },
  questNew() { tone(659, 0.12, 'triangle', 0.09); tone(988, 0.2, 'triangle', 0.08, 0, 0.1); },
  questDone() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.22, 'triangle', 0.1, 0, i * 0.08)); tone(1568, 0.5, 'sine', 0.06, 0, 0.42); },
  step() { tone(880, 0.08, 'triangle', 0.08); tone(1175, 0.12, 'triangle', 0.07, 0, 0.06); },
  hoot() { tone(620, 0.16, 'sine', 0.09, 560); tone(560, 0.22, 'sine', 0.08, 500, 0.2); },
  page() { noise(0.18, 2600, 0.8, 0.05); tone(300, 0.08, 'sine', 0.03, 420); },
  sparkle() { [1568, 2093, 2637].forEach((f, i) => tone(f, 0.2, 'sine', 0.05, 0, i * 0.05)); },
  // delivery 6: pets
  chirp(p) { const b = p || 900; tone(b, 0.08, 'sine', 0.08, b * 1.5); tone(b * 1.2, 0.1, 'sine', 0.06, b * 1.8, 0.09); },
  chew() { [0, 0.16, 0.32].forEach((d) => { noise(0.06, 1200, 1, 0.05, d); tone(260, 0.05, 'triangle', 0.03, 200, d); }); },
  splash() { noise(0.35, 2400, 0.9, 0.06); tone(900, 0.15, 'sine', 0.04, 500, 0.05); tone(1300, 0.12, 'sine', 0.03, 700, 0.18); },
  crack() { noise(0.08, 3000, 1.5, 0.09); tone(300, 0.06, 'square', 0.04, 200); },
  select() { tone(587, 0.09, 'triangle', 0.09); tone(880, 0.14, 'triangle', 0.08, 0, 0.06); },
  appear() { [784, 988, 1175, 1568, 1976].forEach((f, i) => tone(f, 0.5, 'sine', 0.07, 0, i * 0.07)); noise(0.6, 6000, 0.8, 0.03, 0.05); },
  start() { [587, 740, 880, 1175].forEach((f, i) => tone(f, 0.4, 'triangle', 0.08, 0, i * 0.09)); },
  erase() { [523, 440, 349].forEach((f, i) => tone(f, 0.22, 'triangle', 0.07, 0, i * 0.12)); noise(0.4, 1200, 0.7, 0.04, 0.2); },
  // delivery 4: gates, chests, golden monsters, boars and hedgehogs
  gate() { noise(0.7, 900, 0.6, 0.06); tone(392, 0.5, 'sine', 0.05, 784); tone(587, 0.5, 'sine', 0.04, 1175, 0.12); },
  chest() { tone(180, 0.12, 'triangle', 0.08, 140); noise(0.18, 700, 1, 0.05); [784, 988, 1175, 1568, 1976].forEach((f, i) => tone(f, 0.35, 'triangle', 0.08, 0, 0.18 + i * 0.07)); },
  golden() { [1047, 1319, 1568, 2093, 2637].forEach((f, i) => tone(f, 0.4, 'sine', 0.06, 0, i * 0.06)); noise(0.5, 7000, 0.8, 0.03); },
  charge() { tone(140, 0.25, 'sawtooth', 0.07, 90); noise(0.3, 400, 0.8, 0.08); },
  tip() { tone(260, 0.2, 'triangle', 0.1, 110); noise(0.25, 600, 0.7, 0.06, 0.08); },
  thorn() { tone(1400, 0.06, 'square', 0.04, 900); tone(220, 0.1, 'sawtooth', 0.04, 160, 0.02); },
  book() { tone(659, 0.12, 'triangle', 0.08); tone(880, 0.12, 'triangle', 0.07, 0, 0.08); tone(1319, 0.25, 'sine', 0.06, 0, 0.16); }
};

// ---------- instruments ----------
const pluckCache = new Map();
function pluckBuffer(midi, bright) {
  const key = midi + (bright ? 'b' : '');
  let b = pluckCache.get(key); if (b) return b;
  const sr = ctx.sampleRate, f = midiHz(midi), N = Math.max(2, Math.round(sr / f)), L = Math.round(sr * (midi < 48 ? 2.2 : 1.6));
  b = ctx.createBuffer(1, L, sr);
  const out = b.getChannelData(0), ring = new Float32Array(N);
  let last = 0;
  for (let i = 0; i < N; i++) { const n = Math.random() * 2 - 1; last = bright ? n : last * 0.5 + n * 0.5; ring[i] = last; }
  const decay = midi < 48 ? 0.997 : 0.9955;
  let idx = 0;
  for (let i = 0; i < L; i++) { const a = ring[idx], nb = ring[(idx + 1) % N]; out[i] = a; ring[idx] = (a + nb) * 0.5 * decay; idx = (idx + 1) % N; }
  for (let i = 0; i < 64 && i < L; i++) out[L - 1 - i] *= i / 64;
  pluckCache.set(key, b);
  return b;
}
function pluck(bus, midi, t, vol, bright) {
  const s = ctx.createBufferSource(), g = ctx.createGain();
  s.buffer = pluckBuffer(midi, bright); g.gain.value = vol;
  s.connect(g); g.connect(bus); s.start(t);
}
function flute(bus, midi, t, dur, vol) {
  const f = midiHz(midi), o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
  const lfo = ctx.createOscillator(), lfoG = ctx.createGain();
  o.type = 'sine'; o2.type = 'triangle'; o.frequency.value = f; o2.frequency.value = f;
  lfo.frequency.value = 5.2; lfoG.gain.setValueAtTime(0, t); lfoG.gain.linearRampToValueAtTime(f * 0.006, t + Math.min(0.35, dur * 0.6));
  lfo.connect(lfoG); lfoG.connect(o.frequency); lfoG.connect(o2.frequency);
  lp.type = 'lowpass'; lp.frequency.value = 2600;
  const g2 = ctx.createGain(); g2.gain.value = 0.25;
  o.connect(g); o2.connect(g2); g2.connect(g); g.connect(lp); lp.connect(bus);
  const end = t + dur;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.06); g.gain.setValueAtTime(vol * 0.85, Math.max(t + 0.07, end - 0.1)); g.gain.exponentialRampToValueAtTime(0.0001, end + 0.08);
  o.start(t); o2.start(t); lfo.start(t); o.stop(end + 0.12); o2.stop(end + 0.12); lfo.stop(end + 0.12);
  // a breath of air at the start
  const s = ctx.createBufferSource(), bf = ctx.createBiquadFilter(), ng = ctx.createGain();
  s.buffer = noiseBuf; bf.type = 'bandpass'; bf.frequency.value = f * 2; bf.Q.value = 2;
  ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime(vol * 0.25, t + 0.03); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  s.connect(bf); bf.connect(ng); ng.connect(bus); s.start(t, Math.random() * 0.5); s.stop(t + 0.2);
}
function bell(bus, midi, t, vol) {
  const f = midiHz(midi);
  for (const [mul, v, d] of [[1, 1, 1.4], [2.76, 0.35, 0.5], [5.4, 0.15, 0.25]]) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f * mul;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol * v, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + d + 0.05);
  }
}

// ---------- songs ----------
const SONGS = {
  // title: a warm morning in D major. Guitar alone first, then the flute, then a soft held harmony as it grows
  title: {
    bpm: 84, beats: 4,
    chords: { D: [38, [50, 54, 57, 62]], Bm: [47, [50, 54, 59, 62]], G: [43, [50, 55, 59, 62]], A: [45, [49, 52, 57, 61]], Fsm: [42, [49, 54, 57, 61]], Em: [40, [52, 55, 59, 64]] },
    prog: ['D', 'Bm', 'G', 'A', 'D', 'Bm', 'G', 'A', 'G', 'A', 'Fsm', 'Bm', 'G', 'Em', 'A', 'D'],
    arp: [[0, 'b'], [0.5, 1], [1, 2], [1.5, 3], [2, 'b'], [2.5, 2], [3, 1], [3.5, 2]],
    mel: [
      [[74, 1.5], [76, 0.5], [78, 1], [81, 1]], [[83, 2], [81, 1], [78, 1]], [[79, 1.5], [78, 0.5], [76, 1], [74, 1]], [[76, 3], [0, 1]],
      [[74, 1.5], [76, 0.5], [78, 1], [81, 1]], [[86, 2], [83, 1], [81, 1]], [[83, 1], [81, 1], [79, 1], [76, 1]], [[81, 3], [0, 1]],
      [[79, 1], [81, 1], [83, 2]], [[81, 1], [79, 1], [76, 2]], [[78, 1], [81, 1], [85, 2]], [[86, 3], [0, 1]],
      [[83, 1.5], [81, 0.5], [79, 1], [83, 1]], [[81, 1.5], [79, 0.5], [76, 2]], [[78, 1], [76, 1], [73, 1], [76, 1]], [[74, 4]]
    ],
    shaker: false, grow: true
  },
  town: {
    bpm: 96, beats: 3,
    chords: { F: [41, [53, 57, 60, 65]], C: [36, [52, 55, 60, 64]], Dm: [38, [50, 53, 57, 62]], Bb: [46, [50, 53, 58, 62]] },
    prog: ['F', 'C', 'Dm', 'Bb', 'F', 'C', 'Bb', 'C', 'Dm', 'Bb', 'F', 'C', 'Dm', 'Bb', 'C', 'F'],
    arp: [[0, 'b'], [0.5, 1], [1, 2], [1.5, 3], [2, 2], [2.5, 1]],
    mel: [
      [[69, 1], [72, 1], [77, 1]], [[76, 1.5], [74, 0.5], [72, 1]], [[74, 1], [77, 1], [81, 1]], [[79, 2], [77, 1]],
      [[77, 1], [81, 1], [84, 1]], [[82, 1], [81, 1], [79, 1]], [[77, 1], [74, 1], [77, 1]], [[76, 2], [0, 1]],
      [[74, 1], [76, 1], [77, 1]], [[74, 2], [70, 1]], [[72, 1], [77, 1], [81, 1]], [[79, 2], [76, 1]],
      [[77, 1], [81, 1], [86, 1]], [[84, 1], [82, 1], [79, 1]], [[81, 1], [79, 1], [76, 1]], [[77, 2], [0, 1]]
    ],
    shaker: false
  },
  meadow: {
    bpm: 112, beats: 4,
    chords: { G: [43, [55, 59, 62, 67]], D: [38, [50, 54, 57, 62]], Em: [40, [52, 55, 59, 64]], C: [36, [52, 55, 60, 64]] },
    prog: ['G', 'D', 'Em', 'C', 'G', 'D', 'C', 'D', 'Em', 'C', 'G', 'D', 'Em', 'C', 'D', 'D'],
    arp: [[0, 'b'], [0.5, 1], [1, 2], [1.5, 3], [2, 'b'], [2.5, 2], [3, 1], [3.5, 2]],
    mel: [
      [[74, 1], [71, 0.5], [74, 0.5], [79, 1.5], [78, 0.5]], [[76, 1], [74, 1], [69, 1.5], [71, 0.5]], [[67, 1], [71, 0.5], [76, 0.5], [79, 1], [78, 0.5], [76, 0.5]], [[76, 1.5], [74, 0.5], [72, 1], [76, 1]],
      [[74, 0.5], [79, 0.5], [81, 1], [83, 1], [81, 0.5], [79, 0.5]], [[78, 1], [76, 0.5], [74, 0.5], [81, 2]], [[79, 1], [76, 0.5], [79, 0.5], [81, 1], [79, 0.5], [76, 0.5]], [[74, 1], [78, 1], [81, 1], [0, 1]],
      [[71, 1], [76, 1], [79, 1], [76, 1]], [[72, 1], [76, 1], [79, 1.5], [76, 0.5]], [[74, 1], [79, 1], [83, 1], [81, 0.5], [79, 0.5]], [[81, 2], [78, 1], [74, 1]],
      [[76, 1], [79, 1], [83, 1.5], [81, 0.5]], [[79, 1], [76, 1], [72, 1], [76, 1]], [[74, 1], [76, 0.5], [78, 0.5], [81, 1], [78, 1]], [[79, 3], [0, 1]]
    ],
    shaker: true
  },
  // Breezy Hills: bright and airy in A major, the flute floats like a kite
  hills: {
    bpm: 104, beats: 4,
    chords: { A: [45, [52, 57, 61, 64]], E: [40, [52, 56, 59, 64]], Fsm: [42, [54, 57, 61, 66]], D: [38, [50, 54, 57, 62]], Csm: [37, [52, 56, 61, 64]], Bm: [47, [50, 54, 59, 62]] },
    prog: ['A', 'E', 'Fsm', 'D', 'A', 'E', 'D', 'E', 'Fsm', 'Csm', 'D', 'A', 'Bm', 'D', 'E', 'A'],
    arp: [[0, 'b'], [0.5, 1], [1, 2], [1.5, 3], [2, 'b'], [2.5, 3], [3, 2], [3.5, 1]],
    mel: [
      [[76, 2], [73, 1], [76, 1]], [[81, 3], [80, 1]], [[78, 1.5], [76, 0.5], [73, 2]], [[74, 3], [0, 1]],
      [[76, 1], [78, 1], [81, 2]], [[83, 1.5], [81, 0.5], [80, 2]], [[78, 1], [76, 1], [74, 1], [78, 1]], [[76, 3], [0, 1]],
      [[73, 1], [76, 1], [81, 2]], [[80, 1.5], [78, 0.5], [76, 2]], [[74, 1], [78, 1], [81, 1], [86, 1]], [[85, 3], [0, 1]],
      [[86, 1.5], [85, 0.5], [83, 2]], [[81, 1], [78, 1], [74, 2]], [[76, 1], [80, 1], [83, 1], [80, 1]], [[81, 4]]
    ],
    shaker: true
  },
  // Whisperwood: calm and a little magical in E minor, slow, with bells answering the flute
  wood: {
    bpm: 78, beats: 3,
    chords: { Em: [40, [52, 55, 59, 64]], C: [36, [52, 55, 60, 64]], G: [43, [55, 59, 62, 67]], D: [38, [50, 54, 57, 62]], Am: [45, [52, 57, 60, 64]], B: [47, [51, 54, 59, 63]] },
    prog: ['Em', 'C', 'G', 'D', 'Em', 'C', 'Am', 'B', 'C', 'G', 'Am', 'Em', 'C', 'D', 'B', 'Em'],
    arp: [[0, 'b'], [0.5, 1], [1, 2], [1.5, 3], [2, 2], [2.5, 1]],
    mel: [
      [[71, 2], [67, 1]], [[72, 1.5], [71, 0.5], [67, 1]], [[74, 2], [71, 1]], [[69, 3]],
      [[71, 1], [74, 1], [76, 1]], [[79, 2], [76, 1]], [[76, 1], [74, 1], [72, 1]], [[71, 3]],
      [[72, 1], [76, 1], [79, 1]], [[78, 2], [74, 1]], [[72, 1.5], [71, 0.5], [69, 1]], [[71, 3]],
      [[76, 1], [79, 1], [84, 1]], [[81, 2], [78, 1]], [[78, 1], [75, 1], [71, 1]], [[76, 3]]
    ],
    shaker: false, bellsAlways: true
  },
  // Riverside: easy and flowing in F major, like water turning a mill wheel
  river: {
    bpm: 96, beats: 4,
    chords: { F: [41, [53, 57, 60, 65]], C: [36, [52, 55, 60, 64]], Dm: [38, [50, 53, 57, 62]], Bb: [46, [50, 53, 58, 62]], Am: [45, [52, 57, 60, 64]], Gm: [43, [50, 55, 58, 62]] },
    prog: ['F', 'C', 'Dm', 'Bb', 'F', 'C', 'Bb', 'C', 'Dm', 'Am', 'Bb', 'F', 'Gm', 'Bb', 'C', 'F'],
    arp: [[0, 'b'], [0.5, 1], [1, 2], [1.5, 3], [2, 'b'], [2.5, 2], [3, 1], [3.5, 2]],
    mel: [
      [[72, 1.5], [69, 0.5], [72, 1], [77, 1]], [[76, 2], [72, 1], [67, 1]], [[69, 1.5], [72, 0.5], [74, 1], [77, 1]], [[74, 3], [0, 1]],
      [[77, 1], [76, 0.5], [74, 0.5], [72, 1], [69, 1]], [[67, 1.5], [69, 0.5], [72, 2]], [[74, 1], [77, 1], [74, 1], [70, 1]], [[72, 3], [0, 1]],
      [[74, 1], [77, 1], [81, 2]], [[79, 1.5], [77, 0.5], [76, 2]], [[74, 1], [77, 1], [82, 1], [81, 1]], [[81, 3], [0, 1]],
      [[79, 1.5], [77, 0.5], [74, 2]], [[77, 1], [74, 1], [70, 2]], [[72, 1], [76, 1], [79, 1], [76, 1]], [[77, 4]]
    ],
    shaker: true
  },
  // Thornbush: bouncy and a bit cheeky in D minor, buzzing like bees
  thorn: {
    bpm: 118, beats: 4,
    chords: { Dm: [38, [50, 53, 57, 62]], G: [43, [55, 59, 62, 67]], C: [36, [52, 55, 60, 64]], Am: [45, [52, 57, 60, 64]], F: [41, [53, 57, 60, 65]], A: [45, [49, 52, 57, 61]] },
    prog: ['Dm', 'G', 'Dm', 'C', 'Dm', 'G', 'F', 'A', 'Dm', 'G', 'C', 'Am', 'F', 'G', 'A', 'Dm'],
    arp: [[0, 'b'], [0.5, 1], [1, 2], [1.5, 3], [2, 'b'], [2.5, 3], [3, 2], [3.5, 1]],
    mel: [
      [[74, 0.5], [77, 0.5], [74, 0.5], [72, 0.5], [69, 1], [74, 1]], [[71, 1], [74, 1], [79, 1.5], [77, 0.5]], [[77, 1], [74, 1], [69, 2]], [[72, 1], [76, 1], [79, 1], [0, 1]],
      [[81, 0.5], [79, 0.5], [77, 0.5], [76, 0.5], [74, 1], [77, 1]], [[79, 1.5], [77, 0.5], [74, 2]], [[72, 1], [77, 1], [81, 1], [79, 1]], [[76, 3], [0, 1]],
      [[74, 1], [77, 1], [81, 1.5], [79, 0.5]], [[79, 1], [83, 1], [86, 2]], [[84, 1], [79, 1], [76, 1], [72, 1]], [[76, 3], [0, 1]],
      [[77, 1], [81, 1], [84, 1.5], [81, 0.5]], [[83, 1], [79, 1], [74, 2]], [[73, 1], [76, 1], [79, 1], [76, 1]], [[74, 4]]
    ],
    shaker: true
  },
  // Rootling Burrow: slow and hushed in A minor, bells drip like water in a cave
  burrow: {
    bpm: 72, beats: 3,
    chords: { Am: [45, [52, 57, 60, 64]], F: [41, [53, 57, 60, 65]], G: [43, [55, 59, 62, 67]], E: [40, [52, 56, 59, 64]], Dm: [38, [50, 53, 57, 62]] },
    prog: ['Am', 'F', 'G', 'E', 'Am', 'F', 'Dm', 'E', 'F', 'G', 'Am', 'Am', 'Dm', 'F', 'E', 'Am'],
    arp: [[0, 'b'], [0.5, 1], [1, 2], [1.5, 3], [2, 2], [2.5, 1]],
    mel: [
      [[69, 2], [72, 1]], [[77, 1.5], [76, 0.5], [72, 1]], [[74, 2], [71, 1]], [[68, 3]],
      [[69, 1], [72, 1], [76, 1]], [[77, 2], [72, 1]], [[74, 1], [72, 1], [69, 1]], [[71, 3]],
      [[72, 1], [77, 1], [81, 1]], [[79, 2], [74, 1]], [[76, 1.5], [74, 0.5], [72, 1]], [[69, 3]],
      [[74, 1], [77, 1], [81, 1]], [[77, 2], [72, 1]], [[71, 1], [68, 1], [71, 1]], [[69, 3]]
    ],
    shaker: false, bellsAlways: true
  },
  // boss fight: fast and brave in A minor
  boss: {
    bpm: 132, beats: 4,
    chords: { Am: [45, [52, 57, 60, 64]], F: [41, [53, 57, 60, 65]], G: [43, [55, 59, 62, 67]], E: [40, [52, 56, 59, 64]], Dm: [38, [50, 53, 57, 62]] },
    prog: ['Am', 'Am', 'F', 'G', 'Am', 'Am', 'E', 'E', 'F', 'G', 'Am', 'Dm', 'F', 'G', 'E', 'Am'],
    arp: [[0, 'b'], [0.5, 1], [1, 2], [1.5, 3], [2, 'b'], [2.5, 3], [3, 2], [3.5, 1]],
    mel: [
      [[69, 0.5], [72, 0.5], [76, 0.5], [72, 0.5], [69, 0.5], [72, 0.5], [76, 1]], [[77, 1], [76, 1], [72, 1], [69, 1]], [[72, 0.5], [77, 0.5], [81, 1], [77, 1], [72, 1]], [[74, 1], [79, 1], [83, 1], [79, 1]],
      [[81, 1.5], [79, 0.5], [76, 2]], [[72, 1], [76, 1], [81, 2]], [[80, 1], [76, 1], [71, 1], [76, 1]], [[80, 3], [0, 1]],
      [[77, 1], [81, 1], [84, 2]], [[83, 1], [79, 1], [74, 2]], [[76, 1], [81, 1], [84, 1], [81, 1]], [[77, 2], [74, 2]],
      [[72, 1], [77, 1], [81, 1], [77, 1]], [[79, 1], [83, 1], [86, 2]], [[83, 1], [80, 1], [76, 1], [71, 1]], [[69, 4]]
    ],
    shaker: true
  },
  // Pebble Cave: slow, echoing bells in E minor, like drops falling in the dark
  cave: {
    bpm: 80, beats: 4,
    chords: { Em: [40, [52, 55, 59, 64]], C: [36, [52, 55, 60, 64]], G: [43, [55, 59, 62, 67]], D: [38, [50, 54, 57, 62]], Am: [45, [52, 57, 60, 64]], B: [47, [51, 54, 59, 63]] },
    prog: ['Em', 'C', 'G', 'D', 'Em', 'C', 'Am', 'B', 'C', 'G', 'Am', 'Em', 'C', 'D', 'B', 'Em'],
    arp: [[0, 'b'], [1, 1], [1.5, 2], [2, 3], [3, 2]],
    mel: [
      [[76, 2], [79, 1], [76, 1]], [[72, 3], [0, 1]], [[74, 1], [79, 1], [83, 2]], [[81, 3], [0, 1]],
      [[79, 1], [76, 1], [71, 2]], [[72, 2], [76, 2]], [[72, 1], [76, 1], [81, 2]], [[78, 3], [0, 1]],
      [[76, 1], [79, 1], [84, 2]], [[83, 2], [79, 2]], [[81, 1], [76, 1], [72, 2]], [[71, 3], [0, 1]],
      [[72, 1], [76, 1], [79, 2]], [[78, 1], [74, 1], [81, 2]], [[78, 1], [75, 1], [71, 2]], [[76, 4]]
    ],
    shaker: false, bellsAlways: true
  },
  // the King's fight: a proud, bouncy march in D minor
  king: {
    bpm: 140, beats: 4,
    chords: { Dm: [38, [50, 53, 57, 62]], Bb: [46, [50, 53, 58, 62]], C: [36, [52, 55, 60, 64]], A: [45, [49, 52, 57, 61]], Gm: [43, [50, 55, 58, 62]], F: [41, [53, 57, 60, 65]] },
    prog: ['Dm', 'Dm', 'Bb', 'C', 'Dm', 'Gm', 'A', 'A', 'Bb', 'C', 'F', 'Dm', 'Gm', 'C', 'A', 'Dm'],
    arp: [[0, 'b'], [0.5, 1], [1, 2], [1.5, 1], [2, 'b'], [2.5, 3], [3, 2], [3.5, 1]],
    mel: [
      [[74, 0.5], [74, 0.5], [77, 0.5], [74, 0.5], [81, 1], [77, 1]], [[76, 0.5], [74, 0.5], [73, 1], [74, 2]], [[74, 1], [77, 1], [82, 2]], [[79, 1], [76, 1], [72, 2]],
      [[74, 0.5], [77, 0.5], [81, 1], [86, 1], [81, 1]], [[82, 1], [79, 1], [74, 2]], [[76, 1], [79, 1], [81, 1], [85, 1]], [[81, 3], [0, 1]],
      [[82, 1], [81, 1], [79, 1], [77, 1]], [[79, 1], [76, 1], [72, 2]], [[77, 1], [81, 1], [84, 2]], [[81, 1], [77, 1], [74, 2]],
      [[79, 1], [82, 1], [86, 2]], [[84, 1], [79, 1], [76, 2]], [[73, 1], [76, 1], [79, 1], [81, 1]], [[74, 4]]
    ],
    shaker: true
  }
};
const player = { song: null, gain: null, bar: 0, loop: 0, nextBar: 0, old: [] };
function prepare(song) { for (const ch of Object.values(song.chords)) { pluckBuffer(ch[0], false); for (const m of ch[1]) pluckBuffer(m, true); } }
function play(id) {
  if (!ctx) return;
  if (!SONGS[id]) id = 'meadow';
  if (player.song === SONGS[id]) return;
  const now = ctx.currentTime;
  if (player.gain) { const g = player.gain; g.gain.setTargetAtTime(0, now, 0.5); setTimeout(() => { try { g.disconnect(); } catch (e) { /* already gone */ } }, 4000); }
  const song = SONGS[id]; prepare(song);
  player.song = song; player.bar = 0; player.loop = 0; player.nextBar = now + 0.4;
  player.gain = ctx.createGain(); player.gain.gain.setValueAtTime(0.0001, now); player.gain.gain.exponentialRampToValueAtTime(1, now + 1.2); player.gain.connect(musicBus);
}
function scheduleBar(song, bar, t, loop) {
  const spb = 60 / song.bpm, bus = player.gain, name = song.prog[bar], ch = song.chords[name];
  for (const [beat, which] of song.arp) {
    const m = which === 'b' ? ch[0] : ch[1][which];
    pluck(bus, m, t + beat * spb + (which === 'b' ? 0 : 0.012), which === 'b' ? 0.42 : 0.2, which !== 'b');
  }
  let beat = 0;
  const useBells = song.bellsAlways ? bar % 4 === 2 : loop % 2 === 1 && bar < 8;
  const quietIntro = song.grow && loop === 0 && bar < 4;
  if (!quietIntro) for (const [m, len] of song.mel[bar]) {
    if (m) { if (useBells) bell(bus, m + 12, t + beat * spb, 0.07); else flute(bus, m, t + beat * spb, len * spb * 0.92, 0.12); }
    beat += len;
  }
  if (quietIntro && bar === 3) bell(bus, 81, t + 2 * spb, 0.05);
  // the song opens up: a soft held harmony and a low pluck on the off-beat
  if (song.grow && (loop > 0 || bar >= 8)) { flute(bus, ch[1][1] + 12, t, song.beats * spb * 0.96, 0.035); pluck(bus, ch[0] + 12, t + 1.5 * spb, 0.16, false); }
  if (bar % 4 === 3) bell(bus, ch[1][3] + 12, t + (song.beats - 1) * spb, 0.045);
  if (song.shaker) for (let b = 0; b < song.beats; b++) noise(0.05, 7000, 1.2, b % 2 ? 0.02 : 0.012, t + (b + 0.5) * spb - ctx.currentTime, bus);
}
function tick() {
  if (!ctx || !player.song || !state.musicOn) return;
  const now = ctx.currentTime, song = player.song;
  if (player.nextBar < now - 0.3) player.nextBar = now + 0.1;
  while (player.nextBar < now + 0.5) {
    scheduleBar(song, player.bar, player.nextBar, player.loop);
    player.nextBar += song.beats * 60 / song.bpm;
    player.bar++; if (player.bar >= song.prog.length) { player.bar = 0; player.loop++; }
  }
}

RW.audio = { ensure, sfx, play, tick, setMusic, setSfx, setMusicVol, setSfxVol, state, SONGS };
})();
