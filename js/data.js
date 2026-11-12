// Russel World: game data (items, monsters, shop, skills, formulas). Numbers live here so balance is easy to tune.
(function () {
'use strict';
const RW = window.RW = window.RW || {};

// rarity: Common (white), Rare (blue), Epic (purple), Legendary (orange)
const RARITY = {
  common: { name: 'Common', color: '#fff8ea', ink: '#6e5240', ring: 0xfff2a0 },
  rare: { name: 'Rare', color: '#7cc4ff', ink: '#2f6fb0', ring: 0x7cc4ff },
  epic: { name: 'Epic', color: '#d39cff', ink: '#7a3fb0', ring: 0xd39cff },
  legendary: { name: 'Legendary', color: '#ffb45c', ink: '#b0661e', ring: 0xffb45c }
};

const ITEMS = {
  red_s: { name: 'Red Potion (S)', kind: 'potion', rarity: 'common', heal: 60, price: 15, sell: 4, icon: 'potion', color: '#e65a50', desc: 'A small bottle of berry tonic. Restores 60 HP.' },
  red_m: { name: 'Red Potion (M)', kind: 'potion', rarity: 'common', heal: 160, price: 45, sell: 12, icon: 'potion', color: '#c8403a', big: true, desc: 'A hearty bottle. Restores 160 HP.' },
  blue_s: { name: 'Blue Potion (S)', kind: 'potion', rarity: 'common', mana: 30, price: 20, sell: 5, icon: 'potion', color: '#4a92e0', desc: 'Cool mint water from Mira\'s well. Restores 30 MP.' },
  blue_m: { name: 'Blue Potion (M)', kind: 'potion', rarity: 'common', mana: 80, price: 55, sell: 14, icon: 'potion', color: '#3470c0', big: true, desc: 'A tall bottle of mint water. Restores 80 MP.' },
  // v1.5 (user's choice): bigger potions for later lands. L in Coralcove and Frostpeak, L and XL in Sunhaven
  red_l: { name: 'Red Potion (L)', kind: 'potion', rarity: 'common', heal: 400, price: 120, sell: 30, icon: 'potion', color: '#a82a26', big: true, desc: 'A big jug of berry tonic. Restores 400 HP.' },
  red_xl: { name: 'Red Potion (XL)', kind: 'potion', rarity: 'common', heal: 900, price: 280, sell: 70, icon: 'potion', color: '#8a1a1e', big: true, desc: 'The grandest bottle in Sunhaven. Restores 900 HP.' },
  blue_l: { name: 'Blue Potion (L)', kind: 'potion', rarity: 'common', mana: 200, price: 140, sell: 35, icon: 'potion', color: '#2458a8', big: true, desc: 'A big jug of cool mint water. Restores 200 MP.' },
  blue_xl: { name: 'Blue Potion (XL)', kind: 'potion', rarity: 'common', mana: 450, price: 320, sell: 80, icon: 'potion', color: '#183c80', big: true, desc: 'Deep blue and fizzy. Restores 450 MP.' },
  // cures for status effects (delivery 5)
  antidote: { name: 'Antidote', kind: 'potion', rarity: 'common', cure: 'poison', price: 20, sell: 5, icon: 'potion', color: '#7cbf4f', desc: 'Bitter green drops. Cures poison.' },
  wake_herb: { name: 'Wake-up Herb', kind: 'potion', rarity: 'common', cure: 'stun', price: 18, sell: 4, icon: 'sprout', color: '#f2c14e', desc: 'Smells so strong it shakes off any dizziness.' },
  warm_tea: { name: 'Warm Tea', kind: 'potion', rarity: 'common', cure: 'freeze', price: 18, sell: 4, icon: 'potion', color: '#e8a35a', desc: 'A hot cup of tea. Thaws you out when you are frozen.' },
  leaf_jelly: { name: 'Leaf Jelly', kind: 'material', rarity: 'common', sell: 3, food: 10, icon: 'jelly', color: '#8ee07a', desc: 'Wobbly green jelly left by a Leaflet. Smells like lettuce. Pets will nibble it.' },
  sweet_sprout: { name: 'Sweet Sprout', kind: 'material', rarity: 'common', sell: 8, food: 25, icon: 'sprout', color: '#9ad36a', desc: 'A garden sprout a Leaflet was saving for later. A tasty pet snack.' },
  golden_leaf: { name: 'Golden Leaf', kind: 'material', rarity: 'rare', sell: 45, icon: 'leaf', color: '#f2c14e', desc: 'A shiny leaf that only grows on very lucky Leaflets.' },
  mush_cap: { name: 'Mushling Cap', kind: 'material', rarity: 'common', sell: 7, icon: 'cap', color: '#e8604c', desc: 'A soft red cap with white spots. Mushlings grow a new one by morning.' },
  spore_puff: { name: 'Spore Puff', kind: 'material', rarity: 'common', sell: 11, icon: 'puff', color: '#f3e3c0', desc: 'A fluffy ball of spores. Do not sneeze near it.' },
  lucky_clover: { name: 'Lucky Clover', kind: 'material', rarity: 'epic', sell: 160, icon: 'clover', color: '#5fbf5a', desc: 'Four leaves, one wish. Collectors in town pay well for it.' },
  pet_treat: { name: 'Pet Treat', kind: 'material', rarity: 'common', price: 15, sell: 6, food: 30, fun: 10, icon: 'treat', color: '#e8a35a', desc: 'A crunchy biscuit that pets love. Fills them up and cheers them up.' },
  // pets (delivery 6): food from Pip, and the rare wild egg that monsters drop
  pet_kibble: { name: 'Pet Kibble', kind: 'material', rarity: 'common', price: 10, sell: 3, food: 35, icon: 'kibble', color: '#c98f5a', desc: 'Little crunchy bites from Pip. Every pet eats them.' },
  berry_bowl: { name: 'Berry Bowl', kind: 'material', rarity: 'common', price: 28, sell: 8, food: 60, fun: 15, icon: 'bowl', color: '#e8604c', desc: 'A bowl of sweet berries. A real feast for a pet.' },
  wild_egg: { name: 'Wild Egg', kind: 'egg', rarity: 'epic', sell: 0, icon: 'egg', color: '#a77d55', desc: 'A speckled egg a monster was hiding. Carry it on your adventures and something will hatch!' },
  // Breezy Hills
  breeze_jelly: { name: 'Breeze Jelly', kind: 'material', rarity: 'common', sell: 9, food: 12, icon: 'jelly', color: '#9fe0e6', desc: 'Cool, wobbly jelly that smells like fresh air after rain.' },
  dandelion_fluff: { name: 'Dandelion Fluff', kind: 'material', rarity: 'common', sell: 12, icon: 'fluff', color: '#fbf6e8', desc: 'A soft puff of seeds. Make a wish first, then sell it.' },
  boar_bristle: { name: 'Boar Bristle', kind: 'material', rarity: 'common', sell: 14, icon: 'bristle', color: '#6e4529', desc: 'Stiff and scratchy. Old Tobin makes kite brushes out of them.' },
  little_tusk: { name: 'Little Tusk', kind: 'material', rarity: 'rare', sell: 70, icon: 'tusk', color: '#fff3dc', desc: 'A small, smooth tusk. Bristleboars lose them when they charge into rocks.' },
  // Whisperwood
  glowcap: { name: 'Glowcap', kind: 'material', rarity: 'common', sell: 16, food: 15, icon: 'cap', color: '#6fd3a4', desc: 'A mossy mushroom cap that glows softly in the dark.' },
  thorn_quill: { name: 'Thorn Quill', kind: 'material', rarity: 'common', sell: 18, icon: 'quill', color: '#6b4a30', desc: 'A sharp quill from a Thornhog. Hold it by the round end.' },
  forest_amber: { name: 'Forest Amber', kind: 'material', rarity: 'rare', sell: 90, icon: 'gem', color: '#f0a63a', desc: 'Old tree sap that turned into a warm golden stone.' },
  // Riverside, Thornbush and the Rootling Burrow
  pond_slime: { name: 'Pond Slime', kind: 'material', rarity: 'common', sell: 18, food: 12, icon: 'jelly', color: '#7fc0a0', desc: 'Cool green goo from a Plopfrog. Squishy and a bit smelly.' },
  river_pearl: { name: 'River Pearl', kind: 'material', rarity: 'rare', sell: 110, icon: 'gem', color: '#e6eef8', desc: 'A round, shiny pearl from the river bed. Nora says they bring calm water.' },
  pebble_shell: { name: 'Pebble Shell', kind: 'material', rarity: 'common', sell: 20, icon: 'cap', color: '#9aa5b0', desc: 'A hard, stony shell a Rockpinch grew out of.' },
  crab_claw: { name: 'Big Pincer', kind: 'material', rarity: 'rare', sell: 120, icon: 'tusk', color: '#e0805a', desc: 'A huge old pincer. Still snaps shut if you tickle it.' },
  acorn: { name: 'Shiny Acorn', kind: 'material', rarity: 'common', sell: 16, food: 20, icon: 'cap', color: '#b07a45', desc: 'A polished acorn from a Nutsnatcher\'s pouch. Pets love to crunch it.' },
  honey_drop: { name: 'Honey Drop', kind: 'material', rarity: 'common', sell: 22, food: 30, fun: 5, icon: 'jelly', color: '#f2b63d', desc: 'A sticky golden drop of bramble honey. Very sweet.' },
  bee_stinger: { name: 'Bramble Stinger', kind: 'material', rarity: 'rare', sell: 130, icon: 'quill', color: '#4a3a5a', desc: 'A tiny purple stinger. Bolt says it makes a sharp blade even sharper.' },
  bramble_twig: { name: 'Bramble Twig', kind: 'material', rarity: 'common', sell: 24, icon: 'bristle', color: '#7a4a6a', desc: 'A thorny purple twig from a Bushling. Wear gloves.' },
  root_knot: { name: 'Root Knot', kind: 'material', rarity: 'common', sell: 20, icon: 'tusk', color: '#8a5c3b', desc: 'A twisty knot of root. Rootlings tie them for luck.' },
  heartwood: { name: 'Heartwood', kind: 'material', rarity: 'rare', sell: 150, icon: 'gem', color: '#c9783a', desc: 'The warm, glowing middle of a very old root.' },
  // Pebble Cave (delivery 9)
  pebble_jelly: { name: 'Pebble Jelly', kind: 'material', rarity: 'common', sell: 24, food: 14, icon: 'jelly', color: '#b8c2cc', desc: 'Grey jelly with little stones inside. Crunchy. Not for people.' },
  cave_crystal: { name: 'Cave Crystal', kind: 'material', rarity: 'common', sell: 28, icon: 'gem', color: '#9fd8ff', desc: 'A small blue crystal that glows in the dark. Gemcaps grow them on their heads.' },
  star_quartz: { name: 'Star Quartz', kind: 'material', rarity: 'rare', sell: 160, icon: 'gem', color: '#d2b0ff', desc: 'A violet crystal with a tiny star frozen inside.' },
  royal_jelly: { name: 'Royal Leaf Jelly', kind: 'material', rarity: 'epic', sell: 260, food: 60, fun: 20, icon: 'jelly', color: '#ffd36e', desc: 'Golden jelly from the King of all Leaflets. Warm, and it smells like summer.' },
  sunstone: { name: 'Sunstone', kind: 'material', rarity: 'epic', sell: 300, icon: 'gem', color: '#ffb02e', desc: 'A drop of sunshine the King squeezed into a stone. Bolt can set it in a pendant.' },
  // v1.2: drops from the new monsters
  fluffy_tail: { name: 'Cotton Tail', kind: 'material', rarity: 'common', sell: 5, icon: 'fluff', color: '#ffffff', desc: 'A soft cotton puff a Bunbun left behind. It grows back.' },
  snail_slime: { name: 'Snail Shine', kind: 'material', rarity: 'common', sell: 8, food: 12, icon: 'jelly', color: '#e8d79a', desc: 'Shiny, sticky snail goo. Pets think it tastes like honey.' },
  wool_tuft: { name: 'Wool Tuft', kind: 'material', rarity: 'common', sell: 12, icon: 'fluff', color: '#fbf7ee', desc: 'A cloud of warm wool from a Woolly. Very cosy.' },
  sky_feather: { name: 'Sky Feather', kind: 'material', rarity: 'common', sell: 15, icon: 'quill', color: '#7ab8e8', desc: 'A light blue feather. It floats down slowly when you drop it.' },
  owl_feather: { name: 'Owl Feather', kind: 'material', rarity: 'common', sell: 17, icon: 'quill', color: '#9a7048', desc: 'A soft brown feather. It makes no sound at all.' },
  fox_fluff: { name: 'Fox Fluff', kind: 'material', rarity: 'common', sell: 19, icon: 'fluff', color: '#e07a3a', desc: 'Orange fluff from a Fernfox tail. Smells like ferns.' },
  duck_down: { name: 'Duck Down', kind: 'material', rarity: 'common', sell: 17, icon: 'fluff', color: '#ffe070', desc: 'Tiny yellow duckling feathers. Perfect for pillows.' },
  turtle_scute: { name: 'Turtle Scute', kind: 'material', rarity: 'common', sell: 22, icon: 'cap', color: '#4f8a4a', desc: 'A green shell plate a Snapturtle grew out of.' },
  beetle_shell: { name: 'Beetle Shell', kind: 'material', rarity: 'common', sell: 25, icon: 'cap', color: '#6a3a9a', desc: 'A shiny purple wing case. Bolt polishes them into buttons.' },
  spring_leg: { name: 'Spring Leg', kind: 'material', rarity: 'common', sell: 26, icon: 'bristle', color: '#8fd060', desc: 'A bouncy hopper leg. It still kicks a little.' },
  glow_goo: { name: 'Glow Goo', kind: 'material', rarity: 'common', sell: 18, food: 14, icon: 'jelly', color: '#9ff5d2', desc: 'Glowing green goo. A pet that eats it glows for a minute.' },
  mole_claw: { name: 'Mole Claw', kind: 'material', rarity: 'common', sell: 20, icon: 'tusk', color: '#f0b8a0', desc: 'A strong little digging claw. Good for gardens.' },
  bat_wing: { name: 'Bat Wing', kind: 'material', rarity: 'common', sell: 27, icon: 'leaf', color: '#4a3a6a', desc: 'A thin purple wing. Light as paper.' },
  rock_heart: { name: 'Rock Heart', kind: 'material', rarity: 'rare', sell: 140, icon: 'gem', color: '#9fd8ff', desc: 'The glowing crystal heart of a Rocklet. Warm, and it hums.' },
  // quest items never go in the bag; the quest book counts them
  sunberry: { name: 'Sunberry', kind: 'quest', rarity: 'rare', sell: 0, icon: 'berry', color: '#ffb43d', desc: 'A garden berry that soaks up sunshine. Warm to the touch.' },
  bolt_hammer: { name: "Bolt's Little Hammer", kind: 'quest', rarity: 'rare', sell: 0, icon: 'hammer', color: '#9aa5b0', desc: 'Small, scuffed and much loved.' },
  tobin_kite: { name: "Tobin's Kite", kind: 'quest', rarity: 'rare', sell: 0, icon: 'kite', color: '#e8604c', desc: 'A paper kite with a long ribbon tail. A little tangled.' }
};

// monster kinds: stats are for baseLv and scale per level above it
// move: how the body bobs (hop, waddle, trot); die: how it leaves (melt, poof, tip)
// aggro: attacks first when you come this close; charge: runs at you after pawing the ground; thorns: hurts you back when you hit it up close
const KINDS = {
  leaflet: {
    name: 'Leaflet', baseLv: 1, hp: 42, dmg: [4, 6], def: 0, exp: 14, coins: [2, 4], radius: 0.55, scale: 0.72, speed: 0.9, chase: 1.9, atkGap: 1.6, headY: 0.75,
    helpers: 0.4, move: 'hop', die: 'melt', area: 'meadow', element: 'earth', weak: 'fire',
    about: 'A wobbly green jelly with a leaf on its head. Friendly until you poke it, then all its friends come too.',
    drops: [['leaf_jelly', 0.6], ['sweet_sprout', 0.12], ['red_s', 0.04], ['golden_leaf', 0.02], ['lucky_clover', 0.003]]
  },
  mushling: {
    name: 'Mushling', baseLv: 3, hp: 120, dmg: [8, 11], def: 2, exp: 38, coins: [6, 10], radius: 0.5, scale: 0.9, speed: 0.7, chase: 1.6, atkGap: 1.8, headY: 0.75,
    helpers: 0, move: 'waddle', die: 'poof', area: 'meadow', element: 'earth', weak: 'wind',
    about: 'A little walking mushroom. Slow, sleepy and surprisingly good at headbutts.',
    drops: [['mush_cap', 0.55], ['spore_puff', 0.35], ['blue_s', 0.05], ['red_s', 0.04], ['lucky_clover', 0.006]]
  },
  breeze_leaflet: {
    name: 'Breeze Leaflet', baseLv: 3, hp: 110, dmg: [9, 12], def: 2, exp: 40, coins: [6, 10], radius: 0.55, scale: 0.78, speed: 1.0, chase: 2.0, atkGap: 1.5, headY: 0.75,
    helpers: 0.4, move: 'hop', die: 'melt', area: 'hills', element: 'wind', weak: 'earth', build: 'breeze',
    about: 'A Leaflet that moved up the hills for the fresh air. It wears a dandelion puff and floats a little on every hop.',
    drops: [['breeze_jelly', 0.55], ['dandelion_fluff', 0.25], ['red_s', 0.05], ['golden_leaf', 0.025], ['lucky_clover', 0.004]]
  },
  bristleboar: {
    name: 'Bristleboar', baseLv: 4, hp: 190, dmg: [12, 16], def: 4, exp: 70, coins: [10, 16], radius: 0.75, scale: 0.95, speed: 0.9, chase: 2.6, atkGap: 1.7, headY: 0.85,
    helpers: 0, move: 'trot', die: 'tip', area: 'hills', element: 'earth', weak: 'water', aggro: 5.5, charge: 1.7, stun: 0.5,
    about: 'Paws the ground, snorts, then charges straight at you. The charge always lands, so bring potions.',
    drops: [['boar_bristle', 0.55], ['red_s', 0.08], ['little_tusk', 0.03], ['lucky_clover', 0.006]]
  },
  moss_mushling: {
    name: 'Moss Mushling', baseLv: 5, hp: 250, dmg: [15, 19], def: 5, exp: 88, coins: [12, 18], radius: 0.5, scale: 0.98, speed: 0.7, chase: 1.7, atkGap: 1.8, headY: 0.75,
    helpers: 0.25, move: 'waddle', die: 'poof', area: 'wood', element: 'water', weak: 'fire', build: 'moss', poison: 0.25,
    about: 'A Mushling covered in soft moss. Its spots glow in the shade of Whisperwood, so it is easy to find and hard to hide from.',
    drops: [['glowcap', 0.5], ['spore_puff', 0.3], ['blue_s', 0.06], ['red_s', 0.05], ['lucky_clover', 0.007]]
  },
  thornhog: {
    name: 'Thornhog', baseLv: 6, hp: 250, dmg: [15, 19], def: 6, exp: 115, coins: [14, 22], radius: 0.6, scale: 0.92, speed: 0.8, chase: 2.3, atkGap: 1.7, headY: 0.7,
    helpers: 0, move: 'trot', die: 'tip', area: 'wood', element: 'earth', weak: 'fire', aggro: 4.5, thorns: 0.75, poison: 0.3,
    about: 'A grumpy hedgehog that charges anyone in its forest. Every plain hit pricks you back, so skills and Pebble Toss work best.',
    drops: [['thorn_quill', 0.5], ['red_s', 0.08], ['forest_amber', 0.03], ['lucky_clover', 0.008]]
  },
  // Riverside (Lv. 6–8)
  plopfrog: {
    name: 'Plopfrog', baseLv: 6, hp: 230, dmg: [14, 18], def: 4, exp: 110, coins: [13, 20], radius: 0.55, scale: 0.9, speed: 0.9, chase: 2.0, atkGap: 1.9, headY: 0.7,
    helpers: 0.3, move: 'hop', die: 'melt', area: 'river', element: 'water', weak: 'earth', reach: 3.4,
    about: 'A round river frog. It stays a few steps away and slaps you with its long sticky tongue. Get close!',
    drops: [['pond_slime', 0.55], ['blue_s', 0.06], ['red_s', 0.05], ['river_pearl', 0.03], ['lucky_clover', 0.008]]
  },
  rockpinch: {
    name: 'Rockpinch', baseLv: 7, hp: 300, dmg: [17, 22], def: 12, exp: 140, coins: [16, 24], radius: 0.6, scale: 0.95, speed: 0.7, chase: 1.9, atkGap: 1.8, headY: 0.6,
    helpers: 0, move: 'scuttle', die: 'tip', area: 'river', element: 'earth', weak: 'water', aggro: 4,
    about: 'A crab with a pebble for a shell. Plain hits bounce off its hard back, so magic and skills work best.',
    drops: [['pebble_shell', 0.5], ['red_s', 0.08], ['crab_claw', 0.03], ['lucky_clover', 0.008]]
  },
  nutsnatcher: {
    name: 'Nutsnatcher', baseLv: 8, hp: 260, dmg: [12, 16], def: 5, exp: 150, coins: [20, 30], radius: 0.5, scale: 0.85, speed: 1.4, chase: 3.2, atkGap: 1.5, headY: 0.8,
    helpers: 0, move: 'hop', die: 'tip', area: 'river', element: 'wind', weak: 'fire', steal: true,
    about: 'A cheeky squirrel. It grabs some of your coins and runs! Catch it and you get them back, plus a little extra.',
    drops: [['acorn', 0.55], ['red_s', 0.06], ['river_pearl', 0.02], ['lucky_clover', 0.01]]
  },
  // Thornbush (Lv. 8–10)
  bramblebee: {
    name: 'Bramblebee', baseLv: 9, hp: 240, dmg: [18, 23], def: 5, exp: 170, coins: [18, 28], radius: 0.45, scale: 0.8, speed: 1.2, chase: 2.8, atkGap: 1.4, headY: 0.5,
    helpers: 0.5, move: 'float', die: 'pop', fly: 1.2, area: 'thorn', element: 'wind', weak: 'fire', aggro: 5, poison: 0.35,
    about: 'A fuzzy purple bee. Its sting is poisonous and its friends come to help, so bring antidotes.',
    drops: [['honey_drop', 0.5], ['antidote', 0.08], ['bee_stinger', 0.03], ['lucky_clover', 0.01]]
  },
  bushling: {
    name: 'Bushling', baseLv: 10, hp: 380, dmg: [22, 28], def: 9, exp: 220, coins: [22, 34], radius: 0.65, scale: 1, speed: 0.8, chase: 2.2, atkGap: 1.8, headY: 0.9,
    helpers: 0, move: 'waddle', die: 'poof', area: 'thorn', element: 'earth', weak: 'fire', aggro: 3, disguise: true,
    about: 'Looks just like a bush... until you walk too close. Then it jumps up and attacks! Watch for bushes with eyes.',
    drops: [['bramble_twig', 0.5], ['red_m', 0.05], ['honey_drop', 0.15], ['lucky_clover', 0.012]]
  },
  // Rootling Burrow (Lv. 5–8)
  rootling: {
    name: 'Rootling', baseLv: 5, hp: 200, dmg: [13, 17], def: 5, exp: 85, coins: [10, 16], radius: 0.5, scale: 0.85, speed: 0.8, chase: 2.0, atkGap: 1.7, headY: 0.7,
    helpers: 0.35, move: 'waddle', die: 'tip', area: 'burrow', element: 'earth', weak: 'fire', respawn: 40,
    about: 'A little walking root with leaf ears. They live in the burrow and guard their grandpa.',
    drops: [['root_knot', 0.55], ['red_s', 0.06], ['heartwood', 0.02], ['lucky_clover', 0.006]]
  },
  old_rootling: {
    name: 'Old Rootling', baseLv: 9, hp: 2600, dmg: [24, 32], def: 10, exp: 1500, coins: [200, 260], radius: 1.4, scale: 1.5, speed: 0.5, chase: 1.4, atkGap: 2.4, headY: 2.4,
    helpers: 0, move: 'waddle', die: 'tip', area: 'burrow', element: 'earth', weak: 'fire', reach: 3.2, boss: true, respawn: 1e9,
    about: 'The grumpy grandpa of all Rootlings. Watch the ground: red circles mean roots are about to burst up!',
    drops: [['heartwood', 1], ['red_m', 0.6], ['lucky_clover', 0.3]]
  },
  // Pebble Cave (Lv. 9–12)
  pebble_leaflet: {
    name: 'Pebble Leaflet', baseLv: 9, hp: 330, dmg: [19, 24], def: 10, exp: 190, coins: [20, 30], radius: 0.55, scale: 0.85, speed: 0.9, chase: 2.0, atkGap: 1.6, headY: 0.8,
    helpers: 0.5, move: 'hop', die: 'melt', area: 'cave', element: 'earth', weak: 'water', build: 'pebble',
    about: 'A Leaflet that wears a pebble for a helmet. It is one of the King\'s guards, and all its friends come running when you poke it.',
    drops: [['pebble_jelly', 0.55], ['red_m', 0.05], ['star_quartz', 0.02], ['lucky_clover', 0.01]]
  },
  gemcap: {
    name: 'Gemcap', baseLv: 10, hp: 420, dmg: [22, 28], def: 8, exp: 240, coins: [24, 36], radius: 0.5, scale: 1.0, speed: 0.7, chase: 1.8, atkGap: 1.9, headY: 0.8,
    helpers: 0.2, move: 'waddle', die: 'poof', area: 'cave', element: 'water', weak: 'earth', build: 'gem', stun: 0.25,
    about: 'A Mushling with a cap of glowing crystals. Its headbutt can make you dizzy, so keep Wake-up Herbs handy.',
    drops: [['cave_crystal', 0.5], ['blue_m', 0.05], ['star_quartz', 0.03], ['lucky_clover', 0.012]]
  },
  king_leaflet: {
    name: 'King Leaflet', baseLv: 12, hp: 5200, dmg: [30, 38], def: 12, exp: 4000, coins: [400, 500], radius: 2.2, scale: 2.6, speed: 0.6, chase: 1.5, atkGap: 2.4, headY: 3.2,
    helpers: 0, move: 'hop', die: 'melt', area: 'cave', element: 'earth', weak: 'fire', build: 'king', reach: 3.6, boss: true, respawn: 1e9,
    about: 'The giant King of all Leaflets, with a crown of golden leaves. He jumps high and lands hard: get out of the red circle! He calls his Leaflets to help.',
    drops: [['royal_jelly', 1], ['sunstone', 0.35], ['red_m', 0.8], ['lucky_clover', 0.4]]
  }
};
// v1.2: two more monsters in every area
const mon = (o) => Object.assign({ radius: 0.5, scale: 0.85, speed: 0.9, chase: 2.0, atkGap: 1.7, headY: 0.8, helpers: 0, move: 'waddle', die: 'poof' }, o);
Object.assign(KINDS, {
  bunbun: mon({ name: 'Bunbun', baseLv: 2, hp: 70, dmg: [5, 8], def: 1, exp: 24, coins: [3, 6], scale: 0.75, speed: 1.1, chase: 2.4, atkGap: 1.5, headY: 1.0, helpers: 0.3, move: 'hop', die: 'poof', area: 'meadow', element: 'wind', weak: 'fire',
    about: 'A round meadow bunny with long ears. It thumps its feet and its brothers come hopping.',
    drops: [['fluffy_tail', 0.55], ['sweet_sprout', 0.15], ['red_s', 0.05], ['lucky_clover', 0.004]] }),
  shellsnail: mon({ name: 'Shellsnail', baseLv: 3, hp: 140, dmg: [7, 10], def: 8, exp: 42, coins: [6, 10], radius: 0.55, scale: 0.9, speed: 0.4, chase: 1.0, atkGap: 2.0, headY: 0.9, die: 'tip', area: 'meadow', element: 'water', weak: 'earth',
    about: 'Very slow, but its swirly shell is very hard. Plain hits do little, so use skills.',
    drops: [['snail_slime', 0.55], ['blue_s', 0.06], ['red_s', 0.04], ['lucky_clover', 0.006]] }),
  woolly: mon({ name: 'Woolly', baseLv: 4, hp: 170, dmg: [10, 13], def: 3, exp: 58, coins: [8, 13], radius: 0.65, scale: 0.9, speed: 0.8, chase: 2.0, headY: 1.1, helpers: 0.5, move: 'trot', die: 'poof', area: 'hills', element: 'wind', weak: 'fire',
    about: 'A fluffy hill sheep. Poke one and the whole flock comes trotting.',
    drops: [['wool_tuft', 0.55], ['red_s', 0.06], ['dandelion_fluff', 0.15], ['lucky_clover', 0.006]] }),
  kitebird: mon({ name: 'Kitebird', baseLv: 5, hp: 150, dmg: [12, 16], def: 2, exp: 72, coins: [10, 15], radius: 0.45, scale: 0.85, speed: 1.2, chase: 2.8, atkGap: 1.5, headY: 0.6, move: 'float', die: 'pop', fly: 1.4, area: 'hills', element: 'wind', weak: 'earth', aggro: 6,
    about: 'A blue bird that rides the hill wind. It dives at anyone who walks under it.',
    drops: [['sky_feather', 0.55], ['blue_s', 0.06], ['little_tusk', 0.01], ['lucky_clover', 0.007]] }),
  hootling: mon({ name: 'Hootling', baseLv: 6, hp: 220, dmg: [14, 18], def: 4, exp: 100, coins: [12, 19], radius: 0.5, scale: 0.85, speed: 0.9, chase: 2.2, headY: 0.6, move: 'float', die: 'pop', fly: 1.3, area: 'wood', element: 'wind', weak: 'fire', stun: 0.25,
    about: 'A round little owl. Its loud HOOT makes you dizzy, so keep Wake-up Herbs ready.',
    drops: [['owl_feather', 0.5], ['wake_herb', 0.08], ['forest_amber', 0.02], ['lucky_clover', 0.008]] }),
  fernfox: mon({ name: 'Fernfox', baseLv: 7, hp: 260, dmg: [16, 21], def: 5, exp: 125, coins: [14, 22], radius: 0.6, scale: 0.9, speed: 1.1, chase: 2.8, atkGap: 1.6, headY: 1.0, move: 'trot', die: 'tip', area: 'wood', element: 'earth', weak: 'water', aggro: 5, charge: 1.5,
    about: 'A quick forest fox with a fern-green tail tip. It crouches, then dashes right at you.',
    drops: [['fox_fluff', 0.5], ['red_s', 0.08], ['forest_amber', 0.03], ['lucky_clover', 0.008]] }),
  quackling: mon({ name: 'Quackling', baseLv: 6, hp: 210, dmg: [13, 17], def: 4, exp: 100, coins: [12, 19], scale: 0.85, speed: 1.0, headY: 1.1, helpers: 0.5, area: 'river', element: 'water', weak: 'wind',
    about: 'A chubby river duckling. One quack and its whole family waddles over.',
    drops: [['duck_down', 0.55], ['blue_s', 0.06], ['river_pearl', 0.02], ['lucky_clover', 0.008]] }),
  snapturtle: mon({ name: 'Snapturtle', baseLv: 8, hp: 360, dmg: [18, 23], def: 14, exp: 160, coins: [18, 26], radius: 0.7, scale: 0.95, speed: 0.5, chase: 1.4, atkGap: 2.0, headY: 0.7, die: 'tip', area: 'river', element: 'water', weak: 'earth', aggro: 3,
    about: 'A river turtle with a very hard shell and a snappy bite. Slow, so hit it with skills from far away.',
    drops: [['turtle_scute', 0.5], ['red_m', 0.04], ['river_pearl', 0.03], ['lucky_clover', 0.01]] }),
  prickle_beetle: mon({ name: 'Prickle Beetle', baseLv: 9, hp: 320, dmg: [19, 24], def: 8, exp: 190, coins: [20, 30], radius: 0.6, scale: 0.9, speed: 0.8, chase: 2.0, headY: 0.7, move: 'scuttle', die: 'tip', area: 'thorn', element: 'earth', weak: 'fire', aggro: 4, thorns: 0.6,
    about: 'A shiny purple beetle covered in prickles. Every plain hit pricks you back.',
    drops: [['beetle_shell', 0.5], ['red_m', 0.05], ['bee_stinger', 0.02], ['lucky_clover', 0.01]] }),
  thornhopper: mon({ name: 'Thornhopper', baseLv: 10, hp: 300, dmg: [22, 27], def: 6, exp: 210, coins: [22, 32], radius: 0.5, scale: 0.9, speed: 1.4, chase: 3.0, atkGap: 1.4, headY: 0.9, move: 'hop', die: 'tip', area: 'thorn', element: 'wind', weak: 'earth', aggro: 6,
    about: 'A long-legged grasshopper. It jumps at you from far away, very fast.',
    drops: [['spring_leg', 0.5], ['red_m', 0.05], ['honey_drop', 0.15], ['lucky_clover', 0.012]] }),
  glowworm: mon({ name: 'Glowworm', baseLv: 6, hp: 210, dmg: [13, 17], def: 4, exp: 92, coins: [11, 17], radius: 0.55, scale: 0.85, speed: 0.6, chase: 1.6, headY: 0.7, helpers: 0.4, die: 'melt', area: 'burrow', element: 'water', weak: 'fire', poison: 0.2, respawn: 40,
    about: 'A chubby caterpillar with glowing dots. It lights up the dark burrow, and its bite is a little poisonous.',
    drops: [['glow_goo', 0.55], ['antidote', 0.08], ['heartwood', 0.015], ['lucky_clover', 0.006]] }),
  digmole: mon({ name: 'Digmole', baseLv: 7, hp: 270, dmg: [16, 20], def: 6, exp: 115, coins: [13, 20], radius: 0.6, scale: 0.9, speed: 0.8, chase: 2.0, headY: 1.0, die: 'tip', area: 'burrow', element: 'earth', weak: 'water', aggro: 3.5, stun: 0.3, respawn: 40,
    about: 'A mole with big digging claws. Its bonk on the head makes you dizzy.',
    drops: [['mole_claw', 0.5], ['wake_herb', 0.08], ['heartwood', 0.02], ['lucky_clover', 0.007]] }),
  flapbat: mon({ name: 'Flapbat', baseLv: 10, hp: 300, dmg: [20, 25], def: 6, exp: 210, coins: [22, 32], radius: 0.5, scale: 0.85, speed: 1.3, chase: 2.8, atkGap: 1.4, headY: 0.5, helpers: 0.5, move: 'float', die: 'pop', fly: 1.8, area: 'cave', element: 'wind', weak: 'earth', aggro: 6,
    about: 'A purple cave bat. When you poke one, the whole flock swoops down.',
    drops: [['bat_wing', 0.5], ['blue_m', 0.05], ['star_quartz', 0.02], ['lucky_clover', 0.012]] }),
  rocklet: mon({ name: 'Rocklet', baseLv: 11, hp: 520, dmg: [24, 30], def: 16, exp: 280, coins: [26, 40], radius: 0.75, scale: 1.0, speed: 0.6, chase: 1.6, atkGap: 2.0, headY: 1.5, die: 'tip', area: 'cave', element: 'earth', weak: 'water', aggro: 3, stun: 0.3,
    about: 'A little stone golem with a glowing crystal heart. Very hard, and its punch makes you dizzy.',
    drops: [['rock_heart', 0.12], ['cave_crystal', 0.4], ['red_m', 0.06], ['lucky_clover', 0.014]] })
});
// golden monsters: a rare, bigger version that shows up now and then in every area
const GOLDEN = { hp: 2.5, dmg: 1.3, exp: 6, coins: 8, scale: 1.45, life: 300, every: [600, 900], drops: [['golden_leaf', 1], ['lucky_clover', 0.3]] };
const ELEMENTS = { fire: { name: 'Fire', color: '#d9542e' }, water: { name: 'Water', color: '#3f86c8' }, earth: { name: 'Earth', color: '#a8774f' }, wind: { name: 'Wind', color: '#3fa39a' } };
// training targets for the job masters (not in the monster book): they never walk; balloons float, crystals light up when hit
Object.assign(KINDS, {
  dummy: { name: 'Training Dummy', baseLv: 8, hp: 260, dmg: [7, 10], def: 2, exp: 0, coins: [0, 0], radius: 0.5, scale: 1, speed: 0, chase: 0, atkGap: 2.0, headY: 1.1, helpers: 0, move: 'still', die: 'tip', target: true, drops: [] },
  balloon: { name: 'Balloon', baseLv: 1, hp: 1, dmg: [0, 0], def: 0, exp: 0, coins: [0, 0], radius: 0.45, scale: 1, speed: 0, chase: 0, atkGap: 99, headY: 0.4, helpers: 0, move: 'float', die: 'pop', fly: 2.4, target: true, passive: true, drops: [] },
  irontarget: { name: 'Iron Target', baseLv: 1, hp: 60, dmg: [0, 0], def: 0, exp: 0, coins: [0, 0], radius: 0.55, scale: 1, speed: 0, chase: 0, atkGap: 99, headY: 1.1, helpers: 0, move: 'still', die: 'tip', target: true, passive: true, drops: [] },
  crystal: { name: 'Dark Crystal', baseLv: 1, hp: 1, dmg: [0, 0], def: 0, exp: 0, coins: [0, 0], radius: 0.5, scale: 1, speed: 0, chase: 0, atkGap: 99, headY: 1.2, helpers: 0, move: 'still', die: 'light', target: true, passive: true, magicOnly: true, drops: [] }
});
function monsterStats(kind, lv) {
  const k = KINDS[kind], d = lv - k.baseLv;
  // tougher monsters (v1.1): real monsters get more HP, hit harder and block a little more; practice targets stay the same
  const T = k.target || k.passive ? { hp: 1, dmg: 1, def: 0, exp: 1 } : { hp: 2.0, dmg: 1.5, def: 3, exp: 1 }; // v1.3: tougher again (was hp 1.55, dmg 1.3, def +2)
  return {
    hp: Math.round(k.hp * (1 + 0.35 * d) * T.hp),
    dmg: [k.dmg[0] * (1 + 0.25 * d) * T.dmg, k.dmg[1] * (1 + 0.25 * d) * T.dmg],
    def: k.def + d + T.def,
    exp: Math.round(k.exp * (1 + 0.45 * d) * T.exp),
    coins: [Math.round(k.coins[0] * (1 + 0.3 * d)), Math.round(k.coins[1] * (1 + 0.3 * d))]
  };
}

// spawn camps in Sunny Meadow: [kind, level, x, z, count, spread]
const CAMPS = [
  ['leaflet', 1, 34, -66, 5, 7], ['leaflet', 1, -34, -70, 4, 6], ['leaflet', 1, 8, -92, 3, 5],
  ['leaflet', 2, -66, -118, 5, 7], ['leaflet', 2, 52, -128, 5, 7], ['leaflet', 2, -4, -160, 4, 6], ['leaflet', 2, 110, -96, 3, 6],
  ['leaflet', 3, -122, -198, 4, 7], ['leaflet', 3, 92, -196, 5, 7], ['leaflet', 3, -36, -232, 4, 6], ['leaflet', 3, 30, -250, 3, 6],
  ['mushling', 3, 140, -238, 3, 6], ['mushling', 3, -152, -258, 3, 6], ['mushling', 3, -96, -282, 3, 5],
  ['mushling', 4, 44, -306, 4, 7], ['mushling', 4, -58, -326, 4, 7], ['mushling', 4, 128, -322, 3, 6],
  ['bunbun', 2, 76, -150, 4, 6], ['bunbun', 2, -100, -150, 4, 6], ['bunbun', 3, 0, -200, 3, 5],
  ['shellsnail', 3, -10, -284, 3, 5], ['shellsnail', 3, 110, -262, 3, 5], ['shellsnail', 4, -130, -310, 2, 4]
];
// Breezy Hills (north of Sunny Meadow) and Whisperwood (west of it); every area is its own map
const CAMPS_HILLS = [
  ['breeze_leaflet', 3, -42, -718, 5, 7], ['breeze_leaflet', 3, 46, -736, 4, 6], ['breeze_leaflet', 3, -96, -700, 3, 5],
  ['breeze_leaflet', 4, -92, -800, 5, 7], ['breeze_leaflet', 4, 118, -778, 4, 6], ['breeze_leaflet', 4, -24, -902, 4, 6],
  ['bristleboar', 4, 58, -812, 3, 6], ['bristleboar', 4, -128, -866, 3, 6], ['bristleboar', 4, 150, -868, 2, 5],
  ['bristleboar', 5, 118, -936, 3, 6], ['bristleboar', 5, -66, -952, 3, 6], ['bristleboar', 5, 36, -948, 2, 5],
  ['woolly', 4, 10, -760, 4, 6], ['woolly', 4, -60, -840, 4, 6], ['woolly', 5, 90, -900, 3, 5],
  ['kitebird', 5, 130, -720, 3, 5], ['kitebird', 5, -120, -760, 3, 5], ['kitebird', 5, 0, -850, 2, 4]
];
const CAMPS_WOOD = [
  ['moss_mushling', 5, -452, -506, 4, 6], ['moss_mushling', 5, -468, -416, 4, 6], ['moss_mushling', 5, -512, -604, 3, 5],
  ['moss_mushling', 6, -612, -446, 4, 6], ['moss_mushling', 6, -702, -566, 3, 6],
  ['thornhog', 6, -486, -652, 3, 5], ['thornhog', 6, -566, -408, 3, 5], ['thornhog', 6, -674, -470, 2, 5],
  ['thornhog', 7, -566, -680, 3, 5], ['thornhog', 7, -700, -636, 2, 5],
  ['hootling', 6, -530, -520, 3, 5], ['hootling', 6, -640, -540, 3, 5], ['hootling', 7, -600, -620, 2, 4],
  ['fernfox', 7, -520, -460, 2, 5], ['fernfox', 7, -660, -600, 2, 5], ['fernfox', 7, -470, -580, 2, 4]
];
// Riverside (east of Sunny Meadow): frogs and crabs on both banks, squirrels in the trees
const CAMPS_RIVER = [
  ['plopfrog', 6, 800, -250, 4, 6], ['plopfrog', 6, 822, -372, 4, 6], ['plopfrog', 6, 856, -186, 3, 5], ['plopfrog', 7, 978, -420, 4, 6],
  ['rockpinch', 7, 868, -430, 3, 5], ['rockpinch', 7, 982, -262, 3, 5], ['rockpinch', 7, 990, -168, 3, 5], ['rockpinch', 8, 1030, -342, 3, 5],
  ['nutsnatcher', 8, 790, -168, 2, 5], ['nutsnatcher', 8, 1012, -214, 2, 5], ['nutsnatcher', 8, 1020, -440, 2, 5],
  ['quackling', 6, 830, -300, 4, 5], ['quackling', 6, 990, -320, 4, 5], ['quackling', 7, 900, -200, 3, 5],
  ['snapturtle', 8, 840, -410, 2, 4], ['snapturtle', 8, 1000, -390, 2, 4], ['snapturtle', 8, 960, -190, 2, 4]
];
// Thornbush (east of Riverside): bees around their hives, Bushlings hiding among real bushes
const CAMPS_THORN = [
  ['bramblebee', 8, 800, -862, 4, 6], ['bramblebee', 8, 822, -784, 3, 5], ['bramblebee', 9, 950, -862, 4, 6], ['bramblebee', 9, 1000, -920, 4, 6], ['bramblebee', 10, 880, -886, 3, 5],
  ['bushling', 9, 790, -990, 3, 6], ['bushling', 9, 920, -792, 3, 6], ['bushling', 10, 1030, -800, 3, 6], ['bushling', 10, 940, -960, 3, 6], ['bushling', 10, 862, -1006, 2, 5],
  ['prickle_beetle', 9, 860, -820, 3, 5], ['prickle_beetle', 9, 980, -820, 3, 5], ['prickle_beetle', 10, 900, -940, 2, 4],
  ['thornhopper', 10, 830, -930, 3, 5], ['thornhopper', 10, 1010, -880, 3, 5], ['thornhopper', 10, 960, -1000, 2, 4]
];
// Rootling Burrow (under Whisperwood): rooms full of Rootlings, the Old Rootling in the last room
const CAMPS_BURROW = [
  ['rootling', 5, 1500, -198, 4, 7], ['rootling', 6, 1524, -224, 2, 2], ['glowworm', 6, 1506, -204, 2, 4], ['digmole', 7, 1540, -240, 2, 4], ['glowworm', 7, 1550, -256, 2, 4], ['digmole', 7, 1518, -284, 1, 1], ['rootling', 6, 1546, -248, 4, 7], ['rootling', 7, 1520, -287, 2, 1],
  ['old_rootling', 9, 1500, -326, 1, 0]
];
// Pebble Cave (behind Thornbush): Leaflet guards and Gemcaps in every hall, the King at the end
const CAMPS_CAVE = [
  ['pebble_leaflet', 9, 1500, -646, 3, 4], ['pebble_leaflet', 9, 1496, -700, 4, 6], ['gemcap', 10, 1510, -690, 2, 4],
  ['gemcap', 10, 1550, -748, 3, 5], ['pebble_leaflet', 10, 1540, -736, 3, 4],
  ['pebble_leaflet', 10, 1496, -786, 3, 3], ['gemcap', 11, 1505, -788, 2, 2], ['flapbat', 10, 1500, -660, 3, 3], ['flapbat', 10, 1545, -742, 3, 4], ['rocklet', 11, 1520, -700, 1, 2], ['rocklet', 11, 1500, -780, 1, 2],
  ['king_leaflet', 12, 1500, -858, 1, 0]
];
const CAMPS_BY_MAP = { meadow: CAMPS, hills: CAMPS_HILLS, wood: CAMPS_WOOD, river: CAMPS_RIVER, thorn: CAMPS_THORN, burrow: CAMPS_BURROW, cave: CAMPS_CAVE };

// areas: one map each (Mossbrook shares its map with Sunny Meadow). Monster book pages and expert titles follow them
const AREAS = {
  meadow: { name: 'Sunny Meadow', lv: 'Lv. 1–4', min: 1, title: 'Meadow Expert', kinds: ['leaflet', 'mushling', 'bunbun', 'shellsnail'] },
  hills: { name: 'Breezy Hills', lv: 'Lv. 3–5', min: 3, title: 'Hill Expert', kinds: ['breeze_leaflet', 'bristleboar', 'woolly', 'kitebird'] },
  wood: { name: 'Whisperwood', lv: 'Lv. 5–7', min: 5, title: 'Forest Expert', kinds: ['moss_mushling', 'thornhog', 'hootling', 'fernfox'] },
  river: { name: 'Riverside', lv: 'Lv. 6–8', min: 6, title: 'River Expert', kinds: ['plopfrog', 'rockpinch', 'nutsnatcher', 'quackling', 'snapturtle'] },
  thorn: { name: 'Thornbush', lv: 'Lv. 8–10', min: 8, title: 'Bramble Expert', kinds: ['bramblebee', 'bushling', 'prickle_beetle', 'thornhopper'] },
  burrow: { name: 'Rootling Burrow', lv: 'Lv. 5–8', min: 5, title: 'Burrow Expert', kinds: ['rootling', 'glowworm', 'digmole'] },
  cave: { name: 'Pebble Cave', lv: 'Lv. 9–12', min: 9, title: 'Cave Expert', kinds: ['pebble_leaflet', 'gemcap', 'flapbat', 'rocklet'] }
};
// monster book: each star needs this many defeats and pays a small reward
const BOOK_STARS = [{ need: 1, coins: 10, shows: 'picture and name' }, { need: 10, coins: 30, exp: 0.04, shows: 'element and home' }, { need: 30, coins: 60, item: 'red_s', shows: 'what it drops' }];

// hidden treasure chests: opened once per hero. [id, map, x, z, coins, items, hint]
const CHESTS = [
  ['m1', 'meadow', -150, -86, 60, [['red_s', 2]], 'behind the trees west of the gate'],
  ['m2', 'meadow', 168, -246, 80, [['blue_s', 2], ['sweet_sprout', 2]], 'past the east pond'],
  ['m3', 'meadow', -170, -330, 90, [['golden_leaf', 1]], 'in the far north-west corner'],
  ['m4', 'meadow', 92, -362, 120, [['red_m', 1], ['lucky_clover', 1]], 'below the northern hills'],
  ['h1', 'hills', -150, -712, 80, [['red_s', 3]], 'among the rocks by the gate'],
  ['h2', 'hills', 150, -716, 100, [['blue_m', 1], ['dandelion_fluff', 2]], 'on the windy east slope'],
  ['h3', 'hills', -112, -948, 120, [['red_m', 1]], 'on top of the tallest western hill'],
  ['h4', 'hills', 96, -982, 140, [['little_tusk', 1], ['blue_s', 2]], 'behind the windmill hill, near the cliffs'],
  ['h5', 'hills', 162, -820, 160, [['lucky_clover', 1], ['red_m', 1]], 'hidden in the eastern pines'],
  ['w1', 'wood', -428, -380, 110, [['blue_m', 1], ['red_s', 2]], 'between the roots near the entrance'],
  ['w2', 'wood', -712, -406, 130, [['glowcap', 3]], 'in the misty south-west corner'],
  ['w3', 'wood', -660, -540, 150, [['forest_amber', 1]], 'beside the pond of glowing lilies'],
  ['w4', 'wood', -430, -690, 160, [['red_m', 2]], 'under the giant fallen tree'],
  ['w5', 'wood', -700, -684, 200, [['lucky_clover', 1], ['forest_amber', 1]], 'deep in the north-west, past the stash'],
  ['r1', 'river', 790, -200, 130, [['red_m', 1], ['blue_s', 2]], 'under the trees on the west bank'],
  ['r2', 'river', 1030, -420, 150, [['pond_slime', 3], ['red_s', 2]], 'in the reeds of the far south-east'],
  ['r3', 'river', 800, -430, 170, [['river_pearl', 1]], 'near the south-west corner, past the frogs'],
  ['r4', 'river', 1000, -160, 200, [['lucky_clover', 1], ['blue_m', 1]], 'on the north-east bank, across the bridge'],
  ['t1', 'thorn', 790, -800, 150, [['antidote', 3]], 'between the thickets by the gate'],
  ['t2', 'thorn', 1020, -820, 170, [['honey_drop', 3], ['red_m', 1]], 'in the sunny east corner'],
  ['t3', 'thorn', 830, -1010, 190, [['bee_stinger', 1]], 'near the cliffs west of the cave'],
  ['t4', 'thorn', 1000, -1000, 210, [['red_m', 2], ['blue_m', 1]], 'behind the rocks east of the cave'],
  ['t5', 'thorn', 950, -950, 240, [['lucky_clover', 1], ['crab_claw', 1]], 'in the middle of the bramble maze'],
  ['c1', 'cave', 1510, -646, 200, [['wake_herb', 3], ['red_m', 1]], 'in the entry hall, behind the stalagmites'],
  ['c2', 'cave', 1556, -734, 240, [['star_quartz', 1]], 'in the button hall, by the east wall'],
  ['c3', 'cave', 1492, -797, 280, [['lucky_clover', 1], ['blue_m', 2]], 'in the boulder room, near the west wall']
];

const SHOP = ['red_s', 'red_m', 'blue_s', 'blue_m', 'antidote', 'wake_herb', 'warm_tea'];
const PET_SHOP = ['pet_kibble', 'pet_treat', 'berry_bowl'];

// ---------- pets (delivery 6) ----------
// hp/atk: multipliers on the shared pet formula. skills[0] from baby, skills[1] once a teen
// skill kinds: hit (one monster), area (around the pet), heal (the hero when low, and the pet), guard (hero defense up), luck (more coins), weaken (monsters hit softer)
const PETS = {
  puffdrake: { name: 'Puffdrake', about: 'A little dragon who sneezes tiny flames.', element: 'fire', hp: 1, atk: 1.1, egg: 'warm',
    skills: [{ id: 'ember', name: 'Ember Sneeze', kind: 'hit', power: 1.7, element: 'fire', cd: 8, desc: 'A tiny fire sneeze at a monster.' },
      { id: 'flamepuff', name: 'Flame Puff', kind: 'area', power: 1.3, element: 'fire', radius: 2.4, cd: 14, desc: 'A puff of flame that hits monsters around it.' }] },
  cloudfox: { name: 'Cloudfox', about: 'A fox that floats on its own little cloud.', element: 'wind', hp: 0.95, atk: 1.05, egg: 'sky',
    skills: [{ id: 'gusttail', name: 'Gust Tail', kind: 'hit', power: 1.4, element: 'wind', kb: 2, cd: 8, desc: 'A swish of its tail that blows a monster back.' },
      { id: 'cloudnap', name: 'Cloud Nap', kind: 'heal', heal: 0.4, cd: 22, desc: 'A cozy cloud heals you when your HP is low, and the pet too.' }] },
  glimmerbun: { name: 'Glimmerbun', about: 'A bunny with a crystal horn that sparkles when it is happy.', element: null, hp: 1, atk: 1, egg: 'sky',
    skills: [{ id: 'sparkle', name: 'Sparkle Horn', kind: 'hit', power: 1.1, stun: 1.6, cd: 10, desc: 'A flash from its horn leaves a monster dizzy.' },
      { id: 'luckyglim', name: 'Lucky Glimmer', kind: 'luck', dur: 20, cd: 45, desc: 'Monsters drop more items for 20 seconds.' }] },
  mossback: { name: 'Mossback', about: 'A stone turtle with a mossy, flowery shell.', element: 'earth', hp: 1.3, atk: 0.85, egg: 'leaf',
    skills: [{ id: 'shellguard', name: 'Shell Guard', kind: 'guard', def: 0.4, dur: 8, cd: 18, desc: 'Your defense goes up for 8 seconds.' },
      { id: 'mossmend', name: 'Moss Mend', kind: 'heal', heal: 0.4, cd: 22, desc: 'Healing moss mends you when your HP is low, and the pet too.' }] },
  bloomquill: { name: 'Bloomquill', about: 'A hedgehog whose quills are flower petals.', element: null, hp: 1.05, atk: 1, egg: 'warm',
    skills: [{ id: 'petalspikes', name: 'Petal Spikes', kind: 'area', power: 1.1, radius: 2.4, cd: 10, desc: 'Petal quills hurt every monster around it.' },
      { id: 'sweetscent', name: 'Sweet Scent', kind: 'weaken', radius: 4, dur: 8, cd: 20, desc: 'Monsters around it hit softer for 8 seconds.' }] },
  lilytoad: { name: 'Lilytoad', about: 'A frog that carries a lily pad like an umbrella.', element: 'water', hp: 1.1, atk: 0.95, egg: 'leaf',
    // the healer: heals from the very start
    skills: [{ id: 'raindance', name: 'Rain Dance', kind: 'heal', heal: 0.4, cd: 16, desc: 'A soft rain heals you when your HP is low, and the pet too.' },
      { id: 'bubble', name: 'Bubble Splash', kind: 'hit', power: 1.3, element: 'water', slow: 4, cd: 8, desc: 'Water bubbles that make a monster slow.' }] }
};
const PET_TRAITS = {
  greedy: { name: 'Greedy', desc: 'Gets hungry faster.' },
  spoiled: { name: 'Spoiled', desc: 'Wants to play more often.' },
  brave: { name: 'Brave', desc: 'Hits harder in a fight.' }
};
const PET_EGGS = {
  warm: { name: 'Warm Egg', hint: 'Warm to the touch, with orange spots.', species: ['puffdrake', 'bloomquill'] },
  sky: { name: 'Sky Egg', hint: 'Light as a cloud, with a blue zigzag.', species: ['cloudfox', 'glimmerbun'] },
  leaf: { name: 'Leaf Egg', hint: 'Smells like moss, with little leaf marks.', species: ['mossback', 'lilytoad'] },
  wild: { name: 'Wild Egg', hint: 'Speckled. Anything could hatch!', species: ['puffdrake', 'cloudfox', 'glimmerbun', 'mossback', 'bloomquill', 'lilytoad'] }
};
const PET_TEEN_LV = 10, PET_HATCH = 300;
const petStats = (pet) => {
  const S = PETS[pet.sp], teen = pet.stage !== 'baby', lv = pet.lv, grow = /^adult/.test(pet.stage || '') ? 1.5 : teen ? 1.25 : 1; // v1.4: adults (Pet Lv. 25) are stronger still
  return { maxHp: Math.round((60 + lv * 15) * S.hp * grow), atk: (6 + lv * 2.2) * S.atk * grow * (pet.trait === 'brave' ? 1.2 : 1) };
};

// ---------- jobs (delivery 5): chosen at Lv. 10 from a master, with one weapon kept for good ----------
// weapons: atk (body hits), matk (magic), range (0 = up close), speed, extra bonuses
const WEAPONS = {
  stick: { name: 'Wooden Stick', atk: 4, range: 0 },
  swordShield: { name: 'Sword & Shield', job: 'warrior', atk: 10, def: 4, range: 0, desc: 'Steady and sturdy: the shield blocks part of every hit.' },
  dualSwords: { name: 'Two Swords', job: 'warrior', atk: 9, speed: 0.25, crit: 0.03, range: 0, desc: 'Fast and lively: more swings, more critical hits.' },
  bow: { name: 'Bow', job: 'archer', atk: 9, crit: 0.03, range: 10, desc: 'Long range. Arrows fly far and hit hard.' },
  slingshot: { name: 'Slingshot', job: 'archer', atk: 7, speed: 0.2, range: 8, kb: 0.5, desc: 'Quick shots that push monsters back.' },
  staff: { name: 'Magic Staff', job: 'mage', matk: 10, range: 9, desc: 'Strong spells that fly far.' },
  book: { name: 'Spell Book', job: 'mage', matk: 7, mp: 0.15, regen: 0.4, speed: 0.15, range: 8, desc: 'Faster spells and more MP.' },
  missileArm: { name: 'Missile Arm', job: 'robot', atk: 10, range: 8, splash: 1.6, desc: 'Little rockets that explode and hit monsters close together.' },
  laserCannon: { name: 'Laser Cannon', job: 'robot', atk: 8, speed: 0.2, range: 11, desc: 'A quick beam that reaches far.' }
};
// skills: mp and power grow with the skill level (1 to 5). kind decides how the game plays it
const JOBS = {
  warrior: {
    name: 'Warrior', master: 'marla', weapons: ['swordShield', 'dualSwords'], blurb: 'Strong and sturdy, fights up close.',
    skills: [
      { id: 'cleave', name: 'Cleave', kind: 'cone', mp: 8, mpLv: 1, cd: 5, power: 1.5, powerLv: 0.25, range: 3.2, desc: 'A wide slash that hits every monster in front of you.' },
      { id: 'rush', name: 'Rush', kind: 'dash', mp: 10, mpLv: 1, cd: 8, power: 1.6, powerLv: 0.2, range: 8, stun: 1.5, stunLv: 0.2, desc: 'Charge at a monster up to 8 m away and leave it dizzy.' },
      { id: 'warcry', name: 'Shield Wall', kind: 'buff', mp: 12, mpLv: 1, cd: 22, dur: 10, def: 0.6, defLv: 0.1, guard: 0.3, guardLv: 0.04, taunt: 7, desc: 'Raise your shield for 10 s: defense goes way up, you take much less damage, and nearby monsters come at you instead of your pet.' },
      { id: 'earthslam', name: 'Earth Slam', kind: 'area', element: 'earth', mp: 16, mpLv: 2, cd: 12, power: 1.8, powerLv: 0.3, radius: 3.6, desc: 'Slam the ground and hurt every monster around you. Earth element.' },
      { id: 'whirlblade', lv: 30, name: 'Whirlwind Blade', kind: 'area', element: 'wind', mp: 20, mpLv: 2, cd: 10, power: 2.4, powerLv: 0.35, radius: 4.2, kb: 1.6, desc: 'Spin like a top and slash every monster around you. Wind element.' },
      { id: 'titan', lv: 40, name: 'Titan Breaker', kind: 'cone', element: 'earth', mp: 26, mpLv: 3, cd: 16, power: 3.6, powerLv: 0.5, range: 4.6, desc: 'One giant swing that cracks the ground in front of you. Earth element.' }
    ],
    ult: { name: "Hero's Comet", desc: 'Leap high and crash down on a wide area.' }
  },
  archer: {
    name: 'Archer', master: 'ivy', weapons: ['bow', 'slingshot'], blurb: 'Quick and sharp-eyed, fights from far away.',
    skills: [
      { id: 'powershot', name: 'Power Shot', kind: 'shot', mp: 8, mpLv: 1, cd: 5, power: 2.0, powerLv: 0.3, range: 12, kb: 1.2, desc: 'A strong long shot that pushes the monster back.' },
      { id: 'venom', name: 'Venom Arrow', kind: 'shot', mp: 9, mpLv: 1, cd: 8, power: 1.0, powerLv: 0.15, range: 10, poison: 6, poisonDps: 0.25, poisonLv: 0.06, desc: 'A poisoned arrow: the monster keeps losing HP for 6 seconds.' },
      { id: 'hawkeye', name: 'Hawk Eye', kind: 'buff', mp: 12, mpLv: 1, cd: 30, dur: 15, crit: 0.15, critLv: 0.03, range: 3, desc: 'More critical hits and longer range for 15 seconds.' },
      { id: 'arrowrain', name: 'Arrow Rain', kind: 'rain', element: 'wind', mp: 16, mpLv: 2, cd: 12, power: 0.5, powerLv: 0.08, waves: 5, radius: 3.6, range: 11, desc: 'Arrows rain down around your target. Wind element.' },
      { id: 'pierce', lv: 30, name: 'Piercing Arrow', kind: 'beam', mp: 18, mpLv: 2, cd: 9, power: 2.4, powerLv: 0.35, range: 14, width: 1.0, color: 0xfff0a0, desc: 'An arrow so fast it goes through every monster in its line.' },
      { id: 'skyhunter', lv: 40, name: 'Sky Hunter', kind: 'rain', element: 'fire', mp: 26, mpLv: 3, cd: 16, power: 0.75, powerLv: 0.1, waves: 8, radius: 4.6, range: 12, desc: 'Burning arrows fall for a long time around your target. Fire element.' }
    ],
    ult: { name: 'Storm of Arrows', desc: 'Hundreds of arrows rain on a wide area around you.' }
  },
  mage: {
    name: 'Mage', master: 'zara', weapons: ['staff', 'book'], blurb: 'Uses the four elements, strong magic but fragile.',
    skills: [
      { id: 'firebolt', name: 'Fire Bolt', kind: 'bolt', element: 'fire', mp: 8, mpLv: 1, cd: 3, power: 2.0, powerLv: 0.35, range: 10, desc: 'A ball of fire at one monster. Fire element.' },
      { id: 'frost', name: 'Frost Shard', kind: 'bolt', element: 'water', mp: 10, mpLv: 1, cd: 6, power: 1.6, powerLv: 0.25, range: 10, freeze: 0.3, freezeLv: 0.08, freezeT: 2.5, desc: 'A shard of ice that can freeze the monster in place. Water element.' },
      { id: 'stoneskin', name: 'Stone Skin', kind: 'buff', element: 'earth', mp: 12, mpLv: 1, cd: 30, dur: 15, def: 0.4, defLv: 0.08, desc: 'Your defense goes way up for 15 seconds. Earth element.' },
      { id: 'gust', name: 'Gust', kind: 'area', element: 'wind', mp: 14, mpLv: 2, cd: 10, power: 1.4, powerLv: 0.25, radius: 4, kb: 2.5, desc: 'A whirlwind around you that blows monsters away. Wind element.' },
      { id: 'blizzard', lv: 30, name: 'Blizzard', kind: 'rain', element: 'water', drop: 'shard', mp: 22, mpLv: 2, cd: 12, power: 0.7, powerLv: 0.1, waves: 6, radius: 4.2, range: 11, freeze: 0.12, freezeT: 2, desc: 'Ice falls around your target and can freeze monsters. Water element.' },
      { id: 'meteor', lv: 40, name: 'Meteor', kind: 'area', element: 'fire', mp: 30, mpLv: 3, cd: 18, power: 3.4, powerLv: 0.5, radius: 5, kb: 1.4, desc: 'Call a burning rock down on top of you that hits everything around. Fire element.' }
    ],
    ult: { name: 'Starfall', desc: 'Stars fall all around you.' }
  },
  robot: {
    name: 'Robot', master: 'bolt', weapons: ['missileArm', 'laserCannon'], blurb: 'Wears Bolt\'s machine armor: missiles and lasers.',
    skills: [
      { id: 'homing', name: 'Homing Missile', kind: 'missile', element: 'fire', mp: 9, mpLv: 1, cd: 4, power: 2.0, powerLv: 0.3, range: 12, desc: 'A missile that chases its target. Fire element.' },
      { id: 'laser', name: 'Laser Beam', kind: 'beam', mp: 12, mpLv: 1, cd: 7, power: 1.8, powerLv: 0.3, range: 12, width: 1.4, desc: 'A straight beam that goes through every monster in its line.' },
      { id: 'overdrive', name: 'Overdrive', kind: 'buff', mp: 12, mpLv: 1, cd: 30, dur: 15, speed: 0.3, speedLv: 0.05, def: 0.2, defLv: 0.04, desc: 'Attack speed and defense go up for 15 seconds.' },
      { id: 'barrage', name: 'Missile Barrage', kind: 'rain', element: 'fire', mp: 16, mpLv: 2, cd: 12, power: 0.55, powerLv: 0.09, waves: 5, radius: 3.6, range: 11, desc: 'Missiles rain down around your target. Fire element.' },
      { id: 'rocketpunch', lv: 30, name: 'Rocket Punch', kind: 'dash', mp: 18, mpLv: 2, cd: 9, power: 2.6, powerLv: 0.35, range: 10, stun: 1.8, stunLv: 0.2, desc: 'Blast forward on rockets and punch a monster up to 10 m away. It gets dizzy.' },
      { id: 'gigabeam', lv: 40, name: 'Giga Beam', kind: 'beam', mp: 28, mpLv: 3, cd: 16, power: 3.4, powerLv: 0.5, range: 15, width: 2.4, desc: 'A huge, wide beam that hits every monster in a long line.' }
    ],
    ult: { name: 'Mega Laser', desc: 'A giant beam that sweeps the area around you.' }
  }
};
const SKILL_MAX = 5, SP_AT_JOB = 3;

// player formulas
const STAT_KEYS = ['str', 'agi', 'int', 'vit', 'luk'];
const STAT_INFO = {
  str: { name: 'Strength', short: 'STR', desc: 'Harder hits with every attack and skill.' },
  agi: { name: 'Agility', short: 'AGI', desc: 'Faster attacks, more dodges, stronger Pebble Toss.' },
  int: { name: 'Intelligence', short: 'INT', desc: 'More MP and faster MP recovery.' },
  vit: { name: 'Vitality', short: 'VIT', desc: 'More HP and less damage taken.' },
  luk: { name: 'Luck', short: 'LUK', desc: 'More critical hits and more rare drops.' }
};
const POINTS_PER_LEVEL = 3;
const expNeed = (lv) => Math.round(80 * Math.pow(lv, 1.75));
// job and weapon: the hero's own job, or one borrowed for a moment while trying it at a master
function derive(p, job, weapon) {
  const s = p.stats, lv = p.lv;
  job = job || p.job || 'novice'; const w = WEAPONS[(job === 'novice' ? 'stick' : weapon || p.weapon)] || WEAPONS.stick;
  const d = {
    maxHp: Math.round(70 + lv * 14 + s.vit * 9),
    maxMp: Math.round(25 + lv * 4 + s.int * 5),
    atk: 6 + lv * 1.2 + s.str * 1.6 + (w.atk || 0),
    matk: 6 + lv * 1.3 + s.int * 2.2 + (w.matk || 0),
    def: s.vit * 0.8 + lv * 0.4 + (w.def || 0),
    crit: 0.05 + s.luk * 0.004 + s.agi * 0.002 + (w.crit || 0),
    dodge: 0.03 + s.agi * 0.005,
    speed: (1 + s.agi * 0.012) * (1 + (w.speed || 0)),
    mpRegen: (0.35 + s.int * 0.06) * (1 + (w.regen || 0)),
    luck: 1 + s.luk * 0.02,
    range: w.range || 0, kb: w.kb || 0, job, weapon: job === 'novice' ? 'stick' : weapon || p.weapon
  };
  if (job === 'warrior') { d.maxHp += 30 + lv * 4; d.def += 3; }
  if (job === 'archer') { d.atk = 6 + lv * 1.2 + s.str * 0.9 + s.agi * 0.9 + (w.atk || 0); d.crit += 0.04; d.dodge += 0.03; }
  if (job === 'mage') { d.maxMp = Math.round((d.maxMp + 20 + lv * 3) * (1 + (w.mp || 0))); }
  if (job === 'robot') { d.maxHp += 15 + lv * 2; d.def += 2; d.atk = 6 + lv * 1.2 + s.str * 0.8 + s.int * 1.0 + (w.atk || 0); }
  d.splash = w.splash || 0;
  if (RW.gearApply) RW.gearApply(d, p, job); // worn equipment and set bonuses (gear.js)
  const T = TITLES[p.title]; // the title you wear gives a small bonus
  if (T) for (const k in T.bonus) d[k] += T.bonus[k];
  return d;
}
// titles: how to earn them and what the worn one gives
const TITLES = {
  'Meadow Expert': { how: 'Fill every star of Sunny Meadow in the monster book (K).', bonus: { maxHp: 25 }, text: '+25 Max HP' },
  'Hill Expert': { how: 'Fill every star of Breezy Hills in the monster book (K).', bonus: { atk: 3 }, text: '+3 Attack' },
  'Forest Expert': { how: 'Fill every star of Whisperwood in the monster book (K).', bonus: { def: 3 }, text: '+3 Defense' },
  'River Expert': { how: 'Fill every star of Riverside in the monster book (K).', bonus: { dodge: 0.02 }, text: '+2% Dodge' },
  'Bramble Expert': { how: 'Fill every star of Thornbush in the monster book (K).', bonus: { crit: 0.02 }, text: '+2% Critical' },
  'Burrow Expert': { how: 'Fill every star of Rootling Burrow in the monster book (K).', bonus: { maxMp: 25 }, text: '+25 Max MP' },
  'Cave Expert': { how: 'Fill every star of Pebble Cave in the monster book (K).', bonus: { luck: 0.1, matk: 3 }, text: '+10% Rare drops, +3 Magic' },
  'Sunbringer': { how: 'Finish Chapter 1: bring the sunshine home to Mossbrook.', bonus: { atk: 4, maxHp: 40 }, text: '+4 Attack, +40 Max HP' }
};

// Novice skills on hotbar slots 1-4; slots 5 and 6 hold potions
const SKILLS = [
  { id: 'bash', name: 'Bash', mp: 6, cd: 4, desc: 'A big overhead swing that knocks the monster back.' },
  { id: 'pebble', name: 'Pebble Toss', mp: 5, cd: 3, range: 10, desc: 'Throw a pebble at a monster up to 10 m away.' },
  { id: 'whirl', name: 'Whirl', mp: 10, cd: 8, desc: 'Spin around and hit every monster close by.' },
  { id: 'rally', name: 'Rally', mp: 8, cd: 20, desc: 'Cheer yourself on: +30% attack for 10 seconds.' }
];
const ULT = { name: 'Spark Burst', desc: 'Fills as you fight. A burst of light that hits everything nearby.' };

// every new hero starts with this; name and look come from the character creator
const NEW_GAME = {
  v: 1, name: 'Arlo', look: { gender: 'boy', skin: 0, hair: 'spiky', color: 0 }, lv: 1, exp: 0, pts: 0, stats: { str: 5, agi: 5, int: 5, vit: 5, luk: 5 },
  coins: 50, bag: [['red_s', 5], ['blue_s', 3]], hot: ['red_s', 'blue_s'], ult: 0,
  pos: null, face: Math.PI, seen: {}, kills: 0, playTime: 0,
  story: {}, quests: {}, daily: null,
  map: 'meadow', visited: { meadow: true }, chests: {}, book: {}, golden: {}, title: '', titles: [],
  job: 'novice', weapon: null, sp: 0, skills: {},
  pets: [], petOn: null, egg: null, petSaved: 0,
  gear: {}, gearBag: []
};

// character creator choices (same as the approved Character Creator board)
const LOOKS = {
  skins: [['Fair', '#f8dcc6'], ['Light', '#efc7a2'], ['Tan', '#d9a77d'], ['Brown', '#b07a54'], ['Deep', '#7f5238']],
  hairs: [['Spiky', 'spiky'], ['Long', 'long'], ['Ponytail', 'pony'], ['Twin tails', 'twin']],
  colors: [['Chestnut', '#8b5a36'], ['Black', '#2f2a2e'], ['Honey', '#d9a441'], ['Copper', '#c4622d'], ['Lilac', '#9b86c9']],
  genders: [['Boy', 'boy'], ['Girl', 'girl']]
};
// names for the Random button (original, short and easy to say)
const RANDOM_NAMES = {
  boy: ['Tobin', 'Rowan', 'Milo', 'Finn', 'Oren', 'Bram', 'Cal', 'Jory', 'Nico', 'Sol', 'Teo', 'Kip', 'Ash', 'Linus', 'Dax', 'Remy', 'Ollie', 'Hugo'],
  girl: ['Lina', 'Wren', 'Juno', 'Fern', 'Nell', 'Hazel', 'Ivy', 'Suri', 'Tess', 'Kaia', 'Lark', 'Elsie', 'Rhea', 'Bree', 'Mina', 'Poppy', 'Isla', 'Tamsin']
};
const SLOTS = 3;

Object.assign(RW, { RARITY, ITEMS, KINDS, GOLDEN, ELEMENTS, monsterStats, CAMPS, CAMPS_BY_MAP, AREAS, BOOK_STARS, CHESTS, SHOP, PET_SHOP, PETS, PET_TRAITS, PET_EGGS, PET_TEEN_LV, PET_HATCH, petStats, WEAPONS, JOBS, SKILL_MAX, SP_AT_JOB, STAT_KEYS, STAT_INFO, POINTS_PER_LEVEL, expNeed, derive, TITLES, SKILLS, ULT, NEW_GAME, LOOKS, RANDOM_NAMES, SLOTS });
})();
