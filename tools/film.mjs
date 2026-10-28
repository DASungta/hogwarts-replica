// Render the tour (src/js/88-tour.js) frame by frame through headless Chrome, then join the frames with ffmpeg.
//   node tools/film.mjs --spp 8 --w 1280 --h 720 --out out/film            full film → out/film/f00000.jpg … + out/film/tour.mp4
//   node tools/film.mjs --every 48 --spp 4 --out out/filmcheck             one frame every 2 s (a storyboard check), no video
//   node tools/film.mjs --from 1200 --to 1500 ...                           a range (frames already on disk are skipped)
// The page builds the scene once (?film=1) and exposes window.__tourFrame(i, spp) → a JPEG data URL with the caption drawn in.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chrome, angle } from './chrome.mjs';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const spp = +arg('spp', 8), w = +arg('w', 1280), h = +arg('h', 720), every = +arg('every', 1), port = arg('port', '8747');
const outDir = path.resolve(arg('out', 'out/film')), extra = arg('params', '');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync(outDir, { recursive: true });

const udd = fs.mkdtempSync(path.join(os.tmpdir(), 'hogfilm-'));
const dport = 9300 + Math.floor(Math.random() * 600);
const proc = spawn(chrome, [
  '--headless=new', `--remote-debugging-port=${dport}`, `--user-data-dir=${udd}`,
  ...angle, '--enable-gpu', '--ignore-gpu-blocklist', '--disable-gpu-watchdog',
  `--window-size=${w},${h}`, '--hide-scrollbars', '--mute-audio', '--no-first-run', 'about:blank',
], { stdio: 'ignore' });
async function json(u) {
  for (let i = 0; i < 150; i++) { try { return await (await fetch(u)).json(); } catch { await sleep(100); } }
  throw new Error('chrome did not start');
}
let ok = false;
try {
  const page = (await json(`http://127.0.0.1:${dport}/json/list`)).find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map();
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
    if (m.method === 'Runtime.consoleAPICalled') { const t = m.params.args.map((a) => a.value ?? a.description).join(' '); if (!/build\]|warning X/.test(t)) console.log('[page]', t.slice(0, 300)); }
    if (m.method === 'Runtime.exceptionThrown') console.log('[page-error]', m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `http://localhost:${port}/?headless=1&film=1&w=${w}&h=${h}${extra ? '&' + extra : ''}` });
  let info = null;
  for (const t0 = Date.now(); !info; await sleep(500)) {
    const r = await send('Runtime.evaluate', { expression: 'window.__DONE ? JSON.stringify(window.__DONE) : (window.__FAIL || null)', returnByValue: true });
    const v = r.result?.result?.value;
    if (v && v.startsWith('ERROR')) throw new Error(v);
    if (v) info = JSON.parse(v);
    if (Date.now() - t0 > 300000) throw new Error('page build timeout');
  }
  console.log('film', info);
  const from = +arg('from', 0), to = Math.min(+arg('to', info.frames), info.frames);
  const t0 = Date.now(); let n = 0;
  for (let i = from; i < to; i += every) {
    const file = path.join(outDir, `f${String(i).padStart(5, '0')}.jpg`);
    if (fs.existsSync(file) && every === 1) continue;
    const r = await send('Runtime.evaluate', { expression: `window.__tourFrame(${i}, ${spp}, ${every === 1})`, awaitPromise: true, returnByValue: true });
    const data = r.result?.result?.value;
    if (!data) throw new Error('frame ' + i + ': ' + JSON.stringify(r.result?.exceptionDetails || r).slice(0, 400));
    fs.writeFileSync(file, Buffer.from(data.split(',')[1], 'base64'));
    n++;
    if (n % 24 === 0 || every > 1) {
      const per = (Date.now() - t0) / n / 1000, left = ((to - i) / every) * per;
      console.log(`frame ${i}/${to}  ${per.toFixed(2)} s/frame  ~${Math.round(left / 60)} min left`);
    }
  }
  ws.close(); ok = true;
  if (every === 1 && !argv.includes('--novideo')) {
    const mp4 = path.join(outDir, arg('name', 'tour') + '.mp4');
    const r = spawnSync('ffmpeg', ['-y', '-framerate', String(info.fps), '-i', path.join(outDir, 'f%05d.jpg'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '17',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4], { stdio: 'inherit' });
    if (r.status === 0) console.log('wrote', mp4);
  }
} finally {
  proc.kill(); await sleep(300);
  try { fs.rmSync(udd, { recursive: true, force: true }); } catch {}
  if (!ok) process.exitCode = 1;
}
