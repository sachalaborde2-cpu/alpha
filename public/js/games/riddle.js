'use strict';
/* ÉNIGME — Casse-têtes façon « Math Riddles » : trouver la règle cachée.
 * Chaque énigme générée est vérifiée : aucune autre règle du catalogue ne doit coller aux exemples. */
(function () {
const R = A.rand;
const cat = (a, b) => +(`${a}${b}`);

/* ----- fonctions mystères x → f(x) ----- */
const MAP = [
  { lv: 2, f: x => x * x }, { lv: 2, f: x => x * x + 1 }, { lv: 2, f: x => x * x - 1 }, { lv: 2, f: x => x * (x + 1) },
  { lv: 2, f: x => 2 * x * x }, { lv: 3, f: x => x ** 3 }, { lv: 3, f: x => x ** 3 - x }, { lv: 3, f: x => (x + 1) ** 2 },
  { lv: 3, f: x => x * x - x }, { lv: 3, f: x => 3 * x * x - 1 }, { lv: 3, f: x => x * x + 2 * x + 3 }
];
/* ----- opérateurs cachés a ⊕ b ----- */
const OPS = [
  { lv: 1, f: (a, b) => 2 * a + b }, { lv: 1, f: (a, b) => a * b + a }, { lv: 1, f: (a, b) => (a + b) * 2 }, { lv: 1, f: (a, b) => a * b - 1 },
  { lv: 2, f: (a, b) => a * a + b }, { lv: 2, f: (a, b) => a * b + a + b }, { lv: 2, f: (a, b) => a * (a + b) }, { lv: 2, f: (a, b) => a * a + b * b },
  { lv: 3, f: (a, b) => cat(a * b, a + b) }, { lv: 3, f: (a, b) => cat(a + b, a * b) }, { lv: 3, f: (a, b) => (a + b) * (a - b), c: (a, b) => a > b }, { lv: 3, f: (a, b) => cat(a * a, b * b) },
  { lv: 4, f: (a, b) => cat(a - b, a + b), c: (a, b) => a > b }, { lv: 4, f: (a, b) => cat(a * b, a - b), c: (a, b) => a > b },
  { lv: 4, f: (a, b) => (a + b) ** 2 - a * b }, { lv: 4, f: (a, b) => cat(a + b, a - b), c: (a, b) => a > b }
];
/* ----- roues : centre = f(haut, droite, bas, gauche) ----- */
const WHEEL = [
  { lv: 2, f: (t, r, b, l) => t + r + b + l }, { lv: 2, f: (t, r, b, l) => 2 * (t + r + b + l) }, { lv: 2, f: (t, r, b, l) => (t + b) - (r + l), c: (t, r, b, l) => t + b > r + l },
  { lv: 3, f: (t, r, b, l) => t * b + r * l }, { lv: 3, f: (t, r, b, l) => t * r + b * l }, { lv: 3, f: (t, r, b, l) => (t + b) * (r + l) },
  { lv: 4, f: (t, r, b, l) => t * b - r * l, c: (t, r, b, l) => t * b > r * l }, { lv: 4, f: (t, r, b, l) => t * r - b * l, c: (t, r, b, l) => t * r > b * l }, { lv: 4, f: (t, r, b, l) => (t + r) * (b + l) }
];

// l'énigme est-elle ambiguë ? (une autre règle colle aux exemples mais donne une autre réponse)
const ambiguous = (rule, pool, ex, q) => pool.some(g => g !== rule &&
  ex.every(e => (!g.c || g.c(...e)) && g.f(...e) === rule.f(...e)) && (!g.c || g.c(...q)) && g.f(...q) !== rule.f(...q));

const pickArgs = (n, cond, used) => {
  for (;;) {
    const a = Array.from({ length: n }, () => R(n === 1 ? 2 : 1, 9));
    if (n === 2 && a[0] < 2) continue;
    const k = a.join(',');
    if (used.has(k) || (cond && !cond(...a))) continue;
    used.add(k); return a;
  }
};

function genRule(pool, lv, n) {
  for (let tries = 0; tries < 200; tries++) {
    const cands = pool.filter(r => r.lv === lv || (r.lv === lv - 1 && Math.random() < 0.35));
    const rule = A.pick(cands.length ? cands : pool);
    const used = new Set();
    const ex = [0, 1, 2].map(() => pickArgs(n, rule.c, used));
    const q = pickArgs(n, rule.c, used);
    if (!ambiguous(rule, pool, ex, q) && rule.f(...q) >= 0) return { rule, ex, q, ans: rule.f(...q) };
  }
  return null;
}

function mapPuzzle(lv) {
  let pool = MAP;
  if (lv <= 1) { const a = R(2, 5), b = A.pick([-3, -2, -1, 1, 2, 3, 4, 5, 7]); pool = MAP.concat([{ lv: 1, f: x => a * x + b }]); }
  const p = genRule(pool, Math.max(1, Math.min(lv, 3)), 1);
  if (!p) return sysPuzzle(lv);
  const row = (x, y) => `<div class="rd-row"><span>${x}</span><span class="rd-op">→</span><span>${y}</span></div>`;
  return { title: 'FONCTION MYSTÈRE', html: `<div class="rd-rows">${p.ex.map(e => row(e[0], p.rule.f(...e))).join('')}${row(p.q[0], '<b class="rd-q">?</b>')}</div>`, ans: p.ans };
}

function opPuzzle(lv) {
  const p = genRule(OPS, Math.min(lv, 4), 2);
  if (!p) return sysPuzzle(lv);
  const row = (a, b, y) => `<div class="rd-row"><span>${a}</span><span class="rd-op amber">⊕</span><span>${b}</span><span class="rd-op">=</span><span>${y}</span></div>`;
  return { title: 'OPÉRATEUR CACHÉ', html: `<div class="rd-rows">${p.ex.map(e => row(e[0], e[1], p.rule.f(...e))).join('')}${row(p.q[0], p.q[1], '<b class="rd-q">?</b>')}</div>`, ans: p.ans };
}

function wheelSvg(v, c) {
  const s = 104, m = s / 2;
  const txt = (x, y, t, cls = '') => `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" class="wh-t ${cls}">${t}</text>`;
  return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
    <circle cx="${m}" cy="${m}" r="${m - 2}" fill="#10161f" stroke="#243042" stroke-width="1.5"/>
    <line x1="${m - 34}" y1="${m - 34}" x2="${m + 34}" y2="${m + 34}" stroke="#243042"/><line x1="${m + 34}" y1="${m - 34}" x2="${m - 34}" y2="${m + 34}" stroke="#243042"/>
    <circle cx="${m}" cy="${m}" r="17" fill="#05070a" stroke="${c === '?' ? '#ffb22e' : '#243042'}" stroke-width="1.5"/>
    ${txt(m, 17, v[0])}${txt(s - 17, m, v[1])}${txt(m, s - 17, v[2])}${txt(17, m, v[3])}${txt(m, m, c, c === '?' ? 'q' : 'c')}
  </svg>`;
}
function wheelPuzzle(lv) {
  for (;;) {
    const L = Math.max(2, Math.min(lv, 4));
    const rule = A.pick(WHEEL.filter(w => w.lv === L));
    const used = new Set();
    const pick = () => pickArgs(4, rule.c, used);
    const ex = [pick(), pick()], q = pick();
    if (ambiguous(rule, WHEEL, ex, q)) continue;
    return { title: 'LA ROUE', html: `<div class="wheels">${ex.map(e => wheelSvg(e, rule.f(...e))).join('')}${wheelSvg(q, '?')}</div>`, ans: rule.f(...q) };
  }
}

const SH = ['▲', '●', '■'];
function sysPuzzle(lv) {
  for (;;) {
    const vals = A.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).slice(0, 3);
    const [a, b, c] = vals;
    const s = i => `<span class="sh sh${i}">${SH[i]}</span>`;
    const eq = (l, r) => `<div class="rd-row sys"><span class="lhs">${l}</span><span class="rd-op">=</span><span>${r}</span></div>`;
    const lines = [eq(`${s(0)} + ${s(0)} + ${s(0)}`, 3 * a), eq(`${s(0)} + ${s(1)} + ${s(1)}`, a + 2 * b)];
    if (b > c) lines.push(eq(`${s(1)} − ${s(2)}`, b - c)); else lines.push(eq(`${s(1)} + ${s(2)} + ${s(2)}`, b + 2 * c));
    let q, ans;
    if (lv <= 1) { q = `${s(0)} + ${s(1)} + ${s(2)}`; ans = a + b + c; }
    else if (lv === 2) { q = `${s(2)} + ${s(0)} × ${s(1)}`; ans = c + a * b; }
    else { if (a * b <= c) continue; q = `${s(0)} × ${s(1)} − ${s(2)}`; ans = a * b - c; }
    lines.push(eq(q, '<b class="rd-q">?</b>'));
    return { title: 'SYSTÈME DE SYMBOLES', html: `<div class="rd-rows">${lines.join('')}</div>`, ans };
  }
}

function gen(lv) {
  const types = lv <= 1 ? [mapPuzzle, opPuzzle, sysPuzzle] : [mapPuzzle, opPuzzle, wheelPuzzle, sysPuzzle, opPuzzle];
  return A.pick(types)(lv);
}

A.register({
  id: 'riddle', cat: 'logi', code: 'ÉNIGME', name: 'Énigmes',
  short: 'Règles cachées façon Math Riddles',
  desc: 'Opérateurs cachés, roues, symboles, fonctions mystères : déduis la règle à partir des exemples et calcule le « ? ».',
  rules: ['Les exemples suivent tous la même règle cachée', 'Attention aux priorités (× avant +) et aux concaténations', 'La difficulté monte toutes les 3 réussites'],
  variants: [{ id: '240', label: '4 min', time: 240 }, { id: '420', label: '7 min', time: 420 }],
  def: '240', unit: 'résolues',
  perf: (s, v) => s / (v === '420' ? 13 : 8) * 100,
  start(ctx) {
    const start = A.level('riddle', 1);
    let ok = 0, skip = 0, cur, input = '', busy = false, t0 = 0;
    const times = [];
    ctx.el.innerHTML = `<div class="qbox rd"><div class="hint rd-title"></div><div class="rd-body"></div><div class="ans mono"></div></div>`;
    const body = ctx.el.querySelector('.rd-body'), title = ctx.el.querySelector('.rd-title'), ansEl = ctx.el.querySelector('.ans');
    const level = () => Math.min(4, start + Math.floor(ok / 3));
    const next = () => {
      cur = gen(level()); input = ''; busy = false; t0 = ctx.now();
      title.textContent = `${cur.title} · NIV. ${level()}`;
      body.innerHTML = cur.html;
      ansEl.textContent = ''; ansEl.classList.remove('reveal');
    };
    ctx.el.appendChild(A.keypad({
      left: 'C', actions: [{ label: 'PASSER', key: 'skip' }],
      onKey: k => {
        if (busy) return;
        if (k === 'skip') { skip++; busy = true; ansEl.textContent = cur.ans; ansEl.classList.add('reveal'); ctx.later(next, 1700); return; }
        if (k === '⌫') input = input.slice(0, -1); else if (k === 'C') input = ''; else if (input.length < 7) input += k;
        ansEl.textContent = input;
        if (input !== '' && +input === cur.ans) {
          ok++; times.push((ctx.now() - t0) / 1000); ctx.score(ok); ctx.sfx('ok'); ctx.flash(true);
          busy = true; ctx.later(next, 250);
        }
      }
    }));
    next();
    return {
      finish: () => ({
        score: ok,
        stats: [['Résolues', ok], ['Passées', skip], ['Temps moyen', times.length ? A.fmt(A.avg(times), 1) + ' s' : '—']],
        level: A.clamp(ok >= 7 ? start + 1 : ok < 3 ? start - 1 : start, 1, 4)
      })
    };
  }
});
A._riddle = { gen, mapPuzzle, opPuzzle, wheelPuzzle, sysPuzzle };
})();
