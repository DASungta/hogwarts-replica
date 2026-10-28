// ------------------------------------------------------------------ Highland conifers (spruce and pine), the forest edge
M.conifer = procMat({ name: 'conifer', rgb: [1, 1, 1], rough: 0.85, vc: true, bump: 1, frag: /* glsl */ `
  float n = cgFbm3(P * 0.9); float fl = cgVn(P * 4.0);
  vec3 g = mix(vec3(0.012, 0.024, 0.014), vec3(0.03, 0.045, 0.022), n);
  g += vec3(0.012, 0.016, 0.004) * smoothstep(0.6, 0.95, fl);
  diffuseColor.rgb *= g;
  cgH = cgVn(P * 3.0) * 0.12 + cgVn(P * 9.0) * 0.05;
  cgAO = vColor.r; cgSpec = 0.25;
` });
M.bark = procMat({ name: 'bark', rgb: [0.06, 0.045, 0.035], rough: 0.9 });
M.pinebark = procMat({ name: 'pinebark', rgb: [1, 1, 1], rough: 0.85, frag: /* glsl */ `
  float up = smoothstep(4.0, 14.0, P.y - vInstY);
  diffuseColor.rgb *= mix(vec3(0.06, 0.045, 0.035), vec3(0.12, 0.072, 0.045), up) * (0.8 + 0.4 * cgVn(P * vec3(3.0, 0.4, 3.0)));
`, inst: true, head: '#define vInstY vInst.y\n' });
// unit-height spruce: a lathe with drooping tiers and a ragged outline; vertex colour carries the inner shadow
function spruceGeo(seed, tiers = 9, slim = 0.27, RS = 10, steps = 4) {
  const r = rng('sp' + seed), ox = r() * 50, oz = r() * 50;
  const HS = tiers * steps, pos = [], col = [], idx = [];
  for (let j = 0; j <= HS; j++) {
    const t = 0.08 + (j / HS) * 0.92;
    const saw = 1 - ((j % steps) / steps);
    const env = slim * Math.pow(1 - t, 0.85) * (j === HS ? 0 : 1);
    for (let i = 0; i <= RS; i++) {
      const a = (i / RS) * Math.PI * 2, cx = Math.cos(a), cz = Math.sin(a);
      const n = noise3(cx * 1.5 + ox, t * 9, cz * 1.5 + oz);
      const rr = env * (0.55 + 0.45 * saw) * (1 + 0.35 * n);
      pos.push(cx * rr, t - saw * 0.025, cz * rr);
      const ao = clamp(0.35 + 0.55 * saw + n * 0.4, 0.15, 1) * lerp(0.55, 1, t);
      col.push(ao, ao, ao);
    }
  }
  for (let j = 0; j < HS; j++) for (let i = 0; i < RS; i++) { const a = j * (RS + 1) + i, b = a + RS + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
function pineCrownGeo(seed, lod = 0) { // unit-height tree: the crown sits from 0.62 to 1.0, in clumps (fewer at lod 1)
  { // a flat-topped crown of needle sprays in clumps (8-11 near, 5 far with fewer, larger sprays)
    const r = rng('pine' + seed), clumps = [];
    const n = lod ? 5 : 8 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, d = i === 0 ? 0 : 0.03 + r() * 0.09, y = 0.66 + r() * 0.28 + (i === 0 ? 0.04 : 0) - d * 0.6;
      const sx = 0.055 + r() * 0.04, sy = 0.04 + r() * 0.03;
      clumps.push([Math.cos(a) * d, y, Math.sin(a) * d, sx * (lod ? 1.25 : 1), sy * (lod ? 1.2 : 1), sx * (lod ? 1.25 : 1), lod ? 16 : 44]);
    }
    return cardCrown(clumps, lod ? 0.075 : 0.05, 'pine' + seed + lod, [0, 0.8, 0]);
  }
  const r = rng('pine' + seed), parts = [];
  const n = lod ? 4 : 8 + Math.floor(r() * 4);
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, d = i === 0 ? 0 : 0.03 + r() * 0.09, y = 0.66 + r() * 0.28 + (i === 0 ? 0.04 : 0) - d * 0.6;
    let g = mergeVertices(new THREE.IcosahedronGeometry(1, lod ? 0 : 1).deleteAttribute('normal').deleteAttribute('uv'));
    const sx = 0.055 + r() * 0.04, sy = 0.045 + r() * 0.035;
    const p = g.attributes.position; const col = [];
    for (let k = 0; k < p.count; k++) {
      const x = p.getX(k), yy = p.getY(k), z = p.getZ(k), nn = noise3(x * 2 + seed * 7 + i, yy * 2, z * 2);
      const kk = 1 + 0.3 * nn;
      p.setXYZ(k, x * kk * sx + Math.cos(a) * d, yy * kk * sy * (yy < 0 ? 0.6 : 1) + y, z * kk * sx + Math.sin(a) * d);
      const ao = clamp(0.45 + yy * 0.35 + nn * 0.6, 0.15, 1); col.push(ao, ao, ao);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals();
    parts.push(g.toNonIndexed());
  }
  // a few bare branches from the top of the trunk into the clumps
  for (let i = 0; i < (lod ? 0 : 4); i++) {
    const a = (i / 4) * Math.PI * 2 + r(), L = 0.08 + r() * 0.05;
    const b = new THREE.CylinderGeometry(0.003, 0.006, L, 5).translate(0, L / 2, 0).rotateZ(-0.9).rotateY(a).translate(0, 0.68 + r() * 0.12, 0).toNonIndexed();
    b.deleteAttribute('uv');
    const c = new Float32Array(b.attributes.position.count * 3).fill(0.25); b.setAttribute('color', new THREE.BufferAttribute(c, 3));
    parts.push(b);
  }
  return mergeGeometries(parts);
}
// bare branches from the top of a pine trunk up into its crown (unit height)
function pineBranchGeo(seed) {
  const r = rng('pinebr' + seed), parts = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + r(), L = 0.07 + r() * 0.06;
    parts.push(new THREE.CylinderGeometry(0.0025, 0.005, L, 5).translate(0, L / 2, 0).rotateZ(-0.8 - r() * 0.4).rotateY(a).translate(0, 0.66 + r() * 0.14, 0));
  }
  return merge(parts);
}
// needle sprays round the drooping tiers of a spruce (unit height), matching spruceGeo's outline
function spruceShell(seed, tiers, slim) {
  const clumps = [];
  for (let j = 0; j < tiers; j++) {
    const t = 0.08 + ((j + 0.75) / tiers) * 0.92, env = slim * Math.pow(1 - t, 0.85) * 1.05;
    if (env < 0.012) continue;
    clumps.push([0, t - 0.03, 0, env, 0.035, env, Math.round(10 + 60 * env / slim)]);
  }
  return cardCrown(clumps, 0.045, 'spruce' + seed, [0, 0.45, 0]);
}
function buildTrees(look) {
  const r = rng('trees');
  const near = [[], []], far = [[], []], trunks = [];
  const ok = (x, z) => {
    if (castleMask(x, z) > 0.05 && z > -200) return null;
    const e = ((x - 30) / 300) ** 2 + ((z + 40) / 260) ** 2; if (e < 1) return null;   // keep the castle grounds open
    const y = look(x, z); if (y < LAKE_Y + 1.5) return null;
    const sl = Math.abs(look(x + 4, z) - y) + Math.abs(look(x, z + 4) - y);
    if (sl > 4.5) return null;
    if (pitchMetric(x, z, 40) < 1.25) return null;
    if (z > STN.z - 75 && z < STN.z + 22 && x > -320 && x < 720) return null;
    if (nearPolyline(x, z, PATH_PTS, 14) || nearPolyline(x, z, FOREST_PATH, 5) || nearPolyline(x, z, ROAD_PTS, 8)) return null;
    { const [ox, oz, orr] = SITE_BY.owlery.circle; if (Math.hypot(x - ox, z - oz) < orr + 12) return null; }
    { const [a0, b0, a1, b1] = SITE_BY.lawn.rect; if (x > a0 - 10 && x < a1 + 10 && z > b0 - 10 && z < b1 + 10) return null; }
    if (x > -500 && x < -300 && z > -130 && z < 140 && r() < 0.85) return null;   // the open hillside between the bridge and the hut
    for (const id of ['stones', 'hagrid', 'willow']) { const [sx, sz, sr] = SITE_BY[id].circle; if (Math.hypot(x - sx, z - sz) < sr + 22) return null; }
    { const [a0, b0, a1, b1] = SITE_BY.ruins.rect; if (x > a0 - 12 && x < a1 + 12 && z > b0 - 12 && z < b1 + 12) return null; }
    return y;
  };
  const pines = [[], []], pinesFar = [[], []], pTrunks = [];
  const add = (x, z, y, h) => {
    const d = Math.hypot(x - 30, z - 10);
    if (r() < 0.38) { // Scots pine
      const hp = h * (1.05 + r() * 0.2), k = r() < 0.5 ? 0 : 1;
      (Math.hypot(x - 30, z - 10) < 520 || (z > 1150 && z < 1500) ? pines : pinesFar)[k].push(xf([x, y - 0.3, z], r() * 6.28, [hp, hp, hp], (r() - 0.5) * 0.05, (r() - 0.5) * 0.05));
      pTrunks.push(xf([x, y - 0.4, z], 0, [hp * 0.016, hp * 0.86, hp * 0.016], (r() - 0.5) * 0.04, (r() - 0.5) * 0.04));
      return;
    }
    const k = r() < 0.5 ? 0 : 1;
    const m = xf([x, y - 0.4, z], r() * 6.28, [h * (0.85 + r() * 0.3), h, h * (0.85 + r() * 0.3)], (r() - 0.5) * 0.06, (r() - 0.5) * 0.06);
    (d < 520 ? near : far)[k].push(m);
    if (d < 400) trunks.push(xf([x, y - 0.4, z], 0, [h * 0.022, h * 0.14, h * 0.022]));
  };
  // the forest edge west of the gorge (toward Hagrid's hut) and its scattered outliers
  for (let i = 0; i < 12000; i++) {
    const x = -1060 + r() * 600, z = -470 + r() * 560;
    const edge = smooth(-490, -580, x) + 0.06;
    if (r() > edge) continue;
    const y = ok(x, z); if (y === null) continue;
    add(x, z, y, 15 + r() * 12);
  }
  // trees down in the west gorge and on its far slope, under and around the wooden bridge (as in the third film)
  for (let i = 0; i < 1400; i++) {
    const z = -70 + r() * 140, x = gorgeX(z) - 34 + r() * 40;
    if (Math.abs(z + 24) < 7 || nearPolyline(x, z, PATH_PTS, 14)) continue;
    const y = look(x, z); if (y < LAKE_Y + 2 || y > -6) continue;
    const sl = Math.abs(look(x + 3, z) - y) + Math.abs(look(x, z + 3) - y); if (sl > 7) continue;
    if (r() < 0.45) continue;
    add(x, z, y, 12 + r() * 10);
  }
  // patchy woods on the hills all round
  for (let i = 0; i < 26000; i++) {
    const a = r() * Math.PI * 2, d = 380 + Math.pow(r(), 0.7) * 3200, x = 30 + Math.cos(a) * d, z = 10 + Math.sin(a) * d;
    if (fbm3(x / 380, 7.7, z / 380, 3) < 0.04 + 0.1 * smooth(1500, 3000, d)) continue;
    const y = ok(x, z); if (y === null) continue;
    if (y > 700) continue;
    add(x, z, y, 13 + r() * 12);
  }
  const g = [spruceGeo(1, 9, 0.27), spruceGeo(2, 7, 0.32)], gFar = [spruceGeo(1, 6, 0.27, 6, 2), spruceGeo(2, 5, 0.32, 6, 2)];
  for (let k = 0; k < 2; k++) {
    if (near[k].length) addInst(g[k], M.conifer, near[k]);
    if (near[k].length) addInst(spruceShell(k + 1, k ? 7 : 9, k ? 0.32 : 0.27), M.spruceCard, near[k], null, { cast: false });
    if (far[k].length) addInst(gFar[k], M.conifer, far[k], null, { cast: false });
  }
  addInst(new THREE.CylinderGeometry(0.5, 1, 1, 6).translate(0, 0.5, 0), M.bark, trunks);
  for (let k = 0; k < 2; k++) if (pines[k].length) addInst(pineCrownGeo(k + 1), M.needleCard, pines[k]);
  for (let k = 0; k < 2; k++) if (pines[k].length) addInst(pineBranchGeo(k + 1), M.pinebark, pines[k]);
  for (let k = 0; k < 2; k++) if (pinesFar[k].length) addInst(pineCrownGeo(k + 1, 1), M.needleCard, pinesFar[k], null, { cast: false });
  addInst(new THREE.CylinderGeometry(0.55, 1, 1, 7).translate(0, 0.5, 0), M.pinebark, pTrunks);
  return near[0].length + near[1].length + far[0].length + far[1].length;
}

// ---- grass tufts on the ground the close shots look at (blades bend outward, dark at the root)
M.grassBlade = procMat({ name: 'grassBlade', rgb: [1, 1, 1], rough: 0.8, vc: true, side: THREE.DoubleSide, inst: true, frag: /* glsl */ `
  float s = cgH31(floor(vInst * 0.7));
  vec3 g = mix(vec3(0.075, 0.092, 0.034), vec3(0.11, 0.108, 0.05), s * 0.8);
  g = mix(g, vec3(0.14, 0.125, 0.068), smoothstep(0.6, 0.9, cgVn(vInst * 0.08)) * 0.5);
  float far = smoothstep(25.0, 90.0, length(vInst - cameraPosition));   // far away a tuft is one pixel: keep it the colour of the turf
  diffuseColor.rgb *= g * mix(0.7 + 0.45 * vColor.r, 1.0, far);
  cgAO = mix(0.7 + 0.3 * vColor.r, 1.0, far); cgSpec = 0.25;
` });
function tuftGeo(seed) {
  const r = rng('tuft' + seed), pos = [], col = [];
  for (let i = 0; i < 9; i++) {
    const a = r() * Math.PI * 2, lean = 0.15 + r() * 0.35, h = 0.55 + r() * 0.45, w = 0.025 + r() * 0.02;
    const ox = (r() - 0.5) * 0.12, oz = (r() - 0.5) * 0.12, tx = -Math.sin(a) * w, tz = Math.cos(a) * w;
    const mx = ox + Math.cos(a) * lean * 0.4, mz = oz + Math.sin(a) * lean * 0.4, ex = ox + Math.cos(a) * lean, ez = oz + Math.sin(a) * lean;
    // two quads tapering to a tip
    const v = [[ox - tx, 0, oz - tz], [ox + tx, 0, oz + tz], [mx + tx * 0.6, h * 0.6, mz + tz * 0.6], [mx - tx * 0.6, h * 0.6, mz - tz * 0.6], [ex, h, ez]];
    for (const [i0, i1, i2] of [[0, 1, 2], [0, 2, 3], [3, 2, 4]]) for (const k of [i0, i1, i2]) { pos.push(...v[k]); const c = v[k][1] / h; col.push(c, c, c); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  const n = g.attributes.normal; for (let i = 0; i < n.count; i++) { const ny = n.getY(i); n.setXYZ(i, n.getX(i) * 0.4, Math.abs(ny) * 0.4 + 0.6, n.getZ(i) * 0.4); }
  return g;
}
function buildGrassTufts(look) {
  const r = rng('tufts'), lists = [[], [], []];
  const areas = [[-580, -270, -170, 150, 52000], [-210, 260, 1236, 1300, 9000], [-200, 700, 1328, 1380, 7000], [-130, 90, -240, -100, 9000], [190, 330, -70, 70, 6000], [-280, -130, -150, -70, 5000], [215, 345, -290, -165, 5000]];
  const ok = (x, z, y) => {
    if (y < LAKE_Y + 1.2) return false;
    const sl = Math.abs(look(x + 1.5, z) - y) + Math.abs(look(x, z + 1.5) - y); if (sl > 1.6) return false;
    if (nearPolyline(x, z, PATH_PTS, 2.2) || nearPolyline(x, z, FOREST_PATH, 1.8) || nearPolyline(x, z, ROAD_PTS, 2.6) || nearPolyline(x, z, BRIDGE_PATH, 2.0)) return false;
    { const [a0, b0, a1, b1] = SITE_BY.lawn.rect; if (x > a0 - 2 && x < a1 + 2 && z > b0 - 2 && z < b1 + 2) return false; }
    if (pitchMetric(x, z, 6) < 1) return false;
    for (const id of ['stones', 'hagrid', 'willow']) { const [sx, sz, sr] = SITE_BY[id].circle; if (Math.hypot(x - sx, z - sz) < sr + (id === 'hagrid' ? 14 : 3)) return false; }
    if (z > STN.z - 12 && z < STN.z + 15 && x > -260 && x < 680) return false;
    if (castleMask(x, z) > 0.2 && z > -60) return false;
    return true;
  };
  // tussocks: clumps of 10-40 tufts a metre or two across, as on rough Highland grazing
  for (const [x0, x1, z0, z1, n] of areas) for (let c = 0; c < n / 24; c++) {
    const cx = x0 + r() * (x1 - x0), cz = z0 + r() * (z1 - z0), cr = 0.6 + r() * 1.6, k = 10 + Math.floor(r() * 30);
    for (let i = 0; i < k; i++) {
      const a = r() * 6.28, d = Math.sqrt(r()) * cr, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d, y = look(x, z);
      if (!ok(x, z, y)) continue;
      const s = (0.3 + Math.pow(r(), 2) * 0.55) * (1 - 0.4 * d / cr);
      lists[i % 3].push(xf([x, y - 0.05, z], r() * 6.28, [s * (0.8 + r() * 0.5), s, s * (0.8 + r() * 0.5)]));
    }
  }
  for (const [x0, x1, z0, z1, n] of areas) for (let i = 0; i < n * 1.4; i++) {
    const x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0), y = look(x, z);
    if (!ok(x, z, y)) continue;
    const s = 0.16 + r() * 0.16;
    lists[i % 3].push(xf([x, y - 0.03, z], r() * 6.28, [s * 1.4, s, s * 1.4]));
  }
  for (let k = 0; k < 3; k++) addInst(tuftGeo(k), M.grassBlade, lists[k], null, { cast: false });
  return lists[0].length + lists[1].length + lists[2].length;
}
