// Russel World: characters, NPCs, monsters and item visuals. Built in code as stand-ins;
// every builder returns a plain object so a bought or commissioned model can replace it later.
(function () {
'use strict';
const RW = window.RW;
if (RW.failed) return;
const { THREE, V3, UP, ZAX, clamp, R, ctex, wrapped, ell, strokes, shade, lam, outlineMat, part, lathe, latheY, skinnedLimb, cachedGeo, geoSphere, geoCyl, geoCone, geoBox, bake, freeze, blob, glow } = RW;

// ---------- textures ----------
const hairTexFor = (hex) => ctex('hair' + hex, 128, 256, (g, w, h) => { g.fillStyle = hex; g.fillRect(0, 0, w, h); strokes(g, w, h, 160, [shade(hex, 0.75), shade(hex, 1.25), shade(hex, 0.88)], 40, 2, 0.8, R); g.fillStyle = 'rgba(255,240,220,.14)'; g.fillRect(0, h * 0.15, w, h * 0.12); }, [1, 1]);
const clothTexFor = (hex) => ctex('cloth' + hex, 256, 128, (g, w, h) => {
  g.fillStyle = hex; g.fillRect(0, 0, w, h);
  g.strokeStyle = shade(hex, 0.82); g.globalAlpha = 0.55; g.lineWidth = 2;
  for (let i = 0; i < 18; i++) { const x = R() * w; g.beginPath(); g.moveTo(x, h); g.quadraticCurveTo(x + 6, h * 0.5, x - 4, h * 0.2); g.stroke(); }
  g.globalAlpha = 1; g.fillStyle = shade(hex, 0.86); g.fillRect(0, 0, w, 8); g.fillRect(0, h - 8, w, 8);
}, null);
const vestTex = ctex('vest', 512, 256, (g, w, h) => {
  g.fillStyle = '#3f6fb0'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(20,40,80,.08)'; g.beginPath(); g.arc(R() * w, R() * h, 10 + R() * 30, 0, Math.PI * 2); g.fill(); }
  g.setLineDash([7, 6]); g.strokeStyle = 'rgba(230,240,255,.35)'; g.lineWidth = 2;
  for (let y = 46; y < h - 20; y += 48) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  g.setLineDash([]); g.fillStyle = '#2a4c80'; g.fillRect(0, h - 16, w, 16);
  g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.moveTo(w / 2 - 48, 0); g.lineTo(w / 2 + 48, 0); g.lineTo(w / 2 + 12, h); g.lineTo(w / 2 - 12, h); g.closePath(); g.fill(); g.globalCompositeOperation = 'source-over';
  g.strokeStyle = '#2a4c80'; g.lineWidth = 14; g.beginPath(); g.moveTo(w / 2 - 48, 0); g.lineTo(w / 2 - 12, h); g.moveTo(w / 2 + 48, 0); g.lineTo(w / 2 + 12, h); g.stroke();
  g.save(); g.translate(w / 2 + 92, 92); g.rotate(-0.6); g.fillStyle = '#6fae4a'; g.strokeStyle = '#2e4a1e'; g.lineWidth = 3; g.beginPath(); g.ellipse(0, 0, 22, 11, 0, 0, Math.PI * 2); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-20, 0); g.lineTo(20, 0); g.stroke(); g.restore();
}, null);
const leatherVestTex = ctex('lvest', 512, 256, (g, w, h) => {
  g.fillStyle = '#8a5a36'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 50; i++) { g.fillStyle = 'rgba(40,20,10,.1)'; g.beginPath(); g.arc(R() * w, R() * h, 6 + R() * 20, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#6b4226'; g.fillRect(w / 2 - 14, 0, 28, h);
  g.strokeStyle = '#efe0c0'; g.lineWidth = 4; g.lineCap = 'round';
  for (let y = 30; y < h - 20; y += 34) { g.beginPath(); g.moveTo(w / 2 - 12, y); g.lineTo(w / 2 + 12, y + 20); g.moveTo(w / 2 + 12, y); g.lineTo(w / 2 - 12, y + 20); g.stroke(); }
}, null);
const tassetTex = ctex('tasset', 256, 128, (g, w, h) => { g.fillStyle = '#7a4e30'; g.fillRect(0, 0, w, h); g.fillStyle = '#5a3820'; for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 4, h); g.fillStyle = '#b8c2cc'; for (let x = 14; x < w; x += 32) { g.beginPath(); g.arc(x, h - 18, 4, 0, Math.PI * 2); g.fill(); } }, null);
const shortsTex = ctex('shorts', 256, 128, (g, w, h) => {
  g.fillStyle = '#d6c49c'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(120,100,65,.6)'; g.lineWidth = 2; g.setLineDash([5, 4]); for (const x of [w / 2, 0, w, w / 4, (3 * w) / 4]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } g.setLineDash([]);
  g.fillStyle = '#c2ae83'; g.fillRect(w / 2 - 70, 20, 40, 26); g.fillRect(w / 2 + 30, 20, 40, 26); g.fillStyle = '#b8a477'; g.fillRect(0, h - 14, w, 14);
}, null);
const gloveTexFor = (hex) => ctex('glove' + hex, 128, 128, (g, w, h) => { g.fillStyle = hex; g.fillRect(0, 0, w, h); g.fillStyle = shade(hex, 1.25); g.fillRect(0, 0, w, 44); g.setLineDash([4, 4]); g.strokeStyle = shade(hex, 0.6); g.lineWidth = 2; g.beginPath(); g.moveTo(0, 40); g.lineTo(w, 40); g.moveTo(0, 6); g.lineTo(w, 6); g.stroke(); g.setLineDash([]); }, null);
const bootTexFor = (hex) => ctex('boot' + hex, 128, 128, (g, w, h) => { g.fillStyle = hex; g.fillRect(0, 0, w, h); g.fillStyle = shade(hex, 1.25); g.fillRect(0, 0, w, 26); g.fillStyle = shade(hex, 0.7); g.fillRect(0, 52, w, 12); g.fillRect(0, 86, w, 12); g.fillStyle = '#e3b343'; g.fillRect(w / 2 - 7, 50, 14, 16); g.fillRect(w / 2 - 7, 84, 14, 16); }, null);
const wrapBootTex = ctex('wrapboot', 128, 128, (g, w, h) => { g.fillStyle = '#7a5a3a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#e9dcc0'; g.lineWidth = 6; for (let y = 10; y < h; y += 22) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + 12); g.stroke(); } }, null);
const robeTexFor = (hex, trim, stars) => ctex('robe' + hex + trim + stars, 512, 256, (g, w, h) => {
  g.fillStyle = hex; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(0,0,0,.06)'; g.beginPath(); g.arc(R() * w, R() * h, 10 + R() * 30, 0, Math.PI * 2); g.fill(); }
  if (stars) { g.fillStyle = '#fff3b0'; for (let i = 0; i < 26; i++) { const x = R() * w, y = 20 + R() * (h - 60), s = 4 + R() * 4; g.beginPath(); for (let k = 0; k < 8; k++) { const r = k % 2 ? s * 0.4 : s, a = (k / 8) * Math.PI * 2; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.fill(); } }
  g.fillStyle = trim; g.fillRect(0, h - 22, w, 22); g.fillRect(w / 2 - 5, 0, 10, h);
}, null);
const bandanaTex = ctex('bandana', 256, 128, (g, w, h) => { g.fillStyle = '#f39a3d'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff6e0'; for (let y = 10; y < h; y += 24) for (let x = (y % 48 ? 0 : 12); x < w; x += 24) { g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill(); } }, null);
const eggTexFor = (spot) => ctex('egg' + spot, 256, 128, (g, w, h) => { g.fillStyle = '#fff6e0'; g.fillRect(0, 0, w, h); g.fillStyle = spot; for (let i = 0; i < 16; i++) ell(g, R() * w, 15 + R() * (h - 30), 8 + R() * 10, 6 + R() * 8); }, null);
const stickTex = ctex('stick', 64, 128, (g, w, h) => { g.fillStyle = '#c08a5a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 14; i++) { g.strokeStyle = 'rgba(90,55,30,.45)'; g.lineWidth = 1.5; const x = R() * w; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (R() - 0.5) * 6, h); g.stroke(); } }, null);
const rockTex = ctex('rock', 256, 256, (g, w, h) => {
  g.fillStyle = '#9a958c'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 160; i++) { const x = R() * w, y = R() * h, r = 4 + R() * 22, c = ['#86817a', '#aaa59b', '#7b766e', '#b5b0a5'][i % 4]; wrapped(w, h, (ox, oy) => { g.globalAlpha = 0.25; g.fillStyle = c; g.beginPath(); g.arc(x + ox, y + oy, r, 0, Math.PI * 2); g.fill(); }); }
  g.globalAlpha = 0.5; g.strokeStyle = '#6a655e'; g.lineWidth = 1.4;
  for (let i = 0; i < 18; i++) { let x = R() * w, y = R() * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (R() - 0.5) * 30; y += R() * 20; g.lineTo(x, y); } g.stroke(); }
  g.globalAlpha = 1;
}, [1, 1]);

// ---------- faces ----------
const HEAD_Y0 = -0.205, HEAD_Y1 = 0.242;
const FACE_CY = (1 - (-0.02 - HEAD_Y0) / (HEAD_Y1 - HEAD_Y0)) * 512;
function paintFaceG(g, w, h, o) {
  if (o.fill !== false) { g.fillStyle = o.skin; g.fillRect(0, 0, w, h); }
  g.save(); g.translate(o.cx, o.cy); g.scale(o.sx, o.sy);
  g.lineCap = 'round';
  g.fillStyle = 'rgba(240,143,128,0.32)'; ell(g, -80, 34, 27, 14); ell(g, 80, 34, 27, 14);
  for (const s of [-1, 1]) {
    const ex = s * 54;
    if (o.closed) {
      g.strokeStyle = '#2a1a10'; g.lineWidth = 6; g.beginPath(); g.moveTo(ex - 18, 0); g.quadraticCurveTo(ex, 11, ex + 18, 0); g.stroke();
    } else {
      g.fillStyle = '#ffffff'; ell(g, ex, 0, 17, 22);
      const gr = g.createLinearGradient(0, -18, 0, 20); gr.addColorStop(0, shade(o.iris, 0.6)); gr.addColorStop(1, shade(o.iris, 1.5));
      g.fillStyle = gr; ell(g, ex, 3, 13, 18);
      g.fillStyle = '#1b110a'; ell(g, ex, 4, 6.5, 9.5);
      g.fillStyle = '#ffffff'; ell(g, ex - 5, -6, 5, 5); ell(g, ex + 5, 10, 2.4, 2.4);
      g.strokeStyle = '#24160d'; g.lineWidth = 7; g.beginPath(); g.moveTo(ex - 19, -9); g.quadraticCurveTo(ex, -28, ex + 19, -12); g.stroke();
      g.lineWidth = 4; g.beginPath(); g.moveTo(ex + s * 18, -12); g.lineTo(ex + s * 26, -18); g.stroke();
      if (o.girl) { g.lineWidth = 3.5; g.beginPath(); g.moveTo(ex + s * 12, -18); g.lineTo(ex + s * 17, -26); g.stroke(); }
      g.lineWidth = 2; g.strokeStyle = 'rgba(42,26,16,.55)'; g.beginPath(); g.moveTo(ex - 12, 22); g.quadraticCurveTo(ex, 26, ex + 12, 21); g.stroke();
    }
    g.strokeStyle = o.browCol || '#5a3a22';
    if (o.brows === 'angry') { g.lineWidth = 6; g.beginPath(); g.moveTo(ex + s * 18, -50); g.lineTo(ex - s * 14, -38); g.stroke(); }
    else if (o.brows === 'thick') { g.lineWidth = 10; g.beginPath(); g.moveTo(ex + s * 18, -44); g.lineTo(ex - s * 16, -42); g.stroke(); }
    else if (o.brows === 'worried') { g.lineWidth = 5; g.beginPath(); g.moveTo(ex + s * 16, -38); g.lineTo(ex - s * 14, -48); g.stroke(); }
    else if (o.brows === 'up') { g.lineWidth = 5; g.beginPath(); g.moveTo(ex - 16, -50); g.quadraticCurveTo(ex, -62, ex + 16, -52); g.stroke(); }
    else if (o.brows !== 'none') { g.lineWidth = 5; g.beginPath(); g.moveTo(ex - 16, -40); g.quadraticCurveTo(ex, -48, ex + 16, -42); g.stroke(); }
  }
  g.strokeStyle = 'rgba(196,135,105,.85)'; g.lineWidth = 3; g.beginPath(); g.moveTo(2, 26); g.lineTo(-1, 31); g.stroke();
  if (o.mouth === 'open') { g.fillStyle = '#9a3a2e'; g.beginPath(); g.moveTo(-13, 42); g.quadraticCurveTo(0, 62, 13, 42); g.closePath(); g.fill(); g.fillStyle = '#e87a7a'; ell(g, 0, 52, 6, 3.5); }
  else if (o.mouth === 'grin') { g.fillStyle = '#ffffff'; g.strokeStyle = '#8a3b2f'; g.lineWidth = 3; g.beginPath(); g.moveTo(-18, 42); g.quadraticCurveTo(0, 60, 18, 42); g.closePath(); g.fill(); g.stroke(); }
  else if (o.mouth === 'o') { g.fillStyle = '#9a3a2e'; ell(g, 0, 48, 7, 9); g.fillStyle = '#e87a7a'; ell(g, 0, 53, 4, 2.5); }
  else if (o.mouth === 'flat') { g.strokeStyle = '#8a3b2f'; g.lineWidth = 4; g.beginPath(); g.moveTo(-10, 46); g.quadraticCurveTo(0, 43, 10, 46); g.stroke(); }
  else if (o.mouth === 'wobble') { g.strokeStyle = '#8a3b2f'; g.lineWidth = 3.5; g.beginPath(); g.moveTo(-10, 48); g.quadraticCurveTo(-5, 43, 0, 48); g.quadraticCurveTo(5, 53, 10, 48); g.stroke(); }
  else if (o.mouth !== 'none') { g.strokeStyle = '#8a3b2f'; g.lineWidth = 4; g.beginPath(); g.moveTo(-9, 44); g.quadraticCurveTo(0, 51, 9, 44); g.stroke(); }
  if (o.freckles) { g.fillStyle = 'rgba(170,100,60,.65)'; for (const s of [-1, 1]) for (const [dx, dy] of [[0, 0], [8, 5], [-7, 6], [3, 11]]) ell(g, s * 76 + dx, 22 + dy, 2.2, 2.2); }
  if (o.stubble) { g.fillStyle = 'rgba(120,60,30,.45)'; for (let i = 0; i < 60; i++) { const a = Math.PI * (0.15 + R() * 0.7), r = 55 + R() * 30; ell(g, Math.cos(a) * r * 1.1, 20 + Math.sin(a) * r * 0.75, 1.4, 1.4); } }
  g.restore();
}
function faceTex(o) {
  return ctex('face' + JSON.stringify(o), 1024, 512, (g, w, h) => {
    paintFaceG(g, w, h, Object.assign({ cx: 512, cy: FACE_CY, sx: 0.99, sy: 1.48 }, o));
    const gr = g.createLinearGradient(0, 0, 0, h * 0.5); gr.addColorStop(0, 'rgba(190,120,95,.22)'); gr.addColorStop(1, 'rgba(190,120,95,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h * 0.5);
  }, null);
}
// portrait for the HUD, painted with the same face as the 3D head
function paintPortrait(canvas, o) {
  const g = canvas.getContext('2d'), W = canvas.width, S = W / 112;
  g.save(); g.scale(S, S);
  g.fillStyle = '#cfe9f7'; g.fillRect(0, 0, 112, 112);
  g.fillStyle = o.skin; g.strokeStyle = '#3b2a1e'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(12, 56); g.quadraticCurveTo(12, 14, 56, 12); g.quadraticCurveTo(100, 14, 100, 56); g.quadraticCurveTo(98, 92, 56, 106); g.quadraticCurveTo(14, 92, 12, 56); g.closePath(); g.fill(); g.stroke();
  g.save(); g.beginPath(); g.arc(56, 60, 46, 0, Math.PI * 2); g.clip();
  paintFaceG(g, 112, 112, Object.assign({}, o, { cx: 56, cy: 64, sx: 0.5, sy: 0.5, fill: false })); g.restore();
  g.fillStyle = o.hairColor; g.strokeStyle = '#3b2a1e'; g.lineWidth = 3;
  const hs = o.hair || 'spiky';
  // hair that falls past the face is drawn first, behind the fringe
  if (hs === 'long') for (const s of [-1, 1]) { g.beginPath(); g.moveTo(56 + s * 40, 40); g.quadraticCurveTo(56 + s * 52, 80, 56 + s * 44, 112); g.lineTo(56 + s * 30, 112); g.quadraticCurveTo(56 + s * 36, 76, 56 + s * 30, 50); g.closePath(); g.fill(); g.stroke(); }
  if (hs === 'twin') for (const s of [-1, 1]) { g.beginPath(); g.ellipse(56 + s * 48, 64, 9, 20, s * 0.25, 0, Math.PI * 2); g.fill(); g.stroke(); g.save(); g.fillStyle = '#e8604c'; g.beginPath(); g.arc(56 + s * 46, 44, 5, 0, Math.PI * 2); g.fill(); g.stroke(); g.restore(); }
  if (hs === 'pony') { g.beginPath(); g.ellipse(98, 50, 9, 18, -0.5, 0, Math.PI * 2); g.fill(); g.stroke(); }
  g.beginPath(); g.moveTo(10, 66); g.quadraticCurveTo(8, 10, 56, 8); g.quadraticCurveTo(104, 10, 102, 66);
  if (hs === 'spiky') for (let x = 102; x > 10; x -= 15) g.lineTo(x - 7, 38 + (x % 2) * 2), g.lineTo(x - 15, 52);
  else for (let x = 100; x > 12; x -= 11) g.quadraticCurveTo(x - 3, 46, x - 11, 40 + ((x / 11) % 2) * 4);
  g.closePath(); g.fill(); g.stroke();
  g.restore();
}
// face texture for a chibi with an expression: normal, happy, surprised, worried
const EXPRESSIONS = {
  normal: {},
  happy: { closed: true, mouth: 'open' },
  surprised: { closed: false, brows: 'up', mouth: 'o' },
  worried: { brows: 'worried', mouth: 'wobble' },
  yawn: { closed: true, mouth: 'o' },
  determined: { brows: 'angry', mouth: 'smile' }
};
function faceVariant(o, expr) {
  const base = { skin: o.skin, iris: o.iris, girl: o.gender === 'girl', closed: !!o.closed, brows: o.brows, mouth: o.mouth, freckles: !!o.freckles, stubble: !!o.stubble };
  if (o.browCol) base.browCol = o.browCol;
  const ex = Object.assign({}, EXPRESSIONS[expr] || {});
  if (o.brows === 'none' && ex.brows) ex.browCol = '#f4f1ea'; // the elder's brows are white and hidden until he frowns or gasps
  if (o.mouth === 'none' && ex.mouth) delete ex.mouth;
  return faceTex(Object.assign(base, ex));
}
// a creator look ({gender, skin, hair, color} as indexes into RW.LOOKS) as chibi options
function lookOpts(look, job, weapon, gear) {
  const L = RW.LOOKS, l = look || {};
  const skin = (L.skins[l.skin] || L.skins[0])[1], hairColor = (L.colors[l.color] || L.colors[0])[1];
  const hair = L.hairs.some((h) => h[1] === l.hair) ? l.hair : 'spiky';
  const outfit = { warrior: 'warrior', archer: 'archer', mage: 'mage', robot: 'robot' }[job] || 'novice';
  return { gender: l.gender === 'girl' ? 'girl' : 'boy', skin, hair, hairColor, outfit, weapon: outfit === 'novice' ? 'stick' : weapon, gear: gear || null };
}
// an empty character slot: the same figure as a soft white see-through shape
const ghostMats = {};
function ghostify(c) {
  const mat = (skin) => ghostMats[skin] || (ghostMats[skin] = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.34, depthWrite: false, skinning: skin }));
  c.root.traverse((o) => {
    if (!o.isMesh) return;
    if (o.material && o.material.userData && o.material.userData.th != null) { o.visible = false; return; }
    if (o.material === RW.shadowMat) return;
    o.material = mat(!!o.isSkinnedMesh); o.renderOrder = 4;
  });
  if (c.j.faceMat) c.j.faceMat = null;
  return c;
}

// monster faces painted on spheres and cylinders: normal, angry, hurt, dizzy
function drawFace(g, cx, cy, U, ky, state) {
  g.save(); g.translate(cx, cy); g.scale(U, U * ky);
  const dark = '#24170f';
  g.fillStyle = state === 'angry' ? 'rgba(225,70,60,.5)' : 'rgba(255,135,135,.45)'; ell(g, -1.45, 0.62, 0.42, 0.22); ell(g, 1.45, 0.62, 0.42, 0.22);
  g.lineCap = 'round'; g.lineJoin = 'round';
  if (state === 'normal') {
    for (const s of [-1, 1]) { g.fillStyle = dark; ell(g, s * 0.9, 0, 0.3, 0.42); g.fillStyle = '#fff'; ell(g, s * 0.9 - 0.1, -0.16, 0.11, 0.11); }
    g.strokeStyle = dark; g.lineWidth = 0.13; g.beginPath(); g.moveTo(-0.32, 0.6); g.quadraticCurveTo(0, 0.92, 0.32, 0.6); g.stroke();
  } else if (state === 'angry') {
    for (const s of [-1, 1]) { g.fillStyle = dark; ell(g, s * 0.9, 0.05, 0.32, 0.26); g.fillStyle = '#fff'; ell(g, s * 0.85, -0.02, 0.08, 0.08); }
    g.strokeStyle = dark; g.lineWidth = 0.22; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 1.45, -0.72); g.lineTo(s * 0.42, -0.36); g.stroke(); }
    g.fillStyle = '#6b1f1a'; ell(g, 0, 0.85, 0.5, 0.34);
    g.fillStyle = '#ffffff'; for (const tx of [-0.26, 0.02, 0.28]) { g.beginPath(); g.moveTo(tx - 0.11, 0.55); g.lineTo(tx + 0.11, 0.55); g.lineTo(tx, 0.76); g.closePath(); g.fill(); }
    for (const tx of [-0.14, 0.16]) { g.beginPath(); g.moveTo(tx - 0.09, 1.16); g.lineTo(tx + 0.09, 1.16); g.lineTo(tx, 0.98); g.closePath(); g.fill(); }
  } else if (state === 'hurt') {
    g.strokeStyle = dark; g.lineWidth = 0.17;
    g.beginPath(); g.moveTo(-1.25, -0.32); g.lineTo(-0.62, 0); g.lineTo(-1.25, 0.32); g.stroke();
    g.beginPath(); g.moveTo(1.25, -0.32); g.lineTo(0.62, 0); g.lineTo(1.25, 0.32); g.stroke();
    g.lineWidth = 0.12; g.beginPath(); g.moveTo(-0.4, 0.78); g.quadraticCurveTo(-0.2, 0.6, 0, 0.78); g.quadraticCurveTo(0.2, 0.96, 0.4, 0.78); g.stroke();
  } else {
    g.strokeStyle = dark; g.lineWidth = 0.1;
    for (const s of [-1, 1]) { g.beginPath(); for (let a = 0; a < Math.PI * 4; a += 0.25) { const r = 0.04 + a * 0.028; const px = s * 0.9 + Math.cos(a * s) * r, py = Math.sin(a * s) * r; if (a === 0) g.moveTo(px, py); else g.lineTo(px, py); } g.stroke(); }
    g.beginPath(); g.ellipse(0, 0.82, 0.17, 0.22, 0, 0, Math.PI * 2); g.stroke();
  }
  g.restore();
}
function faceSet(key, w, h, paintBase, cx, cy, U, ky) {
  const set = {};
  for (const st of ['normal', 'angry', 'hurt', 'dizzy']) set[st] = ctex('fs' + key + st, w, h, (g) => { paintBase(g, w, h); drawFace(g, cx, cy, U, ky, st); }, null);
  return set;
}
const bristleTex = ctex('bristle', 256, 128, (g, w, h) => { g.fillStyle = '#8a5c3b'; g.fillRect(0, 0, w, h); strokes(g, w, h, 900, ['#6e4529', '#a3714b', '#5a3820', '#7d5132'], 12, 1.6, 0.85, R); }, [2, 1]);
const furTexFor = (hex) => ctex('fur' + hex, 256, 128, (g, w, h) => { g.fillStyle = hex; g.fillRect(0, 0, w, h); strokes(g, w, h, 500, [shade(hex, 0.8), shade(hex, 1.15)], 9, 1.4, 0.6, R); }, [2, 1]);
const mossTex = ctex('moss', 256, 128, (g, w, h) => { g.fillStyle = '#5f9443'; g.fillRect(0, 0, w, h); for (let i = 0; i < 140; i++) { const c = ['#4e7f37', '#76ad52', '#8cc063', '#557f3a'][i % 4]; g.fillStyle = c; g.globalAlpha = 0.5; ell(g, R() * w, R() * h, 3 + R() * 9, 2 + R() * 6); } g.globalAlpha = 1; }, [2, 1]);
const jellyBase = (c0, c1, c2) => (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, c0); gr.addColorStop(0.5, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.5)'; ell(g, 92, 62, 26, 14, -0.3); };
const stemBase = (hex, line) => (g, w, h) => { g.fillStyle = hex; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { g.strokeStyle = line; g.lineWidth = 2; const x = R() * w; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (R() - 0.5) * 8, h); g.stroke(); } };
const FACES = {
  leaflet: faceSet('leaf', 512, 256, jellyBase('#bff3ac', '#8ee07a', '#62b54f'), 128, 118, 30, 1.25),
  mushling: faceSet('mush', 512, 256, stemBase('#fff3dc', 'rgba(200,170,120,.25)'), 256, 92, 32, 1.77),
  breeze: faceSet('breeze', 512, 256, jellyBase('#e4fbf7', '#a9e6ea', '#6fc2cf'), 128, 118, 30, 1.25),
  moss: faceSet('mossm', 512, 256, stemBase('#eef0d6', 'rgba(140,160,100,.28)'), 256, 92, 32, 1.77),
  boar: faceSet('boar', 512, 256, (g, w, h) => { g.fillStyle = '#8a5c3b'; g.fillRect(0, 0, w, h); strokes(g, w, h, 500, ['#6e4529', '#a3714b', '#5a3820'], 10, 1.6, 0.8, R); }, 128, 104, 24, 1.0),
  thorn: faceSet('thorn', 512, 256, (g, w, h) => { g.fillStyle = '#f2d3b0'; g.fillRect(0, 0, w, h); }, 128, 112, 24, 1.0)
};

// ---------- chibi characters (player and NPCs) ----------
const LEG = [[0.0, 0.1], [0.034, 0.104], [0.05, 0.125], [0.058, 0.2], [0.06, 0.3], [0.058, 0.36], [0.066, 0.44], [0.078, 0.54], [0.085, 0.63], [0.07, 0.69], [0.0, 0.71]];
const ARM = [[0.0, -0.08], [0.03, -0.077], [0.038, -0.06], [0.04, 0.0], [0.043, 0.06], [0.046, 0.12], [0.05, 0.2], [0.05, 0.26], [0.035, 0.29], [0.0, 0.3]];
const HEADP = [[0.0, -0.205], [0.05, -0.2], [0.11, -0.175], [0.16, -0.13], [0.195, -0.07], [0.212, 0.0], [0.214, 0.06], [0.205, 0.12], [0.18, 0.17], [0.135, 0.21], [0.07, 0.235], [0.0, 0.242]];
const SHIRT = [[0.135, 0], [0.15, 0.06], [0.157, 0.12], [0.17, 0.2], [0.166, 0.26], [0.12, 0.3], [0.06, 0.32]];
const BOTTOMS = {
  shorts: [[0.185, 0.47], [0.196, 0.53], [0.182, 0.62], [0.156, 0.72], [0.142, 0.76]],
  skirt: [[0.235, 0.44], [0.215, 0.5], [0.19, 0.62], [0.156, 0.72], [0.142, 0.76]],
  longskirt: [[0.255, 0.3], [0.235, 0.4], [0.205, 0.55], [0.17, 0.68], [0.145, 0.76]],
  pants: [[0.15, 0.36], [0.172, 0.43], [0.19, 0.5], [0.196, 0.56], [0.182, 0.64], [0.156, 0.72], [0.142, 0.76]],
  tassets: [[0.245, 0.44], [0.222, 0.5], [0.195, 0.62], [0.158, 0.72], [0.142, 0.76]]
};
const ROBE = [[0.29, -0.68], [0.25, -0.5], [0.21, -0.32], [0.18, -0.16], [0.162, 0.0], [0.168, 0.12], [0.178, 0.2], [0.17, 0.26], [0.122, 0.3], [0.06, 0.32]];
// how worn equipment looks on the hero (delivery 7): hats, body pieces and shoes by look id
const GEAR_LOOKS = {
  // hats
  leafcap: { kind: 'jelly', base: 0x8ee07a, dark: 0x5aa848, top: 'sprout' },
  breezecap: { kind: 'jelly', base: 0xa9e6ea, dark: 0x6fc2cf, top: 'swirl' },
  mushcap: { kind: 'mush', base: 0xe8604c, spot: 0xfff3dc },
  mosscap: { kind: 'mush', base: 0x5f9443, spot: 0x9ff5d2, glow: true },
  boarhelm: { kind: 'boar', base: 0x8a5c3b },
  thornhelm: { kind: 'thorn', base: 0xe8c9a0, spike: 0x6a9a3a },
  flowercrown: { kind: 'crown' },
  feathercap: { kind: 'beret', base: 0x4f79b8, feather: 0xfff6e4 },
  glowhood: { kind: 'hood', base: 0x3f5a3a },
  clothcap: { kind: 'beret', base: 0xa8774f, feather: 0xf3ead6 },
  paddedvest: { shirt: '#efe4cc', vest: '#a8774f', emblem: 'none' },
  sturdyboots: { boot: '#7a5236', cuff: 0xc99a6a },
  // body pieces: shirt colour, vest colour, chest emblem and extras
  leafvest: { shirt: '#bff3ac', vest: '#5aa848', emblem: 'leaf' },
  breezevest: { shirt: '#e4fbf7', vest: '#5fb4c4', emblem: 'swirl' },
  mushvest: { shirt: '#fff3dc', vest: '#d9503e', emblem: 'spots' },
  mossvest: { shirt: '#eef0d6', vest: '#5f9443', emblem: 'glow' },
  boarvest: { shirt: '#c99a6a', vest: '#7a4e30', emblem: 'tusk', extra: 'fur' },
  thornvest: { shirt: '#f2d3b0', vest: '#8a6a40', emblem: 'thorn', extra: 'spikes' },
  suntunic: { shirt: '#f6d36b', vest: '#e8a23a', emblem: 'sun' },
  windcape: { shirt: '#dfeaf6', vest: '#4f79b8', emblem: 'feather', extra: 'cape' },
  forestcloak: { shirt: '#a7b49c', vest: '#3f5a3a', emblem: 'glow', extra: 'cloak' },
  // shoes: boot colour and a little cuff or toe mark
  leafboots: { boot: '#5aa848', cuff: 0x8ee07a },
  breezeboots: { boot: '#5fb4c4', cuff: 0xa9e6ea },
  mushboots: { boot: '#c0503e', cuff: 0xfff3dc },
  mossboots: { boot: '#4e7f37', cuff: 0x9ff5d2 },
  boarboots: { boot: '#6e4529', cuff: 0xa3714b, fur: true },
  thornboots: { boot: '#7a5a3a', cuff: 0x6a9a3a, spike: true },
  sunshoes: { boot: '#e8a23a', cuff: 0xfff3dc },
  windboots: { boot: '#4f79b8', cuff: 0xfff6e4 },
  rootboots: { boot: '#5a4a32', cuff: 0x6fae4a },
  // delivery 8: Riverside and Thornbush monster sets, and the two area sets forged at Bolt
  frogcap: { kind: 'frog', base: 0x62b54f },
  frogvest: { shirt: '#f3f0c8', vest: '#62b54f', emblem: 'drop' },
  frogboots: { boot: '#4e9a3e', cuff: 0xf3f0c8 },
  crabhelm: { kind: 'crab', base: 0xa89a88 },
  crabvest: { shirt: '#f6c6a8', vest: '#e0704a', emblem: 'claw', extra: 'shell' },
  crabboots: { boot: '#c0603e', cuff: 0xa89a88 },
  squirrelcap: { kind: 'squirrel', base: 0xd9894a },
  squirrelvest: { shirt: '#fbe6c8', vest: '#c27a3e', emblem: 'acorn', extra: 'tail' },
  squirrelboots: { boot: '#a8683a', cuff: 0xfbe6c8, fur: true },
  beecap: { kind: 'bee', base: 0xffd34d },
  beevest: { shirt: '#fff3c8', vest: '#e8b02a', emblem: 'stripes', extra: 'wings' },
  beeboots: { boot: '#3b2a1e', cuff: 0xffd34d },
  bushcap: { kind: 'bush', base: 0x4e8a3a },
  bushvest: { shirt: '#c8e0b0', vest: '#3f7a30', emblem: 'berry', extra: 'leaves' },
  bushboots: { boot: '#5a4a32', cuff: 0x4e8a3a, spike: true },
  strawhat: { kind: 'straw', base: 0xe8c878, band: 0x4f9ae6 },
  rivervest: { shirt: '#e4f3fb', vest: '#4f9ae6', emblem: 'wave' },
  riverboots: { boot: '#3f7ab8', cuff: 0xe4f3fb },
  bramblecrown: { kind: 'bramble', base: 0x5a3c22 },
  bramblecoat: { shirt: '#d9c8a8', vest: '#6a2a3a', emblem: 'berry', extra: 'cloak' },
  brambleboots: { boot: '#4a2a2a', cuff: 0x6a9a3a, spike: true }
};
function chibi(o) {
  o = Object.assign({ gender: 'boy', skin: '#f8dcc6', hair: 'spiky', hairColor: '#8b5a36', iris: '#6b3f24', outfit: 'novice', brows: 'normal', mouth: 'smile', bulk: 1, size: 1 }, o || {});
  const of = o.outfit, stone = of === 'stone';
  const stoneM = lam(0xc4c0b8, rockTex), stoneS = lam(0xc4c0b8, rockTex, { skinning: true });
  const M = (hex, map, extra) => stone ? stoneM : lam(hex, map, extra);
  const MS = (hex) => stone ? stoneS : lam(hex, null, { skinning: true });
  const T = 0.008;
  const P = (geo, mat, parent, x, y, z) => part(geo, mat, T, parent, x, y, z);
  const root = new THREE.Group(), rig = new THREE.Group(); root.add(rig); root.scale.setScalar(o.size);
  const j = {}, limbs = [];
  const robe = of === 'mage' || of === 'elder' || of === 'lumi' || of === 'fennick';
  const C = o.colors || {}, ch = (k, d) => (C[k] != null ? new THREE.Color(C[k]).getHex() : d); // colour overrides (job masters)
  const GR = o.gear || {}, GH = GEAR_LOOKS[GR.head], GB = GEAR_LOOKS[GR.body], GF = GEAR_LOOKS[GR.feet];
  const gloves = { novice: '#8a5a36', warrior: '#5a3a26', archer: '#6b4a35', bolt: '#5a3a26', stone: '#8a5a36', robot: '#7a8794' }[of];
  const bootHex = (GF && GF.boot) || { warrior: '#4e3624', bolt: '#4a3426', mira: '#c0503e', pip: '#e8604c', tobin: '#7a4e30', fennick: '#5a4a32', robot: '#5a6470' }[of] || '#6b4a35';
  const bottom = of === 'novice' ? (o.gender === 'girl' ? 'skirt' : 'shorts') : of === 'stone' ? 'shorts' : { warrior: 'tassets', archer: 'pants', mira: 'longskirt', bolt: 'pants', pip: 'shorts', tobin: 'pants', robot: 'pants' }[of];
  const bottomMap = { novice: shortsTex, warrior: tassetTex, archer: clothTexFor('#7a5a3a'), mira: clothTexFor('#f08aa0'), bolt: clothTexFor('#5a4a3a'), pip: clothTexFor('#7fb6e6'), tobin: clothTexFor('#4f79b8'), robot: clothTexFor('#6f7a86'), stone: null }[of];
  const shirtHex = (GB && GB.shirt) || C.shirt || { novice: '#efe4cc', warrior: '#c8503e', archer: '#6aa84f', mage: '#7a68c8', elder: '#8a6a4a', mira: '#f08aa0', bolt: '#8f9aa6', pip: '#f6d36b', stone: '#c4c0b8', lumi: '#3b3466', tobin: '#e9b949', fennick: '#6a7d4a', robot: '#4a5560' }[of];
  const skinHex = new THREE.Color(o.skin).getHex();
  const skinM = M(skinHex), legM = (bottom === 'pants' && !stone) ? lam(new THREE.Color({ archer: '#7a5a3a', bolt: '#5a4a3a', tobin: '#4f79b8', robot: '#6f7a86' }[of]).getHex(), null, { skinning: true }) : MS(skinHex);
  // legs
  const bootGeo = cachedGeo('bootG', () => lathe([[0.0, -0.345], [0.068, -0.335], [0.064, -0.26], [0.072, -0.15], [0.088, -0.125], [0.078, -0.1]], 16));
  for (const s of [1, -1]) {
    const side = s > 0 ? 'L' : 'R';
    const hip = new THREE.Bone(); hip.position.set(0.085 * s, 0.62, 0); rig.add(hip);
    const knee = new THREE.Bone(); knee.position.y = -0.26; hip.add(knee);
    skinnedLimb(rig, LEG, 0.1, 0.71, 0.36, 0.05, 0.085 * s, legM, hip, knee, limbs, T);
    P(bootGeo, M(0xffffff, of === 'archer' && !GF ? wrapBootTex : bootTexFor(bootHex)), knee);
    if (GF) {
      const cuff = P(cachedGeo('gcuff', () => new THREE.TorusGeometry(0.078, 0.022, 6, 16)), M(GF.cuff, GF.fur ? furTexFor('#a3714b') : null), knee, 0, -0.105, 0); cuff.rotation.x = Math.PI / 2;
      if (GF.spike) for (const a of [0.5, -0.5, Math.PI]) { const sp = P(geoCone(0.022, 0.07, 5), M(GF.cuff), knee, Math.sin(a) * 0.09, -0.12, Math.cos(a) * 0.09); sp.rotation.set(Math.cos(a) * 1.2, 0, -Math.sin(a) * 1.2); }
    }
    const ankle = new THREE.Group(); ankle.position.y = -0.27; knee.add(ankle);
    P(geoSphere(0.08, 14, 10), M(new THREE.Color(bootHex).getHex()), ankle, 0, -0.045, 0.05).scale.set(0.95, 0.62, 1.5);
    part(geoCyl(0.078, 0.078, 0.025, 12), M(0x3e2a1c), 0, ankle, 0, -0.075, 0.045).scale.set(1, 1, 1.55);
    if (of === 'warrior') P(geoSphere(0.05, 10, 8), M(0xb8c2cc), ankle, 0, -0.04, 0.12).scale.set(1.3, 0.8, 1);
    j['hip' + side] = hip; j['knee' + side] = knee; j['ankle' + side] = ankle;
  }
  if (!robe) P(lathe(BOTTOMS[bottom], 24), M(0xffffff, bottomMap), rig);
  const upper = new THREE.Group(); upper.position.y = 0.72; upper.scale.set(o.bulk, 1, o.bulk); rig.add(upper); j.upper = upper;
  P(lathe(SHIRT, 24), M(0xffffff, clothTexFor(shirtHex)), upper);
  if (!GB && (of === 'novice' || of === 'stone')) P(lathe([[0.163, 0.06], [0.168, 0.12], [0.183, 0.2], [0.178, 0.26], [0.134, 0.295]], 24), M(0xffffff, vestTex, { alphaTest: 0.5, side: THREE.DoubleSide }), upper);
  if (!GB && of === 'warrior') P(lathe([[0.164, 0.02], [0.17, 0.1], [0.186, 0.2], [0.18, 0.26], [0.136, 0.296]], 24), M(0xffffff, leatherVestTex), upper);
  if (GB) {
    // the worn body piece: an open vest over the shirt, a chest emblem and an extra (fur collar, spikes, cape, cloak)
    const vc = new THREE.Color(GB.vest).getHex(), vm = M(0xffffff, GB.extra === 'fur' ? furTexFor(GB.vest) : clothTexFor(GB.vest));
    P(lathe([[0.17, 0.03], [0.176, 0.1], [0.192, 0.2], [0.186, 0.26], [0.14, 0.298]], 24, Math.PI * 0.07, Math.PI * 1.86), M(0xffffff, vm.map, { side: THREE.DoubleSide }), upper);
    const em = (geo, hex, x, y, z, emissive) => { const m = emissive ? new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: hex, emissive: hex, emissiveIntensity: 0.6 })) : P(geo, M(hex), upper, x, y, z); if (emissive) { m.position.set(x, y, z); upper.add(m); } return m; };
    const e = GB.emblem;
    if (e === 'leaf') { const lf = em(geoSphere(0.045, 10, 8), 0x7cc85e, 0.06, 0.2, 0.18); lf.scale.set(0.55, 1.2, 0.3); lf.rotation.z = -0.5; }
    if (e === 'swirl') em(cachedGeo('gswirl', () => new THREE.TorusGeometry(0.035, 0.012, 6, 14, Math.PI * 1.5)), 0xe4fbf7, 0.06, 0.2, 0.185);
    if (e === 'spots') for (const [x, y] of [[0.05, 0.22], [0.08, 0.15], [0.03, 0.12]]) em(geoSphere(0.018, 8, 6), 0xfff3dc, x, y, 0.185).scale.z = 0.4;
    if (e === 'glow') em(geoSphere(0.03, 10, 8), 0x9ff5d2, 0.06, 0.19, 0.18, true).scale.z = 0.5;
    if (e === 'tusk') for (const s of [1, -1]) { const t = em(geoCone(0.02, 0.09, 6), 0xfff6e4, 0.06 * s, 0.24, 0.17); t.rotation.z = 0.5 * s; }
    if (e === 'thorn') em(geoCone(0.025, 0.07, 5), 0x6a9a3a, 0.06, 0.19, 0.19).rotation.x = Math.PI / 2;
    if (e === 'sun') { em(geoCyl(0.035, 0.035, 0.012, 14), 0xffe07a, 0, 0.17, 0.188).rotation.x = Math.PI / 2; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, r = em(geoBox(0.012, 0.03, 0.008), 0xf4a23a, Math.cos(a) * 0.055, 0.17 + Math.sin(a) * 0.055, 0.186); r.rotation.z = a - Math.PI / 2; } }
    if (e === 'feather') { const f = em(geoSphere(0.04, 10, 8), 0xfff6e4, 0.06, 0.19, 0.18); f.scale.set(0.4, 1.3, 0.3); f.rotation.z = -0.6; }
    if (e === 'drop' || e === 'wave') { const d = em(geoSphere(0.035, 10, 8), e === 'drop' ? 0x9fe0ff : 0xe4f3fb, 0.06, 0.19, 0.18); d.scale.set(0.8, 1.2, 0.4); em(geoCone(0.024, 0.04, 8), e === 'drop' ? 0x9fe0ff : 0xe4f3fb, 0.06, 0.235, 0.178); }
    if (e === 'claw') for (const s of [1, -1]) { const c = em(geoSphere(0.03, 8, 6), 0xffe0c8, 0.06 + 0.012 * s, 0.2 + 0.015 * s, 0.18); c.scale.set(0.5, 1.2, 0.4); c.rotation.z = 0.6 * s; }
    if (e === 'acorn') { em(geoSphere(0.03, 8, 6), 0xc0803e, 0.06, 0.18, 0.185).scale.set(1, 1.2, 0.5); em(geoSphere(0.032, 8, 6), 0x7a5236, 0.06, 0.205, 0.183).scale.set(1, 0.6, 0.5); }
    if (e === 'stripes') for (const y of [0.1, 0.16, 0.22]) { const b = em(geoBox(0.08, 0.018, 0.01), 0x3b2a1e, 0.065, y, 0.188 - (y - 0.1) * 0.1); b.rotation.y = 0.35; }
    if (e === 'berry') for (const [x, y] of [[0.05, 0.2], [0.075, 0.18], [0.055, 0.165]]) em(geoSphere(0.018, 8, 6), 0xd9304a, x, y, 0.186);
    if (GB.extra === 'shell') P(cachedGeo('gshell', () => new THREE.SphereGeometry(0.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2)), M(0xffffff, shellTex), upper, 0, 0.17, -0.13).rotation.x = -Math.PI / 2;
    if (GB.extra === 'tail') { const tl = new THREE.Group(); tl.position.set(0, 0.0, -0.18); upper.add(tl); for (const [y, z, r] of [[-0.05, -0.04, 0.07], [0.06, -0.1, 0.085], [0.2, -0.11, 0.09], [0.32, -0.06, 0.075]]) P(geoSphere(r, 10, 8), M(0xffffff, furTexFor('#d9894a')), tl, 0, y, z); }
    if (GB.extra === 'wings') for (const s of [1, -1]) { const w = new THREE.Mesh(geoSphere(0.14, 10, 8), new THREE.MeshLambertMaterial({ color: 0xe8f6ff, transparent: true, opacity: 0.6, depthWrite: false })); w.scale.set(0.9, 1.1, 0.12); w.position.set(0.1 * s, 0.24, -0.2); w.rotation.z = 0.5 * s; upper.add(w); }
    if (GB.extra === 'leaves') for (const s of [1, -1]) for (const k of [0, 1]) { const lf = P(geoSphere(0.05, 8, 6), M(k ? 0x5f9c46 : 0x3f7a30), upper, (0.16 + k * 0.02) * s, 0.27 - k * 0.05, -0.02); lf.scale.set(1.3, 0.5, 0.9); lf.rotation.z = -0.6 * s; }
    if (GB.extra === 'fur') { const fc = P(cachedGeo('gfur', () => new THREE.TorusGeometry(0.12, 0.04, 8, 20)), M(0xffffff, furTexFor('#a3714b')), upper, 0, 0.3, 0); fc.rotation.x = Math.PI / 2; }
    if (GB.extra === 'spikes') for (const s of [1, -1]) for (const k of [0, 1]) { const sp = P(geoCone(0.03, 0.1, 5), M(0x6a9a3a), upper, (0.15 + k * 0.03) * s, 0.27 - k * 0.04, -0.03); sp.rotation.z = -0.9 * s; }
    if (GB.extra === 'cape' || GB.extra === 'cloak') {
      const long = GB.extra === 'cloak';
      P(lathe(long ? [[0.3, -0.52], [0.26, -0.3], [0.22, -0.08], [0.2, 0.12], [0.18, 0.24], [0.13, 0.3], [0.07, 0.33]] : [[0.26, -0.02], [0.23, 0.1], [0.2, 0.22], [0.15, 0.29], [0.07, 0.33]], 24, Math.PI * 0.32, Math.PI * 1.36), M(vc, null, { side: THREE.DoubleSide }), upper);
      for (const s of [1, -1]) P(geoSphere(0.025, 8, 6), M(0xe3b343), upper, 0.08 * s, 0.31, 0.06);
    }
  }
  if (robe) {
    P(lathe(ROBE, 28), M(0xffffff, GB ? robeTexFor(GB.vest, GB.shirt, false) : of === 'mage' ? robeTexFor(C.robe || '#7a68c8', C.trim || '#f2c14e', !C.robe) : of === 'lumi' ? robeTexFor('#3b3466', '#ffd96a', false) : of === 'fennick' ? robeTexFor('#6a7d4a', '#4a5a32', false) : robeTexFor('#8a6a4a', '#6b5038', false)), upper);
    P(geoCyl(0.168, 0.165, 0.05, 24), M(of === 'mage' ? ch('trim', 0xf2c14e) : of === 'lumi' ? 0xffd96a : of === 'fennick' ? 0x9a7a4e : 0x6fae4a), upper, 0, 0.02, 0);
    if (of === 'fennick') for (const [x, y, z, rz, c] of [[0.1, 0.0, 0.14, 0.5, 0x86c45e], [0.15, -0.02, 0.1, -0.3, 0x6fae4a]]) { const lf = P(geoSphere(0.05, 8, 6), M(c), upper, x, y, z); lf.scale.set(0.5, 1.4, 0.25); lf.rotation.z = rz; }
  } else if (of !== 'mira' && of !== 'pip') {
    P(geoCyl(0.145, 0.145, 0.045, 20), M(of === 'warrior' ? 0x5a3820 : 0x6b4a30), upper, 0, 0.02, 0);
    part(geoBox(0.05, 0.04, 0.02), M(of === 'warrior' ? 0xb8c2cc : 0xe3b343), 0, upper, 0, 0.02, 0.148);
    if (of === 'novice' || of === 'archer') P(geoBox(0.08, 0.08, 0.05), M(0x7a5236), upper, -0.13, -0.01, 0.07).rotation.y = -0.7;
  }
  if (of === 'archer' && !GB) P(lathe([[0.25, 0.02], [0.22, 0.12], [0.2, 0.22], [0.15, 0.29], [0.07, 0.33]], 24, Math.PI * 0.3, Math.PI * 1.4), M(ch('cloak', 0x3f7a39), null, { side: THREE.DoubleSide }), upper);
  if (of === 'mira') P(lathe([[0.2, -0.38], [0.18, -0.2], [0.16, 0.0], [0.165, 0.1], [0.172, 0.16]], 16, -Math.PI * 0.3, Math.PI * 0.6), M(0xfffaf0, null, { side: THREE.DoubleSide }), upper);
  if (of === 'bolt') P(lathe([[0.215, -0.32], [0.2, -0.16], [0.17, 0.0], [0.178, 0.12], [0.186, 0.2], [0.17, 0.26]], 16, -Math.PI * 0.32, Math.PI * 0.64), M(0x7a5236, null, { side: THREE.DoubleSide }), upper);
  if (of === 'pip') {
    P(lathe([[0.168, 0.0], [0.172, 0.08], [0.18, 0.16], [0.182, 0.2]], 12, -Math.PI * 0.24, Math.PI * 0.48), M(0x7fb6e6, null, { side: THREE.DoubleSide }), upper);
    for (const s of [1, -1]) P(geoBox(0.025, 0.14, 0.02), M(0x7fb6e6), upper, 0.07 * s, 0.24, 0.13).rotation.x = -0.4;
  }
  if (of === 'robot') {
    // Bolt's machine armor: a steel chest plate with a glowing core, and a rocket pack on the back
    const steel = M(0xb8c2cc), dark = M(0x5a6470);
    if (!GB) {
      P(lathe([[0.166, 0.03], [0.174, 0.1], [0.19, 0.2], [0.184, 0.26], [0.14, 0.298]], 24, -Math.PI * 0.42, Math.PI * 0.84), M(0xb8c2cc, null, { side: THREE.DoubleSide }), upper);
      const core = new THREE.Mesh(geoSphere(0.04, 12, 8), new THREE.MeshLambertMaterial({ color: 0x9ff0ff, emissive: 0x2a9ab8 })); core.position.set(0, 0.17, 0.19); core.scale.set(1, 1, 0.5); upper.add(core); j.core = core;
      for (const x of [-0.11, 0.11]) for (const y of [0.08, 0.24]) part(geoSphere(0.012, 6, 4), dark, 0, upper, x, y, 0.17);
    }
    const pack = new THREE.Group(); pack.position.set(0, 0.16, -0.2); upper.add(pack); j.pack = pack;
    P(geoBox(0.24, 0.24, 0.1), dark, pack, 0, 0, 0);
    for (const s of [1, -1]) { P(geoCyl(0.045, 0.05, 0.26, 10), steel, pack, 0.09 * s, -0.02, -0.05); P(geoCone(0.045, 0.08, 10), M(0xe8604c), pack, 0.09 * s, 0.15, -0.05); const fl = new THREE.Mesh(geoCone(0.035, 0.1, 8), new THREE.MeshBasicMaterial({ color: 0xffc06a, transparent: true, opacity: 0.85 })); fl.position.set(0.09 * s, -0.2, -0.05); fl.rotation.x = Math.PI; pack.add(fl); (j.flames = j.flames || []).push(fl); }
  }
  if (of === 'tobin') {
    // blue overalls with brass buttons, and a red scarf that flaps in the wind
    P(lathe([[0.168, 0.0], [0.172, 0.08], [0.18, 0.16], [0.182, 0.2]], 12, -Math.PI * 0.24, Math.PI * 0.48), M(0x4f79b8, null, { side: THREE.DoubleSide }), upper);
    for (const s of [1, -1]) { P(geoBox(0.028, 0.16, 0.02), M(0x4f79b8), upper, 0.075 * s, 0.24, 0.135).rotation.x = -0.4; part(geoSphere(0.018, 8, 6), M(0xe3b343), 0, upper, 0.075 * s, 0.19, 0.178); }
    P(cachedGeo('nscarf', () => new THREE.TorusGeometry(0.085, 0.034, 8, 18)), M(0xd9503e), upper, 0, 0.33, 0.01).rotation.x = Math.PI / 2;
    const tail = new THREE.Group(); tail.position.set(-0.07, 0.32, -0.06); upper.add(tail); j.scarf = tail;
    P(geoBox(0.06, 0.22, 0.02), M(0xd9503e), tail, 0, -0.1, 0); P(geoBox(0.065, 0.03, 0.025), M(0xf4c542), tail, 0, -0.2, 0);
    tail.rotation.set(0.9, 0.4, 0.5); tail.userData.live = true;
  }
  if (stone) P(lathe([[0.3, -0.5], [0.26, -0.3], [0.21, -0.1], [0.19, 0.1], [0.17, 0.26], [0.1, 0.31]], 20, Math.PI * 0.62, Math.PI * 0.76), stoneM, upper);
  P(geoCyl(0.05, 0.055, 0.08, 10), skinM, upper, 0, 0.34, 0);
  // head
  const head = new THREE.Group(); head.position.y = 0.52; upper.add(head); j.head = head;
  const faceO = { skin: o.skin, iris: o.iris, girl: o.gender === 'girl', closed: !!o.closed, brows: o.brows, mouth: o.mouth, freckles: !!o.freckles, stubble: !!o.stubble };
  if (o.browCol) faceO.browCol = o.browCol;
  j.faceOpen = faceTex(faceO); j.faceClosed = faceTex(Object.assign({}, faceO, { closed: true }));
  const faceM = stone ? stoneM : lam(0xffffff, j.faceOpen);
  j.faceMat = stone ? null : faceM;
  P(latheY(HEADP, HEAD_Y0, HEAD_Y1, 32, 36), faceM, head).scale.set(1, 1, 0.95);
  for (const s of [1, -1]) P(geoSphere(0.045, 8, 6), skinM, head, 0.205 * s, -0.01, 0).scale.set(0.5, 1, 0.8);
  const hair = new THREE.Group(); head.add(hair); j.hair = hair;
  const hairM = M(0xffffff, hairTexFor(o.hairColor));
  const lock = (len, rad, pos, dir, flat, mat) => {
    const d = dir.clone().normalize(), m = new THREE.Mesh(geoCone(rad, len, 7), mat || hairM);
    m.add(new THREE.Mesh(geoCone(rad, len, 7), outlineMat(T)));
    m.position.copy(pos).addScaledVector(d, len * 0.42); m.quaternion.setFromUnitVectors(UP, d); m.scale.set(1, 1, flat || 0.75); hair.add(m); return m;
  };
  const cap = (mat, pad, y0) => P(latheY(HEADP, y0 == null ? 0.03 : y0, HEAD_Y1, 18, 32, Math.PI, Math.PI * 2, pad || 0.016), mat || hairM, hair).scale.set(1, 1, 0.96);
  const backShort = (mat) => P(latheY(HEADP, -0.13, 0.07, 12, 20, Math.PI / 2, Math.PI, 0.018), mat || hairM, hair).scale.set(1, 1, 0.97);
  const bangs = (mat) => { for (const x of [-0.13, -0.065, 0, 0.065, 0.13]) lock(0.13, 0.066, V3(x, 0.14 - Math.abs(x) * 0.3, 0.165 - Math.abs(x) * 0.3), V3(x * 0.6, -1, 0.45), 0.6, mat); for (const s of [1, -1]) lock(0.2, 0.05, V3(0.19 * s, 0.0, 0.06), V3(0.15 * s, -1, 0.1), 0.7, mat); };
  const tail = (x, y, z, len, rad, rx, rz) => { const t = P(lathe([[0.0, 0], [rad * 0.75, -len * 0.06], [rad, -len * 0.22], [rad * 0.92, -len * 0.45], [rad * 0.62, -len * 0.72], [rad * 0.28, -len * 0.92], [0.0, -len]].reverse(), 16), hairM, hair, x, y, z); t.rotation.set(rx, 0, rz); return t; };
  const spikes = (k) => {
    lock(0.3 * k, 0.1 * k, V3(0, 0.2, -0.02), V3(0, 1, -0.55));
    for (const s of [1, -1]) { lock(0.27 * k, 0.09 * k, V3(0.09 * s, 0.18, -0.03), V3(0.55 * s, 0.9, -0.6)); lock(0.22 * k, 0.085 * k, V3(0.11 * s, 0.06, -0.14), V3(0.6 * s, -0.35, -0.9)); lock(0.2 * k, 0.08 * k, V3(0.18 * s, 0.08, 0.0), V3(1 * s, 0.15, -0.5)); lock(0.17 * k, 0.055 * k, V3(0.19 * s, -0.02, 0.07), V3(0.2 * s, -1, 0.15)); }
    lock(0.25 * k, 0.095 * k, V3(0, 0.08, -0.17), V3(0, -0.35, -1)); lock(0.2 * k, 0.085 * k, V3(0.03, 0.2, 0.1), V3(0.15, 1, 0.7));
    for (const x of [-0.12, -0.04, 0.045, 0.125]) lock(0.17 * k, 0.07 * k, V3(x, 0.13 - Math.abs(x) * 0.3, 0.16 - Math.abs(x) * 0.3), V3(x, -1, 0.5), 0.7);
  };
  const hs = o.hair, helm = GH && !['crown', 'beret', 'straw', 'bramble'].includes(GH.kind);
  // under a helm only the fringe and the side locks of spiky hair show
  const fringe = () => { for (const s of [1, -1]) lock(0.17, 0.055, V3(0.19 * s, -0.02, 0.07), V3(0.2 * s, -1, 0.15)); for (const x of [-0.12, -0.04, 0.045, 0.125]) lock(0.17, 0.07, V3(x, 0.13 - Math.abs(x) * 0.3, 0.16 - Math.abs(x) * 0.3), V3(x, -1, 0.5), 0.7); };
  if ((hs === 'spiky' || hs === 'shortspiky') && helm) { cap(); backShort(); fringe(); }
  else if (hs === 'spiky') { cap(); backShort(); spikes(1); }
  else if (hs === 'shortspiky') { cap(); backShort(); spikes(0.7); }
  else if (hs === 'long') { cap(); P(latheY([[0.17, -0.5], [0.19, -0.35], [0.205, -0.2], [0.215, -0.05], [0.222, 0.05], [0.21, 0.14]], -0.5, 0.12, 14, 20, Math.PI * 0.4, Math.PI * 1.2, 0.0), hairM, hair).scale.set(1, 1, 0.97); bangs(); }
  else if (hs === 'pony') { cap(); backShort(); bangs(); tail(0, 0.13, -0.23, 0.5, 0.095, 0.42, 0); P(cachedGeo('tie', () => new THREE.TorusGeometry(0.045, 0.016, 6, 14)), M(0xe8604c), hair, 0, 0.12, -0.225).rotation.x = 0.4; }
  else if (hs === 'twin') { cap(); backShort(); bangs(); for (const s of [1, -1]) { tail(0.215 * s, 0.08, -0.08, 0.44, 0.082, 0.18, 0.32 * s); P(geoSphere(0.035, 8, 6), M(0xe8604c), hair, 0.215 * s, 0.085, -0.08); } }
  else if (hs === 'bob') { cap(); P(latheY([[0.2, -0.13], [0.225, -0.06], [0.226, 0.02], [0.218, 0.08]], -0.13, 0.08, 8, 24, Math.PI * 0.3, Math.PI * 1.4, 0.0), hairM, hair); bangs(); }
  else if (hs === 'bangs') { bangs(); }
  // headwear (a worn hat or helm replaces the job's own)
  if (GH) {
    const k = GH.kind, hb = M(GH.base || 0xffffff);
    if (k === 'jelly') {
      cap(M(GH.base), 0.04, 0.03);
      P(cachedGeo('gjrim', () => new THREE.TorusGeometry(0.218, 0.02, 6, 30)), M(GH.dark), head, 0, 0.06, 0).rotation.x = Math.PI / 2 + 0.12;
      const hl = new THREE.Mesh(geoSphere(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 })); hl.position.set(-0.09, 0.2, 0.12); hl.scale.set(1, 0.5, 0.4); head.add(hl);
      if (GH.top === 'sprout') { P(geoCyl(0.012, 0.014, 0.08, 6), M(0x5aa848), head, 0, 0.29, 0); for (const s of [1, -1]) { const lf = P(geoSphere(0.05, 10, 8), M(0x7cc85e), head, 0.045 * s, 0.33, 0); lf.scale.set(1.2, 0.35, 0.6); lf.rotation.z = 0.5 * s; } }
      if (GH.top === 'swirl') { const sw = P(cachedGeo('gswirlH', () => new THREE.TorusGeometry(0.05, 0.016, 6, 16, Math.PI * 1.6)), M(GH.dark), head, 0, 0.31, 0); sw.rotation.y = 0.4; }
    }
    if (k === 'mush') {
      const dome = P(cachedGeo('gmush', () => new THREE.SphereGeometry(0.31, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2)), hb, head, 0, 0.13, 0); dome.scale.set(1, 0.72, 1);
      P(geoCyl(0.3, 0.27, 0.03, 22), M(0xfff3dc), head, 0, 0.125, 0);
      const spotM = GH.glow ? new THREE.MeshLambertMaterial({ color: GH.spot, emissive: GH.spot, emissiveIntensity: 0.7 }) : M(GH.spot);
      for (const [a, el] of [[0.3, 0.55], [1.6, 0.4], [2.9, 0.6], [4.2, 0.45], [5.4, 0.62], [0.9, 1.15], [3.6, 1.1]]) {
        const sp = new THREE.Mesh(geoSphere(0.045, 10, 8), spotM); const r = 0.31;
        sp.position.set(Math.sin(a) * Math.cos(el) * r, 0.13 + Math.sin(el) * r * 0.72, Math.cos(a) * Math.cos(el) * r); sp.scale.set(1, 1, 0.35); sp.lookAt(V3(0, 0.13, 0).add(sp.position.clone().sub(V3(0, 0.13, 0)).multiplyScalar(2))); head.add(sp);
      }
    }
    if (k === 'boar') {
      cap(M(0xffffff, bristleTex), 0.04, -0.02);
      P(cachedGeo('gjrim', () => new THREE.TorusGeometry(0.218, 0.02, 6, 30)), M(0x5a3820), head, 0, 0.05, 0).rotation.x = Math.PI / 2 + 0.12;
      for (const s of [1, -1]) {
        const ear = P(geoCone(0.06, 0.12, 6), M(0x8a5c3b), head, 0.13 * s, 0.28, -0.02); ear.rotation.z = -0.5 * s; ear.scale.z = 0.5;
        const tusk = P(geoCone(0.022, 0.1, 6), M(0xfff6e4), head, 0.17 * s, 0.07, 0.13); tusk.rotation.set(0.3, 0, -0.35 * s);
      }
    }
    if (k === 'thorn') {
      cap(hb, 0.04, 0.0);
      P(cachedGeo('gjrim', () => new THREE.TorusGeometry(0.218, 0.02, 6, 30)), M(0x8a6a40), head, 0, 0.06, 0).rotation.x = Math.PI / 2 + 0.12;
      for (const [a, el] of [[0, 1.45], [0.6, 0.9], [-0.6, 0.9], [1.8, 0.8], [-1.8, 0.8], [3.14, 0.9], [2.5, 0.5], [-2.5, 0.5]]) {
        const d = V3(Math.sin(a) * Math.cos(el), Math.sin(el), Math.cos(a) * Math.cos(el) * 0.6 - 0.25).normalize();
        const sp = P(geoCone(0.035, 0.12, 5), M(GH.spike), head, d.x * 0.22, 0.06 + d.y * 0.2, d.z * 0.22); sp.quaternion.setFromUnitVectors(UP, d);
      }
    }
    if (k === 'crown') {
      const cols = [0xf6a8c4, 0xfff3dc, 0xf6d36b, 0xc9a8f0];
      for (let i = 0; i < 9; i++) {
        const a = i / 9 * Math.PI * 2, x = Math.sin(a) * 0.215, z = Math.cos(a) * 0.205;
        const f = P(geoSphere(0.05, 10, 8), M(cols[i % 4]), head, x, 0.13, z); f.scale.set(1, 0.6, 1);
        part(geoSphere(0.022, 8, 6), M(0xf4a23a), 0, head, x * 1.08, 0.15, z * 1.08);
        if (i % 2) { const lf = P(geoSphere(0.035, 8, 6), M(0x6fae4a), head, Math.sin(a + 0.35) * 0.22, 0.12, Math.cos(a + 0.35) * 0.21); lf.scale.set(1.3, 0.35, 0.7); lf.rotation.y = a; }
      }
    }
    if (k === 'beret') {
      const b = new THREE.Group(); b.position.set(0, 0.2, -0.01); b.rotation.set(-0.1, 0, 0.2); head.add(b);
      P(geoSphere(0.25, 18, 10), hb, b, 0, 0, 0).scale.set(1, 0.32, 1);
      P(geoSphere(0.025, 8, 6), M(0xe3b343), b, 0, 0.08, 0);
      const fe = P(geoSphere(0.06, 10, 8), M(GH.feather), b, -0.19, 0.08, -0.06); fe.scale.set(0.45, 2.2, 0.25); fe.rotation.set(-0.5, 0, 0.55);
      const fe2 = P(geoSphere(0.05, 10, 8), M(0xe8604c), b, -0.17, 0.05, -0.02); fe2.scale.set(0.4, 1.6, 0.25); fe2.rotation.set(-0.4, 0, 0.8);
    }
    if (k === 'hood') {
      cap(hb, 0.034, -0.02); P(latheY(HEADP, -0.2, 0.06, 10, 24, Math.PI * 0.42, Math.PI * 1.16, 0.04), M(GH.base, null, { side: THREE.DoubleSide }), hair);
      lock(0.2, 0.08, V3(0, 0.14, -0.22), V3(0, -0.3, -1), 0.8, hb);
      P(geoCyl(0.015, 0.018, 0.06, 6), M(0xf3ead6), head, 0.09, 0.27, 0.02);
      P(cachedGeo('fmush', () => new THREE.SphereGeometry(0.045, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2)), new THREE.MeshLambertMaterial({ color: 0x9ff5d2, emissive: 0x2f9a6e }), head, 0.09, 0.295, 0.02);
      const gl = glow(0.3); gl.position.set(0.09, 0.31, 0.02); head.add(gl);
    }
    if (k === 'frog') {
      cap(hb, 0.04, 0.03);
      for (const s of [1, -1]) { P(geoSphere(0.075, 12, 10), hb, head, 0.11 * s, 0.27, 0.06); P(geoSphere(0.05, 10, 8), M(0xffffff), head, 0.11 * s, 0.28, 0.1); part(geoSphere(0.025, 8, 6), M(0x24170f), 0, head, 0.11 * s, 0.285, 0.145); }
    }
    if (k === 'crab') {
      cap(M(0xffffff, shellTex), 0.04, 0.02);
      P(cachedGeo('gjrim', () => new THREE.TorusGeometry(0.218, 0.02, 6, 30)), M(0xe0704a), head, 0, 0.06, 0).rotation.x = Math.PI / 2 + 0.12;
      for (const s of [1, -1]) { P(geoCyl(0.012, 0.014, 0.1, 5), M(0xe0704a), head, 0.07 * s, 0.3, 0.06); P(geoSphere(0.03, 8, 6), M(0xffffff), head, 0.07 * s, 0.355, 0.06); const c = P(geoSphere(0.06, 10, 8), M(0xe0704a), head, 0.2 * s, 0.2, 0.04); c.scale.set(0.7, 0.6, 1.1); }
    }
    if (k === 'squirrel') {
      cap(M(0xffffff, furTexFor('#d9894a')), 0.035, 0.02);
      for (const s of [1, -1]) { const ear = P(geoCone(0.055, 0.14, 7), M(0xffffff, furTexFor('#d9894a')), head, 0.13 * s, 0.3, 0.0); ear.rotation.z = -0.3 * s; P(geoCone(0.022, 0.06, 5), M(0xfff6e4), head, 0.135 * s, 0.37, 0.005); }
    }
    if (k === 'bee') {
      cap(M(0xffffff, stripeTex), 0.04, 0.03);
      for (const s of [1, -1]) { const a = P(geoCyl(0.008, 0.008, 0.16, 5), M(0x3b2a1e), head, 0.07 * s, 0.33, 0.05); a.rotation.z = -0.4 * s; P(geoSphere(0.028, 8, 6), M(0x3b2a1e), head, 0.105 * s, 0.4, 0.05); }
    }
    if (k === 'bush') {
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; P(geoSphere(0.1, 10, 8), M(i % 2 ? 0x4e8a3a : 0x5f9c46), head, Math.sin(a) * 0.17, 0.2 + (i % 3) * 0.02, Math.cos(a) * 0.15 - 0.02); }
      P(geoSphere(0.14, 12, 10), M(0x4e8a3a), head, 0, 0.27, -0.02);
      for (const [x, z] of [[0.1, 0.12], [-0.12, 0.08], [0.02, 0.16]]) part(geoSphere(0.025, 8, 6), M(0xd9304a), 0, head, x, 0.3, z);
    }
    if (k === 'straw') {
      const brim = P(geoCyl(0.36, 0.36, 0.02, 28), hb, head, 0, 0.14, 0); brim.rotation.x = 0.08;
      P(geoCyl(0.17, 0.2, 0.13, 22), hb, head, 0, 0.21, -0.01);
      P(geoCyl(0.203, 0.203, 0.04, 22), M(GH.band), head, 0, 0.17, -0.01);
    }
    if (k === 'bramble') {
      P(cachedGeo('gbram', () => new THREE.TorusGeometry(0.2, 0.03, 6, 24)), hb, head, 0, 0.14, 0).rotation.x = Math.PI / 2 + 0.1;
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, x = Math.sin(a) * 0.2, z = Math.cos(a) * 0.2; const t = P(geoCone(0.02, 0.07, 5), M(0x6a9a3a), head, x, 0.18, z); t.rotation.set(Math.cos(a) * 0.4, 0, -Math.sin(a) * 0.4); if (i % 2) part(geoSphere(0.025, 8, 6), M(0xd9304a), 0, head, x * 1.05, 0.13, z * 1.05); }
    }
  }
  // necklace and ring: a cord with a gem in the item's rarity colour, a little band on the left hand
  if (GR.neck != null) {
    const cord = P(cachedGeo('gcord', () => new THREE.TorusGeometry(0.09, 0.008, 5, 22)), M(0xe3b343), upper, 0, 0.3, 0.035); cord.rotation.x = Math.PI / 2 - 0.55;
    const gem = new THREE.Mesh(geoSphere(0.028, 10, 8), new THREE.MeshLambertMaterial({ color: GR.neck, emissive: GR.neck, emissiveIntensity: 0.35 })); gem.position.set(0, 0.245, 0.17); gem.scale.set(0.9, 1.2, 0.6); upper.add(gem);
  }
  if (!GH && of === 'archer') {
    const hm = M(ch('hood', 0x5aa04e));
    cap(hm, 0.032, 0.0); P(latheY(HEADP, -0.16, 0.06, 10, 24, Math.PI * 0.45, Math.PI * 1.1, 0.036), M(ch('hood', 0x5aa04e), null, { side: THREE.DoubleSide }), hair);
    lock(0.18, 0.07, V3(0, 0.12, -0.22), V3(0, -0.2, -1), 0.8, hm);
  }
  if (of === 'pip') {
    const hm = M(0xfff4f7);
    cap(hm, 0.03, 0.07); P(latheY(HEADP, -0.16, 0.08, 10, 24, Math.PI * 0.45, Math.PI * 1.1, 0.034), M(0xfff4f7, null, { side: THREE.DoubleSide }), hair);
    for (const s of [1, -1]) { const ear = P(geoSphere(0.06, 12, 10), hm, hair, 0.09 * s, 0.34, -0.02); ear.scale.set(0.6, 2.3, 0.45); ear.rotation.z = -0.18 * s; const inner = new THREE.Mesh(geoSphere(0.06, 10, 8), M(0xffc2d1)); inner.scale.set(0.38, 1.9, 0.2); inner.position.set(0.09 * s - 0.004 * s, 0.33, 0.006); inner.rotation.z = -0.18 * s; hair.add(inner); }
  }
  if (!GH && (of === 'mage' || of === 'lumi')) {
    const hatM = M(of === 'lumi' ? 0x2f2a52 : ch('hat', 0x5a4aa8)), hat = new THREE.Group(); hat.position.y = 0.2; hat.rotation.set(-0.08, 0, of === 'lumi' ? 0.18 : -0.16); head.add(hat);
    P(geoCyl(0.31, 0.31, 0.025, 28), hatM, hat, 0, 0.0, 0);
    P(geoCyl(0.205, 0.21, 0.055, 24), M(of === 'lumi' ? 0xffd96a : ch('trim', 0xf2c14e)), hat, 0, 0.04, 0);
    const cone = P(geoCone(0.2, 0.44, 18), hatM, hat, 0.03, 0.27, -0.02); cone.rotation.z = -0.22;
  }
  if (!GH && of === 'warrior') {
    P(cachedGeo('band', () => new THREE.CylinderGeometry(0.226, 0.226, 0.045, 28, 1, true)), M(ch('band', 0xe8604c), null, { side: THREE.DoubleSide }), head, 0, 0.1, 0).scale.set(1, 1, 0.96);
    for (const k of [0, 1]) { const r = P(geoBox(0.05, 0.16, 0.012), M(0xc8503e), head, 0.14 + k * 0.04, 0.02 - k * 0.03, -0.16); r.rotation.set(0.3, 0.6, 0.25 + k * 0.3); }
  }
  if (of === 'mira') {
    cap(M(0xffffff, bandanaTex), 0.03, 0.06);
    P(geoCone(0.05, 0.1, 6), M(0xf39a3d), hair, 0.17, 0.15, -0.12).rotation.set(0, 0, -1.2);
    P(geoCone(0.045, 0.1, 6), M(0xe8842c), hair, 0.17, 0.09, -0.14).rotation.set(0, 0, -2.0);
  }
  if (of === 'bolt') {
    P(cachedGeo('gband', () => new THREE.TorusGeometry(0.222, 0.013, 6, 30)), M(0x3b2a1e), head, 0, 0.12, 0).rotation.x = Math.PI / 2;
    for (const s of [1, -1]) {
      P(geoCyl(0.05, 0.05, 0.03, 18), M(0x9fd3ef), head, 0.065 * s, 0.135, 0.2).rotation.x = Math.PI / 2 - 0.25;
      P(cachedGeo('grim', () => new THREE.TorusGeometry(0.05, 0.009, 6, 18)), M(0xe3b343), head, 0.065 * s, 0.137, 0.216).rotation.x = -0.25;
    }
  }
  if (of === 'elder') {
    const wm = M(0xf4f1ea);
    for (const s of [1, -1]) { P(geoSphere(0.07, 12, 10), wm, head, 0.2 * s, 0.0, -0.03).scale.set(0.8, 1.2, 1); P(geoSphere(0.04, 10, 8), wm, head, 0.072 * s, 0.065, 0.188).scale.set(1.4, 0.55, 0.5); }
    P(geoSphere(0.15, 16, 12), wm, head, 0, -0.17, 0.11).scale.set(1.1, 1.3, 0.6);
    for (const s of [1, -1]) P(geoSphere(0.045, 10, 8), M(0xffffff), head, 0.04 * s, -0.07, 0.2).scale.set(1.3, 0.6, 0.6);
    for (const [x, rz, c] of [[-0.06, 0.6, 0x6fae4a], [0.06, -0.6, 0x86c45e], [0, 0, 0x5a9a3a]]) { const lf = P(geoSphere(0.06, 10, 8), M(c), head, x, 0.25, 0); lf.scale.set(0.5, 1.4, 0.25); lf.rotation.z = rz; }
  }
  if (!GH && of === 'robot') {
    // a steel helmet with a see-through blue visor and a little antenna
    const steel = M(0xb8c2cc);
    cap(steel, 0.034, 0.02);
    const visor = new THREE.Mesh(latheY(HEADP, 0.02, 0.13, 6, 24, Math.PI * 0.62, Math.PI * 0.76, 0.05), new THREE.MeshLambertMaterial({ color: 0x8fe6ff, emissive: 0x1a6a8a, transparent: true, opacity: 0.55, side: THREE.DoubleSide })); head.add(visor);
    for (const s of [1, -1]) P(geoCyl(0.05, 0.05, 0.04, 14), M(0x5a6470), head, 0.215 * s, 0.0, 0).rotation.z = Math.PI / 2;
    P(geoCyl(0.008, 0.008, 0.14, 5), M(0x5a6470), head, 0.08, 0.3, -0.02);
    const tip = new THREE.Mesh(geoSphere(0.022, 8, 6), new THREE.MeshLambertMaterial({ color: 0xff6a5a, emissive: 0xa02010 })); tip.position.set(0.08, 0.38, -0.02); head.add(tip);
  }
  if (of === 'tobin') {
    // an old flying cap with goggles, white tufts over the ears and a big bushy moustache
    const wm = M(0xf4f1ea), cm = M(0x8a5a36);
    cap(cm, 0.03, 0.02);
    for (const s of [1, -1]) { const flap = P(geoBox(0.07, 0.14, 0.05), cm, head, 0.205 * s, -0.04, -0.02); flap.rotation.z = 0.12 * s; P(geoSphere(0.065, 12, 10), wm, head, 0.2 * s, -0.12, -0.06).scale.set(0.8, 1.1, 1); }
    P(cachedGeo('gband', () => new THREE.TorusGeometry(0.222, 0.013, 6, 30)), M(0x3b2a1e), head, 0, 0.13, 0).rotation.x = Math.PI / 2;
    for (const s of [1, -1]) {
      P(geoCyl(0.05, 0.05, 0.03, 18), M(0x9fd3ef), head, 0.065 * s, 0.15, 0.2).rotation.x = Math.PI / 2 - 0.35;
      P(cachedGeo('grim', () => new THREE.TorusGeometry(0.05, 0.009, 6, 18)), M(0xe3b343), head, 0.065 * s, 0.152, 0.214).rotation.x = -0.35;
      const mo = P(geoSphere(0.06, 12, 10), wm, head, 0.055 * s, -0.075, 0.195); mo.scale.set(1.35, 0.6, 0.6); mo.rotation.z = -0.35 * s;
    }
  }
  if (of === 'fennick') {
    // a mossy hood with a leaf and a tiny glowing mushroom, and a long grey-green beard
    const hm = M(0x5f7a42);
    cap(hm, 0.034, -0.02); P(latheY(HEADP, -0.2, 0.06, 10, 24, Math.PI * 0.42, Math.PI * 1.16, 0.04), M(0x5f7a42, null, { side: THREE.DoubleSide }), hair);
    lock(0.2, 0.08, V3(0, 0.14, -0.22), V3(0, -0.3, -1), 0.8, hm);
    const lf = P(geoSphere(0.06, 10, 8), M(0x86c45e), head, -0.08, 0.27, 0.02); lf.scale.set(0.5, 1.4, 0.25); lf.rotation.z = 0.6;
    P(geoCyl(0.015, 0.018, 0.06, 6), M(0xf3ead6), head, 0.09, 0.27, 0.02);
    P(cachedGeo('fmush', () => new THREE.SphereGeometry(0.045, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2)), new THREE.MeshLambertMaterial({ color: 0x9ff5d2, emissive: 0x2f9a6e }), head, 0.09, 0.295, 0.02);
    const bm = M(0xffffff, hairTexFor('#a7b49c'));
    const beard = P(lathe([[0.0, -0.46], [0.035, -0.43], [0.085, -0.35], [0.12, -0.23], [0.13, -0.11], [0.11, -0.03], [0.0, 0.0]], 18), bm, head, 0, -0.1, 0.11); beard.scale.set(1, 1, 0.62);
    for (const s of [1, -1]) { const mo = P(geoSphere(0.055, 12, 10), bm, head, 0.05 * s, -0.08, 0.195); mo.scale.set(1.3, 0.6, 0.6); mo.rotation.z = -0.4 * s; }
  }
  // arms
  const gloveGeo = cachedGeo('glove2', () => lathe([[0.046, -0.16], [0.05, -0.13], [0.06, -0.09], [0.068, -0.065], [0.062, -0.05]], 16));
  const sleeveM = M(0xffffff, clothTexFor(shirtHex));
  for (const s of [1, -1]) {
    const side = s > 0 ? 'L' : 'R';
    const sh = new THREE.Bone(); sh.position.set(0.18 * s, 0.25, 0); upper.add(sh);
    const el = new THREE.Bone(); el.position.y = -0.16; sh.add(el);
    skinnedLimb(upper, ARM, -0.08, 0.3, 0.09, 0.04, 0.18 * s, MS(skinHex), sh, el, limbs, T);
    if (robe) P(lathe([[0.1, -0.26], [0.088, -0.18], [0.072, -0.08], [0.066, 0.02]], 16), M(new THREE.Color(shirtHex).getHex(), null, { side: THREE.DoubleSide }), sh);
    else if (of === 'mira') P(geoSphere(0.072, 12, 10), M(0xf6a8b8), sh, 0, -0.02, 0);
    else { P(geoSphere(0.066, 14, 10), sleeveM, sh); P(geoCyl(0.064, 0.058, of === 'bolt' ? 0.06 : 0.1, 12), sleeveM, sh, 0, -0.035, 0); }
    if (of === 'warrior' || of === 'robot') { const pad = P(cachedGeo('pad', () => new THREE.SphereGeometry(0.09, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2)), M(0xb8c2cc), sh, 0, 0.01, 0); pad.scale.set(1.05, 0.85, 1.05); pad.rotation.z = -0.35 * s; }
    if (gloves) P(gloveGeo, M(0xffffff, gloveTexFor(gloves)), el);
    const hand = new THREE.Group(); hand.position.y = -0.19; el.add(hand);
    if (gloves) { P(geoSphere(0.066, 12, 10), M(new THREE.Color(gloves).getHex()), hand).scale.set(1, 0.9, 1.1); P(geoSphere(0.027, 8, 6), M(new THREE.Color(gloves).getHex()), hand, -0.045 * s, 0.01, 0.035); }
    else P(geoSphere(0.052, 12, 10), skinM, hand, 0, 0.02, 0).scale.set(1, 0.95, 1.05);
    if (GR.ring != null && s > 0) {
      const rg = P(cachedGeo('gring', () => new THREE.TorusGeometry(0.05, 0.011, 6, 16)), M(0xe3b343), hand, 0, 0.045, 0); rg.rotation.x = Math.PI / 2;
      const gm = new THREE.Mesh(geoSphere(0.018, 8, 6), new THREE.MeshLambertMaterial({ color: GR.ring, emissive: GR.ring, emissiveIntensity: 0.4 })); gm.position.set(0, 0.05, 0.055); hand.add(gm);
    }
    j['arm' + side] = sh; j['elbow' + side] = el; j['hand' + side] = hand;
  }
  // props
  const prop = (name) => {
    const g = new THREE.Group();
    if (name === 'stick') { g.rotation.x = 2.2; j.handR.add(g); P(cachedGeo('stickG', () => new THREE.CylinderGeometry(0.024, 0.036, 0.72, 7)), M(0xffffff, stickTex), g, 0, 0.26, 0); P(geoCyl(0.04, 0.04, 0.08, 8), M(0x7a5236), g); }
    if (name === 'cane') { j.handR.add(g); g.rotation.x = 0.2; P(geoCyl(0.02, 0.024, 0.8, 8), M(0xa8774f), g, 0, -0.34, 0); P(cachedGeo('hook', () => new THREE.TorusGeometry(0.05, 0.02, 6, 12, Math.PI)), M(0xa8774f), g, -0.05, 0.06, 0); }
    if (name === 'hammer') { upper.add(g); g.position.set(-0.24, 0.36, -0.02); g.rotation.set(-0.35, 0, 0.55); P(geoCyl(0.024, 0.028, 0.6, 8), M(0x8a5a35), g, 0, 0, 0); P(geoBox(0.2, 0.12, 0.12), M(0x9aa5b0), g, 0, 0.32, 0); }
    if (name === 'potion') { j.handR.add(g); g.position.set(0, -0.02, 0.06); P(geoSphere(0.06, 14, 10), M(0xe65a50), g, 0, 0.0, 0); P(geoCyl(0.022, 0.026, 0.06, 8), M(0xe65a50), g, 0, 0.07, 0); P(geoCyl(0.024, 0.024, 0.03, 8), M(0xa8774f), g, 0, 0.11, 0); }
    if (name === 'egg') { upper.add(g); g.position.set(0, 0.1, 0.27); P(geoSphere(0.1, 18, 14), M(0xffffff, eggTexFor('#9ed7f2')), g).scale.set(0.85, 1.05, 0.85); }
    if (name === 'swordDown') { g.rotation.x = Math.PI; j.handR.add(g); P(geoBox(0.05, 0.52, 0.014), M(0xe6eef5), g, 0, 0.34, 0); P(geoBox(0.17, 0.028, 0.045), M(0xf2c14e), g, 0, 0.07, 0); P(geoCyl(0.019, 0.019, 0.12, 8), M(0x6b4a30), g, 0, 0.0, 0); }
    if (name === 'lantern') { j.handL.add(g); g.position.y = -0.02; g.rotation.x = Math.PI; P(geoBox(0.12, 0.14, 0.12), new THREE.MeshLambertMaterial({ color: 0xffe9a3, emissive: 0x8a6a10 }), g, 0, 0.12, 0); P(geoCone(0.1, 0.07, 4), stoneM, g, 0, 0.225, 0).rotation.y = Math.PI / 4; }
    if (name === 'kite') {
      // a little paper kite with a ribbon tail
      j.handL.add(g); g.position.set(0, 0.02, 0.06); g.rotation.set(-1.1, 0, 0.25);
      const k = new THREE.Group(); k.position.y = 0.2; g.add(k);
      const sail = P(cachedGeo('kiteSail', () => new THREE.CircleGeometry(0.16, 4)), M(0xe8604c, null, { side: THREE.DoubleSide }), k); sail.scale.set(0.8, 1.25, 1);
      P(cachedGeo('kiteSail2', () => new THREE.CircleGeometry(0.16, 4, 0, Math.PI / 2)), M(0xf4c542, null, { side: THREE.DoubleSide }), k, 0, 0, 0.003).scale.set(0.8, 1.25, 1);
      part(geoBox(0.012, 0.4, 0.012), M(0x8a5a36), 0, k, 0, 0, 0.006); part(geoBox(0.26, 0.012, 0.012), M(0x8a5a36), 0, k, 0, 0.03, 0.006);
      for (let i = 0; i < 3; i++) part(geoBox(0.05, 0.022, 0.012), M([0x4f79b8, 0xf4c542, 0x6fae4a][i]), 0, k, 0.02 * (i % 2), -0.25 - i * 0.07, 0).rotation.z = 0.5;
    }
    // ---- job weapons (delivery 5) ----
    if (name === 'sword' || name === 'swordL') {
      (name === 'swordL' ? j.handL : j.handR).add(g); g.rotation.x = 2.2;
      P(geoCyl(0.022, 0.026, 0.13, 8), M(0x6b4a30), g, 0, 0.0, 0);
      P(geoBox(0.17, 0.03, 0.045), M(0xe3b343), g, 0, 0.075, 0);
      P(geoBox(0.052, 0.5, 0.016), M(0xdfe8f0), g, 0, 0.34, 0);
      P(geoCone(0.026, 0.07, 4), M(0xdfe8f0), g, 0, 0.625, 0).scale.set(1, 1, 0.3);
      P(geoSphere(0.025, 8, 6), M(0xe3b343), g, 0, -0.075, 0);
    }
    if (name === 'shield') {
      j.elbowL.add(g); g.position.set(0.075, -0.13, 0.02); g.rotation.set(0, 0, 0);
      const disc = P(geoCyl(0.17, 0.17, 0.035, 22), M(0xa8774f), g); disc.rotation.z = Math.PI / 2;
      const rim = P(cachedGeo('shieldRim', () => new THREE.TorusGeometry(0.17, 0.018, 6, 26)), M(0xb8c2cc), g, 0.004, 0, 0); rim.rotation.y = Math.PI / 2;
      const boss = P(geoSphere(0.045, 10, 8), M(0xb8c2cc), g, 0.025, 0, 0); boss.scale.set(0.6, 1, 1);
      const lf = P(geoSphere(0.06, 10, 8), M(0x6fae4a), g, 0.022, 0.08, 0); lf.scale.set(0.2, 0.45, 1.1); lf.rotation.x = 0.6;
    }
    if (name === 'bow') {
      // a tall bow at the left side: the arc bulges forward, the string runs down behind the grip
      upper.add(g); g.position.set(0.25, -0.2, -0.24); g.rotation.y = -Math.PI / 2;
      const A = Math.PI * 0.8, arc = P(cachedGeo('bowArc', () => new THREE.TorusGeometry(0.36, 0.018, 6, 22, A)), M(0x8a5a35), g); arc.rotation.z = -A / 2;
      const sx = 0.36 * Math.cos(A / 2), sl = 2 * 0.36 * Math.sin(A / 2);
      const string = new THREE.Mesh(geoCyl(0.004, 0.004, sl, 4), new THREE.MeshBasicMaterial({ color: 0xf6efdc })); string.position.set(sx, 0, 0); g.add(string);
      P(geoCyl(0.026, 0.026, 0.1, 8), M(0x4a3426), g, 0.36, 0, 0);
      j.bowString = string;
      const qv = new THREE.Group(); qv.position.set(-0.1, 0.22, -0.19); qv.rotation.set(0.35, 0, -0.35); upper.add(qv);
      P(geoCyl(0.055, 0.045, 0.32, 10), M(0x7a4e30), qv, 0, 0, 0);
      for (const [x, z, c] of [[-0.02, 0.01, 0xe8604c], [0.02, -0.01, 0xfff6e4], [0.0, 0.025, 0xe8604c]]) { part(geoCyl(0.006, 0.006, 0.12, 4), M(0x8a5a35), 0, qv, x, 0.2, z); P(geoCone(0.022, 0.05, 3), M(c), qv, x, 0.25, z); }
    }
    if (name === 'slingshot') {
      j.handR.add(g); g.rotation.x = 2.0; g.scale.setScalar(1.5);
      P(geoCyl(0.022, 0.026, 0.14, 8), M(0x8a5a35), g, 0, 0.02, 0);
      for (const s of [1, -1]) P(geoCyl(0.016, 0.02, 0.12, 6), M(0x8a5a35), g, 0.045 * s, 0.14, 0).rotation.z = -0.4 * s;
      const band = new THREE.Mesh(geoBox(0.13, 0.012, 0.012), M(0x5a3a22)); band.position.set(0, 0.19, 0); g.add(band);
      const pouch = P(geoSphere(0.05, 10, 8), M(0x8a5a36), upper, 0.15, -0.03, 0.06); pouch.scale.set(0.9, 1.1, 0.8);
    }
    if (name === 'staff') {
      j.handR.add(g); g.rotation.x = 0.15;
      P(geoCyl(0.02, 0.026, 1.05, 8), M(0x6b4a30), g, 0, -0.3, 0);
      for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; P(geoCone(0.012, 0.12, 5), M(0xe3b343), g, Math.cos(a) * 0.04, 0.27, Math.sin(a) * 0.04).rotation.set(Math.sin(a) * -0.5, 0, Math.cos(a) * 0.5); }
      const orb = new THREE.Mesh(geoSphere(0.065, 14, 10), new THREE.MeshLambertMaterial({ color: 0xa8d8ff, emissive: 0x3a5aa0 })); orb.position.y = 0.3; g.add(orb);
      const gl = glow(0.55); gl.position.y = 0.3; gl.material = gl.material.clone(); gl.material.color = new THREE.Color(0xbfe0ff); gl.material.opacity = 0.7; g.add(gl);
    }
    if (name === 'book') {
      upper.add(g); g.position.set(0.17, -0.02, 0.2); g.rotation.set(-0.35, 0.5, 0);
      P(geoBox(0.2, 0.26, 0.05), M(0x5a4aa8), g, 0, 0.0, 0);
      part(geoBox(0.185, 0.245, 0.04), M(0xfbf1dc), 0, g, 0.012, 0, 0);
      P(geoBox(0.04, 0.27, 0.055), M(0xe3b343), g, -0.1, 0, 0);
      const gem = new THREE.Mesh(geoSphere(0.025, 8, 6), new THREE.MeshLambertMaterial({ color: 0xffd36b, emissive: 0x7a5a10 })); gem.position.set(0, 0.03, 0.027); g.add(gem);
    }
    if (name === 'missileArm') {
      // a rocket tube strapped over the right forearm
      j.elbowR.add(g); g.position.set(0, -0.12, 0.02);
      P(geoCyl(0.06, 0.06, 0.24, 12), M(0x7a8794), g, 0, 0, 0);
      for (const x of [-0.025, 0.025]) { const m = P(geoCone(0.022, 0.06, 8), M(0xe8604c), g, x, -0.15, 0); m.rotation.x = Math.PI; }
      P(geoBox(0.05, 0.08, 0.05), M(0xf4c542), g, 0.065, 0.02, 0);
    }
    if (name === 'laserCannon') {
      // a short blaster held in the right hand, glowing at the muzzle
      j.handR.add(g); g.rotation.x = 2.2;
      P(geoBox(0.07, 0.1, 0.07), M(0x5a6470), g, 0, 0.0, 0);
      P(geoCyl(0.045, 0.05, 0.32, 12), M(0xb8c2cc), g, 0, 0.18, 0);
      P(geoCyl(0.055, 0.055, 0.05, 12), M(0x5a6470), g, 0, 0.3, 0);
      const mz = new THREE.Mesh(geoSphere(0.032, 10, 8), new THREE.MeshLambertMaterial({ color: 0x9ff0ff, emissive: 0x2a9ab8 })); mz.position.y = 0.34; g.add(mz);
    }
    // ---- job masters' extras ----
    if (name === 'greatsword') {
      upper.add(g); g.position.set(0.02, 0.22, -0.2); g.rotation.set(0.15, 0, 0.6);
      P(geoBox(0.08, 0.78, 0.02), M(0xdfe8f0), g, 0, 0.36, 0); P(geoBox(0.26, 0.04, 0.06), M(0xe3b343), g, 0, -0.05, 0); P(geoCyl(0.026, 0.03, 0.22, 8), M(0x6b4a30), g, 0, -0.18, 0); P(geoSphere(0.035, 8, 6), M(0xe3b343), g, 0, -0.3, 0);
    }
    if (name === 'hawk') {
      upper.add(g); g.position.set(0.2, 0.37, -0.01); g.rotation.y = 0.5; g.scale.setScalar(1.35);
      P(geoSphere(0.075, 12, 10), M(0x8a5a35), g, 0, 0.05, 0).scale.set(0.85, 1.1, 1.2);
      P(geoSphere(0.045, 10, 8), M(0xfff3dc), g, 0, 0.04, 0.05).scale.set(0.8, 1, 0.5);
      P(geoSphere(0.05, 10, 8), M(0x7a4e30), g, 0, 0.15, 0.03);
      P(geoCone(0.016, 0.04, 5), M(0xf2c14e), g, 0, 0.14, 0.085).rotation.x = Math.PI / 2 + 0.4;
      for (const s of [1, -1]) { const e = new THREE.Mesh(geoSphere(0.011, 6, 5), new THREE.MeshBasicMaterial({ color: 0x24170f })); e.position.set(0.026 * s, 0.16, 0.065); g.add(e); P(geoSphere(0.05, 8, 6), M(0x6b4226), g, 0.06 * s, 0.05, -0.01).scale.set(0.3, 0.9, 1.3); }
      P(geoBox(0.06, 0.02, 0.09), M(0x6b4226), g, 0, -0.02, -0.08).rotation.x = -0.4;
    }
    if (name === 'emberstaff') {
      j.handR.add(g); g.rotation.x = 0.15;
      P(geoCyl(0.02, 0.026, 1.05, 8), M(0x3a2a2a), g, 0, -0.3, 0);
      P(cachedGeo('emberRing', () => new THREE.TorusGeometry(0.06, 0.012, 6, 16)), M(0xe3b343), g, 0, 0.26, 0);
      const fl = new THREE.Mesh(geoCone(0.05, 0.16, 8), new THREE.MeshLambertMaterial({ color: 0xffb43d, emissive: 0xc04a10 })); fl.position.y = 0.34; g.add(fl);
      const gl = glow(0.7); gl.position.y = 0.33; gl.material = gl.material.clone(); gl.material.color = new THREE.Color(0xffc080); gl.material.opacity = 0.8; g.add(gl);
    }
    if (name === 'mushstaff') {
      // a crooked walking staff with a glowing mushroom on top
      j.handR.add(g); g.rotation.x = 0.15;
      P(geoCyl(0.02, 0.026, 1.0, 8), M(0x7a5a3a), g, 0, -0.3, 0);
      P(geoCyl(0.015, 0.024, 0.06, 6), M(0xf3ead6), g, 0, 0.23, 0);
      P(cachedGeo('smush', () => new THREE.SphereGeometry(0.08, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2)), new THREE.MeshLambertMaterial({ color: 0x9ff5d2, emissive: 0x2f9a6e }), g, 0, 0.26, 0);
      const gl = glow(0.5); gl.position.y = 0.3; gl.material = gl.material.clone(); gl.material.color = new THREE.Color(0xbfffe6); gl.material.opacity = 0.7; g.add(gl);
    }
    return g;
  };
  root.updateMatrixWorld(true);
  for (const lb of limbs) { const sk = new THREE.Skeleton(lb.bones); lb.mesh.bind(sk); if (lb.out) lb.out.bind(sk); }
  const pose = (bone, x, z) => { bone.rotation.set(x, 0, z); };
  pose(j.armL, 0.05, 0.16); pose(j.armR, -0.04, -0.15); j.elbowL.rotation.x = -0.35; j.elbowR.rotation.x = -0.42;
  const W = o.weapon;
  if (W === 'stick') j.weapon = prop('stick');
  if (W === 'cane') { j.weapon = prop('cane'); pose(j.armR, -0.3, -0.2); j.elbowR.rotation.x = -0.6; j.upper.rotation.x = 0.1; }
  if (W === 'hammer') { j.weapon = prop('hammer'); pose(j.armR, -0.55, -0.35); j.elbowR.rotation.x = -1.7; }
  if (W === 'potion') { j.weapon = prop('potion'); pose(j.armR, -0.6, -0.2); j.elbowR.rotation.x = -1.5; pose(j.armL, 0.05, 0.6); j.elbowL.rotation.x = -1.6; }
  if (W === 'egg') { j.weapon = prop('egg'); pose(j.armL, -0.55, -0.12); pose(j.armR, -0.55, 0.12); j.elbowL.rotation.x = -0.75; j.elbowR.rotation.x = -0.75; }
  if (W === 'statue') { prop('swordDown'); prop('lantern'); pose(j.armL, 2.75, 0.2); j.elbowL.rotation.x = -0.25; pose(j.armR, -0.1, -0.35); j.elbowR.rotation.x = -0.2; }
  if (W === 'kite') { j.weapon = prop('kite'); pose(j.armL, -0.75, 0.3); j.elbowL.rotation.x = -1.0; pose(j.armR, 0.05, -0.2); }
  if (W === 'mushstaff') { j.weapon = prop('mushstaff'); pose(j.armR, -0.35, -0.22); j.elbowR.rotation.x = -0.55; j.upper.rotation.x = 0.12; }
  // job weapons: what the right hand swings is j.weapon; a shield, bow or book sits in the left hand (j.offhand)
  if (W === 'swordShield') { j.weapon = prop('sword'); j.offhand = prop('shield'); pose(j.armL, -0.35, 0.3); j.elbowL.rotation.x = -1.1; }
  if (W === 'dualSwords') { j.weapon = prop('sword'); j.offhand = prop('swordL'); }
  if (W === 'bow') { j.offhand = prop('bow'); pose(j.armL, -0.15, 0.3); j.elbowL.rotation.x = -0.6; }
  if (W === 'slingshot') j.weapon = prop('slingshot');
  if (W === 'missileArm') { j.offhand = prop('missileArm'); pose(j.armR, -0.25, -0.2); j.elbowR.rotation.x = -1.0; }
  if (W === 'laserCannon') { j.weapon = prop('laserCannon'); }
  if (W === 'staff') { j.weapon = prop('staff'); pose(j.armR, -0.3, -0.2); j.elbowR.rotation.x = -0.5; }
  if (W === 'book') { j.offhand = prop('book'); pose(j.armL, -0.7, 0.2); j.elbowL.rotation.x = -1.5; }
  if (W === 'greatsword') prop('greatsword');
  if (W === 'emberstaff') { j.weapon = prop('emberstaff'); pose(j.armR, -0.3, -0.2); j.elbowR.rotation.x = -0.55; }
  for (const ex of o.extra || []) prop(ex);
  // an enhanced weapon (+7 and up) glows; the glow grows with each level
  if (GR.plus >= 7 && (j.weapon || j.offhand)) {
    const w = j.weapon || j.offhand, gc = GR.plus >= 10 ? 0xffd96a : GR.plus >= 9 ? 0xff9ad8 : GR.plus >= 8 ? 0xc6a8ff : 0x9fe0ff;
    for (const y of [0.15, 0.32, 0.5]) { const gl = glow(0.32 + (GR.plus - 7) * 0.08); gl.material = gl.material.clone(); gl.material.color = new THREE.Color(gc); gl.material.opacity = 0.75; gl.position.y = y; w.add(gl); }
    j.weaponGlow = gc;
  }
  const shd = blob(0.95); root.add(shd);
  return { root, rig, j, opts: o };
}
const ARLO = { gender: 'boy', hair: 'spiky', hairColor: '#8b5a36', outfit: 'novice', weapon: 'stick' };
const NPC_LOOKS = {
  mira: { gender: 'girl', hair: 'bob', hairColor: '#8b5a36', iris: '#7a4a24', outfit: 'mira', weapon: 'potion', mouth: 'open' },
  oakley: { gender: 'boy', skin: '#f3d2b8', hair: 'none', outfit: 'elder', weapon: 'cane', closed: true, brows: 'none', mouth: 'none' },
  bolt: { gender: 'boy', skin: '#e0ac80', hair: 'shortspiky', hairColor: '#c5532f', iris: '#3f2a1a', outfit: 'bolt', weapon: 'hammer', brows: 'thick', mouth: 'grin', stubble: true, bulk: 1.18, size: 1.08 },
  pip: { gender: 'girl', hair: 'bangs', hairColor: '#6fcfb3', iris: '#2f6b5a', outfit: 'pip', weapon: 'egg', mouth: 'open', freckles: true, size: 0.92 },
  tobin: { gender: 'boy', skin: '#f0c9a8', hair: 'none', iris: '#3f6a8a', outfit: 'tobin', weapon: 'kite', brows: 'thick', browCol: '#f4f1ea', mouth: 'open', size: 0.96 },
  fennick: { gender: 'boy', skin: '#e9c9a4', hair: 'none', iris: '#4f7a3a', outfit: 'fennick', weapon: 'mushstaff', brows: 'worried', browCol: '#b9c4ad', mouth: 'smile', size: 0.94 },
  // the three job masters (delivery 5)
  marla: { gender: 'girl', skin: '#f1c8a6', hair: 'pony', hairColor: '#c4422d', iris: '#5a3a22', outfit: 'warrior', weapon: 'greatsword', brows: 'thick', browCol: '#a8341f', mouth: 'grin', size: 1.04, bulk: 1.08, colors: { shirt: '#a9b4bf', band: '#f4c542' } },
  ivy: { gender: 'girl', skin: '#e2b48e', hair: 'long', hairColor: '#5a3a22', iris: '#3f7a39', outfit: 'archer', weapon: 'bow', extra: ['hawk'], mouth: 'smile', colors: { shirt: '#4f7a3a', hood: '#3f6a35', cloak: '#2f5a2f' } },
  nora: { gender: 'girl', skin: '#d9a77d', hair: 'twin', hairColor: '#4a3a5a', iris: '#3f6a8a', outfit: 'pip', weapon: 'none', mouth: 'smile', freckles: true, size: 0.96, colors: { shirt: '#5fa8c8' } },
  zara: { gender: 'girl', skin: '#f6d8c0', hair: 'bob', hairColor: '#3a2a4a', iris: '#c0503e', outfit: 'mage', weapon: 'emberstaff', brows: 'angry', browCol: '#2a1a2a', mouth: 'flat', size: 0.95, colors: { robe: '#a8342e', trim: '#f4a23a', hat: '#7a2420' } }
};
// NPCs stand still, so most of their parts are merged into a few meshes; the face stays swappable for blinking
function npcModel(id) {
  const c = chibi(NPC_LOOKS[id]);
  freeze(c.root);
  return c;
}
// Olly: a small blue-grey owl with a long orange scarf. Wings flap, eyes and brows change with the mood.
function olly() {
  const root = new THREE.Group(), body = new THREE.Group(); body.position.y = 0.55; root.add(body);
  part(geoSphere(0.26, 18, 14), lam(0x8fa3b8), 0.01, body).scale.set(1, 1.08, 0.95);
  const belly = new THREE.Mesh(geoSphere(0.18, 14, 10), lam(0xdbe3ea)); belly.scale.set(1, 0.8, 0.5); belly.position.set(0, -0.09, 0.17); body.add(belly);
  const eyes = [], brows = [], wings = [];
  const ink = new THREE.MeshBasicMaterial({ color: 0x2e211a });
  for (const s of [1, -1]) {
    const disc = new THREE.Mesh(geoSphere(0.088, 12, 10), lam(0xc8d4df)); disc.scale.set(1, 1, 0.35); disc.position.set(0.09 * s, 0.06, 0.205); body.add(disc);
    const iris = new THREE.Mesh(geoSphere(0.056, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffd36b })); iris.scale.set(1, 1, 0.4); iris.position.set(0.09 * s, 0.06, 0.232); body.add(iris);
    const pupil = new THREE.Mesh(geoSphere(0.03, 8, 6), ink); pupil.scale.set(1, 1, 0.5); pupil.position.set(0.09 * s, 0.06, 0.25); body.add(pupil);
    const shine = new THREE.Mesh(geoSphere(0.01, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff })); shine.position.set(0.09 * s - 0.012, 0.072, 0.262); body.add(shine);
    const arc = new THREE.Mesh(cachedGeo('ollyArc', () => new THREE.TorusGeometry(0.04, 0.009, 6, 12, Math.PI)), ink); arc.position.set(0.09 * s, 0.05, 0.25); arc.visible = false; body.add(arc);
    eyes.push({ iris, pupil, shine, arc });
    part(geoCone(0.055, 0.15, 6), lam(0x71879e), 0.01, body, 0.15 * s, 0.27, 0.02).rotation.z = -0.45 * s;
    const brow = new THREE.Mesh(geoBox(0.09, 0.016, 0.01), lam(0x4a3428)); brow.position.set(0.09 * s, s > 0 ? 0.16 : 0.15, 0.24); brow.rotation.z = s > 0 ? -0.3 : 0.12; body.add(brow);
    brows.push({ m: brow, s });
    const pivot = new THREE.Group(); pivot.position.set(0.2 * s, 0.06, 0); body.add(pivot);
    const w = part(geoSphere(0.16, 12, 10), lam(0x71879e), 0.01, pivot, 0.08 * s, -0.08, 0); w.scale.set(0.32, 0.85, 0.7); w.rotation.z = 0.6 * s;
    wings.push({ pivot, s });
    part(geoSphere(0.035, 8, 6), lam(0xf2a33a), 0, body, 0.06 * s, -0.27, 0.05);
  }
  const beak = part(geoCone(0.032, 0.08, 6), lam(0xf2a33a), 0.006, body, 0, -0.005, 0.26); beak.rotation.x = Math.PI + 0.4;
  const scarf = part(cachedGeo('scarf', () => new THREE.TorusGeometry(0.245, 0.048, 8, 26)), lam(0xe2683c), 0.01, body, 0, -0.1, 0); scarf.rotation.x = Math.PI / 2; scarf.scale.set(1, 0.95, 1);
  const tails = [];
  for (const [x, rz, len] of [[0.13, 0.25, 0.2], [0.19, 0.5, 0.16]]) {
    const piv = new THREE.Group(); piv.position.set(x, -0.13, 0.2); body.add(piv);
    const tl = part(geoBox(0.075, len, 0.025), lam(0xd65a30), 0.008, piv, 0, -len / 2, 0); piv.rotation.set(-0.25, 0, rz);
    tails.push({ piv, rz });
  }
  const shadow = blob(0.6); root.add(shadow);
  function setFace(expr) {
    const happy = expr === 'happy', sur = expr === 'surprised', wor = expr === 'worried';
    for (const e of eyes) { e.iris.visible = e.pupil.visible = e.shine.visible = !happy; e.arc.visible = happy; const k = sur ? 0.65 : wor ? 0.85 : 1; e.pupil.scale.set(k, k, 0.5); e.iris.scale.set(sur ? 1.12 : 1, sur ? 1.12 : 1, 0.4); }
    for (const b of brows) {
      const s = b.s;
      if (happy) { b.m.position.y = 0.175; b.m.rotation.z = 0; }
      else if (sur) { b.m.position.y = 0.19; b.m.rotation.z = -0.1 * s; }
      else if (wor) { b.m.position.y = 0.165; b.m.rotation.z = -0.35 * s; }
      else { b.m.position.y = s > 0 ? 0.16 : 0.15; b.m.rotation.z = s > 0 ? -0.3 : 0.12; }
    }
    beak.rotation.x = Math.PI + (sur ? 0.65 : 0.4);
  }
  return { root, body, wings, tails, shadow, setFace };
}
function statueFigure() {
  const c = chibi(Object.assign({}, ARLO, { outfit: 'stone', weapon: 'statue' }));
  return freeze(c.root);
}

// ---------- monsters ----------
const starShape = (() => { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.045 : 0.11, a = (i / 10) * Math.PI * 2 + Math.PI / 2; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (i === 0) s.moveTo(x, y); else s.lineTo(x, y); } s.closePath(); return new THREE.ShapeGeometry(s); })();
function addExtras(p, headY, headR) {
  const sweat = new THREE.Mesh(geoSphere(0.08, 10, 8), new THREE.MeshLambertMaterial({ color: 0xbfe6ff })); sweat.add(new THREE.Mesh(geoSphere(0.08, 10, 8), outlineMat(0.012)));
  sweat.scale.set(0.7, 1.15, 0.7); sweat.position.set(headR * 0.75, headY + headR * 0.45, headR * 0.35); sweat.visible = false; sweat.userData.live = true; p.body.add(sweat);
  const stars = new THREE.Group(); stars.position.y = headY + headR + 0.25; stars.visible = false; stars.userData.live = true; p.body.add(stars);
  for (let i = 0; i < 3; i++) { const st = new THREE.Mesh(starShape, new THREE.MeshBasicMaterial({ color: 0xffe24d, side: THREE.DoubleSide })); const a = (i / 3) * Math.PI * 2; st.position.set(Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3); stars.add(st); }
  p.sweat = sweat; p.stars = stars;
}
// Leaflet and its hill cousin, the Breeze Leaflet (pale blue, with a dandelion puff instead of leaves)
function buildLeaflet(breeze) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const faces = breeze ? FACES.breeze : FACES.leaflet;
  const mat = new THREE.MeshLambertMaterial({ map: faces.normal });
  part(geoSphere(0.75, 28, 20), mat, 0.03, body, 0, 0.6, 0).scale.set(1, 0.8, 1);
  part(geoCyl(0.02, 0.03, breeze ? 0.42 : 0.32, 5), lam(breeze ? 0x7fbf6a : 0x4fae4a), 0.012, body, 0, breeze ? 1.25 : 1.2, 0).rotation.z = -0.15;
  if (breeze) {
    // a dandelion clock: a soft white ball with little seed spokes
    const puff = part(geoSphere(0.22, 14, 10), lam(0xfdfaf0), 0.012, body, 0.04, 1.5, 0);
    const seeds = [];
    for (let i = 0; i < 26; i++) { const a = i * 2.4, el = Math.acos(1 - 2 * ((i + 0.5) / 26)), d = V3(Math.sin(el) * Math.cos(a), Math.cos(el), Math.sin(el) * Math.sin(a)); seeds.push({ g: geoCyl(0.008, 0.008, 0.12, 4), m: RW.mdir(V3(0.04 + d.x * 0.26, 1.5 + d.y * 0.26, d.z * 0.26), d, 1) }); }
    body.add(new THREE.Mesh(bake(seeds), lam(0xf4eedc, null, { vertexColors: true })));
    puff.scale.set(1, 0.95, 1);
    const lf = part(geoSphere(0.16, 10, 8), lam(0x7fbf6a), 0.012, body, -0.14, 1.24, 0); lf.scale.set(1, 0.16, 0.5); lf.rotation.z = -0.6;
  } else for (const [s, c] of [[1, 0x4fae4a], [-1, 0x62c159]]) { const lf = part(geoSphere(0.2, 10, 8), lam(c), 0.012, body, 0.16 * s + 0.03, 1.38, 0); lf.scale.set(1, 0.16, 0.5); lf.rotation.z = 0.5 * s; }
  const p = { root, body, mat, faces };
  addExtras(p, 0.75, 0.6);
  freeze(body);
  return p;
}
// Mushling and the Moss Mushling of Whisperwood (green mossy cap, softly glowing spots)
function buildMushling(moss) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const faces = moss ? FACES.moss : FACES.mushling;
  const mat = new THREE.MeshLambertMaterial({ map: faces.normal });
  for (const s of [1, -1]) part(geoSphere(0.16, 10, 8), lam(moss ? 0xd9dcb4 : 0xf3dcb8), 0.02, body, 0.19 * s, 0.07, 0.05).scale.set(1, 0.55, 1.2);
  part(cachedGeo('mstem', () => new THREE.CylinderGeometry(0.32, 0.38, 0.62, 20, 1, false, Math.PI, Math.PI * 2)), mat, 0.025, body, 0, 0.42, 0);
  part(cachedGeo('mcap', () => new THREE.SphereGeometry(0.66, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2)), moss ? lam(0xffffff, mossTex) : lam(0xe8604c), 0.03, body, 0, 0.7, 0).scale.y = 0.8;
  const under = new THREE.Mesh(cachedGeo('mcapU', () => new THREE.CircleGeometry(0.66, 22)), lam(moss ? 0xdfe3bf : 0xf3dcb8)); under.rotation.x = Math.PI / 2; under.position.y = 0.7; body.add(under);
  const spots = [];
  for (let i = 0; i < 7; i++) { const th = 0.3 + (i / 7) * 0.95, ph = i * 2.3, n = V3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)); spots.push({ g: geoSphere(1, 8, 6), m: new THREE.Matrix4().compose(V3(n.x * 0.66, 0.7 + n.y * 0.66 * 0.8, n.z * 0.66), new THREE.Quaternion().setFromUnitVectors(ZAX, n), V3(0.11, 0.11, 0.03)) }); }
  body.add(new THREE.Mesh(bake(spots), moss ? new THREE.MeshLambertMaterial({ color: 0x9ff5d2, emissive: 0x2f9a6e, vertexColors: true }) : new THREE.MeshLambertMaterial({ color: 0xffffff, vertexColors: true })));
  if (moss) {
    // moss drips from the rim of the cap
    const drips = [];
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + 0.2; drips.push({ g: geoSphere(0.07, 6, 5), m: new THREE.Matrix4().compose(V3(Math.cos(a) * 0.62, 0.66, Math.sin(a) * 0.62), new THREE.Quaternion(), V3(1, 1.5 - (i % 3) * 0.25, 1)), col: new THREE.Color(i % 2 ? 0x6a9a48 : 0x86b85c) }); }
    body.add(new THREE.Mesh(bake(drips), new THREE.MeshLambertMaterial({ vertexColors: true })));
  }
  const p = { root, body, mat, faces };
  addExtras(p, 0.55, 0.45);
  freeze(body);
  return p;
}
// Bristleboar: a small boar with a bristly ridge, tusks and a curly tail (from the approved Lookbook)
function buildBoar() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const t = part(geoSphere(0.5, 20, 14), lam(0xffffff, bristleTex), 0.025, body, 0, 0.58, -0.05); t.scale.set(0.9, 0.78, 1.28);
  const ridge = [];
  for (let i = 0; i < 6; i++) ridge.push({ g: geoCone(0.07, 0.24, 5), m: RW.mtx(0, 0.98 - i * 0.015, 0.28 - i * 0.14, -0.6, 0, 0) });
  part(bake(ridge), lam(0x4e3220, null, { vertexColors: true }), 0.012, body);
  const mat = new THREE.MeshLambertMaterial({ map: FACES.boar.normal });
  part(geoSphere(0.32, 22, 16), mat, 0.022, body, 0, 0.66, 0.52);
  part(cachedGeo('snout', () => new THREE.CylinderGeometry(0.13, 0.155, 0.2, 14)), lam(0xc98f72), 0.015, body, 0, 0.56, 0.84).rotation.x = Math.PI / 2;
  for (const s of [1, -1]) {
    const nos = new THREE.Mesh(geoSphere(0.03, 6, 5), lam(0x3b2218)); nos.position.set(0.05 * s, 0.57, 0.945); body.add(nos);
    part(geoCone(0.03, 0.16, 6), lam(0xfff6e4), 0.008, body, 0.1 * s, 0.5, 0.86).rotation.set(-0.5, 0, -0.5 * s);
    part(geoCone(0.08, 0.17, 5), lam(0x7a4e30), 0.012, body, 0.2 * s, 0.92, 0.45).rotation.set(-0.3, 0, -0.45 * s);
  }
  const legs = [];
  for (const [x, z] of [[0.22, 0.32], [-0.22, 0.32], [0.22, -0.4], [-0.22, -0.4]]) {
    const piv = new THREE.Group(); piv.position.set(x, 0.32, z); body.add(piv);
    part(geoCyl(0.075, 0.06, 0.32, 8), lam(0x4e3220), 0.015, piv, 0, -0.16, 0);
    piv.userData.live = true; legs.push(piv);
  }
  part(cachedGeo('btail', () => new THREE.TorusGeometry(0.07, 0.02, 6, 12, Math.PI * 1.5)), lam(0x6e4529), 0.008, body, 0, 0.66, -0.66).rotation.y = Math.PI / 2;
  const p = { root, body, mat, faces: FACES.boar, legs };
  addExtras(p, 0.8, 0.4);
  freeze(body);
  return p;
}
// Thornhog: a round hedgehog covered in spines, with a pale face and little feet
function buildThornhog() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const bm = part(geoSphere(0.5, 20, 14), lam(0xffffff, furTexFor('#a8774f')), 0.025, body, 0, 0.45, -0.05); bm.scale.set(1, 0.78, 1.15);
  const spikes = [], rr = RW.seeded(77);
  for (let i = 0; i < 90; i++) { const a = rr() * Math.PI * 2, el = 0.05 + rr() * 1.35, d = V3(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el) - 0.3).normalize(); if (d.z > 0.4) continue; spikes.push({ g: geoCone(0.065, 0.3, 5), m: RW.mdir(V3(d.x * 0.58, 0.45 + d.y * 0.47, -0.05 + d.z * 0.655), d, 1) }); }
  body.add(new THREE.Mesh(bake(spikes), lam(0x5e4129, null, { vertexColors: true })));
  const mat = new THREE.MeshLambertMaterial({ map: FACES.thorn.normal });
  const face = part(geoSphere(0.3, 20, 14), mat, 0.02, body, 0, 0.42, 0.36); face.scale.set(1, 0.9, 0.8);
  part(geoSphere(0.05, 8, 6), lam(0x24170f), 0.008, body, 0, 0.4, 0.62);
  const legs = [];
  for (const [x, z] of [[0.2, 0.2], [-0.2, 0.2], [0.2, -0.28], [-0.2, -0.28]]) {
    const piv = new THREE.Group(); piv.position.set(x, 0.1, z); body.add(piv);
    part(geoSphere(0.09, 8, 6), lam(0x5e4129), 0.012, piv, 0, -0.04, 0).scale.set(1, 0.55, 1.3);
    piv.userData.live = true; legs.push(piv);
  }
  const p = { root, body, mat, faces: FACES.thorn, legs };
  addExtras(p, 0.6, 0.45);
  freeze(body);
  return p;
}
const MONSTER_BUILD = { leaflet: () => buildLeaflet(false), mushling: () => buildMushling(false), breeze_leaflet: () => buildLeaflet(true), moss_mushling: () => buildMushling(true), bristleboar: buildBoar, thornhog: buildThornhog };
// ---------- training targets for the job masters ----------
const targetTex = ctex('target', 256, 128, (g, w, h) => { g.fillStyle = '#e8d5a0'; g.fillRect(0, 0, w, h); for (const [r, c] of [[46, '#c0503e'], [34, '#fff6e4'], [22, '#c0503e'], [10, '#fff6e4']]) { g.fillStyle = c; ell(g, 64, 64, r, r * 1.2); } }, null);
const noFaces = (t) => ({ normal: t, angry: t, hurt: t, dizzy: t });
function buildDummy() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  part(geoCyl(0.06, 0.07, 1.1, 8), lam(0x8a5a35), 0.015, body, 0, 0.55, 0);
  part(geoCyl(0.26, 0.3, 0.7, 12), lam(0xd9b96a), 0.02, body, 0, 0.9, 0);
  for (const y of [0.7, 1.1]) part(geoCyl(0.31, 0.31, 0.05, 12), lam(0x8a5a35), 0, body, 0, y, 0);
  const arm = part(geoCyl(0.04, 0.04, 1.1, 6), lam(0x8a5a35), 0.012, body, 0, 1.05, 0); arm.rotation.z = Math.PI / 2;
  const mat = new THREE.MeshLambertMaterial({ map: targetTex });
  part(geoSphere(0.24, 16, 12), mat, 0.02, body, 0, 1.45, 0);
  const p = { root, body, mat, faces: noFaces(targetTex) };
  addExtras(p, 1.45, 0.24); freeze(body); return p;
}
function buildBalloon() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const mat = new THREE.MeshLambertMaterial({ color: 0xe8604c });
  part(geoSphere(0.4, 18, 14), mat, 0.02, body, 0, 0.4, 0).scale.set(1, 1.15, 1);
  part(geoCone(0.07, 0.1, 8), lam(0xc0503e), 0, body, 0, -0.06, 0).rotation.x = Math.PI;
  const str = new THREE.Mesh(geoCyl(0.006, 0.006, 1.6, 4), new THREE.MeshBasicMaterial({ color: 0xf6efdc })); str.position.y = -0.9; body.add(str);
  const sh = new THREE.Mesh(geoSphere(0.08, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })); sh.position.set(-0.14, 0.62, 0.26); body.add(sh);
  const p = { root, body, mat, faces: noFaces(null) };
  addExtras(p, 0.4, 0.3); return p;
}
function buildCrystal() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  part(geoCyl(0.45, 0.55, 0.4, 8), lam(0x8a8378, rockTex), 0.02, body, 0, 0.2, 0);
  const mat = new THREE.MeshLambertMaterial({ color: 0x4a3a6a, emissive: 0x000000 });
  const c = part(cachedGeo('tcrystal', () => new THREE.OctahedronGeometry(0.42, 0)), mat, 0.02, body, 0, 1.0, 0); c.scale.set(0.75, 1.5, 0.75);
  const halo = glow(2.4); halo.position.y = 1.0; halo.material.opacity = 0; halo.userData.live = true; root.add(halo);
  const p = { root, body, mat, faces: noFaces(null), halo };
  addExtras(p, 1.0, 0.4); return p;
}
function buildIronTarget() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  for (const s of [1, -1]) part(geoCyl(0.04, 0.05, 1.2, 6), lam(0x5a6470), 0.012, body, 0.3 * s, 0.6, 0).rotation.z = 0.15 * s;
  const mat = new THREE.MeshLambertMaterial({ map: targetTex, color: 0xc8d0d8 });
  const plate = part(geoCyl(0.5, 0.5, 0.08, 20), mat, 0.02, body, 0, 1.1, 0); plate.rotation.x = Math.PI / 2;
  part(cachedGeo('ironRim', () => new THREE.TorusGeometry(0.5, 0.04, 6, 24)), lam(0x7a8794), 0, body, 0, 1.1, 0.04);
  const p = { root, body, mat, faces: noFaces(targetTex) };
  addExtras(p, 1.1, 0.4); freeze(body); return p;
}
// ---------- delivery 8: Riverside, Thornbush Thicket and Rootling Burrow ----------
const solidBase = (hex) => (g, w, h) => { g.fillStyle = hex; g.fillRect(0, 0, w, h); };
const barkFaceBase = (g, w, h) => { g.fillStyle = '#8a6440'; g.fillRect(0, 0, w, h); strokes(g, w, h, 260, ['#6e4c2e', '#a07a50', '#5a3c22'], 30, 2.2, 0.7, R); };
Object.assign(FACES, {
  frog: faceSet('frog', 512, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7fcf62'); gr.addColorStop(0.55, '#62b54f'); gr.addColorStop(0.62, '#f3f0c8'); gr.addColorStop(1, '#f3f0c8'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(70,130,50,.5)'; for (const [x, y] of [[300, 50], [360, 80], [420, 40], [40, 60], [470, 90]]) ell(g, x, y, 14, 10); }, 128, 104, 30, 1.15),
  crab: faceSet('crab', 512, 256, solidBase('#e9845a'), 128, 108, 24, 1.3),
  squirrel: faceSet('squir', 512, 256, (g, w, h) => { g.fillStyle = '#d9894a'; g.fillRect(0, 0, w, h); g.fillStyle = '#fbe6c8'; ell(g, 128, 150, 70, 46); strokes(g, w, h, 300, ['#c27a3e', '#e59c5a'], 8, 1.3, 0.5, R); }, 128, 112, 22, 1.0),
  bee: faceSet('bee', 512, 256, solidBase('#ffd34d'), 128, 112, 24, 1.0),
  bush: faceSet('bush', 512, 256, (g, w, h) => { g.fillStyle = '#4e8a3a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { g.fillStyle = ['#3f7a30', '#5f9c46', '#6fae4a'][i % 3]; ell(g, R() * w, R() * h, 6 + R() * 10, 4 + R() * 7, R() * 3); } }, 128, 112, 26, 1.0),
  rootling: faceSet('rootl', 512, 256, barkFaceBase, 256, 100, 28, 1.6),
  oldroot: faceSet('oldroot', 512, 256, barkFaceBase, 256, 104, 30, 1.5)
});
const stripeTex = ctex('beestripe', 256, 128, (g, w, h) => { g.fillStyle = '#ffd34d'; g.fillRect(0, 0, w, h); g.fillStyle = '#3b2a1e'; for (const y of [30, 70, 104]) g.fillRect(0, y, w, 16); }, null);
const shellTex = ctex('crabshell', 256, 128, (g, w, h) => { g.fillStyle = '#a89a88'; g.fillRect(0, 0, w, h); for (let i = 0; i < 60; i++) { g.fillStyle = ['#8f8272', '#bdb09c', '#9c8f7c'][i % 3]; ell(g, R() * w, R() * h, 8 + R() * 14, 6 + R() * 10); } g.fillStyle = '#e9845a'; g.fillRect(0, h - 22, w, 22); }, [2, 1]);
const barkTex2 = ctex('bark2', 128, 256, (g, w, h) => { g.fillStyle = '#7a5636'; g.fillRect(0, 0, w, h); for (let i = 0; i < 36; i++) { g.strokeStyle = R() < 0.5 ? '#5a3c22' : '#9a7448'; g.lineWidth = 2 + R() * 3; const x = R() * w; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 8, h * 0.3, x - 8, h * 0.6, x + 4, h); g.stroke(); } }, [2, 1]);
// Plopfrog: a chubby river frog with a pale belly and long jumping legs; its tongue shoots out from afar
function buildFrog() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const mat = new THREE.MeshLambertMaterial({ map: FACES.frog.normal });
  part(geoSphere(0.6, 26, 18), mat, 0.03, body, 0, 0.55, 0).scale.set(1.1, 0.82, 1);
  // bulging eyes on top
  for (const s of [1, -1]) { part(geoSphere(0.17, 14, 10), lam(0x7fcf62), 0.015, body, 0.26 * s, 1.0, 0.18); }
  const legs = [];
  for (const s of [1, -1]) {
    const back = new THREE.Group(); back.position.set(0.44 * s, 0.32, -0.15); body.add(back);
    part(geoSphere(0.2, 12, 10), lam(0x62b54f), 0.015, back, 0, 0, 0).scale.set(0.8, 0.7, 1.3);
    part(geoSphere(0.12, 10, 8), lam(0x8ee07a), 0.012, back, 0.04 * s, -0.24, 0.18).scale.set(1.2, 0.35, 1.6);
    back.userData.live = true; legs.push(back);
    const fr = new THREE.Group(); fr.position.set(0.3 * s, 0.22, 0.36); body.add(fr);
    part(geoSphere(0.08, 10, 8), lam(0x8ee07a), 0.012, fr, 0, -0.12, 0.04).scale.set(1.3, 0.4, 1.4);
    part(geoCyl(0.05, 0.045, 0.2, 8), lam(0x62b54f), 0.012, fr, 0, -0.04, 0);
    fr.userData.live = true; legs.push(fr);
  }
  const tongue = part(geoCyl(0.045, 0.045, 1, 8), lam(0xf08aa0), 0.01, body, 0, 0.5, 0.6); tongue.rotation.x = Math.PI / 2; tongue.scale.y = 0.01; tongue.visible = false; tongue.userData.live = true;
  const p = { root, body, mat, faces: FACES.frog, legs, tongue };
  addExtras(p, 0.75, 0.5); freeze(body); return p;
}
// Rockpinch: a little crab with a stone shell; very tough, slow, big claws
function buildCrab() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const mat = new THREE.MeshLambertMaterial({ map: FACES.crab.normal });
  part(geoSphere(0.46, 22, 14), mat, 0.025, body, 0, 0.42, 0.04).scale.set(1.25, 0.7, 0.95);
  const shell = part(cachedGeo('crabShell', () => new THREE.SphereGeometry(0.5, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2)), lam(0xffffff, shellTex), 0.025, body, 0, 0.48, -0.08); shell.scale.set(1.25, 0.8, 0.95);
  for (const [x, z] of [[0.3, -0.15], [-0.25, -0.05], [0.05, -0.3], [0.2, 0.05]]) part(geoSphere(0.07, 8, 6), lam(0x8f8272), 0.01, body, x, 0.84, z).scale.set(1, 0.6, 1);
  for (const s of [1, -1]) {
    part(geoCyl(0.025, 0.03, 0.2, 6), lam(0xe9845a), 0.01, body, 0.12 * s, 0.75, 0.3);
    part(geoSphere(0.065, 10, 8), lam(0xffffff), 0.012, body, 0.12 * s, 0.87, 0.31);
    part(geoSphere(0.035, 8, 6), lam(0x24170f), 0, body, 0.12 * s, 0.88, 0.37);
    const arm = new THREE.Group(); arm.position.set(0.5 * s, 0.4, 0.25); body.add(arm);
    part(geoCyl(0.05, 0.06, 0.3, 8), lam(0xe9845a), 0.012, arm, 0.1 * s, 0, 0.05).rotation.z = 1.1 * s;
    const claw = part(geoSphere(0.2, 14, 10), lam(0xe0704a), 0.018, arm, 0.24 * s, 0.1, 0.18); claw.scale.set(0.9, 0.7, 1.2);
    const pin = part(geoSphere(0.1, 10, 8), lam(0xe0704a), 0.012, arm, 0.3 * s, 0.24, 0.32); pin.scale.set(0.6, 0.5, 1.2);
    arm.userData.live = true;
    for (const k of [0, 1, 2]) { const lg = part(geoCyl(0.03, 0.02, 0.32, 6), lam(0xd0603e), 0.01, body, (0.42 + k * 0.03) * s, 0.2, -0.05 - k * 0.17); lg.rotation.z = 0.8 * s; }
  }
  const p = { root, body, mat, faces: FACES.crab, legs: [] };
  addExtras(p, 0.65, 0.4); freeze(body); return p;
}
// Nutsnatcher: a quick squirrel with a huge curly tail, an acorn under its arm and a stolen-coin pouch
function buildSquirrel() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const fur = lam(0xffffff, furTexFor('#d9894a'));
  part(geoSphere(0.32, 18, 12), fur, 0.02, body, 0, 0.42, -0.02).scale.set(0.95, 1.1, 1);
  part(geoSphere(0.2, 14, 10), lam(0xfbe6c8), 0, body, 0, 0.4, 0.17).scale.set(1, 1.3, 0.6);
  const mat = new THREE.MeshLambertMaterial({ map: FACES.squirrel.normal });
  part(geoSphere(0.3, 22, 16), mat, 0.022, body, 0, 0.9, 0.08);
  for (const s of [1, -1]) {
    const ear = part(geoCone(0.08, 0.2, 7), fur, 0.012, body, 0.16 * s, 1.18, 0.02); ear.rotation.z = -0.25 * s;
    part(geoCone(0.03, 0.09, 5), lam(0xfff6e4), 0, body, 0.16 * s, 1.31, 0.03);
    part(geoSphere(0.07, 8, 6), fur, 0.01, body, 0.12 * s, 0.1, 0.12).scale.set(1, 0.6, 1.5);
  }
  // the big tail: a chain of fluffy balls curling up behind
  const tail = new THREE.Group(); tail.position.set(0, 0.35, -0.3); body.add(tail); tail.userData.live = true;
  const tc = [[0, 0, 0, 0.16], [0, 0.18, -0.14, 0.2], [0, 0.42, -0.22, 0.24], [0, 0.68, -0.18, 0.25], [0, 0.88, -0.04, 0.22], [0, 0.95, 0.12, 0.17]];
  for (const [x, y, z, r] of tc) part(geoSphere(r, 14, 10), fur, 0.02, tail, x, y, z);
  part(geoSphere(0.12, 10, 8), lam(0xfbe6c8), 0, tail, 0, 0.98, 0.2);
  // acorn and the little pouch where stolen coins go
  const acorn = new THREE.Group(); acorn.position.set(0.24, 0.5, 0.2); body.add(acorn);
  part(geoSphere(0.08, 10, 8), lam(0xc0803e), 0.01, acorn, 0, 0, 0).scale.y = 1.2;
  part(cachedGeo('acap', () => new THREE.SphereGeometry(0.085, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2)), lam(0x7a5236), 0.01, acorn, 0, 0.04, 0);
  const pouch = part(geoSphere(0.11, 10, 8), lam(0x7a8a4a), 0.012, body, -0.24, 0.4, 0.06); pouch.scale.set(0.9, 1, 0.8);
  part(geoSphere(0.03, 6, 5), lam(0xe3b343), 0, body, -0.24, 0.52, 0.08);
  const p = { root, body, mat, faces: FACES.squirrel, legs: [], tail, pouch };
  addExtras(p, 0.95, 0.3); freeze(body); return p;
}
// Bramblebee: a fuzzy striped bee that flies over the thorn bushes and stings (poison)
function buildBee() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  part(geoSphere(0.36, 20, 14), lam(0xffffff, stripeTex), 0.022, body, 0, 0.0, -0.22).scale.set(0.95, 0.95, 1.15);
  const mat = new THREE.MeshLambertMaterial({ map: FACES.bee.normal });
  part(geoSphere(0.3, 20, 14), mat, 0.022, body, 0, 0.08, 0.2);
  part(geoCone(0.07, 0.2, 8), lam(0x3b2a1e), 0.01, body, 0, -0.04, -0.62).rotation.x = -Math.PI / 2;
  for (const s of [1, -1]) {
    const ant = part(geoCyl(0.012, 0.012, 0.22, 5), lam(0x3b2a1e), 0, body, 0.1 * s, 0.42, 0.24); ant.rotation.z = -0.4 * s;
    part(geoSphere(0.04, 8, 6), lam(0x3b2a1e), 0, body, 0.15 * s, 0.52, 0.24);
  }
  const wings = [];
  for (const s of [1, -1]) {
    const piv = new THREE.Group(); piv.position.set(0.12 * s, 0.32, -0.15); body.add(piv);
    const wm = new THREE.Mesh(geoSphere(0.28, 12, 8), new THREE.MeshLambertMaterial({ color: 0xe8f6ff, transparent: true, opacity: 0.6, depthWrite: false }));
    wm.scale.set(0.9, 0.12, 0.5); wm.position.set(0.22 * s, 0.05, 0); piv.add(wm); piv.userData.live = true; wings.push(piv);
  }
  const p = { root, body, mat, faces: FACES.bee, legs: [], wings };
  addExtras(p, 0.1, 0.3); freeze(body); return p;
}
// Bushling: sleeps as an ordinary berry bush; wakes up with a face and root feet when you come close
function buildBush() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const leafM = lam(0xffffff, mossTex), rr = RW.seeded(31);
  part(geoSphere(0.62, 20, 14), leafM, 0.03, body, 0, 0.62, -0.05).scale.set(1.1, 0.95, 1);
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; part(geoSphere(0.3 + rr() * 0.08, 12, 10), leafM, 0.02, body, Math.cos(a) * 0.5, 0.55 + rr() * 0.4, Math.sin(a) * 0.45 - 0.05); }
  const thorns = [];
  for (let i = 0; i < 26; i++) { const a = rr() * Math.PI * 2, el = rr() * 1.2, d = V3(Math.cos(a) * Math.cos(el), Math.sin(el) * 0.9 + 0.1, Math.sin(a) * Math.cos(el)).normalize(); thorns.push({ g: geoCone(0.04, 0.16, 5), m: RW.mdir(V3(d.x * 0.72, 0.62 + d.y * 0.62, d.z * 0.66), d, 1) }); }
  body.add(new THREE.Mesh(bake(thorns), lam(0xe8d8a8, null, { vertexColors: true })));
  for (let i = 0; i < 8; i++) { const a = rr() * Math.PI * 2, y = 0.5 + rr() * 0.6; part(geoSphere(0.065, 8, 6), lam(0xd9304a), 0.008, body, Math.cos(a) * 0.68, y, Math.sin(a) * 0.62); }
  // the face sits on a front leaf ball; hidden while it pretends to be a bush
  const mat = new THREE.MeshLambertMaterial({ map: FACES.bush.normal });
  const face = part(geoSphere(0.42, 20, 14), mat, 0.02, body, 0, 0.6, 0.5); face.scale.set(1, 0.9, 0.62); face.userData.live = true;
  const legs = [];
  for (const s of [1, -1]) { const piv = new THREE.Group(); piv.position.set(0.25 * s, 0.14, 0.05); body.add(piv); const lg = part(geoCyl(0.05, 0.03, 0.3, 6), lam(0x7a5636), 0.01, piv, 0.04 * s, -0.08, 0.04); lg.rotation.z = 0.4 * s; piv.userData.live = true; legs.push(piv); }
  const p = { root, body, mat, faces: FACES.bush, legs, face };
  p.disguise = (on) => { face.visible = !on; for (const l of legs) l.visible = !on; };
  addExtras(p, 0.8, 0.55); freeze(body); return p;
}
// Rootling: a little walking stump with a leaf sprout, found in Rootling Burrow
function buildRootling() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const mat = new THREE.MeshLambertMaterial({ map: FACES.rootling.normal });
  part(cachedGeo('rootlingB', () => new THREE.CylinderGeometry(0.3, 0.38, 0.7, 18, 1, false, Math.PI, Math.PI * 2)), mat, 0.025, body, 0, 0.5, 0);
  part(geoCyl(0.3, 0.3, 0.04, 18), lam(0xd9b98a), 0.012, body, 0, 0.86, 0);
  part(geoCyl(0.015, 0.02, 0.18, 6), lam(0x5aa848), 0.01, body, 0.05, 0.96, 0);
  for (const s of [1, -1]) { const lf = part(geoSphere(0.08, 10, 8), lam(0x7cc85e), 0.01, body, 0.05 + 0.08 * s, 1.06, 0); lf.scale.set(1.2, 0.35, 0.6); lf.rotation.z = 0.5 * s; }
  const legs = [];
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.6; const piv = new THREE.Group(); piv.position.set(Math.cos(a) * 0.3, 0.18, Math.sin(a) * 0.3); body.add(piv); const lg = part(geoCone(0.07, 0.3, 6), lam(0x6e4c2e), 0.012, piv, Math.cos(a) * 0.08, -0.08, Math.sin(a) * 0.08); lg.rotation.set(Math.PI + Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); piv.userData.live = true; legs.push(piv); }
  for (const s of [1, -1]) { const arm = part(geoCone(0.05, 0.3, 6), lam(0x6e4c2e), 0.01, body, 0.36 * s, 0.5, 0.05); arm.rotation.z = (Math.PI / 2 + 0.5) * s; }
  const p = { root, body, mat, faces: FACES.rootling, legs };
  addExtras(p, 0.6, 0.38); freeze(body); return p;
}
// Old Rootling: the burrow's boss, an ancient gnarled stump with mossy shoulders and glowing mushrooms
function buildOldRootling() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const mat = new THREE.MeshLambertMaterial({ map: FACES.oldroot.normal });
  part(cachedGeo('oldrootB', () => new THREE.CylinderGeometry(0.62, 0.85, 1.5, 22, 1, false, Math.PI, Math.PI * 2)), mat, 0.035, body, 0, 0.95, 0);
  const top = part(cachedGeo('oldrootT', () => new THREE.SphereGeometry(0.66, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2)), lam(0xffffff, mossTex), 0.03, body, 0, 1.68, 0); top.scale.y = 0.45;
  for (const [x, z, s] of [[0.32, 0.2, 1], [-0.4, -0.1, 0.8], [0.05, -0.38, 0.9]]) {
    part(geoCyl(0.03 * s, 0.035 * s, 0.14 * s, 6), lam(0xf3ead6), 0.008, body, x, 1.85, z);
    part(cachedGeo('fmush', () => new THREE.SphereGeometry(0.045, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2)), new THREE.MeshLambertMaterial({ color: 0x9ff5d2, emissive: 0x2f9a6e }), 0, body, x, 1.91, z).scale.setScalar(2 * s);
  }
  // twisted branches on top, root feet around the base
  for (const [a, l] of [[0.4, 0.7], [2.6, 0.55], [4.4, 0.6]]) { const br = part(geoCone(0.09, l, 6), lam(0xffffff, barkTex2), 0.015, body, Math.cos(a) * 0.35, 1.9, Math.sin(a) * 0.35); br.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6); }
  const legs = [];
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.3; const piv = new THREE.Group(); piv.position.set(Math.cos(a) * 0.72, 0.22, Math.sin(a) * 0.72); body.add(piv); const lg = part(geoCone(0.14, 0.6, 7), lam(0xffffff, barkTex2), 0.015, piv, Math.cos(a) * 0.18, -0.06, Math.sin(a) * 0.18); lg.rotation.set(Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2); piv.userData.live = true; legs.push(piv); }
  const arms = [];
  for (const s of [1, -1]) {
    const piv = new THREE.Group(); piv.position.set(0.62 * s, 1.25, 0.05); body.add(piv);
    // a thick bent branch: shoulder piece reaching out, forearm hanging down, three twig fingers
    const up = part(geoCyl(0.11, 0.15, 0.6, 7), lam(0xffffff, barkTex2), 0.015, piv, 0.24 * s, 0.05, 0); up.rotation.z = -1.2 * s;
    const fo = part(geoCyl(0.08, 0.11, 0.6, 7), lam(0xffffff, barkTex2), 0.015, piv, 0.5 * s, -0.22, 0.05); fo.rotation.z = -0.25 * s;
    for (const k of [-1, 0, 1]) { const f = part(geoCone(0.04, 0.2, 5), lam(0x6e4c2e), 0.008, piv, (0.56 + k * 0.04) * s, -0.58, 0.05 + k * 0.07); f.rotation.set(k * 0.3, 0, Math.PI + 0.2 * s * k); }
    piv.userData.live = true; arms.push(piv);
  }
  const eyes = glow(1.2); eyes.position.set(0, 1.2, 0.8); eyes.material.opacity = 0.0; eyes.userData.live = true; root.add(eyes);
  const p = { root, body, mat, faces: FACES.oldroot, legs, arms, eyes };
  addExtras(p, 1.3, 0.7); freeze(body); return p;
}
// a warning ring on the ground and the root spike that bursts out of it (Old Rootling's attack)
function rootSpike() {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(cachedGeo('rsRing', () => new THREE.RingGeometry(0.75, 0.95, 32)), new THREE.MeshBasicMaterial({ color: 0xe8604c, transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.04; g.add(ring);
  const fill = new THREE.Mesh(cachedGeo('rsFill', () => new THREE.CircleGeometry(0.95, 32)), new THREE.MeshBasicMaterial({ color: 0xe8604c, transparent: true, opacity: 0.22, depthWrite: false })); fill.rotation.x = -Math.PI / 2; fill.position.y = 0.03; g.add(fill);
  const spikes = new THREE.Group(); g.add(spikes);
  for (const [x, z, h] of [[0, 0, 1.3], [0.35, 0.2, 0.9], [-0.3, 0.25, 0.8], [0.1, -0.35, 0.95], [-0.25, -0.2, 0.7]]) { const sp = part(geoCone(0.16, h, 7), lam(0xffffff, barkTex2), 0.015, spikes, x, h / 2, z); sp.rotation.set(z * 0.5, 0, -x * 0.5); }
  return { root: g, ring, fill, spikes };
}
Object.assign(MONSTER_BUILD, { plopfrog: buildFrog, rockpinch: buildCrab, nutsnatcher: buildSquirrel, bramblebee: buildBee, bushling: buildBush, rootling: buildRootling, old_rootling: buildOldRootling });

// ---------- delivery 9: Pebble Cave monsters ----------
FACES.pebble = faceSet('pebl', 512, 256, jellyBase('#e8eef2', '#b8c4cc', '#8a99a6'), 128, 118, 30, 1.25);
FACES.king = faceSet('kingl', 512, 256, jellyBase('#e8ffb0', '#a6e070', '#5aa83e'), 128, 118, 30, 1.25);
FACES.gem = faceSet('gemm', 512, 256, stemBase('#eef2f8', 'rgba(120,150,190,.25)'), 256, 92, 32, 1.77);
// Pebble Leaflet: a grey Leaflet wearing a round pebble as a helmet
function buildPebbleLeaflet() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const mat = new THREE.MeshLambertMaterial({ map: FACES.pebble.normal });
  part(geoSphere(0.75, 28, 20), mat, 0.03, body, 0, 0.6, 0).scale.set(1, 0.8, 1);
  const helm = part(cachedGeo('pbhelm', () => new THREE.SphereGeometry(0.62, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2)), lam(0xffffff, rockTex), 0.025, body, 0, 1.02, -0.06); helm.scale.set(1, 0.62, 1);
  part(geoSphere(0.12, 8, 6), lam(0x9aa5b0, rockTex), 0.01, body, 0.18, 1.4, 0.02);
  const lf = part(geoSphere(0.18, 10, 8), lam(0x5aa848), 0.012, body, -0.1, 1.45, 0); lf.scale.set(1, 0.16, 0.5); lf.rotation.z = -0.5;
  const p = { root, body, mat, faces: FACES.pebble };
  addExtras(p, 0.75, 0.6); freeze(body); return p;
}
// Gemcap: a Mushling whose cap is a cluster of glowing blue crystals
function buildGemcap() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const mat = new THREE.MeshLambertMaterial({ map: FACES.gem.normal });
  for (const s of [1, -1]) part(geoSphere(0.16, 10, 8), lam(0xd6dde8), 0.02, body, 0.19 * s, 0.07, 0.05).scale.set(1, 0.55, 1.2);
  part(cachedGeo('mstem', () => new THREE.CylinderGeometry(0.32, 0.38, 0.62, 20, 1, false, Math.PI, Math.PI * 2)), mat, 0.025, body, 0, 0.42, 0);
  part(cachedGeo('mcap', () => new THREE.SphereGeometry(0.66, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2)), lam(0x5a6f9a), 0.03, body, 0, 0.7, 0).scale.y = 0.62;
  const cm = new THREE.MeshLambertMaterial({ color: 0x9fd8ff, emissive: 0x2a6fa8 }), cm2 = new THREE.MeshLambertMaterial({ color: 0xd2b0ff, emissive: 0x5a3a9a });
  for (let i = 0; i < 7; i++) { const a = i * 2.4, r = i ? 0.32 : 0, h = i ? 0.38 + (i % 3) * 0.08 : 0.62; const c = part(geoCone(0.11, h, 6), i % 3 === 1 ? cm2 : cm, 0.012, body, Math.cos(a) * r, 0.98 + h / 2 - 0.06, Math.sin(a) * r); c.rotation.set(Math.sin(a) * r * 0.9, 0, -Math.cos(a) * r * 0.9); }
  const gl = glow(1.6); gl.material.color = new THREE.Color(0x9fd8ff); gl.material.opacity = 0.35; gl.position.y = 1.1; body.add(gl);
  const p = { root, body, mat, faces: FACES.gem };
  addExtras(p, 0.55, 0.45); freeze(body); return p;
}
// King Leaflet: a giant Leaflet with a crown of golden leaves and a little red cape
function buildKingLeaflet() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const mat = new THREE.MeshLambertMaterial({ map: FACES.king.normal });
  part(geoSphere(0.75, 32, 22), mat, 0.022, body, 0, 0.6, 0).scale.set(1, 0.82, 1);
  // cape over the back
  const cape = part(cachedGeo('kcape', () => new THREE.SphereGeometry(0.79, 20, 10, Math.PI * 0.15, Math.PI * 0.7, Math.PI * 0.32, Math.PI * 0.42)), lam(0xc8403a, null, { side: THREE.DoubleSide }), 0.012, body, 0, 0.6, 0);
  cape.rotation.y = Math.PI; cape.scale.set(1, 0.86, 1);
  for (let i = 0; i < 9; i++) { const a = Math.PI * (0.62 + i * 0.095); part(geoSphere(0.05, 6, 5), lam(0xfff3dc), 0, body, Math.cos(a) * 0.74, 0.28, Math.sin(a) * 0.74); }
  // the crown: a gold band with golden leaves standing up, and a red jewel at the front
  const crown = new THREE.Group(); crown.position.y = 1.16; body.add(crown);
  const gold = new THREE.MeshLambertMaterial({ color: 0xffcf4a, emissive: 0x5a3a00 });
  part(geoCyl(0.36, 0.4, 0.12, 20, true), gold, 0.012, crown, 0, 0, 0);
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, lf = part(geoSphere(0.11, 10, 8), gold, 0.01, crown, Math.cos(a) * 0.36, 0.17, Math.sin(a) * 0.36); lf.scale.set(0.5, 1.5, 0.22); lf.rotation.y = -a + Math.PI / 2; }
  part(geoSphere(0.06, 10, 8), new THREE.MeshLambertMaterial({ color: 0xff4a5a, emissive: 0x7a1020 }), 0.008, crown, 0, 0.05, 0.4);
  const gl = glow(1.4); gl.material.color = new THREE.Color(0xffd36e); gl.material.opacity = 0.0; gl.position.y = 0.7; gl.userData.live = true; root.add(gl);
  const p = { root, body, mat, faces: FACES.king, crown, aura: gl, cape };
  addExtras(p, 0.75, 0.6); freeze(body); return p;
}
// a plain red warning circle on the ground (the King's landing spot)
function warnRing(r) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.RingGeometry(r * 0.88, r, 40), new THREE.MeshBasicMaterial({ color: 0xe8604c, transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; g.add(ring);
  const fill = new THREE.Mesh(new THREE.CircleGeometry(r, 40), new THREE.MeshBasicMaterial({ color: 0xe8604c, transparent: true, opacity: 0.2, depthWrite: false })); fill.rotation.x = -Math.PI / 2; fill.position.y = 0.04; g.add(fill);
  return { root: g, ring, fill };
}
Object.assign(MONSTER_BUILD, { pebble_leaflet: buildPebbleLeaflet, gemcap: buildGemcap, king_leaflet: buildKingLeaflet });

// ---------- v1.2: two more monsters in every area ----------
Object.assign(FACES, {
  bunny: faceSet('bunny', 512, 256, solidBase('#fbf1ea'), 128, 112, 22, 1.0),
  snail: faceSet('snail', 512, 256, solidBase('#e8d79a'), 128, 112, 22, 1.0),
  sheep: faceSet('sheep', 512, 256, solidBase('#5a4a44'), 128, 116, 22, 1.0),
  bird: faceSet('bird', 512, 256, solidBase('#7ab8e8'), 128, 112, 22, 1.0),
  owl: faceSet('owl', 512, 256, (g, w, h) => { g.fillStyle = '#9a7048'; g.fillRect(0, 0, w, h); g.fillStyle = '#f3e3c0'; ell(g, 128, 120, 92, 70); strokes(g, w, h, 200, ['#86603c', '#ad8256'], 8, 1.2, 0.5, R); }, 128, 110, 30, 1.2),
  fox: faceSet('fox', 512, 256, (g, w, h) => { g.fillStyle = '#e07a3a'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff1e0'; ell(g, 128, 160, 66, 44); }, 128, 108, 22, 1.0),
  duck: faceSet('duck', 512, 256, solidBase('#ffe070'), 128, 108, 22, 1.0),
  turtle: faceSet('turtle', 512, 256, solidBase('#9ccf72'), 128, 110, 22, 1.0),
  beetle: faceSet('beetle', 512, 256, solidBase('#5a3a7a'), 128, 112, 20, 1.0),
  hopper: faceSet('hopper', 512, 256, solidBase('#8fd060'), 128, 112, 22, 1.0),
  worm: faceSet('worm', 512, 256, solidBase('#c8e070'), 128, 112, 22, 1.0),
  mole: faceSet('mole', 512, 256, solidBase('#5e4a44'), 128, 104, 18, 1.0),
  bat: faceSet('bat', 512, 256, solidBase('#7a5a9a'), 128, 112, 22, 1.0),
  rocklet: faceSet('rocklet', 512, 256, (g, w, h) => { g.fillStyle = '#9a948a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { g.fillStyle = ['#8a8478', '#aaa498'][i % 2]; ell(g, R() * w, R() * h, 8 + R() * 12, 6 + R() * 8); } }, 128, 112, 24, 1.0)
});
const mk = () => { const root = new THREE.Group(), body = new THREE.Group(); root.add(body); return { root, body }; };
const fin = (p, hy, hr) => { addExtras(p, hy, hr); freeze(p.body); return p; };
const wingPair = (body, y, z, x, col, w, len) => { const out = []; for (const s of [1, -1]) { const piv = new THREE.Group(); piv.position.set(x * s, y, z); body.add(piv); const wm = part(geoSphere(w, 12, 8), lam(col), 0.012, piv, len * s, 0, 0); wm.scale.set(1.6, 0.18, 0.9); piv.userData.live = true; out.push(piv); } return out; };
const legs4 = (body, pts, y, col, r, h) => pts.map(([x, z]) => { const piv = new THREE.Group(); piv.position.set(x, y, z); body.add(piv); part(geoCyl(r, r * 0.8, h, 7), lam(col), 0.012, piv, 0, -h / 2, 0); piv.userData.live = true; return piv; });
// Bunbun: a round meadow bunny with long ears and a cotton tail
function buildBunny() {
  const { root, body } = mk(), fur = lam(0xffffff, furTexFor('#f4ece6'));
  part(geoSphere(0.42, 18, 12), fur, 0.022, body, 0, 0.42, -0.06).scale.set(1, 0.95, 1.1);
  const mat = new THREE.MeshLambertMaterial({ map: FACES.bunny.normal });
  part(geoSphere(0.33, 20, 14), mat, 0.022, body, 0, 0.86, 0.14);
  for (const s of [1, -1]) { const e = part(geoSphere(0.1, 10, 8), fur, 0.014, body, 0.13 * s, 1.32, 0.06); e.scale.set(0.8, 3.0, 0.5); e.rotation.z = -0.15 * s; part(geoSphere(0.06, 8, 6), lam(0xf6b6c4), 0, body, 0.13 * s, 1.34, 0.1).scale.set(0.7, 2.6, 0.3); part(geoSphere(0.1, 8, 6), fur, 0.01, body, 0.18 * s, 0.08, 0.16).scale.set(1, 0.6, 1.5); }
  part(geoSphere(0.12, 10, 8), lam(0xffffff), 0.012, body, 0, 0.42, -0.52);
  return fin({ root, body, mat, faces: FACES.bunny }, 0.9, 0.33);
}
// Shellsnail: a slow snail with a swirly shell (very hard to crack)
function buildSnail() {
  const { root, body } = mk();
  part(geoSphere(0.3, 16, 12), lam(0xe8d79a), 0.02, body, 0, 0.2, 0.05).scale.set(1, 0.6, 2.0);
  const mat = new THREE.MeshLambertMaterial({ map: FACES.snail.normal });
  part(geoSphere(0.26, 18, 12), mat, 0.02, body, 0, 0.5, 0.5);
  for (const s of [1, -1]) { const st = part(geoCyl(0.025, 0.03, 0.3, 6), lam(0xe8d79a), 0.01, body, 0.1 * s, 0.82, 0.52); st.rotation.z = -0.25 * s; part(geoSphere(0.05, 8, 6), lam(0xe8d79a), 0.01, body, 0.14 * s, 0.97, 0.52); }
  const shellC = [0xd98a5a, 0xf0b07a];
  for (let i = 0; i < 4; i++) { const r = 0.46 - i * 0.1; part(cachedGeo('snt' + i, () => new THREE.TorusGeometry(r, 0.13 - i * 0.02, 10, 22)), lam(shellC[i % 2]), 0.015, body, 0, 0.62 + i * 0.03, -0.18 + i * 0.04).rotation.y = Math.PI / 2; }
  part(geoSphere(0.12, 10, 8), lam(0xd98a5a), 0.012, body, 0, 0.66, -0.12);
  return fin({ root, body, mat, faces: FACES.snail }, 0.5, 0.26);
}
// Woolly Puff: a fluffy hill sheep made of cloud-like wool balls
function buildSheep() {
  const { root, body } = mk(), wool = lam(0xfbf7ee), rr = RW.seeded(51);
  part(geoSphere(0.46, 18, 12), wool, 0.025, body, 0, 0.62, -0.05).scale.set(1, 0.9, 1.2);
  for (let i = 0; i < 12; i++) { const a = rr() * Math.PI * 2, el = rr() * 1.2; part(geoSphere(0.16 + rr() * 0.06, 10, 8), wool, 0.015, body, Math.cos(a) * Math.cos(el) * 0.42, 0.62 + Math.sin(el) * 0.38, -0.05 + Math.sin(a) * Math.cos(el) * 0.52); }
  const mat = new THREE.MeshLambertMaterial({ map: FACES.sheep.normal });
  part(geoSphere(0.27, 18, 12), mat, 0.02, body, 0, 0.78, 0.5).scale.set(0.9, 1, 0.9);
  part(geoSphere(0.16, 10, 8), wool, 0.012, body, 0, 1.02, 0.46);
  for (const s of [1, -1]) { const e = part(geoSphere(0.08, 8, 6), lam(0x5a4a44), 0.01, body, 0.26 * s, 0.82, 0.46); e.scale.set(1.8, 0.6, 0.9); }
  const legs = legs4(body, [[0.2, 0.3], [-0.2, 0.3], [0.2, -0.36], [-0.2, -0.36]], 0.3, 0x5a4a44, 0.06, 0.3);
  return fin({ root, body, mat, faces: FACES.sheep, legs }, 0.8, 0.27);
}
// Kitebird: a blue bird that rides the hill wind and dives at you
function buildBird() {
  const { root, body } = mk();
  part(geoSphere(0.32, 18, 12), lam(0x7ab8e8), 0.02, body, 0, 0, -0.1).scale.set(0.95, 0.9, 1.25);
  part(geoSphere(0.2, 12, 8), lam(0xfff3dc), 0, body, 0, -0.08, 0.06).scale.set(1, 1.1, 0.8);
  const mat = new THREE.MeshLambertMaterial({ map: FACES.bird.normal });
  part(geoSphere(0.25, 18, 12), mat, 0.02, body, 0, 0.3, 0.2);
  part(geoCone(0.07, 0.18, 6), lam(0xf2b33d), 0.01, body, 0, 0.27, 0.48).rotation.x = Math.PI / 2;
  part(geoCone(0.06, 0.14, 5), lam(0x4a88c8), 0.01, body, 0, 0.56, 0.16).rotation.x = -0.4;
  for (const s of [-1, 0, 1]) { const t = part(geoSphere(0.1, 8, 6), lam(0x4a88c8), 0.01, body, s * 0.08, 0.02, -0.5); t.scale.set(0.5, 0.15, 1.6); t.rotation.y = s * 0.3; }
  const wings = wingPair(body, 0.06, -0.08, 0.2, 0x5a9ad8, 0.18, 0.22);
  return fin({ root, body, mat, faces: FACES.bird, legs: [], wings, flap: 14 }, 0.3, 0.25);
}
// Hootling: a round little owl of Whisperwood; its hoot makes you dizzy
function buildOwl() {
  const { root, body } = mk();
  const mat = new THREE.MeshLambertMaterial({ map: FACES.owl.normal });
  part(geoSphere(0.42, 22, 16), mat, 0.022, body, 0, 0.1, 0).scale.set(1, 1.08, 0.95);
  for (const s of [1, -1]) part(geoCone(0.09, 0.22, 5), lam(0x86603c), 0.012, body, 0.24 * s, 0.56, 0.02).rotation.z = -0.35 * s;
  part(geoCone(0.05, 0.12, 5), lam(0xf2b33d), 0.008, body, 0, 0.06, 0.42).rotation.x = Math.PI / 1.6;
  for (const s of [1, -1]) part(geoSphere(0.07, 8, 6), lam(0xf2b33d), 0.008, body, 0.12 * s, -0.36, 0.12).scale.set(1, 0.5, 1.4);
  const wings = wingPair(body, 0.12, -0.05, 0.32, 0x86603c, 0.2, 0.18);
  return fin({ root, body, mat, faces: FACES.owl, legs: [], wings, flap: 10 }, 0.15, 0.42);
}
// Fernfox: a quick forest fox with a fern-green tail tip; it dashes at you
function buildFox() {
  const { root, body } = mk(), fur = lam(0xffffff, furTexFor('#e07a3a'));
  part(geoSphere(0.38, 18, 12), fur, 0.022, body, 0, 0.5, -0.05).scale.set(0.85, 0.8, 1.3);
  const mat = new THREE.MeshLambertMaterial({ map: FACES.fox.normal });
  part(geoSphere(0.28, 18, 12), mat, 0.02, body, 0, 0.74, 0.46);
  part(geoCone(0.1, 0.22, 8), lam(0xfff1e0), 0.012, body, 0, 0.66, 0.74).rotation.x = Math.PI / 2;
  part(geoSphere(0.035, 6, 5), lam(0x2a1a10), 0, body, 0, 0.67, 0.86);
  for (const s of [1, -1]) { const e = part(geoCone(0.1, 0.24, 6), fur, 0.012, body, 0.15 * s, 1.04, 0.42); e.rotation.z = -0.25 * s; }
  const tail = new THREE.Group(); tail.position.set(0, 0.6, -0.5); body.add(tail); tail.userData.live = true;
  part(geoSphere(0.2, 12, 8), fur, 0.015, tail, 0, 0.08, -0.18).scale.set(0.8, 0.8, 1.6);
  part(geoSphere(0.13, 10, 8), lam(0x6fbf4a), 0.012, tail, 0, 0.16, -0.48).scale.set(0.9, 0.9, 1.3);
  const legs = legs4(body, [[0.16, 0.3], [-0.16, 0.3], [0.16, -0.36], [-0.16, -0.36]], 0.3, 0x5a3220, 0.055, 0.3);
  return fin({ root, body, mat, faces: FACES.fox, legs, tail }, 0.8, 0.28);
}
// Quackling: a chubby yellow river duckling; its family comes to help
function buildDuck() {
  const { root, body } = mk(), y = lam(0xffe070);
  part(geoSphere(0.42, 18, 12), y, 0.022, body, 0, 0.42, -0.05).scale.set(1, 0.85, 1.15);
  const mat = new THREE.MeshLambertMaterial({ map: FACES.duck.normal });
  part(geoSphere(0.28, 18, 12), mat, 0.02, body, 0, 0.88, 0.2);
  const bk = part(geoSphere(0.12, 10, 8), lam(0xf2913d), 0.012, body, 0, 0.8, 0.48); bk.scale.set(1.3, 0.4, 1.2);
  part(geoSphere(0.06, 8, 6), y, 0.008, body, 0, 1.16, 0.18).scale.set(0.6, 1.4, 0.6);
  for (const s of [1, -1]) { const w = part(geoSphere(0.16, 10, 8), y, 0.012, body, 0.38 * s, 0.48, -0.05); w.scale.set(0.4, 0.7, 1.1); part(geoSphere(0.09, 8, 6), lam(0xf2913d), 0.008, body, 0.15 * s, 0.05, 0.1).scale.set(1.2, 0.35, 1.6); }
  return fin({ root, body, mat, faces: FACES.duck }, 0.88, 0.28);
}
// Snapturtle: a river turtle with a big hard shell and a snappy bite
function buildTurtle() {
  const { root, body } = mk();
  const shell = part(cachedGeo('turtShell', () => new THREE.SphereGeometry(0.55, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2)), lam(0x4f8a4a), 0.025, body, 0, 0.3, -0.05); shell.scale.set(1, 0.8, 1.15);
  for (let i = 0; i < 7; i++) { const a = i / 6 * Math.PI * 2, r = i ? 0.3 : 0; part(geoSphere(0.12, 8, 6), lam(i ? 0x6fa85a : 0x8ac070), 0.008, body, Math.cos(a) * r, 0.72 - r * 0.45, -0.05 + Math.sin(a) * r * 1.1).scale.set(1, 0.3, 1); }
  part(geoCyl(0.56, 0.56, 0.08, 22), lam(0xd9c88a), 0.012, body, 0, 0.28, -0.05).scale.set(1, 1, 1.15);
  const mat = new THREE.MeshLambertMaterial({ map: FACES.turtle.normal });
  part(geoSphere(0.24, 18, 12), mat, 0.02, body, 0, 0.42, 0.66);
  const legs = legs4(body, [[0.36, 0.34], [-0.36, 0.34], [0.36, -0.4], [-0.36, -0.4]], 0.24, 0x9ccf72, 0.1, 0.22);
  return fin({ root, body, mat, faces: FACES.turtle, legs }, 0.45, 0.24);
}
// Prickle Beetle: a shiny purple beetle with a horn; plain hits prick you back
function buildBeetle() {
  const { root, body } = mk();
  const sh = part(cachedGeo('btlShell', () => new THREE.SphereGeometry(0.5, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2)), new THREE.MeshLambertMaterial({ color: 0x6a3a9a, emissive: 0x1a0a2a }), 0.025, body, 0, 0.26, -0.08); sh.scale.set(0.95, 0.85, 1.2);
  part(geoBox(0.02, 0.36, 1.1), lam(0x3a1a5a), 0, body, 0, 0.5, -0.08).rotation.x = -0.25;
  const thorns = []; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; thorns.push({ g: geoCone(0.04, 0.16, 5), m: RW.mdir(V3(Math.cos(a) * 0.4, 0.5, -0.08 + Math.sin(a) * 0.48), V3(Math.cos(a), 0.7, Math.sin(a)).normalize(), 1) }); }
  body.add(new THREE.Mesh(bake(thorns), lam(0xe8d8a8, null, { vertexColors: true })));
  const mat = new THREE.MeshLambertMaterial({ map: FACES.beetle.normal });
  part(geoSphere(0.24, 16, 12), mat, 0.02, body, 0, 0.32, 0.5);
  part(geoCone(0.06, 0.3, 6), lam(0x3a1a5a), 0.01, body, 0, 0.58, 0.62).rotation.x = 0.5;
  for (const s of [1, -1]) for (const k of [0, 1, 2]) { const lg = part(geoCyl(0.03, 0.02, 0.32, 5), lam(0x3a1a5a), 0.008, body, 0.46 * s, 0.14, 0.25 - k * 0.3); lg.rotation.z = 0.9 * s; }
  return fin({ root, body, mat, faces: FACES.beetle, legs: [] }, 0.35, 0.24);
}
// Thornhopper: a long-legged grasshopper that leaps at you from far away
function buildHopper() {
  const { root, body } = mk(), g = lam(0x8fd060);
  part(geoSphere(0.26, 16, 12), g, 0.02, body, 0, 0.42, -0.2).scale.set(0.9, 0.85, 1.8);
  const mat = new THREE.MeshLambertMaterial({ map: FACES.hopper.normal });
  part(geoSphere(0.24, 16, 12), mat, 0.02, body, 0, 0.6, 0.34);
  for (const s of [1, -1]) {
    const ant = part(geoCyl(0.012, 0.012, 0.45, 5), lam(0x4a7a2a), 0, body, 0.08 * s, 0.98, 0.38); ant.rotation.set(-0.5, 0, -0.3 * s);
    const leg = part(geoCyl(0.05, 0.03, 0.6, 6), lam(0x6fae3a), 0.01, body, 0.24 * s, 0.6, -0.3); leg.rotation.x = -1.0;
    const shin = part(geoCyl(0.03, 0.025, 0.55, 6), lam(0x6fae3a), 0.01, body, 0.26 * s, 0.32, -0.62); shin.rotation.x = 0.6;
    const fl = part(geoCyl(0.025, 0.02, 0.36, 5), lam(0x6fae3a), 0.008, body, 0.16 * s, 0.2, 0.2); fl.rotation.z = 0.3 * s;
  }
  const wing = part(geoSphere(0.2, 10, 8), lam(0x6fae3a), 0.01, body, 0, 0.62, -0.32); wing.scale.set(0.9, 0.2, 2);
  return fin({ root, body, mat, faces: FACES.hopper, legs: [] }, 0.6, 0.24);
}
// Glowworm: a chubby caterpillar of the burrow with glowing dots on its back
function buildWorm() {
  const { root, body } = mk(), glowM = new THREE.MeshLambertMaterial({ color: 0x9ff5d2, emissive: 0x2f9a6e });
  for (let i = 0; i < 4; i++) { part(geoSphere(0.24 - i * 0.02, 14, 10), lam(i % 2 ? 0xb8d060 : 0xc8e070), 0.018, body, 0, 0.24, -0.1 - i * 0.3); part(geoSphere(0.06, 8, 6), glowM, 0, body, 0, 0.47 - i * 0.02, -0.1 - i * 0.3); }
  const mat = new THREE.MeshLambertMaterial({ map: FACES.worm.normal });
  part(geoSphere(0.28, 18, 12), mat, 0.02, body, 0, 0.36, 0.28);
  for (const s of [1, -1]) { part(geoCyl(0.012, 0.012, 0.2, 5), lam(0x6a7a2a), 0, body, 0.1 * s, 0.7, 0.28).rotation.z = -0.3 * s; part(geoSphere(0.04, 6, 5), glowM, 0, body, 0.14 * s, 0.8, 0.28); }
  const gl = glow(1.4); gl.material.color = new THREE.Color(0x9ff5d2); gl.material.opacity = 0.3; gl.position.set(0, 0.4, -0.3); body.add(gl);
  return fin({ root, body, mat, faces: FACES.worm }, 0.4, 0.28);
}
// Digmole: a burrow mole with big digging claws; its bonk makes you dizzy
function buildMole() {
  const { root, body } = mk(), fur = lam(0xffffff, furTexFor('#5e4a44'));
  part(geoSphere(0.44, 18, 12), fur, 0.022, body, 0, 0.42, -0.05).scale.set(1, 0.9, 1.15);
  const mat = new THREE.MeshLambertMaterial({ map: FACES.mole.normal });
  part(geoSphere(0.3, 18, 12), mat, 0.02, body, 0, 0.62, 0.36);
  part(geoSphere(0.08, 10, 8), lam(0xf28aa0), 0.01, body, 0, 0.56, 0.66);
  for (const s of [1, -1]) { const arm = new THREE.Group(); arm.position.set(0.38 * s, 0.38, 0.28); body.add(arm); const c = part(geoSphere(0.15, 10, 8), lam(0xf0b8a0), 0.012, arm, 0.04 * s, 0, 0.06); c.scale.set(1.2, 0.5, 1); for (const k of [-1, 0, 1]) part(geoCone(0.03, 0.12, 5), lam(0xfff6e4), 0, arm, (0.06 + k * 0.05) * s, 0, 0.18).rotation.x = Math.PI / 2; }
  for (const s of [1, -1]) part(geoSphere(0.09, 8, 6), fur, 0.01, body, 0.2 * s, 0.06, 0.05).scale.set(1, 0.5, 1.4);
  return fin({ root, body, mat, faces: FACES.mole }, 0.62, 0.3);
}
// Flapbat: a purple cave bat; whole flocks swoop down when you poke one
function buildBat() {
  const { root, body } = mk();
  const mat = new THREE.MeshLambertMaterial({ map: FACES.bat.normal });
  part(geoSphere(0.3, 18, 12), mat, 0.02, body, 0, 0.05, 0);
  for (const s of [1, -1]) { const e = part(geoCone(0.09, 0.24, 5), lam(0x6a4a8a), 0.012, body, 0.16 * s, 0.38, 0); e.rotation.z = -0.3 * s; part(geoCone(0.025, 0.08, 4), lam(0xfff6e4), 0, body, 0.07 * s, -0.08, 0.27).rotation.x = Math.PI; }
  const wings = [];
  for (const s of [1, -1]) { const piv = new THREE.Group(); piv.position.set(0.24 * s, 0.08, -0.04); body.add(piv); const wm = part(cachedGeo('batW', () => new THREE.CircleGeometry(0.4, 5)), lam(0x4a3a6a, null, { side: THREE.DoubleSide }), 0.012, piv, 0.36 * s, 0, 0); wm.rotation.x = -Math.PI / 2; wm.scale.set(1.2, 0.8, 1); piv.userData.live = true; wings.push(piv); }
  return fin({ root, body, mat, faces: FACES.bat, legs: [], wings, flap: 18 }, 0.1, 0.3);
}
// Rocklet: a little stone golem with a glowing crystal heart
function buildRocklet() {
  const { root, body } = mk(), rock = lam(0xffffff, rockTex);
  part(geoBox(0.8, 0.7, 0.6), rock, 0.03, body, 0, 0.62, -0.02);
  const mat = new THREE.MeshLambertMaterial({ map: FACES.rocklet.normal });
  const hd = part(geoSphere(0.3, 16, 12), mat, 0.022, body, 0, 1.18, 0.04); hd.scale.set(1.1, 0.9, 1);
  const cm = new THREE.MeshLambertMaterial({ color: 0x9fd8ff, emissive: 0x2a6fa8 });
  part(cachedGeo('rlCore', () => new THREE.OctahedronGeometry(0.13, 0)), cm, 0.01, body, 0, 0.66, 0.31);
  for (const s of [1, -1]) { const a = part(geoBox(0.22, 0.5, 0.24), rock, 0.02, body, 0.54 * s, 0.56, 0.02); a.rotation.z = 0.15 * s; part(geoBox(0.22, 0.24, 0.22), rock, 0.02, body, 0.22 * s, 0.13, 0); }
  for (const [x, z] of [[0.2, -0.3], [-0.15, -0.32]]) part(geoCone(0.07, 0.24, 6), cm, 0.01, body, x, 1.02, z);
  return fin({ root, body, mat, faces: FACES.rocklet }, 1.18, 0.3);
}
Object.assign(MONSTER_BUILD, { bunbun: buildBunny, shellsnail: buildSnail, woolly: buildSheep, kitebird: buildBird, hootling: buildOwl, fernfox: buildFox, quackling: buildDuck, snapturtle: buildTurtle, prickle_beetle: buildBeetle, thornhopper: buildHopper, glowworm: buildWorm, digmole: buildMole, flapbat: buildBat, rocklet: buildRocklet });

// ---------- delivery 8 props: waystone (teleport), the old watermill, the burrow gate ----------
function waystone() {
  const root = new THREE.Group();
  part(geoCyl(0.85, 1.0, 0.25, 8), lam(0xffffff, rockTex), 0.02, root, 0, 0.12, 0);
  const pil = part(geoCyl(0.32, 0.42, 1.8, 6), lam(0xffffff, rockTex), 0.025, root, 0, 1.1, 0);
  part(geoCone(0.32, 0.4, 6), lam(0xffffff, rockTex), 0.02, root, 0, 2.2, 0);
  const runeM = new THREE.MeshLambertMaterial({ color: 0x9fe0ff, emissive: 0x3a9ad8, emissiveIntensity: 0.9 });
  const crystal = new THREE.Mesh(cachedGeo('wsCrystal', () => new THREE.OctahedronGeometry(0.28, 0)), runeM); crystal.position.y = 2.75; crystal.scale.set(0.8, 1.3, 0.8); root.add(crystal);
  crystal.add(new THREE.Mesh(crystal.geometry, outlineMat(0.02)));
  for (const y of [0.7, 1.15, 1.6]) { const r = new THREE.Mesh(geoBox(0.16, 0.06, 0.02), runeM); r.position.set(0, y, 0.37 - (y - 0.7) * 0.05); root.add(r); }
  const halo = glow(2.2); halo.position.y = 2.75; root.add(halo);
  root.add(blob(2.2));
  return { root, crystal, halo, runeM, setOn(on) { runeM.color.setHex(on ? 0x9fe0ff : 0x8a8a8a); runeM.emissive.setHex(on ? 0x3a9ad8 : 0x000000); halo.visible = on; } };
}
function watermill() {
  const root = new THREE.Group(), wood = lam(0xffffff, chestWood);
  part(geoBox(3.2, 2.6, 3.0), lam(0xf1e6cf), 0.03, root, 0, 1.3, 0);
  for (const x of [-1.6, 1.6]) for (const z of [-1.5, 1.5]) part(geoBox(0.22, 2.7, 0.22), lam(0x7a5236), 0.015, root, x, 1.35, z);
  const roof = part(cachedGeo('millRoof', () => new THREE.ConeGeometry(2.7, 1.8, 4)), lam(0xc0503e), 0.03, root, 0, 3.5, 0); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.92);
  part(geoBox(0.9, 1.4, 0.08), lam(0x7a5236), 0.012, root, 0, 0.7, 1.52);
  part(geoBox(0.6, 0.6, 0.08), lam(0x9fd0f0), 0.012, root, -0.95, 1.8, 1.52);
  const wheel = new THREE.Group(); wheel.position.set(1.9, 1.2, 0); root.add(wheel);
  const rim = part(cachedGeo('millRim', () => new THREE.TorusGeometry(1.25, 0.08, 6, 24)), wood, 0.015, wheel, 0, 0, 0); rim.rotation.y = Math.PI / 2;
  part(geoCyl(0.18, 0.18, 0.5, 10), lam(0x5a3a22), 0.012, wheel, 0, 0, 0).rotation.z = Math.PI / 2;
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; const pd = part(geoBox(0.4, 0.08, 0.5), wood, 0.012, wheel, 0, Math.sin(a) * 1.25, Math.cos(a) * 1.25); pd.rotation.x = -a; const sp = part(geoBox(0.06, 1.2, 0.06), lam(0x7a5236), 0, wheel, 0, Math.sin(a) * 0.62, Math.cos(a) * 0.62); sp.rotation.x = -a; }
  root.add(blob(5));
  return { root, wheel };
}
function burrowGate() {
  const root = new THREE.Group(), bark = lam(0xffffff, barkTex2);
  part(cachedGeo('bgMound', () => new THREE.SphereGeometry(3.2, 26, 12, 0, Math.PI * 2, 0, Math.PI / 2)), lam(0xffffff, mossTex), 0.03, root, 0, 0, -0.6).scale.set(1, 0.7, 0.8);
  const hole = new THREE.Mesh(cachedGeo('bgHole', () => new THREE.CircleGeometry(1.0, 24)), new THREE.MeshBasicMaterial({ color: 0x1a120c })); hole.position.set(0, 0.95, 1.38); hole.scale.set(1, 1.05, 1); root.add(hole);
  // big roots arching over the entrance
  for (const [x, rz, len] of [[-1.15, 0.35, 2.2], [1.15, -0.35, 2.2], [-0.5, 0.15, 1.6], [0.6, -0.12, 1.5]]) { const r = part(geoCyl(0.14, 0.24, len, 7), bark, 0.02, root, x, len * 0.42, 1.25 + Math.abs(x) * 0.1); r.rotation.set(0.25, 0, rz); }
  const arch = part(cachedGeo('bgArch', () => new THREE.TorusGeometry(1.15, 0.16, 7, 20, Math.PI)), bark, 0.02, root, 0, 0.95, 1.36);
  const lamp = glow(0.8); lamp.position.set(-1.35, 1.9, 1.5); root.add(lamp);
  part(cachedGeo('fmush', () => new THREE.SphereGeometry(0.045, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2)), new THREE.MeshLambertMaterial({ color: 0x9ff5d2, emissive: 0x2f9a6e }), 0, root, -1.35, 1.8, 1.5).scale.setScalar(3);
  root.add(blob(5));
  return { root, hole };
}
Object.assign(MONSTER_BUILD, { dummy: buildDummy, balloon: buildBalloon, crystal: buildCrystal, irontarget: buildIronTarget });
// a golden monster: every surface warms to gold, with a soft glow around it
const goldCache = new Map();
function goldify(p) {
  p.body.traverse((o) => {
    if (!o.isMesh || !o.material || o.material.isShaderMaterial || o.material === RW.shadowMat) return;
    const src = o.material;
    if (src === p.mat) return;
    let g = goldCache.get(src.uuid);
    if (!g) { g = src.clone(); g.color = new THREE.Color(src.color).lerp(new THREE.Color(0xffd34d), src.map ? 0.55 : 0.75); g.emissive = new THREE.Color(0x5a3e00); goldCache.set(src.uuid, g); }
    o.material = g;
  });
  const fm = p.mat.clone(); fm.color = new THREE.Color(0xffe7a0); fm.emissive = new THREE.Color(0x4a3300);
  p.body.traverse((o) => { if (o.isMesh && o.material === p.mat) o.material = fm; });
  p.mat = fm;
  const halo = glow(3.2); halo.material = halo.material.clone(); halo.material.opacity = 0.55; halo.position.y = 0.7; halo.userData.live = true; p.root.add(halo); p.halo = halo;
  return p;
}

// ---------- items: 2D icons for the bag and hotbar, small 3D drops on the ground ----------
const iconCache = new Map();
function iconURL(id, size) {
  size = size || 64;
  const key = id + '_' + size;
  if (iconCache.has(key)) return iconCache.get(key);
  const it = RW.ITEMS[id] || { icon: 'coin', color: '#f2c14e' };
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); g.scale(size / 64, size / 64);
  g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = '#3b2a1e'; g.lineWidth = 3;
  const col = it.color;
  if (it.icon === 'potion') {
    const k = it.big ? 1.12 : 1;
    g.save(); g.translate(32, 36); g.scale(k, k);
    g.fillStyle = '#a8774f'; g.beginPath(); g.rect(-6, -26, 12, 8); g.fill(); g.stroke();
    g.fillStyle = col; g.beginPath(); g.moveTo(-6, -18); g.lineTo(6, -18); g.lineTo(6, -10); g.quadraticCurveTo(20, -4, 20, 8); g.quadraticCurveTo(20, 24, 0, 24); g.quadraticCurveTo(-20, 24, -20, 8); g.quadraticCurveTo(-20, -4, -6, -10); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.55)'; ell(g, -9, 2, 3.5, 7, 0.3);
    g.restore();
  } else if (it.icon === 'jelly') {
    g.fillStyle = col; g.beginPath(); g.moveTo(12, 50); g.quadraticCurveTo(8, 22, 32, 20); g.quadraticCurveTo(56, 22, 52, 50); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.55)'; ell(g, 22, 32, 5, 3, -0.4);
    g.fillStyle = '#4fae4a'; g.beginPath(); g.ellipse(36, 16, 9, 4, -0.5, 0, Math.PI * 2); g.fill(); g.stroke();
  } else if (it.icon === 'sprout') {
    g.strokeStyle = '#3b2a1e'; g.fillStyle = '#a8774f'; g.beginPath(); g.ellipse(32, 50, 16, 6, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.lineWidth = 4; g.strokeStyle = '#4f8a3a'; g.beginPath(); g.moveTo(32, 48); g.lineTo(32, 28); g.stroke();
    g.lineWidth = 3; g.strokeStyle = '#3b2a1e'; g.fillStyle = col;
    g.beginPath(); g.ellipse(22, 24, 11, 6, 0.5, 0, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(42, 22, 11, 6, -0.5, 0, Math.PI * 2); g.fill(); g.stroke();
  } else if (it.icon === 'leaf') {
    g.fillStyle = col; g.beginPath(); g.moveTo(12, 52); g.quadraticCurveTo(10, 14, 52, 10); g.quadraticCurveTo(54, 48, 12, 52); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = '#a8761e'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(14, 50); g.quadraticCurveTo(30, 34, 48, 14); g.stroke();
    g.fillStyle = '#fff6c8'; for (const [x, y] of [[44, 26], [24, 20]]) { g.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 2 : 5, a = (i / 8) * Math.PI * 2; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.fill(); }
  } else if (it.icon === 'cap') {
    g.fillStyle = '#f3dcb8'; g.beginPath(); g.rect(24, 34, 16, 18); g.fill(); g.stroke();
    g.fillStyle = col; g.beginPath(); g.moveTo(8, 38); g.quadraticCurveTo(10, 10, 32, 10); g.quadraticCurveTo(54, 10, 56, 38); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#fff8ee'; ell(g, 22, 24, 5, 4); ell(g, 38, 18, 4, 3); ell(g, 46, 30, 3.5, 3);
  } else if (it.icon === 'puff') {
    g.fillStyle = col; for (const [x, y, r] of [[22, 36, 12], [40, 34, 13], [31, 24, 13], [32, 42, 11]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.stroke(); }
    g.fillStyle = col; for (const [x, y, r] of [[22, 36, 10.5], [40, 34, 11.5], [31, 24, 11.5], [32, 42, 9.5]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = 'rgba(200,170,120,.6)'; for (const [x, y] of [[26, 30], [36, 38], [38, 26]]) ell(g, x, y, 1.6, 1.6);
  } else if (it.icon === 'berry') {
    const gr = g.createRadialGradient(32, 34, 2, 32, 34, 30); gr.addColorStop(0, 'rgba(255,240,160,.9)'); gr.addColorStop(1, 'rgba(255,240,160,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    g.fillStyle = col; for (const [x, y, r] of [[24, 38, 11], [40, 38, 11], [32, 26, 11]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,.7)'; ell(g, 21, 34, 3, 2.2); ell(g, 37, 34, 3, 2.2); ell(g, 29, 22, 3, 2.2);
    g.fillStyle = '#4fae4a'; g.beginPath(); g.ellipse(38, 12, 8, 4, -0.5, 0, Math.PI * 2); g.fill(); g.stroke();
  } else if (it.icon === 'hammer') {
    g.save(); g.translate(32, 34); g.rotate(-0.7);
    g.fillStyle = '#a8774f'; g.beginPath(); g.rect(-4, -6, 8, 30); g.fill(); g.stroke();
    g.fillStyle = col; g.beginPath(); g.rect(-15, -20, 30, 15); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(-12, -18, 24, 3);
    g.restore();
  } else if (it.icon === 'treat') {
    g.save(); g.translate(32, 32); g.rotate(-0.4);
    g.fillStyle = col; g.beginPath(); for (const [x, y] of [[-16, -6], [-16, 6]]) { g.moveTo(x + 7, y); g.arc(x, y, 7, 0, Math.PI * 2); } for (const [x, y] of [[16, -6], [16, 6]]) { g.moveTo(x + 7, y); g.arc(x, y, 7, 0, Math.PI * 2); } g.fill(); g.stroke();
    g.beginPath(); g.rect(-16, -6, 32, 12); g.fill(); g.strokeStyle = col; g.stroke();
    g.strokeStyle = '#3b2a1e'; g.beginPath(); g.moveTo(-16, -6); g.lineTo(16, -6); g.moveTo(-16, 6); g.lineTo(16, 6); g.stroke();
    g.restore();
  } else if (it.icon === 'fluff') {
    g.strokeStyle = '#7a9a5a'; g.lineWidth = 3; g.beginPath(); g.moveTo(32, 58); g.quadraticCurveTo(28, 44, 32, 32); g.stroke();
    g.strokeStyle = '#3b2a1e'; g.fillStyle = col; g.beginPath(); g.arc(32, 26, 18, 0, Math.PI * 2); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(160,150,120,.7)'; g.lineWidth = 1.5; for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; g.beginPath(); g.moveTo(32, 26); g.lineTo(32 + Math.cos(a) * 15, 26 + Math.sin(a) * 15); g.stroke(); }
    g.fillStyle = '#d9cfae'; ell(g, 32, 26, 3, 3);
  } else if (it.icon === 'bristle') {
    g.fillStyle = '#c99a62'; g.beginPath(); g.rect(18, 40, 28, 12); g.fill(); g.stroke();
    g.strokeStyle = col; g.lineWidth = 3; for (let i = 0; i < 7; i++) { const x = 21 + i * 3.6; g.beginPath(); g.moveTo(x, 40); g.lineTo(x + (i - 3) * 2.2, 12 + (i % 2) * 5); g.stroke(); }
    g.strokeStyle = '#3b2a1e'; g.lineWidth = 2; g.beginPath(); g.moveTo(18, 46); g.lineTo(46, 46); g.stroke();
  } else if (it.icon === 'tusk') {
    g.fillStyle = col; g.beginPath(); g.moveTo(14, 50); g.quadraticCurveTo(18, 18, 50, 10); g.quadraticCurveTo(30, 28, 26, 54); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.7)'; ell(g, 26, 30, 3, 6, 0.6);
  } else if (it.icon === 'quill') {
    g.save(); g.translate(32, 32); g.rotate(-0.75);
    g.fillStyle = col; g.beginPath(); g.moveTo(-4, 22); g.lineTo(0, -26); g.lineTo(4, 22); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#f3dcb8'; g.beginPath(); g.ellipse(0, 22, 6, 5, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.restore();
  } else if (it.icon === 'gem') {
    g.fillStyle = col; g.beginPath(); g.moveTo(32, 8); g.lineTo(52, 26); g.lineTo(32, 56); g.lineTo(12, 26); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(120,60,10,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(12, 26); g.lineTo(52, 26); g.moveTo(24, 26); g.lineTo(32, 56); g.lineTo(40, 26); g.stroke();
    g.fillStyle = 'rgba(255,250,220,.75)'; ell(g, 26, 18, 4, 3, -0.5);
  } else if (it.icon === 'kite') {
    g.fillStyle = col; g.beginPath(); g.moveTo(32, 6); g.lineTo(48, 26); g.lineTo(32, 46); g.lineTo(16, 26); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#f4c542'; g.beginPath(); g.moveTo(32, 6); g.lineTo(48, 26); g.lineTo(32, 26); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = '#3b2a1e'; g.lineWidth = 2; g.beginPath(); g.moveTo(32, 46); g.quadraticCurveTo(24, 52, 30, 58); g.stroke();
    g.fillStyle = '#4f79b8'; ell(g, 27, 52, 4, 2.5, 0.5);
  } else if (it.icon === 'clover') {
    g.fillStyle = col; for (const a of [0, 1, 2, 3]) { const ang = a * Math.PI / 2 + Math.PI / 4; g.beginPath(); g.ellipse(32 + Math.cos(ang) * 11, 28 + Math.sin(ang) * 11, 10, 9, ang, 0, Math.PI * 2); g.fill(); g.stroke(); }
    g.strokeStyle = '#3f7a32'; g.lineWidth = 4; g.beginPath(); g.moveTo(32, 30); g.quadraticCurveTo(36, 46, 30, 58); g.stroke();
  } else if (it.icon === 'kibble') {
    g.fillStyle = '#d8c7a4'; g.beginPath(); g.moveTo(14, 18); g.lineTo(50, 18); g.lineTo(46, 54); g.lineTo(18, 54); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = col; g.beginPath(); g.rect(18, 30, 28, 14); g.fill(); g.stroke();
    g.fillStyle = '#fff4dc'; ell(g, 32, 37, 6, 4);
    g.fillStyle = '#8a5a2e'; for (const [x, y] of [[24, 14], [32, 10], [40, 14]]) { g.beginPath(); g.ellipse(x, y, 5, 4, 0.4, 0, Math.PI * 2); g.fill(); g.stroke(); }
  } else if (it.icon === 'bowl') {
    g.fillStyle = '#c94f6a'; for (const [x, y] of [[22, 28], [32, 22], [42, 28], [28, 30], [37, 30]]) { g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fill(); g.stroke(); }
    g.fillStyle = col; g.beginPath(); g.moveTo(8, 32); g.lineTo(56, 32); g.quadraticCurveTo(54, 54, 32, 54); g.quadraticCurveTo(10, 54, 8, 32); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.5)'; ell(g, 20, 40, 5, 3, -0.3);
  } else if (it.icon === 'egg') {
    g.fillStyle = col; g.beginPath(); g.moveTo(32, 6); g.bezierCurveTo(50, 6, 54, 40, 50, 46); g.bezierCurveTo(46, 58, 18, 58, 14, 46); g.bezierCurveTo(10, 40, 14, 6, 32, 6); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#6a8a3a'; for (const [x, y, r] of [[24, 26, 4], [38, 20, 3], [40, 38, 4.5], [26, 44, 3]]) ell(g, x, y, r, r);
    g.fillStyle = 'rgba(255,255,255,.6)'; ell(g, 22, 18, 3, 6, 0.4);
  } else if (it.icon === 'gear' && RW.gearIcon) {
    RW.gearIcon(g, it);
  } else {
    g.fillStyle = '#e3b343'; for (const [x, y] of [[24, 42], [40, 42], [32, 30]]) { g.beginPath(); g.ellipse(x, y, 12, 9, 0, 0, Math.PI * 2); g.fill(); g.stroke(); g.fillStyle = '#f7d977'; ell(g, x - 2, y - 2, 6, 4); g.fillStyle = '#e3b343'; }
  }
  const url = c.toDataURL();
  iconCache.set(key, url);
  return url;
}
function dropModel(id) {
  const g = new THREE.Group();
  const it = RW.ITEMS[id];
  if (!it) { // coins
    for (const [x, y, z] of [[0, 0, 0], [0.12, 0.03, 0.06], [-0.08, 0.06, -0.04]]) { const c = new THREE.Mesh(geoCyl(0.11, 0.11, 0.035, 14), lam(0xe3b343)); c.position.set(x, y, z); c.rotation.x = 0.2; g.add(c); }
    return g;
  }
  const col = new THREE.Color(it.color).getHex();
  if (it.icon === 'potion') {
    part(geoSphere(0.13, 12, 10), lam(col), 0.012, g, 0, 0, 0);
    part(geoCyl(0.045, 0.05, 0.1, 8), lam(col), 0.01, g, 0, 0.14, 0);
    part(geoCyl(0.05, 0.05, 0.05, 8), lam(0xa8774f), 0.008, g, 0, 0.21, 0);
  } else if (it.icon === 'jelly') {
    part(geoSphere(0.16, 14, 10), lam(col), 0.012, g, 0, 0, 0).scale.set(1, 0.75, 1);
    part(geoSphere(0.07, 8, 6), lam(0x4fae4a), 0.008, g, 0.03, 0.12, 0).scale.set(1, 0.2, 0.5);
  } else if (it.icon === 'berry') {
    const bm = new THREE.MeshLambertMaterial({ color: col, emissive: 0x8a5a10 });
    for (const [x, y, z] of [[-0.07, 0, 0], [0.07, 0, 0.02], [0, 0.1, -0.02]]) part(geoSphere(0.09, 10, 8), bm, 0.01, g, x, y, z);
    const gl = glow(0.9); gl.material.opacity = 0.7; g.add(gl);
  } else if (it.icon === 'hammer') {
    part(geoCyl(0.025, 0.03, 0.34, 8), lam(0xa8774f), 0.01, g, 0, 0, 0).rotation.z = 1.2;
    part(geoBox(0.16, 0.1, 0.1), lam(col), 0.01, g, 0.13, 0.06, 0).rotation.z = 1.2;
    const gl = glow(0.8); gl.material.opacity = 0.6; g.add(gl);
  } else if (it.icon === 'cap' || it.icon === 'puff') {
    part(cachedGeo('dcap', () => new THREE.SphereGeometry(0.17, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2)), id === 'glowcap' ? new THREE.MeshLambertMaterial({ color: col, emissive: 0x1f7a52 }) : lam(col), 0.012, g, 0, -0.04, 0);
  } else if (it.icon === 'fluff') {
    part(geoSphere(0.15, 12, 10), lam(col), 0.012, g, 0, 0.02, 0);
  } else if (it.icon === 'bristle' || it.icon === 'quill' || it.icon === 'tusk') {
    for (let i = 0; i < 3; i++) part(geoCone(it.icon === 'tusk' ? 0.05 : 0.025, 0.3, 6), lam(col), 0.01, g, (i - 1) * 0.06, 0, 0).rotation.z = (i - 1) * 0.35 + 0.3;
  } else if (it.icon === 'gem') {
    part(cachedGeo('gemG', () => new THREE.OctahedronGeometry(0.14, 0)), new THREE.MeshLambertMaterial({ color: col, emissive: 0x6a3a08 }), 0.01, g, 0, 0.02, 0).scale.set(1, 1.3, 1);
    const gl = glow(0.7); gl.material.opacity = 0.6; g.add(gl);
  } else if (it.icon === 'kite') {
    const k = part(cachedGeo('kiteSail', () => new THREE.CircleGeometry(0.16, 4)), lam(col, null, { side: THREE.DoubleSide }), 0.01, g, 0, 0.05, 0); k.scale.set(1.2, 1.6, 1);
    const gl = glow(0.9); gl.material.opacity = 0.6; g.add(gl);
  } else if (it.icon === 'kibble') {
    part(geoBox(0.2, 0.24, 0.12), lam(col), 0.01, g, 0, 0.04, 0);
  } else if (it.icon === 'bowl') {
    part(cachedGeo('dbowl', () => new THREE.SphereGeometry(0.16, 12, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)), lam(col), 0.012, g, 0, 0.08, 0);
    for (const [x, z] of [[-0.05, 0], [0.05, 0.02], [0, -0.05]]) part(geoSphere(0.05, 8, 6), lam(0xc94f6a), 0.006, g, x, 0.09, z);
  } else if (it.icon === 'egg') {
    const e = eggModel('wild'); e.root.scale.setScalar(0.45); g.add(e.root);
    const gl = glow(1); gl.material.opacity = 0.7; g.add(gl);
  } else if (it.icon === 'gear') {
    // a little wrapped bundle of gear with a gold strap and a soft glow
    part(geoBox(0.26, 0.18, 0.2), lam(col), 0.012, g, 0, 0.02, 0).rotation.y = 0.4;
    part(geoBox(0.27, 0.05, 0.21), lam(0xe3b343), 0.008, g, 0, 0.02, 0).rotation.y = 0.4;
    const gl = glow(1.1); gl.material.opacity = 0.75; g.add(gl);
  } else {
    const lf = part(geoSphere(0.16, 10, 8), lam(col), 0.012, g, 0, 0, 0); lf.scale.set(1, 0.25, 0.7); lf.rotation.z = 0.4;
  }
  return g;
}

// ---------- treasure chest: a wooden box with gold bands; the lid swings open ----------
const chestWood = ctex('chestwood', 128, 128, (g, w, h) => { g.fillStyle = '#9a6234'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 32) { g.fillStyle = 'rgba(60,34,16,.55)'; g.fillRect(0, y, w, 3); } for (let i = 0; i < 30; i++) { g.strokeStyle = R() < 0.5 ? 'rgba(70,40,20,.35)' : 'rgba(200,140,80,.3)'; g.lineWidth = 1.4; const y = R() * h; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + 4, w * 0.6, y - 4, w, y + 2); g.stroke(); } }, [1, 1]);
function chestModel() {
  const root = new THREE.Group(), T = 0.02;
  const wood = lam(0xffffff, chestWood), band = lam(0xe3b343), dark = lam(0x5a3a22);
  part(geoBox(1.1, 0.6, 0.72), wood, T, root, 0, 0.3, 0);
  for (const x of [-0.42, 0.42]) part(geoBox(0.1, 0.62, 0.74), band, 0, root, x, 0.3, 0);
  const lid = new THREE.Group(); lid.position.set(0, 0.6, -0.36); root.add(lid);
  const top = part(cachedGeo('chestLid', () => new THREE.CylinderGeometry(0.36, 0.36, 1.1, 16, 1, false, 0, Math.PI)), wood, T, lid, 0, 0, 0.36); top.rotation.z = Math.PI / 2;
  for (const x of [-0.42, 0.42]) { const b = part(cachedGeo('chestBand', () => new THREE.CylinderGeometry(0.375, 0.375, 0.1, 16, 1, false, 0, Math.PI)), band, 0, lid, x, 0, 0.36); b.rotation.z = Math.PI / 2; }
  part(geoBox(0.18, 0.2, 0.06), band, 0.01, root, 0, 0.55, 0.37);
  part(geoBox(0.06, 0.08, 0.03), dark, 0, root, 0, 0.53, 0.405);
  const inside = new THREE.Mesh(geoBox(1.0, 0.04, 0.62), new THREE.MeshBasicMaterial({ color: 0xffe9a0 })); inside.position.y = 0.56; root.add(inside);
  const shine = glow(2.2); shine.position.y = 0.9; shine.material.opacity = 0; root.add(shine);
  root.add(blob(1.6));
  return { root, lid, shine, inside };
}

// ---------- pets: six species, baby and teen forms (babies from the approved Lookbook) ----------
// Pet faces have their own moods: normal, happy, sad, sleep, hurt, eat.
const PET_MOODS = ['normal', 'happy', 'sad', 'sleep', 'hurt', 'eat'];
function drawPetFace(g, cx, cy, U, ky, st) {
  g.save(); g.translate(cx, cy); g.scale(U, U * ky);
  const dark = '#24170f';
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.fillStyle = st === 'sad' ? 'rgba(150,180,255,.35)' : 'rgba(255,130,130,.5)'; ell(g, -1.5, 0.62, 0.44, 0.24); ell(g, 1.5, 0.62, 0.44, 0.24);
  const eye = (s, k) => { g.fillStyle = dark; ell(g, s * 0.9, 0, 0.34 * k, 0.46 * k); g.fillStyle = '#fff'; ell(g, s * 0.9 - 0.11, -0.17, 0.13, 0.13); ell(g, s * 0.9 + 0.1, 0.16, 0.06, 0.06); };
  const arc = (s, up) => { g.strokeStyle = dark; g.lineWidth = 0.16; g.beginPath(); if (up) { g.moveTo(s * 0.9 - 0.32, 0.12); g.quadraticCurveTo(s * 0.9, -0.42, s * 0.9 + 0.32, 0.12); } else { g.moveTo(s * 0.9 - 0.32, -0.04); g.quadraticCurveTo(s * 0.9, 0.3, s * 0.9 + 0.32, -0.04); } g.stroke(); };
  g.strokeStyle = dark; g.lineWidth = 0.12;
  if (st === 'normal') {
    eye(-1, 1); eye(1, 1);
    g.beginPath(); g.moveTo(-0.28, 0.62); g.quadraticCurveTo(0, 0.88, 0.28, 0.62); g.stroke();
  } else if (st === 'happy') {
    arc(-1, true); arc(1, true);
    g.fillStyle = '#8a2f2a'; g.beginPath(); g.moveTo(-0.38, 0.56); g.quadraticCurveTo(0, 1.2, 0.38, 0.56); g.closePath(); g.fill();
    g.fillStyle = '#ff8f9a'; ell(g, 0, 0.84, 0.17, 0.1);
  } else if (st === 'sad') {
    eye(-1, 0.85); eye(1, 0.85);
    g.lineWidth = 0.14; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 0.5, -0.7); g.lineTo(s * 1.25, -0.48); g.stroke(); }
    g.lineWidth = 0.12; g.beginPath(); g.moveTo(-0.26, 0.86); g.quadraticCurveTo(0, 0.6, 0.26, 0.86); g.stroke();
    g.fillStyle = '#8fd0ff'; g.beginPath(); g.moveTo(1.22, 0.2); g.quadraticCurveTo(1.42, 0.55, 1.22, 0.62); g.quadraticCurveTo(1.02, 0.55, 1.22, 0.2); g.fill();
  } else if (st === 'sleep') {
    arc(-1, false); arc(1, false);
    g.beginPath(); g.ellipse(0, 0.74, 0.12, 0.1, 0, 0, Math.PI * 2); g.stroke();
  } else if (st === 'hurt') {
    g.lineWidth = 0.16;
    g.beginPath(); g.moveTo(-1.2, -0.3); g.lineTo(-0.62, 0); g.lineTo(-1.2, 0.3); g.stroke();
    g.beginPath(); g.moveTo(1.2, -0.3); g.lineTo(0.62, 0); g.lineTo(1.2, 0.3); g.stroke();
    g.lineWidth = 0.11; g.beginPath(); g.moveTo(-0.38, 0.78); g.quadraticCurveTo(-0.19, 0.6, 0, 0.78); g.quadraticCurveTo(0.19, 0.96, 0.38, 0.78); g.stroke();
  } else {
    arc(-1, true); arc(1, true);
    g.fillStyle = '#8a2f2a'; ell(g, 0, 0.76, 0.24, 0.2);
  }
  g.restore();
}
const petFaces = (hex, cyOff) => {
  const set = {}, cy = 118 + (cyOff || 0);
  for (const st of PET_MOODS) set[st] = ctex('pf' + hex + (cyOff || 0) + st, 512, 256, (g, w, h) => { g.fillStyle = hex; g.fillRect(0, 0, w, h); drawPetFace(g, 128, cy, 22, 1.0, st); }, null);
  return set;
};
const crystalGeo = () => cachedGeo('petCrystal', () => new THREE.OctahedronGeometry(1, 0));
const glassMat = (hex, glowHex) => lam(hex, null, { emissive: glowHex || 0x1a3a4a });
function petResult(root, body, mat, faces, o) {
  const p = Object.assign({ root, body, mat, faces, mood: 'normal' }, o || {});
  freeze(body);
  return p;
}
// Puffdrake: a little dragon who sneezes tiny flames (Lookbook drake; Ember and Bloom adults kept for later)
function petDrake(stage) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const S = { baby: 1, teen: 1.35, ember: 1.75, bloom: 1.75 }[stage];
  const col = { baby: 0xf0855a, teen: 0xea7448, ember: 0xd94b30, bloom: 0x6fbf5a }[stage], belly = { baby: 0xffe3c2, teen: 0xffe3c2, ember: 0xffd9a8, bloom: 0xe8f5c8 }[stage];
  const wing = stage === 'bloom' ? 0x9bd66f : stage === 'ember' ? 0x8a3a2a : 0xf7b08a;
  body.scale.setScalar(S);
  const bm = lam(col);
  part(geoSphere(0.3, 18, 14), bm, 0.02, body, 0, 0.32, 0).scale.set(1, 0.95, 0.9);
  part(geoSphere(0.2, 14, 10), lam(belly), 0.0, body, 0, 0.3, 0.2).scale.set(1, 1.05, 0.55);
  const neckLen = stage === 'baby' ? 0 : 0.14;
  if (neckLen) part(geoCyl(0.11, 0.15, 0.22, 12), bm, 0.018, body, 0, 0.62, 0.06).rotation.x = 0.25;
  const headY = 0.72 + neckLen;
  const faces = petFaces(stage === 'bloom' ? '#6fbf5a' : '#' + new THREE.Color(col).getHexString(), 6), mat = lam(0xffffff, faces.normal);
  part(geoSphere(0.26, 20, 14), mat, 0.02, body, 0, headY, 0.06);
  part(geoSphere(0.11, 12, 10), lam(stage === 'bloom' ? 0x9ad386 : 0xf7a079), 0.012, body, 0, headY - 0.1, 0.26).scale.set(1.1, 0.75, 0.8);
  if (stage !== 'baby') for (const s of [1, -1]) part(geoSphere(0.018, 6, 5), lam(0x8a3a2a), 0, body, 0.045 * s, headY - 0.08, 0.35);
  for (const s of [1, -1]) {
    part(geoCone(0.05, stage === 'baby' ? 0.12 : 0.2, 6), lam(stage === 'bloom' ? 0x4f9a3a : 0xffe3c2), 0.01, body, 0.12 * s, headY + 0.22, 0.0).rotation.z = -0.35 * s;
    const w = part(geoSphere(0.22, 14, 10), lam(wing), 0.018, body, 0.3 * s, 0.52, -0.12); w.scale.set(stage === 'baby' ? 0.7 : 1.3, 0.9, 0.18); w.rotation.set(0, 0.5 * s, -0.55 * s);
    part(geoSphere(0.08, 10, 8), lam(new THREE.Color(col).multiplyScalar(0.85).getHex()), 0.012, body, 0.13 * s, 0.05, 0.08).scale.set(1, 0.6, 1.3);
  }
  if (stage !== 'baby') for (let i = 0; i < 4; i++) part(geoCone(0.035, 0.09, 5), lam(0xffd0a0), 0.008, body, 0, 0.58 - i * 0.1, -0.2 - i * 0.05).rotation.x = -0.9 - i * 0.2;
  const tail = new THREE.Group(); tail.position.set(0, 0.22, -0.26); tail.userData.live = true; body.add(tail);
  [[0, 0, -0.04, 0.12], [0.02, -0.04, -0.16, 0.09], [0.06, -0.04, -0.27, 0.07], [0.12, 0.0, -0.35, 0.05]].forEach(([x, y, z, r]) => part(geoSphere(r, 10, 8), bm, 0.012, tail, x, y, z));
  if (stage === 'teen') part(geoCone(0.06, 0.14, 4), lam(0xffd0a0), 0.008, tail, 0.15, 0.02, -0.42).rotation.x = -1.3;
  if (stage === 'ember') { const fl = part(geoCone(0.08, 0.22, 7), new THREE.MeshLambertMaterial({ color: 0xffb43d, emissive: 0x7a3a00 }), 0.012, tail, 0.16, 0.08, -0.4); fl.rotation.x = -0.6; }
  if (stage === 'bloom') { part(geoSphere(0.06, 10, 8), lam(0xffb3c6), 0.01, tail, 0.16, 0.05, -0.4); part(geoSphere(0.07, 10, 8), lam(0xffb3c6), 0.01, body, 0, headY + 0.26, 0.02); }
  return petResult(root, body, mat, faces, { tail, headY: headY * S, mouth: V3(0, (headY - 0.1) * S, 0.34 * S), size: 0.9 * S, hover: 0 });
}
// Cloudfox: a fox on a little cloud; the teen grows a big curling cloud tail and a cloud collar
function petCloudfox(teen) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const S = teen ? 1.3 : 1; body.scale.setScalar(S);
  const c = lam(0xfff6ea), puff = lam(0xffffff), sky = lam(0x9fd3ef), cloud = lam(0xe4f1fa);
  const faces = petFaces('#fff6ea'), mat = lam(0xffffff, faces.normal);
  const tail = new THREE.Group(); tail.position.set(0, 0.42, -0.3); tail.userData.live = true; body.add(tail);
  const plume = teen
    ? [[0, -0.12, -0.08, 0.2], [0.05, 0.04, -0.22, 0.19], [0.02, 0.24, -0.3, 0.18], [-0.03, 0.44, -0.26, 0.16], [0, 0.58, -0.12, 0.14], [0.11, 0.12, -0.3, 0.14], [-0.11, 0.18, -0.28, 0.14]]
    : [[0, -0.1, -0.06, 0.17], [0.12, 0.04, -0.14, 0.13], [-0.1, 0.02, -0.16, 0.12], [0.02, 0.18, -0.12, 0.12], [0, -0.2, -0.2, 0.11]];
  plume.forEach(([x, y, z, r]) => part(geoSphere(r, 14, 10), puff, 0.018, tail, x, y, z));
  if (teen) part(geoSphere(0.1, 12, 10), lam(0xbfe2f5), 0.014, tail, 0, 0.66, 0.0);
  part(geoSphere(0.24, 18, 14), c, 0.02, body, 0, 0.42, 0).scale.set(1, 0.85, teen ? 1.25 : 1.1);
  part(geoSphere(0.24, 20, 14), mat, 0.02, body, 0, 0.74, 0.08);
  part(geoSphere(0.026, 8, 6), lam(0x24170f), 0.0, body, 0, 0.72, 0.315);
  const earH = teen ? 0.27 : 0.2, earR = teen ? 0.09 : 0.08;
  for (const s of [1, -1]) {
    part(geoCone(earR, earH, 6), c, 0.012, body, 0.13 * s, 0.98 + (earH - 0.2) / 2, 0.04).rotation.z = -0.3 * s;
    part(geoCone(earR * 0.56, earH * 0.6, 6), sky, 0, body, 0.13 * s, 0.98 + (earH - 0.2) / 2, 0.075).rotation.z = -0.3 * s;
  }
  if (teen) {
    for (let i = 0; i < 9; i++) { const a = -Math.PI * 0.85 + (i / 8) * Math.PI * 1.7; part(geoSphere(0.075, 10, 8), cloud, 0.01, body, Math.sin(a) * 0.2, 0.56, Math.cos(a) * 0.17 + 0.03); }
    const mark = part(geoSphere(0.04, 10, 8), sky, 0, body, 0, 0.886, 0.272); mark.scale.set(1.4, 0.7, 0.45); mark.rotation.x = -0.6;
    for (const s of [1, -1]) part(geoSphere(0.06, 10, 8), c, 0.01, body, 0.1 * s, 0.25, 0.2).scale.set(1, 0.8, 1.2);
  }
  const cl = teen
    ? [[-0.15, 0.2, 0.06, 0.16], [0.15, 0.2, 0.04, 0.15], [0, 0.18, -0.16, 0.17], [0, 0.22, 0.2, 0.12], [0.22, 0.22, -0.14, 0.12], [-0.22, 0.22, -0.12, 0.12]]
    : [[-0.13, 0.2, 0.06, 0.15], [0.13, 0.2, 0.04, 0.14], [0, 0.18, -0.14, 0.16], [0, 0.22, 0.17, 0.11]];
  cl.forEach(([x, y, z, r]) => part(geoSphere(r, 14, 10), cloud, 0.012, body, x, y, z).scale.set(1.3, 0.62, 1.1));
  return petResult(root, body, mat, faces, { tail, headY: 0.74 * S, mouth: V3(0, 0.68 * S, 0.32 * S), size: 0.7 * S, hover: 0.12 * S });
}
// Glimmerbun: a crystal-horned bunny; the teen gets a crystal crown, crystal ear tips and shards on its back
function petGlimmerbun(teen) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const S = teen ? 1.3 : 1; body.scale.setScalar(S);
  const c = lam(0xe8e0f6), pink = lam(0xffc2d1), gem = glassMat(0xa9dcf5);
  const faces = petFaces('#e8e0f6'), mat = lam(0xffffff, faces.normal);
  part(geoSphere(0.26, 18, 14), c, 0.02, body, 0, 0.28, 0).scale.set(1, 0.9, teen ? 1.1 : 1);
  part(geoSphere(0.24, 20, 14), mat, 0.02, body, 0, 0.6, 0.04);
  const eL = teen ? 3.2 : 2.6, eY = teen ? 0.96 : 0.9;
  for (const s of [1, -1]) {
    const e = part(geoSphere(0.07, 12, 10), c, 0.012, body, 0.09 * s, eY, -0.02); e.scale.set(0.8, eL, 0.5); e.rotation.z = -0.15 * s;
    const inn = part(geoSphere(0.07, 10, 8), pink, 0, body, 0.09 * s, eY, 0.012); inn.scale.set(0.45, eL - 0.4, 0.2); inn.rotation.z = -0.15 * s;
    part(geoSphere(0.07, 8, 6), c, 0.01, body, 0.12 * s, 0.05, 0.1).scale.set(1, 0.6, 1.3);
    if (teen) { const tip = part(crystalGeo(), gem, 0.008, body, 0.09 * s - 0.034 * s, eY + 0.07 * eL, -0.02); tip.scale.set(0.035, 0.06, 0.035); tip.rotation.z = -0.15 * s; }
  }
  const cr = new THREE.Group(); cr.position.set(0, 0.86, 0.06); body.add(cr);
  part(geoCone(0.06, 0.16, 4), gem, 0.01, cr, 0, 0.08, 0); const cr2 = part(geoCone(0.06, 0.06, 4), lam(0xa9dcf5), 0.01, cr, 0, -0.03, 0); cr2.rotation.x = Math.PI;
  if (teen) {
    cr.scale.set(1.2, 1.4, 1.2);
    for (const s of [1, -1]) { const k = part(crystalGeo(), glassMat(0xd3c2f5, 0x2a1a4a), 0.008, cr, 0.07 * s, 0.03, 0.01); k.scale.set(0.035, 0.08, 0.035); k.rotation.z = -0.5 * s; }
    [[0, 0.46, -0.2, 0.7], [0.1, 0.38, -0.24, 1.0], [-0.1, 0.36, -0.24, 1.0]].forEach(([x, y, z, k]) => { const sh = part(crystalGeo(), gem, 0.008, body, x, y, z); sh.scale.set(0.04 * k, 0.09 * k, 0.04 * k); sh.rotation.set(-0.8, 0, x * 3); });
    const g2 = part(crystalGeo(), glassMat(0xffb3c6, 0x4a1a2a), 0.008, body, 0, 0.36, 0.25); g2.scale.set(0.04, 0.05, 0.025);
  }
  part(geoSphere(teen ? 0.11 : 0.09, 10, 8), lam(0xffffff), 0.012, body, 0, 0.3, teen ? -0.3 : -0.26);
  const halo = glow(teen ? 0.7 : 0.5); halo.position.set(0, (0.94 + (teen ? 0.05 : 0)) * S, 0.06 * S); halo.material = halo.material.clone(); halo.material.opacity = 0.45; halo.userData.live = true; root.add(halo);
  return petResult(root, body, mat, faces, { tail: null, headY: 0.6 * S, mouth: V3(0, 0.54 * S, 0.27 * S), size: 0.7 * S, hover: 0, halo });
}
// Mossback: a stone turtle with a mossy, flowery shell; the teen grows a little sapling on its shell
function petMossback(teen) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const S = teen ? 1.3 : 1; body.scale.setScalar(S);
  const skin = lam(0x7cbf63);
  const faces = petFaces('#8cc66e'), mat = lam(0xffffff, faces.normal);
  for (const [x, z] of [[0.24, 0.2], [-0.24, 0.2], [0.24, -0.2], [-0.24, -0.2]]) part(geoSphere(teen ? 0.12 : 0.1, 10, 8), skin, 0.012, body, x, 0.07, z).scale.set(1, 0.7, 1);
  const head = part(geoSphere(teen ? 0.2 : 0.18, 18, 14), mat, 0.018, body, 0, teen ? 0.24 : 0.22, teen ? 0.42 : 0.4); head.scale.set(1, 0.9, 1);
  part(cachedGeo('shell', () => new THREE.SphereGeometry(0.42, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2)), lam(0xffffff, rockTex), 0.022, body, 0, 0.14, 0).scale.set(1, 0.85, 1.05);
  part(cachedGeo('shellrim', () => new THREE.CylinderGeometry(0.43, 0.43, 0.06, 22)), lam(0x8f8a82), 0.015, body, 0, 0.14, 0).scale.z = 1.05;
  part(cachedGeo('mossc', () => new THREE.SphereGeometry(0.36, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.42)), lam(0x6fae4a), 0.02, body, 0, 0.18, 0).scale.set(1, 0.95, 1.05);
  [[0.1, 0.5, 0.12, 0xffb3c6], [-0.14, 0.47, 0.0, 0xffffff], [0.0, 0.52, -0.12, 0xfff0a0]].forEach(([x, y, z, c]) => part(geoSphere(0.04, 8, 6), lam(c), 0.008, body, x, y, z));
  part(geoCyl(0.02, 0.025, 0.07, 6), lam(0xfff3dc), 0.006, body, 0.18, 0.5, -0.05); part(cachedGeo('mc', () => new THREE.SphereGeometry(0.07, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2)), lam(0xe8604c), 0.01, body, 0.18, 0.53, -0.05);
  part(cachedGeo('mtail', () => new THREE.ConeGeometry(0.06, 0.14, 6)), skin, 0.01, body, 0, 0.1, -0.46).rotation.x = -1.4;
  if (teen) {
    part(geoCyl(0.028, 0.045, 0.26, 7), lam(0x8a5a35), 0.01, body, -0.04, 0.62, -0.02);
    [[-0.04, 0.8, -0.02, 0.13], [0.07, 0.74, 0.03, 0.09], [-0.13, 0.75, -0.05, 0.09], [-0.02, 0.9, 0.0, 0.08]].forEach(([x, y, z, r]) => part(geoSphere(r, 12, 10), lam(0x8fd06a), 0.014, body, x, y, z));
    [[-0.2, 0.4, 0.2, 0xffb3c6], [0.22, 0.38, 0.16, 0xfff0a0], [0.24, 0.42, -0.14, 0xffffff], [-0.24, 0.4, -0.16, 0xffb3c6]].forEach(([x, y, z, c]) => { part(geoSphere(0.045, 8, 6), lam(c), 0.008, body, x, y, z); part(geoSphere(0.016, 6, 5), lam(0xf4c542), 0, body, x, y + 0.03, z); });
    part(geoCyl(0.018, 0.022, 0.06, 6), lam(0xfff3dc), 0.006, body, -0.2, 0.45, -0.02); part(cachedGeo('mc', () => new THREE.SphereGeometry(0.07, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2)), lam(0xe8604c), 0.01, body, -0.2, 0.47, -0.02).scale.setScalar(0.7);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + 0.2; const d = part(geoSphere(0.05, 6, 5), lam(i % 2 ? 0x6a9a48 : 0x86b85c), 0, body, Math.cos(a) * 0.42, 0.12, Math.sin(a) * 0.44); d.scale.set(1, 1.5 - (i % 3) * 0.25, 1); }
    part(geoCyl(0.008, 0.008, 0.06, 4), lam(0x4f9a3a), 0, body, 0.02, 0.46, 0.44);
    for (const s of [1, -1]) { const lf = part(geoSphere(0.04, 8, 6), lam(0x8fd06a), 0.006, body, 0.04 * s + 0.02, 0.5, 0.44); lf.scale.set(1, 0.25, 0.55); lf.rotation.z = 0.5 * s; }
  }
  return petResult(root, body, mat, faces, { tail: null, headY: (teen ? 0.24 : 0.22) * S, mouth: V3(0, 0.18 * S, 0.58 * S), size: 1.0 * S, hover: 0 });
}
// Bloomquill: a hedgehog with petal quills; the teen gets a double layer of petals and a flower on its head
function petBloomquill(teen) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const S = teen ? 1.3 : 1; body.scale.setScalar(S);
  const n = teen ? 24 : 16, cols = teen ? [0xff9fb8, 0xffc2d1, 0xffe0e8] : [0xff9fb8, 0xffc2d1];
  for (let i = 0; i < n; i++) {
    const lvl = teen ? i % 3 : i % 2, a = -Math.PI * 0.5 + (i / (n - 1)) * Math.PI, el = teen ? 0.25 + lvl * 0.4 : 0.4 + lvl * 0.4;
    const d = V3(Math.sin(a) * Math.cos(el), Math.sin(el), -Math.cos(a) * Math.cos(el) * 0.9 - 0.25).normalize();
    const k = teen ? 0.3 : 0.26;
    const q = part(geoSphere(teen ? 0.1 : 0.09, 10, 8), lam(cols[i % cols.length]), 0.012, body, d.x * k, 0.3 + d.y * (k - 0.02), d.z * (k + 0.04)); q.scale.set(0.6, teen ? 1.7 : 1.5, 0.25); q.quaternion.setFromUnitVectors(UP, d);
  }
  const faces = petFaces('#f6dcc0', 10), mat = lam(0xffffff, faces.normal);
  part(geoSphere(0.28, 20, 14), mat, 0.02, body, 0, 0.3, 0.02).scale.set(1, 0.9, 1);
  part(geoSphere(0.024, 8, 6), lam(0x24170f), 0, body, 0, 0.28, 0.295);
  for (const s of [1, -1]) part(geoSphere(0.07, 8, 6), lam(0xe8c49e), 0.01, body, 0.12 * s, 0.05, 0.1).scale.set(1, 0.6, 1.3);
  if (teen) {
    const fl = new THREE.Group(); fl.position.set(0.08, 0.56, 0.08); fl.rotation.set(0.35, 0, -0.3); body.add(fl);
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; const pt = part(geoSphere(0.06, 10, 8), lam(0xfff6f0), 0.008, fl, Math.cos(a) * 0.065, 0, Math.sin(a) * 0.065); pt.scale.set(1, 0.32, 0.62); pt.rotation.y = -a; }
    part(geoSphere(0.035, 8, 6), lam(0xf4c542), 0.006, fl, 0, 0.02, 0);
    for (const s of [1, -1]) { const lf = part(geoSphere(0.06, 8, 6), lam(0x7cbf63), 0.008, body, 0.12 * s, 0.1, -0.3); lf.scale.set(0.5, 0.2, 1.2); lf.rotation.y = 0.5 * s; }
  }
  return petResult(root, body, mat, faces, { tail: null, headY: 0.3 * S, mouth: V3(0, 0.24 * S, 0.3 * S), size: 0.8 * S, hover: 0 });
}
// Lilytoad: a frog under a lily pad umbrella; the teen holds the pad in one hand and a lotus blooms on it
function petLilytoad(teen) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const S = teen ? 1.3 : 1; body.scale.setScalar(S);
  const g = lam(0x79c25a), padM = lam(0x5fae45, null, { side: THREE.DoubleSide });
  const faces = petFaces('#79c25a', 26), mat = lam(0xffffff, faces.normal);
  part(geoSphere(0.3, 20, 14), mat, 0.02, body, 0, 0.26, 0).scale.set(1.15, 0.8, 1);
  part(geoSphere(0.2, 14, 10), lam(teen ? 0xeef8dc : 0xd9f0b8), 0, body, 0, 0.2, 0.16).scale.set(1, 0.6, 0.5);
  for (const s of [1, -1]) {
    part(geoSphere(0.11, 14, 10), g, 0.015, body, 0.15 * s, 0.48, 0.05); part(geoSphere(0.06, 10, 8), lam(0x24170f), 0, body, 0.15 * s, 0.5, 0.13); part(geoSphere(0.02, 6, 5), lam(0xffffff), 0, body, 0.13 * s, 0.53, 0.18);
    if (!(teen && s === 1)) part(geoSphere(0.1, 10, 8), g, 0.012, body, 0.24 * s, 0.07, 0.12).scale.set(1, 0.5, 1.2);
    part(geoSphere(0.12, 10, 8), g, 0.012, body, 0.28 * s, 0.12, -0.12).scale.set(0.8, 0.6, 1.2);
  }
  const pad = part(cachedGeo('lpad', () => new THREE.CylinderGeometry(0.36, 0.36, 0.025, 28, 1, false, 0.35, Math.PI * 2 - 0.7)), padM, 0.012, body);
  let flowerAt;
  if (teen) {
    [[-0.12, 0.36, -0.18], [0.1, 0.4, -0.2], [0.0, 0.3, -0.27]].forEach(([x, y, z]) => part(geoSphere(0.05, 8, 6), lam(0x5a9a3e), 0, body, x, y, z).scale.set(1, 0.5, 1));
    const arm = part(geoCyl(0.035, 0.045, 0.24, 8), g, 0.01, body, 0.3, 0.3, 0.12); arm.rotation.z = 0.25;
    part(geoSphere(0.055, 10, 8), g, 0.01, body, 0.28, 0.43, 0.12);
    part(geoCyl(0.012, 0.012, 0.66, 6), lam(0x3f8a32), 0.006, body, 0.28, 0.76, 0.12);
    pad.position.set(0.24, 1.08, 0.06); pad.rotation.set(0.4, 0, 0.2); pad.scale.set(1.15, 1, 1.15);
    flowerAt = V3(0.12, 1.12, 0.12);
    const fl = new THREE.Group(); fl.position.copy(flowerAt); fl.rotation.z = 0.18; body.add(fl);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const pt = part(geoSphere(0.05, 10, 8), lam(i % 2 ? 0xffb3c6 : 0xff9fb8), 0.006, fl, Math.cos(a) * 0.05, 0.04, Math.sin(a) * 0.05); pt.scale.set(0.55, 1.4, 0.3); pt.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6); }
    part(geoSphere(0.03, 8, 6), lam(0xf4c542), 0, fl, 0, 0.05, 0);
  } else {
    part(geoCyl(0.012, 0.012, 0.34, 6), lam(0x3f8a32), 0.006, body, 0, 0.66, -0.02);
    pad.position.set(0, 0.83, 0); pad.rotation.set(0.12, 0, 0.1);
    part(geoSphere(0.05, 10, 8), lam(0xffb3c6), 0.008, body, -0.16, 0.86, 0.1); part(geoSphere(0.02, 6, 5), lam(0xf4c542), 0, body, -0.16, 0.9, 0.1);
  }
  return petResult(root, body, mat, faces, { tail: null, headY: 0.3 * S, mouth: V3(0, 0.22 * S, 0.32 * S), size: 0.85 * S, hover: 0 });
}
const PET_BUILD = {
  puffdrake: (stage) => petDrake(stage),
  cloudfox: (stage) => petCloudfox(stage !== 'baby'),
  glimmerbun: (stage) => petGlimmerbun(stage !== 'baby'),
  mossback: (stage) => petMossback(stage !== 'baby'),
  bloomquill: (stage) => petBloomquill(stage !== 'baby'),
  lilytoad: (stage) => petLilytoad(stage !== 'baby')
};
function petModel(species, stage) { return PET_BUILD[species](stage || 'baby'); }
function setPetMood(p, mood) { if (p.mood === mood || !p.faces[mood]) return; p.mood = mood; p.mat.map = p.faces[mood]; p.mat.needsUpdate = true; }
// eggs: Pip's three mystery eggs (warm, sky, leaf) and the rare wild egg monsters drop; cracks appear before hatching
const EGG_LOOK = {
  warm: { base: '#fff3df', draw: (g, w, h, rr) => { g.fillStyle = '#f7a87e'; for (let i = 0; i < 18; i++) ell(g, rr() * w, 14 + rr() * (h - 28), 7 + rr() * 9, 6 + rr() * 7); g.fillStyle = '#ffd36b'; for (let i = 0; i < 10; i++) ell(g, rr() * w, 14 + rr() * (h - 28), 3, 3); } },
  sky: { base: '#f3f8ff', draw: (g, w, h) => { g.fillStyle = '#9ed7f2'; g.beginPath(); g.moveTo(0, 58); for (let x = 0; x <= w; x += 16) g.lineTo(x, (x / 16) % 2 ? 46 : 62); for (let x = w; x >= 0; x -= 16) g.lineTo(x, ((x / 16) % 2 ? 46 : 62) + 18); g.closePath(); g.fill(); g.fillStyle = '#c9b8f0'; for (let x = 8; x < w; x += 32) { ell(g, x, 26, 5, 5); ell(g, x + 16, 104, 5, 5); } } },
  leaf: { base: '#f7f7e4', draw: (g, w, h, rr) => { for (let i = 0; i < 14; i++) { const x = rr() * w, y = 16 + rr() * (h - 32), a = rr() * 3; g.fillStyle = i % 2 ? '#8cc66e' : '#6fae4a'; ell(g, x, y, 11, 5, a); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - Math.cos(a) * 9, y - Math.sin(a) * 9); g.lineTo(x + Math.cos(a) * 9, y + Math.sin(a) * 9); g.stroke(); } } },
  wild: { base: '#f1e4cf', draw: (g, w, h, rr) => { g.fillStyle = '#a77d55'; for (let i = 0; i < 70; i++) ell(g, rr() * w, rr() * h, 1.5 + rr() * 3, 1.5 + rr() * 2.5); g.strokeStyle = '#7a5434'; g.lineWidth = 5; g.beginPath(); for (let x = 0; x <= w; x += 8) g.lineTo(x, 70 + Math.sin(x / 20) * 7); g.stroke(); g.fillStyle = '#ffd36b'; for (let x = 20; x < w; x += 64) ell(g, x, 40, 5, 5); } }
};
function eggTex(kind, cracked) {
  const L = EGG_LOOK[kind] || EGG_LOOK.wild;
  return ctex('petegg' + kind + (cracked ? 'c' : ''), 256, 128, (g, w, h) => {
    g.fillStyle = L.base; g.fillRect(0, 0, w, h); L.draw(g, w, h, RW.seeded(kind.length * 977 + 13));
    if (cracked) { g.strokeStyle = '#4a3324'; g.lineWidth = 3; g.lineJoin = 'miter'; g.beginPath(); g.moveTo(0, 54); for (let x = 0; x <= w; x += 12) g.lineTo(x, (x / 12) % 2 ? 44 : 60); g.stroke(); }
  }, null);
}
function eggModel(kind) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const mat = lam(0xffffff, eggTex(kind));
  part(geoSphere(0.32, 24, 18), mat, 0.02, body, 0, 0.36, 0).scale.set(0.85, 1.1, 0.85);
  return { root, body, mat, kind, crack(on) { mat.map = eggTex(kind, on); mat.needsUpdate = true; } };
}

Object.assign(RW, { GEAR_LOOKS, HEAD_Y0, HEAD_Y1, paintFaceG, faceTex, faceVariant, paintPortrait, lookOpts, ghostify, olly, FACES, chibi, ARLO, NPC_LOOKS, npcModel, statueFigure, MONSTER_BUILD, goldify, chestModel, waystone, watermill, burrowGate, rootSpike, warnRing, iconURL, dropModel, rockTex, stickTex, mossTex, furTexFor, PET_MOODS, PET_BUILD, petModel, setPetMood, eggModel, eggTex });
})();
