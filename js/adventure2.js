// Russel World v1.5: the runtime of Sunhaven, Chapter 4 "The Sleepy Marsh", Chapter 5 "The Storm King" (the ending),
// the shops of the big city, the balloon, the two new dungeons and bosses, and the Challenge Tower.
(function () {
'use strict';
const RW = window.RW;
if (!RW || RW.failed || !RW.G || !RW.adventure || !RW.LANDS2) return;
const { THREE, scene, rnd, ITEMS, KINDS } = RW;
const W = RW.world, G = RW.G, UI = RW.UI, sfx = RW.audio.sfx, esc = G.esc, D0 = RW.LANDS_DATA, A = RW.adventure, L2 = RW.LANDS2;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const T = RW.T;
const P = () => G.p;
const bye = () => { UI.hideDialog(); G.endTalk(); };
const ollySay = (t, f) => { if (RW.story && RW.story.say) RW.story.say(t, f || 'happy', true); };
const S = RW.story;
const qDone = (id) => { const q = S && S.qs && S.qs(id); return !!(q && q.done); };

// ======================================================================= names, places
Object.assign(A.NM, { rosa: ['Mayor Rosa', 'Mayor of Sunhaven'], gus: ['Gus', 'Grand smith'], lina: ['Lina', 'Grand market'], nell: ['Nell', 'Pet keeper'], zephyr: ['Captain Zephyr', 'Balloon pilot'], zephyr2: ['Captain Zephyr', 'Balloon pilot'], orin: ['Sage Orin', 'Tower keeper'], oakley: ['Elder Oakley', 'Mossbrook elder'], bahari4: ['Captain Bahari', 'Boat captain'] });
const Ln = A.Ln;
if (S && S.QUESTS) {
  Object.assign(S.PLACES, { sunTown: { x: -1700, z: 570, map: 'sunhaven' }, fenwoodIn: { x: -2200, z: 900, map: 'fenwood' }, lilyIn: { x: -2600, z: 600, map: 'lilybog' }, cloudIn: { x: -3300, z: 640, map: 'cloudisle' }, spireIn: { x: -3300, z: 900, map: 'windspire' }, starIn: { x: -3690, z: 600, map: 'starfield' } });
  Object.assign(S.NAMES || {}, { rosa: 'Mayor Rosa', gus: 'Gus', lina: 'Lina', nell: 'Nell', zephyr: 'Captain Zephyr', zephyr2: 'Captain Zephyr', orin: 'Sage Orin', orin2: 'Sage Orin', bahari4: 'Captain Bahari' });
  const Q = S.QUESTS;
  const k = (kind, need, en, id) => ({ t: 'kill', kind, need, text: T(en, id) });
  const NEW = {
    mq42: { kind: 'main', title: 'The Big City', desc: 'A letter with a sun stamp: the Mayor of Sunhaven needs a hero. Captain Bahari can sail there now, from any dock.',
      stages: [{ goal: [{ t: 'reach', at: 'sunTown', r: 40, text: 'Sail to Sunhaven' }], to: 'rosa', text: 'Talk to Mayor Rosa by the fountain', scene: 'c4Rosa' }], reward: { exp: 20000, coins: 1500, items: [['forge_crystal', 5], ['red_m', 5]] }, next: 'mq43' },
    mq43: { kind: 'main', title: 'The Sleepy Marsh', desc: 'People who walk into the Glow Marsh (west gate of Sunhaven) fall asleep. Find out why.',
      stages: [{ goal: [k('glowjelly', 8, 'Defeat Glowjellies', 'Kalahkan Glowjelly'), k('bogfrog', 6, 'Defeat Bogfrogs', 'Kalahkan Bogfrog')], auto: true, scene: 'c4Marsh' }], reward: { exp: 26000, coins: 1600, items: [['antidote', 5]] }, next: 'mq44' },
    mq44: { kind: 'main', title: 'Gator Trouble', desc: 'Mossgators block the marsh paths. Clear them so the city folk can pass.',
      stages: [{ goal: [k('mossgator', 6, 'Defeat Mossgators', 'Kalahkan Mossgator')], to: 'rosa', text: 'Report to Mayor Rosa', scene: 'c4Gator' }], reward: { exp: 30000, coins: 1800, items: [['ruby', 1], ['forge_crystal', 5]] }, next: 'mq45' },
    mq45: { kind: 'main', title: 'Owls of Fenwood', desc: 'The spores come from the north. Search Fenwood (north gate of the Glow Marsh).',
      stages: [{ goal: [{ t: 'reach', at: 'fenwoodIn', r: 30, text: 'Go to Fenwood' }, k('fenowl', 5, 'Defeat Fenowls', 'Kalahkan Fenowl'), k('sporebat', 5, 'Defeat Sporebats', 'Kalahkan Sporebat')], auto: true, scene: 'c4Fen' }], reward: { exp: 36000, coins: 2000, items: [['light_shard', 1], ['red_m', 5]] }, next: 'mq46' },
    mq46: { kind: 'main', title: 'Into the Lily Bog', desc: 'The trail of spores leads west, into the Lily Bog.',
      stages: [{ goal: [{ t: 'reach', at: 'lilyIn', r: 30, text: 'Go to the Lily Bog' }, k('marshwisp', 6, 'Defeat Marshwisps', 'Kalahkan Marshwisp'), k('bogtoad', 6, 'Defeat Bogtoads', 'Kalahkan Bogtoad')], auto: true, scene: 'c4Bog' }], reward: { exp: 42000, coins: 2200, items: [['blue_m', 5]] }, next: 'mq47' },
    mq47: { kind: 'main', title: 'Thorny Guards', desc: 'Thornlizards guard the way to the Mushroom Hollow.',
      stages: [{ goal: [k('thornlizard', 6, 'Defeat Thornlizards', 'Kalahkan Thornlizard')], auto: true, scene: 'c4Thorn' }], reward: { exp: 48000, coins: 2400, items: [['ruby', 1]] }, next: 'mq48' },
    mq48: { kind: 'main', title: 'Mother Morel', desc: 'Go into the Mushroom Hollow (north gate of the Lily Bog). Light the glow lamps to open the mushroom walls, and wake Mother Morel gently. Very gently.',
      stages: [{ goal: [k('mother_morel', 1, 'Calm Mother Morel', 'Tenangkan Mother Morel')], auto: true, scene: 'c4Boss' }], reward: { exp: 90000, coins: 5000, items: [['marsh_egg', 1], ['light_shard', 3]] }, next: 'mq49' },
    mq49: { kind: 'main', title: 'A Fresh Morning', desc: 'Tell Mayor Rosa the marsh is awake again.',
      stages: [{ goal: [], to: 'rosa', text: 'Talk to Mayor Rosa', scene: 'c4End' }], reward: { exp: 30000, coins: 4000, items: [['light_charm', 2], ['ruby', 2]] }, next: 'mq50', end: true, chapter: true,
      chapterTitle: 'Chapter 4 Complete!', chapterSub: 'The Sleepy Marsh · Chapter 5 begins!', endLine: 'The marsh is awake and smells... mostly nice! But did you see those storm clouds over the sea?',
      after: () => A.addTitle('Marsh Friend') },
    mq50: { kind: 'main', title: 'Up, Up and Away', desc: 'Storm clouds are blowing in from the sky. Captain Zephyr in Sunhaven has a balloon (Lv. 38).',
      stages: [{ goal: [], to: 'zephyr', text: 'Talk to Captain Zephyr by the balloon', scene: 'c5Balloon' }], reward: { exp: 40000, coins: 3000, items: [['forge_crystal', 8]] }, next: 'mq51' },
    mq51: { kind: 'main', title: 'Cloud Isle', desc: 'Fly to Cloud Isle. The clouds there are angry.',
      stages: [{ goal: [{ t: 'reach', at: 'cloudIn', r: 30, text: 'Fly to Cloud Isle' }, k('puffcloud', 8, 'Calm Puffclouds', 'Tenangkan Puffcloud'), k('skyowl', 5, 'Defeat Skyowls', 'Kalahkan Skyowl')], auto: true, scene: 'c5Cloud' }], reward: { exp: 55000, coins: 3200, items: [['red_m', 6]] }, next: 'mq52' },
    mq52: { kind: 'main', title: 'Wild Wind', desc: 'Windbirds attack anyone who flies near. Show them who is boss.',
      stages: [{ goal: [k('windbird', 6, 'Defeat Windbirds', 'Kalahkan Windbird')], auto: true, scene: 'c5Wind' }], reward: { exp: 62000, coins: 3400, items: [['ruby', 1], ['blue_m', 5]] }, next: 'mq53' },
    mq53: { kind: 'main', title: 'The Windspire', desc: 'Climb the Windspire (north gate of Cloud Isle). Thunder lives there.',
      stages: [{ goal: [{ t: 'reach', at: 'spireIn', r: 30, text: 'Go to the Windspire' }, k('stormbat', 6, 'Defeat Stormbats', 'Kalahkan Stormbat'), k('thunderbun', 6, 'Defeat Thunderbuns', 'Kalahkan Thunderbun')], auto: true, scene: 'c5Spire' }], reward: { exp: 72000, coins: 3600, items: [['light_shard', 1]] }, next: 'mq54' },
    mq54: { kind: 'main', title: 'Hawks of the Storm', desc: 'The Galehawks are the Storm King\'s messengers. Stop them.',
      stages: [{ goal: [k('galehawk', 6, 'Defeat Galehawks', 'Kalahkan Galehawk')], auto: true, scene: 'c5Hawk' }], reward: { exp: 82000, coins: 3800, items: [['ruby', 2]] }, next: 'mq55' },
    mq55: { kind: 'main', title: 'The Starfield', desc: 'The road to the palace crosses the Starfield (west gate of Cloud Isle).',
      stages: [{ goal: [{ t: 'reach', at: 'starIn', r: 30, text: 'Go to the Starfield' }, k('starjelly', 6, 'Defeat Starjellies', 'Kalahkan Starjelly'), k('moonowl', 6, 'Defeat Moonowls', 'Kalahkan Moonowl'), k('cometail', 4, 'Defeat Cometails', 'Kalahkan Cometail')], auto: true, scene: 'c5Star' }], reward: { exp: 100000, coins: 4500, items: [['red_m', 8], ['blue_m', 8]] }, next: 'mq56' },
    mq56: { kind: 'main', title: 'The Storm King', desc: 'Enter the Sky Palace (north gate of the Starfield). Light the sky lamps to blow the cloud walls away, and face Storm King Nimbus.',
      stages: [{ goal: [k('storm_king', 1, 'Calm the Storm King', 'Tenangkan Raja Badai')], auto: true, scene: 'c5Boss' }], reward: { exp: 200000, coins: 10000, items: [['sky_egg', 1], ['light_shard', 5]] }, next: 'mq57' },
    mq57: { kind: 'main', title: 'Home, Sweet Home', desc: 'The sky is calm. Go home to Mossbrook and tell Elder Oakley everything.',
      stages: [{ goal: [], to: 'oakley', text: 'Talk to Elder Oakley in Mossbrook', scene: 'c5End' }], reward: { exp: 50000, coins: 10000, items: [['light_charm', 3], ['ruby', 5], ['lucky_clover', 3]] }, next: null, end: true, chapter: true,
      chapterTitle: 'The End!', chapterSub: 'Russel World · Thank you for playing! The Challenge Tower is still waiting.', endLine: 'We saved the garden, the sea, the snow, the marsh AND the sky. I would like a nap now. A long one.',
      after: () => { const p = P(); if (p) { p.story.gameDone = true; A.addTitle('Hero of Russel World'); setTimeout(() => UI.banner(T('The End', 'Tamat'), T('You are the Hero of Russel World!', 'Kamu Pahlawan Russel World!')), 6500); } } }
  };
  for (const id in NEW) for (const st of NEW[id].stages) for (const g of st.goal) if (g.text && g.t === 'reach') g.text = g.text;
  Object.assign(Q, NEW);
  for (const id in NEW) { if (!S.MAIN.includes(id)) S.MAIN.push(id); if (!S.ALL.includes(id)) S.ALL.push(id); }
  if (Q.mq41) { Q.mq41.next = 'mq42'; Q.mq41.chapterSub = 'The Frozen Heart · Chapter 4 begins!'; }
  Object.assign(S.SCENES, {
    c4Rosa: () => [Ln('rosa', 'happy', 'You must be the hero from Mossbrook! Welcome to Sunhaven, the biggest city on the sea. Fourteen bakeries! Two hundred cats!', 'Kamu pasti pahlawan dari Mossbrook! Selamat datang di Sunhaven, kota terbesar di tepi laut. Empat belas toko roti! Dua ratus kucing!'),
      Ln('rosa', 'worried', 'But we have a problem. Anyone who walks into the Glow Marsh comes back... asleep. Snoring. For days.', 'Tapi kami punya masalah. Siapa pun yang masuk ke Glow Marsh pulang dalam keadaan... tertidur. Mendengkur. Berhari-hari.'),
      Ln('rosa', 'normal', 'Gus the smith can forge with crystals and rubies, Lina sells everything, and Nell has rare eggs. Get ready, then take the west gate.', 'Gus si pandai besi bisa menempa dengan kristal dan ruby, Lina menjual semuanya, dan Nell punya telur langka. Bersiaplah, lalu lewat gerbang barat.'),
      Ln('olly', 'happy', 'A sleepy marsh? I am an expert at sleeping. Finally a quest for me!', 'Rawa yang bikin ngantuk? Aku ahli tidur. Akhirnya ada misi untukku!')],
    c4Marsh: () => [Ln('olly', 'surprised', 'Achoo! These jellies are covered in purple dust. Sleepy dust! I feel... so... zzz... I AM AWAKE.', 'Hatchi! Jeli-jeli ini penuh debu ungu. Debu ngantuk! Aku merasa... sangat... zzz... AKU BANGUN.'),
      Ln('olly', 'normal', 'The dust is coming from somewhere deeper. But first, those Mossgators keep snapping at people on the paths.', 'Debunya datang dari tempat yang lebih dalam. Tapi pertama, Mossgator itu terus menggigit orang di jalan.')],
    c4Gator: () => [Ln('rosa', 'happy', 'The paths are safe again! The fishermen can bring their boats through. Here, take these. Gus will love them.', 'Jalannya aman lagi! Nelayan bisa lewat dengan perahu. Ini, ambil. Gus pasti suka.'),
      Ln('rosa', 'worried', 'The sleepy dust is worse in the north. In Fenwood, the owls have not hooted in a week.', 'Debu ngantuknya lebih parah di utara. Di Fenwood, burung hantunya tidak berbunyi seminggu.')],
    c4Fen: () => [Ln('olly', 'worried', 'The owls were not mean, just cranky from no sleep. Owls sleep in the DAY, you know. The dust confused them.', 'Burung hantunya bukan jahat, cuma rewel kurang tidur. Burung hantu tidur di SIANG hari, tahu. Debunya bikin mereka bingung.'),
      Ln('lumi', 'happy', 'Hi hi! Did you miss me? I flew all the way here on my broom. Look, the spores blow from the west. From the Lily Bog!', 'Hai hai! Kangen aku? Aku terbang jauh ke sini naik sapu. Lihat, sporanya bertiup dari barat. Dari Lily Bog!'),
      Ln('olly', 'surprised', 'Lumi! You are a good detective now? ...Fine. You are a good detective.', 'Lumi! Kamu sekarang detektif yang hebat? ...Ya sudah. Kamu detektif yang hebat.')],
    c4Bog: () => [Ln('lumi', 'surprised', 'Look under the lilies! Little glowing mushrooms everywhere. They are all pointing north. Like they are calling for their mama.', 'Lihat di bawah teratai! Jamur kecil bercahaya di mana-mana. Semuanya menunjuk ke utara. Seperti memanggil ibunya.'),
      Ln('olly', 'normal', 'The Mushroom Hollow is through the north gate. But Thornlizards guard it. Prickly ones.', 'Mushroom Hollow ada di balik gerbang utara. Tapi Thornlizard menjaganya. Yang berduri.')],
    c4Thorn: () => [Ln('olly', 'happy', 'The way is clear! Inside the Hollow, light the glow lamps. Mushrooms LOVE light. The walls will open.', 'Jalannya sudah terbuka! Di dalam Hollow, nyalakan lampu cahaya. Jamur SUKA cahaya. Dindingnya akan terbuka.')],
    c4Boss: () => [Ln('lumi', 'happy', 'She is awake! Mother Morel is awake! She was having a bad dream, and her sleepy spores flew everywhere.', 'Dia bangun! Mother Morel sudah bangun! Dia mimpi buruk, dan spora ngantuknya terbang ke mana-mana.'),
      Ln('olly', 'happy', 'A bad dream? Poor mushroom. Now she can have a GOOD sleep. Quietly. With her mouth closed.', 'Mimpi buruk? Kasihan jamurnya. Sekarang dia bisa tidur NYENYAK. Dengan tenang. Dengan mulut tertutup.'),
      Ln('lumi', 'surprised', 'She left an egg! A soft green one. She wants you to have it. Let us tell the mayor!', 'Dia meninggalkan telur! Telur hijau lembut. Dia ingin kamu memilikinya. Ayo beri tahu wali kota!')],
    c4End: () => [Ln('rosa', 'happy', 'Everyone is waking up! The bakers are baking, the cats are meowing. Sunhaven is loud again. Wonderful!', 'Semua orang bangun! Tukang roti memanggang, kucing mengeong. Sunhaven ramai lagi. Luar biasa!'),
      Ln('rosa', 'worried', 'But... look at the sky over the sea. Black storm clouds, every day. They come from the Sky Kingdom, high above the clouds.', 'Tapi... lihat langit di atas laut. Awan badai hitam, setiap hari. Datang dari Kerajaan Langit, jauh di atas awan.'),
      Ln('rosa', 'normal', 'Captain Zephyr has a balloon. When you are ready, he can take you up there.', 'Kapten Zephyr punya balon udara. Kalau kamu siap, dia bisa membawamu ke sana.')],
    c5Balloon: () => [Ln('zephyr', 'happy', 'HA! A hero who wants to fly! My balloon is the only one in the world that can go above the clouds. Probably. I have not checked.', 'HA! Pahlawan yang mau terbang! Balonku satu-satunya di dunia yang bisa naik di atas awan. Mungkin. Belum kucek.'),
      Ln('zephyr', 'normal', 'Up there is the Sky Kingdom. The Storm King Nimbus rules it. Lately he is angry, and his storms fall on us.', 'Di atas sana ada Kerajaan Langit. Raja Badai Nimbus memerintahnya. Akhir-akhir ini dia marah, dan badainya jatuh ke kita.'),
      Ln('olly', 'worried', 'I am a bird. I should love flying. I do not love flying. I love sitting. Can I sit while we fly?', 'Aku burung. Harusnya aku suka terbang. Aku tidak suka terbang. Aku suka duduk. Boleh aku duduk sambil terbang?')],
    c5Cloud: () => [Ln('lumi', 'surprised', 'The clouds are crying! Real rain tears. Somebody up here is very, very sad.', 'Awannya menangis! Air mata hujan sungguhan. Ada yang sangat, sangat sedih di atas sini.'),
      Ln('olly', 'normal', 'Sad clouds, angry birds... Watch out for the Windbirds, they dive out of nowhere!', 'Awan sedih, burung marah... Awas Windbird, mereka menukik tiba-tiba!')],
    c5Wind: () => [Ln('olly', 'happy', 'The wind is calmer now. North of here is the Windspire, where thunder is born. Bring potions!', 'Anginnya lebih tenang sekarang. Di utara ada Windspire, tempat petir lahir. Bawa ramuan!')],
    c5Spire: () => [Ln('lumi', 'worried', 'I found a letter in the wind. It says: "Nobody visits the sky. Nobody plays with me. I will make storms until someone looks up."', 'Aku menemukan surat di angin. Isinya: "Tidak ada yang mengunjungi langit. Tidak ada yang bermain denganku. Aku akan membuat badai sampai ada yang melihat ke atas."'),
      Ln('olly', 'surprised', 'The Storm King is... lonely? Like Lumi in the snow. Like the King of the Leaflets in his cold cave.', 'Raja Badai itu... kesepian? Seperti Lumi di salju. Seperti Raja Leaflet di guanya yang dingin.')],
    c5Hawk: () => [Ln('olly', 'normal', 'Those hawks carried his letters. Nobody ever read them. The palace is past the Starfield, west of Cloud Isle.', 'Elang-elang itu membawa suratnya. Tidak ada yang pernah membacanya. Istananya di balik Starfield, di barat Cloud Isle.')],
    c5Star: () => [Ln('lumi', 'happy', 'So many stars! You can almost touch them. The Sky Palace is just north. Are you ready?', 'Banyak sekali bintang! Hampir bisa disentuh. Sky Palace ada di utara. Kamu siap?'),
      Ln('olly', 'happy', 'Inside, light the sky lamps to blow the cloud walls away. Then... we give a lonely king the best fight of his life. And then a hug.', 'Di dalam, nyalakan lampu langit untuk meniup dinding awan. Lalu... kita beri raja yang kesepian pertarungan terbaik dalam hidupnya. Lalu pelukan.')],
    c5Boss: () => [Ln('olly', 'surprised', 'He stopped! The Storm King is... laughing? He says that was the most FUN he has had in a hundred years!', 'Dia berhenti! Raja Badai... tertawa? Katanya itu paling SERU dalam seratus tahun!'),
      Ln('lumi', 'happy', 'He promises: no more angry storms. Only gentle rain for the gardens. And he wants us to visit. Often!', 'Dia janji: tidak ada badai marah lagi. Cuma hujan lembut untuk kebun. Dan dia ingin kita sering berkunjung!'),
      Ln('olly', 'happy', 'He gave you a golden egg from the sky! And look down there... you can see the whole world from here. Mossbrook too! Let us go home.', 'Dia memberimu telur emas dari langit! Dan lihat ke bawah... seluruh dunia kelihatan dari sini. Mossbrook juga! Ayo pulang.')],
    c5End: () => [Ln('oakley', 'happy', 'My friend! Olly! And... a little witch? Welcome home. The sun has never been this bright.', 'Kawanku! Olly! Dan... penyihir kecil? Selamat datang di rumah. Matahari belum pernah seterang ini.'),
      Ln('oakley', 'happy', 'A Leaflet King who was cold, a witch who was scared of the dark, a mushroom with bad dreams, a king who was lonely. You did not just fight them. You understood them.', 'Raja Leaflet yang kedinginan, penyihir yang takut gelap, jamur yang mimpi buruk, raja yang kesepian. Kamu tidak cuma melawan mereka. Kamu memahami mereka.'),
      Ln('oakley', 'happy', 'Russel himself said that is what a real hero does. From today, the whole world will call you the Hero of Russel World.', 'Russel sendiri bilang itulah yang dilakukan pahlawan sejati. Mulai hari ini, seluruh dunia akan memanggilmu Pahlawan Russel World.'),
      Ln('lumi', 'happy', 'Hero! Hero! ...Can we still go on adventures? Sage Orin in Sunhaven has a tower with a hundred floors!', 'Pahlawan! Pahlawan! ...Kita masih bisa bertualang kan? Sage Orin di Sunhaven punya menara seratus lantai!'),
      Ln('olly', 'happy', 'A hundred floors? ...After my nap.', 'Seratus lantai? ...Setelah aku tidur siang.')]
  });
}
Object.assign(RW.TITLES, {
  'Marsh Friend': { how: 'Finish Chapter 4 (wake Mother Morel).', bonus: { hp: 200, def: 10 }, text: '+200 Max HP, +10 Defense' },
  'Hero of Russel World': { how: 'Finish the story (calm the Storm King).', bonus: { atk: 25, def: 15, hp: 300, crit: 0.03 }, text: '+25 Attack, +15 Defense, +300 Max HP, +3% Critical' },
  'Tower Climber': { how: 'Reach floor 10 of the Challenge Tower.', bonus: { atk: 10, hp: 100 }, text: '+10 Attack, +100 Max HP' },
  'Tower Master': { how: 'Reach floor 30 of the Challenge Tower.', bonus: { atk: 30, def: 20, crit: 0.04 }, text: '+30 Attack, +20 Defense, +4% Critical' }
});

// ======================================================================= Sunhaven shops, the balloon
const LINA = ['red_s', 'red_m', 'blue_s', 'blue_m', 'antidote', 'wake_herb', 'warm_tea', 'fish_stew', 'tropic_mix'];
const NELL = ['marsh_egg', 'sky_egg', 'pet_kibble', 'pet_treat', 'frost_pie', 'tropic_mix'];
const pending = (id) => S && S.pending && S.pending(id);
const Lsay = (n, en, id) => ({ who: n.id, name: n.name, role: n.role, face: 'happy', text: T(en, id) });
function shop(n, list, title) { UI.hideDialog(); RW.shopNow = list.filter((id) => ITEMS[id]); RW.shopTitle = title; UI.open('shopPanel'); }
function balloon(n, to) {
  const p = P(), dest = to === 'up' ? { map: 'cloudisle', x: -3300, z: 628, face: Math.PI, name: 'Cloud Isle' } : { map: 'sunhaven', x: -1640, z: 666, face: Math.PI, name: 'Sunhaven' };
  if (p.coins < 120) return G.deny(T('The balloon needs 120 coins of hot air.', 'Balonnya butuh 120 koin udara panas.'));
  G.addCoins(-120); bye(); sfx.gate && sfx.gate();
  UI.toast(T('Up, up and away! Flying to <b>' + dest.name + '</b>...', 'Terbang tinggi! Menuju <b>' + dest.name + '</b>...'), true);
  setTimeout(() => G.travel(dest.map, dest.x, dest.z, dest.face, 'boat'), 900);
}
const skyOpen = (p) => qDone('mq49') || p.lv >= 40;
RW.talkHooks = RW.talkHooks || [];
RW.talkHooks.push((n) => {
  const p = P(); if (!p) return false;
  if (n.id === 'gus') { if (pending('gus')) return false; UI.say([Lsay(n, 'The grand forge of Sunhaven! Forge Crystals make anything, Rubies make it great. Bolt was my student, you know.', 'Tempaan agung Sunhaven! Kristal Tempa bisa membuat apa saja, Ruby membuatnya hebat. Bolt itu muridku, lho.')], [{ label: T('Smithy', 'Bengkel'), run: () => { UI.hideDialog(); RW.gear.openSmith(); } }, { label: T('Goodbye', 'Dadah'), soft: true, run: bye }]); return true; }
  if (n.id === 'lina') { if (pending('lina')) return false; UI.say([Lsay(n, 'The grand market! Potions, crystals, snacks, and a crafting bench in the back.', 'Pasar besar! Ramuan, kristal, camilan, dan meja racik di belakang.')], [{ label: T('Buy & sell', 'Beli & jual'), run: () => shop(n, LINA, T('Grand Market', 'Pasar Besar')) }, { label: T('Crafting bench', 'Meja racik'), run: () => { bye(); RW.hobby && RW.hobby.bench(); } }, { label: T('Goodbye', 'Dadah'), soft: true, run: bye }]); return true; }
  if (n.id === 'nell') { if (pending('nell')) return false; UI.say([Lsay(n, 'Marsh eggs from the bog, sky eggs from above the clouds. Treat them kindly!', 'Telur rawa dari rawa, telur langit dari atas awan. Rawat dengan baik!')], [{ label: T('Buy & sell', 'Beli & jual'), run: () => shop(n, NELL, T("Nell's Pets", 'Toko Pet Nell')) }, { label: T('Goodbye', 'Dadah'), soft: true, run: bye }]); return true; }
  if (n.id === 'zephyr' || n.id === 'zephyr2') {
    if (pending(n.id)) return false;
    if (n.id === 'zephyr2') { UI.say([Lsay(n, 'Back down to Sunhaven? 120 coins of hot air!', 'Turun ke Sunhaven? 120 koin udara panas!')], [{ label: T('Fly down (120)', 'Terbang turun (120)'), run: () => balloon(n, 'down') }, { label: T('Not now', 'Nanti saja'), soft: true, run: bye }]); return true; }
    if (!skyOpen(p)) { UI.say([Lsay(n, 'The sky is full of storms right now. Help Sunhaven with the marsh first, then we fly! (Or come back at Lv. 40.)', 'Langit penuh badai sekarang. Bantu Sunhaven dengan rawanya dulu, lalu kita terbang! (Atau kembali di Lv. 40.)')], [{ label: T('Okay!', 'Oke!'), run: bye }]); return true; }
    UI.say([Lsay(n, 'Ready to fly above the clouds? 120 coins of hot air!', 'Siap terbang di atas awan? 120 koin udara panas!')], [{ label: T('Fly up (120)', 'Terbang naik (120)'), run: () => balloon(n, 'up') }, { label: T('Not now', 'Nanti saja'), soft: true, run: bye }]);
    return true;
  }
  if (n.id === 'orin' || n.id === 'orin2') { if (pending(n.id)) return false; towerTalk(n); return true; }
  return false;
});

// ======================================================================= dungeons: glow lamps (Mushroom Hollow) and sky lamps (Sky Palace)
const DOORS = D0.DOORS, doorFx = { shroomcave: [], skypalace: [] }, puz = { shroomcave: { lit: [], t: 0 }, skypalace: { lit: [], t: 0 } };
const LAMP = { shroomcave: [0xc8a8ff, T('Glow Lamp', 'Lampu Cahaya')], skypalace: [0xffd84d, T('Sky Lamp', 'Lampu Langit')] };
function lampModel(col) { const g = A.bowlModel(); const [f, gl] = g.userData.fire; f.material = new THREE.MeshLambertMaterial({ color: col, emissive: new THREE.Color(col).multiplyScalar(0.5) }); gl.material.color = new THREE.Color(col); return g; }
function doorMeshes(id) {
  if (doorFx[id].length || !W.MAPS[id] || !W.MAPS[id].group) return;
  const grp = W.MAPS[id].group;
  for (const D of DOORS[id]) {
    const m = new THREE.Group();
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, b = new THREE.Mesh(RW.geoSphere(1.6, 12, 10), RW.lam(id === 'shroomcave' ? 0xb88ae0 : 0xffffff, null, { emissive: id === 'shroomcave' ? 0x2a1a3a : 0x3a3a4a })); b.position.set(Math.cos(a) * D.r * 0.55, 1.4 + (i % 3) * 0.7, Math.sin(a) * D.r * 0.55); b.scale.set(1.2, 1, 1.2); m.add(b); }
    m.position.set(D.x, W.height(D.x, D.z), D.z); grp.add(m); doorFx[id].push(m);
  }
}
function setDoor(id, i, open) { const D = DOORS[id][i]; if (!D || D.open === open) return; D.open = open; if (doorFx[id][i]) doorFx[id][i].visible = !open; if (open) { sfx.appear && sfx.appear(); G.spawnRing(V3(D.x, W.height(D.x, D.z), D.z), LAMP[id][0], 5, 0.8); } }
const dSpots = [];
function resetDungeon(id) { for (let i = 0; i < 3; i++) { DOORS[id][i].open = true; setDoor(id, i, false); } puz[id] = { lit: [], t: 0 }; for (const s of dSpots) if (s.dungeon === id) A.fireOn(s, false); }
function roomClear(id, room, door) {
  if (DOORS[id][door].open) return true;
  const r = D0.LANDS[id].rooms[room];
  const left = G.monsters.filter((m) => m.alive && !m.k.boss && Math.hypot(m.pos.x - r.x, m.pos.z - r.z) < r.r + 4).length;
  if (left) { UI.toast(T('It will not light while ' + left + ' monster' + (left > 1 ? 's are' : ' is') + ' still in this room.', 'Tidak mau menyala selama masih ada ' + left + ' monster di ruangan ini.')); return false; }
  setDoor(id, door, true); UI.toast(T('The way to the deepest hall is open. Something big is waiting...', 'Jalan ke aula terdalam terbuka. Sesuatu yang besar menunggu...'), true);
  return true;
}
function makeSpots() {
  for (const s of dSpots.splice(0)) G.removeSpot(s.id);
  for (const id of ['shroomcave', 'skypalace']) {
    const R0 = D0.LANDS[id].rooms, col = LAMP[id][0], name = LAMP[id][1];
    const add = (sid, x, z, label, fn) => { const sp = { id: sid, dungeon: id, model: lampModel(col) }; Object.assign(sp, G.addSpot({ id: sid, x, z, label, model: sp.model, range: 2.4, onUse: () => fn(sp) })); dSpots.push(sp); return sp; };
    add(id + '_l1', R0[1].x - 4, R0[1].z - 8, name, (sp) => { A.fireOn(sp, true); if (!DOORS[id][0].open) { setDoor(id, 0, true); UI.toast(T('The light makes the wall move aside!', 'Cahayanya membuat dinding bergeser!'), true); } });
    for (let i = 0; i < 3; i++) { const a = -0.9 + i * 0.9; add(id + '_l' + (i + 2), R0[2].x + Math.sin(a) * 13, R0[2].z - Math.cos(a) * 13, name, (sp) => {
      const Z = puz[id]; if (DOORS[id][1].open || sp.on) return;
      A.fireOn(sp, true); Z.lit.push(i); Z.t = 15; sfx.point && sfx.point();
      if (Z.lit.length >= 3) { setDoor(id, 1, true); Z.t = 0; UI.toast(T('All three lamps shine! The wall opens.', 'Ketiga lampu bersinar! Dindingnya terbuka.'), true); }
      else UI.toast(T('Quick! The light only lasts 15 seconds. Light the others!', 'Cepat! Cahayanya cuma tahan 15 detik. Nyalakan yang lain!'));
    }); }
    add(id + '_l5', R0[3].x + 3, R0[3].z + 9, T('Big ', 'Besar: ') + name, (sp) => { if (roomClear(id, 3, 2)) A.fireOn(sp, true); });
  }
}
function tickDungeons(dt) {
  for (const id of ['shroomcave', 'skypalace']) {
    const Z = puz[id];
    if (Z.t > 0 && !DOORS[id][1].open) { Z.t -= dt; if (Z.t <= 0) { Z.lit = []; for (const s of dSpots) if (s.dungeon === id && /_l[234]$/.test(s.id)) A.fireOn(s, false); UI.toast(T('The lamps went out. Try faster!', 'Lampunya padam. Coba lebih cepat!')); } }
  }
}

// ======================================================================= bosses
Object.assign(KINDS.mother_morel, A.bossBrain({
  gap: 6.5, calls: [0.66, 0.33],
  intro: () => T('Hold your breath! Purple clouds are sleepy spores. Get out of the red circles!', 'Tahan napas! Awan ungu itu spora ngantuk. Keluar dari lingkaran merah!'),
  call(m) { UI.toast(T('<b>Yawn!</b> Mother Morel calls her Sporebats!', '<b>Menguap!</b> Mother Morel memanggil Sporebat!'), true); for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; const c = G.spawnMonster('sporebat', 36, m.pos.x + Math.cos(a) * 7, m.pos.z + Math.sin(a) * 7); c.quest = true; c.aggro = true; } },
  attack(m, hp) { const pl = G.player, n = hp < 0.5 ? 4 : 2; for (let k = 0; k < n; k++) A.warn(pl.pos.x + (k ? rnd(-6, 6) : 0), pl.pos.z + (k ? rnd(-6, 6) : 0), 3.2, 1.4 + k * 0.15, m.st.dmg[1] * 1.2, false); }
}));
Object.assign(KINDS.storm_king, A.bossBrain({
  gap: 5.5, calls: [0.75, 0.5, 0.25],
  intro: () => T('Lightning comes down where the red circles are. KEEP MOVING! And drink potions!', 'Petir turun di lingkaran merah. TERUS BERGERAK! Dan minum ramuan!'),
  call(m) { UI.toast(T('<b>THUNDER!</b> The Storm King calls his Galehawks!', '<b>GELEDEK!</b> Raja Badai memanggil Galehawk!'), true); for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; const c = G.spawnMonster('galehawk', 47, m.pos.x + Math.cos(a) * 7, m.pos.z + Math.sin(a) * 7); c.quest = true; c.aggro = true; } },
  attack(m, hp) { const pl = G.player, n = hp < 0.5 ? 6 : 4; for (let k = 0; k < n; k++) A.warn(pl.pos.x + (k ? rnd(-7, 7) : 0), pl.pos.z + (k ? rnd(-7, 7) : 0), 2.8, 1.2 + k * 0.12, m.st.dmg[1] * 1.15, false); }
}));

// ======================================================================= the Challenge Tower
const TW = L2.TW, towerKinds = () => Object.keys(KINDS).filter((k) => { const K0 = KINDS[k]; return !K0.boss && K0.drops && K0.baseLv && !K0.dummy && RW.MONSTER_BUILD[k] && K0.area && K0.hp > 30; });
let run = null; // { floor, mobs:[], wait }
function towerTalk(n) {
  const p = P(); p.tower = p.tower || { best: 0 };
  const best = p.tower.best || 0, inTower = W.active === 'tower';
  if (!inTower && p.lv < 30) { UI.say([Lsay(n, 'The Challenge Tower is for heroes of Lv. 30 and up. Every floor is harder than the last. Come back when you are stronger!', 'Menara Tantangan untuk pahlawan Lv. 30 ke atas. Setiap lantai lebih sulit dari sebelumnya. Kembali saat kamu lebih kuat!')], [{ label: T('Okay!', 'Oke!'), run: bye }]); return; }
  const acts = [];
  const go = (f) => () => { bye(); startRun(f); };
  if (run) acts.push({ label: T('Leave the tower', 'Keluar menara'), run: () => { bye(); endRun(T('You left the tower.', 'Kamu keluar dari menara.')); G.travel('sunhaven', -1700, 740, Math.PI, 'gate'); } });
  else {
    acts.push({ label: T('Start at floor 1', 'Mulai dari lantai 1'), run: go(1) });
    const cp = Math.floor(best / 5) * 5; if (cp >= 5) acts.push({ label: T('Start at floor ', 'Mulai dari lantai ') + (cp + 1), run: go(cp + 1) });
  }
  acts.push({ label: T('Not now', 'Nanti saja'), soft: true, run: bye });
  UI.say([Lsay(n, 'Welcome to the Challenge Tower. Clear every monster on a floor to climb to the next. Every 5th floor gives crystals, every 10th a ruby and a guardian. Your best: floor ' + best + '.', 'Selamat datang di Menara Tantangan. Kalahkan semua monster di satu lantai untuk naik ke lantai berikutnya. Setiap lantai ke-5 memberi kristal, setiap lantai ke-10 ruby dan penjaga. Rekormu: lantai ' + best + '.')], acts);
}
function startRun(floor) {
  if (W.active !== 'tower') { G.travel('tower', TW.cx + 42, TW.cz, -Math.PI / 2, 'gate'); setTimeout(() => startRun(floor), 1200); return; }
  run = { floor, mobs: [], wait: 1.5 };
  UI.banner(T('Challenge Tower', 'Menara Tantangan'), T('Floor ', 'Lantai ') + floor);
}
function spawnFloor() {
  const f = run.floor, lv = Math.min(55, 8 + f * 2), boss = f % 10 === 0;
  let pool = towerKinds().filter((k) => Math.abs(KINDS[k].baseLv - lv) <= 4);
  if (!pool.length) pool = towerKinds().sort((a, b) => Math.abs(KINDS[a].baseLv - lv) - Math.abs(KINDS[b].baseLv - lv)).slice(0, 4);
  const n = boss ? 3 : Math.min(7, 3 + Math.floor(f / 5));
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + rnd(0, 0.5), r = rnd(8, 18), kind = pool[Math.floor(Math.random() * pool.length)];
    const m = G.spawnMonster(kind, lv, TW.cx + Math.cos(a) * r, TW.cz + Math.sin(a) * r); if (!m) continue;
    m.quest = true; m.tower = true; m.aggro = true; run.mobs.push(m);
  }
  if (boss) {
    const kind = pool[Math.floor(Math.random() * pool.length)], m = G.spawnMonster(kind, lv + 3, TW.cx - 10, TW.cz);
    if (m) { m.quest = true; m.tower = true; m.aggro = true; m.st.hp *= 6; m.hp = m.st.hp; if (m.p && m.p.root) m.p.root.scale.multiplyScalar(1.6); m.towerBoss = true; run.mobs.push(m); UI.toast(T('<b>A tower guardian appears!</b>', '<b>Penjaga menara muncul!</b>'), true); }
  }
}
function floorClear() {
  const p = P(), f = run.floor;
  p.tower = p.tower || { best: 0 };
  if (f > (p.tower.best || 0)) p.tower.best = f;
  const coins = 40 * f, exp = Math.round(300 * f * (1 + f * 0.08));
  G.addCoins(coins); G.gainExp(exp);
  const items = []; if (f % 5 === 0) items.push(['forge_crystal', 2 + Math.floor(f / 5)]); if (f % 10 === 0) items.push(['ruby', Math.ceil(f / 10)], ['tower_token', 1]);
  for (const [id, k] of items) G.bagAdd(id, k);
  UI.toast(T('<b>Floor ' + f + ' clear!</b> +' + coins + ' coins', '<b>Lantai ' + f + ' selesai!</b> +' + coins + ' koin') + items.map(([id, k]) => ', ' + k + ' × ' + esc(ITEMS[id].name)).join(''), true);
  if (f >= 10) A.addTitle('Tower Climber'); if (f >= 30) A.addTitle('Tower Master');
  sfx.questDone && sfx.questDone();
  G.save();
  run.floor++; run.mobs = []; run.wait = 4;
  setTimeout(() => { if (run) UI.banner(T('Floor ', 'Lantai ') + run.floor, T('Get ready!', 'Bersiap!')); }, 1500);
}
function endRun(msg) { if (!run) return; for (const m of run.mobs) if (m.alive && !m.gone) G.removeMonster(m); run = null; if (msg) UI.toast(msg); }
function tickTower(dt) {
  if (!run) return;
  if (W.active !== 'tower') { endRun(); return; }
  if (G.player.dead) { const f = run.floor; endRun(T('You fell on floor ' + f + '. Rest, then try again!', 'Kamu jatuh di lantai ' + f + '. Istirahat, lalu coba lagi!')); return; }
  if (run.wait > 0) { run.wait -= dt; if (run.wait <= 0) spawnFloor(); return; }
  if (run.mobs.length && run.mobs.every((m) => !m.alive)) floorClear();
}

// ======================================================================= paper map, events, frame loop
if (RW.lands && RW.lands.groups) {
  RW.lands.groups.push({ ids: ['sunhaven', 'glowmarsh', 'fenwood', 'lilybog', 'shroomcave', 'tower'], bg: 'rgba(110,150,110,.35)', title: () => T('Sunhaven and the Glow Marsh', 'Sunhaven dan Glow Marsh'),
    col: { sunhaven: ['#a8d880', '#3f6a2f'], glowmarsh: ['#6a8a5a', '#2a3a2a'], fenwood: ['#4a6a4a', '#1f3a2a'], lilybog: ['#7a9a7a', '#2f4a3a'], shroomcave: ['#7a6a8a', '#3a2a42'], tower: ['#9a9ab0', '#3a3a4a'] } });
  RW.lands.groups.push({ ids: ['cloudisle', 'windspire', 'starfield', 'skypalace'], bg: 'rgba(230,240,255,.6)', title: () => T('The Sky Kingdom', 'Kerajaan Langit'),
    col: { cloudisle: ['#b8e890', '#4f8a3a'], windspire: ['#c8d8a0', '#5a6a4a'], starfield: ['#8a8ac8', '#3a3a6a'], skypalace: ['#fff8e0', '#8a7a4a'] } });
}
RW.on('enter', () => {
  const p = P(); if (!p) return;
  makeSpots();
  for (const id of ['shroomcave', 'skypalace']) { if (W.active === id) doorMeshes(id); resetDungeon(id); }
  setTimeout(() => { if (P() === p && qDone('mq41') && S.qs && !S.qs('mq42')) S.startQuest('mq42'); }, 4500);
});
RW.on('leave', () => { endRun(); });
RW.on('map', (id) => {
  if (id === 'shroomcave' || id === 'skypalace') { doorMeshes(id); resetDungeon(id); }
  if (id !== 'tower') endRun();
  const p = P(); if (!p) return;
  if (id === 'sunhaven' && !p.story.sawSun) { p.story.sawSun = true; setTimeout(() => ollySay(T('WOW. Look at all those houses! And a castle! And a fountain! I want to live here. For a day.', 'WAH. Lihat rumah-rumah itu! Dan istana! Dan air mancur! Aku mau tinggal di sini. Sehari saja.'), 'surprised'), 1600); }
  if (id === 'cloudisle' && !p.story.sawSky) { p.story.sawSky = true; setTimeout(() => ollySay(T('We are standing on an island above the clouds. Do NOT look down. I looked down.', 'Kita berdiri di pulau di atas awan. JANGAN lihat ke bawah. Aku sudah lihat ke bawah.'), 'worried'), 1600); }
});
RW.on('kill', (m) => { if (m.k.boss && (m.kind === 'mother_morel' || m.kind === 'storm_king')) { A.clearRings(); const p = P(); if (p) { p.story[m.kind + 'Down'] = true; G.save(); } } });
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  try { if (P() && G.mode === 'play') { tickDungeons(dt); tickTower(dt); } } catch (e) { console.error(e); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
RW.adventure2 = { startRun, endRun, get run() { return run; }, resetDungeon, setDoor, puz, debugTick: (dt) => { tickDungeons(dt); tickTower(dt); } };
})();
