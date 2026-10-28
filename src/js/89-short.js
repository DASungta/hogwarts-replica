// ------------------------------------------------------------------ the magic short (docs/魔法短片.md): one light wakes the castle
// Under a minute, at night. A light kindles over the dark loch, races across the water and up the cliff, strikes the
// spire of the Grand Staircase Tower, and the castle lights up in a wave; inside, it spirals down the stairwell lighting
// the lanterns floor by floor, sweeps down the Great Hall lighting the floating candles and parts the clouds of the
// enchanted ceiling; then fireworks in the house colours over the towers, and the falling sparks write the name over
// the loch. Played by the tour player (88-tour.js) with ?cut=magic. Times: T is film seconds, lt a shot's own.
const SHORT = { built: false, meshes: [] };
const SH_T = { lumos: 0, chase: 6, wake: 13, stair: 22, hall: 30, fire: 41, title: 51, end: 59 };
const APEX = [-54, 101.5, 13];   // the Grand Staircase Tower's spire
const SH_HIT = 17.8;             // the light strikes it
const easeO = (x) => 1 - (1 - clamp(x, 0, 1)) ** 3;

// ---- the light's paths: [T, position]
const ORB_P0 = [-14, LAKE_Y + 2.2, 412];   // where it kindles, over the water a long way out from the castle
const ORB_GROUNDS = [[4.8, ORB_P0], [6.0, [-14.5, LAKE_Y + 2.2, 398]], [8.0, [-16, LAKE_Y + 3.0, 350]], [10.5, [-19, LAKE_Y + 3.6, 270]],
  [13.0, [-25, LAKE_Y + 4.5, 175]], [14.2, [-32, -52, 112]], [14.8, [-38, -36, 92]], [15.25, [-42, -14, 80]], [15.65, [-46, 8, 68]],
  [16.05, [-40, 36, 50]], [16.5, [-30, 62, 16]], [16.95, [-52, 82, -8]], [17.35, [-72, 98, 8]], [17.6, [-62, 110, 24]], [SH_HIT, APEX]];
const ORB_RISE = [[41.0, [-118, 40, 32]], [41.7, [-110, 110, 26]], [42.45, [-100, 180, 15]]];   // out of the hall roof into the sky
function orbGrounds(T) {
  if (T < 4.8) return [ORB_P0[0] + 0.05 * Math.sin(T * 1.3), ORB_P0[1] + 0.06 * Math.sin(T * 1.9), ORB_P0[2]];
  return T < 30 ? pathAt(ORB_GROUNDS, T) : pathAt(ORB_RISE, T);
}
// down the stairwell (the stair set's own coordinates): a helix in the well, then out to the Great Hall doors
const ORB_STAIR = (() => {
  const k = [];
  for (let lt = 0; lt <= 6.21; lt += 0.3) {
    const u = lt / 6.2, y = 52 - 49 * (u * (1.15 - 0.15 * u)), a = 0.6 + 1.6 * Math.PI * 2 * u;
    k.push([SH_T.stair + lt, [3.5 * Math.cos(a), y, 3.5 * Math.sin(a)]]);
  }
  k.push([SH_T.stair + 6.8, [1.2, 2.9, -6]], [SH_T.stair + 7.4, [0, 2.7, -11.4]]);
  return k;
})();
// down the Great Hall (the hall set: doors at z = 0, the dais at z = -40), through the candles, then up into the sky
const ORB_HALL = [[30.0, [0, 3.0, 1.2]], [30.6, [0, 4.6, -3.5]], [33.2, [0.3, 7.0, -22]], [34.8, [-0.4, 7.4, -35]], [35.4, [0, 12, -38]],
  [36.0, [0, 20, -31]], [36.4, [0, 26, -26.5]]];
const orbStair = (T) => pathAt(ORB_STAIR, T), orbHall = (T) => pathAt(ORB_HALL, T);
const velOf = (f, T) => { const a = f(T - 0.02), b = f(T + 0.02); return [(b[0] - a[0]) / 0.04, (b[1] - a[1]) / 0.04, (b[2] - a[2]) / 0.04]; };

// how far the spell has spread in the Great Hall (along -z from the doors) and down the stairwell (from the top)
const hallFront = (T) => (T < 34.8 ? 1.0 - orbHall(T)[2] : 36 + (T - 34.8) * 8);
const stairFront = (T) => (T < SH_T.stair + 6.2 ? 92 - orbStair(T)[1] + 2 : 91 + (T - SH_T.stair - 6.2) * 60);
const groundsFront = (T) => { const a = T - SH_HIT; return a < 0 ? -30 : 75 * a + 28 * a * a; };
function spellSet(c, r, o = {}) {
  const d = o.dir || [0, 0, 0], b = o.band || [0, 0, 0];
  SPELLU.uSpellC.value.set(c[0], c[1], c[2], r); SPELLU.uSpellD.value.set(d[0], d[1], d[2], o.w ?? 8);
  SPELLU.uSpellB.value.set(b[0], b[1], b[2], o.reach ?? 0); SPELLU.uSpellJ.value = o.jit ?? 0;
}
// the first time T in [a, b] at which f(T) >= v (f rising)
function whenReaches(f, v, a, b) { if (f(b) < v) return null; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (f(m) < v) a = m; else b = m; } return b; }

// ---- the sparks, filled once
const GOLD = [1.0, 0.72, 0.36], LOCH_GOLD = [1.0, 0.5, 0.2];
function shedTrail(S, path, t0, t1, o) { // the light's comet tail: a dense stream of short-lived sparks, and longer-lived glitter
  const R = S.R, size = o.size ?? ((T) => 0.015);
  for (let T = t0; T < t1; T += 1 / (o.rate ?? 320)) {
    const t = T + R() / (o.rate ?? 320), p = vadd(path(t), sphereDir(R), 0.12 * R()), v = velOf(path, t), sz = size(t);
    if (R() > 0.12 + Math.hypot(...v) / 12) continue;   // thin while it hangs still, so the sparks do not pile up round it
    S.add(p, t, vadd(vadd(vscale(v, 0.06), sphereDir(R), 0.5 + R()), [0, 0.3, 0]), 0.45 + R() * 0.8, vscale(GOLD, 6), sz, { drag: 2.2, grav: 0.4, tail: 0.05, heat: 0.7, wob: 0.15 });
    if (R() < (o.glitter ?? 0.3)) S.add(p, t, vadd(vscale(v, 0.03), sphereDir(R), 0.4 + R() * 0.8), 1.8 + R() * 1.8, vscale([1.0, 0.86, 0.62], 4.5), sz * 0.75, { drag: 1.4, grav: 0.55, tail: 0.02, tw: 0.85, wob: 0.6 });
  }
}
function burst(S, p, t, n, o = {}) { // a ball of sparks thrown out from p
  const R = S.R;
  for (let i = 0; i < n; i++) {
    const d = sphereDir(R), sp = (o.speed ?? 10) * (0.35 + 0.65 * Math.cbrt(R()));
    S.add(vadd(p, d, o.r0 ?? 0), t, vadd(vscale(d, sp), o.push || [0, 0, 0]), (o.life ?? 2.5) * (0.6 + 0.6 * R()), vscale(o.col || GOLD, o.gain ?? 6), o.size ?? 0.04,
      { drag: o.drag ?? 1.2, grav: o.grav ?? 1.5, tail: o.tail ?? 0.08, heat: 0.8, tw: o.tw ?? 0.4, wob: o.wob ?? 0.2 });
  }
  S.add(p, t, [0, 0, 0], o.flashLife ?? 0.22, vscale([1.0, 0.93, 0.8], o.flash ?? 30), o.flashSize ?? 0.6, { drag: 0 });
}
function dust(S, n, box, t0, t1, size) { // motes hanging in the air, seen only where the light passes
  const R = S.R;
  for (let i = 0; i < n; i++) {
    const p = [lerp(box[0], box[3], R()), lerp(box[1], box[4], R()), lerp(box[2], box[5], R())];
    S.add(p, t0, vscale(sphereDir(R), 0.05), t1 - t0, vscale([1.0, 0.86, 0.62], 2.2), size, { drag: 0.5, wob: 0.5, tw: 0.6, kind: 2 });
  }
}
function buildShort() {
  if (SHORT.built) return;
  SHORT.built = true;
  const E = new Sparks('grounds'), Hs = new Sparks('hall'), St = new Sparks('stair'), R = E.R;
  // 1. kindling: motes drawn in from the dark to the point where it lights
  for (let i = 0; i < 260; i++) {
    const d = sphereDir(R), t = 1.0 + R() * 1.1, arr = t + 0.6 + R() * 0.5, from = vadd(ORB_P0, d, 1.2 + R() * 2.8);
    E.add(from, t, vscale(d, 0.3), arr - t, vscale([1.0, 0.82, 0.55], 3.5), 0.012, { kind: 1, to: ORB_P0, arrive: arr, wob: 0.5, drag: 1, tw: 0.5 });
  }
  burst(E, ORB_P0, 2.55, 120, { speed: 2.2, life: 1.2, size: 0.01, drag: 2.5, grav: 0.3, flash: 12, flashSize: 0.06, flashLife: 0.2 });
  // 2-3. the comet over the water and up the cliff (sparks grow with the distance they are seen from)
  shedTrail(E, orbGrounds, 2.6, SH_HIT, { size: (T) => (T < 12.5 ? 0.015 : 0.5), glitter: 0.3 });
  // the strike: a burst of gold over the roofs, and a ring running out with the front of the spell
  // the strike: a quick spray of gold that dies at once, and glitter raining down over the roofs
  burst(E, APEX, SH_HIT, 700, { speed: 70, life: 0.6, size: 0.5, drag: 2.6, grav: 2, tail: 0.25, tw: 0.2, gain: 9, flash: 120, flashSize: 0.9, flashLife: 0.2 });
  burst(E, APEX, SH_HIT + 0.05, 700, { speed: 34, life: 3.2, size: 0.35, drag: 0.7, grav: 10, tail: 0.08, tw: 0.9, gain: 4, wob: 2, flash: 0 });
  // 6. fireworks: the light bursts high over the Great Hall, then the four houses, a crackling volley and a gold willow
  shedTrail(E, orbGrounds, 41.0, 42.45, { size: () => 0.5, rate: 260, glitter: 0.25 });
  fireShell(E, { from: [-100, 179, 15], at: [-100, 180, 15], t: 42.45 - 0.01, rise: 0.01, kind: 'crackle', n: 900, speed: 58, size: 1.6, gain: 1.3 });
  fireShell(E, { from: [-30, 42, 0], at: [-62, 162, -15], t: 42.6, rise: 1.1, col: [1.0, 0.1, 0.04], col2: [1.0, 0.72, 0.3] });          // Gryffindor
  fireShell(E, { from: [45, 50, -20], at: [56, 176, -36], t: 43.3, rise: 1.2, col: [0.1, 1.0, 0.3], col2: [0.85, 0.9, 1.0] });            // Slytherin
  fireShell(E, { from: [-80, 40, 10], at: [-150, 150, -22], t: 44.0, rise: 1.2, col: [0.12, 0.3, 1.0], col2: [1.0, 0.55, 0.25] });        // Ravenclaw
  fireShell(E, { from: [70, 40, 0], at: [128, 152, -30], t: 44.7, rise: 1.2, col: [1.0, 0.78, 0.08], col2: [1.0, 0.95, 0.85] });          // Hufflepuff
  [[-150, 132], [-60, 148], [30, 138], [112, 128]].forEach(([x, y], i) =>
    fireShell(E, { from: [x * 0.6, 45, -10], at: [x, y, -20 - 10 * i], t: 46.2 + 0.3 * i, rise: 1.0, kind: 'crackle', n: 380, speed: 40, gain: 0.8 }));
  fireShell(E, { from: [-20, 50, -10], at: [-25, 215, -25], t: 48.0, rise: 1.4, kind: 'willow', n: 700, speed: 44, size: 1.8, gain: 1.2 });
  fireShell(E, { from: [10, 50, -10], at: [20, 196, -40], t: 48.4, rise: 1.3, kind: 'willow', n: 450, speed: 36, gain: 0.9 });
  fireShell(E, { from: [40, 40, -60], at: [150, 120, -160], t: 52.4, rise: 1.1, col: [1.0, 0.2, 0.08], n: 300, speed: 34, gain: 0.5 });   // far off, behind the title
  fireShell(E, { from: [-60, 40, -60], at: [-170, 130, -170], t: 54.0, rise: 1.1, kind: 'crackle', n: 260, speed: 30, gain: 0.45 });
  // 7. the name written in sparks over the loch, gathered from glitter falling out of the dark; written left to right
  {
    const C = [-15, LAKE_Y + 8.5, 330], em = 8, pts = textPoints('Hogwarts', '"IM Fell English SC", "Times New Roman", serif', 200, 3);
    const xs = pts.map((p) => p[0]), x0 = Math.min(...xs), x1 = Math.max(...xs);
    for (const [u, v] of pts) {
      const to = [C[0] + u * em, C[1] + v * em, C[2]], t = 51.0 + R() * 0.9, arr = 52.3 + 2.6 * (u - x0) / (x1 - x0) + R() * 0.35;
      const from = [C[0] + (R() - 0.5) * 60, C[1] + 10 + R() * 26, C[2] + (R() - 0.5) * 20];
      E.add(from, t, [0, -1.5, 0], SH_T.end + 0.5 - t, vscale([1.0, 0.76, 0.4], 5.5), 0.075, { kind: 1, to, arrive: arr, wob: 2 + R() * 3, drag: 1.2, grav: 0.5, tw: 0.35, tail: 0.02 });
    }
    for (let i = 0; i < 700; i++) { // glitter drifting up round the letters
      const p = [C[0] + (R() - 0.5) * 60, C[1] - 5 + R() * 14, C[2] + (R() - 0.5) * 8], t = 53 + R() * 5;
      E.add(p, t, [0, 0.4 + R() * 0.6, 0], 2.5 + R() * 2, vscale([1.0, 0.86, 0.62], 4), 0.06, { drag: 0.5, wob: 1.2, tw: 1 });
    }
  }
  // 4. the stairwell: the light's tail, dust in the well, a flash at the Great Hall doors
  shedTrail(St, orbStair, SH_T.stair, SH_T.stair + 7.4, { size: () => 0.06, rate: 300, glitter: 0.4 });
  dust(St, 3500, [-7, 0.5, -7, 7, 88, 7], SH_T.stair, SH_T.hall, 0.012);
  burst(St, [0, 2.7, -11.4], SH_T.stair + 7.4, 500, { speed: 7, push: [0, 1, 3], life: 1.6, size: 0.025, flash: 60, flashSize: 0.25 });
  // 5. the Great Hall: the tail, dust, each candle catching with a small spit of sparks, a burst where it leaves
  shedTrail(Hs, orbHall, SH_T.hall, 36.4, { size: () => 0.03, rate: 300, glitter: 0.4 });
  dust(Hs, 3000, [-7, 1, -40, 7, 14, -1], SH_T.hall, SH_T.fire, 0.012);
  for (const [x, y, z] of HALL_FLAMES) {
    const t = whenReaches(hallFront, -z + (spellHash(x, y, z) - 0.5) * 2.5, SH_T.hall, SH_T.fire);
    if (t === null) continue;
    Hs.add([x, y, z], t, [0, 0, 0], 0.18, vscale([1.0, 0.85, 0.6], 9), 0.05, { drag: 0 });
    for (let k = 0; k < 3; k++) Hs.add([x, y, z], t, vadd(sphereDir(R), [0, 0.8, 0], 0.6 + R()), 0.3 + R() * 0.5, vscale(GOLD, 5), 0.01, { drag: 2.5, grav: 1.5, tail: 0.03, heat: 0.8 });
  }
  burst(Hs, [0, 26, -26.5], 36.4, 700, { speed: 9, life: 2.2, size: 0.05, grav: 0.8, flash: 60, flashSize: 0.5 });
  for (const [S_, sc] of [[E, scene], [Hs, INT.hall.scene], [St, INT.stair.scene]]) {
    const m = S_.mesh(), o = orbMesh(); sc.add(m, o); SHORT.meshes.push(m, o);
  }
  SHORT.shell = shellMesh(); SHORT.shell.position.set(...APEX); SHORT.shell.visible = false; scene.add(SHORT.shell);
  orbLamps(); fireLamps();
  if (HEADLESS) console.log('[short] sparks', E.n, Hs.n, St.n);
}

function shortShots() {
  buildShort();
  const W0 = LAKE_Y, dark = () => spellSet(APEX, -30);
  // the sets' fill lights come up only once the front is well past them (else they would light the room ahead of it)
  const pts = (I, lag) => { for (const p of INT[I].points) { SPELLU.uSpellC.value.w -= lag; const [on] = spellAt(p.position.x, p.position.y, p.position.z); SPELLU.uSpellC.value.w += lag; p.intensity = p.userData.n * on; } };
  // the chase: behind the light, falling back as it gathers speed, the view lifting toward the castle
  const chaseKeys = [0, 2, 4, 5.5, 7].map((lt) => { const o = orbGrounds(SH_T.chase + lt);
    return K(lt, vadd(o, [2.4 - 0.8 * lt, 1.4 + 0.25 * lt, 7 + 2.3 * lt]), vadd(o, [0, 1.2 + 0.75 * lt, -40]), 46); });
  const S = [
    { name: 'lumos', dur: 6, night: true, fleet: false, fadeIn: 1.5, bloom: 0.14,
      keys: [K(0, [-13.2, W0 + 2.3, 419.6], [-13.6, W0 + 14.6, 319.6], 46), K(6, [-13.3, W0 + 2.35, 418.3], [-14.0, W0 + 14.8, 318.3], 45)],
      update: () => { const T = SPK.uT.value; dark();
        orbSet(orbGrounds(T), smooth(2.35, 2.7, T) * (1 + 0.7 * Math.exp(-Math.max(T - 2.6, 0) / 0.35)) * (1 + 0.08 * Math.sin(T * 9)), 22, null, LOCH_GOLD); } },
    { name: 'chase', dur: 7, night: true, fleet: false, bloom: 0.14, keys: chaseKeys,
      update: () => { const T = SPK.uT.value; dark(); orbSet(orbGrounds(T), 1, 30, null, LOCH_GOLD); } },
    // the strike, from out on the loch: the light climbs the cliff, circles the tower, and the castle wakes
    { name: 'wake', dur: 9, night: true, fleet: false, bloom: 0.13, fadeOut: 0.5, lockAt: 3.0,
      keys: [K(0, [-12, -42, 335], [-22, 18, 20], 40), K(9, [-16, -38, 316], [-24, 22, 18], 38)],
      update: () => { const T = SPK.uT.value;
        const r = groundsFront(T); spellSet(APEX, r, { w: 12, band: vscale(GOLD, 3.0), reach: 380, jit: 6 });
        SHORT.shell.visible = r > 0; SHELLU.uR.value = Math.max(r, 0.1); SHELLU.uA.value = smooth(0, 15, r) * (1 - smooth(120, 420, r));
        orbSet(orbGrounds(T), T < SH_HIT ? 1 : 0, 220, null, LOCH_GOLD); } },
    // inside the tower: it spirals down the stairwell, the lanterns catching floor by floor, a flight swinging across
    { name: 'stairwell', dur: 8, night: true, fleet: false, scene: 'stair', bloom: 0.13, lockAt: 7.0, fadeIn: 0.5, fadeOut: 0.25, fadeCol: [1.0, 0.9, 0.7],
      keys: [K(0, [6.2, 21.7, 6.4], [-1, 55, -2], 74), K(3.2, [6.0, 12.5, 6.4], [-1, 36, -3], 72), K(5.6, [4.2, 3.0, 6.0], [-0.5, 14, -3], 70),
        K(8, [2.2, 1.9, 5.6], [0, 3.2, -12], 62)],
      update: (lt) => { const T = SPK.uT.value;
        spellSet([0, 92, 0], stairFront(T), { dir: [0, -1, 0], w: 4, band: vscale(GOLD, 0.6), jit: 3 }); pts('stair', 8);
        if (STAIR_SWING) STAIR_SWING.rotation.y = 0.42 * easeIO((lt - 0.4) / 2.2);
        orbSet(orbStair(T), lt < 7.4 ? 1 : 0, 120, 'stair'); } },
    // the Great Hall: dark, under cloud; the candles catch behind it down the hall, and the clouds part where it goes up
    { name: 'hall', dur: 11, night: true, fleet: false, scene: 'hall', bloom: 0.12, lockAt: 5.0, fadeIn: 0.35, fadeInCol: [1.0, 0.9, 0.7],
      keys: [K(0, [0, 1.9, -1.2], [0, 5.5, -38], 58), K(5.5, [0, 2.3, -9], [0, 6.5, -38], 58), K(7.5, [0, 2.6, -11], [0, 14, -30], 62),
        K(11, [0, 2.8, -13], [0, 30, -22], 66)],
      update: (lt) => { const T = SPK.uT.value;
        spellSet([0, 0, 0], hallFront(T), { dir: [0, 0, -1], w: 2, band: vscale(GOLD, 0.5), jit: 2.5 }); pts('hall', 10);
        INTSKY.uClear.value.set(0, 0.85, -0.53, -0.3 + 2.6 * easeIO((lt - 6.3) / 4.4));
        orbSet(orbHall(T), lt < 6.4 ? 1 : 0, 80, 'hall'); } },
    // fireworks over the castle, from out on the loch
    { name: 'fireworks', dur: 10, night: true, fleet: false, bloom: 0.15, fadeOut: 0.5, lutBlend: 0.04,
      keys: [K(0, [60, -50, 305], [-25, 55, 0], 50), K(10, [50, -46, 288], [-25, 62, 0], 49)],
      update: () => { const T = SPK.uT.value; spellSet(APEX, 1e7); orbSet(orbGrounds(T), T < 42.45 ? 1 : 0, 300); } },
    { name: 'title', dur: 8, night: true, fleet: false, bloom: 0.15, fadeIn: 0.5, fadeOut: 1.8, lutBlend: 0.04, sub: [4.2, 7.9, '霍格沃茨'],
      keys: [K(0, [-14, W0 + 2.2, 401], [-15.5, W0 + 16, 301], 44), K(8, [-14, W0 + 2.5, 395], [-15.5, W0 + 16.4, 295], 43)],
      update: () => { spellSet(APEX, 1e7); orbSet([0, 0, 0], 0, 0); } },
  ];
  for (const s of S) if (s.name !== 'wake') s.enter = () => { SHORT.shell.visible = false; };
  let t = 0;
  for (const s of S) { s.t0 = t; t += s.dur; }
  TOUR.dur = t;
  return S;
}
function shortStop() {
  spellSet([0, 0, 0], 1e7); orbSet([0, 0, 0], 0, 0);
  if (SHORT.shell) SHORT.shell.visible = false;
  INTSKY.uClear.value.set(0, 1, 0, 10);
  for (const k of Object.keys(INT)) setInteriorLight(k, NIGHT);
}
