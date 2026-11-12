// Russel World v1.4: things to do between fights. Fishing (Nora's rod, a timing game and a fish album), crafting at the shops,
// Tomo the traveling merchant, the Lantern Festival in December, and a second pet buddy that tags along.
(function () {
'use strict';
const RW = window.RW;
if (!RW || RW.failed || !RW.G || !RW.world) return;
const { THREE, scene, rnd, ITEMS, PETS } = RW;
const W = RW.world, G = RW.G, UI = RW.UI, sfx = RW.audio.sfx, esc = G.esc;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const T = RW.T || ((en) => en);
const P = () => G.p;
const bye = () => { UI.hideDialog(); G.endTalk(); };
const pending = (id) => RW.story && RW.story.pending && RW.story.pending(id);
const ollySay = (t, f) => { if (RW.story && RW.story.say) RW.story.say(t, f || 'happy', true); };
const todayKey = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };

// ---------- a small window of our own (fish album, crafting) ----------
const css = document.createElement('style');
css.textContent = '#hobBox{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:60;width:min(440px,calc(100vw - 32px));max-height:min(560px,calc(100vh - 40px));overflow:auto;background:#fbf1dc;border:3px solid #3b2a1e;border-radius:18px;box-shadow:0 10px 30px rgba(0,0,0,.35);padding:14px 16px;font-family:Fredoka,sans-serif;color:#3b2a1e}' +
  '#hobBox h2{margin:0 0 8px;font-size:20px}#hobBox .x{position:absolute;right:10px;top:8px;border:0;background:#e8604c;color:#fff;border-radius:50%;width:30px;height:30px;font-size:18px;cursor:pointer}' +
  '#hobBox .row{display:flex;align-items:center;gap:10px;padding:6px 4px;border-bottom:1px dashed rgba(59,42,30,.25)}#hobBox .row img{width:34px;height:34px}#hobBox .row .t{flex:1;font-size:14px}#hobBox .row small{display:block;color:#6e5240}#hobBox .row button{border:2px solid #3b2a1e;background:#7cc46a;border-radius:10px;padding:4px 10px;font:600 14px Fredoka,sans-serif;cursor:pointer}#hobBox .row button:disabled{background:#d8cdb8;cursor:default}' +
  '#hobBox .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:8px}#hobBox .fish{text-align:center;font-size:12px;background:#fff8ea;border:2px solid #d8c8a8;border-radius:12px;padding:6px}#hobBox .fish.no img{filter:brightness(0) opacity(.25)}#hobBox .note{font-size:13px;color:#6e5240}' +
  '#fishBar{position:fixed;left:50%;bottom:120px;transform:translateX(-50%);z-index:55;width:min(360px,calc(100vw - 32px));background:#fbf1dc;border:3px solid #3b2a1e;border-radius:16px;padding:10px 12px;font:600 15px Fredoka,sans-serif;color:#3b2a1e;text-align:center;box-shadow:0 6px 18px rgba(0,0,0,.3)}' +
  '#fishBar .track{position:relative;height:22px;background:#9ad0e0;border:2px solid #3b2a1e;border-radius:11px;margin:8px 0;overflow:hidden}#fishBar .zone{position:absolute;top:0;bottom:0;background:#7cd46a}#fishBar .mark{position:absolute;top:-2px;bottom:-2px;width:6px;margin-left:-3px;background:#e8604c;border-radius:3px}' +
  '#fishBar button{border:2px solid #3b2a1e;background:#ffd84d;border-radius:10px;padding:6px 16px;font:700 16px Fredoka,sans-serif;cursor:pointer;margin:0 4px}';
document.head.appendChild(css);
function box(title, html, wire) {
  close();
  const b = document.createElement('div'); b.id = 'hobBox';
  b.innerHTML = '<button class="x" aria-label="Close">×</button><h2>' + title + '</h2>' + html;
  document.body.appendChild(b);
  b.querySelector('.x').addEventListener('click', close);
  if (wire) wire(b);
  return b;
}
function close() { const b = document.getElementById('hobBox'); if (b) b.remove(); }
const icon = (id) => '<img src="' + RW.iconURL(id) + '" alt="">';

// ======================================================================= fishing
const FISH = {
  pond: [['minnow', 50], ['sunperch', 32], ['mosscarp', 16], ['golden_koi', 2]],
  river: [['trout', 40], ['catfish', 30], ['eel', 22], ['minnow', 6], ['golden_koi', 2]],
  sea: [['sardine', 44], ['clownfish', 28], ['squid', 22], ['moon_ray', 3]],
  ice: [['icefish', 55], ['snowsalmon', 40], ['crystal_carp', 2]]
};
const ALL_FISH = Object.keys(ITEMS).filter((id) => ITEMS[id].fish);
const WATERS = [
  ['f_m1', -92, -142, 13, 'pond'], ['f_m2', 112, -268, 9, 'pond'], ['f_w1', -650, -526, 8, 'pond'],
  ['f_r1', W.DOCK.x, W.DOCK.z, 0, 'river'],
  ['f_c1', -1488, 8, 0, 'sea'], ['f_b1', -1468, -420, 0, 'sea'], ['f_rf1', -1640, -780, 12, 'sea'], ['f_l1', -2100, -400, 26, 'sea'],
  ['f_g1', -3500, -400, 30, 'ice'], ['f_g2', -3440, -470, 12, 'ice'], ['f_f1', -2988, 8, 0, 'ice']
];
function shore(wx, wz, r) {
  for (let d = r + 1.6; d < r + 14; d += 0.8) for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2, x = wx + Math.cos(a) * d, z = wz + Math.sin(a) * d; if (W.walkable(x, z)) return [x, z, a]; }
  return null;
}
function ripple() {
  const g = new THREE.Group();
  for (let i = 0; i < 2; i++) { const m = new THREE.Mesh(new THREE.RingGeometry(0.5 + i * 0.4, 0.62 + i * 0.4, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.y = 0.05; g.add(m); }
  g.userData.live = true; return g;
}
const fSpots = [];
function makeFishSpots() {
  for (const s of fSpots.splice(0)) G.removeSpot(s.id);
  for (const [id, wx, wz, r, pool] of WATERS) {
    const sh = shore(wx, wz, r); if (!sh) continue;
    const [x, z, a] = sh, rp = ripple();
    // the ripples sit on the water, a little in front of where you stand
    const holder = new THREE.Group(); rp.position.set(-Math.cos(a) * 2.2, -0.3, -Math.sin(a) * 2.2); holder.add(rp);
    const s = G.addSpot({ id, x, z, label: T('Fishing spot', 'Tempat mancing'), model: holder, range: 2.6, y: 0.4, onUse: () => startFish(pool) });
    s.rp = rp; fSpots.push(s);
  }
}
let fishing = null;
function hasRod() { return G.bagCount('fishing_rod') > 0; }
function startFish(pool) {
  const p = P(); if (!p || fishing) return;
  if (!hasRod()) { UI.toast(T('You need a fishing rod. Nora at the Riverside mill has an old one!', 'Kamu butuh pancing. Nora di kincir Riverside punya pancing tua!')); return; }
  if (G.player.target || (G.player.lastFight && G.time - G.player.lastFight < 3)) { UI.toast(T('Too noisy! Finish the fight first.', 'Terlalu ribut! Selesaikan pertarungan dulu.')); return; }
  G.stopActions();
  const bar = document.createElement('div'); bar.id = 'fishBar';
  bar.innerHTML = '<div class="msg">' + T('Waiting for a bite...', 'Menunggu ikan menggigit...') + '</div><div class="track"><div class="zone"></div><div class="mark"></div></div><button class="go">' + T('Reel in!', 'Tarik!') + '</button><button class="stop">' + T('Stop', 'Berhenti') + '</button>';
  document.body.appendChild(bar);
  const night = RW.sky && RW.sky.night > 0.5;
  const list = FISH[pool].map(([id, w]) => [id, id === 'moon_ray' && !night ? 0 : w]);
  let tot = 0; for (const [, w] of list) tot += w;
  let roll = Math.random() * tot, fish = list[0][0]; for (const [id, w] of list) { roll -= w; if (roll <= 0) { fish = id; break; } }
  const rar = ITEMS[fish].rarity, zw = rar === 'common' ? 0.24 : rar === 'rare' ? 0.16 : 0.1;
  fishing = { pool, fish, bar, wait: rnd(1.5, 4.5), bite: false, t: 0, pos: 0, dir: 1, speed: rar === 'common' ? 0.9 : 1.4, zone: rnd(0.1, 0.9 - zw), zw, at: G.player.pos.clone() };
  const zone = bar.querySelector('.zone'); zone.style.left = fishing.zone * 100 + '%'; zone.style.width = zw * 100 + '%'; zone.style.opacity = '0.25';
  bar.querySelector('.go').addEventListener('click', reel);
  bar.querySelector('.stop').addEventListener('click', () => endFish());
  sfx.click && sfx.click();
}
function reel() {
  const F = fishing; if (!F) return;
  if (!F.bite) { endFish(T('Too early! The fish swam away.', 'Terlalu cepat! Ikannya kabur.')); return; }
  if (F.pos >= F.zone && F.pos <= F.zone + F.zw) {
    const id = F.fish, p = P(); G.bagAdd(id, 1);
    p.fish = p.fish || {}; const first = !p.fish[id]; p.fish[id] = (p.fish[id] || 0) + 1;
    G.floatText('<small>' + esc(ITEMS[id].name) + '</small>', 'heal', V3(G.player.pos.x, G.player.pos.y + 2.2, G.player.pos.z), 1.4);
    sfx.sparkle ? sfx.sparkle() : sfx.coin();
    G.gainExp(Math.round(20 + G.p.lv * 6 * (ITEMS[id].rarity === 'common' ? 1 : 4)));
    endFish(T('You caught a <b>' + ITEMS[id].name + '</b>!', 'Kamu dapat <b>' + ITEMS[id].name + '</b>!') + (first ? T(' (New in your fish album!)', ' (Baru di album ikan!)') : ''), true);
    if (ITEMS[id].rarity !== 'common') ollySay(T('WOW! A ' + ITEMS[id].name + '! I have only seen those in books!', 'WOW! ' + ITEMS[id].name + '! Aku cuma pernah lihat di buku!'), 'surprised');
    albumRewards();
  } else endFish(T('Missed! It got away...', 'Meleset! Ikannya lepas...'));
}
function endFish(msg, good) {
  const F = fishing; if (!F) return; fishing = null;
  F.bar.remove(); if (msg) UI.toast(msg, !!good);
  G.save();
}
function tickFish(dt) {
  const F = fishing; if (!F) return;
  if (G.player.dead || Math.hypot(G.player.pos.x - F.at.x, G.player.pos.z - F.at.z) > 1.5 || G.player.lastHurt > G.time - 0.1) { endFish(T('The fish got scared away.', 'Ikannya ketakutan dan kabur.')); return; }
  F.t += dt;
  if (!F.bite) { if (F.t >= F.wait) { F.bite = true; F.t = 0; F.bar.querySelector('.msg').innerHTML = '<b>' + T('BITE! Stop the marker in the green!', 'GIGIT! Hentikan penanda di hijau!') + '</b>'; F.bar.querySelector('.zone').style.opacity = '1'; sfx.point && sfx.point(); } return; }
  F.pos += F.dir * F.speed * dt; if (F.pos > 1) { F.pos = 1; F.dir = -1; } if (F.pos < 0) { F.pos = 0; F.dir = 1; }
  F.bar.querySelector('.mark').style.left = F.pos * 100 + '%';
  if (F.t > 5) endFish(T('Too slow! The fish got away.', 'Terlalu lambat! Ikannya lepas.'));
}
window.addEventListener('keydown', (e) => { if (fishing && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); e.stopPropagation(); reel(); } }, true);
function albumRewards() {
  const p = P(), got = ALL_FISH.filter((id) => p.fish && p.fish[id]).length;
  p.story.fishR = p.story.fishR || 0;
  if (got >= 6 && p.story.fishR < 1) { p.story.fishR = 1; G.bagAdd('light_shard', 1); UI.toast(T('Fish album: 6 kinds! Nora sends you a <b>Light Shard</b>.', 'Album ikan: 6 jenis! Nora mengirim <b>Kepingan Cahaya</b>.'), true); }
  if (got >= 11 && p.story.fishR < 2) { p.story.fishR = 2; G.bagAdd('light_charm', 1); G.addCoins(1000); UI.toast(T('Fish album: 11 kinds! A <b>Light Charm</b> and 1000 coins!', 'Album ikan: 11 jenis! <b>Jimat Cahaya</b> dan 1000 koin!'), true); }
  if (got >= ALL_FISH.length && p.story.fishR < 3) { p.story.fishR = 3; if (!p.titles.includes('Master Angler')) p.titles.push('Master Angler'); UI.toast(T('Every fish found! New title: <b>Master Angler</b>.', 'Semua ikan ditemukan! Gelar baru: <b>Master Angler</b>.'), true); }
}
RW.TITLES['Master Angler'] = { how: 'Catch every kind of fish (fish album).', bonus: { luck: 0.08, hp: 60 }, text: '+8% Luck, +60 Max HP' };
function album() {
  const p = P(), got = ALL_FISH.filter((id) => p.fish && p.fish[id]).length;
  let h = '<p class="note">' + T('Caught ', 'Tertangkap ') + got + ' / ' + ALL_FISH.length + T(' kinds. Rewards at 6 and 11 kinds, and a title for all of them. Ponds, the river, the sea and the ice each have their own fish. The Moonlight Ray only bites at night!', ' jenis. Hadiah di 6 dan 11 jenis, dan gelar kalau semua. Kolam, sungai, laut dan es punya ikan masing-masing. Pari Cahaya Bulan hanya muncul malam hari!') + '</p><div class="grid">';
  for (const id of ALL_FISH) { const n = (p.fish && p.fish[id]) || 0; h += '<div class="fish' + (n ? '' : ' no') + '">' + icon(id) + '<div>' + (n ? esc(ITEMS[id].name) + '<br>×' + n : '???') + '</div></div>'; }
  box(T('Fish Album', 'Album Ikan'), h + '</div>');
}
function noraTalk(n) {
  if (pending(n.id)) return false;
  const p = P(), L1 = (en, id, face) => ({ who: 'nora', name: n.name, role: n.role, face: face || 'happy', text: T(en, id) });
  if (!hasRod()) {
    UI.say([L1('Oh! You look like someone who would love fishing. I have my grandpa\'s old rod. Here, take it!', 'Oh! Kamu kelihatannya suka memancing. Aku punya pancing tua kakekku. Ini, ambil!'),
      L1('Find the blue ripples by ponds, rivers and the sea. Click, wait for the bite, then stop the marker in the green!', 'Cari riak biru di kolam, sungai dan laut. Klik, tunggu umpannya digigit, lalu hentikan penanda di area hijau!')],
    [{ label: T('Thank you!', 'Terima kasih!'), run: () => { G.bagAdd('fishing_rod', 1); UI.toast(T('Got the <b>Fishing Rod</b>!', 'Dapat <b>Pancing</b>!'), true); bye(); } }]);
    return true;
  }
  UI.say([L1('Any good catches today? Fish make the best pet food, you know.', 'Dapat ikan bagus hari ini? Ikan itu makanan pet terbaik, lho.')],
    [{ label: T('Fish album', 'Album ikan'), run: () => { bye(); album(); } }, { label: T('Goodbye', 'Dadah'), soft: true, run: bye }]);
  return true;
}

// ======================================================================= crafting
const RECIPES = [
  ['red_m', 1, [['leaf_jelly', 4], ['sweet_sprout', 1]]],
  ['blue_m', 1, [['breeze_jelly', 3], ['glowcap', 2]]],
  ['antidote', 2, [['pond_slime', 2], ['glowcap', 1]]],
  ['warm_tea', 2, [['honey_drop', 1], ['leaf_jelly', 2]]],
  ['pet_treat', 3, [['acorn', 2], ['honey_drop', 1]]],
  ['fish_stew', 1, [['*fish', 3]]],
  ['tropic_mix', 2, [['coconut', 2], ['banana', 2]]],
  ['frost_pie', 2, [['frost_jelly', 2], ['snow_fluff', 2], ['honey_drop', 1]]],
  ['light_charm', 1, [['light_shard', 3], ['river_pearl', 1]]]
];
const fishCount = () => ALL_FISH.reduce((s, id) => s + G.bagCount(id), 0);
const haveOf = (id) => (id === '*fish' ? fishCount() : G.bagCount(id));
const nameOf = (id) => (id === '*fish' ? T('any fish', 'ikan apa saja') : ITEMS[id].name);
function craft(i) {
  const [out, n, mats] = RECIPES[i];
  for (const [id, k] of mats) if (haveOf(id) < k) return G.deny(T('Not enough ', 'Kurang ') + nameOf(id) + '.');
  for (const [id, k] of mats) {
    if (id !== '*fish') { G.bagTake(id, k); continue; }
    let left = k; for (const f of ALL_FISH.slice().sort((a, b) => ITEMS[a].sell - ITEMS[b].sell)) { while (left > 0 && G.bagCount(f) > 0) { G.bagTake(f, 1); left--; } }
  }
  G.bagAdd(out, n); sfx.buy ? sfx.buy() : sfx.coin();
  UI.toast(T('Crafted ', 'Dibuat ') + n + ' × <b>' + esc(ITEMS[out].name) + '</b>');
  G.save(); bench();
}
function bench() {
  let h = '<p class="note">' + T('Turn monster drops and fish into potions and pet food. Light Charms protect your gear when enhancing at +6 or more.', 'Ubah barang monster dan ikan jadi ramuan dan makanan pet. Jimat Cahaya melindungi gear saat enhance di +6 ke atas.') + '</p>';
  RECIPES.forEach(([out, n, mats], i) => {
    const ok = mats.every(([id, k]) => haveOf(id) >= k);
    h += '<div class="row">' + icon(out) + '<div class="t"><b>' + esc(ITEMS[out].name) + (n > 1 ? ' ×' + n : '') + '</b><small>' + mats.map(([id, k]) => esc(nameOf(id)) + ' ' + Math.min(haveOf(id), k) + '/' + k).join(' · ') + '</small></div><button data-c="' + i + '"' + (ok ? '' : ' disabled') + '>' + T('Craft', 'Buat') + '</button></div>';
  });
  box(T('Crafting Bench', 'Meja Racik'), h, (b) => b.querySelectorAll('[data-c]').forEach((x) => x.addEventListener('click', () => craft(+x.dataset.c))));
}
Object.assign(ITEMS.fish_stew, { price: 60 }); Object.assign(ITEMS.tropic_mix, { price: 70 }); Object.assign(ITEMS.frost_pie, { price: 100 });
const SHOPS = { kiki: ['red_m', 'red_l', 'blue_m', 'blue_l', 'antidote', 'pet_kibble', 'tropic_mix', 'tide_egg'], freya: ['warm_tea', 'red_m', 'red_l', 'blue_m', 'blue_l', 'frost_pie', 'frost_egg'] };
function shopTalk(n) {
  if (pending(n.id)) return false;
  const L1 = (en, id) => ({ who: n.id, name: n.name, role: n.role, face: 'happy', text: T(en, id) });
  const text = n.id === 'mira' ? L1('Welcome! Shopping, or do you want to use my crafting bench?', 'Selamat datang! Belanja, atau mau pakai meja racikku?')
    : n.id === 'kiki' ? L1('Shells, potions and island snacks! And a sea egg, if you are brave.', 'Kerang, ramuan dan camilan pulau! Dan telur laut, kalau kamu berani.')
      : L1('Warm Tea! Hot pie! And a frost egg for a very warm heart.', 'Teh Hangat! Pai panas! Dan telur salju untuk hati yang hangat.');
  UI.say([text], [
    { label: T('Buy & sell', 'Beli & jual'), run: () => { UI.hideDialog(); RW.shopNow = SHOPS[n.id] || null; RW.shopTitle = SHOPS[n.id] ? n.name + T("'s Shop", ' - Toko') : null; UI.open('shopPanel'); } },
    { label: T('Crafting bench', 'Meja racik'), run: () => { bye(); bench(); } },
    { label: T('Goodbye', 'Dadah'), soft: true, run: bye }]);
  return true;
}

// ======================================================================= Tomo, the traveling merchant
const RARE = [['lucky_clover', 650], ['golden_leaf', 200], ['light_shard', 380], ['light_charm', 950], ['coral_branch', 520], ['river_pearl', 320], ['wild_egg', 1300], ['royal_jelly', 900], ['berry_bowl', 30], ['clam_pearl', 600], ['snow_crystal', 800], ['fire_opal', 700], ['golden_koi', 900]];
function todaysGoods() {
  const d = new Date(), seed = d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate(), rr = RW.seeded(seed * 7 + 3), pool = RARE.slice(), out = [];
  while (out.length < 5 && pool.length) out.push(pool.splice(Math.floor(rr() * pool.length), 1)[0]);
  if (festival()) out.push(['berry_bowl', 20]);
  for (const [id, pr] of out) ITEMS[id].price = pr;
  return out.map((o) => o[0]);
}
function tomoTalk(n) {
  if (pending(n.id)) return false;
  const L1 = (en, id) => ({ who: n.id, name: n.name, role: n.role, face: 'happy', text: T(en, id) });
  UI.say([L1('Psst! Rare goods from far, far away. Different things every day. Today only!', 'Psst! Barang langka dari tempat yang jauh sekali. Tiap hari beda. Hari ini saja!')],
    [{ label: T('See today\'s goods', 'Lihat barang hari ini'), run: () => { UI.hideDialog(); const g = todaysGoods(); RW.shopNow = g; RW.shopTitle = T("Tomo's Rare Goods", 'Barang Langka Tomo'); UI.open('shopPanel'); } }, { label: T('Goodbye', 'Dadah'), soft: true, run: bye }]);
  return true;
}

// ======================================================================= Lantern Festival (all of December)
function festival() { return new Date().getMonth() === 11; }
let lanterns = null;
function festivalDecor() {
  if (lanterns || !festival() || !W.MAPS.meadow) return;
  lanterns = new THREE.Group(); W.MAPS.meadow.group.add(lanterns);
  const cols = [0xff7a5a, 0xffd84d, 0xff9ac8, 0x7cc4ff];
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2, x = Math.cos(a) * 17, z = Math.sin(a) * 17, y = W.height(x, z);
    const pole = new THREE.Mesh(RW.geoCyl(0.06, 0.08, 3.2, 6), RW.lam(0x6b4a30)); pole.position.set(x, y + 1.6, z); lanterns.add(pole);
    const l = new THREE.Mesh(RW.geoSphere(0.35, 12, 10), new THREE.MeshLambertMaterial({ color: cols[i % 4], emissive: cols[i % 4], emissiveIntensity: 0.6 })); l.scale.y = 1.25; l.position.set(x, y + 3.3, z); lanterns.add(l);
    const gl = RW.glow(1.8); gl.position.copy(l.position); gl.material.color = new THREE.Color(cols[i % 4]); gl.material.opacity = 0.5; lanterns.add(gl);
  }
  // sky lanterns drifting up over town
  for (let i = 0; i < 24; i++) { const l = new THREE.Mesh(RW.geoSphere(0.28, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffc070 })); l.scale.y = 1.3; l.position.set(rnd(-40, 40), rnd(6, 40), rnd(-40, 40)); l.userData.sky = rnd(0.4, 1); lanterns.add(l); }
}
function tickFestival(dt) { if (!lanterns || W.active !== 'meadow') return; for (const o of lanterns.children) if (o.userData.sky) { o.position.y += o.userData.sky * dt; if (o.position.y > 60) o.position.y = 6; } }
function oakleyTalk(n) {
  if (!festival() || pending(n.id)) return false;
  const p = P(); if (p.story.festGift === todayKey()) return false;
  p.story.festGift = todayKey();
  const items = [['red_m', 2], ['pet_treat', 3]]; if ([24, 25, 31].includes(new Date().getDate())) items.push(['light_shard', 1]);
  for (const [id, k] of items) G.bagAdd(id, k);
  UI.say([{ who: 'oakley', name: n.name, role: n.role, face: 'happy', text: T('Happy Lantern Festival! In my day we lit lanterns so nobody ever walked home in the dark. Here is a little gift. Come back tomorrow for another!', 'Selamat Festival Lentera! Dulu kami menyalakan lentera supaya tidak ada yang pulang dalam gelap. Ini hadiah kecil. Besok datang lagi ya!') }],
    [{ label: T('Thank you!', 'Terima kasih!'), run: bye }]);
  UI.toast(T('Festival gift: ', 'Hadiah festival: ') + items.map(([id, k]) => k + ' × ' + esc(ITEMS[id].name)).join(', '), true);
  G.save();
  return true;
}

// ======================================================================= a second pet buddy
let buddy = null;
function buddyPet() { const p = P(); return p && p.petOn2 && p.petOn2 !== p.petOn ? p.pets.find((x) => x.id === p.petOn2) : null; }
function spawnBuddy() {
  despawnBuddy(); const pet = buddyPet(); if (!pet) return;
  const m = RW.petModel(pet.sp, pet.stage); m.root.scale.setScalar(0.62); m.root.add(RW.blob(0.5 * (m.size || 0.8))); scene.add(m.root);
  const pl = G.player; m.root.position.set(pl.pos.x + 1, W.height(pl.pos.x + 1, pl.pos.z), pl.pos.z);
  buddy = { pet, m, pos: m.root.position, face: 0, t: 0, cd: 2, hop: 0 };
}
function despawnBuddy() { if (!buddy) return; scene.remove(buddy.m.root); buddy = null; }
function tickBuddy(dt) {
  if (!buddy) return;
  const B = buddy, pl = G.player, f = pl.face; B.t += dt;
  if (B.pet !== buddyPet()) { spawnBuddy(); return; }
  const tx = pl.pos.x - Math.sin(f) * 1.4 - Math.cos(f) * 1.1, tz = pl.pos.z - Math.cos(f) * 1.4 + Math.sin(f) * 1.1;
  const dx = tx - B.pos.x, dz = tz - B.pos.z, d = Math.hypot(dx, dz);
  if (d > 20 || W.mapAt(B.pos.x, B.pos.z) !== W.active) B.pos.set(tx, 0, tz);
  else if (d > 0.3) { const sp = Math.min(8, Math.max(2.5, d * 2.6)) * dt; W.tryMove(B.pos, B.pos.x + dx / d * Math.min(sp, d), B.pos.z + dz / d * Math.min(sp, d), false); B.hop += dt * 12; B.face += RW.wrapAngle(Math.atan2(dx, dz) - B.face) * Math.min(1, dt * 8); }
  B.pos.y = W.height(B.pos.x, B.pos.z);
  B.m.root.rotation.y = B.face; B.m.body.position.y = (B.m.hover || 0) + (d > 0.3 ? Math.abs(Math.sin(B.hop)) * 0.1 : 0);
  // it helps with the hero's target: a little shot every couple of seconds
  B.cd -= dt;
  const t = pl.target;
  if (B.cd <= 0 && t && t.alive && !t.k.target && Math.hypot(t.pos.x - B.pos.x, t.pos.z - B.pos.z) < 9) {
    B.cd = 2.2; B.face = Math.atan2(t.pos.x - B.pos.x, t.pos.z - B.pos.z);
    const st = RW.petStats(B.pet), col = PETS[B.pet.sp].col || 0xffffff;
    for (let k = 0; k <= 6; k++) G.spawnPuff(V3(B.pos.x + (t.pos.x - B.pos.x) * k / 6, B.pos.y + 0.5, B.pos.z + (t.pos.z - B.pos.z) * k / 6), col, false);
    G.hitMonster(t, 0.8, 0.1, false, false, { flat: st.atk * 0.7, pet: true, fromX: B.pos.x, fromZ: B.pos.z, color: col });
  }
}
function pipTalk(n) {
  const p = P(); if (pending(n.id) || !p || p.pets.length < 2) return false;
  if (p.story.buddyMenu === n) return false;
  const L1 = (en, id) => ({ who: 'pip', name: n.name, role: n.role, face: 'happy', text: T(en, id) });
  UI.say([L1('You have more than one pet now! Want a second pet to walk with you as a buddy? It helps with your target.', 'Kamu punya lebih dari satu pet! Mau pet kedua ikut jalan sebagai teman? Dia membantu menyerang targetmu.')], [
    { label: T('Pet den', 'Rumah pet'), run: () => { UI.hideDialog(); p.story.buddyMenu = n; try { if (!RW.pets.talk(n)) bye(); } finally { delete p.story.buddyMenu; } } },
    { label: T('Choose a buddy', 'Pilih teman'), run: () => pickBuddy(n) },
    { label: T('Goodbye', 'Dadah'), soft: true, run: bye }]);
  return true;
}
function pickBuddy(n) {
  const p = P(), acts = [];
  for (const pet of p.pets) if (pet.id !== p.petOn) acts.push({ label: pet.name + ' (' + PETS[pet.sp].name + ')', run: () => { p.petOn2 = pet.id; spawnBuddy(); G.save(); UI.toast(T('<b>' + esc(pet.name) + '</b> walks with you as a buddy!', '<b>' + esc(pet.name) + '</b> ikut jalan sebagai teman!'), true); bye(); } });
  if (p.petOn2) acts.push({ label: T('No buddy', 'Tanpa teman'), run: () => { p.petOn2 = null; despawnBuddy(); G.save(); bye(); } });
  acts.push({ label: T('Back', 'Kembali'), soft: true, run: bye });
  UI.say([{ who: 'pip', name: n.name, role: n.role, face: 'happy', text: T('Who should come along? (Your main pet stays your main pet.)', 'Siapa yang ikut? (Pet utamamu tetap pet utama.)') }], acts);
}

// ======================================================================= hooks, events, frame loop
RW.talkHooks = RW.talkHooks || [];
RW.talkHooks.push((n) => {
  if (n.id === 'nora') return noraTalk(n);
  if (n.id === 'mira' || n.id === 'kiki' || n.id === 'freya') return shopTalk(n);
  if (n.id === 'tomo') return tomoTalk(n);
  if (n.id === 'oakley') return oakleyTalk(n);
  if (n.id === 'pip') return pipTalk(n);
  return false;
});
RW.on('enter', () => {
  makeFishSpots(); festivalDecor(); setTimeout(spawnBuddy, 800);
  if (festival()) setTimeout(() => { if (P()) UI.banner(T('Lantern Festival!', 'Festival Lentera!'), T('All December in Mossbrook · visit Elder Oakley for a daily gift', 'Sepanjang Desember di Mossbrook · kunjungi Elder Oakley untuk hadiah harian')); }, 3500);
});
RW.on('leave', () => { despawnBuddy(); endFish(); close(); });
RW.on('map', () => { endFish(); });
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  try {
    if (P() && G.mode === 'play') {
      tickFish(dt); tickBuddy(dt); tickFestival(dt);
      for (const s of fSpots) if (s.rp && s.rp.parent && s.model && s.model.visible) { const k = (now / 1000) % 2; s.rp.children.forEach((r, i) => { const q = (k + i) % 2; r.scale.setScalar(0.6 + q * 0.9); r.material.opacity = 0.7 * (1 - q / 2); }); }
    }
  } catch (e) { console.error(e); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
RW.hobby = { album, bench, startFish, todaysGoods, festival, spawnBuddy, debugTick: (dt) => { tickFish(dt); tickBuddy(dt); tickFestival(dt); }, fishing: () => fishing };
})();
