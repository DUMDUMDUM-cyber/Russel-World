// Russel World: exploring. Hidden treasure chests, the monster book (stars, rewards, expert titles) and the hand-drawn world map.
(function () {
'use strict';
const RW = window.RW;
if (!RW || RW.failed || !RW.G || !RW.world) return;
const { THREE, renderer, ITEMS, KINDS, AREAS, BOOK_STARS, CHESTS, ELEMENTS, RARITY, expNeed, rnd, clamp } = RW;
const W = RW.world, G = RW.G, UI = RW.UI, sfx = RW.audio.sfx, esc = G.esc;
const $ = (id) => document.getElementById(id);
let P = null;
const AREA_IDS = ['meadow', 'hills', 'wood', 'river', 'thorn', 'burrow', 'cave'].concat(Object.keys(AREAS).filter((a) => !['meadow', 'hills', 'wood', 'river', 'thorn', 'burrow', 'cave'].includes(a) && AREAS[a].kinds.length)); // v1.4: Chapter 2 and 3 areas come from lands.js

// ---------- treasure chests: hidden in every area, opened once per hero ----------
const chests = [];
function itemText(list) { return list.map(([id, n]) => n + ' × ' + ITEMS[id].name).join(', '); }
function chestCount(area) { const all = CHESTS.filter((c) => c[1] === area); return { found: all.filter((c) => P && P.chests[c[0]]).length, all: all.length }; }
function makeChests() {
  for (const ch of chests) G.removeSpot(ch.spot.id);
  chests.length = 0;
  for (const [id, map, x, z, coins, items] of CHESTS) {
    const c = RW.chestModel();
    c.root.rotation.y = (id.charCodeAt(0) * 7 + id.charCodeAt(1) * 13) % 6.28;
    const open = !!P.chests[id];
    if (open) { c.lid.rotation.x = -1.9; }
    const spot = G.addSpot({ id: 'chest_' + id, x, z, label: 'Treasure chest', model: c.root, range: 2.3, y: 0.6, tagY: 1.7, far: 16, onUse: () => openChest(ch) });
    spot.hidden = open;
    const ch = { id, map, x, z, coins, items, c, spot, opening: open ? 1 : 0, open };
    chests.push(ch);
  }
}
function openChest(ch) {
  if (!P || P.chests[ch.id]) return;
  P.chests[ch.id] = Date.now(); ch.open = true; ch.opening = 0.001; ch.spot.hidden = true;
  sfx.chest();
  G.addCoins(ch.coins);
  for (const [id, n] of ch.items) G.bagAdd(id, n);
  UI.toast('Treasure! +' + ch.coins + ' coins, ' + esc(itemText(ch.items)), true);
  const cnt = chestCount(ch.map);
  setTimeout(() => { if (P) UI.toast('Chests found in ' + AREAS[ch.map].name + ': ' + cnt.found + '/' + cnt.all + (cnt.found === cnt.all ? ' · all of them!' : '')); }, 1300);
  RW.emit('chest', ch.id, cnt);
  if (UI.isOpen('bagPanel')) UI.renderBag();
  G.save();
}
function updateChests(dt, time) {
  for (const ch of chests) {
    if (ch.map !== W.active) continue;
    if (ch.opening > 0 && ch.opening < 1) {
      ch.opening = Math.min(1, ch.opening + dt * 1.6);
      const k = 1 - Math.pow(1 - ch.opening, 3);
      ch.c.lid.rotation.x = -1.9 * k;
      ch.c.shine.material.opacity = Math.sin(ch.opening * Math.PI) * 0.95;
      ch.c.shine.scale.setScalar(2.2 + ch.opening * 2);
    } else if (!ch.open) {
      // an unopened chest gives off a faint twinkle, so a sharp eye can spot it
      ch.c.shine.material.opacity = Math.max(0, Math.sin(time * 1.7 + ch.x) * 0.35);
      ch.c.shine.scale.setScalar(1.4);
    }
  }
}

// ---------- the monster book ----------
const BOOK_KINDS = AREA_IDS.flatMap((a) => AREAS[a].kinds);
const kills = (k) => (P && P.seen[k]) || 0;
function starsOf(k) { let s = 0; for (const st of BOOK_STARS) if (kills(k) >= st.need) s++; return s; }
function areaDone(a) { return AREAS[a].kinds.every((k) => starsOf(k) >= BOOK_STARS.length); }
let bookNew = false;
function setBadge(on) { bookNew = on; $('bookBadge').hidden = !on; }
// pays every star (and title) the hero has reached but not been paid for yet
function payStars(quiet) {
  if (!P) return;
  let coins = 0, exp = 0, items = [], newStars = [], newTitles = [];
  for (const k of BOOK_KINDS) {
    const have = starsOf(k), paid = P.book[k] || 0;
    for (let i = paid; i < have; i++) {
      const st = BOOK_STARS[i];
      coins += st.coins || 0; if (st.exp) exp += Math.round(expNeed(P.lv) * st.exp); if (st.item) items.push(st.item);
      newStars.push([k, i + 1]);
    }
    if (have > paid) P.book[k] = have;
  }
  for (const a of AREA_IDS) { const t = AREAS[a].title; if (areaDone(a) && !P.titles.includes(t)) { P.titles.push(t); newTitles.push(t); } }
  if (!newStars.length && !newTitles.length) return;
  if (coins) G.addCoins(coins);
  for (const id of items) G.bagAdd(id, 1);
  if (exp) G.gainExp(exp);
  setBadge(true);
  if (!quiet || newStars.length) {
    sfx.book();
    if (newStars.length === 1) { const [k, s] = newStars[0]; UI.toast('Monster book: ' + esc(KINDS[k].name) + ' ' + '★'.repeat(s) + ' · +' + coins + ' coins' + (items.length ? ', ' + esc(ITEMS[items[0]].name) : '')); }
    else UI.toast('Monster book: ' + newStars.length + ' new stars · +' + coins + ' coins');
  }
  for (const t of newTitles) setTimeout(() => { if (!P) return; UI.toast('New title: <b>' + esc(t) + '</b>! Wear it from the monster book (K).', true); RW.emit('title', t); }, 1400);
  if (UI.isOpen('bookPanel')) renderBook();
  G.save();
}
// pictures of each monster for the book, rendered once (a dark silhouette until you defeat one)
const shotCache = new Map();
let sScene = null, sCam = null, sRT = null;
const SHOT = 160;
function monsterShot(kind, dark) {
  const key = kind + (dark ? '_d' : '');
  if (shotCache.has(key)) return shotCache.get(key);
  let url = '';
  try {
    if (!sScene) {
      sScene = new THREE.Scene(); sScene.add(new THREE.HemisphereLight(0xfff3dc, 0xb3a184, 0.78));
      const sun = new THREE.DirectionalLight(0xfff0d4, 0.55); sun.position.copy(RW.SUN_DIR).multiplyScalar(100); sScene.add(sun);
      sCam = new THREE.PerspectiveCamera(26, 1, 0.05, 50); sRT = new THREE.WebGLRenderTarget(SHOT * 2, SHOT * 2);
    }
    const p = RW.MONSTER_BUILD[kind](), k = KINDS[kind];
    p.root.scale.setScalar(k.scale); p.root.rotation.y = -0.55; sScene.add(p.root); p.root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(p.body), c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
    const dist = Math.max(sz.x, sz.y, sz.z) * 2.6 + 0.8;
    sCam.position.set(c.x + dist * 0.35, c.y + dist * 0.2, c.z + dist); sCam.lookAt(c); sCam.updateProjectionMatrix();
    const prevC = new THREE.Color(); renderer.getClearColor(prevC); const prevA = renderer.getClearAlpha();
    renderer.setClearColor(0x000000, 0); renderer.setRenderTarget(sRT); renderer.clear(); renderer.render(sScene, sCam);
    const N = SHOT * 2, buf = new Uint8Array(N * N * 4); renderer.readRenderTargetPixels(sRT, 0, 0, N, N, buf);
    renderer.setRenderTarget(null); renderer.setClearColor(prevC, prevA);
    sScene.remove(p.root);
    const big = document.createElement('canvas'); big.width = big.height = N;
    const g = big.getContext('2d'), img = g.createImageData(N, N);
    for (let y = 0; y < N; y++) img.data.set(buf.subarray((N - 1 - y) * N * 4, (N - y) * N * 4), y * N * 4);
    if (dark) for (let i = 0; i < img.data.length; i += 4) { if (img.data[i + 3] > 10) { img.data[i] = 74; img.data[i + 1] = 58; img.data[i + 2] = 44; img.data[i + 3] = 200; } }
    g.putImageData(img, 0, 0);
    const out = document.createElement('canvas'); out.width = out.height = SHOT;
    const o = out.getContext('2d');
    const bg = o.createRadialGradient(SHOT / 2, SHOT * 0.6, 10, SHOT / 2, SHOT / 2, SHOT * 0.75); bg.addColorStop(0, dark ? '#e9e0cc' : '#f4f8e8'); bg.addColorStop(1, dark ? '#d6c9ad' : '#cfe3bf');
    o.fillStyle = bg; o.fillRect(0, 0, SHOT, SHOT);
    o.imageSmoothingQuality = 'high'; o.drawImage(big, 0, 0, SHOT, SHOT);
    if (dark) { o.fillStyle = '#fbf1dc'; o.font = '700 34px Fredoka, sans-serif'; o.textAlign = 'center'; o.fillText('?', SHOT / 2, SHOT * 0.62); }
    url = out.toDataURL('image/png');
  } catch (e) { url = ''; }
  shotCache.set(key, url);
  return url;
}
let bookTab = 'meadow';
function renderBook() {
  if (!P) return;
  setBadge(false);
  $('bookTabs').innerHTML = AREA_IDS.map((a) => '<button class="tab" role="tab" data-a="' + a + '" aria-selected="' + (a === bookTab) + '">' + esc(P.visited[a] || a === 'meadow' ? AREAS[a].name : '???') + '</button>').join('');
  $('bookTabs').querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => { bookTab = b.dataset.a; sfx.click(); renderBook(); }));
  const A = AREAS[bookTab], total = A.kinds.length * BOOK_STARS.length, got = A.kinds.reduce((s, k) => s + starsOf(k), 0);
  let html = '<div class="mb-head"><span><b>' + esc(P.visited[bookTab] || bookTab === 'meadow' ? A.name : '???') + '</b> · ' + got + '/' + total + ' stars</span><span>' + (areaDone(bookTab) ? 'Title earned: <b>' + esc(A.title) + '</b>' : 'Fill every star here for the title <b>' + esc(A.title) + '</b>') + '</span></div><div class="mb-grid">';
  for (const k of A.kinds) {
    const K = KINDS[k], n = kills(k), s = starsOf(k), next = BOOK_STARS.find((st) => n < st.need);
    const stars = BOOK_STARS.map((st, i) => '<span class="' + (i < s ? '' : 'off') + '">★</span>').join('');
    let lines = '';
    if (s >= 1) lines += '<div class="ml">' + esc(K.about) + '</div>';
    if (s >= 2) lines += '<div class="ml"><b>Element:</b> <span style="color:' + ELEMENTS[K.element].color + ';font-weight:700">' + ELEMENTS[K.element].name + '</span>' + (K.weak ? ' · <b>Weak to:</b> <span style="color:' + ELEMENTS[K.weak].color + ';font-weight:700">' + ELEMENTS[K.weak].name + '</span>' : '') + ' · <b>Home:</b> ' + esc(AREAS[K.area].name) + (K.aggro ? ' · attacks first' : '') + '</div>';
    if (s >= 3) lines += '<div class="ml"><b>Drops:</b> ' + K.drops.map(([id]) => '<span style="color:' + (ITEMS[id].rarity === 'common' ? 'inherit' : RARITY[ITEMS[id].rarity].ink) + '">' + esc(ITEMS[id].name) + '</span>').join(', ') + '</div>';
    if (!s) lines = '<div class="ml">Not met yet. Defeat one to see it here.</div>';
    html += '<div class="mcard' + (s >= BOOK_STARS.length ? ' done' : '') + '"><img src="' + monsterShot(k, !s) + '" alt=""><div><div class="mn">' + (s ? esc(K.name) : '???') + '</div><div class="stars">' + stars + '</div>' + lines +
      '<div class="mk">Defeated ' + n + (next ? ' · next star at ' + next.need + ' (shows ' + next.shows + ')' : ' · complete!') + '</div>' + (P.golden[k] ? '<span class="gold">★ Golden one defeated</span>' : '') + '</div></div>';
  }
  html += '</div><h3 class="mb-h">Titles</h3>';
  if (!P.titles.length) html += '<p class="qempty">Fill all the stars of an area to earn its title. Your title shows under your name.</p>';
  else html += '<div class="mb-titles">' + P.titles.map((t) => '<button class="btn small soft" data-t="' + esc(t) + '" aria-pressed="' + (P.title === t) + '">' + esc(t) + '</button>').join('') + '<button class="btn small soft" data-t="" aria-pressed="' + (!P.title) + '">No title</button></div>';
  $('bookBody').innerHTML = html;
  $('bookBody').querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => { P.title = b.dataset.t; G.refreshHeroTag(); sfx.click(); renderBook(); G.save(); }));
}

// ---------- the world map: a hand-drawn map on old paper; places you have not been to are under clouds ----------
const MAPART = {
  town: { x: 500, y: 540, r: 46 },
  meadow: { x: 500, y: 392, rx: 160, ry: 92, name: 'Sunny Meadow' },
  hills: { x: 500, y: 168, rx: 158, ry: 88, name: 'Breezy Hills' },
  wood: { x: 205, y: 318, rx: 118, ry: 132, name: 'Whisperwood' },
  river: { x: 800, y: 380, rx: 120, ry: 90 },
  thorn: { x: 815, y: 150, rx: 115, ry: 80 },
  cave: { x: 690, y: 78, rx: 78, ry: 44 }
};
const paperRand = RW.seeded(4242);
function blob(g, x, y, rx, ry, seed, wob) {
  g.beginPath();
  for (let i = 0; i <= 48; i++) { const a = (i / 48) * Math.PI * 2, w = 1 + Math.sin(a * 5 + seed) * (wob || 0.05) + Math.sin(a * 9 + seed * 2) * (wob || 0.05) * 0.5; const px = x + Math.cos(a) * rx * w, py = y + Math.sin(a) * ry * w; if (i) g.lineTo(px, py); else g.moveTo(px, py); }
  g.closePath();
}
function cloud(g, x, y, rx, ry) {
  g.save(); g.fillStyle = 'rgba(255,253,246,.96)'; g.strokeStyle = 'rgba(120,100,80,.55)'; g.lineWidth = 2.5;
  const puffs = [[0, 0, 0.55], [-0.5, 0.12, 0.42], [0.5, 0.1, 0.45], [-0.22, -0.3, 0.4], [0.25, -0.28, 0.42], [-0.75, -0.05, 0.3], [0.78, -0.08, 0.3], [0, 0.35, 0.38]];
  for (const [dx, dy, r] of puffs) { g.beginPath(); g.ellipse(x + dx * rx, y + dy * ry, r * rx, r * ry * 1.25, 0, 0, Math.PI * 2); g.fill(); g.stroke(); }
  for (const [dx, dy, r] of puffs) { g.beginPath(); g.ellipse(x + dx * rx, y + dy * ry, r * rx - 2, r * ry * 1.25 - 2, 0, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = 'rgba(110,82,64,.75)'; g.font = '700 40px Fredoka, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', x, y + 4);
  g.restore();
}
function tree(g, x, y, s, col) { g.fillStyle = '#6b4a30'; g.fillRect(x - 1.5 * s, y, 3 * s, 7 * s); g.fillStyle = col || '#4f8a3a'; g.strokeStyle = '#3b2a1e'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y - 3 * s, 7 * s, 0, Math.PI * 2); g.fill(); g.stroke(); }
function pine(g, x, y, s) { g.fillStyle = '#3f7a45'; g.strokeStyle = '#3b2a1e'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y - 14 * s); g.lineTo(x + 7 * s, y + 3 * s); g.lineTo(x - 7 * s, y + 3 * s); g.closePath(); g.fill(); g.stroke(); }
function label(g, text, x, y, size, sub) {
  g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '700 ' + size + 'px Fredoka, sans-serif';
  const w = g.measureText(text).width + 22;
  g.fillStyle = 'rgba(251,241,220,.92)'; g.strokeStyle = '#3b2a1e'; g.lineWidth = 2;
  g.beginPath(); g.roundRect ? g.roundRect(x - w / 2, y - size * 0.75, w, size * 1.5, 10) : g.rect(x - w / 2, y - size * 0.75, w, size * 1.5); g.fill(); g.stroke();
  g.fillStyle = '#3b2a1e'; g.fillText(text, x, y + 1);
  if (sub) { g.font = '600 ' + Math.round(size * 0.62) + 'px Fredoka, sans-serif'; g.fillStyle = '#6e5240'; g.fillText(sub, x, y + size * 1.25); }
  g.restore();
}
function dotted(g, pts) { g.save(); g.strokeStyle = 'rgba(110,70,40,.75)'; g.lineWidth = 4; g.setLineDash([2, 10]); g.lineCap = 'round'; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.restore(); }
// where a spot in the world lands on the paper map
function toPaper(x, z) {
  const m = W.mapAt(x, z);
  if (m === 'meadow') {
    if (W.inTown(x, z)) return [MAPART.town.x + x / 44 * MAPART.town.r * 0.8, MAPART.town.y + z / 44 * MAPART.town.r * 0.8];
    const A = MAPART.meadow; return [A.x + clamp(x / 195, -1, 1) * A.rx * 0.88, A.y + clamp((z + 212) / 172, -1, 1) * A.ry * 0.88];
  }
  if (m === 'burrow') return toPaper(W.BURROW_DOOR.x, W.BURROW_DOOR.z);
  if (m === 'cave') { const A = MAPART.cave; return [A.x + clamp((x - 1505) / 60, -1, 1) * A.rx * 0.8, A.y + clamp((z + 750) / 115, -1, 1) * A.ry * 0.8]; }
  const A = MAPART[m], M = m === 'hills' ? W.HMAP : m === 'river' ? W.RMAP : m === 'thorn' ? W.TMAP : W.WMAP;
  return [A.x + clamp((x - M.x) / M.ax, -1, 1) * A.rx * 0.88, A.y + clamp((z - M.z) / M.az, -1, 1) * A.ry * 0.88];
}
function renderMap() {
  if (!P) return;
  const c = $('worldMap'), g = c.getContext('2d'), Wd = c.width, Hd = c.height, rr = RW.seeded(4242);
  // paper
  g.fillStyle = '#efdcb4'; g.fillRect(0, 0, Wd, Hd);
  for (let i = 0; i < 260; i++) { g.fillStyle = 'rgba(150,110,60,' + (0.03 + rr() * 0.05).toFixed(3) + ')'; g.beginPath(); g.arc(rr() * Wd, rr() * Hd, 6 + rr() * 40, 0, Math.PI * 2); g.fill(); }
  const vg = g.createRadialGradient(Wd / 2, Hd / 2, Hd * 0.35, Wd / 2, Hd / 2, Wd * 0.65); vg.addColorStop(0, 'rgba(120,80,40,0)'); vg.addColorStop(1, 'rgba(120,80,40,.35)'); g.fillStyle = vg; g.fillRect(0, 0, Wd, Hd);
  g.strokeStyle = '#6b4a30'; g.lineWidth = 6; g.strokeRect(10, 10, Wd - 20, Hd - 20); g.lineWidth = 2; g.strokeRect(20, 20, Wd - 40, Hd - 40);
  // mountains along the top edge
  for (let i = 0; i < 9; i++) { const x = 60 + i * 110 + rr() * 30, y = 46 + rr() * 10, s = 22 + rr() * 14; g.fillStyle = '#b7a891'; g.strokeStyle = '#6b4a30'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - s, y + s * 0.7); g.lineTo(x, y - s * 0.5); g.lineTo(x + s, y + s * 0.7); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#fbf6ea'; g.beginPath(); g.moveTo(x - s * 0.32, y - s * 0.05); g.lineTo(x, y - s * 0.5); g.lineTo(x + s * 0.32, y - s * 0.05); g.closePath(); g.fill(); }
  const seen = (a) => a === 'meadow' || !!P.visited[a];
  // v1.4: in the lands of Chapter 2 and 3, the map shows the sea and the snow instead
  if (RW.lands && RW.lands.isLand(W.active)) { RW.lands.drawPaper(g, Wd, Hd, P, { blob, cloud, label, dotted, star, tree, pine, seen, chestCount }); return; }
  // roads between places
  dotted(g, [[500, 505], [500, 470]]);
  dotted(g, [[500, 300], [500, 262]]);
  dotted(g, [[350, 400], [318, 352]]);
  dotted(g, [[355, 180], [290, 222]]);
  dotted(g, [[660, 390], [690, 385]]);
  // Sunny Meadow
  { const A = MAPART.meadow; blob(g, A.x, A.y, A.rx, A.ry, 1.3); g.fillStyle = '#a9d070'; g.fill(); g.strokeStyle = '#4f6a2e'; g.lineWidth = 3; g.stroke();
    for (let i = 0; i < 26; i++) { const a = rr() * 6.28, d = Math.sqrt(rr()) * 0.8, x = A.x + Math.cos(a) * A.rx * d, y = A.y + Math.sin(a) * A.ry * d; g.fillStyle = ['#fff', '#ffb3c6', '#fff0a0'][i % 3]; g.beginPath(); g.arc(x, y, 2.6, 0, 6.28); g.fill(); }
    for (const [dx, dy] of [[-120, -30], [-100, 40], [120, -40], [130, 30], [-30, -60], [60, 50]]) tree(g, A.x + dx, A.y + dy, 1.1);
    g.fillStyle = '#7fc7d8'; g.strokeStyle = '#3b6a7a'; g.lineWidth = 2; for (const [dx, dy, r] of [[-60, 18, 14], [70, -30, 10]]) { g.beginPath(); g.ellipse(A.x + dx, A.y + dy, r * 1.4, r, 0, 0, 6.28); g.fill(); g.stroke(); } }
  // Mossbrook
  { const T = MAPART.town; g.fillStyle = '#d9c79a'; g.strokeStyle = '#6b4a30'; g.lineWidth = 3; g.beginPath(); g.arc(T.x, T.y, T.r, 0, 6.28); g.fill(); g.stroke();
    for (const [dx, dy, col] of [[-22, -8, '#e8604c'], [20, -12, '#f0a0c0'], [-4, 16, '#f39a3d'], [24, 14, '#86c45e']]) { g.fillStyle = '#fff1d6'; g.fillRect(T.x + dx - 4, T.y + dy, 8, 9); g.fillStyle = col; g.strokeStyle = '#3b2a1e'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(T.x + dx, T.y + dy, 11, 7, 0, Math.PI, 0); g.closePath(); g.fill(); g.stroke(); } }
  // Breezy Hills
  if (seen('hills')) { const A = MAPART.hills; blob(g, A.x, A.y, A.rx, A.ry, 2.7); g.fillStyle = '#c5df8e'; g.fill(); g.strokeStyle = '#5f7a32'; g.lineWidth = 3; g.stroke();
    for (const [dx, dy, s] of [[-90, 10, 34], [-20, -20, 40], [70, 15, 30], [110, -30, 24], [-120, -30, 22]]) { g.fillStyle = '#b2d27a'; g.strokeStyle = '#5f7a32'; g.lineWidth = 2; g.beginPath(); g.ellipse(A.x + dx, A.y + dy, s, s * 0.55, 0, Math.PI, 0); g.closePath(); g.fill(); g.stroke(); }
    const wx = A.x + 50, wy = A.y - 22; g.fillStyle = '#fbf3e4'; g.strokeStyle = '#3b2a1e'; g.lineWidth = 2; g.beginPath(); g.moveTo(wx - 8, wy + 22); g.lineTo(wx - 5, wy - 6); g.lineTo(wx + 5, wy - 6); g.lineTo(wx + 8, wy + 22); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#c0503e'; g.beginPath(); g.moveTo(wx - 7, wy - 6); g.lineTo(wx, wy - 15); g.lineTo(wx + 7, wy - 6); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = '#6b4a30'; g.lineWidth = 3; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.4; g.beginPath(); g.moveTo(wx, wy - 2); g.lineTo(wx + Math.cos(a) * 20, wy - 2 + Math.sin(a) * 20); g.stroke(); }
    for (const [dx, dy] of [[-130, 30], [130, 40], [-60, 50]]) pine(g, A.x + dx, A.y + dy, 1.1);
    g.fillStyle = '#e8604c'; g.strokeStyle = '#3b2a1e'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(A.x + 90, A.y - 70); g.lineTo(A.x + 98, A.y - 60); g.lineTo(A.x + 90, A.y - 50); g.lineTo(A.x + 82, A.y - 60); g.closePath(); g.fill(); g.stroke();
  } else cloud(g, MAPART.hills.x, MAPART.hills.y, MAPART.hills.rx, MAPART.hills.ry);
  // Whisperwood
  if (seen('wood')) { const A = MAPART.wood; blob(g, A.x, A.y, A.rx, A.ry, 4.1, 0.07); g.fillStyle = '#6f9e55'; g.fill(); g.strokeStyle = '#2f4a22'; g.lineWidth = 3; g.stroke();
    for (let i = 0; i < 34; i++) { const a = rr() * 6.28, d = Math.sqrt(rr()) * 0.82, x = A.x + Math.cos(a) * A.rx * d, y = A.y + Math.sin(a) * A.ry * d; if (Math.hypot(x - (A.x - 25), y - (A.y + 10)) < 26) continue; tree(g, x, y, 0.9 + rr() * 0.4, ['#3f7a32', '#4f8a3a', '#2f6a2a'][i % 3]); }
    const hx = A.x - 25, hy = A.y + 10; g.fillStyle = '#7a5236'; g.strokeStyle = '#3b2a1e'; g.lineWidth = 2; g.beginPath(); g.moveTo(hx - 12, hy + 18); g.lineTo(hx - 9, hy - 16); g.lineTo(hx + 9, hy - 16); g.lineTo(hx + 12, hy + 18); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#4f8a3a'; g.beginPath(); g.arc(hx, hy - 22, 18, 0, 6.28); g.fill(); g.stroke(); g.fillStyle = '#ffe3a0'; g.beginPath(); g.arc(hx, hy + 8, 5, 0, 6.28); g.fill(); g.stroke();
    g.fillStyle = '#7fc7d8'; g.strokeStyle = '#3b6a7a'; g.beginPath(); g.ellipse(hx - 38, hy - 4, 12, 8, 0, 0, 6.28); g.fill(); g.stroke();
  } else cloud(g, MAPART.wood.x, MAPART.wood.y, MAPART.wood.rx, MAPART.wood.ry);
  dotted(g, [[800, 292], [812, 232]]);
  // Riverside: green banks, a winding river and the mill
  if (seen('river')) { const A = MAPART.river; blob(g, A.x, A.y, A.rx, A.ry, 5.3); g.fillStyle = '#9fcf78'; g.fill(); g.strokeStyle = '#4f6a2e'; g.lineWidth = 3; g.stroke();
    g.save(); blob(g, A.x, A.y, A.rx, A.ry, 5.3); g.clip(); g.strokeStyle = '#3b6a7a'; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath(); g.moveTo(A.x + 18, A.y - A.ry - 10); g.bezierCurveTo(A.x - 30, A.y - 40, A.x + 40, A.y + 10, A.x - 4, A.y + A.ry + 10); g.stroke(); g.strokeStyle = '#7fc7d8'; g.lineWidth = 11; g.stroke(); g.restore();
    for (const [dx, dy] of [[-80, -30], [-70, 40], [70, -40], [80, 30], [-30, 60], [50, 55]]) tree(g, A.x + dx, A.y + dy, 1);
    const mx = A.x - 34, my = A.y - 6; g.fillStyle = '#f1e6cf'; g.strokeStyle = '#3b2a1e'; g.lineWidth = 2; g.fillRect(mx - 9, my - 4, 18, 14); g.strokeRect(mx - 9, my - 4, 18, 14); g.fillStyle = '#c0503e'; g.beginPath(); g.moveTo(mx - 12, my - 4); g.lineTo(mx, my - 15); g.lineTo(mx + 12, my - 4); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = '#7a5236'; g.lineWidth = 2.5; g.beginPath(); g.arc(mx + 13, my + 4, 8, 0, 6.28); g.stroke();
  } else cloud(g, MAPART.river.x, MAPART.river.y, MAPART.river.rx, MAPART.river.ry);
  // Thornbush: brambles with purple berries, and beehives
  if (seen('thorn')) { const A = MAPART.thorn; blob(g, A.x, A.y, A.rx, A.ry, 6.1, 0.08); g.fillStyle = '#b7b48a'; g.fill(); g.strokeStyle = '#5a4a3a'; g.lineWidth = 3; g.stroke();
    for (let i = 0; i < 16; i++) { const a = rr() * 6.28, d = Math.sqrt(rr()) * 0.78, x = A.x + Math.cos(a) * A.rx * d, y = A.y + Math.sin(a) * A.ry * d; g.fillStyle = '#5f7a3a'; g.strokeStyle = '#3b2a1e'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, 8, 0, 6.28); g.fill(); g.stroke(); g.fillStyle = '#8a3a6a'; g.beginPath(); g.arc(x + 3, y - 2, 2.2, 0, 6.28); g.fill(); }
    for (const [dx, dy] of [[30, -10], [-40, 20], [60, 30]]) { const x = A.x + dx, y = A.y + dy; g.fillStyle = '#f2b63d'; g.strokeStyle = '#3b2a1e'; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y, 7, 9, 0, 0, 6.28); g.fill(); g.stroke(); g.beginPath(); g.moveTo(x - 7, y); g.lineTo(x + 7, y); g.stroke(); }
  } else cloud(g, MAPART.thorn.x, MAPART.thorn.y, MAPART.thorn.rx, MAPART.thorn.ry);
  // Pebble Cave: a dark rocky hill with glowing crystals and a gold crown on the deepest hall
  if (seen('cave')) { const A = MAPART.cave; dotted(g, [[760, 118], [735, 100]]); blob(g, A.x, A.y, A.rx, A.ry, 7.3, 0.09); g.fillStyle = '#7c7a86'; g.fill(); g.strokeStyle = '#3a3646'; g.lineWidth = 3; g.stroke();
    for (const [dx, dy, s] of [[-44, 4, 18], [-10, -12, 24], [30, 2, 20], [52, -14, 14]]) { g.fillStyle = '#9a98a4'; g.strokeStyle = '#3a3646'; g.lineWidth = 2; g.beginPath(); g.moveTo(A.x + dx - s, A.y + dy + s * 0.5); g.lineTo(A.x + dx, A.y + dy - s * 0.6); g.lineTo(A.x + dx + s, A.y + dy + s * 0.5); g.closePath(); g.fill(); g.stroke(); }
    for (const [dx, dy] of [[-56, 18], [-20, 22], [16, 20], [46, 14]]) { g.fillStyle = '#9fe0ff'; g.strokeStyle = '#2a5a7a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(A.x + dx, A.y + dy - 7); g.lineTo(A.x + dx + 4, A.y + dy); g.lineTo(A.x + dx, A.y + dy + 7); g.lineTo(A.x + dx - 4, A.y + dy); g.closePath(); g.fill(); g.stroke(); }
    g.fillStyle = '#1e1a24'; g.beginPath(); g.ellipse(A.x + 62, A.y + 20, 10, 7, 0, 0, 6.28); g.fill();
    if (P.story && P.story.kingDown) { g.fillStyle = '#ffcf4a'; g.strokeStyle = '#3b2a1e'; g.lineWidth = 1.5; const cx = A.x - 6, cy = A.y - 34; g.beginPath(); g.moveTo(cx - 10, cy + 6); g.lineTo(cx - 10, cy - 4); g.lineTo(cx - 5, cy + 1); g.lineTo(cx, cy - 7); g.lineTo(cx + 5, cy + 1); g.lineTo(cx + 10, cy - 4); g.lineTo(cx + 10, cy + 6); g.closePath(); g.fill(); g.stroke(); }
  } else cloud(g, MAPART.cave.x, MAPART.cave.y, MAPART.cave.rx, MAPART.cave.ry);
  // Rootling Burrow: a dark hole under the roots of Whisperwood
  if (seen('burrow') && seen('wood')) { const [bx, by] = toPaper(W.BURROW_DOOR.x, W.BURROW_DOOR.z); g.fillStyle = '#2a1e14'; g.strokeStyle = '#6b4a30'; g.lineWidth = 3; g.beginPath(); g.ellipse(bx, by, 13, 9, 0, 0, 6.28); g.fill(); g.stroke(); }
  // names, levels and treasure chests found
  const cc = (a) => { const n = chestCount(a); return 'Chests ' + n.found + '/' + n.all; };
  label(g, 'Mossbrook', MAPART.town.x, MAPART.town.y + 62, 20);
  label(g, 'Sunny Meadow', MAPART.meadow.x, MAPART.meadow.y - 8, 22, 'Lv. 1–4 · ' + cc('meadow'));
  if (seen('hills')) label(g, 'Breezy Hills', MAPART.hills.x - 40, MAPART.hills.y + 30, 22, 'Lv. 3–5 · ' + cc('hills'));
  if (seen('wood')) label(g, 'Whisperwood', MAPART.wood.x, MAPART.wood.y + 78, 22, 'Lv. 5–7 · ' + cc('wood'));
  if (seen('river')) label(g, 'Riverside', MAPART.river.x + 10, MAPART.river.y + 58, 22, 'Lv. 6–8 · ' + cc('river'));
  if (seen('thorn')) label(g, 'Thornbush', MAPART.thorn.x, MAPART.thorn.y + 52, 22, 'Lv. 8–10 · ' + cc('thorn'));
  if (seen('burrow') && seen('wood')) { const [bx, by] = toPaper(W.BURROW_DOOR.x, W.BURROW_DOOR.z); label(g, 'Rootling Burrow', bx, by + 24, 15, 'Lv. 5–8'); }
  label(g, 'Pebble Cave', MAPART.cave.x, MAPART.cave.y + 54, 16, seen('cave') ? 'Lv. 9–12 · ' + cc('cave') : (P.story && P.story.caveOpen ? 'Lv. 9–12' : 'Blocked'));
  // compass and title
  { const x = Wd - 80, y = Hd - 90; g.save(); g.translate(x, y); g.strokeStyle = '#3b2a1e'; g.lineWidth = 2; g.fillStyle = '#fbf1dc'; g.beginPath(); g.arc(0, 0, 34, 0, 6.28); g.fill(); g.stroke();
    for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.fillStyle = k === 3 ? '#c0503e' : '#8a5a35'; g.beginPath(); g.moveTo(0, -30); g.lineTo(7, 0); g.lineTo(-7, 0); g.closePath(); g.fill(); g.stroke(); }
    g.restore(); g.fillStyle = '#3b2a1e'; g.font = '700 16px Fredoka, sans-serif'; g.textAlign = 'center'; g.fillText('N', x, y - 40); }
  g.fillStyle = '#3b2a1e'; g.font = '700 26px Fredoka, sans-serif'; g.textAlign = 'left'; g.fillText('Russel World', 40, Hd - 40); g.font = '600 15px Fredoka, sans-serif'; g.fillStyle = '#6e5240'; g.fillText('Chapter 1 · The Garden Thieves', 40, Hd - 20);
  // quest stars
  if (RW.story) for (const mk of RW.story.marks()) { const [x, y] = toPaper(mk.x, mk.z); star(g, x, y, mk.color || '#ffd84d', 11); }
  // you are here
  const [px, py] = toPaper(G.player.pos.x, G.player.pos.z);
  g.save(); g.translate(px, py); g.fillStyle = '#e65a50'; g.strokeStyle = '#3b2a1e'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-12, -14, -10, -30, 0, -30); g.bezierCurveTo(10, -30, 12, -14, 0, 0); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(0, -20, 4.5, 0, 6.28); g.fill(); g.restore();
  $('mapLegend').innerHTML = '<span><i style="background:#e65a50"></i>You are here</span><span><i style="background:#ffd84d"></i>Quest</span><span>Clouds hide places you have not been to yet</span>';
}
function star(g, x, y, col, r) { g.save(); g.translate(x, y); g.fillStyle = col; g.strokeStyle = '#3b2a1e'; g.lineWidth = 2.5; g.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.45 : r, a = (i / 10) * Math.PI * 2 - Math.PI / 2; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); g.stroke(); g.restore(); }

// ---------- events ----------
RW.on('enter', (p) => { P = p; makeChests(); setBadge(false); bookTab = AREAS[W.active] ? W.active : 'meadow'; setTimeout(() => { if (P === p) payStars(true); }, 2500); });
RW.on('leave', () => { for (const ch of chests) G.removeSpot(ch.spot.id); chests.length = 0; P = null; });
RW.on('kill', () => payStars(false));
RW.on('map', (id) => { if (AREAS[id]) bookTab = id; if (UI.isOpen('mapPanel')) renderMap(); });

let mapT = 0;
function update(dt, time) {
  if (!P) return;
  updateChests(dt, time);
  mapT -= dt; if (mapT <= 0 && UI.isOpen('mapPanel')) { mapT = 0.5; renderMap(); }
}
RW.explore = { update, renderMap, renderBook, chestCount, starsOf, chests };
})();
