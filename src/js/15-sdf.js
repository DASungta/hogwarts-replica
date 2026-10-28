// ------------------------------------------------------------------ SDF sculpting (from athena-demo): primitives, smooth union, surface nets
// Statues, beasts, the owl lectern and the armour are written as signed distance functions (metres) and meshed once
// at load time with block-sparse surface nets; each vertex gets a baked cavity occlusion in its colour.
function sdEll(px, py, pz, cx, cy, cz, rx, ry, rz) {
  const x = (px - cx) / rx, y = (py - cy) / ry, z = (pz - cz) / rz;
  const k0 = Math.sqrt(x * x + y * y + z * z), k1 = Math.sqrt((x * x) / (rx * rx) + (y * y) / (ry * ry) + (z * z) / (rz * rz));
  return (k0 * (k0 - 1)) / Math.max(k1, 1e-9);
}
function sdCap(px, py, pz, ax, ay, az, bx, by, bz, ra, rb = ra) {
  const bax = bx - ax, bay = by - ay, baz = bz - az, pax = px - ax, pay = py - ay, paz = pz - az;
  const h = clamp((pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz), 0, 1);
  const dx = pax - bax * h, dy = pay - bay * h, dz = paz - baz * h;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) - (ra + (rb - ra) * h);
}
function sdBox(px, py, pz, cx, cy, cz, hx, hy, hz, r = 0) {
  const qx = Math.abs(px - cx) - hx + r, qy = Math.abs(py - cy) - hy + r, qz = Math.abs(pz - cz) - hz + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r;
}
function sdTorusY(px, py, pz, cx, cy, cz, R, r) { const q = Math.hypot(px - cx, pz - cz) - R; return Math.hypot(q, py - cy) - r; }
function sdCylY(px, py, pz, cx, cz, y0, y1, r) { const d = Math.hypot(px - cx, pz - cz) - r, h = Math.max(y0 - py, py - y1); return Math.min(Math.max(d, h), 0) + Math.hypot(Math.max(d, 0), Math.max(h, 0)); }
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
const smax = (a, b, k) => -smin(-a, -b, k);
// a chain of capsules along points [[x,y,z,r], ...], smoothly joined
function sdChain(px, py, pz, pts, k = 0.02) {
  let d = 1e9;
  for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; d = smin(d, sdCap(px, py, pz, a[0], a[1], a[2], b[0], b[1], b[2], a[3], b[3]), k); }
  return d;
}

// meshing is a generator that yields every so often: meshSDF runs it straight through, meshSDFAsync spreads it over
// frames (the figures are meshed in idle time after the castle has loaded, so entering a room does not freeze the page)
function meshSDF(f, opts) { const g = meshSDFGen(f, opts); let r; while (!(r = g.next()).done); return r.value; }
async function meshSDFAsync(f, opts, budget = 14) {
  const g = meshSDFGen(f, opts); let t = performance.now(), r;
  while (!(r = g.next()).done) if (performance.now() - t > budget) { await new Promise((res) => setTimeout(res, 0)); t = performance.now(); }
  return r.value;
}
function* meshSDFGen(f, { min, max, cell, band = 1.7, ao = 0.025, tag = null }) {
  let work = 0;
  const h = cell, B = 8, S = B + 1;
  const nx = Math.ceil((max[0] - min[0]) / h), ny = Math.ceil((max[1] - min[1]) / h), nz = Math.ceil((max[2] - min[2]) / h);
  const bx = Math.ceil(nx / B), by = Math.ceil(ny / B), bz = Math.ceil(nz / B);
  const halfDiag = Math.sqrt(3) * B * h * 0.5;
  const blocks = [];
  for (let i = 0; i < bx; i++) for (let j = 0; j < by; j++) for (let k = 0; k < bz; k++) {
    const d = f(min[0] + (i + 0.5) * B * h, min[1] + (j + 0.5) * B * h, min[2] + (k + 0.5) * B * h);
    if (Math.abs(d) > halfDiag * band + h) continue;
    const a = new Float32Array(S * S * S); let pos = false, neg = false;
    for (let u = 0; u < S; u++) for (let v = 0; v < S; v++) for (let w = 0; w < S; w++) {
      const val = f(min[0] + (i * B + u) * h, min[1] + (j * B + v) * h, min[2] + (k * B + w) * h);
      a[(u * S + v) * S + w] = val; if (val > 0) pos = true; else neg = true;
    }
    if (pos && neg) blocks.push([i, j, k, a]);
    if ((++work & 15) === 0) yield;
  }
  const C = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const E = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const key = (i, j, k) => (i * (ny + 2) + j) * (nz + 2) + k;
  const vid = new Map(), P = [], cells = [], v8 = new Float32Array(8);
  for (const [bi, bj, bk, a] of blocks) {
    for (let u = 0; u < B; u++) for (let v = 0; v < B; v++) for (let w = 0; w < B; w++) {
      let mask = 0;
      for (let q = 0; q < 8; q++) { const c = C[q]; const val = a[((u + c[0]) * S + (v + c[1])) * S + (w + c[2])]; v8[q] = val; if (val < 0) mask |= 1 << q; }
      if (mask === 0 || mask === 255) continue;
      const gi = bi * B + u, gj = bj * B + v, gk = bk * B + w;
      if (gi >= nx || gj >= ny || gk >= nz) continue;
      let sx = 0, sy = 0, sz = 0, n = 0;
      for (const [p, q] of E) {
        const a0 = v8[p], a1 = v8[q];
        if ((a0 < 0) !== (a1 < 0)) { const t = a0 / (a0 - a1); sx += C[p][0] + (C[q][0] - C[p][0]) * t; sy += C[p][1] + (C[q][1] - C[p][1]) * t; sz += C[p][2] + (C[q][2] - C[p][2]) * t; n++; }
      }
      vid.set(key(gi, gj, gk), P.length / 3);
      P.push(min[0] + (gi + sx / n) * h, min[1] + (gj + sy / n) * h, min[2] + (gk + sz / n) * h);
      cells.push(gi, gj, gk, v8[0], v8[1], v8[2], v8[4]);
    }
    if ((++work & 31) === 0) yield;
  }
  const idx = [];
  const quad = (a, b, c, d, flip) => {
    const A = vid.get(a), Bq = vid.get(b), Cq = vid.get(c), Dq = vid.get(d);
    if (A === undefined || Bq === undefined || Cq === undefined || Dq === undefined) return;
    if (flip) idx.push(A, Bq, Cq, A, Cq, Dq); else idx.push(A, Cq, Bq, A, Dq, Cq);
  };
  for (let c = 0; c < cells.length; c += 7) {
    const i = cells[c], j = cells[c + 1], k = cells[c + 2], a0 = cells[c + 3], ax = cells[c + 4], ay = cells[c + 5], az = cells[c + 6];
    const in0 = a0 < 0;
    if (in0 !== (ax < 0) && j > 0 && k > 0) quad(key(i, j, k), key(i, j - 1, k), key(i, j - 1, k - 1), key(i, j, k - 1), in0);
    if (in0 !== (ay < 0) && i > 0 && k > 0) quad(key(i, j, k), key(i, j, k - 1), key(i - 1, j, k - 1), key(i - 1, j, k), in0);
    if (in0 !== (az < 0) && i > 0 && j > 0) quad(key(i, j, k), key(i - 1, j, k), key(i - 1, j - 1, k), key(i, j - 1, k), in0);
  }
  const nrm = new Float32Array(P.length), col = new Float32Array(P.length), e = h * 0.6;
  for (let v = 0; v < P.length; v += 3) {
    const x = P[v], y = P[v + 1], z = P[v + 2];
    let gx = f(x + e, y, z) - f(x - e, y, z), gy = f(x, y + e, z) - f(x, y - e, z), gz = f(x, y, z + e) - f(x, y, z - e);
    const l = Math.hypot(gx, gy, gz) || 1; gx /= l; gy /= l; gz /= l;
    nrm[v] = gx; nrm[v + 1] = gy; nrm[v + 2] = gz;
    const d1 = f(x + gx * ao, y + gy * ao, z + gz * ao), d2 = f(x + gx * ao * 3, y + gy * ao * 3, z + gz * ao * 3);
    const occ = clamp(0.2 + 0.8 * (0.45 * clamp(d1 / ao, 0, 1) + 0.55 * clamp(d2 / (3 * ao), 0, 1)), 0, 1);
    col[v] = col[v + 1] = col[v + 2] = occ;
    if ((v & 4095) === 0) yield;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  if (tag) { // carving regions and flow directions per vertex (see the carving shader in 66-sculpt.js)
    const aux = new Float32Array(P.length / 3 * 2), flow = new Float32Array(P.length);
    for (let v = 0, k = 0; v < P.length; v += 3, k++) {
      const t = tag(P[v], P[v + 1], P[v + 2]), l = Math.hypot(t[1], t[2], t[3]) || 1;
      aux[k * 2] = t[0]; flow[v] = t[1] / l; flow[v + 1] = t[2] / l; flow[v + 2] = t[3] / l;
    }
    geo.setAttribute('aux', new THREE.BufferAttribute(aux, 2)); geo.setAttribute('flow', new THREE.BufferAttribute(flow, 3));
  }
  geo.setIndex(idx);
  geo.computeBoundingSphere();
  return geo;
}
// add a sculpted mesh (already in world space or transformed by m) to the current scene
function addSculpt(geo, mat, m = null, { cast = true } = {}) {
  const mesh = new THREE.Mesh(geo, mat);
  if (m) mesh.applyMatrix4(m);
  mesh.castShadow = cast; mesh.receiveShadow = true;
  (TARGET || scene).add(mesh);
  return mesh;
}
