// Russel World: title screen, hero select (three pedestals on Mossbrook Square) and the character creator.
// The real world keeps running behind these screens; game.js hands control over while it is in menu mode.
(function () {
'use strict';
const RW = window.RW;
if (!RW || RW.failed || !RW.G || !RW.world) return;
const { THREE, scene, camera, renderer, rnd, clamp, lerp, smooth01, wrapAngle, V3, LOOKS, RANDOM_NAMES, SLOTS } = RW;
const W = RW.world, AU = RW.audio, sfx = AU.sfx, G = RW.G, UI = RW.UI;
const store = G.store;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const canvas = renderer.domElement;
const easeOutBack = (x) => 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2);
const GAME_FOV = camera.fov;

let screen = null; // 'title' | 'select' | 'create'
let time = 0, busy = false;

// ---------- screen fades ----------
const fadeEl = $('fade');
function fadeTo(fn, hold) {
  if (busy) return; busy = true;
  fadeEl.classList.add('on');
  setTimeout(() => {
    try { fn(); } finally {
      setTimeout(() => { fadeEl.classList.remove('on'); busy = false; }, hold || 120);
    }
  }, 560);
}
function showScreen(id) {
  for (const s of ['titleScreen', 'selectScreen', 'createScreen']) $(s).hidden = s !== id;
  $('deletePanel').hidden = true;
}

// ---------- puppets: heroes that stand and react on the menus ----------
function makePuppet(look, ghost) {
  const c = RW.chibi(RW.lookOpts(look));
  if (ghost) { RW.ghostify(c); if (c.j.weapon) c.j.weapon.visible = false; }
  return { c, root: c.root, j: c.j, rig: c.rig, ghost: !!ghost, t: rnd(0, 6), blinkT: rnd(1, 4), react: null, reactT: 0 };
}
// reactions when a hero is tapped: wave, a hero pose with the stick, or a happy hop; a nod before entering the world
const REACTS = {
  wave: { dur: 1.7, f: (k, s) => ({ armLx: 2.85, armLz: 0.5 + Math.sin(s * 10) * 0.35, elL: -0.35 + Math.sin(s * 10 + 0.8) * 0.3, headZ: -0.1, headX: -0.08, headY: 0, twist: -0.1, roll: -0.03 }) },
  // stick angle: the stick points straight up when (arm + elbow + stick) adds up to a full turn
  pose: { dur: 1.9, f: (k) => ({ armRx: 2.95, armRz: -0.28, elR: -0.15, stick: 3.7, armLx: 1.15, armLz: 0.3, elL: -1.95, lean: -0.1, headX: -0.16, headY: 0, twist: -0.18, hipL: -0.12, hipR: 0.16, kneeL: 0.12, jump: 0.02 }) },
  hop: { dur: 1.15, f: (k) => {
    const crouch = k < 0.2 ? smooth01(k / 0.2) : k < 0.3 ? 1 - smooth01((k - 0.2) / 0.1) : 0;
    const air = k > 0.25 && k < 0.75 ? Math.sin(((k - 0.25) / 0.5) * Math.PI) : 0;
    const land = k > 0.72 && k < 0.95 ? Math.sin(((k - 0.72) / 0.23) * Math.PI) : 0;
    const bend = Math.max(crouch, land);
    return { jump: air * 0.55 - bend * 0.07, hipL: -0.5 * bend - 0.25 * air, hipR: -0.5 * bend + 0.1 * air, kneeL: 0.9 * bend + 0.5 * air, kneeR: 0.9 * bend + 0.2 * air,
      armLx: 2.7 * air + 0.3 * bend, armRx: 2.7 * air + 0.3 * bend, armLz: 0.45, armRz: -0.45, elL: -1.1, elR: -1.1, lean: 0.12 * bend - 0.06 * air, headX: -0.15 * air, headY: 0, stick: 2.2 + 2.3 * air };
  } },
  nod: { dur: 0.9, f: (k) => ({ headX: Math.max(0, Math.sin(k * Math.PI * 2)) * 0.42, headY: 0, lean: Math.max(0, Math.sin(k * Math.PI * 2)) * 0.1, armRx: 0.5, armRz: -0.3, elR: -1.0, stick: 1.7 }) }
};
function react(p, type) { if (!p || p.ghost) return; p.react = type; p.reactT = 0; }
function animPuppet(p, dt) {
  p.t += dt; const t = p.t, j = p.j, br = Math.sin(t * 2.1), sway = Math.sin(t * 0.9);
  const A = {
    hipL: 0.02 + sway * 0.03, hipR: -0.02 - sway * 0.03, kneeL: 0.06 + Math.max(0, sway) * 0.08, kneeR: 0.06 + Math.max(0, -sway) * 0.08,
    armLx: 0.05 + br * 0.03, armRx: -0.04 + br * 0.03, armLz: 0.16 + br * 0.03, armRz: -0.15 - br * 0.03, elL: -0.32, elR: -0.42,
    twist: Math.sin(t * 0.5) * 0.05, lean: 0.04, jump: 0, roll: sway * 0.02,
    headX: Math.sin(t * 0.7) * 0.04, headY: Math.sin(t * 0.37) * 0.2, headZ: -sway * 0.02, stick: 2.2
  };
  if (p.react) {
    p.reactT += dt; const r = REACTS[p.react], k = p.reactT / r.dur;
    if (k >= 1) p.react = null;
    else { const w = clamp(Math.min(p.reactT / 0.16, (r.dur - p.reactT) / 0.22), 0, 1), R = r.f(k, p.reactT); for (const key in R) A[key] = lerp(A[key], R[key], w); }
  }
  j.hipL.rotation.x = A.hipL; j.hipR.rotation.x = A.hipR; j.kneeL.rotation.x = A.kneeL; j.kneeR.rotation.x = A.kneeR;
  j.ankleL.rotation.x = -(A.hipL + A.kneeL) * 0.6; j.ankleR.rotation.x = -(A.hipR + A.kneeR) * 0.6;
  j.armL.rotation.set(A.armLx, 0, A.armLz); j.armR.rotation.set(A.armRx, 0, A.armRz); j.elbowL.rotation.x = A.elL; j.elbowR.rotation.x = A.elR;
  p.rig.rotation.set(0, 0, A.roll); p.rig.position.y = A.jump;
  j.upper.rotation.set(A.lean, A.twist, 0); j.upper.scale.y = 1 + br * 0.012;
  if (j.weapon) j.weapon.rotation.x = A.stick;
  j.head.rotation.set(A.headX, A.headY, A.headZ);
  j.hair.rotation.z = Math.sin(t * 1.3) * 0.035 + A.headZ * 0.5;
  if (j.faceMat) {
    p.blinkT -= dt; if (p.blinkT < 0) p.blinkT = rnd(2.4, 5);
    const want = p.blinkT > 0 && p.blinkT < 0.12 ? j.faceClosed : j.faceOpen;
    if (j.faceMat.map !== want) { j.faceMat.map = want; j.faceMat.needsUpdate = true; }
  }
}

// ---------- little light effects for the menus ----------
const fxList = [];
const pillarMat = () => new THREE.MeshBasicMaterial({ color: 0xfff1a8, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
function lightBurst(pos, parent) {
  const pillar = new THREE.Mesh(RW.cachedGeo('mpillar', () => new THREE.CylinderGeometry(0.85, 0.85, 7, 24, 1, true)), pillarMat());
  pillar.position.set(pos.x, pos.y + 3.5, pos.z); (parent || scene).add(pillar);
  fxList.push({ o: pillar, t: 0, dur: 1.5, kind: 'pillar' });
  for (let i = 0; i < 14; i++) {
    const g = RW.glow(0.5); g.material.blending = THREE.AdditiveBlending; g.material.color.set(i % 2 ? 0xfff1a8 : 0xffffff);
    const a = rnd(0, Math.PI * 2), r = rnd(0.2, 0.9);
    g.position.set(pos.x + Math.cos(a) * r, pos.y + rnd(0.2, 1.2), pos.z + Math.sin(a) * r); (parent || scene).add(g);
    fxList.push({ o: g, t: -rnd(0, 0.4), dur: rnd(0.9, 1.4), kind: 'mote', vy: rnd(1.2, 2.4) });
  }
}
function puff(pos) {
  for (let i = 0; i < 10; i++) {
    const m = new THREE.Mesh(RW.geoSphere(0.16, 6, 4), new THREE.MeshBasicMaterial({ color: 0xf3ead6, transparent: true, opacity: 0.8, depthWrite: false }));
    m.position.set(pos.x + rnd(-0.5, 0.5), pos.y + rnd(0.3, 1.6), pos.z + rnd(-0.4, 0.4)); scene.add(m);
    fxList.push({ o: m, t: 0, dur: rnd(0.6, 1), kind: 'puff', vy: rnd(0.4, 1.2) });
  }
}
function updateFx(dt) {
  for (let i = fxList.length - 1; i >= 0; i--) {
    const f = fxList[i]; f.t += dt; if (f.t < 0) { f.o.visible = false; continue; } f.o.visible = true;
    const k = f.t / f.dur;
    if (k >= 1) { f.o.parent && f.o.parent.remove(f.o); f.o.material.dispose(); fxList.splice(i, 1); continue; }
    if (f.kind === 'pillar') { f.o.material.opacity = 0.32 * Math.sin(Math.PI * k); const s = 0.5 + k * 0.7; f.o.scale.set(s, 1, s); }
    else if (f.kind === 'mote') { f.o.position.y += f.vy * dt; f.o.material.opacity = Math.sin(Math.PI * k); }
    else { f.o.position.y += f.vy * dt; const s = 1 + k * 1.5; f.o.scale.set(s, s, s); f.o.material.opacity = 0.8 * (1 - k); }
  }
}

// ---------- title: Mossbrook from the meadow road, drifting slowly, with fireflies and falling leaves ----------
const TITLE_LOOK = V3(0, 3.4, -12);
const titleLife = new THREE.Group(); titleLife.visible = false; scene.add(titleLife);
const flies = [], leaves = [];
{
  for (let i = 0; i < 22; i++) {
    const g = RW.glow(0.55); g.material.blending = THREE.AdditiveBlending; g.material.color.set(0xfff0a0);
    titleLife.add(g); flies.push({ o: g, base: V3(rnd(-14, 14), rnd(0.6, 3.6), rnd(-60, -36)), ph: rnd(0, 6), sp: rnd(0.4, 0.9) });
  }
  const leafTex = RW.canvasTex(64, 64, (g) => {
    g.translate(32, 32); g.rotate(-0.6);
    g.fillStyle = '#7cbf4f'; g.strokeStyle = '#3b2a1e'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, -26); g.quadraticCurveTo(20, -4, 0, 26); g.quadraticCurveTo(-20, -4, 0, -26); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(0, -20); g.lineTo(0, 22); g.stroke();
  }, null);
  const leafMats = [0x86c45e, 0x6fae4a, 0xc9d86a, 0xe9b84a].map((c) => new THREE.MeshBasicMaterial({ map: leafTex, color: c, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide }));
  const leafGeo = new THREE.PlaneGeometry(0.34, 0.34);
  for (let i = 0; i < 18; i++) {
    const m = new THREE.Mesh(leafGeo, leafMats[i % 4]); titleLife.add(m);
    leaves.push({ o: m, x: rnd(-10, 10), y: rnd(0.5, 9), z: rnd(-66, -52), ph: rnd(0, 6), fall: rnd(0.5, 0.9), spin: V3(rnd(-2, 2), rnd(-2, 2), rnd(-2, 2)) });
  }
}
function updateTitle(dt, focus) {
  const t = time * 0.045;
  camera.position.set(Math.sin(t) * 8, 6.4 + Math.sin(t * 1.7) * 0.5, -72 + Math.cos(t * 0.8) * 3);
  camera.lookAt(TITLE_LOOK.x + Math.sin(t) * 2, TITLE_LOOK.y, TITLE_LOOK.z);
  // keep the town gate a little left of centre so the Play panel does not cover it
  const VW = window.innerWidth, VH = window.innerHeight;
  camera.setViewOffset(VW, VH, VW * (VW > VH ? 0.1 : 0), 0, VW, VH); camera.updateMatrixWorld();
  focus.set(camera.position.x, 0, camera.position.z + 20);
  for (const f of flies) {
    const s = time * f.sp + f.ph;
    f.o.position.set(f.base.x + Math.sin(s * 0.7) * 1.6, f.base.y + Math.sin(s * 1.3) * 0.5, f.base.z + Math.cos(s * 0.5) * 1.6);
    f.o.material.opacity = 0.35 + 0.65 * Math.max(0, Math.sin(s * 2.3));
  }
  // leaves drift down a few metres in front of the camera
  const cx = camera.position.x, cz = camera.position.z;
  for (const l of leaves) {
    l.y -= l.fall * dt; l.x += Math.sin(time * 0.9 + l.ph) * dt * 0.8 + dt * 0.5;
    if (l.y < W.height(l.x, l.z) + 0.05 || Math.abs(l.x - cx) > 14) { l.y = rnd(6, 9); l.x = cx + rnd(-10, 8); l.z = cz + rnd(5, 20); }
    l.o.position.set(l.x, l.y, l.z); l.o.rotation.set(l.spin.x * time, l.spin.y * time + Math.sin(time + l.ph), l.spin.z * time);
  }
}
function syncTitleSound() { const off = !AU.state.musicOn; $('tSound').setAttribute('aria-pressed', String(off)); $('tSound').setAttribute('aria-label', off ? 'Music off' : 'Music on'); }
function showTitle() {
  screen = 'title'; showScreen('titleScreen');
  camera.clearViewOffset(); camera.fov = 40; camera.updateProjectionMatrix();
  titleLife.visible = true; peds.visible = false;
  const any = store.slots.some((h) => h);
  $('tWelcome').textContent = any ? 'Welcome back!' : 'Welcome!';
  $('tNote').textContent = any ? 'Your heroes are saved on this device.' : 'Make your first hero to begin your adventure.';
  syncTitleSound();
  if (AU.ensure()) AU.play('title');
  if (!RW.isTouch) $('tPlay').focus({ preventScroll: true });
}
$('tPlay').addEventListener('click', () => {
  AU.ensure(); AU.play('title'); sfx.start();
  fadeTo(() => showSelect(store.slots[store.last] ? store.last : 0));
});
$('tSound').addEventListener('click', () => { AU.ensure(); AU.setMusic(!AU.state.musicOn); G.saveSettings(); if (AU.state.musicOn) AU.play('title'); syncTitleSound(); sfx.click(); });
// browsers only allow sound after the first tap: start the title song then
document.addEventListener('pointerdown', () => { if (screen === 'title' || screen === 'select' || screen === 'create') { if (AU.ensure()) AU.play('title'); } }, true);

// ---------- hero select: three pedestals in front of the statue ----------
// the statue stands behind, between the first two pedestals
const PZ = 3.2, PX = [-1.55, 1.55, 4.65], PCX = 1.55, PED_Y = W.height(0, PZ);
const peds = new THREE.Group(); peds.visible = false; scene.add(peds);
const slots = [];
{
  const stoneM = RW.lam(0xd8d2c6, RW.rockTex);
  for (let i = 0; i < SLOTS; i++) {
    const g = new THREE.Group(); g.position.set(PX[i], PED_Y, PZ); peds.add(g);
    RW.part(RW.geoCyl(0.95, 1.05, 0.3, 32), stoneM, 0.015, g, 0, 0.15, 0);
    const ring = new THREE.Mesh(RW.cachedGeo('selring', () => new THREE.RingGeometry(0.8, 0.93, 40)), new THREE.MeshBasicMaterial({ color: 0xf4c542, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.31; ring.visible = false; g.add(ring);
    const gl = RW.glow(3.2); gl.position.y = 1.3; gl.material.opacity = 0; g.add(gl);
    const tag = document.createElement('button'); tag.className = 'stag'; tag.type = 'button'; $('slotTags').appendChild(tag);
    tag.addEventListener('click', () => pickSlot(i));
    slots.push({ g, ring, gl, tag, p: null, appear: -1 });
  }
}
let sel = 0;
function heroLine(h) { return h.name + ' · Lv. ' + h.lv + ' Novice'; }
function placeHero(i) {
  const s = slots[i], h = store.slots[i];
  if (s.p) s.g.remove(s.p.root);
  s.p = makePuppet(h ? h.look : { gender: 'boy', hair: 'spiky' }, !h);
  s.p.root.position.y = 0.3; s.p.root.scale.setScalar(1.3); s.g.add(s.p.root);
  s.tag.textContent = h ? heroLine(h) : '+ Empty slot · Create';
  s.tag.classList.toggle('empty', !h);
  s.tag.setAttribute('aria-label', h ? 'Choose ' + h.name : 'Empty slot ' + (i + 1) + ', create a hero');
}
function zoneName(h) { if (!h.pos) return 'Mossbrook'; const z = W.zoneAt(h.pos.x, h.pos.z); return z === 'town' ? 'Mossbrook' : RW.AREAS[z] ? RW.AREAS[z].name : 'Sunny Meadow'; }
function renderInfo() {
  const h = store.slots[sel], box = $('slotInfo');
  if (h) {
    box.innerHTML = '<div><div class="s-name">' + esc(h.name) + '</div></div>' +
      '<div class="s-rows"><span>Job</span><span>Novice</span><span>Level</span><span>' + h.lv + '</span><span>Location</span><span>' + zoneName(h) + '</span><span>Pet</span><span>None yet</span></div>' +
      '<button class="btn big" id="sPlay">Play</button>' +
      '<div class="s-acts"><button class="btn soft" id="sBack">Back</button><button class="btn soft danger" id="sDel">Delete</button></div>';
    $('sPlay').addEventListener('click', playSelected);
    $('sDel').addEventListener('click', askDelete);
  } else {
    box.innerHTML = '<div class="s-name">Empty slot</div><p class="note">Make a new hero to stand on this spot. Slot ' + (sel + 1) + ' of ' + SLOTS + '.</p>' +
      '<button class="btn big" id="sCreate">Create hero</button><div class="s-acts"><button class="btn soft" id="sBack">Back</button></div>';
    $('sCreate').addEventListener('click', () => { sfx.click(); fadeTo(() => showCreate(sel)); });
  }
  $('sBack').addEventListener('click', () => { sfx.click(); fadeTo(showTitle); });
  slots.forEach((s, i) => { s.tag.classList.toggle('sel', i === sel); s.ring.visible = i === sel; });
}
let lastReact = '';
function pickSlot(i, quiet) {
  if (screen !== 'select' || busy) return;
  const changed = i !== sel; sel = i; renderInfo();
  if (!quiet) sfx.select();
  const p = slots[i].p;
  if (p && !p.ghost && !quiet && (changed || !p.react)) {
    const opts = ['wave', 'pose', 'hop'].filter((x) => x !== lastReact), pick = opts[Math.floor(Math.random() * opts.length)];
    lastReact = pick; react(p, pick);
  }
}
function showSelect(focus, opts) {
  screen = 'select'; showScreen('selectScreen');
  titleLife.visible = false; peds.visible = true;
  camera.fov = 36; camera.updateProjectionMatrix();
  for (let i = 0; i < SLOTS; i++) placeHero(i);
  sel = clamp(focus || 0, 0, SLOTS - 1); renderInfo();
  if (opts && opts.appear != null) {
    const s = slots[opts.appear]; s.appear = 0; s.p.root.scale.setScalar(0.01);
    setTimeout(() => { lightBurst(V3(s.g.position.x, PED_Y + 0.3, PZ)); sfx.appear(); }, 380);
  }
  updateSelectCamera();
}
// frame the pedestals in the part of the screen the info panel does not cover
function updateSelectCamera() {
  const VW = window.innerWidth, VH = window.innerHeight, pr = document.querySelector('.s-panel').getBoundingClientRect();
  let fx0 = 0, fx1 = VW, fy0 = 64, fy1 = VH - 40;
  if (pr.width && pr.left > VW * 0.45) fx1 = pr.left - 8; else if (pr.width) fy1 = pr.top - 36;
  const fw = Math.max(120, fx1 - fx0), fh = Math.max(120, fy1 - fy0);
  const tv = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2), aspect = VW / VH;
  const dW = 10.4 / ((fw / VW) * 2 * tv * aspect), dH = 3.9 / ((fh / VH) * 2 * tv);
  const d = clamp(Math.max(dW, dH), 7, 30);
  const sway = Math.sin(time * 0.25) * 0.25;
  camera.position.set(PCX + sway, PED_Y + 1.7 + d * 0.06, PZ + d);
  camera.lookAt(PCX, PED_Y + 1.25, PZ);
  // centre the row across the free width, and stand the pedestals near the bottom with room for the name tags
  const cx = (fx0 + fx1) / 2;
  camera.setViewOffset(VW, VH, VW / 2 - cx, 0, VW, VH); camera.updateMatrixWorld();
  const base = V3(PCX, PED_Y, PZ + 1.05).project(camera), yb = (-base.y * 0.5 + 0.5) * VH;
  const want = Math.min(fy1 - 34, fy0 + fh * 0.86);
  camera.setViewOffset(VW, VH, VW / 2 - cx, yb - want, VW, VH); camera.updateMatrixWorld();
}
function updateSelect(dt, focus) {
  updateSelectCamera();
  focus.set(0, 0, PZ);
  const v = V3(0, 0, 0);
  slots.forEach((s, i) => {
    const p = s.p; if (!p) return;
    animPuppet(p, dt);
    const want = Math.atan2(camera.position.x - s.g.position.x, camera.position.z - s.g.position.z) + (i === sel ? 0 : (i - 1) * -0.12 + 0.12);
    p.root.rotation.y += wrapAngle(want - p.root.rotation.y) * Math.min(1, dt * 5);
    if (s.appear >= 0) {
      s.appear += dt; const k = clamp((s.appear - 0.45) / 0.7, 0, 1);
      p.root.scale.setScalar(Math.max(0.01, 1.3 * easeOutBack(k)));
      if (k >= 1) { s.appear = -1; react(p, 'hop'); }
    }
    const on = i === sel ? 1 : 0;
    s.gl.material.opacity += ((on ? 0.5 + Math.sin(time * 2) * 0.08 : 0) - s.gl.material.opacity) * Math.min(1, dt * 6);
    v.set(s.g.position.x, PED_Y, PZ + 1.08).project(camera);
    const x = (v.x * 0.5 + 0.5) * window.innerWidth, y = (-v.y * 0.5 + 0.5) * window.innerHeight;
    s.tag.style.transform = 'translate(' + x.toFixed(1) + 'px,' + (y + 8).toFixed(1) + 'px) translate(-50%,0)';
  });
}
function playSelected() {
  const i = sel, h = store.slots[i]; if (!h || busy) return;
  react(slots[i].p, 'nod'); sfx.start();
  setTimeout(() => fadeTo(() => enterGame(i), 260), 500);
}
function enterGame(i) {
  screen = null; showScreen(null);
  peds.visible = false; titleLife.visible = false;
  camera.clearViewOffset(); camera.fov = GAME_FOV; camera.updateProjectionMatrix();
  G.enter(i);
}
function backToSelect() {
  if (busy || G.mode !== 'play') return;
  fadeTo(() => { const i = store.last; G.leave(); showSelect(i); if (AU.ensure()) AU.play('title'); });
}
// tapping a hero on the square
canvas.addEventListener('pointerdown', (e) => {
  if (screen !== 'select' || busy) return;
  AU.ensure();
  const v = V3(0, 0, 0); let best = -1, bd = 1e9;
  slots.forEach((s, i) => {
    v.set(s.g.position.x, PED_Y + 1.3, PZ).project(camera);
    const x = (v.x * 0.5 + 0.5) * window.innerWidth, y = (-v.y * 0.5 + 0.5) * window.innerHeight, d = Math.hypot(x - e.clientX, y - e.clientY);
    if (d < bd) { bd = d; best = i; }
  });
  const v0 = V3(PX[0], PED_Y, PZ).project(camera), v1 = V3(PX[1], PED_Y, PZ).project(camera), gap = Math.abs(v1.x - v0.x) * 0.5 * window.innerWidth;
  if (best >= 0 && bd < Math.max(60, gap * 0.75)) pickSlot(best);
});

// ---------- deleting a hero: type the name to confirm ----------
function askDelete() {
  const h = store.slots[sel]; if (!h) return;
  sfx.click();
  $('delTitle').textContent = 'Delete ' + h.name + '?';
  $('delNote').textContent = h.name + ' (Lv. ' + h.lv + ') and everything in their bag will be gone for good. This cannot be undone.';
  $('delLbl').textContent = 'Type ' + h.name + ' to confirm';
  $('delName').value = ''; $('delYes').disabled = true;
  $('deletePanel').hidden = false;
  setTimeout(() => $('delName').focus({ preventScroll: true }), 30);
}
$('delName').addEventListener('input', () => {
  const h = store.slots[sel];
  $('delYes').disabled = !h || $('delName').value.trim().toLowerCase() !== h.name.toLowerCase();
});
$('delName').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !$('delYes').disabled) $('delYes').click(); });
$('delNo').addEventListener('click', () => { sfx.click(); $('deletePanel').hidden = true; });
$('delYes').addEventListener('click', () => {
  const s = slots[sel]; $('deletePanel').hidden = true;
  G.deleteHero(sel); sfx.erase(); puff(V3(s.g.position.x, PED_Y, PZ));
  placeHero(sel); renderInfo();
  s.p.root.scale.setScalar(0.01); s.appear = 0.2;
});

// ---------- character creator ----------
const studio = new THREE.Scene();
studio.fog = new THREE.Fog(0xe6f2ea, 60, 175);
studio.add(new THREE.HemisphereLight(0xfff3dc, 0xb3a184, 0.74));
{ const sun = new THREE.DirectionalLight(0xfff0d4, 0.55); sun.position.copy(RW.SUN_DIR).multiplyScalar(100); studio.add(sun); }
studio.background = RW.canvasTex(64, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#d8eef8'); gr.addColorStop(0.62, '#e6f2ea'); gr.addColorStop(1, '#e2efd4'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
}, null);
{
  const tex = RW.canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(176,214,140,1)'); gr.addColorStop(0.6, 'rgba(198,226,168,.85)'); gr.addColorStop(1, 'rgba(215,235,198,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }, null);
  const disc = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = -0.01; studio.add(disc);
}
const studioCam = new THREE.PerspectiveCamera(28, 0.7, 0.1, 100);
const CR = { slot: 0, look: { gender: 'boy', skin: 0, hair: 'spiky', color: 0 }, yaw: 0.3, puppet: null };
function buildPreview(reaction) {
  if (CR.puppet) studio.remove(CR.puppet.root);
  CR.puppet = makePuppet(CR.look, false); studio.add(CR.puppet.root);
  if (reaction) react(CR.puppet, reaction);
}
function pills(el, list, isOn, pick) {
  el.innerHTML = '';
  list.forEach((it, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pill'; b.textContent = it[0];
    b.setAttribute('aria-pressed', String(isOn(it, i))); b.addEventListener('click', () => { pick(it, i); sfx.click(); refreshCreator(); });
    el.appendChild(b);
  });
}
function swatches(el, list, isOn, pick, what) {
  el.innerHTML = '';
  list.forEach((it, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'swc'; b.style.background = it[1];
    b.setAttribute('aria-label', what + ' ' + it[0]); b.title = it[0];
    b.setAttribute('aria-pressed', String(isOn(it, i))); b.addEventListener('click', () => { pick(it, i); sfx.click(); refreshCreator(); });
    el.appendChild(b);
  });
}
let builtKey = '';
function refreshCreator(reaction) {
  const L = CR.look;
  pills($('cGender'), LOOKS.genders, (it) => L.gender === it[1], (it) => { L.gender = it[1]; });
  swatches($('cSkin'), LOOKS.skins, (it, i) => L.skin === i, (it, i) => { L.skin = i; }, 'Skin tone');
  pills($('cHair'), LOOKS.hairs, (it) => L.hair === it[1], (it) => { L.hair = it[1]; });
  swatches($('cColor'), LOOKS.colors, (it, i) => L.color === i, (it, i) => { L.color = i; }, 'Hair color');
  $('cSkinName').textContent = LOOKS.skins[L.skin][0]; $('cColorName').textContent = LOOKS.colors[L.color][0];
  const key = L.gender + L.skin + L.hair + L.color;
  if (key !== builtKey) { builtKey = key; buildPreview(reaction); }
  syncNamePill();
}
function syncNamePill() { const n = $('cName').value.trim(); $('cNamePill').textContent = n || 'Your hero'; }
function checkName(raw, slot) {
  const n = raw.trim().replace(/\s+/g, ' ');
  if (n.length < 2) return [null, 'Give your hero a name with at least 2 letters.'];
  if (n.length > 12) return [null, 'Names can be up to 12 letters long.'];
  let ok = true; try { ok = new RegExp('^[\\p{L}\\p{N}][\\p{L}\\p{N} \'-]*$', 'u').test(n); } catch (e) { ok = /^[A-Za-z0-9][A-Za-z0-9 '-]*$/.test(n); }
  if (!ok) return [null, 'Use letters and numbers only.'];
  for (let i = 0; i < SLOTS; i++) if (i !== slot && store.slots[i] && store.slots[i].name.toLowerCase() === n.toLowerCase()) return [null, 'You already have a hero called ' + store.slots[i].name + '.'];
  return [n, ''];
}
function showCreate(i) {
  screen = 'create'; showScreen('createScreen');
  peds.visible = false; titleLife.visible = false;
  CR.slot = i; CR.look = { gender: 'boy', skin: 0, hair: 'spiky', color: 0 }; CR.yaw = 0.3; builtKey = '';
  $('cSlot').textContent = 'Slot ' + (i + 1) + ' of ' + SLOTS;
  $('cName').value = ''; $('cErr').textContent = '';
  refreshCreator();
  if (!RW.isTouch) setTimeout(() => $('cName').focus({ preventScroll: true }), 60);
}
function randomLook() {
  const L = CR.look, pick = (a) => a[Math.floor(Math.random() * a.length)];
  L.gender = Math.random() < 0.5 ? 'boy' : 'girl';
  L.skin = Math.floor(Math.random() * LOOKS.skins.length); L.hair = pick(LOOKS.hairs)[1]; L.color = Math.floor(Math.random() * LOOKS.colors.length);
  const taken = new Set(store.slots.filter((h) => h).map((h) => h.name.toLowerCase()));
  const names = RANDOM_NAMES[L.gender].filter((n) => !taken.has(n.toLowerCase()) && n !== $('cName').value);
  $('cName').value = pick(names.length ? names : RANDOM_NAMES[L.gender]); $('cErr').textContent = '';
  builtKey = ''; refreshCreator('hop');
}
$('cRandom').addEventListener('click', () => { sfx.select(); randomLook(); });
$('cName').addEventListener('input', () => { syncNamePill(); if ($('cErr').textContent) $('cErr').textContent = ''; });
$('cName').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); $('cCreate').click(); } });
$('cBack').addEventListener('click', () => { sfx.click(); fadeTo(() => showSelect(CR.slot)); });
$('cCreate').addEventListener('click', () => {
  const [name, err] = checkName($('cName').value, CR.slot);
  if (!name) { $('cErr').textContent = err; sfx.deny(); $('cName').focus({ preventScroll: true }); return; }
  $('cName').blur();
  G.createHero(CR.slot, name, Object.assign({}, CR.look));
  react(CR.puppet, 'hop'); sfx.select();
  const i = CR.slot;
  setTimeout(() => fadeTo(() => showSelect(i, { appear: i }), 200), 350);
});
// turn the preview by dragging
{
  const hole = $('cHole'); let drag = null;
  hole.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, yaw: CR.yaw }; try { hole.setPointerCapture(e.pointerId); } catch (err) { /* optional */ } });
  hole.addEventListener('pointermove', (e) => { if (drag) CR.yaw = drag.yaw + (e.clientX - drag.x) * 0.012; });
  const end = () => { drag = null; };
  hole.addEventListener('pointerup', end); hole.addEventListener('pointercancel', end);
  hole.addEventListener('click', () => { if (CR.puppet && !CR.puppet.react) react(CR.puppet, ['wave', 'pose', 'hop'][Math.floor(Math.random() * 3)]); });
}
function updateCreate(dt) {
  if (!CR.puppet) return;
  animPuppet(CR.puppet, dt);
  CR.puppet.root.rotation.y += (CR.yaw - CR.puppet.root.rotation.y) * Math.min(1, dt * 10);
}
function renderCreate() {
  const VW = window.innerWidth, VH = window.innerHeight;
  renderer.setScissorTest(false); renderer.setClearColor(0xf6ead2, 1); renderer.clear();
  const r = $('cHole').getBoundingClientRect(), b = 8;
  const x = r.left + b, y = VH - (r.bottom - b), w = r.width - b * 2, h = r.height - b * 2;
  if (w < 20 || h < 20) return;
  studioCam.aspect = w / h;
  // fit the whole hero (about 1.8 m with hair and stick) with room for the name tags
  const tv = Math.tan(THREE.MathUtils.degToRad(studioCam.fov) / 2);
  const d = Math.max(2.55 / (2 * tv), 1.3 / (2 * tv * studioCam.aspect));
  studioCam.position.set(0, 1.0 + d * 0.06, d); studioCam.lookAt(0, 0.92, 0); studioCam.updateProjectionMatrix();
  renderer.setViewport(x, y, w, h); renderer.setScissor(x, y, w, h); renderer.setScissorTest(true);
  renderer.render(studio, studioCam);
  renderer.setScissorTest(false); renderer.setViewport(0, 0, VW, VH);
}

// ---------- keyboard ----------
window.addEventListener('keydown', (e) => {
  if (!screen || busy) return;
  const typing = e.target && e.target.tagName === 'INPUT';
  if (!$('deletePanel').hidden) { if (e.key === 'Escape') $('delNo').click(); return; }
  if (screen === 'title' && (e.key === 'Enter' || e.key === ' ') && e.target === document.body) { e.preventDefault(); $('tPlay').click(); }
  else if (screen === 'select' && !typing) {
    if (e.key === 'ArrowLeft') pickSlot((sel + SLOTS - 1) % SLOTS);
    else if (e.key === 'ArrowRight') pickSlot((sel + 1) % SLOTS);
    else if (e.key === 'Enter' && e.target === document.body) { if (store.slots[sel]) playSelected(); else $('sCreate').click(); }
    else if (e.key === 'Escape') $('sBack').click();
  } else if (screen === 'create' && e.key === 'Escape') $('cBack').click();
});

// ---------- hooks for the game loop ----------
function update(dt, t, focus) {
  time = t;
  if (screen === 'title') updateTitle(dt, focus);
  else if (screen === 'select') updateSelect(dt, focus);
  else if (screen === 'create') updateCreate(dt);
  updateFx(dt);
}
function render() {
  if (screen === 'create') renderCreate();
  else renderer.render(scene, camera);
}
RW.menu = { update, render, backToSelect, showTitle, get screen() { return screen; } };
RW.debug.menu = { slots, CR, pickSlot, showSelect, showCreate, showTitle };
showTitle();
})();
