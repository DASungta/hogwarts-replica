// ------------------------------------------------------------------ terrain: the castle rock, the loch and the highlands
// One height function; a fine square grid (2 m) around the castle and a polar mesh out to the mountains.
function zShore(x) { // north shore of the loch, roughly E-W under the castle
  let z = 96 + 5 * noise3(x / 45, 0.3, 1.7) + 3 * noise3(x / 17, 1.1, 0.2);
  if (x < -300) z += (-300 - x) * 0.55;
  if (x > 250) z += (x - 250) * 0.45;
  return z;
}
function zTop(x) { // south edge of the castle platform, the line where the cliff starts
  // follows the building fronts: Great Hall wall, lakeside terrace, south wing, greenhouse wall; bulges out between
  let z = 45 + (60.5 - 45) * smooth(-84, -79, x) + (53.5 - 60.5) * smooth(-20, -12, x) + (45 - 53.5) * smooth(40, 52, x) + (41 - 45) * smooth(66, 76, x) + (38 - 41) * smooth(95, 110, x);
  const quiet = 1 - 0.8 * smooth(-40, -22, x) * smooth(48, 32, x);
  return z + 1.2 + (Math.max(0, noise3(x / 32, 4.2, 0.5)) * 11 + 2 * noise3(x / 11, 1.2, 3.5)) * quiet;
}
function lochW(x, z) { // > 0 over the loch (rough metres from shore), < 0 on land
  const dN = (z - zShore(x)) * 0.85;
  const xc = 80 + 420 * Math.sin(z / 1700), hw = 950 + 650 * smooth(300, 3000, z);
  return Math.min(dN, hw - Math.abs(x - xc), (southZ(x) - z) * 0.85);
}
let HUT_Y = null, LAWN_Y = null;
function gorgeX(z) { return -242 + 10 * noise3(z / 90, 5.0, 1.0); }
let RAV_L = null;
function ravineInfo(x, z) { // distance to the ravine line and the position along it (0 at the north-east end)
  if (!RAV_L) { RAV_L = [0]; for (let i = 1; i < RAVINE.length; i++) RAV_L.push(RAV_L[i - 1] + Math.hypot(RAVINE[i][0] - RAVINE[i - 1][0], RAVINE[i][1] - RAVINE[i - 1][1])); }
  let best = 1e9, bt = 0;
  for (let i = 0; i < RAVINE.length - 1; i++) {
    const [ax, az] = RAVINE[i], [bx, bz] = RAVINE[i + 1], dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz;
    const u = clamp(((x - ax) * dx + (z - az) * dz) / L2, 0, 1), d = Math.hypot(x - ax - dx * u, z - az - dz * u);
    if (d < best) { best = d; bt = (RAV_L[i] + u * Math.sqrt(L2)) / RAV_L[RAV_L.length - 1]; }
  }
  return { d: best, t: bt };
}
function castleMask(x, z) {
  const e = ((x - 30) / 270) ** 2 + ((z - 10) / 200) ** 2;
  return 1 - smooth(0.7, 1.0, e);
}
function plateau(x, z) {
  let y = -1 + 4 * smooth(-60, -260, z);
  y += 9 * fbm3(x / 260, 2.2, z / 260, 3) * smooth(140, 380, Math.hypot(x - 40, z + 20));
  return y;
}
function landH(x, z) {
  const r = Math.hypot(x, z);
  let y = 3 + 30 * smooth(-150, -1100, z) + fbm3(x / 420, 0.7, z / 420, 4) * 140 * smooth(250, 1300, r)
    + Math.max(0, fbm3(x / 900, 4.4, z / 900, 3)) * 260 * smooth(700, 1800, r);
  const env = smooth(1500, 4200, r);
  if (env > 0) {
    let s = 0, a = 1, f = 1 / 2600, w = 1, nm = 0;
    for (let i = 0; i < 8; i++) {
      let n = 1 - Math.abs(noise3(x * f, i * 3.7 + 0.5, z * f)); n = n * n * w; w = clamp(n * 1.6, 0, 1);
      s += n * a; nm += a; a *= 0.48; f *= 2.1;
    }
    y += env * Math.max(0, (s / nm) * 1500 - 150);
  }
  return y;
}
function cliffProf(t, x, z) {
  const n = fbm3(x / 16, z / 16, 3.3, 3);
  const p = clamp(t + n * 0.5 * t * (1 - t), 0, 1);
  const k = 0.75 + 0.5 * (0.5 + 0.5 * noise3(x / 45, 9.1, 0.3));
  let s = 0.14 * smooth(0, 0.2, p) + 0.86 * Math.pow(smooth(0.1, 1.08, p) / smooth(0.1, 1.08, 1), k);
  s += 0.035 * Math.sin(p * Math.PI * 9 + n * 3) * p * (1 - p) * 4;
  return clamp(s, 0, 1.02);
}
function groundH(x, z) {
  const w = lochW(x, z);
  if (w > 0) return LAKE_Y - 4 - Math.min(40, w * 0.25) + noise3(x / 30, 7.1, z / 30) * 1.5;
  const dl = -w;
  const land = landH(x, z);
  const steep = smooth(800, 2500, Math.hypot(x, z));
  let y = lerp(LAKE_Y - 4, land, smooth(0, lerp(140, 500, steep), dl));
  const C = castleMask(x, z);
  if (C > 0) {
    const zs = zShore(x), zt = zTop(x);
    const t = clamp((zs - z) / Math.max(10, zs - zt), 0, 1);
    // rock bulges up along the brink, against the building plinths
    const knob = (2 + 2.5 * noise3(x / 13, 0.7, z / 13)) * Math.exp(-(((z - zt + 1.5) / 4.5) ** 2));
    const top = plateau(x, z) + Math.max(0, knob);
    const yc = LAKE_Y - 4 + (top - LAKE_Y + 4) * cliffProf(t, x, z);
    y = lerp(y, yc, C);
  }
  // the gully under the gallery bridge, opening to the loch
  const gx = Math.abs(x - 5 - 2.5 * noise3(z / 30, 2.0, 0.4));
  // (a V-shaped bay widening toward the loch, so that from the water the viaduct's piers show their full height, m65, m66)
  // as wide as the viaduct between its abutments, with steep rock sides
  const ghw = 18.5 + Math.max(0, z - 52) * 0.5;
  if (z > 40 && z < 160 && gx < ghw + 5) {   // (it ends at the loch: without the z bound it cut a 2 km trench south of the station)
    const floor = Math.max(LAKE_Y - 3, -36 - (z - 18) * 0.4) + (gx / ghw) ** 2 * 9;
    y = lerp(y, Math.min(y, floor), smooth(ghw + 4, ghw - 2, gx) * smooth(41, 47, z));
  }
  // the station's valley south of the loch: a broad floor at shore level for the station, the jetty and the line, rising
  // gently into the hills on all sides (a smooth valley, not a trench)
  { const dz = z - southZ(x);
    if (dz > -30 && dz < 900) {
      const k = smooth(-30, 10, dz) * (1 - smooth(260, 820, dz)) * (1 - smooth(650, 1500, Math.abs(x - 150)));
      if (k > 0) y = lerp(y, Math.min(y, LAKE_Y + 4 + 6 * ((x - 150) / 1500) ** 2 + Math.max(0, dz - 80) * 0.05), k);
    } }
  // the gorge west of the castle, crossed by the wooden bridge: a steep rock wall on the castle side, a long grassy
  // slope on the far side, a stream along the bottom down to the loch
  const dxg = x - gorgeX(z), ox = Math.abs(dxg), wHalf = dxg > 0 ? 40 : 86;
  if (ox < wHalf + 10 && z > -470 && z < 200) {   // (it ends at the loch: unbounded it notched the mountains beyond the station)
    const floor = Math.max(LAKE_Y - 2.5, -52 + 46 * smooth(-150, -460, z));
    const prof = dxg > 0 ? 66 * Math.pow(smooth(0.06, 1.0, ox / 40), 0.6) : Math.pow(ox / 86, 1.6) * 60;
    y = lerp(y, Math.min(y, floor + prof), smooth(wHalf + 8, wHalf * 0.25, ox) * smooth(-470, -330, z));
  }
  // the Viaduct Courtyard and the forecourt lie level with the viaduct deck
  if (x > -16 && x < 38 && z > 20 && z < 52) y = Math.min(y, -3.2);
  // the drop under the ruins north-east of the castle (m45, m50): the ground falls ~12 m right in front of the walls,
  // then eases back to the hillside further out
  { const dx = x - RUIN_F.o[0], dz = z - RUIN_F.o[1], t = dx * RUIN_F.u[0] + dz * RUIN_F.u[1], s = dx * RUIN_F.v[0] + dz * RUIN_F.v[1];
    if (t > -45 && t < 115 && s > -4 && s < 100) {
      const env = smooth(-45, -18, t) * (1 - smooth(86, 115, t)), edge = 2.2 + 1.4 * noise3(t / 11, 3.3, 0.5);
      y -= env * (12 + 3 * noise3(t / 9, 1.1, s / 9)) * smooth(edge, edge + 11, s) * (1 - smooth(40, 98, s));
    } }
  // the rocky hill west of the Training Grounds (m45, the miniature's camera solved from the castle, the ruins and the
  // stones): its foot runs from the long gallery's north side north-east to the ruins' big square tower; it rises ~28 m
  // westward toward the ravine, gentle at the foot, ~60° in the middle (so the ground turns to the miniature's rounded
// rock masses there, as on the cliffs), low where
  // it meets the castle, and kept off the ruin line
  { let d = 1e9, sg = 1;
    for (let i = 0; i < FIELD_TOE.length - 1; i++) {
      const [ax, az] = FIELD_TOE[i], [bx, bz] = FIELD_TOE[i + 1], ex = bx - ax, ez = bz - az, L2 = ex * ex + ez * ez;
      const u = clamp(((x - ax) * ex + (z - az) * ez) / L2, 0, 1), q = Math.hypot(x - ax - ex * u, z - az - ez * u);
      if (q < d) { d = q; sg = Math.sign(ex * (z - az) - ez * (x - ax)) || 1; }
    }
    const w = -sg * d + 7 * noise3(x / 38, 6.1, z / 38);   // > 0 inside the hill (west of the foot)
    if (w > -10 && z < -40 && z > -330) {
      const fs = smooth(-45, -100, z), dx = x - RUIN_F.o[0], dz = z - RUIN_F.o[1], s = dx * RUIN_F.v[0] + dz * RUIN_F.v[1];
      const fr = smooth(-6, -26, s);   // none along the wall line and out over the drop
      const H = 28 + 6 * noise3(x / 70, 2.7, z / 70);
      const prof = 0.15 * smooth(0, 12, w) + 0.85 * smooth(14, 34, w) + 0.07 * noise3(x / 13, 4.4, z / 13) * smooth(0, 20, w);
      y += H * prof * fs * fr * (1 - smooth(95, 125, w));   // and gone again short of the ravine
    } }
  // the lakeside terrace sits lower than the hall floor
  if (x > -82 && x < -12 && z > 42 && z < 64) y = Math.min(y, -7);
  // the stream ravine north of the castle
  if (x > -262 && x < 100 && z > -280 && z < -50) {
    const { d, t } = ravineInfo(x, z);
    if (d < 30) {
      const floor = lerp(2, -24, smooth(0.04, 0.4, t)) - 22 * smooth(0.86, 1.0, t);
      const half = lerp(10, 19, smooth(0.0, 0.3, t));
      y = lerp(y, Math.min(y, floor + 32 * Math.pow(d / half, 1.35)), smooth(half + 8, half * 0.35, d) * smooth(0.0, 0.08, t));
    }
  }
  // a level pad for Hagrid's hut
  { const [hx, hz] = SITE_BY.hagrid.circle, d = Math.hypot(x - hx, z - hz); if (d < 22) { HUT_Y ??= y; y = lerp(HUT_Y, y, smooth(9, 22, d)); } }
  // the Quidditch pitch sits on a levelled terrace
  if (PITCH.y !== null) { const d = pitchMetric(x, z, 24); if (d < 1.9) y = lerp(PITCH.y, y, smooth(1.0, 1.9, d)); }
  return stairCarve(x, z, trackBed(x, z, y));
}

// rounded rock masses: a jittered 3D grid of cell centres (anisotropic: wide and squat, like piled boulders);
// returns the distance to the cell border (half the F2 - F1 gap, metres) and the cell's own random number
const ROCK_CELL = [30, 19, 30];
function rockCell(x, y, z) {
  const qx = x / ROCK_CELL[0], qy = y / ROCK_CELL[1], qz = z / ROCK_CELL[2];
  const ix = Math.floor(qx), iy = Math.floor(qy), iz = Math.floor(qz);
  let f1 = 1e9, f2 = 1e9, id = 0;
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) {
    const cx = ix + a, cy = iy + b, cz = iz + c;
    let h = (Math.imul(cx, 73856093) ^ Math.imul(cy, 19349663) ^ Math.imul(cz, 83492791)) >>> 0;
    const r1 = ((h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0) % 10007) / 10007, r2 = ((h = Math.imul(h ^ (h >>> 13), 3266489917) >>> 0) % 10009) / 10009;
    const r3 = ((h = Math.imul(h ^ (h >>> 16), 2654435761) >>> 0) % 10037) / 10037, r4 = ((h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0) % 10039) / 10039;
    const dx = (cx + 0.15 + 0.7 * r1 - qx) * ROCK_CELL[0], dy = (cy + 0.15 + 0.7 * r2 - qy) * ROCK_CELL[1], dz = (cz + 0.15 + 0.7 * r3 - qz) * ROCK_CELL[2];
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (d < f1) { f2 = f1; f1 = d; id = r4; } else if (d < f2) f2 = d;
  }
  return { e: (f2 - f1) * 0.5, id };
}
const GRID = { cx: -80, cz: -80, half: 560, step: 2, rIn: 552 };
const PATCH = { x0: -300, x1: 700, z0: 1218, z1: 1400, step: 2 };   // a fine patch round the station and the railway
const inPatch = (x, z, m = 0) => x > PATCH.x0 + m && x < PATCH.x1 - m && z > PATCH.z0 + m && z < PATCH.z1 - m;
function buildGround() {
  // fine grid, culled to a disc
  const n = Math.round((GRID.half * 2) / GRID.step) + 1;
  const pos = new Float32Array(n * n * 3), Hf = new Float32Array(n * n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const x = GRID.cx - GRID.half + j * GRID.step, z = GRID.cz - GRID.half + i * GRID.step, k = i * n + j;
    const y = groundH(x, z); Hf[k] = y;
    pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z;
  }
  const lookF = (x, z) => {
    const fj = (x - GRID.cx + GRID.half) / GRID.step, fi = (z - GRID.cz + GRID.half) / GRID.step;
    if (fi < 0 || fj < 0 || fi >= n - 1 || fj >= n - 1) return null;
    const i0 = Math.floor(fi), j0 = Math.floor(fj), ti = fi - i0, tj = fj - j0, k = i0 * n + j0;
    return lerp(lerp(Hf[k], Hf[k + 1], tj), lerp(Hf[k + n], Hf[k + n + 1], tj), ti);
  };
  // break the cliff into rounded masses with creases between them: push steep vertices along the downhill direction
  const crease = new Float32Array(n * n);
  for (let i = 1; i < n - 1; i++) for (let j = 1; j < n - 1; j++) {
    const k = i * n + j, x = pos[k * 3], z = pos[k * 3 + 2], y = Hf[k];
    const gx = (Hf[k + 1] - Hf[k - 1]) / (2 * GRID.step), gz = (Hf[k + n] - Hf[k - n]) / (2 * GRID.step), g = Math.hypot(gx, gz);
    if (g < 0.55 || y < LAKE_Y - 3) continue;
    let steep = smooth(0.55, 1.2, g); const ux = -gx / g, uz = -gz / g;
    if (x > -262 && x < 110 && z > -290 && z < -40) steep *= 0.25 + 0.75 * smooth(14, 40, ravineInfo(x, z).d);   // the narrow ravine would fold
    if (z > 38 && Math.abs(x - 5) < 34) steep *= 0.45 + 0.55 * smooth(14, 32, Math.abs(x - 5));                       // and so would the gully
    { const dx = x - RUIN_F.o[0], dz = z - RUIN_F.o[1], t = dx * RUIN_F.u[0] + dz * RUIN_F.u[1], s = dx * RUIN_F.v[0] + dz * RUIN_F.v[1];
      if (t > -50 && t < 120 && s > -10 && s < 40) steep *= 0.1; }                                                     // and so would the short drop under the ruins
    if (STAIR && z > 50 && x > -80 && x < 60) {   // and the rock cut away beside the stair walls would overhang them
      let ds = 1e9;
      for (let q = 0; q < STAIR.length - 1; q++) { const A = STAIR[q], B = STAIR[q + 1], ex = B[0] - A[0], ez = B[2] - A[2], L2 = ex * ex + ez * ez, t = clamp(((x - A[0]) * ex + (z - A[2]) * ez) / L2, 0, 1); ds = Math.min(ds, Math.hypot(x - A[0] - ex * t, z - A[2] - ez * t)); }
      steep *= smooth(5, 18, ds);
    }
    // the miniature's rockwork (m65, m66): big rounded masses piled on each other, each bulging out of the face with a
    // rounded shoulder, deep creases between them, some masses standing further out than others
    const C = rockCell(x, y, z), sh = Math.sqrt(1 - Math.pow(1 - Math.min(C.e / 10, 1), 2));
    const pillow = sh * 7.0 - 4.2 + (C.id - 0.5) * 6.5 - (1 - smooth(0.0, 1.8, C.e)) * 1.4;
    const big = noise3(x / 42, y / 70 + 0.5, z / 42) * 3.5;
    const lumps = noise3(x / 7, y / 7 + 3.1, z / 7) * 0.9;
    const d = steep * (big + pillow + lumps);
    pos[k * 3] += ux * d; pos[k * 3 + 2] += uz * d;
    crease[k] = steep * (1 - smooth(0.4, 3.0, C.e));
  }
  const idx = [];
  const r2 = GRID.rIn * GRID.rIn;
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < n - 1; j++) {
    const x = GRID.cx - GRID.half + (j + 0.5) * GRID.step, z = GRID.cz - GRID.half + (i + 0.5) * GRID.step;
    if ((x - GRID.cx) ** 2 + (z - GRID.cz) ** 2 > r2) continue;
    const k = i * n + j;
    idx.push(k, k + n, k + 1, k + 1, k + n, k + n + 1);
  }
  // polar mesh beyond, sunk 1.5 m where it overlaps the fine grid
  const a = 300, b = 0.0105, NR = 300, NA = 1024, r0 = GRID.rIn - 12;
  const rOf = (i) => r0 + a * (Math.exp(b * i) - 1);
  const W = NA + 1, cnt = (NR + 1) * W;
  const pp = new Float32Array(cnt * 3), Hp = new Float32Array(cnt);
  for (let i = 0; i <= NR; i++) {
    const r = rOf(i);
    for (let j = 0; j <= NA; j++) {
      const th = (j / NA) * Math.PI * 2, x = GRID.cx + Math.sin(th) * r, z = GRID.cz - Math.cos(th) * r;
      const y = groundH(x, z), k = i * W + j;
      Hp[k] = y;
      pp[k * 3] = x; pp[k * 3 + 1] = y - 1.5 * (1 - smooth(GRID.rIn - 2, GRID.rIn + 8, r)) - (inPatch(x, z, 6) ? 3 : 0); pp[k * 3 + 2] = z;
    }
  }
  const lookP = (x, z) => {
    const r = Math.hypot(x - GRID.cx, z - GRID.cz); const fi = Math.log((r - r0) / a + 1) / b; if (fi >= NR) return -1e9; if (fi < 0) return null;
    let th = Math.atan2(x - GRID.cx, -(z - GRID.cz)); if (th < 0) th += Math.PI * 2; const fj = (th / (Math.PI * 2)) * NA;
    const i0 = Math.floor(fi), j0 = Math.floor(fj), ti = fi - i0, tj = fj - j0, k = i0 * W + j0;
    return lerp(lerp(Hp[k], Hp[k + 1], tj), lerp(Hp[k + W], Hp[k + W + 1], tj), ti);
  };
  const pnx = Math.round((PATCH.x1 - PATCH.x0) / PATCH.step) + 1, pnz = Math.round((PATCH.z1 - PATCH.z0) / PATCH.step) + 1;
  const Hs = new Float32Array(pnx * pnz);
  for (let i = 0; i < pnz; i++) for (let j = 0; j < pnx; j++) Hs[i * pnx + j] = groundH(PATCH.x0 + j * PATCH.step, PATCH.z0 + i * PATCH.step);
  const lookS = (x, z) => {
    const fj = (x - PATCH.x0) / PATCH.step, fi = (z - PATCH.z0) / PATCH.step;
    const i0 = Math.floor(fi), j0 = Math.floor(fj), ti = fi - i0, tj = fj - j0, k = i0 * pnx + j0;
    return lerp(lerp(Hs[k], Hs[k + 1], tj), lerp(Hs[k + pnx], Hs[k + pnx + 1], tj), ti);
  };
  const look = (x, z) => { if (inPatch(x, z, 2)) return lookS(x, z); const f = lookF(x, z); if (f !== null && (x - GRID.cx) ** 2 + (z - GRID.cz) ** 2 < r2) return f; const p = lookP(x, z); return p === null ? f ?? 0 : p; };
  const sunVis = (x, y, z, near) => { // soft visibility by marching the height field toward the sun
    let v = 1;
    for (let s = 0, d = near ? 6 : 25; s < 16 && v > 0; s++, d *= 1.36) {
      const hh = look(x + SUN_DIR.x * d, z + SUN_DIR.z * d);
      v = Math.min(v, clamp(0.5 + (y + 1.5 + SUN_DIR.y * d - hh) / (0.07 * d), 0, 1));
    }
    return v;
  };
  const visF = new Float32Array(n * n).fill(1);
  for (let k = 0; k < n * n; k++) {
    const x = pos[k * 3], z = pos[k * 3 + 2];
    if (Math.hypot(x - 30, z - 10) > 330) visF[k] = sunVis(x, pos[k * 3 + 1], z, true);
  }
  const visP = new Float32Array(cnt);
  for (let k = 0; k < cnt; k++) visP[k] = sunVis(pp[k * 3], Hp[k], pp[k * 3 + 2], false);
  const g1 = new THREE.BufferGeometry();
  g1.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g1.setAttribute('sunvis', new THREE.BufferAttribute(visF, 1));
  g1.setAttribute('crease', new THREE.BufferAttribute(crease, 1));
  g1.setIndex(idx);
  g1.computeVertexNormals();
  const pidx = new Uint32Array(NR * NA * 6); let p = 0;
  for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) {
    const k = i * W + j;
    pidx[p++] = k; pidx[p++] = k + 1; pidx[p++] = k + W; pidx[p++] = k + 1; pidx[p++] = k + W + 1; pidx[p++] = k + W;
  }
  const g2 = new THREE.BufferGeometry();
  g2.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  g2.setAttribute('sunvis', new THREE.BufferAttribute(visP, 1));
  g2.setIndex(new THREE.BufferAttribute(pidx, 1));
  g2.computeVertexNormals();
  const m1 = addMesh(g1, M.terrain, { cast: true }); m1.frustumCulled = false;
  { // the station patch
    const pos3 = new Float32Array(pnx * pnz * 3), vis = new Float32Array(pnx * pnz), idx3 = [];
    for (let i = 0; i < pnz; i++) for (let j = 0; j < pnx; j++) {
      const k = i * pnx + j, x = PATCH.x0 + j * PATCH.step, z = PATCH.z0 + i * PATCH.step;
      pos3[k * 3] = x; pos3[k * 3 + 1] = Hs[k]; pos3[k * 3 + 2] = z; vis[k] = sunVis(x, Hs[k], z, true);
      if (i < pnz - 1 && j < pnx - 1) idx3.push(k, k + pnx, k + 1, k + 1, k + pnx, k + pnx + 1);
    }
    const g3 = new THREE.BufferGeometry();
    g3.setAttribute('position', new THREE.BufferAttribute(pos3, 3));
    g3.setAttribute('sunvis', new THREE.BufferAttribute(vis, 1));
    g3.setIndex(idx3); g3.computeVertexNormals();
    addMesh(g3, M.terrain, { cast: true });
  }
  const m2 = addMesh(g2, M.terrain, { cast: false }); m2.frustumCulled = false;
  return look;
}

function buildLoch() {
  const g = new THREE.CircleGeometry(30000, 128).rotateX(-Math.PI / 2).translate(0, LAKE_Y, 3000);
  const m = addMesh(g, M.water, { cast: false });
  m.frustumCulled = false;
  waterMesh = m;
}

// Crags: displaced rock lumps along the cliff so the face reads as broken rock, not a draped sheet.
function buildCrags(look) {
  const r = rng('crags');
  const base = new THREE.IcosahedronGeometry(1, 5);
  const list = [];
  for (let i = 0; i < 70; i++) {
    const x = -150 + r() * 400;
    const zs = zShore(x);
    const z = zs - 3 - r() * 9;
    if (Math.abs(x - 5) < 24 && z > 4) continue;           // keep the gully clear
    if (x > 40 && x < 62 && z > 86) continue;               // boathouse
    if (stairCarve(x, z, 1e9) < 1e9 || stairCarve(x + 5, z, 1e9) < 1e9 || stairCarve(x - 5, z, 1e9) < 1e9) continue;
    const y = look(x, z);
    if (y < LAKE_Y - 2) continue;
    const s = 3 + r() * 5;
    list.push(xf([x, y - s * 0.25, z], r() * 6.28, [s * (1 + r() * 0.8), s * (0.5 + r() * 0.5), s * (0.8 + r() * 0.6)], r() * 0.3, r() * 0.3));
  }
  const pos = base.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const k = 1 + 0.3 * fbm3(x * 0.9, y * 0.9, z * 0.9, 3) + 0.08 * noise3(x * 3.1, y * 3.1, z * 3.1);
    pos.setXYZ(i, x * k, Math.min(y * k, 0.55 + 0.1 * y * k), z * k);
  }
  base.computeVertexNormals();
  addInst(base, M.rock, list);
}
