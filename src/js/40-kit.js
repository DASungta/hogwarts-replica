// ------------------------------------------------------------------ building kit
// Everything is built directly in world space. Solid parts go into PARTS (merged per material at the end); repeated
// small parts (windows, pinnacles, merlons, dormers, corbels) are prototypes drawn as instanced meshes.
const PARTS = {};
function put(mat, g) { (PARTS[mat] ||= []).push(g); return g; }
function flushParts() {
  for (const [k, list] of Object.entries(PARTS)) {
    if (!list.length) continue;
    addMesh(merge(list), M[k]);
    PARTS[k] = [];
  }
}
const PROTOS = {};
function protoDef(name, parts) { PROTOS[name] = { parts, mats: [], cols: [] }; }
// build fn() into its own meshes inside group (parts and prototypes placed meanwhile are flushed into it)
function inGroup(group, fn) {
  const savedParts = {}, savedProtos = {}, savedTarget = TARGET;
  for (const k of Object.keys(PARTS)) { savedParts[k] = PARTS[k]; PARTS[k] = []; }
  for (const [k, p] of Object.entries(PROTOS)) { savedProtos[k] = [p.mats, p.cols]; p.mats = []; p.cols = []; }
  TARGET = group;
  const out = fn();
  flushParts(); flushProtos();
  TARGET = savedTarget;
  for (const [k, v] of Object.entries(savedParts)) PARTS[k] = v.concat(PARTS[k] || []);
  for (const [k, [m, c]] of Object.entries(savedProtos)) { PROTOS[k].mats = m; PROTOS[k].cols = c; }
  return out;
}
function place(name, m, col = null) { const p = PROTOS[name]; p.mats.push(m); p.cols.push(col || [0, 0, 0]); }
function flushProtos() {
  for (const p of Object.values(PROTOS)) {
    if (!p.mats.length) continue;
    for (const part of p.parts) addInst(part.geo, M[part.mat], p.mats, part.mat === 'glass' ? p.cols : null, { cast: part.cast ?? true });
    p.mats = []; p.cols = [];
  }
}

// ---- metric UVs
function uvPlanar(g) { // u along the wall, v = height; horizontal faces use plan coordinates
  const p = g.attributes.position, n = g.attributes.normal; const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const nx = n.getX(i), ny = n.getY(i), nz = n.getZ(i);
    if (Math.abs(ny) > 0.75) { uv[i * 2] = p.getX(i); uv[i * 2 + 1] = p.getZ(i); }
    else if (Math.abs(nx) > Math.abs(nz)) { uv[i * 2] = -Math.sign(nx) * p.getZ(i); uv[i * 2 + 1] = p.getY(i); }
    else { uv[i * 2] = Math.sign(nz) * p.getX(i); uv[i * 2 + 1] = p.getY(i); }
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return g;
}
function uvSlope(g, o, uDir, vDir) { // uv = projections on two directions (roof slopes)
  const p = g.attributes.position; const uv = new Float32Array(p.count * 2); const t = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { t.set(p.getX(i) - o.x, p.getY(i) - o.y, p.getZ(i) - o.z); uv[i * 2] = t.dot(uDir); uv[i * 2 + 1] = t.dot(vDir); }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return g;
}

// ---- solids
function wallBox(x0, x1, y0, y1, z0, z1, mat = 'stone', bevel = 0.12) {
  const w = x1 - x0, h = y1 - y0, d = z1 - z0;
  const g = (bevel > 0 ? new RoundedBoxGeometry(w, h, d, 2, Math.min(bevel, w / 4, h / 4, d / 4)) : new THREE.BoxGeometry(w, h, d))
    .translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return put(mat, uvPlanar(g));
}
function cyl(cx, cz, y0, y1, r, mat = 'stone', n = 40, rTop = null, open = true) {
  const g = new THREE.CylinderGeometry(rTop ?? r, r, y1 - y0, n, 1, open).translate(cx, (y0 + y1) / 2, cz);
  const p = g.attributes.position, uv = g.attributes.uv, nm = g.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    if (Math.abs(nm.getY(i)) > 0.75) uv.setXY(i, p.getX(i), p.getZ(i));
    else uv.setXY(i, uv.getX(i) * Math.PI * 2 * r, p.getY(i));
  }
  return put(mat, g);
}
function band(cx, cz, y, r, h = 0.45, out = 0.25) {
  const pr = [[r - 0.05, 0], [r + out * 0.55, 0], [r + out * 0.4, h * 0.18], [r + out * 0.85, h * 0.45], [r + out, h * 0.62], [r + out, h * 0.8], [r + out * 0.6, h], [r - 0.05, h]];
  const g = new THREE.LatheGeometry(pr.map(([a, b]) => new THREE.Vector2(a, b)), Math.max(16, Math.min(56, Math.round(r * 5))));
  return put('trim', g.translate(cx, y, cz));
}

// Cone roof with a bell-cast kick at the eave. uv: u = arc length, v = distance up the slope.
function cone(cx, cz, y, r, h, { n = 40, kick = 0.1, finial = true, mat = 'slate' } = {}) {
  const prof = [];
  for (let i = 0; i <= 14; i++) { const s = Math.pow(i / 14, 1.6); prof.push([r * (1 - s) + r * kick * Math.exp(-s * 16) * (1 - s), h * s]); }
  const pos = [], uvs = [], idx = [];
  let sl = 0; const sAcc = [0];
  for (let i = 1; i < prof.length; i++) { sl += Math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1]); sAcc.push(sl); }
  for (let i = 0; i < prof.length; i++) for (let j = 0; j <= n; j++) {
    const a = (j / n) * Math.PI * 2, rr = prof[i][0];
    pos.push(cx + Math.cos(a) * rr, y + prof[i][1], cz + Math.sin(a) * rr);
    uvs.push(a * Math.max(rr, 0.3), sAcc[i]);
  }
  const W = n + 1;
  for (let i = 0; i < prof.length - 1; i++) for (let j = 0; j < n; j++) { const k = i * W + j; idx.push(k, k + W, k + 1, k + 1, k + W, k + W + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx); g.computeVertexNormals();
  const nr = g.attributes.normal;
  for (let i = 0; i < prof.length; i++) { // weld the seam normals
    const k0 = i * W, k1 = i * W + n;
    const sx = nr.getX(k0) + nr.getX(k1), sy = nr.getY(k0) + nr.getY(k1), sz = nr.getZ(k0) + nr.getZ(k1), l = Math.hypot(sx, sy, sz) || 1;
    nr.setXYZ(k0, sx / l, sy / l, sz / l); nr.setXYZ(k1, sx / l, sy / l, sz / l);
  }
  put(mat, g);
  if (finial) spike(cx, y + h - 0.2, cz, Math.max(1.2, h * 0.09), Math.max(0.12, r * 0.02));
  return g;
}
function spike(x, y, z, h, r) {
  const pr = [[r * 1.9, 0], [r * 1.9, h * 0.04], [r * 1.2, h * 0.07], [r * 1.0, h * 0.14], [r * 1.9, h * 0.2], [r * 1.9, h * 0.26], [r * 0.9, h * 0.3], [r * 0.7, h * 0.5],
    [r * 1.5, h * 0.56], [r * 1.5, h * 0.6], [r * 0.5, h * 0.64], [r * 0.32, h * 0.86], [r * 0.9, h * 0.88], [r * 0.9, h * 0.92], [r * 0.18, h * 0.95], [0, h]];
  put('lead', new THREE.LatheGeometry(pr.map(([a, b]) => new THREE.Vector2(a, b)), 10).translate(x, y, z));
}
// n-sided spire (4 or 8 faces), flat faces, slate uv per face. rot turns it about y.
function spire(cx, cz, y, r, h, sides = 8, rot = 0, mat = 'slate') {
  const pos = [], uvs = [];
  const apex = new THREE.Vector3(cx, y + h, cz);
  for (let i = 0; i < sides; i++) {
    const a0 = rot + (i / sides) * Math.PI * 2, a1 = rot + ((i + 1) / sides) * Math.PI * 2;
    const p0 = new THREE.Vector3(cx + Math.cos(a0) * r, y, cz + Math.sin(a0) * r), p1 = new THREE.Vector3(cx + Math.cos(a1) * r, y, cz + Math.sin(a1) * r);
    const e = p0.distanceTo(p1), mid = p0.clone().add(p1).multiplyScalar(0.5), sl = mid.distanceTo(apex);
    pos.push(p0.x, p0.y, p0.z, apex.x, apex.y, apex.z, p1.x, p1.y, p1.z);
    uvs.push(0, 0, e / 2, sl, e, 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.computeVertexNormals();
  put(mat, g);
  spike(cx, y + h - 0.3, cz, Math.max(1, h * 0.07), Math.max(0.1, r * 0.04));
}
// Gable roof over a rectangle; ridge along x (axis 'x') or z. Slate slopes (with eave overhang), stone gable
// triangles flush with the end walls, raking copings, lead ridge.
function gableRoof(x0, x1, z0, z1, y, rise, { axis = 'x', over = 0.5, gables = [true, true], coping = true } = {}) {
  const ax = axis === 'x';
  const L0 = ax ? x0 : z0, L1 = ax ? x1 : z1, S0 = ax ? z0 : x0, S1 = ax ? z1 : x1;
  const half = (S1 - S0) / 2, mid = (S0 + S1) / 2;
  const P = (l, s, h) => (ax ? new THREE.Vector3(l, h, s) : new THREE.Vector3(s, h, l));
  for (const side of [-1, 1]) {
    const eS = mid + side * (half + over), eY = y - over * rise / half;
    const a = P(L0 - over * 0.6, eS, eY), b = P(L1 + over * 0.6, eS, eY), c = P(L1 + over * 0.6, mid, y + rise), d = P(L0 - over * 0.6, mid, y + rise);
    const g = new THREE.BufferGeometry();
    const flip = ax ? side > 0 : side < 0;
    const v = flip ? [a, b, c, a, c, d] : [a, c, b, a, d, c];
    g.setAttribute('position', new THREE.Float32BufferAttribute(v.flatMap((q) => [q.x, q.y, q.z]), 3));
    g.computeVertexNormals();
    const uDir = ax ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1);
    const vDir = c.clone().sub(b).normalize();
    uvSlope(g, a, uDir, vDir);
    put('slate', g);
    // eave fascia so the roof has thickness from below
    const f = new THREE.BufferGeometry();
    const a2 = a.clone(), b2 = b.clone(); a2.y -= 0.35; b2.y -= 0.35;
    const fv = flip ? [a2, b2, b, a2, b, a] : [a2, b, b2, a2, a, b];
    f.setAttribute('position', new THREE.Float32BufferAttribute(fv.flatMap((q) => [q.x, q.y, q.z]), 3));
    f.computeVertexNormals(); put('lead', f);
  }
  const ends = [[L0, -1], [L1, 1]];
  ends.forEach(([l, dir], i) => {
    if (!gables[i]) return;
    const sh = new THREE.Shape(); sh.moveTo(-half, 0); sh.lineTo(half, 0); sh.lineTo(0, rise); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.7, bevelEnabled: false });
    g.translate(0, 0, -0.7 * (dir > 0 ? 1 : 0));
    if (ax) g.rotateY(Math.PI / 2).translate(l, y, mid); else g.translate(mid, y, l);
    put('stone', uvPlanar(g));
    if (coping) for (const side of [-1, 1]) {
      const cl = Math.hypot(half, rise) + 0.6, ang = Math.atan2(rise, half);
      const g2 = new THREE.BoxGeometry(cl, 0.7, 0.9).translate(-cl / 2 + 0.3, 0, 0);
      g2.rotateZ(side > 0 ? Math.PI - ang : ang).translate(0, rise, 0);
      if (ax) g2.rotateY(Math.PI / 2).translate(l - dir * 0.2, y, mid); else g2.translate(mid, y, l - dir * 0.2);
      put('trim', g2);
      const kx = side * (half + 0.15), kn = new THREE.BoxGeometry(1.1, 0.9, 1.0).translate(kx, 0.25, 0);   // kneeler
      if (ax) kn.rotateY(Math.PI / 2).translate(l - dir * 0.2, y, mid); else kn.translate(mid, y, l - dir * 0.2);
      put('trim', kn);
    }
    if (coping && half > 2.5) { const ap = ax ? [l - dir * 0.2, mid] : [mid, l - dir * 0.2]; pinnacle(ap[0], y + rise + 0.2, ap[1], 0.55, Math.min(4, 1.6 + half * 0.2)); }
  });
  const rl = L1 - L0 + over * 1.2;
  const rg = new THREE.BoxGeometry(ax ? rl : 0.5, 0.35, ax ? 0.5 : rl).translate(ax ? (L0 + L1) / 2 : mid, y + rise + 0.1, ax ? mid : (L0 + L1) / 2);
  put('lead', rg);
}

// ---- openings
const WIN_H = { lancet: 2.2 + 0.866, round: 2.5, rect: 1.6 };
function archShape(kind, w, hs, sill = 0) {
  const s = new THREE.Shape(), hw = w / 2, N = 10;
  s.moveTo(-hw, sill); s.lineTo(hw, sill); s.lineTo(hw, hs);
  if (kind === 'lancet') {
    for (let i = 1; i <= N; i++) { const a = (i / N) * (Math.PI / 3); s.lineTo(-hw + w * Math.cos(a), hs + w * Math.sin(a)); }
    for (let i = 1; i <= N; i++) { const a = Math.PI / 3 - (i / N) * (Math.PI / 3); s.lineTo(hw - w * Math.cos(a), hs + w * Math.sin(a)); }
  } else if (kind === 'round') {
    for (let i = 1; i <= N * 2; i++) { const a = (i / (N * 2)) * Math.PI; s.lineTo(hw * Math.cos(a), hs + hw * Math.sin(a)); }
  } else s.lineTo(-hw, hs);
  s.lineTo(-hw, sill);
  return s;
}
// the hood mould over a window (a drip moulding following the head, with short drops), in the unit window frame
function hoodCurve(kind, hs, d = 0.16) {
  const hw = 0.5, pts = [];
  if (kind === 'lancet') {
    const R = 1 + d, a1 = Math.acos(hw / R);
    pts.push([-hw - d, hs - 0.32]);
    for (let i = 0; i <= 4; i++) { const a = (i / 4) * a1; pts.push([hw - R * Math.cos(a), hs + R * Math.sin(a)]); }
    for (let i = 3; i >= 0; i--) { const a = (i / 4) * a1; pts.push([-hw + R * Math.cos(a), hs + R * Math.sin(a)]); }
    pts.push([hw + d, hs - 0.32]);
  } else if (kind === 'round') {
    pts.push([-hw - d, hs - 0.3]);
    for (let i = 0; i <= 8; i++) { const a = Math.PI - (i / 8) * Math.PI; pts.push([(hw + d) * Math.cos(a), hs + (hw + d) * Math.sin(a)]); }
    pts.push([hw + d, hs - 0.3]);
  } else pts.push([-hw - d - 0.08, hs - 0.28], [-hw - d - 0.08, hs + d], [hw + d + 0.08, hs + d], [hw + d + 0.08, hs - 0.28]);
  const segs = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay);
    if (L < 1e-4) continue;
    segs.push(new THREE.BoxGeometry(L + 0.05, 0.11, 0.2).rotateZ(Math.atan2(by - ay, bx - ax)).translate((ax + bx) / 2, (ay + by) / 2, 0.22));
  }
  return merge(segs);
}
for (const kind of ['lancet', 'round', 'rect']) {
  const hs = kind === 'lancet' ? 2.2 : kind === 'round' ? 2.0 : 1.6;
  const glass = new THREE.ShapeGeometry(archShape(kind, 1, hs), 6).translate(0, 0, 0.03);
  const outer = archShape(kind, 1.3, hs, -0.18);
  outer.holes.push(archShape(kind, 1, hs));
  const frame = new THREE.ExtrudeGeometry(outer, { depth: 0.34, bevelEnabled: false, curveSegments: 6 });
  const sill = new THREE.BoxGeometry(1.5, 0.13, 0.46).translate(0, -0.2, 0.2);
  protoDef('win_' + kind, [{ mat: 'glass', geo: glass }, { mat: 'trim', geo: merge([frame, sill, hoodCurve(kind, hs)]) }]);
  // small windows: a deep frame only (most of the castle's windows; keeps the triangle count down)
  const outerS = archShape(kind, 1.26, hs, -0.16); outerS.holes.push(archShape(kind, 1, hs));
  protoDef('wins_' + kind, [{ mat: 'glass', geo: glass }, { mat: 'trim', geo: new THREE.ExtrudeGeometry(outerS, { depth: 0.3, bevelEnabled: false, curveSegments: 4 }) }]);
}
const winRng = rng('windows');
// one window: bottom centre at p, facing the horizontal direction (nx, nz)
const WIN_HALOS = [];   // lit windows of the grounds: [x, y, z, radius, nx, nz, seed, strength]
function win(kind, p, nx, nz, w, h, mull = 0, litP = 0.55) {
  const zs = 0.6 + 0.4 * w, lit = winRng() < litP, seed = winRng();
  place((w < 1.25 ? 'wins_' : 'win_') + kind, xf(p, Math.atan2(nx, nz), [w, h / WIN_H[kind], zs]), [lit ? 1 : 0, seed, mull / 4]);
  if (lit && !TARGET) {
    const s2 = (seed * 13.7) % 1, lvl = s2 < 0.18 ? 0.25 : s2 > 0.85 ? 1.5 : 0.8 + 0.4 * ((seed * 5.3) % 1);
    WIN_HALOS.push([p[0] + nx * 0.15, p[1] + h * 0.5, p[2] + nz * 0.15, 0.7 * w + 0.3 * h, nx, nz, seed, 0.12 * lvl]);
  }
}
function buildWindowHalos() {
  if (!WIN_HALOS.length) return;
  const m = haloMesh(WIN_HALOS.length), aP = m.geometry.attributes.aP, aQ = m.geometry.attributes.aQ;
  WIN_HALOS.forEach(([x, y, z, r, nx, nz, sd, k], i) => { aP.setXYZW(i, x, y, z, r); aQ.setXYZW(i, nx, nz, sd, k); });
  scene.add(m);
}
// a row of n windows along a wall from (x0,z0) to (x1,z1), outward normal to the given side (+1 = right of the direction)
function winRow(kind, x0, z0, x1, z1, y, n, w, h, { side = 1, mull = 0, inset = 0, lit = 0.55 } = {}) {
  const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
  const nx = -uz * side, nz = ux * side;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    win(kind, [x0 + dx * t + nx * inset, y, z0 + dz * t + nz * inset], nx, nz, w, h, mull, lit);
  }
}
function winRing(kind, cx, cz, r, y, n, w, h, { a0 = 0, a1 = Math.PI * 2, skip = null, lit = 0.5 } = {}) {
  for (let i = 0; i < n; i++) {
    const a = a0 + ((i + 0.5) / n) * (a1 - a0);
    if (skip && skip(a)) continue;
    const nx = Math.cos(a), nz = Math.sin(a);
    win(kind, [cx + nx * r, y, cz + nz * r], nx, nz, w, h, 0, lit);
  }
}

// ---- small repeated parts
(function defineProtos() {
  // pinnacle (unit width, total height 7.6): a shaft with a base mould, a gablet on each face, a cornice, a spirelet with
  // leafy crockets up its four arrises, a finial
  {
    const P = [new THREE.BoxGeometry(1, 3.9, 1).translate(0, 1.95, 0), new THREE.BoxGeometry(1.18, 0.28, 1.18).translate(0, 0.14, 0), new THREE.BoxGeometry(1.08, 0.12, 1.08).translate(0, 0.34, 0)];
    const gs = new THREE.Shape(); gs.moveTo(-0.5, 0); gs.lineTo(0.5, 0); gs.lineTo(0, 0.85); gs.closePath();
    for (let i = 0; i < 4; i++) P.push(new THREE.ExtrudeGeometry(gs, { depth: 0.12, bevelEnabled: false }).translate(0, 3.55, 0.5).rotateY((i * Math.PI) / 2));
    P.push(new THREE.BoxGeometry(1.2, 0.22, 1.2).translate(0, 4.0, 0));
    P.push(new THREE.ConeGeometry(0.68, 3.1, 4, 1).rotateY(Math.PI / 4).translate(0, 5.65, 0));
    for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) {
      const t = (k + 0.6) / 4.6, a = (i / 4) * Math.PI * 2 + Math.PI / 4, rr = 0.68 * (1 - t) + 0.05;
      P.push(new THREE.IcosahedronGeometry(0.11, 0).scale(1, 1.3, 1).translate(Math.cos(a) * rr, 4.1 + t * 3.1, Math.sin(a) * rr));
    }
    P.push(new THREE.SphereGeometry(0.13, 8, 6).translate(0, 7.22, 0));
    for (let i = 0; i < 4; i++) P.push(new THREE.BoxGeometry(0.06, 0.26, 0.16).rotateX(-0.6).translate(0, 7.36, 0.08).rotateY((i * Math.PI) / 2));
    P.push(new THREE.ConeGeometry(0.05, 0.3, 6).translate(0, 7.5, 0));
    protoDef('pinnacle', [{ mat: 'trim', geo: merge(P) }]);
  }
  protoDef('merlon', [{ mat: 'trim', geo: merge([new RoundedBoxGeometry(1, 0.9, 1, 2, 0.05).translate(0, 0.45, 0), new THREE.BoxGeometry(1.1, 0.12, 1.14).translate(0, 0.96, 0)]) }]);
  // corbel: stepped bracket, top at y = 0, projecting toward +z
  protoDef('corbel', [{ mat: 'trim', geo: merge([new THREE.BoxGeometry(1, 0.5, 1).translate(0, -0.25, 0.5), new THREE.BoxGeometry(1, 0.5, 0.66).translate(0, -0.75, 0.33), new THREE.BoxGeometry(1, 0.5, 0.33).translate(0, -1.25, 0.17)]) }]);
  // roof dormer facing +z: slate cheeks and a small gable, a glazed front (unit width 1, height ~1.6)
  const body = new THREE.BoxGeometry(1, 1.1, 1.6).translate(0, 0.55, -0.3);
  const sh = new THREE.Shape(); sh.moveTo(-0.62, 0); sh.lineTo(0.62, 0); sh.lineTo(0, 0.7); sh.closePath();
  const gab = new THREE.ExtrudeGeometry(sh, { depth: 1.8, bevelEnabled: false }).translate(0, 1.1, -1.3);
  const dg = new THREE.PlaneGeometry(0.6, 0.8).translate(0, 0.5, 0.51);
  const duv = dg.attributes.uv; for (let i = 0; i < duv.count; i++) duv.setXY(i, duv.getX(i) - 0.5, duv.getY(i) * 1.4);
  const bg = merge([body, gab]); uvPlanar(bg);
  const fr = merge([new THREE.BoxGeometry(0.09, 0.95, 0.08).translate(-0.34, 0.5, 0.5), new THREE.BoxGeometry(0.09, 0.95, 0.08).translate(0.34, 0.5, 0.5),
    new THREE.BoxGeometry(0.77, 0.09, 0.1).translate(0, 0.06, 0.52), new THREE.BoxGeometry(0.77, 0.09, 0.08).translate(0, 0.95, 0.5), new THREE.BoxGeometry(0.06, 0.8, 0.05).translate(0, 0.5, 0.52)]);
  const fin = merge([new THREE.ConeGeometry(0.06, 0.42, 6).translate(0, 2.02, 0.45), new THREE.SphereGeometry(0.07, 6, 5).translate(0, 1.83, 0.45)]);
  protoDef('dormer', [{ mat: 'slate', geo: bg }, { mat: 'glass', geo: dg }, { mat: 'trim', geo: fr }, { mat: 'lead', geo: fin }]);
  // chimney stack (unit plan 1 x 1, 3.4 high): a band, a corbelled cap, two pots
  protoDef('chimney', [
    { mat: 'stone', geo: uvPlanar(merge([new THREE.BoxGeometry(1, 2.7, 1).translate(0, 1.35, 0)])) },
    { mat: 'trim', geo: merge([new THREE.BoxGeometry(1.1, 0.12, 1.1).translate(0, 1.55, 0), new THREE.BoxGeometry(1.14, 0.14, 1.14).translate(0, 2.62, 0),
      new THREE.BoxGeometry(1.26, 0.16, 1.26).translate(0, 2.77, 0), new THREE.BoxGeometry(1.12, 0.12, 1.12).translate(0, 2.91, 0)]) },
    { mat: 'terracotta', geo: merge([-0.24, 0.24].flatMap((x) => [new THREE.CylinderGeometry(0.15, 0.19, 0.5, 10).translate(x, 3.22, 0), new THREE.CylinderGeometry(0.19, 0.19, 0.07, 10).translate(x, 3.5, 0)])) },
  ]);
})();
function pinnacle(x, y, z, w = 0.8, h = 6) { place('pinnacle', xf([x, y, z], 0, [w, h / 7.6, w])); }
function merlons(x0, z0, x1, z1, y, { mw = 0.9, gap = 0.8, h = 1.1, t = 0.6, proto = 'merlon' } = {}) {
  const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.floor(L / (mw + gap)));
  const ry = Math.atan2(x1 - x0, z1 - z0) + Math.PI / 2;
  for (let i = 0; i < n; i++) { const t2 = (i + 0.5) / n; place(proto, xf([lerp(x0, x1, t2), y, lerp(z0, z1, t2)], ry, [mw, h, t])); }
}
function merlonRing(cx, cz, r, y, n, { mw = 1.0, h = 1.2, t = 0.6 } = {}) {
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; place('merlon', xf([cx + Math.cos(a) * r, y, cz + Math.sin(a) * r], Math.atan2(Math.cos(a), Math.sin(a)), [mw, h, t])); }
}
function corbelRing(cx, cz, r, y, n, s = 0.6) {
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; place('corbel', xf([cx + Math.cos(a) * r, y, cz + Math.sin(a) * r], Math.atan2(Math.cos(a), Math.sin(a)), [s, s * 1.2, s * 1.4])); }
}
function dormersOnCone(cx, cz, y, r, h, rows, seed = 1) {
  const R = rng('dorm' + seed);
  rows.forEach(([t, n, s]) => {
    const yy = y + h * t, rr = r * (1 - t) * 0.985;
    const off = R() * Math.PI * 2;
    for (let i = 0; i < n; i++) {
      const a = off + (i / n) * Math.PI * 2;
      place('dormer', xf([cx + Math.cos(a) * (rr - 0.25), yy, cz + Math.sin(a) * (rr - 0.25)], Math.atan2(Math.cos(a), Math.sin(a)), s * 1.3), [R() < 0.3 ? 1 : 0, R(), 0]);
    }
  });
}

// run a builder, then scale everything it added vertically about height y0 by s (parts and prototype instances)
function squash(fn, y0, s) {
  const pc = {}, pp = {};
  for (const k in PARTS) pc[k] = PARTS[k].length;
  for (const k in PROTOS) pp[k] = PROTOS[k].mats.length;
  const r = fn();
  const m = new THREE.Matrix4().makeTranslation(0, y0, 0).multiply(new THREE.Matrix4().makeScale(1, s, 1)).multiply(new THREE.Matrix4().makeTranslation(0, -y0, 0));
  for (const k in PARTS) for (let i = pc[k] || 0; i < PARTS[k].length; i++) PARTS[k][i].applyMatrix4(m);
  for (const k in PROTOS) for (let i = pp[k] || 0; i < PROTOS[k].mats.length; i++) PROTOS[k].mats[i].premultiply(m);
  return r;
}
// ---- compound pieces
// Round tower: battered base, string courses, window rows, machicolated parapet, cone roof with optional dormers.
function roundTower({ x, z, r, y0, y1, cone: ch = r * 3.6, kick = 0.1, mach = true, winRows = [], dormers = null, bands = [], top = 'cone', seed = 'rt' }) {
  const batter = Math.min(6, (y1 - y0) * 0.15);
  cyl(x, z, y0, y0 + batter, r * 1.1, 'stone', 48, r);
  cyl(x, z, y0 + batter, y1, r, 'stone', 48);
  for (const by of bands) band(x, z, by, r);
  for (const wr of winRows) winRing(wr.kind || 'rect', x, z, r, wr.y, wr.n, wr.w, wr.h, wr);
  let ey = y1;
  if (mach) {
    const R2 = r + 0.9;
    corbelRing(x, z, r, y1, Math.round(r * 2.6), 0.62);
    band(x, z, y1 - 2.6, r, 0.35, 0.18);
    cyl(x, z, y1, y1 + 2.4, R2, 'stone', 48, null, false);
    band(x, z, y1 + 2.4, R2, 0.35, 0.15);
    ey = y1 + 2.7;
    if (top === 'flat') { merlonRing(x, z, R2 - 0.2, ey, Math.round(R2 * 2.2)); put('lead', new THREE.CircleGeometry(R2, 40).rotateX(-Math.PI / 2).translate(x, ey - 0.3, z)); }
  } else band(x, z, y1 - 0.4, r, 0.5, 0.3);
  if (top === 'cone') {
    const rr = mach ? r + 1.1 : r + 0.4;
    cone(x, z, ey, rr, ch, { kick });
    if (dormers) dormersOnCone(x, z, ey, rr, ch, dormers, seed);
  }
  return ey;
}
// Square tower body with clasping corner buttresses and string courses.
function squareTower({ x, z, w, d = w, y0, y1, bands = [], buttress = 1.2 }) {
  wallBox(x - w / 2, x + w / 2, y0, y1, z - d / 2, z + d / 2);
  if (buttress > 0) for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const bx = x + sx * (w / 2), bz = z + sz * (d / 2);
    wallBox(bx - buttress, bx + buttress, y0, y1 - 1.5, bz - buttress, bz + buttress, 'stone', 0.1);
  }
  for (const by of bands) wallBox(x - w / 2 - 0.3, x + w / 2 + 0.3, by, by + 0.45, z - d / 2 - 0.3, z + d / 2 + 0.3, 'trim', 0.05);
}
// Buttress against a wall: two stages and a pinnacle; (nx, nz) is the outward direction of the wall.
function buttress(x, z, nx, nz, y0, y1, { w = 1.4, d = 1.8, pin = 7 } = {}) {
  const tx = Math.abs(nz), tz = Math.abs(nx);
  const xa = x - tx * w / 2 + Math.min(0, nx * d), xb = x + tx * w / 2 + Math.max(0, nx * d);
  const za = z - tz * w / 2 + Math.min(0, nz * d), zb = z + tz * w / 2 + Math.max(0, nz * d);
  const ym = lerp(y0, y1, 0.55);
  wallBox(xa, xb, y0, ym, za, zb, 'stone', 0.08);
  const xa2 = x - tx * w / 2 + Math.min(0, nx * d * 0.6), xb2 = x + tx * w / 2 + Math.max(0, nx * d * 0.6);
  const za2 = z - tz * w / 2 + Math.min(0, nz * d * 0.6), zb2 = z + tz * w / 2 + Math.max(0, nz * d * 0.6);
  wallBox(xa2, xb2, ym, y1, za2, zb2, 'stone', 0.08);
  weathering(x, z, nx, nz, ym, w + 0.1, d * 0.6, d + 0.12, 0.9);
  weathering(x, z, nx, nz, y1, w + 0.1, -0.1, d * 0.6 + 0.12, 1.2);
  if (pin) pinnacle(x + nx * d * 0.3, y1 + 0.6, z + nz * d * 0.3, w * 0.8, pin);
}
// a sloping weathering on a buttress: a stone wedge of width w across (x, z), high at depth d0 (toward the wall),
// falling to the drip at depth d1, rising h; (nx, nz) is the outward direction
function weathering(x, z, nx, nz, y, w, d0, d1, h) {
  const sh = new THREE.Shape(); sh.moveTo(d0, 0); sh.lineTo(d1, 0); sh.lineTo(d1, 0.12); sh.lineTo(d0, h); sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: w, bevelEnabled: false }).translate(0, 0, -w / 2);
  put('trim', g.rotateY(Math.atan2(-nz, nx)).translate(x, y, z));
}
// a corbel table under an eave or parapet: small moulded brackets along a wall line, projecting toward (nx, nz)
function corbelTable(x0, z0, x1, z1, y, nx, nz, step = 1.1, s = 0.42) {
  const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / step));
  for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; place('corbel', xf([lerp(x0, x1, t), y, lerp(z0, z1, t)], Math.atan2(nx, nz), [s, s, s])); }
}
// A wall pierced by a row of arches, built as extruded bays. The wall runs from (x0,z0) to (x1,z1).
function arcade(x0, z0, x1, z1, y0, h, n, { kind = 'round', spring = 0.7, pier = 0.3, depth = 1, mat = 'stone', sill = 0 } = {}) {
  const L = Math.hypot(x1 - x0, z1 - z0), bw = L / n, ow = bw * (1 - pier);
  const geos = [];
  for (let i = 0; i < n; i++) {
    const s = new THREE.Shape();
    s.moveTo(-bw / 2, 0); s.lineTo(bw / 2, 0); s.lineTo(bw / 2, h); s.lineTo(-bw / 2, h); s.closePath();
    const hs = h * spring - (kind === 'lancet' ? ow * 0.866 : kind === 'round' ? ow / 2 : 0);
    s.holes.push(archShape(kind, ow, Math.max(sill + 0.1, hs), sill));
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 8 }).translate((i + 0.5) * bw - L / 2, 0, -depth / 2);
    geos.push(g);
  }
  const g = merge(geos);
  g.rotateY(-Math.atan2(z1 - z0, x1 - x0)).translate((x0 + x1) / 2, y0, (z0 + z1) / 2);
  return put(mat, uvPlanar(g));
}
// Straight stair flight from a to b ([x,y,z]) of width w, on a solid base reaching `base` metres below, with parapets.
function stairFlight(a, b, w, base = 16, mat = 'stone') {
  const dx = b[0] - a[0], dz = b[2] - a[2], L = Math.hypot(dx, dz), rise = b[1] - a[1];
  const nst = Math.max(2, Math.round(Math.abs(rise) / 0.2));
  const s = new THREE.Shape(); s.moveTo(0, -base);
  s.lineTo(0, 0);
  for (let i = 0; i < nst; i++) { const x1 = ((i + 1) / nst) * L; s.lineTo(x1, (i / nst) * rise); s.lineTo(x1, ((i + 1) / nst) * rise); }
  s.lineTo(L, -base + rise); s.closePath();
  const ang = -Math.atan2(dz, dx);
  const g = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false }).translate(0, 0, -w / 2);
  g.rotateY(ang).translate(a[0], a[1], a[2]);
  put(mat, uvPlanar(g));
  for (const side of [-1, 1]) {
    const p = new THREE.Shape(); p.moveTo(0, -1); p.lineTo(L, rise - 1); p.lineTo(L, rise + 1.5); p.lineTo(0, 1.5); p.closePath();
    const pg = new THREE.ExtrudeGeometry(p, { depth: 0.5, bevelEnabled: false }).translate(0, 0, side * (w / 2 + 0.25) - 0.25);
    pg.rotateY(ang).translate(a[0], a[1], a[2]);
    put(mat, uvPlanar(pg));
  }
}
function landing(p, w, base = 16) { wallBox(p[0] - w / 2 - 0.5, p[0] + w / 2 + 0.5, p[1] - base, p[1], p[2] - w / 2 - 0.5, p[2] + w / 2 + 0.5); }
function clockFace(x, y, z, r, nx, nz) {
  const g = new THREE.CircleGeometry(r, 40);
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) - 0.5) * 2, (uv.getY(i) - 0.5) * 2);
  g.rotateY(Math.atan2(nx, nz)).translate(x + nx * 0.12, y, z + nz * 0.12);
  put('clockface', g);
  const rg = new THREE.TorusGeometry(r * 1.02, r * 0.07, 6, 40).rotateY(Math.atan2(nx, nz)).translate(x + nx * 0.15, y, z + nz * 0.15);
  put('trim', rg);
}
