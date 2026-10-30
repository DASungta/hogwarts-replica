// ------------------------------------------------------------------ the Gryffindor common room (after the Leavesden set: ref/gryffindor)
// A room in the tower, eight-sided, about 14 m across and 10.5 m to a timber ceiling. Walls of rough sandy-grey ashlar
// with pale mortar (c06), hung to about 5.5 m with red millefleur tapestries in the manner of the Lady and the Unicorn
// (c03, c08, c10): a rose-red ground full of small flowering plants and white animals, blue islands with trees, a lady,
// a lion and a unicorn holding standards (red, a blue bend with three crescents); gilt-framed paintings hang over them.
// North: the great fireplace (c06): a tapering stone hood up to the ceiling with the Gryffindor crest in relief, a deep
// moulded lintel, black with soot, on a pier and two cheeks; an inglenook seat with a little window to the left of the
// pier, the hearth to the right behind a wire screen, logs stacked by the pier. Three deep window bays with pointed
// splayed heads and cushioned seats (c06). South-east: the round-headed doorway to the dormitory stair, a stone newel
// stair turning up past a leaded window (c03, c10), an oak dresser with traceried doors beside it (c08). South: the
// portrait hole, three steps up to the back of the Fat Lady. Red velvet club chairs, a wingback, a sofa with a striped
// Gryffindor blanket, footstools, small oak tables on bobbin legs, a study table with spindle-back chairs, brass oil lamps
// with glass globes, a pierced brass ring chandelier (c08), Persian rugs, wizard chess on a table by a window.
// Set coordinates: the room's centre at the origin, north (the fireplace) toward -z. A regular octagon 11.6 m across.
const GCR = { A: 5.8, H: 9.2, T: 1.3, tap: [0.34, 5.0], string: 5.2 };   // sizes measured off c08: a wall face ~4.8 m
GCR.L = 2 * GCR.A * Math.tan(Math.PI / 8);   // a facet's width on the room face
// facet k (0 north, 2 east, 4 south, 6 west): d = outward direction, t = along the wall (local +x), ry = local frame's turn
function gcrF(k) { const a = (k * Math.PI) / 4; return { k, a, d: [Math.sin(a), -Math.cos(a)], t: [Math.cos(a), Math.sin(a)], ry: -a }; }
// facet-local (u along the wall, y up, w out of the wall into the room) to room coordinates
const gcrP = (k, u, y, w) => { const f = gcrF(k), r = GCR.A - w; return [f.d[0] * r + f.t[0] * u, y, f.d[1] * r + f.t[1] * u]; };
const gcrM = (k, u = 0, y = 0, w = 0, turn = 0, s = 1) => xf(gcrP(k, u, y, w), gcrF(k).ry + turn, s);
const GCR_ROOM = 'gryff';
const GCR_BAYS = [1, 7];   // the window bays either side of the fireplace (c06; 7, north-west, takes the sun)
const GCR_BAY = { hw: 1.3, hb: 0.8, ys: 3.0, k: 0.62, seat: 0.55, d: 1.0 };   // room-face / glass half widths, springing, seat

// ---- materials
// the walls: sandy to grey blocks about 62 x 30 cm, tooled faces, raised pale lime joints; black with soot round the
// fireplace (uSoot: centre, strength) and smoke-darkened toward the ceiling
const GCR_SOOT = { uSoot: { value: new THREE.Vector4(0.85, 0.0, -5.8, 1) } };   // the firebox: centre x, floor, back wall z; strength
// the soot of the fire: black inside the firebox and on the lintel's underside and lower edge, a plume rising up the middle
// of the hood, in drifts
const GCR_SOOT_GLSL = /* glsl */ `
uniform vec4 uSoot;
float gcrSoot(vec3 P) {
  vec3 q = P - uSoot.xyz; float n = cgFbm3(P * 1.3) - 0.5, m = cgFbm3(P * vec3(3.0, 0.8, 3.0)) - 0.5;
  float box = (1.0 - smoothstep(1.06, 1.5, abs(q.x) + 0.3 * n)) * (1.0 - smoothstep(1.9, 2.3, q.z + 0.3 * n));
  float inner = (1.0 - smoothstep(1.15, 1.36, abs(q.x))) * (1.0 - smoothstep(1.55, 1.7, q.z)) * (1.0 - smoothstep(3.0, 3.3, q.y)) * mix(0.8, 1.0, smoothstep(0.3, 1.5, q.y));
  float front = box * (1.0 - smoothstep(0.8, 1.25, length(vec2(q.x / 1.36, max(q.y - 2.1, 0.0) / 1.5)) + 0.35 * n));   // an arch of soot over the opening
  float low = max(inner, front);
  float plume = (1.0 - smoothstep(0.35, 1.3, abs(q.x - 0.25 * sin(q.y * 0.9)) + 0.5 * m)) * smoothstep(3.6, 4.2, q.y) * exp(-(q.y - 4.0) / 3.0) * 0.4;
  return clamp(max(low, plume), 0.0, 1.0);
}
`;
M.gstone = procMat({ name: 'gstone', rgb: [1, 1, 1], rough: 0.9, bump: 1, uv: true, uniforms: GCR_SOOT, head: GCR_SOOT_GLSL, frag: /* glsl */ `
  vec2 uv = abs(N.y) > 0.75 ? P.xz : UV;
  vec2 bs = vec2(0.62, 0.3);
  float row = floor(uv.y / bs.y); uv.x += cgH21(vec2(row, 5.1)) * bs.x;
  vec2 cid = floor(uv / bs), f = fract(uv / bs) * bs;
  float e = min(min(f.x, bs.x - f.x), min(f.y, bs.y - f.y)) + (cgVn(vec3(uv * 11.0, 2.0)) - 0.5) * 0.014;
  float px = length(fwidth(uv));
  float joint = 1.0 - smoothstep(0.006, 0.006 + max(0.006, px), e);
  joint = mix(joint, 0.12, smoothstep(0.03, 0.12, px));
  float id = cgH21(cid + 17.0 * row), id2 = cgH21(cid + 3.3);
  vec3 c = mix(vec3(0.3, 0.225, 0.145), vec3(0.235, 0.22, 0.195), id2) * (0.68 + 0.52 * id);   // ochre to grey blocks
  c *= 0.8 + 0.36 * cgFbm3(P * 1.9);                                                           // tooled, weathered faces
  c *= 1.0 - 0.25 * smoothstep(0.55, 0.85, cgFbm3(P * vec3(0.5, 0.18, 0.5) + 4.0));           // damp, dirt
  vec3 mortar = vec3(0.4, 0.37, 0.31) * (0.8 + 0.3 * cgVn(P * 30.0));
  c = mix(c, mortar, joint * 0.8);
  c *= mix(1.0, 0.05, gcrSoot(P) * uSoot.w);
  float inRoom = 1.0 - smoothstep(6.9, 7.3, length(P.xz));   // the common room's own smoke, not the turret's or the dormitory's
  c *= mix(1.0, 0.62, smoothstep(5.0, 9.2, P.y + 1.6 * cgFbm3(P * 0.4)) * inRoom * (1.0 - step(9.6, P.y)));
  c *= mix(1.0, 0.55, smoothstep(7.4, 8.4, length(P.xz)));   // the stair turret and the passages, out of the room's light   // the stair turret and the passage beyond the walls, out of the room's light
  diffuseColor.rgb *= c;
  cgH = (1.0 - joint) * 0.005 + cgFbm3(P * 6.0) * 0.004; cgAO = mix(1.0, 0.72, joint);
` });
// woven wool: the painted design (uv 0..1 over GCR_TAP metres), warp ribs and weft hatching, faded dye
const GCR_TAP = [5.6, 4.7];
function tapestryMat(tex) {
  return procMat({ name: 'tapestry', rgb: [1, 1, 1], rough: 0.95, uv: true, bump: 1, std: { map: tex }, frag: /* glsl */ `
    vec2 m = UV * vec2(${GCR_TAP[0].toFixed(2)}, ${GCR_TAP[1].toFixed(2)});
    float px = length(fwidth(m)), k = 1.0 - smoothstep(0.0012, 0.004, px);
    float rib = 0.5 + 0.5 * sin(m.x * 1700.0 + 2.0 * cgVn(vec3(m * 40.0, 1.0)));
    float hatch = 0.5 + 0.5 * sin(m.y * 2600.0 + (rib - 0.5) * 2.0);
    diffuseColor.rgb *= mix(1.0, 0.78 + 0.34 * rib * (0.7 + 0.3 * hatch), k);
    diffuseColor.rgb *= 0.86 + 0.24 * cgFbm3(vec3(m * 1.1, 2.0));
    diffuseColor.rgb *= 1.0 - 0.18 * smoothstep(0.62, 0.9, cgFbm3(vec3(m * vec2(0.6, 3.0), 7.0)));   // dye lots: faint horizontal bands
    cgH = rib * 0.0007 * k + cgVn(vec3(m * 90.0, 3.0)) * 0.0004;
  ` });
}
// velvet: dark face-on, bright at grazing angles, crushed in patches, worn pale on the arms; colour per instance
M.velvet = procMat({ name: 'velvet', rgb: [1, 1, 1], rough: 0.85, vc: true, inst: true, bump: 1, frag: /* glsl */ `
  vec3 V = normalize(cameraPosition - P);
  float nv = abs(dot(N, V)), sheen = pow(1.0 - nv, 2.2);
  float crush = cgFbm3(P * 7.0 + vInst * 3.1), pile = cgVn(P * 260.0);
  diffuseColor.rgb *= (0.62 + 0.32 * crush + 0.08 * pile) * (1.0 + 1.25 * sheen);
  diffuseColor.rgb *= 1.0 + 0.25 * smoothstep(0.35, 0.95, N.y) * smoothstep(0.5, 0.8, cgFbm3(P * 3.0 + 9.0));   // worn nap
  cgRough = 0.8; cgSpec = 0.35; cgH = crush * 0.0015 + pile * 0.0003;
` });
M.brownLeather = procMat({ name: 'brownLeather', rgb: [1, 1, 1], rough: 0.5, vc: true, inst: true, bump: 1, frag: /* glsl */ `
  float n = cgFbm3(P * 5.0), g = cgVn(P * 90.0);
  diffuseColor.rgb *= 0.7 + 0.5 * n;
  diffuseColor.rgb *= 1.0 + 0.5 * smoothstep(0.3, 0.9, N.y) * smoothstep(0.45, 0.75, cgFbm3(P * 4.0 + 2.0));   // rubbed pale
  cgRough = 0.38 + 0.25 * n; cgH = g * 0.0004 - smoothstep(0.7, 0.8, cgVn(P * 18.0)) * 0.0006;
` });
// the furniture's oak: mid-brown, waxed; the grain runs up the legs and along the tops
M.fwood = procMat({ name: 'fwood', rgb: [0.13, 0.07, 0.035], rough: 0.42, bump: 1, frag: /* glsl */ `
  float up = step(0.6, abs(N.y));
  vec3 q = up > 0.5 ? vec3(P.x * 3.0, P.z * 40.0, 1.0) : vec3(P.x * 30.0 + P.z * 30.0, P.y * 2.5, 2.0);
  float g = cgFbm3(q) * 0.7 + cgVn(q * vec3(1.0, 6.0, 1.0)) * 0.3;
  diffuseColor.rgb *= 0.72 + 0.55 * g;
  diffuseColor.rgb *= 1.0 - 0.3 * smoothstep(0.6, 0.85, cgFbm3(P * 2.0));
  cgRough = 0.35 + 0.25 * cgFbm3(P * 9.0); cgH = g * 0.0012;
` });
M.enamel = procMat({ name: 'enamel', rgb: [0.72, 0.7, 0.64], rough: 0.25 });
M.parchment = procMat({ name: 'parchment', rgb: [0.62, 0.53, 0.36], rough: 0.8, frag: /* glsl */ `
  diffuseColor.rgb *= 0.82 + 0.3 * cgFbm3(P * 14.0); diffuseColor.rgb *= 1.0 - 0.25 * smoothstep(0.6, 0.9, cgFbm3(P * 30.0 + 3.0));
` });
M.ink = procMat({ name: 'ink', rgb: [0.02, 0.02, 0.025], rough: 0.2 });
M.cork = procMat({ name: 'cork', rgb: [0.3, 0.18, 0.09], rough: 0.95, bump: 1, frag: /* glsl */ `
  float n = cgVn(P * 160.0); diffuseColor.rgb *= 0.7 + 0.5 * n * cgFbm3(P * 20.0); cgH = n * 0.0012;
` });
// book covers (colour per instance, gilt bands near the spine) and page blocks
M.bookCover = procMat({ name: 'bookCover', rgb: [1, 1, 1], rough: 0.6, inst: true, frag: /* glsl */ `
  diffuseColor.rgb = vInstC * (0.7 + 0.4 * cgFbm3(P * 40.0)); cgRough = 0.5 + 0.3 * cgVn(P * 80.0);
` });
M.pages = procMat({ name: 'pages', rgb: [0.6, 0.53, 0.4], rough: 0.85, frag: /* glsl */ `
  diffuseColor.rgb *= 0.85 + 0.2 * cgVn(vec3(P.x * 3.0, P.y * 900.0, P.z * 3.0));
` });
// a frosted glass globe on an oil lamp: glows warm when the lamps are lit, faintly by day
M.globe = procMat({ name: 'globe', rgb: [0.5, 0.45, 0.38], rough: 0.3, frag: /* glsl */ `
  float h = 0.6 + 0.4 * cgVn(P * 30.0);
  cgEmit = vec3(1.0, 0.66, 0.32) * (0.22 + 2.4 * uLamp) * h;
` });
// a fine iron mesh (the fire screen, the stove's guard): wires 2 mm, 12 mm apart (uv in metres), see-through by its
// coverage where the wires are finer than a pixel (stochastic discard sparkled in the film, moving)
M.ironMesh = procMat({ name: 'ironMesh', rgb: [0.03, 0.028, 0.025], rough: 0.5, uv: true, side: THREE.DoubleSide, std: { transparent: true, depthWrite: false }, frag: /* glsl */ `
  vec2 g = abs(fract(UV / 0.012) - 0.5); float px = length(fwidth(UV / 0.012));
  float wire = smoothstep(0.36 - px - 0.02, 0.36 + px, max(g.x, g.y));
  diffuseColor.a = mix(wire, 0.48, smoothstep(0.15, 0.45, px));
` });
// pierced brass (the chandelier's band): a row of quatrefoils (uv in metres)
M.pierced = procMat({ name: 'pierced', rgb: [0.72, 0.5, 0.2], metal: 1, rough: 0.32, uv: true, side: THREE.DoubleSide, frag: /* glsl */ `
  vec2 q = vec2(fract(UV.x / 0.11) - 0.5, (UV.y - 0.13) / 0.11);
  float a = atan(q.y, q.x), r = length(q), fo = 0.24 + 0.08 * abs(cos(2.0 * a));
  if (r < fo && abs(UV.y - 0.13) < 0.08) discard;
  diffuseColor.rgb *= 0.75 + 0.4 * cgFbm3(P * 20.0);
` });
// logs: bark on the sides, pale end grain with rings on the cut faces
M.bark = procMat({ name: 'bark', rgb: [0.12, 0.09, 0.06], rough: 0.95, bump: 1, uv: true, frag: /* glsl */ `
  float n = cgVn(vec3(UV.x * 30.0, UV.y * 4.0, 1.0)); diffuseColor.rgb *= 0.6 + 0.6 * n; cgH = n * 0.006;
` });
M.endgrain = procMat({ name: 'endgrain', rgb: [0.42, 0.3, 0.17], rough: 0.9, uv: true, frag: /* glsl */ `
  float r = length(UV - 0.5); diffuseColor.rgb *= 0.75 + 0.25 * sin(r * 160.0 + cgVn(vec3(UV * 6.0, 1.0)) * 3.0) - 0.35 * smoothstep(0.42, 0.5, r);
` });
// the striped Gryffindor blanket (vLoc: the sofa's own coordinates, stripes across x)
M.gblanket = procMat({ name: 'gblanket', rgb: [1, 1, 1], rough: 0.9, vc: true, bump: 1, vhead: 'varying vec3 vLoc;\n', vert: 'vLoc = position;\n', head: 'varying vec3 vLoc;\n', frag: /* glsl */ `
  float s = vLoc.x * 6.0;
  float st = smoothstep(0.035, 0.025, abs(fract(s) - 0.5 - 0.0)) + smoothstep(0.035, 0.025, abs(fract(s) - 0.5 - 0.1));
  vec3 c = mix(vec3(0.2, 0.012, 0.016), vec3(0.62, 0.36, 0.06), clamp(st, 0.0, 1.0));
  float w = cgVn(P * 220.0);
  diffuseColor.rgb *= c * (0.82 + 0.25 * w); cgH = w * 0.0006 + cgFbm3(P * 12.0) * 0.002;
` });
// a cushion embroidered with the lion (vLoc: the cushion's own coordinates; the lion on its +z face)
const GCR_LION = { uLion: { value: null } };
M.lionCushion = procMat({ name: 'lionCushion', rgb: [1, 1, 1], rough: 0.8, vc: true, bump: 1, uniforms: GCR_LION, vhead: 'varying vec3 vLoc;\n', vert: 'vLoc = position;\n',
  head: 'varying vec3 vLoc;\nuniform sampler2D uLion;\n', frag: /* glsl */ `
  vec2 q = vec2(vLoc.x / 0.36 + 0.5, 0.5 - vLoc.y / 0.36);
  float a = vLoc.z > 0.0 ? texture2D(uLion, clamp(q, 0.0, 1.0)).a * step(0.0, q.x) * step(q.x, 1.0) * step(0.0, q.y) * step(q.y, 1.0) : 0.0;
  vec3 V = normalize(cameraPosition - P); float sheen = pow(1.0 - abs(dot(N, V)), 2.2);
  vec3 c = mix(vec3(0.42, 0.03, 0.025) * (0.7 + 0.3 * cgFbm3(P * 8.0)) * (1.0 + 1.2 * sheen), vec3(0.75, 0.5, 0.14), a);
  diffuseColor.rgb *= c; cgRough = mix(0.8, 0.45, a); cgH = a * 0.002;
` });
// a fringe (chair skirts): close threads with ragged ends (uv: x along the skirt, y down from its top, metres)
M.fringe = procMat({ name: 'fringe', rgb: [0.3, 0.02, 0.02], rough: 0.85, uv: true, side: THREE.DoubleSide, frag: /* glsl */ `
  float t = fract(UV.x / 0.006), len = 0.075 - 0.02 * cgH21(vec2(floor(UV.x / 0.006), 3.0));
  if (abs(t - 0.5) > 0.36 || UV.y > len) discard;
  diffuseColor.rgb *= 0.7 + 0.5 * (1.0 - UV.y / 0.08);
` });
// the chess board: 64 squares on the top face (uv 0..1), a dark wood border
M.chessboard = procMat({ name: 'chessboard', rgb: [1, 1, 1], rough: 0.3, uv: true, frag: /* glsl */ `
  vec2 q = (UV - 0.06) / 0.88; float inb = step(0.0, q.x) * step(q.x, 1.0) * step(0.0, q.y) * step(q.y, 1.0);
  float ch = mod(floor(q.x * 8.0) + floor(q.y * 8.0), 2.0);
  vec3 c = mix(vec3(0.07, 0.035, 0.02), mix(vec3(0.12, 0.06, 0.03), vec3(0.55, 0.42, 0.26), ch), inb);
  diffuseColor.rgb = c * (0.85 + 0.25 * cgVn(P * 120.0));
` });
M.ivoryPiece = procMat({ name: 'ivoryPiece', rgb: [0.6, 0.55, 0.45], rough: 0.35 });
M.ebonyPiece = procMat({ name: 'ebonyPiece', rgb: [0.03, 0.025, 0.02], rough: 0.3 });
// a rug: the painted design, the pile catching the light (uv over the whole rug)
function rugMat(tex) {
  return procMat({ name: 'rug', rgb: [1, 1, 1], rough: 0.98, uv: true, bump: 1, std: { map: tex, alphaTest: 0.5 }, frag: /* glsl */ `
    float px = length(fwidth(P.xz)), k = 1.0 - smoothstep(0.002, 0.008, px);
    float pile = cgVn(P * 380.0);
    diffuseColor.rgb *= mix(1.0, 0.82 + 0.3 * pile, k) * (0.9 + 0.15 * cgFbm3(P * 2.0));
    cgH = pile * 0.0008 * k;
  ` });
}

// the floor: worn flags about 0.7 m, darker and grimier toward the walls, a few polished by feet
M.gflag = procMat({ name: 'gflag', rgb: [1, 1, 1], rough: 0.55, bump: 1, frag: /* glsl */ `
  vec2 q = P.xz; float rh = 0.72, row = floor(q.y / rh);
  float w = 0.7 + 0.5 * cgH21(vec2(row, 7.0)), u = q.x + cgH21(vec2(row, 1.0)) * 2.0, cell = floor(u / w);
  vec2 f = vec2(fract(u / w) * w, fract(q.y / rh) * rh); float e = min(min(f.x, w - f.x), min(f.y, rh - f.y));
  float id = cgH21(vec2(cell, row)), px = length(fwidth(q));
  float groove = smoothstep(0.004, 0.004 + max(px, 0.01), e);
  vec3 c = mix(vec3(0.1, 0.082, 0.064), vec3(0.19, 0.155, 0.115), id) * (0.8 + 0.35 * cgFbm3(P * 1.6));
  c *= mix(0.45, 1.0, groove) * mix(1.0, 0.7, smoothstep(5.0, 7.0, length(q)));
  diffuseColor.rgb *= c; cgRough = mix(0.3, 0.8, cgFbm3(P * 3.0)); cgH = min(e, 0.02) * 0.3 + cgFbm3(P * 8.0) * 0.002;
` });

// ---- painted textures
// a millefleur tapestry in the manner of the Lady and the Unicorn (all drawn here): v = design variant
function tapestryCanvas(v) {
  const W = 1536, H = Math.round(W * GCR_TAP[1] / GCR_TAP[0]), c = makeCanvas(W, H), g = c.getContext('2d'), R = rng('tapestry' + v);
  const S = W / GCR_TAP[0];   // pixels per metre
  // the rose-red ground, uneven
  g.fillStyle = '#8e3a42'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) {
    const x = R() * W, y = R() * H, r = (0.4 + R() * 1.4) * S, gr = g.createRadialGradient(x, y, 0, x, y, r);
    const l = R() < 0.5; gr.addColorStop(0, l ? 'rgba(170,70,78,0.22)' : 'rgba(80,16,24,0.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  const ell = (x, y, rx, ry, rot, col) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), rot, 0, Math.PI * 2); g.fill(); };
  const FL = ['#d8c8b0', '#c8909a', '#7888b0', '#c8a862', '#b06474', '#a8b8c8', '#d4c4aa', '#c07868'], FLI = ['#98a8c8', '#c898a0', '#c8bca4', '#8094b8'];
  // one small flowering plant: a stem, leaves, one to three five-petalled flowers
  const plant = (x, y, s, dark = false) => {
    const stem = dark ? '#3b5d74' : '#2d4b46', leaf = dark ? ['#56809a', '#3f6a86'] : ['#3c6458', '#4f7a6c', '#2f5560'];
    g.strokeStyle = stem; g.lineWidth = Math.max(1, s * 0.07); g.beginPath(); g.moveTo(x, y + s); g.quadraticCurveTo(x + (R() - 0.5) * s * 0.6, y + s * 0.4, x, y); g.stroke();
    const nl = 2 + Math.floor(R() * 4);
    for (let i = 0; i < nl; i++) { const t = 0.25 + R() * 0.65, sd = i % 2 ? 1 : -1; ell(x + sd * s * 0.22, y + s * t, s * 0.24, s * 0.08, sd * (0.6 + R() * 0.5), leaf[Math.floor(R() * leaf.length)]); }
    const nf = 1 + Math.floor(R() * 3);
    for (let i = 0; i < nf; i++) {
      const fx = x + (i ? (R() - 0.5) * s * 0.9 : 0), fy = y + (i ? R() * s * 0.5 : 0), fr = s * (0.07 + R() * 0.05), pal = dark ? FLI : FL, col = pal[Math.floor(R() * pal.length)];
      for (let p = 0; p < 5; p++) { const a = (p / 5) * Math.PI * 2 + R(); ell(fx + Math.cos(a) * fr, fy + Math.sin(a) * fr, fr * 0.75, fr * 0.5, a, col); }
      ell(fx, fy, fr * 0.45, fr * 0.45, 0, R() < 0.5 ? '#d8a540' : '#7a2a30');
    }
  };
  // small white beasts of the millefleur: rabbits, hounds, birds, lambs (ellipse silhouettes, a darker outline)
  const beast = (kind, x, y, s, flip) => {
    g.save(); g.translate(x, y); if (flip) g.scale(-1, 1);
    const fill = kind === 'bird' ? '#d8cdb8' : kind === 'fox' ? '#c08048' : '#ece2d0', sh = '#9c8c7c';
    const parts = kind === 'rabbit' ? [[0, 0, 0.42, 0.26, 0], [0.38, -0.22, 0.17, 0.14, 0], [0.42, -0.5, 0.06, 0.24, 0.2], [0.33, -0.5, 0.06, 0.22, -0.15], [-0.4, -0.05, 0.1, 0.1, 0], [0.25, 0.26, 0.2, 0.06, 0], [-0.25, 0.24, 0.24, 0.07, 0]]
      : kind === 'bird' ? [[0, 0, 0.32, 0.17, -0.2], [0.33, -0.12, 0.12, 0.11, 0], [-0.38, 0.06, 0.24, 0.06, 0.3], [0.05, -0.08, 0.26, 0.09, -0.6]]
      : kind === 'lamb' ? [[0, 0, 0.45, 0.28, 0], [0.45, -0.18, 0.17, 0.14, 0.3], [0.25, 0.42, 0.04, 0.18, 0], [-0.25, 0.42, 0.04, 0.18, 0], [0.12, 0.42, 0.04, 0.18, 0], [-0.38, 0.42, 0.04, 0.18, 0]]
      : [[0, 0, 0.5, 0.18, 0], [0.55, -0.22, 0.17, 0.11, -0.2], [0.72, -0.18, 0.12, 0.05, 0.1], [0.42, -0.32, 0.06, 0.12, 0.5], [-0.62, -0.18, 0.22, 0.03, -0.8],   // hound / fox
        [0.36, 0.36, 0.04, 0.22, 0.1], [0.22, 0.36, 0.04, 0.22, -0.1], [-0.36, 0.36, 0.04, 0.22, 0.15], [-0.48, 0.36, 0.04, 0.22, -0.1]];
    for (const [px, py, rx, ry, r] of parts) ell(px * s, py * s + s * 0.04, rx * s * 1.06, ry * s * 1.12, r, sh);
    for (const [px, py, rx, ry, r] of parts) ell(px * s, py * s, rx * s, ry * s, r, fill);
    if (kind !== 'bird') ell(kind === 'rabbit' ? 0.43 * s : 0.62 * s, -0.25 * s, s * 0.025, s * 0.025, 0, '#2a1a14');
    g.restore();
  };
  // a tree of the islands: a dark blue-green crown of lobed leaves with pale veins, sometimes fruit
  const tree = (x, y, s, fruit) => {
    g.strokeStyle = '#3a2c3a'; g.lineWidth = s * 0.06; g.beginPath(); g.moveTo(x, y); g.lineTo(x + s * 0.03, y - s * 0.7); g.stroke();
    for (let i = 0; i < 160; i++) {
      const a = R() * Math.PI * 2, r = Math.sqrt(R()) * s * 0.55, lx = x + Math.cos(a) * r, ly = y - s * 1.0 + Math.sin(a) * r * 0.85, rot = R() * 3;
      ell(lx, ly, s * 0.07, s * 0.035, rot, R() < 0.5 ? '#1d3346' : '#28465a');
      ell(lx, ly, s * 0.045, s * 0.008, rot, '#5d8a90');
    }
    if (fruit) for (let i = 0; i < 18; i++) { const a = R() * Math.PI * 2, r = Math.sqrt(R()) * s * 0.48; ell(x + Math.cos(a) * r, y - s + Math.sin(a) * r * 0.8, s * 0.035, s * 0.035, 0, '#d88a2c'); }
  };
  // a standard: a lance and a swallow-tailed flag, red with a blue bend and three white crescents
  const standard = (x, y, s, flip) => {
    g.strokeStyle = '#c8a050'; g.lineWidth = s * 0.03; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - s * 2.1); g.stroke();
    g.save(); g.translate(x, y - s * 2.05); if (flip) g.scale(-1, 1);
    const w = s * 0.95, h = s * 0.85;
    g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(w * 0.35, -h * 0.08, w * 0.7, h * 0.08, w, 0); g.lineTo(w * 0.86, h * 0.5); g.lineTo(w, h); g.bezierCurveTo(w * 0.7, h * 1.06, w * 0.35, h * 0.92, 0, h); g.closePath();
    g.fillStyle = '#9b1f24'; g.fill(); g.save(); g.clip();
    g.translate(w * 0.45, h * 0.5); g.rotate(0.62); g.fillStyle = '#28407a'; g.fillRect(-w, -h * 0.17, 2 * w, h * 0.34);
    for (let i = -1; i <= 1; i++) { g.fillStyle = '#ece4d4'; g.beginPath(); g.arc(i * w * 0.36, 0, h * 0.11, 0.3, Math.PI * 2 - 0.3); g.arc(i * w * 0.36 + h * 0.05, 0, h * 0.085, Math.PI * 2 - 0.5, 0.5, true); g.fill(); }
    g.restore(); g.restore();
  };
  // the lady: a gold brocade gown open over a blue kirtle, a red bodice, long sleeves, a turban with an aigrette; she
  // takes a necklace from a casket held out to her
  const lady = (x, y, s) => {
    g.save(); g.translate(x, y); g.scale(s, s); g.lineJoin = 'round'; g.lineCap = 'round';
    const out = '#3a1c18', ell = (px, py, rx, ry, rot, col) => { g.fillStyle = col; g.beginPath(); g.ellipse(px, py, rx, ry, rot, 0, Math.PI * 2); g.fill(); };   // (unclamped: this frame is scaled)
    const shape = (P, fill, lw = 0.007) => { g.beginPath(); g.moveTo(P[0][0], P[0][1]); for (let i = 1; i + 2 < P.length; i += 3) g.bezierCurveTo(P[i][0], P[i][1], P[i + 1][0], P[i + 1][1], P[i + 2][0], P[i + 2][1]); g.closePath(); g.fillStyle = fill; g.fill(); g.strokeStyle = out; g.lineWidth = lw; g.stroke(); };
    const gown = [[-0.1, -0.95], [-0.2, -0.6], [-0.42, -0.25], [-0.47, 0], [-0.2, 0.035], [0.2, 0.035], [0.47, 0], [0.42, -0.25], [0.2, -0.6], [0.1, -0.95], [0.03, -0.96], [-0.03, -0.96], [-0.1, -0.95]];
    shape(gown, '#b48a3e');
    g.save(); g.beginPath(); g.moveTo(gown[0][0], gown[0][1]); for (let i = 1; i + 2 < gown.length; i += 3) g.bezierCurveTo(...gown[i], ...gown[i + 1], ...gown[i + 2]); g.clip();
    for (let yy = -0.95; yy < 0.05; yy += 0.05) for (let xx = -0.5 + ((Math.round(yy * 20) % 2) * 0.03); xx < 0.5; xx += 0.06) { ell(xx, yy, 0.011, 0.016, 0, '#7a3a1c'); ell(xx, yy - 0.012, 0.005, 0.005, 0, '#d8b860'); }   // pomegranates
    g.strokeStyle = 'rgba(70,40,15,0.45)'; g.lineWidth = 0.012; for (const f of [-0.32, -0.2, 0.22, 0.34]) { g.beginPath(); g.moveTo(f * 0.25, -0.9); g.quadraticCurveTo(f * 0.8, -0.4, f, 0.02); g.stroke(); }   // folds
    g.restore();
    shape([[-0.05, -0.95], [-0.08, -0.55], [-0.16, -0.2], [-0.19, 0.02], [-0.06, 0.035], [0.06, 0.035], [0.19, 0.02], [0.16, -0.2], [0.08, -0.55], [0.05, -0.95], [0.02, -0.955], [-0.02, -0.955], [-0.05, -0.95]], '#2c3f78');
    g.strokeStyle = 'rgba(15,20,50,0.5)'; g.lineWidth = 0.01; for (const f of [-0.08, 0.0, 0.09]) { g.beginPath(); g.moveTo(f * 0.3, -0.9); g.lineTo(f * 1.3, 0.02); g.stroke(); }
    shape([[-0.12, -1.17], [-0.1, -1.08], [-0.1, -1.0], [-0.09, -0.94], [-0.03, -0.92], [0.03, -0.92], [0.09, -0.94], [0.1, -1.0], [0.1, -1.08], [0.12, -1.17], [0.04, -1.19], [-0.04, -1.19], [-0.12, -1.17]], '#9a2a30');
    g.strokeStyle = '#d8b25a'; g.lineWidth = 0.014; g.beginPath(); g.moveTo(-0.1, -1.16); g.quadraticCurveTo(0, -1.12, 0.1, -1.16); g.stroke();   // the jewelled neckline
    for (const [sx, P] of [[-1, [[-0.12, -1.16], [-0.21, -1.02], [-0.07, -0.9]]], [1, [[0.12, -1.16], [0.22, -1.03], [0.26, -0.92]]]]) {   // sleeves, hands
      for (const [col, w] of [[out, 0.075], ['#b48a3e', 0.062]]) { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(...P[0]); g.quadraticCurveTo(...P[1], ...P[2]); g.stroke(); }
      ell(P[2][0] + sx * 0.012, P[2][1] + 0.025, 0.022, 0.03, sx * 0.4, '#e8cfb2');
    }
    ell(0, -1.205, 0.025, 0.03, 0, '#e8cfb2');                                                     // neck
    ell(0, -1.27, 0.055, 0.07, 0, '#ecd6bc'); g.strokeStyle = out; g.lineWidth = 0.005; g.stroke();   // face
    ell(-0.02, -1.28, 0.006, 0.004, 0, '#4a3020'); ell(0.02, -1.28, 0.006, 0.004, 0, '#4a3020'); ell(0, -1.24, 0.012, 0.004, 0, '#b0605a');
    ell(-0.055, -1.24, 0.018, 0.05, 0.2, '#c8a060'); ell(0.055, -1.24, 0.018, 0.05, -0.2, '#c8a060');   // hair
    ell(0, -1.335, 0.085, 0.045, 0, '#c8a04c'); ell(0, -1.34, 0.02, 0.02, 0, '#9a2a30');                // turban, jewel
    g.strokeStyle = '#e8dcc4'; g.lineWidth = 0.01; for (const d of [-0.03, 0, 0.03]) { g.beginPath(); g.moveTo(0, -1.37); g.quadraticCurveTo(d, -1.45, d * 2 + 0.02, -1.5); g.stroke(); }   // the aigrette
    g.fillStyle = '#9a7a34'; g.fillRect(0.3, -0.92, 0.16, 0.1); g.strokeStyle = out; g.lineWidth = 0.006; g.strokeRect(0.3, -0.92, 0.16, 0.1);   // the casket
    for (let i = 0; i < 9; i++) { const t = i / 8; ell(0.27 + 0.08 * t, -0.88 - 0.03 * Math.sin(t * Math.PI), 0.008, 0.008, 0, '#e0c060'); }   // the necklace
    g.restore();
  };
  // the unicorn (white, rearing) and the lion (gold), each holding a standard
  const unicorn = (x, y, s, flip) => {
    g.save(); g.translate(x, y); g.scale(flip ? -s : s, s); g.lineCap = 'round'; g.lineJoin = 'round';
    const body = '#ece3d4', line = '#8a7a6c';
    const limb = (P, w) => { for (const [col, ww] of [[line, w + 0.016], [body, w]]) { g.strokeStyle = col; g.lineWidth = ww; g.beginPath(); g.moveTo(P[0][0], P[0][1]); for (let i = 1; i + 1 < P.length; i += 2) g.quadraticCurveTo(P[i][0], P[i][1], P[i + 1][0], P[i + 1][1]); g.stroke(); } };
    limb([[-0.2, -0.42], [-0.3, -0.2], [-0.16, 0]], 0.06);                                                                 // the far hind leg
    g.strokeStyle = line; g.lineWidth = 0.03; g.beginPath(); g.moveTo(-0.36, -0.5); g.bezierCurveTo(-0.62, -0.46, -0.44, -0.2, -0.6, -0.06); g.stroke();   // the tail
    g.strokeStyle = body; g.lineWidth = 0.018; g.stroke();
    g.beginPath(); g.moveTo(-0.38, -0.48);
    g.bezierCurveTo(-0.36, -0.68, -0.05, -0.78, 0.18, -0.86); g.bezierCurveTo(0.24, -0.95, 0.28, -1.05, 0.33, -1.12);
    g.bezierCurveTo(0.42, -1.16, 0.55, -1.1, 0.62, -1.0); g.bezierCurveTo(0.6, -0.95, 0.52, -0.95, 0.46, -0.98);
    g.bezierCurveTo(0.4, -0.9, 0.34, -0.78, 0.3, -0.68); g.bezierCurveTo(0.26, -0.52, 0.08, -0.38, -0.12, -0.36); g.bezierCurveTo(-0.28, -0.32, -0.4, -0.36, -0.38, -0.48); g.closePath();
    g.fillStyle = body; g.fill(); g.strokeStyle = line; g.lineWidth = 0.012; g.stroke();
    g.strokeStyle = 'rgba(140,120,105,0.35)'; g.lineWidth = 0.01; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-0.3 + i * 0.1, -0.44); g.quadraticCurveTo(-0.22 + i * 0.1, -0.56, -0.12 + i * 0.1, -0.6); g.stroke(); }   // shading lines
    limb([[-0.3, -0.45], [-0.14, -0.26], [-0.26, -0.12], [-0.31, -0.04], [-0.24, 0]], 0.07);                             // the near hind leg
    limb([[0.16, -0.6], [0.32, -0.62], [0.32, -0.5], [0.32, -0.42], [0.26, -0.38]], 0.05);                                // the forelegs, raised
    limb([[0.22, -0.68], [0.42, -0.74], [0.44, -0.62], [0.46, -0.54], [0.39, -0.49]], 0.055);
    g.strokeStyle = '#e4d6b4'; g.lineWidth = 0.024; g.beginPath(); g.moveTo(0.43, -1.14); g.lineTo(0.64, -1.42); g.stroke();   // the horn, twisted
    g.strokeStyle = '#a89470'; g.lineWidth = 0.006; for (let i = 1; i < 7; i++) { const t = i / 7, hx = 0.43 + 0.21 * t, hy = -1.14 - 0.28 * t; g.beginPath(); g.moveTo(hx - 0.01, hy - 0.006); g.lineTo(hx + 0.012, hy + 0.01); g.stroke(); }
    g.strokeStyle = '#d8ccb6'; g.lineWidth = 0.022; for (let i = 0; i < 6; i++) { const t = i / 6, px = 0.33 - 0.15 * t, py = -1.12 + 0.26 * t; g.beginPath(); g.moveTo(px, py); g.quadraticCurveTo(px - 0.08, py + 0.02, px - 0.06, py + 0.09); g.stroke(); }   // the mane
    g.strokeStyle = '#d8ccb6'; g.lineWidth = 0.014; g.beginPath(); g.moveTo(0.52, -0.97); g.quadraticCurveTo(0.5, -0.9, 0.53, -0.86); g.stroke();   // the goat's beard
    g.fillStyle = '#2a1a14'; g.beginPath(); g.arc(0.455, -1.075, 0.012, 0, Math.PI * 2); g.fill();
    g.restore();
  };
  // the pavilion of "A mon seul désir": a blue tent strewn with golden flames, its flaps held open, the motto on the valance
  const tent = (x, y, s) => {
    g.save(); g.translate(x, y); g.scale(s, s);
    const fill = (P, col) => { g.beginPath(); g.moveTo(P[0][0], P[0][1]); for (let i = 1; i + 2 < P.length; i += 3) g.bezierCurveTo(P[i][0], P[i][1], P[i + 1][0], P[i + 1][1], P[i + 2][0], P[i + 2][1]); g.closePath(); g.fillStyle = col; g.fill(); };
    const body = [[-0.55, 0], [-0.52, -0.6], [-0.4, -1.1], [-0.34, -1.3], [-0.1, -1.6], [0.1, -1.6], [0.34, -1.3], [0.4, -1.1], [0.52, -0.6], [0.55, 0], [0.2, 0.03], [-0.2, 0.03], [-0.55, 0]];
    fill(body, '#2a3a70');
    g.save(); g.beginPath(); g.moveTo(-0.55, 0); for (let i = 1; i + 2 < body.length; i += 3) g.bezierCurveTo(...body[i], ...body[i + 1], ...body[i + 2]); g.clip();
    for (let yy = -1.55; yy < 0; yy += 0.09) for (let xx = -0.6 + (Math.round(yy * 11) % 2) * 0.05; xx < 0.6; xx += 0.1) { g.fillStyle = '#c8a050'; g.beginPath(); g.moveTo(xx, yy - 0.03); g.quadraticCurveTo(xx + 0.018, yy, xx, yy + 0.016); g.quadraticCurveTo(xx - 0.018, yy, xx, yy - 0.03); g.fill(); }
    g.restore();
    fill([[-0.24, 0], [-0.2, -0.5], [-0.12, -0.85], [0, -0.95], [0.12, -0.85], [0.2, -0.5], [0.24, 0], [0, 0.02], [0, 0.02], [-0.24, 0]], '#4a1418');   // the dark opening
    g.fillStyle = '#c8a050'; g.fillRect(-0.36, -1.32, 0.72, 0.1);
    g.fillStyle = '#3a2410'; g.font = 'bold 0.055px "Times New Roman", serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('A MON SEUL DESIR', 0, -1.27);
    g.fillStyle = '#c8a050'; g.beginPath(); g.arc(0, -1.62, 0.04, 0, Math.PI * 2); g.fill();
    g.restore();
  };
  // compose (after the six Lady and the Unicorn panels; v picks the scene): a dark blue island with trees, the lady between
  // the lion and the unicorn holding the standards, the pavilion in one; beasts and flowers everywhere on the rose-red ground
  const L = [{ ix: 0.52, iy: 0.7 }, { ix: 0.42, iy: 0.68 }, { ix: 0.5, iy: 0.7 }, { ix: 0.48, iy: 0.72 }][v % 4];
  const iy = H * L.iy, ix = W * L.ix, irx = W * 0.34, iry = H * 0.22;
  for (let i = 0; i < 3600; i++) { const x = R() * W, y = R() * H, d = ((x - ix) / irx) ** 2 + ((y - iy) / iry) ** 2; if (d < 1.05) continue; plant(x, y, (0.035 + R() * 0.05) * S); }
  const isle = (k, col) => {   // the island: an oval with a wavering edge
    g.fillStyle = col; g.beginPath();
    for (let i = 0; i <= 64; i++) { const a = (i / 64) * Math.PI * 2, w = 1 + 0.035 * Math.sin(a * 5 + v) + 0.02 * Math.sin(a * 11 + 2 * v); g.lineTo(ix + Math.cos(a) * irx * k * w, iy + Math.sin(a) * iry * k * w); }
    g.fill();
  };
  isle(1.03, '#1c2540'); isle(1.0, '#273556');
  for (let i = 0; i < 900; i++) { const a = R() * Math.PI * 2, r = Math.sqrt(R()), x = ix + Math.cos(a) * r * irx * 0.93, y = iy + Math.sin(a) * r * iry * 0.9; plant(x, y, (0.035 + R() * 0.04) * S, true); }
  tree(ix - irx * 0.78, iy - iry * 0.3, 1.0 * S, v === 1 || v === 3); tree(ix + irx * 0.8, iy - iry * 0.25, 0.95 * S, v === 0 || v === 2);
  if (v === 0) {        // Sight: the lady holds a mirror to the unicorn; lion and unicorn with the standards
    lady(ix + irx * 0.05, iy + iry * 0.3, 0.95 * S);
    standard(ix - irx * 0.45, iy + iry * 0.1, 0.85 * S, true); standard(ix + irx * 0.5, iy + iry * 0.08, 0.85 * S, false);
    drawBeast(g, 'lion', ix - irx * 0.52, iy - iry * 0.05, 0.95 * S, '#c09a58', false);
    unicorn(ix + irx * 0.55, iy + iry * 0.5, 0.82 * S, true);
  } else if (v === 1) { // Taste: the unicorn rears on the left, the lady and her maid on the right
    unicorn(ix - irx * 0.3, iy + iry * 0.55, 0.85 * S, false);
    standard(ix + irx * 0.15, iy + iry * 0.15, 0.95 * S, false);
    drawBeast(g, 'lion', ix + irx * 0.55, iy - iry * 0.05, 0.9 * S, '#c09a58', true);
    lady(ix + irx * 0.12, iy + iry * 0.55, 0.9 * S); lady(ix - irx * 0.02, iy + iry * 0.6, 0.62 * S);
  } else if (v === 2) { // A mon seul désir: the lady before the pavilion, lion and unicorn holding its flaps
    tent(ix, iy + iry * 0.3, 1.25 * S);
    lady(ix, iy + iry * 0.62, 0.9 * S);
    drawBeast(g, 'lion', ix - irx * 0.6, iy + iry * 0.05, 0.9 * S, '#c09a58', false);
    unicorn(ix + irx * 0.62, iy + iry * 0.55, 0.8 * S, true);
    standard(ix - irx * 0.72, iy + iry * 0.3, 0.8 * S, true); standard(ix + irx * 0.74, iy + iry * 0.3, 0.8 * S, false);
  } else {              // Hearing, without the lady seated: lion and unicorn sit with their standards among the trees
    drawBeast(g, 'lion', ix - irx * 0.35, iy, 0.95 * S, '#c09a58', false);
    unicorn(ix + irx * 0.35, iy + iry * 0.5, 0.82 * S, true);
    standard(ix - irx * 0.15, iy + iry * 0.2, 0.9 * S, true); standard(ix + irx * 0.12, iy + iry * 0.2, 0.9 * S, false);
    tree(ix, iy - iry * 0.05, 0.8 * S, true);
  }
  const KINDS = ['rabbit', 'rabbit', 'hound', 'bird', 'lamb', 'fox', 'bird'];
  for (let i = 0; i < 34; i++) {
    const kind = KINDS[Math.floor(R() * KINDS.length)], x = R() * W, y = H * 0.1 + R() * H * 0.86, d = ((x - ix) / irx) ** 2 + ((y - iy) / iry) ** 2;
    if (d < 0.75 && kind !== 'rabbit') continue;
    beast(kind, x, y, (kind === 'bird' ? 0.11 : kind === 'hound' || kind === 'fox' ? 0.2 : 0.14) * S, R() < 0.5);
  }
  g.fillStyle = 'rgba(200,170,150,0.1)'; g.fillRect(0, 0, W, H);   // faded
  // the top: a dark red sleeve the hanging hooks pass through, a pale stitch line; the weave darkens toward the edges
  g.fillStyle = '#4e1418'; g.fillRect(0, 0, W, 0.13 * S);
  g.fillStyle = 'rgba(210,180,140,0.5)'; for (let x = 0; x < W; x += 9) g.fillRect(x, 0.12 * S, 5, 2);
  const ed = g.createLinearGradient(0, 0, 0, H); ed.addColorStop(0, 'rgba(0,0,0,0.15)'); ed.addColorStop(0.08, 'rgba(0,0,0,0)'); ed.addColorStop(0.9, 'rgba(0,0,0,0)'); ed.addColorStop(1, 'rgba(30,10,5,0.3)');
  g.fillStyle = ed; g.fillRect(0, 0, W, H);
  return c;
}
// a Persian rug: field, medallion and corner pieces, an all-over pattern of angular flowers, a main border between guards,
// fringes at the ends (alpha); pal: field, ground of the medallion, accents
function rugCanvas(pal, Wm, Hm, seed) {
  const S = 220, W = Math.round(Wm * S), H = Math.round(Hm * S), c = makeCanvas(W, H), g = c.getContext('2d'), R = rng('rug' + seed);
  const fr = 0.09 * S;   // the fringes at both ends
  g.clearRect(0, 0, W, H);
  for (let x = 2; x < W - 2; x += 4) { g.strokeStyle = R() < 0.2 ? '#b8ab90' : '#d8ccb2'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (R() - 0.5) * 4, fr + 2); g.moveTo(x, H); g.lineTo(x + (R() - 0.5) * 4, H - fr - 2); g.stroke(); }
  const y0 = fr, y1 = H - fr, poly = (pts, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts) g.lineTo(p[0], p[1]); g.closePath(); g.fill(); };
  const star = (x, y, r, col, n = 8) => { const p = []; for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2, rr = i % 2 ? r * 0.55 : r; p.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } poly(p, col); };
  const diamond = (x, y, rx, ry, col) => poly([[x, y - ry], [x + rx, y], [x, y + ry], [x - rx, y]], col);
  const rosette = (x, y, r, a, b) => { star(x, y, r, a); diamond(x, y, r * 0.5, r * 0.5, b); diamond(x, y, r * 0.2, r * 0.2, a); };
  g.fillStyle = pal.border; g.fillRect(0, y0, W, y1 - y0);
  const b0 = 0.07 * S, b1 = 0.4 * S, b2 = 0.47 * S;   // guard, main border, inner guard
  g.fillStyle = pal.guard; g.fillRect(b0 * 0.4, y0 + b0 * 0.4, W - b0 * 0.8, y1 - y0 - b0 * 0.8);
  g.fillStyle = pal.border; g.fillRect(b0, y0 + b0, W - 2 * b0, y1 - y0 - 2 * b0);
  // the main border: rosettes and leaves along a vine
  const along = (L, f) => { const n = Math.max(2, Math.round(L / (0.34 * S))); for (let i = 0; i < n; i++) f((i + 0.5) / n, i); };
  const bm = (b0 + b1) / 2;
  along(W - 2 * bm, (t, i) => { for (const yy of [y0 + bm, y1 - bm]) { const x = bm + t * (W - 2 * bm); rosette(x, yy, 0.12 * S, i % 2 ? pal.a : pal.b, pal.c); } });
  along(y1 - y0 - 2 * bm, (t, i) => { for (const xx of [bm, W - bm]) { const y = y0 + bm + t * (y1 - y0 - 2 * bm); rosette(xx, y, 0.12 * S, i % 2 ? pal.b : pal.a, pal.c); } });
  g.fillStyle = pal.guard; g.fillRect(b1, y0 + b1, W - 2 * b1, y1 - y0 - 2 * b1);
  // the field
  const fx0 = b2, fy0 = y0 + b2, fx1 = W - b2, fy1 = y1 - b2, cx = W / 2, cy = (y0 + y1) / 2;
  g.fillStyle = pal.field; g.fillRect(fx0, fy0, fx1 - fx0, fy1 - fy0);
  g.save(); g.beginPath(); g.rect(fx0, fy0, fx1 - fx0, fy1 - fy0); g.clip();
  g.lineCap = 'round';
  for (let i = 0; i < 90; i++) {   // angular vines all over the field
    let x = fx0 + R() * (fx1 - fx0), y = fy0 + R() * (fy1 - fy0); g.strokeStyle = R() < 0.5 ? pal.c : pal.d; g.globalAlpha = 0.55; g.lineWidth = 0.012 * S; g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 8; k++) { x += (R() < 0.5 ? -1 : 1) * 0.12 * S; y += (R() < 0.5 ? -1 : 1) * 0.12 * S; g.lineTo(x, y); }
    g.stroke(); g.globalAlpha = 1;
  }
  let row = 0;
  for (let y = fy0 + 0.1 * S; y < fy1; y += 0.2 * S, row++) for (let x = fx0 + 0.1 * S + (row % 2) * 0.11 * S; x < fx1; x += 0.22 * S) {
    const k = R(), col = [pal.a, pal.b, pal.c, pal.d][Math.floor(R() * 4)], jx = x + (R() - 0.5) * 0.04 * S, jy = y + (R() - 0.5) * 0.04 * S;
    if (k < 0.3) star(jx, jy, 0.055 * S, col);
    else if (k < 0.55) { diamond(jx, jy, 0.05 * S, 0.075 * S, col); diamond(jx, jy, 0.02 * S, 0.03 * S, pal.b); }
    else if (k < 0.8) { for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) diamond(jx + dx * 0.045 * S, jy + dy * 0.045 * S, 0.022 * S, 0.022 * S, col); diamond(jx, jy, 0.02 * S, 0.02 * S, pal.a); }
    else poly([[jx - 0.07 * S, jy], [jx, jy - 0.03 * S], [jx + 0.07 * S, jy], [jx, jy + 0.03 * S]], col);
  }
  // the medallion: a stepped lozenge with hooked edges, a star at its heart; corner quarters of the same
  const med = (x, y, rx, ry) => {
    const pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push([x + rx * (1 - t), y - ry * t + (i % 2 ? 0.04 * S : 0)]); }
    const full = [...pts, ...pts.slice(1).map(([px, py]) => [2 * x - px, py]).reverse()];
    poly([...full, ...full.slice(1).map(([px, py]) => [px, 2 * y - py]).reverse()], pal.medE);
  };
  med(cx, cy, Math.min(1.05 * S, (fx1 - fx0) * 0.32), Math.min(1.5 * S, (fy1 - fy0) * 0.3));
  med(cx, cy, Math.min(0.85 * S, (fx1 - fx0) * 0.26), Math.min(1.25 * S, (fy1 - fy0) * 0.25));
  diamond(cx, cy, Math.min(0.75 * S, (fx1 - fx0) * 0.22), Math.min(1.1 * S, (fy1 - fy0) * 0.22), pal.med);
  diamond(cx, cy, Math.min(0.55 * S, (fx1 - fx0) * 0.16), Math.min(0.82 * S, (fy1 - fy0) * 0.16), pal.c);
  diamond(cx, cy, Math.min(0.42 * S, (fx1 - fx0) * 0.12), Math.min(0.62 * S, (fy1 - fy0) * 0.12), pal.medE);
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; star(cx + Math.cos(a) * 0.26 * S, cy + Math.sin(a) * 0.38 * S, 0.035 * S, i % 2 ? pal.d : pal.b); }
  rosette(cx, cy, 0.2 * S, pal.a, pal.c);
  for (const [x, y] of [[cx, cy - 0.6 * S], [cx, cy + 0.6 * S], [cx - 0.4 * S, cy], [cx + 0.4 * S, cy]]) star(x, y, 0.1 * S, pal.b);
  for (const [x, y] of [[fx0, fy0], [fx1, fy0], [fx0, fy1], [fx1, fy1]]) med(x, y, 0.75 * S, 0.9 * S);
  g.restore();
  // abrash (the dye lots in bands across), wear in the middle, grime
  for (let y = y0; y < y1; y += 6 + R() * 30) { g.fillStyle = `rgba(${R() < 0.5 ? '255,240,220' : '0,0,0'},${0.03 + R() * 0.05})`; g.fillRect(0, y, W, 4 + R() * 20); }
  const wr = g.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.4); wr.addColorStop(0, 'rgba(230,220,200,0.12)'); wr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = wr; g.fillRect(0, y0, W, y1 - y0);
  return c;
}
// the crest of a house as a height map (the carving over the fireplace): helm, mantling, shield and beast, name scroll
function houseCrestHeight(house, W = 520) {
  const H = Math.round(W * 1.3), S = embossStack(W, H);
  drawCrestParts(S, house, 0, 0, W);
  let hmax = 1e-6; for (let i = 0; i < W * H; i++) hmax = Math.max(hmax, S.h[i]);
  const c = makeCanvas(W, H), g = c.getContext('2d'), im = g.createImageData(W, H);
  for (let i = 0; i < W * H; i++) { const v = Math.round(255 * clamp(S.h[i] / hmax, 0, 1) * S.a[i]); im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
  g.putImageData(im, 0, 0);
  const s = makeCanvas(W, H), sg = s.getContext('2d'); sg.filter = 'blur(1.5px)'; sg.drawImage(c, 0, 0);
  return s;
}
// carved stone of the hood: the wall's colour and soot, the carving's cavities darkened (vertex colour)
M.gcarve = procMat({ name: 'gcarve', rgb: [1, 1, 1], rough: 0.9, vc: true, bump: 1, uniforms: GCR_SOOT, head: GCR_SOOT_GLSL, frag: /* glsl */ `
  vec3 c = vec3(0.3, 0.27, 0.22) * (0.8 + 0.35 * cgFbm3(P * 3.0));
  c *= mix(1.0, 0.1, gcrSoot(P) * uSoot.w);
  c *= mix(1.0, 0.62, smoothstep(5.0, 9.2, P.y + 1.6 * cgFbm3(P * 0.4)));
  diffuseColor.rgb *= c; cgH = cgFbm3(P * 20.0) * 0.002;
` });

// two oil paintings of this room, after c08: 'lady', a full-length portrait of a woman in a dusky pink gown (over the
// dresser), and 'genre', the big dark interior with wizards at a table by candlelight (over the study table). Blocked in
// with shapes, then broken into short strokes that pick up the colour under them, then a yellowed varnish and a vignette.
function oilCanvas(kind) {
  const [W, H] = kind === 'lady' ? [520, 1064] : [1100, 816], c = makeCanvas(W, H), g = c.getContext('2d'), R = rng('oil' + kind);
  const e = (x, y, rx, ry, rot, col) => { g.fillStyle = col; g.beginPath(); g.ellipse(x * W, y * H, rx * W, ry * H, rot, 0, Math.PI * 2); g.fill(); };
  const poly = (pts, col) => { g.fillStyle = col; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x * W, y * H) : g.moveTo(x * W, y * H))); g.closePath(); g.fill(); };
  const glow = (x, y, r, col) => { const gr = g.createRadialGradient(x * W, y * H, 0, x * W, y * H, r * W); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); };
  const bg = g.createLinearGradient(0, 0, W * 0.3, H); bg.addColorStop(0, '#3a2c1c'); bg.addColorStop(1, '#140e08'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  if (kind === 'lady') {
    poly([[0, 0], [0.34, 0], [0.26, 0.5], [0.3, 1], [0, 1]], '#3a1214');                                   // a red drape on the left
    poly([[0.66, 0.08], [0.92, 0.08], [0.92, 0.48], [0.66, 0.48]], '#4a5650'); glow(0.8, 0.22, 0.25, 'rgba(150,160,140,0.35)');   // a window, evening sky
    poly([[0, 0.86], [1, 0.82], [1, 1], [0, 1]], '#22180e');                                                // the floor
    poly([[0.38, 0.34], [0.62, 0.34], [0.74, 0.93], [0.26, 0.93]], '#8c5c56');                              // the gown
    poly([[0.42, 0.34], [0.58, 0.34], [0.6, 0.6], [0.4, 0.6]], '#a87068');
    for (let i = 0; i < 9; i++) { const x = 0.3 + i * 0.05; poly([[x, 0.62], [x + 0.012, 0.62], [x + 0.02 + (i - 4) * 0.008, 0.93], [x + 0.005 + (i - 4) * 0.008, 0.93]], 'rgba(60,30,30,0.35)'); }   // folds
    poly([[0.26, 0.89], [0.74, 0.89], [0.75, 0.94], [0.25, 0.94]], '#d8c8b0');                              // fur at the hem
    poly([[0.36, 0.2], [0.64, 0.2], [0.67, 0.4], [0.33, 0.4]], '#2a1c18');                                  // a dark wrap over the shoulders
    e(0.5, 0.15, 0.06, 0.042, 0, '#d8b49a'); e(0.5, 0.13, 0.072, 0.03, 0, '#2a1810');                       // face, hair
    e(0.5, 0.19, 0.03, 0.02, 0, '#c8a088');                                                                  // neck
    e(0.44, 0.52, 0.03, 0.02, 0, '#d0a890'); e(0.56, 0.5, 0.03, 0.02, 0, '#d0a890');                        // hands
    poly([[0.42, 0.46], [0.6, 0.44], [0.6, 0.47], [0.42, 0.49]], '#d8c070');                                 // a fan
    glow(0.5, 0.3, 0.45, 'rgba(255,220,170,0.18)');
  } else {
    poly([[0.62, 0.05], [0.86, 0.05], [0.86, 0.6], [0.62, 0.6]], '#3c4a40'); glow(0.74, 0.25, 0.3, 'rgba(160,170,140,0.3)');   // a tall window
    poly([[0, 0.72], [1, 0.7], [1, 1], [0, 1]], '#1c140c');
    poly([[0.18, 0.6], [0.66, 0.58], [0.7, 0.78], [0.14, 0.8]], '#8a7a5c'); poly([[0.14, 0.8], [0.7, 0.78], [0.7, 0.86], [0.14, 0.88]], '#5a4c38');   // the table and its cloth
    // left: a wizard in a red robe and a pointed hat leaning in; right: an old white-bearded wizard in an armchair
    poly([[0.08, 0.42], [0.26, 0.38], [0.32, 0.86], [0.04, 0.88]], '#7a1a14'); e(0.2, 0.36, 0.045, 0.06, 0, '#d0a080'); poly([[0.15, 0.32], [0.26, 0.32], [0.18, 0.14]], '#4a1a18');
    poly([[0.68, 0.36], [0.88, 0.34], [0.9, 0.86], [0.64, 0.86]], '#3a2410');                                // the armchair
    poly([[0.7, 0.4], [0.86, 0.4], [0.84, 0.82], [0.72, 0.82]], '#8c7a58'); e(0.78, 0.36, 0.045, 0.06, 0, '#c49878');
    poly([[0.75, 0.4], [0.81, 0.4], [0.795, 0.54], [0.765, 0.54]], '#c8c0b0');                               // the beard
    poly([[0.73, 0.32], [0.83, 0.32], [0.79, 0.12]], '#6a2a20');
    e(0.45, 0.42, 0.04, 0.05, 0, '#3a2a20'); poly([[0.4, 0.46], [0.5, 0.46], [0.52, 0.6], [0.38, 0.6]], '#2a3a4a');   // a third, behind the table
    for (const [x, y] of [[0.3, 0.6], [0.4, 0.62], [0.55, 0.59]]) { poly([[x, y - 0.06], [x + 0.012, y - 0.06], [x + 0.012, y], [x, y]], '#e8dcc0'); glow(x + 0.006, y - 0.08, 0.06, 'rgba(255,200,120,0.6)'); }   // candles
    for (let i = 0; i < 6; i++) e(0.25 + R() * 0.4, 0.62 + R() * 0.1, 0.02, 0.012, R(), R() < 0.5 ? '#b89050' : '#e0d0b0');   // cups, papers
    glow(0.42, 0.55, 0.5, 'rgba(255,190,110,0.22)');
  }
  // soften the blocking-in, model the forms (light from the upper left, a dark ground), then break it into strokes:
  // each a short dab of the colour under it, a little lighter or darker
  { const t = makeCanvas(W, H), tg = t.getContext('2d'); tg.filter = `blur(${Math.round(W / 160)}px)`; tg.drawImage(c, 0, 0); g.drawImage(t, 0, 0); }
  const shade = g.createLinearGradient(0, 0, W, H * 0.6); shade.addColorStop(0, 'rgba(255,230,190,0.12)'); shade.addColorStop(1, 'rgba(0,0,0,0.25)');
  g.globalCompositeOperation = 'soft-light'; g.fillStyle = shade; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
  if (kind === 'genre') {   // books and bottles on shelves in the gloom behind, faces and hands lit by the candles
    for (let sy = 0.12; sy < 0.5; sy += 0.09) for (let x = 0.02; x < 0.58; x += 0.012 + R() * 0.01) { const h = 0.04 + R() * 0.03; g.fillStyle = `rgba(${60 + R() * 60},${30 + R() * 30},${15 + R() * 20},0.55)`; g.fillRect(x * W, (sy - h) * H, 0.009 * W, h * H); }
    for (const [x, y, r] of [[0.2, 0.36, 0.03], [0.78, 0.36, 0.03], [0.45, 0.42, 0.025], [0.24, 0.62, 0.015], [0.74, 0.6, 0.015]]) glow(x, y, r * 1.4, 'rgba(255,214,160,0.45)');
  } else {
    glow(0.5, 0.14, 0.05, 'rgba(255,224,190,0.5)'); glow(0.47, 0.42, 0.12, 'rgba(255,200,180,0.18)');
  }
  const src = g.getImageData(0, 0, W, H).data, n = Math.round(W * H / 70);
  g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = R() * W, y = R() * H, k = (Math.floor(y) * W + Math.floor(x)) * 4, v = 0.9 + R() * 0.2, a = R() * Math.PI, L = 2 + R() * 6;
    g.strokeStyle = `rgba(${Math.min(255, src[k] * v)},${Math.min(255, src[k + 1] * v)},${Math.min(255, src[k + 2] * v)},0.6)`; g.lineWidth = 1.5 + R() * 2.5;
    g.beginPath(); g.moveTo(x - Math.cos(a) * L, y - Math.sin(a) * L); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke();
  }
  g.fillStyle = 'rgba(110,80,25,0.26)'; g.fillRect(0, 0, W, H);   // old varnish
  const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  return c;
}
function oilMat(cv) {
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return procMat({ name: 'oil', rgb: [1, 1, 1], rough: 0.32, bump: 1, uv: true, std: { map: t }, frag: /* glsl */ `
    float cr = 1.0 - smoothstep(0.0, 0.02, abs(cgVn(vec3(UV * 90.0, 1.0)) - 0.5));   // craquelure
    diffuseColor.rgb *= 1.0 - 0.25 * cr; cgH = cgVn(vec3(UV * 400.0, 2.0)) * 0.0006 - cr * 0.0004; cgRough = 0.25 + 0.2 * cr;
  ` });
}

// ---- set geometry helpers (facet-local: x along the wall, y up, z out of the wall into the room)
function gcrPut(k, mat, g) { return put(mat, g.applyMatrix4(gcrM(k))); }
function lbox(k, x0, x1, y0, y1, z0, z1, mat = 'gstone', bevel = 0.03) {
  const w = x1 - x0, h = y1 - y0, d = z1 - z0;
  const g = (bevel > 0 ? new RoundedBoxGeometry(w, h, d, 2, Math.min(bevel, w / 4, h / 4, d / 4)) : new THREE.BoxGeometry(w, h, d)).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return gcrPut(k, mat, uvPlanar(g));
}
// a surface between two outlines with the same number of points (x, y) at depths zA and zB; uv = (across, along the
// outline), so the stone courses run round an arch like voussoirs; turned to face `want` (a function of the point)
function loftGeo(A, zA, B, zB, want) {
  const n = A.length, pos = [], uv = [], arc = [0];
  for (let i = 1; i <= n; i++) arc.push(arc[i - 1] + Math.hypot(A[i % n][0] - A[i - 1][0], A[i % n][1] - A[i - 1][1]));
  let flip = null;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, a0 = [A[i][0], A[i][1], zA], a1 = [A[j][0], A[j][1], zA], b0 = [B[i][0], B[i][1], zB], b1 = [B[j][0], B[j][1], zB];
    const u0 = Math.hypot(b0[0] - a0[0], b0[1] - a0[1], b0[2] - a0[2]), u1 = Math.hypot(b1[0] - a1[0], b1[1] - a1[1], b1[2] - a1[2]);
    if (flip === null) {
      const e1 = [a1[0] - a0[0], a1[1] - a0[1], a1[2] - a0[2]], e2 = [b1[0] - a0[0], b1[1] - a0[1], b1[2] - a0[2]];
      const nn = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]], w = want(a0);
      if (Math.hypot(...nn) > 1e-6) flip = nn[0] * w[0] + nn[1] * w[1] + nn[2] * w[2] < 0;
    }
    const T = [[a0, 0, arc[i]], [a1, 0, arc[i + 1]], [b1, u1, arc[i + 1]], [a0, 0, arc[i]], [b1, u1, arc[i + 1]], [b0, u0, arc[i]]];
    if (flip) { [T[1], T[2]] = [T[2], T[1]]; [T[4], T[5]] = [T[5], T[4]]; }
    for (const [p, u, v] of T) { pos.push(...p); uv.push(u, v); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}
const outlineAt = (pts, dx, dy) => pts.map(([x, y]) => [x + dx, y + dy]);
// an opening { hw, ys, k, dx, dy }: its outline (pointed head of radius k x span), or the outline offset outward by o
// (the head's arcs keep their centres, so a moulding or a cut follows the arch evenly)
const opn = (p, o = 0) => outlineAt(openingPts(p.hw + o, p.ys, 'pointed', (p.k * 2 * p.hw + o) / (2 * (p.hw + o))), p.dx || 0, p.dy || 0);
const jambChain = (O) => [...O.slice(1), O[0]];   // up the right jamb, over the head, down the left one (no threshold)
// the stone ring round an opening on the wall face (voussoirs), standing proud by d
function archSurround(k, p, o, d) {
  const inner = jambChain(opn(p)), outer = jambChain(opn(p, o)), cx = p.dx || 0, cy = (p.dy || 0) + 1.0;
  for (const P of [{ A: inner, zA: d, B: outer, zB: d, want: () => [0, 0, 1] }, { A: inner, zA: 0, B: inner, zB: d, want: ([x, y]) => [cx - x, cy - y, 0] }, { A: outer, zA: 0, B: outer, zB: d, want: ([x, y]) => [x - cx, y - cy, 0] }]) {
    const g = loftGeo(P.A, P.zA, P.B, P.zB, P.want), keep = (P.A.length - 1) * 6;   // drop the quad that closes the chain
    const h = new THREE.BufferGeometry();
    for (const [k2, n] of [['position', 3], ['uv', 2], ['normal', 3]]) h.setAttribute(k2, new THREE.Float32BufferAttribute(g.attributes[k2].array.slice(0, keep * n), n));
    gcrPut(k, 'gstone', h);
  }
}
// a cylinder seen from inside (normals and winding turned inward), uv in metres
function insideCyl(cx, cz, y0, y1, r, mat, n = 40, t0 = 0, tl = Math.PI * 2) {
  const g = new THREE.CylinderGeometry(r, r, y1 - y0, n, 1, true, t0, tl).translate(cx, (y0 + y1) / 2, cz);
  const p = g.attributes.position, nm = g.attributes.normal, uv = g.attributes.uv, ix = g.index.array;
  for (let i = 0; i < p.count; i++) { nm.setXYZ(i, -nm.getX(i), -nm.getY(i), -nm.getZ(i)); uv.setXY(i, uv.getX(i) * tl * r, p.getY(i)); }
  for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; }
  return put(mat, g);
}
const white = (g) => { g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(1), 3)); return g; };
// a bobbin-turned leg (the small tables, c06): square-ish ends, a run of bobbins between
function bobbinGeo(h, r) {
  const pr = [[0, 0], [r * 0.9, 0], [r * 0.9, 0.06]], a = 0.14, b = 0.86, n = 6;
  for (let i = 0; i <= n * 4; i++) { const t = i / (n * 4); pr.push([r * (0.62 + 0.38 * Math.abs(Math.sin(t * Math.PI * n))), a + (b - a) * t]); }
  pr.push([r * 0.9, b + 0.02], [r * 0.9, 1], [0, 1]);
  return lathe(pr.map(([x, y]) => [x, y * h]), 10);
}

// ---- upholstery, sculpted as distance fields and meshed (local: x across, y up, z toward the front)
const wob = (x, y, z, a, f) => a * noise3(x * f, y * f, z * f);
function leanBack(y, z, py, pz, ang) { const c = Math.cos(ang), s = Math.sin(ang), yy = y - py, zz = z - pz; return [yy * c - zz * s, yy * s + zz * c]; }
// a club armchair (c08): skirted base, a plump seat cushion, a leaning back, rolled arms overhanging the sides
function sdClub(x, y, z) {
  let d = sdBox(x, y, z, 0, 0.27, -0.02, 0.45, 0.19, 0.44, 0.07);
  d = smin(d, sdBox(x, y, z, 0, 0.47, 0.07, 0.29, 0.075, 0.35, 0.065), 0.02);
  const [by, bz] = leanBack(y, z, 0.42, -0.33, 0.15);
  d = smin(d, sdBox(x, by, bz, 0, 0.22, 0, 0.43, 0.27, 0.11, 0.1), 0.05);
  for (const s of [-1, 1]) {
    const arm = sdBox(x, y, z, s * 0.37, 0.38, 0.0, 0.08, 0.17, 0.43, 0.06);
    const roll = sdCap(x, y, z, s * 0.39, 0.56, 0.42, s * 0.39, 0.6, -0.33, 0.105);
    d = smin(d, smin(arm, roll, 0.07), 0.03);
  }
  return d + wob(x, y, z, 0.004, 13) + wob(x, y, z, 0.0015, 41);
}
// a wingback (c06): a tall back with wings, lower arms ending in scrolls, a fringed skirt
function sdWing(x, y, z) {
  let d = sdBox(x, y, z, 0, 0.3, 0.0, 0.42, 0.17, 0.42, 0.05);
  d = smin(d, sdBox(x, y, z, 0, 0.5, 0.06, 0.31, 0.06, 0.34, 0.05), 0.02);
  const [by, bz] = leanBack(y, z, 0.4, -0.34, 0.1);
  d = smin(d, sdBox(x, by, bz, 0, 0.42, 0, 0.42, 0.45, 0.09, 0.08), 0.04);
  for (const s of [-1, 1]) {
    const wing = sdBox(x, y, z, s * 0.4, 0.86, -0.17, 0.045, 0.28, 0.2, 0.045);
    const arm = sdBox(x, y, z, s * 0.37, 0.47, 0.02, 0.07, 0.16, 0.4, 0.05);
    const scroll = sdCap(x, y, z, s * 0.33, 0.6, 0.38, s * 0.43, 0.6, 0.38, 0.085);
    d = smin(d, smin(smin(wing, arm, 0.08), scroll, 0.04), 0.03);
  }
  return d + wob(x, y, z, 0.0035, 13) + wob(x, y, z, 0.0015, 41);
}
// a three-seat sofa (c08): 2.2 m, three seat cushions, loose back cushions, rolled arms
function sdSofa(x, y, z) {
  let d = sdBox(x, y, z, 0, 0.27, -0.02, 1.1, 0.19, 0.45, 0.07);
  for (const cx of [-0.6, 0, 0.6]) d = smin(d, sdBox(x, y, z, cx * 0.93, 0.48, 0.08, 0.27, 0.075, 0.34, 0.065), 0.012);
  const [by, bz] = leanBack(y, z, 0.42, -0.34, 0.15);
  d = smin(d, sdBox(x, by, bz, 0, 0.22, 0, 1.08, 0.27, 0.11, 0.1), 0.05);
  for (const cx of [-0.47, 0.47]) d = smin(d, sdBox(x, by, bz + 0.12, cx, 0.28, 0, 0.44, 0.2, 0.08, 0.08), 0.03);
  for (const s of [-1, 1]) {
    const arm = sdBox(x, y, z, s * 1.0, 0.38, 0.0, 0.09, 0.17, 0.43, 0.06);
    const roll = sdCap(x, y, z, s * 1.03, 0.57, 0.43, s * 1.03, 0.61, -0.33, 0.12);
    d = smin(d, smin(arm, roll, 0.07), 0.03);
  }
  return d + wob(x, y, z, 0.004, 12) + wob(x, y, z, 0.0015, 39);
}
// the blanket thrown over the sofa's end: a thin shell just off its surface, cut to a ragged patch
function sdBlanket(x, y, z) {
  const sh = Math.abs(sdSofa(x, y, z) - 0.02) - 0.008 + wob(x, y, z, 0.006, 9);
  const reg = sdBox(x, y, z, -0.82, 0.45, -0.02, 0.42, 0.7, 0.62, 0.05) + wob(x, y, z, 0.05, 5);
  return smax(sh, reg, 0.01);
}
function sdStool(x, y, z) {
  return smin(sdBox(x, y, z, 0, 0.33, 0, 0.29, 0.06, 0.19, 0.05), sdEll(x, y, z, 0, 0.36, 0, 0.27, 0.06, 0.17), 0.03) + wob(x, y, z, 0.002, 20);
}
// a cushion: square, plump in the middle, pinched to a seam at the edges (front toward +z)
function sdPillow(x, y, z) {
  const a = 0.2, ex = Math.max(0, 1 - (x / a) ** 2), ey = Math.max(0, 1 - (y / a) ** 2);
  const t = 0.075 * Math.pow(ex * ey, 0.35) + 0.01;
  const qx = Math.abs(x) - a + 0.03, qy = Math.abs(y) - a + 0.03, b2 = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - 0.03;
  return Math.max(b2, Math.abs(z) - t) * 0.8 + wob(x, y, z, 0.003, 18);
}
const GCR_SDF = {};
const GCR_SDF_DEF = {
  club: [sdClub, [-0.62, -0.02, -0.62], [0.62, 1.0, 0.62], 0.02],
  wing: [sdWing, [-0.6, 0.05, -0.6], [0.6, 1.3, 0.62], 0.02],
  sofa: [sdSofa, [-1.3, -0.02, -0.62], [1.3, 1.0, 0.62], 0.022],
  blanket: [sdBlanket, [-1.3, -0.02, -0.68], [-0.3, 1.05, 0.68], 0.014],
  stool: [sdStool, [-0.36, 0.2, -0.26], [0.36, 0.48, 0.26], 0.015],
  pillow: [sdPillow, [-0.24, -0.24, -0.12], [0.24, 0.24, 0.12], 0.011],
};
function gcrSculpt(name) {
  if (GCR_SDF[name]) return GCR_SDF[name];
  const [f, min, max, cell] = GCR_SDF_DEF[name], t0 = performance.now(), geo = meshSDF(f, { min, max, cell, ao: 0.04 });
  if (HEADLESS) console.log('[sculpt]', name, Math.round(performance.now() - t0), 'ms', geo.attributes.position.count, 'verts');
  return (GCR_SDF[name] = geo);
}
async function gcrSculptAsync() {   // meshed in idle time after the castle has loaded
  for (const [name, [f, min, max, cell]] of Object.entries(GCR_SDF_DEF)) if (!GCR_SDF[name]) GCR_SDF[name] = await meshSDFAsync(f, { min, max, cell, ao: 0.04 });
}

// ---- joinery and small things (built in their own frame, front toward +z, then instanced)
function gcrSideTable(w = 0.6, d = 0.42, h = 0.56) {
  const P = [new RoundedBoxGeometry(w, 0.035, d, 1, 0.01).translate(0, h - 0.0175, 0), new THREE.BoxGeometry(w - 0.1, 0.07, d - 0.1).translate(0, h - 0.07, 0)];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.push(bobbinGeo(h - 0.035, 0.026).translate(sx * (w / 2 - 0.06), 0, sz * (d / 2 - 0.06)));
  for (const sz of [-1, 1]) P.push(new THREE.BoxGeometry(w - 0.12, 0.035, 0.03).translate(0, 0.08, sz * (d / 2 - 0.06)));
  for (const sx of [-1, 1]) P.push(new THREE.BoxGeometry(0.03, 0.035, d - 0.12).translate(sx * (w / 2 - 0.06), 0.08, 0));
  return merge(P);
}
function gcrStudyTable(w = 2.3, d = 1.0, h = 0.78) {
  const P = [new RoundedBoxGeometry(w, 0.05, d, 1, 0.015).translate(0, h - 0.025, 0), new THREE.BoxGeometry(w - 0.16, 0.1, d - 0.16).translate(0, h - 0.1, 0)];
  for (const sx of [-1, 0, 1]) for (const sz of [-1, 1]) P.push(turnedGeo(h - 0.05, 0.05, 12).translate(sx * (w / 2 - 0.1), 0, sz * (d / 2 - 0.1)));
  P.push(new THREE.BoxGeometry(w - 0.2, 0.05, 0.05).translate(0, 0.12, 0));
  for (const sx of [-1, 0, 1]) P.push(new THREE.BoxGeometry(0.05, 0.05, d - 0.2).translate(sx * (w / 2 - 0.1), 0.12, 0));
  return merge(P);
}
// a spindle-back chair (c08): turned front legs, the back legs rising into stiles, a top rail over five spindles
function gcrChair() {
  const P = [new RoundedBoxGeometry(0.44, 0.035, 0.42, 1, 0.012).translate(0, 0.46, 0)];
  for (const sx of [-1, 1]) {
    P.push(turnedGeo(0.445, 0.024, 10).translate(sx * 0.19, 0, 0.18));
    P.push(new THREE.CylinderGeometry(0.018, 0.022, 0.98, 8).translate(0, 0.49, 0).rotateX(-0.08).translate(sx * 0.19, 0, -0.17));
    P.push(new THREE.SphereGeometry(0.026, 8, 6).translate(sx * 0.19, 0.985, -0.25));
    P.push(new THREE.BoxGeometry(0.025, 0.025, 0.36).translate(sx * 0.19, 0.16, 0));
  }
  P.push(new RoundedBoxGeometry(0.42, 0.08, 0.035, 1, 0.012).translate(0, 0.9, -0.235), new THREE.BoxGeometry(0.38, 0.03, 0.025).translate(0, 0.56, -0.2), new THREE.BoxGeometry(0.36, 0.025, 0.025).translate(0, 0.18, 0));
  for (let i = 0; i < 5; i++) P.push(new THREE.CylinderGeometry(0.009, 0.009, 0.32, 6).translate(0, 0.72, 0).rotateX(-0.07).translate(-0.12 + i * 0.06, 0, -0.205));
  return merge(P);
}
// an oak dresser (c03, c08): plinth, two doors each with two blind pointed arches and roundels, drawers, a moulded top
function gcrDresser(w = 1.55, h = 1.3, d = 0.5) {
  const P = [new THREE.BoxGeometry(w, h - 0.14, d).translate(0, 0.08 + (h - 0.14) / 2, 0), new THREE.BoxGeometry(w + 0.04, 0.08, d + 0.03).translate(0, 0.04, 0.0)];
  P.push(new RoundedBoxGeometry(w + 0.1, 0.05, d + 0.08, 1, 0.015).translate(0, h - 0.035, 0.02), new THREE.BoxGeometry(w + 0.04, 0.04, d + 0.04).translate(0, h - 0.08, 0.01));
  const dw = (w - 0.12) / 2;
  for (const sx of [-1, 1]) {
    const cx = sx * (dw / 2 + 0.02);
    P.push(new THREE.BoxGeometry(dw - 0.02, 0.8, 0.025).translate(cx, 0.52, d / 2 + 0.012));
    for (const ox of [-0.17, 0.17]) {
      const fr = pathPts(new THREE.Shape(), openingPts(0.14, 0.5, 'pointed', 0.7));
      fr.holes.push(pathPts(new THREE.Path(), outlineAt(openingPts(0.105, 0.5, 'pointed', 0.7), 0, 0.03), true));
      P.push(new THREE.ExtrudeGeometry(fr, { depth: 0.018, bevelEnabled: false, curveSegments: 6 }).translate(cx + ox, 0.2, d / 2 + 0.024));
      P.push(new THREE.ExtrudeGeometry(pathPts(new THREE.Shape(), quatrefoilPts(0, 0, 0.05, 24)), { depth: 0.01, bevelEnabled: false }).translate(cx + ox, 0.82, d / 2 + 0.024));
    }
    P.push(new THREE.BoxGeometry(dw - 0.02, 0.17, 0.025).translate(cx, 1.03, d / 2 + 0.012));
  }
  return merge(P);
}
function gcrDesk(w = 1.3, d = 0.62, h = 0.78) {
  const P = [new RoundedBoxGeometry(w, 0.04, d, 1, 0.012).translate(0, h - 0.02, 0)];
  for (const sx of [-1, 1]) { P.push(new THREE.BoxGeometry(0.36, 0.6, d - 0.04).translate(sx * (w / 2 - 0.2), h - 0.34, 0)); P.push(new THREE.BoxGeometry(0.4, 0.14, d).translate(sx * (w / 2 - 0.2), 0.07, 0)); }
  for (const sx of [-1, 1]) for (let r = 0; r < 3; r++) P.push(new THREE.BoxGeometry(0.3, 0.16, 0.02).translate(sx * (w / 2 - 0.2), h - 0.14 - r * 0.19, d / 2 - 0.005));
  P.push(new THREE.BoxGeometry(w - 0.78, 0.1, 0.02).translate(0, h - 0.1, d / 2 - 0.01));
  return merge(P);
}
// a brass oil lamp (c06, c10): a round foot, a turned column, the oil fount, a collar and a frosted globe
const GCR_LAMP = {
  brass: lathe([[0, 0], [0.085, 0], [0.09, 0.012], [0.07, 0.03], [0.04, 0.045], [0.022, 0.07], [0.02, 0.2], [0.03, 0.22], [0.02, 0.24], [0.02, 0.27], [0.06, 0.3], [0.075, 0.34], [0.07, 0.37], [0.035, 0.4], [0.035, 0.43], [0.05, 0.44], [0.05, 0.455], [0, 0.455]], 20),
  globe: new THREE.SphereGeometry(0.085, 18, 12).scale(1, 0.92, 1).translate(0, 0.53, 0), top: 0.53,
};

// ---- the room
function buildGryffindorCommon(sc) {
  const { A, H, T } = GCR, L = GCR.L, Lo = 2 * (A + T) * Math.tan(Math.PI / 8), points = [], bay = GCR_BAY;
  const bayOut = { hw: bay.hw, ys: bay.ys, k: bay.k, dy: bay.seat }, bayIn = { hw: bay.hb, ys: bay.ys, k: bay.k, dy: bay.seat };
  const door = { hw: 0.8, ys: 2.05, k: 0.56 };                     // the dormitory stair (facet 3)
  const ent = { hw: 0.85, ys: 1.7, k: 0.56, dy: 0.57 };             // the portrait hole (facet 5), three steps up
  const nook = { hw: 0.24, ys: 0.8, k: 0.7, dx: -1.47, dy: 1.3 }, nookIn = { ...nook, hw: 0.17 };   // the inglenook's little window (facet 0)
  const hiO = { hw: 0.66, ys: 1.7, k: 0.7, dy: 6.1 }, hiI = { ...hiO, hw: 0.4 };                       // the high lancets (facets 2, 3, 6; c08)
  const holes = { 0: [nook], 1: [bayOut], 2: [hiO], 3: [door, hiO], 4: [], 5: [ent], 6: [hiO], 7: [bayOut] };

  // ---- floor and walls; a moulded string course over the tapestries
  put('gflag', new THREE.PlaneGeometry(2 * (A + T) + 2, 2 * (A + T) + 2).rotateX(-Math.PI / 2));
  for (let k = 0; k < 8; k++) {
    const sh = pathPts(new THREE.Shape(), [[-Lo / 2, -0.2], [Lo / 2, -0.2], [Lo / 2, H + 0.4], [-Lo / 2, H + 0.4]]);
    for (const o of holes[k]) sh.holes.push(pathPts(new THREE.Path(), opn(o), true));
    gcrPut(k, 'gstone', uvPlanar(new THREE.ExtrudeGeometry(sh, { depth: T, bevelEnabled: false, curveSegments: 8 }).translate(0, 0, -T)));
    for (const [a, b] of GCR_BAYS.includes(k) ? [[-L / 2 - 0.15, -bay.hw - 0.3], [bay.hw + 0.3, L / 2 + 0.15]] : [[-L / 2 - 0.15, L / 2 + 0.15]]) {
      lbox(k, a, b, GCR.string, GCR.string + 0.16, 0, 0.13, 'gstone', 0.03);
      lbox(k, a, b, GCR.string + 0.16, GCR.string + 0.24, 0, 0.07, 'gstone', 0.02);
    }
  }
  // ---- the window bays: splayed reveals under a pointed rear arch, a stone seat, two-light leaded windows with a transom
  const W2 = traceryWindow(2 * bay.hb, bay.ys, 'pointed', bay.k, 2, [1.95], { frame: 0.13, mull: 0.1, depth: 0.2 });
  for (const k of GCR_BAYS) {
    gcrPut(k, 'gstone', loftGeo(opn(bayOut), 0, opn(bayIn), -bay.d, ([x, y]) => [-x, -(y - 2.5), 0]));
    gcrPut(k, 'gstone', W2.stone.clone().translate(0, bay.seat, -bay.d - 0.1));
    gcrPut(k, 'gglass', W2.glass.clone().translate(0, bay.seat, -bay.d - 0.1));
    archSurround(k, bayOut, 0.26, 0.07);
  }
  const W1 = traceryWindow(2 * hiI.hw, hiI.ys, 'pointed', hiI.k, 1, [], { frame: 0.1, mull: 0.08, depth: 0.16 });
  for (const k of [2, 3, 6]) {
    gcrPut(k, 'gstone', loftGeo(opn(hiO), 0, opn(hiI), -0.95, ([x, y]) => [-x, -(y - 6.8), 0]));
    gcrPut(k, 'gstone', W1.stone.clone().translate(0, hiI.dy, -1.0));
    gcrPut(k, 'gglass', W1.glass.clone().translate(0, hiI.dy, -1.0));
  }

  // ---- the ceiling: boards on radial beams from stepped stone corbels at the corners, a ring of beams, joists, a boss
  {
    const rv = (A + T) / Math.cos(Math.PI / 8), oct = [];
    for (let i = 0; i < 8; i++) { const a = (i + 0.5) * Math.PI / 4; oct.push([Math.sin(a) * rv, -Math.cos(a) * rv]); }
    const cg = new THREE.ShapeGeometry(pathPts(new THREE.Shape(), oct)).rotateX(Math.PI / 2).translate(0, H, 0);
    const p = cg.attributes.position, uv = cg.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i), p.getZ(i));
    put('oak', cg);
    const rin = A / Math.cos(Math.PI / 8);
    for (let i = 0; i < 8; i++) {
      const a = (i + 0.5) * Math.PI / 4, vx = Math.sin(a), vz = -Math.cos(a);
      beam([vx * (rin + 0.2), H - 0.28, vz * (rin + 0.2)], [vx * 0.35, H - 0.28, vz * 0.35], 0.42, 'oak');
      for (let s = 0; s < 3; s++) {
        const len = 0.45 + s * 0.22, g = new THREE.BoxGeometry(0.6 - s * 0.1, 0.3, len).translate(0, H - 0.64 - s * 0.3, -len / 2 + 0.25);
        put('gstone', uvPlanar(g.rotateY(Math.atan2(vx, vz) + Math.PI).translate(vx * rin, 0, vz * rin)));
      }
    }
    const rr = 2.7;
    for (let i = 0; i < 8; i++) { const a0 = (i + 0.5) * Math.PI / 4, a1 = (i + 1.5) * Math.PI / 4; beam([Math.sin(a0) * rr, H - 0.62, -Math.cos(a0) * rr], [Math.sin(a1) * rr, H - 0.62, -Math.cos(a1) * rr], 0.32, 'oak'); }
    for (let i = 0; i < 8; i++) for (const f of [0.55, 0.8]) {
      const a0 = (i + 0.5) * Math.PI / 4, a1 = (i + 1.5) * Math.PI / 4, r = rin * f;
      beam([Math.sin(a0) * r, H - 0.14, -Math.cos(a0) * r], [Math.sin(a1) * r, H - 0.14, -Math.cos(a1) * r], 0.2, 'oak');
    }
    put('oak', lathe([[0, 0], [0.5, 0], [0.5, 0.12], [0.36, 0.22], [0.42, 0.34], [0.2, 0.5], [0.12, 0.7], [0, 0.78]], 16).rotateX(Math.PI).translate(0, H - 0.2, 0));
  }

  // ---- the great fireplace (facet 0, c06)
  {
    const k = 0, HOOD = { y0: 4.25, w0: 4.35, d0: 1.62, w1: 2.15, d1: 0.7 }, top = H + 0.3;
    lbox(k, -2.23, 2.23, 3.0, 3.95, 0, 1.75, 'gstone', 0.05);                 // the lintel
    lbox(k, -2.36, 2.36, 3.93, 4.08, 0, 1.9, 'gstone', 0.05);                 // its moulded cap
    lbox(k, -2.29, 2.29, 4.06, HOOD.y0 + 0.02, 0, 1.8, 'gstone', 0.04);
    {   // the hood, tapering to the ceiling
      const g = new THREE.BoxGeometry(1, 1, 1, 6, 14, 3).translate(0, 0.5, 0.5), p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const t = p.getY(i); p.setXYZ(i, p.getX(i) * lerp(HOOD.w0, HOOD.w1, t), HOOD.y0 + t * (top - HOOD.y0), p.getZ(i) * lerp(HOOD.d0, HOOD.d1, t)); }
      g.computeVertexNormals(); gcrPut(k, 'gstone', uvPlanar(g));
    }
    for (const s of [-1, 1]) lbox(k, s < 0 ? -2.23 : 1.96, s < 0 ? -1.96 : 2.23, 0, 3.0, 0, 1.72, 'gstone', 0.05);   // the cheeks
    lbox(k, -0.98, -0.34, 0, 3.0, 0.45, 1.6, 'gstone', 0.05);                   // the pier between the inglenook and the hearth
    lbox(k, -0.34, 1.96, 0, 0.06, 0, 2.4, 'gstone', 0.02);                       // the hearth stone
    lbox(k, 0.08, 1.64, 0.06, 1.25, 0.0, 0.04, 'paintBlack', 0.01);              // the iron fireback
    // the inglenook: a stone bench with a cushion under the little window
    lbox(k, -1.96, -0.98, 0, 0.45, 0, 0.6, 'gstone', 0.03);
    gcrPut(k, 'gstone', loftGeo(opn(nook), 0, opn(nookIn), -0.7, ([x, y]) => [-(x - nook.dx), -(y - 1.6), 0]));
    gcrPut(k, 'gglass', new THREE.ShapeGeometry(pathPts(new THREE.Shape(), opn(nookIn))).translate(0, 0, -0.72));
    addInst(white(new RoundedBoxGeometry(0.92, 0.1, 0.55, 3, 0.04)), M.velvet, [gcrM(k, -1.47, 0.5, 0.3)], [[0.32, 0.03, 0.03]]);
    // the crest carved on the hood, leaning back with its face
    {
      const y = 6.45, t = (y - HOOD.y0) / (top - HOOD.y0), w = lerp(HOOD.d0, HOOD.d1, t), tilt = Math.atan((HOOD.d0 - HOOD.d1) / (top - HOOD.y0));
      const g = reliefGeo(houseCrestHeight(HOUSES4[0]), 1.95, 2.55, 0.2, 280).rotateX(-tilt).translate(0, y, w + 0.005);
      addSculpt(g.applyMatrix4(gcrM(k)), M.gcarve);
    }
    // andirons, logs burning on them, the fire, logs stacked by the pier, the wire screen
    for (const u of [0.38, 1.32]) {
      lbox(k, u - 0.025, u + 0.025, 0.06, 0.2, 0.35, 1.25, 'paintBlack', 0.01);
      lbox(k, u - 0.03, u + 0.03, 0.06, 0.5, 1.2, 1.28, 'paintBlack', 0.01);
      gcrPut(k, 'paintBlack', new THREE.SphereGeometry(0.045, 10, 8).translate(u, 0.52, 1.24));
    }
    for (const [u, y, w, r, a] of [[0.85, 0.24, 0.75, 0.085, 0.05], [0.85, 0.25, 1.0, 0.075, -0.06], [0.8, 0.38, 0.86, 0.07, 0.15], [0.95, 0.36, 0.62, 0.06, -0.2]]) {
      const g = new THREE.CylinderGeometry(r, r * 1.05, 1.15, 12).rotateZ(Math.PI / 2).rotateY(a);
      const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), uv.getY(i) * 1.6);
      gcrPut(k, 'ember', g.translate(u, y, w));
    }
    const FR = rng('gryfffire');
    for (let i = 0; i < 36; i++) { const u = 0.26 + FR() * 1.2, c = clamp(1 - Math.abs(u - 0.85) / 0.65, 0, 1), s = 0.5 + FR() * 0.7, p = gcrP(k, u, 0.28 + FR() * 0.1, 0.62 + FR() * 0.5); fireTongue(p[0], p[1], p[2], (0.2 + 0.3 * FR()) * s, (0.3 + 0.8 * FR() * c) * (0.55 + 0.45 * c)); }
    for (const [u, y, w, a, r] of [[-0.25, 0.13, 1.85, 0.2, 0.075], [-0.05, 0.13, 1.9, 0.1, 0.07], [0.15, 0.13, 1.8, -0.1, 0.08], [-0.15, 0.27, 1.86, 0.15, 0.07], [0.05, 0.27, 1.9, 0.0, 0.075], [-0.05, 0.4, 1.88, 0.1, 0.065]]) {
      const len = 0.62, side = new THREE.CylinderGeometry(r, r, len, 12, 1, true), cap = new THREE.CircleGeometry(r * 0.98, 12);
      const m = gcrM(k).multiply(new THREE.Matrix4().makeTranslation(u, y + 0.06, w)).multiply(new THREE.Matrix4().makeRotationY(a)).multiply(new THREE.Matrix4().makeRotationZ(Math.PI / 2));
      put('bark', side.applyMatrix4(m));
      for (const e of [-1, 1]) put('endgrain', cap.clone().rotateX(e > 0 ? -Math.PI / 2 : Math.PI / 2).translate(0, e * len / 2, 0).applyMatrix4(m));
    }
    {   // the screen: a centre panel and two wings of iron mesh in a brass frame
      const pan = (u0, u1, w0, w1) => {
        const dx = u1 - u0, dz = w1 - w0, Lp = Math.hypot(dx, dz), ry = Math.atan2(-dz, dx), y0 = 0.1, y1 = 0.92;
        const g = new THREE.PlaneGeometry(Lp, y1 - y0), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Lp, uv.getY(i) * (y1 - y0));
        addMesh(g.rotateY(ry).translate((u0 + u1) / 2, (y0 + y1) / 2, (w0 + w1) / 2).applyMatrix4(gcrM(k)), M.ironMesh, { cast: false, recv: false });   // no shadow: it would hide the fire
        for (const y of [y0, y1]) gcrPut(k, 'brass', new THREE.CylinderGeometry(0.012, 0.012, Lp, 8).rotateZ(Math.PI / 2).rotateY(ry).translate((u0 + u1) / 2, y, (w0 + w1) / 2));
        for (const [u, w] of [[u0, w0], [u1, w1]]) { gcrPut(k, 'brass', new THREE.CylinderGeometry(0.014, 0.014, 0.9, 8).translate(u, 0.51, w)); gcrPut(k, 'brass', new THREE.SphereGeometry(0.026, 8, 6).translate(u, 0.97, w)); }
      };
      pan(0.12, 1.58, 2.05, 2.05); pan(-0.2, 0.12, 1.78, 2.05); pan(1.58, 1.88, 2.05, 1.78);
    }
    const p = gcrP(k, 0.85, 0.8, 1.6), fl = new THREE.PointLight(new THREE.Color(1.0, 0.5, 0.2), 0, 24, 1.6);
    fl.position.set(...p); fl.castShadow = true; fl.shadow.mapSize.set(1024, 1024); fl.shadow.bias = -0.002;
    fl.userData = { d: 7, n: 26 }; sc.add(fl); points.push(fl);
    LAMPS.push({ room: GCR_ROOM, p: gcrP(k, 0.85, 1.3, 2.6), c: [1.0, 0.45, 0.16].map((v) => v * 10), r: 9, see: 60 });
  }

  // ---- the dormitory stair (facet 3, c10, HBP): a round-headed doorway, a stone newel stair winding up the turret four
  // times round, past leaded windows and lamps, to a landing and a short passage into the dormitory (65b-gryffdorm.js)
  {
    const k = 3, rr = 1.45, c = gcrP(k, 0, 0, -(T + rr)), f = gcrF(k), top = GDM.Y, N = 56, rise = top / N;
    const ent0 = Math.atan2(-f.d[1], -f.d[0]);              // both doorways face this way from the newel (the room, the dormitory)
    const da = (2 * Math.PI * 4 - 1.65) / (N - 1);          // so the last tread ends beside the top landing
    archSurround(k, door, 0.3, 0.1);
    // the turret wall, open where the two doorways are (three's cylinder angle runs from +z: theta = pi/2 - our angle)
    insideCyl(c[0], c[2], -0.1, 3.0, rr, 'gstone', 40, Math.PI / 2 - ent0 + 0.58, 2 * Math.PI - 1.16);
    insideCyl(c[0], c[2], 3.0, top, rr, 'gstone', 40);
    insideCyl(c[0], c[2], top, top + 3.2, rr, 'gstone', 40, Math.PI / 2 - ent0 + 0.5, 2 * Math.PI - 1.0);
    put('gstone', new THREE.CircleGeometry(rr + 0.1, 32).rotateX(Math.PI / 2).translate(c[0], top + 3.1, c[2]));
    put('gflag', new THREE.CircleGeometry(rr + 0.1, 32).rotateX(-Math.PI / 2).translate(c[0], 0.002, c[2]));
    put('gstone', new THREE.CylinderGeometry(0.17, 0.17, top + 3.1, 16).translate(c[0], (top + 3.1) / 2, c[2]));
    const sector = (a0, a1, y, th) => {
      const sh = new THREE.Shape(); sh.moveTo(Math.cos(a0) * 0.15, Math.sin(a0) * 0.15);
      for (let j = 0; j <= 10; j++) { const a = a0 + (a1 - a0) * (j / 10); sh.lineTo(Math.cos(a) * (rr + 0.02), Math.sin(a) * (rr + 0.02)); }
      sh.lineTo(Math.cos(a1) * 0.15, Math.sin(a1) * 0.15);
      put('stairstone', uvPlanar(new THREE.ExtrudeGeometry(sh, { depth: th, bevelEnabled: false }).rotateX(Math.PI / 2).translate(c[0], y, c[2])));
    };
    for (let i = 0; i < N - 1; i++) { const a0 = ent0 + 0.45 + i * da; sector(a0, a0 + da + 0.05, rise * (i + 1), 0.3); }
    sector(ent0 - 0.85, ent0 + 0.85, top, 0.32);   // the top landing
    // where a tread is under an angle a: its top height on the turn below y
    const treadAt = (a, below) => { let best = 0; for (let i = 0; i < N - 1; i++) { const a0 = ent0 + 0.45 + i * da, t = (((a - a0) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); const y = rise * (i + 1); if (t < da + 0.05 && y < below && y > best) best = y; } return best; };
    // windows (one a turn, round the far side) and lamps on brackets, each a man's height over the tread under it
    const Wt = traceryWindow(0.8, 1.0, 'tudor', 0.25, 2, [], { frame: 0.08, mull: 0.07, depth: 0.12 });
    for (const [a, y0] of [[ent0 + Math.PI - 0.75, 0], [ent0 + Math.PI + 0.4, 3.0], [ent0 + Math.PI - 0.5, 5.8], [ent0 + Math.PI + 0.7, 8.5]]) {
      const y = treadAt(a, y0 + 3.0) + 1.25, wx = c[0] + Math.cos(a) * (rr - 0.1), wz = c[2] + Math.sin(a) * (rr - 0.1), m = xf([wx, y, wz], Math.atan2(-Math.cos(a), -Math.sin(a)));
      put('stairstone', Wt.stone.clone().applyMatrix4(m)); put('gglass', Wt.glass.clone().translate(0, 0, 0.06).applyMatrix4(m));
    }
    const sl = [], sb = [], v = new THREE.Vector3();
    for (const [a, y0] of [[ent0 + 1.6, 1.0], [ent0 + 3.0, 2.4], [ent0 - 1.4, 4.0], [ent0 + 0.9, 5.4], [ent0 + 2.2, 6.8], [ent0 - 2.6, 8.0], [ent0 - 1.9, 9.0]]) {
      const y = treadAt(a, y0 + 2.8) + 1.95, m = xf([c[0] + Math.cos(a) * (rr - 0.03), y, c[2] + Math.sin(a) * (rr - 0.03)], Math.atan2(-Math.cos(a), -Math.sin(a)));
      sb.push(m); sl.push(m.clone().multiply(xf([0, -0.02, 0.24], 0, 0.75)));
    }
    addInst(merge([new THREE.BoxGeometry(0.08, 0.13, 0.025), new THREE.CylinderGeometry(0.01, 0.01, 0.24, 8).rotateX(Math.PI / 2).translate(0, -0.03, 0.12)]), M.brass, sb);
    addInst(GCR_LAMP.brass, M.brass, sl); addInst(GCR_LAMP.globe, M.globe, sl, null, { cast: false });
    for (const m of sl) { v.set(0, GCR_LAMP.top, 0).applyMatrix4(m); LAMPS.push({ room: GCR_ROOM, p: [v.x, v.y, v.z], c: [1.0, 0.6, 0.28].map((q) => q * 2.8), r: 4.0, halo: 0.16, hk: 0.45, see: 25 }); }
    // the passage from the landing through the dormitory's wall to its door (the dormitory's facet 0 faces this way)
    lbox(k, -0.78, 0.78, top - 0.35, top, -T - 0.2, -GDM.T + (GCR.A - GDM.R) + 0.02, 'stairstone', 0.0);
    for (const s of [-1, 1]) lbox(k, s < 0 ? -1.1 : 0.72, s < 0 ? -0.72 : 1.1, top, top + 2.85, -T - 0.2, -GDM.T + (GCR.A - GDM.R) + 0.02, 'gstone', 0.0);
    lbox(k, -1.1, 1.1, top + 2.78, top + 3.1, -T - 0.2, -GDM.T + (GCR.A - GDM.R) + 0.02, 'gstone', 0.0);
  }

  // ---- the portrait hole (facet 5): three steps up, a short passage, the back of the Fat Lady's portrait
  {
    const k = 5;
    archSurround(k, ent, 0.3, 0.1);
    for (let i = 0; i < 3; i++) lbox(k, -1.05 + i * 0.03, 1.05 - i * 0.03, 0, 0.19 * (i + 1), 0, 0.96 - i * 0.32, 'stairstone', 0.02);
    gcrPut(k, 'door', new THREE.ExtrudeGeometry(pathPts(new THREE.Shape(), opn(ent)), { depth: 0.08, bevelEnabled: false, curveSegments: 8 }).translate(0, 0, -T + 0.12));
    for (const y of [1.0, 2.2]) lbox(k, -0.7, 0.4, y, y + 0.06, -T + 0.2, -T + 0.22, 'paintBlack', 0.005);   // the hinge straps
  }

  // ---- tapestries: one sheet per wall or strip (cut round the openings), hung from iron hooks under the string course
  {
    const mats = [0, 1, 2, 3].map((v) => { const t = new THREE.CanvasTexture(tapestryCanvas(v)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return tapestryMat(t); });
    const y0 = GCR.tap[0], y1 = GCR.tap[1];
    const inPoly = (pts, x, y) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
    // [facet, x0, x1, design, offset in the design (m)]
    const e = L / 2 + 0.05, s0 = bay.hw + 0.33, f = L / 2 - 0.08;
    const sheets = [[1, -e, -s0, 3, 0.3], [1, s0, e, 0, 4.4], [2, -f, f, 0, 0.4], [3, -f, f, 1, 0.3], [4, -f, f, 2, 0.4],
      [5, -f, f, 3, 0.4], [6, -f, f, 1, 2.6], [7, -e, -s0, 2, 4.5], [7, s0, e, 3, 4.4]];
    const hooks = [];
    for (const [k, x0, x1, v, off] of sheets) {
      const nx = Math.max(2, Math.round((x1 - x0) / 0.06)), ny = Math.round((y1 - y0) / 0.06), cut = (holes[k] || []).map((o) => opn(o, 0.14));
      const pos = [], uv = [], idx = [], seed = k * 1.7 + x0;
      for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
        const x = x0 + (x1 - x0) * (i / nx), y = y0 + (y1 - y0) * (j / ny), hang = 1 - smooth(y1 - 0.4, y1, y);
        const z = 0.05 + (0.022 * Math.sin(x * 6.6 + seed) + 0.012 * Math.sin(x * 15.1 + seed * 2.0)) * hang + 0.01 * Math.sin(y * 3.1 + x * 0.7);
        pos.push(x, y, z); uv.push((x - x0 + off) / GCR_TAP[0], (y - y0) / GCR_TAP[1]);
      }
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1, cx = x0 + (x1 - x0) * ((i + 0.5) / nx), cy = y0 + (y1 - y0) * ((j + 0.5) / ny);
        if (cut.some((o) => inPoly(o, cx, cy))) continue;
        idx.push(a, b, d, a, d, c);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx); g.computeVertexNormals();
      addMesh(g.applyMatrix4(gcrM(k)), mats[v], { cast: false });
      for (let x = x0 + 0.12; x < x1; x += 0.42) hooks.push(gcrM(k, x, y1 - 0.06, 0.07));
    }
    addInst(merge([new THREE.CylinderGeometry(0.012, 0.012, 0.09, 6).rotateX(Math.PI / 2).translate(0, 0, -0.03), new THREE.SphereGeometry(0.02, 8, 6).translate(0, 0, 0.02)]), M.paintBlack, hooks, null, { cast: false });
  }

  // ---- paintings over the tapestries on brass wires from the hooks: [facet, u, centre height, width, height]
  {
    const PR = rng('gryffpics');
    for (const [k, u, y, w, h] of [[2, 0.0, 3.3, 1.4, 0.95], [2, -1.65, 3.1, 0.66, 0.84], [2, 1.6, 3.15, 0.64, 0.8], [6, -1.0, 3.0, 1.0, 1.9], [6, 0.55, 3.25, 0.74, 0.92], [6, 1.65, 2.8, 0.58, 0.74],
      [3, -1.75, 3.25, 0.66, 0.84], [4, -1.75, 3.4, 0.74, 0.92], [5, 0.0, 4.15, 1.3, 0.85], [7, 1.98, 3.4, 0.58, 0.74], [1, -1.98, 3.3, 0.58, 0.74]]) {
      const f = gcrF(k);
      hangPicture(gcrP(k, u, 0, 0.1), y, -f.d[0], -f.d[1], w, h, PR);
      const land = w > h * 1.15, ww = land ? Math.min(w, h * 1.6) : Math.min(h, w * 1.25) * 0.8, hh = land ? Math.min(h, ww / 1.25) : Math.min(h, w * 1.25);
      for (const s of [-1, 1]) rod(gcrP(k, u + s * ww * 0.35, y + hh / 2 + 0.04, 0.13), gcrP(k, u + s * 0.12, GCR.tap[1] - 0.06, 0.09), 0.005, 'brass');
    }
    for (const [k, u, y, w, h, kind] of [[3, 1.72, 3.3, 0.92, 1.9, 'lady'], [4, 0.45, 3.45, 2.9, 2.15, 'genre']]) {
      const f = gcrF(k), fw = clamp(0.06 + 0.07 * Math.min(w, h), 0.08, 0.2);
      FRAMES.push(frameRing(w, h, fw, false).applyMatrix4(gcrM(k, u, y, 0.12)));
      addMesh(new THREE.PlaneGeometry(w, h).applyMatrix4(gcrM(k, u, y, 0.155)), oilMat(oilCanvas(kind)), { cast: false });
      for (const s of [-1, 1]) rod(gcrP(k, u + s * w * 0.35, y + h / 2 + 0.04, 0.15), gcrP(k, u + s * 0.12, GCR.tap[1] - 0.06, 0.09), 0.005, 'brass');
      void f;
    }
    flushPictures2();
  }
  // the notice board by the portrait hole: cork in an oak frame, parchment notices pinned at odd angles
  {
    const k = 5, u0 = 1.78, y0 = 1.95, NR = rng('notices'), notes = [], pins = [];
    lbox(k, u0 - 0.45, u0 + 0.45, y0 - 0.46, y0 + 0.46, 0.05, 0.1, 'fwood', 0.015);
    lbox(k, u0 - 0.39, u0 + 0.39, y0 - 0.4, y0 + 0.4, 0.1, 0.11, 'cork', 0.0);
    for (let i = 0; i < 9; i++) {
      const w = 0.14 + NR() * 0.1, h = 0.18 + NR() * 0.12, u = u0 - 0.28 + NR() * 0.56, y = y0 - 0.26 + NR() * 0.52;
      notes.push(gcrM(k, u, y, 0.112 + i * 0.0015).multiply(new THREE.Matrix4().makeRotationZ((NR() - 0.5) * 0.25)).multiply(new THREE.Matrix4().makeScale(w, h, 1)));
      pins.push(gcrM(k, u, y + h * 0.42, 0.125 + i * 0.0015));
    }
    addInst(new THREE.PlaneGeometry(1, 1), M.parchment, notes, null, { cast: false });
    addInst(new THREE.SphereGeometry(0.009, 8, 6), M.gold, pins, null, { cast: false });
  }

  // ---- furniture (at: a place on the floor and the way the front faces)
  const at = (x, z, fx, fz, y = 0) => xf([x, y, z], Math.atan2(fx, fz));
  const clubs = [[at(2.15, -1.55, -0.82, -0.57), [0.36, 0.04, 0.04]], [at(1.5, 0.75, -0.45, -0.9), [0.22, 0.02, 0.035]], [at(-3.5, -0.7, 0.95, -0.15), [0.42, 0.24, 0.07]]];
  const leatherM = at(-1.55, 0.55, 0.55, -0.84), wingM = at(2.75, -3.4, -0.86, 0.5), sofaM = at(-1.5, -2.45, 1, 0), sofaB = gcrM(4, 1.75, 0, 2.95, -0.55), stools = [at(0.8, -2.75, 0.3, 1), at(-0.25, -0.35, 0.6, 0.8)];
  addInst(gcrSculpt('club'), M.velvet, clubs.map((c) => c[0]), clubs.map((c) => c[1]));
  addInst(gcrSculpt('club'), M.brownLeather, [leatherM], [[0.16, 0.075, 0.035]]);
  addInst(gcrSculpt('wing'), M.velvet, [wingM], [[0.4, 0.07, 0.04]]);
  addInst(gcrSculpt('sofa'), M.velvet, [sofaM, sofaB], [[0.34, 0.025, 0.03], [0.42, 0.06, 0.04]]);
  addSculpt(gcrSculpt('blanket'), M.gblanket, sofaM); addSculpt(gcrSculpt('blanket'), M.gblanket, sofaB.clone().multiply(xf([0, 0, 0], 0, [-1, 1, 1])));
  addInst(gcrSculpt('stool'), M.velvet, stools, [[0.4, 0.035, 0.035], [0.3, 0.05, 0.06]]);
  {   // bun feet under the club chairs and the sofa, short cabriole legs under the wingback and the stools
    const feet = [], legs = [], sl = [], v = new THREE.Vector3();
    const foot = (m, x, z, list, s = 1) => { v.set(x, 0, z).applyMatrix4(m); list.push(xf([v.x, 0, v.z], 0, [1, s, 1])); };
    for (const m of [...clubs.map((c) => c[0]), leatherM]) for (const [x, z] of [[-0.38, 0.36], [0.38, 0.36], [-0.38, -0.4], [0.38, -0.4]]) foot(m, x, z, feet);
    for (const m of [sofaM, sofaB]) for (const [x, z] of [[-1.0, 0.36], [1.0, 0.36], [-1.0, -0.4], [1.0, -0.4], [0, -0.4]]) foot(m, x, z, feet);
    for (const [x, z] of [[-0.36, 0.36], [0.36, 0.36], [-0.36, -0.36], [0.36, -0.36]]) foot(wingM, x, z, legs);
    for (const m of stools) for (const [x, z] of [[-0.24, 0.14], [0.24, 0.14], [-0.24, -0.14], [0.24, -0.14]]) foot(m, x, z, sl, 2.1);
    addInst(lathe([[0, 0], [0.04, 0], [0.055, 0.03], [0.05, 0.06], [0.035, 0.085], [0, 0.085]], 12), M.fwood, feet);
    const leg = merge([new THREE.CylinderGeometry(0.03, 0.022, 0.14, 10).translate(0, 0.07, 0), new THREE.SphereGeometry(0.035, 10, 8).scale(1.1, 0.6, 1.3).translate(0, 0.015, 0.012)]);
    addInst(leg, M.fwood, legs); addInst(leg, M.fwood, sl);
  }
  {   // fringes along the skirts of the wingback and one club chair
    const fr = (m, w, d, y) => {
      for (const [x0, z0, x1, z1] of [[-w, d, w, d], [w, d, w, -d], [-w, -d, -w, d]]) {
        const L2 = Math.hypot(x1 - x0, z1 - z0), g = new THREE.PlaneGeometry(L2, 0.09).translate(0, -0.045, 0), uv = g.attributes.uv;
        for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * L2, (1 - uv.getY(i)) * 0.09);
        put('fringe', g.rotateY(Math.atan2(-(z1 - z0), x1 - x0)).translate((x0 + x1) / 2, y, (z0 + z1) / 2).applyMatrix4(m));
      }
    };
    fr(wingM, 0.43, 0.43, 0.15); fr(clubs[0][0], 0.465, 0.43, 0.11);
  }
  // cushions: the lion on the sofa, velvet ones in reds and old gold about the chairs and the window seats
  {
    const pl = gcrSculpt('pillow'), ps = [], pc = [];
    const on = (m, x, y, z, ry, rx, rz, col) => { ps.push(m.clone().multiply(xf([x, y, z], ry, 1, rx, rz))); pc.push(col); };
    GCR_LION.uLion.value = canvasTex(256, 256, (g) => { g.clearRect(0, 0, 256, 256); drawBeast(g, 'lion', 128, 128, 210, '#e0b050'); });
    addSculpt(pl, M.lionCushion, sofaB.clone().multiply(xf([0.6, 0.66, -0.12], -0.2, 1, -0.32, -0.1)));   // c08
    on(sofaB, 0.95, 0.66, -0.1, -0.5, -0.3, 0.3, [0.5, 0.06, 0.05]); on(sofaB, -0.25, 0.64, -0.12, 0.1, -0.35, -0.08, [0.42, 0.08, 0.06]);
    on(sofaM, 0.55, 0.66, -0.12, 0.25, -0.32, 0.12, [0.32, 0.26, 0.05]);   // the old gold velvet one (c06)
    on(sofaM, 0.95, 0.66, -0.1, -0.5, -0.3, 0.3, [0.45, 0.08, 0.05]);
    on(sofaM, -0.2, 0.64, -0.12, 0.1, -0.35, -0.08, [0.26, 0.2, 0.05]);
    on(clubs[0][0], 0.05, 0.65, -0.13, 0.1, -0.35, 0.1, [0.5, 0.12, 0.06]);
    on(wingM, 0.0, 0.66, -0.2, 0.0, -0.25, 0.05, [0.55, 0.16, 0.06]);
    on(clubs[2][0], 0.0, 0.66, -0.16, 0.0, -0.3, -0.1, [0.3, 0.03, 0.03]);
    for (const k of GCR_BAYS) { const m = gcrM(k); on(m, -0.82, bay.seat + 0.3, -0.55, 0.9, -0.15, 0.0, [0.4, 0.04, 0.04]); on(m, 0.78, bay.seat + 0.3, -0.6, -0.95, -0.2, 0.1, [0.3, 0.22, 0.05]); }
    addInst(pl, M.velvet, ps, pc);
    addInst(white(new RoundedBoxGeometry(1.8, 0.12, 0.72, 3, 0.05)), M.velvet, GCR_BAYS.map((k) => gcrM(k, 0, bay.seat + 0.06, -0.5)), GCR_BAYS.map(() => [0.33, 0.03, 0.035]));
  }
  // rugs: a blue Persian under the chairs, a red one before the hearth (on top of it)
  {
    const rug = (pal, w, d, x, z, ry, y, seed) => {
      const t = new THREE.CanvasTexture(rugCanvas(pal, w, d, seed)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
      const g = new THREE.PlaneGeometry(w, d, 24, 36).rotateX(-Math.PI / 2), p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const ex = Math.abs(p.getX(i)) / (w / 2), ez = Math.abs(p.getZ(i)) / (d / 2); p.setY(i, y + 0.008 + 0.012 * Math.pow(Math.max(ex, ez), 8) * (0.5 + 0.5 * Math.sin(p.getX(i) * 3 + p.getZ(i) * 2))); }
      g.computeVertexNormals(); g.rotateY(ry).translate(x, 0, z);
      addMesh(g, rugMat(t), { cast: false });
    };
    rug({ field: '#7d8ea0', border: '#a8603a', guard: '#e0c8a0', med: '#d89050', medE: '#3a4a6a', a: '#c0603a', b: '#e8c890', c: '#4a5a78', d: '#a85030' }, 5.4, 5.7, 0.15, -0.45, 0.03, 0, 1);
    rug({ field: '#8a2e26', border: '#26304e', guard: '#d8b88a', med: '#2a3a5e', medE: '#cfa46a', a: '#d8b070', b: '#3a5a7e', c: '#5e1a16', d: '#e8d4b0' }, 2.5, 1.4, 0.85, -2.65, 0.02, 0.004, 2);
    { const p = gcrP(4, 0.15, 0, 1.95); rug({ field: '#7a2a22', border: '#1e2a40', guard: '#c8a070', med: '#c8a46a', medE: '#28385a', a: '#e0b878', b: '#3a5a7e', c: '#4a1610', d: '#d8c8a8' }, 3.4, 2.2, p[0], p[2], 0.0, 0, 3); }
    rug({ field: '#2e4460', border: '#6a2a20', guard: '#d0b080', med: '#b04a2a', medE: '#d8c090', a: '#d89a50', b: '#c8b890', c: '#1a2438', d: '#8aa8b8' }, 1.9, 1.4, 3.85, -1.0, 0.3, 0, 4);
  }
  // tables, chairs, the dresser, the desk
  const sideTables = [at(0.0, -2.0, 0, 1), at(2.75, -4.45, 0, 1), at(-2.95, 0.25, 0.3, 1), at(3.85, -1.0, -1, 0.3)];
  addInst(gcrSideTable(), M.fwood, sideTables);
  const studyM = gcrM(4, 0.15, 0, 1.95), deskM = at(-5.2, 0.9, 1, 0), dresM = gcrM(3, 1.74, 0, 0.27);
  addInst(gcrStudyTable(), M.fwood, [studyM]);
  addInst(gcrChair(), M.fwood, [gcrM(4, -0.5, 0, 2.75, Math.PI), gcrM(4, 0.5, 0, 2.8, Math.PI + 0.1), gcrM(4, -0.35, 0, 1.12), gcrM(4, 0.7, 0, 1.12, 0.08),
    at(-4.45, 0.9, -1, 0), at(3.85, -0.32, -0.05, -1), at(3.87, -1.7, 0.1, 1)]);
  addInst(gcrDresser(1.22), M.fwood, [dresM]);
  addInst(gcrDesk(), M.fwood, [deskM]);
  // wizard chess by the south-west window: a board, pieces mid-game, two taken pieces lying beside it
  {
    const cm = sideTables[3], top = 0.56, board = new RoundedBoxGeometry(0.46, 0.03, 0.46, 1, 0.006).translate(0, top + 0.015, 0);
    const bg = board.attributes.uv, bp = board.attributes.position; for (let i = 0; i < bp.count; i++) bg.setXY(i, bp.getX(i) / 0.46 + 0.5, bp.getZ(i) / 0.46 + 0.5);
    addMesh(board.applyMatrix4(cm), M.chessboard);
    const PROF = {
      pawn: [[0, 0], [0.016, 0], [0.016, 0.006], [0.01, 0.014], [0.006, 0.026], [0.01, 0.03], [0.009, 0.036], [0, 0.044]],
      rook: [[0, 0], [0.018, 0], [0.018, 0.007], [0.012, 0.016], [0.011, 0.044], [0.016, 0.048], [0.016, 0.06], [0, 0.06]],
      bishop: [[0, 0], [0.018, 0], [0.018, 0.007], [0.011, 0.016], [0.007, 0.05], [0.012, 0.056], [0.01, 0.066], [0.004, 0.074], [0, 0.076]],
      queen: [[0, 0], [0.019, 0], [0.019, 0.008], [0.012, 0.018], [0.007, 0.058], [0.015, 0.064], [0.012, 0.074], [0.006, 0.08], [0, 0.084]],
      king: [[0, 0], [0.02, 0], [0.02, 0.008], [0.012, 0.018], [0.008, 0.064], [0.015, 0.07], [0.012, 0.08], [0.004, 0.084], [0.004, 0.096], [0, 0.096]],
      knight: [[0, 0], [0.018, 0], [0.018, 0.007], [0.012, 0.016], [0.011, 0.03], [0, 0.03]],
    };
    const pieceGeo = (kind) => kind === 'knight' ? merge([lathe(PROF.knight, 14), new THREE.BoxGeometry(0.014, 0.034, 0.03).rotateX(-0.35).translate(0, 0.046, 0.004), new THREE.BoxGeometry(0.012, 0.014, 0.026).translate(0, 0.058, 0.014)]) : lathe(PROF[kind], 14);
    const sq = (c, r) => [(-0.5 + (c + 0.5) / 8) * 0.405, (-0.5 + (r + 0.5) / 8) * 0.405];
    const setup = { white: [['king', 4, 0], ['queen', 3, 2], ['rook', 0, 0], ['rook', 5, 0], ['bishop', 2, 3], ['knight', 5, 2], ['pawn', 0, 1], ['pawn', 1, 2], ['pawn', 5, 1], ['pawn', 6, 1], ['pawn', 7, 2], ['pawn', 3, 3], ['pawn', 4, 3]],
      black: [['king', 6, 7], ['queen', 3, 6], ['rook', 0, 7], ['rook', 5, 7], ['bishop', 2, 7], ['bishop', 6, 4], ['knight', 2, 5], ['pawn', 0, 6], ['pawn', 1, 6], ['pawn', 5, 6], ['pawn', 6, 6], ['pawn', 7, 5], ['pawn', 3, 4]] };
    for (const [side, mat] of [['white', M.ivoryPiece], ['black', M.ebonyPiece]]) {
      const by = {};
      for (const [kind, c, r] of setup[side]) { const [x, z] = sq(c, r); (by[kind] ||= []).push(cm.clone().multiply(xf([x, top + 0.03, z], side === 'white' ? 0 : Math.PI, 1.25))); }
      for (const [kind, list] of Object.entries(by)) addInst(pieceGeo(kind), mat, list);
    }
    addInst(pieceGeo('pawn'), M.ebonyPiece, [cm.clone().multiply(xf([0.25, top + 0.012, 0.12], 0, 1.25, 0, Math.PI / 2))]);
    addInst(pieceGeo('bishop'), M.ivoryPiece, [cm.clone().multiply(xf([-0.26, top + 0.014, -0.1], 0.6, 1.25, 0, Math.PI / 2))]);
  }
  // books, mugs, papers, quills about the tables; lamps on the tables and the dresser, sconces on the walls
  {
    const BL = [], BC = [], v = new THREE.Vector3(), BR = rng('books');
    const COLS = [[0.25, 0.04, 0.03], [0.07, 0.12, 0.06], [0.16, 0.09, 0.04], [0.05, 0.06, 0.14], [0.3, 0.2, 0.08], [0.12, 0.05, 0.08], [0.32, 0.26, 0.16]];
    const stack = (m, x, y, z, n) => {
      let yy = y;
      for (let i = 0; i < n; i++) {
        const w = 0.17 + BR() * 0.08, h = 0.03 + BR() * 0.035, d = 0.12 + BR() * 0.06;
        BL.push(m.clone().multiply(xf([x + (BR() - 0.5) * 0.03, yy + h / 2, z + (BR() - 0.5) * 0.03], (BR() - 0.5) * 0.5, [w, h, d]))); BC.push(COLS[Math.floor(BR() * COLS.length)]);
        yy += h;
      }
    };
    const row = (m, x0, x1, y, z) => {   // books standing in a row
      for (let x = x0; x < x1;) { const w = 0.03 + BR() * 0.04, h = 0.2 + BR() * 0.09, d = 0.15 + BR() * 0.05; BL.push(m.clone().multiply(xf([x + w / 2, y + h / 2, z], 0, [w, h, d], 0, (BR() - 0.5) * 0.06))); BC.push(COLS[Math.floor(BR() * COLS.length)]); x += w + 0.004; }
    };
    stack(sideTables[0], 0.05, 0.56, 0.02, 3); stack(sideTables[2], -0.12, 0.56, 0.0, 2);
    stack(studyM, -0.7, 0.78, 0.15, 4); stack(studyM, 0.5, 0.78, -0.25, 2); stack(studyM, 0.85, 0.78, 0.2, 5); stack(studyM, -0.15, 0.78, -0.3, 1);
    row(dresM, -0.55, -0.05, 1.3, -0.02); stack(dresM, 0.35, 1.3, 0.0, 3);
    stack(deskM, 0.4, 0.78, -0.1, 3);
    stack(gcrM(7), 0.6, bay.seat + 0.12, -0.75, 2);
    addInst(new THREE.BoxGeometry(1, 1, 1), M.bookCover, BL, BC); addInst(new THREE.BoxGeometry(0.97, 0.86, 0.94).translate(0.02, 0, 0), M.pages, BL, null, { cast: false });
    const mug = merge([lathe([[0, 0], [0.04, 0], [0.042, 0.004], [0.042, 0.1], [0.038, 0.1], [0.036, 0.008], [0, 0.008]], 18), new THREE.TorusGeometry(0.028, 0.006, 6, 14, Math.PI).rotateZ(-Math.PI / 2).translate(0.042, 0.05, 0)]);
    addInst(mug, M.enamel, [sideTables[0].clone().multiply(xf([-0.18, 0.56, -0.05], 1.0, 1)), sideTables[1].clone().multiply(xf([0.16, 0.56, 0.08], 2.0, 1)), sideTables[2].clone().multiply(xf([0.15, 0.56, 0.1], -0.4, 1)), studyM.clone().multiply(xf([0.2, 0.78, 0.25], 0.3, 1))]);
    const papers = [], scrolls = [];
    for (let i = 0; i < 7; i++) papers.push(studyM.clone().multiply(xf([-0.3 + BR() * 0.7, 0.782 + i * 0.0012, -0.2 + BR() * 0.4], BR() * 1.2 - 0.6, [0.21, 1, 0.29])));
    papers.push(deskM.clone().multiply(xf([-0.1, 0.782, 0.05], 0.15, [0.21, 1, 0.29])));
    addInst(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), M.parchment, papers, null, { cast: false });
    for (const [m, x, y, z, a] of [[studyM, 0.0, 0.78, 0.32, 0.3], [studyM, -0.9, 0.78, -0.3, -1.2], [sideTables[2], 0.0, 0.56, -0.1, 0.8]]) scrolls.push(m.clone().multiply(xf([x, y + 0.025, z], a, 1, 0, Math.PI / 2)));
    addInst(new THREE.CylinderGeometry(0.025, 0.025, 0.28, 12), M.parchment, scrolls);
    const inks = [studyM.clone().multiply(xf([-0.35, 0.78, 0.3], 0, 1)), deskM.clone().multiply(xf([0.25, 0.78, -0.12], 0, 1))];
    addInst(lathe([[0, 0], [0.028, 0], [0.03, 0.03], [0.012, 0.045], [0.012, 0.055], [0, 0.055]], 12), M.ink, inks);
    addInst(merge([new THREE.CylinderGeometry(0.002, 0.003, 0.26, 5).translate(0, 0.13, 0), new THREE.SphereGeometry(0.02, 8, 6).scale(0.35, 2.6, 0.08).translate(0.006, 0.18, 0)]), M.parchment,
      inks.map((m) => m.clone().multiply(xf([0.005, 0.03, 0], 0.5, 1, 0.35, 0.3))));
    const lamps = [sideTables[1].clone().multiply(xf([-0.1, 0.56, -0.05], 0, 1)), studyM.clone().multiply(xf([-0.35, 0.78, -0.2], 0, 1)), studyM.clone().multiply(xf([0.95, 0.78, -0.25], 0, 1)),
      dresM.clone().multiply(xf([0.08, 1.3, -0.05], 0, 1)), deskM.clone().multiply(xf([-0.45, 0.78, -0.12], 0, 1)), sideTables[2].clone().multiply(xf([0.15, 0.56, -0.12], 0, 1))];
    const brk = [];
    for (const [k, u, y] of [[2, -1.95, 2.15], [2, 1.95, 1.4], [6, 0.55, 2.0], [5, -1.6, 2.1], [3, -1.75, 1.85], [4, -1.75, 2.05]]) { const m = gcrM(k, u, y, 0.1); brk.push(m); lamps.push(m.clone().multiply(xf([0, -0.02, 0.26], 0, 0.85))); }
    addInst(merge([new THREE.BoxGeometry(0.1, 0.16, 0.03), new THREE.CylinderGeometry(0.012, 0.012, 0.26, 8).rotateX(Math.PI / 2).translate(0, -0.03, 0.13), new THREE.CylinderGeometry(0.07, 0.05, 0.03, 12).translate(0, -0.035, 0.26)]), M.brass, brk);
    addInst(GCR_LAMP.brass, M.brass, lamps); addInst(GCR_LAMP.globe, M.globe, lamps, null, { cast: false });
    {   // the wireless (c08): a walnut cabinet with an arched top, a cloth grille behind fretwork, a dial and knobs
      const rm = studyM.clone().multiply(xf([0.62, 0.78, -0.12], 0.25, 1)), arch = pathPts(new THREE.Shape(), openingPts(0.16, 0.26, 'pointed', 0.62));
      put('fwood', new THREE.ExtrudeGeometry(arch, { depth: 0.2, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2, curveSegments: 10 }).translate(0, 0.0, -0.1).applyMatrix4(rm));
      put('ink', new THREE.ShapeGeometry(pathPts(new THREE.Shape(), openingPts(0.11, 0.24, 'pointed', 0.62)), 10).translate(0, 0.14, 0.111).applyMatrix4(rm));
      for (let i = 0; i < 5; i++) put('fwood', new THREE.BoxGeometry(0.012, 0.2, 0.012).translate(-0.08 + i * 0.04, 0.26, 0.112).applyMatrix4(rm));
      put('ivory', new THREE.CylinderGeometry(0.035, 0.035, 0.01, 20).rotateX(Math.PI / 2).translate(0, 0.075, 0.112).applyMatrix4(rm));
      for (const x of [-0.1, 0.1]) put('fwood', new THREE.CylinderGeometry(0.018, 0.018, 0.02, 12).rotateX(Math.PI / 2).translate(x, 0.06, 0.118).applyMatrix4(rm));
      const bowl = studyM.clone().multiply(xf([-0.55, 0.78, 0.22], 0, 1));
      put('brass', lathe([[0, 0], [0.06, 0], [0.07, 0.012], [0.14, 0.05], [0.16, 0.085], [0.152, 0.088], [0.13, 0.055], [0, 0.04]], 24).applyMatrix4(bowl));
      const OR = rng('oranges'), oranges = [];
      for (let i = 0; i < 7; i++) { const a = i * 0.9 + OR(), r = i ? 0.07 : 0; oranges.push(bowl.clone().multiply(xf([Math.cos(a) * r, 0.08 + (i ? 0 : 0.04), Math.sin(a) * r], OR() * 6, 0.038))); }
      addInst(new THREE.SphereGeometry(1, 14, 10), M.fruit, oranges, oranges.map(() => [0.62, 0.25, 0.03]));
    }
    for (const m of lamps) { v.set(0, GCR_LAMP.top, 0).applyMatrix4(m); LAMPS.push({ room: GCR_ROOM, p: [v.x, v.y, v.z], c: [1.0, 0.62, 0.3].map((q) => q * 3.2), r: 6, halo: 0.22, hk: 0.45, see: 40 }); }
  }
  // the chandelier (c08): a pierced brass band round a spoked wheel, six arms with lamps, hung on chains
  {
    const cy = 5.0, cx = 0.0, cz = -0.4, r0 = 0.8, v = new THREE.Vector3();
    const band = new THREE.CylinderGeometry(r0, r0, 0.26, 64, 1, true), bu = band.attributes.uv; for (let i = 0; i < bu.count; i++) bu.setXY(i, bu.getX(i) * Math.PI * 2 * r0, bu.getY(i) * 0.26);
    put('pierced', band.translate(cx, cy, cz));
    for (const y of [-0.13, 0.13]) put('brass', new THREE.TorusGeometry(r0, 0.022, 8, 64).rotateX(Math.PI / 2).translate(cx, cy + y, cz));
    put('brass', new THREE.TorusGeometry(0.55, 0.018, 8, 48).rotateX(Math.PI / 2).translate(cx, cy, cz));
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; rod([cx + Math.cos(a) * 0.07, cy, cz + Math.sin(a) * 0.07], [cx + Math.cos(a) * r0, cy, cz + Math.sin(a) * r0], 0.014, 'brass'); }
    put('brass', lathe([[0, -0.32], [0.04, -0.3], [0.09, -0.18], [0.07, -0.06], [0.09, 0.02], [0.05, 0.1], [0.025, 0.2], [0, 0.22]], 16).translate(cx, cy, cz));
    const lampsC = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.26, ca = Math.cos(a), sa = Math.sin(a), P = (r, y) => new THREE.Vector3(cx + ca * r, cy + y, cz + sa * r);
      put('brass', new THREE.TubeGeometry(new THREE.CatmullRomCurve3([P(r0, -0.05), P(r0 + 0.18, -0.16), P(r0 + 0.36, -0.08), P(r0 + 0.42, 0.06)]), 16, 0.018, 6));
      const m = xf([cx + ca * (r0 + 0.42), cy + 0.06, cz + sa * (r0 + 0.42)], 0, 0.8); lampsC.push(m);
      v.set(0, GCR_LAMP.top, 0).applyMatrix4(m); LAMPS.push({ room: GCR_ROOM, p: [v.x, v.y, v.z], c: [1.0, 0.62, 0.3].map((q) => q * 3.0), r: 5.5, halo: 0.2, hk: 0.45, see: 50 });
    }
    addInst(GCR_LAMP.brass, M.brass, lampsC); addInst(GCR_LAMP.globe, M.globe, lampsC, null, { cast: false });
    const links = [], Y = new THREE.Vector3(0, 1, 0);
    const chain = (p0, p1) => {
      const d = new THREE.Vector3().subVectors(p1, p0), n = Math.max(2, Math.round(d.length() / 0.07)), q = new THREE.Quaternion().setFromUnitVectors(Y, d.clone().normalize());
      for (let i = 0; i < n; i++) links.push(new THREE.Matrix4().compose(p0.clone().addScaledVector(d, (i + 0.5) / n), q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(Y, (i % 2) * Math.PI / 2)), new THREE.Vector3(1, 1, 1)));
    };
    const ring = new THREE.Vector3(cx, cy + 1.6, cz);
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; chain(new THREE.Vector3(cx + Math.cos(a) * r0, cy + 0.14, cz + Math.sin(a) * r0), ring); }
    chain(ring, new THREE.Vector3(cx, H - 0.3, cz));
    put('brass', new THREE.TorusGeometry(0.09, 0.016, 8, 20).translate(cx, cy + 1.6, cz));
    addInst(new THREE.TorusGeometry(0.022, 0.006, 5, 10).scale(1, 1.5, 1), M.brass, links, null, { cast: false });
    const pl = new THREE.PointLight(new THREE.Color(1.0, 0.64, 0.32), 0, 7.5, 1.7); pl.position.set(cx, cy - 0.1, cz); pl.userData = { d: 0, n: 5 }; sc.add(pl); points.push(pl);
  }
  buildGryffDorm(sc, points);
  flushFires();
  // fill: the glow of the lamps and the fire carried round the room (no shadow)
  for (const [x, y, z, d, n] of [[-2.9, 3.0, 1.3, 1.0, 1.4], [2.9, 3.0, 2.1, 1.0, 1.4], [0, 3.6, -2.9, 0.6, 2]]) {
    const p = new THREE.PointLight(new THREE.Color(1.0, 0.62, 0.34), 0, 9, 1.6); p.position.set(x, y, z); p.userData = { d, n }; sc.add(p); points.push(p);
  }
  // the sun through the north-west bay, low and warm, across the rugs; its shadow box takes in the dormitory too
  const sun = setSun(sc, new THREE.Vector3(-0.62, 0.44, -0.64), 20);
  sun.light.target.position.set(0, 7, 0);
  return { sun, sunI: 9, moonI: 0.6, envD: 0.15, envN: 0.02, points, levels: { day: [4, 14, 52, 156, 222], night: [2, 7, 26, 110, 216] } };
}
