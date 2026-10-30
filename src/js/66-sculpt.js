// ------------------------------------------------------------------ carved and cast figures for the sets (SDF, meshed at load)
// The stone beasts on corbels that hold the fire bowls along the Great Hall walls (ref/interior g50, g51, g57), the
// golden owl lectern (g34, g35, g86), and relief carving from height maps: the school crest on the fireplace hood (g82)
// and the four house roundels under it (g26). Local frame of a wall figure: x along the wall, y up, z out of the wall,
// origin at the top of its corbel on the wall face.
// carving cut into the surface in the shader, in the figure's own coordinates so it stays put on every instance:
// region 0 dressed stone (claw-chisel marks), 1 scales, 2 feathers, 3 wing membrane with veins, 4 bristles,
// 5 belly plates, 6 polished. The flow attribute is the direction scales and feathers lie along.
const CARVE_VERT = { vhead: 'attribute vec2 aux; attribute vec3 flow; flat varying vec2 vAux; varying vec3 vFlow; varying vec3 vObj; varying vec3 vONrm;\n', vert: 'vAux = aux; vFlow = flow; vObj = position; vONrm = normal;\n' };
const CARVE_GLSL = /* glsl */ `
flat varying vec2 vAux; varying vec3 vFlow; varying vec3 vObj; varying vec3 vONrm;
float carve(vec3 o, vec3 on, vec3 f, float reg, out float cav) {
  cav = 0.0;
  // a fixed frame per region: u along the flow, v across it (planes slicing the surface, so rows stay even on curves)
  vec3 t = length(f) > 0.5 ? normalize(f) : vec3(0.0, 1.0, 0.0);
  vec3 s = normalize(cross(t, abs(t.z) < 0.9 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0)));
  float u = dot(o, t), v = dot(o, s);
  if (reg < 0.5) {   // dressed stone: broad claw-chisel strokes and pitting
    float h = cgFbm3(o * 18.0) * 0.0018;
    h += (1.0 - abs(sin(dot(o, vec3(0.62, 0.2, 0.76)) * 55.0 + cgVn(o * 6.0) * 3.0))) * 0.0003 * smoothstep(0.3, 0.7, cgVn(o * 4.0));
    cav = smoothstep(0.6, 0.9, cgFbm3(o * 7.0)) * 0.2;
    return h;
  }
  if (reg < 1.5) {   // scales in offset rows, each a low dome with a soft rim
    float row = floor(u / 0.05), vv = v / 0.055 + 0.5 * mod(row, 2.0);
    vec2 g = vec2(fract(vv) - 0.5, fract(u / 0.05));
    float e = length(vec2(g.x * 1.1, (g.y - 0.25) * 0.8));
    cav = smoothstep(0.38, 0.62, e) * 0.4;
    return (1.0 - smoothstep(0.2, 0.62, e)) * 0.004 + cgVn(o * 50.0) * 0.0004;
  }
  if (reg < 2.5) {   // feathers: overlapping rows, each feather swelling toward its rounded tip, a shaft, a few barbs
    float L = 0.095, Wd = 0.07;
    float row = floor(u / L), vv = v / Wd + 0.5 * mod(row, 2.0);
    float fx = fract(vv) - 0.5, fy = fract(u / L);
    float edge = 0.9 - 1.1 * fx * fx;
    float body = smoothstep(0.0, edge, fy) * (1.0 - smoothstep(edge, edge + 0.07, fy));
    cav = (1.0 - smoothstep(0.0, 0.18, fy)) * 0.35 + smoothstep(0.42, 0.5, abs(fx)) * 0.15;
    float shaft = (1.0 - smoothstep(0.0, 0.07, abs(fx))) * 0.0006 * fy;
    float barbs = sin((fx * 1.4 + fy * 0.5) * 34.0) * 0.00018 * fy;
    return body * 0.0045 + shaft + barbs;
  }
  if (reg < 3.5) {   // membrane: soft wrinkles and veins along the bones
    float vein = 1.0 - smoothstep(0.0, 0.08, abs(fract(v * 2.2 + 0.25 * sin(u * 5.0)) - 0.5));
    cav = vein * 0.15;
    return sin(v * 45.0 + sin(u * 7.0) * 1.4) * 0.0005 + vein * 0.0022;
  }
  if (reg < 4.5) {   // bristles: carved strands along the flow, in clumps
    float s1 = cgVn(vec3(u * 9.0, v * 70.0, 0.0)), s2 = cgVn(vec3(u * 3.5, v * 22.0, 3.0));
    cav = (1.0 - s1) * 0.22 * s2;
    return s1 * s2 * 0.0035 + s2 * 0.002;
  }
  if (reg < 5.5) {   // belly plates
    float pl = fract(u / 0.06);
    cav = smoothstep(0.82, 1.0, pl) * 0.35;
    return smoothstep(0.0, 0.85, pl) * (1.0 - smoothstep(0.88, 1.0, pl)) * 0.004;
  }
  return cgVn(o * 70.0) * 0.00012;
}
`;
M.carved = procMat({ name: 'carved', rgb: [0.37, 0.32, 0.26], rough: 0.85, vc: true, bump: 1, ...CARVE_VERT, head: CARVE_GLSL, frag: /* glsl */ `
  float cav; float hc = carve(vObj, normalize(vONrm), vFlow, vAux.x, cav);
  float n = cgFbm3(P * 3.0);
  diffuseColor.rgb *= (0.84 + 0.26 * n) * mix(vec3(1.0), vec3(1.06, 0.98, 0.9), cgVn(P * 0.9));
  diffuseColor.rgb *= 1.0 - 0.22 * smoothstep(0.55, 0.85, cgFbm3(P * 1.7 + 4.0));   // grime in patches
  diffuseColor.rgb *= 1.0 - 0.5 * cav;
  if (vAux.x > 5.5) diffuseColor.rgb *= 0.82;                                      // polished parts darker, smoother
  cgRough = vAux.x > 5.5 ? 0.45 : 0.86;
  cgH = hc + n * 0.002; cgAO = 1.0 - 0.55 * cav;
` });
M.gilt = procMat({ name: 'gilt', rgb: [1.0, 0.72, 0.34], metal: 1, rough: 0.3, vc: true, bump: 1, ...CARVE_VERT, head: CARVE_GLSL, frag: /* glsl */ `
  float cav; float hc = carve(vObj * 1.8, normalize(vONrm), vFlow, vAux.x, cav);
  float n = cgFbm3(P * 7.0);
  diffuseColor.rgb *= (0.82 + 0.28 * n) * (1.0 - 0.55 * cav);
  cgRough = 0.18 + 0.2 * n + 0.25 * cav; cgH = hc * 0.55; cgAO = 1.0 - 0.6 * cav;
` });
M.orb = procMat({ name: 'orb', rgb: [0.02, 0.07, 0.22], rough: 0.06, frag: /* glsl */ `
  vec3 V = normalize(cameraPosition - P); float f = pow(1.0 - abs(dot(V, N)), 2.0);
  cgEmit = mix(vec3(0.02, 0.12, 0.4), vec3(0.15, 0.4, 0.9), f) * 0.6; cgSpec = 1.6;
` });

// ---- small vector helpers for building SDF figures
const v3 = { sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s], dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t] };
// an ellipsoid along a frame: forward f (radius a), side (radius b), up n (radius c)
function ellF(c, f, n, a, b, cc) {
  const F = v3.norm(f), S = v3.norm(v3.cross(n, F)), U = v3.cross(F, S);
  return { c, F, S, U, a, b, cc, br: Math.max(a, b, cc) };
}
function sdEllF(px, py, pz, e) {
  const dx = px - e.c[0], dy = py - e.c[1], dz = pz - e.c[2];
  return sdEll(dx * e.F[0] + dy * e.F[1] + dz * e.F[2], dx * e.S[0] + dy * e.S[1] + dz * e.S[2], dx * e.U[0] + dy * e.U[1] + dz * e.U[2], 0, 0, 0, e.a, e.b, e.cc);
}
// unsigned distance to a triangle (after iq), as a closure with its constants folded
function triSDF(a, b, c) {
  const ba = v3.sub(b, a), cb = v3.sub(c, b), ac = v3.sub(a, c), nor = v3.cross(ba, ac);
  const c1 = v3.cross(ba, nor), c2 = v3.cross(cb, nor), c3 = v3.cross(ac, nor);
  const dba = v3.dot(ba, ba), dcb = v3.dot(cb, cb), dac = v3.dot(ac, ac), dn = v3.dot(nor, nor);
  return (px, py, pz) => {
    const pa = [px - a[0], py - a[1], pz - a[2]], pb = [px - b[0], py - b[1], pz - b[2]], pc = [px - c[0], py - c[1], pz - c[2]];
    if (Math.sign(v3.dot(c1, pa)) + Math.sign(v3.dot(c2, pb)) + Math.sign(v3.dot(c3, pc)) < 2) {
      const e = (v, p, d) => { const t = clamp(v3.dot(v, p) / d, 0, 1); const x = v[0] * t - p[0], y = v[1] * t - p[1], z = v[2] * t - p[2]; return x * x + y * y + z * z; };
      return Math.sqrt(Math.min(e(ba, pa, dba), e(cb, pb, dcb), e(ac, pc, dac)));
    }
    const q = v3.dot(nor, pa); return Math.sqrt((q * q) / dn);
  };
}
// a feathered wing: feathers fan from points along the arm polyline; their direction turns from d0 (at the shoulder) to
// d1 (at the tip), all lying in one plane; a second row of shorter coverts lies over the bases.
function featherWing(arm, d0, d1, { count = 12, len = (t) => 0.4 + 0.4 * Math.sin(Math.PI * Math.pow(t, 0.7)), w = 0.075, t = 0.026, coverts = 0.45, armR = 0.06, curl = 0, nrm = null } = {}) {
  const segL = [], tot = [0];
  for (let i = 0; i < arm.length - 1; i++) { segL.push(Math.hypot(...v3.sub(arm[i + 1], arm[i]))); tot.push(tot[i] + segL[i]); }
  const L = tot[tot.length - 1];
  const at = (u) => { const s = u * L; let i = 0; while (i < segL.length - 1 && tot[i + 1] < s) i++; return v3.lerp(arm[i], arm[i + 1], clamp((s - tot[i]) / segL[i], 0, 1)); };
  const n = nrm ? v3.norm(nrm) : v3.norm(v3.cross(v3.sub(arm[arm.length - 1], arm[0]), d0));
  const fe = [], Bs = [], Qs = [];
  for (let i = 0; i < count; i++) {
    const u = (i + 0.5) / count, B = at(u * 0.96 + 0.04);
    let d = v3.norm(v3.lerp(v3.norm(d0), v3.norm(d1), Math.pow(u, 1.3)));
    d = v3.norm(v3.sub(d, v3.mul(n, v3.dot(d, n))));
    const l = len(u), lay = v3.mul(n, 0.008 * i + curl * u * u);
    Bs.push(B); Qs.push(v3.add(v3.add(B, v3.mul(d, l * 0.66)), lay));
    fe.push(ellF(v3.add(v3.add(B, v3.mul(d, l * 0.5)), lay), d, n, l * 0.5, w * (0.8 + 0.4 * u), t));
    if (u < 0.85 && coverts) fe.push(ellF(v3.add(v3.add(B, v3.mul(d, l * coverts * 0.5)), v3.mul(n, 0.03)), d, n, l * coverts * 0.5, w * 1.35, t * 1.1));
  }
  let C = [0, 0, 0]; for (const e of fe) C = v3.add(C, e.c); C = v3.mul(C, 1 / fe.length);
  let R = 0; for (const e of fe) R = Math.max(R, Math.hypot(...v3.sub(e.c, C)) + e.br);
  for (const p of arm) R = Math.max(R, Math.hypot(...v3.sub(p, C)) + armR);
  const armPts = arm.map((p, i) => [...p, armR * (1 - 0.45 * i / (arm.length - 1))]);
  const plate = [];
  for (let i = 0; i < count - 1; i++) plate.push(triSDF(Bs[i], Bs[i + 1], Qs[i]), triSDF(Bs[i + 1], Qs[i + 1], Qs[i]));
  plate.push(triSDF(arm[0], Bs[0], Qs[0]));
  return (px, py, pz) => {
    const bd = Math.hypot(px - C[0], py - C[1], pz - C[2]) - R;
    if (bd > 0.25) return bd;
    let d = sdChain(px, py, pz, armPts, 0.03), pl = 1e9;
    for (const tr of plate) pl = Math.min(pl, tr(px, py, pz));
    d = smin(d, pl - t * 0.8, 0.03);
    for (const e of fe) {
      if (Math.hypot(px - e.c[0], py - e.c[1], pz - e.c[2]) - e.br > d) continue;
      d = smin(d, sdEllF(px, py, pz, e), 0.012);
    }
    return d;
  };
}
// a bat wing: arm bones to the wrist, finger bones fanning out, a membrane between them with scalloped trailing edges
function batWing(S, E, W, F, A, { th = 0.022 } = {}) {
  const tris = [], scal = [];
  const pts = [...F, A];
  for (let k = 0; k < pts.length - 1; k++) tris.push(triSDF(W, pts[k], pts[k + 1]));
  tris.push(triSDF(W, A, E), triSDF(E, A, S));
  for (let k = 0; k < pts.length - 1; k++) {
    const a = pts[k], b = pts[k + 1], m = v3.lerp(a, b, 0.5), u = v3.norm(v3.sub(m, W)), r = Math.hypot(...v3.sub(a, b)) * 0.62;
    scal.push([...v3.add(m, v3.mul(u, r - Math.hypot(...v3.sub(m, W)) * 0.14)), r]);
  }
  const bones = [[[...S, 0.08], [...E, 0.06], [...W, 0.055]], ...F.map((f) => [[...W, 0.045], [...v3.lerp(W, f, 0.5), 0.032], [...f, 0.014]])];
  const all = [S, E, W, ...F, A]; let C = [0, 0, 0]; for (const p of all) C = v3.add(C, p); C = v3.mul(C, 1 / all.length);
  let R = 0; for (const p of all) R = Math.max(R, Math.hypot(...v3.sub(p, C)) + 0.1);
  return (px, py, pz) => {
    const bd = Math.hypot(px - C[0], py - C[1], pz - C[2]) - R;
    if (bd > 0.25) return bd;
    let m = 1e9; for (const t of tris) m = Math.min(m, t(px, py, pz));
    m -= th;
    for (const s of scal) m = smax(m, s[3] - Math.hypot(px - s[0], py - s[1], pz - s[2]), 0.02);
    let d = m;
    for (const b of bones) d = smin(d, sdChain(px, py, pz, b, 0.02), 0.03);
    return d;
  };
}
// the corbel every wall figure stands on: a moulded slab over a tapering bracket ending in a carved boss
function sdCorbel(x, y, z) {
  let d = sdBox(x, y, z, 0, -0.1, 0.45, 0.58, 0.1, 0.46, 0.025);
  d = Math.min(d, sdBox(x, y, z, 0, -0.26, 0.41, 0.52, 0.065, 0.41, 0.03));
  d = Math.min(d, sdTorusY(x * 0.9, y, (z - 0.4) * 1.12, 0, -0.355, 0, 0.36, 0.035));
  const t = clamp((-0.36 - y) / 1.15, 0, 1), hw = lerp(0.42, 0.13, t), zf = lerp(0.8, 0.22, Math.pow(t, 0.8));
  let br = Math.max(Math.abs(x) - hw, z - zf, -z - 0.05, y + 0.36, -1.5 - y);
  br = Math.max(br, -(sdCap(x, y, z, -hw - 0.02, -0.5, zf, -hw * 0.6, -1.3, zf * 0.7, 0.05)));   // chamfer grooves
  br = Math.max(br, -(sdCap(x, y, z, hw + 0.02, -0.5, zf, hw * 0.6, -1.3, zf * 0.7, 0.05)));
  d = smin(d, br, 0.04);
  d = smin(d, sdEll(x, y, z, 0, -1.5, 0.2, 0.16, 0.13, 0.13) - 0.02 * Math.abs(Math.sin(Math.atan2(y + 1.5, x) * 5)), 0.05);
  return Math.max(d, -z - 0.06);
}

// ---- the four wall beasts. Each returns { f, tag, min, max, hook }: hook is where the fire bowl's chain hangs from;
// tag(x, y, z) gives the carving at a surface point: [region, flow x, y, z] with region 0 dressed stone, 1 scales,
// 2 feathers, 3 wing membrane, 4 bristles, 5 belly plates, 6 polished (eyes, claws, beaks, teeth, horns); the flow is
// the direction the scales or feathers lie (66-sculpt carving shader).
// nearest segment of a chain: its direction and how far the point is in front of the chain axis
function chainNear(pts, x, y, z) {
  let best = 1e9, dir = [0, 1, 0], c = pts[0];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], ba = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L2 = ba[0] * ba[0] + ba[1] * ba[1] + ba[2] * ba[2];
    const t = clamp(((x - a[0]) * ba[0] + (y - a[1]) * ba[1] + (z - a[2]) * ba[2]) / L2, 0, 1);
    const q = [a[0] + ba[0] * t, a[1] + ba[1] * t, a[2] + ba[2] * t], d = Math.hypot(x - q[0], y - q[1], z - q[2]) - lerp(a[3], b[3], t);
    if (d < best) { best = d; dir = ba; c = q; }
  }
  return { d: best, dir, c };
}
const BEASTS3 = {
  // the winged serpent (g50): coils on the slab, the body rearing in an S with belly plates and a crest of spines,
  // a horned head with open jaws and fangs holding the chain, bat wings raised behind
  dragon() {
    const coil = [];
    for (let i = 0; i <= 26; i++) { const u = i / 26, a = 0.6 + u * Math.PI * 2.6, rr = 0.3 * (1 - 0.25 * u); coil.push([Math.cos(a) * rr, 0.11 + u * 0.34, 0.46 + Math.sin(a) * rr * 0.86, 0.045 + 0.115 * u]); }
    const e = coil[coil.length - 1];
    const body = [[e[0], e[1], e[2], 0.16], [-0.06, 0.76, 0.44, 0.17], [0.0, 1.04, 0.33, 0.16], [0.02, 1.3, 0.38, 0.14], [0.03, 1.5, 0.54, 0.12], [0.04, 1.6, 0.7, 0.105]];
    const spines = []; for (let k = 0; k < 9; k++) { const t = 0.25 + k * 0.085, i = Math.min(body.length - 2, Math.floor(t * (body.length - 1))), f = t * (body.length - 1) - i, p = v3.lerp(body[i], body[i + 1], f), r = lerp(body[i][3], body[i + 1][3], f); spines.push([p[0], p[1], p[2] - r * 0.85, r]); }
    const W = [-1, 1].map((s) => [s * 0.54, 2.16, 0.1]);
    const wings = [-1, 1].map((s, k) => batWing([s * 0.14, 1.18, 0.28], [s * 0.42, 1.56, 0.16], W[k],
      [[s * 0.92, 2.34, 0.06], [s * 1.08, 1.84, 0.06], [s * 0.98, 1.36, 0.08], [s * 0.72, 1.0, 0.12]], [s * 0.16, 0.86, 0.3]));
    const head = (x, y, z) => {
      let h = sdEll(x, y, z, 0.04, 1.68, 0.83, 0.13, 0.11, 0.2);
      h = smin(h, sdCap(x, y, z, 0.04, 1.67, 0.9, 0.04, 1.63, 1.1, 0.088, 0.052), 0.04);           // snout
      h = smax(h, -sdCap(x, y, z, 0.04, 1.585, 0.86, 0.04, 1.555, 1.16, 0.026, 0.044), 0.012);      // the open mouth
      h = smin(h, sdCap(x, y, z, 0.04, 1.57, 0.8, 0.04, 1.47, 1.03, 0.072, 0.034), 0.03);           // lower jaw
      for (const s of [-1, 1]) {
        const ex = 0.04 + s * 0.095;
        h = smin(h, sdEll(x, y, z, ex, 1.74, 0.86, 0.055, 0.032, 0.09), 0.02);                       // brow ridge
        h = smax(h, -sdEll(x, y, z, ex + s * 0.012, 1.705, 0.9, 0.03, 0.024, 0.03), 0.01);          // eye socket
        h = Math.min(h, Math.hypot(x - ex - s * 0.006, y - 1.705, z - 0.895) - 0.02);                 // eye
        h = smin(h, sdChain(x, y, z, [[ex, 1.76, 0.78, 0.036], [ex + s * 0.03, 1.84, 0.66, 0.024], [ex + s * 0.04, 1.88, 0.55, 0.007]], 0.02), 0.02);   // horns swept back
        h = smin(h, sdChain(x, y, z, [[0.04 + s * 0.13, 1.66, 0.74, 0.03], [0.04 + s * 0.19, 1.7, 0.66, 0.012]], 0.01), 0.02);                     // cheek frills
        h = smax(h, -sdEll(x, y, z, 0.04 + s * 0.03, 1.665, 1.1, 0.012, 0.01, 0.02), 0.006);        // nostrils
        for (let k = 0; k < 4; k++) {                                                                 // teeth, upper and lower
          const tz = 0.92 + k * 0.05, tx = 0.04 + s * (0.045 - k * 0.004);
          h = Math.min(h, sdCap(x, y, z, tx, 1.59 - k * 0.005, tz, tx, 1.555 - k * 0.006 - (k === 3 ? 0.03 : 0), tz + 0.006, 0.011, 0.002));
          h = Math.min(h, sdCap(x, y, z, tx, 1.545 - k * 0.02, tz - 0.01, tx, 1.575 - k * 0.02, tz - 0.004, 0.009, 0.002));
        }
      }
      return h;
    };
    const f = (x, y, z) => {
      let d = sdCorbel(x, y, z);
      d = Math.min(d, sdChain(x, y, z, coil, 0.04));
      let b = sdChain(x, y, z, body, 0.06);
      if (z > 0.35 && y > 0.5 && y < 1.55) b += 0.008 * Math.max(0, Math.sin(y * 48)) * smooth(0.0, 0.08, z - 0.4);
      for (const sp of spines) b = smin(b, sdCap(x, y, z, sp[0], sp[1], sp[2] + 0.03, sp[0], sp[1] + 0.04, sp[2] - 0.08 - sp[3] * 0.3, 0.035, 0.004), 0.015);
      d = smin(d, b, 0.05);
      d = smin(d, head(x, y, z), 0.05);
      for (const w of wings) d = smin(d, w(x, y, z), 0.04);
      return Math.max(d, -z - 0.06);
    };
    const tag = (x, y, z) => {
      if (y < 0.03) return [0, 0, 1, 0];
      for (let k = 0; k < 2; k++) { const s = k ? 1 : -1; if (s * x > 0.24 && z < 0.32 && y > 0.82) return [3, x - W[k][0], y - W[k][1], 0]; }
      if (y > 1.5 && z > 0.6) {
        for (const s of [-1, 1]) { if (Math.hypot(x - 0.04 - s * 0.1, y - 1.705, z - 0.895) < 0.035 || (y > 1.74 && s * (x - 0.04) > 0.04 && z < 0.8)) return [6, 0, 1, 0]; }
        if (y < 1.6 && y > 1.52 && z > 0.9) return [6, 0, 1, 0];
        return [1, 0, -0.15, -1];
      }
      const cB = chainNear(body, x, y, z), cC = chainNear(coil, x, y, z);
      if (cB.d < cC.d && z - cB.c[2] > 0.06 && y < 1.55) return [5, 0, 1, 0];
      return [1, 0, 1, 0];
    };
    return { f, tag, min: [-1.25, -1.72, -0.08], max: [1.25, 2.55, 1.25], hook: [0.04, 1.47, 1.02] };
  },
  // the eagle on an orb (g51, left of the doors): wings displayed, head bowed, the chain in its beak
  eagle() {
    const SH = [-1, 1].map((s) => [s * 0.2, 1.18, 0.46]);
    const wings = [-1, 1].map((s, k) => featherWing([SH[k], [s * 0.46, 1.44, 0.36], [s * 0.6, 1.86, 0.28], [s * 0.66, 2.3, 0.22]],
      [s * 0.25, -1, -0.12], [s * 0.3, 1, -0.08], { count: 15, len: (t) => 0.32 + 0.5 * Math.sin(Math.PI * Math.pow(t, 0.75)), w: 0.07 }));
    const tail = [-0.5, -0.25, 0, 0.25, 0.5].map((a) => ellF([Math.sin(a) * 0.12, 0.6, 0.3 - 0.02 * Math.abs(a)], [Math.sin(a) * 0.35, -1, -0.45], [0, 0.45, -1], 0.24, 0.06, 0.025));
    const f = (x, y, z) => {
      let d = sdCorbel(x, y, z);
      d = Math.min(d, Math.hypot(x, y - 0.34, z - 0.48) - 0.33);
      let b = sdEll(x, y, z, 0, 1.06, 0.6, 0.24, 0.3, 0.22);
      b = smin(b, sdEll(x, y, z, 0, 0.82, 0.52, 0.22, 0.28, 0.2), 0.1);
      for (const s of [-1, 1]) {
        b = smin(b, sdEll(x, y, z, s * 0.12, 0.72, 0.56, 0.1, 0.14, 0.1), 0.05);
        for (const a of [-0.5, 0, 0.5]) {
          const tx = s * 0.11 + Math.sin(a) * 0.12, tz = 0.56 + Math.cos(a) * 0.14, ty = 0.34 + Math.sqrt(Math.max(0, 0.36 * 0.36 - tx * tx - (tz - 0.48) ** 2));
          b = smin(b, sdChain(x, y, z, [[s * 0.11, 0.66, 0.56, 0.036], [(s * 0.11 + tx) / 2, ty + 0.06, (0.56 + tz) / 2, 0.028], [tx, ty, tz, 0.022]], 0.01), 0.02);
          b = Math.min(b, sdChain(x, y, z, [[tx, ty, tz, 0.02], [tx * 1.04, ty - 0.035, tz + 0.03, 0.012], [tx * 1.05, ty - 0.075, tz + 0.02, 0.003]], 0.005));
        }
      }
      b = smin(b, sdCap(x, y, z, 0, 1.24, 0.58, 0, 1.38, 0.66, 0.15, 0.12), 0.06);
      b = smin(b, sdEll(x, y, z, 0, 1.43, 0.69, 0.135, 0.13, 0.15), 0.04);
      for (const s of [-1, 1]) {
        b = smin(b, sdEll(x, y, z, s * 0.075, 1.48, 0.79, 0.055, 0.026, 0.055), 0.015);             // the fierce brow
        b = smax(b, -sdEll(x, y, z, s * 0.088, 1.445, 0.8, 0.026, 0.02, 0.024), 0.008);
        b = Math.min(b, Math.hypot(x - s * 0.09, y - 1.445, z - 0.795) - 0.018);                     // eyes
      }
      b = smin(b, sdChain(x, y, z, [[0, 1.44, 0.79, 0.068], [0, 1.43, 0.9, 0.048], [0, 1.38, 0.965, 0.028], [0, 1.31, 0.955, 0.01]], 0.02), 0.02);
      b = smin(b, sdEll(x, y, z, 0, 1.455, 0.82, 0.05, 0.03, 0.035), 0.01);                           // cere
      d = smin(d, b, 0.04);
      for (const w of wings) d = smin(d, w(x, y, z), 0.05);
      for (const t of tail) d = smin(d, sdEllF(x, y, z, t), 0.02);
      return Math.max(d, -z - 0.06);
    };
    const tag = (x, y, z) => {
      if (y < 0.03 || (Math.hypot(x, y - 0.34, z - 0.48) < 0.345 && y < 0.66)) return [0, 0, 1, 0];
      if (y > 1.3 && z > 0.78 && Math.abs(x) < 0.07) return [6, 0, 1, 0];
      for (const s of [-1, 1]) if (Math.hypot(x - s * 0.09, y - 1.445, z - 0.795) < 0.026) return [6, 0, 1, 0];
      if (y < 0.7 && z > 0.55) return [6, 0, 1, 0];   // toes and claws
      for (let k = 0; k < 2; k++) { const s = k ? 1 : -1; if (s * x > 0.22) return [2, x - SH[k][0], y - SH[k][1], z - SH[k][2]]; }
      if (y < 0.72) return [2, 0, -1, -0.6];
      return [2, 0, -1, 0.25];
    };
    return { f, tag, min: [-1.05, -1.72, -0.08], max: [1.05, 2.62, 1.12], hook: [0, 1.3, 0.96] };
  },
  // the winged boar (g57): sitting on its haunches, the long tusked head lowered, a bristling mane, feathered wings
  boar() {
    const SH = [-1, 1].map((s) => [s * 0.22, 1.16, 0.36]);
    const wings = [-1, 1].map((s, k) => featherWing([SH[k], [s * 0.46, 1.56, 0.28], [s * 0.56, 2.04, 0.22], [s * 0.5, 2.42, 0.18]],
      [s * 0.2, -1, -0.15], [s * 0.05, 1, -0.06], { count: 14, len: (t) => 0.3 + 0.42 * Math.sin(Math.PI * Math.pow(t, 0.7)), w: 0.065 }));
    const mane = [[0, 1.4, 0.64, 0.05], [0, 1.36, 0.46, 0.065], [0, 1.2, 0.3, 0.07], [0, 0.95, 0.22, 0.06]];
    const f = (x, y, z) => {
      let d = sdCorbel(x, y, z);
      let b = sdEll(x, y, z, 0, 0.4, 0.42, 0.34, 0.32, 0.38);
      b = smin(b, sdEll(x, y, z, 0, 0.88, 0.55, 0.29, 0.37, 0.29), 0.12);
      b = smin(b, sdEll(x, y, z, 0, 1.13, 0.46, 0.28, 0.21, 0.28), 0.1);
      for (const s of [-1, 1]) {
        b = smin(b, sdChain(x, y, z, [[s * 0.15, 0.82, 0.7, 0.08], [s * 0.15, 0.45, 0.76, 0.06], [s * 0.14, 0.14, 0.8, 0.055]], 0.03), 0.05);
        b = smin(b, sdEll(x, y, z, s * 0.14, 0.06, 0.84, 0.06, 0.065, 0.075), 0.02);
        b = Math.max(b, -sdBox(x, y, z, s * 0.14, 0.05, 0.92, 0.008, 0.06, 0.04));                   // cloven hooves
        b = smin(b, sdEll(x, y, z, s * 0.2, 0.18, 0.6, 0.12, 0.17, 0.2), 0.05);
      }
      let h = sdEll(x, y, z, 0, 1.21, 0.73, 0.165, 0.19, 0.23);
      h = smin(h, sdCap(x, y, z, 0, 1.15, 0.88, 0, 1.0, 1.2, 0.12, 0.072), 0.06);
      h = smin(h, sdCap(x, y, z, 0, 0.99, 0.82, 0, 0.92, 1.08, 0.075, 0.05), 0.04);                    // lower jaw
      h = smax(h, -sdCap(x, y, z, 0, 0.965, 0.98, 0, 0.94, 1.12, 0.012, 0.022), 0.01);                 // the mouth
      h = smin(h, sdEll(x, y, z, 0, 1.0, 1.215, 0.085, 0.07, 0.025), 0.015);                           // the snout disc
      for (const s of [-1, 1]) {
        h = smax(h, -sdEll(x, y, z, s * 0.032, 1.0, 1.24, 0.018, 0.025, 0.02), 0.006);
        h = Math.min(h, sdChain(x, y, z, [[s * 0.045, 0.975, 1.07, 0.022], [s * 0.08, 0.995, 1.12, 0.016], [s * 0.097, 1.05, 1.135, 0.009], [s * 0.093, 1.095, 1.11, 0.003]], 0.006));   // tusks
        h = smin(h, sdEll(x, y, z, s * 0.105, 1.31, 0.85, 0.05, 0.025, 0.06), 0.02);                   // brow
        h = smax(h, -sdEll(x, y, z, s * 0.115, 1.27, 0.9, 0.025, 0.02, 0.025), 0.008);
        h = Math.min(h, Math.hypot(x - s * 0.115, y - 1.27, z - 0.895) - 0.016);                       // eyes
        h = smin(h, sdEllF(x, y, z, ellF([s * 0.17, 1.4, 0.64], [s * 0.35, 1, -0.6], [s, 0, 0.3], 0.1, 0.05, 0.022)), 0.02);   // pointed ears
      }
      b = smin(b, h, 0.06);
      b = smin(b, sdChain(x, y, z, mane, 0.03) - 0.02 * Math.max(0, Math.sin(y * 70 + z * 50 + Math.sin(x * 90))), 0.04);
      d = smin(d, b, 0.04);
      for (const w of wings) d = smin(d, w(x, y, z), 0.05);
      return Math.max(d, -z - 0.06);
    };
    const tag = (x, y, z) => {
      if (y < 0.0) return [0, 0, 1, 0];
      for (const s of [-1, 1]) if (Math.hypot(x - s * 0.115, y - 1.27, z - 0.895) < 0.024 || (z > 1.04 && Math.abs(x) > 0.035 && y > 0.96 && y < 1.11 && s * x > 0)) return [6, 0, 1, 0];
      if (y < 0.12 && z > 0.75) return [6, 0, 1, 0];
      for (let k = 0; k < 2; k++) { const s = k ? 1 : -1; if (s * x > 0.26 && y > 1.0) return [2, x - SH[k][0], y - SH[k][1], z - SH[k][2]]; }
      if (z > 0.82 && y > 0.9) return [0, 0, 1, 0];
      if (Math.abs(x) < 0.12 && z < 0.5 && y > 0.9) return [4, 0, 1, -0.4];
      return [4, 0, -1, -0.3];
    };
    return { f, tag, min: [-1.0, -1.72, -0.08], max: [1.0, 2.75, 1.27], hook: [0, 0.93, 1.06] };
  },
  // the owl: ear tufts, deep facial discs with a ruff, large eyes, a hooked beak, wings half open like a cloak
  owl() {
    const SH = [-1, 1].map((s) => [s * 0.24, 1.0, 0.56]);
    const wings = [-1, 1].map((s, k) => featherWing([SH[k], [s * 0.4, 0.96, 0.5], [s * 0.5, 0.66, 0.46]],
      [s * 0.2, -1, -0.08], [s * 0.5, -1, 0], { count: 12, len: (t) => 0.42 + 0.22 * Math.sin(Math.PI * t), w: 0.08, nrm: [s * 0.85, 0, 0.5] }));
    const f = (x, y, z) => {
      let d = sdCorbel(x, y, z);
      z -= 0.12;
      let b = sdEll(x, y, z, 0, 0.6, 0.48, 0.3, 0.46, 0.28);
      b = smin(b, sdEll(x, y, z, 0, 1.18, 0.52, 0.29, 0.26, 0.25), 0.1);
      for (const s of [-1, 1]) {
        b = smax(b, -(Math.hypot(x - s * 0.1, y - 1.19, z - 0.83) - 0.14), 0.03);
        b = smin(b, Math.abs(Math.hypot(x - s * 0.1, y - 1.19) - 0.135) - 0.016 + Math.max(0, Math.abs(z - 0.72) - 0.03), 0.015);   // the ruff round each disc
        b = Math.min(b, Math.hypot(x - s * 0.1, y - 1.205, z - 0.68) - 0.05);                          // eyes
        b = smin(b, sdEll(x, y, z, s * 0.1, 1.245, 0.7, 0.068, 0.034, 0.05), 0.012);                   // heavy upper lids
        b = smin(b, sdCap(x, y, z, s * 0.16, 1.34, 0.5, s * 0.25, 1.56, 0.46, 0.06, 0.012), 0.04);
        for (const a of [-0.4, 0, 0.4]) b = smin(b, sdChain(x, y, z, [[s * 0.12, 0.1, 0.62, 0.032], [s * 0.12 + Math.sin(a) * 0.08, 0.06, 0.62 + Math.cos(a) * 0.1, 0.022], [s * 0.12 + Math.sin(a) * 0.11, 0.02, 0.62 + Math.cos(a) * 0.14, 0.006]], 0.01), 0.02);
      }
      b = smin(b, sdChain(x, y, z, [[0, 1.17, 0.77, 0.036], [0, 1.12, 0.8, 0.026], [0, 1.06, 0.78, 0.008]], 0.01), 0.012);
      d = smin(d, b, 0.04);
      for (const w of wings) d = smin(d, w(x, y, z + 0.12), 0.05);
      return Math.max(d, -z - 0.18);
    };
    const tag = (x, y, z) => {
      if (y < 0.0) return [0, 0, 1, 0];
      const zz = z - 0.12;
      for (const s of [-1, 1]) {
        if (Math.hypot(x - s * 0.1, y - 1.205, zz - 0.68) < 0.058) return [6, 0, 1, 0];
        if (Math.hypot(x - s * 0.1, y - 1.19) < 0.15 && zz > 0.6) return [2, x - s * 0.1, y - 1.19, 0];
      }
      if (Math.abs(x) < 0.04 && y > 1.04 && y < 1.2 && zz > 0.74) return [6, 0, 1, 0];
      if (y < 0.12 && zz > 0.55) return [6, 0, 1, 0];
      for (let k = 0; k < 2; k++) { const s = k ? 1 : -1; if (s * x > 0.28) return [2, x - SH[k][0], y - SH[k][1], z - SH[k][2]]; }
      return [2, 0, -1, 0.2];
    };
    return { f, tag, min: [-1.05, -1.72, -0.08], max: [1.05, 1.72, 1.12], hook: [0, 1.06, 0.95] };
  },
};
const SCULPT = {};
function sculptOpts(name) { const B = BEASTS3[name](); return { B, opts: { min: B.min, max: B.max, cell: 0.017, ao: 0.05, tag: B.tag } }; }
function sculptGeo(name) {
  if (SCULPT[name]) return SCULPT[name];
  const { B, opts } = sculptOpts(name), t0 = performance.now(), geo = meshSDF(B.f, opts);
  if (HEADLESS) console.log('[sculpt]', name, Math.round(performance.now() - t0), 'ms', geo.attributes.position.count, 'verts');
  return (SCULPT[name] = { geo, hook: B.hook });
}
async function sculptGeoAsync(name) { if (SCULPT[name]) return; const { B, opts } = sculptOpts(name); const geo = await meshSDFAsync(B.f, opts); SCULPT[name] ||= { geo, hook: B.hook }; }

// a round rod between two points
function rod(p0, p1, r, mat = 'paintBlack', n = 8) {
  const a = new THREE.Vector3(...p0), b = new THREE.Vector3(...p1), d = b.clone().sub(a), L = d.length();
  if (L < 0.005) return;
  const g = new THREE.CylinderGeometry(r, r, L, n, 1, true);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(_up, d.normalize()));
  put(mat, g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2));
}
// ---- fire bowls: a shallow iron dish on three rods from a ring, hung by a chain; flames in the dish
const BOWLS = [], LINKS = [];
const bowlGeo = (() => {
  const prof = [[0, 0.02], [0.18, 0.025], [0.36, 0.08], [0.46, 0.17], [0.5, 0.2], [0.49, 0.215], [0.44, 0.19], [0.34, 0.11], [0.17, 0.06], [0, 0.055]];
  const g = new THREE.LatheGeometry(prof.map(([r, h]) => new THREE.Vector2(r, h)), 28);
  const knob = new THREE.SphereGeometry(0.06, 10, 8).translate(0, 0.0, 0);
  return merge([g, knob]);
})();
const flameGeo = (() => {
  const pr = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pr.push(new THREE.Vector2(0.075 * Math.sin(Math.PI * Math.pow(t, 0.5)) * (1 - 0.45 * t), t * 0.5)); }
  return new THREE.LatheGeometry(pr, 10);
})();
function fireBowl(hook, by, sc) {
  const [hx, hy, hz] = hook;
  BOWLS.push(xf([hx, by, hz], 0, 0.86));
  const ry = by + 0.8;
  put('paintBlack', new THREE.TorusGeometry(0.07, 0.015, 6, 16).rotateX(Math.PI / 2).translate(hx, ry, hz));
  for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.3; rod([hx + Math.cos(a) * 0.41, by + 0.17, hz + Math.sin(a) * 0.41], [hx + Math.cos(a) * 0.06, ry, hz + Math.sin(a) * 0.06], 0.008); }
  const n = Math.max(1, Math.round((hy - ry) / 0.075));
  for (let i = 0; i < n; i++) LINKS.push(xf([hx, ry + (i + 0.5) * (hy - ry) / n, hz], (i % 2) * Math.PI / 2, 1));
  const R = rng('flame' + hx + hz);
  for (let i = 0; i < 7; i++) { const a = R() * 6.28, r = Math.sqrt(R()) * 0.2, s = 0.6 + R() * 0.5; fireTongue(hx + Math.cos(a) * r, by + 0.12, hz + Math.sin(a) * r, 0.32 * s, (0.55 + R() * 0.45) * s * (1 - r * 1.6)); }
  if (sc) { const p = new THREE.PointLight(new THREE.Color(1.0, 0.55, 0.22), 0, 9, 2); p.position.set(hx, by + 0.7, hz); p.userData = { d: 2, n: 9 }; sc.add(p); return p; }
  return null;
}
function flushBowls() {
  flushFires();
  if (BOWLS.length) addInst(bowlGeo, M.paintBlack, BOWLS, null, { cast: true });
  if (LINKS.length) addInst(new THREE.TorusGeometry(0.03, 0.009, 5, 10).scale(1, 1.5, 1).rotateY(Math.PI / 2), M.paintBlack, LINKS, null, { cast: false });
  BOWLS.length = 0; LINKS.length = 0;
}
// place beasts on a wall: list of { name, p: [x, y, z] (corbel top on the wall face), ry (local +z → wall normal), flip }
function wallBeasts(list, sc) {
  const by = {}, lights = [];
  for (const b of list) {
    const S = sculptGeo(b.name), m = xf(b.p, b.ry, [b.flip ? -1 : 1, 1, 1]);
    (by[b.name] ||= []).push(m);
    const h = new THREE.Vector3(...S.hook).applyMatrix4(m);
    const L = fireBowl([h.x, h.y, h.z], b.p[1] - 1.15, b.light ? sc : null); if (L) lights.push(L);
  }
  for (const [name, ms] of Object.entries(by)) {
    const g = SCULPT[name].geo;
    // a mirrored instance flips the winding; three.js handles negative determinants per object, not per instance,
    // so the mirrored ones get their own geometry with reversed faces
    const plain = ms.filter((m) => m.determinant() > 0), mir = ms.filter((m) => m.determinant() < 0);
    if (plain.length) addInst(g, M.carved, plain);
    if (mir.length) { const gm = g.clone(); const ix = gm.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } addInst(gm, M.carved, mir); }
  }
  return lights;
}

// ---- the golden owl lectern (g34, g35, g86): an owl with outspread wings on a blue orb, a twisted column with a serpent
// coiling up it, a stepped foot, and a candle branch either side. Origin on the floor, facing +z.
function lecternSDF() {
  const wings = [-1, 1].map((s) => featherWing([[s * 0.1, 1.44, -0.02], [s * 0.36, 1.5, -0.05], [s * 0.6, 1.56, -0.07], [s * 0.86, 1.66, -0.06]],
    [s * 0.15, -1, -0.15], [s * 1, -0.05, -0.02], { count: 15, len: (t) => 0.2 + 0.26 * Math.sin(Math.PI * Math.pow(t, 0.6)), w: 0.034, t: 0.011, armR: 0.03, coverts: 0.5 }));
  const f = (x, y, z) => {
    let d = sdEll(x, y, z, 0, 1.36, 0.0, 0.135, 0.19, 0.12);
    d = smin(d, sdEll(x, y, z, 0, 1.58, 0.02, 0.13, 0.11, 0.11), 0.05);
    for (const s of [-1, 1]) {
      d = smax(d, -(Math.hypot(x - s * 0.05, y - 1.585, z - 0.15) - 0.065), 0.015);
      d = smin(d, Math.hypot(x - s * 0.05, y - 1.595, z - 0.1) - 0.024, 0.005);
      d = smin(d, sdCap(x, y, z, s * 0.08, 1.66, 0.0, s * 0.12, 1.75, -0.01, 0.028, 0.006), 0.02);
      for (const a of [-0.45, 0, 0.45]) d = smin(d, sdCap(x, y, z, s * 0.05, 1.2, 0.03, s * 0.05 + Math.sin(a) * 0.05, 1.19, 0.03 + Math.cos(a) * 0.07, 0.014, 0.004), 0.01);
    }
    d = smin(d, sdCap(x, y, z, 0, 1.58, 0.11, 0, 1.53, 0.12, 0.018, 0.004), 0.008);
    if (z > 0.05 && y < 1.5) { const r = y * 60 + 0.5 * Math.floor(x * 30 + 100) % 2; d += 0.0025 * Math.abs(Math.sin(r * Math.PI)) * (0.6 + 0.4 * Math.abs(Math.sin(x * 94))); }
    for (const w of wings) d = smin(d, w(x, y, z), 0.02);
    // the cup holding the orb and the twisted column with the serpent
    d = Math.min(d, Math.max(Math.hypot(x, y - 1.13, z) - 0.115, y - 1.1, 1.0 - y, -(Math.hypot(x, y - 1.13, z) - 0.095)));
    if (y > 0.2 && y < 1.03) {
      const a0 = y * 22;
      let c = Math.hypot(x, z) - 0.03;
      for (let k = 0; k < 3; k++) { const a = a0 + k * 2.094; c = smin(c, Math.hypot(x - Math.cos(a) * 0.04, z - Math.sin(a) * 0.04) - 0.024, 0.01); }
      const as = -y * 9.5, sx = Math.cos(as) * 0.068, sz = Math.sin(as) * 0.068;
      c = smin(c, Math.hypot(x - sx, z - sz) - 0.02 * smooth(0.22, 0.4, y), 0.01);
      d = Math.min(d, c);
    }
    d = Math.min(d, sdEll(x, y, z, Math.cos(-0.98 * 9.5) * 0.075, 1.0, Math.sin(-0.98 * 9.5) * 0.075, 0.04, 0.025, 0.03));
    d = Math.min(d, Math.max(Math.hypot(x, z) - 0.07, Math.abs(y - 1.02) - 0.015), Math.max(Math.hypot(x, z) - 0.075, Math.abs(y - 0.21) - 0.02));
    return d;
  };
  const tag = (x, y, z) => {
    if (y < 1.12) return [6, 0, 1, 0];
    for (const sx of [-1, 1]) if (Math.hypot(x - sx * 0.05, y - 1.595, z - 0.1) < 0.032) return [6, 0, 1, 0];
    if (Math.abs(x) < 0.03 && y > 1.5 && y < 1.6 && z > 0.1) return [6, 0, 1, 0];
    if (Math.abs(x) > 0.13) return [2, x - Math.sign(x) * 0.1, y - 1.44, 0];
    if (y > 1.52 && z > 0.06) return [2, x, y - 1.585, 0];
    return [2, 0, -1, 0.2];
  };
  return [f, { min: [-1.02, 0.18, -0.24], max: [1.02, 1.8, 0.26], cell: 0.0095, ao: 0.03, tag }];
}
let LECTERN = null;
function lecternGeo() { if (!LECTERN) { const [f, o] = lecternSDF(); LECTERN = meshSDF(f, o); } return LECTERN; }
async function lecternGeoAsync() { if (LECTERN) return; const [f, o] = lecternSDF(); const g = await meshSDFAsync(f, o); LECTERN ||= g; }
function owlLectern(p, ry = 0) {
  const geo = lecternGeo();
  const m = xf(p, ry, 1);
  addSculpt(geo, M.gilt, m);
  const foot = new THREE.LatheGeometry([[0, 0], [0.3, 0], [0.31, 0.03], [0.27, 0.05], [0.26, 0.08], [0.18, 0.11], [0.12, 0.14], [0.1, 0.18], [0.075, 0.2], [0, 0.2]].map(([r, h]) => new THREE.Vector2(r, h)), 6).applyMatrix4(m);
  put('gold', foot);
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 16), M.orb); orb.applyMatrix4(xf([0, 1.13, 0], 0, 1).premultiply(m)); (TARGET || scene).add(orb);
  // candle branches rising behind the wings
  const cl = [];
  for (const s of [-1, 1]) {
    const pts = [[0, 0.95, -0.08], [s * 0.3, 1.02, -0.18], [s * 0.52, 1.25, -0.2]].map((q) => new THREE.Vector3(...q).applyMatrix4(m).toArray());
    rod(pts[0], pts[1], 0.014, 'gold'); rod(pts[1], pts[2], 0.012, 'gold');
    for (const [ox, oy] of [[-0.12, 0.0], [0, 0.12], [0.12, 0.02], [s * 0.24, -0.06]]) {
      const c = new THREE.Vector3(s * 0.52 + ox, 1.3 + oy, -0.2).applyMatrix4(m);
      rod(pts[2], [c.x, c.y - 0.04, c.z], 0.008, 'gold');
      put('gold', new THREE.CylinderGeometry(0.045, 0.02, 0.05, 12).translate(c.x, c.y - 0.02, c.z));
      cl.push(xf([c.x, c.y, c.z], 0, [1, 0.7 + 0.25 * Math.abs(ox * 6 % 1.7), 1]));
    }
  }
  candles(cl);
}

// ---- relief carving from a height canvas (red channel, 0..1): a displaced grid, triangles outside the carving dropped,
// cavity occlusion from the local average of the height in the vertex colour. Lies in the xy plane, relief toward +z.
function reliefGeo(cv, w, h, depth, seg = 260) {
  const W = cv.width, H = cv.height, D = cv.getContext('2d').getImageData(0, 0, W, H).data;
  const nx = seg, ny = Math.max(2, Math.round(seg * h / w));
  const hv = new Float32Array((nx + 1) * (ny + 1));
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const u = (i / nx) * (W - 1), v = (j / ny) * (H - 1), i0 = Math.floor(u), j0 = Math.floor(v), fu = u - i0, fv = v - j0;
    const s = (a, b) => D[(Math.min(H - 1, b) * W + Math.min(W - 1, a)) * 4] / 255;
    hv[j * (nx + 1) + i] = lerp(lerp(s(i0, j0), s(i0 + 1, j0), fu), lerp(s(i0, j0 + 1), s(i0 + 1, j0 + 1), fu), fv);
  }
  const pos = [], col = [], idx = [], map = new Int32Array(hv.length).fill(-1);
  const K = 3;
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const k = j * (nx + 1) + i;
    let near = false;
    for (let b = -1; b <= 1 && !near; b++) for (let a = -1; a <= 1; a++) { const ii = i + a, jj = j + b; if (ii >= 0 && jj >= 0 && ii <= nx && jj <= ny && hv[jj * (nx + 1) + ii] > 0.02) { near = true; break; } }
    if (!near) continue;
    let s = 0, c = 0;
    for (let b = -K; b <= K; b++) for (let a = -K; a <= K; a++) { const ii = i + a, jj = j + b; if (ii >= 0 && jj >= 0 && ii <= nx && jj <= ny) { s += hv[jj * (nx + 1) + ii]; c++; } }
    const occ = clamp(1 - Math.max(0, s / c - hv[k]) * 3.2, 0.35, 1);
    map[k] = pos.length / 3;
    pos.push((i / nx - 0.5) * w, (0.5 - j / ny) * h, hv[k] * depth); col.push(occ, occ, occ);
  }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const a = map[j * (nx + 1) + i], b = map[j * (nx + 1) + i + 1], c = map[(j + 1) * (nx + 1) + i], d = map[(j + 1) * (nx + 1) + i + 1];
    if (a < 0 || b < 0 || c < 0 || d < 0) continue;
    if (Math.max(hv[j * (nx + 1) + i], hv[j * (nx + 1) + i + 1], hv[(j + 1) * (nx + 1) + i], hv[(j + 1) * (nx + 1) + i + 1]) < 0.02) continue;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// the school crest as a height map (the 'height' mode of drawCrest), slightly softened
function crestHeightCanvas(W = 600, H = 640) {
  const c = makeCanvas(W, H), g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  drawCrest(g, 0, 0, W, H, 'height');
  const s = makeCanvas(W, H), sg = s.getContext('2d'); sg.filter = 'blur(1.2px)'; sg.drawImage(c, 0, 0);
  return s;
}
// a house roundel: a moulded ring with the house beast in the field
function roundelHeightCanvas(beast, S = 256) {
  const c = makeCanvas(S, S), g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, S, S);
  g.beginPath(); g.arc(S / 2, S / 2, S * 0.48, 0, Math.PI * 2); g.fillStyle = '#9a9a9a'; g.fill();
  g.beginPath(); g.arc(S / 2, S / 2, S * 0.4, 0, Math.PI * 2); g.fillStyle = '#4a4a4a'; g.fill();
  g.save(); g.beginPath(); g.arc(S / 2, S / 2, S * 0.4, 0, Math.PI * 2); g.clip();
  g.globalCompositeOperation = 'lighten'; g.drawImage(beastRelief(beast).hgt, S * 0.12, S * 0.12, S * 0.76, S * 0.76); g.restore();
  const s = makeCanvas(S, S), sg = s.getContext('2d'); sg.filter = 'blur(1px)'; sg.drawImage(c, 0, 0);
  return s;
}

// ---- debug set (?lab=1&shot=lab): the figures in a row on a plain wall
function buildLab(sc) {
  put('flag', new THREE.PlaneGeometry(30, 14).rotateX(-Math.PI / 2).translate(0, 0, 5));
  wallBox(-15, 15, 0, 10, -1, 0, 'sandstone', 0.02);
  const names = ['dragon', 'eagle', 'boar', 'owl'];
  wallBeasts(names.map((n, i) => ({ name: n, p: [-6 + i * 4, 4.6, 0], ry: 0 })), sc);
  owlLectern([0, 0, 1.5], 0);
  const cr = reliefGeo(crestHeightCanvas(), 2.2, 2.35, 0.14, 300);
  addSculpt(cr, M.carved, xf([7.5, 1.6, 0.01], 0, 1));
  flushBowls();
  const sun = setSun(sc, new THREE.Vector3(0.5, 0.6, 0.8), 20);
  return { sun, sunI: 4, envD: 0.5, envN: 0.1, points: [], levels: { day: [8, 22, 70, 175, 222], night: [3, 10, 38, 130, 220] } };
}

// ---- knights in plate armour for the niches either side of the Great Hall doors (g70, g02): one rests both
// gauntlets on a sword's pommel, the other holds a spear and a shield with a serpent on it. Origin between the feet,
// facing +z, about 1.95 m tall on a 10 cm base.
function knightSDF(kind) {
  const spear = kind === 'spear';
  const sx = (s) => s;   // sides: -1 left, +1 right (the figure's right is -x when facing +z)
  return (x, y, z) => {
    let d = sdBox(x, y, z, 0, -0.05, 0.02, 0.3, 0.05, 0.27, 0.01);
    let a = 1e9;
    for (const s of [-1, 1]) {
      a = Math.min(a, sdEll(x, y, z, s * 0.12, 0.05, 0.07, 0.07, 0.05, 0.15));                               // sabatons
      a = smin(a, sdCap(x, y, z, s * 0.12, 0.09, 0, s * 0.12, 0.5, 0, 0.062, 0.076), 0.03);                   // greaves
      a = smin(a, Math.hypot(x - s * 0.12, y - 0.53, z - 0.035) - 0.085, 0.02);                               // knee cops
      a = smin(a, sdEll(x, y, z, s * 0.18, 0.53, 0.03, 0.035, 0.065, 0.06), 0.01);
      a = smin(a, sdCap(x, y, z, s * 0.12, 0.56, 0, s * 0.11, 0.9, 0, 0.082, 0.1), 0.03);                     // cuisses
      a = smin(a, sdEll(x, y, z, s * 0.23, 1.37, 0, 0.13, 0.1, 0.13), 0.02);                                  // pauldrons, in lames
      for (let k = 1; k <= 2; k++) a = Math.min(a, sdEll(x, y, z, s * (0.24 + 0.01 * k), 1.37 - 0.055 * k, 0, 0.125 - 0.01 * k, 0.04, 0.125 - 0.01 * k));
      a = smin(a, sdCap(x, y, z, s * 0.25, 1.3, 0, s * 0.27, 1.07, 0.02, 0.06, 0.058), 0.02);                // upper arm
      a = smin(a, Math.hypot(x - s * 0.27, y - 1.06, z - 0.035) - 0.068, 0.015);                              // couter
    }
    // forearms and gauntlets: both on the pommel (sword) or the spear in the right hand, the shield on the left arm
    const hR = spear ? [-0.26, 0.98, 0.17] : [-0.05, 1.0, 0.19], hL = spear ? [0.24, 1.02, 0.16] : [0.05, 1.0, 0.19];
    a = smin(a, sdCap(x, y, z, -0.27, 1.06, 0.03, hR[0], hR[1], hR[2], 0.055, 0.045), 0.02);
    a = smin(a, sdCap(x, y, z, 0.27, 1.06, 0.03, hL[0], hL[1], hL[2], 0.055, 0.045), 0.02);
    a = smin(a, sdEll(x, y, z, hR[0], hR[1], hR[2] + 0.02, 0.05, 0.055, 0.06), 0.015);
    a = smin(a, sdEll(x, y, z, hL[0], hL[1], hL[2] + 0.02, 0.05, 0.055, 0.06), 0.015);
    // fauld bands, breastplate with a ridge, gorget, helm with a visor slit and a crest
    for (let k = 0; k < 4; k++) a = Math.min(a, sdEll(x, y, z, 0, 0.9 + 0.05 * k, 0, 0.21 - 0.006 * k, 0.034, 0.16 - 0.004 * k));
    a = smin(a, sdEll(x, y, z, 0, 1.2, 0.0, 0.2, 0.25, 0.15), 0.04);
    a = smin(a, sdCap(x, y, z, 0, 1.0, 0.13, 0, 1.36, 0.115, 0.012), 0.02);
    a = smin(a, sdCylY(x, y, z, 0, 0, 1.42, 1.52, 0.09), 0.02);
    let hm = sdEll(x, y, z, 0, 1.63, 0.0, 0.118, 0.148, 0.135);
    hm = smin(hm, sdEll(x, y, z, 0, 1.56, 0.05, 0.105, 0.085, 0.1), 0.02);
    hm = smax(hm, -sdBox(x, y, z, 0, 1.645, 0.13, 0.085, 0.007, 0.06), 0.004);
    hm = smin(hm, sdCap(x, y, z, 0, 1.77, -0.09, 0, 1.785, 0.08, 0.018), 0.01);
    a = smin(a, hm, 0.02);
    d = Math.min(d, a);
    if (spear) {
      d = Math.min(d, sdCap(x, y, z, -0.26, 0.0, 0.17, -0.26, 2.15, 0.17, 0.016));
      d = Math.min(d, sdEll(x, y, z, -0.26, 2.27, 0.17, 0.035, 0.12, 0.012));
      // a heater shield on the left arm with a serpent in low relief
      const xs = x - 0.25, zc = 0.21 - 0.5 * xs * xs;
      let sh = Math.max(Math.hypot(xs + 0.21, y - 0.98) - 0.4, Math.hypot(xs - 0.21, y - 0.98) - 0.4, y - 1.22);
      sh = Math.max(sh, Math.abs(z - zc) - 0.022);
      sh = Math.min(sh, Math.max(Math.hypot(xs + 0.21, y - 0.98) - 0.4, Math.hypot(xs - 0.21, y - 0.98) - 0.4, y - 1.22, Math.abs(z - zc - 0.02) - 0.01, -(Math.max(Math.hypot(xs + 0.21, y - 0.98) - 0.37, Math.hypot(xs - 0.21, y - 0.98) - 0.37, y - 1.19))));
      let sp = 1e9;
      for (let i = 0; i < 10; i++) { const t0 = i / 10, t1 = (i + 1) / 10; const p0 = [0.25 + 0.07 * Math.sin(t0 * 7), 0.78 + 0.38 * t0], p1 = [0.25 + 0.07 * Math.sin(t1 * 7), 0.78 + 0.38 * t1]; sp = Math.min(sp, sdCap(x, y, z, p0[0], p0[1], 0.24, p1[0], p1[1], 0.24, 0.016)); }
      d = Math.min(d, smin(sh, sp, 0.01));
    } else {
      d = Math.min(d, Math.hypot(x, y - 1.04, z - 0.2) - 0.03);
      d = Math.min(d, sdCap(x, y, z, 0, 0.86, 0.2, 0, 1.01, 0.2, 0.018));
      d = Math.min(d, sdBox(x, y, z, 0, 0.85, 0.2, 0.14, 0.016, 0.018, 0.006));
      d = Math.min(d, sdBox(x, y, z, 0, 0.45, 0.2, 0.026 * clamp((y - 0.02) / 0.4, 0.2, 1), 0.4, 0.006, 0.002));
    }
    return d;
  };
}
const KNIGHT = {};
const KNIGHT_BOX = { min: [-0.36, -0.12, -0.3], max: [0.5, 2.42, 0.36], cell: 0.013, ao: 0.03 };
function knightGeo(kind) { return KNIGHT[kind] ||= meshSDF(knightSDF(kind), KNIGHT_BOX); }
async function knightGeoAsync(kind) { if (KNIGHT[kind]) return; const g = await meshSDFAsync(knightSDF(kind), KNIGHT_BOX); KNIGHT[kind] ||= g; }
// mesh every figure in idle time and start the portrait shaders compiling, so the rooms open quickly
async function prebuildFigures() {
  portraitWarm();
  for (const n of ['eagle', 'dragon', 'boar', 'owl']) await sculptGeoAsync(n);
  await lecternGeoAsync();
  for (const k of ['sword', 'spear']) await knightGeoAsync(k);
  await gcrSculptAsync();
}
