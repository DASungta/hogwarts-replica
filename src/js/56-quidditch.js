// ------------------------------------------------------------------ Quidditch pitch (Half-Blood Prince on: by the loch, below Hagrid's hut)
// An oval field ringed by tall timber spectator towers hung with house-coloured cloth, tiered stands between them,
// three gold hoops at each end. Laid out in pitch coordinates: u along the long axis, v across.
M.gold = procMat({ name: 'gold', rgb: [1.0, 0.72, 0.3], metal: 1, rough: 0.32, frag: /* glsl */ `
  float n = cgFbm3(P * 3.0); diffuseColor.rgb *= 0.85 + 0.25 * n; cgRough = 0.25 + 0.2 * n;
` });
M.pitchgrass = procMat({ name: 'pitchgrass', rgb: [1, 1, 1], rough: 0.9, uv: true, uniforms: { uAB: { value: new THREE.Vector2(PITCH.a, PITCH.b) } },
  head: 'uniform vec2 uAB;\n', frag: /* glsl */ `
  vec2 q = UV;
  float px = length(fwidth(q));
  float stripe = smoothstep(0.45, 0.55, abs(fract(q.x / 9.0) - 0.5) * 2.0);
  vec3 g = mix(vec3(0.045, 0.07, 0.022), vec3(0.06, 0.088, 0.028), stripe) * (0.88 + 0.24 * cgFbm3(P * 0.08));
  float lw = max(0.16, px * 0.7);
  float e = length(q / uAB);
  float line = 1.0 - smoothstep(lw * 0.5, lw, abs(e - 0.975) * uAB.y);
  line = max(line, 1.0 - smoothstep(lw * 0.5, lw, abs(length(q) - 4.5)));
  line *= 0.8 + 0.2 * cgVn(P * 2.0);   // chalk, not paint
  float worn = 0.0;
  for (int k = -1; k <= 1; k += 2) worn = max(worn, 1.0 - smoothstep(4.0, 14.0, length((q - vec2(float(k) * (uAB.x - 6.0), 0.0)) * vec2(1.0, 0.7))));
  g = mix(g, vec3(0.075, 0.072, 0.04) * (0.85 + 0.3 * cgVn(P * 1.3)), worn * smoothstep(0.35, 0.7, cgFbm3(P * 0.35)) * 0.7);
  diffuseColor.rgb *= mix(g, vec3(0.62, 0.62, 0.56), line * 0.8);
  cgSpec = 0.25;
` });
function clothMat(name, base, trim) {
  return procMat({ name, rgb: [1, 1, 1], rough: 0.85, uv: true, bump: 1, side: THREE.DoubleSide, frag: /* glsl */ `
    float f = fract(UV.x / 4.6);
    float tr = step(f, 0.04) * 0.0;
    float hem = smoothstep(0.88, 0.92, fract(UV.y / 4.2)) * 0.8;   // a trim band near the top of each cloth
    vec3 c = mix(vec3(${base.join(', ')}), vec3(${trim.join(', ')}), max(tr, hem));
    diffuseColor.rgb *= c * (0.85 + 0.25 * cgFbm3(P * 0.4));
    cgH = sin(UV.x * 7.0) * 0.04;
    cgSpec = 0.3;
  ` });
}
const HOUSES = [ // Gryffindor, Slytherin, Ravenclaw, Hufflepuff: cloth and trim (linear)
  ['clothR', [0.3, 0.018, 0.016], [0.62, 0.4, 0.07]],
  ['clothG', [0.012, 0.1, 0.04], [0.5, 0.5, 0.48]],
  ['clothB', [0.014, 0.04, 0.2], [0.42, 0.24, 0.08]],
  ['clothY', [0.6, 0.4, 0.03], [0.02, 0.02, 0.02]],
];
for (const [k, b, t] of HOUSES) M[k] = clothMat(k, b, t);

// heraldic cloth on the towers (ref/grounds q11): an atlas of 4 houses (rows) x 4 designs (columns) - bendy stripes,
// quarters with ermine-like arrow spots, chevrons, lozenges - painted with a darker hem, folds and weathering
const CLOTH_HOUSES = [['#7c1210', '#c99a34'], ['#0f4824', '#b9bdbb'], ['#1b2d68', '#c8b48a'], ['#c99b1c', '#1c160a']];   // Gryffindor, Slytherin, Ravenclaw, Hufflepuff
let CLOTH_TEX = null;
function clothAtlas() {
  if (CLOTH_TEX) return CLOTH_TEX;
  CLOTH_TEX = canvasTex(1024, 1024, (g) => {
    const C = 256;
    for (let h = 0; h < 4; h++) for (let d = 0; d < 4; d++) {
      const [a, b] = CLOTH_HOUSES[h], x0 = d * C, y0 = h * C, R = rng('cloth' + h + d);
      g.save(); g.translate(x0, y0); g.beginPath(); g.rect(0, 0, C, C); g.clip();
      g.fillStyle = a; g.fillRect(0, 0, C, C);
      g.fillStyle = b;
      if (d === 0) { g.save(); g.translate(C / 2, C / 2); g.rotate(-Math.PI / 4); for (let k = -8; k < 8; k += 2) g.fillRect(k * 26, -C, 26, C * 2); g.restore(); }
      else if (d === 1) {
        g.fillRect(0, 0, C / 2, C / 2); g.fillRect(C / 2, C / 2, C / 2, C / 2);
        for (const [qx, qy, col] of [[0, 0, a], [C / 2, C / 2, a], [C / 2, 0, b], [0, C / 2, b]]) {   // arrow spots on each quarter, in the other colour
          g.fillStyle = col;
          for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
            const sx = qx + 22 + i * 40 + (j % 2) * 20, sy = qy + 24 + j * 40;
            g.beginPath(); g.moveTo(sx, sy - 12); g.lineTo(sx + 7, sy + 6); g.lineTo(sx, sy + 2); g.lineTo(sx - 7, sy + 6); g.closePath(); g.fill();
            g.fillRect(sx - 1.5, sy + 2, 3, 10);
          }
        }
      } else if (d === 2) { for (let k = -1; k < 7; k++) { const y = k * 40; g.beginPath(); g.moveTo(0, y + 40); g.lineTo(C / 2, y); g.lineTo(C, y + 40); g.lineTo(C, y + 60); g.lineTo(C / 2, y + 20); g.lineTo(0, y + 60); g.closePath(); g.fill(); } }
      else { for (let i = -1; i < 5; i++) for (let j = -1; j < 5; j++) if ((i + j) % 2 === 0) { const cx = i * 64 + 32, cy = j * 64 + 32; g.beginPath(); g.moveTo(cx, cy - 32); g.lineTo(cx + 32, cy); g.lineTo(cx, cy + 32); g.lineTo(cx - 32, cy); g.closePath(); g.fill(); } }
      // hem bands top and bottom, vertical folds, weathering
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, 0, C, 10); g.fillRect(0, C - 10, C, 10);
      g.fillStyle = b; g.globalAlpha = 0.7; g.fillRect(0, 12, C, 4); g.fillRect(0, C - 16, C, 4); g.globalAlpha = 1;
      for (let k = 0; k < 7; k++) { const fx = R() * C, gr = g.createLinearGradient(fx - 18, 0, fx + 18, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(0,0,0,0.16)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(fx - 18, 0, 36, C); }
      for (let k = 0; k < 500; k++) { g.fillStyle = `rgba(${R() < 0.5 ? '255,250,230' : '20,15,10'},${0.04 + R() * 0.05})`; g.fillRect(R() * C, R() * C, 1 + R() * 3, 1 + R() * 3); }
      g.restore();
    }
  });
  CLOTH_TEX.generateMipmaps = true; CLOTH_TEX.minFilter = THREE.LinearMipmapLinearFilter; CLOTH_TEX.anisotropy = 4;
  return CLOTH_TEX;
}
M.towerCloth = procMat({ name: 'towerCloth', rgb: [0.85, 0.85, 0.85], rough: 0.92, side: THREE.DoubleSide, std: { map: clothAtlas() }, frag: /* glsl */ `
  diffuseColor.rgb *= 0.85 + 0.25 * cgFbm3(P * 0.35); cgSpec = 0.25;
` });
// collects cloth quads: a panel from corner c with edge vectors ex (across) and ey (down), bellied out along n,
// mapped onto atlas cell (house h, design d)
const CLOTH = { pos: [], uv: [], idx: [] };
function clothPanel(c, ex, ey, n, belly, h, d, nx = 6, ny = 8) {
  const base = CLOTH.pos.length / 3;
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const u = i / nx, v = j / ny, b = belly * Math.sin(Math.PI * u) * (0.4 + 0.6 * v);
    CLOTH.pos.push(c[0] + ex[0] * u + ey[0] * v + n[0] * b, c[1] + ex[1] * u + ey[1] * v + n[1] * b, c[2] + ex[2] * u + ey[2] * v + n[2] * b);
    CLOTH.uv.push((d + 0.02 + 0.96 * u) / 4, 1 - (h + 0.02 + 0.96 * v) / 4);
  }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const k = base + j * (nx + 1) + i; CLOTH.idx.push(k, k + nx + 1, k + 1, k + 1, k + nx + 1, k + nx + 2); }
}
function clothTri(a, b, c, h, d) {
  const base = CLOTH.pos.length / 3;
  CLOTH.pos.push(...a, ...b, ...c); CLOTH.uv.push((d + 0.02) / 4, 1 - (h + 0.98) / 4, (d + 0.98) / 4, 1 - (h + 0.98) / 4, (d + 0.5) / 4, 1 - (h + 0.04) / 4);
  CLOTH.idx.push(base, base + 1, base + 2);
}
function flushCloth() {
  if (!CLOTH.idx.length) return;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(CLOTH.pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(CLOTH.uv, 2));
  g.setIndex(CLOTH.idx); g.computeVertexNormals();
  addMesh(g, M.towerCloth);
  CLOTH.pos = []; CLOTH.uv = []; CLOTH.idx = [];
}
// one spectator tower (q09, q11): an open timber lattice of posts, girts and cross braces; a cloth skirt hung under the
// viewing box; the box with a waist-high cloth front, an open band, a pyramid cloth roof on a ring beam; a pole and
// a long pennant at the apex. Local frame: +z toward the pitch.
function quidditchTower(x, z, gy, ry, H, house, R) {
  const hw = 1.9, deck = H - 9, cs = Math.cos(ry), sn = Math.sin(ry);
  const T = (u, y, v) => [x + u * cs + v * sn, y, z - u * sn + v * cs];
  const post = (a, b, t) => beam(a, b, t, 'wood');
  for (const su of [-1, 1]) for (const sv of [-1, 1]) post(T(su * hw, gy - 1, sv * hw), T(su * hw * 0.92, gy + deck, sv * hw * 0.92), 0.34);
  const lv = Math.max(3, Math.round(deck / 3.4)), lerpW = (y) => hw * (1 - 0.08 * (y - gy) / deck);
  for (let k = 0; k <= lv; k++) {
    const y = gy + (deck * k) / lv, w = lerpW(y);
    for (const [ua, va, ub, vb] of [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]]) post(T(ua * w, y, va * w), T(ub * w, y, vb * w), 0.2);
    if (k === lv) break;
    const y1 = gy + (deck * (k + 1)) / lv, w1 = lerpW(y1);
    for (const [ua, va, ub, vb] of [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]]) {
      post(T(ua * w, y, va * w), T(ub * w1, y1, vb * w1), 0.12);
      post(T(ub * w, y, vb * w), T(ua * w1, y1, va * w1), 0.12);
    }
  }
  // a ladder up the back
  for (const su of [-0.35, 0.35]) post(T(su, gy, -hw - 0.3), T(su, gy + deck, -hw - 0.3), 0.07);
  for (let y = gy + 0.4; y < gy + deck; y += 0.45) post(T(-0.35, y, -hw - 0.3), T(0.35, y, -hw - 0.3), 0.05);
  // the box: floor, corner posts, ring beam
  const bw = hw + 0.55, top = gy + deck, ring = top + 3.6;
  put('wood', uvPlanar(new THREE.BoxGeometry(bw * 2 + 0.2, 0.3, bw * 2 + 0.2).rotateY(ry).translate(x, top - 0.15, z)));
  for (const su of [-1, 1]) for (const sv of [-1, 1]) post(T(su * bw, top, sv * bw), T(su * bw, ring, sv * bw), 0.2);
  for (const [ua, va, ub, vb] of [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]]) post(T(ua * bw, ring, va * bw), T(ub * bw, ring, vb * bw), 0.22);
  // cloth: the skirt under the box, the parapet round it, each face its own design
  const skirt = Math.min(deck * 0.42, 9 + R() * 3);
  const faces = [[-1, 1, 1, 1, [0, 0, 1]], [1, 1, 1, -1, [1, 0, 0]], [1, -1, -1, -1, [0, 0, -1]], [-1, -1, -1, 1, [-1, 0, 0]]];
  faces.forEach(([ua, va, ub, vb, nl], fi) => {
    const a = T(ua * (bw + 0.05), top + 1.25, va * (bw + 0.05)), b = T(ub * (bw + 0.05), top + 1.25, vb * (bw + 0.05));
    const n = [nl[0] * cs + nl[2] * sn, 0, -nl[0] * sn + nl[2] * cs];
    const ex = [b[0] - a[0], 0, b[2] - a[2]];
    const d1 = (fi + house) % 4, d2 = (fi + house + 1) % 4;
    clothPanel(a, ex, [0, -1.3, 0], n, 0.06, house, d1, 4, 2);
    const s0 = T(ua * (lerpW(top) + 0.08), top - 0.1, va * (lerpW(top) + 0.08)), s1 = T(ub * (lerpW(top) + 0.08), top - 0.1, vb * (lerpW(top) + 0.08));
    clothPanel(s0, [s1[0] - s0[0], 0, s1[2] - s0[2]], [n[0] * 0.15 * skirt / 9, -skirt, n[2] * 0.15 * skirt / 9], n, 0.25 + R() * 0.2, house, d2, 6, 8);
  });
  // the roof: a pyramid of cloth with an overhang, a pole and a pennant
  const apex = T(0, ring + 4.6 + R() * 2.2, 0), eave = bw + 0.7;
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => T(u * eave, ring - 0.3, v * eave));
  for (let i = 0; i < 4; i++) clothTri(corners[i], corners[(i + 1) % 4], apex, house, (i + house) % 4);
  beam(apex, [apex[0], apex[1] + 3.2, apex[2]], 0.09, 'wood');
  const pole = [apex[0], apex[1] + 3.1, apex[2]], pa = R() * 6.28, L = 4 + R() * 2.5;
  clothTri(pole, [pole[0], pole[1] - 0.9, pole[2]], [pole[0] + Math.cos(pa) * L, pole[1] - 0.8 - R() * 0.6, pole[2] + Math.sin(pa) * L], house, 0);
}

function buildQuidditch() {
  const { cx, cz, a, b, rot } = PITCH, Y = PITCH.y;
  const c = Math.cos(rot), s = Math.sin(rot);
  const W = (u, v) => [cx + u * c - v * s, cz + u * s + v * c]; // pitch -> world plan
  // the field
  const field = new THREE.CircleGeometry(1, 96);
  const fp = field.attributes.position, fuv = field.attributes.uv;
  for (let i = 0; i < fp.count; i++) {
    const u = fp.getX(i) * (a + 4), v = fp.getY(i) * (b + 4);
    fuv.setXY(i, u, v);
    const [x, z] = W(u, v); fp.setXYZ(i, x, Y + 0.08, z);
  }
  field.computeVertexNormals();
  const nf = field.attributes.normal; for (let i = 0; i < nf.count; i++) nf.setXYZ(i, 0, 1, 0);
  // CircleGeometry faces +z; after moving into the xz plane the winding must face up
  const ix = field.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; }
  put('pitchgrass', field);
  // spectator towers around the oval
  const R = rng('pitch');
  const NT = 22, towers = [];
  for (let i = 0; i < NT; i++) {
    const th = (i / NT) * Math.PI * 2 + 0.07;
    const u = Math.cos(th) * (a + 11), v = Math.sin(th) * (b + 11);
    const house = Math.floor((((th + Math.PI / 4) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / (Math.PI / 2));
    const end = Math.abs(Math.cos(th)) > 0.9;
    const H = (end ? 30 : 24) + R() * 6;
    towers.push({ u, v, th, house, H });
  }
  const timberBox = (x0, x1, y0, y1, z0, z1, ry, px, pz) => {
    const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    g.rotateY(ry).translate(px, 0, pz);
    return put('wood', uvPlanar(g));
  };
  for (const t of towers) {
    const [x, z] = W(t.u, t.v);
    quidditchTower(x, z, Y, -Math.atan2(Math.sin(rot + t.th), Math.cos(rot + t.th)) + Math.PI / 2, t.H, t.house, R);
  }
  // tiered stands between neighbouring towers along the long sides
  for (let i = 0; i < NT; i++) {
    const t0 = towers[i], t1 = towers[(i + 1) % NT];
    if (Math.abs(Math.cos(t0.th)) > 0.75 || Math.abs(Math.cos(t1.th)) > 0.75) continue;
    const [x0, z0] = W(t0.u, t0.v), [x1, z1] = W(t1.u, t1.v);
    const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, L = Math.hypot(x1 - x0, z1 - z0) - 6;
    const ang = -Math.atan2(z1 - z0, x1 - x0);
    const out = [mx - cx, mz - cz]; const ol = Math.hypot(...out); let ox = out[0] / ol, oz = out[1] / ol;
    const len = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / len, uz = (z1 - z0) / len;
    if (ox * -uz + oz * ux < 0) { ox = uz; oz = -ux; } else { ox = -uz; oz = ux; }   // outward, square to the stand
    const Pt = (al, o, y) => [mx + ux * al + ox * o, y, mz + uz * al + oz * o];
    const slab = (al0, al1, o0, o1, y0, y1) => {   // a plank or a board along the stand
      const sg = ox * -uz + oz * ux > 0 ? 1 : -1;
      put('wood', uvPlanar(new RoundedBoxGeometry(al1 - al0, y1 - y0, Math.abs(o1 - o0), 1, 0.02).translate((al0 + al1) / 2, (y0 + y1) / 2, sg * (o0 + o1) / 2).rotateY(ang).translate(mx, 0, mz)));
    };
    const NTIER = 5, rise = 1.15, run = 1.5, o0 = -2.8, nb = Math.max(2, Math.round(L / 2.6));
    const tread = (k) => Y + 0.7 + k * rise;
    for (let k = 0; k < NTIER; k++) {
      const o = o0 + k * run, y = tread(k);
      slab(-L / 2, L / 2, o, o + run, y - 0.06, y);   // the floor of the tier
      slab(-L / 2, L / 2, o + run - 0.55, o + run - 0.12, y + 0.42, y + 0.48);   // the bench
      slab(-L / 2, L / 2, o - 0.03, o + 0.03, y - 0.9, y);   // the riser board under the tier's front
      for (let j = 0; j <= nb; j++) {
        const al = -L / 2 + (L * j) / nb;
        beam(Pt(al, o + 0.1, Y - 0.5), Pt(al, o + 0.1, y - 0.06), 0.16, 'wood');   // a post under the front of the tier
        beam(Pt(al, o + run - 0.33, y), Pt(al, o + run - 0.33, y + 0.42), 0.08, 'wood');   // a bench leg
      }
    }
    const back = o0 + NTIER * run, yTop = tread(NTIER - 1);
    for (let j = 0; j <= nb; j++) {
      const al = -L / 2 + (L * j) / nb;
      beam(Pt(al, back - 0.05, Y - 0.5), Pt(al, back - 0.05, yTop + 1.1), 0.18, 'wood');   // the back posts, up to the rail
      beam(Pt(al, o0 + 0.1, Y + 0.2), Pt(al, back - 0.05, yTop - 0.1), 0.12, 'wood');   // a raking stringer under the tiers
      if (j < nb) {   // cross braces between the back posts
        const al1 = -L / 2 + (L * (j + 1)) / nb;
        beam(Pt(al, back - 0.08, Y), Pt(al1, back - 0.08, yTop - 0.4), 0.07, 'wood');
        beam(Pt(al1, back - 0.08, Y), Pt(al, back - 0.08, yTop - 0.4), 0.07, 'wood');
      }
    }
    slab(-L / 2, L / 2, back - 0.12, back + 0.02, yTop + 0.95, yTop + 1.1);   // the top rail
    slab(-L / 2, L / 2, back - 0.12, back + 0.02, yTop + 0.45, yTop + 0.55);
    const ex = [ux * L, 0, uz * L];
    for (let k = 0; k < NTIER; k++) {   // house cloth on the riser of each tier
      const p = Pt(-L / 2, o0 + k * run - 0.06, tread(k) - 0.02);
      clothPanel(p, ex, [0, -0.86, 0], [-ox, 0, -oz], 0.03, t0.house, (i + k) % 4, 10, 2);
    }
    { const p = Pt(-L / 2, back + 0.06, yTop + 1.05); clothPanel(p, ex, [0, -(yTop + 1.05 - Y) * 0.6, 0], [ox, 0, oz], 0.15, t0.house, (i + 2) % 4, 10, 4); }   // a long cloth down the back
  }
  // three hoops at each end
  for (const end of [-1, 1]) for (const [off, h] of [[-9, 15], [0, 19], [9, 15]]) {
    const [x, z] = W(end * (a - 6), off);
    put('gold', new THREE.CylinderGeometry(0.22, 0.32, h, 10).translate(x, Y + h / 2, z));
    const ring = new THREE.TorusGeometry(2.4, 0.2, 10, 40).rotateY(Math.PI / 2 - rot).translate(x, Y + h + 2.4, z);
    put('gold', ring);
  }
  flushCloth();
}
function pitchMetric(x, z, pad = 0) {
  const dx = x - PITCH.cx, dz = z - PITCH.cz, c = Math.cos(PITCH.rot), s = Math.sin(PITCH.rot);
  return Math.hypot((dx * c + dz * s) / (PITCH.a + pad), (-dx * s + dz * c) / (PITCH.b + pad));
}
