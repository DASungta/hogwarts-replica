// Hogwarts replica: the film castle (as built for the 1:24 miniature) in code, no models / images / textures from files.
// Engine is the athena-demo one (world-space shader materials, aerial perspective, accumulation renderer, AgX + auto levels).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const Q = new URLSearchParams(location.search);
const HEADLESS = Q.has('headless');
const num = (k, d) => (Q.has(k) ? +Q.get(k) : d);
const $ = (id) => document.getElementById(id);
const tick = () => new Promise((r) => setTimeout(r, 0));
const T0 = performance.now();
let loadStep = 0;
const LOAD_STEPS = 18;
async function stage(msg) {
  loadStep++;
  $('load-msg').textContent = msg;
  $('load-fill').style.width = Math.min(100, (loadStep / LOAD_STEPS) * 100) + '%';
  if (HEADLESS) console.log('[build]', msg, Math.round(performance.now() - T0) + ' ms');
  await tick();
}
function fail(e) {
  const m = String(e && (e.stack || e.message) || e);
  console.error(m);
  window.__FAIL = 'ERROR ' + m;
  $('load-msg').textContent = '出错了：' + (e && e.message || e);
}
window.addEventListener('error', (ev) => fail(ev.error || ev.message));

// ------------------------------------------------------------------ math, seeded random, CPU noise
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rng = (label) => mulberry32(hashStr(String(label)));
function halton(i, b) { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; }

const PERM = (() => {
  const r = rng('perm'); const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  const P = new Uint8Array(512); for (let i = 0; i < 512; i++) P[i] = p[i & 255]; return P;
})();
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
function grad(h, x, y, z) { h &= 15; const u = h < 8 ? x : y, v = h < 4 ? y : (h === 12 || h === 14 ? x : z); return ((h & 1) ? -u : u) + ((h & 2) ? -v : v); }
function noise3(x, y, z) { // improved Perlin noise, ~[-1, 1]
  let X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
  x -= X; y -= Y; z -= Z; X &= 255; Y &= 255; Z &= 255;
  const u = fade(x), v = fade(y), w = fade(z);
  const A = PERM[X] + Y, AA = PERM[A] + Z, AB = PERM[A + 1] + Z, B = PERM[X + 1] + Y, BA = PERM[B] + Z, BB = PERM[B + 1] + Z;
  return lerp(
    lerp(lerp(grad(PERM[AA], x, y, z), grad(PERM[BA], x - 1, y, z), u), lerp(grad(PERM[AB], x, y - 1, z), grad(PERM[BB], x - 1, y - 1, z), u), v),
    lerp(lerp(grad(PERM[AA + 1], x, y, z - 1), grad(PERM[BA + 1], x - 1, y, z - 1), u), lerp(grad(PERM[AB + 1], x, y - 1, z - 1), grad(PERM[BB + 1], x - 1, y - 1, z - 1), u), v), w);
}
function fbm3(x, y, z, o = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * noise3(x * f, y * f, z * f); f *= 2.03; a *= 0.5; } return s; }

// ------------------------------------------------------------------ GLSL building blocks
const NOISE = /* glsl */ `
float cgH31(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float cgH21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float cgVn(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(cgH31(i), cgH31(i + vec3(1,0,0)), f.x), mix(cgH31(i + vec3(0,1,0)), cgH31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(cgH31(i + vec3(0,0,1)), cgH31(i + vec3(1,0,1)), f.x), mix(cgH31(i + vec3(0,1,1)), cgH31(i + vec3(1,1,1)), f.x), f.y), f.z); }
float cgVn2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(cgH21(i), cgH21(i + vec2(1,0)), f.x), mix(cgH21(i + vec2(0,1)), cgH21(i + vec2(1,1)), f.x), f.y); }
float cgFbm(vec3 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * cgVn(p); p = p * 2.02 + vec3(5.1, 1.3, 7.7); a *= 0.5; } return s / 0.96875; }
float cgFbm3(vec3 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 3; i++) { s += a * cgVn(p); p = p * 2.03 + vec3(5.1, 1.3, 7.7); a *= 0.5; } return s / 0.875; }
float cgFbm2(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * cgVn2(p); p = p * 2.03 + vec2(5.1, 1.3); a *= 0.5; } return s / 0.96875; }
vec3 cgBump(vec3 pos, vec3 nrm, float h, float k){
  vec3 sx = dFdx(pos), sy = dFdy(pos); vec3 r1 = cross(sy, nrm), r2 = cross(nrm, sx);
  float det = dot(sx, r1); vec3 g = sign(det) * (dFdx(h) * k * r1 + dFdy(h) * k * r2);
  return normalize(abs(det) * nrm - g);
}
`;

// Sun: late afternoon from the south-west, i.e. over the loch and behind the camera's left shoulder in the lake shots.
const SUN_DAY = new THREE.Vector3(-0.62, 0.36, 0.7).normalize();
const MOON = new THREE.Vector3(0.42, 0.42, 0.8).normalize();
const SUN_DIR = SUN_DAY.clone();
const SUN_T1 = new THREE.Vector3(), SUN_T2 = new THREE.Vector3();
function setSunDir(v) {
  SUN_DIR.copy(v);
  SUN_T1.crossVectors(SUN_DIR, new THREE.Vector3(0, 1, 0)).normalize();
  SUN_T2.crossVectors(SUN_T1, SUN_DIR).normalize();
}
setSunDir(SUN_DAY);
const ATMO = {
  uSunDir: { value: SUN_DIR },
  uSunCol: { value: new THREE.Vector3(1.0, 0.86, 0.68) },
  uHaze: { value: new THREE.Vector3(0.5, 0.58, 0.68) },
  uFogDen: { value: num('fog', 0.00016) },
  uFogFall: { value: 0.0016 },
  uTime: { value: 0 },
  uNight: { value: 0 },
  uLamp: { value: 0 },   // how lit the lamps and windows are: 1 at night, part-lit at dusk (uNight is the sky and the light)
};
// Aerial perspective: exponential height fog integrated along the view ray, blue-weighted extinction,
// in-scatter toward the haze colour plus a forward glow around the sun. Fog height is measured from the loch (y = -60).
const ATMO_GLSL = /* glsl */ `
uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uHaze; uniform float uFogDen; uniform float uFogFall; uniform float uTime; uniform float uNight; uniform float uLamp;
vec3 atmoApply(vec3 col, vec3 wp){
  vec3 v = wp - cameraPosition; float d = length(v); vec3 rd = v / max(d, 1e-3);
  float k = uFogFall; float t = k * rd.y * d;
  float od = uFogDen * exp(-k * max(cameraPosition.y + 60.0, 0.0)) * d * (abs(t) > 1e-4 ? (1.0 - exp(-t)) / t : 1.0 - 0.5 * t);
  vec3 ext = exp(-od * vec3(0.8, 0.92, 1.15));
  float mu = max(dot(rd, uSunDir), 0.0);
  vec3 ins = uHaze + uSunCol * (0.3 * pow(mu, 6.0) + 0.22 * pow(mu, 32.0)) * (1.0 - 0.85 * uNight);
  return col * ext + ins * (1.0 - ext);
}
`;
const WPOS_VERT = /* glsl */ `
{ vec4 cgw = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
  cgw = instanceMatrix * cgw;
#endif
  cgw = modelMatrix * cgw; vWPos = cgw.xyz;
  vWNrm = normalize(inverseTransformDirection(transformedNormal, viewMatrix)); }
`;

// Local lights at night: gas lamps, lit windows, a carried lantern. Builders register them in LAMPS ({ p, c, r } in world
// space, or { obj, p } relative to a moving object, with an optional on() test); before each sample the nearest LAMP_MAX
// around the camera go into LAMPU and every procMat material adds them as point lights (no shadows, smooth cut-off at r).
const LAMP_MAX = 40;
const LAMPS = [];
const LAMPU = {
  uLampP: { value: Array.from({ length: LAMP_MAX }, () => new THREE.Vector4()) },
  uLampC: { value: Array.from({ length: LAMP_MAX }, () => new THREE.Vector3()) },
  uLampN: { value: 0 },
};
const LAMP_GLSL = /* glsl */ `
uniform vec4 uLampP[${LAMP_MAX}]; uniform vec3 uLampC[${LAMP_MAX}]; uniform int uLampN;
vec3 lampScatter(vec3 wp){   // light the lamps throw on a point that scatters it evenly (steam, mist); soft near the lamp
  vec3 s = vec3(0.0);
  for (int i = 0; i < ${LAMP_MAX}; i++) {
    if (i >= uLampN) break;
    vec3 dw = uLampP[i].xyz - wp; float d2 = dot(dw, dw), R = uLampP[i].w;
    if (d2 > R * R) continue;
    float f = 1.0 - d2 * d2 / (R * R * R * R);
    s += uLampC[i] * f * f / (d2 + 3.0);
  }
  return s;
}
`;
const LAMP_LOOP = /* glsl */ `
for (int i = 0; i < ${LAMP_MAX}; i++) {
  if (i >= uLampN) break;
  vec3 dw = uLampP[i].xyz - vWPos; float d2 = dot(dw, dw), R = uLampP[i].w;
  if (d2 > R * R) continue;
  float f = 1.0 - d2 * d2 / (R * R * R * R);
  IncidentLight il; il.direction = normalize((viewMatrix * vec4(uLampP[i].xyz, 1.0)).xyz - geometryPosition);
  il.color = uLampC[i] * (f * f / (d2 + 0.25)); il.visible = true;
  RE_Direct(il, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight);
}
`;
// The spell (the magic short, 89-short.js): a front sweeping out from a point, or along a direction, that lights the
// lamps, windows, candles and fires as it passes, with a flare just behind it and a band of gold washing over the
// surfaces at the front. With the radius huge (the default) everything is lit as usual; with it negative, nothing is.
const SPELLU = {
  uSpellC: { value: new THREE.Vector4(0, 0, 0, 1e7) },   // centre, radius of the front (m)
  uSpellD: { value: new THREE.Vector4(0, 0, 0, 8) },     // sweep direction (zero = round the centre), width of the front
  uSpellB: { value: new THREE.Vector4(0, 0, 0, 0) },     // colour of the band at the front, its reach (m; 0 = no fall-off)
  uSpellJ: { value: 0 },                                 // jitter (m): each 3 m cell lit a little early or late
};
const SPELL_GLSL = /* glsl */ `
uniform vec4 uSpellC; uniform vec4 uSpellD; uniform vec4 uSpellB; uniform float uSpellJ;
float cgSpellH(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
// x: lit (0 ahead of the front, 1 behind it), y: the flare just behind the front, z: the band at the front
vec3 cgSpell(vec3 P){
  vec3 r = P - uSpellC.xyz;
  float d = dot(uSpellD.xyz, uSpellD.xyz) > 0.5 ? dot(r, uSpellD.xyz) : length(r);
  float s0 = (uSpellC.w - d) / uSpellD.w, s = s0 - (cgSpellH(floor(P / 3.0)) - 0.5) * uSpellJ / uSpellD.w;   // the lights a little irregular, the band smooth
  float on = smoothstep(0.0, 0.25, s);
  float band = exp(-(s0 - 0.3) * (s0 - 0.3) * 2.5) * (uSpellB.w > 0.0 ? exp(-max(d, 0.0) / uSpellB.w) : 1.0);
  return vec3(on, on * exp(-max(s, 0.0) * 0.8), band);
}
`;
function spellHash(x, y, z) { // cgSpellH(floor(P / 3))
  const fr = (v) => v - Math.floor(v);
  let p = [Math.floor(x / 3), Math.floor(y / 3), Math.floor(z / 3)].map((v) => fr(v * 0.1031));
  const d = p[0] * (p[2] + 31.32) + p[1] * (p[1] + 31.32) + p[2] * (p[0] + 31.32);
  p = p.map((v) => v + d);
  return fr((p[0] + p[1]) * p[2]);
}
function spellAt(x, y, z) { // the same on the CPU for the local lights: [lit, flare]
  const C = SPELLU.uSpellC.value, D = SPELLU.uSpellD.value, J = SPELLU.uSpellJ.value;
  const rx = x - C.x, ry = y - C.y, rz = z - C.z;
  const d = D.x * D.x + D.y * D.y + D.z * D.z > 0.5 ? rx * D.x + ry * D.y + rz * D.z : Math.hypot(rx, ry, rz);
  const s = (C.w - d - (J ? (spellHash(x, y, z) - 0.5) * J : 0)) / D.w, on = smooth(0, 0.25, s);
  return [on, on * Math.exp(-Math.max(s, 0) * 0.8)];
}
// The floating candles' slow rise and fall (the dusk short): an offset in metres from the candle's own x, z
const BOB = { uBob: { value: 0 } };
const BOB_GLSL = (p) => `uBob * 0.06 * sin(uTime * (0.8 + 0.5 * fract(${p}.x * 3.7 + ${p}.z * 1.3)) + ${p}.x * 2.3 + ${p}.z * 1.7)`;
// halo billboards: aP = centre, radius; aQ = facing (x, z; zero = all round), seed (picks the hue), strength
function haloMesh(n, bob = false) {   // bob: follow the floating candles (BOB)
  const geo = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(1, 1));
  geo.setAttribute('aP', new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4));
  geo.setAttribute('aQ', new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4));
  geo.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: { uLamp: ATMO.uLamp, uTime: ATMO.uTime, uBob: bob ? BOB.uBob : { value: 0 }, ...SPELLU }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `attribute vec4 aP; attribute vec4 aQ; uniform float uLamp; uniform float uTime; uniform float uBob; varying vec2 vUv; varying vec3 vCol;
      ${SPELL_GLSL}
      void main(){
        vUv = uv; vec3 c = aP.xyz; c.y += ${BOB_GLSL('c')};
        vec3 toC = cameraPosition - c; float d = length(toC); toC /= max(d, 1e-3);
        float face = length(aQ.xy) > 0.01 ? smoothstep(-0.05, 0.5, dot(vec3(aQ.x, 0.0, aQ.y), toC)) : 1.0;
        vec3 sp = cgSpell(c);
        vCol = mix(vec3(1.0, 0.48, 0.16), vec3(1.0, 0.66, 0.3), fract(aQ.z * 5.3)) * aQ.w * face * uLamp * exp(-d * 0.00035) * sp.x * (1.0 + 2.5 * sp.y);
        vec4 mv = viewMatrix * vec4(c, 1.0); mv.xy += position.xy * aP.w * 2.0; mv.z += aP.w * 0.6;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `varying vec2 vUv; varying vec3 vCol;
      void main(){ vec2 q = vUv - 0.5; float r2 = dot(q, q) * 4.0; if (r2 > 1.0) discard;
        float g = exp(-r2 * 7.0) * 0.8 + exp(-r2 * 2.2) * 0.2; gl_FragColor = vec4(vCol * g * (1.0 - r2), 1.0); }`,
  });
  const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = 5; return m;
}
const LAMP_HALO = {};   // one halo mesh per scene: the grounds ('') or a room key
const _lampV = new THREE.Vector3();
function updateLamps(on, room = null) {
  const U = LAMPU, key = room || '';
  if (!LAMP_HALO[key]) { LAMP_HALO[key] = haloMesh(LAMP_MAX); (room ? INT[room].scene : scene).add(LAMP_HALO[key]); }
  const H = LAMP_HALO[key];
  if (!on) { U.uLampN.value = 0; H.visible = false; return; }
  const cp = camera.position, list = [];
  for (const L of LAMPS) {
    if ((L.room || null) !== room) continue;
    if (L.on && !L.on()) continue;
    if (L.at) { const q = L.at(); if (!q) continue; _lampV.set(...q); }
    else if (L.obj) { L.obj.updateMatrixWorld(true); _lampV.set(...L.p); L.obj.localToWorld(_lampV); } else _lampV.set(...L.p);
    const d = _lampV.distanceTo(cp);
    if (d >= (L.see ?? 260)) continue;
    let sk = 1;
    if (!L.free) { const [on, fl] = spellAt(_lampV.x, _lampV.y, _lampV.z); sk = on * (1 + 2.5 * fl); if (sk < 1e-3) continue; }   // free: not touched by the spell
    list.push([L.pri ? -1 : d, _lampV.x, _lampV.y, _lampV.z, L, d, sk]);   // pri: always among the lit
  }
  list.sort((a, b) => a[0] - b[0]);
  const n = Math.min(LAMP_MAX, list.length), aP = H.geometry.attributes.aP, aQ = H.geometry.attributes.aQ;
  let h = 0;
  for (let i = 0; i < n; i++) {
    const [, x, y, z, L, d, sk] = list[i], see = L.see ?? 260, c = L.cf ? L.cf() : L.c;   // cf: a colour that changes (the magic)
    const k = clamp((see - d) / (see * 0.25), 0, 1) * sk * (L.free ? 1 : ATMO.uLamp.value);
    U.uLampP.value[i].set(x, y, z, L.r); U.uLampC.value[i].set(c[0] * k, c[1] * k, c[2] * k);
    if (L.halo) { aP.setXYZW(h, x, y, z, L.halo); aQ.setXYZW(h, 0, 0, 0.4, L.hk ?? 0.35); h++; }
  }
  U.uLampN.value = n;
  H.geometry.instanceCount = h; aP.needsUpdate = true; aQ.needsUpdate = true; H.visible = h > 0;
}

// procMat: MeshStandardMaterial + world-space GLSL hooks. `frag` runs after color_fragment with P (world pos), N (world
// normal), UV (metric uv when o.uv) and may set diffuseColor, cgRough, cgMetal, cgH (bump height, metres), cgAO
// (indirect only), cgSpec, cgEmit. o.inst passes the instance origin as vInst and the instance colour as vInstC.
// cgEmit is lit by the spell's front (SPELLU) unless o.spell === false.
// Every material gets the atmosphere instead of three's fog.
function procMat(o = {}) {
  const m = new THREE.MeshStandardMaterial({
    roughness: o.rough ?? 0.7, metalness: o.metal ?? 0, vertexColors: !!o.vc, side: o.side ?? THREE.FrontSide,
    envMapIntensity: o.env ?? 1, ...(o.std || {}),
  });
  m.color.setRGB(...(o.rgb || [1, 1, 1]), THREE.LinearSRGBColorSpace);
  const key = 'cg-' + (o.name || Math.random());
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, ATMO, LAMPU, SPELLU, o.uniforms || {});
    let vs = sh.vertexShader, fs = sh.fragmentShader;
    const vary = 'varying vec3 vWPos;\nvarying vec3 vWNrm;\n' + (o.sunVis ? 'varying float vSunVis;\n' : '') + (o.uv ? 'varying vec2 vCgUv;\n' : '')
      + (o.inst ? 'varying vec3 vInst;\nvarying vec3 vInstC;\n' : '');
    vs = vs.replace('#include <common>', '#include <common>\n' + vary + (o.sunVis ? 'attribute float sunvis;\n' : '') + (o.vhead || ''))
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + (o.vbegin || ''))
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n' + WPOS_VERT
        + (o.sunVis ? 'vSunVis = sunvis;\n' : '') + (o.uv ? 'vCgUv = uv;\n' : '') + (o.vert || '')
        + (o.inst ? '#ifdef USE_INSTANCING\nvInst = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;\n#else\nvInst = vec3(0.0);\n#endif\n#ifdef USE_INSTANCING_COLOR\nvInstC = instanceColor;\n#else\nvInstC = vec3(0.0);\n#endif\n' : ''));
    fs = fs.replace('#include <common>', '#include <common>\n' + vary + NOISE + ATMO_GLSL + LAMP_GLSL + SPELL_GLSL + (o.head || ''))
      .replace('#include <color_fragment>', '#include <color_fragment>\nfloat cgAO = 1.0; float cgSpec = 1.0; float cgRough = -1.0; float cgMetal = -1.0; float cgH = 0.0; vec3 cgEmit = vec3(0.0);\n{ vec3 P = vWPos; vec3 N = normalize(vWNrm);'
        + (o.uv ? ' vec2 UV = vCgUv;' : '') + '\n' + (o.frag || '') + '\n}')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nif (cgRough >= 0.0) roughnessFactor = cgRough;')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nif (cgMetal >= 0.0) metalnessFactor = cgMetal;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + (o.spell === false ? 'totalEmissiveRadiance += cgEmit;'
        : '{ vec3 sp = cgSpell(vWPos); totalEmissiveRadiance += cgEmit * sp.x * (1.0 + 2.5 * sp.y) + diffuseColor.rgb * uSpellB.rgb * sp.z * (0.3 + 0.9 * cgVn(vWPos * 0.4) + 0.6 * cgVn(vWPos * 1.9)); }'))
      .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\nreflectedLight.indirectDiffuse *= cgAO; reflectedLight.indirectSpecular *= cgAO * cgSpec;'
        + (o.sunVis ? ' reflectedLight.directDiffuse *= vSunVis; reflectedLight.directSpecular *= vSunVis;' : '') + LAMP_LOOP)
      .replace('#include <fog_fragment>', 'gl_FragColor.rgb = atmoApply(gl_FragColor.rgb, vWPos);');
    if (o.bump) fs = fs.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\nnormal = cgBump(-vViewPosition, normal, cgH, ${o.bump.toFixed(4)});`);
    sh.vertexShader = vs; sh.fragmentShader = fs;
  };
  m.customProgramCacheKey = () => key;
  m.name = o.name || '';
  return m;
}

// ------------------------------------------------------------------ renderer, scene, camera
const canvas = $('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: HEADLESS });
renderer.toneMapping = THREE.NoToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.autoClear = false;
const gl = renderer.getContext();
const dbg = gl.getExtension('WEBGL_debug_renderer_info');
const GPU = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'gpu';
if (HEADLESS) console.log('[gpu]', GPU);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.5, 90000);
scene.add(camera);

// ------------------------------------------------------------------ geometry helpers
function prep(g) {
  if (g.index) g = g.toNonIndexed();
  if (!g.attributes.normal) g.computeVertexNormals();
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
  return g;
}
const merge = (list) => mergeGeometries(list.map(prep));
const box = (w, h, d, x = 0, y = 0, z = 0) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
let TARGET = null;   // the scene new meshes go into (an interior set while it is being built)
function addMesh(geo, mat, { cast = true, recv = true } = {}) {
  const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = recv; (TARGET || scene).add(m); return m;
}
function addInst(geo, mat, list, colors = null, { cast = true, recv = true } = {}) {
  const im = new THREE.InstancedMesh(geo, mat, list.length);
  list.forEach((m, i) => im.setMatrixAt(i, m));
  if (colors) colors.forEach((c, i) => im.setColorAt(i, new THREE.Color(c[0], c[1], c[2])));
  im.instanceMatrix.needsUpdate = true; im.castShadow = cast; im.receiveShadow = recv;
  im.computeBoundingSphere(); (TARGET || scene).add(im); return im;
}
const _o = new THREE.Object3D();
function xf(p, ry = 0, s = 1, rx = 0, rz = 0) {
  _o.position.set(p[0], p[1], p[2]); _o.rotation.set(rx, ry, rz, 'YXZ');
  if (typeof s === 'number') _o.scale.setScalar(s); else _o.scale.set(s[0], s[1], s[2]);
  _o.updateMatrix(); return _o.matrix.clone();
}
const D2R = Math.PI / 180;
