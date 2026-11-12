// Russel World: windows and HUD widgets (bag, stats, shop, dialog, sound, help, toasts, banner).
// Game actions are called through RW.G, which game.js fills in.
(function () {
'use strict';
const RW = window.RW;
if (RW.failed) return;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const G = () => RW.G;
const sfx = () => RW.audio.sfx;

// ---------- toasts and the area banner ----------
const toastEl = $('toast');
function toast(text, big) {
  const el = document.createElement('div'); el.className = 'toast' + (big ? ' big' : ''); el.innerHTML = text; toastEl.appendChild(el);
  while (toastEl.children.length > 3) toastEl.firstChild.remove();
  setTimeout(() => el.classList.add('out'), big ? 2200 : 1700); setTimeout(() => el.remove(), big ? 2700 : 2200);
}
let bannerT = 0;
function banner(title, sub) {
  $('bannerTitle').textContent = title; $('bannerSub').textContent = sub;
  const b = $('banner'); b.classList.add('on'); clearTimeout(bannerT); bannerT = setTimeout(() => b.classList.remove('on'), 2600);
}

// ---------- windows ----------
const WINDOWS = ['bagPanel', 'statPanel', 'shopPanel', 'soundPanel', 'helpPanel', 'questPanel', 'mapPanel', 'bookPanel', 'petPanel', 'gearPanel', 'smithPanel', 'wayPanel', 'salonPanel'];
let openId = null;
function open(id) {
  for (const w of WINDOWS) if (w !== id) $(w).hidden = true;
  if (id !== 'shopPanel') $('dialog').hidden = true;
  $(id).hidden = false; openId = id;
  if (id === 'bagPanel') renderBag();
  if (id === 'statPanel') renderStats();
  if (id === 'shopPanel') renderShop();
  if (id === 'helpPanel' && G() && G().p) $('helpName').textContent = G().p.name;
  if (id === 'questPanel' && RW.story) RW.story.renderJournal();
  if (id === 'mapPanel' && RW.explore) RW.explore.renderMap();
  if (id === 'bookPanel' && RW.explore) RW.explore.renderBook();
  if (id === 'petPanel' && RW.pets) RW.pets.render();
  if (id === 'gearPanel' && RW.gear) RW.gear.render();
  if (id === 'smithPanel' && RW.gear) RW.gear.renderSmith();
  if (id === 'wayPanel' && RW.river) RW.river.renderWay();
  syncCoins();
  const first = $(id).querySelector('button'); if (first && !RW.isTouch) first.focus({ preventScroll: true });
}
function close(id) { $(id).hidden = true; if (openId === id) openId = null; if (id === 'shopPanel') { RW.shopNow = null; RW.shopTitle = null; } if (id === 'helpPanel' && G()) G().onHelpClosed(); }
function toggle(id) { if ($(id).hidden) open(id); else close(id); }
function closeAll() { let any = false; for (const w of WINDOWS) if (!$(w).hidden) { close(w); any = true; } if (!$('dialog').hidden) { hideDialog(); any = true; } return any; }
function isOpen(id) { return !$(id).hidden; }
document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => { const p = b.closest('.panel'); if (p) close(p.id); sfx().click(); }));

function syncCoins() { const c = G() && G().p ? G().p.coins : 0; document.querySelectorAll('.coinval').forEach((e) => { e.textContent = String(c); }); }
document.querySelectorAll('.coinimg').forEach((i) => { i.src = RW.iconURL('coin', 32); });
$('coinIco').src = RW.iconURL('coin', 32);

// ---------- bag ----------
let bagSel = null;
function renderBag() {
  const g = G(), p = g.p, grid = $('bagGrid'), slots = Math.max(36, Math.ceil((p.bag.length + 1) / 6) * 6);
  if (bagSel && !p.bag.some((e) => e[0] === bagSel)) bagSel = null;
  if (!bagSel && p.bag.length) bagSel = p.bag[0][0];
  let html = '';
  for (let i = 0; i < slots; i++) {
    const e = p.bag[i];
    if (!e) { html += '<div class="bslot empty" aria-hidden="true"></div>'; continue; }
    const it = RW.ITEMS[e[0]];
    html += '<button class="bslot ' + it.rarity + '" data-id="' + e[0] + '" aria-pressed="' + (e[0] === bagSel) + '" aria-label="' + esc(it.name) + ', ' + e[1] + '"><img src="' + RW.iconURL(e[0]) + '" alt=""><span class="n">' + e[1] + '</span></button>';
  }
  grid.innerHTML = html;
  grid.querySelectorAll('button.bslot').forEach((b) => b.addEventListener('click', () => { bagSel = b.dataset.id; sfx().click(); renderBag(); }));
  renderDetail();
}
function renderDetail() {
  const g = G(), d = $('bagDetail');
  if (!bagSel) { d.innerHTML = '<p class="note">Your bag is empty. Monsters drop things you can sell to Mira.</p>'; return; }
  const it = RW.ITEMS[bagSel], rar = RW.RARITY[it.rarity], n = g.bagCount(bagSel);
  let acts = '';
  if (it.kind === 'potion') {
    acts += '<button class="btn small" data-act="use">Use</button>';
    { const k = g.barIndex({ i: bagSel }); acts += '<button class="btn small soft" data-act="setkey">' + RW.T(k >= 0 ? 'On key ' + (k + 1) + ' · Change' : 'Set on a button (1-6)', k >= 0 ? 'Di tombol ' + (k + 1) + ' · Ganti' : 'Pasang ke tombol (1-6)') + '</button>'; }
  }
  if (it.food && RW.pets && RW.pets.active()) acts += '<button class="btn small" data-act="feed">Feed ' + esc(RW.pets.active().name) + '</button>';
  if (it.kind === 'egg' && RW.pets) acts += '<button class="btn small" data-act="egg">Carry this egg</button>';
  d.innerHTML = '<div class="idet-top"><img src="' + RW.iconURL(bagSel) + '" alt=""><div><div class="iname">' + esc(it.name) + '</div><div class="irar" style="color:' + rar.ink + '">' + rar.name + ' · ×' + n + '</div></div></div>' +
    '<p class="idesc">' + esc(it.desc) + (it.food ? ' <b>Pet food +' + it.food + (it.fun ? ', fun +' + it.fun : '') + '.</b>' : '') + '</p><div class="ival">' + (it.sell ? 'Mira buys it for ' + it.sell + ' coins each.' : 'Too precious to sell.') + '</div><div class="irow">' + acts + '</div>';
  d.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => {
    const a = b.dataset.act;
    if (a === 'setkey') { RW.jobs.pickSlot({ i: bagSel }, renderBag); return; }
    if (a === 'use') g.useItem(bagSel); else if (a === 'feed') RW.pets.feed(bagSel); else if (a === 'egg') RW.pets.carryEgg(bagSel);
    renderBag();
  }));
}

// ---------- stats ----------
function renderStats() {
  const g = G(), p = g.p, D = g.derived();
  $('statTitle').textContent = p.name + ' · Stats & Skills';
  $('ptsLeft').textContent = String(p.pts);
  $('statRows').innerHTML = RW.STAT_KEYS.map((k) => { const s = RW.STAT_INFO[k]; return '<div class="srow"><span class="sshort">' + s.short + '</span><span class="sname">' + s.name + '<small>' + s.desc + '</small></span><span class="sval">' + p.stats[k] + '</span><button class="plus" data-k="' + k + '" aria-label="Add a point to ' + s.name + '"' + (p.pts > 0 ? '' : ' disabled') + '>+</button></div>'; }).join('');
  $('statRows').querySelectorAll('.plus').forEach((b) => b.addEventListener('click', () => { g.addStat(b.dataset.k); renderStats(); }));
  const pct = (v) => (v * 100).toFixed(1) + '%';
  const rows = [['Attack', Math.round(D.atk)], ['Defense', Math.round(D.def)], ['Max HP', D.maxHp], ['Max MP', D.maxMp], ['Critical', pct(D.crit)], ['Dodge', pct(D.dodge)], ['Attack speed', '×' + D.speed.toFixed(2)], ['Rare drops', '×' + D.luck.toFixed(2)]];
  if (D.job === 'mage') rows.splice(1, 0, ['Magic', Math.round(D.matk)]);
  if (D.range) rows.push(['Range', D.range + ' m']);
  // basic value + what the gear adds (green), same as the equipment window
  $('derived').innerHTML = RW.gearStatRows ? '<div class="drow" style="grid-column:1/-1"><small class="gnote" style="margin:0">basic <b class="gplus">+gear</b></small></div>' + RW.gearStatRows(true) : rows.map(([a, b]) => '<div class="drow"><span>' + a + '</span><span>' + b + '</span></div>').join('');
  // titles: every title, how to earn it, what it gives; tap an earned one to wear it
  const own = p.titles || [], esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let th = '<h3 class="ttl-h">Titles <small>Only the title you wear gives its bonus.</small></h3><div class="ttl-list">';
  for (const [name, T] of Object.entries(RW.TITLES)) {
    const has = own.includes(name), on = p.title === name;
    th += '<div class="ttl' + (has ? '' : ' locked') + (on ? ' on' : '') + '"><div class="ttl-t"><b>' + (has ? '' : '🔒 ') + esc(name) + '</b><span class="ttl-b">' + esc(T.text) + '</span></div><small>' + esc(T.how) + '</small>'
      + (has ? '<button class="btn small' + (on ? ' soft' : '') + '" data-title="' + (on ? '' : esc(name)) + '">' + (on ? 'Take off' : 'Wear') + '</button>' : '') + '</div>';
  }
  $('titleRows').innerHTML = th + '</div>';
  $('titleRows').querySelectorAll('[data-title]').forEach((b) => b.addEventListener('click', () => { p.title = b.dataset.title; sfx().click(); if (g.refreshHeroTag) g.refreshHeroTag(); g.refreshHero(); g.save(); renderStats(); }));
  if (RW.jobs) RW.jobs.renderSkills();
}

// ---------- shop ----------
let shopTab = 'buy';
function sellAllList(p) {
  const keep = new Set(['forge_crystal', 'ruby']);
  const S = RW.story;
  if (S) for (const id of S.ALL) { const st = S.stageOf(id); if (st) for (const o of st.goal) if (o.item) keep.add(o.item); }
  const list = []; let n = 0, coins = 0;
  for (const [id, c] of p.bag) { const it = RW.ITEMS[id]; if (!it || !it.sell || it.kind !== 'material' || it.rarity !== 'common' || keep.has(id)) continue; list.push([id, c]); n += c; coins += it.sell * c; }
  return { list, n, coins };
}
function renderShop() {
  const g = G(), p = g.p, list = $('shopList'), coin = '<img src="' + RW.iconURL('coin', 32) + '" alt="">';
  $('tabBuy').setAttribute('aria-selected', String(shopTab === 'buy')); $('tabSell').setAttribute('aria-selected', String(shopTab === 'sell'));
  let html = '';
  $('shopTitle').textContent = RW.shopNow ? (RW.shopTitle || "Pip's Pet Snacks") : "Mira's Goods";
  const what = (it) => it.heal ? 'Restores ' + it.heal + ' HP' : it.mana ? 'Restores ' + it.mana + ' MP' : it.cure ? 'Cures ' + ({ poison: 'poison', stun: 'dizziness', freeze: 'freezing' }[it.cure] || it.cure) : it.food ? 'Pet food +' + it.food + (it.fun ? ', fun +' + it.fun : '') : '';
  if (shopTab === 'buy') {
    for (const id of RW.shopNow || RW.SHOP) {
      const it = RW.ITEMS[id], have = g.bagCount(id);
      html += '<div class="srow2"><img src="' + RW.iconURL(id) + '" alt=""><div class="nm">' + esc(it.name) + '<small>' + what(it) + ' · you have ' + have + '</small><span class="price">' + coin + it.price + '</span></div>' +
        '<div class="acts"><button class="btn small" data-buy="' + id + '" data-n="1"' + (p.coins < it.price ? ' disabled' : '') + '>Buy 1</button><button class="btn small soft" data-buy="' + id + '" data-n="5"' + (p.coins < it.price * 5 ? ' disabled' : '') + '>Buy 5</button></div></div>';
    }
  } else {
    const gearRows = !RW.shopNow && RW.gear ? RW.gear.sellRows() : '';
    if (!p.bag.length && !gearRows) html = '<p class="empty-note">Nothing to sell yet. Monsters in Sunny Meadow drop jelly, caps and more.</p>';
    // v1.5: one button sells every plain (common) monster material, keeping forge stones and anything an active quest needs
    const bulk = sellAllList(p);
    if (bulk.n) html += '<div class="srow2 bulk"><img src="' + RW.iconURL('coin', 32) + '" alt=""><div class="nm">' + RW.T('Sell all materials', 'Jual semua bahan') + '<small>' + RW.T(bulk.n + ' common · keeps quest items & forge stones', bulk.n + ' biasa · barang quest & bahan tempa disimpan') + '</small><span class="price">' + coin + bulk.coins + '</span></div><div class="acts"><button class="btn small" id="sellAllMats">' + RW.T('Sell all', 'Jual semua') + '</button></div></div>';
    if (gearRows) html += '<h3 class="subh">Spare gear</h3>' + gearRows + (p.bag.length ? '<h3 class="subh">Items</h3>' : '');
    for (const [id, n] of p.bag) {
      const it = RW.ITEMS[id], rar = RW.RARITY[it.rarity];
      if (!it.sell) continue;
      html += '<div class="srow2"><img src="' + RW.iconURL(id) + '" alt=""><div class="nm">' + esc(it.name) + '<small style="color:' + rar.ink + '">' + rar.name + ' · ×' + n + '</small><span class="price">' + coin + it.sell + ' each</span></div>' +
        '<div class="acts"><button class="btn small" data-sell="' + id + '" data-n="1">Sell 1</button>' + (n > 1 ? '<button class="btn small soft" data-sell="' + id + '" data-n="' + n + '">Sell all</button>' : '') + '</div></div>';
    }
  }
  list.innerHTML = html;
  list.querySelectorAll('[data-buy]').forEach((b) => b.addEventListener('click', () => { g.buy(b.dataset.buy, Number(b.dataset.n)); renderShop(); syncCoins(); }));
  list.querySelectorAll('[data-sell]').forEach((b) => b.addEventListener('click', () => { g.sell(b.dataset.sell, Number(b.dataset.n)); renderShop(); syncCoins(); }));
  const sa = $('sellAllMats');
  if (sa) sa.addEventListener('click', () => { for (const [id, n] of sellAllList(p).list) g.sell(id, n); renderShop(); syncCoins(); });
  list.querySelectorAll('[data-gsell]').forEach((b) => b.addEventListener('click', () => { RW.gear.sell(Number(b.dataset.gsell)); renderShop(); syncCoins(); }));
}
$('tabBuy').addEventListener('click', () => { shopTab = 'buy'; sfx().click(); renderShop(); });
$('tabSell').addEventListener('click', () => { shopTab = 'sell'; sfx().click(); renderShop(); });

// ---------- dialog: a face picture that changes expression, text that appears letter by letter with each speaker's own blip ----------
// lines: [{ who, name, role, face, text }]; actions appear after the last line
const VOICE = { olly: 980, oakley: 250, mira: 620, bolt: 190, pip: 780, tobin: 300, fennick: 215, marla: 420, ivy: 560, zara: 700 };
const WHO = { olly: ['Olly', 'Owl, genius'], oakley: ['Elder Oakley', 'Village elder'], mira: ['Mira', 'Shopkeeper'], bolt: ['Bolt', 'Blacksmith'], pip: ['Pip', 'Pet keeper'], tobin: ['Old Tobin', 'Kite maker'], fennick: ['Hermit Fennick', 'Whisperwood hermit'], marla: ['Marla Ironheart', 'Warrior master'], ivy: ['Ranger Ivy', 'Archer master'], zara: ['Zara Emberly', 'Mage master'], nora: ['Nora', 'Miller of Riverside'], king: ['King Leaflet', 'King of all Leaflets'], board: ['Notice board', 'Mossbrook'], chest: ['Treasure chest', ''] };
let dlg = null;
function say(lines, actions, opts) {
  for (const w of WINDOWS) $(w).hidden = true; openId = null; RW.shopNow = null;
  dlg = { lines, i: -1, actions: actions || [], opts: opts || {}, text: '', shown: 0, t: 0 };
  $('dialog').hidden = false;
  nextLine();
}
function nextLine() {
  if (!dlg) return;
  dlg.i++;
  const ln = dlg.lines[dlg.i];
  if (!ln) { const done = dlg.opts.onDone; hideDialog(); if (done) done(); return; }
  const who = WHO[ln.who] || [ln.name || '', ln.role || ''];
  $('dName').innerHTML = esc(ln.name || who[0]) + (who[1] || ln.role ? '<small>' + esc(ln.role || who[1]) + '</small>' : '');
  const pic = RW.portraits ? RW.portraits.get(ln.who, ln.face || 'normal') : null;
  $('dPortWrap').hidden = !pic; if (pic) $('dPortrait').src = pic;
  dlg.text = ln.text; dlg.shown = 0; dlg.t = 0; dlg.voice = VOICE[ln.who] || 0;
  if (RW.story) RW.story.onLine(ln);
  $('dText').textContent = '';
  const last = dlg.i === dlg.lines.length - 1, acts = $('dActs'); acts.innerHTML = '';
  if (last) for (const a of dlg.actions) { const b = document.createElement('button'); b.className = 'btn small' + (a.soft ? ' soft' : ''); b.textContent = a.label; b.addEventListener('click', (e) => { e.stopPropagation(); sfx().click(); a.run(); }); acts.appendChild(b); }
  $('dMore').hidden = last && dlg.actions.length > 0;
}
function showDialog(npc, text, actions) { say([{ who: npc.id, name: npc.name, role: npc.role, text }], actions); }
function hideDialog() { const was = !!dlg; $('dialog').hidden = true; dlg = null; if (was && RW.story) RW.story.onLine(null); }
function tickDialog(dt) {
  if (!dlg || dlg.shown >= dlg.text.length) return;
  dlg.t += dt;
  const want = Math.min(dlg.text.length, Math.floor(dlg.t * 55));
  if (want > dlg.shown) { if (dlg.voice && Math.floor(want / 3) > Math.floor(dlg.shown / 3) && dlg.text[want - 1] !== ' ') sfx().talk(dlg.voice); dlg.shown = want; $('dText').textContent = dlg.text.slice(0, want); }
}
function advanceDialog() {
  if (!dlg) return;
  if (dlg.shown < dlg.text.length) { dlg.shown = dlg.text.length; $('dText').textContent = dlg.text; return; }
  if (dlg.i < dlg.lines.length - 1 || !dlg.actions.length) { sfx().click(); nextLine(); }
}
$('dialog').addEventListener('click', advanceDialog);
window.addEventListener('keydown', (e) => { if (dlg && (e.key === ' ' || e.key === 'Enter') && !(e.target && e.target.tagName === 'INPUT')) { e.preventDefault(); advanceDialog(); } });

// ---------- sound, help, start over ----------
function syncSound() { const s = RW.audio.state; $('musicSw').setAttribute('aria-checked', String(s.musicOn)); $('sfxSw').setAttribute('aria-checked', String(s.sfxOn)); }
$('musicSw').addEventListener('click', () => { RW.audio.ensure(); RW.audio.setMusic(!RW.audio.state.musicOn); syncSound(); G().saveSettings(); });
$('sfxSw').addEventListener('click', () => { RW.audio.ensure(); RW.audio.setSfx(!RW.audio.state.sfxOn); syncSound(); sfx().click(); G().saveSettings(); });
$('soundBtn').addEventListener('click', () => { syncSound(); toggle('soundPanel'); });
$('helpBtn').addEventListener('click', () => toggle('helpPanel'));
$('helpStart').addEventListener('click', () => { RW.audio.ensure(); close('helpPanel'); });
$('bagBtn').addEventListener('click', () => { sfx().click(); toggle('bagPanel'); });
$('statBtn').addEventListener('click', () => { sfx().click(); toggle('statPanel'); });
// back to the hero select screen (the game saves first)
$('heroBtn').addEventListener('click', () => { sfx().click(); $('helpPanel').hidden = true; openId = null; if (RW.menu) RW.menu.backToSelect(); });

// the 6 buttons (skills and items) are drawn by jobs.js
function renderHotbar() { if (RW.jobs) RW.jobs.renderSlots(); }

RW.UI = { toast, banner, open, close, toggle, closeAll, isOpen, renderBag, renderStats, renderShop, renderHotbar, say, showDialog, hideDialog, tickDialog, syncCoins, syncSound, get openId() { return openId; }, get talking() { return !!dlg; } };
})();
