// Joins src/page.html and the src/js/*.js fragments (in file-name order) into one page.
// The fragments share one module scope: only 00-core.js imports, nothing exports.
import fs from 'node:fs';
import path from 'node:path';

export const root = path.resolve(import.meta.dirname, '..');
export function assemble() {
  const dir = path.join(root, 'src/js');
  const js = fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort()
    .map((f) => `// ================================================================== ${f}\n` + fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
  const page = fs.readFileSync(path.join(root, 'src/page.html'), 'utf8');
  return page.replace('/*@js*/', () => js);
}
