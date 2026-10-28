// ------------------------------------------------------------------ foliage cards: crowns made of painted leaf and needle sprays
// A crown is a cloud of small alpha-cut cards (each a painted spray of leaves or pine needles) filling the volume of a
// few clumps, denser toward the outside. Normals are bent outward from the crown centre so the whole crown shades like a
// soft volume (lit side, shadow side), and each card's vertex colour carries how deep it sits (occlusion) and a slight
// hue shift. The sprays are painted once on canvases (2 x 2 variants each).
function paintSprays(kind) {
  return canvasTex(512, 512, (g) => {
    g.clearRect(0, 0, 512, 512);
    for (let k = 0; k < 4; k++) {
      const r = rng(kind + k), ox = (k % 2) * 256, oy = Math.floor(k / 2) * 256;
      g.save(); g.translate(ox + 128, oy + 128); g.beginPath(); g.rect(-128, -128, 256, 256); g.clip();
      if (kind === 'leaf') {
        // a twig forking toward the top, leaves along it: oak-like, lobed, each lit on one side
        const twigs = [[0, 120, 0, -40]];
        for (let i = 0; i < 6; i++) { const t = 0.2 + r() * 0.7, y = 120 - t * 160, s = r() < 0.5 ? -1 : 1; twigs.push([0, y, s * (40 + r() * 60), y - 30 - r() * 60]); }
        g.strokeStyle = 'rgb(52,40,28)'; g.lineCap = 'round';
        for (const [x0, y0, x1, y1] of twigs) { g.lineWidth = 3; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
        const n = 70 + Math.floor(r() * 20);
        for (let i = 0; i < n; i++) {
          const tw = twigs[Math.floor(r() * twigs.length)], t = r();
          const x = lerp(tw[0], tw[2], t) + (r() - 0.5) * 30, y = lerp(tw[1], tw[3], t) + (r() - 0.5) * 30;
          if (Math.hypot(x, y) > 118) continue;
          const a = r() * Math.PI * 2, L = 16 + r() * 14, W = L * (0.42 + r() * 0.12);
          const base = [36 + r() * 30, 52 + r() * 34, 16 + r() * 16];
          g.save(); g.translate(x, y); g.rotate(a);
          g.beginPath(); g.moveTo(0, -L / 2);
          for (let s = 0; s <= 1; s++) { const sg = s ? -1 : 1; for (let j = 1; j <= 4; j++) { const v = -L / 2 + (j / 4) * L; g.quadraticCurveTo(sg * W * (0.75 + 0.25 * Math.sin(j * 1.7)), v - L / 8, sg * W * (0.35 + 0.1 * (j % 2)), v); } if (!s) g.lineTo(0, L / 2); }
          g.closePath();
          const gr = g.createLinearGradient(-W, 0, W, 0); gr.addColorStop(0, `rgb(${base[0] * 1.35 | 0},${base[1] * 1.3 | 0},${base[2] * 1.2 | 0})`); gr.addColorStop(1, `rgb(${base[0] * 0.7 | 0},${base[1] * 0.72 | 0},${base[2] * 0.7 | 0})`);
          g.fillStyle = gr; g.fill();
          g.strokeStyle = 'rgba(20,28,10,0.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -L / 2); g.lineTo(0, L / 2); g.stroke();
          g.restore();
        }
      } else {
        // Scots pine: tufts of paired needles at the ends of short shoots, blue-green
        const shoots = [];
        for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (r() - 0.5) * 2.4, L = 40 + r() * 60; shoots.push([Math.cos(a) * 20 * r(), 100 - r() * 40, Math.cos(a) * L, 100 - r() * 40 + Math.sin(a) * L]); }
        g.strokeStyle = 'rgb(70,48,30)'; g.lineCap = 'round';
        for (const [x0, y0, x1, y1] of shoots) { g.lineWidth = 4; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
        for (const [x0, y0, x1, y1] of shoots) {
          const dir = Math.atan2(y1 - y0, x1 - x0);
          for (let j = 0; j < 90; j++) {
            const t = 0.35 + 0.65 * Math.pow(r(), 0.6), x = lerp(x0, x1, t), y = lerp(y0, y1, t);
            const a = dir + (r() - 0.5) * 2.6, L = 16 + r() * 18;
            const c = [30 + r() * 26, 52 + r() * 30, 40 + r() * 22];
            g.strokeStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`; g.lineWidth = 1.6 + r();
            g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * L * 0.6, y + Math.sin(a) * L * 0.6 - 3, x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke();
          }
        }
      }
      g.restore();
    }
  });
}
const SPRAY = {};
function sprayTex(kind) {
  if (!SPRAY[kind]) { const t = paintSprays(kind); t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 4; SPRAY[kind] = t; }
  return SPRAY[kind];
}
// cards keep the bent normal on both faces (three flips the normal of back faces on double-sided materials)
function cardMat(name, kind, tint) {
  const m = procMat({ name, rgb: tint, rough: 0.75, vc: true, side: THREE.DoubleSide, std: { map: sprayTex(kind), alphaTest: 0.42 }, frag: /* glsl */ `
    float n = cgVn(P * 0.35);
    diffuseColor.rgb *= 0.85 + 0.3 * n;
    cgAO = 0.5 + 0.5 * vColor.g; cgSpec = 0.35;
  ` });
  const ob = m.onBeforeCompile;
  m.onBeforeCompile = (sh) => { ob(sh); sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\nnormal = normalize( vNormal );'); };
  return m;
}
M.leafCard = cardMat('leafCard', 'leaf', [0.62, 0.62, 0.5]);
M.needleCard = cardMat('needleCard', 'needle', [0.55, 0.6, 0.6]);
M.spruceCard = cardMat('spruceCard', 'needle', [0.3, 0.38, 0.36]);
// a crown of cards: clumps [[cx, cy, cz, rx, ry, rz, n], ...]; card size; the crown centre for the bent normals
function cardCrown(clumps, size, seed, centre = null) {
  const r = rng('crown' + seed), pos = [], nrm = [], uv = [], col = [], idx = [];
  if (!centre) { centre = [0, 0, 0]; for (const c of clumps) for (let k = 0; k < 3; k++) centre[k] += c[k] / clumps.length; }
  const v = new THREE.Vector3(), o = new THREE.Vector3(), t1 = new THREE.Vector3(), t2 = new THREE.Vector3(), cn = new THREE.Vector3(), sn = new THREE.Vector3();
  for (const [cx, cy, cz, rx, ry, rz, n] of clumps) {
    for (let i = 0; i < n; i++) {
      v.set(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1); if (v.lengthSq() > 1 || v.lengthSq() < 1e-4) { i--; continue; }
      v.normalize(); const rr = Math.pow(r(), 0.3);
      const p = [cx + v.x * rx * rr, cy + v.y * ry * rr, cz + v.z * rz * rr];
      o.set((p[0] - centre[0]) / rx, (p[1] - centre[1]) / ry * 0.8 + 0.25, (p[2] - centre[2]) / rz).normalize();   // outward, a little upward
      cn.set(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).normalize().multiplyScalar(0.9).addScaledVector(v, 0.6).normalize();
      t1.crossVectors(cn, Math.abs(cn.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)).normalize(); t2.crossVectors(cn, t1);
      const a = r() * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), s = size * (0.7 + 0.6 * r()) / 2;
      const ax = [t1.x * ca + t2.x * sa, t1.y * ca + t2.y * sa, t1.z * ca + t2.z * sa], ay = [t2.x * ca - t1.x * sa, t2.y * ca - t1.y * sa, t2.z * ca - t1.z * sa];
      sn.copy(cn).multiplyScalar(0.3).addScaledVector(o, 0.7).normalize();
      const k = Math.floor(r() * 4), u0 = (k % 2) * 0.5, v0 = Math.floor(k / 2) * 0.5;
      const ao = clamp(0.25 + 0.75 * Math.pow(rr, 1.5) + 0.2 * o.y, 0.15, 1), hue = r();
      const tint = [(1 + 0.14 * (hue - 0.5)) * ao, ao, (1 - 0.22 * (hue - 0.5)) * ao];
      const base = pos.length / 3;
      for (const [sx, sy, uu, vv] of [[-1, -1, 0, 0], [1, -1, 0.5, 0], [1, 1, 0.5, 0.5], [-1, 1, 0, 0.5]]) {
        pos.push(p[0] + (ax[0] * sx + ay[0] * sy) * s, p[1] + (ax[1] * sx + ay[1] * sy) * s, p[2] + (ax[2] * sx + ay[2] * sy) * s);
        nrm.push(sn.x, sn.y, sn.z); uv.push(u0 + uu, 1 - (v0 + vv)); col.push(tint[0], ao, tint[2]);
      }
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeBoundingSphere();
  return g;
}
