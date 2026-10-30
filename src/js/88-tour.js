// ------------------------------------------------------------------ the tour: the first night and the next morning (docs/运镜.md)
// A list of shots, each a camera track (keyframes in seconds, interpolated as a C1 cubic through them), the scene it
// plays in (the grounds or an interior set), night or day, fades, a caption, and what moves in it (the train, the
// boats, Hagrid's lantern, the turning stair, the enchanted ceiling). The page plays it in real time as a preview;
// tools/film.mjs renders it frame by frame (several samples per frame spread over the shutter, so it has motion blur).
const TOUR_FPS = 24;
const TOUR = { shots: null, dur: 0, playing: false, t: 0, cur: -1, cut: Q.get('cut') || 'tour' };   // cut: the tour, 'magic' (89-short.js), 'dusk' (89b-dusk.js), 'snitch' (89c), 'gryff' (89d-gryffwalk.js)
const TOURX = { fleet: null, fleetBody: null, fleetLamps: null, lantern: null, lampPos: [], boat: null };

// ---- interpolation: keys [{ t, p, q, f }] → camera at time t; zero tangents at the ends ease the move in and out
function trackAt(keys, t, field) {
  const n = keys.length;
  if (n === 1 || t <= keys[0].t) return keys[0][field];
  if (t >= keys[n - 1].t) return keys[n - 1][field];
  let i = 0; while (i < n - 2 && t > keys[i + 1].t) i++;
  const k1 = keys[i], k2 = keys[i + 1], h = k2.t - k1.t, u = (t - k1.t) / h;
  const tan = (k) => {
    if (k === 0 || k === n - 1) return null;
    const a = keys[k - 1], b = keys[k + 1];
    return Array.isArray(a[field]) ? a[field].map((v, j) => (b[field][j] - v) / (b.t - a.t)) : (b[field] - a[field]) / (b.t - a.t);
  };
  const m1 = tan(i), m2 = tan(i + 1);
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
  const one = (v1, v2, t1, t2) => h00 * v1 + h10 * h * (t1 ?? 0) + h01 * v2 + h11 * h * (t2 ?? 0);
  if (Array.isArray(k1[field])) return k1[field].map((v, j) => one(v, k2[field][j], m1 && m1[j], m2 && m2[j]));
  return one(k1[field], k2[field], m1, m2);
}
const K = (t, p, q, f) => ({ t, p, q, f });
const easeIO = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

// ---- the boats: ten, in two files behind the lead boat, along a straight line from the jetty to the boathouse door
const FLEET = { A: [-130, 1214], B: [51.5, 118] };
FLEET.L = Math.hypot(FLEET.B[0] - FLEET.A[0], FLEET.B[1] - FLEET.A[1]);
FLEET.dir = [(FLEET.B[0] - FLEET.A[0]) / FLEET.L, (FLEET.B[1] - FLEET.A[1]) / FLEET.L];
FLEET.perp = [-FLEET.dir[1], FLEET.dir[0]];
const fleetP = (s, lat = 0) => [FLEET.A[0] + FLEET.dir[0] * s + FLEET.perp[0] * lat, FLEET.A[1] + FLEET.dir[1] * s + FLEET.perp[1] * lat];
// a loose flotilla, not two files: each boat somewhere 7-40 m behind Hagrid's and up to 9 m to either side, kept clear of
// its neighbours (an ellipse 5.4 m long, 3 m wide) and of the lake shot's camera (14 m back, 2.2 m to the side);
// each has its own surge, sideways drift, yaw and pace (some gain a little, some fall behind)
const FLEET_SLOTS = (() => {
  const R = rng('flotilla'), out = [{ back: 0, lat: 0, p1: 0.3, p2: 1.1, p3: 2.0, v: 0 }];
  for (let tries = 0; out.length < 10 && tries < 5000; tries++) {
    const back = 7 + R() * 33, lat = -9 + R() * 15.5;
    if (Math.abs(back - 14) < 4.8 && Math.abs(lat - 2.2) < 2.8) continue;
    if (out.some((o) => ((o.back - back) / 5.4) ** 2 + ((o.lat - lat) / 3.0) ** 2 < 1)) continue;
    out.push({ back, lat, p1: R() * 6.28, p2: R() * 6.28, p3: R() * 6.28, v: (R() - 0.5) * 0.22 });
  }
  return out;
})();
function buildTourProps() {
  if (TOURX.fleet) return;
  const B = boatGeo(); TOURX.boat = B;
  TOURX.fleetBody = [new THREE.InstancedMesh(B.hull, M.boatHull, 10), new THREE.InstancedMesh(B.trim, M.boatWood, 10), new THREE.InstancedMesh(B.iron, M.paintBlack, 10)];
  TOURX.fleet = TOURX.fleetBody[0];
  TOURX.fleetLamps = [new THREE.InstancedMesh(B.frame, M.paintBlack, 10), new THREE.InstancedMesh(B.glass, M.lanternGlass, 10), new THREE.InstancedMesh(B.flame, M.mantle, 10)];
  for (const m of [...TOURX.fleetBody, ...TOURX.fleetLamps]) { m.frustumCulled = false; m.visible = false; m.castShadow = TOURX.fleetBody.includes(m); m.receiveShadow = true; scene.add(m); }
  for (let i = 0; i < 10; i++) { TOURX.lampPos.push(null); LAMPS.push({ at: () => TOURX.lampPos[i], c: [1.0, 0.6, 0.28].map((v) => v * 4), r: 7, halo: 0.45, hk: 0.3, on: () => TOURX.fleet.visible }); }
  // Hagrid's lantern: a black iron frame, glass that glows, a ring to carry it by
  const posts = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => new THREE.BoxGeometry(0.025, 0.36, 0.025).translate(a * 0.12, 0, b * 0.12));
  const caps = [new THREE.BoxGeometry(0.3, 0.04, 0.3).translate(0, -0.19, 0), new THREE.ConeGeometry(0.2, 0.12, 4).rotateY(Math.PI / 4).translate(0, 0.24, 0), new THREE.TorusGeometry(0.07, 0.012, 6, 16).translate(0, 0.36, 0)];
  const g = new THREE.Group();
  g.add(new THREE.Mesh(merge([...posts, ...caps]), M.paintBlack), new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.32, 0.22), M.lanternGlass), new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8).scale(1, 1.8, 1), M.mantle));
  g.scale.setScalar(1.5); g.visible = false; scene.add(g);
  TOURX.lantern = g;
  LAMPS.push({ obj: g, p: [0, 0, 0], c: [1.0, 0.62, 0.3].map((v) => v * 10), r: 12, halo: 0.9, hk: 0.45, on: () => g.visible });
}
const _hide = new THREE.Matrix4().makeScale(0, 0, 0);
function fleetAt(s, t, stopAt = null, speed = 0) {
  const ry = Math.atan2(FLEET.dir[0], FLEET.dir[1]), B = TOURX.boat;
  let lead = null;
  FLEET_SLOTS.forEach((F, i) => {
    const back = F.back + 1.3 * Math.sin(0.23 * t + F.p1) + F.v * t * (speed > 0.1 ? 1 : 0), lat = F.lat + 0.9 * Math.sin(0.15 * t + F.p2);
    let si = s - back, v = speed;
    const stopI = stopAt === null ? null : i === 0 ? stopAt + 28 : stopAt - back * 0.6;   // Hagrid's boat goes in; the rest bunch up outside the gate
    if (stopI !== null && si > stopI) { si = stopI; v = 0; }
    const [x, z] = fleetP(si, lat);
    const bob = 0.05 * Math.sin(t * (1.8 + 0.5 * Math.sin(F.p3)) + F.p1 * 3), pitch = 0.028 * Math.sin(t * (1.4 + 0.4 * Math.cos(F.p2)) + F.p2 * 2), roll = 0.035 * Math.sin(t * (1.1 + 0.4 * Math.sin(F.p1)) + F.p3 * 2);
    const yawDrift = v > 0.3 ? -Math.atan2(0.9 * 0.15 * Math.cos(0.15 * t + F.p2), v) : 0;   // the bow follows its sideways drift
    const h = ry + yawDrift + 0.06 * Math.sin(0.19 * t + F.p3) + (i ? 0.05 * Math.sin(F.p3 * 3.0) : 0), m = xf([x, LAKE_Y + 0.12 + bob, z], h, 1, pitch, roll);
    for (const M_ of TOURX.fleetBody) M_.setMatrixAt(i, m);
    const lm = i === 0 ? _hide : boatLanternMatrix(m, B, 0.05 * Math.sin(t * 1.9 + i) - 0.03 * clamp(v, 0, 4) / 4, 0.06 * Math.sin(t * 1.4 + i * 2.1));
    for (const L of TOURX.fleetLamps) L.setMatrixAt(i, lm);
    const q = new THREE.Vector3(...B.light).applyMatrix4(m); TOURX.lampPos[i] = i === 0 ? null : [q.x, q.y, q.z];
    if (i === 0) { const p = new THREE.Vector3(...B.hang).applyMatrix4(m); lead = [p.x, p.y - 0.56, p.z]; }
    MIRROR.uBoat.value[i].set(x, z, h, v);
  });
  MIRROR.uBoatN.value = 10;
  for (const M_ of [...TOURX.fleetBody, ...TOURX.fleetLamps]) M_.instanceMatrix.needsUpdate = true;
  return lead;   // Hagrid's lantern, hung from the lead boat's crook
}
// the arrival: turned end for end about its middle (x = 17.8), so the engine leads in from the east and stops at the west
// end, braking evenly from 16 m/s over 15 s (before t = 0 it was running at 16 m/s)
const tourTrainX = (t) => (t < 0 ? 155.6 - 16 * t : 35.6 + 120 * (1 - clamp(t / 15, 0, 1)) ** 2);
const tourTrainSpeed = (t) => (t < 0 ? 16 : 16 * (1 - clamp(t / 15, 0, 1)));
const tourTrainAt = (t, p) => [tourTrainX(t) - p[0], p[1], STN.z - p[2]];   // an engine-local point (z from the track) in the world
function trainAt(t) { // seconds into the arrival; null = parked as built
  if (!TRAIN) return;
  if (t === null) { TRAIN.position.set(0, 0, 0); TRAIN.rotation.y = 0; expressMotion(0); steamParked(); return; }
  TRAIN.rotation.y = Math.PI; TRAIN.position.set(tourTrainX(t), 0, 2 * STN.z);
  expressMotion(tourTrainX(0) - tourTrainX(t));   // wheels and rods turn with the distance run
}
function lanternAt(p, t, walking = true) {
  const L = TOURX.lantern; L.visible = !!p;
  if (!p) return;
  L.position.set(p[0], p[1] + (walking ? 0.05 * Math.abs(Math.sin(t * 5.2)) : 0), p[2]);
  L.rotation.set(walking ? 0.06 * Math.sin(t * 2.6) : 0, 0, walking ? 0.08 * Math.sin(t * 5.2) : 0);
}
const pathAt = (pts, t) => trackAt(pts.map(([tt, p]) => ({ t: tt, p })), t, 'p');

// ---- the shots
function tourShots() {
  const PY = STN.y + 0.75, W0 = LAKE_Y;
  const st = STAIR, top = st[st.length - 1], prev = st[st.length - 2];
  const lp = (s, lat, dy) => { const [x, z] = fleetP(s, lat); return [x, W0 + dy, z]; };
  const on = (u, dy) => [lerp(prev[0], top[0], u), lerp(prev[1], top[1], u) + dy, lerp(prev[2], top[2], u)];   // along the last flight
  const ARCH = -70 + (46 / 13) * 11.5;   // the loggia arch the last flight comes up to
  const S = [
    { name: 'arrive', dur: 16, night: true, fadeIn: 2.5, cap: [1.5, 7, '九月一日夜 · 霍格莫德车站'],
      keys: [K(0, [-70, PY + 1.35, 1319.6], [60, PY + 2.2, 1322], 34), K(5, [-69.6, PY + 1.38, 1319.55], [8, PY + 2.3, 1322], 35),
        K(10, [-68.8, PY + 1.45, 1319.5], [-30, PY + 2.4, 1322], 37), K(16, [-67, PY + 1.55, 1319.4], [-44, PY + 2.5, 1321.6], 40)],
      update: (t) => { trainAt(t); steamAt(t, tourTrainAt, tourTrainSpeed, 15); fleetAt(0, t); lanternAt(null); } },
    { name: 'lamp', dur: 11, night: true, fadeOut: 0.4,
      keys: [K(0, [-70, PY + 1.6, 1316.4], [-95, PY + 1.8, 1316.2], 40), K(5, [-90, PY + 2.4, 1315.8], [-112, PY + 0.6, 1309], 40),
        K(11, [-106, PY + 16, 1312], [-30, -38, 40], 17)],
      update: (t) => { trainAt(15); steamAt(16 + t, tourTrainAt, tourTrainSpeed, 15); fleetAt(0, t);
        lanternAt(pathAt([[0, [-86, PY + 2.3, 1317.2]], [4.5, [-104, PY + 2.3, 1315.2]], [7.5, [-114, STN.y + 1.7, 1302]], [10, [-126, STN.y + 1.6, 1288]], [11, [-129, STN.y + 1.2, 1283]]], t), t); } },
    // boats: alongside the right-hand file, low, the hulls lit by their lanterns; rising and falling back until the two
    // files of lanterns lead away toward the lit castle
    { name: 'boats', dur: 11, night: true, fadeIn: 0.4, fadeOut: 0.4,
      keys: [K(0, lp(4, 10, 2.8), lp(22, 0, 0.3), 34), K(5.5, lp(9, 8.5, 4.2), lp(45, 0, 0.1), 31), K(11, lp(16, 6.5, 6.0), lp(70, 0, 0), 28)],
      update: (t) => { lanternAt(fleetAt(30 + 36 * (t / 11), t, null, 36 / 11), t, false); } },
    { name: 'lake', dur: 12, night: true, fadeIn: 0.4, cap: [1, 6.5, '坐船过黑湖'],
      keys: [K(0, lp(846, 2.2, 0.85), lp(905, 0, 2.2), 50), K(6, lp(868, 2.0, 0.95), lp(940, 0, 9), 52), K(12, lp(891, 2.2, 1.15), [0, 30, 40], 54)],
      update: (t) => { lanternAt(fleetAt(860 + 45 * t / 12, t, null, 45 / 12), t, false); } },
    { name: 'boathouse', dur: 10, night: true,
      keys: [K(0, lp(1000, -14, 2.5), [51.5, W0 + 3, 114], 48), K(5, [26, W0 + 6, 152], [44, W0 + 9, 106], 50), K(10, [18, W0 + 15, 154], [-30, -12, 70], 52)],
      update: (t) => {
        const stop = FLEET.L - 10, s = 1040 + (stop + 28 - 1040) * (1 - (1 - clamp(t / 7, 0, 1)) ** 2);
        const bow = fleetAt(s, t, stop, (stop + 28 - 1040) * 2 * (1 - clamp(t / 7, 0, 1)) / 7);
        // off the boat onto the landing inside, out through the back door to the foot of the stairs, and up
        const F = LAKE_Y + 1;
        lanternAt(t < 6.2 ? bow : pathAt([[6.2, bow], [7.0, [51.5, F + 2.3, 97.2]], [7.7, [51.5, F + 2.3, 94.2]], [8.4, [st[0][0], st[0][1] + 2.4, st[0][2]]], [10, [st[1][0] + 18, st[1][1] + 2.4, st[1][2]]]], t), t, t >= 6.2);
      } },
    { name: 'steps', dur: 12, night: true, fadeOut: 0.9,
      keys: [K(0, [-32, -3.2, 63.4], [-21, -2.6, 58], 52), K(2.6, [-21.5, -3.2, 60.6], [-21.5, -2.8, 50], 54),
        K(5, [-23, -3.2, 52.5], [-60, -2.4, 51], 52), K(8.5, [-42, -3.2, 52.6], [-64, -2.5, 51.2], 50), K(12, [-57.5, -3.1, 53.7], [-65, -2.5, 50.2], 46)],
      update: (t) => { fleetAt(FLEET.L, t, FLEET.L - 10);
        lanternAt(pathAt([[0, [-25, -2.6, 61.6]], [2.2, [-21.5, -2.8, 57.5]], [4, [-22.5, -2.8, 52.2]], [10.5, [-63.5, -2.8, 51.8]], [12, [-64.4, -2.8, 51.4]]], t), t); } },
    { name: 'entrance', dur: 10, night: true, scene: 'stair', fadeIn: 0.9, cap: [1.2, 5.5, '门厅'],
      keys: [K(0, [0, 1.7, 11.0], [0, 3.0, -12], 62), K(3.5, [2.0, 1.7, 8.5], [5, 6.5, 2], 62), K(7, [1.0, 1.7, 9.5], [2, 9, 0], 64),
        K(10, [0, 1.7, 9.0], [0, 4.2, -12], 60)],
      update: (t) => { if (STAIR_SWING) STAIR_SWING.rotation.y = 0.42 * Math.sin((t / 10) * Math.PI); } },
    { name: 'tohall', dur: 6, night: true, scene: 'stair', fadeOut: 0.6,
      keys: [K(0, [0, 1.7, 9.0], [0, 4.2, -12], 60), K(6, [0, 1.7, -6.8], [0, 3.6, -12], 56)],
      update: () => { if (STAIR_SWING) STAIR_SWING.rotation.y = 0; } },
    { name: 'hall', dur: 14, night: true, scene: 'hall', fadeIn: 0.6, cap: [1.5, 7, '大礼堂 · 开学晚宴'],
      keys: [K(0, [0, 1.6, -1.0], [0, 4, -38], 60), K(14, [0, 1.68, -19], [0, 4.6, -38], 60)],
      update: () => { INTSKY.uCeil.value = -1; } },
    { name: 'candles', dur: 10, night: true, scene: 'hall',
      keys: [K(0, [0, 1.68, -19], [0, 4.6, -38], 60), K(10, [-2.2, 10.8, -21.5], [0, 7.2, -38], 62)],
      update: () => {} },
    { name: 'details', dur: 12, night: true, scene: 'hall',
      keys: [K(0, [2.4, 2.4, -8.6], [7.0, 6.0, -12.1], 50), K(4, [3.0, 2.0, -23.6], [7.2, 3.2, -30.5], 54), K(8, [2.4, 2.3, -33.0], [4.4, 2.2, -39.6], 50),
        K(12, [0.9, 1.75, -29.6], [0, 1.75, -33.85], 44)],
      update: () => {} },
    { name: 'ceiling', dur: 8, night: true, scene: 'hall', fadeOut: 0.9,
      keys: [K(0, [0.9, 1.8, -29.4], [0, 3.6, -34], 46), K(4, [0.4, 5.5, -24], [0, 13, -30], 60), K(8, [0.1, 9.5, -21.5], [0, 30, -25], 70)],
      update: () => { INTSKY.uCeil.value = -1; } },
    // after the feast: out of the Great Hall's doors and up the Grand Staircase, a flight swinging across the well
    { name: 'stair', dur: 15, night: true, scene: 'stair', fadeIn: 0.9, fadeOut: 2.0, cap: [1.5, 6.5, '晚宴之后 · 大楼梯'],
      keys: [K(0, [0, 1.7, -7.0], [3, 5, 5], 62), K(3.5, [2.5, 2.2, 1.0], [4, 9, 5], 62), K(6.5, [4.2, 3.2, 5.2], [-2, 22, -6], 64),
        K(10.5, [5, 22, 5], [-3, 42, -4], 68), K(15, [5, 42, 5], [0, 80, -2], 72)],
      update: (t) => { if (STAIR_SWING) STAIR_SWING.rotation.y = 0.42 * Math.sin((t / 15) * Math.PI * 1.6); } },
    { name: 'morning', dur: 88, night: false, fadeIn: 2.5, fadeOut: 3.5, cap: [2.5, 8, '第二天清晨'], title: [74, 86],
      keys: [K(0, [-100, 47, 34], [-90, 40, 27], 56), K(4, [-118, 72, 80], [-60, 30, 20], 54), K(10, [-60, 110, 230], [0, 20, 20], 48),
        K(17, [140, 95, 170], [120, 10, 0], 50), K(23, [330, 82, 30], [240, 5, -80], 50), K(28, [350, 42, -188], [279, 6, -226], 46),
        K(34, [150, 72, -300], [0, 10, -150], 52), K(40, [-150, 78, -262], [-300, 45, -140], 50), K(44, [-300, 84, -170], [-330, 20, -60], 52),
        K(47.5, [-330, 62, -96], [-372, 4, -30], 50), K(51.5, [-385, 46, -14], [-440, -10, 58], 50), K(55, [-472, 56, 128], [-600, -20, 160], 52), K(61, [-560, 50, 282], [-600, -30, 170], 50),
        K(68, [-300, 42, 520], [-20, 20, 20], 40), K(75, [-60, 30, 520], [0, 20, 15], 32), K(88, [-40, 70, 600], [0, 25, 10], 30)],
      update: () => { INTSKY.uCeil.value = -1; } },
  ];
  let t = 0;
  for (const s of S) { s.t0 = t; t += s.dur; }
  TOUR.dur = t;
  return S;
}
function tourFind(t) {
  const S = TOUR.shots;
  for (let i = 0; i < S.length; i++) if (t < S[i].t0 + S[i].dur) return i;
  return S.length - 1;
}
// switch the world to shot i (scene, night or day, who is visible)
function tourEnter(i) {
  const s = TOUR.shots[i];
  TOUR.cur = i;
  if ((s.scene ?? null) !== ACTIVE) switchScene(s.scene ?? null);
  if (NIGHT !== s.night) setNight(s.night);
  setMorningLook(s.name === 'morning' || !!s.morning);
  const night = s.night && !s.scene, fleet = !s.scene && (s.fleet ?? s.night);
  for (const M_ of [...TOURX.fleetBody, ...TOURX.fleetLamps]) M_.visible = fleet;
  MIRROR.uBoatN.value = 0;
  for (const m of JETTY_BOATS) m.visible = !night;
  if (!night) { lanternAt(null); trainAt(null); }
  if (s.name !== 'arrive' && s.name !== 'lamp') steamOff();
  GRADE.uBloom.value = s.bloom ?? (NIGHT ? 0.09 : 0.05);
  if (s.levels !== undefined) { pipeline.levels = s.levels; if (!s.levels) pipeline.lutMat.uniforms.uOn.value = 0; }   // 0: a fixed exposure
  if (s.exp) GRADE.uExposure.value = s.exp;
  if (s.enter) s.enter();
  pipeline.lutValid = false;
}
// everything at tour time t (t inside the current shot)
function tourApply(t) {
  const s = TOUR.shots[TOUR.cur], lt = clamp(t - s.t0, 0, s.dur);
  const R = s.rig ? s.rig(lt) : null;   // rig: a camera worked out per moment (89c-snitch.js), with roll and shake
  const p = R ? R.p : trackAt(s.keys, lt, 'p'), q = R ? R.q : trackAt(s.keys, lt, 'q'), f = R ? R.f : trackAt(s.keys, lt, 'f');
  camera.fov = f; camera.position.set(...p); camera.up.set(...(R && R.up ? R.up : [0, 1, 0])); camera.lookAt(...q);
  if (R && R.roll) camera.rotateZ(R.roll);
  if (R && R.shake) { camera.rotateX(R.shake[0]); camera.rotateY(R.shake[1]); }
  camera.updateProjectionMatrix();
  setTime(t); SPK.uT.value = t;
  s.update(lt);
  if (R && s.after) s.after(R, t);
  const fin = s.fadeIn ? clamp(lt / s.fadeIn, 0, 1) : 1, fout = s.fadeOut ? clamp((s.dur - lt) / s.fadeOut, 0, 1) : 1;
  FADE.amt.value = Math.min(easeIO(fin), easeIO(fout), R && R.fade !== undefined ? R.fade : 1);   // a rig may fade on its own cue
  const col = fin < fout ? (s.fadeInCol || [0, 0, 0]) : (s.fadeCol || [0, 0, 0]);
  FADE.col.value.set(...col);
  return { lt, q };
}
// the caption for time t: { text, a } or a title card { title, a }
function tourCaption(t) {
  const s = TOUR.shots[TOUR.cur], lt = t - s.t0;
  if (s.title && lt > s.title[0] && lt < s.title[1]) return { title: s.titleCard || TITLE_CARD, a: Math.min(easeIO((lt - s.title[0]) / 1.5), easeIO((s.title[1] - lt) / 1.5)) };
  if (s.sub && lt > s.sub[0] && lt < s.sub[1]) return { sub: s.sub[2], a: Math.min(easeIO((lt - s.sub[0]) / 1.2), easeIO((s.sub[1] - lt) / 1.0)) };
  if (s.cap && lt > s.cap[0] && lt < s.cap[1]) return { text: s.cap[2], a: Math.min(easeIO((lt - s.cap[0]) / 0.8), easeIO((s.cap[1] - lt) / 0.8)) };
  return null;
}
// the title card at the end of a film: the name in the Latin face, the Chinese under it, and (a shot's own card) a credit
const TITLE_CARD = { en: 'Hogwarts', zh: '霍格沃茨 · 城堡与场地' };
function drawCaption(g, w, h, c) { // the same caption drawn into a video frame (the page uses #tourcap)
  if (!c || c.a <= 0.01) return;
  g.save(); g.globalAlpha = c.a;
  g.shadowColor = 'rgba(0,0,0,0.65)'; g.shadowBlur = h * 0.012;
  if (c.title) {
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#e9cf98';
    g.font = `${Math.round(h * 0.1)}px "IM Fell English SC", "Times New Roman", serif`;
    g.fillText(c.title.en, w / 2, h * 0.42);
    g.fillStyle = '#efe8da'; g.font = `500 ${Math.round(h * 0.034)}px "Noto Serif SC", serif`;
    g.fillText(c.title.zh, w / 2, h * 0.53);
    if (c.title.by) {   // the credit, small and quieter, under a short gold rule
      g.fillStyle = '#d9a95b'; g.fillRect(w / 2 - h * 0.03, h * 0.635, h * 0.06, Math.max(1, h * 0.0018));
      g.fillStyle = 'rgba(239, 232, 218, 0.78)'; g.font = `500 ${Math.round(h * 0.022)}px "Noto Serif SC", serif`;
      g.fillText(c.title.by, w / 2, h * 0.68);
    }
    if (c.title.src) {   // where the replica was drawn from, smaller still
      g.fillStyle = 'rgba(239, 232, 218, 0.58)'; g.font = `500 ${Math.round(h * 0.018)}px "Noto Serif SC", serif`;
      g.fillText(c.title.src, w / 2, h * 0.73);
    }
  } else if (c.sub) { // under a title written in sparks (the magic short)
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#f3e6c8';
    g.font = `500 ${Math.round(h * 0.05)}px "Noto Serif SC", serif`;
    const sp = h * 0.024, txt = [...c.sub], tw = txt.reduce((a, ch) => a + g.measureText(ch).width, 0) + sp * (txt.length - 1);
    let x = w / 2 - tw / 2;
    for (const ch of txt) { const cw = g.measureText(ch).width; g.fillText(ch, x + cw / 2, h * 0.75); x += cw + sp; }
  } else {
    const fs = Math.round(h * 0.034), x = w * 0.06, y = h * 0.86;
    g.fillStyle = '#d9a95b'; g.fillRect(x, y - fs * 1.05, fs * 1.6, Math.max(1, h * 0.002));
    g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = '#efe8da';
    g.font = `500 ${fs}px "Noto Serif SC", serif`;
    g.fillText(c.text, x, y);
  }
  g.restore();
}
function tourInit() {
  buildTourProps();
  if (TOUR.cut !== 'gryff') { ensureInterior('stair'); ensureInterior('hall'); }
  if (!TOUR.shots) TOUR.shots = TOUR.cut === 'magic' ? shortShots() : TOUR.cut === 'dusk' ? duskShots() : TOUR.cut === 'snitch' ? snitchShots() : TOUR.cut === 'gryff' ? gryffWalkShots() : tourShots();
}
function tourStop() {
  TOUR.playing = false; TOUR.cur = -1;
  trainAt(null); lanternAt(null);
  if (TOURX.fleet) for (const M_ of [...TOURX.fleetBody, ...TOURX.fleetLamps]) M_.visible = false;
  MIRROR.uBoatN.value = 0;
  for (const m of JETTY_BOATS) m.visible = true;
  if (STAIR_SWING) STAIR_SWING.rotation.y = 0;
  INTSKY.uCeil.value = -1; FADE.amt.value = 1;
  setMorningLook(false);
  if (TOUR.cut === 'magic') shortStop();
  if (TOUR.cut === 'dusk') duskStop();
  if (TOUR.cut === 'snitch') snitchStop();
  if (TOUR.cut === 'gryff') gryffWalkStop();
  pipeline.lutBlend = 1;
}
// one frame of a named shot at its own time lt, levels measured afresh (tools/probe.mjs)
function tourStill(name, lt, spp = 4) {
  const k = TOUR.shots.findIndex((s) => s.name === name);
  TOUR.cur = -1;
  return tourFrame(Math.round((TOUR.shots[k].t0 + lt) * TOUR_FPS), spp);
}
// ---- frame-by-frame rendering for tools/film.mjs: spp samples spread over half the frame time (a 180° shutter)
async function tourFrame(i, spp, smooth = true) {
  const t = i / TOUR_FPS, k = tourFind(t);
  const fresh = k !== TOUR.cur;
  if (fresh) tourEnter(k);
  const s = TOUR.shots[k], half = 0.25 / TOUR_FPS;
  SPK.uShut.value = (2 * half) / spp;   // each sample's sparks streak over its share of the shutter
  if (fresh && s.lockAt !== undefined) { // levels measured once at lockAt and held for the whole shot (a light coming on stays a change)
    pipeline.levels = s.lockLevels ?? pipeline.levels; pipeline.begin();
    tourApply(s.t0 + s.lockAt); for (let j = 0; j < 2; j++) renderSample(j);
    pipeline.lutBlend = 1; pipeline.resolve(i, true); pipeline.levels = 0;
  }
  pipeline.begin();
  for (let j = 0; j < spp; j++) {
    const tt = clamp(t + ((j + 0.5) / spp - 0.5) * 2 * half, s.t0, s.t0 + s.dur - 1e-4);
    tourApply(tt);
    renderSample(j);
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0); gl.flush();
    for (let q = 0; q < 20000 && gl.clientWaitSync(sync, 0, 0) === gl.TIMEOUT_EXPIRED; q++) await new Promise((r) => setTimeout(r, 2));
    gl.deleteSync(sync);
  }
  tourApply(t);
  pipeline.lutBlend = fresh || !smooth ? 1 : (s.lutBlend ?? 0.12);
  pipeline.resolve(i, true);
  const out = document.createElement('canvas'); out.width = canvas.width; out.height = canvas.height;
  const g = out.getContext('2d'); g.drawImage(canvas, 0, 0);
  drawCaption(g, out.width, out.height, tourCaption(t));
  if (TOUR.cut === 'snitch') snLabels(g, out.width, out.height, t);   // the names of the places (89c-snitch.js)
  return out.toDataURL('image/jpeg', 0.94);
}
