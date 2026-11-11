// Russel World: the opening comic. Six panels drawn from the real 3D world (and one legend scene),
// shown one by one on a paper page, each picture drifting slowly. Always skippable.
(function () {
'use strict';
const RW = window.RW;
if (!RW || RW.failed || !RW.G || !RW.world) return;
const { THREE, scene, renderer, V3 } = RW;
const W = RW.world, G = RW.G, sfx = RW.audio.sfx;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- posing a hero for a picture ----------
function pose(c, A) {
  const j = c.j, d = { hipL: 0.02, hipR: -0.02, kneeL: 0.06, kneeR: 0.06, armLx: 0.05, armRx: -0.04, armLz: 0.16, armRz: -0.15, elL: -0.32, elR: -0.42, twist: 0, lean: 0.04, headX: 0, headY: 0, headZ: 0, stick: 2.2 };
  A = Object.assign(d, A);
  j.hipL.rotation.x = A.hipL; j.hipR.rotation.x = A.hipR; j.kneeL.rotation.x = A.kneeL; j.kneeR.rotation.x = A.kneeR;
  j.armL.rotation.set(A.armLx, 0, A.armLz); j.armR.rotation.set(A.armRx, 0, A.armRz); j.elbowL.rotation.x = A.elL; j.elbowR.rotation.x = A.elR;
  j.upper.rotation.set(A.lean, A.twist, 0); if (j.weapon) j.weapon.rotation.x = A.stick;
  j.head.rotation.set(A.headX, A.headY, A.headZ);
}
function face(c, expr) { if (c.j.faceMat) { c.j.faceMat.map = RW.faceVariant(c.opts, expr); c.j.faceMat.needsUpdate = true; } }
function heroModel() { return RW.chibi(RW.lookOpts(G.p.look)); }
function leaflet(faceName, scale) { const p = RW.MONSTER_BUILD.leaflet(); p.mat.map = p.faces[faceName]; p.root.scale.setScalar(scale || 0.72); return p; }
function berryBunch() { const g = new THREE.Group(), m = new THREE.MeshLambertMaterial({ color: 0xffb43d, emissive: 0x9a6010 }); for (const [x, y, z] of [[-0.09, 0, 0], [0.09, 0, 0.02], [0, 0.12, -0.02]]) { const b = new THREE.Mesh(RW.geoSphere(0.11, 10, 8), m); b.position.set(x, y, z); g.add(b); } const gl = RW.glow(1.2); gl.material.opacity = 0.75; g.add(gl); return g; }
function lights(sc) { sc.add(new THREE.HemisphereLight(0xfff3dc, 0xb3a184, 0.74)); const sun = new THREE.DirectionalLight(0xfff0d4, 0.55); sun.position.copy(RW.SUN_DIR).multiplyScalar(100); sc.add(sun); }
const yAt = (x, z) => W.height(x, z);

// ---------- the six pictures ----------
// each returns { sc, cam, done } where done() removes anything added to the world
const SHOTS = [
  function legend() {
    const sc = new THREE.Scene(); sc.fog = new THREE.Fog(0xffe2a8, 60, 175); lights(sc);
    sc.background = RW.canvasTex(32, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffc66b'); gr.addColorStop(0.55, '#ffe6ad'); gr.addColorStop(1, '#f6c58a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, null);
    const sun = RW.glow(16); sun.position.set(-1.5, 4.6, -14); sun.material.color.set(0xfff6d8); sc.add(sun);
    const sun2 = RW.glow(7); sun2.position.set(-1.5, 4.6, -13.9); sc.add(sun2);
    const hill = new THREE.Mesh(RW.geoSphere(6, 32, 16), RW.lam(0x86b85a)); hill.scale.set(1.3, 0.35, 1); hill.position.set(0, -1.6, 0); sc.add(hill);
    for (const [x, z, s] of [[-6, -9, 1.4], [5.5, -10, 1.1], [9, -6, 1.6]]) { const h = new THREE.Mesh(RW.geoSphere(4 * s, 20, 10), RW.lam(0x9cc46c)); h.scale.set(1.4, 0.45, 1); h.position.set(x, -1.2, z); sc.add(h); }
    const r = RW.chibi({ gender: 'boy', hair: 'spiky', hairColor: '#d9a441', iris: '#5a3a22', outfit: 'warrior', weapon: 'statue', brows: 'thick', mouth: 'grin' });
    r.root.position.set(0, 0.5, 0); r.root.rotation.y = 0.35; sc.add(r.root);
    for (const [x, z] of [[-2.6, 1.4], [2.4, 1.8], [-3.6, -0.6]]) { const p = leaflet('hurt', 0.5); p.root.position.set(x, -0.05, z); p.root.rotation.y = x < 0 ? -0.9 : 0.9; sc.add(p.root); }
    const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 400); cam.position.set(0.9, 0.95, 4.0); cam.lookAt(0, 1.55, 0);
    return { sc, cam, done() {} };
  },
  function dusk() {
    const sun = RW.glow(46); sun.material.color.set(0xffd9a0); sun.material.opacity = 0.75; sun.position.set(-40, 26, 160); scene.add(sun);
    const cam = new THREE.PerspectiveCamera(42, 1, 0.3, 1200); cam.position.set(9, 7.5, -72); cam.lookAt(0, 3.2, -10);
    return { sc: scene, cam, done() { scene.remove(sun); } };
  },
  function morning() {
    const hx = -23, hz = 21, d = V3(-hx, 0, -hz).normalize();
    const x = hx + d.x * 4.2, z = hz + d.z * 4.2, c = heroModel();
    c.root.position.set(x, yAt(x, z), z); c.root.rotation.y = Math.atan2(d.x, d.z) - 0.4; scene.add(c.root);
    pose(c, { armLx: 2.85, armRx: 2.85, armLz: 0.35, armRz: -0.35, elL: -0.5, elR: -0.5, stick: 4.2, lean: -0.14, headX: -0.3, headZ: 0.08 }); face(c, 'yawn');
    const cam = new THREE.PerspectiveCamera(38, 1, 0.3, 1200);
    const side = V3(d.z, 0, -d.x);
    cam.position.set(x + d.x * 5.6 + side.x * 1.6, yAt(x, z) + 1.7, z + d.z * 5.6 + side.z * 1.6); cam.lookAt(x - d.x * 0.6, yAt(x, z) + 1.3, z - d.z * 0.6);
    return { sc: scene, cam, done() { scene.remove(c.root); } };
  },
  function raid() {
    const added = [];
    const spots = [[34.6, -63.2, 'normal'], [37.4, -62.2, 'normal'], [39.2, -64.6, 'angry'], [36.2, -65.6, 'normal']];
    spots.forEach(([x, z, f], i) => { const p = leaflet(f, 0.72); p.root.position.set(x, yAt(x, z), z); p.root.rotation.y = -0.35 + i * 0.22; p.body.position.y = i % 2 ? 0.25 : 0; scene.add(p.root); added.push(p.root); if (i === 1 || i === 3) { const b = berryBunch(); b.position.set(x, yAt(x, z) + 1.5 + p.body.position.y, z); scene.add(b); added.push(b); } });
    const cam = new THREE.PerspectiveCamera(42, 1, 0.3, 1200); cam.position.set(36.4, 3.0, -56.2); cam.lookAt(36.8, 0.9, -64.2);
    return { sc: scene, cam, done() { for (const o of added) scene.remove(o); } };
  },
  function stuck() {
    const b = W.OLLY_BUSH, gy = yAt(b.x, b.z), added = [];
    const o = RW.olly(); o.root.scale.setScalar(0.62); o.root.position.set(b.x + 0.95, gy + 0.35, b.z + 0.75); o.root.rotation.set(0.3, 0.6, 0.2); o.setFace('worried'); o.shadow.visible = false;
    for (const w of o.wings) w.pivot.rotation.z = w.s * 1.0;
    scene.add(o.root); added.push(o.root);
    // the panel is narrow, so the Leaflets stand close to the line between the camera and Olly
    for (const [dx, dz, f] of [[1.3, 2.35, 'angry'], [0.4, 1.15, 'angry']]) { const p = leaflet(f, 0.45); p.root.position.set(b.x + dx, yAt(b.x + dx, b.z + dz), b.z + dz); p.root.rotation.y = Math.atan2(b.x + 0.95 - (b.x + dx), b.z + 0.75 - (b.z + dz)) + 0.5; scene.add(p.root); added.push(p.root); }
    const cam = new THREE.PerspectiveCamera(40, 1, 0.3, 1200); cam.position.set(b.x + 1.6, gy + 1.15, b.z + 3.7); cam.lookAt(b.x + 0.95, gy + 0.62, b.z + 0.75);
    return { sc: scene, cam, done() { for (const x of added) scene.remove(x); } };
  },
  function ready() {
    const x = 1.5, z = 7, c = heroModel();
    c.root.position.set(x, yAt(x, z), z); c.root.rotation.y = 0.25; scene.add(c.root);
    pose(c, { armRx: 2.95, armRz: -0.28, elR: -0.15, stick: 3.7, armLx: 1.15, armLz: 0.3, elL: -1.95, lean: -0.1, headX: -0.16, twist: -0.18, hipL: -0.12, hipR: 0.16, kneeL: 0.12 }); face(c, 'determined');
    const cam = new THREE.PerspectiveCamera(42, 1, 0.3, 1200); cam.position.set(x + 0.9, yAt(x, z) + 0.75, z + 3.1); cam.lookAt(x, yAt(x, z) + 1.55, z);
    return { sc: scene, cam, done() { scene.remove(c.root); } };
  }
];
// words on each panel ({hero} becomes the hero's name)
const TEXT = [
  { cap: 'Long ago, the hero Russel drove back the darkness and saved our world.', cap2: 'People named it after him: Russel World.', sparks: [[30, 22], [38, 14], [24, 30], [44, 26]], tint: 'legend' },
  { cap: 'But lately the sun grows weaker every day. The nights grow longer. Nobody knows why.', tint: 'dusk' },
  { cap: 'Mossbrook. An ordinary morning for an ordinary kid named {hero}.', bub: { text: '*yaaawn*', x: 54, y: 30, tx: '20%' } },
  { cap2: '...until the Leaflets raided the village garden. Again.', bub: { text: 'Hee-hee! Sunberries!', x: 30, y: 12, tx: '40%' } },
  { bub: { text: 'Hoo! Help! My scarf is stuck!', x: 10, y: 10, tx: '55%' }, bub2: { text: 'Bump! Bump!', x: 8, y: 58, tx: '60%' } },
  { cap: 'Somebody had to do something.', cap2: 'Grab your stick, {hero}!', sparks: [[44, 18], [52, 12], [38, 24]] }
];
const PAGES = [{ cols: '1.25fr 1fr 1fr', panels: [0, 1, 2], rot: [-0.6, 0.5, -0.4] }, { cols: '1fr 1.2fr 1fr', panels: [3, 4, 5], rot: [0.4, -0.5, 0.6] }];

// ---------- rendering a picture into an image ----------
function snap(sc, cam, w, h) {
  const SS = 1.5, w2 = Math.max(64, Math.round(w * SS)), h2 = Math.max(64, Math.round(h * SS));
  const rt = new THREE.WebGLRenderTarget(w2, h2);
  cam.aspect = w / h; cam.updateProjectionMatrix();
  renderer.setRenderTarget(rt); renderer.render(sc, cam);
  const buf = new Uint8Array(w2 * h2 * 4); renderer.readRenderTargetPixels(rt, 0, 0, w2, h2, buf);
  renderer.setRenderTarget(null); rt.dispose();
  const big = document.createElement('canvas'); big.width = w2; big.height = h2;
  const g = big.getContext('2d'), img = g.createImageData(w2, h2);
  for (let y = 0; y < h2; y++) img.data.set(buf.subarray((h2 - 1 - y) * w2 * 4, (h2 - y) * w2 * 4), y * w2 * 4);
  g.putImageData(img, 0, 0);
  const out = document.createElement('canvas'); out.width = Math.round(w); out.height = Math.round(h);
  const o = out.getContext('2d'); o.imageSmoothingQuality = 'high'; o.drawImage(big, 0, 0, out.width, out.height);
  return out.toDataURL('image/jpeg', 0.9);
}
function panelSizes() {
  const vw = window.innerWidth, vh = window.innerHeight, small = vh <= 560;
  const pw = Math.min(1180, vw - 32), ph = Math.min(640, vh - (small ? 96 : 88)), gap = Math.max(8, Math.min(16, vw * 0.016));
  const sizes = [];
  for (const pg of PAGES) {
    const fr = pg.cols.split(' ').map(parseFloat), sum = fr.reduce((a, b) => a + b, 0);
    pg.panels.forEach((p, i) => { sizes[p] = { w: (pw - gap * 2) * fr[i] / sum * 1.14, h: ph * 1.14 }; });
  }
  return sizes;
}

// ---------- the page ----------
let open = false, idx = -1, onDone = null, images = [], pageNo = -1, busyT = 0;
function buildPage(n) {
  pageNo = n; const pg = PAGES[n], el = $('cmPage');
  el.style.gridTemplateColumns = pg.cols; el.innerHTML = '';
  pg.panels.forEach((p, i) => {
    const t = TEXT[p], name = G.p ? G.p.name : '';
    const fill = (s) => esc(s.replace(/\{hero\}/g, name));
    const d = document.createElement('div'); d.className = 'cm-panel'; d.style.setProperty('--r', pg.rot[i] + 'deg');
    let html = '<div class="cm-img" style="background-image:url(' + images[p] + ');' + (t.tint === 'legend' ? 'filter:sepia(.6) saturate(1.3) contrast(1.05)' : t.tint === 'dusk' ? 'filter:brightness(.8) saturate(.75) hue-rotate(-14deg)' : '') + ';animation-delay:-' + (i * 3) + 's"></div>';
    if (t.tint === 'dusk') html += '<div class="cm-tint" style="background:linear-gradient(180deg,rgba(70,55,140,.5),rgba(70,55,140,.12) 55%,rgba(255,160,90,.18))"></div>';
    if (t.tint === 'legend') html += '<div class="cm-tint" style="background:radial-gradient(ellipse at 50% 50%,rgba(0,0,0,0) 55%,rgba(90,55,20,.35) 100%)"></div>';
    for (const [x, y] of t.sparks || []) html += '<span class="cm-spark" style="left:' + x + '%;top:' + y + '%;animation-delay:' + (-(x * 37 % 16) / 10) + 's"></span>';
    if (t.cap) html += '<div class="cm-cap">' + fill(t.cap) + '</div>';
    if (t.cap2) html += '<div class="cm-cap bottom">' + fill(t.cap2) + '</div>';
    for (const b of [t.bub, t.bub2]) if (b) html += '<div class="cm-bub" style="left:' + b.x + '%;top:' + b.y + '%;--tx:' + b.tx + '">' + fill(b.text) + '</div>';
    d.innerHTML = html; d.dataset.p = p; el.appendChild(d);
  });
}
function next() {
  if (!open || busyT > 0) return;
  idx++;
  if (idx >= TEXT.length) { finish(); return; }
  const n = idx < 3 ? 0 : 1;
  if (n !== pageNo) buildPage(n);
  const el = $('cmPage').querySelector('[data-p="' + idx + '"]');
  busyT = 0.25; setTimeout(() => { busyT = 0; }, 250);
  requestAnimationFrame(() => { if (el) el.classList.add('on'); });
  sfx.page();
  $('cmHint').textContent = idx === TEXT.length - 1 ? 'Tap to begin' : 'Tap to continue';
}
function finish() {
  if (!open) return;
  const fade = $('fade');
  fade.classList.add('on');
  setTimeout(() => {
    open = false; $('comic').hidden = true; $('cmPage').innerHTML = ''; images = [];
    const cb = onDone; onDone = null;
    if (cb) cb();
    setTimeout(() => fade.classList.remove('on'), 120);
  }, 560);
}
function play(cb) {
  onDone = cb; open = true; idx = -1; pageNo = -1;
  const sizes = panelSizes();
  G.setHeroVisible(false);
  try {
    images = SHOTS.map((fn, i) => { const s = fn(); try { return snap(s.sc, s.cam, sizes[i].w, sizes[i].h); } finally { s.done(); } });
  } catch (e) { console.error(e); images = []; }
  G.setHeroVisible(true);
  if (images.length !== SHOTS.length) { open = false; if (cb) cb(); return; }
  $('comic').hidden = false;
  next();
}
$('comic').addEventListener('click', (e) => { if (e.target.closest('#cmSkip')) return; next(); });
$('cmSkip').addEventListener('click', (e) => { e.stopPropagation(); sfx.click(); finish(); });
window.addEventListener('keydown', (e) => {
  if (!open) return;
  if (e.key === 'Escape') { e.preventDefault(); finish(); }
  else if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); next(); }
});
RW.comic = { play, get open() { return open; } };
})();
