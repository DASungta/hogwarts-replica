// ------------------------------------------------------------------ survey plan: SVG drawn from SITE and the terrain
const PLAN_VIEWS = { castle: [-330, -230, 590, 370], grounds: [-1100, -700, 1900, 2150] };
const STATUS_ZH = { built: '已搭建', mass: '体块', todo: '待搭建' };
function buildPlan(look, onPick, onEnter) {
  const [X0, Z0, W0, H0] = PLAN_VIEWS.grounds, step = 6;
  const nx = Math.round(W0 / step) + 1, nz = Math.round(H0 / step) + 1;
  const Hs = new Float32Array(nx * nz);
  for (let i = 0; i < nz; i++) for (let j = 0; j < nx; j++) Hs[i * nx + j] = look(X0 + j * step, Z0 + i * step);
  const at = (i, j) => Hs[i * nx + j];
  // water as horizontal runs of cells below the loch surface
  let water = '';
  for (let i = 0; i < nz - 1; i++) {
    let j = 0;
    while (j < nx - 1) {
      if (at(i, j) < LAKE_Y) { const s = j; while (j < nx - 1 && at(i, j) < LAKE_Y) j++; water += `M${X0 + s * step} ${Z0 + i * step}h${(j - s) * step}v${step}h${-(j - s) * step}z`; }
      else j++;
    }
  }
  // contours by marching squares
  const contour = (lv) => {
    let d = '';
    const ip = (a, b) => (lv - a) / (b - a);
    for (let i = 0; i < nz - 1; i++) for (let j = 0; j < nx - 1; j++) {
      const a = at(i, j), b = at(i, j + 1), c = at(i + 1, j + 1), e = at(i + 1, j);
      const k = (a > lv ? 8 : 0) | (b > lv ? 4 : 0) | (c > lv ? 2 : 0) | (e > lv ? 1 : 0);
      if (k === 0 || k === 15) continue;
      const x = X0 + j * step, z = Z0 + i * step;
      const T = [x + ip(a, b) * step, z], R = [x + step, z + ip(b, c) * step], B = [x + ip(e, c) * step, z + step], L = [x, z + ip(a, e) * step];
      const seg = { 1: [L, B], 2: [B, R], 3: [L, R], 4: [T, R], 5: [L, T, B, R], 6: [T, B], 7: [L, T], 8: [L, T], 9: [T, B], 10: [L, B, T, R], 11: [T, R], 12: [L, R], 13: [B, R], 14: [L, B] }[k];
      for (let s = 0; s < seg.length; s += 2) d += `M${seg[s][0].toFixed(1)} ${seg[s][1].toFixed(1)}L${seg[s + 1][0].toFixed(1)} ${seg[s + 1][1].toFixed(1)}`;
    }
    return d;
  };
  const lines = [-40, -20, 0, 20, 40, 70, 100].map((lv) => `<path d="${contour(lv)}" fill="none" stroke="rgba(239,232,218,${lv === 0 ? 0.2 : 0.09})" stroke-width="${lv === 0 ? 1.4 : 1}" vector-effect="non-scaling-stroke"/>`).join('');
  const shore = `<path d="${contour(LAKE_Y)}" fill="none" stroke="#5f7f94" stroke-width="1.4" vector-effect="non-scaling-stroke"/>`;
  const col = { built: '#d9a95b', mass: '#7d8da3', todo: '#7a7e85' };
  const shapes = SITE.map((s, i) => {
    const c = col[s.status], fill = s.status === 'todo' ? 'none' : c, dash = s.status === 'todo' ? ' stroke-dasharray="4 3"' : '';
    const attrs = `data-id="${s.id}" fill="${fill}" fill-opacity="${s.status === 'built' ? 0.32 : 0.22}" stroke="${c}" stroke-width="1.2" vector-effect="non-scaling-stroke"${dash}`;
    let g;
    if (s.rect) g = `<rect x="${s.rect[0]}" y="${s.rect[1]}" width="${s.rect[2] - s.rect[0]}" height="${s.rect[3] - s.rect[1]}" ${attrs}/>`;
    else if (s.circle) g = `<circle cx="${s.circle[0]}" cy="${s.circle[1]}" r="${s.circle[2]}" ${attrs}/>`;
    else if (s.ellipse) { const [ex, ez, ea, eb, er] = s.ellipse; g = `<ellipse cx="${ex}" cy="${ez}" rx="${ea}" ry="${eb}" transform="rotate(${(er * 180 / Math.PI).toFixed(1)} ${ex} ${ez})" ${attrs}/>`; }
    else g = `<polyline points="${s.line.map((p) => p.join(',')).join(' ')}" ${attrs.replace(/fill="[^"]*"/, 'fill="none"')} stroke-width="3"/>`;
    const [cx, cz] = siteCenter(s);
    return `<g class="site" data-id="${s.id}" style="cursor:pointer">${g}<text x="${cx}" y="${cz}" class="lbl">${i + 1}</text></g>`;
  }).join('');
  const svg = `<svg id="plan-map" viewBox="${PLAN_VIEWS.castle.join(' ')}" role="img" aria-label="霍格沃茨平面示意图">
    <style>.lbl{font:600 15px system-ui,sans-serif;fill:#efe8da;text-anchor:middle;dominant-baseline:central;paint-order:stroke;stroke:#12161d;stroke-width:3px;pointer-events:none}
    .site.on rect,.site.on circle,.site.on ellipse,.site.on polyline{stroke:#fff;stroke-width:2.2}</style>
    <path d="${water}" fill="#1a2a36"/>${lines}${shore}${shapes}
    <g transform="translate(0 0)"><path d="M0 -26L7 0L0 -6L-7 0Z" fill="#d9a95b"/><text x="0" y="14" class="lbl" style="font-size:13px">北</text></g>
  </svg>`;
  const host = $('plan-svg');
  host.innerHTML = svg;
  const map = $('plan-map');
  const setView = (k) => {
    const v = PLAN_VIEWS[k]; map.setAttribute('viewBox', v.join(' '));
    map.querySelector('g[transform]').setAttribute('transform', `translate(${v[0] + v[2] * 0.95} ${v[1] + v[3] * 0.84}) scale(${v[2] / 520})`);
    map.querySelectorAll('.lbl').forEach((t) => (t.style.fontSize = (Math.max(8.5, 13 * v[2] / 520)) + 'px'));
    $('plan-scope').textContent = k === 'castle' ? '看全域' : '看城堡';
    $('plan-scope').dataset.k = k;
  };
  // legend, grouped by status
  const leg = $('legend');
  let html = '';
  for (const st of ['built', 'mass', 'todo']) {
    const items = SITE.map((s, i) => [s, i]).filter(([s]) => s.status === st);
    if (!items.length) continue;
    html += `<div class="grp">${STATUS_ZH[st]} · ${items.length}</div>`;
    for (const [s, i] of items) html += `<button type="button" data-id="${s.id}"><span class="no">${i + 1}</span><span class="nm">${s.zh}${s.sure ? '' : ' <span class="q">（推定）</span>'}<small>${s.en} · 依据：${[...s.src].map((k) => SRC_ZH[k]).join('、')}${s.note ? '<br>' + s.note : ''}</small></span><span class="chip ${st}">${STATUS_ZH[st]}</span></button>`;
  }
  html += `<div class="grp">城堡内部 · 已搭建 ${INTERIORS.filter((r) => r.status === 'built').length} / ${INTERIORS.length}</div>`;
  for (const r of INTERIORS) html += `<button type="button" data-room="${r.id}"><span class="no">·</span><span class="nm">${r.zh}<small>${r.en}${r.src ? ' · 依据：' + [...r.src].map((k) => SRC_ZH[k]).join('、') : ''}${r.note ? '<br>' + r.note : ''}</small></span><span class="chip ${r.status}">${r.status === 'built' ? '进入' : STATUS_ZH[r.status]}</span></button>`;
  leg.innerHTML = html;
  const pick = (id) => {
    map.querySelectorAll('.site').forEach((g) => g.classList.toggle('on', g.dataset.id === id));
    leg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.id === id));
    onPick(SITE_BY[id]);
  };
  map.addEventListener('click', (e) => { const g = e.target.closest('.site'); if (g) pick(g.dataset.id); });
  leg.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.room) { const r = INTERIORS.find((q) => q.id === b.dataset.room); if (r.status === 'built') onEnter(r); else pick(r.site); return; }
    pick(b.dataset.id);
  });
  $('plan-scope').addEventListener('click', () => setView($('plan-scope').dataset.k === 'castle' ? 'grounds' : 'castle'));
  setView('castle');
}
