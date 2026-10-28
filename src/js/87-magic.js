// ------------------------------------------------------------------ magic: sparks, the flying light, fireworks (the short, 89-short.js)
// Every spark is a formula of the time: born at a place and moment with a velocity, it falls under gravity against air
// drag and drifts, so any frame can be drawn on its own. The vertex shader draws each spark as a streak from where it
// was a shutter (or its own glowing tail) ago to where it is now: motion blur and long-exposure trails come free.
// Colours are linear HDR; the pipeline's bloom makes the glow.
const SPK = {
  uT: { value: 0 }, uShut: { value: 1 / 60 }, uRes: { value: new THREE.Vector2(1280, 720) },
  uOrb: { value: new THREE.Vector4(0, 0, 0, 0) },   // the flying light (position, strength): dust glints near it
};
// aA: birth place, time   aB: velocity, life   aC: colour, radius (m)   aD: drag (1/s), gravity (m/s²), tail (s), seed
// aE: wobble (m), twinkle (0-1), white heat at birth (0-1), kind (0 free, 1 drawn to a target, 2 dust lit by the light)
// aF: kind 1: the target and the time it gets there
const SPARK_ATTR = ['aA', 'aB', 'aC', 'aD', 'aE', 'aF'];
const SPARK_MAT = new THREE.ShaderMaterial({
  uniforms: SPK, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: /* glsl */ `attribute vec4 aA; attribute vec4 aB; attribute vec4 aC; attribute vec4 aD; attribute vec4 aE; attribute vec4 aF;
    uniform float uT; uniform float uShut; uniform vec2 uRes; uniform vec4 uOrb;
    varying vec3 vCol; varying vec2 vQ; varying float vLen; varying float vW;
    vec3 flight(float a){
      // v' = g - k v: p = p0 + v0 e + g h, e = (1 - exp(-ka)) / k, h = (a - e) / k (a series when ka is small)
      float k = aD.x, ka = k * a, e, h;
      if (ka < 0.05) { e = a * (1.0 - ka * 0.5 + ka * ka / 6.0); h = a * a * (0.5 - ka / 6.0 + ka * ka / 24.0); }
      else { e = (1.0 - exp(-ka)) / k; h = (a - e) / k; }
      vec3 p = aA.xyz + aB.xyz * e + vec3(0.0, -aD.y, 0.0) * h;
      float s = aD.w * 6.2832, wb = aE.x * smoothstep(0.0, 1.2, a);
      return p + wb * vec3(sin(a * 1.7 + s), 0.6 * sin(a * 1.3 + s * 3.1), sin(a * 1.9 + s * 5.7));
    }
    vec3 posAt(float a){
      vec3 p = flight(a);
      if (aE.w > 0.5 && aE.w < 1.5) {   // drawn in to its target on a swerving path, then shimmering in place
        float u = clamp(a / max(aF.w - aA.w, 0.05), 0.0, 1.0), e = u * u * u * (u * (u * 6.0 - 15.0) + 10.0);
        vec3 side = vec3(sin(aD.w * 40.0), 0.5 * cos(aD.w * 23.0), cos(aD.w * 40.0)) * aE.x * sin(3.1416 * u);
        p = mix(p, aF.xyz, e) + side;
        p += 0.012 * step(1.0, u) * vec3(sin(uT * 7.0 + aD.w * 90.0), cos(uT * 5.0 + aD.w * 70.0), sin(uT * 6.0 + aD.w * 30.0));
      }
      return p;
    }
    void main(){
      float a = uT - aA.w, life = aB.w;
      vCol = vec3(0.0); vQ = vec2(0.0); vLen = 0.0; vW = 1.0;
      if (a < 0.0 || a > life) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
      vec3 ph = posAt(a), pt = posAt(max(a - max(uShut, aD.z), 0.0));
      vec4 vh = viewMatrix * vec4(ph, 1.0), vt = viewMatrix * vec4(pt, 1.0);
      if (vh.z > -0.05) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
      if (vt.z > -0.05) vt = vh;
      vec4 ch = projectionMatrix * vh, ct = projectionMatrix * vt;
      vec2 hr = 0.5 * uRes, sh = ch.xy / ch.w * hr, st = ct.xy / ct.w * hr;
      float wTrue = aC.w * projectionMatrix[1][1] * hr.y / -vh.z, w = max(wTrue, 0.8);
      vec2 dd = sh - st; float L = length(dd); vec2 dn = L > 1e-3 ? dd / L : vec2(1.0, 0.0), pn = vec2(-dn.y, dn.x);
      float R = w * 2.6, u = position.x + 0.5, along = mix(-R, L + R, u);
      vec2 s = st + dn * along + pn * position.y * 2.0 * R;
      vec4 c = mix(ct, ch, clamp(along / max(L, 1e-3), 0.0, 1.0));
      gl_Position = vec4(s / hr * c.w, c.z, c.w);
      vQ = vec2(along, position.y * 2.0 * R); vLen = L; vW = w;
      float uu = a / life, env = smoothstep(0.0, 0.04, a) * (1.0 - smoothstep(0.72, 1.0, uu));
      vec3 col = aC.rgb; float pk = max(max(col.r, col.g), col.b);
      col = mix(col, vec3(1.0, 0.93, 0.82) * pk, aE.z * exp(-a * 5.0));   // white-hot when born
      if (aE.w < 0.5) col = mix(col, vec3(1.0, 0.32, 0.08) * pk * 0.5, smoothstep(0.6, 1.0, uu) * 0.7);   // reddening as it dies
      float tw = aE.y > 0.0 ? mix(1.0, 0.2 + 3.0 * pow(0.5 + 0.5 * sin(uT * (11.0 + 17.0 * fract(aD.w * 7.3)) + aD.w * 60.0), 8.0), aE.y) : 1.0;
      if (aE.w > 1.5) { vec3 o = ph - uOrb.xyz; env *= 0.05 + uOrb.w * 5.0 / (1.0 + dot(o, o) / 6.0); }
      if (aE.w > 0.5 && aE.w < 1.5) { float since = uT - aF.w; env *= since < 0.0 ? 0.45 : 1.0 + 2.5 * exp(-since / 0.3); }   // a glint as it lands
      vCol = col * env * tw * exp(-length(ph - cameraPosition) * 0.0003) * (wTrue * wTrue) / (w * w) * w / (w + 0.5 * L);
    }`,
  fragmentShader: /* glsl */ `varying vec3 vCol; varying vec2 vQ; varying float vLen; varying float vW;
    void main(){
      float x = clamp(vQ.x, 0.0, vLen); vec2 d = vec2(vQ.x - x, vQ.y) / vW; float r2 = dot(d, d);
      if (r2 > 6.5) discard;
      float g = exp(-r2 * 1.8) + 0.05 * exp(-r2 * 0.45);
      gl_FragColor = vec4(vCol * g * (vLen > 1.0 ? pow(x / vLen, 1.5) : 1.0), 1.0);   // the tail tapers away
    }`,
});
// a set of sparks, filled on the CPU once and drawn as one mesh
class Sparks {
  constructor(label) { this.d = SPARK_ATTR.map(() => []); this.n = 0; this.R = rng('sparks-' + label); }
  // p: birth place, t: time, v: velocity (m/s), life (s), col: linear HDR colour, size: radius (m); see aD-aF for the rest
  add(p, t, v, life, col, size, o = {}) {
    const d = this.d, f = o.to || [0, 0, 0];
    d[0].push(p[0], p[1], p[2], t); d[1].push(v[0], v[1], v[2], life); d[2].push(col[0], col[1], col[2], size);
    d[3].push(o.drag ?? 1, o.grav ?? 0, o.tail ?? 0, o.seed ?? this.R());
    d[4].push(o.wob ?? 0, o.tw ?? 0, o.heat ?? 0, o.kind ?? 0); d[5].push(f[0], f[1], f[2], o.arrive ?? 0);
    this.n++;
  }
  mesh() {
    const geo = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(1, 1));
    SPARK_ATTR.forEach((k, i) => geo.setAttribute(k, new THREE.InstancedBufferAttribute(new Float32Array(this.d[i]), 4)));
    geo.instanceCount = this.n;
    const m = new THREE.Mesh(geo, SPARK_MAT); m.frustumCulled = false; m.renderOrder = 6;
    return m;
  }
}
// the free flight on the CPU (no wobble), to place sparks that a spark sheds
function flightAt(p, v, k, g, a) {
  const ka = k * a, e = ka < 0.05 ? a * (1 - ka / 2 + ka * ka / 6) : (1 - Math.exp(-ka)) / k, h = ka < 0.05 ? a * a * (0.5 - ka / 6 + ka * ka / 24) : (a - e) / k;
  return [p[0] + v[0] * e, p[1] + v[1] * e - g * h, p[2] + v[2] * e];
}
function sphereDir(R) { const z = R() * 2 - 1, a = R() * Math.PI * 2, r = Math.sqrt(1 - z * z); return [r * Math.cos(a), z, r * Math.sin(a)]; }
const vadd = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const vscale = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

// ---- the flying light: a white-hot core, a gold halo, slow rays and a long thin horizontal flare, drawn in screen
// space round its projected centre (so it keeps a few pixels when far off), plus a local light that moves with it
const ORB = { p: [0, 0, 0], on: 0, light: 0, room: undefined, col: [1.0, 0.76, 0.42] };
const ORBU = { uOrbP: { value: new THREE.Vector4(0, 0, 0, 0) }, uRes: SPK.uRes, uT: SPK.uT };
const ORB_MAT = new THREE.ShaderMaterial({
  uniforms: ORBU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: /* glsl */ `uniform vec4 uOrbP; uniform vec2 uRes; varying vec2 vP; varying float vS;
    void main(){
      vec4 v = viewMatrix * vec4(uOrbP.xyz, 1.0); vP = vec2(0.0); vS = 1.0;
      if (v.z > -0.1 || uOrbP.w <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
      vec4 c = projectionMatrix * v; vec2 hr = 0.5 * uRes;
      vS = max(0.05 * projectionMatrix[1][1] * hr.y / -v.z, 2.0 * hr.y / 360.0);   // the core: 5 cm, never under 2 px at 720p
      vP = position.xy * 2.0 * vec2(vS * 34.0, vS * 12.0);
      gl_Position = vec4(c.xy + vP / hr * c.w, c.z, c.w);
    }`,
  fragmentShader: /* glsl */ `uniform vec4 uOrbP; uniform float uT; varying vec2 vP; varying float vS;
    void main(){
      vec2 e = abs(vP) / vec2(vS * 34.0, vS * 12.0);
      float win = (1.0 - smoothstep(0.55, 1.0, e.x)) * (1.0 - smoothstep(0.55, 1.0, e.y));   // nothing left at the quad's edge
      float r = length(vP) / vS, ang = atan(vP.y, vP.x);
      float core = exp(-r * r * 1.2) * 14.0;
      float halo = exp(-r * 0.45) * 0.8 + exp(-r * 0.16) * 0.1;
      float rays = pow(abs(cos(ang * 3.0 + uT * 0.6)), 80.0) * exp(-r * 0.3) * 0.45 + pow(abs(cos(ang * 2.0 - uT * 0.4 + 0.5)), 120.0) * exp(-r * 0.2) * 0.3;
      float streak = exp(-abs(vP.y) / (vS * 0.25)) * exp(-abs(vP.x) / (vS * 8.0)) * 0.5;
      vec3 col = vec3(1.0, 0.96, 0.88) * core + (vec3(1.0, 0.7, 0.32) * (halo + rays) + vec3(1.0, 0.82, 0.55) * streak) * win;
      gl_FragColor = vec4(col * uOrbP.w, 1.0);
    }`,
});
function orbMesh() {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), ORB_MAT); m.frustumCulled = false; m.renderOrder = 7;
  return m;
}
function orbLamps() { // the light it throws, in whichever scene it is in
  for (const room of [null, 'hall', 'stair'])
    LAMPS.push({ room, at: () => (ORB.on > 0 && ORB.room === room ? ORB.p : null), cf: () => ORB.col.map((v) => v * ORB.light * ORB.on), r: 40, pri: true, free: true, see: 1e5 });
}
// col: the light it throws; over the loch a deeper orange, as the water's own blue-green turns pale gold light green
function orbSet(p, on, light, room = null, col = [1.0, 0.76, 0.42]) {
  ORB.p = p; ORB.on = on; ORB.light = light; ORB.room = room; ORB.col = col;
  ORBU.uOrbP.value.set(p[0], p[1], p[2], on);
  SPK.uOrb.value.set(p[0], p[1], p[2], on);
}

// ---- fireworks. A shell: a rocket climbing on a trail of sparks, then a burst of stars (and a flash, and the light it
// throws on the castle and the loch). kind: 'peony' (a ball of colour, a gold pistil inside), 'crackle' (gold stars
// that break into white crackling), 'willow' (slow gold stars on long drooping trails)
const FW = { flashes: [] };   // [x, y, z, time, colour, strength] for the lights
function fireShell(S, o) {
  const R = S.R, { from, at, t, kind = 'peony' } = o, rise = o.rise ?? 1.2, tb = t + rise, G = 6;
  // the rocket: thrown so that, falling under G against no drag, it reaches the burst point at tb
  const v0 = [(at[0] - from[0]) / rise, (at[1] - from[1]) / rise + 0.5 * G * rise, (at[2] - from[2]) / rise];
  S.add(from, t, v0, rise, [3.2, 2.2, 1.2], 0.22, { drag: 0, grav: G, tail: 0.12, heat: 1 });
  for (let i = 0; i < rise * 140; i++) {
    const a = (i / 140) + R() / 140, q = [from[0] + v0[0] * a, from[1] + v0[1] * a - 0.5 * G * a * a, from[2] + v0[2] * a];
    const d = sphereDir(R);
    S.add(q, t + a, vscale(d, 1.5 + R() * 2), 0.35 + R() * 0.5, [1.6, 0.8, 0.3], 0.07, { drag: 2, grav: 4, tail: 0.05, tw: 0.4 });
  }
  const col = o.col || [1.0, 0.7, 0.3], gain = o.gain ?? 1;
  S.add(at, tb, [0, 0, 0], 0.08, vscale([1.0, 0.92, 0.8], 80 * gain), 0.5 * (o.size ?? 1), { drag: 0 });   // the flash (the bloom spreads it)
  FW.flashes.push([...at, tb, kind === 'peony' ? col : [1.0, 0.72, 0.36], gain]);
  const n = o.n ?? 560, sp = o.speed ?? 60;
  for (let i = 0; i < n; i++) {
    const d = sphereDir(R), v = vscale(d, sp * (0.9 + 0.2 * R()));
    if (kind === 'willow') {
      S.add(at, tb, v, 4.2 + R() * 1.4, vscale([1.0, 0.62, 0.24], 5 * gain), 0.55, { drag: 0.95, grav: 9, tail: 0.9, heat: 0.5, tw: 0.25 });
    } else if (kind === 'crackle') {
      const life = 1.8 + R() * 0.7;
      S.add(at, tb, v, life, vscale([1.0, 0.75, 0.35], 9 * gain), 0.55, { drag: 1.0, grav: 6, tail: 0.3, heat: 0.7 });
      for (let k = 0; k < 4; k++) {   // each star bursts into white crackle as it dies
        const a = life * (0.75 + 0.25 * R()), q = flightAt(at, v, 1.0, 6, a);
        S.add(q, tb + a, vscale(sphereDir(R), 3 + R() * 5), 0.12 + R() * 0.25, vscale([1.0, 0.95, 0.85], 22 * gain), 0.3, { drag: 3, grav: 2, tail: 0.04, tw: 1 });
      }
    } else {
      S.add(at, tb, v, 2.6 + R() * 0.9, vscale(col, 11 * gain), 0.6, { drag: 0.85, grav: 6, tail: 0.32, heat: 0.6, tw: 0.12 });
    }
  }
  if (kind === 'peony') { // the pistil: a smaller ball of another colour inside
    const c2 = o.col2 || [1.0, 0.72, 0.32];
    for (let i = 0; i < n * 0.35; i++) S.add(at, tb, vscale(sphereDir(R), sp * 0.45 * (0.9 + 0.2 * R())), 1.8 + R() * 0.6, vscale(c2, 10 * gain), 0.5, { drag: 0.9, grav: 5, tail: 0.22, heat: 0.8, tw: 0.4 });
  }
}
// the light each burst throws: a quick flash in its colour, dying over a second or two
function fireLamps() {
  for (const f of FW.flashes) {
    const [x, y, z, tb, c, g] = f, peak = 26000 * g;
    LAMPS.push({ at: () => { const a = SPK.uT.value - tb; return a > 0 && a < 4 ? [x, y, z] : null; },
      cf: () => { const a = SPK.uT.value - tb, k = peak * smooth(0, 0.05, a) * (0.25 * Math.exp(-a / 1.6) + 0.75 * Math.exp(-a / 0.45)); return c.map((v) => v * k); }, r: 700, pri: true, free: true, see: 1e5 });
  }
}

// ---- text written in sparks: points on a grid inside the glyphs of `text` (canvas units, centred, 1 = the font size)
function textPoints(text, font, px, step) {
  const c = makeCanvas(Math.ceil(px * text.length * 0.8), Math.ceil(px * 1.5)), g = c.getContext('2d');
  g.fillStyle = '#fff'; g.font = `${px}px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, c.width / 2, c.height / 2);
  const img = g.getImageData(0, 0, c.width, c.height).data, out = [];
  for (let y = 0; y < c.height; y += step) for (let x = 0; x < c.width; x += step) {
    if (img[(y * c.width + x) * 4 + 3] > 140) out.push([(x - c.width / 2) / px, (c.height / 2 - y) / px]);
  }
  return out;
}

// ---- the spell's front in the air: a thin bubble of gold light growing with it, brightest at its rim, fading as it spreads
const SHELLU = { uR: { value: 0 }, uA: { value: 0 }, uT: SPK.uT };
const SHELL_MAT = new THREE.ShaderMaterial({
  uniforms: SHELLU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  vertexShader: /* glsl */ `uniform float uR; varying vec3 vW; varying vec3 vN;
    void main(){ vec4 w = modelMatrix * vec4(position * uR, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: /* glsl */ `${NOISE} uniform float uA; uniform float uT; varying vec3 vW; varying vec3 vN;
    void main(){
      float f = 1.0 - abs(dot(normalize(vN), normalize(cameraPosition - vW)));
      float n = cgVn(vW * 0.05 + vec3(0.0, -uT * 0.6, 0.0)) * 0.7 + cgVn(vW * 0.21 + uT * 0.3) * 0.3;
      gl_FragColor = vec4(vec3(1.0, 0.74, 0.4) * pow(f, 7.0) * 1.3 * (0.3 + 1.4 * n * n) * uA, 1.0);
    }`,
});
function shellMesh() { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48), SHELL_MAT); m.frustumCulled = false; m.renderOrder = 6; return m; }
