// ------------------------------------------------------------------ interiors: built as separate sets, the way they were filmed
// Each interior is its own THREE.Scene with its own lights; the camera menu and the map switch between the grounds and
// a set. Materials here are the warm sandstone, flagstones, oak panelling, candles and fire of the film sets.
const INT = {};
let ACTIVE = null;   // null = the grounds; otherwise a key of INT
const INTSKY = { uNightC: { value: 0 }, uSeedC: { value: 0 }, uCeil: { value: -1 },   // uCeil < 0: follow uNight
  uClear: { value: new THREE.Vector4(0, 1, 0, 10) } };   // the magic short: night cloud parts round a direction out to an angle (rad)
M.sandstone = procMat({ name: 'sandstone', rgb: [0.52, 0.41, 0.28], rough: 0.85, bump: 1, uv: true, frag: /* glsl */ `
  vec2 uv = abs(N.y) > 0.75 ? P.xz : UV;
  vec2 bs = vec2(0.9, 0.42);
  float row = floor(uv.y / bs.y); uv.x += cgH21(vec2(row, 3.7)) * bs.x;
  vec2 f = fract(uv / bs) * bs; float e = min(min(f.x, bs.x - f.x), min(f.y, bs.y - f.y));
  float px = length(fwidth(uv));
  float groove = smoothstep(0.0, max(0.008, px), e); groove = mix(groove, 0.92, smoothstep(0.02, 0.1, px));
  float id = cgH21(floor(uv / bs) + 17.0 * row);
  float n1 = cgFbm(P * 0.4), n2 = cgVn(P * 7.0);
  vec3 c = vec3(0.8 + 0.3 * id) * mix(vec3(1.0), vec3(1.06, 0.96, 0.84), fract(id * 7.3)) * (0.86 + 0.26 * n1);
  c *= mix(0.74, 1.0, groove);
  c *= mix(1.0, 0.8, smoothstep(0.6, 0.9, cgFbm3(vec3(P.x * 0.4, P.y * 0.08, P.z * 0.4))));
  // centuries of candle and torch smoke: the stone darkens and browns upward, in drifts
  float soot = smoothstep(5.0, 16.0, P.y + 2.5 * cgFbm3(P * vec3(0.3, 0.15, 0.3)));
  c *= mix(vec3(1.0), vec3(0.58, 0.52, 0.46), soot);
  diffuseColor.rgb *= c; cgH = min(e, 0.02) * 0.4 + n2 * 0.002; cgAO = mix(0.75, 1.0, groove); cgRough = 0.85;
` });
M.itrim = procMat({ name: 'itrim', rgb: [0.52, 0.45, 0.34], rough: 0.7, bump: 1, frag: /* glsl */ `
  float n = cgFbm3(P * 0.8); diffuseColor.rgb *= 0.88 + 0.22 * n; cgH = cgVn(P * 12.0) * 0.002;
` });
M.flag = procMat({ name: 'flag', rgb: [1, 1, 1], rough: 0.6, bump: 1, frag: /* glsl */ `
  vec2 q = P.xz;
  float rh = 1.25; float row = floor(q.y / rh);
  float w = 1.3 + 0.9 * cgH21(vec2(row, 7.0));
  float u = q.x + cgH21(vec2(row, 1.0)) * 3.0;
  float cell = floor(u / w);
  vec2 f = vec2(fract(u / w) * w, fract(q.y / rh) * rh);
  float e = min(min(f.x, w - f.x), min(f.y, rh - f.y));
  float id = cgH21(vec2(cell, row));
  float groove = smoothstep(0.0, 0.025, e);
  vec3 c = mix(vec3(0.13, 0.115, 0.095), vec3(0.26, 0.22, 0.17), id) * (0.85 + 0.3 * cgFbm3(P * 0.9));
  c *= mix(0.4, 1.0, groove);
  diffuseColor.rgb *= c;
  cgH = min(e, 0.03) * 0.5 + cgVn(P * 6.0) * 0.003;
  cgRough = mix(0.35, 0.7, cgFbm3(P * 0.5 + 3.0)); cgSpec = 0.9;
` });
M.panel = procMat({ name: 'panel', rgb: [0.06, 0.035, 0.02], rough: 0.5, bump: 1, uv: true, frag: /* glsl */ `
  vec2 cellSize = vec2(1.1, 1.6);
  vec2 f = fract(UV / cellSize) * cellSize;
  float e = min(min(f.x, cellSize.x - f.x), min(f.y, cellSize.y - f.y));
  float frame = 1.0 - smoothstep(0.1, 0.13, e);
  float g = cgVn(vec3(UV.x * 3.0, UV.y * 40.0, 2.0));
  diffuseColor.rgb *= (0.8 + 0.35 * g) * mix(1.0, 1.25, frame);
  cgH = frame * 0.02 - smoothstep(0.13, 0.2, e) * 0.01;
` });
M.oak = procMat({ name: 'oak', rgb: [0.07, 0.042, 0.024], rough: 0.42, bump: 1, uv: true, frag: /* glsl */ `
  float g = cgVn(vec3(UV.x * 0.6, UV.y * 18.0, 1.0)) * 0.6 + cgVn(vec3(UV.x * 4.0, UV.y * 60.0, 3.0)) * 0.4;
  diffuseColor.rgb *= 0.75 + 0.45 * g; cgH = g * 0.002;
` });
// the floating candles (those above 3.5 m) rise and fall a little (BOB), body and flame together; the offset is divided
// by the instance's y scale, which stretches it again
const CANDLE_BOB = { uniforms: BOB, vhead: 'uniform float uTime; uniform float uBob;\n',
  vbegin: `#ifdef USE_INSTANCING\n{ vec3 io = instanceMatrix[3].xyz; transformed.y += step(3.5, io.y) * ${BOB_GLSL('io')} / max(length(instanceMatrix[1].xyz), 1e-3); }\n#endif\n` };
M.wax = procMat({ name: 'wax', rgb: [0.55, 0.47, 0.34], rough: 0.5, inst: true, ...CANDLE_BOB, frag: /* glsl */ `
  float hy = P.y - vInst.y;   // height up the candle (the body is 0.32 m tall before its instance scale)
  diffuseColor.rgb *= 0.9 + 0.15 * cgVn(P * 80.0);
  cgEmit = vec3(1.0, 0.6, 0.25) * smoothstep(0.15, 0.6, hy) * 0.45 * uLamp;
` });
M.flame = procMat({ name: 'flame', rgb: [0, 0, 0], rough: 1, ...CANDLE_BOB, frag: /* glsl */ `
  cgEmit = vec3(1.0, 0.45, 0.12) * 9.0;
` });
const FIRES = [];
function fireTongue(x, y, z, w, h) { FIRES.push([x, y, z, w, h]); }
const FIRE_MAT = new THREE.ShaderMaterial({
  uniforms: { uTime: ATMO.uTime, ...SPELLU }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  vertexShader: /* glsl */ `attribute vec4 aC; attribute vec2 aS; varying vec2 vUv; varying float vSeed; varying float vSp;
    ${SPELL_GLSL}
    void main(){
      vUv = uv; vSeed = aC.w;
      vec3 sp = cgSpell(aC.xyz); vSp = sp.x * (1.0 + 1.5 * sp.y);   // the spell kindles it: low, then a leap, then settling
      vec3 toC = cameraPosition - aC.xyz; vec3 r = normalize(vec3(toC.z, 0.0, -toC.x) + 1e-5);
      vec3 p = aC.xyz + r * (uv.x - 0.5) * aS.x + vec3(0.0, uv.y * aS.y * (0.3 + 0.7 * sp.x) * (1.0 + 0.7 * sp.y), 0.0);
      gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
    }`,
  fragmentShader: /* glsl */ `${NOISE} uniform float uTime; varying vec2 vUv; varying float vSeed; varying float vSp;
    void main(){
      float y = vUv.y, t = uTime * (1.0 + 0.3 * vSeed) + vSeed * 17.0;
      vec2 q = vec2(vUv.x - 0.5, y);
      // the body sways and is torn by turbulence rising through it
      q.x += 0.12 * (cgVn(vec3(y * 2.5 - t * 1.7, vSeed * 9.0, 0.0)) - 0.5) * y * 2.0;
      float turb = cgFbm2(vec2(q.x * 5.0, y * 3.2 - t * 2.6) + vSeed * 3.0);
      float width = 0.42 * pow(max(1.0 - y, 0.0), 0.75) * smoothstep(0.0, 0.12, y + 0.02);
      float d = abs(q.x) / max(width, 1e-3);
      float body = 1.0 - smoothstep(0.55, 1.0, d + (turb - 0.5) * 1.1 + y * 0.35);
      float tip = 1.0 - smoothstep(0.45, 1.0, y + (turb - 0.5) * 0.6);
      float a = clamp(body * tip, 0.0, 1.0);
      float heat = clamp((1.0 - y * 1.25) * (1.0 - d * 0.7) + (turb - 0.5) * 0.4, 0.0, 1.0);
      vec3 c = mix(vec3(0.5, 0.06, 0.01), vec3(1.0, 0.42, 0.08), smoothstep(0.1, 0.5, heat));
      c = mix(c, vec3(1.0, 0.82, 0.48), smoothstep(0.55, 0.9, heat));
      gl_FragColor = vec4(c * a * (1.0 + 4.0 * heat * heat) * 1.3 * vSp, 1.0);
    }`,
});
function flushFires() {
  if (!FIRES.length) return;
  const n = FIRES.length, geo = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(1, 1).translate(0.5, 0.5, 0));
  const aC = new Float32Array(n * 4), aS = new Float32Array(n * 2);
  FIRES.forEach(([x, y, z, w, h], i) => { aC.set([x, y, z, (i * 0.618) % 1], i * 4); aS.set([w, h], i * 2); });
  geo.setAttribute('aC', new THREE.InstancedBufferAttribute(aC, 4)); geo.setAttribute('aS', new THREE.InstancedBufferAttribute(aS, 2));
  geo.instanceCount = n;
  const m = new THREE.Mesh(geo, FIRE_MAT); m.frustumCulled = false; m.renderOrder = 5; (TARGET || scene).add(m);
  FIRES.length = 0;
}
M.ember = procMat({ name: 'ember', rgb: [0.05, 0.035, 0.025], rough: 0.9, bump: 1, uv: true, frag: /* glsl */ `
  float cr = cgVn(vec3(UV.x * 3.0, UV.y * 14.0, 1.0)), n = cgFbm3(P * 6.0 + vec3(0.0, -uTime * 0.3, 0.0));
  float glow = smoothstep(0.55, 0.8, cr * 0.6 + n * 0.5) * smoothstep(-0.2, 0.6, N.y + 0.3);
  diffuseColor.rgb *= 0.6 + 0.6 * cr; cgH = cr * 0.01;
  cgEmit = mix(vec3(0.8, 0.12, 0.01), vec3(1.0, 0.45, 0.08), n) * glow * 3.0;
` });
M.fire = new THREE.ShaderMaterial({
  uniforms: { uTime: ATMO.uTime, ...SPELLU }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  vertexShader: /* glsl */ `uniform float uTime; varying vec3 vN; varying vec3 vV; varying float vY; varying vec3 vW;
    void main(){ vec3 p = position; vY = uv.y;
      p.x += sin(p.y * 13.0 + uTime * 9.0 + p.z * 7.0) * 0.025 * vY; p.z += cos(p.y * 11.0 + uTime * 7.0 + p.x * 9.0) * 0.025 * vY;
      vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vV = cameraPosition - w.xyz;
      gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: /* glsl */ `${NOISE} ${SPELL_GLSL} uniform float uTime; varying vec3 vN; varying vec3 vV; varying float vY; varying vec3 vW;
    void main(){ float f = abs(dot(normalize(vN), normalize(vV))); vec3 sp = cgSpell(vW);
      float n = cgVn(vW * 9.0 + vec3(0.0, -uTime * 4.0, 0.0));
      vec3 c = mix(vec3(1.0, 0.82, 0.45) * 5.0, vec3(1.0, 0.3, 0.05) * 2.2, smoothstep(0.1, 0.8, vY + 0.3 * n));
      float a = pow(f, 1.6) * (1.0 - smoothstep(0.55, 1.0, vY + 0.25 * n)) * (0.6 + 0.6 * n);
      gl_FragColor = vec4(c * a * sp.x * (1.0 + 2.0 * sp.y), 1.0); }`,
});
// window glass seen from inside: daylight through leaded diamond panes, a dim blue night
M.iglass = procMat({ name: 'iglass', rgb: [1, 1, 1], rough: 0.1, uv: true, spell: false, frag: /* glsl */ `
  vec2 q = UV;
  vec2 dq = vec2(q.x + q.y * 0.6, q.x - q.y * 0.6) * 9.0;
  vec2 fd = abs(fract(dq) - 0.5);
  float px = length(fwidth(dq)) * 0.7 + 0.01;
  float lead = smoothstep(0.5 - px - 0.02, 0.5 - px, max(fd.x, fd.y));
  float bars = 1.0 - smoothstep(0.012, 0.022, abs(fract(q.y / 1.2) - 0.5) - 0.48);   // saddle bars
  lead = max(lead, bars * 0.9);
  float edge = smoothstep(0.5, 0.42, abs(q.x)) * smoothstep(0.0, 0.08, q.y);
  vec3 sky = mix(vec3(0.78, 0.84, 0.86), vec3(1.0, 0.97, 0.9), cgVn(vec3(q * 2.0, 1.0)));
  vec3 day = sky * (0.75 + 0.5 * cgVn(vec3(q * 5.0, 3.0)));
  vec3 night = vec3(0.02, 0.035, 0.07);
  diffuseColor.rgb = vec3(0.02);
  cgEmit = mix(day * 3.2, night, uNight) * (1.0 - lead) * edge;
  cgSpec = 0.2;
` });
// portraits: instance colour r = hue seed, g = kind (0 portrait, 1 landscape), b = brightness
M.canvas = procMat({ name: 'canvas', rgb: [1, 1, 1], rough: 0.4, inst: true, uv: true, frag: /* glsl */ `
  vec2 q = UV; float s = vInstC.r;
  float vig = smoothstep(0.75, 0.2, length(q - 0.5));
  vec3 bg = mix(vec3(0.03, 0.022, 0.012), vec3(0.1, 0.075, 0.04), q.y) * (0.6 + 0.7 * vInstC.b) * (0.5 + 0.5 * vig);
  vec3 robe = 0.5 + 0.5 * cos(6.2831 * (s + vec3(0.0, 0.33, 0.67)));
  robe = mix(vec3(0.03, 0.02, 0.012), robe * vec3(0.16, 0.12, 0.08), 0.6);   // dark, varnished cloth
  vec3 c = bg;
  if (vInstC.g < 0.5) {
    float head = length((q - vec2(0.5 + (s - 0.5) * 0.1, 0.66)) / vec2(0.12, 0.155));
    float body = step(q.y, 0.56) * step(abs(q.x - 0.5), 0.22 + (0.56 - q.y) * 0.5);
    c = mix(c, robe, body);
    c = mix(c, vec3(0.42, 0.28, 0.17) * (0.8 + 0.4 * q.y), 1.0 - smoothstep(0.92, 1.0, head));
    c = mix(c, vec3(0.5, 0.45, 0.35), (1.0 - smoothstep(0.02, 0.05, abs(q.y - 0.52))) * step(abs(q.x - 0.5), 0.12) * 0.6);   // a ruff
  } else {
    float hor = 0.45 + 0.08 * sin(q.x * 9.0 + s * 20.0);
    c = mix(mix(vec3(0.2, 0.25, 0.25), vec3(0.4, 0.38, 0.3), q.y), mix(vec3(0.08, 0.1, 0.05), vec3(0.15, 0.12, 0.06), q.y * 2.0), step(q.y, hor));
  }
  c *= 0.78 + 0.3 * cgVn(vec3(q * 30.0, s * 50.0));
  c *= vec3(1.05, 0.98, 0.82);   // old varnish
  diffuseColor.rgb = c * 0.95; cgRough = 0.3;
` });
// the enchanted ceiling: the sky over the hall (clouds by day, stars by night)
const ceilMat = new THREE.ShaderMaterial({
  uniforms: { ...ATMO, ...INTSKY },
  vertexShader: /* glsl */ `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: /* glsl */ `${NOISE}
    uniform float uNight; uniform float uTime; uniform float uCeil; varying vec3 vW;
    void main(){
      vec2 p = vW.xz * 0.02;
      float n = cgFbm2(p + vec2(uTime * 0.01, 0.0)), m = cgFbm2(p * 2.7 + 3.0);
      vec3 day = mix(vec3(0.2, 0.25, 0.33), vec3(0.55, 0.56, 0.58), smoothstep(0.35, 0.75, n)) * (0.75 + 0.35 * m);
      vec3 cell = floor(vW * 1.6); float h = cgH31(cell);
      float star = step(0.985, h) * smoothstep(0.35, 0.0, length(fract(vW * 1.6) - 0.5)) * 4.0;
      vec3 night = mix(vec3(0.004, 0.007, 0.018), vec3(0.03, 0.04, 0.07), smoothstep(0.4, 0.8, n)) + vec3(0.9, 0.92, 1.0) * star * (1.0 - smoothstep(0.5, 0.8, n));
      float nn = uCeil < 0.0 ? uNight : uCeil;
      vec3 dawn = mix(vec3(0.62, 0.42, 0.32), vec3(0.75, 0.66, 0.6), smoothstep(0.3, 0.8, n)) * (0.8 + 0.3 * m);   // a pink-gold morning between
      float c1 = cgFbm2(vW.xz * 0.11 + vec2(uTime * 0.03, 0.0)), c2 = cgFbm2(vW.xz * 0.37 + 5.0);
      vec3 morn = mix(vec3(0.14, 0.34, 0.86), vec3(1.05, 0.98, 0.9), smoothstep(0.42, 0.68, c1 * 0.75 + c2 * 0.25)) * 1.5;   // the tour's clear morning
      vec3 lo = uCeil < 0.0 ? day * 1.3 : morn;
      vec3 sky = nn > 0.5 ? mix(dawn, night, smoothstep(0.5, 1.0, nn)) : mix(lo, dawn, smoothstep(0.0, 0.5, nn));
      gl_FragColor = vec4(sky, 1.0);
    }`,
});
const hallSkyMat = new THREE.ShaderMaterial({
  uniforms: { ...ATMO, ...INTSKY, uC: { value: new THREE.Vector3(0, 16.5, -20) } }, side: THREE.BackSide, depthWrite: true,
  vertexShader: /* glsl */ `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: /* glsl */ `${NOISE}
    uniform float uNight; uniform float uTime; uniform float uCeil; uniform vec3 uC; uniform vec4 uClear; varying vec3 vW;
    void main(){
      vec3 d = normalize(vW - uC);
      vec2 q = d.xz / (d.y + 0.3) * 1.7;
      float n = cgFbm2(q + vec2(uTime * 0.004, 0.0)), m = cgFbm2(q * 2.3 + 7.0), w = cgFbm2(q * 5.0 - 3.0);
      // the magic short: outside the cleared circle a low, unbroken deck of cloud; a ring of gold where it is parting
      float ang = acos(clamp(dot(d, normalize(uClear.xyz)), -1.0, 1.0)) + 0.06 * (w - 0.5);
      float over = smoothstep(uClear.w - 0.1, uClear.w + 0.03, ang), ring = exp(-pow((ang - uClear.w) / 0.05, 2.0)) * step(uClear.w, 3.2);
      // night: deep blue going lighter toward the horizon, moonlit cloud masses with bright ragged edges, stars between
      float cloud = max(smoothstep(0.42, 0.72, n + 0.15 * (w - 0.5)), over);
      float edge = smoothstep(0.38, 0.5, n + 0.15 * (w - 0.5)) * (1.0 - smoothstep(0.52, 0.7, n)) * (1.0 - over);
      vec3 base = mix(vec3(0.022, 0.04, 0.09), vec3(0.01, 0.02, 0.05), smoothstep(0.0, 0.9, d.y));
      vec3 cl = mix(vec3(0.02, 0.026, 0.04), vec3(0.05, 0.06, 0.09), m);
      vec3 sd = d * 300.0; float h = cgH31(floor(sd));
      float star = step(0.993, h) * smoothstep(0.45, 0.0, length(fract(sd) - 0.5)) * (1.5 + 5.0 * fract(h * 91.7));
      vec3 night = mix(base, cl * (1.0 - 0.45 * over), cloud) + vec3(0.09, 0.1, 0.14) * edge * (0.6 + 0.6 * m) + vec3(0.9, 0.93, 1.0) * star * (1.0 - cloud);
      night += vec3(1.0, 0.72, 0.36) * ring * (0.25 + 0.9 * w * w) * 1.6;
      vec3 day = mix(vec3(0.2, 0.25, 0.33), vec3(0.55, 0.56, 0.58), smoothstep(0.35, 0.75, n)) * (0.75 + 0.35 * m);
      float nn = uCeil < 0.0 ? uNight : uCeil;
      vec3 dawn = mix(vec3(0.62, 0.42, 0.32), vec3(0.75, 0.66, 0.6), smoothstep(0.3, 0.8, n)) * (0.8 + 0.3 * m);
      float c1 = cgFbm2(q * 1.4 + vec2(uTime * 0.03, 0.0)), c2 = cgFbm2(q * 4.0 + 5.0);
      vec3 morn = mix(vec3(0.14, 0.34, 0.86), vec3(1.05, 0.98, 0.9), smoothstep(0.42, 0.68, c1 * 0.75 + c2 * 0.25)) * 1.5;
      vec3 lo = uCeil < 0.0 ? day * 1.3 : morn;
      vec3 sky = nn > 0.5 ? mix(dawn, night, smoothstep(0.5, 1.0, nn)) : mix(lo, dawn, smoothstep(0.0, 0.5, nn));
      gl_FragColor = vec4(sky, 1.0);
    }`,
});
// floating / standing candles: wax body and an emissive flame per instance; r, h: the body's radius and height
function candles(list, r = 0.038, h = 0.32) {
  // wax with a drip lip, a wick and a teardrop flame; instances vary in height via their y scale
  const prof = [[0, 0], [r, 0], [r * 0.95, h * 0.94], [r * 1.1, h * 0.953], [r * 0.8, h], [0, h]].map(([a, b]) => new THREE.Vector2(a, b));
  const body = new THREE.LatheGeometry(prof, 10);
  const fl = []; for (let i = 0; i <= 8; i++) { const t = i / 8; fl.push(new THREE.Vector2(0.024 * Math.sin(Math.PI * Math.pow(t, 0.7)), t * 0.1)); }
  const fy = h + 0.015, flame = new THREE.LatheGeometry(fl, 8).translate(0, fy, 0);
  addInst(body, M.wax, list, null, { cast: false });
  addInst(flame, M.flame, list.map((m) => { const e = m.elements; const s = Math.hypot(e[4], e[5], e[6]); const c = m.clone(); c.scale(new THREE.Vector3(1, 1 / s, 1)); c.elements[13] += fy * (s - 1); return c; }), null, { cast: false, recv: false });
}
// a stone eagle with folded wings standing on a corbel, in a +z-facing frame, about 2.4 m tall
function stoneBird() {
  const body = new THREE.LatheGeometry([[0, 0], [0.32, 0.1], [0.46, 0.5], [0.44, 0.95], [0.34, 1.3], [0.22, 1.5], [0, 1.58]].map(([r, h]) => new THREE.Vector2(r, h)), 16).scale(1, 1, 0.85).rotateX(-0.18).translate(0, 0.25, 0);
  const head = new THREE.SphereGeometry(0.27, 14, 10).scale(1, 0.95, 1.15).translate(0, 1.9, 0.12);
  const beak = new THREE.ConeGeometry(0.1, 0.38, 8).rotateX(Math.PI / 2 + 0.6).translate(0, 1.82, 0.42);
  const brow = new THREE.BoxGeometry(0.42, 0.07, 0.18).translate(0, 1.98, 0.27);
  const wings = [-1, 1].map((s) => {
    const w = new THREE.Shape(); w.moveTo(0, 1.55);
    w.quadraticCurveTo(0.5, 1.4, 0.55, 0.6); for (let k = 0; k < 5; k++) { const y = 0.6 - k * 0.14; w.lineTo(0.5 - k * 0.07, y - 0.05); w.lineTo(0.44 - k * 0.07, y - 0.12); } w.lineTo(0.05, 0.1); w.lineTo(0, 1.55);
    return new THREE.ExtrudeGeometry(w, { depth: 0.1, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 }).rotateY(-s * Math.PI / 2 + s * 0.25).translate(s * 0.38, 0.15, -0.05);
  });
  const tail = new THREE.BoxGeometry(0.34, 0.75, 0.1).rotateX(0.35).translate(0, 0.1, -0.42);
  const talons = [-0.16, 0.16].map((x) => new THREE.BoxGeometry(0.14, 0.2, 0.32).translate(x, 0.1, 0.18));
  const plinth = new THREE.BoxGeometry(1.0, 0.25, 0.9).translate(0, -0.12, 0);
  return merge([body, head, beak, brow, ...wings, tail, ...talons, plinth]);
}
// gilt-framed pictures on a wall: centre, outward normal (nx, nz), width, height, kind
const PICS = [];
function picture(x, y, z, nx, nz, w, h, kind, seed) {
  PICS.push({ m: xf([x + nx * 0.06, y, z + nz * 0.06], Math.atan2(nx, nz), [w, h, 1]), c: [seed, kind, 0.4 + 0.6 * ((seed * 7.3) % 1)] });
}
function flushPictures() {
  if (!PICS.length) return;
  const cv = new THREE.PlaneGeometry(1, 1); const uv = cv.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), uv.getY(i));
  const fr = new THREE.Shape(); fr.moveTo(-0.56, -0.56); fr.lineTo(0.56, -0.56); fr.lineTo(0.56, 0.56); fr.lineTo(-0.56, 0.56); fr.closePath();
  const hole = new THREE.Path(); hole.moveTo(-0.5, -0.5); hole.lineTo(-0.5, 0.5); hole.lineTo(0.5, 0.5); hole.lineTo(0.5, -0.5); hole.closePath(); fr.holes.push(hole);
  const frame = new THREE.ExtrudeGeometry(fr, { depth: 0.08, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1 });
  addInst(cv, M.canvas, PICS.map((p) => p.m), PICS.map((p) => p.c), { cast: false });
  addInst(frame, M.gold, PICS.map((p) => p.m), null, { cast: false });
  PICS.length = 0;
}
// an interior window: glass in the opening (no shadow, so the sun comes through) and a stone frame
for (const kind of ['lancet', 'rect']) {
  const hs = kind === 'lancet' ? 2.2 : 1.6;
  const glass = new THREE.ShapeGeometry(archShape(kind, 1, hs), 8);
  const g = glass.attributes.position, guv = glass.attributes.uv;
  for (let i = 0; i < g.count; i++) guv.setXY(i, g.getX(i), g.getY(i));
  const outer = archShape(kind, 1.2, hs, -0.12); outer.holes.push(archShape(kind, 1, hs));
  protoDef('iwin_' + kind, [{ mat: 'iglass', geo: glass, cast: false }, { mat: 'itrim', geo: new THREE.ExtrudeGeometry(outer, { depth: 0.3, bevelEnabled: false, curveSegments: 8 }).translate(0, 0, -0.15) }]);
}
function iwin(kind, p, nx, nz, w, h) { place('iwin_' + kind, xf(p, Math.atan2(nx, nz), [w, h / WIN_H[kind], 1])); }
// a sun for each set: low, warm, through the windows; its shadow box is fitted to the room
function setSun(sc, dir, box) {
  const L = new THREE.DirectionalLight(new THREE.Color(1.0, 0.88, 0.7), 5);
  L.castShadow = true;
  L.shadow.mapSize.set(2048, 2048);
  Object.assign(L.shadow.camera, { left: -box, right: box, top: box, bottom: -box, near: 1, far: 400 });
  L.shadow.bias = -0.0005; L.shadow.normalBias = 0.04;
  L.target.position.set(0, 0, 0); sc.add(L, L.target);
  return { light: L, dir: dir.clone().normalize() };
}
function makeInterior(key, build) {
  const sc = new THREE.Scene();
  TARGET = sc;
  const spec = build(sc);
  flushPictures(); flushParts(); flushProtos();
  TARGET = null;
  sc.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  INT[key] = { scene: sc, ...spec };
}
function setInteriorLight(key, night) {
  const I = INT[key]; if (!I) return;
  I.sun.light.intensity = night ? (I.moonI || 0) : I.sunI;
  I.sun.light.color.setRGB(...(night ? [0.55, 0.66, 0.95] : [1.0, 0.88, 0.7]));
  I.scene.environmentIntensity = night ? I.envN : I.envD;
  for (const p of I.points) p.intensity = night ? p.userData.n : p.userData.d;
}
