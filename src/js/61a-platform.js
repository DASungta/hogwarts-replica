// ------------------------------------------------------------------ station detail: flagged platforms, coping, lamps, windows with rooms behind
// The first pass of the station was boxes with painted faces; this file is the close-up pass for the tour's opening shots:
// flagstones in courses with worn arrises (damp at night, puddles that catch the lamps), stone coping slabs with the white
// edge paint, ramps at the platform ends, cast-iron gas lamps that really light the platform (LAMPS), benches with
// cast-iron ends, sash windows and panelled doors with a room seen through the glass (interior mapping), a canopy valance
// cut into daggers. ref/station s02-s05 (Goathland).

// platform flags: courses along the platform (x), 0.72 m wide, stones 0.75-1.35 m long, 6 mm joints
M.flags = procMat({ name: 'flags', rgb: [1, 1, 1], rough: 0.82, bump: 1, frag: /* glsl */ `
  vec2 q = P.xz + vec2(0.025 * cgVn(vec3(P.xz * 2.1, 3.0)), 0.02 * cgVn(vec3(P.xz * 1.7, 9.0)));
  float pr = floor(q.y / 1.46), pf = q.y - pr * 1.46, hi = step(0.62, pf);
  float r = pr * 2.0 + hi, rowW = mix(0.62, 0.84, hi), fy = pf - hi * 0.62;
  float L2 = 1.5 + 0.5 * cgH21(vec2(r, 1.7)), off = cgH21(vec2(r, 3.3)) * L2;
  float c2 = floor((q.x + off) / L2), f2 = q.x + off - c2 * L2, sp = L2 * (0.35 + 0.3 * cgH21(vec2(c2, r) + 5.1));
  float left = step(f2, sp), fx = mix(f2 - sp, f2, left), L = mix(L2 - sp, sp, left);
  float id = cgH21(vec2(c2 * 2.0 + left, r) + 0.37);
  float e = min(min(fx, L - fx), min(fy, rowW - fy)), px = length(fwidth(q));
  float joint = 1.0 - smoothstep(0.003, 0.005 + px, e);
  float arris = smoothstep(0.003, 0.045, e);
  vec3 c = mix(vec3(0.2, 0.195, 0.18), vec3(0.33, 0.31, 0.28), id) * mix(vec3(1.0), vec3(1.06, 1.0, 0.9), fract(id * 7.7)) * (0.8 + 0.32 * cgFbm3(P * 1.6)) * (0.9 + 0.16 * cgVn(P * 11.0));
  c = mix(c, c * vec3(1.05, 1.02, 0.9), smoothstep(0.55, 0.75, cgFbm3(P * 0.7 + 3.0)));   // ochre staining
  c = mix(c, vec3(0.42, 0.42, 0.37), smoothstep(0.66, 0.8, cgFbm3(P * 4.0 + 9.0)) * 0.35);   // lichen spots
  c = mix(c, vec3(0.06, 0.058, 0.05), joint);
  cgH = (arris - 1.0) * 0.007 + (id - 0.5) * 0.006 + cgVn(P * 16.0) * 0.0012 + (cgFbm3(P * 3.0 + id * 5.0) - 0.4) * 0.004;
  // damp at night: darker, glossy, puddles in the hollows of the worn stones
  float wet = uNight * clamp(0.45 + 0.9 * (cgFbm3(vec3(q * 0.33, 1.0)) - 0.4), 0.0, 1.0);
  float pud = uNight * smoothstep(0.6, 0.68, cgFbm3(vec3(q * 0.21, 7.0)) + (0.5 - id) * 0.06 - (1.0 - arris) * 0.2);
  c *= 1.0 - 0.4 * wet - 0.25 * pud;
  diffuseColor.rgb = c;
  cgRough = mix(mix(0.84, 0.36, wet), 0.05, pud);
  cgH *= 1.0 - 0.9 * pud;
` });
// coping: big stone slabs at the platform edge; a white band painted along the nose (worn through in places)
M.coping = procMat({ name: 'coping', rgb: [1, 1, 1], rough: 0.8, bump: 1, inst: true, frag: /* glsl */ `
  float dirS = vInstC.r * 2.0 - 1.0;   // +1: the edge faces +z
  float de = (vInst.z + dirS * 0.34 - P.z) * dirS;   // metres in from the edge
  vec3 c = vec3(0.3, 0.285, 0.26) * (0.82 + 0.3 * cgFbm3(P * 2.1)) * (0.9 + 0.15 * cgVn(P * 13.0));
  float band = (1.0 - smoothstep(0.29, 0.305, de)) * step(-0.5, N.y);
  float chip = smoothstep(0.6, 0.7, cgFbm3(P * 2.4 + 2.0)) * 0.9 + smoothstep(0.86, 0.9, cgVn(P * 34.0));
  float paint = band * (1.0 - clamp(chip, 0.0, 1.0));
  vec3 white = vec3(0.68, 0.67, 0.62) * (0.88 + 0.12 * cgVn(P * 7.0)) * mix(1.0, 0.75, smoothstep(0.4, 0.8, cgFbm3(P * 3.0)));
  c = mix(c, white, paint);
  cgH = cgVn(P * 18.0) * 0.002 * (1.0 - paint) + paint * 0.0008;
  float wet = uNight * 0.5;
  c *= 1.0 - 0.3 * wet * (1.0 - paint);
  diffuseColor.rgb = c;
  cgRough = mix(mix(0.82, 0.5, wet), 0.45, paint);
` });
// the station building's walls: coursed, rock-faced sandstone darkened by soot (Goathland), 0.22-0.32 m courses;
// dressed stone (no joints) for the window and door surrounds, sills and the plinth
M.stnStone = procMat({ name: 'stnStone', rgb: [1, 1, 1], rough: 0.88, bump: 1, uv: true, frag: /* glsl */ `
  vec2 uv = abs(N.y) > 0.75 ? P.xz : UV;
  float rowH = 0.27, row = floor(uv.y / rowH);
  float rh = rowH * (0.82 + 0.36 * cgH21(vec2(row, 9.1)));
  float fy = fract(uv.y / rowH) * rowH;
  float L = 0.45 + 0.5 * cgH21(vec2(row, 5.3)), off = cgH21(vec2(row, 2.2)) * L;
  float cx = floor((uv.x + off) / L), fx = fract((uv.x + off) / L) * L;
  float id = cgH21(vec2(cx, row) + 0.71);
  float e = min(min(fx, L - fx), min(fy, rowH - fy)), px = length(fwidth(uv));
  float mortar = 1.0 - smoothstep(0.006, 0.009 + px, e);
  float face = smoothstep(0.006, 0.07, e);   // the pitched face bulges toward the middle of each stone
  vec3 c = mix(vec3(0.27, 0.235, 0.18), vec3(0.4, 0.35, 0.27), id) * (0.78 + 0.35 * cgFbm3(P * 2.3)) * (0.9 + 0.16 * cgVn(P * 14.0));
  c *= mix(0.72, 1.0, smoothstep(0.35, 0.75, cgFbm3(vec3(P.x * 0.6, P.y * 0.25, P.z * 0.6) + 5.0)));   // soot
  c = mix(c, vec3(0.3, 0.29, 0.26), mortar);
  diffuseColor.rgb = c; cgH = face * 0.014 * (0.6 + 0.6 * cgFbm3(P * 5.0 + id * 9.0)) + cgVn(P * 30.0) * 0.0015;
  cgAO = mix(0.75, 1.0, face);
` });
M.stnDressed = procMat({ name: 'stnDressed', rgb: [1, 1, 1], rough: 0.8, bump: 1, frag: /* glsl */ `
  vec3 c = vec3(0.37, 0.33, 0.26) * (0.85 + 0.25 * cgFbm3(P * 2.0)) * (0.93 + 0.1 * cgVn(P * 18.0));
  c *= mix(0.78, 1.0, smoothstep(0.35, 0.75, cgFbm3(vec3(P.x * 0.6, P.y * 0.25, P.z * 0.6) + 5.0)));
  diffuseColor.rgb = c; cgH = cgVn(P * 25.0) * 0.002;
` });
// gas lamp glass (clear by day, a soft warm glow at night) and the incandescent mantle inside
// (each pane brightest round the flame behind it, dimmer toward its bars)
M.lampGlass = procMat({ name: 'lampGlass', rgb: [0.2, 0.21, 0.2], rough: 0.12, uv: true, frag: /* glsl */ `
  vec2 g = vec2(fract(UV.x * 4.0), UV.y); float c = 1.0 - smoothstep(0.0, 0.62, length((g - vec2(0.5, 0.4)) * vec2(1.0, 1.25)));
  cgEmit = vec3(1.0, 0.64, 0.32) * (0.3 + 2.6 * c * c) * uLamp;
` });
M.lanternGlass = procMat({ name: 'lanternGlass', rgb: [0.2, 0.21, 0.2], rough: 0.12, uv: true, frag: /* glsl */ `
  float c = 1.0 - smoothstep(0.0, 0.62, length((UV - vec2(0.5, 0.42)) * vec2(1.0, 1.15)));
  cgEmit = vec3(1.0, 0.62, 0.3) * (0.25 + 2.4 * c * c) * uLamp;
` });
M.mantle = procMat({ name: 'mantle', rgb: [0.8, 0.78, 0.7], rough: 0.5, frag: /* glsl */ `cgEmit = vec3(1.0, 0.78, 0.5) * 14.0 * uLamp;` });
M.ironPaint = procMat({ name: 'ironPaint', rgb: [1, 1, 1], rough: 0.42, frag: /* glsl */ `
  vec3 c = vec3(0.16, 0.022, 0.02) * (0.85 + 0.25 * cgFbm3(P * 5.0));
  float rust = smoothstep(0.7, 0.8, cgFbm3(P * 9.0 + 1.0)) * 0.6;
  diffuseColor.rgb = mix(c, vec3(0.09, 0.05, 0.03), rust);
  cgRough = mix(0.38, 0.8, rust);
` });

// ---- a room seen through a pane (interior mapping): the pane's uv carries its position in metres and its size,
// u = metres + 100 * round(w * 10), v likewise; the room behind is a box EX wider each side, FL below, CE above, D deep.
function paneUV(g, w, h) {
  const uv = g.attributes.uv, kw = Math.round(w * 10), kh = Math.round(h * 10);
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w + 100 * kw, uv.getY(i) * h + 100 * kh);
  return g;
}
const ROOM_GLSL = /* glsl */ `
vec3 roomBox(vec2 uv, float w, float h, vec3 P, vec3 N, float tSign, vec4 dim, out float face, out vec3 q){
  vec3 T = tSign * normalize(cross(vec3(0.0, 1.0, 0.0), N)), B = vec3(0.0, 1.0, 0.0);
  vec3 V = normalize(P - cameraPosition);
  vec3 d = vec3(dot(V, T), dot(V, B), min(dot(V, N), -1e-3));
  vec3 o = vec3(uv, 0.0), lo = vec3(-dim.x, -dim.y, -dim.w), hi = vec3(w + dim.x, h + dim.z, 0.0);
  vec3 tF = max((lo - o) / d, (hi - o) / d);
  float t = min(min(tF.x, tF.y), tF.z);
  q = o + d * t;
  face = t == tF.z ? 0.0 : (t == tF.x ? 1.0 : (d.y < 0.0 ? 2.0 : 3.0));   // back wall, side wall, floor, ceiling
  return d;
}
`;
// GLSL that shades the room behind a pane: needs uv (metres on the pane), w, h, P, N, seed, seed2; sets vec3 room
function roomCode(kind) {
  if (kind === 'hall') return HALL_ROOM;
  const station = kind === 'station';
  // station rooms: 3 m deep, a dado and a framed notice on the back wall, boards, a hanging lamp; the coach: compartments
  // 1.9 m deep with the seat backs on the partitions, a luggage rack, the corridor glass on the back wall
  const dim = station ? 'vec4(0.6, 0.95, 0.7, 3.2)' : 'vec4(0.25, 0.75, 0.32, 1.9)';
  return /* glsl */ `
    vec4 dim = ${dim};
    float face; vec3 q;
    vec3 d = roomBox(uv, w, h, P, N, ${station ? '1.0' : '-1.0'}, dim, face, q);
    float yb = q.y + dim.y;   // height above the room floor
    vec3 col;
    ${station ? `
    vec3 wallC = mix(vec3(0.5, 0.42, 0.3), vec3(0.36, 0.38, 0.3), seed2);
    if (face < 0.5) {
      col = mix(wallC, vec3(0.24, 0.1, 0.07), step(yb, 1.0));
      vec2 pc = vec2(q.x - w * 0.5 - (seed - 0.5) * 0.8, yb - 1.75);
      float fr = step(abs(pc.x), 0.42) * step(abs(pc.y), 0.3);
      col = mix(col, mix(vec3(0.2, 0.13, 0.07), vec3(0.62, 0.58, 0.48), step(abs(pc.x), 0.36) * step(abs(pc.y), 0.24)), fr);
      col = mix(col, vec3(0.16, 0.1, 0.06), step(abs(q.x - w * 0.5 + 0.9), 0.4) * step(yb, 2.1) * step(0.6, seed2));   // a door to the next room
    } else if (face < 1.5) col = mix(wallC * 0.85, vec3(0.2, 0.09, 0.06), step(yb, 1.0));
    else if (face < 2.5) col = vec3(0.2, 0.12, 0.07) * (0.75 + 0.25 * step(0.5, fract(q.x * 6.0 + floor(q.z * 0.8) * 0.5)));
    else col = vec3(0.55, 0.52, 0.46);
    vec3 Lp = vec3(w * 0.5, h + dim.z - 0.5, -dim.w * 0.55);` : `
    vec3 moq = seed2 < 0.5 ? vec3(0.32, 0.06, 0.05) : vec3(0.08, 0.1, 0.22);
    if (face < 0.5) {   // the corridor partition: wood below, the sliding door's glass and the lit corridor beyond
      col = vec3(0.28, 0.16, 0.08);
      float gl = step(0.9, yb) * step(yb, 1.85) * step(abs(q.x - w * 0.5), 0.45);
      col = mix(col, vec3(0.75, 0.68, 0.55), gl);
    } else if (face < 1.5) {   // a partition: the seat back (moquette, headrest), the rack above
      col = vec3(0.5, 0.4, 0.28);
      float seat = step(0.42, yb) * step(yb, 1.18) * step(-q.z, dim.w - 0.08);
      col = mix(col, moq * (0.88 + 0.12 * step(0.5, fract(-q.z * 5.0))) * (0.75 + 0.25 * smoothstep(0.42, 0.7, yb)), seat);
      col = mix(col, moq * 0.7, step(1.18, yb) * step(yb, 1.32) * step(-q.z, dim.w - 0.1));
      float cloth = step(1.2, yb) * step(yb, 1.36) * step(abs(fract(-q.z / 0.62) - 0.5), 0.22) * step(-q.z, dim.w - 0.15);
      col = mix(col, vec3(0.75, 0.73, 0.68), cloth);   // the white cloths on the headrests
      col = mix(col, vec3(0.55, 0.5, 0.4), step(1.42, yb) * step(yb, 1.72) * step(abs(-q.z - dim.w * 0.5), 0.35) * 0.6);   // a framed view
      col = mix(col, vec3(0.08, 0.07, 0.06), step(1.78, yb) * step(yb, 1.84) + step(1.9, yb) * step(yb, 1.93));
    } else if (face < 2.5) col = vec3(0.12, 0.08, 0.07);
    else col = vec3(0.6, 0.58, 0.52);
    vec3 Lp = vec3(w * 0.5, h + dim.z - 0.15, -dim.w * 0.5);`}
    float on = step(${station ? '0.22' : '0.08'}, seed);
    vec3 lo3 = vec3(-dim.x, -dim.y, -dim.w), hi3 = vec3(w + dim.x, h + dim.z, 0.0), e1 = min(q - lo3, hi3 - q);
    float e2 = face < 0.5 ? min(e1.x, e1.y) : (face < 1.5 ? min(e1.y, e1.z) : min(e1.x, e1.z));
    col *= 0.55 + 0.45 * smoothstep(0.0, 0.45, e2);   // the corners of the room darker
    float dl = length(q - Lp);
    vec3 lit = vec3(1.0, 0.66, 0.36) * (${station ? '1.0' : '0.75'} / (1.0 + 0.9 * dl * dl)) * uLamp * on + vec3(0.16, 0.17, 0.18) * (1.0 - uNight);
    vec3 room = col * lit;
    float cur = (step(uv.x, 0.11 * w) + step(w * 0.89, uv.x)) * step(0.45, seed2);   // curtains or a half-drawn blind
    room = mix(room, vec3(0.35, 0.08, 0.05) * (lit * 0.7 + 0.01), min(cur, 1.0));
    float blind = step(h * (0.62 + 0.3 * seed), uv.y) * step(seed2, 0.25);
    room = mix(room, vec3(0.6, 0.5, 0.36) * (lit * 0.8 + 0.02), blind);`;
}
// the Entrance Hall through the porch doors: sandstone ashlar walls, a flagged floor, a dark ceiling, torches on the side
// walls, the foot of a staircase on the far wall
const HALL_ROOM = /* glsl */ `
    vec4 dim = vec4(2.5, 0.02, 3.0, 10.0);
    float face; vec3 q;
    vec3 d = roomBox(uv, w, h, P, N, 1.0, dim, face, q);
    float yb = q.y + dim.y;
    vec2 wq = face < 0.5 ? vec2(q.x, yb) : (face < 1.5 ? vec2(q.z, yb) : q.xz);
    vec2 jb = abs(fract(wq / vec2(0.9, 0.45) + vec2(floor(wq.y / 0.45) * 0.5, 0.0)) - 0.5);
    float joint = step(0.47, max(jb.x * 1.0, jb.y));
    vec3 col = face < 1.5 ? vec3(0.46, 0.36, 0.24) * (0.85 + 0.2 * cgVn(vec3(wq * 3.0, 1.0))) : (face < 2.5 ? vec3(0.28, 0.25, 0.21) : vec3(0.08, 0.07, 0.06));
    col *= 1.0 - 0.35 * joint;
    if (face < 0.5) { float st = step(abs(q.x - w * 0.5), 1.8) * step(yb, 1.2 + 0.3 * floor((q.x - w * 0.5 + 1.8) * 0.0)); col = mix(col, vec3(0.36, 0.3, 0.22), st * 0.6); }   // the stair's first steps
    vec3 T1 = vec3(-dim.x + 0.1, 2.6, -3.5), T2 = vec3(w + dim.x - 0.1, 2.6, -3.5), T3 = vec3(w * 0.5, 3.4, -dim.w + 0.2);
    float l = 6.0 / (1.0 + 0.35 * dot(q - T1, q - T1)) + 6.0 / (1.0 + 0.35 * dot(q - T2, q - T2)) + 4.0 / (1.0 + 0.25 * dot(q - T3, q - T3));
    vec3 lit = vec3(1.0, 0.62, 0.32) * l * uLamp + vec3(0.06, 0.06, 0.065) * (1.0 - uNight);
    vec3 room = col * lit;
    room += vec3(1.0, 0.7, 0.35) * uLamp * (smoothstep(0.35, 0.0, length(q - T1)) + smoothstep(0.35, 0.0, length(q - T2))) * 3.0;   // the torch flames`;
function roomMat(name) {   // a station pane
  return procMat({ name, rgb: [0.02, 0.022, 0.024], rough: 0.06, uv: true, head: ROOM_GLSL, frag: /* glsl */ `
    float kw = floor(UV.x / 100.0), kh = floor(UV.y / 100.0), w = kw / 10.0, h = kh / 10.0;
    vec2 uv = vec2(UV.x - kw * 100.0, UV.y - kh * 100.0);
    float seed = cgH21(floor(P.xz * 0.6 + 0.5) + floor(P.y * 0.5) * 7.0), seed2 = fract(seed * 7.31);
    ${roomCode('station')}
    diffuseColor.rgb = vec3(0.012, 0.013, 0.014); cgRough = 0.05; cgEmit = room;
  ` });
}
M.roomStation = roomMat('roomStation');
M.roomHall = procMat({ name: 'roomHall', rgb: [0.02, 0.02, 0.02], rough: 0.9, uv: true, head: ROOM_GLSL, frag: /* glsl */ `
  float kw = floor(UV.x / 100.0), kh = floor(UV.y / 100.0), w = kw / 10.0, h = kh / 10.0;
  vec2 uv = vec2(UV.x - kw * 100.0, UV.y - kh * 100.0);
  ${HALL_ROOM}
  diffuseColor.rgb = vec3(0.0); cgSpec = 0.0; cgEmit = room;
` });
// Mk1 coach sides: maroon with the lining; rounded windows and the doors' droplights look into the compartments
// (the body's uv: u metres along the coach, v metres up from the rail + 10 x the coach's number)
M.coach = procMat({ name: 'coach', rgb: [1, 1, 1], rough: 0.35, uv: true, head: ROOM_GLSL, frag: /* glsl */ `
  float kc = floor(UV.y / 10.0), v = UV.y - kc * 10.0, u = UV.x;
  vec3 c = vec3(0.2, 0.015, 0.016) * (0.92 + 0.12 * cgFbm3(P * 0.6));
  float lining = step(abs(v - 1.05), 0.022) + step(abs(v - 2.5), 0.018) + step(abs(v - 1.13), 0.01);
  c = mix(c, vec3(0.6, 0.45, 0.18), clamp(lining, 0.0, 1.0));
  float ci = floor(u / 1.45);
  vec2 wc = vec2(u - (ci + 0.5) * 1.45, v - 1.8);
  vec2 dq = abs(wc) - vec2(0.42, 0.39);
  float win = step(length(max(dq, 0.0)) + min(max(dq.x, dq.y), 0.0) - 0.08, 0.0) * step(0.5, ci) * step(ci, 12.5);
  float du = abs(u - 0.6) < 0.5 ? u - 0.6 : u - 19.0;
  vec2 dq2 = abs(vec2(du, v - 1.95)) - vec2(0.24, 0.26);
  float drop = step(length(max(dq2, 0.0)) + min(max(dq2.x, dq2.y), 0.0) - 0.06, 0.0) * step(abs(du), 0.5);
  float dline = (1.0 - step(0.012, abs(abs(du) - 0.45))) * step(0.3, v) * step(v, 2.42) * step(abs(du), 0.5);
  c *= 1.0 - 0.6 * dline;
  float grime = (1.0 - smoothstep(0.55, 1.6, v + 0.25 * cgFbm3(P * 1.5))) * 0.8 + 0.2 * smoothstep(0.62, 0.85, cgFbm3(vec3(P.x * 1.5, P.y * 9.0, P.z * 1.5)));
  c = mix(c, vec3(0.06, 0.035, 0.028), grime * 0.5);
  diffuseColor.rgb = c; cgRough = mix(0.3 + 0.1 * cgVn(P * 2.0), 0.65, grime * 0.6);
  if (win + drop > 0.5) {
    vec2 uv; float w, h;
    if (win > 0.5) { uv = wc + vec2(0.5, 0.47); w = 1.0; h = 0.94; } else { uv = vec2(du, v - 1.95) + vec2(0.3, 0.32); w = 0.6; h = 0.64; }
    float seed = cgH21(vec2(ci + kc * 17.0 + step(0.5, drop) * 40.0, sign(N.z) * 3.0 + 1.0)), seed2 = fract(seed * 7.31);
    ${roomCode('coach')}
    diffuseColor.rgb = vec3(0.012, 0.013, 0.014); cgRough = 0.05; cgEmit = room;
  }
` });
M.cabGlass = procMat({ name: 'cabGlass', rgb: [0.015, 0.016, 0.018], rough: 0.05 });

// ---- builders
// coping slabs along an edge at zEdge; dir = +1 when the track is on the +z side
function copingRun(xa, xb, zEdge, dir, PY) {
  const list = [], cols = [], R = rng('coping' + xa + zEdge);
  for (let x = xa; x < xb - 0.2;) {
    const L = Math.min(xb - x, 0.85 + R() * 0.35);
    list.push(xf([x + L / 2, PY - 0.06, zEdge - dir * 0.28], 0, [L - 0.008, 1, 1]));
    cols.push([dir > 0 ? 1 : 0, 0, 0]);
    x += L;
  }
  addInst(new RoundedBoxGeometry(1, 0.17, 0.68, 2, 0.035), M.coping, list, cols);
}
// a flagged surface (a thin slab on top of the platform's stone body) and a ramp down at an end
function flagged(x0, x1, z0, z1, PY) { put('flags', new THREE.BoxGeometry(x1 - x0, 0.06, z1 - z0).translate((x0 + x1) / 2, PY - 0.02, (z0 + z1) / 2)); }
function ramp(xTop, dirX, z0, z1, yTop, yFoot, len) {   // dirX: which way it runs down from the platform end at xTop
  let pts = [[0, yTop + 0.01], [0, yFoot - 0.6], [len, yFoot - 0.6], [len, yFoot]];
  if (dirX < 0) pts = pts.map(([a, b]) => [-a, b]).reverse();
  put('flags', new THREE.ExtrudeGeometry(pathPts(new THREE.Shape(), pts), { depth: z1 - z0, bevelEnabled: false }).translate(xTop, 0, z0));
}
// a cast-iron gas lamp at the platform: octagonal plinth, fluted column, collar, ladder bar, a lantern with glazing bars,
// a bell-cast cap and finial; the mantle lights the platform (LAMPS)
{
  const v2 = (pts) => pts.map(([r, h]) => new THREE.Vector2(r, h));
  const plinth = new THREE.CylinderGeometry(0.15, 0.17, 0.22, 8).translate(0, 0.11, 0);
  const base = new THREE.LatheGeometry(v2([[0.14, 0.22], [0.14, 0.26], [0.11, 0.3], [0.1, 0.42], [0.12, 0.46], [0.085, 0.52], [0.075, 0.6], [0, 0.6]]), 24);
  const col = new THREE.CylinderGeometry(0.048, 0.066, 2.0, 32, 24).translate(0, 1.6, 0);
  { const p = col.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), r = Math.hypot(x, z), k = 1 - 0.07 * Math.pow(Math.max(0, Math.cos(a * 12)), 2); p.setX(i, x * k); p.setZ(i, z * k); } col.computeVertexNormals(); }
  const collar = new THREE.LatheGeometry(v2([[0, 2.58], [0.07, 2.58], [0.09, 2.62], [0.065, 2.66], [0.06, 2.72], [0.085, 2.76], [0.05, 2.8], [0.045, 2.94], [0, 2.94]]), 24);
  const bar = [new THREE.CylinderGeometry(0.018, 0.018, 0.64, 10).rotateZ(Math.PI / 2).translate(0, 2.84, 0), ...[-0.33, 0.33].map((x) => new THREE.SphereGeometry(0.034, 12, 8).translate(x, 2.84, 0))];
  for (const s of [-1, 1]) bar.push(new THREE.TorusGeometry(0.075, 0.012, 6, 16, Math.PI * 1.2).rotateZ(s > 0 ? -0.3 : Math.PI + 0.3).translate(s * 0.12, 2.72, 0));
  // lantern: a tray, four corner posts flaring out, bars across the glass, a bell-cast cap, a vent and finial
  const LB = 2.96, LT = 3.46, hb = 0.12, ht = 0.18, frame = [new THREE.CylinderGeometry(hb * 1.45, hb * 1.1, 0.06, 4).rotateY(Math.PI / 4).translate(0, LB - 0.03, 0)];
  for (let k = 0; k < 4; k++) {
    const a = k * Math.PI / 2 + Math.PI / 4, ca = Math.cos(a) * Math.SQRT2, sa = Math.sin(a) * Math.SQRT2;
    const pb = new THREE.Vector3(ca * hb, LB, sa * hb), pt = new THREE.Vector3(ca * ht, LT, sa * ht), dv = pt.clone().sub(pb), L = dv.length();
    frame.push(new THREE.CylinderGeometry(0.012, 0.012, L, 6).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dv.normalize())).translate((pb.x + pt.x) / 2, (LB + LT) / 2, (pb.z + pt.z) / 2));
  }
  for (const yy of [LB + 0.2, LT - 0.02]) { const hh = hb + (ht - hb) * (yy - LB) / (LT - LB); frame.push(new THREE.CylinderGeometry(hh * 1.43, hh * 1.43, 0.025, 4, 1, true).rotateY(Math.PI / 4).translate(0, yy, 0)); }
  const cap = new THREE.LatheGeometry(v2([[0, LT + 0.02], [ht * 1.6, LT + 0.02], [ht * 1.5, LT + 0.06], [ht * 1.05, LT + 0.12], [ht * 0.55, LT + 0.2], [0.07, LT + 0.26], [0, LT + 0.26]]), 4).rotateY(Math.PI / 4);
  const vent = new THREE.LatheGeometry(v2([[0, LT + 0.25], [0.06, LT + 0.25], [0.06, LT + 0.31], [0.09, LT + 0.33], [0.04, LT + 0.37], [0.018, LT + 0.4], [0.03, LT + 0.44], [0.008, LT + 0.52], [0, LT + 0.52]]), 16);
  const glass = new THREE.CylinderGeometry(ht * 1.36, hb * 1.36, LT - LB - 0.02, 4, 1, true).rotateY(Math.PI / 4).translate(0, (LB + LT) / 2, 0);
  const mantle = new THREE.SphereGeometry(0.045, 12, 8).scale(1, 1.4, 1).translate(0, LB + 0.2, 0);
  protoDef('gaslamp', [{ mat: 'ironPaint', geo: merge([plinth, base, col, collar, ...bar, ...frame, cap, vent]) }, { mat: 'lampGlass', geo: glass, cast: false }, { mat: 'mantle', geo: mantle, cast: false }]);
  // a platform bench: rounded slats on scrolled cast-iron ends
  const B = [];
  for (let k = 0; k < 3; k++) B.push(new RoundedBoxGeometry(1.9, 0.035, 0.11, 2, 0.012).translate(0, 0.46, -0.2 + k * 0.125));
  for (let k = 0; k < 3; k++) B.push(new RoundedBoxGeometry(1.9, 0.1, 0.03, 2, 0.01).rotateX(-0.22).translate(0, 0.62 + k * 0.13, -0.3 - k * 0.03));
  const ends = [];
  const tube = (pts, r = 0.02) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(([z, y]) => new THREE.Vector3(0, y, z))), 24, r, 6, false);
  for (const x of [-0.86, 0.86]) {
    for (const g of [tube([[0.08, 0], [0.06, 0.2], [0.04, 0.44]]), tube([[-0.3, 0], [-0.27, 0.22], [-0.29, 0.44], [-0.36, 0.7], [-0.4, 0.95]]),
      tube([[0.06, 0.44], [-0.1, 0.45], [-0.29, 0.44]], 0.018), tube([[-0.34, 0.62], [-0.1, 0.63], [0.06, 0.62], [0.12, 0.57], [0.08, 0.53], [0.04, 0.56]], 0.016)]) ends.push(g.translate(x, 0, 0));
    for (const z of [0.08, -0.3]) ends.push(new THREE.SphereGeometry(0.035, 10, 6).scale(1, 0.5, 1).translate(x, 0.01, z));
  }
  protoDef('bench', [{ mat: 'maroon', geo: merge(B) }, { mat: 'paintBlack', geo: merge(ends) }]);
}
function gasLamp(x, PY, z) {
  place('gaslamp', xf([x, PY, z], 0, 1));
  LAMPS.push({ p: [x, PY + 3.17, z], c: [1.0, 0.6, 0.28].map((v) => v * 13), r: 11, halo: 0.9, hk: 0.3 });
}
// a sash window set in a stone wall facing dir (+1: +z): stone surround and sill, two sashes of 2 x 2 panes, glass
// with the room behind; door: a panelled door with a fanlight
function sashWindow(x, y0, zf, w, h, dir, frameMat = 'cream') {
  const g0 = [], fr = [], st = [];
  const Z = (d) => zf + dir * d;
  st.push(new RoundedBoxGeometry(0.16, h + 0.1, 0.12, 2, 0.02).translate(x - w / 2 - 0.08, y0 + h / 2, Z(0.04)), new RoundedBoxGeometry(0.16, h + 0.1, 0.12, 2, 0.02).translate(x + w / 2 + 0.08, y0 + h / 2, Z(0.04)));
  st.push(new RoundedBoxGeometry(w + 0.5, 0.22, 0.14, 2, 0.02).translate(x, y0 + h + 0.13, Z(0.05)));
  st.push(new RoundedBoxGeometry(w + 0.36, 0.09, 0.2, 2, 0.02).translate(x, y0 - 0.045, Z(0.08)));
  const glass = paneUV(new THREE.PlaneGeometry(w, h), w, h);
  if (dir < 0) glass.rotateY(Math.PI);
  g0.push(glass.translate(x, y0 + h / 2, Z(0.02)));
  const bar = (bw, bh, bx, by, d = 0.05) => fr.push(new THREE.BoxGeometry(bw, bh, d).translate(bx, by, Z(0.045)));
  bar(w, 0.07, x, y0 + 0.035); bar(w, 0.07, x, y0 + h - 0.035); bar(0.07, h, x - w / 2 + 0.035, y0 + h / 2); bar(0.07, h, x + w / 2 - 0.035, y0 + h / 2);
  bar(w, 0.06, x, y0 + h / 2, 0.08);   // the meeting rails
  bar(0.03, h, x, y0 + h / 2, 0.04); bar(w, 0.03, x, y0 + h / 4, 0.04); bar(w, 0.03, x, y0 + h * 3 / 4, 0.04);
  for (const g of st) put('stnDressed', g);
  for (const g of fr) put(frameMat, g);
  for (const g of g0) put('roomStation', g);
}
function panelDoor(x, y0, zf, w, h, dir, mat = 'maroon') {
  const Z = (d) => zf + dir * d;
  put('stnDressed', new RoundedBoxGeometry(0.18, h + 0.75, 0.14, 2, 0.02).translate(x - w / 2 - 0.09, y0 + (h + 0.75) / 2, Z(0.05)));
  put('stnDressed', new RoundedBoxGeometry(0.18, h + 0.75, 0.14, 2, 0.02).translate(x + w / 2 + 0.09, y0 + (h + 0.75) / 2, Z(0.05)));
  put('stnDressed', new RoundedBoxGeometry(w + 0.6, 0.24, 0.16, 2, 0.02).translate(x, y0 + h + 0.82, Z(0.06)));
  put(mat, new THREE.BoxGeometry(w, h, 0.06).translate(x, y0 + h / 2, Z(0.02)));
  for (const [px, py, pw, ph] of [[-0.25, 0.55, 0.36, 0.7], [0.25, 0.55, 0.36, 0.7], [-0.25, 1.45, 0.36, 0.85], [0.25, 1.45, 0.36, 0.85]]) {
    put(mat, new RoundedBoxGeometry(pw * w, ph, 0.04, 2, 0.012).translate(x + px * w, y0 + py, Z(0.06)));
  }
  put('cream', new THREE.BoxGeometry(w, 0.08, 0.08).translate(x, y0 + h + 0.04, Z(0.04)));
  const fan = paneUV(new THREE.PlaneGeometry(w - 0.1, 0.5), w - 0.1, 0.5); if (dir < 0) fan.rotateY(Math.PI);
  put('roomStation', fan.translate(x, y0 + h + 0.33, Z(0.02)));
  put('brass', new THREE.SphereGeometry(0.035, 10, 8).translate(x + w * 0.38, y0 + 1.0, Z(0.09)));
}
// a canopy valance: a board cut into daggers along its foot, from (xa, z) to (xb, z)
function valance(xa, xb, y, z, ax = 'x') {
  const L = Math.abs(xb - xa), n = Math.round(L / 0.16), pts = [[0, 0]];
  for (let k = 0; k < n; k++) { const u = (k / n) * L, v = ((k + 0.5) / n) * L; pts.push([u, -0.26], [v, -0.42]); }
  pts.push([L, -0.26], [L, 0]);
  const g = new THREE.ExtrudeGeometry(pathPts(new THREE.Shape(), pts), { depth: 0.025, bevelEnabled: false });
  if (ax === 'z') g.rotateY(-Math.PI / 2);
  put('cream', g.translate(ax === 'x' ? Math.min(xa, xb) : z, y, ax === 'x' ? z : Math.min(xa, xb)));
}
