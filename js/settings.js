// Russel World (delivery 10): settings (volume, language), the online account save, and the Sunny Salon in Mossbrook.
(function () {
'use strict';
const RW = window.RW;
if (!RW || RW.failed || !RW.G) return;
const { THREE } = RW;
const G = RW.G, UI = RW.UI, AU = RW.audio, W = RW.world;
const $ = (id) => document.getElementById(id);

// ================= language =================
// menus, buttons and window titles; the story talk stays in English for now
const ID = {
  'Settings': 'Pengaturan', 'Sound': 'Suara', 'Music': 'Musik', 'Sound effects': 'Efek suara', 'Music volume': 'Volume musik', 'Effects volume': 'Volume efek',
  'Language': 'Bahasa', 'Your account': 'Akun kamu', 'Save now': 'Simpan sekarang',
  'Menus and buttons change language. Story talk stays in English for now.': 'Menu dan tombol ganti bahasa. Percakapan cerita masih bahasa Inggris untuk sekarang.',
  'Open the game while signed in to Claude, on your phone or computer, and your heroes follow you.': 'Buka game sambil masuk ke akun Claude, di HP atau komputer, dan pahlawanmu ikut ke sana.',
  'Saved on this device only.': 'Tersimpan di perangkat ini saja.', 'Saved to your Claude account.': 'Tersimpan di akun Claude kamu.', 'Saving...': 'Menyimpan...', 'Checking your account...': 'Memeriksa akunmu...', 'Could not reach your account. Saved on this device.': 'Akun tidak terjangkau. Tersimpan di perangkat ini.',
  'Quest book': 'Buku misi', 'World map': 'Peta dunia', 'Waystone': 'Batu jalan', 'Monster book': 'Buku monster', 'My pet': 'Hewanku', 'Equipment': 'Perlengkapan', 'Spare gear': 'Perlengkapan cadangan',
  "Bolt's Smithy": 'Bengkel Bolt', 'Shop': 'Toko', 'Forge': 'Tempa', 'Repair': 'Perbaiki', 'Make stronger': 'Perkuat', 'Bag': 'Tas', "Mira's Goods": 'Toko Mira', 'Buy': 'Beli', 'Sell': 'Jual',
  'Sunny Salon': 'Salon Ceria', 'Hairstyle': 'Gaya rambut', 'Hair colour': 'Warna rambut', 'Skin tone': 'Warna kulit', 'Undo': 'Batal', 'Pay & keep': 'Bayar & pakai', 'No change yet': 'Belum ada perubahan',
  'Coco the stylist can give you a new hairstyle, hair colour or skin tone. Try things on for free, pay when you like it.': 'Coco si penata rambut bisa ganti gaya rambut, warna rambut, atau warna kulit. Coba gratis, bayar kalau suka.',
  'Welcome to Russel World': 'Selamat datang di Russel World', 'Controls': 'Kontrol', 'Change hero': 'Ganti pahlawan', 'Play': 'Main', 'Welcome!': 'Selamat datang!', 'Welcome back!': 'Selamat datang kembali!',
  'Back': 'Kembali', 'Create Character': 'Buat Karakter', 'Delete hero?': 'Hapus pahlawan?', 'Keep': 'Simpan', 'Delete forever': 'Hapus selamanya', 'Skip': 'Lewati', 'Delete': 'Hapus',
  'Choose your hero': 'Pilih pahlawanmu', 'Your heroes are saved on this device.': 'Pahlawanmu tersimpan di perangkat ini.', 'Your heroes are saved to your Claude account.': 'Pahlawanmu tersimpan di akun Claude kamu.',
  'Make your first hero to begin your adventure.': 'Buat pahlawan pertamamu untuk mulai berpetualang.', 'How to play': 'Cara bermain', 'Random': 'Acak',
  'Job': 'Pekerjaan', 'Level': 'Level', 'Location': 'Lokasi', 'Pet': 'Hewan', 'None yet': 'Belum ada', 'Novice': 'Pemula',
  'Main quests': 'Misi utama', 'Side quests': 'Misi sampingan', 'Requests': 'Permintaan', 'Daily': 'Harian', 'Reward': 'Hadiah', 'Close': 'Tutup',
  'Use': 'Pakai', 'Equip': 'Pakai', 'Remove': 'Lepas', 'Drop': 'Buang', 'Items': 'Barang', 'Stats': 'Statistik', 'Skills': 'Skill',
  'Feed': 'Beri makan', 'Play with': 'Ajak main', 'Bathe': 'Mandikan', 'Rename': 'Ganti nama',
  'You are here': 'Kamu di sini', 'Quest': 'Misi', 'Clouds hide places you have not been to yet': 'Awan menutupi tempat yang belum kamu kunjungi',
  'Chapter 1 · The Garden Thieves': 'Babak 1 · Pencuri Kebun', 'Chapter 1 - The Garden Thieves': 'Babak 1 - Pencuri Kebun',
  'Learn': 'Pelajari', 'Strength': 'Kekuatan', 'Agility': 'Kelincahan', 'Intelligence': 'Kecerdasan', 'Vitality': 'Daya tahan', 'Luck': 'Keberuntungan',
  'Teleport': 'Teleportasi', 'Go': 'Pergi', 'Accept': 'Terima', 'Not now': 'Nanti saja', 'On my way!': 'Segera berangkat!', 'Bye!': 'Dadah!', 'Buy & sell': 'Beli & jual'
};
const EN = {}; for (const k in ID) EN[ID[k]] = k;
let lang = 'en';
RW.lang = () => lang; // v1.4: new dialogue picks English or Indonesian with RW.T(en, id)
const SKIP = (n) => { const p = n.parentElement; return !p || p.closest('#labels, #dialog, script, style, textarea, #worldMap'); };
function trNode(n) {
  const raw = n.nodeValue, t = raw.trim(); if (!t || t.length > 140) return;
  const dict = lang === 'id' ? ID : EN, to = dict[t];
  if (to && to !== t) n.nodeValue = raw.replace(t, to);
}
function walk(root) {
  const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let n; while ((n = it.nextNode())) if (!SKIP(n)) trNode(n);
}
let busyTr = false;
const mo = new MutationObserver((list) => {
  if (busyTr) return; busyTr = true;
  try {
    for (const m of list) {
      if (m.type === 'characterData') { if (!SKIP(m.target)) trNode(m.target); continue; }
      for (const a of m.addedNodes) {
        if (a.nodeType === 3) { if (!SKIP(a)) trNode(a); }
        else if (a.nodeType === 1 && !a.closest('#labels')) walk(a);
      }
    }
  } finally { busyTr = false; }
});
function setLang(l, quiet) {
  lang = l === 'id' ? 'id' : 'en';
  document.documentElement.lang = lang;
  walk(document.body);
  for (const b of document.querySelectorAll('#langSeg button')) b.setAttribute('aria-checked', String(b.dataset.lang === lang));
  if (!quiet) { G.settings.lang = lang; G.saveSettings(); }
}
mo.observe(document.body, { subtree: true, childList: true, characterData: true });

// ================= sound sliders =================
function syncSliders() {
  const s = AU.state;
  $('musicVol').value = Math.round(s.musicVol * 100); $('musicVolN').textContent = Math.round(s.musicVol * 100);
  $('sfxVol').value = Math.round(s.sfxVol * 100); $('sfxVolN').textContent = Math.round(s.sfxVol * 100);
}
let volSaveT = null;
function laterSave() { clearTimeout(volSaveT); volSaveT = setTimeout(() => G.saveSettings(), 500); }
$('musicVol').addEventListener('input', (e) => { AU.ensure(); const v = e.target.value / 100; AU.setMusicVol(v); $('musicVolN').textContent = e.target.value; laterSave(); });
$('sfxVol').addEventListener('input', (e) => { AU.ensure(); const v = e.target.value / 100; AU.setSfxVol(v); $('sfxVolN').textContent = e.target.value; laterSave(); });
$('sfxVol').addEventListener('change', () => AU.sfx.click());
$('soundBtn').addEventListener('click', () => { syncSliders(); syncCloud(); });
for (const b of document.querySelectorAll('#langSeg button')) b.addEventListener('click', () => { AU.sfx.click(); setLang(b.dataset.lang); });

// ================= online account: one save per Claude account, shared by phone and computer =================
const cloud = { state: 'local', msg: 'Saved on this device only.', ref: null, inflight: false, again: false, timer: null, lastPushed: 0 };
function status(st, msg) { cloud.state = st; cloud.msg = msg; syncCloud(); }
function syncCloud() {
  const dot = $('cloudDot'), txt = $('cloudTxt');
  dot.className = 'cloud-dot' + (cloud.state === 'on' ? ' on' : cloud.state === 'busy' ? ' busy' : cloud.state === 'err' ? ' err' : '');
  txt.textContent = (lang === 'id' && ID[cloud.msg]) || cloud.msg;
  $('cloudNow').hidden = !cloud.ref;
}
async function push() {
  if (!cloud.ref) return;
  if (cloud.inflight) { cloud.again = true; return; }
  const json = G.storeText();
  if (json.length > 240000) { status('err', 'Could not reach your account. Saved on this device.'); return; }
  cloud.inflight = true; status('busy', 'Saving...');
  try {
    await cloud.ref.set({ json, at: G.storeAt() });
    cloud.lastPushed = Date.now(); status('on', 'Saved to your Claude account.');
  } catch (e) {
    if (e && e.code === 'unavailable') { setTimeout(queue, 4000 + Math.random() * 3000); status('busy', 'Saving...'); }
    else status('err', 'Could not reach your account. Saved on this device.');
  } finally {
    cloud.inflight = false;
    if (cloud.again) { cloud.again = false; queue(); }
  }
}
function queue() {
  if (!cloud.ref) return;
  clearTimeout(cloud.timer);
  // not more than once every 15 seconds while playing
  const wait = Math.max(1500, 15000 - (Date.now() - cloud.lastPushed));
  cloud.timer = setTimeout(push, wait);
}
function flush() { if (cloud.ref && cloud.timer) { clearTimeout(cloud.timer); cloud.timer = null; push(); } }
document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
window.addEventListener('pagehide', flush);
$('cloudNow').addEventListener('click', () => { AU.sfx.click(); clearTimeout(cloud.timer); push(); });
RW.cloud = { queue, push, get state() { return cloud.state; } };

async function cloudInit() {
  const c = window.claude;
  if (!c || typeof c.use !== 'function') return;
  let db = null, user = null;
  try { [db, user] = await Promise.all([c.use('db'), c.use('user')]); } catch (e) { return; }
  if (!db || !user) return;
  let id = null; try { id = await user.id(); } catch (e) { id = null; }
  if (!id) return;
  try { cloud.ref = db.doc('data/users/' + id + '/save'); } catch (e) { return; }
  status('busy', 'Checking your account...');
  let snap = null;
  for (let tries = 0; tries < 2 && !snap; tries++) {
    try { snap = await cloud.ref.get(); } catch (e) { if (!(e && e.code === 'unavailable') || tries) { status('err', 'Could not reach your account. Saved on this device.'); return; } await new Promise((r) => setTimeout(r, 1500)); }
  }
  const data = snap && snap.exists ? snap.data() : null;
  let remote = null; try { remote = data && typeof data.json === 'string' ? JSON.parse(data.json) : null; } catch (e) { remote = null; }
  const localAt = G.storeAt(), remoteAt = remote ? (remote.at || data.at || 0) : 0;
  if (remote && remoteAt > localAt + 1000) {
    if (G.adoptStore(remote)) {
      if (RW.menu && RW.menu.screen && RW.menu.showTitle) RW.menu.showTitle();
      UI.toast('Your heroes came from your Claude account!');
      status('on', 'Saved to your Claude account.');
    } else { status('on', 'Saved to your Claude account.'); push(); }
  } else if (!remote || localAt > remoteAt + 1000) { cloud.lastPushed = 0; push(); }
  else status('on', 'Saved to your Claude account.');
}
// the title screen says where heroes are kept
setInterval(() => {
  const n = $('tNote'); if (!n) return;
  if (cloud.state === 'on' || cloud.state === 'busy') { const a = 'Your heroes are saved on this device.'; if (n.textContent === a || n.textContent === ID[a]) n.textContent = lang === 'id' ? ID['Your heroes are saved to your Claude account.'] : 'Your heroes are saved to your Claude account.'; }
}, 800);

// ================= Sunny Salon =================
const SALON = { x: -15.5, z: 13.5, face: 0.6 };
const PRICE = { hair: 150, color: 100, skin: 120 };
function salonModel() {
  const g = new THREE.Group(), lam = RW.lam;
  const wood = lam(0x9a6a44), pink = lam(0xf3a0bf), white = lam(0xfff3e4), mirror = new THREE.MeshLambertMaterial({ color: 0xbfe6ff, emissive: 0x2a5a7a });
  const box = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); g.add(o); return o; };
  const cyl = (rt, rb, h, m, x, y, z, seg) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 14), m); o.position.set(x, y, z); g.add(o); return o; };
  // little stage, back wall with a mirror, a striped awning, a chair and a sign
  cyl(2.3, 2.4, 0.22, wood, 0, 0.11, 0, 20);
  box(3.2, 2.4, 0.2, white, 0, 1.4, -1.3);
  const fr = box(1.3, 1.5, 0.12, wood, 0, 1.55, -1.16); fr.scale.set(1, 1, 1);
  box(1.08, 1.28, 0.08, mirror, 0, 1.55, -1.08);
  for (let i = 0; i < 6; i++) { const s = box(0.54, 0.12, 1.5, i % 2 ? white : pink, -1.35 + i * 0.54, 2.75, -0.62); s.rotation.x = 0.35; }
  box(3.3, 0.14, 0.16, pink, 0, 2.62, 0.08);
  cyl(0.06, 0.06, 2.6, wood, -1.55, 1.4, 0.05, 8); cyl(0.06, 0.06, 2.6, wood, 1.55, 1.4, 0.05, 8);
  cyl(0.42, 0.36, 0.18, pink, 0, 0.78, -0.2); cyl(0.07, 0.12, 0.5, lam(0x8a8a96), 0, 0.46, -0.2, 8);
  box(0.8, 0.6, 0.14, pink, 0, 1.15, -0.52);
  // a comb and scissors sign on the roof
  const sign = new THREE.Group(); sign.position.set(0, 3.25, 0.1); g.add(sign);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 20), white); disc.rotation.x = Math.PI / 2; sign.add(disc);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.06, 8, 24), pink); sign.add(ring);
  for (const a of [0.6, -0.6]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.04), lam(0x6a6a78)); b.rotation.z = a; b.position.z = 0.07; sign.add(b); }
  // a potted flower each side
  for (const sx of [-1.9, 1.9]) { cyl(0.22, 0.17, 0.32, lam(0xc0703e), sx, 0.38, -0.7, 10); const f = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), lam(sx < 0 ? 0xff8fb0 : 0xffd84d)); f.position.set(sx, 0.75, -0.7); g.add(f); }
  g.rotation.y = SALON.face;
  return g;
}
let salonSpot = null, draft = null, orig = null;
function addSalon() {
  if (salonSpot) return;
  salonSpot = G.addSpot({ id: 'salon', x: SALON.x, z: SALON.z, label: 'Sunny Salon', model: salonModel(), range: 3.2, tagY: 3.8, onUse: openSalon });
  if (W.addCollider) W.addCollider(SALON.x - Math.sin(SALON.face) * 1.0, SALON.z - Math.cos(SALON.face) * 1.0, 1.3);
}
function cost() { let c = 0; for (const k in PRICE) if (draft && orig && draft[k] !== orig[k]) c += PRICE[k]; return c; }
function lookNow() { const P = RW.debug.P; return P && P.look; }
function openSalon() {
  const L = lookNow(); if (!L) return;
  orig = Object.assign({}, L); draft = Object.assign({}, L);
  renderSalon(); UI.open('salonPanel');
  if (RW.story && RW.story.say && !RW.debug.P.story.sawSalon) { RW.debug.P.story.sawSalon = true; RW.story.say('A new hairstyle? Ooh! Can I get one too? ...Owls do not have hair. Just feathers. Fancy feathers.', 'happy'); }
}
function tryOn() { const L = lookNow(); if (!L) return; Object.assign(L, draft); G.refreshHero(); }
function renderSalon() {
  const LK = RW.LOOKS;
  const pills = (el, list, key, isColor) => {
    el.innerHTML = '';
    list.forEach(([name, val], i) => {
      const b = document.createElement('button'), v = key === 'hair' ? val : i;
      b.type = 'button'; b.setAttribute('aria-pressed', String(draft[key] === v)); b.setAttribute('aria-label', name);
      if (isColor) { b.className = 'salon-sw'; b.style.background = val; b.title = name; } else b.textContent = name;
      b.addEventListener('click', () => { AU.sfx.click(); draft[key] = v; tryOn(); renderSalon(); });
      el.appendChild(b);
    });
  };
  pills($('salHair'), LK.hairs, 'hair');
  pills($('salColor'), LK.colors, 'color', true);
  pills($('salSkin'), LK.skins, 'skin', true);
  const c = cost(), P = RW.debug.P;
  $('salCost').textContent = c ? (lang === 'id' ? 'Biaya: ' : 'Price: ') + c + (lang === 'id' ? ' koin' : ' coins') : (lang === 'id' ? ID['No change yet'] : 'No change yet');
  $('salBuy').disabled = !c || !P || P.coins < c;
  $('salUndo').disabled = !c;
}
$('salUndo').addEventListener('click', () => { if (!orig) return; AU.sfx.click(); draft = Object.assign({}, orig); tryOn(); renderSalon(); });
$('salBuy').addEventListener('click', () => {
  const P = RW.debug.P, c = cost(); if (!P || !c) return;
  if (P.coins < c) { G.deny ? G.deny('Not enough coins') : UI.toast('Not enough coins'); return; }
  G.addCoins(-c); orig = Object.assign({}, draft); tryOn(); G.save();
  AU.sfx.questDone ? AU.sfx.questDone() : AU.sfx.click();
  UI.toast(lang === 'id' ? 'Gaya baru! Kamu kelihatan keren.' : 'New look! You look great.');
  renderSalon();
});
// leaving the salon without paying puts the old look back
setInterval(() => {
  if (orig && $('salonPanel').hidden) {
    const L = lookNow();
    if (L && (L.hair !== orig.hair || L.color !== orig.color || L.skin !== orig.skin)) { Object.assign(L, orig); G.refreshHero(); }
    orig = null; draft = null;
  }
}, 300);

// ================= start =================
RW.on('enter', () => { addSalon(); });
setLang(G.settings.lang || 'en', true);
syncSliders(); syncCloud();
cloudInit();
})();
