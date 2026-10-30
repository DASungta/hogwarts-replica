// ------------------------------------------------------------------ Gryffindor Tower, walked through in one unbroken first-person shot (?cut=gryff)
// In by the portrait hole and round the common room (the fire and the crest, the chess, the big painting and the dresser),
// through the south-east doorway and up the turret stair four times round, along the passage into the boys' dormitory,
// round the stove to Harry's bed; at night, by firelight and lamplight. No cuts and no change of set: the common room, the
// stair and the dormitory are one set (65-gryffindor.js, 65b-gryffdorm.js). Storyboard: docs/格兰芬多塔.md.
const GW = { eye: 1.62, fov: 66 };
// a walk: points [x, y, z, speed (m/s), hold (s)] on a smooth curve, the speed changing evenly from point to point, a hold
// standing still at a point; returns the position at time t and the times each point is reached (Ta) and left (Td)
function gwRoute(pts) {
  const n = pts.length, D = (n - 1) * 60;
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal');
  curve.arcLengthDivisions = D;
  const lens = curve.getLengths(D), L = lens[D], S = pts.map((_, i) => lens[i * 60]), Ta = [0], Td = [pts[0][4] || 0], seg = [];
  for (let i = 0; i < n - 1; i++) {
    const va = pts[i][3], vb = pts[i + 1][3], dt = (2 * (S[i + 1] - S[i])) / Math.max(va + vb, 0.15);
    seg.push([Td[i], S[i], va, (vb - va) / dt, dt]);
    Ta.push(Td[i] + dt); Td.push(Ta[i + 1] + (pts[i + 1][4] || 0));
  }
  const _v = new THREE.Vector3();
  const sOf = (t) => {
    if (t <= Td[0]) return 0;
    for (let i = 0; i < seg.length; i++) {
      const [t0, s0, v0, a, dt] = seg[i];
      if (t < t0 + dt) return Math.min(L, s0 + v0 * (t - t0) + 0.5 * a * (t - t0) ** 2);
      if (t < Td[i + 1]) return S[i + 1];
    }
    return L;
  };
  const at = (t) => { curve.getPointAt(clamp(sOf(t) / L, 0, 1), _v); return [_v.x, _v.y, _v.z]; };
  return { at, Ta, Td, T1: Td[n - 1], L };
}
// where to look: keys { t, look: [x, y, z] } or { t, ahead: pitch } (along the way it is going), turned into yaw and pitch
// at the key's own moment and interpolated as angles (C1, through the keys), so the view swings round the shortest way
function gwLook(P, keys) {
  const K2 = [];
  for (const k of keys) {
    const p = P.at(k.t);
    let d;
    if (k.look) d = vsub(k.look, p);
    else { const a = P.at(k.t - 0.25), b = P.at(k.t + 0.25); d = vsub(b, a); d[1] = 0; if (vlen(d) < 1e-4) d = [0, 0, -1]; }
    d = vnorm(d);
    let yaw = Math.atan2(d[0], d[2]);
    const pitch = k.look ? Math.asin(clamp(d[1], -1, 1)) : k.ahead;
    if (K2.length) { const prev = K2[K2.length - 1].p[0]; while (yaw - prev > Math.PI) yaw -= 2 * Math.PI; while (yaw - prev < -Math.PI) yaw += 2 * Math.PI; }
    K2.push({ t: k.t, p: [yaw, pitch] });
  }
  return (t) => { const [yaw, pitch] = trackAt(K2, t, 'p'); return [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)]; };
}
function gwPaths() {
  const e = GW.eye, top = GDM.Y, rr = 1.45, c = gcrP(3, 0, 0, -(GCR.T + rr)), f = gcrF(3), ent0 = Math.atan2(-f.d[1], -f.d[0]);
  const N = 56, rise = top / N, da = (2 * Math.PI * 4 - 1.65) / (N - 1);   // the turret stair (65-gryffindor.js)
  const ramp = (a) => clamp(rise * ((a - ent0 - 0.45) / da + 0.5), 0, top);   // the line through the middle of the treads
  const S = (a, r, v) => [c[0] + Math.cos(a) * r, ramp(a) + e, c[2] + Math.sin(a) * r, v];
  const P = [];
  const W = {};   // named points (their index in P)
  const add = (name, p) => { if (name) W[name] = P.length; P.push(p); };
  const g = (k, u, y, w, v, h = 0) => [...gcrP(k, u, y, w), v, h];
  const d = (k, u, y, w, v, h = 0) => [...gdP(k, u, y, w), v, h];
  const ring = (deg, r, v, h = 0) => { const a = (deg * Math.PI) / 180; return [Math.cos(a) * r, top + e, Math.sin(a) * r, v, h]; };
  // the common room: in at the portrait hole, down its three steps, round the chairs to the fire
  add('start', g(5, 0, 0.57 + e, -0.9, 0, 0.8));
  add(null, g(5, 0, 0.57 + e, -0.15, 0.8));
  add('steps', g(5, 0.05, e + 0.03, 1.15, 1.0));
  add(null, [-3.0, e, 1.85, 1.15]);
  add(null, [-2.45, e, 0.6, 1.15]);
  add(null, [-1.6, e, -0.65, 0.9]);
  add('fire', [-0.05, e, -1.2, 0.12, 2.0]);
  add(null, [1.25, e, -0.45, 1.05]);
  add('chess', [2.6, e, -0.2, 0.15, 0.5]);
  add('south', [2.75, e, 1.35, 0.12, 2.2]);
  add(null, g(3, -0.1, e, 1.0, 0.95));
  add('door', g(3, 0, e, 0.0, 0.95));
  add('turret', g(3, 0, e, -GCR.T, 1.0));
  // the stair: four times round the newel, a little outside the middle of the treads
  const a0 = ent0 + 0.35, a1 = ent0 + 0.45 + 55.5 * da;
  add('climb', S(a0, 1.05, 1.2));
  for (let a = a0 + 0.35; a < a1 - 0.2; a += 0.35) P.push(S(a, 0.95, 1.55));
  add('landed', S(a1, 0.95, 1.0));
  const aL = a1 + 0.42; P.push([c[0] + Math.cos(aL) * 0.95, top + e, c[2] + Math.sin(aL) * 0.95, 0.7]);
  add(null, [c[0] + Math.cos(ent0 - 0.18) * 1.15, top + e, c[2] + Math.sin(ent0 - 0.18) * 1.15, 0.7]);
  // the passage and the dormitory
  add('passage', g(3, 0, top + e, -GCR.T, 0.75));
  add(null, g(3, 0, top + e, GCR.A - GDM.R - GDM.T, 0.75));
  add('in', d(0, 0.05, e, 0.35, 0.7));
  add('look', d(0, 0.1, e, 2.15, 0, 2.6));
  add(null, ring(25, 1.12, 0.55));                // round the stove the other way: Ron's bed, Harry's, then Dean's (65b)
  add('ron', ring(5, 1.08, 0, 1.6));
  add(null, ring(-25, 1.08, 0.55));
  add('harry', ring(-58, 1.08, 0, 2.6));
  add(null, ring(-82, 1.08, 0.55));
  add('end', ring(-102, 1.08, 0, 4.8));
  return { R: gwRoute(P), W, c, ent0, top, rpa: rise / da };   // rpa: the stair's rise per radian
}
function gryffWalkShots() {
  ensureInterior('gryff');
  const { R, W, top, c, rpa } = gwPaths(), Ta = (n) => R.Ta[W[n]], Td = (n) => R.Td[W[n]];
  const fire = [0.85, 1.05, -4.9], chess = [3.85, 0.62, -1.0], paint = gcrP(4, 0.45, 3.3, 0.16), dress = gcrP(3, 1.6, 2.35, 0.3);
  const keys = [
    { t: 0, look: [0.85, 2.3, -5.0] }, { t: Ta('steps'), look: [0.6, 1.9, -5.0] }, { t: Ta('fire') - 2.2, look: fire },
    { t: Td('fire') - 0.2, look: [0.6, 1.5, -4.9] },
    { t: Ta('chess') - 1.4, look: [3.9, 1.8, -2.6] }, { t: Ta('chess') + 0.2, look: chess },
    { t: Ta('south') + 0.4, look: paint }, { t: Ta('south') + 1.8, look: paint }, { t: Td('south') - 0.4, look: dress },
    { t: Ta('door') - 0.3, look: gcrP(3, 0.2, 2.0, -2.6) }, { t: Ta('turret'), ahead: 0.18 },
  ];
  // up the stair the view goes ahead round the newel to the treads rising there, a little lower than the eye
  for (let t = Ta('climb') + 0.5; t < Ta('landed') - 0.3; t += 0.6) {
    const p = R.at(t), a = Math.atan2(p[2] - c[2], p[0] - c[0]) + 1.15;   // 1.15 rad further round, as high as the eye there less 0.42 m
    keys.push({ t, look: [c[0] + Math.cos(a) * 0.7, p[1] + 1.15 * rpa - 0.42, c[2] + Math.sin(a) * 0.7] });
  }
  keys.push({ t: Ta('landed') + 0.3, ahead: 0.08 }, { t: Ta('passage') - 0.4, look: [0, top + 1.4, 0] }, { t: Ta('in'), look: [0, top + 1.1, 0] },
    { t: Ta('look') + 0.5, look: gdP(2, 0, 1.3, 1.6) }, { t: Ta('look') + 1.5, look: gdP(2, 0, 1.3, 1.6) }, { t: Td('look') - 0.2, look: gdP(10, 0, 1.3, 1.7) },
    { t: Td('look') + 1.2, look: gdP(10, 0.1, 1.1, 1.6) }, { t: Ta('ron') + 0.2, look: gdP(10, 0, 0.95, 1.7) }, { t: Td('ron') - 0.1, look: gdP(10, -0.25, 1.45, 0.6) },
    { t: Ta('harry') + 0.2, look: gdP(8, 0, 0.75, 2.4) }, { t: Td('harry') - 0.3, look: gdP(8, 0, 0.95, 1.6) },
    { t: Ta('end') + 0.6, look: gdP(6, 0, 1.6, 0.9) }, { t: Ta('end') + 3.4, look: [-0.1, top + 4.4, -0.3] }, { t: R.T1, look: [-0.1, top + 4.6, -0.3] });
  const look = gwLook(R, keys);
  const END = R.T1 + 0.4;
  const shot = { name: 'gryffwalk', t0: 0, dur: END, scene: 'gryff', night: true, fleet: false, bloom: 0.08, fadeIn: 1.4, fadeOut: 2.2,
    title: [END - 4.6, END + 1], titleCard: { en: 'Gryffindor Tower', zh: '格兰芬多塔', by: '出品人　@dasungta_zhang', src: '参考：利维斯登片场照片（维基共享资源，CC BY）·《哈利·波特与混血王子》' },
    keys: [K(0, [0, 0, 0], [0, 0, -1], GW.fov)],
    rig: (lt) => { const p = R.at(lt), q = look(lt); return { p, q: vadd(p, q), f: GW.fov }; },
    enter: () => { camera.near = 0.05; camera.far = 400; camera.updateProjectionMatrix(); },
    update: () => { INTSKY.uCeil.value = -1; },
  };
  TOUR.dur = END;
  return [shot];
}
function gryffWalkStop() { camera.near = 0.5; camera.far = 90000; camera.updateProjectionMatrix(); }
