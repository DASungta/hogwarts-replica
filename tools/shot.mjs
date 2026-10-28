// Headless still render through the Chrome DevTools Protocol (no dependencies; Node 24 has fetch + WebSocket).
//   node tools/shot.mjs --shot 1 --spp 32 --w 1600 --h 900 --out out/shot1.png [--port 8747] [--params "k=v&k2=v2"]
// The page renders `spp` jittered sub-frames, resolves, and exposes window.__PNG / window.__DONE.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chrome, angle } from './chrome.mjs';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const shot = arg('shot', '1'), spp = arg('spp', '32'), w = +arg('w', 1600), h = +arg('h', 900);
const port = arg('port', '8747'), extra = arg('params', ''), out = path.resolve(arg('out', `out/shot${shot}.png`));
const timeout = +arg('timeout', 600) * 1000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const udd = fs.mkdtempSync(path.join(os.tmpdir(), 'hogcdp-'));
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
let done = false;
try {
  const page = (await json(`http://127.0.0.1:${dport}/json/list`)).find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map();
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
    if (m.method === 'Runtime.consoleAPICalled') console.log('[page]', m.params.args.map((a) => a.value ?? a.description).join(' '));
    if (m.method === 'Runtime.exceptionThrown') console.log('[page-error]', m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  if (argv.includes('--ui')) { // interactive page as a viewer sees it: wait, then screenshot the whole window
    const url = `http://localhost:${port}/${extra ? '?' + extra : ''}`;
    console.log('ui', url);
    await send('Page.navigate', { url });
    await sleep(+arg('wait', 20) * 1000);
    const shotR = await send('Page.captureScreenshot', { format: 'png' });
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, Buffer.from(shotR.result.data, 'base64'));
    const m = await send('Runtime.evaluate', { expression: 'document.getElementById("meta").textContent + " | fail=" + (window.__FAIL || "none")', returnByValue: true });
    console.log('meta:', m.result?.result?.value, '\nwrote', out);
    done = true; ws.close();
    throw 0;
  }
  const url = `http://localhost:${port}/?headless=1&shot=${shot}&spp=${spp}&w=${w}&h=${h}${extra ? '&' + extra : ''}`;
  console.log('render', url);
  const t0 = Date.now();
  await send('Page.navigate', { url });
  for (;;) {
    const r = await send('Runtime.evaluate', { expression: 'window.__DONE ? JSON.stringify(window.__DONE) : (window.__FAIL || null)', returnByValue: true });
    const v = r.result?.result?.value;
    if (v) { console.log('done', v); break; }
    if (Date.now() - t0 > timeout) throw new Error('timeout');
    await sleep(400);
  }
  const r = await send('Runtime.evaluate', { expression: 'window.__PNG', returnByValue: true });
  const data = r.result?.result?.value;
  if (!data) throw new Error('no image');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
  console.log('wrote', out, ((Date.now() - t0) / 1000).toFixed(1) + ' s');
  done = true;
  ws.close();
} catch (e) { if (e !== 0) throw e; } finally {
  proc.kill();
  await sleep(300);
  try { fs.rmSync(udd, { recursive: true, force: true }); } catch {}
  if (!done) process.exitCode = 1;
}
