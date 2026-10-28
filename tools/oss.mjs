// Copy the public part of this folder into the open-source repo (default ../hogwarts-replica-oss, a git repo of its own)
// and check the copy, so the music, the renders, the reference photos and the local-only notes never reach it.
//   node tools/oss.mjs [dir]          then, in dir: git add -A, git commit, git push (by hand, after a look)
// What goes: oss/ as the repo root (README, licences, .gitignore, images), src/, tools/ (less the scripts that cut the
// copyrighted music), dist/index.html (rebuilt first), the package files, ref/*/SOURCES.json, and the notes: README.md
// becomes docs/开发笔记.md, docs/*.md stay. Text between <!-- 仅本地 --> and <!-- /仅本地 --> is cut from the notes. The
// copy is then searched for anything that still looks local-only; the run stops with a list if it finds some.
// Everything in dir except .git is replaced on each run, so never edit there.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { root } from './assemble.mjs';

const dest = path.resolve(process.argv[2] || path.join(root, '../hogwarts-replica-oss'));
const SKIP = /(^|[\\/])(__pycache__|score_edit\.py|short_score\.py)$|\.pyc$/;
const LEAK = [/hedwig[._]|hedwig'?s theme/i, /海德薇主题|《海德薇/, /仅本地/, /dav_upload|云盘|WebDAV/i, /zhangyc|AppData[\\/]|[Dd]ownloads[\\/]/, /\baudio\/[\w.-]/, /-music\.mp4/];
const TEXT = /\.(md|js|mjs|py|sh|html|json|txt)$|^\.git(ignore|attributes)$/;
const NOTES_HEAD = `> 这是制作过程中的工作笔记（原来的 README），按时间记下每一版改了什么、为什么改。笔记是 Opus 写给出品人的，
> 文中的"你"指出品人 dasungta。提到的 \`out/\` 渲染图和 \`ref/\` 参考照片不在仓库里，照片可以用
> \`python -I tools/commons_fetch.py ref/model --restore\`（其他文件夹同理）从维基共享资源重新下载。

`;

const strip = (t) => t
  .replace(/^<!-- 仅本地 -->\r?\n[\s\S]*?^<!-- \/仅本地 -->(\r?\n|$)/gm, '')
  .replace(/<!-- 仅本地 -->[\s\S]*?<!-- \/仅本地 -->/g, '');
const copy = (from, to, edit) => {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  if (edit) fs.writeFileSync(to, edit(fs.readFileSync(from, 'utf8')));
  else fs.copyFileSync(from, to);
};
const copyDir = (from, to) => {
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    if (SKIP.test(e.name)) continue;
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) copyDir(a, b); else copy(a, b);
  }
};
const walk = (d, out = []) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === '.git') continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
};

// a change merged on GitHub (someone's pull request) is not in this folder yet: the export would undo it, so stop
if (fs.existsSync(path.join(dest, '.git'))) {
  const git = (...a) => spawnSync('git', ['-C', dest, ...a], { encoding: 'utf8' });
  git('fetch', '-q', 'origin');
  const ahead = +git('rev-list', '--count', 'HEAD..origin/main').stdout.trim() || 0;
  if (ahead) {
    console.log(`origin/main has ${ahead} commit(s) that ${dest} lacks. Pull them there (git pull), copy what they change`);
    console.log('back into this folder (src/, tools/ as they are; README and licences into oss/; notes into README.md or docs/), then export.');
    process.exit(1);
  }
}

const b = spawnSync(process.execPath, [path.join(root, 'tools/build.mjs')], { stdio: 'inherit' });
if (b.status !== 0) process.exit(1);

fs.mkdirSync(dest, { recursive: true });
for (const e of fs.readdirSync(dest)) if (e !== '.git') fs.rmSync(path.join(dest, e), { recursive: true, force: true });
copyDir(path.join(root, 'oss'), dest);
copyDir(path.join(root, 'src'), path.join(dest, 'src'));
copyDir(path.join(root, 'tools'), path.join(dest, 'tools'));
for (const f of ['dist/index.html', 'package.json', 'package-lock.json', 'requirements.txt']) copy(path.join(root, f), path.join(dest, f));
for (const d of fs.readdirSync(path.join(root, 'ref'))) {
  const f = path.join(root, 'ref', d, 'SOURCES.json');
  if (fs.existsSync(f)) copy(f, path.join(dest, 'ref', d, 'SOURCES.json'));
}
copy(path.join(root, 'README.md'), path.join(dest, 'docs/开发笔记.md'), (t) => NOTES_HEAD + strip(t));
for (const f of fs.readdirSync(path.join(root, 'docs'))) {
  if (f.endsWith('.md')) copy(path.join(root, 'docs', f), path.join(dest, 'docs', f), (t) => strip(t).replaceAll('README 的', '开发笔记的'));
}

const files = walk(dest), leaks = [];
for (const f of files) {
  if (!TEXT.test(path.basename(f)) || path.relative(dest, f) === path.join('tools', 'oss.mjs')) continue;
  fs.readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
    if (LEAK.some((r) => r.test(l))) leaks.push(`${path.relative(dest, f)}:${i + 1}: ${l.trim().slice(0, 120)}`);
  });
}
const mb = files.reduce((s, f) => s + fs.statSync(f).size, 0) / 1048576;
console.log(`${dest}: ${files.length} files, ${mb.toFixed(1)} MB`);
if (leaks.length) {
  console.log(`\n${leaks.length} lines still look local-only (wrap them in <!-- 仅本地 --> … <!-- /仅本地 --> or reword):`);
  for (const l of leaks) console.log('  ' + l);
  process.exit(1);
}
console.log('no local-only text found');
