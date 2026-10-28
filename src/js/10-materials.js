// ------------------------------------------------------------------ materials
// Albedos are linear. The castle stone is the pale, slightly warm grey of the later films (the miniature itself is
// painted a warmer buff); roofs are blue-grey slate; the cliff is grey rock with grass on every ledge.
const M = {};
// Dressed stone walls: ashlar courses laid out on the metric uv (u along the wall, v = height), slabs on top faces.
const STONE_GLSL = /* glsl */ `
vec3 castleStone(vec3 P, vec3 N, vec2 UV, out float cgHh, out float groove, float tone){
  vec3 A = abs(N);
  vec2 uv = A.y > 0.75 ? P.xz : UV;
  vec2 bs = A.y > 0.75 ? vec2(1.1, 0.8) : vec2(0.82, 0.38);
  float row = floor(uv.y / bs.y);
  uv.x += cgH21(vec2(row, 3.7)) * bs.x;
  vec2 cell = floor(uv / bs); vec2 f = fract(uv / bs) * bs;
  float e = min(min(f.x, bs.x - f.x), min(f.y, bs.y - f.y));
  float px = length(fwidth(uv));
  groove = smoothstep(0.0, max(0.012, px * 0.8), e);
  groove = mix(groove, 0.9, smoothstep(0.03, 0.14, px));
  float id = cgH21(cell + 17.0 * row);
  float n1 = cgFbm(P * 0.31); float n2 = cgVn(P * 9.0);
  float id2 = cgH21(cell + 3.1 * row + 5.0);
  vec3 c = vec3(0.86 + 0.26 * id) * mix(vec3(1.0), vec3(1.07, 1.0, 0.88), id2 * id2) * (0.88 + 0.2 * n1) * tone;
  c *= mix(0.72, 1.0, groove);
  float streak = cgFbm3(vec3(P.x * 1.3 + P.z * 0.7, P.y * 0.09, P.z * 1.3 - P.x * 0.4));
  c *= mix(1.0, 0.86, smoothstep(0.62, 0.86, streak) * (1.0 - A.y));
  c = mix(c, c * vec3(0.86, 0.9, 0.82), smoothstep(0.6, 0.85, cgFbm3(P * 0.08 + 4.0)) * 0.5);
  c *= mix(1.0, 0.8, smoothstep(0.84, 0.95, n2) * 0.5);
  cgHh = min(e, 0.04) * 0.5 + n1 * 0.004 + n2 * 0.0015;
  return c;
}
`;
M.stone = procMat({ name: 'stone', rgb: [0.285, 0.272, 0.244], rough: 0.82, bump: 1, uv: true, head: STONE_GLSL, frag: /* glsl */ `
  float hh, groove;
  vec3 c = castleStone(P, N, UV, hh, groove, 1.0);
  c *= mix(0.72, 1.0, smoothstep(-58.0, -40.0, P.y));
  float grime = smoothstep(0.55, 0.85, cgFbm3(vec3(P.x * 0.25, P.y * 0.6, P.z * 0.25) + 11.0));
  c *= mix(1.0, 0.88, grime * (1.0 - abs(N.y)));
  // each building weathered a little differently; long rain streaks; moss and damp toward the foot of the walls
  c *= 0.95 + 0.1 * cgVn(floor(P / 16.0) + 0.5);
  float rain = smoothstep(0.58, 0.86, cgVn(vec3(P.x * 3.2 + P.z * 3.2, P.y * 0.05, 3.0))) * (1.0 - abs(N.y));   // thin streaks down the face
  c *= 1.0 - 0.26 * rain;
  c *= 1.0 - 0.12 * smoothstep(0.5, 0.9, cgVn(vec3(P.x * 0.7 + P.z * 0.7, P.y * 0.02, 8.0))) * (1.0 - abs(N.y));   // broad damp bands
  c *= 1.0 + 0.08 * smoothstep(0.4, 1.0, N.y);   // tops of ledges catch the light
  float foot = 1.0 - smoothstep(-2.0, 5.0, P.y + 3.0 * cgVn(P * 0.2));
  c = mix(c, c * vec3(0.78, 0.86, 0.66), foot * 0.75);
  c = mix(c, vec3(0.07, 0.085, 0.045), smoothstep(0.62, 0.85, cgFbm3(P * 0.35 + 4.0)) * foot * 0.6);
  diffuseColor.rgb *= c; cgH = hh; cgAO = mix(0.75, 1.0, groove); cgRough = 0.8;
` });
// Small coursed stone for human-scale work by the water (the boathouse and its stairs): 0.28 m courses of rock-faced
// stones 0.45-1.0 m long in the castle's grey, rain streaks; dark wet stone and weed toward the waterline, moss on ledges.
M.rubble = procMat({ name: 'rubble', rgb: [1, 1, 1], rough: 0.88, bump: 1, uv: true, frag: /* glsl */ `
  vec2 uv = abs(N.y) > 0.75 ? P.xz : UV;
  float rowH = 0.28, row = floor(uv.y / rowH), fy = fract(uv.y / rowH) * rowH;
  float L = 0.45 + 0.55 * cgH21(vec2(row, 5.3)), off = cgH21(vec2(row, 2.2)) * L;
  float cx = floor((uv.x + off) / L), fx = fract((uv.x + off) / L) * L;
  float id = cgH21(vec2(cx, row) + 0.71);
  float e = min(min(fx, L - fx), min(fy, rowH - fy)), px = length(fwidth(uv));
  float mortar = 1.0 - smoothstep(0.007, 0.011 + px, e); mortar = mix(mortar, 0.2, smoothstep(0.02, 0.08, px));
  float face = smoothstep(0.007, 0.07, e);
  float id2 = fract(id * 7.31);
  vec3 c = vec3(0.7 + 0.42 * id) * mix(vec3(0.25, 0.24, 0.215), vec3(0.27, 0.24, 0.2), id2) * (0.78 + 0.34 * cgFbm3(P * 2.1)) * (0.9 + 0.16 * cgVn(P * 13.0));
  c *= mix(0.62, 1.0, smoothstep(0.25, 0.72, cgFbm3(vec3(P.x * 0.5, P.y * 0.12, P.z * 0.5) + 5.0)));   // soot and rain streaks
  c *= 1.0 - 0.22 * smoothstep(0.55, 0.85, cgVn(vec3(P.x * 2.6 + P.z * 2.6, P.y * 0.06, 3.0))) * (1.0 - abs(N.y));
  c = mix(c, vec3(0.34, 0.35, 0.3), smoothstep(0.66, 0.82, cgFbm3(P * 3.2 + 4.0)) * 0.4);   // pale lichen
  c = mix(c, vec3(0.16, 0.155, 0.14), mortar);
  float wl = P.y - (${LAKE_Y.toFixed(1)});
  float wet = 1.0 - smoothstep(0.3, 1.6 + 0.6 * cgVn(P * 0.7), wl);
  c = mix(c, c * vec3(0.45, 0.5, 0.4), wet);
  c = mix(c, vec3(0.05, 0.08, 0.035), smoothstep(0.55, 0.75, cgFbm3(P * 2.0 + 3.0)) * (1.0 - smoothstep(0.2, 1.0, wl)) * 0.8);
  c = mix(c, vec3(0.1, 0.12, 0.06), smoothstep(0.62, 0.8, cgFbm3(P * 0.9 + 7.0)) * 0.35 * smoothstep(0.3, 1.0, N.y + 0.6));
  diffuseColor.rgb = c;
  cgH = face * 0.012 * (0.6 + 0.6 * cgFbm3(P * 5.0 + id * 9.0)) + cgVn(P * 30.0) * 0.0015;
  cgAO = mix(0.72, 1.0, face); cgRough = mix(0.88, 0.35, wet);
` });
// Same stone, no joints: copings, pinnacles, window surrounds, corbels, string courses.
M.trim = procMat({ name: 'trim', rgb: [0.255, 0.244, 0.218], rough: 0.75, bump: 1, frag: /* glsl */ `
  float n1 = cgFbm3(P * 0.5); float n2 = cgVn(P * 14.0);
  vec3 c = vec3(0.9 + 0.2 * n1) * (0.95 + 0.1 * cgVn(floor(P / 16.0) + 0.5));
  c *= 1.0 - 0.22 * smoothstep(0.58, 0.86, cgVn(vec3(P.x * 3.2 + P.z * 3.2, P.y * 0.05, 3.0))) * (1.0 - abs(N.y));   // rain streaks
  c *= 1.0 - 0.18 * smoothstep(0.2, -0.6, N.y);   // soffits and undersides darker
  c *= mix(1.0, 0.72, smoothstep(0.6, 0.86, cgFbm3(vec3(P.x * 1.5, P.y * 0.1, P.z * 1.5))) * (1.0 - abs(N.y)));
  c *= mix(1.0, 0.7, smoothstep(0.84, 0.95, n2) * 0.5);
  diffuseColor.rgb *= c; cgH = n2 * 0.003; cgRough = 0.72;
` });
M.terracotta = procMat({ name: 'terracotta', rgb: [0.19, 0.075, 0.04], rough: 0.8, frag: /* glsl */ `
  diffuseColor.rgb *= 0.75 + 0.4 * cgFbm3(P * 3.0); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.03), smoothstep(0.6, 1.0, fract(P.y * 0.5 + 0.9)) * 0.5);
` });
// Slate: rows along the slope (UV.y = metres up the slope), staggered slates, lichen toward the eaves.
M.slate = procMat({ name: 'slate', rgb: [0.085, 0.09, 0.1], rough: 0.55, bump: 1, uv: true, frag: /* glsl */ `
  float rh = 0.27, sw = 0.32;
  float row = floor(UV.y / rh);
  float u = UV.x + cgH21(vec2(row, 1.3)) * sw;
  float cell = floor(u / sw);
  float fy = fract(UV.y / rh), fx = fract(u / sw);
  float id = cgH21(vec2(cell, row));
  float px = length(fwidth(UV));
  float joint = smoothstep(0.0, 0.08, min(fx, 1.0 - fx)) * smoothstep(0.0, 0.18, fy);
  joint = mix(joint, 0.8, smoothstep(0.03, 0.14, px));
  vec3 c = vec3(0.85 + 0.35 * id) * mix(vec3(1.0), vec3(0.95, 1.0, 1.08), cgH21(vec2(row, cell) + 9.0));
  c *= mix(0.6, 1.0, joint);
  float n = cgFbm3(P * 0.25);
  c = mix(c, c * vec3(1.35, 1.25, 0.95), smoothstep(0.55, 0.85, n) * 0.5);
  c = mix(c, vec3(1.9, 2.1, 1.5), smoothstep(0.72, 0.9, cgFbm3(P * 0.9 + 6.0)) * 0.35);   // lichen spots
  c *= 0.85 + 0.3 * cgVn(floor(P / 14.0) + 0.5);
  diffuseColor.rgb *= c;
  cgH = (1.0 - fy) * 0.012 * (1.0 - smoothstep(0.03, 0.14, px)) + id * 0.004;
  cgRough = 0.5 + 0.25 * id + 0.2 * n; cgSpec = 0.55;
` });
M.lead = procMat({ name: 'lead', rgb: [0.055, 0.06, 0.066], rough: 0.5, metal: 0.25, frag: /* glsl */ `
  diffuseColor.rgb *= 0.85 + 0.3 * cgFbm3(P * 0.6);
` });
M.wood = procMat({ name: 'wood', rgb: [0.075, 0.05, 0.032], rough: 0.8, bump: 1, uv: true, frag: /* glsl */ `
  float g = cgVn(vec3(UV.x * 0.4, UV.y * 30.0, 0.0)) * 0.6 + cgVn(vec3(UV.x * 2.0, UV.y * 80.0, 3.0)) * 0.4;
  diffuseColor.rgb *= 0.75 + 0.5 * g; cgH = g * 0.004;
` });
// Leaded glass. Instance colour: r = lit at night (0/1), g = per-window random, b = mullions / 4.
// uv is the window's own unit frame: x in [-0.5, 0.5] across the opening, y from the sill up.
M.glass = procMat({ name: 'glass', rgb: [1, 1, 1], rough: 0.08, inst: true, uv: true, frag: /* glsl */ `
  float seed = vInstC.g; float mull = floor(vInstC.b * 4.0 + 0.5);
  vec2 q = UV;
  float lead = 0.0;
  vec2 dq = vec2(q.x + q.y, q.x - q.y) * 9.0;
  vec2 fd = abs(fract(dq) - 0.5);
  float pw = length(fwidth(dq)) * 0.7 + 0.02;
  lead = smoothstep(0.5 - pw - 0.03, 0.5 - pw, max(fd.x, fd.y));
  lead = mix(lead, 0.25, smoothstep(0.2, 0.6, length(fwidth(dq))));
  float bar = 0.0;
  if (mull > 0.5) { float k = (q.x + 0.5) * (mull + 1.0); float dk = abs(k - floor(k + 0.5)) / (mull + 1.0); bar = 1.0 - smoothstep(0.022, 0.032, dk); }
  float edge = smoothstep(0.5, 0.36, abs(q.x)) * smoothstep(0.0, 0.18, q.y);
  vec3 dayc = mix(vec3(0.03, 0.036, 0.036), vec3(0.06, 0.066, 0.06), seed) * (0.8 + 0.4 * cgVn(vec3(q * vec2(9.0, 6.0), seed * 30.0)));
  diffuseColor.rgb = mix(dayc, vec3(0.02, 0.018, 0.015), max(lead, bar)) * edge;
  cgRough = mix(0.04, 0.4, max(lead, bar)) + 0.06 * cgVn(vec3(q * 7.0, seed * 9.0)); cgSpec = mix(1.6, 0.2, max(lead, bar)) * edge; cgAO = edge;
  float lit = max(vInstC.r, 0.7 * cgSpell(P).y) * uLamp;   // as the spell passes, the dark windows flash too
  // small windows without mullions: a glazing cross (centre bar, transom), fading to its average far off
  vec2 fq = fwidth(q); float cross = 0.0;
  if (mull < 0.5) {
    cross = max(1.0 - smoothstep(0.03, 0.03 + fq.x * 1.5, abs(q.x)), 1.0 - smoothstep(0.03, 0.03 + fq.y * 1.5, abs(q.y - 1.05)));
    cross = mix(cross, 0.15, smoothstep(0.02, 0.1, max(fq.x, fq.y)));
  }
  float s2 = fract(seed * 13.7), s3 = fract(seed * 5.3);
  float lvl = s2 < 0.18 ? 0.25 : (s2 > 0.85 ? 1.5 : 0.8 + 0.4 * s3);   // a few lit by one candle, a few blazing
  vec3 hue = mix(vec3(1.0, 0.48, 0.16), vec3(1.0, 0.66, 0.3), s3);   // candle-orange to lamp-yellow
  float grad = mix(1.0, 0.5, smoothstep(0.2, 2.4, q.y));   // the room's light falls on the lower panes
  float inside = 0.7 + 0.6 * cgVn(vec3(q * vec2(2.2, 1.3), seed * 40.0));   // a lamp, a figure, a bookcase
  float curtain = step(0.62, s3) * smoothstep(0.3, 0.44, abs(q.x));
  cgEmit = hue * 2.1 * lvl * grad * inside * lit * edge * (1.0 - 0.85 * max(max(lead, bar), cross)) * (1.0 - 0.65 * curtain);
` });
// Cliff rock: vertical fissures (ridged noise stretched in y), strata ledges, dark cracks, grass on everything facing
// up. Shared by the boulders and every steep part of the terrain.
const ROCK_GLSL = /* glsl */ `
vec3 cliffRock(vec3 P, vec3 N, out float h){
  float n1 = cgFbm(P * 0.05); float n2 = cgFbm3(P * 0.35); float n3 = cgVn(P * 2.3);
  float fis = 1.0 - abs(cgVn(vec3(P.x * 0.16, P.y * 0.035, P.z * 0.16)) * 2.0 - 1.0);
  float fis2 = 1.0 - abs(cgVn(vec3(P.x * 0.5, P.y * 0.1, P.z * 0.5) + 7.0) * 2.0 - 1.0);
  float st = fract((P.y + P.x * 0.12 - P.z * 0.07) * 0.2 + n1 * 2.2);
  float strata = smoothstep(0.0, 0.12, st) * smoothstep(1.0, 0.8, st);
  strata = mix(1.0, strata, smoothstep(0.4, 0.75, cgFbm3(P * 0.018 + 3.0)));
  // rounded lumps (the geometry carries the big masses; the bump adds smaller swellings, no sharp facets)
  float rb = cgVn(P * 0.045 + 3.3); float rb2 = cgVn(P * 0.11 + 8.1);
  vec3 c = mix(vec3(0.07, 0.068, 0.058), vec3(0.17, 0.162, 0.138), n1) * (0.8 + 0.3 * n2);
  c = mix(c, c * vec3(1.15, 1.04, 0.82), smoothstep(0.55, 0.8, cgFbm3(P * 0.07 + 2.0)) * 0.6);
  c *= mix(0.76, 1.0, smoothstep(0.06, 0.26, 1.0 - fis)) * mix(0.88, 1.0, smoothstep(0.05, 0.25, 1.0 - fis2));
  c *= 0.85 + 0.2 * strata;
  float rb3 = cgVn(P * 0.32 + 1.7);
  c *= 0.9 + 0.2 * rb2;
  // pale lichen on the faces, dark wet streaks running down
  float lich = smoothstep(0.62, 0.85, cgFbm3(P * 0.22 + 5.0)) * (1.0 - abs(N.y));
  c = mix(c, vec3(0.26, 0.265, 0.225), lich * 0.55);
  float wet = smoothstep(0.58, 0.85, cgFbm3(vec3(P.x * 0.6, P.y * 0.045, P.z * 0.6) + 2.0)) * (1.0 - abs(N.y));
  c *= 1.0 - 0.38 * wet;
  float up = smoothstep(0.5, 0.8, N.y + (n2 - 0.5) * 0.5);
  vec3 grass = mix(vec3(0.05, 0.066, 0.024), vec3(0.092, 0.094, 0.04), n2);
  grass = mix(grass, vec3(0.085, 0.06, 0.045), smoothstep(0.6, 0.85, n3) * 0.5);   // heather
  c = mix(c, grass, up * 0.94);
  h = (fis * fis * 1.1 + fis2 * 0.3 + strata * 0.35 + n3 * 0.06 + rb * rb * 2.2 + rb2 * rb2 * 0.9 + rb3 * 0.3) * (1.0 - up * 0.8);
  return c;
}
`;
M.rock = procMat({ name: 'rock', rgb: [1, 1, 1], rough: 0.88, bump: 1, head: ROCK_GLSL, frag: /* glsl */ `
  float hh; vec3 c = cliffRock(P, N, hh);
  diffuseColor.rgb *= c; cgH = hh * 0.5; cgSpec = 0.35; cgRough = 0.9;
` });
M.terrain = procMat({ name: 'terrain', rgb: [1, 1, 1], rough: 0.92, sunVis: true, bump: 1, vhead: 'attribute float crease; varying float vCrease;\n', vert: 'vCrease = crease;\n', head: 'varying float vCrease;\n' + ROCK_GLSL, frag: /* glsl */ `
  float h = P.y; float slope = 1.0 - N.y; float r = length(P.xz);
  float n1 = cgFbm(P * 0.02); float n2 = cgVn(P * 0.18); float n3 = cgFbm3(P * 0.003);
  vec3 grass = mix(vec3(0.055, 0.07, 0.026), vec3(0.096, 0.098, 0.042), n1);
  grass = mix(grass, vec3(0.115, 0.1, 0.055), smoothstep(0.55, 0.8, cgFbm3(P * 0.05 + 9.0)) * 0.45);   // dry patches
  float tuft = cgVn(P * 0.7) * 0.6 + cgVn(P * 2.3 + 3.0) * 0.4;
  grass *= 0.78 + 0.42 * tuft;
  grass = mix(grass, vec3(0.045, 0.055, 0.024), smoothstep(0.72, 0.92, cgVn(P * 0.9 + 7.0)) * 0.4);   // rush clumps
  {   // seen from the air: fresher yellower meadow, darker rushy hollows, rust bracken on the slopes, in patches of 30-150 m
    float pa = cgFbm3(P * 0.011 + 2.0), pb = cgFbm3(P * 0.026 + 6.0), pc = cgFbm3(P * 0.019 + 11.0);
    grass = mix(grass, grass * vec3(1.3, 1.22, 0.78), smoothstep(0.52, 0.74, pa) * 0.65);
    grass = mix(grass, grass * vec3(0.62, 0.74, 0.7), smoothstep(0.58, 0.8, pb) * 0.55);
    grass = mix(grass, vec3(0.1, 0.065, 0.032) * (0.8 + 0.4 * n2), smoothstep(0.62, 0.82, pc + slope * 0.3) * 0.45);
  }
  vec3 heather = mix(vec3(0.045, 0.034, 0.03), vec3(0.068, 0.048, 0.045), n2);
  vec3 dead = vec3(0.1, 0.085, 0.05);
  {
    float fp = length(fwidth(P.xz));
    float fine = smoothstep(0.25, 0.04, fp), fine2 = smoothstep(0.08, 0.015, fp);
    float m1 = cgVn(P * 3.1), m2 = cgVn(P * 9.0 + 2.0), m3 = cgVn(vec3(P.x * 23.0, P.y * 6.0, P.z * 23.0));
    grass *= mix(1.0, 0.72 + 0.5 * m1, fine) * mix(1.0, 0.78 + 0.42 * m2, fine2);
    grass = mix(grass, vec3(0.14, 0.13, 0.075), smoothstep(0.78, 0.95, m3) * fine2 * 0.55);       // dead stalks
    grass = mix(grass, grass * vec3(1.18, 1.12, 0.85), smoothstep(0.55, 0.8, cgVn(P * 0.9 + 4.0)) * fine * 0.5);   // sunlit dry tips in patches
  }
  vec3 c = mix(grass, heather, smoothstep(0.45, 0.7, n3 + slope * 0.4) * smoothstep(750.0, 1600.0, r));   // the grounds stay grassy; heather on the far hills
  c = mix(c, dead, smoothstep(0.62, 0.8, cgFbm3(P * 0.01 + 5.0)) * 0.5);
  vec3 rock = mix(vec3(0.12, 0.115, 0.108), vec3(0.2, 0.19, 0.175), n3) * (0.94 + 0.06 * sin(P.y * 0.07 + n1 * 9.0));
  float rk = mix(0.42, 0.38, smoothstep(600.0, 3000.0, r));
  float near = 1.0 - smoothstep(700.0, 1400.0, r);
  float rh; vec3 cr = cliffRock(P, N, rh);
  rock = mix(rock, cr, near);
  float rmask = smoothstep(rk, rk + 0.16, slope + (n1 - 0.5) * 0.3);
  float crag = (1.0 - smoothstep(0.6, 0.95, length((P.xz - vec2(30.0, 10.0)) / vec2(270.0, 200.0)))) * smoothstep(-25.0, 15.0, P.z) * smoothstep(12.0, 4.0, P.y);
  float gx = P.x + 242.0;
  crag = max(crag, smoothstep(-2.0, 6.0, gx) * smoothstep(44.0, 36.0, gx) * smoothstep(-2.0, -8.0, P.y) * smoothstep(-470.0, -380.0, P.z) * 1.6);
  rmask = max(rmask, crag * smoothstep(0.35, 0.65, n2 + slope));
  c = mix(c, rock, rmask);
  c *= 1.0 - 0.6 * vCrease * rmask;   // dark creases between the rounded masses
  c = mix(c, vec3(0.045, 0.055, 0.025), smoothstep(0.35, 0.8, vCrease) * smoothstep(0.45, 0.75, cgVn(P * 0.6)) * 0.6 * rmask);   // moss and grass growing in them
  float ffl = smoothstep(-475.0, -545.0, P.x + (n1 - 0.5) * 40.0) * smoothstep(110.0, 70.0, P.z) * smoothstep(-500.0, -460.0, P.z);
  c = mix(c, mix(vec3(0.028, 0.03, 0.018), vec3(0.05, 0.04, 0.026), n2), ffl * 0.85 * (1.0 - rmask));
  float shore = smoothstep(-55.5, -58.5, h + (n2 - 0.5) * 1.5);
  c = mix(c, vec3(0.1, 0.09, 0.075) * (0.8 + 0.4 * n2), shore);
  c = mix(c, c * vec3(1.05, 1.0, 0.9) * 0.9, smoothstep(700.0, 1100.0, h + n1 * 200.0));
  diffuseColor.rgb *= c;
  cgSpec = mix(0.12, 0.5, shore); cgRough = mix(0.92, 0.6, shore);
  float far = smoothstep(250.0, 1600.0, r);
  cgH = far * (cgFbm(P * 0.012) * 40.0 + cgFbm3(P * 0.05) * 8.0) + (1.0 - far) * (cgVn(P * 2.0) * 0.035 + cgVn(P * 0.4) * 0.08 + tuft * 0.05);
  float d2c = length(P - cameraPosition);
  // near rock: rounded weathered lumps and some vertical clefts (ridged noise or noise isolines read as worm tracks / contour lines)
  float fine = cgFbm3(P * vec3(0.7, 0.28, 0.7)) * 0.55 + cgVn(P * 2.2 + 3.0) * 0.18;
  fine -= 0.25 * smoothstep(0.62, 0.8, cgVn(vec3(P.x * 0.9, P.y * 0.07, P.z * 0.9) + 5.0)) * smoothstep(0.4, 0.8, slope);   // dark vertical clefts on steep faces only
  cgH += rmask * near * (rh * 1.4 + fine * (1.0 - smoothstep(60.0, 260.0, d2c)) * 0.9) - vCrease * 0.6;
  cgAO = 1.0 - 0.5 * vCrease;
` });
// The loch: a planar mirror pass (85-mirror.js) rendered each sample, rippled and mixed in by Fresnel.
const MIRROR = { tReflect: { value: null }, uTexMat: { value: new THREE.Matrix4() }, uMirOn: { value: 0 },
  uBoat: { value: Array.from({ length: 10 }, () => new THREE.Vector4()) }, uBoatN: { value: 0 } };   // boats: x, z, heading, m/s
const WAKE_GLSL = /* glsl */ `
uniform vec4 uBoat[10]; uniform int uBoatN;
float wakeH(vec2 w){
  float h = 0.0;
  for (int i = 0; i < 10; i++) {
    if (i >= uBoatN) break;
    vec4 b = uBoat[i]; vec2 dir = vec2(sin(b.z), cos(b.z)), perp = vec2(dir.y, -dir.x);
    vec2 r = w - b.xy; float al = dot(r, dir), ac = dot(r, perp), back = -al - 1.6;
    if (back < -5.0 || back > 70.0 || abs(ac) > 32.0 || b.w < 0.05) continue;
    float v = b.w, lam = max(6.2832 * v * v / 9.81, 1.2), k = 6.2832 / lam;
    float fade = exp(-max(back, 0.0) / 24.0) * smoothstep(-3.5, 0.5, back) * clamp(v / 3.2, 0.0, 1.2);
    float arm = abs(ac) - 0.354 * max(back, 0.0) - 0.75, wa = 0.5 + back * 0.07;
    float dv = exp(-arm * arm / (wa * wa)) * sin(k * 1.7 * (max(back, 0.0) * 0.94 + abs(ac) * 0.34));
    float tr = smoothstep(0.0, -1.2, arm) * sin(k * max(back, 0.0)) * 0.45;
    float hull = exp(-(al * al) / 5.0 - ac * ac / 1.0) * clamp(v / 3.2, 0.0, 1.0);
    h += (dv + tr) * fade * 0.14 + hull * 0.05;
  }
  return h;
}
`;
M.water = procMat({ name: 'water', rgb: [0.006, 0.012, 0.013], rough: 0.05, bump: 1, env: 1.0, uniforms: MIRROR,
  vhead: 'uniform mat4 uTexMat;\nvarying vec4 vMirror;\n', vert: 'vMirror = uTexMat * vec4(vWPos, 1.0);\n',
  head: 'uniform sampler2D tReflect; uniform float uMirOn; varying vec4 vMirror;\n' + WAKE_GLSL, frag: /* glsl */ `
  vec2 w = P.xz;
  float d = length(P - cameraPosition);
  float near = 1.0 - 0.8 * smoothstep(400.0, 4000.0, d);
  cgH = (cgFbm3(vec3(w * 0.09, uTime * 0.25)) * 0.12 + cgVn(vec3(w * 0.7, uTime * 0.6)) * 0.02 + cgVn(vec3(w * 2.3, uTime)) * 0.004) * near;
  float wk = wakeH(w); vec2 wg = vec2(wakeH(w + vec2(0.12, 0.0)) - wk, wakeH(w + vec2(0.0, 0.12)) - wk) / 0.12;
  cgH += wk;
  cgRough = 0.03;
  vec2 dist = vec2(cgVn(vec3(w * 0.21, uTime * 0.3)) - 0.5, cgVn(vec3(w * 0.21 + 9.1, uTime * 0.3)) - 0.5)
            + 0.5 * vec2(cgVn(vec3(w * 0.9, 3.0)) - 0.5, cgVn(vec3(w * 0.9 + 4.0, 3.0)) - 0.5);
  dist *= 0.012 * near;
  dist += wg * 0.07;
  vec4 mc = vMirror; mc.xy += dist * mc.w;
  vec3 refl = texture2DProj(tReflect, mc).rgb;
  vec3 V = normalize(cameraPosition - P);
  float F = 0.02 + 0.98 * pow(1.0 - clamp(V.y, 0.0, 1.0), 5.0);
  cgEmit = refl * F * 0.92 * uMirOn;
  cgSpec = 1.0 - 0.9 * uMirOn;
` });
// Greenhouse glazing: white glazing bars on a metric grid, tinted glass between.
M.greenglass = procMat({ name: 'greenglass', rgb: [1, 1, 1], rough: 0.1, uv: true, frag: /* glsl */ `
  vec2 g = abs(fract(UV / vec2(0.7, 1.1)) - 0.5);
  float px = length(fwidth(UV / vec2(0.7, 1.1)));
  float bar = 1.0 - smoothstep(0.43 - px, 0.455, max(g.x, g.y));
  bar = mix(bar, 0.3, smoothstep(0.1, 0.4, px));
  vec3 glassc = mix(vec3(0.025, 0.035, 0.025), vec3(0.05, 0.07, 0.04), cgVn(P * 0.6)) * (0.8 + 0.4 * cgVn(P * 0.3));
  diffuseColor.rgb = mix(glassc, vec3(0.5, 0.5, 0.47), bar);
  cgRough = mix(0.08, 0.6, bar); cgSpec = mix(0.8, 0.4, bar);
  cgEmit = vec3(0.9, 0.75, 0.45) * 0.06 * uLamp * (1.0 - bar);
` });
M.clockface = procMat({ name: 'clockface', rgb: [0.55, 0.52, 0.45], rough: 0.6, uv: true, frag: /* glsl */ `
  float r = length(UV); float a = atan(UV.y, UV.x);
  float ring = smoothstep(0.86, 0.88, r) * (1.0 - smoothstep(0.95, 0.97, r));
  float ticks = step(0.75, r) * step(r, 0.86) * smoothstep(0.93, 0.98, cos(a * 12.0));
  float h1 = step(abs(dot(UV, vec2(cos(1.1), -sin(1.1)))), 0.035) * step(dot(UV, vec2(sin(1.1), cos(1.1))), 0.5) * step(0.0, dot(UV, vec2(sin(1.1), cos(1.1))));
  float h2 = step(abs(dot(UV, vec2(cos(-0.4), -sin(-0.4)))), 0.025) * step(dot(UV, vec2(sin(-0.4), cos(-0.4))), 0.72) * step(0.0, dot(UV, vec2(sin(-0.4), cos(-0.4))));
  float ink = max(max(ring, ticks), max(h1, h2));
  diffuseColor.rgb *= mix(vec3(1.0), vec3(0.04), ink);
  cgEmit = vec3(1.0, 0.75, 0.45) * 0.6 * uLamp * (1.0 - ink) * step(r, 0.86);
` });
