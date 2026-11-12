// Russel World v1.4: the runtime of Chapter 2 and 3. Boats between the docks, the story quests (in English and Indonesian),
// the two dungeons (tide shells in the Tide Cave, fire bowls in the Ice Cave), the two bosses, the cold, job passives and the paper map.
(function () {
'use strict';
const RW = window.RW;
if (!RW || RW.failed || !RW.G || !RW.world || !RW.LANDS_DATA) return;
const { THREE, scene, rnd, ITEMS, KINDS } = RW;
const W = RW.world, G = RW.G, UI = RW.UI, sfx = RW.audio.sfx, esc = G.esc, D0 = RW.LANDS_DATA;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const T = (en, id) => (RW.lang && RW.lang() === 'id' ? id : en);
RW.T = T;
const P = () => G.p;
const ollySay = (t, f) => { if (RW.story && RW.story.say) RW.story.say(t, f || 'happy', true); };
const bye = () => { UI.hideDialog(); G.endTalk(); };
const isLand = (id) => !!D0.LANDS[id];
const CH2 = ['coral', 'beach', 'reef', 'jungle', 'lagoon', 'volcano', 'seacave'];

// ======================================================================= boats
const DOCKS = {
  river: { x: W.DOCK.x + 1.5, z: W.DOCK.z + 4, face: -Math.PI / 2, name: 'Riverside' },
  coral: { x: -1505, z: 10, face: -Math.PI / 2, name: 'Coralcove' },
  frost: { x: -3005, z: 10, face: -Math.PI / 2, name: 'Frostpeak' },
  // v1.5: the big harbour city, open after Chapter 3 (or at Lv. 28)
  sun: { x: -1556, z: 612, face: -Math.PI / 2, name: 'Sunhaven', open: (p) => (RW.story.qs && RW.story.qs('mq41') && RW.story.qs('mq41').done) || p.lv >= 28 }
};
const DOCK_OF = { bahari: 'river', bahari2: 'coral', bahari3: 'frost', bahari4: 'sun' };
const FARE = 40;
function sail(to) {
  const p = P(); if (!p) return;
  if (p.coins < FARE) return G.deny(T('Not enough coins (' + FARE + ').', 'Koin tidak cukup (' + FARE + ').'));
  G.addCoins(-FARE); bye();
  p.story.boat = true;
  const d = DOCKS[to];
  UI.toast(T('All aboard! Sailing to <b>' + d.name + '</b>...', 'Naik kapal! Berlayar ke <b>' + d.name + '</b>...'), true);
  sfx.gate && sfx.gate();
  setTimeout(() => G.travel(W.mapAt(d.x, d.z), d.x, d.z, d.face, 'boat'), 700);
}
function captain(n) {
  const p = P(), here = DOCK_OF[n.id] || 'frost';
  const L1 = (text, face) => ({ who: n.id, name: n.name, role: n.role, face: face || 'happy', text });
  if (p.lv < 10) { UI.say([L1(T('Ahoy, little sailor! The sea out there is rough. Come back when you are Lv. 10, then I will take you to Coralcove.', 'Ahoy, pelaut kecil! Lautnya ganas. Kembali kalau sudah Lv. 10, nanti aku antar ke Coralcove.'))], [{ label: T('Okay!', 'Oke!'), run: bye }]); return true; }
  const acts = [];
  const frostOpen = !!p.story.ch2done || p.lv >= 22;
  for (const to of Object.keys(DOCKS)) {
    if (to === here) continue;
    if (to === 'frost' && !frostOpen) continue;
    if (DOCKS[to].open && !DOCKS[to].open(p)) continue;
    acts.push({ label: T('Sail to ', 'Berlayar ke ') + DOCKS[to].name + ' (' + FARE + ')', run: () => sail(to) });
  }
  acts.push({ label: T('Not now', 'Nanti saja'), soft: true, run: bye });
  let text = T('Where to, captain\'s favourite hero? ' + FARE + ' coins a trip.', 'Mau ke mana, pahlawan kesayangan kapten? ' + FARE + ' koin sekali jalan.');
  if (here === 'coral' && !frostOpen) text += T(' The cold sea to Frostpeak is too wild for now. Maybe after you help Coralcove.', ' Laut dingin ke Frostpeak masih terlalu ganas. Mungkin setelah kamu menolong Coralcove.');
  UI.say([L1(text)], acts);
  return true;
}

// ======================================================================= the story: Chapter 2 "The Light Thief" and Chapter 3 "The Frozen Heart"
const S = RW.story;
const NM = { lumi: ['Lumi', 'Little witch'], ula: ['Auntie Ula', 'Coralcove chief'], sven: ['Grandpa Sven', 'Frostpeak elder'], freya: ['Freya', 'Tea & furs shop'], bahari: ['Captain Bahari', 'Boat captain'], bahari2: ['Captain Bahari', 'Boat captain'], kiki: ['Kiki', 'Shell shop'] };
const Ln = (who, face, en, id) => { const t = T(en, id); if (who === 'olly' || who === 'hero' || !NM[who]) return S.L(who, face, t); return { who, name: NM[who][0], role: NM[who][1], face, text: t }; };
if (S && S.QUESTS) {
  const Q = S.QUESTS;
  Object.assign(S.PLACES, {
    coralTown: { x: -1600, z: -60, map: 'coral' }, palmIsle: { x: -2020, z: 6, map: 'jungle' }, lagoonShore: { x: -2140, z: -330, map: 'lagoon' },
    frostTown: { x: -3100, z: -60, map: 'frost' }
  });
  Object.assign(S.NAMES || {}, { bahari: 'Captain Bahari', bahari2: 'Captain Bahari', bahari3: 'Captain Bahari', ula: 'Auntie Ula', sven: 'Grandpa Sven', freya: 'Freya', kiki: 'Kiki' });
  const NEW = {
    mq26: { kind: 'main', title: 'A Letter from the Sea', desc: 'A seagull brought Elder Oakley a letter: the lighthouse of Coralcove went dark. Captain Bahari waits at the Riverside dock (you need Lv. 10).',
      stages: [{ goal: [], to: 'bahari', text: 'Talk to Captain Bahari at the Riverside dock', scene: 'c2Boat' }], reward: { exp: 1500, coins: 200, items: [['red_m', 3]] }, next: 'mq27' },
    mq27: { kind: 'main', title: 'Coralcove', desc: 'Sail to Coralcove, the beach town, and find the chief.',
      stages: [{ goal: [{ t: 'reach', at: 'coralTown', r: 30, text: 'Arrive in Coralcove' }], to: 'ula', text: 'Talk to Auntie Ula', scene: 'c2Ula' }], reward: { exp: 1800, coins: 250, items: [['blue_m', 3]] }, next: 'mq28' },
    mq28: { kind: 'main', title: 'Angry Beach', desc: 'Since the light went out, the beach monsters are grumpy. Calm Sandy Shore down.',
      stages: [{ goal: [{ t: 'kill', kind: 'sandpincher', need: 8, text: 'Defeat Sandpinchers' }, { t: 'kill', kind: 'jellybob', need: 6, text: 'Defeat Jellybobs' }], to: 'ula', text: 'Report to Auntie Ula', scene: 'c2Beach' }], reward: { exp: 3500, coins: 400, items: [['light_shard', 1], ['antidote', 3]] }, next: 'mq29' },
    mq29: { kind: 'main', title: 'Monkey Business', desc: 'Kiki saw the light thief fly over Palm Isle. The Monklings there grab everything shiny.',
      stages: [{ goal: [{ t: 'reach', at: 'palmIsle', r: 25, text: 'Go to Palm Isle (west gate)' }, { t: 'kill', kind: 'monkling', need: 6, text: 'Catch Monklings' }], auto: true, scene: 'c2Monkey' }], reward: { exp: 5000, coins: 500, items: [['red_m', 4]] }, next: 'mq30' },
    mq30: { kind: 'main', title: 'The Blue Lagoon', desc: 'The map points to the Blue Lagoon. Big clams there swallowed bits of light.',
      stages: [{ goal: [{ t: 'reach', at: 'lagoonShore', r: 25, text: 'Go to the Blue Lagoon' }, { t: 'kill', kind: 'clamshell', need: 4, text: 'Open Clamshells' }], auto: true, scene: 'c2Lagoon' }], reward: { exp: 6500, coins: 600, items: [['light_shard', 1]] }, next: 'mq31' },
    mq31: { kind: 'main', title: 'Fire on Ember Isle', desc: 'Lumi stole fire light too! Train on Ember Isle before you go into the Tide Cave.',
      stages: [{ goal: [{ t: 'kill', kind: 'cindertail', need: 5, text: 'Defeat Cindertails' }, { t: 'kill', kind: 'magmalet', need: 5, text: 'Defeat Magmalets' }], auto: true, scene: 'c2Ember' }], reward: { exp: 8000, coins: 700, items: [['red_m', 4], ['blue_m', 3]] }, next: 'mq32' },
    mq32: { kind: 'main', title: 'The Tide Cave', desc: 'Go into the Tide Cave (west of the lagoon). Lower the tide with the shells and face whatever guards the stolen light.',
      stages: [{ goal: [{ t: 'kill', kind: 'tidecrab_king', need: 1, text: 'Defeat the Tidecrab King' }], auto: true, scene: 'c2Boss' }], reward: { exp: 15000, coins: 1500, items: [['tide_egg', 1], ['light_shard', 2]] }, next: 'mq33' },
    mq33: { kind: 'main', title: 'The Lighthouse Shines', desc: 'Bring the light back to Auntie Ula.',
      stages: [{ goal: [], to: 'ula', text: 'Give the light back to Auntie Ula', scene: 'c2End' }], reward: { exp: 6000, coins: 1200, items: [['light_charm', 1], ['lucky_clover', 1]] }, next: 'mq34', end: true, chapter: true,
      chapterTitle: 'Chapter 2 Complete!', chapterSub: 'The Light Thief · Chapter 3 begins!', endLine: 'Coralcove shines again! And Lumi flew north, to the snow. Brr. I will need a scarf.',
      after: () => { const p = P(); if (p) { p.story.ch2done = true; addTitle('Sea Hero'); } } },
    mq34: { kind: 'main', title: 'North by Boat', desc: 'Captain Bahari can sail to Frostpeak now. Talk to him at the Coralcove dock.',
      stages: [{ goal: [], to: 'bahari2', text: 'Talk to Captain Bahari in Coralcove', scene: 'c3Boat' }], reward: { exp: 4000, coins: 300, items: [['warm_tea', 5]] }, next: 'mq35' },
    mq35: { kind: 'main', title: 'Frostpeak', desc: 'Find the elder of the snow town.',
      stages: [{ goal: [{ t: 'reach', at: 'frostTown', r: 30, text: 'Arrive in Frostpeak' }], to: 'sven', text: 'Talk to Grandpa Sven', scene: 'c3Sven' }], reward: { exp: 6000, coins: 500, items: [['warm_tea', 5]] }, next: 'mq36' },
    mq36: { kind: 'main', title: 'Cold Fields', desc: 'The Snowy Fields freeze anyone who walks there. Clear the way, then visit Freya for tea.',
      stages: [{ goal: [{ t: 'kill', kind: 'snowbun', need: 8, text: 'Defeat Snowbuns' }, { t: 'kill', kind: 'frostling', need: 6, text: 'Defeat Frostlings' }], to: 'freya', text: 'Visit Freya in Frostpeak', scene: 'c3Tea' }], reward: { exp: 10000, coins: 800, items: [['warm_tea', 8], ['light_shard', 1]] }, next: 'mq37' },
    mq37: { kind: 'main', title: 'Howls in the Pines', desc: 'Something scared the animals of Frostpine Wood. Find out what.',
      stages: [{ goal: [{ t: 'kill', kind: 'pinewolf', need: 6, text: 'Defeat Pinewolves' }, { t: 'kill', kind: 'snowowl', need: 4, text: 'Defeat Snowowls' }], auto: true, scene: 'c3Pines' }], reward: { exp: 13000, coins: 900, items: [['red_m', 5]] }, next: 'mq38' },
    mq38: { kind: 'main', title: 'Tears on the Ice', desc: 'Someone is crying by Glacier Lake (west of the Snowy Fields).',
      stages: [{ goal: [{ t: 'kill', kind: 'penguling', need: 6, text: 'Defeat Penguling bullies' }], auto: true, scene: 'c3Lumi' }], reward: { exp: 16000, coins: 1000, items: [['light_shard', 1]] }, next: 'mq39' },
    mq39: { kind: 'main', title: 'Windy Peak', desc: 'Get strong on Windy Peak. The Frost Yeti is waiting in the Ice Cave.',
      stages: [{ goal: [{ t: 'kill', kind: 'yetiling', need: 5, text: 'Defeat Yetilings' }, { t: 'kill', kind: 'galebird', need: 4, text: 'Defeat Galebirds' }], auto: true, scene: 'c3Peak' }], reward: { exp: 20000, coins: 1200, items: [['red_m', 5], ['blue_m', 5]] }, next: 'mq40' },
    mq40: { kind: 'main', title: 'The Frozen Heart', desc: 'Go into the Ice Cave (west of Glacier Lake). Light the fire bowls to melt the ice walls, and calm the Frost Yeti.',
      stages: [{ goal: [{ t: 'kill', kind: 'frost_yeti', need: 1, text: 'Calm the Frost Yeti' }], auto: true, scene: 'c3Boss' }], reward: { exp: 40000, coins: 3000, items: [['frost_egg', 1], ['light_shard', 3]] }, next: 'mq41' },
    mq41: { kind: 'main', title: 'Lights Come Home', desc: 'Tell Grandpa Sven the good news.',
      stages: [{ goal: [], to: 'sven', text: 'Talk to Grandpa Sven', scene: 'c3End' }], reward: { exp: 15000, coins: 2500, items: [['light_charm', 2], ['lucky_clover', 2]] }, next: null, end: true, chapter: true,
      chapterTitle: 'Chapter 3 Complete!', chapterSub: 'The Frozen Heart · More adventures soon!', endLine: 'We did it! All the lights are home, and Lumi is our friend now. Next time... maybe somewhere warm?',
      after: () => addTitle('Lightkeeper') }
  };
  Object.assign(Q, NEW);
  for (const id in NEW) { if (!S.MAIN.includes(id)) S.MAIN.push(id); if (!S.ALL.includes(id)) S.ALL.push(id); }
  if (Q.mq25) Q.mq25.next = 'mq26';
  Object.assign(S.SCENES, {
    c2Boat: () => [Ln('bahari', 'happy', 'Ahoy! Elder Oakley sent you? Good. My sister Ula runs Coralcove, and her lighthouse went dark three nights ago.', 'Ahoy! Elder Oakley yang kirim kamu? Bagus. Adikku Ula memimpin Coralcove, dan mercusuarnya padam tiga malam lalu.'),
      Ln('bahari', 'normal', 'Ships cannot find the way home without it. Hop on my boat any time. ' + FARE + ' coins, and I throw in the sea breeze for free!', 'Kapal tidak bisa pulang tanpa cahayanya. Naik kapalku kapan saja. ' + FARE + ' koin, angin lautnya gratis!'),
      Ln('olly', 'happy', 'A boat! I have never been on a boat. I have been NEAR a boat. Once. It was a duck.', 'Kapal! Aku belum pernah naik kapal. Pernah DEKAT kapal. Sekali. Ternyata bebek.')],
    c2Ula: () => [Ln('ula', 'worried', 'Welcome, little hero. Bahari told me you beat a whole Leaflet King! We need that kind of courage here.', 'Selamat datang, pahlawan kecil. Bahari bilang kamu mengalahkan Raja Leaflet! Kami butuh keberanian seperti itu.'),
      Ln('ula', 'normal', 'Someone took the light right out of our lighthouse. All we found was a pointy hat print in the sand... and a trail of glitter.', 'Ada yang mencuri cahaya dari mercusuar kami. Yang tersisa cuma jejak topi runcing di pasir... dan taburan gemerlap.'),
      Ln('ula', 'worried', 'Since then, the crabs and jellies on Sandy Shore are grumpy. Could you calm them down first? South gate.', 'Sejak itu, kepiting dan ubur-ubur di Sandy Shore jadi galak. Bisa tenangkan mereka dulu? Gerbang selatan.')],
    c2Beach: () => [Ln('ula', 'happy', 'The beach is calm again! And look, you found this in the sand? A Light Shard. A tiny piece of our light.', 'Pantai sudah tenang! Dan lihat, kamu menemukan ini di pasir? Kepingan Cahaya. Potongan kecil dari cahaya kami.'),
      Ln('kiki', 'surprised', 'Auntie! I saw her! A little girl on a broom, carrying a jar full of light! She flew over Palm Isle!', 'Bibi! Aku melihatnya! Gadis kecil naik sapu, membawa toples penuh cahaya! Dia terbang ke Palm Isle!'),
      Ln('olly', 'angry', 'A light thief! On a broom! That is... actually very stylish. But still rude! To Palm Isle, through the west gate!', 'Pencuri cahaya! Naik sapu! Itu... sebenarnya keren. Tapi tetap jahat! Ke Palm Isle, lewat gerbang barat!')],
    c2Monkey: () => [Ln('olly', 'surprised', 'That Monkling dropped a paper! A map... with drawings of glowing jars. And a name: "LUMI\'S LIGHT COLLECTION".', 'Monkling itu menjatuhkan kertas! Sebuah peta... dengan gambar toples bercahaya. Dan nama: "KOLEKSI CAHAYA LUMI".'),
      Ln('olly', 'normal', 'There is a big X on the Blue Lagoon, south of here. Let us go see!', 'Ada tanda X besar di Blue Lagoon, di selatan sini. Ayo lihat!')],
    c2Lagoon: () => [Ln('olly', 'surprised', 'Look, the clams were full of tiny lights! And up there... a broom!', 'Lihat, kerangnya penuh cahaya kecil! Dan di atas sana... sebuah sapu!'),
      Ln('lumi', 'angry', 'Hey! Those are MINE! I found them first! Finders keepers!', 'Hei! Itu PUNYAKU! Aku yang menemukannya duluan! Siapa nemu, dia punya!'),
      Ln('lumi', 'happy', 'You want them back? Ha! I hid the big lighthouse light in the Tide Cave. With a guard. A VERY big guard. Bye-bye!', 'Mau ambil lagi? Ha! Cahaya mercusuar kusembunyikan di Gua Pasang. Dengan penjaga. Penjaga yang BESAR SEKALI. Dadah!'),
      Ln('olly', 'worried', 'She went into the cave west of the lagoon. Let us train a little first. Ember Isle is just south.', 'Dia masuk gua di barat laguna. Kita latihan dulu sedikit. Ember Isle ada di selatan.')],
    c2Ember: () => [Ln('olly', 'happy', 'You are strong now! Strong enough for a VERY big guard? ...Probably! The Tide Cave is west of the lagoon.', 'Kamu sudah kuat! Cukup kuat untuk penjaga yang BESAR SEKALI? ...Mungkin! Gua Pasang ada di barat laguna.'),
      Ln('olly', 'normal', 'Inside, the sea fills the tunnels. Old shells there move the tide. Press them and the water goes away!', 'Di dalam, air laut mengisi lorong. Ada kerang tua yang menggerakkan pasang. Tekan, dan airnya surut!')],
    c2Boss: () => [Ln('olly', 'happy', 'The Tidecrab King is down! And behind him... the lighthouse light! It is so warm!', 'Raja Kepiting Pasang kalah! Dan di belakangnya... cahaya mercusuar! Hangat sekali!'),
      Ln('lumi', 'surprised', 'NO! My crab! You beat my crab?! Hmph. Fine. Keep that one. I have MORE lights in the north, where it snows!', 'TIDAK! Kepitingku! Kamu mengalahkan kepitingku?! Hmph. Ya sudah. Ambil yang itu. Aku punya cahaya LEBIH BANYAK di utara, di tempat bersalju!'),
      Ln('olly', 'surprised', 'She left an egg behind! A sea-blue egg. I think she wants us to take care of it. Let us bring the light back to Auntie Ula!', 'Dia meninggalkan sebutir telur! Telur biru laut. Sepertinya dia ingin kita merawatnya. Ayo bawa cahayanya ke Bibi Ula!')],
    c2End: () => [Ln('ula', 'happy', 'Our lighthouse! It shines again! Every ship in the sea will find its way home tonight. Thank you, hero.', 'Mercusuar kami! Bersinar lagi! Malam ini semua kapal bisa pulang. Terima kasih, pahlawan.'),
      Ln('ula', 'worried', 'But that little witch... Lumi... she flew north. Frostpeak is cold and dark in winter. Maybe that is why she wants light.', 'Tapi penyihir kecil itu... Lumi... terbang ke utara. Frostpeak dingin dan gelap di musim dingin. Mungkin itu sebabnya dia ingin cahaya.'),
      Ln('ula', 'happy', 'Take this Light Charm. And ask my brother. His boat can reach Frostpeak now.', 'Ambil Jimat Cahaya ini. Dan tanya kakakku. Kapalnya sekarang bisa sampai ke Frostpeak.')],
    c3Boat: () => [Ln('bahari2', 'happy', 'Frostpeak, eh? Wrap up warm! Freya sells the best tea up there. Without it, the cold freezes you stiff.', 'Frostpeak, ya? Pakai baju hangat! Freya jual teh terenak di sana. Tanpa teh, dinginnya bikin kamu beku.'),
      Ln('olly', 'worried', 'I have feathers. Feathers are warm. I will be fine. ...Can I sit in your pocket?', 'Aku punya bulu. Bulu itu hangat. Aku pasti baik-baik saja. ...Boleh aku duduk di sakumu?')],
    c3Sven: () => [Ln('sven', 'normal', 'Brr! Visitors! Come, stand by the fire. You are looking for the little witch? Lumi?', 'Brr! Ada tamu! Sini, dekat api. Kalian mencari penyihir kecil itu? Lumi?'),
      Ln('sven', 'worried', 'She lives in the Ice Cave with the Frost Yeti. Lately she took the northern lights from the sky, and the Yeti went wild with cold.', 'Dia tinggal di Gua Es bersama Yeti Es. Akhir-akhir ini dia mengambil cahaya utara dari langit, dan Yetinya mengamuk kedinginan.'),
      Ln('sven', 'normal', 'Monsters here can freeze you. Drink Warm Tea before you go: then the cold cannot catch you for a while.', 'Monster di sini bisa membekukanmu. Minum Teh Hangat dulu: setelah itu dinginnya tidak bisa menangkapmu untuk sementara.')],
    c3Tea: () => [Ln('freya', 'happy', 'You cleared the fields! Here, tea for the brave. One sip and you are warm for a whole minute and a half.', 'Kamu sudah membersihkan padang! Ini, teh untuk yang berani. Sekali teguk, kamu hangat satu setengah menit.'),
      Ln('freya', 'normal', 'The wolves in Frostpine Wood howl all night. Something scared them. South of the fields.', 'Serigala di Frostpine Wood melolong semalaman. Ada yang menakuti mereka. Di selatan padang.')],
    c3Pines: () => [Ln('olly', 'surprised', 'The wolves were not mean, they were scared! Of the dark. The light in the trees is gone too.', 'Serigalanya bukan jahat, mereka takut! Takut gelap. Cahaya di pepohonan juga hilang.'),
      Ln('olly', 'worried', 'Listen... someone is crying. Far away. By the lake, west of the fields.', 'Dengar... ada yang menangis. Jauh. Dekat danau, di barat padang.')],
    c3Lumi: () => [Ln('lumi', 'hurt', 'G-go away! Those penguins kept chasing me... thank you. I mean... hmph.', 'P-pergi! Penguin-penguin itu terus mengejarku... terima kasih. Maksudku... hmph.'),
      Ln('lumi', 'worried', 'I take lights because... the winter night here is SO long and SO dark. I get scared. With lots of lights, I am not scared.', 'Aku mengambil cahaya karena... malam musim dingin di sini PANJANG SEKALI dan GELAP SEKALI. Aku takut. Kalau banyak cahaya, aku tidak takut.'),
      Ln('lumi', 'worried', 'But I took the sky lights, and now my friend the Yeti is freezing and angry. I cannot calm him. Can... can you?', 'Tapi aku mengambil cahaya langit, dan sekarang temanku si Yeti kedinginan dan marah. Aku tidak bisa menenangkannya. Bisakah... kamu?'),
      Ln('olly', 'happy', 'Of course! Heroes are good at calming. Mostly with hitting. Gently! Let us get stronger on Windy Peak first.', 'Tentu! Pahlawan pandai menenangkan. Kebanyakan dengan memukul. Pelan-pelan! Kita latihan dulu di Windy Peak.')],
    c3Peak: () => [Ln('olly', 'happy', 'You are as strong as a mountain now! The Ice Cave is west of Glacier Lake. Light the fire bowls inside to melt the ice walls.', 'Kamu sekarang sekuat gunung! Gua Es ada di barat Glacier Lake. Nyalakan mangkuk api di dalam untuk mencairkan dinding es.')],
    c3Boss: () => [Ln('lumi', 'happy', 'You did it! He is calm! Look, he is yawning. Big Yeti, you just needed a hug and a warm light.', 'Kamu berhasil! Dia tenang! Lihat, dia menguap. Yeti besar, kamu cuma butuh pelukan dan cahaya hangat.'),
      Ln('lumi', 'worried', 'I am sorry I took everyone\'s light. I will give it all back. Every jar. ...Can I keep ONE small one? For my night light?', 'Maaf aku mengambil cahaya semua orang. Aku kembalikan semuanya. Semua toples. ...Boleh aku simpan SATU yang kecil? Untuk lampu tidurku?'),
      Ln('olly', 'happy', 'One small one is fine. And you can visit us! Mossbrook has lots of lanterns in December.', 'Satu yang kecil boleh. Dan kamu bisa main ke tempat kami! Mossbrook penuh lentera di bulan Desember.'),
      Ln('lumi', 'happy', 'Friends? ...Friends! Here, this egg is from the snow. Take good care of it!', 'Teman? ...Teman! Ini, telur dari salju. Rawat baik-baik ya!')],
    c3End: () => [Ln('sven', 'happy', 'The northern lights are back in the sky! And the little witch helped hang them. What a night.', 'Cahaya utara kembali ke langit! Dan penyihir kecil itu membantu memasangnya. Malam yang luar biasa.'),
      Ln('sven', 'happy', 'You are a true Lightkeeper. Frostpeak will remember you. Take these charms, and come back for tea any time.', 'Kamu Penjaga Cahaya sejati. Frostpeak akan mengingatmu. Ambil jimat ini, dan mampir minum teh kapan saja.')]
  });
}
function addTitle(t) {
  const p = P(); if (!p) return;
  if (!p.titles) p.titles = [];
  if (!p.titles.includes(t)) { p.titles.push(t); setTimeout(() => { if (P()) { UI.toast(T('New title: <b>' + t + '</b>!', 'Gelar baru: <b>' + t + '</b>!'), true); RW.emit('title', t); } }, 5200); }
}
Object.assign(RW.TITLES, {
  'Sea Hero': { how: 'Finish Chapter 2 (bring the light back to Coralcove).', bonus: { hp: 100, def: 6 }, text: '+100 Max HP, +6 Defense' },
  'Lightkeeper': { how: 'Finish Chapter 3 (calm the Frost Yeti).', bonus: { atk: 12, crit: 0.03 }, text: '+12 Attack, +3% Critical' }
});

// ======================================================================= the dungeons: tide shells and fire bowls
const DOORS = D0.DOORS, doorFx = { seacave: [], icecave: [] };
const puz = { seacave: { order: [], got: 0 }, icecave: { lit: [], t: 0 } };
function doorMeshes(id) {
  if (doorFx[id].length || !W.MAPS[id] || !W.MAPS[id].group) return;
  const grp = W.MAPS[id].group;
  for (const D of DOORS[id]) {
    let m;
    if (id === 'seacave') { m = new THREE.Mesh(new THREE.CylinderGeometry(D.r, D.r, 3.2, 24, 1, true), new THREE.MeshLambertMaterial({ color: 0x3aa7c8, emissive: 0x0a3a4a, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false })); m.position.set(D.x, W.height(D.x, D.z) + 1.4, D.z); }
    else { m = new THREE.Group(); for (let i = 0; i < 9; i++) { const c = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), RW.lam(0xbfe8ff, null, { emissive: 0x1a3a5a })); const a = i / 9 * Math.PI * 2; c.position.set(Math.cos(a) * D.r * 0.6, 1.6 + (i % 3) * 0.6, Math.sin(a) * D.r * 0.6); c.scale.set(1.4, 2.4, 1.4); m.add(c); } m.position.set(D.x, W.height(D.x, D.z), D.z); }
    grp.add(m); doorFx[id].push(m);
  }
}
function setDoor(id, i, open) { const D = DOORS[id][i]; if (!D || D.open === open) return; D.open = open; if (doorFx[id][i]) doorFx[id][i].visible = !open; if (open) { sfx.appear && sfx.appear(); G.spawnRing(V3(D.x, W.height(D.x, D.z), D.z), id === 'seacave' ? 0x7cc4ff : 0xffb46a, 5, 0.8); } }
function resetDungeon(id) { for (let i = 0; i < 3; i++) { DOORS[id][i].open = true; setDoor(id, i, false); } if (id === 'seacave') puz.seacave = { order: shuffle([0, 1, 2]), got: 0 }; else puz.icecave = { lit: [], t: 0 }; for (const s of dSpots) if (s.dungeon === id) s.reset(); }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const dSpots = [];
function shellModel(col) { const g = new THREE.Group(); const s = new THREE.Mesh(new THREE.SphereGeometry(0.7, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), RW.lam(col)); s.scale.set(1, 0.6, 1); s.position.y = 0.1; g.add(s); for (let i = -2; i <= 2; i++) { const r = new THREE.Mesh(RW.geoBox(0.05, 0.05, 1.3), RW.lam(0xffffff)); r.position.set(i * 0.22, 0.3, 0); r.rotation.y = i * 0.2; g.add(r); } const gl = RW.glow(2); gl.position.y = 0.6; gl.material.color = new THREE.Color(col); gl.material.opacity = 0.4; g.add(gl); g.userData.gl = gl; return g; }
function bowlModel() { const g = new THREE.Group(); const b = new THREE.Mesh(RW.geoCyl(0.6, 0.35, 0.5, 12), RW.lam(0x6a6a7a)); b.position.y = 0.9; g.add(b); const st = new THREE.Mesh(RW.geoCyl(0.12, 0.18, 0.7, 8), RW.lam(0x5a5a6a)); st.position.y = 0.35; g.add(st); const f = new THREE.Mesh(RW.geoCone(0.35, 0.8, 8), new THREE.MeshLambertMaterial({ color: 0xffb43d, emissive: 0xc05a00 })); f.position.y = 1.5; f.visible = false; g.add(f); const gl = RW.glow(3); gl.position.y = 1.5; gl.material.color = new THREE.Color(0xffa040); gl.visible = false; g.add(gl); g.userData.fire = [f, gl]; return g; }
const SHELL_COL = [0x7cc4ff, 0xff7a8a, 0xffd84d], SHELL_NAME = () => [T('blue', 'biru'), T('pink', 'merah muda'), T('yellow', 'kuning')];
function makeDungeonSpots() {
  for (const s of dSpots.splice(0)) G.removeSpot(s.id);
  // Tide Cave
  { const R0 = D0.LANDS.seacave.rooms;
    const s1 = { id: 'tide_s1', dungeon: 'seacave', model: shellModel(0x9ff5e8), reset() {} };
    Object.assign(s1, G.addSpot({ id: s1.id, x: R0[1].x - 4, z: R0[1].z - 8, label: T('Tide Shell', 'Kerang Pasang'), model: s1.model, range: 2.4, onUse: () => { if (DOORS.seacave[0].open) return UI.toast(T('The tide is already low here.', 'Air di sini sudah surut.')); setDoor('seacave', 0, false); setDoor('seacave', 0, true); UI.toast(T('The shell hums... the water in the next tunnel goes down!', 'Kerangnya bersenandung... air di lorong berikutnya surut!'), true); if (!P().story.tideHint) { P().story.tideHint = true; ollySay(T('See? The shells move the tide! The next room has more of them.', 'Lihat? Kerangnya menggerakkan pasang! Ruang berikutnya punya lebih banyak.')); } } }));
    dSpots.push(s1);
    // three coloured shells and a wall painting that shows the order
    for (let i = 0; i < 3; i++) {
      const a = -0.6 + i * 0.6, sp = { id: 'tide_c' + i, dungeon: 'seacave', model: shellModel(SHELL_COL[i]) };
      sp.reset = () => { sp.model.userData.gl.material.opacity = 0.4; };
      Object.assign(sp, G.addSpot({ id: sp.id, x: R0[2].x + Math.sin(a) * 11, z: R0[2].z - Math.cos(a) * 11, label: T('Shell', 'Kerang'), model: sp.model, range: 2.4, onUse: () => pressShell(i, sp) }));
      dSpots.push(sp);
    }
    const mural = { id: 'tide_wall', dungeon: 'seacave', reset() {} };
    const mm = new THREE.Group(); const board = new THREE.Mesh(RW.geoBox(2.4, 1.6, 0.2), RW.lam(0x8a9aa0)); board.position.y = 1.2; mm.add(board);
    Object.assign(mural, G.addSpot({ id: mural.id, x: R0[2].x + 10, z: R0[2].z + 8, label: T('Old painting', 'Lukisan tua'), model: mm, range: 2.6, onUse: () => { const n = SHELL_NAME(); UI.toast(T('The painting shows three shells: ', 'Lukisannya menunjukkan tiga kerang: ') + '<b>' + puz.seacave.order.map((k) => n[k]).join(' → ') + '</b>', true); } }));
    dSpots.push(mural);
    const s3 = { id: 'tide_s3', dungeon: 'seacave', model: shellModel(0xffffff), reset() {} };
    Object.assign(s3, G.addSpot({ id: s3.id, x: R0[3].x + 3, z: R0[3].z + 9, label: T('Big Tide Shell', 'Kerang Pasang Besar'), model: s3.model, range: 2.6, onUse: () => roomClear('seacave', 3, 2) }));
    dSpots.push(s3);
  }
  // Ice Cave
  { const R0 = D0.LANDS.icecave.rooms;
    const b1 = { id: 'ice_b1', dungeon: 'icecave', model: bowlModel() };
    b1.reset = () => fireOn(b1, false);
    Object.assign(b1, G.addSpot({ id: b1.id, x: R0[1].x - 4, z: R0[1].z - 8, label: T('Fire Bowl', 'Mangkuk Api'), model: b1.model, range: 2.4, onUse: () => { fireOn(b1, true); setDoor('icecave', 0, true); UI.toast(T('The fire melts the ice wall!', 'Apinya mencairkan dinding es!'), true); if (!P().story.iceHint) { P().story.iceHint = true; ollySay(T('Fire melts ice! The next room has three bowls. Maybe light them all, fast!', 'Api mencairkan es! Ruang berikutnya ada tiga mangkuk. Mungkin harus dinyalakan semua, cepat!')); } } }));
    dSpots.push(b1);
    for (let i = 0; i < 3; i++) {
      const a = -0.9 + i * 0.9, sp = { id: 'ice_b' + (i + 2), dungeon: 'icecave', model: bowlModel() };
      sp.reset = () => fireOn(sp, false);
      Object.assign(sp, G.addSpot({ id: sp.id, x: R0[2].x + Math.sin(a) * 13, z: R0[2].z - Math.cos(a) * 13, label: T('Fire Bowl', 'Mangkuk Api'), model: sp.model, range: 2.4, onUse: () => lightBowl(i, sp) }));
      dSpots.push(sp);
    }
    const b5 = { id: 'ice_b5', dungeon: 'icecave', model: bowlModel() };
    b5.reset = () => fireOn(b5, false);
    Object.assign(b5, G.addSpot({ id: b5.id, x: R0[3].x + 3, z: R0[3].z + 9, label: T('Big Fire Bowl', 'Mangkuk Api Besar'), model: b5.model, range: 2.6, onUse: () => { if (roomClear('icecave', 3, 2)) fireOn(b5, true); } }));
    dSpots.push(b5);
  }
}
function fireOn(sp, on) { for (const o of sp.model.userData.fire) o.visible = on; sp.on = on; }
function pressShell(i, sp) {
  const Z = puz.seacave; if (DOORS.seacave[1].open) return UI.toast(T('The tide is already low here.', 'Air di sini sudah surut.'));
  if (Z.order[Z.got] === i) {
    Z.got++; sp.model.userData.gl.material.opacity = 0.95; sfx.point && sfx.point();
    if (Z.got >= 3) { setDoor('seacave', 1, true); UI.toast(T('All three shells sing together. The tide goes out!', 'Ketiga kerang bernyanyi bersama. Air pasang surut!'), true); }
  } else {
    Z.got = 0; for (const s of dSpots) if (s.id.startsWith('tide_c')) s.reset();
    UI.toast(T('Wrong shell! The water splashes... and crabs pop out! (Read the old painting.)', 'Kerang salah! Airnya memercik... dan kepiting keluar! (Baca lukisan tua.)'));
    for (let k = 0; k < 2; k++) { const m = G.spawnMonster('sandpincher', 17, sp.x + rnd(-3, 3), sp.z + rnd(-3, 3)); m.quest = true; m.aggro = true; }
  }
}
function lightBowl(i, sp) {
  const Z = puz.icecave; if (DOORS.icecave[1].open) return;
  if (sp.on) return;
  fireOn(sp, true); Z.lit.push(i); Z.t = 15; sfx.point && sfx.point();
  if (Z.lit.length >= 3) { setDoor('icecave', 1, true); UI.toast(T('All three fires burn! The ice wall melts away.', 'Ketiga api menyala! Dinding es mencair.'), true); Z.t = 0; }
  else UI.toast(T('Quick! The fire only lasts 15 seconds. Light the others!', 'Cepat! Apinya cuma tahan 15 detik. Nyalakan yang lain!'));
}
function roomClear(id, room, door) {
  if (DOORS[id][door].open) return true;
  const r = D0.LANDS[id].rooms[room];
  const left = G.monsters.filter((m) => m.alive && !m.k.boss && Math.hypot(m.pos.x - r.x, m.pos.z - r.z) < r.r + 4).length;
  if (left) { UI.toast(T('It will not move while ' + left + ' monster' + (left > 1 ? 's are' : ' is') + ' still in this room.', 'Tidak mau bergerak selama masih ada ' + left + ' monster di ruangan ini.')); return false; }
  setDoor(id, door, true); UI.toast(T('The way to the deepest hall is open. Something big is waiting...', 'Jalan ke aula terdalam terbuka. Sesuatu yang besar menunggu...'), true);
  return true;
}
function tickDungeons(dt) {
  const Z = puz.icecave;
  if (Z.t > 0 && !DOORS.icecave[1].open) { Z.t -= dt; if (Z.t <= 0) { Z.lit = []; for (const s of dSpots) if (/^ice_b[234]$/.test(s.id)) fireOn(s, false); UI.toast(T('The fires went out. Try faster!', 'Apinya padam. Coba lebih cepat!')); } }
}

// ======================================================================= bosses
const rings = [];
function warn(x, z, r, life, dmg, freeze) {
  const w = RW.warnRing(r); w.root.position.set(x, W.height(x, z), z); w.fill.scale.setScalar(0.05); scene.add(w.root);
  rings.push({ w, x, z, r, t: 0, life, dmg, freeze });
}
function tickRings(dt) {
  for (let i = rings.length - 1; i >= 0; i--) {
    const o = rings[i]; o.t += dt; o.w.fill.scale.setScalar(Math.min(1, o.t / o.life));
    if (o.t >= o.life) {
      scene.remove(o.w.root); rings.splice(i, 1);
      if (W.mapAt(o.x, o.z) !== W.active) continue;
      G.spawnRing(V3(o.x, W.height(o.x, o.z), o.z), o.freeze ? 0xbfe8ff : 0xffb46a, o.r, 0.5);
      for (let k = 0; k < 6; k++) G.spawnPuff(V3(o.x + rnd(-o.r, o.r) * 0.6, W.height(o.x, o.z) + 0.3, o.z + rnd(-o.r, o.r) * 0.6), o.freeze ? 0xe0f4ff : 0xd8c8a8, true);
      const pl = G.player;
      if (!pl.dead && Math.hypot(pl.pos.x - o.x, pl.pos.z - o.z) < o.r) { G.hurtPlayer(o.dmg, true); if (o.freeze) freezeHero(1.8); }
    }
  }
}
function clearRings() { for (const o of rings) scene.remove(o.w.root); rings.length = 0; }
function bossBrain(cfg) {
  return {
    ai(m, dt) {
      const B = m.bs2 || (m.bs2 = { t: 4, calls: 0, said: false });
      if (!m.aggro) return null;
      if (!B.said) { B.said = true; UI.banner(m.k.name, T('Boss', 'Bos')); if (cfg.intro) ollySay(cfg.intro()); }
      B.t -= dt;
      const hp = m.hp / m.st.hp;
      if (B.calls < cfg.calls.length && hp < cfg.calls[B.calls]) { B.calls++; cfg.call(m); }
      if (B.t <= 0) { B.t = hp < 0.5 ? cfg.gap * 0.75 : cfg.gap; cfg.attack(m, hp); }
      return null;
    },
    anim(m, dt) { if (m.p.body && m.alive) m.p.body.rotation.z = Math.sin(m.t * 2) * 0.03; void dt; }
  };
}
Object.assign(KINDS.tidecrab_king, bossBrain({
  gap: 6.5, calls: [0.66, 0.33],
  intro: () => T('That is the VERY big guard! When the floor turns red, run!', 'Itu penjaga yang BESAR SEKALI! Kalau lantainya merah, lari!'),
  call(m) { UI.toast(T('<b>High tide!</b> The Tidecrab King calls his crabs!', '<b>Air pasang!</b> Raja Kepiting memanggil kepiting-kepitingnya!'), true); for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; const c = G.spawnMonster('sandpincher', 18, m.pos.x + Math.cos(a) * 6, m.pos.z + Math.sin(a) * 6); c.quest = true; c.aggro = true; } },
  attack(m, hp) { const pl = G.player; warn(pl.pos.x, pl.pos.z, 3.4, 1.3, m.st.dmg[1] * 1.3, false); if (hp < 0.5) for (let k = 0; k < 2; k++) warn(pl.pos.x + rnd(-6, 6), pl.pos.z + rnd(-6, 6), 3, 1.6, m.st.dmg[1], false); }
}));
Object.assign(KINDS.frost_yeti, bossBrain({
  gap: 7, calls: [0.5],
  intro: () => T('He is so cold he cannot think! Watch for falling icicles. Drink Warm Tea if you freeze!', 'Dia kedinginan sampai tidak bisa berpikir! Awas es jatuh. Minum Teh Hangat kalau beku!'),
  call(m) { UI.toast(T('<b>ROAR!</b> Chillbats wake up all over the cave!', '<b>AUM!</b> Chillbat bangun di seluruh gua!'), true); for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; const c = G.spawnMonster('chillbat', 28, m.pos.x + Math.cos(a) * 7, m.pos.z + Math.sin(a) * 7); c.quest = true; c.aggro = true; } },
  attack(m, hp) { const pl = G.player; const n = hp < 0.5 ? 5 : 3; for (let k = 0; k < n; k++) warn(pl.pos.x + (k ? rnd(-5, 5) : 0), pl.pos.z + (k ? rnd(-5, 5) : 0), 2.6, 1.4 + k * 0.15, m.st.dmg[1] * 1.1, true); }
}));

// ======================================================================= the cold
function warm() { const b = G.player.buffs.warm; return b && b.t > 0; }
function freezeHero(t) {
  const pl = G.player; if (pl.dead || warm()) return;
  pl.freeze = Math.max(pl.freeze || 0, t);
  G.floatText('<small>' + T('FROZEN', 'BEKU') + '</small>', 'el el-water', V3(pl.pos.x, pl.pos.y + 2.1, pl.pos.z), 1.2);
  const p = P(); if (p && !p.story.coldHint) { p.story.coldHint = true; setTimeout(() => ollySay(T('Brr! You froze! Drink Warm Tea: it thaws you AND keeps you warm for a while.', 'Brr! Kamu beku! Minum Teh Hangat: mencairkan DAN membuatmu hangat untuk sementara.'), 'worried'), 600); }
}
const struck0 = RW.river.struck;
RW.river.struck = function (m) { struck0(m); if (m.k.freeze && Math.random() < m.k.freeze) freezeHero(1.4); };
let chillT = 20;
function tickCold(dt) {
  if (!['peak', 'icecave'].includes(W.active) || G.player.dead) return;
  if (warm()) { chillT = 20; return; }
  chillT -= dt;
  if (chillT <= 0) { chillT = 22; UI.toast(T('Brr... the wind is icy up here. Warm Tea helps!', 'Brr... anginnya dingin sekali di sini. Teh Hangat membantu!')); freezeHero(0.8); }
}

// ======================================================================= job passives: skill 5 at Lv. 15 and skill 6 at Lv. 25 (always on)
const PASSIVE = {
  warrior: [{ lv: 15, name: 'Iron Body', id: 'Badan Besi', text: '+12% Max HP, +6 Defense', f: (d) => { d.maxHp = Math.round(d.maxHp * 1.12); d.def += 6; } },
    { lv: 25, name: 'Unbreakable', id: 'Tak Tergoyahkan', text: '+10 Defense, +10% Attack', f: (d) => { d.def += 10; d.atk *= 1.1; } }],
  archer: [{ lv: 15, name: 'Eagle Eye', id: 'Mata Elang', text: '+5% Critical', f: (d) => { d.crit += 0.05; } },
    { lv: 25, name: 'Wind Step', id: 'Langkah Angin', text: '+8% Speed, +3% Dodge', f: (d) => { d.speed *= 1.08; d.dodge += 0.03; } }],
  mage: [{ lv: 15, name: 'Mana Flow', id: 'Aliran Mana', text: '+20% Max MP, +6 Magic', f: (d) => { d.maxMp = Math.round(d.maxMp * 1.2); d.matk += 6; } },
    { lv: 25, name: 'Arcane Mind', id: 'Pikiran Gaib', text: '+12% Magic', f: (d) => { d.matk *= 1.12; } }],
  robot: [{ lv: 15, name: 'Steel Plating', id: 'Lapisan Baja', text: '+8 Defense', f: (d) => { d.def += 8; } },
    { lv: 25, name: 'Overclock', id: 'Overclock', text: '+8% Attack, +5% Speed', f: (d) => { d.atk *= 1.08; d.speed *= 1.05; } }]
};
RW.PASSIVE = PASSIVE;
const gearApply0 = RW.gearApply;
RW.gearApply = function (d, p, job) {
  if (gearApply0) gearApply0(d, p, job);
  const list = p && PASSIVE[job]; if (!list) return;
  for (const s of list) if (p.lv >= s.lv) s.f(d);
};
RW.on('levelup', (lv) => { const p = P(); if (!p) return; const l = PASSIVE[p.job]; if (!l) return; for (const s of l) if (lv === s.lv || p.lv === s.lv) { UI.toast(T('New passive skill: <b>' + s.name + '</b> (' + s.text + '). Always on!', 'Skill pasif baru: <b>' + s.id + '</b> (' + s.text + '). Selalu aktif!'), true); G.rederive && G.rederive(); } });

// ======================================================================= paper map for the islands and the snow
RW.lands = {
  isLand,
  drawPaper(g, Wd, Hd, p, H) {
    const grp = RW.lands.groups.find((x) => x.ids.includes(W.active)) || RW.lands.groups[0], two = grp.ids === CH2, ids = grp.ids;
    // the sea, or snowy hills
    g.fillStyle = grp.bg; g.fillRect(24, 24, Wd - 48, Hd - 48);
    const xs = ids.map((id) => D0.LANDS[id].cx), zs = ids.map((id) => D0.LANDS[id].cz);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
    const k = Math.min((Wd - 260) / Math.max(1, x1 - x0), (Hd - 220) / Math.max(1, z1 - z0));
    const to = (x, z) => [Wd / 2 + (x - (x0 + x1) / 2) * k, Hd / 2 - (z - (z0 + z1) / 2) * k];
    const rr = RW.seeded(77);
    // paths between lands
    for (const G0 of W.GATES) if (ids.includes(G0.map) && ids.includes(G0.to)) { const a = to(D0.LANDS[G0.map].cx, D0.LANDS[G0.map].cz), b = to(D0.LANDS[G0.to].cx, D0.LANDS[G0.to].cz); H.dotted(g, [a, b]); }
    const COL = { coral: ['#f0dcae', '#8a6a40'], beach: ['#f0dcae', '#8a6a40'], reef: ['#f4c8c0', '#8a5a50'], jungle: ['#6fb04a', '#2f5a22'], lagoon: ['#7ab86a', '#2f5a3a'], volcano: ['#8a6a5a', '#3a2a26'], seacave: ['#5a6a72', '#2a3a42'],
      frost: ['#f4f8fc', '#6a7a8a'], snowfield: ['#f4f8fc', '#6a7a8a'], pines: ['#c8dcd0', '#2f5a46'], glacier: ['#cfeeff', '#4a6a8a'], peak: ['#e0e8f0', '#5a6a7a'], icecave: ['#9ab8d8', '#2a3a52'] };
    for (const id of ids) {
      const L = D0.LANDS[id], [x, y] = to(L.cx, L.cz), r = id === 'coral' || id === 'frost' ? 62 : 74, cc = COL[id] || (grp.col && grp.col[id]) || ['#cfe0c0', '#3a4a3a'];
      if (!H.seen(id)) { H.cloud(g, x, y, r, r * 0.75); continue; }
      H.blob(g, x, y, r, r * 0.75, 3 + ids.indexOf(id) * 1.3, 0.08); g.fillStyle = cc[0]; g.fill(); g.strokeStyle = cc[1]; g.lineWidth = 3; g.stroke();
      for (let i = 0; i < 7; i++) { const a = rr() * 6.28, d = Math.sqrt(rr()) * 0.6, tx = x + Math.cos(a) * r * d, ty = y + Math.sin(a) * r * 0.75 * d; if (/jungle|lagoon|beach|coral/.test(id)) H.tree(g, tx, ty, 0.8, '#4f9a3a'); else if (/pines|snowfield|frost|glacier/.test(id)) H.pine(g, tx, ty, 0.9); }
      if (id === 'volcano') { g.fillStyle = '#5a3a2a'; g.beginPath(); g.moveTo(x - 30, y + 20); g.lineTo(x, y - 30); g.lineTo(x + 30, y + 20); g.closePath(); g.fill(); g.fillStyle = '#ff7a2a'; g.beginPath(); g.arc(x, y - 26, 7, 0, 6.28); g.fill(); }
      if (id === 'coral' || id === 'frost') { for (const [dx, dy, c] of [[-16, -6, '#ff7a8a'], [14, -10, '#7cc4ff'], [0, 14, '#ffb43d']]) { g.fillStyle = '#fff1d6'; g.fillRect(x + dx - 4, y + dy, 8, 9); g.fillStyle = id === 'frost' ? '#f4f8ff' : c; g.strokeStyle = '#3b2a1e'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(x + dx, y + dy, 11, 7, 0, Math.PI, 0); g.closePath(); g.fill(); g.stroke(); } }
      const n = H.chestCount(id), A = RW.AREAS[id];
      H.label(g, A.name, x, y + r * 0.75 + 16, 18, A.lv + (n.all ? ' · ' + T('Chests', 'Peti') + ' ' + n.found + '/' + n.all : ''));
    }
    // you are here
    const pl = G.player, [px, py] = to(pl.pos.x, pl.pos.z);
    const L = D0.LANDS[W.active], [lx, ly] = to(L.cx, L.cz), sx = lx + (pl.pos.x - L.cx) / (L.A || 150) * 60, sy = ly - (pl.pos.z - L.cz) / (L.A || 150) * 45;
    void px; void py;
    H.star(g, sx, sy, '#ff6a4a', 12);
    H.label(g, grp.title(), Wd / 2, 52, 24);
    void two;
  },
  groups: [{ ids: CH2, bg: 'rgba(90,170,200,.35)', title: () => T('The Sunny Sea', 'Laut Cerah') },
    { ids: ['frost', 'snowfield', 'pines', 'glacier', 'peak', 'icecave'], bg: 'rgba(200,220,240,.45)', title: () => T('The Frozen North', 'Utara Beku') }]
};

// ======================================================================= talking, events and the frame loop
RW.talkHooks = RW.talkHooks || [];
RW.talkHooks.push((n) => {
  if (!/^bahari/.test(n.id)) return false;
  if (S && S.pending && S.pending(n.id)) return false;
  return captain(n);
});
// light shards from the old bosses too
for (const k of ['old_rootling', 'king_leaflet']) if (KINDS[k] && !KINDS[k].drops.some((d) => d[0] === 'light_shard')) KINDS[k].drops.push(['light_shard', 1]);
G.lockMsg = () => T('Big rocks and roots block the way in.', 'Batu besar dan akar menghalangi jalan masuk.');
RW.on('enter', () => {
  const p = P(); if (!p) return;
  makeDungeonSpots();
  for (const id of ['seacave', 'icecave']) { if (W.active === id) doorMeshes(id); resetDungeon(id); }
  // heroes who already finished Chapter 1 get the next chapter
  setTimeout(() => { const q = S && S.qs; if (q && q('mq25') && q('mq25').done && !q('mq26') && P() === p) RW.story.startQuest('mq26'); }, 4000);
});
RW.on('map', (id) => {
  clearRings();
  if (id === 'seacave' || id === 'icecave') { doorMeshes(id); resetDungeon(id); }
  const p = P(); if (!p) return;
  if (id === 'coral' && !p.story.sawCoral) { p.story.sawCoral = true; setTimeout(() => ollySay(T('The sea! It smells like salt and adventure. And a little bit like fish.', 'Laut! Baunya garam dan petualangan. Dan sedikit bau ikan.')), 1600); }
  if (id === 'frost' && !p.story.sawFrost) { p.story.sawFrost = true; setTimeout(() => ollySay(T('S-s-snow! My beak is cold. Let us find a warm fire. And tea!', 'S-s-salju! Paruhku dingin. Ayo cari api hangat. Dan teh!'), 'worried'), 1600); }
});
RW.on('kill', (m) => {
  if (m.k.boss && (m.kind === 'tidecrab_king' || m.kind === 'frost_yeti')) { clearRings(); const p = P(); if (p) { p.story[m.kind + 'Down'] = true; G.save(); } }
});
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  try { if (P() && G.mode === 'play') { tickRings(dt); tickDungeons(dt); tickCold(dt); } } catch (e) { console.error(e); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
RW.adventure = { sail, resetDungeon, setDoor, DOORS, freezeHero, PASSIVE, puz, DOCKS, warn, clearRings, bossBrain, addTitle, Ln, NM, bowlModel, shellModel, fireOn };
})();
