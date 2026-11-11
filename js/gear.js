// Russel World: equipment (delivery 7). Hats, clothes, shoes, necklaces, rings and job weapons;
// rarity with random bonuses, sets, wear and tear, and Bolt's smithy (shop, forge, repair, +1..+10).
(function () {
'use strict';
const RW = window.RW;
if (!RW || RW.failed || !RW.G) return;
const { THREE, renderer, ITEMS, WEAPONS, JOBS } = RW;
const G = RW.G, UI = RW.UI, sfx = RW.audio.sfx;
const $ = (id) => document.getElementById(id);
const esc = G.esc;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// ---------- data ----------
const SLOTS = ['weapon', 'head', 'body', 'feet', 'neck', 'ring'];
const SLOT_NAME = { weapon: 'Weapon', head: 'Hat', body: 'Clothes', feet: 'Shoes', neck: 'Necklace', ring: 'Ring' };
const RAR = [
  { name: 'Common', color: '#b9b0a0', ink: '#6e5240' },
  { name: 'Fine', color: '#5fae4a', ink: '#3f7f2e' },
  { name: 'Rare', color: '#4f9ae6', ink: '#2f6fb0' },
  { name: 'Epic', color: '#a070e0', ink: '#7a3fb0' },
  { name: 'Legendary', color: '#f2b53a', ink: '#b0661e' }
];
// what each stat is called and how big a random bonus can be at an item level
const STAT = {
  atk: { name: 'Attack', roll: (lv) => 1 + lv * 0.5 },
  def: { name: 'Defense', roll: (lv) => 1 + lv * 0.4 },
  hp: { name: 'Max HP', roll: (lv) => 8 + lv * 4 },
  mp: { name: 'Max MP', roll: (lv) => 4 + lv * 2 },
  crit: { name: 'Critical', pct: true, roll: (lv) => 0.01 + lv * 0.001 },
  dodge: { name: 'Dodge', pct: true, roll: (lv) => 0.01 + lv * 0.001 },
  speed: { name: 'Attack speed', pct: true, roll: (lv) => 0.02 + lv * 0.002 },
  luck: { name: 'Rare drops', pct: true, roll: (lv) => 0.04 + lv * 0.004 }
};
const num = (v) => v >= 20 ? String(Math.round(v)) : String(Math.round(v * 10) / 10);
const statTxt = (k, v) => (STAT[k].pct ? '+' + Math.round(v * 1000) / 10 + '%' : '+' + num(v)) + ' ' + STAT[k].name;

// sets: 2 pieces and 3 pieces (hat, clothes, shoes) give extra stats
const SETS = {
  leaflet: { name: 'Leaflet', two: { hp: 25 }, three: { def: 2, hp: 25 } },
  mushling: { name: 'Mushling', two: { mp: 15 }, three: { def: 3, mp: 15 } },
  breezy: { name: 'Breezy', two: { dodge: 0.02 }, three: { speed: 0.05 } },
  boar: { name: 'Bristleboar', two: { atk: 3 }, three: { atk: 2, hp: 40 } },
  mossy: { name: 'Mossy', two: { mp: 25 }, three: { def: 4, crit: 0.02 } },
  thorn: { name: 'Thornhog', two: { atk: 4 }, three: { def: 3, crit: 0.03 } },
  meadow: { name: 'Sunny Meadow', two: { hp: 40, luck: 0.05 }, three: { atk: 4, def: 4, luck: 0.05 } },
  hills: { name: 'Breezy Hills', two: { speed: 0.05, dodge: 0.02 }, three: { atk: 5, crit: 0.03 } },
  wood: { name: 'Whisperwood', two: { hp: 60, mp: 30 }, three: { atk: 6, def: 6, crit: 0.03 } },
  frog: { name: 'Plopfrog', two: { mp: 30 }, three: { dodge: 0.03, mp: 20 } },
  crab: { name: 'Rockpinch', two: { def: 5 }, three: { def: 5, hp: 60 } },
  squirrel: { name: 'Nutsnatcher', two: { luck: 0.08 }, three: { speed: 0.06, dodge: 0.02 } },
  bee: { name: 'Bramblebee', two: { crit: 0.03 }, three: { atk: 6, speed: 0.05 } },
  bush: { name: 'Bushling', two: { hp: 70 }, three: { def: 6, atk: 5 } },
  river: { name: 'Riverside', two: { hp: 70, mp: 35 }, three: { atk: 7, def: 7, luck: 0.06 } },
  bramble: { name: 'Thornbush', two: { atk: 6, crit: 0.02 }, three: { atk: 8, def: 8, crit: 0.04 } }
};
Object.assign(SETS, RW.EXTRA_SETS || {}); // v1.4: beach, island and snow sets (lands.js)
const GEAR = {};
const r1 = (v) => Math.round(v * 10) / 10, r3 = (v) => Math.round(v * 1000) / 1000;
const armor = (slot, lv, k) => slot === 'head' ? { def: r1((1 + lv * 0.5) * k), hp: Math.round((5 + lv * 3) * k) } : slot === 'body' ? { def: r1((2 + lv * 1.0) * k), hp: Math.round((10 + lv * 6) * k) } : { def: r1((1 + lv * 0.4) * k), dodge: r3((0.005 + lv * 0.001) * k) };
// monster sets drop from their monster; area sets are forged at Bolt
const SET_PIECES = [
  ['leaflet', 1, 'leaflet', [['leafcap', 'Leaf Cap'], ['leafvest', 'Leaf Vest'], ['leafboots', 'Leaf Boots']]],
  ['mushling', 2, 'mushling', [['mushcap', 'Mushling Cap'], ['mushvest', 'Mushling Vest'], ['mushboots', 'Mushling Boots']]],
  ['breezy', 3, 'breeze_leaflet', [['breezecap', 'Breezy Cap'], ['breezevest', 'Breezy Vest'], ['breezeboots', 'Breezy Boots']]],
  ['boar', 4, 'bristleboar', [['boarhelm', 'Boar Helm'], ['boarvest', 'Boar Hide Vest'], ['boarboots', 'Boar Fur Boots']]],
  ['mossy', 5, 'moss_mushling', [['mosscap', 'Mossy Cap'], ['mossvest', 'Mossy Vest'], ['mossboots', 'Mossy Boots']]],
  ['thorn', 6, 'thornhog', [['thornhelm', 'Thorn Helm'], ['thornvest', 'Thorn Vest'], ['thornboots', 'Thorn Boots']]],
  ['meadow', 3, null, [['flowercrown', 'Flower Crown'], ['suntunic', 'Sunny Tunic'], ['sunshoes', 'Sunny Shoes']]],
  ['hills', 5, null, [['feathercap', 'Feather Beret'], ['windcape', 'Wind Cape'], ['windboots', 'Wind Boots']]],
  ['wood', 7, null, [['glowhood', 'Glow Hood'], ['forestcloak', 'Forest Cloak'], ['rootboots', 'Root Boots']]],
  ['frog', 6, 'plopfrog', [['frogcap', 'Frog Hood'], ['frogvest', 'Lily Vest'], ['frogboots', 'Frog Flippers']]],
  ['crab', 7, 'rockpinch', [['crabhelm', 'Pebble Helm'], ['crabvest', 'Shell Vest'], ['crabboots', 'Pincer Boots']]],
  ['squirrel', 8, 'nutsnatcher', [['squirrelcap', 'Squirrel Ears'], ['squirrelvest', 'Bushy-tail Vest'], ['squirrelboots', 'Quick Paws']]],
  ['bee', 9, 'bramblebee', [['beecap', 'Bee Antennae'], ['beevest', 'Buzzy Vest'], ['beeboots', 'Stinger Boots']]],
  ['bush', 10, 'bushling', [['bushcap', 'Bush Hat'], ['bushvest', 'Leafy Coat'], ['bushboots', 'Bramble Boots']]],
  ['river', 8, null, [['strawhat', 'Straw Hat'], ['rivervest', 'River Vest'], ['riverboots', 'River Boots']]],
  ['bramble', 10, null, [['bramblecrown', 'Bramble Crown'], ['bramblecoat', 'Bramble Coat'], ['brambleboots', 'Thicket Boots']]]
].concat(RW.EXTRA_SET_PIECES || []);
const FORGE_MATS = {
  flowercrown: [['leaf_jelly', 8], ['sweet_sprout', 2]], suntunic: [['leaf_jelly', 10], ['mush_cap', 5]], sunshoes: [['spore_puff', 5], ['mush_cap', 3]],
  feathercap: [['dandelion_fluff', 6], ['breeze_jelly', 6]], windcape: [['breeze_jelly', 10], ['boar_bristle', 6]], windboots: [['boar_bristle', 8], ['dandelion_fluff', 3]],
  glowhood: [['glowcap', 8], ['spore_puff', 6]], forestcloak: [['glowcap', 10], ['thorn_quill', 6]], rootboots: [['thorn_quill', 8], ['glowcap', 4]],
  strawhat: [['pond_slime', 8], ['acorn', 5]], rivervest: [['pond_slime', 10], ['pebble_shell', 6]], riverboots: [['pebble_shell', 8], ['acorn', 4]],
  bramblecrown: [['bramble_twig', 8], ['honey_drop', 5]], bramblecoat: [['bramble_twig', 10], ['honey_drop', 6], ['root_knot', 4]], brambleboots: [['bramble_twig', 8], ['root_knot', 5]]
};
Object.assign(FORGE_MATS, RW.EXTRA_FORGE || {});
const DROP_SET = {};
for (const [set, lv, mon, pieces] of SET_PIECES) {
  pieces.forEach(([look, name], i) => {
    const slot = ['head', 'body', 'feet'][i], area = !mon;
    GEAR[look] = { name, slot, lv, set, look, base: armor(slot, lv, area ? 1.25 : 1), price: 0, from: area ? 'forge' : 'drop' };
    if (area) GEAR[look].forge = { mats: FORGE_MATS[look], coins: [80, 120, 80][i] * (lv / 3) | 0 };
  });
  if (mon) DROP_SET[mon] = pieces.map((p) => p[0]);
}
// Bolt's shop basics (always Common, no bonus)
Object.assign(GEAR, {
  clothcap: { name: 'Cloth Cap', slot: 'head', lv: 1, look: 'clothcap', base: armor('head', 1, 0.8), price: 60, from: 'shop' },
  paddedvest: { name: 'Padded Vest', slot: 'body', lv: 1, look: 'paddedvest', base: armor('body', 1, 0.8), price: 90, from: 'shop' },
  sturdyboots: { name: 'Sturdy Boots', slot: 'feet', lv: 1, look: 'sturdyboots', base: armor('feet', 1, 0.8), price: 50, from: 'shop' },
  cordneck: { name: 'Cord Necklace', slot: 'neck', lv: 1, base: { hp: 15 }, price: 100, from: 'shop', gem: '#c99a6a' },
  copperring: { name: 'Copper Ring', slot: 'ring', lv: 1, base: { crit: 0.01 }, price: 120, from: 'shop', gem: '#d9824a' },
  // accessories that drop in each area
  dewring: { name: 'Dewdrop Ring', slot: 'ring', lv: 2, base: { luck: 0.05 }, from: 'drop', area: 'meadow', gem: '#9fe0ff' },
  clovercharm: { name: 'Clover Charm', slot: 'neck', lv: 3, base: { luck: 0.08, hp: 10 }, from: 'drop', area: 'meadow', gem: '#5fbf5a' },
  skypendant: { name: 'Sky Pendant', slot: 'neck', lv: 4, base: { mp: 20 }, from: 'drop', area: 'hills', gem: '#7cc4ff' },
  tuskring: { name: 'Tusk Ring', slot: 'ring', lv: 5, base: { atk: 3 }, from: 'drop', area: 'hills', gem: '#fff3dc' },
  glowpendant: { name: 'Glow Pendant', slot: 'neck', lv: 6, base: { mp: 25, hp: 20 }, from: 'drop', area: 'wood', gem: '#9ff5d2' },
  thornring: { name: 'Thorn Ring', slot: 'ring', lv: 7, base: { atk: 4, crit: 0.01 }, from: 'drop', area: 'wood', gem: '#6a9a3a' },
  pearlring: { name: 'Pearl Ring', slot: 'ring', lv: 7, base: { mp: 20, luck: 0.05 }, from: 'drop', area: 'river', gem: '#e6eef8' },
  millpendant: { name: 'Millstone Pendant', slot: 'neck', lv: 8, base: { def: 3, hp: 30 }, from: 'drop', area: 'river', gem: '#9aa5b0' },
  honeyring: { name: 'Honey Ring', slot: 'ring', lv: 9, base: { atk: 5, crit: 0.015 }, from: 'drop', area: 'thorn', gem: '#f2b63d' },
  berrypendant: { name: 'Bramble Berry Pendant', slot: 'neck', lv: 10, base: { hp: 50, atk: 3 }, from: 'drop', area: 'thorn', gem: '#8a3a6a' },
  rootring: { name: 'Root Ring', slot: 'ring', lv: 6, base: { def: 2, hp: 25 }, from: 'drop', area: 'burrow', gem: '#8a5c3b' },
  heartpendant: { name: 'Heartwood Pendant', slot: 'neck', lv: 9, base: { hp: 60, def: 3, atk: 2 }, from: 'forge', gem: '#c9783a', forge: { mats: [['heartwood', 2], ['root_knot', 6]], coins: 300 } },
  amberpendant: { name: 'Amber Pendant', slot: 'neck', lv: 7, base: { hp: 40, def: 2 }, from: 'forge', gem: '#f0a63a', forge: { mats: [['forest_amber', 1], ['glowcap', 5]], coins: 150 } }
});
// job weapons: three kinds for each of the eight weapons (iron from the shop, tusk from monsters, amber from the forge)
const WTIER = { iron: { name: 'Iron', lv: 10, add: 5, color: '#b8c2cc', price: 300, from: 'shop' }, tusk: { name: 'Tusk', lv: 10, add: 8, color: '#fff3dc', from: 'drop' }, amber: { name: 'Amber', lv: 12, add: 12, color: '#f0a63a', from: 'forge', forge: { mats: [['forest_amber', 2], ['little_tusk', 1], ['thorn_quill', 6]], coins: 500 } } };
const WTYPES = Object.keys(WEAPONS).filter((w) => WEAPONS[w].job);
for (const w of WTYPES) for (const t in WTIER) {
  const T = WTIER[t], magic = WEAPONS[w].job === 'mage';
  GEAR[t + '_' + w] = { name: T.name + ' ' + WEAPONS[w].name, slot: 'weapon', lv: T.lv, wtype: w, job: WEAPONS[w].job, tier: t, base: magic ? { matk: T.add } : { atk: T.add }, price: T.price || 0, from: T.from, forge: T.forge, gem: T.color };
}
STAT.matk = { name: 'Magic', roll: (lv) => 1 + lv * 0.5 };
// gear can lie on the ground as a bundle (drops); the bag never holds it, it goes to the gear bag
for (const id in GEAR) ITEMS['g_' + id] = { name: GEAR[id].name, kind: 'gear', rarity: 'rare', sell: 0, icon: 'gear', gear: id, color: gearColor(id), desc: '' };
function gearColor(id) {
  const g = GEAR[id], L = RW.GEAR_LOOKS[g.look];
  if (g.gem) return g.gem;
  if (!L) return '#a8774f';
  if (L.vest) return L.vest; if (L.boot) return L.boot;
  return '#' + new THREE.Color(L.base || 0xf6a8c4).getHexString();
}

// ---------- the hero's gear ----------
const MAXDUR = 100, WARN = 15;
let uidN = Date.now() % 100000;
function ensure(P) {
  if (!P) return;
  if (!P.gear || typeof P.gear !== 'object') P.gear = {};
  for (const s of SLOTS) if (P.gear[s] && !GEAR[P.gear[s].id]) P.gear[s] = null;
  if (!Array.isArray(P.gearBag)) P.gearBag = [];
  P.gearBag = P.gearBag.filter((g) => g && GEAR[g.id]);
}
function rollRarity(forge) {
  const luck = Math.max(1, G.D ? G.D.luck : 1);
  const r = 1 - (1 - Math.random()) / luck; // luck pushes the roll toward the rarer end
  const t = forge ? [0.4, 0.75, 0.93, 0.99] : [0.55, 0.83, 0.95, 0.993];
  return r < t[0] ? 0 : r < t[1] ? 1 : r < t[2] ? 2 : r < t[3] ? 3 : 4;
}
function make(id, r) {
  const g = GEAR[id], inst = { u: ++uidN, id, r: r || 0, plus: 0, dur: MAXDUR, bon: [] };
  const keys = Object.keys(STAT).filter((k) => k !== 'matk');
  for (let i = 0; i < inst.r; i++) { const k = pick(keys); const v = STAT[k].roll(g.lv) * rnd(0.6, 1); inst.bon.push([k, STAT[k].pct ? Math.round(v * 1000) / 1000 : Math.max(1, Math.round(v))]); }
  return inst;
}
const plusMult = (inst) => 1 + 0.12 * inst.plus;
// every stat an item gives (main stats grow with +N, random bonuses stay)
function itemStats(inst) {
  const g = GEAR[inst.id], out = {}, m = plusMult(inst);
  // each + adds 12% of the main stats, plus a flat +1 attack (weapons) or +0.5 defense (armor)
  for (const k in g.base) out[k] = g.base[k] * m + (k === 'atk' || k === 'matk' ? inst.plus : k === 'def' ? inst.plus * 0.5 : 0);
  for (const [k, v] of inst.bon) out[k] = (out[k] || 0) + v;
  for (const k of ['hp', 'mp']) if (out[k]) out[k] = Math.round(out[k]);
  return out;
}
const canWearWhy = (P, inst) => {
  const g = GEAR[inst.id];
  if (P.lv < g.lv) return 'Needs Lv. ' + g.lv + '.';
  if (g.slot === 'weapon') {
    if (!P.job || P.job === 'novice') return 'Only for a ' + JOBS[g.job].name + '. Novices keep their wooden stick.';
    if (g.wtype !== P.weapon) return 'Only for heroes who use the ' + WEAPONS[g.wtype].name + '.';
  }
  return '';
};
function setCounts(P) {
  const c = {};
  for (const s of ['head', 'body', 'feet']) { const it = P.gear[s]; if (it && it.dur > 0 && GEAR[it.id].set) c[GEAR[it.id].set] = (c[GEAR[it.id].set] || 0) + 1; }
  return c;
}
// called from derive() in data.js: adds the gear's stats to the hero's numbers
RW.gearApply = function (d, P, job) {
  if (!P || !P.gear) return;
  ensure(P);
  const add = (st) => {
    for (const k in st) {
      const v = st[k];
      if (k === 'atk') { d.atk += v; if (job === 'mage') d.matk += v; }
      else if (k === 'matk') d.matk += v;
      else if (k === 'def') d.def += v; else if (k === 'hp') d.maxHp += Math.round(v); else if (k === 'mp') d.maxMp += Math.round(v);
      else if (k === 'crit') d.crit += v; else if (k === 'dodge') d.dodge += v; else if (k === 'speed') d.speed *= 1 + v; else if (k === 'luck') d.luck += v;
    }
  };
  for (const s of SLOTS) {
    const it = P.gear[s]; if (!it || it.dur <= 0) continue;
    const g = GEAR[it.id];
    if (g.slot === 'weapon' && (job !== g.job || d.weapon !== g.wtype)) continue; // a borrowed weapon at a master: your own does not count
    add(itemStats(it));
  }
  const sc = setCounts(P);
  for (const id in sc) { if (sc[id] >= 2) add(SETS[id].two); if (sc[id] >= 3) add(SETS[id].three); }
};
// what the hero model wears
function looks(P) {
  if (!P || !P.gear) return null;
  ensure(P);
  const o = {}, G0 = P.gear;
  for (const s of ['head', 'body', 'feet']) if (G0[s] && GEAR[G0[s].id].look) o[s] = GEAR[G0[s].id].look;
  if (G0.neck) o.neck = new THREE.Color(RAR[G0.neck.r].color).getHex();
  if (G0.ring) o.ring = new THREE.Color(RAR[G0.ring.r].color).getHex();
  if (G0.weapon) o.plus = G0.weapon.plus;
  return o;
}

// ---------- equip, wear and drops ----------
function changed(P) { G.refreshHero(); G.dirty = true; if (UI.isOpen('gearPanel')) render(); syncBadge(); }
function equip(u) {
  const P = G.p; ensure(P);
  const i = P.gearBag.findIndex((g) => g.u === u); if (i < 0) return;
  const inst = P.gearBag[i], why = canWearWhy(P, inst);
  if (why) { G.deny(why); return; }
  const s = GEAR[inst.id].slot;
  P.gearBag.splice(i, 1);
  if (P.gear[s]) P.gearBag.unshift(P.gear[s]);
  P.gear[s] = inst; sfx.buy(); G.spawnRing(G.player.pos, 0xfff1a8, 1.6, 0.5);
  changed(P); RW.emit('equip', inst.id);
}
function unequip(s) {
  const P = G.p; if (!P.gear[s]) return;
  P.gearBag.unshift(P.gear[s]); P.gear[s] = null; sfx.click(); changed(P);
}
function giveGear(id, r) {
  const P = G.p; ensure(P);
  const inst = make(id, r);
  P.gearBag.unshift(inst); G.dirty = true; syncBadge();
  return inst;
}
const rarTag = (inst) => '<b style="color:' + RAR[inst.r].ink + '">' + RAR[inst.r].name + '</b>';
const instName = (inst) => GEAR[inst.id].name + (inst.plus ? ' +' + inst.plus : '');
// a gear bundle picked up from the ground
function pickup(itemId) {
  const id = ITEMS[itemId].gear, inst = giveGear(id, rollRarity(false));
  if (inst.r >= 2) sfx.level(); else sfx.pick();
  UI.toast(rarTag(inst) + ' ' + esc(GEAR[id].name) + ' <small>(press G to wear it)</small>', inst.r >= 2);
  RW.emit('gearDrop', id);
}
function drops(m) {
  if (!m.k || m.k.target) return;
  const P = G.p, luck = G.D ? G.D.luck : 1, gold = m.golden;
  const set = DROP_SET[m.kind];
  if (set && Math.random() < (gold ? 0.4 : 0.025) * luck) G.dropItem('g_' + pick(set), 1, m.pos, 1.3);
  const area = m.k.area, acc = Object.keys(GEAR).filter((id) => GEAR[id].area === area && GEAR[id].from === 'drop');
  if (acc.length && Math.random() < (gold ? 0.25 : 0.008) * luck) G.dropItem('g_' + pick(acc), 1, m.pos, 1.3);
  if (m.lv >= 3 && Math.random() < (gold ? 0.2 : 0.012) * luck) {
    const own = P.job && P.job !== 'novice' && Math.random() < 0.75 ? P.weapon : pick(WTYPES);
    G.dropItem('g_tusk_' + own, 1, m.pos, 1.3);
  }
}
// wear: the weapon on every hit, everything else when you get hurt (about 2-3 hours of fighting)
function wear(slots, amt) {
  const P = G.p; if (!P || !P.gear) return;
  let broke = false;
  for (const s of slots) {
    const it = P.gear[s]; if (!it || it.dur <= 0) continue;
    const before = it.dur; it.dur = Math.max(0, it.dur - amt);
    if (before > WARN && it.dur <= WARN) { UI.toast('Your ' + esc(instName(it)) + ' is almost worn out. Bolt can repair it.'); sfx.deny(); }
    if (it.dur <= 0) { broke = true; UI.toast('<b>' + esc(instName(it)) + ' is worn out!</b> Its bonuses stop until Bolt repairs it.', true); }
  }
  if (broke) { G.rederive(); syncBadge(); if (UI.isOpen('gearPanel')) render(); }
  G.dirty = true;
}
RW.on('hit', () => wear(['weapon'], 0.014));
RW.on('hurt', () => wear(['head', 'body', 'feet', 'neck', 'ring'], 0.033));
// the gear button shows "!" when something is close to breaking
function syncBadge() {
  const P = G.p, b = $('gearBadge'); if (!b || !P) return;
  ensure(P);
  b.hidden = !SLOTS.some((s) => P.gear[s] && P.gear[s].dur <= WARN);
}

// ---------- Bolt's smithy ----------
const L = (face, text) => ({ who: 'bolt', face, text });
const bye = () => { UI.hideDialog(); G.endTalk(); };
function talk(n) {
  if (n.id !== 'bolt' || !G.p) return false;
  if (RW.story && RW.story.pending && RW.story.pending('bolt')) return false;
  if (RW.jobs && RW.jobs.trial) return false;
  const P = G.p; ensure(P);
  const worn = SLOTS.some((s) => P.gear[s] && P.gear[s].dur < MAXDUR);
  const text = worn ? 'Hmm, your gear has seen some fights. I can fix that. Or make something new, if you brought monster bits!' : pick(['Clang, clang! Need a hat? A ring? Something sharp? Bolt\'s forge has it all.', 'Bring me monster bits and coins, kid, and I will forge you something nice.', 'Want your gear stronger? I can push it all the way to +10. Mostly. Sometimes it slips.']);
  UI.say([L(worn ? 'normal' : 'happy', text)], [
    { label: 'Smithy', run: () => { UI.hideDialog(); openSmith('shop'); } },
    { label: 'Robot job', soft: true, run: () => { UI.hideDialog(); if (RW.jobs) RW.jobs.talk(n); } },
    { label: 'Goodbye', soft: true, run: bye }
  ]);
  return true;
}
let smithTab = 'shop', smithSel = null;
function openSmith(tab) { smithTab = tab || smithTab; smithSel = null; UI.open('smithPanel'); }
const coin = () => '<img src="' + RW.iconURL('coin', 32) + '" alt="">';
const matsHTML = (mats) => mats.map(([id, n]) => { const have = G.bagCount(id); return '<span class="mat' + (have < n ? ' short' : '') + '"><img src="' + RW.iconURL(id) + '" alt="">' + esc(ITEMS[id].name) + ' ' + have + '/' + n + '</span>'; }).join('');
const hasMats = (mats) => mats.every(([id, n]) => G.bagCount(id) >= n);
function repairCost(inst) { const g = GEAR[inst.id]; return Math.ceil((MAXDUR - inst.dur) / MAXDUR * (10 + g.lv * 6) * (1 + inst.plus * 0.15)); }
const ENH_CHANCE = [1, 1, 0.95, 0.9, 0.8, 0.7, 0.6, 0.45, 0.35, 0.25, 0.15]; // chance to reach +N
function enhMats(to) { return to <= 3 ? [['leaf_jelly', 3]] : to <= 6 ? [['boar_bristle', 3]] : to <= 9 ? [['thorn_quill', 3], ['golden_leaf', 1]] : [['forest_amber', 1], ['little_tusk', 1]]; }
const enhCoins = (inst) => Math.round((20 + GEAR[inst.id].lv * 10) * (inst.plus + 1));
function allGear(P) { const a = []; for (const s of SLOTS) if (P.gear[s]) a.push([P.gear[s], true]); for (const g of P.gearBag) a.push([g, false]); return a; }
function findInst(P, u) { for (const s of SLOTS) if (P.gear[s] && P.gear[s].u === u) return P.gear[s]; return P.gearBag.find((g) => g.u === u); }

function renderSmith() {
  const P = G.p; ensure(P);
  const body = $('smithBody');
  document.querySelectorAll('#smithTabs .tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === smithTab)));
  let h = '';
  if (smithTab === 'shop') {
    const ids = ['clothcap', 'paddedvest', 'sturdyboots', 'cordneck', 'copperring'];
    if (P.job && P.job !== 'novice') ids.unshift('iron_' + P.weapon);
    for (const id of ids) {
      const g = GEAR[id];
      h += '<div class="srow2"><img src="' + RW.iconURL('g_' + id) + '" alt=""><div class="nm">' + esc(g.name) + '<small>' + SLOT_NAME[g.slot] + ' · Lv. ' + g.lv + ' · ' + Object.entries(g.base).map(([k, v]) => statTxt(k, v)).join(', ') + '</small><span class="price">' + coin() + g.price + '</span></div>' +
        '<div class="acts"><button class="btn small" data-buy="' + id + '"' + (P.coins < g.price ? ' disabled' : '') + '>Buy</button></div></div>';
    }
    if (!P.job || P.job === 'novice') h += '<p class="note">Job weapons come in once you have a job at Lv. 10. Until then, your wooden stick does the job.</p>';
  } else if (smithTab === 'forge') {
    const ids = Object.keys(GEAR).filter((id) => GEAR[id].from === 'forge' && (GEAR[id].slot !== 'weapon' || (P.job !== 'novice' && GEAR[id].wtype === P.weapon)));
    for (const id of ids) {
      const g = GEAR[id], f = g.forge, ok = hasMats(f.mats) && P.coins >= f.coins;
      h += '<div class="srow2 forge"><img src="' + RW.iconURL('g_' + id) + '" alt=""><div class="nm">' + esc(g.name) + (g.set ? ' <span class="settag">Set ' + esc(SETS[g.set].name) + '</span>' : '') + '<small>' + SLOT_NAME[g.slot] + ' · Lv. ' + g.lv + ' · ' + Object.entries(g.base).map(([k, v]) => statTxt(k, v)).join(', ') + '</small><div class="mats">' + matsHTML(f.mats) + '<span class="price">' + coin() + f.coins + '</span></div></div>' +
        '<div class="acts"><button class="btn small" data-forge="' + id + '"' + (ok ? '' : ' disabled') + '>Forge</button></div></div>';
    }
    h += '<p class="note">Forged gear comes out with a random rarity: the rarer it is, the more bonus stats it has.</p>';
  } else if (smithTab === 'repair') {
    const list = allGear(P).filter(([g]) => g.dur < MAXDUR);
    let total = 0;
    for (const [g, on] of list) {
      const c = repairCost(g); total += c;
      h += '<div class="srow2"><img src="' + RW.iconURL('g_' + g.id) + '" alt=""><div class="nm">' + esc(instName(g)) + (on ? ' <span class="settag">wearing</span>' : '') + '<small>' + durBar(g) + '</small><span class="price">' + coin() + c + '</span></div>' +
        '<div class="acts"><button class="btn small" data-repair="' + g.u + '"' + (P.coins < c ? ' disabled' : '') + '>Repair</button></div></div>';
    }
    if (!list.length) h = '<p class="empty-note">Everything is in great shape. Come back after some fights!</p>';
    else h = '<div class="irow"><button class="btn small" data-repairall="1"' + (P.coins < total ? ' disabled' : '') + '>Repair all · ' + total + ' coins</button></div>' + h;
  } else {
    const list = allGear(P);
    if (!list.length) h = '<p class="empty-note">You have no gear to make stronger yet.</p>';
    if (smithSel && !findInst(P, smithSel)) smithSel = null;
    if (!smithSel && list.length) smithSel = list[0][0].u;
    const sel = smithSel ? findInst(P, smithSel) : null;
    if (sel) {
      const to = sel.plus + 1, max = sel.plus >= 10;
      const mats = enhMats(to), coins = enhCoins(sel), ok = !max && hasMats(mats) && P.coins >= coins;
      const now = itemStats(sel), next = itemStats(Object.assign({}, sel, { plus: to }));
      h += '<div class="enh"><img src="' + RW.iconURL('g_' + sel.id) + '" alt=""><div class="enh-in"><div class="iname">' + esc(instName(sel)) + ' ' + (max ? '' : '→ +' + to) + '</div>' +
        (max ? '<p class="note">This is as strong as it gets. +10!</p>' :
          '<div class="enh-stats">' + Object.keys(GEAR[sel.id].base).map((k) => '<span>' + STAT[k].name + ' ' + fmt(k, now[k]) + ' → <b>' + fmt(k, next[k]) + '</b></span>').join('') + '</div>' +
          '<div class="mats">' + matsHTML(mats) + '<span class="price">' + coin() + coins + '</span></div>' +
          '<div class="enh-chance">Success: <b>' + Math.round(ENH_CHANCE[to] * 100) + '%</b>' + (sel.plus >= 6 ? (G.bagCount('light_charm') > 0 ? ' · if it fails, your Light Charm (' + G.bagCount('light_charm') + ') keeps it +' + sel.plus : ' · if it fails, it drops to +' + (sel.plus - 1) + ' (a Light Charm stops that)') : ' · if it fails, it stays +' + sel.plus) + '. Coins and materials are used either way.</div>' +
          '<button class="btn" data-enh="' + sel.u + '"' + (ok ? '' : ' disabled') + '>Make it +' + to + '!</button>') + '</div></div>';
    }
    h += '<div class="gpick">' + list.map(([g, on]) => '<button class="gslot r' + g.r + '" data-sel="' + g.u + '" aria-pressed="' + (g.u === smithSel) + '" aria-label="' + esc(instName(g)) + '"><img src="' + RW.iconURL('g_' + g.id) + '" alt="">' + (g.plus ? '<span class="pl">+' + g.plus + '</span>' : '') + (on ? '<span class="on">✓</span>' : '') + '</button>').join('') + '</div>';
  }
  body.innerHTML = h;
  UI.syncCoins();
  body.querySelectorAll('[data-buy]').forEach((b) => b.addEventListener('click', () => { const g = GEAR[b.dataset.buy]; if (P.coins < g.price) return; P.coins -= g.price; giveGear(b.dataset.buy, 0); sfx.buy(); UI.toast('Bought ' + esc(g.name) + '. Press G to wear it.'); G.save(); renderSmith(); }));
  body.querySelectorAll('[data-forge]').forEach((b) => b.addEventListener('click', () => forge(b.dataset.forge)));
  body.querySelectorAll('[data-repair]').forEach((b) => b.addEventListener('click', () => repair([findInst(P, Number(b.dataset.repair))])));
  body.querySelectorAll('[data-repairall]').forEach((b) => b.addEventListener('click', () => repair(allGear(P).map(([g]) => g).filter((g) => g.dur < MAXDUR))));
  body.querySelectorAll('[data-sel]').forEach((b) => b.addEventListener('click', () => { smithSel = Number(b.dataset.sel); sfx.click(); renderSmith(); }));
  body.querySelectorAll('[data-enh]').forEach((b) => b.addEventListener('click', () => enhance(Number(b.dataset.enh))));
}
const fmt = (k, v) => STAT[k].pct ? (Math.round(v * 1000) / 10) + '%' : num(v);
function durBar(g) { const p = Math.round(g.dur / MAXDUR * 100); return '<span class="dur"><i style="width:' + p + '%" class="' + (g.dur <= WARN ? 'low' : '') + '"></i></span> ' + p + '%' + (g.dur <= 0 ? ' · <b class="bad">worn out</b>' : g.dur <= WARN ? ' · <b class="bad">almost worn out</b>' : ''); }
function forge(id) {
  const P = G.p, g = GEAR[id], f = g.forge;
  if (!hasMats(f.mats) || P.coins < f.coins) return;
  for (const [m, n] of f.mats) G.bagTake(m, n);
  P.coins -= f.coins;
  const inst = giveGear(id, rollRarity(true));
  sfx.heavy(); setTimeout(() => sfx.level(), 350);
  UI.toast('Bolt forged ' + rarTag(inst) + ' ' + esc(g.name) + '!', true);
  RW.emit('forge', id); G.save(); renderSmith();
}
function repair(list) {
  const P = G.p; let cost = 0; for (const g of list) cost += repairCost(g);
  if (!list.length || P.coins < cost) return;
  P.coins -= cost; for (const g of list) g.dur = MAXDUR;
  sfx.heavy(); UI.toast('Bolt fixed ' + (list.length > 1 ? list.length + ' items' : esc(instName(list[0]))) + ' for ' + cost + ' coins. Good as new!');
  G.rederive(); syncBadge(); G.save(); renderSmith();
}
let enhBusy = false;
function enhance(u) {
  const P = G.p, inst = findInst(P, u); if (!inst || inst.plus >= 10 || enhBusy) return;
  const to = inst.plus + 1, mats = enhMats(to), coins = enhCoins(inst);
  if (!hasMats(mats) || P.coins < coins) return;
  for (const [m, n] of mats) G.bagTake(m, n);
  P.coins -= coins; enhBusy = true;
  const btn = document.querySelector('[data-enh]'); if (btn) { btn.disabled = true; btn.textContent = 'Clang… clang… clang…'; }
  sfx.heavy(); setTimeout(() => sfx.heavy(), 300); setTimeout(() => sfx.heavy(), 600);
  setTimeout(() => {
    enhBusy = false;
    if (Math.random() < ENH_CHANCE[to]) { inst.plus = to; sfx.level(); UI.toast('<b>Success!</b> ' + esc(instName(inst)), true); RW.emit('enhance', to); }
    else if (inst.plus >= 6 && G.bagCount('light_charm') > 0) { G.bagTake('light_charm', 1); sfx.deny(); UI.toast('<b>It slipped!</b> But your <b>Light Charm</b> glowed and kept it at +' + inst.plus + '.', true); }
    else if (inst.plus >= 6) { inst.plus -= 1; sfx.deny(); UI.toast('<b>It slipped!</b> ' + esc(GEAR[inst.id].name) + ' dropped to +' + inst.plus + '.', true); }
    else { sfx.deny(); UI.toast('<b>It slipped!</b> ' + esc(GEAR[inst.id].name) + ' stays +' + inst.plus + '.', true); }
    G.save(); changed(P); if (UI.isOpen('smithPanel')) renderSmith();
  }, 1000);
}
document.querySelectorAll('#smithTabs .tab').forEach((t) => t.addEventListener('click', () => { smithTab = t.dataset.tab; smithSel = null; sfx.click(); renderSmith(); }));

// ---------- Mira buys old gear ----------
const sellPrice = (inst) => Math.round((5 + GEAR[inst.id].lv * 5) * (1 + inst.r * 0.7) * (1 + inst.plus * 0.2));
function sellRows() {
  const P = G.p; ensure(P);
  return P.gearBag.map((g) => '<div class="srow2"><img src="' + RW.iconURL('g_' + g.id) + '" alt=""><div class="nm">' + esc(instName(g)) + '<small>' + rarTag(g) + ' · ' + SLOT_NAME[GEAR[g.id].slot] + '</small><span class="price">' + coin() + sellPrice(g) + '</span></div><div class="acts"><button class="btn small" data-gsell="' + g.u + '">Sell</button></div></div>').join('');
}
function sell(u) {
  const P = G.p, i = P.gearBag.findIndex((g) => g.u === u); if (i < 0) return;
  const g = P.gearBag[i], c = sellPrice(g); P.gearBag.splice(i, 1); P.coins += c;
  sfx.coin(); UI.toast('Sold ' + esc(instName(g)) + ' for ' + c + ' coins'); G.save();
}

// ---------- the equipment window: the hero turns in the middle, slots on both sides ----------
const DW = 300, DH = 360;
const dScene = new THREE.Scene();
dScene.add(new THREE.HemisphereLight(0xfff3dc, 0xb3a184, 0.74));
const dSun = new THREE.DirectionalLight(0xfff0d4, 0.55); dSun.position.set(-40, 80, 40); dScene.add(dSun);
const dGround = new THREE.Mesh(new THREE.CircleGeometry(1.1, 36), new THREE.MeshLambertMaterial({ color: 0x9cc46a })); dGround.rotation.x = -Math.PI / 2; dScene.add(dGround);
const dCam = new THREE.PerspectiveCamera(26, DW / DH, 0.05, 50);
let dRT = null, doll = null, dollKey = '', yaw = -0.4, spin = 0.4, dragX = null, raf = 0, lastT = 0;
const dCanvas = $('gearDoll'), dCtx = dCanvas.getContext('2d');
function buildDoll() {
  const P = G.p, key = JSON.stringify([P.look, P.job, P.weapon, looks(P)]);
  if (key === dollKey && doll) return;
  if (doll) dScene.remove(doll.root);
  doll = RW.chibi(RW.lookOpts(P.look, P.job, P.weapon, looks(P))); dScene.add(doll.root); dollKey = key;
}
function drawDoll() {
  if (!doll) return;
  if (!dRT) dRT = new THREE.WebGLRenderTarget(DW * 2, DH * 2);
  doll.root.rotation.y = yaw;
  dCam.position.set(0, 1.0 + 4.2 * 0.18, 4.2); dCam.lookAt(0, 0.88, 0); dCam.updateProjectionMatrix();
  const prev = renderer.getClearColor(new THREE.Color()), pa = renderer.getClearAlpha();
  renderer.setClearColor(0xe9dcc0, 1); renderer.setRenderTarget(dRT); renderer.clear(); renderer.render(dScene, dCam);
  const N = DW * 2, M = DH * 2, buf = new Uint8Array(N * M * 4);
  renderer.readRenderTargetPixels(dRT, 0, 0, N, M, buf); renderer.setRenderTarget(null); renderer.setClearColor(prev, pa);
  const img = dCtx.createImageData(N, M);
  for (let y = 0; y < M; y++) img.data.set(buf.subarray((M - 1 - y) * N * 4, (M - y) * N * 4), y * N * 4);
  dCtx.putImageData(img, 0, 0);
}
function loop(t) {
  if (!UI.isOpen('gearPanel')) { raf = 0; return; }
  raf = requestAnimationFrame(loop);
  if (t - lastT < 33) return;
  const dt = Math.min(0.1, (t - lastT) / 1000); lastT = t;
  if (dragX == null) yaw += spin * dt;
  drawDoll();
}
dCanvas.addEventListener('pointerdown', (e) => { dragX = e.clientX; dCanvas.setPointerCapture(e.pointerId); });
dCanvas.addEventListener('pointermove', (e) => { if (dragX == null) return; yaw += (e.clientX - dragX) * 0.012; dragX = e.clientX; });
const endDrag = () => { dragX = null; };
dCanvas.addEventListener('pointerup', endDrag); dCanvas.addEventListener('pointercancel', endDrag);

let gearSel = null; // the item picked in the gear bag (u), or a worn slot name
function slotHTML(s) {
  const it = G.p.gear[s];
  // v1.4: with no forged weapon, the slot shows the hero's own weapon (the Wooden Stick for a novice)
  if (!it && s === 'weapon') { const wb = WEAPONS[G.weaponNow()] || WEAPONS.stick; return '<button class="eslot" data-slot="' + s + '"><img class="eicon" src="' + RW.iconURL('bolt_hammer') + '" alt=""><span class="einfo"><b>' + esc(wb.name) + '</b><small>Basic weapon · Atk ' + (wb.atk || wb.matk || 0) + (G.p.job === 'novice' || !G.p.job ? ' · pick a job at Lv. 10 for better weapons' : '') + '</small></span></button>'; }
  if (!it) return '<button class="eslot empty" data-slot="' + s + '"><span class="eicon">' + SLOT_NAME[s] + '</span><span class="einfo"><b>' + SLOT_NAME[s] + '</b><small>Empty</small></span></button>';
  const g = GEAR[it.id];
  return '<button class="eslot r' + it.r + (gearSel === s ? ' sel' : '') + '" data-slot="' + s + '" aria-pressed="' + (gearSel === s) + '"><img class="eicon" src="' + RW.iconURL('g_' + it.id) + '" alt=""><span class="einfo"><b>' + esc(instName(it)) + '</b><small style="color:' + RAR[it.r].ink + '">' + RAR[it.r].name + (g.set ? ' · Set ' + esc(SETS[g.set].name) : '') + '</small>' + durBar(it) + '</span></button>';
}
// what changes if you swap: the piece you wear now next to the one you picked
function compareHTML(inst) {
  const g = GEAR[inst.id], cur = G.p.gear[g.slot], a = cur ? itemStats(cur) : {}, b = itemStats(inst);
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  const val = (k, v) => !v ? '–' : STAT[k].pct ? Math.round(v * 1000) / 10 + '%' : num(v);
  let h = '<div class="gcmp"><div class="gcmp-h"><span>Compare</span><span>' + (cur ? 'Worn' : 'Worn: none') + '</span><span>Picked</span><span></span></div>';
  for (const k of keys) {
    const x = a[k] || 0, y = b[k] || 0, d = y - x, eq = Math.abs(d) < 1e-6;
    h += '<div class="gcmp-r"><span>' + STAT[k].name + '</span><span>' + val(k, x) + '</span><span>' + val(k, y) + '</span><span class="' + (eq ? '' : d > 0 ? 'up' : 'dn') + '">' + (eq ? '=' : (d > 0 ? '▲ ' : '▼ ') + val(k, Math.abs(d))) + '</span></div>';
  }
  if (cur) h += '<div class="gcmp-n">Now wearing: ' + esc(instName(cur)) + '</div>';
  return h + '</div>';
}
function detailHTML(inst, worn) {
  const g = GEAR[inst.id], st = itemStats(inst), why = canWearWhy(G.p, inst);
  let h = '<div class="idet-top"><img src="' + RW.iconURL('g_' + inst.id) + '" alt="" style="border-color:' + RAR[inst.r].color + '"><div><div class="iname">' + esc(instName(inst)) + '</div><div class="irar" style="color:' + RAR[inst.r].ink + '">' + RAR[inst.r].name + ' · ' + SLOT_NAME[g.slot] + ' · Lv. ' + g.lv + (g.slot === 'weapon' ? ' · ' + JOBS[g.job].name : '') + '</div></div></div>';
  h += '<div class="gstats">' + Object.keys(g.base).map((k) => '<span>' + statTxt(k, st[k] - inst.bon.filter((b) => b[0] === k).reduce((a, b) => a + b[1], 0)) + '</span>').join('') + inst.bon.map(([k, v]) => '<span class="bon">' + statTxt(k, v) + '</span>').join('') + '</div>';
  if (g.set) { const S = SETS[g.set]; h += '<div class="ival">Set ' + esc(S.name) + ': 2 pieces ' + Object.entries(S.two).map(([k, v]) => statTxt(k, v)).join(', ') + ' · 3 pieces ' + Object.entries(S.three).map(([k, v]) => statTxt(k, v)).join(', ') + '</div>'; }
  h += '<div class="ival">' + durBar(inst) + '</div>';
  if (!worn) h += compareHTML(inst);
  if (worn) h +='<div class="irow"><button class="btn small soft" data-unequip="' + g.slot + '">Take off</button></div>';
  else h += (why ? '<p class="note bad">' + esc(why) + '</p>' : '') + '<div class="irow"><button class="btn small" data-equip="' + inst.u + '"' + (why ? ' disabled' : '') + '>Wear</button></div>';
  return h;
}
// each stat as: basic value (without gear) + what the worn gear adds in green; used here and in the Stats & Skills window
function statRows(more) {
  const P = G.p, D = G.D;
  const B = RW.derive(Object.assign({}, P, { gear: null }), G.jobNow(), G.weaponNow());
  const pct = (v) => (v * 100).toFixed(1) + '%', num = (v) => String(Math.round(v)), x2 = (v) => v.toFixed(2);
  const row = (name, k, f, pre) => { const g = D[k] - B[k], gs = f(Math.abs(g)), on = Math.abs(g) > 1e-6 && !/^0(\.0+)?%?$/.test(gs);
    return '<div class="drow"><span>' + name + '</span><span>' + (pre || '') + f(B[k]) + (on ? ' <b class="gplus' + (g < 0 ? ' neg' : '') + '">' + (g > 0 ? '+' : '−') + gs + '</b>' : '') + '</span></div>'; };
  const out = [row('Attack', 'atk', num), D.job === 'mage' ? row('Magic', 'matk', num) : '', row('Defense', 'def', num), row('Max HP', 'maxHp', num), row('Max MP', 'maxMp', num), row('Critical', 'crit', pct), row('Dodge', 'dodge', pct), row('Attack speed', 'speed', x2, '×')];
  if (more) { out.push(row('Rare drops', 'luck', x2, '×')); if (D.range) out.push('<div class="drow"><span>Range</span><span>' + D.range + ' m</span></div>'); }
  return out.join('');
}
RW.gearStatRows = statRows;
function render() {
  const P = G.p; ensure(P);
  const D = G.D;
  $('gearLeft').innerHTML = ['head', 'body', 'feet'].map(slotHTML).join('');
  $('gearRight').innerHTML = ['weapon', 'neck', 'ring'].map(slotHTML).join('');
  // stats and sets
  const sc = setCounts(P), allSets = {};
  for (const s of ['head', 'body', 'feet']) if (P.gear[s] && GEAR[P.gear[s].id].set) allSets[GEAR[P.gear[s].id].set] = true;
  const pct = (v) => (v * 100).toFixed(1) + '%';
  $('gearStats').innerHTML = '<h3>Stats <small class="gnote">basic <b class="gplus">+gear</b></small></h3>' + statRows(false);
  $('gearSets').innerHTML = '<h3>Set bonus</h3>' + (Object.keys(allSets).length ? Object.keys(allSets).map((id) => { const S = SETS[id], n = sc[id] || 0; return '<div class="setline"><b>Set ' + esc(S.name) + ' ' + n + '/3</b><span class="' + (n >= 2 ? 'on' : '') + '">' + (n >= 2 ? '✓' : '·') + ' 2: ' + Object.entries(S.two).map(([k, v]) => statTxt(k, v)).join(', ') + '</span><span class="' + (n >= 3 ? 'on' : '') + '">' + (n >= 3 ? '✓' : '·') + ' 3: ' + Object.entries(S.three).map(([k, v]) => statTxt(k, v)).join(', ') + '</span></div>'; }).join('') : '<p class="note">Wear 2 or 3 pieces of the same set for extra stats.</p>') +
    (SLOTS.some((s) => P.gear[s] && P.gear[s].dur <= WARN) ? '<p class="note bad">Something is almost worn out. Bolt in Mossbrook can repair it.</p>' : '');
  // the gear bag
  if (typeof gearSel === 'number' && !P.gearBag.some((g) => g.u === gearSel)) gearSel = null;
  if (typeof gearSel === 'string' && !P.gear[gearSel]) gearSel = null;
  const grid = P.gearBag.map((g) => '<button class="gslot r' + g.r + '" data-pick="' + g.u + '" aria-pressed="' + (g.u === gearSel) + '" aria-label="' + esc(instName(g)) + '"><img src="' + RW.iconURL('g_' + g.id) + '" alt="">' + (g.plus ? '<span class="pl">+' + g.plus + '</span>' : '') + (canWearWhy(P, g) ? '<span class="lock">🔒</span>' : '') + '</button>').join('');
  $('gearBagGrid').innerHTML = grid || '<p class="note">No spare gear yet. Monsters drop gear bundles, and Bolt sells and forges more.</p>';
  const sel = typeof gearSel === 'number' ? P.gearBag.find((g) => g.u === gearSel) : typeof gearSel === 'string' ? P.gear[gearSel] : null;
  $('gearDetail').innerHTML = sel ? detailHTML(sel, typeof gearSel === 'string') : '<p class="note">Pick a piece of gear to see it. Click a worn slot to take it off.</p>';
  const body = $('gearPanel');
  body.querySelectorAll('[data-slot]').forEach((b) => b.addEventListener('click', () => { const s = b.dataset.slot; gearSel = G.p.gear[s] ? s : null; sfx.click(); render(); }));
  body.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('click', () => { gearSel = Number(b.dataset.pick); sfx.click(); render(); }));
  body.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('dblclick', () => equip(Number(b.dataset.pick))));
  body.querySelectorAll('[data-equip]').forEach((b) => b.addEventListener('click', () => { const u = Number(b.dataset.equip); const s = GEAR[P.gearBag.find((g) => g.u === u).id].slot; equip(u); if (P.gear[s] && P.gear[s].u === u) gearSel = s; render(); }));
  body.querySelectorAll('[data-unequip]').forEach((b) => b.addEventListener('click', () => { gearSel = null; unequip(b.dataset.unequip); }));
  buildDoll(); drawDoll();
  if (!raf) { lastT = performance.now(); raf = requestAnimationFrame(loop); }
}
$('gearBtn').addEventListener('click', () => { sfx.click(); UI.toggle('gearPanel'); });

// ---------- gear icons (drawn into the item icon canvas by models.js) ----------
RW.gearIcon = function (g, it) {
  const id = it.gear, d = GEAR[id], L = RW.GEAR_LOOKS[d.look] || {}, col = it.color;
  const hex = (n, f) => '#' + new THREE.Color(n == null ? f : n).getHexString();
  g.strokeStyle = '#3b2a1e'; g.lineWidth = 3; g.lineJoin = 'round'; g.lineCap = 'round';
  const e = (x, y, rx, ry, rot) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); g.fill(); g.stroke(); };
  if (d.slot === 'head') {
    const base = L.kind === 'crown' ? '#f6a8c4' : hex(L.base, 0xa8774f);
    if (L.kind === 'crown') { g.fillStyle = '#6fae4a'; e(32, 38, 22, 8); for (let i = 0; i < 5; i++) { g.fillStyle = ['#f6a8c4', '#fff3dc', '#f6d36b', '#c9a8f0', '#f6a8c4'][i]; e(14 + i * 9, 34 - (i % 2) * 4, 6, 6); } }
    else if (L.kind === 'beret') { g.fillStyle = base; e(32, 34, 24, 11); g.fillStyle = hex(L.feather, 0xffffff); e(48, 20, 4, 12, 0.5); }
    else {
      g.fillStyle = base; g.beginPath(); g.moveTo(8, 44); g.quadraticCurveTo(8, 12, 32, 12); g.quadraticCurveTo(56, 12, 56, 44); g.closePath(); g.fill(); g.stroke();
      if (L.kind === 'mush') { g.fillStyle = hex(L.spot); e(22, 26, 5, 4); e(40, 22, 4, 3); e(46, 34, 3.5, 3); }
      if (L.kind === 'boar') { g.fillStyle = '#fff6e4'; e(14, 46, 3, 8, 0.4); e(50, 46, 3, 8, -0.4); g.fillStyle = base; e(18, 14, 5, 7, -0.5); e(46, 14, 5, 7, 0.5); }
      if (L.kind === 'thorn') { g.fillStyle = hex(L.spike); for (const [x, y, a] of [[32, 8, 0], [18, 14, -0.7], [46, 14, 0.7]]) { g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.moveTo(-4, 6); g.lineTo(0, -8); g.lineTo(4, 6); g.closePath(); g.fill(); g.stroke(); g.restore(); } }
      if (L.top === 'sprout') { g.fillStyle = '#7cc85e'; e(26, 8, 7, 3, 0.4); e(38, 8, 7, 3, -0.4); }
      if (L.kind === 'hood') { g.fillStyle = '#9ff5d2'; e(42, 14, 6, 4); }
      g.fillStyle = 'rgba(255,255,255,.45)'; e(22, 22, 4, 6, 0.4);
    }
  } else if (d.slot === 'body') {
    g.fillStyle = L.shirt || '#efe4cc'; g.beginPath(); g.moveTo(20, 10); g.lineTo(44, 10); g.lineTo(56, 22); g.lineTo(48, 28); g.lineTo(46, 54); g.lineTo(18, 54); g.lineTo(16, 28); g.lineTo(8, 22); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = L.vest || col; g.beginPath(); g.moveTo(20, 10); g.lineTo(28, 10); g.lineTo(28, 54); g.lineTo(18, 54); g.lineTo(16, 28); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.moveTo(44, 10); g.lineTo(36, 10); g.lineTo(36, 54); g.lineTo(46, 54); g.lineTo(48, 28); g.closePath(); g.fill(); g.stroke();
    if (L.extra === 'cape' || L.extra === 'cloak') { g.fillStyle = L.vest; e(32, 11, 14, 4); }
  } else if (d.slot === 'feet') {
    g.fillStyle = L.boot || col; g.beginPath(); g.moveTo(18, 10); g.lineTo(36, 10); g.lineTo(36, 38); g.lineTo(54, 42); g.quadraticCurveTo(58, 54, 50, 54); g.lineTo(16, 54); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = hex(L.cuff, 0xc99a6a); g.beginPath(); g.rect(15, 8, 24, 9); g.fill(); g.stroke();
  } else if (d.slot === 'neck') {
    g.strokeStyle = '#c99a3a'; g.lineWidth = 3; g.beginPath(); g.arc(32, 22, 18, 0.2, Math.PI - 0.2); g.stroke(); g.strokeStyle = '#3b2a1e';
    g.fillStyle = col; g.beginPath(); g.moveTo(32, 34); g.lineTo(42, 44); g.lineTo(32, 58); g.lineTo(22, 44); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.6)'; e(29, 42, 2, 3);
  } else if (d.slot === 'ring') {
    g.fillStyle = 'rgba(0,0,0,0)'; g.lineWidth = 7; g.strokeStyle = '#3b2a1e'; g.beginPath(); g.arc(32, 38, 15, 0, Math.PI * 2); g.stroke(); g.lineWidth = 4; g.strokeStyle = '#e3b343'; g.beginPath(); g.arc(32, 38, 15, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 3; g.strokeStyle = '#3b2a1e'; g.fillStyle = col; e(32, 20, 9, 8);
    g.fillStyle = 'rgba(255,255,255,.65)'; e(29, 18, 2.5, 2);
  } else {
    // weapons, coloured by their kind (iron, tusk, amber)
    const w = d.wtype, mc = col;
    const blade = (x, y, a) => { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = mc; g.beginPath(); g.moveTo(-5, 10); g.lineTo(-5, -20); g.lineTo(0, -28); g.lineTo(5, -20); g.lineTo(5, 10); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#e3b343'; g.beginPath(); g.rect(-11, 10, 22, 5); g.fill(); g.stroke(); g.fillStyle = '#6b4a30'; g.beginPath(); g.rect(-3, 15, 6, 10); g.fill(); g.stroke(); g.restore(); };
    if (w === 'swordShield') { blade(40, 30, 0.6); g.fillStyle = '#a8774f'; e(22, 38, 14, 16); g.fillStyle = mc; e(22, 38, 5, 5); }
    else if (w === 'dualSwords') { blade(24, 32, -0.5); blade(40, 32, 0.5); }
    else if (w === 'bow') { g.lineWidth = 5; g.strokeStyle = '#3b2a1e'; g.beginPath(); g.arc(18, 32, 24, -1.1, 1.1); g.stroke(); g.lineWidth = 3; g.strokeStyle = mc; g.beginPath(); g.arc(18, 32, 24, -1.1, 1.1); g.stroke(); g.strokeStyle = '#3b2a1e'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(28, 11); g.lineTo(28, 53); g.stroke(); }
    else if (w === 'slingshot') { g.fillStyle = mc; g.beginPath(); g.moveTo(29, 56); g.lineTo(29, 34); g.lineTo(16, 12); g.lineTo(22, 10); g.lineTo(32, 28); g.lineTo(42, 10); g.lineTo(48, 12); g.lineTo(35, 34); g.lineTo(35, 56); g.closePath(); g.fill(); g.stroke(); }
    else if (w === 'staff' || w === 'book') {
      if (w === 'staff') { g.fillStyle = '#6b4a30'; g.save(); g.translate(32, 34); g.rotate(0.5); g.beginPath(); g.rect(-3, -16, 6, 40); g.fill(); g.stroke(); g.restore(); g.fillStyle = mc; e(40, 16, 9, 9); }
      else { g.fillStyle = mc; g.beginPath(); g.rect(14, 12, 36, 42); g.fill(); g.stroke(); g.fillStyle = '#fbf1dc'; g.beginPath(); g.rect(20, 16, 26, 34); g.fill(); g.stroke(); g.fillStyle = '#ffd36b'; e(33, 32, 5, 5); }
    } else { g.fillStyle = mc; g.beginPath(); g.rect(12, 22, 36, 18); g.fill(); g.stroke(); g.fillStyle = '#5a6470'; g.beginPath(); g.rect(46, 26, 8, 10); g.fill(); g.stroke(); g.fillStyle = w === 'laserCannon' ? '#9ff0ff' : '#e8604c'; e(56, 31, 4, 4); }
  }
};

RW.gear = { GEAR, SETS, RAR, SLOTS, ensure, looks, drops, pickup, talk, equip, unequip, giveGear, render, renderSmith, openSmith, sellRows, sell, syncBadge, make, itemStats, canWearWhy };
})();
