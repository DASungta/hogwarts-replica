// ------------------------------------------------------------------ the golden snitch: an FPV flight through the castle (docs/金色飞贼.md)
// The snitch's flight stands in for the camera tour: the camera rides just behind it like a smooth FPV drone, once round
// the whole castle and nowhere twice, fast between the sights and slow at them. Low over the loch, up the gully under the
// viaduct and over the lake-front roofs; slowly round the Astronomy Tower (the view turned in toward it); low between the
// rows of brooms on the Training Grounds under the bell towers; across the ravine and along the deck of the suspension
// bridge, through its gate, up the face of the Quad's north range and over the roof, across the Quad and in at an open
// window high on the Grand Staircase Tower; down the well past the moving flights and the portraits, through the
// half-open doors of the Great Hall, slowly the length of the hall and out at its great window (every cut is a doorway or
// a window); the clock courtyard and the Wooden Bridge; slowly round the Owlery's crown; the stone circle, the Whomping Willow and
// Hagrid's hut; into the Quidditch pitch through a goal hoop and down into the open ball trunk, and the lid comes down.
// ?cut=snitch; T in seconds.
//
// The snitch is drawn in its own pass over each sample (the main camera's near plane is 0.5 m; the snitch flies a
// metre ahead), with the same jittered projection, the sun and the scene's environment map. Its wings beat at 18 Hz;
// each sample draws them at SN_SUB moments across its share of the shutter, so a frame shows the blurred fan of a beat.
const SN = { scene: new THREE.Scene(), on: false, p: [0, 0, 0], fwd: [0, 0, -1], up: [0, 1, 0], beat: 18, r: 0.022, cam: new THREE.PerspectiveCamera(), body: null, wings: null, sun: null };
const SN_SUB = 8;
SN.cam.matrixAutoUpdate = false; SN.cam.matrixWorldAutoUpdate = false;

M.snitchGold = procMat({ name: 'snitchGold', rgb: [1.0, 0.56, 0.16], metal: 1, rough: 0.2, bump: 1, uv: true, spell: false, frag: /* glsl */ `
  // engraving on the ball's own surface (uv: u round the equator, v pole to pole): the raised seam round the middle,
  // two seams over the poles where the wings are hinged, and fine scrolling filigree between
  float u = UV.x, v = UV.y;
  float seam = 1.0 - smoothstep(0.004, 0.012, abs(v - 0.5));
  float mer = 1.0 - smoothstep(0.004, 0.012, min(abs(fract(u * 2.0 + 0.25) - 0.5), 0.5) * 0.5);
  float sw = sin(u * 6.2832 * 5.0 + 2.0 * sin(v * 3.1416 * 5.0)) * sin(v * 3.1416 * 7.0 + 1.4 * sin(u * 6.2832 * 3.0));
  float fw = fwidth(sw);   // the lines soften instead of breaking up when the ball is small on screen
  float fil = (1.0 - smoothstep(0.08, 0.22 + 1.5 * fw, abs(sw))) * mix(1.0, 0.4, smoothstep(0.3, 1.0, fw)) * smoothstep(0.03, 0.08, abs(v - 0.5)) * smoothstep(0.08, 0.2, min(v, 1.0 - v));
  cgH = seam * 0.0009 - fil * 0.0004 + mer * 0.0005;
  diffuseColor.rgb *= mix(1.0, 0.62, fil) * (1.0 + 0.12 * seam);
  cgRough = mix(0.16, 0.42, fil); cgAO = mix(1.0, 0.7, fil);
` });
// a wing: a thin blade from the hinge, a curved upper edge and a scalloped lower edge (uv: x along the span)
M.snitchWing = procMat({ name: 'snitchWing', rgb: [1.0, 0.72, 0.34], metal: 0.4, rough: 0.35, uv: true, spell: false,
  std: { transparent: true, side: THREE.DoubleSide, depthWrite: false }, frag: /* glsl */ `
  vec2 q = UV;                                   // x: 0 at the hinge to 1 at the tip, y: -1 trailing edge .. 1 leading edge
  float ang = atan(q.y * 0.35, q.x + 0.06);
  float rib = 1.0 - smoothstep(0.012, 0.03, abs(fract(ang * 7.0 + 0.5) - 0.5) * (0.4 + q.x));   // ribs fanning from the hinge
  float edge = smoothstep(0.75, 0.97, abs(q.y)) + smoothstep(0.86, 1.0, q.x);
  diffuseColor.rgb *= mix(vec3(0.9, 0.9, 0.95), vec3(1.1, 0.95, 0.75), rib) * (0.85 + 0.35 * edge);   // silver-gold membrane, gold ribs
  cgRough = mix(0.35, 0.18, max(rib, edge));
  float a = mix(0.85, 1.0, max(rib, edge));
  diffuseColor.a = a * 0.4;   // each of the SN_SUB copies across the shutter faint; where the stroke turns and slows they pile up
` });
function snWingGeo() {
  const L = 0.095, sh = new THREE.Shape();   // slender: the blade about twice the ball's width long, a third as deep
  sh.moveTo(0, 0.003);
  sh.bezierCurveTo(0.025, 0.018, 0.065, 0.018, L, 0.008);                    // leading edge, out to the tip
  const sc = 6; for (let i = 1; i <= sc; i++) {                              // the scalloped trailing edge, back to the hinge
    const x0 = L * (1 - (i - 1) / sc), x1 = L * (1 - i / sc), y = -0.006 - 0.007 * Math.sin((i / sc) * Math.PI);
    sh.quadraticCurveTo((x0 + x1) / 2, y - 0.004, x1, y * (i === sc ? 0.2 : 1));
  }
  const g = new THREE.ShapeGeometry(sh, 10), P = g.attributes.position, U = g.attributes.uv;
  for (let i = 0; i < P.count; i++) U.setXY(i, P.getX(i) / L, P.getY(i) / 0.018);
  return g;   // the blade stands in the plane through both hinges (span +x, chord +y): seen face on from in front and behind
}
function snBuild() {
  if (SN.body) return;
  SN.body = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(SN.r, 64, 40).rotateZ(Math.PI / 2), M.snitchGold);   // poles on ±x: the hinges
  const hinge = new THREE.Mesh(merge([-1, 1].map((s) => new THREE.CylinderGeometry(0.0028, 0.0042, 0.006, 12).rotateZ(Math.PI / 2).translate(s * (SN.r + 0.002), 0, 0))), M.snitchGold);
  SN.body.add(ball, hinge); SN.scene.add(SN.body);
  SN.wings = new THREE.InstancedMesh(snWingGeo(), M.snitchWing, 2 * SN_SUB); SN.wings.frustumCulled = false; SN.scene.add(SN.wings);
  SN.sun = new THREE.DirectionalLight(0xffffff, 4); SN.scene.add(SN.sun, SN.sun.target);
  SN.sun.shadow.mapSize.set(1024, 1024); SN.sun.shadow.bias = -0.0004; SN.sun.shadow.normalBias = 0.002;
  Object.assign(SN.sun.shadow.camera, { left: -0.9, right: 0.9, top: 0.9, bottom: -0.9, near: 0.5, far: 9 });
}
// pose: p position, f forward, u up (world); t the sample's time (the wings are drawn at SN_SUB moments from t on)
const _snM = new THREE.Matrix4(), _snW = new THREE.Matrix4(), _snQ = new THREE.Quaternion(), _snE = new THREE.Euler();
const _snFlip = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI), _snOne = new THREE.Vector3(1, 1, 1);
function snPose(p, f, u, t, beat = SN.beat, spread = 1, fold = 0) {   // fold: 1 = wings laid back along the ball
  SN.p = p; SN.fwd = f; SN.up = u;
  const F = new THREE.Vector3(...f).normalize(), U = new THREE.Vector3(...u), X = new THREE.Vector3().crossVectors(F, U).normalize();
  U.crossVectors(X, F);
  _snM.makeBasis(X, U, F.clone().negate()).setPosition(...p);
  SN.body.matrixAutoUpdate = false; SN.body.matrix.copy(_snM); SN.body.matrixWorldNeedsUpdate = true;
  const dt = SPK.uShut.value / SN_SUB;
  for (let k = 0; k < SN_SUB; k++) {
    const ph = (t + k * dt) * beat * Math.PI * 2, flap = (0.25 + 0.85 * Math.sin(ph)) * spread, sweep = 0.4 * Math.cos(ph) * spread;
    for (const s of [-1, 1]) {
      _snQ.setFromEuler(_snE.set((0.55 + 0.3 * Math.cos(ph)) * (1 - fold), s * sweep * (1 - fold) - s * 1.35 * fold, s * flap * (1 - fold) + s * 0.25 * fold, 'YXZ'));   // pitched up, feathering with the beat
      if (s < 0) _snQ.multiply(_snFlip);   // the left wing turned round, not mirrored (a mirror would light it from behind)
      _snW.compose(new THREE.Vector3(s * (SN.r + 0.004), 0.002, 0), _snQ, _snOne);
      SN.wings.setMatrixAt(2 * k + (s > 0 ? 1 : 0), _snW.premultiply(_snM));
    }
  }
  SN.wings.instanceMatrix.needsUpdate = true;
}
// drawn over each sample, after the scene, before it is accumulated (Pipeline.overlay)
function snOverlay(r) {
  if (!SN.on || TOUR.cut !== 'snitch') return;
  const c = SN.cam;
  c.matrixWorld.copy(camera.matrixWorld); c.matrixWorldInverse.copy(camera.matrixWorldInverse);
  c.projectionMatrix.copy(camera.projectionMatrix);
  const e = c.projectionMatrix.elements, n = 0.01, fa = 400;   // the main projection (with its jitter), a near plane of 1 cm
  e[10] = -(fa + n) / (fa - n); e[14] = (-2 * fa * n) / (fa - n);
  c.projectionMatrixInverse.copy(c.projectionMatrix).invert();
  const I = ACTIVE ? INT[ACTIVE] : null, sd = I ? I.sun.dir : SUN_DIR;
  const at = SN.shadowAt || SN.p;   // the ending: the hand's shadow in the trunk (a small shadow box round it)
  SN.sun.position.set(at[0] + sd.x * 4, at[1] + sd.y * 4, at[2] + sd.z * 4); SN.sun.target.position.set(...at); SN.sun.target.updateMatrixWorld();
  SN.sun.castShadow = !!SN.shadowAt && !ACTIVE;
  if (SN.sun.castShadow) r.shadowMap.needsUpdate = true;
  SN.sun.intensity = I ? I.sun.light.intensity * 0.6 : sunLight.intensity; SN.sun.color.copy(I ? I.sun.light.color : sunLight.color);
  SN.scene.environment = I ? I.scene.environment : scene.environment;
  SN.scene.environmentIntensity = I ? Math.max(I.scene.environmentIntensity, 0.3) * 2.5 : scene.environmentIntensity;
  r.clearDepth(); r.render(SN.scene, c);
}

// ---- the flight: a smooth curve through way points [x, y, z, speed] (centripetal Catmull-Rom: no loops or overshoot
// at tight corners), flown at a speed that changes evenly in time from each way point's to the next
function snRoute(T0, pts) {
  const n = pts.length, D = (n - 1) * 80;
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal');
  curve.arcLengthDivisions = D;
  const lens = curve.getLengths(D), L = lens[D], S = pts.map((_, i) => lens[i * 80]), T = [T0], seg = [];
  for (let i = 0; i < n - 1; i++) {   // per stretch: start time, start length, start speed, acceleration
    const va = pts[i][3], vb = pts[i + 1][3], dt = (2 * (S[i + 1] - S[i])) / Math.max(va + vb, 0.2);
    seg.push([T[i], S[i], va, (vb - va) / dt]); T.push(T[i] + dt);
  }
  const T1 = T[n - 1], _v = new THREE.Vector3();
  const sOf = (t) => {
    if (t <= T0) return 0;
    if (t >= T1) return L;
    let i = 0; while (i < seg.length - 1 && t > T[i + 1]) i++;
    const [t0, s0, v0, a] = seg[i], u = t - t0;
    return Math.min(L, s0 + v0 * u + 0.5 * a * u * u);
  };
  const atS = (sv) => { // beyond either end: straight on along the end's direction (the camera and the look ahead go there)
    if (sv <= 0 || sv >= L) { const e = sv <= 0 ? 0 : 1, p = curve.getPointAt(e), d = curve.getTangentAt(e), k = sv <= 0 ? sv : sv - L; return [p.x + d.x * k, p.y + d.y * k, p.z + d.z * k]; }
    curve.getPointAt(sv / L, _v); return [_v.x, _v.y, _v.z];
  };
  return { T0, T1, L, sOf, atS, at: (t) => atS(sOf(t)), speed: (t) => (sOf(t + 0.02) - sOf(t - 0.02)) / 0.04 };
}
const vlen = (v) => Math.hypot(v[0], v[1], v[2]), vnorm = (v) => { const l = vlen(v) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const vmix = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
// how far it banks: the sideways pull of the turn against gravity, averaged over a second (none climbing steeply). The
// samples sit closer than each one's own span, so the average slides smoothly: sparse narrow ones (0.09 s apart, 0.1 s
// wide) let a sharp change in the turn step the roll every other frame, the horizon shaking by 2-3°
function snBank(P, T) {
  let s = 0, n = 0;
  for (let k = -12; k <= 12; k++) {
    const t = T + k * 0.05, h = 0.12, p0 = P.at(t - h), p1 = P.at(t), p2 = P.at(t + h), w = 1 - Math.abs(k) / 13;
    const v = vscale(vsub(p2, p0), 1 / (2 * h)), a = [0, 1, 2].map((i) => (p2[i] - 2 * p1[i] + p0[i]) / (h * h)), sp = vlen(v);
    n += w; if (sp < 0.5) continue;
    const right = vnorm(vcross(vscale(v, 1 / sp), [0, 1, 0]));
    s += Math.atan2(vdot(a, right), 9.8) * smooth(0.15, 0.6, Math.hypot(v[0], v[2]) / sp) * w;
  }
  return s / n;
}
// the chase: the snitch on the path with a slow weave of its own, the camera `back` metres behind it along the path,
// looking a fixed way down the path (not at the weave), banking gently into the turns, a faint buzz (under a pixel).
// snLook: where the camera is and which way it looks at one moment; snChase smooths the way it looks over a quarter of a
// second each side, so the turns of the route (sharp where its curve bends hardest) come on and go off evenly
function snLook(P, T, o) {
  const back = o.back ?? 0.75, lift = o.lift ?? 0.1, sv = P.sOf(T), v = P.speed(T);
  const weave = vscale([0.05 * Math.sin(T * 1.3), 0.035 * Math.sin(T * 0.9 + 1), 0.04 * Math.sin(T * 1.1 + 2)], smooth(1, 6, v));
  const sp = vadd(P.atS(sv), weave);
  let cp = vadd(P.atS(sv - back), [0, lift, 0]), q = vmix(P.atS(sv + Math.max(6, v * 0.45)), sp, 0.25);
  { // in a tight fast turn the point 20 m on is round the corner while the snitch is just ahead: it flew out of frame and
    // back in a third of a second. Past 14° off the view the turn is eased, never more than 26°: the view follows it round.
    // Only when fast (8 .. 16 m/s): slow, in the Great Hall, the snitch is meant to rise over the banners as they fill the frame
    const dq = vnorm(vsub(q, cp)), ds = vnorm(vsub(sp, cp)), th = Math.acos(clamp(vdot(dq, ds), -1, 1)), a = 0.25, L = 0.45;
    if (th > a && v > 8) { const t2 = lerp(th, a + (L - a) * Math.tanh((th - a) / (L - a)), smooth(8, 16, v)), s = Math.sin(th);
      q = vadd(cp, vnorm(vadd(vscale(ds, Math.sin(th - t2) / s), dq, Math.sin(t2) / s)), 10); }
  }
  const fo = o.focus && o.focus(sp);   // circling a tower: turn the view in toward it, the camera stepping out so the snitch stays in frame
  if (fo && fo[1] > 0) { // only while the tower is ahead or beside: once behind, the turn toward it would point the view at
    // the ground and spin it, and the side the camera steps to is eased, not flipped (it jumped a metre across)
    const dA = vnorm(vsub(q, cp)), side = vnorm(vcross(dA, [0, 1, 0])), to = vnorm(vsub(fo[0], cp));
    const w = fo[1] * smooth(-0.95, 0.05, vdot(dA, to)), k = clamp(vdot(to, side) / 0.25, -1, 1);
    cp = vadd(cp, side, -k * w);
    q = vadd(cp, vnorm(vmix(dA, to, w)), 10);
  }
  return { cp, d: vnorm(vsub(q, cp)), sp, sv, v, back };
}
function snChase(P, T, o = {}) {
  const c = snLook(P, T, o), { cp, sp, sv, v, back } = c;
  let dd = [0, 0, 0];
  for (let j = -5; j <= 5; j++) dd = vadd(dd, j ? snLook(P, T + j * 0.05, o).d : c.d, Math.exp(-0.5 * (j * 0.05 / 0.11) ** 2));
  const q = vadd(cp, vnorm(dd), 10);
  // at most 20°, a calm craft (eased into the limit: a hard clamp jolts the roll as it hits it)
  const tc = T - back / Math.max(v, 2), bank = 0.35 * Math.tanh(snBank(P, tc) * (o.bank ?? 0.3) / 0.35);
  const shake = [0.0006 * Math.sin(T * 13) + 0.0004 * Math.sin(T * 29), 0.0005 * Math.sin(T * 11 + 1)];
  const sf = vnorm(vsub(P.atS(sv + 0.3), P.atS(sv - 0.3))), sb = 0.7 * Math.tanh(snBank(P, T));
  const right = vnorm(vcross(sf, [0, 1, 0])), su = vadd(vscale([0, 1, 0], Math.cos(sb)), right, Math.sin(sb));
  // the frame's up: the sky, as lookAt takes it, except looking near straight up or down (the gully under the viaduct),
  // where it hangs on which way the view leans and that wanders: there the picture twisted ±100°/s. Then the way the route
  // runs over 60 m steadies it (over 24 m the climb's metre of sideways wander still twisted it; at gentler slopes 60 m of
  // the stair well's spiral has no one way at all, so it is left out)
  const f = vnorm(vsub(q, cp)), fy = f[1], hd = vsub(P.atS(sv + 30), P.atS(sv - 30)), hl = Math.hypot(hd[0], hd[2]) || 1;
  const lam = 0.6 * smooth(0.9, 0.98, Math.abs(fy)), he = [f[0] + lam * hd[0] / hl, f[2] + lam * hd[2] / hl], hn = Math.hypot(he[0], he[1]) || 1;
  const up = vnorm([-fy * he[0] / hn, 1, -fy * he[1] / hn]);
  return { p: cp, q, up, roll: -bank, shake, sp, sf, su, beat: lerp(9, 16, smooth(1, 12, v)), v };
}

// ---- debug for tools/probe.mjs: the distance from p to the nearest surface (a 6-face distance render; additive and
// transparent things ignored). snCheck(P, T0, T1, dt) walks a route and lists where it comes within 1.5 m of anything.
let _snD = null;
function snClear(p, room = null) {
  if (!_snD) {
    _snD = { rt: new THREE.WebGLRenderTarget(40, 40, { type: THREE.FloatType }), buf: new Float32Array(40 * 40 * 4), cam: new THREE.PerspectiveCamera(90, 1, 0.05, 2000),
      mat: new THREE.ShaderMaterial({ uniforms: { uRef: { value: new THREE.Vector3() } }, side: THREE.DoubleSide,
        vertexShader: '#include <common>\nvarying vec3 vW;\nvoid main(){\n#include <begin_vertex>\n#include <project_vertex>\nvec4 w = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\nw = instanceMatrix * w;\n#endif\nvW = (modelMatrix * w).xyz;\n}',
        fragmentShader: 'uniform vec3 uRef; varying vec3 vW; void main(){ gl_FragColor = vec4(length(vW - uRef), 0.0, 0.0, 1.0); }' }) };
  }
  const D = _snD, sc = room ? INT[room].scene : scene, hidden = [];
  sc.traverse((o) => { if (o.isMesh && o.visible && (o.material.transparent || o.material.blending === THREE.AdditiveBlending || o === sky)) { hidden.push(o); o.visible = false; } });
  D.mat.uniforms.uRef.value.set(...p); sc.overrideMaterial = D.mat;
  let best = 1e9;
  for (const d of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    D.cam.position.set(...p); D.cam.up.set(...(Math.abs(d[1]) > 0.5 ? [0, 0, 1] : [0, 1, 0])); D.cam.lookAt(p[0] + d[0], p[1] + d[1], p[2] + d[2]); D.cam.updateMatrixWorld();
    renderer.setRenderTarget(D.rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(sc, D.cam);
    renderer.readRenderTargetPixels(D.rt, 0, 0, 40, 40, D.buf);
    for (let i = 0; i < D.buf.length; i += 4) if (D.buf[i + 3] > 0.5 && D.buf[i] < best) best = D.buf[i];
  }
  sc.overrideMaterial = null; for (const o of hidden) o.visible = true; renderer.setRenderTarget(null);
  return best;
}
function snCheck(P, T0, T1, dt = 0.1, room = null, warn = 1.5) {
  const out = [];
  for (let T = T0; T <= T1 + 1e-6; T += dt) { const p = P.at(T), d = snClear(p, room); if (d < warn) out.push(`T${T.toFixed(2)} d=${d.toFixed(2)} at ${p.map((x) => x.toFixed(1)).join(',')}`); }
  return out.join('\n') || 'clear';
}

// ---- the ending: the ball trunk on the pitch, drawn in the snitch's pass (the camera comes within a metre of it)
M.velvet = procMat({ name: 'velvet', rgb: [0.3, 0.02, 0.035], rough: 0.95, frag: /* glsl */ `
  float f = 1.0 - abs(dot(N, normalize(cameraPosition - P)));   // velvet: brighter where the pile is seen side-on
  diffuseColor.rgb *= 0.6 + 1.5 * f * f + 0.15 * cgVn(P * 300.0); cgSpec = 0.15;
` });
M.quaffle = procMat({ name: 'quaffle', rgb: [0.085, 0.017, 0.012], rough: 0.62, bump: 1, uv: true, frag: /* glsl */ `
  // dark red leather in eight panels: stitched seams along three great circles (from the sphere's own uv), creased and
  // scuffed paler where it has been thrown and caught
  float ph = UV.x * 6.2832, th = UV.y * 3.1416; vec3 n = vec3(cos(ph) * sin(th), cos(th), sin(ph) * sin(th));
  float seam = 1.0 - smoothstep(0.012, 0.03, min(min(abs(n.x), abs(n.y)), abs(n.z)));
  float stitch = seam * step(0.5, fract((n.x + n.y * 1.7 + n.z * 2.3) * 60.0));
  float scuff = smoothstep(0.58, 0.8, cgVn(n * 7.0)) * (0.6 + 0.4 * cgVn(n * 40.0)), crease = cgVn(n * vec3(30.0, 90.0, 30.0));
  diffuseColor.rgb *= mix(1.0, 0.5, seam) * (1.0 + 0.5 * stitch) * mix(1.0, 1.3, scuff) * (0.88 + 0.2 * crease);
  cgH = -seam * 0.0015 + crease * 0.0003; cgRough = mix(0.55, 0.8, scuff);
` });
M.bludger = procMat({ name: 'bludger', rgb: [0.03, 0.03, 0.034], metal: 0.75, rough: 0.45, bump: 1,
  vhead: 'varying vec3 vLoc;\n', vert: 'vLoc = position;\n', head: 'varying vec3 vLoc;\n', frag: /* glsl */ `
  // cast iron, hammered and pitted, worn bright where it has been hit (its own coordinates: it shakes)
  float w = smoothstep(0.62, 0.82, cgVn(vLoc * 22.0));
  diffuseColor.rgb *= mix(1.0, 2.6, w);
  cgH = cgVn(vLoc * 90.0) * 0.0012 - smoothstep(0.75, 0.9, cgVn(vLoc * 55.0)) * 0.0015; cgRough = mix(0.5, 0.25, w) + 0.15 * cgVn(vLoc * 30.0);
` });
M.strap = procMat({ name: 'strap', rgb: [0.13, 0.065, 0.03], rough: 0.55, bump: 1, frag: /* glsl */ `
  diffuseColor.rgb *= 0.8 + 0.3 * cgVn(P * 200.0); cgH = cgVn(P * 900.0) * 0.0001;
` });
M.batwood = procMat({ name: 'batwood', rgb: [0.3, 0.17, 0.08], rough: 0.5, uv: true, frag: /* glsl */ `
  diffuseColor.rgb *= 0.8 + 0.35 * cgVn(vec3(UV.y * 80.0, UV.x * 3.0, 0.0)) * (0.7 + 0.3 * cgVn(P * 60.0));
` });
// the ball trunk (Wood opens it on the pitch in the first film): oak, brass corners, leather straps round it; red velvet
// inside with the Quaffle in its ring, the snitch's small round bed in the middle, and the two Bludgers, each held down by
// two crossed leather straps buckled to the floor, bucking and straining against them so hard the whole trunk rattles; the
// Beaters' two bats strapped inside the lid. Local frame: x along its length, z front (-) to back (+), y up.
const TRUNK = { g: null, body: null, lid: null, slot: [0, 0.135, 0], W: 0.92, D: 0.5, H: 0.36, F: 0.12, bl: [] };
function trunkBuild() {
  if (TRUNK.g) return;
  const g = new THREE.Group(); g.visible = false; SN.scene.add(g); TRUNK.g = g;
  const body = new THREE.Group(); g.add(body); TRUNK.body = body;
  const { W, D, H, F } = TRUNK, t = 0.022;
  const box = (w, h, d, x, y, z, m, r = 0.004) => { const ms = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, r), m); ms.position.set(x, y, z); ms.castShadow = ms.receiveShadow = true; return ms; };
  body.add(box(W, t, D, 0, t / 2, 0, M.oak), box(W, H, t, 0, H / 2, -D / 2 + t / 2, M.oak), box(W, H, t, 0, H / 2, D / 2 - t / 2, M.oak),
    box(t, H, D, -W / 2 + t / 2, H / 2, 0, M.oak), box(t, H, D, W / 2 - t / 2, H / 2, 0, M.oak));
  body.add(box(W - 2 * t, 0.012, D - 2 * t, 0, F - 0.006, 0, M.velvet, 0.003));                                 // the velvet bed
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const y of [0.03, H - 0.03]) body.add(box(0.05, 0.05, 0.05, sx * (W / 2 - 0.02), y, sz * (D / 2 - 0.02), M.brass, 0.006));
  for (const sx of [-0.28, 0.28]) for (const sz of [-1, 1]) body.add(box(0.05, H + 0.004, 0.006, sx, H / 2, sz * (D / 2 + 0.003), M.strap, 0.002));   // straps round the box
  const sph = (r, x, y, z, m, seg = 48) => { const ms = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.67)), m); ms.position.set(x, y, z); ms.castShadow = ms.receiveShadow = true; body.add(ms); return ms; };
  const ring = (R, x, z, tube = 0.012) => { const m = new THREE.Mesh(new THREE.TorusGeometry(R, tube, 10, 48).rotateX(Math.PI / 2), M.velvet); m.position.set(x, F + 0.004, z); body.add(m); };
  sph(0.11, -0.25, F + 0.08, 0, M.quaffle); ring(0.13, -0.25, 0);
  const bed = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 12, 40).rotateX(Math.PI / 2), M.velvet); bed.position.set(0, F + 0.01, 0); body.add(bed);
  // the Bludgers: each in a velvet ring, under two crossed straps (an arc over the ball and a tail from each end down to the
  // floor, re-laid every sample as the ball bucks), buckled at one end
  const RB = 0.09, arcA = 1.2, link = new THREE.BoxGeometry(0.006, 1, 0.028).translate(0, 0.5, 0);
  TRUNK.bl = [];
  for (const [k, bz] of [[0, -0.12], [1, 0.12]]) {
    const c = [0.27, F + RB - 0.022, bz], ball = sph(RB, ...c, M.bludger, 40); ring(RB + 0.025, c[0], c[2], 0.01);
    const straps = [];
    for (const psi of [Math.PI / 4, -Math.PI / 4]) {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(RB + 0.005, 0.0035, 4, 24, 2 * arcA).rotateZ(Math.PI / 2 - arcA).scale(1, 1, 4).rotateY(psi), M.strap);
      arc.castShadow = true; arc.position.set(...c); body.add(arc);
      const u = [Math.cos(psi), 0, -Math.sin(psi)], n = [Math.sin(psi), 0, Math.cos(psi)], ends = [], tails = [];
      for (const s of [-1, 1]) {
        const a = [c[0] + s * u[0] * (RB + 0.04), F + 0.003, c[2] + s * u[2] * (RB + 0.04)];   // where it is fixed to the floor
        ends.push(a);
        const tl = new THREE.Mesh(link, M.strap); tl.matrixAutoUpdate = false; tl.castShadow = true; body.add(tl); tails.push(tl);
        body.add(box(0.03, 0.004, 0.034, a[0] + s * u[0] * 0.012, F + 0.002, a[2] + s * u[2] * 0.012, M.strap, 0.001));   // its foot on the floor
        if (s > 0) { const b = box(0.012, 0.006, 0.036, a[0], F + 0.006, a[2], M.brass, 0.002); b.rotation.y = psi; body.add(b); }   // the buckle
      }
      straps.push({ arc, u, n, ends, tails });
    }
    TRUNK.bl.push({ ball, c, straps, R: rng('bludger' + k) });
  }
  // the lid, hinged along the back edge, with a brass plate on top; inside it the Beaters' bats under two small straps
  const lid = new THREE.Group(); lid.position.set(0, H, D / 2); body.add(lid); TRUNK.lid = lid;
  lid.add(box(W, 0.06, D, 0, 0.03, -D / 2, M.oak), box(W - 0.06, 0.006, D - 0.06, 0, -0.002, -D / 2, M.velvet, 0.002));
  for (const sx of [-0.28, 0.28]) lid.add(box(0.05, 0.068, D + 0.008, sx, 0.03, -D / 2, M.strap, 0.003));
  lid.add(box(0.12, 0.004, 0.08, 0, 0.062, -D / 2, M.brass, 0.002));
  const bat = new THREE.LatheGeometry([[0, 0], [0.013, 0.004], [0.012, 0.03], [0.011, 0.17], [0.016, 0.2], [0.026, 0.27], [0.031, 0.4], [0.03, 0.43], [0, 0.44]].map(([r, h]) => new THREE.Vector2(r, h)), 16).rotateZ(-Math.PI / 2);
  for (const [bz, flip] of [[-0.16, 1], [-0.34, -1]]) {
    const b = new THREE.Mesh(bat, M.batwood); b.position.set(-0.22 * flip, -0.036, bz); b.scale.x = flip; b.castShadow = true; lid.add(b);
    for (const bx of [-0.12, 0.12]) lid.add(box(0.03, 0.006, 0.075, bx, -0.07 + 0.004, bz, M.strap, 0.002));
  }
  // a soft contact shadow on the grass
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.6, D * 1.9).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ transparent: true, depthWrite: false,
    vertexShader: 'varying vec2 v; void main(){ v = uv * 2.0 - 1.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'varying vec2 v; void main(){ float d = max(abs(v.x), abs(v.y)) * 1.25; gl_FragColor = vec4(0.0, 0.0, 0.0, 0.55 * (1.0 - smoothstep(0.55, 1.0, d))); }' }));
  sh.position.y = 0.003; sh.renderOrder = -1; g.add(sh);
  // each Bludger's kicks: an uneven run of jerks, every 0.08-0.35 s, some hard, now and then a fierce heave
  for (const B of TRUNK.bl) {
    B.kicks = [];
    for (let tk = 0; tk < 30; ) { const big = B.R() < 0.2; B.kicks.push({ t: tk, s: big ? 1.4 + B.R() * 0.6 : 0.35 + B.R() * 0.65, a: B.R() * 6.2832, sp: (B.R() - 0.5) * 2 }); tk += 0.08 + B.R() * 0.27 + (big ? 0.15 : 0); }
  }
}
// the Bludgers at time t (seconds since the trunk came into the film): pressing up against the straps all the time and
// jerking against them, rolling and twisting; the straps pulled taut; the trunk rocking on its far end and bouncing
const _tM = new THREE.Matrix4(), _tX = new THREE.Vector3(), _tY = new THREE.Vector3(), _tZ = new THREE.Vector3();
function trunkMove(t) {
  if (!TRUNK.body) return 0;
  const { F, W } = TRUNK, lifts = [];
  for (const B of TRUNK.bl) {
    let up = 0.006 + 0.003 * Math.sin(t * 23 + B.c[2] * 40), dx = 0, dz = 0, rx = 0, ry = 0, rz = 0;
    for (const k of B.kicks) {
      const u = t - k.t; if (u < 0) break; if (u > 0.6) continue;
      const e = (u / 0.035) * Math.exp(1 - u / 0.035), osc = Math.exp(-u / 0.12) * Math.sin(u * 2 * Math.PI * 11);   // a jolt and its rattle
      up += k.s * (0.034 * e + 0.005 * osc);
      dx += k.s * 0.017 * Math.cos(k.a) * (e + 0.6 * osc); dz += k.s * 0.017 * Math.sin(k.a) * (e + 0.6 * osc);
      ry += k.sp * k.s * 0.5 * e; rx += k.s * 0.25 * Math.sin(k.a) * e; rz -= k.s * 0.25 * Math.cos(k.a) * e;
    }
    up *= clamp(TRUNK.lid.rotation.x / 0.5, 0.25, 1);   // the lid coming down presses them back
    up = 0.056 * Math.tanh(up / 0.056); dx = 0.024 * Math.tanh(dx / 0.024); dz = 0.024 * Math.tanh(dz / 0.024);   // the straps hold it
    lifts.push(up);
    const p = [B.c[0] + dx, B.c[1] + up, B.c[2] + dz];
    B.ball.position.set(...p); B.ball.rotation.set(rx, ry, rz);
    for (const S of B.straps) {
      S.arc.position.set(...p);
      S.ends.forEach((a, j) => { // the tail from the floor to the arc's end, its face across the strap
        const s = j ? 1 : -1, R = 0.095, e = [p[0] + s * S.u[0] * R * Math.sin(1.2), p[1] + R * Math.cos(1.2), p[2] + s * S.u[2] * R * Math.sin(1.2)];
        _tY.set(e[0] - a[0], e[1] - a[1], e[2] - a[2]); const L = _tY.length(); _tY.normalize();
        _tZ.set(...S.n); _tX.crossVectors(_tY, _tZ).normalize(); _tZ.crossVectors(_tX, _tY);
        S.tails[j].matrix.makeBasis(_tX, _tY.clone().multiplyScalar(L), _tZ).setPosition(...a);
      });
    }
  }
  // the trunk rocks up at the Bludgers' end on its far edge and bounces with them
  const l = lifts[0] + lifts[1], d = lifts[1] - lifts[0];
  TRUNK.body.position.set(0, 0, 0); TRUNK.body.rotation.set(0.18 * d, 0, 0.14 * l);
  _tX.set(-W / 2, 0, 0); TRUNK.body.position.copy(_tX).sub(_tX.clone().applyEuler(TRUNK.body.rotation)).add(_tY.set(0, 0.04 * Math.max(0, l - 0.03), 0));
  TRUNK.body.updateMatrix();
  const sl = new THREE.Vector3(...TRUNK.slot).applyMatrix4(TRUNK.body.matrix);
  return [sl.x - TRUNK.slot[0], sl.y - TRUNK.slot[1], sl.z - TRUNK.slot[2]];   // how the snitch's bed moves (local)
}

// ---- the route
const SNF = {};   // the flight's routes, built once the grounds are (heights come from the terrain)
// the stair well's descending turn and a quarter: heights and radii of its way points, every 28 degrees from the top
// (searched so it keeps 1.5 m from every flight, the swinging one at any angle, and the galleries)
const SNF_ST = { Y: [83.5, 77.6, 72.4, 67.9, 63.66, 59.6, 55.75, 52.06, 48.16, 43.55, 37.52, 30.33, 24.07, 19.33, 15.36, 11.72, 8.0],
  R: [6.6, 6.77, 6.86, 6.86, 6.81, 6.74, 6.68, 6.62, 6.6, 6.61, 6.63, 6.64, 6.64, 6.62, 6.6, 6.6, 6.6] };
const SN_SUN = new THREE.Vector3(0.5, 0.42, 0.76).normalize();   // a morning sun, low in the south-east: the lake front and the west lit
// the owls over the Owlery as the snitch circles its crown (89b-dusk.js draws them and flies them on loose wandering loops):
// a loose flock both ways round, some low by the crown, some high above it, three passing within 7-9 m of the camera.
// Picked from 2600 random loops: each keeps 4.5 m from the camera, 4 m from the snitch, 2.5 m from the tower and 3 m from
// every other owl, and no two fly side by side; chosen for screen time spread through the stretch, near, middle and far.
// [radius, height over the rock's top, speed m/s (- the snitch's way round), start angle, phase, squash, drift, swell,
// rise and fall (m), wing beats per second, kind (0 barn, 1 tawny, 2 snowy)]
const SN_OWLS = [[16.461, 23.58, -9.865, 0.785, 0.252, 0.242, 1.655, 0.125, 2.503, 3.257, 0], [26.142, 16.523, 7.374, 4.076, 5.563, 0.348, 4.823, 0.23, 1.323, 2.945, 1],
  [29.621, 42.961, 7.401, 1.262, 0.033, 0.118, 2.349, 0.164, 1.425, 2.95, 0], [17.819, 24.921, -7.776, 2.415, 4.781, 0.241, 4.258, 0.226, 1.526, 2.986, 1],
  [32.998, 14.028, 7.432, 5.459, 1.657, 0.268, 4.185, 0.156, 2.858, 2.674, 0], [14.505, 38.03, -9.464, 5.42, 4.159, 0.053, 2.136, 0.265, 1.741, 3.187, 1],
  [16.376, 29.025, 6.872, 4.059, 4.048, 0.087, 2.749, 0.26, 1.289, 2.737, 0], [18.064, 31.998, -7.014, 5.999, 4.56, 0.07, 3.851, 0.128, 2.009, 2.936, 2],
  [18.891, 17.577, -8.536, 2.122, 0.053, 0.106, 2.377, 0.193, 2.169, 2.929, 0], [27.358, 32.002, 8.394, 1.303, 5.524, 0.237, 1.666, 0.124, 2.063, 2.483, 1],
  [12.115, 30.275, 6.372, 0.888, 0.672, 0.11, 1.908, 0.18, 2.946, 3.098, 0], [20.885, 33.674, -7.641, 5.487, 1.485, 0.069, 3.1, 0.255, 2.938, 2.947, 1]];
function snOwls() {
  const [ox, oz] = SITE_BY.owlery.circle;
  return SN_OWLS.map(([r, h, w, a0, p, e, drift, br, bob, f, kind]) => ({ r, h: OWL_TOP + h, w, a0, p, e, drift, br, bob, f, kind, ox, oz, sc: kind === 2 ? 1.2 : 1 }));
}
function snPaths() {
  if (SNF.a) return SNF;
  const W0 = LAKE_Y, g = (x, z, h, v) => [x, groundH(x, z) + h, z, v], OT = OWL_TOP;
  const [[ax, az], [bx, bz]] = SITE_BY.suspension.line, yA = groundH(ax, az) + 1.2, yB = groundH(bx, bz) + 1.0;   // the bridge deck (as 58-centre.js)
  const deck = (z) => { const t = (az - z) / (az - bz); return lerp(yA, yB, t) - 2.4 * 4 * t * (1 - t); };
  SNF.H0 = [14, W0 + 2.6, 222];   // where it hangs over the loch at the start, the castle up behind it
  // One loop, nowhere flown twice; fast between the sights, slow at them. A: over the loch, past the boathouse, over the
  // shore stairs, up the gully under the viaduct's arches and over its parapet; over the lake-front roofs, east over the
  // greenhouses and round the bell towers, down onto the Training Grounds and low between the two rows of brooms, out
  // over the west curtain wall; slowly round the Astronomy Tower (east, north); across the ravine and back south past the
  // suspension bridge, skimming along beside it; up the face of the Quad's north range and over the ridge; across the
  // Quad to the Grand Staircase Tower's tall windows, in at the open one
  const gw = GT_WIN.a, gn = [Math.cos(gw), 0, Math.sin(gw)], gr = SITE_BY.grand.circle;
  const GW = (d, v) => [gr[0] + gn[0] * (gr[2] + d), GT_WIN.y + 2.3, gr[1] + gn[2] * (gr[2] + d), v];   // d metres out from the open window
  const lawnY = groundH(185, -53.5);
  SNF.a = snRoute(2.6, [[...SNF.H0, 0], [14, W0 + 2.2, 210, 20], [17, W0 + 1.8, 170, 50], [24, W0 + 1.8, 136, 50], [32, W0 + 2, 120, 40], [34, W0 + 2.6, 108, 33],
    [18, W0 + 3.2, 101, 30], [10, -49, 96, 29], [6, -46, 86, 29], [4, -45, 70, 30], [5, -28, 58, 30], [6, -6, 54, 29], [5, 8, 50, 28],
    [22, 42, 40, 34], [40, 52, 18, 46], [80, 50, 22, 56], [128, 38, 24, 58], [168, 30, 21, 52], [196, 24, 9, 42], [208, 15, -14, 33], [215, lawnY + 8, -38, 24],
    [209, lawnY + 3.0, -52.8, 15], [192, lawnY + 2.2, -53.5, 13], [176, lawnY + 2.3, -53.6, 14], [164, lawnY + 4.5, -53.8, 22], [154, lawnY + 9.5, -53.8, 28], [140, 16, -53, 36], [118, 32, -50, 44],
    [86, 50, -44, 24], [70, 62, -58, 17], [50, 70, -62, 16], [32, 66, -56, 20], [24, 50, -82, 38], [14, 30, -112, 44], [4, 16, -128, 36],
    [-6, 9, -116, 29], [-10.5, 6, -98, 26], [-11, deck(-81) + 4, -81, 24], [-11.5, 6, -64, 22], [-13, 7.5, -51, 19],
    [-16.5, 11.5, -45.6, 19], [-21.5, 18.5, -44.5, 19], [-26, 25.5, -44.2, 19], [-28.6, 31.2, -40.4, 19], [-29.6, 34.2, -36.4, 20],
    [-30.6, 35, -24, 22], [-31.8, 36.6, -10, 18], GW(8.5, 13), GW(3, 11), GW(0, 10)]);
  // ST: the Grand Staircase (the stair set: well ±8.6 m, a floor every 10 m, west wall x -12 with the top floor's open
  // window, the Great Hall doors in the south wall at z -12 .. -13.5): in at the window over the top gallery, round
  // into a wide turn and a quarter down the well past the moving flights and the portraits, down to the Entrance Hall
  // and through the half-open doors
  SNF.st = snRoute(SNF.a.T1, (() => {
    const out = [[-11.05, 84.7, 0, 9], [-8.2, 84.5, 0.5, 9.5]], { Y, R } = SNF_ST, N = Y.length - 1;
    for (let k = 0; k <= N; k++) { const a = Math.PI * 2.5 * (1 - k / N); out.push([R[k] * Math.cos(a), Y[k], R[k] * Math.sin(a), 13.5]); }
    out.splice(2, 0, [lerp(-8.2, out[2][0], 0.55), lerp(84.5, out[2][1], 0.5), lerp(0.5, out[2][2], 0.55), 11]);
    out.push([lerp(out[out.length - 1][0], 0, 0.45), 5.0, lerp(out[out.length - 1][2], -12.9, 0.4), 9.5], [0.9, 3.2, -9.8, 8.5], [0, 2.9, -12.9, 8]);
    return out;
  })());
  // B: the Great Hall (its own coordinates: doors at z 0 .. 1.6, dais at -40): in through the half-open doors (the stair
  // set's z -12.9 is the hall's 0.6), under the first row of house banners (one over each table), up to the second row
  // (z -17.5) and slowly in toward it at the height of the crests, all four in frame, then between the middle two; down
  // among the floating candles the length of the hall, up over the high table and out through the great window
  SNF.b = snRoute(SNF.st.T1, [[0, 2.9, 0.6, 8], [0, 3.3, -1.6, 8], [0, 5.4, -4.4, 7.5], [0, 8.6, -8.5, 7], [0, 12.4, -11.2, 5.2], [0, 14.9, -12.1, 2.6], [0, 15.1, -13.3, 2.0],
    [0, 14.9, -15.4, 2.8], [0, 14.2, -17.5, 4], [0, 11.6, -19.8, 6], [0, 7.0, -22.8, 7.5], [-0.3, 4.4, -27, 7.5], [0.2, 3.9, -32.5, 7.5], [0, 6.5, -37.5, 7], [0, 9.5, -40.6, 7]]);
  // C: out of the hall's west window; into the clock courtyard past the eagle fountain, out through the gate along the
  // Wooden Bridge; slowly round the crown of the Owlery on its rock; the stone circle, the Whomping Willow, Hagrid's hut;
  // into the pitch through the east middle hoop and down the pitch to the open trunk
  const c = Math.cos(PITCH.rot), s = Math.sin(PITCH.rot), Wp = (u, v, h, sp) => [PITCH.cx + u * c - v * s, PITCH.y + h, PITCH.cz + u * s + v * c, sp];
  SNF.c = snRoute(SNF.b.T1, [[-131, 11, 32, 12], [-140, 12, 28, 22], [-152, 15, 14, 28], [-165, 17, -2, 22], [-172, 8, -16, 15], [-182, 5, -18.5, 13],
    [-192, 4, -21.3, 15], [-201, 3.4, -22, 20], [-232, 3.4, -22, 36], [-262, 3.4, -22, 40], [-294, 3.4, -24.95, 40], [-326, 3.4, -28, 32],
    [-338, 6, -40, 24], [-322, 18, -72, 34], [-292, OT + 14, -112, 30], [-281, OT + 24, -140, 21], [-290, OT + 28, -162, 19.5], [-312, OT + 28, -167, 19.5],
    [-326, OT + 22, -146, 22], [-336, OT + 10, -116, 34], [-350, 18, -84, 42], g(-364, -48, 6, 44), g(-372, -30, 4, 32), g(-382, -11, 4, 36),
    g(-400, 10, 4.5, 42), g(-420, 38, 3.5, 32), g(-436, 50, 3.2, 21), g(-441, 70, 4.5, 26), g(-468, 94, 9, 40),
    Wp(100, 0, 38, 40), Wp(86, 0, 31, 33), Wp(74, 0, 21.4, 26), Wp(58, 0, 10, 21), Wp(42, 0, 3.5, 16), Wp(28, 0, 1.4, 10),
    Wp(21, 0, 0.75, 4.5), Wp(17.4, 0, 0.47, 2.2), Wp(16, 0, 0.44, 0)]);
  SNF.d = [-c, 0, -s];   // its last run: along the pitch from the east end
  SNF.trunk = Wp(16, 0, 0).slice(0, 3);   // the open trunk on the grass, its front toward the incoming snitch
  return SNF;
}

// ---- the ending, t seconds after it comes to a stop over the open trunk: it hangs a moment, drops into its bed, folds
// its wings; the lid comes down; black. The camera eases up from the chase to look down into the trunk.
function snEnding(F, t, bed = [0, 0, 0]) {   // bed: how the trunk's rattling moves the snitch's bed (trunk frame)
  const P = F.c, Tc = P.T1, D = F.d, UP = [0, 1, 0], X = vnorm(vcross(UP, D));
  const slot = vadd(F.trunk, UP, TRUNK.slot[1] + 0.024), hang = P.atS(P.L);
  const r = { sf: D, su: UP, spread: 1, fold: 0, beat: 9 };
  r.sp = vmix(hang, slot, easeIO((t - 0.35) / 0.5));
  if (t < 0.35) r.sp = vadd(hang, UP, 0.006 * Math.sin(t * 9));
  r.sp = vadd(r.sp, vadd(vadd(vscale(X, bed[0]), UP, bed[1]), D, bed[2]), smooth(0.7, 0.85, t));
  r.fold = smooth(0.7, 1.3, t); r.beat = lerp(9, 3, smooth(0.7, 1.3, t));
  r.lid = lerp(1.95, 0, Math.pow(clamp((t - 1.6) / 1.15, 0, 1), 1.8)) + 0.05 * Math.sin(clamp((t - 2.75) / 0.25, 0, 1) * Math.PI) * (t > 2.75 ? 1 : 0);
  // the camera eases up and over to look down into the trunk, a little toward the Bludgers' end so they are in frame
  // (the view's direction turned evenly from the chase's to the trunk's: mixing the two points it looked at instead put all
  // the tilt in the last few frames as the camera closed in, and it stopped with a jolt)
  const V = vadd(vadd(vadd(F.trunk, UP, 0.72), D, -0.34), X, 0.05), ch = snChase(P, Math.min(Tc + t, Tc)), k = easeIO((t + 1.0) / 1.6);
  const cp = vmix(ch.p, vadd(V, UP, -0.04 * smooth(1.0, 2.8, t)), k), L = vadd(vmix(r.sp, slot, 0.5), X, 0.07);
  const d0 = vnorm(vsub(ch.q, ch.p)), d1 = vnorm(vsub(L, cp)), th = Math.acos(clamp(vdot(d0, d1), -1, 1));
  const dir = th < 1e-4 ? d1 : vnorm(vadd(vscale(d0, Math.sin((1 - k) * th)), d1, Math.sin(k * th)));
  r.cam = { p: cp, q: vadd(cp, dir, vlen(vsub(L, cp))), up: ch.up, roll: ch.roll * (1 - k), shake: ch.shake };
  r.fov = lerp(70, 60, k);
  r.fade = 1 - smooth(2.55, 2.9, t);
  return r;
}
function snitchShots() {
  snBuild(); trunkBuild(); const F = snPaths();
  buildOwls(); owlFlock(snOwls());
  // the Whomping Willow lashes at the snitch as it passes: two limbs strike out at it a second before, a third sweeps
  // over it as it goes by (searched: the whips come within 3.3 m of it and the camera, never closer)
  { const [wx, , wz] = WILLOW.c; let tn = 0, dn = 1e9; for (let T = F.c.T0; T < F.c.T1; T += 0.02) { const p = F.c.at(T), d = Math.hypot(p[0] - wx, p[2] - wz); if (d < dn) { dn = d; tn = T; } }
    WILLOW.strikes = [{ i: 6, t0: tn - 1.25, A: 1.2 }, { i: 0, t0: tn - 1.0, A: 1.2 }, { i: 1, t0: tn - 0.5, A: 1.2 }]; }
  if (HALL_BANNERS) HALL_BANNERS.visible = true;   // the house banners hang in the hall in this cut (later films)
  if (HALL_CASEMENT) HALL_CASEMENT.rotation.y = 1.25;   // the great window's casement swung out: the way out of the hall
  snLabelsBuild(F);
  pipeline.overlay = snOverlay;
  const FOV = 70;
  // 1. it hangs over the loch facing us, turns and is off: the camera, close in front, swings round behind it and gives chase
  const intro = (T) => {
    const hov = [F.H0[0] + 0.02 * Math.sin(T * 2.1), F.H0[1] + 0.015 * Math.sin(T * 2.9), F.H0[2] + 0.012 * Math.sin(T * 1.7)];
    const turn = easeIO((T - 1.7) / 0.8), face = vnorm(vmix([0.25, 0.05, 1], [0.1, 0.0, -1], turn));
    const cam0 = { p: vadd(F.H0, [0.07 - 0.03 * T / 2.6, 0.0, 0.36 - 0.04 * T / 2.6]), q: vadd(F.H0, [-0.05, 0.13, -0.6]) };   // the snitch low in frame, the castle above it
    if (T < 2.6) return { cam: cam0, sp: hov, sf: face, su: [0, 1, 0], fov: 46, beat: 9 };
    const ch = snChase(F.a, T), k = easeIO((T - 2.6) / 1.2);
    return { cam: { p: vmix(cam0.p, ch.p, k), q: vmix(cam0.q, ch.q, k), up: vnorm(vmix([0, 1, 0], ch.up, k)), roll: ch.roll * k, shake: ch.shake }, sp: ch.sp, sf: ch.sf, su: ch.su, fov: lerp(46, FOV, k), beat: ch.beat };
  };
  const chase = (P, o) => (T) => { const ch = snChase(P, T, o); return { cam: ch, sp: ch.sp, sf: ch.sf, su: ch.su, fov: FOV, beat: ch.beat }; };
  const owl = (p) => [[-300, OWL_TOP + 26, -140], 0.5 * (1 - smooth(30, 52, Math.hypot(p[0] + 300, p[2] + 140)))];   // the Owlery's crown
  // 7. into the trunk
  const Tc = F.c.T1, END = Tc + 6.6;
  const out = (T) => {
    const t = T - Tc;
    TRUNK.g.visible = T > Tc - 14; SN.shadowAt = t > -2 ? F.trunk : null;
    const bed = trunkMove(T - Tc + 14);   // the Bludgers struggling against their straps
    if (t < -1.0) { TRUNK.lid.rotation.x = 1.95; const ch = snChase(F.c, T, { focus: owl }); return { cam: ch, sp: ch.sp, sf: ch.sf, su: ch.su, fov: FOV, beat: ch.beat }; }
    const e = snEnding(F, t, bed), ch = snChase(F.c, Math.min(T, Tc));
    TRUNK.lid.rotation.x = e.lid;
    return { cam: e.cam, sp: t < 0 ? ch.sp : e.sp, sf: t < 0 ? ch.sf : e.sf, su: t < 0 ? ch.su : e.su, fov: e.fov, beat: t < 0 ? ch.beat : e.beat, fold: e.fold, fade: e.fade };
  };
  const shot = (name, t0, t1, rig, o = {}) => ({ name, dur: t1 - t0, night: false, morning: true, fleet: false, scene: o.scene, bloom: 0.07, ...o,
    keys: [K(0, [0, 0, 0], [0, 0, -1], FOV)],
    rig: (lt) => { const r = rig(t0 + lt); return { p: r.cam.p, q: r.cam.q, up: r.cam.up, f: r.fov, roll: r.cam.roll, shake: r.cam.shake, fade: r.fade, snitch: r }; },
    enter: () => { BOB.uBob.value = o.bob ?? 0; setSunDir(SN_SUN); captureEnv(); Object.assign(sunLight.shadow.camera, { left: -150, right: 150, top: 150, bottom: -150 }); sunLight.shadow.camera.updateProjectionMatrix(); },
    update: () => { INTSKY.uCeil.value = o.ceil ?? -1; },
    after: (R, t) => snApply(R.snitch, t),
  });
  // the cut through the Great Hall doors: the light of the hall floods the doorway as it comes through
  const flash = [1.0, 0.86, 0.66];
  const stairs = shot('stairs', F.st.T0, F.st.T1, (T) => ({ ...chase(F.st)(T), fade: 1 - 0.4 * smooth(F.st.T1 - 0.35, F.st.T1, T) }), { scene: 'stair', exp: 0.9, fadeCol: flash });
  // the floating candles drift up and down, ±18 cm (the dusk short's ±6 cm hardly shows flying through at 7 m/s; searched:
  // the snitch and the camera still pass the nearest a quarter of a metre off)
  const hall = shot('greathall', F.b.T0, F.b.T1, (T) => ({ ...chase(F.b)(T), fade: 0.6 + 0.4 * smooth(F.b.T0, F.b.T0 + 0.45, T) }), { scene: 'hall', ceil: 0, exp: 0.82, fadeCol: flash, bob: 3 });
  stairs.update = () => { INTSKY.uCeil.value = -1; stairMove(SPK.uT.value - F.st.T0); };   // every flight moving, as in the films
  // round the Astronomy Tower the view turns in to it, letting go across its north side (x 56 .. 42), before the route
  // swings hard away south-west: let go in the swing, the two turns came at once, 360°/s
  const loch = shot('loch', 0, F.a.T1, (T) => (T < 3.8 ? intro(T) : chase(F.a, { focus: (p) => [[50, p[1] + 4, -34], 0.5 * (1 - smooth(28, 50, Math.hypot(p[0] - 50, p[2] + 34))) * smooth(42, 56, p[0])] })(T)), { fadeIn: 1.0 });
  // the end card: just the school's name, the producer's credit and where the replica was drawn from
  const grounds = shot('grounds', F.c.T0, END, out, { title: [Tc + 3.2 - F.c.T0, END - F.c.T0 - 0.2], titleCard: { en: 'Hogwarts', zh: '霍格沃茨', by: '出品人　@dasungta_zhang',
    src: '参考：拍摄模型照片（维基共享资源，Karen Roe 等摄，CC BY）· Harry Potter Wiki · 乐高 76419' } });
  loch.update = (lt) => { INTSKY.uCeil.value = -1; owlsAt(0, false); broomsMove(lt); };   // the unruly brooms on the Training Grounds
  grounds.update = (lt) => { INTSKY.uCeil.value = -1; owlsAt(F.c.T0 + lt); willowMove(F.c.T0 + lt); };   // the owls over the Owlery, the willow
  const S = [loch, stairs, hall, grounds];
  // the trunk sits on the pitch: placed once, facing the snitch's last run
  { const Dv = F.d, X = vnorm(vcross([0, 1, 0], Dv)); TRUNK.g.matrixAutoUpdate = false; TRUNK.g.matrix.makeBasis(new THREE.Vector3(...X), new THREE.Vector3(0, 1, 0), new THREE.Vector3(...Dv)).setPosition(...F.trunk); TRUNK.g.matrixWorldNeedsUpdate = true; }
  let t = 0;
  for (const s of S) { s.t0 = t; t += s.dur; }
  TOUR.dur = t;
  return S;
}
// ---- names of the famous places as they come into view: a gold ring pings on the place, a line draws out from it to the
// name in the lower corner nearest it, the Chinese name writes itself in character by character with the English under
// it, and all of it fades away. The name stays put while the line's end follows the place across the frame.
// [Chinese, English, which route, the point it passes when the name is due, seconds before or after, how long, the place]
const SN_LABEL_DEFS = [
  ['船屋', 'The Boathouse', 'a', [32, -58, 120], -2.44, 2.6, [51.5, -51, 104]],
  ['高架桥', 'The Viaduct', 'a', [6, -46, 86], -0.16, 2.6, [5, -6, 47.5]],
  ['飞行课草坪', 'The Training Grounds', 'a', [209, 0, -52.6], -1.18, 3.0, [186, -0.5, -53.5]],
  ['天文塔', 'The Astronomy Tower', 'a', [86, 50, -44], -3.22, 3.0, [50, 92, -34]],
  ['吊桥', 'The Suspension Bridge', 'a', [-11, 4, -81], -2.42, 2.6, [-20, 1, -84]],
  ['大楼梯塔', 'The Grand Staircase Tower', 'a', [-30.6, 35, -24], -1.38, 2.8, [-49, 46, 8]],
  ['会动的楼梯', 'The Moving Staircases', 'st', null, 0.8, 3.0, [0, 25, 0]],
  ['大礼堂', 'The Great Hall', 'b', null, 0.5, 2.8, [0, 13, -17.5]],
  ['钟楼庭院', 'The Clock Tower Courtyard', 'c', [-165, 17, -2], -1.92, 2.6, [-182, 2, -24]],
  ['木廊桥', 'The Wooden Bridge', 'c', [-232, 3.4, -22], -1.86, 2.6, [-280, 3, -24]],
  ['猫头鹰棚屋', 'The Owlery', 'c', [-322, 18, -72], -1.12, 3.0, [-300, 0, -140]],
  ['石圈', 'The Stone Circle', 'c', [-372, 0, -30], -3.32, 1.9, [-372, 0, -30]],
  ['打人柳', 'The Whomping Willow', 'c', [-400, 0, 10], -2.66, 2.0, [-405, 0, 8]],
  ['海格小屋', "Hagrid's Hut", 'c', [-436, 0, 50], -2.3, 2.4, [-450, 0, 62]],
  ['魁地奇球场', 'The Quidditch Pitch', 'c', [-468, 0, 94], -1.54, 2.8, [-600, 0, 166]],
];
const SN_LABEL_TEXT = SN_LABEL_DEFS.map((d) => d[0]).join('');
const SN_LABELS = [];
function snLabelsBuild(F) {
  SN_LABELS.length = 0;
  const nearT = (P, a) => { let t = P.T0, d = 1e9; for (let T = P.T0; T <= P.T1; T += 0.02) { const p = P.at(T), x = Math.hypot(p[0] - a[0], p[2] - a[2]) + (a[1] ? Math.abs(p[1] - a[1]) : 0); if (x < d) { d = x; t = T; } } return t; };
  const OT = OWL_TOP;
  for (const [zh, en, k, near, off, dur, at0] of SN_LABEL_DEFS) {
    const P = F[k], t0 = (near ? nearT(P, near) : P.T0) + off;
    let at = at0.slice();
    if (zh === '猫头鹰棚屋') at = [-300, OT + 26, -140];
    else if (zh === '魁地奇球场') at = [PITCH.cx, PITCH.y + 14, PITCH.cz];
    else if (k === 'c' && at[1] === 0) at[1] = groundH(at[0], at[2]) + (zh === '打人柳' ? 7 : zh === '海格小屋' ? 5 : 3);
    SN_LABELS.push({ zh, en, at, t0, t1: t0 + dur, side: null });
  }
}
const _lc = new THREE.PerspectiveCamera(), _lv = new THREE.Vector3();
function snLabelSide(L) { // the corner nearer the place, from where the place is on screen half a second in (deterministic)
  if (L.side) return L.side;
  const T = L.t0 + 0.5, s = TOUR.shots[tourFind(T)], R = s.rig(T - s.t0);
  _lc.fov = R.f; _lc.aspect = camera.aspect; _lc.near = 0.5; _lc.far = 9e4; _lc.position.set(...R.p); _lc.up.set(...(R.up || [0, 1, 0])); _lc.lookAt(...R.q); if (R.roll) _lc.rotateZ(R.roll);
  _lc.updateMatrixWorld(); _lc.updateProjectionMatrix(); _lv.set(...L.at).project(_lc);
  return (L.side = _lv.z < 1 && _lv.x > 0.05 ? 'r' : 'l');
}
// drawn over a finished video frame (tourFrame), the camera posed at time t
function snLabels(g, w, h, t) {
  for (const L of SN_LABELS) {
    if (t < L.t0 || t > L.t1) continue;
    const u = t - L.t0, D = L.t1 - L.t0, out = 1 - smooth(D - 0.55, D, u), side = snLabelSide(L), sd = side === 'l' ? 1 : -1;
    _lv.set(...L.at).project(camera);
    const on = _lv.z < 1 ? 1 - smooth(0.92, 1.12, Math.max(Math.abs(_lv.x), Math.abs(_lv.y))) : 0, ax = (_lv.x + 1) / 2 * w, ay = (1 - _lv.y) / 2 * h;
    const fz = Math.round(h * 0.046), fe = Math.round(h * 0.019), x0 = side === 'l' ? w * 0.07 : w * 0.93, yz = h * 0.845, yr = yz - fz * 1.28, ye = yz + h * 0.04;
    g.save();
    g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = h * 0.008;
    // the Chinese name, character by character, each rising into place
    g.font = `700 ${fz}px "Noto Serif SC", serif`; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    const chars = [...L.zh], cw = chars.map((c) => g.measureText(c).width), sp = fz * 0.16, tw = cw.reduce((a, b) => a + b, 0) + sp * (chars.length - 1);
    g.font = `${fe}px "IM Fell English SC", "Times New Roman", serif`;
    const track = lerp(0.45, 0.2, smooth(0.7, 1.6, u)) * fe; g.letterSpacing = `${track.toFixed(1)}px`;
    const ew = g.measureText(L.en).width, bw = Math.max(tw, ew) + w * 0.018;
    // the rule over the name, drawn out from the outer side; the line from its inner end to the place
    const pr = smooth(0.1, 0.55, u), xi = x0 + sd * bw, jx = lerp(x0, xi, pr);
    g.strokeStyle = '#d9b36a'; g.fillStyle = '#d9b36a'; g.lineWidth = Math.max(1, h * 0.0016); g.globalAlpha = out;
    g.beginPath(); g.moveTo(x0, yr); g.lineTo(jx, yr); g.stroke();
    g.beginPath(); g.moveTo(x0 - sd * h * 0.006, yr); g.lineTo(x0, yr - h * 0.006); g.lineTo(x0 + sd * h * 0.006, yr); g.lineTo(x0, yr + h * 0.006); g.closePath(); g.fill();   // a small lozenge at its outer end
    const pl = smooth(0.3, 0.8, u) * on;
    if (pl > 0.01) {
      g.globalAlpha = out * on; g.lineWidth = Math.max(1, h * 0.0012);
      g.beginPath(); g.moveTo(xi, yr); g.lineTo(lerp(xi, ax, pl), lerp(yr, ay, pl)); g.stroke();
      const pk = smooth(0.7, 0.95, u), r = h * 0.009 * (pk + 0.25 * Math.sin(Math.PI * pk));
      if (pk > 0) { g.beginPath(); g.arc(ax, ay, r, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(ax, ay, r * 0.35, 0, Math.PI * 2); g.fill(); }
      const q = clamp((u - 0.85) / 1.0, 0, 1);   // one ping, spreading and fading
      if (q > 0 && q < 1) { g.globalAlpha = out * on * (1 - q) * 0.8; g.beginPath(); g.arc(ax, ay, h * 0.009 * (1 + 3.5 * q), 0, Math.PI * 2); g.stroke(); }
    }
    // the name
    g.font = `700 ${fz}px "Noto Serif SC", serif`; g.letterSpacing = '0px'; g.fillStyle = '#f4ecdb';
    let x = side === 'l' ? x0 : x0 - tw;
    chars.forEach((c, i) => { const ui = 0.42 + 0.075 * i, a = smooth(ui, ui + 0.3, u); if (a > 0) { g.globalAlpha = out * a; g.fillText(c, x, yz + (1 - a) * h * 0.012); } x += cw[i] + sp; });
    g.font = `${fe}px "IM Fell English SC", "Times New Roman", serif`; g.letterSpacing = `${track.toFixed(1)}px`; g.fillStyle = '#d9b36a';
    g.globalAlpha = out * smooth(0.5 + 0.075 * chars.length, 0.95 + 0.075 * chars.length, u);
    g.textAlign = side === 'l' ? 'left' : 'right'; g.fillText(L.en, x0, ye);
    g.restore();
  }
}
// called from tourApply for shots with a rig: the camera is set; pose the snitch at this sample's time
function snApply(s, t) {
  SN.on = !s.gone && !!s.sp;
  if (SN.on) snPose(s.sp, s.sf, s.su, t, s.beat ?? 16, s.spread ?? 1, s.fold ?? 0);
  if (!ACTIVE) sunLight.target.position.set(Math.round(camera.position.x / 4) * 4, Math.round(camera.position.y / 4) * 4, Math.round(camera.position.z / 4) * 4);   // shadows sharp round the camera
}
function snitchStop() {
  SN.on = false; pipeline.overlay = null; INTSKY.uCeil.value = -1; SN.shadowAt = null;
  for (const p of STAIR_PIVOTS) p.rotation.y = 0;
  if (HALL_BANNERS) HALL_BANNERS.visible = HALL.banners;
  if (HALL_CASEMENT) HALL_CASEMENT.rotation.y = 0;
  BOB.uBob.value = 0; broomsMove(null);
  owlsAt(0, false); if (OWLS.dusk) owlFlock(OWLS.dusk);
  WILLOW.strikes = []; for (const b of WILLOW.boughs) { b.g.quaternion.identity(); b.h.quaternion.identity(); }
  if (TRUNK.g) TRUNK.g.visible = false;
  sunLight.target.position.set(10, 0, 20); Object.assign(sunLight.shadow.camera, { left: -300, right: 300, top: 300, bottom: -300 }); sunLight.shadow.camera.updateProjectionMatrix();
}
