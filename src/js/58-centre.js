// ------------------------------------------------------------------ batch 3: the centre
// The Quad (the Grand Staircase Tower is its south-west corner, three smaller towers hold the others), the Middle
// Courtyard, Gryffindor Tower, the Hospital Wing with its arched bridge to the Clock Tower, the Astronomy Tower behind
// the central tower, and the wooden suspension bridge over the stream ravine north of the castle.

// ---- Astronomy Tower (Half-Blood Prince on): square shaft, a half-round tower corbelled out on its south face, an open
// observation level, the tallest spire of the castle, and a slender turret hung on the side
function buildAstronomy() {
  const [x0, z0, x1, z1] = SITE_BY.crown.rect, x = (x0 + x1) / 2, z = (z0 + z1) / 2, w = x1 - x0, TOP = 92;
  squareTower({ x, z, w, y0: -6, y1: TOP, bands: [30, 60, 78], buttress: 0 });
  for (const [nx, nz] of [[0, -1], [0, 1], [-1, 0]]) {
    const fx = x + nx * w / 2, fz = z + nz * w / 2, tx = Math.abs(nz), tz = Math.abs(nx);
    for (let y = 4; y < 76; y += 7.5) win('lancet', [fx + tx * (y % 2 ? -2 : 2), y, fz + tz * (y % 2 ? -2 : 2)], nx, nz, 0.9, 2.8, 0, 0.4);
    for (const o of [-3, 0, 3]) win('lancet', [fx + tx * o, 83, fz + tz * o], nx, nz, 1.5, 6, 0, 0.6);
  }
  wallBox(x0 - 0.8, x1 + 0.8, TOP - 1.2, TOP + 0.6, z0 - 0.8, z1 + 0.8, 'trim', 0.05);
  merlons(x0 - 0.5, z0 - 0.5, x1 + 0.5, z0 - 0.5, TOP + 0.6, { h: 1.2, t: 0.6 });
  merlons(x0 - 0.5, z0 - 0.5, x0 - 0.5, z1, TOP + 0.6, { h: 1.2, t: 0.6 });
  merlons(x1 + 0.5, z0 - 0.5, x1 + 0.5, z1, TOP + 0.6, { h: 1.2, t: 0.6 });
  for (const [sx, sz] of [[-1, -1], [1, -1]]) { cyl(x + sx * (w / 2), z + sz * (w / 2), TOP - 8, TOP + 5, 1.3, 'stone', 10); spire(x + sx * (w / 2), z + sz * (w / 2), TOP + 5, 1.5, 6, 8, Math.PI / 8); }
  // the half-round tower on the east face, on its long inverted-cone corbel (as seen from the loch in the model photos)
  const rx = x1, rz = z, R = 6.6;
  const corb = new THREE.CylinderGeometry(R, 0.6, 14, 32, 1, false).translate(rx, 33, rz);
  put('stone', uvPlanar(corb));
  for (let k = 0; k < 4; k++) band(rx, rz, 34 + k * 1.6, R * (0.45 + k * 0.14), 0.4, 0.2);
  cyl(rx, rz, 40, 96, R, 'stone', 40);
  for (const by of [52, 70, 86]) band(rx, rz, by, R, 0.45, 0.25);
  for (let y = 44; y < 84; y += 6.5) winRing('lancet', rx, rz, R, y, 5, 0.8, 2.6, { a0: -Math.PI / 2 - 0.2, a1: Math.PI / 2 + 0.2, lit: 0.45 });
  // the observation level: a ring of tall open arches under a corbelled cornice
  corbelRing(rx, rz, R, 96, 22, 0.5);
  cyl(rx, rz, 96, 97, R + 0.7, 'trim', 40, null, false);
  winRing('lancet', rx, rz, R + 0.7, 97.6, 9, 1.5, 6.4, { lit: 0.85 });
  cyl(rx, rz, 97, 105, R + 0.7, 'stone', 40);
  band(rx, rz, 105, R + 0.7, 0.5, 0.3);
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; pinnacle(rx + Math.cos(a) * (R + 0.9), 105.4, rz + Math.sin(a) * (R + 0.9), 0.6, 4.5); }
  cone(rx, rz, 105.4, R + 0.4, 40, { n: 40, kick: 0.06 });
  // the slender turret hung on the east side
  const tx = x1 + R * 0.95, tz = z + R * 0.62, tr = 2.5;
  put('stone', uvPlanar(new THREE.CylinderGeometry(tr, 0.3, 8, 20).translate(tx, 52, tz)));
  cyl(tx, tz, 56, 108, tr, 'stone', 24);
  for (const by of [72, 90]) band(tx, tz, by, tr, 0.35, 0.2);
  for (let y = 60; y < 102; y += 8) winRing('rect', tx, tz, tr, y, 3, 0.55, 1.4, { a0: y * 0.4, a1: y * 0.4 + Math.PI * 2, lit: 0.4 });
  corbelRing(tx, tz, tr, 108, 10, 0.35);
  cyl(tx, tz, 108, 110, tr + 0.5, 'stone', 24, null, false);
  cone(tx, tz, 110, tr + 0.7, 16, { n: 24 });
}

// ---- Gryffindor Tower: tall, round, machicolated, a stair turret beside it
function buildGryffindor() {
  const [x, z, r] = SITE_BY.gryffindor.circle;
  const rows = [];
  for (let y = 6; y < 60; y += 6.2) rows.push({ kind: 'lancet', y, n: 8, w: 1.0, h: 3.2, lit: 0.6 });
  roundTower({ x, z, r, y0: -8, y1: 62, cone: 40, kick: 0.11, bands: [18, 40], winRows: rows, dormers: [[0.15, 9, 1.4], [0.38, 6, 1.2]], seed: 'gryff' });
  const a = -Math.PI * 0.7, sx = x + Math.cos(a) * (r + 1.2), sz = z + Math.sin(a) * (r + 1.2);
  put('stone', uvPlanar(new THREE.CylinderGeometry(2.8, 0.4, 6, 18).translate(sx, 27, sz)));
  cyl(sx, sz, 30, 72, 2.8, 'stone', 20);
  band(sx, sz, 71.5, 2.8, 0.4, 0.2);
  for (let y = 34; y < 70; y += 7) winRing('rect', sx, sz, 2.8, y, 3, 0.55, 1.4, { a0: y, a1: y + Math.PI * 2, lit: 0.5 });
  cone(sx, sz, 72, 3.2, 14, { n: 20, kick: 0.12 });
}

// ---- Hospital Wing: a long range with crow-stepped wall dormers, a round tower, and a covered bridge on an arch
// over the passage to the Clock Tower
function buildHospital() {
  const [x0, z0, x1, z1] = SITE_BY.hospital.rect;
  // a domestic range on the model (m49): five rows of small square-headed windows, a row of small crow-stepped wall dormers
  gothicRange({ x0, x1, z0, z1, axis: 'x', eave: 24, floors: [1.5, 5.8, 10.1, 14.4, 18.7], bay: 3.1, win: 'rect', ww: 1.0, wh: 2.0, mull: 0, gables: 'crow', dormers: 'crow', dormerStep: 4.4, dormerW: 1.9, chimneys: 3, rise: 10, ends: [false, true], bays: false });
  const tx = x0 - 5, tz = (z0 + z1) / 2;
  roundTower({ x: tx, z: tz, r: 5.6, y0: -8, y1: 30, cone: 24, kick: 0.12, mach: true, winRows: [5, 9.5, 14, 18.5, 23, 27.5].map((y, k) => ({ kind: 'round', y, n: 5, w: 0.9, h: 2.1, lit: 0.5, a0: (k % 2) * 0.63, a1: (k % 2) * 0.63 + Math.PI * 2 })) });
  // the bridge: a short covered passage at the upper floors on a single tall pointed arch
  const cx0 = SITE_BY.clock.rect[2], bz0 = tz - 3.2, bz1 = tz + 3.2;
  arcade(cx0, tz, tx - 4.8, tz, -8, 22, 1, { kind: 'lancet', spring: 0.9, pier: 0.18, depth: bz1 - bz0 });
  wallBox(cx0, tx - 4.8, 14, 23, bz0, bz1);
  gableRoof(cx0, tx - 4.8, bz0, bz1, 23, 4, { axis: 'x', gables: [false, false], over: 0.3, coping: false });
  winRow('lancet', cx0, bz1, tx - 4.8, bz1, 16, 2, 1.1, 4, { side: -1, lit: 0.6 });
  winRow('lancet', tx - 4.8, bz0, cx0, bz0, 16, 2, 1.1, 4, { side: -1, lit: 0.6 });
}

// ---- the Quad, the Middle Courtyard and the other inner ranges
function quadTower(x, z, r, y1, cone, seed) {
  roundTower({ x, z, r, y0: -6, y1, cone: cone * 1.25, kick: 0.12, mach: true, bands: [14], seed,
    winRows: [5, 9.5, 14, 18.5, 23, 27.5, 32].filter((y) => y < y1 - 3).map((y, k) => ({ kind: 'round', y, n: 6, w: 0.9, h: 2.1, lit: 0.5, a0: (k % 2) * 0.52, a1: (k % 2) * 0.52 + Math.PI * 2 })) });
}
function buildCentre() {
  // Quad: courtyard x -40..-2, z -32..6; ranges with cloister walks facing in
  gothicRange({ x0: -47, x1: 8, z0: -42, z1: -32, axis: 'x', eave: 24, cloister: 's', gables: 'crow', floors: [2, 8.5, 15, 20.5], chimneys: 3 });
  gothicRange({ x0: -52, x1: -40, z0: -32, z1: -1, axis: 'z', eave: 21, cloister: 'e', chimneys: 1, ends: [false, true] });
  gothicRange({ x0: -2, x1: 8, z0: -32, z1: 6, axis: 'z', eave: 22, cloister: 'w', chimneys: 1, ends: [false, true] });
  gothicRange({ x0: -14, x1: -2, z0: 6, z1: 14, axis: 'x', eave: 20, cloister: 'n', dormers: null, chimneys: 1 });
  gothicRange({ x0: -40, x1: -30, z0: 6, z1: 12, axis: 'x', eave: 18, dormers: null, chimneys: 0 });
  quadTower(-47.5, -37.5, 5.2, 36, 17, 'qnw');
  quadTower(6, -37.5, 5.6, 40, 19, 'qne');
  quadTower(4, 7.5, 4.4, 34, 15, 'qse');
  // paths and a little fountain in the lawn
  wallBox(-40, -2, -1.4, 0.06, -14.5, -11.5, 'trim', 0.04);
  wallBox(-22.5, -19.5, -1.4, 0.06, -32, 6, 'trim', 0.04);
  for (const [a0, b0, a1, b1] of [[-40, -32, -2, -29.6], [-40, 3.6, -2, 6], [-40, -32, -37.6, 6], [-4.4, -32, -2, 6]]) wallBox(a0, a1, -1.4, 0.06, b0, b1, 'trim', 0.04);
  cyl(-21, -13, 0, 0.8, 2.6, 'trim', 12, null, false);
  put('stream', new THREE.CircleGeometry(2.3, 12).rotateX(-Math.PI / 2).translate(-21, 0.7, -13));
  cyl(-21, -13, 0, 2.2, 0.35, 'trim', 10, 0.25, false);
  // Middle Courtyard: courtyard x -118..-70, z -30..10
  gothicRange({ x0: -110, x1: -47, z0: -42, z1: -30, axis: 'x', eave: 19, cloister: 's', parapet: 'battlement', chimneys: 2, ends: [false, false], dormers: 'stone' });
  gothicRange({ x0: -128, x1: -118, z0: -30, z1: 10, axis: 'z', eave: 20, cloister: 'e', chimneys: 1, dormers: 'stone' });
  gothicRange({ x0: -70, x1: -52, z0: -30, z1: -2, axis: 'z', eave: 22, cloister: 'w', chimneys: 2, ends: [false, true] });
  gothicRange({ x0: -128, x1: -70, z0: 10, z1: 22, axis: 'x', eave: 20, cloister: 'n', dormers: 'stone', chimneys: 2, ends: [true, false] });
  // the other inner ranges
  gothicRange({ x0: 8, x1: 44, z0: -40, z1: -30, axis: 'x', eave: 20, win: 'round', parapet: 'battlement', chimneys: 2, ends: [false, false] });
  gothicRange({ x0: 8, x1: 19, z0: -24, z1: 4, axis: 'z', eave: 24, chimneys: 1 });
  gothicRange({ x0: 19, x1: 41, z0: -16, z1: 18, axis: 'z', eave: 26, buttresses: true, parapet: 'pinnacle', chimneys: 2 });
  gothicRange({ x0: 70, x1: 98, z0: 8, z1: 34, axis: 'x', eave: 23, chimneys: 2, gables: 'crow' });
  roundTower({ x: 30, z: 9, r: 4, y0: -6, y1: 40, cone: 16, mach: false, winRows: [20, 28, 34].map((y) => ({ kind: 'rect', y, n: 5, w: 0.8, h: 1.8 })) });
}

// ---- the stream ravine north of the castle and the wooden suspension bridge over it
function buildRavineStream() {
  ribbon(RAVINE, 2.6, 'stream', 0.22, (x, z) => groundH(x, z), 2);
}
function buildSuspension() {
  const [[ax, az], [bx, bz]] = SITE_BY.suspension.line;
  const yA = groundH(ax, az) + 1.2, yB = groundH(bx, bz) + 1.0, sag = 2.4, W = 2.4, hw = W / 2;
  const L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L, nx = -uz, nz = ux;
  const P = (s, off, dy = 0) => { const t = s / L; return [ax + ux * s + nx * off, lerp(yA, yB, t) - sag * 4 * t * (1 - t) + dy, az + uz * s + nz * off]; };
  // planks
  for (let s = 0.3; s < L; s += 0.62) {
    const a = P(s, -hw), b = P(s, hw);
    beam([a[0], a[1], a[2]], [b[0], b[1], b[2]], 0.14);
  }
  for (const side of [-1, 1]) {
    const pts = []; for (let s = 0; s <= L + 0.01; s += 2) pts.push(P(s, side * hw));
    for (let i = 0; i < pts.length - 1; i++) {
      beam(pts[i], pts[i + 1], 0.22);                                                     // stringer
      beam([pts[i][0], pts[i][1] + 1.05, pts[i][2]], [pts[i + 1][0], pts[i + 1][1] + 1.05, pts[i + 1][2]], 0.08, 'lead');   // hand rope
    }
    // main cables from the tower heads, sagging deeper than the deck, with hangers
    const top = (s) => { const t = s / L; return lerp(yA + 7, yB + 6, t) - (sag + 4.2) * 4 * t * (1 - t); };
    let prev = null;
    for (let s = 0; s <= L + 0.01; s += 1.6) {
      const p = P(s, side * (hw + 0.1)), q = [p[0], Math.max(top(s), p[1] + 1.05), p[2]];
      if (prev) beam(prev, q, 0.1, 'lead');
      beam([p[0], p[1], p[2]], q, 0.04, 'lead');
      prev = q;
    }
  }
  // the castle end: two linked round turrets and a gate arch; the far end: timber posts and a stone archway
  for (const off of [-hw - 2.6, hw + 2.6]) {
    const tx = ax + nx * off, tz = az + nz * off;
    roundTower({ x: tx, z: tz, r: 2.3, y0: yA - 14, y1: yA + 9, cone: 7.5, mach: false, kick: 0.12, winRows: [{ kind: 'rect', y: yA + 3, n: 3, w: 0.5, h: 1.2 }] });
  }
  arcade(ax + nx * (-hw - 1), az + nz * (-hw - 1), ax + nx * (hw + 1), az + nz * (hw + 1), yA - 0.2, 6.5, 1, { kind: 'lancet', spring: 0.88, pier: 0.12, depth: 1.6 });
  for (const off of [-hw - 0.4, hw + 0.4]) beam([bx + nx * off, yB - 2, bz + nz * off], [bx + nx * off, yB + 6.2, bz + nz * off], 0.45);
  beam([bx + nx * (-hw - 0.4), yB + 6, bz + nz * (-hw - 0.4)], [bx + nx * (hw + 0.4), yB + 6, bz + nz * (hw + 0.4)], 0.35);
  const gx = bx + ux * 5, gz = bz + uz * 5, gy = groundH(gx, gz);
  arcade(gx + nx * -3.2, gz + nz * -3.2, gx + nx * 3.2, gz + nz * 3.2, gy - 0.5, 6, 1, { kind: 'round', spring: 0.82, pier: 0.32, depth: 1.4 });
  ribbon(BRIDGE_PATH, 2.4, 'dirt', 0.12);   // a path from the far gate up into the hills
  // a walled walk from the Quad's north range to the gate
  const wz0 = SITE_BY.quad.rect[1] - 10, wz1 = az + 2;
  for (const off of [-hw - 0.9, hw + 0.9]) wallBox(ax + off - 0.3, ax + off + 0.3, -3, 1.4, Math.min(wz0, wz1), Math.max(wz0, wz1), 'stone', 0.05);
  wallBox(ax - hw - 0.6, ax + hw + 0.6, -3, 0.12, Math.min(wz0, wz1), Math.max(wz0, wz1), 'trim', 0.04);
}
