// Russel World: Chapter 1 so far. Quests, Olly the owl, dialog scenes, the quest tracker and book, and the daily notice board.
// game.js reports what happens (kills, pickups, level ups...) through RW.on; this file decides what it means for the story.
(function () {
'use strict';
const RW = window.RW;
if (!RW || RW.failed || !RW.G || !RW.world) return;
const { THREE, scene, renderer, rnd, clamp, lerp, wrapAngle, V3, ITEMS, expNeed } = RW;
const W = RW.world, G = RW.G, UI = RW.UI, AU = RW.audio, sfx = AU.sfx;
const player = G.player;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let P = null;
const L = (who, face, text) => ({ who, face, text: text.replace(/\{hero\}/g, P ? P.name : 'friend') });
const NAMES = { king: 'King Leaflet', nora: 'Nora the Miller', oakley: 'Elder Oakley', mira: 'Mira', bolt: 'Bolt', pip: 'Pip', tobin: 'Old Tobin', fennick: 'Hermit Fennick', marla: 'Marla Ironheart', ivy: 'Ranger Ivy', zara: 'Zara Emberly' };

// ---------- places ----------
function walkableNear(x, z) {
  if (W.walkable(x, z)) return { x, z };
  for (let r = 1; r < 14; r++) for (let a = 0; a < 16; a++) { const xx = x + Math.cos(a / 16 * Math.PI * 2) * r, zz = z + Math.sin(a / 16 * Math.PI * 2) * r; if (W.walkable(xx, zz)) return { x: xx, z: zz }; }
  return { x, z };
}
const PLACES = {
  bush: { x: W.OLLY_BUSH.x + 1.6, z: W.OLLY_BUSH.z + 1.4 },
  hammer: walkableNear(-77, -133),
  trail: [walkableNear(31, -97), walkableNear(16, -188), walkableNear(6, -288), walkableNear(2, -356)],
  hillsIn: { x: 0, z: -690 },
  crystal: { x: W.CRYSTAL.x, z: W.CRYSTAL.z },
  kites: W.KITES.map((k) => ({ x: k.x, z: k.z })),
  wisps: W.WISPS.map((p) => walkableNear(p.x, p.z)),
  stash: { x: W.STASH.x, z: W.STASH.z },
  riverIn: { x: 772, z: -300 },
  caveDoor: walkableNear(W.CAVE.x, W.CAVE.z + 12),
  caveIn: { x: 1500, z: -650 },
  kingDoor: { x: 1500, z: -812 }
};
const MUSH_CAMPS = RW.CAMPS.filter((c) => c[0] === 'mushling').map((c) => ({ x: c[2], z: c[3] }));
const campsOf = (kind) => Object.values(RW.CAMPS_BY_MAP).flat().filter((c) => c[0] === kind).map((c) => ({ x: c[2], z: c[3] }));

// ---------- the quests ----------
const QUESTS = {
  mq1: { kind: 'main', title: 'Trouble in the Garden', desc: 'Someone is crying for help near the Sunberry patch, just past the north gate of Mossbrook.',
    stages: [
      { goal: [{ t: 'reach', at: 'bush', r: 9, text: 'Find who is calling for help by the garden' }], auto: true, scene: 'ollyStuck' },
      { goal: [{ t: 'kill', tag: 'olly', need: 3, text: 'Chase off the Leaflets around the owl' }], auto: true, scene: 'ollyFree' }
    ], reward: { exp: 40 }, next: 'mq2' },
  mq2: { kind: 'main', title: "The Elder's Worry", desc: 'Tell Elder Oakley what happened in the garden. He waits by the statue of Russel in the middle of Mossbrook.',
    stages: [{ goal: [], to: 'oakley', text: 'Talk to Elder Oakley by the statue', scene: 'oakleyMeet' }], reward: { exp: 20 }, next: 'mq3', unlock: true },
  mq3: { kind: 'main', title: 'The Garden Thieves', desc: 'Leaflets keep stealing Sunberries, the garden berries that soak up sunshine. Chase the Leaflets off and win the berries back.',
    stages: [{ goal: [{ t: 'kill', kind: 'leaflet', need: 8, text: 'Defeat Leaflets' }, { t: 'collect', item: 'sunberry', need: 5, text: 'Win back Sunberries' }], to: 'oakley', remind: 'mq3Remind', scene: 'mq3Done' }],
    reward: { exp: 150, coins: 40, items: [['red_s', 3]] }, next: 'mq4' },
  mq4: { kind: 'main', title: "Olly's Theory", desc: 'Olly is 99% sure the Mushlings are behind the berry thefts. Mushlings live in the north of Sunny Meadow, past the ponds.',
    stages: [{ goal: [{ t: 'kill', kind: 'mushling', need: 5, text: 'Defeat Mushlings in the north' }], auto: true, scene: 'mq4Done' }],
    reward: { exp: 120, items: [['blue_s', 2]] }, next: 'mq5' },
  mq5: { kind: 'main', title: 'A Glowing Trail', desc: 'Glowing drops of berry juice lead away across the meadow. Follow them and see where the Sunberries went.',
    stages: [{ goal: [{ t: 'trail', need: 4, text: 'Follow the glowing trail' }], auto: true, scene: 'mq5Done' }],
    reward: { exp: 80 }, next: 'mq6' },
  mq6: { kind: 'main', title: 'Report to the Elder', desc: 'The trail of Sunberries leads under the gate into Breezy Hills. Elder Oakley should know.',
    stages: [{ goal: [], to: 'oakley', text: 'Tell Elder Oakley about the trail', scene: 'mq6Done' }],
    reward: { exp: 250, coins: 100, items: [['red_m', 2]] }, next: 'mq7' },
  mq7: { kind: 'main', title: 'The Path Is Clear', desc: 'Bolt has been clearing the rockslide on the path to Breezy Hills. Ask him if it is open yet.',
    stages: [{ goal: [], to: 'bolt', text: 'Ask Bolt about the path to Breezy Hills', scene: 'boltPath' }], reward: { exp: 60 }, next: 'mq8' },
  mq8: { kind: 'main', title: 'Windy Welcome', desc: 'Walk to the north end of Sunny Meadow and step through the glowing gate into Breezy Hills.',
    stages: [{ goal: [{ t: 'reach', at: 'hillsIn', r: 22, map: 'hills', text: 'Go through the north gate into Breezy Hills' }], auto: true, scene: 'windyHills' }], reward: { exp: 80 }, next: 'mq9' },
  mq9: { kind: 'main', title: "Olly's Theory, Again", desc: 'Olly is now 99% sure the Bristleboars are the berry thieves. They roam all over Breezy Hills. Careful: they charge.',
    stages: [{ goal: [{ t: 'kill', kind: 'bristleboar', need: 6, text: 'Defeat Bristleboars' }], auto: true, scene: 'boarsDone' }], reward: { exp: 260, coins: 60, items: [['red_s', 3]] }, next: 'mq10' },
  mq10: { kind: 'main', title: 'The Windmill Keeper', desc: 'A windmill turns on the tallest hill. Whoever lives there sees everything from up high.',
    stages: [{ goal: [], to: 'tobin', text: 'Visit whoever lives at the windmill', scene: 'tobinMeet' },
      { goal: [{ t: 'find', item: 'crystal', at: 'crystal', text: 'Look at the Sun Crystal by the windmill door' }], auto: true, scene: 'crystalSeen' }],
    reward: { exp: 200, coins: 50 }, next: 'mq11' },
  mq11: { kind: 'main', title: 'Whispers in the Wood', desc: 'Old Tobin says Hermit Fennick lives in a hollow tree in Whisperwood. The west gate of Breezy Hills leads down into the forest.',
    stages: [{ goal: [], to: 'fennick', text: 'Find Hermit Fennick in Whisperwood', scene: 'fennickMeet' }], reward: { exp: 180 }, next: 'mq12' },
  mq12: { kind: 'main', title: 'Follow the Wisps', desc: 'Little glowing wisps float near Fennick\'s tree. He says they will lead you to the thieves.',
    stages: [{ goal: [{ t: 'trail', path: 'wisps', need: 5, text: 'Follow the glowing wisps' }], auto: true, scene: 'stashFound' }], reward: { exp: 120 }, next: 'mq13' },
  mq13: { kind: 'main', title: 'The Leaflet Stash', desc: 'The Leaflets hid the stolen Sunberries by an old log in the north-west of Whisperwood. Chase off the guards and take the berries back.',
    stages: [{ goal: [{ t: 'kill', tag: 'stash', need: 5, text: 'Chase off the Leaflet guards' }, { t: 'find', item: 'stash', at: 'stash', text: 'Gather the stolen Sunberries' }], auto: true, scene: 'footprint' }],
    reward: { exp: 320, coins: 120, items: [['red_m', 2]] }, next: 'mq14' },
  mq14: { kind: 'main', title: 'Sunshine for Mossbrook', desc: 'Bring the Sunberries home to Elder Oakley, and tell him about the giant footprint.',
    stages: [{ goal: [], to: 'oakley', text: 'Bring the Sunberries to Elder Oakley', scene: 'finale' }],
    reward: { exp: 400, coins: 150, items: [['red_m', 2], ['blue_m', 1]] }, next: 'mq15', light: true },
  // delivery 8: east to Riverside and Thornbush, and down into the Rootling Burrow
  mq15: { kind: 'main', title: 'The Road East', desc: 'Elder Oakley says the cave from the old tales lies far to the east. Take the east gate of Sunny Meadow to Riverside.',
    stages: [{ goal: [{ t: 'reach', at: 'riverIn', r: 24, map: 'river', text: 'Go through the east gate to Riverside' }], auto: true, scene: 'riverArrive' }], reward: { exp: 300, coins: 80 }, next: 'mq16' },
  mq16: { kind: 'main', title: 'The Miller by the River', desc: 'Someone keeps the old watermill turning. A miller sees everyone who crosses the river.',
    stages: [{ goal: [], to: 'nora', text: 'Talk to Nora at the watermill', scene: 'noraMeet' }], reward: { exp: 250, coins: 60, items: [['antidote', 3]] }, next: 'mq17' },
  mq17: { kind: 'main', title: 'A Prickly Path', desc: 'Nora saw Leaflets carrying glowing berries over her bridge, east to Thornbush. Find where they went.',
    stages: [{ goal: [{ t: 'reach', at: 'caveDoor', r: 9, map: 'thorn', text: 'Follow the berry thieves through Thornbush' }], auto: true, scene: 'caveBlocked' }], reward: { exp: 420, coins: 120, items: [['red_m', 2]] }, next: 'mq18' },
  mq18: { kind: 'main', title: 'Roots Everywhere', desc: 'Giant roots block the door of Pebble Cave. Hermit Fennick knows everything that grows. Ask him in Whisperwood.',
    stages: [{ goal: [], to: 'fennick', text: 'Ask Hermit Fennick about the roots', scene: 'fennickRoots' }], reward: { exp: 300 }, next: 'mq19' },
  mq19: { kind: 'main', title: 'Grandpa of the Burrow', desc: 'The roots belong to the Old Rootling, who sleeps at the end of the Rootling Burrow. Its door is under the big roots in Whisperwood.',
    stages: [{ goal: [{ t: 'kill', kind: 'old_rootling', need: 1, text: 'Defeat the Old Rootling in the burrow' }], auto: true, scene: 'rootlingDown' }],
    reward: { exp: 900, coins: 300, items: [['red_m', 3], ['blue_m', 2]] }, next: 'mq20' },
  // delivery 9: Pebble Cave and the King of all Leaflets, the end of Chapter 1
  mq20: { kind: 'main', title: 'A Door Too Big', desc: 'The roots let go of Pebble Cave, but big boulders still block its door. Bolt swings the biggest hammer in Mossbrook.',
    stages: [{ goal: [], to: 'bolt', text: 'Ask Bolt to help open Pebble Cave', scene: 'boltCave' }], reward: { exp: 400, coins: 100 }, next: 'mq21' },
  mq21: { kind: 'main', title: "Bolt's Big Swing", desc: 'Bolt ran ahead to Pebble Cave with his hammer. Meet him at the cave door in the north of Thornbush.',
    stages: [{ goal: [{ t: 'reach', at: 'caveDoor', r: 10, map: 'thorn', text: 'Meet Bolt at the door of Pebble Cave' }], auto: true, scene: 'caveOpen' }], reward: { exp: 500, coins: 120, items: [['wake_herb', 3]] }, next: 'mq22',
    after: () => { P.story.caveOpen = true; W.openCaveMouth(true); } },
  mq22: { kind: 'main', title: 'Into Pebble Cave', desc: 'The way is open. Step into Pebble Cave and see where the stolen sunshine went.',
    stages: [{ goal: [{ t: 'reach', at: 'caveIn', r: 8, map: 'cave', text: 'Go into Pebble Cave' }], auto: true, scene: 'caveInside' }], reward: { exp: 400 }, next: 'mq23' },
  mq23: { kind: 'main', title: 'Three Old Doors', desc: 'Three stone doors block the tunnels. Light the old torches, step on the buttons in the right order, and roll the boulder onto its plate.',
    stages: [{ goal: [{ t: 'reach', at: 'kingDoor', r: 7, map: 'cave', text: 'Open the three doors of Pebble Cave' }], auto: true, scene: 'kingNear' }], reward: { exp: 1200, coins: 250, items: [['red_m', 3]] }, next: 'mq24' },
  mq24: { kind: 'main', title: 'The King of All Leaflets', desc: 'King Leaflet sits on a throne of pebbles next to a heap of stolen Sunberries. Time to end this.',
    stages: [{ goal: [{ t: 'kill', kind: 'king_leaflet', need: 1, text: 'Defeat King Leaflet' }], auto: true, scene: 'kingDown' }], reward: { exp: 3000, coins: 600, items: [['red_m', 4], ['blue_m', 3]] }, next: 'mq25' },
  mq25: { kind: 'main', title: 'Sunshine Comes Home', desc: 'The King promised to give the sunshine back. Tell Elder Oakley the good news.',
    stages: [{ goal: [], to: 'oakley', text: 'Tell Elder Oakley what happened in the cave', scene: 'chapterEnd' }],
    reward: { exp: 2000, coins: 800, items: [['lucky_clover', 1], ['red_m', 5]] }, next: null, light: true, end: true, chapter: true,
    endLine: 'Chapter 1, done! The sun is back, the King is our friend, and I was right about everything. Mostly. More adventures are coming soon!',
    after: () => { if (!P.titles) P.titles = []; if (!P.titles.includes('Sunbringer')) { P.titles.push('Sunbringer'); setTimeout(() => { if (P) { UI.toast('New title: <b>Sunbringer</b>! Wear it from the monster book (K).', true); RW.emit('title', 'Sunbringer'); } }, 5200); } } },
  sq_letter: { kind: 'side', title: 'A Letter for Mira', giver: 'oakley', offer: 'letterOffer', desc: "Elder Oakley's knees and the hill to the shop do not get along. Deliver his letter.",
    stages: [{ goal: [], to: 'mira', text: 'Give the letter to Mira', scene: 'letterMira' }, { goal: [], to: 'oakley', text: "Bring Mira's answer to Elder Oakley", scene: 'letterDone' }],
    reward: { exp: 70, coins: 20 } },
  sq_jam: { kind: 'side', title: 'Jelly Jam', giver: 'mira', offer: 'jamOffer', desc: 'Mira wants Leaf Jelly for her famous jam. Leaflets drop it all the time.',
    stages: [{ goal: [{ t: 'have', item: 'leaf_jelly', need: 5, text: 'Leaf Jelly for Mira' }], to: 'mira', take: true, remind: 'jamRemind', scene: 'jamDone' }],
    reward: { exp: 60, coins: 30, items: [['red_s', 3]] } },
  sq_hammer: { kind: 'side', title: 'The Lost Hammer', giver: 'bolt', offer: 'hammerOffer', desc: 'Bolt dropped his favourite little hammer somewhere by the west pond.',
    stages: [{ goal: [{ t: 'find', item: 'bolt_hammer', need: 1, text: "Find Bolt's hammer by the west pond" }], to: 'bolt', remind: 'hammerRemind', scene: 'hammerDone' }],
    reward: { exp: 50, coins: 60 } },
  sq_spores: { kind: 'side', title: 'Curious Spores', giver: 'pip', offer: 'sporesOffer', desc: 'Pip wonders if Mushling spores help eggs hatch faster. For science!',
    stages: [{ goal: [{ t: 'have', item: 'spore_puff', need: 3, text: 'Spore Puffs for Pip' }], to: 'pip', take: true, remind: 'sporesRemind', scene: 'sporesDone' }],
    reward: { exp: 80, items: [['pet_treat', 2]] } },
  jq1: { kind: 'job', title: 'Choose Your Path', desc: 'You reached Lv. 10! Four masters teach jobs: Marla Ironheart (Warrior) in the Mossbrook training yard, Bolt (Robot) at his forge, Ranger Ivy (Archer) in Breezy Hills and Zara Emberly (Mage) in Whisperwood. Meet them, try their weapons, then pass one trial. Your choice is for good.',
    stages: [{ goal: [{ t: 'meet', who: 'marla', text: 'Meet Marla in the training yard' }, { t: 'meet', who: 'bolt', text: 'Ask Bolt about the Robot job' }, { t: 'meet', who: 'ivy', text: 'Meet Ranger Ivy in Breezy Hills' }, { t: 'meet', who: 'zara', text: 'Meet Zara Emberly in Whisperwood' }, { t: 'job', text: 'Pass one master\'s trial' }], auto: true, scene: 'jobDone' }],
    reward: { exp: 300, coins: 150, items: [['red_m', 3], ['antidote', 2]] } },
  sq_kites: { kind: 'side', title: 'Kites in the Wind', giver: 'tobin', needs: 'mq10', offer: 'kitesOffer', desc: 'The wind stole four of Old Tobin\'s kites. They are stuck in trees around Breezy Hills.',
    stages: [{ goal: [{ t: 'kites', need: 4, text: "Find Tobin's kites in the trees" }], to: 'tobin', remind: 'kitesRemind', scene: 'kitesDone' }],
    reward: { exp: 160, coins: 80, items: [['blue_s', 2]] } },
  sq_bristles: { kind: 'side', title: 'Brush Up', giver: 'tobin', needs: 'mq10', offer: 'bristlesOffer', desc: 'Old Tobin needs Boar Bristles to make new kite brushes.',
    stages: [{ goal: [{ t: 'have', item: 'boar_bristle', need: 5, text: 'Boar Bristles for Tobin' }], to: 'tobin', take: true, remind: 'bristlesRemind', scene: 'bristlesDone' }],
    reward: { exp: 180, coins: 70, items: [['red_s', 3]] } },
  sq_glowcap: { kind: 'side', title: 'Glowcap Tea', giver: 'fennick', needs: 'mq11', offer: 'glowcapOffer', desc: 'Hermit Fennick brews tea from the glowing caps of Moss Mushlings.',
    stages: [{ goal: [{ t: 'have', item: 'glowcap', need: 5, text: 'Glowcaps for Fennick' }], to: 'fennick', take: true, remind: 'glowcapRemind', scene: 'glowcapDone' }],
    reward: { exp: 220, coins: 60, items: [['blue_m', 1]] } },
  sq_thorns: { kind: 'side', title: 'Quiet, Please', giver: 'fennick', needs: 'mq11', offer: 'thornsOffer', desc: 'Grumpy Thornhogs keep stomping around Fennick\'s tree. Calm some of them down.',
    stages: [{ goal: [{ t: 'kill', kind: 'thornhog', need: 8, text: 'Defeat Thornhogs' }], to: 'fennick', remind: 'thornsRemind', scene: 'thornsDone' }],
    reward: { exp: 300, coins: 90, items: [['red_m', 1]] } },
  sq_acorns: { kind: 'side', title: 'Nutty Business', giver: 'nora', needs: 'mq16', offer: 'acornsOffer', desc: 'Nutsnatchers raided Nora\'s acorn sack for the winter. Win back some Shiny Acorns.',
    stages: [{ goal: [{ t: 'have', item: 'acorn', need: 6, text: 'Shiny Acorns for Nora' }], to: 'nora', take: true, remind: 'acornsRemind', scene: 'acornsDone' }],
    reward: { exp: 380, coins: 110, items: [['red_m', 2]] } },
  sq_frogs: { kind: 'side', title: 'Too Many Frogs', giver: 'nora', needs: 'mq16', offer: 'frogsOffer', desc: 'Plopfrogs keep licking Nora\'s flour sacks. Shoo some of them away from the mill.',
    stages: [{ goal: [{ t: 'kill', kind: 'plopfrog', need: 10, text: 'Defeat Plopfrogs' }], to: 'nora', remind: 'frogsRemind', scene: 'frogsDone' }],
    reward: { exp: 420, coins: 100, items: [['blue_m', 1]] } },
  sq_honey: { kind: 'side', title: 'Honey Jam', giver: 'mira', needs: 'mq17', offer: 'honeyOffer', desc: 'Mira heard about bramble honey from Thornbush and wants to try a new jam.',
    stages: [{ goal: [{ t: 'have', item: 'honey_drop', need: 5, text: 'Honey Drops for Mira' }], to: 'mira', take: true, remind: 'honeyRemind', scene: 'honeyDone' }],
    reward: { exp: 520, coins: 130, items: [['red_m', 2], ['antidote', 2]] } },
  sq_crystals: { kind: 'side', title: 'A Kite for the Night', giver: 'tobin', needs: 'mq22', offer: 'crystalsOffer', desc: 'Old Tobin wants to build a kite that glows in the dark. Gemcaps in Pebble Cave grow glowing crystals.',
    stages: [{ goal: [{ t: 'have', item: 'cave_crystal', need: 6, text: 'Cave Crystals for Tobin' }], to: 'tobin', take: true, remind: 'crystalsRemind', scene: 'crystalsDone' }],
    reward: { exp: 900, coins: 200, items: [['blue_m', 2]] } },
  sq_guards: { kind: 'side', title: 'Pebble Patrol', giver: 'bolt', needs: 'mq22', offer: 'guardsOffer', desc: 'Bolt wants the King\'s Pebble Leaflet guards to stop throwing pebbles at his new cave door.',
    stages: [{ goal: [{ t: 'kill', kind: 'pebble_leaflet', need: 12, text: 'Defeat Pebble Leaflets' }], to: 'bolt', remind: 'guardsRemind', scene: 'guardsDone' }],
    reward: { exp: 1000, coins: 220, items: [['red_m', 2], ['wake_herb', 2]] } }
};
for (const q of Object.values(QUESTS)) for (const st of q.stages) for (const o of st.goal) o.need = o.need || 1;
const MAIN = ['mq1', 'mq2', 'mq3', 'mq4', 'mq5', 'mq6', 'mq7', 'mq8', 'mq9', 'mq10', 'mq11', 'mq12', 'mq13', 'mq14', 'mq15', 'mq16', 'mq17', 'mq18', 'mq19', 'mq20', 'mq21', 'mq22', 'mq23', 'mq24', 'mq25'];
const SIDE = ['sq_letter', 'sq_jam', 'sq_hammer', 'sq_spores', 'sq_kites', 'sq_bristles', 'sq_glowcap', 'sq_thorns', 'sq_acorns', 'sq_frogs', 'sq_honey', 'sq_crystals', 'sq_guards'];
const JOBQ = ['jq1'];
const sideOpen = (id) => { const q = QUESTS[id]; if (qs(id)) return false; if (q.needs) { const s = qs(q.needs); return !!s && (s.done || s.st > 0); } return !!P.story.requests; };
const ALL = MAIN.concat(SIDE, JOBQ);

// ---------- what everybody says ----------
const SCENES = {
  ollyStuck: () => [
    L('olly', 'worried', 'Hoo! You there! Yes, you, with the stick!'),
    L('olly', 'worried', 'My scarf is stuck in this bush, and these jelly hooligans keep bumping me! Shoo them away, please!')
  ],
  ollyFree: () => [
    L('olly', 'happy', 'Free! Hoo-hoo! Thank you, thank you!'),
    L('olly', 'normal', "I'm Olly. Owl. Genius. Professional know-it-all."),
    L('olly', 'worried', '...and my scarf is a little long. It catches on things. Bushes. Branches. Doors. Other owls.'),
    L('olly', 'happy', 'You fight pretty well for someone with a stick, {hero}! I am coming with you. Do not argue, I have decided.'),
    L('olly', 'normal', 'Tip from a genius: keys 1 to 4 are your skills and 5 and 6 are potions. Or tap the buttons at the bottom. Press X to sit and rest.'),
    L('olly', 'surprised', 'Oh! Elder Oakley will want to hear about this. To the statue in the middle of town!')
  ],
  mq1Remind: () => [L('oakley', 'surprised', 'Did you hear that? Someone is crying for help by the garden! Hurry, young one, through the north gate!')],
  oakleyMeet: () => [
    L('oakley', 'happy', 'Ah, {hero}! You chased the Leaflets off? And you found... an owl in a scarf?'),
    L('olly', 'happy', 'Olly. Genius. Charmed, I am sure.'),
    L('oakley', 'normal', 'Those Leaflets have raided the village garden every day this week. The odd thing is, they only take the Sunberries.'),
    L('olly', 'surprised', 'Sunberries? The glowy ones that taste like summer?'),
    L('oakley', 'worried', 'The very same. They soak up sunshine... and the sun has been so weak lately. We need every berry we can keep.'),
    L('oakley', 'normal', 'Chase off the Leaflets in the meadow and win back the Sunberries they carry. Five should keep our lamps glowing for now.'),
    L('oakley', 'happy', 'Oh, and the villagers could use a hand too. Look for a yellow mark over their heads. The notice board by the north gate has small daily jobs as well.')
  ],
  mq3Remind: () => [L('oakley', 'normal', 'Leaflets carry the Sunberries away in their leaves. Defeat them and the berries fall out. Bring me five!')],
  mq3Done: () => [
    L('oakley', 'happy', 'Five Sunberries! Warm as a summer afternoon. Well done, {hero}.'),
    L('olly', 'normal', 'I have a theory about the thieves. A brilliant theory. It is the Mushlings.'),
    L('oakley', 'surprised', 'The Mushlings? They hardly leave their patch up north, past the ponds.'),
    L('olly', 'happy', 'Exactly what a mastermind wants you to think! I am 99% sure.'),
    L('oakley', 'normal', 'Well... it cannot hurt to look. Be careful. Mushlings hit much harder than Leaflets.')
  ],
  mq4Done: () => [
    L('olly', 'worried', 'Hmm. No Sunberries. Not a single one.'),
    L('olly', 'normal', 'Maybe 99% was a little high. Let us say... 40%.'),
    L('olly', 'surprised', 'Wait! Look at the grass! Glowing drops, like berry juice... It is a trail! Follow it!')
  ],
  mq5Done: () => [
    L('olly', 'surprised', 'The trail goes under the gate... all the way up into Breezy Hills!'),
    L('olly', 'worried', 'The Leaflets are carrying the Sunberries somewhere. But why would jelly need sunshine?'),
    L('olly', 'normal', 'We should tell the Elder. Also, I am 100% sure now. Well. 80%.')
  ],
  mq6Done: () => [
    L('oakley', 'worried', 'Breezy Hills... That path has been blocked by a rockslide since last spring.'),
    L('oakley', 'normal', 'Bolt has been clearing it all week. Go and ask him if it is open yet. He is at his forge.'),
    L('olly', 'happy', 'And if it is not open, I will glare at the rocks until they move. Very hard.'),
    L('oakley', 'happy', 'You did well today, {hero}. Russel himself started with less.')
  ],
  boltPath: () => [
    L('bolt', 'happy', 'HA! Kid! I cleared the last rock off the hill path this morning. One hammer, three hundred swings!'),
    L('bolt', 'normal', 'The gate at the north end of Sunny Meadow is open now. Walk into the glowing swirl and you are in Breezy Hills.'),
    L('bolt', 'worried', 'Watch out for Bristleboars up there. They paw the ground, then CHARGE. Nobody dodges that, so keep your potions handy.'),
    L('olly', 'surprised', 'Fun fact: Bristleboars charge because they are shy. I made that up. Let us go!')
  ],
  windyHills: () => [
    L('olly', 'surprised', 'Whoa! Wind! In my feathers! In my scarf! Everywhere!'),
    L('olly', 'worried', 'Oh no. The glowing trail... the wind has blown the drops all over the hills.'),
    L('olly', 'normal', 'But I have a new theory. A better theory. The Bristleboars took the Sunberries. Big, bristly, suspicious.'),
    L('olly', 'happy', 'Let us defeat a few and see what they drop. For science!')
  ],
  boarsDone: () => [
    L('olly', 'worried', 'Hmm. Bristle. More bristle. And... Sunberry pips?'),
    L('olly', 'normal', 'They did eat Sunberries. But only the ones the Leaflets dropped along the way. They are not thieves, they are... snackers.'),
    L('olly', 'surprised', 'Look up there! A windmill on the tallest hill. Somebody lives there. Somebody who sees everything from up high!')
  ],
  tobinMeet: () => [
    L('tobin', 'surprised', 'Visitors! On my hill! Mind the kite strings, young one.'),
    L('tobin', 'happy', 'I am Tobin. I make kites. Some of them even fly.'),
    L('olly', 'normal', 'We are following stolen Sunberries. Have you seen Leaflets carrying glowing berries?'),
    L('tobin', 'normal', 'Seen them? Every evening! A whole line of them, marching down the west slope into Whisperwood.'),
    L('tobin', 'worried', 'But first, come and look at the old Sun Crystal by my door. Something is wrong with it.')
  ],
  crystalSeen: () => [
    L('tobin', 'normal', 'My great-grandpa said Russel himself left this crystal here. It drinks sunlight all day and glows all night.'),
    L('tobin', 'worried', 'It used to shine so bright, the windmill turned in the dark. Now look at it. Dim as a candle.'),
    L('olly', 'surprised', 'Sunberries soak up sunshine... and the crystal is going dim... Hoo! Somebody is taking the sunshine itself!'),
    L('tobin', 'normal', 'Then you had better ask old Fennick. He lives in a hollow tree in Whisperwood, and the trees tell him everything.'),
    L('tobin', 'happy', 'The west gate leads down into the forest. And if you spot my lost kites on the way... well, come and talk to me!')
  ],
  fennickMeet: () => [
    L('fennick', 'normal', 'Shh... Footsteps. Small ones. And a scarf. You must be the owl the trees keep talking about.'),
    L('olly', 'happy', 'They talk about me? Good things, I hope.'),
    L('fennick', 'happy', 'They say you talk a lot.'),
    L('fennick', 'normal', 'For days now the trees have whispered about little jelly thieves carrying sunlight in their leaves, deep into the north-west.'),
    L('fennick', 'normal', 'Follow the wisps, those little lights behind my tree. They do not like thieves either.')
  ],
  stashFound: () => [
    L('olly', 'surprised', 'Look! An old hollow log... and a HEAP of Sunberries!'),
    L('olly', 'worried', 'And Leaflets guarding it. Lots of Leaflets. Grumpy ones.'),
    L('olly', 'normal', 'Chase them off, then we take every berry home!')
  ],
  footprint: () => [
    L('olly', 'happy', 'Berries! So many berries! Mossbrook will glow for a month!'),
    L('olly', 'surprised', 'Wait. What is that in the mud?'),
    L('olly', 'worried', 'A footprint. A BIG one. Bigger than Bolt. And around the toes... a crown of leaves?'),
    L('olly', 'worried', 'Someone very big is collecting sunshine. And the Leaflets are working for them.'),
    L('olly', 'normal', 'We must tell Elder Oakley. Right now. Well, after the walk home. A quick walk.')
  ],
  finale: () => [
    L('oakley', 'surprised', 'So many Sunberries! The lamps of Mossbrook will glow all winter.'),
    L('oakley', 'worried', 'A footprint with a crown of leaves... I have heard of that only in the oldest stories. The King of all Leaflets.'),
    L('olly', 'surprised', 'A KING? Of jelly?'),
    L('oakley', 'normal', 'The tales say he sleeps deep under the rocks, in a cave far from here. If he is awake, and hungry for sunshine...'),
    L('oakley', 'happy', 'Rest now, {hero}. You brought the sunshine home. Tomorrow we find out where it was going.')
  ],
  riverArrive: () => [
    L('olly', 'happy', 'Riverside! Smell that fresh water. And listen... a mill wheel, going round and round.'),
    L('olly', 'normal', 'See that tall stone with the glowing top? A waystone. Touch it and it wakes up. Awake waystones take you anywhere for a few coins!'),
    L('olly', 'surprised', 'A miller lives by the river. Millers see everyone who crosses the bridges. Let us ask!')
  ],
  noraMeet: () => [
    L('nora', 'surprised', 'Oh! Visitors! Mind the frogs, they lick everything. Even me.'),
    L('olly', 'normal', 'We are looking for Leaflets carrying glowing berries. Have you seen any?'),
    L('nora', 'worried', 'Seen them? A whole line of them crossed my bridge last week, glowing like little lanterns! They went east, into Thornbush.'),
    L('nora', 'normal', 'Nobody goes into Thornbush for fun. Bees with poison stings, and bushes that bite. Take some antidotes, dear.'),
    L('nora', 'happy', 'And if you have time later, I could use a hand around the mill. Come back and see me!')
  ],
  caveBlocked: () => [
    L('olly', 'surprised', 'A cave! With a stone door... and look, glowing berry juice on the ground right in front of it!'),
    L('olly', 'worried', 'But the door is wrapped in ROOTS. Huge ones. Thicker than Bolt\'s arms. They are not from any tree here.'),
    L('olly', 'normal', 'These roots come up from under the ground. Hermit Fennick knows everything that grows. Back to Whisperwood!')
  ],
  fennickRoots: () => [
    L('fennick', 'normal', 'Thick roots, wrapped round a stone door? Hmm. That sounds like the Old Rootling.'),
    L('fennick', 'worried', 'He is the grandpa of all Rootlings. He sleeps at the end of the Rootling Burrow, right under this forest. When he snores, his roots grow.'),
    L('olly', 'surprised', 'His roots grow all the way to Thornbush? Just from snoring?!'),
    L('fennick', 'happy', 'He is a very big sleeper. The burrow door is under the giant roots, south-east of my tree. Wake him up, show him who is boss, and his roots will let go.'),
    L('fennick', 'normal', 'Watch the ground when he is angry. Red circles mean roots are about to burst up.')
  ],
  rootlingDown: () => [
    L('olly', 'happy', 'We did it! The Old Rootling is sitting down... and grumbling. And yawning.'),
    L('olly', 'surprised', 'Listen! Creak... creak... His roots are pulling back, all the way under the hills!'),
    L('olly', 'normal', 'The roots will let go of the cave door. But a door that big needs strong hands to open. Maybe Bolt can help, later.'),
    L('olly', 'happy', 'He looked so sleepy. I think he will be back to guard his chest tomorrow. Grandpas love their naps.')
  ],
  boltCave: () => [
    L('bolt', 'surprised', 'A cave door, stuck shut with boulders? Kid, you came to the right blacksmith!'),
    L('olly', 'normal', 'They are VERY big boulders. Bigger than you. Possibly bigger than your ego.'),
    L('bolt', 'happy', 'HA! The bigger the rock, the better the swing. Let me grab my big hammer. The really big one.'),
    L('bolt', 'normal', 'I will run ahead to Thornbush. Meet me at the cave door, north of the beehives. And bring potions, those caves are never empty.')
  ],
  caveOpen: () => [
    L('bolt', 'happy', 'There you are! I ran the whole way. Only stopped twice. For snacks.'),
    L('bolt', 'normal', 'Now stand back, kid. One... two... THREE!'),
    L('olly', 'surprised', 'KRAKOOM! The boulders... they just crumbled! Like cookies!'),
    L('bolt', 'happy', 'Three hundred swings on the hill path made these arms strong. The door is all yours.'),
    L('bolt', 'worried', 'I heard something in there, though. Snoring. Big, jelly snoring. Be careful.'),
    L('olly', 'normal', 'Jelly snoring... The footprint with the crown... I have a feeling we know who lives here.')
  ],
  caveInside: () => [
    L('olly', 'worried', 'Brr. It is dark, and cold, and the walls sparkle. Is that... beautiful or scary? Both. It is both.'),
    L('olly', 'surprised', 'Look at the ground! Berry juice, glowing. The Leaflets carried the Sunberries right through here.'),
    L('olly', 'normal', 'And I see stone doors deeper inside. Old ones, with a sun carved on them. Doors like that always have a trick.'),
    L('olly', 'happy', 'Tricks are my favourite. Let us look around: torches, buttons, a big round rock... everything is a clue!')
  ],
  kingNear: () => [
    L('olly', 'surprised', 'All three doors are open! And look ahead... a beam of sunlight, deep under the ground?!'),
    L('olly', 'worried', 'There is a throne of pebbles. A HEAP of glowing Sunberries. And on the throne...'),
    L('olly', 'worried', 'A crown of golden leaves. The footprint. The King of all Leaflets.'),
    L('olly', 'normal', 'Remember: when he jumps, a red circle shows where he will land. Get out of it! And his guards will come when he calls.'),
    L('olly', 'happy', 'You can do this, {hero}. I believe in you. From back here. Behind you.')
  ],
  kingDown: () => [
    L('king', 'hurt', 'Oof... ouch... enough, enough! You win, little one. You are very strong.'),
    L('olly', 'angry', 'You stole the Sunberries! And the sunshine from the Sun Crystal! Why?!'),
    L('king', 'hurt', 'It is so cold down here, and so dark. My Leaflets were shivering. I only wanted a little sunshine for them...'),
    L('olly', 'surprised', 'Oh. Oh no. You were not being mean. You were being... cold.'),
    L('king', 'normal', 'I will give it all back. Every berry. But please... is there a warmer place for my Leaflets?'),
    L('olly', 'happy', 'Mossbrook has a big sunny garden, and Elder Oakley has a very big heart. Leave it to us!'),
    L('king', 'happy', 'Then I promise: no more stealing. And if you want a good wrestle now and then, come back. I like you.')
  ],
  chapterEnd: () => [
    L('oakley', 'surprised', '{hero}! Olly! You are back! And look... the sun is shining brighter than it has all year!'),
    L('olly', 'happy', 'The King of all Leaflets was taking the sunshine. But only because his cave was cold and his Leaflets were shivering.'),
    L('oakley', 'normal', 'Cold Leaflets... So that was it all along. Not thieves. Just a family that needed warmth.'),
    L('olly', 'normal', 'He promised to give everything back. Could the Leaflets come and sun themselves in the garden sometimes? They are very polite. Mostly.'),
    L('oakley', 'happy', 'Of course they can. There is enough sunshine in Mossbrook for everyone, as long as we share it.'),
    L('oakley', 'happy', 'Russel himself would be proud of you, {hero}. From today, Mossbrook will call you the Sunbringer.'),
    L('olly', 'happy', 'Sunbringer! And me? Sunbringer\'s Genius Owl. It is official. I just decided.')
  ],
  crystalsOffer: () => [
    L('tobin', 'surprised', 'Is it true? Crystals in Pebble Cave that glow in the dark?'),
    L('tobin', 'happy', 'A kite that glows at night! The whole valley could watch it fly. Bring me 6 Cave Crystals, would you? The Gemcaps grow them.')
  ],
  crystalsRemind: () => [L('tobin', 'normal', 'Six Cave Crystals, young one. Gemcaps carry them on their heads. Mind the headbutts.')],
  crystalsDone: () => [L('tobin', 'happy', 'Look how they shine! Tonight we fly the first night kite in Mossbrook. Here, take this, and come watch!')],
  guardsOffer: () => [
    L('bolt', 'worried', 'Those Pebble Leaflets in the cave keep throwing pebbles at me when I fix the doorway. PING! PING! On my head!'),
    L('bolt', 'normal', 'Teach 12 of them some manners, kid. Then I can work in peace.')
  ],
  guardsRemind: () => [L('bolt', 'normal', 'Twelve Pebble Leaflets. They hide in every hall of the cave. PING. Still hurts.')],
  guardsDone: () => [L('bolt', 'happy', 'Quiet at last! Not one pebble all morning. You are a good friend, kid. Here, this is for you.')],
  acornsOffer: () => [
    L('nora', 'worried', 'Those Nutsnatchers raided my acorn sack! I was saving those for winter bread.'),
    L('nora', 'normal', 'They drop Shiny Acorns when you catch them. Could you bring me 6? And watch your coin purse around them!')
  ],
  acornsRemind: () => [L('nora', 'normal', 'Six Shiny Acorns, dear. The squirrels live in the trees on both banks.')],
  acornsDone: () => [L('nora', 'happy', 'My acorns! Polished, even. That cheeky squirrel cleaned them for me. Here, for your trouble.')],
  frogsOffer: () => [
    L('nora', 'worried', 'The Plopfrogs keep licking my flour sacks. Sticky flour makes terrible bread.'),
    L('nora', 'normal', 'Shoo away 10 of them for me? Get close to them, their tongues reach far.')
  ],
  frogsRemind: () => [L('nora', 'normal', 'Ten Plopfrogs, dear. Run right up to them, they are slow up close.')],
  frogsDone: () => [L('nora', 'happy', 'Dry flour at last! I will bake you a loaf someday. For now, take this.')],
  honeyOffer: () => [
    L('mira', 'surprised', '{hero}! Is it true there is purple honey in Thornbush? Bramble honey?'),
    L('mira', 'happy', 'Bring me 5 Honey Drops. Honey Jam! The whole town will line up for it.')
  ],
  honeyRemind: () => [L('mira', 'normal', 'Five Honey Drops! Bramblebees carry them. Bring antidotes, I hear they sting.')],
  honeyDone: () => [L('mira', 'happy', 'So golden! So sticky! This jam will be famous. Take these, and thank you!')],
  kitesOffer: () => [
    L('tobin', 'worried', 'The wind took four of my kites last night. They are stuck up in trees all over the hills.'),
    L('tobin', 'happy', 'If you spot one, give it a gentle tug. Bring them all home and I will pay you in coins. And tea.')
  ],
  kitesRemind: () => [L('tobin', 'normal', 'Four kites, stuck in trees around the hills. Look up! They are bright red.')],
  kitesDone: () => [L('tobin', 'happy', 'All four! Not a single rip. You have sharp eyes, young one. Here, for your trouble.')],
  bristlesOffer: () => [
    L('tobin', 'normal', 'My kite brushes are worn bald. Boar Bristles make the very best ones.'),
    L('tobin', 'happy', 'Bring me 5 Boar Bristles? Bristleboars drop them. Mind the charge!')
  ],
  bristlesRemind: () => [L('tobin', 'normal', 'Five Boar Bristles, young one. Stiff and scratchy, the scratchier the better.')],
  bristlesDone: () => [L('tobin', 'happy', 'Lovely and scratchy! These will make fine brushes. Take this.')],
  glowcapOffer: () => [
    L('fennick', 'normal', 'Moss Mushlings grow Glowcaps on their heads. They make a soft, glowing tea for long nights.'),
    L('fennick', 'happy', 'Bring me 5 Glowcaps, and I will share what I have.')
  ],
  glowcapRemind: () => [L('fennick', 'normal', 'Five Glowcaps. The Moss Mushlings have plenty. They grow new ones by morning.')],
  glowcapDone: () => [L('fennick', 'happy', 'Ahh. They glow so nicely. Here, a little something for your journey.')],
  thornsOffer: () => [
    L('fennick', 'worried', 'The Thornhogs have been stomping around my tree all week. Grumpy little things.'),
    L('fennick', 'normal', 'Could you calm 8 of them down? Skills and pebbles work best. Their thorns prick back.')
  ],
  thornsRemind: () => [L('fennick', 'normal', 'Thornhogs, eight of them. Remember: plain hits prick you back. Use your skills.')],
  thornsDone: () => [L('fennick', 'happy', 'Quiet at last. I can hear the trees again. Thank you, young one.')],
  jobDone: () => [
    L('olly', 'happy', 'A real ' + (P && RW.JOBS[P.job] ? RW.JOBS[P.job].name : 'hero') + '! I always knew it. I say that a lot, but this time I mean it.'),
    L('olly', 'normal', 'Fun fact: every new skill point makes you 3% more awesome. Press C to spend them. I am 100% sure about this one.')
  ],
  jobReady: () => [
    L('olly', 'surprised', 'Hoo! Lv. 10! Do you know what that means? JOBS!'),
    L('olly', 'normal', 'Four masters teach them: Marla in the training yard, Bolt at his forge, Ranger Ivy in Breezy Hills and Zara in Whisperwood.'),
    L('olly', 'happy', 'Meet them all and try their weapons before you choose. You only choose once. No pressure. Some pressure.')
  ],
  letterOffer: () => [
    L('oakley', 'normal', 'Would you do an old man a favour? Take this letter to Mira at her shop.'),
    L('oakley', 'happy', 'My knees and that little hill do not get along.')
  ],
  letterMira: () => [
    L('mira', 'surprised', 'A letter from the Elder? Let me see...'),
    L('mira', 'happy', 'He wants three jars of jam for the Lantern Festival! Of course. Here is my answer, take it back to him.')
  ],
  letterDone: () => [L('oakley', 'happy', 'Jam for the festival! Splendid. Thank you, young one.')],
  jamOffer: () => [
    L('mira', 'happy', 'Psst, {hero}! Did you know Leaf Jelly makes the best jam? Wobbly, green, delicious.'),
    L('mira', 'normal', 'Bring me 5 Leaf Jelly and I will pay you in potions. Deal?')
  ],
  jamRemind: () => [L('mira', 'normal', 'Still saving a jar for those 5 Leaf Jelly! Leaflets drop them all the time.')],
  jamDone: () => [L('mira', 'happy', 'Five wobbly jellies! Jam for everyone. Well, mostly for me. Here, take these!')],
  hammerOffer: () => [
    L('bolt', 'worried', 'Kid! Have you seen a little hammer? My GOOD little hammer?'),
    L('bolt', 'normal', 'I took it to the west pond to... think. Then I came back without it. Could you look around the pond for me?')
  ],
  hammerRemind: () => [L('bolt', 'normal', 'West pond, kid. Little hammer, shiny head. Cannot miss it. I did, though.')],
  hammerDone: () => [L('bolt', 'happy', 'HA! There she is! Not a scratch on her. Here, buy yourself something nice. Or a potion.')],
  sporesOffer: () => [
    L('pip', 'surprised', 'Hey! Is it true Mushlings puff sparkly spores when they bonk you?'),
    L('pip', 'happy', 'I want to see if spores help eggs hatch faster. For science! Could you bring me 3 Spore Puffs?')
  ],
  sporesRemind: () => [L('pip', 'normal', '3 Spore Puffs, please! Mushlings live up north, past the ponds.')],
  sporesDone: () => [L('pip', 'happy', 'Ooh, they tickle! Thank you! Here, some Pet Treats. You will need them when you get a pet someday!')]
};

// ---------- quest state ----------
const qs = (id) => P && P.quests[id];
const active = (id) => { const s = qs(id); return !!s && !s.done; };
// quests added later (chapters 2-5) skip the load-time "need = 1" pass, so fill it in here too
const stageOf = (id) => { const s = qs(id); if (!s || s.done) return null; const st = QUESTS[id].stages[s.st]; if (st && !st._n) { st._n = true; for (const o of st.goal) o.need = o.need || 1; } return st; };
function objCount(id, i) {
  const st = stageOf(id); if (!st) return 0; const o = st.goal[i];
  if (o.t === 'have') return Math.min(o.need, G.bagCount(o.item));
  return Math.min(o.need, qs(id).prog[i] || 0);
}
function stageReady(id) { const st = stageOf(id); return !!st && st.goal.every((o, i) => objCount(id, i) >= o.need); }
let dirtyUI = true;
function changed() { dirtyUI = true; }
function startQuest(id, quiet) {
  if (!P || qs(id)) return;
  P.quests[id] = { st: 0, prog: [], done: false };
  stageStart(id);
  if (!quiet) { sfx.questNew(); UI.toast('New quest: <b>' + esc(QUESTS[id].title) + '</b>'); }
  changed(); G.save();
}
function stageStart(id) {
  const st = stageOf(id); qs(id).prog = st.goal.map(() => 0);
  setupWorld();
  checkAuto();
}
function advance(id) {
  const s = qs(id); if (!s || s.done) return;
  const q = QUESTS[id], st = q.stages[s.st];
  if (st.take) for (const o of st.goal) if (o.t === 'have') G.bagTake(o.item, o.need);
  s.st++;
  if (s.st >= q.stages.length) finishQuest(id);
  else { stageStart(id); sfx.step(); changed(); G.save(); }
}
function rewardText(r) {
  const out = [];
  if (r.exp) out.push(r.exp + ' EXP'); if (r.coins) out.push(r.coins + ' coins');
  for (const [id, n] of r.items || []) out.push(n + ' × ' + ITEMS[id].name);
  return out.join(', ');
}
function finishQuest(id) {
  const s = qs(id), q = QUESTS[id]; s.done = true; s.prog = [];
  const r = q.reward || {};
  sfx.questDone(); UI.toast('Quest complete! ' + esc(q.title), true);
  setTimeout(() => UI.toast('Reward: ' + esc(rewardText(r))), 900);
  if (r.coins) G.addCoins(r.coins);
  for (const [it, n] of r.items || []) G.bagAdd(it, n);
  if (r.exp) G.gainExp(r.exp);
  if (q.unlock) P.story.requests = true;
  if (id === 'mq1') { P.story.olly = true; setTimeout(() => { if (P) hint('Your quest book (J, or the book button) always shows what to do next.', 8); }, 2600); }
  setupWorld(); changed(); G.save();
  const who = P;
  if (q.next) setTimeout(() => { if (P === who) startQuest(q.next); }, 1500);
  if (q.light) setTimeout(() => { if (P === who) W.lightCrystal(true); }, 2200);
  if (q.after) q.after();
  if (q.end) setTimeout(() => { if (P === who) { if (q.chapter) { UI.banner(q.chapterTitle || 'Chapter 1 Complete!', q.chapterSub || 'The Garden Thieves · Chapter 2 begins!'); sfx.levelUp ? sfx.levelUp() : sfx.questDone(); } else UI.banner('To be continued...', 'Chapter 1 continues in a later update'); ollySay(q.endLine || 'Let us train hard. And open every treasure chest we can find!', 'happy', true); } }, 2200);
}
// stages that finish by themselves (no one to talk to) play their scene as soon as they are done
const sceneQueue = [];
function checkAuto() {
  if (!P) return;
  for (const id of ALL) {
    const st = stageOf(id);
    if (st && st.auto && stageReady(id) && !sceneQueue.some((x) => x.id === id && x.st === qs(id).st)) sceneQueue.push({ id, st: qs(id).st });
  }
}
function runQueue() {
  if (!sceneQueue.length || UI.talking || player.dead || G.traveling || (RW.comic && RW.comic.open)) return;
  const { id, st } = sceneQueue.shift();
  if (!active(id) || qs(id).st !== st) return;
  const stage = stageOf(id);
  playScene(stage.scene, () => advance(id));
}
function playScene(name, then, extraActs) {
  const lines = SCENES[name]();
  UI.say(lines, extraActs || [], { onDone: () => { G.endTalk(); if (then) then(); } });
}
function bye() { UI.hideDialog(); G.endTalk(); }

// ---------- talking to people ----------
function talk(n) {
  if (!P || !P.story.intro) return false;
  const shopAct = n.shop ? [{ label: 'Buy & sell', run: () => { UI.hideDialog(); UI.open('shopPanel'); } }] : [];
  for (const id of ALL) {
    const st = stageOf(id);
    if (st && st.to === n.id && stageReady(id)) { playScene(st.scene, () => advance(id)); return true; }
  }
  if (n.id === 'oakley' && active('mq1')) { playScene('mq1Remind', null, [{ label: 'On my way!', run: bye }]); return true; }
  for (const id of SIDE) if (QUESTS[id].giver === n.id && sideOpen(id)) {
    UI.say(SCENES[QUESTS[id].offer](), [
      { label: 'Accept', run: () => { bye(); startQuest(id); } },
      ...shopAct,
      { label: 'Not now', soft: true, run: bye }
    ]);
    return true;
  }
  for (const id of ALL) {
    const st = stageOf(id);
    if (st && st.to === n.id && st.remind) { playScene(st.remind, null, [...shopAct, { label: 'Goodbye', soft: true, run: bye }]); return true; }
  }
  return false;
}
function markerFor(npcId) {
  if (!P || !P.story.intro) return '';
  for (const id of ALL) { const st = stageOf(id); if (st && st.to === npcId && stageReady(id)) return '?'; }
  if (npcId === 'oakley' && active('mq1')) return '';
  for (const id of SIDE) if (QUESTS[id].giver === npcId && sideOpen(id)) return '!';
  { const st = stageOf('jq1'); if (st && st.goal.some((o, i) => o.t === 'meet' && o.who === npcId && objCount('jq1', i) < o.need)) return '!'; }
  for (const id of ALL) { const st = stageOf(id); if (st && st.to === npcId) return 'prog'; }
  return '';
}

// ---------- dialog faces: render each speaker's 3D head once per expression ----------
const portraitCache = new Map(), pModels = {};
let pScene = null, pCam = null, pRT = null;
const PSIZE = 192;
function portraitModel(who) {
  if (pModels[who]) return pModels[who];
  let m = null;
  if (who === 'olly') { const o = RW.olly(); o.shadow.visible = false; m = { root: o.root, setFace: o.setFace, look: V3(0, 0.6, 0), dist: 1.75, bg: 0xd6e6f2 }; }
  else if (who === 'king') {
    const k = RW.MONSTER_BUILD.king_leaflet(), map = { normal: 'normal', happy: 'normal', hurt: 'hurt', worried: 'hurt', angry: 'angry', surprised: 'dizzy' };
    m = { root: k.root, setFace: (e) => { k.mat.map = k.faces[map[e] || 'normal']; k.mat.needsUpdate = true; }, look: V3(0, 0.82, 0), dist: 3.7, bg: 0xf3ecc8 };
  }
  else if (RW.NPC_LOOKS[who]) {
    const c = RW.chibi(RW.NPC_LOOKS[who]), sz = c.opts.size || 1;
    m = { root: c.root, setFace: (e) => { if (c.j.faceMat) { c.j.faceMat.map = RW.faceVariant(c.opts, e); c.j.faceMat.needsUpdate = true; } }, look: V3(0, 1.29 * sz, 0), dist: 1.45 * sz, bg: { oakley: 0xdfe8cf, mira: 0xf7dfe4, bolt: 0xe6ded2, pip: 0xd8efe8, tobin: 0xe3ecf5, fennick: 0xd5e6cf, marla: 0xf3e2d6, ivy: 0xe2efda, zara: 0xf3dcd6 }[who] || 0xcfe9f7 };
  }
  pModels[who] = m; return m;
}
function renderPortrait(who, face) {
  const m = portraitModel(who); if (!m) return null;
  if (!pScene) {
    pScene = new THREE.Scene(); pScene.fog = new THREE.Fog(0xffffff, 60, 175);
    pScene.add(new THREE.HemisphereLight(0xfff3dc, 0xb3a184, 0.74));
    const sun = new THREE.DirectionalLight(0xfff0d4, 0.55); sun.position.copy(RW.SUN_DIR).multiplyScalar(100); pScene.add(sun);
    pCam = new THREE.PerspectiveCamera(24, 1, 0.05, 50);
    pRT = new THREE.WebGLRenderTarget(PSIZE * 2, PSIZE * 2);
  }
  pScene.background = new THREE.Color(m.bg);
  pScene.add(m.root); m.setFace(face); m.root.rotation.y = -0.28; m.root.updateMatrixWorld(true);
  pCam.position.set(m.look.x + 0.1, m.look.y + 0.06, m.look.z + m.dist); pCam.lookAt(m.look); pCam.updateProjectionMatrix();
  const N = PSIZE * 2, buf = new Uint8Array(N * N * 4);
  renderer.setRenderTarget(pRT); renderer.render(pScene, pCam);
  renderer.readRenderTargetPixels(pRT, 0, 0, N, N, buf); renderer.setRenderTarget(null);
  pScene.remove(m.root);
  const big = document.createElement('canvas'); big.width = big.height = N;
  const g = big.getContext('2d'), img = g.createImageData(N, N);
  for (let y = 0; y < N; y++) img.data.set(buf.subarray((N - 1 - y) * N * 4, (N - y) * N * 4), y * N * 4);
  g.putImageData(img, 0, 0);
  const out = document.createElement('canvas'); out.width = out.height = PSIZE;
  const o = out.getContext('2d'); o.imageSmoothingQuality = 'high'; o.drawImage(big, 0, 0, PSIZE, PSIZE);
  return out.toDataURL('image/png');
}
RW.portraits = {
  get(who, face) {
    const key = who + '|' + (face || 'normal');
    if (portraitCache.has(key)) return portraitCache.get(key);
    let url = null; try { url = renderPortrait(who, face || 'normal'); } catch (e) { url = null; }
    portraitCache.set(key, url); return url;
  }
};
// warm the cache a little at a time so the first conversation does not stutter
const warmList = [];
for (const who of ['olly', 'oakley', 'mira', 'bolt', 'pip', 'tobin', 'fennick', 'marla', 'ivy', 'zara']) for (const f of ['normal', 'happy', 'surprised', 'worried']) warmList.push([who, f]);

// the person speaking also shows the expression on their 3D face
function onLine(ln) {
  for (const n of G.npcs) G.npcFace(n, ln && ln.who === n.id ? (ln.face || 'normal') : 'normal');
  if (olly.m) setOllyFace(ln && ln.who === 'olly' ? (ln.face || 'normal') : olly.state === 'stuck' ? 'worried' : 'normal', ln ? 999 : 9999);
}

// ---------- Olly ----------
const olly = { m: null, state: 'hidden', pos: V3(0, 0, 0), perched: false, still: 0, t: 0, face: 'normal', faceT: 0, bubble: null, bubbleT: 0, sayCd: 0, idleT: rnd(60, 90), spin: 0, helpT: 0 };
const OS = 0.62; // Olly's size
function ollyModel() {
  if (olly.m) return olly.m;
  olly.m = RW.olly(); olly.m.root.scale.setScalar(OS); olly.m.root.visible = false; scene.add(olly.m.root);
  olly.bubble = G.lbl('<div class="bub"></div>'); olly.bubble.style.display = 'none';
  return olly.m;
}
function setOllyFace(f, dur) { if (!olly.m) return; olly.face = f; olly.faceT = dur || 2.5; olly.m.setFace(f); }
function ollySay(text, face, force) {
  if (!P || !olly.m || olly.state === 'hidden') return;
  if (!force && (olly.sayCd > 0 || UI.talking)) return;
  // no white speech bubble over Olly (user asked): small chatter stays quiet, useful tips show as a toast
  olly.sayCd = 25;
  if (force) UI.toast('<b>Olly:</b> ' + G.esc(text));
  if (face) setOllyFace(face, 3);
  for (let i = 0; i < Math.min(6, Math.ceil(text.length / 8)); i++) setTimeout(() => sfx.talk(980), i * 70);
}
const tmpH = V3(0, 0, 0), tgt = V3(0, 0, 0);
function updateOlly(dt, time) {
  if (!olly.m || olly.state === 'hidden') return;
  const m = olly.m, root = m.root; olly.t += dt;
  olly.sayCd = Math.max(0, olly.sayCd - dt);
  if (olly.faceT > 0) { olly.faceT -= dt; if (olly.faceT <= 0 && olly.face !== 'normal') { olly.face = 'normal'; m.setFace('normal'); } }
  let flapping = true, sit = false;
  if (olly.state === 'stuck') {
    const b = W.OLLY_BUSH, gy = W.height(b.x, b.z);
    tgt.set(b.x + 0.95, gy + 0.35 + Math.abs(Math.sin(olly.t * 7)) * 0.08, b.z + 0.75);
    olly.pos.copy(tgt); root.rotation.set(0.25 + Math.sin(olly.t * 9) * 0.12, 0.6, Math.sin(olly.t * 6) * 0.15);
    olly.helpT -= dt;
    if (olly.helpT <= 0 && Math.hypot(player.pos.x - b.x, player.pos.z - b.z) < 32 && !UI.talking) { olly.helpT = 7; sfx.hoot(); }
  } else {
    const fighting = player.target || player.action;
    const moving = player.dest || player.pickTarget || player.npcTarget || player.spotTarget || (player.target && !player.action);
    olly.still = moving || fighting || player.dead ? 0 : olly.still + dt;
    const perch = !player.dead && (player.sitting || olly.still > 1.1);
    const f = player.face;
    if (perch) {
      G.heroHead(tmpH);
      tgt.set(tmpH.x - Math.sin(f) * 0.03, tmpH.y + 0.12, tmpH.z - Math.cos(f) * 0.03);
    } else {
      const side = fighting ? 1.5 : 0.8, back = fighting ? 1.2 : 0.7, up = fighting ? 2.5 : 1.95;
      tgt.set(player.pos.x + Math.cos(f) * side - Math.sin(f) * back, player.pos.y + up + Math.sin(olly.t * 2.2) * 0.12, player.pos.z - Math.sin(f) * side - Math.cos(f) * back);
    }
    const far = olly.pos.distanceTo(tgt);
    if (far > 30) olly.pos.copy(tgt);
    const k = perch && far < 0.6 ? 14 : 4.2;
    olly.pos.lerp(tgt, 1 - Math.exp(-dt * k));
    olly.perched = perch && olly.pos.distanceTo(tgt) < 0.08;
    flapping = !olly.perched; sit = olly.perched;
    const dx = tgt.x - root.position.x, dz = tgt.z - root.position.z, speed = Math.hypot(dx, dz) / Math.max(dt, 0.001);
    const want = olly.perched ? f : speed > 0.6 ? Math.atan2(dx, dz) : f;
    root.rotation.y += wrapAngle(want - root.rotation.y) * Math.min(1, dt * 6);
    root.rotation.x = olly.perched ? 0 : clamp(speed * 0.02, 0, 0.35);
    root.rotation.z = 0;
    if (olly.spin > 0) { olly.spin = Math.max(0, olly.spin - dt); root.rotation.y += (1 - olly.spin / 1) * Math.PI * 4 * dt * 4; }
    if (!olly.perched && olly.idleT > 0 && !fighting) { olly.idleT -= dt; if (olly.idleT <= 0) { olly.idleT = rnd(80, 120); ollyIdleLine(); } }
  }
  root.position.copy(olly.pos);
  m.body.position.y = 0.55 + (sit ? 0 : Math.sin(olly.t * 2.2) * 0.04);
  for (const w of m.wings) w.pivot.rotation.z = w.s * (flapping ? 0.35 + Math.sin(olly.t * (olly.state === 'stuck' ? 22 : 16)) * 0.75 : 0.05 + Math.sin(olly.t * 1.5) * 0.04);
  for (const tl of m.tails) tl.piv.rotation.z = tl.rz + Math.sin(olly.t * 5 + tl.rz * 4) * (flapping ? 0.25 : 0.06);
  const gy = W.height(olly.pos.x, olly.pos.z);
  m.shadow.visible = !sit; m.shadow.position.y = (gy - olly.pos.y) / OS + 0.04;
  if (olly.bubbleT > 0) {
    olly.bubbleT -= dt;
    if (olly.bubbleT <= 0 || UI.talking) { olly.bubbleT = 0; olly.bubble.style.display = 'none'; }
    else { tmpH.set(olly.pos.x, olly.pos.y + 0.95, olly.pos.z); G.place(olly.bubble, tmpH, 0); }
  }
}
const IDLE_LINES = [
  'Did you know owls can turn their heads all the way around? I can do three quarters. On a good day.',
  'Fun fact: Leaflets are 70% jelly and 30% bad manners.',
  'Russel once defeated a dragon with a spoon. Or was it a spoon with a dragon? Something like that.',
  'If you sit down, I get to sit on your head. Just saying.',
  'Fun fact: the moon is made of very old cheese. I read it somewhere. I think.',
  'I am not lost. I always know exactly where we are. Roughly.',
  'Your stick is lovely. Very... stick-like.',
  'Tip: the quest book (J) remembers everything. Almost as well as I do.'
];
function ollyIdleLine() { ollySay(IDLE_LINES[Math.floor(rnd(0, IDLE_LINES.length))], Math.random() < 0.5 ? 'happy' : 'normal'); }
function showOlly(state) {
  ollyModel(); const was = olly.state; olly.state = state; olly.m.root.visible = state !== 'hidden';
  if (state === 'follow') { if (was !== 'stuck') olly.pos.set(player.pos.x + 1, player.pos.y + 2, player.pos.z + 1); setOllyFace('happy', 2); }
  if (state === 'stuck') setOllyFace('worried', 9999);
  if (state === 'hidden' && olly.bubble) olly.bubble.style.display = 'none';
}

// ---------- the world for each quest: Olly's bush, story Leaflets, the hammer, the trail ----------
let beacon = null;
function makeBeacon() {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.15, 40), new THREE.MeshBasicMaterial({ color: 0xffd84d, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.08; g.add(ring);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.9, 9, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff1a8, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  beam.position.y = 4.5; g.add(beam);
  g.userData = { ring, beam }; scene.add(g); g.visible = false; return g;
}
const trailDrops = new THREE.Group(); scene.add(trailDrops); trailDrops.visible = false;
{
  const mat = new THREE.MeshBasicMaterial({ color: 0xffc34d, transparent: true, opacity: 0.9 });
  for (let i = 0; i < PLACES.trail.length; i++) {
    const a = i === 0 ? { x: W.GARDEN.x, z: W.GARDEN.z - 10 } : PLACES.trail[i - 1], b = PLACES.trail[i];
    for (let k = 1; k <= 8; k++) {
      const u = k / 9, x = lerp(a.x, b.x, u) + Math.sin(k * 2.1 + i) * 1.2, z = lerp(a.z, b.z, u);
      const d = new THREE.Mesh(RW.geoSphere(0.12, 8, 6), mat); d.scale.set(1, 0.35, 1); d.position.set(x, W.height(x, z) + 0.06, z); d.userData.seg = i; trailDrops.add(d);
    }
  }
}
let storyMobs = [];
function spawnOllyMobs(n) {
  const b = W.OLLY_BUSH;
  for (let i = 0; i < n; i++) {
    const a = 0.4 + i * 1.9, r = 2.8;
    const p = walkableNear(b.x + Math.cos(a) * r, b.z + Math.sin(a) * r);
    const m = G.spawnMonster('leaflet', 1, p.x, p.z); m.quest = 'olly'; m.home.set(b.x + 1.2, 0, b.z + 1); storyMobs.push(m);
  }
}
function clearStoryMobs() { for (const m of storyMobs) if (!m.gone) G.removeMonster(m); storyMobs = []; }
let hammerSpot = null, boardSpot = null, crystalSpot = null, pileSpot = null;
const kiteSpots = [];
// glowing wisps that lead from Fennick's tree to the stash: the next one shines brightest
const wisps = new THREE.Group(); scene.add(wisps); wisps.visible = false;
for (const p of PLACES.wisps) {
  const g = RW.glow(2.2); g.material = g.material.clone(); g.material.color = new THREE.Color(0xc8ffe8); g.material.opacity = 0.9;
  const core = new THREE.Mesh(RW.geoSphere(0.14, 10, 8), new THREE.MeshBasicMaterial({ color: 0xf2fff8 }));
  const w = new THREE.Group(); w.add(g, core); w.userData.base = W.height(p.x, p.z) + 1.4; w.position.set(p.x, w.userData.base, p.z); wisps.add(w);
}
function setupWorld() {
  if (!P) return;
  // Olly
  if (P.story.olly) { if (olly.state !== 'follow') showOlly('follow'); }
  else if (active('mq1')) { if (olly.state !== 'stuck') showOlly('stuck'); }
  else showOlly('hidden');
  // the Leaflets bothering Olly
  const s1 = qs('mq1');
  if (s1 && !s1.done && s1.st === 1) { const left = 3 - (s1.prog[0] || 0) - storyMobs.filter((m) => !m.gone && m.alive).length; if (left > 0 && W.active === 'meadow') spawnOllyMobs(left); }
  else if (storyMobs.length) clearStoryMobs();
  // Bolt's hammer by the pond
  const hs = stageOf('sq_hammer');
  const needHammer = hs && objCount('sq_hammer', 0) < 1;
  if (needHammer && !hammerSpot) {
    const model = RW.dropModel('bolt_hammer'); model.scale.setScalar(1.6);
    const wrap = new THREE.Group(); model.position.y = 0.35; wrap.add(model);
    hammerSpot = G.addSpot({ id: 'hammer', x: PLACES.hammer.x, z: PLACES.hammer.z, label: 'Something shiny', model: wrap, range: 1.8, tagY: 1.2, far: 30, onUse: () => {
      const q = qs('sq_hammer'); if (!q || q.done) return;
      q.prog[0] = 1; sfx.sparkle(); UI.toast('Found: <b>' + esc(ITEMS.bolt_hammer.name) + '</b>'); G.removeSpot('hammer'); hammerSpot = null;
      ollySay('A hammer! Bolt will be over the moon. Which is made of cheese, by the way.', 'happy', true); changed(); G.save();
    } });
    hammerSpot.spin = model;
  } else if (!needHammer && hammerSpot) { G.removeSpot('hammer'); hammerSpot = null; }
  // the trail
  trailDrops.visible = active('mq5');
  // the Sun Crystal at the windmill
  const s10 = qs('mq10'), wantCrystal = s10 && !s10.done && s10.st === 1 && objCount('mq10', 0) < 1;
  if (wantCrystal && !crystalSpot) crystalSpot = G.addSpot({ id: 'crystal', x: PLACES.crystal.x, z: PLACES.crystal.z, label: 'Sun Crystal', range: 2.6, y: 1.4, tagY: 2.7, far: 30, onUse: () => {
    const q = qs('mq10'); if (!q || q.done || q.st !== 1) return;
    q.prog[0] = 1; sfx.sparkle(); G.removeSpot('crystal'); crystalSpot = null; changed(); checkAuto(); G.save();
  } });
  else if (!wantCrystal && crystalSpot) { G.removeSpot('crystal'); crystalSpot = null; }
  // Tobin's kites stuck in the trees
  const ks = stageOf('sq_kites'), got = qs('sq_kites') ? (qs('sq_kites').found || []) : [];
  PLACES.kites.forEach((k, i) => {
    const want = !!ks && objCount('sq_kites', 0) < 4 && !got.includes(i), sid = 'kite' + i;
    if (want && !kiteSpots[i]) {
      const model = new THREE.Group(), kite = RW.dropModel('tobin_kite'); kite.scale.setScalar(2.4); kite.position.set(0.6, 4.2, 0.4); kite.rotation.set(0.3, 0.5, 0.7); model.add(kite);
      kiteSpots[i] = G.addSpot({ id: sid, x: k.x + 1.6, z: k.z + 1.2, label: "Tobin's kite", model, range: 2.6, y: 3, tagY: 5.6, far: 40, onUse: () => {
        const q = qs('sq_kites'); if (!q || q.done) return;
        q.found = (q.found || []).concat([i]); q.prog[0] = q.found.length; sfx.sparkle();
        UI.toast('Got a kite back! ' + q.found.length + '/4'); G.removeSpot(sid); kiteSpots[i] = null;
        if (q.found.length === 1) ollySay('A kite! Gently... gently... got it. Tobin will be so happy.', 'happy', true);
        changed(); G.save();
      } });
    } else if (!want && kiteSpots[i]) { G.removeSpot(sid); kiteSpots[i] = null; }
  });
  // the wisps in Whisperwood
  wisps.visible = active('mq12');
  // the Leaflet stash: guards, and the heap of Sunberries
  const s13 = qs('mq13'), stashOn = s13 && !s13.done;
  W.stashPile(active('mq12') || (!!stashOn && objCount('mq13', 1) < 1));
  if (stashOn) {
    const left = 5 - (s13.prog[0] || 0) - stashMobs.filter((m) => !m.gone && m.alive).length;
    if (left > 0 && W.active === 'wood') spawnStashMobs(left);
    const needPile = objCount('mq13', 1) < 1;
    if (needPile && !pileSpot) pileSpot = G.addSpot({ id: 'stashPile', x: PLACES.stash.x + 1.6, z: PLACES.stash.z + 1.6, label: 'Stolen Sunberries', range: 2.8, y: 0.8, tagY: 2.2, far: 34, onUse: () => {
      const q = qs('mq13'); if (!q || q.done) return;
      if ((q.prog[0] || 0) < 5) { ollySay('The guards first! They will not let us near the berries.', 'worried', true); sfx.deny(); return; }
      q.prog[1] = 1; sfx.sparkle(); UI.toast('+24 Sunberries for Mossbrook'); G.removeSpot('stashPile'); pileSpot = null; W.stashPile(false); changed(); checkAuto(); G.save();
    } });
    else if (!needPile && pileSpot) { G.removeSpot('stashPile'); pileSpot = null; }
  } else { if (pileSpot) { G.removeSpot('stashPile'); pileSpot = null; } if (stashMobs.length) clearStashMobs(); }
  W.lightCrystal(!!(qs('mq14') && qs('mq14').done));
  changed();
  checkAuto();
}
// the Leaflets guarding the stash
let stashMobs = [];
function spawnStashMobs(n) {
  const S = PLACES.stash;
  for (let i = 0; i < n; i++) {
    const a = i * 1.3 + 0.4, r = 4 + (i % 2) * 2.5, p = walkableNear(S.x + Math.cos(a) * r, S.z + Math.sin(a) * r);
    const m = G.spawnMonster(i % 2 ? 'breeze_leaflet' : 'leaflet', i % 2 ? 5 : 6, p.x, p.z); m.quest = 'stash'; m.home.set(S.x, 0, S.z + 2); stashMobs.push(m);
  }
}
function clearStashMobs() { for (const m of stashMobs) if (!m.gone) G.removeMonster(m); stashMobs = []; }
// where the quest wants you to go (for the beacon and the minimap star)
function targets() {
  const out = [];
  if (!P) return out;
  const npcAt = (id) => { const n = G.npcs.find((x) => x.id === id); return n ? { x: n.x, z: n.z } : null; };
  const nearest = (list) => { const here = list.filter((c) => W.mapAt(c.x, c.z) === W.active), from = here.length ? here : list; let best = from[0], bd = 1e9; for (const c of from) { const d = Math.hypot(c.x - player.pos.x, c.z - player.pos.z); if (d < bd) { bd = d; best = c; } } return best; };
  for (const id of ALL) {
    const st = stageOf(id); if (!st) continue;
    const ready = stageReady(id), main = QUESTS[id].kind === 'main';
    if (st.to && (ready || !st.goal.length)) { const p = npcAt(st.to); if (p) out.push({ x: p.x, z: p.z, main, color: main ? '#ffd84d' : '#ffe9a8' }); continue; }
    st.goal.forEach((o, i) => {
      if (objCount(id, i) >= o.need) return;
      const col = main ? null : '#ffe9a8';
      if (o.t === 'reach') out.push({ x: PLACES[o.at].x, z: PLACES[o.at].z, main, beacon: true, color: col });
      else if (o.t === 'kill' && o.tag === 'olly') out.push({ x: W.OLLY_BUSH.x, z: W.OLLY_BUSH.z, main });
      else if (o.t === 'kill' && o.tag === 'stash') out.push({ x: PLACES.stash.x, z: PLACES.stash.z, main });
      else if (o.t === 'kill' && o.kind) { const best = o.kind === 'mushling' ? nearest(MUSH_CAMPS) : nearest(campsOf(o.kind)); if (best) out.push({ x: best.x, z: best.z, main, color: col }); }
      else if (o.t === 'trail') { const p = PLACES[o.path || 'trail'][objCount(id, i)]; out.push({ x: p.x, z: p.z, main, beacon: true }); }
      else if (o.t === 'find') { const p = o.at ? PLACES[o.at] : PLACES.hammer; out.push({ x: p.x, z: p.z, main, color: col || '#ffe9a8', beacon: !!o.at }); }
      else if (o.t === 'meet') { const p = npcAt(o.who); if (p) out.push({ x: p.x, z: p.z, main: false, color: '#ffb47a' }); }
      else if (o.t === 'kites') { const got = qs(id).found || []; const left = PLACES.kites.filter((k, j) => !got.includes(j)); if (left.length) { const k = nearest(left); out.push({ x: k.x, z: k.z, main, color: '#ffe9a8' }); } }
    });
  }
  if (P.story.requests && boardSpot && boardSpot.qm.textContent) out.push({ x: W.BOARD.x, z: W.BOARD.z, color: '#7cc4ff' });
  for (const t of out) t.map = W.mapAt(t.x, t.z);
  return out;
}

// ---------- daily jobs on the notice board ----------
const DAILY = {
  leaflets: { text: (n) => 'Defeat ' + n + ' Leaflets', ns: [6, 8, 10] },
  mushlings: { text: (n) => 'Defeat ' + n + ' Mushlings', ns: [3, 4, 5], minLv: 3 },
  boars: { text: (n) => 'Defeat ' + n + ' Bristleboars in Breezy Hills', ns: [3, 4, 5], minLv: 4 },
  thornhogs: { text: (n) => 'Defeat ' + n + ' Thornhogs in Whisperwood', ns: [3, 4], minLv: 6 },
  frogs: { text: (n) => 'Defeat ' + n + ' Plopfrogs or Rockpinches at Riverside', ns: [4, 5, 6], minLv: 6 },
  bees: { text: (n) => 'Defeat ' + n + ' Bramblebees or Bushlings in Thornbush', ns: [3, 4, 5], minLv: 8 },
  rootlings: { text: (n) => 'Defeat ' + n + ' Rootlings in the burrow', ns: [5, 6], minLv: 5 },
  jelly: { text: (n) => 'Pick up ' + n + ' Leaf Jelly', ns: [4, 6] },
  // v1.5: monsters no longer drop coins, so this job is now about picking up loot (key kept for old saves)
  coins: { text: (n) => 'Pick up ' + n + ' items dropped by monsters', ns: [5, 8, 10] },
  rest: { text: (n) => 'Sit and rest for ' + n + ' seconds', ns: [30] },
  pebble: { text: (n) => 'Use Pebble Toss ' + n + ' times', ns: [4, 6] },
  sell: { text: (n) => 'Sell ' + n + ' things to Mira', ns: [3, 5] },
  // v1.5 (user's choice): jobs follow the hero's level — defeat a monster near your level in a place you have been
  hunt: { text: (n, j) => { const K = RW.KINDS[j && j.kind] || {}, A = RW.AREAS[K.area]; return RW.T('Defeat ' + n + ' ' + (K.name || '?') + (A ? ' in ' + A.name : ''), 'Kalahkan ' + n + ' ' + (K.name || '?') + (A ? ' di ' + A.name : '')); }, ns: [5, 6, 8] }
};
// only these two kinds are rolled now; the old ones stay so older saves can still show their list
const DAILY_ROLL = ['hunt', 'coins'];
DAILY.coins.text = (n) => RW.T('Pick up ' + n + ' items dropped by monsters', 'Ambil ' + n + ' barang jatuhan monster');
const dailyText = (j) => DAILY[j.k].text(j.need, j);
// monsters for hunt jobs: not bosses or training targets, living in a map the hero has visited, level close to the hero's
function huntPool() {
  const seen = (P && P.visited) || {}, lv = P.lv;
  const KINDS = RW.KINDS, ok = Object.keys(KINDS).filter((k) => { const K = KINDS[k]; return K.area && seen[K.area] && !K.boss && !K.target && K.drops && RW.AREAS[K.area] && !/cave|palace|tower/.test(K.area); });
  // the closest levels win (never more than 2 above the hero); at least 4 to choose from
  const fit = ok.filter((k) => (KINDS[k].baseLv || 1) <= lv + 2).sort((a, b) => Math.abs((KINDS[a].baseLv || 1) - lv) - Math.abs((KINDS[b].baseLv || 1) - lv));
  if (!fit.length) return ['leaflet'];
  const within = fit.filter((k) => Math.abs((KINDS[k].baseLv || 1) - lv) <= 3).length;
  return fit.slice(0, Math.max(4, within));
}
function todayKey() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rollDaily() {
  const key = todayKey(); let h = hashStr(key + P.name);
  const rr = () => { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; h = (h + 0x6d2b79f5) >>> 0; return (h % 10000) / 10000; };
  // two hunts (two different monsters) and one loot job
  const pool = huntPool().slice(), list = [];
  for (let i = 0; i < 2 && pool.length; i++) { const kind = pool.splice(Math.floor(rr() * pool.length), 1)[0], ns = DAILY.hunt.ns; list.push({ k: 'hunt', kind, need: ns[Math.floor(rr() * ns.length)], prog: 0, done: false }); }
  const cn = DAILY.coins.ns; list.push({ k: 'coins', need: cn[Math.floor(rr() * cn.length)], prog: 0, done: false });
  P.daily = { day: key, taken: false, list, bonus: false };
}
function dailyFresh() { if (!P.daily || P.daily.day !== todayKey()) rollDaily(); return P.daily; }
function dailyProgress(kind, amount, sub) {
  const d = P && P.daily; if (!d || !d.taken || d.day !== todayKey()) return;
  for (const j of d.list) {
    if (j.k !== kind || j.done) continue;
    if (kind === 'hunt' && j.kind !== sub) continue;
    if (j.k === 'coins' && j.need > 10) j.need = 8; // old saves: the coin job had 40-80

    j.prog = Math.min(j.need, j.prog + amount);
    if (j.prog >= j.need) {
      j.done = true;
      const coins = 20 + 5 * P.lv, exp = Math.round(expNeed(P.lv) * 0.08);
      sfx.questDone(); UI.toast('Daily job done: ' + esc(dailyText(j)) + ' · +' + exp + ' EXP, +' + coins + ' coins');
      G.addCoins(coins); G.gainExp(exp);
      if (d.list.every((x) => x.done) && !d.bonus) { d.bonus = true; setTimeout(() => { if (!P) return; UI.toast('All 3 daily jobs done! Bonus: Red Potion (M), 40 coins', true); G.bagAdd('red_m', 1); G.addCoins(40); ollySay('All three! The whole board is cheering. Well, the paper is.', 'happy', true); }, 1200); }
      G.save();
    }
    changed();
  }
}
function useBoard() {
  if (!P) return;
  sfx.click();
  if (!P.story.requests) { UI.say([{ who: 'board', text: 'Every notice is about the garden raids. "Brave helpers, please see Elder Oakley first."' }], [{ label: 'OK', run: bye }]); return; }
  const d = dailyFresh(), lines = d.list.map((j) => '• ' + dailyText(j) + (d.taken ? (j.done ? '  ✓' : '  (' + j.prog + '/' + j.need + ')') : '')).join('\n');
  if (!d.taken) {
    UI.say([{ who: 'board', text: "Today's jobs from the villagers:\n" + lines }], [
      { label: 'Take all three', run: () => { d.taken = true; bye(); sfx.questNew(); UI.toast('Daily jobs taken. Check your quest book (J).'); changed(); G.save(); } },
      { label: 'Later', soft: true, run: bye }
    ]);
  } else if (d.list.every((j) => j.done)) UI.say([{ who: 'board', text: 'All done for today. New jobs appear tomorrow.\n' + lines }], [{ label: 'OK', run: bye }]);
  else UI.say([{ who: 'board', text: "Today's jobs:\n" + lines }], [{ label: 'OK', run: bye }]);
}

// ---------- hints for the first few minutes ----------
let hintT = 0;
function hint(text, dur) { const h = $('hint'); h.textContent = text; h.classList.add('on'); hintT = dur || 6; }
function hideHint() { $('hint').classList.remove('on'); hintT = 0; }

// ---------- quest tracker and book ----------
function trackRow(id) {
  const q = QUESTS[id], st = stageOf(id);
  let body = '';
  if (st.to && stageReady(id)) body = '<span class="ready">' + (st.goal.length ? 'Return to ' : '') + esc(st.goal.length ? NAMES[st.to] : st.text) + '</span>';
  else if (!st.goal.length) body = '<span class="ob">' + esc(st.text) + '</span>';
  else body = st.goal.map((o, i) => { const c = objCount(id, i), ok = c >= o.need; return '<span class="ob' + (ok ? ' done' : '') + '">' + esc(o.text) + (o.need > 1 ? ' ' + c + '/' + o.need : '') + (ok ? ' ✓' : '') + '</span>'; }).join('');
  return '<div class="tq ' + q.kind + '"><b>' + esc(q.title) + '</b>' + body + '</div>';
}
function renderTracker() {
  const el = $('trackerList'), box = $('tracker');
  if (!P || !P.story.intro) { box.hidden = true; return; }
  const rows = []; let left = 0;
  for (const list of [MAIN, JOBQ, SIDE]) for (const id of list) if (active(id)) { rows.push(trackRow(id)); if (!stageReady(id)) left++; }
  const d = P.daily;
  if (d && d.taken && d.day === todayKey() && d.list.some((j) => !j.done)) { left++; rows.push('<div class="tq daily"><b>Daily jobs</b>' + d.list.map((j) => '<span class="ob' + (j.done ? ' done' : '') + '">' + esc(dailyText(j)) + ' ' + j.prog + '/' + j.need + (j.done ? ' ✓' : '') + '</span>').join('') + '</div>'); }
  // v1.6: the tracker folds up into one line "Quest (not finished / total)"; the ▲▼ button opens and closes it
  const min = !!P.trackMin;
  el.innerHTML = '<div class="trhead"><b>Quest (' + left + '/' + rows.length + ')</b><button class="trfold" data-fold aria-label="' + (min ? 'Show quests' : 'Hide quests') + '">' + (min ? '▼' : '▲') + '</button></div>' + (min ? '' : rows.slice(0, 4).join(''));
  box.classList.toggle('min', min);
  box.hidden = !rows.length;
  const avail = SIDE.some((id) => sideOpen(id));
  $('qBadge').hidden = !avail;
}
$('tracker').addEventListener('click', (e) => {
  if (!e.target.closest('[data-fold]') || !P) return;
  e.stopPropagation(); P.trackMin = !P.trackMin; G.dirty = true; renderTracker();
}, true);
function questCard(id) {
  const q = QUESTS[id], st = stageOf(id), r = q.reward || {};
  let objs = '';
  if (st) {
    const items = st.goal.map((o, i) => { const c = objCount(id, i), ok = c >= o.need; return '<li class="' + (ok ? 'done' : '') + '">' + esc(o.text) + (o.need > 1 ? ' (' + c + '/' + o.need + ')' : '') + (ok ? ' ✓' : '') + '</li>'; });
    if (st.to && (stageReady(id) || !st.goal.length)) items.push('<li>' + esc(st.goal.length ? 'Return to ' + NAMES[st.to] : st.text) + '</li>');
    objs = '<ul>' + items.join('') + '</ul>';
  }
  return '<div class="qcard ' + q.kind + '"><h4>' + esc(q.title) + (q.giver ? '<small>' + esc(NAMES[q.giver]) + '</small>' : '') + '</h4><p>' + esc(q.desc) + '</p>' + objs + '<div class="qrew">Reward: ' + esc(rewardText(r)) + '</div></div>';
}
function renderJournal() {
  const body = $('questBody'); if (!P) { body.innerHTML = ''; return; }
  let html = '<h3>Story · Chapter 1</h3>';
  const cur = MAIN.find((id) => active(id));
  const doneMain = MAIN.filter((id) => qs(id) && qs(id).done).length;
  if (cur) html += questCard(cur);
  else if (doneMain === MAIN.length) html += '<p class="qempty">The King of all Leaflets is gathering sunshine somewhere far away. Chapter 1 continues in a later update. Until then: train, fill your monster book and find every treasure chest.</p>';
  else html += '<p class="qempty">Your story begins in Mossbrook.</p>';
  if (doneMain) html += '<p class="qempty">Finished: ' + MAIN.filter((id) => qs(id) && qs(id).done).map((id) => esc(QUESTS[id].title)).join(' · ') + '</p>';
  if (qs('jq1')) { html += '<h3>Your job</h3>'; html += active('jq1') ? questCard('jq1') : '<p class="qempty">You are a ' + esc(RW.JOBS[P.job] ? RW.JOBS[P.job].name : 'Novice') + '. Spend skill points in the stats window (C).</p>'; }
  html += '<h3>Villagers\' requests</h3>';
  const act = SIDE.filter((id) => active(id)), open = SIDE.filter((id) => sideOpen(id)), fin = SIDE.filter((id) => qs(id) && qs(id).done);
  if (!P.story.requests) html += '<p class="qempty">Villagers will ask for help once you have met Elder Oakley.</p>';
  else {
    for (const id of act) html += questCard(id);
    const givers = [...new Set(open.map((id) => NAMES[QUESTS[id].giver]))];
    if (givers.length) html += '<p class="qempty">' + givers.map(esc).join(', ') + (givers.length > 1 ? ' have' : ' has') + ' something to ask you. Look for the yellow ! over their heads.</p>';
    if (!act.length && !open.length) html += '<p class="qempty">You have helped everyone for now. Thank you!</p>';
    if (fin.length) html += '<p class="qempty">Finished: ' + fin.map((id) => esc(QUESTS[id].title)).join(' · ') + '</p>';
  }
  html += '<h3>Daily jobs</h3>';
  const d = P.daily;
  if (!P.story.requests) html += '<p class="qempty">The notice board by the north gate opens after you meet Elder Oakley.</p>';
  else if (d && d.taken && d.day === todayKey()) html += '<div class="qcard"><ul>' + d.list.map((j) => '<li class="' + (j.done ? 'done' : '') + '">' + esc(dailyText(j)) + ' (' + j.prog + '/' + j.need + ')' + (j.done ? ' ✓' : '') + '</li>').join('') + '</ul><div class="qrew">Each job: coins and EXP. All three: a bonus Red Potion (M) and 40 coins. New jobs every day.</div></div>';
  else html += '<p class="qempty">Visit the notice board by the north gate for today\'s 3 jobs.</p>';
  body.innerHTML = html;
}
function refreshMarkers() {
  if (!P) return;
  for (const n of G.npcs) { const mk = markerFor(n.id); n.qm.textContent = mk === 'prog' ? '?' : mk; n.qm.classList.toggle('prog', mk === 'prog'); }
  if (boardSpot) { const d = P.story.requests ? dailyFresh() : null; boardSpot.qm.textContent = d && !d.taken ? '!' : ''; }
}

// ---------- events from the game ----------
RW.on('enter', (p) => {
  P = p; P.story = P.story || {}; P.quests = P.quests || {};
  if (!boardSpot) boardSpot = G.addSpot({ id: 'board', x: W.BOARD.x, z: W.BOARD.z, label: 'Notice board', range: 2.6, y: 1.4, tagY: 2.9, far: 30, onUse: useBoard });
  if (!P.story.intro) {
    showOlly('hidden');
    G.teleport(W.SPAWN.x, W.SPAWN.z, W.SPAWN.face);
    const begin = () => {
      if (P !== p) return;
      P.story.intro = true; P.story.tut = {};
      startQuest('mq1');
      hint('Tap the ground to walk. Follow the yellow star on your map to the garden past the north gate.', 14);
      G.save();
    };
    if (RW.comic) RW.comic.play(begin); else begin();
  } else {
    // a new chapter part arrived since the last visit: the next main quest starts by itself
    if (!MAIN.some((id) => active(id))) { const nx = MAIN.find((id) => !qs(id)); if (nx) { if (nx === 'mq7') setTimeout(() => { if (P === p && !qs('mq7')) { startQuest('mq7'); ollySay('Hoo! I heard Bolt hammering all night. Maybe the path to Breezy Hills is open!', 'surprised', true); } }, 2600); else startQuest(nx, true); } }
    setupWorld();
    setTimeout(() => { if (P === p) maybeJobQuest(true); }, 3200);
  }
  changed();
});
RW.on('leave', () => {
  showOlly('hidden'); clearStoryMobs();
  if (hammerSpot) { G.removeSpot('hammer'); hammerSpot = null; }
  if (crystalSpot) { G.removeSpot('crystal'); crystalSpot = null; }
  if (pileSpot) { G.removeSpot('stashPile'); pileSpot = null; }
  kiteSpots.forEach((s, i) => { if (s) { G.removeSpot('kite' + i); kiteSpots[i] = null; } });
  clearStashMobs(); W.stashPile(false); wisps.visible = false;
  if (beacon) beacon.visible = false; trailDrops.visible = false; sceneQueue.length = 0;
  hideHint(); for (const n of G.npcs) { n.qm.textContent = ''; G.npcFace(n, 'normal'); }
  P = null;
});
function progress(match, amount) {
  if (!P) return;
  for (const id of ALL) {
    const st = stageOf(id); if (!st) continue;
    st.goal.forEach((o, i) => { if (match(o) && (qs(id).prog[i] || 0) < o.need) { qs(id).prog[i] = Math.min(o.need, (qs(id).prog[i] || 0) + amount); if (qs(id).prog[i] >= o.need) sfx.step(); } });
  }
  changed(); checkAuto();
}
RW.on('kill', (m) => {
  if (!P) return;
  progress((o) => o.t === 'kill' && (o.tag ? m.quest === o.tag : o.kind === m.kind && !m.quest), 1);
  dailyProgress('hunt', 1, m.kind);
  dailyProgress({ leaflet: 'leaflets', breeze_leaflet: 'leaflets', mushling: 'mushlings', moss_mushling: 'mushlings', bristleboar: 'boars', thornhog: 'thornhogs', plopfrog: 'frogs', rockpinch: 'frogs', bramblebee: 'bees', bushling: 'bees', rootling: 'rootlings' }[m.kind], 1);
  if (m.golden) setTimeout(() => ollySay(['GOLDEN! You beat a golden one! I will tell everyone. Twice.', 'Look at all that shiny loot! I knew it, I just knew it.'][Math.floor(rnd(0, 2))], 'happy', true), 900);
  // Leaflets drop the Sunberries they stole while the garden quest is on
  // (berries already lying on the ground count towards the five, so the meadow is not flooded with them)
  const st = stageOf('mq3');
  if (st && m.kind === 'leaflet') {
    const got = objCount('mq3', 1) + G.items.filter((it) => it.id === 'sunberry').length, kills = objCount('mq3', 0);
    if (got < 5 && (Math.random() < 0.6 || kills >= 8)) G.dropItem('sunberry', 1, m.pos, 0.9);
  }
  if (P.story.tut && !P.story.tut.attack) { P.story.tut.attack = true; if ($('hint').classList.contains('on')) hideHint(); }
  if (P.story.tut && !P.story.tut.pick && olly.state === 'follow' && !P.story.tut.pickTold) { P.story.tut.pickTold = true; setTimeout(() => ollySay('Something dropped! Tap it to pick it up. Finders keepers!', 'surprised', true), 1100); }
});
RW.on('pickup', (id, n) => {
  if (!P) return;
  if (ITEMS[id] && ITEMS[id].kind === 'quest') { progress((o) => o.t === 'collect' && o.item === id, n); UI.toast('+' + n + ' ' + esc(ITEMS[id].name)); }
  if (id === 'leaf_jelly') dailyProgress('jelly', n);
  if (ITEMS[id] && ITEMS[id].kind !== 'quest') dailyProgress('coins', 1);
  if (P.story.tut && !P.story.tut.pick) P.story.tut.pick = true;
  changed();
});
RW.on('sell', (id, n) => { dailyProgress('sell', n); changed(); });
RW.on('skill', (id) => { if (id === 'pebble') dailyProgress('pebble', 1); });
RW.on('levelup', (lv) => { if (olly.state === 'follow') { olly.spin = 1; ollySay(['Hoo-ray! Level ' + lv + '! I taught you everything I know.', 'Level ' + lv + '! I knew it! Well, I hoped it.', 'LEVEL ' + lv + '! Somebody hold my scarf!'][lv % 3], 'happy', true); } changed(); });
RW.on('hurt', (pct) => { if (pct < 0.3 && olly.state === 'follow' && olly.sayCd <= 0) ollySay('Eek! Your HP is low! A red potion (key 5) would help!', 'worried', true); });
RW.on('revive', () => { if (olly.state === 'follow') { olly.pos.set(player.pos.x + 1, player.pos.y + 2, player.pos.z); ollySay('Oof. Home again. Let us rest a moment, then try again!', 'worried', true); } });
RW.on('zone', (z) => {
  if (olly.state !== 'follow') return;
  if (z === 'town') ollySay('Home sweet home. HP comes back fast in town.', 'happy');
  else if (z === 'meadow') ollySay(['Stay close. Leaflets bite. Well. They bump.', 'Out we go! I will keep watch. From up here.'][Math.floor(rnd(0, 2))], 'normal');
});
// arriving in a new area: Olly warns you if the monsters there are stronger than you
RW.on('map', (id) => {
  if (!P) return;
  setupWorld();
  if (olly.state !== 'follow') return;
  olly.pos.set(player.pos.x + 1, player.pos.y + 2, player.pos.z + 1);
  const A = RW.AREAS[id];
  if (A && P.lv < A.min) setTimeout(() => ollySay('Careful! Monsters here are Lv. ' + A.min + ' and up, and you are Lv. ' + P.lv + '. Maybe train a little first?', 'worried', true), 1400);
  else if (id === 'hills' && !P.story.sawHills) { P.story.sawHills = true; if (!active('mq8')) setTimeout(() => ollySay('Breezy Hills! Smell that wind. Hold on to your hat. I am holding on to my scarf.', 'happy', true), 1400); }
  else if (id === 'wood' && !P.story.sawWood) { P.story.sawWood = true; setTimeout(() => ollySay('Whisperwood... Listen. The trees really do whisper. Probably about me.', 'surprised', true), 1400); }
});
RW.on('golden', (m) => { if (olly.state === 'follow') ollySay('Hoo! Do you see it? A GOLDEN ' + m.k.name.toUpperCase() + '! Catch it before it wanders off!', 'surprised', true); });
RW.on('aggro', (m) => {
  if (!P || olly.state !== 'follow') return;
  if (m.kind === 'bristleboar' && !P.story.sawBoar) { P.story.sawBoar = true; ollySay('A Bristleboar! It is pawing the ground... it is going to CHARGE! Brace yourself!', 'worried', true); }
  else if (m.kind === 'thornhog' && !P.story.sawHog) { P.story.sawHog = true; ollySay('A Thornhog! Plain hits will prick you back. Use your skills or Pebble Toss!', 'worried', true); }
});
RW.on('thorns', () => { if (P && olly.state === 'follow' && !P.story.toldThorns) { P.story.toldThorns = true; ollySay('Ouch! Those thorns! Try Bash, Whirl or Pebble Toss instead. Skills do not get pricked.', 'worried', true); } });
RW.on('chest', (id, cnt) => { if (olly.state === 'follow') ollySay(cnt.found === cnt.all ? 'Every chest in this area! You are a treasure-finding genius. Like me.' : ['Treasure! I always knew you were lucky. I knew it.', 'Ooh, shiny shiny. There are more hidden around here, I can feel it.'][Math.floor(rnd(0, 2))], 'happy', true); });
RW.on('title', (t) => { if (olly.state === 'follow') ollySay(t + '! It suits you. Almost as well as my scarf suits me.', 'happy', true); });
RW.on('rare', () => { if (olly.state === 'follow') ollySay('Ooh, shiny! I would keep that one.', 'surprised', true); });
// ---------- jobs (delivery 5) ----------
function maybeJobQuest(withScene) {
  if (!P || P.lv < 10 || (P.job && P.job !== 'novice') || qs('jq1') || !P.story.intro) return;
  startQuest('jq1');
  if (withScene) setTimeout(() => { if (P && olly.state === 'follow' && !UI.talking) playScene('jobReady', null, [{ label: 'Let us go!', run: bye }]); }, 2600);
}
RW.on('levelup', (lv) => { if (lv >= 10) maybeJobQuest(true); });
RW.on('master', (id) => { if (!P) return; progress((o) => o.t === 'meet' && o.who === id, 1); G.save(); });
RW.on('job', () => {
  if (!P) return;
  if (!qs('jq1')) startQuest('jq1', true);
  const s = qs('jq1'), st = stageOf('jq1');
  if (st) { st.goal.forEach((o, i) => { s.prog[i] = o.need; }); changed(); checkAuto(); }
});
RW.on('try', (job) => { if (olly.state === 'follow') ollySay(['Ooh! How does it feel? You look very ' + RW.JOBS[job].name + '-ish.', 'Try skills 1 and 2 on the targets! I will watch. From a safe distance.'][Math.floor(rnd(0, 2))], 'happy', true); });
RW.on('trialFail', () => { if (olly.state === 'follow') setTimeout(() => ollySay('Almost! Trials can be tried again any time. I believe in you. Mostly.', 'worried', true), 1500); });
RW.on('status', (k) => {
  if (!P || olly.state !== 'follow') return;
  const tut = P.story.tut || (P.story.tut = {});
  if (k === 'poison' && !tut.poison) { tut.poison = true; ollySay('You are poisoned! An Antidote cures it. Mira sells them.', 'worried', true); }
  if (k === 'stun' && !tut.stun) { tut.stun = true; ollySay('Dizzy! It wears off in a moment. A Wake-up Herb helps too.', 'worried', true); }
});

// ---------- every frame ----------
let uiT = 0, warmT = 0, dayT = 0, lookT = 0;
function update(dt, time) {
  if (!P) return;
  updateOlly(dt, time);
  runQueue();
  // reach goals
  for (const id of ALL) {
    const st = stageOf(id); if (!st) continue;
    st.goal.forEach((o, i) => {
      if (objCount(id, i) >= o.need) return;
      if (o.t === 'reach') { const pl = PLACES[o.at]; if (Math.hypot(pl.x - player.pos.x, pl.z - player.pos.z) < o.r) { qs(id).prog[i] = 1; changed(); checkAuto(); } }
      else if (o.t === 'trail') {
        const path = PLACES[o.path || 'trail'], k = objCount(id, i), pl = path[k];
        if (W.mapAt(pl.x, pl.z) === W.active && Math.hypot(pl.x - player.pos.x, pl.z - player.pos.z) < 4) {
          qs(id).prog[i] = k + 1; sfx.sparkle(); changed(); checkAuto(); G.save();
          const say = o.path === 'wisps' ? ['A wisp! It floats away... follow it!', 'Deeper into the forest. The trees are whispering louder.', 'I can smell sunshine. Is that a thing? It is now.', 'Almost there! Quiet now...'] : ['This way! More glowing drops!', 'It keeps going north. I knew it. Well, I hoped it.', 'Almost there, I can feel it in my feathers!'];
          if (k + 1 < o.need) ollySay(say[k] || 'This way!', 'surprised', true);
        }
      }
    });
  }
  // the beacon stands on the next place to reach in this area
  const tg = targets(), bt = tg.find((t) => t.beacon && t.map === W.active);
  if (bt) { if (!beacon) beacon = makeBeacon(); beacon.visible = true; beacon.position.set(bt.x, W.height(bt.x, bt.z), bt.z); const s = 1 + Math.sin(time * 3) * 0.08; beacon.userData.ring.scale.set(s, s, s); beacon.userData.beam.material.opacity = 0.16 + Math.sin(time * 2) * 0.06; }
  else if (beacon) beacon.visible = false;
  trailDrops.visible = active('mq5') && W.active === 'meadow';
  if (trailDrops.visible) { const k = objCount('mq5', 0); for (const d of trailDrops.children) d.visible = d.userData.seg >= k - 1 && d.userData.seg <= k; }
  wisps.visible = active('mq12') && W.active === 'wood';
  if (wisps.visible) { const k = objCount('mq12', 0); wisps.children.forEach((w, i) => { w.visible = i >= k && i <= k + 1; const s = i === k ? 1 : 0.6; w.scale.setScalar(s * (1 + Math.sin(time * 3 + i) * 0.12)); w.position.y = w.userData.base + Math.sin(time * 1.6 + i * 2) * 0.35; }); }
  if (hammerSpot && hammerSpot.spin) hammerSpot.spin.rotation.y += dt * 1.5;
  // sitting counts for the "rest" daily job
  if (player.sitting && P.daily && P.daily.taken) { olly.restAcc = (olly.restAcc || 0) + dt; if (olly.restAcc >= 1) { olly.restAcc -= 1; dailyProgress('rest', 1); } }
  // hints
  if (hintT > 0) { hintT -= dt; if (hintT <= 0 || UI.talking) hideHint(); }
  const tut = P.story.tut;
  if (tut && active('mq1') && qs('mq1').st === 1 && !tut.attack && !UI.talking && hintT <= 0) hint('Tap a Leaflet to attack it. Your hero runs over and swings on their own.', 8);
  // Olly's first look at a Mushling
  lookT -= dt;
  if (lookT <= 0 && olly.state === 'follow' && !P.story.sawMush) {
    lookT = 1;
    if (G.monsters.some((m) => m.kind === 'mushling' && m.alive && m.active && m.pos.distanceTo(player.pos) < 16)) { P.story.sawMush = true; ollySay('A Mushling! Fun fact: they are 90% mushroom and 10% grumpy. They also hit hard.', 'surprised', true); }
  }
  // tracker, marks, board
  uiT -= dt;
  if (uiT <= 0 || dirtyUI) { if (uiT <= 0) checkAuto(); uiT = 2; dirtyUI = false; refreshMarkers(); renderTracker(); if (UI.isOpen('questPanel')) renderJournal(); }
  dayT -= dt; if (dayT <= 0) { dayT = 5; if (P.daily && P.daily.day !== todayKey()) { rollDaily(); changed(); } }
  // render a few dialog faces ahead of time
  warmT -= dt; if (warmT <= 0 && warmList.length) { warmT = 0.25; const [w, f] = warmList.shift(); RW.portraits.get(w, f); }
}

// does the story need to talk to this person (a quest to hand in, a request to offer)? Then it goes first
function pending(id) {
  if (!P || !P.story.intro) return false;
  for (const qid of ALL) { const st = stageOf(qid); if (st && st.to === id && (stageReady(qid) || !st.goal.length)) return true; }
  for (const qid of SIDE) if (QUESTS[qid].giver === id && sideOpen(qid)) return true;
  return false;
}
RW.story = { say: ollySay, update, talk, pending, onLine, renderJournal, marks: () => targets(), get olly() { return olly; }, QUESTS, startQuest, advance, MAIN, SIDE, ALL, SCENES, PLACES, NAMES, L, playScene, bye, campsOf, isActive: active, qs, stageOf, progress, changed, debugComplete(id) { const s = qs(id); if (!s) return; const st = stageOf(id); st.goal.forEach((o, i) => { s.prog[i] = o.need; }); changed(); checkAuto(); } };
})();
