// Russel World: game state, combat, monsters, NPCs, input, camera, HUD and the main loop.
(function () {
'use strict';
const RW = window.RW;
if (!RW || RW.failed || !RW.world) { document.getElementById('fallback').hidden = false; return; }
const { THREE, scene, camera, renderer, isTouch, timeU, rnd, clamp, lerp, smooth01, wrapAngle, V3, ITEMS, KINDS, RARITY, monsterStats, CAMPS, CAMPS_BY_MAP, GOLDEN, AREAS, SKILLS, STAT_KEYS, POINTS_PER_LEVEL, expNeed, derive, part, geoSphere, geoCyl, geoCone, geoBox, cachedGeo, lam } = RW;
const W = RW.world, UI = RW.UI, AU = RW.audio, sfx = AU.sfx;
const canvas = renderer.domElement, stage = document.getElementById('stage');
const tmpV = V3(0, 0, 0), tmpV2 = V3(0, 0, 0);

// ---------- events: the story listens to what happens in the game (kills, pickups, level ups...) ----------
const listeners = {};
RW.on = (ev, fn) => { (listeners[ev] = listeners[ev] || []).push(fn); };
function emit(ev, a, b) { for (const fn of listeners[ev] || []) { try { fn(a, b); } catch (e) { console.error(e); } } }
RW.emit = emit;
const blocked = () => !!(RW.comic && RW.comic.open);

// ---------- save data: up to 3 heroes on this device ----------
// v2 holds every slot; a v1 save (delivery 1, one hero) becomes slot 1 and keeps all its progress
const STORE_KEY = 'russelworld.save.v2', OLD_KEY = 'russelworld.save.v1';
function readJSON(key) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
function cleanHero(h) {
  if (!h || typeof h !== 'object') return null;
  const base = JSON.parse(JSON.stringify(RW.NEW_GAME));
  const c = Object.assign(base, h, { stats: Object.assign({}, base.stats, h.stats), look: Object.assign({}, base.look, h.look) });
  c.bag = (Array.isArray(c.bag) ? c.bag : []).filter((e) => ITEMS[e[0]] && e[1] > 0);
  if (!Array.isArray(c.hot) || c.hot.length !== 2) c.hot = base.hot.slice();
  for (const k of ['visited', 'chests', 'book', 'golden', 'seen']) if (!c[k] || typeof c[k] !== 'object') c[k] = {};
  if (!Array.isArray(c.titles)) c.titles = [];
  c.pets = (Array.isArray(c.pets) ? c.pets : []).filter((p) => p && RW.PETS[p.sp]);
  if (!c.pets.some((p) => p.id === c.petOn)) c.petOn = c.pets.length ? c.pets[0].id : null;
  if (c.egg && !RW.PET_EGGS[c.egg.kind]) c.egg = null;
  if (!AREAS[c.map]) c.map = 'meadow';
  delete c.settings; delete c.seenHelp;
  return c;
}
function loadStore() {
  const s = readJSON(STORE_KEY);
  const st = { v: 2, slots: [], last: 0, settings: { music: true, sfx: true }, seenHelp: false };
  if (s && s.v === 2 && Array.isArray(s.slots)) {
    Object.assign(st, s, { settings: Object.assign(st.settings, s.settings) });
    st.slots = s.slots.slice(0, RW.SLOTS).map(cleanHero);
  } else {
    const old = readJSON(OLD_KEY);
    if (old && old.v === 1) { st.slots = [cleanHero(old)]; if (old.settings) Object.assign(st.settings, old.settings); st.seenHelp = !!old.seenHelp; }
  }
  while (st.slots.length < RW.SLOTS) st.slots.push(null);
  if (!st.slots[st.last]) st.last = Math.max(0, st.slots.findIndex((h) => h));
  return st;
}
const store = loadStore();
let P = null, D = null, mode = 'menu';
AU.state.musicOn = store.settings.music; AU.state.sfxOn = store.settings.sfx;
if (typeof store.settings.musicVol === 'number') AU.state.musicVol = clamp(store.settings.musicVol, 0, 1);
if (typeof store.settings.sfxVol === 'number') AU.state.sfxVol = clamp(store.settings.sfxVol, 0, 1);
let dirty = false, saveT = 0, traveling = false;
function writeStore() {
  store.at = Date.now();
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* storage blocked: the game still runs, it just won't remember */ }
  if (RW.cloud) RW.cloud.queue();
}
function save() {
  if (P && mode === 'play' && !traveling) {
    P.map = player.dead ? 'meadow' : W.active;
    P.pos = player.dead ? null : { x: +player.pos.x.toFixed(2), z: +player.pos.z.toFixed(2) };
    P.face = +player.face.toFixed(3); P.hp = Math.max(1, Math.round(player.hp)); P.mp = Math.round(player.mp); P.ult = Math.floor(player.ult);
    P.petSaved = Date.now();
  }
  writeStore();
  dirty = false;
}

// ---------- labels and floating text ----------
const labelsEl = document.getElementById('labels');
function lbl(html) { const el = document.createElement('div'); el.className = 'lbl'; el.innerHTML = html; labelsEl.appendChild(el); return el; }
let VW = window.innerWidth, VH = window.innerHeight;
const projV = V3(0, 0, 0);
function place(el, pos, dy) {
  projV.copy(pos).project(camera);
  if (projV.z > 1 || projV.z < -1 || Math.abs(projV.x) > 1.2 || Math.abs(projV.y) > 1.2) { if (el.style.display !== 'none') el.style.display = 'none'; return false; }
  if (el.style.display === 'none') el.style.display = '';
  const x = (projV.x * 0.5 + 0.5) * VW, y = (-projV.y * 0.5 + 0.5) * VH + (dy || 0);
  el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-100%)';
  return true;
}
function hideEl(el) { if (el.style.display !== 'none') el.style.display = 'none'; }
function screenOf(pos) { projV.copy(pos).project(camera); return { x: (projV.x * 0.5 + 0.5) * VW, y: (-projV.y * 0.5 + 0.5) * VH, ok: projV.z < 1 && projV.z > -1 }; }
const floaters = [];
function floatText(html, cls, pos, dur) { const el = lbl('<div class="dmg ' + cls + '">' + html + '</div>'); floaters.push({ el, pos: pos.clone(), t: 0, dur: dur || 0.95, jx: rnd(-16, 16) }); }
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- effects ----------
const starTex = RW.canvasTex(64, 64, (g) => { g.translate(32, 32); g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 11 : 27, a = (i / 10) * Math.PI * 2 - Math.PI / 2; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fillStyle = '#fff6c8'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#3b2a1e'; g.stroke(); }, null);
const fx = [];
function spawnSpark(pos, big, color) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, transparent: true, depthWrite: false, depthTest: false, color: color || 0xffffff })); s.position.copy(pos); s.renderOrder = 5; scene.add(s); fx.push({ o: s, t: 0, dur: 0.28, kind: 'spark', big: big ? 1.5 : 1, rot: rnd(-1, 1) }); }
// a white crescent where a blade or stick connects
const slashTex = RW.canvasTex(128, 128, (g) => { g.translate(64, 64); g.rotate(-0.6); const gr = g.createLinearGradient(-50, 0, 50, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, 54, 30, 0, Math.PI * 1.05, Math.PI * 1.95); g.ellipse(0, 6, 50, 20, 0, Math.PI * 1.95, Math.PI * 1.05, true); g.fill(); }, null);
function spawnSlash(pos, ang, crit) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: slashTex, transparent: true, depthWrite: false, depthTest: false, color: crit ? 0xffd84d : 0xffffff, rotation: rnd(-1.2, 1.2) })); s.position.copy(pos); s.renderOrder = 6; scene.add(s); fx.push({ o: s, t: 0, dur: 0.22, kind: 'slash', big: crit ? 1.7 : 1.15 }); }
// a critical hit: a golden burst, a bright ring and a little shake of the camera
const burstTex = RW.canvasTex(128, 128, (g) => { g.translate(64, 64); for (let i = 0; i < 12; i++) { g.rotate(Math.PI / 6); const gr = g.createLinearGradient(0, 0, 0, -62); gr.addColorStop(0, 'rgba(255,240,170,1)'); gr.addColorStop(1, 'rgba(255,200,60,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(-5, 0); g.lineTo(0, i % 2 ? -46 : -62); g.lineTo(5, 0); g.fill(); } const c = g.createRadialGradient(0, 0, 2, 0, 0, 26); c.addColorStop(0, 'rgba(255,255,240,1)'); c.addColorStop(1, 'rgba(255,220,120,0)'); g.fillStyle = c; g.fillRect(-30, -30, 60, 60); }, null);
let shakeT = 0;
function critBurst(pos) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: burstTex, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending })); s.position.copy(pos); s.renderOrder = 6; scene.add(s); fx.push({ o: s, t: 0, dur: 0.4, kind: 'burst', rot: rnd(-0.5, 0.5) }); spawnRing(V3(pos.x, pos.y - 0.5, pos.z), 0xffd84d, 2.2, 0.35); shakeT = Math.max(shakeT, 0.14); }
const ringGeo = new THREE.RingGeometry(0.85, 1, 40); ringGeo.rotateX(-Math.PI / 2);
function spawnRing(pos, color, size, dur) { const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide })); m.position.copy(pos); m.position.y += 0.08; m.renderOrder = 3; scene.add(m); fx.push({ o: m, t: 0, dur: dur || 0.5, kind: 'ring', size }); }
function spawnPuff(pos, color, up) { const m = new THREE.Mesh(geoSphere(0.12, 6, 4), new THREE.MeshBasicMaterial({ color: color || 0xf3ead6, transparent: true, opacity: 0.7, depthWrite: false })); m.position.copy(pos); scene.add(m); fx.push({ o: m, t: 0, dur: up ? 0.9 : 0.5, kind: 'puff', vy: up ? rnd(0.8, 1.6) : 0.25, vx: rnd(-0.4, 0.4), vz: rnd(-0.4, 0.4) }); }
const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 9, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff1a8, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
pillar.visible = false; scene.add(pillar);
let pillarT = -1;
const clickRing = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: 0, depthWrite: false })); clickRing.renderOrder = 3; scene.add(clickRing);
let clickT = 1;
function updateFx(dt) {
  for (let i = fx.length - 1; i >= 0; i--) {
    const f = fx[i]; f.t += dt; const k = f.t / f.dur;
    if (k >= 1) { scene.remove(f.o); if (f.o.material) f.o.material.dispose(); if (f.done) f.done(f); fx.splice(i, 1); continue; }
    if (f.update) { if (f.update(f, k, dt) === false) { scene.remove(f.o); fx.splice(i, 1); } continue; }
    if (f.kind === 'spark') { const s = (0.35 + k * 0.9) * f.big; f.o.scale.set(s, s, 1); f.o.material.opacity = 1 - k; f.o.material.rotation = f.rot * k; }
    else if (f.kind === 'slash') { const s = (0.8 + k * 0.7) * f.big; f.o.scale.set(s, s, 1); f.o.material.opacity = 1 - k * k; }
    else if (f.kind === 'burst') { const s = 0.8 + k * 2.4; f.o.scale.set(s, s, 1); f.o.material.opacity = 1 - k; f.o.material.rotation = f.rot * k; }
    else if (f.kind === 'ring') { const s = 0.3 + k * f.size; f.o.scale.set(s, 1, s); f.o.material.opacity = 0.85 * (1 - k); }
    else { f.o.position.y += f.vy * dt; f.o.position.x += f.vx * dt; f.o.position.z += f.vz * dt; const s = 1 + k * 1.6; f.o.scale.set(s, s, s); f.o.material.opacity = 0.7 * (1 - k); }
  }
  if (pillarT >= 0) { pillarT += dt; const k = pillarT / 1.6; if (k >= 1) { pillar.visible = false; pillarT = -1; } else { pillar.visible = true; pillar.position.set(player.pos.x, player.pos.y + 4.5, player.pos.z); pillar.material.opacity = 0.55 * Math.sin(Math.PI * k); const s = 0.6 + k * 0.6; pillar.scale.set(s, 1, s); } }
  if (clickT < 1) { clickT += dt * 2.2; const s = 0.9 - clickT * 0.6; clickRing.scale.set(s, 1, s); clickRing.material.opacity = 0.9 * (1 - clickT); }
}

// ---------- the player ----------
// the hero model sits inside a holder, so a different hero can be swapped in without touching the rest of the game
const holder = new THREE.Group(); holder.visible = false; scene.add(holder);
let hero = null;
const player = {
  pos: holder.position, face: W.SPAWN.face, hp: 1, mp: 0, ult: 0,
  dest: null, target: null, pickTarget: null, npcTarget: null, action: null, atkCd: 0, combo: 0, lastAtk: -99,
  rallyT: 0, lastHurt: -99, lastFight: -99, dead: 0, idleT: 0, blinkT: 2.5, fidgetT: 0, runPh: 0, dustT: 0, sitting: false, sitT: 0, zone: null,
  cds: [0, 0, 0, 0, 0, 0], buffs: {}, poison: null, stun: 0, freeze: 0
};
const pose = { runW: 0, actW: 0, sitW: 0, act: null, lastFace: player.face };
const heroTag = lbl('<div class="tag"></div>'); heroTag.style.display = 'none';
// ---------- jobs: the hero's own job, or one borrowed for a moment at a master (to try it, or for the trial) ----------
let tempJob = null;
const jobNow = () => (tempJob ? tempJob.job : (P && P.job) || 'novice');
const weaponNow = () => (tempJob ? tempJob.weapon : P && P.job !== 'novice' ? P.weapon : 'stick');
function buffSum(k) { let s = 0; for (const id in player.buffs) { const b = player.buffs[id]; if (b.t > 0 && b[k]) s += b[k]; } return s; }
function rederive() {
  if (!P) return;
  const hp = D ? player.hp / D.maxHp : 1, mp = D ? player.mp / D.maxMp : 1;
  D = derive(P, jobNow(), weaponNow());
  if (player.hp > 0) player.hp = Math.min(D.maxHp, Math.max(1, hp * D.maxHp)); player.mp = Math.min(D.maxMp, mp * D.maxMp);
}
// the hero's name tag: the title they chose (from the monster book), or their job, underneath
// the hero's name floats over the head; the worn title sits on the HP/MP card next to the coins
function refreshHeroTag() { if (!P) return; heroTag.firstChild.textContent = P.name; const ht = document.getElementById('heroTitle'); if (ht) { ht.textContent = P.title || ''; ht.hidden = !P.title; } }
const sitZ = lbl('<div class="sitz">z z</div>'); sitZ.style.display = 'none';
const dizzyStars = lbl('<div class="sitz">★ ✦ ★</div>'); dizzyStars.style.display = 'none';
function setHero(look) {
  if (hero) holder.remove(hero.root);
  hero = RW.chibi(RW.lookOpts(look, jobNow(), weaponNow(), RW.gear && P ? RW.gear.looks(P) : null));
  holder.add(hero.root);
  hero.wBase = hero.j.weapon ? hero.j.weapon.rotation.x : 2.2;
  hero.oBase = hero.j.offhand ? hero.j.offhand.rotation.x : 0;
  if (hero.j.offhand) hero.oRest = { p: hero.j.offhand.position.clone(), r: hero.j.offhand.rotation.clone() };
  const o = hero.opts;
  RW.paintPortrait(document.getElementById('portrait'), { skin: o.skin, iris: o.iris, hairColor: o.hairColor, girl: o.gender === 'girl', hair: o.hair });
}

// ---------- NPCs ----------
const npcs = W.NPC_SPOTS.map((s) => {
  const c = RW.npcModel(s.id);
  c.root.position.set(s.x, W.height(s.x, s.z), s.z); c.root.rotation.y = s.face;
  scene.add(c.root);
  const tag = lbl('<div class="qmark"></div><div class="tag npc">' + esc(s.name) + '<span class="role">' + esc(s.role) + '</span></div>');
  return Object.assign({}, s, { c, tag, qm: tag.firstChild, line: 0, blinkT: rnd(1, 4), home: s.face, look: s.face, t: rnd(0, 6), face: 'normal' });
});
const here = (o) => o.map === W.active; // only people and things in the map you stand in can be seen and clicked
// show an NPC's expression on their 3D face (used while they talk)
function npcFace(n, expr) {
  if (!n || !n.c.j.faceMat || n.face === expr) return;
  n.face = expr;
  n.c.j.faceOpen = RW.faceVariant(n.c.opts, expr);
  n.c.j.faceClosed = RW.faceVariant(n.c.opts, expr === 'surprised' ? 'surprised' : 'happy');
  n.c.j.faceMat.map = n.c.j.faceOpen; n.c.j.faceMat.needsUpdate = true;
}

// ---------- spots: things you can click that are not people (the notice board, a lost hammer...) ----------
const spots = [];
function addSpot(o) {
  const s = Object.assign({ range: 2.2, y: 0.8, label: '' }, o);
  s.y0 = W.height(s.x, s.z); s.map = W.mapAt(s.x, s.z);
  if (s.model) { s.model.position.set(s.x, s.y0, s.z); scene.add(s.model); s.model.visible = here(s); }
  s.tag = lbl('<div class="qmark"></div><div class="tag spot"></div>'); s.qm = s.tag.firstChild; s.tag.lastChild.textContent = s.label;
  if (!s.label) s.tag.lastChild.style.display = 'none';
  s.tag.style.display = 'none';
  spots.push(s); return s;
}
function removeSpot(id) {
  for (let i = spots.length - 1; i >= 0; i--) if (spots[i].id === id) { const s = spots[i]; if (s.model) scene.remove(s.model); s.tag.remove(); spots.splice(i, 1); if (player.spotTarget === s) player.spotTarget = null; }
}

// ---------- monsters ----------
const monsters = [];
function nameColor(lv) { const d = lv - (P ? P.lv : 1); return d <= -3 ? '#c9c4bb' : d <= 1 ? '#fff8ea' : d <= 3 ? '#ffb45c' : '#ff7a6e'; }
function spawnMonster(kind, lv, x, z, golden) {
  const k = KINDS[kind], st = monsterStats(kind, lv), p = RW.MONSTER_BUILD[kind]();
  let scale = k.scale * (1 + (lv - k.baseLv) * 0.07);
  if (golden) {
    RW.goldify(p); scale *= GOLDEN.scale;
    st.hp = Math.round(st.hp * GOLDEN.hp); st.dmg = st.dmg.map((d) => d * GOLDEN.dmg); st.exp = Math.round(st.exp * GOLDEN.exp); st.coins = st.coins.map((c) => Math.round(c * GOLDEN.coins));
  }
  p.root.scale.setScalar(scale);
  p.root.add(RW.blob(k.move === 'trot' ? 1.9 : 1.5));
  scene.add(p.root);
  const m = { kind, lv, k, st, p, scale, root: p.root, body: p.body, home: V3(x, 0, z), pos: p.root.position, hp: st.hp, alive: true, dying: 0, respawnAt: 0, aggro: false, atkCd: 0, atk: null, wTarget: null, wPause: rnd(0, 3), hop: 0, t: rnd(0, 10), hurtT: 0, kb: null, face: 'normal', show: 0, active: true, golden: !!golden, chg: null, chgCd: rnd(1, 3) };
  m.pos.set(x, W.height(x, z), z); m.root.rotation.y = rnd(0, 6);
  m.tag = lbl('<div class="tag mon' + (golden ? ' gold' : '') + '"><span></span></div><div class="mhp"><i></i></div>');
  m.tagName = m.tag.querySelector('span'); m.tagName.textContent = (golden ? '★ Golden ' : '') + k.name + ' · Lv. ' + lv; m.tagHp = m.tag.querySelector('i'); m.tag.style.display = 'none';
  m.tagName.style.color = golden ? '#ffd84d' : nameColor(lv);
  monsters.push(m);
  return m;
}
// every map keeps its own monsters; leaving a map puts them away, coming back brings them out fresh
const parked = {};
function spawnCamps(id) {
  for (const [kind, lv, cx, cz, n, spread] of CAMPS_BY_MAP[id]) {
    for (let i = 0; i < n; i++) {
      let x = cx, z = cz, g = 0;
      do { const a = rnd(0, Math.PI * 2), r = rnd(0, spread); x = cx + Math.cos(a) * r; z = cz + Math.sin(a) * r; } while (!W.walkable(x, z, true) && g++ < 20);
      spawnMonster(kind, lv, x, z);
    }
  }
}
spawnCamps('meadow');
function parkMonsters() {
  const id = W.active, keep = [];
  for (const m of monsters) {
    if (m.quest || m.golden) { m.gone = true; scene.remove(m.root); m.tag.remove(); continue; }
    scene.remove(m.root); hideEl(m.tag); m.aggro = false; m.atk = null; m.chg = null; keep.push(m);
  }
  parked[id] = keep; monsters.length = 0;
  if (player.target) player.target = null;
}
function unparkMonsters(id) {
  const list = parked[id];
  if (!list) { spawnCamps(id); return; }
  for (const m of list) {
    m.pos.set(m.home.x, W.height(m.home.x, m.home.z), m.home.z); m.hp = m.st.hp; m.alive = true; m.dying = 0; m.root.visible = true; m.wTarget = null; m.kb = null;
    m.body.scale.set(1, 1, 1); m.body.rotation.set(0, 0, 0); m.body.position.set(0, 0, 0); setFace(m, 'normal');
    scene.add(m.root); monsters.push(m);
  }
  delete parked[id];
}
function setFace(m, st) { if (m.face !== st) { m.face = st; m.p.mat.map = m.p.faces[st]; m.p.mat.needsUpdate = true; } }

// ---------- items on the ground ----------
const items = [];
function dropItem(id, n, pos, spread) {
  const a = rnd(0, Math.PI * 2), r = spread ? rnd(0.3, spread) : 0;
  const x = pos.x + Math.cos(a) * r, z = pos.z + Math.sin(a) * r;
  const root = new THREE.Group(); root.position.set(x, W.height(x, z), z);
  const rar = id === 'coin' ? RARITY.common : RARITY[ITEMS[id].rarity];
  const ring = new THREE.Mesh(cachedGeo('jring', () => new THREE.RingGeometry(0.3, 0.5, 24)), new THREE.MeshBasicMaterial({ color: id === 'coin' ? 0xffe48a : rar.ring, transparent: true, opacity: 0.55, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; root.add(ring);
  const spin = RW.dropModel(id === 'coin' ? null : id); spin.position.y = 0.35; root.add(spin);
  scene.add(root);
  const name = id === 'coin' ? n + ' coins' : ITEMS[id].name;
  const tag = lbl('<div class="tag item"></div>'); tag.firstChild.textContent = name; if (id !== 'coin' && ITEMS[id].rarity !== 'common') tag.firstChild.style.color = rar.color;
  items.push({ id, n, root, spin, ring, pos: root.position, t: rnd(0, 5), tag, life: 60 });
}
function bagCount(id) { const e = P.bag.find((b) => b[0] === id); return e ? e[1] : 0; }
function bagAdd(id, n) { const e = P.bag.find((b) => b[0] === id); if (e) e[1] += n; else P.bag.push([id, n]); dirty = true; }
function bagTake(id, n) { const e = P.bag.find((b) => b[0] === id); if (!e || e[1] < n) return false; e[1] -= n; if (e[1] <= 0) P.bag.splice(P.bag.indexOf(e), 1); dirty = true; return true; }
function pickup(it) {
  scene.remove(it.root); it.tag.remove(); items.splice(items.indexOf(it), 1); player.pickTarget = null;
  if (it.id === 'coin') { P.coins += it.n; sfx.coin(); floatText('+' + it.n, 'coin', V3(player.pos.x, player.pos.y + 1.7, player.pos.z)); emit('coins', it.n); }
  else if (ITEMS[it.id].kind === 'quest') { sfx.sparkle(); emit('pickup', it.id, it.n); }
  else if (ITEMS[it.id].kind === 'gear') { if (RW.gear) RW.gear.pickup(it.id); }
  else {
    bagAdd(it.id, it.n); const itm = ITEMS[it.id], rar = RARITY[itm.rarity];
    if (itm.rarity === 'common') { sfx.pick(); UI.toast('+' + it.n + ' ' + esc(itm.name)); }
    else { sfx.level(); UI.toast('<b style="color:' + rar.ink + '">' + rar.name + '!</b> ' + esc(itm.name), true); emit('rare', it.id); }
    emit('pickup', it.id, it.n);
  }
  dirty = true; UI.syncCoins(); if (UI.isOpen('bagPanel')) UI.renderBag();
}

// ---------- combat ----------
let hitStop = 0, time = 0;
// damage: body hits use attack, spells use magic attack; an element the monster is weak to hits much harder, its own element much softer
function rollDamage(m, mult, o) {
  o = o || {};
  const missChance = clamp(0.05 + (m.lv - P.lv) * 0.04, 0.02, 0.4) * (o.magic ? 0.5 : 1);
  if (!m.k.target && Math.random() < missChance) return { miss: true };
  if (o.flat) { // a pet's hit: its own attack, not the hero's
    let pd = o.flat * mult * rnd(0.9, 1.1) - m.st.def * 0.6;
    if (o.element) { if (m.k.weak === o.element) pd *= 1.5; else if (m.k.element === o.element) pd *= 0.7; }
    const pc = Math.random() < 0.06; if (pc) pd *= 1.6;
    return { dmg: Math.max(1, Math.round(pd)), crit: pc };
  }
  let d = (o.magic ? D.matk : D.atk) * mult * rnd(0.9, 1.1) * (player.rallyT > 0 ? 1.3 : 1) * (1 + buffSum('atk')) - m.st.def * (o.magic ? 0.5 : 1);
  if (o.element) { if (m.k.weak === o.element) d *= 1.5; else if (m.k.element === o.element) d *= 0.7; }
  const crit = Math.random() < D.crit + buffSum('crit'); if (crit) d *= 1.8;
  return { dmg: Math.max(1, Math.round(d)), crit };
}
const ELCOL = { fire: 0xff8a3d, water: 0x7cc8ff, earth: 0xc8a06a, wind: 0xb8f0d8 };
// o: { magic, element, stun, freeze, poison: { t, dps }, color, fromX, fromZ }
function hitMonster(m, mult, kbDist, heavy, melee, o) {
  if (!m.alive) return;
  o = o || {};
  player.lastFight = time;
  if (m.k.magicOnly && !o.magic) { floatText('<small>NEEDS MAGIC</small>…', 'miss', V3(m.pos.x, m.pos.y + 1.8, m.pos.z)); sfx.miss(); return; }
  const r = rollDamage(m, mult, o), head = tmpV.copy(m.pos); head.y += (m.k.headY + 0.6) * m.scale;
  if (r.miss) { floatText('Miss', 'miss', head); sfx.miss(); }
  else {
    m.hp -= r.dmg;
    if (m.practice) m.hp = Math.max(1, m.hp);
    if (r.crit) { floatText('<small>CRITICAL</small>' + r.dmg, 'crit', head, 1.25); sfx.crit(); } else { floatText(String(r.dmg), heavy ? 'big' : o.element ? 'el el-' + o.element : '', head); if (heavy) sfx.heavy(); else sfx.hit(); }
    const fx0 = o.fromX != null ? V3(o.fromX, 0, o.fromZ) : player.pos;
    const dir = tmpV2.subVectors(m.pos, fx0).setY(0); if (dir.lengthSq() < 0.0001) dir.set(0, 0, 1); dir.normalize();
    const at = V3(m.pos.x - dir.x * 0.4 * m.scale, m.pos.y + 0.6 * m.scale + (m.k.fly || 0) * 0, m.pos.z - dir.z * 0.4 * m.scale);
    spawnSpark(at, r.crit || heavy, o.element ? ELCOL[o.element] : o.color);
    if (melee) spawnSlash(at, Math.atan2(dir.x, dir.z), r.crit);
    if (r.crit) critBurst(at);
    if (!m.k.target || m.k.move === 'still') m.kb = { x: dir.x, z: dir.z, d: (kbDist || 0.3) * (r.crit ? 1.6 : 1) * (m.chg && m.chg.phase === 'run' ? 0.2 : 1) * (m.k.speed === 0 ? 0 : 1), t: 0 };
    if (o.stun) { m.stun = Math.max(m.stun || 0, o.stun); m.atk = null; m.chg = null; floatText('<small>DIZZY</small>', 'miss', V3(head.x, head.y + 0.4, head.z)); }
    if (o.freeze) { m.freeze = Math.max(m.freeze || 0, o.freeze); m.atk = null; m.chg = null; floatText('<small>FROZEN</small>', 'el el-water', V3(head.x, head.y + 0.4, head.z)); }
    if (o.poison) m.poison = { t: o.poison.t, dps: o.poison.dps, acc: 0 };
    if (o.slow) { m.slowT = Math.max(m.slowT || 0, o.slow); floatText('<small>SLOW</small>', 'el el-water', V3(head.x, head.y + 0.4, head.z)); }
    if (o.pet) m.petHit = true;
    m.hurtT = 0.38; m.show = 4; if (m.atk && m.atk.phase === 'wind') m.atk = null;
    if (m.k.move === 'waddle' && Math.random() < 0.5) for (let i = 0; i < 3; i++) spawnPuff(V3(m.pos.x + rnd(-0.3, 0.3), m.pos.y + 0.9 * m.scale, m.pos.z + rnd(-0.3, 0.3)), m.kind === 'moss_mushling' ? 0xc8f0b0 : 0xf6e6c4, true);
    // Thornhogs prick you back when you hit them up close with a plain attack (never enough to knock you out)
    if (melee && m.k.thorns) setTimeout(() => thornPrick(m), 120);
    if (!o.pet && !m.k.target) emit('hit', m);
    if (!o.pet) { player.ult = Math.min(100, player.ult + 9); hitStop = Math.max(hitStop, r.crit || heavy ? 0.09 : 0.06); }
  }
  if (!m.aggro && !m.k.passive && !m.practice) {
    m.aggro = true; m.atkCd = 0.9;
    if (m.k.helpers) for (const o of monsters) if (o !== m && o.alive && !o.aggro && o.kind === m.kind && o.pos.distanceTo(m.pos) < 6 && Math.random() < m.k.helpers) { o.aggro = true; o.atkCd = rnd(0.8, 1.6); o.show = 4; }
  }
  if (m.hp <= 0) killMonster(m);
}
function thornPrick(m) {
  if (player.dead || !P) return;
  const dmg = Math.min(Math.round((3 + m.lv * 0.9) * m.k.thorns), Math.max(0, Math.ceil(player.hp) - 1));
  if (dmg <= 0) return;
  player.hp -= dmg; player.lastHurt = time;
  floatText('<small>THORNS</small>-' + dmg, 'hurt', V3(player.pos.x + 0.3, player.pos.y + 1.6, player.pos.z)); sfx.thorn();
  spawnSpark(V3(player.pos.x, player.pos.y + 1.0, player.pos.z), false);
  emit('thorns', m);
  if (m.k.poison && Math.random() < m.k.poison) poisonPlayer();
}
function killMonster(m) {
  m.alive = false; m.dying = 0.001; m.aggro = false; m.atk = null; m.chg = null; hideEl(m.tag); m.p.sweat.visible = false; m.p.stars.visible = false;
  if (m.k.die === 'melt') sfx.melt(); else if (m.k.die === 'tip') sfx.tip(); else sfx.spore();
  if (player.target === m) player.target = null;
  if (m.k.target) { emit('kill', m); return; } // training targets give nothing
  const diff = m.lv - P.lv, mult = diff <= -4 ? 0.4 : diff <= -2 ? 0.75 : 1;
  gainExp(Math.max(1, Math.round(m.st.exp * mult)));
  P.kills++; P.seen[m.kind] = (P.seen[m.kind] || 0) + 1; dirty = true;
  if (m.golden) P.golden[m.kind] = true;
  emit('kill', m);
}
function rollDrops(m) {
  if (m.k.target) return;
  const cm = RW.pets ? RW.pets.coinMult() : 1;
  dropItem('coin', Math.round((rnd(m.st.coins[0], m.st.coins[1] + 0.99) - 0.49) * cm), m.pos, 0.9);
  if (RW.pets) RW.pets.drops(m);
  if (RW.gear) RW.gear.drops(m);
  if (m.golden) { for (const [id, chance] of GOLDEN.drops) if (Math.random() < chance) dropItem(id, 1, m.pos, 1.4); dropItem('coin', Math.round(m.st.coins[1] * 0.6), m.pos, 1.6); }
  let n = 0;
  for (const [id, chance] of m.k.drops) {
    const luck = ITEMS[id].rarity === 'common' ? 1 : D.luck;
    if (Math.random() < chance * luck) { dropItem(id, 1, m.pos, 1.2); if (++n >= 2) break; }
  }
}
function gainExp(n) {
  if (P.lv >= 50) return;
  P.exp += n;
  floatText('+' + n + ' EXP', 'heal', V3(player.pos.x, player.pos.y + 2.1, player.pos.z), 1.1);
  while (P.exp >= expNeed(P.lv) && P.lv < 50) {
    P.exp -= expNeed(P.lv); P.lv++; P.pts += POINTS_PER_LEVEL;
    D = derive(P, jobNow(), weaponNow()); player.hp = D.maxHp; player.mp = D.maxMp;
    pillarT = 0; sfx.level(); UI.toast('LEVEL UP!  Lv. ' + P.lv, true); spawnRing(player.pos, 0xfff1a8, 3.2, 0.9);
    setTimeout(() => UI.toast('+' + POINTS_PER_LEVEL + ' stat points. Press C or the star button to spend them.'), 1200);
    floatText('LEVEL UP', 'lvl', V3(player.pos.x, player.pos.y + 2.0, player.pos.z), 1.6);
    for (const m of monsters) m.tagName.style.color = nameColor(m.lv);
    if (UI.isOpen('statPanel')) UI.renderStats();
    save();
    emit('levelup', P.lv);
  }
  dirty = true;
}
function hurtPlayer(dmg, big) {
  if (player.dead) return;
  const head = V3(player.pos.x, player.pos.y + 1.75, player.pos.z);
  if (!big && Math.random() < D.dodge) { floatText('Dodge', 'miss', head); return; }
  dmg = Math.max(1, Math.round(dmg * (1 - Math.min(0.75, buffSum('guard'))) - D.def * (1 + buffSum('def')) * 0.5)); // v1.4: guard = less damage taken (Shield Wall, tank pets)
  player.hp -= dmg; player.lastHurt = time; player.lastFight = time; player.ult = Math.min(100, player.ult + 4);
  if (player.sitting) standUp();
  floatText(big ? '<small>CHARGE!</small>-' + dmg : '-' + dmg, big ? 'hurt bighurt' : 'hurt', head); sfx.hurt();
  if (player.hp <= 0) { player.hp = 0; faint(); }
  else emit('hurt', player.hp / D.maxHp);
}
// status effects on the hero: poison drains HP slowly (never below 1), dizziness and freezing stop you for a moment
function poisonPlayer() {
  if (player.dead) return;
  const fresh = !player.poison;
  player.poison = { t: 6, dps: Math.max(2, Math.round(D.maxHp * 0.015)), acc: 0 };
  if (fresh) { floatText('<small>POISONED</small>', 'poison', V3(player.pos.x, player.pos.y + 2.0, player.pos.z), 1.2); sfx.thorn(); emit('status', 'poison'); }
}
function stunPlayer(t) {
  if (player.dead) return;
  player.stun = Math.max(player.stun, t); player.action = null; player.dest = null;
  floatText('<small>DIZZY</small>', 'miss', V3(player.pos.x, player.pos.y + 2.0, player.pos.z), 1.2); emit('status', 'stun');
}
function faint() {
  player.poison = null; player.stun = 0; player.freeze = 0;
  player.dead = 0.001; player.target = null; player.dest = null; player.action = null; player.pickTarget = null; player.npcTarget = null; player.spotTarget = null;
  for (const m of monsters) { m.aggro = false; m.atk = null; m.chg = null; }
  sfx.faint(); UI.closeAll();
  emit('faint');
}
function reviveInTown() {
  player.dead = 0; hero.rig.rotation.set(0, 0, 0); hero.rig.position.y = 0;
  const lose = Math.min(P.exp, Math.round(expNeed(P.lv) * 0.05));
  P.exp -= lose;
  if (W.active !== 'meadow') switchMap('meadow');
  player.pos.set(W.SPAWN.x, W.height(W.SPAWN.x, W.SPAWN.z), W.SPAWN.z); player.face = W.SPAWN.face;
  player.hp = Math.round(D.maxHp * 0.6); player.mp = Math.round(D.maxMp * 0.6);
  cam.tx = player.pos.x; cam.tz = player.pos.z;
  sfx.revive(); UI.toast('You fainted and woke up in Mossbrook. Lost ' + lose + ' EXP.');
  save();
  emit('revive');
}

// attack choreography: keys are [t, armRx, armRz, elbowR, twist, lean, jump]
const REST = [0, -0.05, -0.12, -0.35, 0, 0.06, 0];
const ACTIONS = {
  combo0: { dur: 0.5, hit: 0.56, mult: 1, kb: 0.3, keys: [REST, [0.32, 1.75, -1.15, -0.9, -0.65, 0.02, 0], [0.58, -0.9, 0.6, -0.2, 0.62, 0.22, 0], [1, ...REST.slice(1)]], step: [[0.32, 0.32, 0.58]] },
  combo1: { dur: 0.5, hit: 0.52, mult: 1.1, kb: 0.32, keys: [[0, -0.5, 0.6, -0.9, 0.5, 0.12, 0], [0.26, -0.3, 0.95, -1.4, 0.75, 0.06, 0], [0.52, -0.75, -1.25, -0.15, -0.68, 0.2, 0], [1, ...REST.slice(1)]], step: [[0.24, 0.26, 0.52], [-0.14, 0.7, 1]] },
  combo2: { dur: 0.8, hit: 0.62, mult: 1.6, kb: 0.75, heavy: true, keys: [REST, [0.38, 3.0, -0.25, -0.7, 0, -0.14, 0.3], [0.62, -1.3, 0, -0.1, 0, 0.4, 0], [1, ...REST.slice(1)]], step: [[0.3, 0.3, 0.62]] },
  bash: { dur: 0.8, hit: 0.6, mult: 1.9, kb: 0.9, heavy: true, keys: [REST, [0.4, 2.95, -0.3, -0.6, -0.2, -0.18, 0.5], [0.6, -1.25, 0.1, -0.1, 0.2, 0.42, 0], [1, ...REST.slice(1)]], step: [[0.45, 0.2, 0.6]] },
  pebble: { dur: 0.62, hit: 0.56, keys: [REST, [0.42, 1.9, -0.4, -1.3, -0.5, -0.05, 0], [0.56, -1.5, -0.3, -0.2, 0.5, 0.25, 0], [1, ...REST.slice(1)]] },
  rally: { dur: 0.9, hit: 0.5, keys: [REST, [0.5, 3.0, -0.2, -0.2, 0, -0.1, 0.1], [1, ...REST.slice(1)]] },
  whirl: { dur: 0.85, hit: 0.45, keys: [REST, [0.15, 0, -1.5, -0.1, 0, 0.1, 0], [0.85, 0, -1.5, -0.1, 0, 0.1, 0], [1, ...REST.slice(1)]], spin: 2 },
  ult: { dur: 1.1, hit: 0.62, keys: [REST, [0.45, 3.1, -0.2, -0.5, 0, -0.2, 0.75], [0.62, -1.35, 0, -0.1, 0, 0.45, 0], [1, ...REST.slice(1)]], step: [[0.4, 0.3, 0.62]] },
  // job moves (delivery 5): plain shots and spells are 'basic' (a skill cuts them short), the rest are skills
  shoot: { dur: 0.55, hit: 0.55, basic: true, ranged: true, bow: true, keys: [REST, [0.4, -1.35, -0.15, -1.9, 0.35, 0.0, 0], [0.55, -1.4, -0.2, -0.5, 0.3, 0.02, 0], [1, ...REST.slice(1)]] },
  sling: { dur: 0.5, hit: 0.52, basic: true, ranged: true, keys: [REST, [0.4, 1.9, -0.4, -1.3, -0.5, -0.05, 0], [0.52, -1.5, -0.3, -0.2, 0.5, 0.25, 0], [1, ...REST.slice(1)]] },
  cast: { dur: 0.55, hit: 0.5, basic: true, ranged: true, keys: [REST, [0.35, -0.2, -0.3, -1.2, -0.3, -0.05, 0], [0.5, -1.45, -0.1, -0.2, 0.3, 0.2, 0], [1, ...REST.slice(1)]] },
  fire: { dur: 0.48, hit: 0.35, basic: true, ranged: true, keys: [REST, [0.28, -1.5, -0.1, -0.1, 0.1, 0, 0], [0.45, -1.3, -0.1, -0.5, 0.05, -0.08, 0], [1, ...REST.slice(1)]] },
  zap: { dur: 0.4, hit: 0.3, basic: true, ranged: true, keys: [REST, [0.25, -1.5, -0.1, -0.1, 0.1, 0, 0], [0.4, -1.4, -0.1, -0.3, 0.05, -0.05, 0], [1, ...REST.slice(1)]] },
  beam: { dur: 0.75, hit: 0.4, keys: [REST, [0.3, -1.5, -0.1, -0.1, 0.1, 0, 0], [0.7, -1.5, -0.1, -0.2, 0.05, -0.1, 0], [1, ...REST.slice(1)]] },
  cleave: { dur: 0.6, hit: 0.52, keys: [REST, [0.3, 1.4, -1.4, -0.4, -0.9, 0.02, 0], [0.55, -0.6, 1.2, -0.2, 0.95, 0.22, 0], [1, ...REST.slice(1)]], step: [[0.4, 0.3, 0.55]] },
  rush: { dur: 0.75, hit: 0.62, keys: [REST, [0.35, 2.9, -0.3, -0.6, -0.2, 0.3, 0.1], [0.62, -1.25, 0.1, -0.1, 0.2, 0.42, 0], [1, ...REST.slice(1)]],
    move: (a, k, dt) => { const t = a.target; if (!t || !t.alive || k > 0.6) return; const dx = t.pos.x - player.pos.x, dz = t.pos.z - player.pos.z, d = Math.hypot(dx, dz), reach = 1.2 + t.k.radius * t.scale / 0.72; if (d > reach) { const st = Math.min(d - reach, 16 * dt); W.tryMove(player.pos, player.pos.x + dx / d * st, player.pos.z + dz / d * st, false); if (Math.random() < 0.6) spawnPuff(V3(player.pos.x, player.pos.y + 0.1, player.pos.z)); } } },
  buff: { dur: 0.9, hit: 0.5, keys: [REST, [0.5, 3.0, -0.2, -0.2, 0, -0.1, 0.1], [1, ...REST.slice(1)]] },
  slam: { dur: 0.8, hit: 0.6, keys: [REST, [0.4, 2.95, -0.3, -0.6, -0.2, -0.18, 0.5], [0.6, -1.25, 0.1, -0.1, 0.2, 0.42, 0], [1, ...REST.slice(1)]] }
};
['combo0', 'combo1', 'combo2', 'bash', 'ult', 'pebble', 'cleave', 'rush', 'slam'].forEach((key) => { ACTIONS[key].strike = 1; });
['combo0', 'combo1', 'combo2'].forEach((key) => { ACTIONS[key].basic = true; });
const RANGED_ACT = { bow: 'shoot', slingshot: 'sling', staff: 'cast', book: 'cast', missileArm: 'fire', laserCannon: 'zap' };
const easeOutBack = (x) => 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2);
function sampleKeys(keys, k, strikeSeg) {
  let i = 0; while (i < keys.length - 2 && k > keys[i + 1][0]) i++;
  const a = keys[i], b = keys[i + 1], raw = clamp((k - a[0]) / Math.max(0.0001, b[0] - a[0]), 0, 1), u = i === strikeSeg ? easeOutBack(raw) : smooth01(raw);
  const out = []; for (let n = 1; n < a.length; n++) out.push(lerp(a[n], b[n], u)); return out;
}
function stepAt(steps, k) { let s = 0; if (steps) for (const [d, k0, k1] of steps) s += d * smooth01(clamp((k - k0) / (k1 - k0), 0, 1)); return s; }

// ---------- skills and potions ----------
function deny(msg) { UI.toast(msg); sfx.deny(); return false; }
function nearestMonster(range) {
  if (player.target && player.target.alive && player.target.pos.distanceTo(player.pos) < range + 0.8) return player.target;
  let best = null, bd = range; for (const m of monsters) { if (!m.alive || !m.active) continue; const d = m.pos.distanceTo(player.pos); if (d < bd) { bd = d; best = m; } } return best;
}
const CURED = { poison: 'poisoned', stun: 'dizzy', freeze: 'frozen' };
function usePotion(id) {
  const it = ITEMS[id];
  if (!it || it.kind !== 'potion') return false;
  if (bagCount(id) <= 0) return deny('No ' + it.name + ' left. Mira sells more in Mossbrook.');
  if (it.heal && player.hp >= D.maxHp - 0.5) return deny('HP is already full.');
  if (it.mana && player.mp >= D.maxMp - 0.5) return deny('MP is already full.');
  if (it.cure && !it.warm) { const on = it.cure === 'poison' ? !!player.poison : player[it.cure] > 0; if (!on) return deny('You are not ' + CURED[it.cure] + '.'); }
  bagTake(id, 1);
  const head = V3(player.pos.x, player.pos.y + 1.8, player.pos.z);
  if (it.heal) { const h = Math.round(Math.min(it.heal, D.maxHp - player.hp)); player.hp += h; floatText('+' + h, 'heal', head); spawnRing(player.pos, 0xff9a8f, 1.4, 0.5); }
  else if (it.mana) { const h = Math.round(Math.min(it.mana, D.maxMp - player.mp)); player.mp += h; floatText('+' + h + ' MP', 'heal', head); spawnRing(player.pos, 0x9cc8ff, 1.4, 0.5); }
  else { if (it.cure === 'poison') player.poison = null; else player[it.cure] = 0; floatText(it.warm ? '<small>WARM</small>' : '<small>CURED</small>', 'heal', head); spawnRing(player.pos, it.warm ? 0xffb46a : 0xbff0a0, 1.6, 0.5); }
  if (it.warm) player.buffs.warm = { t: it.warm, name: 'Warm' }; // v1.4: Warm Tea keeps the cold away for a while
  sfx.potion();
  if (UI.isOpen('bagPanel')) UI.renderBag();
  return true;
}
// skill level: the hero's own, or the level a try-out or trial lends
const skillLv = (id) => (tempJob ? tempJob.skills[id] || 0 : (P && P.skills[id]) || 0);
const jobSkills = () => (jobNow() === 'novice' ? null : RW.JOBS[jobNow()].skills);
const skillMp = (s, lv) => s.mp + (s.mpLv || 0) * Math.max(0, lv - 1);
// ---------- shouts: the hero calls out combo and skill names ----------
// every shout is named after a food or an animal, and pops its own little picture
const COMBO_NAMES = {
  novice: [null, ['Cookie Bonk!', '🍪'], ['Triple Pudding Punch!', '🍮']],
  warrior: [null, ['Bear Chop!', '🐻'], ['Rhino Smash!', '🦏']],
  archer: [null, ['Bunny Hop!', '🐰'], ['Fox Flurry!', '🦊']],
  mage: [null, ['Jelly Zap!', '🍬'], ['Cupcake Burst!', '🧁']],
  robot: [null, ['Cheese Beep!', '🧀'], ['Turbo Taco Punch!', '🌮']]
};
const SKILL_THEME = {
  bash: ['Coconut Bonk', '🥥', 0xc8a070], pebble: ['Peanut Toss', '🥜', 0xd8b070], whirl: ['Cinnamon Roll Spin', '🍥', 0xbfe6ff], rally: ['Honey Bee Cheer', '🐝', 0xffd84d],
  cleave: ['Watermelon Slice', '🍉', 0xff7a8a], rush: ['Raging Rhino Rush', '🦏', 0xdddddd], warcry: ['Lion Roar', '🦁', 0xff8a5a], earthslam: ['Elephant Stomp', '🐘', 0xc8a06a],
  powershot: ['Carrot Missile', '🥕', 0xffa040], venom: ['Snake Bite Arrow', '🐍', 0x9ae070], hawkeye: ['Eagle Eye', '🦅', 0x9ff07a], arrowrain: ['Blueberry Rain', '🫐', 0x7a8aff],
  firebolt: ['Hot Chili Bolt', '🌶️', 0xff5a30], frost: ['Ice Cream Shard', '🍦', 0xa8e0ff], stoneskin: ['Turtle Shell', '🐢', 0x8ac070], gust: ['Butterfly Breeze', '🦋', 0xc8f0e0],
  homing: ['Hungry Shark Missile', '🦈', 0x9ac8e8], laser: ['Lemon Laser', '🍋', 0xfff060], overdrive: ['Cheetah Overdrive', '🐆', 0x7ce0ff], barrage: ['Popcorn Barrage', '🍿', 0xfff0c0]
};
const ULT_THEME = { novice: ['Big Bunny Pancake', '🥞', 0xfff1a8], warrior: ["Dragon Fruit Comet", '🐉', 0xffc070], archer: ['Strawberry Storm', '🍓', 0xff7a9a], mage: ['Starfruit Fall', '⭐', 0xfff060], robot: ['Mega Banana Laser', '🍌', 0x7ce8ff] };
let shoutCd = 0;
function shout(text, cls) {
  const p = player.pos;
  floatText(esc(text), 'shout ' + (cls || ''), V3(p.x, p.y + 2.6, p.z), cls === 'ult' ? 1.8 : 1.3);
  shoutCd = 0.5;
}
// the picture burst: a big icon pops up, smaller ones fly around, a colored ring and sparkles
function skillFx(theme, at, big) {
  if (!theme) return;
  const [, ico, col] = theme, p = at || player.pos;
  floatText('<span class="care-ico">' + ico + '</span>', 'skfx' + (big ? ' big' : ''), V3(p.x, p.y + 1.6, p.z), big ? 1.6 : 1.2);
  const n = big ? 7 : 4;
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, r = big ? 1.6 : 1.0; floatText('<span class="care-ico">' + ico + '</span>', 'skfx sm', V3(p.x + Math.cos(a) * r, p.y + 0.8 + Math.random() * 0.6, p.z + Math.sin(a) * r), 0.9); }
  spawnRing(p, col, big ? 4 : 2.2, 0.45);
  for (let i = 0; i < (big ? 14 : 8); i++) spawnPuff(V3(p.x + rnd(-1, 1) * (big ? 1.8 : 1), p.y + rnd(0.3, 1.4), p.z + rnd(-1, 1) * (big ? 1.8 : 1)), col, true);
}
function skillShout(s, target) {
  const th = SKILL_THEME[s.id];
  shout((th ? th[0] : s.name) + '!', 'sk');
  skillFx(th, null, false);
  if (th && target) setTimeout(() => { if (target.alive !== undefined) skillFx(th, target.pos, false); }, 380);
}
function comboShout(n) {
  if (n < 1) return; // the first swing is quiet; the 2nd and 3rd get a name
  const c = (COMBO_NAMES[jobNow()] || COMBO_NAMES.novice)[n];
  if (c && (n === 2 || shoutCd <= 0)) { shout(c[0], n === 2 ? 'big' : ''); if (n === 2) floatText('<span class="care-ico">' + c[1] + '</span>', 'skfx', V3(player.pos.x, player.pos.y + 1.8, player.pos.z), 1.0); }
}
function useSlot(i) {
  AU.ensure(); if (player.dead) return;
  if (player.stun > 0 || player.freeze > 0) return deny('You are too dizzy to do that!');
  if (player.cds[i] > 0) return deny('Not ready yet.');
  if (i >= 4) { if (usePotion(P.hot[i - 4])) player.cds[i] = 1; return; }
  if (player.action && !player.action.basic) return; // a skill is still going; a plain attack is cut short for the skill
  if (jobSkills()) return useJobSkill(i);
  const s = SKILLS[i];
  if (player.mp < s.mp) return deny('Not enough MP.');
  if (s.id === 'bash') { const t = nearestMonster(2.6); if (!t) return deny('No monster close enough.'); startAction('bash', t); }
  else if (s.id === 'pebble') { const t = nearestMonster(s.range); if (!t) return deny('No monster within ' + s.range + ' m.'); startAction('pebble', t); }
  else startAction(s.id);
  player.mp -= s.mp; player.cds[i] = s.cd;
  skillShout(s, player.action && player.action.target);
  emit('skill', s.id);
}
const SKILL_ACT = { cone: 'cleave', dash: 'rush', buff: 'buff', area: 'slam', shot: 'shoot', bolt: 'cast', missile: 'fire', beam: 'beam', rain: 'shoot' };
function useJobSkill(i) {
  const job = jobNow(), s = RW.JOBS[job].skills[i], lv = skillLv(s.id);
  if (!lv) return deny(tempJob ? s.name + ' is not part of this try-out.' : 'Learn ' + s.name + ' first: press C, then Skills.');
  const mp = skillMp(s, lv); if (player.mp < mp) return deny('Not enough MP.');
  let target = null;
  if (s.kind === 'dash' || s.kind === 'shot' || s.kind === 'bolt' || s.kind === 'missile') { target = nearestMonster(s.range + buffSum('range')); if (!target) return deny('No monster within ' + s.range + ' m.'); }
  else if (s.kind === 'rain' || s.kind === 'beam') target = nearestMonster(s.range + buffSum('range'));
  else if (s.kind === 'cone' && !nearestMonster(s.range + 0.8)) return deny('No monster close enough.');
  let act = SKILL_ACT[s.kind];
  if (s.kind === 'area' && job === 'mage') act = 'cast';
  if ((s.kind === 'rain' || s.kind === 'shot') && job === 'robot') act = 'fire';
  if (s.kind === 'shot' && weaponNow() === 'slingshot') act = 'sling';
  startAction(act, target);
  player.action.skill = s; player.action.lv = lv;
  player.mp -= mp; player.cds[i] = s.cd;
  skillShout(s, target);
  emit('skill', s.id);
}
function useUlt() {
  AU.ensure(); if (player.dead || (player.action && !player.action.basic) || player.stun > 0 || player.freeze > 0) return;
  if (player.ult < 100) return deny('Finishing move is still charging.');
  player.ult = 0; startAction('ult'); player.action.ultJob = jobNow();
  { const th = ULT_THEME[jobNow()] || ULT_THEME.novice; shout(th[0] + '!', 'ult'); skillFx(th, null, true); }
}
function startAction(type, target) {
  if (player.sitting) standUp();
  const def = ACTIONS[type];
  player.action = { type, def, t: 0, target: target || player.target, done: false, stepDone: 0, swung: false, basic: !!def.basic };
  player.dest = null;
  if (target && !player.target && type !== 'pebble' && !def.basic) player.target = target;
  if (type === 'rally') { player.rallyT = 10; spawnRing(player.pos, 0xf4c542, 2.4, 0.8); }
  if (!type.startsWith('combo') && !def.basic) sfx.skill();
}
// ---------- projectiles: arrows, pebbles, magic orbs, missiles ----------
const projectiles = [];
const muzzle = () => V3(player.pos.x + Math.sin(player.face) * 0.45, player.pos.y + 1.2, player.pos.z + Math.cos(player.face) * 0.45);
const aimAt = (m) => V3(m.pos.x, m.pos.y + (m.k.fly ? 0.4 : 0.6 * m.scale), m.pos.z);
const glowTex2 = RW.glowTex;
function makeShot(kind, color) {
  const g = new THREE.Group();
  if (kind === 'arrow') {
    const sh = new THREE.Mesh(geoCyl(0.014, 0.014, 0.62, 5), lam(0x8a5a35)); sh.rotation.x = Math.PI / 2; g.add(sh);
    const hd = new THREE.Mesh(geoCone(0.035, 0.1, 6), lam(color || 0xb8c2cc)); hd.rotation.x = Math.PI / 2; hd.position.z = 0.34; g.add(hd);
    for (const s of [1, -1]) { const f = new THREE.Mesh(geoBox(0.004, 0.06, 0.1), lam(0xe8604c)); f.position.set(0, 0.025 * s, -0.27); g.add(f); }
    if (color) { const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex2, color, transparent: true, depthWrite: false, opacity: 0.8 })); gl.scale.set(0.6, 0.6, 1); g.add(gl); }
  } else if (kind === 'pebble') g.add(new THREE.Mesh(geoSphere(0.09, 8, 6), lam(0xa8a39a)));
  else if (kind === 'missile') {
    const b = new THREE.Mesh(geoCyl(0.045, 0.045, 0.28, 8), lam(0xf6efdc)); b.rotation.x = Math.PI / 2; g.add(b);
    const n = new THREE.Mesh(geoCone(0.045, 0.1, 8), lam(0xe8604c)); n.rotation.x = Math.PI / 2; n.position.z = 0.19; g.add(n);
    const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex2, color: 0xffb060, transparent: true, depthWrite: false })); fl.position.z = -0.2; fl.scale.set(0.45, 0.45, 1); g.add(fl);
  } else if (kind === 'shard') {
    const c = new THREE.Mesh(cachedGeo('shard', () => new THREE.OctahedronGeometry(0.12, 0)), new THREE.MeshLambertMaterial({ color: 0xdff6ff, emissive: 0x3a7ab0 })); c.scale.set(0.7, 0.7, 1.8); g.add(c);
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex2, color: 0xa8e0ff, transparent: true, depthWrite: false })); gl.scale.set(0.9, 0.9, 1); g.add(gl);
  } else { // a glowing orb of magic
    const c = new THREE.Mesh(geoSphere(0.1, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff })); g.add(c);
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex2, color: color || 0xc8a0ff, transparent: true, depthWrite: false })); gl.scale.set(1.0, 1.0, 1); g.add(gl);
  }
  scene.add(g); return g;
}
// fire something at a monster; onHit runs when it arrives. Homing missiles curve towards their target
function shoot(kind, m, onHit, opts) {
  opts = opts || {};
  const from = opts.from || muzzle(), mesh = makeShot(kind, opts.color);
  const speed = opts.speed || (kind === 'arrow' ? 28 : kind === 'missile' ? 16 : 20);
  projectiles.push({ mesh, from, target: m, t: 0, dur: Math.max(0.14, from.distanceTo(aimAt(m)) / speed), onHit, arc: kind === 'pebble' ? 0.12 : kind === 'missile' ? 0.25 : 0.04, trail: opts.trail, homing: opts.homing, side: rnd(-1, 1) });
}
function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const pr = projectiles[i]; pr.t += dt; const k = Math.min(1, pr.t / pr.dur), m = pr.target;
    const to = aimAt(m), prev = tmpV2.copy(pr.mesh.position);
    pr.mesh.position.lerpVectors(pr.from, to, k); pr.mesh.position.y += Math.sin(k * Math.PI) * pr.from.distanceTo(to) * pr.arc;
    if (pr.homing) { const s = Math.sin(k * Math.PI) * 1.6 * pr.side; pr.mesh.position.x += Math.cos(player.face) * s; pr.mesh.position.z -= Math.sin(player.face) * s; }
    if (k > 0.02) pr.mesh.lookAt(tmpV.copy(pr.mesh.position).add(pr.mesh.position).sub(prev));
    if (pr.trail && Math.random() < 0.7) spawnPuff(pr.mesh.position.clone(), pr.trail, false);
    if (k >= 1) {
      scene.remove(pr.mesh); projectiles.splice(i, 1);
      if (pr.onHit) pr.onHit(m, to); else if (m.alive) hitMonster(m, 1.25 + P.stats.agi * 0.025, 0.25, false);
    }
  }
}
// ---------- effects for skills: beams, falling arrows, auras, rocks, explosions ----------
function fxLine(from, to, color, width, dur) {
  const len = from.distanceTo(to), g = new THREE.Mesh(cachedGeo('beam', () => { const c = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true); c.rotateX(Math.PI / 2); c.translate(0, 0, 0.5); return c; }), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
  g.position.copy(from); g.lookAt(to); g.scale.set(width, width, len); scene.add(g);
  const core = new THREE.Mesh(g.geometry, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false })); core.scale.set(0.35, 0.35, 1); g.add(core);
  fx.push({ o: g, t: 0, dur: dur || 0.3, update: (f, k) => { g.material.opacity = 0.85 * (1 - k); core.material.opacity = 0.9 * (1 - k); g.scale.x = g.scale.y = width * (1 + k * 0.4); } });
  return g;
}
function explode(pos, color, size) {
  spawnRing(V3(pos.x, W.height(pos.x, pos.z), pos.z), color || 0xffa040, size || 1.8, 0.4); spawnSpark(pos, true, 0xffd090);
  for (let i = 0; i < 7; i++) spawnPuff(V3(pos.x + rnd(-0.6, 0.6), pos.y + rnd(-0.2, 0.4), pos.z + rnd(-0.6, 0.6)), i % 2 ? 0xffb060 : 0x9a8f86, true);
  shakeT = Math.max(shakeT, 0.08); sfx.heavy();
}
function rocks(pos, n, radius) {
  for (let i = 0; i < n; i++) {
    const a = rnd(0, 6.28), r = rnd(0.4, radius), m = new THREE.Mesh(geoSphere(rnd(0.12, 0.26), 6, 5), lam(0x9a8064)); const x = pos.x + Math.cos(a) * r, z = pos.z + Math.sin(a) * r, y0 = W.height(x, z);
    m.position.set(x, y0, z); scene.add(m); const vy = rnd(3, 6);
    fx.push({ o: m, t: 0, dur: 0.7, update: (f, k) => { m.position.y = y0 + vy * f.t - 9 * f.t * f.t; m.rotation.x += 0.2; if (m.position.y < y0 - 0.2) m.visible = false; } });
  }
}
function aura(color, dur, id) {
  const g = new THREE.Mesh(cachedGeo('auraRing', () => { const r = new THREE.RingGeometry(0.7, 1.0, 32); r.rotateX(-Math.PI / 2); return r; }), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  scene.add(g); const col = new THREE.Mesh(cachedGeo('auraCol', () => new THREE.CylinderGeometry(0.9, 0.9, 2.2, 20, 1, true)), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); col.position.y = 1.1; g.add(col);
  fx.push({ o: g, t: 0, dur, update: (f) => { if (!player.buffs[id] || player.dead) return false; g.position.set(player.pos.x, player.pos.y + 0.06, player.pos.z); g.rotation.y += 0.04; const p = 0.45 + Math.sin(time * 5) * 0.15; g.material.opacity = p; col.material.opacity = p * 0.3; } });
}
// things falling from the sky onto an area: arrows, missiles or stars
function rainDown(kind, center, radius, waves, span, hitEach) {
  for (let w = 0; w < waves; w++) {
    const tw = (w / Math.max(1, waves - 1)) * span;
    for (let n = 0; n < (kind === 'star' ? 1 : 5); n++) {
      const a = rnd(0, 6.28), r = Math.sqrt(Math.random()) * radius, x = center.x + Math.cos(a) * r, z = center.z + Math.sin(a) * r, y0 = W.height(x, z);
      const m = kind === 'star' ? makeShot('orb', 0xfff0a0) : makeShot(kind === 'missile' ? 'missile' : 'arrow'); m.visible = false;
      m.lookAt(x, y0 - 10, z);
      fx.push({ o: m, t: -tw - n * 0.04, dur: 0.35, update: (f, k) => { if (f.t < 0) return; m.visible = true; const u = Math.min(1, f.t / 0.3); m.position.set(x + (1 - u) * 1.5, y0 + 9 * (1 - u), z); if (u >= 1 && !f.hit) { f.hit = true; if (kind !== 'arrow') explode(V3(x, y0 + 0.3, z), kind === 'star' ? 0xfff0a0 : 0xffa040, kind === 'star' ? 2.2 : 1.4); else spawnPuff(V3(x, y0 + 0.1, z)); } } });
    }
    setTimeout(() => { if (!P || player.dead) return; spawnRing(V3(center.x, W.height(center.x, center.z), center.z), kind === 'star' ? 0xfff0a0 : 0xffffff, radius, 0.3); hitEach(); }, (tw + 0.32) * 1000);
  }
}
function inRadius(c, r) { return monsters.filter((m) => m.alive && Math.hypot(m.pos.x - c.x, m.pos.z - c.z) < r + m.k.radius * m.scale); }
// a straight beam from the hero: every monster within its width is hit
function beamHit(dir, len, width, fn) {
  const sx = player.pos.x, sz = player.pos.z;
  for (const m of monsters) { if (!m.alive) continue; const dx = m.pos.x - sx, dz = m.pos.z - sz, along = dx * dir.x + dz * dir.z; if (along < 0 || along > len) continue; const off = Math.abs(dx * dir.z - dz * dir.x); if (off < width + m.k.radius * m.scale) fn(m); }
}
// what happens when a job skill lands
function runSkill(a) {
  const s = a.skill, lv = a.lv, job = jobNow(), magic = job === 'mage', pw = (s.power || 0) + (s.powerLv || 0) * (lv - 1);
  const o = { magic, element: s.element };
  const t = a.target && a.target.alive ? a.target : null;
  if (s.kind === 'cone') {
    for (const m of monsters) { if (!m.alive) continue; const dx = m.pos.x - player.pos.x, dz = m.pos.z - player.pos.z, d = Math.hypot(dx, dz); if (d > s.range + m.k.radius * m.scale) continue; if (Math.abs(wrapAngle(Math.atan2(dx, dz) - player.face)) < 1.1) hitMonster(m, pw, 0.7, true, false, o); }
    const f = V3(player.pos.x + Math.sin(player.face) * 1.6, player.pos.y + 0.9, player.pos.z + Math.cos(player.face) * 1.6); spawnSlash(f, player.face, true); spawnSlash(V3(f.x, f.y + 0.3, f.z), player.face, false); spawnRing(player.pos, 0xffe9a0, 2.6, 0.35);
  } else if (s.kind === 'dash') {
    if (t) { hitMonster(t, pw, 1.0, true, false, { stun: s.stun + s.stunLv * (lv - 1) }); spawnRing(t.pos, 0xffffff, 1.6, 0.4); for (let i = 0; i < 5; i++) spawnPuff(V3(t.pos.x + rnd(-0.5, 0.5), t.pos.y + 0.2, t.pos.z + rnd(-0.5, 0.5))); }
  } else if (s.kind === 'buff') {
    const b = { t: s.dur };
    for (const k of ['atk', 'def', 'crit', 'speed', 'guard']) if (s[k]) b[k] = s[k] + (s[k + 'Lv'] || 0) * (lv - 1);
    if (s.range) b.range = s.range;
    if (s.taunt) for (const m of monsters) if (m.alive && !m.k.passive && Math.hypot(m.pos.x - player.pos.x, m.pos.z - player.pos.z) < s.taunt) { m.aggro = true; m.show = 4; }
    player.buffs[s.id] = b;
    const col = { warcry: 0xff8a5a, hawkeye: 0x9ff07a, stoneskin: 0xc8a06a, overdrive: 0x7ce0ff }[s.id] || 0xffffff;
    aura(col, s.dur, s.id); pillarT = 0.3; spawnRing(player.pos, col, 3, 0.6);
    floatText('<small>' + s.name.toUpperCase() + '</small>', 'el', V3(player.pos.x, player.pos.y + 2.2, player.pos.z), 1.2);
  } else if (s.kind === 'area') {
    const r = s.radius;
    for (const m of inRadius(player.pos, r)) hitMonster(m, pw, s.kb || 0.8, true, false, o);
    spawnRing(player.pos, ELCOL[s.element] || 0xffffff, r, 0.5); spawnRing(player.pos, 0xffffff, r * 0.6, 0.35);
    if (s.element === 'earth') { rocks(player.pos, 12, r); shakeT = Math.max(shakeT, 0.2); }
    else for (let i = 0; i < 14; i++) { const ang = i / 14 * 6.28; spawnPuff(V3(player.pos.x + Math.cos(ang) * r * 0.7, player.pos.y + 0.5 + (i % 3) * 0.4, player.pos.z + Math.sin(ang) * r * 0.7), 0xe8fff4, true); }
  } else if (s.kind === 'shot') {
    if (!t) return;
    const venom = !!s.poison, onHit = (m) => { if (m.alive) hitMonster(m, pw, s.kb || 0.3, true, false, venom ? { poison: { t: s.poison, dps: s.poisonDps + s.poisonLv * (lv - 1) } } : {}); };
    if (job === 'robot') shoot('missile', t, (m, at) => { explode(at); onHit(m); }, { trail: 0xd8d0c8 });
    else shoot(weaponNow() === 'slingshot' ? 'pebble' : 'arrow', t, onHit, { color: venom ? 0x9ae070 : 0xfff0a0, trail: venom ? 0x9ae070 : 0xfff6d0 });
  } else if (s.kind === 'bolt') {
    if (!t) return;
    const frost = !!s.freeze;
    shoot(frost ? 'shard' : 'orb', t, (m, at) => {
      if (!m.alive) return;
      const fr = frost && Math.random() < s.freeze + s.freezeLv * (lv - 1) ? s.freezeT : 0;
      hitMonster(m, pw, 0.35, true, false, Object.assign({}, o, { freeze: fr }));
      if (!frost) explode(at, 0xff7a30, 1.4); else for (let i = 0; i < 6; i++) spawnPuff(V3(at.x + rnd(-0.4, 0.4), at.y, at.z + rnd(-0.4, 0.4)), 0xdff6ff, true);
    }, { color: frost ? 0xa8e0ff : 0xff8a3d, trail: frost ? 0xdff6ff : 0xffb060, speed: 18 });
  } else if (s.kind === 'missile') {
    if (!t) return;
    for (let k = 0; k < 2; k++) setTimeout(() => { if (!t.alive && k) return; shoot('missile', t, (m, at) => { explode(at); for (const x of inRadius(at, 1.6)) hitMonster(x, x === m ? pw * 0.6 : pw * 0.3, 0.5, true, false, o); }, { trail: 0xd8d0c8, homing: true }); }, k * 120);
  } else if (s.kind === 'beam') {
    const dir = t ? V3(t.pos.x - player.pos.x, 0, t.pos.z - player.pos.z).normalize() : V3(Math.sin(player.face), 0, Math.cos(player.face));
    const from = muzzle(), to = V3(from.x + dir.x * s.range, from.y, from.z + dir.z * s.range);
    fxLine(from, to, 0x7ce8ff, 0.32, 0.45); sfx.crit();
    beamHit(dir, s.range, s.width, (m) => hitMonster(m, pw, 0.4, true, false, o));
  } else if (s.kind === 'rain') {
    const c = t ? t.pos.clone() : V3(player.pos.x + Math.sin(player.face) * 5, 0, player.pos.z + Math.cos(player.face) * 5);
    rainDown(job === 'robot' ? 'missile' : 'arrow', c, s.radius, s.waves, 1.0, () => { for (const m of inRadius(c, s.radius)) hitMonster(m, pw, 0.15, false, false, o); });
  }
}
// each job's finishing move
function runUlt(job) {
  const p = player.pos.clone();
  if (job === 'warrior') {
    pillarT = 0.2; shakeT = 0.35; rocks(p, 18, 5); spawnRing(p, 0xffc070, 5.5, 0.7); spawnRing(p, 0xffffff, 3.5, 0.5);
    for (const m of inRadius(p, 5.5)) hitMonster(m, 3.2, 1.2, true, false, { element: 'earth' });
  } else if (job === 'archer') {
    rainDown('arrow', p, 7, 8, 1.8, () => { for (const m of inRadius(p, 7)) hitMonster(m, 0.75, 0.1, false, false, {}); });
  } else if (job === 'mage') {
    for (let i = 0; i < 12; i++) { const a = rnd(0, 6.28), r = rnd(1, 6), c = V3(p.x + Math.cos(a) * r, 0, p.z + Math.sin(a) * r); rainDown('star', c, 0.1, 1, i * 0.15, () => { for (const m of inRadius(c, 2)) hitMonster(m, 1.3, 0.6, true, false, { magic: true }); }); }
  } else if (job === 'robot') {
    const hit = new Set(), from = muzzle();
    for (let k = 0; k < 12; k++) setTimeout(() => {
      if (!P) return; const ang = player.face + k / 12 * Math.PI * 2, dir = V3(Math.sin(ang), 0, Math.cos(ang));
      fxLine(V3(player.pos.x, from.y, player.pos.z), V3(player.pos.x + dir.x * 9, from.y, player.pos.z + dir.z * 9), 0x7ce8ff, 0.45, 0.25);
      beamHit(dir, 9, 1.4, (m) => { if (!hit.has(m)) { hit.add(m); hitMonster(m, 3.2, 0.8, true, false, {}); } });
    }, k * 90);
    shakeT = 0.3;
  }
}
// a plain attack from a distance, with the hero's weapon
function rangedHit(a) {
  const m = a.target; if (!m || !m.alive) return;
  const w = weaponNow();
  if (w === 'bow') { shoot('arrow', m, (x) => { if (x.alive) hitMonster(x, 1.0, 0.3); }, { trail: 0xfff6d0 }); sfx.throw(); }
  else if (w === 'slingshot') { shoot('pebble', m, (x) => { if (x.alive) hitMonster(x, 0.9, 0.3 + D.kb); }); sfx.throw(); }
  else if (w === 'missileArm') { shoot('missile', m, (x, at) => { explode(at, 0xffa040, 1.2); for (const o of inRadius(at, D.splash)) if (o !== x) hitMonster(o, 0.45, 0.4); if (x.alive) hitMonster(x, 1.0, 0.4); }, { trail: 0xd8d0c8 }); }
  else if (w === 'laserCannon') { const from = muzzle(), to = aimAt(m); fxLine(from, to, 0x7ce8ff, 0.12, 0.18); hitMonster(m, 0.9, 0.2, false, false, { color: 0x7ce8ff }); sfx.hit(); }
  else { shoot('orb', m, (x) => { if (x.alive) hitMonster(x, 1.0, 0.25, false, false, { magic: true, color: 0xc8a0ff }); }, { color: 0xc8a0ff, trail: 0xe0d0ff }); spawnSpark(muzzle(), false, 0xc8a0ff); }
}
function actionHit(a) {
  if (a.skill) return runSkill(a);
  if (a.def.ranged) return rangedHit(a);
  if (a.type === 'ult' && a.ultJob && a.ultJob !== 'novice') return runUlt(a.ultJob);
  const d = a.def;
  if (a.type.startsWith('combo') || a.type === 'bash') {
    const m = a.target; if (!m || !m.alive || m.pos.distanceTo(player.pos) > 2.9 + Math.max(0, m.k.radius * m.scale / 0.72 - 0.8)) return;
    hitMonster(m, d.mult * (a.type === 'bash' ? 1 + P.stats.str * 0.01 : 1), d.kb, d.heavy, a.type.startsWith('combo'));
    if (d.heavy) { spawnRing(m.pos, 0xffffff, 1.3, 0.35); for (let i = 0; i < 4; i++) spawnPuff(V3(m.pos.x + rnd(-0.5, 0.5), m.pos.y + 0.1, m.pos.z + rnd(-0.5, 0.5))); }
  } else if (a.type === 'pebble') {
    const m = a.target; if (!m || !m.alive) return;
    const stone = new THREE.Mesh(geoSphere(0.09, 8, 6), lam(0xa8a39a)); scene.add(stone);
    const from = V3(player.pos.x + Math.sin(player.face) * 0.3, player.pos.y + 1.3, player.pos.z + Math.cos(player.face) * 0.3);
    projectiles.push({ mesh: stone, from, target: m, t: 0, dur: Math.max(0.25, from.distanceTo(m.pos) / 16), arc: 0.12 });
    sfx.throw();
  } else if (a.type === 'whirl' || a.type === 'ult') {
    const range = a.type === 'ult' ? 4.8 : 3.2;
    spawnRing(player.pos, a.type === 'ult' ? 0xfff1a8 : 0xbfe6ff, range, 0.6);
    if (a.type === 'ult') { pillarT = 0.2; for (let i = 0; i < 10; i++) spawnPuff(V3(player.pos.x + rnd(-2, 2), player.pos.y + 0.3, player.pos.z + rnd(-2, 2)), 0xfff1a8, true); }
    for (const m of monsters) if (m.alive && m.pos.distanceTo(player.pos) < range + m.k.radius) hitMonster(m, a.type === 'ult' ? 3 : 1.2, a.type === 'ult' ? 1.0 : 0.5, true);
  }
}
function sitDown() {
  if (player.dead || player.sitting) return;
  if (time - player.lastHurt < 2) return deny('Too dangerous to sit right now.');
  player.sitting = true; player.sitT = 0; player.dest = null; player.target = null; player.pickTarget = null; player.npcTarget = null; player.action = null;
  document.getElementById('sitBtn').setAttribute('aria-pressed', 'true');
}
function standUp() { player.sitting = false; document.getElementById('sitBtn').setAttribute('aria-pressed', 'false'); }

// ---------- talking to NPCs ----------
let talkNpc = null;
function talkTo(n) {
  player.npcTarget = null; talkNpc = n;
  player.face = Math.atan2(n.x - player.pos.x, n.z - player.pos.z);
  // quests come first: the story decides if this person has something to say about one
  if (RW.talkHooks) for (const f of RW.talkHooks) if (f(n)) return; // v1.4: fishing, crafting, the boat, the merchant...
  if (RW.gear && RW.gear.talk(n)) return;
  if (RW.jobs && RW.jobs.talk(n)) return;
  if (RW.pets && RW.pets.talk(n)) return;
  if (RW.story && RW.story.talk(n)) return;
  chat(n);
}
function chat(n) {
  talkNpc = n;
  const text = n.lines[n.line % n.lines.length]; n.line++;
  const acts = [];
  if (n.shop) acts.push({ label: 'Buy & sell', run: () => { UI.hideDialog(); UI.open('shopPanel'); } });
  else if (n.lines.length > 1) acts.push({ label: 'Tell me more', soft: true, run: () => chat(n) });
  acts.push({ label: 'Goodbye', soft: !n.shop, run: () => { UI.hideDialog(); talkNpc = null; } });
  UI.say([{ who: n.id, name: n.name, role: n.role, face: 'normal', text }], acts);
}
function useSpot(s) { player.spotTarget = null; player.face = Math.atan2(s.x - player.pos.x, s.z - player.pos.z); if (s.onUse) s.onUse(s); }

// ---------- input ----------
const cam = { yaw: 0, pitch: 0.62, dist: 15, tx: player.pos.x, ty: 0, tz: player.pos.z };
cam.yaw = wrapAngle(player.face + Math.PI);
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pickAt(x, y) {
  let best = null, bd = 1e9;
  for (const m of monsters) {
    if (!m.alive || !m.active) continue;
    const s = screenOf(V3(m.pos.x, m.pos.y + 0.55 * m.scale, m.pos.z)); if (!s.ok) continue;
    if (m.k.move === 'trot') s.y += 6;
    const th = 54 * clamp(18 / camera.position.distanceTo(m.pos), 0.55, 1.8) * (m.scale / 0.8);
    const d = Math.hypot(s.x - x, s.y - y); if (d < th && d < bd) { bd = d; best = { type: 'monster', m }; }
  }
  if (best) return best;
  for (const it of items) { const s = screenOf(V3(it.pos.x, it.pos.y + 0.35, it.pos.z)); if (!s.ok) continue; const d = Math.hypot(s.x - x, s.y - y); if (d < 40 && d < bd) { bd = d; best = { type: 'item', it }; } }
  if (best) return best;
  for (const n of npcs) { if (!here(n)) continue; const s = screenOf(V3(n.x, n.c.root.position.y + 0.9, n.z)); if (!s.ok) continue; const th = 60 * clamp(18 / camera.position.distanceTo(n.c.root.position), 0.55, 1.8); const d = Math.hypot(s.x - x, s.y - y); if (d < th && d < bd) { bd = d; best = { type: 'npc', n }; } }
  if (best) return best;
  for (const sp of spots) { if (sp.hidden || !here(sp)) continue; const s = screenOf(V3(sp.x, sp.y0 + sp.y, sp.z)); if (!s.ok) continue; const th = 56 * clamp(18 / camera.position.distanceTo(V3(sp.x, sp.y0, sp.z)), 0.55, 1.8); const d = Math.hypot(s.x - x, s.y - y); if (d < th && d < bd) { bd = d; best = { type: 'spot', s: sp }; } }
  return best;
}
function handleClick(x, y) {
  if (player.dead) return;
  const p = pickAt(x, y);
  if (player.sitting && p && p.type !== 'npc') standUp();
  if (p && p.type === 'monster') { player.target = p.m; player.pickTarget = null; player.dest = null; player.npcTarget = null; p.m.show = 5; if (player.sitting) standUp(); return; }
  if (p && p.type === 'item') { player.pickTarget = p.it; player.target = null; player.dest = null; player.npcTarget = null; if (player.sitting) standUp(); return; }
  if (p && p.type === 'npc') { if (player.sitting) standUp(); player.npcTarget = p.n; player.target = null; player.pickTarget = null; player.dest = null; player.spotTarget = null; return; }
  if (p && p.type === 'spot') { if (player.sitting) standUp(); player.spotTarget = p.s; player.npcTarget = null; player.target = null; player.pickTarget = null; player.dest = null; return; }
  player.spotTarget = null;
  ndc.set((x / VW) * 2 - 1, -(y / VH) * 2 + 1); ray.setFromCamera(ndc, camera);
  const g = W.groundRay(ray.ray); if (!g) return;
  if (player.sitting) standUp();
  player.dest = V3(g.x, 0, g.z); player.target = null; player.pickTarget = null; player.npcTarget = null;
  clickRing.position.set(g.x, W.height(g.x, g.z) + 0.08, g.z); clickT = 0;
}
const pointers = new Map();
let down = null, rotating = false, pinch = null;
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('pointerdown', (e) => {
  if (mode !== 'play') return;
  AU.ensure(); startMusic();
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* capture is optional */ }
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 1) { down = { x: e.clientX, y: e.clientY, id: e.pointerId, btn: e.button, moved: false }; rotating = e.pointerType === 'mouse' && e.button !== 0; }
  else if (pointers.size === 2) { down = null; rotating = false; const [a, b] = [...pointers.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), ang: Math.atan2(b.y - a.y, b.x - a.x), mid: (a.y + b.y) / 2 }; }
});
canvas.addEventListener('pointermove', (e) => {
  const prev = pointers.get(e.pointerId);
  if (!prev) { if (e.pointerType === 'mouse') hoverAt(e.clientX, e.clientY); return; }
  const dx = e.clientX - prev.x, dy = e.clientY - prev.y; prev.x = e.clientX; prev.y = e.clientY;
  if (pointers.size === 2 && pinch) {
    const [a, b] = [...pointers.values()], d = Math.hypot(a.x - b.x, a.y - b.y), ang = Math.atan2(b.y - a.y, b.x - a.x), mid = (a.y + b.y) / 2;
    cam.dist = clamp(cam.dist * (pinch.d / Math.max(20, d)), 6, 34); cam.yaw -= wrapAngle(ang - pinch.ang); cam.pitch = clamp(cam.pitch + (mid - pinch.mid) * 0.004, 0.3, 1.3);
    pinch.d = d; pinch.ang = ang; pinch.mid = mid; return;
  }
  if (down && down.id === e.pointerId) {
    if (!down.moved && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 9) { down.moved = true; rotating = true; }
    if (rotating) { cam.yaw -= dx * 0.006; cam.pitch = clamp(cam.pitch + dy * 0.004, 0.3, 1.3); }
  }
});
function endPointer(e) {
  const wasTap = down && down.id === e.pointerId && !down.moved && down.btn === 0;
  pointers.delete(e.pointerId);
  if (wasTap) handleClick(e.clientX, e.clientY);
  if (pointers.size < 2) pinch = null;
  if (pointers.size === 0) { down = null; rotating = false; }
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', (e) => { pointers.delete(e.pointerId); pinch = null; if (!pointers.size) { down = null; rotating = false; } });
canvas.addEventListener('wheel', (e) => { e.preventDefault(); if (mode !== 'play') return; cam.dist = clamp(cam.dist * (e.deltaY > 0 ? 1.1 : 0.9), 6, 34); }, { passive: false });
let hoverT = 0;
function hoverAt(x, y) {
  if (mode !== 'play' || performance.now() - hoverT < 60) return; hoverT = performance.now();
  const p = pickAt(x, y);
  stage.classList.toggle('hover-monster', !!p && p.type === 'monster'); stage.classList.toggle('hover-item', !!p && p.type === 'item'); stage.classList.toggle('hover-npc', !!p && (p.type === 'npc' || p.type === 'spot'));
  if (p && p.type === 'monster') p.m.show = Math.max(p.m.show, 0.6);
}
const keys = new Set();
window.addEventListener('keydown', (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  if (mode !== 'play' || blocked()) return;
  const k = e.key.toLowerCase();
  if (k >= '1' && k <= '6') useSlot(Number(k) - 1);
  else if (k === 'r') useUlt();
  else if (k === 'q' || k === 'e') keys.add(k);
  else if (k === 'b') { sfx.click(); UI.toggle('bagPanel'); }
  else if (k === 'c') { sfx.click(); UI.toggle('statPanel'); }
  else if (k === 'j') { sfx.click(); UI.toggle('questPanel'); }
  else if (k === 'm') { sfx.click(); toggleAreaMap(); }
  else if (k === 'k') { sfx.click(); UI.toggle('bookPanel'); }
  else if (k === 'p') { sfx.click(); UI.toggle('petPanel'); }
  else if (k === 'g') { sfx.click(); UI.toggle('gearPanel'); }
  else if (k === 't') setAuto(!autoOn);
  else if (k === 'x') { AU.ensure(); if (player.sitting) standUp(); else sitDown(); }
  else if (k === 'h') UI.toggle('helpPanel');
  else if (k === 'escape') { if (UI.closeAll()) talkNpc = null; }
});
window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
document.querySelectorAll('.slot').forEach((b) => b.addEventListener('click', () => useSlot(Number(b.dataset.slot))));
document.getElementById('ult').addEventListener('click', useUlt);
document.getElementById('sitBtn').addEventListener('click', () => { AU.ensure(); if (player.sitting) standUp(); else sitDown(); });
document.getElementById('questBtn').addEventListener('click', () => { sfx.click(); UI.toggle('questPanel'); });
document.getElementById('mapBtn').addEventListener('click', () => { sfx.click(); toggleAreaMap(); });
document.getElementById('bookBtn').addEventListener('click', () => { sfx.click(); UI.toggle('bookPanel'); });
document.getElementById('autoBtn').addEventListener('click', () => { AU.ensure(); setAuto(!autoOn); });
document.querySelector('#mapbox .mapring').addEventListener('click', () => { if (mode !== 'play') return; sfx.click(); toggleAreaMap(); });
document.getElementById('tracker').addEventListener('click', () => { sfx.click(); UI.open('questPanel'); });
document.getElementById('tracker').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); UI.open('questPanel'); } });

// ---------- music and areas ----------
let musicStarted = false;
const zoneName = (z) => (z === 'town' ? 'Mossbrook' : AREAS[z] ? AREAS[z].name : 'Sunny Meadow');
const zoneSub = (z, first) => (z === 'town' ? (first ? 'Your home town' : 'Safe in town · HP and MP recover fast') : AREAS[z] ? AREAS[z].lv : '');
function startMusic() { if (musicStarted || mode !== 'play' || !AU.ensure()) return; musicStarted = true; AU.play(player.zone || 'town'); }
function checkZone() {
  const z = W.zoneAt(player.pos.x, player.pos.z);
  if (z === player.zone) return;
  const first = player.zone === null;
  player.zone = z;
  document.getElementById('areaName').textContent = zoneName(z);
  UI.banner(zoneName(z), zoneSub(z, first));
  if (musicStarted) AU.play(z);
  if (AREAS[z] && P && !P.visited[z]) { P.visited[z] = true; dirty = true; }
  if (!first) emit('zone', z);
}

// ---------- travelling between areas: the screen fades to dark, the next map appears ----------
function switchMap(id) {
  if (W.active !== id) {
    parkMonsters();
    for (const it of items.splice(0)) { scene.remove(it.root); it.tag.remove(); }
    for (const pr of projectiles.splice(0)) scene.remove(pr.mesh);
    W.setMap(id);
    unparkMonsters(id);
  }
  for (const n of npcs) { const on = here(n) && mode === 'play'; n.c.root.visible = on; if (!on) hideEl(n.tag); }
  for (const s of spots) { if (s.model) s.model.visible = here(s); if (!here(s)) hideEl(s.tag); }
  goldT = Math.max(goldT, 120);
}
let gateArmed = null;
function travel(id, x, z, face, why) {
  if (traveling || !P) return;
  traveling = true;
  const fade = document.getElementById('fade');
  fade.classList.add('dark', 'on'); sfx.gate();
  player.dest = null; player.target = null; player.pickTarget = null; player.npcTarget = null; player.spotTarget = null; player.action = null;
  if (player.sitting) standUp();
  UI.closeAll(); talkNpc = null;
  setTimeout(() => {
    switchMap(id);
    player.pos.set(x, W.height(x, z), z); player.face = face;
    hero.root.rotation.y = face; pose.lastFace = face;
    cam.yaw = wrapAngle(face + Math.PI); cam.tx = x; cam.tz = z; cam.ty = player.pos.y + 0.9; updateCamera(1);
    player.zone = null; checkZone();
    for (const G of W.GATES) if (G.map === id && Math.hypot(G.x - x, G.z - z) < 5) gateArmed = G.id;
    emit('map', id, why);
    traveling = false; save();
    requestAnimationFrame(() => requestAnimationFrame(() => { fade.classList.remove('on'); setTimeout(() => fade.classList.remove('dark'), 600); }));
  }, 620);
}
function checkGates() {
  if (traveling || player.dead || UI.talking || (RW.comic && RW.comic.open)) return;
  for (const G of W.GATES) {
    if (G.map !== W.active) continue;
    const d = Math.hypot(G.x - player.pos.x, G.z - player.pos.z);
    if (gateArmed === G.id || gateArmed === G.id + '#') { if (d > 4.5) gateArmed = null; else if (gateArmed === G.id || (G.locked && G.locked())) continue; }
    if (G.locked && G.locked()) { if (d < 4.2) { gateArmed = G.id + '#'; UI.toast(G.lockMsg ? G.lockMsg() : 'Big rocks and roots block the way in.'); } continue; }
    if (d < 2.4) { gateArmed = G.id; travel(G.to, G.tx, G.tz, G.face, 'gate'); return; }
  }
}

// ---------- golden monsters: now and then a big golden one appears near a camp of the area you are in ----------
let goldT = rnd(GOLDEN.every[0], GOLDEN.every[1]);
function spawnGolden(force) {
  const camps = (CAMPS_BY_MAP[W.active] || []).filter((c) => !KINDS[c[0]].boss); if (!camps.length || !P) return null;
  const near = camps.filter((c) => { const d = Math.hypot(c[2] - player.pos.x, c[3] - player.pos.z); return d > (force ? 8 : 22) && d < 95; });
  const c = (near.length ? near : camps)[Math.floor(rnd(0, near.length || camps.length))];
  let x = c[2], z = c[3], g = 0;
  do { const a = rnd(0, Math.PI * 2), r = rnd(0, c[5]); x = c[2] + Math.cos(a) * r; z = c[3] + Math.sin(a) * r; } while (!W.walkable(x, z, true) && g++ < 20);
  const m = spawnMonster(c[0], c[1] + 1, x, z, true);
  m.life = GOLDEN.life; m.show = 6;
  spawnRing(m.pos, 0xffd84d, 3, 0.9); sfx.golden();
  UI.toast('<b style="color:#b0661e">★ A Golden ' + esc(m.k.name) + ' appeared nearby!</b>', true);
  emit('golden', m);
  return m;
}

// ---------- per-frame updates ----------
const RUN_SPEED = 6.2;
function faceTo(a, dt) { player.face += wrapAngle(a - player.face) * Math.min(1, dt * 12); }
// Mossbrook has a fence: going in or out, the hero walks through the north gate instead of bumping into the fence
function viaGate(tx, tz) {
  if (W.active !== 'meadow') return null;
  const F = W.TOWN.fence, rp = Math.hypot(player.pos.x, player.pos.z), inT = Math.hypot(tx, tz) < F;
  if (inT ? rp < F - 1.4 : rp > F + 1.4) return null; // already on the same side of the fence as the target
  const onLine = Math.abs(player.pos.x) < 1.2 && player.pos.z < -33; // lined up with the gate
  if (inT) return onLine && rp < F + 7 ? { x: 0, z: -35 } : { x: 0, z: -46 };
  return onLine ? { x: 0, z: -46 } : { x: 0, z: -35 };
}
function moveToward(tx, tz, dt, stopAt) {
  const via = viaGate(tx, tz);
  if (via) { const dx = via.x - player.pos.x, dz = via.z - player.pos.z, d = Math.hypot(dx, dz) || 1, step = Math.min(d, RUN_SPEED * dt); faceTo(Math.atan2(dx, dz), dt); return !W.tryMove(player.pos, player.pos.x + dx / d * step, player.pos.z + dz / d * step, false); }
  const dx = tx - player.pos.x, dz = tz - player.pos.z, d = Math.hypot(dx, dz);
  if (d <= (stopAt || 0.08)) return true;
  const step = Math.min(d - (stopAt || 0), RUN_SPEED * dt);
  const moved = W.tryMove(player.pos, player.pos.x + (dx / d) * step, player.pos.z + (dz / d) * step, false);
  faceTo(Math.atan2(dx, dz), dt);
  if (!moved) return true;
  return false;
}
// auto hunting: when the hero is idle, attack the nearest monster within a small radius; pause when HP gets low
let autoOn = false, autoWarned = false;
const AUTO_R = 15; // v1.3: user asked for a 15 m auto hunt range
function setAuto(on) { autoOn = on; autoWarned = false; document.getElementById('autoBtn').setAttribute('aria-pressed', String(on)); UI.toast(on ? 'Auto hunt: ON (monsters within ' + AUTO_R + ' m)' : 'Auto hunt: OFF'); sfx.click(); }
function autoHunt() {
  if (!autoOn || player.dead || player.target || player.action || player.dest || player.pickTarget || player.npcTarget || player.spotTarget || player.sitting || UI.talking || traveling) return;
  if (player.hp < D.maxHp * 0.3) { if (!autoWarned) { autoWarned = true; UI.toast('Auto hunt paused: HP is low. Drink a potion or rest.'); } return; }
  autoWarned = false;
  let best = null, bd = AUTO_R;
  for (const it of items) { const d = Math.hypot(it.pos.x - player.pos.x, it.pos.z - player.pos.z); if (d < 6 && d < bd) { bd = d; best = { it }; } }
  if (best) { player.pickTarget = best.it; return; }
  bd = AUTO_R;
  for (const m of monsters) { if (!m.alive || !m.active || m.k.passive || m.practice) continue; const d = Math.hypot(m.pos.x - player.pos.x, m.pos.z - player.pos.z); if (d < bd) { bd = d; best = m; } }
  if (best) { player.target = best; best.show = 4; }
}
function updatePlayer(dt) {
  const j = hero.j;
  for (let i = 0; i < 6; i++) player.cds[i] = Math.max(0, player.cds[i] - dt);
  player.atkCd = Math.max(0, player.atkCd - dt); player.rallyT = Math.max(0, player.rallyT - dt);
  if (player.dead) {
    player.dead += dt; const k = Math.min(1, player.dead / 0.6);
    hero.rig.rotation.x = -k * 1.45; hero.rig.position.y = k * 0.1; if (player.dead > 2.6) reviveInTown();
    hero.root.rotation.y = player.face; return;
  }
  // recovery: fast in town, quicker while sitting, slow otherwise
  const inTown = player.zone === 'town';
  if (player.sitting) player.sitT += dt;
  let hpR = 0, mpR = D.mpRegen;
  if (inTown) { hpR = D.maxHp * 0.06; mpR = D.maxMp * 0.06; }
  else if (player.sitting && player.sitT > 1) { hpR = D.maxHp * 0.025; mpR = Math.max(mpR, D.maxMp * 0.02); }
  else if (time - player.lastHurt > 6) hpR = D.maxHp * 0.004;
  player.hp = Math.min(D.maxHp, player.hp + hpR * dt); player.mp = Math.min(D.maxMp, player.mp + mpR * dt);

  // status effects and buffs run down
  const head = V3(player.pos.x, player.pos.y + 1.75, player.pos.z);
  if (player.poison) {
    const ps = player.poison; ps.t -= dt; ps.acc += dt;
    if (ps.acc >= 1) { ps.acc -= 1; const d = Math.min(ps.dps, Math.ceil(player.hp) - 1); if (d > 0) { player.hp -= d; floatText('-' + d, 'poison', head); } spawnPuff(V3(player.pos.x + rnd(-0.3, 0.3), player.pos.y + 1.2, player.pos.z + rnd(-0.3, 0.3)), 0x9ae070, true); }
    if (ps.t <= 0) player.poison = null;
  }
  player.stun = Math.max(0, player.stun - dt); player.freeze = Math.max(0, player.freeze - dt);
  for (const id in player.buffs) { const b = player.buffs[id]; b.t -= dt; if (b.t <= 0) delete player.buffs[id]; }
  const held = player.stun > 0 || player.freeze > 0;
  if (held && player.action) player.action = null;
  autoHunt();

  let moving = false;
  const a = player.action;
  if (held) { /* dizzy or frozen: stand still */ }
  else if (a) {
    if (hitStop <= 0) a.t += dt * (a.basic ? D.speed * (1 + buffSum('speed')) : 1);
    const k = a.t / a.def.dur;
    if (a.target && a.target.alive) faceTo(Math.atan2(a.target.pos.x - player.pos.x, a.target.pos.z - player.pos.z), dt);
    const st = stepAt(a.def.step, Math.min(1, k)), ds = st - a.stepDone; a.stepDone = st;
    if (ds) W.tryMove(player.pos, player.pos.x + Math.sin(player.face) * ds, player.pos.z + Math.cos(player.face) * ds, false);
    if (a.def.move) a.def.move(a, k, dt);
    if (!a.swung && k > a.def.hit - 0.18) { a.swung = true; if (a.type.startsWith('combo') || a.type === 'bash') sfx.swing(); }
    if (!a.done && k >= a.def.hit) { a.done = true; actionHit(a); }
    if (k >= 1) { player.action = null; if (a.type.startsWith('combo')) { player.combo = (player.combo + 1) % 3; player.lastAtk = time; } }
  } else if (player.target) {
    const m = player.target;
    if (!m.alive) player.target = null;
    else {
      // bows, slingshots, spells, missiles and lasers attack from a distance
      const ranged = D.range > 0, d = Math.hypot(m.pos.x - player.pos.x, m.pos.z - player.pos.z), range = ranged ? D.range + buffSum('range') : 1.25 + m.k.radius * m.scale / 0.72;
      if (d > range) { moveToward(m.pos.x, m.pos.z, dt, range - 0.1); moving = true; }
      else {
        faceTo(Math.atan2(m.pos.x - player.pos.x, m.pos.z - player.pos.z), dt);
        if (player.atkCd <= 0) {
          if (ranged) { player.atkCd = 0.12; startAction(RANGED_ACT[D.weapon] || 'cast', m); }
          else { if (time - player.lastAtk > 1.3) player.combo = 0; player.atkCd = 0.18; startAction('combo' + player.combo, m); comboShout(player.combo); }
        }
      }
    }
  } else if (player.pickTarget) {
    const it = player.pickTarget;
    if (!items.includes(it)) player.pickTarget = null;
    else {
      const d = Math.hypot(it.pos.x - player.pos.x, it.pos.z - player.pos.z);
      if (d <= 1.0) pickup(it);
      else if (moveToward(it.pos.x, it.pos.z, dt, 0.8)) { if (Math.hypot(it.pos.x - player.pos.x, it.pos.z - player.pos.z) <= 1.4) pickup(it); else player.pickTarget = null; }
      else moving = true;
    }
  } else if (player.npcTarget) {
    const n = player.npcTarget, d = Math.hypot(n.x - player.pos.x, n.z - player.pos.z);
    if (d <= 2.4) talkTo(n);
    else if (moveToward(n.x, n.z, dt, 2.2)) { if (Math.hypot(n.x - player.pos.x, n.z - player.pos.z) <= 3.4) talkTo(n); else player.npcTarget = null; }
    else moving = true;
  } else if (player.spotTarget) {
    const s = player.spotTarget, d = Math.hypot(s.x - player.pos.x, s.z - player.pos.z);
    if (d <= s.range) useSpot(s);
    else if (moveToward(s.x, s.z, dt, s.range - 0.2)) { if (Math.hypot(s.x - player.pos.x, s.z - player.pos.z) <= s.range + 1.2) useSpot(s); else player.spotTarget = null; }
    else moving = true;
  } else if (player.dest) { if (moveToward(player.dest.x, player.dest.z, dt)) player.dest = null; else moving = true; }
  W.collide(player.pos, 0.32);
  for (const n of npcs) { if (!here(n)) continue; const dx = player.pos.x - n.x, dz = player.pos.z - n.z, dd = Math.hypot(dx, dz); if (dd < 0.8 && dd > 0.001) { player.pos.x = n.x + dx / dd * 0.8; player.pos.z = n.z + dz / dd * 0.8; } }
  player.pos.y = W.height(player.pos.x, player.pos.z);
  hero.root.rotation.y = player.face;
  if (talkNpc && Math.hypot(talkNpc.x - player.pos.x, talkNpc.z - player.pos.z) > 6) { UI.hideDialog(); if (UI.isOpen('shopPanel')) UI.close('shopPanel'); talkNpc = null; }
  if (moving && player.sitting) standUp();

  // pose: idle, run and sit blend smoothly; actions blend in and out on top
  if (moving) { player.runPh += dt * 11; player.idleT = 0; } else player.idleT += dt;
  pose.runW += ((moving ? 1 : 0) - pose.runW) * Math.min(1, dt * 9);
  pose.sitW += ((player.sitting ? 1 : 0) - pose.sitW) * Math.min(1, dt * 5);
  const rw = pose.runW, ph = player.runPh, sr = Math.sin(ph), br = Math.sin(time * 2.1), sway = Math.sin(time * 0.9);
  const idle = {
    hipL: 0.02 + sway * 0.03, hipR: -0.02 - sway * 0.03, kneeL: 0.06 + Math.max(0, sway) * 0.08, kneeR: 0.06 + Math.max(0, -sway) * 0.08,
    armLx: 0.05 + br * 0.03, armRx: -0.04 + br * 0.03, armLz: 0.16 + br * 0.03, armRz: -0.15 - br * 0.03, elL: -0.32, elR: -0.42,
    twist: Math.sin(time * 0.5) * 0.05, lean: 0.04, jump: 0, pelvis: 0, roll: sway * 0.025,
    headX: Math.sin(time * 0.7) * 0.04, headY: Math.sin(time * 0.37) * 0.22, headZ: -sway * 0.02, stick: 2.2
  };
  if (!moving && !a && !player.sitting && player.idleT > 8) {
    player.fidgetT += dt; const f = Math.sin(Math.min(1, player.fidgetT / 1.8) * Math.PI);
    idle.armLx = idle.armRx = 2.9 * f; idle.elL = idle.elR = -0.3 - 0.3 * f; idle.lean = 0.04 - 0.16 * f; idle.headX = -0.25 * f; idle.armLz = 0.16 + 0.2 * f; idle.armRz = -0.15 - 0.2 * f;
    if (player.fidgetT > 1.8) { player.idleT = 0; player.fidgetT = 0; }
  } else if (moving || a) player.fidgetT = 0;
  const run = {
    hipL: -sr * 0.8, hipR: sr * 0.8, kneeL: 0.28 + 0.9 * Math.max(0, Math.sin(ph + 0.9)), kneeR: 0.28 + 0.9 * Math.max(0, Math.sin(ph + 0.9 + Math.PI)),
    armLx: sr * 0.85, armRx: -sr * 0.85, armLz: 0.22, armRz: -0.22, elL: -1.1 - 0.3 * Math.max(0, sr), elR: -1.1 - 0.3 * Math.max(0, -sr),
    twist: -sr * 0.16, lean: 0.22, jump: 0.015 + Math.abs(sr) * 0.045, pelvis: sr * 0.12, roll: sr * 0.03,
    headX: -0.14, headY: 0, headZ: Math.sin(ph - 0.6) * 0.035, stick: 1.6
  };
  const P2 = {}; for (const key in idle) P2[key] = lerp(idle[key], run[key], rw);
  if (pose.sitW > 0.001) {
    const S = { hipL: -1.45, hipR: -1.5, kneeL: 0.12, kneeR: 0.05, armLx: -0.35, armRx: -0.3, armLz: 0.3, armRz: -0.3, elL: -0.7, elR: -0.6, twist: 0, lean: -0.08 + br * 0.015, jump: -0.54, pelvis: 0, roll: 0, headX: 0.12 + Math.sin(time * 0.5) * 0.05, headY: Math.sin(time * 0.3) * 0.3, headZ: 0, stick: 2.6 };
    for (const key in S) P2[key] = lerp(P2[key], S[key], pose.sitW);
  }
  const turn = clamp(wrapAngle(player.face - pose.lastFace) / Math.max(dt, 0.001), -8, 8); pose.lastFace = player.face;
  P2.roll -= turn * 0.018 * rw;
  if (a) {
    const k = clamp(a.t / a.def.dur, 0, 1), v = sampleKeys(a.def.keys, k, a.def.strike);
    const A = { armRx: v[0], armRz: v[1], elR: v[2], twist: v[3], lean: v[4], jump: v[5], armLx: -v[3] * 0.5, armLz: 0.35, elL: -0.8, stick: 1.3, hipL: -0.32, hipR: 0.26, kneeL: 0.22, kneeR: 0.38, pelvis: v[3] * 0.35, headY: -v[3] * 0.4, headX: 0, roll: 0 };
    if (a.def.spin) { A.twist = k * Math.PI * 2 * a.def.spin; A.pelvis = 0; A.armLz = 1.45; A.armLx = 0; A.elL = -0.1; A.headY = 0; }
    if (a.type === 'rally') { A.armLx = A.armRx; A.armLz = -A.armRz; A.elL = A.elR; A.hipL = A.hipR = 0.05; A.kneeL = A.kneeR = 0.1; }
    if (a.type === 'pebble' || a.type === 'sling') { A.stick = 2.4; A.armLx = 0.6; A.armLz = 0.4; }
    // the bow is held out in front with the left hand while the right hand draws the string
    if (a.def.bow && weaponNow() === 'bow') { A.armLx = -1.45; A.armLz = 0.12; A.elL = -0.1; A.bowAim = 1; }
    // two swords: the left arm swings too
    if (weaponNow() === 'dualSwords' && a.type.startsWith('combo')) { A.armLx = -A.armRx * 0.7 - 0.2; A.armLz = 0.5; A.elL = A.elR; }
    // staffs, books and machine arms point forward when casting or firing
    if ((a.type === 'cast' || a.type === 'fire' || a.type === 'zap' || a.type === 'beam') && weaponNow() === 'book') { A.armLx = -0.8; A.armLz = 0.25; A.elL = -1.4; }
    pose.act = A; pose.actW = Math.min(1, pose.actW + dt * 16);
  } else pose.actW = Math.max(0, pose.actW - dt * 6);
  if (pose.act && pose.actW > 0) for (const key in pose.act) P2[key] = lerp(P2[key], pose.act[key], pose.actW);
  j.hipL.rotation.x = P2.hipL; j.hipR.rotation.x = P2.hipR; j.kneeL.rotation.x = P2.kneeL; j.kneeR.rotation.x = P2.kneeR;
  j.ankleL.rotation.x = -(P2.hipL + P2.kneeL) * 0.6 * (1 - pose.sitW); j.ankleR.rotation.x = -(P2.hipR + P2.kneeR) * 0.6 * (1 - pose.sitW);
  j.armL.rotation.set(P2.armLx, 0, P2.armLz); j.armR.rotation.set(P2.armRx, 0, P2.armRz); j.elbowL.rotation.x = P2.elL; j.elbowR.rotation.x = P2.elR;
  hero.rig.rotation.set(0, P2.pelvis, P2.roll); hero.rig.position.y = P2.jump;
  j.upper.rotation.set(P2.lean, P2.twist - P2.pelvis, -P2.roll * 0.6); if (j.weapon) j.weapon.rotation.x = hero.wBase + (P2.stick - 2.2); if (j.offhand && weaponNow() === 'dualSwords') j.offhand.rotation.x = hero.oBase + (P2.stick - 2.2);
  if (j.offhand && hero.oRest && weaponNow() === 'bow') { const w = pose.act && pose.act.bowAim ? pose.actW : 0; j.offhand.position.set(lerp(hero.oRest.p.x, 0.04, w), lerp(hero.oRest.p.y, 0.16, w), lerp(hero.oRest.p.z, 0.02, w)); }
  if (j.flames) for (const f of j.flames) f.scale.y = 0.7 + Math.random() * 0.6;
  if (j.core) j.core.material.emissiveIntensity = 0.8 + Math.sin(time * 4) * 0.3;
  j.upper.scale.y = 1 + (1 - rw) * br * 0.012;
  j.head.rotation.set(P2.headX, P2.headY, P2.headZ);
  j.hair.rotation.z = Math.sin(time * 1.3) * 0.035 + P2.headZ * 0.5; j.hair.rotation.x = Math.sin(time * 0.9) * 0.02 - rw * 0.08;
  player.blinkT -= dt;
  const closed = (player.blinkT < 0.12 && player.blinkT > 0) || (player.fidgetT > 0.4 && player.fidgetT < 1.5) || (player.sitting && player.sitT > 4 && Math.sin(time * 0.4) > 0.3);
  if (player.blinkT < 0) player.blinkT = rnd(2.5, 5);
  const want = closed ? j.faceClosed : j.faceOpen; if (j.faceMat.map !== want) { j.faceMat.map = want; j.faceMat.needsUpdate = true; }
  if (moving) { player.dustT -= dt; if (player.dustT <= 0) { player.dustT = 0.17; spawnPuff(V3(player.pos.x, player.pos.y + 0.08, player.pos.z)); } }
}
function updateMonsters(dt) {
  const mdt = hitStop > 0 ? dt * 0.1 : dt;
  for (const m of monsters) {
    const far = Math.hypot(m.pos.x - player.pos.x, m.pos.z - player.pos.z) > 95;
    if (!m.alive) {
      if (m.dying > 0) {
        m.dying += dt; const k = Math.min(1, m.dying / 0.75);
        if (m.k.die === 'light') { // a dark crystal lights up and stays lit
          m.dying = 0; m.lit = true; m.respawnAt = Infinity; m.p.mat.color.setHex(0xffe08a); m.p.mat.emissive.setHex(0x8a6010); if (m.p.halo) m.p.halo.material.opacity = 0.75; spawnRing(m.pos, 0xffe08a, 2, 0.5); sfx.sparkle(); continue;
        }
        if (m.k.die === 'pop') { m.body.scale.setScalar(1 + k * 1.5); if (k > 0.2) { m.dying = 0.75; for (let i = 0; i < 6; i++) spawnPuff(V3(m.pos.x + rnd(-0.4, 0.4), m.pos.y + 0.5, m.pos.z + rnd(-0.4, 0.4)), [0xe8604c, 0xf4c542, 0x7cc4ff][i % 3], true); } }
        else if (m.k.die === 'melt') { m.body.scale.set(1 + k * 0.7, Math.max(0.05, 1 - k * 0.95), 1 + k * 0.7); m.body.position.set(0, 0, 0); setFace(m, 'hurt'); }
        else if (m.k.die === 'tip') {
          // tips over onto its side, then puffs away in a little cloud of dust
          const tk = Math.min(1, m.dying / 0.35); m.body.rotation.set(0, 0, tk * 1.45); m.body.position.y = tk * 0.15; setFace(m, 'dizzy');
          if (m.dying > 0.4) { const s = Math.max(0.05, 1 - (m.dying - 0.4) / 0.35); m.body.scale.setScalar(s); if (Math.random() < 0.6) spawnPuff(V3(m.pos.x + rnd(-0.5, 0.5), m.pos.y + 0.3, m.pos.z + rnd(-0.5, 0.5)), 0xe8dcc4, true); }
        }
        else { m.body.scale.setScalar(Math.max(0.05, 1 - k)); if (Math.random() < 0.5) spawnPuff(V3(m.pos.x + rnd(-0.4, 0.4), m.pos.y + 0.6, m.pos.z + rnd(-0.4, 0.4)), m.kind === 'moss_mushling' ? 0xc8f0b0 : 0xf6e6c4, true); }
        if (k >= 1) { m.dying = 0; m.root.visible = false; rollDrops(m); m.respawnAt = time + (m.k.respawn || 60); if (m.quest || m.golden) m.gone = true; }
      } else if (time >= m.respawnAt) {
        let x = m.home.x, z = m.home.z, g = 0;
        do { const ang = rnd(0, 6), r = rnd(0, 3); x = m.home.x + Math.cos(ang) * r; z = m.home.z + Math.sin(ang) * r; } while (!W.walkable(x, z, true) && g++ < 10);
        m.pos.set(x, W.height(x, z), z);
        m.hp = m.st.hp; m.alive = true; m.root.visible = !far; m.body.scale.set(1, 1, 1); m.body.rotation.set(0, 0, 0); m.body.position.set(0, 0, 0); m.wTarget = null; setFace(m, 'normal');
        if (!far) spawnRing(m.pos, 0xffffff, 1.2, 0.4);
      }
      continue;
    }
    // a golden monster that nobody fights wanders off after a while
    if (m.golden && !m.aggro) { m.life -= dt; if (m.life <= 0) { m.alive = false; m.gone = true; m.root.visible = false; hideEl(m.tag); if (!far) { spawnRing(m.pos, 0xffd84d, 2, 0.6); for (let i = 0; i < 6; i++) spawnPuff(V3(m.pos.x + rnd(-0.6, 0.6), m.pos.y + 0.6, m.pos.z + rnd(-0.6, 0.6)), 0xffe48a, true); } continue; } }
    if (m.golden && m.p.halo) m.p.halo.material.opacity = 0.4 + Math.sin(time * 3) * 0.15;
    m.active = !far;
    if (far) { if (m.root.visible) m.root.visible = false; if (m.aggro) { m.aggro = false; m.atk = null; m.chg = null; } continue; }
    if (!m.root.visible) m.root.visible = true;
    m.t += mdt;
    let moving = false, sp = 0, tx = 0, tz = 0, puff = 0, lunge = 0, rush = 0;
    const dPlayer = Math.hypot(player.pos.x - m.pos.x, player.pos.z - m.pos.z);
    const dizzy = (m.hp / m.st.hp < 0.25 && !m.k.target) || m.stun > 0;
    // status effects: dizzy and frozen monsters stand still; poison drains HP every second
    const held = (m.stun || 0) > 0 || (m.freeze || 0) > 0;
    if (m.stun > 0) m.stun = Math.max(0, m.stun - dt);
    if (m.slowT > 0) m.slowT = Math.max(0, m.slowT - dt);
    if (m.weakT > 0) m.weakT = Math.max(0, m.weakT - dt);
    if (m.freeze > 0) { m.freeze = Math.max(0, m.freeze - dt); if (!m.ice) { m.ice = new THREE.Mesh(geoSphere(0.75, 14, 10), new THREE.MeshLambertMaterial({ color: 0xbfe8ff, emissive: 0x2a5a80, transparent: true, opacity: 0.45, depthWrite: false })); m.ice.position.y = 0.6; m.root.add(m.ice); } }
    if (m.ice) m.ice.visible = m.freeze > 0;
    if (m.poison) {
      const ps = m.poison; ps.t -= dt; ps.acc += dt;
      if (ps.acc >= 1) { ps.acc -= 1; const d = Math.max(1, Math.round(D.atk * ps.dps)); m.hp -= d; floatText('-' + d, 'poison', V3(m.pos.x, m.pos.y + (m.k.headY + 0.6) * m.scale, m.pos.z)); spawnPuff(V3(m.pos.x, m.pos.y + 0.8 * m.scale, m.pos.z), 0x9ae070, true); if (m.hp <= 0) { m.poison = null; killMonster(m); continue; } }
      if (ps.t <= 0) m.poison = null;
    }
    // some monsters (Bristleboars, Thornhogs) attack first when you come close
    if (!m.aggro && m.k.aggro && !player.dead && P && player.zone !== 'town' && !traveling && dPlayer < m.k.aggro * (m.golden ? 1.3 : 1)) { m.aggro = true; m.atkCd = 0.7; m.chgCd = 0; m.show = 4; m.wTarget = null; emit('aggro', m); }
    // delivery 8 monsters (river.js) can take over their own moves: fleeing squirrels, sleeping bushes, the Old Rootling
    const own = !held && RW.river ? RW.river.ai(m, mdt, dPlayer) : null;
    if (held) { m.atk = null; m.chg = null; }
    else if (own) { if (own.sp) { tx = own.tx; tz = own.tz; sp = own.sp; moving = true; } if (own.lunge) lunge = own.lunge; if (own.puff) puff = own.puff; }
    else if (m.aggro) {
      if (player.dead || (player.zone === 'town' && m.quest !== 'trial') || Math.hypot(m.pos.x - m.home.x, m.pos.z - m.home.z) > 22) { m.aggro = false; m.atk = null; m.chg = null; m.wTarget = m.home.clone(); }
      else if (m.chg || (m.k.charge && !m.atk && (m.chgCd -= mdt) <= 0 && dPlayer > 3.2 && dPlayer < 14)) {
        // the charge: paw the ground, then run straight at the hero and slam into them. It always lands.
        const C = m.chg || (m.chg = { phase: 'paw', t: 0, dust: 0 });
        C.t += mdt;
        const face = Math.atan2(player.pos.x - m.pos.x, player.pos.z - m.pos.z);
        if (C.phase === 'paw') {
          m.root.rotation.y += wrapAngle(face - m.root.rotation.y) * Math.min(1, mdt * 8);
          puff = 0.4 + Math.sin(C.t * 18) * 0.3; m.body.rotation.x = Math.sin(C.t * 14) * 0.12;
          C.dust -= mdt; if (C.dust <= 0) { C.dust = 0.12; spawnPuff(V3(m.pos.x + Math.sin(m.root.rotation.y) * 0.5, m.pos.y + 0.08, m.pos.z + Math.cos(m.root.rotation.y) * 0.5)); }
          if (C.t > 0.95) { C.phase = 'run'; C.t = 0; sfx.charge(); m.show = 4; }
        } else if (C.phase === 'run') {
          m.root.rotation.y += wrapAngle(face - m.root.rotation.y) * Math.min(1, mdt * 10);
          const step = 11 * mdt, reach = m.k.radius * m.scale / 0.72 + 1.0;
          if (dPlayer > reach) { if (!W.tryMove(m.pos, m.pos.x + Math.sin(face) * step, m.pos.z + Math.cos(face) * step, true)) { C.phase = 'rest'; C.t = 0; } rush = 1; m.hop += mdt * 22; C.dust -= mdt; if (C.dust <= 0) { C.dust = 0.07; spawnPuff(V3(m.pos.x, m.pos.y + 0.1, m.pos.z)); } }
          if (dPlayer <= reach + 0.2) {
            hurtPlayer(rnd(m.st.dmg[0], m.st.dmg[1]) * m.k.charge, true); if (m.k.stun && !player.dead && Math.random() < m.k.stun) stunPlayer(1.6);
            const dx = (player.pos.x - m.pos.x) / (dPlayer || 1), dz = (player.pos.z - m.pos.z) / (dPlayer || 1);
            W.tryMove(player.pos, player.pos.x + dx * 1.2, player.pos.z + dz * 1.2, false);
            spawnRing(player.pos, 0xffffff, 1.8, 0.4); spawnSpark(V3(player.pos.x, player.pos.y + 1, player.pos.z), true); hitStop = Math.max(hitStop, 0.1);
            C.phase = 'rest'; C.t = 0;
          } else if (C.t > 2.2) { C.phase = 'rest'; C.t = 0; }
        } else if (C.t > 1.1) { m.chg = null; m.chgCd = rnd(5, 8); m.atkCd = 0.6; }
        else { puff = Math.sin(C.t * 9) * 0.08; m.root.rotation.y += wrapAngle(face - m.root.rotation.y) * Math.min(1, mdt * 4); }
      }
      else if (m.atk) {
        m.atk.t += mdt; const A = m.atk;
        if (A.t < 0.38) { A.phase = 'wind'; puff = A.t / 0.38; }
        else { A.phase = 'strike'; const u = (A.t - 0.38) / 0.28; lunge = Math.sin(Math.min(1, u) * Math.PI); if (!A.hit && u > 0.45) { A.hit = true; if (dPlayer < (m.k.reach ? m.k.reach + 0.5 : m.k.radius * m.scale / 0.72 + 1.7) && !(RW.pets && RW.pets.intercept(m))) { hurtPlayer(rnd(m.st.dmg[0], m.st.dmg[1]) * (m.weakT > 0 ? 0.7 : 1)); if (m.k.poison && !player.dead && Math.random() < m.k.poison) poisonPlayer(); if (RW.river) RW.river.struck(m); } } if (u >= 1) { m.atk = null; m.atkCd = m.k.atkGap * (m.k.boss ? 0.9 : 0.85); } }
      } else {
        m.atkCd -= mdt;
        const reach = m.k.reach || m.k.radius + 1.3, stop = m.k.reach ? m.k.reach - 0.4 : m.k.radius + 1.1;
        if (dPlayer > reach || (m.atkCd > 0 && dPlayer > stop)) { tx = player.pos.x; tz = player.pos.z; sp = m.k.chase * (dizzy ? 0.6 : 1) * (m.slowT > 0 ? 0.5 : 1); moving = dPlayer > stop; }
        if (dPlayer <= reach && m.atkCd <= 0) m.atk = { t: 0, hit: false };
        m.root.rotation.y += wrapAngle(Math.atan2(player.pos.x - m.pos.x, player.pos.z - m.pos.z) - m.root.rotation.y) * Math.min(1, mdt * 7);
      }
    } else {
      if (m.hp < m.st.hp) m.hp = Math.min(m.st.hp, m.hp + m.st.hp * 0.08 * mdt);
      if (!m.wTarget) { m.wPause -= mdt; if (m.wPause <= 0) { const ang = rnd(0, 6), r = rnd(1, 5); m.wTarget = V3(m.home.x + Math.cos(ang) * r, 0, m.home.z + Math.sin(ang) * r); } }
      if (m.wTarget) { tx = m.wTarget.x; tz = m.wTarget.z; sp = m.k.speed * (Math.hypot(m.pos.x - m.home.x, m.pos.z - m.home.z) > 8 ? 2.2 : 1); moving = true; if (Math.hypot(tx - m.pos.x, tz - m.pos.z) < 0.25) { m.wTarget = null; m.wPause = rnd(1.5, 4.5); moving = false; } }
    }
    if (moving && sp) {
      const dx = tx - m.pos.x, dz = tz - m.pos.z, d = Math.hypot(dx, dz) || 1;
      if (!W.tryMove(m.pos, m.pos.x + (dx / d) * sp * mdt, m.pos.z + (dz / d) * sp * mdt, true) && !m.aggro) { m.wTarget = null; m.wPause = rnd(0.5, 2); }
      m.root.rotation.y += wrapAngle(Math.atan2(dx, dz) - m.root.rotation.y) * Math.min(1, mdt * 6);
    }
    if (moving) m.hop += mdt * (m.k.move === 'hop' ? 7 : m.k.move === 'trot' ? 12 : 9);
    if (m.kb) { m.kb.t += dt; const u = Math.min(1, m.kb.t / 0.16), step = m.kb.d * (smooth01(u) - (m.kb.last || 0)); m.kb.last = smooth01(u); W.tryMove(m.pos, m.pos.x + m.kb.x * step, m.pos.z + m.kb.z * step, true); if (u >= 1) m.kb = null; }
    W.collide(m.pos, 0.45);
    m.pos.y = W.height(m.pos.x, m.pos.z) + (m.k.fly || 0);
    // expressive body
    m.hurtT = Math.max(0, m.hurtT - dt);
    const h = m.hurtT / 0.38;
    let sx = 1, sy = 1;
    if (m.k.move === 'still') { sy = 1; }
    else if (m.k.move === 'float') { m.body.position.y = Math.sin(m.t * 1.8) * 0.15; m.body.rotation.z = Math.sin(m.t * 1.2) * 0.08; }
    else if (m.k.move === 'hop') {
      const hop = moving ? Math.abs(Math.sin(m.hop)) : 0;
      m.body.position.y = hop * (m.kind === 'breeze_leaflet' ? 0.45 : 0.32);
      sy = moving ? 1 + Math.cos(m.hop * 2) * 0.12 : 1 + Math.sin(m.t * 3.2) * 0.05; sx = 1 / Math.sqrt(sy);
    } else if (m.k.move === 'trot') {
      // four little legs: trotting, or a blur of feet in a charge
      const go = moving || rush, ph = m.hop;
      m.body.position.y = go ? Math.abs(Math.sin(ph)) * (rush ? 0.12 : 0.06) : 0;
      if (!(m.chg && m.chg.phase === 'paw')) m.body.rotation.x = rush ? 0.18 : go ? Math.sin(ph * 2) * 0.03 : 0;
      m.body.rotation.z = go ? 0 : Math.sin(m.t * 1.4) * 0.02;
      if (m.p.legs) m.p.legs.forEach((lg, i) => { lg.rotation.x = go ? Math.sin(ph + (i % 2 === (i < 2 ? 0 : 1) ? 0 : Math.PI)) * (rush ? 0.9 : 0.55) : 0; });
      sy = 1 + Math.sin(m.t * 2.4) * 0.02;
    } else {
      m.body.rotation.z = moving ? Math.sin(m.hop) * 0.14 : Math.sin(m.t * 1.6) * 0.03; m.body.position.y = moving ? Math.abs(Math.sin(m.hop)) * 0.08 : 0;
      sy = 1 + Math.sin(m.t * 2.4) * 0.025;
    }
    const pf = 1 + puff * 0.2;
    sx *= pf * (1 + h * 0.18); sy *= pf * (1 - h * 0.28);
    m.body.scale.set(sx, sy, sx);
    m.body.position.z = lunge * 0.45;
    if (dizzy) m.body.rotation.z = Math.sin(m.t * 6) * 0.18;
    let face = m.aggro ? 'angry' : 'normal';
    if (dizzy) face = 'dizzy';
    if (m.hurtT > 0) face = 'hurt';
    setFace(m, face);
    m.p.sweat.visible = m.hurtT > 0;
    m.p.stars.visible = dizzy; if (dizzy) m.p.stars.rotation.y += dt * 4;
    if (RW.river) RW.river.anim(m, mdt, moving, lunge);
    m.show = Math.max(0, m.show - dt);
  }
  // story monsters (like the ones around Olly) do not come back
  for (let i = monsters.length - 1; i >= 0; i--) if (monsters[i].gone) { const m = monsters[i]; scene.remove(m.root); m.tag.remove(); monsters.splice(i, 1); }
}
function removeMonster(m) { m.alive = false; m.gone = true; m.root.visible = false; hideEl(m.tag); if (player.target === m) player.target = null; }
function updateNpcs(dt) {
  for (const n of npcs) {
    n.t += dt;
    const d = Math.hypot(player.pos.x - n.x, player.pos.z - n.z);
    const want = (d < 7 && !player.dead) ? Math.atan2(player.pos.x - n.x, player.pos.z - n.z) : n.home;
    n.look += wrapAngle(want - n.look) * Math.min(1, dt * 2.5);
    n.c.root.rotation.y = n.look;
    n.c.root.scale.set(n.c.opts.size, n.c.opts.size * (1 + Math.sin(n.t * 2.1) * 0.012), n.c.opts.size);
    const fm = n.c.j.faceMat;
    if (fm) {
      n.blinkT -= dt; if (n.blinkT < 0) n.blinkT = rnd(2.5, 5.5);
      const shut = n.c.opts.closed || (n.blinkT > 0 && n.blinkT < 0.12);
      const map = shut ? n.c.j.faceClosed : n.c.j.faceOpen; if (fm.map !== map) { fm.map = map; fm.needsUpdate = true; }
    }
  }
}
function updateItems(dt) {
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i]; it.t += dt; it.life -= dt;
    if (it.life <= 0) { scene.remove(it.root); it.tag.remove(); items.splice(i, 1); continue; }
    it.spin.rotation.y += dt * 1.6; it.spin.position.y = 0.35 + Math.sin(it.t * 3) * 0.06; it.ring.material.opacity = 0.35 + Math.sin(it.t * 4) * 0.2;
    if (it.life < 8) it.root.visible = Math.sin(it.life * 12) > -0.3;
  }
}
function updateCamera(dt) {
  if (keys.has('q')) cam.yaw += dt * 1.6; if (keys.has('e')) cam.yaw -= dt * 1.6;
  const k = 1 - Math.exp(-dt * 6);
  cam.tx = lerp(cam.tx, player.pos.x, k); cam.ty = lerp(cam.ty, player.pos.y + 0.9 - pose.sitW * 0.4, k); cam.tz = lerp(cam.tz, player.pos.z, k);
  const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  camera.position.set(cam.tx + Math.sin(cam.yaw) * cp * cam.dist, cam.ty + sp * cam.dist, cam.tz + Math.cos(cam.yaw) * cp * cam.dist);
  const floor = W.height(camera.position.x, camera.position.z) + 1.5; if (camera.position.y < floor) camera.position.y = floor;
  camera.lookAt(cam.tx, cam.ty, cam.tz);
  if (shakeT > 0) { shakeT = Math.max(0, shakeT - dt); const a = shakeT * 1.2; camera.position.x += rnd(-a, a); camera.position.y += rnd(-a, a); }
  W.focusU.value.set(cam.tx, cam.ty + 0.4, cam.tz); W.camU.value.copy(camera.position);
}
const V_HEAD = V3(0, 0, 0);
function updateLabels(dt) {
  const lift = RW.story && RW.story.olly.perched ? 0.42 : 0; // Olly sitting on the hero's head
  place(heroTag, V_HEAD.set(player.pos.x, player.pos.y + 1.78 - pose.sitW * 0.5 + lift, player.pos.z), 0);
  if (player.sitting && player.sitT > 4) { place(sitZ, V_HEAD.set(player.pos.x + 0.3, player.pos.y + 1.7 + Math.sin(time * 1.5) * 0.1, player.pos.z), 0); sitZ.style.opacity = String(0.6 + Math.sin(time * 2) * 0.3); } else hideEl(sitZ);
  for (const m of monsters) {
    const want = m.alive && m.active && !m.hide && (m.show > 0 || m.aggro || player.target === m);
    if (!want) { hideEl(m.tag); continue; }
    if (place(m.tag, V_HEAD.set(m.pos.x, m.pos.y + (m.k.headY + 0.75) * m.scale + 0.25, m.pos.z), 0)) m.tagHp.style.width = Math.max(0, m.hp / m.st.hp * 100) + '%';
  }
  if (RW.pets) RW.pets.labels();
  for (const it of items) { if (it.pos.distanceToSquared(player.pos) < 40 * 40) place(it.tag, V_HEAD.set(it.pos.x, it.pos.y + 0.75, it.pos.z), 0); else hideEl(it.tag); }
  for (const n of npcs) { if (here(n) && Math.hypot(n.x - player.pos.x, n.z - player.pos.z) < 45) place(n.tag, V_HEAD.set(n.x, n.c.root.position.y + 2.05 * n.c.opts.size, n.z), 0); else hideEl(n.tag); }
  for (const s of spots) { if (!s.hidden && here(s) && Math.hypot(s.x - player.pos.x, s.z - player.pos.z) < (s.far || 40)) place(s.tag, V_HEAD.set(s.x, s.y0 + (s.tagY || 2.2), s.z), 0); else hideEl(s.tag); }
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i]; f.t += dt;
    if (f.t >= f.dur) { f.el.remove(); floaters.splice(i, 1); continue; }
    if (place(f.el, f.pos, -f.t * 46)) { f.el.style.transform += ' translateX(' + f.jx.toFixed(1) + 'px)'; f.el.style.opacity = String(1 - Math.pow(f.t / f.dur, 2)); }
  }
}

// ---------- HUD ----------
const $ = (id) => document.getElementById(id);
const hud = {
  hpFill: $('hpFill'), hpText: $('hpText'), mpFill: $('mpFill'), mpText: $('mpText'), plv: $('plv'), coin: $('coinText'), badge: $('ptBadge'),
  expFill: $('expFill'), expText: $('expText'), gfg: $('gfg'), ult: $('ult'), buffs: $('buffs'), slots: [...document.querySelectorAll('.slot')]
};
const last = {};
function setIf(key, val, fn) { if (last[key] !== val) { last[key] = val; fn(val); } }
function updateHUD() {
  const hp = Math.ceil(player.hp), mp = Math.floor(player.mp);
  setIf('hp', hp + '/' + D.maxHp, (v) => { hud.hpText.textContent = v; hud.hpFill.style.width = (hp / D.maxHp * 100) + '%'; });
  setIf('mp', mp + '/' + D.maxMp, (v) => { hud.mpText.textContent = v; hud.mpFill.style.width = (mp / D.maxMp * 100) + '%'; });
  setIf('lv', P.lv + jobNow() + (tempJob ? 't' : ''), () => { hud.plv.textContent = 'Lv. ' + P.lv + ' · ' + (jobNow() === 'novice' ? 'Novice' : RW.JOBS[jobNow()].name) + (tempJob ? ' (trying)' : ''); });
  setIf('coin', P.coins, (v) => { hud.coin.textContent = String(v); });
  setIf('pts', P.pts + (P.sp || 0), (v) => { hud.badge.hidden = v <= 0; hud.badge.textContent = String(v); });
  const ep = P.lv >= 50 ? 100 : Math.floor(P.exp / expNeed(P.lv) * 1000) / 10;
  setIf('exp', ep, (v) => { hud.expText.textContent = 'Lv. ' + P.lv + ' · EXP ' + v.toFixed(1) + '%'; hud.expFill.style.width = v + '%'; });
  setIf('ult', Math.floor(player.ult), (v) => { hud.gfg.setAttribute('stroke-dashoffset', String(157.1 * (1 - v / 100))); hud.ult.classList.toggle('ready', v >= 100); });
  // buffs and status effects as little chips under the HP bars
  const chips = [];
  if (player.rallyT > 0) chips.push(['', 'Rally ' + Math.ceil(player.rallyT) + 's']);
  for (const id in player.buffs) { const b = player.buffs[id], sk = jobSkills() && jobSkills().find((x) => x.id === id); chips.push([b.pet ? 'pet' : 'job', (b.name || (sk ? sk.name : id)) + ' ' + Math.ceil(b.t) + 's']); }
  if (RW.pets) { const lc = RW.pets.luckT(); if (lc > 0) chips.push(['pet', 'Lucky Glimmer ' + Math.ceil(lc) + 's']); }
  if (player.poison) chips.push(['bad', 'Poison ' + Math.ceil(player.poison.t) + 's']);
  if (player.stun > 0) chips.push(['bad', 'Dizzy']);
  if (player.freeze > 0) chips.push(['bad', 'Frozen']);
  if (player.zone === 'town') chips.push(['safe', 'Safe']);
  if (player.sitting) chips.push(['rest', 'Resting']);
  if (tempJob) chips.push(['job', (tempJob.mode === 'trial' ? 'Trial ' : 'Try-out ') + Math.max(0, Math.ceil(tempJob.until - time)) + 's']);
  setIf('buffs', chips.map((c) => c.join(':')).join('|'), () => { hud.buffs.innerHTML = chips.map(([c, t]) => '<span class="buff ' + c + '">' + esc(t) + '</span>').join(''); });
  const js = jobSkills();
  for (let i = 0; i < 6; i++) {
    const cd = player.cds[i], sk = i < 4 ? (js ? js[i] : SKILLS[i]) : null, max = sk ? sk.cd : 1;
    setIf('cd' + i, cd > 0 ? Math.ceil(cd * 10) : 0, () => { const el = hud.slots[i]; el.querySelector('.cd').style.height = (cd > 0 ? cd / max * 100 : 0) + '%'; el.querySelector('.cdt').textContent = cd > 0.95 ? String(Math.ceil(cd)) : ''; });
    const lv = sk && js ? skillLv(sk.id) : 1;
    const off = i < 4 ? !lv || player.mp < (js ? skillMp(sk, lv) : sk.mp) : bagCount(P.hot[i - 4]) <= 0;
    setIf('off' + i, off, (v) => hud.slots[i].classList.toggle('off', v));
    if (i < 4) setIf('lock' + i, !lv, (v) => hud.slots[i].classList.toggle('locked', v));
  }
  setIf('slots', jobNow() + weaponNow() + JSON.stringify(js ? js.map((x) => skillLv(x.id)) : []), () => { if (RW.jobs) RW.jobs.renderSlots(); });
  for (let i = 0; i < 2; i++) setIf('hc' + i, P.hot[i] + bagCount(P.hot[i]), () => { hud.slots[4 + i].querySelector('.count').textContent = String(bagCount(P.hot[i])); });
  setIf('hot', P.hot.join(), () => UI.renderHotbar());
}
const mini = $('mini'), mctx = mini.getContext('2d'), mapN = document.querySelector('.mapn');
function drawMini() {
  const Wd = mini.width, C = Wd / 2, S = 2.3, M = W.MINI;
  mctx.save(); mctx.clearRect(0, 0, Wd, Wd); mctx.fillStyle = '#5f8a44'; mctx.fillRect(0, 0, Wd, Wd);
  mctx.translate(C, C); mctx.rotate(cam.yaw); mctx.scale(S, S); mctx.translate(-player.pos.x, -player.pos.z);
  mctx.drawImage(W.miniCanvas, M.x0, M.z0, M.x1 - M.x0, M.z1 - M.z0);
  for (const m of monsters) if (m.alive && m.active && !m.hide) { mctx.fillStyle = m.golden ? '#ffd84d' : m.aggro ? '#b03a2e' : '#e65a50'; mctx.beginPath(); mctx.arc(m.pos.x, m.pos.z, m.golden ? 2.6 : 1.5, 0, Math.PI * 2); mctx.fill(); if (m.golden) { mctx.strokeStyle = '#3b2a1e'; mctx.lineWidth = 0.6; mctx.stroke(); } }
  mctx.fillStyle = '#ffe48a'; for (const it of items) { mctx.beginPath(); mctx.arc(it.pos.x, it.pos.z, 1.1, 0, Math.PI * 2); mctx.fill(); }
  mctx.fillStyle = '#3aa83a'; mctx.strokeStyle = '#fff'; mctx.lineWidth = 0.6; for (const n of npcs) { if (!here(n)) continue; mctx.beginPath(); mctx.arc(n.x, n.z, 1.6, 0, Math.PI * 2); mctx.fill(); mctx.stroke(); }
  // quest targets: a yellow star (kept at the rim of the map when far away; a target in another area shows at the gate that leads there)
  if (RW.story) for (const mk of RW.story.marks()) {
    let x = mk.x, z = mk.z;
    const mm = mk.map || W.mapAt(x, z);
    if (mm !== W.active) { const G = W.GATES.find((g) => g.map === W.active && g.to === mm); if (!G) continue; x = G.x; z = G.z; }
    const dx = x - player.pos.x, dz = z - player.pos.z, d = Math.hypot(dx, dz), rim = (Wd / 2 - 12) / S;
    if (d > rim) { x = player.pos.x + dx / d * rim; z = player.pos.z + dz / d * rim; }
    mctx.save(); mctx.translate(x, z); mctx.rotate(-cam.yaw); mctx.scale(1 / S, 1 / S);
    mctx.fillStyle = mk.color || '#ffd84d'; mctx.strokeStyle = '#3b2a1e'; mctx.lineWidth = 2.5; mctx.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 4.5 : 10, a = (i / 10) * Math.PI * 2 - Math.PI / 2; mctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    mctx.closePath(); mctx.fill(); mctx.stroke(); mctx.restore();
  }
  mctx.restore();
  mctx.save(); mctx.translate(C, C); mctx.rotate(Math.PI - player.face + cam.yaw);
  mctx.fillStyle = '#ffffff'; mctx.strokeStyle = '#3b2a1e'; mctx.lineWidth = 3; mctx.beginPath(); mctx.moveTo(0, -11); mctx.lineTo(8, 8); mctx.lineTo(0, 4); mctx.lineTo(-8, 8); mctx.closePath(); mctx.fill(); mctx.stroke();
  mctx.restore();
  const nx = Math.sin(cam.yaw), ny = -Math.cos(cam.yaw);
  mapN.style.left = (80 + nx * 66) + 'px'; mapN.style.top = (80 + ny * 66 - 8) + 'px';
}
// ---------- the area map: a big see-through map of the place you are in (map button / M) ----------
const AREA_NAMES = { meadow: 'Sunny Meadow', hills: 'Breezy Hills', wood: 'Whisperwood', river: 'Riverside', thorn: 'Thornbush', burrow: 'Rootling Burrow', cave: 'Pebble Cave' };
const amEl = $('areaMap'), amCv = $('areaMapCv'), amCtx = amCv.getContext('2d');
let amOpen = false, amT = 0;
function toggleAreaMap(on) {
  amOpen = on === undefined ? !amOpen : on;
  amEl.hidden = !amOpen; if (amOpen) { amT = 0; drawAreaMap(); }
}
$('areaMapClose').addEventListener('click', () => { sfx.click(); toggleAreaMap(false); });
$('areaMapWorld').addEventListener('click', () => { sfx.click(); toggleAreaMap(false); UI.open('mapPanel'); });
function drawAreaMap() {
  const M = W.MINI, src = W.miniCanvas; if (!M || !src) return;
  const box = amEl.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
  const mw = M.x1 - M.x0, mh = M.z1 - M.z0, availW = Math.max(200, box.width - 24), availH = Math.max(200, box.height - 70);
  const k = Math.min(availW / mw, availH / mh), cw = Math.round(mw * k), ch = Math.round(mh * k);
  if (amCv.width !== Math.round(cw * dpr) || amCv.height !== Math.round(ch * dpr)) { amCv.width = Math.round(cw * dpr); amCv.height = Math.round(ch * dpr); amCv.style.width = cw + 'px'; amCv.style.height = ch + 'px'; }
  const g = amCtx; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, cw, ch);
  const X = (x) => (x - M.x0) * k, Z = (z) => (z - M.z0) * k;
  g.save(); g.beginPath(); g.roundRect ? g.roundRect(0, 0, cw, ch, 14) : g.rect(0, 0, cw, ch); g.clip();
  g.imageSmoothingEnabled = true; g.drawImage(src, 0, 0, cw, ch);
  g.restore();
  const town = W.active === 'meadow';
  if (town) { g.fillStyle = 'rgba(217,199,154,.55)'; g.strokeStyle = '#6b4a30'; g.lineWidth = 2; g.beginPath(); g.arc(X(0), Z(0), W.TOWN.fence * k, 0, Math.PI * 2); g.fill(); g.stroke(); }
  const label = (txt, x, y, size, col) => { g.font = '700 ' + size + 'px Fredoka, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 4; g.strokeStyle = 'rgba(255,248,232,.95)'; g.strokeText(txt, x, y); g.fillStyle = col || '#3b2a1e'; g.fillText(txt, x, y); };
  // monsters and drops
  for (const m of monsters) if (m.alive && m.active && !m.hide && W.mapAt(m.pos.x, m.pos.z) === W.active) { g.fillStyle = m.golden ? '#ffd84d' : m.k.boss ? '#8a2be2' : m.aggro ? '#b03a2e' : '#e65a50'; g.beginPath(); g.arc(X(m.pos.x), Z(m.pos.z), m.k.boss ? 6 : m.golden ? 5 : 3, 0, Math.PI * 2); g.fill(); }
  // gates: a sign with where they lead
  for (const G of W.GATES) if (G.map === W.active && !(G.locked && G.locked())) {
    const x = X(G.x), y = Z(G.z); g.fillStyle = '#f2c14e'; g.strokeStyle = '#3b2a1e'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fill(); g.stroke();
    label('→ ' + (AREA_NAMES[G.to] || (AREAS[G.to] && AREAS[G.to].name) || G.to), x, y - 15, 13, '#6b3a10');
  }
  // villagers
  for (const n of npcs) { if (!here(n)) continue; const x = X(n.x), y = Z(n.z); g.fillStyle = '#3aa83a'; g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill(); g.stroke(); label(n.name, x, y - 13, 12, '#2a5a20'); }
  for (const s of spots) if (s.label && here(s) && /salon|way/.test(s.id)) { const x = X(s.x), y = Z(s.z); g.fillStyle = '#7fc7e8'; g.strokeStyle = '#3b2a1e'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill(); g.stroke(); label(s.label, x, y - 13, 12, '#204a6a'); }
  // quest stars
  if (RW.story) for (const mk of RW.story.marks()) {
    if ((mk.map || W.mapAt(mk.x, mk.z)) !== W.active) continue;
    const x = X(mk.x), y = Z(mk.z); g.save(); g.translate(x, y); g.fillStyle = mk.color || '#ffd84d'; g.strokeStyle = '#3b2a1e'; g.lineWidth = 2.5; g.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 5 : 11, a = (i / 10) * Math.PI * 2 - Math.PI / 2; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); g.stroke(); g.restore();
  }
  // you
  { const x = X(player.pos.x), y = Z(player.pos.z); g.save(); g.translate(x, y); g.fillStyle = 'rgba(232,96,76,.25)'; g.beginPath(); g.arc(0, 0, 16, 0, Math.PI * 2); g.fill(); g.rotate(Math.PI - player.face);
    g.fillStyle = '#e8604c'; g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(0, -11); g.lineTo(8, 8); g.lineTo(0, 4); g.lineTo(-8, 8); g.closePath(); g.fill(); g.stroke(); g.restore(); }
  if (town) label('Mossbrook', X(0), Z(0) + W.TOWN.fence * k + 14, 15);
  $('areaMapName').textContent = W.inTown(player.pos.x, player.pos.z) ? 'Mossbrook' : (AREA_NAMES[W.active] || (AREAS[W.active] && AREAS[W.active].name) || '');
}
function updateAreaMap(dt) { if (!amOpen) return; if (mode !== 'play') { toggleAreaMap(false); return; } amT -= dt; if (amT <= 0) { amT = 0.15; drawAreaMap(); } }
function resize() { VW = window.innerWidth; VH = window.innerHeight; renderer.setSize(VW, VH); camera.aspect = VW / VH; camera.updateProjectionMatrix(); }
window.addEventListener('resize', resize);

// ---------- actions the windows call ----------
RW.G = {
  p: P,
  derived: () => D,
  bagCount,
  useItem(id) { AU.ensure(); usePotion(id); },
  setHot(slot, id) { P.hot[slot] = id; dirty = true; sfx.click(); UI.toast(ITEMS[id].name + ' is now on key ' + (slot + 5) + '.'); },
  addStat(k) { if (P.pts <= 0) return; P.pts--; P.stats[k]++; const hpPct = player.hp / D.maxHp, mpPct = player.mp / D.maxMp; D = derive(P, jobNow(), weaponNow()); player.hp = Math.min(D.maxHp, Math.max(player.hp, hpPct * D.maxHp)); player.mp = Math.min(D.maxMp, Math.max(player.mp, mpPct * D.maxMp)); sfx.point(); dirty = true; },
  buy(id, n) { const it = ITEMS[id], cost = it.price * n; if (P.coins < cost) { deny('Not enough coins.'); return; } P.coins -= cost; bagAdd(id, n); sfx.buy(); UI.toast('Bought ' + n + ' × ' + esc(it.name)); save(); },
  sell(id, n) { const it = ITEMS[id]; if (!bagTake(id, n)) return; P.coins += it.sell * n; sfx.coin(); UI.toast('Sold ' + n + ' × ' + esc(it.name) + ' for ' + it.sell * n + ' coins'); save(); emit('sell', id, n); },
  // ---- for the story (story.js) ----
  player, npcs, monsters, spots, items, cam,
  get D() { return D; },
  get time() { return time; },
  spawnMonster, removeMonster, dropItem, bagAdd, bagTake, gainExp, addSpot, removeSpot, npcFace, chat, lbl, place, hideEl, hurtPlayer, poisonPlayer, stunPlayer, get traveling() { return traveling; },
  addCoins(n) { P.coins += n; dirty = true; UI.syncCoins(); },
  heal() { player.hp = D.maxHp; player.mp = D.maxMp; },
  teleport(x, z, face) { if (W.mapAt(x, z) !== W.active) switchMap(W.mapAt(x, z)); player.pos.set(x, W.height(x, z), z); if (face != null) player.face = face; player.dest = null; player.target = null; cam.tx = x; cam.tz = z; cam.yaw = wrapAngle(player.face + Math.PI); updateCamera(1); },
  travel, refreshHeroTag, spawnGolden, here,
  // ---- jobs (jobs.js) ----
  jobNow, weaponNow, skillLv, rederive, spawnRing, spawnPuff, floatText,
  // ---- pets (pets.js) ----
  hitMonster, spawnSpark, deny: (t) => deny(t), get dirty() { return dirty; }, set dirty(v) { dirty = v; },
  get autoOn() { return autoOn; }, setAuto,
  setTempJob(o) { tempJob = Object.assign({ skills: {}, mode: 'try' }, o, { until: time + (o.dur || 60) }); player.buffs = {}; player.action = null; for (let i = 0; i < 4; i++) player.cds[i] = 0; setHero(P.look); rederive(); player.mp = D.maxMp; UI.renderHotbar(); refreshHeroTag(); },
  clearTempJob() { if (!tempJob) return; tempJob = null; player.buffs = {}; player.action = null; player.target = null; setHero(P.look); rederive(); UI.renderHotbar(); refreshHeroTag(); },
  get tempJob() { return tempJob; },
  // ---- gear (gear.js): rebuild the hero model and stats after a change of clothes ----
  refreshHero() { setHero(P.look); rederive(); if (UI.isOpen('statPanel')) UI.renderStats(); },
  becomeJob(job, weapon) {
    P.job = job; P.weapon = weapon; P.sp = (P.sp || 0) + RW.SP_AT_JOB; P.skills = {}; tempJob = null; player.buffs = {};
    setHero(P.look); rederive(); player.hp = D.maxHp; player.mp = D.maxMp; refreshHeroTag(); UI.renderHotbar();
    pillarT = 0; spawnRing(player.pos, 0xfff1a8, 3.6, 1.0); sfx.level(); save(); emit('job', job);
  },
  learnSkill(id) {
    const js = jobSkills(); if (!js || tempJob) return false; const s = js.find((x) => x.id === id); if (!s) return false;
    const lv = P.skills[id] || 0; if ((P.sp || 0) <= 0 || lv >= RW.SKILL_MAX) return false;
    P.sp--; P.skills[id] = lv + 1; sfx.point(); dirty = true; save(); emit('learn', id); return true;
  },
  get traveling() { return traveling; },
  esc,
  stopActions() { player.dest = null; player.target = null; player.pickTarget = null; player.npcTarget = null; player.spotTarget = null; },
  endTalk() { talkNpc = null; },
  heroHead(v) { if (hero) { hero.j.head.getWorldPosition(v); } else v.copy(player.pos).setY(player.pos.y + 1.3); return v; },
  get sitW() { return pose.sitW; },
  setHeroVisible(on) { holder.visible = on; },
  save,
  saveSettings() { store.settings.music = AU.state.musicOn; store.settings.sfx = AU.state.sfxOn; store.settings.musicVol = AU.state.musicVol; store.settings.sfxVol = AU.state.sfxVol; save(); if (AU.state.musicOn && !musicStarted) startMusic(); },
  get settings() { return store.settings; },
  get mode() { return mode; },
  storeText() { return JSON.stringify(store); },
  storeAt() { return store.at || 0; },
  // a save from the cloud replaces this device's heroes (only on the title / hero screens)
  adoptStore(s) {
    if (!s || s.v !== 2 || !Array.isArray(s.slots) || mode === 'play') return false;
    store.slots = s.slots.slice(0, RW.SLOTS).map(cleanHero); while (store.slots.length < RW.SLOTS) store.slots.push(null);
    store.last = s.slots[s.last] ? s.last : Math.max(0, store.slots.findIndex((h) => h));
    store.seenHelp = !!s.seenHelp; store.at = s.at || Date.now();
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* blocked */ }
    return true;
  },
  onHelpClosed() { AU.ensure(); startMusic(); if (mode === 'play' && !store.seenHelp) { store.seenHelp = true; save(); UI.banner(zoneName(player.zone), zoneSub(player.zone, true)); } },
  // ---- heroes and slots (the title, hero select and creator screens live in menu.js) ----
  store,
  get mode() { return mode; },
  heroName: (i) => (store.slots[i] ? store.slots[i].name : ''),
  createHero(i, name, look) {
    const h = cleanHero(Object.assign(JSON.parse(JSON.stringify(RW.NEW_GAME)), { name, look, born: Date.now() }));
    store.slots[i] = h; store.last = i; writeStore(); return h;
  },
  deleteHero(i) { store.slots[i] = null; if (store.last === i) store.last = Math.max(0, store.slots.findIndex((h) => h)); writeStore(); },
  enter: enterWorld,
  leave: leaveWorld,
  saveStore: writeStore
};
RW.debug = { player, get P() { return P; }, store, monsters, items, cam, golden: () => spawnGolden(true), go: (id) => { const G = W.GATES.find((g) => g.to === id && (g.map === W.active || true)); if (G) travel(G.to, G.tx, G.tz, G.face, 'debug'); } };

// step into the world as the hero in slot i
function enterWorld(i) {
  P = store.slots[i]; if (!P) return;
  store.last = i; RW.G.p = P; tempJob = null; D = derive(P, jobNow(), weaponNow());
  if (P.hp == null) P.hp = D.maxHp; if (P.mp == null) P.mp = D.maxMp;
  setHero(P.look); holder.visible = true;
  // the hero comes back in the area they left, or at the entrance of it if the old spot is no good
  const ARRIVE = { meadow: W.SPAWN, hills: { x: 0, z: -684, face: Math.PI }, wood: { x: -410, z: -470, face: -Math.PI / 2 }, river: { x: 762, z: -300, face: Math.PI / 2 }, thorn: { x: 762, z: -900, face: Math.PI / 2 }, burrow: { x: 1500, z: -151, face: Math.PI } };
  for (const L of W.LANDS) if (L.arrive) ARRIVE[L.id] = L.arrive;
  const mapId = AREAS[P.map] ? P.map : 'meadow';
  mode = 'play'; switchMap(mapId);
  const okPos = P.pos && W.mapAt(P.pos.x, P.pos.z) === mapId && W.walkable(P.pos.x, P.pos.z);
  const start = okPos ? P.pos : ARRIVE[mapId];
  if (!okPos) P.face = ARRIVE[mapId].face;
  Object.assign(player, { face: okPos ? P.face : ARRIVE[mapId].face, hp: Math.min(P.hp, D.maxHp), mp: Math.min(P.mp, D.maxMp), ult: P.ult || 0, dest: null, target: null, pickTarget: null, npcTarget: null, spotTarget: null, action: null, atkCd: 0, combo: 0, rallyT: 0, dead: 0, idleT: 0, fidgetT: 0, sitting: false, sitT: 0, zone: null, cds: [0, 0, 0, 0, 0, 0], buffs: {}, poison: null, stun: 0, freeze: 0 });
  player.pos.set(start.x, W.height(start.x, start.z), start.z);
  hero.root.rotation.y = player.face; pose.runW = pose.actW = pose.sitW = 0; pose.act = null; pose.lastFace = player.face;
  document.getElementById('sitBtn').setAttribute('aria-pressed', 'false');
  refreshHeroTag(); heroTag.style.display = '';
  document.getElementById('pname').textContent = P.name;
  for (const it of items.splice(0)) { scene.remove(it.root); it.tag.remove(); }
  for (const m of monsters) { m.aggro = false; m.atk = null; m.chg = null; if (!m.golden) m.tagName.style.color = nameColor(m.lv); }
  for (const n of npcs) { const on = here(n); n.c.root.visible = on; n.tag.style.display = on ? '' : 'none'; }
  for (const k of Object.keys(parked)) for (const m of parked[k]) m.tagName.style.color = nameColor(m.lv);
  P.visited[mapId === 'meadow' ? 'meadow' : mapId] = true;
  cam.yaw = wrapAngle(player.face + Math.PI); cam.pitch = 0.62; cam.dist = 15; cam.tx = player.pos.x; cam.tz = player.pos.z; cam.ty = player.pos.y + 0.9;
  for (const k in last) delete last[k];
  mode = 'play'; document.body.classList.remove('in-menu');
  UI.renderHotbar(); UI.syncCoins();
  musicStarted = false; checkZone(); updateCamera(1);
  if (AU.ensure()) { musicStarted = true; AU.play(player.zone || 'town'); }
  store.seenHelp = true; // the story teaches the controls now (the ? button still shows them)
  emit('enter', P);
  save();
}
// back to the hero select screen
function leaveWorld() {
  if (mode !== 'play') return;
  if (player.sitting) standUp();
  if (tempJob) RW.G.clearTempJob(); autoOn = false; document.getElementById('autoBtn').setAttribute('aria-pressed', 'false');
  save(); UI.closeAll(); talkNpc = null;
  mode = 'menu'; document.body.classList.add('in-menu');
  holder.visible = false; hideEl(heroTag); hideEl(sitZ);
  switchMap('meadow'); // the title and hero select screens stand in Mossbrook
  W.focusU.value.set(0, -9999, 0);
  for (const m of monsters) { m.aggro = false; m.atk = null; m.chg = null; hideEl(m.tag); }
  for (const n of npcs) { n.c.root.visible = false; hideEl(n.tag); }
  for (const f of floaters.splice(0)) f.el.remove();
  for (const pr of projectiles.splice(0)) scene.remove(pr.mesh);
  pillar.visible = false; pillarT = -1;
  for (const s of spots) hideEl(s.tag);
  emit('leave');
  P = null; RW.G.p = null;
}
window.addEventListener('pagehide', () => save());
// when a new version is published, the viewer swaps the page: save first so nothing is lost
try { if (window.claude && window.claude.hot && window.claude.hot.snapshot) window.claude.hot.snapshot(() => { save(); return {}; }); } catch (e) { /* not running inside the viewer */ }
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });

// ---------- main loop ----------
UI.syncSound();
document.body.classList.add('in-menu');
for (const n of npcs) { n.c.root.visible = false; hideEl(n.tag); }
let prev = performance.now(), miniT = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
  tickAll(dt);
  requestAnimationFrame(frame);
}
RW.debug.step = (n) => { for (let i = 0; i < n; i++) tickAll(1 / 30); };
function tickAll(dt) {
  time += dt; timeU.value = time;
  if (mode !== 'play') {
    // title, hero select and creator: the world keeps living behind the menus
    const M = RW.menu;
    if (M) M.update(dt, time, player.pos);
    updateMonsters(dt); W.update(dt, time); updateFx(dt);
    if (M) M.render(); else renderer.render(scene, camera);
    AU.tick();
    return;
  }
  P.playTime += dt;
  updatePlayer(dt); updateMonsters(dt); updateProjectiles(dt); hitStop = Math.max(0, hitStop - dt);
  checkZone(); checkGates(); updateNpcs(dt);
  if (player.zone !== 'town' && !traveling && !player.dead) { goldT -= dt; if (goldT <= 0) { goldT = rnd(GOLDEN.every[0], GOLDEN.every[1]); if (!monsters.some((m) => m.golden && m.alive)) spawnGolden(false); } }
  if (RW.story) RW.story.update(dt, time);
  if (RW.explore) RW.explore.update(dt, time);
  if (RW.jobs) RW.jobs.update(dt, time);
  if (RW.pets) RW.pets.update(dt, time);
  if (RW.river) RW.river.update(dt, time);
  if (tempJob && time > tempJob.until) { const end = tempJob.onEnd; RW.G.clearTempJob(); if (end) end('time'); }
  updateItems(dt); updateCamera(dt); W.update(dt, time); updateFx(dt);
  renderer.render(scene, camera);
  updateLabels(dt); updateHUD(); UI.tickDialog(dt); AU.tick();
  miniT -= dt; if (miniT <= 0) { miniT = 0.12; drawMini(); }
  updateAreaMap(dt); if (shoutCd > 0) shoutCd -= dt;
  saveT += dt; if (saveT > 10) { saveT = 0; save(); }
}
requestAnimationFrame(frame);
})();
