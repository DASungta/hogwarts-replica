// Local server for headless renders: assembles the page on every request and serves three.js from
// node_modules (npm install; no network).  node tools/serve.mjs [port] [cdn]   ("cdn" keeps the jsDelivr URLs,
// as does a folder without node_modules/three)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { assemble, root } from './assemble.mjs';

const threeRoot = path.resolve(root, 'node_modules/three');
const port = +process.argv[2] || 8747, useCdn = process.argv[3] === 'cdn' || !fs.existsSync(threeRoot);
const CDN = 'https://cdn.jsdelivr.net/npm/three@0.186.1/';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json' };

http.createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (u === '/' || u === '/index.html') {
    let html;
    try { html = assemble(); } catch (e) { res.writeHead(500); res.end(String(e)); return; }
    if (!useCdn) html = html.replaceAll(CDN, '/three/');
    res.writeHead(200, { 'content-type': types['.html'], 'cache-control': 'no-store' });
    res.end(html); return;
  }
  const file = u.startsWith('/three/') ? path.join(threeRoot, u.slice(7)) : path.join(root, u);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(data);
  });
}).listen(port, () => console.log('serving http://localhost:' + port));
