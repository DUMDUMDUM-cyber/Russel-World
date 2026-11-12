// Russel World v1.5: Sunhaven (the big harbour city), Chapter 4 (the Glow Marsh and the Mushroom Hollow),
// Chapter 5 (the Sky Kingdom and the Sky Palace) and the Challenge Tower. Built with the same kit as lands.js.
// Runs right after lands.js (before game.js), so the new maps, NPCs and gates exist from the start.
(function () {
'use strict';
const RW = window.RW;
if (!RW || RW.failed || !RW.world || !RW.LANDS_DATA) return;
const { THREE, mtx, part, lam, geoSphere, geoCyl, geoCone, glow } = RW;
const W = RW.world, K = W.kit, D0 = RW.LANDS_DATA, MKB = D0.mk;
const { ITEMS, KINDS, PETS, PET_EGGS } = RW;
const { land, ROOMS, HALLS, g2, LV, mon, put, coral } = D0;
const { vnoise3 } = K;
const R = () => RW.R();

// ======================================================================= items
const mat = (name, sell, color, icon, desc, extra) => Object.assign({ name, kind: 'material', rarity: 'common', sell, icon, color, desc }, extra || {});
Object.assign(ITEMS, {
  marsh_goo: mat('Marsh Goo', 70, '#8af07a', 'jelly', 'Green goo that shines in the dark.', { food: 20 }),
  bog_slime: mat('Bog Slime', 72, '#6a8a3a', 'jelly', 'Smelly marsh slime. Bolt says it makes good glue.'),
  gator_scale: mat('Gator Scale', 78, '#4a7a3a', 'cap', 'A tough green scale from a Mossgator.'),
  fen_feather: mat('Fen Feather', 80, '#8a6ac8', 'quill', 'A soft purple feather that smells of rain.'),
  spore_dust: mat('Spore Dust', 82, '#c8a8ff', 'fluff', 'Sleepy dust. Do not sneeze on it.'),
  mud_shell: mat('Mud Shell', 84, '#7a5a3a', 'cap', 'A muddy crab shell, very hard.'),
  wisp_light: mat('Wisp Light', 90, '#7cc4ff', 'shard', 'A tiny blue light that floats in your hand.'),
  toad_wart: mat('Toad Wart', 88, '#6a3a7a', 'berry', 'A purple bump from a Bogtoad. Yuck.'),
  thorn_scale: mat('Thorn Scale', 92, '#7a8a3a', 'quill', 'A spiky lizard scale.'),
  marsh_pearl: mat('Marsh Pearl', 420, '#d8ffe0', 'gem', 'A pale green pearl from the deep bog.', { rarity: 'rare' }),
  morel_cap: mat('Morel Crown', 900, '#b88ae0', 'gem', 'The glowing cap-crown of Mother Morel.', { rarity: 'epic' }),
  cloud_puff: mat('Cloud Puff', 100, '#f4f8ff', 'fluff', 'A handful of real cloud. Soft and cool.'),
  gold_feather: mat('Golden Feather', 104, '#ffd84d', 'quill', 'A golden feather from a Skyowl.'),
  wind_plume: mat('Wind Plume', 108, '#7cc4ff', 'quill', 'It flutters even with no wind.'),
  storm_wing: mat('Storm Wing', 112, '#f2d36b', 'quill', 'A crackling bat wing.'),
  thunder_fluff: mat('Thunder Fluff', 116, '#ffe070', 'fluff', 'Fluffy fur that makes your hair stand up.'),
  hawk_talon: mat('Hawk Talon', 120, '#8a6a4a', 'quill', 'A sharp hooked claw.'),
  star_jelly: mat('Star Jelly', 124, '#c8a8ff', 'jelly', 'Jelly with tiny stars inside.', { food: 30, fun: 10 }),
  moon_feather: mat('Moon Feather', 128, '#6a6ab8', 'quill', 'A dark blue feather with a silver tip.'),
  comet_scale: mat('Comet Scale', 132, '#4a4a8a', 'cap', 'A scale with a little shooting star on it.'),
  sky_gem: mat('Sky Gem', 520, '#9fd8ff', 'gem', 'A blue gem made of pure sky.', { rarity: 'rare' }),
  storm_crown: mat('Storm Crown', 1400, '#ffd84d', 'gem', 'The golden crown of the Storm King. It hums with thunder.', { rarity: 'legendary' }),
  marsh_egg: { name: 'Marsh Egg', kind: 'egg', egg: 'marsh', rarity: 'epic', sell: 0, price: 2400, icon: 'egg', color: '#8af07a', desc: 'A soft green egg that glows a little. A marsh pet sleeps inside.' },
  sky_egg: { name: 'Sky Egg', kind: 'egg', egg: 'sky', rarity: 'epic', sell: 0, price: 3600, icon: 'egg', color: '#ffe8a0', desc: 'A light golden egg, almost floating. A sky pet sleeps inside.' },
  tower_token: mat('Tower Token', 0, '#ffd84d', 'shard', 'Proof that you climbed the Challenge Tower. Sage Orin trades them.', { rarity: 'rare', kind: 'quest' })
});

// ======================================================================= monster models: recoloured builders, plus crowns for the bosses
function tint(p, col, k) {
  const c = new THREE.Color(col);
  p.root.traverse((o) => { if (!o.isMesh || !o.material || o.material === p.mat) return; const m = o.material.clone(); if (m.color) m.color.lerp(c, k); o.material = m; });
  return p;
}
const tinted = (base, col, k) => () => tint(RW.MONSTER_BUILD[base](), col, k == null ? 0.6 : k);
const crowned = (fn, s, col) => () => { const p = fn(); MKB.crown(p.body, (p.headY || 0.9) / (p.body.scale.y || 1) + 0.35, s, col); return p; };
Object.assign(RW.MONSTER_BUILD, {
  glowjelly: () => MKB.bJelly('glowjelly', 0x8af07a), bogfrog: () => MKB.bFrog('bogfrog', 0x5a8a3a, 0xd8e8a0), mossgator: () => MKB.bLizard('mossgator', 0x4a7a3a, 0xc8d890),
  fenowl: () => MKB.bOwl('fenowl', 0x8a6ac8), sporebat: tinted('chillbat', 0xb88ae0), mudcrab: () => MKB.bCrab('mudcrab', 0x7a5a3a, 0x5a4030),
  marshwisp: () => MKB.bJelly('marshwisp', 0x7cc4ff), bogtoad: () => MKB.bFrog('bogtoad', 0x6a3a7a, 0xe8c8f0), thornlizard: () => MKB.bLizard('thornliz', 0x7a8a3a, 0xf2d36b),
  mother_morel: crowned(tinted('moss_mushling', 0xb88ae0, 0.65), 1.3, 0xffd84d),
  puffcloud: () => MKB.bJelly('puffcloud', 0xf4f8ff), skyowl: () => MKB.bOwl('skyowl', 0xffd84d), windbird: () => MKB.bBird('windbird', 0x7cc4ff, 0xffffff, 0x4a8ad8, 0xffd84d),
  stormbat: tinted('chillbat', 0xf2d36b), thunderbun: tinted('bunbun', 0xffe070, 0.55), galehawk: () => MKB.bBird('galehawk', 0x8a6a4a, 0xf4e8d0, 0x5a4030, 0xffffff),
  starjelly: () => MKB.bJelly('starjelly', 0xc8a8ff, true), moonowl: () => MKB.bOwl('moonowl', 0x6a6ab8), cometail: () => MKB.bLizard('comet', 0x4a4a8a, 0xffd84d),
  storm_king: crowned(() => MKB.bBird('stormking', 0x4a4a8a, 0xffd84d, 0x2a2a6a, 0xffd84d), 1.2, 0xffd84d)
});

// ======================================================================= monsters (Lv. 30–50)
// stats grow a little every level, starting from the Windy Peak monsters
const st = (lv, k) => { const n = lv - 30; k = k || 1; return { baseLv: lv, hp: Math.round(1350 * Math.pow(1.06, n) * k), dmg: [Math.round(62 * Math.pow(1.045, n)), Math.round(72 * Math.pow(1.045, n))], def: 22 + n, exp: Math.round(900 * Math.pow(1.07, n)), coins: [Math.round(64 + n * 4), Math.round(86 + n * 5)] }; };
const M = (o) => mon(Object.assign(st(o.lv, o.k), o));
Object.assign(KINDS, {
  // Glow Marsh (Lv. 30–33)
  glowjelly: M({ name: 'Glowjelly', lv: 30, move: 'float', fly: 0.5, die: 'melt', area: 'glowmarsh', element: 'earth', weak: 'fire', poison: 0.3, helpers: 0.3, about: 'A green jelly that glows in the marsh. Its touch makes you sick.', drops: [['marsh_goo', 0.55], ['antidote', 0.08], ['marsh_pearl', 0.012], ['lucky_clover', 0.012]] }),
  bogfrog: M({ name: 'Bogfrog', lv: 31, die: 'melt', area: 'glowmarsh', element: 'water', weak: 'earth', reach: 3.8, about: 'A big swamp frog that spits mud from far away. Run up close!', drops: [['bog_slime', 0.55], ['red_m', 0.08], ['marsh_pearl', 0.012], ['lucky_clover', 0.012]] }),
  mossgator: M({ name: 'Mossgator', lv: 32, k: 1.15, move: 'trot', area: 'glowmarsh', element: 'earth', weak: 'wind', aggro: 5.5, charge: 1.8, about: 'A little alligator covered in moss. It snaps, then charges!', drops: [['gator_scale', 0.5], ['red_m', 0.08], ['marsh_pearl', 0.015], ['lucky_clover', 0.012]] }),
  // Fenwood (Lv. 32–35)
  fenowl: M({ name: 'Fenowl', lv: 33, move: 'float', fly: 1.1, die: 'pop', headY: 0.2, area: 'fenwood', element: 'wind', weak: 'earth', stun: 0.35, aggro: 5, about: 'A purple owl. Its hoot makes your head spin.', drops: [['fen_feather', 0.5], ['blue_m', 0.08], ['marsh_pearl', 0.015], ['lucky_clover', 0.012]] }),
  sporebat: M({ name: 'Sporebat', lv: 34, move: 'float', fly: 1.4, die: 'pop', headY: 0.1, area: 'fenwood', element: 'earth', weak: 'fire', poison: 0.35, helpers: 0.4, about: 'A bat that sprinkles sleepy, sickly spores.', drops: [['spore_dust', 0.5], ['antidote', 0.08], ['marsh_pearl', 0.015], ['lucky_clover', 0.012]] }),
  mudcrab: M({ name: 'Mudcrab', lv: 35, k: 1.2, move: 'scuttle', area: 'fenwood', element: 'earth', weak: 'water', aggro: 4, about: 'A crab with a shell of hard mud. Skills crack it best.', drops: [['mud_shell', 0.5], ['red_m', 0.08], ['marsh_pearl', 0.018], ['lucky_clover', 0.012]] }),
  // Lily Bog (Lv. 34–37)
  marshwisp: M({ name: 'Marshwisp', lv: 35, move: 'float', fly: 0.8, die: 'pop', area: 'lilybog', element: 'water', weak: 'wind', helpers: 0.35, about: 'A floating blue light. Many travellers followed one and got lost.', drops: [['wisp_light', 0.5], ['blue_m', 0.08], ['marsh_pearl', 0.018], ['lucky_clover', 0.013]] }),
  bogtoad: M({ name: 'Bogtoad', lv: 36, k: 1.15, move: 'waddle', area: 'lilybog', element: 'water', weak: 'earth', poison: 0.4, aggro: 4, about: 'A grumpy purple toad. Poison bumps all over.', drops: [['toad_wart', 0.5], ['antidote', 0.1], ['marsh_pearl', 0.02], ['lucky_clover', 0.013]] }),
  thornlizard: M({ name: 'Thornlizard', lv: 37, move: 'trot', area: 'lilybog', element: 'earth', weak: 'fire', thorns: 0.8, aggro: 5, charge: 1.6, about: 'A spiky lizard. Plain hits prick you back.', drops: [['thorn_scale', 0.5], ['red_m', 0.09], ['marsh_pearl', 0.02], ['lucky_clover', 0.013]] }),
  mother_morel: mon({ name: 'Mother Morel', baseLv: 38, hp: 36000, dmg: [86, 104], def: 34, exp: 40000, coins: [2200, 2800], radius: 2.0, scale: 2.8, speed: 0.5, chase: 1.4, atkGap: 2.3, headY: 2.2, move: 'waddle', area: 'shroomcave', element: 'earth', weak: 'fire', reach: 3.6, boss: true, respawn: 1e9, poison: 0.35, about: 'The huge, sleepy mother of all marsh mushrooms. Her spores make the whole marsh drowsy. Stay out of the purple clouds!', drops: [['morel_cap', 1], ['light_shard', 2], ['marsh_pearl', 0.8], ['red_m', 1], ['lucky_clover', 0.5]] }),
  // Cloud Isle (Lv. 38–41)
  puffcloud: M({ name: 'Puffcloud', lv: 38, move: 'float', fly: 0.7, die: 'pop', area: 'cloudisle', element: 'wind', weak: 'earth', helpers: 0.3, about: 'A grumpy little cloud. It rains on you. On purpose.', drops: [['cloud_puff', 0.55], ['blue_m', 0.09], ['sky_gem', 0.012], ['lucky_clover', 0.014]] }),
  skyowl: M({ name: 'Skyowl', lv: 39, move: 'float', fly: 1.2, die: 'pop', headY: 0.2, area: 'cloudisle', element: 'wind', weak: 'earth', stun: 0.35, aggro: 5, about: 'A golden owl of the sky. Its hoot shakes the clouds.', drops: [['gold_feather', 0.5], ['red_m', 0.09], ['sky_gem', 0.012], ['lucky_clover', 0.014]] }),
  windbird: M({ name: 'Windbird', lv: 40, move: 'float', fly: 1.5, die: 'pop', headY: 0.3, area: 'cloudisle', element: 'wind', weak: 'earth', aggro: 5.5, charge: 1.5, about: 'A blue bird that dives out of the wind.', drops: [['wind_plume', 0.5], ['blue_m', 0.09], ['sky_gem', 0.015], ['lucky_clover', 0.014]] }),
  // Windspire (Lv. 40–43)
  stormbat: M({ name: 'Stormbat', lv: 41, move: 'float', fly: 1.4, die: 'pop', headY: 0.1, area: 'windspire', element: 'wind', weak: 'earth', stun: 0.3, helpers: 0.4, about: 'A yellow bat full of static. Its bite zaps!', drops: [['storm_wing', 0.5], ['red_m', 0.09], ['sky_gem', 0.015], ['lucky_clover', 0.014]] }),
  thunderbun: M({ name: 'Thunderbun', lv: 42, area: 'windspire', element: 'wind', weak: 'earth', stun: 0.4, aggro: 4.5, helpers: 0.3, about: 'A fluffy yellow bunny. Its fur is full of thunder.', drops: [['thunder_fluff', 0.5], ['blue_m', 0.09], ['sky_gem', 0.018], ['lucky_clover', 0.015]] }),
  galehawk: M({ name: 'Galehawk', lv: 43, k: 1.1, move: 'float', fly: 1.6, die: 'pop', headY: 0.3, area: 'windspire', element: 'wind', weak: 'earth', aggro: 6, charge: 1.4, about: 'A hawk that rides the storm and dives very fast.', drops: [['hawk_talon', 0.5], ['red_m', 0.1], ['sky_gem', 0.018], ['lucky_clover', 0.015]] }),
  // Starfield (Lv. 43–46)
  starjelly: M({ name: 'Starjelly', lv: 44, move: 'float', fly: 0.6, die: 'melt', area: 'starfield', element: 'water', weak: 'wind', poison: 0.3, helpers: 0.35, about: 'A jelly full of tiny stars. Pretty, but it stings.', drops: [['star_jelly', 0.55], ['antidote', 0.1], ['sky_gem', 0.02], ['lucky_clover', 0.015]] }),
  moonowl: M({ name: 'Moonowl', lv: 45, move: 'float', fly: 1.2, die: 'pop', headY: 0.2, area: 'starfield', element: 'wind', weak: 'earth', stun: 0.4, aggro: 5, about: 'A night owl from the star fields.', drops: [['moon_feather', 0.5], ['blue_m', 0.1], ['sky_gem', 0.02], ['lucky_clover', 0.015]] }),
  cometail: M({ name: 'Cometail', lv: 46, k: 1.2, move: 'trot', area: 'starfield', element: 'fire', weak: 'water', aggro: 6, charge: 1.8, about: 'A lizard with a tail like a comet. It charges like one too.', drops: [['comet_scale', 0.5], ['red_m', 0.1], ['sky_gem', 0.022], ['lucky_clover', 0.016]] }),
  storm_king: mon({ name: 'Storm King Nimbus', baseLv: 50, hp: 70000, dmg: [120, 145], def: 48, exp: 90000, coins: [5000, 6500], radius: 2.2, scale: 3.0, speed: 0.6, chase: 1.6, atkGap: 2.2, headY: 1.6, move: 'float', fly: 1.2, die: 'pop', area: 'skypalace', element: 'wind', weak: 'earth', reach: 3.8, boss: true, respawn: 1e9, stun: 0.3, about: 'The great bird king of the Sky Palace. He calls lightning down where you stand. Keep moving!', drops: [['storm_crown', 1], ['light_shard', 3], ['sky_gem', 1], ['red_m', 1], ['lucky_clover', 1]] })
});

// ======================================================================= gear sets
Object.assign(RW.EXTRA_SETS, {
  gator: { name: 'Mossgator', two: { def: 16 }, three: { hp: 220, def: 12 } },
  toad: { name: 'Bogtoad', two: { hp: 240 }, three: { atk: 18, mp: 80 } },
  cloud: { name: 'Puffcloud', two: { mp: 120 }, three: { dodge: 0.05, speed: 0.06 } },
  comet: { name: 'Cometail', two: { atk: 22 }, three: { crit: 0.06, atk: 16 } },
  marsh: { name: 'Glow Marsh', two: { hp: 260, def: 14 }, three: { atk: 20, def: 18, crit: 0.04 } },
  sky: { name: 'Sky Kingdom', two: { atk: 24, crit: 0.04 }, three: { atk: 26, def: 24, speed: 0.06 } }
});
RW.EXTRA_SET_PIECES.push(
  ['gator', 33, 'mossgator', [['gatorhelm', 'Gator Helm'], ['gatorvest', 'Gator Vest'], ['gatorboots', 'Gator Boots']]],
  ['toad', 36, 'bogtoad', [['toadhat', 'Toad Hat'], ['toadvest', 'Toad Vest'], ['toadboots', 'Toad Boots']]],
  ['cloud', 39, 'puffcloud', [['cloudhood', 'Cloud Hood'], ['cloudvest', 'Cloud Vest'], ['cloudboots', 'Cloud Boots']]],
  ['comet', 46, 'cometail', [['comethelm', 'Comet Helm'], ['cometvest', 'Comet Vest'], ['cometboots', 'Comet Boots']]],
  ['marsh', 34, null, [['lilyhat', 'Lily Hat'], ['marshcoat', 'Marsh Coat'], ['bogboots', 'Bog Boots']]],
  ['sky', 44, null, [['skycrown', 'Sky Crown'], ['skyrobe', 'Sky Robe'], ['windboots', 'Wind Boots']]]
);
Object.assign(RW.EXTRA_FORGE, {
  lilyhat: [['marsh_goo', 14], ['fen_feather', 8]], marshcoat: [['gator_scale', 14], ['mud_shell', 10], ['marsh_pearl', 1]], bogboots: [['bog_slime', 12], ['toad_wart', 8]],
  skycrown: [['gold_feather', 14], ['wind_plume', 10]], skyrobe: [['cloud_puff', 16], ['thunder_fluff', 10], ['sky_gem', 1]], windboots: [['hawk_talon', 10], ['moon_feather', 10]]
});
Object.assign(RW.GEAR_LOOKS, {
  gatorhelm: { kind: 'boar', base: 0x4a7a3a }, gatorvest: { shirt: '#e8f0d8', vest: '#4a7a3a', emblem: 'tusk', extra: 'shell' }, gatorboots: { boot: '#4a7a3a', cuff: 0xc8d890 },
  toadhat: { kind: 'jelly', base: 0x6a3a7a, dark: 0xe8c8f0 }, toadvest: { shirt: '#f4e8f8', vest: '#6a3a7a', emblem: 'drop' }, toadboots: { boot: '#6a3a7a', cuff: 0xe8c8f0 },
  cloudhood: { kind: 'mush', base: 0xf4f8ff, spot: 0x9fd8ff, glow: true }, cloudvest: { shirt: '#ffffff', vest: '#b8d8f0', emblem: 'feather', extra: 'cloak' }, cloudboots: { boot: '#f4f8ff', cuff: 0x9fd8ff, fur: true },
  comethelm: { kind: 'thorn', base: 0x4a4a8a }, cometvest: { shirt: '#e8e8ff', vest: '#4a4a8a', emblem: 'sun', extra: 'spikes' }, cometboots: { boot: '#4a4a8a', cuff: 0xffd84d, spike: true },
  lilyhat: { kind: 'straw', base: 0x8af07a, band: 0xb88ae0 }, marshcoat: { shirt: '#e8f8e0', vest: '#3a6a4a', emblem: 'glow', extra: 'leaves' }, bogboots: { boot: '#5a4030', cuff: 0x8af07a },
  skycrown: { kind: 'crown' }, skyrobe: { shirt: '#ffffff', vest: '#ffd84d', emblem: 'sun', extra: 'cloak' }, windboots: { boot: '#7cc4ff', cuff: 0xffffff, fur: true }
});

// ======================================================================= pets: a marsh egg and a sky egg (recoloured friends of the first pets)
const tintPet = (base, col, k) => (stage) => { const p = RW.PET_BUILD[base](stage); p.root.traverse((o) => { if (!o.isMesh || !o.material || o.material === p.mat) return; const m = o.material.clone(); if (m.color) m.color.lerp(new THREE.Color(col), k); o.material = m; }); return p; };
Object.assign(PETS, {
  mirefrog: { name: 'Mirefrog', about: 'A chubby marsh frog with a mossy back. It stands in front of you like a wall.', element: 'water', hp: 1.85, atk: 0.85, egg: 'marsh', role: 'tank', col: 0x6a9a4a, pitch: 520,
    skills: [{ id: 'mudwall', name: 'Mud Wall', kind: 'guard', def: 0.7, dur: 8, cd: 15, desc: 'Your defense goes way up for 8 seconds.' },
      { id: 'tonguewhip', name: 'Tongue Whip', kind: 'hit', power: 1.5, stun: 1.2, cd: 9, desc: 'A sticky tongue that leaves a monster dizzy.' },
      { id: 'bogfort', name: 'Bog Fortress', kind: 'guard', def: 1.2, dur: 10, cd: 20, desc: 'A wall of mud: your defense goes up a lot for 10 seconds.' }] },
  sporepuff: { name: 'Sporepuff', about: 'A little glowing mushroom that puffs healing spores.', element: 'earth', hp: 1.05, atk: 1.0, egg: 'marsh', role: 'healer', col: 0xb88ae0, pitch: 980,
    skills: [{ id: 'healspore', name: 'Healing Spores', kind: 'heal', heal: 0.45, cd: 15, desc: 'Soft spores heal you when your HP is low, and the pet too.' },
      { id: 'sporeshot', name: 'Spore Shot', kind: 'hit', power: 1.5, element: 'earth', cd: 8, desc: 'A puff of spores at a monster.' },
      { id: 'bloomcloud', name: 'Bloom Cloud', kind: 'heal', heal: 0.7, cd: 20, desc: 'A big healing cloud for you and the pet.' }] },
  cloudpup: { name: 'Cloudpup', about: 'A golden puppy made of sunny clouds. It finds treasure everywhere.', element: 'wind', hp: 1.0, atk: 1.05, egg: 'sky', role: 'lucky', col: 0xffd84d, pitch: 1100,
    skills: [{ id: 'sunbark', name: 'Sun Bark', kind: 'hit', power: 1.6, element: 'wind', cd: 8, desc: 'A bark full of sunshine.' },
      { id: 'goldnose', name: 'Gold Nose', kind: 'area', power: 1.6, radius: 2.8, cd: 13, desc: 'Sniffs out a burst of golden light around a monster.' },
      { id: 'skyhowl', name: 'Sky Howl', kind: 'area', power: 2.4, element: 'wind', radius: 3.2, cd: 16, desc: 'A howl that calls the wind down on monsters.' }] },
  starling: { name: 'Starling', about: 'A tiny star bird that shoots little falling stars from far away.', element: 'fire', hp: 0.85, atk: 1.6, egg: 'sky', role: 'ranger', col: 0x7cc4ff, pitch: 1500,
    skills: [{ id: 'starshot', name: 'Star Shot', kind: 'hit', power: 2.1, element: 'fire', cd: 7, desc: 'A small shooting star that hits very hard.' },
      { id: 'starfall2', name: 'Starfall', kind: 'area', power: 1.7, element: 'fire', radius: 2.8, cd: 13, desc: 'Stars fall on a monster and everyone around it.' },
      { id: 'supernova', name: 'Supernova', kind: 'hit', power: 3.6, element: 'fire', cd: 12, desc: 'One huge star. Huge damage.' }] }
});
Object.assign(RW.PET_BUILD, { mirefrog: tintPet('lilytoad', 0x6a9a4a, 0.45), sporepuff: tintPet('glimmerbun', 0xb88ae0, 0.5), cloudpup: tintPet('cloudfox', 0xffd84d, 0.5), starling: tintPet('featherdart', 0x7cc4ff, 0.55) });
PET_EGGS.marsh = { name: 'Marsh Egg', hint: 'Soft and green, and it glows a little.', species: ['mirefrog', 'sporepuff'] };
PET_EGGS.sky = { name: 'Sky Egg', hint: 'Light and golden, almost floating.', species: ['cloudpup', 'starling'] };

// ======================================================================= people
Object.assign(RW.NPC_LOOKS, {
  rosa: { gender: 'girl', skin: '#e8b890', hair: 'bun', hairColor: '#8a3a2a', iris: '#5a3a2a', outfit: 'mira', weapon: 'none', mouth: 'smile', size: 1.0, colors: { shirt: '#c0405a' } },
  gus: { gender: 'boy', skin: '#c98e62', hair: 'none', outfit: 'bolt', weapon: 'hammer', brows: 'thick', mouth: 'grin', stubble: true, size: 1.1, colors: { shirt: '#5a5a6a' } },
  lina: { gender: 'girl', skin: '#f6d8c0', hair: 'pony', hairColor: '#f2b63d', iris: '#3f6a8a', outfit: 'pip', weapon: 'none', mouth: 'smile', freckles: true, colors: { shirt: '#5fae45' } },
  nell: { gender: 'girl', skin: '#a8724a', hair: 'twin', hairColor: '#2a1a1a', iris: '#5a3a2a', outfit: 'pip', weapon: 'none', mouth: 'smile', size: 0.95, colors: { shirt: '#b88ae0' } },
  zephyr: { gender: 'boy', skin: '#f3d2b8', hair: 'shortspiky', hairColor: '#e8e0d0', iris: '#4a8ad8', outfit: 'tobin', weapon: 'none', mouth: 'grin', brows: 'thick', colors: { shirt: '#4a8ad8' } },
  orin: { gender: 'boy', skin: '#e0ac80', hair: 'none', outfit: 'elder', weapon: 'cane', brows: 'thick', mouth: 'smile', stubble: true, colors: { shirt: '#6a4ab8' } }
});
RW.NPC_LOOKS.bahari4 = RW.NPC_LOOKS.bahari; RW.NPC_LOOKS.zephyr2 = RW.NPC_LOOKS.zephyr; RW.NPC_LOOKS.orin2 = RW.NPC_LOOKS.orin;

// ======================================================================= the lands
const SUN = { cx: -1700, cz: 600 }, MC = { cx: -2700, cz: 1000 }, SP = { cx: -3800, cz: 1000 }, TW = { cx: -1700, cz: 1300 };
const marshTint = (x, z, c) => { const n = vnoise3(x * 0.05, 8.1, z * 0.05); c[0] *= 0.62 + n * 0.08; c[1] *= 0.86 + n * 0.06; c[2] *= 0.7; };
const MARSH = { tint: marshTint, tree: 'mix', trees: 110, rocks: 18, flowers: [0xb88ae0, 0x7cf0d8, 0xffffff], tufts: 0x4a7a3a, glowPond: true, mini: { out: '#2f4a3a', in: '#5a7a4a', rim: '#3f5a3a', tree: '#1f3a2a' }, drift: [0x9fff8a, 0.3, true] };
const marshLook = { fog: 0x8aa890, near: 36, far: 140, sun: 0.44 };
const skyTint = (x, z, c) => { const n = vnoise3(x * 0.04, 2.6, z * 0.04); c[0] *= 0.95 + n * 0.05; c[1] *= 1.05; c[2] *= 0.85; };
const SKY = { tint: skyTint, tree: 'broad', trees: 40, rocks: 14, flowers: [0xffd84d, 0xffffff, 0x7cc4ff], tufts: 0x7ac85a, mini: { out: '#f4f8ff', in: '#9ad870', rim: '#c8e8a0', tree: '#4f9a3a' }, drift: [0xffffff, 0.3, false] };
const skyLook = { fog: 0xe4eeff, near: 70, far: 230, sun: 0.74 };
const tickOf = (id, wind, glowSpin) => (dt, time, active) => { if (active !== id) return; const L = D0.LANDS[id], f = L && L.fx; if (!f) return; if (f.drift) K.drift(f.drift, dt, time, wind, !!glowSpin); if (f.sea) f.sea.position.y = -0.55 + Math.sin(time * 0.4) * 0.12; if (f.spin) for (const s of f.spin) s.rotation.y += dt * 0.6; if (f.fountain) f.fountain.scale.y = 1 + Math.sin(time * 6) * 0.08; if (f.balloon) f.balloon.position.y = f.balloon.userData.y + Math.sin(time * 1.1) * 0.25; };
function balloonModel() {
  const g = new THREE.Group();
  const env = new THREE.Mesh(geoSphere(2.4, 18, 14), lam(0xff7a5a)); env.scale.set(1, 1.15, 1); env.position.y = 5.6; g.add(env);
  for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(2.42, 18, 14, (i / 6) * Math.PI * 2, 0.35),lam(i % 2 ? 0xffd84d : 0xffffff)); s.scale.set(1, 1.15, 1); s.position.y = 5.6; g.add(s); }
  const basket = new THREE.Mesh(geoCyl(0.9, 0.75, 1, 10), lam(0xa8774f, K.woodTex)); basket.position.y = 0.5; g.add(basket);
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.78, r = new THREE.Mesh(geoCyl(0.03, 0.03, 3, 4), lam(0x6a4a30)); r.position.set(Math.cos(a) * 0.8, 2.4, Math.sin(a) * 0.8); g.add(r); }
  return g;
}
function fountain(x, z, o) {
  const y = K.height(x, z), g = new THREE.Group(); g.position.set(x, y, z); K.root.add(g);
  const rim = new THREE.Mesh(geoCyl(3.4, 3.6, 0.7, 24), RW.lam(0xd8d0c0)); rim.position.y = 0.35; g.add(rim);
  const w = new THREE.Mesh(geoCyl(3.1, 3.1, 0.1, 24), new THREE.MeshLambertMaterial({ color: 0x6ac8e8, emissive: 0x0a3a4a })); w.position.y = 0.66; g.add(w);
  const col = new THREE.Mesh(geoCyl(0.35, 0.5, 2.2, 10), RW.lam(0xd8d0c0)); col.position.y = 1.4; g.add(col);
  const bowl = new THREE.Mesh(geoCyl(1.3, 0.6, 0.4, 16), RW.lam(0xd8d0c0)); bowl.position.y = 2.5; g.add(bowl);
  const jet = new THREE.Mesh(geoCone(0.4, 1.4, 10), new THREE.MeshLambertMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.7 })); jet.position.y = 3.3; g.add(jet);
  o.fx.fountain = jet; K.addCollider(x, z, 3.6);
}
function castle(x, z, o) {
  const y = K.height(x, z), g = new THREE.Group(); g.position.set(x, y, z); K.root.add(g);
  const stone = RW.lam(0xe8e0d0, K.rockTex), roof = RW.lam(0x4a6ab8);
  const keep = new THREE.Mesh(RW.geoBox(16, 9, 10), stone); keep.position.y = 4.5; g.add(keep);
  const top = new THREE.Mesh(RW.geoBox(17, 0.8, 11), RW.lam(0xd0c8b8)); top.position.y = 9.2; g.add(top);
  for (const [dx, dz] of [[-8, -5], [8, -5], [-8, 5], [8, 5]]) {
    const t = new THREE.Mesh(geoCyl(2, 2.2, 13, 12), stone); t.position.set(dx, 6.5, dz); g.add(t);
    const c = new THREE.Mesh(geoCone(2.6, 4, 12), roof); c.position.set(dx, 15, dz); g.add(c);
    const fl = new THREE.Mesh(RW.geoBox(0.05, 0.8, 1.2), RW.lam(0xffd84d)); fl.position.set(dx, 17.6, dz + 0.6); g.add(fl);
  }
  const door = new THREE.Mesh(RW.geoBox(3, 4.4, 0.4), RW.lam(0x6a4a30, K.woodTex)); door.position.set(0, 2.2, 5.1); g.add(door);
  for (let i = -3; i <= 3; i++) if (i) { const wdw = new THREE.Mesh(RW.geoBox(1, 1.6, 0.2), RW.lam(0xffe8a0, null, { emissive: 0x6a5a20 })); wdw.position.set(i * 2, 6, 5.1); g.add(wdw); }
  K.addCollider(x, z, 9.5); K.addCollider(x - 7, z, 6); K.addCollider(x + 7, z, 6);
  void o;
}
function stall(x, z, face, col) { const g = K.tent(x, z, face, K.awningTex); void col; return g; }
function lamp(x, z) { const y = K.height(x, z); put(0x4a4a5a, geoCyl(0.1, 0.14, 3.4, 6), mtx(x, y + 1.7, z)); const gl = glow(2.2); gl.position.set(x, y + 3.5, z); gl.material.color = new THREE.Color(0xffd890); gl.material.opacity = 0.55; K.root.add(gl); put(0xfff0b0, geoSphere(0.3, 10, 8), mtx(x, y + 3.5, z)); }
const out = [];
// --- Sunhaven, the big harbour city (Lv. 30+ hub)
out.push(land({ id: 'sunhaven', name: 'Sunhaven', lv: 'Big city · safe', cx: SUN.cx, cz: SUN.cz, A: 172, seed: 93001, sea: true, amp: 1.0,
  style: { tint: (x, z, c) => { c[0] *= 0.95; c[1] *= 1.02; c[2] *= 0.88; }, tree: 'broad', trees: 26, rocks: 8, flowers: [0xff7a8a, 0xffd84d, 0xffffff], mini: { out: '#3aa7c8', in: '#8ac860', rim: '#a8d880', tree: '#3f8a2f' }, drift: [0xffffff, 0.2, false] },
  roads: [[[-1700, 470], [-1700, 560], [-1700, 640], [-1700, 740]], [[-1866, 600], [-1780, 600], [-1700, 600], [-1620, 604], [-1560, 610], [-1546, 610]], [[-1700, 640], [-1760, 680], [-1800, 700]], [[-1700, 560], [-1640, 520], [-1600, 500]]],
  gates: [g2('sh_w', -1866, 600, 'glowmarsh', -2072, 600, -Math.PI / 2, 'GLOW MARSH', LV('Glow Marsh', 'Lv. 30–33'))],
  way: { id: 'sunhaven', name: 'Sunhaven', x: -1690, z: 572 },
  npcs: [{ id: 'rosa', name: 'Mayor Rosa', role: 'Mayor of Sunhaven', x: -1712, z: 626, face: Math.PI, lines: ['Welcome to Sunhaven, the biggest city by the sea!'] },
    { id: 'gus', name: 'Gus', role: 'Grand smith', x: -1648, z: 560, face: -2.3, lines: ['Need something forged? Bring me crystals and rubies!'] },
    { id: 'lina', name: 'Lina', role: 'Grand market', x: -1742, z: 568, face: 0.8, lines: ['The grand market has everything!'] },
    { id: 'nell', name: 'Nell', role: 'Pet keeper', x: -1756, z: 630, face: 2.3, lines: ['Marsh eggs, sky eggs, pet snacks!'] },
    { id: 'zephyr', name: 'Captain Zephyr', role: 'Balloon pilot', x: -1640, z: 672, face: Math.PI + 0.5, lines: ['Up, up and away! One day.'] },
    { id: 'orin', name: 'Sage Orin', role: 'Tower keeper', x: -1700, z: 752, face: Math.PI, lines: ['The Challenge Tower waits for the brave.'] },
    { id: 'bahari4', look: 'bahari', name: 'Captain Bahari', role: 'Boat captain', x: -1550, z: 600, face: -1.57, lines: ['Sunhaven! Best harbour in the world.'] }],
  look: { fog: 0xd8ecf4, near: 80, far: 240, sun: 0.7 }, arrive: { x: -1556, z: 612, face: -Math.PI / 2 },
  clear: [[-1700, 600, 22], [-1700, 770, 16], [-1550, 608, 16], [-1640, 676, 8]],
  extras(o) {
    fountain(-1700, 600, o);
    castle(-1700, 790, o);
    // houses in two rings around the square
    const roofs = [0xff7a8a, 0x4a8ad8, 0xffb43d, 0x5fae45, 0xb88ae0, 0xe8604c, 0x2a9a8a, 0xf2d36b];
    let k = 0;
    for (const [r, n, off] of [[42, 10, 0.2], [72, 14, 0.05], [104, 16, 0.12]]) for (let i = 0; i < n; i++) {
      const a = off + i / n * Math.PI * 2, x = SUN.cx + Math.cos(a) * r, z = SUN.cz + Math.sin(a) * r;
      if (K.distToRoad(x, z) < 6 || Math.hypot(x + 1700, z - 790) < 22 || Math.hypot(x + 1550, z - 608) < 18 || Math.hypot(x + 1640, z - 676) < 10) continue;
      K.house(x, z, roofs[k++ % roofs.length], { face: -a + Math.PI / 2 + Math.PI, stone: k % 3 === 0 });
    }
    stall(-1738, 574, 0.8); stall(-1662, 562, -0.8); stall(-1730, 640, 2.3); stall(-1760, 600, Math.PI / 2);
    for (const [x, z] of [[-1716, 584], [-1684, 584], [-1716, 616], [-1684, 616], [-1700, 680], [-1700, 520], [-1780, 600], [-1620, 604]]) lamp(x, z);
    // the harbour
    const dock = new THREE.Group(); dock.position.set(-1544, 0, 606); K.root.add(dock);
    for (let i = 0; i < 12; i++) K.box(3, 0.2, 1.2, K.M_WOOD, i * 1.25, -0.1, 0, dock, Math.PI / 2);
    for (let i = 0; i < 6; i++) for (const s of [-1, 1]) K.box(0.25, 2.4, 0.25, K.M_WOOD, i * 2.6, -0.9, s * 1.6, dock);
    o.fx.boat = D0.boatModel(); o.fx.boat.position.set(-1528, -0.3, 612); K.root.add(o.fx.boat);
    // the balloon pad
    o.fx.balloon = balloonModel(); const by = K.height(-1632, 680); o.fx.balloon.position.set(-1632, by, 680); o.fx.balloon.userData.y = by; K.root.add(o.fx.balloon); K.addCollider(-1632, 680, 1.2);
    // the tower, far north behind the castle
    const tw = new THREE.Group(), ty = K.height(-1700, 760); tw.position.set(-1680, ty, 770);
    K.signPost(-1692, 744, Math.PI, 'Challenge Tower\nTalk to Sage Orin');
    K.signPost(-1694, 548, Math.PI, 'Sunhaven\nBig city');
    void tw;
  },
  miniMid: (g) => { g.fillStyle = '#d8d0c0'; g.beginPath(); g.arc(-1700, 600, 4, 0, 7); g.fill(); g.fillStyle = '#4a6ab8'; g.fillRect(-1710, 784, 20, 12); g.fillStyle = '#9a6e45'; g.fillRect(-1546, 604, 16, 4); },
  tick: tickOf('sunhaven', 0.2) }));
// --- Chapter 4: the Glow Marsh
out.push(land({ id: 'glowmarsh', name: 'Glow Marsh', lv: 'Lv. 30–33', min: 30, title: 'Marsh Expert', bonus: { hp: 220 }, bonusText: '+220 Max HP', kinds: ['glowjelly', 'bogfrog', 'mossgator'], cx: -2200, cz: 600, seed: 93002, amp: 1.6,
  ponds: [{ x: -2160, z: 560, r: 14, base: 0.1, level: -0.35 }, { x: -2250, z: 660, r: 11, base: 0.1, level: -0.35 }, { x: -2290, z: 540, r: 8, base: 0.1, level: -0.35 }, { x: -2130, z: 680, r: 7, base: 0.1, level: -0.35 }],
  style: MARSH, roads: [[[-2068, 600], [-2120, 610], [-2200, 610], [-2280, 600], [-2332, 600]], [[-2200, 610], [-2200, 680], [-2200, 732]]],
  gates: [g2('gm_e', -2062, 600, 'sunhaven', -1856, 600, Math.PI / 2, 'SUNHAVEN', LV('Sunhaven', 'City')), g2('gm_n', -2200, 738, 'fenwood', -2200, 872, 0, 'FENWOOD', LV('Fenwood', 'Lv. 32–35')), g2('gm_w', -2338, 600, 'lilybog', -2572, 600, -Math.PI / 2, 'LILY BOG', LV('Lily Bog', 'Lv. 34–37'))],
  way: { id: 'glowmarsh', name: 'Glow Marsh', x: -2085, z: 612 },
  camps: [['glowjelly', 30, -2120, 570, 4, 6], ['glowjelly', 31, -2230, 600, 4, 6], ['glowjelly', 31, -2300, 650, 3, 5], ['bogfrog', 31, -2180, 520, 4, 6], ['bogfrog', 32, -2280, 700, 3, 5], ['mossgator', 32, -2140, 650, 3, 6], ['mossgator', 33, -2310, 520, 3, 5], ['mossgator', 33, -2240, 720, 3, 5]],
  chests: [['gm1', -2320, 700, 900, [['marsh_pearl', 1], ['red_m', 3]], 'in the north-west reeds'], ['gm2', -2100, 500, 800, [['forge_crystal', 4], ['blue_m', 3]], 'by the south-east trees']],
  look: marshLook, arrive: { x: -2072, z: 600, face: -Math.PI / 2 }, tick: tickOf('glowmarsh', 0.05, true) }));
out.push(land({ id: 'fenwood', name: 'Fenwood', lv: 'Lv. 32–35', min: 32, title: 'Fenwood Expert', bonus: { atk: 18 }, bonusText: '+18 Attack', kinds: ['fenowl', 'sporebat', 'mudcrab'], cx: -2200, cz: 1000, seed: 93003, amp: 2.4,
  ponds: [{ x: -2240, z: 1040, r: 9, base: 0.1, level: -0.35 }, { x: -2150, z: 960, r: 7, base: 0.1, level: -0.35 }],
  style: Object.assign({}, MARSH, { trees: 170, tree: 'pine' }), roads: [[[-2200, 868], [-2190, 940], [-2210, 1010], [-2200, 1100]]],
  gates: [g2('fw_s', -2200, 862, 'glowmarsh', -2200, 728, Math.PI, 'GLOW MARSH', LV('Glow Marsh', 'Lv. 30–33'))],
  way: { id: 'fenwood', name: 'Fenwood', x: -2188, z: 890 },
  camps: [['fenowl', 33, -2150, 920, 3, 6], ['fenowl', 34, -2260, 980, 3, 6], ['sporebat', 34, -2140, 1040, 3, 6], ['sporebat', 34, -2270, 1080, 3, 5], ['mudcrab', 35, -2200, 1060, 3, 5], ['mudcrab', 35, -2120, 1100, 3, 5]],
  chests: [['fw1', -2290, 1110, 1000, [['marsh_pearl', 1], ['ruby', 1]], 'deep in the north-west woods']],
  look: { fog: 0x7a9a80, near: 30, far: 120, sun: 0.38 }, arrive: { x: -2200, z: 872, face: 0 }, tick: tickOf('fenwood', 0.04, true) }));
out.push(land({ id: 'lilybog', name: 'Lily Bog', lv: 'Lv. 34–37', min: 34, title: 'Bog Expert', bonus: { def: 18 }, bonusText: '+18 Defense', kinds: ['marshwisp', 'bogtoad', 'thornlizard'], cx: -2700, cz: 600, seed: 93004, amp: 1.4,
  ponds: [{ x: -2700, z: 600, r: 24, base: 0.1, level: -0.35 }, { x: -2640, z: 520, r: 10, base: 0.1, level: -0.35 }, { x: -2770, z: 680, r: 10, base: 0.1, level: -0.35 }, { x: -2780, z: 520, r: 8, base: 0.1, level: -0.35 }],
  style: Object.assign({}, MARSH, { trees: 80 }), roads: [[[-2568, 600], [-2620, 640], [-2700, 650], [-2700, 732]]],
  gates: [g2('lb_e', -2562, 600, 'glowmarsh', -2328, 600, Math.PI / 2, 'GLOW MARSH', LV('Glow Marsh', 'Lv. 30–33')), g2('lb_n', -2700, 738, 'shroomcave', -2603, 1000, -Math.PI / 2, 'MUSHROOM HOLLOW', LV('Mushroom Hollow', 'Lv. 36–38 · Boss'))],
  way: { id: 'lilybog', name: 'Lily Bog', x: -2585, z: 612 },
  camps: [['marshwisp', 35, -2630, 580, 4, 6], ['marshwisp', 36, -2760, 600, 4, 6], ['bogtoad', 36, -2660, 690, 3, 6], ['bogtoad', 36, -2770, 560, 3, 5], ['thornlizard', 37, -2620, 500, 3, 5], ['thornlizard', 37, -2800, 700, 3, 5]],
  chests: [['lb1', -2820, 500, 1100, [['marsh_pearl', 2], ['forge_crystal', 5]], 'on the far south-west bank']],
  look: marshLook, arrive: { x: -2572, z: 600, face: -Math.PI / 2 }, tick: tickOf('lilybog', 0.05, true) }));
out.push(land({ id: 'shroomcave', name: 'Mushroom Hollow', lv: 'Lv. 36–38 · Boss', min: 36, title: 'Hollow Expert', bonus: { hp: 300 }, bonusText: '+300 Max HP', kinds: ['sporebat', 'marshwisp', 'bogtoad'], cx: MC.cx, cz: MC.cz, seed: 93005,
  rooms: ROOMS(MC.cx, MC.cz), halls: HALLS,
  style: { tex: 'cave', tint: (x, z, c) => { c[0] *= 0.78; c[1] *= 0.66; c[2] *= 0.9; }, mini: { out: '#2a1a32', in: '#6a5a7a', rim: '#3a2a42', tree: '#3a2a42' }, drift: [0xd8a8ff, 0.2, true] },
  gates: [{ id: 'mc_out', x: MC.cx + 112, z: MC.cz, to: 'lilybog', tx: -2700, tz: 728, face: Math.PI, sign: 'LILY BOG', hole: true }],
  camps: [['sporebat', 36, MC.cx + 58, MC.cz + 6, 3, 5], ['marshwisp', 36, MC.cx + 12, MC.cz - 14, 3, 6], ['bogtoad', 37, MC.cx + 18, MC.cz - 22, 2, 4], ['sporebat', 37, MC.cx - 36, MC.cz + 4, 3, 5], ['bogtoad', 37, MC.cx - 40, MC.cz, 2, 4], ['mother_morel', 38, MC.cx - 100, MC.cz, 1, 0]],
  look: { fog: 0x241a2c, near: 12, far: 60, sun: 0.34, under: true }, arrive: { x: MC.cx + 100, z: MC.cz, face: -Math.PI / 2 },
  extras(o) { o.fx.spin = []; for (const r of o.rooms) for (let i = 0; i < 5; i++) { const a = R() * 6.28, x = r.x + Math.cos(a) * (r.r - 2), z = r.z + Math.sin(a) * (r.r - 2), y = K.height(x, z), s = 0.8 + R() * 1.4; put(0xf0e8d8, geoCyl(0.25 * s, 0.35 * s, 1.6 * s, 8), mtx(x, y + 0.8 * s, z)); put(0xb88ae0, new THREE.SphereGeometry(1.1 * s, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mtx(x, y + 1.5 * s, z)); const gl = glow(2.4 * s); gl.position.set(x, y + 2 * s, z); gl.material.color = new THREE.Color(0xc8a8ff); gl.material.opacity = 0.35; K.root.add(gl); } },
  tick: tickOf('shroomcave', 0.05, true) }));
// --- Chapter 5: the Sky Kingdom (islands over a sea of clouds)
out.push(land({ id: 'cloudisle', name: 'Cloud Isle', lv: 'Lv. 38–41', min: 38, title: 'Cloud Expert', bonus: { mp: 160 }, bonusText: '+160 Max MP', kinds: ['puffcloud', 'skyowl', 'windbird'], cx: -3300, cz: 600, seed: 94001, sea: true, seaCol: 0xf4f8ff, amp: 2,
  style: SKY, roads: [[[-3300, 610], [-3300, 680], [-3300, 732]], [[-3300, 610], [-3380, 600], [-3432, 600]]],
  gates: [g2('ci_n', -3300, 738, 'windspire', -3300, 872, 0, 'WINDSPIRE', LV('Windspire', 'Lv. 40–43')), g2('ci_w', -3438, 600, 'starfield', -3672, 600, -Math.PI / 2, 'STARFIELD', LV('Starfield', 'Lv. 43–46'))],
  way: { id: 'cloudisle', name: 'Cloud Isle', x: -3288, z: 580 },
  npcs: [{ id: 'zephyr2', look: 'zephyr', name: 'Captain Zephyr', role: 'Balloon pilot', x: -3282, z: 618, face: -2.4, lines: ['Back down to Sunhaven?'] }],
  camps: [['puffcloud', 38, -3250, 560, 4, 6], ['puffcloud', 39, -3350, 660, 4, 6], ['skyowl', 39, -3240, 680, 3, 5], ['skyowl', 40, -3380, 520, 3, 5], ['windbird', 40, -3220, 500, 3, 5], ['windbird', 41, -3390, 700, 3, 5]],
  chests: [['ci1', -3400, 500, 1300, [['sky_gem', 1], ['red_m', 4]], 'on the south-west cliff']],
  look: skyLook, arrive: { x: -3300, z: 628, face: Math.PI },
  clear: [[-3300, 620, 12]],
  extras(o) { o.fx.balloon = balloonModel(); const y = K.height(-3292, 640); o.fx.balloon.position.set(-3292, y, 640); o.fx.balloon.userData.y = y; K.root.add(o.fx.balloon); K.addCollider(-3292, 640, 1.2); },
  tick: tickOf('cloudisle', 0.4) }));
out.push(land({ id: 'windspire', name: 'Windspire', lv: 'Lv. 40–43', min: 40, title: 'Wind Expert', bonus: { crit: 0.05 }, bonusText: '+5% Critical', kinds: ['stormbat', 'thunderbun', 'galehawk'], cx: -3300, cz: 1000, seed: 94002, sea: true, seaCol: 0xf4f8ff, amp: 3,
  hill: (x, z) => Math.max(0, 1 - Math.hypot(x + 3300, z - 1040) / 90) * 16,
  style: Object.assign({}, SKY, { trees: 30, rocks: 40, rimRock: true }), roads: [[[-3300, 868], [-3290, 940], [-3310, 1000]]],
  gates: [g2('ws_s', -3300, 862, 'cloudisle', -3300, 728, Math.PI, 'CLOUD ISLE', LV('Cloud Isle', 'Lv. 38–41'))],
  way: { id: 'windspire', name: 'Windspire', x: -3288, z: 890 },
  camps: [['stormbat', 41, -3250, 940, 3, 6], ['stormbat', 41, -3360, 960, 3, 6], ['thunderbun', 42, -3240, 1060, 4, 6], ['thunderbun', 42, -3360, 1080, 3, 5], ['galehawk', 43, -3300, 1120, 3, 5], ['galehawk', 43, -3220, 1000, 3, 5]],
  chests: [['ws1', -3300, 1060, 1500, [['sky_gem', 1], ['ruby', 2]], 'at the very top of the spire']],
  look: Object.assign({}, skyLook, { fog: 0xd8e4f8 }), arrive: { x: -3300, z: 872, face: 0 }, tick: tickOf('windspire', 1.0) }));
out.push(land({ id: 'starfield', name: 'Starfield', lv: 'Lv. 43–46', min: 43, title: 'Star Expert', bonus: { atk: 24 }, bonusText: '+24 Attack', kinds: ['starjelly', 'moonowl', 'cometail'], cx: -3800, cz: 600, seed: 94003, sea: true, seaCol: 0x8a8ac8, amp: 2,
  style: Object.assign({}, SKY, { tint: (x, z, c) => { c[0] *= 0.7; c[1] *= 0.72; c[2] *= 1.0; }, flowers: [0xffffaa, 0xc8a8ff, 0xffffff], tufts: 0x5a6aa0, mini: { out: '#3a3a6a', in: '#6a7ab0', rim: '#5a6a9a', tree: '#2a3a6a' }, drift: [0xffffaa, 0.35, true] }),
  roads: [[[-3668, 600], [-3740, 610], [-3800, 640], [-3800, 732]]],
  gates: [g2('sf_e', -3662, 600, 'cloudisle', -3428, 600, Math.PI / 2, 'CLOUD ISLE', LV('Cloud Isle', 'Lv. 38–41')), g2('sf_n', -3800, 738, 'skypalace', -3703, 1000, -Math.PI / 2, 'SKY PALACE', LV('Sky Palace', 'Lv. 46–50 · Boss'))],
  way: { id: 'starfield', name: 'Starfield', x: -3685, z: 612 },
  camps: [['starjelly', 44, -3740, 560, 4, 6], ['starjelly', 44, -3860, 640, 3, 5], ['moonowl', 45, -3760, 680, 3, 5], ['moonowl', 45, -3880, 540, 3, 5], ['cometail', 46, -3830, 700, 3, 5], ['cometail', 46, -3720, 500, 3, 5]],
  chests: [['sf1', -3900, 700, 1700, [['sky_gem', 2], ['ruby', 2]], 'by the north-west star stones']],
  look: { fog: 0x2a2a5a, near: 50, far: 190, sun: 0.4 }, arrive: { x: -3672, z: 600, face: -Math.PI / 2 },
  extras(o) { o.fx.spin = []; for (let i = 0; i < 14; i++) { const a = R() * 6.28, d = 30 + R() * 90, x = -3800 + Math.cos(a) * d, z = 600 + Math.sin(a) * d; if (o.edge(x, z) > -6) continue; const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.7, 0), RW.lam(0xffffaa, null, { emissive: 0x8a8a20 })); s.position.set(x, K.height(x, z) + 2.6, z); K.root.add(s); o.fx.spin.push(s); } },
  tick: tickOf('starfield', 0.1, true) }));
out.push(land({ id: 'skypalace', name: 'Sky Palace', lv: 'Lv. 46–50 · Boss', min: 46, title: 'Palace Expert', bonus: { atk: 30, def: 20 }, bonusText: '+30 Attack, +20 Defense', kinds: ['stormbat', 'galehawk', 'cometail'], cx: SP.cx, cz: SP.cz, seed: 94004,
  rooms: ROOMS(SP.cx, SP.cz), halls: HALLS,
  style: { tex: 'cave', tint: (x, z, c) => { c[0] *= 1.25; c[1] *= 1.2; c[2] *= 1.1; }, mini: { out: '#c8d8f0', in: '#fff8e0', rim: '#e8e0c8', tree: '#e8e0c8' }, drift: [0xffffff, 0.25, false] },
  gates: [{ id: 'sp_out', x: SP.cx + 112, z: SP.cz, to: 'starfield', tx: -3800, tz: 728, face: Math.PI, sign: 'STARFIELD', hole: true }],
  camps: [['stormbat', 46, SP.cx + 58, SP.cz + 6, 3, 5], ['galehawk', 47, SP.cx + 12, SP.cz - 14, 3, 6], ['cometail', 47, SP.cx + 18, SP.cz - 22, 2, 4], ['galehawk', 48, SP.cx - 36, SP.cz + 4, 3, 5], ['cometail', 48, SP.cx - 40, SP.cz, 2, 4], ['storm_king', 50, SP.cx - 100, SP.cz, 1, 0]],
  look: { fog: 0xc8d4ec, near: 18, far: 80, sun: 0.6, under: true }, arrive: { x: SP.cx + 100, z: SP.cz, face: -Math.PI / 2 },
  extras(o) { for (const r of o.rooms) for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, x = r.x + Math.cos(a) * (r.r - 1.5), z = r.z + Math.sin(a) * (r.r - 1.5), y = K.height(x, z); if (o.edge(x, z) > -0.5) continue; put(0xfff8e8, geoCyl(0.5, 0.6, 7, 10), mtx(x, y + 3.5, z)); put(0xffd84d, geoCyl(0.75, 0.75, 0.4, 10), mtx(x, y + 7.1, z)); } },
  tick: tickOf('skypalace', 0.1) }));
// --- the Challenge Tower: one big round hall
out.push(land({ id: 'tower', name: 'Challenge Tower', lv: 'Lv. 30+ · Floors', min: 1, cx: TW.cx, cz: TW.cz, seed: 95001,
  rooms: [{ x: TW.cx + 44, z: TW.cz, r: 10 }, { x: TW.cx, z: TW.cz, r: 28 }], halls: [[0, 1, 4.4]],
  style: { tex: 'cave', tint: (x, z, c) => { c[0] *= 0.95; c[1] *= 0.9; c[2] *= 1.05; }, mini: { out: '#2a2a3a', in: '#8a8aa0', rim: '#4a4a5a', tree: '#4a4a5a' }, drift: [0xffd84d, 0.18, true] },
  gates: [{ id: 'tw_out', x: TW.cx + 52, z: TW.cz, to: 'sunhaven', tx: -1700, tz: 740, face: Math.PI, sign: 'SUNHAVEN', hole: true }],
  npcs: [{ id: 'orin2', look: 'orin', name: 'Sage Orin', role: 'Tower keeper', x: TW.cx + 46, z: TW.cz + 5, face: -Math.PI / 2 - 0.4, lines: ['Ready for the next floor?'] }],
  look: { fog: 0x1a1a2a, near: 18, far: 70, sun: 0.42, under: true }, arrive: { x: TW.cx + 42, z: TW.cz, face: -Math.PI / 2 },
  extras(o) { for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, x = TW.cx + Math.cos(a) * 26, z = TW.cz + Math.sin(a) * 26, y = K.height(x, z); put(0x8a8aa0, geoCyl(0.7, 0.9, 9, 10), mtx(x, y + 4.5, z)); const gl = glow(2.6); gl.position.set(x, y + 9.5, z); gl.material.color = new THREE.Color(0xffd84d); gl.material.opacity = 0.5; K.root.add(gl); } },
  tick: tickOf('tower', 0.05, true) }));
for (const o of out) D0.LANDS[o.id] = o;
// the mushroom walls and cloud walls of the two new dungeons
for (const id of ['shroomcave', 'skypalace']) {
  D0.DOORS[id] = [];
  const rooms = D0.LANDS[id].rooms;
  for (let i = 0; i < 3; i++) { const a = rooms[i + 1], b = rooms[i + 2], mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, Dd = { i, x: mx, z: mz, r: 5.2, open: false }; Dd.on = () => !Dd.open; D0.DOORS[id].push(Dd); D0.BLOCKS[id].push(Dd); }
}
RW.LANDS2 = { SUN, MC, SP, TW, balloonModel, ids4: ['sunhaven', 'glowmarsh', 'fenwood', 'lilybog', 'shroomcave'], ids5: ['cloudisle', 'windspire', 'starfield', 'skypalace'] };
void coral;
})();
