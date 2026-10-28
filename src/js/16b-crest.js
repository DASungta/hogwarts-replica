// ------------------------------------------------------------------ the house banners as the films hang them (Order of the Phoenix on)
// A long banner with a swallowtail foot, two stripes of the house metal inset down both sides and round the tail, and the
// full house crest worked in metal thread: a barred helm on a twisted torse, mantling of acanthus leaves falling either
// side, the shield with the house beast, the house name on a scroll beneath. The beasts are drawn here with paths
// (heraldic poses: the lion rampant, the badger statant, the eagle displayed, the serpent coiled and raised). Every part is
// embossed from its own mask (its blurred alpha is a height, lit from the upper left), so the thread stands up off the
// wool; the same heights drive the banner material's bump, and the metal parts its metalness.

// ---- path helpers in a part's own units (the caller sets the transform)
function cubPts(P, n = 14) { // P: [x0, y0, c1x, c1y, c2x, c2y, x1, y1, c1x, ...] a chain of cubics
  const out = [[P[0], P[1]]];
  for (let i = 2; i + 5 < P.length; i += 6) {
    const x0 = P[i - 2], y0 = P[i - 1], [a, b, c, d, e, f] = P.slice(i, i + 6);
    for (let k = 1; k <= n; k++) {
      const t = k / n, u = 1 - t, w0 = u * u * u, w1 = 3 * u * u * t, w2 = 3 * u * t * t, w3 = t * t * t;
      out.push([w0 * x0 + w1 * a + w2 * c + w3 * e, w0 * y0 + w1 * b + w2 * d + w3 * f]);
    }
  }
  return out;
}
function blob(g, P) { // a closed shape from a cubic chain
  const pts = cubPts(P, 18); g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts) g.lineTo(p[0], p[1]); g.closePath(); g.fill();
}
// a tapered tube along a cubic chain, radius r0 at the start to r1 at the end (rounded ends)
function ctube(g, P, r0, r1 = r0, prof = null) {
  const pts = cubPts(P, 16), n = pts.length, L = [], R = [];
  let len = 0; const acc = [0]; for (let i = 1; i < n; i++) { len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); acc.push(len); }
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1;
    const t = acc[i] / (len || 1), r = prof ? prof(t) : lerp(r0, r1, t), nx = -ty / tl * r, ny = tx / tl * r;
    L.push([pts[i][0] + nx, pts[i][1] + ny]); R.push([pts[i][0] - nx, pts[i][1] - ny]);
  }
  g.beginPath(); g.moveTo(L[0][0], L[0][1]); for (const p of L) g.lineTo(p[0], p[1]);
  for (let i = R.length - 1; i >= 0; i--) g.lineTo(R[i][0], R[i][1]);
  g.closePath(); g.fill();
  const re = prof ? prof(1) : r1, rs = prof ? prof(0) : r0;
  g.beginPath(); g.arc(pts[n - 1][0], pts[n - 1][1], Math.max(re, 1e-4), 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(pts[0][0], pts[0][1], Math.max(rs, 1e-4), 0, Math.PI * 2); g.fill();
}
function ell(g, x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); g.fill(); }
function strokeChain(g, P, w) { const pts = cubPts(P, 14); g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts) g.lineTo(p[0], p[1]); g.stroke(); }
// a claw: a small hooked spike from (x, y) pointing at angle a (radians, y down)
function claw(g, x, y, a, L) { const c = Math.cos(a), s = Math.sin(a), nx = -s, ny = c; ctube(g, [x, y, x + c * L * 0.4 + nx * L * 0.05, y + s * L * 0.4 + ny * L * 0.05, x + c * L * 0.8 + nx * L * 0.2, y + s * L * 0.8 + ny * L * 0.2, x + c * L + nx * L * 0.38, y + s * L + ny * L * 0.38], L * 0.16, L * 0.02); }

// ---- the beasts: shape(g) fills the silhouette, detail(g) strokes the engraved lines; units: about -1..1, y down
const CREST_BEASTS = {
  lion: {   // rampant, facing the left: hind leg planted, forepaws raised, tail swept up in an S with a tuft
    shape(g) {
      blob(g, [-0.30, -0.40, -0.44, -0.20, -0.22, 0.14, 0.04, 0.26, 0.20, 0.34, 0.42, 0.34, 0.45, 0.14, 0.47, -0.04, 0.30, -0.14, 0.14, -0.30, 0.02, -0.44, -0.12, -0.60, -0.22, -0.60, -0.30, -0.58, -0.32, -0.50, -0.30, -0.40]);
      // the mane: flame locks round the neck, sweeping back (head and mane drawn a fifth larger, about the neck)
      g.save(); g.translate(-0.30, -0.56); g.scale(1.2, 1.2); g.translate(0.30, 0.56);
      for (let i = 0; i < 11; i++) {
        const a = -2.75 + i * 0.36, cx = -0.33, cy = -0.58, L = 0.22 + 0.06 * Math.sin(i * 1.9), bx = cx + Math.cos(a) * 0.1, by = cy + Math.sin(a) * 0.1;
        const ex = cx + Math.cos(a + 0.5) * (0.12 + L), ey = cy + Math.sin(a + 0.5) * (0.12 + L);
        ctube(g, [bx, by, bx + Math.cos(a) * 0.12, by + Math.sin(a) * 0.12, ex - Math.cos(a + 1.1) * 0.06, ey - Math.sin(a + 1.1) * 0.06, ex, ey], 0.075, 0.008);
      }
      ell(g, -0.30, -0.56, 0.2, 0.19);
      // the head: brow, snout, open jaws
      blob(g, [-0.33, -0.80, -0.44, -0.84, -0.56, -0.80, -0.62, -0.72, -0.66, -0.70, -0.71, -0.69, -0.73, -0.64, -0.74, -0.60, -0.70, -0.58, -0.64, -0.585, -0.60, -0.58, -0.58, -0.565, -0.56, -0.555,
        -0.62, -0.53, -0.67, -0.50, -0.66, -0.47, -0.62, -0.44, -0.54, -0.43, -0.46, -0.44, -0.38, -0.46, -0.28, -0.52, -0.26, -0.62, -0.24, -0.72, -0.28, -0.78, -0.33, -0.80]);
      blob(g, [-0.30, -0.80, -0.32, -0.90, -0.24, -0.92, -0.22, -0.84, -0.21, -0.80, -0.25, -0.77, -0.30, -0.80]);   // ear
      ctube(g, [-0.62, -0.535, -0.70, -0.53, -0.78, -0.52, -0.80, -0.46], 0.022, 0.012);                                 // tongue
      g.restore();
      // forelegs, raised, paws with claws out
      ctube(g, [-0.28, -0.36, -0.40, -0.40, -0.52, -0.46, -0.62, -0.60], 0.085, 0.052);
      ell(g, -0.68, -0.66, 0.08, 0.06, -0.8);
      for (const [a, k] of [[-2.2, 0], [-1.8, 1], [-1.4, 2]]) claw(g, -0.70 + Math.cos(a + 0.4) * 0.06, -0.69 + Math.sin(a + 0.4) * 0.05 - k * 0.0, a, 0.1);
      ctube(g, [-0.20, -0.16, -0.34, -0.12, -0.48, -0.16, -0.60, -0.26], 0.085, 0.05);
      ell(g, -0.66, -0.29, 0.08, 0.055, -0.5);
      for (const a of [-2.4, -2.0, -1.6]) claw(g, -0.70 + Math.cos(a + 0.5) * 0.05, -0.31 + Math.sin(a + 0.5) * 0.04, a, 0.09);
      // hind legs: the far one planted, the near one raised forward
      ctube(g, [0.30, 0.16, 0.42, 0.34, 0.40, 0.52, 0.30, 0.66, 0.22, 0.76, 0.12, 0.84, 0.04, 0.88], 0.0, 0.0, (t) => lerp(0.17, 0.055, Math.pow(t, 0.7)));
      ell(g, -0.02, 0.89, 0.1, 0.05, -0.1);
      for (const a of [3.0, 2.7, 2.4]) claw(g, -0.10, 0.88 + (a - 2.7) * 0.05, a, 0.08);
      ctube(g, [0.04, 0.14, 0.02, 0.36, -0.14, 0.44, -0.16, 0.56, -0.18, 0.64, -0.28, 0.70, -0.36, 0.70], 0.0, 0.0, (t) => lerp(0.15, 0.05, Math.pow(t, 0.7)));
      ell(g, -0.42, 0.70, 0.085, 0.045, 0.1);
      for (const a of [3.2, 2.9, 2.6]) claw(g, -0.49, 0.70 + (a - 2.9) * 0.05, a, 0.075);
      // the tail: up behind in an S, a flame tuft at the end
      ctube(g, [0.43, 0.10, 0.62, 0.00, 0.76, -0.22, 0.64, -0.36, 0.54, -0.46, 0.56, -0.58, 0.62, -0.64], 0.042, 0.022);
      for (const [a, L] of [[-1.9, 0.16], [-1.4, 0.18], [-0.9, 0.15], [-2.4, 0.12]]) ctube(g, [0.62, -0.64, 0.62 + Math.cos(a) * L * 0.4, -0.64 + Math.sin(a) * L * 0.4, 0.62 + Math.cos(a + 0.4) * L * 0.8, -0.64 + Math.sin(a + 0.4) * L * 0.8, 0.62 + Math.cos(a + 0.7) * L, -0.64 + Math.sin(a + 0.7) * L], 0.045, 0.006);
    },
    detail(g) {
      g.save(); g.translate(-0.30, -0.56); g.scale(1.2, 1.2); g.translate(0.30, 0.56);
      for (let i = 0; i < 9; i++) { const a = -2.6 + i * 0.4, cx = -0.33, cy = -0.58; strokeChain(g, [cx + Math.cos(a) * 0.12, cy + Math.sin(a) * 0.12, cx + Math.cos(a + 0.2) * 0.2, cy + Math.sin(a + 0.2) * 0.2, cx + Math.cos(a + 0.45) * 0.26, cy + Math.sin(a + 0.45) * 0.26, cx + Math.cos(a + 0.6) * 0.3, cy + Math.sin(a + 0.6) * 0.3], 0.014); }
      ell(g, -0.52, -0.71, 0.03, 0.016, -0.2);                                          // eye
      strokeChain(g, [-0.60, -0.76, -0.56, -0.79, -0.50, -0.78, -0.46, -0.75], 0.012);  // brow
      g.restore();
      for (const k of [0, 1, 2]) strokeChain(g, [-0.06 + k * 0.06, -0.12 + k * 0.1, 0.02 + k * 0.06, -0.08 + k * 0.1, 0.08 + k * 0.06, -0.02 + k * 0.1, 0.12 + k * 0.06, 0.06 + k * 0.1], 0.012);   // ribs
      strokeChain(g, [0.26, 0.18, 0.34, 0.26, 0.38, 0.38, 0.36, 0.48], 0.014);          // the thigh
      strokeChain(g, [0.04, 0.22, 0.02, 0.30, -0.04, 0.38, -0.10, 0.44], 0.012);
      strokeChain(g, [-0.30, -0.30, -0.36, -0.34, -0.42, -0.38, -0.48, -0.44], 0.01);
    },
  },
  badger: { // statant, facing the left: long low body, short strong legs, the white stripe down the face
    shape(g) {
      blob(g, [-0.40, -0.22, -0.10, -0.36, 0.36, -0.34, 0.60, -0.14, 0.74, -0.02, 0.68, 0.22, 0.50, 0.27, 0.20, 0.33, -0.20, 0.33, -0.44, 0.25, -0.58, 0.19, -0.62, 0.02, -0.58, -0.08, -0.54, -0.16, -0.48, -0.20, -0.40, -0.22]);
      blob(g, [-0.48, -0.18, -0.60, -0.17, -0.74, -0.10, -0.86, 0.02, -0.94, 0.08, -0.99, 0.10, -0.98, 0.14, -0.94, 0.17, -0.84, 0.19, -0.72, 0.22, -0.62, 0.22, -0.52, 0.18, -0.46, 0.06, -0.46, -0.10, -0.48, -0.18]);
      ell(g, -0.58, -0.18, 0.07, 0.06, -0.3);                                          // ear
      // legs, the far pair slightly behind
      for (const [x0, x1, r0] of [[-0.40, -0.46, 0.1], [-0.24, -0.22, 0.085], [0.46, 0.40, 0.12], [0.28, 0.27, 0.095]]) {
        ctube(g, [x0, 0.16, x0, 0.30, (x0 + x1) / 2, 0.40, x1, 0.48], r0, r0 * 0.75);
        ell(g, x1 - 0.06, 0.52, 0.1, 0.045);
        for (const k of [0, 1, 2]) claw(g, x1 - 0.13 - k * 0.025, 0.53, 2.7 + k * 0.15, 0.06);
      }
      ctube(g, [0.66, -0.06, 0.74, -0.06, 0.80, -0.02, 0.86, 0.04], 0.05, 0.018);       // tail
    },
    stripe(g) { // the light stripe from the snout over the eye to behind the ear
      blob(g, [-0.95, 0.08, -0.86, 0.00, -0.74, -0.08, -0.60, -0.13, -0.54, -0.15, -0.48, -0.14, -0.47, -0.08, -0.56, -0.05, -0.70, 0.02, -0.82, 0.08, -0.90, 0.11, -0.95, 0.11, -0.95, 0.08]);
    },
    detail(g) {
      ell(g, -0.74, 0.02, 0.025, 0.014, -0.3);
      for (let i = 0; i < 26; i++) { const x = -0.36 + i * 0.04, y = -0.26 + 0.1 * Math.pow(Math.abs(x - 0.12) / 0.5, 2) + (i % 2) * 0.05; strokeChain(g, [x, y, x + 0.02, y + 0.03, x + 0.04, y + 0.07, x + 0.05, y + 0.12], 0.01); }
      for (let i = 0; i < 18; i++) { const x = -0.30 + i * 0.05, y = 0.04 + (i % 3) * 0.05; strokeChain(g, [x, y, x + 0.02, y + 0.03, x + 0.03, y + 0.06, x + 0.04, y + 0.1], 0.009); }
      strokeChain(g, [-0.98, 0.12, -0.92, 0.14, -0.86, 0.15, -0.80, 0.16], 0.01);
    },
  },
  eagle: { // displayed, wings raised, the head turned to the left
    shape(g) {
      blob(g, [-0.06, -0.30, 0.10, -0.26, 0.18, 0.00, 0.12, 0.30, 0.08, 0.40, -0.04, 0.44, -0.10, 0.38, -0.18, 0.20, -0.20, -0.10, -0.12, -0.26, -0.10, -0.29, -0.08, -0.30, -0.06, -0.30]);
      blob(g, [-0.02, -0.54, 0.06, -0.52, 0.10, -0.42, 0.06, -0.30, 0.00, -0.26, -0.12, -0.27, -0.16, -0.36, -0.22, -0.38, -0.30, -0.37, -0.36, -0.36, -0.37, -0.32, -0.33, -0.30,
        -0.35, -0.38, -0.33, -0.44, -0.24, -0.48, -0.18, -0.52, -0.10, -0.56, -0.02, -0.54]);
      for (const sd of [-1, 1]) {
        const X = (x) => sd * x;
        // the arm and coverts, rising from the shoulder to the wrist
        blob(g, [X(0.10), -0.20, X(0.22), -0.34, X(0.40), -0.62, X(0.58), -0.80, X(0.64), -0.86, X(0.72), -0.84, X(0.72), -0.74, X(0.66), -0.52, X(0.52), -0.26, X(0.30), -0.04, X(0.20), 0.04, X(0.10), -0.06, X(0.10), -0.20]);
        // primaries and secondaries fanning out and down from the wing's edge
        for (let k = 0; k < 8; k++) {
          const t = k / 7, bx = lerp(0.68, 0.30, t), by = lerp(-0.78, -0.02, t), a = lerp(-0.55, 0.85, t), L = lerp(0.42, 0.26, t), wdt = lerp(0.055, 0.07, t);
          const ex = bx + Math.cos(a) * L, ey = by + Math.sin(a) * L;
          ctube(g, [X(bx), by, X(bx + Math.cos(a) * L * 0.35), by + Math.sin(a) * L * 0.35, X(bx + Math.cos(a) * L * 0.75), by + Math.sin(a) * L * 0.75, X(ex), ey], 0, 0, (u) => wdt * Math.sin(Math.PI * Math.min(1, 0.15 + u * 0.95)) + 0.006);
        }
      }
      for (let k = 0; k < 5; k++) { const a = Math.PI / 2 + (k - 2) * 0.22, L = 0.40 - Math.abs(k - 2) * 0.04, bx = -0.02, by = 0.32; ctube(g, [bx, by, bx + Math.cos(a) * L * 0.4, by + Math.sin(a) * L * 0.4, bx + Math.cos(a) * L * 0.8, by + Math.sin(a) * L * 0.8, bx + Math.cos(a) * L, by + Math.sin(a) * L], 0, 0, (u) => 0.06 * Math.sin(Math.PI * Math.min(1, 0.2 + u * 0.9)) + 0.008); }
      for (const sd of [-1, 1]) {
        ctube(g, [sd * 0.06, 0.28, sd * 0.12, 0.36, sd * 0.16, 0.42, sd * 0.20, 0.48], 0.045, 0.03);
        for (const a of [sd > 0 ? 0.3 : 2.8, Math.PI / 2, sd > 0 ? 1.1 : 2.0]) claw(g, sd * 0.21, 0.50, a, 0.08);
      }
    },
    detail(g) {
      ell(g, -0.12, -0.44, 0.025, 0.018);
      strokeChain(g, [-0.28, -0.41, -0.24, -0.42, -0.20, -0.41, -0.17, -0.38], 0.01);   // the beak line
      for (const sd of [-1, 1]) {
        for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) { const x = sd * (0.18 + r * 0.1 + k * 0.03), y = -0.18 - r * 0.15 + k * 0.08; g.beginPath(); g.arc(x, y, 0.04, 0.2, Math.PI - 0.2); g.lineWidth = 0.01; g.stroke(); }
        for (let k = 0; k < 8; k++) { const t = k / 7, bx = lerp(0.68, 0.30, t), by = lerp(-0.78, -0.02, t), a = lerp(-0.55, 0.85, t), L = lerp(0.42, 0.26, t) * 0.85; strokeChain(g, [sd * bx, by, sd * (bx + Math.cos(a) * L * 0.4), by + Math.sin(a) * L * 0.4, sd * (bx + Math.cos(a) * L * 0.7), by + Math.sin(a) * L * 0.7, sd * (bx + Math.cos(a) * L), by + Math.sin(a) * L], 0.008); }
      }
      for (let r = 0; r < 4; r++) for (let k = -2; k <= 2; k++) { g.beginPath(); g.arc(-0.02 + k * 0.06 + (r % 2) * 0.03, -0.16 + r * 0.12, 0.035, 0.2, Math.PI - 0.2); g.lineWidth = 0.009; g.stroke(); }
    },
  },
  serpent: { // coiled in an S, the head raised and turned to the left, the tongue out
    path: [-0.22, -0.56, -0.10, -0.36, 0.48, -0.46, 0.46, -0.16, 0.44, 0.10, -0.42, -0.02, -0.44, 0.26, -0.46, 0.56, 0.26, 0.66, 0.46, 0.50, 0.60, 0.38, 0.62, 0.14, 0.50, 0.06],
    prof: (t) => 0.014 + 0.115 * Math.sin(Math.PI * Math.min(1, 0.55 + t * 0.62)) * (t < 0.1 ? 0.85 + t * 1.5 : 1),
    shape(g) {
      ctube(g, this.path, 0, 0, this.prof);
      blob(g, [-0.14, -0.64, -0.20, -0.74, -0.34, -0.76, -0.46, -0.72, -0.54, -0.69, -0.56, -0.65, -0.52, -0.62, -0.44, -0.58, -0.32, -0.54, -0.20, -0.50, -0.14, -0.56, -0.14, -0.64]);
      ctube(g, [-0.18, -0.60, -0.20, -0.58, -0.22, -0.56, -0.22, -0.54], 0.075, 0.08);
      ctube(g, [-0.55, -0.65, -0.61, -0.64, -0.66, -0.63, -0.70, -0.62], 0.012, 0.008);
      ctube(g, [-0.70, -0.62, -0.72, -0.63, -0.75, -0.65, -0.77, -0.67], 0.008, 0.004);
      ctube(g, [-0.70, -0.62, -0.72, -0.61, -0.75, -0.60, -0.77, -0.58], 0.008, 0.004);
    },
    detail(g) {
      const pts = cubPts(this.path, 40), n = pts.length;
      let len = 0; const acc = [0]; for (let i = 1; i < n; i++) { len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); acc.push(len); }
      g.lineWidth = 0.008;
      for (let s = 0.04; s < len * 0.97; s += 0.035) {   // scales: chevrons across the body
        let i = 1; while (i < n - 1 && acc[i] < s) i++;
        const a = pts[i - 1], b = pts[i], tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1, ux = tx / tl, uy = ty / tl, r = this.prof(s / len) * 0.85;
        g.beginPath(); g.moveTo(b[0] - uy * r, b[1] + ux * r); g.lineTo(b[0] + ux * 0.02, b[1] + uy * 0.02); g.lineTo(b[0] + uy * r, b[1] - ux * r); g.stroke();
      }
      ell(g, -0.36, -0.68, 0.03, 0.02, -0.2);
      strokeChain(g, [-0.54, -0.655, -0.46, -0.64, -0.36, -0.62, -0.26, -0.58], 0.009);   // the mouth
    },
  },
};

// ---- embossing: parts are drawn into masks and stacked into float layers (colour, alpha, metal, roughness, height)
function embossStack(W, H) {
  const N = W * H;
  return { W, H, r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N), a: new Float32Array(N), m: new Float32Array(N), ro: new Float32Array(N).fill(0.9), h: new Float32Array(N),
    mc: makeCanvas(W, H), bc: makeCanvas(W, H) };
}
const _hex = (c) => { const v = parseInt(c.slice(1), 16); return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255]; };
// draw(g) fills the part (in the stack's pixels, the caller sets transforms); o: { col, metal, rough, h (relief height),
// blur (px of the bevel), groove (a sunk line: darken by it and press the height down), sheen }
function embossPart(S, draw, o) {
  const { W, H } = S, mg = S.mc.getContext('2d'), bg = S.bc.getContext('2d');
  mg.setTransform(1, 0, 0, 1, 0, 0); mg.clearRect(0, 0, W, H); mg.fillStyle = '#fff'; mg.strokeStyle = '#fff';
  draw(mg);
  mg.setTransform(1, 0, 0, 1, 0, 0);
  const md = mg.getImageData(0, 0, W, H).data;
  bg.setTransform(1, 0, 0, 1, 0, 0); bg.clearRect(0, 0, W, H); bg.filter = `blur(${o.blur ?? 4}px)`; bg.drawImage(S.mc, 0, 0); bg.filter = 'none';
  const bd = bg.getImageData(0, 0, W, H).data;
  const col = o.col ? _hex(o.col) : null, hk = o.h ?? 1, k = 2.2 * hk * 255 / Math.max(1, o.blur ?? 4) * 0.02;
  const lx = -0.5, ly = -0.62, lz = 0.6;
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x, al = md[i * 4 + 3] / 255; if (al <= 0) continue;
    const bl = bd[i * 4 + 3] / 255, hb = Math.sqrt(bl);
    if (o.groove) {   // a stitched line pressed in: darker, lower
      S.r[i] *= 1 - o.groove * al; S.g[i] *= 1 - o.groove * al; S.b[i] *= 1 - o.groove * al; S.h[i] -= 0.25 * hk * al; continue;
    }
    const dx = (bd[(i + 1) * 4 + 3] - bd[(i - 1) * 4 + 3]) / 255, dy = (bd[(i + W) * 4 + 3] - bd[(i - W) * 4 + 3]) / 255;
    const nx = -dx * k * 6, ny = -dy * k * 6, nl = Math.hypot(nx, ny, 1);
    const lam = Math.max(0, (nx * lx + ny * ly + lz) / nl / Math.hypot(lx, ly, lz)), spec = Math.pow(Math.max(0, (nx * -0.3 + ny * -0.4 + 0.87) / nl), o.metal ? 16 : 40);
    const sh = 0.5 + 0.62 * lam, sp = (o.metal ? 0.45 : 0.08) * spec;
    const c = col || (o.img ? [Math.pow(md[i * 4] / 255 / Math.max(al, 1e-3), 2.2), Math.pow(md[i * 4 + 1] / 255 / Math.max(al, 1e-3), 2.2), Math.pow(md[i * 4 + 2] / 255 / Math.max(al, 1e-3), 2.2)] : [S.r[i], S.g[i], S.b[i]]);
    const cr = c[0] * sh + sp, cg = c[1] * sh + sp, cb = c[2] * sh + sp;
    S.r[i] = S.r[i] * (1 - al) + cr * al; S.g[i] = S.g[i] * (1 - al) + cg * al; S.b[i] = S.b[i] * (1 - al) + cb * al;
    S.a[i] = Math.max(S.a[i], al);
    if (o.metal !== undefined) S.m[i] = S.m[i] * (1 - al) + (o.metal ? 1 : 0) * al;
    if (o.rough !== undefined) S.ro[i] = S.ro[i] * (1 - al) + o.rough * al;
    S.h[i] = S.h[i] * (1 - al) + (S.h[i] + hb * hk) * al;
  }
}
// metal thread: satin stitches across each metal area (fine diagonal ridges) and a slight sparkle
function satin(S, period = 5) {
  const { W, H } = S, r = rng('satin');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; if (S.m[i] < 0.5) continue;
    const s = 0.5 + 0.5 * Math.sin(((x + y * 0.55) / period) * Math.PI * 2), f = 0.82 + 0.26 * s + (r() - 0.5) * 0.06;
    S.r[i] *= f; S.g[i] *= f; S.b[i] *= f; S.h[i] += 0.06 * s;
  }
}
function stackCanvases(S) {
  const { W, H } = S, out = { albedo: makeCanvas(W, H), mr: makeCanvas(W, H), height: makeCanvas(W, H) };
  const A = new ImageData(W, H), B = new ImageData(W, H), C = new ImageData(W, H);
  let hmax = 1e-6; for (let i = 0; i < W * H; i++) hmax = Math.max(hmax, S.h[i]);
  const g = (v) => Math.round(255 * Math.pow(clamp(v, 0, 1), 1 / 2.2));
  for (let i = 0; i < W * H; i++) {
    A.data[i * 4] = g(S.r[i]); A.data[i * 4 + 1] = g(S.g[i]); A.data[i * 4 + 2] = g(S.b[i]); A.data[i * 4 + 3] = Math.round(S.a[i] * 255);
    B.data[i * 4] = 0; B.data[i * 4 + 1] = Math.round(clamp(S.ro[i], 0, 1) * 255); B.data[i * 4 + 2] = Math.round(clamp(S.m[i], 0, 1) * 255); B.data[i * 4 + 3] = Math.round(S.a[i] * 255);
    const hv = Math.round(clamp(S.h[i] / 2.2, 0, 1) * 255); C.data[i * 4] = C.data[i * 4 + 1] = C.data[i * 4 + 2] = hv; C.data[i * 4 + 3] = Math.round(S.a[i] * 255);
  }
  out.albedo.getContext('2d').putImageData(A, 0, 0); out.mr.getContext('2d').putImageData(B, 0, 0); out.height.getContext('2d').putImageData(C, 0, 0);
  return out;
}
// colours are linear in the stack; the palette is given in sRGB
const lin = (hex) => { const [r, g, b] = _hex(hex); const f = (v) => Math.pow(v, 2.2); return '#' + [r, g, b].map((v) => Math.round(f(v) * 255).toString(16).padStart(2, '0')).join(''); };

// ---- the house crest in a W x H box (W : H = 1 : 1.3): mantling, helm and torse, shield and beast, scroll and name
const CREST_PAL = {
  gryffindor: { field: '#7a0a0c', mant: '#9c1216', metal: '#d4a64c', shield: '#8a0d10', beast: '#d9ac50', ink: '#5a0a0a' },
  hufflepuff: { field: '#e2ab2a', mant: '#e9b737', metal: '#2a2016', shield: '#e6b232', beast: '#1e1810', ink: '#e8b83a', stripe: '#d8d2c4' },
  ravenclaw: { field: '#14265a', mant: '#1d3474', metal: '#b48244', shield: '#182c66', beast: '#bf8c4c', ink: '#14265a' },
  slytherin: { field: '#123d24', mant: '#1a5232', metal: '#c2c6ca', shield: '#15472a', beast: '#c8ccd0', ink: '#123d24' },
};
function drawCrestParts(S, house, x0, y0, W) {
  const P = CREST_PAL[house.id], cx = x0 + W / 2;
  const T = (g, f) => { g.setTransform(W, 0, 0, W, x0, y0); f(g); };   // part units: 0..1 across, 0..1.3 down
  const metal = { col: lin(P.metal), metal: true, rough: 0.32, h: 0.9, blur: Math.max(2, W * 0.006) };
  const steel = { col: lin('#b9bdc3'), metal: true, rough: 0.28, h: 1.0, blur: Math.max(2, W * 0.007) };
  // mantling: on each side three acanthus leaves falling from behind the helm, lobed along their length, curling at the
  // tips; the cloth in the house colour over a metal lining
  const spines = [
    [[0.44, 0.20, 0.32, 0.10, 0.17, 0.10, 0.11, 0.22], [0.145, 0.27, 0.042, 1.0]],
    [[0.36, 0.33, 0.22, 0.30, 0.09, 0.38, 0.08, 0.52], [0.13, 0.56, 0.046, 0.9]],
    [[0.30, 0.54, 0.20, 0.58, 0.09, 0.66, 0.11, 0.80], [0.165, 0.81, 0.05, -0.6]],
  ];
  const leafPts = (sp, sd) => { // the spine (a cubic) then a spiral of a turn and a half into the curl, mirrored for the right
    const [P0, [cx0, cy0, r0, a0]] = sp, pts = cubPts(P0, 20);
    const last = pts[pts.length - 1], st = Math.atan2(last[1] - cy0, last[0] - cx0);
    for (let k = 1; k <= 18; k++) { const t = k / 18, an = st + t * Math.PI * 1.5 * Math.sign(a0 || 1), rr = r0 * (1 - 0.75 * t); pts.push([cx0 + Math.cos(an) * rr, cy0 + Math.sin(an) * rr]); }
    return pts.map(([x, y]) => [sd < 0 ? x : 1 - x, y]);
  };
  const blade = (gg, pts, wk) => { // a lobed blade along the points
    const n = pts.length, L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1, t = i / (n - 1);
      const base = 0.036 * Math.sin(Math.PI * Math.min(1, 0.12 + t * 1.05)) + 0.007, lobe = 1 + 1.1 * Math.pow(Math.max(0, Math.sin(t * Math.PI * 9)), 5) * (t < 0.78 ? 1 : 0);
      const wo = base * lobe + wk, wi = base * 0.55 + wk, nx = -ty / tl, ny = tx / tl;
      L.push([pts[i][0] + nx * wo, pts[i][1] + ny * wo]); R.push([pts[i][0] - nx * wi, pts[i][1] - ny * wi]);
    }
    gg.beginPath(); gg.moveTo(L[0][0], L[0][1]); for (const p of L) gg.lineTo(p[0], p[1]); for (let i = n - 1; i >= 0; i--) gg.lineTo(R[i][0], R[i][1]); gg.closePath(); gg.fill();
  };
  const LV = []; for (const sd of [-1, 1]) for (const sp of spines) LV.push(leafPts(sp, sd));
  embossPart(S, (g) => T(g, (gg) => { for (const pts of LV) blade(gg, pts, 0.012); }), metal);
  embossPart(S, (g) => T(g, (gg) => { for (const pts of LV) blade(gg, pts, 0); }), { col: lin(P.mant), metal: false, rough: 0.8, h: 0.8, blur: W * 0.01 });
  embossPart(S, (g) => T(g, (gg) => { gg.lineWidth = 0.005; for (const pts of LV) { gg.beginPath(); gg.moveTo(pts[0][0], pts[0][1]); for (let i = 0; i < pts.length - 6; i++) gg.lineTo(pts[i][0], pts[i][1]); gg.stroke();
    for (let i = 3; i < pts.length - 10; i += 5) { const a = pts[i], b = pts[i + 2], tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1; gg.beginPath(); gg.moveTo(a[0], a[1]); gg.lineTo(a[0] - ty / tl * 0.045 + tx / tl * 0.02, a[1] + tx / tl * 0.045 + ty / tl * 0.02); gg.stroke(); } } }), { groove: 0.3, h: 0.8 });
  // the shield: metal border, the field, an inner fillet
  const shieldPts = (k) => { const l = 0.5 - 0.32 * k, r = 0.5 + 0.32 * k, t = 0.36 + 0.03 * (1 - k), b = 0.36 + 0.62 * k + (1 - k) * 0.035;
    return [l, t, l + 0.1 * k, t - 0.02 * k, 0.5 - 0.06 * k, t + 0.012 * k, 0.5, t + 0.02 * k, 0.5 + 0.06 * k, t + 0.012 * k, r - 0.1 * k, t - 0.02 * k, r, t,
      r + 0.01 * k, t + 0.18 * k, r - 0.02 * k, t + 0.36 * k, 0.5, b, 0.5 - (r - 0.5) + 0.02 * k, t + 0.36 * k, l - 0.01 * k, t + 0.18 * k, l, t]; };
  embossPart(S, (g) => T(g, (gg) => blob(gg, shieldPts(1))), { ...metal, h: 1.1, blur: W * 0.008 });
  embossPart(S, (g) => T(g, (gg) => blob(gg, shieldPts(0.9))), { col: lin(P.shield), metal: false, rough: 0.75, h: 0.4, blur: W * 0.01 });
  embossPart(S, (g) => T(g, (gg) => { const q = cubPts(shieldPts(0.84), 18); gg.beginPath(); gg.moveTo(q[0][0], q[0][1]); for (const p of q) gg.lineTo(p[0], p[1]); gg.closePath(); gg.lineWidth = 0.008; gg.stroke(); }), { ...metal, h: 0.6, blur: 2 });
  // the beast on the shield
  const B = CREST_BEASTS[house.beast], bs = { lion: 0.3, badger: 0.29, eagle: 0.29, serpent: 0.3 }[house.beast], by = { lion: 0.65, badger: 0.64, eagle: 0.66, serpent: 0.65 }[house.beast];
  const BT = (g, f) => { g.setTransform(W * bs, 0, 0, W * bs, cx, y0 + W * by); f(g); };
  embossPart(S, (g) => BT(g, (gg) => B.shape(gg)), { col: lin(P.beast), metal: house.id !== 'hufflepuff', rough: house.id === 'hufflepuff' ? 0.6 : 0.3, h: 1.2, blur: W * 0.006 });
  if (B.stripe) embossPart(S, (g) => BT(g, (gg) => B.stripe(gg)), { col: lin(P.stripe), metal: false, rough: 0.6, h: 0.3, blur: 2 });
  embossPart(S, (g) => BT(g, (gg) => B.detail(gg)), { groove: 0.42, h: 1.0 });
  // the helm on its torse, above the shield: a rounded skull, a grille of bars over the face opening, a flared gorget
  embossPart(S, (g) => T(g, (gg) => {
    blob(gg, [0.5, 0.155, 0.57, 0.155, 0.615, 0.2, 0.62, 0.26, 0.625, 0.31, 0.60, 0.34, 0.59, 0.36, 0.62, 0.38, 0.66, 0.40, 0.66, 0.42, 0.60, 0.44, 0.40, 0.44, 0.34, 0.42, 0.34, 0.40, 0.38, 0.38, 0.41, 0.36, 0.40, 0.34, 0.375, 0.31, 0.38, 0.26, 0.385, 0.2, 0.43, 0.155, 0.5, 0.155]);
  }), steel);
  embossPart(S, (g) => T(g, (gg) => { blob(gg, [0.445, 0.235, 0.5, 0.228, 0.555, 0.235, 0.565, 0.25, 0.57, 0.30, 0.56, 0.335, 0.5, 0.345, 0.44, 0.335, 0.43, 0.30, 0.435, 0.25, 0.445, 0.235]); }), { col: lin('#1a1a1e'), metal: false, rough: 0.6, h: -0.3, blur: 2 });
  embossPart(S, (g) => T(g, (gg) => { for (let k = -2; k <= 2; k++) { gg.beginPath(); gg.moveTo(0.5 + k * 0.025, 0.233); gg.quadraticCurveTo(0.5 + k * 0.029, 0.29, 0.5 + k * 0.024, 0.343); gg.lineWidth = 0.009; gg.stroke(); } gg.fillRect(0.43, 0.282, 0.14, 0.008); }), { ...steel, h: 0.8, blur: 1.5 });
  embossPart(S, (g) => T(g, (gg) => { gg.lineWidth = 0.004; gg.beginPath(); gg.moveTo(0.5, 0.16); gg.lineTo(0.5, 0.232); gg.stroke(); gg.beginPath(); gg.moveTo(0.36, 0.405); gg.quadraticCurveTo(0.5, 0.39, 0.64, 0.405); gg.stroke(); for (const x of [0.4, 0.6]) { gg.beginPath(); gg.arc(x, 0.42, 0.006, 0, 7); gg.fill(); } }), { groove: 0.45, h: 1.0 });
  for (const odd of [0, 1]) embossPart(S, (g) => T(g, (gg) => { for (let k = odd; k < 8; k += 2) { gg.beginPath(); gg.ellipse(0.41 + k * 0.026, 0.15, 0.018, 0.024, 0.6, 0, Math.PI * 2); gg.fill(); } }),   // the torse: twisted bands of metal and house colour
    odd ? { col: lin(P.mant), metal: false, rough: 0.7, h: 0.7, blur: 2 } : { ...metal, blur: 2 });
  // the scroll with the name, under the shield: a broad ribbon curving up at the ends, which fold back into forked tails
  const ry = 1.06, ht = 0.048, xs = (u) => 0.13 + u * 0.74, rib = (u) => ry - 0.075 * Math.pow(Math.abs(u - 0.5) * 2, 2), slope = (u) => -0.075 * 2 * (u - 0.5) * 4 / 0.74;
  for (const sd of [-1, 1]) {
    const u0 = sd < 0 ? 0 : 1, x0 = xs(u0), y0 = rib(u0) + 0.028;
    embossPart(S, (g) => T(g, (gg) => blob(gg, [x0, y0 - ht, x0 + sd * 0.05, y0 - ht + 0.004, x0 + sd * 0.09, y0 - ht + 0.006, x0 + sd * 0.12, y0 - ht - 0.006, x0 + sd * 0.09, y0, x0 + sd * 0.09, y0 + 0.004, x0 + sd * 0.12, y0 + ht + 0.01,
      x0 + sd * 0.09, y0 + ht + 0.012, x0 + sd * 0.05, y0 + ht + 0.008, x0, y0 + ht, x0, y0 + ht * 0.4, x0, y0 - ht * 0.4, x0, y0 - ht])), { col: lin(P.metal), metal: true, rough: 0.45, h: 0.55, blur: 3 });
    embossPart(S, (g) => T(g, (gg) => blob(gg, [x0 - sd * 0.035, y0 - ht - 0.028, x0 - sd * 0.005, y0 - ht - 0.02, x0 + sd * 0.012, y0 - ht, x0 + sd * 0.004, y0 + ht * 0.7, x0 - sd * 0.012, y0 + ht * 0.2, x0 - sd * 0.03, y0 - ht * 0.6, x0 - sd * 0.035, y0 - ht - 0.028])), { col: lin(P.metal), metal: true, rough: 0.5, h: 0.35, blur: 2 });
  }
  embossPart(S, (g) => T(g, (gg) => { const top = [], bot = []; for (let i = 0; i <= 30; i++) { const u = i / 30; top.push([xs(u), rib(u) - ht]); bot.push([xs(u), rib(u) + ht]); }
    gg.beginPath(); gg.moveTo(top[0][0], top[0][1]); for (const p of top) gg.lineTo(p[0], p[1]); for (let i = bot.length - 1; i >= 0; i--) gg.lineTo(bot[i][0], bot[i][1]); gg.closePath(); gg.fill(); }), { ...metal, h: 0.9, blur: 3 });
  embossPart(S, (g) => T(g, (gg) => { const name = house.id.toUpperCase(), n = name.length; gg.font = 'bold 0.064px "Times New Roman", serif'; gg.textAlign = 'center'; gg.textBaseline = 'middle';
    for (let i = 0; i < n; i++) { const u = 0.5 + (i - (n - 1) / 2) * (0.84 / n); gg.save(); gg.translate(xs(u), rib(u) + 0.004); gg.rotate(Math.atan(slope(u))); gg.fillText(name[i], 0, 0); gg.restore(); } }),
    { col: lin(P.ink), metal: false, rough: 0.7, h: 0.15, blur: 1 });
}

// ---- a whole banner: field, stripes, the crest; albedo / metal-rough / height canvases, cached per house
const BANNER_MAPS = {};
function bannerMaps(house, w, h) {
  const key = house.id + w + 'x' + h; if (BANNER_MAPS[key]) return BANNER_MAPS[key];
  const S = embossStack(w, h), P = CREST_PAL[house.id] || { field: '#2e2214', metal: '#c49a48' }, r = rng('weave' + house.id);
  const foot = h - w * 0.42;   // the swallowtail: the notch's apex
  const outline = (g, inset = 0) => { const k = inset; g.beginPath(); g.moveTo(k, 0); g.lineTo(w - k, 0); g.lineTo(w - k, h - k * 1.2); g.lineTo(w / 2, foot - k * 1.6); g.lineTo(k, h - k * 1.2); g.closePath(); };
  // the wool field: a vertical shade, the weave, a faint damask of the house colour
  const F = _hex(lin(P.field)), mask = S.mc.getContext('2d'); mask.setTransform(1, 0, 0, 1, 0, 0); mask.clearRect(0, 0, w, h); mask.fillStyle = '#fff'; outline(mask); mask.fill();
  const md = mask.getImageData(0, 0, w, h).data;
  for (let y = 0; y < h; y++) {
    const vy = 1.05 - 0.22 * (y / h);
    for (let x = 0; x < w; x++) {
      const i = y * w + x; if (md[i * 4 + 3] === 0) continue;
      const wv = 0.94 + 0.05 * ((x % 3 === 0) ? 1 : 0) + 0.04 * ((y % 3 === 1) ? 1 : 0) + (r() - 0.5) * 0.05;
      const u = (x / w) * 7, v = (y / w) * 4.5, du = Math.abs((u + v) % 1 - 0.5), dv = Math.abs((u - v + 100) % 1 - 0.5), dam = Math.min(du, dv) < 0.018 ? 0.95 : 1;
      const edge = 1 - 0.18 * Math.pow(1 - Math.min(1, Math.min(x, w - x) / (w * 0.12)), 2);
      const s = vy * wv * dam * edge;
      S.r[i] = F[0] * s; S.g[i] = F[1] * s; S.b[i] = F[2] * s; S.a[i] = md[i * 4 + 3] / 255; S.h[i] = 0.08 * (wv - 0.94) + (dam < 1 ? 0.03 : 0);
    }
  }
  // the hem at the top (the rod sleeve) and the two inset stripes down the sides and round the tail
  const metal = { col: lin(P.metal), metal: true, rough: 0.34, h: 0.8, blur: 3 };
  embossPart(S, (g) => { g.fillRect(0, 0, w, w * 0.07); }, { col: lin(P.field), metal: false, rough: 0.9, h: 0.5, blur: 4 });
  embossPart(S, (g) => { g.fillRect(0, w * 0.07, w, w * 0.012); }, metal);
  for (const [k, lw] of [[w * 0.05, w * 0.03], [w * 0.1, w * 0.012]]) embossPart(S, (g) => { g.beginPath(); g.moveTo(k, w * 0.09); g.lineTo(k, h - k * 1.2); g.lineTo(w / 2, foot - k * 1.6); g.lineTo(w - k, h - k * 1.2); g.lineTo(w - k, w * 0.09); g.lineWidth = lw; g.lineJoin = 'miter'; g.stroke(); }, metal);
  { const cw = Math.round(w * 0.8), C = embossStack(cw, Math.round(cw * 1.2));   // the crest in its own (smaller) stack
    if (CREST_PAL[house.id]) drawCrestParts(C, house, 0, 0, cw); else drawSchoolCrestPart(C, cw);
    mergeStack(S, C, Math.round(w * 0.1), Math.round(w * 0.2)); }
  satin(S, Math.max(3, w / 220));
  return (BANNER_MAPS[key] = stackCanvases(S));
}
// the school's banner either side of the great window: the quartered crest (16-paint.js), the motto under it
function drawSchoolCrestPart(S, w) {
  const c = makeCanvas(w, Math.round(w * 1.1)); drawCrest(c.getContext('2d'), w * 0.04, w * 0.02, w * 0.92, w * 1.0, 'colour');
  embossPart(S, (g) => { g.drawImage(c, 0, 0); }, { metal: false, rough: 0.5, h: 0.8, blur: 3, img: true });
  embossPart(S, (g) => { g.font = `italic ${Math.round(w * 0.055)}px "Times New Roman", serif`; g.textAlign = 'center'; g.fillText('DRACO DORMIENS', w / 2, w * 1.1); g.fillText('NUNQUAM TITILLANDUS', w / 2, w * 1.17); }, { col: lin('#c49a48'), metal: true, rough: 0.4, h: 0.5, blur: 1 });
}
// lay one stack over another at (ox, oy), by the upper one's alpha; its heights sit on the lower one's
function mergeStack(S, C, ox, oy) {
  for (let y = 0; y < C.H; y++) for (let x = 0; x < C.W; x++) {
    const j = y * C.W + x, al = C.a[j]; if (al <= 0) continue;
    const X = x + ox, Y = y + oy; if (X < 0 || Y < 0 || X >= S.W || Y >= S.H) continue;
    const i = Y * S.W + X;
    S.r[i] = lerp(S.r[i], C.r[j], al); S.g[i] = lerp(S.g[i], C.g[j], al); S.b[i] = lerp(S.b[i], C.b[j], al);
    S.m[i] = lerp(S.m[i], C.m[j], al); S.ro[i] = lerp(S.ro[i], C.ro[j], al); S.h[i] += C.h[j] * al;
  }
}
