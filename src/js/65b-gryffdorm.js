// ------------------------------------------------------------------ the Gryffindor boys' dormitory (after the Leavesden set: ref/gryffindor
// c00, c01, c09, c11-c16; Half-Blood Prince) over the common room, in the same set, reached by the turret stair from the
// common room's south-east doorway (65-gryffindor.js): a round tower room, twelve-sided, its stone walls to about 3 m
// under a moulded oak wall plate, a boarded knee wall and a conical boarded roof on rafters, two great rough tie beams
// crossing under it with a king post and braces (c11). In the middle a cast-iron stove with a slotted collar and a domed
// lid in a round wire guard on a stone slab, its pipe going up through the roof (c14, c15). Round the walls five oak
// four-poster beds (Harry, Ron, Neville, Dean, Seamus): a moulded tester with the bed's number on the frieze, deep red
// velvet curtains at the posts and red curtains with gold stars inside (c11, c15), a deep panelled box frame, white
// bedding under red blankets (a knitted patchwork on Ron's, c13), a trunk with its owner's initials at the foot (c12);
// beside each bed a cupboard with a washbowl and a pedimented mirror cabinet over it, a hook rail with a school robe and
// a striped scarf, a lamp on the back panel (c15, HBP). Between the beds narrow leaded lancets in deep embrasures.
// Dormitory coordinates: facet k's centre at angle 3pi/4 + k pi/6 (facet 0, the door, faces the turret).
const GDM = { R: 4.6, T: 1.0, wall: 3.0, knee: 4.2, apex: 7.6 };   // c15: the trunks almost touch the stove's guard
GDM.Y = GCR.H + 1.4;   // the dormitory floor
GDM.L = 2 * GDM.R * Math.tan(Math.PI / 12);
function gdF(k) { const a = (3 * Math.PI) / 4 + (k * Math.PI) / 6; return { a, d: [Math.sin(a), -Math.cos(a)], t: [Math.cos(a), Math.sin(a)], ry: -a }; }
const gdP = (k, u, y, w) => { const f = gdF(k), r = GDM.R - w; return [f.d[0] * r + f.t[0] * u, GDM.Y + y, f.d[1] * r + f.t[1] * u]; };
const gdM = (k, u = 0, y = 0, w = 0, turn = 0, s = 1) => xf(gdP(k, u, y, w), gdF(k).ry + turn, s);
function gdPut(k, mat, g) { return put(mat, g.applyMatrix4(gdM(k))); }
function gdBox(k, x0, x1, y0, y1, z0, z1, mat, bevel = 0.02) {
  const w = x1 - x0, h = y1 - y0, d = z1 - z0;
  const g = (bevel > 0 ? new RoundedBoxGeometry(w, h, d, 2, Math.min(bevel, w / 4, h / 4, d / 4)) : new THREE.BoxGeometry(w, h, d)).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return gdPut(k, mat, uvPlanar(g));
}
const GDM_BEDS = [[2, 'H.P', 'CXXI'], [4, 'R.W', 'CXXII'], [6, 'N.L', 'CXXIII'], [8, 'D.T', 'CXXIV'], [10, 'S.F', 'CXXV']];   // facet, trunk initials, the number on the tester

// ---- materials
// the floor: wide oak boards, staggered butt joints, each board its own tone, worn paler where feet go
M.gboards = procMat({ name: 'gboards', rgb: [1, 1, 1], rough: 0.6, bump: 1, frag: /* glsl */ `
  vec2 q = P.xz; float w = 0.24, row = floor(q.y / w), len = 1.6 + 1.6 * cgH21(vec2(row, 3.0));
  float u = q.x + cgH21(vec2(row, 7.0)) * len, cell = floor(u / len);
  vec2 f = vec2(fract(u / len) * len, fract(q.y / w) * w); float e = min(min(f.x, len - f.x), min(f.y, w - f.y));
  float id = cgH21(vec2(cell, row)), px = length(fwidth(q)), gap = smoothstep(0.002, 0.002 + max(px, 0.004), e);
  float gr = cgVn(vec3(u * 1.2, q.y * 45.0, id * 9.0)) * 0.6 + cgVn(vec3(u * 9.0, q.y * 140.0, 2.0)) * 0.4;
  vec3 c = mix(vec3(0.11, 0.075, 0.048), vec3(0.2, 0.145, 0.095), id) * (0.75 + 0.45 * gr);
  c *= mix(1.0, 1.25, smoothstep(0.55, 0.85, cgFbm3(vec3(q * 0.6, 4.0))));   // worn paths
  c *= mix(0.3, 1.0, gap);
  diffuseColor.rgb *= c; cgRough = mix(0.45, 0.75, gr); cgH = gap * 0.002 + gr * 0.0008;
` });
// boards on end (the knee wall and the roof): 20 cm boards along UV.y with dark joints (uv in metres)
M.planks = procMat({ name: 'planks', rgb: [1, 1, 1], rough: 0.8, uv: true, bump: 1, frag: /* glsl */ `
  float w = 0.2, col = floor(UV.x / w), fx = fract(UV.x / w) * w, id = cgH21(vec2(col, 5.0));
  float px = length(fwidth(UV)), gap = smoothstep(0.003, 0.003 + max(px, 0.004), min(fx, w - fx));
  float gr = cgVn(vec3(UV.x * 30.0, UV.y * 1.5, id * 7.0));
  vec3 c = mix(vec3(0.06, 0.04, 0.026), vec3(0.12, 0.08, 0.05), id) * (0.75 + 0.45 * gr) * mix(0.35, 1.0, gap);
  diffuseColor.rgb *= c; cgH = gap * 0.003 + gr * 0.001;
` });
M.castIron = procMat({ name: 'castIron', rgb: [0.16, 0.16, 0.17], metal: 0.6, rough: 0.55, bump: 1, frag: /* glsl */ `
  float n = cgFbm3(P * 9.0), r = smoothstep(0.62, 0.82, cgFbm3(P * 4.0 + 3.0));
  diffuseColor.rgb = mix(diffuseColor.rgb * (0.7 + 0.5 * n), vec3(0.2, 0.09, 0.04), r * 0.6); cgRough = 0.45 + 0.4 * r; cgMetal = 0.6 - 0.5 * r; cgH = n * 0.001;
` });
// the stove's collar: slots all round (uv in metres), the fire's glow behind them when the lamps are lit
M.grille = procMat({ name: 'grille', rgb: [0.16, 0.16, 0.17], metal: 0.6, rough: 0.5, uv: true, side: THREE.DoubleSide, frag: /* glsl */ `
  float s = abs(fract(UV.x / 0.035) - 0.5), b = UV.y; if (s < 0.22 && b > 0.025 && b < 0.135) discard;
` });
M.stoveGlow = procMat({ name: 'stoveGlow', rgb: [0.02, 0.01, 0.0], rough: 1, frag: /* glsl */ `
  cgEmit = vec3(1.0, 0.35, 0.08) * (0.15 + 1.6 * uLamp) * (0.6 + 0.6 * cgFbm3(P * 30.0 + vec3(0.0, uTime * 0.6, 0.0)));
` });
// bed curtains: deep red velvet, double sided; the inner ones red wool with gold stars (c11)
M.curtain = procMat({ name: 'curtain', rgb: [0.15, 0.011, 0.015], rough: 0.85, side: THREE.DoubleSide, bump: 1, frag: /* glsl */ `
  vec3 V = normalize(cameraPosition - P); float sheen = pow(1.0 - abs(dot(N, V)), 2.0), cr = cgFbm3(P * 8.0);
  diffuseColor.rgb *= (0.6 + 0.35 * cr) * (1.0 + 1.6 * sheen); cgRough = 0.8; cgSpec = 0.3; cgH = cr * 0.0015;
` });
M.starCloth = procMat({ name: 'starCloth', rgb: [1, 1, 1], rough: 0.85, uv: true, side: THREE.DoubleSide, frag: /* glsl */ `
  vec2 g = UV / 0.13; vec2 c = floor(g); g = fract(g) - 0.5; g += (vec2(cgH21(c), cgH21(c + 3.1)) - 0.5) * 0.3;
  float a = atan(g.y, g.x), r = length(g), star = 1.0 - smoothstep(0.0, 0.02, r - 0.11 * (0.45 + 0.55 * abs(cos(a * 3.0))));
  vec3 col = mix(vec3(0.17, 0.016, 0.018) * (0.8 + 0.3 * cgFbm3(P * 9.0)), vec3(0.5, 0.33, 0.08), star * step(0.45, cgH21(c + 7.0)));
  diffuseColor.rgb = col; cgRough = mix(0.85, 0.45, star);
` });
M.linen = procMat({ name: 'linen', rgb: [0.62, 0.6, 0.55], rough: 0.9, bump: 1, frag: /* glsl */ `
  float n = cgFbm3(P * 7.0); diffuseColor.rgb *= 0.85 + 0.2 * n; cgH = n * 0.004 + cgVn(P * 200.0) * 0.0003;
` });
M.wool = procMat({ name: 'wool', rgb: [0.15, 0.022, 0.02], rough: 0.95, bump: 1, frag: /* glsl */ `
  float n = cgFbm3(P * 6.0), f = cgVn(P * 260.0); diffuseColor.rgb *= 0.75 + 0.35 * n + 0.1 * f; cgH = n * 0.003 + f * 0.0004;
` });
// a knitted patchwork blanket (Ron's, c13): squares of coloured wool (uv in metres)
M.patch = procMat({ name: 'patch', rgb: [1, 1, 1], rough: 0.95, uv: true, bump: 1, frag: /* glsl */ `
  vec2 c = floor(UV / 0.14); float h = cgH21(c), h2 = cgH21(c + 5.3);
  vec3 col = 0.5 + 0.5 * cos(6.2831 * (h + vec3(0.0, 0.33, 0.67))); col = mix(mix(col, vec3(0.55, 0.45, 0.35), 0.45), vec3(0.75, 0.7, 0.6), step(0.8, h2)) * 0.32;   // faded knitted wool
  vec2 f = fract(UV / 0.14); float seam = smoothstep(0.0, 0.06, min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)));
  float k = cgVn(vec3(UV * vec2(180.0, 90.0), h * 9.0));
  diffuseColor.rgb = col * (0.75 + 0.3 * k) * mix(0.6, 1.0, seam); cgH = k * 0.0008 + seam * 0.002;
` });
M.trunk = procMat({ name: 'trunk', rgb: [0.2, 0.1, 0.05], rough: 0.55, bump: 1, frag: /* glsl */ `
  float n = cgFbm3(P * 12.0), w = smoothstep(0.55, 0.8, cgFbm3(P * 5.0 + 2.0));
  diffuseColor.rgb *= (0.75 + 0.4 * n) * (1.0 + 0.5 * w); cgRough = 0.45 + 0.3 * w; cgH = n * 0.001;
` });
M.strap = procMat({ name: 'strap', rgb: [0.07, 0.035, 0.018], rough: 0.5 });
M.robe = procMat({ name: 'robe', rgb: [0.025, 0.024, 0.028], rough: 0.9, side: THREE.DoubleSide, bump: 1, frag: /* glsl */ `
  float n = cgFbm3(P * 9.0); diffuseColor.rgb *= 0.8 + 0.4 * n; cgH = n * 0.002;
` });
M.mirror = procMat({ name: 'mirror', rgb: [0.5, 0.5, 0.48], metal: 1, rough: 0.08, frag: /* glsl */ `
  diffuseColor.rgb *= 0.7 + 0.3 * smoothstep(0.3, 0.7, cgFbm3(P * 6.0)); cgRough = 0.05 + 0.25 * smoothstep(0.6, 0.85, cgFbm3(P * 9.0));
` });
M.wicker = procMat({ name: 'wicker', rgb: [0.32, 0.22, 0.11], rough: 0.85, uv: true, bump: 1, frag: /* glsl */ `
  float a = sin(UV.x * 160.0) * 0.5 + 0.5, b = sin(UV.y * 90.0 + step(0.5, fract(UV.x * 25.0)) * 3.14) * 0.5 + 0.5;
  diffuseColor.rgb *= 0.65 + 0.45 * a * b; cgH = a * b * 0.002;
` });
// a Gryffindor scarf: broad maroon and gold bands across its length (vLoc.x along the scarf)
M.gscarf = procMat({ name: 'gscarf', rgb: [1, 1, 1], rough: 0.95, vc: true, bump: 1, side: THREE.DoubleSide, vhead: 'varying vec3 vLoc;\n', vert: 'vLoc = position;\n', head: 'varying vec3 vLoc;\n', frag: /* glsl */ `
  float b = fract(vLoc.x / 0.14); vec3 c = b < 0.62 ? vec3(0.24, 0.015, 0.02) : vec3(0.62, 0.38, 0.06);
  float k = cgVn(vec3(vLoc * 220.0)); diffuseColor.rgb *= c * (0.8 + 0.3 * k); cgH = k * 0.0008;
` });
// painted letters (the trunks' initials, the beds' numbers): a canvas with alpha
function letterMat(text, col, px = 64, font = 'bold') {
  const t = canvasTex(256, 96, (g) => { g.clearRect(0, 0, 256, 96); g.fillStyle = col; g.font = `${font} ${px}px "Times New Roman", serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, 50); });
  return procMat({ name: 'decal', rgb: [1, 1, 1], rough: 0.6, std: { map: t, alphaTest: 0.5 } });
}

// ---- pieces
// a curtain panel hanging from y = h down to 0, w wide, in vertical folds; gathered (narrow at the top) when tied
function curtainGeo(w, h, folds, amp, tie = 0) {
  const g = new THREE.PlaneGeometry(w, h, 32, 12).translate(0, h / 2, 0), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), t = 1 - y / h, s = 1 - tie * Math.exp(-Math.pow((y - h * 0.38) / (h * 0.12), 2)) * 0.6;
    p.setXYZ(i, x * s, y, amp * (0.6 + 0.4 * t) * Math.sin((x / w) * folds * Math.PI * 2 + 0.7) + 0.01 * Math.sin(y * 7 + x * 3));
  }
  g.computeVertexNormals();
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i), p.getY(i));
  return g;
}
// a hanging school robe: a flattened, fluted cone from the shoulders, a hood fold at the back
function robeGeo() {
  const pr = []; for (let i = 0; i <= 12; i++) { const t = i / 12; pr.push(new THREE.Vector2(0.06 + 0.22 * Math.pow(t, 0.7) + (i === 0 ? 0 : 0.03), -t * 1.25)); }
  const g = new THREE.LatheGeometry(pr.reverse(), 24), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = p.getY(i), a = Math.atan2(z, x), t = -y / 1.25, k = 1 + 0.12 * Math.sin(a * 7) * t; p.setXYZ(i, x * k, y, z * k * 0.42); }
  g.computeVertexNormals();
  return merge([g, new THREE.SphereGeometry(0.14, 12, 8).scale(1, 0.8, 0.5).translate(0, -0.12, -0.08)]);
}
// a four-poster (local: the head at z = 0 against the panelling, the foot toward +z, x across; floor at y = 0)
function gdBedParts() {
  const W = 0.6, Z1 = 2.1, top = 2.42, wood = [];
  for (const sx of [-1, 1]) for (const z of [0.06, Z1]) wood.push(new RoundedBoxGeometry(0.11, top, 0.11, 2, 0.015).translate(sx * W, top / 2, z));
  for (const sx of [-1, 1]) { wood.push(new THREE.BoxGeometry(0.05, 0.5, Z1 - 0.1).translate(sx * (W - 0.06), 0.4, Z1 / 2 + 0.03)); wood.push(new THREE.BoxGeometry(0.07, 0.3, Z1 + 0.16).translate(sx * (W + 0.02), top - 0.17, Z1 / 2 + 0.03)); }
  wood.push(new THREE.BoxGeometry(2 * W - 0.1, 0.6, 0.05).translate(0, 0.45, Z1 - 0.03));                                  // the foot board
  wood.push(new THREE.BoxGeometry(2 * W - 0.1, 1.15, 0.06).translate(0, 0.72, 0.08));                                       // the head board
  for (const x of [-0.27, 0.27]) wood.push(new RoundedBoxGeometry(0.42, 0.62, 0.03, 1, 0.01).translate(x, 0.86, 0.12));    // its raised panels
  wood.push(new THREE.BoxGeometry(2 * W + 0.16, 0.3, 0.07).translate(0, top - 0.17, Z1 + 0.06), new THREE.BoxGeometry(2 * W + 0.16, 0.3, 0.07).translate(0, top - 0.17, 0.0));   // friezes
  wood.push(new RoundedBoxGeometry(2 * W + 0.3, 0.07, Z1 + 0.32, 1, 0.02).translate(0, top + 0.035, Z1 / 2 + 0.03));         // the cornice
  wood.push(new THREE.BoxGeometry(2 * W + 0.2, 0.04, Z1 + 0.22).translate(0, top - 0.33, Z1 / 2 + 0.03));                  // the moulding under the frieze
  wood.push(new THREE.BoxGeometry(2 * W - 0.1, 0.05, Z1 - 0.12).translate(0, 0.42, Z1 / 2 + 0.03));                        // the bottom of the box
  return merge(wood);
}

// ---- the room (built into the common room's set; points: its lights list)
function buildGryffDorm(sc, points) {
  const { R, T, Y } = GDM, L = GDM.L, Lo = 2 * (R + T) * Math.tan(Math.PI / 12), Rc = R / Math.cos(Math.PI / 12);
  const doorO = { hw: 0.68, ys: 1.95, k: 0.56 }, winO = { hw: 0.66, ys: 1.5, k: 0.62, dy: 0.5 }, winI = { ...winO, hw: 0.44 };   // windows: two lights over a seat
  // ---- the floor, the walls (stone to the wall plate), embrasures with leaded lancets, the doorway
  { const g = new THREE.CircleGeometry(R + T + 0.3, 48).rotateX(-Math.PI / 2).translate(0, Y, 0); put('gboards', g); }
  const W1 = traceryWindow(2 * winI.hw, winI.ys, 'pointed', winI.k, 2, [1.0], { frame: 0.08, mull: 0.07, depth: 0.14 });
  for (let k = 0; k < 12; k++) {
    const sh = pathPts(new THREE.Shape(), [[-Lo / 2, -0.3], [Lo / 2, -0.3], [Lo / 2, GDM.wall + 0.05], [-Lo / 2, GDM.wall + 0.05]]);
    const hole = k === 0 ? doorO : k % 2 ? winO : null;
    if (hole) sh.holes.push(pathPts(new THREE.Path(), opn(hole), true));
    gdPut(k, 'gashlar', uvPlanar(new THREE.ExtrudeGeometry(sh, { depth: T, bevelEnabled: false, curveSegments: 8 }).translate(0, 0, -T)));
    if (k % 2) {
      gdPut(k, 'gashlar', loftGeo(opn(winO), 0, opn(winI), -0.75, ([x, y]) => [-x, -(y - 1.8), 0]));
      gdPut(k, 'gashlar', W1.stone.clone().translate(0, winI.dy, -0.82)); gdPut(k, 'dglass', W1.glass.clone().translate(0, winI.dy, -0.82));
    }
    // the wall plate: a moulded oak beam round the top of the stone (c15), and the boarded knee wall above it
    gdBox(k, -L / 2 - 0.1, L / 2 + 0.1, GDM.wall, GDM.wall + 0.32, -0.05, 0.3, 'oak', 0.03);
    gdBox(k, -L / 2 - 0.1, L / 2 + 0.1, GDM.wall - 0.1, GDM.wall, -0.05, 0.2, 'oak', 0.02);
    { const g = uvPlanar(new THREE.BoxGeometry(Lo + 0.2, GDM.knee - GDM.wall - 0.3, 0.06).translate(0, (GDM.knee + GDM.wall + 0.3) / 2, -0.03)); gdPut(k, 'planks', g); }
    for (const u of [-L / 2, 0]) gdBox(k, u - 0.09, u + 0.09, GDM.wall + 0.3, GDM.knee + 0.05, -0.05, 0.13, 'oak', 0.02);   // studs
  }
  archSurroundD(0, doorO, 0.24, 0.08);
  // the door (oak boards, strap hinges) swung back against the wall inside
  {
    const leaf = new THREE.ExtrudeGeometry(pathPts(new THREE.Shape(), opn({ ...doorO, hw: 0.66 })), { depth: 0.07, bevelEnabled: false, curveSegments: 8 });
    const m = gdM(0, -0.7, 0, 0.02).multiply(new THREE.Matrix4().makeRotationY(-Math.PI / 2 + 0.12)).multiply(new THREE.Matrix4().makeTranslation(0.66, 0, 0));
    put('door', leaf.applyMatrix4(m));
    for (const y of [0.4, 1.7]) put('paintBlack', new THREE.BoxGeometry(1.0, 0.05, 0.012).translate(0.12, y, 0.075).applyMatrix4(m));
    // the sign on its outer face, now turned to the room (the books: the dormitory door carries the year)
    put('brass', new THREE.BoxGeometry(0.37, 0.1, 0.006).translate(0, 1.5, -0.003).applyMatrix4(m));
    addMesh(new THREE.PlaneGeometry(0.34, 0.085).rotateY(Math.PI).translate(0, 1.5, -0.0065).applyMatrix4(m), plaqueMat('Sixth Years'), { cast: false });
  }
  // ---- the roof: boards on a twelve-sided cone over the knee wall, rafters at the corners and between, two purlin rings,
  // two rough tie beams crossing on the wall plate with a king post and braces (c11)
  {
    const base = []; for (let i = 0; i < 12; i++) { const a = gdF(i).a + Math.PI / 12; base.push([Math.sin(a) * Rc, Math.cos(a) * Rc]); }   // (x, -z)
    const g = loftGeo(base, 0, base.map(() => [0, 0]), GDM.apex - GDM.knee, ([x, y]) => [-x, -y, -2]);
    put('planks', g.rotateX(-Math.PI / 2).translate(0, Y + GDM.knee, 0));
    for (let i = 0; i < 24; i++) {
      const a = gdF(0).a + Math.PI / 12 + (i * Math.PI) / 12, r0 = (i % 2 ? R : Rc) - 0.12, sx = Math.sin(a), sz = -Math.cos(a);
      beam([sx * r0, Y + GDM.knee - 0.05, sz * r0], [sx * 0.2, Y + GDM.apex - 0.25, sz * 0.2], i % 2 ? 0.16 : 0.22, 'oak');
    }
    for (const f of [0.35, 0.68]) for (let i = 0; i < 12; i++) {
      const a0 = gdF(i).a + Math.PI / 12, a1 = a0 + Math.PI / 6, r = (Rc - 0.25) * (1 - f), y = Y + GDM.knee + (GDM.apex - GDM.knee) * f - 0.2;
      beam([Math.sin(a0) * r, y, -Math.cos(a0) * r], [Math.sin(a1) * r, y, -Math.cos(a1) * r], 0.16, 'oak');
    }
    const ty = Y + GDM.wall + 0.55;
    beam([-R - 0.2, ty, 0], [R + 0.2, ty, 0], 0.44, 'oak'); beam([0, ty + 0.44, -R - 0.2], [0, ty + 0.44, R + 0.2], 0.4, 'oak');
    beam([0, ty + 0.6, 0], [0, Y + GDM.apex - 0.1, 0], 0.3, 'oak');
    for (const [x, z] of [[1.8, 0], [-1.8, 0], [0, 1.8], [0, -1.8]]) beam([x, ty + (x ? 0.2 : 0.62), z], [0, ty + 2.0, 0], 0.18, 'oak');
  }
  // ---- the stove (c14, c15): slab, cast-iron drum, slotted collar with the fire behind, domed lid, wire guard; the pipe
  {
    const c = [0, Y, 0];
    put('gashlar', uvPlanar(new RoundedBoxGeometry(1.45, 0.07, 1.45, 1, 0.02).translate(c[0], Y + 0.035, c[2])));
    const drum = [[0, 0.07], [0.4, 0.07], [0.41, 0.1], [0.37, 0.14], [0.34, 0.16]]; for (let i = 0; i <= 10; i++) drum.push([0.34 + (i % 2 ? 0.012 : 0), 0.18 + i * 0.05]);   // ribbed
    drum.push([0.38, 0.7], [0.38, 0.73], [0.35, 0.74]);
    put('castIron', lathe(drum, 40).translate(c[0], Y, c[2]));
    put('castIron', lathe([[0.35, 0.96], [0.41, 0.97], [0.41, 1.0], [0.36, 1.02], [0.28, 1.06], [0.16, 1.09], [0.05, 1.1], [0.05, 1.14], [0.025, 1.16], [0, 1.16]], 40).translate(c[0], Y, c[2]));
    const col = new THREE.CylinderGeometry(0.35, 0.35, 0.22, 56, 1, true), cu = col.attributes.uv; for (let i = 0; i < cu.count; i++) cu.setXY(i, cu.getX(i) * Math.PI * 2 * 0.35, cu.getY(i) * 0.16 - 0.03);
    put('grille', col.translate(c[0], Y + 0.85, c[2]));
    put('stoveGlow', new THREE.CylinderGeometry(0.32, 0.32, 0.21, 24).translate(c[0], Y + 0.85, c[2]));
    const gd = new THREE.CylinderGeometry(0.64, 0.64, 1.0, 56, 1, true), gu = gd.attributes.uv; for (let i = 0; i < gu.count; i++) gu.setXY(i, gu.getX(i) * Math.PI * 2 * 0.64, gu.getY(i) * 1.0);
    addMesh(gd.translate(c[0], Y + 0.07 + 0.5, c[2]), M.ironMesh, { cast: false, recv: false });
    for (const y of [0.09, 1.07]) put('castIron', new THREE.TorusGeometry(0.64, y > 1 ? 0.022 : 0.014, 8, 56).rotateX(Math.PI / 2).translate(c[0], Y + y, c[2]));
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; put('castIron', new THREE.CylinderGeometry(0.01, 0.01, 1.0, 6).translate(c[0] + Math.cos(a) * 0.64, Y + 0.57, c[2] + Math.sin(a) * 0.64)); }
    const pipe = [[-0.22, 0.93, -0.22], [-0.36, 0.97, -0.36], [-0.44, 1.12, -0.44], [-0.44, 1.55, -0.44], [-0.44, GDM.apex - 0.4, -0.44]].map(([x, y, z]) => new THREE.Vector3(c[0] + x, Y + y, c[2] + z));
    put('castIron', new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pipe, false, 'centripetal'), 64, 0.075, 16));
    for (let y = 1.6; y < GDM.apex - 0.6; y += 1.1) put('castIron', new THREE.CylinderGeometry(0.085, 0.085, 0.06, 16).translate(c[0] - 0.44, Y + y, c[2] - 0.44));
    // a towel and a scarf hung over the guard (c14)
    const tm = xf([0.56, Y + 1.03, 0.28], Math.atan2(0.56, 0.28) + Math.PI / 2);
    put('linen', merge([new RoundedBoxGeometry(0.34, 0.03, 0.12, 1, 0.01).translate(0, 0.05, 0.05), new RoundedBoxGeometry(0.34, 0.42, 0.02, 1, 0.008).translate(0, -0.15, 0.12), new RoundedBoxGeometry(0.34, 0.26, 0.02, 1, 0.008).translate(0, -0.08, -0.02)]).applyMatrix4(tm));
    LAMPS.push({ room: GCR_ROOM, p: [c[0], Y + 0.84, c[2]], c: [1.0, 0.35, 0.1].map((v) => v * 1.6), r: 2.2, see: 30 });
  }
  // ---- the beds and their corners
  const bedGeo = gdBedParts(), beds = [], curtains = [], stars = [], mats = [], pads = [], wools = [], patches = [], trunks = [], cups = [], hooks = [];
  const BR = rng('dorm'), v = new THREE.Vector3();
  const cupGeo = (() => { const w = 0.5, P = [new THREE.BoxGeometry(w, 0.82, 0.42).translate(0, 0.41, 0.21), new RoundedBoxGeometry(w + 0.04, 0.04, 0.46, 1, 0.01).translate(0, 0.84, 0.22)];
    for (const x of [-0.12, 0.12]) P.push(new THREE.BoxGeometry(0.22, 0.62, 0.02).translate(x, 0.42, 0.43));
    P.push(new THREE.BoxGeometry(0.46, 0.62, 0.22).translate(0, 1.75, 0.11), new THREE.ExtrudeGeometry(pathPts(new THREE.Shape(), [[-0.27, 0], [0.27, 0], [0, 0.16]]), { depth: 0.24, bevelEnabled: false }).translate(0, 2.06, -0.01));   // the cabinet and its pediment
    P.push(new THREE.BoxGeometry(0.5, 0.05, 0.25).translate(0, 2.06, 0.11), new THREE.BoxGeometry(0.5, 0.04, 0.24).translate(0, 1.43, 0.11));
    return merge(P); })();
  for (const [k, ini, num] of GDM_BEDS) {
    const m = gdM(k, 0, 0, 0.42);
    beds.push(m);
    // the curtains: red velvet tied back at the four posts, star curtains drawn half along the sides near the head
    for (const sx of [-1, 1]) {
      curtains.push(m.clone().multiply(xf([sx * 0.66, 0, 1.9], Math.PI / 2, 1)), m.clone().multiply(xf([sx * 0.66, 0, 0.32], Math.PI / 2, 1)));
      stars.push(m.clone().multiply(xf([sx * 0.56, 0, 0.75], Math.PI / 2, 1)));
    }
    mats.push(m.clone().multiply(xf([0, 0.62, 1.07], 0, 1)));
    pads.push(m.clone().multiply(xf([0, 0.8, 0.38], 0, [1.55, 1.0, 1.0], -Math.PI / 2 + 0.45)));
    (ini === 'R.W' ? patches : wools).push(m.clone().multiply(xf([0, 0.75, 1.36], 0, 1)));
    trunks.push(m.clone().multiply(xf([0, 0, 2.55], 0, 1)));
    cups.push(gdM(k, 0.96, 0, 0.0));
    hooks.push(gdM(k, -0.96, 0, 0.0));
    // the bed's number on the tester frieze, the owner's initials on the trunk
    addMesh(new THREE.PlaneGeometry(0.42, 0.16).applyMatrix4(m.clone().multiply(xf([0, 2.25, 2.2], 0, 1))), letterMat(num, '#d8c8a0', 52), { cast: false });
    addMesh(new THREE.PlaneGeometry(0.3, 0.11).applyMatrix4(m.clone().multiply(xf([0, 0.24, 2.802], 0, 1))), letterMat(ini, '#e8dcc4', 70), { cast: false });
  }
  addInst(bedGeo, M.fwood, beds);
  addInst(curtainGeo(0.34, 2.14, 3.5, 0.045, 0.6), M.curtain, curtains, null, { cast: true });
  addInst(curtainGeo(0.75, 2.12, 5, 0.035), M.starCloth, stars, null, { cast: true });
  addInst(new RoundedBoxGeometry(1.06, 0.18, 1.98, 2, 0.06), M.linen, mats);
  addInst(gcrSculpt('pillow'), M.linen, pads);
  const blanket = uvPlanar(merge([new RoundedBoxGeometry(1.16, 0.06, 1.42, 2, 0.025).translate(0, 0.03, 0), ...[-1, 1].map((s) => new RoundedBoxGeometry(0.03, 0.3, 1.42, 1, 0.012).translate(s * 0.565, -0.12, 0)), new RoundedBoxGeometry(1.14, 0.03, 0.22, 1, 0.012).translate(0, 0.065, -0.62)]));
  addInst(blanket, M.wool, wools); addInst(blanket, M.patch, patches);
  // trunks (c12): leather body, a lid line, brass corners, two straps, a side handle
  addInst(new RoundedBoxGeometry(0.88, 0.44, 0.48, 2, 0.03).translate(0, 0.22, 0), M.trunk, trunks);
  const tb = []; for (const sx of [-1, 1]) for (const sy of [0.02, 0.42]) for (const sz of [-1, 1]) tb.push(new THREE.BoxGeometry(0.07, 0.05, 0.07).translate(sx * 0.42, sy, sz * 0.22));
  tb.push(new THREE.BoxGeometry(0.9, 0.012, 0.5).translate(0, 0.34, 0));
  addInst(merge(tb), M.brass, trunks, null, { cast: false });
  addInst(merge([-0.24, 0.24].map((x) => new THREE.BoxGeometry(0.05, 0.46, 0.5).translate(x, 0.225, 0))), M.strap, trunks, null, { cast: false });
  // cupboards with a washbowl and jug, the pedimented mirror cabinet over them; hook rails with robes and scarves
  addInst(cupGeo, M.fwood, cups);
  addInst(new THREE.PlaneGeometry(0.33, 0.46), M.mirror, cups.map((m) => m.clone().multiply(xf([0, 1.75, 0.225], 0, 1))), null, { cast: false });
  addInst(lathe([[0, 0], [0.06, 0], [0.08, 0.02], [0.16, 0.07], [0.165, 0.08], [0.15, 0.075], [0.07, 0.025], [0, 0.02]], 24), M.enamel, cups.map((m) => m.clone().multiply(xf([0.06, 0.86, 0.22], 0, 1))), null, { cast: false });
  addInst(lathe([[0, 0], [0.05, 0], [0.065, 0.06], [0.06, 0.16], [0.04, 0.22], [0.05, 0.26], [0.0, 0.26]], 18), M.enamel, cups.map((m) => m.clone().multiply(xf([-0.15, 0.86, 0.2], 0, 1))), null, { cast: false });
  addInst(merge([new THREE.BoxGeometry(0.6, 0.08, 0.03).translate(0, 1.85, 0.02), ...[-0.18, 0.12].map((x) => new THREE.CylinderGeometry(0.012, 0.012, 0.12, 8).rotateX(Math.PI / 2 - 0.4).translate(x, 1.85, 0.08))]), M.fwood, hooks);
  addInst(robeGeo(), M.robe, hooks.map((m) => m.clone().multiply(xf([-0.18, 1.88, 0.16], 0, 1))));
  {   // a Gryffindor scarf hung on the other hook of each rail, its two ends falling (bands across the length)
    const s = white(new THREE.PlaneGeometry(1.3, 0.17, 40, 2)), p = s.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), t = (x + 0.65) / 1.3, fold = t < 0.5 ? 0.01 : 0.03; p.setXYZ(i, x, y, fold + 0.006 * Math.sin(x * 30)); }
    s.computeVertexNormals();
    for (const m of hooks) for (const [dz, off] of [[0.04, 0], [0.07, 0.05]]) addSculpt(s.clone(), M.gscarf, m.clone().multiply(xf([0.12 + off * 0.3, 1.86 - 0.62, 0.1 + dz], 0, 1, 0, Math.PI / 2 + (off ? 0.06 : -0.04))), { cast: false });
  }
  // a shaded oil lamp on each bed's back panel (OotP, HBP); chairs at two beds, a wicker basket
  const lamps = [];
  for (const [k] of GDM_BEDS) {
    put('fwood', uvPlanar(new THREE.BoxGeometry(1.4, 2.45, 0.05).translate(0, 1.32, 0.03)).applyMatrix4(gdM(k)));   // the panelled back
    for (const x of [-0.45, 0, 0.45]) put('fwood', uvPlanar(new THREE.BoxGeometry(0.4, 0.7, 0.025).translate(x, 1.95, 0.065)).applyMatrix4(gdM(k)));
    const m = gdM(k, 0.0, 1.62, 0.1); lamps.push(m.clone().multiply(xf([0, -0.03, 0.22], 0, 1)));
    put('brass', merge([new THREE.BoxGeometry(0.08, 0.13, 0.025), new THREE.CylinderGeometry(0.01, 0.01, 0.2, 8).rotateX(Math.PI / 2).translate(0, -0.03, 0.1)]).applyMatrix4(m));
  }
  addInst(GD_LAMP.brass, M.brass, lamps); addInst(GD_LAMP.chimney, M.globe, lamps, null, { cast: false }); addInst(GD_LAMP.shade, M.tole, lamps, null, { cast: false });
  for (const m of lamps) { v.set(0, 0.2, 0).applyMatrix4(m); LAMPS.push({ room: GCR_ROOM, p: [v.x, v.y, v.z], c: [1.0, 0.62, 0.3].map((q) => q * 2.4), r: 3.4, halo: 0.1, hk: 0.45, see: 30 }); }
  addInst(gcrChair(), M.fwood, [gdM(2, -0.98, 0, 1.15, 0.3), gdM(8, 0.95, 0, 1.2, -0.2)]);
  put('wicker', (() => { const g = lathe([[0, 0], [0.13, 0], [0.16, 0.32], [0.155, 0.33], [0.125, 0.01]], 24); const u = g.attributes.uv; for (let i = 0; i < u.count; i++) u.setXY(i, u.getX(i), u.getY(i) * 0.33); return g; })().applyMatrix4(gdM(4, 0.95, 0, 0.75)));
  // the dormitory's light: two fills (no shadow, short), the moon or sun through the lancets comes from the set's sun
  for (const [x, z] of [[1.3, 0.9], [-1.3, -0.9]]) { const p = new THREE.PointLight(new THREE.Color(1.0, 0.66, 0.38), 0, 6, 1.6); p.position.set(x, Y + 2.6, z); p.userData = { d: 0.6, n: 1.3 }; sc.add(p); points.push(p); }
  gdDress();   // the boys' things (65c-gryffdress.js)
  void BR;
}
// the stone ring round an opening in a dormitory wall (as archSurround, in the dormitory's frame)
function archSurroundD(k, p, o, d) {
  const inner = jambChain(opn(p)), outer = jambChain(opn(p, o)), cx = p.dx || 0, cy = (p.dy || 0) + 1.0;
  for (const P of [{ A: inner, zA: d, B: outer, zB: d, want: () => [0, 0, 1] }, { A: inner, zA: 0, B: inner, zB: d, want: ([x, y]) => [cx - x, cy - y, 0] }, { A: outer, zA: 0, B: outer, zB: d, want: ([x, y]) => [x - cx, y - cy, 0] }]) {
    const g = loftGeo(P.A, P.zA, P.B, P.zB, P.want), keep = (P.A.length - 1) * 6, h = new THREE.BufferGeometry();
    for (const [k2, n] of [['position', 3], ['uv', 2], ['normal', 3]]) h.setAttribute(k2, new THREE.Float32BufferAttribute(g.attributes[k2].array.slice(0, keep * n), n));
    gdPut(k, 'gashlar', h);
  }
}
