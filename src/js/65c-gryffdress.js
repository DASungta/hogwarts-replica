// ------------------------------------------------------------------ Gryffindor Tower's dressing, after the films and the books
// On the turret stair (65-gryffindor.js) the other years' dormitory doors, each with its sign (the books, OotP: the sign on
// the dormitory door changes with the year). In the sixth years' dormitory (65b-gryffdorm.js) what the boys live with:
// shaded oil lamps at the bed heads (OotP, HBP), tin candle lanterns on the window seats and sweets on the beds (PoA),
// chocolate wrappers on the floor (HBP), shirts and T-shirts over the foot boards and jumpers on the pillows (c11-c13),
// towels on the stove's guard (c14, c16); and each boy's own things from the books, in our own designs: Harry's owl cage
// at the window, his broom against the bed, a photograph of his parents and his old potions book; Ron's Chudley Cannons
// poster, his maroon jumper with its R and an opened box of chocolates; Neville's potted Mimbulus mimbletonia and a
// herbology chart; Dean's football poster and his drawings; Seamus's Ireland poster and rosette.

// ---- materials
// the dormitory's and the turret's leaded lights: as the common room's, with a little moonlight in the night sky behind
M.dglass = procMat({ name: 'dglass', rgb: [1, 1, 1], rough: 0.1, uv: true, frag: HGLASS_GLSL(0.9).replace('vec3(0.012, 0.022, 0.05)', 'vec3(0.03, 0.055, 0.12)') });
// a lamp shade of painted tin: dark green outside, white inside and lit by the flame
M.tole = procMat({ name: 'tole', rgb: [1, 1, 1], metal: 0.4, rough: 0.4, side: THREE.DoubleSide, frag: /* glsl */ `
  if (gl_FrontFacing) diffuseColor.rgb = vec3(0.03, 0.055, 0.04) * (0.8 + 0.3 * cgFbm3(P * 30.0));
  else { diffuseColor.rgb = vec3(0.72, 0.7, 0.6); cgEmit = vec3(1.0, 0.72, 0.4) * (0.04 + 0.8 * uLamp); cgMetal = 0.0; cgRough = 0.8; }
` });
// the stove: cast iron painted a dull blue-grey (c14, c16); its lid pierced in rings, the fire's glow in the holes
M.stoveIron = procMat({ name: 'stoveIron', rgb: [0.2, 0.21, 0.23], metal: 0.35, rough: 0.55, bump: 1, frag: /* glsl */ `
  float n = cgFbm3(P * 14.0), w = smoothstep(0.6, 0.8, cgFbm3(P * 5.0 + 3.0));
  diffuseColor.rgb *= (0.75 + 0.45 * n) * (1.0 + 0.4 * w); cgRough = 0.5 + 0.25 * w; cgH = n * 0.001;
` });
M.stoveLid = procMat({ name: 'stoveLid', rgb: [0.21, 0.22, 0.24], metal: 0.35, rough: 0.55, frag: /* glsl */ `
  float r = length(P.xz), a = atan(P.z, P.x), ri = floor(r / 0.045), rg = fract(r / 0.045), ca = fract(a / 6.2832 * (12.0 + ri * 8.0));
  float hole = (1.0 - smoothstep(0.2, 0.3, abs(rg - 0.5))) * (1.0 - smoothstep(0.18, 0.3, abs(ca - 0.5))) * step(0.07, r) * step(r, 0.29);
  diffuseColor.rgb *= (0.75 + 0.4 * cgFbm3(P * 20.0)) * (1.0 - 0.85 * hole);
  cgEmit = vec3(1.0, 0.4, 0.1) * hole * (0.03 + 0.5 * uLamp);
` });
M.gslab = procMat({ name: 'gslab', rgb: [0.42, 0.39, 0.34], rough: 0.85, bump: 1, frag: /* glsl */ `
  float n = cgFbm3(P * 6.0); diffuseColor.rgb *= 0.8 + 0.3 * n; diffuseColor.rgb *= 1.0 - 0.3 * smoothstep(0.55, 0.8, cgFbm3(P * 2.0 + 5.0)); cgH = n * 0.002;
` });
// the guard: welded steel mesh in 42 mm squares of 3.5 mm wire (c14), seen through by its coverage
M.gcage = procMat({ name: 'gcage', rgb: [0.3, 0.3, 0.31], metal: 0.6, rough: 0.4, uv: true, side: THREE.DoubleSide, std: { transparent: true, depthWrite: false }, frag: /* glsl */ `
  vec2 g = abs(fract(UV / 0.042) - 0.5); float px = length(fwidth(UV / 0.042));
  float wire = smoothstep(0.458 - px - 0.01, 0.458 + px, max(g.x, g.y));
  diffuseColor.a = mix(wire, 0.17, smoothstep(0.15, 0.45, px));
` });
M.cageWire = procMat({ name: 'cageWire', rgb: [0.3, 0.3, 0.31], metal: 0.6, rough: 0.4 });
M.gwax = procMat({ name: 'gwax', rgb: [0.62, 0.56, 0.44], rough: 0.5 });
M.gflame = procMat({ name: 'gflame', rgb: [0, 0, 0], rough: 1, frag: /* glsl */ `cgEmit = vec3(1.0, 0.62, 0.25) * (0.4 + 3.0 * uLamp);` });
M.lglass = procMat({ name: 'lglass', rgb: [0.6, 0.55, 0.45], rough: 0.15, std: { transparent: true, depthWrite: false }, frag: /* glsl */ `
  diffuseColor.a = 0.2; cgEmit = vec3(1.0, 0.7, 0.4) * 0.1 * uLamp;
` });
// flannel checks (c11, c12): the instance colour and navy in broad bands, a pale overcheck (uv in metres)
M.plaid = procMat({ name: 'plaid', rgb: [1, 1, 1], rough: 0.95, uv: true, inst: true, side: THREE.DoubleSide, bump: 1, frag: /* glsl */ `
  vec2 f = fract(UV / 0.1); float sx = step(0.5, f.x), sy = step(0.5, f.y);
  vec3 c = mix(vInstC, vec3(0.04, 0.06, 0.14), 0.5 * (sx + sy));
  c = mix(c, vec3(0.7, 0.68, 0.58), 0.55 * max(step(abs(f.x - 0.25), 0.02), step(abs(f.y - 0.25), 0.02)));
  float tw = cgVn(vec3(UV * 400.0, 1.0)); diffuseColor.rgb = c * (0.8 + 0.3 * tw); cgH = tw * 0.0005;
` });
// plain knits and cottons (the instance colour): jumpers, T-shirts, towels
M.knit = procMat({ name: 'knit', rgb: [1, 1, 1], rough: 0.95, inst: true, side: THREE.DoubleSide, bump: 1, frag: /* glsl */ `
  float k = cgVn(P * 260.0), n = cgFbm3(P * 9.0); diffuseColor.rgb = vInstC * (0.75 + 0.25 * k + 0.2 * n); cgH = k * 0.0006 + n * 0.002;
` });
// printed card (sweet boxes) and twisted foil (wrappers), coloured per instance
M.card = procMat({ name: 'card', rgb: [1, 1, 1], rough: 0.45, inst: true, frag: /* glsl */ `
  diffuseColor.rgb = vInstC * (0.8 + 0.3 * step(0.5, fract(P.y * 60.0 + P.x * 20.0)));
` });
M.foil = procMat({ name: 'foil', rgb: [1, 1, 1], metal: 0.7, rough: 0.3, inst: true, frag: /* glsl */ `diffuseColor.rgb = vInstC * (0.7 + 0.5 * cgVn(P * 300.0));` });
// a broom's tail: birch twigs along the cone (uv.x round it), darker in the bundle
M.twigs = procMat({ name: 'twigs', rgb: [0.3, 0.19, 0.09], rough: 0.8, uv: true, side: THREE.DoubleSide, bump: 1, frag: /* glsl */ `
  float s = cgVn(vec3(UV.x * 240.0, UV.y * 2.0, 1.0)), t = cgVn(vec3(UV.x * 90.0, UV.y * 1.0, 4.0));
  diffuseColor.rgb *= (0.5 + 0.7 * s) * (0.75 + 0.4 * t); cgH = s * 0.002;
` });
M.gpot = procMat({ name: 'gpot', rgb: [0.42, 0.2, 0.11], rough: 0.85, frag: /* glsl */ `diffuseColor.rgb *= 0.8 + 0.3 * cgFbm3(P * 20.0);` });
// Mimbulus mimbletonia: grey-green and covered in boils (the books: OotP)
M.mimbulus = procMat({ name: 'mimbulus', rgb: [0.22, 0.27, 0.2], rough: 0.6, bump: 1, frag: /* glsl */ `
  float n = cgFbm3(P * 60.0), sp = smoothstep(0.6, 0.75, cgVn(P * 140.0));
  diffuseColor.rgb *= (0.8 + 0.35 * n) * (1.0 - 0.35 * sp); cgH = n * 0.002 + sp * 0.001;
` });

// ---- signs and posters (canvas)
// a brass sign with the year engraved, for the dormitory doors
function plaqueMat(text) {
  const t = canvasTex(512, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#a7843d'); gr.addColorStop(0.45, '#d9b866'); gr.addColorStop(1, '#7d5f26');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#4e3a12'; g.lineWidth = 5; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = '#5b4418'; for (const [x, y] of [[24, 24], [w - 24, 24], [24, h - 24], [w - 24, h - 24]]) { g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); }
    g.fillStyle = '#26190a'; g.font = 'italic 62px "Times New Roman", serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 3);
  });
  return procMat({ name: 'plaque', rgb: [1, 1, 1], metal: 0.35, rough: 0.35, std: { map: t } });
}
// posters and papers on the bed panels, in our own designs after what the books say the boys put up
function posterMat(kind) {
  const R = rng('poster-' + kind);
  const t = canvasTex(256, 352, (g, w, h) => {
    const font = (px, s = '') => { g.font = `${s} ${px}px "Times New Roman", serif`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; };
    if (kind === 'cannons') {   // Ron (PS, CoS): bright orange, two black Cs and a speeding cannonball
      g.fillStyle = '#dd6914'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#140a03'; g.lineWidth = 7; g.strokeRect(10, 10, w - 20, h - 20);
      g.lineWidth = 24; for (const x of [98, 158]) { g.beginPath(); g.arc(x, 165, 56, 0.8, 2 * Math.PI - 0.8); g.stroke(); }
      g.fillStyle = '#140a03'; g.beginPath(); g.arc(198, 62, 21, 0, 7); g.fill();
      g.lineWidth = 3; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(178 - i * 3, 56 + i * 5); g.lineTo(80 - i * 10, 70 + i * 12); g.stroke(); }
      font(36, 'bold'); g.fillText('CHUDLEY', w / 2, 278); g.fillText('CANNONS', w / 2, 318);
    } else if (kind === 'westham') {   // Dean (PS): his football team in claret and blue, lined up for their photograph
      g.fillStyle = '#6e1b30'; g.fillRect(0, 0, w, h);
      const sky = g.createLinearGradient(0, 110, 0, 330); sky.addColorStop(0, '#a9c3d3'); sky.addColorStop(0.55, '#c8d6dc'); sky.addColorStop(0.56, '#4d7a3c'); sky.addColorStop(1, '#3d6630');
      g.fillStyle = sky; g.fillRect(16, 110, w - 32, 222);
      g.fillStyle = '#efe6d2'; font(40, 'bold'); g.fillText('WEST HAM', w / 2, 62); font(20); g.fillText('UNITED', w / 2, 92);
      for (const [n, y, s] of [[6, 215, 1.0], [5, 285, 1.1]]) for (let i = 0; i < n; i++) {
        const x = w / 2 + (i - (n - 1) / 2) * 36;
        g.fillStyle = '#e2c09c'; g.beginPath(); g.arc(x, y - 30 * s, 7 * s, 0, 7); g.fill();
        g.fillStyle = '#6e1b30'; g.fillRect(x - 10 * s, y - 22 * s, 20 * s, 24 * s);
        g.fillStyle = '#7fb0d6'; g.fillRect(x - 14 * s, y - 22 * s, 4 * s, 13 * s); g.fillRect(x + 10 * s, y - 22 * s, 4 * s, 13 * s);
        g.fillStyle = '#f2eee4'; g.fillRect(x - 9 * s, y + 2 * s, 18 * s, 10 * s);
        g.fillStyle = '#6e1b30'; g.fillRect(x - 8 * s, y + 12 * s, 5 * s, 14 * s); g.fillRect(x + 3 * s, y + 12 * s, 5 * s, 14 * s);
      }
    } else if (kind === 'ireland') {   // Seamus (GoF: Ireland at the Quidditch World Cup): green, a shamrock
      g.fillStyle = '#137a45'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#e9d9a0'; g.lineWidth = 5; g.strokeRect(12, 12, w - 24, h - 24);
      g.strokeStyle = '#a8e08f'; g.lineWidth = 8; g.beginPath(); g.moveTo(w / 2, 150); g.quadraticCurveTo(w / 2 + 6, 200, w / 2 + 30, 222); g.stroke();
      g.fillStyle = '#a8e08f';
      for (const a of [-Math.PI / 2, -Math.PI / 2 + 2.1, -Math.PI / 2 - 2.1]) {
        g.save(); g.translate(w / 2, 145); g.rotate(a + Math.PI / 2);
        g.beginPath(); g.arc(-15, -42, 21, Math.PI, 0); g.arc(15, -42, 21, Math.PI, 0); g.lineTo(0, -4); g.closePath(); g.fill(); g.restore();
      }
      g.fillStyle = '#f3e8c2'; font(44, 'bold'); g.fillText('IRELAND', w / 2, 285); font(19); g.fillText('QUIDDITCH WORLD CUP', w / 2, 318);
    } else if (kind === 'herbology') {   // Neville: a herbology chart, a mandrake with its root like a little man
      g.fillStyle = '#c6ae80'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(90,60,20,${R() * 0.12})`; g.fillRect(R() * w, R() * h, 2 + R() * 6, 2 + R() * 6); }
      g.fillStyle = '#3a2810'; g.strokeStyle = '#3a2810'; font(24, 'italic'); g.fillText('Mandragora', w / 2, 40);
      g.lineWidth = 2;
      for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.32; g.save(); g.translate(w / 2, 140); g.rotate(a + Math.PI / 2); g.beginPath(); g.ellipse(0, -38, 11, 38, 0, 0, 7); g.stroke(); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -72); g.stroke(); g.restore(); }
      g.beginPath(); g.ellipse(w / 2, 200, 26, 46, 0, 0, 7); g.stroke();
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(w / 2 + s * 20, 185); g.quadraticCurveTo(w / 2 + s * 50, 200, w / 2 + s * 56, 228); g.stroke(); g.beginPath(); g.moveTo(w / 2 + s * 10, 242); g.quadraticCurveTo(w / 2 + s * 20, 275, w / 2 + s * 30, 300); g.stroke(); }
      for (let i = 0; i < 6; i++) { const y = 70 + i * 42, x = i % 2 ? 214 : 28; g.beginPath(); g.moveTo(x, y); g.lineTo(i % 2 ? 170 : 80, y + 14); g.stroke(); for (let j = 0; j < 3; j++) g.fillRect(x - (i % 2 ? 30 : 6), y - 10 + j * 5, 34 - j * 8, 1.5); }
    } else if (kind === 'sketch') {   // Dean, who draws (PS): a pencil lion on a loose sheet
      g.fillStyle = '#e4dccb'; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(40,38,36,0.7)'; g.lineWidth = 1.2;
      for (let i = 0; i < 90; i++) { const a = R() * Math.PI * 2, r0 = 55 + R() * 10, r1 = 95 + R() * 30; g.beginPath(); g.moveTo(w / 2 + Math.cos(a) * r0, 160 + Math.sin(a) * r0); g.quadraticCurveTo(w / 2 + Math.cos(a + 0.2) * (r0 + r1) / 2, 160 + Math.sin(a + 0.2) * (r0 + r1) / 2, w / 2 + Math.cos(a + 0.1) * r1, 160 + Math.sin(a + 0.1) * r1); g.stroke(); }
      g.lineWidth = 2; g.beginPath(); g.ellipse(w / 2, 168, 46, 56, 0, 0, 7); g.stroke();
      for (const s of [-1, 1]) { g.beginPath(); g.ellipse(w / 2 + s * 18, 150, 8, 5, 0, 0, 7); g.stroke(); }
      g.beginPath(); g.moveTo(w / 2 - 12, 190); g.lineTo(w / 2, 200); g.lineTo(w / 2 + 12, 190); g.stroke(); g.beginPath(); g.moveTo(w / 2, 200); g.lineTo(w / 2, 212); g.stroke();
      g.fillStyle = 'rgba(40,38,36,0.6)'; font(18, 'italic'); g.fillText('D. Thomas', w - 60, h - 24);
    } else if (kind === 'pennant') {   // a Gryffindor pennant: a red felt triangle, a gold border, a gold lion
      g.clearRect(0, 0, w, h);
      g.fillStyle = '#e0b84e'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, 0); g.lineTo(w / 2, h); g.closePath(); g.fill();
      g.fillStyle = '#7c0f12'; g.beginPath(); g.moveTo(14, 10); g.lineTo(w - 14, 10); g.lineTo(w / 2, h - 26); g.closePath(); g.fill();
      g.fillStyle = '#e0b84e'; g.fillRect(14, 10, w - 28, 26);
      g.save(); g.translate(w / 2, 120); g.fillStyle = '#d9b04a';
      g.beginPath(); g.ellipse(0, 0, 34, 22, 0, 0, 7); g.fill(); g.beginPath(); g.arc(-34, -18, 16, 0, 7); g.fill();
      for (const x of [-26, -10, 12, 26]) g.fillRect(x - 4, 10, 8, 30);
      g.lineWidth = 6; g.strokeStyle = '#d9b04a'; g.beginPath(); g.moveTo(32, -6); g.quadraticCurveTo(58, -30, 50, -50); g.stroke(); g.restore();
    } else if (kind === 'photo') {   // Harry: an old photograph of his mother and father (PS: Hagrid's album)
      const gr = g.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, 220); gr.addColorStop(0, '#9a7c55'); gr.addColorStop(1, '#3b2a18');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (const [x, y, s, c] of [[100, 150, 1.0, '#e2c9a0'], [160, 140, 1.08, '#d8bf96']]) {
        g.fillStyle = '#2e2216'; g.beginPath(); g.ellipse(x, y + 12 * s, 30 * s, 34 * s, 0, 0, 7); g.fill();
        g.fillStyle = c; g.beginPath(); g.ellipse(x, y, 22 * s, 28 * s, 0, 0, 7); g.fill();
        g.fillStyle = '#2b2015'; g.beginPath(); g.moveTo(x - 46 * s, h); g.quadraticCurveTo(x - 40 * s, y + 46 * s, x, y + 40 * s); g.quadraticCurveTo(x + 40 * s, y + 46 * s, x + 46 * s, h); g.fill();
      }
      g.fillStyle = 'rgba(255,240,210,0.08)'; for (let i = 0; i < 300; i++) g.fillRect(R() * w, R() * h, 1.5, 1.5);
    }
  });
  return procMat({ name: 'poster', rgb: [1, 1, 1], rough: 0.8, std: kind === 'pennant' ? { map: t, alphaTest: 0.5, side: THREE.DoubleSide } : { map: t } });
}

// ---- pieces
// a door to another year's dormitory on the turret stair at angle a round the newel, its sill on the tread at y: a stone
// surround proud of the curved wall, an oak leaf with strap hinges and a ring handle, and the year on a brass sign
function gtYearDoor(a, y, sign) {
  const { rr, c } = GT, p = { hw: 0.32, ys: 1.6, k: 0.56 }, d = rr - 0.035;
  const m = xf([c[0] + Math.cos(a) * d, y, c[2] + Math.sin(a) * d], Math.atan2(-Math.cos(a), -Math.sin(a)));
  const ring = pathPts(new THREE.Shape(), opn(p, 0.15)); ring.holes.push(pathPts(new THREE.Path(), opn(p), true));
  put('tread', new THREE.ExtrudeGeometry(ring, { depth: 0.09, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 1, curveSegments: 8 }).translate(0, 0, -0.03).applyMatrix4(m));
  put('door', uvPlanar(new THREE.ExtrudeGeometry(pathPts(new THREE.Shape(), opn(p)), { depth: 0.05, bevelEnabled: false, curveSegments: 8 }).translate(0, 0, -0.04)).applyMatrix4(m));
  for (const yy of [0.3, 1.3]) put('paintBlack', new THREE.BoxGeometry(0.5, 0.045, 0.012).translate(-0.07, yy, 0.016).applyMatrix4(m));
  put('paintBlack', new THREE.TorusGeometry(0.045, 0.007, 6, 16).translate(0.2, 0.92, 0.03).applyMatrix4(m));
  put('paintBlack', new THREE.CylinderGeometry(0.03, 0.03, 0.01, 12).rotateX(Math.PI / 2).translate(0.2, 0.97, 0.014).applyMatrix4(m));
  put('brass', new THREE.BoxGeometry(0.37, 0.1, 0.006).translate(0, 1.55, 0.013).applyMatrix4(m));
  addMesh(new THREE.PlaneGeometry(0.34, 0.085).translate(0, 1.55, 0.0175).applyMatrix4(m), plaqueMat(sign), { cast: false });
}
// a shaded oil lamp (OotP, HBP): brass fount and burner, a glass chimney, a wide tole shade on three arms; light at y 0.2
const GD_LAMP = {
  brass: merge([
    lathe([[0, 0], [0.055, 0], [0.07, 0.025], [0.068, 0.06], [0.04, 0.085], [0.028, 0.1], [0.032, 0.115], [0.03, 0.13], [0, 0.13]], 20),
    new THREE.CylinderGeometry(0.026, 0.03, 0.03, 16).translate(0, 0.145, 0),
    ...[0, 1, 2].map((i) => new THREE.CylinderGeometry(0.003, 0.003, 0.11, 4).rotateZ(-0.9).translate(0.045, 0.2, 0).applyMatrix4(new THREE.Matrix4().makeRotationY(i * 2.094))),
  ]),
  chimney: lathe([[0, 0.15], [0.022, 0.15], [0.032, 0.19], [0.02, 0.24], [0.018, 0.34], [0, 0.34]], 16),
  shade: new THREE.CylinderGeometry(0.05, 0.15, 0.1, 28, 1, true).translate(0, 0.24, 0),
};
// a tin candle lantern (PoA): base, corner posts, glass, a pyramid roof and a ring; a candle inside
const GD_LANTERN = (() => {
  const tin = [new THREE.BoxGeometry(0.13, 0.02, 0.13).translate(0, 0.01, 0), new THREE.BoxGeometry(0.13, 0.015, 0.13).translate(0, 0.2, 0),
    new THREE.ConeGeometry(0.1, 0.07, 4, 1).rotateY(Math.PI / 4).translate(0, 0.243, 0), new THREE.TorusGeometry(0.025, 0.004, 6, 12).translate(0, 0.29, 0)];
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) tin.push(new THREE.BoxGeometry(0.01, 0.19, 0.01).translate(x * 0.06, 0.105, z * 0.06));
  return { tin: merge(tin), glass: new THREE.BoxGeometry(0.115, 0.17, 0.115).translate(0, 0.105, 0),
    candle: new THREE.CylinderGeometry(0.018, 0.018, 0.07, 10).translate(0, 0.055, 0), flame: new THREE.SphereGeometry(0.011, 8, 6).scale(1, 2.2, 1).translate(0, 0.11, 0) };
})();
// a cloth hung over a rail of radius r: l1 hanging on the near side, l2 on the far (local: the rail along x at the
// origin, the far side toward +z), folds growing toward the hems; uv in metres
function drapeGeo(w, l1, l2, r, seed) {
  const arc = Math.PI * r, L = l1 + arc + l2, g = new THREE.PlaneGeometry(w, L, 10, 28), p = g.attributes.position, R = rng('drape' + seed), ph = [R() * 6, R() * 6];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), s = p.getY(i) + L / 2;
    let y, z;
    if (s < l1) { y = -(l1 - s); z = -r; } else if (s < l1 + arc) { const q = (s - l1) / r; y = Math.sin(q) * r; z = -Math.cos(q) * r; } else { y = -(s - l1 - arc); z = r; }
    const hang = Math.max(0, -y), fold = 0.012 * Math.sin(x * 22 + ph[0] + s * 3) * Math.min(1, hang * 4) + 0.012 * Math.sin(x * 9 + ph[1]) * hang;
    p.setXYZ(i, x * (1 - 0.08 * hang), y, z + (z < 0 ? -1 : 1) * (fold + 0.004));
  }
  g.computeVertexNormals();
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * L);
  return g;
}
// a folded, lumpy heap of knitting (a jumper on a bed)
function lumpGeo(w, h, d, seed) {
  const g = new RoundedBoxGeometry(w, h, d, 5, Math.min(h / 2.2, 0.035)), p = g.attributes.position, R = rng('lump' + seed), ph = [R() * 6, R() * 6, R() * 6];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), top = y > 0 ? 1 : 0;
    p.setY(i, y + top * (0.025 * Math.sin(x * 14 + ph[0]) * Math.cos(z * 11 + ph[1]) + 0.015 * Math.sin(x * 31 + z * 23 + ph[2])));
  }
  g.computeVertexNormals();
  return g;
}
// Hedwig's cage: a round brass tray, eighteen bars rising into a dome, three rings, a perch and a ring to hang it by
function gdCageGeo() {
  const P = [lathe([[0, 0], [0.2, 0], [0.21, 0.015], [0.2, 0.05], [0.185, 0.05], [0, 0.05]], 28)], R0 = 0.18, H = 0.4;
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2, pts = [];
    for (let j = 0; j <= 12; j++) { const t = j / 12; let r, y; if (t < 0.6) { r = R0; y = 0.05 + ((H - 0.05) * t) / 0.6; } else { const q = ((t - 0.6) / 0.4) * (Math.PI / 2); r = R0 * Math.cos(q) + 0.002; y = H + R0 * 0.7 * Math.sin(q); } pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r)); }
    P.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.0035, 4));
  }
  for (const y of [0.06, 0.25, H]) P.push(new THREE.TorusGeometry(R0, 0.005, 6, 40).rotateX(Math.PI / 2).translate(0, y, 0));
  P.push(new THREE.TorusGeometry(0.04, 0.007, 6, 16).translate(0, H + R0 * 0.7 + 0.04, 0), new THREE.CylinderGeometry(0.006, 0.006, 0.36, 6).rotateZ(Math.PI / 2).translate(0, 0.2, 0));
  return merge(P);
}
// Harry's broom: a long polished handle, binding bands, a tail of birch twigs (along +y from the tail's end)
function gdBroom() {
  const handle = lathe([[0, 0.42], [0.021, 0.42], [0.02, 1.2], [0.017, 1.7], [0.012, 1.86], [0, 1.87]], 12);
  const tail = new THREE.CylinderGeometry(0.035, 0.12, 0.55, 24, 1, true).translate(0, 0.275, 0), u = tail.attributes.uv;
  for (let i = 0; i < u.count; i++) u.setXY(i, u.getX(i) * 0.7, u.getY(i) * 0.55);
  const bands = merge([0.47, 0.53].map((y) => new THREE.TorusGeometry(0.04 - (y - 0.47) * 0.15, 0.006, 6, 16).rotateX(Math.PI / 2).translate(0, y, 0)));
  return { handle, tail, bands };
}

// ---- the dressing of the dormitory (called from buildGryffDorm)
function gdDress() {
  const B = Object.fromEntries(GDM_BEDS.map(([k, ini]) => [ini.replace('.', ''), k]));   // each boy's bed facet: B.HP, B.RW, B.NL, B.DT, B.SF
  const R = rng('gdress'), bed = (k) => gdM(k, 0, 0, 0.42), at = (m, p, ry = 0, s = 1, rx = 0, rz = 0) => m.clone().multiply(xf(p, ry, s, rx, rz)), v = new THREE.Vector3();
  const lantern = (m) => {
    addInst(GD_LANTERN.tin, M.castIron, [m]); addInst(GD_LANTERN.candle, M.gwax, [m], null, { cast: false });
    addInst(GD_LANTERN.flame, M.gflame, [m], null, { cast: false, recv: false }); addInst(GD_LANTERN.glass, M.lglass, [m], null, { cast: false, recv: false });
    v.set(0, 0.12, 0).applyMatrix4(m); LAMPS.push({ room: GCR_ROOM, p: [v.x, v.y, v.z], c: [1.0, 0.58, 0.26].map((q) => q * 1.1), r: 2.0, halo: 0.07, hk: 0.4, see: 20 });
  };
  const seat = (k, u, w = -0.3, turn = 0) => gdM(k, u, GDM_SILL, w, turn);   // on a window ledge (the embrasure's sill, 65b)
  // candle lanterns on three window seats (PoA)
  lantern(seat(1, -0.06, -0.25)); lantern(seat(5, 0.06, -0.25)); lantern(seat(11, -0.04, -0.25));
  // Hedwig's cage on the seat between Harry's bed and Ron's, a white feather by it
  addInst(gdCageGeo(), M.brass, [seat(B.HP + 1, 0.0, -0.33, 0.4)]);
  addInst(new THREE.PlaneGeometry(0.03, 0.13).rotateX(-Math.PI / 2), M.linen, [seat(B.HP + 1, 0.2, -0.08, 0.9)].map((m) => at(m, [0, 0.006, 0])), null, { cast: false });
  // on the seat on Harry's other side (between him and Dean): a photograph of his parents in a frame, and books
  { const m = seat(B.HP - 1, 0.1, -0.38, 0.2); put('fwood', new THREE.BoxGeometry(0.17, 0.22, 0.02).translate(0, 0.11, 0).applyMatrix4(at(m, [0, 0, 0], 0, 1, -0.2))); addMesh(new THREE.PlaneGeometry(0.135, 0.185).translate(0, 0.11, 0.011).applyMatrix4(at(m, [0, 0, 0], 0, 1, -0.2)), posterMat('photo'), { cast: false }); }
  // Neville's Mimbulus mimbletonia in its pot on the seat by his bed
  {
    const m = seat(B.NL + 1, 0.04, -0.3), P = [];
    put('gpot', lathe([[0, 0], [0.055, 0], [0.072, 0.11], [0.08, 0.115], [0.078, 0.125], [0.066, 0.12], [0, 0.11]], 20).applyMatrix4(m));
    for (let i = 0; i < 7; i++) { const a = R() * 6.28, r = i ? 0.03 + R() * 0.03 : 0, s = 0.035 + R() * 0.02; P.push(new THREE.SphereGeometry(s, 14, 10).scale(1, 1.25, 1).translate(Math.cos(a) * r, 0.14 + s + (i ? R() * 0.05 : 0.03), Math.sin(a) * r)); }
    for (let i = 0; i < 26; i++) { const a = R() * 6.28, y = 0.15 + R() * 0.12; P.push(new THREE.SphereGeometry(0.007 + R() * 0.005, 6, 4).translate(Math.cos(a) * (0.05 + R() * 0.02), y, Math.sin(a) * (0.05 + R() * 0.02))); }
    put('mimbulus', merge(P).applyMatrix4(m));
  }
  // the boys' things at their beds and on their panels (the back panel: the wall frame of the bed's facet)
  const panel = (k, x, y, w, h, mat, rz = 0) => addMesh(new THREE.PlaneGeometry(w, h).applyMatrix4(gdM(k).multiply(xf([x, y, 0.082], 0, 1, 0, rz))), mat, { cast: false });
  panel(B.RW, -0.45, 1.82, 0.34, 0.47, posterMat('cannons'), 0.03);
  panel(B.NL, -0.45, 1.84, 0.32, 0.44, posterMat('herbology'), -0.02);
  panel(B.DT, -0.45, 1.82, 0.34, 0.47, posterMat('westham'), -0.03);
  { const sk = posterMat('sketch'); panel(B.DT, 0.4, 1.93, 0.17, 0.23, sk, 0.08); panel(B.DT, 0.52, 1.72, 0.17, 0.23, sk, -0.06); }
  panel(B.SF, -0.45, 1.82, 0.34, 0.47, posterMat('ireland'), 0.02);
  { const pn = posterMat('pennant'); panel(B.HP, -0.45, 1.84, 0.3, 0.44, pn, 0.02); panel(B.RW, 0.45, 1.84, 0.3, 0.44, pn, -0.03); }
  {   // Seamus's rosette: pleated green rings and two ribbon tails
    const g = new THREE.CircleGeometry(0.075, 48, 0), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), a = Math.atan2(y, x), r = Math.hypot(x, y); p.setZ(i, 0.006 * Math.sin(a * 24) * (r / 0.075)); }
    g.computeVertexNormals();
    const tails = [-1, 1].map((s) => new THREE.PlaneGeometry(0.035, 0.12).translate(0, -0.08, -0.002).applyMatrix4(new THREE.Matrix4().makeRotationZ(s * 0.25)));
    addInst(merge([g, new THREE.CircleGeometry(0.035, 24).translate(0, 0, 0.008), ...tails]), M.knit, [gdM(B.SF).multiply(xf([0.45, 1.88, 0.09], 0, 1))], [[0.05, 0.3, 0.13]], { cast: false });
  }
  // clothes: checked shirts and a T-shirt over foot boards (c11, c12), jumpers on beds (c13); Ron's maroon one has his R
  const plaidL = [], plaidC = [], knitL = [], knitC = [];
  const drape = (k, z, w, l1, l2, seed, list, cols, col, sx = -1) => { list.push(at(bed(k), [sx * 0.565, 0.795, z], sx * -Math.PI / 2 + (R() - 0.5) * 0.12)); cols.push(col); return drapeGeo(w, l1, l2, 0.035, seed); };
  addInst(drape(B.HP, 1.45, 0.34, 0.3, 0.36, 1, plaidL, plaidC, [0.42, 0.05, 0.05]), M.plaid, plaidL.splice(0), plaidC.splice(0));
  addInst(drape(B.HP, 1.85, 0.3, 0.25, 0.3, 5, knitL, knitC, [0.42, 0.43, 0.44]), M.knit, knitL.splice(0), knitC.splice(0));
  addInst(drape(B.DT, 1.6, 0.36, 0.28, 0.34, 2, plaidL, plaidC, [0.08, 0.2, 0.12], 1), M.plaid, plaidL.splice(0), plaidC.splice(0));
  addInst(drape(B.DT, 0.7, 0.36, 0.2, 0.3, 6, knitL, knitC, [0.62, 0.6, 0.55]), M.knit, knitL.splice(0), knitC.splice(0));
  addInst(drape(B.RW, 1.7, 0.34, 0.22, 0.32, 3, knitL, knitC, [0.3, 0.3, 0.31], 1), M.knit, knitL.splice(0), knitC.splice(0));
  addInst(drape(B.NL, 1.5, 0.38, 0.26, 0.3, 4, knitL, knitC, [0.12, 0.14, 0.2]), M.knit, knitL.splice(0), knitC.splice(0));
  addInst(lumpGeo(0.46, 0.08, 0.34, 1), M.knit, [at(bed(B.RW), [-0.12, 0.8, 1.45], 0.3)], [[0.2, 0.025, 0.035]]);
  addMesh(new THREE.PlaneGeometry(0.13, 0.13).rotateX(-Math.PI / 2).applyMatrix4(at(bed(B.RW), [-0.12, 0.848, 1.45], 0.3)), letterMat('R', '#c99a34', 92), { cast: false });
  addInst(lumpGeo(0.42, 0.07, 0.3, 2), M.knit, [at(bed(B.SF), [0.12, 0.92, 0.5], -0.4)], [[0.19, 0.12, 0.07]]);
  // grey knitted socks hung over the guard's rim to dry (c14, c16)
  {
    const L = [], C = [];
    for (const [a, c] of [[2.3, [0.4, 0.4, 0.4]], [2.75, [0.47, 0.47, 0.46]], [3.9, [0.34, 0.34, 0.36]], [5.3, [0.44, 0.43, 0.41]]]) { const x = Math.cos(a) * 0.46, z = Math.sin(a) * 0.46; L.push(xf([x, GDM.Y + 0.88, z], Math.atan2(x, z))); C.push(c); }
    addInst(drapeGeo(0.085, 0.16, 0.34, 0.013, 9), M.knit, L, C, { cast: false });
  }
  // sweets: Ron's opened box of chocolates and wrappers on his bed and the floor (HBP); frogs and beans on Seamus's bed (PoA)
  {
    const box = [], boxC = [], foil = [], foilC = [], b4 = bed(B.RW), b10 = bed(B.SF);
    addInst(merge([new THREE.CylinderGeometry(0.1, 0.1, 0.045, 28).translate(0, 0.0225, 0)]), M.card, [at(b4, [0.25, 0.79, 0.95], 0.3)], [[0.62, 0.12, 0.25]]);
    addInst(new THREE.CylinderGeometry(0.105, 0.105, 0.03, 28).translate(0, 0.015, 0), M.card, [at(b4, [0.42, 0.8, 1.2], 0.9, 1, 0.25, 0.1)], [[0.7, 0.16, 0.3]]);
    const sweets = [[0.38, 0.12, 0.62], [0.55, 0.42, 0.08], [0.15, 0.4, 0.2], [0.6, 0.08, 0.1], [0.75, 0.66, 0.2]];
    for (let i = 0; i < 4; i++) { box.push(at(b10, [-0.25 + R() * 0.5, 0.8, 0.9 + R() * 0.7], R() * 6)); boxC.push(i < 2 ? [0.3, 0.1, 0.45] : [0.7, 0.5, 0.12]); }
    addInst(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 5).translate(0, 0.015, 0), M.card, box, boxC);
    for (let i = 0; i < 9; i++) { foil.push(at(b4, [-0.3 + R() * 0.6, 0.79, 0.8 + R() * 1.0], R() * 6, [1, 0.35, 1])); foilC.push(sweets[i % 5]); }
    for (let i = 0; i < 26; i++) {
      const x = (R() - 0.5) * 2.2, z = 0.6 + R() * 2.4; if (Math.abs(x) < 0.7 && z < 2.15) continue;
      foil.push(at(b4, [x, 0.008, z], R() * 6, [1, 0.35, 1])); foilC.push(sweets[i % 5]);
    }
    addInst(new THREE.IcosahedronGeometry(0.02, 0), M.foil, foil, foilC, { cast: false });
  }
  // Harry's broom against the foot of his bed, his old potions book and a folded map on the trunk
  {
    const BR = gdBroom(), b2 = bed(B.HP), base = new THREE.Vector3(0.92, 0.0, 2.34), top = new THREE.Vector3(0.69, 1.8, 2.16), dir = top.clone().sub(base).normalize();
    const m = b2.clone().multiply(new THREE.Matrix4().compose(base, new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir), new THREE.Vector3(1, 1, 1)));
    put('fwood', BR.handle.applyMatrix4(m)); put('twigs', BR.tail.applyMatrix4(m)); put('brass', BR.bands.applyMatrix4(m));
    addInst(new THREE.BoxGeometry(1, 1, 1), M.bookCover, [at(b2, [-0.15, 0.82, 0.75], 0.4, [0.17, 0.035, 0.24])], [[0.16, 0.1, 0.05]]);
    addInst(new THREE.BoxGeometry(0.97, 0.86, 0.94), M.pages, [at(b2, [-0.15, 0.82, 0.75], 0.4, [0.17, 0.035, 0.24])], null, { cast: false });
    put('parchment', new THREE.BoxGeometry(0.2, 0.012, 0.14).applyMatrix4(at(b2, [0.12, 0.45, 2.55], -0.3)));
  }
  // books on Neville's trunk and the seat by Harry's bed
  {
    const BL = [], BC = [], COLS = [[0.2, 0.05, 0.04], [0.06, 0.1, 0.05], [0.12, 0.08, 0.04], [0.05, 0.06, 0.12], [0.22, 0.17, 0.08]];
    const stack = (m, n) => { let y = 0; for (let i = 0; i < n; i++) { const h = 0.03 + R() * 0.03; BL.push(at(m, [(R() - 0.5) * 0.03, y + h / 2, (R() - 0.5) * 0.03], (R() - 0.5) * 0.5, [0.18 + R() * 0.07, h, 0.13 + R() * 0.06])); BC.push(COLS[Math.floor(R() * COLS.length)]); y += h; } };
    stack(at(bed(B.NL), [-0.15, 0.44, 2.55]), 4); stack(seat(B.HP - 1, -0.1, -0.15), 3); stack(at(bed(B.DT), [0.2, 0.44, 2.55]), 2);
    addInst(new THREE.BoxGeometry(1, 1, 1), M.bookCover, BL, BC); addInst(new THREE.BoxGeometry(0.97, 0.86, 0.94).translate(0.02, 0, 0), M.pages, BL, null, { cast: false });
  }
  // shoes by each bed
  {
    const g = new RoundedBoxGeometry(0.1, 0.075, 0.27, 2, 0.035), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const z = p.getZ(i), t = Math.max(0, z / 0.135); p.setX(i, p.getX(i) * (1 - 0.25 * t)); p.setY(i, p.getY(i) * (1 - 0.35 * t) + 0.0375 - 0.012 * t); }
    g.computeVertexNormals();
    const L = []; for (const [k] of GDM_BEDS) { const a = (R() - 0.5) * 0.5; L.push(at(bed(k), [0.8, 0, 1.25], a), at(bed(k), [0.93, 0, 1.3], a + (R() - 0.5) * 0.3)); }
    addInst(g, M.strap, L);
  }
}
