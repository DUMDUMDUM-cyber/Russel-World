// Russel World: day and night, stars, and the weather (sunny, cloudy, rain).
// The clock follows real time, so every device shows the same hour: one day in the game lasts 36 minutes.
(function () {
'use strict';
const RW = window.RW;
if (!RW || RW.failed || !RW.world) return;
const { THREE, scene, camera, isTouch, FOG, clamp, lerp, smoothstep } = RW;
const W = RW.world;

const DAY_MIN = 36;                       // real minutes for one whole day
const INDOOR = { burrow: 1, cave: 1 };    // no sky, no rain down there
const WEATHER_BLOCK = 7 * 60 * 1000;      // the weather can change every 7 real minutes

// ---------- the clock ----------
function gameMinutes(now) { return ((now || Date.now()) / 1000 * (1440 / (DAY_MIN * 60))) % 1440; }
function hhmm(m) { const h = Math.floor(m / 60), mm = Math.floor(m % 60); return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm; }
// night: 1 deep at night, 0 in the day; sunset: a warm glow at dawn and dusk
function nightOf(h) {
  if (h < 4.5 || h >= 20.5) return 1;
  if (h < 6.5) return 1 - smoothstep(4.5, 6.5, h);
  if (h >= 18.5) return smoothstep(18.5, 20.5, h);
  return 0;
}
function sunsetOf(h) { const b = (c) => Math.max(0, 1 - Math.abs(h - c) / 1.1); return Math.max(b(5.6), b(19.2)); }

// ---------- weather: the same for everyone, picked from the time ----------
function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function weatherAt(now) { const r = hash(Math.floor(now / WEATHER_BLOCK)); return r < 0.24 ? 'rain' : r < 0.5 ? 'cloudy' : 'sunny'; }

// ---------- what we tint ----------
let hemi = null, skyMat = null;
scene.traverse((o) => { if (o.isHemisphereLight) hemi = o; if (o.material && o.material.uniforms && o.material.uniforms.top && o.material.uniforms.mid) skyMat = o.material; });
const base = { map: null, fog: new THREE.Color(), sun: 0.55, hemi: hemi ? hemi.intensity : 0.68, hemiCol: hemi ? hemi.color.clone() : new THREE.Color(0xffffff) };
const SKY_DAY = { top: new THREE.Color(0x6aa6dc), mid: new THREE.Color(0xa8cfe8) };
const SKY_NIGHT = { top: new THREE.Color(0x0d1636), mid: new THREE.Color(0x2b3a6a) };
const NIGHT_FOG = new THREE.Color(0x1d2846), SUNSET = new THREE.Color(0xf2a77c), RAIN_FOG = new THREE.Color(0x8d98a6);
const MOON_HEMI = new THREE.Color(0xa9b8ff);
const tc = new THREE.Color();

// stars on a big dome that follows the camera
const stars = (() => {
  const n = isTouch ? 260 : 420, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = Math.random() * Math.PI * 2, v = 0.12 + Math.random() * 0.88, r = 880, c = Math.sqrt(1 - v * v);
    pos[i * 3] = Math.cos(u) * c * r; pos[i * 3 + 1] = v * r; pos[i * 3 + 2] = Math.sin(u) * c * r;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ color: 0xfff6d8, size: 2.4, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
  const p = new THREE.Points(g, m); p.renderOrder = -9; p.frustumCulled = false; scene.add(p); return p;
})();
// a round moon
const moon = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 20, 64, 64, 64); gr.addColorStop(0, 'rgba(255,250,225,1)'); gr.addColorStop(0.42, 'rgba(255,248,215,1)'); gr.addColorStop(0.5, 'rgba(255,240,200,.35)'); gr.addColorStop(1, 'rgba(255,240,200,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  g.fillStyle = 'rgba(220,210,180,.55)'; for (const [x, y, r] of [[52, 54, 7], [74, 70, 5], [60, 78, 4]]) { g.beginPath(); g.arc(x, y, r, 0, 6.28); g.fill(); }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, opacity: 0, fog: false, depthWrite: false }));
  s.scale.set(110, 110, 1); s.renderOrder = -8; scene.add(s); return s;
})();
// rain: short falling lines in a box around the camera
const RAIN_N = isTouch ? 520 : 1100, RBOX = 34;
const rain = (() => {
  const pos = new Float32Array(RAIN_N * 6), drops = [];
  for (let i = 0; i < RAIN_N; i++) drops.push({ x: (Math.random() - 0.5) * RBOX * 2, y: Math.random() * 26, z: (Math.random() - 0.5) * RBOX * 2, s: 22 + Math.random() * 8 });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.LineBasicMaterial({ color: 0xd8e6f2, transparent: true, opacity: 0, depthWrite: false });
  const l = new THREE.LineSegments(g, m); l.frustumCulled = false; l.visible = false; scene.add(l);
  return { l, g, drops, pos };
})();
const splashes = [];

// ---------- the clock chip under the minimap ----------
const areaEl = document.querySelector('#mapbox .area'), clockEl = document.createElement('span');
clockEl.id = 'clockTxt'; clockEl.className = 'clk';
if (areaEl) areaEl.appendChild(clockEl);
const SUN_SVG = areaEl ? areaEl.querySelector('svg').innerHTML : '';
const MOON_SVG = '<path d="M15.5 3.5 A8.5 8.5 0 1 0 20.5 15 A7 7 0 1 1 15.5 3.5 Z" fill="#fff1b8" stroke="#3b2a1e" stroke-width="1.5" stroke-linejoin="round"/>';
const RAIN_SVG = '<path d="M7 14 A4 4 0 0 1 7.5 6.2 A5 5 0 0 1 17 7 A3.6 3.6 0 0 1 17 14 Z" fill="#e8eef5" stroke="#3b2a1e" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 17 L7 20 M12 17 L11 20 M16 17 L15 20" stroke="#7fb6e6" stroke-width="2" stroke-linecap="round"/>';
let iconNow = 'sun';
function setIcon(k) { if (!areaEl || k === iconNow) return; iconNow = k; areaEl.querySelector('svg').innerHTML = k === 'moon' ? MOON_SVG : k === 'rain' ? RAIN_SVG : SUN_SVG; }

// ---------- state ----------
let wet = 0, cloudy = 0, lastWeather = null, uiT = 0, nightNow = 0;
const S = { minutes: 0, hour: 0, night: 0, weather: 'sunny', forced: null, forcedHour: null };

function capture() {
  base.map = W.active; base.fog.copy(FOG); base.sun = RW.sun.intensity;
}
function apply(dt) {
  const now = Date.now();
  S.minutes = S.forcedHour != null ? S.forcedHour * 60 : gameMinutes(now);
  S.hour = S.minutes / 60;
  const want = S.forced || weatherAt(now);
  S.weather = want;
  if (W.active !== base.map) capture();
  const indoor = !!INDOOR[W.active];
  const n = indoor ? 0 : nightOf(S.hour), ss = indoor ? 0 : sunsetOf(S.hour) * (1 - n * 0.5);
  nightNow = n; S.night = n;
  // weather fades in and out slowly
  const tw = indoor ? 0 : want === 'rain' ? 1 : 0, tcl = indoor ? 0 : want === 'sunny' ? 0 : 1;
  wet += (tw - wet) * Math.min(1, dt * 0.35); cloudy += (tcl - cloudy) * Math.min(1, dt * 0.35);
  if (!indoor) {
    tc.copy(base.fog).lerp(NIGHT_FOG, n * 0.82).lerp(SUNSET, ss * 0.32).lerp(RAIN_FOG, Math.max(wet * 0.45, cloudy * 0.18) * (1 - n * 0.6));
    FOG.copy(tc); scene.fog.color.copy(tc); scene.background.copy(tc);
    RW.sun.intensity = base.sun * (1 - 0.6 * n) * (1 - 0.3 * Math.max(wet, cloudy * 0.6));
    if (hemi) { hemi.intensity = base.hemi * (1 - 0.38 * n); hemi.color.copy(base.hemiCol).lerp(MOON_HEMI, n * 0.6); }
    if (skyMat) {
      skyMat.uniforms.top.value.copy(SKY_DAY.top).lerp(SKY_NIGHT.top, n).lerp(RAIN_FOG, wet * 0.5 * (1 - n));
      skyMat.uniforms.mid.value.copy(SKY_DAY.mid).lerp(SUNSET, ss * 0.7).lerp(SKY_NIGHT.mid, n).lerp(RAIN_FOG, wet * 0.5 * (1 - n));
    }
  } else if (hemi) { hemi.intensity = base.hemi; hemi.color.copy(base.hemiCol); }
  // stars and moon
  stars.position.copy(camera.position); stars.visible = !indoor && n > 0.02;
  stars.material.opacity = n * (1 - wet * 0.85) * 0.95;
  moon.visible = stars.visible;
  const ma = (S.hour + 6) / 24 * Math.PI * 2;
  moon.position.set(camera.position.x - 380, camera.position.y + 260 + Math.sin(ma) * 80, camera.position.z - 600);
  moon.material.opacity = n * (1 - wet * 0.8);
  // rain
  updateRain(dt, indoor);
  // the chip
  uiT -= dt;
  if (uiT <= 0) {
    uiT = 0.5;
    clockEl.textContent = indoor ? '' : ' · ' + hhmm(S.minutes);
    setIcon(indoor ? 'sun' : wet > 0.5 ? 'rain' : n > 0.5 ? 'moon' : 'sun');
    if (lastWeather !== null && want !== lastWeather && !indoor && RW.debug && RW.debug.P && RW.UI && RW.UI.toast) {
      if (want === 'rain') RW.UI.toast('It starts to rain. Pitter-patter...');
      else if (lastWeather === 'rain') RW.UI.toast('The rain stops. The air smells fresh!');
    }
    lastWeather = want;
  }
}
function updateRain(dt, indoor) {
  const show = !indoor && wet > 0.03;
  rain.l.visible = show;
  if (!show) return;
  rain.l.material.opacity = 0.55 * wet;
  const cx = camera.position.x, cz = camera.position.z, gy = W.height(cx, cz), P = rain.pos, count = Math.floor(RAIN_N * wet);
  for (let i = 0; i < RAIN_N; i++) {
    const d = rain.drops[i];
    d.y -= d.s * dt;
    if (d.y < 0) { d.y = 20 + Math.random() * 8; d.x = (Math.random() - 0.5) * RBOX * 2; d.z = (Math.random() - 0.5) * RBOX * 2; }
    const on = i < count, x = cx + d.x, z = cz + d.z, y = gy + d.y;
    const k = i * 6;
    if (!on) { P[k] = P[k + 3] = x; P[k + 1] = P[k + 4] = -999; P[k + 2] = P[k + 5] = z; continue; }
    P[k] = x; P[k + 1] = y; P[k + 2] = z; P[k + 3] = x + 0.08; P[k + 4] = y + 0.9; P[k + 5] = z + 0.05;
  }
  rain.g.attributes.position.needsUpdate = true;
}

// hook into the world's frame update (the game calls RW.world.update every frame, also on the title screen)
const baseUpdate = W.update;
W.update = function (dt, time) { baseUpdate(dt, time); try { apply(dt); } catch (e) { console.error(e); } };
capture();

RW.sky = {
  get hour() { return S.hour; }, get night() { return S.night; }, get weather() { return S.weather; },
  isNight: () => S.night > 0.5, isRaining: () => wet > 0.5,
  clock: () => hhmm(S.minutes),
  debugSet(o) { if ('hour' in o) S.forcedHour = o.hour; if ('weather' in o) S.forced = o.weather; }
};
})();
