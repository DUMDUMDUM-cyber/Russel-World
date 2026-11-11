// Russel World: the world. Every area is its own map, far apart in the same space, and only the one you stand in is shown:
// Mossbrook + Sunny Meadow (built at start), Breezy Hills to the north and Whisperwood to the west (built the first time you go there).
// Gates at the edges of each map take you to the next one.
(function () {
'use strict';
const RW = window.RW;
if (RW.failed) return;
const { THREE, scene, camera, isTouch, SUN_DIR, timeU, FOG, FOG_NEAR, FOG_FAR, clamp, lerp, smooth01, smoothstep, V3, ZAX, mtx, mdir, hash3, vnoise3, R, canvasTex, ctex, wrapped, strokes, lam, cachedGeo, geoSphere, geoCyl, geoCone, geoBox, part, bake, freeze, blob, glow, rockTex } = RW;

// ---------- layout ----------
const TOWN = { x: 0, z: 0, r: 44, fence: 40, gate: 4.6, level: 0.3 };
const MEADOW = { x: 0, z: -212, ax: 195, az: 172 };
const PONDS = [{ x: -92, z: -142, r: 13 }, { x: 112, z: -268, r: 9 }];
const HILLS = [[95, -150, 30, 5], [-110, -275, 36, 6], [60, -335, 26, 4], [-150, -150, 24, 3.5], [150, -305, 28, 5], [-40, -180, 22, 2.5]];
const SPAWN = { x: 0, z: 10, face: Math.PI };
const GARDEN = { x: 36, z: -68, w: 22, d: 15 };
// Breezy Hills: big rolling hills, the windmill on the tallest one in the middle-east
const HMAP = { x: 0, z: -830, ax: 175, az: 165 };
const WINDMILL = { x: 72, z: -892, face: -0.46 };
const HBUMPS = [[72, -892, 30, 12], [-84, -758, 40, 8], [104, -726, 30, 6], [-112, -930, 36, 11], [12, -962, 26, 6], [138, -958, 28, 8], [-30, -838, 24, 4], [150, -820, 24, 5], [-150, -808, 22, 4], [40, -770, 20, 2.5]];
// Whisperwood: gentle forest floor, a pond of glowing lilies and the hermit's hollow tree
const WMAP = { x: -560, z: -540, ax: 170, az: 190 };
const HOLLOW = { x: -604, z: -566, face: 1.04 };
const STASH = { x: -652, z: -672 };
const WISPS = [{ x: -606, z: -590 }, { x: -620, z: -614 }, { x: -636, z: -634 }, { x: -648, z: -652 }, { x: -651, z: -664 }];
const WPONDS = [{ x: -650, z: -526, r: 8 }];
const BURROW_DOOR = { x: -492, z: -612 }; // Rootling Burrow: a hole under big roots, facing east toward the path
// Riverside (delivery 8): a winding river with two bridges, an old watermill and a fishing dock
const RMAP = { x: 900, z: -300, ax: 160, az: 170 };
const RIVER_PTS = [[938, -520], [918, -444], [948, -380], [928, -318], [893, -258], [906, -200], [938, -146], [926, -70]];
const RIVER_W = 5.5, RIVER_BANK = 0.9, RIVER_WL = RIVER_BANK - 0.45;
// Thornbush (delivery 8): rocky ground, bramble thickets, beehives, and the sealed door of Pebble Cave in the north
const TMAP = { x: 900, z: -900, ax: 160, az: 160 };
const CAVE = { x: 905, z: -1036 };
const TBUMPS = [[820, -820, 30, 5], [990, -860, 36, 7], [850, -985, 28, 6], [1005, -990, 26, 8], [780, -960, 24, 4], [960, -780, 22, 3]];
// Rootling Burrow (delivery 8): round rooms joined by short tunnels, the Old Rootling waits in the last one
const BROOMS = [[1500, -150, 11], [1500, -198, 13], [1546, -248, 13], [1500, -322, 19]];
const BHALLS = [[1500, -150, 1500, -198, 3.2], [1500, -198, 1546, -248, 3.2], [1546, -248, 1500, -322, 3.4]];
const BOSS_ROOM = { x: 1500, z: -322, r: 19 };
// Pebble Cave (delivery 9): an entry room, the torch hall, the button hall, the boulder room and the King's hall
const CROOMS = [[1500, -640, 11], [1500, -695, 15], [1548, -742, 13], [1500, -792, 12], [1500, -852, 21]];
const CHALLS = [[1500, -640, 1500, -695, 3.2], [1500, -695, 1548, -742, 3.2], [1548, -742, 1500, -792, 3.2], [1500, -792, 1500, -852, 3.6]];
const KING_ROOM = { x: 1500, z: -852, r: 21 };
// stone doors that sink into the floor once their puzzle is solved: one in each of the last three tunnels
const CAVE_DOORS = [
  { id: 'torch', x: 1524, z: -718.5, r: 4.2, open: false },
  { id: 'buttons', x: 1524, z: -767, r: 4.2, open: false },
  { id: 'boulder', x: 1500, z: -822, r: 4.4, open: false }
];
const CAVE_PUZ = {
  torches: [[1492.6, -687.6], [1507.4, -687.6], [1507.4, -702.4], [1492.6, -702.4]],
  buttons: [{ sym: 'leaf', x: 1548, z: -735.5 }, { sym: 'shroom', x: 1542.4, z: -745.2 }, { sym: 'pebble', x: 1553.6, z: -745.2 }],
  tablet: { x: 1548, z: -750.5 },
  boulder: { x: 1494.5, z: -787 }, plate: { x: 1505.5, z: -798 }, room: { x: 1500, z: -792, r: 8.6 }
};
const caveBlock = []; // things that block the cave floor right now: closed doors and the boulder, {x, z, r}

function superEdge(x, z, M) { const nx = (x - M.x) / M.ax, nz = (z - M.z) / M.az; return (Math.pow(nx * nx * nx * nx + nz * nz * nz * nz, 0.25) - 1) * 170; }
function rimRise(x, z, d, amp) { return d > -4 ? Math.pow(smoothstep(-4, 48, d), 1.15) * amp * (0.7 + 0.55 * vnoise3(x * 0.03, 0.5, z * 0.03)) : 0; }
function pondCarve(h, x, z, ponds) {
  for (const p of ponds) {
    const dp = Math.hypot(x - p.x, z - p.z);
    if (dp < p.r + 8) h = lerp(h, p.base, smoothstep(p.r + 8, p.r + 2, dp));
    if (dp < p.r + 3) h -= smooth01(clamp(1 - dp / (p.r + 3), 0, 1)) * 1.5;
  }
  return h;
}
// --- Mossbrook and Sunny Meadow
function baseH(x, z) {
  let h = Math.sin(x * 0.03) * Math.cos(z * 0.027) * 1.2 + Math.sin(x * 0.08 + 1.3) * Math.sin(z * 0.07) * 0.5;
  for (const [hx, hz, r, hh] of HILLS) { const d2 = (x - hx) * (x - hx) + (z - hz) * (z - hz); h += hh * Math.exp(-d2 / (r * r)); }
  return h;
}
// town and meadow overlap at the north gate: a spot inside both is deep inside the map, not near its edge
function edgeMeadow(x, z) { const dT = Math.hypot(x - TOWN.x, z - TOWN.z) - TOWN.r, dM = superEdge(x, z, MEADOW); return dT < 0 && dM < 0 ? dT + dM : Math.min(dT, dM); }
function dryMeadow(x, z) {
  let h = baseH(x, z);
  const rT = Math.hypot(x, z);
  if (rT < 60) h = lerp(h, TOWN.level, smoothstep(58, 36, rT));
  return h + rimRise(x, z, edgeMeadow(x, z), 36);
}
for (const p of PONDS) { p.base = dryMeadow(p.x, p.z); p.level = p.base - 0.35; }
function heightMeadow(x, z) { return pondCarve(dryMeadow(x, z), x, z, PONDS); }
function inTown(x, z) { return Math.hypot(x - TOWN.x, z - TOWN.z) < TOWN.fence + 1; }
// a point is walkable if it is inside the map, not in a pond, and not on the town fence (except the gate)
function walkMeadow(x, z, monster) {
  if (edgeMeadow(x, z) > -3) return false;
  for (const p of PONDS) if (Math.hypot(x - p.x, z - p.z) < p.r + 0.6) return false;
  const rT = Math.hypot(x, z);
  if (rT > TOWN.fence - 1.3 && rT < TOWN.fence + 1.3 && !(Math.abs(x) < TOWN.gate && z < 0)) return false;
  if (monster && rT < TOWN.fence + 4) return false;
  return true;
}
// --- Breezy Hills
const windTop = (() => { let h = 0; for (const [hx, hz, r, hh] of HBUMPS) h += hh * Math.exp(-((WINDMILL.x - hx) ** 2 + (WINDMILL.z - hz) ** 2) / (r * r)); return h; })();
function edgeHills(x, z) { return superEdge(x, z, HMAP); }
function heightHills(x, z) {
  let h = Math.sin(x * 0.025 + 0.7) * Math.cos(z * 0.022) * 1.8 + Math.sin(x * 0.07 + 2.1) * Math.sin(z * 0.06 + 0.4) * 0.6;
  for (const [hx, hz, r, hh] of HBUMPS) { const d2 = (x - hx) * (x - hx) + (z - hz) * (z - hz); h += hh * Math.exp(-d2 / (r * r)); }
  const dw = Math.hypot(x - WINDMILL.x, z - WINDMILL.z);
  if (dw < 11) h = lerp(h, windTop + 1.4, smoothstep(11, 6, dw));
  return h + rimRise(x, z, edgeHills(x, z), 40);
}
function walkHills(x, z) { return edgeHills(x, z) <= -3; }
// --- Whisperwood
function edgeWood(x, z) { return superEdge(x, z, WMAP); }
function dryWood(x, z) {
  let h = Math.sin(x * 0.04 + 1.1) * Math.cos(z * 0.035) * 1.0 + Math.sin(x * 0.11) * Math.sin(z * 0.09 + 0.6) * 0.35 + vnoise3(x * 0.05, 1.7, z * 0.05) * 1.2;
  const dh = Math.hypot(x - HOLLOW.x, z - HOLLOW.z); if (dh < 16) h = lerp(h, 0.6, smoothstep(16, 8, dh));
  const ds = Math.hypot(x - STASH.x, z - STASH.z); if (ds < 12) h = lerp(h, 0.4, smoothstep(12, 6, ds));
  return h + rimRise(x, z, edgeWood(x, z), 30);
}
for (const p of WPONDS) { p.base = dryWood(p.x, p.z); p.level = p.base - 0.35; }
function heightWood(x, z) { return pondCarve(dryWood(x, z), x, z, WPONDS); }
function walkWood(x, z) {
  if (edgeWood(x, z) > -3) return false;
  for (const p of WPONDS) if (Math.hypot(x - p.x, z - p.z) < p.r + 0.6) return false;
  return true;
}
// --- Riverside: the river runs north to south, so its middle can be looked up by z (one entry per metre)
const riverCurve = new THREE.CatmullRomCurve3(RIVER_PTS.map(([x, z]) => V3(x, 0, z)));
const RIVER_Z0 = -520, RIVER_N = 450, RIVER_X = new Float32Array(RIVER_N + 2), RIVER_K = new Float32Array(RIVER_N + 2);
{
  const S = riverCurve.getSpacedPoints(600);
  for (let i = 0; i < 600; i++) {
    const a = S[i], b = S[i + 1], dz = (b.z - a.z) || 1e-6, sl = (b.x - a.x) / dz;
    for (let z = Math.ceil(a.z); z <= b.z; z++) { const k = z - RIVER_Z0; if (k >= 0 && k <= RIVER_N) { RIVER_X[k] = a.x + (b.x - a.x) * ((z - a.z) / dz); RIVER_K[k] = 1 / Math.sqrt(1 + sl * sl); } }
  }
  RIVER_X[RIVER_N + 1] = RIVER_X[RIVER_N]; RIVER_K[RIVER_N + 1] = RIVER_K[RIVER_N];
}
function riverCx(z) { const k = clamp(z - RIVER_Z0, 0, RIVER_N), i = Math.floor(k), f = k - i; return RIVER_X[i] + (RIVER_X[i + 1] - RIVER_X[i]) * f; }
function riverDist(x, z) { return Math.abs(x - riverCx(z)) * RIVER_K[clamp(Math.round(z - RIVER_Z0), 0, RIVER_N)]; }
const BRIDGES = [-376, -236].map((z) => ({ x: riverCx(z), z, hl: RIVER_W + 3.4, hw: 1.9 }));
function onBridge(x, z) { for (const b of BRIDGES) if (Math.abs(z - b.z) < b.hw && Math.abs(x - b.x) < b.hl) return b; return null; }
const bridgeY = (b, x) => { const u = (x - b.x) / b.hl; return RIVER_BANK + 0.3 + (1 - u * u) * 0.9; };
function edgeRiver(x, z) { return superEdge(x, z, RMAP); }
function dryRiver(x, z) {
  let h = Math.sin(x * 0.028 + 0.4) * Math.cos(z * 0.031) * 1.6 + Math.sin(x * 0.09 + 1.7) * Math.sin(z * 0.08) * 0.4 + vnoise3(x * 0.04, 2.3, z * 0.04) * 0.8;
  const dr = riverDist(x, z);
  if (dr < RIVER_W + 14) h = lerp(h, RIVER_BANK, smoothstep(RIVER_W + 14, RIVER_W + 3, dr));
  if (dr < RIVER_W + 1.5) h -= smooth01(clamp(1 - (dr - 1) / (RIVER_W + 0.5), 0, 1)) * 1.9;
  return h + rimRise(x, z, edgeRiver(x, z), 34);
}
function heightRiver(x, z) { const h = dryRiver(x, z), b = onBridge(x, z); return b ? Math.max(h, bridgeY(b, x)) : h; }
function walkRiver(x, z) { if (edgeRiver(x, z) > -3) return false; return !(riverDist(x, z) < RIVER_W + 0.3 && !onBridge(x, z)); }
// the old watermill on the west bank (its wheel dips into the river), and the fishing dock on the east bank
const MILL = { x: riverCx(-300) - RIVER_W - 0.6, z: -300 };
const DOCK = { x: riverCx(-418) + RIVER_W + 1.2, z: -418 };
// --- Thornbush
function edgeThorn(x, z) { return superEdge(x, z, TMAP); }
function heightThorn(x, z) {
  let h = Math.sin(x * 0.033 + 0.2) * Math.cos(z * 0.029 + 0.5) * 1.4 + vnoise3(x * 0.05, 4.1, z * 0.05) * 1.4;
  for (const [hx, hz, r, hh] of TBUMPS) { const d2 = (x - hx) * (x - hx) + (z - hz) * (z - hz); h += hh * Math.exp(-d2 / (r * r)); }
  const dc = Math.hypot(x - CAVE.x, z - (CAVE.z + 7)); if (dc < 15) h = lerp(h, 1.0, smoothstep(15, 7, dc));
  return h + rimRise(x, z, edgeThorn(x, z), 38);
}
function walkThorn(x, z) { return edgeThorn(x, z) <= -3; }
// --- Rootling Burrow: the distance to the nearest room or tunnel wall (inside is below zero)
function edgeBurrow(x, z) {
  let d = 1e9;
  for (const [cx, cz, r] of BROOMS) d = Math.min(d, Math.hypot(x - cx, z - cz) - r);
  for (const [ax, az, bx, bz, w] of BHALLS) { const dx = bx - ax, dz = bz - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1); d = Math.min(d, Math.hypot(x - ax - dx * t, z - az - dz * t) - w); }
  return d + vnoise3(x * 0.15, 7.7, z * 0.15) * 1.6 - 0.8;
}
function heightBurrow(x, z) { const d = edgeBurrow(x, z); let h = vnoise3(x * 0.08, 3.3, z * 0.08) * 0.5; if (d > -1.5) h += Math.min(15, Math.pow(d + 1.5, 1.3) * 2.2); return h; }
function walkBurrow(x, z) { return edgeBurrow(x, z) <= -1.2; }
function edgeCave(x, z) {
  let d = 1e9;
  for (const [cx, cz, r] of CROOMS) d = Math.min(d, Math.hypot(x - cx, z - cz) - r);
  for (const [ax, az, bx, bz, w] of CHALLS) { const dx = bx - ax, dz = bz - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1); d = Math.min(d, Math.hypot(x - ax - dx * t, z - az - dz * t) - w); }
  return d + vnoise3(x * 0.13, 9.1, z * 0.13) * 1.4 - 0.7;
}
function heightCave(x, z) { const d = edgeCave(x, z); let h = vnoise3(x * 0.07, 4.4, z * 0.07) * 0.45; if (d > -1.5) h += Math.min(16, Math.pow(d + 1.5, 1.3) * 2.4); return h; }
function walkCave(x, z) {
  if (edgeCave(x, z) > -1.2) return false;
  for (const b of caveBlock) if (Math.abs(x - b.x) < b.r && Math.abs(z - b.z) < b.r && Math.hypot(x - b.x, z - b.z) < b.r) return false;
  return true;
}
// --- one set of functions for the whole world: each point belongs to the map whose space it is in
// v1.4: Chapter 2 and 3 lands live far to the west (x < -1200); lands.js adds them with RW.world.addLand
const LANDS = [];
function landAt(x, z) {
  let best = null, bd = 1e12;
  for (const L of LANDS) { if (Math.abs(x - L.cx) <= L.half && Math.abs(z - L.cz) <= L.half) return L.id; const d = (x - L.cx) ** 2 + (z - L.cz) ** 2; if (d < bd) { bd = d; best = L.id; } }
  return best || 'wood';
}
function mapAt(x, z) { return x < -1200 ? landAt(x, z) : x > 1300 ? (z < -560 ? 'cave' : 'burrow') : x > 600 ? (z < -620 ? 'thorn' : 'river') : x < -325 ? 'wood' : z < -535 ? 'hills' : 'meadow'; }
const HEIGHT = { meadow: heightMeadow, hills: heightHills, wood: heightWood, river: heightRiver, thorn: heightThorn, burrow: heightBurrow, cave: heightCave };
const EDGE = { meadow: edgeMeadow, hills: edgeHills, wood: edgeWood, river: edgeRiver, thorn: edgeThorn, burrow: edgeBurrow, cave: edgeCave };
const WALK = { meadow: walkMeadow, hills: walkHills, wood: walkWood, river: walkRiver, thorn: walkThorn, burrow: walkBurrow, cave: walkCave };
function height(x, z) { return HEIGHT[mapAt(x, z)](x, z); }
function edgeDist(x, z) { return EDGE[mapAt(x, z)](x, z); }
function walkable(x, z, monster) { return WALK[mapAt(x, z)](x, z, monster); }
function zoneAt(x, z) { const m = mapAt(x, z); return m !== 'meadow' ? m : Math.hypot(x, z) < TOWN.fence + 2 ? 'town' : 'meadow'; }

// ---------- gates: walk into one and you travel to the next area ----------
// [id, map, x, z, to map, arrive x, z, face, sign]
const GATES = [
  { id: 'm_n', map: 'meadow', x: 0, z: -377, to: 'hills', tx: 0, tz: -684, face: Math.PI, sign: 'BREEZY HILLS' },
  { id: 'm_w', map: 'meadow', x: -187, z: -242, to: 'wood', tx: -410, tz: -470, face: -Math.PI / 2, sign: 'WHISPERWOOD' },
  { id: 'h_s', map: 'hills', x: 0, z: -670, to: 'meadow', tx: 0, tz: -365, face: 0, sign: 'SUNNY MEADOW' },
  { id: 'h_w', map: 'hills', x: -166, z: -860, to: 'wood', tx: -520, tz: -709, face: 0, sign: 'WHISPERWOOD' },
  { id: 'w_e', map: 'wood', x: -397, z: -470, to: 'meadow', tx: -175, tz: -242, face: Math.PI / 2, sign: 'SUNNY MEADOW' },
  { id: 'w_n', map: 'wood', x: -520, z: -723, to: 'hills', tx: -154, tz: -860, face: Math.PI / 2, sign: 'BREEZY HILLS' },
  // delivery 8: Riverside (from the meadow's east road and Whisperwood's south edge), Thornbush past the river, the burrow under the roots
  { id: 'm_e', map: 'meadow', x: 186, z: -140, to: 'river', tx: 762, tz: -300, face: Math.PI / 2, sign: 'RIVERSIDE' },
  { id: 'w_s', map: 'wood', x: -600, z: -359, to: 'river', tx: 870, tz: -448, face: 0, sign: 'RIVERSIDE' },
  { id: 'r_w', map: 'river', x: 747, z: -300, to: 'meadow', tx: 174, tz: -140, face: -Math.PI / 2, sign: 'SUNNY MEADOW' },
  { id: 'r_n', map: 'river', x: 870, z: -462, to: 'wood', tx: -600, tz: -372, face: Math.PI, sign: 'WHISPERWOOD' },
  { id: 'r_e', map: 'river', x: 1053, z: -300, to: 'thorn', tx: 762, tz: -900, face: Math.PI / 2, sign: 'THORNBUSH' },
  { id: 't_w', map: 'thorn', x: 747, z: -900, to: 'river', tx: 1038, tz: -300, face: -Math.PI / 2, sign: 'RIVERSIDE' },
  { id: 'w_b', map: 'wood', x: BURROW_DOOR.x + 2.6, z: BURROW_DOOR.z, to: 'burrow', tx: 1500, tz: -151, face: Math.PI, sign: '', hole: true },
  { id: 'b_out', map: 'burrow', x: 1500, z: -142, to: 'wood', tx: BURROW_DOOR.x + 8, tz: BURROW_DOOR.z, face: Math.PI / 2, sign: 'WHISPERWOOD' },
  // delivery 9: Pebble Cave, behind the rocks in the north of Thornbush (opens once Bolt clears them)
  { id: 't_c', map: 'thorn', x: CAVE.x, z: CAVE.z + 3, to: 'cave', tx: 1500, tz: -645, face: Math.PI, sign: '', hole: true, locked: () => !caveMouthOpen },
  { id: 'c_out', map: 'cave', x: 1500, z: -632, to: 'thorn', tx: CAVE.x, tz: CAVE.z + 9, face: 0, sign: 'THORNBUSH' }
];
let caveMouthOpen = false;
const gateById = (id) => GATES.find((g) => g.id === id);
// waystones (delivery 8): touch one once to wake it, then travel between awake stones for a few coins
const WAYSTONES = [
  { id: 'meadow', name: 'Mossbrook Gate', x: -14, z: -60 },
  { id: 'hills', name: 'Breezy Hills', x: -16, z: -700 },
  { id: 'wood', name: 'Whisperwood', x: -426, z: -456 },
  { id: 'river', name: 'Riverside', x: 772, z: -316 },
  { id: 'thorn', name: 'Thornbush', x: 772, z: -916 }
];
for (const w of WAYSTONES) w.map = mapAt(w.x, w.z);

// ---------- the map being built: each map collects its own pieces, then bakes them into a few meshes ----------
let root = null;
const MAPS = {};
let L, blobParts, treeDots, buildingDots, roads;
function beginMap(id, seed) {
  root = new THREE.Group(); scene.add(root);
  L = { wood: [], leaf: [], pine: [], rock: [] }; blobParts = []; treeDots = []; buildingDots = []; roads = [];
  if (seed) RW.RNG.R = RW.seeded(seed); // each new map draws from its own stream, so it looks the same every visit
  MAPS[id] = Object.assign(MAPS[id] || {}, { id, group: root, roads, treeDots, buildingDots });
}
beginMap('meadow');

// ---------- colliders on a coarse grid ----------
const colliders = [], grid = new Map(), CELL = 8;
function addCollider(x, z, r) {
  const c = { x, z, r }; colliders.push(c);
  const x0 = Math.floor((x - r) / CELL), x1 = Math.floor((x + r) / CELL), z0 = Math.floor((z - r) / CELL), z1 = Math.floor((z + r) / CELL);
  for (let i = x0; i <= x1; i++) for (let k = z0; k <= z1; k++) { const key = i + ',' + k; let l = grid.get(key); if (!l) { l = []; grid.set(key, l); } l.push(c); }
  return c;
}
function removeCollider(c) {
  const i = colliders.indexOf(c); if (i < 0) return; colliders.splice(i, 1);
  for (const l of grid.values()) { const k = l.indexOf(c); if (k >= 0) l.splice(k, 1); }
}
function collide(p, r) {
  const cx = Math.floor(p.x / CELL), cz = Math.floor(p.z / CELL);
  for (let i = cx - 1; i <= cx + 1; i++) for (let k = cz - 1; k <= cz + 1; k++) {
    const l = grid.get(i + ',' + k); if (!l) continue;
    for (const c of l) { const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), min = c.r + r; if (d < min && d > 0.0001) { p.x = c.x + (dx / d) * min; p.z = c.z + (dz / d) * min; } }
  }
}
for (const w of WAYSTONES) addCollider(w.x, w.z, 0.95);
addCollider(BURROW_DOOR.x - 0.6, BURROW_DOOR.z, 2.4);
// move p toward (nx, nz), sliding along walls
function tryMove(p, nx, nz, monster) {
  if (walkable(nx, nz, monster)) { p.x = nx; p.z = nz; return true; }
  if (walkable(nx, p.z, monster)) { p.x = nx; return true; }
  if (walkable(p.x, nz, monster)) { p.z = nz; return true; }
  return false;
}
// ray to ground by marching along the height field
function groundRay(ray) {
  const o = ray.origin, d = ray.direction;
  let prevT = 0, t = 0;
  for (let i = 0; i < 400; i++) {
    t += i < 60 ? 0.5 : 1.5;
    const x = o.x + d.x * t, y = o.y + d.y * t, z = o.z + d.z * t;
    if (y < height(x, z)) {
      let a = prevT, b = t;
      for (let k = 0; k < 12; k++) { const m = (a + b) / 2, mx = o.x + d.x * m, my = o.y + d.y * m, mz = o.z + d.z * m; if (my < height(mx, mz)) b = m; else a = m; }
      return V3(o.x + d.x * b, o.y + d.y * b, o.z + d.z * b);
    }
    prevT = t;
  }
  return null;
}

// ---------- textures ----------
const grassTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#6f9f45'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 30; i++) { const x = R() * w, y = R() * h, r = 10 + R() * 34, c = i % 3 === 0 ? '#5c8a3a' : i % 3 === 1 ? '#82b153' : '#8a8a4a'; wrapped(w, h, (ox, oy) => { g.globalAlpha = 0.13; g.fillStyle = c; g.beginPath(); g.arc(x + ox, y + oy, r, 0, Math.PI * 2); g.fill(); }); }
  strokes(g, w, h, 1500, ['#5f8f3b', '#7fae4f', '#6a9a42', '#8dbb5c', '#557f34', '#9cc468'], 7, 1.3, 0.75, R);
  for (let i = 0; i < 60; i++) { const x = R() * w, y = R() * h; g.globalAlpha = 0.35; g.fillStyle = '#8b7a52'; g.fillRect(x, y, 2, 2); }
  g.globalAlpha = 1;
}, [150, 150]);
// cave floor: grey-violet stone with pebbles and cracks
const caveFloorTex =canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#8a8790'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) { const x = R() * w, y = R() * h, r = 8 + R() * 30, c = ['#77747e', '#9a97a0', '#827e8a'][i % 3]; wrapped(w, h, (ox, oy) => { g.globalAlpha = 0.25; g.fillStyle = c; g.beginPath(); g.arc(x + ox, y + oy, r, 0, Math.PI * 2); g.fill(); }); }
  g.globalAlpha = 0.5; g.strokeStyle = '#5e5b66'; g.lineWidth = 1.5;
  for (let i = 0; i < 14; i++) { let x = R() * w, y = R() * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (R() - 0.5) * 30; y += (R() - 0.5) * 30; g.lineTo(x, y); } g.stroke(); }
  for (let i = 0; i < 90; i++) { g.globalAlpha = 0.5; g.fillStyle = R() < 0.5 ? '#a8a5ae' : '#6a6772'; g.beginPath(); g.arc(R() * w, R() * h, 1 + R() * 2.5, 0, 6.28); g.fill(); }
  g.globalAlpha = 1;
}, [150, 150]);
const barkTex = canvasTex(128, 256, (g, w, h) => {
  g.fillStyle = '#6b4a30'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) { const x = R() * w, c = i % 3 ? '#4e3522' : '#87603e', lw = 1.5 + R() * 3; wrapped(w, h, (ox) => { g.strokeStyle = c; g.globalAlpha = 0.7; g.lineWidth = lw; g.beginPath(); g.moveTo(x + ox, 0); for (let y = 0; y <= h; y += 16) g.lineTo(x + ox + Math.sin(y * 0.05 + i) * 3, y); g.stroke(); }); }
  g.globalAlpha = 1;
}, [2, 2]);
const leafTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#5aa63e'; g.fillRect(0, 0, w, h); const cols = ['#4c9636', '#6bb84a', '#7cc657', '#55a03a']; for (let i = 0; i < 70; i++) { const x = R() * w, y = R() * h, r = 10 + R() * 26, c = cols[i % 4]; wrapped(w, h, (ox, oy) => { g.globalAlpha = 0.28; g.fillStyle = c; g.beginPath(); g.arc(x + ox, y + oy, r, 0, Math.PI * 2); g.fill(); }); } g.globalAlpha = 1; }, [1, 1]);
const pineTex = canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#2f6b3a'; g.fillRect(0, 0, w, h); strokes(g, w, h, 600, ['#3f7f45', '#285c32', '#4f8f52', '#5a9a5a'], 9, 1.4, 0.9, R); }, [3, 2]);
const stoneTex = canvasTex(256, 256, (g, w, h) => {
  for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) { const e = Math.min(x, w - x) / (w / 2), a = clamp((e - 0.08) / 0.5, 0, 1) * 0.85; if (a > 0) { g.fillStyle = 'rgba(150,128,92,' + a.toFixed(3) + ')'; g.fillRect(x, y, 2, 2); } }
  const sc = ['#b7aa8d', '#a99c80', '#c2b597', '#9f9275', '#b0a385'];
  for (let row = 0; row < 11; row++) {
    const y = row * (h / 11) + 6, off = (row % 2) * 13;
    for (let x = 8 + off; x < w; x += 26 + R() * 5) {
      const e = Math.min(x, w - x) / (w / 2); if (R() > clamp(e * 2.2 - 0.1, 0, 1)) continue;
      const rx = 9.5 + R() * 3.5, ry = 7 + R() * 3, jx = (R() - 0.5) * 4, jy = (R() - 0.5) * 3, c = sc[Math.floor(R() * sc.length)];
      for (const oy of [-h, 0, h]) { g.fillStyle = c; g.strokeStyle = '#7d6e55'; g.lineWidth = 1.8; g.beginPath(); g.ellipse(x + jx, y + jy + oy, rx, ry, 0, 0, Math.PI * 2); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,.14)'; g.beginPath(); g.ellipse(x + jx - 2, y + jy + oy - 1.5, rx * 0.45, ry * 0.35, 0, 0, Math.PI * 2); g.fill(); }
    }
  }
}, null);
stoneTex.wrapT = THREE.RepeatWrapping;
const cobbleTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#a8976f'; g.fillRect(0, 0, w, h);
  const sc = ['#c9bb9c', '#bcad8e', '#d3c6a8', '#b3a383', '#c4b596'];
  for (let row = 0; row < 10; row++) for (let x = (row % 2) * 13; x < w + 26; x += 26) {
    const y = row * 25.6 + 12, c = sc[Math.floor(R() * sc.length)];
    wrapped(w, h, (ox, oy) => { g.fillStyle = c; g.strokeStyle = '#7d6e55'; g.lineWidth = 2; g.beginPath(); g.ellipse(x + ox, y + oy, 11, 9, 0, 0, Math.PI * 2); g.fill(); g.stroke(); });
  }
}, [9, 9]);
const woodTex = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#9a6a42'; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 32) { g.fillStyle = 'rgba(60,38,22,.55)'; g.fillRect(x, 0, 2, h); }
  for (let i = 0; i < 40; i++) { const x = R() * w; g.strokeStyle = R() < 0.5 ? 'rgba(70,45,25,.35)' : 'rgba(190,140,90,.3)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 4, h * 0.3, x - 4, h * 0.6, x + 2, h); g.stroke(); }
}, [1, 1]);
const wallTex = canvasTex(512, 256, (g, w, h) => {
  g.fillStyle = '#efe6d2'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 80; i++) { g.fillStyle = 'rgba(180,160,130,.12)'; g.beginPath(); g.arc(R() * w, R() * h * 0.6, 6 + R() * 20, 0, Math.PI * 2); g.fill(); }
  const sy = h * 0.62;
  g.fillStyle = '#a39d92'; g.fillRect(0, sy, w, h - sy);
  for (let y = sy, row = 0; y < h; y += 22, row++) for (let x = (row % 2) * 20 - 20; x < w; x += 40) { g.fillStyle = ['#b2ab9f', '#9b9489', '#aaa396'][Math.floor(R() * 3)]; g.strokeStyle = '#7a746a'; g.lineWidth = 2; g.beginPath(); g.rect(x + 1, y + 1, 38, 20); g.fill(); g.stroke(); }
  g.fillStyle = '#6b4a30'; g.fillRect(0, 0, w, 12); g.fillRect(0, sy - 12, w, 12);
  for (let x = 0; x <= w; x += 128) g.fillRect(x - 6, 0, 12, sy);
  g.strokeStyle = '#6b4a30'; g.lineWidth = 10;
  for (let x = 0; x < w; x += 128) { g.beginPath(); g.moveTo(x + 6, sy - 12); g.lineTo(x + 64, 12); g.moveTo(x + 122, sy - 12); g.lineTo(x + 64, 12); g.stroke(); }
}, null);
const stoneWallTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#9b958a'; g.fillRect(0, 0, w, h);
  for (let y = 0, row = 0; y < h; y += 28, row++) for (let x = (row % 2) * 24 - 24; x < w; x += 48) { g.fillStyle = ['#aaa396', '#948d82', '#b5aea1'][Math.floor(R() * 3)]; g.strokeStyle = '#6f695f'; g.lineWidth = 3; g.beginPath(); g.rect(x + 2, y + 2, 44, 24); g.fill(); g.stroke(); }
}, [1, 1]);
const roofTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#d9d9d9'; g.fillRect(0, 0, w, h);
  for (let y = 0, row = 0; y < h + 20; y += 26, row++) for (let x = (row % 2) * 16 - 16; x < w + 16; x += 32) {
    g.fillStyle = ['#e8e8e8', '#cfcfcf', '#dedede'][Math.floor(R() * 3)]; g.strokeStyle = '#8f8f8f'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + 32, y); g.lineTo(x + 32, y + 18); g.quadraticCurveTo(x + 16, y + 30, x, y + 18); g.closePath(); g.fill(); g.stroke();
  }
}, [3, 2]);
const tentTex = canvasTex(256, 64, (g, w, h) => { for (let x = 0; x < w; x += 32) { g.fillStyle = (x / 32) % 2 ? '#f3e7cf' : '#c8503e'; g.fillRect(x, 0, 32, h); } }, [1, 1]);
const awningTex = canvasTex(256, 64, (g, w, h) => { for (let x = 0; x < w; x += 32) { g.fillStyle = (x / 32) % 2 ? '#fff6e0' : '#e87f9a'; g.fillRect(x, 0, 32, h); } }, [1, 1]);
const barrelTex = canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#8f5f3a'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 16) { g.fillStyle = 'rgba(50,30,15,.5)'; g.fillRect(x, 0, 2, h); } g.fillStyle = '#4a4744'; g.fillRect(0, 18, w, 10); g.fillRect(0, h - 28, w, 10); }, [1, 1]);
const windowTex = canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#6b4a30'; g.fillRect(0, 0, w, h); g.fillStyle = '#9cc9e2'; g.fillRect(6, 6, w - 12, h - 12); g.fillStyle = '#6b4a30'; g.fillRect(w / 2 - 3, 0, 6, h); g.fillRect(0, h / 2 - 3, w, 6); g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(10, 10, 10, 6); }, null);
const soilTex = canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#7a5a3a'; g.fillRect(0, 0, w, h); for (let y = 8; y < h; y += 16) { g.fillStyle = '#5e4229'; g.fillRect(0, y, w, 5); g.fillStyle = '#8f6c48'; g.fillRect(0, y - 4, w, 3); } }, [3, 2]);

// ---------- ground ----------
function cloudShadowInject(mat, ponds) {
  const pd = (p) => p ? new THREE.Vector4(p.x, p.z, p.r, p.level) : new THREE.Vector4(1e5, 1e5, 0, -99);
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = timeU;
    sh.uniforms.pondA = { value: pd(ponds[0]) };
    sh.uniforms.pondB = { value: pd(ponds[1]) };
    sh.vertexShader = 'varying vec3 vWP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = 'uniform float uTime;\nuniform vec4 pondA;\nuniform vec4 pondB;\nvarying vec3 vWP;\nfloat hh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }\nfloat vn(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f); return mix(mix(hh(i), hh(i + vec2(1.0, 0.0)), u.x), mix(hh(i + vec2(0.0, 1.0)), hh(i + vec2(1.0, 1.0)), u.x), u.y); }\nfloat pondUnder(vec4 P){ return smoothstep(P.w + 0.04, P.w - 0.2, vWP.y) * step(distance(vWP.xz, P.xy), P.z + 3.0); }\n' +
      sh.fragmentShader.replace('#include <color_fragment>', [
        '#include <color_fragment>',
        ' vec2 cp = (vWP.xz + vec2(uTime * 2.2, uTime * 0.8)) * 0.02;',
        ' float cn = vn(cp) * 0.62 + vn(cp * 2.3) * 0.28 + vn(cp * 5.1) * 0.1;',
        ' diffuseColor.rgb *= mix(1.0, 0.74, smoothstep(0.52, 0.72, cn));',
        ' float under = max(pondUnder(pondA), pondUnder(pondB));',
        ' vec3 sand = vec3(0.72, 0.64, 0.47) * (0.85 + 0.25 * vn(vWP.xz * 1.7));',
        ' diffuseColor.rgb = mix(diffuseColor.rgb, sand, under * 0.9);',
        ' float ca = abs(sin(vWP.x * 2.3 + uTime * 1.1) * sin(vWP.z * 2.7 - uTime * 0.9) + sin((vWP.x + vWP.z) * 1.7 + uTime * 0.7) * 0.5);',
        ' diffuseColor.rgb += vec3(0.85, 1.0, 0.95) * pow(ca, 3.0) * 0.28 * under;'
      ].join('\n'));
  };
  mat.customProgramCacheKey = () => 'cloudshadow';
  return mat;
}
// the ground of one map: a height-mapped plane, tinted per map (town paths, sunny hills, shady forest)
function makeGround(w, d, cx, cz, segW, segD, ponds, tint, hf, edgeCol, tex) {
  const g = new THREE.PlaneGeometry(w, d, segW, segD); g.rotateX(-Math.PI / 2); g.translate(cx, 0, cz);
  const p = g.attributes.position, colors = new Float32Array(p.count * 3), c = [0, 0, 0], ec = edgeCol || [0.92, 0.86, 0.74, 30];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), y = (hf || height)(x, z);
    p.setY(i, y);
    const k = 0.93 + Math.sin(x * 0.07 + 2) * Math.cos(z * 0.06) * 0.1 + Math.sin(x * 0.19) * Math.sin(z * 0.23) * 0.04;
    c[0] = k; c[1] = k; c[2] = k * 0.96;
    if (tint) tint(x, z, c);
    const ed = edgeDist(x, z);
    if (ed > -2) { const t = smoothstep(-2, ec[3], ed); c[0] = lerp(c[0], ec[0], t * 0.5); c[1] = lerp(c[1], ec[1], t * 0.5); c[2] = lerp(c[2], ec[2], t * 0.5); }
    for (const pd of ponds) { const dp = Math.hypot(x - pd.x, z - pd.z); if (dp < pd.r + 2) { const t = 1 - dp / (pd.r + 2); c[0] -= t * 0.14; c[1] -= t * 0.1; c[2] -= t * 0.12; } }
    colors[i * 3] = c[0]; colors[i * 3 + 1] = c[1]; colors[i * 3 + 2] = c[2];
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, cloudShadowInject(new THREE.MeshLambertMaterial({ map: tex || grassTex, vertexColors: true }), ponds));
  root.add(m);
  return m;
}
makeGround(620, 660, 0, -190, isTouch ? 170 : 220, isTouch ? 180 : 232, PONDS, (x, z, c) => { if (Math.hypot(x, z) < TOWN.fence) { c[0] *= 1.04; c[1] *= 1.01; } });

// ---------- roads ----------
function roadRibbon(pts, width, tex) {
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => V3(x, 0, z)));
  const N = Math.max(40, Math.round(curve.getLength() / 1.5)), S = curve.getSpacedPoints(N), pos = [], uv = [], idx = [];
  let dist = 0;
  for (let i = 0; i <= N; i++) {
    const p = S[i]; if (i) dist += p.distanceTo(S[i - 1]);
    const t = curve.getTangentAt(i / N), nx = -t.z, nz = t.x, l = Math.hypot(nx, nz) || 1;
    for (const s of [-1, 1]) { const x = p.x + nx / l * width * 0.5 * s, z = p.z + nz / l * width * 0.5 * s; pos.push(x, height(x, z) + 0.06, z); uv.push(s < 0 ? 0 : 1, dist / width); }
    if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: tex || stoneTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  m.renderOrder = 1; root.add(m);
  roads.push({ samples: S, width, dirt: !!tex });
}
roadRibbon([[0, -10], [0, -30], [1, -46], [6, -70], [-8, -110], [10, -150], [2, -200], [-14, -250], [6, -300], [2, -345], [0, -372]], 4.4);
roadRibbon([[2, -200], [-40, -205], [-80, -214], [-120, -232], [-160, -238], [-188, -242]], 3.6);
roadRibbon([[10, -150], [44, -156], [86, -162], [130, -150], [170, -142], [192, -138]], 3.6);
roadRibbon([[1, -46], [14, -58], [26, -66]], 3.0);
function distToRoad(x, z) {
  let best = 1e9;
  for (const r of roads) for (let i = 0; i < r.samples.length; i += 2) { const p = r.samples[i], d = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z); if (d < best) best = d; }
  return Math.sqrt(best);
}
// plaza
{
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(14, 48), new THREE.MeshLambertMaterial({ map: cobbleTex, polygonOffset: true, polygonOffsetFactor: -3 }));
  plaza.rotation.x = -Math.PI / 2; plaza.position.set(0, TOWN.level + 0.04, 0); plaza.renderOrder = 1; root.add(plaza);
}

// ---------- sky, clouds, far mountains ----------
const sky = new THREE.Mesh(new THREE.SphereGeometry(950, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new THREE.Color(0x6aa6dc) }, mid: { value: new THREE.Color(0xa8cfe8) }, bottom: { value: FOG } },
  vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; varying vec3 vP; void main(){ float h = normalize(vP).y; vec3 c = mix(mid, top, smoothstep(0.08, 0.6, h)); c = mix(bottom, c, smoothstep(-0.02, 0.14, h)); gl_FragColor = vec4(c, 1.0); }'
}));
sky.renderOrder = -10; scene.add(sky);
const cloudTex = canvasTex(256, 128, (g, w, h) => {
  for (let i = 0; i < 22; i++) {
    const x = w * 0.18 + R() * w * 0.64, y = h * 0.42 + (R() - 0.5) * h * 0.35, r = 18 + R() * 30;
    const gr = g.createRadialGradient(x, y, 1, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(0.6, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  const sh = g.createLinearGradient(0, h * 0.4, 0, h); sh.addColorStop(0, 'rgba(200,214,228,0)'); sh.addColorStop(1, 'rgba(200,214,228,.6)');
  g.globalCompositeOperation = 'source-atop'; g.fillStyle = sh; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'source-over';
}, null);
// clouds and far mountains ring the map you are in (they move along when you change maps)
const skyRing = new THREE.Group(); scene.add(skyRing);
const clouds = [];
for (let i = 0; i < (isTouch ? 12 : 18); i++) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, depthWrite: false, fog: false, opacity: 0.92 }));
  const a = R() * Math.PI * 2, d = 180 + R() * 420;
  s.position.set(Math.cos(a) * d, 120 + R() * 70, -170 + Math.sin(a) * d); const sc = 90 + R() * 110; s.scale.set(sc, sc * 0.45, 1);
  skyRing.add(s); clouds.push(s);
}
function makeClump(seed, detail) {
  const g = new THREE.IcosahedronGeometry(1, detail == null ? 2 : detail);
  const p = g.attributes.position, n = g.attributes.normal, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const d = 1 + (vnoise3(x * 1.2 + seed, y * 1.2 + seed * 0.3, z * 1.2) - 0.5) * 0.18;
    p.setXYZ(i, x * d, (y < -0.3 ? y * 0.85 : y) * d, z * d); n.setXYZ(i, x, y, z);
    const t = clamp((y + 1) / 2, 0, 1);
    col[i * 3] = lerp(0.56, 1.12, t); col[i * 3 + 1] = lerp(0.66, 1.12, t); col[i * 3 + 2] = lerp(0.6, 0.84, t);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
{
  const parts = [], snow = new THREE.Color(0xeef4f8);
  const rings = [{ r: [360, 440], n: 16, h: [38, 66], c0: new THREE.Color(0x7d9b84), c1: new THREE.Color(0x9cb3a4), snow: false }, { r: [520, 660], n: 13, h: [90, 150], c0: new THREE.Color(0x92adbc), c1: new THREE.Color(0xb0c4d0), snow: true }];
  for (const ring of rings) for (let i = 0; i < ring.n; i++) {
    const a = (i / ring.n) * Math.PI * 2 + R() * 0.3, d = lerp(ring.r[0], ring.r[1], R()), hgt = lerp(ring.h[0], ring.h[1], R()), rad = hgt * (1.1 + R() * 0.5);
    const g = new THREE.ConeGeometry(rad, hgt, 30, 12), p = g.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const x = p.getX(k), y = p.getY(k), z = p.getZ(k), t = (y + hgt / 2) / hgt;
      const nz = vnoise3(x * 0.045 + i * 3, y * 0.05, z * 0.045) - 0.5, ridge = Math.abs(Math.sin(Math.atan2(z, x) * (4 + i % 3) + i)) * 0.18;
      const f = 1 + nz * 0.55 * (1 - t * 0.4) + ridge * (1 - t);
      p.setXYZ(k, x * f, y + nz * hgt * 0.08, z * f);
    }
    g.computeVertexNormals();
    const cols = new Float32Array(p.count * 3), nrm = g.attributes.normal, c = new THREE.Color();
    for (let k = 0; k < p.count; k++) {
      const t = (p.getY(k) + hgt / 2) / hgt;
      c.copy(ring.c0).lerp(ring.c1, t);
      if (ring.snow && t > 0.66 + vnoise3(p.getX(k) * 0.08, 0, p.getZ(k) * 0.08) * 0.14) c.lerp(snow, 0.85);
      const sh = 0.8 + 0.22 * Math.max(0, nrm.getX(k) * SUN_DIR.x + nrm.getY(k) * SUN_DIR.y + nrm.getZ(k) * SUN_DIR.z);
      cols[k * 3] = c.r * sh; cols[k * 3 + 1] = c.g * sh; cols[k * 3 + 2] = c.b * sh;
    }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    parts.push({ g, m: mtx(Math.cos(a) * d, hgt / 2 - 10, -170 + Math.sin(a) * d) });
  }
  skyRing.add(new THREE.Mesh(bake(parts), new THREE.MeshBasicMaterial({ vertexColors: true, fog: false })));
}

// ---------- vegetation and rocks (no outlines, baked into a few meshes) ----------
// (L, blobParts and treeDots belong to the map being built: see beginMap)
function groundBlob(x, z, size) { blobParts.push({ g: RW.shadowGeo, m: mtx(x, height(x, z) + 0.06, z, 0, 0, 0, size, 1, size) }); }
// leaves (and trunks) between the camera and the hero melt away in a soft dither, so thick forests never hide you
const focusU = { value: new THREE.Vector3(0, -9999, 0) }, camU = { value: new THREE.Vector3() }; // (Lambert materials do not get cameraPosition, so the camera comes in as its own uniform)
const SEE_V = ['varying vec3 vSeeW;', '#include <project_vertex>\n vSeeW = (modelMatrix * vec4(transformed, 1.0)).xyz;'];
const SEE_F = 'uniform vec3 uFocus;\nuniform vec3 uCam;\nvarying vec3 vSeeW;\n';
const SEE_DISCARD = '\n if (uFocus.y > -9000.0) {\n vec3 sAB = uFocus - uCam; float sT = clamp(dot(vSeeW - uCam, sAB) / max(dot(sAB, sAB), 0.001), 0.0, 1.0);\n float sD = length(vSeeW - (uCam + sAB * sT));\n float sKeep = sT < 0.96 ? smoothstep(1.6, 4.4, sD) : 1.0;\n sKeep = min(sKeep, smoothstep(2.0, 5.0, distance(vSeeW, uCam)));\n if (sKeep < 0.999 && fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233))) * 43758.5453) > sKeep) discard;\n }\n';
function seeThrough(sh) {
  sh.uniforms.uFocus = focusU; sh.uniforms.uCam = camU;
  sh.vertexShader = SEE_V[0] + '\n' + sh.vertexShader.replace('#include <project_vertex>', SEE_V[1]);
  sh.fragmentShader = SEE_F + sh.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>' + SEE_DISCARD);
}
function swayify(mat, amp, key) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = timeU;
    sh.vertexShader = 'uniform float uTime;\nattribute float sway;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n float sw2 = sway * sway;\n transformed.x += sin(uTime * 1.3 + position.x * 0.21 + position.z * 0.13) * ' + amp.toFixed(3) + ' * sw2;\n transformed.z += cos(uTime * 1.1 + position.x * 0.17 + position.z * 0.23) * ' + (amp * 0.7).toFixed(3) + ' * sw2;');
    seeThrough(sh);
  };
  mat.customProgramCacheKey = () => 'sway_see_' + key;
  return mat;
}
function seeMat(mat, key) { mat.onBeforeCompile = seeThrough; mat.customProgramCacheKey = () => 'see_' + key; return mat; }
// near trees get rounder leaf clumps; the wooded rim (always seen from afar) and phones use lighter ones
const CLUMPS_LO = [0, 1, 2, 3, 4, 5].map((i) => makeClump(i * 13.7 + 2, 1));
const CLUMPS = isTouch ? CLUMPS_LO : [0, 1, 2, 3, 4, 5].map((i) => makeClump(i * 13.7 + 2));
const TRUNK = (() => { const g = new THREE.CylinderGeometry(0.24, 0.42, 3.4, 9, 5), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const t = (p.getY(i) + 1.7) / 3.4; p.setX(i, p.getX(i) + t * t * 0.3); } g.computeVertexNormals(); return g; })();
function makeJaggedCone(r, h, seed) {
  const g = new THREE.ConeGeometry(r, h, 14, 2, true), p = g.attributes.position, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (y < -h / 2 + 0.01) { const a = Math.atan2(z, x), seg = Math.round((a / (Math.PI * 2)) * 14); const k = seg % 2 ? 1.09 : 0.93; p.setXYZ(i, x * k, y - (seg % 2 ? 0.14 : 0), z * k); }
    else if (Math.abs(y) < 0.01) { const k = 1 + (hash3(x + seed, y, z) - 0.5) * 0.08; p.setXYZ(i, x * k, y, z * k); }
    const t = (p.getY(i) + h / 2) / h, c = 0.62 + 0.42 * t;
    col[i * 3] = c; col[i * 3 + 1] = c; col[i * 3 + 2] = c;
  }
  g.computeVertexNormals(); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
const PINE_TIERS = [0, 1, 2, 3, 4].map((t) => ({ g: makeJaggedCone(2.1 - t * 0.36, 1.9 - t * 0.12, t * 7.1), h: 1.9 - t * 0.12 }));
let leafBase = 1; // leaf brightness of the map being built (shady in the forest, sunny on the hills)
function tint(base, spread) { base *= leafBase; return new THREE.Color(base + (R() - 0.5) * spread, base + (R() - 0.5) * spread * 0.6, base * 0.96 + (R() - 0.5) * spread); }
function addBroadleaf(x, z, s, solid, lo) {
  const CL = lo ? CLUMPS_LO : CLUMPS;
  const y0 = height(x, z) - 0.15, Lm = mtx(x, y0, z, 0, R() * Math.PI * 2, 0, s), sway = [y0 + 2.0 * s, 3.4 * s];
  L.wood.push({ g: TRUNK, m: Lm.clone().multiply(mtx(0, 1.7, 0)) });
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + R() * 0.7; L.wood.push({ g: cachedGeo('root', () => new THREE.ConeGeometry(0.2, 1.1, 6)), m: Lm.clone().multiply(mdir(V3(Math.cos(a) * 0.42, 0.22, Math.sin(a) * 0.42), V3(Math.cos(a), -0.45, Math.sin(a)), 1)) }); }
  const tops = [];
  for (let k = 0; k < 3; k++) {
    const a = k * 2.1 + R() * 0.8, dir = V3(Math.cos(a) * 0.85, 0.62, Math.sin(a) * 0.85).normalize(), start = V3(0.25, 2.5, 0);
    L.wood.push({ g: cachedGeo('branch', () => new THREE.CylinderGeometry(0.07, 0.15, 1.7, 6)), m: Lm.clone().multiply(mdir(start.clone().addScaledVector(dir, 0.85), dir, 1)) });
    tops.push(start.clone().addScaledVector(dir, 1.7).add(V3(0, 0.35, 0)));
  }
  const clumps = [[V3(0.3, 4.6, 0), 2.0]];
  tops.forEach((t) => clumps.push([t, 1.45 + R() * 0.35]));
  clumps.push([V3(0.25, 3.6, 0.9), 1.4], [V3(-0.4, 3.8, -0.8), 1.35], [V3(0.3, 5.5, 0.1), 1.3]);
  const tc = tint(1, 0.12);
  for (const [c, rad] of clumps) L.leaf.push({ g: CL[Math.floor(R() * CL.length)], m: Lm.clone().multiply(mtx(c.x, c.y, c.z, R(), R() * 6, 0, rad, rad * 0.9, rad)), sway, col: tc });
  groundBlob(x + 0.8 * s, z + 0.5 * s, 5 * s);
  if (solid) { addCollider(x, z, 0.7 * s); treeDots.push([x, z, 2.4 * s]); }
}
function addPine(x, z, s, solid) {
  const y0 = height(x, z) - 0.1, Lm = mtx(x, y0, z, 0, R() * 6, 0, s), sway = [y0 + 1.2 * s, 6 * s];
  L.wood.push({ g: cachedGeo('pinetrunk', () => new THREE.CylinderGeometry(0.17, 0.3, 2.4, 7)), m: Lm.clone().multiply(mtx(0, 1.2, 0)) });
  const tc = tint(1, 0.12);
  PINE_TIERS.forEach((tier, t) => L.pine.push({ g: tier.g, m: Lm.clone().multiply(mtx(0, 1.3 + t * 1.0 + tier.h / 2, 0, 0, R() * 6, 0)), sway, col: tc }));
  groundBlob(x + 0.6 * s, z + 0.4 * s, 4 * s);
  if (solid) { addCollider(x, z, 0.6 * s); treeDots.push([x, z, 2 * s]); }
}
function addBush(x, z, s) {
  const y0 = height(x, z), Lm = mtx(x, y0, z, 0, R() * 6, 0, s), sway = [y0, 1.6 * s], tc = tint(1.02, 0.14);
  for (let k = 0; k < 3; k++) { const c = V3((R() - 0.5) * 1.2, 0.55 + R() * 0.2, (R() - 0.5) * 1.2), rad = 0.7 + R() * 0.3; L.leaf.push({ g: CLUMPS[k], m: Lm.clone().multiply(mtx(c.x, c.y, c.z, 0, R() * 6, 0, rad, rad * 0.82, rad)), sway, col: tc }); }
  groundBlob(x, z, 2.6 * s);
}
function makeRock(seed) {
  const g = new THREE.DodecahedronGeometry(1, 1), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), d = 1 + (vnoise3(x * 1.3 + seed, y * 1.3, z * 1.3) - 0.5) * 0.55; p.setXYZ(i, x * d, (y < -0.4 ? -0.4 + (y + 0.4) * 0.3 : y) * d, z * d); }
  g.computeVertexNormals();
  const n = g.attributes.normal, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const up = n.getY(i), c = 0.8 + 0.25 * up; let r = c, gg = c, b = c * 0.97; if (up > 0.65 && hash3(seed, i * 0.1, 1) > 0.35) { r *= 0.72; gg *= 0.92; b *= 0.62; } col[i * 3] = r; col[i * 3 + 1] = gg; col[i * 3 + 2] = b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
const ROCKS = [0, 1, 2, 3].map((i) => makeRock(i * 5.3 + 1));
const campSpots = RW.CAMPS.map((c) => [c[2], c[3]]);
function okSpot(x, z, roadGap, campGap) {
  if (edgeDist(x, z) > -7) return false;
  if (Math.hypot(x, z) < TOWN.fence + 6) return false;
  if (distToRoad(x, z) < roadGap) return false;
  for (const p of PONDS) if (Math.hypot(x - p.x, z - p.z) < p.r + 3.5) return false;
  if (Math.abs(x - GARDEN.x) < GARDEN.w / 2 + 4 && Math.abs(z - GARDEN.z) < GARDEN.d / 2 + 4) return false;
  if (campGap) for (const [cx, cz] of campSpots) if (Math.hypot(x - cx, z - cz) < campGap) return false;
  return true;
}
{
  const groves = [[-60, -78], [72, -92], [-122, -118], [134, -118], [-28, -138], [42, -190], [-88, -210], [152, -200], [-162, -214], [100, -244], [-18, -282], [82, -292], [-132, -322], [4, -340], [160, -340], [-72, -360], [140, -60], [-140, -70], [-170, -300], [70, -350]];
  const want = isTouch ? 150 : 230;
  let placed = 0, guard = 0;
  while (placed < want && guard++ < 9000) {
    const c = groves[Math.floor(R() * groves.length)], x = c[0] + (R() - 0.5) * 34, z = c[1] + (R() - 0.5) * 34;
    if (!okSpot(x, z, 5.5, 6)) continue;
    if (colliders.some((o) => Math.abs(o.x - x) < 4.8 && Math.abs(o.z - z) < 4.8 && Math.hypot(o.x - x, o.z - z) < 4.6)) continue;
    const kind = R();
    if (kind < 0.55) addBroadleaf(x, z, 0.85 + R() * 0.5, true); else if (kind < 0.84) addPine(x, z, 0.9 + R() * 0.5, true); else addBush(x, z, 0.9 + R() * 0.5);
    placed++;
  }
  // a wooded rim on the hills around the map
  let rim = 0; guard = 0;
  const wantRim = isTouch ? 170 : 280;
  while (rim < wantRim && guard++ < 20000) {
    const x = (R() - 0.5) * 520, z = 60 - R() * 500, d = edgeDist(x, z);
    if (d < -1.5 || d > 26) continue;
    if (Math.hypot(x, z) < TOWN.fence + 3) continue;
    if (Math.abs(x) < 9 && z < -360) continue;
    if (R() < 0.62) addPine(x, z, 1.1 + R() * 0.7, false); else addBroadleaf(x, z, 1.1 + R() * 0.6, false, true);
    rim++;
  }
  for (let i = 0; i < 46; i++) {
    let x, z, g = 0; do { x = (R() - 0.5) * 360; z = -50 - R() * 320; } while (!okSpot(x, z, 3.5, 6) && g++ < 60);
    if (g >= 60) continue;
    const s = 0.6 + Math.pow(R(), 2) * 2.4;
    L.rock.push({ g: ROCKS[i % 4], m: mtx(x, height(x, z) + s * 0.25, z, R() * 0.3, R() * 6, R() * 0.3, s * (1 + R() * 0.4), s * (0.7 + R() * 0.4), s) });
    groundBlob(x, z, s * 2.6); addCollider(x, z, s * 1.05);
  }
  for (let i = 0; i < 120; i++) {
    const x = (R() - 0.5) * 520, z = 60 - R() * 500, d = edgeDist(x, z);
    if (d < 2 || d > 30) continue;
    const s = 3 + R() * 3.5;
    L.rock.push({ g: ROCKS[i % 4], m: mtx(x, height(x, z) + s * 0.4, z, 0, R() * 6, 0, s * 1.1, s * (1.2 + R() * 1.2), s) });
  }
  for (const p of PONDS) for (let i = 0; i < 9; i++) {
    const a = R() * Math.PI * 2, x = p.x + Math.cos(a) * (p.r + 1.3), z = p.z + Math.sin(a) * (p.r + 1.3), s = 0.35 + R() * 0.35;
    L.rock.push({ g: ROCKS[i % 4], m: mtx(x, height(x, z) + 0.08, z, 0, R() * 6, 0, s * 1.3, s * 0.6, s) });
  }
}
// god rays between the trees
const rayTex = canvasTex(64, 256, (g, w, h) => {
  const gx = g.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, 'rgba(255,255,255,0)'); gx.addColorStop(0.5, 'rgba(255,255,255,1)'); gx.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gx; g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'destination-in';
  const gy = g.createLinearGradient(0, 0, 0, h); gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(0.3, 'rgba(0,0,0,1)'); gy.addColorStop(0.85, 'rgba(0,0,0,.8)'); gy.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gy; g.fillRect(0, 0, w, h);
}, null);
const rays = [], waterMats = [];
function addRays(list, opacity, color) {
  const rayMat = new THREE.MeshBasicMaterial({ map: rayTex, color: color || 0xfff1c4, transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide });
  for (const [x, z] of list) {
    const outer = new THREE.Group(); outer.position.set(x, height(x, z) + 6.5, z);
    const m = new THREE.Mesh(cachedGeo('ray', () => new THREE.PlaneGeometry(2.8, 15)), rayMat); m.rotation.z = 0.42; outer.add(m);
    root.add(outer); rays.push({ o: outer, ph: R() * 6, op: opacity || 0.17 });
  }
}
addRays([[-60, -84], [70, -98], [-120, -126], [-26, -146], [44, -196], [-86, -218], [100, -250], [-16, -288], [-130, -328], [6, -346]]);
// grass tufts and flowers (instanced)
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _one = V3(1, 1, 1), _tv = V3(0, 0, 0);
function addFlowers(patches, nF, ok, cols, spread, centerHex) {
  const petals = new THREE.InstancedMesh(cachedGeo('petal', () => new THREE.CylinderGeometry(0.15, 0.15, 0.04, 5)), new THREE.MeshLambertMaterial({ color: 0xffffff }), nF);
  const centers = new THREE.InstancedMesh(cachedGeo('petalC', () => new THREE.SphereGeometry(0.06, 6, 4)), new THREE.MeshLambertMaterial({ color: centerHex || 0xf4c542 }), nF);
  const fc = cols.map((c) => new THREE.Color(c));
  let i = 0, guard = 0;
  while (i < nF && guard++ < 12000) {
    const pt = patches[i % patches.length], x = pt[0] + (R() + R() - 1) * (spread || 4), z = pt[1] + (R() + R() - 1) * (spread || 4);
    if (!ok(x, z)) continue;
    const y = height(x, z) + 0.12;
    _q.setFromEuler(new THREE.Euler(0, R() * 6, 0));
    _m4.compose(_tv.set(x, y, z), _q, _one); petals.setMatrixAt(i, _m4); petals.setColorAt(i, fc[(pt[2] + (R() < 0.2 ? 1 : 0)) % fc.length]);
    _m4.compose(_tv.set(x, y + 0.03, z), _q, _one); centers.setMatrixAt(i, _m4);
    i++;
  }
  petals.count = centers.count = i; root.add(petals, centers);
}
const tuftGeo = (() => { const blades = []; for (let b = 0; b < 4; b++) { const c = new THREE.ConeGeometry(0.05, 0.5 + b * 0.06, 3); c.translate(0, 0.27, 0); blades.push({ g: c, m: new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler((b - 1.5) * 0.3, b * 1.7, (b - 1.5) * 0.22)).setPosition((b - 1.5) * 0.06, 0, (b % 2) * 0.05) }); } return bake(blades); })();
// tufts sway in the breeze; on the hills the wind is stronger and always leans them the same way
function addTufts(nT, sample, ok, color, wind) {
  const tuftMat = new THREE.MeshLambertMaterial({ color });
  const amp = wind ? 0.3 : 0.16, lean = wind ? 0.12 : 0;
  tuftMat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = timeU;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n float sw = (sin(uTime * ' + (wind ? '2.6' : '1.7') + ' + instanceMatrix[3].x * 0.35 + instanceMatrix[3].z * 0.27) * ' + amp.toFixed(2) + ' + ' + lean.toFixed(2) + ') * max(position.y, 0.0);\n transformed.x += sw; transformed.z += sw * 0.5;');
  };
  tuftMat.customProgramCacheKey = () => 'tufts' + (wind ? 'w' : '');
  const tufts = new THREE.InstancedMesh(tuftGeo, tuftMat, nT);
  let t = 0, guard = 0;
  while (t < nT && guard++ < nT * 8) {
    const [x, z] = sample();
    if (!ok(x, z)) continue;
    const sc = (0.7 + R() * 0.9) * (wind ? 1.25 : 1);
    _m4.compose(_tv.set(x, height(x, z) - 0.02, z), _q.setFromEuler(new THREE.Euler(0, R() * 6, 0)), V3(sc, sc * (wind ? 1.3 : 1), sc)); tufts.setMatrixAt(t++, _m4);
  }
  tufts.count = t; root.add(tufts);
}
{
  const patches = [];
  for (let i = 0; i < 60; i++) { let x, z, g = 0; do { x = (R() - 0.5) * 360; z = -50 - R() * 320; } while (!okSpot(x, z, 4, 0) && g++ < 50); patches.push([x, z, Math.floor(R() * 4)]); }
  for (let i = 0; i < 8; i++) { const a = R() * Math.PI * 2, d = 18 + R() * 16; patches.push([Math.cos(a) * d, Math.sin(a) * d, Math.floor(R() * 4)]); }
  addFlowers(patches, isTouch ? 500 : 900, (x, z) => (Math.hypot(x, z) <= TOWN.fence + 6 || okSpot(x, z, 2.8, 0)) && Math.hypot(x, z) >= 15, [0xffffff, 0xffb3c6, 0xfff0a0, 0xc9b8ff]);
  addTufts(isTouch ? 2600 : 5200, () => [(R() - 0.5) * 400, 40 - R() * 430], (x, z) => { const inT = Math.hypot(x, z) < TOWN.fence - 2; if (inT ? Math.hypot(x, z) < 15.5 : !okSpot(x, z, 2.6, 0)) return false; return !(inT && R() < 0.6); }, 0x5f9a3e, false);
}

// ---------- water ----------
for (const P of PONDS) addPond(P, false);
function addPond(P, glowing) {
  const waterMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uTime: timeU, deep: { value: new THREE.Color(0x2c7891) }, shallow: { value: new THREE.Color(0x8fd1cf) }, skyc: { value: new THREE.Color(0xd2e8f3) }, sunDir: { value: SUN_DIR }, center: { value: new THREE.Vector2(P.x, P.z) }, radius: { value: P.r }, fogColor: { value: FOG }, fogNear: { value: FOG_NEAR }, fogFar: { value: FOG_FAR } },
    vertexShader: 'varying vec3 vW; varying float vD; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: [
      'uniform float uTime; uniform vec3 deep; uniform vec3 shallow; uniform vec3 skyc; uniform vec3 sunDir; uniform vec2 center; uniform float radius; uniform vec3 fogColor; uniform float fogNear; uniform float fogFar; varying vec3 vW; varying float vD;',
      'void main(){',
      ' vec3 V = normalize(cameraPosition - vW); vec2 p = vW.xz;',
      ' float wx = cos(p.x * 1.9 + uTime * 1.5) * 0.05 + cos((p.x + p.y) * 3.7 + uTime * 2.3) * 0.025;',
      ' float wz = cos(p.y * 2.3 - uTime * 1.2) * 0.05 + cos((p.x - p.y) * 4.1 - uTime * 2.0) * 0.025;',
      ' vec3 N = normalize(vec3(wx, 1.0, wz));',
      ' float d = clamp(distance(p, center) / radius, 0.0, 1.0);',
      ' float depth = 1.0 - d * d;',
      ' vec3 col = mix(shallow, deep, depth);',
      ' float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);',
      ' col = mix(col, skyc, fres * 0.35);',
      ' float spec = pow(max(dot(N, normalize(sunDir + V)), 0.0), 160.0) * 1.3;',
      ' float glint = pow(max(0.0, sin(p.x * 7.0 + uTime * 2.6) * sin(p.y * 6.0 - uTime * 2.1)), 30.0) * 0.5;',
      ' col += vec3(1.0, 0.98, 0.9) * (spec + glint);',
      ' float a = mix(0.25, 0.78, depth) + fres * 0.18 + spec + glint;',
      ' a *= mix(0.45, 1.0, smoothstep(0.98, 0.72, d));',
      ' gl_FragColor = vec4(mix(col, fogColor, smoothstep(fogNear, fogFar, vD)), clamp(a, 0.0, 0.95));',
      '}'
    ].join('\n')
  });
  waterMats.push(waterMat);
  const water = new THREE.Mesh(new THREE.CircleGeometry(P.r + 2, 48), waterMat);
  water.renderOrder = 3; water.rotation.x = -Math.PI / 2; water.position.set(P.x, P.level, P.z); root.add(water);
  const padMat = new THREE.MeshLambertMaterial({ color: 0x5fae45, side: THREE.DoubleSide });
  const flMat = glowing ? new THREE.MeshLambertMaterial({ color: 0xbff7ff, emissive: 0x3a9ab8 }) : new THREE.MeshLambertMaterial({ color: 0xffb3c6 });
  for (let i = 0; i < Math.round(P.r * 0.7); i++) {
    const a = R() * Math.PI * 2, d = R() * (P.r - 2);
    const pad = new THREE.Mesh(new THREE.CircleGeometry(0.75 + R() * 0.4, 14, 0.4, Math.PI * 2 - 0.7), padMat);
    pad.rotation.x = -Math.PI / 2; pad.rotation.z = R() * 6; pad.position.set(P.x + Math.cos(a) * d, P.level + 0.04, P.z + Math.sin(a) * d); root.add(pad);
    if (i < (glowing ? 5 : 2)) { const fl = new THREE.Mesh(geoSphere(0.16, 8, 6), flMat); fl.position.copy(pad.position); fl.position.y += 0.1; root.add(fl); if (glowing) { const gl = glow(1.1); gl.material.color = new THREE.Color(0xbff7ff); gl.material.opacity = 0.6; gl.position.copy(fl.position); root.add(gl); } }
  }
}

// ---------- buildings ----------
const town = new THREE.Group(); root.add(town);
const M_WOOD = lam(0xffffff, woodTex), M_WALL = lam(0xffffff, wallTex), M_STONE = lam(0xd8d2c6, rockTex), M_WIN = lam(0xffffff, windowTex), M_BARREL = lam(0xffffff, barrelTex);

function box(w, h, d, mat, x, y, z, parent, ry) { const m = new THREE.Mesh(geoBox(w, h, d), mat); m.position.set(x, y, z); if (ry) m.rotation.y = ry; parent.add(m); return m; }
function gableRoofGeo(w, d, h) {
  const g = new THREE.BufferGeometry(), hw = w / 2, hd = d / 2;
  g.setAttribute('position', new THREE.Float32BufferAttribute([-hw, 0, hd, hw, 0, hd, hw, h, 0, -hw, h, 0, hw, 0, -hd, -hw, 0, -hd, -hw, h, 0, hw, h, 0], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1], 2));
  g.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]); g.computeVertexNormals(); return g;
}
function gableEndGeo(w, d, h) {
  const g = new THREE.BufferGeometry(), hw = w / 2, hd = d / 2;
  g.setAttribute('position', new THREE.Float32BufferAttribute([hw, 0, hd, hw, 0, -hd, hw, h, 0, -hw, 0, -hd, -hw, 0, hd, -hw, h, 0], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1, 0, 0, 1, 0, 0.5, 1], 2));
  g.computeVertexNormals(); return g;
}
const faceCenter = (x, z) => Math.atan2(-x, -z);
const chimneys = [];
function addHouse(x, z, roofHex, opts) {
  opts = opts || {};
  const g = new THREE.Group(); g.position.set(x, height(x, z) - 0.1, z); g.rotation.y = opts.face == null ? faceCenter(x, z) : opts.face;
  const w = opts.w || 6, d = 5, hh = 3.2;
  box(w, hh, d, opts.stone ? lam(0xffffff, stoneWallTex) : M_WALL, 0, hh / 2, 0, g);
  const roof = new THREE.Mesh(gableRoofGeo(w + 0.9, d + 1.0, 2.3), lam(roofHex, roofTex, { side: THREE.DoubleSide })); roof.position.set(0, hh, 0); roof.rotation.y = Math.PI / 2; g.add(roof);
  const gable = new THREE.Mesh(gableEndGeo(d, w, 2.2), lam(0xefe6d2, null, { side: THREE.DoubleSide })); gable.position.set(0, hh, 0); gable.rotation.y = Math.PI / 2; g.add(gable);
  box(1.1, 1.9, 0.14, M_WOOD, 0, 0.95, d / 2 + 0.05, g);
  for (const s of [-1, 1]) { box(0.95, 0.85, 0.12, M_WIN, s * 1.9, 2.05, d / 2 + 0.05, g); box(1.05, 0.22, 0.32, M_WOOD, s * 1.9, 1.55, d / 2 + 0.16, g); for (let k = 0; k < 3; k++) { const fl = new THREE.Mesh(geoSphere(0.12, 6, 5), lam([0xff8fa8, 0xfff0a0, 0xffffff][k])); fl.position.set(s * 1.9 + (k - 1) * 0.3, 1.72, d / 2 + 0.18); g.add(fl); } }
  box(0.95, 0.85, 0.12, M_WIN, w / 2 + 0.05, 2.05, 0, g, Math.PI / 2);
  box(0.6, 1.8, 0.6, M_STONE, -w / 2 + 1, hh + 1.4, -0.7, g);
  town.add(g); groundBlob(x, z, 9);
  g.updateMatrixWorld(true); chimneys.push(V3(-w / 2 + 1, hh + 2.4, -0.7).applyMatrix4(g.matrixWorld));
  addCollider(x, z, 3.4); buildingDots.push([x, z, 3.6, '#c0503e']);
  return g;
}
function addMushroomHouse(x, z, capHex, scale) {
  const g = new THREE.Group(); g.position.set(x, height(x, z), z); g.scale.setScalar(scale); g.rotation.y = faceCenter(x, z);
  const stem = new THREE.Mesh(cachedGeo('hstem', () => new THREE.CylinderGeometry(2.0, 2.4, 3.2, 18)), lam(0xfff1d6, wallTex)); stem.position.y = 1.6; g.add(stem);
  box(1.0, 1.7, 0.3, M_WOOD, 0, 0.85, 2.2, g);
  const win = box(0.75, 0.7, 0.12, M_WIN, 1.15, 2.05, 1.82, g); win.rotation.y = 0.55;
  const cap = new THREE.Mesh(cachedGeo('hcap', () => new THREE.SphereGeometry(3.4, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2)), lam(capHex)); cap.scale.y = 0.72; cap.position.y = 3.0; g.add(cap);
  const under = new THREE.Mesh(cachedGeo('hcapU', () => new THREE.CircleGeometry(3.4, 24)), lam(0xe8d5b0)); under.rotation.x = Math.PI / 2; under.position.y = 3.0; g.add(under);
  for (let i = 0; i < 7; i++) {
    const th = 0.35 + R() * 0.85, ph = R() * Math.PI * 2, n = V3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph));
    const spot = new THREE.Mesh(geoSphere(1, 10, 8), lam(0xfff8ee));
    spot.position.set(n.x * 3.4, 3.0 + n.y * 3.4 * 0.72, n.z * 3.4); spot.quaternion.setFromUnitVectors(ZAX, V3(n.x, n.y * 1.3, n.z).normalize());
    const sz = 0.35 + R() * 0.35; spot.scale.set(sz, sz, sz * 0.25); g.add(spot);
  }
  town.add(g); groundBlob(x, z, 9 * scale); addCollider(x, z, 2.5 * scale); buildingDots.push([x, z, 3 * scale, '#e8604c']);
  return g;
}
function addTent(x, z, face, tex) {
  const g = new THREE.Group(); g.position.set(x, height(x, z), z); g.rotation.y = face;
  for (const [px, pz] of [[-1.4, -1.0], [1.4, -1.0], [-1.4, 1.0], [1.4, 1.0]]) box(0.12, 2.3, 0.12, M_WOOD, px, 1.15, pz, g);
  const canopy = new THREE.Mesh(cachedGeo('tent', () => new THREE.ConeGeometry(2.3, 1.2, 4, 1, true)), lam(0xffffff, tex || tentTex, { side: THREE.DoubleSide })); canopy.rotation.y = Math.PI / 4; canopy.scale.set(1, 1, 0.75); canopy.position.y = 2.85; g.add(canopy);
  box(2.6, 0.9, 0.8, M_WOOD, 0, 0.45, 0.9, g);
  town.add(g); groundBlob(x, z, 5); addCollider(x, z, 1.3);
  return g;
}
function addBarrels(x, z) {
  for (let k = 0; k < 3; k++) {
    const bx = x + (k === 2 ? 0.45 : k * 0.9), bz = z + (k === 2 ? 0.8 : 0), b = new THREE.Mesh(cachedGeo('barrel', () => new THREE.CylinderGeometry(0.38, 0.38, 0.85, 12)), M_BARREL);
    b.position.set(bx, height(bx, bz) + 0.42, bz); town.add(b);
  }
  const cr = new THREE.Mesh(geoBox(0.75, 0.75, 0.75), M_WOOD); cr.position.set(x - 0.9, height(x - 0.9, z) + 0.37, z + 0.3); cr.rotation.y = 0.4; town.add(cr);
  groundBlob(x, z, 3); addCollider(x + 0.4, z + 0.3, 1.2);
}
const signDraws = [];
function signTexture(text, w, h, size) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const tex = new THREE.CanvasTexture(c);
  const draw = () => { const g = c.getContext('2d'); g.drawImage(woodTex.image, 0, 0, w, h); g.fillStyle = 'rgba(255,240,210,.18)'; g.fillRect(0, 0, w, h); g.fillStyle = '#2e2018'; g.font = '600 ' + size + 'px Fredoka, "Trebuchet MS", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 2); tex.needsUpdate = true; };
  draw(); signDraws.push(draw); return tex;
}
if (document.fonts && document.fonts.load) document.fonts.load('600 48px Fredoka').then(() => signDraws.forEach((d) => d())).catch(() => {});
function signBoard(text, w, h, tw, th, size) { const sm = lam(0xffffff, signTexture(text, tw, th, size)); return new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.12), [M_WOOD, M_WOOD, M_WOOD, M_WOOD, sm, sm]); }
function signPost(x, z, face, text, parent) {
  const g = new THREE.Group(); g.position.set(x, height(x, z), z); g.rotation.y = face;
  box(0.18, 2.2, 0.18, M_WOOD, 0, 1.1, 0, g);
  const lines = text.split('\n');
  lines.forEach((t, i) => { const b = signBoard(t, 2.3, 0.5, 320, 70, 34); b.position.set(0, 1.85 - i * 0.58, 0.14); g.add(b); });
  (parent || root).add(g); addCollider(x, z, 0.3);
}

// town buildings (around the plaza, facing the statue)
const SHOP_SPOT = { x: -19.9, z: -4.4 };
addHouse(-28, -5, 0xe87f9a);
addTent(-19.5, -4.4, Math.PI / 2, awningTex);
{ const b = signBoard("Mira's Goods", 2.8, 0.6, 360, 80, 44); b.position.set(-19.5, height(-19.5, -4.4) + 3.6, -4.4); b.rotation.y = Math.PI / 2; town.add(b); }
addBarrels(-23, -11);
addHouse(29, -7, 0x5a5550, { stone: true });
{ // forge: anvil, coal pit, sign
  const fx = 19.5, fz = -6.5, g = new THREE.Group(); g.position.set(fx, height(fx, fz), fz); g.rotation.y = -Math.PI / 2;
  box(0.9, 0.35, 0.45, lam(0x6f7680), 0, 0.85, 0, g); box(0.45, 0.6, 0.35, lam(0x5a5f66), 0, 0.35, 0, g);
  box(1.6, 0.7, 1.2, M_STONE, -1.8, 0.35, 0.2, g); const coal = new THREE.Mesh(geoBox(1.2, 0.1, 0.8), new THREE.MeshLambertMaterial({ color: 0xff8a3d, emissive: 0x8a3a10 })); coal.position.set(-1.8, 0.72, 0.2); g.add(coal);
  const b = signBoard("Bolt's Forge", 2.6, 0.55, 340, 72, 40); b.position.set(0, 3.2, 1.6); g.add(b); box(0.12, 3.1, 0.12, M_WOOD, -1.1, 1.55, 1.6, g); box(0.12, 3.1, 0.12, M_WOOD, 1.1, 1.55, 1.6, g);
  town.add(g); addCollider(fx, fz, 1.2); addCollider(fx, fz - 1.8, 1.0);
}
addBarrels(24, -14);
addMushroomHouse(23, 21, 0xf0a0c0, 1.0);
{ const b = signBoard("Pip's Pet Den", 2.6, 0.55, 340, 72, 40); const g = new THREE.Group(); g.position.set(17.5, height(17.5, 16) , 16); g.rotation.y = faceCenter(17.5, 16); box(0.15, 2.2, 0.15, M_WOOD, 0, 1.1, 0, g); b.position.set(0, 2.0, 0.12); g.add(b); town.add(g); addCollider(17.5, 16, 0.3); }
addMushroomHouse(-23, 21, 0xe8604c, 1.0);
addHouse(-20, -28, 0x4f79b8);
addHouse(20, -28, 0xc0503e);
addMushroomHouse(0, 32, 0xf39a3d, 0.95);
addMushroomHouse(-33, -4 + 18, 0x86c45e, 0.7);
addHouse(33, 12, 0x6fae4a, { w: 5 });
addBarrels(-8, 24);
// lamp posts around the plaza
const lamps = [];
for (let i = 0; i < 6; i++) {
  const a = (i / 6) * Math.PI * 2, x = Math.cos(a) * 15.5, z = Math.sin(a) * 15.5;
  const g = new THREE.Group(); g.position.set(x, height(x, z), z);
  part(geoCyl(0.08, 0.1, 3.2, 8), lam(0x5a4a3a), 0, g, 0, 1.6, 0);
  part(geoBox(0.4, 0.5, 0.4), new THREE.MeshLambertMaterial({ color: 0xffe9a3, emissive: 0x6a5010 }), 0, g, 0, 3.35, 0);
  part(geoCone(0.32, 0.3, 4), lam(0x5a4a3a), 0, g, 0, 3.75, 0).rotation.y = Math.PI / 4;
  town.add(g); addCollider(x, z, 0.3);
}
// bunting across the plaza
{
  const rope = new THREE.CatmullRomCurve3([V3(-14.5, 7.3, -6), V3(-7, 6.4, -4), V3(0, 6.1, -3.5), V3(7, 6.4, -4), V3(14.5, 7.3, -6)].map((v) => v.setY(v.y + TOWN.level)));
  town.add(new THREE.Mesh(new THREE.TubeGeometry(rope, 50, 0.03, 4), lam(0x6b4a30)));
  const flagGeo = (() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-0.28, 0, 0, 0.28, 0, 0, 0, -0.6, 0], 3)); g.computeVertexNormals(); return g; })();
  const fc = [0xe8604c, 0xf4c542, 0x6fae4a, 0x4f79b8];
  for (let i = 1; i < 22; i++) { const p = rope.getPoint(i / 22), fl = new THREE.Mesh(flagGeo, lam(fc[i % 4], null, { side: THREE.DoubleSide })); fl.position.copy(p); town.add(fl); }
  for (const s of [-1, 1]) { box(0.15, 7.5, 0.15, M_WOOD, s * 14.6, 3.75 + TOWN.level, -6, town); addCollider(s * 14.6, -6, 0.3); }
}
// statue of Russel
const statueGlow = glow(2.4);
{
  const g = new THREE.Group(); g.position.set(0, TOWN.level, -4);
  const st = lam(0xc9c4ba, rockTex);
  box(2.4, 1.0, 2.4, st, 0, 0.5, 0, g); box(2.0, 0.2, 2.0, st, 0, 1.1, 0, g);
  box(1.0, 0.3, 0.05, lam(0xd8d3ca), 0, 0.55, 1.22, g);
  const fig = RW.statueFigure(); fig.scale.setScalar(2.3); fig.position.y = 1.2; g.add(fig);
  root.add(g); addCollider(0, -4, 1.8);
  g.updateMatrixWorld(true);
  statueGlow.position.set(0.55, 4.9, 0.1); g.add(statueGlow);
}
// town fence with the north gate
{
  const parts = [];
  const F = TOWN.fence, step = 2.4;
  for (let a = 0; a < Math.PI * 2; a += step / F) {
    const x = Math.cos(a) * F, z = Math.sin(a) * F;
    if (Math.abs(x) < TOWN.gate + 0.4 && z < 0) continue;
    const y = height(x, z);
    parts.push({ g: geoBox(0.22, 1.25, 0.22), m: mtx(x, y + 0.6, z) });
    const a2 = a + step / F, x2 = Math.cos(a2) * F, z2 = Math.sin(a2) * F;
    if (Math.abs(x2) < TOWN.gate + 0.4 && z2 < 0) continue;
    const mx = (x + x2) / 2, mz = (z + z2) / 2, len = Math.hypot(x2 - x, z2 - z), ry = Math.atan2(-(z2 - z), x2 - x), my = (y + height(x2, z2)) / 2;
    parts.push({ g: geoBox(len, 0.14, 0.1), m: mtx(mx, my + 0.95, mz, 0, ry, 0) });
    parts.push({ g: geoBox(len, 0.14, 0.1), m: mtx(mx, my + 0.5, mz, 0, ry, 0) });
  }
  const fence = new THREE.Mesh(bake(parts), lam(0xffffff, woodTex, { vertexColors: true })); root.add(fence);
  const gz = -F, g = new THREE.Group(); g.position.set(0, height(0, gz), gz);
  for (const s of [-1, 1]) box(0.5, 4.4, 0.5, M_WOOD, s * (TOWN.gate + 0.3), 2.2, 0, g);
  box(TOWN.gate * 2 + 1.6, 0.5, 0.5, M_WOOD, 0, 4.4, 0, g);
  const b = signBoard('MOSSBROOK', 3.8, 0.85, 512, 120, 66); b.position.set(0, 3.6, 0); g.add(b);
  root.add(g);
  for (const s of [-1, 1]) addCollider(s * (TOWN.gate + 0.3), gz, 0.45);
}
// notice board by the gate (quests arrive in a later delivery)
{
  const x = -8, z = -33, g = new THREE.Group(); g.position.set(x, height(x, z), z); g.rotation.y = faceCenter(x, z);
  box(0.15, 2.2, 0.15, M_WOOD, -1, 1.1, 0, g); box(0.15, 2.2, 0.15, M_WOOD, 1, 1.1, 0, g); box(2.3, 1.3, 0.1, M_WOOD, 0, 1.6, 0.06, g);
  const pm = lam(0xfbf1dc); for (const [px, py, r] of [[-0.55, 1.75, 0.1], [0.35, 1.55, -0.08], [0.6, 1.9, 0.05]]) { const p = box(0.55, 0.7, 0.02, pm, px, py, 0.13, g); p.rotation.z = r; }
  town.add(g); addCollider(x, z, 1.1);
}

// ---------- the garden outside the gate (Leaflets keep raiding it) ----------
const garden = new THREE.Group(); root.add(garden);
{
  const G = GARDEN, gy = height(G.x, G.z);
  const soil = new THREE.Mesh(new THREE.PlaneGeometry(G.w - 2, G.d - 2), new THREE.MeshLambertMaterial({ map: soilTex, polygonOffset: true, polygonOffsetFactor: -2 }));
  soil.rotation.x = -Math.PI / 2; soil.position.set(G.x, gy + 0.08, G.z); soil.renderOrder = 1; garden.add(soil);
  const crops = [];
  for (let row = 0; row < 5; row++) for (let i = 0; i < 9; i++) {
    const x = G.x - G.w / 2 + 2.2 + i * ((G.w - 4.4) / 8), z = G.z - G.d / 2 + 2.2 + row * ((G.d - 4.4) / 4), y = height(x, z) + 0.1;
    if (row % 2 === 0) {
      for (let k = 0; k < 5; k++) { const a = k * 1.26 + R(); crops.push({ g: geoSphere(0.22, 8, 6), m: mtx(x + Math.cos(a) * 0.16, y + 0.12, z + Math.sin(a) * 0.16, 0.5, -a, 0, 1.1, 0.35, 0.8), col: new THREE.Color(0.36, 0.62, 0.3) }); }
      crops.push({ g: geoSphere(0.17, 8, 6), m: mtx(x, y + 0.2, z, 0, 0, 0, 1, 0.85, 1), col: new THREE.Color(0.72, 0.88, 0.55) });
    }
    else { crops.push({ g: geoCone(0.09, 0.3, 6), m: mtx(x, y + 0.04, z, Math.PI, 0, 0), col: new THREE.Color(0.95, 0.55, 0.2) }); for (let k = 0; k < 3; k++) crops.push({ g: geoCone(0.05, 0.45, 4), m: mtx(x + (k - 1) * 0.06, y + 0.3, z, (k - 1) * 0.3, 0, 0), col: new THREE.Color(0.35, 0.7, 0.3) }); }
  }
  garden.add(new THREE.Mesh(bake(crops), new THREE.MeshLambertMaterial({ vertexColors: true })));
  // fence on three sides; the road side (west) stays open
  const fp = [], post = (x, z) => fp.push({ g: geoBox(0.16, 1.0, 0.16), m: mtx(x, height(x, z) + 0.5, z) });
  const rail = (x1, z1, x2, z2) => { const len = Math.hypot(x2 - x1, z2 - z1), ry = Math.atan2(-(z2 - z1), x2 - x1), y = height((x1 + x2) / 2, (z1 + z2) / 2); for (const hgt of [0.4, 0.78]) fp.push({ g: geoBox(len, 0.1, 0.08), m: mtx((x1 + x2) / 2, y + hgt, (z1 + z2) / 2, 0, ry, 0) }); };
  const x0 = G.x - G.w / 2, x1 = G.x + G.w / 2, z0 = G.z - G.d / 2, z1 = G.z + G.d / 2;
  for (let x = x0; x <= x1 + 0.01; x += 2.2) { post(x, z0); post(x, z1); addCollider(x, z0, 0.35); addCollider(x, z1, 0.35); }
  for (let z = z0; z <= z1 + 0.01; z += 2.2) { post(x1, z); addCollider(x1, z, 0.35); }
  rail(x0, z0, x1, z0); rail(x0, z1, x1, z1); rail(x1, z0, x1, z1);
  garden.add(new THREE.Mesh(bake(fp), lam(0xffffff, woodTex, { vertexColors: true })));
  // scarecrow
  const sc = new THREE.Group(); sc.position.set(G.x + 3, gy, G.z + 0.5);
  box(0.12, 2.4, 0.12, M_WOOD, 0, 1.2, 0, sc); box(1.8, 0.1, 0.1, M_WOOD, 0, 1.75, 0, sc);
  part(geoCyl(0.32, 0.4, 0.9, 10), lam(0x6aa84f), 0.01, sc, 0, 1.55, 0);
  part(geoSphere(0.28, 12, 10), lam(0xe8d5a0), 0.01, sc, 0, 2.3, 0);
  part(geoCone(0.42, 0.45, 12), lam(0xc9a36a), 0.01, sc, 0, 2.66, 0);
  garden.add(sc); addCollider(G.x + 3, G.z + 0.5, 0.4);
  signPost(G.x - G.w / 2 - 1.5, G.z + G.d / 2 + 1.2, -Math.PI / 2 + 0.4, 'Mossbrook Gardens', garden);
}
// ---------- gates between areas: a wooden arch with the name of the next area and a soft swirl of light ----------
const CENTERS = { meadow: [0, -212], hills: [HMAP.x, HMAP.z], wood: [WMAP.x, WMAP.z], river: [RMAP.x, RMAP.z], thorn: [TMAP.x, TMAP.z], burrow: [1500, -240], cave: [1505, -750] };
const swirlTex = canvasTex(128, 128, (g) => { g.translate(64, 64); for (let i = 0; i < 3; i++) { g.rotate(Math.PI * 2 / 3); g.strokeStyle = 'rgba(255,248,210,.9)'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.arc(0, 0, 40, 0, 1.9); g.stroke(); g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 24, 0.6, 2.2); g.stroke(); } const gr = g.createRadialGradient(0, 0, 4, 0, 0, 60); gr.addColorStop(0, 'rgba(255,240,170,.55)'); gr.addColorStop(1, 'rgba(255,240,170,0)'); g.fillStyle = gr; g.fillRect(-64, -64, 128, 128); }, null);
const swirls = [];
const curtainTex = canvasTex(64, 128, (g, w, h) => { const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, 'rgba(255,244,190,.85)'); gr.addColorStop(0.55, 'rgba(255,244,190,.3)'); gr.addColorStop(1, 'rgba(255,244,190,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); const gx = g.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, 'rgba(0,0,0,1)'); gx.addColorStop(0.18, 'rgba(0,0,0,0)'); gx.addColorStop(0.82, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = gx; g.fillRect(0, 0, w, h); }, null);
function gateArch(G, lvText) {
  const c = CENTERS[G.map], ox = G.x - c[0], oz = G.z - c[1], ol = Math.hypot(ox, oz) || 1;
  const g = new THREE.Group(); g.position.set(G.x, height(G.x, G.z), G.z); g.rotation.y = Math.atan2(-ox / ol, -oz / ol);
  for (const s of [-1, 1]) { box(0.5, 4.6, 0.5, M_WOOD, s * 3.3, 2.3, 0, g); box(0.7, 0.4, 0.7, M_STONE, s * 3.3, 0.2, 0, g); }
  box(7.6, 0.5, 0.5, M_WOOD, 0, 4.6, 0, g); box(8.2, 0.22, 0.6, M_WOOD, 0, 4.95, 0, g);
  const b = signBoard(G.sign, 4.2, 0.85, 560, 120, 62); b.position.set(0, 3.75, 0.3); g.add(b);
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const lf = new THREE.Mesh(geoSphere(0.22, 8, 6), lam([0x6fae4a, 0x86c45e, 0x5a9a3a][k])); lf.scale.set(1, 0.35, 0.6); lf.position.set(s * (3.3 - k * 0.45), 5.05 + (k % 2) * 0.12, 0.25); lf.rotation.z = s * (0.3 + k * 0.2); g.add(lf); }
  root.add(g);
  const sw = new THREE.Mesh(cachedGeo('swirl', () => new THREE.PlaneGeometry(4.6, 4.6)), new THREE.MeshBasicMaterial({ map: swirlTex, transparent: true, depthWrite: false, opacity: 0.65, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -3 }));
  sw.rotation.x = -Math.PI / 2; sw.position.set(G.x, height(G.x, G.z) + 0.1, G.z); sw.renderOrder = 2; root.add(sw);
  // a soft curtain of light between the posts: walk into it to travel
  const cur = new THREE.Mesh(cachedGeo('gateCurtain', () => new THREE.PlaneGeometry(6.1, 4.2)), new THREE.MeshBasicMaterial({ map: curtainTex, transparent: true, depthWrite: false, opacity: 0.5, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
  cur.position.set(0, 2.1, 0); g.add(cur); cur.renderOrder = 3;
  swirls.push({ m: sw, cur, map: G.map });
  for (const s of [-1, 1]) { const ang = g.rotation.y; addCollider(G.x + Math.cos(ang) * 3.3 * s, G.z - Math.sin(ang) * 3.3 * s, 0.5); }
  if (lvText) { const ang = g.rotation.y, px = G.x + Math.cos(ang) * 5.2 + Math.sin(ang) * 2.5, pz = G.z - Math.sin(ang) * 5.2 + Math.cos(ang) * 2.5; signPost(px, pz, ang, lvText); }
}
// the meadow's gates (Riverside stays closed until a later delivery)
gateArch(GATES[0], 'Breezy Hills\nLv. 3–5');
gateArch(GATES[1], 'Whisperwood\nLv. 5–7');
gateArch(gateById('m_e'), 'Riverside\nLv. 6–8');
signPost(6, -48, Math.PI + 0.3, 'Sunny Meadow\nLv. 1–4');

// the Sunberry patch north of the garden (the Leaflets have picked most of it) and the bush where Olly gets stuck
const SUNBERRY_PATCH = [[30, -79.5, 7], [36.5, -80, 3], [43, -79.5, 1]];
{
  const berries = [];
  for (const [x, z, n] of SUNBERRY_PATCH) {
    addBush(x, z, 0.95); addCollider(x, z, 0.9);
    const y = height(x, z);
    for (let i = 0; i < n; i++) { const a = i * 2.4 + 0.5, r = 0.75 + (i % 2) * 0.15; berries.push({ g: geoSphere(0.11, 8, 6), m: mtx(x + Math.cos(a) * r, y + 0.55 + (i % 3) * 0.22, z + Math.sin(a) * r) }); }
  }
  root.add(new THREE.Mesh(bake(berries), new THREE.MeshLambertMaterial({ color: 0xffb43d, emissive: 0x9a6010 })));
}
const OLLY_BUSH = { x: 21.5, z: -78 };
addBush(OLLY_BUSH.x, OLLY_BUSH.z, 1.15); addCollider(OLLY_BUSH.x, OLLY_BUSH.z, 1.0);
// places the story uses
const BOARD = { x: -8, z: -33 }, NORTH_GATE = { x: 0, z: -372 };

// merge static town pieces into a few draw calls
freeze(town); freeze(garden);
// bake the trees, rocks and shadows of the map being built into a few meshes
function bakeLayers(rockCol) {
  if (L.wood.length) root.add(new THREE.Mesh(bake(L.wood), seeMat(lam(0xffffff, barkTex, { vertexColors: true }), 'bark')));
  if (L.leaf.length) root.add(new THREE.Mesh(bake(L.leaf), swayify(lam(0xffffff, leafTex, { vertexColors: true }), 0.12, 'leaf')));
  if (L.pine.length) root.add(new THREE.Mesh(bake(L.pine), swayify(lam(0xffffff, pineTex, { vertexColors: true, side: THREE.DoubleSide }), 0.06, 'pine')));
  if (L.rock.length) root.add(new THREE.Mesh(bake(L.rock), rockCol ? seeMat(lam(rockCol, rockTex, { vertexColors: true }), 'rock' + rockCol) : lam(0xffffff, rockTex, { vertexColors: true })));
  if (blobParts.length) { const b = new THREE.Mesh(bake(blobParts), RW.shadowMat); b.renderOrder = 2; root.add(b); }
}
bakeLayers();

// ---------- NPC places ----------
const NPC_SPOTS = [
  { id: 'mira', name: 'Mira', role: 'Shopkeeper', x: SHOP_SPOT.x, z: SHOP_SPOT.z, face: Math.PI / 2, shop: true,
    lines: ['Welcome to Mira\'s Goods! Potions for scraped knees, snacks for brave hearts.', 'Leaf Jelly again? I can always use it. The pets love it.', 'Back safe? Good. Let me see what you found today.'] },
  { id: 'oakley', name: 'Elder Oakley', role: 'Village elder', x: -3.6, z: 1.2, face: 0.2,
    lines: ['Ah, a young one. Did you know Russel once fought a whole field of Leaflets with a wooden spoon? ...Zzz... Oh! Where was I?', 'The Leaflets keep raiding the gardens past the gate. Somebody brave should have a word with them.', 'I have a long story about that statue. Come back when you have an afternoon.'] },
  { id: 'bolt', name: 'Bolt', role: 'Blacksmith', x: 18.2, z: -2.8, face: -Math.PI / 2 - 0.3,
    lines: ['HA! A new adventurer! My forge is still warming up. Come back later for upgrades and repairs.', 'That stick of yours has character. Not much else, but character!'] },
  { id: 'pip', name: 'Pip', role: 'Pet keeper', x: 16.2, z: 13.4, face: -2.2,
    lines: ['Hi! I look after eggs and pets. No eggs have come in yet, but soon!', 'Did you see a fluffy cloud with a tail? No? Never mind!'] },
  { id: 'tobin', name: 'Old Tobin', role: 'Kite maker', map: 'hills', x: 71.2, z: -885.5, face: -0.16,
    lines: ['Feel that wind? Best kite weather in the whole world, right here on my hill.', 'Kites are like grandchildren. They wander off the moment you let go of the string.', 'The windmill grinds a little flour, but mostly it keeps me company. It creaks hello.'] },
  { id: 'fennick', name: 'Hermit Fennick', role: 'Whisperwood hermit', map: 'wood', x: -599.5, z: -560.8, face: 1.04,
    lines: ['Shh... listen. The trees are talking about you. Only nice things. Mostly.', 'I have lived in this tree for forty years. It has never once asked me to leave. Good tree.', 'The glowing lilies in my pond open when someone kind walks by. Look, they are open now.'] }
];
// the job masters (delivery 5): Marla in the town's training yard, Ivy on the hills, Zara by an ancient tree in the forest. Bolt teaches the Robot job at his forge
const YARD = { x: -26, z: -17, dummies: [[-31, -21], [-29, -11.5], [-23.5, -23]], targets: [[11, -17], [13.5, -12.5]] };
NPC_SPOTS.push(
  { id: 'marla', name: 'Marla Ironheart', role: 'Warrior master', x: YARD.x, z: YARD.z, face: Math.atan2(-YARD.x, -YARD.z) + 0.3, master: 'warrior',
    lines: ['HA! Good stance. Terrible stance, actually. But good spirit!', 'A warrior keeps going when everyone else sits down for snacks. Then we have snacks.'] },
  { id: 'ivy', name: 'Ranger Ivy', role: 'Archer master', map: 'hills', x: 30, z: -702, face: Math.PI * 0.85, master: 'archer',
    lines: ['Breathe out, then let go of the string. The wind does the rest.', 'My hawk sees a Leaflet blink from three hills away.'] },
  { id: 'zara', name: 'Zara Emberly', role: 'Mage master', map: 'wood', x: -461, z: -556, face: -1.9, master: 'mage',
    lines: ['What? I am busy. Magic does not practise itself.', 'If you touch my staff, I will turn your eyebrows into moss.'] }
);
// delivery 8: Nora keeps the old watermill in Riverside
NPC_SPOTS.push({ id: 'nora', name: 'Nora', role: 'Miller', map: 'river', x: MILL.x - 4.2, z: MILL.z + 4.6, face: -0.6,
  lines: ['The wheel turns, the stones grind, the river hums. Best job in the world.', 'Careful by the water. The Plopfrogs can lick you from very far away. Rude!', 'If a squirrel runs off with your coins, chase it! It drops them when it gets tired.'] });
for (const s of NPC_SPOTS) s.map = s.map || 'meadow';
const bolt = NPC_SPOTS.find((s) => s.id === 'bolt'); bolt.master = 'robot';
// the training yard: a patch of packed sand, a weapon rack and a sign
{
  const sandTex = canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(64, 64, 20, 64, 64, 64); gr.addColorStop(0, 'rgba(222,196,140,1)'); gr.addColorStop(0.8, 'rgba(214,188,132,.9)'); gr.addColorStop(1, 'rgba(214,188,132,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let i = 0; i < 160; i++) { g.fillStyle = R() < 0.5 ? 'rgba(170,140,90,.35)' : 'rgba(250,235,200,.35)'; g.fillRect(R() * w, R() * h, 2, 2); } }, null);
  const sand = new THREE.Mesh(new THREE.CircleGeometry(7.5, 32), new THREE.MeshLambertMaterial({ map: sandTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  sand.rotation.x = -Math.PI / 2; sand.position.set(YARD.x - 1.5, height(YARD.x - 1.5, YARD.z - 1.5) + 0.06, YARD.z - 1.5); sand.renderOrder = 1; MAPS.meadow.group.add(sand);
  const rack = new THREE.Group(); rack.position.set(YARD.x - 6.5, height(YARD.x - 6.5, YARD.z + 2), YARD.z + 2); rack.rotation.y = 1.0;
  box(2.2, 0.12, 0.12, M_WOOD, 0, 1.3, 0, rack); for (const x of [-1, 1]) box(0.12, 1.4, 0.12, M_WOOD, x, 0.7, 0, rack);
  for (const x of [-0.6, -0.1, 0.4]) { box(0.06, 1.0, 0.02, lam(0xdfe8f0), x, 0.85, 0.08, rack); box(0.2, 0.04, 0.05, lam(0xe3b343), x, 0.4, 0.08, rack); }
  freeze(rack); MAPS.meadow.group.add(rack); addCollider(YARD.x - 6.5, YARD.z + 2, 1.2);
  const keep = root; root = MAPS.meadow.group; signPost(YARD.x + 4.2, YARD.z + 4.5, Math.atan2(-YARD.x, -YARD.z), 'Training Yard'); root = keep;
}

// ---------- small life: butterflies, chimney smoke ----------
const butterflies = [];
{
  const cols = [0xffd36b, 0xffb3c6, 0xbfe6ff, 0xffffff];
  for (let i = 0; i < (isTouch ? 10 : 18); i++) {
    const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: cols[i % cols.length], side: THREE.DoubleSide });
    const w = [1, -1].map((s) => { const p = new THREE.Group(); const wing = new THREE.Mesh(cachedGeo('wing', () => { const pg = new THREE.PlaneGeometry(0.22, 0.18); pg.translate(0.11, 0, 0); pg.rotateX(-Math.PI / 2); return pg; }), mat); if (s < 0) wing.rotation.y = Math.PI; p.add(wing); g.add(p); return p; });
    let x, z, guard = 0; do { x = (R() - 0.5) * 300; z = -20 - R() * 300; } while (!okSpot(x, z, 2, 0) && guard++ < 40);
    if (i < 3) { const a = R() * 6, d = 18 + R() * 12; x = Math.cos(a) * d; z = Math.sin(a) * d; }
    root.add(g); butterflies.push({ g, w, pos: V3(x, height(x, z) + 1, z), home: V3(x, 0, z), goal: null, ph: R() * 6 });
  }
}
const smokeTex = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30); gr.addColorStop(0, 'rgba(240,240,240,.8)'); gr.addColorStop(1, 'rgba(240,240,240,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }, null);
const smoke = [];
for (const c of chimneys.slice(0, 4)) for (let i = 0; i < 4; i++) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false, opacity: 0 }));
  root.add(s); smoke.push({ s, base: c, t: i / 4 });
}

// ---------- minimap: each map paints its own picture once, the dots move on top ----------
let buildId = 'meadow';
function paintMini(B, colors, extra) {
  const W = (B.x1 - B.x0) * B.ppm, H = (B.z1 - B.z0) * B.ppm;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = colors.out; g.fillRect(0, 0, W, H);
  const S = 4;
  for (let x = B.x0; x < B.x1; x += S) for (let z = B.z0; z < B.z1; z += S) {
    const d = edgeDist(x + S / 2, z + S / 2);
    if (d < -3) g.fillStyle = colors.inAt ? colors.inAt(x + S / 2, z + S / 2) : colors.in; else if (d < 8) g.fillStyle = colors.rim; else continue;
    g.fillRect((x - B.x0) * B.ppm, (z - B.z0) * B.ppm, S * B.ppm + 0.5, S * B.ppm + 0.5);
  }
  g.save(); g.scale(B.ppm, B.ppm); g.translate(-B.x0, -B.z0);
  if (extra && extra.under) extra.under(g);
  g.lineCap = 'round'; g.lineJoin = 'round';
  for (const r of roads) { g.strokeStyle = r.dirt ? '#cfae7c' : '#e2d1a4'; g.lineWidth = r.width; g.beginPath(); r.samples.forEach((p, i) => (i ? g.lineTo(p.x, p.z) : g.moveTo(p.x, p.z))); g.stroke(); }
  if (extra && extra.mid) extra.mid(g);
  g.fillStyle = colors.tree; for (const [x, z, r] of treeDots) { g.beginPath(); g.arc(x, z, r, 0, Math.PI * 2); g.fill(); }
  for (const [x, z, r, col] of buildingDots) { g.fillStyle = col; g.strokeStyle = '#3b2a1e'; g.lineWidth = 0.6; g.beginPath(); g.arc(x, z, r, 0, Math.PI * 2); g.fill(); g.stroke(); }
  // gates: a little golden arch
  for (const G of GATES) if (G.map === buildId) { g.fillStyle = '#ffd84d'; g.strokeStyle = '#3b2a1e'; g.lineWidth = 0.8; g.beginPath(); g.arc(G.x, G.z, 3.4, 0, Math.PI * 2); g.fill(); g.stroke(); }
  if (extra && extra.over) extra.over(g);
  g.restore();
  return c;
}
const MINI = { x0: -215, z0: -400, x1: 215, z1: 60, ppm: 2 };
MAPS.meadow.mini = MINI;
MAPS.meadow.miniCanvas = paintMini(MINI, { out: '#5f8a44', in: '#93c35e', rim: '#7aa850', tree: '#3f7a32' }, {
  under: (g) => {
    g.fillStyle = '#b8d98a'; g.beginPath(); g.arc(0, 0, TOWN.fence, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#8a5a35'; g.lineWidth = 1.2; g.beginPath(); g.arc(0, 0, TOWN.fence, -Math.PI / 2 + 0.12, Math.PI * 1.5 - 0.12); g.stroke();
  },
  mid: (g) => {
    g.fillStyle = '#d6c7a2'; g.beginPath(); g.arc(0, 0, 14, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#6fb6cf'; for (const p of PONDS) { g.beginPath(); g.arc(p.x, p.z, p.r + 1, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#9a6e45'; g.fillRect(GARDEN.x - GARDEN.w / 2, GARDEN.z - GARDEN.d / 2, GARDEN.w, GARDEN.d);
  },
  over: (g) => { g.fillStyle = '#c9c4ba'; g.beginPath(); g.arc(0, -4, 1.6, 0, Math.PI * 2); g.fill(); }
});
MAPS.meadow.built = true;

// ---------- shared bits for the new maps ----------
const dotTex = canvasTex(32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 1, 16, 16, 15); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }, null);
// floating bits that drift around the camera: dandelion seeds on the hills, fireflies in the forest
function driftCloud(n, size, color, additive) {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), seed = new Float32Array(n);
  for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 44; pos[i * 3 + 1] = Math.random() * 9; pos[i * 3 + 2] = (Math.random() - 0.5) * 44; seed[i] = Math.random() * 6.28; col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = 1; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size, map: dotTex, color, transparent: true, depthWrite: false, vertexColors: true, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, opacity: 0.95 }));
  pts.frustumCulled = false; root.add(pts);
  return { pts, pos, col, seed, n };
}
const dirtTex = canvasTex(256, 256, (g, w, h) => {
  for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) { const e = Math.min(x, w - x) / (w / 2), a = clamp((e - 0.06) / 0.45, 0, 1) * 0.9; if (a > 0) { g.fillStyle = 'rgba(132,98,62,' + a.toFixed(3) + ')'; g.fillRect(x, y, 2, 2); } }
  for (let i = 0; i < 220; i++) { const x = w * 0.15 + R() * w * 0.7, y = R() * h; g.fillStyle = ['rgba(110,80,48,.5)', 'rgba(160,120,78,.5)', 'rgba(120,140,70,.45)', 'rgba(190,120,60,.4)'][i % 4]; g.beginPath(); g.ellipse(x, y, 2 + R() * 5, 1.5 + R() * 3, R() * 3, 0, Math.PI * 2); g.fill(); }
}, null);
dirtTex.wrapT = THREE.RepeatWrapping;
function gateClear(x, z, r) { for (const G of GATES) if (Math.hypot(x - G.x, z - G.z) < r) return false; return true; }
function chestClear(x, z, r) { for (const c of RW.CHESTS) if (Math.hypot(x - c[2], z - c[3]) < r) return false; return true; }
function rocksAround(list, s0, s1, solid) {
  for (const [x, z] of list) { const s = s0 + R() * (s1 - s0); L.rock.push({ g: ROCKS[Math.floor(R() * 4)], m: mtx(x, height(x, z) + s * 0.3, z, R() * 0.3, R() * 6, R() * 0.3, s * (1 + R() * 0.4), s * (0.8 + R() * 0.5), s) }); groundBlob(x, z, s * 2.6); if (solid) addCollider(x, z, s * 1.05); }
}

// ---------- Breezy Hills ----------
const HDIR = [Math.sin(WINDMILL.face), Math.cos(WINDMILL.face)], HPERP = [Math.cos(WINDMILL.face), -Math.sin(WINDMILL.face)];
const at = (f, s) => ({ x: WINDMILL.x + HDIR[0] * f + HPERP[0] * s, z: WINDMILL.z + HDIR[1] * f + HPERP[1] * s });
const CRYSTAL = at(4.8, -2.8), BENCH = at(5.4, 5.0);
const KITES = [{ x: -122, z: -756 }, { x: 138, z: -760 }, { x: -58, z: -982 }, { x: 154, z: -904 }];
const hillsFx = { sails: null, kites: [], seeds: null };
function buildHills() {
  beginMap('hills', 77001); buildId = 'hills'; leafBase = 1.06;
  const segs = isTouch ? [150, 140] : [200, 186];
  makeGround(560, 520, 0, -830, segs[0], segs[1], [], (x, z, c) => { const h = heightHills(x, z); c[0] *= 1.07; c[1] *= 1.04; c[2] *= 0.84; const k = clamp((h - 4) / 10, 0, 1) * 0.08; c[0] += k; c[1] += k * 0.8; });
  roadRibbon([[0, -666], [4, -700], [-6, -740], [4, -780], [22, -818], [44, -850], [60, -872], [66, -880]], 3.6);
  roadRibbon([[4, -780], [-34, -800], [-80, -826], [-128, -850], [-163, -860]], 3.2);
  roadRibbon([[22, -818], [12, -880], [-8, -930], [0, -972]], 3.0);
  const okHills = (x, z, gap) => edgeHills(x, z) < -7 && distToRoad(x, z) >= gap && Math.hypot(x - WINDMILL.x, z - WINDMILL.z) > 15 && gateClear(x, z, 10) && chestClear(x, z, 3.5) && KITES.every((k) => Math.hypot(x - k.x, z - k.z) > 5);
  // the windmill: a white tower, a red cap and four sails that never stop turning
  {
    const y0 = height(WINDMILL.x, WINDMILL.z), g = new THREE.Group(); g.position.set(WINDMILL.x, y0 - 0.2, WINDMILL.z); g.rotation.y = WINDMILL.face;
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 3.2, 8.6, 18, 1), lam(0xfaf3e4, stoneWallTex)); tower.position.y = 4.3; g.add(tower);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(2.9, 3.0, 18), lam(0xc0503e, roofTex)); cap.position.y = 10.0; g.add(cap);
    const capRim = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 2.55, 0.5, 18), M_WOOD); capRim.position.y = 8.6; g.add(capRim);
    box(1.4, 2.3, 0.3, M_WOOD, 0, 1.15, 3.05, g);
    box(1.6, 0.25, 0.5, M_STONE, 0, 0.1, 3.3, g);
    for (const [y, x] of [[4.4, 0], [6.6, 0.6]]) box(0.8, 0.8, 0.14, M_WIN, x, y, 2.85 - (y - 4.4) * 0.1, g);
    const hub = new THREE.Group(); hub.position.set(0, 7.6, 2.75); hub.userData.live = true; g.add(hub);
    part(geoCyl(0.35, 0.35, 0.6, 12), M_WOOD, 0, hub, 0, 0, 0).rotation.x = Math.PI / 2;
    const cloth = lam(0xf6efdc, null, { side: THREE.DoubleSide });
    for (let k = 0; k < 4; k++) {
      const arm = new THREE.Group(); arm.rotation.z = k * Math.PI / 2; hub.add(arm);
      box(0.22, 6.4, 0.16, M_WOOD, 0, 3.3, 0.2, arm);
      const sail = new THREE.Mesh(cachedGeo('sail', () => new THREE.PlaneGeometry(1.4, 4.8)), cloth); sail.position.set(0.82, 3.8, 0.22); arm.add(sail);
      for (let r = 0; r < 4; r++) box(1.5, 0.07, 0.07, M_WOOD, 0.82, 1.9 + r * 1.3, 0.26, arm);
    }
    const flagPole = box(0.1, 1.6, 0.1, M_WOOD, 0, 12.1, 0, g);
    const flag = new THREE.Mesh(cachedGeo('flag', () => { const fg = new THREE.PlaneGeometry(1.0, 0.55); fg.translate(0.5, 0, 0); return fg; }), lam(0xf4c542, null, { side: THREE.DoubleSide })); flag.position.set(0.05, 12.6, 0); flag.userData.live = true; g.add(flag);
    freeze(g); root.add(g);
    hillsFx.sails = hub; hillsFx.flag = flag; void flagPole;
    addCollider(WINDMILL.x, WINDMILL.z, 3.6); buildingDots.push([WINDMILL.x, WINDMILL.z, 4, '#f6efdc']);
    // the old Sun Crystal on its stone stand by the door: dim, waiting for sunshine
    const cy = height(CRYSTAL.x, CRYSTAL.z), cg = new THREE.Group(); cg.position.set(CRYSTAL.x, cy, CRYSTAL.z);
    part(geoCyl(0.45, 0.6, 1.0, 8), M_STONE, 0.02, cg, 0, 0.5, 0);
    const cr = new THREE.Mesh(cachedGeo('crystal', () => new THREE.OctahedronGeometry(0.42, 0)), new THREE.MeshLambertMaterial({ color: 0xffe08a, emissive: 0x6a4a10, transparent: true, opacity: 0.92 })); cr.scale.set(0.8, 1.4, 0.8); cr.position.y = 1.65; cg.add(cr);
    const cgl = glow(1.6); cgl.position.y = 1.65; cgl.material.opacity = 0.35; cg.add(cgl);
    root.add(cg); addCollider(CRYSTAL.x, CRYSTAL.z, 0.7); hillsFx.crystal = cr; hillsFx.crystalGlow = cgl;
    // Tobin's workbench with kites, and three kites flying on long strings
    const by = height(BENCH.x, BENCH.z), bg = new THREE.Group(); bg.position.set(BENCH.x, by, BENCH.z); bg.rotation.y = WINDMILL.face + 0.5;
    box(2.2, 0.15, 1.0, M_WOOD, 0, 0.9, 0, bg); for (const [x, z] of [[-1, -0.4], [1, -0.4], [-1, 0.4], [1, 0.4]]) box(0.12, 0.9, 0.12, M_WOOD, x, 0.45, z, bg);
    for (const [x, c, r] of [[-0.6, 0x4f79b8, 0.3], [0.5, 0x6fae4a, -0.4]]) { const k = new THREE.Mesh(cachedGeo('kiteSail', () => new THREE.CircleGeometry(0.16, 4)), lam(c, null, { side: THREE.DoubleSide })); k.scale.set(2.2, 3, 1); k.rotation.set(-Math.PI / 2, 0, r); k.position.set(x, 0.99, 0); bg.add(k); }
    freeze(bg); root.add(bg); addCollider(BENCH.x, BENCH.z, 1.2);
    const strMat = new THREE.LineBasicMaterial({ color: 0xfff6e4 });
    [[0xe8604c, 14, 0], [0x4f79b8, 17, 2.1], [0xf4c542, 12.5, 4.2]].forEach(([c, hgt, ph], i) => {
      const kite = new THREE.Group(); root.add(kite);
      const sail = new THREE.Mesh(cachedGeo('kiteSail', () => new THREE.CircleGeometry(0.16, 4)), lam(c, null, { side: THREE.DoubleSide })); sail.scale.set(5, 7, 1); kite.add(sail);
      for (let t = 0; t < 4; t++) { const b = new THREE.Mesh(geoBox(0.3, 0.12, 0.05), lam([0xffffff, 0xf4c542, 0x6fae4a, 0xe8604c][t])); b.position.set(0, -1.4 - t * 0.6, 0); kite.add(b); }
      const lg = new THREE.BufferGeometry().setFromPoints([V3(0, 0, 0), V3(0, 1, 0)]); const line = new THREE.Line(lg, strMat); line.frustumCulled = false; root.add(line);
      hillsFx.kites.push({ kite, line, hgt, ph, anchor: V3(BENCH.x + (i - 1) * 0.6, by + 1.0, BENCH.z), off: V3(-6 + i * 5, 0, -8 - i * 3) });
    });
  }
  // trees bent by the wind, kite trees, a wooded rim
  const groves = [[-140, -720], [128, -700], [-150, -896], [150, -880], [-62, -878], [98, -806], [-100, -985], [62, -990], [160, -760], [-44, -700], [-120, -820], [40, -936]];
  let placed = 0, guard = 0; const want = isTouch ? 90 : 140;
  while (placed < want && guard++ < 6000) {
    const c = groves[Math.floor(R() * groves.length)], x = c[0] + (R() - 0.5) * 30, z = c[1] + (R() - 0.5) * 30;
    if (!okHills(x, z, 5)) continue;
    if (colliders.some((o) => Math.abs(o.x - x) < 4.8 && Math.abs(o.z - z) < 4.8 && Math.hypot(o.x - x, o.z - z) < 4.6)) continue;
    const kind = R();
    if (kind < 0.35) addBroadleaf(x, z, 0.8 + R() * 0.4, true); else if (kind < 0.8) addPine(x, z, 0.9 + R() * 0.5, true); else addBush(x, z, 0.9 + R() * 0.5);
    placed++;
  }
  for (const k of KITES) addBroadleaf(k.x, k.z, 1.15, true);
  let rim = 0; guard = 0; const wantRim = isTouch ? 150 : 240;
  while (rim < wantRim && guard++ < 20000) {
    const x = (R() - 0.5) * 480, z = -600 - R() * 470, d = edgeHills(x, z);
    if (d < -1.5 || d > 26 || !gateClear(x, z, 11)) continue;
    if (R() < 0.75) addPine(x, z, 1.1 + R() * 0.7, false); else addBroadleaf(x, z, 1.1 + R() * 0.6, false, true);
    rim++;
  }
  // rocks, a ring of standing stones on the western hill, and cliffs by the windmill hill
  for (let i = 0; i < 40; i++) { let x, z, g = 0; do { x = (R() - 0.5) * 330; z = -680 - R() * 300; } while (!okHills(x, z, 3.5) && g++ < 60); if (g < 60) rocksAround([[x, z]], 0.6, 2.4, true); }
  for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2, x = -106 + Math.cos(a) * 6.5, z = -928 + Math.sin(a) * 6.5; L.rock.push({ g: ROCKS[k % 4], m: mtx(x, height(x, z) + 1.0, z, 0, a, 0, 0.7, 2.2, 0.55) }); groundBlob(x, z, 2); addCollider(x, z, 0.7); }
  rocksAround([[118, -986], [126, -978], [110, -992], [160, -950], [-160, -950], [-150, -962], [170, -790]], 2.8, 4.6, true);
  for (let i = 0; i < 110; i++) { const x = (R() - 0.5) * 480, z = -600 - R() * 470, d = edgeHills(x, z); if (d < 2 || d > 30) continue; const s = 3 + R() * 3.5; L.rock.push({ g: ROCKS[i % 4], m: mtx(x, height(x, z) + s * 0.4, z, 0, R() * 6, 0, s * 1.1, s * (1.2 + R() * 1.2), s) }); }
  // dandelion fields: white seed clocks on stems, and yellow flowers between them
  {
    const n = isTouch ? 520 : 900, patches = [];
    for (let i = 0; i < 46; i++) { let x, z, g = 0; do { x = (R() - 0.5) * 320; z = -690 - R() * 290; } while (!okHills(x, z, 3) && g++ < 40); patches.push([x, z, i % 2]); }
    const balls = new THREE.InstancedMesh(geoSphere(0.13, 8, 6), new THREE.MeshLambertMaterial({ color: 0xfdf9ee }), n);
    const stems = new THREE.InstancedMesh(cachedGeo('dstem', () => { const s = new THREE.CylinderGeometry(0.012, 0.016, 0.4, 4); s.translate(0, 0.2, 0); return s; }), new THREE.MeshLambertMaterial({ color: 0x6f9a3e }), n);
    let i = 0, g2 = 0;
    while (i < n && g2++ < 9000) { const p = patches[i % patches.length], x = p[0] + (R() + R() - 1) * 5, z = p[1] + (R() + R() - 1) * 5; if (!okHills(x, z, 2.4)) continue; const y = height(x, z), s = 0.8 + R() * 0.5; _m4.compose(_tv.set(x, y, z), _q.setFromEuler(new THREE.Euler(0.12, R() * 6, 0.1)), V3(s, s, s)); stems.setMatrixAt(i, _m4); _m4.compose(_tv.set(x + 0.04 * s, y + 0.42 * s, z), _q, V3(s, s, s)); balls.setMatrixAt(i, _m4); i++; }
    balls.count = stems.count = i; root.add(balls, stems);
    addFlowers(patches, isTouch ? 300 : 520, (x, z) => okHills(x, z, 2.4), [0xffe066, 0xfff2a0, 0xffffff], 6, 0xe8a42a);
  }
  addTufts(isTouch ? 2400 : 4600, () => [(R() - 0.5) * 360, -660 - R() * 340], (x, z) => edgeHills(x, z) < -3 && distToRoad(x, z) > 2.4 && Math.hypot(x - WINDMILL.x, z - WINDMILL.z) > 8, 0x7aa848, true);
  addRays([[-60, -720], [100, -800], [-100, -900], [40, -950]], 0.12);
  gateArch(GATES[2], 'Sunny Meadow\nLv. 1–4');
  gateArch(GATES[3], 'Whisperwood\nLv. 5–7');
  signPost(12, -786, Math.PI * 0.85, 'Windmill\nWhisperwood');
  hillsFx.seeds = driftCloud(isTouch ? 90 : 150, 0.32, 0xffffff, false);
  bakeLayers();
  MAPS.hills.mini = { x0: -190, z0: -1010, x1: 190, z1: -650, ppm: 2 };
  MAPS.hills.miniCanvas = paintMini(MAPS.hills.mini, { out: '#6f9a4a', in: '#b0d278', rim: '#8fb560', tree: '#4f8a3a', inAt: (x, z) => { const h = heightHills(x, z); return h > 9 ? '#c8e292' : h > 5 ? '#bcda86' : '#b0d278'; } });
  MAPS.hills.built = true;
}

// ---------- Whisperwood ----------
const woodFx = { flies: null, pile: null };
const STASH_LOG = { x: STASH.x - 4, z: STASH.z - 3 };
function buildWood() {
  beginMap('wood', 55003); buildId = 'wood'; leafBase = 0.86;
  const segs = isTouch ? [140, 160] : [180, 210];
  roadRibbon([[-395, -470], [-440, -482], [-500, -500], [-556, -532], [-592, -556]], 3.4, dirtTex);
  roadRibbon([[-500, -500], [-512, -560], [-522, -640], [-520, -721]], 3.0, dirtTex);
  roadRibbon([[-517, -600], [-503, -607], [-489, -612]], 2.6, dirtTex); // to Rootling Burrow
  roadRibbon([[-556, -532], [-580, -470], [-596, -410], [-600, -362]], 2.8, dirtTex); // to Riverside
  const okWood = (x, z, gap) => edgeWood(x, z) < -6 && distToRoad(x, z) >= gap && Math.hypot(x - HOLLOW.x, z - HOLLOW.z) > 13 && Math.hypot(x - STASH.x, z - STASH.z) > 11 && WPONDS.every((p) => Math.hypot(x - p.x, z - p.z) > p.r + 4) && gateClear(x, z, 9) && chestClear(x, z, 3.5) && Math.hypot(x + 436, z + 696) > 11 && WISPS.every((w) => Math.hypot(x - w.x, z - w.z) > 5);
  for (const p of WPONDS) addPond(p, true);
  for (const p of WPONDS) for (let i = 0; i < 9; i++) { const a = R() * Math.PI * 2, x = p.x + Math.cos(a) * (p.r + 1.3), z = p.z + Math.sin(a) * (p.r + 1.3), s = 0.35 + R() * 0.35; L.rock.push({ g: ROCKS[i % 4], m: mtx(x, height(x, z) + 0.08, z, 0, R() * 6, 0, s * 1.3, s * 0.6, s) }); }
  // Hermit Fennick's hollow tree: a huge trunk with a round door, glowing windows and a lantern
  {
    const H = HOLLOW, y0 = height(H.x, H.z), g = new THREE.Group(); g.position.set(H.x, y0 - 0.3, H.z); g.rotation.y = H.face;
    const bark = lam(0xffffff, barkTex);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 4.4, 11, 22, 4), bark); trunk.position.y = 5.5; g.add(trunk);
    for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2 + 0.3; if (Math.abs(Math.sin(a)) < 0.3 && Math.cos(a) > 0) continue; const r = new THREE.Mesh(cachedGeo('hroot', () => new THREE.ConeGeometry(0.9, 4.2, 7)), bark); r.position.set(Math.sin(a) * 4.4, 0.6, Math.cos(a) * 4.4); r.rotation.set(Math.cos(a) * 1.25, 0, -Math.sin(a) * 1.25); g.add(r); }
    const door = new THREE.Mesh(cachedGeo('hdoor', () => new THREE.CircleGeometry(1.05, 24)), lam(0x6b4a30)); door.position.set(0, 1.35, 4.32); g.add(door);
    const frame = new THREE.Mesh(cachedGeo('hframe', () => new THREE.TorusGeometry(1.08, 0.16, 8, 26)), lam(0x8a6a4a)); frame.position.set(0, 1.35, 4.36); g.add(frame);
    const knob = new THREE.Mesh(geoSphere(0.09, 8, 6), lam(0xe3b343)); knob.position.set(0.55, 1.3, 4.44); g.add(knob);
    const winM = new THREE.MeshLambertMaterial({ color: 0xffe3a0, emissive: 0x9a6a20 });
    for (const [a, y] of [[0.55, 4.3], [-0.6, 6.5]]) { const r = 4.4 - (y + 0.3) / 11 * 1.4 + 0.08, w = new THREE.Mesh(cachedGeo('hwin', () => new THREE.CircleGeometry(0.55, 18)), winM); w.position.set(Math.sin(a) * r, y, Math.cos(a) * r); w.rotation.y = a; g.add(w); const wf = new THREE.Mesh(cachedGeo('hwinf', () => new THREE.TorusGeometry(0.58, 0.09, 6, 20)), lam(0x8a6a4a)); wf.position.copy(w.position); wf.rotation.y = a; g.add(wf); }
    for (let k = 0; k < 4; k++) box(1.0 + k * 0.1, 0.18, 0.7, M_STONE, (k % 2 - 0.5) * 0.4, 0.05, 5.2 + k * 0.9, g);
    box(0.12, 2.4, 0.12, M_WOOD, 2.0, 1.2, 5.4, g); const lan = box(0.4, 0.5, 0.4, new THREE.MeshLambertMaterial({ color: 0xffe9a3, emissive: 0x8a6010 }), 2.0, 2.55, 5.4, g); void lan;
    const lgl = glow(2.2); lgl.position.set(2.0, 2.55, 5.4); lgl.material.opacity = 0.6; g.add(lgl);
    freeze(g); root.add(g);
    for (let k = 0; k < 8; k++) { const a = k * 0.8 + 0.2, rr = 2.6 + (k % 3) * 0.8; L.leaf.push({ g: CLUMPS[k % CLUMPS.length], m: mtx(H.x + Math.cos(a) * rr, y0 + 11.2 + (k % 3) * 1.2, H.z + Math.sin(a) * rr, R(), R() * 6, 0, 3.6 + R() * 1.2, 3.0, 3.6 + R() * 1.2), sway: [y0 + 10, 6], col: tint(1, 0.1) }); }
    groundBlob(H.x, H.z, 16); addCollider(H.x, H.z, 4.9); buildingDots.push([H.x, H.z, 5.5, '#8a5a36']);
  }
  // a giant fallen tree in the east
  {
    const lx = -436, lz = -696, ang = 0.2, y = height(lx, lz) + 1.0;
    const log = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.5, 16, 14), lam(0xffffff, barkTex)); log.rotation.set(0, ang, Math.PI / 2); log.position.set(lx, y, lz); root.add(log);
    const end = new THREE.Mesh(cachedGeo('logEnd', () => new THREE.CircleGeometry(1.5, 14)), lam(0xd9b98a)); end.position.set(lx - Math.cos(ang) * 8.02, y, lz + Math.sin(ang) * 8.02); end.rotation.y = ang - Math.PI / 2; root.add(end);
    for (let t = -7; t <= 7; t += 2) { addCollider(lx + Math.cos(ang) * t, lz - Math.sin(ang) * t, 1.6); if (t % 4 === 1) { const m = new THREE.Mesh(geoSphere(0.9, 10, 8), lam(0x6a9a48)); m.scale.set(1.2, 0.35, 0.9); m.position.set(lx + Math.cos(ang) * t, y + 1.25, lz - Math.sin(ang) * t); root.add(m); } }
    treeDots.push([lx, lz, 3]);
  }
  // the Leaflets' secret stash: an old hollow log, a heap of stolen Sunberries (shown by the story) and a very big footprint
  {
    const S = STASH_LOG, y = height(S.x, S.z) + 0.9;
    const log = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.1, 6, 14, 1, true), lam(0xffffff, barkTex, { side: THREE.DoubleSide })); log.rotation.set(0, 0.6, Math.PI / 2); log.position.set(S.x, y, S.z); root.add(log);
    addCollider(S.x + Math.cos(0.6) * 2, S.z - Math.sin(0.6) * 2, 1.1); addCollider(S.x - Math.cos(0.6) * 2, S.z + Math.sin(0.6) * 2, 1.1); addCollider(S.x, S.z, 1.1);
    const pile = new THREE.Group(); pile.position.set(STASH.x, height(STASH.x, STASH.z), STASH.z);
    const bm = new THREE.MeshLambertMaterial({ color: 0xffb43d, emissive: 0x9a6010 }), berries = [];
    for (let i = 0; i < 46; i++) { const a = i * 2.4, r = Math.sqrt(i / 46) * 1.4, hh = (1 - r / 1.5) * 0.8; berries.push({ g: geoSphere(0.15, 8, 6), m: mtx(Math.cos(a) * r, 0.12 + hh * (0.6 + (i % 3) * 0.2), Math.sin(a) * r) }); }
    pile.add(new THREE.Mesh(bake(berries), bm)); const pg = glow(4); pg.position.y = 0.8; pg.material.opacity = 0.55; pile.add(pg);
    pile.visible = false; root.add(pile); woodFx.pile = pile;
    const footTex = canvasTex(256, 320, (g) => {
      g.fillStyle = 'rgba(70,48,28,.55)'; g.beginPath(); g.ellipse(128, 200, 70, 100, 0, 0, Math.PI * 2); g.fill();
      for (const [x, y, r] of [[70, 92, 30], [128, 70, 34], [186, 92, 30]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = 'rgba(70,110,40,.6)'; for (let i = 0; i < 5; i++) { const a = Math.PI * (1.15 + i * 0.175), x = 128 + Math.cos(a) * 112, y = 120 + Math.sin(a) * 100; g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2); g.beginPath(); g.ellipse(0, 0, 9, 22, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
    }, null);
    const fx = STASH.x + 5, fz = STASH.z + 3;
    const fp = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 5.2), new THREE.MeshLambertMaterial({ map: footTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    fp.rotation.set(-Math.PI / 2, 0, 0.5); fp.position.set(fx, height(fx, fz) + 0.07, fz); fp.renderOrder = 2; root.add(fp);
  }
  // a thick, shady forest with a few ancient giants
  const want = isTouch ? 300 : 460; let placed = 0, guard = 0;
  for (const [x, z] of [[-470, -566], [-640, -424], [-704, -610], [-560, -704], [-452, -420], [-610, -500], [-540, -620]]) if (okWood(x, z, 6)) addBroadleaf(x, z, 3.0 + R() * 0.5, true);
  while (placed < want && guard++ < 20000) {
    const x = WMAP.x + (R() - 0.5) * 330, z = WMAP.z + (R() - 0.5) * 370;
    if (!okWood(x, z, 4)) continue;
    if (colliders.some((o) => Math.abs(o.x - x) < 4.2 && Math.abs(o.z - z) < 4.2 && Math.hypot(o.x - x, o.z - z) < 4.0)) continue;
    const kind = R();
    if (kind < 0.64) addBroadleaf(x, z, 1.3 + R() * 0.9, true); else if (kind < 0.76) addPine(x, z, 1.2 + R() * 0.6, true); else addBush(x, z, 1.1 + R() * 0.7);
    placed++;
  }
  // the ground is darker in the shade under the trees
  {
    const cell = 3, shade = new Map(), key = (x, z) => Math.floor(x / cell) + ',' + Math.floor(z / cell);
    for (const [x, z, r] of treeDots) { const rr = r * 1.6; for (let dx = -rr; dx <= rr; dx += cell) for (let dz = -rr; dz <= rr; dz += cell) { const d = Math.hypot(dx, dz); if (d > rr) continue; const k = key(x + dx, z + dz); shade.set(k, Math.max(shade.get(k) || 0, 1 - d / rr)); } }
    makeGround(480, 560, -560, -540, segs[0], segs[1], WPONDS, (x, z, c) => { const n = vnoise3(x * 0.07, 0.3, z * 0.07), s = (shade.get(key(x, z)) || 0) * 0.28; c[0] *= (0.7 - n * 0.06) * (1 - s); c[1] *= (0.84 + n * 0.05) * (1 - s * 0.7); c[2] *= 0.68 * (1 - s * 0.8); });
  }
  let rim = 0; guard = 0; const wantRim = isTouch ? 170 : 260;
  while (rim < wantRim && guard++ < 20000) {
    const x = WMAP.x + (R() - 0.5) * 460, z = WMAP.z + (R() - 0.5) * 500, d = edgeWood(x, z);
    if (d < -1.5 || d > 26 || !gateClear(x, z, 11) || x > -326) continue;
    if (R() < 0.45) addPine(x, z, 1.2 + R() * 0.7, false); else addBroadleaf(x, z, 1.3 + R() * 0.7, false, true);
    rim++;
  }
  for (let i = 0; i < 34; i++) { let x, z, g = 0; do { x = WMAP.x + (R() - 0.5) * 320; z = WMAP.z + (R() - 0.5) * 360; } while (!okWood(x, z, 3.5) && g++ < 60); if (g < 60) rocksAround([[x, z]], 0.6, 2.0, true); }
  // ferns, glowing mushrooms and pale blue flowers on the forest floor
  {
    const fernGeo = (() => { const ps = []; for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; ps.push({ g: geoSphere(1, 6, 4), m: mtx(Math.cos(a) * 0.45, 0.3, Math.sin(a) * 0.45, 0, -a, 0.7, 0.55, 0.05, 0.16) }); } const b = bake(ps); b.deleteAttribute('sway'); return b; })();
    const nF = isTouch ? 420 : 760, ferns = new THREE.InstancedMesh(fernGeo, new THREE.MeshLambertMaterial({ color: 0x4f8f3e }), nF);
    let i = 0, g = 0;
    while (i < nF && g++ < 8000) { const x = WMAP.x + (R() - 0.5) * 330, z = WMAP.z + (R() - 0.5) * 370; if (!okWood(x, z, 2.2)) continue; const s = 0.9 + R() * 0.9; _m4.compose(_tv.set(x, height(x, z), z), _q.setFromEuler(new THREE.Euler(0, R() * 6, 0)), V3(s, s, s)); ferns.setMatrixAt(i++, _m4); }
    ferns.count = i; root.add(ferns);
    const nM = isTouch ? 220 : 380;
    const caps = new THREE.InstancedMesh(cachedGeo('gmcap', () => new THREE.SphereGeometry(0.14, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2)), new THREE.MeshLambertMaterial({ color: 0x9ff5d2, emissive: 0x2f9a6e }), nM);
    const stems = new THREE.InstancedMesh(cachedGeo('gmstem', () => { const s = new THREE.CylinderGeometry(0.04, 0.05, 0.2, 5); s.translate(0, 0.1, 0); return s; }), new THREE.MeshLambertMaterial({ color: 0xf3ead6 }), nM);
    const centers = [[HOLLOW.x + 4, HOLLOW.z + 6], [HOLLOW.x - 6, HOLLOW.z + 3]];
    for (let k = 0; k < 60; k++) { let x, z, gg = 0; do { x = WMAP.x + (R() - 0.5) * 320; z = WMAP.z + (R() - 0.5) * 360; } while (!okWood(x, z, 2) && gg++ < 40); centers.push([x, z]); }
    i = 0; g = 0;
    while (i < nM && g++ < 6000) { const c = centers[i % centers.length], x = c[0] + (R() - 0.5) * 2.4, z = c[1] + (R() - 0.5) * 2.4; if (edgeWood(x, z) > -4 || distToRoad(x, z) < 1.6) continue; const s = 0.7 + R() * 1.1, y = height(x, z); _m4.compose(_tv.set(x, y, z), _q.setFromEuler(new THREE.Euler(0, 0, 0)), V3(s, s, s)); stems.setMatrixAt(i, _m4); _m4.compose(_tv.set(x, y + 0.19 * s, z), _q, V3(s, s * 0.85, s)); caps.setMatrixAt(i, _m4); i++; }
    caps.count = stems.count = i; root.add(caps, stems);
    const patches = []; for (let k = 0; k < 40; k++) { let x, z, gg = 0; do { x = WMAP.x + (R() - 0.5) * 320; z = WMAP.z + (R() - 0.5) * 360; } while (!okWood(x, z, 3) && gg++ < 40); patches.push([x, z, k % 3]); }
    addFlowers(patches, isTouch ? 260 : 460, (x, z) => okWood(x, z, 2.2), [0xa9dcff, 0xd7c6ff, 0xffffff], 4, 0xfff0a0);
  }
  addTufts(isTouch ? 1500 : 2800, () => [WMAP.x + (R() - 0.5) * 340, WMAP.z + (R() - 0.5) * 380], (x, z) => okWood(x, z, 2.2), 0x4f8a3a, false);
  addRays([[-450, -470], [-500, -530], [-560, -470], [-620, -500], [-580, -620], [-520, -600], [-660, -600], [-470, -640], [-700, -500], [-610, -680], [-440, -560], [-540, -420]], 0.24, 0xeaffc8);
  gateArch(GATES[4], 'Sunny Meadow\nLv. 1–4');
  gateArch(GATES[5], 'Breezy Hills\nLv. 3–5');
  gateArch(gateById('w_s'), 'Riverside\nLv. 6–8');
  {
    const bg = RW.burrowGate(); bg.root.position.set(BURROW_DOOR.x, height(BURROW_DOOR.x, BURROW_DOOR.z) - 0.15, BURROW_DOOR.z); bg.root.rotation.y = Math.PI / 2; root.add(bg.root);
    buildingDots.push([BURROW_DOOR.x, BURROW_DOOR.z, 3.2, '#5a3a22']);
    signPost(BURROW_DOOR.x + 4, BURROW_DOOR.z + 4.5, Math.PI / 2, 'Rootling Burrow\nLv. 5–8');
  }
  woodFx.flies = driftCloud(isTouch ? 50 : 80, 0.42, 0xf6ff9a, true);
  bakeLayers();
  MAPS.wood.mini = { x0: -745, z0: -745, x1: -375, z1: -335, ppm: 2 };
  MAPS.wood.miniCanvas = paintMini(MAPS.wood.mini, { out: '#3f6a35', in: '#73a35a', rim: '#557f41', tree: '#2f5a2a' }, {
    mid: (g) => { g.fillStyle = '#7fc7d8'; for (const p of WPONDS) { g.beginPath(); g.arc(p.x, p.z, p.r + 1, 0, Math.PI * 2); g.fill(); } }
  });
  MAPS.wood.built = true;
}
// ---------- shared bits for delivery 8 maps ----------
// glowing mushrooms in little clusters (instanced): centers is a list of [x, z]
function glowShrooms(n, centers, ok, capHex, glowHex) {
  const caps = new THREE.InstancedMesh(cachedGeo('gmcap', () => new THREE.SphereGeometry(0.14, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2)), new THREE.MeshLambertMaterial({ color: capHex || 0x9ff5d2, emissive: glowHex || 0x2f9a6e }), n);
  const stems = new THREE.InstancedMesh(cachedGeo('gmstem', () => { const s = new THREE.CylinderGeometry(0.04, 0.05, 0.2, 5); s.translate(0, 0.1, 0); return s; }), new THREE.MeshLambertMaterial({ color: 0xf3ead6 }), n);
  let i = 0, g = 0;
  while (i < n && g++ < n * 12) { const c = centers[i % centers.length], x = c[0] + (R() - 0.5) * 2.4, z = c[1] + (R() - 0.5) * 2.4; if (!ok(x, z)) continue; const s = 0.7 + R() * 1.2, y = height(x, z); _m4.compose(_tv.set(x, y, z), _q.setFromEuler(new THREE.Euler(0, 0, 0)), V3(s, s, s)); stems.setMatrixAt(i, _m4); _m4.compose(_tv.set(x, y + 0.19 * s, z), _q, V3(s, s * 0.85, s)); caps.setMatrixAt(i, _m4); i++; }
  caps.count = stems.count = i; root.add(caps, stems);
}

// ---------- Riverside ----------
const riverFx = { wheel: null, bugs: null };
function riverWater() {
  const N = 300, S = riverCurve.getSpacedPoints(N), half = RIVER_W + 1.6, pos = [], uv = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const p = S[i], t = riverCurve.getTangentAt(i / N), l = Math.hypot(t.x, t.z) || 1, nx = -t.z / l, nz = t.x / l;
    for (const s of [-1, 1]) { pos.push(p.x + nx * half * s, RIVER_WL, p.z + nz * half * s); uv.push(s < 0 ? 0 : 1, i / N); }
    if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uTime: timeU, deep: { value: new THREE.Color(0x2c7891) }, shallow: { value: new THREE.Color(0x8fd1cf) }, skyc: { value: new THREE.Color(0xd2e8f3) }, sunDir: { value: SUN_DIR }, fogColor: { value: FOG }, fogNear: { value: 60 }, fogFar: { value: 190 } },
    vertexShader: 'varying vec3 vW; varying float vD; varying float vU; void main(){ vU = uv.x; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: [
      'uniform float uTime; uniform vec3 deep; uniform vec3 shallow; uniform vec3 skyc; uniform vec3 sunDir; uniform vec3 fogColor; uniform float fogNear; uniform float fogFar; varying vec3 vW; varying float vD; varying float vU;',
      'void main(){',
      ' vec3 V = normalize(cameraPosition - vW); vec2 p = vW.xz + vec2(0.0, -uTime * 1.4);',
      ' float wx = cos(p.x * 1.9 + uTime * 1.5) * 0.05 + cos((p.x + p.y) * 3.7 + uTime * 2.3) * 0.025;',
      ' float wz = cos(p.y * 2.3 - uTime * 1.2) * 0.05 + cos((p.x - p.y) * 4.1 - uTime * 2.0) * 0.025;',
      ' vec3 N = normalize(vec3(wx, 1.0, wz));',
      ' float d = clamp(abs(vU * 2.0 - 1.0) * 1.12, 0.0, 1.0);',
      ' float depth = 1.0 - d * d;',
      ' vec3 col = mix(shallow, deep, depth);',
      ' float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);',
      ' col = mix(col, skyc, fres * 0.35);',
      ' float spec = pow(max(dot(N, normalize(sunDir + V)), 0.0), 160.0) * 1.3;',
      ' float glint = pow(max(0.0, sin(p.x * 7.0 + uTime * 2.6) * sin(p.y * 6.0 - uTime * 2.1)), 30.0) * 0.5;',
      ' float streak = smoothstep(0.86, 1.0, sin(p.y * 0.9 + sin(p.x * 0.7) * 2.0)) * 0.12 * depth;',
      ' col += vec3(1.0, 0.98, 0.9) * (spec + glint + streak);',
      ' float a = mix(0.3, 0.82, depth) + fres * 0.18 + spec + glint;',
      ' a *= smoothstep(1.0, 0.8, d);',
      ' gl_FragColor = vec4(mix(col, fogColor, smoothstep(fogNear, fogFar, vD)), clamp(a, 0.0, 0.95));',
      '}'
    ].join('\n')
  });
  waterMats.push(mat);
  const m = new THREE.Mesh(g, mat); m.renderOrder = 3; root.add(m);
}
function addBridge(b) {
  const g = new THREE.Group(); g.position.set(b.x, 0, b.z);
  for (let x = -b.hl; x <= b.hl + 0.01; x += 0.55) { const y = bridgeY(b, b.x + x), sl = (bridgeY(b, b.x + x + 0.1) - bridgeY(b, b.x + x - 0.1)) / 0.2; box(0.52, 0.16, b.hw * 2 + 0.2, M_WOOD, x, y - 0.08, 0, g).rotation.z = Math.atan(sl); }
  for (const s of [-1, 1]) {
    for (let x = -b.hl + 0.3; x <= b.hl; x += 2.1) box(0.16, 1.0, 0.16, M_WOOD, x, bridgeY(b, b.x + x) + 0.42, s * (b.hw + 0.05), g);
    for (let x = -b.hl + 0.3; x < b.hl - 1.5; x += 2.1) { const y0 = bridgeY(b, b.x + x) + 0.88, y1 = bridgeY(b, b.x + x + 2.1) + 0.88; box(2.15, 0.12, 0.12, M_WOOD, x + 1.05, (y0 + y1) / 2, s * (b.hw + 0.05), g).rotation.z = Math.atan2(y1 - y0, 2.1); }
  }
  for (const x of [-RIVER_W * 0.55, RIVER_W * 0.55]) box(0.8, 1.8, b.hw * 2, M_STONE, x, bridgeY(b, b.x + x) - 1.05, 0, g);
  freeze(g); root.add(g);
  roads.push({ samples: [V3(b.x - b.hl, 0, b.z), V3(b.x + b.hl, 0, b.z)], width: b.hw * 2, dirt: false });
}
const okRiverBase = (x, z) => edgeRiver(x, z) < -6 && riverDist(x, z) > RIVER_W + 4 && gateClear(x, z, 10) && chestClear(x, z, 3.5) && Math.hypot(x - MILL.x, z - MILL.z) > 10 && Math.hypot(x - DOCK.x, z - DOCK.z) > 8 && WAYSTONES.every((w) => Math.hypot(x - w.x, z - w.z) > 4);
function buildRiver() {
  beginMap('river', 33019); buildId = 'river'; leafBase = 1.02;
  const segs = isTouch ? [150, 160] : [200, 214];
  const B1 = BRIDGES[0], B2 = BRIDGES[1];
  roadRibbon([[747, -300], [790, -296], [830, -282], [862, -262], [B2.x - B2.hl - 1.2, B2.z]], 3.6, dirtTex);
  roadRibbon([[B2.x + B2.hl + 1.2, B2.z], [985, -252], [1022, -284], [1053, -300]], 3.6, dirtTex);
  roadRibbon([[870, -462], [874, -430], [898, -392], [B1.x - B1.hl - 1.2, B1.z]], 3.2, dirtTex);
  roadRibbon([[B1.x + B1.hl + 1.2, B1.z], [984, -360], [1002, -318], [1022, -284]], 3.2, dirtTex);
  roadRibbon([[830, -282], [870, -294], [MILL.x - 8, MILL.z - 1]], 2.6, dirtTex);
  roadRibbon([[B1.x + B1.hl + 1.2, B1.z], [DOCK.x + 6, DOCK.z + 12], [DOCK.x + 3, DOCK.z + 1]], 2.4, dirtTex);
  const okRiver = (x, z, gap) => okRiverBase(x, z) && distToRoad(x, z) >= gap;
  // the ground: sandy banks and a pebbly river bed
  makeGround(440, 470, 900, -300, segs[0], segs[1], [], (x, z, c) => {
    const n = vnoise3(x * 0.06, 2.2, z * 0.06), dr = riverDist(x, z);
    c[0] *= 1.0 - n * 0.04; c[1] *= 1.02 + n * 0.04; c[2] *= 0.8;
    if (dr < RIVER_W + 3) { const t = smoothstep(RIVER_W + 3, RIVER_W - 0.5, dr); c[0] = lerp(c[0], 0.96, t); c[1] = lerp(c[1], 0.86, t); c[2] = lerp(c[2], 0.64, t); }
  }, dryRiver);
  riverWater();
  for (const b of BRIDGES) addBridge(b);
  // the watermill: the house on the bank, the wheel turning in the water
  {
    const mill = RW.watermill(); mill.root.position.set(MILL.x, Math.min(height(MILL.x, MILL.z) - 0.1, RIVER_WL - 0.25), MILL.z); root.add(mill.root);
    riverFx.wheel = mill.wheel; addCollider(MILL.x - 0.3, MILL.z, 2.4); buildingDots.push([MILL.x, MILL.z, 3, '#f1e6cf']);
    addBarrels(MILL.x - 3.2, MILL.z - 2.6);
    for (const [dx, dz] of [[-2.6, 2.4], [-3.4, 1.6]]) { const sx = MILL.x + dx, sz = MILL.z + dz; const sack = new THREE.Mesh(geoSphere(0.4, 10, 8), lam(0xe8d5a0)); sack.scale.set(1, 0.8, 0.9); sack.position.set(sx, height(sx, sz) + 0.3, sz); root.add(sack); }
  }
  // the fishing dock: a little pier, a stool, a bucket and a rod (fishing comes in a later delivery)
  {
    const y = RIVER_BANK + 0.25, g = new THREE.Group(); g.position.set(DOCK.x, 0, DOCK.z);
    for (let x = 0.6; x >= -6.6; x -= 0.5) box(0.46, 0.12, 2.2, M_WOOD, x, y, 0, g);
    for (const x of [-6.3, -3.2, 0.2]) for (const s of [-1, 1]) box(0.2, 1.8, 0.2, M_WOOD, x, y - 0.8, s * 0.95, g);
    box(0.5, 0.06, 0.5, M_WOOD, -5, y + 0.48, 0.3, g); for (const [a, c] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) box(0.06, 0.42, 0.06, M_WOOD, -5 + a, y + 0.26, 0.3 + c, g);
    part(geoCyl(0.22, 0.18, 0.36, 12), lam(0x8a9aa6), 0.012, g, -4.1, y + 0.24, -0.5);
    const rod = part(geoCyl(0.022, 0.035, 3.4, 6), lam(0x9a7448), 0.008, g, -6.1, y + 1.2, 0.75); rod.rotation.z = 0.95;
    freeze(g); root.add(g); addCollider(DOCK.x + 0.4, DOCK.z, 1.0);
    signPost(DOCK.x + 2.6, DOCK.z - 2.4, Math.PI / 2, 'Fishing Dock\nBoat to Coralcove');
  }
  // reeds and cattails along both banks, lily pads in the slow water, pebbles on the shore
  {
    const reedGeo = (() => { const ps = []; for (let k = 0; k < 4; k++) { const c = new THREE.ConeGeometry(0.04, 1.3 + k * 0.15, 3); c.translate(0, 0.65 + k * 0.07, 0); ps.push({ g: c, m: new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler((k - 1.5) * 0.12, k * 1.6, (k - 1.5) * 0.1)).setPosition((k - 1.5) * 0.08, 0, (k % 2) * 0.07) }); } const cat = new THREE.CylinderGeometry(0.06, 0.06, 0.28, 6); cat.translate(0, 1.45, 0); ps.push({ g: cat, m: new THREE.Matrix4() }); const b = bake(ps); b.deleteAttribute('sway'); return b; })();
    const nR = isTouch ? 260 : 420, reeds = new THREE.InstancedMesh(reedGeo, new THREE.MeshLambertMaterial({ color: 0x6f9a48 }), nR);
    let i = 0, g = 0;
    while (i < nR && g++ < 6000) {
      const z = -500 + R() * 410, side = R() < 0.5 ? -1 : 1, x = riverCx(z) + side * (RIVER_W - 0.6 + R() * 2.6);
      if (onBridge(x, z) || Math.abs(z - B1.z) < 4 || Math.abs(z - B2.z) < 4 || Math.hypot(x - MILL.x, z - MILL.z) < 5 || Math.abs(z - DOCK.z) < 3 || edgeRiver(x, z) > -4) continue;
      const s = 0.7 + R() * 0.6; _m4.compose(_tv.set(x, Math.max(height(x, z), RIVER_WL) - 0.05, z), _q.setFromEuler(new THREE.Euler(0, R() * 6, 0)), V3(s, s, s)); reeds.setMatrixAt(i++, _m4);
    }
    reeds.count = i; root.add(reeds);
    const padMat = new THREE.MeshLambertMaterial({ color: 0x5fae45, side: THREE.DoubleSide }), flMat = new THREE.MeshLambertMaterial({ color: 0xffb3c6 });
    for (let k = 0; k < 46; k++) {
      const z = -490 + R() * 400, side = R() < 0.5 ? -1 : 1, x = riverCx(z) + side * (RIVER_W - 1.8 - R() * 1.6);
      if (onBridge(x, z) || Math.abs(z - B1.z) < 4 || Math.abs(z - B2.z) < 4) continue;
      const pad = new THREE.Mesh(new THREE.CircleGeometry(0.6 + R() * 0.35, 14, 0.4, Math.PI * 2 - 0.7), padMat); pad.rotation.x = -Math.PI / 2; pad.rotation.z = R() * 6; pad.position.set(x, RIVER_WL + 0.03, z); root.add(pad);
      if (k % 4 === 0) { const fl = new THREE.Mesh(geoSphere(0.15, 8, 6), flMat); fl.position.set(x, RIVER_WL + 0.13, z); root.add(fl); }
    }
    for (let k = 0; k < 90; k++) {
      const z = -500 + R() * 410, side = R() < 0.5 ? -1 : 1, x = riverCx(z) + side * (RIVER_W + 0.8 + R() * 2.5);
      if (onBridge(x, z) || edgeRiver(x, z) > -4) continue;
      const s = 0.25 + R() * 0.45; L.rock.push({ g: ROCKS[k % 4], m: mtx(x, height(x, z) + 0.06, z, 0, R() * 6, 0, s * 1.3, s * 0.55, s) });
    }
  }
  // willows and alders by the water, a few big oaks, a wooded rim
  const groves = [[800, -220], [820, -380], [790, -440], [1000, -200], [1020, -400], [980, -440], [850, -160], [1010, -140], [860, -330], [985, -300], [770, -150], [1040, -230]];
  let placed = 0, guard = 0; const want = isTouch ? 110 : 170;
  for (const [x, z] of [[812, -330], [990, -200], [850, -420]]) if (okRiver(x, z, 6)) addBroadleaf(x, z, 2.4, true);
  while (placed < want && guard++ < 8000) {
    const c = groves[Math.floor(R() * groves.length)], x = c[0] + (R() - 0.5) * 40, z = c[1] + (R() - 0.5) * 40;
    if (!okRiver(x, z, 4.5)) continue;
    if (colliders.some((o) => Math.abs(o.x - x) < 4.6 && Math.abs(o.z - z) < 4.6 && Math.hypot(o.x - x, o.z - z) < 4.4)) continue;
    const kind = R();
    if (kind < 0.6) addBroadleaf(x, z, 0.9 + R() * 0.6, true); else if (kind < 0.82) addPine(x, z, 0.9 + R() * 0.5, true); else addBush(x, z, 0.9 + R() * 0.5);
    placed++;
  }
  let rim = 0; guard = 0; const wantRim = isTouch ? 150 : 240;
  while (rim < wantRim && guard++ < 20000) {
    const x = 900 + (R() - 0.5) * 420, z = -300 + (R() - 0.5) * 450, d = edgeRiver(x, z);
    if (d < -1.5 || d > 26 || !gateClear(x, z, 11) || riverDist(x, z) < RIVER_W + 3) continue;
    if (R() < 0.55) addPine(x, z, 1.1 + R() * 0.7, false); else addBroadleaf(x, z, 1.1 + R() * 0.6, false, true);
    rim++;
  }
  for (let i = 0; i < 30; i++) { let x, z, g = 0; do { x = 900 + (R() - 0.5) * 300; z = -300 + (R() - 0.5) * 320; } while (!okRiver(x, z, 3.5) && g++ < 60); if (g < 60) rocksAround([[x, z]], 0.6, 1.9, true); }
  for (let i = 0; i < 100; i++) { const x = 900 + (R() - 0.5) * 420, z = -300 + (R() - 0.5) * 450, d = edgeRiver(x, z); if (d < 2 || d > 30 || riverDist(x, z) < RIVER_W + 4) continue; const s = 3 + R() * 3.5; L.rock.push({ g: ROCKS[i % 4], m: mtx(x, height(x, z) + s * 0.4, z, 0, R() * 6, 0, s * 1.1, s * (1.2 + R() * 1.2), s) }); }
  {
    const patches = []; for (let k = 0; k < 44; k++) { let x, z, g = 0; do { x = 900 + (R() - 0.5) * 300; z = -300 + (R() - 0.5) * 320; } while (!okRiver(x, z, 3) && g++ < 40); patches.push([x, z, k % 3]); }
    addFlowers(patches, isTouch ? 320 : 560, (x, z) => okRiver(x, z, 2.2), [0x9fd0ff, 0xffffff, 0xfff0a0], 4.5, 0xf4c542);
  }
  addTufts(isTouch ? 2200 : 4200, () => [900 + (R() - 0.5) * 330, -300 + (R() - 0.5) * 350], (x, z) => edgeRiver(x, z) < -3 && distToRoad(x, z) > 2.4 && riverDist(x, z) > RIVER_W + 1.5, 0x6aa04a, false);
  addRays([[820, -240], [980, -260], [850, -400], [1000, -420], [880, -180]], 0.12);
  gateArch(gateById('r_w'), 'Sunny Meadow\nLv. 1–4');
  gateArch(gateById('r_n'), 'Whisperwood\nLv. 5–7');
  gateArch(gateById('r_e'), 'Thornbush\nLv. 8–10');
  signPost(MILL.x - 9, MILL.z + 3.5, -Math.PI / 2, 'Old Watermill');
  riverFx.bugs = driftCloud(isTouch ? 40 : 70, 0.3, 0xdff6ff, true);
  bakeLayers();
  MAPS.river.mini = { x0: 725, z0: -485, x1: 1075, z1: -115, ppm: 2 };
  MAPS.river.miniCanvas = paintMini(MAPS.river.mini, { out: '#5f8a44', in: '#9ccb66', rim: '#7aa850', tree: '#3f7a32', inAt: (x, z) => riverDist(x, z) < RIVER_W + 0.5 ? '#6fb6cf' : riverDist(x, z) < RIVER_W + 2.5 ? '#d9cfa0' : '#9ccb66' }, {
    mid: (g) => { g.fillStyle = '#b08a5a'; for (const b of BRIDGES) g.fillRect(b.x - b.hl, b.z - b.hw, b.hl * 2, b.hw * 2); g.fillRect(DOCK.x - 6.6, DOCK.z - 1.1, 7, 2.2); }
  });
  MAPS.river.built = true;
}

// ---------- Thornbush ----------
const thornFx = { pollen: null };
const HIVES = [{ x: 962, z: -846 }, { x: 1012, z: -932 }, { x: 872, z: -878 }];
const BRAMBLES = [[832, -858], [884, -826], [942, -902], [986, -966], [860, -952], [800, -922], [936, -1000], [1032, -862], [902, -790], [962, -806], [1030, -1010], [820, -1000]];
function buildThorn() {
  beginMap('thorn', 61007); buildId = 'thorn'; leafBase = 0.84;
  const segs = isTouch ? [150, 150] : [200, 200];
  roadRibbon([[747, -900], [800, -906], [850, -926], [890, -966], [903, -1008], [905, -1026]], 3.4, dirtTex);
  roadRibbon([[850, -926], [900, -905], [950, -890], [1000, -872]], 3.0, dirtTex);
  const okThorn = (x, z, gap) => edgeThorn(x, z) < -6 && distToRoad(x, z) >= gap && gateClear(x, z, 10) && chestClear(x, z, 3.5) && Math.hypot(x - CAVE.x, z - CAVE.z) > 20 && HIVES.every((h) => Math.hypot(x - h.x, z - h.z) > 5) && WAYSTONES.every((w) => Math.hypot(x - w.x, z - w.z) > 4);
  makeGround(440, 440, 900, -900, segs[0], segs[1], [], (x, z, c) => { const n = vnoise3(x * 0.06, 0.9, z * 0.06), h = heightThorn(x, z); c[0] *= 1.02 + n * 0.06; c[1] *= 0.92; c[2] *= 0.72; const k = clamp((h - 3) / 8, 0, 1) * 0.08; c[0] += k; c[1] += k * 0.6; });
  // bramble thickets: dark bushes full of thorns and purple berries (solid, you walk around them)
  const thorns = [], berries = [];
  for (const [cx, cz] of BRAMBLES) {
    const n = 6 + Math.floor(R() * 4);
    for (let k = 0; k < n; k++) {
      const a = R() * Math.PI * 2, r = R() * 5, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
      if (!okThorn(x, z, 3)) continue;
      const s = 1.0 + R() * 0.6, y = height(x, z); addBush(x, z, s); addCollider(x, z, 1.0 * s); treeDots.push([x, z, 1.4 * s]);
      for (let t = 0; t < 12; t++) { const ta = R() * Math.PI * 2, el = R() * 1.1, d = V3(Math.cos(ta) * Math.cos(el), Math.sin(el) * 0.8 + 0.15, Math.sin(ta) * Math.cos(el)).normalize(); thorns.push({ g: geoCone(0.05, 0.24, 5), m: mdir(V3(x + d.x * 0.95 * s, y + 0.6 * s + d.y * 0.6 * s, z + d.z * 0.95 * s), d, 1) }); }
      for (let t = 0; t < 5; t++) { const ta = R() * Math.PI * 2; berries.push({ g: geoSphere(0.09, 8, 6), m: mtx(x + Math.cos(ta) * 0.9 * s, y + (0.5 + R() * 0.6) * s, z + Math.sin(ta) * 0.9 * s) }); }
    }
  }
  if (thorns.length) root.add(new THREE.Mesh(bake(thorns), lam(0xe8d8a8, null, { vertexColors: true })));
  if (berries.length) root.add(new THREE.Mesh(bake(berries), lam(0x7a3a8a, null, { vertexColors: true })));
  // beehives on old stumps, where the Bramblebees live
  for (const H of HIVES) {
    const y = height(H.x, H.z), g = new THREE.Group(); g.position.set(H.x, y, H.z);
    part(geoCyl(0.75, 0.95, 1.3, 12), lam(0xffffff, barkTex), 0.02, g, 0, 0.6, 0);
    part(geoCyl(0.72, 0.72, 0.05, 12), lam(0xd9b98a), 0.01, g, 0, 1.27, 0);
    for (const [hy, r] of [[1.55, 0.6], [1.95, 0.52], [2.3, 0.4], [2.58, 0.25]]) part(geoSphere(r, 14, 10), lam(0xe8b44a), 0.018, g, 0, hy, 0).scale.y = 0.62;
    part(geoSphere(0.12, 10, 8), lam(0x3b2a1e), 0, g, 0, 1.75, 0.55).scale.set(1, 0.8, 0.4);
    const gl = glow(1.8); gl.position.y = 2; gl.material.opacity = 0.3; g.add(gl);
    freeze(g); root.add(g); addCollider(H.x, H.z, 1.1); buildingDots.push([H.x, H.z, 1.6, '#e8b44a']);
  }
  // Pebble Cave: a cliff of big rocks with a dark mouth, blocked by boulders (it opens in the next delivery)
  {
    const y = height(CAVE.x, CAVE.z);
    for (let k = -6; k <= 6; k++) {
      const back = Math.abs(k) <= 1, x = CAVE.x + k * 4.4 + (R() - 0.5) * 1.2, z = CAVE.z - (back ? 8 : 4.5) - Math.abs(k) * 0.5 + (R() - 0.5) * 1.2, s = back ? 5.5 : 4 + R() * 2.5;
      L.rock.push({ g: ROCKS[(k + 6) % 4], m: mtx(x, height(x, z) + s * 0.5, z, 0, R() * 6, 0, s * 1.15, s * (1.5 + R() * 0.5), s) }); addCollider(x, z, s * 0.95);
    }
    for (const [dx, dy] of [[-2.6, 4.6], [0, 5.4], [2.7, 4.5]]) L.rock.push({ g: ROCKS[1], m: mtx(CAVE.x + dx, y + dy, CAVE.z - 1.6, 0, R() * 6, 0, 1.8, 1.3, 1.5) });
    const hole = new THREE.Mesh(new THREE.CircleGeometry(2.6, 24), new THREE.MeshBasicMaterial({ color: 0x15100c })); hole.position.set(CAVE.x, y + 2.2, CAVE.z - 1.2); hole.scale.y = 1.15; root.add(hole);
    // the boulders and roots in the doorway: Bolt smashes them in delivery 9 (removable, so not baked)
    const blk = new THREE.Group(); root.add(blk); thornFx.caveRocks = blk; thornFx.caveCols = []; thornFx.caveSpec = [];
    const rmat = lam(0xffffff, rockTex, { vertexColors: true });
    for (const [dx, dz, s] of [[-1.6, 0.6, 1.5], [1.7, 0.4, 1.6], [0.1, 1.4, 1.4]]) {
      const x = CAVE.x + dx, z = CAVE.z + dz, r = new THREE.Mesh(ROCKS[Math.floor(R() * 4)], rmat);
      r.position.set(x, height(x, z) + s * 0.3, z); r.rotation.set(R() * 0.3, R() * 6, R() * 0.3); r.scale.set(s * 1.2, s, s); blk.add(r);
      thornFx.caveSpec.push([x, z, s * 1.05]);
    }
    const bark = lam(0xffffff, barkTex);
    for (const [a, l] of [[-0.5, 5], [0.4, 5.5], [1.4, 4.4], [-1.3, 4.6]]) { const rt = new THREE.Mesh(cachedGeo('cvroot', () => new THREE.CylinderGeometry(0.22, 0.42, 1, 7)), bark); rt.scale.set(1, l, 1); rt.position.set(CAVE.x + Math.sin(a) * 1.6, y + 2.4, CAVE.z - 0.6); rt.rotation.z = a * 0.8; blk.add(rt); }
    buildingDots.push([CAVE.x, CAVE.z, 3, '#8f8a80']);
    signPost(CAVE.x + 5.5, CAVE.z + 7, 0, 'Pebble Cave\nLv. 9–12');
  }
  // dry grass, purple heather, pines and twisted oaks, a rocky rim
  let placed = 0, guard = 0; const want = isTouch ? 70 : 110;
  while (placed < want && guard++ < 8000) {
    const x = 900 + (R() - 0.5) * 300, z = -900 + (R() - 0.5) * 300;
    if (!okThorn(x, z, 5)) continue;
    if (colliders.some((o) => Math.abs(o.x - x) < 5 && Math.abs(o.z - z) < 5 && Math.hypot(o.x - x, o.z - z) < 4.8)) continue;
    if (R() < 0.45) addPine(x, z, 0.9 + R() * 0.5, true); else addBroadleaf(x, z, 0.8 + R() * 0.5, true);
    placed++;
  }
  let rim = 0; guard = 0; const wantRim = isTouch ? 130 : 200;
  while (rim < wantRim && guard++ < 20000) {
    const x = 900 + (R() - 0.5) * 420, z = -900 + (R() - 0.5) * 420, d = edgeThorn(x, z);
    if (d < -1.5 || d > 26 || !gateClear(x, z, 11) || Math.hypot(x - CAVE.x, z - CAVE.z) < 30) continue;
    if (R() < 0.7) addPine(x, z, 1.1 + R() * 0.7, false); else addBroadleaf(x, z, 1.0 + R() * 0.6, false, true);
    rim++;
  }
  for (let i = 0; i < 46; i++) { let x, z, g = 0; do { x = 900 + (R() - 0.5) * 300; z = -900 + (R() - 0.5) * 300; } while (!okThorn(x, z, 3.5) && g++ < 60); if (g < 60) rocksAround([[x, z]], 0.7, 2.4, true); }
  for (let i = 0; i < 120; i++) { const x = 900 + (R() - 0.5) * 420, z = -900 + (R() - 0.5) * 420, d = edgeThorn(x, z); if (d < 2 || d > 30) continue; const s = 3 + R() * 3.5; L.rock.push({ g: ROCKS[i % 4], m: mtx(x, height(x, z) + s * 0.4, z, 0, R() * 6, 0, s * 1.1, s * (1.2 + R() * 1.2), s) }); }
  {
    const patches = []; for (let k = 0; k < 50; k++) { let x, z, g = 0; do { x = 900 + (R() - 0.5) * 300; z = -900 + (R() - 0.5) * 300; } while (!okThorn(x, z, 3) && g++ < 40); patches.push([x, z, k % 3]); }
    addFlowers(patches, isTouch ? 360 : 640, (x, z) => okThorn(x, z, 2.2), [0xc9a0ff, 0xffb3e0, 0xb88ae0], 5, 0xfff0a0);
  }
  addTufts(isTouch ? 2200 : 4200, () => [900 + (R() - 0.5) * 330, -900 + (R() - 0.5) * 330], (x, z) => edgeThorn(x, z) < -3 && distToRoad(x, z) > 2.4, 0x9a9a48, true);
  gateArch(gateById('t_w'), 'Riverside\nLv. 6–8');
  thornFx.pollen = driftCloud(isTouch ? 50 : 90, 0.3, 0xffe9a0, false);
  bakeLayers();
  MAPS.thorn.mini = { x0: 725, z0: -1075, x1: 1075, z1: -725, ppm: 2 };
  MAPS.thorn.miniCanvas = paintMini(MAPS.thorn.mini, { out: '#6f7a44', in: '#b2b86e', rim: '#8f945a', tree: '#5a4a6a' });
  MAPS.thorn.built = true;
  applyCaveMouth();
}
function applyCaveMouth() {
  if (!thornFx.caveRocks) return;
  thornFx.caveRocks.visible = !caveMouthOpen;
  for (const c of thornFx.caveCols) removeCollider(c);
  thornFx.caveCols = caveMouthOpen ? [] : thornFx.caveSpec.map(([x, z, r]) => addCollider(x, z, r));
}
function openCaveMouth(on) { if (caveMouthOpen === !!on) return; caveMouthOpen = !!on; applyCaveMouth(); }

// ---------- Rootling Burrow ----------
const burrowFx = { spores: null };
function buildBurrow() {
  beginMap('burrow', 40409); buildId = 'burrow'; leafBase = 0.7;
  makeGround(170, 250, 1520, -240, isTouch ? 130 : 170, isTouch ? 190 : 250, [], (x, z, c) => { const n = vnoise3(x * 0.1, 5.1, z * 0.1); c[0] *= 0.66 + n * 0.1; c[1] *= 0.52 + n * 0.06; c[2] *= 0.38; }, null, [0.42, 0.33, 0.25, 6]);
  const bark = lam(0xffffff, barkTex);
  const wallPts = []; // spots just inside the walls, for roots, mushrooms and lamps
  for (let i = 0; i < 4000 && wallPts.length < 260; i++) { const x = 1480 + R() * 90, z = -345 + R() * 210, d = edgeBurrow(x, z); if (d > -3 && d < -1.3) wallPts.push([x, z]); }
  // roots that come down the walls and arch over the tunnels
  for (let i = 0; i < wallPts.length; i += 5) {
    const [x, z] = wallPts[i], y = height(x, z), s = 0.7 + R() * 0.6;
    const r = new THREE.Mesh(cachedGeo('broot', () => new THREE.CylinderGeometry(0.18, 0.4, 7, 7)), bark); r.scale.setScalar(s);
    let gx = 0, gz = 0; for (const [cx, cz] of BROOMS) { const dd = Math.hypot(cx - x, cz - z); if (!gx || dd < Math.hypot(gx - x, gz - z)) { gx = cx; gz = cz; } }
    const ang = Math.atan2(gx - x, gz - z); r.position.set(x - Math.sin(ang) * 1.2, y + 2.6 * s, z - Math.cos(ang) * 1.2); r.rotation.set(Math.cos(ang) * 0.5, 0, -Math.sin(ang) * 0.5); root.add(r);
  }
  for (const [ax, az, bx, bz, w] of BHALLS) for (const t of [0.3, 0.7]) {
    const x = ax + (bx - ax) * t, z = az + (bz - az) * t, arc = new THREE.Mesh(cachedGeo('barch', () => new THREE.TorusGeometry(4.2, 0.35, 7, 18, Math.PI)), bark);
    arc.position.set(x, height(x, z) - 0.4, z); arc.rotation.y = Math.atan2(bx - ax, bz - az); root.add(arc);
  }
  // the boss room: a ring of old root pillars and a great stump at the back
  for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2, x = BOSS_ROOM.x + Math.cos(a) * (BOSS_ROOM.r - 2.5), z = BOSS_ROOM.z + Math.sin(a) * (BOSS_ROOM.r - 2.5); if (Math.abs(Math.sin(a) - 1) < 0.25) continue; const p = new THREE.Mesh(cachedGeo('bpil', () => new THREE.CylinderGeometry(0.6, 1.1, 12, 9)), bark); p.position.set(x, height(x, z) + 5, z); p.rotation.z = (R() - 0.5) * 0.2; root.add(p); addCollider(x, z, 1.1); }
  { const x = BOSS_ROOM.x, z = BOSS_ROOM.z - BOSS_ROOM.r + 4, st = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.4, 2.2, 16), bark); st.position.set(x, height(x, z) + 1, z); root.add(st); const top = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 2.55, 0.06, 16), lam(0xd9b98a)); top.position.set(x, height(x, z) + 2.12, z); root.add(top); addCollider(x, z, 3.2); }
  // glowing mushrooms, lamps of glowing caps, rocks
  glowShrooms(isTouch ? 200 : 320, wallPts, (x, z) => edgeBurrow(x, z) < -1.2);
  for (let i = 2; i < wallPts.length; i += 13) { const [x, z] = wallPts[i], gl = glow(2.6); gl.position.set(x, height(x, z) + 1.0, z); gl.material.color = new THREE.Color(0x9ff5d2); gl.material.opacity = 0.5; root.add(gl); }
  for (let i = 4; i < wallPts.length; i += 9) rocksAround([wallPts[i]], 0.5, 1.4, false);
  addTufts(isTouch ? 300 : 600, () => [1480 + R() * 90, -345 + R() * 210], (x, z) => edgeBurrow(x, z) < -2, 0x5a6a3a, false);
  gateArch(gateById('b_out'), null);
  signPost(1506, -144, Math.PI, 'Rootling Burrow\nThe Old Rootling sleeps below');
  burrowFx.spores = driftCloud(isTouch ? 50 : 80, 0.36, 0x9ff5d2, true);
  bakeLayers();
  MAPS.burrow.mini = { x0: 1440, z0: -360, x1: 1600, z1: -120, ppm: 2 };
  MAPS.burrow.miniCanvas = paintMini(MAPS.burrow.mini, { out: '#2a2018', in: '#7a6040', rim: '#4a3a2a', tree: '#3a2a1a' });
  MAPS.burrow.built = true;
}
// ---------- Pebble Cave (delivery 9) ----------
const caveFx = { motes: null, doors: [], torches: [], buttons: [], boulder: null, plate: null, tablet: null, crystals: [], sunbeam: null };
function buildCave() {
  beginMap('cave', 50919); buildId = 'cave'; leafBase = 0.7;
  makeGround(150, 290, 1515, -750, isTouch ? 120 : 150, isTouch ? 230 : 290, [], (x, z, c) => { const n = vnoise3(x * 0.09, 6.3, z * 0.09); c[0] = 0.78 + n * 0.12; c[1] = 0.76 + n * 0.1; c[2] = 0.82 + n * 0.12; }, null, [0.5, 0.48, 0.54, 6], caveFloorTex);
  const wallPts = [];
  for (let i = 0; i < 6000 && wallPts.length < 360; i++) { const x = 1475 + R() * 95, z = -880 + R() * 255, d = edgeCave(x, z); if (d > -3 && d < -1.3) wallPts.push([x, z]); }
  // big rocks and stalagmites along the walls, crystals that glow blue and violet
  for (let i = 0; i < wallPts.length; i += 3) { const [x, z] = wallPts[i], s = 1.2 + R() * 1.6; L.rock.push({ g: ROCKS[i % 4], m: mtx(x, height(x, z) + s * 0.2, z, R() * 0.3, R() * 6, R() * 0.3, s, s * (1.1 + R() * 0.9), s) }); }
  const stal = []; for (let i = 1; i < wallPts.length; i += 4) { const [x, z] = wallPts[i], h = 1.4 + R() * 2.6; stal.push({ g: geoCone(0.35 + R() * 0.25, h, 7), m: mtx(x, height(x, z) + h / 2, z, 0, R() * 6, 0, 1, 1, 1) }); }
  root.add(new THREE.Mesh(bake(stal), lam(0xb9b2a6, rockTex, { vertexColors: true })));
  const cMats = [new THREE.MeshLambertMaterial({ color: 0x9fd8ff, emissive: 0x2a6fa8 }), new THREE.MeshLambertMaterial({ color: 0xd2b0ff, emissive: 0x5a3a9a })];
  for (let i = 2; i < wallPts.length; i += 7) {
    const [x, z] = wallPts[i], y = height(x, z), g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = R() * 6; const mat = cMats[i % 2];
    for (let k = 0; k < 3; k++) { const h = 0.7 + R() * 1.1; const c = part(geoCone(0.18 + R() * 0.1, h, 6), mat, 0.015, g, (R() - 0.5) * 0.6, h / 2 - 0.05, (R() - 0.5) * 0.6); c.rotation.set((R() - 0.5) * 0.7, 0, (R() - 0.5) * 0.7); }
    if (i % 3 === 2) { const gl = glow(2.4); gl.material.color = new THREE.Color(i % 2 ? 0xc9a8ff : 0x9fd8ff); gl.material.opacity = 0.45; gl.position.y = 0.9; g.add(gl); caveFx.crystals.push(gl); }
    root.add(g);
  }
  for (let i = 4; i < wallPts.length; i += 10) rocksAround([wallPts[i]], 0.4, 1.0, false);
  // pebbles scattered on the floor
  for (let i = 0; i < 70; i++) { const x = 1480 + R() * 85, z = -875 + R() * 250; if (edgeCave(x, z) > -3) continue; rocksAround([[x, z]], 0.12, 0.3, false); }
  // stone doors: grey slabs with a carved sun, they sink into the floor when opened
  const doorMat = lam(0xc9c2b4, rockTex), sunMat = new THREE.MeshLambertMaterial({ color: 0xffd36e, emissive: 0x6a4a10 });
  CAVE_DOORS.forEach((D, i) => {
    const hall = CHALLS[i + 1], ang = Math.atan2(hall[2] - hall[0], hall[3] - hall[1]);
    const g = new THREE.Group(); g.position.set(D.x, height(D.x, D.z), D.z); g.rotation.y = ang;
    const slab = new THREE.Group(); g.add(slab);
    part(geoBox(8.4, 5.2, 0.9), doorMat, 0.03, slab, 0, 2.6, 0);
    const sun = part(new THREE.CircleGeometry(0.75, 20), sunMat, 0, slab, 0, 3.0, 0.47);
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, ray = part(geoBox(0.16, 0.5, 0.06), sunMat, 0, slab, Math.cos(a) * 1.1, 3.0 + Math.sin(a) * 1.1, 0.47); ray.rotation.z = a - Math.PI / 2; }
    for (const s of [-1, 1]) part(geoBox(1.2, 6.2, 1.4), lam(0xa79f92, rockTex), 0.03, g, s * 4.6, 3.1, 0);
    part(geoBox(10.4, 1.0, 1.5), lam(0xa79f92, rockTex), 0.03, g, 0, 6.2, 0);
    root.add(g);
    if (D.open) slab.position.y = -5.4;
    caveFx.doors.push({ D, g, slab, sun, t: D.open ? 1 : 0 });
  });
  // torch hall: four old torches on stone stands
  for (const [x, z] of CAVE_PUZ.torches) {
    const g = new THREE.Group(); g.position.set(x, height(x, z), z);
    part(geoCyl(0.45, 0.6, 0.5, 8), lam(0xa79f92, rockTex), 0.02, g, 0, 0.25, 0);
    part(geoCyl(0.12, 0.16, 1.6, 7), M_WOOD, 0.015, g, 0, 1.25, 0);
    part(geoCyl(0.32, 0.18, 0.35, 8), lam(0x5a4632), 0.015, g, 0, 2.15, 0);
    const fire = new THREE.Group(); fire.position.y = 2.35; g.add(fire);
    const f1 = new THREE.Mesh(geoCone(0.26, 0.7, 8), new THREE.MeshBasicMaterial({ color: 0xffb03a })); f1.position.y = 0.3; fire.add(f1);
    const f2 = new THREE.Mesh(geoCone(0.15, 0.45, 8), new THREE.MeshBasicMaterial({ color: 0xfff1a0 })); f2.position.y = 0.22; fire.add(f2);
    const gl = glow(3.4); gl.material.color = new THREE.Color(0xffb03a); gl.material.opacity = 0.7; gl.position.y = 0.35; fire.add(gl);
    fire.visible = false; root.add(g); addCollider(x, z, 0.6);
    caveFx.torches.push({ x, z, g, fire, gl, lit: 0 });
  }
  // button hall: three round floor buttons with carved signs, and the old tablet that tells the order
  const symTex = (sym) => canvasTex(128, 128, (g) => {
    g.fillStyle = '#b8b0a2'; g.fillRect(0, 0, 128, 128); g.translate(64, 64); g.fillStyle = '#4a4036'; g.strokeStyle = '#4a4036'; g.lineWidth = 7; g.lineCap = 'round';
    if (sym === 'leaf') { g.beginPath(); g.ellipse(0, 0, 22, 40, 0.5, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#b8b0a2'; g.beginPath(); g.moveTo(-14, 26); g.lineTo(14, -26); g.stroke(); }
    else if (sym === 'shroom') { g.beginPath(); g.arc(0, 2, 36, Math.PI, 0); g.closePath(); g.fill(); g.fillRect(-11, 2, 22, 32); }
    else { for (const [x, y, r] of [[-16, 12, 18], [16, 14, 15], [0, -14, 17]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); } }
  }, null);
  for (const b of CAVE_PUZ.buttons) {
    const g = new THREE.Group(); g.position.set(b.x, height(b.x, b.z), b.z);
    part(geoCyl(1.25, 1.35, 0.18, 20), lam(0x8f877a, rockTex), 0.02, g, 0, 0.09, 0);
    const cap = new THREE.Group(); cap.position.y = 0.2; g.add(cap);
    part(geoCyl(0.95, 1.0, 0.24, 20), lam(0xb8b0a2), 0.02, cap, 0, 0, 0);
    const top = new THREE.Mesh(new THREE.CircleGeometry(0.9, 20), new THREE.MeshLambertMaterial({ map: symTex(b.sym), emissive: 0x000000 })); top.rotation.x = -Math.PI / 2; top.position.y = 0.125; cap.add(top);
    root.add(g);
    caveFx.buttons.push({ b, g, cap, top, on: false });
  }
  {
    const T = CAVE_PUZ.tablet, g = new THREE.Group(); g.position.set(T.x, height(T.x, T.z), T.z); g.rotation.y = Math.PI;
    part(geoBox(1.8, 2.3, 0.4), lam(0xa79f92, rockTex), 0.025, g, 0, 1.15, 0);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.9), new THREE.MeshLambertMaterial({ color: 0xffffff })); face.position.set(0, 1.2, 0.21); g.add(face);
    root.add(g); addCollider(T.x, T.z, 0.9);
    caveFx.tablet = { g, face, symTex };
  }
  // boulder room: a round boulder and the pressure plate it must sit on
  {
    const P0 = CAVE_PUZ.plate, pl = new THREE.Group(); pl.position.set(P0.x, height(P0.x, P0.z), P0.z);
    part(geoCyl(1.6, 1.7, 0.16, 24), lam(0x8f877a, rockTex), 0.02, pl, 0, 0.08, 0);
    const pt = part(geoCyl(1.3, 1.35, 0.14, 24), new THREE.MeshLambertMaterial({ color: 0xd9c38a, emissive: 0x000000 }), 0.02, pl, 0, 0.2, 0);
    root.add(pl); caveFx.plate = { g: pl, top: pt };
    const B0 = CAVE_PUZ.boulder, bg = new THREE.Group(); bg.position.set(B0.x, height(B0.x, B0.z), B0.z);
    const ball = part(geoSphere(1.15, 18, 14), lam(0xb0a898, rockTex), 0.035, bg, 0, 1.1, 0);
    for (let k = 0; k < 5; k++) { const m = part(geoSphere(0.22, 8, 6), lam(0x6f9a4a), 0, ball, (R() - 0.5) * 1.4, 0.7 + R() * 0.3, (R() - 0.5) * 1.4); m.scale.y = 0.4; }
    root.add(bg); caveFx.boulder = { g: bg, ball };
  }
  // the King's hall: a ring of pebble pillars, a throne of stacked stones and a beam of stolen sunshine from a crack above
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, x = KING_ROOM.x + Math.cos(a) * (KING_ROOM.r - 2.6), z = KING_ROOM.z + Math.sin(a) * (KING_ROOM.r - 2.6); if (Math.abs(Math.sin(a) - 1) < 0.3) continue; const s = 1.1 + R() * 0.3; const p = part(geoCyl(0.9 * s, 1.3 * s, 11, 9), lam(0xb9b2a6, rockTex), 0.03, root, x, height(x, z) + 5.5, z); p.rotation.y = R() * 6; addCollider(x, z, 1.3 * s); }
  {
    const x = KING_ROOM.x, z = KING_ROOM.z - KING_ROOM.r + 4.5, y = height(x, z), th = new THREE.Group(); th.position.set(x, y, z);
    for (const [ox, oy, s] of [[0, 0.8, 2.2], [-1.6, 1.4, 1.2], [1.6, 1.4, 1.2], [0, 2.4, 1.4]]) { const r = new THREE.Mesh(ROCKS[1], lam(0xffffff, rockTex, { vertexColors: true })); r.position.set(ox, oy, 0); r.scale.setScalar(s); th.add(r); }
    root.add(th); addCollider(x, z, 2.8);
    // the heap of stolen Sunberries by the throne: glowing like a little sun
    const heap = new THREE.Group(); heap.position.set(x + 4.5, height(x + 4.5, z + 1), z + 1);
    const bm = new THREE.MeshLambertMaterial({ color: 0xffb02e, emissive: 0x9a4a00 }), berries = [];
    for (let i = 0; i < 46; i++) { const a = R() * 6.28, r = R() * 1.4, h = (1.4 - r) * 0.7; berries.push({ g: geoSphere(0.16, 8, 6), m: mtx(Math.cos(a) * r, h + 0.1, Math.sin(a) * r, 0, 0, 0, 1, 1, 1) }); }
    heap.add(new THREE.Mesh(bake(berries), bm)); const hg = glow(4.2); hg.material.color = new THREE.Color(0xffc24d); hg.material.opacity = 0.6; hg.position.y = 0.8; heap.add(hg);
    root.add(heap); addCollider(heap.position.x, heap.position.z, 1.3); caveFx.heap = heap;
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.6, 30, 18, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
    beam.position.set(KING_ROOM.x, height(KING_ROOM.x, KING_ROOM.z) + 15, KING_ROOM.z + 2); root.add(beam); caveFx.sunbeam = beam;
  }
  glowShrooms(isTouch ? 120 : 200, wallPts, (x, z) => edgeCave(x, z) < -1.2, 0xbfe4ff, 0x2a6fa8);
  gateArch(gateById('c_out'), null);
  signPost(1506, -636, Math.PI, 'Pebble Cave\nThe King sleeps below');
  caveFx.motes = driftCloud(isTouch ? 50 : 80, 0.3, 0xbfe4ff, true);
  bakeLayers(0xb0a6c8);
  MAPS.cave.mini = { x0: 1460, z0: -885, x1: 1580, z1: -620, ppm: 2 };
  MAPS.cave.miniCanvas = paintMini(MAPS.cave.mini, { out: '#2a2a30', in: '#8a8478', rim: '#55524c', tree: '#3a3a44' });
  MAPS.cave.built = true;
  applyCaveDoors();
}
// doors and the boulder block the floor; the cave code moves them, this keeps the floor test in step
function applyCaveDoors() {
  caveBlock.length = 0;
  for (const D of CAVE_DOORS) if (!D.open) caveBlock.push(D);
  if (caveFx.boulderPos) caveBlock.push(caveFx.boulderPos);
}
function setCaveDoor(id, open) { const D = CAVE_DOORS.find((d) => d.id === id); if (D) { D.open = !!open; applyCaveDoors(); } }
function setBoulder(x, z) { caveFx.boulderPos = x == null ? null : { x, z, r: 1.6 }; applyCaveDoors(); }
const BUILD = { hills: buildHills, wood: buildWood, river: buildRiver, thorn: buildThorn, burrow: buildBurrow, cave: buildCave };

// ---------- switching maps: only the map you stand in is shown ----------
let active = 'meadow';
const LOOK = { meadow: { fog: 0xc9dfe2, near: FOG_NEAR, far: FOG_FAR, sun: 0.55 }, hills: { fog: 0xd8eaee, near: 70, far: 210, sun: 0.6 }, wood: { fog: 0xb6d1bf, near: 38, far: 142, sun: 0.42 }, river: { fog: 0xcfe6e8, near: 62, far: 195, sun: 0.58 }, thorn: { fog: 0xdcd2dc, near: 52, far: 175, sun: 0.54 }, burrow: { fog: 0x1c1610, near: 10, far: 52, sun: 0.3 }, cave: { fog: 0x181a22, near: 12, far: 58, sun: 0.32 } };
function setMap(id) {
  if (!MAPS[id] || !MAPS[id].built) { const keep = root; BUILD[id](); root = keep; }
  active = id;
  for (const k in MAPS) MAPS[k].group.visible = k === id;
  const c = CENTERS[id]; if (id === 'meadow') skyRing.position.set(0, 0, 0); else skyRing.position.set(c[0], 0, c[1] + 170);
  const lk = LOOK[id];
  skyRing.visible = !lk.under && !lk.noRing && id !== 'wood' && id !== 'burrow' && id !== 'cave'; // deep in the forest the far mountains are hidden behind the trees
  sky.visible = !lk.under && id !== 'burrow' && id !== 'cave'; // underground: no sky at all
  FOG.setHex(lk.fog); scene.fog.color.setHex(lk.fog); scene.fog.near = lk.near; scene.fog.far = lk.far; scene.background.setHex(lk.fog); RW.sun.intensity = lk.sun;
  for (const wm of waterMats) { wm.uniforms.fogNear.value = lk.near; wm.uniforms.fogFar.value = lk.far; }
  return MAPS[id];
}

function update(dt, time) {
  for (const c of clouds) { c.position.x += dt * 2.2; if (c.position.x > 650) c.position.x = -650; }
  sky.position.copy(camera.position);
  for (const r of rays) { if (!r.o.parent || !r.o.parent.visible) continue; r.o.rotation.y = Math.atan2(camera.position.x - r.o.position.x, camera.position.z - r.o.position.z); r.o.children[0].material.opacity = r.op + Math.sin(time * 0.6 + r.ph) * 0.05; }
  for (const s of swirls) if (s.map === active) { s.m.rotation.z = time * 0.6; s.m.material.opacity = 0.5 + Math.sin(time * 2) * 0.15; s.cur.material.opacity = 0.32 + Math.sin(time * 1.4) * 0.1; }
  if (active === 'meadow') {
    const g = 2.2 + Math.sin(time * 1.3) * 0.35 + Math.sin(time * 4.7) * 0.12; statueGlow.scale.set(g, g, 1); statueGlow.material.opacity = 0.55 + Math.sin(time * 2.1) * 0.15;
    const tv = V3(0, 0, 0);
    for (const b of butterflies) {
      if (b.pos.distanceToSquared(camera.position) > 120 * 120) { b.g.visible = false; continue; }
      b.g.visible = true;
      if (!b.goal || b.pos.distanceTo(b.goal) < 0.4) { const gx = b.home.x + (Math.random() - 0.5) * 12, gz = b.home.z + (Math.random() - 0.5) * 12; b.goal = V3(gx, height(gx, gz) + 0.6 + Math.random() * 1.4, gz); }
      tv.subVectors(b.goal, b.pos); const d = tv.length(); b.pos.addScaledVector(tv.normalize(), Math.min(d, dt * 1.6)); b.pos.y += Math.sin(time * 5 + b.ph) * 0.01;
      b.g.position.copy(b.pos); b.g.rotation.y = Math.atan2(tv.x, tv.z); const fl = Math.sin(time * 18 + b.ph) * 1.1; b.w[0].rotation.z = fl; b.w[1].rotation.z = -fl;
    }
    for (const s of smoke) {
      s.t += dt * 0.22; if (s.t > 1) s.t -= 1;
      s.s.position.set(s.base.x + Math.sin(s.t * 5 + s.base.x) * 0.4 * s.t, s.base.y + s.t * 4, s.base.z + s.t * 1.2);
      const k = 0.6 + s.t * 1.8; s.s.scale.set(k, k, 1); s.s.material.opacity = Math.sin(s.t * Math.PI) * 0.45;
    }
  } else if (active === 'hills') {
    const F = hillsFx;
    if (F.sails) F.sails.rotation.z -= dt * (0.7 + Math.sin(time * 0.3) * 0.2);
    if (F.flag) F.flag.rotation.y = Math.sin(time * 5) * 0.25 - 0.3;
    if (F.crystal) { F.crystal.rotation.y += dt * 0.4; F.crystalGlow.material.opacity = (F.crystalLit ? 0.8 : 0.3) + Math.sin(time * 1.7) * 0.08; }
    for (const k of F.kites) {
      const x = k.anchor.x + k.off.x + Math.sin(time * 0.7 + k.ph) * 2.2, y = k.anchor.y + k.hgt + Math.sin(time * 1.1 + k.ph) * 1.2, z = k.anchor.z + k.off.z + Math.cos(time * 0.5 + k.ph) * 1.5;
      k.kite.position.set(x, y, z); k.kite.rotation.set(0, Math.atan2(camera.position.x - x, camera.position.z - z), Math.sin(time * 1.6 + k.ph) * 0.25);
      const p = k.line.geometry.attributes.position; p.setXYZ(0, k.anchor.x, k.anchor.y, k.anchor.z); p.setXYZ(1, x, y - 0.8, z); p.needsUpdate = true;
    }
    drift(F.seeds, dt, time, 2.6, false);
  } else if (active === 'wood') drift(woodFx.flies, dt, time, 0.25, true);
  else if (active === 'river') { if (riverFx.wheel) riverFx.wheel.rotation.x -= dt * 0.9; drift(riverFx.bugs, dt, time, 0.3, true); }
  else if (active === 'thorn') drift(thornFx.pollen, dt, time, 0.9, false);
  else if (active === 'burrow') drift(burrowFx.spores, dt, time, 0.1, true);
  else if (active === 'cave') {
    drift(caveFx.motes, dt, time, 0.08, true);
    caveFx.crystals.forEach((g, i) => { g.material.opacity = 0.35 + Math.sin(time * 1.3 + i * 1.7) * 0.12; });
    for (const d of caveFx.doors) { const want = d.D.open ? 1 : 0; if (d.t !== want) { d.t += Math.sign(want - d.t) * Math.min(Math.abs(want - d.t), dt * 0.45); d.slab.position.y = -5.4 * d.t; d.slab.position.x = Math.sin(time * 40) * 0.04 * (d.t > 0 && d.t < 1 ? 1 : 0); } }
    for (const t of caveFx.torches) if (t.fire.visible) { const f = 1 + Math.sin(time * 13 + t.x) * 0.08 + Math.sin(time * 23 + t.z) * 0.05; t.fire.scale.set(f, f * (0.4 + 0.6 * Math.min(1, t.lit)), f); }
    if (caveFx.sunbeam) caveFx.sunbeam.material.opacity = 0.13 + Math.sin(time * 0.9) * 0.04;
  }
  for (const f of landTicks) f(dt, time, active);
}
// ---------- v1.4: the hook lands.js uses to add whole new maps, and the builder kit it needs ----------
const landTicks = [];
function addLand(D) {
  LANDS.push(D);
  HEIGHT[D.id] = D.height; EDGE[D.id] = D.edge; WALK[D.id] = D.walk;
  BUILD[D.id] = D.build; CENTERS[D.id] = [D.cx, D.cz]; LOOK[D.id] = D.look;
  for (const g of D.gates || []) GATES.push(Object.assign({ map: D.id }, g));
  if (D.way) { const w = Object.assign({ map: D.id }, D.way); WAYSTONES.push(w); addCollider(w.x, w.z, 0.95); }
  for (const s of D.npcs || []) NPC_SPOTS.push(Object.assign({ map: D.id }, s));
  if (D.tick) landTicks.push(D.tick);
}
const kit = {
  beginMap(id, seed, leaf) { beginMap(id, seed); buildId = id; leafBase = leaf || 1; },
  get root() { return root; }, set root(r) { root = r; },
  layer: (name, item) => L[name].push(item),
  makeGround, roadRibbon, distToRoad, addBroadleaf, addPine, addBush, rocksAround, addFlowers, addTufts, addRays, addPond, gateArch, signPost, signBoard, bakeLayers, paintMini, driftCloud, drift, addCollider, groundBlob, box, gateClear, chestClear,
  house(x, z, roofHex, opts) { const g = addHouse(x, z, roofHex, Object.assign({ face: 0 }, opts)); root.add(g); return g; },
  tent(x, z, face, tex) { const g = addTent(x, z, face, tex); root.add(g); return g; },
  superEdge, rimRise, pondCarve, smoothstep, smooth01, vnoise3, lerp, clamp, R, ROCKS, M_WOOD, M_STONE, M_WALL, rockTex, barkTex, woodTex, grassTex, caveFloorTex, dirtTex, tentTex, awningTex, cobbleTex, waterMats, treeDots: () => treeDots, buildingDots: () => buildingDots,
  height: (x, z) => height(x, z), edgeDist: (x, z) => edgeDist(x, z), MAPS
};
// keep the floating seeds or fireflies in a box around the camera; seeds ride the wind, fireflies wander and blink
function drift(D, dt, time, wind, blink) {
  if (!D) return;
  const cx = camera.position.x, cz = camera.position.z, cy = height(cx, cz);
  D.pts.position.set(cx, cy - 2, cz);
  const p = D.pos, c = D.col;
  for (let i = 0; i < D.n; i++) {
    const s = D.seed[i];
    p[i * 3] += (wind + Math.sin(time * 0.8 + s) * 0.4) * dt; p[i * 3 + 1] += Math.sin(time * 1.3 + s * 2) * 0.3 * dt; p[i * 3 + 2] += Math.cos(time * 0.6 + s) * (blink ? 0.4 : 0.6) * dt;
    if (p[i * 3] > 22) p[i * 3] -= 44; if (p[i * 3] < -22) p[i * 3] += 44; if (p[i * 3 + 2] > 22) p[i * 3 + 2] -= 44; if (p[i * 3 + 2] < -22) p[i * 3 + 2] += 44;
    if (p[i * 3 + 1] > 10) p[i * 3 + 1] = 0.5; if (p[i * 3 + 1] < 0.3) p[i * 3 + 1] = 9;
    if (blink) { const b = Math.max(0, Math.sin(time * (1.2 + (s % 1)) + s * 3)); c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = b * b; }
  }
  D.pts.geometry.attributes.position.needsUpdate = true; if (blink) D.pts.geometry.attributes.color.needsUpdate = true;
}
function stashPile(on) { if (woodFx.pile) woodFx.pile.visible = on; }
function lightCrystal(on) { hillsFx.crystalLit = on; }

RW.world = {
  TOWN, MEADOW, PONDS, GARDEN, SPAWN, NPC_SPOTS, OLLY_BUSH, SUNBERRY_PATCH, BOARD, NORTH_GATE, height, edgeDist, walkable, inTown, zoneAt, mapAt, collide, tryMove, groundRay, update, colliders,
  CROOMS, KING_ROOM, CAVE_DOORS, CAVE_PUZ, caveFx, setCaveDoor, setBoulder, openCaveMouth, edgeCave, get caveMouthOpen() { return caveMouthOpen; },
  GATES, MAPS, CENTERS, HMAP, WMAP, RMAP, TMAP, BROOMS, BOSS_ROOM, MILL, DOCK, CAVE, WAYSTONES, BURROW_DOOR, HIVES, BRIDGES, riverDist, edgeBurrow, WINDMILL, CRYSTAL, BENCH, KITES, HOLLOW, STASH, WISPS, YARD, setMap, stashPile, lightCrystal, focusU, camU,
  get active() { return active; },
  get MINI() { return MAPS[active].mini; },
  get miniCanvas() { return MAPS[active].miniCanvas; },
  distToRoad, addCollider, addLand, kit, LANDS
};
})();
