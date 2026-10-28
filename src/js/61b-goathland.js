// ------------------------------------------------------------------ Hogsmeade Station after Goathland (the first film) and the Hogwarts Express
// ref/station: s02-s05 (Goathland, North Yorkshire Moors Railway), s00 / s06 (GWR Hall 5972 'Hogwarts Castle').
// Two platforms on a gentle line with white edges; the red arched lattice footbridge spanning both tracks with stairs
// down to each platform (s05); the stone station building on the lake side; a cream weatherboarded waiting room with
// maroon trim (s04) and a red-brick hut (s05) on the far platform; cast-iron gas lamps, slatted benches, white picket
// fences; the HOGSMEADE nameboards. The engine: a GWR Hall 4-6-0 in red with a black smokebox, spoked wheels, a brass
// safety-valve bonnet, the HOGWARTS EXPRESS headboard and the crest on the tender.
M.clapboard = procMat({ name: 'clapboard', rgb: [0.72, 0.64, 0.46], rough: 0.65, uv: true, bump: 1, frag: /* glsl */ `
  float b = fract(UV.y / 0.17); float sh = smoothstep(0.0, 0.12, b);
  diffuseColor.rgb *= (0.72 + 0.28 * sh) * (0.93 + 0.1 * cgVn(P * 3.0));
  cgH = b * 0.012;
` });
M.brick = procMat({ name: 'brick', rgb: [1, 1, 1], rough: 0.85, uv: true, bump: 1, frag: /* glsl */ `
  vec2 bs = vec2(0.225, 0.075); vec2 uv = UV; float row = floor(uv.y / bs.y); uv.x += mod(row, 2.0) * bs.x * 0.5;
  vec2 f = fract(uv / bs) * bs; float e = min(min(f.x, bs.x - f.x), min(f.y, bs.y - f.y));
  float px = length(fwidth(uv)); float mortar = 1.0 - smoothstep(0.004, 0.004 + px, e); mortar = mix(mortar, 0.25, smoothstep(0.01, 0.05, px));
  float id = cgH21(floor(uv / bs));
  vec3 c = mix(vec3(0.3, 0.09, 0.05), vec3(0.42, 0.15, 0.08), id) * (0.85 + 0.25 * cgVn(P * 4.0));
  diffuseColor.rgb = mix(c, vec3(0.42, 0.4, 0.36), mortar); cgH = (1.0 - mortar) * 0.004;
` });
M.maroon = procMat({ name: 'maroon', rgb: [0.2, 0.025, 0.02], rough: 0.4 });
M.white = procMat({ name: 'white', rgb: [0.7, 0.69, 0.65], rough: 0.6 });
M.coal = procMat({ name: 'coal', rgb: [0.02, 0.02, 0.022], rough: 0.5, bump: 1, frag: /* glsl */ `cgH = cgVn(P * 14.0) * 0.04 + cgVn(P * 40.0) * 0.01; cgSpec = 1.4;` });
// painted boards and plates: the nameboard, the headboard, the tender crest, number plates
function decalMat(w, h, draw) {
  const map = canvasTex(w, h, (g) => draw(g, w, h));
  return new THREE.MeshStandardMaterial({ map, roughness: 0.45, metalness: 0.0, transparent: true, alphaTest: 0.4 });
}
function decal(mat, w, h, p, ry) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(...p); m.rotation.y = ry; m.receiveShadow = true; (TARGET || scene).add(m); return m; }
const serif = (px) => `bold ${px}px "Times New Roman", Georgia, serif`;

// the track, the engine and the coaches are in 61c-express.js
// the gas lamp and bench prototypes are in 61a-platform.js
function picketRun(xa, xb, z, y) {
  const pk = [];
  for (let x = xa; x < xb; x += 0.14) pk.push(xf([x, y, z], 0, 1));
  addInst(new THREE.BoxGeometry(0.07, 1.0, 0.025).translate(0, 0.5, 0), M.white, pk, null, { cast: false });
  for (const yy of [0.3, 0.8]) put('white', new THREE.BoxGeometry(xb - xa, 0.07, 0.03).translate((xa + xb) / 2, y + yy, z - 0.03));
}
// the arched lattice footbridge (s05): two arched girders over both tracks, a level deck with lattice parapets,
// lattice spandrels, landings and stairs down along each platform
function footbridge(FX, zA, zB, PY) {
  const crownY = PY + 5.4, zm = (zA + zB) / 2, c = (zB - zA) / 2, s = crownY - PY, R = (c * c + s * s) / (2 * s), cy = crownY - R;
  const a0 = Math.atan2(PY - cy, zA - zm), a1 = Math.atan2(PY - cy, zB - zm);
  const DY = PY + 6.0, dz0 = zA - 1.4, dz1 = zB + 1.4;
  const arcY = (zz) => cy + Math.sqrt(Math.max(0, R * R - (zz - zm) * (zz - zm)));
  for (const sx of [-1, 1]) {
    const x = FX + sx * 0.95;
    const sh = new THREE.Shape(); sh.absarc(0, 0, R + 0.2, a1, a0, false); sh.absarc(0, 0, R - 0.2, a0, a1, true);
    put('ironRed', new THREE.ExtrudeGeometry(sh, { depth: 0.16, bevelEnabled: false, curveSegments: 40 }).rotateY(-Math.PI / 2).translate(x + 0.08, cy, zm));
    wallBox(x - 0.08, x + 0.08, DY - 0.32, DY, dz0, dz1, 'ironRed', 0.01);
    wallBox(x - 0.05, x + 0.05, DY + 1.1, DY + 1.16, dz0, dz1, 'ironRed', 0.01);
    for (let zz = dz0; zz <= dz1 + 1e-3; zz += 0.9) {
      beam([x, DY, zz], [x, DY + 1.1, zz], 0.05, 'ironRed');
      if (zz + 0.9 <= dz1 + 1e-3) { beam([x, DY, zz], [x, DY + 1.1, zz + 0.9], 0.03, 'ironRed'); beam([x, DY + 1.1, zz], [x, DY, zz + 0.9], 0.03, 'ironRed'); }
      if (zz > zA + 0.3 && zz < zB - 0.3) {
        const ya = arcY(zz) + 0.2; if (DY - 0.32 - ya > 0.15) beam([x, ya, zz], [x, DY - 0.32, zz], 0.05, 'ironRed');
        const zn = zz + 0.9; if (zn < zB - 0.3) { const yb = arcY(zn) + 0.2; if (DY - 0.32 - yb > 0.25) { beam([x, ya, zz], [x, DY - 0.32, zn], 0.03, 'ironRed'); beam([x, DY - 0.32, zz], [x, yb, zn], 0.03, 'ironRed'); } }
      }
    }
  }
  wallBox(FX - 0.95, FX + 0.95, DY - 0.1, DY, dz0, dz1, 'timber', 0.01);
  for (let zz = dz0 + 0.5; zz < dz1; zz += 1.5) wallBox(FX - 0.9, FX + 0.9, DY - 0.32, DY - 0.1, zz - 0.06, zz + 0.06, 'ironRed', 0);
  // posts under the landings at the ends, stairs down along the platforms (north one toward +x, south toward -x)
  for (const [zz, dir] of [[dz0 + 0.7, 1], [dz1 - 0.7, -1]]) {
    for (const ox of [-0.9, 0.9]) for (const oz of [-0.7, 0.7]) beam([FX + ox, PY, zz + oz], [FX + ox, DY - 0.1, zz + oz], 0.14, 'ironRed');
    const sx0 = FX + dir * 0.95, L = 8.6, n = 30, rise = DY - PY;
    for (const oz of [-0.75, 0.75]) {
      beam([sx0, DY - 0.15, zz + oz], [sx0 + dir * L, PY - 0.05, zz + oz], 0.1, 'ironRed');
      beam([sx0, DY + 1.1, zz + oz], [sx0 + dir * L, PY + 1.1, zz + oz], 0.05, 'ironRed');
      for (let k = 0; k <= 9; k++) { const t = k / 9, xx = sx0 + dir * L * t, yy = lerp(DY, PY, t); beam([xx, yy, zz + oz], [xx, yy + 1.1, zz + oz], 0.04, 'ironRed'); }
    }
    for (let k = 0; k < n; k++) { const t = (k + 0.5) / n, xx = sx0 + dir * L * t, yy = lerp(DY, PY, (k + 1) / n); wallBox(xx - 0.15, xx + 0.15, yy - 0.04, yy, zz - 0.72, zz + 0.72, 'timber', 0.01); }
    beam([sx0 + dir * L, PY, zz - 0.75], [sx0 + dir * L, PY + 1.15, zz - 0.75], 0.09, 'ironRed');
    beam([sx0 + dir * L, PY, zz + 0.75], [sx0 + dir * L, PY + 1.15, zz + 0.75], 0.09, 'ironRed');
  }
}
// a cream weatherboarded waiting room with maroon corner boards, windows, door and bargeboards (s04)
function waitingRoom(x0, x1, z0, z1, PY, front) {
  const H = 2.9;
  const g = uvPlanar(new THREE.BoxGeometry(x1 - x0, H, z1 - z0).translate((x0 + x1) / 2, PY + H / 2, (z0 + z1) / 2)); put('clapboard', g);
  for (const xx of [x0, x1]) for (const zz of [z0, z1]) wallBox(xx - 0.09, xx + 0.09, PY, PY + H, zz - 0.09, zz + 0.09, 'maroon', 0.01);
  wallBox(x0 - 0.05, x1 + 0.05, PY, PY + 0.3, z0 - 0.05, z1 + 0.05, 'maroon', 0.01);
  const fz = front > 0 ? z1 : z0;
  for (let x = x0 + 1.4; x < x1 - 1; x += 2.4) {
    if (Math.abs(x - (x0 + x1) / 2) < 1.0) { wallBox(x - 0.5, x + 0.5, PY, PY + 2.25, fz - 0.06, fz + 0.06, 'maroon', 0.02); continue; }
    wallBox(x - 0.62, x + 0.62, PY + 0.95, PY + 2.35, fz - 0.07, fz + 0.07, 'maroon', 0.02);
    const pane = paneUV(new THREE.PlaneGeometry(1.04, 1.2), 1.04, 1.2); if (front < 0) pane.rotateY(Math.PI);
    put('roomStation', pane.translate(x, PY + 1.65, fz + front * 0.075));
    for (const ox of [-0.18, 0.18]) wallBox(x + ox - 0.02, x + ox + 0.02, PY + 1.05, PY + 2.25, fz - 0.1, fz + 0.1, 'maroon', 0);
    wallBox(x - 0.52, x + 0.52, PY + 1.62, PY + 1.66, fz - 0.1, fz + 0.1, 'maroon', 0);
  }
  gableRoof(x0 - 0.3, x1 + 0.3, z0 - 0.35, z1 + 0.35, PY + H, 1.3, { axis: 'x', over: 0.3, gables: [false, false], coping: false });
  for (const xx of [x0 - 0.32, x1 + 0.32]) {
    const tri = pathPts(new THREE.Shape(), [[z0 - 0.35, 0], [z1 + 0.35, 0], [(z0 + z1) / 2, 1.3]]);
    put('clapboard', new THREE.ShapeGeometry(tri).rotateY(-Math.PI / 2).translate(xx < x0 ? x0 : x1, PY + H, 0));
    for (const [za, ya, zb, yb] of [[z0 - 0.4, -0.05, (z0 + z1) / 2, 1.33], [(z0 + z1) / 2, 1.33, z1 + 0.4, -0.05]]) beam([xx, PY + H + ya, za], [xx, PY + H + yb, zb], 0.12, 'maroon');
  }
  put('brick', uvPlanar(new THREE.BoxGeometry(0.5, 1.1, 0.5).translate(x1 - 1.2, PY + H + 1.1, (z0 + z1) / 2 + 0.6)));
}
function brickHut(x0, x1, z0, z1, PY, front) {
  const H = 2.6;
  put('brick', uvPlanar(new THREE.BoxGeometry(x1 - x0, H, z1 - z0).translate((x0 + x1) / 2, PY + H / 2, (z0 + z1) / 2)));
  const fz = front > 0 ? z1 : z0, cx = (x0 + x1) / 2;
  wallBox(cx - 1.6, cx - 0.6, PY, PY + 2.15, fz - 0.06, fz + 0.06, 'maroon', 0.02);
  wallBox(cx + 0.4, cx + 1.5, PY + 1.0, PY + 2.1, fz - 0.07, fz + 0.07, 'white', 0.02);
  const pane = paneUV(new THREE.PlaneGeometry(0.94, 0.94), 0.94, 0.94); if (front < 0) pane.rotateY(Math.PI);
  put('roomStation', pane.translate(cx + 0.95, PY + 1.55, fz + front * 0.075));
  gableRoof(x0 - 0.25, x1 + 0.25, z0 - 0.3, z1 + 0.3, PY + H, 1.4, { axis: 'z', over: 0.25, gables: [false, false], coping: false });
  for (const zz of [z0, z1]) put('brick', uvPlanar(new THREE.ExtrudeGeometry(pathPts(new THREE.Shape(), [[x0, 0], [x1, 0], [(x0 + x1) / 2, 1.4]]), { depth: 0.12, bevelEnabled: false }).translate(0, PY + H, zz - 0.06)));
}
let TRAIN = null;
function buildStation(look) {
  const z = STN.z, z2 = STN.z + 4.5, y = STN.y, [px0, px1] = [STN.x0, STN.x1], PY = y + 0.75;
  railTrack(-240, 660, z); railTrack(-150, 200, z2);
  for (const zz of [z, z2]) { wallBox(-246 + (zz === z2 ? 90 : 0), -240 + (zz === z2 ? 90 : 0), y - 1, y + 1.4, zz - 1.6, zz + 1.6, 'timber', 0.04); }
  arcade(560, z - 9, 560, z + 9, y - 1, 9, 1, { kind: 'round', spring: 0.7, pier: 0.45, depth: 6, mat: 'stone' });
  wallBox(557, 563, y + 8, y + 9.2, z - 14, z + 14, 'stone', 0.05);
  // two platforms: stone faces, flagged tops, white edges
  const nz0 = z - 9, nz1 = z - 1.55, sz0 = z2 + 1.55, sz1 = z2 + 8.2;
  wallBox(px0, px1, y - 1.5, PY, nz0, nz1, 'stone', 0.05);
  wallBox(px0 + 20, px1 - 30, y - 1.5, PY, sz0, sz1, 'stone', 0.05);
  flagged(px0, px1, nz0, nz1 - 0.6, PY); flagged(px0 + 20, px1 - 30, sz0 + 0.6, sz1, PY);
  copingRun(px0, px1, nz1, 1, PY); copingRun(px0 + 20, px1 - 30, sz0, -1, PY);
  ramp(px0, -1, nz0, nz1, PY, y - 0.65, 9); ramp(px1, 1, nz0, nz1, PY, y - 0.65, 9);
  ramp(px0 + 20, -1, sz0, sz1, PY, y - 0.65, 9); ramp(px1 - 30, 1, sz0, sz1, PY, y - 0.65, 9);
  for (const [a, b, zz] of [[px0, -34.5, nz0 + 0.1], [-3.5, px1, nz0 + 0.1], [px0 + 20, px1 - 30, sz1 - 0.1]]) picketRun(a, b, zz, PY);
  // the stone station building on the lake-side platform, a short timber canopy along its front
  const bz1 = nz0 + 0.5 + 1.0, bz0 = bz1 - 7.5, bx0 = -34, bx1 = -4, EAVE = PY + 3.6;
  wallBox(bx0, bx1, y - 1, EAVE, bz0, bz1, 'stnStone', 0.03);
  gableRoof(bx0, bx1, bz0, bz1, EAVE, 3.2, { axis: 'x', over: 0.6 });
  for (const cx of [bx0 + 4, bx1 - 4]) place('chimney', xf([cx, EAVE + 2.4, (bz0 + bz1) / 2], 0, [0.9, 1.4, 0.7]));
  for (let x = bx0 + 2.5; x < bx1 - 1; x += 3.4) {
    if (Math.abs(x - (bx0 + 9)) < 1.2 || Math.abs(x - (bx1 - 9)) < 1.2) continue;
    sashWindow(x, PY + 0.85, bz1, 1.0, 1.7, 1);
  }
  for (const dx of [bx0 + 9, bx1 - 9]) panelDoor(dx, PY, bz1, 1.1, 2.15, 1);
  for (const [a, b] of [[bx0 - 0.05, bx0 + 9 - 0.8], [bx0 + 9 + 0.8, bx1 - 9 - 0.8], [bx1 - 9 + 0.8, bx1 + 0.05]]) wallBox(a, b, PY, PY + 0.35, bz1, bz1 + 0.06, 'stnDressed', 0.02);   // a plinth course
  const CY = PY + 3.3;
  for (let x = bx0 + 1; x <= bx1 - 1; x += 4.6) {   // cast-iron columns with scrolled brackets
    put('ironPaint', new THREE.LatheGeometry([[0, 0], [0.13, 0], [0.13, 0.08], [0.1, 0.14], [0.085, 0.3], [0.07, 0.34], [0.065, CY - PY - 0.4], [0.09, CY - PY - 0.3], [0.13, CY - PY - 0.14], [0.13, CY - PY], [0, CY - PY]].map(([r, h]) => new THREE.Vector2(r, h)), 20).translate(x, PY, bz1 + 2.6));
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, -1]]) put('ironPaint', new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[0, -0.75], [0.12, -0.35], [0.45, -0.12], [0.8, -0.04]].map(([u, v]) => new THREE.Vector3(x + dx * u, CY + v, bz1 + 2.6 + dz * u))), 16, 0.025, 6, false));
  }
  wallBox(bx0, bx1, CY, CY + 0.12, bz1, bz1 + 3.0, 'timber', 0.02);
  wallBox(bx0 - 0.03, bx1 + 0.03, CY - 0.05, CY + 0.2, bz1 + 2.96, bz1 + 3.04, 'cream', 0.01);
  valance(bx0, bx1, CY + 0.2, bz1 + 3.05);
  for (const xx of [bx0 - 0.04, bx1 + 0.04]) valance(bz1, bz1 + 3.05, CY + 0.2, xx, 'z');
  // the far platform: the waiting room and the brick hut
  waitingRoom(-22, -8, sz1 - 4.3, sz1 - 0.6, PY, -1);
  brickHut(16, 22, sz1 - 4.0, sz1 - 0.7, PY, -1);
  // lamps, benches, nameboards
  for (let x = px0 + 6; x < px1; x += 14) { gasLamp(x, PY, nz1 - 1.5); if (x > px0 + 20 && x < px1 - 30) gasLamp(x + 7, PY, sz0 + 1.5); }
  for (let x = px0 + 12; x < px1 - 6; x += 18) { if (x > bx0 - 2 && x < bx1 + 2) continue; place('bench', xf([x, PY, nz0 + 1.3], 0, 1)); }
  for (let x = px0 + 30; x < px1 - 34; x += 22) place('bench', xf([x, PY, sz1 - 0.9], Math.PI, 1));
  const nb = decalMat(1024, 160, (g, w, h) => { g.fillStyle = '#0c0c0c'; g.fillRect(0, 0, w, h); g.strokeStyle = '#e8e2d2'; g.lineWidth = 10; g.strokeRect(10, 10, w - 20, h - 20); g.fillStyle = '#ece6d6'; g.font = serif(104); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('HOGSMEADE', w / 2, h / 2 + 6); });
  for (const [x, zz, ry] of [[bx1 + 8, nz0 + 2.6, 0], [60, sz1 - 2.0, Math.PI]]) {
    for (const s of [-1, 1]) beam([x + s * 2.0, PY, zz], [x + s * 2.0, PY + 2.6, zz], 0.1, 'paintBlack');
    for (const f of [1, -1]) decal(nb, 4.4, 0.69, [x, PY + 2.3, zz + f * 0.03], ry + (f < 0 ? Math.PI : 0));
  }
  // the red footbridge over both tracks
  footbridge(40, nz1 - 2.2, sz0 + 2.2, PY);
  // the train: the engine to the east, six coaches behind it
  TRAIN = new THREE.Group(); scene.add(TRAIN);   // its own group, so the tour can bring it into the station
  inGroup(TRAIN, () => {
    buildLocomotive(88, z);
    for (let k = 0; k < 6; k++) buildCoach(88 - 19.25 - k * 20.3, z, k);
  });
  steamParked();
  // light from the train at night: the engine's lamps, and the compartments' lamps spilling out of the windows
  for (const oz of [-0.62, 0.62]) LAMPS.push({ obj: TRAIN, p: [88.4, y + 1.49, z + oz], c: [1.0, 0.8, 0.55].map((v) => v * 3), r: 7, on: () => NIGHT });
  for (let k = 0; k < 6; k++) {
    const x1 = 88 - 19.25 - k * 20.3, x0 = x1 - 19.6;
    for (const xx of [x0 + 5, x1 - 5]) for (const oz of [-1.2, 1.2]) LAMPS.push({ obj: TRAIN, p: [xx, y + 1.9, z + oz], c: [1.0, 0.66, 0.36].map((v) => v * 4), r: 7, on: () => NIGHT });
  }
  buildJetty(look);
  ribbon([[bx1 + 14, nz0 - 6], [80, nz0 - 14], [160, z - 40], [260, z - 60]], 3, 'dirt', 0.12);
}
