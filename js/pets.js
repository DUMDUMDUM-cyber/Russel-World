// Russel World: pets (delivery 6). Eggs from Pip, hatching, care (feed, play, bathe), the pet that follows and fights, levels and evolving.
(function () {
'use strict';
const RW = window.RW;
if (!RW || RW.failed || !RW.G || !RW.world) return;
const { THREE, scene, renderer, V3, rnd, clamp, wrapAngle, PETS, PET_TRAITS, PET_EGGS, PET_TEEN_LV, PET_HATCH, petStats, expNeed, ITEMS } = RW;
const W = RW.world, G = RW.G, UI = RW.UI, sfx = RW.audio.sfx, esc = G.esc;
const $ = (id) => document.getElementById(id);
let P = null;

// ---------- tuning ----------
const DECAY = 70 / (22 * 60);   // a need drops from 100 to 30 in about 22 minutes
const OFFLINE = 0.05;           // while the game is closed, time runs 20x slower
const OFFLINE_FLOOR = 25;       // and never pushes a need below this
const SAD_AT = 15, HAPPY_AT = 60, LOW_AT = 30;
const REST_TIME = 30, SLEEP_IDLE = 25;
const EGG_DROP = 0.0012, EGG_DROP_GOLD = 0.15;
const SCALE = 0.85;
const COL = { puffdrake: 0xff8a3d, cloudfox: 0xb8f0d8, glimmerbun: 0xd8b8ff, mossback: 0xa8d878, bloomquill: 0xff9ac8, lilytoad: 0x7cc8ff };
const PITCH = { puffdrake: 760, cloudfox: 1100, glimmerbun: 1300, mossback: 520, bloomquill: 980, lilytoad: 640 };
for (const sp in PETS) { if (COL[sp] == null) COL[sp] = PETS[sp].col || 0xffffff; if (!PITCH[sp]) PITCH[sp] = PETS[sp].pitch || 900; } // v1.4: new pets bring their own colour and voice
const MOOD_INFO = { happy: ['Happy', '💗'], ok: ['Okay', '🙂'], sad: ['Sad', '💧'], rest: ['Resting', '💤'], sleep: ['Sleeping', '💤'] };

const pets = () => (P ? P.pets : []);
const byId = (id) => pets().find((p) => p.id === id) || null;
const active = () => (P ? byId(P.petOn) : null);
function mood(pet) {
  const lo = Math.min(pet.food, pet.fun, pet.clean);
  if (lo < SAD_AT) return 'sad';
  if (pet.food > HAPPY_AT && pet.fun > HAPPY_AT && pet.clean > HAPPY_AT) return 'happy';
  return 'ok';
}
function wants(pet) { // the need that is lowest, if it is low
  const l = [['food', pet.food, 'Hungry', '🍖'], ['fun', pet.fun, 'Bored', '🎈'], ['clean', pet.clean, 'Dirty', '🫧']].sort((a, b) => a[1] - b[1])[0];
  return l[1] < LOW_AT ? l : null;
}
const isTeen = (pet) => pet.stage !== 'baby';
const isAdult = (pet) => /^adult/.test(pet.stage || '');
const ADULT_LV = 25;
const roleOf = (pet) => PETS[pet.sp].role || 'attacker';
const skillsOf = (pet) => PETS[pet.sp].skills.map((s, i) => Object.assign({ open: i === 0 || (i === 1 && isTeen(pet)) || (i === 2 && isAdult(pet)) }, s));
function newId() { return 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36); }

// ---------- the pet in the world ----------
let cur = null;   // { pet, m, pos, face, state, ... }
let eggW = null;  // the egg hopping behind the hero
let hatching = null, luckUntil = -1, sadNag = -99, idle = 0, lastHero = V3(0, 0, 0), panelMode = 'main', panelPet = null, pickedEgg = null, refreshT = 0;
const tmp = V3(0, 0, 0);

function spawnPet() {
  despawnPet();
  const pet = active(); if (!pet) return;
  const m = RW.petModel(pet.sp, pet.stage);
  m.root.scale.setScalar(SCALE);
  const shadow = RW.blob(0.55 * (m.size || 0.8)); m.root.add(shadow);
  scene.add(m.root);
  const st = petStats(pet);
  if (pet.hp == null || pet.hp > st.maxHp) pet.hp = st.maxHp;
  const tag = G.lbl('<div class="tag pet"><span class="pmood"></span> <span class="pn"></span></div><div class="mhp pet"><i></i></div>');
  const zzz = G.lbl('<div class="sitz">z z</div>'); G.hideEl(zzz);
  cur = { pet, m, tag, zzz, pos: m.root.position, face: 0, state: 'follow', target: null, atkCd: 1, skCd: [3, 8, 12], lunge: 0, hop: 0, t: 0, faceT: 0, faceHold: null, react: null, restT: 0, stuck: 0, evo: null, last: { mood: '', name: '', hp: -1 } };
  if (pet.hp <= 0) { cur.state = 'rest'; cur.restT = REST_TIME * 0.5; }
  placeBehind(true);
}
function despawnPet() {
  if (!cur) return;
  scene.remove(cur.m.root); cur.tag.remove(); cur.zzz.remove(); cur = null;
}
function spawnEgg() {
  despawnEgg();
  if (!P || !P.egg) return;
  const e = RW.eggModel(P.egg.kind);
  e.root.scale.setScalar(0.75); e.root.add(RW.blob(0.35));
  scene.add(e.root);
  eggW = { e, pos: e.root.position, hop: 0, t: 0 };
  const pp = G.player.pos; eggW.pos.set(pp.x - 1, W.height(pp.x - 1, pp.z), pp.z);
}
function despawnEgg() { if (!eggW) return; scene.remove(eggW.e.root); eggW = null; }
function behindSpot(side) {
  const pl = G.player, f = pl.face;
  return { x: pl.pos.x - Math.sin(f) * 1.5 + Math.cos(f) * side, z: pl.pos.z - Math.cos(f) * 1.5 - Math.sin(f) * side };
}
function placeBehind(snap) {
  if (!cur) return;
  const s = behindSpot(0.7);
  let x = s.x, z = s.z;
  if (!W.walkable(x, z)) { x = G.player.pos.x; z = G.player.pos.z; }
  cur.pos.set(x, W.height(x, z), z); cur.face = G.player.face;
  if (snap && G.here) { /* nothing else to do */ }
}
function setMood(face, hold) {
  if (!cur) return;
  if (hold) { cur.faceHold = face; cur.faceT = hold; }
  RW.setPetMood(cur.m, face);
}
function head(of) { const o = of || cur; return V3(o.pos.x, o.pos.y + ((o.m.headY || 0.5) * SCALE + 0.55) + (o.m.hover || 0), o.pos.z); }

// ---------- care ----------
function feed(id) {
  const pet = active(), it = ITEMS[id];
  if (!pet) return G.deny('You have no pet with you.');
  if (!it || !it.food) return false;
  if (G.bagCount(id) <= 0) return G.deny('No ' + it.name + ' left.');
  if (pet.food >= 97) return G.deny(pet.name + ' is full!');
  G.bagTake(id, 1);
  pet.food = Math.min(100, pet.food + it.food); if (it.fun) pet.fun = Math.min(100, pet.fun + it.fun);
  react('eat'); sfx.chew();
  if (cur) G.floatText('<small>YUM!</small>+' + it.food, 'heal', head());
  G.dirty = true; afterCare();
  return true;
}
function play() {
  const pet = active(); if (!pet) return;
  if (cur && cur.react) return;
  if (pet.fun >= 97) return G.deny(pet.name + ' already had lots of fun!');
  pet.fun = Math.min(100, pet.fun + 35); pet.food = Math.max(0, pet.food - 3); pet.clean = Math.max(0, pet.clean - 4);
  react('play'); sfx.chirp(PITCH[pet.sp]);
  if (cur) G.floatText('<small>WHEE!</small>', 'heal', head());
  G.dirty = true; afterCare();
}
function bathe() {
  const pet = active(); if (!pet) return;
  if (cur && cur.react) return;
  if (pet.clean >= 97) return G.deny(pet.name + ' is already squeaky clean!');
  pet.clean = 100; pet.fun = Math.max(0, pet.fun - 2);
  react('bath'); sfx.splash();
  if (cur) G.floatText('<small>SPLASH!</small>', 'el el-water', head());
  G.dirty = true; afterCare();
}
// a little show: the pet hops in front of you, the open windows fade away so you can watch, hearts and bubbles fly
let careFade = 0;
const CARE_FX = { eat: ['🍓', '😋', '❤️', '✨'], play: ['❤️', '💖', '⭐', '🎵'], bath: ['🫧', '💧', '🫧', '✨'] };
function react(kind) {
  if (!cur) return;
  const dur = kind === 'eat' ? 2.4 : kind === 'bath' ? 2.6 : 2.6;
  const pl = G.player, f = pl.face;
  let x = pl.pos.x + Math.sin(f) * 1.7, z = pl.pos.z + Math.cos(f) * 1.7;
  if (!W.walkable(x, z)) { x = cur.pos.x; z = cur.pos.z; }
  cur.pos.set(x, W.height(x, z), z);
  cur.react = { kind, t: 0, dur, fx: 0, at: { x, z }, face: f + Math.PI };
  if (cur.state === 'sleep') cur.state = 'follow';
  idle = 0;
  if (G.mode === 'play') { document.body.classList.add('pet-caring'); careFade = dur + 0.2; }
}
function careFx(R) {
  const list = CARE_FX[R.kind] || CARE_FX.play, h = head();
  h.x += rnd(-0.5, 0.5); h.z += rnd(-0.5, 0.5); h.y += rnd(-0.1, 0.4);
  G.floatText('<span class="care-ico">' + list[Math.floor(Math.random() * list.length)] + '</span>', 'care', h, 1.3);
}
function afterCare() { if (UI.isOpen('petPanel')) render(); if (UI.isOpen('bagPanel')) UI.renderBag(); syncBadge(); }

// ---------- eggs ----------
function takeEgg(kind) {
  if (!P || P.egg) return;
  P.egg = { kind, t: 0 }; spawnEgg(); sfx.questNew(); G.dirty = true; G.save();
}
function carryEgg(id) {
  if (!P) return;
  if (P.egg) return G.deny('You are already carrying an egg.');
  if (!G.bagTake(id, 1)) return;
  const ek = (ITEMS[id] && ITEMS[id].egg) || 'wild'; takeEgg(ek);
  UI.toast('You carry the <b>' + esc(PET_EGGS[ek].name) + '</b>. Adventure and it will hatch!');
  if (UI.isOpen('bagPanel')) UI.renderBag();
}
function startHatch() {
  if (hatching || !eggW) return;
  hatching = { t: 0, cracked: false };
  UI.toast('The egg is wobbling...!', true);
}
function finishHatch() {
  const kind = P.egg.kind, list = PET_EGGS[kind].species, sp = list[Math.floor(Math.random() * list.length)];
  const traits = Object.keys(PET_TRAITS), trait = traits[Math.floor(Math.random() * traits.length)];
  const pos = eggW ? eggW.pos.clone() : G.player.pos.clone();
  for (let i = 0; i < 10; i++) G.spawnPuff(V3(pos.x + rnd(-0.4, 0.4), pos.y + 0.4, pos.z + rnd(-0.4, 0.4)), [0xffffff, 0xfff1a8, COL[sp]][i % 3], true);
  G.spawnRing(pos, 0xfff1a8, 2.6, 0.7); sfx.appear();
  despawnEgg(); P.egg = null; hatching = null;
  const pet = { id: newId(), sp, name: PETS[sp].name, trait, lv: 1, exp: 0, stage: 'baby', food: 80, fun: 80, clean: 90, hp: null, born: Date.now(), named: false };
  P.pets.push(pet);
  const goesOut = !active();
  if (goesOut) { P.petOn = pet.id; spawnPet(); if (cur) { cur.pos.set(pos.x, W.height(pos.x, pos.z), pos.z); setMood('happy', 2.5); react('play'); } }
  G.dirty = true; G.save();
  panelMode = 'name'; panelPet = pet.id;
  UI.open('petPanel');
}

// ---------- levels and evolving ----------
function petGainExp(pet, n) {
  if (pet.lv >= 50) return;
  pet.exp += n;
  while (pet.lv < 50 && pet.exp >= expNeed(pet.lv)) {
    pet.exp -= expNeed(pet.lv); pet.lv++;
    pet.hp = petStats(pet).maxHp;
    UI.toast(esc(pet.name) + ' grew to <b>Pet Lv. ' + pet.lv + '</b>!');
    if (cur && cur.pet === pet) { G.floatText('PET LV UP', 'lvl', head(), 1.4); G.spawnRing(cur.pos, 0xffc8e8, 1.8, 0.6); sfx.point(); }
    if (pet.stage === 'baby' && pet.lv >= PET_TEEN_LV) evolve(pet);
    else if (pet.lv >= ADULT_LV && !isAdult(pet) && pet.stage !== 'baby') evolve(pet, (pet.food + pet.fun + pet.clean) / 3 >= 60 ? 'adult_a' : 'adult_b');
  }
  G.dirty = true;
}
function evolve(pet, to) {
  to = to || 'teen';
  if (cur && cur.pet === pet) { cur.evo = { t: 0, swapped: false, to }; UI.toast(esc(pet.name) + ' is glowing...!', true); }
  else { pet.stage = to; pet.hp = petStats(pet).maxHp; UI.toast(esc(pet.name) + (to === 'teen' ? ' became a teen!' : ' became an adult!'), true); }
}
function tickEvolve(dt) {
  const E = cur.evo; E.t += dt;
  cur.m.root.rotation.y += dt * (4 + E.t * 10);
  cur.m.body.position.y = Math.sin(Math.min(1, E.t / 2.6) * Math.PI) * 0.6;
  if (Math.random() < 0.5) G.spawnPuff(V3(cur.pos.x + rnd(-0.5, 0.5), cur.pos.y + rnd(0.2, 1), cur.pos.z + rnd(-0.5, 0.5)), 0xfff1a8, true);
  if (!E.swapped && E.t > 1.6) {
    E.swapped = true;
    const pet = cur.pet, at = cur.pos.clone(), to = E.to || 'teen';
    pet.stage = to; pet.hp = petStats(pet).maxHp;
    spawnPet(); cur.pos.copy(at);
    cur.evo = { t: 1.6, swapped: true, to };
    G.spawnRing(at, 0xffffff, 3.4, 0.8); G.spawnRing(at, 0xfff1a8, 2.4, 0.6);
    for (let i = 0; i < 14; i++) G.spawnPuff(V3(at.x + rnd(-0.6, 0.6), at.y + rnd(0.2, 1.2), at.z + rnd(-0.6, 0.6)), [0xffffff, 0xfff1a8, COL[pet.sp]][i % 3], true);
    sfx.level(); setMood('happy', 3);
    const adult = to !== 'teen';
    UI.toast(esc(pet.name) + ' evolved into ' + (adult ? (to === 'adult_a' ? 'a bright' : 'a wild') + ' adult ' : 'a teen ') + PETS[pet.sp].name + '!', true);
    const ns = PETS[pet.sp].skills[adult ? 2 : 1]; if (ns) UI.toast('New pet skill: <b>' + ns.name + '</b>');
    G.save(); if (UI.isOpen('petPanel')) render();
  }
  if (E.t > 2.6) { cur.evo = null; cur.m.body.position.y = 0; }
}

// ---------- fighting ----------
function strength(pet) {
  const st = petStats(pet), md = mood(pet);
  return st.atk * (md === 'happy' ? 1.15 : md === 'sad' ? 0.6 : 1) * (roleOf(pet) === 'ranger' ? 1.35 : 1);
}
function pickFoe() {
  const pl = G.player; if (pl.dead) return null;
  const ok = (m) => m && m.alive && m.active && !m.k.target && !m.k.magicOnly && !m.practice && !m.lit;
  // v1.3: pets are rangers that always attack: the hero's target first, else the closest monster near the hero (angry or not)
  const t = pl.target;
  if (ok(t) && Math.hypot(t.pos.x - pl.pos.x, t.pos.z - pl.pos.z) < PET_SEEK) return t;
  if (pl.zone === 'town') return null;
  // v1.4: the pet starts its own fights only while auto hunt is on; with it off, it helps against the hero's target and monsters that are angry at the hero
  const free = !!G.autoOn;
  if (cur && cur.target && ok(cur.target) && (free || cur.target.aggro) && Math.hypot(cur.target.pos.x - pl.pos.x, cur.target.pos.z - pl.pos.z) < PET_SEEK + 2) return cur.target;
  let best = null, bd = PET_SEEK;
  for (const m of G.monsters) { if (!ok(m) || m.k.passive || (m.k.disguise && !m.awake) || (!free && !m.aggro)) continue; const d = Math.hypot(m.pos.x - pl.pos.x, m.pos.z - pl.pos.z) - (m.aggro ? 3 : 0); if (d < bd) { bd = d; best = m; } }
  return best;
}
const PET_SEEK = 10, PET_RANGE0 = 6; // pets look for monsters within 10 m of the hero and shoot from up to 6 m away
// v1.4: rangers shoot from further away and hit harder; tanks stand in front, take hits for you and soften what reaches you
const rangeOf = () => (cur && roleOf(cur.pet) === 'ranger' ? 9.5 : PET_RANGE0);const reachOf = (m) => (m.k.radius || 0.6) * m.scale + 0.75;
const shotReach = (m) => reachOf(m) + rangeOf();
// a little glowing shot from the pet's mouth to the monster
function shotFx(m, col) {
  const f = Math.atan2(m.pos.x - cur.pos.x, m.pos.z - cur.pos.z);
  const a = V3(cur.pos.x + Math.sin(f) * 0.4, cur.pos.y + 0.5, cur.pos.z + Math.cos(f) * 0.4), b = V3(m.pos.x, m.pos.y + 0.6 * m.scale, m.pos.z);
  const n = Math.max(4, Math.round(a.distanceTo(b) * 1.5));
  for (let k = 0; k <= n; k++) G.spawnPuff(V3(lerpN(a.x, b.x, k / n), lerpN(a.y, b.y, k / n), lerpN(a.z, b.z, k / n)), col, false);
}
// healer pets: heal the hero (and themselves) when HP runs low
function healTeam(s, pet, st) {
  const pl = G.player, D = G.D; let did = false;
  if (pl && !pl.dead && D && pl.hp < D.maxHp * 0.6) { const h = Math.round(D.maxHp * s.heal * 0.5); pl.hp = Math.min(D.maxHp, pl.hp + h); G.floatText('+' + h, 'heal', V3(pl.pos.x, pl.pos.y + 2.2, pl.pos.z)); G.spawnRing(pl.pos, 0xa6f07f, 1.6, 0.6); for (let k = 0; k < 6; k++) G.spawnPuff(V3(pl.pos.x + rnd(-0.4, 0.4), pl.pos.y + rnd(0.3, 1.6), pl.pos.z + rnd(-0.4, 0.4)), 0xa6f07f, true); did = true; }
  if (pet.hp < st.maxHp * 0.55) { const h = Math.round(st.maxHp * s.heal); pet.hp = Math.min(st.maxHp, pet.hp + h); G.floatText('+' + h, 'heal', head()); G.spawnRing(cur.pos, 0xa6f07f, 1.4, 0.5); did = true; }
  if (did) for (let k = 0; k < 6; k++) G.spawnPuff(V3(cur.pos.x + rnd(-0.4, 0.4), cur.pos.y + 0.3, cur.pos.z + rnd(-0.4, 0.4)), pet.sp === 'mossback' ? 0xa8e07a : 0xbfe8ff, true);
  return did;
}
function petHit(m, mult, o) {
  if (!m.alive) return;
  G.hitMonster(m, mult, (o && o.kb) || 0.15, false, false, Object.assign({ flat: strength(cur.pet), pet: true, fromX: cur.pos.x, fromZ: cur.pos.z, color: COL[cur.pet.sp] }, o || {}));
}
function useSkills(dt) {
  const pet = cur.pet, sk = skillsOf(pet), st = petStats(pet), pl = G.player;
  for (let i = 0; i < sk.length; i++) {
    cur.skCd[i] = cur.skCd[i] || 0;
    cur.skCd[i] = Math.max(0, cur.skCd[i] - dt);
    const s = sk[i]; if (!s.open || cur.skCd[i] > 0) continue;
    const m = cur.target;
    let used = false;
    if (s.kind === 'heal') used = healTeam(s, pet, st);
    else if (s.kind === 'guard') { if (G.time - pl.lastHurt < 2.5) { pl.buffs.shell = { t: s.dur, def: s.def, name: s.name, pet: true }; G.spawnRing(pl.pos, 0xa8d878, 1.8, 0.6); used = true; } }
    else if (s.kind === 'luck') { luckUntil = G.time + s.dur; G.spawnRing(cur.pos, 0xffe48a, 2.2, 0.6); for (let k = 0; k < 6; k++) G.spawnPuff(V3(cur.pos.x + rnd(-0.5, 0.5), cur.pos.y + 0.7, cur.pos.z + rnd(-0.5, 0.5)), 0xffe48a, true); used = true; }
    else if (s.kind === 'weaken') { let n = 0; for (const o of G.monsters) if (o.alive && o.aggro && Math.hypot(o.pos.x - cur.pos.x, o.pos.z - cur.pos.z) < s.radius) { o.weakT = s.dur; n++; G.spawnPuff(V3(o.pos.x, o.pos.y + 1, o.pos.z), 0xffb8d8, true); } if (n) { G.spawnRing(cur.pos, 0xffb8d8, s.radius, 0.7); used = true; } }
    else if (m && m.alive && Math.hypot(m.pos.x - cur.pos.x, m.pos.z - cur.pos.z) < shotReach(m) + 1) {
      cur.face = Math.atan2(m.pos.x - cur.pos.x, m.pos.z - cur.pos.z);
      shotFx(m, COL[pet.sp]);
      if (s.kind === 'hit') {
        petHit(m, s.power, { element: s.element, stun: s.stun, slow: s.slow, kb: s.kb, magic: !!s.element });
        used = true;
      } else if (s.kind === 'area') {
        // the shot bursts on the monster and hits everything around it
        for (const o of G.monsters) if (o.alive && o.active && !o.k.target && !o.k.passive && Math.hypot(o.pos.x - m.pos.x, o.pos.z - m.pos.z) < s.radius + (o.k.radius || 0.6) * o.scale) petHit(o, s.power, { element: s.element, magic: !!s.element, kb: 0.5 });
        G.spawnRing(m.pos, COL[pet.sp], s.radius * 1.1, 0.5);
        for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; G.spawnPuff(V3(m.pos.x + Math.cos(a) * 1.2, m.pos.y + 0.4, m.pos.z + Math.sin(a) * 1.2), COL[pet.sp], true); }
        used = true;
      }
    }
    if (used) { cur.skCd[i] = s.cd; G.floatText('<small>' + esc(s.name).toUpperCase() + '</small>', 'el el-' + (s.element || 'wind'), V3(cur.pos.x, head().y + 0.3, cur.pos.z), 1.1); sfx.chirp(PITCH[pet.sp] * 1.2); setMood('happy', 0.8); cur.lunge = 0.01; return; }
  }
}
const lerpN = (a, b, k) => a + (b - a) * k;
function intercept(m) {
  if (!cur || cur.state !== 'fight' || cur.pet.hp <= 0) return false;
  if (Math.hypot(m.pos.x - cur.pos.x, m.pos.z - cur.pos.z) > reachOf(m) + 1.4) return false;
  const tank = roleOf(cur.pet) === 'tank';
  if (Math.random() > (tank ? 0.75 : 0.35)) return false;
  const pet = cur.pet, dmg = Math.max(1, Math.round(rnd(m.st.dmg[0], m.st.dmg[1]) * (m.weakT > 0 ? 0.7 : 1) * (isTeen(pet) ? 0.8 : 1) * (tank ? 0.55 : 1) - pet.lv * 0.3));
  pet.hp -= dmg;
  G.floatText('-' + dmg, 'hurt', head()); G.spawnSpark(V3(cur.pos.x, cur.pos.y + 0.5, cur.pos.z), false);
  setMood('hurt', 0.5);
  if (pet.hp <= 0) petFaint();
  return true;
}
function petFaint() {
  const pet = cur.pet; pet.hp = 0;
  cur.state = 'rest'; cur.restT = REST_TIME; cur.target = null;
  G.floatText('<small>NEEDS A REST</small>', 'miss', head(), 1.4);
  UI.toast(esc(pet.name) + ' is worn out and rests for a moment.');
  G.dirty = true;
}

// ---------- every frame ----------
function update(dt, time) {
  if (careFade > 0) { careFade -= dt; if (careFade <= 0 || G.mode !== 'play') { careFade = 0; document.body.classList.remove('pet-caring'); } }
  if (!P) return;
  const pl = G.player;
  // needs go down slowly for the pet that is with you (Pip looks after the others)
  const pet = active();
  if (pet && !hatching) {
    pet.food = Math.max(0, pet.food - DECAY * (pet.trait === 'greedy' ? 1.5 : 1) * dt);
    pet.fun = Math.max(0, pet.fun - DECAY * (pet.trait === 'spoiled' ? 1.5 : 1) * dt);
    pet.clean = Math.max(0, pet.clean - DECAY * 0.8 * dt);
  }
  for (const o of pets()) if (o !== pet) { o.food = Math.min(80, Math.max(o.food, o.food + dt * 0.2)); o.fun = Math.min(80, Math.max(o.fun, o.fun + dt * 0.2)); o.clean = Math.min(80, Math.max(o.clean, o.clean + dt * 0.2)); }
  // the hero standing still for a long time sends the pet to sleep
  const moved = Math.hypot(pl.pos.x - lastHero.x, pl.pos.z - lastHero.z) > 0.02;
  lastHero.copy(pl.pos);
  if (moved || pl.target || time - pl.lastFight < 3 || pl.dead) idle = 0; else idle += dt;
  if (eggW) updateEgg(dt, time);
  if (cur) updatePet(dt, time);
  refreshT -= dt; if (refreshT <= 0) { refreshT = 0.5; syncBadge(); if (UI.isOpen('petPanel') && panelMode === 'main') refreshBars(); }
}
function updateEgg(dt, time) {
  const pl = G.player, E = eggW;
  E.t += dt;
  if (P.egg && !hatching && !pl.dead) { P.egg.t += dt; if (P.egg.t >= PET_HATCH) startHatch(); }
  // follows behind the hero (beside the pet if there is one)
  const s = behindSpot(cur ? -0.7 : 0);
  const d = Math.hypot(s.x - E.pos.x, s.z - E.pos.z);
  if (d > 20) { E.pos.set(s.x, 0, s.z); }
  else if (d > 0.3 && !hatching) { const sp = Math.min(d * 3, 7.5) * dt; W.tryMove(E.pos, E.pos.x + (s.x - E.pos.x) / d * sp, E.pos.z + (s.z - E.pos.z) / d * sp, false); E.hop += dt * 9; }
  E.pos.y = W.height(E.pos.x, E.pos.z);
  const b = E.e.body;
  if (hatching) {
    const H = hatching; H.t += dt;
    const k = Math.min(1, H.t / 2.6);
    b.rotation.z = Math.sin(H.t * (10 + k * 20)) * (0.12 + k * 0.25); b.position.y = Math.abs(Math.sin(H.t * 8)) * 0.1 * k;
    if (!H.cracked && H.t > 1.2) { H.cracked = true; E.e.crack(true); sfx.crack(); G.spawnSpark(V3(E.pos.x, E.pos.y + 0.5, E.pos.z), true); }
    if (H.t > 1.25 && H.t < 1.4 && Math.random() < 0.5) sfx.crack();
    if (H.t >= 2.6) finishHatch();
    return;
  }
  const ready = P.egg && P.egg.t / PET_HATCH;
  b.position.y = d > 0.3 ? Math.abs(Math.sin(E.hop)) * 0.18 : 0;
  b.rotation.z = (ready > 0.8 ? Math.sin(E.t * 9) * 0.08 : 0) + (d > 0.3 ? Math.sin(E.hop) * 0.12 : 0);
  E.e.root.rotation.y += wrapAngle(pl.face - E.e.root.rotation.y) * Math.min(1, dt * 3);
}
function updatePet(dt, time) {
  const C = cur, pet = C.pet, pl = G.player, m = C.m, st = petStats(pet);
  C.t += dt;
  if (C.evo) { tickEvolve(dt); return; }
  // where does it want to be?
  const md = mood(pet);
  if (C.state === 'rest') { C.restT -= dt; if (C.restT <= 0) { C.state = 'follow'; pet.hp = Math.round(st.maxHp * 0.5); G.floatText('<small>READY!</small>', 'heal', head()); sfx.chirp(PITCH[pet.sp]); } }
  else if (pl.dead) { C.state = 'follow'; C.target = null; }
  else {
    const foe = md === 'sad' || C.react ? null : pickFoe();
    if (foe) { C.state = 'fight'; C.target = foe; }
    else {
      C.target = null;
      if (C.state === 'fight') C.state = 'follow';
      if (C.state === 'follow' && idle > SLEEP_IDLE) C.state = 'sleep';
      if (C.state === 'sleep' && idle < 0.5) C.state = 'follow';
    }
    if (md === 'sad' && pickFoe() && time - sadNag > 10) { sadNag = time; G.floatText('<small>TOO SAD TO FIGHT</small>', 'miss', head(), 1.4); UI.toast(esc(pet.name) + ' is too sad to fight. Care for them (P).'); }
  }
  // HP slowly comes back when not fighting
  if (C.state !== 'fight' && C.state !== 'rest' && pet.hp < st.maxHp) pet.hp = Math.min(st.maxHp, pet.hp + st.maxHp * (pl.zone === 'town' ? 0.05 : 0.015) * dt);
  // movement
  let tx, tz, stopAt = 0.25, maxSp = 8;
  if (C.state === 'fight' && C.target) {
    // a ranger: keeps a few steps away from the monster, on the hero's side, and only walks closer when out of range
    const f = C.target, df = Math.hypot(f.pos.x - C.pos.x, f.pos.z - C.pos.z), want = cur && roleOf(cur.pet) === 'tank' ? reachOf(f) + 0.6 : reachOf(f) + rangeOf() * 0.7;
    const tank = roleOf(pet) === 'tank';
    if (tank ? df > reachOf(f) + 1.2 : (df > shotReach(f) - 0.3 || df < reachOf(f) + 1.2)) { const ang = Math.atan2(pl.pos.x - f.pos.x, pl.pos.z - f.pos.z) + 0.6; tx = f.pos.x + Math.sin(ang) * want; tz = f.pos.z + Math.cos(ang) * want; }
    else { tx = C.pos.x; tz = C.pos.z; }
    stopAt = 0.4; maxSp = 7.5;
  }
  else if (C.state === 'rest' || C.state === 'sleep') { const s = behindSpot(0.7); tx = s.x; tz = s.z; stopAt = 3; maxSp = 2.2; }
  else { const s = behindSpot(0.7); tx = s.x; tz = s.z; }
  const dxh = pl.pos.x - C.pos.x, dzh = pl.pos.z - C.pos.z, dHero = Math.hypot(dxh, dzh);
  if (dHero > 22 || W.mapAt(C.pos.x, C.pos.z) !== W.mapAt(pl.pos.x, pl.pos.z)) { placeBehind(); G.spawnPuff(V3(C.pos.x, C.pos.y + 0.3, C.pos.z), 0xffffff, true); }
  const dx = tx - C.pos.x, dz = tz - C.pos.z, d = Math.hypot(dx, dz);
  let moving = false;
  if (d > stopAt && !C.react) {
    const sp = Math.min(maxSp, Math.max(2.5, d * 2.6)) * dt;
    const ok = W.tryMove(C.pos, C.pos.x + dx / d * Math.min(sp, d), C.pos.z + dz / d * Math.min(sp, d), false);
    moving = true; C.hop += dt * (pet.sp === 'lilytoad' || pet.sp === 'glimmerbun' ? 9 : 13);
    C.face += wrapAngle(Math.atan2(dx, dz) - C.face) * Math.min(1, dt * 8);
    if (!ok) { C.stuck += dt; if (C.stuck > 1.5) { C.stuck = 0; placeBehind(); } } else C.stuck = 0;
  } else {
    C.stuck = 0;
    // standing around it peeks back at you (the camera), so its face shows
    const cp = RW.camera.position;
    const look = C.target ? Math.atan2(C.target.pos.x - C.pos.x, C.target.pos.z - C.pos.z) : C.state === 'sleep' || C.state === 'rest' ? C.face : Math.atan2(cp.x - C.pos.x, cp.z - C.pos.z) + Math.sin(C.t * 0.5) * 0.35;
    if (dHero > 0.5 || C.target) C.face += wrapAngle(look - C.face) * Math.min(1, dt * 5);
  }
  W.collide(C.pos, 0.3);
  C.pos.y = W.height(C.pos.x, C.pos.z);
  // attacking
  if (C.state === 'fight' && roleOf(pet) === 'tank' && pet.hp > 0) pl.buffs.petguard = { t: 0.6, guard: 0.15, name: pet.name + ' guards you', pet: true };
  if (C.state === 'fight' && C.target && !C.react) {
    C.atkCd -= dt;
    useSkills(dt);
    const f = C.target;
    if (f && f.alive && C.atkCd <= 0 && Math.hypot(f.pos.x - C.pos.x, f.pos.z - C.pos.z) < shotReach(f)) { C.atkCd = 1.5; C.lunge = 0.01; C.hitPending = f; }
  }
  if (C.lunge > 0) { C.lunge += dt; if (C.hitPending && C.lunge > 0.16) { const f = C.hitPending; C.hitPending = null; if (f.alive) { shotFx(f, COL[pet.sp]); petHit(f, 1); } } if (C.lunge > 0.35) C.lunge = 0; }
  // the body: hops, wiggles, spins
  const b = m.body;
  let y = (m.hover || 0) ? m.hover + Math.sin(C.t * 2.2) * 0.06 : 0, rz = 0, sx = 1, sy = 1, spin = 0;
  if (moving) { y += Math.abs(Math.sin(C.hop)) * (pet.sp === 'lilytoad' || pet.sp === 'glimmerbun' ? 0.22 : 0.1); rz = Math.sin(C.hop) * 0.08; }
  else { sy = 1 + Math.sin(C.t * 2.6) * 0.03; }
  if (C.state === 'sleep' || C.state === 'rest') { sy = 1 + Math.sin(C.t * 1.4) * 0.04; y *= 0.3; }
  const lu = C.lunge > 0 ? Math.sin(Math.min(1, C.lunge / 0.35) * Math.PI) : 0;
  if (C.react) {
    const R = C.react; R.t += dt; const k = Math.min(1, R.t / R.dur);
    if (R.at) { C.pos.set(R.at.x, W.height(R.at.x, R.at.z), R.at.z); C.face = R.face; }
    R.fx -= dt; if (R.fx <= 0) { R.fx = 0.22; careFx(R); }
    if (R.kind === 'eat') { // chomp chomp, then a happy wiggle
      if (k < 0.7) { sy = 1 + Math.abs(Math.sin(R.t * 14)) * 0.18; sx = 1 / Math.sqrt(sy); }
      else { y += Math.abs(Math.sin(R.t * 12)) * 0.35; rz = Math.sin(R.t * 18) * 0.2; }
    }
    else if (R.kind === 'bath') { rz = Math.sin(R.t * 26) * 0.3 * (1 - k * 0.6); sy = 1 + Math.sin(R.t * 9) * 0.08; if (Math.random() < 0.5) G.spawnPuff(V3(C.pos.x + rnd(-0.4, 0.4), C.pos.y + rnd(0.3, 0.9), C.pos.z + rnd(-0.4, 0.4)), [0xffffff, 0xbfe8ff][Math.floor(Math.random() * 2)], true); }
    else if (R.kind === 'play') { // three bouncy hops, the last one with a big twirl
      const hop = (k * 3) % 1, n = Math.floor(k * 3);
      y += Math.sin(hop * Math.PI) * (n === 2 ? 0.95 : 0.5);
      if (n === 2) spin = hop * Math.PI * 2;
      sy = hop < 0.08 || hop > 0.92 ? 0.8 : 1.08; sx = 1 / Math.sqrt(sy);
      if (Math.random() < 0.2) G.spawnPuff(V3(C.pos.x + rnd(-0.3, 0.3), C.pos.y + 0.8, C.pos.z + rnd(-0.3, 0.3)), 0xffc8e8, true);
    }
    if (R.t >= R.dur) C.react = null;
  }
  b.position.set(0, y, lu * 0.35); b.rotation.set(0, spin, rz); b.scale.set(sx, sy, sx);
  m.root.rotation.y = C.face;
  if (m.tail) m.tail.rotation.y = Math.sin(C.t * (C.state === 'fight' ? 10 : moving ? 8 : 3)) * 0.35;
  if (m.halo) m.halo.material.opacity = md === 'happy' ? 0.45 + Math.sin(C.t * 3) * 0.2 : 0.15;
  // face
  if (C.faceT > 0) { C.faceT -= dt; if (C.faceT <= 0) C.faceHold = null; }
  let face = md === 'happy' ? 'happy' : md === 'sad' ? 'sad' : 'normal';
  if (C.state === 'fight') face = 'normal';
  if (C.state === 'sleep' || C.state === 'rest') face = 'sleep';
  if (C.react) face = C.react.kind === 'eat' ? 'eat' : 'happy';
  if (C.faceHold) face = C.faceHold;
  RW.setPetMood(m, face);
}
function placeTag() {
  const C = cur, pet = C.pet, st = petStats(pet);
  const md = C.state === 'rest' ? 'rest' : C.state === 'sleep' ? 'sleep' : mood(pet), w = wants(pet);
  const icon = w && md !== 'rest' && md !== 'sleep' ? w[3] : MOOD_INFO[md][1];
  if (C.last.mood !== icon) { C.last.mood = icon; C.tag.querySelector('.pmood').textContent = icon; }
  if (C.last.name !== pet.name) { C.last.name = pet.name; C.tag.querySelector('.pn').textContent = pet.name; }
  const hp = Math.round(Math.max(0, pet.hp) / st.maxHp * 100);
  const far = Math.hypot(C.pos.x - G.player.pos.x, C.pos.z - G.player.pos.z) > 40;
  if (!far && G.place(C.tag, V3(C.pos.x, C.pos.y + ((C.m.headY || 0.5) * SCALE + 0.5) + (C.m.hover || 0), C.pos.z), 0)) { if (C.last.hp !== hp) { C.last.hp = hp; C.tag.querySelector('.mhp i').style.width = hp + '%'; } }
  else G.hideEl(C.tag);
  if (C.state === 'sleep' || C.state === 'rest') { G.place(C.zzz, V3(C.pos.x + 0.25, C.pos.y + ((C.m.headY || 0.5) * SCALE + 0.9) + Math.sin(C.t * 1.5) * 0.1, C.pos.z), 0); C.zzz.style.opacity = String(0.6 + Math.sin(C.t * 2) * 0.3); }
  else G.hideEl(C.zzz);
}

// ---------- hooks game.js calls ----------
function drops(m) {
  if (!P || m.k.target || m.practice) return;
  if (Math.random() < (m.golden ? EGG_DROP_GOLD : EGG_DROP)) { G.dropItem('wild_egg', 1, m.pos, 1.3); UI.toast('A <b>Wild Egg</b> rolled out!', true); sfx.sparkle(); }
}
const coinMult = () => (G.time < luckUntil ? 1.6 : 1);
const luckT = () => Math.max(0, luckUntil - G.time);

// ---------- events ----------
RW.on('enter', (p) => {
  P = p; luckUntil = -1; hatching = null; idle = 0; lastHero.copy(G.player.pos); panelMode = 'main';
  // time passed while the game was closed: needs drop, but only a little
  const pet = active();
  if (pet && P.petSaved) {
    const secs = Math.max(0, (Date.now() - P.petSaved) / 1000), loss = secs * DECAY * OFFLINE;
    for (const k of ['food', 'fun', 'clean']) if (pet[k] > OFFLINE_FLOOR) pet[k] = Math.max(OFFLINE_FLOOR, pet[k] - loss * (k === 'food' && pet.trait === 'greedy' ? 1.5 : k === 'fun' && pet.trait === 'spoiled' ? 1.5 : 1));
  }
  spawnPet(); spawnEgg(); syncBadge();
  if (!pets().length && !P.egg && P.lv >= 2) setTimeout(() => { if (P && !pets().length && !P.egg) UI.toast('Pip at the Pet Den in Mossbrook has a surprise for you!'); }, 6000);
});
RW.on('leave', () => { despawnPet(); despawnEgg(); hatching = null; P = null; syncBadge(); });
RW.on('map', () => { if (cur) placeBehind(); if (eggW) { const s = behindSpot(0); eggW.pos.set(s.x, W.height(s.x, s.z), s.z); } });
RW.on('revive', () => { if (cur) placeBehind(); if (eggW) { const s = behindSpot(0); eggW.pos.set(s.x, W.height(s.x, s.z), s.z); } });
RW.on('kill', (m) => {
  if (!P || !m.petHit || m.k.target) return;
  const pet = active(); if (!pet) return;
  const diff = m.lv - pet.lv, mult = diff <= -4 ? 0.4 : diff <= -2 ? 0.75 : 1;
  petGainExp(pet, Math.max(1, Math.round(m.st.exp * 0.8 * mult)));
});
RW.on('levelup', (lv) => { if (lv === 2 && P && !pets().length && !P.egg) setTimeout(() => UI.toast('Pip at the Pet Den in Mossbrook has a surprise for you!'), 2500); });

// ---------- Pip ----------
const PIP = (face, text) => ({ who: 'pip', face, text });
const bye = () => { UI.hideDialog(); G.endTalk(); };
function atPip() { const n = G.npcs.find((x) => x.id === 'pip'); return !!(n && G.here(n) && Math.hypot(n.x - G.player.pos.x, n.z - G.player.pos.z) < 8); }
function talk(n) {
  if (n.id !== 'pip' || !P) return false;
  const quest = RW.story && RW.story.pending && RW.story.pending('pip');
  const qAct = quest ? [{ label: 'About your request', run: () => { UI.hideDialog(); if (!(RW.story && RW.story.talk(n))) bye(); } }] : [];
  if (!pets().length && !P.egg) {
    UI.say([PIP('surprised', 'Wait... you go out there all alone? With no pet buddy? Oh no no no.'), PIP('happy', 'I have three mystery eggs. Pick one, keep it close while you adventure, and it will hatch!'), PIP('normal', 'Nobody knows what is inside. That is the best part!')],
      [{ label: 'Pick an egg', run: () => { bye(); panelMode = 'pick'; pickedEgg = null; UI.open('petPanel'); } }, ...qAct, { label: 'Not now', soft: true, run: bye }]);
    return true;
  }
  const pet = active();
  const lines = pet ? (mood(pet) === 'sad' ? [PIP('worried', 'Oh, ' + pet.name + ' looks so sad! Feed them, play with them and give them a bath. Press P.')]
    : mood(pet) === 'happy' ? [PIP('happy', pet.name + ' looks SO happy! You are a great pet keeper.')]
      : [PIP('normal', 'How is ' + pet.name + ' doing? Pets love snacks, games and a nice bath.')])
    : [PIP('happy', 'Your egg is safe with you? Keep adventuring and it will hatch soon!')];
  const acts = [{ label: 'Pet snacks', run: () => { UI.hideDialog(); RW.shopNow = RW.PET_SHOP; UI.open('shopPanel'); } }];
  if (pets().length) acts.push({ label: pets().length > 1 ? 'My pets' : 'Rename pet', run: () => { UI.hideDialog(); panelMode = 'main'; UI.open('petPanel'); } });
  acts.push(...qAct, { label: 'Goodbye', soft: true, run: bye });
  UI.say(lines, acts);
  return true;
}

// ---------- pictures for the pet window ----------
const shotCache = new Map();
let sScene = null, sCam = null, sRT = null;
const SHOT = 160;
function shot(key, build) {
  if (shotCache.has(key)) return shotCache.get(key);
  let url = '';
  try {
    if (!sScene) {
      sScene = new THREE.Scene(); sScene.add(new THREE.HemisphereLight(0xfff3dc, 0xb3a184, 0.85));
      const sun = new THREE.DirectionalLight(0xfff0d4, 0.55); sun.position.copy(RW.SUN_DIR).multiplyScalar(100); sScene.add(sun);
      sCam = new THREE.PerspectiveCamera(26, 1, 0.05, 50); sRT = new THREE.WebGLRenderTarget(SHOT * 2, SHOT * 2);
    }
    const root = build(); root.rotation.y = -0.45; sScene.add(root); root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root), c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
    const dist = Math.max(sz.x, sz.y, sz.z) * 2.5 + 0.5;
    sCam.position.set(c.x + dist * 0.25, c.y + dist * 0.18, c.z + dist); sCam.lookAt(c); sCam.updateProjectionMatrix();
    const prevC = new THREE.Color(); renderer.getClearColor(prevC); const prevA = renderer.getClearAlpha();
    renderer.setClearColor(0x000000, 0); renderer.setRenderTarget(sRT); renderer.clear(); renderer.render(sScene, sCam);
    const N = SHOT * 2, buf = new Uint8Array(N * N * 4); renderer.readRenderTargetPixels(sRT, 0, 0, N, N, buf);
    renderer.setRenderTarget(null); renderer.setClearColor(prevC, prevA);
    sScene.remove(root);
    const big = document.createElement('canvas'); big.width = big.height = N;
    const g = big.getContext('2d'), img = g.createImageData(N, N);
    for (let y = 0; y < N; y++) img.data.set(buf.subarray((N - 1 - y) * N * 4, (N - y) * N * 4), y * N * 4);
    g.putImageData(img, 0, 0);
    const out = document.createElement('canvas'); out.width = out.height = SHOT;
    const o = out.getContext('2d'); o.imageSmoothingQuality = 'high'; o.drawImage(big, 0, 0, SHOT, SHOT);
    url = out.toDataURL('image/png');
  } catch (e) { url = ''; }
  shotCache.set(key, url);
  return url;
}
const petShot = (sp, stage, face) => shot(sp + stage + face, () => { const m = RW.petModel(sp, stage); RW.setPetMood(m, face); return m.root; });
const eggShot = (kind) => shot('egg' + kind, () => RW.eggModel(kind).root);

// ---------- the pet window ----------
function bar(cls, label, v, max, txt) {
  const pct = clamp(v / max * 100, 0, 100);
  return '<div class="need ' + cls + (cls !== 'hpn' && cls !== 'expn' && v < LOW_AT ? ' low' : '') + '" data-need="' + cls + '"><span>' + label + '</span><div class="bar"><i style="width:' + pct.toFixed(1) + '%"></i></div><span class="nv">' + (txt != null ? txt : Math.round(v)) + '</span></div>';
}
function render() {
  if (!P) return;
  const body = $('petBody'), pet = active();
  if (panelMode === 'pick') return renderPick(body);
  if (panelMode === 'name' || panelMode === 'rename') return renderName(body);
  $('petTitle').textContent = pet ? esc(pet.name) : 'My pet';
  let h = '';
  if (pet) {
    const st = petStats(pet), md = cur && cur.state === 'rest' ? 'rest' : cur && cur.state === 'sleep' ? 'sleep' : mood(pet), S = PETS[pet.sp];
    const face = md === 'happy' ? 'happy' : md === 'sad' ? 'sad' : md === 'rest' || md === 'sleep' ? 'sleep' : 'normal';
    h += '<div class="pet-top"><div class="pet-port"><img src="' + petShot(pet.sp, pet.stage, face) + '" alt=""></div><div class="pet-info">' +
      '<div class="pet-name">' + esc(pet.name) + '</div>' +
      '<div class="pet-sub">' + (isAdult(pet) ? 'Adult ' : isTeen(pet) ? 'Teen ' : 'Baby ') + S.name + ' · Pet Lv. ' + pet.lv + ' · ' + PET_TRAITS[pet.trait].name + '</div>' + '<div class="pet-sub"><b>' + (RW.PET_ROLES ? RW.PET_ROLES[roleOf(pet)][1] + ' ' + RW.PET_ROLES[roleOf(pet)][0] : '') + '</b> · ' + ({ attacker: 'hits monsters', ranger: 'big damage from far away', tank: 'takes hits for you, you take less damage', healer: 'heals you', lucky: 'more coins' })[roleOf(pet)] + '</div>' +
      '<span class="pet-mood ' + md + '" id="petMood">' + MOOD_INFO[md][1] + ' ' + MOOD_INFO[md][0] + '</span>' +
      bar('hpn', 'HP', Math.max(0, pet.hp), st.maxHp, Math.round(Math.max(0, pet.hp)) + '/' + st.maxHp) +
      bar('expn', 'EXP', pet.lv >= 50 ? 1 : pet.exp, pet.lv >= 50 ? 1 : expNeed(pet.lv), pet.lv >= 50 ? 'MAX' : Math.floor(pet.exp / expNeed(pet.lv) * 100) + '%') +
      '</div></div>';
    h += bar('food', 'Food', pet.food, 100) + bar('fun', 'Fun', pet.fun, 100) + bar('clean', 'Clean', pet.clean, 100);
    h += '<p class="note">' + esc(S.about) + ' ' + esc(PET_TRAITS[pet.trait].desc) + (md === 'sad' ? ' <b>Too sad to fight right now!</b>' : md === 'happy' ? ' Happy pets hit harder.' : '') + (pet.stage === 'baby' ? ' Grows into a teen at Pet Lv. ' + PET_TEEN_LV + '.' : !isAdult(pet) ? ' Becomes an adult at Pet Lv. ' + ADULT_LV + ' (a well cared-for pet becomes a bright adult, a wild one a fiery adult).' : '') + '</p>';
    h += '<div class="pet-acts"><button class="btn small" data-pa="play">Play</button><button class="btn small" data-pa="bathe">Bathe</button></div>';
    const foods = P.bag.filter((e) => ITEMS[e[0]] && ITEMS[e[0]].food);
    h += '<h3 class="pet-h">Feed</h3>';
    h += foods.length ? '<div class="pet-foods">' + foods.map(([id, n]) => '<button data-feed="' + id + '" title="' + esc(ITEMS[id].name) + ': food +' + ITEMS[id].food + '"><img src="' + RW.iconURL(id) + '" alt="">' + esc(ITEMS[id].name) + ' ×' + n + '</button>').join('') + '</div>'
      : '<p class="note">No pet food in your bag. Pip sells snacks, and Leaflets drop jelly and sprouts pets like.</p>';
    h += '<h3 class="pet-h">Skills</h3>';
    for (const s of skillsOf(pet)) h += '<div class="pet-skill' + (s.open ? '' : ' locked') + '"><b>' + esc(s.name) + '</b><span class="tagx">' + (s.open ? 'Uses it by itself' : s === skillsOf(pet)[2] || PETS[pet.sp].skills.indexOf(PETS[pet.sp].skills.find((x) => x.id === s.id)) === 2 ? 'Unlocks as an adult (Pet Lv. ' + ADULT_LV + ')' : 'Unlocks as a teen') + '</span><small>' + esc(s.desc) + '</small></div>';
  } else if (!P.egg) {
    h += '<p class="note">You have no pet yet. Visit <b>Pip</b> at the Pet Den in Mossbrook for a mystery egg!</p>';
  }
  if (P.egg) {
    const k = P.egg.kind, pct = Math.min(100, P.egg.t / PET_HATCH * 100);
    h += '<h3 class="pet-h">Egg</h3><div class="pet-top"><div class="pet-port" style="width:84px;height:84px"><img src="' + eggShot(k) + '" alt=""></div><div class="pet-info"><div class="pet-name" style="font-size:16px">' + esc(PET_EGGS[k].name) + '</div><div class="pet-sub">' + esc(PET_EGGS[k].hint) + '</div>' + bar('expn', 'Hatch', pct, 100, Math.floor(pct) + '%') + '<span class="pet-sub">' + (pct > 80 ? 'It is wiggling! Almost there!' : 'Keep adventuring and it will hatch.') + '</span></div></div>';
  }
  if (pets().length > 1 || (pet && atPip())) {
    const here = atPip();
    h += '<h3 class="pet-h">' + (here ? 'Your pets (choose who comes along)' : 'Your pets') + '</h3><div class="pet-list">' + pets().map((o) => '<button class="pet-chip" data-swap="' + o.id + '" aria-pressed="' + (o.id === P.petOn) + '"' + (here ? '' : ' disabled') + '><img src="' + petShot(o.sp, o.stage, 'normal') + '" alt="">' + esc(o.name) + ' · Lv. ' + o.lv + '</button>').join('') + '</div>';
    h += here ? '<div class="pet-acts"><button class="btn small soft" data-pa="rename">Rename ' + (pet ? esc(pet.name) : '') + '</button></div>' : '<p class="note">The others stay with Pip. Talk to Pip to swap pets or rename them.</p>';
  }
  body.innerHTML = h;
  body.querySelectorAll('[data-pa]').forEach((b) => b.addEventListener('click', () => {
    const a = b.dataset.pa;
    if (a === 'play') play(); else if (a === 'bathe') bathe();
    else if (a === 'rename') { sfx.click(); panelMode = 'rename'; panelPet = P.petOn; render(); }
  }));
  body.querySelectorAll('[data-feed]').forEach((b) => b.addEventListener('click', () => feed(b.dataset.feed)));
  body.querySelectorAll('[data-swap]').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.swap === P.petOn) return;
    P.petOn = b.dataset.swap; spawnPet(); sfx.select(); G.dirty = true; G.save();
    if (cur) { setMood('happy', 2); react('play'); UI.toast(esc(cur.pet.name) + ' comes along now!'); }
    render();
  }));
}
function refreshBars() {
  const pet = active(), body = $('petBody'); if (!pet || !body) return;
  const st = petStats(pet);
  const set = (cls, v, max, txt) => { const el = body.querySelector('[data-need="' + cls + '"]'); if (!el) return; el.querySelector('i').style.width = clamp(v / max * 100, 0, 100).toFixed(1) + '%'; el.querySelector('.nv').textContent = txt != null ? txt : String(Math.round(v)); el.classList.toggle('low', cls !== 'hpn' && cls !== 'expn' && v < LOW_AT); };
  set('hpn', Math.max(0, pet.hp), st.maxHp, Math.round(Math.max(0, pet.hp)) + '/' + st.maxHp);
  set('food', pet.food, 100); set('fun', pet.fun, 100); set('clean', pet.clean, 100);
  const mEl = $('petMood'); if (mEl) { const md = cur && cur.state === 'rest' ? 'rest' : cur && cur.state === 'sleep' ? 'sleep' : mood(pet); const t = MOOD_INFO[md][1] + ' ' + MOOD_INFO[md][0]; if (mEl.textContent !== t) { mEl.textContent = t; mEl.className = 'pet-mood ' + md; } }
}
function renderPick(body) {
  $('petTitle').textContent = 'Pick a mystery egg';
  let h = '<p class="note">Pip holds out three warm eggs. Each one hides a different kind of pet. Which one feels right?</p><div class="egg-pick">';
  for (const k of ['warm', 'sky', 'leaf']) h += '<button data-egg="' + k + '" aria-pressed="' + (pickedEgg === k) + '"' + (pickedEgg === k ? ' style="box-shadow:0 0 0 3px var(--gold)"' : '') + '><img src="' + eggShot(k) + '" alt="">' + esc(PET_EGGS[k].name) + '<small>' + esc(PET_EGGS[k].hint) + '</small></button>';
  h += '</div><div class="pet-acts"><button class="btn" data-take' + (pickedEgg ? '' : ' disabled') + '>Take this egg</button><button class="btn soft" data-cancel>Not yet</button></div>';
  body.innerHTML = h;
  body.querySelectorAll('[data-egg]').forEach((b) => b.addEventListener('click', () => { pickedEgg = b.dataset.egg; sfx.select(); renderPick(body); }));
  body.querySelector('[data-cancel]').addEventListener('click', () => { panelMode = 'main'; UI.close('petPanel'); });
  body.querySelector('[data-take]').addEventListener('click', () => {
    if (!pickedEgg) return;
    takeEgg(pickedEgg); panelMode = 'main'; UI.close('petPanel');
    UI.say([PIP('happy', 'The ' + PET_EGGS[pickedEgg].name + '! Great choice!'), PIP('normal', 'It will follow you around. After a few minutes of adventuring, it hatches. Press P to check on it.'), PIP('happy', 'Come back to me for pet snacks!')], [{ label: 'Thanks, Pip!', run: bye }]);
  });
}
function renderName(body) {
  const pet = byId(panelPet) || active(); if (!pet) { panelMode = 'main'; return render(); }
  const fresh = panelMode === 'name';
  $('petTitle').textContent = fresh ? 'It hatched!' : 'Rename your pet';
  let h = '<div class="pet-top"><div class="pet-port"><img src="' + petShot(pet.sp, pet.stage, 'happy') + '" alt=""></div><div class="pet-info">';
  h += fresh ? '<div class="pet-name">A baby ' + PETS[pet.sp].name + '!</div><div class="pet-sub">' + esc(PETS[pet.sp].about) + '</div><div class="pet-sub">Personality: <b>' + PET_TRAITS[pet.trait].name + '</b> · ' + esc(PET_TRAITS[pet.trait].desc) + '</div>' + (P.petOn !== pet.id ? '<div class="pet-sub">It will stay with Pip until you swap pets.</div>' : '')
    : '<div class="pet-name">' + esc(pet.name) + '</div><div class="pet-sub">Pick a new name.</div>';
  h += '</div></div><label class="c-lbl" for="petName">Name</label><div class="pet-namebox"><input id="petName" type="text" maxlength="12" autocomplete="off" spellcheck="false" value="' + esc(pet.named || !fresh ? pet.name : '') + '" placeholder="' + esc(PETS[pet.sp].name) + '"><button class="btn" data-ok>' + (fresh ? 'That is the name!' : 'Save') + '</button></div>';
  h += '<div class="pet-acts">' + (fresh ? '<button class="btn small soft" data-rand>Random name</button>' : '<button class="btn small soft" data-back>Back</button>') + '</div>';
  body.innerHTML = h;
  const inp = $('petName');
  setTimeout(() => { try { inp.focus(); } catch (e) { /* fine */ } }, 50);
  const done = () => {
    const v = inp.value.replace(/[<>]/g, '').trim().slice(0, 12);
    pet.name = v || PETS[pet.sp].name; pet.named = true; G.dirty = true; G.save();
    if (cur && cur.pet === pet) cur.last.name = '';
    sfx.questDone && fresh ? sfx.questDone() : sfx.point();
    if (fresh) UI.toast('Say hi to <b>' + esc(pet.name) + '</b>!', true);
    panelMode = 'main'; render();
  };
  body.querySelector('[data-ok]').addEventListener('click', done);
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') done(); e.stopPropagation(); });
  const rb = body.querySelector('[data-rand]'); if (rb) rb.addEventListener('click', () => { const N = ['Mochi', 'Pip-Pip', 'Bean', 'Sprinkle', 'Nugget', 'Puffin', 'Tofu', 'Bubbles', 'Pebble', 'Clover', 'Biscuit', 'Juniper', 'Waffle', 'Sunny']; inp.value = N[Math.floor(Math.random() * N.length)]; sfx.click(); });
  const bb = body.querySelector('[data-back]'); if (bb) bb.addEventListener('click', () => { panelMode = 'main'; sfx.click(); render(); });
}
function syncBadge() {
  const b = $('petBadge'); if (!b) return;
  const pet = active(), on = !!(P && pet && wants(pet));
  if (b.hidden === on) b.hidden = !on;
}
$('petBtn').addEventListener('click', () => { if (G.mode !== 'play') return; sfx.click(); UI.toggle('petPanel'); });
// closing the window mid-naming keeps the default name; reopening goes back to the main view
new MutationObserver(() => { if ($('petPanel').hidden && (panelMode === 'name' || panelMode === 'rename' || panelMode === 'pick')) { const pet = byId(panelPet); if (panelMode === 'name' && pet) pet.named = true; panelMode = 'main'; } }).observe($('petPanel'), { attributes: true, attributeFilter: ['hidden'] });

RW.pets = { update, labels: () => { if (cur) placeTag(); }, intercept, drops, coinMult, luckT, talk, render, feed, play, bathe, carryEgg, active, mood, get cur() { return cur; }, debugHatch() { if (P && P.egg) P.egg.t = PET_HATCH; }, debugExp(n) { const p = active(); if (p) petGainExp(p, n); } };
})();
