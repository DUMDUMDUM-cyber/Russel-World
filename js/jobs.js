// Russel World: jobs (delivery 5). The four masters, trying a job, the trials, the skills window and the skill buttons.
(function () {
'use strict';
const RW = window.RW;
if (!RW || RW.failed || !RW.G || !RW.world) return;
const { THREE, JOBS, WEAPONS, SKILL_MAX, rnd } = RW;
const W = RW.world, G = RW.G, UI = RW.UI, sfx = RW.audio.sfx, esc = G.esc;
const $ = (id) => document.getElementById(id);
let P = null;
const MASTERS = { warrior: 'marla', archer: 'ivy', mage: 'zara', robot: 'bolt' };
const L = (who, face, text) => ({ who, face, text: text.replace(/\{hero\}/g, P ? P.name : 'friend') });
const bye = () => { UI.hideDialog(); G.endTalk(); };
function walkableNear(x, z) {
  if (W.walkable(x, z, true)) return { x, z };
  for (let r = 1; r < 10; r++) for (let a = 0; a < 12; a++) { const xx = x + Math.cos(a / 12 * Math.PI * 2) * r, zz = z + Math.sin(a / 12 * Math.PI * 2) * r; if (W.walkable(xx, zz, true)) return { x: xx, z: zz }; }
  return { x, z };
}
const npc = (id) => G.npcs.find((n) => n.id === id);

// ---------- what each master says ----------
const SAY = {
  warrior: {
    early: [['marla', 'happy', 'HA! A little sprout! Come back at Lv. 10 and I will make a Warrior out of you.'], ['marla', 'normal', 'Until then: eat well, hit Leaflets, and never skip leg day.']],
    intro: [['marla', 'happy', 'Lv. 10 already? Look at you! I am Marla Ironheart, and I teach WARRIORS.'], ['marla', 'normal', 'Warriors fight up close. Big hits, thick skin, and we never, ever run. Well. Rarely.'], ['marla', 'happy', 'Try a weapon on my training dummies, or take my trial: knock down three dummies that hit back, and do not faint!']],
    pass: [['marla', 'happy', 'THAT is a Warrior! Welcome to the family, {hero}!'], ['marla', 'normal', 'Here is your armor. And remember: press C to spend your skill points.']],
    fail: [['marla', 'worried', 'Down you go! No shame in it. Get up, have a snack, and try again.']],
    mine: [['marla', 'happy', 'My favourite Warrior! Spend your skill points with C and keep hitting things.']],
    other: [['marla', 'normal', 'You chose your path. A good one, I am sure. Still, you could do some push-ups.']]
  },
  archer: {
    early: [['ivy', 'normal', 'My hawk says you are not ready yet. Come back at Lv. 10.']],
    intro: [['ivy', 'happy', 'You climbed all the way up here. Good legs. I am Ranger Ivy, and I train ARCHERS.'], ['ivy', 'normal', 'Archers fight from far away. Quick, sharp-eyed, and very hard to catch.'], ['ivy', 'happy', 'Try a bow or a slingshot on my targets. My trial: pop six balloons floating over the hill in one minute.']],
    pass: [['ivy', 'happy', 'Six for six. My hawk is impressed, and she is never impressed. Welcome, Archer {hero}.'], ['ivy', 'normal', 'Take these clothes. Spend your skill points with C.']],
    fail: [['ivy', 'worried', 'The wind won this time. Breathe, aim, and try again whenever you like.']],
    mine: [['ivy', 'happy', 'Keep your eyes sharp, Archer. And spend those skill points with C.']],
    other: [['ivy', 'normal', 'Every path needs good eyes. Even yours.']]
  },
  mage: {
    early: [['zara', 'normal', 'Lv. 10. Come back at Lv. 10. I am not repeating myself.']],
    intro: [['zara', 'normal', 'What? Oh. Lv. 10. Fine. I am Zara Emberly. I teach MAGES. Do not touch anything.'], ['zara', 'surprised', 'Mages use fire, water, earth and wind. Strong magic, soft bones. Stay away from teeth.'], ['zara', 'normal', 'Try a staff or a book on my dummies. My trial: light four dark crystals with magic before my candle burns out.']],
    pass: [['zara', 'happy', 'Four crystals. Not bad. NOT bad at all. ...Welcome, Mage {hero}. Do not let it go to your head.'], ['zara', 'normal', 'Here is your robe and hat. Skill points: press C. Now go away, I am busy.']],
    fail: [['zara', 'worried', 'The candle went out. So did your chances. Try again when you are ready.']],
    mine: [['zara', 'normal', 'My student. Do not burn the forest. Spend your skill points with C.']],
    other: [['zara', 'normal', 'Not a mage? Hmph. Well. Somebody has to carry the potions.']]
  },
  robot: {
    early: [['bolt', 'happy', 'Psst, kid. I am building something. Something BIG. Come back at Lv. 10.']],
    intro: [['bolt', 'happy', 'Lv. 10! Then I can show you my secret: MACHINE ARMOR! The ROBOT job!'], ['bolt', 'normal', 'Steel armor, a rocket pack, missiles and lasers. Tough AND it hits from a distance.'], ['bolt', 'happy', 'Try the Missile Arm or the Laser Cannon on my iron targets. My trial: smash five targets outside the north gate in one minute!']],
    pass: [['bolt', 'happy', 'HA HA! It WORKS! You are a ROBOT now, kid! Well, you are wearing one.'], ['bolt', 'normal', 'Oil the joints and press C to spend your skill points.']],
    fail: [['bolt', 'worried', 'Out of time. The armor needs a better pilot. Try again, kid!']],
    mine: [['bolt', 'happy', 'How is the armor? Any smoke? A little smoke is fine. Spend skill points with C!']],
    other: [['bolt', 'normal', 'A good path, kid. But if you ever want rockets, I am right here.']]
  }
};
const lines = (job, key) => SAY[job][key].map(([w, f, t]) => L(w, f, t));

// ---------- practice targets near every master (they never fight back and never break) ----------
const PRACTICE = { meadow: () => [...W.YARD.dummies.map(([x, z]) => ['dummy', x, z]), ...W.YARD.targets.map(([x, z]) => ['irontarget', x, z])], hills: () => [['dummy', 26, -708], ['dummy', 34, -709]], wood: () => [['dummy', -466, -548], ['dummy', -456, -551]] };
let practice = [];
function spawnPractice() {
  for (const m of practice) if (!m.gone) G.removeMonster(m);
  practice = [];
  if (!P || trial) return;
  const list = PRACTICE[W.active]; if (!list) return;
  for (const [kind, x, z] of list()) { const p = walkableNear(x, z), m = G.spawnMonster(kind, 8, p.x, p.z); m.practice = true; m.quest = 'practice'; m.home.set(p.x, 0, p.z); m.root.rotation.y = rnd(-0.5, 0.5); practice.push(m); }
}

// ---------- trying a job and the trials ----------
let trial = null;
const TRIAL_TIME = { warrior: 120, archer: 60, mage: 90, robot: 60 };
const TRIAL_TEXT = { warrior: 'Knock down the training dummies', archer: 'Pop the balloons', mage: 'Light the dark crystals', robot: 'Smash the iron targets' };
const TRIAL_NEED = { warrior: 3, archer: 6, mage: 4, robot: 5 };
const ROBOT_SPOTS = [[-12, -52], [12, -54], [-18, -62], [16, -64], [0, -68], [-6, -58], [8, -61]];
function tryJob(job, weapon) {
  bye();
  const s = JOBS[job].skills;
  G.setTempJob({ job, weapon, mode: 'try', dur: 60, skills: { [s[0].id]: 1, [s[1].id]: 1 }, onEnd: () => { UI.toast('Try-out over. Talk to the master to try again or take the trial.'); } });
  UI.toast('Trying ' + JOBS[job].name + ' with the ' + WEAPONS[weapon].name + ' for 60 seconds. Skills 1 and 2 are ready!', true);
  sfx.start(); RW.emit('try', job);
}
function startTrial(job, weapon) {
  bye();
  for (const m of practice) if (!m.gone) G.removeMonster(m);
  practice = [];
  const s = JOBS[job].skills, need = TRIAL_NEED[job];
  trial = { job, weapon, need, got: 0, mobs: [], spawned: 0 };
  G.setTempJob({ job, weapon, mode: 'trial', dur: TRIAL_TIME[job], skills: { [s[0].id]: 1, [s[1].id]: 1 }, onEnd: (why) => { if (trial) endTrial(false, why); } });
  const n = npc(MASTERS[job]);
  if (job === 'warrior') for (const [x, z] of W.YARD.dummies) addTrialMob('dummy', x, z, true);
  if (job === 'archer') for (let i = 0; i < need; i++) { const a = i / need * Math.PI * 2 + 0.3, r = 7 + (i % 3) * 2; addTrialMob('balloon', n.x + Math.cos(a) * r, n.z + Math.sin(a) * r); }
  if (job === 'mage') for (let i = 0; i < need; i++) { const a = i / need * Math.PI * 2 + 0.5, r = 8; addTrialMob('crystal', n.x + Math.cos(a) * r, n.z + Math.sin(a) * r); }
  if (job === 'robot') nextRobotTarget();
  UI.toast('Trial: ' + TRIAL_TEXT[job] + '! ' + TRIAL_TIME[job] + ' seconds.', true);
  sfx.questNew(); RW.emit('trial', job);
}
function addTrialMob(kind, x, z, angry) {
  const p = walkableNear(x, z), m = G.spawnMonster(kind, kind === 'dummy' ? 8 : 1, p.x, p.z);
  m.quest = 'trial'; m.home.set(p.x, 0, p.z); m.show = 99;
  if (angry) { m.aggro = true; m.atkCd = 1.2; }
  trial.mobs.push(m); trial.spawned++;
  G.spawnRing(m.pos, 0xffffff, 1.4, 0.5);
  return m;
}
function nextRobotTarget() {
  if (!trial || trial.spawned >= trial.need) return;
  const free = ROBOT_SPOTS.filter(([x, z]) => !trial.mobs.some((m) => m.alive && Math.hypot(m.pos.x - x, m.pos.z - z) < 3));
  const [x, z] = free[Math.floor(rnd(0, free.length))] || ROBOT_SPOTS[0];
  addTrialMob('irontarget', x, z);
}
function endTrial(won, why) {
  const t = trial; if (!t) return;
  trial = null;
  for (const m of t.mobs) if (!m.gone) G.removeMonster(m);
  hideTrialHint();
  if (G.tempJob) G.clearTempJob();
  const n = npc(MASTERS[t.job]);
  if (won) {
    G.becomeJob(t.job, t.weapon);
    UI.banner(JOBS[t.job].name + '!', 'You can now use ' + WEAPONS[t.weapon].name);
    UI.say(lines(t.job, 'pass'), [{ label: 'Thank you!', run: bye }]);
  } else {
    sfx.deny();
    if (n && G.here(n) && why !== 'leave') UI.say(lines(t.job, 'fail'), [{ label: 'I will try again', run: bye }]);
    RW.emit('trialFail', t.job);
  }
  setTimeout(spawnPractice, 1500);
}
// trial progress: every target that falls counts
RW.on('kill', (m) => {
  if (!trial || m.quest !== 'trial') return;
  trial.got++; sfx.step();
  UI.toast(TRIAL_TEXT[trial.job] + ': ' + trial.got + '/' + trial.need);
  if (trial.got >= trial.need) setTimeout(() => endTrial(true), 700);
  else if (trial.job === 'robot') setTimeout(nextRobotTarget, 500);
});
RW.on('faint', () => { if (trial) endTrial(false, 'faint'); });
function trialHint() {
  if (!trial || !G.tempJob) return;
  const h = $('hint'); h.textContent = TRIAL_TEXT[trial.job] + ' ' + trial.got + '/' + trial.need + ' · ' + Math.max(0, Math.ceil(G.tempJob.until - G.time)) + ' s left';
  h.classList.add('on');
}
function hideTrialHint() { $('hint').classList.remove('on'); }

// ---------- talking to a master ----------
function talk(n) {
  if (!n.master || !G.p) return false;
  P = G.p;
  // quests that involve this person (Bolt has a few) come first
  if (RW.story && RW.story.pending && RW.story.pending(n.id)) return false;
  const job = n.master, J = JOBS[job], weapons = J.weapons;
  if (trial) { UI.say([L(n.id, 'surprised', trial.job === job ? 'Focus! The trial is still running!' : 'You are in the middle of another trial!')], [{ label: 'OK', run: bye }]); return true; }
  if (P.lv < 10) { UI.say(lines(job, 'early'), [{ label: 'Goodbye', soft: true, run: bye }]); return true; }
  if (P.job && P.job !== 'novice') { UI.say(lines(job, P.job === job ? 'mine' : 'other'), [{ label: 'Goodbye', soft: true, run: bye }]); return true; }
  RW.emit('master', n.id);
  UI.say(lines(job, 'intro'), [
    { label: 'Try ' + WEAPONS[weapons[0]].name, run: () => tryJob(job, weapons[0]) },
    { label: 'Try ' + WEAPONS[weapons[1]].name, run: () => tryJob(job, weapons[1]) },
    { label: 'Take the trial', run: () => chooseWeapon(job) },
    { label: 'Goodbye', soft: true, run: bye }
  ]);
  return true;
}
function chooseWeapon(job) {
  const J = JOBS[job], [a, b] = J.weapons, n = MASTERS[job];
  UI.say([L(n, 'normal', 'Pick the weapon you will use in the trial. If you pass, it is yours for good. ' + WEAPONS[a].name + ': ' + WEAPONS[a].desc + ' ' + WEAPONS[b].name + ': ' + WEAPONS[b].desc)], [
    { label: WEAPONS[a].name, run: () => startTrial(job, a) },
    { label: WEAPONS[b].name, run: () => startTrial(job, b) },
    { label: 'Not yet', soft: true, run: bye }
  ]);
}

// ---------- skill icons (drawn once) ----------
const iconCache = new Map();
function skillIcon(id) {
  if (iconCache.has(id)) return iconCache.get(id);
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#3b2a1e'; g.lineWidth = 3;
  const bg = { cleave: '#f3d2b8', rush: '#f3d2b8', warcry: '#ffd2a8', earthslam: '#e8d0a8', powershot: '#d8efc8', venom: '#d8f0b8', hawkeye: '#d8efc8', arrowrain: '#d0ece8', firebolt: '#ffd8b8', frost: '#d8ecff', stoneskin: '#e8d8b8', gust: '#d8f5ec', homing: '#e0e6ec', laser: '#d8f4ff', overdrive: '#d8f0ff', barrage: '#f0dcd0', whirlblade: '#d8f5ec', titan: '#e8d0a8', pierce: '#f4f0c8', skyhunter: '#ffe0c8', blizzard: '#d8ecff', meteor: '#ffd8b8', rocketpunch: '#f0dcd0', gigabeam: '#d8f4ff' }[id] || '#fbf1dc';
  g.fillStyle = bg; g.beginPath(); g.arc(32, 32, 30, 0, 6.28); g.fill();
  const arrow = (x1, y1, x2, y2, col) => { g.strokeStyle = '#8a5a35'; g.lineWidth = 3; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); const a = Math.atan2(y2 - y1, x2 - x1); g.fillStyle = col || '#b8c2cc'; g.strokeStyle = '#3b2a1e'; g.lineWidth = 2; g.beginPath(); g.moveTo(x2 + Math.cos(a) * 7, y2 + Math.sin(a) * 7); g.lineTo(x2 + Math.cos(a + 2.4) * 7, y2 + Math.sin(a + 2.4) * 7); g.lineTo(x2 + Math.cos(a - 2.4) * 7, y2 + Math.sin(a - 2.4) * 7); g.closePath(); g.fill(); g.stroke(); };
  const sword = (x, y, a) => { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = '#dfe8f0'; g.strokeStyle = '#3b2a1e'; g.lineWidth = 2; g.beginPath(); g.moveTo(-3, 6); g.lineTo(-3, -18); g.lineTo(0, -24); g.lineTo(3, -18); g.lineTo(3, 6); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#e3b343'; g.fillRect(-8, 6, 16, 4); g.strokeRect(-8, 6, 16, 4); g.fillStyle = '#6b4a30'; g.fillRect(-2, 10, 4, 8); g.restore(); };
  const missile = (x, y, a) => { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = '#f6efdc'; g.strokeStyle = '#3b2a1e'; g.lineWidth = 2; g.beginPath(); g.rect(-4, -8, 8, 16); g.fill(); g.stroke(); g.fillStyle = '#e8604c'; g.beginPath(); g.moveTo(-4, -8); g.lineTo(0, -15); g.lineTo(4, -8); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#ffb060'; g.beginPath(); g.moveTo(-3, 8); g.lineTo(0, 15); g.lineTo(3, 8); g.fill(); g.restore(); };
  if (id === 'cleave') { g.strokeStyle = '#ffffff'; g.lineWidth = 7; g.beginPath(); g.arc(32, 40, 20, 3.6, 5.8); g.stroke(); sword(40, 30, 0.9); }
  else if (id === 'rush') { for (const y of [24, 32, 40]) { g.strokeStyle = '#8a7a6a'; g.lineWidth = 3; g.beginPath(); g.moveTo(10, y); g.lineTo(26, y); g.stroke(); } sword(40, 34, 1.57); }
  else if (id === 'warcry') { g.fillStyle = '#e8604c'; g.beginPath(); g.moveTo(16, 26); g.lineTo(30, 26); g.lineTo(44, 16); g.lineTo(44, 48); g.lineTo(30, 38); g.lineTo(16, 38); g.closePath(); g.fill(); g.stroke(); g.strokeStyle = '#e8604c'; for (const r of [6, 11]) { g.beginPath(); g.arc(46, 32, r, -0.7, 0.7); g.stroke(); } }
  else if (id === 'earthslam') { g.fillStyle = '#9a8064'; for (const [x, y, r] of [[18, 46, 6], [32, 50, 7], [46, 46, 6]]) { g.beginPath(); g.arc(x, y, r, 0, 6.28); g.fill(); g.stroke(); } g.strokeStyle = '#3b2a1e'; g.beginPath(); g.moveTo(32, 12); g.lineTo(32, 34); g.stroke(); g.fillStyle = '#c8a06a'; g.beginPath(); g.arc(32, 32, 7, 0, 6.28); g.fill(); g.stroke(); }
  else if (id === 'powershot') { arrow(12, 50, 48, 14); g.strokeStyle = '#fff6c8'; g.lineWidth = 2; g.beginPath(); g.moveTo(10, 40); g.lineTo(20, 46); g.stroke(); }
  else if (id === 'venom') { arrow(12, 50, 46, 16, '#7cbf4f'); g.fillStyle = '#7cbf4f'; g.beginPath(); g.moveTo(50, 36); g.quadraticCurveTo(56, 46, 50, 50); g.quadraticCurveTo(44, 46, 50, 36); g.fill(); g.stroke(); }
  else if (id === 'hawkeye') { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(10, 32); g.quadraticCurveTo(32, 12, 54, 32); g.quadraticCurveTo(32, 52, 10, 32); g.fill(); g.stroke(); g.fillStyle = '#5a9a3a'; g.beginPath(); g.arc(32, 32, 8, 0, 6.28); g.fill(); g.stroke(); g.fillStyle = '#24170f'; g.beginPath(); g.arc(32, 32, 3.5, 0, 6.28); g.fill(); }
  else if (id === 'arrowrain') { for (const x of [18, 32, 46]) arrow(x - 4, 10, x, 46); }
  else if (id === 'firebolt') { const gr = g.createRadialGradient(32, 36, 2, 32, 36, 18); gr.addColorStop(0, '#fff6c8'); gr.addColorStop(0.5, '#ffb040'); gr.addColorStop(1, '#e8502e'); g.fillStyle = gr; g.beginPath(); g.moveTo(32, 10); g.quadraticCurveTo(52, 30, 44, 44); g.quadraticCurveTo(32, 56, 20, 44); g.quadraticCurveTo(12, 30, 32, 10); g.fill(); g.stroke(); }
  else if (id === 'frost') { g.fillStyle = '#dff6ff'; g.beginPath(); g.moveTo(32, 8); g.lineTo(44, 32); g.lineTo(32, 56); g.lineTo(20, 32); g.closePath(); g.fill(); g.stroke(); g.strokeStyle = '#7cc8ff'; g.beginPath(); g.moveTo(32, 14); g.lineTo(32, 50); g.stroke(); }
  else if (id === 'stoneskin') { g.fillStyle = '#c8a06a'; g.beginPath(); g.moveTo(32, 10); g.lineTo(50, 18); g.lineTo(48, 38); g.quadraticCurveTo(42, 50, 32, 56); g.quadraticCurveTo(22, 50, 16, 38); g.lineTo(14, 18); g.closePath(); g.fill(); g.stroke(); g.strokeStyle = '#8a6a40'; g.beginPath(); g.moveTo(22, 26); g.lineTo(30, 34); g.lineTo(40, 24); g.stroke(); }
  else if (id === 'gust') { g.strokeStyle = '#3fa39a'; g.lineWidth = 4; g.beginPath(); for (let a = 0; a < 12; a += 0.2) { const r = 3 + a * 2.1, x = 32 + Math.cos(a) * r, y = 32 + Math.sin(a) * r; if (a) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); }
  else if (id === 'homing') { g.strokeStyle = '#9a8f86'; g.lineWidth = 3; g.setLineDash([3, 4]); g.beginPath(); g.moveTo(10, 52); g.quadraticCurveTo(12, 20, 40, 20); g.stroke(); g.setLineDash([]); missile(44, 20, 1.57); }
  else if (id === 'laser') { g.strokeStyle = '#7ce8ff'; g.lineWidth = 9; g.beginPath(); g.moveTo(8, 44); g.lineTo(56, 20); g.stroke(); g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.beginPath(); g.moveTo(8, 44); g.lineTo(56, 20); g.stroke(); }
  else if (id === 'overdrive') { g.fillStyle = '#7ce0ff'; g.beginPath(); g.moveTo(36, 8); g.lineTo(18, 36); g.lineTo(30, 36); g.lineTo(26, 56); g.lineTo(46, 26); g.lineTo(34, 26); g.closePath(); g.fill(); g.stroke(); }
  else if (id === 'barrage') { missile(20, 30, 3.14); missile(34, 22, 3.14); missile(46, 34, 3.14); }
  // v1.6: skills 5 and 6 (Lv. 30 and 40)
  else if (id === 'whirlblade') { g.strokeStyle = '#3fa39a'; g.lineWidth = 5; g.beginPath(); g.arc(32, 32, 22, 0.3, 5.6); g.stroke(); g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.beginPath(); g.arc(32, 32, 16, 2.2, 7.4); g.stroke(); sword(32, 34, 0.8); sword(32, 34, -2.3); }
  else if (id === 'titan') { g.strokeStyle = '#6b4a30'; g.lineWidth = 3; g.beginPath(); g.moveTo(10, 52); g.lineTo(22, 44); g.lineTo(18, 36); g.moveTo(54, 52); g.lineTo(42, 44); g.lineTo(46, 38); g.stroke(); g.save(); g.scale(1.25, 1.25); sword(25.6, 26, 0); g.restore(); g.fillStyle = '#9a8064'; for (const [x, y] of [[14, 50], [50, 50], [32, 56]]) { g.beginPath(); g.arc(x, y, 4, 0, 6.28); g.fill(); g.stroke(); } }
  else if (id === 'pierce') { g.strokeStyle = '#fff0a0'; g.lineWidth = 8; g.beginPath(); g.moveTo(6, 48); g.lineTo(52, 18); g.stroke(); arrow(10, 46, 50, 20, '#e3b343'); for (const [x, y] of [[24, 36], [36, 28]]) { g.fillStyle = '#e8604c'; g.beginPath(); g.arc(x, y, 4, 0, 6.28); g.fill(); g.stroke(); } }
  else if (id === 'skyhunter') { g.fillStyle = '#ffb040'; g.beginPath(); g.moveTo(32, 8); g.quadraticCurveTo(48, 14, 54, 10); g.quadraticCurveTo(48, 24, 32, 22); g.quadraticCurveTo(16, 24, 10, 10); g.quadraticCurveTo(16, 14, 32, 8); g.fill(); g.stroke(); for (const x of [20, 32, 44]) arrow(x - 3, 26, x, 52, '#e8502e'); }
  else if (id === 'blizzard') { g.strokeStyle = '#7cc8ff'; g.lineWidth = 3; for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3; g.beginPath(); g.moveTo(32 + Math.cos(a) * 20, 30 + Math.sin(a) * 20); g.lineTo(32 - Math.cos(a) * 20, 30 - Math.sin(a) * 20); g.stroke(); } g.fillStyle = '#dff6ff'; for (const [x, y] of [[14, 52], [32, 56], [50, 52]]) { g.beginPath(); g.moveTo(x, y - 6); g.lineTo(x + 4, y); g.lineTo(x, y + 4); g.lineTo(x - 4, y); g.closePath(); g.fill(); g.stroke(); } }
  else if (id === 'meteor') { g.strokeStyle = '#ffb040'; g.lineWidth = 6; g.beginPath(); g.moveTo(10, 10); g.lineTo(30, 30); g.stroke(); const gr = g.createRadialGradient(38, 38, 2, 38, 38, 16); gr.addColorStop(0, '#fff6c8'); gr.addColorStop(0.5, '#ff8a30'); gr.addColorStop(1, '#a8402a'); g.fillStyle = gr; g.strokeStyle = '#3b2a1e'; g.lineWidth = 3; g.beginPath(); g.arc(38, 38, 15, 0, 6.28); g.fill(); g.stroke(); }
  else if (id === 'rocketpunch') { g.fillStyle = '#ffb060'; g.beginPath(); g.moveTo(8, 26); g.lineTo(22, 32); g.lineTo(8, 38); g.closePath(); g.fill(); g.fillStyle = '#c8d4e0'; g.beginPath(); g.rect(20, 24, 16, 16); g.fill(); g.stroke(); g.fillStyle = '#e8604c'; g.beginPath(); g.arc(44, 32, 12, 0, 6.28); g.fill(); g.stroke(); g.strokeStyle = '#3b2a1e'; g.lineWidth = 2; for (const y of [26, 32, 38]) { g.beginPath(); g.moveTo(48, y); g.lineTo(55, y); g.stroke(); } }
  else if (id === 'gigabeam') { g.strokeStyle = '#7ce8ff'; g.lineWidth = 20; g.beginPath(); g.moveTo(6, 32); g.lineTo(58, 32); g.stroke(); g.strokeStyle = '#ffffff'; g.lineWidth = 7; g.beginPath(); g.moveTo(6, 32); g.lineTo(58, 32); g.stroke(); g.fillStyle = '#c8d4e0'; g.strokeStyle = '#3b2a1e'; g.lineWidth = 3; g.beginPath(); g.arc(12, 32, 9, 0, 6.28); g.fill(); g.stroke(); }
  const url = c.toDataURL(); iconCache.set(id, url); return url;
}
// the skill buttons: Novice shows its drawn icons, a job shows its own skill icons
// v1.6: the 6 buttons hold whatever the player puts there (G.p.bar): a skill {s: index in the job's list} or an item {i: id}
const NOVICE_SVG = [
  '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 26 L19 12" stroke="#3b2a1e" stroke-width="6" stroke-linecap="round"/><path d="M7 26 L19 12" stroke="#c08a5a" stroke-width="3" stroke-linecap="round"/><path d="M23 4 L24.5 8 L28.5 8.5 L25.5 11 L26.5 15 L23 12.8 L19.5 15 L20.5 11 L17.5 8.5 L21.5 8 Z" fill="#ffd84d" stroke="#3b2a1e" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 24 Q12 6 24 10" fill="none" stroke="#3b2a1e" stroke-width="1.8" stroke-dasharray="3 3" stroke-linecap="round"/><ellipse cx="24" cy="11" rx="5" ry="4" fill="#a8a39a" stroke="#3b2a1e" stroke-width="1.6"/><ellipse cx="22.5" cy="9.8" rx="1.6" ry="1" fill="#fff" opacity=".6"/></svg>',
  '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 16 Q16 13 19 13 Q23 13 23 17 Q23 23 16 23 Q8 23 8 15 Q8 6 17 6 Q27 6 27 16" fill="none" stroke="#3f7fc4" stroke-width="2.4" stroke-linecap="round"/></svg>',
  '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 4 L25 14 L19.5 14 L19.5 27 L12.5 27 L12.5 14 L7 14 Z" fill="#f4c542" stroke="#3b2a1e" stroke-width="1.6" stroke-linejoin="round"/></svg>'
];
const allSlots = [...document.querySelectorAll('.slots .slot')];
// the picture and name of one bar entry (or of an entry about to be placed)
function entryLook(e) {
  if (!e) return { icon: '', name: RW.T('Empty', 'Kosong'), count: '' };
  if (e.i) { const it = RW.ITEMS[e.i]; return it ? { icon: '<img src="' + RW.iconURL(e.i) + '" alt="">', name: it.name, count: String(G.bagCount(e.i)) } : { icon: '', name: '', count: '' }; }
  const J = JOBS[G.jobNow()];
  if (J) { const s = J.skills[e.s]; return s ? { icon: '<img class="icon" src="' + skillIcon(s.id) + '" alt="">', name: s.name, count: '' } : { icon: '', name: RW.T('Empty', 'Kosong'), count: '' }; }
  const s = RW.SKILLS[e.s]; return s ? { icon: NOVICE_SVG[e.s] || '', name: s.name, count: '' } : { icon: '', name: RW.T('Empty', 'Kosong'), count: '' };
}
function renderSlots() {
  if (!G.p) return;
  const J = JOBS[G.jobNow()], bar = G.p.bar || [];
  allSlots.forEach((el, i) => {
    const e = bar[i], L = entryLook(e);
    el.querySelector('.ico').innerHTML = L.icon; el.querySelector('.count').textContent = L.count;
    el.classList.toggle('empty', !L.icon);
    let extra = '';
    if (e && e.s != null && J && J.skills[e.s]) { const s = J.skills[e.s], lv = G.skillLv(s.id); extra = lv ? ' (level ' + lv + ')' : ' (not learned)'; }
    el.setAttribute('aria-label', (i + 1) + ': ' + L.name + extra);
  });
  const u = $('ult'); u.setAttribute('aria-label', 'Finishing move: ' + (J ? J.ult.name : RW.ULT.name) + ' (R)');
}
// the "which button?" picker: choose 1-6 for a skill or item, or take it off the bar
let pickFor = null;
function pickSlot(e, after) {
  const box = $('slotPick'); if (!box || !G.p) return;
  pickFor = { e, after };
  const L = entryLook(e), cur = G.barIndex(e);
  box.querySelector('.sp-t').innerHTML = RW.T('Put <b>' + esc(L.name) + '</b> on which button?', 'Pasang <b>' + esc(L.name) + '</b> di tombol mana?');
  box.querySelector('.sp-row').innerHTML = G.p.bar.map((x, i) => { const l = entryLook(x); return '<button class="slot' + (l.icon ? '' : ' empty') + (i === cur ? ' cur' : '') + '" data-pk="' + i + '" aria-label="' + (i + 1) + ': ' + esc(l.name) + '"><span class="ico">' + l.icon + '</span><span class="key">' + (i + 1) + '</span><span class="count">' + l.count + '</span></button>'; }).join('');
  box.querySelector('.sp-acts').innerHTML = (cur >= 0 ? '<button class="btn small soft" data-pa="off">' + RW.T('Take off the bar', 'Lepas dari tombol') + '</button>' : '') + '<button class="btn small soft" data-pa="no">' + RW.T('Cancel', 'Batal') + '</button>';
  box.hidden = false;
}
function closePick() { const box = $('slotPick'); if (box) box.hidden = true; pickFor = null; }
{
  const box = $('slotPick');
  if (box) document.body.appendChild(box); // out of the scaled skill bar so it covers the whole screen
  if (box) box.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-pk],[data-pa]');
    if (!b) { if (ev.target === box) closePick(); return; }
    const f = pickFor; if (!f) return closePick();
    if (b.dataset.pk != null) G.setBar(Number(b.dataset.pk), f.e);
    else if (b.dataset.pa === 'off') { const k = G.barIndex(f.e); if (k >= 0) G.setBar(k, null); }
    closePick(); if (f.after) f.after();
  });
  document.addEventListener('keydown', (ev) => { if (pickFor && ev.key === 'Escape') { ev.stopPropagation(); closePick(); } }, true);
}
const keyTag = (e) => { const k = G.barIndex(e); return k >= 0 ? RW.T('key ' + (k + 1), 'tombol ' + (k + 1)) : RW.T('not on a button', 'belum dipasang'); };
const setBtn = (idx, ok) => ok ? '<button class="btn small setk" data-setk="' + idx + '">' + RW.T('Set', 'Pasang') + '</button>' : '';
// the skills part of the stats window
function renderSkills() {
  const box = $('skillRows'); if (!box) return;
  const p = G.p; if (!p) { box.innerHTML = ''; return; }
  const job = p.job || 'novice', J = JOBS[job];
  const U = J ? J.ult : RW.ULT, uv = Math.floor(G.player.ult || 0);
  const ultRow = '<div class="skrow ultrow"><span class="ulticon">★</span><div class="nm">' + esc(U.name) + ' <small>(' + RW.T('Finishing move, key R', 'Jurus pamungkas, tombol R') + ')</small><small>' + esc(U.desc) + '</small><small>' + RW.T('Charges slowly as you hit monsters and get hit. Use it when the ring is full.', 'Terisi pelan saat kamu memukul monster dan saat terkena pukulan. Pakai saat lingkaran penuh.') + '</small><div class="ultbar"><i style="width:' + uv + '%"></i></div></div><span class="lvd">' + uv + '%</span></div>';
  const wire = () => box.querySelectorAll('[data-setk]').forEach((b) => b.addEventListener('click', () => pickSlot({ s: Number(b.dataset.setk) }, () => { UI.renderStats(); })));
  if (!J) {
    let nh = '';
    RW.SKILLS.forEach((s, i) => { nh += '<div class="skrow"><span class="ico nsvg">' + NOVICE_SVG[i] + '</span><div class="nm">' + esc(s.name) + ' <small class="skkey">(' + keyTag({ s: i }) + ')</small>' + setBtn(i, true) + '<small>' + esc(s.desc) + ' · ' + s.mp + ' MP · ' + s.cd + ' s</small></div><span class="lvd"></span><span></span></div>'; });
    box.innerHTML = nh + ultRow + '<p class="note"><b>Skills:</b> at Lv. 10 you can choose a job from one of four masters: Marla (Warrior) in Mossbrook, Bolt (Robot) at his forge, Ranger Ivy (Archer) in Breezy Hills and Zara Emberly (Mage) in Whisperwood. Each job has 4 skills that you learn with skill points, plus 2 more that open at Lv. 30 and Lv. 40. Press <b>Set</b> to choose which button (1-6) a skill goes on.</p>';
    wire(); return;
  }
  let html = '<div class="ptsline"><span>' + esc(J.name) + ' skill points</span><b>' + (p.sp || 0) + '</b></div>';
  for (const s of J.skills) {
    const lv = p.skills[s.id] || 0, dots = Array.from({ length: SKILL_MAX }, (_, k) => '<span class="' + (k < lv ? '' : 'off') + '">●</span>').join('');
    const mp = s.mp + (s.mpLv || 0) * Math.max(0, lv - 1), shut = s.lv && p.lv < s.lv, idx = J.skills.indexOf(s);
    const lvTag = shut ? '<b class="sklock">🔒 ' + RW.T('Opens at Lv. ' + s.lv, 'Terbuka di Lv. ' + s.lv) + '</b> ' : '';
    html += '<div class="skrow' + (shut ? ' shut' : '') + '"><img src="' + skillIcon(s.id) + '" alt=""><div class="nm">' + esc(s.name) + ' <small class="skkey">(' + keyTag({ s: idx }) + ')</small>' + setBtn(idx, !shut) + '<small>' + lvTag + esc(s.desc) + ' · ' + mp + ' MP · ' + s.cd + ' s</small></div><span class="lvd">' + dots + '</span><button class="plus" data-sk="' + s.id + '" aria-label="' + (lv ? 'Strengthen ' : 'Learn ') + esc(s.name) + '"' + ((p.sp || 0) > 0 && lv < SKILL_MAX && !shut ? '' : ' disabled') + '>+</button></div>';
  }
  html += ultRow;
  html += '<p class="note">Weapon: ' + esc(WEAPONS[p.weapon] ? WEAPONS[p.weapon].name : '') + ' · Finishing move: ' + esc(J.ult.name) + '. You get 1 skill point every level. ' + RW.T('Press <b>Set</b> to choose which button (1-6) a skill goes on.', 'Tekan <b>Pasang</b> untuk memilih tombol (1-6) sebuah skill.') + '</p>';
  box.innerHTML = html; wire();
  box.querySelectorAll('[data-sk]').forEach((b) => b.addEventListener('click', () => { if (G.learnSkill(b.dataset.sk)) { UI.renderStats(); renderSlots(); } }));
}

// ---------- events ----------
RW.on('enter', (p) => { P = p; if (P.sp == null) P.sp = 0; if (!P.skills) P.skills = {}; trial = null; setTimeout(() => { if (P === p) spawnPractice(); }, 400); renderSlots(); });
RW.on('leave', () => { if (trial) { const t = trial; trial = null; for (const m of t.mobs) if (!m.gone) G.removeMonster(m); hideTrialHint(); } for (const m of practice) if (!m.gone) G.removeMonster(m); practice = []; P = null; });
RW.on('map', () => { if (trial) endTrial(false, 'leave'); setTimeout(spawnPractice, 200); });
// one skill point every level once you have a job
RW.on('levelup', (lv) => {
  if (P && P.job && P.job !== 'novice') {
    P.sp = (P.sp || 0) + 1; setTimeout(() => UI.toast('+1 skill point. Press C to learn or strengthen a skill.'), 2400);
    const J = JOBS[P.job], s = J && J.skills.find((x) => x.lv === P.lv);
    if (s) setTimeout(() => { UI.toast(RW.T('New skill unlocked: <b>' + s.name + '</b>! Learn it in the Skills window (C), then press Set to put it on a button.', 'Skill baru terbuka: <b>' + s.name + '</b>! Pelajari di jendela Skill (C), lalu tekan Pasang untuk menaruhnya di tombol.'), true); renderSlots(); }, 4200);
  }
});

let hintT = 0;
function update(dt) {
  if (!P) return;
  if (trial) { hintT -= dt; if (hintT <= 0) { hintT = 0.25; trialHint(); } }
}
RW.jobs = { talk, update, renderSlots, renderSkills, skillIcon, pickSlot, closePick, get trial() { return trial; }, MASTERS };
})();
