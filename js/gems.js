// Russel World v1.5: Rubies and Forge Crystals, the stones Bolt uses to forge and strengthen gear.
(function () {
'use strict';
const RW = window.RW;
if (!RW || RW.failed || !RW.gear || !RW.KINDS) return;
const { ITEMS, KINDS } = RW;
Object.assign(ITEMS, {
  forge_crystal: { name: 'Forge Crystal', kind: 'material', rarity: 'common', sell: 20, icon: 'gem', color: '#9fd8ff', desc: 'A clear blue crystal. Bolt uses one to make gear stronger, from +1 up to +6.' },
  ruby: { name: 'Ruby', kind: 'material', rarity: 'rare', sell: 180, icon: 'gem', color: '#e8304a', desc: 'A deep red gem. Bolt uses one to push gear from +7 up to +10.' }
});
// user's choice: forging new gear needs only monster materials and coins; the stones are for enhancing
// (+1..+6 one Forge Crystal each, +7..+10 one Ruby each, see enhMats in gear.js)
// where they come from (user's choice): only from monsters, with a small chance, rolled on their own
// any monster: crystal 1 in 100, ruby 1 in 200 · any boss: twice that (crystal 2%, ruby 1%)
const RATE = { forge_crystal: 0.01, ruby: 0.005 }, BOSS_MULT = 2;
RW.GEM_RATES = { RATE, BOSS_MULT };
RW.gemsRoll = function (m) {
  if (!m || !m.k || m.k.target) return;
  const mult = m.k.boss ? BOSS_MULT : 1;
  for (const id in RATE) if (Math.random() < RATE[id] * mult) RW.G.dropItem(id, 1, m.pos, 1.3);
};
RW.gemsAddDrops = function () {}; // kept for later chapters that still call it
// economy (user's choice): monsters drop no coins, so their loot sells for more. Each material's price is
// raised until a monster's loot is worth about the coins it used to drop (lowest over the monsters that drop it)
(function sellBoost() {
  if (!RW.monsterStats) return;
  const ratios = {};
  for (const k in KINDS) {
    const K = KINDS[k]; if (K.boss || K.target || !K.drops) continue;
    let st = null; try { st = RW.monsterStats(k, K.baseLv || 1); } catch (e) {}
    if (!st || !st.coins) continue;
    const old = (st.coins[0] + st.coins[1]) / 2;
    let ev = 0; for (const [id, c] of K.drops) { const it = ITEMS[id]; if (it && it.sell) ev += Math.min(1, c) * it.sell; }
    if (ev <= 0) continue;
    const r = old / ev;
    for (const [id] of K.drops) { const it = ITEMS[id]; if (it && it.kind === 'material' && it.rarity === 'common') (ratios[id] = ratios[id] || []).push(r); }
  }
  for (const id in ratios) {
    // the smallest ratio wins: a material shared by a weak and a strong monster must not make the weak one a gold mine
    const mid = Math.min(...ratios[id]);
    // potions in the loot do not get dearer, so materials make up for them; cap it so nothing goes silly
    const f = Math.max(1, Math.min(3.5, mid * 1.15));
    ITEMS[id].sell = Math.max(ITEMS[id].sell, Math.round(ITEMS[id].sell * f));
  }
})();
// no shop sells them any more
if (RW.SHOP) { const i = RW.SHOP.indexOf('forge_crystal'); if (i >= 0) RW.SHOP.splice(i, 1); }
})();
