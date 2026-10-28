// ------------------------------------------------------------------ batch 4: the north and the far grounds
// The Owlery on its rock spire north-west of the Wooden Bridge, the north gatehouse and curtain wall east of the
// greenhouses (the miniature photo m42), the Training Grounds inside it (the open ground of the flying lessons), the
// Forbidden Forest.
M.oakleaf = procMat({ name: 'oakleaf', rgb: [1, 1, 1], rough: 0.85, bump: 1, frag: /* glsl */ `
  float n = cgFbm3(P * 0.35); float fl = cgVn(P * 2.2);
  vec3 g = mix(vec3(0.016, 0.028, 0.012), vec3(0.04, 0.052, 0.022), n);
  g += vec3(0.014, 0.016, 0.004) * smoothstep(0.6, 0.95, fl);
  diffuseColor.rgb *= g * (0.6 + 0.4 * smoothstep(-0.4, 0.8, N.y));
  cgH = cgVn(P * 1.6) * 0.18 + fl * 0.06;
  cgSpec = 0.25; cgAO = 0.7 + 0.3 * smoothstep(-0.4, 0.8, N.y);
` });
M.oakbark = procMat({ name: 'oakbark', rgb: [1, 1, 1], rough: 0.92, bump: 1, frag: /* glsl */ `
  float f = 1.0 - abs(cgVn(vec3(P.x * 4.0, P.y * 0.7, P.z * 4.0)) * 2.0 - 1.0);
  vec3 c = mix(vec3(0.05, 0.045, 0.036), vec3(0.11, 0.1, 0.085), cgFbm3(P * 0.8)) * mix(0.55, 1.0, smoothstep(0.15, 0.5, 1.0 - f));
  c = mix(c, vec3(0.05, 0.075, 0.03), smoothstep(0.55, 0.8, cgFbm3(P * 0.5 + 2.0)) * 0.6);
  diffuseColor.rgb *= c; cgH = f * f * 0.05;
` });
M.twig = procMat({ name: 'twig', rgb: [0.17, 0.105, 0.05], rough: 0.85, frag: /* glsl */ `
  diffuseColor.rgb *= 0.7 + 0.6 * cgVn(P * vec3(30.0, 30.0, 30.0));
` });
M.strapDark = procMat({ name: 'strapDark', rgb: [0.06, 0.04, 0.025], rough: 0.6 });

// ---- the Owlery: a steep faceted rock spire, a slender round tower with a machicolated top and a taller turret
let OWL_TOP = 0;
function buildOwlery(look) {
  const [ox, oz, rb] = SITE_BY.owlery.circle;
  const g0 = look(ox, oz) - 6, H = 54;
  // the spire: a lathe profile, displaced by ridged noise into faceted buttresses
  const prof = [];
  for (let i = 0; i <= 24; i++) { const t = i / 24; prof.push(new THREE.Vector2(rb * Math.pow(1 - t, 0.95) * (1 - 0.2 * t) + 4.6 * t * t, g0 + H * t)); }
  prof.push(new THREE.Vector2(0.01, g0 + H));
  const spireG = new THREE.LatheGeometry(prof, 72);
  const p = spireG.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), r = Math.hypot(x, z);
    if (r < 0.1) { p.setXYZ(i, x + ox, y, z + oz); continue; }
    const a = Math.atan2(z, x), t = (y - g0) / H;
    const ridge = 1 - Math.abs(noise3(Math.cos(a) * 3.1, y / 11, Math.sin(a) * 3.1) * 2);
    const ridge2 = 1 - Math.abs(noise3(Math.cos(a) * 7.0 + 3, y / 5, Math.sin(a) * 7.0) * 2);
    const ledge = Math.abs(((y * 0.16 + noise3(Math.cos(a), y / 30, Math.sin(a)) * 1.2) % 1 + 1) % 1 - 0.5);
    const k = 1 + 0.42 * ridge * ridge * (1 - t * 0.5) + 0.12 * ridge2 + 0.1 * noise3(x / 5, y / 7, z / 5) - 0.08 * ledge;
    p.setXYZ(i, x * k + ox, y + (t > 0.97 ? 0 : 0), z * k + oz);
  }
  spireG.computeVertexNormals();
  put('rock', spireG);
  OWL_TOP = g0 + H;
  // a little path of steps winding up the south face
  for (let k = 0; k < 24; k++) {   // cut into the rock face (the outer half of each step shows), stopping short of the summit
    const t = k / 25, a = -0.6 + t * 2.4, rr = (rb * Math.pow(1 - t, 0.95) * (1 - 0.2 * t) + 4.6 * t * t) * 0.92 + 0.4, y = g0 + 6 + t * (H - 6);
    const x = ox + Math.cos(a) * rr, z = oz + Math.sin(a) * rr;
    wallBox(x - 1.1, x + 1.1, y - 0.6, y, z - 1.1, z + 1.1, 'rubble', 0.1);
  }
  // the tower: a slender shaft with a few slit windows, a corbelled crown with the owls' arched openings, a short cone
  const T = OWL_TOP - 1, R = 3.7, SH = 34;
  cyl(ox, oz, T - 3, T + SH, R, 'rubble', 32);
  put('rubble', uvPlanar(new THREE.CylinderGeometry(R + 0.2, R + 1.4, 3, 32).translate(ox, T - 1, oz)));   // a battered foot on the rock
  for (const y of [T + 5, T + 12, T + 19]) winRing('rect', ox, oz, R, y, 3, 0.45, 1.5, { a0: y, a1: y + Math.PI * 2, lit: 0.35 });
  band(ox, oz, T + 24, R, 0.4, 0.2);
  corbelRing(ox, oz, R, T + SH - 5.5, 18, 0.5);
  cyl(ox, oz, T + SH - 5.5, T + SH, R + 0.9, 'rubble', 32, null, false);
  winRing('round', ox, oz, R + 0.9, T + SH - 4.4, 8, 0.95, 2.4, { lit: 0.6 });   // the owls' arched openings
  for (let k = 0; k < 16; k++) { const a2 = (k / 16) * Math.PI * 2; place('rmerlon', xf([ox + Math.cos(a2) * (R + 0.7), T + SH, oz + Math.sin(a2) * (R + 0.7)], Math.atan2(Math.cos(a2), Math.sin(a2)), [1.0, 0.9, 0.45])); }
  cone(ox, oz, T + SH + 0.2, R + 0.6, 9, { n: 32, kick: 0.1 });
  // the stair turret, corbelled out of the shaft's side and rising above the crown with its own tall spire
  const tx = ox + R * 0.95, tz = oz - R * 0.5, tr = 2.2;
  put('rubble', uvPlanar(new THREE.CylinderGeometry(tr, 0.3, 6, 18).translate(tx, T + 13, tz)));
  cyl(tx, tz, T + 16, T + SH + 5, tr, 'rubble', 20);
  for (const y of [T + 20, T + 26, T + 32]) winRing('rect', tx, tz, tr, y, 2, 0.4, 1.2, { a0: y, a1: y + Math.PI * 2, lit: 0.4 });
  corbelRing(tx, tz, tr, T + SH + 5, 10, 0.32);
  cyl(tx, tz, T + SH + 5, T + SH + 6.4, tr + 0.45, 'rubble', 20, null, false);
  cone(tx, tz, T + SH + 6.4, tr + 0.55, 12, { n: 20 });
}

// ---- the north gatehouse and curtain wall (east of the greenhouses), the road out toward Hogsmeade
function curtain(pts, h, look, { t = 1.6, walk = true } = {}) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), n = Math.ceil(L / 8);
    for (let k = 0; k < n; k++) {
      const x0 = lerp(ax, bx, k / n), z0 = lerp(az, bz, k / n), x1 = lerp(ax, bx, (k + 1) / n), z1 = lerp(az, bz, (k + 1) / n);
      const gy = Math.min(look(x0, z0), look(x1, z1), look((x0 + x1) / 2, (z0 + z1) / 2));
      const top = Math.max(look(x0, z0), look(x1, z1)) + h;
      const g = new THREE.BoxGeometry(Math.hypot(x1 - x0, z1 - z0) + 0.4, top - gy + 3, t).translate(0, (top + gy - 3) / 2, 0)
        .rotateY(-Math.atan2(z1 - z0, x1 - x0)).translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
      put('rubble', uvPlanar(g));
      if (walk) merlons(x0, z0, x1, z1, top, { h: 1.1, mw: 1.0, gap: 0.7, t: t * 0.45, proto: 'rmerlon' });
    }
  }
}
function octTower(x, z, r, y0, y1, seed) {
  put('rubble', uvPlanar(new THREE.CylinderGeometry(r, r + 0.6, 2.5, 8, 1, false).rotateY(Math.PI / 8).translate(x, y0 + 1.25, z)));   // battered foot
  put('rubble', uvPlanar(new THREE.CylinderGeometry(r, r, y1 - y0, 8, 1, false).rotateY(Math.PI / 8).translate(x, (y0 + y1) / 2, z)));
  put('rubble', uvPlanar(new THREE.CylinderGeometry(r + 0.35, r + 0.35, 0.5, 8, 1, false).rotateY(Math.PI / 8).translate(x, y1 - 1.2, z)));
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2, cx = x + Math.cos(a) * (r * 0.97), cz = z + Math.sin(a) * (r * 0.97);
    place('rmerlon', xf([cx, y1, cz], Math.atan2(Math.cos(a), Math.sin(a)), [r * 0.62, 1.1, 0.5]));
  }
  for (const y of [y0 + 6, y0 + 11]) winRing('rect', x, z, r * 0.93, y, 3, 0.45, 1.3, { a0: y + seed, a1: y + seed + Math.PI * 2, lit: 0.45 });
}
function buildGatehouse(look) {
  const [x0, z0, x1, z1] = SITE_BY.gate.rect, xm = (x0 + x1) / 2, zm = (z0 + z1) / 2;
  const gy = Math.min(look(x0, z0), look(x1, z1), look(x0, z1), look(x1, z0)) - 2;
  // the gate block with its passage running east-west, crenellated
  const gb0 = zm - 5, gb1 = zm + 5, GH = gy + 14;
  wallBox(x0, x1, gy - 2, GH, gb0, gb1, 'rubble', 0.08);
  for (const [a0, b0, a1, b1] of [[x0, gb0 - 0.2, x1, gb0 - 0.2], [x0, gb1 + 0.2, x1, gb1 + 0.2], [x0 - 0.2, gb0, x0 - 0.2, gb1]]) merlons(a0, b0, a1, b1, GH, { h: 1.1, t: 0.5, proto: 'rmerlon' });
  win('round', [x0, gy + 2, zm], -1, 0, 3.4, 5.6, 0, 0.9);
  // the outer face: a pointed arch in a slightly projecting frontispiece between two octagonal towers
  wallBox(x1, x1 + 1.4, gy - 2, GH - 1.5, zm - 2.8, zm + 2.8, 'rubble', 0.06);
  win('lancet', [x1 + 1.4, gy + 2, zm], 1, 0, 3.2, 6.4, 0, 0.9);
  win('rect', [x1 + 1.4, gy + 10, zm], 1, 0, 0.7, 1.6, 0, 0.6);
  merlons(x1 + 1.6, zm - 2.8, x1 + 1.6, zm + 2.8, GH - 1.5, { h: 1.0, t: 0.5, proto: 'rmerlon' });
  octTower(x1 + 0.6, gb0 - 0.6, 3.6, gy - 2, gy + 17, 0.3);
  octTower(x1 + 0.6, gb1 + 0.6, 3.6, gy - 2, gy + 17, 1.1);
  // the keep-like block on the inner side, taller, crenellated, with paired windows
  { const k0 = x0 - 7, k1 = x0 + 0.5, kz0 = zm - 6.5, kz1 = zm + 6.5, top = gy + 19;
    wallBox(k0, k1, gy - 2, top, kz0, kz1, 'rubble', 0.08);
    wallBox(k0 - 0.4, k1 + 0.4, top - 1.0, top, kz0 - 0.4, kz1 + 0.4, 'rubble', 0.05);
    for (const [a0, b0, a1, b1] of [[k0 - 0.3, kz0 - 0.3, k1 + 0.3, kz0 - 0.3], [k0 - 0.3, kz1 + 0.3, k1 + 0.3, kz1 + 0.3], [k0 - 0.3, kz0 - 0.3, k0 - 0.3, kz1 + 0.3]]) merlons(a0, b0, a1, b1, top, { h: 1.1, t: 0.5, proto: 'rmerlon' });
    for (const y of [gy + 7, gy + 13]) for (const z of [zm - 3, zm + 3]) win('lancet', [k0, y, z], -1, 0, 0.8, 2.4, 0, 0.5); }
  // a square tower to the north, its foot on the curtain wall
  { const ta = gb1 + 4, tb = gb1 + 10.5, top = gy + 17, w = 6.5, tx0 = xm - w / 2, tx1 = xm + w / 2;
    wallBox(tx0, tx1, gy - 2, top, ta, tb, 'rubble', 0.08);
    wallBox(tx0 - 0.6, tx1 + 0.6, top - 1.2, top, ta - 0.6, tb + 0.6, 'rubble', 0.05);
    for (const [a0, b0, a1, b1] of [[tx0 - 0.4, ta - 0.4, tx1 + 0.4, ta - 0.4], [tx0 - 0.4, tb + 0.4, tx1 + 0.4, tb + 0.4], [tx0 - 0.4, ta - 0.4, tx0 - 0.4, tb + 0.4], [tx1 + 0.4, ta - 0.4, tx1 + 0.4, tb + 0.4]]) merlons(a0, b0, a1, b1, top, { h: 1.2, t: 0.5, proto: 'rmerlon' });
    for (const y of [gy + 5, gy + 11]) { win('rect', [tx1, y, (ta + tb) / 2], 1, 0, 0.6, 1.5, 0, 0.5); win('rect', [tx0, y, (ta + tb) / 2], -1, 0, 0.6, 1.5, 0, 0.5); }
    win('round', [tx1, gy + 0.5, (ta + tb) / 2], 1, 0, 1.2, 2.4, 0, 0.3); }
  // the curtain wall: south to the greenhouse wall at the cliff; north-north-east along the Training Grounds the whole way
  // to the ruins (m42, m45: in the miniature photo's solved camera its foot lands on this line), whole for the first
  // 180 m, then fallen like the ruins it runs into, broken lower and lower to the end of their arcade
  curtain([[xm, gb0 - 4.6], [xm, 38]], 5.5, look);
  curtain([[xm, gb1 + 10.5], [xm, gb0 - 0.5]], 5.5, look);
  const [[wa, wb], [wc, wd]] = FIELD_WALL, wk = 0.82, wx = lerp(wa, wc, wk), wz = lerp(wb, wd, wk);
  curtain([[wa, wb], [wx, wz]], 5.5, look);
  { const y0 = Math.min(look(wx, wz), look(wc, wd), look((wx + wc) / 2, (wz + wd) / 2)), heaps = [];
    ruinWall(wx, wz, wc, wd, y0, 6.4, 1.6, 'curtainEnd', { lo: 0.35, breach: 0.35, ends: [false, true] });
    for (const [k, r, n] of [[0.3, 2.2, 14], [0.75, 2.8, 20]]) rubbleHeap(lerp(wx, wc, k) - 2.2, lerp(wz, wd, k) + 0.6, look(lerp(wx, wc, k), lerp(wz, wd, k)), r, n, 'ce' + k, heaps);
    addInst(angularRockGeo(4.3), M.ruinstone, heaps); }
  // the road: out through the gate to the east, round to the north-east toward Hogsmeade; inside, to the great door
  ribbon(ROAD_PTS, 3.4, 'dirt', 0.14);
  ribbon([[x0 - 1, zm], [205, zm - 6], [194, -10], [188, -13]], 3, 'dirt', 0.14);
}

// ---- the Training Grounds: the open ground inside the north gate between the castle and the ruins, the curtain on the
// east, a rocky hill on the west (m42, m45); two rows of brooms laid out facing each other near the bell towers, as for
// the first flying lesson (filmed in Alnwick Castle's outer bailey)
// a school broom: a slightly crooked, varnished handle; a bundle of sixty dark twigs bound in two places at its end and
// splaying out into a loose brush, flattened where it lies on the grass
function broomGeo() {
  const handle = new THREE.CylinderGeometry(0.022, 0.03, 1.6, 10, 8).rotateZ(Math.PI / 2), hp = handle.attributes.position;
  for (let i = 0; i < hp.count; i++) { const x = hp.getX(i); hp.setY(i, hp.getY(i) + 0.012 * Math.sin(x * 3.1)); hp.setZ(i, hp.getZ(i) + 0.01 * Math.sin(x * 2.3 + 1)); }
  handle.computeVertexNormals(); handle.translate(0.25, 0.05, 0);
  const R = rng('broomtwigs'), twigs = [], x0 = -0.55;   // the binding point; twigs run from it toward -x
  for (let k = 0; k < 60; k++) {
    const a = R() * Math.PI * 2, r0 = 0.035 * Math.sqrt(R()), spread = 0.08 + 0.08 * R(), len = 0.5 + 0.18 * R();
    const p0 = new THREE.Vector3(x0 + 0.1, 0.06 + r0 * Math.sin(a) * 0.8, r0 * Math.cos(a));
    const p1 = new THREE.Vector3(x0 - len, 0.06 + (r0 + spread) * Math.sin(a) * 0.55 - 0.02, (r0 + spread) * Math.cos(a) * 1.15);
    const d = p1.clone().sub(p0), g = new THREE.CylinderGeometry(0.0035, 0.006, d.length(), 3, 1);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())).translate(...p0.clone().add(p1).multiplyScalar(0.5).toArray());
    twigs.push(g);
  }
  const bristle = merge(twigs);
  const band = merge([0, 0.09].map((o) => new THREE.TorusGeometry(0.043, 0.008, 6, 16).rotateY(Math.PI / 2).translate(x0 + 0.02 + o, 0.06, 0)));
  return { handle, bristle, band };
}
M.broomwood = procMat({ name: 'broomwood', rgb: [0.3, 0.17, 0.075], rough: 0.4, frag: /* glsl */ `
  diffuseColor.rgb *= 0.8 + 0.35 * cgVn(P * vec3(4.0, 60.0, 60.0));
` });
function buildLawn(look) {
  const [x0, z0, x1, z1] = SITE_BY.lawn.rect;
  // no lawn of its own: the Training Grounds are the open, rough grass between the castle and the ruins (m45), and the
  // lesson is laid out on it near the bell towers: two facing rows of brooms
  const { handle, bristle, band } = broomGeo(), hs = [], bs = [];
  const cx = (x0 + x1) / 2 - 4, cz = (z0 + z1) / 2, R = rng('brooms');
  LAWN_BROOMS.at.length = 0;
  for (const side of [-1, 1]) for (let i = 0; i < 12; i++) {
    const x = cx - 22 + i * 4.0 + (R() - 0.5) * 0.4, z = cz + side * 3.4, yy = look(x, z) + 0.07;
    const ry = Math.PI / 2 + (R() - 0.5) * 0.12 + (side > 0 ? Math.PI : 0), m = xf([x, yy, z], ry, 1);
    hs.push(m); bs.push(m); LAWN_BROOMS.at.push([x, yy, z, ry]);
  }
  LAWN_BROOMS.ims = [addInst(handle, M.broomwood, hs), addInst(bristle, M.twig, bs), addInst(band, M.strapDark, bs)];
}
// a few brooms that will not lie still (the snitch film, flying low between the rows): [row (0 the north one, 1 the
// south), place in it (0 west .. 11 east), how it plays up, phase]. hop: jumps and flops down a little turned, round and
// round; buck: hangs head-high, pitching and rolling like a horse that will not be ridden; squirm: wriggles on the
// grass; wag: the twig end lifts and slaps down, the handle's tip on the ground; leap: shoots up, hovers, drops, lies a
// moment; spin: turns round and round on the spot, scraping. Our own designs, in the spirit of the book's first lesson
// (the ones in the air go up near the camera's height, 1.6-1.9 m: from 2 m up a broom a metre off the grass read as one
// lying further off; searched: 2.2 m from the snitch and the camera at the nearest; the leap goes up as the snitch comes)
const LAWN_BROOMS = { ims: [], at: [], wild: [[0, 9, 'hop', 0.3], [1, 8, 'buck', 1.1], [0, 6, 'squirm', 0.6], [1, 5, 'wag', 0.2], [0, 3, 'leap', 0.47], [1, 2, 'spin', 0.5]] };
const _bm = new THREE.Matrix4(), _bp = new THREE.Matrix4(), _bq = new THREE.Quaternion(), _be = new THREE.Euler();
function broomsMove(t) {   // t: film time (on = false: all lying still again)
  if (!LAWN_BROOMS.ims.length) return;
  for (const [row, i, kind, ph] of LAWN_BROOMS.wild) {
    const k = row * 12 + i, [x, yy, z, ry] = LAWN_BROOMS.at[k], u = t + ph * 3;
    let lift = 0, yaw = 0, pitch = 0, roll = 0, slide = 0, tip = 0;   // tip: pitch about the handle's tip (x 1.05), not the middle
    if (t === null) { /* lying still */ }
    else if (kind === 'hop') { const c = u / 0.95, n = Math.floor(c), f = c - n, a = Math.min(f / 0.6, 1);
      lift = f < 0.6 ? 0.8 * 4 * a * (1 - a) : 0.03 * Math.exp(-(f - 0.6) * 18) * Math.abs(Math.sin((f - 0.6) * 40));
      yaw = 0.45 * (n + smooth(0, 0.6, f)); pitch = 0.28 * Math.sin(Math.PI * a) * (f < 0.6 ? 1 : 0); roll = 0.5 * Math.sin(Math.PI * a) * (f < 0.6 ? 1 : 0); }
    else if (kind === 'buck') { lift = 1.6 + 0.22 * Math.sin(u * 2.3) + 0.1 * Math.sin(u * 5.3 + 1);
      pitch = 0.4 * Math.sin(u * 3.1) + 0.12 * Math.sin(u * 7.7); roll = 0.32 * Math.sin(u * 4.1 + 2); yaw = 0.3 * Math.sin(u * 1.4); }
    else if (kind === 'squirm') { const burst = 0.45 + 0.55 * Math.max(0, Math.sin(u * 1.9));
      yaw = 0.42 * Math.sin(u * 7.0) * burst; slide = 0.22 * Math.sin(u * 3.3) * burst; roll = 0.9 * Math.sin(u * 5.2 + 1) * burst; lift = 0.04 * Math.abs(Math.sin(u * 7.0)) * burst; }
    else if (kind === 'wag') tip = 0.62 * Math.pow(Math.abs(Math.sin(u * 3.4)), 1.6) * (0.65 + 0.35 * Math.sin(u * 0.9));
    else if (kind === 'leap') { const c = (u % 3.4) / 3.4;   // up in 0.4 s, 1.6 s hovering, down in 0.35 s, lying 1.05 s
      const up = smooth(0, 0.12, c), dn = smooth(0.59, 0.69, c), hov = up * (1 - dn);
      lift = (dn > 0 ? 1.9 * (1 - dn * dn) : 1.9 * up) + hov * 0.1 * Math.sin(u * 4.4);
      pitch = hov * 0.15 * Math.sin(u * 3.3) + (up < 1 ? 0.4 * Math.sin(Math.PI * up) : 0); roll = hov * 0.2 * Math.sin(u * 2.7 + 1); }
    else if (kind === 'spin') { yaw = u * 2.6 + 0.6 * Math.sin(u * 1.3); lift = 0.05 * Math.abs(Math.sin(u * 5.2)); roll = 0.15 * Math.sin(u * 5.2); }
    // brooms lie with the handle along their own x; the binding (and the middle) at the origin
    _be.set(roll, ry + yaw, pitch, 'YZX'); _bq.setFromEuler(_be);
    _bm.compose(new THREE.Vector3(x + Math.cos(ry + yaw) * slide, yy + lift, z - Math.sin(ry + yaw) * slide), _bq, new THREE.Vector3(1, 1, 1));
    if (tip) { _bp.makeTranslation(1.05, 0, 0).multiply(new THREE.Matrix4().makeRotationZ(-tip)).multiply(new THREE.Matrix4().makeTranslation(-1.05, 0, 0)); _bm.multiply(_bp); }
    for (const im of LAWN_BROOMS.ims) im.setMatrixAt(k, _bm);
  }
  for (const im of LAWN_BROOMS.ims) im.instanceMatrix.needsUpdate = true;
}

// ---- the Forbidden Forest: giant old trees along the edge, a path in from Hagrid's hut, mist among the trees
const ROAD_PTS = [[235, 1], [262, -3], [300, -18], [340, -60], [380, -120], [420, -200], [470, -300], [520, -420]];
const FOREST_PATH = [[-452, 56], [-478, 48], [-505, 40], [-540, 30], [-580, 18], [-625, 4], [-680, -16], [-740, -40]];
function oakTree(x, z, y, s, seed) {
  const R = rng('oak' + seed), T = (dx, dy, dz) => [x + dx * s, y + dy * s, z + dz * s];
  const lean = (R() - 0.5) * 0.8;
  taperTube([T(0, -0.6, 0), T(lean * 0.3, 2.5, 0.1), T(lean * 0.7, 5.5, -0.2), T(lean, 8, 0)], 1.25 * s, 0.6 * s, 18, 12, 0.35, seed, 'oakbark');
  for (let k = 0; k < 4; k++) { // buttress roots
    const a = (k / 4) * Math.PI * 2 + R();
    taperTube([T(0, 1.4, 0), T(Math.cos(a) * 1.3, 0.3, Math.sin(a) * 1.3), T(Math.cos(a) * 2.6, -0.4, Math.sin(a) * 2.6)], 0.55 * s, 0.12 * s, 8, 7, 0.2, seed + k, 'oakbark');
  }
  const crown = [];
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + R() * 0.6, L = 5 + R() * 4, up = 4 + R() * 4;
    const end = T(lean + Math.cos(a) * L, 8 + up, Math.sin(a) * L);
    taperTube([T(lean, 7.6, 0), T(lean + Math.cos(a) * L * 0.45, 8 + up * 0.7, Math.sin(a) * L * 0.45), end], 0.5 * s, 0.14 * s, 10, 7, 0.2, seed + 10 + k, 'oakbark');
    crown.push(end);
  }
  crown.push(T(lean, 18, 0));
  const clumps = [];
  for (const [cx0, cy0, cz0] of crown) for (let j = 0; j < 3; j++) {
    const rs = (2.4 + R() * 1.6) * s, cx = cx0 + (R() - 0.5) * rs * 1.4, cy = cy0 + (R() - 0.3) * rs * 0.8, cz = cz0 + (R() - 0.5) * rs * 1.4;
    clumps.push([cx, cy, cz, rs, rs * 0.7, rs, Math.round(70 * (rs / (3.2 * s)) ** 2)]);
  }
  addMesh(cardCrown(clumps, 1.7 * s, 'oak' + seed, T(lean, 13, 0)), M.leafCard);
}
function buildForest(look) {
  const R = rng('forest');
  let n = 0;
  for (let i = 0; i < 400 && n < 34; i++) {
    const z = -240 + R() * 340, x = -478 - R() * 70 - Math.max(0, (z - 40) * 0.2);
    if (nearPolyline(x, z, FOREST_PATH, 7) || nearPolyline(x, z, PATH_PTS, 10) || pitchMetric(x, z, 30) < 1.2) continue;
    if (Math.hypot(x - SITE_BY.hagrid.circle[0], z - SITE_BY.hagrid.circle[1]) < 30) continue;
    const y = look(x, z); if (y < LAKE_Y + 3) continue;
    oakTree(x, z, y, 0.9 + R() * 0.5, i); n++;
  }
  ribbon(FOREST_PATH, 2.2, 'dirt', 0.12);
  // low mist banks inside the forest, facing the castle
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...ATMO, uSeed: { value: 0 } }, transparent: true, depthWrite: false,
    vertexShader: /* glsl */ `varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `${NOISE}${ATMO_GLSL}
      uniform float uSeed; varying vec2 vUv; varying vec3 vW;
      void main(){
        float n = cgFbm2(vUv * vec2(4.0, 1.5) + uSeed * 7.0 + vec2(uTime * 0.02, 0.0));
        float shape = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x) * smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.3, vUv.y + (n - 0.5) * 0.4);
        float a = clamp((n - 0.35) * 2.0, 0.0, 1.0) * shape;
        vec3 c = mix(vec3(0.42, 0.46, 0.46), vec3(0.6, 0.63, 0.62), vUv.y) * (1.0 - 0.9 * uNight) + vec3(0.02, 0.025, 0.035) * uNight;
        gl_FragColor = vec4(atmoApply(c, vW), a * 0.42);
      }`,
  });
  for (let i = 0; i < 16; i++) {
    const z = -260 + R() * 330, x = -520 - R() * 180, y = look(x, z);
    const m = mat.clone(); m.uniforms.uSeed.value = R() * 10;
    const q = new THREE.Mesh(new THREE.PlaneGeometry(70 + R() * 70, 12 + R() * 8), m);
    q.position.set(x, y + 5 + R() * 3, z); q.rotation.y = Math.PI / 2 + (R() - 0.5) * 0.6;
    q.renderOrder = 3; scene.add(q);
  }
}
// the hill west of the Training Grounds: its steep middle is rock (the terrain's rounded masses); here, blocks fallen
// to its foot and crags breaking the turf above the face (m45), and low grey rock through the turf of the open ground
function buildFieldRocks(look) {
  const R = rng('fieldrocks'), big = [[], []], low = [];
  for (let i = 0; i < FIELD_TOE.length - 1; i++) {
    const [ax, az] = FIELD_TOE[i], [bx, bz] = FIELD_TOE[i + 1], L = Math.hypot(bx - ax, bz - az), nx = (bz - az) / L, nz = -(bx - ax) / L;   // n: into the hill
    for (let u = 0; u < L; u += 7 + R() * 6) {
      const px = lerp(ax, bx, u / L), pz = lerp(az, bz, u / L);
      if (pz > -72) continue;   // the low end by the castle is grass
      for (let k = 0; k < 2; k++) {
        const top = R() < 0.45, w = top ? 36 + R() * 14 : 6 + R() * 9, x = px + nx * w + (R() - 0.5) * 5, z = pz + nz * w + (R() - 0.5) * 5;
        const s = top ? 3.5 + R() * 4 : 2.2 + R() * 3.4;
        big[k].push(xf([x, look(x, z) - s * 0.45, z], R() * 6.28, [s * (1.0 + R() * 0.4), s * (0.75 + R() * 0.3), s * (0.85 + R() * 0.35)], (R() - 0.5) * 0.35, (R() - 0.5) * 0.35));
      }
    }
  }
  addInst(roundRockGeo(5.3), M.rock, big[0]); addInst(roundRockGeo(7.1), M.rock, big[1]);
  // low clusters out on the flat, clear of the lesson's rows and the snitch's line along them
  for (let c = 0; c < 60 && low.length < 70; c++) {
    const x = 160 + R() * 150, z = -70 - R() * 160;
    if (!inField(x, z) || (z > -80 && x < 215)) continue;
    for (let k = 0; k < 5; k++) { const a = R() * 6.28, dd = R() * 2.6, s = 0.4 + R() * 0.9, xx = x + Math.cos(a) * dd, zz = z + Math.sin(a) * dd;
      low.push(xf([xx, look(xx, zz) - s * 0.25, zz], R() * 6.28, [s * 1.4, s * 0.55, s])); }
  }
  addInst(angularRockGeo(3.9), M.menhir, low);
}
function buildNorth(look) {
  buildOwlery(look);
  buildGatehouse(look);
  buildLawn(look);
  buildFieldRocks(look);
  buildForest(look);
}
