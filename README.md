# Russel World

Game petualangan 3D yang imut, dimainkan langsung di browser. Ada hero, job, pet, monster, gear, quest, Chapter 1 sampai King Leaflet, Chapter 2 (pulau Coralcove, Gua Pasang) dan Chapter 3 (tanah salju, Gua Es). Juga mancing, meja racik, pet dewasa, dan pet ranger/tank.

A cute 3D adventure game that runs in the browser: heroes, jobs, pets, monsters, gear, quests, Chapter 1 up to King Leaflet, Chapter 2 (Coralcove islands, Tide Cave) and Chapter 3 (snow lands, Ice Cave). Plus fishing, crafting, adult pets and ranger/tank pets.

Versi / Version: v1.4

## Cara main / How to play

- Buka `index.html` lewat web server, misalnya GitHub Pages (lihat di bawah).
- Klik tanah untuk jalan, klik monster untuk menyerang.
- Tombol 1–6: skill dan potion. R: jurus pamungkas (ultimate).
- B: tas, C: stats, J: buku quest, G: equipment, P: pet, K: buku monster, M: peta, X: duduk, T: auto hunt.

## Main online gratis dengan GitHub Pages

1. Upload semua isi folder ini ke repository GitHub. `index.html` harus ada di paling atas, jangan di dalam subfolder.
2. Di repository, buka **Settings → Pages**.
3. Di **Source**, pilih **Deploy from a branch**. Pilih branch `main`, folder `/ (root)`, lalu **Save**.
4. Tunggu 1–2 menit. Link game muncul di halaman itu, bentuknya `https://namaanda.github.io/nama-repo/`.

## Catatan / Notes

- Save game tersimpan di browser masing-masing pemain (localStorage).
- Save di cloud cuma jalan di versi Claude. Di GitHub, game tetap menyimpan di perangkat.
- Butuh internet untuk memuat three.js (cdnjs) dan font Fredoka (Google Fonts).

## Isi folder / Files

| File | Isi / Contents |
|---|---|
| `index.html` | Halaman game, tampilan, dan gaya (CSS) |
| `js/engine.js` | Dasar 3D, kamera, alat bantu |
| `js/data.js` | Data item, monster, job, pet, title |
| `js/models.js` | Model 3D hero, NPC, monster, pet |
| `js/world.js` | Dunia, area, dan peta |
| `js/game.js` | Inti permainan: bertarung, level, skill |
| `js/ui.js` | Menu: tas, stats, toko |
| `js/gear.js` | Equipment dan pandai besi Bolt |
| `js/pets.js` | Pet: telur, merawat, ikut bertarung |
| `js/jobs.js` | Job dan skill |
| `js/story.js` | Quest, cerita, Olly |
| `js/explore.js` | Peti harta, buku monster, peta dunia |
| `js/river.js` | Riverside, Thornbush, boss Old Rootling |
| `js/cave.js` | Pebble Cave, boss King Leaflet |
| `js/sky.js` | Siang-malam dan cuaca |
| `js/settings.js` | Pengaturan, bahasa, salon, save cloud |
| `js/menu.js` | Layar judul dan pembuatan hero |
| `js/comic.js` | Komik pembuka |
| `js/audio.js` | Musik dan efek suara |
