// Writes dist/index.html (the single file that gets published as the Artifact).
import fs from 'node:fs';
import path from 'node:path';
import { assemble, root } from './assemble.mjs';
const out = path.join(root, 'dist/index.html');
fs.writeFileSync(out, assemble());
console.log('wrote', out, (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
