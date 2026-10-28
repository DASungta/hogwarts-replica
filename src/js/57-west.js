// ------------------------------------------------------------------ batch 2: the west side (Prisoner of Azkaban on)
// Clock Tower and its courtyard on the gorge rim, the covered Wooden Bridge on its timber truss, the stone circle and
// the ruins on the far hill, the path down past the Whomping Willow to Hagrid's hut and on to the Quidditch pitch.
M.timber = procMat({ name: 'timber', rgb: [0.085, 0.062, 0.044], rough: 0.85, bump: 1, uv: true, frag: /* glsl */ `
  float g = cgVn(vec3(UV.x * 0.5, UV.y * 6.0, 1.0)) * 0.6 + cgVn(vec3(UV.x * 3.0, UV.y * 18.0, 4.0)) * 0.4;
  float n = cgFbm3(P * 0.3);
  diffuseColor.rgb *= (0.72 + 0.5 * g) * (0.85 + 0.3 * n) * mix(vec3(1.0), vec3(0.85, 0.9, 0.95), smoothstep(0.55, 0.8, n));
  cgH = g * 0.006;
` });
M.shingle = procMat({ name: 'shingle', rgb: [0.1, 0.082, 0.064], rough: 0.85, bump: 1, uv: true, frag: /* glsl */ `
  float rh = 0.32, sw = 0.24;
  float row = floor(UV.y / rh); float u = UV.x + cgH21(vec2(row, 2.1)) * sw;
  float fy = fract(UV.y / rh), fx = fract(u / sw); float id = cgH21(vec2(floor(u / sw), row));
  vec3 c = vec3(0.8 + 0.4 * id) * mix(0.6, 1.0, smoothstep(0.0, 0.1, min(fx, 1.0 - fx)) * smoothstep(0.0, 0.2, fy));
  float m = smoothstep(0.5, 0.8, cgFbm3(P * 0.5));
  c = mix(c, c * vec3(0.7, 0.95, 0.5), m * 0.7);
  diffuseColor.rgb *= c; cgH = (1.0 - fy) * 0.02 + id * 0.005;
` });
M.rubble = procMat({ name: 'rubble', rgb: [0.24, 0.215, 0.18], rough: 0.9, bump: 1, uv: true, head: STONE_GLSL, frag: /* glsl */ `
  vec2 q = UV * vec2(0.62, 0.85) + vec2(cgVn(vec3(UV * 0.7, 2.0)) * 0.4, 0.0);
  float hh, groove;
  vec3 c = castleStone(P * 1.3, N, q, hh, groove, 0.82);
  c = mix(c, c * vec3(0.8, 0.95, 0.7), smoothstep(0.55, 0.8, cgFbm3(P * 0.6)) * 0.6);
  diffuseColor.rgb *= c; cgH = hh * 1.6; cgAO = mix(0.5, 1.0, groove);
` });
M.door = procMat({ name: 'door', rgb: [0.07, 0.045, 0.028], rough: 0.8, uv: true, frag: /* glsl */ `
  float plank = smoothstep(0.0, 0.04, abs(fract(UV.x * 4.0) - 0.5) * 2.0 - 0.0);
  float strap = 1.0 - step(0.06, abs(fract(UV.y * 1.4) - 0.5));
  diffuseColor.rgb *= mix(0.6, 1.0, plank) * (0.85 + 0.3 * cgVn(vec3(UV * vec2(4.0, 30.0), 1.0)));
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.03), strap * 0.8);
  cgMetal = strap * 0.6;
` });
M.dirt = procMat({ name: 'dirt', rgb: [1, 1, 1], rough: 0.95, bump: 1, uv: true, frag: /* glsl */ `
  float n = cgFbm3(P * 0.6); float p = cgVn(P * 6.0);
  vec3 c = mix(vec3(0.07, 0.055, 0.04), vec3(0.11, 0.09, 0.065), n);
  c = mix(c, vec3(0.16, 0.15, 0.13), smoothstep(0.72, 0.9, p) * 0.7);
  float edge = smoothstep(0.55, 1.0, abs(UV.y) + (n - 0.5) * 0.35);
  c = mix(c, vec3(0.045, 0.06, 0.022), edge);
  float rut = 1.0 - smoothstep(0.04, 0.12, abs(abs(UV.y) - 0.42));
  c *= 1.0 - 0.18 * rut;
  diffuseColor.rgb *= c; cgH = p * 0.03 + n * 0.02; cgSpec = 0.3;
` });
M.stream = procMat({ name: 'stream', rgb: [0.012, 0.02, 0.02], rough: 0.06, bump: 1, uv: true, frag: /* glsl */ `
  vec2 q = vec2(UV.x * 0.35 - uTime * 0.9, UV.y);
  cgH = cgFbm3(vec3(q * vec2(0.8, 1.6), uTime * 0.2)) * 0.08 + cgVn(vec3(q * 3.0, uTime)) * 0.015;
  float foam = smoothstep(0.62, 0.95, abs(UV.y)) * smoothstep(0.45, 0.8, cgVn(vec3(q * 2.0, 3.0)));
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.5, 0.52, 0.5), foam * 0.6);
  cgRough = mix(0.05, 0.6, foam);
` });
M.pumpkin = procMat({ name: 'pumpkin', rgb: [0.3, 0.09, 0.014], rough: 0.55, frag: /* glsl */ `
  diffuseColor.rgb *= (0.75 + 0.35 * cgFbm3(P * 1.7)) * mix(vec3(1.0), vec3(0.6, 0.8, 0.5), smoothstep(0.6, 0.9, cgVn(P * 3.0)) * 0.5);
` });
M.willow = procMat({ name: 'willow', rgb: [1, 1, 1], rough: 0.9, bump: 1, frag: /* glsl */ `
  float f = 1.0 - abs(cgVn(vec3(P.x * 3.0, P.y * 0.6, P.z * 3.0)) * 2.0 - 1.0);
  float n = cgFbm3(P * 0.9);
  vec3 c = mix(vec3(0.07, 0.062, 0.05), vec3(0.15, 0.135, 0.11), n) * mix(0.55, 1.0, smoothstep(0.1, 0.45, 1.0 - f));
  c = mix(c, vec3(0.05, 0.07, 0.03), smoothstep(0.6, 0.85, cgFbm3(P * 0.4 + 3.0)) * smoothstep(0.2, 0.8, N.y + 0.3) * 0.7);
  diffuseColor.rgb *= c; cgH = f * f * 0.06 + n * 0.02;
` });

// ---- helpers
const _up = new THREE.Vector3(0, 1, 0);
// a square beam between two points
function beam(p0, p1, t, mat = 'timber') {
  const a = new THREE.Vector3(...p0), b = new THREE.Vector3(...p1), d = b.clone().sub(a), L = d.length();
  if (L < 0.05) return;
  const g = new THREE.BoxGeometry(t, L, t);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(_up, d.normalize()));
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  put(mat, uvPlanar(g));
}
// stepped (crow-stepped) gable wall; plane through (cx, cz) facing x (face = 'x') or z (face = 'z')
function crowGable(cx, cz, y, half, rise, face, steps = 7, thick = 0.9) {
  const sw = half / (steps + 0.5), sh = rise / steps, s = new THREE.Shape();
  s.moveTo(-half, 0);
  for (let i = 0; i < steps; i++) { s.lineTo(-half + i * sw, (i + 1) * sh); s.lineTo(-half + (i + 1) * sw, (i + 1) * sh); }
  for (let i = steps - 1; i >= 0; i--) { s.lineTo(half - (i + 1) * sw, (i + 1) * sh); s.lineTo(half - i * sw, (i + 1) * sh); }
  s.lineTo(half, 0); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false }).translate(0, 0, -thick / 2);
  if (face === 'x') g.rotateY(Math.PI / 2);
  g.translate(cx, y, cz);
  put('stone', uvPlanar(g));
}
// tapered tube along a smooth curve through pts; radius from r0 to r1, optional gnarl
function taperTube(pts, r0, r1, seg = 24, radial = 10, gnarl = 0, seed = 0, mat = 'willow') {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  const fr = curve.computeFrenetFrames(seg, false);
  const pos = [], idx = [];
  for (let i = 0; i <= seg; i++) {
    const t = i / seg, c = curve.getPointAt(t), N = fr.normals[i], B = fr.binormals[i];
    const r = lerp(r0, r1, Math.pow(t, 0.8));
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const k = 1 + gnarl * noise3(Math.cos(a) * 1.3 + seed, t * 6, Math.sin(a) * 1.3);
      pos.push(c.x + (N.x * Math.cos(a) + B.x * Math.sin(a)) * r * k, c.y + (N.y * Math.cos(a) + B.y * Math.sin(a)) * r * k, c.z + (N.z * Math.cos(a) + B.z * Math.sin(a)) * r * k);
    }
  }
  const W = radial + 1;
  for (let i = 0; i < seg; i++) for (let j = 0; j < radial; j++) { const a = i * W + j; idx.push(a, a + 1, a + W, a + 1, a + W + 1, a + W); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  // the Frenet frame can flip the winding; make the first ring's normal point outward
  const n0 = new THREE.Vector3(g.attributes.normal.getX(0), g.attributes.normal.getY(0), g.attributes.normal.getZ(0));
  const out = new THREE.Vector3(pos[0], pos[1], pos[2]).sub(curve.getPointAt(0));
  if (n0.dot(out) < 0) { const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) { const t2 = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t2; } g.computeVertexNormals(); }
  put(mat, g);
  return curve;
}
// flat ribbon draped on the ground along a polyline (paths, the stream); uv.x = distance, uv.y = -1..1 across
function ribbon(pts, w, mat, lift = 0.15, yOf = null, step = 1.5) {
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)));
  const L = curve.getLength(), n = Math.max(2, Math.ceil(L / step));
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, p = curve.getPointAt(t), tg = curve.getTangentAt(t);
    const nx = -tg.z, nz = tg.x, l = Math.hypot(nx, nz) || 1;
    for (const sgn of [-1, 1]) {
      const x = p.x + (nx / l) * sgn * w / 2, z = p.z + (nz / l) * sgn * w / 2;
      pos.push(x, (yOf ? yOf(x, z, t) : groundH(x, z)) + lift, z); uv.push(t * L, sgn);
    }
  }
  for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  const nr = g.attributes.normal; let up = 0; for (let i = 0; i < nr.count; i++) up += nr.getY(i);
  if (up < 0) { const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) { const t2 = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t2; } g.computeVertexNormals(); }
  put(mat, g);
}
function nearPolyline(x, z, pts, d) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz;
    const t = clamp(((x - ax) * dx + (z - az) * dz) / L2, 0, 1);
    if (Math.hypot(x - ax - dx * t, z - az - dz * t) < d) return true;
  }
  return false;
}

// ---- the Clock Tower: a tall crow-gabled block, a south frontispiece with the clock over the pendulum opening
function buildClockTower() {
  // the clock gable faces west, over the gorge to the bridge and the stone circle (as seen from the stone circle in the
  // third film and in the miniature photos); the main roof runs north-south between two crow-stepped gables
  const [x0, z0, x1, z1] = SITE_BY.clock.rect, EAVE = 52, xm = (x0 + x1) / 2, zm = (z0 + z1) / 2;
  wallBox(x0, x1, -10, EAVE, z0, z1);
  for (const by of [19.6, 35.6]) wallBox(x0 - 0.35, x1 + 0.35, by, by + 0.4, z0 - 0.35, z1 + 0.35, 'trim', 0.04);
  wallBox(x0 - 0.7, x1 + 0.7, EAVE - 1.6, EAVE, z0 - 0.7, z1 + 0.7, 'trim', 0.05);
  for (let z = z0 + 1; z < z1; z += 1.6) for (const x of [x0 - 0.7, x1 + 0.7]) place('corbel', xf([x, EAVE - 1.6, z], x < x0 ? -Math.PI / 2 : Math.PI / 2, [0.5, 0.6, 0.5]));
  gableRoof(x0, x1, z0, z1, EAVE, 14, { axis: 'z', gables: [false, false], coping: false, over: 0.2 });
  crowGable(xm, z0 + 0.45, EAVE, (x1 - x0) / 2 + 0.5, 15.5, 'z');
  crowGable(xm, z1 - 0.45, EAVE, (x1 - x0) / 2 + 0.5, 15.5, 'z');
  for (const z of [z0 + 0.45, z1 - 0.45]) for (const y of [EAVE + 4, EAVE + 9]) win('lancet', [xm, y, z], 0, z < zm ? -1 : 1, 1.1, 3.2, 0, 0.5);
  // clasping buttresses at the corners and a pilaster down the middle of each long face, with set-offs
  for (const [bx, bz, nx, nz] of [[x0, z0, -1, -1], [x1, z0, 1, -1], [x0, z1, -1, 1], [x1, z1, 1, 1]]) {
    wallBox(bx - 1.6 + (nx > 0 ? 1.6 : 0) - 0.4 * (nx < 0), bx + (nx > 0 ? 0.4 : 1.6) - 1.6 * (nx > 0 ? 0 : 1) + 1.6 * (nx < 0 ? 0 : 0), -10, EAVE - 6, bz - 0.4 * (nz < 0) - 1.6 * (nz > 0 ? 1 : 0) + 1.6 * (nz > 0), bz + 0.4 * (nz > 0) + 1.6 * (nz < 0 ? 1 : 0) - 1.6 * (nz < 0), 'stone', 0.08);
    pinnacle(bx + nx * 0.2, EAVE - 0.4, bz + nz * 0.2, 1.1, 8);
  }
  for (const [px, pz, nx, nz] of [[x1, zm, 1, 0], [xm, z0, 0, -1], [xm, z1, 0, 1]]) buttress(px, pz, nx, nz, -10, EAVE - 3, { w: 1.6, d: 1.2, pin: 6 });
  for (const by of [11.6, 27.6, 43.6]) wallBox(x0 - 0.3, x1 + 0.3, by, by + 0.3, z0 - 0.3, z1 + 0.3, 'trim', 0.03);
  for (let y = 3; y < EAVE - 6; y += 8) {
    for (const [ax, az, bx, bz, side] of [[x0, z1, x1, z1, 1], [x1, z0, x0, z0, 1], [x1, z1, x1, z0, 1]]) {   // side 1: outward
      const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, nx = -uz * side, nz = ux * side;
      for (const t of [0.24, 0.76]) for (const o of [-0.9, 0.9]) win('lancet', [ax + dx * t + ux * o, y, az + dz * t + uz * o], nx, nz, 1.2, 4.6, 0, 0.45);
    }
    for (const z of [z0 + 3, z1 - 3]) win('lancet', [x0, y, z], -1, 0, 1.1, 4.2, 0, 0.45);
  }
  for (const f of [0.3, 0.7]) place('dormer', xf([x1 - 3.4, EAVE + 4.5, lerp(z0, z1, f)], Math.PI / 2, 1.4), [1, winRng(), 0]);
  // the frontispiece with the clock, the tall pendulum opening below it and two corner turrets
  const fz0 = zm - 6.5, fz1 = zm + 6.5, fx0 = x0 - 4;
  wallBox(fx0, x0 + 1, -24, EAVE + 5, fz0, fz1);
  gableRoof(fx0, x0 + 8, fz0, fz1, EAVE + 5, 12, { axis: 'x', gables: [true, false] });
  clockFace(fx0, EAVE + 8.6, zm, 3.4, -1, 0);
  win('lancet', [fx0, 24, zm], -1, 0, 3.6, 23, 0, 0);
  put('lead', new THREE.CylinderGeometry(0.08, 0.08, 15, 6).translate(fx0 + 0.15, 39, zm));
  put('gold', new THREE.CylinderGeometry(1.0, 1.0, 0.22, 24).rotateZ(Math.PI / 2).translate(fx0 + 0.1, 31.5, zm));
  for (const y of [6, 12, 18]) win('lancet', [fx0, y, zm], -1, 0, 1.6, 4.2, 1, 0.5);
  for (const z of [fz0, fz1]) {
    put('trim', new THREE.CylinderGeometry(1.35, 0.25, 3, 12).translate(fx0, 28.5, z));
    cyl(fx0, z, 30, EAVE + 12, 1.35, 'stone', 12);
    band(fx0, z, EAVE + 11.5, 1.35, 0.4, 0.2);
    spire(fx0, z, EAVE + 12, 1.6, 9, 8, Math.PI / 8);
  }
  for (const y of [4, 10]) for (const z of [fz0 + 2, fz1 - 2]) win('lancet', [fx0, y, z], -1, 0, 1.1, 3.4, 0, 0.6);
}

// ---- the courtyard: cloister on two sides, a pierced screen wall on the gorge rim, the eagle fountain
function eagleGeo() {
  const body = new THREE.SphereGeometry(0.5, 12, 8).scale(0.75, 1.15, 0.65).translate(0, 0.65, 0);
  const head = new THREE.SphereGeometry(0.24, 10, 8).translate(0, 1.45, 0.12);
  const beak = new THREE.ConeGeometry(0.08, 0.28, 6).rotateX(Math.PI / 2).translate(0, 1.42, 0.42);
  const wings = [-1, 1].map((s) => new THREE.BoxGeometry(0.08, 1.3, 0.75).translate(0, 0.55, 0).rotateZ(s * 0.75).translate(s * 0.32, 0.75, -0.05));
  const tail = new THREE.BoxGeometry(0.3, 0.5, 0.08).rotateX(-0.6).translate(0, 0.2, -0.38);
  return merge([body, head, beak, ...wings, tail]);
}
function buildClockCourt() {
  const [x0, z0, x1, z1] = SITE_BY.clockcourt.rect, xm = (x0 + x1) / 2, zm = (z0 + z1) / 2;
  wallBox(x0, x1, -8, 0.15, z0, z1, 'stone', 0.05);
  // east and south cloister walks: an arcade toward the court, a back wall, a pitched roof
  arcade(x1 - 6, z0, x1 - 6, z1, 0.15, 6.4, 7, { kind: 'lancet', spring: 0.8, pier: 0.28, depth: 0.8 });
  wallBox(x1 - 1, x1, -6, 9.5, z0, z1);
  gableRoof(x1 - 6.6, x1, z0, z1, 6.5, 3.4, { axis: 'z', over: 0.3, coping: false });
  arcade(x0 + 1.4, z1 - 6, x1 - 6, z1 - 6, 0.15, 6.4, 6, { kind: 'lancet', spring: 0.8, pier: 0.28, depth: 0.8 });
  wallBox(x0, x1 - 6, -6, 9.5, z1 - 1, z1);
  gableRoof(x0 + 1.2, x1 - 6.6, z1 - 6.6, z1, 6.5, 3.4, { axis: 'x', over: 0.3, coping: false });
  // the screen wall on the rim, pierced by tall lancets; its middle bay is the gate to the bridge
  arcade(x0, z0, x0, z1, -1, 10.5, 9, { kind: 'lancet', spring: 0.86, pier: 0.32, depth: 1.1 });
  wallBox(x0 - 1.4, x0 + 0.6, -24, -1, z0, z1, 'stone', 0.08);
  for (let i = 0; i <= 9; i++) { const z = lerp(z0, z1, i / 9); wallBox(x0 - 0.9, x0 + 0.9, -1, 10.5, z - 0.5, z + 0.5, 'stone', 0.05); pinnacle(x0, 10.5, z, 0.75, 3.6); }
  wallBox(x0 - 0.8, x0 + 0.8, 10.5, 11.1, z0, z1, 'trim', 0.04);
  // the bridgehead turrets flanking the gate, their feet down the rock
  roundTower({ x: x0 - 3.5, z: -31.5, r: 4.6, y0: -44, y1: 22, cone: 21, mach: false, kick: 0.12, bands: [4],
    winRows: [-10, -2, 6, 12, 18].map((y) => ({ kind: 'lancet', y, n: 5, w: 0.8, h: 2.6, lit: 0.5 })) });
  roundTower({ x: x0 - 3, z: -13, r: 3.0, y0: -26, y1: 10, cone: 12, mach: false, kick: 0.12, winRows: [{ kind: 'rect', y: 5, n: 4, w: 0.6, h: 1.3 }] });
  // eagle fountain
  const fx = xm - 3, fz = zm - 1;
  cyl(fx, fz, 0.15, 0.95, 3.4, 'trim', 8, null, false);
  put('stream', new THREE.CircleGeometry(3.1, 8).rotateX(-Math.PI / 2).translate(fx, 0.8, fz));
  cyl(fx, fz, 0.15, 2.4, 0.55, 'trim', 12, 0.4, false);
  cyl(fx, fz, 2.4, 2.75, 1.5, 'trim', 16, 1.7, false);
  const eg = eagleGeo();
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + (k * Math.PI) / 2, px = fx + Math.cos(a) * 3.3, pz = fz + Math.sin(a) * 3.3;
    wallBox(px - 0.35, px + 0.35, 0.15, 2.1, pz - 0.35, pz + 0.35, 'trim', 0.04);
    const g = eg.clone().scale(1.15, 1.15, 1.15).rotateY(Math.atan2(Math.cos(a), Math.sin(a)) + Math.PI).translate(px, 2.1, pz);
    put('trim', g);
  }
}

// ---- the Wooden Bridge: a roofed gallery on a timber truss whose bottom chord dips in a V to the stream
function bridgeRoof(a, b, y, halfW, rise) {
  const dx = b[0] - a[0], dz = b[2] - a[2], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, nx = -uz, nz = ux;
  const P = (s, w, h) => new THREE.Vector3(a[0] + ux * s + nx * w, h, a[2] + uz * s + nz * w);
  for (const side of [-1, 1]) {
    const e0 = P(-0.4, side * (halfW + 1.1), y - 0.45), e1 = P(L + 0.4, side * (halfW + 1.1), y - 0.45), r1 = P(L + 0.4, 0, y + rise), r0 = P(-0.4, 0, y + rise);
    const g = new THREE.BufferGeometry();
    const v = [e0, e1, r1, e0, r1, r0];
    g.setAttribute('position', new THREE.Float32BufferAttribute(v.flatMap((q) => [q.x, q.y, q.z]), 3));
    g.computeVertexNormals();
    if (g.attributes.normal.getY(0) < 0) { const v2 = [e0, r1, e1, e0, r0, r1]; g.setAttribute('position', new THREE.Float32BufferAttribute(v2.flatMap((q) => [q.x, q.y, q.z]), 3)); g.computeVertexNormals(); }
    uvSlope(g, e0, new THREE.Vector3(ux, 0, uz), r0.clone().sub(e0).normalize());
    put('slate', g);
    { // the boards under the slates, seen from inside the gallery (the slate face is one-sided)
      const gi = g.clone();
      for (const A of [gi.attributes.position, gi.attributes.uv]) for (let t = 0; t < A.count; t += 3) for (let k = 0; k < A.itemSize; k++) {   // reverse each triangle
        const v = A.getComponent(t + 1, k); A.setComponent(t + 1, k, A.getComponent(t + 2, k)); A.setComponent(t + 2, k, v);
      }
      gi.computeVertexNormals(); gi.translate(0, -0.08, 0); put('timber', gi);
    }
    beam([e0.x, e0.y - 0.2, e0.z], [e1.x, e1.y - 0.2, e1.z], 0.45, 'timber');
    for (let s = 7; s < L - 4; s += 14) {
      const f = 0.35, p = P(s, side * (halfW + 1.1) * (1 - f), y - 0.45 + (rise + 0.45) * f - 0.25);
      place('dormer', xf([p.x, p.y, p.z], Math.atan2(nx * side, nz * side), [1.1, 0.95, 1.1]), [0, 0.5, 0]);
    }
  }
  beam([a[0], y + rise + 0.05, a[2]], [b[0], y + rise + 0.05, b[2]], 0.35, 'lead');
}
function buildWoodenBridge() {
  const pts = SITE_BY.woodbridge.line, D = 1.5, Wb = 5.2, hw = Wb / 2;
  const P3 = pts.map(([x, z]) => [x, D, z]);
  // stations along the whole bridge for the truss
  const segs = [];
  let tot = 0;
  for (let i = 0; i < P3.length - 1; i++) { const L = Math.hypot(P3[i + 1][0] - P3[i][0], P3[i + 1][2] - P3[i][2]); segs.push({ a: P3[i], b: P3[i + 1], s0: tot, L }); tot += L; }
  const at = (s) => { const sg = segs.find((q) => s <= q.s0 + q.L + 1e-6) || segs[segs.length - 1]; const t = (s - sg.s0) / sg.L; return { x: lerp(sg.a[0], sg.b[0], t), z: lerp(sg.a[2], sg.b[2], t), ux: (sg.b[0] - sg.a[0]) / sg.L, uz: (sg.b[2] - sg.a[2]) / sg.L }; };
  // where the bridge crosses the stream
  let sC = tot / 2, best = 1e9;
  for (let s = 0; s <= tot; s += 1) { const p = at(s), d = Math.abs(p.x - gorgeX(p.z)); if (d < best) { best = d; sC = s; } }
  const pc = at(sC), apex = groundH(pc.x, pc.z) + 2.5;
  const vBottom = (s) => { const half = s < sC ? sC : tot - sC; const k = Math.abs(s - sC) / half; return lerp(apex, D - 6, Math.pow(k, 1.15)); };
  const ST = 5.6, nS = Math.round(tot / ST);
  const stations = [];
  for (let i = 0; i <= nS; i++) {
    const s = (i / nS) * tot, p = at(s), nx = -p.uz, nz = p.ux;
    const sides = [-1, 1].map((sg) => { const x = p.x + nx * sg * hw, z = p.z + nz * sg * hw; return { x, z, yb: Math.max(vBottom(s), groundH(x, z) + 0.2) }; });
    stations.push({ s, p, sides });
  }
  for (let i = 0; i < stations.length; i++) {
    const st = stations[i];
    for (const sd of st.sides) if (sd.yb < D - 0.6) beam([sd.x, sd.yb, sd.z], [sd.x, D - 0.5, sd.z], 0.34);
    if (st.sides[0].yb < D - 0.6) for (let y = D - 0.5; y > Math.max(st.sides[0].yb, st.sides[1].yb); y -= 5.5) beam([st.sides[0].x, y, st.sides[0].z], [st.sides[1].x, y, st.sides[1].z], 0.24);
    if (i === stations.length - 1) continue;
    const nx2 = stations[i + 1];
    for (let k = 0; k < 2; k++) {
      const A = st.sides[k], B = nx2.sides[k];
      const top = D - 0.5, bot = Math.max(A.yb, B.yb);
      if (bot >= top - 0.6) continue;
      beam([A.x, A.yb, A.z], [B.x, B.yb, B.z], 0.3);
      for (let y = top; y > bot + 0.5; y -= 6.5) {
        const y2 = Math.max(bot, y - 6.5);
        beam([A.x, y, A.z], [B.x, y, B.z], 0.22);
        beam([A.x, y, A.z], [B.x, y2, B.z], 0.18);
        beam([B.x, y, B.z], [A.x, y2, A.z], 0.18);
      }
    }
  }
  // legs from the apex down to the stream bed
  for (const sg of [-1, 1]) for (const o of [-3, 0, 3]) { const p = at(sC + o), x = p.x - p.uz * sg * hw, z = p.z + p.ux * sg * hw; beam([x, groundH(x, z) - 1, z], [x, apex + 0.5, z], 0.4); }
  // the covered gallery
  for (const sg of segs) {
    const { a, b, L } = sg, ux = (b[0] - a[0]) / L, uz = (b[2] - a[2]) / L, nx = -uz, nz = ux;
    const mid = [(a[0] + b[0]) / 2, (a[2] + b[2]) / 2];
    const deck = new THREE.BoxGeometry(L + 0.6, 0.5, Wb + 0.4).translate(0, D - 0.25, 0).rotateY(-Math.atan2(uz, ux)).translate(mid[0], 0, mid[1]);
    put('timber', uvPlanar(deck));
    for (const side of [-1, 1]) {
      const o = [nx * side * hw, nz * side * hw];
      for (let s = 0; s <= L; s += 1.7) { const x = a[0] + ux * s + o[0], z = a[2] + uz * s + o[1]; beam([x, D, z], [x, D + 4.0, z], 0.22); }
      for (const yy of [D + 1.1, D + 4.0]) beam([a[0] + o[0], yy, a[2] + o[1]], [b[0] + o[0], yy, b[2] + o[1]], yy > D + 2 ? 0.36 : 0.16);
      beam([a[0] + o[0], D + 0.15, a[2] + o[1]], [b[0] + o[0], D + 0.15, b[2] + o[1]], 0.3);
      for (let s = 0; s < L - 1.7; s += 1.7) {
        const xa = a[0] + ux * s + o[0], za = a[2] + uz * s + o[1], xb = a[0] + ux * (s + 1.7) + o[0], zb = a[2] + uz * (s + 1.7) + o[1];
        beam([xa, D + 3.2, za], [(xa + xb) / 2, D + 3.9, (za + zb) / 2], 0.1);
        beam([xb, D + 3.2, zb], [(xa + xb) / 2, D + 3.9, (za + zb) / 2], 0.1);
        for (let k = 1; k < 4; k++) beam([lerp(xa, xb, k / 4), D + 0.15, lerp(za, zb, k / 4)], [lerp(xa, xb, k / 4), D + 1.1, lerp(za, zb, k / 4)], 0.07);
      }
    }
    bridgeRoof(a, b, D + 4.3, hw, 2.6);
  }
  for (let s = 12; s < tot - 6; s += 21) { const p = at(s); spire(p.x, p.z, D + 6.7, 0.55, 3.6, 4, Math.PI / 4); }
}

// ---- the stone circle (Prisoner of Azkaban on): tall rough-hewn megaliths, leaning, one fallen, one broken to a stump,
// weathered grey with crusts of pale lichen, dark streaks down the faces, moss at the foot and on the tops
M.menhir = procMat({ name: 'menhir', rgb: [0.2, 0.195, 0.18], rough: 0.9, bump: 1, inst: true, frag: /* glsl */ `
  float n1 = cgFbm3(P * 0.7), n2 = cgVn(P * 4.0), n3 = cgFbm3(P * 2.2 + 3.0);
  vec3 c = mix(vec3(0.62, 0.6, 0.55), vec3(0.88, 0.85, 0.78), n1) * (0.85 + 0.3 * n2);
  c *= 1.0 - 0.32 * smoothstep(0.55, 0.85, cgVn(vec3(P.x * 3.0 + P.z * 3.0, P.y * 0.3, 1.0))) * (1.0 - abs(N.y));   // rain streaks
  c = mix(c, vec3(0.95, 0.93, 0.78), smoothstep(0.64, 0.76, cgFbm3(P * 1.4 + 7.0)) * 0.35);   // pale crusty lichen
  c = mix(c, vec3(0.58, 0.64, 0.36), smoothstep(0.66, 0.8, cgFbm3(P * 3.1 + 2.0)) * 0.45);    // green-yellow lichen
  float foot = 1.0 - smoothstep(0.2, 1.4, P.y - vInst.y);
  c = mix(c, vec3(0.1, 0.14, 0.05), clamp(foot * 0.7 + smoothstep(0.55, 0.9, N.y) * 0.6, 0.0, 0.8) * smoothstep(0.35, 0.6, n3));
  diffuseColor.rgb *= c; cgH = n2 * 0.025 + n3 * 0.06 + cgVn(P * 14.0) * 0.006; cgRough = 0.9;
` });
// a megalith of unit height: a slab tapering upward, cut off at a slant, its faces chipped and fluted by weather
function menhirGeo(seed) {
  const g = new RoundedBoxGeometry(1, 1, 1, 6, 0.14), p = g.attributes.position, r = rng('menhir' + seed);
  const sx = (r() - 0.5) * 0.8, sz = (r() - 0.5) * 0.5, bulge = 0.08 + r() * 0.1;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i) + 0.5, z = p.getZ(i);
    const w = 1 - 0.32 * y + bulge * Math.sin(Math.PI * y);
    x *= w; z *= w * (0.9 + 0.2 * (1 - y));
    const top = 1 - 0.18 * Math.abs(sx) - sx * x * 0.5 - sz * z * 0.4 + 0.06 * noise3(x * 4 + seed, 2, z * 4);
    if (y > top - 0.05) y = top - 0.05 + (y - top + 0.05) * 0.3;
    const k = 0.07 * noise3(x * 2.4 + seed, y * 1.6, z * 2.4) + 0.025 * noise3(x * 7 + seed, y * 7, z * 7) - 0.03 * Math.max(0, noise3(x * 1.2, y * 5 + seed, z * 1.2));   // chips and vertical flutes
    const l = Math.hypot(x, z) || 1;
    p.setXYZ(i, x + (x / l) * k, y + k * 0.3, z + (z / l) * k);
  }
  g.computeVertexNormals();
  return g;
}
function buildStoneCircle(look) {
  const [cx, cz, R] = SITE_BY.stones.circle, r = rng('stones');
  const lists = [[], [], [], [], []], n = 14, rocks = [];
  for (let i = 0; i < n; i++) {
    if (i === 4) continue;   // a gap where the path runs through
    const a = (i / n) * Math.PI * 2 + (r() - 0.5) * 0.12, rr = R + (r() - 0.5) * 1.6;
    const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr, y = look(x, z);
    let h = 3.6 + r() * 2.6, w = 1.5 + r() * 1.0, t = 0.8 + r() * 0.5;
    const fallen = i === 8, stump = i === 11, face = Math.atan2(Math.cos(a), Math.sin(a)) + Math.PI / 2 + (r() - 0.5) * 0.35;
    if (stump) h = 1.4;
    lists[i % 5].push(xf([x, y - (fallen ? 0.35 : 0.7), z], face, fallen ? [w, t, h] : [w, h, t], fallen ? Math.PI / 2 - 0.08 : (r() - 0.5) * 0.2, (r() - 0.5) * 0.16));
    for (let k = 0; k < 2 + Math.floor(r() * 3); k++) { const b = r() * 6.28, d = 0.9 + r() * 1.4, s = 0.25 + r() * 0.45; rocks.push(xf([x + Math.cos(b) * d, y + s * 0.1, z + Math.sin(b) * d], r() * 6.28, [s * 1.3, s * 0.7, s])); }
  }
  for (let k = 0; k < 5; k++) if (lists[k].length) addInst(menhirGeo(k * 5.3 + 1), M.menhir, lists[k]);
  addInst(angularRockGeo(2.2), M.menhir, rocks);
}

// ---- the ruins: weathered rubble walls broken off at jagged heights, an octagonal tower with whole sides fallen, an
// arched wall, a square gate tower, heaps of fallen stone at their feet, ivy climbing the walls
const RUIN_U = { uRuinY: { value: 0 } };
M.ruinstone = procMat({ name: 'ruinstone', rgb: [0.17, 0.162, 0.148], rough: 0.92, bump: 1, uv: true, head: 'uniform float uRuinY;\n' + STONE_GLSL, uniforms: RUIN_U, frag: /* glsl */ `
  vec2 q = UV * vec2(0.7, 0.9) + vec2(cgVn(vec3(UV * 0.8, 2.0)) * 0.35, 0.0);
  float hh, groove;
  vec3 c = castleStone(P * 1.2, N, q, hh, groove, 0.85);
  float hgt = P.y - uRuinY;
  c *= 1.0 - 0.35 * smoothstep(0.55, 0.85, cgVn(vec3(P.x * 2.0 + P.z * 2.0, P.y * 0.12, 4.0))) * (1.0 - abs(N.y));   // dark streaks
  c = mix(c, vec3(0.16, 0.2, 0.08), smoothstep(0.55, 0.85, N.y) * 0.7);                                             // grass and moss on broken tops
  // ivy climbing from the ground in fingers, thinning with height
  float ivyMask = smoothstep(0.5, 0.62, cgFbm3(vec3(P.x * 0.35, P.y * 0.12, P.z * 0.35) + 9.0) + 0.3 * (1.0 - smoothstep(0.0, 7.0, hgt)) - 0.15);
  float leaf = cgVn(P * 9.0) * 0.6 + cgVn(P * 23.0) * 0.4;
  vec3 ivy = mix(vec3(0.025, 0.045, 0.015), vec3(0.07, 0.11, 0.03), leaf);
  c = mix(c, ivy / vec3(0.17, 0.162, 0.148), ivyMask * (1.0 - abs(N.y)) * 0.92);
  diffuseColor.rgb *= c; cgH = hh * 1.5 + ivyMask * leaf * 0.06; cgAO = mix(0.5, 1.0, groove); cgRough = mix(0.9, 0.7, ivyMask);
` });
// a broken wall from (ax, az) to (bx, bz): its top a jagged line between frac h * lo and h, sloping down to broken ends,
// with deep breaches here and there; holes = [[u0, width, sill, spring]] for round arches or windows (u along the wall)
function ruinWall(ax, az, bx, bz, y0, h, t, seed, { holes = [], lo = 0.55, ends = [true, true], breach = 0.25, flat = false } = {}) {
  const r = rng('ruin' + seed), L = Math.hypot(bx - ax, bz - az), pts = [[0, -3], [L, -3]];
  const n = Math.max(4, Math.round(L / 0.9));
  let cur = h * (lo + (1 - lo) * r());
  const tops = [];
  if (flat) tops.push([L, h], [0, h]);
  else for (let i = n; i >= 0; i--) {
    const u = (i / n) * L;
    cur += (r() - 0.5) * Math.min(h * 0.18, 1.4); cur = clamp(cur, h * lo * 0.8, h);
    let y = cur;
    if (r() < breach * 0.25) y = h * (0.15 + 0.3 * r());   // a breach
    if (ends[1] && u > L - 2.5) y = Math.min(y, h * (0.35 + 0.25 * (L - u) / 2.5));
    if (ends[0] && u < 2.5) y = Math.min(y, h * (0.35 + 0.25 * u / 2.5));
    tops.push([u, y]);
    if (r() < 0.3 && i > 0) tops.push([u - L / n * 0.5, y - 0.2 - r() * 0.5]);   // a step down
  }
  pts.push(...tops);
  const sh = pathPts(new THREE.Shape(), pts);
  for (const [u0, w, sill, spring] of holes) {
    const hp = archShape('round', w, spring - sill, 0).getPoints(8).map((p) => [p.x + u0 + w / 2, p.y + sill]);
    sh.holes.push(pathPts(new THREE.Path(), hp.reverse()));
  }
  const g = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 1, curveSegments: 6 }).translate(0, 0, -t / 2);
  g.rotateY(-Math.atan2(bz - az, bx - ax)).translate(ax, y0, az);
  put('ruinstone', uvPlanar(g));
  return { L, ux: (bx - ax) / L, uz: (bz - az) / L };
}
// a heap of fallen blocks at a point
function rubbleHeap(x, z, y, rad, n, seed, out) {
  const r = rng('heap' + seed);
  for (let i = 0; i < n; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * rad, s = 0.3 + r() * 0.6; out.push(xf([x + Math.cos(a) * d, y + s * 0.25 * (1 - d / rad) + 0.05, z + Math.sin(a) * d], r() * 6.28, [s * 1.4, s * 0.8, s], (r() - 0.5) * 0.6, (r() - 0.5) * 0.6)); }
}
function buildRuins(look) {
  const heaps = [], ry = Math.atan2(-RUIN_F.u[1], RUIN_F.u[0]);   // rotation that lays a box's x along u, its z along v
  const L = (a, b) => ruinAt(a, b), Y = (a, b) => { const [x, z] = L(a, b); return look(x, z); };
  const fbox = (a, b, y, w, h, d) => { const [x, z] = L(a, b); put('ruinstone', uvPlanar(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0).rotateY(ry).translate(x, y, z))); };
  const wall = (a0, b0, a1, b1, y, h, t, seed, opt) => { const [ax, az] = L(a0, b0), [bx, bz] = L(a1, b1); return ruinWall(ax, az, bx, bz, y, h, t, seed, opt); };
  const archRing = (a, b, y, R) => { const [x, z] = L(a, b); put('ruinstone', uvPlanar(new THREE.TorusGeometry(R, 0.2, 5, 14, Math.PI).rotateY(ry).translate(x, y, z))); };
  // everything stands on the brink of the flat ground, at the level of the flat just behind the wall line
  const Y0 = Y(30, -6) + 0.2;
  RUIN_U.uRuinY.value = Y0;
  // the retaining wall along the front of the walkway, built down over the rock of the drop (m50)
  fbox(18, 2.0, Y0 - 11, 50, 12.8, 1.0);   // its top a low parapet
  fbox(18, 0.9, Y0 - 1, 50, 2.0, 2.4);       // the walkway behind it
  // the octagonal tower (m50): nearly whole, crenellated, a moulded cap course; its flat faces square to the wall line,
  // standing on a square base whose corners rise into the octagon as sloping spurs; the base goes down into the rock
  const OR = 5.5, OB = -2, oy = Y0 + 1, OH = 12, ap = OR * Math.cos(Math.PI / 8), S = ap + 0.45, side = 2 * OR * Math.sin(Math.PI / 8);
  fbox(0, OB, Y0 - 12, 2 * S, 13, 2 * S);
  { const sp = [], q = (a, b, y) => { const [x, z] = L(a, b); return [x, y, z]; };
    for (const [su, sv] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) {
      const K = q(su * S, OB + sv * S, oy), E1 = q(su * S, OB + sv * OR * Math.sin(Math.PI / 8), oy), E2 = q(su * OR * Math.sin(Math.PI / 8), OB + sv * S, oy);
      const A = q(su * ap * 0.72, OB + sv * ap * 0.72, oy + 3.6), flip = su * sv > 0;
      for (const [p, q2] of [[E1, K], [K, E2]]) sp.push(...A, ...(flip ? q2 : p), ...(flip ? p : q2));
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); g.computeVertexNormals();
    put('ruinstone', uvPlanar(g)); }
  const ROct = rng('octagon');
  for (let k = 0; k < 8; k++) {
    const ph = (k / 8) * Math.PI * 2, cu = Math.cos(ph), cv = Math.sin(ph);
    const [x, z] = L(cu * (ap - 0.45), OB + cv * (ap - 0.45)), rot = ry - ph + Math.PI / 2;
    const B = (w, h, d, y, off = 0) => { const [bx, bz] = L(cu * (ap - 0.45 + off), OB + cv * (ap - 0.45 + off)); put('ruinstone', uvPlanar(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0).rotateY(rot).translate(bx, y, bz))); };
    B(side + 0.75, OH, 0.9, oy);
    B(side + 0.95, 0.45, 1.25, oy + OH - 0.4, 0.12);    // the cap course
    for (const e of [-1, 1]) if (!(k === 6 && e === 1) && ROct() > 0.08) {   // merlons at the corners, one broken away
      const [mx, mz] = [x + Math.cos(rot) * e * (side / 2 - 0.15), z - Math.sin(rot) * e * (side / 2 - 0.15)];
      put('ruinstone', uvPlanar(new THREE.BoxGeometry(1.25, 1.25, 0.85).translate(0, 0.62, 0).rotateY(rot).translate(mx, oy + OH, mz)));
    }
  }
  // the wall of two round arches on the octagon's right (m50): the arches framed in moulded rings, the top broken off
  // at its far end; then a lone broken pier
  { const a0 = ap - 0.2, a1 = 17.5, b0 = -0.2;
    wall(a0, b0, a1, b0, oy, 6.4, 1.0, 'arch', { holes: [[1.8, 3.2, 0, 3.0], [6.4, 3.2, 0, 3.0]], lo: 0.95, breach: 0, ends: [false, true] });
    for (const u0 of [1.8, 6.4]) archRing(a0 + u0 + 1.6, b0 + 0.55, oy + 3.0, 1.75);
    wall(19.5, b0, 22, b0, oy, 6.0, 1.1, 'pier', { lo: 0.85, breach: 0, ends: [false, false] });
    rubbleHeap(...L(17, -2.5), oy, 2.4, 16, 'a', heaps); }
  // a low parapet on along the walkway to the square towers, a few broken blocks standing on it (m45, m50)
  wall(22, -0.2, 51.2, -0.2, oy, 1.8, 0.9, 'low', { lo: 0.7, breach: 0.15, ends: [false, false] });
  for (const [u, h] of [[29, 1.1], [33.5, 0.9], [41, 1.3]]) fbox(u, -0.2, oy + 1.5, 1.6, h, 1.3);
  // the small square tower (m45): crenellated, a round-arched opening high in its front
  const sqTower = (u0, b0, T, h, seed, front) => {
    const ty = oy;
    wall(u0 - T, b0 + T, u0 + T, b0 + T, ty, h, 1.0, seed + 'f', { holes: front, flat: true });
    wall(u0 + T, b0 + T, u0 + T, b0 - T, ty, h, 1.0, seed + 'r', { flat: true });
    wall(u0 + T, b0 - T, u0 - T, b0 - T, ty, h * 0.7, 1.0, seed + 'b', { lo: 0.6, breach: 0.3, ends: [false, false] });
    wall(u0 - T, b0 - T, u0 - T, b0 + T, ty, h, 1.0, seed + 'l', { flat: true });
    fbox(u0, b0 + T, ty + h - 0.35, 2 * T + 0.5, 0.45, 1.3); for (const e of [-1, 1]) fbox(u0 + e * T, b0, ty + h - 0.35, 1.3, 0.45, 2 * T + 0.5);
    for (const [ea, eb, w, d] of [[0, 1, 1, 0], [0, -1, 1, 0], [1, 0, 0, 1], [-1, 0, 0, 1]]) for (let k = -1; k <= 1; k += 2) {
      if (eb === -1 && k === 1) continue;   // a merlon fallen from the back
      fbox(u0 + ea * (T - 0.1) + w * k * (T - 0.55), b0 + eb * (T - 0.1) + d * k * (T - 0.55), ty + h, ea ? 0.8 : 1.1, 1.1, ea ? 1.1 : 0.8);
    }
    fbox(u0, b0, Y0 - 11, 2 * T + 1.2, 11 + 1, 2 * T + 1.2);   // its base down into the rock
  };
  sqTower(54, -1.5, 2.8, 12, 'sq', [[2.2, 1.2, 7, 8.6]]);
  wall(56.8, -0.5, 63, -0.5, oy, 5, 1.0, 'link', { lo: 0.6, breach: 0.2, ends: [false, false] });
  // the big square tower at the far end (m45): two arches at its foot facing out over the drop, a window over them,
  // a stepped plinth with a short flight of steps down its front
  { const u0 = 67, b0 = -2.5, T = 4.0, H = 17, ty = oy;
    fbox(u0, b0, Y0 - 12, 2 * T + 2.4, 12.6, 2 * T + 2.4);
    for (let k = 0; k < 4; k++) fbox(u0 + 1.7, b0 + T + 1.2 + k * 1.1, ty - 11.2 - k * 0.65, 3.0, 10.6, 1.1);
    wall(u0 - T, b0 + T, u0 + T, b0 + T, ty, H, 1.0, 'g0', { holes: [[0.9, 2.8, 0, 3.6], [4.3, 2.8, 0, 3.6], [3.4, 1.2, 9, 10.6]], lo: 0.92, breach: 0, ends: [false, false] });
    wall(u0 + T, b0 + T, u0 + T, b0 - T, ty, H - 0.6, 1.0, 'g1', { lo: 0.88, breach: 0, ends: [false, false] });
    wall(u0 + T, b0 - T, u0 - T, b0 - T, ty, H * 0.55, 1.0, 'g2', { lo: 0.5, ends: [false, false], breach: 0.5 });
    wall(u0 - T, b0 - T, u0 - T, b0 + T, ty, H - 1, 1.0, 'g3', { lo: 0.88, breach: 0, ends: [false, false] });
    for (const u of [u0 - 1.7, u0 + 1.7]) archRing(u, b0 + T + 0.55, ty + 3.6, 1.55);
    rubbleHeap(...L(u0, b0 - T - 2.5), ty, 3, 26, 'g', heaps);
    // and a wall going on beyond it, broken lower and lower
    wall(u0 + T, b0 - 1, u0 + 17, b0 - 4, ty, 9, 1.0, 'beyond', { lo: 0.45, breach: 0.3, ends: [false, true] }); }
  // to the octagon's left a short arcade turning back from the brink (m45, m50): two arched bays, then a stub
  wall(-ap + 0.2, -0.6, -13, -5, oy, 6, 1.0, 'arcL0', { holes: [[2.2, 2.6, 0, 2.6], [5.6, 2.6, 0, 2.6]], lo: 0.85, breach: 0, ends: [false, false] });
  wall(-13, -5, -22, -11, oy, 4.5, 1.0, 'arcL1', { lo: 0.5, breach: 0.3, ends: [false, true] });
  rubbleHeap(...L(-21, -12), oy, 2.5, 18, 'l', heaps);
  addInst(angularRockGeo(4.1), M.ruinstone, heaps);
  // ivy on the faces and over the tops
  const ivy = [], R2 = rng('ivy');
  for (const [a, b, h, s] of [[-3, 2.6, 6, 2.0], [3, 2.6, 4, 1.8], [12, 0.6, 4.5, 2.0], [22.5, 0.7, 4, 1.8], [52, 1.6, 7, 2.0], [66, 1.8, 9, 2.2], [-12, -3.5, 4, 1.8]]) {
    const [px, pz] = L(a, b), py = oy + h;
    for (let k = 0; k < 3; k++) ivy.push([px + (R2() - 0.5) * 2, py - k * 1.6, pz + (R2() - 0.5) * 2, s, s * 0.9, s, 26]);
  }
  addMesh(cardCrown(ivy, 0.9, 'ivy', null), M.leafCard);
  // rounded grey rock masses piled down the face of the drop in front of the walls (m45, m50), two rows
  const rm = [[], []], R4 = rng('ruinface');
  for (let a = -28; a < 90; a += 4.2 + R4() * 2.2) for (let row = 0; row < 2; row++) {
    const b = (row ? 9.5 : 4.6) + (R4() - 0.5) * 2, s = (row ? 5.5 : 3.8) + R4() * 2.2, [x, z] = L(a + (R4() - 0.5) * 2, b);
    rm[row].push(xf([x, Y0 - (row ? 9 : 3.6) - R4() * 1.2, z], ry + (R4() - 0.5) * 0.8, [s * (1.2 + R4() * 0.4), s * (0.75 + R4() * 0.25), s * (0.9 + R4() * 0.3)], (R4() - 0.5) * 0.25, (R4() - 0.5) * 0.25));
  }
  addInst(roundRockGeo(3.7), M.rock, rm[0]); addInst(roundRockGeo(8.9), M.rock, rm[1]);
  // three standing stones on the flat behind, ~45 m back from the wall: one on its own, two close together (m45, m50)
  const st = [];
  for (const [a, b, h, w, rot] of [[2.5, -48, 4.3, 1.25, 0.3], [8, -47, 4.8, 1.35, 1.1], [9.8, -49.8, 4.4, 1.2, 2.0]]) {
    const [x, z] = L(a, b), y = look(x, z);
    st.push(xf([x, y - 0.6, z], ry + rot * 0.3, [w, h, w * 0.8], 0.03, -0.04));
  }
  addInst(menhirGeo(7.7), M.menhir, st);
  // low grey rock breaking through the turf of the flat (m50): clusters of lumps, mostly buried
  const rk = [], R3 = rng('ruinrocks');
  for (const [a, b, s] of [[-4, -30, 4], [14, -36, 3], [24, -22, 3.5], [34, -40, 5], [-14, -44, 4], [46, -28, 2.5]]) for (let k = 0; k < 6; k++) {
    const [x, z] = L(a + (R3() - 0.5) * s * 1.6, b + (R3() - 0.5) * s), q = s * (0.25 + R3() * 0.3);
    rk.push(xf([x, look(x, z) - q * 0.45, z], R3() * 6.28, [q * 1.5, q * 0.8, q * 1.1], (R3() - 0.5) * 0.3, (R3() - 0.5) * 0.3));
  }
  addInst(angularRockGeo(12.3), M.menhir, rk);
}

// ---- the Whomping Willow (ref/grounds w03-w05, the miniature): a short massive trunk of five stems twisted together like
// a rope, leaning and bending; a mat of gnarled roots running down over a rocky hummock and into the turf; long thick
// limbs swung out from the top like arms and turned up at the ends into knobbly pollard heads; from each head a fan of long
// straight whips, in leaf along their outer halves. Each limb with its head, whips and leaves is its own group hinged where
// it leaves the trunk, so the tree can lash out (willowMove).
const WILLOW = { boughs: [], c: null };
function buildWillow(look) {
  const [cx, cz] = SITE_BY.willow.circle, g = look(cx, cz) - 0.3, r = rng('willow2');
  const T = (dx, dy, dz) => [cx + dx, g + dy, cz + dz];
  WILLOW.c = [cx, g, cz];
  // the hummock of rock under the roots, draped over the slope: a disc whose height above the ground swells toward the
  // middle, its rim tucked under the turf
  const bump = (u, v) => { const d = Math.min(1, Math.hypot(u, v)); return 1.5 * Math.pow(Math.max(0, 1 - d * d), 0.8) * (1 + 0.3 * noise3(u * 3, 1.3, v * 3)) - 0.35; };
  const humY = (x, z) => look(x, z) + bump((x - cx) / 6.8, (z - cz) / 5.8);
  const hum2 = mergeVertices(new THREE.PlaneGeometry(2, 2, 40, 40).rotateX(-Math.PI / 2).deleteAttribute('normal').deleteAttribute('uv')), q = hum2.attributes.position;
  for (let i = 0; i < q.count; i++) { const x = cx + q.getX(i) * 6.8, z = cz + q.getZ(i) * 5.8; q.setXYZ(i, x, humY(x, z), z); }
  hum2.computeVertexNormals();
  addMesh(hum2, M.rock);
  // the trunk's line: leaning, bending in an S
  const C = (t) => [0.7 * Math.sin(2.2 * t) - 0.3, 0.4 + 7.2 * t, 0.45 * t + 0.25 * Math.sin(3.1 * t)];
  for (let k = 0; k < 5; k++) {   // five stems wound round each other like a rope
    const pts = [];
    for (let j = 0; j <= 10; j++) { const t = j / 10, c = C(t), a = (k / 5) * Math.PI * 2 + t * Math.PI * 1.6, rr = 0.78 - 0.22 * t + 0.08 * Math.sin(t * 7 + k); pts.push(T(c[0] + Math.cos(a) * rr, c[1], c[2] + Math.sin(a) * rr)); }
    taperTube(pts, 1.0, 0.66, 40, 12, 0.3, 1 + k);
  }
  // roots: buttresses flaring from the foot of the trunk, then running down over the hummock half sunk in it, branching
  const surf = (x, z, lift) => [cx + x, humY(cx + x, cz + z) + lift, cz + z];
  for (let i = 0; i < 40; i++) {   // many, of all sizes, wandering and crossing like the miniature's tangle
    const a = (i / 40) * Math.PI * 2 + (r() - 0.5) * 0.35, L = 3.5 + r() * 5, w = (r() - 0.5) * 1.2, c0 = C(0.1), wig = 0.25 + r() * 0.2;
    const at = (d, lift) => { const b = a + w * (d / L) + wig * Math.sin(d * 1.1 + i * 1.7) / (1 + d * 0.3); return surf(c0[0] + Math.cos(b) * d, c0[2] + Math.sin(b) * d, lift); };
    const r0 = 0.22 + r() * 0.3;
    const pts = [T(c0[0] + Math.cos(a) * 0.6, 0.5 + r() * 0.9, c0[2] + Math.sin(a) * 0.6), at(1.4, r0 * 0.35), at(L * 0.35, r0 * 0.15), at(L * 0.6, 0.02), at(L * 0.82, -0.05), at(L, -0.4)];
    taperTube(pts, r0, 0.03, 24, 7, 0.5, 60 + i);
    for (let j = 0, nj = r() < 0.5 ? 1 : 2; j < nj; j++) {   // side roots off it
      const d0 = L * (0.25 + r() * 0.35), s = r() < 0.5 ? -1 : 1, b = a + s * (0.4 + r() * 0.6), l2 = 1.2 + r() * 2.4, p0 = at(d0, r0 * 0.05);
      const o = (d) => surf(p0[0] - cx + Math.cos(b + 0.3 * Math.sin(d * 2)) * d, p0[2] - cz + Math.sin(b + 0.3 * Math.sin(d * 2)) * d, -0.05 - 0.3 * (d / l2));
      taperTube([p0, o(l2 * 0.35), o(l2 * 0.7), o(l2)], r0 * 0.5, 0.02, 12, 6, 0.5, 120 + i * 3 + j);
    }
  }
  // the limbs, each in its own group hinged at the trunk
  const knob = new THREE.IcosahedronGeometry(1, 2), kp = knob.attributes.position;
  for (let i = 0; i < kp.count; i++) { const x = kp.getX(i), y = kp.getY(i), z = kp.getZ(i), k = 1 + 0.3 * noise3(x * 3, y * 3, z * 3) + 0.2 * Math.max(0, noise3(x * 7, y * 7, z * 7)); kp.setXYZ(i, x * k, y * k, z * k); }
  knob.computeVertexNormals();
  const whip = new THREE.CylinderGeometry(0.007, 0.03, 1, 5, 4).translate(0, 0.5, 0), wp = whip.attributes.position;
  for (let i = 0; i < wp.count; i++) { const y = wp.getY(i); wp.setX(i, wp.getX(i) + 0.04 * y * y); }   // a slight bow
  whip.computeVertexNormals();
  const NB = 7;
  for (let i = 0; i < NB; i++) {
    const a = (i / NB) * Math.PI * 2 + (r() - 0.5) * 0.5, dx = Math.cos(a), dz = Math.sin(a), s = 0.8 + r() * 0.45, c = C(0.8 + 0.06 * (i % 3));
    const S = T(c[0] + dx * 0.5, c[1], c[2] + dz * 0.5), P = (o, up) => [S[0] + dx * o * s, S[1] + up * s, S[2] + dz * o * s];
    const head = P(4.9, 3.1);
    const outer = new THREE.Group(), inner = new THREE.Group(), hOut = new THREE.Group(), hIn = new THREE.Group();
    outer.position.set(...S); inner.position.set(-S[0], -S[1], -S[2]); outer.add(inner); (TARGET || scene).add(outer);
    hOut.position.set(...head); hIn.position.set(-head[0], -head[1], -head[2]); hOut.add(hIn); inner.add(hOut);
    inGroup(inner, () => {   // the limb: out from the trunk, then turning up like a forearm
      taperTube([S, P(2.0, 0.55), P(3.7, 1.3), P(4.6, 2.3), head], 0.82, 0.48, 18, 11, 0.28, 20 + i);
    });
    const whips = [], leaf = [];
    inGroup(hIn, () => {   // the head, its whips and their leaves (a group of its own: the whips swing after the limb)
      put('willow', knob.clone().scale(0.8, 0.7, 0.8).translate(...head));
      const nW = 28 + Math.floor(r() * 10);
      for (let k = 0; k < nW; k++) {   // straight whips in a fan, mostly upward and outward
        const th = Math.acos(1 - r() * 0.6), ph = r() * Math.PI * 2, out = new THREE.Vector3(dx, 0, dz);
        const dir = new THREE.Vector3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)).addScaledVector(out, 0.5).normalize();
        const len = 7 + r() * 6, qn = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        whips.push(new THREE.Matrix4().compose(new THREE.Vector3(head[0] + dir.x * 0.5, head[1] + dir.y * 0.5, head[2] + dir.z * 0.5), qn, new THREE.Vector3(0.9 + r() * 0.5, len, 0.9 + r() * 0.5)));
        for (const f of [0.52, 0.7, 0.86]) if (r() < 0.8) leaf.push([head[0] + dir.x * len * f, head[1] + dir.y * len * f - 0.2, head[2] + dir.z * len * f, 0.45, 0.7, 0.45, 11]);
      }
      addInst(whip, M.willow, whips);
      addMesh(cardCrown(leaf, 0.42, 'willowleaf' + i, head), M.leafCard);
    });
    WILLOW.boughs.push({ g: outer, h: hOut, axis: new THREE.Vector3(-dz, 0, dx), S, head, a });
  }
}
// the limbs at time t: a slow sway; the strikes (WILLOW.strikes: { i, t0, A }) wind back, lash out and down at A radians
// and spring back; the whips swing after their limb
const _wQ = new THREE.Quaternion();
function willowLimb(b, k, t) {
  let th = 0.035 * Math.sin(0.8 * t + k * 1.7) + 0.02 * Math.sin(1.9 * t + k);
  for (const s of WILLOW.strikes || []) {
    if (s.i !== k) continue;
    const u = t - s.t0, W = 0.22, A = s.A;
    if (u > -0.6 && u <= 0) th += W * easeIO((u + 0.6) / 0.6);
    else if (u > 0 && u <= 0.28) th += W + (-A - W) * (u / 0.28) ** 2;
    else if (u > 0.28) th += -A * Math.exp(-(u - 0.28) / 0.5) * Math.cos(4.2 * (u - 0.28));
  }
  return th;   // + tilts the limb in toward the trunk, - out and down
}
function willowMove(t) {
  WILLOW.boughs.forEach((b, k) => {
    const th = willowLimb(b, k, t), lag = willowLimb(b, k, t - 0.09);
    b.g.quaternion.copy(_wQ.setFromAxisAngle(b.axis, th));
    b.h.quaternion.copy(_wQ.setFromAxisAngle(b.axis, 0.8 * (lag - th)));   // the whips trail the limb
  });
}

function roundRockGeo(seed) { // a rounded rock mass: a fine icosphere, displaced, smooth shaded, its underside flattened
  const g0 = new THREE.IcosahedronGeometry(1, 3); g0.deleteAttribute('normal'); g0.deleteAttribute('uv');
  const g = mergeVertices(g0), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 1 + 0.22 * noise3(x * 1.2 + seed, y * 1.2, z * 1.2 - seed) + 0.07 * noise3(x * 3.5 + seed, y * 3.5, z * 3.5) + 0.025 * noise3(x * 9, y * 9 + seed, z * 9);
    p.setXYZ(i, x * k, Math.max(y * k, -0.6), z * k);
  }
  g.computeVertexNormals();
  return g;
}
function angularRockGeo(seed) { // a weathered boulder: rounded, a few flat-ish faces and a split, smooth shading
  const g = mergeVertices(new THREE.IcosahedronGeometry(1, 4).deleteAttribute('normal').deleteAttribute('uv'));
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    let k = 1 + 0.26 * noise3(x * 1.4 + seed, y * 1.4, z * 1.4 - seed) + 0.08 * noise3(x * 4 + seed, y * 4, z * 4) + 0.025 * noise3(x * 11, y * 11 + seed, z * 11);
    k = Math.min(k, 1.06 + 0.04 * noise3(x * 2 - seed, y * 2, z * 2));   // planed faces where the bulges are cut back
    p.setXYZ(i, x * k, Math.max(y * k, -0.5 + 0.05 * noise3(x * 3, seed, z * 3)), z * k);
  }
  g.computeVertexNormals();
  return g;
}
protoDef('rmerlon', [{ mat: 'rubble', geo: uvPlanar(new RoundedBoxGeometry(1, 1, 1, 2, 0.08).translate(0, 0.5, 0)) }]);
function brokenTop(x0, x1, z0, z1, y, seed) { // ragged merlon-like stubs along a wall top
  const r = rng('broken' + seed), L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(2, Math.round(L / 1.6));
  for (let i = 0; i < n; i++) {
    if (r() < 0.35) continue;
    const t = (i + 0.5) / n, h = 0.4 + r() * 2.2;
    place('rmerlon', xf([lerp(x0, x1, t), y - 0.1, lerp(z0, z1, t)], Math.atan2(x1 - x0, z1 - z0) + Math.PI / 2, [L / n * 0.9, h, 1.1]));
  }
}

// ---- Hagrid's hut: two stone drums under slate cones, a porch, a fenced pumpkin patch (see buildHagrid)
function pumpkinGeo() {
  const pts = [];
  for (let i = 0; i <= 16; i++) { const t = i / 16, a = t * Math.PI; pts.push(new THREE.Vector2(Math.sin(a) * 1.0, (1 - Math.cos(a)) * 0.38)); }
  const g = new THREE.LatheGeometry(pts, 40);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), k = 1 - 0.07 * Math.pow(Math.abs(Math.cos(a * 5)), 0.6); p.setX(i, x * k); p.setZ(i, z * k); }
  g.computeVertexNormals();
  return g;
}
const HUT_U = { uHutY: { value: 0 } };   // the hut's floor level (moss gathers toward the foot of the walls)
M.hutstone = procMat({ name: 'hutstone', rgb: [0.15, 0.142, 0.125], rough: 0.92, bump: 1, uv: true, frag: /* glsl */ `
  // coursed rubble (ref/grounds q00, q01, q07): rough courses 0.3-0.5 m high, stones 0.45-1.1 m long, rounded corners,
  // ragged edges, deep dark joints; moss on the upper edges and toward the foot of the wall
  vec2 q = UV + vec2(cgVn(vec3(UV * 2.2, 1.0)) * 0.16, cgVn(vec3(UV * 1.6, 4.0)) * 0.12);
  float row = floor(q.y / 0.4), rh = 0.4, fy = fract(q.y / 0.4) * rh;
  float sw = 0.45 + 0.6 * cgH21(vec2(row, 7.0)), u = q.x + cgH21(vec2(row, 2.0)) * 3.0;
  float cell = floor(u / sw), fx = fract(u / sw) * sw, id = cgH21(vec2(cell, row));
  float j0 = (cgH21(vec2(cell, row) + 1.1) - 0.3) * 0.12, j1 = (cgH21(vec2(cell, row) + 2.9) - 0.3) * 0.12;   // stones of uneven height
  vec2 d = vec2(min(fx, sw - fx), min(fy - j0, rh - j1 - fy));
  float r = 0.13, e = min(d.x, d.y);
  e = min(e, r - length(max(vec2(r) - d, 0.0)) + 0.0);   // rounded corners
  float px = length(fwidth(UV));
  float joint = smoothstep(0.012, 0.035 + px, e);
  // each stone its own tone (blue-grey, grey, ochre, dark), a little lighter toward its upper face where it bulges
  float id2 = cgH21(vec2(cell, row) + 5.3);
  vec3 tone = id2 < 0.3 ? vec3(0.78, 0.8, 0.82) : id2 < 0.62 ? vec3(0.95, 0.93, 0.88) : id2 < 0.85 ? vec3(1.18, 1.0, 0.72) : vec3(0.62, 0.62, 0.6);
  vec3 c = tone * mix(0.85, 1.15, id) * (0.82 + 0.3 * cgFbm3(P * 1.7)) * (0.9 + 0.2 * cgVn(P * 7.0)) * (0.88 + 0.22 * smoothstep(0.0, rh, fy));
  c *= mix(0.3, 1.0, joint);
  float top = smoothstep(rh * 0.65, rh, fy) * joint;   // the upper edge of each stone catches moss
  float moss = smoothstep(0.4, 0.75, cgFbm3(P * 0.9 + 3.0)) * (0.45 + 0.55 * smoothstep(2.5, 0.0, P.y - vInstY));
  c = mix(c, vec3(0.2, 0.27, 0.09), clamp(moss * 0.6 + top * moss * 0.4, 0.0, 0.85));
  diffuseColor.rgb *= c; cgH = sqrt(clamp(e / 0.1, 0.0, 1.0)) * 0.05 + cgVn(P * 9.0) * 0.006; cgAO = mix(0.4, 1.0, joint); cgRough = 0.92;
`, head: 'uniform float uHutY;\n#define vInstY uHutY\n', uniforms: HUT_U });
M.stoneslate = procMat({ name: 'stoneslate', rgb: [0.075, 0.078, 0.08], rough: 0.8, bump: 1, uv: true, frag: /* glsl */ `
  // big rough stone slates (ref/grounds q00, q07): rows about 0.55 m, slates 0.45-1.1 m wide with jittered joints,
  // ragged bottom edges that overhang the row below, each slate a little different in tone and tilt, moss in patches
  float rh = 0.55, row = floor(UV.y / rh), fy = fract(UV.y / rh) * rh;
  float u = UV.x + cgH21(vec2(row, 1.3)) * 3.0, sw = 0.75;
  float k = floor(u / sw);
  float jk = (cgH21(vec2(k, row)) - 0.5) * 0.6;
  if (u < (k + jk) * sw) { k -= 1.0; jk = (cgH21(vec2(k, row)) - 0.5) * 0.6; }
  float jn = (cgH21(vec2(k + 1.0, row)) - 0.5) * 0.6;
  float left = (k + jk) * sw, right = (k + 1.0 + jn) * sw, fx = u - left, w = right - left;
  float id = cgH21(vec2(k, row) + 3.7), id2 = cgH21(vec2(k, row) + 9.1);
  float bot = 0.02 + 0.1 * id2 + 0.05 * cgVn(vec3(u * 5.0, row, 2.0));       // the ragged lower edge
  float px = length(fwidth(UV));
  float joint = smoothstep(0.0, 0.03 + px, min(fx, w - fx));
  float under = 1.0 - smoothstep(bot - 0.02, bot + 0.01 + px, fy);          // the shadowed strip of the row below
  float edge = mix(joint * (1.0 - under * 0.75), 0.75, smoothstep(0.04, 0.15, px));
  vec3 c = vec3(0.7 + 0.55 * id) * mix(vec3(1.0), vec3(1.06, 1.0, 0.9), id2) * (0.85 + 0.25 * cgVn(P * 3.0)) * mix(0.35, 1.0, edge);
  c *= 0.85 + 0.3 * smoothstep(0.0, rh, fy - bot);                            // each slate lighter toward its upper part, as it tilts
  float moss = smoothstep(0.38, 0.72, cgFbm3(P * 0.55 + 1.0));
  c = mix(c, vec3(0.28, 0.35, 0.11) * (0.75 + 0.5 * id), moss * 0.65 * (0.6 + 0.4 * under));
  diffuseColor.rgb *= c;
  cgH = (1.0 - clamp((fy - bot) / rh, 0.0, 1.0)) * 0.07 * (1.0 - under) + id * 0.015 + cgVn(P * 11.0) * 0.004;
  cgRough = 0.72 + 0.2 * id; cgAO = mix(0.55, 1.0, edge);
` });
// a round drum: a battered lathe of n sides with metric uv (u round the wall, v up)
function hutDrum(cx, cz, y0, h, r0, r1, n) {
  const g = new THREE.LatheGeometry([[0.01, -2.5], [r0 + 0.25, -2.5], [r0, 0], [r1, h], [0.01, h]].map(([a, b]) => new THREE.Vector2(a, b)), n);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, Math.atan2(p.getZ(i), p.getX(i)) * (r0 + r1) / 2, p.getY(i));
  put('hutstone', g.translate(cx, y0, cz));
}
function buildHagrid(look) {
  const [cx, cz, r0] = SITE_BY.hagrid.circle, g = look(cx, cz) - 0.3;
  HUT_U.uHutY.value = g;
  const door = PATH_PTS.find((p) => Math.hypot(p[0] - cx, p[1] - cz) < 18) || [cx + 10, cz - 10];
  const dl = Math.hypot(door[0] - cx, door[1] - cz), dx = (door[0] - cx) / dl, dz = (door[1] - cz) / dl, tx = -dz, tz = dx;
  const R = r0 - 0.9, EH = 3.0;
  const W = (u, y, v) => [cx + tx * u + dx * v, g + y, cz + tz * u + dz * v];   // u to the right of the door side, v toward the path
  // plan (ref/grounds q07): the big drum, the smaller one to its right and a little behind, the porch in the angle where
  // their walls meet, facing out between them
  const r2 = R * 0.62, us = R + r2 * 0.35, vs = -0.5, S = W(us, 0, vs), sx = S[0], sz = S[2];
  hutDrum(cx, cz, g, EH, R, R - 0.3, 11);
  hutDrum(sx, sz, g, EH + 0.35, r2, r2 - 0.2, 9);
  const roofCone = (x, z, y, r, h, n, seed) => {   // a lumpy, sagging roof of big slates
    const rg = cone(x, z, y, r, h, { n, kick: 0.1, mat: 'stoneslate', finial: false }), p = rg.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const vx = p.getX(i) - x, vy = p.getY(i) - y, vz = p.getZ(i) - z, rr = Math.hypot(vx, vz);
      if (rr < 0.3) continue;
      const t = vy / h, k = 0.2 * noise3(p.getX(i) * 0.7 + seed, p.getY(i) * 0.9, p.getZ(i) * 0.7) * Math.sin(Math.PI * Math.min(1, t * 1.2)) - 0.12 * Math.sin(Math.PI * t);
      p.setXYZ(i, p.getX(i) + vx / rr * k * 0.6, p.getY(i) + k, p.getZ(i) + vz / rr * k * 0.6);
    }
    rg.computeVertexNormals();
  };
  roofCone(cx, cz, g + EH - 0.15, R + 0.6, 4.4, 11, 1.7);
  roofCone(sx, sz, g + EH + 0.2, r2 + 0.45, 4.9, 9, 5.3);
  for (const [px, pz, py, hh] of [[cx, cz, g + EH + 4.1, 2.6], [sx, sz, g + EH + 4.95, 2.4]]) {
    put('lead', new THREE.CylinderGeometry(0.32, 0.4, 0.35, 10).translate(px, py, pz));
    spike(px, py + 0.15, pz, hh, 0.11);
  }
  // a small vent dormer on the main roof, front left
  { const a = Math.atan2(dz, dx) - 0.7, rr = (R + 1.0) * 0.5, vx = cx + Math.cos(a) * rr, vz = cz + Math.sin(a) * rr, vy = g + EH + 1.85;
    put('stoneslate', uvPlanar(new THREE.BoxGeometry(0.9, 0.7, 1.2).rotateY(-a + Math.PI / 2).translate(vx, vy, vz)));
    put('paintBlack', new THREE.PlaneGeometry(0.6, 0.4).rotateY(Math.atan2(Math.cos(a), Math.sin(a))).translate(vx + Math.cos(a) * 0.62, vy, vz + Math.sin(a) * 0.62)); }
  // the porch: where the two walls meet in front, two stone piers grown out of them, a heavy slab across, the door set back
  const dd = Math.hypot(us, vs), ea = (R * R - r2 * r2 + dd * dd) / (2 * dd), eh = Math.sqrt(Math.max(0, R * R - ea * ea));
  const iu = (us / dd) * ea - (vs / dd) * eh, iv = (vs / dd) * ea + (us / dd) * eh;            // the front intersection of the two circles
  let nu = iu / R + (iu - us) / r2, nv = iv / R + (iv - vs) / r2; { const l = Math.hypot(nu, nv); nu /= l; nv /= l; }
  const Q = (a, y, c) => W(iu + nv * a + nu * (c + 1.3), y, iv - nu * a + nv * (c + 1.3));   // a across the porch, c outward (0 = the door's plane, just out of the notch)
  const qry = Math.atan2(tx * nu + dx * nv, tz * nu + dz * nv);
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) {   // each pier laid in big blocks, a little uneven
    const w = 1.0 + 0.12 * Math.sin(k * 2.1 + s), c = Q(s * 1.25, k * 0.66 + 0.33, -0.25);
    put('hutstone', uvPlanar(new RoundedBoxGeometry(w, 0.68, 2.3 + 0.12 * Math.cos(k * 1.7), 2, 0.08).rotateY(qry + 0.04 * Math.sin(k + s)).translate(...c)));
  }
  put('hutstone', uvPlanar(new RoundedBoxGeometry(4.1, 0.55, 3.0, 2, 0.12).rotateY(qry).rotateX(0.03).translate(...Q(0, 2.95, 0.05))));
  put('hutstone', uvPlanar(new THREE.BoxGeometry(1.6, 0.35, 2.4).rotateY(qry).translate(...Q(0, 2.55, -0.6))));
  { const dg = new THREE.PlaneGeometry(1.45, 2.5); const duv = dg.attributes.uv; for (let i = 0; i < duv.count; i++) duv.setXY(i, duv.getX(i), duv.getY(i) * 1.8);
    put('door', dg.rotateY(qry).translate(...Q(0, 1.25 + 0.12, -1.0)));
    for (const y of [0.7, 2.1]) put('paintBlack', new THREE.BoxGeometry(1.2, 0.08, 0.04).rotateY(qry).translate(...Q(-0.1, y, -0.97)));
    put('paintBlack', new THREE.TorusGeometry(0.09, 0.02, 6, 12).rotateY(qry).translate(...Q(0.5, 1.3, -0.95))); }
  for (let k = 0; k < 3; k++) put('hutstone', uvPlanar(new RoundedBoxGeometry(2.7 - k * 0.25, 0.24, 0.8, 2, 0.06).rotateY(qry + 0.05 * (k - 1)).translate(...Q(0.05 * k, 0.12 - k * 0.24, 1.25 + k * 0.66))));
  // a lantern on a bracket beside the door
  { const c = Q(-1.95, 2.3, 0.9); beam(Q(-1.8, 2.4, 0.55), c, 0.05, 'paintBlack'); put('lamp', new THREE.BoxGeometry(0.22, 0.32, 0.22).translate(c[0], c[1] - 0.25, c[2])); put('paintBlack', new THREE.ConeGeometry(0.2, 0.18, 4).rotateY(Math.PI / 4).translate(c[0], c[1] - 0.02, c[2])); }
  // windows: small, square-headed, leaded, under chunky lintels on stone sills
  for (const [da, onSmall] of [[-0.45, false], [-1.5, false], [2.6, false], [0.75, true]]) {
    const a = Math.atan2(dz, dx) + da, ox = onSmall ? sx : cx, oz = onSmall ? sz : cz, rr = onSmall ? r2 : R, nx = Math.cos(a), nz = Math.sin(a);
    const wx = ox + nx * (rr - 0.05), wz = oz + nz * (rr - 0.05), wr = Math.atan2(nx, nz), wh = onSmall ? 0.85 : 0.95;
    win('rect', [wx, g + 1.0, wz], nx, nz, onSmall ? 0.8 : 1.15, wh, 1, 0.9);
    put('hutstone', uvPlanar(new RoundedBoxGeometry(onSmall ? 1.3 : 1.75, 0.36, 0.6, 2, 0.06).rotateY(wr).translate(wx + nx * 0.2, g + 1.0 + wh + 0.2, wz + nz * 0.2)));
    put('hutstone', uvPlanar(new RoundedBoxGeometry(onSmall ? 1.2 : 1.6, 0.18, 0.55, 2, 0.04).rotateY(wr).translate(wx + nx * 0.22, g + 0.88, wz + nz * 0.22)));
  }
  // the chimney at the back, where the two roofs meet
  { const C = W(R * 0.55, 0, -R * 0.6), chx = C[0], chz = C[2], ca = Math.atan2(dz, dx);
    put('hutstone', uvPlanar(new THREE.BoxGeometry(1.5, EH + 5.6, 1.3).rotateY(-ca).translate(chx, g + (EH + 5.6) / 2, chz)));
    put('hutstone', uvPlanar(new RoundedBoxGeometry(1.8, 0.35, 1.6, 2, 0.05).rotateY(-ca).translate(chx, g + EH + 5.7, chz)));
    put('terracotta', new THREE.CylinderGeometry(0.2, 0.24, 0.6, 10).translate(chx, g + EH + 6.15, chz)); }
  // the pumpkin patch on the downhill side, fenced
  const px = cx - tx * 13 - dx * 2, pz = cz - tz * 13 - dz * 2;   // on the side away from the porch
  const corners = [[-7, -5], [7, -5], [7, 5], [-7, 5]].map(([u, v]) => [px + tx * u + dx * v, pz + tz * u + dz * v]);
  for (let i = 0; i < 4; i++) {
    const [ax, az] = corners[i], [bx, bz] = corners[(i + 1) % 4], L = Math.hypot(bx - ax, bz - az), n = Math.round(L / 2.2);
    for (let k = 0; k <= n; k++) { const x = lerp(ax, bx, k / n), z = lerp(az, bz, k / n), y = look(x, z); beam([x, y - 0.3, z], [x, y + 1.3, z], 0.16); }
    for (const h of [0.55, 1.15]) beam([ax, look(ax, az) + h, az], [bx, look(bx, bz) + h, bz], 0.09);
  }
  const R2 = rng('pumpkins'), pk = [];
  for (let i = 0; i < 11; i++) {
    const u = (R2() - 0.5) * 11, v = (R2() - 0.5) * 7.5, x = px + tx * u + dx * v, z = pz + tz * u + dz * v, s = 0.6 + R2() * 1.1;
    pk.push(xf([x, look(x, z) - 0.05, z], R2() * 6.28, [s, s * (0.9 + R2() * 0.3), s]));
  }
  // a wheelbarrow by the wall carrying a giant pumpkin, and a couple of crates
  { const a = Math.atan2(dz, dx) - 1.25, bx = cx + Math.cos(a) * (R + 1.6), bz = cz + Math.sin(a) * (R + 1.6), by = look(bx, bz), br = -a;
    const W2 = (u, y, v) => [bx + Math.cos(-br) * u - Math.sin(-br) * v, by + y, bz + Math.sin(-br) * u + Math.cos(-br) * v];
    put('timber', uvPlanar(new THREE.BoxGeometry(1.7, 0.5, 1.05).rotateY(br).translate(...W2(0, 0.75, 0))));
    for (const s of [-1, 1]) beam(W2(-0.9, 0.55, s * 0.45), W2(1.6, 0.85, s * 0.35), 0.08, 'timber');
    put('timber', new THREE.CylinderGeometry(0.42, 0.42, 0.1, 14).rotateX(Math.PI / 2).rotateY(br).translate(...W2(-1.0, 0.42, 0)));
    pk.push(xf(W2(0, 1.0, 0), 0.4, [1.0, 0.85, 1.0]));
    for (const [u, v, s] of [[2.6, 0.6, 0.9], [3.3, -0.3, 0.7]]) put('timber', uvPlanar(new THREE.BoxGeometry(s * 1.2, s * 0.8, s).rotateY(br + u).translate(...W2(u, s * 0.4, v)))); }
  addInst(pumpkinGeo(), M.pumpkin, pk);
  // a stack of firewood by the wall
  const fa = Math.atan2(dz, dx) - 0.7, fnx = Math.cos(fa), fnz = Math.sin(fa), ftx = -fnz, ftz = fnx;
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3 - row; col++) {
    const x = cx + fnx * (R + 0.5 + col * 0.45 + row * 0.22), z = cz + fnz * (R + 0.5 + col * 0.45 + row * 0.22);
    put('timber', new THREE.CylinderGeometry(0.22, 0.22, 2.4, 8).rotateZ(Math.PI / 2).rotateY(-Math.atan2(ftz, ftx)).translate(x, g + 0.25 + row * 0.4, z));
  }
}


// ---- paths, the stream, and the hospital wing as massing
function buildPathsAndStream() {
  ribbon(PATH_PTS, 2.6, 'dirt', 0.14);
  const zs = []; for (let z = -330; z <= zShore(-262) + 4; z += 6) zs.push(z);
  const sp = zs.map((z) => [gorgeX(z), z]);
  ribbon(sp, 3.2, 'stream', 0.25, (x, z) => Math.max(LAKE_Y + 0.05, groundH(x, z)), 2);
  // rock outcrops and boulders on the far hill, clear of the path and the landmarks
  const R = rng('hillrocks'), list = [];
  for (let i = 0; i < 220 && list.length < 70; i++) {
    const x = -560 + R() * 260, z = -150 + R() * 260, y = groundH(x, z);
    if (y < LAKE_Y + 2 || nearPolyline(x, z, PATH_PTS, 6) || x > gorgeX(z) - 30 || (x > -360 && Math.abs(z + 26) < 30)) continue;
    if (['stones', 'hagrid', 'willow'].some((id) => Math.hypot(x - SITE_BY[id].circle[0], z - SITE_BY[id].circle[1]) < SITE_BY[id].circle[2] + 6)) continue;
    const s = 1.2 + Math.pow(R(), 2) * 4.5;
    list.push(xf([x, y - s * 0.35, z], R() * 6.28, [s * (1 + R()), s * (0.5 + R() * 0.4), s * (0.8 + R() * 0.6)], (R() - 0.5) * 0.3, (R() - 0.5) * 0.3));
  }
  addInst(angularRockGeo(11.1), M.rock, list);
}
function buildWest(look) {
  squash(buildClockTower, -10, 0.82);
  buildClockCourt();
  buildHospital();
  buildWoodenBridge();
  buildStoneCircle(look);
  buildRuins(look);
  buildHagrid(look);
  buildWillow(look);
  buildPathsAndStream();
}
