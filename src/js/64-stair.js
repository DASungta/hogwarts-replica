// ------------------------------------------------------------------ the Entrance Hall and the Grand Staircase (after the films)
// A tall square stone well: galleries round all four walls on every floor, stone flights spanning the void between
// them (one swung out of line, as the staircases move), walls of dark stone crowded with portraits in gilt frames,
// brass lanterns, arched doorways off the galleries. No lantern at the top: the tower's cone holds attic rooms, so the well
// ends under a dark timber ceiling with an iron candle wheel, and the daylight comes in slanting through three tall
// windows high on the west wall, over the Quad (in the films the light falls in shafts from high windows). The flights follow the
// set piece at Leavesden (ref/stair t01-t03): worn steps on a stepped soffit, an arcaded parapet of colonnettes and
// small pointed arches under a heavy handrail, square newels. The portrait walls follow t00 and t04. The ground floor
// is the Entrance Hall: the main doors on the north wall; on the south wall the doors of the Great Hall between tiers
// of niches holding knights in armour (ref/interior g70, g02, g69).
const GSTAIR = { half: 12, levels: 9, step: 10, gal: 3.4 };
// the top floor's tall windows on the west wall, over the Quad: centres along z, half width, sill, springing; the middle
// one's lower lights stand open (the snitch comes in there). The Great Hall doors stand half open (radians).
const STW = { z: [-5, 0, 5], hw: 1.0, sill: 83, hs: 6.4, y0: 81, open: 0 };
const GH_DOOR = { hw: 1.9, hs: 5.0, rise: 1.3, open: 1.05 };
M.darkstone = procMat({ name: 'darkstone', rgb: [0.36, 0.3, 0.23], rough: 0.88, bump: 1, uv: true, frag: /* glsl */ `
  vec2 uv = abs(N.y) > 0.75 ? P.xz : UV;
  vec2 bs = vec2(0.85, 0.4);
  float row = floor(uv.y / bs.y); uv.x += cgH21(vec2(row, 3.7)) * bs.x;
  vec2 f = fract(uv / bs) * bs; float e = min(min(f.x, bs.x - f.x), min(f.y, bs.y - f.y));
  float px = length(fwidth(uv));
  float groove = smoothstep(0.0, max(0.01, px), e); groove = mix(groove, 0.9, smoothstep(0.02, 0.1, px));
  float id = cgH21(floor(uv / bs) + 17.0 * row);
  vec3 c = vec3(0.85 + 0.22 * id) * mix(vec3(1.0), vec3(1.05, 0.97, 0.88), cgH21(floor(uv / bs) + 3.0)) * (0.82 + 0.3 * cgFbm(P * 0.5));
  c *= mix(0.7, 1.0, groove);
  c *= mix(1.0, 0.75, smoothstep(0.55, 0.85, cgFbm3(vec3(P.x * 0.3, P.y * 0.06, P.z * 0.3))));
  diffuseColor.rgb *= c; cgH = min(e, 0.02) * 0.4 + cgVn(P * 8.0) * 0.002; cgAO = mix(0.7, 1.0, groove);
` });
M.stairstone = procMat({ name: 'stairstone', rgb: [0.4, 0.35, 0.28], rough: 0.8, bump: 1, frag: /* glsl */ `
  float n = cgFbm3(P * 1.3), g = cgVn(P * 18.0);
  diffuseColor.rgb *= (0.8 + 0.3 * n) * mix(vec3(1.0), vec3(1.06, 0.98, 0.9), cgVn(P * 0.4));
  diffuseColor.rgb *= 1.0 - 0.14 * smoothstep(0.6, 0.85, cgFbm3(P * 1.7 + 7.0));   // grime
  diffuseColor.rgb *= 1.0 - 0.18 * step(N.y, -0.3);   // soot under the soffits
  cgH = g * 0.002 + n * 0.004;
` });
M.giltFrame = procMat({ name: 'giltFrame', rgb: [0.66, 0.47, 0.22], metal: 1, rough: 0.35, bump: 1, frag: /* glsl */ `
  float n = cgFbm3(P * 6.0), w = cgVn(P * 30.0);
  diffuseColor.rgb *= 0.62 + 0.45 * n;                                   // worn gilding, darker bole showing through
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.16, 0.09, 0.04), smoothstep(0.62, 0.8, cgFbm3(P * 3.0 + 4.0)) * 0.6);
  cgRough = 0.22 + 0.3 * (1.0 - n); cgH = w * 0.0012; cgAO = 0.6 + 0.4 * n;
` });
// the portraits: cells of the painted atlas (16-paint.js); instance colour r,g = column / 8, row / 6
const PORTRAIT_U = { uAtlas: { value: null } };
M.portrait = procMat({ name: 'portrait', rgb: [1, 1, 1], rough: 0.35, inst: true, uv: true, uniforms: PORTRAIT_U, head: 'uniform sampler2D uAtlas;\n', frag: /* glsl */ `
  vec2 cell = floor(vInstC.rg * vec2(8.0, 6.0) + 0.5), q = clamp(UV, 0.004, 0.996);
  diffuseColor.rgb = pow(texture2D(uAtlas, vec2((cell.x + q.x) / 8.0, 1.0 - (cell.y + 1.0 - q.y) / 6.0)).rgb, vec3(2.2));
  cgRough = 0.28 + 0.2 * cgVn(P * 40.0); cgSpec = 0.8;
` });
M.hallGlow = procMat({ name: 'hallGlow', rgb: [0.02, 0.02, 0.02], rough: 1, frag: /* glsl */ `
  cgEmit = vec3(1.0, 0.78, 0.52) * (1.3 + 0.4 * cgVn(P * 0.4));
` });
M.stairSky = procMat({ name: 'stairSky', rgb: [0.02, 0.02, 0.02], rough: 1, frag: /* glsl */ `
  cgEmit = mix(mix(vec3(0.72, 0.82, 0.92), vec3(1.0, 0.97, 0.9), cgVn(P * 0.08)) * 3.0, vec3(0.02, 0.035, 0.07), uNight);
` });
M.lampGlass = procMat({ name: 'lampGlass', rgb: [0.1, 0.08, 0.05], rough: 0.2, frag: /* glsl */ `
  cgEmit = vec3(1.0, 0.62, 0.28) * (2.2 + 1.5 * uLamp);
` });
// ---- an arcaded parapet, 1 m units: plinth, colonnettes, a band of small pointed arches, a moulded handrail (t01-t03)
{
  const P = [];
  P.push(new THREE.BoxGeometry(1.0, 0.14, 0.24).translate(0, 0.07, 0));
  const col = new THREE.LatheGeometry([[0, 0.14], [0.052, 0.14], [0.052, 0.18], [0.036, 0.21], [0.031, 0.25], [0.031, 0.68], [0.04, 0.71], [0.052, 0.74], [0.052, 0.76], [0, 0.76]].map(([r, h]) => new THREE.Vector2(r, h)), 8);
  for (const x of [-0.5, -0.25, 0, 0.25]) P.push(col.clone().translate(x, 0, 0));
  const out = [[-0.5, 0.98], [-0.5, 0.76]];
  for (let i = 0; i < 4; i++) { const xa = -0.5 + i * 0.25 + 0.035, xb = -0.5 + (i + 1) * 0.25 - 0.035, hw = (xb - xa) / 2; out.push(...archHeadPts(hw, 0.76, 'pointed', 0.72, 6).map(([x, y]) => [x + (xa + xb) / 2, y])); }
  out.push([0.5, 0.76], [0.5, 0.98]);
  P.push(new THREE.ExtrudeGeometry(pathPts(new THREE.Shape(), out.reverse()), { depth: 0.13, bevelEnabled: false }).translate(0, 0, -0.065));
  P.push(new THREE.BoxGeometry(1.0, 0.05, 0.2).translate(0, 0.995, 0), new RoundedBoxGeometry(1.0, 0.13, 0.27, 1, 0.04).translate(0, 1.08, 0));
  protoDef('arcbal', [{ mat: 'stairstone', geo: merge(P) }]);
  const N = [new THREE.BoxGeometry(0.36, 1.12, 0.36).translate(0, 0.56, 0), new THREE.BoxGeometry(0.44, 0.1, 0.44).translate(0, 0.05, 0),
    new THREE.BoxGeometry(0.44, 0.08, 0.44).translate(0, 1.16, 0), new THREE.ConeGeometry(0.3, 0.26, 4).rotateY(Math.PI / 4).translate(0, 1.33, 0), new THREE.SphereGeometry(0.07, 10, 8).translate(0, 1.5, 0)];
  protoDef('newel', [{ mat: 'stairstone', geo: merge(N) }]);
}
{
  const G = GSTAIR.gal - 0.45, pr = [[0, 0], [G, 0], [G, -0.25]];
  for (let i = 0; i <= 12; i++) { const a = (i / 12) * Math.PI / 2; pr.push([G - G * Math.sin(a) * 0.97, -0.25 - 1.6 * (1 - Math.cos(a))]); }
  pr.push([0, -2.0]);
  const g = new THREE.ExtrudeGeometry(pathPts(new THREE.Shape(), pr.reverse()), { depth: 0.34, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 1 });
  g.translate(0, 0, -0.17).rotateY(-Math.PI / 2);   // profile u (shape x) → +z, out of the wall
  protoDef('gbracket', [{ mat: 'stairstone', geo: g }]);
}
const _shear = new THREE.Matrix4();
// a parapet run from a to b ([x, y, z], y = base), sheared to the slope so the colonnettes stay plumb
function balRun(a, b, newels = true) {
  const dx = b[0] - a[0], dz = b[2] - a[2], L = Math.hypot(dx, dz), slope = (b[1] - a[1]) / Math.max(L, 1e-6);
  if (L < 0.3) return;
  const n = Math.max(1, Math.round(L)), sx = L / n, th = Math.atan2(-dz, dx);
  _shear.set(1, 0, 0, 0, slope, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, m = xf([a[0] + dx * t, lerp(a[1], b[1], t), a[2] + dz * t], th, 1);
    m.multiply(_shear).multiply(new THREE.Matrix4().makeScale(sx, 1, 1));
    place('arcbal', m);
  }
  if (newels) for (const p of [a, b]) place('newel', xf(p, th, 1));
}
// a flight: worn steps on a stepped soffit (a folded slab), sloping stringers carrying the parapets
function flight(a, b, w) {
  const dx = b[0] - a[0], dz = b[2] - a[2], L = Math.hypot(dx, dz), rise = b[1] - a[1], n = Math.max(2, Math.round(Math.abs(rise) / 0.19)), th = 0.42;
  const top = [[0, 0]];
  for (let i = 0; i < n; i++) { const x1 = ((i + 1) / n) * L; top.push([x1, (i / n) * rise], [x1, ((i + 1) / n) * rise]); }
  const bot = top.map(([x, y]) => [x + th * 0.4, y - th]).reverse();
  const s = pathPts(new THREE.Shape(), [...top, [L, rise - th], ...bot.slice(1)]);
  const ry = -Math.atan2(dz, dx);
  const g = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false }).translate(0, 0, -w / 2);
  put('stairstone', uvPlanar(g.rotateY(ry).translate(a[0], a[1], a[2])));
  const nx = -dz / L, nz = dx / L;
  for (const sd of [-1, 1]) {
    const o = (w / 2 + 0.12) * sd, a2 = [a[0] + nx * o, a[1] + 0.12, a[2] + nz * o], b2 = [b[0] + nx * o, b[1] + 0.12, b[2] + nz * o];
    const sl = Math.hypot(L, rise), sg = new THREE.BoxGeometry(sl + 0.2, 0.62, 0.26).translate(0, -0.25, 0).rotateZ(Math.atan2(rise, L)).rotateY(ry).translate((a2[0] + b2[0]) / 2, (a2[1] + b2[1]) / 2, (a2[2] + b2[2]) / 2);
    put('stairstone', uvPlanar(sg));
    balRun(a2, b2);
  }
}
// gilt frames: a moulded ring (outer bevel, raised bead, sight edge), rectangular or oval
const FRAMES = [], PICS2 = [], OVALS = [];
function frameRing(w, h, fw, oval) {
  const ring = (a, b, d, z) => {
    const s = oval ? new THREE.Shape().absellipse(0, 0, w / 2 + a, h / 2 + a, 0, Math.PI * 2) : pathPts(new THREE.Shape(), [[-w / 2 - a, -h / 2 - a], [w / 2 + a, -h / 2 - a], [w / 2 + a, h / 2 + a], [-w / 2 - a, h / 2 + a]]);
    s.holes.push(oval ? new THREE.Path().absellipse(0, 0, w / 2 + b, h / 2 + b, 0, Math.PI * 2, true) : pathPts(new THREE.Path(), [[-w / 2 - b, -h / 2 - b], [w / 2 + b, -h / 2 - b], [w / 2 + b, h / 2 + b], [-w / 2 - b, h / 2 + b]], true));
    return new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelSize: Math.min(0.012, (a - b) * 0.3), bevelThickness: 0.012, bevelSegments: 1, curveSegments: 28 }).translate(0, 0, z);
  };
  return merge([ring(fw, fw * 0.55, 0.03, 0), ring(fw * 0.62, fw * 0.22, 0.06, 0), ring(fw * 0.26, 0, 0.035, 0)]);
}
let PCELL = 0;
function hangPicture(c, y, nx, nz, w, h, R) {
  const land = w > h * 1.15;
  if (!land) { const hh = Math.min(h, w * 1.25); w = hh * 0.8; h = hh; }   // portraits keep the 4:5 of their canvas
  else { const ww = Math.min(w, h * 1.6); h = Math.min(h, ww / 1.25); w = ww; }
  const oval = R() < 0.1 && !land;
  let cell;
  if (land) { const k = Math.floor(R() * 8); cell = 5 + 6 * k; if (cell >= 48) cell = 5; }
  else { do { cell = (PCELL++ * 7 + 3) % 48; } while (cell % 6 === 5); }
  const fw = clamp(0.06 + 0.07 * Math.min(w, h), 0.08, 0.2);
  const ry = Math.atan2(nx, nz), pos = [c[0] + nx * 0.02, y, c[2] + nz * 0.02];
  const m = xf(pos, ry, 1);
  FRAMES.push(frameRing(w, h, fw, oval).applyMatrix4(m));
  (oval ? OVALS : PICS2).push({ m: xf([pos[0] + nx * 0.035, y, pos[2] + nz * 0.035], ry, [w, h, 1]), c: [(cell % 8) / 8, Math.floor(cell / 8) / 6, 0] });
}
function flushPictures2() {
  PORTRAIT_U.uAtlas.value = portraitAtlasGL();
  const plane = new THREE.PlaneGeometry(1, 1), disc = new THREE.CircleGeometry(0.5, 40);
  if (PICS2.length) addInst(plane, M.portrait, PICS2.map((p) => p.m), PICS2.map((p) => p.c), { cast: false });
  if (OVALS.length) addInst(disc, M.portrait, OVALS.map((p) => p.m), OVALS.map((p) => p.c), { cast: false });
  if (FRAMES.length) addMesh(merge(FRAMES), M.giltFrame, { cast: false });
  FRAMES.length = 0; PICS2.length = 0; OVALS.length = 0;
}
// a brass wall lantern on a bracket (t04), glazed, a candle glow inside; front toward +z
{
  const body = new THREE.CylinderGeometry(0.15, 0.12, 0.42, 6, 1, true).translate(0, 0, 0.42);
  const frame = [new THREE.CylinderGeometry(0.18, 0.18, 0.04, 6).translate(0, -0.21, 0.42), new THREE.ConeGeometry(0.2, 0.2, 6).translate(0, 0.31, 0.42), new THREE.SphereGeometry(0.035, 8, 6).translate(0, 0.44, 0.42),
    new THREE.BoxGeometry(0.04, 0.04, 0.42).translate(0, 0.36, 0.2), new THREE.BoxGeometry(0.03, 0.3, 0.03).translate(0, 0.22, 0.02), new THREE.CylinderGeometry(0.06, 0.03, 0.12, 8).translate(0, -0.28, 0.42)];
  for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; frame.push(new THREE.BoxGeometry(0.018, 0.44, 0.018).translate(Math.cos(a) * 0.14, 0, 0.42 + Math.sin(a) * 0.14)); }
  protoDef('lantern', [{ mat: 'lampGlass', geo: body, cast: false }, { mat: 'brass', geo: merge(frame) }]);
}
// a Tudor-arched doorway off a gallery: a moulded surround and a dark passage beyond
function doorway(cx, y, cz, nx, nz, w = 2.0, hs = 2.5, rise = 0.7) {
  const ry = Math.atan2(nx, nz), m = xf([cx, y, cz], ry, 1);
  const ring = pathPts(new THREE.Shape(), openingPts(w / 2 + 0.32, hs, 'tudor', rise + 0.18)); ring.holes.push(pathPts(new THREE.Path(), openingPts(w / 2, hs, 'tudor', rise), true));
  put('stairstone', new THREE.ExtrudeGeometry(ring, { depth: 0.22, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 }).applyMatrix4(m));
  put('paintBlack', new THREE.ShapeGeometry(pathPts(new THREE.Shape(), openingPts(w / 2, hs, 'tudor', rise))).translate(0, 0, 0.01).applyMatrix4(m));
}
function buildStairInterior(sc) {
  const h = GSTAIR.half, G = GSTAIR.gal, TOP = GSTAIR.levels * GSTAIR.step + 6, R = rng('stair');
  put('flag', new THREE.PlaneGeometry(2 * h, 2 * h).rotateX(-Math.PI / 2));
  // the walls: the east and north ones plain; the west one solid up to the top floor's window sills, then a slab with
  // the three window openings; the south one with the opening of the Great Hall doors
  wallBox(h, h + 1.5, -1, TOP, -h, h, 'darkstone', 0);
  wallBox(-h - 1.5, h + 1.5, -1, TOP, h, h + 1.5, 'darkstone', 0);
  wallBox(-h - 1.5, -h, -1, STW.y0, -h, h, 'darkstone', 0);
  {
    const sl = pathPts(new THREE.Shape(), [[-h, 0], [h, 0], [h, TOP - STW.y0], [-h, TOP - STW.y0]]);
    for (const zc of STW.z) sl.holes.push(pathPts(new THREE.Path(), openingPts(STW.hw, STW.hs, 'pointed', 1.0).map(([u, v]) => [u - zc, v + STW.sill - STW.y0]), true));
    put('darkstone', uvPlanar(new THREE.ExtrudeGeometry(sl, { depth: 1.5, bevelEnabled: false, curveSegments: 8 }).rotateY(Math.PI / 2).translate(-h - 1.5, STW.y0, 0)));
    const sw = pathPts(new THREE.Shape(), [[-h - 1.5, -1], [h + 1.5, -1], [h + 1.5, TOP], [-h - 1.5, TOP]]);
    sw.holes.push(pathPts(new THREE.Path(), openingPts(GH_DOOR.hw, GH_DOOR.hs, 'tudor', GH_DOOR.rise), true));
    put('darkstone', uvPlanar(new THREE.ExtrudeGeometry(sw, { depth: 1.5, bevelEnabled: false, curveSegments: 10 }).translate(0, 0, -h - 1.5)));
  }
  // the timber ceiling: boards on a grid of joists, two great cross beams on stone corbels
  put('oak', new THREE.PlaneGeometry(2 * h + 3, 2 * h + 3).rotateX(Math.PI / 2).translate(0, TOP, 0));
  for (let k = -2; k <= 2; k++) { beam([k * 4.8, TOP - 0.3, -h], [k * 4.8, TOP - 0.3, h], 0.4, 'oak'); beam([-h, TOP - 0.3, k * 4.8], [h, TOP - 0.3, k * 4.8], 0.4, 'oak'); }
  for (const z of [-7.2, 7.2]) {
    beam([-h, TOP - 1.1, z], [h, TOP - 1.1, z], 0.75, 'oak');
    for (const x of [-h, h]) wallBox(x - (x < 0 ? 0 : 0.9), x + (x < 0 ? 0.9 : 0), TOP - 2.6, TOP - 1.45, z - 0.5, z + 0.5, 'stairstone', 0.05);
  }
  // the windows: leaded lights in stone tracery, the middle one's lower lights standing open; the sky beyond
  for (const zc of STW.z) {
    const W = traceryWindow(2 * STW.hw, STW.hs, 'pointed', 1.0, 2, [3.4], { frame: 0.16, mull: 0.12, depth: 0.26 });
    const m = new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(-h - 0.75, STW.sill, zc);
    put('stairstone', W.stone.applyMatrix4(m));
    let gl = W.glass;
    if (zc === 0) {   // glass only above the transom
      gl = new THREE.ShapeGeometry(pathPts(new THREE.Shape(), [[-STW.hw, 3.4], [STW.hw, 3.4], ...archHeadPts(STW.hw, STW.hs, 'pointed', 1.0).reverse()]));
      const gp = gl.attributes.position, guv = gl.attributes.uv; for (let i = 0; i < gp.count; i++) guv.setXY(i, gp.getX(i), gp.getY(i));
      gl.translate(0, 0, -0.15);
    }
    addMesh(gl.applyMatrix4(m), M.hglass, { cast: false });
  }
  addMesh(new THREE.PlaneGeometry(2 * h, TOP - STW.y0 + 4).rotateY(Math.PI / 2).translate(-h - 4, (STW.y0 + TOP) / 2, 0), M.stairSky, { cast: false, recv: false });
  const inner = h - G;
  const walls = [[0, 1], [0, -1], [1, 0], [-1, 0]];   // outward normals of the wall faces (into the well): south wall faces +z, ...
  const blocked = [];   // [level, wall index, centre t, half width] kept free of portraits
  for (let lv = 1; lv < GSTAIR.levels; lv++) {
    const y = lv * GSTAIR.step;
    for (const [x0, x1, z0, z1] of [[-h, h, -h, -inner], [-h, h, inner, h], [-h, -inner, -inner, inner], [inner, h, -inner, inner]]) {
      wallBox(x0, x1, y - 0.6, y, z0, z1, 'stairstone', 0.03);
      put('flag', new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2).translate((x0 + x1) / 2, y + 0.005, (z0 + z1) / 2));
    }
    for (const [x0, x1, z0, z1] of [[-inner - 0.15, inner + 0.15, -inner - 0.15, -inner + 0.15], [-inner - 0.15, inner + 0.15, inner - 0.15, inner + 0.15], [-inner - 0.15, -inner + 0.15, -inner, inner], [inner - 0.15, inner + 0.15, -inner, inner]]) {
      wallBox(x0, x1, y - 0.95, y - 0.6, z0, z1, 'stairstone', 0.05);
      wallBox(x0 + 0.06, x1 - 0.06, y - 1.2, y - 0.95, z0 + 0.06, z1 - 0.06, 'stairstone', 0.05);
    }
    for (let t = -h + 2.4; t < h - 2; t += 3.0) for (const [px, pz, ry] of [[t, -h, 0], [t, h, Math.PI], [-h, t, Math.PI / 2], [h, t, -Math.PI / 2]]) place('gbracket', xf([px, y - 0.6, pz], ry, 1));
    // the parapet, with a gap where a flight arrives or leaves, newels at the gap ends and the corners
    const gaps = GSTAIR_GAPS[lv] || [];
    const runs = [[-inner, -inner, inner, -inner], [inner, -inner, inner, inner], [inner, inner, -inner, inner], [-inner, inner, -inner, -inner]];
    for (const [ax, az, bx, bz] of runs) {
      let segs = [[0, 1]];
      const L = Math.hypot(bx - ax, bz - az);
      for (const g of gaps) {
        const t = ((g[0] - ax) * (bx - ax) + (g[1] - az) * (bz - az)) / (L * L), d = Math.abs((g[0] - ax) * (bz - az) - (g[1] - az) * (bx - ax)) / L;
        if (d > 0.6 || t < 0 || t > 1) continue;
        const half = 1.75 / L; segs = segs.flatMap(([u, v]) => (t - half > v || t + half < u ? [[u, v]] : [[u, Math.max(u, t - half)], [Math.min(v, t + half), v]].filter(([p, q]) => q - p > 0.02)));
      }
      for (const [u, v] of segs) balRun([lerp(ax, bx, u), y, lerp(az, bz, u)], [lerp(ax, bx, v), y, lerp(az, bz, v)]);
    }
    // a doorway off this gallery, on a different wall each floor
    const wi = lv % 4, [nx, nz] = walls[wi], dt = ((lv * 5) % 7 - 3) * 1.6;
    const cx = nx === 0 ? dt : -nx * h, cz = nx === 0 ? -nz * h : dt;
    doorway(cx, y, cz, nx, nz);
    blocked.push([lv, wi, dt, 1.8]);
  }
  // every flight hangs on a pivot at one of its landings (STAIR_MOTION), so the staircases can move as in the films
  GSTAIR_FLIGHTS.forEach((f, k) => {
    const m = STAIR_MOTION[k], [a, b] = stairEnds(k), pv = f[m.e], pivot = new THREE.Group(), inner = new THREE.Group();
    pivot.position.set(...pv); inner.position.set(-pv[0], -pv[1], -pv[2]); pivot.add(inner); sc.add(pivot);
    inGroup(inner, () => flight(a, b, 2.5));
    STAIR_PIVOTS.push(pivot);
    if (k === 4) STAIR_SWING = pivot;
  });

  // ---- the ground floor: the main doors (north); the Great Hall doors (south) between tiers of knights in niches
  {
    const main = pathPts(new THREE.Shape(), openingPts(2.6, 5.4, 'pointed', 0.85).map(([x, yy]) => [x, yy]));
    const fr = pathPts(new THREE.Shape(), openingPts(3.3, 5.4, 'pointed', 0.85)); fr.holes.push(pathPts(new THREE.Path(), openingPts(2.6, 5.4, 'pointed', 0.85), true));
    put('stairstone', new THREE.ExtrudeGeometry(fr, { depth: 0.45, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 1 }).rotateY(Math.PI).translate(0, 0, h + 0.02));
    put('door', new THREE.ExtrudeGeometry(main, { depth: 0.1, bevelEnabled: false }).rotateY(Math.PI).translate(0, 0, h + 0.05));
    for (let r = 0; r < 7; r++) for (const s of [-1, 1]) for (let c = 0; c < 2; c++) wallBox(s * (0.4 + c * 1.05) - 0.42, s * (0.4 + c * 1.05) + 0.42, 0.4 + r * 0.95, 1.2 + r * 0.95, h - 0.1, h - 0.03, 'door', 0.03);
    for (const s of [-1, 1]) put('paintBlack', new THREE.TorusGeometry(0.16, 0.025, 8, 20).translate(s * 0.35, 2.4, h - 0.12));
    // torches in iron cressets either side of the Great Hall doors
    for (const s of [-1, 1]) {
      const x = s * 3.4, y = 3.3, z = -h + 0.02;
      beam([x, y - 0.55, z], [x, y - 0.1, z + 0.42], 0.05, 'paintBlack');
      put('paintBlack', new THREE.CylinderGeometry(0.13, 0.06, 0.32, 10, 1, true).translate(x, y, z + 0.45));
      for (let k = 0; k < 4; k++) fireTongue(x + (k % 2 - 0.5) * 0.08, y + 0.1, z + 0.45 + (k > 1 ? 0.05 : -0.05), 0.26, 0.5 + 0.12 * k);
      LAMPS.push({ room: 'stair', p: [x, y + 0.45, z + 0.5], c: [1.0, 0.55, 0.22].map((v) => v * 12), r: 9, halo: 0.6, hk: 0.4, see: 40 });
    }
    // the Great Hall doors from this side (g69): carved panels in a deep moulded arch, traceried spandrels
    for (let k = 0; k < 3; k++) {
      const ring = pathPts(new THREE.Shape(), openingPts(1.9 + 0.22 * (k + 1), 5.0, 'tudor', 1.3 + 0.13 * (k + 1)));
      ring.holes.push(pathPts(new THREE.Path(), openingPts(1.9 + 0.22 * k, 5.0, 'tudor', 1.3 + 0.13 * k), true));
      put('stairstone', new THREE.ExtrudeGeometry(ring, { depth: 0.36 - 0.09 * k, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 }).translate(0, 0, -h - 0.02));
    }
    // the doors stand half open into the hall: two carved oak leaves hinged in the middle of the wall, panels and bosses
    // on this side (the same doors as in the hall set, seen from the Entrance Hall)
    const head = archHeadPts(1.9, 5.0, 'tudor', 1.3), zH = -h - 0.9;
    for (const sd of [-1, 1]) {
      const side = head.filter(([x]) => sd * x > 1e-6);
      const pts = sd < 0 ? [[-1.9, 0], [0, 0], [0, head[Math.floor(head.length / 2)][1]], ...side.reverse()] : [[0, 0], [1.9, 0], ...side.reverse(), [0, head[Math.floor(head.length / 2)][1]]];
      const sw = new THREE.Matrix4().makeTranslation(sd * 1.9, 0, zH).multiply(new THREE.Matrix4().makeRotationY(-sd * GH_DOOR.open)).multiply(new THREE.Matrix4().makeTranslation(-sd * 1.9, 0, -zH));
      put('door', new THREE.ExtrudeGeometry(pathPts(new THREE.Shape(), pts), { depth: 0.12, bevelEnabled: false }).translate(0, 0, zH - 0.06).applyMatrix4(sw));
      for (let c = 0; c < 3; c++) for (let r = 0; r < 6; r++) {
        const px = sd * (0.32 + c * 0.55), py = 0.5 + r * 0.76; if (py > 4.7 && c === 2) continue;
        wallBox(px - 0.22, px + 0.22, py - 0.31, py + 0.31, zH + 0.06, zH + 0.11, 'door', 0.03).applyMatrix4(sw);
        put('brass', new THREE.OctahedronGeometry(0.14, 0).scale(1, 1.4, 0.25).translate(px, py, zH + 0.13).applyMatrix4(sw));
      }
      put('paintBlack', new THREE.TorusGeometry(0.16, 0.025, 8, 20).translate(sd * 0.35, 2.4, zH + 0.16).applyMatrix4(sw));
    }
    // through the doors, the near end of the Great Hall (it is glimpsed for a moment before the cut into the hall set):
    // flagstones, sandstone walls with tall bright windows, the ends of the four tables, the warm light
    {
      const z0 = -h - 1.5, z1 = z0 - 16;
      put('flag', new THREE.PlaneGeometry(14.4, 16).rotateX(-Math.PI / 2).translate(0, 0, (z0 + z1) / 2));
      for (const sd of [-1, 1]) {
        wallBox(sd * 7.2 + (sd > 0 ? 0 : -1.2), sd * 7.2 + (sd > 0 ? 1.2 : 0), 0, 17, z1, z0, 'sandstone', 0);
        for (const zz of [z0 - 4.5, z0 - 9.75, z0 - 15]) addMesh(new THREE.PlaneGeometry(3.0, 7.2).rotateY(-sd * Math.PI / 2).translate(sd * 7.15, 6.6, zz), M.stairSky, { cast: false, recv: false });
      }
      for (const tx of [-5.3, -1.9, 1.9, 5.3]) { wallBox(tx - 0.52, tx + 0.52, 0.72, 0.79, z1, z0 - 3.0, 'oak', 0.02); for (const o of [-0.85, 0.85]) wallBox(tx + o - 0.16, tx + o + 0.16, 0.42, 0.48, z1, z0 - 3.3, 'oak', 0.02); }
      addMesh(new THREE.PlaneGeometry(14.4, 17).translate(0, 8.5, z1 + 0.05), M.hallGlow, { cast: false, recv: false });
      addMesh(new THREE.PlaneGeometry(14.4, 16).rotateX(Math.PI / 2).translate(0, 17, (z0 + z1) / 2), M.hallGlow, { cast: false, recv: false });
      const pl = new THREE.PointLight(new THREE.Color(1.0, 0.7, 0.4), 30, 16, 1.6); pl.position.set(0, 4, z0 - 3); sc.add(pl);
    }
    beam([-2.95, 7.5, -h + 0.15], [2.95, 7.5, -h + 0.15], 0.24, 'stairstone');
    for (const s of [-1, 1]) beam([s * 2.85, 0, -h + 0.15], [s * 2.85, 7.6, -h + 0.15], 0.24, 'stairstone');
    // the niches: tall pilasters, pedestals on two tiers, a knight on each
    const ks = { sword: [], spear: [] };
    for (const s of [-1, 1]) {
      for (let k = 0; k <= 4; k++) wallBox(s * (3.2 + k * 1.75) - 0.2, s * (3.2 + k * 1.75) + 0.2, 0, 9.3, -h, -h + 0.75, 'stairstone', 0.03);
      for (let k = 0; k < 4; k++) {
        const x = s * (3.2 + (k + 0.5) * 1.75);
        put('darkstone', new THREE.PlaneGeometry(1.35, 9.3).translate(x, 4.65, -h + 0.02));
        const ar = pathPts(new THREE.Shape(), [[-0.78, 7.4], [-0.6, 7.4], ...archHeadPts(0.6, 8.0, 'pointed', 0.9, 10), [0.6, 7.4], [0.78, 7.4], [0.78, 9.3], [-0.78, 9.3]]);
        put('stairstone', new THREE.ExtrudeGeometry(ar, { depth: 0.6, bevelEnabled: false }).translate(x, 0, -h + 0.1));
        for (const o of [-0.55, 0.55]) cyl(x + o, -h + 0.62, 0.9, 8.0, 0.05, 'stairstone', 8);
        for (const [py, ty] of [[0.0, 0.9], [4.35, 4.6]]) {
          wallBox(x - 0.62, x + 0.62, ty - 0.22, ty, -h, -h + 0.85, 'stairstone', 0.04);
          if (py > 0) wallBox(x - 0.45, x + 0.45, ty - 0.75, ty - 0.22, -h, -h + 0.55, 'stairstone', 0.04);
          ks[(k + (py > 0 ? 1 : 0) + (s > 0 ? 1 : 0)) % 2 ? 'spear' : 'sword'].push(xf([x, ty + 0.1, -h + 0.42], 0, [s * 1.12, 1.12, 1.12]));
        }
      }
    }
    for (const [kind, list] of Object.entries(ks)) {
      const g = knightGeo(kind), pos = list.filter((m) => m.determinant() > 0), neg = list.filter((m) => m.determinant() < 0);
      if (pos.length) addInst(g, M.carved, pos);
      if (neg.length) { const gm = g.clone(); const ix = gm.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } addInst(gm, M.carved, neg); }
    }
    blocked.push([0, 0, 0, 12]);
    blocked.push([0, 1, 0, 3.6]);
  }

  // ---- portraits: a crowded hang between the galleries, sizes and shapes varied, lanterns among them
  const points = [], lamps = [];
  for (let lv = 0; lv < GSTAIR.levels; lv++) {
    const y0 = lv * GSTAIR.step + (lv === 0 ? 1.4 : 1.2), y1 = (lv + 1) * GSTAIR.step - 1.25;
    walls.forEach(([nx, nz], wi) => {
      const free = (t, w, y, hh) => !blocked.some(([l, i, c, hw2]) => l === lv && i === wi && Math.abs(t - c) < hw2 + w / 2 && (lv === 0 || y - hh / 2 < 3.6))
        && !(lv === GSTAIR.levels - 1 && wi === 2 && STW.z.some((zc) => Math.abs(t - zc) < STW.hw + 0.55 + w / 2) && y + hh / 2 > STW.sill - lv * GSTAIR.step - 0.4);   // the top floor's windows
      // two lanterns per wall per floor
      for (const lt of [-h * 0.5, h * 0.5]) {
        const ly = lv * GSTAIR.step + 2.6;
        if (!free(lt, 0.5, ly - lv * GSTAIR.step, 0.6)) continue;
        const p = nx === 0 ? [lt, ly, -nz * h] : [-nx * h, ly, lt];
        place('lantern', xf(p, Math.atan2(nx, nz), 1));
        lamps.push([p[0] + nx * 0.45, ly + 0.1, p[2] + nz * 0.45]);
        LAMPS.push({ room: 'stair', p: [p[0] + nx * 0.45, ly + 0.1, p[2] + nz * 0.45], c: [1.0, 0.6, 0.28].map((v) => v * 9), r: 8, halo: 0.55, hk: 0.35, see: 34 });
      }
      let t = -h + 0.5;
      while (t < h - 0.6) {
        const w = 0.55 + R() * 1.25;
        if (t + w > h - 0.4) break;
        let y = y0 + R() * 0.3;
        while (y < y1 - 0.5) {
          const hh = Math.min(y1 - y, w * (0.9 + R() * 0.6));
          if (hh < 0.5) break;
          const c = t + w / 2, cy = y + hh / 2;
          const nearLamp = Math.abs(Math.abs(c) - h * 0.5) < w / 2 + 0.35 && Math.abs(cy - (lv * GSTAIR.step + 2.6)) < hh / 2 + 0.45;
          if (free(c, w, cy - lv * GSTAIR.step, hh) && !nearLamp && R() < 0.9) {
            const pos = nx === 0 ? [c, 0, -nz * h] : [-nx * h, 0, c];
            hangPicture(pos, cy, nx, nz, w * 0.86, hh * 0.86, R);
          }
          y += hh + 0.12 + R() * 0.15;
        }
        t += w + 0.1 + R() * 0.15;
      }
    });
  }
  flushPictures2(); flushFires();
  // an iron candle wheel hung on chains from the middle of the ceiling
  {
    const cy = TOP - 9.5, list = [];
    put('paintBlack', new THREE.TorusGeometry(1.7, 0.06, 8, 48).rotateX(Math.PI / 2).translate(0, cy, 0));
    put('paintBlack', new THREE.TorusGeometry(0.95, 0.05, 8, 36).rotateX(Math.PI / 2).translate(0, cy + 0.5, 0));
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; beam([Math.cos(a) * 0.95, cy + 0.5, Math.sin(a) * 0.95], [Math.cos(a) * 1.7, cy, Math.sin(a) * 1.7], 0.05, 'paintBlack'); }
    for (const [x, z] of [[1.7, 0], [-1.7, 0], [0, 1.7], [0, -1.7]]) beam([x, cy, z], [0, TOP - 0.5, 0], 0.035, 'paintBlack');
    for (let k = 0; k < 20; k++) { const a = (k / 20) * Math.PI * 2; list.push(xf([Math.cos(a) * 1.7, cy + 0.06, Math.sin(a) * 1.7], 0, [1, 0.9 + 0.3 * R(), 1])); }
    for (let k = 0; k < 10; k++) { const a = (k / 10 + 0.05) * Math.PI * 2; list.push(xf([Math.cos(a) * 0.95, cy + 0.56, Math.sin(a) * 0.95], 0, [1, 0.9 + 0.3 * R(), 1])); }
    candles(list);
    LAMPS.push({ room: 'stair', p: [0, cy + 0.6, 0], c: [1.0, 0.62, 0.3].map((v) => v * 10), r: 9, halo: 0.6, hk: 0.4, see: 60 });
    const pl = new THREE.PointLight(new THREE.Color(1.0, 0.64, 0.32), 0, 30, 1.6); pl.position.set(0, cy + 0.3, 0); pl.userData = { d: 10, n: 14 }; sc.add(pl); points.push(pl);
  }
  for (let i = 0; i < lamps.length; i += 3) {
    const [x, y, z] = lamps[i];
    const p = new THREE.PointLight(new THREE.Color(1.0, 0.6, 0.28), 0, 24, 1.5); p.position.set(x, y, z); p.userData = { d: 14, n: 7 }; sc.add(p); points.push(p);
  }
  // the sun through the west windows: shafts across the well onto the portraits of the east wall
  const sun = setSun(sc, new THREE.Vector3(-0.62, 0.55, 0.2), 62);
  sun.light.target.position.set(0, 52, 0);
  return { sun, sunI: 3.2, moonI: 0.7, envD: 0.26, envN: 0.035, points, levels: { day: [3, 12, 46, 150, 218], night: [3, 9, 30, 116, 212] } };
}
// flights between the galleries: [from, to], one per floor, turning round the well; floor 4's is swung out of line
let STAIR_SWING = null;   // floor 4's flight (the tour and the shorts swing only this one)
const STAIR_PIVOTS = [];
// how each flight moves (the snitch flight, 89c-snitch.js): pivot end e (0 the lower landing, 1 the upper), swing A
// (radians, signed: it swings from its landing out to A and back), period P (s), phase ph, and how far short of the far
// landing it stops (cut, m); it dwells at each end of its swing and crosses quickly between, like the films' staircases
// swinging round to a new landing. Searched so no flight leaves the well, meets another, or comes
// within 1.4 m of the snitch's way down (t counts from the start of its stair shot).
const STAIR_MOTION = [{ e: 1, A: 0.42, P: 7, ph: 3.142, cut: 1.9 }, { e: 0, A: 0.42, P: 9.5, ph: 2.88, cut: 1.9 }, { e: 0, A: 0.42, P: 8, ph: 2.618, cut: 1.9 },
  { e: 1, A: 0.42, P: 6.5, ph: 2.88, cut: 1.9 }, { e: 0, A: -0.42, P: 9.5, ph: 1.571, cut: 1.9 }, { e: 0, A: -0.42, P: 7, ph: 4.451, cut: 1.9 },
  { e: 0, A: 0.24, P: 8, ph: 5.76, cut: 1.9 }, { e: 1, A: -0.24, P: 9.5, ph: 0.262, cut: 1.9 }];   // t: seconds into the stair shot
// a moving flight stops short of the landing it swings away from (its free end in the air, the parapet's gap waiting)
function stairEnds(k) {
  const f = GSTAIR_FLIGHTS[k], m = STAIR_MOTION[k]; if (!m.A || !m.cut) return [f[0], f[1]];
  const pv = f[m.e], fe = f[1 - m.e], L = Math.hypot(fe[0] - pv[0], fe[2] - pv[2]), q = vmixS(fe, pv, m.cut / L);
  return m.e === 0 ? [pv, q] : [q, pv];
}
const vmixS = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const stairAngle = (m, t) => m.A * 0.5 * (1 + Math.tanh(2.2 * Math.sin((2 * Math.PI * t) / m.P + m.ph)) / Math.tanh(2.2));   // between 0 (at its landing) and A
function stairMove(t) { STAIR_PIVOTS.forEach((p, k) => { p.rotation.y = stairAngle(STAIR_MOTION[k], t); }); }
const GSTAIR_FLIGHTS = (() => {
  const i = GSTAIR.half - GSTAIR.gal, f = [];
  const ends = [[[-4, 0, i + 0.2], [-4, 10, -i - 0.2]], [[-i - 0.2, 10, -3], [i + 0.2, 20, 4]], [[3, 20, -i - 0.2], [-2, 30, i + 0.2]],
    [[i + 0.2, 30, 3], [-i - 0.2, 40, -4]], [[-1, 40, -i - 0.2], [6, 47, 2]], [[-i - 0.2, 50, 2], [i + 0.2, 60, -3]],
    [[4, 60, i + 0.2], [-4, 70, -i - 0.2]], [[-i - 0.2, 70, -4], [i + 0.2, 80, 5]]];
  for (const e of ends) f.push(e);
  return f;
})();
const GSTAIR_GAPS = (() => { // where each flight meets a gallery edge (its end points, by floor)
  const g = {};
  for (const [a, b] of GSTAIR_FLIGHTS) for (const p of [a, b]) { const lv = Math.round(p[1] / GSTAIR.step); if (Math.abs(p[1] - lv * GSTAIR.step) < 0.1) (g[lv] ||= []).push([p[0], p[2]]); }
  return g;
})();
