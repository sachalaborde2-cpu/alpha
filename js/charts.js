'use strict';
/* Graphiques SVG faits main : courbe, bougies, radar, heatmap, barres, sparklines.
 * Marques fines, grille en hairline, infobulle au toucher. */
(function () {
const C = A.chart = {};
const COLORS = { amber: '#ffb22e', up: '#19e28c', down: '#ff4867', muted: '#6b7788', line: '#19212d', text2: '#a9b4c2', bg: '#0b0f15' };
C.COLORS = COLORS;
let uid = 0;

function nice(min, max, n = 3) {
  if (!isFinite(min) || !isFinite(max)) { min = 0; max = 1; }
  if (min === max) { min -= 1; max += 1; }
  const raw = (max - min) / n;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const f = raw / mag;
  const step = (f > 5 ? 10 : f > 2.5 ? 5 : f > 2 ? 2.5 : f > 1 ? 2 : 1) * mag;
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 1e6; v += step) ticks.push(A.round(v, 6));
  return { lo, hi, ticks };
}
C.nice = nice;

// Infobulle : calque transparent, index le plus proche en x
function hover(el, svg, xs, onIdx) {
  const tip = document.createElement('div'); tip.className = 'tip'; el.appendChild(tip);
  let timer = null;
  const at = e => {
    const r = svg.getBoundingClientRect();
    const px = e.clientX - r.left;
    let best = 0, bd = Infinity;
    xs.forEach((x, i) => { const d = Math.abs(x - px); if (d < bd) { bd = d; best = i; } });
    const html = onIdx(best);
    if (html == null) return;
    tip.innerHTML = html;
    const w = tip.offsetWidth || 120;
    tip.style.left = A.clamp(xs[best], w / 2, r.width - w / 2) + 'px';
    tip.classList.add('on');
    clearTimeout(timer);
  };
  const hide = () => { clearTimeout(timer); timer = setTimeout(() => { tip.classList.remove('on'); onIdx(-1); }, 1400); };
  svg.addEventListener('pointerdown', e => { at(e); });
  svg.addEventListener('pointermove', e => { at(e); });
  svg.addEventListener('pointerup', hide);
  svg.addEventListener('pointerleave', hide);
  svg.style.touchAction = 'pan-y';
}

/* Sparkline (chaîne SVG) */
C.spark = (vals, { w = 76, h = 24, color } = {}) => {
  if (!vals || vals.length < 2) return `<svg width="${w}" height="${h}"></svg>`;
  const lo = Math.min(...vals), hi = Math.max(...vals), sp = hi - lo || 1;
  const pts = vals.map((v, i) => `${(i / (vals.length - 1) * (w - 4) + 2).toFixed(1)},${(h - 3 - (v - lo) / sp * (h - 6)).toFixed(1)}`);
  const c = color || (vals[vals.length - 1] >= vals[0] ? COLORS.up : COLORS.down);
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polyline points="${pts.join(' ')}" fill="none" stroke="${c}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
};

/* Courbe avec aire, graduations à droite (style terminal), ligne de référence optionnelle */
C.line = (el, pts, o = {}) => {
  el.innerHTML = '';
  el.classList.add('chart');
  if (!pts.length) return;
  const W = el.clientWidth || 320, H = o.h || 170, pr = 42, pt = 10, pb = 22;
  const color = o.color || COLORS.amber;
  const fmt = o.fmt || (v => A.fmt(v, 1));
  const vals = pts.map(p => p.y).concat(o.ref ? [o.ref.v] : []);
  const { lo, hi, ticks } = nice(Math.min(...vals), Math.max(...vals), 3);
  const n = pts.length;
  const x = i => n === 1 ? (W - pr) / 2 : 4 + i * (W - pr - 8) / (n - 1);
  const y = v => pt + (1 - (v - lo) / (hi - lo)) * (H - pt - pb);
  const id = 'g' + (++uid);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join('');
  const area = `${d}L${x(n - 1).toFixed(1)},${H - pb}L${x(0).toFixed(1)},${H - pb}Z`;
  const xs = pts.map((p, i) => x(i));
  el.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".22"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
    ${ticks.map(t => `<line x1="0" x2="${W - pr + 4}" y1="${y(t)}" y2="${y(t)}" stroke="${COLORS.line}" stroke-width="1"/><text class="axis-t" x="${W - pr + 8}" y="${y(t) + 3.5}">${fmt(t)}</text>`).join('')}
    ${o.ref ? `<line x1="0" x2="${W - pr + 4}" y1="${y(o.ref.v)}" y2="${y(o.ref.v)}" stroke="${COLORS.text2}" stroke-opacity=".55" stroke-width="1"/><text class="axis-t" x="2" y="${y(o.ref.v) - 5}" style="fill:${COLORS.text2}">${o.ref.label}</text>` : ''}
    ${n > 1 ? `<path d="${area}" fill="url(#${id})"/>` : ''}
    <path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${x(n - 1)}" cy="${y(pts[n - 1].y)}" r="4" fill="${color}" stroke="${COLORS.bg}" stroke-width="2"/>
    <text class="axis-t" x="2" y="${H - 5}">${pts[0].label || ''}</text>
    ${n > 1 ? `<text class="axis-t" x="${W - pr - 2}" y="${H - 5}" text-anchor="end">${pts[n - 1].label || ''}</text>` : ''}
    <line class="xh" x1="0" x2="0" y1="${pt}" y2="${H - pb}" stroke="${COLORS.text2}" stroke-width="1" opacity="0"/>
    <circle class="xd" r="5" fill="${color}" stroke="${COLORS.bg}" stroke-width="2" opacity="0"/>
    <rect x="0" y="0" width="${W}" height="${H}" fill="transparent"/>
  </svg>`;
  const svg = el.querySelector('svg'), xh = svg.querySelector('.xh'), xd = svg.querySelector('.xd');
  hover(el, svg, xs, i => {
    if (i < 0) { xh.setAttribute('opacity', 0); xd.setAttribute('opacity', 0); return ''; }
    xh.setAttribute('x1', xs[i]); xh.setAttribute('x2', xs[i]); xh.setAttribute('opacity', .5);
    xd.setAttribute('cx', xs[i]); xd.setAttribute('cy', y(pts[i].y)); xd.setAttribute('opacity', 1);
    return o.tip ? o.tip(pts[i], i) : `${pts[i].label || ''} · <b>${fmt(pts[i].y)}</b>`;
  });
};

/* Bougies journalières de l'indice */
C.candles = (el, days, o = {}) => {
  el.innerHTML = '';
  el.classList.add('chart');
  if (!days.length) return;
  const W = el.clientWidth || 320, H = o.h || 160, pr = 42, pt = 8, pb = 22;
  const { lo, hi, ticks } = nice(Math.min(...days.map(d => d.l)), Math.max(...days.map(d => d.h)), 3);
  const slots = Math.max(days.length, 14);
  const sw = (W - pr - 6) / slots;
  const bw = A.clamp(sw * 0.6, 3, 12);
  const x = i => 3 + sw * i + sw / 2;
  const y = v => pt + (1 - (v - lo) / (hi - lo)) * (H - pt - pb);
  const xs = days.map((d, i) => x(i));
  el.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${ticks.map(t => `<line x1="0" x2="${W - pr + 4}" y1="${y(t)}" y2="${y(t)}" stroke="${COLORS.line}"/><text class="axis-t" x="${W - pr + 8}" y="${y(t) + 3.5}">${A.fmt(t, 0)}</text>`).join('')}
    <rect class="hl" x="0" y="${pt}" width="${sw}" height="${H - pt - pb}" fill="#fff" opacity="0" rx="3"/>
    ${days.map((d, i) => {
      const c = d.c >= d.o ? COLORS.up : COLORS.down;
      const top = y(Math.max(d.o, d.c)), bot = y(Math.min(d.o, d.c));
      return `<line x1="${x(i)}" x2="${x(i)}" y1="${y(d.h)}" y2="${y(d.l)}" stroke="${c}" stroke-width="1.5"/>
        <rect x="${x(i) - bw / 2}" y="${top}" width="${bw}" height="${Math.max(2, bot - top)}" rx="1.5" fill="${c}"/>`;
    }).join('')}
    <text class="axis-t" x="2" y="${H - 5}">${A.shortDate(days[0].day)}</text>
    ${days.length > 1 ? `<text class="axis-t" x="${x(days.length - 1)}" y="${H - 5}" text-anchor="end">${A.shortDate(days[days.length - 1].day)}</text>` : ''}
    <rect x="0" y="0" width="${W}" height="${H}" fill="transparent"/>
  </svg>`;
  const svg = el.querySelector('svg'), hl = svg.querySelector('.hl');
  hover(el, svg, xs, i => {
    if (i < 0) { hl.setAttribute('opacity', 0); return ''; }
    const d = days[i];
    hl.setAttribute('x', xs[i] - sw / 2); hl.setAttribute('opacity', .05);
    const ch = (d.c - d.o) / d.o * 100;
    return `${A.shortDate(d.day)} · O ${A.fmt(d.o, 1)} H ${A.fmt(d.h, 1)} L ${A.fmt(d.l, 1)} C <b>${A.fmt(d.c, 1)}</b> <span class="${ch >= 0 ? 'up' : 'down'}">${A.signed(ch, 2, '%')}</span>`;
  });
};

/* Radar du profil (5 catégories) */
C.radar = (el, labels, vals, cmp) => {
  el.innerHTML = '';
  el.classList.add('chart');
  const W = el.clientWidth || 320, H = Math.min(270, W * 0.82);
  const cx = W / 2, cy = H / 2 + 4, R = Math.min(W, H) / 2 - 30;
  const n = labels.length;
  const pt = (i, v) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(a) * R * v / 100, cy + Math.sin(a) * R * v / 100]; };
  const poly = vs => vs.map((v, i) => pt(i, A.clamp(v, 0, 100)).map(z => z.toFixed(1)).join(',')).join(' ');
  el.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${[25, 50, 75, 100].map(r => `<polygon points="${poly(labels.map(() => r))}" fill="none" stroke="${COLORS.line}"/>`).join('')}
    ${labels.map((l, i) => { const [x, y] = pt(i, 100); return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${COLORS.line}"/>`; }).join('')}
    ${cmp ? `<polygon points="${poly(cmp)}" fill="none" stroke="${COLORS.muted}" stroke-width="1.5" stroke-linejoin="round"/>` : ''}
    <polygon points="${poly(vals)}" fill="${COLORS.amber}" fill-opacity=".14" stroke="${COLORS.amber}" stroke-width="2" stroke-linejoin="round"/>
    ${vals.map((v, i) => { const [x, y] = pt(i, A.clamp(v, 0, 100)); return `<circle cx="${x}" cy="${y}" r="3.5" fill="${COLORS.amber}" stroke="${COLORS.bg}" stroke-width="2"/>`; }).join('')}
    ${labels.map((l, i) => {
      const [x, y] = pt(i, 122);
      const anchor = Math.abs(x - cx) < 4 ? 'middle' : x > cx ? 'start' : 'end';
      return `<text x="${x}" y="${y}" text-anchor="${anchor}" class="axis-t" style="fill:${COLORS.text2};font-weight:700">${l}</text>
        <text x="${x}" y="${y + 13}" text-anchor="${anchor}" class="axis-t">${A.fmt(vals[i], 0)}</text>`;
    }).join('')}
  </svg>`;
};

/* Heatmap de régularité (minutes / jour) — une seule teinte, clair = plus */
C.HEAT = ['#19212d', '#0e4a31', '#127a4e', '#16b06f', '#19e28c'];
C.heat = (el, minutesByDay, weeks = 17) => {
  el.innerHTML = '';
  el.classList.add('chart');
  const W = el.clientWidth || 320;
  const gap = 3, cs = Math.min(16, Math.floor((W - 26) / weeks) - gap);
  const today = new Date();
  const dow = (today.getDay() + 6) % 7; // lundi = 0
  const start = A.addDays(A.dayKey(today), -(weeks - 1) * 7 - dow);
  const lvl = m => !m ? 0 : m < 5 ? 1 : m < 12 ? 2 : m < 20 ? 3 : 4;
  const cells = [];
  for (let w = 0; w < weeks; w++) for (let d = 0; d < 7; d++) {
    const k = A.addDays(start, w * 7 + d);
    if (k > A.dayKey(today)) continue;
    cells.push({ k, w, d, m: minutesByDay[k] || 0 });
  }
  const H = 7 * (cs + gap);
  el.innerHTML = `<svg width="${W}" height="${H + 2}" viewBox="0 0 ${W} ${H + 2}">
    ${['L', '', 'M', '', 'V', '', 'D'].map((t, i) => t ? `<text class="axis-t" x="0" y="${i * (cs + gap) + cs - 2}">${t}</text>` : '').join('')}
    ${cells.map(c => `<rect x="${18 + c.w * (cs + gap)}" y="${c.d * (cs + gap)}" width="${cs}" height="${cs}" rx="2.5" fill="${C.HEAT[lvl(c.m)]}"/>`).join('')}
    <rect class="hl" width="${cs + 2}" height="${cs + 2}" rx="3" fill="none" stroke="#fff" stroke-width="1.5" opacity="0"/>
    <rect x="0" y="0" width="${W}" height="${H}" fill="transparent"/>
  </svg>`;
  const svg = el.querySelector('svg'), hl = svg.querySelector('.hl');
  const tip = document.createElement('div'); tip.className = 'tip'; el.appendChild(tip);
  let timer;
  svg.addEventListener('pointerdown', e => {
    const r = svg.getBoundingClientRect();
    const w = Math.floor((e.clientX - r.left - 18) / (cs + gap)), d = Math.floor((e.clientY - r.top) / (cs + gap));
    const c = cells.find(z => z.w === w && z.d === d);
    if (!c) return;
    hl.setAttribute('x', 17 + w * (cs + gap)); hl.setAttribute('y', d * (cs + gap) - 1); hl.setAttribute('opacity', .8);
    tip.innerHTML = `${A.shortDate(c.k)} · <b>${c.m ? A.fmt(c.m, 0) + ' min' : 'repos'}</b>`;
    tip.style.top = (d * (cs + gap) - 32) + 'px';
    tip.style.left = A.clamp(18 + w * (cs + gap), 60, W - 60) + 'px';
    tip.classList.add('on');
    clearTimeout(timer);
    timer = setTimeout(() => { tip.classList.remove('on'); hl.setAttribute('opacity', 0); }, 1600);
  });
};

/* Barres horizontales (une série, une couleur) */
C.bars = (items, { max, fmt = v => A.fmt(v, 2) } = {}) => {
  const m = max || Math.max(...items.map(i => i.v || 0), 0.001);
  return `<div class="hbars">${items.map(i => `<div class="hbar">
    <span class="hb-l">${i.label}</span>
    <span class="hb-t"><i style="width:${i.v ? Math.max(3, i.v / m * 100) : 0}%"></i></span>
    <span class="hb-v">${i.v == null ? '—' : fmt(i.v)}</span></div>`).join('')}</div>`;
};
})();
