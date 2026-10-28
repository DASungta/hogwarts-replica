// ------------------------------------------------------------------ the Great Hall (after the Leavesden set: ref/interior, Wikimedia Commons, CC)
// Set coordinates: the great doors at z = 0, the high table at the far end (z ≈ -36), x across. The set is about 120 by
// 40 ft; walls of warm sandstone ashlar over oak wainscot; six bays a side of tall pointed recesses with two-light
// leaded windows (Y-tracery), deep sloping sills; on every pier a stone beast on a corbel holding an iron fire bowl
// (g50, g51, g57); timber arch braces springing from corbels (g76) under the enchanted sky; the great doors in a
// moulded Tudor arch (g51); the hooded fireplace with the school crest and the four house roundels (g26, g82); the
// dais with the staff table, Gothic chairs in green leather and the headmaster's gilt chair (g13, g60); the golden owl
// lectern (g34); the house-points hourglasses (g60); a great perpendicular window behind the dais (g14); house banners
// and floating candles over the four house tables.
const HALL_FLAMES = [];   // the floating candles' flames (the magic short lights them one by one)
let HALL_BANNERS = null;   // the house banners' group (hidden unless a cut shows them)
let HALL_CASEMENT = null;   // the great window's opening light (its hinge; rotation.y swings it out)
// the morning sky seen through it: pale at the horizon, blue above, drifting cloud (the night: dark blue)
M.hallSky = procMat({ name: 'hallSky', rgb: [0.02, 0.02, 0.02], rough: 1, frag: /* glsl */ `
  float h = smoothstep(4.0, 17.0, P.y), cl = smoothstep(0.45, 0.75, cgFbm3(vec3(P.x * 0.12 + uTime * 0.02, P.y * 0.25, 1.0)));
  vec3 sky = mix(vec3(0.95, 0.9, 0.82), vec3(0.32, 0.5, 0.82), h);
  cgEmit = mix(mix(sky, vec3(1.0, 0.98, 0.95), cl * 0.75) * 1.5, vec3(0.02, 0.035, 0.07), uNight);
` });
const HALL = { w: 14.4, len: 40, wallH: 16.5, bays: 6, bay: 5.25, z0: -1.6, dais: 7, DY: 0.75, banners: false };   // no house banners at the PS opening feast
// the open timber roof seen through the enchanted ceiling (PS, the Sorting: dark pointed trusses with the night sky
// between them): over each pier a hammer-beam truss: the stone arch brace's top carries a hammer beam with a pendant,
// a hammer post rises from its end, a great pointed arch brace springs from the posts to the collar, principal rafters
// from the wall plate to the ridge, studs between arch and rafter; purlins and a ridge run the length, curved wind
// braces between them make pointed arches along each slope; gables close both ends
const ROOF = { plate: 17.0, rise: 9.5, out: 7.5 };
function hallRoof(hw, L, Z0, B) {
  const P = ROOF.plate, A = P + ROOF.rise, X = ROOF.out, raf = (y) => X * (1 - (y - P) / ROOF.rise);   // the rafter's x at height y
  const bar = (p0, p1, w, d, mat = 'oak') => {   // a squared timber from p0 to p1: width w across the roof (z), depth d in its plane
    const a = new THREE.Vector3(...p0), b = new THREE.Vector3(...p1), L2 = a.distanceTo(b);
    const g = new RoundedBoxGeometry(L2, d, w, 2, Math.min(0.03, d / 4)).rotateZ(Math.atan2(b.y - a.y, b.x - a.x)).translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
    put(mat, g);
  };
  const zs = []; for (let k = 0; k <= HALL.bays; k++) zs.push(Z0 - k * B);
  const HX = hw - 3.16, HY = 16.55, CY = P + 7.0, PY = 19.0;   // hammer beam end, collar height, hammer post top
  for (const z of zs) {
    for (const s of [-1, 1]) {
      bar([s * (hw + 0.2), HY + 0.25, z], [s * HX, HY + 0.25, z], 0.46, 0.52);   // the hammer beam
      put('oak', new THREE.LatheGeometry([[0, 0], [0.16, 0.05], [0.2, 0.3], [0.13, 0.55], [0.18, 0.7], [0.08, 0.95], [0, 1.05]].map(([r, h]) => new THREE.Vector2(r, h)), 12).rotateX(Math.PI).translate(s * HX, HY, z));   // the pendant
      bar([s * HX, HY + 0.5, z], [s * HX, PY + 0.4, z], 0.4, 0.4);   // the hammer post
      bar([s * X, P, z], [0, A, z], 0.46, 0.72);   // the principal rafter
      for (const sx of [4.9, 5.7, 6.5]) if (sx < X) bar([s * sx, HY + 0.5, z], [s * sx, P + ROOF.rise * (1 - sx / X) - 0.1, z], 0.22, 0.22);   // studs to the rafter
    }
    // the great arch brace: a two-centred pointed arch from the posts to the collar, a moulded rib on its soffit
    const ys = PY - 0.2, rise = CY - ys, r = (rise * rise + HX * HX) / (2 * HX), inner = [];
    for (let i = 0; i <= 20; i++) { const x = -HX + (HX * i) / 20, cx = -HX + r; inner.push([x, ys + Math.sqrt(Math.max(0, r * r - (x - cx) * (x - cx)))]); }
    for (let i = 19; i >= 0; i--) inner.push([-inner[i][0], inner[i][1]]);
    const sh = pathPts(new THREE.Shape(), [[-HX - 0.15, ys], ...inner, [HX + 0.15, ys], [HX + 0.15, ys + 0.6], [raf(CY) - 0.05, CY + 0.3], [-raf(CY) + 0.05, CY + 0.3], [-HX - 0.15, ys + 0.6]]);
    put('oak', new THREE.ExtrudeGeometry(sh, { depth: 0.42, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1, curveSegments: 4 }).translate(0, 0, z - 0.21));
    put('oak', new THREE.TubeGeometry(new THREE.CatmullRomCurve3(inner.map(([x, y]) => new THREE.Vector3(x, y - 0.03, z))), 40, 0.14, 8));
    bar([-raf(CY), CY + 0.1, z], [raf(CY), CY + 0.1, z], 0.42, 0.46);   // the collar
    for (const x of [0, -1.0, 1.0]) bar([x, CY + 0.3, z], [x, x ? P + ROOF.rise * (1 - Math.abs(x) / X) - 0.15 : A - 0.2, z], 0.22, 0.22);   // king and queen struts
    for (const s of [-1, 1]) put('oak', new THREE.TorusGeometry(0.35, 0.05, 6, 20).translate(s * 2.9, PY + 1.2, z + 0.16));   // a carved roundel in each spandrel
  }
  // purlins, the ridge, wind braces between the trusses
  const along = (x, y, w, d, mat = 'oak') => wallBox(x - w / 2, x + w / 2, y - d / 2, y + d / 2, -L, 0, mat, 0.03);
  along(0, A - 0.05, 0.4, 0.5);
  const fr = [0.28, 0.56, 0.8];
  for (const s of [-1, 1]) {
    wallBox(Math.min(s * hw, s * (X + 0.2)), Math.max(s * hw, s * (X + 0.2)), P - 0.1, P + 0.3, -L, 0, 'oak', 0.02);   // the wall plate
    for (const f of fr) along(s * X * (1 - f) - s * 0.12, P + ROOF.rise * f + 0.22, 0.4, 0.4);
    // common rafters every 0.75 m between the trusses: the grid the sky shows through
    for (let z = -0.4; z > -L; z -= 0.75) { if (zs.some((q) => Math.abs(q - z) < 0.4)) continue; bar([s * (X - 0.1), P + 0.25, z], [0, A - 0.15, z], 0.13, 0.2); }
    for (let k = 0; k < zs.length - 1; k++) for (let t = 0; t < 2; t++) {
      const f0 = t ? fr[0] : 0, f1 = t ? fr[1] : fr[0], za = zs[k], zb = zs[k + 1], pts = [];
      for (let i = 0; i <= 16; i++) {
        const u = i / 16, f = f0 + (f1 - f0) * (1 - Math.pow(Math.abs(2 * u - 1), 1.6)) * 0.85;
        const x = s * (X * (1 - f) - 0.2), y = P + ROOF.rise * f + 0.15;
        pts.push(new THREE.Vector3(x, y, za + (zb - za) * u));
      }
      put('oak', new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.12, 6));
    }
  }
  // the gable over the great doors (the high-table end's gable is part of its wall)
  const gab = pathPts(new THREE.Shape(), [[-X - 1.0, P - 0.6], [X + 1.0, P - 0.6], [0, A + 0.8]]);
  put('sandstone', uvPlanar(new THREE.ExtrudeGeometry(gab, { depth: 1.2, bevelEnabled: false }).translate(0, 0, -0.1)));
}
// the feast down the middle of each house table: roast fowl on platters, joints of beef, bowls of roast potatoes, pies,
// loaves on boards, bowls of apples and grapes (instanced, kept clear of the jugs)
M.roast = procMat({ name: 'roast', rgb: [1, 1, 1], rough: 0.32, frag: /* glsl */ `
  float n = cgFbm3(P * 22.0), m = cgVn(P * 60.0);
  diffuseColor.rgb = mix(vec3(0.2, 0.07, 0.02), vec3(0.46, 0.2, 0.06), n) * (0.85 + 0.3 * m); cgRough = 0.25 + 0.3 * m;
` });
M.potato = procMat({ name: 'potato', rgb: [1, 1, 1], rough: 0.5, frag: /* glsl */ `
  float n = cgFbm3(P * 40.0); diffuseColor.rgb = mix(vec3(0.5, 0.3, 0.09), vec3(0.72, 0.5, 0.2), n);
` });
M.crust = procMat({ name: 'crust', rgb: [1, 1, 1], rough: 0.6, bump: 1, frag: /* glsl */ `
  float n = cgFbm3(P * 30.0); diffuseColor.rgb = mix(vec3(0.42, 0.22, 0.07), vec3(0.7, 0.46, 0.2), n); cgH = n * 0.004;
` });
M.fruit = procMat({ name: 'fruit', rgb: [1, 1, 1], rough: 0.3, frag: /* glsl */ `diffuseColor.rgb *= 0.85 + 0.25 * cgVn(P * 50.0);` });
function feast(TX, tz0, tz1, R) {
  const lathe = (pr, n = 24) => new THREE.LatheGeometry(pr.map(([r, h]) => new THREE.Vector2(r, h)), n);
  const platter = lathe([[0, 0], [0.15, 0], [0.18, 0.01], [0.2, 0.018], [0.195, 0.022], [0.17, 0.014], [0, 0.012]]).scale(1.25, 1, 1);
  const bowl = lathe([[0, 0], [0.05, 0], [0.09, 0.025], [0.11, 0.06], [0.105, 0.065], [0.085, 0.035], [0, 0.025]]);
  const fowl = merge([new THREE.SphereGeometry(0.1, 16, 12).scale(1.0, 0.7, 1.3).translate(0, 0.075, 0),
    ...[-1, 1].map((s) => new THREE.SphereGeometry(0.04, 10, 8).scale(0.8, 0.8, 1.7).rotateY(s * 0.4).translate(s * 0.075, 0.055, 0.09)),
    ...[-1, 1].map((s) => new THREE.SphereGeometry(0.03, 8, 6).scale(1.4, 0.6, 1).translate(s * 0.095, 0.08, -0.04))]);
  const beef = new RoundedBoxGeometry(0.22, 0.11, 0.15, 3, 0.04).translate(0, 0.07, 0);
  const pie = merge([lathe([[0, 0], [0.12, 0], [0.13, 0.04], [0.125, 0.045], [0, 0.04]]), lathe([[0, 0.075], [0.07, 0.07], [0.11, 0.058], [0.13, 0.042], [0.135, 0.04], [0, 0.04]]), new THREE.TorusGeometry(0.128, 0.012, 6, 28).rotateX(Math.PI / 2).translate(0, 0.045, 0)]);
  const loaf = new THREE.SphereGeometry(0.07, 14, 10).scale(1.7, 0.75, 1.0);
  const board = new RoundedBoxGeometry(0.42, 0.025, 0.24, 2, 0.008).translate(0, 0.0125, 0);
  const L = { platter: [], bowl: [], fowl: [], beef: [], pie: [], loaf: [], board: [], pot: [], fruit: [], fruitC: [], jelly: [], jellyC: [] };
  const m = (x, z, ry, y = 0.79) => xf([x, y, z], ry, 1);
  const T = TX.length;
  for (const tx of TX) {
    const jugs = []; for (let z = tz0 - 1.8; z > tz1 + 1; z -= 2.9) jugs.push(z);
    // the whole length of the table covered (PS: the feast appears): two staggered rows of dishes down the middle
    for (let z = tz0 - 0.7, row = 0; z > tz1 + 0.6; z -= 0.34, row++) {
      const x = tx + (row % 2 ? 0.14 : -0.14) + (R() - 0.5) * 0.05, ry = R() * 6.28, k = R();
      if (jugs.some((j) => Math.abs(j - z) < 0.22) && Math.abs(x - tx) < 0.2) continue;
      if (k > 0.86) {   // a red or amber jelly, or a bowl of peas
        if (R() < 0.55) { L.platter.push(m(x, z, ry)); L.jelly.push(xf([x, 0.81, z], ry, 1)); L.jellyC.push(R() < 0.6 ? [0.55, 0.03, 0.03] : [0.7, 0.4, 0.04]); }
        else { L.bowl.push(m(x, z, ry)); for (let i = 0; i < 30; i++) { const a = R() * 6.28, r = Math.sqrt(R()) * 0.075; L.fruit.push(xf([x + Math.cos(a) * r, 0.83 + R() * 0.03, z + Math.sin(a) * r], 0, 0.011)); L.fruitC.push([0.12, 0.3, 0.04]); } }
        continue;
      }
      if (k < 0.2) { L.platter.push(m(x, z, ry)); L.fowl.push(m(x, z, ry, 0.81)); }
      else if (k < 0.32) { L.platter.push(m(x, z, ry)); L.beef.push(m(x, z, ry, 0.81)); }
      else if (k < 0.52) { L.bowl.push(m(x, z, ry)); for (let i = 0; i < 7; i++) { const a = i * 0.9 + R(), r = i ? 0.05 + R() * 0.02 : 0; L.pot.push(xf([x + Math.cos(a) * r, 0.83 + (i ? 0.01 : 0.03) + R() * 0.01, z + Math.sin(a) * r], R() * 6, [0.034, 0.026, 0.028])); } }
      else if (k < 0.66) L.pie.push(m(x, z, ry));
      else if (k < 0.8) { L.board.push(m(x, z, ry)); for (const o of [-0.09, 0.1]) L.loaf.push(xf([x + Math.cos(ry) * o, 0.84, z - Math.sin(ry) * o], ry + (R() - 0.5) * 0.3, 1)); }
      else {
        L.bowl.push(m(x, z, ry));
        for (let i = 0; i < 6; i++) { const a = i * 1.05 + R(), r = i ? 0.05 + R() * 0.02 : 0; L.fruit.push(xf([x + Math.cos(a) * r, 0.84 + (i ? 0 : 0.03), z + Math.sin(a) * r], R() * 6, 0.034)); const c = R(); L.fruitC.push(c < 0.5 ? [0.45, 0.04, 0.03] : c < 0.8 ? [0.35, 0.45, 0.08] : [0.6, 0.45, 0.06]); }
        for (let i = 0; i < 14; i++) { const a = R() * 6.28, r = R() * 0.05; L.fruit.push(xf([x + 0.06 + Math.cos(a) * r, 0.83 + R() * 0.04, z + Math.sin(a) * r], 0, 0.013)); L.fruitC.push([0.18, 0.05, 0.16]); }
      }
    }
  }
  void T;
  addInst(platter, M.gold, L.platter, null, { cast: false }); addInst(bowl, M.gold, L.bowl, null, { cast: false });
  addInst(fowl, M.roast, L.fowl); addInst(beef, M.roast, L.beef); addInst(pie, M.crust, L.pie); addInst(loaf, M.crust, L.loaf);
  addInst(board, M.oak, L.board, null, { cast: false });
  addInst(new THREE.SphereGeometry(1, 10, 8), M.potato, L.pot, null, { cast: false });
  addInst(new THREE.SphereGeometry(1, 12, 10), M.fruit, L.fruit, L.fruitC, { cast: false });
  addInst(lathe([[0, 0], [0.08, 0], [0.085, 0.03], [0.07, 0.06], [0.072, 0.075], [0.05, 0.1], [0.052, 0.11], [0, 0.12]], 20), M.fruit, L.jelly, L.jellyC, { cast: false });
}
M.gem = procMat({ name: 'gem', rgb: [1, 1, 1], rough: 0.2, inst: true, frag: /* glsl */ `
  vec3 c = vInstC; float s = cgH31(floor(P * 70.0)); float sp = pow(s, 12.0);
  diffuseColor.rgb = c * (0.35 + 0.65 * cgH31(floor(P * 70.0) + 3.1)); cgEmit = c * sp * 1.5; cgRough = 0.15; cgSpec = 1.5;
` });
M.tube = procMat({ name: 'tube', rgb: [0.9, 0.95, 1.0], rough: 0.04, std: { transparent: true, opacity: 0.16, depthWrite: false } });
M.ivory = procMat({ name: 'ivory', rgb: [0.62, 0.6, 0.55], rough: 0.4 });
// a Gothic chair of the staff table (gold = the headmaster's), facing +z, seat on the origin
function gothicChair(gold) {
  const S = gold ? 1.18 : 1, wood = [], P = (pts) => pathPts(new THREE.Shape(), pts);
  wood.push(new RoundedBoxGeometry(0.62, 0.07, 0.56, 1, 0.02).translate(0, 0.47, 0));
  for (const s of [-1, 1]) {
    wood.push(turnedGeo(0.44, 0.04, 10).translate(s * 0.26, 0, 0.23));
    wood.push(new THREE.BoxGeometry(0.075, 2.0, 0.075).translate(s * 0.27, 1.0, -0.25));
    wood.push(new THREE.BoxGeometry(0.06, 0.05, 0.58).translate(s * 0.29, 0.73, -0.01), new THREE.BoxGeometry(0.05, 0.26, 0.05).translate(s * 0.29, 0.6, 0.24));
    wood.push(new THREE.ConeGeometry(0.045, 0.18, 8).translate(s * 0.27, 2.09, -0.25), new THREE.SphereGeometry(0.04, 8, 6).translate(s * 0.27, 2.0, -0.25));
    for (let k = 1; k <= 4; k++) { const t = k / 5; wood.push(new THREE.SphereGeometry(0.028, 6, 5).translate(s * 0.3 * (1 - t), 1.62 + 0.46 * t, -0.26)); }
  }
  const outer = [[-0.31, 0.55], [0.31, 0.55], [0.31, 1.62], [0, 2.08], [-0.31, 1.62]], inner = [[-0.22, 0.62], [0.22, 0.62], [0.22, 1.58], [0, 1.92], [-0.22, 1.58]];
  const ring = P(outer); ring.holes.push(pathPts(new THREE.Path(), inner, true));
  wood.push(new THREE.ExtrudeGeometry(ring, { depth: 0.07, bevelEnabled: false }).translate(0, 0, -0.3));
  wood.push(new THREE.ConeGeometry(0.05, 0.22, 8).translate(0, 2.18, -0.26));
  const leather = new THREE.ExtrudeGeometry(P(inner), { depth: 0.03, bevelEnabled: false }).translate(0, 0, -0.28);
  const seatPad = new RoundedBoxGeometry(0.54, 0.05, 0.48, 1, 0.02).translate(0, 0.525, 0.01);
  const sc = (g) => g.scale(S, S * (gold ? 1.12 : 1), S);
  return [{ mat: gold ? 'gold' : 'oak', geo: sc(merge(wood)) }, { mat: 'leather', geo: sc(merge([leather, seatPad])) }];
}
protoDef('gchair', gothicChair(false));
protoDef('dchair', gothicChair(true));
function buildHallInterior(sc) {
  const hw = HALL.w / 2, L = HALL.len, H = HALL.wallH, B = HALL.bay, Z0 = HALL.z0, ZD = -L + HALL.dais, DY = HALL.DY, T = 1.6;
  const points = [], R = rng('hall');
  put('flag', new THREE.PlaneGeometry(HALL.w + 0.4, L + 0.4).rotateX(-Math.PI / 2).translate(0, 0, -L / 2));

  // ---- side walls: deep pointed recesses with two-light windows, piers with beasts, the fireplace bay
  const winW = 3.2, sill = 3.0, ws = 11.2;
  const W1 = traceryWindow(winW, ws - 3.6, 'pointed', 1, 2, [2.6, 5.2]);
  protoDef('hallwin', [{ mat: 'itrim', geo: W1.stone }, { mat: 'hglass', geo: W1.glass, cast: false }]);
  const W2 = traceryWindow(winW, ws - 5.0, 'pointed', 1, 2, [3.0]);
  protoDef('hallwin2', [{ mat: 'itrim', geo: W2.stone }, { mat: 'hglass', geo: W2.glass, cast: false }]);
  const wedge = (h) => new THREE.ExtrudeGeometry(pathPts(new THREE.Shape(), [[0, 0], [1.3, 0], [1.3, h]]), { depth: winW, bevelEnabled: false }).translate(0, 0, -winW / 2);
  const bays = []; for (let i = 0; i < HALL.bays; i++) bays.push({ za: Z0 - i * B, zb: Z0 - (i + 1) * B, i });
  bays.push({ za: Z0 - HALL.bays * B, zb: -L, i: HALL.bays, dais: true });
  const FZ = Z0 - 5.5 * B;   // the fireplace bay (east side)
  for (const s of [-1, 1]) {
    const x = s * (hw + T / 2), ry = s < 0 ? Math.PI / 2 : -Math.PI / 2;
    wallBox(s < 0 ? -hw - T : hw, s < 0 ? -hw : hw + T, 0, sill, -L - T, T, 'sandstone', 0);
    wallBox(s < 0 ? -hw - T : hw, s < 0 ? -hw : hw + T, 0, H + 0.6, Z0, 0, 'sandstone', 0);
    for (const b of bays) {
      const zc = (b.za + b.zb) / 2, bw = b.za - b.zb, y0 = b.dais ? 4.4 : sill;
      if (s > 0 && b.i === 5) { wallBox(hw, hw + T, sill, H + 0.6, b.zb, b.za, 'sandstone', 0); continue; }
      if (b.dais) wallBox(s < 0 ? -hw - T : hw, s < 0 ? -hw : hw + T, sill, y0, b.zb, b.za, 'sandstone', 0);
      arcade(x, b.za, x, b.zb, y0, H + 0.6 - y0, 1, { kind: 'lancet', spring: (ws - y0 + winW * 0.866) / (H + 0.6 - y0), pier: 1 - winW / bw, depth: T, mat: 'sandstone', sill: 0 });
      place(b.dais ? 'hallwin2' : 'hallwin', xf([s * (hw + 1.25), b.dais ? 5.0 : 3.6, zc], ry, 1));
      put('sandstone', uvPlanar(wedge(b.dais ? 0.6 : 0.6).rotateY(s < 0 ? Math.PI : 0).translate(s * hw, y0, zc)));
    }
    // piers: a pilaster, a slender shaft up to the corbel of a timber arch brace; a beast on all but the fireplace's
    for (let k = 0; k <= HALL.bays; k++) {
      const z = Z0 - k * B, f = s * (hw - 0.16);
      wallBox(Math.min(s * hw, f), Math.max(s * hw, f), WAINSCOT_H, H, z - 0.55, z + 0.55, 'sandstone', 0.02);
      cyl(s * (hw - 0.27), z, 8.9, 11.45, 0.1, 'itrim', 12);
      wallBox(Math.min(f, f - s * 0.3), Math.max(f, f - s * 0.3), 8.75, 8.9, z - 0.18, z + 0.18, 'itrim', 0.02);
      wallBox(Math.min(f, f - s * 0.34), Math.max(f, f - s * 0.34), 11.45, 11.65, z - 0.22, z + 0.22, 'itrim', 0.02);
      wallBox(Math.min(f, f - s * 0.55), Math.max(f, f - s * 0.55), 11.65, 11.95, z - 0.3, z + 0.3, 'itrim', 0.03);
    }
  }
  const beastList = [];
  const cycle = ['eagle', 'dragon', 'boar', 'owl', 'dragon', 'eagle'];
  for (const s of [-1, 1]) for (let k = 1; k <= HALL.bays; k++) {
    if (s > 0 && (k === 5 || k === 6)) continue;
    beastList.push({ name: cycle[(k + (s > 0 ? 3 : 0)) % cycle.length], p: [s * (hw - 0.16), 6.0, Z0 - k * B], ry: s < 0 ? Math.PI / 2 : -Math.PI / 2, flip: (k + (s > 0 ? 1 : 0)) % 2 === 1, light: k % 2 === 1 });
  }
  beastList.push({ name: 'eagle', p: [-4.7, 5.9, 0], ry: Math.PI, light: true }, { name: 'owl', p: [4.7, 5.9, 0], ry: Math.PI, light: true });
  points.push(...wallBeasts(beastList, sc));
  // timber arch braces from the corbels up to the wall plate, a moulded rib under each, tracery in the spandrels
  {
    const ell = []; for (let i = 0; i <= 20; i++) { const a = Math.PI / 2 + (i / 20) * (Math.PI / 2); ell.push([3.0 + 2.75 * Math.cos(a), 4.25 * Math.sin(a)]); }
    const sh = pathPts(new THREE.Shape(), [[0, 0], [0, 4.6], [3.0, 4.6], ...ell]);
    sh.holes.push(pathPts(new THREE.Path(), quatrefoilPts(0.72, 3.72, 0.3), true), pathPts(new THREE.Path(), quatrefoilPts(1.75, 4.2, 0.17), true));
    const brace = new THREE.ExtrudeGeometry(sh, { depth: 0.32, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1 }).translate(0, 0, -0.16);
    const rib = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ell.map(([u, v]) => new THREE.Vector3(u, v, 0))), 24, 0.09, 8);
    const one = merge([brace, rib]);
    for (const s of [-1, 1]) for (let k = 0; k <= HALL.bays; k++) put('oak', one.clone().rotateY(s < 0 ? 0 : Math.PI).translate(s * (hw - 0.16), 11.95, Z0 - k * B));
    for (const s of [-1, 1]) {
      wallBox(Math.min(s * hw, s * (hw - 0.4)), Math.max(s * hw, s * (hw - 0.4)), 16.55, 17.0, -L, 0, 'oak', 0.02);
      wallBox(Math.min(s * hw, s * (hw - 0.22)), Math.max(s * hw, s * (hw - 0.22)), 16.2, 16.55, -L, 0, 'itrim', 0.02);
    }
  }
  hallRoof(hw, L, Z0, B);
  sc.add(new THREE.Mesh(new THREE.SphereGeometry(90, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 16.5, -20), hallSkyMat));

  // ---- the door end: the wall with the great doors in a moulded Tudor arch, a square label with traceried spandrels
  {
    const wall = pathPts(new THREE.Shape(), [[-hw - T, 0], [hw + T, 0], [hw + T, H + 0.6], [-hw - T, H + 0.6]]);
    wall.holes.push(pathPts(new THREE.Path(), openingPts(1.9, 5.0, 'tudor', 1.3), true));
    put('sandstone', uvPlanar(new THREE.ExtrudeGeometry(wall, { depth: T, bevelEnabled: false, curveSegments: 4 })));
    for (let k = 0; k < 3; k++) {
      const ring = pathPts(new THREE.Shape(), openingPts(1.9 + 0.2 * (k + 1), 5.0, 'tudor', 1.3 + 0.12 * (k + 1)));
      ring.holes.push(pathPts(new THREE.Path(), openingPts(1.9 + 0.2 * k, 5.0, 'tudor', 1.3 + 0.12 * k), true));
      put('itrim', new THREE.ExtrudeGeometry(ring, { depth: 0.32 - 0.08 * k, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 }).translate(0, 0, -(0.32 - 0.08 * k)));
    }
    for (const s of [-1, 1]) for (const o of [0.08, 0.28, 0.48]) cyl(s * (1.98 + o), -0.12 - 0.05 * (o > 0.3), 0, 5.0, 0.06, 'itrim', 10);
    beam([-2.85, 7.35, -0.14], [2.85, 7.35, -0.14], 0.22, 'itrim');
    for (const s of [-1, 1]) { beam([s * 2.75, 0, -0.14], [s * 2.75, 7.45, -0.14], 0.22, 'itrim'); wallBox(s * 2.75 - 0.2, s * 2.75 + 0.2, 0, 0.5, -0.32, 0, 'itrim', 0.03); }
    for (const s of [-1, 1]) {
      const q = pathPts(new THREE.Shape(), quatrefoilPts(s * 1.62, 6.62, 0.42)); q.holes.push(pathPts(new THREE.Path(), quatrefoilPts(s * 1.62, 6.62, 0.3), true));
      put('itrim', new THREE.ExtrudeGeometry(q, { depth: 0.08, bevelEnabled: false }).translate(0, 0, -0.08));
      put('itrim', new THREE.SphereGeometry(0.1, 10, 8).scale(1, 1, 0.5).translate(s * 1.62, 6.62, -0.02));
    }
    // the doors: two carved oak leaves, square panels with bosses, iron rings; they stand half open into the hall
    // (GH_DOOR, 64-stair.js: the same doors seen from the Entrance Hall, where the snitch comes through them)
    const head = archHeadPts(1.9, 5.0, 'tudor', 1.3), apex = head[Math.floor(head.length / 2)][1];
    for (const s of [-1, 1]) {
      const side = head.filter(([x]) => s * x > 1e-6);   // springer to apex on this side
      const pts = s < 0 ? [[-1.9, 0], [0, 0], [0, apex], ...side.reverse()] : [[0, 0], [1.9, 0], ...side.reverse(), [0, apex]];
      const leaf = pathPts(new THREE.Shape(), pts);
      const sw = new THREE.Matrix4().makeTranslation(s * 1.9, 0, 0.61).multiply(new THREE.Matrix4().makeRotationY(-s * GH_DOOR.open)).multiply(new THREE.Matrix4().makeTranslation(-s * 1.9, 0, -0.61));
      put('door', new THREE.ExtrudeGeometry(leaf, { depth: 0.12, bevelEnabled: false }).translate(0, 0, 0.55).applyMatrix4(sw));
      for (let c = 0; c < 3; c++) for (let r = 0; r < 6; r++) {
        const px = s * (0.3 + c * 0.56), py = 0.55 + r * 0.74;
        if (py > 4.6 && c === 2) continue;
        wallBox(px - 0.22, px + 0.22, py - 0.3, py + 0.3, 0.5, 0.56, 'door', 0.04).applyMatrix4(sw);
        put('door', new THREE.SphereGeometry(0.085, 10, 8).scale(1, 1, 0.55).translate(px, py, 0.49).applyMatrix4(sw));
        // the Entrance Hall face, as the stair set shows it: panels with brass bosses
        wallBox(px - 0.22, px + 0.22, py - 0.3, py + 0.3, 0.66, 0.72, 'door', 0.03).applyMatrix4(sw);
        put('brass', new THREE.OctahedronGeometry(0.14, 0).scale(1, 1.4, 0.25).translate(px, py, 0.74).applyMatrix4(sw));
      }
      put('paintBlack', new THREE.TorusGeometry(0.13, 0.022, 8, 20).translate(s * 0.32, 2.2, 0.44).applyMatrix4(sw));
      put('paintBlack', new THREE.TorusGeometry(0.16, 0.025, 8, 20).translate(s * 0.35, 2.4, 0.78).applyMatrix4(sw));
    }
    // beyond the doors, the Entrance Hall's dark stone (seen past the leaves as the snitch comes in)
    put('flag', new THREE.PlaneGeometry(8, 6).rotateX(-Math.PI / 2).translate(0, 0, 4.6));
    for (const s of [-1, 1]) wallBox(s * 4 - (s > 0 ? 0 : 0.6), s * 4 + (s > 0 ? 0.6 : 0), 0, 9, 1.6, 7.6, 'darkstone', 0);
    wallBox(-4.6, 4.6, 7, 9.6, 1.6, 7.6, 'darkstone', 0);
    wainscotRun(-hw, -0.02, -3.0, -0.02, 0, Math.PI);
    wainscotRun(3.0, -0.02, hw, -0.02, 0, Math.PI);
    // the great arch of the end truss, springing from corbels high on the side walls
    const arch = archHeadPts(hw, 11.95, 'tudor', 4.4, 20).map(([u, v]) => new THREE.Vector3(u, v, -0.15));
    put('oak', new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arch), 40, 0.16, 8));
  }

  // ---- the high end: the dais, a great perpendicular window, the staff table
  {
    const WB = 4.4, WS = 8.6, WHW = 3.7;   // window bottom, springing above it, half width (equilateral head: rise 1.73 x half width)
    const wall = pathPts(new THREE.Shape(), [[-hw - T, 0], [hw + T, 0], [hw + T, H + 0.6], [0, H + 0.6 + ROOF.rise + 0.8], [-hw - T, H + 0.6]]);
    wall.holes.push(pathPts(new THREE.Path(), openingPts(WHW, WS, 'pointed', 1.0).map(([x, y]) => [x, y + WB]), true));
    put('sandstone', uvPlanar(new THREE.ExtrudeGeometry(wall, { depth: T, bevelEnabled: false, curveSegments: 8 }).translate(0, 0, -L - T)));
    const GW = traceryWindow(2 * WHW, WS, 'pointed', 1.0, 7, [3.0, 6.0], { frame: 0.24, mull: 0.15, depth: 0.32 });
    put('itrim', GW.stone.translate(0, WB, -L - 1.05));
    // the glass, but the middle light of the middle tier is an iron casement hinged on its left: shut in the other films,
    // swung out in the snitch cut, which flies out through it (HALL_CASEMENT), the morning sky beyond
    const lw = (2 * WHW - 2 * 0.24 - 6 * 0.15) / 7, cx0 = -lw / 2, cx1 = lw / 2, cy0 = 3.0 + 0.075, cy1 = 6.0 - 0.075;
    const lr = (lw / 2) * 1.25, cys = cy1 - Math.sqrt(lr * lr - (lr - lw / 2) ** 2);   // where the light's pointed head starts
    const gs = pathPts(new THREE.Shape(), openingPts(WHW, WS, 'pointed', 1.0)); gs.holes.push(pathPts(new THREE.Path(), [[cx0, cy0], [cx1, cy0], [cx1, cys], [cx0, cys]], true));
    const glass = new THREE.ShapeGeometry(gs), gp = glass.attributes.position, guv = glass.attributes.uv;
    for (let i = 0; i < gp.count; i++) guv.setXY(i, gp.getX(i), gp.getY(i));
    const gz = -L - 1.05 - 0.16 - 0.02;
    put('hglass', glass.translate(0, WB, gz));
    const hinge = new THREE.Group(); hinge.position.set(cx0, WB + cy0, gz); sc.add(hinge); HALL_CASEMENT = hinge;
    const leaf = new THREE.PlaneGeometry(lw, cys - cy0).translate(lw / 2, (cys - cy0) / 2, 0), lp = leaf.attributes.position, luv = leaf.attributes.uv;
    for (let i = 0; i < lp.count; i++) luv.setXY(i, lp.getX(i) + cx0, lp.getY(i) + cy0);
    hinge.add(new THREE.Mesh(leaf, M.hglass), new THREE.Mesh(leaf.clone().rotateY(Math.PI).translate(lw, 0, 0), M.hglass));   // glazed both faces
    for (const [w, h, x, y] of [[0.035, cys - cy0, 0.0175, (cys - cy0) / 2], [0.035, cys - cy0, lw - 0.0175, (cys - cy0) / 2], [lw, 0.035, lw / 2, 0.0175], [lw, 0.035, lw / 2, cys - cy0 - 0.0175]]) {
      const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.03), M.paintBlack); f.position.set(x, y, 0); hinge.add(f);   // its iron frame
    }
    addMesh(new THREE.PlaneGeometry(14, 16).translate(0, WB + 6, -L - 7), M.hallSky, { cast: false, recv: false });
    wallBox(-WHW - 0.1, WHW + 0.1, WB - 0.15, WB, -L - 1.0, -L + 0.12, 'itrim', 0.02);
    for (const k of [0, 1]) {   // two orders of moulding round the head and down the jambs
      const o = 0.12 + k * 0.22, hood = archHeadPts(WHW + o, WS + WB, 'pointed', (WHW + o + 0.4 * k) / (WHW + o) * 1.0, 24).map(([u, v]) => new THREE.Vector3(u, v, -L - 0.06 + k * 0.04));
      put('itrim', new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-WHW - o, WB, -L - 0.06 + k * 0.04), ...hood, new THREE.Vector3(WHW + o, WB, -L - 0.06 + k * 0.04)]), 64, 0.09 - k * 0.02, 6));
    }
  }
  wallBox(-hw, hw, 0, DY, -L, ZD, 'oak', 0.02);
  wallBox(-hw, hw, DY - 0.05, DY + 0.02, ZD - 0.02, ZD + 0.08, 'oak', 0.02);   // the nosing
  for (let k = 1; k <= 2; k++) wallBox(-3.4, 3.4, 0, k * 0.25, ZD, ZD + (3 - k) * 0.34, 'oak', 0.02);
  wainscotRun(-hw + 0.02, ZD, -hw + 0.02, -L, DY, Math.PI / 2);
  wainscotRun(hw - 0.02, -L, hw - 0.02, ZD, DY, -Math.PI / 2);
  wainscotRun(-hw, -L + 0.02, hw, -L + 0.02, DY, 0);
  // a side door (closed) in the west wall of the dais
  {
    const dz = (Z0 - HALL.bays * B - L) / 2;
    const fr = pathPts(new THREE.Shape(), openingPts(1.15, 2.6, 'pointed', 0.8)); fr.holes.push(pathPts(new THREE.Path(), openingPts(0.85, 2.6, 'pointed', 0.8), true));
    put('itrim', new THREE.ExtrudeGeometry(fr, { depth: 0.3, bevelEnabled: false }).rotateY(Math.PI / 2).translate(-hw, DY, dz));
    put('door', new THREE.ExtrudeGeometry(pathPts(new THREE.Shape(), openingPts(0.85, 2.6, 'pointed', 0.8)), { depth: 0.1, bevelEnabled: false }).rotateY(Math.PI / 2).translate(-hw + 0.05, DY, dz));
  }
  // the staff table: a long oak board on turned legs; the Gothic chairs behind it, the gilt one in the middle
  const TZ = ZD - 3.0;
  wallBox(-6.7, 6.7, DY + 0.72, DY + 0.8, TZ - 0.56, TZ + 0.56, 'oak', 0.02);
  wallBox(-6.6, 6.6, DY + 0.6, DY + 0.72, TZ + 0.42, TZ + 0.48, 'oak', 0.01);
  const legs = [];
  for (let x = -6.4; x <= 6.41; x += 1.6) for (const o of [-0.42, 0.42]) legs.push(xf([x, DY, TZ + o], 0, 1));
  addInst(turnedGeo(0.72, 0.07), M.oak, legs);
  for (let x = -6.0; x <= 6.01; x += 1.0) { if (Math.abs(x) < 0.1) continue; place('gchair', xf([x, DY, TZ - 0.95], 0, 1)); }
  place('dchair', xf([0, DY, TZ - 1.0], 0, 1));
  {
    const stick = new THREE.LatheGeometry([[0, 0], [0.09, 0], [0.09, 0.02], [0.05, 0.05], [0.025, 0.08], [0.02, 0.25], [0.035, 0.27], [0.02, 0.3], [0.045, 0.33], [0.04, 0.35], [0, 0.35]].map(([r, h]) => new THREE.Vector2(r, h)), 16);
    const sl = [], cs = [];
    for (let x = -6.1; x <= 6.11; x += 1.22) { if (Math.abs(x) < 0.3) continue; const y = DY + 0.8, s = 0.9 + R() * 0.3; sl.push(xf([x, y, TZ + 0.28], 0, 1)); cs.push(xf([x, y + 0.34, TZ + 0.28], 0, [1, s, 1])); LAMPS.push({ room: 'hall', p: [x, y + 0.34 + 0.62 * s, TZ + 0.28], c: [1.0, 0.62, 0.3].map((v) => v * 1.6), r: 4, halo: 0.12, hk: 0.3, see: 60 }); }
    addInst(stick, M.gold, sl, null, { cast: false });
    candles(cs, 0.035, 0.6);
  }
  owlLectern([0, DY, ZD - 0.85], 0);

  // ---- the house tables: oak boards on turned legs, benches, gold plates, goblets and jugs
  const TX = [-5.3, -1.9, 1.9, 5.3], tz0 = -3.0, tz1 = -31.0;
  const tlegs = [], blegs = [], plates = [], cups = [], jugs = [];
  for (const tx of TX) {
    wallBox(tx - 0.52, tx + 0.52, 0.72, 0.79, tz1, tz0, 'oak', 0.02);
    wallBox(tx - 0.42, tx + 0.42, 0.6, 0.72, tz1 + 0.3, tz0 - 0.3, 'oak', 0.01);
    for (let z = tz0 - 0.6; z >= tz1 + 0.5; z -= 2.75) for (const o of [-0.36, 0.36]) tlegs.push(xf([tx + o, 0, z], 0, 1));
    wallBox(tx - 0.06, tx + 0.06, 0.12, 0.2, tz1 + 0.5, tz0 - 0.5, 'oak', 0.01);
    for (const s of [-1, 1]) {
      wallBox(tx + s * 0.95 - 0.19, tx + s * 0.95 + 0.19, 0.42, 0.47, tz1, tz0, 'oak', 0.015);
      for (let z = tz0 - 0.5; z >= tz1 + 0.4; z -= 2.75) blegs.push(xf([tx + s * 0.95, 0, z], 0, 1));
      for (let z = tz0 - 0.55; z > tz1 + 0.4; z -= 0.72) {
        plates.push(xf([tx + s * 0.3, 0.79, z], 0, 1));
        cups.push(xf([tx + s * 0.32, 0.79, z - 0.27], 0, 1));
      }
    }
    for (let z = tz0 - 1.8; z > tz1 + 1; z -= 2.9) jugs.push(xf([tx + (R() - 0.5) * 0.15, 0.79, z], R() * 6, 1));
  }
  for (let x = -6.0; x <= 6.01; x += 1.0) { plates.push(xf([x, DY + 0.8, TZ - 0.28], 0, 1)); cups.push(xf([x + 0.27, DY + 0.8, TZ - 0.05], 0, 1)); }
  addInst(turnedGeo(0.6, 0.06), M.oak, tlegs);
  addInst(turnedGeo(0.42, 0.045), M.oak, blegs);
  const lathe = (pr, n = 20) => new THREE.LatheGeometry(pr.map(([r, h]) => new THREE.Vector2(r, h)), n);
  addInst(lathe([[0, 0], [0.09, 0], [0.1, 0.004], [0.125, 0.012], [0.138, 0.017], [0.132, 0.019], [0.11, 0.011], [0, 0.009]], 24), M.gold, plates, null, { cast: false });
  addInst(lathe([[0, 0], [0.042, 0], [0.042, 0.007], [0.012, 0.02], [0.009, 0.075], [0.016, 0.09], [0.038, 0.11], [0.046, 0.15], [0.047, 0.185], [0.043, 0.185], [0.04, 0.15], [0.01, 0.11]], 16), M.gold, cups, null, { cast: false });
  addInst(lathe([[0, 0], [0.06, 0], [0.065, 0.01], [0.085, 0.08], [0.08, 0.15], [0.05, 0.22], [0.045, 0.27], [0.06, 0.3], [0.055, 0.31]], 16), M.gold, jugs, null, { cast: false });

  // ---- the hooded fireplace in the east wall (g26): crest relief and four house roundels on the hood
  {
    const fz = FZ, fx = hw;
    for (const s of [-1, 1]) wallBox(fx - 1.3, fx, 0, 2.75, fz + s * 2.6 - 0.35, fz + s * 2.6 + 0.35, 'itrim', 0.04);
    wallBox(fx - 0.3, fx, 0, 2.75, fz - 2.3, fz + 2.3, 'paintBlack', 0.0);
    wallBox(fx - 1.3, fx - 0.3, 0, 0.05, fz - 2.3, fz + 2.3, 'flag', 0);
    wallBox(fx - 1.45, fx, 2.75, 3.25, fz - 3.1, fz + 3.1, 'itrim', 0.04);
    wallBox(fx - 1.65, fx, 3.25, 3.42, fz - 3.35, fz + 3.35, 'itrim', 0.03);
    const hood = new THREE.ExtrudeGeometry(pathPts(new THREE.Shape(), [[-3.2, 3.42], [3.2, 3.42], [1.8, 11.4], [-1.8, 11.4]]), { depth: 1.15, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 });
    put('sandstone', uvPlanar(hood.rotateY(Math.PI / 2).translate(fx - 1.15, 0, fz)));
    wallBox(fx - 1.22, fx - 1.1, 3.42, 3.62, fz - 3.15, fz + 3.15, 'itrim', 0.02);
    const toWall = (g, y, z) => g.rotateY(-Math.PI / 2).translate(fx - 1.18, y, z);
    addSculpt(toWall(reliefGeo(crestHeightCanvas(), 2.3, 2.45, 0.26, 320), 7.7, fz), M.carved);
    HOUSES4.forEach((h, i) => addSculpt(toWall(reliefGeo(roundelHeightCanvas(h.beast), 0.86, 0.86, 0.07, 110), 4.55, fz - 1.65 + i * 1.1), M.carved));
    // logs on iron dogs, the fire, the glow
    for (const o of [-0.5, 0.5]) { beam([fx - 1.0, 0.25, fz + o * 1.6], [fx - 0.4, 0.4, fz + o * 1.6], 0.06, 'paintBlack'); }
    for (const [a, b] of [[-1.2, 0.9], [-0.7, 1.3], [-1.0, 0.3], [0.2, 0.6], [0.6, 1.1]]) {
      const g = new THREE.CylinderGeometry(0.1 + 0.03 * Math.abs(b), 0.12, 1.5 + 0.3 * b, 12).rotateZ(Math.PI / 2).rotateY(Math.PI / 2 + a * 0.12);
      const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), uv.getY(i) * 1.6);
      put('ember', g.translate(fx - 0.75 + b * 0.08, 0.36 + (b > 1 ? 0.18 : 0) + Math.abs(a) * 0.04, fz + a * 0.38));
    }
    const FR = rng('hearth');
    for (let i = 0; i < 22; i++) { const zz = (FR() - 0.5) * 2.3, s = 0.7 + FR() * 0.6; fireTongue(fx - 0.78 + (FR() - 0.5) * 0.45, 0.42, fz + zz, 0.55 * s, (1.0 + FR() * 1.1) * s * (1 - 0.35 * Math.abs(zz))); }
    const hearth = new THREE.PointLight(new THREE.Color(1.0, 0.5, 0.2), 0, 16, 2); hearth.position.set(fx - 1.8, 1.2, fz); hearth.userData = { d: 14, n: 40 }; sc.add(hearth); points.push(hearth);
  }
  wainscotRun(-hw + 0.02, -0.2, -hw + 0.02, ZD, 0, Math.PI / 2);
  wainscotRun(hw - 0.02, ZD, hw - 0.02, FZ + 3.45, 0, -Math.PI / 2);
  wainscotRun(hw - 0.02, FZ - 3.45, hw - 0.02, -0.2, 0, -Math.PI / 2);

  // ---- the house-points hourglasses (g60) on the end wall beside the window: four glass tubes of gems under
  // funnel bulbs, an ivory head rail with brass knobs, brass rods with arrow finials, a wheel and gearing at the side
  {
    const z = -L + 0.42, y0 = DY + WAINSCOT_H + 0.12, gems = [], fill = [0.42, 0.3, 0.9, 0.62];
    const col = [[0.06, 0.4, 0.12], [0.08, 0.12, 0.6], [0.7, 0.04, 0.05], [0.75, 0.55, 0.12]];   // Slytherin, Ravenclaw, Gryffindor, Hufflepuff
    for (let k = 0; k < 4; k++) {
      const x = 4.95 + k * 0.56;
      const tube = new THREE.CylinderGeometry(0.17, 0.17, 1.95, 24, 1, true).translate(x, y0 + 0.98, z);
      sc.add(Object.assign(new THREE.Mesh(tube, M.tube), { renderOrder: 2 }));
      gems.push({ m: xf([x, y0 + 0.02, z], 0, [1, fill[k] * 1.9, 1]), c: col[k] });
      gems.push({ m: xf([x, y0 + 2.12, z], 0, [0.7, 0.16, 0.7]), c: col[k] });
      put('brass', new THREE.CylinderGeometry(0.2, 0.2, 0.06, 20).translate(x, y0, z));
      put('brass', lathe([[0.19, 0], [0.2, 0.02], [0.18, 0.06], [0.03, 0.22], [0.03, 0.28], [0.18, 0.42], [0.19, 0.46], [0, 0.46]], 20).translate(x, y0 + 1.96, z));
      sc.add(Object.assign(new THREE.Mesh(lathe([[0.17, 0], [0.03, 0.2], [0.03, 0.26], [0.17, 0.44]], 20).translate(x, y0 + 1.97, z), M.tube), { renderOrder: 2 }));
      rod([x + 0.28, y0 - 0.05, z + 0.02], [x + 0.28, y0 + 2.62, z + 0.02], 0.014, 'brass');
      put('brass', new THREE.ConeGeometry(0.05, 0.16, 4).translate(x + 0.28, y0 + 2.7, z + 0.02));
      put('brass', new THREE.SphereGeometry(0.045, 10, 8).translate(x, y0 + 2.6, z + 0.12));
    }
    addInst(new THREE.CylinderGeometry(0.15, 0.15, 1, 18).translate(0, 0.5, 0), M.gem, gems.map((g) => g.m), gems.map((g) => g.c), { cast: false });
    wallBox(4.62, 7.05, y0 + 2.42, y0 + 2.55, z - 0.1, z + 0.14, 'ivory', 0.04);
    wallBox(4.62, 7.05, y0 - 0.1, y0, z - 0.1, z + 0.18, 'brass', 0.02);
    put('paintBlack', new THREE.TorusGeometry(0.32, 0.03, 8, 28).translate(4.42, y0 + 0.8, z + 0.05));
    for (let a = 0; a < 6; a++) rod([4.42, y0 + 0.8, z + 0.05], [4.42 + Math.cos(a * 1.047) * 0.31, y0 + 0.8 + Math.sin(a * 1.047) * 0.31, z + 0.05], 0.012);
    rod([4.42, y0 + 0.8, z + 0.05], [4.42, y0 + 2.3, z + 0.05], 0.03);
    put('brass', new THREE.BoxGeometry(0.4, 0.5, 0.06).translate(4.42, y0 + 2.2, z + 0.02));
  }

  // ---- banners (later films): three of each house over its table, the school's either side of the great window. Built
  // always, shown only where a cut asks for them (HALL_BANNERS.visible; the PS opening feast has none). Wool hanging in
  // soft folds from a gilt rod with pointed finials, cords up to the hammer beams; they stir a little (vertex sway).
  {
    const G = new THREE.Group(); G.visible = HALL.banners; sc.add(G); HALL_BANNERS = G;
    const HO = [HOUSES4[0], HOUSES4[1], HOUSES4[2], HOUSES4[3]];   // tables from the west: Gryffindor, Hufflepuff, Ravenclaw, Slytherin
    const flagGeo = (w, h, seed) => {
      const g = new THREE.PlaneGeometry(w, h, 24, 72), p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), t = (h / 2 - y) / h;   // t: 0 at the rod, 1 at the tail
        p.setZ(i, (0.045 + 0.05 * t) * Math.sin(x * 5.2 + seed + 0.8 * t) + 0.035 * Math.sin(y * 0.9 + x * 1.4 + seed * 2.0) + 0.02 * Math.sin(x * 11.0 + seed * 3.0) * (1 - t));
      }
      g.computeVertexNormals(); return g;
    };
    const sway = { vhead: 'uniform float uTime;\n', vbegin: `{ float t = 1.0 - uv.y; transformed.z += t * t * (0.06 * sin(uTime * 0.7 + position.x * 0.9 + 1.3 * t) + 0.03 * sin(uTime * 1.3 + position.x * 2.1)); }\n` };
    const hang = (mat, x, z, w, h, top, seed) => {
      const m = new THREE.Mesh(flagGeo(w, h, seed), mat); m.position.set(x, top - h / 2 - 0.08, z); m.castShadow = true; m.receiveShadow = true; G.add(m);
      inGroup(G, () => {
        rod([x - w / 2 - 0.16, top, z], [x + w / 2 + 0.16, top, z], 0.035, 'gold');
        for (const sd of [-1, 1]) {
          const ex = x + sd * (w / 2 + 0.16);
          put('gold', new THREE.SphereGeometry(0.055, 12, 8).translate(ex, top, z));
          put('gold', new THREE.ConeGeometry(0.04, 0.16, 10).rotateZ(-sd * Math.PI / 2).translate(ex + sd * 0.12, top, z));
          rod([ex - sd * 0.1, top, z], [ex - sd * 0.5, top + 1.6, z], 0.012, 'gold');   // the cords up to the roof
          put('gold', new THREE.CylinderGeometry(0.03, 0.055, 0.22, 10).translate(ex, top - 0.2, z));   // a tassel at each end
        }
      });
    };
    TX.forEach((tx, k) => {
      const mat = bannerMat('banner_' + HO[k].id, (g, w, h, md) => drawBanner(g, w, h, HO[k], md), 1024, 3072, sway);
      for (const [j, z] of [-8.5, -17.5, -26.5].entries()) hang(mat, tx, z, 2.1, 6.3, 16.3, k * 3 + j);
    });
    const sm = bannerMat('banner_school', (g, w, h, md) => drawSchoolBanner(g, w, h, md), 1024, 3072, sway);
    for (const s of [-1, 1]) hang(sm, s * 5.85, -L + 0.14, 2.2, 6.6, 13.3, 20 + s);
  }
  // ---- floating candles over the tables, denser over the house tables
  const cl = [], cH = [];
  for (let i = 0; i < 1050; i++) {
    const tx = i < 900 ? TX[i % 4] + (R() - 0.5) * 3.0 : (R() - 0.5) * 12.5;
    const z = i < 900 ? tz0 + 1.0 - R() * (tz0 - tz1 + 2.0) : ZD - R() * 6.5;
    const y = 4.6 + (R() + R()) * 3.4, s = 0.65 + R() * 0.5;
    cl.push(xf([tx, y, z], R() * 6.28, [1, s, 1], (R() - 0.5) * 0.04, (R() - 0.5) * 0.04));
    cH.push([tx, y + 0.52 * s + 0.05, z]);
  }
  candles(cl, 0.032, 0.5);
  HALL_FLAMES.push(...cH);
  { // a halo round each flame (seen at night)
    const H = haloMesh(cH.length, true), aP = H.geometry.attributes.aP, aQ = H.geometry.attributes.aQ;
    cH.forEach(([x, y, z], i) => { aP.setXYZW(i, x, y, z, 0.07); aQ.setXYZW(i, 0, 0, 0.75, 0.2); });
    sc.add(H);
  }
  // the candles' light: one over each 5 m of each table and over the high table
  for (const tx of TX) for (let z = tz0 - 2.0; z > tz1; z -= 5.2) LAMPS.push({ room: 'hall', p: [tx, 7.2, z], c: [1.0, 0.64, 0.32].map((v) => v * 22), r: 11, see: 80 });
  for (const x of [-4.5, 0, 4.5]) LAMPS.push({ room: 'hall', p: [x, 6.8, ZD - 3.0], c: [1.0, 0.64, 0.32].map((v) => v * 16), r: 10, see: 80 });
  for (let z = -3; z > -L + 1; z -= 6.5) LAMPS.push({ room: 'hall', p: [0, 12.5, z], c: [1.0, 0.62, 0.3].map((v) => v * 22), r: 15, see: 90 });   // the glow of the candle cloud on the roof
  feast(TX, tz0, tz1, R);
  flushBowls();

  // ---- light: the sun through the west windows by day; candles, fire bowls and the hearth by night
  const sun = setSun(sc, new THREE.Vector3(-0.75, 0.42, 0.28), 40);
  sun.light.target.position.set(0, 0, -L / 2);
  for (const z of [-5, -13, -21, -29]) for (const x of [-3.6, 3.6]) {
    const p = new THREE.PointLight(new THREE.Color(1.0, 0.68, 0.36), 0, 30, 1.6); p.position.set(x, 8.5, z);
    p.userData = { d: 14, n: 9 }; sc.add(p); points.push(p);
  }
  { const p = new THREE.PointLight(new THREE.Color(1.0, 0.68, 0.36), 0, 22, 1.6); p.position.set(0, 7.5, ZD - 3.5); p.userData = { d: 8, n: 8 }; sc.add(p); points.push(p); }
  return { sun, sunI: 6.5, moonI: 1.1, envD: 0.22, envN: 0.03, points, levels: { day: [4, 15, 54, 158, 220], night: [2, 7, 26, 108, 216] } };
}
