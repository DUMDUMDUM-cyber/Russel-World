// Russel World: delivery 9. Pebble Cave: Bolt clears the doorway, three light puzzles (torches, buttons in order,
// a boulder on a plate) open the stone doors, and King Leaflet waits in the last hall. Beating him ends Chapter 1.
(function () {
'use strict';
const RW = window.RW;
if (!RW || RW.failed || !RW.G || !RW.world) return;
const { THREE, scene, rnd } = RW;
const W = RW.world, G = RW.G, UI = RW.UI, sfx = RW.audio.sfx;
const $ = (id) => document.getElementById(id);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const say = (t, f) => { if (RW.story && RW.story.say) RW.story.say(t, f || 'happy', true); };
const F = W.caveFx, PUZ = W.CAVE_PUZ, K = W.KING_ROOM;
let P = null;
const here = () => !!P && W.active === 'cave';
const near = (x, z, r) => Math.hypot(G.player.pos.x - x, G.player.pos.z - z) < r;

// ---------- saved state: which doors are open, where the boulder sits ----------
function state() { if (!P.cave || typeof P.cave !== 'object') P.cave = {}; return P.cave; }
function applyState() {
  const C = state();
  W.openCaveMouth(!!(P.story && P.story.caveOpen));
  W.setCaveDoor('torch', !!C.torch); W.setCaveDoor('buttons', !!C.buttons); W.setCaveDoor('boulder', !!C.boulder);
}
function openDoor(id, title, line) {
  const C = state(); if (C[id]) return;
  C[id] = true; W.setCaveDoor(id, true);
  sfx.chest(); setTimeout(() => sfx.crack(), 300);
  UI.banner(title, 'A stone door slides down into the floor');
  if (line) setTimeout(() => say(line, 'happy'), 1500);
  RW.emit('cavedoor', id);
  G.save();
}

// ---------- torch hall: light all four before the first one burns out ----------
const TORCH_TIME = 28;
let torchSpots = [], toldTorch = false;
function makeTorches() {
  clearTorches();
  const open = state().torch;
  F.torches.forEach((t, i) => {
    t.lit = open ? 1 : 0; t.fire.visible = open;
    if (open) return;
    torchSpots.push(G.addSpot({ id: 'torch' + i, x: t.x, z: t.z, label: 'Old torch', range: 2.6, y: 2.2, tagY: 3.4, far: 22, onUse: () => lightTorch(t) }));
  });
}
function clearTorches() { for (const s of torchSpots) G.removeSpot(s.id); torchSpots = []; }
function lightTorch(t) {
  if (state().torch) return;
  const fresh = t.lit <= 0;
  t.lit = 1; t.fire.visible = true; sfx.appear();
  G.spawnSpark(V3(t.x, W.height(t.x, t.z) + 2.6, t.z), true, 0xffb03a);
  const n = F.torches.filter((x) => x.lit > 0).length;
  if (n === 4) { clearTorches(); openDoor('torch', 'The torch hall is bright!', 'All four torches! Look, the door is sinking into the floor. Hoo, that was fun.'); return; }
  if (fresh) UI.toast('Torch lit (' + n + '/4). Light them all before the first one burns out!');
  if (!toldTorch && !P.story.toldTorch) { toldTorch = true; P.story.toldTorch = true; say('Ooh, old torches. I bet the door opens when all four are burning. Quick, they will not burn for long!', 'surprised'); }
}
function updateTorches(dt) {
  if (state().torch) return;
  for (const t of F.torches) {
    if (t.lit <= 0) continue;
    t.lit -= dt / TORCH_TIME;
    t.gl.material.opacity = 0.25 + Math.min(1, t.lit * 2) * 0.45;
    if (t.lit <= 0) { t.lit = 0; t.fire.visible = false; G.spawnPuff(V3(t.x, W.height(t.x, t.z) + 2.5, t.z), 0x777777, true); UI.toast('A torch went out. Light all four together!'); }
  }
}

// ---------- button hall: step on the three buttons in the order the tablet shows ----------
const SYM = { leaf: 'Leaf', shroom: 'Mushroom', pebble: 'Pebble' };
let order = [], step = 0, tabletSpot = null, readTablet = false;
function newOrder() {
  order = ['leaf', 'shroom', 'pebble'].sort(() => Math.random() - 0.5);
  step = 0;
  paintTablet();
}
function paintTablet() {
  if (!F.tablet) return;
  const c = document.createElement('canvas'); c.width = 256; c.height = 320; const g = c.getContext('2d');
  g.fillStyle = '#b8b0a2'; g.fillRect(0, 0, 256, 320);
  g.strokeStyle = '#7a7266'; g.lineWidth = 6; g.strokeRect(10, 10, 236, 300);
  g.fillStyle = '#4a4036'; g.font = 'bold 26px sans-serif'; g.textAlign = 'center'; g.fillText('STEP IN ORDER', 128, 48);
  order.forEach((s, i) => {
    const y = 104 + i * 76; g.fillStyle = '#4a4036'; g.font = 'bold 34px sans-serif'; g.fillText(String(i + 1), 52, y + 12);
    g.save(); g.translate(150, y); g.scale(0.7, 0.7); g.strokeStyle = '#4a4036'; g.lineWidth = 7; g.lineCap = 'round';
    if (s === 'leaf') { g.beginPath(); g.ellipse(0, 0, 22, 40, 0.5, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#b8b0a2'; g.beginPath(); g.moveTo(-14, 26); g.lineTo(14, -26); g.stroke(); }
    else if (s === 'shroom') { g.beginPath(); g.arc(0, 2, 36, Math.PI, 0); g.closePath(); g.fill(); g.fillRect(-11, 2, 22, 32); }
    else for (const [x, yy, r] of [[-16, 12, 18], [16, 14, 15], [0, -14, 17]]) { g.beginPath(); g.arc(x, yy, r, 0, Math.PI * 2); g.fill(); }
    g.restore();
  });
  const tex = new THREE.CanvasTexture(c);
  if (F.tablet.face.material.map) F.tablet.face.material.map.dispose();
  F.tablet.face.material.map = tex; F.tablet.face.material.needsUpdate = true;
}
function makeButtons() {
  if (tabletSpot) { G.removeSpot('cave_tablet'); tabletSpot = null; }
  const open = state().buttons;
  F.buttons.forEach((b) => setButton(b, open));
  if (open) return;
  newOrder();
  tabletSpot = G.addSpot({ id: 'cave_tablet', x: PUZ.tablet.x, z: PUZ.tablet.z + 0.1, label: 'Old tablet', range: 2.8, y: 1.4, tagY: 2.8, far: 22, onUse: () => {
    readTablet = true;
    UI.toast('The tablet says: step on <b>' + order.map((s) => SYM[s]).join('</b>, then <b>') + '</b>.', true);
  } });
}
function setButton(b, on) { b.on = on; b.cap.position.y = on ? 0.06 : 0.2; b.top.material.emissive.setHex(on ? 0x6a5a10 : 0x000000); }
function updateButtons() {
  if (state().buttons) return;
  for (const b of F.buttons) {
    const inside = near(b.b.x, b.b.z, 1.15);
    if (inside && !b.in && !b.on) press(b);
    b.in = inside;
  }
}
function press(b) {
  if (b.b.sym === order[step]) {
    setButton(b, true); step++; sfx.click ? sfx.click() : sfx.coin();
    G.spawnRing(V3(b.b.x, W.height(b.b.x, b.b.z) + 0.3, b.b.z), 0xffe08a, 1.6, 0.4);
    if (step === 3) { if (tabletSpot) { G.removeSpot('cave_tablet'); tabletSpot = null; } openDoor('buttons', 'The right order!', 'Leaf, mushroom, pebble... you remembered it all! I would have, too. Probably.'); }
    return;
  }
  // wrong: the buttons pop back up and a few pebbles rain down
  step = 0; F.buttons.forEach((x) => setButton(x, false)); sfx.crack();
  for (let i = 0; i < 6; i++) G.spawnPuff(V3(G.player.pos.x + rnd(-1, 1), G.player.pos.y + 3.5, G.player.pos.z + rnd(-1, 1)), 0x9a9286, false);
  G.hurtPlayer(Math.round(8 + P.lv * 1.5), false);
  UI.toast(readTablet ? 'Wrong order! The buttons popped back up.' : 'Wrong order! Maybe the old tablet in the middle tells the right one.');
  if (!P.story.toldButtons) { P.story.toldButtons = true; setTimeout(() => say('Ouch, pebbles! There is an old tablet in the middle of the room. I bet it tells the order.', 'worried'), 800); }
}

// ---------- boulder room: push the boulder onto the plate ----------
const PUSH = 1.8;
let bx = PUZ.boulder.x, bz = PUZ.boulder.z, roll = null, boulderSpot = null, leverSpot = null;
const LEVER = { x: 1506, z: -784 };
function placeBoulder(x, z) {
  bx = x; bz = z;
  F.boulder.g.position.set(x, W.height(x, z), z);
  W.setBoulder(x, z);
}
function makeBoulder() {
  removeBoulderSpots();
  const C = state();
  if (C.boulder) { placeBoulder(PUZ.plate.x, PUZ.plate.z); W.setBoulder(null); F.plate.top.material.emissive.setHex(0x6a5a10); F.plate.top.position.y = 0.1; return; }
  F.plate.top.material.emissive.setHex(0); F.plate.top.position.y = 0.2;
  placeBoulder(PUZ.boulder.x, PUZ.boulder.z);
  addBoulderSpot();
  leverSpot = G.addSpot({ id: 'cave_lever', x: LEVER.x, z: LEVER.z, label: 'Old lever', model: leverModel(), range: 2.4, y: 1.0, tagY: 2.2, far: 18, onUse: () => {
    leverSpot.model.children[1].rotation.x = 0.6; setTimeout(() => { if (leverSpot) leverSpot.model.children[1].rotation.x = -0.6; }, 500);
    if (state().boulder || roll) return;
    sfx.crack(); placeBoulder(PUZ.boulder.x, PUZ.boulder.z); addBoulderSpot();
    UI.toast('Clunk! The boulder rolls back to where it started.');
  } });
}
function leverModel() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.7), new THREE.MeshLambertMaterial({ color: 0x8f877a })); base.position.y = 0.25; g.add(base);
  const arm = new THREE.Group(); arm.position.y = 0.5; arm.rotation.x = -0.6; g.add(arm);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.1, 7), new THREE.MeshLambertMaterial({ color: 0x6e4c2e })); stick.position.y = 0.55; arm.add(stick);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshLambertMaterial({ color: 0xc8403a })); knob.position.y = 1.12; arm.add(knob);
  return g;
}
function addBoulderSpot() {
  if (boulderSpot) G.removeSpot('cave_boulder');
  boulderSpot = G.addSpot({ id: 'cave_boulder', x: bx, z: bz, label: 'Push', range: 2.9, y: 2.2, tagY: 3.0, far: 18, onUse: pushBoulder });
}
function removeBoulderSpots() {
  if (boulderSpot) { G.removeSpot('cave_boulder'); boulderSpot = null; }
  if (leverSpot) { G.removeSpot('cave_lever'); leverSpot = null; }
}
function pushBoulder() {
  if (roll || state().boulder) return;
  const dx = bx - G.player.pos.x, dz = bz - G.player.pos.z, l = Math.hypot(dx, dz) || 1;
  const tx = bx + dx / l * PUSH, tz = bz + dz / l * PUSH;
  const R = PUZ.room;
  if (Math.hypot(tx - R.x, tz - R.z) > R.r || !W.edgeCave || W.edgeCave(tx, tz) > -2.4) {
    G.deny('It will not roll any further that way.');
    if (!P.story.toldLever) { P.story.toldLever = true; setTimeout(() => say('Stuck? There is an old lever by the door. Pull it and the boulder rolls back to the start.', 'normal'), 600); }
    return;
  }
  roll = { x0: bx, z0: bz, x1: tx, z1: tz, t: 0, ax: dz / l, az: -dx / l };
  if (boulderSpot) { G.removeSpot('cave_boulder'); boulderSpot = null; }
  sfx.tip();
  if (!P.story.toldBoulder) { P.story.toldBoulder = true; setTimeout(() => say('Push it onto that round plate! Stand on the other side of where you want it to go.', 'happy'), 500); }
}
function updateBoulder(dt) {
  if (!roll) return;
  roll.t = Math.min(1, roll.t + dt / 0.5);
  const k = 1 - Math.pow(1 - roll.t, 2), x = roll.x0 + (roll.x1 - roll.x0) * k, z = roll.z0 + (roll.z1 - roll.z0) * k;
  F.boulder.g.position.set(x, W.height(x, z), z);
  F.boulder.ball.rotateOnWorldAxis(V3(roll.ax, 0, roll.az), dt / 0.5 * PUSH / 1.15);
  if (roll.t >= 1) {
    roll = null; placeBoulder(x, z);
    G.spawnPuff(V3(x, W.height(x, z) + 0.2, z), 0x9a9286, true);
    if (Math.hypot(x - PUZ.plate.x, z - PUZ.plate.z) < 1.35) {
      placeBoulder(PUZ.plate.x, PUZ.plate.z); W.setBoulder(null);
      F.plate.top.material.emissive.setHex(0x6a5a10); F.plate.top.position.y = 0.1;
      removeBoulderSpots();
      openDoor('boulder', 'Click! The plate is pressed', 'You did it! One more door... and something big is snoring behind it. Something royal.');
    } else addBoulderSpot();
  }
}

// ---------- King Leaflet ----------
const ROOM = (pad) => W.active === 'cave' && Math.hypot(G.player.pos.x - K.x, G.player.pos.z - K.z) < K.r + (pad || 0);
const rings = [];
let king = null;
function ai(m, dt) {
  king = m;
  const B = m.ks || (m.ks = { awake: false, t: 3, phase2: false, s66: false, s33: false, jump: null });
  if (!B.awake) {
    if (ROOM(-4) && !G.player.dead && !G.traveling) { wakeKing(m); return {}; }
    m.aggro = false; m.atk = null;
    if (m.hp < m.st.hp) m.hp = m.st.hp;
    const hd = Math.hypot(m.pos.x - m.home.x, m.pos.z - m.home.z);
    return hd > 1 ? { tx: m.home.x, tz: m.home.z, sp: 1.2 } : {};
  }
  if (G.player.dead || !ROOM(4)) { sleepKing(m); return {}; }
  m.kb = null; m.aggro = true;
  const f = m.hp / m.st.hp;
  if (!B.s66 && f < 0.66) { B.s66 = true; summon(m, 3); }
  if (!B.phase2 && f < 0.5) { B.phase2 = true; B.t = Math.min(B.t, 1.2); G.floatText('<small>HOW DARE YOU!</small>', 'crit', V3(m.pos.x, m.pos.y + 5.5, m.pos.z), 1.5); sfx.charge(); UI.banner('King Leaflet is furious!', 'Bigger jumps, and leaves fly where he lands!'); }
  if (!B.s33 && f < 0.33) { B.s33 = true; summon(m, 3); }
  if (B.jump) { m.atk = null; return {}; }
  B.t -= dt;
  if (B.t <= 0) { startJump(m, B); return {}; }
  return null;
}
function wakeKing(m) {
  const B = m.ks; B.awake = true; B.t = 2.4; m.aggro = true; m.atkCd = 1.5; m.show = 99;
  UI.banner('King Leaflet', 'The King of all Leaflets wakes up!');
  RW.audio.play('king'); sfx.charge();
  for (let i = 0; i < 12; i++) G.spawnPuff(V3(m.pos.x + rnd(-2, 2), m.pos.y + rnd(0.3, 4), m.pos.z + rnd(-2, 2)), 0x8ee07a, true);
  showBar(m);
  if (P && !P.story.sawKing) { P.story.sawKing = true; setTimeout(() => say('That is the KING?! He is as big as a house! When he jumps, watch for the red circle and RUN out of it!', 'surprised'), 1200); }
  RW.emit('boss', 'wake', m);
}
function sleepKing(m) {
  if (!m.ks) return;
  m.ks = null; m.aggro = false; m.atk = null; m.hp = m.st.hp; m.show = 0;
  m.body.position.y = 0; hideBar(); clearRings();
  if (W.active === 'cave') RW.audio.play('cave');
}
function summon(m, n) {
  for (let i = 0; i < n; i++) {
    const a = rnd(0, Math.PI * 2), r = rnd(4, 7);
    let x = m.pos.x + Math.cos(a) * r, z = m.pos.z + Math.sin(a) * r;
    if (!W.walkable(x, z, true)) { x = K.x + rnd(-6, 6); z = K.z + rnd(-6, 6); }
    const mm = G.spawnMonster('pebble_leaflet', 10, x, z);
    mm.quest = 'boss'; mm.aggro = true; mm.atkCd = rnd(1, 2); mm.show = 6;
    G.spawnRing(mm.pos, 0x8ee07a, 1.6, 0.5);
  }
  UI.toast('King Leaflet calls his guards!'); sfx.spore();
}
// the big jump: crouch, fly up in an arc, land on the spot where the hero stood
const CROUCH = 0.45, AIR = 1.05, SLAM_R = 3.0;
function startJump(m, B) {
  let tx = G.player.pos.x, tz = G.player.pos.z;
  const dx = tx - K.x, dz = tz - K.z, d = Math.hypot(dx, dz), lim = K.r - 4;
  if (d > lim) { tx = K.x + dx / d * lim; tz = K.z + dz / d * lim; }
  const ring = warn(tx, tz, SLAM_R, CROUCH + AIR);
  B.jump = { t: 0, x0: m.pos.x, z0: m.pos.z, x1: tx, z1: tz, ring, n: B.phase2 ? 2 : 1 };
  m.atk = null;
}
function updateJump(m, dt) {
  const B = m.ks; if (!B || !B.jump) return;
  const J = B.jump; J.t += dt;
  if (J.t < CROUCH) { m.body.scale.set(1 + J.t * 0.5, 1 - J.t * 0.6, 1 + J.t * 0.5); return; }
  const u = Math.min(1, (J.t - CROUCH) / AIR);
  m.body.scale.set(1 - 0.08 * Math.sin(u * Math.PI), 1 + 0.12 * Math.sin(u * Math.PI), 1 - 0.08 * Math.sin(u * Math.PI));
  m.pos.x = J.x0 + (J.x1 - J.x0) * u; m.pos.z = J.z0 + (J.z1 - J.z0) * u;
  J.h = Math.sin(u * Math.PI) * 7;
  if (u >= 1) land(m, J);
}
function land(m, J) {
  const B = m.ks; J.h = 0; m.body.scale.set(1.25, 0.75, 1.25); setTimeout(() => { if (m.body) m.body.scale.set(1, 1, 1); }, 160);
  const y = W.height(J.x1, J.z1);
  G.spawnRing(V3(J.x1, y + 0.1, J.z1), 0xd9c38a, SLAM_R * 2.2, 0.6);
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; G.spawnPuff(V3(J.x1 + Math.cos(a) * SLAM_R, y + 0.2, J.z1 + Math.sin(a) * SLAM_R), 0x9a9286, true); }
  sfx.crack(); sfx.tip();
  if (!G.player.dead && Math.hypot(G.player.pos.x - J.x1, G.player.pos.z - J.z1) < SLAM_R) {
    G.hurtPlayer(rnd(m.st.dmg[0], m.st.dmg[1]) * 1.4, true); G.stunPlayer(0.8);
  }
  if (B.phase2) {
    // a ring of leaf bursts around the landing spot
    const off = rnd(0, 1);
    for (let i = 0; i < 6; i++) { const a = (i + off) / 6 * Math.PI * 2, x = J.x1 + Math.cos(a) * 5.2, z = J.z1 + Math.sin(a) * 5.2; if (Math.hypot(x - K.x, z - K.z) < K.r - 1.5) warn(x, z, 1.4, 0.75, rnd(m.st.dmg[0], m.st.dmg[1]) * 0.9, true); }
  }
  J.n--;
  if (J.n > 0) { const tx = G.player.pos.x, tz = G.player.pos.z; Object.assign(J, { t: CROUCH * 0.4, x0: J.x1, z0: J.z1, x1: tx, z1: tz }); clampTarget(J); warn(J.x1, J.z1, SLAM_R, CROUCH * 0.6 + AIR); return; }
  B.jump = null; B.t = B.phase2 ? rnd(3.4, 4.2) : rnd(4.8, 5.8); m.atkCd = 0.8;
}
function clampTarget(J) { const dx = J.x1 - K.x, dz = J.z1 - K.z, d = Math.hypot(dx, dz), lim = K.r - 4; if (d > lim) { J.x1 = K.x + dx / d * lim; J.z1 = K.z + dz / d * lim; } }
// red warning circles; ones with a hit value burst on their own when the time is up
function warn(x, z, r, life, dmg, leaf) {
  const w = RW.warnRing(r); w.root.position.set(x, W.height(x, z), z); w.fill.scale.setScalar(0.05); scene.add(w.root);
  const o = { w, x, z, r, t: 0, life, dmg: dmg || 0, leaf: !!leaf }; rings.push(o); return o;
}
function updateRings(dt) {
  for (let i = rings.length - 1; i >= 0; i--) {
    const o = rings[i]; o.t += dt; const u = Math.min(1, o.t / o.life);
    o.w.fill.scale.setScalar(0.05 + u * 0.95); o.w.fill.material.opacity = 0.16 + u * 0.24; o.w.ring.material.opacity = 0.5 + Math.sin(o.t * 16) * 0.3;
    if (o.t >= o.life) {
      if (o.dmg) {
        const y = W.height(o.x, o.z);
        for (let k = 0; k < 6; k++) G.spawnPuff(V3(o.x + rnd(-0.6, 0.6), y + rnd(0.2, 1.2), o.z + rnd(-0.6, 0.6)), [0x5aa848, 0x8ee07a, 0xffd36e][k % 3], true);
        if (!G.player.dead && Math.hypot(G.player.pos.x - o.x, G.player.pos.z - o.z) < o.r) G.hurtPlayer(o.dmg, false);
      }
      scene.remove(o.w.root); rings.splice(i, 1);
    }
  }
}
function clearRings() { for (const o of rings) scene.remove(o.w.root); rings.length = 0; }
function anim(m, dt) {
  const B = m.ks, p = m.p;
  if (B && B.jump) { const J = B.jump; updateJump(m, dt); m.body.position.y += (B.jump && J.h) || 0; }
  if (p.aura) p.aura.material.opacity += ((B && B.awake ? (B.phase2 ? 0.7 : 0.4) : 0) - p.aura.material.opacity) * Math.min(1, dt * 3);
  if (p.crown) p.crown.rotation.y = Math.sin(m.t * 1.5) * 0.08;
  if (B && B.awake) updateBar(m);
}
function showBar(m) { $('bossName').textContent = m.k.name + ' · Lv. ' + m.lv; $('bossBar').hidden = false; updateBar(m); }
function hideBar() { $('bossBar').hidden = true; }
function updateBar(m) { $('bossFill').style.width = Math.max(0, m.hp / m.st.hp * 100).toFixed(1) + '%'; }

// ---------- events ----------
function setupCave() {
  if (!P || !W.MAPS.cave || !W.MAPS.cave.built) return;
  makeTorches(); makeButtons(); makeBoulder();
}
function teardown() {
  clearTorches(); removeBoulderSpots(); clearRings(); roll = null;
  if (tabletSpot) { G.removeSpot('cave_tablet'); tabletSpot = null; }
}
RW.on('enter', (p) => { P = p; if (!P.story) P.story = {}; toldTorch = !!P.story.toldTorch; applyState(); teardown(); if (W.active === 'cave') setupCave(); });
RW.on('leave', () => { teardown(); hideBar(); P = null; king = null; });
RW.on('map', (id) => {
  if (!P) return;
  applyState();
  if (id === 'cave') {
    setupCave();
    if (!P.story.sawCave) { P.story.sawCave = true; setTimeout(() => say('Pebble Cave... it is so quiet. Drip... drip... And look at those glowing crystals! Stay close to me. I mean, I will stay close to you.', 'worried'), 1500); }
  } else { teardown(); if (king) { king.ks = null; king = null; } }
});
RW.on('kill', (m) => {
  if (!(m.k.boss && m.k.area === 'cave')) return;
  m.ks = null; hideBar(); clearRings();
  RW.audio.play('cave');
  UI.banner('King Leaflet defeated!', 'The sunshine he took is free again');
  for (const o of G.monsters) if (o.alive && o.quest === 'boss') o.aggro = false;
  if (F.sunbeam) F.sunbeam.material.color.setHex(0xfff8d8);
  if (P.story.kingDown) setTimeout(() => { if (P) say('Hoo! The King is back on his feet already. He says that was a good wrestle. Come back any time!', 'happy'); }, 2400);
  P.story.kingDown = true;
});

function update(dt) {
  if (!here()) return;
  updateTorches(dt); updateButtons(); updateBoulder(dt);
  if (rings.length) updateRings(dt);
}
RW.cave = { ai, anim, update, get king() { return king; } };
})();
