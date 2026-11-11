// Russel World: delivery 8. Waystones (fast travel), the tricks of the new monsters (tongue frogs,
// coin-stealing squirrels, bushes that are not bushes), the Old Rootling boss and its daily big chest.
(function () {
'use strict';
const RW = window.RW;
if (!RW || RW.failed || !RW.G || !RW.world) return;
const { THREE, scene, rnd, ITEMS } = RW;
const W = RW.world, G = RW.G, UI = RW.UI, sfx = RW.audio.sfx, esc = G.esc;
const $ = (id) => document.getElementById(id);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const todayKey = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
const say = (t, f) => { if (RW.story && RW.story.say) RW.story.say(t, f || 'happy', true); };
let P = null;

// ---------- waystones ----------
const WAY_COST = 15;
const stones = [];
function makeStones() {
  for (const s of stones) G.removeSpot(s.spot.id);
  stones.length = 0;
  if (!P.waystones || typeof P.waystones !== 'object') P.waystones = {};
  for (const w of W.WAYSTONES) {
    const m = RW.waystone();
    m.root.rotation.y = (w.x * 0.37 + w.z * 0.11) % 6.28;
    const st = { w, m, on: !!P.waystones[w.id], spot: null };
    m.setOn(st.on);
    st.spot = G.addSpot({ id: 'way_' + w.id, x: w.x, z: w.z, label: 'Waystone', model: m.root, range: 2.8, y: 2.4, tagY: 3.6, far: 24, onUse: () => useStone(st) });
    stones.push(st);
  }
}
function wake(st) {
  if (st.on) return;
  st.on = true; P.waystones[st.w.id] = Date.now(); st.m.setOn(true);
  sfx.appear(); G.spawnRing(V3(st.w.x, W.height(st.w.x, st.w.z), st.w.z), 0x9fe0ff, 3.2, 0.9);
  const n = stones.filter((s) => s.on).length;
  UI.toast('<b>Waystone awakened: ' + esc(st.w.name) + '!</b> Touch any awake waystone to travel (' + WAY_COST + ' coins).', true);
  if (n === 1) setTimeout(() => say('Ooh, a waystone! It hums when you touch it. Wake more of them, then we can hop between them in a blink!'), 1400);
  RW.emit('waystone', st.w.id, n);
  G.save();
}
let wayFrom = null;
function useStone(st) {
  if (!st.on) wake(st);
  wayFrom = st; UI.open('wayPanel');
}
function arrival(w) {
  for (const [dx, dz] of [[0, 3.8], [3.8, 0], [-3.8, 0], [0, -3.8], [2.7, 2.7], [-2.7, 2.7], [0, 2.6]]) if (W.walkable(w.x + dx, w.z + dz)) return [w.x + dx, w.z + dz, Math.atan2(dx, dz)];
  return [w.x, w.z + 2.8, 0];
}
function renderWay() {
  if (!P) return;
  const list = stones.filter((s) => s.on && s !== wayFrom);
  let html = '<p class="way-lead">Pick an awake waystone to travel there. Each trip costs <b>' + WAY_COST + ' coins</b>.</p><div class="way-list">';
  for (const s of stones) {
    if (s === wayFrom) continue;
    const A = RW.AREAS[s.w.map];
    html += '<div class="way-row' + (s.on ? '' : ' off') + '"><div><b>' + esc(s.on ? s.w.name : '???') + '</b><small>' + esc(s.on ? (A ? A.lv : 'Mossbrook') : 'Not awake yet. Find it and touch it.') + '</small></div>' +
      (s.on ? '<button class="btn small" data-w="' + s.w.id + '"' + (P.coins < WAY_COST ? ' disabled' : '') + '>Go</button>' : '') + '</div>';
  }
  html += '</div>';
  if (!list.length) html += '<p class="qempty">No other waystone is awake yet. Every area has one. Touch it once to wake it.</p>';
  $('wayBody').innerHTML = html;
  $('wayBody').querySelectorAll('[data-w]').forEach((b) => b.addEventListener('click', () => go(b.dataset.w)));
}
function go(id) {
  const st = stones.find((s) => s.w.id === id);
  if (!st || !st.on || !P) return;
  if (P.coins < WAY_COST) { G.deny('Not enough coins.'); return; }
  if (G.player.dead) return;
  G.addCoins(-WAY_COST); UI.close('wayPanel');
  const [x, z, f] = arrival(st.w);
  sfx.appear(); G.spawnRing(G.player.pos, 0x9fe0ff, 2.6, 0.6);
  G.travel(st.w.map, x, z, f, 'waystone');
}

// ---------- the new monsters' tricks ----------
// called from the monster loop in game.js; returns null to let the normal chase-and-hit run
function ai(m, dt, d) {
  const k = m.k;
  if (k.disguise) return bushAi(m, dt);
  if (k.steal && m.flee > 0) {
    m.flee -= dt;
    const px = G.player.pos.x, pz = G.player.pos.z, dx = m.pos.x - px, dz = m.pos.z - pz, l = Math.hypot(dx, dz) || 1;
    m.atk = null;
    if (Math.random() < dt * 3) G.spawnPuff(V3(m.pos.x, m.pos.y + 0.1, m.pos.z));
    return { tx: m.pos.x + (dx / l) * 4 + rnd(-1, 1), tz: m.pos.z + (dz / l) * 4 + rnd(-1, 1), sp: k.chase * 1.25 };
  }
  if (k.boss && k.ai) return k.ai(m, dt, d); // v1.4: the Chapter 2/3 bosses bring their own brains (adventure.js)
  if (k.boss) return k.area === 'cave' ? (RW.cave ? RW.cave.ai(m, dt) : null) : bossAi(m, dt, d);
  return null;
}
// a Bushling sits still as an ordinary bush until you walk close (or hit it); after a calm while it goes back to sleep
function bushAi(m, dt) {
  if (!m.awake) {
    if (m.aggro) { wakeBush(m); return null; }
    if (!m.hide) { m.hide = true; m.p.disguise(true); m.tag.style.display = 'none'; }
    m.atk = null;
    return {};
  }
  if (!m.aggro) { m.calm = (m.calm || 0) + dt; if (m.calm > 6 && Math.hypot(m.pos.x - m.home.x, m.pos.z - m.home.z) < 2) { m.awake = false; return {}; } }
  else m.calm = 0;
  return null;
}
let sawBush = false;
function wakeBush(m) {
  m.awake = true; m.hide = false; m.calm = 0; m.p.disguise(false); m.show = 4; m.atkCd = 0.8;
  for (let i = 0; i < 8; i++) G.spawnPuff(V3(m.pos.x + rnd(-0.6, 0.6), m.pos.y + rnd(0.3, 1.1), m.pos.z + rnd(-0.6, 0.6)), [0x4e8a3a, 0x6fae4a, 0xd9304a][i % 3], true);
  G.floatText('<small>SURPRISE!</small>', 'miss', V3(m.pos.x, m.pos.y + 1.9 * m.scale, m.pos.z), 1.2);
  sfx.spore();
  if (!sawBush && P && !P.story.sawBush) { sawBush = true; P.story.sawBush = true; say('EEK! That bush has EYES! Some bushes here are Bushlings in disguise. Look carefully before you walk past!', 'surprised'); }
}
// when a monster's hit lands on the hero
function struck(m) {
  if (!m.k.steal || m.stolen || !P || P.coins <= 0) return;
  const n = Math.min(P.coins, Math.max(5, Math.round(P.coins * 0.05)), 40 + m.lv * 6);
  G.addCoins(-n); m.stolen = n; m.flee = 4.5; m.atk = null; m.show = 6;
  G.floatText('<small>STOLEN</small>-' + n, 'hurt', V3(G.player.pos.x, G.player.pos.y + 2.0, G.player.pos.z), 1.2);
  sfx.coin(); UI.toast('A Nutsnatcher grabbed <b>' + n + ' coins</b> and ran! Catch it to get them back.');
  if (!P.story.sawThief) { P.story.sawThief = true; setTimeout(() => say('Hey! Give those back, you little thief! Quick, catch it! Squirrels always drop what they stole, and then some.', 'angry'), 700); }
}
// little extra animations for parts the shared code does not know
function anim(m, dt, moving, lunge) {
  const p = m.p;
  if (p.tongue) {
    // the frog's tongue shoots out during its strike, as long as the gap to the hero
    const d = Math.hypot(G.player.pos.x - m.pos.x, G.player.pos.z - m.pos.z);
    const L = m.alive && m.aggro && lunge > 0.05 ? Math.max(0.05, (d / m.scale - 0.9) * lunge) : 0;
    p.tongue.visible = L > 0; if (L > 0) { p.tongue.scale.y = L; p.tongue.position.z = 0.6 + L / 2 - lunge * 0.45; }
  }
  if (p.wings) p.wings.forEach((w, i) => { w.rotation.z = Math.sin(m.t * (p.flap || 42) + i * Math.PI) * 0.55 * (i ? -1 : 1); });
  if (p.tail) { p.tail.rotation.x = Math.sin(m.t * (moving ? 9 : 2.6)) * (moving ? 0.25 : 0.12); p.tail.rotation.z = Math.sin(m.t * 1.7) * 0.1; }
  if (p.pouch) { const s = m.stolen ? 1.7 + Math.sin(m.t * 8) * 0.08 : 1; p.pouch.scale.set(0.9 * s, s, 0.8 * s); }
  if (m.k.disguise && !m.awake) { m.body.rotation.z = Math.sin(m.t * 0.9) * 0.015; m.body.position.y = 0; m.body.position.z = 0; }
  if (m.k.boss && m.k.anim) m.k.anim(m, dt);
  else if (m.k.boss) { if (m.k.area === 'cave') { if (RW.cave) RW.cave.anim(m, dt); } else bossAnim(m, dt); }
}

// ---------- the Old Rootling ----------
const R = W.BOSS_ROOM;
const spikes = [];
let boss = null;
const inRoom = (pad) => W.active === 'burrow' && Math.hypot(G.player.pos.x - R.x, G.player.pos.z - R.z) < R.r + (pad || 0);
function bossAi(m, dt) {
  boss = m;
  const B = m.bs || (m.bs = { awake: false, t: 2.5, phase2: false, s50: false, s25: false, cast: 0 });
  if (!B.awake) {
    if (inRoom(-3) && !G.player.dead && !G.traveling) { wakeBoss(m); return null; }
    m.aggro = false; m.atk = null;
    if (m.hp < m.st.hp) m.hp = m.st.hp;
    const hd = Math.hypot(m.pos.x - m.home.x, m.pos.z - m.home.z);
    return hd > 1 ? { tx: m.home.x, tz: m.home.z, sp: 1.2 } : {};
  }
  if (G.player.dead || !inRoom(4)) { sleepBoss(m); return {}; }
  m.kb = null; m.aggro = true;
  const f = m.hp / m.st.hp;
  if (!B.phase2 && f < 0.5) { B.phase2 = true; B.t = Math.min(B.t, 1); G.floatText('<small>GRUMPY!</small>', 'crit', V3(m.pos.x, m.pos.y + 3.6, m.pos.z), 1.4); sfx.charge(); UI.banner('Old Rootling is angry!', 'More roots, faster. Keep moving!'); }
  if (!B.s50 && f < 0.5) { B.s50 = true; summon(m, 2); }
  if (!B.s25 && f < 0.25) { B.s25 = true; summon(m, 3); }
  B.t -= dt;
  if (B.t <= 0) { B.t = B.phase2 ? rnd(3.6, 4.4) : rnd(5.4, 6.4); castRoots(m, B.phase2); B.cast = 0.8; }
  return null;
}
function wakeBoss(m) {
  const B = m.bs; B.awake = true; B.t = 2.2; m.aggro = true; m.atkCd = 1.6; m.show = 99;
  UI.banner('Old Rootling', 'The grumpy grandpa of the burrow wakes up!');
  RW.audio.play('boss'); sfx.charge();
  for (let i = 0; i < 10; i++) G.spawnPuff(V3(m.pos.x + rnd(-1.5, 1.5), m.pos.y + rnd(0.2, 2.5), m.pos.z + rnd(-1.5, 1.5)), 0x8a6a4a, true);
  showBar(m);
  if (P && !P.story.sawBoss) { P.story.sawBoss = true; setTimeout(() => say('WHOA, it is HUGE! Watch the ground: when a red circle shows up, get out of it fast. Roots come up right there!', 'surprised'), 1200); }
  RW.emit('boss', 'wake', m);
}
function sleepBoss(m) {
  const B = m.bs; if (!B) return;
  m.bs = null; m.aggro = false; m.atk = null; m.hp = m.st.hp; m.show = 0;
  hideBar(); clearSpikes();
  if (m.p.eyes) m.p.eyes.material.opacity = 0;
  if (W.active === 'burrow') RW.audio.play('burrow');
}
function summon(m, n) {
  for (let i = 0; i < n; i++) {
    const a = rnd(0, Math.PI * 2), r = rnd(3, 6);
    let x = m.pos.x + Math.cos(a) * r, z = m.pos.z + Math.sin(a) * r;
    if (!W.walkable(x, z, true)) { x = R.x + rnd(-5, 5); z = R.z + rnd(-5, 5); }
    const mm = G.spawnMonster('rootling', 7, x, z);
    mm.quest = 'boss'; mm.aggro = true; mm.atkCd = rnd(1, 2); mm.show = 6;
    G.spawnRing(mm.pos, 0xc9a06a, 1.6, 0.5);
    for (let k = 0; k < 4; k++) G.spawnPuff(V3(x + rnd(-0.4, 0.4), mm.pos.y + 0.2, z + rnd(-0.4, 0.4)), 0x8a6a4a, true);
  }
  UI.toast('The Old Rootling calls its little Rootlings for help!');
  sfx.spore();
}
// red circles on the ground; after a moment roots burst up out of them
function castRoots(m, angry) {
  const px = G.player.pos.x, pz = G.player.pos.z;
  const spots = [[px, pz]];
  const extra = angry ? 4 : 2;
  for (let i = 0; i < extra; i++) { const a = rnd(0, Math.PI * 2), r = rnd(2.2, 4.5); spots.push([px + Math.cos(a) * r, pz + Math.sin(a) * r]); }
  if (angry) for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + rnd(-0.3, 0.3); spots.push([m.pos.x + Math.cos(a) * 3.2, m.pos.z + Math.sin(a) * 3.2]); }
  for (const [x, z] of spots) {
    if (Math.hypot(x - R.x, z - R.z) > R.r - 1) continue;
    const s = RW.rootSpike();
    s.root.position.set(x, W.height(x, z), z); s.spikes.scale.set(1, 0.01, 1); s.spikes.visible = false; s.fill.scale.setScalar(0.05);
    scene.add(s.root);
    spikes.push({ s, x, z, t: 0, hit: false, dmg: rnd(m.st.dmg[0], m.st.dmg[1]) * 1.25 });
  }
  sfx.crack();
}
const WARN = 1.2;
function updateSpikes(dt) {
  for (let i = spikes.length - 1; i >= 0; i--) {
    const sp = spikes[i], s = sp.s; sp.t += dt;
    if (sp.t < WARN) {
      const u = sp.t / WARN;
      s.fill.scale.setScalar(0.05 + u * 0.95); s.fill.material.opacity = 0.18 + u * 0.22;
      s.ring.material.opacity = 0.5 + Math.sin(sp.t * 18) * 0.3;
    } else {
      if (!s.spikes.visible) {
        s.spikes.visible = true; s.ring.material.opacity = 0; s.fill.material.opacity = 0.0;
        for (let k = 0; k < 4; k++) G.spawnPuff(V3(sp.x + rnd(-0.5, 0.5), s.root.position.y + 0.2, sp.z + rnd(-0.5, 0.5)), 0x8a6a4a, true);
        sfx.tip();
      }
      const u = sp.t - WARN;
      s.spikes.scale.y = u < 0.12 ? Math.max(0.01, u / 0.12) : u < 0.8 ? 1 : Math.max(0.01, 1 - (u - 0.8) / 0.4);
      if (!sp.hit && u < 0.3 && !G.player.dead && Math.hypot(G.player.pos.x - sp.x, G.player.pos.z - sp.z) < 1.05) {
        sp.hit = true; G.hurtPlayer(sp.dmg, true);
        G.spawnSpark(V3(G.player.pos.x, G.player.pos.y + 1, G.player.pos.z), true);
      }
      if (u > 1.2) { scene.remove(s.root); spikes.splice(i, 1); }
    }
  }
}
function clearSpikes() { for (const sp of spikes) scene.remove(sp.s.root); spikes.length = 0; }
function bossAnim(m, dt) {
  const B = m.bs, p = m.p;
  if (p.eyes) p.eyes.material.opacity += ((B && B.awake ? 0.85 : 0) - p.eyes.material.opacity) * Math.min(1, dt * 3);
  if (B && B.cast > 0) B.cast = Math.max(0, B.cast - dt);
  const raise = B && B.cast > 0 ? Math.sin((1 - B.cast / 0.8) * Math.PI) : 0;
  if (p.arms) p.arms.forEach((a, i) => { const s = i ? -1 : 1; a.rotation.z = s * (raise * 1.3 + Math.sin(m.t * 1.3 + i) * 0.06); a.rotation.x = -raise * 0.4; });
  if (raise > 0.6 && Math.random() < dt * 20) G.spawnPuff(V3(m.pos.x + rnd(-1, 1), m.pos.y + 0.1, m.pos.z + rnd(-1, 1)), 0x8a6a4a, true);
  if (B && B.awake) updateBar(m);
}
function showBar(m) { $('bossName').textContent = m.k.name + ' · Lv. ' + m.lv; $('bossBar').hidden = false; updateBar(m); }
function hideBar() { $('bossBar').hidden = true; }
function updateBar(m) { $('bossFill').style.width = Math.max(0, m.hp / m.st.hp * 100).toFixed(1) + '%'; }

// ---------- the daily big chest (appears when the Old Rootling is defeated) ----------
let daily = null;
const BOX_GEAR = ['frogcap', 'frogvest', 'frogboots', 'crabhelm', 'crabvest', 'crabboots', 'squirrelcap', 'squirrelvest', 'squirrelboots', 'rootring', 'pearlring', 'millpendant', 'beecap', 'beevest', 'beeboots'];
function makeDaily(x, z) {
  removeDaily();
  if (!W.walkable(x, z)) { x = R.x; z = R.z; }
  const c = RW.chestModel();
  c.root.scale.setScalar(1.45); c.root.rotation.y = Math.atan2(G.player.pos.x - x, G.player.pos.z - z);
  const spot = G.addSpot({ id: 'burrow_chest', x, z, label: 'Big chest', model: c.root, range: 2.8, y: 0.9, tagY: 2.2, far: 24, onUse: openDaily });
  daily = { c, spot, x, z, opening: 0, open: false };
  G.spawnRing(V3(x, W.height(x, z), z), 0xffd84d, 3.4, 1); sfx.golden();
}
function removeDaily() { if (daily) { G.removeSpot('burrow_chest'); daily = null; } }
function openDaily() {
  if (!daily || daily.open || !P) return;
  daily.open = true; daily.opening = 0.001; daily.spot.hidden = true;
  P.burrowDay = todayKey();
  sfx.chest();
  const coins = 260 + Math.round(rnd(0, 80));
  G.addCoins(coins);
  const lines = ['+' + coins + ' coins'];
  // one piece of gear, never below Rare
  if (RW.gear) {
    const r = Math.random() < 0.04 ? 4 : Math.random() < 0.25 ? 3 : 2;
    const id = BOX_GEAR[Math.floor(Math.random() * BOX_GEAR.length)];
    RW.gear.giveGear(id, r);
    const RR = RW.gear.RAR[r];
    lines.push('<b style="color:' + RR.ink + '">' + RR.name + ' ' + esc(RW.gear.GEAR[id].name) + '</b>');
  }
  const rare = ['river_pearl', 'crab_claw', 'bee_stinger'][Math.floor(Math.random() * 3)];
  for (const [id, n] of [['heartwood', 1], [rare, 1], ['root_knot', 3], ['red_m', 2]]) { G.bagAdd(id, n); lines.push(n + ' × ' + esc(ITEMS[id].name)); }
  if (Math.random() < 0.2) { G.dropItem('wild_egg', 1, daily.spot.model.position, 1.6); lines.push('<b>a Wild Egg!</b>'); }
  UI.toast('<b>Big chest!</b> ' + lines.join(', '), true);
  setTimeout(() => { if (P) UI.toast('The big chest fills up again tomorrow. Come back for more!'); }, 2600);
  if (RW.story && RW.story.say) RW.story.say('A whole chest just for us! Grandpa Rootling was guarding the good stuff.', 'happy', true);
  if (UI.isOpen('bagPanel')) UI.renderBag();
  G.save();
}
function updateDaily(dt) {
  if (!daily || W.active !== 'burrow') return;
  if (daily.opening > 0 && daily.opening < 1) {
    daily.opening = Math.min(1, daily.opening + dt * 1.4);
    const k = 1 - Math.pow(1 - daily.opening, 3);
    daily.c.lid.rotation.x = -1.9 * k;
    daily.c.shine.material.opacity = Math.sin(daily.opening * Math.PI) * 0.95; daily.c.shine.scale.setScalar(2.6 + daily.opening * 3);
    if (daily.opening >= 1) setTimeout(() => { if (daily && daily.open) removeDaily(); }, 20000);
  } else if (!daily.open) { daily.c.shine.material.opacity = 0.35 + Math.sin(G.time * 3) * 0.25; daily.c.shine.scale.setScalar(2); }
}

// ---------- events ----------
RW.on('enter', (p) => {
  P = p; if (!P.story) P.story = {};
  sawBush = !!P.story.sawBush;
  makeStones(); removeDaily(); clearSpikes(); hideBar();
});
RW.on('leave', () => { for (const s of stones) G.removeSpot(s.spot.id); stones.length = 0; removeDaily(); clearSpikes(); hideBar(); P = null; boss = null; });
RW.on('hit', (m) => {
  // a squirrel with your coins tries to run again when hit
  if (m.k.steal && m.stolen && !(m.flee > 0) && Math.random() < 0.35) m.flee = 2.4;
});
RW.on('kill', (m) => {
  if (m.k.steal && m.stolen) {
    const n = Math.round(m.stolen * 1.5); m.stolen = 0; m.flee = 0;
    G.dropItem('coin', n, m.pos, 1.0);
    UI.toast('Caught it! Your coins are back, <b>plus a bonus</b> (' + n + ' coins).', true);
  }
  if (m.k.disguise) { m.awake = false; m.calm = 0; }
  if (m.k.boss && m.k.area === 'burrow') {
    const pos = m.pos.clone();
    m.bs = null; hideBar(); clearSpikes();
    RW.audio.play('burrow');
    UI.banner('Old Rootling defeated!', 'The burrow is calm again');
    for (const o of G.monsters) if (o.alive && o.quest === 'boss') { o.aggro = false; }
    if (P.burrowDay !== todayKey()) setTimeout(() => { if (P && W.active === 'burrow') { makeDaily(pos.x, pos.z + 2.5); UI.toast('A <b>big chest</b> popped out of the roots!', true); } }, 1600);
    else setTimeout(() => { if (P) UI.toast('You already opened today\'s big chest. It fills up again tomorrow.'); }, 1600);
    if (!P.story.bossDown) { P.story.bossDown = true; setTimeout(() => say('We did it! The Old Rootling is just a grumpy grandpa... I think he only wanted a nap. He will be back tomorrow, with a new chest!', 'happy'), 2600); }
  }
});
RW.on('map', (id) => {
  if (id !== 'burrow') { clearSpikes(); hideBar(); removeDaily(); if (boss) { boss.bs = null; boss = null; } }
  if (id === 'burrow' && P && !P.story.sawBurrow) { P.story.sawBurrow = true; setTimeout(() => say('It is so dark down here... and the walls are all roots! Something big is snoring at the end of this tunnel.', 'worried'), 1500); }
  if (id === 'river' && P && !P.story.sawRiver) { P.story.sawRiver = true; setTimeout(() => say('Riverside! Listen to the mill wheel go round. Careful, the frogs here can lick you from far away. Yuck!', 'happy'), 1500); }
  if (id === 'thorn' && P && !P.story.sawThorn) { P.story.sawThorn = true; setTimeout(() => say('Thornbush... everything here is prickly. Bring antidotes, the bees sting with poison!', 'worried'), 1500); }
});

function update(dt) {
  if (!P) return;
  // walking up to a sleeping waystone wakes it
  for (const st of stones) {
    if (st.on || st.w.map !== W.active) continue;
    if (Math.hypot(G.player.pos.x - st.w.x, G.player.pos.z - st.w.z) < 3) wake(st);
  }
  for (const st of stones) if (st.on && st.w.map === W.active) { st.m.crystal.rotation.y += dt * 1.2; st.m.crystal.position.y = 2.75 + Math.sin(G.time * 2 + st.w.x) * 0.08; }
  if (spikes.length) updateSpikes(dt);
  updateDaily(dt);
  if (UI.isOpen('wayPanel') && wayFrom && Math.hypot(G.player.pos.x - wayFrom.w.x, G.player.pos.z - wayFrom.w.z) > 6) UI.close('wayPanel');
  if (RW.cave) RW.cave.update(dt);
}
RW.river = { ai, struck, anim, update, renderWay, stones, get boss() { return boss; } };
})();
