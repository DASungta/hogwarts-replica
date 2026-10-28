const FS_VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
function makeRT(w, h, type, depth = false) {
  return new THREE.WebGLRenderTarget(w, h, { type, format: THREE.RGBAFormat, colorSpace: THREE.LinearSRGBColorSpace, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: depth, stencilBuffer: false, generateMipmaps: false });
}
// Monotone (Fritsch-Carlson) tone curve through the measured -> target luminance percentiles p02/p10/p50/p90/p98,
// blended with identity by s (auto levels). Targets: a dim Highland afternoon, and night.
const LEVELS = { day: [10, 24, 80, 186, 224], night: [3, 9, 26, 70, 190], natural: [7, 24, 86, 182, 230] };
let LEVEL_TARGET = LEVELS.day;
const LUT_N = 32;
function solveToneCurve(buf, stride, s) {
  const hist = new Float64Array(256); let n = 0;
  for (let i = 0; i < buf.length; i += 4 * stride) { hist[Math.min(255, Math.round(0.2126 * buf[i] + 0.7152 * buf[i + 1] + 0.0722 * buf[i + 2]))]++; n++; }
  const pct = (q) => { const k = q * n; let c = 0; for (let i = 0; i < 256; i++) { if (c + hist[i] >= k) return (i + (k - c) / Math.max(1, hist[i]) - 0.5) / 255; c += hist[i]; } return 1; };
  const xs = [0, ...[0.02, 0.1, 0.5, 0.9, 0.98].map(pct), 1], ys = [0, ...LEVEL_TARGET.map((v) => v / 255), 1];
  for (let i = 1; i < xs.length; i++) xs[i] = Math.max(xs[i], xs[i - 1] + 0.004);
  if (xs[xs.length - 1] > 1) { const k = 1 / xs[xs.length - 1]; for (let i = 0; i < xs.length; i++) xs[i] *= k; }
  xs[xs.length - 1] = 1;
  for (let i = 1; i < ys.length; i++) { const dx = xs[i] - xs[i - 1]; ys[i] = Math.min(ys[i - 1] + dx * 2.6, Math.max(ys[i - 1] + dx * 0.4, ys[i])); }
  const m = xs.length, d = [], t = new Array(m);
  for (let i = 0; i < m - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  t[0] = d[0]; t[m - 1] = d[m - 2];
  for (let i = 1; i < m - 1; i++) t[i] = d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]);
  const out = new Float32Array(LUT_N + 1);
  for (let j = 0; j <= LUT_N; j++) {
    const x = j / LUT_N; let i = 0; while (i < m - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], u = (x - xs[i]) / h;
    const y = (2 * u ** 3 - 3 * u ** 2 + 1) * ys[i] + (u ** 3 - 2 * u ** 2 + u) * h * t[i] + (-2 * u ** 3 + 3 * u ** 2) * ys[i + 1] + (u ** 3 - u ** 2) * h * t[i + 1];
    out[j] = x + (clamp(y, 0, 1) - x) * s;
    if (j) out[j] = Math.max(out[j], out[j - 1]);
  }
  return out;
}
const GRADE = {
  uExposure: { value: num('exp', 0.9) }, uWB: { value: new THREE.Vector3(1.0, 1.0, 1.0) },
  uContrast: { value: num('con', 1.4) }, uPivot: { value: 0.5 }, uToe: { value: 0.9 },
  uSat: { value: num('sat', 0.9) }, uVib: { value: 0.06 }, uShadowSat: { value: 0.1 },
  uLift: { value: new THREE.Vector3(0.012, 0.016, 0.022) },
  uShadowTint: { value: new THREE.Vector3(-0.008, 0.002, 0.012) }, uHighTint: { value: new THREE.Vector3(0.014, 0.006, -0.012) },
  uVignette: { value: new THREE.Vector2(0.3, 0.75) }, uShoulder: { value: new THREE.Vector2(0.86, 0.99) },
  uBloom: { value: 0.05 }, uSharpen: { value: 0.22 }, uGrain: { value: 0.016 }, uPunch: { value: 1.1 },
  // split toning measured from the later films' exteriors: green-teal shadows and mids, near-neutral highlights
  uFilm: { value: 1 }, uToneSh: { value: new THREE.Vector3(0.91, 1.12, 0.96) }, uToneMid: { value: new THREE.Vector3(0.93, 1.05, 1.02) },
  uToneHi: { value: new THREE.Vector3(0.98, 1.03, 0.99) },
};
const FADE = { amt: { value: 1 }, col: { value: new THREE.Vector3(0, 0, 0) } };   // 1 = picture, 0 = the fade colour
class Pipeline {
  constructor(r, w, h) {
    this.r = r; this.quad = new FullScreenQuad(null);
    this.accType = gl.getExtension('EXT_color_buffer_float') ? THREE.FloatType : THREE.HalfFloatType;
    this.accMat = new THREE.ShaderMaterial({
      uniforms: { tNew: { value: null }, tPrev: { value: null }, uW: { value: 1 } }, vertexShader: FS_VERT, depthTest: false, depthWrite: false,
      fragmentShader: /* glsl */ `uniform sampler2D tNew; uniform sampler2D tPrev; uniform float uW; varying vec2 vUv;
        void main(){ vec4 n = texture2D(tNew, vUv); n.rgb = min(n.rgb, vec3(3.0e4)); if (any(isnan(n.rgb))) n.rgb = vec3(0.0); gl_FragColor = mix(texture2D(tPrev, vUv), n, uW); }`,
    });
    this.downMat = new THREE.ShaderMaterial({
      uniforms: { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uFirst: { value: 0 } }, vertexShader: FS_VERT, depthTest: false, depthWrite: false,
      fragmentShader: /* glsl */ `uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uFirst; varying vec2 vUv;
        vec3 s(vec2 o){ return texture2D(tSrc, vUv + o * uTexel).rgb; }
        void main(){
          vec3 a = s(vec2(-1.0, -1.0)), b = s(vec2(1.0, -1.0)), c = s(vec2(-1.0, 1.0)), d = s(vec2(1.0, 1.0));
          vec3 r = (a + b + c + d) * 0.25;
          if (uFirst > 0.5) { float l = dot(r, vec3(0.2126, 0.7152, 0.0722)); r *= min(1.0, 40.0 / max(l, 1e-4)); }
          gl_FragColor = vec4(r, 1.0);
        }`,
    });
    this.upMat = new THREE.ShaderMaterial({
      uniforms: { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() } }, vertexShader: FS_VERT, depthTest: false, depthWrite: false,
      blending: THREE.AdditiveBlending, transparent: true,
      fragmentShader: /* glsl */ `uniform sampler2D tSrc; uniform vec2 uTexel; varying vec2 vUv;
        vec3 s(vec2 o){ return texture2D(tSrc, vUv + o * uTexel).rgb; }
        void main(){ vec3 r = s(vec2(0.0)) * 4.0 + (s(vec2(-1.0, 0.0)) + s(vec2(1.0, 0.0)) + s(vec2(0.0, -1.0)) + s(vec2(0.0, 1.0))) * 2.0 + s(vec2(-1.0)) + s(vec2(1.0)) + s(vec2(-1.0, 1.0)) + s(vec2(1.0, -1.0)); gl_FragColor = vec4(r / 16.0, 1.0); }`,
    });
    this.gradeMat = new THREE.ShaderMaterial({
      uniforms: { ...GRADE, tHDR: { value: null }, tBloom: { value: null }, uRes: { value: new THREE.Vector2(w, h) }, uFrame: { value: 0 }, toneMappingExposure: { value: 1 } },
      vertexShader: FS_VERT, depthTest: false, depthWrite: false,
      fragmentShader: /* glsl */ `
        #include <common>
        #include <tonemapping_pars_fragment>
        uniform sampler2D tHDR; uniform sampler2D tBloom; uniform vec2 uRes; uniform float uFrame;
        uniform float uExposure; uniform vec3 uWB; uniform float uContrast; uniform float uPivot; uniform float uToe;
        uniform float uSat; uniform float uVib; uniform float uShadowSat; uniform vec3 uLift; uniform vec3 uShadowTint; uniform vec3 uHighTint;
        uniform vec2 uVignette; uniform vec2 uShoulder; uniform float uBloom; uniform float uSharpen; uniform float uGrain; uniform float uPunch;
        uniform float uFilm; uniform vec3 uToneSh; uniform vec3 uToneMid; uniform vec3 uToneHi;
        varying vec2 vUv;
        float luma(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
        vec3 toPerc(vec3 c){ return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0031308)), vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c)); }
        float sCurve(float x, float m, float k){ x = clamp(x, 0.0, 1.0); return x < m ? m * pow(x / m, max(1.0, k * uToe)) : 1.0 - (1.0 - m) * pow((1.0 - x) / (1.0 - m), k); }
        float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
        void main(){
          vec2 px = 1.0 / uRes;
          vec3 c = texture2D(tHDR, vUv).rgb;
          vec3 bl = (texture2D(tHDR, vUv + vec2(px.x, 0.0)).rgb + texture2D(tHDR, vUv - vec2(px.x, 0.0)).rgb + texture2D(tHDR, vUv + vec2(0.0, px.y)).rgb + texture2D(tHDR, vUv - vec2(0.0, px.y)).rgb) * 0.25;
          c = max(c + (c - bl) * uSharpen, vec3(0.0));
          c = mix(c, texture2D(tBloom, vUv).rgb / 6.0, uBloom);
          c *= uExposure * uWB;
          vec2 q = vUv - 0.5; q.x *= uRes.x / uRes.y;
          c *= mix(1.0 - uVignette.x, 1.0, smoothstep(uVignette.y * 1.25, uVignette.y * 0.3, length(q)));
          c = AgXToneMapping(c);
          c = max(mix(vec3(luma(c)), c, uPunch), 0.0);
          vec3 o = toPerc(clamp(c, 0.0, 1.0));
          o = vec3(sCurve(o.r, uPivot, uContrast), sCurve(o.g, uPivot, uContrast), sCurve(o.b, uPivot, uContrast));
          float lo = luma(o);
          if (lo > uShoulder.x) { float kn = uShoulder.x, mx = uShoulder.y; o *= (kn + (mx - kn) * (1.0 - exp(-(lo - kn) / (mx - kn)))) / lo; }
          o = o + uLift * (1.0 - o);
          float l = luma(o);
          o += uShadowTint * (1.0 - smoothstep(0.0, 0.55, l)) + uHighTint * smoothstep(0.45, 1.0, l);
          l = luma(o);
          float sat = max(max(o.r, o.g), o.b) - min(min(o.r, o.g), o.b);
          o = mix(vec3(l), o, uSat + uVib * (1.0 - sat) + uShadowSat * (1.0 - smoothstep(0.08, 0.5, l)));
          if (uFilm > 0.0) {
            float lf = luma(o);
            vec3 o2 = mix(vec3(lf), o, 0.72);   // warm stone reads grey in the films
            vec3 tm = mix(mix(uToneSh, uToneMid, smoothstep(0.04, 0.38, lf)), uToneHi, smoothstep(0.45, 0.85, lf));
            o2 *= tm; o2 *= lf / max(luma(o2), 1e-4);
            o2 = o2 + vec3(0.012, 0.018, 0.016) * (1.0 - smoothstep(0.0, 0.25, lf));   // milky lifted blacks
            o = mix(o, o2, uFilm);
          }
          o += (h12(gl_FragCoord.xy + uFrame * 17.31) - 0.5) * uGrain * (1.0 - o * 0.6);
          o += (h12(gl_FragCoord.xy * 1.37 + 5.1) - 0.5) / 255.0;
          gl_FragColor = vec4(clamp(o, 0.0, 1.0), 1.0);
        }`,
    });
    this.lutMat = new THREE.ShaderMaterial({
      uniforms: { tSrc: { value: null }, uLut: { value: new Float32Array(LUT_N + 1) }, uOn: { value: 0 }, uFade: FADE.amt, uFadeCol: FADE.col }, vertexShader: FS_VERT, depthTest: false, depthWrite: false,
      fragmentShader: /* glsl */ `uniform sampler2D tSrc; uniform float uLut[${LUT_N + 1}]; uniform float uOn; uniform float uFade; uniform vec3 uFadeCol; varying vec2 vUv;
        void main(){
          vec3 o = texture2D(tSrc, vUv).rgb;
          if (uOn > 0.5) {
            float l = dot(o, vec3(0.2126, 0.7152, 0.0722)); float x = clamp(l, 0.0, 1.0) * ${LUT_N}.0;
            int i = int(min(floor(x), ${LUT_N - 1}.0)); float fl = mix(uLut[i], uLut[i + 1], x - float(i));
            vec3 r = o * (fl / max(l, 1e-4)); float mx = max(max(r.r, r.g), r.b);
            if (mx > 1.0) r = mix(vec3(fl), r, (1.0 - fl) / max(mx - fl, 1e-4));
            o = r;
          }
          o = mix(uFadeCol, o, uFade);
          gl_FragColor = vec4(clamp(o, 0.0, 1.0), 1.0);
        }`,
    });
    this.copyMat = new THREE.ShaderMaterial({ uniforms: { tSrc: { value: null } }, vertexShader: FS_VERT, depthTest: false, depthWrite: false, fragmentShader: `uniform sampler2D tSrc; varying vec2 vUv; void main(){ gl_FragColor = texture2D(tSrc, vUv); }` });
    this.levels = num('levels', 0.8); this.lutBlend = 1; this.lutValid = false;
    this.setSize(w, h);
  }
  setSize(w, h) {
    this.w = w; this.h = h;
    [this.sceneRT, this.ldr, this.meas, ...(this.acc || []), ...(this.mips || [])].forEach((t) => t && t.dispose());
    this.ldr = new THREE.WebGLRenderTarget(w, h, { type: THREE.UnsignedByteType, colorSpace: THREE.NoColorSpace, depthBuffer: false });
    const qw = Math.max(16, w >> 2), qh = Math.max(16, h >> 2);
    this.meas = new THREE.WebGLRenderTarget(qw, qh, { type: THREE.UnsignedByteType, colorSpace: THREE.NoColorSpace, depthBuffer: false });
    this.measBuf = new Uint8Array(qw * qh * 4);
    this.sceneRT = makeRT(w, h, THREE.HalfFloatType, true);
    this.acc = [makeRT(w, h, this.accType), makeRT(w, h, this.accType)];
    this.mips = []; let mw = w, mh = h;
    for (let i = 0; i < 6; i++) { mw = Math.max(1, mw >> 1); mh = Math.max(1, mh >> 1); this.mips.push(makeRT(mw, mh, THREE.HalfFloatType)); }
    this.gradeMat.uniforms.uRes.value.set(w, h);
    this.ai = 0; this.n = 0;
  }
  begin() { this.n = 0; }
  add(scn, cam, minW = 0) {
    const r = this.r;
    r.setRenderTarget(this.sceneRT); r.clear(true, true, false); r.render(scn, cam);
    if (this.overlay) this.overlay(r);   // something drawn over the scene in each sample (the snitch, 89c-snitch.js)
    const src = this.acc[this.ai], dst = this.acc[1 - this.ai];
    this.accMat.uniforms.tNew.value = this.sceneRT.texture; this.accMat.uniforms.tPrev.value = src.texture;
    this.accMat.uniforms.uW.value = Math.max(1 / (this.n + 1), minW);
    this.quad.material = this.accMat; r.setRenderTarget(dst); this.quad.render(r);
    this.ai = 1 - this.ai; this.n++;
  }
  resolve(frame = 0, measure = false) {
    const r = this.r, hdr = this.acc[this.ai].texture;
    this.quad.material = this.downMat; let src = hdr, sw = this.w, sh = this.h;
    this.mips.forEach((m, i) => {
      this.downMat.uniforms.tSrc.value = src; this.downMat.uniforms.uTexel.value.set(1 / sw, 1 / sh); this.downMat.uniforms.uFirst.value = i === 0 ? 1 : 0;
      r.setRenderTarget(m); this.quad.render(r); src = m.texture; sw = m.width; sh = m.height;
    });
    this.quad.material = this.upMat;
    for (let i = this.mips.length - 1; i > 0; i--) {
      const s = this.mips[i]; this.upMat.uniforms.tSrc.value = s.texture; this.upMat.uniforms.uTexel.value.set(1 / s.width, 1 / s.height);
      r.setRenderTarget(this.mips[i - 1]); this.quad.render(r);
    }
    const U = this.gradeMat.uniforms;
    U.tHDR.value = hdr; U.tBloom.value = this.mips[0].texture; U.uFrame.value = frame;
    this.quad.material = this.gradeMat; r.setRenderTarget(this.ldr); this.quad.render(r);
    if (measure && this.levels > 0) {
      this.copyMat.uniforms.tSrc.value = this.ldr.texture; this.quad.material = this.copyMat; r.setRenderTarget(this.meas); this.quad.render(r);
      r.readRenderTargetPixels(this.meas, 0, 0, this.meas.width, this.meas.height, this.measBuf);
      const lut = solveToneCurve(this.measBuf, 1, this.levels), cur = this.lutMat.uniforms.uLut.value;
      if (this.lutBlend < 1 && this.lutValid) for (let i = 0; i < lut.length; i++) cur[i] += (lut[i] - cur[i]) * this.lutBlend;
      else cur.set(lut);
      this.lutValid = true;
      this.lutMat.uniforms.uOn.value = 1;
    }
    this.lutMat.uniforms.tSrc.value = this.ldr.texture; this.quad.material = this.lutMat; r.setRenderTarget(null); this.quad.render(r);
  }
}
