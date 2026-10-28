// ------------------------------------------------------------------ set joinery and glazing shared by the rooms
// Leaded lights in metres: diamond quarries ~16 x 26 cm, clear with a faint tint, a few amber / green / blue panes in
// the upper lights; daylight behind by day, a dark blue night. uv = position on the window in metres (x across, y up).
M.hglass = procMat({ name: 'hglass', rgb: [1, 1, 1], rough: 0.1, uv: true, frag: /* glsl */ `
  vec2 q = UV;
  vec2 dq = vec2(q.x / 0.13 + q.y / 0.21, q.x / 0.13 - q.y / 0.21);
  vec2 cell = floor(dq), fd = abs(fract(dq) - 0.5);
  float px = length(fwidth(dq)) * 0.7, w = 0.05;
  float lead = smoothstep(0.5 - w - px, 0.5 - w + px, max(fd.x, fd.y));
  float bar = 1.0 - smoothstep(0.012, 0.012 + fwidth(q.y), abs(fract(q.y / 0.65) - 0.5) * 0.65 - 0.3125);   // saddle bars
  lead = max(lead, bar * 0.85);
  lead = mix(lead, 0.16, smoothstep(0.25, 0.6, px));
  float id = cgH21(cell), id2 = cgH21(cell + 7.3);
  vec3 tint = mix(vec3(0.95, 0.97, 0.95), vec3(1.0, 0.98, 0.94), id);
  float up = smoothstep(9.0, 11.0, q.y);
  if (id2 > 1.0 - 0.14 * up) tint = id < 0.33 ? vec3(1.0, 0.62, 0.22) : id < 0.66 ? vec3(0.35, 0.7, 0.4) : vec3(0.35, 0.5, 1.0);
  vec3 sky = mix(vec3(0.7, 0.78, 0.84), vec3(1.0, 0.95, 0.86), cgVn(vec3(q * 0.35, 1.0)));
  vec3 day = sky * tint * (0.85 + 0.25 * cgVn(vec3(q * 0.8, 3.0))) * (0.985 + 0.03 * id);
  vec3 night = vec3(0.012, 0.022, 0.05) * tint;
  diffuseColor.rgb = vec3(0.015);
  cgEmit = mix(day * 5.5, night, uNight) * (1.0 - lead);
  cgSpec = 0.3; cgRough = mix(0.08, 0.5, lead);
` });
M.leather = procMat({ name: 'leather', rgb: [0.03, 0.075, 0.05], rough: 0.5, bump: 1, frag: /* glsl */ `
  float n = cgVn(P * 40.0); diffuseColor.rgb *= 0.8 + 0.35 * cgFbm3(P * 4.0); cgH = n * 0.0006;
` });
// the arch head of an opening from (-hw, ys) to (hw, ys): 'pointed' (two arcs of radius k * span) or 'tudor' (four-centred,
// rise k). Returns points from the left springer over the apex to the right springer.
function archHeadPts(hw, ys, kind, k, N = 14) {
  const L = [];
  if (kind === 'pointed') {
    const r = k * 2 * hw, cx = -hw + r, ta = Math.acos(clamp((0 - cx) / r, -1, 1));
    for (let i = 0; i <= N; i++) { const t = Math.PI + (ta - Math.PI) * (i / N); L.push([cx + r * Math.cos(t), ys + r * Math.sin(t)]); }
  } else {
    for (let i = 0; i <= N; i++) { const u = i / N; L.push([-hw + u * hw, ys + k * (Math.sqrt(1 - (1 - u) * (1 - u)) * 0.86 + 0.14 * Math.pow(u, 4))]); }
  }
  L[L.length - 1][0] = 0;
  const R = L.slice(0, -1).reverse().map(([x, y]) => [-x, y]);
  return [...L, ...R];
}
const archTop = (pts, x) => { for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1]; if ((x - ax) * (x - bx) <= 0 && ax !== bx) return ay + (by - ay) * (x - ax) / (bx - ax); } return pts[0][1]; };
function pathPts(path, pts, rev = false) { const P = rev ? [...pts].reverse() : pts; path.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) path.lineTo(P[i][0], P[i][1]); path.closePath(); return path; }
// an opening outline (bottom at 0): straight jambs up to ys, then the head (counter-clockwise)
function openingPts(hw, ys, kind, k) { return [[-hw, 0], [hw, 0], ...archHeadPts(hw, ys, kind, k).reverse()]; }
// a light: a rectangle from y0 with a small pointed head reaching y1
function lightPts(x0, x1, y0, y1) {
  const hw = (x1 - x0) / 2, cx = (x0 + x1) / 2, r = hw * 1.25, rise = Math.sqrt(r * r - (r - hw) * (r - hw)), ys = Math.max(y0 + 0.05, y1 - rise);
  return [[x0, y0], [x1, y0], ...archHeadPts(hw, ys, 'pointed', 0.625, 8).reverse().map(([x, y]) => [x + cx, y])];
}
function quatrefoilPts(cx, cy, R, n = 48) { const P = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, r = R * (0.68 + 0.32 * Math.abs(Math.cos(2 * a))); P.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return P; }
// stone tracery for a window: n lights across, transoms at the given heights, the head filled with panel tracery
// (perpendicular: mullions run up into the arch) or, for two lights, Y-tracery with a quatrefoil. Returns { stone, glass }
// geometries in a frame with the window bottom centre at the origin, facing +z.
function traceryWindow(w, ys, kind, k, n, transoms, { frame = 0.17, mull = 0.13, depth = 0.24 } = {}) {
  const hw = w / 2, outer = openingPts(hw, ys, kind, k), head = archHeadPts(hw, ys, kind, k);
  const sh = pathPts(new THREE.Shape(), outer);
  const lw = (w - 2 * frame - (n - 1) * mull) / n;
  const ty = [frame, ...transoms, ys];
  const holes = [];
  for (let c = 0; c < n; c++) {
    const x0 = -hw + frame + c * (lw + mull), x1 = x0 + lw;
    for (let t = 0; t < ty.length - 1; t++) holes.push(lightPts(x0, x1, ty[t] + (t ? mull / 2 : 0), ty[t + 1] - mull / 2));
    const top = Math.min(archTop(head, x0), archTop(head, x1)) - frame * 1.1;
    if (n > 2 && top - ys > 0.45) holes.push(lightPts(x0, x1, ys + mull / 2, top));
  }
  if (n === 2) {
    const apex = archTop(head, 0), rise = apex - ys;
    for (const s of [-1, 1]) { const x0 = s < 0 ? -hw + frame : mull / 2, x1 = s < 0 ? -mull / 2 : hw - frame; holes.push(lightPts(x0, x1, ys + mull / 2, ys + rise * 0.42)); }
    const R = Math.min(hw * 0.42, rise * 0.24);
    holes.push(quatrefoilPts(0, ys + rise * 0.42 + R + mull * 0.9, R));
  }
  for (const h of holes) sh.holes.push(pathPts(new THREE.Path(), h, true));
  const stone = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 1, curveSegments: 4 }).translate(0, 0, -depth / 2);
  const glass = new THREE.ShapeGeometry(pathPts(new THREE.Shape(), outer));
  const gp = glass.attributes.position, guv = glass.attributes.uv; for (let i = 0; i < gp.count; i++) guv.setXY(i, gp.getX(i), gp.getY(i));
  glass.translate(0, 0, -depth / 2 - 0.02);
  return { stone, glass };
}
// oak wainscot, a 2.4 m unit 2.8 m tall: stiles and rails, fielded panels, a moulded cap and a plinth; front toward +z
const WAINSCOT_H = 2.8;
{
  const P = [], H = WAINSCOT_H, cols = 4, rows = 4, st = 0.085, W = 2.4, top = H - 0.24, bot = 0.2;
  P.push(new THREE.BoxGeometry(W, H - 0.1, 0.04).translate(0, (H - 0.1) / 2, 0.02));
  const cw = (W - (cols + 1) * st) / cols, ch = (top - bot - (rows + 1) * st) / rows;
  for (let i = 0; i <= cols; i++) P.push(new THREE.BoxGeometry(st, top - bot, 0.035).translate(-W / 2 + st / 2 + i * (cw + st), (top + bot) / 2, 0.058));
  for (let j = 0; j <= rows; j++) P.push(new THREE.BoxGeometry(W, st, 0.035).translate(0, bot + st / 2 + j * (ch + st), 0.058));
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const x = -W / 2 + st + cw / 2 + i * (cw + st), y = bot + st + ch / 2 + j * (ch + st);
    P.push(new RoundedBoxGeometry(cw - 0.07, ch - 0.07, 0.04, 1, 0.018).translate(x, y, 0.052));
  }
  P.push(new THREE.BoxGeometry(W, 0.16, 0.12).translate(0, top + 0.08, 0.07), new THREE.BoxGeometry(W, 0.05, 0.19).translate(0, H - 0.025, 0.095), new THREE.BoxGeometry(W, 0.03, 0.15).translate(0, top + 0.17, 0.08));
  P.push(new THREE.BoxGeometry(W, bot, 0.1).translate(0, bot / 2, 0.06));
  protoDef('wainscot', [{ mat: 'oak', geo: merge(P) }]);
}
// wainscot along a wall line from (x0,z0) to (x1,z1), front facing the room (ry), base at y
function wainscotRun(x0, z0, x1, z1, y, ry) {
  const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 2.4)), s = L / n / 2.4;
  for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; place('wainscot', xf([lerp(x0, x1, t), y, lerp(z0, z1, t)], ry, [s, 1, 1])); }
}
// a turned leg / baluster profile as a lathe, height h, base radius r
function turnedGeo(h, r, segs = 12) {
  const pr = [[0, 0], [r, 0], [r, 0.1], [r * 0.7, 0.14], [r * 1.15, 0.3], [r * 0.7, 0.47], [r * 0.85, 0.58], [r * 0.6, 0.68], [r * 0.85, 0.86], [r * 0.85, 1], [0, 1]];
  return new THREE.LatheGeometry(pr.map(([a, b]) => new THREE.Vector2(a, b * h)), segs);
}
