// ------------------------------------------------------------------ the Hogwarts Express close up: 5972 'Hogwarts Castle' (GWR 4900 'Hall' 4-6-0)
// and its BR Mk1 coaches. ref/station s00 (the engine at York, front three-quarter), s01 (head on, the headboard),
// s06 (side), s02/s03 (the Mk1s). The engine: a red buffer beam with round-headed buffers, lamp irons and two white
// lamps, a black smokebox with a domed door (hinge straps, dart, handrail, number plate), a tapered red boiler with
// black bands and handrails on knobs, the top feed, a tall brass safety-valve bonnet, a Belpaire firebox, a cab with
// spectacle windows and side windows, curved splashers with brass beading and the HOGWARTS CASTLE nameplate, two
// outside cylinders, slide bars, crossheads, connecting and coupling rods, red spoked wheels with balance weights,
// a Collett tender with outside frames, axleboxes and springs. The coaches: maroon Mk1s with rounded aluminium window
// frames, compartments seen through the glass (seat backs, racks, the corridor beyond), droplight doors, handles and
// grab rails, BR1 bogies with coil springs.
// Moving parts go into their own groups inside TRAIN (EXPRESS): the tour turns every axle by distance / radius and
// drives the rods from the crank angle of the drivers.
const EXPRESS = { axles: [], sides: [], drv: 0.915 };
const V2 = (pts) => pts.map(([r, h]) => new THREE.Vector2(r, h));
const lathe = (pts, n = 32) => new THREE.LatheGeometry(V2(pts), n);
function axleGroup(x, yc, z, r, build) {
  const pivot = new THREE.Group(), inner = new THREE.Group();
  pivot.position.set(x, yc, z); inner.position.set(-x, -yc, -z); pivot.add(inner); (TARGET || scene).add(pivot);
  inGroup(inner, build);
  EXPRESS.axles.push({ g: pivot, r });
}
function movingGroup(build) { const g = new THREE.Group(); (TARGET || scene).add(g); inGroup(g, build); return g; }
const tube = (pts, r, seg = 24, rad = 8) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), seg, r, rad, false);

// the track: bullhead rails in chairs on timber sleepers, ballast shoulders
M.sleeper = procMat({ name: 'sleeper', rgb: [1, 1, 1], rough: 0.9, bump: 1, inst: true, frag: /* glsl */ `
  float id = cgH21(vInst.xz);
  float g = cgVn(vec3(P.x * 1.5, P.y * 40.0, P.z * 40.0)) * 0.6 + cgVn(vec3(P.x * 4.0, P.y * 90.0, P.z * 3.0)) * 0.4;
  vec3 c = mix(vec3(0.07, 0.055, 0.04), vec3(0.13, 0.1, 0.075), id) * (0.75 + 0.5 * g);
  c = mix(c, vec3(0.17, 0.16, 0.14), smoothstep(0.6, 0.8, cgFbm3(P * 3.0)) * 0.5);   // dust off the ballast
  diffuseColor.rgb = c; cgH = g * 0.004;
` });
M.railSteel = procMat({ name: 'railSteel', rgb: [1, 1, 1], metal: 0.6, rough: 0.5, frag: /* glsl */ `
  float top = smoothstep(0.7, 0.95, N.y);   // the polished running surface
  vec3 rust = vec3(0.16, 0.08, 0.045) * (0.8 + 0.4 * cgFbm3(P * 4.0));
  diffuseColor.rgb = mix(rust, vec3(0.55, 0.55, 0.56), top);
  cgMetal = mix(0.2, 1.0, top); cgRough = mix(0.75, 0.22, top);
` });
function railTrack(xa, xb, zc) {
  const y = STN.y;
  wallBox(xa, xb, y - 1.6, y - 0.5, zc - 2.2, zc + 2.2, 'ballast', 0.2);
  for (const s of [-1, 1]) {   // ballast shoulders sloping off the bed
    const sh = pathPts(new THREE.Shape(), [[0, 0], [0.9, 0], [0.9, 0.06], [0.3, 0.14], [0, 0.14]].map(([a, b]) => [a, b]));
    const g = new THREE.ExtrudeGeometry(sh, { depth: xb - xa, bevelEnabled: false }).rotateY(-Math.PI / 2).translate(0, 0, 0);
    if (s < 0) g.scale(1, 1, -1);
    put('ballast', g.translate(xb, y - 0.5, zc + s * 1.3));
  }
  // bullhead rail: head, web, foot (metres), extruded along the line
  const prof = [[-0.034, 0.143], [0.034, 0.143], [0.037, 0.13], [0.036, 0.1], [0.011, 0.088], [0.009, 0.05], [0.032, 0.035], [0.034, 0.008], [0.03, 0], [-0.03, 0], [-0.034, 0.008], [-0.032, 0.035], [-0.009, 0.05], [-0.011, 0.088], [-0.036, 0.1], [-0.037, 0.13]];
  const rail = new THREE.ExtrudeGeometry(pathPts(new THREE.Shape(), prof), { depth: xb - xa, bevelEnabled: false, steps: 1 }).rotateY(Math.PI / 2);
  for (const s of [-1, 1]) put('railSteel', rail.clone().translate(xa, y - 0.143, zc + s * GAUGE / 2));
  const sl = [], ch = [];
  for (let x = xa + 0.4; x < xb; x += 0.7) {
    const j = Math.sin(x * 12.9898) * 0.5;
    sl.push(xf([x, y - 0.3, zc + j * 0.04], j * 0.02, [0.26, 0.14, 2.6]));
    for (const s of [-1, 1]) ch.push(xf([x, y - 0.2, zc + s * GAUGE / 2], 0, 1));
  }
  addInst(new RoundedBoxGeometry(1, 1, 1, 1, 0.08), M.sleeper, sl, null, { cast: false });
  // cast-iron chairs holding the rails, with their oak keys
  const chair = merge([new RoundedBoxGeometry(0.22, 0.05, 0.36, 1, 0.012).translate(0, 0.025, 0), new THREE.BoxGeometry(0.16, 0.1, 0.05).translate(0, 0.08, -0.055), new THREE.BoxGeometry(0.16, 0.1, 0.05).translate(0, 0.08, 0.055)]);
  addInst(chair, M.paintBlack, ch, null, { cast: false });
  addInst(new THREE.BoxGeometry(0.18, 0.045, 0.035).translate(0, 0.1, 0.085), M.timber, ch, null, { cast: false });
}

// ---- wheels: steel tyre and flange, a red rim, tapered spokes, the boss; drivers carry a balance weight and a crank
function wheel(x, yc, zw, s, r, { spokes = 16, weight = false, crank = null, rc = 0.38, mat = 'paintRed' } = {}) {
  const Z = (d) => zw + s * d;
  const face = (g) => (s < 0 ? g.rotateY(Math.PI) : g);
  put('steel', new THREE.CylinderGeometry(r, r, 0.13, 56, 1, true).rotateX(Math.PI / 2).translate(x, yc, zw));
  put('steel', new THREE.CylinderGeometry(r + 0.03, r + 0.03, 0.025, 56, 1, true).rotateX(Math.PI / 2).translate(x, yc, Z(-0.055)));
  put('steel', face(new THREE.RingGeometry(r - 0.06, r, 56)).translate(x, yc, Z(0.065)));
  put(mat, new THREE.TorusGeometry(r - 0.085, 0.032, 8, 56).translate(x, yc, Z(0.04)));
  put(mat, face(new THREE.RingGeometry(r * 0.2, r - 0.06, 56)).translate(x, yc, Z(-0.02)));   // the web behind the spokes, recessed
  for (let k = 0; k < spokes; k++) {
    const a = (k / spokes) * Math.PI * 2, L = r * 0.66;
    put(mat, new THREE.CylinderGeometry(0.026, 0.042, L, 8).scale(1, 1, 0.75).translate(0, r * 0.2 + L / 2, 0).rotateZ(a).translate(x, yc, Z(0.03)));
  }
  put(mat, lathe([[0, 0.1], [r * 0.12, 0.1], [r * 0.2, 0.06], [r * 0.24, 0], [0, 0]], 28).rotateX(s * Math.PI / 2).translate(x, yc, Z(0.0)));
  put('steel', new THREE.CylinderGeometry(0.07, 0.07, 0.05, 16).rotateX(Math.PI / 2).translate(x, yc, Z(0.11)));
  if (weight) {   // a crescent between the spokes opposite the crank
    const a0 = (crank ?? 0) + Math.PI - 0.95, a1 = (crank ?? 0) + Math.PI + 0.95, sh = new THREE.Shape();
    sh.absarc(0, 0, r * 0.84, a0, a1, false); sh.absarc(0, 0, r * 0.34, a1, a0, true);
    put(mat, new THREE.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 1, curveSegments: 24 }).translate(0, 0, -0.03).translate(x, yc, Z(0.03)));
  }
  if (crank !== null) {   // the crank boss and pin
    const cx = x + rc * Math.cos(crank), cy = yc + rc * Math.sin(crank);
    put(mat, new THREE.CylinderGeometry(0.13, 0.15, 0.08, 20).rotateX(Math.PI / 2).translate(cx, cy, Z(0.09)));
    put('steel', new THREE.CylinderGeometry(0.065, 0.065, 0.24, 16).rotateX(Math.PI / 2).translate(cx, cy, Z(0.2)));
  }
}

// ---- the engine
function buildLocomotive(F, z) { // F: front of the buffer beam; the engine faces +x on the track at z; returns the chimney top
  const y = STN.y, RP = y + 1.38, Zs = (s, d) => z + s * d;
  const BY = y + 2.55;   // boiler axis
  // buffer beam, buffers, coupling, lamp irons and two white lamps (an express headcode)
  wallBox(F - 0.3, F, y + 0.78, y + 1.32, z - 1.36, z + 1.36, 'paintRed', 0.025);
  for (const s of [-1, 1]) {
    put('paintBlack', lathe([[0.2, 0], [0.2, 0.03], [0.14, 0.06], [0.115, 0.3], [0.13, 0.33], [0, 0.33]], 28).rotateZ(-Math.PI / 2).translate(F, y + 1.05, Zs(s, 0.87)));
    put('steel', new THREE.CylinderGeometry(0.075, 0.075, 0.22, 14).rotateZ(Math.PI / 2).translate(F + 0.42, y + 1.05, Zs(s, 0.87)));
    put('steel', lathe([[0, 0], [0.22, 0], [0.225, 0.025], [0.17, 0.05], [0, 0.062]], 36).rotateZ(-Math.PI / 2).translate(F + 0.5, y + 1.05, Zs(s, 0.87)));
    const lz = Zs(s, 0.62), ly = y + 1.32, lx = F + 0.16;
    put('paintBlack', new THREE.BoxGeometry(0.05, 0.14, 0.05).translate(F + 0.03, ly + 0.07, lz));
    put('white', new RoundedBoxGeometry(0.21, 0.29, 0.22, 2, 0.03).translate(lx, ly + 0.17, lz));
    put('white', new THREE.CylinderGeometry(0.06, 0.085, 0.07, 18).translate(lx, ly + 0.345, lz));
    put('white', new THREE.TorusGeometry(0.065, 0.011, 6, 14, Math.PI).translate(lx, ly + 0.38, lz));
    put('lamp', new THREE.CylinderGeometry(0.07, 0.07, 0.02, 24).rotateZ(Math.PI / 2).translate(lx + 0.112, ly + 0.17, lz));
    put('steel', new THREE.TorusGeometry(0.076, 0.012, 6, 24).rotateY(Math.PI / 2).translate(lx + 0.115, ly + 0.17, lz));
  }
  put('paintBlack', new THREE.BoxGeometry(0.3, 0.12, 0.12).translate(F + 0.12, y + 1.05, z));
  for (let k = 0; k < 3; k++) put('paintBlack', new THREE.TorusGeometry(0.07, 0.018, 6, 12).rotateY(k % 2 ? 0 : Math.PI / 2).translate(F + 0.3, y + 0.95 - k * 0.11, z));
  // running plate, valances, frames, front steps
  wallBox(F - 11.2, F - 0.3, RP - 0.05, RP, z - 1.38, z + 1.38, 'paintBlack', 0.01);
  for (const s of [-1, 1]) {
    wallBox(F - 11.2, F - 0.3, RP - 0.24, RP - 0.05, Zs(s, 1.38) - 0.02, Zs(s, 1.38) + 0.02, 'paintRed', 0.005);
    wallBox(F - 11.2, F - 0.3, RP - 0.2, RP - 0.185, Zs(s, 1.405) - 0.003, Zs(s, 1.405) + 0.003, 'paintBlack', 0);
    wallBox(F - 11.0, F - 0.35, y + 0.42, RP - 0.05, Zs(s, 0.64) - 0.03, Zs(s, 0.64) + 0.03, 'paintBlack', 0.01);
    wallBox(F - 0.75, F - 0.45, y + 0.55, y + 0.58, Zs(s, 1.2) - 0.14, Zs(s, 1.2) + 0.14, 'paintBlack', 0.005);
    beam([F - 0.6, y + 0.58, Zs(s, 1.33)], [F - 0.6, RP - 0.2, Zs(s, 1.33)], 0.04, 'paintBlack');
  }
  // smokebox on its saddle; the domed door with its ring, hinge straps, dart and handrail; the number plate
  put('paintBlack', new THREE.CylinderGeometry(0.86, 0.86, 1.6, 64).rotateZ(Math.PI / 2).translate(F - 1.35, BY, z));
  put('paintBlack', new THREE.TorusGeometry(0.85, 0.04, 8, 64).rotateY(Math.PI / 2).translate(F - 0.56, BY, z));
  wallBox(F - 2.1, F - 0.7, RP, BY - 0.45, z - 0.62, z + 0.62, 'paintBlack', 0.06);
  const dome = (r) => 0.16 * Math.max(0, 1 - (r / 0.76) ** 2) ** 0.7;
  put('paintBlack', lathe([[0, 0.16], [0.2, dome(0.2)], [0.4, dome(0.4)], [0.56, dome(0.56)], [0.68, dome(0.68)], [0.76, 0], [0.8, 0]], 64).rotateZ(-Math.PI / 2).translate(F - 0.55, BY, z));
  for (const dy of [0.34, -0.34]) {
    const pts = []; for (let k = 0; k <= 10; k++) { const zz = -0.06 + k * 0.08, rr = Math.hypot(zz, dy); pts.push([F - 0.55 + dome(rr) + 0.015, BY + dy, z + zz]); }
    put('steel', tube(pts, 0.022, 16, 6).scale(1, 1, 1));
    put('steel', new THREE.CylinderGeometry(0.035, 0.035, 0.12, 10).translate(F - 0.53, BY + dy, z + 0.78));
  }
  put('steel', new THREE.CylinderGeometry(0.06, 0.06, 0.06, 16).rotateZ(Math.PI / 2).translate(F - 0.37, BY, z));
  put('steel', new THREE.BoxGeometry(0.03, 0.04, 0.32).translate(F - 0.33, BY, z));
  put('steel', new THREE.BoxGeometry(0.03, 0.3, 0.04).translate(F - 0.31, BY, z));
  put('steel', tube([[F - 0.44, BY + 0.5, z - 0.42], [F - 0.4, BY + 0.58, z - 0.2], [F - 0.39, BY + 0.6, z], [F - 0.4, BY + 0.58, z + 0.2], [F - 0.44, BY + 0.5, z + 0.42]], 0.016, 20, 6));
  // chimney (GWR, black), boiler (tapered), bands, handrails on knobs, top feed with its pipes, safety-valve bonnet, whistles
  put('paintBlack', lathe([[0.44, 0], [0.36, 0.04], [0.29, 0.13], [0.262, 0.3], [0.255, 0.62], [0.275, 0.68], [0.325, 0.72], [0.335, 0.76], [0.3, 0.785], [0.235, 0.785], [0.23, 0.6]], 40).translate(F - 1.35, BY + 0.72, z));
  const bR = (x) => lerp(0.78, 0.845, clamp((F - 2.15 - x) / 4.6, 0, 1));
  put('paintRed', new THREE.CylinderGeometry(0.78, 0.845, 4.6, 64).rotateZ(Math.PI / 2).translate(F - 4.45, BY, z));
  for (const bx of [F - 2.3, F - 3.8, F - 5.3, F - 6.6]) put('paintBlack', new THREE.CylinderGeometry(bR(bx) + 0.008, bR(bx) + 0.008, 0.07, 64, 1, true).rotateZ(Math.PI / 2).translate(bx, BY, z));
  for (const s of [-1, 1]) {
    const hr = (x) => [x, BY + 0.55, Zs(s, bR(x) * 0.74 + 0.07)];
    put('steel', tube([hr(F - 0.75), hr(F - 2.2), hr(F - 4.4), hr(F - 6.6), [F - 8.6, BY + 0.62, Zs(s, 0.98)]], 0.015, 40, 6));
    for (const kx of [F - 1.0, F - 2.6, F - 3.8, F - 5.0, F - 6.2, F - 7.4]) put('steel', new THREE.CylinderGeometry(0.012, 0.018, 0.1, 8).rotateX(s * 0.8).translate(kx, BY + 0.52, Zs(s, bR(kx) * 0.74 + 0.03)));
    put('brass', tube([[F - 4.1, BY + 0.85, Zs(s, 0.12)], [F - 4.05, BY + 0.7, Zs(s, 0.5)], [F - 3.98, BY + 0.2, Zs(s, 0.86)], [F - 3.9, BY - 0.15, Zs(s, 0.87)]], 0.022, 20, 8));
  }
  put('paintRed', new RoundedBoxGeometry(0.56, 0.3, 0.62, 3, 0.12).translate(F - 4.1, BY + 0.86, z));
  put('brass', lathe([[0.37, 0], [0.33, 0.04], [0.24, 0.12], [0.185, 0.24], [0.172, 0.4], [0.19, 0.48], [0.215, 0.53], [0.205, 0.56], [0, 0.56]], 40).translate(F - 5.9, BY + 0.8, z));
  for (const s of [-1, 1]) put('brass', lathe([[0, 0], [0.035, 0], [0.03, 0.18], [0.045, 0.2], [0.05, 0.36], [0.03, 0.38], [0, 0.4]], 16).translate(F - 8.55, BY + 0.84, Zs(s, 0.22)));
  // Belpaire firebox
  put('paintRed', new RoundedBoxGeometry(2.1, 1.95, 1.95, 5, 0.42).translate(F - 7.75, BY - 0.12, z));
  // outside cylinders with covers and drain cocks; slide bars; the motion bracket
  const CY = y + 1.0;
  for (const s of [-1, 1]) {
    const cz = Zs(s, 1.02);
    put('paintBlack', new THREE.CylinderGeometry(0.33, 0.33, 1.15, 40).rotateZ(Math.PI / 2).translate(F - 2.25, CY, cz));
    for (const bx of [F - 1.72, F - 2.25, F - 2.78]) put('paintBlack', new THREE.TorusGeometry(0.332, 0.016, 6, 40).rotateY(Math.PI / 2).translate(bx, CY, cz));
    put('paintBlack', lathe([[0, 0.1], [0.16, 0.09], [0.28, 0.05], [0.345, 0.01], [0.345, 0]], 40).rotateZ(-Math.PI / 2).translate(F - 1.675, CY, cz));
    put('steel', new THREE.CylinderGeometry(0.05, 0.05, 0.03, 12).rotateZ(Math.PI / 2).translate(F - 1.56, CY, cz));
    put('paintBlack', new THREE.CylinderGeometry(0.345, 0.345, 0.06, 40).rotateZ(Math.PI / 2).translate(F - 2.85, CY, cz));
    for (const dx of [F - 1.8, F - 2.7]) put('steel', new THREE.CylinderGeometry(0.018, 0.018, 0.16, 8).translate(dx, CY - 0.4, cz));
    for (const dy of [0.12, -0.12]) put('steel', new RoundedBoxGeometry(1.25, 0.05, 0.075, 1, 0.01).translate(F - 3.5, CY + dy, cz));
    wallBox(F - 4.2, F - 4.08, CY - 0.28, RP - 0.05, Math.min(Zs(s, 0.66), cz), Math.max(Zs(s, 0.66), cz) + 0.04, 'paintBlack', 0.01);
    // splashers over the drivers: a shell above the running plate, the outer face, brass beading along the edge
  }
  const D = [F - 4.55, F - 6.68, F - 8.81], DR = EXPRESS.drv, YC = y + DR;
  for (const s of [-1, 1]) {
    for (const [k, dx] of D.entries()) {
      const R = DR + 0.08, a = Math.acos((RP - YC) / R);
      put('paintRed', new THREE.CylinderGeometry(R, R, 0.32, 48, 1, true, Math.PI - a, 2 * a).rotateX(Math.PI / 2).translate(dx, YC, Zs(s, 0.82)));
      const sh = new THREE.Shape(); sh.absarc(0, 0, R, Math.PI / 2 - a, Math.PI / 2 + a, false); sh.closePath();
      const g = new THREE.ShapeGeometry(sh, 32); if (s < 0) g.rotateY(Math.PI);
      put('paintRed', g.translate(dx, YC, Zs(s, 0.98)));
      put('brass', new THREE.TorusGeometry(R, 0.016, 6, 48, 2 * a).rotateZ(Math.PI / 2 - a).translate(dx, YC, Zs(s, 0.985)));
      if (k === 1) {   // the nameplate
        const plate = decalMat(1024, 256, (g2, w, h) => {
          g2.translate(w / 2, h * 2.6); const r0 = h * 2.05, r1 = h * 2.5;
          g2.beginPath(); g2.arc(0, 0, r1, -Math.PI * 0.69, -Math.PI * 0.31); g2.arc(0, 0, r0, -Math.PI * 0.31, -Math.PI * 0.69, true); g2.closePath();
          g2.fillStyle = '#0d0d0d'; g2.fill(); g2.lineWidth = 9; g2.strokeStyle = '#d6ae55'; g2.stroke();
          g2.fillStyle = '#e2bf66'; g2.font = serif(78); g2.textAlign = 'center'; g2.textBaseline = 'middle';
          const txt = 'HOGWARTS CASTLE'; for (let i = 0; i < txt.length; i++) { const t = -Math.PI * 0.645 + (i / (txt.length - 1)) * Math.PI * 0.29; g2.save(); g2.rotate(t + Math.PI / 2); g2.fillText(txt[i], 0, -(r0 + r1) / 2); g2.restore(); }
        });
        decal(plate, 1.95, 0.49, [dx, RP + 0.16, Zs(s, 0.99)], s > 0 ? 0 : Math.PI);
      }
    }
  }
  // the moving parts: bogie and driving axles, coupling rods, connecting rods, crossheads with piston rods
  for (const bx of [F - 1.15, F - 3.28]) axleGroup(bx, y + 0.46, z, 0.46, () => { for (const s of [-1, 1]) wheel(bx, y + 0.46, Zs(s, 0.72), s, 0.46, { spokes: 10 }); });
  const RC = 0.38;
  for (const [k, dx] of D.entries()) axleGroup(dx, YC, z, DR, () => { for (const s of [-1, 1]) wheel(dx, YC, Zs(s, 0.72), s, DR, { spokes: 18, weight: true, crank: s > 0 ? 0 : Math.PI / 2, rc: RC }); void k; });
  for (const s of [-1, 1]) {
    const phase = s > 0 ? 0 : Math.PI / 2, zr = Zs(s, 0.96), zc = Zs(s, 1.06), Lr = 3.18;
    const coupling = movingGroup(() => {   // pins at the reference angle: dx + RC cos(phase), YC + RC sin(phase)
      const px = D.map((dx) => dx + RC * Math.cos(phase)), py = YC + RC * Math.sin(phase);
      put('steel', new RoundedBoxGeometry(px[0] - px[2], 0.1, 0.05, 2, 0.015).translate((px[0] + px[2]) / 2, py, zr));
      put('steel', new RoundedBoxGeometry(px[0] - px[2] - 0.2, 0.04, 0.056, 1, 0.01).translate((px[0] + px[2]) / 2, py, zr));
      for (const p of px) put('steel', new THREE.CylinderGeometry(0.11, 0.11, 0.07, 20).rotateX(Math.PI / 2).translate(p, py, zr));
    });
    const conrod = movingGroup(() => {   // along +x from the big end (origin) to the small end at Lr
      put('steel', new RoundedBoxGeometry(Lr, 0.12, 0.05, 2, 0.015).translate(Lr / 2, 0, 0));
      put('steel', new THREE.CylinderGeometry(0.14, 0.14, 0.08, 24).rotateX(Math.PI / 2));
      put('steel', new THREE.CylinderGeometry(0.08, 0.08, 0.07, 16).rotateX(Math.PI / 2).translate(Lr, 0, 0));
    });
    conrod.position.z = zr + s * 0.07;
    const cross = movingGroup(() => {   // crosshead centred on the origin; the piston rod runs forward into the cylinder
      put('steel', new RoundedBoxGeometry(0.4, 0.19, 0.1, 2, 0.02));
      put('steel', new THREE.CylinderGeometry(0.04, 0.04, 1.2, 12).rotateZ(Math.PI / 2).translate(0.8, 0, 0));
    });
    cross.position.z = zc;
    EXPRESS.sides.push({ phase, coupling, conrod, cross, D1: D[1], YC, RC, Lr, CY, s });
  }
  // cab: lower sides, front upper panels with a window, the rear pillar, the roof, the spectacle plate with round windows
  const C0 = F - 8.75, C1 = F - 11.2, RT = y + 3.62;
  for (const s of [-1, 1]) {
    const zz = Zs(s, 1.36);
    wallBox(C1, C0, RP, RP + 1.12, zz - 0.025, zz + 0.025, 'paintRed', 0.01);
    const panel = pathPts(new THREE.Shape(), [[0, 0], [1.4, 0], [1.4, RT - RP - 1.12], [0, RT - RP - 1.12]]);
    panel.holes.push(pathPts(new THREE.Path(), [[0.32, 0.32], [1.08, 0.32], [1.08, 0.9], [0.32, 0.9]], true));
    const pg = new THREE.ExtrudeGeometry(panel, { depth: 0.05, bevelEnabled: false }).translate(C0 - 1.4, RP + 1.12, zz - 0.025);
    put('paintRed', pg);
    put('steel', new THREE.BoxGeometry(0.78, 0.04, 0.07).translate(C0 - 1.4 + 0.7, RP + 1.12 + 0.3, zz));
    put('cabGlass', new THREE.BoxGeometry(0.76, 0.58, 0.01).translate(C0 - 1.4 + 0.7, RP + 1.12 + 0.61, zz - s * 0.02));
    wallBox(C1, C1 + 0.08, RP, RT, zz - 0.025, zz + 0.025, 'paintRed', 0.01);
    put('brass', new THREE.BoxGeometry(0.62, 0.2, 0.015).translate(C0 - 0.6, RP + 0.62, zz + s * 0.035));
    put('steel', tube([[C1 + 0.95, RP + 0.1, Zs(s, 1.42)], [C1 + 0.95, RP + 1.0, Zs(s, 1.42)], [C1 + 0.95, RP + 1.9, Zs(s, 1.4)]], 0.016, 12, 6));
    for (const dy of [0.35, 0.7]) wallBox(C1 + 0.7, C1 + 1.1, y + dy, y + dy + 0.025, zz - 0.18, zz + 0.02 * s, 'paintBlack', 0.004);
  }
  wallBox(C0 - 0.07, C0, RP, RT, z - 1.36, z + 1.36, 'paintRed', 0.01);
  for (const s of [-1, 1]) {
    put('cabGlass', new THREE.CircleGeometry(0.2, 24).rotateY(Math.PI / 2).translate(C0 + 0.004, y + 3.05, Zs(s, 0.62)));
    put('brass', new THREE.TorusGeometry(0.205, 0.022, 6, 28).rotateY(Math.PI / 2).translate(C0 + 0.01, y + 3.05, Zs(s, 0.62)));
  }
  put('paintBlack', new THREE.CylinderGeometry(3.2, 3.2, 3.0, 48, 1, true, -0.45, 0.9).rotateX(Math.PI / 2).rotateY(Math.PI / 2).translate(C0 - 1.35, y + 0.43, z));
  for (const s of [-1, 1]) put('paintBlack', new THREE.BoxGeometry(2.9, 0.03, 0.03).translate(C0 - 1.35, y + 3.55, Zs(s, 1.05)));
  // tender: tank with flared coal plates, coal, outside frames with axleboxes and leaf springs, wheels, rear beam, steps, the crest
  const T0 = F - 11.45, T1 = F - 19.0;
  wallBox(T1, T0, y + 1.22, y + 3.25, z - 1.38, z + 1.38, 'paintRed', 0.06);
  for (const s of [-1, 1]) {
    put('paintRed', new THREE.BoxGeometry(T0 - T1 - 1.0, 0.36, 0.035).rotateX(s * 0.42).translate((T0 + T1) / 2 + 0.5, y + 3.42, Zs(s, 1.44)));
    wallBox(T1, T0, y + 1.22, y + 1.26, Zs(s, 1.4) - 0.01, Zs(s, 1.4) + 0.01, 'paintBlack', 0);
    wallBox(T1 + 0.1, T0 - 0.1, y + 0.55, y + 1.22, Zs(s, 1.0) - 0.035, Zs(s, 1.0) + 0.035, 'paintBlack', 0.01);
    for (const bx of [T0 - 1.6, (T0 + T1) / 2, T1 + 1.6]) {
      wallBox(bx - 0.18, bx + 0.18, y + 0.42, y + 0.86, Zs(s, 1.04) - 0.07, Zs(s, 1.04) + 0.07, 'paintBlack', 0.02);
      for (let k = 0; k < 6; k++) { const w = 1.3 - k * 0.17; put('steel', new THREE.BoxGeometry(w, 0.025, 0.11).translate(bx, y + 0.9 + k * 0.028, Zs(s, 1.04))); }
    }
    beam([T1 + 0.25, y + 1.3, Zs(s, 1.42)], [T1 + 0.25, y + 3.1, Zs(s, 1.42)], 0.03, 'steel');
    beam([T0 - 0.25, y + 1.3, Zs(s, 1.42)], [T0 - 0.25, y + 3.1, Zs(s, 1.42)], 0.03, 'steel');
  }
  for (const bx of [T0 - 1.6, (T0 + T1) / 2, T1 + 1.6]) axleGroup(bx, y + 0.62, z, 0.62, () => { for (const s of [-1, 1]) wheel(bx, y + 0.62, Zs(s, 0.72), s, 0.62, { spokes: 12 }); });
  wallBox(T1 - 0.3, T1, y + 0.78, y + 1.32, z - 1.36, z + 1.36, 'paintRed', 0.025);
  for (const s of [-1, 1]) put('paintBlack', lathe([[0.2, 0], [0.2, 0.03], [0.14, 0.06], [0.115, 0.3], [0, 0.3]], 24).rotateZ(Math.PI / 2).translate(T1 - 0.3, y + 1.05, Zs(s, 0.87)));
  const coal = new THREE.BoxGeometry(T0 - T1 - 1.6, 0.6, 2.4, 48, 2, 16); const cp = coal.attributes.position;
  for (let i = 0; i < cp.count; i++) if (cp.getY(i) > 0) cp.setY(i, cp.getY(i) + 0.22 * noise3(cp.getX(i) * 0.9, 1.3, cp.getZ(i) * 1.6) + 0.06 * noise3(cp.getX(i) * 6, 2.1, cp.getZ(i) * 6) + 0.15);
  coal.computeVertexNormals(); put('coal', coal.translate((T0 + T1) / 2 - 0.6, y + 3.0, z));
  put('paintBlack', new THREE.CylinderGeometry(0.25, 0.25, 0.12, 20).translate(T1 + 0.8, y + 3.31, z));
  // the headboard on the smokebox, the crest on the tender
  const head = decalMat(1024, 256, (g, w, h) => {
    g.fillStyle = '#5a0c0c'; g.beginPath(); g.moveTo(16, h - 14); g.quadraticCurveTo(w / 2, -60, w - 16, h - 14); g.closePath(); g.fill();
    g.lineWidth = 12; g.strokeStyle = '#c8a24a'; g.stroke();
    g.fillStyle = '#e8c86a'; g.font = serif(92); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('HOGWARTS EXPRESS', w / 2, h * 0.66);
  });
  decal(head, 1.7, 0.42, [F - 0.5, BY + 0.98, z], Math.PI / 2);
  put('paintBlack', new THREE.BoxGeometry(0.04, 0.08, 0.06).translate(F - 0.53, BY + 0.8, z));
  const plate = decalMat(256, 96, (g, w, h) => { g.fillStyle = '#111'; g.beginPath(); g.ellipse(w / 2, h / 2, w / 2 - 4, h / 2 - 4, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#c8c4b8'; g.lineWidth = 6; g.stroke(); g.fillStyle = '#e8e4d8'; g.font = serif(60); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('5972', w / 2, h / 2 + 3); });
  decal(plate, 0.5, 0.19, [F - 0.55 + dome(0.45) + 0.012, BY + 0.45, z], Math.PI / 2);
  const crest = decalMat(512, 512, (g, w, h) => {
    g.strokeStyle = '#d0a848'; g.lineWidth = 14; g.beginPath(); g.arc(w / 2, h / 2, w * 0.44, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 5; g.beginPath(); g.arc(w / 2, h / 2, w * 0.33, 0, Math.PI * 2); g.stroke();
    drawCrest(g, w * 0.33, h * 0.31, w * 0.34, h * 0.38, 'colour');
    g.fillStyle = '#d8b050'; g.font = serif(34); g.textAlign = 'center';
    const txt = 'HOGWARTS RAILWAYS', R = w * 0.385;
    for (let i = 0; i < txt.length; i++) { const a = -Math.PI * 0.86 + (i / (txt.length - 1)) * Math.PI * 0.72; g.save(); g.translate(w / 2 + Math.cos(a - Math.PI / 2) * R, h / 2 + Math.sin(a - Math.PI / 2) * R); g.rotate(a); g.fillText(txt[i], 0, 12); g.restore(); }
  });
  for (const s of [-1, 1]) decal(crest, 1.3, 1.3, [(T0 + T1) / 2, y + 2.2, Zs(s, 1.395)], s > 0 ? 0 : Math.PI);
  return [F - 1.35, BY + 1.5, z];
}
// the rods at driver angle th (radians turned forward)
function expressMotion(dist) {
  for (const a of EXPRESS.axles) a.g.rotation.z = -dist / a.r;
  const th = dist / EXPRESS.drv;
  for (const S of EXPRESS.sides) {
    const al = S.phase - th, c0 = Math.cos(S.phase), s0 = Math.sin(S.phase);
    S.coupling.position.set(S.RC * (Math.cos(al) - c0), S.RC * (Math.sin(al) - s0), 0);
    const px = S.D1 + S.RC * Math.cos(al), py = S.YC + S.RC * Math.sin(al), dy = S.CY - py, xc = px + Math.sqrt(S.Lr * S.Lr - dy * dy);
    S.conrod.position.x = px; S.conrod.position.y = py; S.conrod.rotation.z = Math.atan2(dy, xc - px);
    S.cross.position.x = xc; S.cross.position.y = S.CY;
  }
}

// ---- a BR Mk1 coach: maroon body (M.coach paints the lining and shows the compartments through the windows), rounded
// aluminium window frames, droplight doors with handles and grab rails, the curved roof with vents, BR1 bogies
function buildCoach(x1, z, idx = 0) { // x1: east end; 19.6 m long
  const y = STN.y, x0 = x1 - 19.6;
  const body = new THREE.BoxGeometry(19.6, 2.65, 2.85, 1, 1, 1).translate((x0 + x1) / 2, y + 2.15, z);
  const p = body.attributes.position, n = body.attributes.normal, uv = body.attributes.uv;
  for (let i = 0; i < p.count; i++) { const v = p.getY(i) - y; const side = Math.abs(n.getZ(i)) > 0.5; uv.setXY(i, side ? (n.getZ(i) > 0 ? x1 - p.getX(i) : p.getX(i) - x0) : 0, (side ? v : 0) + 10 * idx); }
  put('coach', body);
  { // a shallow curved roof: an arc of radius 2.86 m rising 0.38 m over the 2.85 m body, as on a Mk1
    const Rr = 2.86, yc = 3.855 - Rr, pts = [];
    for (let i = 0; i <= 24; i++) { const zz = -1.47 + 2.94 * i / 24; pts.push([zz, yc + Math.sqrt(Rr * Rr - zz * zz)]); }
    const sh = pathPts(new THREE.Shape(), [...pts, ...pts.slice().reverse().map(([zz, yy]) => [zz, yy - 0.07])]);
    put('lead', new THREE.ExtrudeGeometry(sh, { depth: 19.4, bevelEnabled: false }).translate(0, 0, -9.7).rotateY(Math.PI / 2).translate((x0 + x1) / 2, y, z));
  }
  for (const s of [-1, 1]) put('paintBlack', new THREE.BoxGeometry(19.2, 0.04, 0.05).translate((x0 + x1) / 2, y + 3.5, z + s * 1.43));   // cantrail gutter
  for (let k = 1; k < 7; k++) put('paintBlack', lathe([[0, 0], [0.13, 0], [0.12, 0.08], [0.09, 0.16], [0.05, 0.2], [0, 0.2]], 16).translate(x0 + k * 2.8, y + 4.27, z));
  // window frames (rounded, aluminium) and the doors' droplight frames, both sides
  const ring = (w, h, r) => {
    const o = new THREE.Shape(), i = new THREE.Path();
    const rr = (P, hw, hh, rad) => { P.moveTo(-hw + rad, -hh); P.lineTo(hw - rad, -hh); P.absarc(hw - rad, -hh + rad, rad, -Math.PI / 2, 0); P.lineTo(hw, hh - rad); P.absarc(hw - rad, hh - rad, rad, 0, Math.PI / 2); P.lineTo(-hw + rad, hh); P.absarc(-hw + rad, hh - rad, rad, Math.PI / 2, Math.PI); P.lineTo(-hw, -hh + rad); P.absarc(-hw + rad, -hh + rad, rad, Math.PI, Math.PI * 1.5); };
    rr(o, w / 2 + 0.03, h / 2 + 0.03, r + 0.03); rr(i, w / 2, h / 2, r); o.holes.push(i);
    return new THREE.ExtrudeGeometry(o, { depth: 0.018, bevelEnabled: false, curveSegments: 6 });
  };
  const winRing = ring(1.0, 0.94, 0.08), dropRing = ring(0.6, 0.64, 0.06);
  const wl = [], dl = [], hl = [];
  for (const s of [-1, 1]) {
    const zf = z + s * 1.425, ry = s > 0 ? 0 : Math.PI, X = (u) => (s > 0 ? x1 - u : x0 + u);
    for (let k = 1; k <= 12; k++) wl.push(xf([X((k + 0.5) * 1.45), y + 1.8, zf], ry, 1));
    for (const u of [0.6, 19.0]) {
      dl.push(xf([X(u), y + 1.95, zf], ry, 1));
      hl.push([X(u < 10 ? u + 0.36 : u - 0.36), zf]);
    }
  }
  addInst(winRing, M.steel, wl, null, { cast: false });
  addInst(dropRing, M.steel, dl, null, { cast: false });
  for (const [hx, hz] of hl) {
    const s = Math.sign(hz - z);
    put('brass', new THREE.CylinderGeometry(0.018, 0.018, 0.13, 8).rotateZ(Math.PI / 2).translate(hx, y + 1.42, hz + s * 0.045));
    put('steel', tube([[hx, y + 1.2, hz + s * 0.02], [hx, y + 1.25, hz + s * 0.07], [hx, y + 1.85, hz + s * 0.07], [hx, y + 1.9, hz + s * 0.02]], 0.014, 12, 6));
  }
  // solebar, underframe gear (battery boxes, vacuum cylinders), bogies with turning wheelsets
  wallBox(x0 + 0.2, x1 - 0.2, y + 0.62, y + 0.85, z - 1.3, z + 1.3, 'paintBlack', 0.03);
  for (const [bx, w] of [[x0 + 7.2, 1.4], [x1 - 7.6, 1.0]]) wallBox(bx - w / 2, bx + w / 2, y + 0.18, y + 0.6, z - 0.9, z - 0.3, 'paintBlack', 0.03);
  for (const bx of [x0 + 9.6, x1 - 9.2]) put('paintBlack', new THREE.CylinderGeometry(0.28, 0.28, 0.7, 20).rotateX(Math.PI / 2).translate(bx, y + 0.35, z + 0.5));
  for (const bc of [x0 + 2.7, x1 - 2.7]) {
    for (const s of [-1, 1]) {
      wallBox(bc - 1.75, bc + 1.75, y + 0.38, y + 0.6, z + s * 1.0 - 0.06, z + s * 1.0 + 0.06, 'paintBlack', 0.03);
      for (const o of [-1.3, 1.3]) {
        wallBox(bc + o - 0.16, bc + o + 0.16, y + 0.28, y + 0.62, z + s * 1.0 - 0.1, z + s * 1.0 + 0.1, 'paintBlack', 0.03);
        for (const so of [-0.42, 0.42]) put('steel', new THREE.TorusGeometry(0.09, 0.016, 6, 14).rotateX(Math.PI / 2).translate(bc + o + so, y + 0.64, z + s * 1.0));
        for (const so of [-0.42, 0.42]) for (let k = 0; k < 4; k++) put('steel', new THREE.TorusGeometry(0.09, 0.016, 6, 14).rotateX(Math.PI / 2).translate(bc + o + so, y + 0.66 + k * 0.035, z + s * 1.0));
      }
    }
    wallBox(bc - 0.35, bc + 0.35, y + 0.5, y + 0.62, z - 1.0, z + 1.0, 'paintBlack', 0.03);
    for (const o of [-1.3, 1.3]) axleGroup(bc + o, y + 0.457, z, 0.457, () => {
      for (const s of [-1, 1]) {
        const zw = z + s * 0.72;
        put('steel', new THREE.CylinderGeometry(0.457, 0.457, 0.13, 40, 1, true).rotateX(Math.PI / 2).translate(bc + o, y + 0.457, zw));
        put('paintBlack', (s > 0 ? new THREE.CircleGeometry(0.43, 40) : new THREE.CircleGeometry(0.43, 40).rotateY(Math.PI)).translate(bc + o, y + 0.457, zw + s * 0.06));
        put('steel', new THREE.TorusGeometry(0.2, 0.025, 6, 24).translate(bc + o, y + 0.457, zw + s * 0.065));
        put('steel', new THREE.CylinderGeometry(0.08, 0.08, 0.12, 14).rotateX(Math.PI / 2).translate(bc + o, y + 0.457, zw + s * 0.11));
      }
      put('steel', new THREE.CylinderGeometry(0.06, 0.06, 1.44, 10).rotateX(Math.PI / 2).translate(bc + o, y + 0.457, z));
    });
  }
  // both ends: the gangway bellows, two end windows, buffers
  for (const [xe, d] of [[x1, 1], [x0, -1]]) {
    wallBox(Math.min(xe, xe + d * 0.5), Math.max(xe, xe + d * 0.5), y + 0.9, y + 3.3, z - 0.55, z + 0.55, 'paintBlack', 0.05);
    for (let k = 0; k < 8; k++) wallBox(Math.min(xe, xe + d * 0.5), Math.max(xe, xe + d * 0.5), y + 1.0 + k * 0.28, y + 1.02 + k * 0.28, z - 0.57, z + 0.57, 'steel', 0);
    for (const s of [-1, 1]) {
      wallBox(Math.min(xe, xe + d * 0.03), Math.max(xe, xe + d * 0.03), y + 2.25, y + 2.95, z + s * 0.95 - 0.28, z + s * 0.95 + 0.28, 'paintBlack', 0.01);
      put('steel', lathe([[0, 0], [0.18, 0], [0.18, 0.03], [0, 0.05]], 24).rotateZ(-d * Math.PI / 2).translate(xe + d * 0.42, y + 1.0, z + s * 0.88));
      put('paintBlack', new THREE.CylinderGeometry(0.08, 0.11, 0.42, 12).rotateZ(Math.PI / 2).translate(xe + d * 0.21, y + 1.0, z + s * 0.88));
    }
  }
}

// ---- steam: soft billboards emitted from the chimney (a plume that trails back while the engine runs), the cylinder
// drain cocks (low clouds rolling out over the platform while it brakes and stands) and the safety valve (a thin jet
// while it stands). Each particle slot cycles with its emitter's lifetime, so the cloud at any time t is a function of t
// and of where the engine was when each puff left it: steamAt(t, at, speed) with at(te, [x, y, z]) mapping an engine-local
// point at time te to the world. Lit by the sun or moon and by LAMPS; sorted back to front.
const STEAM = { mesh: null, n: 0, list: [] };
const STEAM_EM = [   // emitter: local point, count, lifetime, and how a puff moves (see steamAt)
  { kind: 'chimney', p: [88 - 1.35, STN.y + 4.0, 0], n: 280, L: 7.5 },
  { kind: 'cock', p: [88 - 1.75, STN.y + 0.62, 1.12], n: 300, L: 6.5 },
  { kind: 'cock', p: [88 - 1.75, STN.y + 0.62, -1.12], n: 300, L: 6.5 },
  { kind: 'valve', p: [88 - 5.9, STN.y + 2.55 + 1.38, 0], n: 50, L: 2.6 },
];
function buildSteam() {
  if (STEAM.mesh) return;
  const n = STEAM_EM.reduce((a, e) => a + e.n, 0);
  const geo = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(1, 1));
  geo.instanceCount = n;
  const aC = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4), aD = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
  aC.setUsage(THREE.DynamicDrawUsage); aD.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aC', aC); geo.setAttribute('aD', aD);   // aC: centre, size; aD: alpha, seed, age, heat
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...ATMO, ...LAMPU }, transparent: true, depthWrite: false,
    vertexShader: /* glsl */ `attribute vec4 aC; attribute vec4 aD; varying vec2 vUv; varying vec4 vD; varying vec3 vW;
      void main(){
        vUv = uv; vD = aD; vW = aC.xyz;
        float a = aD.y * 6.2832; vec2 c = mat2(cos(a), -sin(a), sin(a), cos(a)) * position.xy;
        vec4 mv = viewMatrix * vec4(aC.xyz, 1.0); mv.xy += c * aC.w;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `${NOISE}${ATMO_GLSL}${LAMP_GLSL}
      varying vec2 vUv; varying vec4 vD; varying vec3 vW;
      void main(){
        vec2 q = vUv - 0.5; float r = length(q) * 2.0;
        if (vD.x <= 0.001 || r > 1.0) discard;
        float n = cgFbm2(q * 2.4 + vD.y * 37.0 + vec2(0.0, vD.z * 0.35)), n2 = cgFbm2(q * 5.5 - vD.y * 11.0 + vec2(vD.z * 0.2, 0.0)), n3 = cgFbm2(q * 11.0 + vD.y * 5.0);
        float a = smoothstep(1.0, 0.15, r + (n - 0.5) * 1.0) * smoothstep(0.18, 0.75, n2 * 0.75 + n3 * 0.35 + 0.12);
        a = clamp(a, 0.0, 1.0) * vD.x;
        // light: sky or moon from above, a little self-shadow toward the bottom, the lamps scattering through the steam
        float up = 0.65 + 0.35 * (0.5 - q.y);
        vec3 amb = mix(vec3(0.86, 0.87, 0.88) * (0.75 + 0.35 * uSunDir.y), vec3(0.018, 0.022, 0.032), uNight) * up;
        vec3 L = lampScatter(vW); vec3 c = amb + mix(L, vec3(dot(L, vec3(0.33))), 0.45) * 0.17 + vec3(1.0, 0.75, 0.45) * vD.w * 0.05;
        gl_FragColor = vec4(atmoApply(c, vW), a);
      }`,
  });
  const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = 4; m.visible = false; scene.add(m);
  STEAM.mesh = m; STEAM.n = n;
  for (let i = 0; i < n; i++) STEAM.list.push({ d: 0, x: 0, y: 0, z: 0, s: 0, a: 0, seed: 0, age: 0, h: 0 });
}
const _sh = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
// at(te, p) → world point of engine-local p at time te; speed(te) → m/s; standFrom: when the engine came to a stand
function steamAt(t, at, speed, standFrom = -1e9) {
  buildSteam();
  const S = STEAM, P = [0, 0, 0];
  let j = 0;
  for (const E of STEAM_EM) {
    for (let k = 0; k < E.n; k++, j++) {
      const o = S.list[j], ph = (k / E.n) * E.L + _sh(j, 1) * (E.L / E.n);
      const age = ((t - ph) % E.L + E.L) % E.L, te = t - age, v = speed(te);
      // how strongly this emitter was blowing when the puff left
      let str = 0;
      if (E.kind === 'chimney') str = 0.45 + 0.55 * clamp(v / 8, 0, 1) * (0.6 + 0.4 * Math.max(0, Math.sin(te * (v / 1.4 + 1.2) * 2.4)));
      else if (E.kind === 'cock') str = clamp((8 - v) / 4, 0, 1) * clamp(1 - (te - standFrom - 9) / 8, 0, 1) * (te > -1e8 ? 1 : 0);
      else str = te > standFrom + 2 ? 0.8 : 0;
      if (str <= 0.01) { o.a = 0; o.d = -1; continue; }
      const p0 = at(te, E.p);
      const r1 = _sh(j, 2) - 0.5, r2 = _sh(j, 3) - 0.5, r3 = _sh(j, 4);
      let x = p0[0], y = p0[1], z = p0[2], size, al;
      if (E.kind === 'chimney') {
        const v0 = 3.5 + 3 * str + r3, tau = 1.1;
        y += v0 * tau * (1 - Math.exp(-age / tau)) + 0.45 * age;
        const spread = 0.25 + 0.55 * age;
        x += r1 * spread * 1.6 + 0.7 * age; z += r2 * spread * 1.6 + 0.25 * age;
        size = 0.7 + 0.95 * age + 0.3 * r3; al = 0.42 * str * Math.min(1, age / 0.15) * Math.exp(-age / 2.6);
      } else if (E.kind === 'cock') {
        // out sideways from the cylinder (the side the emitter is on, in the world), forward a little, then rolling and rising
        const q = at(te, [E.p[0], E.p[1], E.p[2] * 2]), sx = q[0] - p0[0], sz = q[2] - p0[2], sl = Math.hypot(sx, sz) || 1;
        const f = at(te, [E.p[0] + 1, E.p[1], E.p[2]]), fx = f[0] - p0[0], fz = f[2] - p0[2];
        const go = 3.2 * 0.55 * (1 - Math.exp(-age / 0.55)) * (0.7 + 0.6 * r3);
        x += (sx / sl) * go * (1 + r1 * 0.6) + fx * go * 0.35 + r2 * (0.3 + 0.5 * age) + 0.35 * age;
        z += (sz / sl) * go * (1 + r1 * 0.6) + fz * go * 0.35 + r1 * (0.3 + 0.5 * age);
        y += 0.12 + 0.28 * age + 0.06 * age * age + r3 * 0.15;
        size = 0.3 + 0.62 * age + 0.25 * r3; al = 0.3 * str * Math.min(1, age / 0.1) * Math.exp(-age / 2.0);
      } else {
        y += 6.0 * 0.35 * (1 - Math.exp(-age / 0.35)) + 0.6 * age; x += r1 * (0.05 + 0.4 * age) + 0.5 * age; z += r2 * (0.05 + 0.4 * age);
        size = 0.12 + 0.55 * age; al = 0.5 * str * Math.exp(-age / 0.9);
      }
      o.x = x; o.y = y; o.z = z; o.s = size; o.a = al; o.seed = _sh(j, 5); o.age = age; o.h = E.kind === 'chimney' ? Math.exp(-age * 2.0) : 0;
      o.d = (x - camera.position.x) ** 2 + (y - camera.position.y) ** 2 + (z - camera.position.z) ** 2;
    }
  }
  const order = S.list.slice().sort((a, b) => b.d - a.d), aC = S.mesh.geometry.attributes.aC, aD = S.mesh.geometry.attributes.aD;
  order.forEach((o, i) => { aC.setXYZW(i, o.x, o.y, o.z, o.s); aD.setXYZW(i, Math.max(0, o.a), o.seed, o.age, o.h); });
  aC.needsUpdate = true; aD.needsUpdate = true;
  S.mesh.visible = true;
}
function steamOff() { if (STEAM.mesh) STEAM.mesh.visible = false; }
function steamParked() { steamAt(30, (te, p) => [p[0], p[1], STN.z + p[2]], () => 0); }   // the train as built, standing
