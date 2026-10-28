// ------------------------------------------------------------------ Hogsmeade Station on the south shore of the loch
// After Goathland (the first film's station): a stone station building with a timber canopy, a red iron footbridge,
// lamps; the Hogwarts Express (a GWR Hall 4-6-0 in red, maroon coaches) at the platform; a jetty with the boats
// that take the first-years across the loch to the castle.
M.paintRed = procMat({ name: 'paintRed', rgb: [0.3, 0.018, 0.016], rough: 0.32, frag: /* glsl */ `
  diffuseColor.rgb *= 0.9 + 0.15 * cgFbm3(P * 0.8); cgRough = 0.28 + 0.15 * cgVn(P * 3.0);
  // road grime thrown up from the rails, darker and duller toward the bottom; a little soot on the tops
  float hy = P.y - (${STN.y.toFixed(2)}) + 0.5 * cgFbm3(P * 1.3);
  float grime = (1.0 - smoothstep(0.5, 2.4, hy)) * 0.75 + smoothstep(0.6, 0.85, cgFbm3(vec3(P.x * 2.0, P.y * 6.0, P.z * 2.0))) * 0.25;
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.07, 0.035, 0.025), grime * 0.55);
  diffuseColor.rgb *= 1.0 - 0.25 * smoothstep(0.5, 1.0, N.y) * smoothstep(0.45, 0.8, cgFbm3(P * 3.0));
  cgRough = mix(cgRough, 0.7, grime * 0.6);
` });
M.paintBlack = procMat({ name: 'paintBlack', rgb: [0.018, 0.018, 0.02], rough: 0.4 });
M.brass = procMat({ name: 'brass', rgb: [0.75, 0.55, 0.22], metal: 1, rough: 0.3 });
M.steel = procMat({ name: 'steel', rgb: [0.35, 0.34, 0.33], metal: 1, rough: 0.35 });
M.ironRed = procMat({ name: 'ironRed', rgb: [0.34, 0.055, 0.035], rough: 0.45, frag: /* glsl */ `
  diffuseColor.rgb *= 0.85 + 0.25 * cgFbm3(P * 0.7);
` });
M.cream = procMat({ name: 'cream', rgb: [0.62, 0.56, 0.42], rough: 0.6 });
// the coach sides are M.coach in 61a-platform.js
M.ballast = procMat({ name: 'ballast', rgb: [1, 1, 1], rough: 0.95, bump: 1, frag: /* glsl */ `
  float n = cgVn(P * 9.0), m = cgFbm3(P * 0.5);
  diffuseColor.rgb *= mix(vec3(0.09, 0.085, 0.08), vec3(0.16, 0.15, 0.14), n) * (0.85 + 0.3 * m);
  cgH = n * 0.03;
` });
M.boatWood = procMat({ name: 'boatWood', rgb: [0.075, 0.038, 0.018], rough: 0.45, uv: true, frag: /* glsl */ `
  float g = cgVn(vec3(UV.x * 40.0, UV.y * 3.0, 1.0)) * 0.5 + cgVn(P * vec3(3.0, 18.0, 3.0)) * 0.5;
  diffuseColor.rgb *= 0.72 + 0.5 * g; cgRough = 0.38 + 0.25 * cgVn(P * 4.0);
` });
M.lamp = procMat({ name: 'lamp', rgb: [0.8, 0.75, 0.6], rough: 0.2, frag: /* glsl */ `
  cgEmit = vec3(1.0, 0.7, 0.35) * (0.4 + 9.0 * uLamp);
` });

// the station's level ground and the track bed run along the shore (used by groundH)
function trackBed(x, z, y) {
  if (z < STN.z - 70 || z > STN.z + 45 || x < -330 || x > 760) return y;
  const dz = Math.abs(z - STN.z), bed = STN.y - 0.65;
  const along = smooth(-330, -250, x) * (1 - smooth(680, 760, x));   // the line ends at a buffer stop and enters a cutting
  y = lerp(y, lerp(bed, y, smooth(7, 30, z < STN.z ? dz : Math.max(0, dz - 10))), along);   // two tracks and the south platform
  // the station yard north of the track, down to the bank above the jetty
  if (Math.abs(x) < 190) {
    const inYard = z > STN.z - 46 && z < STN.z + 4 ? 0 : Math.min(Math.abs(z - (STN.z - 46)), Math.abs(z - (STN.z + 4)));
    const d = Math.max(inYard, Math.abs(x) - 160);
    y = lerp(bed, y, smooth(0, 14, d));
  }
  return y;
}


// ---- the first-years' boats: small clinker-built rowing boats of dark varnished oak (4.2 m, beam 1.45 m), a fine
// pointed bow and a small transom, six strakes each lapped over the one below, tarred below the waterline; inside,
// steamed ribs, three thwarts, floorboards and a little foredeck; a gunwale, an inwale and a rubbing strake; an iron
// crook at the bow with the lantern hung from its hook. Local frame: bow toward +z, origin a little above the waterline.
M.boatHull = procMat({ name: 'boatHull', rgb: [1, 1, 1], rough: 0.4, uv: true, inst: true, side: THREE.DoubleSide, frag: /* glsl */ `
  float strake = floor(UV.y), fs = fract(UV.y), bseed = cgH21(vInst.xz * 0.37);
  float id = cgH21(vec2(strake, 3.7 + bseed * 9.0));
  float grain = cgVn(vec3(UV.x * 1.3, fs * 26.0, strake * 3.0 + bseed)) * 0.6 + cgVn(vec3(UV.x * 7.0, fs * 90.0, strake)) * 0.4;
  vec3 c = mix(vec3(0.038, 0.017, 0.008), vec3(0.075, 0.036, 0.016), id) * (0.72 + 0.5 * grain);   // dark varnished oak
  c *= mix(0.55, 1.0, smoothstep(0.0, 0.07, fs));   // the shadow of each land (where a plank laps the one below)
  c *= 1.0 - 0.25 * smoothstep(0.6, 0.85, cgFbm3(P * 2.5 + bseed * 7.0));   // worn, scuffed patches
  float wl = P.y - (${(LAKE_Y + 0.05).toFixed(2)});
  float tar = 1.0 - smoothstep(-0.02, 0.025, wl), wet = smoothstep(0.16, 0.0, wl) * (1.0 - tar);
  c = mix(c, vec3(0.012, 0.011, 0.01), tar); c *= 1.0 - 0.35 * wet;
  float rough = mix(0.36, 0.14, max(tar, wet));
  if (!gl_FrontFacing) {   // the inside: paler, dry, unvarnished
    c = mix(vec3(0.075, 0.042, 0.022), vec3(0.11, 0.065, 0.034), id) * (0.72 + 0.5 * grain) * mix(0.7, 1.0, smoothstep(0.0, 0.1, 1.0 - fs));
    rough = 0.75;
  }
  diffuseColor.rgb = c; cgRough = rough;
` });
function boatGeo() {
  const L = 4.2, zS = -1.95, N = 6, nu = 56, nv = N * 8;
  const Z = (u) => zS + u * L;
  const half = (u) => (u < 0.45 ? 0.42 + 0.3 * Math.sin((u / 0.45) * Math.PI / 2) : 0.72 * Math.pow(Math.max(0, 1 - ((u - 0.45) / 0.55) ** 2), 0.62));
  const keel = (u) => -0.42 + 0.34 * Math.pow(smooth(0.68, 1.0, u), 1.4) + 0.12 * (1 - u) ** 3;
  const sheer = (u) => 0.16 + 0.26 * Math.pow(smooth(0.55, 1.0, u), 1.5) + 0.09 * (1 - u) ** 2;
  // a section point at (u, v): v = 0 keel, 1 sheer; round bilge, flaring sides, sharper toward the bow
  const sec = (u, v) => {
    const f = v * Math.PI / 2, e = lerp(0.75, 1.15, smooth(0.6, 1.0, u));
    return [half(u) * Math.pow(Math.sin(f), e), keel(u) + (sheer(u) - keel(u)) * (1 - Math.pow(Math.cos(f), 0.95))];
  };
  const pos = [], uvs = [], idx = [];
  for (const side of [1, -1]) {
    const base = pos.length / 3;
    for (let i = 0; i <= nu; i++) {
      const u = i / nu;
      for (let j = 0; j <= nv; j++) {
        const v = j / nv, [x, y] = sec(u, v), [x2, y2] = sec(u, Math.min(1, v + 0.01)), tx = x2 - x, ty = y2 - y, tl = Math.hypot(tx, ty) || 1;
        // clinker: each strake stands proud at its lower edge and lies back toward the next land
        const lap = j === nv ? 0 : 0.013 * (1 - ((v * N) % 1)) * (1 - 0.5 * smooth(0.85, 1.0, u));
        pos.push(side * (x + (ty / tl) * lap), y - (tx / tl) * lap, Z(u));
        uvs.push(u * L, v * N);
      }
    }
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      const a = base + i * (nv + 1) + j, b = a + nv + 1;
      if (side > 0) idx.push(a, a + 1, b, b, a + 1, b + 1); else idx.push(a, b, a + 1, b, b + 1, a + 1);   // outward-facing
    }
  }
  const hull = new THREE.BufferGeometry();
  hull.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); hull.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); hull.setIndex(idx);
  hull.computeVertexNormals();
  // the transom closing the stern
  const tp = []; for (let j = 0; j <= 16; j++) { const [x, y] = sec(0, j / 16); tp.push([x, y]); }
  const ts = pathPts(new THREE.Shape(), [...tp.slice().reverse().map(([x, y]) => [-x, y]), ...tp.slice(1)]);
  const transom = new THREE.ShapeGeometry(ts).translate(0, 0, Z(0) + 0.005);
  { const uv = transom.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), uv.getY(i) * 6 + 1); }
  // trim: stem, keel, gunwales, inwales, rubbing strakes, the transom's frame, ribs, thwarts, floorboards, the foredeck
  const trim = [], T = (pts, r, seg = 40, rad = 6) => trim.push(tube(pts, r, seg, rad));
  const line = (f, n = 40) => { const p = []; for (let i = 0; i <= n; i++) { const u = i / n; p.push(f(u)); } return p; };
  T(line((u) => [0, keel(u) - 0.02, Z(u)]), 0.03);
  T([[0, keel(0.86) - 0.02, Z(0.86)], [0, keel(0.95), Z(0.95) + 0.02], [0, (keel(1) + sheer(1)) / 2, Z(1) + 0.04], [0, sheer(1) + 0.08, Z(1) + 0.06]], 0.035, 20);
  for (const s of [1, -1]) {
    T(line((u) => [s * (half(u) + 0.012), sheer(u) + 0.014, Z(u)]), 0.026);
    T(line((u) => [s * (half(u) + 0.02), sheer(u) - 0.075, Z(u)]).slice(0, 39), 0.016);
    T(line((u) => [s * Math.max(0, half(u) - 0.045), sheer(u) - 0.012, Z(u)]).slice(2, 38), 0.018);
    for (let k = 1; k <= 13; k++) {
      const u = 0.04 + k * 0.066, p = [];
      for (let j = 1; j <= 12; j++) { const v = j / 12.5, [x, y] = sec(u, v); p.push([s * (x - 0.03), y + 0.02, Z(u)]); }
      T(p, 0.013, 16, 5);
    }
  }
  T(line((u) => { const a = u * Math.PI; return [Math.cos(a) * half(0), lerp(sheer(0), keel(0) + 0.05, Math.sin(a)), Z(0) + 0.02]; }, 24), 0.024, 24);   // the transom's frame
  for (const [u, w] of [[0.24, 0.22], [0.47, 0.22], [0.7, 0.2]]) {
    const y = sheer(u) - 0.2, hw = half(u) - 0.05;
    trim.push(new RoundedBoxGeometry(hw * 2, 0.035, w, 2, 0.01).translate(0, y, Z(u)));
    for (const s of [1, -1]) trim.push(new THREE.BoxGeometry(0.04, 0.16, 0.05).translate(s * (hw - 0.02), y + 0.1, Z(u)));
  }
  trim.push(new RoundedBoxGeometry(half(0.04) * 2 - 0.08, 0.035, 0.32, 2, 0.01).translate(0, sheer(0.04) - 0.2, Z(0.06)));
  for (const x of [-0.2, 0, 0.2]) trim.push(new RoundedBoxGeometry(0.13, 0.02, Z(0.7) - Z(0.16), 1, 0.006).translate(x, -0.36, (Z(0.16) + Z(0.7)) / 2));
  { const sh = new THREE.Shape(); sh.moveTo(-half(0.86) + 0.03, Z(0.86)); sh.lineTo(half(0.86) - 0.03, Z(0.86)); sh.lineTo(0, Z(0.99)); sh.closePath();
    trim.push(new THREE.ExtrudeGeometry(sh, { depth: 0.025, bevelEnabled: false }).rotateX(Math.PI / 2).translate(0, sheer(0.92) - 0.01, 0)); }
  // the iron crook, its foot on the foredeck, the hook out over the water; the lantern hangs at `hang`
  const zc = Z(0.9), yc = sheer(0.9);
  const iron = [tube([[0, yc, zc], [0, yc + 0.6, zc + 0.02], [0, 1.4, zc + 0.05], [0, 1.66, zc + 0.12], [0, 1.82, zc + 0.3], [0, 1.84, zc + 0.48], [0, 1.78, zc + 0.56], [0, 1.73, zc + 0.55]], 0.02, 48, 8)];
  iron.push(new THREE.CylinderGeometry(0.05, 0.06, 0.05, 12).translate(0, yc + 0.02, zc));
  iron.push(new THREE.TorusGeometry(0.03, 0.008, 6, 12).rotateY(Math.PI / 2).translate(0, 1.7, zc + 0.55));
  const hang = [0, 1.68, zc + 0.55];
  const LG = lanternGeo(1.15), drop = 0.26 * 1.15 + 0.14 * 1.15;   // hang the lantern by its ring
  return { hull: merge([hull, transom]), trim: merge(trim), iron: merge(iron), frame: LG.frame.translate(0, -drop, 0), glass: LG.glass.translate(0, -drop, 0), flame: LG.flame.translate(0, -drop, 0), hang, light: [0, 1.68 - drop * 0.55, zc + 0.55] };
}
// the lantern's matrix on a boat: from the boat's matrix, swung a little about the hook
function boatLanternMatrix(m, B, sx = 0, sz = 0) { return m.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3(...B.hang), new THREE.Quaternion().setFromEuler(new THREE.Euler(sx, 0, sz)), new THREE.Vector3(1, 1, 1))); }

// a small square lantern: tray, corner posts, pyramid cap and ring, four panes, a flame (s = 1: 26 cm tall)
function lanternGeo(s = 1) {
  const hb = 0.085 * s, H = 0.26 * s, fr = [new THREE.BoxGeometry(hb * 2.5, 0.025 * s, hb * 2.5).translate(0, 0.012 * s, 0)];
  for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) fr.push(new THREE.CylinderGeometry(0.007 * s, 0.007 * s, H, 5).translate(a * hb, H / 2, b * hb));
  fr.push(new THREE.BoxGeometry(hb * 2.3, 0.018 * s, hb * 2.3).translate(0, H, 0));
  fr.push(new THREE.ConeGeometry(hb * 1.55, 0.085 * s, 4).rotateY(Math.PI / 4).translate(0, H + 0.05 * s, 0));
  fr.push(new THREE.CylinderGeometry(0.016 * s, 0.02 * s, 0.03 * s, 8).translate(0, H + 0.1 * s, 0));
  fr.push(new THREE.TorusGeometry(0.03 * s, 0.005 * s, 5, 12).translate(0, H + 0.14 * s, 0));
  const glass = new THREE.BoxGeometry(hb * 1.96, H * 0.9, hb * 1.96).translate(0, H * 0.5, 0);
  const flame = new THREE.SphereGeometry(0.016 * s, 8, 6).scale(1, 1.9, 1).translate(0, H * 0.4, 0);
  return { frame: merge(fr), glass, flame };
}
let JETTY_BOATS = [];
function buildJetty(look) {
  const jx = -130, z0 = STN.z - 40, z1 = southZ(jx) - 46;
  const deckY = LAKE_Y + 1.2;
  // steps down the bank, then a timber jetty on piles out into the loch
  stairFlight([jx, STN.y - 0.65, z0], [jx, deckY, z0 - 14], 2.6, 10);
  for (let z = z0 - 14; z > z1; z -= 2.4) {
    wallBox(jx - 1.6, jx + 1.6, deckY - 0.2, deckY, z - 1.2, z + 1.2, 'timber', 0.02);
    for (const s of [-1, 1]) beam([jx + s * 1.5, LAKE_Y - 3, z], [jx + s * 1.5, deckY + 1.1, z], 0.22);
  }
  const JL = lanternGeo(1.6);
  for (const s of [-1, 1]) for (let z = z0 - 16; z > z1; z -= 7) {
    const x = jx + s * 1.5;
    beam([x, deckY + 1.1, z], [x, deckY + 2.6, z], 0.12, 'paintBlack');
    beam([x, deckY + 2.55, z], [x - s * 0.35, deckY + 2.55, z], 0.05, 'paintBlack');
    put('paintBlack', JL.frame.clone().translate(x - s * 0.35, deckY + 2.12, z)); put('lanternGlass', JL.glass.clone().translate(x - s * 0.35, deckY + 2.12, z)); put('mantle', JL.flame.clone().translate(x - s * 0.35, deckY + 2.12, z));
    LAMPS.push({ p: [x - s * 0.35, deckY + 2.32, z], c: [1.0, 0.6, 0.28].map((v) => v * 6), r: 9, halo: 0.8, hk: 0.4 });
  }
  const B = boatGeo(), W = [], L = [], R = rng('boats');
  for (let i = 0; i < 10; i++) {
    const s = i % 2 ? 1 : -1, z = z0 - 20 - Math.floor(i / 2) * 6, x = jx + s * (3.6 + R() * 0.6);
    const m = xf([x, LAKE_Y + 0.12, z], (R() - 0.5) * 0.3 + (s > 0 ? 0.1 : -0.1), 1);
    W.push(m); L.push(boatLanternMatrix(m, B));
  }
  JETTY_BOATS = [addInst(B.hull, M.boatHull, W), addInst(B.trim, M.boatWood, W), addInst(B.iron, M.paintBlack, W),
    addInst(B.frame, M.paintBlack, L, null, { cast: false }), addInst(B.glass, M.lanternGlass, L, null, { cast: false }), addInst(B.flame, M.mantle, L, null, { cast: false })];
  for (const m of W) { const v = new THREE.Vector3(...B.light).applyMatrix4(m); LAMPS.push({ p: [v.x, v.y, v.z], c: [1.0, 0.6, 0.28].map((c) => c * 2.5), r: 6, halo: 0.45, hk: 0.3, on: () => JETTY_BOATS[0].visible }); }
  void look;
}

