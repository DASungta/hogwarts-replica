// Try camera keys without rebuilding the page each time: build once in film mode, then run a snippet inside the module.
//   node tools/probe.mjs snippet.js out/probe/name [1600x900] [cut=magic]   the snippet is the body of an async function run in module scope;
//                                                     it returns [[label, dataURL], ...] (tourStill(name, t, spp) makes one)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chrome, angle } from './chrome.mjs';

const [snippetFile, prefix = 'out/probe/p', size = '960x540', extra = ''] = process.argv.slice(2);   // optional: WxH, extra URL params (cut=magic)
const [w, h] = size.split('x').map(Number), port = '8747';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync(path.dirname(path.resolve(prefix)), { recursive: true });
const udd = fs.mkdtempSync(path.join(os.tmpdir(), 'hogprobe-'));
const dport = 9300 + Math.floor(Math.random() * 600);
const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${dport}`, `--user-data-dir=${udd}`, ...angle, '--enable-gpu',
  '--ignore-gpu-blocklist', '--disable-gpu-watchdog', `--window-size=${w},${h}`, '--hide-scrollbars', '--mute-audio', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
async function json(u) { for (let i = 0; i < 150; i++) { try { return await (await fetch(u)).json(); } catch { await sleep(100); } } throw new Error('chrome did not start'); }
try {
  const page = (await json(`http://127.0.0.1:${dport}/json/list`)).find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map();
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
    if (m.method === 'Runtime.consoleAPICalled') { const t = m.params.args.map((a) => a.value ?? a.description).join(' '); if (/^\[probe\]/.test(t)) console.log(t.slice(0, 600)); }
    if (m.method === 'Runtime.exceptionThrown') console.log('[page-error]', m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `http://localhost:${port}/?headless=1&film=1&w=${w}&h=${h}${extra ? '&' + extra : ''}` });
  for (const t0 = Date.now(); ; await sleep(500)) {
    const r = await send('Runtime.evaluate', { expression: '!!window.__DONE', returnByValue: true });
    if (r.result?.result?.value) break;
    if (Date.now() - t0 > 300000) throw new Error('page build timeout');
  }
  const body = fs.readFileSync(snippetFile, 'utf8');
  const r = await send('Runtime.evaluate', { expression: `window.__ev(${JSON.stringify(`(async () => {\n${body}\n})()`)})`, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 600));
  const out = r.result?.result?.value || [];
  for (const [label, data] of out) {
    if (typeof data !== 'string' || !data.startsWith('data:')) { console.log(label, data); continue; }
    const f = `${prefix}_${label}.jpg`; fs.writeFileSync(f, Buffer.from(data.split(',')[1], 'base64')); console.log('wrote', f);
  }
  ws.close();
} finally { proc.kill(); await sleep(300); try { fs.rmSync(udd, { recursive: true, force: true }); } catch {} }
