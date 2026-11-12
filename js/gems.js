// Russel World v1.5: Rubies and Forge Crystals, the stones Bolt uses to forge and strengthen gear.
(function () {
'use strict';
const RW = window.RW;
if (!RW || RW.failed || !RW.gear || !RW.KINDS) return;
const { ITEMS, KINDS } = RW;
Object.assign(ITEMS, {
  forge_crystal: { name: 'Forge Crystal', kind: 'material', rarity: 'common', sell: 20, icon: 'gem', color: '#9fd8ff', desc: 'A clear blue crystal. Bolt melts it into gear to forge it and make it stronger.' },
  ruby: { name: 'Ruby', kind: 'material', rarity: 'rare', sell: 180, icon: 'gem', color: '#e8304a', desc: 'A deep red gem. Needed to forge strong gear and to push gear past +6.' }
});
// every forge recipe needs crystals, and the stronger ones need rubies too
for (const id in RW.gear.GEAR) {
  const g = RW.gear.GEAR[id]; if (!g.forge || g.forge._gems) continue;
  g.forge._gems = true;
  g.forge.mats = g.forge.mats.concat([['forge_crystal', Math.max(1, Math.ceil(g.lv / 4))]]);
  if (g.lv >= 12) g.forge.mats.push(['ruby', g.lv >= 30 ? 3 : g.lv >= 20 ? 2 : 1]);
}
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
// no shop sells them any more
if (RW.SHOP) { const i = RW.SHOP.indexOf('forge_crystal'); if (i >= 0) RW.SHOP.splice(i, 1); }
})();
