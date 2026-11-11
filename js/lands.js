// Russel World v1.4: the new lands of Chapter 2 (Coralcove and the islands) and Chapter 3 (Frostpeak and the snow).
// Data first (items, monsters, sets, pets), then the maps. Everything is added through RW.world.addLand, far west of the old world (x < -1200).
// Runs after world.js and before game.js, so the game sees the new areas, NPCs and gates from the start.
(function () {
'use strict';
const RW = window.RW;
if (!RW || RW.failed || !RW.world || !RW.mkit) return;
const { THREE, V3, mtx, mdir, part, lam, geoSphere, geoCyl, geoCone, geoBox, cachedGeo, glow, isTouch, canvasTex, bake, freeze, ell, strokes } = RW;
const W = RW.world, K = W.kit, MK = RW.mkit;
const { ITEMS, KINDS, CAMPS_BY_MAP, AREAS, CHESTS, TITLES, PETS, PET_EGGS } = RW;
const { smoothstep, vnoise3, lerp, clamp, rimRise, superEdge } = K;
const R = () => RW.R();
const hexS = (h) => '#' + h.toString(16).padStart(6, '0');

// ======================================================================= items
Object.assign(ITEMS.warm_tea, { warm: 90, desc: 'A hot cup of tea. Thaws you out, and keeps you warm (no freezing) for 90 seconds in the snow.' });
Object.assign(ITEMS, {
  // fishing (delivery 14): caught with Nora's rod. Every fish is pet food, and sells well
  fishing_rod: { name: 'Fishing Rod', kind: 'quest', rarity: 'rare', sell: 0, icon: 'rod', color: '#b07a45', desc: 'Nora\'s old bamboo rod. Click a fishing spot (the blue ripples) to fish.' },
  minnow: { name: 'Silver Minnow', kind: 'material', fish: 'pond', rarity: 'common', sell: 8, food: 15, icon: 'fish', color: '#c9d6e0', desc: 'A tiny, quick fish. Pets gulp it down.' },
  sunperch: { name: 'Sun Perch', kind: 'material', fish: 'pond', rarity: 'common', sell: 14, food: 22, icon: 'fish', color: '#f2b63d', desc: 'A round yellow fish that loves warm ponds.' },
  mosscarp: { name: 'Mossy Carp', kind: 'material', fish: 'pond', rarity: 'common', sell: 22, food: 30, icon: 'fish', color: '#6f9a4a', desc: 'An old, slow carp with moss on its back.' },
  trout: { name: 'Rainbow Trout', kind: 'material', fish: 'river', rarity: 'common', sell: 24, food: 30, icon: 'fish', color: '#e88aa8', desc: 'Shines every colour when it jumps.' },
  catfish: { name: 'Whisker Catfish', kind: 'material', fish: 'river', rarity: 'common', sell: 30, food: 38, icon: 'fish', color: '#8a6a4a', desc: 'It has a grumpy face and very long whiskers.' },
  eel: { name: 'Ribbon Eel', kind: 'material', fish: 'river', rarity: 'common', sell: 34, food: 35, icon: 'fish', color: '#4a6a8a', desc: 'Long, wiggly and hard to hold.' },
  sardine: { name: 'Sea Sardine', kind: 'material', fish: 'sea', rarity: 'common', sell: 26, food: 30, icon: 'fish', color: '#9ab8d8', desc: 'Small sea fish that swim in big shiny groups.' },
  clownfish: { name: 'Coral Clownfish', kind: 'material', fish: 'sea', rarity: 'common', sell: 40, food: 35, fun: 10, icon: 'fish', color: '#ff8a3d', desc: 'Orange with white stripes. Very cheerful.' },
  squid: { name: 'Baby Squid', kind: 'material', fish: 'sea', rarity: 'common', sell: 46, food: 42, icon: 'fish', color: '#f0c8d8', desc: 'Squirts a little ink when surprised.' },
  icefish: { name: 'Ice Fish', kind: 'material', fish: 'ice', rarity: 'common', sell: 50, food: 45, icon: 'fish', color: '#bfe8ff', desc: 'See-through and cold. Lives under the ice.' },
  snowsalmon: { name: 'Snow Salmon', kind: 'material', fish: 'ice', rarity: 'common', sell: 62, food: 60, icon: 'fish', color: '#ff9a7a', desc: 'A fat pink salmon. The best pet dinner.' },
  golden_koi: { name: 'Golden Koi', kind: 'material', fish: 'pond', rarity: 'epic', sell: 400, food: 80, fun: 30, icon: 'fish', color: '#ffd84d', desc: 'A rare golden fish. They say it brings luck to the whole town.' },
  moon_ray: { name: 'Moonlight Ray', kind: 'material', fish: 'sea', rarity: 'epic', sell: 520, food: 80, fun: 30, icon: 'fish', color: '#b8a8ff', desc: 'A glowing ray that only bites at night.' },
  crystal_carp: { name: 'Crystal Carp', kind: 'material', fish: 'ice', rarity: 'legendary', sell: 800, food: 100, fun: 40, icon: 'fish', color: '#9fd8ff', desc: 'A carp made of living ice. Almost nobody has seen one.' },
  // crafting (delivery 15)
  light_shard: { name: 'Light Shard', kind: 'material', rarity: 'rare', sell: 60, icon: 'shard', color: '#fff1a8', desc: 'A warm little piece of light. Bosses, the big chest and good deeds give them. Mira and Bolt know what to do with them.' },
  light_charm: { name: 'Light Charm', kind: 'material', rarity: 'epic', sell: 120, icon: 'shard', color: '#ffd84d', desc: 'Keep it in your bag while enhancing gear at +6 or more: if the hammer slips, the charm breaks instead of your luck.' },
  fish_stew: { name: 'Fish Stew', kind: 'material', rarity: 'common', sell: 30, food: 75, fun: 10, icon: 'bowl', color: '#e8a35a', desc: 'Mira\'s hot fish stew. A big pet meal.' },
  tropic_mix: { name: 'Tropical Mix', kind: 'material', rarity: 'common', sell: 40, food: 60, fun: 30, icon: 'bowl', color: '#ffb43d', desc: 'Coconut and banana mash. Pets go wild for it.' },
  frost_pie: { name: 'Snowberry Pie', kind: 'material', rarity: 'common', sell: 55, food: 90, fun: 25, icon: 'bowl', color: '#c8a8ff', desc: 'A warm pie with cold berries. Fills up any pet.' },
  // Chapter 2 materials
  sand_shell: { name: 'Sand Shell', kind: 'material', rarity: 'common', sell: 28, icon: 'cap', color: '#e8c890', desc: 'A sandy crab shell, still warm from the sun.' },
  jelly_ribbon: { name: 'Jelly Ribbon', kind: 'material', rarity: 'common', sell: 30, food: 16, icon: 'jelly', color: '#ffb3d0', desc: 'A wobbly pink jellyfish ribbon. Tingles a little.' },
  coconut: { name: 'Coconut', kind: 'material', rarity: 'common', sell: 26, food: 30, icon: 'berry', color: '#8a5a35', desc: 'A hard brown coconut. It used to be a Cocobonk.' },
  sea_star: { name: 'Sea Star', kind: 'material', rarity: 'common', sell: 34, icon: 'clover', color: '#ff9a5a', desc: 'A dried starfish arm. Pretty on a shelf.' },
  puffer_spine: { name: 'Puffer Spine', kind: 'material', rarity: 'common', sell: 36, icon: 'quill', color: '#f2d36b', desc: 'A sharp yellow spine. Do not sit on it.' },
  coral_branch: { name: 'Coral Branch', kind: 'material', rarity: 'rare', sell: 180, icon: 'leaf', color: '#ff7a8a', desc: 'A bright pink branch of coral. Bolt loves it.' },
  banana: { name: 'Banana', kind: 'material', rarity: 'common', sell: 30, food: 35, fun: 10, icon: 'leaf', color: '#ffe070', desc: 'A Monkling\'s snack. Now your snack.' },
  parrot_plume: { name: 'Parrot Plume', kind: 'material', rarity: 'common', sell: 40, icon: 'quill', color: '#e84a4a', desc: 'A long red feather from a Parrotto.' },
  lagoon_moss: { name: 'Lagoon Moss', kind: 'material', rarity: 'common', sell: 38, food: 18, icon: 'jelly', color: '#5fbfb0', desc: 'Soft blue-green moss from the lagoon.' },
  clam_pearl: { name: 'Clam Pearl', kind: 'material', rarity: 'rare', sell: 220, icon: 'gem', color: '#fff6ff', desc: 'A big round pearl with a pink glow.' },
  magma_chip: { name: 'Magma Chip', kind: 'material', rarity: 'common', sell: 44, icon: 'gem', color: '#e85a2a', desc: 'A hot little rock. Hold it with a leaf.' },
  cinder_scale: { name: 'Cinder Scale', kind: 'material', rarity: 'common', sell: 46, icon: 'cap', color: '#c0402a', desc: 'A red lizard scale that never cools down.' },
  fire_opal: { name: 'Fire Opal', kind: 'material', rarity: 'rare', sell: 260, icon: 'gem', color: '#ff8a3d', desc: 'A stone with a tiny fire dancing inside.' },
  tide_crown: { name: 'Tide Crown', kind: 'material', rarity: 'epic', sell: 500, icon: 'gem', color: '#7cc4ff', desc: 'The coral crown of the Tidecrab King. It still smells like the sea.' },
  // Chapter 3 materials
  snow_fluff: { name: 'Snow Fluff', kind: 'material', rarity: 'common', sell: 48, icon: 'fluff', color: '#ffffff', desc: 'Soft fur from a Snowbun. Warmer than it looks.' },
  frost_jelly: { name: 'Frost Jelly', kind: 'material', rarity: 'common', sell: 50, food: 20, icon: 'jelly', color: '#bfe8ff', desc: 'Cold blue jelly. Pets eat it slowly.' },
  wolf_fur: { name: 'Pinewolf Fur', kind: 'material', rarity: 'common', sell: 56, icon: 'fluff', color: '#9aa5b0', desc: 'Thick grey fur from a Pinewolf.' },
  snow_plume: { name: 'Snow Plume', kind: 'material', rarity: 'common', sell: 54, icon: 'quill', color: '#f4f8ff', desc: 'A white owl feather that never gets wet.' },
  penguin_down: { name: 'Penguin Down', kind: 'material', rarity: 'common', sell: 58, icon: 'fluff', color: '#e8eef4', desc: 'Fluffy grey chick feathers.' },
  ice_chip: { name: 'Ice Chip', kind: 'material', rarity: 'common', sell: 60, icon: 'gem', color: '#9fd8ff', desc: 'A piece of ice that does not melt.' },
  yeti_fur: { name: 'Yeti Fur', kind: 'material', rarity: 'common', sell: 66, icon: 'fluff', color: '#e0e8f0', desc: 'Long shaggy white fur.' },
  storm_feather: { name: 'Storm Feather', kind: 'material', rarity: 'common', sell: 64, icon: 'quill', color: '#9ab8e8', desc: 'It crackles a little when you touch it.' },
  snow_crystal: { name: 'Snow Crystal', kind: 'material', rarity: 'rare', sell: 300, icon: 'gem', color: '#e0f4ff', desc: 'A perfect snowflake turned into a gem.' },
  frost_heart: { name: 'Frost Heart', kind: 'material', rarity: 'epic', sell: 650, icon: 'gem', color: '#7cc4ff', desc: 'The cold blue heart of the Frost Yeti. It hums a lullaby.' },
  // new eggs
  tide_egg: { name: 'Tide Egg', kind: 'egg', egg: 'tide', rarity: 'epic', sell: 0, price: 900, icon: 'egg', color: '#7cc4ff', desc: 'A sea-blue egg with sandy spots. A tropical pet sleeps inside.' },
  frost_egg: { name: 'Frost Egg', kind: 'egg', egg: 'frost', rarity: 'epic', sell: 0, price: 1500, icon: 'egg', color: '#e0f4ff', desc: 'A cold white egg with blue swirls. A snow pet sleeps inside.' }
});

// ======================================================================= monster models
const FC = {};
const face = (key, hex) => FC[key] || (FC[key] = MK.faceSet(key, 512, 256, MK.solidBase(hexS(hex)), 128, 112, 22, 1.0));
function headOf(body, key, hex, r, x, y, z) { const faces = face(key, hex), mat = new THREE.MeshLambertMaterial({ map: faces.normal }); part(geoSphere(r, 20, 14), mat, 0.02, body, x, y, z); return { mat, faces }; }
const spikes = (body, n, r, cy, col, len) => { for (let i = 0; i < n; i++) { const a = i * 2.4, el = -0.6 + (i % 5) * 0.35, d = V3(Math.sin(a) * Math.cos(el), Math.sin(el), Math.cos(a) * Math.cos(el)); const c = part(geoCone(0.05, len || 0.2, 5), lam(col), 0.008, body, d.x * r, cy + d.y * r, d.z * r); c.quaternion.setFromUnitVectors(V3(0, 1, 0), d); } };
const crown = (body, y, s, col) => { for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; part(geoCone(0.07 * s, 0.22 * s, 5), lam(col || 0xffd84d, null, { emissive: 0x6a4a00 }), 0.01, body, Math.cos(a) * 0.16 * s, y, Math.sin(a) * 0.16 * s); } part(geoCyl(0.19 * s, 0.19 * s, 0.07 * s, 12), lam(col || 0xffd84d, null, { emissive: 0x6a4a00 }), 0.01, body, 0, y - 0.08 * s, 0); };
function bCrab(key, shell, claw, king) {
  const { root, body } = MK.mk();
  part(geoSphere(0.42, 18, 12), lam(shell), 0.02, body, 0, 0.36, -0.05).scale.set(1.3, 0.6, 1);
  const H = headOf(body, key, shell, 0.24, 0, 0.5, 0.26);
  for (const s of [1, -1]) {
    part(geoCyl(0.04, 0.05, 0.3, 6), lam(claw), 0.01, body, 0.36 * s, 0.4, 0.24).rotation.z = 1.1 * s;
    part(geoSphere(0.16, 12, 8), lam(claw), 0.015, body, 0.52 * s, 0.46, 0.34).scale.set(1, 0.75, 1.35);
    part(geoCone(0.07, 0.18, 6), lam(claw), 0.01, body, 0.52 * s, 0.5, 0.56).rotation.x = Math.PI / 2;
    for (let i = 0; i < 3; i++) part(geoCyl(0.025, 0.02, 0.36, 5), lam(claw), 0.008, body, 0.42 * s, 0.18, -0.18 + i * 0.16).rotation.z = 0.9 * s;
    part(geoCyl(0.02, 0.02, 0.2, 5), lam(shell), 0, body, 0.09 * s, 0.75, 0.3);
  }
  if (king) { crown(body, 0.82, 1.3, 0xff7a8a); for (let i = 0; i < 6; i++) part(geoCone(0.05, 0.22, 5), lam(0xff7a8a), 0.008, body, -0.4 + i * 0.16, 0.6, -0.25).rotation.x = -0.4; }
  return MK.fin({ root, body, mat: H.mat, faces: H.faces, legs: [] }, 0.5, 0.24);
}
function bJelly(key, col, frost) {
  const { root, body } = MK.mk();
  const H = headOf(body, key, col, 0.4, 0, 0.95, 0); body.children[body.children.length - 1].scale.set(1, 0.85, 1);
  const tm = lam(new THREE.Color(col).lerp(new THREE.Color(0xffffff), 0.35).getHex());
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, t = part(geoCyl(0.035, 0.015, 0.6, 5), tm, 0.006, body, Math.cos(a) * 0.24, 0.45, Math.sin(a) * 0.24); t.rotation.z = Math.cos(a) * 0.2; }
  if (frost) for (let i = 0; i < 3; i++) { const f = part(geoBox(0.42, 0.06, 0.06), lam(0xffffff, null, { emissive: 0x2a5a80 }), 0.006, body, 0, 1.36, 0); f.rotation.y = i * Math.PI / 3; }
  else part(geoSphere(0.12, 10, 8), lam(0xffffff), 0, body, -0.14, 1.2, 0.2).scale.set(1, 0.5, 0.6);
  return MK.fin({ root, body, mat: H.mat, faces: H.faces, legs: [] }, 0.95, 0.4);
}
function bCoco() {
  const { root, body } = MK.mk();
  const H = headOf(body, 'coco', 0x8a5a35, 0.42, 0, 0.46, 0);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2, l = part(geoSphere(0.16, 10, 8), lam(0x5fae45), 0.01, body, Math.cos(a) * 0.18, 0.92, Math.sin(a) * 0.18); l.scale.set(0.5, 0.15, 1.6); l.rotation.y = -a; l.rotation.x = 0.4; }
  for (const s of [1, -1]) part(geoSphere(0.1, 8, 6), lam(0x6a4a2a), 0.01, body, 0.18 * s, 0.06, 0.08).scale.set(1, 0.6, 1.4);
  return MK.fin({ root, body, mat: H.mat, faces: H.faces, legs: [] }, 0.46, 0.42);
}
function bStar() {
  const { root, body } = MK.mk();
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2, arm = part(geoSphere(0.2, 12, 8), lam(0xff8a4a), 0.015, body, Math.sin(a) * 0.32, 0.14, Math.cos(a) * 0.32); arm.scale.set(0.6, 0.35, 1.8); arm.rotation.y = a; }
  const H = headOf(body, 'star', 0xff9a5a, 0.24, 0, 0.32, 0.08);
  return MK.fin({ root, body, mat: H.mat, faces: H.faces, legs: [] }, 0.3, 0.24);
}
function bPuffer() {
  const { root, body } = MK.mk();
  const H = headOf(body, 'puffer', 0xf2d36b, 0.42, 0, 0.9, 0);
  spikes(body, 18, 0.4, 0.9, 0xd9a83a, 0.2);
  for (const s of [1, -1]) part(geoSphere(0.12, 8, 6), lam(0xff9a5a), 0.01, body, 0.44 * s, 0.9, -0.05).scale.set(0.3, 0.9, 0.7);
  part(geoCone(0.14, 0.24, 6), lam(0xff9a5a), 0.01, body, 0, 0.9, -0.5).rotation.x = -Math.PI / 2;
  return MK.fin({ root, body, mat: H.mat, faces: H.faces, legs: [] }, 0.9, 0.42);
}
function bMonkey() {
  const { root, body } = MK.mk(), fur = lam(0x8a5a35);
  part(geoSphere(0.32, 16, 12), fur, 0.02, body, 0, 0.42, -0.04).scale.set(1, 1.05, 0.95);
  part(geoSphere(0.2, 12, 8), lam(0xe8c8a0), 0, body, 0, 0.4, 0.14).scale.set(1, 1.1, 0.6);
  const H = headOf(body, 'monkey', 0xd9a878, 0.28, 0, 0.88, 0.1);
  for (const s of [1, -1]) { part(geoSphere(0.1, 10, 8), fur, 0.01, body, 0.3 * s, 0.94, 0.04).scale.set(0.5, 1, 1); part(geoCyl(0.05, 0.05, 0.4, 6), fur, 0.01, body, 0.3 * s, 0.4, 0.06).rotation.z = 0.4 * s; }
  const tail = new THREE.Group(); tail.position.set(0, 0.3, -0.3); tail.userData.live = true; body.add(tail);
  for (let i = 0; i < 5; i++) part(geoSphere(0.06, 8, 6), fur, 0.008, tail, 0, i * 0.1, -i * 0.06);
  part(geoSphere(0.11, 8, 6), lam(0xffe070), 0.01, body, 0.24, 0.5, 0.2).scale.set(0.5, 1.4, 0.5);
  return MK.fin({ root, body, mat: H.mat, faces: H.faces, tail, pouch: null, legs: [] }, 0.88, 0.28);
}
function bBird(key, col, belly, wingCol, crest) {
  const { root, body } = MK.mk();
  part(geoSphere(0.32, 18, 12), lam(col), 0.02, body, 0, 0, -0.1).scale.set(0.95, 0.9, 1.25);
  part(geoSphere(0.2, 12, 8), lam(belly), 0, body, 0, -0.08, 0.06).scale.set(1, 1.1, 0.8);
  const H = headOf(body, key, col, 0.25, 0, 0.3, 0.2);
  part(geoCone(0.08, 0.2, 6), lam(0x3b3b3b), 0.01, body, 0, 0.25, 0.48).rotation.x = Math.PI / 2 + 0.3;
  for (let i = 0; i < 3; i++) part(geoCone(0.05, 0.22, 5), lam(crest), 0.01, body, 0, 0.56 + i * 0.02, 0.12 - i * 0.1).rotation.x = -0.5 - i * 0.2;
  for (const s of [-1, 0, 1]) { const t = part(geoSphere(0.1, 8, 6), lam(wingCol), 0.01, body, s * 0.08, 0.02, -0.55); t.scale.set(0.5, 0.15, 2.0); t.rotation.y = s * 0.3; }
  const wings = MK.wingPair(body, 0.06, -0.08, 0.2, wingCol, 0.2, 0.24);
  return MK.fin({ root, body, mat: H.mat, faces: H.faces, legs: [], wings, flap: 14 }, 0.3, 0.25);
}
function bFrog(key, col, belly) {
  const { root, body } = MK.mk();
  part(geoSphere(0.42, 18, 12), lam(col), 0.02, body, 0, 0.36, -0.06).scale.set(1.1, 0.8, 1);
  part(geoSphere(0.3, 12, 8), lam(belly), 0, body, 0, 0.3, 0.16).scale.set(1, 0.8, 0.6);
  const H = headOf(body, key, col, 0.3, 0, 0.66, 0.2);
  for (const s of [1, -1]) { part(geoSphere(0.11, 10, 8), lam(col), 0.012, body, 0.17 * s, 0.94, 0.2); part(geoSphere(0.14, 8, 6), lam(col), 0.012, body, 0.34 * s, 0.12, -0.1).scale.set(1, 0.5, 1.6); }
  return MK.fin({ root, body, mat: H.mat, faces: H.faces, legs: [] }, 0.66, 0.3);
}
function bClam() {
  const { root, body } = MK.mk(), sm = lam(0xf0d8e8);
  const lo = part(cachedGeo('clamhalf', () => new THREE.SphereGeometry(0.5, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2)), sm, 0.02, body, 0, 0.3, 0); lo.rotation.x = Math.PI; lo.scale.y = 0.5;
  const hi = part(cachedGeo('clamhalf', () => new THREE.SphereGeometry(0.5, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2)), sm, 0.02, body, 0, 0.36, -0.1); hi.rotation.x = -0.6; hi.scale.y = 0.55;
  for (let i = -2; i <= 2; i++) part(geoBox(0.03, 0.04, 0.8), lam(0xd8a8c8), 0, body, i * 0.16, 0.12, 0).scale.y = 1;
  const H = headOf(body, 'clam', 0xffe8f4, 0.22, 0, 0.44, 0.16);
  part(geoSphere(0.1, 12, 8), lam(0xffffff, null, { emissive: 0x6a4a6a }), 0.01, body, 0.18, 0.4, -0.05);
  return MK.fin({ root, body, mat: H.mat, faces: H.faces, legs: [] }, 0.44, 0.22);
}
function bMagma() {
  const { root, body } = MK.mk();
  part(geoSphere(0.5, 16, 12), lam(0x4a3a36), 0.02, body, 0, 0.5, -0.05).scale.set(1, 0.9, 1);
  const H = headOf(body, 'magma', 0x5a4440, 0.3, 0, 0.62, 0.32);
  const hot = new THREE.MeshLambertMaterial({ color: 0xffa040, emissive: 0xc04010 });
  for (let i = 0; i < 9; i++) { const a = i * 2.2, el = -0.4 + (i % 3) * 0.4; part(geoSphere(0.07, 8, 6), hot, 0, body, Math.sin(a) * 0.5 * Math.cos(el), 0.5 + Math.sin(el) * 0.45, Math.cos(a) * 0.5 * Math.cos(el) - 0.05); }
  const g = glow(1.6); g.position.y = 0.5; g.material.color = new THREE.Color(0xff7a2a); g.material.opacity = 0.35; body.add(g); g.userData.live = true;
  return MK.fin({ root, body, mat: H.mat, faces: H.faces, legs: [] }, 0.62, 0.3);
}
function bLizard(key, col, belly, frost) {
  const { root, body } = MK.mk();
  part(geoSphere(0.3, 16, 12), lam(col), 0.02, body, 0, 0.36, -0.1).scale.set(0.9, 0.75, 1.6);
  const H = headOf(body, key, col, 0.26, 0, 0.56, 0.42);
  part(geoSphere(0.2, 12, 8), lam(belly), 0, body, 0, 0.28, 0.0).scale.set(0.9, 0.5, 1.4);
  const legs = MK.legs4(body, [[0.22, 0.24], [-0.22, 0.24], [0.22, -0.34], [-0.22, -0.34]], 0.28, col, 0.06, 0.28);
  const tail = new THREE.Group(); tail.position.set(0, 0.34, -0.5); tail.userData.live = true; body.add(tail);
  for (let i = 0; i < 4; i++) part(geoSphere(0.12 - i * 0.022, 8, 6), lam(col), 0.008, tail, 0, -i * 0.04, -i * 0.15);
  if (frost) for (const s of [1, -1]) part(geoCone(0.07, 0.24, 6), lam(0xf4f8ff), 0.01, body, 0.12 * s, 0.82, 0.38).rotation.z = -0.3 * s;
  else for (let i = 0; i < 5; i++) part(geoCone(0.04, 0.14, 5), lam(0xffb43d, null, { emissive: 0x7a3a00 }), 0.006, body, 0, 0.6, 0.2 - i * 0.16);
  return MK.fin({ root, body, mat: H.mat, faces: H.faces, legs, tail }, 0.56, 0.26);
}
function bWolf() { return bLizard('wolf', 0x9aa5b0, 0xf0f4f8, true); }
function bOwl(key, col) {
  const { root, body } = MK.mk();
  const H = headOf(body, key, col, 0.42, 0, 0.12, 0); body.children[body.children.length - 1].scale.set(1, 1.08, 0.95);
  for (const s of [1, -1]) { part(geoCone(0.09, 0.22, 5), lam(0xd8e0e8), 0.012, body, 0.24 * s, 0.56, 0.02).rotation.z = -0.35 * s; part(geoSphere(0.16, 10, 8), lam(0xe8eef4), 0.012, body, 0.4 * s, 0.05, -0.04).scale.set(0.35, 1, 0.8); }
  part(geoCone(0.05, 0.12, 5), lam(0xf2b33d), 0.008, body, 0, 0.06, 0.42).rotation.x = Math.PI / 2 + 0.6;
  return MK.fin({ root, body, mat: H.mat, faces: H.faces, legs: [] }, 0.12, 0.42);
}
function bPenguin() {
  const { root, body } = MK.mk();
  part(geoSphere(0.38, 18, 12), lam(0x2f3440), 0.02, body, 0, 0.44, -0.04).scale.set(1, 1.2, 0.95);
  part(geoSphere(0.3, 14, 10), lam(0xf4f4f4), 0, body, 0, 0.4, 0.12).scale.set(0.95, 1.15, 0.7);
  const H = headOf(body, 'penguin', 0xf4f4f4, 0.26, 0, 0.92, 0.08);
  part(geoSphere(0.27, 14, 10), lam(0x2f3440), 0.012, body, 0, 1.0, 0.0).scale.set(1, 0.7, 0.9);
  part(geoCone(0.06, 0.16, 6), lam(0xf2a33d), 0.008, body, 0, 0.9, 0.36).rotation.x = Math.PI / 2;
  for (const s of [1, -1]) { part(geoSphere(0.14, 8, 6), lam(0x2f3440), 0.01, body, 0.38 * s, 0.5, 0).scale.set(0.3, 1.1, 0.6); part(geoSphere(0.09, 8, 6), lam(0xf2a33d), 0.01, body, 0.14 * s, 0.04, 0.14).scale.set(1, 0.4, 1.5); }
  return MK.fin({ root, body, mat: H.mat, faces: H.faces, legs: [] }, 0.92, 0.26);
}
function bBat() {
  const { root, body } = MK.mk();
  const H = headOf(body, 'chillbat', 0x9ab8e8, 0.3, 0, 0, 0);
  for (const s of [1, -1]) part(geoCone(0.08, 0.2, 5), lam(0x7a98c8), 0.01, body, 0.16 * s, 0.32, 0).rotation.z = -0.3 * s;
  spikes(body, 6, 0.28, 0.05, 0xe0f4ff, 0.12);
  const wings = MK.wingPair(body, 0.04, 0, 0.24, 0x7a98c8, 0.24, 0.3);
  return MK.fin({ root, body, mat: H.mat, faces: H.faces, legs: [], wings, flap: 20 }, 0.05, 0.3);
}
function bYeti(boss) {
  const { root, body } = MK.mk(), wool = lam(0xf4f8ff), rr = RW.seeded(boss ? 77 : 33);
  part(geoSphere(0.5, 18, 12), wool, 0.025, body, 0, 0.62, -0.05).scale.set(1, 1.05, 0.9);
  for (let i = 0; i < 12; i++) { const a = rr() * Math.PI * 2, el = rr() * 1.2 - 0.3; part(geoSphere(0.17 + rr() * 0.06, 10, 8), wool, 0.012, body, Math.cos(a) * Math.cos(el) * 0.46, 0.62 + Math.sin(el) * 0.42, -0.05 + Math.sin(a) * Math.cos(el) * 0.42); }
  const H = headOf(body, boss ? 'yetiboss' : 'yeti', 0x9ab0c8, 0.28, 0, 0.86, 0.42);
  for (const s of [1, -1]) { part(geoCone(0.07, 0.26, 6), lam(0xd8c8a8), 0.01, body, 0.24 * s, 1.24, 0.2).rotation.z = -0.5 * s; part(geoSphere(0.15, 10, 8), wool, 0.012, body, 0.5 * s, 0.5, 0.15).scale.set(0.8, 1.5, 0.8); }
  const legs = MK.legs4(body, [[0.22, 0.05], [-0.22, 0.05], [0.22, -0.1], [-0.22, -0.1]], 0.26, 0xd8e0e8, 0.1, 0.26).slice(0, 2);
  if (boss) { crown(body, 1.32, 1.4, 0x9fd8ff); spikes(body, 10, 0.55, 0.9, 0x9fd8ff, 0.32); }
  return MK.fin({ root, body, mat: H.mat, faces: H.faces, legs }, 0.86, 0.28);
}
function bFrostling() { return bJelly('frostling', 0x9fd8f0, true); }
function bSnowbun() {
  const p = RW.MONSTER_BUILD.bunbun();
  const sc = new THREE.Mesh(cachedGeo('scarf', () => new THREE.TorusGeometry(0.26, 0.06, 8, 18)), lam(0xd94a4a)); sc.rotation.x = Math.PI / 2; sc.position.set(0, 0.62, 0.12); p.body.add(sc);
  return p;
}
Object.assign(RW.MONSTER_BUILD, {
  sandpincher: () => bCrab('sandcrab', 0xe0b878, 0xd9804a), jellybob: () => bJelly('jellybob', 0xffa8c8), cocobonk: bCoco, starfin: bStar, puffpuff: bPuffer,
  monkling: bMonkey, parrotto: () => bBird('parrot', 0xe84a4a, 0xffe070, 0x3a8ae8, 0x5fbf5a), bubblefrog: () => bFrog('bubblefrog', 0x4aa8d8, 0xd8f0f8), clamshell: bClam,
  magmalet: bMagma, cindertail: () => bLizard('cinder', 0xc0402a, 0xf2b63d), tidecrab_king: () => bCrab('tideking', 0x4a8ad8, 0x2a5aa8, true),
  snowbun: bSnowbun, frostling: bFrostling, pinewolf: bWolf, snowowl: () => bOwl('snowowl', 0xf4f8ff), penguling: bPenguin, chillbat: bBat,
  yetiling: () => bYeti(false), galebird: () => bBird('galebird', 0x9ab8e8, 0xf4f8ff, 0x6a88c8, 0xffffff), frost_yeti: () => bYeti(true)
});

// ======================================================================= monsters
const mon = (o) => Object.assign({ helpers: 0, radius: 0.55, scale: 0.9, speed: 0.9, chase: 2.2, atkGap: 1.7, headY: 0.7, move: 'hop', die: 'tip' }, o);
Object.assign(KINDS, {
  // Sandy Shore (Lv. 10–13)
  sandpincher: mon({ name: 'Sandpincher', baseLv: 10, hp: 380, dmg: [22, 28], def: 14, exp: 220, coins: [22, 32], scale: 0.95, move: 'scuttle', area: 'beach', element: 'earth', weak: 'water', aggro: 4.5, about: 'A beach crab that hides in the sand. Plain hits bounce off its shell. Use skills!', drops: [['sand_shell', 0.55], ['red_m', 0.05], ['coral_branch', 0.02], ['lucky_clover', 0.008]] }),
  jellybob: mon({ name: 'Jellybob', baseLv: 11, hp: 330, dmg: [22, 27], def: 6, exp: 230, coins: [22, 30], move: 'float', fly: 0.6, die: 'melt', area: 'beach', element: 'water', weak: 'earth', poison: 0.35, helpers: 0.3, about: 'A pink jellyfish that floats over the sand. Its sting makes you sick. Bring an antidote.', drops: [['jelly_ribbon', 0.55], ['antidote', 0.06], ['blue_m', 0.04], ['lucky_clover', 0.008]] }),
  cocobonk: mon({ name: 'Cocobonk', baseLv: 12, hp: 420, dmg: [26, 32], def: 10, exp: 260, coins: [26, 36], scale: 0.85, die: 'pop', area: 'beach', element: 'earth', weak: 'fire', aggro: 4, stun: 0.3, about: 'A living coconut that falls out of palm trees and bonks your head. Very dizzy-making.', drops: [['coconut', 0.55], ['red_m', 0.06], ['coral_branch', 0.02], ['lucky_clover', 0.008]] }),
  // Coral Shallows (Lv. 12–15)
  starfin: mon({ name: 'Starfin', baseLv: 13, hp: 460, dmg: [28, 34], def: 12, exp: 290, coins: [28, 40], move: 'scuttle', area: 'reef', element: 'water', weak: 'wind', helpers: 0.35, about: 'A starfish that cartwheels across the coral. Where there is one, there are friends.', drops: [['sea_star', 0.55], ['blue_m', 0.05], ['coral_branch', 0.03], ['lucky_clover', 0.009]] }),
  puffpuff: mon({ name: 'Puffpuff', baseLv: 14, hp: 520, dmg: [30, 36], def: 10, exp: 320, coins: [30, 42], move: 'float', fly: 0.8, die: 'pop', area: 'reef', element: 'water', weak: 'fire', thorns: 0.8, aggro: 4, about: 'A grumpy pufferfish. Hitting it up close pricks you back. Skills and arrows are safer.', drops: [['puffer_spine', 0.5], ['red_m', 0.06], ['coral_branch', 0.03], ['lucky_clover', 0.009]] }),
  // Palm Isle (Lv. 15–17)
  monkling: mon({ name: 'Monkling', baseLv: 15, hp: 520, dmg: [28, 34], def: 10, exp: 340, coins: [40, 60], speed: 1.4, chase: 3.4, atkGap: 1.4, headY: 0.9, area: 'jungle', element: 'wind', weak: 'fire', steal: true, about: 'A cheeky monkey. It grabs your coins and swings away! Catch it to get them back, plus a banana.', drops: [['banana', 0.55], ['red_m', 0.06], ['lucky_clover', 0.01]] }),
  parrotto: mon({ name: 'Parrotto', baseLv: 16, hp: 540, dmg: [32, 38], def: 10, exp: 360, coins: [34, 48], move: 'float', fly: 1.3, die: 'pop', headY: 0.3, area: 'jungle', element: 'wind', weak: 'earth', aggro: 5, charge: 1.4, about: 'A loud red parrot. It squawks, then dives straight at you.', drops: [['parrot_plume', 0.5], ['blue_m', 0.05], ['fire_opal', 0.015], ['lucky_clover', 0.01]] }),
  // Blue Lagoon (Lv. 16–18)
  bubblefrog: mon({ name: 'Bubblefrog', baseLv: 16, hp: 560, dmg: [32, 38], def: 10, exp: 370, coins: [34, 48], die: 'melt', area: 'lagoon', element: 'water', weak: 'earth', reach: 3.6, helpers: 0.3, about: 'A blue frog that spits bubbles from far away. Run up close!', drops: [['lagoon_moss', 0.55], ['blue_m', 0.06], ['clam_pearl', 0.015], ['lucky_clover', 0.01]] }),
  clamshell: mon({ name: 'Clamshell', baseLv: 17, hp: 640, dmg: [34, 40], def: 24, exp: 400, coins: [40, 56], speed: 0.5, chase: 1.6, move: 'waddle', area: 'lagoon', element: 'water', weak: 'wind', aggro: 3.5, about: 'A big clam with a very hard shell. Magic and skills crack it best. Sometimes it keeps a pearl.', drops: [['clam_pearl', 0.08], ['lagoon_moss', 0.4], ['red_m', 0.07], ['lucky_clover', 0.01]] }),
  // Ember Isle (Lv. 18–20)
  magmalet: mon({ name: 'Magmalet', baseLv: 18, hp: 700, dmg: [38, 46], def: 16, exp: 440, coins: [44, 60], speed: 0.6, move: 'waddle', die: 'poof', area: 'volcano', element: 'fire', weak: 'water', poison: 0.3, aggro: 4, about: 'A hot little rock with glowing cracks. Its touch burns for a while (like poison).', drops: [['magma_chip', 0.55], ['red_m', 0.07], ['fire_opal', 0.03], ['lucky_clover', 0.01]] }),
  cindertail: mon({ name: 'Cindertail', baseLv: 19, hp: 680, dmg: [40, 48], def: 12, exp: 470, coins: [46, 64], move: 'trot', area: 'volcano', element: 'fire', weak: 'water', aggro: 5.5, charge: 1.8, stun: 0.3, about: 'A fire lizard that scrapes the ground, then charges. Step aside!', drops: [['cinder_scale', 0.5], ['red_m', 0.07], ['fire_opal', 0.03], ['lucky_clover', 0.01]] }),
  tidecrab_king: mon({ name: 'Tidecrab King', baseLv: 20, hp: 11000, dmg: [48, 58], def: 22, exp: 9000, coins: [800, 1000], radius: 2.0, scale: 2.8, speed: 0.6, chase: 1.6, atkGap: 2.2, headY: 1.5, move: 'scuttle', area: 'seacave', element: 'water', weak: 'earth', reach: 3.6, boss: true, respawn: 1e9, about: 'The giant king of the Tide Cave. When the tide comes in he calls little crabs, and his big claw slams the floor: get out of the red circle!', drops: [['tide_crown', 1], ['light_shard', 1], ['clam_pearl', 0.6], ['red_m', 1], ['lucky_clover', 0.4]] }),
  // Snowy Fields (Lv. 20–23)
  snowbun: mon({ name: 'Snowbun', baseLv: 20, hp: 760, dmg: [40, 48], def: 14, exp: 500, coins: [44, 60], scale: 0.95, area: 'snowfield', element: 'water', weak: 'fire', helpers: 0.35, freeze: 0.15, about: 'A white bunny in a red scarf. Hard to see in the snow, easy to love. Its kick can freeze you!', drops: [['snow_fluff', 0.55], ['warm_tea', 0.06], ['red_m', 0.06], ['lucky_clover', 0.01]] }),
  frostling: mon({ name: 'Frostling', baseLv: 21, hp: 800, dmg: [42, 50], def: 16, exp: 530, coins: [46, 62], move: 'float', fly: 0.4, die: 'melt', area: 'snowfield', element: 'water', weak: 'fire', freeze: 0.25, aggro: 4, about: 'A cold jelly with a snowflake on top. Its touch freezes. Keep Warm Tea ready.', drops: [['frost_jelly', 0.55], ['warm_tea', 0.08], ['snow_crystal', 0.015], ['lucky_clover', 0.01]] }),
  // Frostpine Wood (Lv. 22–25)
  pinewolf: mon({ name: 'Pinewolf', baseLv: 22, hp: 880, dmg: [46, 54], def: 16, exp: 580, coins: [50, 68], move: 'trot', area: 'pines', element: 'earth', weak: 'fire', aggro: 6, charge: 1.8, helpers: 0.3, about: 'A grey wolf pup with frosty horns. Packs of them howl and charge together.', drops: [['wolf_fur', 0.5], ['red_m', 0.07], ['snow_crystal', 0.02], ['lucky_clover', 0.011]] }),
  snowowl: mon({ name: 'Snowowl', baseLv: 23, hp: 820, dmg: [44, 52], def: 14, exp: 600, coins: [50, 68], move: 'float', fly: 1.1, die: 'pop', headY: 0.2, area: 'pines', element: 'wind', weak: 'earth', stun: 0.35, aggro: 5, about: 'A round white owl. Its hoot echoes in the frozen trees and leaves you dizzy.', drops: [['snow_plume', 0.5], ['blue_m', 0.07], ['snow_crystal', 0.02], ['lucky_clover', 0.011]] }),
  // Glacier Lake (Lv. 24–27)
  penguling: mon({ name: 'Penguling', baseLv: 24, hp: 960, dmg: [48, 56], def: 18, exp: 650, coins: [54, 72], move: 'waddle', area: 'glacier', element: 'water', weak: 'fire', aggro: 5, charge: 2.0, freeze: 0.15, about: 'A chubby penguin. It belly-slides at you across the ice. Surprisingly fast!', drops: [['penguin_down', 0.5], ['warm_tea', 0.08], ['snow_crystal', 0.02], ['lucky_clover', 0.012]] }),
  chillbat: mon({ name: 'Chillbat', baseLv: 25, hp: 880, dmg: [50, 58], def: 14, exp: 680, coins: [54, 72], move: 'float', fly: 1.4, die: 'pop', headY: 0.1, area: 'glacier', element: 'wind', weak: 'fire', freeze: 0.25, helpers: 0.4, about: 'An icy bat. Its cold wings freeze whatever they touch.', drops: [['ice_chip', 0.5], ['warm_tea', 0.08], ['snow_crystal', 0.02], ['lucky_clover', 0.012]] }),
  // Windy Peak (Lv. 26–30)
  yetiling: mon({ name: 'Yetiling', baseLv: 27, hp: 1200, dmg: [56, 66], def: 20, exp: 780, coins: [60, 80], radius: 0.7, scale: 1.05, speed: 0.7, move: 'waddle', area: 'peak', element: 'earth', weak: 'fire', aggro: 4, stun: 0.4, about: 'A young yeti. It hugs too hard. Way too hard.', drops: [['yeti_fur', 0.5], ['red_m', 0.08], ['snow_crystal', 0.025], ['lucky_clover', 0.012]] }),
  galebird: mon({ name: 'Galebird', baseLv: 28, hp: 1050, dmg: [58, 68], def: 16, exp: 800, coins: [60, 80], move: 'float', fly: 1.5, die: 'pop', headY: 0.3, area: 'peak', element: 'wind', weak: 'earth', aggro: 5.5, charge: 1.6, freeze: 0.2, about: 'A storm bird that rides the mountain wind and dives through the snow.', drops: [['storm_feather', 0.5], ['blue_m', 0.08], ['snow_crystal', 0.025], ['lucky_clover', 0.012]] }),
  frost_yeti: mon({ name: 'Frost Yeti', baseLv: 30, hp: 22000, dmg: [66, 80], def: 28, exp: 22000, coins: [1400, 1800], radius: 2.0, scale: 2.7, speed: 0.6, chase: 1.6, atkGap: 2.3, headY: 2.4, move: 'waddle', area: 'icecave', element: 'water', weak: 'fire', reach: 3.6, boss: true, respawn: 1e9, freeze: 0.3, about: 'The great Frost Yeti of the Ice Cave. Its roar drops icicles from the roof and its breath freezes. Drink Warm Tea!', drops: [['frost_heart', 1], ['light_shard', 2], ['snow_crystal', 0.8], ['red_m', 1], ['lucky_clover', 0.5]] })
});

// ======================================================================= gear sets (dropped by monsters, or forged at Bolt)
RW.EXTRA_SETS = {
  sandcrab: { name: 'Sandpincher', two: { def: 7 }, three: { def: 7, hp: 90 } },
  jelly: { name: 'Jellybob', two: { mp: 50 }, three: { atk: 8, mp: 40 } },
  monkey: { name: 'Monkling', two: { luck: 0.1 }, three: { speed: 0.07, crit: 0.03 } },
  magma: { name: 'Magmalet', two: { atk: 10 }, three: { atk: 8, def: 8, crit: 0.03 } },
  snowbun: { name: 'Snowbun', two: { hp: 130 }, three: { def: 10, dodge: 0.03 } },
  wolf: { name: 'Pinewolf', two: { atk: 12 }, three: { crit: 0.05, speed: 0.06 } },
  penguin: { name: 'Penguling', two: { def: 12 }, three: { hp: 160, def: 8 } },
  yeti: { name: 'Yetiling', two: { hp: 180 }, three: { atk: 14, def: 12 } },
  beach: { name: 'Coralcove', two: { hp: 100, mp: 50 }, three: { atk: 10, def: 10, luck: 0.06 } },
  island: { name: 'Island', two: { atk: 10, crit: 0.03 }, three: { atk: 12, def: 12, speed: 0.05 } },
  snow: { name: 'Frostpeak', two: { hp: 160, def: 10 }, three: { atk: 16, def: 16, crit: 0.04 } }
};
RW.EXTRA_SET_PIECES = [
  ['sandcrab', 11, 'sandpincher', [['sandhelm', 'Sand Helm'], ['sandvest', 'Sand Shell Vest'], ['sandboots', 'Sand Boots']]],
  ['jelly', 12, 'jellybob', [['jellyhat', 'Jelly Hat'], ['jellyvest', 'Jelly Vest'], ['jellyboots', 'Jelly Slippers']]],
  ['monkey', 16, 'monkling', [['monkeycap', 'Monkey Cap'], ['monkeyvest', 'Monkey Vest'], ['monkeyboots', 'Monkey Boots']]],
  ['magma', 19, 'magmalet', [['magmahelm', 'Magma Helm'], ['magmavest', 'Magma Vest'], ['magmaboots', 'Magma Boots']]],
  ['snowbun', 21, 'snowbun', [['bunhood', 'Snowbun Hood'], ['bunvest', 'Snowbun Vest'], ['bunboots', 'Snowbun Boots']]],
  ['wolf', 23, 'pinewolf', [['wolfhood', 'Wolf Hood'], ['wolfvest', 'Wolf Vest'], ['wolfboots', 'Wolf Boots']]],
  ['penguin', 25, 'penguling', [['pengcap', 'Penguin Cap'], ['pengvest', 'Penguin Vest'], ['pengboots', 'Penguin Feet']]],
  ['yeti', 28, 'yetiling', [['yetihood', 'Yeti Hood'], ['yeticoat', 'Yeti Coat'], ['yetiboots', 'Yeti Boots']]],
  ['beach', 13, null, [['sunhat', 'Beach Sun Hat'], ['beachshirt', 'Coral Shirt'], ['sandals', 'Shell Sandals']]],
  ['island', 18, null, [['palmcrown', 'Palm Crown'], ['islandvest', 'Island Vest'], ['islandboots', 'Lava Boots']]],
  ['snow', 24, null, [['furhat', 'Fur Hat'], ['snowcoat', 'Snow Coat'], ['snowboots', 'Snow Boots']]]
];
RW.EXTRA_FORGE = {
  sunhat: [['sand_shell', 10], ['coconut', 6]], beachshirt: [['jelly_ribbon', 12], ['sand_shell', 8], ['coral_branch', 1]], sandals: [['sea_star', 10], ['sand_shell', 6]],
  palmcrown: [['banana', 10], ['parrot_plume', 8]], islandvest: [['lagoon_moss', 12], ['parrot_plume', 8], ['fire_opal', 1]], islandboots: [['magma_chip', 10], ['cinder_scale', 8]],
  furhat: [['snow_fluff', 12], ['wolf_fur', 8]], snowcoat: [['wolf_fur', 14], ['penguin_down', 10], ['snow_crystal', 1]], snowboots: [['penguin_down', 10], ['yeti_fur', 8]]
};
Object.assign(RW.GEAR_LOOKS, {
  sandhelm: { kind: 'crab', base: 0xe0b878 }, sandvest: { shirt: '#fbe6c8', vest: '#d9a85a', emblem: 'claw', extra: 'shell' }, sandboots: { boot: '#c8985a', cuff: 0xfbe6c8 },
  jellyhat: { kind: 'jelly', base: 0xffa8c8, dark: 0xd86a98 }, jellyvest: { shirt: '#fff0f6', vest: '#ff8ab8', emblem: 'drop' }, jellyboots: { boot: '#ff8ab8', cuff: 0xfff0f6 },
  monkeycap: { kind: 'squirrel', base: 0x8a5a35 }, monkeyvest: { shirt: '#f3e0c0', vest: '#8a5a35', emblem: 'acorn', extra: 'tail' }, monkeyboots: { boot: '#6a4a2a', cuff: 0xf3e0c0, fur: true },
  magmahelm: { kind: 'thorn', base: 0x4a3a36 }, magmavest: { shirt: '#ffcf9a', vest: '#c0402a', emblem: 'sun', extra: 'spikes' }, magmaboots: { boot: '#4a3a36', cuff: 0xff8a3d, spike: true },
  bunhood: { kind: 'jelly', base: 0xfafafa, dark: 0xd94a4a }, bunvest: { shirt: '#ffffff', vest: '#d94a4a', emblem: 'berry' }, bunboots: { boot: '#f4f4f4', cuff: 0xd94a4a, fur: true },
  wolfhood: { kind: 'boar', base: 0x9aa5b0 }, wolfvest: { shirt: '#e8eef4', vest: '#6a7580', emblem: 'tusk', extra: 'fur' }, wolfboots: { boot: '#6a7580', cuff: 0xe8eef4, fur: true },
  pengcap: { kind: 'jelly', base: 0x2f3440, dark: 0xf2a33d }, pengvest: { shirt: '#ffffff', vest: '#2f3440', emblem: 'wave' }, pengboots: { boot: '#f2a33d', cuff: 0x2f3440 },
  yetihood: { kind: 'mush', base: 0xf4f8ff, spot: 0x9fd8ff, glow: true }, yeticoat: { shirt: '#ffffff', vest: '#c8d8e8', emblem: 'glow', extra: 'fur' }, yetiboots: { boot: '#d8e0e8', cuff: 0x9fd8ff, fur: true },
  sunhat: { kind: 'straw', base: 0xf2d68a, band: 0xff7a8a }, beachshirt: { shirt: '#fff6e0', vest: '#ff7a8a', emblem: 'wave' }, sandals: { boot: '#e0b878', cuff: 0xff7a8a },
  palmcrown: { kind: 'bush', base: 0x5fae45 }, islandvest: { shirt: '#fff3c8', vest: '#2a9a8a', emblem: 'berry', extra: 'leaves' }, islandboots: { boot: '#3a2a26', cuff: 0xff8a3d },
  furhat: { kind: 'squirrel', base: 0xe8e0d0 }, snowcoat: { shirt: '#ffffff', vest: '#4a6ab8', emblem: 'feather', extra: 'cloak' }, snowboots: { boot: '#4a6ab8', cuff: 0xffffff, fur: true }
});

// ======================================================================= pets: two tropical and two snow pets (new eggs), and a role for every pet
Object.assign(PETS.puffdrake, { role: 'attacker' }); Object.assign(PETS.cloudfox, { role: 'healer' }); Object.assign(PETS.glimmerbun, { role: 'lucky' });
Object.assign(PETS.mossback, { role: 'tank', hp: 1.45 }); Object.assign(PETS.bloomquill, { role: 'attacker' }); Object.assign(PETS.lilytoad, { role: 'healer' });
Object.assign(PETS, {
  shellsnap: { name: 'Shellsnap', about: 'A little coconut crab who hides in a big shell and protects you.', element: 'water', hp: 1.7, atk: 0.8, egg: 'tide', role: 'tank', col: 0xe0a060, pitch: 560,
    skills: [{ id: 'shellbash', name: 'Shell Bash', kind: 'hit', power: 1.3, stun: 1.2, cd: 9, desc: 'Bonks a monster with its shell and leaves it dizzy.' },
      { id: 'hardshell', name: 'Hard Shell', kind: 'guard', def: 0.6, dur: 8, cd: 16, desc: 'Your defense goes way up for 8 seconds.' }] },
  featherdart: { name: 'Featherdart', about: 'A tiny parrot who shoots sharp feathers from far away.', element: 'wind', hp: 0.8, atk: 1.5, egg: 'tide', role: 'ranger', col: 0x5fd0a0, pitch: 1400,
    skills: [{ id: 'dart', name: 'Feather Dart', kind: 'hit', power: 2.0, element: 'wind', cd: 7, desc: 'A sharp feather shot that hits very hard.' },
      { id: 'dartrain', name: 'Dart Rain', kind: 'area', power: 1.6, element: 'wind', radius: 2.8, cd: 13, desc: 'Feathers rain on a monster and everyone around it.' }] },
  icepip: { name: 'Icepip', about: 'A baby penguin who throws snowballs harder than you would think.', element: 'water', hp: 0.85, atk: 1.45, egg: 'frost', role: 'ranger', col: 0x9fd8ff, pitch: 1200,
    skills: [{ id: 'iceshot', name: 'Ice Shot', kind: 'hit', power: 1.9, element: 'water', slow: 4, cd: 7, desc: 'A hard snowball that hits hard and slows the monster.' },
      { id: 'snowburst', name: 'Snow Burst', kind: 'area', power: 1.5, element: 'water', radius: 2.6, cd: 13, desc: 'A burst of snow around the monster.' }] },
  tuskpuff: { name: 'Tuskpuff', about: 'A fluffy little mammoth. Big, slow, warm, and it never lets anything hurt you.', element: 'earth', hp: 1.8, atk: 0.8, egg: 'frost', role: 'tank', col: 0xc8a888, pitch: 440,
    skills: [{ id: 'trunkslam', name: 'Trunk Slam', kind: 'hit', power: 1.4, kb: 2, cd: 9, desc: 'A swing of its trunk that knocks a monster back.' },
      { id: 'woollywall', name: 'Woolly Wall', kind: 'guard', def: 0.6, dur: 8, cd: 16, desc: 'Your defense goes way up for 8 seconds.' }] }
});
// third skills for adults (Pet Lv. 25)
const THIRD = {
  puffdrake: { id: 'dragonroar', name: 'Dragon Roar', kind: 'area', power: 2.4, element: 'fire', radius: 3.2, cd: 16, desc: 'A big roar of fire around the monster.' },
  cloudfox: { id: 'stormtail', name: 'Storm Tail', kind: 'area', power: 2.0, element: 'wind', radius: 3, cd: 15, desc: 'A storm from its cloud tail.' },
  glimmerbun: { id: 'starshower', name: 'Star Shower', kind: 'area', power: 1.8, radius: 3, cd: 15, desc: 'Falling stars hit monsters around it.' },
  mossback: { id: 'fortress', name: 'Stone Fortress', kind: 'guard', def: 1.0, dur: 10, cd: 20, desc: 'Your defense goes up a lot for 10 seconds.' },
  bloomquill: { id: 'bloomstorm', name: 'Bloom Storm', kind: 'area', power: 2.2, radius: 3, cd: 14, desc: 'A storm of petal quills.' },
  lilytoad: { id: 'healrain', name: 'Healing Rain', kind: 'heal', heal: 0.6, cd: 20, desc: 'A big healing rain for you and the pet.' },
  shellsnap: { id: 'tidewall', name: 'Tide Wall', kind: 'guard', def: 1.1, dur: 10, cd: 20, desc: 'A wall of water: your defense goes up a lot for 10 seconds.' },
  featherdart: { id: 'skysnipe', name: 'Sky Snipe', kind: 'hit', power: 3.4, element: 'wind', cd: 12, desc: 'One perfect feather shot. Huge damage.' },
  icepip: { id: 'blizzard', name: 'Blizzard', kind: 'area', power: 2.6, element: 'water', radius: 3.2, cd: 16, desc: 'A small blizzard around the monster.' },
  tuskpuff: { id: 'stomp', name: 'Mammoth Stomp', kind: 'area', power: 2.0, element: 'earth', radius: 3.2, cd: 15, desc: 'Stomps the ground and hurts monsters around it.' }
};
for (const sp in THIRD) if (PETS[sp] && PETS[sp].skills.length < 3) PETS[sp].skills.push(THIRD[sp]);
RW.PET_ROLES = { attacker: ['Attacker', '⚔️'], ranger: ['Ranger', '🏹'], tank: ['Tank', '🛡️'], healer: ['Healer', '💚'], lucky: ['Lucky', '🍀'] };
PET_EGGS.tide = { name: 'Tide Egg', hint: 'Sea-blue with sandy spots.', species: ['shellsnap', 'featherdart'] };
PET_EGGS.frost = { name: 'Frost Egg', hint: 'Cold and white, with blue swirls.', species: ['icepip', 'tuskpuff'] };
// pet models for the new pets
function petShell(teen) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body); const S = teen ? 1.3 : 1; body.scale.setScalar(S);
  const sh = lam(0xc8844a); part(geoSphere(0.34, 16, 12), sh, 0.02, body, 0, 0.36, -0.12).scale.set(1, 0.85, 1);
  for (let i = 0; i < 4; i++) part(cachedGeo('shellring' + i, () => new THREE.TorusGeometry(0.3 - i * 0.07, 0.05, 8, 18)), lam(i % 2 ? 0xe8b070 : 0xa86a3a), 0.01, body, 0, 0.4 + i * 0.06, -0.18 - i * 0.02).rotation.x = 0.3;
  const faces = MK.petFaces('#e8a868', 4), mat = lam(0xffffff, faces.normal);
  part(geoSphere(0.24, 18, 12), mat, 0.02, body, 0, 0.36, 0.16);
  for (const s of [1, -1]) { part(geoSphere(0.11, 10, 8), lam(0xd9804a), 0.012, body, 0.3 * s, 0.26, 0.26).scale.set(1, 0.7, 1.3); part(geoCyl(0.015, 0.015, 0.16, 5), lam(0xd9804a), 0, body, 0.08 * s, 0.62, 0.18); }
  if (teen) part(geoSphere(0.08, 10, 8), lam(0x5fae45), 0.01, body, 0, 0.78, -0.1).scale.set(1.6, 0.4, 0.8);
  return MK.petResult(root, body, mat, faces, { headY: 0.36 * S, mouth: V3(0, 0.3 * S, 0.38 * S), size: 0.85 * S, hover: 0 });
}
function petParrot(teen) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body); const S = teen ? 1.3 : 1; body.scale.setScalar(S);
  part(geoSphere(0.24, 16, 12), lam(0x5fd0a0), 0.02, body, 0, 0.3, -0.04).scale.set(0.95, 1, 1.1);
  part(geoSphere(0.16, 12, 8), lam(0xfff3a0), 0, body, 0, 0.26, 0.1).scale.set(1, 1.1, 0.6);
  const faces = MK.petFaces('#5fd0a0', 4), mat = lam(0xffffff, faces.normal);
  part(geoSphere(0.22, 18, 12), mat, 0.02, body, 0, 0.6, 0.06);
  part(geoCone(0.06, 0.14, 6), lam(0xffb43d), 0.01, body, 0, 0.56, 0.3).rotation.x = Math.PI / 2 + 0.4;
  for (let i = 0; i < (teen ? 3 : 1); i++) part(geoCone(0.04, 0.18, 5), lam(0xff5a5a), 0.008, body, 0, 0.84, 0.02 - i * 0.07).rotation.x = -0.4 - i * 0.25;
  for (const s of [1, -1]) { const w = part(geoSphere(0.14, 10, 8), lam(0x3a8ae8), 0.01, body, 0.22 * s, 0.32, -0.04); w.scale.set(0.3, 0.9, 1.1); }
  const tail = new THREE.Group(); tail.position.set(0, 0.18, -0.26); tail.userData.live = true; body.add(tail);
  for (const s of [-1, 0, 1]) { const t = part(geoSphere(0.06, 8, 6), lam(s ? 0x3a8ae8 : 0xff5a5a), 0.006, tail, s * 0.05, 0, -0.12); t.scale.set(0.6, 0.3, teen ? 3.4 : 2.4); }
  return MK.petResult(root, body, mat, faces, { tail, headY: 0.6 * S, mouth: V3(0, 0.56 * S, 0.34 * S), size: 0.7 * S, hover: 0.12 });
}
function petPenguin(teen) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body); const S = teen ? 1.3 : 1; body.scale.setScalar(S);
  part(geoSphere(0.28, 16, 12), lam(0x3a4050), 0.02, body, 0, 0.32, -0.02).scale.set(1, 1.15, 0.95);
  part(geoSphere(0.22, 14, 10), lam(0xf8f8f8), 0, body, 0, 0.3, 0.1).scale.set(0.95, 1.1, 0.7);
  const faces = MK.petFaces('#f4f8ff', 4), mat = lam(0xffffff, faces.normal);
  part(geoSphere(0.23, 18, 12), mat, 0.02, body, 0, 0.66, 0.04);
  part(geoSphere(0.24, 14, 10), lam(0x3a4050), 0.01, body, 0, 0.74, -0.04).scale.set(1, 0.7, 0.9);
  part(geoCone(0.05, 0.12, 6), lam(0xf2a33d), 0.008, body, 0, 0.62, 0.3).rotation.x = Math.PI / 2;
  if (teen) { const sc = part(cachedGeo('pscarf', () => new THREE.TorusGeometry(0.2, 0.05, 8, 16)), lam(0x7cc4ff), 0.008, body, 0, 0.48, 0.02); sc.rotation.x = Math.PI / 2; }
  for (const s of [1, -1]) { part(geoSphere(0.1, 8, 6), lam(0x3a4050), 0.01, body, 0.28 * s, 0.34, 0).scale.set(0.3, 1, 0.6); part(geoSphere(0.07, 8, 6), lam(0xf2a33d), 0.008, body, 0.1 * s, 0.03, 0.1).scale.set(1, 0.4, 1.5); }
  return MK.petResult(root, body, mat, faces, { headY: 0.66 * S, mouth: V3(0, 0.6 * S, 0.3 * S), size: 0.75 * S, hover: 0 });
}
function petMammoth(teen) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body); const S = teen ? 1.3 : 1; body.scale.setScalar(S);
  const fur = lam(0xc8a888); part(geoSphere(0.34, 16, 12), fur, 0.02, body, 0, 0.38, -0.08).scale.set(1, 0.95, 1.15);
  const faces = MK.petFaces('#c8a888', 4), mat = lam(0xffffff, faces.normal);
  part(geoSphere(0.26, 18, 12), mat, 0.02, body, 0, 0.56, 0.2);
  const trunk = part(geoCyl(0.05, 0.08, 0.3, 8), fur, 0.01, body, 0, 0.36, 0.42); trunk.rotation.x = 0.4;
  for (const s of [1, -1]) { part(geoSphere(0.14, 10, 8), lam(0xb08868), 0.01, body, 0.24 * s, 0.6, 0.1).scale.set(0.3, 1, 0.9); part(geoCone(0.035, teen ? 0.24 : 0.14, 6), lam(0xfff6e4), 0.008, body, 0.1 * s, 0.38, 0.4).rotation.x = 1.2; }
  MK.legs4(body, [[0.18, 0.12], [-0.18, 0.12], [0.18, -0.24], [-0.18, -0.24]], 0.18, 0xb08868, 0.07, 0.18);
  if (teen) for (let i = 0; i < 4; i++) part(geoSphere(0.1, 8, 6), lam(0xe8d8c0), 0.008, body, -0.15 + i * 0.1, 0.7, -0.15).scale.set(1, 0.6, 1);
  return MK.petResult(root, body, mat, faces, { headY: 0.56 * S, mouth: V3(0, 0.4 * S, 0.44 * S), size: 0.9 * S, hover: 0 });
}
Object.assign(RW.PET_BUILD, { shellsnap: (st) => petShell(st !== 'baby'), featherdart: (st) => petParrot(st !== 'baby'), icepip: (st) => petPenguin(st !== 'baby'), tuskpuff: (st) => petMammoth(st !== 'baby') });
// adults (stage 'adult_a' = loved and calm, 'adult_b' = wild and fiery): a bigger body and a little crown or a pair of horns
for (const sp of Object.keys(RW.PET_BUILD)) {
  const orig = RW.PET_BUILD[sp];
  RW.PET_BUILD[sp] = (stage) => {
    if (!/^adult/.test(stage || '')) return orig(stage);
    const a = stage === 'adult_a';
    if (sp === 'puffdrake') return orig(a ? 'bloom' : 'ember');
    const p = orig('teen'), k = 1.22, bs = p.body.scale.x;
    p.body.scale.multiplyScalar(k); p.headY *= k; p.size *= k; if (p.mouth) p.mouth.multiplyScalar(k);
    const top = (p.headY / (bs * k)) + 0.24, col = a ? 0xffd84d : 0xff6a4a;
    const g = new THREE.Group(); g.position.set(0, top, 0.02); p.body.add(g);
    if (a) { for (let i = 0; i < 5; i++) { const t = i / 5 * Math.PI * 2; part(geoCone(0.035, 0.1, 5), lam(col, null, { emissive: 0x6a4a00 }), 0.006, g, Math.cos(t) * 0.09, 0.03, Math.sin(t) * 0.09); } part(geoCyl(0.1, 0.1, 0.035, 12), lam(col, null, { emissive: 0x6a4a00 }), 0.006, g, 0, -0.02, 0); }
    else for (const s of [1, -1]) part(geoCone(0.04, 0.16, 6), lam(col, null, { emissive: 0x5a1a00 }), 0.006, g, 0.1 * s, 0, 0).rotation.z = -0.4 * s;
    return p;
  };
}

// ======================================================================= people
Object.assign(RW.NPC_LOOKS, {
  bahari: { gender: 'boy', skin: '#c98e62', hair: 'shortspiky', hairColor: '#2a2a2a', iris: '#3f6a8a', outfit: 'tobin', weapon: 'none', brows: 'thick', mouth: 'grin', stubble: true, size: 1.05, colors: { shirt: '#3f6ab8' } },
  kiki: { gender: 'girl', skin: '#e2b48e', hair: 'pony', hairColor: '#e8604c', iris: '#2a8a6a', outfit: 'pip', weapon: 'none', mouth: 'smile', freckles: true, colors: { shirt: '#ff8a8a' } },
  ula: { gender: 'girl', skin: '#a8724a', hair: 'long', hairColor: '#2a1a1a', iris: '#5a3a2a', outfit: 'mira', weapon: 'potion', mouth: 'smile', colors: { shirt: '#2a9a8a' } },
  sven: { gender: 'boy', skin: '#f3d2b8', hair: 'none', outfit: 'elder', weapon: 'cane', brows: 'thick', mouth: 'smile', stubble: true, colors: { shirt: '#4a6ab8' } },
  freya: { gender: 'girl', skin: '#f6d8c0', hair: 'twin', hairColor: '#f4f0e0', iris: '#4a8ad8', outfit: 'mage', weapon: 'none', mouth: 'smile', size: 0.95, colors: { robe: '#4a6ab8', trim: '#ffffff', hat: '#2a4a8a' } },
  tomo: { gender: 'boy', skin: '#e0ac80', hair: 'bangs', hairColor: '#5a3a22', iris: '#3f2a1a', outfit: 'fennick', weapon: 'none', mouth: 'grin', size: 0.98, colors: { shirt: '#c0a05a' } }
});
RW.NPC_LOOKS.bahari2 = RW.NPC_LOOKS.bahari3 = RW.NPC_LOOKS.bahari;
const CORAL = { cx: -1600, cz: 0 }, FROST = { cx: -3100, cz: 0 };
// the dock captain in Riverside (boat to Coralcove)
W.NPC_SPOTS.push({ id: 'bahari', name: 'Captain Bahari', role: 'Boat captain', map: 'river', x: W.DOCK.x + 3.2, z: W.DOCK.z + 2.4, face: -1.6, lines: ['Ahoy! The sea is calm today.'] });
W.NPC_SPOTS.push({ id: 'tomo', name: 'Tomo', role: 'Traveling merchant', map: 'meadow', x: 9.5, z: -24, face: Math.PI + 0.4, lines: ['Rare goods from far away! Today only!'] });

// ======================================================================= the land builder
const T = { sand: null, snow: null };
function sandTex() { return T.sand || (T.sand = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#f0dcae'; g.fillRect(0, 0, w, h); for (let i = 0; i < 1600; i++) { g.fillStyle = ['rgba(210,180,120,.5)', 'rgba(255,245,220,.6)', 'rgba(190,160,110,.35)'][i % 3]; g.fillRect(R() * w, R() * h, 2, 2); } }, [24, 24])); }
function snowTex() { return T.snow || (T.snow = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#f4f8fc'; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { g.fillStyle = ['rgba(200,220,240,.5)', 'rgba(255,255,255,.8)', 'rgba(180,200,230,.35)'][i % 3]; ell(g, R() * w, R() * h, 1 + R() * 3, 1 + R() * 2); } }, [24, 24])); }
const segDist = (x, z, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1), 0, 1); return Math.hypot(x - ax - dx * t, z - az - dz * t); };
const BLOCKS = {}; // per land: [{x, z, r, on()}] things that stop walking (tide water, ice walls, volcano)
const blocked = (id, x, z) => { const l = BLOCKS[id]; if (!l) return false; for (const b of l) if ((!b.on || b.on()) && Math.hypot(x - b.x, z - b.z) < b.r) return true; return false; };
function land(o) {
  o.ponds = o.ponds || []; o.A = o.A || 150; BLOCKS[o.id] = o.blocks || [];
  const M = { x: o.cx, z: o.cz, ax: o.A, az: o.A };
  o.edge = o.rooms ? (x, z) => {
    let d = 1e9; for (const r of o.rooms) d = Math.min(d, Math.hypot(x - r.x, z - r.z) - r.r);
    for (const [a, b, w] of o.halls) d = Math.min(d, segDist(x, z, o.rooms[a].x, o.rooms[a].z, o.rooms[b].x, o.rooms[b].z) - w);
    return d + vnoise3(x * 0.13, 7.7, z * 0.13) * 1.4 - 0.7;
  } : (x, z) => superEdge(x, z, M) + (vnoise3(x * 0.02, 3.3, z * 0.02) - 0.5) * 18;
  o.height = (x, z) => {
    const e = o.edge(x, z);
    let h = o.rooms ? vnoise3(x * 0.07, 4.4, z * 0.07) * 0.4 : vnoise3(x * 0.035, o.seed % 97, z * 0.035) * (o.amp || 2.4) + Math.sin(x * 0.021 + o.seed) * Math.cos(z * 0.025) * (o.amp || 2.4) * 0.4;
    if (o.hill) h += o.hill(x, z);
    for (const p of o.ponds) { const dp = Math.hypot(x - p.x, z - p.z); if (dp < p.r + 8) h = lerp(h, p.base, smoothstep(p.r + 8, p.r + 2, dp)); if (dp < p.r + 3) h -= RW.smooth01(clamp(1 - dp / (p.r + 3), 0, 1)) * 1.5; }
    if (o.rooms) { if (e > -1.5) h += Math.min(16, Math.pow(e + 1.5, 1.3) * 2.4); }
    else if (o.sea) { if (e > -18) h = lerp(h, -3.4, smoothstep(-18, 6, e)); }
    else h += rimRise(x, z, e, o.rim || 36);
    return h;
  };
  o.walk = (x, z) => {
    if (o.edge(x, z) > (o.rooms ? -1.2 : -3)) return false;
    for (const p of o.ponds) if (Math.hypot(x - p.x, z - p.z) < p.r + 0.4) return false;
    return !blocked(o.id, x, z);
  };
  o.build = () => buildLand(o);
  o.look = o.look || { fog: 0xcfe6e8, near: 62, far: 195, sun: 0.58 };
  AREAS[o.id] = { name: o.name, lv: o.lv, min: o.min || 1, title: o.title || '', kinds: o.kinds || [] };
  CAMPS_BY_MAP[o.id] = o.camps || [];
  for (const c of o.chests || []) CHESTS.push([c[0], o.id, c[1], c[2], c[3], c[4], c[5]]);
  if (o.title) TITLES[o.title] = { how: 'Fill every star of ' + o.name + ' in the monster book (K).', bonus: o.bonus, text: o.bonusText };
  W.addLand(o);
  return o;
}
const bakeBy = {}; // colour -> parts, flushed into one mesh each at the end of a build
const put = (col, g, m) => (bakeBy[col] = bakeBy[col] || []).push({ g, m });
function flushBakes(root, emissive) { for (const c in bakeBy) { if (!bakeBy[c].length) continue; const mesh = new THREE.Mesh(bake(bakeBy[c]), lam(+c, null, emissive && emissive[c] ? { emissive: emissive[c] } : undefined)); root.add(mesh); bakeBy[c] = []; } }
function palm(x, z, s) {
  const y = K.height(x, z), lean = R() * Math.PI * 2, lx = Math.cos(lean) * 0.25, lz = Math.sin(lean) * 0.25;
  let px = x, pz = z, py = y;
  for (let i = 0; i < 7; i++) { const k = i / 7; K.layer('wood', { g: geoCyl(0.2 * s * (1 - k * 0.35), 0.24 * s * (1 - k * 0.3), 0.9 * s, 7), m: mtx(px, py + 0.45 * s, pz, lz * k * 1.6, 0, -lx * k * 1.6, 1) }); px += lx * k * 0.9 * s; pz += lz * k * 0.9 * s; py += 0.85 * s; }
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + R() * 0.3, d = V3(Math.cos(a), -0.35, Math.sin(a)); K.layer('leaf', { g: geoSphere(0.5, 8, 6), m: new THREE.Matrix4().compose(V3(px + d.x * 1.3 * s, py + 0.1, pz + d.z * 1.3 * s), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -a, -0.35)), V3(2.9 * s, 0.14 * s, 0.75 * s)), col: new THREE.Color(0x7ccf5a) }); }
  for (let i = 0; i < 3; i++) put(0x6a4a2a, geoSphere(0.2 * s, 8, 6), mtx(px + Math.cos(i * 2.1) * 0.3 * s, py - 0.25 * s, pz + Math.sin(i * 2.1) * 0.3 * s));
  K.addCollider(x, z, 0.5 * s); K.treeDots().push([x, z, 1.8 * s]);
}
function snowPine(x, z, s, solid) {
  const y = K.height(x, z);
  K.layer('wood', { g: geoCyl(0.18 * s, 0.26 * s, 1.6 * s, 7), m: mtx(x, y + 0.8 * s, z) });
  for (let i = 0; i < 4; i++) { const r = (1.6 - i * 0.32) * s, hy = y + (1.3 + i * 1.05) * s; put(0x2f5a46, geoCone(r, 1.6 * s, 9), mtx(x, hy, z)); put(0xf4f8ff, geoCone(r * 0.82, 0.8 * s, 9), mtx(x, hy + 0.5 * s, z)); }
  if (solid) K.addCollider(x, z, 0.7 * s); K.treeDots().push([x, z, 1.7 * s]);
}
function coral(x, z, s, col) { const y = K.height(x, z); for (let i = 0; i < 5; i++) { const a = R() * 6.28, d = V3(Math.cos(a) * 0.5, 1, Math.sin(a) * 0.5).normalize(); put(col, geoCyl(0.08 * s, 0.12 * s, 1.1 * s, 6), mdir(V3(x + d.x * 0.3 * s, y + 0.5 * s, z + d.z * 0.3 * s), d, 1)); put(col, geoSphere(0.14 * s, 8, 6), mtx(x + d.x * 0.85 * s, y + 1.05 * s, z + d.z * 0.85 * s)); } }
function iceRock(x, z, s) { const y = K.height(x, z); for (let i = 0; i < 3; i++) put(0xbfe8ff, new THREE.OctahedronGeometry(1, 0), mtx(x + (R() - 0.5) * s, y + s * 0.5, z + (R() - 0.5) * s, R(), R() * 6, R(), s * (0.5 + R() * 0.5), s * (1 + R()), s * (0.5 + R() * 0.5))); K.addCollider(x, z, s * 0.9); }
// a plain sea plane (the beach lands sit in it) and a frozen lake disc
function seaPlane(o) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(900, 900, 1, 1), new THREE.MeshLambertMaterial({ color: o.seaCol || 0x3aa7c8, transparent: true, opacity: 0.86, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(o.cx, -0.55, o.cz); m.renderOrder = 2; K.root.add(m); o.fx.sea = m;
  const foam = new THREE.Mesh(new THREE.RingGeometry(1, 1.02, 64), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0 })); foam.visible = false; K.root.add(foam);
}
function okSpot(o, x, z, gap) {
  if (o.edge(x, z) > -7) return false;
  if (K.distToRoad(x, z) < gap || !K.gateClear(x, z, 10) || !K.chestClear(x, z, 3.5)) return false;
  for (const p of o.ponds) if (Math.hypot(x - p.x, z - p.z) < p.r + 4) return false;
  for (const n of W.NPC_SPOTS) if (n.map === o.id && Math.hypot(x - n.x, z - n.z) < 6) return false;
  for (const w of W.WAYSTONES) if (w.map === o.id && Math.hypot(x - w.x, z - w.z) < 5) return false;
  for (const c of o.clear || []) if (Math.hypot(x - c[0], z - c[1]) < c[2]) return false;
  if (blocked(o.id, x, z)) return false;
  for (const c of W.colliders) if (Math.abs(c.x - x) < 6 && Math.abs(c.z - z) < 6 && Math.hypot(c.x - x, c.z - z) < c.r + gap * 0.6) return false;
  return true;
}
function scatter(o, n, spread, gap, fn) { let k = 0, g = 0; while (k < n && g++ < n * 60) { const x = o.cx + (R() - 0.5) * spread * 2, z = o.cz + (R() - 0.5) * spread * 2; if (!okSpot(o, x, z, gap)) continue; fn(x, z); k++; } }
function buildLand(o) {
  K.beginMap(o.id, o.seed, o.leafK || 1);
  o.fx = {};
  const S = o.style, seg = isTouch ? 140 : 190;
  for (const r of o.roads || []) K.roadRibbon(r, 3.2, K.dirtTex);
  K.makeGround(o.rooms ? 300 : 420, o.rooms ? 300 : 420, o.cx, o.cz, seg, seg, o.ponds, S.tint, null, S.edgeCol, S.tex === 'sand' ? sandTex() : S.tex === 'snow' ? snowTex() : S.tex === 'cave' ? K.caveFloorTex : undefined);
  for (const p of o.ponds) { if (S.ice) { const d = new THREE.Mesh(new THREE.CircleGeometry(p.r + 2, 40), new THREE.MeshLambertMaterial({ color: 0xcfeeff, emissive: 0x1a3a5a, transparent: true, opacity: 0.9 })); d.rotation.x = -Math.PI / 2; d.position.set(p.x, p.level + 0.05, p.z); K.root.add(d); } else K.addPond(p, !!S.glowPond); }
  if (o.sea) seaPlane(o);
  if (o.extras) o.extras(o);
  if (o.rooms) buildCaveWalls(o);
  else {
    const n = isTouch ? (S.trees || 0) * 0.65 : S.trees || 0;
    scatter(o, n, o.A - 12, 5, (x, z) => { const t = S.tree, s = 0.9 + R() * 0.5; if (t === 'palm') palm(x, z, s); else if (t === 'snow') snowPine(x, z, s, true); else if (t === 'pine' || (t === 'mix' && R() < 0.45)) K.addPine(x, z, s, true); else K.addBroadleaf(x, z, s, true); });
    if (S.coral) scatter(o, S.coral, o.A - 10, 3, (x, z) => { coral(x, z, 0.8 + R() * 0.7, [0xff7a8a, 0xffa86a, 0xb88ae0, 0xff9ac8][Math.floor(R() * 4)]); K.addCollider(x, z, 0.8); });
    if (S.ice) scatter(o, S.ice, o.A - 10, 3, (x, z) => iceRock(x, z, 1 + R() * 1.2));
    scatter(o, S.rocks || 20, o.A - 10, 3, (x, z) => K.rocksAround([[x, z]], 0.6, 2.0, true));
    if (!o.sea) {
      let rim = 0, g = 0; const want = isTouch ? 110 : 170;
      while (rim < want && g++ < 16000) {
        const x = o.cx + (R() - 0.5) * 2 * (o.A + 40), z = o.cz + (R() - 0.5) * 2 * (o.A + 40), d = o.edge(x, z);
        if (d < -1.5 || d > 30 || !K.gateClear(x, z, 12)) continue;
        if (S.tree === 'snow') snowPine(x, z, 1.1 + R() * 0.7, false); else if (S.rimRock || R() < 0.35) { const s = 3 + R() * 3; K.layer('rock', { g: K.ROCKS[rim % 4], m: mtx(x, K.height(x, z) + s * 0.4, z, 0, R() * 6, 0, s * 1.1, s * (1.2 + R()), s) }); } else if (S.tree === 'palm') palm(x, z, 1 + R() * 0.4); else K.addPine(x, z, 1.1 + R() * 0.7, false);
        rim++;
      }
    }
    if (S.flowers) { const patches = []; for (let k = 0; k < 36; k++) { let x, z, g = 0; do { x = o.cx + (R() - 0.5) * 260; z = o.cz + (R() - 0.5) * 260; } while (!okSpot(o, x, z, 3) && g++ < 40); patches.push([x, z, k % 3]); } K.addFlowers(patches, isTouch ? 300 : 520, (x, z) => okSpot(o, x, z, 2), S.flowers, 5, 0xfff0a0); }
    if (S.tufts) K.addTufts(isTouch ? 1800 : 3600, () => [o.cx + (R() - 0.5) * 300, o.cz + (R() - 0.5) * 300], (x, z) => o.edge(x, z) < -4 && K.distToRoad(x, z) > 2.4 && !blocked(o.id, x, z), S.tufts, true);
  }
  for (const G of o.gates || []) if (!G.hole) K.gateArch(W.GATES.find((g) => g.id === G.id), G.lvText || '');
  flushBakes(K.root, { 0xbfe8ff: 0x1a3a5a, 0xff7a8a: 0x3a0a10 });
  K.bakeLayers();
  if (S.drift) o.fx.drift = K.driftCloud(isTouch ? 50 : 90, S.drift[1], S.drift[0], !!S.drift[2]);
  const B = o.rooms ? 140 : 175;
  const mini = { x0: o.cx - B, z0: o.cz - B, x1: o.cx + B, z1: o.cz + B, ppm: 2 };
  K.MAPS[o.id].mini = mini;
  K.MAPS[o.id].miniCanvas = K.paintMini(mini, S.mini, { mid: (g) => { g.fillStyle = S.ice ? '#cfeeff' : '#6fb6cf'; for (const p of o.ponds) { g.beginPath(); g.arc(p.x, p.z, p.r + 1, 0, Math.PI * 2); g.fill(); } if (o.miniMid) o.miniMid(g); } });
  K.MAPS[o.id].built = true;
  if (o.after) o.after(o);
}
// dungeon walls: big rocks (or ice) along the room edges
function buildCaveWalls(o) {
  const ice = o.style.ice;
  let n = 0, g = 0; const want = isTouch ? 160 : 260;
  while (n < want && g++ < 30000) {
    const x = o.cx + (R() - 0.5) * 280, z = o.cz + (R() - 0.5) * 280, d = o.edge(x, z);
    if (d < 0.5 || d > 9) continue;
    const s = 2.2 + R() * 2.6;
    if (ice) put(0xbfe8ff, new THREE.OctahedronGeometry(1, 0), mtx(x, K.height(x, z) + s * 0.6, z, R(), R() * 6, R(), s * 0.8, s * 1.5, s * 0.8));
    else K.layer('rock', { g: K.ROCKS[n % 4], m: mtx(x, K.height(x, z) + s * 0.3, z, 0, R() * 6, 0, s * 1.1, s * (1.1 + R() * 0.8), s) });
    n++;
  }
  // glowing crystals or shells along the walls, and a few lights
  for (const r of o.rooms) for (let i = 0; i < 4; i++) {
    const a = R() * Math.PI * 2, x = r.x + Math.cos(a) * (r.r - 1.2), z = r.z + Math.sin(a) * (r.r - 1.2);
    if (o.edge(x, z) > -0.5) continue;
    const gl = glow(3.2); gl.position.set(x, K.height(x, z) + 1.4, z); gl.material.color = new THREE.Color(ice ? 0x9fd8ff : 0x7cf0d8); gl.material.opacity = 0.4; K.root.add(gl);
    put(ice ? 0xbfe8ff : 0x7cf0d8, new THREE.OctahedronGeometry(0.4, 0), mtx(x, K.height(x, z) + 0.5, z, 0, R() * 6, 0, 1, 2, 1));
  }
}

// ======================================================================= the lands
const ROOMS = (cx, cz) => [{ x: cx + 100, z: cz, r: 15 }, { x: cx + 58, z: cz + 6, r: 15 }, { x: cx + 12, z: cz - 14, r: 18 }, { x: cx - 36, z: cz + 4, r: 15 }, { x: cx - 92, z: cz, r: 25 }];
const HALLS = [[0, 1, 4.2], [1, 2, 4.2], [2, 3, 4.2], [3, 4, 4.6]];
const sandTint = (k) => (x, z, c) => { const n = vnoise3(x * 0.05, 1.3, z * 0.05); c[0] *= 1.0 + n * 0.05; c[1] *= 0.97; c[2] *= 0.88 * k; };
const g2 = (id, x, z, to, tx, tz, face, sign, lvText) => ({ id, x, z, to, tx, tz, face, sign, lvText });
const LV = (name, lv) => name + '\n' + lv;
// --- Chapter 2
land({ id: 'coral', name: 'Coralcove', lv: 'Beach town · safe', cx: CORAL.cx, cz: CORAL.cz, A: 120, seed: 91001, sea: true, amp: 1.2,
  style: { tex: 'sand', tint: sandTint(1), tree: 'palm', trees: 30, rocks: 10, coral: 12, edgeCol: [0.95, 0.9, 0.78, 30], mini: { out: '#3aa7c8', in: '#f0dcae', rim: '#e8d0a0', tree: '#5fae45' }, drift: [0xffffff, 0.25, false] },
  roads: [[[-1600, -105], [-1600, -60], [-1598, -20], [-1600, 10], [-1560, 20], [-1510, 18], [-1494, 10]], [[-1600, 10], [-1650, 4], [-1700, 0]]],
  gates: [g2('c_s', -1600, -112, 'beach', -1600, -282, Math.PI, 'SANDY SHORE', LV('Sandy Shore', 'Lv. 10–13')), g2('c_w', -1712, 0, 'jungle', -1972, 0, -Math.PI / 2, 'PALM ISLE', LV('Palm Isle', 'Lv. 15–17'))],
  way: { id: 'coral', name: 'Coralcove', x: -1588, z: -30 },
  npcs: [{ id: 'kiki', name: 'Kiki', role: 'Shell shop', x: -1582, z: 14, face: -1.3, lines: ['Shells, potions and island snacks!'] },
    { id: 'ula', name: 'Auntie Ula', role: 'Coralcove chief', x: -1622, z: 24, face: 2.6, lines: ['Welcome to Coralcove, little one.'] },
    { id: 'bahari2', look: 'bahari', name: 'Captain Bahari', role: 'Boat captain', x: -1502, z: 4, face: -1.57, lines: ['Ready to sail?'] }],
  look: { fog: 0xd4ecf2, near: 70, far: 220, sun: 0.66 }, arrive: { x: -1505, z: 10, face: -Math.PI / 2 },
  clear: [[-1600, 0, 30], [-1500, 6, 14]],
  extras(o) {
    const H = (x, z, roof, face) => K.house(x, z, roof, { face });
    H(-1572, 30, 0x2a9a8a, Math.PI + 0.5); H(-1630, 34, 0xff7a8a, Math.PI - 0.4); H(-1640, -20, 0xffb43d, Math.PI / 2 + 0.2); H(-1564, -26, 0x7cc4ff, -Math.PI / 2 - 0.3);
    K.tent(-1586, 14, -Math.PI / 2 + 0.3, K.awningTex);
    // the dock and the little boat
    const dock = new THREE.Group(); dock.position.set(-1494, 0, 6); K.root.add(dock);
    for (let i = 0; i < 9; i++) K.box(2.6, 0.2, 1.2, K.M_WOOD, i * 1.25, -0.1, 0, dock, Math.PI / 2);
    for (let i = 0; i < 5; i++) for (const s of [-1, 1]) K.box(0.25, 2.4, 0.25, K.M_WOOD, i * 2.6, -0.9, s * 1.4, dock);
    o.fx.boat = boatModel(); o.fx.boat.position.set(-1480, -0.3, 10); K.root.add(o.fx.boat);
    K.signPost(-1592, -40, Math.PI, 'Coralcove\nBeach town');
  },
  miniMid: (g) => { g.fillStyle = '#9a6e45'; g.fillRect(-1497, 4, 13, 3); },
  tick(dt, time, active, o) { if (active !== 'coral' || !LANDS.coral.fx) return; const f = LANDS.coral.fx; if (f.sea) f.sea.position.y = -0.55 + Math.sin(time * 0.6) * 0.08; if (f.boat) { f.boat.position.y = -0.3 + Math.sin(time * 1.3) * 0.08; f.boat.rotation.z = Math.sin(time * 0.9) * 0.04; } if (f.drift) K.drift(f.drift, dt, time, 0.3, false); } });
land({ id: 'beach', name: 'Sandy Shore', lv: 'Lv. 10–13', min: 10, title: 'Beach Expert', bonus: { hp: 80 }, bonusText: '+80 Max HP', kinds: ['sandpincher', 'jellybob', 'cocobonk'], cx: -1600, cz: -400, seed: 91002, sea: true, amp: 1.6,
  style: { tex: 'sand', tint: sandTint(1), tree: 'palm', trees: 70, rocks: 26, coral: 10, mini: { out: '#3aa7c8', in: '#f0dcae', rim: '#e8d0a0', tree: '#5fae45' }, drift: [0xffffff, 0.25, false] },
  roads: [[[-1600, -270], [-1590, -330], [-1610, -400], [-1596, -470], [-1600, -530]]],
  gates: [g2('b_n', -1600, -262, 'coral', -1600, -100, 0, 'CORALCOVE', LV('Coralcove', 'Town')), g2('b_s', -1600, -538, 'reef', -1600, -672, Math.PI, 'CORAL SHALLOWS', LV('Coral Shallows', 'Lv. 12–15'))],
  way: { id: 'beach', name: 'Sandy Shore', x: -1588, z: -290 },
  camps: [['sandpincher', 10, -1640, -320, 4, 6], ['sandpincher', 11, -1560, -350, 4, 6], ['sandpincher', 12, -1660, -460, 3, 6], ['jellybob', 11, -1550, -420, 4, 6], ['jellybob', 12, -1650, -400, 4, 6], ['jellybob', 13, -1560, -500, 3, 5],
    ['cocobonk', 12, -1620, -480, 3, 5], ['cocobonk', 12, -1540, -470, 3, 5], ['cocobonk', 13, -1680, -360, 3, 5]],
  chests: [['bc1', -1690, -330, 160, [['red_m', 2]], 'by the rocks in the west'], ['bc2', -1520, -500, 220, [['coral_branch', 1], ['blue_m', 2]], 'on the far east sand']],
  look: { fog: 0xd4ecf2, near: 70, far: 220, sun: 0.66 }, arrive: { x: -1600, z: -282, face: Math.PI },
  tick(dt, time, active) { if (active !== 'beach') return; const f = LANDS.beach.fx; if (f && f.sea) f.sea.position.y = -0.55 + Math.sin(time * 0.6) * 0.08; if (f && f.drift) K.drift(f.drift, dt, time, 0.3, false); } });
land({ id: 'reef', name: 'Coral Shallows', lv: 'Lv. 12–15', min: 12, title: 'Reef Expert', bonus: { mp: 60 }, bonusText: '+60 Max MP', kinds: ['starfin', 'puffpuff', 'jellybob'], cx: -1600, cz: -800, seed: 91003, sea: true, amp: 1.4,
  ponds: [{ x: -1640, z: -780, r: 12, base: 0.1, level: -0.35 }, { x: -1560, z: -840, r: 10, base: 0.1, level: -0.35 }, { x: -1590, z: -720, r: 7, base: 0.1, level: -0.35 }],
  style: { tex: 'sand', tint: (x, z, c) => { sandTint(0.95)(x, z, c); c[0] *= 0.98; c[2] *= 1.04; }, tree: 'palm', trees: 30, rocks: 30, coral: 70, mini: { out: '#3aa7c8', in: '#ecd8b0', rim: '#e0c898', tree: '#5fae45' } },
  gates: [g2('r_n', -1600, -662, 'beach', -1600, -518, 0, 'SANDY SHORE', LV('Sandy Shore', 'Lv. 10–13'))],
  way: { id: 'reef', name: 'Coral Shallows', x: -1588, z: -690 },
  camps: [['starfin', 13, -1620, -730, 4, 6], ['starfin', 13, -1550, -760, 4, 6], ['starfin', 14, -1660, -850, 4, 6], ['puffpuff', 14, -1600, -800, 3, 6], ['puffpuff', 14, -1530, -880, 3, 5], ['puffpuff', 15, -1650, -900, 3, 5], ['jellybob', 13, -1580, -880, 4, 5]],
  chests: [['rc1', -1680, -760, 260, [['coral_branch', 2]], 'behind the west pool'], ['rc2', -1520, -920, 300, [['light_shard', 1], ['red_m', 2]], 'at the far south-east corner']],
  look: { fog: 0xcfeef4, near: 70, far: 220, sun: 0.68 }, arrive: { x: -1600, z: -682, face: Math.PI },
  tick(dt, time, active) { if (active !== 'reef') return; const f = LANDS.reef.fx; if (f && f.sea) f.sea.position.y = -0.55 + Math.sin(time * 0.6) * 0.08; } });
land({ id: 'jungle', name: 'Palm Isle', lv: 'Lv. 15–17', min: 15, title: 'Jungle Expert', bonus: { atk: 8 }, bonusText: '+8 Attack', kinds: ['monkling', 'parrotto', 'cocobonk'], cx: -2100, cz: 0, seed: 91004, amp: 3,
  style: { tint: (x, z, c) => { c[0] *= 0.88; c[1] *= 1.04; c[2] *= 0.8; }, tree: 'palm', trees: 140, rocks: 24, flowers: [0xff5a5a, 0xffb43d, 0xff8ad8], tufts: 0x4f9a3a, mini: { out: '#3f7a3a', in: '#6fb04a', rim: '#5a944a', tree: '#2f6a2a' }, drift: [0xfff6a0, 0.2, true] },
  roads: [[[-1968, 0], [-2020, 10], [-2080, -10], [-2100, -60], [-2100, -128]]],
  gates: [g2('j_e', -1962, 0, 'coral', -1700, 0, Math.PI / 2, 'CORALCOVE', LV('Coralcove', 'Town')), g2('j_s', -2100, -138, 'lagoon', -2100, -272, Math.PI, 'BLUE LAGOON', LV('Blue Lagoon', 'Lv. 16–18'))],
  way: { id: 'jungle', name: 'Palm Isle', x: -1985, z: 12 },
  camps: [['monkling', 15, -2050, 40, 3, 6], ['monkling', 16, -2150, -40, 3, 6], ['monkling', 16, -2180, 60, 3, 5], ['parrotto', 16, -2120, 30, 3, 6], ['parrotto', 16, -2060, -70, 3, 6], ['parrotto', 17, -2200, 0, 3, 5], ['cocobonk', 15, -2020, 70, 3, 5], ['cocobonk', 15, -2140, -90, 3, 5]],
  chests: [['jc1', -2210, 90, 320, [['fire_opal', 1], ['red_m', 2]], 'deep in the north-west palms'], ['jc2', -2000, -100, 280, [['banana', 5], ['blue_m', 2]], 'south of the east gate']],
  look: { fog: 0xc0dcc4, near: 50, far: 170, sun: 0.56 }, arrive: { x: -1972, z: 0, face: -Math.PI / 2 },
  tick(dt, time, active) { if (active !== 'jungle') return; const f = LANDS.jungle.fx; if (f && f.drift) K.drift(f.drift, dt, time, 0.05, true); } });
land({ id: 'lagoon', name: 'Blue Lagoon', lv: 'Lv. 16–18', min: 16, title: 'Lagoon Expert', bonus: { def: 8 }, bonusText: '+8 Defense', kinds: ['bubblefrog', 'clamshell', 'parrotto'], cx: -2100, cz: -400, seed: 91005, amp: 2,
  ponds: [{ x: -2100, z: -400, r: 26, base: 0.1, level: -0.35 }, { x: -2040, z: -460, r: 12, base: 0.1, level: -0.35 }, { x: -2170, z: -340, r: 10, base: 0.1, level: -0.35 }],
  style: { tint: (x, z, c) => { c[0] *= 0.85; c[1] *= 1.05; c[2] *= 0.9; }, tree: 'palm', trees: 80, rocks: 30, flowers: [0x7cc4ff, 0xffffff, 0xff8ad8], tufts: 0x5aa84a, glowPond: true, mini: { out: '#3f7a5a', in: '#7ab86a', rim: '#5a946a', tree: '#2f6a2a' } },
  roads: [[[-2100, -268], [-2140, -330], [-2150, -400], [-2130, -470], [-2100, -530]], [[-2150, -400], [-2200, -400], [-2230, -400]]],
  gates: [g2('l_n', -2100, -262, 'jungle', -2100, -128, 0, 'PALM ISLE', LV('Palm Isle', 'Lv. 15–17')), g2('l_s', -2100, -538, 'volcano', -2100, -672, Math.PI, 'EMBER ISLE', LV('Ember Isle', 'Lv. 18–20')), g2('l_w', -2238, -400, 'seacave', -2503, -400, -Math.PI / 2, 'TIDE CAVE', LV('Tide Cave', 'Lv. 18–20 · Boss'))],
  way: { id: 'lagoon', name: 'Blue Lagoon', x: -2088, z: -290 },
  camps: [['bubblefrog', 16, -2050, -350, 4, 6], ['bubblefrog', 17, -2160, -460, 4, 6], ['bubblefrog', 17, -2040, -510, 3, 5], ['clamshell', 17, -2070, -440, 3, 5], ['clamshell', 18, -2180, -420, 3, 5], ['parrotto', 17, -2140, -300, 3, 5]],
  chests: [['lc1', -2200, -300, 340, [['clam_pearl', 1], ['red_m', 2]], 'on the north-west shore'], ['lc2', -2000, -520, 360, [['light_shard', 1], ['blue_m', 2]], 'on the south-east bank']],
  look: { fog: 0xc8e8e4, near: 60, far: 200, sun: 0.62 }, arrive: { x: -2100, z: -282, face: Math.PI } });
land({ id: 'volcano', name: 'Ember Isle', lv: 'Lv. 18–20', min: 18, title: 'Volcano Expert', bonus: { crit: 0.03 }, bonusText: '+3% Critical', kinds: ['magmalet', 'cindertail'], cx: -2100, cz: -800, seed: 91006, amp: 3,
  hill: (x, z) => { const d = Math.hypot(x + 2100, z + 840); return d < 60 ? Math.pow(1 - d / 60, 1.6) * 30 : 0; },
  blocks: [{ x: -2100, z: -840, r: 26 }, { x: -2040, z: -760, r: 6 }, { x: -2160, z: -770, r: 5 }],
  style: { tint: (x, z, c) => { const n = vnoise3(x * 0.06, 2.2, z * 0.06); c[0] *= 0.78 + n * 0.1; c[1] *= 0.66; c[2] *= 0.6; }, tex: 'cave', tree: 'pine', trees: 20, rocks: 60, rimRock: true, mini: { out: '#3a2a26', in: '#7a5a4a', rim: '#5a4036', tree: '#2a3a2a' }, drift: [0xff8a3d, 0.22, true] },
  gates: [g2('v_n', -2100, -662, 'lagoon', -2100, -518, 0, 'BLUE LAGOON', LV('Blue Lagoon', 'Lv. 16–18'))],
  way: { id: 'volcano', name: 'Ember Isle', x: -2088, z: -690 },
  camps: [['magmalet', 18, -2050, -720, 4, 6], ['magmalet', 19, -2160, -720, 4, 6], ['magmalet', 19, -2020, -880, 3, 5], ['cindertail', 19, -2180, -860, 3, 6], ['cindertail', 19, -2040, -800, 3, 5], ['cindertail', 20, -2170, -920, 3, 5]],
  chests: [['vc1', -2190, -930, 420, [['fire_opal', 2], ['red_m', 3]], 'behind the volcano in the south-west']],
  look: { fog: 0x7a5a50, near: 40, far: 160, sun: 0.48, noRing: true }, arrive: { x: -2100, z: -682, face: Math.PI },
  extras(o) {
    const y = K.height(-2100, -840);
    const lava = new THREE.MeshLambertMaterial({ color: 0xff7a2a, emissive: 0xc03a00 });
    const top = new THREE.Mesh(new THREE.CircleGeometry(9, 28), lava); top.rotation.x = -Math.PI / 2; top.position.set(-2100, K.height(-2100, -840) - 0.4, -840); K.root.add(top); o.fx.lava = [top];
    for (const [x, z, r] of [[-2040, -760, 5], [-2160, -770, 4]]) { const p = new THREE.Mesh(new THREE.CircleGeometry(r, 24), lava); p.rotation.x = -Math.PI / 2; p.position.set(x, K.height(x, z) + 0.1, z); K.root.add(p); o.fx.lava.push(p); const gl = glow(r * 1.8); gl.position.set(x, K.height(x, z) + 1, z); gl.material.color = new THREE.Color(0xff6a2a); gl.material.opacity = 0.35; K.root.add(gl); }
    const smoke = []; for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(geoSphere(3, 10, 8), new THREE.MeshLambertMaterial({ color: 0x6a5a5a, transparent: true, opacity: 0.45, depthWrite: false })); s.position.set(-2100, y + 4 + i * 4, -840); K.root.add(s); smoke.push(s); } o.fx.smoke = smoke;
    void y;
  },
  miniMid: (g) => { g.fillStyle = '#5a3a2a'; g.beginPath(); g.arc(-2100, -840, 30, 0, 7); g.fill(); g.fillStyle = '#ff7a2a'; g.beginPath(); g.arc(-2100, -840, 9, 0, 7); g.fill(); g.beginPath(); g.arc(-2040, -760, 5, 0, 7); g.fill(); g.beginPath(); g.arc(-2160, -770, 4, 0, 7); g.fill(); },
  tick(dt, time, active) { if (active !== 'volcano') return; const f = LANDS.volcano.fx; if (!f) return; if (f.drift) K.drift(f.drift, dt, time, 0.1, true); if (f.smoke) f.smoke.forEach((s, i) => { s.position.y += dt * 1.2; s.scale.setScalar(1 + ((s.position.y % 24) / 24)); if (s.position.y > K.height(-2100, -840) + 28) s.position.y -= 24; s.material.opacity = 0.45 - ((s.position.y % 24) / 24) * 0.35; }); if (f.lava) for (const l of f.lava) l.material.emissive.setRGB(0.75 + Math.sin(time * 2) * 0.1, 0.23, 0); } });
const SC = { cx: -2600, cz: -400 };
land({ id: 'seacave', name: 'Tide Cave', lv: 'Lv. 18–20 · Boss', min: 18, title: 'Tide Cave Expert', bonus: { hp: 120 }, bonusText: '+120 Max HP', kinds: ['starfin', 'puffpuff', 'bubblefrog'], cx: SC.cx, cz: SC.cz, seed: 91007,
  rooms: ROOMS(SC.cx, SC.cz), halls: HALLS,
  style: { tex: 'cave', tint: (x, z, c) => { c[0] *= 0.7; c[1] *= 0.85; c[2] *= 0.95; }, mini: { out: '#1a2a32', in: '#4a6a72', rim: '#2a3a42', tree: '#2a3a42' }, drift: [0x9ff5e8, 0.18, true] },
  gates: [{ id: 'sc_out', x: SC.cx + 112, z: SC.cz, to: 'lagoon', tx: -2225, tz: -400, face: Math.PI / 2, sign: 'BLUE LAGOON', hole: true }],
  camps: [['starfin', 18, SC.cx + 58, SC.cz + 6, 3, 5], ['bubblefrog', 18, SC.cx + 12, SC.cz - 14, 3, 6], ['puffpuff', 19, SC.cx + 18, SC.cz - 22, 2, 4], ['starfin', 19, SC.cx - 36, SC.cz + 4, 3, 5], ['puffpuff', 19, SC.cx - 40, SC.cz, 2, 4], ['tidecrab_king', 20, SC.cx - 100, SC.cz, 1, 0]],
  look: { fog: 0x14262c, near: 12, far: 60, sun: 0.34, under: true }, arrive: { x: SC.cx + 100, z: SC.cz, face: -Math.PI / 2 },
  tick(dt, time, active) { if (active !== 'seacave') return; const f = LANDS.seacave.fx; if (f && f.drift) K.drift(f.drift, dt, time, 0.05, true); } });
// --- Chapter 3
const snowTint = (x, z, c) => { const n = vnoise3(x * 0.05, 5.5, z * 0.05); c[0] *= 0.96 + n * 0.04; c[1] *= 0.98 + n * 0.03; c[2] *= 1.04; };
const SNOW = { tex: 'snow', tint: snowTint, tree: 'snow', edgeCol: [0.94, 0.96, 1.0, 30], mini: { out: '#9ab0c8', in: '#f4f8fc', rim: '#d8e4f0', tree: '#2f5a46' }, drift: [0xffffff, 0.35, false] };
const snowLook = { fog: 0xe4eef6, near: 50, far: 180, sun: 0.62 };
const snowTick = (id, wind) => (dt, time, active) => { if (active !== id) return; const f = LANDS[id].fx; if (f && f.drift) K.drift(f.drift, dt, time, wind, false); };
land({ id: 'frost', name: 'Frostpeak', lv: 'Snow town · safe', cx: FROST.cx, cz: FROST.cz, A: 120, seed: 92001, sea: true, seaCol: 0x5a8ab0, amp: 1.4,
  style: Object.assign({}, SNOW, { trees: 30, rocks: 12, ice: 8 }),
  roads: [[[-3100, -105], [-3100, -50], [-3096, 0], [-3060, 14], [-3010, 16], [-2994, 8]]],
  gates: [g2('f_s', -3100, -112, 'snowfield', -3100, -282, Math.PI, 'SNOWY FIELDS', LV('Snowy Fields', 'Lv. 20–23'))],
  way: { id: 'frost', name: 'Frostpeak', x: -3088, z: -30 },
  npcs: [{ id: 'sven', name: 'Grandpa Sven', role: 'Frostpeak elder', x: -3120, z: 22, face: 2.6, lines: ['Brr! Welcome, welcome. Come stand by the fire.'] },
    { id: 'freya', name: 'Freya', role: 'Tea & furs shop', x: -3082, z: 14, face: -1.3, lines: ['Warm Tea! Get your Warm Tea!'] },
    { id: 'bahari3', look: 'bahari', name: 'Captain Bahari', role: 'Boat captain', x: -3002, z: 4, face: -1.57, lines: ['Cold, isn\'t it? Ready to sail back?'] }],
  look: { fog: 0xe4eef6, near: 60, far: 200, sun: 0.62 }, arrive: { x: -3005, z: 10, face: -Math.PI / 2 },
  clear: [[-3100, 0, 30], [-3000, 6, 14]],
  extras(o) {
    const H = (x, z, face) => K.house(x, z, 0xf4f8ff, { face, stone: true });
    H(-3072, 30, Math.PI + 0.5); H(-3130, 34, Math.PI - 0.4); H(-3140, -20, Math.PI / 2 + 0.2); H(-3064, -26, -Math.PI / 2 - 0.3);
    K.tent(-3086, 14, -Math.PI / 2 + 0.3, K.tentTex);
    // the campfire in the middle of town
    const y = K.height(-3100, 0), fire = new THREE.Group(); fire.position.set(-3100, y, 0); K.root.add(fire);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; K.box(1.4, 0.25, 0.25, K.M_WOOD, Math.cos(a) * 0.4, 0.15, Math.sin(a) * 0.4, fire, a); }
    const fl = new THREE.Mesh(geoCone(0.5, 1.3, 8), new THREE.MeshLambertMaterial({ color: 0xffb43d, emissive: 0xc05a00 })); fl.position.y = 0.8; fire.add(fl);
    const gl = glow(4); gl.position.y = 1; gl.material.color = new THREE.Color(0xffa040); gl.material.opacity = 0.5; fire.add(gl);
    o.fx.fire = fl; K.addCollider(-3100, 0, 1.2);
    const dock = new THREE.Group(); dock.position.set(-2994, 0, 6); K.root.add(dock);
    for (let i = 0; i < 9; i++) K.box(2.6, 0.2, 1.2, K.M_WOOD, i * 1.25, -0.1, 0, dock, Math.PI / 2);
    o.fx.boat = boatModel(); o.fx.boat.position.set(-2980, -0.3, 10); K.root.add(o.fx.boat);
    K.signPost(-3092, -40, Math.PI, 'Frostpeak\nSnow town');
  },
  tick(dt, time, active) { if (active !== 'frost') return; const f = LANDS.frost.fx; if (!f) return; if (f.drift) K.drift(f.drift, dt, time, 0.2, false); if (f.fire) { const s = 1 + Math.sin(time * 13) * 0.08; f.fire.scale.set(s, s * (1 + Math.sin(time * 9) * 0.1), s); } if (f.boat) f.boat.position.y = -0.3 + Math.sin(time * 1.3) * 0.08; } });
land({ id: 'snowfield', name: 'Snowy Fields', lv: 'Lv. 20–23', min: 20, title: 'Snow Expert', bonus: { hp: 150 }, bonusText: '+150 Max HP', kinds: ['snowbun', 'frostling'], cx: -3100, cz: -400, seed: 92002, amp: 3,
  style: Object.assign({}, SNOW, { trees: 60, rocks: 26, ice: 10 }),
  roads: [[[-3100, -268], [-3090, -330], [-3110, -400], [-3100, -470], [-3100, -530]], [[-3110, -400], [-3180, -400], [-3230, -400]]],
  gates: [g2('s_n', -3100, -262, 'frost', -3100, -100, 0, 'FROSTPEAK', LV('Frostpeak', 'Town')), g2('s_s', -3100, -538, 'pines', -3100, -672, Math.PI, 'FROSTPINE WOOD', LV('Frostpine Wood', 'Lv. 22–25')), g2('s_w', -3238, -400, 'glacier', -3372, -400, -Math.PI / 2, 'GLACIER LAKE', LV('Glacier Lake', 'Lv. 24–27'))],
  way: { id: 'snowfield', name: 'Snowy Fields', x: -3088, z: -290 },
  camps: [['snowbun', 20, -3050, -330, 4, 6], ['snowbun', 21, -3150, -350, 4, 6], ['snowbun', 21, -3040, -470, 4, 6], ['frostling', 21, -3160, -460, 4, 6], ['frostling', 22, -3060, -400, 3, 5], ['frostling', 23, -3170, -510, 3, 5]],
  chests: [['sf1', -3190, -320, 480, [['warm_tea', 5], ['red_m', 3]], 'in the north-west snow'], ['sf2', -3010, -510, 520, [['light_shard', 1], ['snow_crystal', 1]], 'by the south-east trees']],
  look: snowLook, arrive: { x: -3100, z: -282, face: Math.PI }, tick: snowTick('snowfield', 0.4) });
land({ id: 'pines', name: 'Frostpine Wood', lv: 'Lv. 22–25', min: 22, title: 'Frostpine Expert', bonus: { atk: 12 }, bonusText: '+12 Attack', kinds: ['pinewolf', 'snowowl'], cx: -3100, cz: -800, seed: 92003, amp: 3.4,
  style: Object.assign({}, SNOW, { trees: 160, rocks: 20 }),
  roads: [[[-3100, -668], [-3080, -740], [-3110, -820], [-3090, -900]]],
  gates: [g2('p_n', -3100, -662, 'snowfield', -3100, -518, 0, 'SNOWY FIELDS', LV('Snowy Fields', 'Lv. 20–23'))],
  way: { id: 'pines', name: 'Frostpine Wood', x: -3088, z: -690 },
  camps: [['pinewolf', 22, -3060, -740, 3, 6], ['pinewolf', 23, -3150, -780, 3, 6], ['pinewolf', 24, -3060, -880, 3, 6], ['snowowl', 23, -3140, -720, 3, 5], ['snowowl', 24, -3040, -820, 3, 5], ['snowowl', 25, -3160, -900, 3, 5]],
  chests: [['pc1', -3190, -900, 560, [['snow_crystal', 2], ['blue_m', 3]], 'deep in the south-west pines']],
  look: { fog: 0xd0e0e8, near: 40, far: 150, sun: 0.5 }, arrive: { x: -3100, z: -682, face: Math.PI }, tick: snowTick('pines', 0.1) });
land({ id: 'glacier', name: 'Glacier Lake', lv: 'Lv. 24–27', min: 24, title: 'Glacier Expert', bonus: { def: 12 }, bonusText: '+12 Defense', kinds: ['penguling', 'chillbat'], cx: -3500, cz: -400, seed: 92004, amp: 2,
  ponds: [{ x: -3500, z: -400, r: 30, base: 0.1, level: -0.25 }, { x: -3440, z: -470, r: 12, base: 0.1, level: -0.25 }, { x: -3560, z: -330, r: 9, base: 0.1, level: -0.25 }],
  style: Object.assign({}, SNOW, { trees: 50, rocks: 20, ice: 30 }),
  roads: [[[-3368, -400], [-3420, -380], [-3460, -350], [-3500, -340], [-3540, -360], [-3580, -400], [-3630, -400]], [[-3500, -340], [-3500, -300]], [[-3540, -360], [-3520, -460], [-3500, -530]]],
  gates: [g2('g_e', -3362, -400, 'snowfield', -3228, -400, Math.PI / 2, 'SNOWY FIELDS', LV('Snowy Fields', 'Lv. 20–23')), g2('g_s', -3500, -538, 'peak', -3500, -672, Math.PI, 'WINDY PEAK', LV('Windy Peak', 'Lv. 26–30')), g2('g_w', -3638, -400, 'icecave', -3803, -400, -Math.PI / 2, 'ICE CAVE', LV('Ice Cave', 'Lv. 28–30 · Boss'))],
  way: { id: 'glacier', name: 'Glacier Lake', x: -3388, z: -412 },
  camps: [['penguling', 24, -3440, -340, 4, 6], ['penguling', 25, -3570, -460, 4, 6], ['penguling', 26, -3430, -530, 3, 5], ['chillbat', 25, -3560, -300, 3, 5], ['chillbat', 26, -3600, -500, 3, 5], ['chillbat', 26, -3420, -420, 3, 5]],
  chests: [['gc1', -3600, -300, 600, [['warm_tea', 5], ['snow_crystal', 1]], 'north-west of the lake'], ['gc2', -3420, -540, 640, [['light_shard', 1], ['red_m', 3]], 'south-east of the lake']],
  look: snowLook, arrive: { x: -3372, z: -400, face: -Math.PI / 2 }, tick: snowTick('glacier', 0.3) });
land({ id: 'peak', name: 'Windy Peak', lv: 'Lv. 26–30', min: 26, title: 'Peak Expert', bonus: { crit: 0.04 }, bonusText: '+4% Critical', kinds: ['yetiling', 'galebird'], cx: -3500, cz: -800, seed: 92005, amp: 5, rim: 50,
  hill: (x, z) => Math.max(0, 1 - Math.hypot(x + 3500, z + 860) / 120) * 14,
  style: Object.assign({}, SNOW, { trees: 40, rocks: 50, ice: 16, rimRock: true }),
  roads: [[[-3500, -668], [-3480, -740], [-3510, -800], [-3500, -880]]],
  gates: [g2('k_n', -3500, -662, 'glacier', -3500, -518, 0, 'GLACIER LAKE', LV('Glacier Lake', 'Lv. 24–27'))],
  way: { id: 'peak', name: 'Windy Peak', x: -3488, z: -690 },
  camps: [['yetiling', 27, -3450, -760, 3, 6], ['yetiling', 28, -3560, -820, 3, 6], ['yetiling', 29, -3480, -900, 3, 5], ['galebird', 27, -3550, -740, 3, 5], ['galebird', 28, -3430, -850, 3, 5], ['galebird', 30, -3560, -910, 3, 5]],
  chests: [['kc1', -3500, -930, 800, [['light_shard', 2], ['snow_crystal', 2]], 'at the very top of the peak']],
  look: { fog: 0xdce8f4, near: 40, far: 170, sun: 0.66 }, arrive: { x: -3500, z: -682, face: Math.PI }, tick: snowTick('peak', 1.2) });
const IC = { cx: -3900, cz: -400 };
land({ id: 'icecave', name: 'Ice Cave', lv: 'Lv. 28–30 · Boss', min: 28, title: 'Ice Cave Expert', bonus: { atk: 15 }, bonusText: '+15 Attack', kinds: ['frostling', 'chillbat', 'yetiling'], cx: IC.cx, cz: IC.cz, seed: 92006,
  rooms: ROOMS(IC.cx, IC.cz), halls: HALLS,
  style: { tex: 'snow', tint: (x, z, c) => { c[0] *= 0.8; c[1] *= 0.9; c[2] *= 1.05; }, ice: true, mini: { out: '#2a3a52', in: '#bfd8f0', rim: '#6a8ab0', tree: '#6a8ab0' }, drift: [0xe0f4ff, 0.22, false] },
  gates: [{ id: 'ic_out', x: IC.cx + 112, z: IC.cz, to: 'glacier', tx: -3625, tz: -400, face: Math.PI / 2, sign: 'GLACIER LAKE', hole: true }],
  camps: [['frostling', 28, IC.cx + 58, IC.cz + 6, 3, 5], ['chillbat', 28, IC.cx + 12, IC.cz - 14, 3, 6], ['yetiling', 29, IC.cx + 18, IC.cz - 22, 2, 4], ['frostling', 29, IC.cx - 36, IC.cz + 4, 3, 5], ['chillbat', 29, IC.cx - 40, IC.cz, 2, 4], ['frost_yeti', 30, IC.cx - 100, IC.cz, 1, 0]],
  look: { fog: 0x1c2a3a, near: 14, far: 64, sun: 0.4, under: true }, arrive: { x: IC.cx + 100, z: IC.cz, face: -Math.PI / 2 },
  tick(dt, time, active) { if (active !== 'icecave') return; const f = LANDS.icecave.fx; if (f && f.drift) K.drift(f.drift, dt, time, 0.05, false); } });

// a little sailing boat (the dock captains' boats)
function boatModel() {
  const g = new THREE.Group();
  const hull = new THREE.Mesh(cachedGeo('boathull', () => { const s = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); return s; }), lam(0xffffff, K.woodTex)); hull.scale.set(1.6, 0.9, 4); g.add(hull);
  K.box(2.8, 0.15, 6.8, K.M_WOOD, 0, 0, 0, g);
  K.box(0.2, 6, 0.2, K.M_WOOD, 0, 3, 0.3, g);
  const sail = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.8), lam(0xfff6e0, null, { side: THREE.DoubleSide })); sail.position.set(0, 3.8, -0.4); sail.rotation.y = Math.PI / 2; g.add(sail);
  const st = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.5), lam(0xff7a8a, null, { side: THREE.DoubleSide })); st.position.set(0.01, 3.3, -0.4); st.rotation.y = Math.PI / 2; g.add(st);
  return g;
}
const LANDS = {}; for (const L of W.LANDS) LANDS[L.id] = L;
// the tide gates and ice walls of the dungeons (adventure.js opens them)
const DOORS = { seacave: [], icecave: [] };
for (const [id, c] of [['seacave', SC], ['icecave', IC]]) {
  const rooms = LANDS[id].rooms;
  for (let i = 0; i < 3; i++) { const a = rooms[i + 1], b = rooms[i + 2], mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, D = { i, x: mx, z: mz, r: 5.2, open: false }; D.on = () => !D.open; DOORS[id].push(D); BLOCKS[id].push(D); }
  void c;
}
RW.LANDS_DATA = { LANDS, DOORS, BLOCKS, CORAL, FROST, SC, IC, boatModel, palm, snowPine, sandTex, snowTex };
})();
