'use strict';
/* SUITE — Suites logiques : trouver le terme suivant. Difficulté croissante pendant la partie. */
(function () {
const R = A.rand;
const PR = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71];
const rec = (n, f) => Array.from({ length: n }, (_, i) => f(i));
const iter = (n, a, f) => { const t = [a]; for (let i = 1; i < n; i++) t.push(f(t[i - 1], i)); return t; };
const iter2 = (n, a, b, f) => { const t = [a, b]; for (let i = 2; i < n; i++) t.push(f(t[i - 2], t[i - 1])); return t; };
const sgn = () => A.pick([-1, 1, 1]);

const LV = {
  1: [
    () => { const a = R(1, 30), d = sgn() * R(2, 9); return rec(6, i => a + d * i); },
    () => { const a = R(1, 5), r = R(2, 3); return rec(6, i => a * r ** i); },
    () => { const a = R(60, 120), d = R(3, 12); return rec(6, i => a - d * i); }
  ],
  2: [
    () => { const a = R(1, 12), p = R(2, 9), q = sgn() * R(1, 7); return iter(7, a, (t, i) => t + (i % 2 ? p : q)); },
    () => { const k = R(1, 6), c = R(-3, 5); return rec(6, i => (i + k) ** 2 + c); },
    () => { const a = R(1, 4); return rec(6, i => a * (-2) ** i); },
    () => { const a = R(1, 6), c = A.pick([-1, 1, 2, 3]); return iter(6, a, t => 2 * t + c); }
  ],
  3: [
    () => { const a = R(1, 15), d = R(1, 6), k = R(1, 4); return rec(6, i => a + d * i + k * i * (i - 1) / 2); },
    () => iter2(7, R(1, 6), R(1, 8), (x, y) => x + y),
    () => { const a = R(1, 6), k = R(2, 3), c = R(1, 6); return iter(7, a, (t, i) => i % 2 ? t * k : t + c); },
    () => { const a = R(1, 20), d = R(2, 7), b = R(40, 70), e = R(2, 6); return rec(8, i => i % 2 ? b - e * ((i - 1) / 2) : a + d * (i / 2)); }
  ],
  4: [
    () => { const k = R(1, 4), c = R(-2, 3); return rec(6, i => (i + k) ** 3 + c); },
    () => { const s = R(0, 8); return rec(6, i => PR[s + i]); },
    () => { const k = R(1, 6); return rec(6, i => (i + k) * (i + k + 1) / 2); },
    () => { const a = R(1, 10), d = R(1, 3); return rec(6, i => a + d * (2 ** i - 1)); },
    () => { const a = R(2, 6), c = R(1, 4); return iter(6, a, t => 3 * t - c); },
    () => { const k = R(2, 6); return rec(6, i => (i + k) * (i + k - 1)); }
  ],
  5: [
    () => { const t = [R(0, 2), R(1, 3), R(1, 4)]; for (let i = 3; i < 8; i++) t.push(t[i - 1] + t[i - 2] + t[i - 3]); return t; },
    () => iter(6, R(1, 3), (t, i) => t * (i + 1)),
    () => { const a = R(1, 10), d = R(1, 4), k = R(1, 3), m = R(1, 2); return rec(7, i => a + d * i + k * i * (i - 1) / 2 + m * i * (i - 1) * (i - 2) / 6); },
    () => iter2(7, R(1, 4), R(1, 5), (x, y) => y + 2 * x),
    () => { const k = R(2, 5); return rec(6, i => (i % 2 ? -1 : 1) * (i + k) ** 2); },
    () => { const k = R(1, 4); return rec(6, i => 2 ** (i + k) - (i + k)); }
  ]
};

function gen(level) {
  for (;;) {
    const lv = level > 1 && Math.random() < 0.3 ? level - 1 : level;
    const t = A.pick(LV[lv])();
    if (t.every(x => Number.isInteger(x) && Math.abs(x) < 100000) && new Set(t).size > 2)
      return { shown: t.slice(0, -1), ans: t[t.length - 1], lv };
  }
}

A.register({
  id: 'seq', cat: 'logi', code: 'SUITE', name: 'Suites logiques',
  short: 'Trouve le terme suivant',
  desc: 'Arithmétiques, géométriques, alternées, entrelacées, récurrentes… Trouve la logique et le terme suivant. La difficulté monte toutes les 3 bonnes réponses.',
  rules: [
    'Facile : suites simples (+, −, ×) · Moyen : alternées et carrés · Difficile : jusqu’au niveau 5 · Réflexion : sans chrono, tape FIN',
    'La réponse est validée dès qu’elle est juste', 'PASSER révèle la réponse (pas de pénalité, mais pas de point)', 'Pense aux différences, aux rapports, aux carrés et à l’entrelacement'],
  variants: [
    { id: 'easy', label: 'Facile', time: 180, w: 0.85, note: '3 min · niveaux 1 à 2, montée lente' },
    { id: 'mid', label: 'Moyen', time: 180, w: 0.95, note: '3 min · niveaux 2 à 3' },
    { id: '180', label: 'Difficile', time: 180, note: '3 min · du niveau 3 au niveau 5' },
    { id: 'free', label: 'Réflexion', time: null, free: true, w: 0.95, note: 'Sans chrono · niveaux 3 à 5, tape FIN pour terminer' },
    { id: '300', label: '5 min', time: 300, hide: true }
  ],
  def: 'easy', unit: 'trouvées',
  perf: (s, v) => s / ({ '300': 22, easy: 12, mid: 12, free: 10 }[v] || 14) * 100,
  start(ctx) {
    // chaque niveau a sa plage fixe : le niveau d'une partie n'est jamais hérité d'une autre
    const CFG = { easy: { start: 1, cap: 2, step: 4 }, mid: { start: 2, cap: 3, step: 4 }, free: { start: 3, cap: 5, step: 2 } }[ctx.v.id] || { start: 3, cap: 5, step: 3 };
    const start = CFG.start;
    let ok = 0, skip = 0, cur, input = '', busy = false, lvMax = start, t0 = 0;
    const times = [];
    ctx.el.innerHTML = `<div class="qbox"><div class="hint lvl"></div><div class="seq-row"></div><div class="ans mono"></div></div>`;
    const row = ctx.el.querySelector('.seq-row'), ansEl = ctx.el.querySelector('.ans'), lvl = ctx.el.querySelector('.lvl');
    const level = () => Math.min(CFG.cap, start + Math.floor(ok / CFG.step));
    const next = () => {
      cur = gen(level()); input = ''; busy = false; t0 = ctx.now();
      lvMax = Math.max(lvMax, level());
      lvl.textContent = `NIVEAU ${level()}`;
      row.innerHTML = cur.shown.map(x => `<span class="seq-t">${String(x).replace('-', '−')}</span>`).join('') + '<span class="seq-t q">?</span>';
      ansEl.textContent = ''; ansEl.classList.remove('reveal');
    };
    ctx.el.appendChild(A.keypad({
      left: '-',
      actions: [{ label: 'PASSER', key: 'skip' }],
      onKey: k => {
        if (busy) return;
        if (k === 'skip') {
          skip++; busy = true;
          ansEl.textContent = String(cur.ans).replace('-', '−'); ansEl.classList.add('reveal');
          ctx.later(next, 1300); return;
        }
        if (k === '⌫') input = input.slice(0, -1);
        else if (k === '-') input = input.startsWith('-') ? input.slice(1) : '-' + input;
        else if (input.length < 7) input += k;
        ansEl.textContent = input.replace('-', '−');
        if (input !== '' && input !== '-' && +input === cur.ans) {
          ok++; times.push((ctx.now() - t0) / 1000); ctx.score(ok); ctx.sfx('ok'); ctx.flash(true);
          busy = true; ctx.later(next, 180);
        }
      }
    }));
    next();
    return {
      finish: () => ({
        score: ok,
        stats: [['Trouvées', ok], ['Passées', skip], ['Niveau max', lvMax], ['Temps moyen', times.length ? A.fmt(A.avg(times), 1) + ' s' : '—']]
      })
    };
  }
});
})();
