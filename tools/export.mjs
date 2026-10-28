// Export one corner of the built scene for Blender (tools/blender/): a .glb of the meshes around a site, a .bin of the
// instanced parts (trees, grass, windows) and a .json with the camera, sun and levels. Needs tools/serve.mjs running.
//   node tools/export.mjs --site hagrid --shot hut --out out/blender/hut [--r 400] [--rgrass 120] [--rtree 1500]
//   node tools/export.mjs --room hall --shot hall --out out/blender/hall     (an interior set, whole, with its lights)
// Meshes are cut to the triangles within r metres (plan distance) of the site; the two terrain meshes and the loch go
// whole. Instanced meshes become one prototype mesh each (named I0001_<material>, at the origin) plus their matrices
// within rgrass (grass) or rtree (everything else) metres. Materials go out as plain glTF ones named after the page's
// material (colour, roughness, any painted texture and its cut-out); the procedural look is rebuilt in Blender.
// Shader-material parts go out as geometry only where Blender rebuilds them (the hall's sky dome, the brazier fire
// shells); the billboard fire tongues go out as a list in the .json, with a room's lamps, point lights and sun.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chrome, angle } from './chrome.mjs';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const opts = { room: arg('room', ''), site: arg('site', 'hagrid'), shot: arg('shot', 'hut'), r: +arg('r', 400), rGrass: +arg('rgrass', 120), rTree: +arg('rtree', 1500) };
const outBase = path.resolve(arg('out', 'out/blender/' + opts.shot)), port = arg('port', '8747');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// runs inside the page module (window.__ev, film mode): builds window.__EXP = { glb, inst, json } as base64 / text
const SNIPPET = /* js */ `
const O = ${JSON.stringify(opts)};
const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
if (O.room) ensureInterior(O.room);
const ROOT = O.room ? INT[O.room].scene : scene, ALL = !!O.room;
const [hx, hz] = O.room ? [0, 0] : SITE_BY[O.site].circle, shot = SHOTS[O.shot];
const SHADED = new Map([[hallSkyMat, 'hallSky'], [ceilMat, 'ceilSky'], [M.fire, 'fireShell']]), fires = [];
const WHOLE = new Set(['terrain', 'water']);
const isGrass = (n) => /^grass/.test(n);
const out = new THREE.Scene(), mats = new Map(), protos = [], log = {};
function expMat(m) {
  if (mats.has(m)) return mats.get(m);
  const e = new THREE.MeshStandardMaterial({ name: SHADED.get(m) || m.name || m.type, roughness: m.roughness ?? 0.7, metalness: m.metalness ?? 0, side: m.side,
    vertexColors: !!m.vertexColors, map: m.map || null, alphaTest: m.alphaTest || 0 });
  if (m.color && !m.isShaderMaterial) e.color.copy(m.color);
  mats.set(m, e); return e;
}
function clean(g, m) { // position, normal, uv (+ colour when the material uses it)
  const keep = ['position', 'normal', 'uv'].concat(m.vertexColors ? ['color'] : []);
  const c = new THREE.BufferGeometry();
  for (const k of keep) if (g.attributes[k]) c.setAttribute(k, g.attributes[k]);
  if (g.index) c.setIndex(g.index);
  if (!c.attributes.normal) c.computeVertexNormals();
  return c;
}
function crop(g, R) { // the triangles whose centroid is within R of the site (plan distance)
  const s = g.index ? g.toNonIndexed() : g, p = s.attributes.position, nt = p.count / 3, sel = [];
  for (let t = 0; t < nt; t++) {
    const cx = (p.getX(3 * t) + p.getX(3 * t + 1) + p.getX(3 * t + 2)) / 3, cz = (p.getZ(3 * t) + p.getZ(3 * t + 1) + p.getZ(3 * t + 2)) / 3;
    if (Math.hypot(cx - hx, cz - hz) < R) sel.push(t);
  }
  if (!sel.length) return null;
  if (sel.length === nt) return s;
  const c = new THREE.BufferGeometry();
  for (const [k, a] of Object.entries(s.attributes)) {
    const isz = a.itemSize, arr = new a.array.constructor(sel.length * 3 * isz);
    sel.forEach((t, j) => arr.set(a.array.subarray(t * 3 * isz, (t + 1) * 3 * isz), j * 3 * isz));
    c.setAttribute(k, new THREE.BufferAttribute(arr, isz, a.normalized));
  }
  return c;
}
const mtx = [], cols = [];
const m4 = new THREE.Matrix4(), v = new THREE.Vector3(), col = new THREE.Color();
ROOT.traverse((o) => {
  if (!o.isMesh || !o.visible || !o.material || Array.isArray(o.material)) return;
  if (o.material === FIRE_MAT) {   // camera-facing fire tongues: [x, y, z (base), width, height]
    const aC = o.geometry.attributes.aC, aS = o.geometry.attributes.aS;
    for (let i = 0; i < o.geometry.instanceCount; i++) fires.push([aC.getX(i), aC.getY(i), aC.getZ(i), aS.getX(i), aS.getY(i)]);
    return;
  }
  if (o.material.isShaderMaterial && !SHADED.has(o.material)) return;
  const name = SHADED.get(o.material) || o.material.name || o.material.type;
  if (o.isInstancedMesh) {
    const R = isGrass(name) ? O.rGrass : O.rTree, list = [];
    o.updateMatrixWorld();
    const at = (i) => o.getMatrixAt(i, m4).premultiply(o.matrixWorld);   // instances of a moved group (the train) included
    for (let i = 0; i < o.count; i++) { at(i); v.setFromMatrixPosition(m4); if (ALL || Math.hypot(v.x - hx, v.z - hz) < R) list.push(i); }
    if (!list.length) return;
    const k = protos.length, start = mtx.length / 16;
    for (const i of list) {
      at(i); mtx.push(...m4.elements);
      if (o.instanceColor) { o.getColorAt(i, col); cols.push(col.r, col.g, col.b); } else cols.push(-1, -1, -1);
    }
    const pm = new THREE.Mesh(clean(o.geometry, o.material), expMat(o.material));
    pm.name = 'I' + String(k).padStart(4, '0') + '_' + name; out.add(pm);
    protos.push({ name: pm.name, mat: name, start, count: list.length, tris: (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3 });
    log[name + '*'] = (log[name + '*'] || 0) + list.length;
    return;
  }
  o.updateMatrixWorld();
  let g = o.geometry.clone().applyMatrix4(o.matrixWorld);
  if (!WHOLE.has(name) && !ALL) { g = crop(g, O.r); if (!g) return; }
  const em = new THREE.Mesh(clean(g, o.material), expMat(o.material));
  em.name = 'M_' + name; out.add(em);
  log[name] = (log[name] || 0) + (em.geometry.index ? em.geometry.index.count : em.geometry.attributes.position.count) / 3;
});
const glb = await new GLTFExporter().parseAsync(out, { binary: true, maxTextureSize: 2048 });
const b64 = (buf) => new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result.split(',')[1]); fr.readAsDataURL(new Blob([buf])); });
const info = {
  room: O.room || null, site: O.room ? null : O.site, shot: O.shot, center: [hx, HUT_Y ?? 0, hz], lakeY: LAKE_Y, aspect: 16 / 9,
  camera: { pos: shot.pos, target: shot.target, fovV: shot.fov },
  sun: { dir: SUN_DIR.toArray(), color: sunLight.color.toArray(), intensity: sunLight.intensity },
  sky: { zenith: SKY.uZen.value.toArray(), horizon: SKY.uHor.value.toArray(), cover: SKY.uCover.value },
  haze: { color: ATMO.uHaze.value.toArray(), density: ATMO.uFogDen.value }, envIntensity: scene.environmentIntensity,
  instances: { matrices: mtx.length / 16, layout: 'per instance: 16 float32 (three.js column-major world matrix, Y up), then 3 float32 colour (-1 = none)' },
  protos, triangles: log, fires,
  roomLight: O.room ? (() => { const I = INT[O.room]; return {
    sunDir: I.sun.dir.toArray(), sunI: I.sunI, moonI: I.moonI, envD: I.envD, envN: I.envN,
    points: I.points.map((p) => ({ pos: p.position.toArray(), color: p.color.toArray(), day: p.userData.d, night: p.userData.n, distance: p.distance, decay: p.decay })),
    lamps: LAMPS.filter((l) => l.room === O.room).map((l) => ({ pos: l.p, color: l.c, r: l.r, halo: l.halo || 0 })) }; })() : null,
  materials: Object.fromEntries([...mats.values()].map((e) => [e.name, { color: e.color.toArray(), rough: e.roughness, metal: e.metalness, alphaTest: e.alphaTest, map: !!e.map, vc: e.vertexColors, double: e.side === THREE.DoubleSide }])),
};
const inst = new Float32Array(mtx.length + cols.length);
for (let i = 0, n = mtx.length / 16; i < n; i++) { inst.set(mtx.slice(i * 16, i * 16 + 16), i * 19); inst.set(cols.slice(i * 3, i * 3 + 3), i * 19 + 16); }
window.__EXP = { glb: await b64(glb), inst: await b64(inst.buffer), json: JSON.stringify(info, null, 1) };
return [['sizes', JSON.stringify({ glb: glb.byteLength, inst: inst.byteLength, protos: protos.length })]];
`;

const udd = fs.mkdtempSync(path.join(os.tmpdir(), 'hogexp-'));
const dport = 9300 + Math.floor(Math.random() * 600);
const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${dport}`, `--user-data-dir=${udd}`, ...angle, '--enable-gpu',
  '--ignore-gpu-blocklist', '--disable-gpu-watchdog', '--window-size=960,540', '--hide-scrollbars', '--mute-audio', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
async function json(u) { for (let i = 0; i < 150; i++) { try { return await (await fetch(u)).json(); } catch { await sleep(100); } } throw new Error('chrome did not start'); }
let ok = false;
try {
  const page = (await json(`http://127.0.0.1:${dport}/json/list`)).find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map();
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
    if (m.method === 'Runtime.exceptionThrown') console.log('[page-error]', m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evalv = async (expression, awaitPromise = false) => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 800));
    return r.result?.result?.value;
  };
  await send('Runtime.enable'); await send('Page.enable');
  await send('Page.navigate', { url: `http://localhost:${port}/?headless=1&film=1&w=960&h=540` });
  for (const t0 = Date.now(); !(await evalv('!!window.__DONE')); await sleep(500)) if (Date.now() - t0 > 300000) throw new Error('page build timeout');
  console.log('built; exporting', JSON.stringify(opts));
  console.log(await evalv(`window.__ev(${JSON.stringify(`(async () => {\n${SNIPPET}\n})()`)})`, true));
  const pull = async (key) => { // in 8 MB slices (one CDP message each)
    const n = await evalv(`window.__EXP.${key}.length`), parts = [];
    for (let i = 0; i < n; i += 8e6) parts.push(await evalv(`window.__EXP.${key}.slice(${i}, ${i + 8e6})`));
    return parts.join('');
  };
  fs.mkdirSync(path.dirname(outBase), { recursive: true });
  fs.writeFileSync(outBase + '.glb', Buffer.from(await pull('glb'), 'base64'));
  fs.writeFileSync(outBase + '-inst.bin', Buffer.from(await pull('inst'), 'base64'));
  const info = await evalv('window.__EXP.json');
  fs.writeFileSync(outBase + '.json', info);
  console.log('triangles', JSON.stringify(JSON.parse(info).triangles));
  console.log('wrote', outBase + '.glb / -inst.bin / .json');
  ok = true;
  ws.close();
} finally {
  proc.kill(); await sleep(300); try { fs.rmSync(udd, { recursive: true, force: true }); } catch {}
  if (!ok) process.exitCode = 1;
}
