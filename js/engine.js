// Russel World: renderer, scene, shared helpers, materials and geometry tools.
(function () {
'use strict';
const RW = window.RW = window.RW || {};
const THREE = window.THREE;
if (!THREE) { RW.failed = true; return; }

const isTouch = window.matchMedia('(pointer: coarse)').matches;
let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: !isTouch, powerPreference: 'default' }); } catch (e) { RW.failed = true; return; }
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isTouch ? 1.25 : 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('stage').appendChild(renderer.domElement);

// ---------- math ----------
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth01 = (t) => t * t * (3 - 2 * t);
const smoothstep = (a, b, x) => smooth01(clamp((x - a) / (b - a), 0, 1));
const wrapAngle = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
function seeded(seed) { let s = Math.floor(seed) % 2147483647; if (s <= 0) s += 2147483646; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V3(0, 1, 0), ZAX = V3(0, 0, 1);
const Qe = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));
function mtx(x, y, z, rx, ry, rz, sx, sy, sz) { sx = sx == null ? 1 : sx; return new THREE.Matrix4().compose(V3(x, y, z), Qe(rx || 0, ry || 0, rz || 0), V3(sx, sy == null ? sx : sy, sz == null ? sx : sz)); }
function mdir(pos, dir, s) { return new THREE.Matrix4().compose(pos, new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize()), V3(s, s, s)); }
function hash3(x, y, z) { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); }
function vnoise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = smooth01(xf), v = smooth01(yf), w = smooth01(zf), n = (a, b, c) => hash3(xi + a, yi + b, zi + c);
  return lerp(lerp(lerp(n(0, 0, 0), n(1, 0, 0), u), lerp(n(0, 1, 0), n(1, 1, 0), u), v), lerp(lerp(n(0, 0, 1), n(1, 0, 1), u), lerp(n(0, 1, 1), n(1, 1, 1), u), v), w);
}
// world generation draws from one seeded stream so the map looks the same every visit
const RNG = { R: seeded(20261106) };
const R = () => RNG.R();

// ---------- scene ----------
const FOG = new THREE.Color(0xc9dfe2);
const FOG_NEAR = 60, FOG_FAR = 175;
const scene = new THREE.Scene();
scene.background = FOG.clone();
scene.fog = new THREE.Fog(FOG, FOG_NEAR, FOG_FAR);
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.3, 1200);
scene.add(new THREE.HemisphereLight(0xfff3dc, 0x6a8a4c, 0.68));
const SUN_DIR = V3(-0.45, 0.8, 0.4).normalize();
const sun = new THREE.DirectionalLight(0xfff0d4, 0.55);
sun.position.copy(SUN_DIR).multiplyScalar(100);
scene.add(sun);
const timeU = { value: 0 };

// ---------- textures ----------
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  return t;
}
const texCache = new Map();
function ctex(key, w, h, draw, repeat) { let t = texCache.get(key); if (!t) { t = canvasTex(w, h, draw, repeat); texCache.set(key, t); } return t; }
function wrapped(w, h, fn) { for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) fn(ox, oy); }
function ell(g, x, y, rx, ry, rot) { g.beginPath(); g.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot || 0, 0, Math.PI * 2); g.fill(); }
function strokes(g, w, h, n, cols, len, lw, alpha, rr) {
  rr = rr || Math.random;
  for (let i = 0; i < n; i++) {
    const x = rr() * w, y = rr() * h, dx = (rr() - 0.5) * len * 0.6, dy = -len * (0.5 + rr() * 0.6), c = cols[i % cols.length], l = lw * (0.6 + rr() * 0.8), a = alpha * (0.6 + rr() * 0.4);
    wrapped(w, h, (ox, oy) => { g.globalAlpha = a; g.strokeStyle = c; g.lineWidth = l; g.beginPath(); g.moveTo(x + ox, y + oy); g.lineTo(x + ox + dx, y + oy + dy); g.stroke(); });
  }
  g.globalAlpha = 1;
}
const shade = (hex, k) => { const c = new THREE.Color(hex); c.r = clamp(c.r * k, 0, 1); c.g = clamp(c.g * k, 0, 1); c.b = clamp(c.b * k, 0, 1); return '#' + c.getHexString(); };

// ---------- materials ----------
const lam = (hex, map, extra) => new THREE.MeshLambertMaterial(Object.assign({ color: hex, map: map || null }, extra || {}));
const INK = new THREE.Color(0x3b2a1e);
const outlineCache = new Map();
function outlineMat(th) {
  let m = outlineCache.get(th);
  if (!m) {
    m = new THREE.ShaderMaterial({ uniforms: { th: { value: th }, col: { value: INK } }, side: THREE.BackSide,
      vertexShader: '#include <common>\n#include <fog_pars_vertex>\nuniform float th; void main(){ vec4 mvPosition = modelViewMatrix * vec4(position + normal * th, 1.0); gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n}',
      fragmentShader: '#include <common>\n#include <fog_pars_fragment>\nuniform vec3 col; void main(){ gl_FragColor = vec4(col, 1.0);\n#include <fog_fragment>\n}', fog: true });
    m.uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, m.uniforms]);
    m.userData.th = th;
    outlineCache.set(th, m);
  }
  return m;
}
const outlineSkinCache = new Map();
function outlineSkinMat(th) {
  let m = outlineSkinCache.get(th);
  if (!m) {
    m = new THREE.ShaderMaterial({ skinning: true, side: THREE.BackSide, fog: true, uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { th: { value: th }, col: { value: INK } }]),
      vertexShader: ['#include <common>', '#include <skinning_pars_vertex>', '#include <fog_pars_vertex>', 'uniform float th;', 'void main(){', '#include <beginnormal_vertex>', '#include <skinbase_vertex>', '#include <skinnormal_vertex>', '#include <begin_vertex>', '#include <skinning_vertex>', ' vec4 mvPosition = modelViewMatrix * vec4(transformed + normalize(objectNormal) * th, 1.0);', ' gl_Position = projectionMatrix * mvPosition;', '#include <fog_vertex>', '}'].join('\n'),
      fragmentShader: '#include <common>\n#include <fog_pars_fragment>\nuniform vec3 col; void main(){ gl_FragColor = vec4(col, 1.0);\n#include <fog_fragment>\n}' });
    m.userData.th = th;
    outlineSkinCache.set(th, m);
  }
  return m;
}

// ---------- geometry ----------
const geoStore = new Map();
function cachedGeo(key, make) { let g = geoStore.get(key); if (!g) { g = make(); geoStore.set(key, g); } return g; }
const geoSphere = (r, w, h) => cachedGeo('s' + r + '_' + w + '_' + h, () => new THREE.SphereGeometry(r, w || 16, h || 12));
const geoCyl = (a, b, h, s) => cachedGeo('c' + a + '_' + b + '_' + h + '_' + s, () => new THREE.CylinderGeometry(a, b, h, s || 10));
const geoCone = (r, h, s) => cachedGeo('k' + r + '_' + h + '_' + s, () => new THREE.ConeGeometry(r, h, s || 8));
const geoBox = (x, y, z) => cachedGeo('b' + x + '_' + y + '_' + z, () => new THREE.BoxGeometry(x, y, z));
function part(geo, mat, th, parent, x, y, z) { const m = new THREE.Mesh(geo, mat); if (th) m.add(new THREE.Mesh(geo, outlineMat(th))); m.position.set(x || 0, y || 0, z || 0); parent.add(m); return m; }
const lathe = (pts, seg, phiStart, phiLen) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg || 24, phiStart == null ? Math.PI : phiStart, phiLen == null ? Math.PI * 2 : phiLen);
function profileAt(pts, y) {
  let i = 0; while (i < pts.length - 2 && y > pts[i + 1][1]) i++;
  const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
  const t = clamp((y - p1[1]) / (p2[1] - p1[1]), 0, 1), t2 = t * t, t3 = t2 * t;
  return Math.max(0, 0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3));
}
function latheY(pts, y0, y1, n, seg, phiStart, phiLength, pad) {
  const v = [];
  for (let i = 0; i <= n; i++) { const y = y0 + (y1 - y0) * i / n; v.push(new THREE.Vector2(Math.max(0.0005, profileAt(pts, y) + (pad || 0)), y)); }
  const g = new THREE.LatheGeometry(v, seg, phiStart == null ? Math.PI : phiStart, phiLength == null ? Math.PI * 2 : phiLength);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setY(i, (p.getY(i) - y0) / (y1 - y0));
  return g;
}
function skinnedLimb(parent, prof, y0, y1, jointY, blend, xOff, mat, boneA, boneB, limbs, th) {
  const g = latheY(prof, y0, y1, 26, 14);
  g.translate(xOff, 0, 0);
  const p = g.attributes.position, si = new Uint16Array(p.count * 4), sw = new Float32Array(p.count * 4);
  for (let i = 0; i < p.count; i++) { const w = smooth01(clamp((jointY + blend - p.getY(i)) / (2 * blend), 0, 1)); si[i * 4 + 1] = 1; sw[i * 4] = 1 - w; sw[i * 4 + 1] = w; }
  g.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
  const mesh = new THREE.SkinnedMesh(g, mat); mesh.frustumCulled = false; parent.add(mesh);
  const entry = { mesh, bones: [boneA, boneB], out: null };
  if (th) { const out = new THREE.SkinnedMesh(g, outlineSkinMat(th)); out.frustumCulled = false; parent.add(out); entry.out = out; }
  limbs.push(entry);
}
// merge many static pieces (with optional per-piece tint and sway height) into one geometry
function bake(parts) {
  let total = 0; const prep = [];
  for (const p of parts) { const g = p.g.index ? p.g.toNonIndexed() : p.g.clone(); g.applyMatrix4(p.m); prep.push([g, p]); total += g.attributes.position.count; }
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), uv = new Float32Array(total * 2), col = new Float32Array(total * 3), sw = new Float32Array(total);
  let o = 0;
  for (const [g, p] of prep) {
    const n = g.attributes.position.count, gc = g.attributes.color, gp = g.attributes.position;
    pos.set(gp.array, o * 3); nor.set(g.attributes.normal.array, o * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
    for (let i = 0; i < n; i++) {
      let r = 1, gg = 1, b = 1;
      if (gc) { r = gc.getX(i); gg = gc.getY(i); b = gc.getZ(i); }
      if (p.col) { r *= p.col.r; gg *= p.col.g; b *= p.col.b; }
      col[(o + i) * 3] = r; col[(o + i) * 3 + 1] = gg; col[(o + i) * 3 + 2] = b;
      if (p.sway) sw[o + i] = clamp((gp.getY(i) - p.sway[0]) / p.sway[1], 0, 1);
    }
    o += n; g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); out.setAttribute('color', new THREE.BufferAttribute(col, 3)); out.setAttribute('sway', new THREE.BufferAttribute(sw, 1));
  out.computeBoundingSphere();
  return out;
}
// Collapse a finished, non-animated model into a few draw calls: meshes sharing a material are merged,
// plain-colour Lambert parts become one vertex-coloured mesh. Skinned limbs and anything marked
// userData.live (and its children) are left as they are.
const vcMats = new Map();
function vcMat(side) { let m = vcMats.get(side); if (!m) { m = new THREE.MeshLambertMaterial({ vertexColors: true, side }); vcMats.set(side, m); } return m; }
function freeze(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const skip = new Set();
  root.traverse((o) => { if (o.userData.live) o.traverse((c) => skip.add(c)); });
  const buckets = new Map(), gone = [];
  root.traverse((o) => {
    if (!o.isMesh || o.isSkinnedMesh || skip.has(o) || !o.visible) return;
    const mat = o.material;
    if (Array.isArray(mat)) return;
    let key, useMat, tint = null;
    const plain = mat.isMeshLambertMaterial && !mat.map && !mat.transparent && mat.emissive.getHex() === 0 && !mat.vertexColors;
    if (plain) { key = 'vc' + mat.side; useMat = vcMat(mat.side); tint = mat.color; }
    else { key = mat.uuid; useMat = mat; }
    let b = buckets.get(key); if (!b) { b = { mat: useMat, color: !!tint || !!mat.vertexColors, parts: [], renderOrder: o.renderOrder }; buckets.set(key, b); }
    const rel = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
    b.parts.push({ g: o.geometry, m: rel, col: tint });
    gone.push(o);
  });
  for (const o of gone) if (o.parent) o.parent.remove(o);
  for (const b of buckets.values()) {
    const geo = bake(b.parts);
    geo.deleteAttribute('sway');
    if (!b.color) geo.deleteAttribute('color');
    const mesh = new THREE.Mesh(geo, b.mat); mesh.renderOrder = b.renderOrder; root.add(mesh);
  }
  return root;
}

// ---------- blob shadows and glows ----------
const shadowTex = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(30,40,20,.55)'); gr.addColorStop(1, 'rgba(30,40,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }, null);
const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
const shadowGeo = new THREE.PlaneGeometry(1, 1); shadowGeo.rotateX(-Math.PI / 2);
function blob(size) { const s = new THREE.Mesh(shadowGeo, shadowMat); s.scale.set(size, 1, size); s.position.y = 0.04; s.renderOrder = 2; return s; }
const glowTex = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 1, 32, 32, 31); gr.addColorStop(0, 'rgba(255,240,170,.95)'); gr.addColorStop(1, 'rgba(255,240,170,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }, null);
function glow(size) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false })); s.scale.set(size, size, 1); return s; }

Object.assign(RW, {
  THREE, isTouch, renderer, scene, camera, sun, SUN_DIR, timeU, FOG, FOG_NEAR, FOG_FAR,
  rnd, clamp, lerp, smooth01, smoothstep, wrapAngle, seeded, V3, UP, ZAX, Qe, mtx, mdir, hash3, vnoise3, R, RNG,
  canvasTex, ctex, wrapped, ell, strokes, shade, lam, INK, outlineMat, outlineSkinMat,
  cachedGeo, geoSphere, geoCyl, geoCone, geoBox, part, lathe, profileAt, latheY, skinnedLimb, bake, freeze,
  shadowTex, shadowMat, shadowGeo, blob, glowTex, glow
});
})();
