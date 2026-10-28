// ------------------------------------------------------------------ a Gothic range (wing), used for the inner buildings
// Walls with floors of windows by bay, string courses, cornice and parapet, a steep roof with plain or crow-stepped
// gables, wall dormers, chimneys, and optionally a cloister walk under the upper floors on one long side.
function wallDormer(x, z, nx, nz, y, w, h, crow = false) { // stone dormer rising through the eave line, facing (nx, nz)
  const tx = Math.abs(nz), tz = Math.abs(nx);
  wallBox(x - tx * w / 2 - tz * 1.1, x + tx * w / 2 + tz * 1.1, y - 2, y + h, z - tz * w / 2 - tx * 1.1, z + tz * w / 2 + tx * 1.1, 'stone', 0.06);
  const fx = x + nx * 1.1, fz = z + nz * 1.1;
  if (crow) crowGable(fx - nx * 0.4, fz - nz * 0.4, y + h, w / 2 + 0.2, w * 0.75, Math.abs(nx) > 0.5 ? 'x' : 'z', 3, 0.8);
  else {
    const s = new THREE.Shape(); s.moveTo(-w / 2 - 0.2, 0); s.lineTo(w / 2 + 0.2, 0); s.lineTo(0, w * 0.7); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.8, bevelEnabled: false }).translate(0, 0, -0.4);
    if (Math.abs(nx) > 0.5) g.rotateY(Math.PI / 2);
    g.translate(fx - nx * 0.4, y + h, fz - nz * 0.4);
    put('stone', uvPlanar(g));
  }
  const ax = Math.abs(nx) > 0.5;
  gableRoof(ax ? x - 1.3 : x - w / 2, ax ? x + 1.3 : x + w / 2, ax ? z - w / 2 : z - 1.3, ax ? z + w / 2 : z + 1.3, y + h, w * 0.7, { axis: ax ? 'x' : 'z', over: 0.15, gables: [false, false], coping: false });
  win('lancet', [fx, y + 0.3, fz], nx, nz, w * 0.42, h * 0.75, 0, 0.5);
  pinnacle(fx, y + h + w * 0.7 - 0.2, fz, 0.35, 1.8);
}
function gothicRange(o) {
  const { x0, x1, z0, z1, base = -6, eave = 22, bay = 4.6, floors = [2, 8.5, 15], win: wk = 'lancet', ww = 1.3, wh = 3.6, mull = 1,
    cloister = null, clDepth = 3.2, clH = 6.2, gables = 'plain', dormers = 'slate', chimneys = 2, parapet = null, rise = null,
    buttresses = false, lit = 0.5, ends = [true, true], dormerStep = 9, dormerW = 2.6 } = o;
  const ax = (o.axis ?? (x1 - x0 >= z1 - z0 ? 'x' : 'z')) === 'x';
  const L = ax ? x1 - x0 : z1 - z0, span = ax ? z1 - z0 : x1 - x0;
  // the volume, with the ground floor stepped back behind a cloister arcade
  if (cloister) {
    const c = { n: [0, 0, clDepth, 0], s: [0, 0, 0, -clDepth], w: [clDepth, 0, 0, 0], e: [0, -clDepth, 0, 0] }[cloister];
    wallBox(x0 + c[0], x1 + c[1], base, clH, z0 + c[2], z1 + c[3]);
    wallBox(x0, x1, clH, eave, z0, z1);
    wallBox(x0 - 0.2, x1 + 0.2, clH - 0.5, clH, z0 - 0.2, z1 + 0.2, 'trim', 0.04);
    const line = { n: [x0, z0, x1, z0], s: [x0, z1, x1, z1], w: [x0, z0, x0, z1], e: [x1, z0, x1, z1] }[cloister];
    const off = { n: [0, 0.4], s: [0, -0.4], w: [0.4, 0], e: [-0.4, 0] }[cloister];
    const n = Math.max(2, Math.round(Math.hypot(line[2] - line[0], line[3] - line[1]) / 3.6));
    arcade(line[0] + off[0], line[1] + off[1], line[2] + off[0], line[3] + off[1], 0, clH - 0.5, n, { kind: 'lancet', spring: 0.82, pier: 0.3, depth: 0.8 });
  } else wallBox(x0, x1, base, eave, z0, z1);
  for (const f of floors.slice(1)) wallBox(x0 - 0.3, x1 + 0.3, f - 0.9, f - 0.5, z0 - 0.3, z1 + 0.3, 'trim', 0.04);
  wallBox(x0 - 0.5, x1 + 0.5, eave - 0.7, eave + 0.15, z0 - 0.5, z1 + 0.5, 'trim', 0.05);
  if (ax) { corbelTable(x0, z1, x1, z1, eave - 0.7, 0, 1); corbelTable(x0, z0, x1, z0, eave - 0.7, 0, -1); }
  else { corbelTable(x1, z0, x1, z1, eave - 0.7, 1, 0); corbelTable(x0, z0, x0, z1, eave - 0.7, -1, 0); }
  // windows on every face, by bay
  const faces = [
    [x0, z1, x1, z1, 0, 1, 's'], [x1, z0, x0, z0, 0, -1, 'n'], [x1, z1, x1, z0, 1, 0, 'e'], [x0, z0, x0, z1, -1, 0, 'w'],
  ];
  for (const [a0, b0, a1, b1, nx, nz, key] of faces) {
    const len = Math.hypot(a1 - a0, b1 - b0), nb = Math.max(1, Math.floor(len / bay));
    const isEnd = ax ? Math.abs(nx) > 0.5 : Math.abs(nz) > 0.5;
    if (isEnd && !ends[(ax ? nx : nz) > 0 ? 1 : 0]) continue;
    for (let i = 0; i < nb; i++) {
      const t = (i + 0.5) / nb, px = lerp(a0, a1, t), pz = lerp(b0, b1, t);
      for (const [fi, fy] of floors.entries()) {
        if (cloister === key && fy < clH) continue;
        if (fy + wh > eave - 0.8) continue;
        win(wk, [px, fy, pz], nx, nz, fi === 1 && o.tall ? ww * 1.2 : ww, fi === 1 && o.tall ? wh * 1.5 : wh, mull, lit);
      }
    }
    if (buttresses && !isEnd && cloister !== key) for (let i = 1; i < nb; i++) { const t = i / nb; buttress(lerp(a0, a1, t), lerp(b0, b1, t), nx, nz, base, eave, { w: 0.9, d: 1.1, pin: parapet === 'pinnacle' ? 4 : 0 }); }
  }
  // gabled bays projecting from long outer walls, so long fronts don't read as one flat wall
  if (o.bays !== false && L > 26) {
    const sides = ax ? [[z1, 1, 's'], [z0, -1, 'n']] : [[x1, 1, 'e'], [x0, -1, 'w']];
    for (const [edge, sg, key] of sides) {
      if (cloister === key) continue;
      const nbay = Math.floor(L / 21), bw = 6.4, pj = 2.2, gr = bw * 0.62;
      for (let i = 0; i < nbay; i++) {
        const t = (i + 0.5) / nbay, c = ax ? lerp(x0, x1, t) : lerp(z0, z1, t);
        const [bx0, bx1, bz0, bz1] = ax ? [c - bw / 2, c + bw / 2, Math.min(edge, edge + sg * pj), Math.max(edge, edge + sg * pj)] : [Math.min(edge, edge + sg * pj), Math.max(edge, edge + sg * pj), c - bw / 2, c + bw / 2];
        wallBox(bx0, bx1, base, eave + 0.6, bz0 - (ax ? (sg > 0 ? 1 : 0) : 0), bz1 + (ax ? (sg < 0 ? 1 : 0) : 0));
        if (ax) gableRoof(bx0, bx1, sg > 0 ? edge - 3 : bz0, sg > 0 ? bz1 : edge + 3, eave + 0.6, gr, { axis: 'z', over: 0.3, gables: sg > 0 ? [false, true] : [true, false] });
        else gableRoof(sg > 0 ? edge - 3 : bx0, sg > 0 ? bx1 : edge + 3, bz0, bz1, eave + 0.6, gr, { axis: 'x', over: 0.3, gables: sg > 0 ? [false, true] : [true, false] });
        const fx = ax ? c : edge + sg * pj, fz = ax ? edge + sg * pj : c;
        win('lancet', [fx, floors[1] ?? 6, fz], ax ? 0 : sg, ax ? sg : 0, 2.2, Math.min(eave - (floors[1] ?? 6) - 2, 11), 1, lit);
        win('round', [fx, eave + 1.2, fz], ax ? 0 : sg, ax ? sg : 0, 1.1, 2.4, 0, lit * 0.6);
        pinnacle(fx, eave + 0.6 + gr - 0.3, fz, 0.5, 3);
      }
    }
  }
  // parapet
  if (parapet === 'battlement') {
    if (ax) { merlons(x0, z0 - 0.2, x1, z0 - 0.2, eave + 0.15, { h: 1, t: 0.5 }); merlons(x0, z1 + 0.2, x1, z1 + 0.2, eave + 0.15, { h: 1, t: 0.5 }); }
    else { merlons(x0 - 0.2, z0, x0 - 0.2, z1, eave + 0.15, { h: 1, t: 0.5 }); merlons(x1 + 0.2, z0, x1 + 0.2, z1, eave + 0.15, { h: 1, t: 0.5 }); }
  }
  // roof and gables
  const r = rise ?? span * 0.62;
  if (gables === 'crow') {
    gableRoof(x0, x1, z0, z1, eave, r, { axis: ax ? 'x' : 'z', gables: [false, false], coping: false, over: 0.25 });
    if (ax) { if (ends[0]) crowGable(x0 + 0.45, (z0 + z1) / 2, eave, span / 2 + 0.4, r + 1.2, 'x', 5); if (ends[1]) crowGable(x1 - 0.45, (z0 + z1) / 2, eave, span / 2 + 0.4, r + 1.2, 'x', 5); }
    else { if (ends[0]) crowGable((x0 + x1) / 2, z0 + 0.45, eave, span / 2 + 0.4, r + 1.2, 'z', 5); if (ends[1]) crowGable((x0 + x1) / 2, z1 - 0.45, eave, span / 2 + 0.4, r + 1.2, 'z', 5); }
  } else gableRoof(x0, x1, z0, z1, eave, r, { axis: ax ? 'x' : 'z', over: 0.35, gables: ends });
  // dormers and chimneys
  const R = rng('range' + x0 + ',' + z0);
  if (dormers) {
    const nd = Math.max(1, Math.floor(L / dormerStep));
    for (let i = 0; i < nd; i++) {
      const t = (i + 0.5) / nd;
      for (const sgn of [-1, 1]) {
        if (dormers === 'crow' || dormers === 'stone') {
          const px = ax ? lerp(x0, x1, t) : (sgn > 0 ? x1 : x0), pz = ax ? (sgn > 0 ? z1 : z0) : lerp(z0, z1, t);
          wallDormer(px - (ax ? 0 : sgn * 0.6), pz - (ax ? sgn * 0.6 : 0), ax ? 0 : sgn, ax ? sgn : 0, eave, dormerW, dormerW * 1.2, dormers === 'crow');
        } else {
          const f = 0.32, px = ax ? lerp(x0, x1, t) : (x0 + x1) / 2 + sgn * (span / 2) * (1 - f), pz = ax ? (z0 + z1) / 2 + sgn * (span / 2) * (1 - f) : lerp(z0, z1, t);
          place('dormer', xf([px, eave + r * f - 0.3, pz], ax ? (sgn > 0 ? 0 : Math.PI) : (sgn > 0 ? Math.PI / 2 : -Math.PI / 2), 1.4), [R() < 0.5 ? 1 : 0, R(), 0]);
        }
      }
    }
  }
  for (let i = 0; i < chimneys; i++) {
    const t = (i + 0.5) / chimneys + (R() - 0.5) * 0.1;
    place('chimney', xf([ax ? lerp(x0, x1, t) : (x0 + x1) / 2 + span * 0.1, eave + r * 0.78, ax ? (z0 + z1) / 2 + span * 0.1 : lerp(z0, z1, t)], 0, [1.6, 2.3 + R() * 0.8, 1.3]));
  }
}
