// ------------------------------------------------------------------ the castle, batch 1: the lake front
// Coordinates follow SITE (05-site.js). Heights: castle floor 0, loch -60.

function buildGreatHall() {
  const [x0, z0, x1, z1] = SITE_BY.hall.rect, EAVE = 24, BAY = 7;
  wallBox(x0, x1, -24, EAVE, z0, z1);
  wallBox(x0 - 0.6, x1, -24, 1.2, z0 - 0.6, z1 + 0.6, 'stone', 0.1);
  wallBox(x0 - 0.5, x1, EAVE - 0.6, EAVE + 0.2, z0 - 0.5, z1 + 0.5, 'trim', 0.05);
  corbelTable(x0, z1, x1, z1, EAVE - 0.6, 0, 1); corbelTable(x0, z0, x1, z0, EAVE - 0.6, 0, -1);
  wallBox(x0, x1, EAVE + 0.2, EAVE + 1.5, z1 - 0.2, z1 + 0.25, 'trim', 0.04);
  wallBox(x0, x1, EAVE + 0.2, EAVE + 1.5, z0 - 0.25, z0 + 0.2, 'trim', 0.04);
  const nb = Math.round((x1 - x0) / BAY);
  for (let i = 0; i <= nb; i++) {
    const x = x0 + i * BAY;
    buttress(x, z1, 0, 1, -22, EAVE + 1, { pin: 9, d: 2 });
    buttress(x, z0, 0, -1, -9, EAVE + 1, { pin: 9, d: 2 });
  }
  for (let i = 0; i < nb; i++) {
    const x = x0 + (i + 0.5) * BAY;
    win('lancet', [x, 6.5, z1], 0, 1, 2.8, 14, 1, 0.95);
    win('lancet', [x, 6.5, z0], 0, -1, 2.8, 14, 1, 0.95);
  }
  gableRoof(x0, x1, z0, z1, EAVE, 20, { axis: 'x', gables: [true, false] });
  for (let i = 0; i < nb; i++) for (const [f, s] of [[0.25, 1.7], [0.6, 1.3]]) {
    const x = x0 + (i + 0.5) * BAY, half = (z1 - z0) / 2;
    place('dormer', xf([x, EAVE + f * 20 - 0.3, z1 - f * half + 0.2], 0, s), [winRng() < 0.4 ? 1 : 0, winRng(), 0]);
    place('dormer', xf([x, EAVE + f * 20 - 0.3, z0 + f * half - 0.2], Math.PI, s), [winRng() < 0.4 ? 1 : 0, winRng(), 0]);
  }
  // west gable: great window between octagonal corner turrets
  win('lancet', [x0, 5, (z0 + z1) / 2], -1, 0, 6.5, 17, 3, 0.95);
  for (const z of [z0, z1]) {
    cyl(x0, z, -22, EAVE + 8, 2.3, 'stone', 8);
    band(x0, z, EAVE, 2.3, 0.5, 0.3);
    spire(x0, z, EAVE + 8, 2.6, 11, 8, Math.PI / 8);
  }
  pinnacle(x0, EAVE + 20, (z0 + z1) / 2, 1, 7);
}

M.doorGlow = procMat({ name: 'doorGlow', rgb: [0.25, 0.17, 0.09], rough: 0.9, frag: /* glsl */ `
  cgEmit = vec3(1.0, 0.62, 0.3) * (0.03 + 5.0 * uLamp);
` });
function buildPorch() {
  const [x0, z0, x1, z1] = SITE_BY.porch.rect, EAVE = 27, xm = (x0 + x1) / 2;
  wallBox(x0, x1, -9, EAVE, z0, z1);
  wallBox(x0 - 0.5, x1 + 0.5, EAVE - 0.6, EAVE + 0.2, z0, z1 + 0.5, 'trim', 0.05);
  gableRoof(x0, x1, z0, z1, EAVE, 11, { axis: 'z', gables: [false, true] });
  for (const x of [x0, x1]) { buttress(x, z1, 0, 1, -9, EAVE + 1, { pin: 8, d: 1.6 }); }
  clockFace(xm, EAVE + 4.2, z1, 1.7, 0, 1);
  win('lancet', [xm, -0.5, z1], 0, 1, 3.6, 8.5, 0, 1);
  // the oak doors under the great window, onto the courtyard: two studded leaves folded back against the wall, the
  // doorway between them lit from the Entrance Hall at night
  {
    const DW = 3.0, D0 = -5, D1 = -0.75, zf = z1, H = D1 - D0, w = DW / 2, open = 155 * D2R;
    wallBox(xm - DW / 2 - 0.45, xm - DW / 2, D0, D1 + 0.4, zf, zf + 0.32, 'trim', 0.03);
    wallBox(xm + DW / 2, xm + DW / 2 + 0.45, D0, D1 + 0.4, zf, zf + 0.32, 'trim', 0.03);
    wallBox(xm - DW / 2 - 0.45, xm + DW / 2 + 0.45, D1, D1 + 0.4, zf, zf + 0.32, 'trim', 0.03);
    put('roomHall', paneUV(new THREE.PlaneGeometry(DW, H), DW, H).translate(xm, D0 + H / 2, zf + 0.1));   // the Entrance Hall seen through the doors
    const LG = lanternGeo(1.8);
    for (const s of [-1, 1]) {
      const x = xm + s * (DW / 2 + 1.1), y = D0 + 3.4, z = zf + 0.05;
      beam([x, y + 0.75, z], [x, y + 0.75, z + 0.6], 0.05, 'paintBlack'); beam([x, y + 0.3, z], [x, y + 0.75, z + 0.45], 0.035, 'paintBlack');
      const at = (g) => g.clone().translate(x, y - 0.1, z + 0.6);
      put('paintBlack', at(LG.frame)); put('lanternGlass', at(LG.glass)); put('mantle', at(LG.flame));
      LAMPS.push({ p: [x, y + 0.15, z + 0.6], c: [1.0, 0.6, 0.28].map((v) => v * 7), r: 10, halo: 0.75, hk: 0.35 });
    }
    for (const s of [-1, 1]) {   // a leaf built along +x from its hinge, then swung out about the jamb
      const ry = Math.atan2(-Math.sin(open), -s * Math.cos(open)), hx = xm + s * DW / 2, hz = zf + 0.36;
      const at = (g) => g.rotateY(ry).translate(hx, 0, hz);
      put('timber', at(new THREE.BoxGeometry(w - 0.04, H - 0.02, 0.14).translate(w / 2, D0 + H / 2, 0)));
      for (const f of [-1, 1]) {
        for (const y of [D0 + 0.7, D0 + H / 2, D1 - 0.6]) put('paintBlack', at(new THREE.BoxGeometry(w * 0.85, 0.09, 0.03).translate(w * 0.45, y, f * 0.085)));
        for (let a = 0; a < 3; a++) for (let b = 0; b < 6; b++) put('paintBlack', at(new THREE.SphereGeometry(0.035, 6, 4).translate(w * (0.22 + a * 0.28), D0 + 0.45 + b * 0.62, f * 0.08)));
      }
    }
  }
  win('lancet', [xm, 11, z1], 0, 1, 3.4, 11, 2, 0.9);
  winRow('lancet', x1, z1 - 2, x1, z0 + 8, 13, 2, 1.6, 6, { side: -1 });
  pinnacle(xm, EAVE + 11, z1 - 0.3, 0.9, 6);
  // a short link east of the porch, joining the Grand Staircase Tower behind it
  wallBox(x1, -44, -9, 24, 26, 38);
  gableRoof(x1, -44, 26, 38, 24, 7, { axis: 'x', gables: [false, true] });
  // the range east of it, where the courtyard behind the terrace meets the gully west tower
  gothicRange({ x0: -44, x1: -30, z0: 24, z1: 44, axis: 'z', base: -9, eave: 22, floors: [2, 7.5, 13, 17.5], chimneys: 1, dormers: 'stone', ends: [false, true], bays: false });
}

// the Grand Staircase's tall windows over the Quad, high on the tower (the stair set's west wall, 64-stair.js): angle of
// the middle one (0 east, 90 south), spacing, sill, width, height. The middle one's lower casements stand open outward:
// the snitch flies in there (89c-snitch.js).
const GT_WIN = { a: -38 * D2R, da: 12 * D2R, y: 35, w: 2.2, h: 9.4, tr: 4.6 };
M.casement = procMat({ name: 'casement', rgb: [0.035, 0.04, 0.042], rough: 0.08, uv: true, frag: /* glsl */ `
  vec2 dq = vec2(UV.x + UV.y * 0.6, UV.x - UV.y * 0.6) * 7.0, fd = abs(fract(dq) - 0.5);
  float lead = smoothstep(0.44, 0.47, max(fd.x, fd.y));
  diffuseColor.rgb = mix(diffuseColor.rgb * (0.8 + 0.4 * cgVn(vec3(UV * 6.0, 1.0))), vec3(0.02), lead);
  cgRough = mix(0.05, 0.5, lead); cgSpec = mix(1.5, 0.2, lead);
` });
M.gtInside = procMat({ name: 'gtInside', rgb: [0.01, 0.01, 0.01], rough: 1, uv: true, frag: /* glsl */ `
  // the stairwell seen through the open lights from the bright day outside: near dark, a little lighter toward the top
  float g = (0.6 + 0.5 * cgVn(vec3(UV * vec2(1.2, 0.7), 2.0))) * (0.5 + 0.5 * smoothstep(0.0, 4.6, UV.y));
  cgEmit = vec3(0.016, 0.012, 0.009) * g;
` });
function grandWindows(x, z, r) {
  const { w, h, tr } = GT_WIN, hw = w / 2, hs = h - w * 0.866;
  for (const k of [-1, 0, 1]) {
    const a = GT_WIN.a + k * GT_WIN.da, nx = Math.cos(a), nz = Math.sin(a), p = [x + nx * r, GT_WIN.y, z + nz * r];
    if (k) { win('lancet', p, nx, nz, w, h, 1, 0.3); continue; }
    const m = xf(p, Math.atan2(nx, nz), 1), add = (mat, g) => put(mat, g.applyMatrix4(m));
    const outer = archShape('lancet', w + 0.5, hs, -0.25); outer.holes.push(archShape('lancet', w, hs));
    add('trim', new THREE.ExtrudeGeometry(outer, { depth: 0.4, bevelEnabled: false, curveSegments: 8 }).translate(0, 0, -0.05));
    add('trim', new THREE.BoxGeometry(w + 0.6, 0.16, 0.6).translate(0, -0.3, 0.25));                      // the sill
    add('trim', new THREE.BoxGeometry(w, 0.2, 0.32).translate(0, tr, 0.12));                               // the transom
    add('trim', new THREE.BoxGeometry(0.16, hs + w * 0.866 - tr, 0.3).translate(0, (tr + hs + w * 0.866) / 2, 0.12));   // the mullion above it
    const up = new THREE.ShapeGeometry(pathPts(new THREE.Shape(), [[-hw, tr], [hw, tr], ...archHeadPts(hw, hs, 'pointed', 1.0).reverse()]));
    const uv = up.attributes.uv, pp = up.attributes.position; for (let i = 0; i < pp.count; i++) uv.setXY(i, pp.getX(i), pp.getY(i));
    add('casement', up.translate(0, 0, 0.06));
    // the open lower lights: the dim stairwell inside, two leaded casements swung out on their hinges at the jambs
    const ins = new THREE.PlaneGeometry(w, tr).translate(0, tr / 2, 0.04); const iu = ins.attributes.uv, ip = ins.attributes.position; for (let i = 0; i < ip.count; i++) iu.setXY(i, ip.getX(i), ip.getY(i));
    add('gtInside', ins);
    for (const sd of [-1, 1]) {
      const sw = new THREE.Matrix4().makeTranslation(sd * hw, 0, 0.12).multiply(new THREE.Matrix4().makeRotationY(sd * 1.15)).multiply(new THREE.Matrix4().makeTranslation(-sd * hw, 0, -0.12));
      const lc = sd * hw / 2, pane = new THREE.PlaneGeometry(hw - 0.12, tr - 0.22).translate(lc, tr / 2, 0.12);
      const pu = pane.attributes.uv, pq = pane.attributes.position; for (let i = 0; i < pq.count; i++) pu.setXY(i, pq.getX(i), pq.getY(i));
      add('casement', pane.applyMatrix4(sw));
      for (const g of [new THREE.BoxGeometry(hw, 0.07, 0.06).translate(lc, 0.08, 0.12), new THREE.BoxGeometry(hw, 0.07, 0.06).translate(lc, tr - 0.1, 0.12),
        new THREE.BoxGeometry(0.07, tr - 0.1, 0.06).translate(sd * 0.05, tr / 2, 0.12), new THREE.BoxGeometry(0.07, tr - 0.1, 0.06).translate(sd * (hw - 0.04), tr / 2, 0.12),
        new THREE.BoxGeometry(hw, 0.04, 0.05).translate(lc, tr / 2, 0.12)]) add('lead', g.applyMatrix4(sw));
    }
  }
}
function buildGrandTower() {
  const [x, z, r] = SITE_BY.grand.circle;
  const rows = [], near = (a) => Math.abs(((a - GT_WIN.a) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI) < GT_WIN.da * 1.6;
  for (let y = 3; y < 48; y += 4.3) rows.push({ kind: 'rect', y, n: 15, w: 0.95, h: 1.8, lit: 0.45, skip: y > GT_WIN.y - 3 ? near : null });
  const ey = roundTower({ x, z, r, y0: -12, y1: 50, cone: 50, kick: 0.11, bands: [15.5, 32.5], winRows: rows,
    dormers: [[0.1, 14, 1.5], [0.3, 11, 1.35], [0.5, 8, 1.2], [0.68, 5, 1.05]], seed: 'grand' });
  // Headmaster's turrets cling to the west of the cone
  const tur = [[200, 2.7, 37, 68, 11], [218, 2.0, 44, 72, 9], [184, 1.8, 47, 63, 7.5]];
  for (const [deg, tr, ty0, ty1, th] of tur) {
    const a = deg * D2R, cx = x + Math.cos(a) * (r + tr * 0.55), cz = z + Math.sin(a) * (r + tr * 0.55);
    put('trim', new THREE.CylinderGeometry(tr, 0.3, 5, 16).translate(cx, ty0 - 2.5, cz));
    cyl(cx, cz, ty0, ty1, tr, 'stone', 20);
    band(cx, cz, ty1 - 0.5, tr, 0.5, 0.25);
    winRing('rect', cx, cz, tr, ty1 - 6, 4, 0.7, 1.5, { lit: 0.7 });
    cone(cx, cz, ty1, tr + 0.35, th * 1.35, { n: 20, kick: 0.12 });
  }
  grandWindows(x, z, r);
  void ey;
}

// a pointed (equilateral) arch's intrados from the left springing over the apex to the right: span w centred on cx at ys
function lancetPts(cx, w, ys, n = 10) {
  const L = [], R = [], a1 = Math.PI / 3;
  for (let k = 0; k <= n; k++) { const a = (k / n) * a1; L.push([cx + w / 2 - w * Math.cos(a), ys + w * Math.sin(a)]); R.push([cx - w / 2 + w * Math.cos(a), ys + w * Math.sin(a)]); }
  return [...L, ...R.reverse().slice(1)];
}
// the loggia: on the outer side (zo) a wall of n pointed openings over a parapet, each with a mullion, two cusped
// lights and a foiled circle in the head, moulded rings round the arches; on the courtyard side (zi) an open arcade of
// pointed arches on clustered columns with moulded bases and bell capitals; a beamed timber ceiling between
function loggia(xa, xb, zo, zi, Y, H, n) {
  const bw = (xb - xa) / n, ow = bw - 0.7, sill = Y + 1.0, ysp = Y + 3.6;
  const outer = new THREE.Shape(); pathPts(outer, [[xa, Y], [xb, Y], [xb, Y + H], [xa, Y + H]]);
  for (let k = 0; k < n; k++) { const cx = xa + (k + 0.5) * bw; outer.holes.push(pathPts(new THREE.Path(), [[cx - ow / 2, sill], [cx + ow / 2, sill], ...lancetPts(cx, ow, ysp).reverse()])); }
  put('stone', new THREE.ExtrudeGeometry(outer, { depth: 0.7, bevelEnabled: false, curveSegments: 4 }).translate(0, 0, zo - 0.35));
  for (let k = 0; k < n; k++) {
    const cx = xa + (k + 0.5) * bw, sw = (ow - 0.14) / 2;
    put('trim', new RoundedBoxGeometry(ow + 0.1, 0.16, 0.9, 2, 0.03).translate(cx, sill + 0.02, zo));   // the sill
    put('trim', new RoundedBoxGeometry(0.14, ysp + 0.9 * sw - sill, 0.22, 2, 0.03).translate(cx, (sill + ysp + 0.9 * sw) / 2, zo));   // the mullion
    for (const s of [-1, 1]) put('trim', tube(lancetPts(cx + s * (sw + 0.14) / 2, sw, ysp, 8).map(([x, y]) => [x, y, zo]), 0.06, 24, 6));
    const yc = ysp + 0.866 * sw + 0.55;
    put('trim', new THREE.TorusGeometry(0.42, 0.055, 6, 28).translate(cx, yc, zo));
    for (const [dx, dy] of [[0.17, 0], [-0.17, 0], [0, 0.17], [0, -0.17]]) put('trim', new THREE.TorusGeometry(0.15, 0.035, 5, 16).translate(cx + dx, yc + dy, zo));
    for (const f of [-1, 1]) put('trim', tube(lancetPts(cx, ow + 0.22, ysp - 0.11, 10).map(([x, y]) => [x, y, zo + f * 0.37]), 0.07, 28, 6));   // the arch's mouldings
  }
  // the courtyard side: the arch plate rests on the columns, its lower edge the intrados of each arch
  const cw = 0.55, ys2 = Y + 3.7, ow2 = bw - cw, xs = (k) => xa + k * bw, pts = [[xa - 0.3, Y + H], [xb + 0.3, Y + H], [xb + 0.3, ys2]];
  for (let k = n; k >= 1; k--) { pts.push([xs(k) - cw / 2, ys2]); pts.push(...lancetPts(xs(k) - bw / 2, ow2, ys2).reverse().slice(1, -1)); pts.push([xs(k - 1) + cw / 2, ys2]); }
  pts.push([xa - 0.3, ys2]);
  put('stone', new THREE.ExtrudeGeometry(pathPts(new THREE.Shape(), pts), { depth: 0.6, bevelEnabled: false, curveSegments: 4 }).translate(0, 0, zi - 0.3));
  for (let k = 1; k <= n; k++) for (const f of [-1, 1]) put('trim', tube(lancetPts(xs(k) - bw / 2, ow2 + 0.2, ys2 - 0.1, 10).map(([x, y]) => [x, y, zi + f * 0.32]), 0.07, 28, 6));
  const shaft = (x) => {
    put('trim', new RoundedBoxGeometry(0.7, 0.35, 0.7, 2, 0.04).translate(x, Y + 0.175, zi));
    put('trim', lathe([[0, 0.35], [0.3, 0.35], [0.3, 0.42], [0.24, 0.48], [0.26, 0.54], [0.2, 0.6], [0, 0.6]], 24).translate(x, Y, zi));
    put('trim', new THREE.CylinderGeometry(0.17, 0.18, ys2 - Y - 1.15, 20).translate(x, Y + 0.6 + (ys2 - Y - 1.15) / 2, zi));
    for (const [dx, dz] of [[0.2, 0], [-0.2, 0], [0, 0.2], [0, -0.2]]) put('trim', new THREE.CylinderGeometry(0.075, 0.075, ys2 - Y - 1.15, 10).translate(x + dx, Y + 0.6 + (ys2 - Y - 1.15) / 2, zi + dz));
    put('trim', lathe([[0, ys2 - Y - 0.55], [0.22, ys2 - Y - 0.55], [0.24, ys2 - Y - 0.5], [0.27, ys2 - Y - 0.3], [0.36, ys2 - Y - 0.16], [0, ys2 - Y - 0.16]], 24).translate(x, Y, zi));
    put('trim', new THREE.CylinderGeometry(0.44, 0.44, 0.16, 8).rotateY(Math.PI / 8).translate(x, ys2 - 0.08, zi));
  };
  for (let k = 0; k <= n; k++) shaft(xs(k));
  // the ceiling: boards on beams over each column line
  wallBox(xa, xb, Y + H - 0.25, Y + H - 0.05, zi + 0.3, zo - 0.35, 'timber', 0.01);
  for (let k = 0; k <= n; k++) wallBox(xs(k) - 0.14, xs(k) + 0.14, Y + H - 0.62, Y + H - 0.25, zi + 0.3, zo - 0.35, 'timber', 0.01);
  // lanterns on every third column, facing the courtyard
  const LG = lanternGeo(1.6);
  for (let k = 2; k < n; k += 3) {
    const x = xs(k), z = zi - 0.3;
    beam([x, Y + 3.0, z], [x, Y + 3.0, z - 0.55], 0.05, 'paintBlack');
    const at = (g) => g.clone().translate(x, Y + 2.25, z - 0.55);
    put('paintBlack', at(LG.frame)); put('lanternGlass', at(LG.glass)); put('mantle', at(LG.flame));
    LAMPS.push({ p: [x, Y + 2.48, z - 0.55], c: [1.0, 0.6, 0.28].map((v) => v * 7), r: 10, halo: 0.7, hk: 0.35 });
  }
}
function buildTerrace() {
  const [x0, z0, x1, z1] = SITE_BY.terrace.rect, Y = -5;
  wallBox(x0, x1, -46, Y, z0, z1);
  wallBox(x0 - 0.4, x1, Y - 0.5, Y + 0.1, z0, z1 + 0.4, 'trim', 0.05);
  // the arcaded loggia along the south edge (m66), with a lead roof; the courtyard is flagged
  flagged(x0, x1, z0, z1, Y + 0.11);   // on the platform's dressed top
  loggia(-70, -24, z1 - 0.6, z1 - 4.6, Y, 7.5, 13);
  wallBox(-70.5, -23.5, Y + 7.5, Y + 8.3, z1 - 5.2, z1 + 0.2, 'trim', 0.05);
  gableRoof(-70.5, -23.5, z1 - 5.2, z1 + 0.2, Y + 8.3, 2.2, { axis: 'x', over: 0.3, coping: false });
  for (let i = 0; i <= 13; i++) pinnacle(lerp(-70, -24, i / 13), Y + 8.3, z1 + 0.1, 0.55, 3.2);
  merlons(x0 + 1, z0, x0 + 1, z1, Y, { h: 1.1, mw: 1.2, gap: 0.5 });
  merlons(-19, z1 - 0.4, x1, z1 - 0.4, Y, { h: 1.1, mw: 1.2, gap: 0.5 });   // open from the loggia to here: the top of the boathouse stairs
  const [cx, cz, cr] = SITE_BY.cturret.circle;
  roundTower({ x: cx, z: cz, r: cr, y0: -44, y1: 5, cone: 10, mach: false, kick: 0.12,
    winRows: [{ kind: 'rect', y: -2, n: 5, w: 0.7, h: 1.4 }, { kind: 'rect', y: 1, n: 5, w: 0.7, h: 1.4 }] });
  // the gully west tower and the block that joins it to the Grand Staircase Tower
  const [gx, gz, gr] = SITE_BY.gwtower.circle;
  roundTower({ x: gx, z: gz, r: gr, y0: -36, y1: 33, cone: 28, kick: 0.12, bands: [-6, 12],
    winRows: [-2, 5, 12.5, 19, 26].map((y) => ({ kind: 'lancet', y, n: 7, w: 0.9, h: 3.2, lit: 0.5 })) });
  wallBox(-30, -14, -8, 25, 6, 24);
  gableRoof(-30, -14, 6, 24, 25, 8, { axis: 'z' });
  winRow('lancet', -30, 24, -14, 24, 14, 3, 1.4, 5);
  wallBox(-27, -16, -6, 18, 36, 44);
  arcade(-27, 44, -16, 44, -5, 12, 1, { kind: 'lancet', spring: 0.95, pier: 0.25, depth: 1.2 });
}

function buildGalleryBridge() {
  const [x0, z0, x1, z1] = SITE_BY.bridge.rect, zc = (z0 + z1) / 2, D = -3;
  arcade(x0, zc, x1, zc, -50, 40, 7, { kind: 'round', spring: 0.84, pier: 0.24, depth: z1 - z0 - 0.6 });
  arcade(x0, zc, x1, zc, D - 7.4, 7.4, 21, { kind: 'round', spring: 0.78, pier: 0.32, depth: z1 - z0 });
  wallBox(x0, x1, D - 7.9, D - 7.3, z0 - 0.35, z1 + 0.35, 'trim', 0.05);
  wallBox(x0, x1, D, D + 0.55, z0 - 0.3, z1 + 0.3, 'trim', 0.05);
  wallBox(x0, x1, D + 0.55, D + 1.6, z1 - 0.15, z1 + 0.3, 'trim', 0.05);
  wallBox(x0, x1, D + 0.55, D + 1.6, z0 - 0.3, z0 + 0.15, 'trim', 0.05);
  for (let i = 0; i <= 7; i++) for (const z of [z0 - 0.1, z1 + 0.1]) place('merlon', xf([lerp(x0, x1, i / 7), D + 1.6, z], 0, [0.8, 1.0, 0.8]));
}

function buildSouthWing() {
  // the Viaduct Entrance as on the model (m66): five bays each side of a gabled centre bay, buttresses with pinnacles
  // between the bays, two storeys of tall two-light windows and a row of smaller ones above; the centre bay has a
  // Tudor-arched doorway onto the forecourt at the end of the viaduct, three tall lights over it, a quatrefoil in the gable
  const [x0, z0, x1, z1] = SITE_BY.south.rect, EAVE = 30, BAY = 3.8, xm = (x0 + x1) / 2, D = -3;
  wallBox(x0, x1, -16, EAVE, z0, z1);
  wallBox(x0, x1, -16, D + 0.6, z1 - 0.2, z1 + 0.6, 'stone', 0.1);
  for (const y of [9.6, 19.2]) wallBox(x0, x1, y, y + 0.35, z1 - 0.1, z1 + 0.3, 'trim', 0.04);
  wallBox(x0, x1, EAVE - 0.7, EAVE + 0.2, z0 - 0.4, z1 + 0.5, 'trim', 0.05);
  corbelTable(x0, z1, x1, z1, EAVE - 0.7, 0, 1);
  wallBox(x0, x1, EAVE + 0.2, EAVE + 1.6, z1, z1 + 0.4, 'trim', 0.04);
  const bx0 = xm - 6, bx1 = xm + 6, nb = Math.round((x1 - x0) / BAY);
  for (let i = 0; i < nb; i++) {
    const x = x0 + (i + 0.5) * ((x1 - x0) / nb);
    if (x > bx0 - 1 && x < bx1 + 1) continue;
    win('lancet', [x, 0.2, z1], 0, 1, 1.8, 7.6, 1, 0.55);
    win('lancet', [x, 10.6, z1], 0, 1, 1.8, 7.0, 1, 0.55);
    win('lancet', [x, 20.4, z1], 0, 1, 1.4, 5.2, 0, 0.5);
    for (const y of [2, 11, 20.5]) win('lancet', [x, y, z0], 0, -1, 1.5, 4.6, 0, 0.5);
  }
  for (let i = 1; i < nb; i++) {
    const x = x0 + i * ((x1 - x0) / nb);
    if (x > bx0 - 1 && x < bx1 + 1) continue;
    buttress(x, z1, 0, 1, -16, EAVE + 1.2, { w: 0.9, d: 1.0, pin: 4.5 });
  }
  gableRoof(x0, x1, z0, z1, EAVE, 15, { axis: 'x' });
  for (const x of [x0 + 7, x0 + 15, x1 - 15, x1 - 7]) place('dormer', xf([x, EAVE + 4.5, z1 - 3.0], 0, 1.6), [winRng() < 0.5 ? 1 : 0, winRng(), 0]);
  for (const x of [x0 + 9, x1 - 9]) place('chimney', xf([x, EAVE + 11, (z0 + z1) / 2], 0, [1.6, 2.2, 1.2]));
  // the centre bay
  const bz1 = z1 + 4;
  wallBox(bx0, bx1, -16, EAVE + 4, z1 - 2, bz1);
  gableRoof(bx0, bx1, z0 + 6, bz1, EAVE + 4, 10, { axis: 'z', gables: [false, true] });
  for (const x of [bx0, bx1]) buttress(x, bz1, 0, 1, -16, EAVE + 6, { w: 1.3, d: 1.3, pin: 7 });
  win('lancet', [xm, D + 0.1, bz1], 0, 1, 4.2, 7.4, 0, 1);
  wallBox(xm - 3, xm + 3, D + 7.8, D + 9.4, bz1, bz1 + 0.2, 'trim', 0.03);
  for (const o of [-2.6, 0, 2.6]) win('lancet', [xm + o, 9.4, bz1], 0, 1, 1.9, 10, 1, 0.8);
  { // the quatrefoil in the gable
    const q = pathPts(new THREE.Shape(), quatrefoilPts(0, 0, 1.8, 48).map(([u, v]) => [u * 1.15, v * 1.15])); q.holes.push(pathPts(new THREE.Path(), quatrefoilPts(0, 0, 1.5), true));
    put('trim', new THREE.ExtrudeGeometry(q, { depth: 0.4, bevelEnabled: false }).translate(xm, EAVE + 4.5, bz1 - 0.1));
    put('lead', new THREE.ShapeGeometry(pathPts(new THREE.Shape(), quatrefoilPts(0, 0, 1.55))).translate(xm, EAVE + 4.5, bz1 - 0.05));
  }
  pinnacle(xm, EAVE + 14, bz1 - 0.4, 1, 6);
  // the forecourt at the east end of the viaduct, in front of the door
  wallBox(bx0 - 8, bx1 + 2, -30, D, z1, SITE_BY.bridge.rect[3], 'stone', 0.06);
  wallBox(bx0 - 8, bx1 + 2, D, D + 1.1, SITE_BY.bridge.rect[3] - 0.5, SITE_BY.bridge.rect[3] + 0.3, 'trim', 0.04);
  // corner turrets with machicolated parapets; the east one stands on the brink, its foot far down the rock
  const [sx, sz, sr] = SITE_BY.swturret.circle, [ex, ez, er] = SITE_BY.seturret.circle;
  const trow = (y0, y1, n) => { const r = []; for (let y = y0, k = 0; y < y1; y += 4.4, k++) r.push({ kind: 'round', y, n, w: 1.0, h: 2.3, lit: 0.5, a0: (k % 2) * Math.PI / n, a1: (k % 2) * Math.PI / n + Math.PI * 2 }); return r; };
  roundTower({ x: sx, z: sz, r: sr, y0: -20, y1: 34, cone: 30, kick: 0.12, bands: [8], winRows: trow(-1, 31, 6) });
  roundTower({ x: ex, z: ez, r: er, y0: -44, y1: 34, cone: 33, kick: 0.12, bands: [-14, 8], winRows: trow(-12, 31, 6) });
  // the great-window range east of the entrance: a gable to the loch with a tall traceried window
  const [gx0, gz0, gx1, gz1] = SITE_BY.gwindow.rect;
  gothicRange({ x0: gx0, x1: gx1, z0: gz0, z1: gz1, axis: 'z', base: -16, eave: 26, floors: [2, 10, 18], bay: 8, ww: 1.5, wh: 4.6, chimneys: 1, dormers: null, ends: [false, true], bays: false });
  win('lancet', [(gx0 + gx1) / 2, 8, gz1], 0, 1, 6.2, 17, 3, 0.6);
  // the Viaduct Courtyard behind the viaduct: a range on its north side, flags, a low wall to the viaduct
  const [cx0, cz0, cx1, cz1] = SITE_BY.vcourt.rect;
  gothicRange({ x0: cx0, x1: cx1, z0: cz0, z1: cz0 + 14, axis: 'x', base: -6, eave: 21, floors: [2, 8, 14], chimneys: 1, dormers: 'stone', ends: [false, false], bays: false });
  wallBox(cx0, cx1, -6, -2.6, cz0 + 14, cz1, 'trim', 0.02);
  wallBox(cx0, cx1, -2.6, -1.6, cz1 - 0.6, cz1, 'trim', 0.04);
}

function buildCentralTower() {
  const [x0, z0, x1, z1] = SITE_BY.central.rect, x = (x0 + x1) / 2, z = (z0 + z1) / 2, w = x1 - x0, TOP = 62;
  squareTower({ x, z, w, y0: -4, y1: TOP, bands: [22, 40], buttress: 1.5 });
  win('lancet', [x, 31, z1], 0, 1, 7.5, 18, 3, 0.6);
  for (const [nx, nz] of [[1, 0], [-1, 0], [0, -1]]) {
    const fx = x + nx * w / 2, fz = z + nz * w / 2, tx = Math.abs(nz), tz = Math.abs(nx);
    for (const o of [-3.5, 3.5]) win('lancet', [fx + tx * o, 42, fz + tz * o], nx, nz, 2, 8, 0, 0.4);
    win('lancet', [fx, 26, fz], nx, nz, 3, 9, 1, 0.4);
  }
  // four gables
  for (const [ax, rot] of [['z', 0], ['x', 1]]) {
    if (ax === 'z') gableRoof(x - w / 2 + 0.1, x + w / 2 - 0.1, z - w / 2, z + w / 2, TOP, 10, { axis: 'z', over: 0.3 });
    else gableRoof(x - w / 2, x + w / 2, z - w / 2 + 0.1, z + w / 2 - 0.1, TOP, 10, { axis: 'x', over: 0.3 });
    void rot;
  }
  spire(x, z, TOP + 4, 7.2, 34, 8, Math.PI / 8);
  clockFace(x, TOP - 7, z1, 2.2, 0, 1);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const cx = x + sx * (w / 2), cz = z + sz * (w / 2);
    cyl(cx, cz, 38, TOP + 9, 1.9, 'stone', 8);
    band(cx, cz, TOP + 8.5, 1.9, 0.5, 0.2);
    spire(cx, cz, TOP + 9, 2.1, 10, 8, Math.PI / 8);
  }
}

function buildRange() {
  const [x0, z0, x1, z1] = SITE_BY.nave.rect, EAVE = 26, BAY = 7;
  wallBox(x0, x1, -6, EAVE, z0, z1);
  wallBox(x0, x1, -6, 0.8, z0 - 0.6, z1 + 0.6, 'stone', 0.1);
  for (const y of [11.4, EAVE - 1]) { wallBox(x0, x1, y, y + 0.45, z1 - 0.1, z1 + 0.35, 'trim', 0.04); wallBox(x0, x1, y, y + 0.45, z0 - 0.35, z0 + 0.1, 'trim', 0.04); }
  const nb = Math.floor((x1 - x0) / BAY);
  for (let i = 0; i < nb; i++) {
    const x = x0 + (i + 0.5) * ((x1 - x0) / nb);
    for (const [z, nz] of [[z1, 1], [z0, -1]]) {
      win('round', [x, 2.2, z], 0, nz, 2.0, 5.0, 0, 0.55);
      win('round', [x, 13.0, z], 0, nz, 2.4, 6.6, 0, 0.55);
      for (const o of [-1.1, 1.1]) win('round', [x + o, 21.2, z], 0, nz, 0.9, 2.3, 0, 0.4);
    }
  }
  for (let i = 1; i < nb; i++) {
    const x = x0 + i * ((x1 - x0) / nb);
    wallBox(x - 0.7, x + 0.7, -6, EAVE - 1, z1, z1 + 0.9, 'stone', 0.06);
    wallBox(x - 0.7, x + 0.7, -6, EAVE - 1, z0 - 0.9, z0, 'stone', 0.06);
  }
  // Romanesque dressing as on the model (m51): a blind arcade between the storeys, a corbel table and a battlemented
  // parapet at the eaves, the roof behind it
  for (const [z, nz] of [[z1, 1], [z0, -1]]) {
    arcade(x0 + 0.5, z + nz * 0.18, x1 - 0.5, z + nz * 0.18, 9.0, 2.4, Math.round((x1 - x0) / 1.6), { kind: 'round', spring: 0.6, pier: 0.34, depth: 0.32, mat: 'trim' });
    corbelTable(x0, z, x1, z, EAVE - 1.1, 0, nz, 0.95, 0.4);
    wallBox(x0, x1, EAVE - 0.65, EAVE + 0.9, Math.min(z, z + nz * 0.45), Math.max(z, z + nz * 0.45), 'stone', 0.04);
    merlons(x0 + 0.5, z + nz * 0.25, x1 - 0.5, z + nz * 0.25, EAVE + 0.9, { h: 1.0, mw: 1.0, gap: 0.75, t: 0.5 });
  }
  gableRoof(x0, x1, z0 + 0.5, z1 - 0.5, EAVE + 0.4, 13, { axis: 'x', gables: [false, false], over: 0.1 });
  for (const x of [x0 + 20, x0 + 52, x0 + 86]) place('chimney', xf([x, EAVE + 9.5, (z0 + z1) / 2 + 2], 0, [1.8, 2.4, 1.5]));
}

function buildTwinTowers() {
  const [x0, z0, x1, z1] = SITE_BY.twins.rect, xm = (x0 + x1) / 2, w = x1 - x0, TOP = 60;
  for (const zc of [z0 + w / 2, z1 - w / 2]) {
    squareTower({ x: xm, z: zc, w, y0: -5, y1: TOP, bands: [18, 33, 47], buttress: 1.4 });
    for (const [nx, nz] of [[1, 0], [0, 1], [0, -1], [-1, 0]]) {
      const fx = xm + nx * w / 2, fz = zc + nz * w / 2, tx = Math.abs(nz), tz = Math.abs(nx);
      for (const [y, n, ww, hh] of [[19.5, 6, 1.0, 3.4], [24, 6, 1.0, 3.4], [34, 5, 1.15, 3.7], [38.7, 5, 1.15, 3.7], [48.5, 3, 1.6, 8.2], [2, 3, 1.1, 3.2], [7.5, 3, 1.1, 3.2]])
        for (let k = 0; k < n; k++) { const o = (k - (n - 1) / 2) * (w * 0.82 / n); win('round', [fx + tx * o, y, fz + tz * o], nx, nz, ww, hh, 0, y > 40 ? 0.3 : 0.2); }
    }
    for (const [ya, yb] of [[13.5, 17.5], [28.5, 32.5], [43, 46.6], [57, 60]]) for (const [ax0, az0, ax1, az1] of [[xm - w / 2, zc + w / 2 + 0.15, xm + w / 2, zc + w / 2 + 0.15], [xm - w / 2, zc - w / 2 - 0.15, xm + w / 2, zc - w / 2 - 0.15], [xm + w / 2 + 0.15, zc - w / 2, xm + w / 2 + 0.15, zc + w / 2], [xm - w / 2 - 0.15, zc - w / 2, xm - w / 2 - 0.15, zc + w / 2]])
      arcade(ax0, az0, ax1, az1, ya, yb - ya, Math.round(w / 1.4), { kind: 'round', spring: 0.62, pier: 0.32, depth: 0.3, mat: 'trim' });
    wallBox(xm - w / 2 - 0.5, xm + w / 2 + 0.5, TOP, TOP + 1, zc - w / 2 - 0.5, zc + w / 2 + 0.5, 'trim', 0.05);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) pinnacle(xm + sx * (w / 2), TOP + 0.8, zc + sz * (w / 2), 1.8, 16);
    spire(xm, zc, TOP + 0.8, 6.2, 36, 8, Math.PI / 8);
  }
  // the west front between them, facing east, and its great doorway
  const za = z0 + w, zb = z1 - w;
  wallBox(x0 + 1, x1, -5, 40, za, zb);
  gableRoof(x0 + 1, x1, za, zb, 40, 7, { axis: 'x', gables: [false, true] });
  win('round', [x1, 0, (za + zb) / 2], 1, 0, 5, 10.5, 0, 0.9);
  win('round', [x1, 15, (za + zb) / 2], 1, 0, 5.5, 14, 2, 0.6);
  win('round', [x1, 31, (za + zb) / 2], 1, 0, 3, 6, 0, 0.4);
}

function glassHouse(x0, x1, z0, z1, y, { axis = 'x', transept = 0 } = {}) {
  // built along local u (length) and v (width) about the centre, then turned to the axis
  const ax = axis === 'x', L = ax ? x1 - x0 : z1 - z0, W = ax ? z1 - z0 : x1 - x0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const T = (g) => (ax ? g : g.rotateY(Math.PI / 2)).translate(cx, y, cz);
  const half = W / 2, wallH = 0.8, eave = 3.2, rise = Math.min(2.4, half * 0.75);
  put('stone', uvPlanar(T(new THREE.BoxGeometry(L, wallH + 2, W).translate(0, wallH / 2 - 1, 0))));
  put('greenglass', uvPlanar(T(new THREE.BoxGeometry(L - 0.12, eave - wallH, W - 0.12).translate(0, (wallH + eave) / 2, 0))));
  const roof = (len, wid, y0, r, along) => {
    const hw = wid / 2, out = [];
    for (const side of [-1, 1]) {
      const a = [-len / 2, y0, side * hw], b = [len / 2, y0, side * hw], c = [len / 2, y0 + r, 0], d = [-len / 2, y0 + r, 0];
      const v = side > 0 ? [a, b, c, a, c, d] : [a, c, b, a, d, c];
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v.flat(), 3)); g.computeVertexNormals();
      out.push(along ? g : g.rotateY(Math.PI / 2));
    }
    for (const e of [-1, 1]) {
      const sh = new THREE.Shape(); sh.moveTo(-hw, 0); sh.lineTo(hw, 0); sh.lineTo(0, r); sh.closePath();
      const g = new THREE.ShapeGeometry(sh).rotateY(e < 0 ? -Math.PI / 2 : Math.PI / 2).translate(e * len / 2, y0, 0);
      out.push(along ? g : g.rotateY(Math.PI / 2));
    }
    return out;
  };
  for (const g of roof(L, W, eave, rise, true)) put('greenglass', uvPlanar(T(g)));
  // the ridge ventilator: a raised glazed lantern along the middle of the ridge with its own small roof
  const vl = L * 0.62;
  put('greenglass', uvPlanar(T(new THREE.BoxGeometry(vl, 0.45, 0.9).translate(0, eave + rise + 0.12, 0))));
  for (const g of roof(vl + 0.2, 1.3, eave + rise + 0.35, 0.45, true)) put('greenglass', uvPlanar(T(g)));
  // white frames: corner posts, eave plates, ridge, the gable rafters, a door at each end
  const fr = [];
  for (const su of [-1, 1]) for (const sv of [-1, 1]) fr.push(new THREE.BoxGeometry(0.16, eave - wallH, 0.16).translate(su * L / 2, (wallH + eave) / 2, sv * half));
  for (const sv of [-1, 1]) fr.push(new THREE.BoxGeometry(L, 0.14, 0.18).translate(0, eave, sv * half), new THREE.BoxGeometry(L, 0.1, 0.14).translate(0, wallH + 0.05, sv * half));
  fr.push(new THREE.BoxGeometry(L + 0.1, 0.14, 0.14).translate(0, eave + rise, 0));
  for (let u = -L / 2 + 2.8; u < L / 2 - 1; u += 2.8) for (const sv of [-1, 1]) fr.push(new THREE.BoxGeometry(0.1, eave - wallH, 0.12).translate(u, (wallH + eave) / 2, sv * half));
  for (const su of [-1, 1]) {
    fr.push(new THREE.BoxGeometry(0.12, 2.3, 1.2).translate(su * (L / 2 + 0.02), 1.15 + 0.3, 0));
    const sl = Math.hypot(half, rise), ang = Math.atan2(rise, half);
    for (const sv of [-1, 1]) fr.push(new THREE.BoxGeometry(0.14, sl, 0.14).rotateX(sv * (Math.PI / 2 - ang)).translate(su * L / 2, eave + rise / 2, sv * half / 2));
    fr.push(new THREE.ConeGeometry(0.08, 0.6, 6).translate(su * L / 2, eave + rise + 0.3, 0));
  }
  put('white', T(merge(fr)));
  // a cross gable in the middle of the long side (the outer rank)
  if (transept) {
    const tl = W + transept * 2, tw = Math.min(5, L * 0.3);
    put('greenglass', uvPlanar(T(new THREE.BoxGeometry(tw, eave - wallH, tl).translate(0, (wallH + eave) / 2, 0))));
    put('stone', uvPlanar(T(new THREE.BoxGeometry(tw, wallH + 2, tl).translate(0, wallH / 2 - 1, 0))));
    for (const g of roof(tl, tw, eave, Math.min(2.4, tw * 0.4), false)) put('greenglass', uvPlanar(T(g)));
  }
}
function buildGreenhouses() {
  const [x0, z0, x1, z1] = SITE_BY.greenhouses.rect;
  for (const [u0, u1] of [[102, 134], [137.5, 170]]) { glassHouse(u0, u1, 7.5, 15.5, 0); glassHouse(u0, u1, 19.5, 28, 0, { transept: 1.8 }); glassHouse(u0 + 3, u1 - 3, 30.5, 35, 0); }
  for (const [u0, u1] of [[191, 197.5], [212, 218.5]]) glassHouse(u0, u1, 6, 24, 0, { axis: 'z' });
  for (const [a, b] of [[12, 17]]) glassHouse(199.5, 210.5, a, b, 0);
  ribbon([[100, 17.5], [170, 17.5]], 2.6, 'dirt', 0.06, () => 0.06);
  ribbon([[135.8, 6], [135.8, 36]], 2.2, 'dirt', 0.06, () => 0.06);
  // the domed glasshouse, set into the boundary wall
  const dx = 204, dz = 33, dr = 6;
  cyl(dx, dz, -2, 0.8, dr, 'stone', 8, null, false);
  const body = new THREE.CylinderGeometry(dr - 0.2, dr - 0.2, 3.4, 16, 1, true).translate(dx, 2.5, dz);
  const buv = body.attributes.uv; for (let i = 0; i < buv.count; i++) buv.setXY(i, buv.getX(i) * Math.PI * 2 * dr, body.attributes.position.getY(i));
  put('greenglass', body);
  const dome = new THREE.SphereGeometry(dr - 0.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2).translate(dx, 4.2, dz);
  const duv = dome.attributes.uv; for (let i = 0; i < duv.count; i++) duv.setXY(i, duv.getX(i) * Math.PI * 2 * dr, duv.getY(i) * 10);
  put('greenglass', dome);
  cyl(dx, dz, 4.2 + dr - 0.6, 4.2 + dr + 1.2, 0.9, 'greenglass', 12, null, false);
  spike(dx, 4.2 + dr + 1.2, dz, 1.4, 0.2);
  // boundary wall on the cliff side and the east
  wallBox(96, dx - dr, -3, 2.4, 36, 36.8, 'stone', 0.06);
  merlons(96, 36.4, dx - dr, 36.4, 2.4, { h: 0.7, mw: 0.9, gap: 0.6, t: 0.7 });
  wallBox(dx + dr, 228, -3, 2.4, 36, 36.8, 'stone', 0.06);
  merlons(dx + dr, 36.4, 228, 36.4, 2.4, { h: 0.7, mw: 0.9, gap: 0.6, t: 0.7 });
  void x0; void x1; void z0; void z1;
}

// the boathouse at the foot of the cliff (m65, m66): a tall narrow gabled house of small coursed stone standing in the
// water, a steep slate roof with a little lantern and spirelet on the ridge, stepped buttresses; on the loch a pointed
// water gate standing open, a ring of voussoirs and a hood mould round it, iron lanterns either side, mooring posts;
// inside, a dark dock under the roof timbers, a stone landing along the back with steps down to the water and a door
// out to the stairs, lanterns on the walls
function buildBoathouse() {
  const [x0, z0, x1, z1] = SITE_BY.boathouse.rect, F = LAKE_Y + 1, EAVE = F + 11, xm = (x0 + x1) / 2, T = 0.8, RISE = 12;
  const B0 = LAKE_Y - 6;
  wallBox(x0, x0 + T, B0, EAVE, z0, z1 - T, 'rubble', 0.03);
  wallBox(x1 - T, x1, B0, EAVE, z0, z1 - T, 'rubble', 0.03);
  wallBox(x0, x1, B0, EAVE, z0, z0 + T, 'rubble', 0.03);
  // the gable wall on the loch: one plate with the gable, pierced by the water gate (an equilateral lancet, 6.4 m wide)
  const GW = 3.2, GS = LAKE_Y + 4.6, arc = (r, sgn, n = 12) => {   // one side of a lancet of span 2GW whose arcs have radius r
    const out = [], cx = xm - sgn * GW, a1 = Math.acos(GW / r);
    for (let k = 0; k <= n; k++) { const a = (k / n) * a1; out.push([cx + sgn * r * Math.cos(a), GS + r * Math.sin(a)]); }
    return out;
  };
  const gable = new THREE.Shape(); pathPts(gable, [[x0, B0], [x1, B0], [x1, EAVE], [xm, EAVE + RISE], [x0, EAVE]]);
  const hole = [[xm - GW, LAKE_Y - 2.5], [xm + GW, LAKE_Y - 2.5], ...arc(2 * GW, 1), ...arc(2 * GW, -1).reverse()];
  gable.holes.push(pathPts(new THREE.Path(), hole));
  put('rubble', new THREE.ExtrudeGeometry(gable, { depth: T, bevelEnabled: false, curveSegments: 4 }).translate(0, 0, z1 - T));
  const band = (rIn, rOut, y0) => {   // a ring between two lancets (arc radii rIn, rOut), legs down to y0
    const xi = rIn - GW, xo = rOut - GW;
    return pathPts(new THREE.Shape(), [[xm + xo, y0], ...arc(rOut, 1), ...arc(rOut, -1).reverse(), [xm - xo, y0], [xm - xi, y0], ...arc(rIn, -1), ...arc(rIn, 1).reverse(), [xm + xi, y0]]);
  };
  put('trim', new THREE.ExtrudeGeometry(band(2 * GW, 2 * GW + 0.6, LAKE_Y - 1), { depth: 0.22, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1, curveSegments: 4 }).translate(0, 0, z1));
  put('trim', new THREE.ExtrudeGeometry(band(2 * GW + 0.75, 2 * GW + 0.95, GS - 0.4), { depth: 0.3, bevelEnabled: false, curveSegments: 4 }).translate(0, 0, z1));
  wallBox(x0 - 0.3, x1 + 0.3, EAVE - 0.5, EAVE + 0.1, z0 - 0.3, z1 + 0.3, 'trim', 0.04);
  win('lancet', [xm, EAVE - 0.6, z1], 0, 1, 1.5, 3.4, 0, 0.9);
  winRow('lancet', x1, z1 - 3, x1, z0 + 3, F + 4, 3, 1.1, 3.4, { side: 1, lit: 0.9 });
  winRow('lancet', x0, z0 + 3, x0, z1 - 3, F + 4, 3, 1.1, 3.4, { side: 1, lit: 0.9 });
  gableRoof(x0, x1, z0, z1, EAVE, RISE, { axis: 'z', over: 0.6, gables: [true, false] });
  for (const [x, nx] of [[x0, -1], [x1, 1]]) for (const z of [z1 - 0.5, (z0 + z1) / 2, z0 + 0.5]) buttress(x, z, nx, 0, B0 + 2, EAVE - 2.5, { w: 1.0, d: 1.2, pin: 0 });
  // the lantern and spirelet on the ridge, toward the loch end
  const rz = z1 - 3.5, ry = EAVE + RISE * (1 - 0.0) - 0.6;
  wallBox(xm - 0.85, xm + 0.85, ry - 1.2, ry + 1.6, rz - 0.85, rz + 0.85, 'rubble', 0.04);
  for (const [dx, dz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) win('lancet', [xm + dx * 0.86, ry - 0.1, rz + dz * 0.86], dx, dz, 0.45, 1.3, 0, 0.9);
  spire(xm, rz, ry + 1.6, 1.15, 4.8, 8, Math.PI / 8);
  cyl(xm, rz, ry + 6.3, ry + 7.0, 0.06, 'paintBlack', 6);
  // inside: the landing and its steps, the door to the stairs, roof timbers, lanterns
  wallBox(x0 + T, x1 - T, LAKE_Y - 4, F, z0 + T, z0 + T + 3.2, 'rubble', 0.03);
  for (let k = 0; k < 5; k++) wallBox(xm - 1.6, xm + 1.6, LAKE_Y - 4, F - 0.2 - k * 0.2, z0 + T + 3.2 + k * 0.3, z0 + T + 3.5 + k * 0.3, 'rubble', 0.02);
  wallBox(xm - 0.9, xm + 0.9, F, F + 2.6, z0 + T - 0.02, z0 + T + 0.04, 'timber', 0.01);
  put('doorGlow', new THREE.BoxGeometry(1.4, 2.2, 0.02).translate(xm, F + 1.1, z0 + T + 0.05));
  for (const sd of [-1, 1]) {   // boards under the roof, so the dock has a ceiling seen from inside
    const run = xm - x0 - T, len = Math.hypot(run, RISE), ang = Math.atan2(RISE, run);
    put('timber', new THREE.BoxGeometry(len, 0.06, z1 - z0 - T).rotateZ(sd * ang).translate(xm - sd * run / 2, EAVE + RISE / 2 - 0.35, (z0 + z1 - T) / 2));
  }
  for (let z = z0 + 2.5; z < z1 - 1; z += 3.2) {
    beam([x0 + T, EAVE - 0.3, z], [xm, EAVE + RISE - 1.2, z], 0.25, 'timber');
    beam([x1 - T, EAVE - 0.3, z], [xm, EAVE + RISE - 1.2, z], 0.25, 'timber');
    beam([x0 + T, EAVE - 0.4, z], [x1 - T, EAVE - 0.4, z], 0.28, 'timber');
  }
  const LG = lanternGeo(1.8);
  const lantern = (x, y, z, nx, nz, inside) => {   // an iron bracket from the wall, a lantern hung from it
    beam([x, y + 0.75, z], [x + nx * 0.6, y + 0.75, z + nz * 0.6], 0.05, 'paintBlack');
    beam([x, y + 0.3, z], [x + nx * 0.45, y + 0.75, z + nz * 0.45], 0.035, 'paintBlack');
    const at = (g) => g.clone().translate(x + nx * 0.6, y - 0.1, z + nz * 0.6);
    put('paintBlack', at(LG.frame)); put('lanternGlass', at(LG.glass)); put('mantle', at(LG.flame));
    LAMPS.push({ p: [x + nx * 0.6, y + 0.15, z + nz * 0.6], c: [1.0, 0.6, 0.28].map((v) => v * (inside ? 5 : 7)), r: inside ? 9 : 11, halo: 0.8, hk: 0.35 });
  };
  for (const s of [-1, 1]) lantern(xm + s * (GW + 1.5), GS + 0.4, z1 + 0.05, 0, 1, false);
  for (const z of [z0 + 6, z0 + 13]) { lantern(x0 + T, F + 2.5, z, 1, 0, true); lantern(x1 - T, F + 2.5, z, -1, 0, true); }
  // mooring posts in the water before the gate, with iron rings
  for (const [dx, dz] of [[-4.6, 2.5], [4.6, 2.5], [-4.9, 7.5], [4.9, 7.5]]) {
    put('timber', new THREE.CylinderGeometry(0.16, 0.19, 3.6, 10).translate(xm + dx, LAKE_Y - 0.4, z1 + dz));
    put('timber', new THREE.ConeGeometry(0.17, 0.14, 10).translate(xm + dx, LAKE_Y + 1.47, z1 + dz));
    put('paintBlack', new THREE.TorusGeometry(0.17, 0.02, 6, 16).rotateX(Math.PI / 2).translate(xm + dx, LAKE_Y + 0.9, z1 + dz));
  }
  wallBox(x0 - 1, x1 + 1, LAKE_Y - 3, F, z0 - 4, z0, 'rubble', 0.06);
}

// stair path: (x, z) from SITE, heights fitted to the cliff before the terrain is meshed
let STAIR = null;
function fitStairs() {
  const pts = SITE_BY.stairs.line;
  STAIR = pts.map(([x, z], i) => {
    let y = groundH(x, z) + 2;
    if (i === 0) y = LAKE_Y + 1.5;
    if (i === 1) y = LAKE_Y + 3;
    if (i === pts.length - 1) y = -5.5;
    return [x, y, z];
  });
  for (let i = 1; i < STAIR.length; i++) STAIR[i][1] = Math.max(STAIR[i][1], STAIR[i - 1][1] + 0.5);
}
function stairCarve(x, z, y) {
  if (!STAIR) return y;
  for (let i = 0; i < STAIR.length - 1; i++) {
    const a = STAIR[i], b = STAIR[i + 1], dx = b[0] - a[0], dz = b[2] - a[2], L2 = dx * dx + dz * dz;
    const t = clamp(((x - a[0]) * dx + (z - a[2]) * dz) / L2, 0, 1);
    const d = Math.hypot(x - a[0] - dx * t, z - a[2] - dz * t);
    const sy = lerp(a[1], b[1], t);
    if (d < 6) y = Math.min(y, sy - 0.6 + Math.max(0, d - 3) * 1.5);
    // on the side toward the loch (+z) the rock drops away below the stair wall
    const side = (x - a[0]) * -dz + (z - a[2]) * dx, out = Math.sign(side) === Math.sign(dx || 1e-6) ? 1 : 0;
    if (i >= 2 && out && d > 2.3 && d < 14 && t > 0.02 && t < 0.98) y = Math.min(y, sy - 9 - (d - 2.3) * 1.5);
  }
  return y;
}
function buildStairs() {
  const W = 4.0;
  for (let i = 0; i < STAIR.length - 1; i++) {
    const a = STAIR[i], b = STAIR[i + 1], base = i < 2 ? 8 : 30;
    stairFlight(a, b, W, base, 'rubble');
    // copings on both parapets and, on the cliff flights, pilasters down the outer wall
    const dx = b[0] - a[0], dz = b[2] - a[2], L = Math.hypot(dx, dz), nx = -dz / L, nz = dx / L;
    for (const sd of [-1, 1]) {
      const o = sd * (W / 2 + 0.25);
      // the last flight is open on the courtyard side past the loggia, where it steps through the battlement
      const e = i === STAIR.length - 2 && sd < 0 ? clamp((-24.5 - a[0]) / (b[0] - a[0]), 0, 1) : 1;
      beam([a[0] + nx * o, a[1] + 1.6, a[2] + nz * o], [lerp(a[0], b[0], e) + nx * o, lerp(a[1], b[1], e) + 1.6, lerp(a[2], b[2], e) + nz * o], 0.72, 'trim');
    }
    if (i >= 2) {
      const sd = Math.sign(dx || 1) * 1, n2 = Math.max(1, Math.round(L / 7));
      for (let k = 1; k < n2; k++) {
        const t = k / n2, px = lerp(a[0], b[0], t) + nx * sd * (W / 2 + 0.55), pz = lerp(a[2], b[2], t) + nz * sd * (W / 2 + 0.55), py = lerp(a[1], b[1], t);
        put('rubble', uvPlanar(new THREE.BoxGeometry(1.2, base, 0.9).rotateY(-Math.atan2(dz, dx)).translate(px, py + 1.2 - base / 2, pz)));
      }
    }
  }
  for (let i = 1; i < STAIR.length - 1; i++) {
    const p = STAIR[i], s = W + 3.2, base = i < 2 ? 8 : 30;
    wallBox(p[0] - s / 2, p[0] + s / 2, p[1] - base, p[1], p[2] - s / 2, p[2] + s / 2, 'rubble', 0.04);
    wallBox(p[0] - s / 2 - 0.2, p[0] + s / 2 + 0.2, p[1] - 0.45, p[1] - 0.1, p[2] - s / 2 - 0.2, p[2] + s / 2 + 0.2, 'trim', 0.04);
    // parapets round the landing, open where the two flights come in
    const dirs = [STAIR[i - 1], STAIR[i + 1]].map((q) => { const ax = q[0] - p[0], az = q[2] - p[2], l = Math.hypot(ax, az) || 1; return [ax / l, az / l]; });
    for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (dirs.some(([ax, az]) => ax * nx + az * nz > 0.45)) continue;
      const cx = p[0] + nx * (s / 2 - 0.3), cz = p[2] + nz * (s / 2 - 0.3), hx = nx ? 0.3 : s / 2, hz = nz ? 0.3 : s / 2;
      wallBox(cx - hx, cx + hx, p[1], p[1] + 1.6, cz - hz, cz + hz, 'rubble', 0.04);
      wallBox(cx - hx - 0.1, cx + hx + 0.1, p[1] + 1.6, p[1] + 1.85, cz - hz - 0.1, cz + hz + 0.1, 'trim', 0.03);
    }
  }
  // a lantern on an iron standard at every landing, at the foot by the boathouse door and at the top: at night the
  // stairs climb the cliff as a chain of lights
  const LG = lanternGeo(1.5), s = W + 3.2;
  const lamp = (x, y, z) => {
    put('paintBlack', new THREE.CylinderGeometry(0.035, 0.05, 0.9, 8).translate(x, y + 0.45, z));
    put('paintBlack', new THREE.CylinderGeometry(0.09, 0.11, 0.08, 8).translate(x, y + 0.04, z));
    const at = (g) => g.clone().translate(x, y + 0.9, z);
    put('paintBlack', at(LG.frame)); put('lanternGlass', at(LG.glass)); put('mantle', at(LG.flame));
    LAMPS.push({ p: [x, y + 1.15, z], c: [1.0, 0.6, 0.28].map((v) => v * 8), r: 11, halo: 0.7, hk: 0.35 });
  };
  for (let i = 1; i < STAIR.length - 1; i++) { const p = STAIR[i]; lamp(p[0] + s / 2 - 0.3, p[1] + 1.85, p[2] + s / 2 - 0.3); }
  { const p = STAIR[0]; lamp(p[0] - 1.6, p[1] + 1.85, p[2] + 1.6); }
  { const p = STAIR[STAIR.length - 1]; lamp(p[0] + 1.2, p[1] + 1.85, p[2] + 2.4); }
}

function buildCastle() {
  buildGreatHall();
  buildPorch();
  buildGrandTower();
  buildTerrace();
  buildGalleryBridge();
  buildSouthWing();
  squash(buildAstronomy, -6, 0.8);
  buildCentralTower();
  buildRange();
  buildTwinTowers();
  buildGreenhouses();
  buildCentre();
  buildBoathouse();
  buildStairs();
}
