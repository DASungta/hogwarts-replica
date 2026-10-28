// ------------------------------------------------------------------ the dusk short (docs/黄昏短片.md): the castle close up as evening falls
// Under a minute. The model itself is the subject: slow moves close along its stonework, from golden hour through
// sunset to the blue hour, with only the castle's own magic: the boats crossing the loch by themselves, the windows
// lighting themselves as the sun goes, the moving staircase, the floating candles and the enchanted ceiling, the owls.
// Played by the tour player (88-tour.js) with ?cut=dusk.

// ---- the light: k = 0 golden hour (sun 7° up in the west-south-west, raking the lake front), 0.5 sunset, 1 blue hour
const DUSK = { k: -1 };
const duskL3 = (a, b, c, k) => (k < 0.5 ? a.map((v, i) => lerp(v, b[i], k * 2)) : b.map((v, i) => lerp(v, c[i], (k - 0.5) * 2)));
const duskS3 = (a, b, c, k) => duskL3([a], [b], [c], k)[0];
function setDusk(k) {
  DUSK.k = k;
  const el = duskS3(7, 1.2, -4.5, k) * D2R, az = new THREE.Vector3(-0.86, 0, 0.5).normalize();
  setSunDir(new THREE.Vector3(az.x * Math.cos(el), Math.sin(el), az.z * Math.cos(el)));
  ATMO.uNight.value = 0; ATMO.uLamp.value = duskS3(0.1, 0.45, 1.0, k);
  ATMO.uSunCol.value.set(...duskL3([1.0, 0.68, 0.4], [1.0, 0.48, 0.24], [0.62, 0.26, 0.22], k));
  ATMO.uHaze.value.set(...duskL3([0.46, 0.43, 0.44], [0.27, 0.22, 0.24], [0.05, 0.065, 0.1], k));
  ATMO.uFogDen.value = 0.0002;
  SKY.uZen.value.set(...duskL3([0.08, 0.14, 0.31], [0.04, 0.075, 0.19], [0.011, 0.02, 0.06], k));
  SKY.uHor.value.set(...duskL3([0.58, 0.46, 0.38], [0.34, 0.28, 0.3], [0.065, 0.075, 0.12], k));
  SKY.uDuskA.value.set(...duskL3([0.7, 0.34, 0.12], [0.75, 0.3, 0.12], [0.22, 0.08, 0.05], k));
  SKY.uDuskB.value.set(...duskL3([0.05, 0.03, 0.04], [0.13, 0.07, 0.09], [0.04, 0.03, 0.05], k));
  SKY.uCloudAmb.value = duskS3(1, 0.55, 0.12, k); SKY.uCover.value = 0.46;
  sunLight.color.setRGB(...duskL3([1.0, 0.64, 0.38], [1.0, 0.46, 0.22], [1.0, 0.4, 0.2], k));
  sunLight.intensity = 3.9 * (1 - smooth(0.36, 0.6, k));
  scene.environmentIntensity = duskS3(0.62, 0.42, 0.3, k); SUN_SOFT = 0.01;
  GRADE.uExposure.value = duskS3(0.95, 1.0, 1.35, k); GRADE.uSat.value = 1.05; GRADE.uFilm.value = 0.3;
  GRADE_SAVE.film = GRADE.uFilm.value; GRADE_SAVE.sat = GRADE.uSat.value;
  LEVEL_TARGET = duskL3([9, 24, 78, 184, 226], [6, 17, 58, 166, 222], [4, 12, 40, 128, 214], k);
  if (pipeline) pipeline.levels = 0.6;
  captureEnv();
}

// ---- owls round the Owlery: wheeling on wide circles, banking into the turn, beating and gliding. Three kinds: barn
// owls (golden buff above under a grey veil, white below and in the face), tawny owls (rufous brown, streaked, buff
// below) and snowy owls. Each wing is an arm and a hand hinged at the wrist, so the beat bends and the hand sweeps back
// on the upstroke; the feathers are drawn in the shader from the wing's uv (u along the span, v from the trailing edge
// to the leading edge), the trailing edge notched feather by feather; the undersides are pale.
const OWLS = { n: 14, parts: null, fly: [], dusk: null };
const OWL_KIND = [
  { up: [0.6, 0.33, 0.11], un: [0.86, 0.84, 0.79] },    // barn owl
  { up: [0.24, 0.12, 0.05], un: [0.45, 0.32, 0.19] },   // tawny owl
  { up: [0.86, 0.85, 0.81], un: [0.92, 0.92, 0.9] },    // snowy owl
];
const OWL_ARM = 0.22, OWL_HAND = 0.3;   // shoulder to wrist, wrist to tip (m): a span of 1.13 m at scale 1
function owlGeo() {
  // every vertex carries part = [pale (the face, the belly), dark (eyes 1, beak 0.5), flat (wing 1, tail 0.5: pale below)]
  const tag = (g, f) => {
    g = g.index ? g.toNonIndexed() : g;
    const P = g.attributes.position, N = g.attributes.normal, a = new Float32Array(P.count * 3);
    for (let i = 0; i < P.count; i++) a.set(f(P.getX(i), P.getY(i), P.getZ(i), N.getY(i)), i * 3);
    g.setAttribute('part', new THREE.BufferAttribute(a, 3));
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'part'].includes(k)) g.deleteAttribute(k);
    return g;
  };
  // a grid over u, v in [0, 1]: f(u, v) -> [x, y, z, U, V], its face up (+y)
  const sheet = (nu, nv, f) => {
    const pos = [], uv = [], idx = [];
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const q = f(i / nu, j / nv); pos.push(q[0], q[1], q[2]); uv.push(q[3], q[4]); }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    let ny = 0; const N = g.attributes.normal; for (let i = 0; i < N.count; i++) ny += N.getY(i);
    if (ny < 0) { for (let k = 0; k < idx.length; k += 3) [idx[k + 1], idx[k + 2]] = [idx[k + 2], idx[k + 1]]; g.setIndex(idx); g.computeVertexNormals(); }
    return g;
  };
  const mirror = (g) => { // the other side: mirrored in x, the winding turned so its face still points up
    g = g.clone().scale(-1, 1, 1); const ix = g.index.array;
    for (let k = 0; k < ix.length; k += 3) { const t = ix[k + 1]; ix[k + 1] = ix[k + 2]; ix[k + 2] = t; }
    g.index.needsUpdate = true; return g;
  };
  // along +z (the face forward), 0.4 m: a short barrel of a body and, set high on it with no neck, the big round head,
  // its face flattened into the facial disc
  const prof = [[0, 0], [0.03, 0.005], [0.055, 0.04], [0.08, 0.1], [0.09, 0.16], [0.085, 0.22], [0.07, 0.27], [0, 0.3]];
  const body = tag(new THREE.LatheGeometry(prof.map(([r, h]) => new THREE.Vector2(r, h)), 24).rotateX(Math.PI / 2).scale(1.1, 1, 1).translate(0, 0, -0.2),
    (x, y, z, ny) => [smooth(0.15, -0.6, ny), 0, 0]);   // the belly pale
  const hg = new THREE.SphereGeometry(0.088, 32, 20), hp = hg.attributes.position;
  for (let i = 0; i < hp.count; i++) { const k = 1 - 0.22 * smooth(0.3, 0.95, hp.getZ(i) / 0.088); hp.setXYZ(i, hp.getX(i) * k, hp.getY(i) * k, hp.getZ(i) * k); }   // the face dished in
  hg.computeVertexNormals();
  const head = tag(hg, (x, y, z) => { // the facial disc pale, a darker ruff round it
    const l = Math.hypot(x, y, z), f = (z + 0.12 * y) / l;
    return [smooth(0.45, 0.7, f), 0.22 * Math.exp(-(((f - 0.5) / 0.07) ** 2)), 0];
  }).scale(1.1, 0.95, 0.92).translate(0, 0.025, 0.11);
  const eyes = [-1, 1].map((s) => tag(new THREE.SphereGeometry(0.012, 10, 8).scale(1, 1, 0.5).translate(s * 0.0245, 0.038, 0.17), () => [0, 1, 0]));
  const beak = tag(new THREE.ConeGeometry(0.007, 0.022, 8).rotateX(Math.PI / 2 + 0.6).translate(0, 0.012, 0.172), () => [0.4, 0.5, 0]);
  const tail = tag(sheet(4, 3, (u, v) => { const w = 0.035 + 0.04 * (1 - v); return [lerp(-w, w, u), -0.012 - 0.01 * (1 - v), -0.16 - 0.14 * (1 - v), u, v]; }), () => [0, 0, 0.5]);
  // the wing (the left one, out along +x): a broad arm and a rounded hand, arched across the chord
  const zLa = (x) => 0.055 + 0.015 * (x / OWL_ARM), zTa = (x) => -0.16 - 0.015 * Math.sin((Math.PI * x) / 0.5);
  const zLh = (x) => 0.07 - 0.085 * (x / OWL_HAND) ** 2, zTh = (x) => -0.175 + 0.14 * (x / OWL_HAND) ** 1.6;
  const arm = sheet(6, 6, (u, v) => { const x = u * OWL_ARM; return [x, 0.014 * Math.sin(Math.PI * v), lerp(zTa(x), zLa(x), v), u * 0.42, v]; });
  const hand = sheet(10, 6, (u, v) => { const x = u * OWL_HAND; return [x, 0.012 * Math.sin(Math.PI * v) * (1 - 0.6 * u), lerp(zTh(x), zLh(x), v), 0.42 + 0.58 * u, v]; });
  const W = () => [0, 0, 1];
  return { body: mergeGeometries([body, head, ...eyes, beak, tail]), armL: tag(arm.clone(), W), armR: tag(mirror(arm), W), handL: tag(hand.clone(), W), handR: tag(mirror(hand), W) };
}
M.owl = procMat({ name: 'owl', rgb: [1, 1, 1], rough: 0.85, side: THREE.DoubleSide, uv: true, spell: false,
  vhead: 'attribute vec3 part; attribute vec4 owlU; varying vec3 vPart; varying vec4 vOwlU; varying vec3 vLoc;\n',
  vert: 'vPart = part; vOwlU = owlU; vLoc = position;\n',
  head: 'varying vec3 vPart; varying vec4 vOwlU; varying vec3 vLoc;\n', frag: /* glsl */ `
  float kind = vOwlU.a, barn = 1.0 - step(0.5, kind), tawny = step(0.5, kind) - step(1.5, kind), snowy = step(1.5, kind);
  float thin = step(0.25, vPart.z), wing = step(0.75, vPart.z);
  vec3 V = normalize(cameraPosition - P), up = diffuseColor.rgb, un = vOwlU.rgb, c;
  float below = thin * step(dot(N, V), 0.0);   // N: the geometric normal (the top side's)
  float n1 = cgVn(vLoc * 60.0), n2 = cgVn(vLoc * 170.0);
  if (thin > 0.5) {
    float u = UV.x, v = UV.y;
    float fu = fract(u * mix(6.0, 19.0, wing)), e = 2.0 * fu - 1.0;
    if (v < mix(0.035, 0.06, wing) * e * e) discard;   // each flight feather's tip rounded, a notch between
    float fl = clamp(smoothstep(0.62, 0.5, v) + 1.0 - wing, 0.0, 1.0);   // the flight feathers (the wing's rear half; all the tail)
    float ln = smoothstep(0.0, 0.1, fu) * smoothstep(1.0, 0.9, fu);
    float bar = smoothstep(0.3, 0.7, 0.5 + 0.5 * sin((v * mix(6.0, 9.0, wing) + 0.15 * n1) * 6.2832));
    float bs = below > 0.5 ? barn * 0.06 + tawny * 0.3 + snowy * 0.04 : barn * 0.28 + tawny * 0.45 + snowy * 0.12;
    c = mix(up, un, below);
    c *= mix(1.0, 0.55, bar * bs * fl) * mix(1.0, mix(0.8, 1.0, ln), fl);
    float cov = (1.0 - fl) * (1.0 - below);   // the coverts: small feathers, mottled
    c *= mix(1.0, 0.75 + 0.5 * n1, cov * 0.6);
    c = mix(c, vec3(0.42), cov * barn * 0.35 * smoothstep(0.45, 0.7, n1));   // the barn owl's grey veil and white specks
    c = mix(c, vec3(0.9), cov * barn * step(0.93, n2) * 0.8);
    c *= mix(1.0, 0.55, cov * tawny * smoothstep(0.62, 0.75, n2));   // the tawny's dark spots
    c *= mix(1.0, 0.8, (1.0 - below) * wing * smoothstep(0.75, 0.95, u) * (barn + tawny));   // darker wing tips
  } else {
    float pale = vPart.x, dark = vPart.y;
    c = mix(up, un, pale) * (0.85 + 0.3 * n1);
    c = mix(c, vec3(0.45, 0.43, 0.4), (1.0 - pale) * barn * 0.35 * smoothstep(0.45, 0.7, n1));
    c = mix(c, vec3(0.92), (1.0 - pale) * barn * step(0.92, n2) * 0.8);
    c *= mix(1.0, 0.5, tawny * smoothstep(0.55, 0.72, cgVn(vec3(vLoc.x * 90.0, vLoc.y * 90.0, vLoc.z * 14.0))));   // streaks
    c *= mix(1.0, 0.6, snowy * step(0.9, n2) * (1.0 - pale));   // a few dark flecks
    c *= 1.0 - 2.0 * min(dark, 0.25);   // the ruff round the face
    vec3 eye = mix(vec3(0.02), vec3(0.75, 0.55, 0.05), snowy);
    c = mix(c, mix(vec3(0.45, 0.42, 0.38), eye, step(0.8, dark)), step(0.3, dark));
  }
  diffuseColor.rgb = c;
  // the undersides of the wings and tail, facing the dark ground, lit by the light through the feathers and up from
  // below; and the sun shining through them when one is between it and the eye
  cgEmit = c * uSunCol * thin * (below * (0.12 + 0.45 * max(dot(N, uSunDir), 0.0))
    + 0.3 * step(dot(N, uSunDir) * dot(N, V), 0.0) * pow(max(dot(-V, uSunDir), 0.0), 2.0));
` });
// the flock: per owl { r, h, w (m/s, the sign the way round), a0, f (wing beats per second), p (its phases), ox, oz, kind,
// sc; optional e (the loop's squash), drift (the centre's wander, m), br (the radius's swell), bob (the height's, m) }
function owlFlock(fly) {
  OWLS.fly = fly;
  const U = OWLS.parts[0].geometry.attributes.owlU, col = new THREE.Color();
  fly.forEach((F, i) => { const K = OWL_KIND[F.kind]; for (const m of OWLS.parts) m.setColorAt(i, col.setRGB(...K.up)); U.setXYZW(i, ...K.un, F.kind); });
  U.needsUpdate = true;
  for (const m of OWLS.parts) { m.count = fly.length; m.instanceColor.needsUpdate = true; }
}
function buildOwls() {
  if (OWLS.parts) return;
  const G = owlGeo(), R = rng('owls'), [ox, oz] = SITE_BY.owlery.circle, U = new THREE.InstancedBufferAttribute(new Float32Array(OWLS.n * 4), 4);
  OWLS.parts = [G.body, G.armL, G.armR, G.handL, G.handR].map((g) => {
    g.setAttribute('owlU', U);
    const m = new THREE.InstancedMesh(g, M.owl, OWLS.n); m.frustumCulled = false; m.castShadow = true; m.visible = false; scene.add(m); return m;
  });
  const fly = [];
  for (let i = 0; i < OWLS.n; i++) {
    const kind = i === 0 ? 2 : R() < 0.5 ? 1 : 0;   // Hedwig; tawny and barn owls
    fly.push({ r: 10 + R() * 15, h: OWL_TOP + 3 + R() * 18, w: (R() < 0.3 ? -1 : 1) * (8.5 + R() * 2.5), a0: R() * 6.28, f: 2.6 + R() * 0.8, p: R() * 6.28, ox, oz, kind, sc: 1.15 });
  }
  OWLS.dusk = fly; owlFlock(fly);
}
const _owlM = new THREE.Matrix4(), _owlA = new THREE.Matrix4(), _owlH = new THREE.Matrix4(), _owlQ = new THREE.Quaternion(), _owlE = new THREE.Euler();
const _owlP = new THREE.Vector3(), _owlS = new THREE.Vector3();
// Where an owl is at time t: a loose loop round the tower, never a circle. Its centre drifts, the loop is squashed into an
// ellipse that slowly turns, the radius and the pace swell and ease, the height rises and falls on two slow rhythms of
// its own (p sets all the phases, so no two owls move alike).
function owlPos(F, t) {
  const q = F.p, d = F.drift ?? 3, cx = F.ox + d * Math.cos(0.13 * t + 1.7 * q), cz = F.oz + d * Math.sin(0.11 * t + 2.9 * q);
  const r = F.r * (1 + (F.br ?? 0.2) * Math.sin(0.23 * t + q) + 0.1 * Math.sin(0.61 * t + 2.3 * q));
  const a = F.a0 + (F.w / F.r) * t + 0.3 * Math.sin(0.4 * t + 1.3 * q), e = F.e ?? 0.18, th = 0.9 * q + 0.05 * t;
  const ex = r * (1 + e) * Math.cos(a), ez = r * (1 - e) * Math.sin(a), bob = F.bob ?? 2.2;
  return [cx + ex * Math.cos(th) - ez * Math.sin(th), F.h + bob * Math.sin(0.37 * t + 2 * q) + 0.45 * bob * Math.sin(0.93 * t + 3.1 * q), cz + ex * Math.sin(th) + ez * Math.cos(th)];
}
// ... and how it flies there: heading, bank and pitch from the path itself (banked into the turn by its sideways pull);
// beating as it climbs, gliding as it sinks, on and off on its own uneven rhythm
function owlAt(F, t) {
  const h = 0.05, p0 = owlPos(F, t - h), p = owlPos(F, t), p1 = owlPos(F, t + h);
  const v = [0, 1, 2].map((k) => (p1[k] - p0[k]) / (2 * h)), ac = [0, 1, 2].map((k) => (p1[k] - 2 * p[k] + p0[k]) / (h * h));
  const sp = Math.max(Math.hypot(v[0], v[2]), 0.5), hd = Math.atan2(v[0], v[2]), lat = ac[0] * Math.cos(hd) - ac[2] * Math.sin(hd);   // pull toward its left (+x)
  const glide = smooth(0, 0.6, Math.sin(0.53 * t + 3 * F.p) + 0.5 * Math.sin(1.37 * t + F.p) - 0.35 * v[1]), ph = 6.2832 * F.f * t + F.p, A = 0.75 * (1 - glide);
  p[1] -= 0.035 * A * Math.sin(ph);
  return { p, hd, bank: clamp(-Math.atan(lat / 9.8), -0.9, 0.9), pitch: -Math.atan(v[1] / sp) - 0.05 * (1 - glide),
    arm: 0.12 + A * Math.sin(ph), hand: -0.06 + 0.55 * A * Math.sin(ph - 0.7), sweep: 0.45 * (1 - glide) * Math.max(0, Math.cos(ph)) };
}
function owlsAt(t, on = true) {
  if (!OWLS.parts) return;
  for (const m of OWLS.parts) m.visible = on;
  if (!on) return;
  const [B, AL, AR, HL, HR] = OWLS.parts;
  OWLS.fly.forEach((F, i) => {
    const o = owlAt(F, t);
    _owlM.compose(_owlP.set(...o.p), _owlQ.setFromEuler(_owlE.set(o.pitch, o.hd, o.bank, 'YXZ')), _owlS.setScalar(F.sc ?? 1));
    B.setMatrixAt(i, _owlM);
    for (const s of [1, -1]) {   // +1 the wing out along +x
      _owlA.makeRotationZ(s * o.arm).setPosition(s * 0.045, 0.03, 0.03).premultiply(_owlM);
      (s > 0 ? AL : AR).setMatrixAt(i, _owlA);
      _owlH.makeRotationFromEuler(_owlE.set(0, s * o.sweep, s * o.hand, 'YXZ')).setPosition(s * OWL_ARM, 0, 0).premultiply(_owlA);
      (s > 0 ? HL : HR).setMatrixAt(i, _owlH);
    }
  });
  for (const m of OWLS.parts) m.instanceMatrix.needsUpdate = true;
}

// ---- the shots
function duskShots() {
  buildTourProps(); buildOwls();
  const W0 = LAKE_Y, lp = (s, lat, dy) => { const [x, z] = fleetP(s, lat); return [x, W0 + dy, z]; };
  const ext = (k, more) => () => { setDusk(k); owlsAt(0, false); if (more) more(); };
  const lightsOff = () => spellSet([0, 0, 80], 0, { dir: [0, 0, -1], w: 6, jit: 10 });   // only the loch side (the boats, the boathouse) lit
  const S = [
    // golden hour on the loch: up off the water to the castle on its cliff and its reflection (no boats: they move
    // too stiffly to hold the screen for long)
    { name: 'loch', dur: 5, night: false, fleet: false, enter: ext(0.05, lightsOff),
      keys: [K(0, lp(832, 5.5, 0.9), lp(860, -2, 2.5), 50), K(2.4, lp(828, 8, 2.2), lp(900, -3, 9), 48), K(5, lp(822, 11, 5.5), lp(960, -3, 28), 46)],
      update: () => {} },
    // a single boat, nobody rowing it, slipping in through the boathouse's water gate: rubble walls, the gate lanterns
    { name: 'boathouse', dur: 4.5, night: false, fleet: true, enter: ext(0.12, lightsOff),
      keys: [K(0, [60, W0 + 2.2, 142], [50.5, W0 + 4, 118], 46), K(4.5, [58, W0 + 2.8, 135], [51, W0 + 6, 111], 44)],
      update: (lt) => { const s = FLEET.L - 17 + 3.2 * lt;   // a slow glide, 3.2 m/s, up to the gate
        lanternAt(fleetAt(s, SH_T.end + 20 + lt, null, 3.2), lt, false);
        for (let i = 1; i < 10; i++) { for (const M_ of [...TOURX.fleetBody, ...TOURX.fleetLamps]) M_.setMatrixAt(i, _hide); TOURX.lampPos[i] = null; }   // only the lead boat
        for (const M_ of [...TOURX.fleetBody, ...TOURX.fleetLamps]) M_.instanceMatrix.needsUpdate = true;
        MIRROR.uBoatN.value = 1; } },
    // along the loggia: clustered shafts, pointed arches, the quatrefoils, in raking sun
    { name: 'loggia', dur: 6.5, night: false, enter: ext(0.2, lightsOff),
      keys: [K(0, [-26, 2.6, 70], [-33, 0.6, 58], 50), K(6.5, [-54, 3.4, 69.5], [-62, 0.9, 58], 50)], update: () => {} },
    // up the Great Hall's south side, buttresses and pinnacles, to the cone of the Grand Staircase Tower; as the sun
    // goes the windows light themselves, one after another, running back from the loch
    { name: 'facade', dur: 7, night: false, enter: ext(0.4),
      keys: [K(0, [-113, 20, 62], [-97, 25, 42], 50), K(3.5, [-92, 40, 61], [-78, 38, 38], 48), K(7, [-72, 74, 46], [-55, 74, 14], 46)],
      update: (lt) => spellSet([0, 0, 80], 150 * easeIO((lt - 0.4) / 6), { dir: [0, 0, -1], w: 6, jit: 10 }) },
    // the Wooden Bridge from the gorge: the trestles against the sunset
    { name: 'woodbridge', dur: 6, night: false, enter: ext(0.44, () => spellSet([0, 0, 0], 1e7)),
      keys: [K(0, [-293, -2, -47], [-273, 1, -23], 52), K(6, [-262, -1, -46], [-242, 2, -22], 52)], update: () => {} },
    // the owls going out at dusk, round the Owlery on its pillar of rock, from its sunlit side
    { name: 'owls', dur: 4.5, night: false, enter: ext(0.5),
      keys: [K(0, [-321, OWL_TOP + 1, -123], [-300, OWL_TOP + 14, -140], 56), K(4.5, [-317, OWL_TOP + 3.5, -119], [-300, OWL_TOP + 17, -140], 54)],
      update: (lt) => owlsAt(30 + lt) },
    // inside: the Grand Staircase, a flight swinging across the well between the portraits
    { name: 'stairs', dur: 6, night: true, scene: 'stair',
      keys: [K(0, [-9.5, 41.5, 9.5], [1, 44.5, -1], 64), K(6, [-8.8, 44.5, 7.5], [2, 44.5, -2], 62)],
      update: (lt) => { if (STAIR_SWING) STAIR_SWING.rotation.y = 0.42 * easeIO((lt - 0.5) / 4.5); } },
    // the Great Hall at evening: the candles floating, rising and falling; the ceiling showing the sunset outside
    { name: 'hall', dur: 8, night: true, scene: 'hall', enter: () => { BOB.uBob.value = 1; INTSKY.uCeil.value = 0.78; },
      keys: [K(0, [0, 1.8, -2.5], [0, 6.5, -38], 60), K(4.5, [0, 3.0, -9], [0, 8, -36], 60), K(8, [0, 6.5, -15], [0, 17, -32], 64)], update: () => {} },
    // the blue hour: back across the loch, every window lit, the name
    { name: 'finale', dur: 7, night: false, enter: ext(0.88), fadeOut: 1.5, title: [2.4, 6.9],
      keys: [K(0, [-6, -47, 250], [-20, 18, 20], 44), K(7, [-14, -38, 330], [-22, 22, 20], 40)], update: () => {} },
  ];
  let t = 0;
  for (const s of S) { s.t0 = t; t += s.dur; }
  TOUR.dur = t;
  return S;
}
function duskStop() {
  spellSet([0, 0, 0], 1e7); owlsAt(0, false); BOB.uBob.value = 0; INTSKY.uCeil.value = -1;
  SKY.uDuskA.value.set(0, 0, 0); SKY.uDuskB.value.set(0, 0, 0); SKY.uCloudAmb.value = 1; DUSK.k = -1;
  setNight(NIGHT);
}
