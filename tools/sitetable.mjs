// Print the README's building table from SITE (src/js/05-site.js), so the two never drift apart:
//   node tools/sitetable.mjs            # print the table
//   node tools/sitetable.mjs --write    # replace the table in README.md (the rows after the "| 编号 |" header)
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const src = fs.readFileSync(path.join(root, 'src/js/05-site.js'), 'utf8');
// 05-site.js only needs a noise function and a few constants at load time; stub them
const fn = new Function('noise3', 'THREE', src + '\nreturn { SITE, SRC_ZH };');
const { SITE, SRC_ZH } = fn(() => 0, {});
const ST = { built: '已搭建', mass: '体块', todo: '待搭建' };
const rows = SITE.map((s, i) => `| ${i + 1} | ${s.zh}${s.sure ? '' : '（推定）'} | ${s.en} | ${ST[s.status]} | ${[...s.src].map((k) => SRC_ZH[k]).join('、')} | ${s.note || ''} |`);
const table = ['| 编号 | 建筑 | 英文 | 状态 | 依据 | 说明 |', '|---|---|---|---|---|---|', ...rows].join('\n');
if (process.argv.includes('--write')) {
  // the file may have CRLF line ends (Python on Windows writes them); work in LF
  const p = path.join(root, 'README.md'), md = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
  const a = md.indexOf('| 编号 | 建筑 |'), b = md.indexOf('\n\n', a);
  if (a < 0 || b < 0) throw new Error('table not found in README.md; nothing written');
  fs.writeFileSync(p, md.slice(0, a) + table + md.slice(b));
  console.log('README.md: wrote', rows.length, 'rows');
} else console.log(table);
