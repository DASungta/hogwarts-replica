// ------------------------------------------------------------------ portraits painted on the GPU: ray-marched busts, then an oil-paint pass
// Each portrait is a sitter modelled as signed distances (skull, jaw, cheekbones, brow, eye sockets and eyes, nose with
// alae and nostrils, lips, ears, neck; hair, beard and moustache; a hat; a ruff, collar, pearls or chain; a robe or
// armour), lit like an old master's half-length portrait (a warm key light high on the left, a dim cool fill, soft
// shadows, occlusion, skin that reddens at the shadow edge). A second pass turns the render into paint: a Kuwahara
// filter flattens it into strokes, then canvas weave, brush streaks, yellowed varnish, craquelure and a vignette.
// The atlas has the same 8 x 6 cells as the canvas one (16-paint.js); every sixth cell stays a painted landscape.
const PGL = { cols: 8, rows: 6, cw: 320, ch: 400 };
const PORTRAIT_GLSL = /* glsl */ `
precision highp float;
uniform vec2 uOrigin, uSize;
uniform float uKind, uYaw, uPitch, uAge, uBeard, uHat, uCollar, uSeed, uFem, uBald, uHairLen;
uniform vec3 uSkin, uHairC, uRobe, uRobe2, uBg, uBg2, uEyeC;
uniform int uZero;   // always 0: loops that start from it cannot be unrolled, which keeps the D3D compile short
const float PI = 3.14159265;
float h11(float n) { return fract(sin(n * 127.1 + uSeed * 31.7) * 43758.5453); }
float h31(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vn(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fbm(vec3 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * vn(p); p = p * 2.03 + 1.7; a *= 0.5; } return s / 0.9375; }
float sdEll(vec3 p, vec3 r) { float k0 = length(p / r), k1 = length(p / (r * r)); return k0 * (k0 - 1.0) / k1; }
float sdCap(vec3 p, vec3 a, vec3 b, float ra, float rb) { vec3 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h) - mix(ra, rb, h); }
float sdTorus(vec3 p, float R, float r) { return length(vec2(length(p.xz) - R, p.y)) - r; }
float sdCCone(vec3 p, float h, float r1, float r2) {
  vec2 q = vec2(length(p.xz), p.y), k1 = vec2(r2, h), k2 = vec2(r2 - r1, 2.0 * h);
  vec2 ca = vec2(q.x - min(q.x, (q.y < 0.0) ? r1 : r2), abs(q.y) - h);
  vec2 cb = q - k1 + k2 * clamp(dot(k1 - q, k2) / dot(k2, k2), 0.0, 1.0);
  float s = (cb.x < 0.0 && ca.y < 0.0) ? -1.0 : 1.0;
  return s * sqrt(min(dot(ca, ca), dot(cb, cb)));
}
float smin(float a, float b, float k) { float h = max(k - abs(a - b), 0.0) / k; return min(a, b) - h * h * k * 0.25; }
float smax(float a, float b, float k) { return -smin(-a, -b, k); }
vec3 rotY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
vec3 rotX(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z); }
vec3 toHead(vec3 p) { vec3 h = rotX(rotY(p, -uYaw), -uPitch); h.y = 0.12 + (h.y - 0.12) * mix(1.0, 1.3, smoothstep(0.25, -0.35, h.y)); return h; }
// materials: 1 skin, 2 eye, 3 hair, 4 beard, 5 hat, 6 robe, 7 linen, 8 armour, 9 gold, 10 lips
vec2 opU(vec2 a, vec2 b) { return a.x < b.x ? a : b; }
float sdFace(vec3 h) {
  float d = sdEll(h - vec3(0.0, 0.38, -0.12), vec3(0.8, 0.88, 0.95) * (1.0 - 0.04 * uFem));                    // cranium
  d = smin(d, sdEll(h - vec3(0.0, -0.32, 0.16), vec3(0.62 - 0.06 * uFem, 0.66, 0.62)), 0.28);                    // face and jaw
  d = smin(d, sdEll(h - vec3(0.0, -0.9, 0.4), vec3(0.25, 0.19, 0.22)), 0.18);                                   // chin
  vec3 m = vec3(abs(h.x), h.y, h.z); float s = 1.0;
  {
    d = smin(d, sdEll(m - vec3(s * 0.43, -0.06, 0.42), vec3(0.22, 0.15, 0.2)), 0.16);                         // cheekbones
    d = smin(d, sdEll(m - vec3(s * 0.4, -0.62, 0.22), vec3(0.2, 0.22, 0.24)), 0.2);                           // jaw corners
    d = smax(d, -sdEll(m - vec3(s * 0.27, 0.12, 0.74), vec3(0.17, 0.11, 0.15)), 0.09);                        // eye sockets
    d = smin(d, sdEll(m - vec3(s * 0.79, 0.04, -0.06), vec3(0.09, 0.27, 0.17)), 0.06);                        // ears
    d = smax(d, -sdEll(m - vec3(s * 0.21, -0.55, 0.78), vec3(0.06, 0.18, 0.08)), 0.06 + 0.04 * uAge);         // nasolabial folds
    d = smin(d, sdEll(m - vec3(s * 0.27, 0.205, 0.655), vec3(0.155, 0.055, 0.09)), 0.04);                      // upper lids
    d = smin(d, sdEll(m - vec3(s * 0.27, 0.045, 0.655), vec3(0.135, 0.03, 0.08)), 0.035);                      // lower lids
  }
  d = smin(d, sdEll(h - vec3(0.0, 0.33, 0.66), vec3(0.5, 0.12, 0.16)), 0.12);                                    // brow ridge
  d = smin(d, sdCap(h, vec3(0.0, 0.2, 0.76), vec3(0.0, -0.28, 0.95), 0.075, 0.095), 0.07);                       // nose bridge
  d = smin(d, sdEll(h - vec3(0.0, -0.32, 0.96), vec3(0.1, 0.1, 0.1)), 0.06);                                     // tip
  d = smin(d, sdEll(m - vec3(0.11, -0.36, 0.85), vec3(0.075, 0.065, 0.075)), 0.05);                           // alae
  d = smax(d, -sdEll(m - vec3(0.07, -0.42, 0.9), vec3(0.035, 0.022, 0.04)), 0.02);                             // nostrils
  d = smin(d, sdEll(h - vec3(0.0, -0.545, 0.79), vec3(0.21, 0.055, 0.08)), 0.05);                                // upper lip
  d = smin(d, sdEll(h - vec3(0.0, -0.655, 0.765), vec3(0.18, 0.06, 0.08)), 0.05);                                // lower lip
  d = smax(d, -sdEll(h - vec3(0.0, -0.6, 0.86), vec3(0.2, 0.012, 0.1)), 0.012);                                  // the mouth line
  d = smax(d, -sdEll(h - vec3(0.0, -0.46, 0.88), vec3(0.03, 0.06, 0.03)), 0.02);                                 // philtrum
  // age: forehead lines and hollow cheeks
  d += uAge * (0.006 * sin(h.y * 46.0) * smoothstep(0.35, 0.6, h.y) * smoothstep(0.3, 0.6, h.z) - 0.02 * smoothstep(0.25, 0.0, abs(h.y + 0.25)) * smoothstep(0.2, 0.5, abs(h.x)));
  return d;
}
vec2 mapP(vec3 p) {
  // the body: shoulders and chest, turned a little with the head, folds in the cloth
  vec3 q = rotY(p - vec3(0.0, -1.88, -0.35), -uYaw * 0.35);
  float sw = 1.0 - 0.14 * uFem;
  float t = sdEll(q - vec3(0.0, -0.35, 0.02), vec3(1.2 * sw, 1.0, 0.78));
  vec3 qa = vec3(abs(q.x), q.y, q.z);
  t = smin(t, sdEll(qa - vec3(1.2 * sw, 0.02, -0.05), vec3(0.6, 0.48, 0.6)), 0.5);
  t = smin(t, sdCap(qa, vec3(1.38 * sw, -0.2, -0.05), vec3(1.55 * sw, -2.8, 0.1), 0.5, 0.56), 0.3);
  t = smin(t, sdEll(q - vec3(0.0, -1.7, 0.05), vec3(1.42 * sw, 1.5, 0.84)), 0.5);
  if (uKind > 2.5 && uKind < 3.5) { t = smin(t, sdEll(q - vec3(0.0, -0.75, 0.22), vec3(1.05, 1.1, 0.82)), 0.3); t += 0.012 * smoothstep(0.85, 0.95, fract(q.y * 2.6)) * step(q.y, -0.9); }
  else t += 0.03 * sin(q.x * 6.5 + 2.0 * sin(q.y * 2.3 + uSeed)) * smoothstep(0.0, -1.0, q.y);
  vec2 r = vec2(t, uKind > 2.5 && uKind < 3.5 ? 8.0 : 6.0);
  vec3 h = toHead(p);
  float hb = length(h - vec3(0.0, 0.1 - 0.6 * uBeard * 0.5, 0.1)) - 1.9 - 0.6 * uBeard - (uHat > 0.5 && uHat < 1.5 ? 1.4 : 0.6);
  if (hb > 0.25) { float nk = sdCap(h, vec3(0.0, -0.5, -0.15), vec3(0.0, -2.0, -0.3), 0.46, 0.56); r = opU(r, vec2(min(hb, nk), 1.0)); return r; }
  float neck = sdCap(h, vec3(0.0, -0.5, -0.15), vec3(0.0, -2.0, -0.3), 0.46 - 0.07 * uFem, 0.56);
  float face = smin(sdFace(h), neck, 0.2);
  vec2 skin = vec2(face, 1.0);
  if (h.y < -0.5 && h.y > -0.72 && h.z > 0.6 && abs(h.x) < 0.22) skin.y = 10.0;
  r = opU(r, skin);
  r = opU(r, vec2(length(vec3(abs(h.x), h.y, h.z) - vec3(0.27, 0.12, 0.62)) - 0.118, 2.0));
  // hair: a cap over the skull cut away from the face, longer at the back for some; balding with age
  float hair = sdEll(h - vec3(0.0, 0.43, -0.14), vec3(0.87, 0.93, 1.01));
  hair = smin(hair, sdEll(h - vec3(0.0, -0.3 - 0.4 * uHairLen, -0.38), vec3(0.85, 0.7 + 0.7 * uHairLen, 0.62)), 0.25 * step(0.01, uHairLen) + 0.001);
  hair = smax(hair, -sdEll(h - vec3(0.0, -0.18, 0.62), vec3(0.98, 0.98, 0.75)), 0.08);
  if (uBald > 0.05) hair = smax(hair, -(sdEll(h - vec3(0.0, 1.05, 0.25), vec3(0.62, 0.45, 0.75)) + 0.35 * (1.0 - uBald)), 0.05);
  float az = atan(h.x, h.z);
  hair += 0.018 * vn(vec3(az * 14.0, h.y * 1.5, uSeed)) + 0.01 * sin(az * 5.0 + h.y * 3.0);
  if (uFem > 0.5) hair = smin(hair, length(h - vec3(0.0, 0.55, -0.92)) - 0.34, 0.12);   // a bun
  r = opU(r, vec2(hair, 3.0));
  // beard and moustache
  if (uBeard > 0.01) {
    float L = uBeard;
    float b = sdEll(h - vec3(0.0, -0.78, 0.32), vec3(0.64, 0.4, 0.5));
    b = smin(b, sdEll(h - vec3(0.0, -0.95 - L * 0.55, 0.28 - L * 0.06), vec3(0.55 - 0.12 * L, 0.32 + L * 0.62, 0.38)), 0.35);
    b = smax(b, -sdEll(h - vec3(0.0, -0.6, 0.8), vec3(0.2, 0.08, 0.25)), 0.04);
    b = smax(b, h.y + 0.5, 0.08);
    b = smax(b, -sdEll(h - vec3(0.0, -0.4, 0.2), vec3(0.6, 0.55, 0.75)), 0.06);
    b = smin(b, sdCap(vec3(abs(h.x), h.y, h.z), vec3(0.02, -0.48, 0.93), vec3(0.32, -0.66, 0.74), 0.065, 0.025), 0.05);
    b += 0.02 * vn(h * vec3(26.0, 3.0, 26.0) + uSeed) * smoothstep(-0.6, -1.0, h.y);
    r = opU(r, vec2(b, 4.0));
  }
  // hats: 1 a wizard's cone, 2 a tall crowned hat, 3 a flat cap, 4 a skull cap
  if (uHat > 0.5) {
    float ht = 1e9;
    if (uHat < 1.5) {
      vec3 c = h - vec3(0.0, 1.0, -0.12); c.z += 0.08 * c.y * c.y; c.x += 0.05 * c.y * c.y;
      ht = sdCCone(c - vec3(0.0, 1.35, 0.0), 1.35, 0.92, 0.02);
      ht = min(ht, sdEll(h - vec3(0.0, 0.98, -0.1), vec3(1.25, 0.06, 1.3)));
    } else if (uHat < 2.5) {
      ht = sdCCone(h - vec3(0.0, 1.55, -0.12), 0.6, 0.82, 0.72) - 0.02;
      ht = min(ht, sdEll(h - vec3(0.0, 0.98, -0.12), vec3(1.35, 0.05, 1.38)));
    } else if (uHat < 3.5) {
      ht = sdEll(rotY(h, 0.0) - vec3(0.12, 0.98, -0.1), vec3(1.08, 0.26, 1.1));
      ht = smin(ht, sdEll(h - vec3(0.0, 0.84, -0.1), vec3(0.92, 0.1, 0.98)), 0.05);
    } else {
      ht = smax(sdEll(h - vec3(0.0, 0.43, -0.14), vec3(0.89, 0.95, 1.03)), -(h.y - 0.82), 0.04);
    }
    r = opU(r, vec2(ht, 5.0));
  }
  // collars: 1 a ruff, 2 a falling linen band, 3 pearls, 4 a gold chain of office; armour gets a gorget
  if (uCollar > 0.5) {
    vec3 c = rotY(p - vec3(0.0, -1.18, -0.25), -uYaw * 0.5);
    if (uCollar < 1.5) { float a = atan(c.z, c.x); r = opU(r, vec2(sdTorus(c * vec3(1.0, 1.0, 1.15), 0.66, 0.24 + 0.045 * cos(a * 26.0)) , 7.0)); }
    else if (uCollar < 2.5) { r = opU(r, vec2(min(sdEll(c - vec3(-0.12, -0.42, 0.62), vec3(0.12, 0.3, 0.05)), sdEll(c - vec3(0.12, -0.42, 0.62), vec3(0.12, 0.3, 0.05))), 7.0)); r = opU(r, vec2(sdTorus(c * vec3(1.0, 1.0, 1.1), 0.5, 0.07), 7.0)); }
    else if (uCollar < 3.5) { float a = atan(c.z, c.x), k = floor(a / 0.21 + 0.5) * 0.21; vec3 bc = vec3(cos(k) * 0.78, -0.25 - 0.25 * max(0.0, sin(k)), sin(k) * 0.78 * 1.1); r = opU(r, vec2(length(c - bc) - 0.075, 9.0)); }
    else { float a = atan(c.z, c.x), k = floor(a / 0.16 + 0.5) * 0.16; vec3 bc = vec3(cos(k) * 1.05, -0.55 - 0.55 * max(0.0, sin(k)), sin(k) * 1.0); r = opU(r, vec2(sdTorus((c - bc).xzy, 0.06, 0.022), 9.0)); }
  }
  if (uCollar < 0.5 || uCollar > 3.5) { vec3 c = rotY(p - vec3(0.0, -1.4, -0.25), -uYaw * 0.4); r = opU(r, vec2(sdTorus(c * vec3(1.0, 1.0, 1.1), 0.62, 0.2), uKind > 2.5 && uKind < 3.5 ? 8.0 : 6.0)); }
  if (uKind > 2.5 && uKind < 3.5) r = opU(r, vec2(sdCCone(rotY(p - vec3(0.0, -1.35, -0.25), -uYaw * 0.4), 0.26, 0.75, 0.5) - 0.03, 8.0));
  return r;
}
vec3 nrm(vec3 p) { vec3 n = vec3(0.0); for (int i = uZero; i < 4; i++) { vec3 e = 0.5773 * (2.0 * vec3(float(((i + 3) >> 1) & 1), float((i >> 1) & 1), float(i & 1)) - 1.0); n += e * mapP(p + 0.0012 * e).x; } return normalize(n); }
float shadow(vec3 ro, vec3 rd) { float res = 1.0, t = 0.03; for (int i = uZero; i < 28; i++) { float h = mapP(ro + rd * t).x; res = min(res, 4.5 * h / t); t += clamp(h, 0.02, 0.25); if (res < 0.003 || t > 6.0) break; } return clamp(res, 0.0, 1.0); }
float occl(vec3 p, vec3 n) { float o = 0.0, s = 1.0; for (int i = uZero + 1; i <= 5; i++) { float h = 0.04 * float(i); o += (h - mapP(p + n * h).x) * s; s *= 0.7; } return clamp(1.0 - 2.2 * o, 0.0, 1.0); }
void main() {
  vec2 uv = (gl_FragCoord.xy - uOrigin) / uSize;
  vec3 ro = vec3(0.0, -0.7, 14.0), ta = vec3(0.0, -0.8, 0.0);
  vec3 ww = normalize(ta - ro), uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0))), vv = cross(uu, ww);
  vec2 sc = (uv - 0.5) * vec2(0.8, 1.0) * 2.0 * 0.19;
  vec3 rd = normalize(ww + uu * sc.x + vv * sc.y);
  // background: a dark ground lit toward the head, with a curtain or a column for some
  vec3 bg = mix(uBg2, uBg, smoothstep(1.0, 0.0, length((uv - vec2(0.38 - uYaw * 0.3, 0.68)) * vec2(1.0, 0.8))));
  bg *= 0.8 + 0.3 * fbm(vec3(uv * 5.0, uSeed));
  if (h11(3.0) < 0.35) { float cx = h11(4.0) < 0.5 ? uv.x : 1.0 - uv.x; float cu = smoothstep(0.32, 0.18, cx); vec3 cc = uRobe2 * (0.55 + 0.45 * sin(cx * 60.0 + sin(uv.y * 6.0) * 2.0)); bg = mix(bg, cc * 0.8, cu); }
  vec3 col = bg;
  float t = 8.0, hit = -1.0;
  for (int i = uZero; i < 160; i++) { vec2 m = mapP(ro + rd * t); if (m.x < 0.0005 * t) { hit = m.y; break; } t += m.x * 0.7; if (t > 22.0) break; }
  if (hit > 0.0) {
    vec3 p = ro + rd * t, n = nrm(p), h = toHead(p);
    vec3 L = normalize(vec3(-0.62, 0.66, 0.42)), V = -rd, H = normalize(L + V);
    float sh = shadow(p + n * 0.01, L), ao = occl(p, n);
    float ndl = dot(n, L);
    vec3 alb = vec3(0.5); float rough = 0.6, spec = 0.04, metal = 0.0;
    if (hit < 1.5 || hit > 9.5) {
      alb = uSkin;
      float red = smoothstep(0.4, 0.0, length((h - vec3(sign(h.x) * 0.4, -0.2, 0.6)) * vec3(1.0, 1.4, 1.0))) * 0.1 + smoothstep(0.2, 0.0, length(h - vec3(0.0, -0.33, 0.96))) * 0.15;
      alb = mix(alb, alb * vec3(1.15, 0.72, 0.65), red);
      alb *= 0.92 + 0.12 * vn(h * 18.0);
      alb = mix(alb, alb * vec3(0.8, 0.68, 0.62), smoothstep(-0.7, -1.0, h.y) * 0.4);   // a stubble shadow / jaw
      if (hit > 9.5) alb = mix(alb, vec3(0.36, 0.16, 0.13), 0.35);
      rough = 0.42; spec = 0.05;
      spec *= 1.0 + 1.5 * smoothstep(0.2, 0.0, length(h - vec3(0.0, -0.3, 0.97))) + smoothstep(0.2, 0.0, abs(h.y - 0.45)) * smoothstep(0.4, 0.7, h.z);
    } else if (hit < 2.5) {
      vec3 ec = vec3(sign(h.x) * 0.27, 0.12, 0.62), dir = normalize(h - ec), gaze = normalize(vec3(-sin(uYaw), -0.03, cos(uYaw)));
      float c = dot(dir, gaze);
      alb = vec3(0.62, 0.57, 0.5);
      alb = mix(alb, uEyeC, smoothstep(0.88, 0.9, c));
      alb = mix(alb, vec3(0.01), smoothstep(0.965, 0.972, c));
      rough = 0.08; spec = 0.4;
    } else if (hit < 3.5 || (hit > 3.5 && hit < 4.5)) {
      float az2 = atan(h.x, h.z);
      alb = uHairC * (0.55 + 0.6 * vn(vec3(az2 * 40.0, h.y * 3.0, uSeed)) * (0.7 + 0.3 * vn(vec3(az2 * 9.0, h.y, 2.0)))); rough = 0.45; spec = 0.05;
    } else if (hit < 5.5) {
      alb = uKind < 0.5 ? uRobe * 0.8 : vec3(0.025, 0.022, 0.02); rough = 0.75;
    } else if (hit < 6.5) {
      alb = uRobe * (0.7 + 0.5 * vn(p * 6.0)); rough = 0.85;
    } else if (hit < 7.5) {
      alb = vec3(0.78, 0.75, 0.66); rough = 0.7;
    } else if (hit < 8.5) {
      alb = vec3(0.5, 0.5, 0.52); rough = 0.25; metal = 1.0;
    } else {
      alb = vec3(0.9, 0.7, 0.35); rough = 0.25; metal = 1.0;
      if (uCollar > 2.5 && uCollar < 3.5) { alb = vec3(0.8, 0.78, 0.72); metal = 0.0; rough = 0.15; spec = 0.3; }
    }
    float wrap = (hit < 1.5 || hit > 9.5) ? 0.3 : 0.12;
    float dif = clamp((ndl + wrap) / (1.0 + wrap), 0.0, 1.0) * mix(0.15, 1.0, sh);
    vec3 key = vec3(1.0, 0.84, 0.64) * 1.05;
    vec3 c = alb * (1.0 - metal) * dif * key;
    if (hit < 1.5 || hit > 9.5) c += alb * vec3(0.5, 0.12, 0.06) * smoothstep(-0.25, 0.1, ndl) * (1.0 - smoothstep(0.1, 0.45, ndl)) * 1.4;   // scattering at the terminator
    c += alb * (1.0 - metal) * vec3(0.32, 0.36, 0.44) * (0.5 + 0.5 * n.y) * 0.3 * ao;                                                          // sky fill
    c += alb * (1.0 - metal) * vec3(0.35, 0.28, 0.22) * clamp(dot(n, normalize(vec3(0.8, -0.1, 0.5))), 0.0, 1.0) * 0.12 * ao;               // bounce
    float sp = pow(max(dot(n, H), 0.0), 2.0 / max(0.002, rough * rough * rough * 1.8) ) * (1.0 / (rough * rough * 6.0 + 0.2));
    vec3 F0 = mix(vec3(spec), alb, metal);
    c += F0 * sp * key * sh * 0.25;
    if (metal > 0.5) c += alb * (0.2 + 0.8 * smoothstep(-0.2, 0.8, reflect(rd, n).y)) * 0.35 * ao;
    c += vec3(0.28, 0.3, 0.34) * pow(1.0 - max(dot(n, V), 0.0), 4.0) * 0.25 * ao * (1.0 - metal * 0.5);   // a faint rim
    c *= mix(0.55, 1.0, ao);
    col = mix(c, bg, smoothstep(14.0, 16.0, t));
  }
  gl_FragColor = vec4(col, 1.0);
}`;
// the paint pass: a Kuwahara filter inside the cell, canvas weave, brush streaks, varnish, craquelure, vignette.
// Writes gamma-encoded colour (the portrait material decodes it).
const PAINT_GLSL = /* glsl */ `
precision highp float;
uniform sampler2D uSrc, uLand; uniform vec2 uOrigin, uSize, uAtlas; uniform float uIsLand, uSeed;
float h21(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn2(vec2 x) { vec2 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1,0)), f.x), mix(h21(i + vec2(0,1)), h21(i + vec2(1,1)), f.x), f.y); }
vec3 src(vec2 px) { px = clamp(px, uOrigin + 0.5, uOrigin + uSize - 0.5); return texture2D(uSrc, px / uAtlas).rgb; }
void main() {
  vec2 px = gl_FragCoord.xy, uv = (px - uOrigin) / uSize;
  vec3 c;
  if (uIsLand > 0.5) c = pow(texture2D(uLand, px / uAtlas).rgb, vec3(1.0));
  else {
    // Kuwahara: the quadrant with the least variance wins, so flat areas become strokes and edges stay sharp
    const int R = 2; vec3 m[4]; vec3 s[4];
    for (int k = 0; k < 4; k++) { m[k] = vec3(0.0); s[k] = vec3(0.0); }
    for (int j = -R; j <= R; j++) for (int i = -R; i <= R; i++) {
      vec3 v = src(px + vec2(float(i), float(j)));
      if (i <= 0 && j <= 0) { m[0] += v; s[0] += v * v; }
      if (i >= 0 && j <= 0) { m[1] += v; s[1] += v * v; }
      if (i <= 0 && j >= 0) { m[2] += v; s[2] += v * v; }
      if (i >= 0 && j >= 0) { m[3] += v; s[3] += v * v; }
    }
    float n = float((R + 1) * (R + 1)), best = 1e9;
    for (int k = 0; k < 4; k++) { vec3 mu = m[k] / n, va = abs(s[k] / n - mu * mu); float sv = va.r + va.g + va.b; if (sv < best) { best = sv; c = mu; } }
    vec3 sm = (src(px) * 4.0 + src(px + vec2(1.0, 0.0)) + src(px - vec2(1.0, 0.0)) + src(px + vec2(0.0, 1.0)) + src(px - vec2(0.0, 1.0))) / 8.0;
    c = mix(sm, c, 0.5);
    // brush streaks following a slow flow field, and the weave of the canvas
    float a = vn2(uv * 3.0 + uSeed) * 6.28;
    vec2 d = vec2(cos(a), sin(a));
    float st = vn2(vec2(dot(px, d) * 0.06, dot(px, vec2(-d.y, d.x)) * 0.9) + uSeed * 7.0);
    c *= 0.94 + 0.12 * st;
    c *= 0.97 + 0.03 * sin(px.x * 2.1) * sin(px.y * 2.1);
    // varnish: warm, a little desaturated, lifted blacks
    float l = dot(c, vec3(0.3, 0.55, 0.15));
    c = mix(vec3(l), c, 0.86) * vec3(1.02, 0.93, 0.74) + vec3(0.006, 0.004, 0.002);
  }
  // craquelure: thin dark lines on cell edges of a jittered grid
  vec2 g = uv * vec2(15.0, 18.0); vec2 gi = floor(g); float e = 1.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 o = vec2(float(i), float(j)); vec2 r = o + vec2(h21(gi + o + uSeed), h21(gi + o + 3.1 + uSeed)) - fract(g); e = min(e, dot(r, r)); }
  float f1 = 1e9, f2 = 1e9;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 o = vec2(float(i), float(j)); vec2 r = o + vec2(h21(gi + o + uSeed), h21(gi + o + 3.1 + uSeed)) - fract(g); float dd = length(r); if (dd < f1) { f2 = f1; f1 = dd; } else if (dd < f2) f2 = dd; }
  c *= 1.0 - 0.28 * (1.0 - smoothstep(0.0, 0.04, f2 - f1)) * smoothstep(0.02, 0.2, dot(c, vec3(0.33)));
  c *= mix(0.55, 1.0, smoothstep(0.75, 0.25, length((uv - 0.5) * vec2(1.0, 0.85))));
  if (uIsLand < 0.5) { c = max(c, 0.0); c = (c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14); }
  gl_FragColor = vec4(pow(max(c, 0.0), vec3(1.0 / 2.2)), 1.0);
}`;
// the sitter for each cell: kind, turn, age, colouring, beard, hat, collar
function portraitParams(seed) {
  const r = rng('sitter' + seed), pick = (a) => a[Math.floor(r() * a.length)];
  const kind = [0, 1, 2, 0, 3, 1, 4][seed % 7];   // 0 wizard, 1 gentleman, 2 lady, 3 knight, 4 scholar
  const fem = kind === 2 ? 1 : 0;
  const age = kind === 0 ? 0.6 + r() * 0.4 : kind === 2 ? r() * 0.4 : r() * 0.9;
  const grey = age > 0.65 && r() < 0.8;
  const hairs = [[0.03, 0.02, 0.015], [0.09, 0.05, 0.025], [0.2, 0.09, 0.03], [0.16, 0.12, 0.07], [0.05, 0.035, 0.02]];
  const hairC = grey ? (r() < 0.5 ? [0.62, 0.6, 0.56] : [0.42, 0.4, 0.37]) : pick(hairs);
  const skins = [[0.5, 0.27, 0.15], [0.56, 0.31, 0.18], [0.45, 0.23, 0.12], [0.53, 0.29, 0.17]];   // linear; old varnished skin reads ochre
  const robes = [[0.18, 0.02, 0.02], [0.02, 0.06, 0.03], [0.03, 0.04, 0.12], [0.02, 0.018, 0.015], [0.1, 0.06, 0.02], [0.08, 0.02, 0.08]];
  const bgs = [[[0.09, 0.07, 0.04], [0.012, 0.009, 0.006]], [[0.06, 0.06, 0.045], [0.01, 0.01, 0.008]], [[0.1, 0.04, 0.025], [0.014, 0.006, 0.004]]];
  const [bg, bg2] = pick(bgs);
  return {
    uKind: kind, uFem: fem, uAge: age, uYaw: (r() < 0.5 ? -1 : 1) * (0.22 + r() * 0.3), uPitch: (r() - 0.5) * 0.12,
    uBeard: fem ? 0 : kind === 0 ? 1.0 + r() * 1.2 : kind === 4 ? 0 : r() < 0.6 ? 0.15 + r() * 0.6 : 0,
    uHat: kind === 0 ? (r() < 0.75 ? 1 : 4) : kind === 1 ? pick([0, 2, 3, 3]) : kind === 4 ? pick([3, 4]) : 0,
    uCollar: kind === 2 ? pick([1, 3, 3]) : kind === 1 ? pick([1, 1, 2, 4]) : kind === 4 ? 2 : kind === 0 ? pick([0, 4]) : 0,
    uBald: kind === 1 || kind === 4 ? age * r() : 0, uHairLen: fem ? 0 : kind === 0 ? 0.8 : r() < 0.3 ? 0.4 : 0,
    uSeed: seed * 1.37 + 0.5, uSkin: fem ? [0.62, 0.38, 0.25] : pick(skins), uHairC: hairC, uRobe: pick(robes).map((v) => v * 0.42), uRobe2: pick(robes).map((v) => v * 1.6),
    uBg: bg, uBg2: bg2, uEyeC: pick([[0.12, 0.07, 0.03], [0.18, 0.24, 0.3], [0.2, 0.18, 0.1]]),
  };
}
let PORTRAIT_GL_TEX = null, PORTRAIT_MATS = null;
function portraitMats() {
  if (PORTRAIT_MATS) return PORTRAIT_MATS;
  const { cols, rows, cw, ch } = PGL, W = cols * cw, H = rows * ch;
  const vert = 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const U = { uOrigin: { value: new THREE.Vector2() }, uSize: { value: new THREE.Vector2(cw, ch) }, uZero: { value: 0 } };
  for (const k of ['uKind', 'uYaw', 'uPitch', 'uAge', 'uBeard', 'uHat', 'uCollar', 'uSeed', 'uFem', 'uBald', 'uHairLen']) U[k] = { value: 0 };
  for (const k of ['uSkin', 'uHairC', 'uRobe', 'uRobe2', 'uBg', 'uBg2', 'uEyeC']) U[k] = { value: new THREE.Vector3() };
  const bust = new THREE.ShaderMaterial({ uniforms: U, vertexShader: vert, fragmentShader: PORTRAIT_GLSL, depthTest: false, depthWrite: false });
  const P = { uSrc: { value: null }, uLand: { value: null }, uOrigin: { value: new THREE.Vector2() }, uSize: { value: new THREE.Vector2(cw, ch) }, uAtlas: { value: new THREE.Vector2(W, H) }, uIsLand: { value: 0 }, uSeed: { value: 0 } };
  const paint = new THREE.ShaderMaterial({ uniforms: P, vertexShader: vert, fragmentShader: PAINT_GLSL, depthTest: false, depthWrite: false });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bust), qs = new THREE.Scene(), cam = new THREE.Camera();
  quad.frustumCulled = false; qs.add(quad);
  return (PORTRAIT_MATS = { U, P, bust, paint, quad, qs, cam });
}
// start compiling the portrait shaders in the background (KHR_parallel_shader_compile), long before they are needed
function portraitWarm() {
  const { bust, paint, quad, qs, cam } = portraitMats();
  if (!renderer.compileAsync) return;
  quad.material = bust;
  renderer.compileAsync(qs, cam).then(() => { quad.material = paint; return renderer.compileAsync(qs, cam); }).catch(() => {});
}
function portraitAtlasGL() {
  if (PORTRAIT_GL_TEX) return PORTRAIT_GL_TEX;
  const { cols, rows, cw, ch } = PGL, W = cols * cw, H = rows * ch;
  const { U, P, bust, paint, quad, qs, cam } = portraitMats();
  const rtA = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, depthBuffer: false });
  const rtB = new THREE.WebGLRenderTarget(W, H, { depthBuffer: false, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter });
  P.uSrc.value = rtA.texture; P.uLand.value = portraitAtlas();
  const prevRT = renderer.getRenderTarget(), prevAuto = renderer.autoClear;
  const t0 = performance.now();
  renderer.autoClear = false;
  const draw = (rt, mat, i, j) => {
    const x = i * cw, y = (rows - 1 - j) * ch;
    rt.viewport.set(x, y, cw, ch); rt.scissor.set(x, y, cw, ch); rt.scissorTest = true;
    quad.material = mat; renderer.setRenderTarget(rt); renderer.render(qs, cam);
  };
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const seed = j * cols + i; if (seed % 6 === 5) continue;
    const pr = portraitParams(seed);
    for (const [k, v] of Object.entries(pr)) { if (Array.isArray(v)) U[k].value.set(...v); else U[k].value = v; }
    U.uOrigin.value.set(i * cw, (rows - 1 - j) * ch);
    draw(rtA, bust, i, j);
    if (HEADLESS && seed < 2) { gl.finish(); console.log('[portraits] cell', seed, Math.round(performance.now() - t0), 'ms'); }
  }
  gl.finish(); if (HEADLESS) console.log('[portraits] busts', Math.round(performance.now() - t0), 'ms');
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const seed = j * cols + i;
    P.uOrigin.value.set(i * cw, (rows - 1 - j) * ch); P.uIsLand.value = seed % 6 === 5 ? 1 : 0; P.uSeed.value = seed * 0.73;
    draw(rtB, paint, i, j);
  }
  rtB.scissorTest = false; rtB.viewport.set(0, 0, W, H);
  renderer.setRenderTarget(prevRT); renderer.autoClear = prevAuto;
  rtA.dispose();
  gl.finish(); if (HEADLESS) console.log('[portraits]', Math.round(performance.now() - t0), 'ms');
  return (PORTRAIT_GL_TEX = rtB.texture);
}
