// ------------------------------------------------------------------ painted textures: heraldry, banners, portraits (all drawn in code)
// The four house beasts and the school crest are 2D signed-distance drawings (y down, about -1..1), rasterised once
// into an embossed relief (shade + alpha) and a height map; banners, crest plaques, the stone crest over the hall
// fireplace and the train's crest are all composited from those. Portraits are painted one by one into an atlas.
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 8;
  return t;
}
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// ---- 2D distance primitives
function e2(x, y, cx, cy, rx, ry, rot = 0) {
  const c = Math.cos(rot), s = Math.sin(rot), dx = x - cx, dy = y - cy;
  const u = (dx * c + dy * s) / rx, v = (-dx * s + dy * c) / ry;
  return (Math.hypot(u, v) - 1) * Math.min(rx, ry);
}
function c2(x, y, ax, ay, bx, by, ra, rb = ra) {
  const bax = bx - ax, bay = by - ay, pax = x - ax, pay = y - ay;
  const t = clamp((pax * bax + pay * bay) / (bax * bax + bay * bay), 0, 1);
  return Math.hypot(pax - bax * t, pay - bay * t) - (ra + (rb - ra) * t);
}
function chain2(x, y, pts, k = 0.03) { // pts: [x, y, r]
  let d = 1e9;
  for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; d = smin(d, c2(x, y, a[0], a[1], b[0], b[1], a[2], b[2]), k); }
  return d;
}
function box2(x, y, cx, cy, hx, hy, r = 0) {
  const qx = Math.abs(x - cx) - hx + r, qy = Math.abs(y - cy) - hy + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

// ---- the four house beasts: each returns { d, detail } for a point (detail adds engraved lines inside)
const BEASTS = {
  // Gryffindor: a lion rampant, facing left
  lion(x, y) {
    let d = e2(x, y, -0.12, -0.16, 0.29, 0.23, 0.95);                       // chest
    d = smin(d, e2(x, y, 0.22, 0.28, 0.25, 0.19, 0.9), 0.1);                // haunch
    d = smin(d, c2(x, y, -0.04, 0.0, 0.16, 0.2, 0.16, 0.14), 0.08);          // waist
    // mane: a mass behind the head with flame-like locks running back and down the neck
    const mcx = -0.24, mcy = -0.44, ma = Math.atan2(y - mcy, x - mcx), mr = Math.hypot(x - mcx, y - mcy);
    let mn = e2(x, y, mcx, mcy, 0.3, 0.27, 0.5) - 0.045 * Math.max(0, Math.sin(ma * 9 + mr * 6));
    for (let i = 0; i < 9; i++) { const a = -2.4 + i * 0.42, L = 0.3 + 0.06 * Math.sin(i * 1.7); mn = smin(mn, c2(x, y, mcx + Math.cos(a) * 0.12, mcy + Math.sin(a) * 0.12, mcx + Math.cos(a + 0.35) * L, mcy + Math.sin(a + 0.35) * L, 0.075, 0.012), 0.04); }
    d = smin(d, mn, 0.06);
    d = smin(d, e2(x, y, -0.42, -0.6, 0.15, 0.13, 0.2), 0.03);              // head
    d = smin(d, e2(x, y, -0.58, -0.55, 0.11, 0.08, 0.25), 0.03);            // muzzle
    d = Math.max(d, -e2(x, y, -0.65, -0.49, 0.08, 0.02, -0.35));            // open mouth
    d = smin(d, e2(x, y, -0.57, -0.45, 0.08, 0.035, 0.2), 0.01);            // lower jaw
    d = smin(d, e2(x, y, -0.33, -0.77, 0.05, 0.065, -0.4), 0.02);           // ear
    d = Math.min(d, c2(x, y, -0.68, -0.48, -0.74, -0.42, 0.018, 0.008));   // tongue
    // forelegs raised, claws out
    d = smin(d, chain2(x, y, [[-0.24, -0.27, 0.1], [-0.5, -0.36, 0.08], [-0.72, -0.56, 0.06]]), 0.05);
    d = smin(d, e2(x, y, -0.78, -0.62, 0.09, 0.065, -0.7), 0.02);
    d = smin(d, chain2(x, y, [[-0.12, -0.08, 0.095], [-0.42, -0.02, 0.075], [-0.62, -0.14, 0.058]]), 0.05);
    d = smin(d, e2(x, y, -0.68, -0.17, 0.085, 0.06, -0.4), 0.02);
    for (const [px, py, a] of [[-0.84, -0.69, -1.4], [-0.87, -0.62, -1.0], [-0.86, -0.54, -0.6], [-0.75, -0.22, -1.1], [-0.76, -0.14, -0.6], [-0.74, -0.08, -0.2]])
      d = Math.min(d, c2(x, y, px, py, px + Math.cos(a) * 0.07, py + Math.sin(a) * 0.07, 0.02, 0.004));
    // hind legs
    d = smin(d, chain2(x, y, [[0.14, 0.34, 0.13], [0.1, 0.58, 0.09], [0.16, 0.75, 0.07], [0.02, 0.92, 0.06]]), 0.06);
    d = smin(d, e2(x, y, -0.05, 0.93, 0.12, 0.055), 0.02);
    d = smin(d, chain2(x, y, [[0.32, 0.3, 0.12], [0.5, 0.52, 0.09], [0.44, 0.7, 0.07], [0.58, 0.85, 0.06]]), 0.06);
    d = smin(d, e2(x, y, 0.65, 0.87, 0.1, 0.05, 0.3), 0.02);
    // tail curling up over the back, ending in a flame-shaped tuft
    d = smin(d, chain2(x, y, [[0.4, 0.22, 0.045], [0.6, 0.04, 0.036], [0.72, -0.22, 0.032], [0.66, -0.46, 0.03], [0.55, -0.56, 0.032]], 0.02), 0.02);
    const ta = Math.atan2(y + 0.66, x - 0.5);
    d = smin(d, e2(x, y, 0.5, -0.66, 0.07, 0.12, 0.5) - 0.018 * Math.max(0, Math.sin(ta * 3 + 0.6)), 0.04);
    // engraving: mane strands, the eye and brow, the line of the ribs
    let det = 0;
    if (mn < 0 && e2(x, y, -0.42, -0.6, 0.17, 0.15, 0.2) > 0) det = 0.4 + 0.4 * Math.sin((x * 0.55 - y * 0.83) * 55 + 3 * Math.sin((x * 0.83 + y * 0.55) * 9));
    det = Math.max(det, Math.hypot(x + 0.46, y + 0.64) < 0.024 ? 1 : 0);
    det = Math.max(det, Math.abs(c2(x, y, -0.52, -0.7, -0.4, -0.7, 0, 0)) < 0.01 ? 0.8 : 0);
    if (e2(x, y, -0.05, -0.05, 0.22, 0.13, 0.95) < 0) det = Math.max(det, 0.5 * (1 - smooth(0, 0.25, Math.abs(Math.sin((x * 0.55 + y) * 28)))));
    return { d, det };
  },
  // Ravenclaw: an eagle displayed, wings raised, head turned left
  eagle(x, y) {
    let d = e2(x, y, 0, 0.12, 0.17, 0.33);
    d = smin(d, e2(x, y, -0.04, -0.17, 0.12, 0.14), 0.06);
    d = smin(d, Math.hypot(x + 0.06, y + 0.38) - 0.12, 0.05);
    d = smin(d, e2(x, y, -0.2, -0.36, 0.09, 0.05, 0.15), 0.02);
    d = smin(d, c2(x, y, -0.27, -0.35, -0.3, -0.27, 0.025, 0.012), 0.01);
    d = smin(d, e2(x, y, 0.06, -0.47, 0.06, 0.035, -0.6), 0.02);             // crest feathers at the nape
    // wings: a solid sector from the shoulder, primaries scalloped at the tips, secondaries along the trailing edge
    const T0 = 10 * D2R, T1 = 98 * D2R, wing = (u, v) => {
      const r = Math.hypot(u, v), th = Math.atan2(v, u), t = clamp((th - T0) / (T1 - T0), 0, 1);
      const L = 0.62 + 0.3 * Math.sin(Math.PI * Math.pow(t, 0.8)) - 0.07 * Math.pow(Math.abs(Math.sin(t * Math.PI * 8.5)), 0.7);
      const lo = u * Math.sin(T0) - v * Math.cos(T0) + 0.035 * Math.pow(Math.abs(Math.sin(r * 26)), 0.7) * smooth(0.25, 0.4, r);
      return { d: Math.max(r - L, lo, v * Math.cos(T1) - u * Math.sin(T1)), r, t, L };
    };
    for (const s of [-1, 1]) d = smin(d, wing(s * (x - s * 0.12), -(y + 0.16)).d, 0.07);
    for (let i = 0; i < 5; i++) { const a = (90 + (i - 2) * 13) * D2R; d = smin(d, c2(x, y, 0, 0.4, Math.cos(a) * 0.48, 0.4 + Math.sin(a) * 0.48, 0.05, 0.035), 0.015); }
    for (const s of [-1, 1]) {
      d = smin(d, c2(x, y, s * 0.08, 0.38, s * 0.2, 0.58, 0.045, 0.03), 0.03);
      for (const a of [0.2, 0.9, 1.6]) d = Math.min(d, c2(x, y, s * 0.2, 0.58, s * 0.2 + s * Math.cos(a) * 0.08, 0.58 + Math.sin(a) * 0.08, 0.016, 0.005));
    }
    let det = 0;
    for (const s of [-1, 1]) {
      const W = wing(s * (x - s * 0.12), -(y + 0.16));
      if (W.d < 0) {
        const fr = W.t * 8.5, edge = Math.abs(fr - Math.round(fr));                       // primaries: radial lines between feathers
        if (W.r > W.L * 0.5 && edge < 0.06) det = 0.85;
        for (const rr of [0.3, 0.42]) if (Math.abs(W.r - rr - 0.025 * Math.abs(Math.sin(W.t * Math.PI * 14))) < 0.008) det = 0.7;   // covert rows
        if (W.r < 0.3) det = Math.max(det, 0.35 * (1 - smooth(0, 0.3, Math.abs(Math.sin(W.t * 60)))));
      }
    }
    if (e2(x, y, 0, 0.12, 0.15, 0.28) < 0) det = Math.max(det, 0.5 + 0.5 * Math.sin(y * 70 + Math.abs(x) * 30));
    det = Math.max(det, Math.hypot(x + 0.1, y + 0.4) < 0.022 ? 1 : 0);
    return { d, det };
  },
  // Hufflepuff: a badger passant, facing left
  badger(x, y) {
    let d = e2(x, y, 0.08, 0.06, 0.56, 0.25);
    d = smin(d, e2(x, y, 0.14, -0.06, 0.42, 0.21, 0.05), 0.08);
    d = smin(d, chain2(x, y, [[-0.38, -0.02, 0.19], [-0.6, 0.06, 0.12], [-0.83, 0.13, 0.05]]), 0.06);
    d = smin(d, Math.hypot(x + 0.42, y + 0.2) - 0.055, 0.02);
    for (const [lx, w] of [[-0.3, 0.075], [-0.15, 0.07], [0.36, 0.08], [0.5, 0.075]]) {
      d = smin(d, c2(x, y, lx, 0.12, lx - 0.03, 0.47, w, w * 0.8), 0.04);
      d = smin(d, e2(x, y, lx - 0.07, 0.5, 0.08, 0.035), 0.02);
    }
    d = smin(d, e2(x, y, 0.68, -0.04, 0.12, 0.05, -0.35), 0.04);
    let det = Math.abs(c2(x, y, -0.36, -0.1, -0.78, 0.08, 0, 0)) < 0.025 ? 0.9 : 0;   // the white face stripe
    if (d < -0.03 && x > -0.3) det = Math.max(det, 0.35 + 0.35 * Math.sin((x * 3 + y * 0.6) * 40));
    det = Math.max(det, Math.hypot(x + 0.6, y - 0.02) < 0.02 ? 1 : 0);
    return { d, det };
  },
  // Slytherin: a serpent rearing in an S, tongue out
  serpent(x, y) {
    let d = 1e9, det = 0;
    const N = 44, pts = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, yy = 0.92 - t * 1.6, xx = 0.36 * Math.sin(t * 2.35 * Math.PI + 0.2) * (0.55 + 0.45 * t) + 0.05;
      const r = 0.025 + 0.085 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15)), 0.55);
      pts.push([xx, yy, r]);
    }
    d = chain2(x, y, pts, 0.02);
    const hd = pts[N];
    d = smin(d, e2(x, y, hd[0] - 0.08, hd[1] - 0.06, 0.15, 0.085, -0.35), 0.04);
    d = Math.max(d, -e2(x, y, hd[0] - 0.19, hd[1] - 0.02, 0.07, 0.014, -0.25));
    d = Math.min(d, c2(x, y, hd[0] - 0.2, hd[1] - 0.02, hd[0] - 0.32, hd[1] + 0.02, 0.008), c2(x, y, hd[0] - 0.32, hd[1] + 0.02, hd[0] - 0.38, hd[1] - 0.01, 0.006), c2(x, y, hd[0] - 0.32, hd[1] + 0.02, hd[0] - 0.37, hd[1] + 0.07, 0.006));
    let best = 1e9, tb = 0;
    for (let i = 0; i < N; i++) { const q = Math.hypot(x - pts[i][0], y - pts[i][1]); if (q < best) { best = q; tb = i / N; } }
    if (d < 0) det = 0.4 + 0.4 * Math.sin(tb * 140) * Math.sin(Math.atan2(y - 0.1, x) * 6 + tb * 30);
    det = Math.max(det, Math.hypot(x - (hd[0] - 0.11), y - (hd[1] - 0.09)) < 0.02 ? 1 : 0);
    return { d, det };
  },
};

// rasterise a beast into an embossed relief canvas (grey shading in RGB, coverage in A) and a height canvas
const RELIEF = {};
function beastRelief(name, size = 512) {
  if (RELIEF[name + size]) return RELIEF[name + size];
  const f = BEASTS[name], shade = makeCanvas(size, size), hgt = makeCanvas(size, size);
  const gs = shade.getContext('2d'), gh = hgt.getContext('2d');
  const S = gs.createImageData(size, size), Hd = gh.createImageData(size, size);
  const px = 2.2 / size, H = new Float32Array(size * size), A = new Float32Array(size * size), Dt = new Float32Array(size * size);
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    const x = -1.1 + (i + 0.5) * px, y = -1.1 + (j + 0.5) * px, r = f(x, y), k = j * size + i;
    A[k] = clamp(0.5 - r.d / px, 0, 1);
    H[k] = Math.sqrt(clamp(-r.d / 0.07, 0, 1)) - 0.25 * r.det * clamp(-r.d / 0.03, 0, 1);
    Dt[k] = r.det;
  }
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    const k = j * size + i, hx = H[j * size + Math.min(size - 1, i + 1)] - H[j * size + Math.max(0, i - 1)], hy = H[Math.min(size - 1, j + 1) * size + i] - H[Math.max(0, j - 1) * size + i];
    const nx = -hx * 3.2, ny = -hy * 3.2, nz = 1, l = Math.hypot(nx, ny, nz);
    const lam = clamp((nx * -0.55 + ny * -0.6 + nz * 0.58) / l, 0, 1);
    const spec = Math.pow(clamp((nx * -0.3 + ny * -0.4 + nz * 0.87) / l, 0, 1), 24);
    const v = clamp(0.32 + 0.78 * lam + 0.5 * spec - 0.18 * Dt[k], 0, 1.4);
    S.data[k * 4] = S.data[k * 4 + 1] = S.data[k * 4 + 2] = Math.min(255, v * 200);
    S.data[k * 4 + 3] = A[k] * 255;
    const hv = Math.round(clamp(H[k], 0, 1) * 255 * A[k]);
    Hd.data[k * 4] = Hd.data[k * 4 + 1] = Hd.data[k * 4 + 2] = hv; Hd.data[k * 4 + 3] = 255;
  }
  gs.putImageData(S, 0, 0); gh.putImageData(Hd, 0, 0);
  return (RELIEF[name + size] = { shade, hgt });
}
// draw a beast's relief tinted with a colour (multiply), centred at (cx, cy) with size s, optionally mirrored
function drawBeast(g, name, cx, cy, s, color, mirror = false) {
  const { shade } = beastRelief(name), t = makeCanvas(shade.width, shade.height), tg = t.getContext('2d');
  tg.fillStyle = color; tg.fillRect(0, 0, t.width, t.height);
  tg.globalCompositeOperation = 'multiply'; tg.drawImage(shade, 0, 0);
  tg.globalCompositeOperation = 'destination-in'; tg.drawImage(shade, 0, 0);
  g.save(); g.translate(cx, cy); if (mirror) g.scale(-1, 1);
  g.drawImage(t, -s / 2, -s / 2, s, s * (t.height / t.width)); g.restore();
}

// ---- the school crest: a shield with scrolled top corners, quartered, a small 'H' shield at the centre
function crestPath(g, w, h) { // shield outline in a w x h box from (0,0)
  g.beginPath();
  g.moveTo(w * 0.14, h * 0.12);
  g.bezierCurveTo(w * 0.3, h * 0.03, w * 0.42, h * 0.14, w * 0.5, h * 0.08);
  g.bezierCurveTo(w * 0.58, h * 0.14, w * 0.7, h * 0.03, w * 0.86, h * 0.12);
  g.bezierCurveTo(w * 0.83, h * 0.3, w * 0.98, h * 0.42, w * 0.94, h * 0.55);
  g.bezierCurveTo(w * 0.88, h * 0.78, w * 0.66, h * 0.86, w * 0.5, h * 0.98);
  g.bezierCurveTo(w * 0.34, h * 0.86, w * 0.12, h * 0.78, w * 0.06, h * 0.55);
  g.bezierCurveTo(w * 0.02, h * 0.42, w * 0.17, h * 0.3, w * 0.14, h * 0.12);
  g.closePath();
}
// mode 'colour' (painted, for banners) or 'stone' (height map, for the relief over the fireplace)
function drawCrest(g, x0, y0, w, h, mode = 'colour') {
  const C = mode === 'colour', HT = mode === 'height';   // 'height': grey levels are relief heights
  g.save(); g.translate(x0, y0);
  // scrolls at the top corners
  for (const s of [-1, 1]) { // a scrolled volute at each top corner
    g.save(); g.translate(w * 0.5 + s * w * 0.4, h * 0.11); g.scale(s, 1);
    g.strokeStyle = C ? '#b38a3c' : HT ? '#8c8c8c' : '#a8a8a8'; g.lineCap = 'round';
    for (let k = 0; k < 26; k++) { const a0 = -0.6 + k * 0.17, r0 = w * (0.085 - k * 0.0026); g.lineWidth = w * (0.05 - k * 0.0014); g.beginPath(); g.arc(0, 0, Math.max(1, r0), a0, a0 + 0.2); g.stroke(); }
    g.restore();
  }
  crestPath(g, w, h);
  g.fillStyle = C ? '#2a1e10' : HT ? '#4a4a4a' : '#6a6a6a'; g.fill();
  g.lineWidth = w * 0.03; g.strokeStyle = C ? '#c49a48' : HT ? '#909090' : '#b0b0b0'; g.stroke();
  g.save(); crestPath(g, w, h); g.clip();
  const quarters = [['lion', '#7a1414', '#d4a94a', 0.27, 0.32], ['serpent', '#1c4a2a', '#c8ccc8', 0.73, 0.32], ['badger', '#c7a224', '#1a1408', 0.27, 0.72], ['eagle', '#1d2e5e', '#b88a4a', 0.73, 0.72]];
  for (const [b, field, metal, qx, qy] of quarters) {
    if (C) { g.fillStyle = field; g.fillRect(qx < 0.5 ? 0 : w / 2, qy < 0.5 ? 0 : h * 0.52, w / 2, qy < 0.5 ? h * 0.52 : h * 0.5); }
    const bx = w * (qx + (qx < 0.5 ? -0.02 : 0.02)), by = h * qy, bs = w * (b === 'badger' ? 0.52 : 0.5);
    if (HT) { g.globalCompositeOperation = 'lighten'; g.drawImage(beastRelief(b).hgt, bx - bs / 2, by - bs / 2, bs, bs); g.globalCompositeOperation = 'source-over'; }
    else drawBeast(g, b, bx, by, bs, C ? metal : '#d8d8d8');
  }
  g.restore();
  // the cross between the quarters and the 'H' shield
  g.fillStyle = C ? '#c49a48' : HT ? '#858585' : '#c0c0c0';
  g.fillRect(w * 0.485, h * 0.08, w * 0.03, h * 0.9); g.fillRect(w * 0.04, h * 0.505, w * 0.92, h * 0.03);
  g.beginPath(); g.moveTo(w * 0.36, h * 0.38); g.lineTo(w * 0.64, h * 0.38); g.lineTo(w * 0.64, h * 0.6); g.quadraticCurveTo(w * 0.62, h * 0.7, w * 0.5, h * 0.74); g.quadraticCurveTo(w * 0.38, h * 0.7, w * 0.36, h * 0.6); g.closePath();
  g.fillStyle = C ? '#d8b25a' : HT ? '#8a8a8a' : '#d0d0d0'; g.fill(); g.lineWidth = w * 0.012; g.strokeStyle = C ? '#5a3c14' : HT ? '#a0a0a0' : '#808080'; g.stroke();
  g.fillStyle = C ? '#3a2410' : HT ? '#c8c8c8' : '#ffffff'; g.font = `bold ${Math.round(h * 0.2)}px "Times New Roman", serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('H', w * 0.5, h * 0.535);
  g.restore();
}

// ---- house banners: wool field, damask, a border, the house beast embroidered, a pointed foot
const HOUSES4 = [
  { id: 'gryffindor', beast: 'lion', field: '#6e0c0c', field2: '#4e0707', metal: '#d8ac4c', trim: '#c9963c', zh: '格兰芬多' },
  { id: 'hufflepuff', beast: 'badger', field: '#c99a1a', field2: '#a07812', metal: '#1c140a', trim: '#2a2010', zh: '赫奇帕奇' },
  { id: 'ravenclaw', beast: 'eagle', field: '#152a5e', field2: '#0d1c44', metal: '#b88c4e', trim: '#a87c3c', zh: '拉文克劳' },
  { id: 'slytherin', beast: 'serpent', field: '#0f3f22', field2: '#0a2c17', metal: '#c8ccce', trim: '#a8aeb2', zh: '斯莱特林' },
];
// the banners themselves are drawn in 16b-crest.js (bannerMaps); mode: 'albedo' | 'mr' (metal / roughness) | 'height'
function drawBanner(g, w, h, house, mode = 'albedo') { g.clearRect(0, 0, w, h); g.drawImage(bannerMaps(house, w, h)[mode === 'mr' ? 'mr' : mode === 'height' ? 'height' : 'albedo'], 0, 0); }
function drawSchoolBanner(g, w, h, mode = 'albedo') { drawBanner(g, w, h, { id: 'school' }, mode); }
// wool with metal-thread embroidery: albedo, metal and roughness from the drawing, the thread raised by its height map
function bannerMat(name, draw, w = 1024, h = 3072, o = {}) {   // o: more procMat options (a vertex sway)
  const map = canvasTex(w, h, (g) => draw(g, w, h, 'albedo'));
  const mr = canvasTex(w, h, (g) => draw(g, w, h, 'mr'), false);
  const hm = canvasTex(w, h, (g) => draw(g, w, h, 'height'), false);
  return procMat({ name, rgb: [1, 1, 1], rough: 1, metal: 1, uv: true, side: THREE.DoubleSide, std: { map, roughnessMap: mr, metalnessMap: mr, alphaTest: 0.5 }, bump: 1,
    uniforms: { uBH: { value: hm } }, head: 'uniform sampler2D uBH;\n', ...o, frag: /* glsl */ `
    cgH = texture2D(uBH, UV).r * 0.006 + cgVn(vec3(UV * vec2(900.0, 2700.0), 1.0)) * 0.0004;
  ` });
}

// ---- portraits: an atlas of old oil paintings (8 x 6 cells), painted with gradients, strokes and varnish
const PORTRAIT = { cols: 8, rows: 6, cw: 256, ch: 320 };
function paintPortrait(g, w, h, seed) {
  const r = rng('portrait' + seed), kind = seed % 6 === 5 ? 'land' : ['wizard', 'gent', 'lady', 'wizard', 'knight'][seed % 5];
  const pick = (a) => a[Math.floor(r() * a.length)];
  // background: dark umber, sometimes a curtain or a window opening
  const bg = g.createRadialGradient(w * 0.4, h * 0.35, w * 0.05, w * 0.5, h * 0.5, w * 0.9);
  const bgc = pick([['#4a3a22', '#120c06'], ['#3a3426', '#0e0c08'], ['#4c2a1a', '#140806'], ['#2e3428', '#0a0c08']]);
  bg.addColorStop(0, bgc[0]); bg.addColorStop(1, bgc[1]); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  if (kind === 'land') {
    const sky = g.createLinearGradient(0, 0, 0, h * 0.6); sky.addColorStop(0, pick(['#6a7a86', '#8a7a5a', '#7a8070'])); sky.addColorStop(1, '#c8b88a');
    g.fillStyle = sky; g.fillRect(0, 0, w, h * 0.62);
    for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(255,250,235,${0.08 + r() * 0.12})`; g.beginPath(); g.ellipse(r() * w, r() * h * 0.35, w * (0.15 + r() * 0.2), h * 0.04, 0, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#4a5034'; g.beginPath(); g.moveTo(0, h * 0.55); for (let x = 0; x <= w; x += w / 10) g.lineTo(x, h * (0.5 + 0.07 * Math.sin(x * 0.03 + seed) + r() * 0.03)); g.lineTo(w, h); g.lineTo(0, h); g.fill();
    g.fillStyle = '#2a301c'; g.beginPath(); g.moveTo(0, h * 0.7); for (let x = 0; x <= w; x += w / 8) g.lineTo(x, h * (0.66 + 0.05 * Math.sin(x * 0.05 + seed * 2))); g.lineTo(w, h); g.lineTo(0, h); g.fill();
    if (r() < 0.6) { g.fillStyle = '#6a6250'; const cx = w * (0.3 + r() * 0.4); g.fillRect(cx, h * 0.38, w * 0.06, h * 0.14); g.fillRect(cx + w * 0.07, h * 0.42, w * 0.1, h * 0.1); g.beginPath(); g.moveTo(cx - w * 0.01, h * 0.38); g.lineTo(cx + w * 0.03, h * 0.31); g.lineTo(cx + w * 0.07, h * 0.38); g.fill(); }
    for (let i = 0; i < 3; i++) { const tx = r() * w; g.fillStyle = '#1e2414'; g.beginPath(); g.ellipse(tx, h * 0.6, w * 0.08, h * 0.12, 0, 0, Math.PI * 2); g.fill(); }
  } else {
    if (r() < 0.4) { const cur = g.createLinearGradient(0, 0, w * 0.4, 0); cur.addColorStop(0, '#3a0c0a'); cur.addColorStop(1, 'rgba(58,12,10,0)'); g.fillStyle = cur; g.fillRect(0, 0, w * 0.45, h); }
    const cx = w * (0.48 + (r() - 0.5) * 0.08), fy = h * (0.36 + r() * 0.04), fw = w * (0.2 + r() * 0.03);
    // body / robe with folds
    const robe = pick(kind === 'lady' ? ['#3a1418', '#1c2a3a', '#2a3a24', '#4a3a18'] : ['#1c1612', '#2a0e10', '#141c2a', '#1e2416', '#3a2a10']);
    const bodyG = g.createLinearGradient(cx - w * 0.4, 0, cx + w * 0.4, 0); bodyG.addColorStop(0, '#050403'); bodyG.addColorStop(0.45, robe); bodyG.addColorStop(1, '#060504');
    g.fillStyle = bodyG; g.beginPath(); g.moveTo(cx - w * 0.46, h); g.bezierCurveTo(cx - w * 0.42, fy + h * 0.2, cx - w * 0.2, fy + h * 0.12, cx, fy + h * 0.14); g.bezierCurveTo(cx + w * 0.2, fy + h * 0.12, cx + w * 0.42, fy + h * 0.2, cx + w * 0.46, h); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,230,180,0.08)'; g.lineWidth = w * 0.02;
    for (let i = 0; i < 5; i++) { const fx = cx + (r() - 0.5) * w * 0.6; g.beginPath(); g.moveTo(fx, fy + h * 0.25); g.quadraticCurveTo(fx + (r() - 0.5) * w * 0.1, fy + h * 0.45, fx + (r() - 0.5) * w * 0.15, h); g.stroke(); }
    if (kind === 'knight') { const pl = g.createLinearGradient(cx - w * 0.3, 0, cx + w * 0.3, 0); pl.addColorStop(0, '#141416'); pl.addColorStop(0.35, '#6a6a70'); pl.addColorStop(0.5, '#b8b8bc'); pl.addColorStop(0.7, '#4a4a50'); pl.addColorStop(1, '#101012'); g.fillStyle = pl;
      g.beginPath(); g.moveTo(cx - w * 0.34, h); g.lineTo(cx - w * 0.3, fy + h * 0.22); g.quadraticCurveTo(cx, fy + h * 0.14, cx + w * 0.3, fy + h * 0.22); g.lineTo(cx + w * 0.34, h); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, fy + h * 0.2); g.lineTo(cx, h); g.stroke(); }
    if (kind === 'wizard') { g.strokeStyle = '#a07a30'; g.lineWidth = w * 0.015; g.beginPath(); g.moveTo(cx - w * 0.08, fy + h * 0.16); g.lineTo(cx - w * 0.14, h); g.moveTo(cx + w * 0.08, fy + h * 0.16); g.lineTo(cx + w * 0.14, h); g.stroke(); }
    // collar or ruff
    if (kind === 'gent' || kind === 'lady') { g.fillStyle = '#d8d0bc'; g.beginPath(); g.ellipse(cx, fy + h * 0.15, fw * 1.25, h * 0.035, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = 'rgba(80,70,50,0.5)'; g.lineWidth = 1; for (let a = 0; a < 24; a++) { const ang = (a / 24) * Math.PI * 2; g.beginPath(); g.moveTo(cx + Math.cos(ang) * fw * 0.5, fy + h * 0.15 + Math.sin(ang) * h * 0.015); g.lineTo(cx + Math.cos(ang) * fw * 1.2, fy + h * 0.15 + Math.sin(ang) * h * 0.033); g.stroke(); } }
    // face: a three-quarter head lit from the upper left, built up in soft layers
    const skin = pick(['#b88a66', '#a87a58', '#c49a76', '#9a6e50']), turn = (r() - 0.5) * 0.5;
    g.save(); g.filter = 'blur(1.2px)';
    g.fillStyle = '#4a2a18'; g.beginPath(); g.ellipse(cx + fw * 0.05, fy + fw * 0.95, fw * 0.36, fw * 0.4, 0, 0, Math.PI * 2); g.fill();
    const head = () => { g.beginPath(); g.moveTo(cx - fw * 0.72, fy - fw * 0.25); g.bezierCurveTo(cx - fw * 0.78, fy - fw * 1.05, cx + fw * 0.78, fy - fw * 1.05, cx + fw * 0.72, fy - fw * 0.25);
      g.bezierCurveTo(cx + fw * 0.7, fy + fw * 0.45, cx + fw * 0.32, fy + fw * 0.98, cx + turn * fw * 0.3, fy + fw * 1.0); g.bezierCurveTo(cx - fw * 0.32, fy + fw * 0.98, cx - fw * 0.7, fy + fw * 0.45, cx - fw * 0.72, fy - fw * 0.25); g.closePath(); };
    head(); g.fillStyle = '#5a3420'; g.fill();
    g.save(); head(); g.clip();
    const lit = g.createRadialGradient(cx - fw * 0.3 + turn * fw * 0.4, fy - fw * 0.25, fw * 0.05, cx - fw * 0.1, fy, fw * 1.1);
    lit.addColorStop(0, '#f0d0ac'); lit.addColorStop(0.35, skin); lit.addColorStop(0.8, 'rgba(70,38,22,0.6)'); lit.addColorStop(1, 'rgba(40,20,10,0.9)');
    g.fillStyle = lit; g.fillRect(cx - fw, fy - fw * 1.2, fw * 2, fw * 2.4);
    g.fillStyle = 'rgba(190,80,60,0.18)'; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(cx + sx * fw * 0.4, fy + fw * 0.25, fw * 0.22, fw * 0.16, 0, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = 'rgba(40,20,10,0.35)'; g.beginPath(); g.ellipse(cx + fw * 0.55, fy + fw * 0.1, fw * 0.25, fw * 0.75, 0, 0, Math.PI * 2); g.fill();
    g.restore();
    const ex = (sx) => cx + turn * fw * 0.35 + sx * fw * (sx > 0 ? 0.3 : 0.36);
    g.fillStyle = 'rgba(50,25,12,0.5)'; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(ex(sx), fy - fw * 0.14, fw * 0.17, fw * 0.1, 0, 0, Math.PI * 2); g.fill(); }
    g.restore();
    g.fillStyle = '#e8dccc'; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(ex(sx), fy - fw * 0.13, fw * 0.08, fw * 0.035, 0, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#2a1a10'; for (const sx of [-1, 1]) { g.beginPath(); g.arc(ex(sx) + turn * fw * 0.04, fy - fw * 0.13, fw * 0.035, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = 'rgba(40,24,12,0.8)'; g.lineWidth = fw * 0.05; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(ex(sx) - fw * 0.12, fy - fw * 0.26); g.quadraticCurveTo(ex(sx), fy - fw * 0.31, ex(sx) + fw * 0.12, fy - fw * 0.25); g.stroke(); }
    g.save(); g.filter = 'blur(0.8px)';
    g.strokeStyle = 'rgba(255,230,200,0.5)'; g.lineWidth = fw * 0.06; g.beginPath(); g.moveTo(cx + turn * fw * 0.3, fy - fw * 0.1); g.lineTo(cx + turn * fw * 0.35 - fw * 0.02, fy + fw * 0.26); g.stroke();
    g.fillStyle = 'rgba(60,30,18,0.6)'; g.beginPath(); g.ellipse(cx + turn * fw * 0.35 + fw * 0.07, fy + fw * 0.3, fw * 0.08, fw * 0.04, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(110,40,30,0.75)'; g.lineWidth = fw * 0.055; g.beginPath(); g.moveTo(cx + turn * fw * 0.35 - fw * 0.18, fy + fw * 0.52); g.quadraticCurveTo(cx + turn * fw * 0.35, fy + fw * 0.57, cx + turn * fw * 0.35 + fw * 0.16, fy + fw * 0.51); g.stroke();
    g.restore();
    // hair, beards, hats
    const hair = pick(['#1a120a', '#3a2a1a', '#6a5a4a', '#c8c0b0', '#e8e4dc', '#4a2a14']);
    g.fillStyle = hair;
    if (kind === 'lady') { g.beginPath(); g.ellipse(cx, fy - fw * 0.55, fw * 0.9, fw * 0.6, 0, Math.PI, 0); g.fill(); g.beginPath(); g.arc(cx, fy - fw * 1.05, fw * 0.32, 0, Math.PI * 2); g.fill(); g.fillStyle = '#e8e0d0'; for (let i = 0; i < 9; i++) { const a = Math.PI * (0.15 + 0.7 * i / 8); g.beginPath(); g.arc(cx + Math.cos(a) * fw * 0.9, fy + h * 0.16 + Math.sin(a) * fw * 0.5, fw * 0.06, 0, Math.PI * 2); g.fill(); } }
    else {
      g.beginPath(); g.ellipse(cx, fy - fw * 0.6, fw * 0.82, fw * 0.48, 0, Math.PI, 0); g.fill();
      if (kind === 'wizard' || r() < 0.4) { const bc = kind === 'wizard' ? pick(['#d8d4cc', '#e8e6e0', '#8a8278']) : hair; g.fillStyle = bc; g.beginPath(); g.moveTo(cx - fw * 0.7, fy + fw * 0.15); g.quadraticCurveTo(cx - fw * 0.6, fy + fw * (kind === 'wizard' ? 2.4 : 1.3), cx, fy + fw * (kind === 'wizard' ? 2.8 : 1.4)); g.quadraticCurveTo(cx + fw * 0.6, fy + fw * (kind === 'wizard' ? 2.4 : 1.3), cx + fw * 0.7, fy + fw * 0.15); g.quadraticCurveTo(cx, fy + fw * 0.7, cx - fw * 0.7, fy + fw * 0.15); g.fill(); }
      if (kind === 'wizard') { g.fillStyle = pick(['#1a1210', '#3a0e10', '#1a2a3a', '#2a1a3a']); g.beginPath(); g.moveTo(cx - fw * 1.1, fy - fw * 0.7); g.quadraticCurveTo(cx - fw * 0.2, fy - fw * 0.95, cx + fw * (0.3 + r() * 0.5), fy - fw * (2.6 + r())); g.quadraticCurveTo(cx + fw * 0.3, fy - fw * 0.95, cx + fw * 1.1, fy - fw * 0.7); g.closePath(); g.fill(); }
      else if (kind === 'gent' && r() < 0.6) { g.fillStyle = '#0c0a08'; g.beginPath(); g.ellipse(cx, fy - fw * 0.85, fw * 1.1, fw * 0.25, 0, 0, Math.PI * 2); g.fill(); g.fillRect(cx - fw * 0.7, fy - fw * 1.5, fw * 1.4, fw * 0.7); }
      else if (kind === 'knight') { const hm = g.createLinearGradient(cx - fw, 0, cx + fw, 0); hm.addColorStop(0, '#2a2a2c'); hm.addColorStop(0.4, '#b0b0b4'); hm.addColorStop(1, '#2a2a2c'); g.fillStyle = hm; g.beginPath(); g.ellipse(cx, fy - fw * 0.55, fw * 0.95, fw * 0.75, 0, Math.PI, 0); g.fill(); }
    }
    if (r() < 0.45) { // a hand resting on a book or a staff
      g.fillStyle = skin; g.beginPath(); g.ellipse(cx + w * 0.18, h * 0.86, w * 0.06, h * 0.035, 0.3, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#3a1c0c'; g.fillRect(cx + w * 0.08, h * 0.88, w * 0.24, h * 0.05);
    }
  }
  // brushwork, varnish, craquelure, vignette
  for (let i = 0; i < 900; i++) { const x = r() * w, y = r() * h, a = r() * Math.PI; g.strokeStyle = `rgba(${r() < 0.5 ? '255,240,210' : '0,0,0'},${0.02 + r() * 0.04})`; g.lineWidth = 1 + r() * 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 6, y + Math.sin(a) * 6); g.stroke(); }
  g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgb(232,200,140)'; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'source-over';
  g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 0.6;
  for (let i = 0; i < 70; i++) { let x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 30; y += (r() - 0.5) * 30; g.lineTo(x, y); } g.stroke(); }
  const vg = g.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.8); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)'); g.fillStyle = vg; g.fillRect(0, 0, w, h);
}
let PORTRAIT_TEX = null;
function portraitAtlas() {
  if (PORTRAIT_TEX) return PORTRAIT_TEX;
  const { cols, rows, cw, ch } = PORTRAIT;
  PORTRAIT_TEX = canvasTex(cols * cw, rows * ch, (g) => {
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      g.save(); g.translate(i * cw, j * ch); g.beginPath(); g.rect(0, 0, cw, ch); g.clip();
      paintPortrait(g, cw, ch, j * cols + i); g.restore();
    }
  });
  PORTRAIT_TEX.generateMipmaps = true; PORTRAIT_TEX.minFilter = THREE.LinearMipmapLinearFilter;
  return PORTRAIT_TEX;
}
