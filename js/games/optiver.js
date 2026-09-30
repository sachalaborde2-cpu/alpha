'use strict';
/* 80EN8 — Test numérique type Optiver : QCM, décimales, fractions, % ; mauvaise réponse = −1. */
(function () {
const R = A.rand, r4 = x => A.round(x, 4), f = A.num;

const GENS = [
  () => { const a = R(12, 99), b = R(3, 9); return { q: `${a} × ${b}`, ans: a * b }; },
  () => { const a = R(11, 39), b = R(11, 29); return { q: `${a} × ${b}`, ans: a * b }; },
  () => { const a = R(2, 9) / 10, b = R(12, 95); return { q: `${f(a)} × ${b}`, ans: r4(a * b) }; },
  () => { const a = R(11, 45) / 10, b = R(2, 9) / 10; return { q: `${f(a)} × ${f(b)}`, ans: r4(a * b) }; },
  () => { const d = A.pick([0.2, 0.25, 0.4, 0.5, 0.8, 1.2, 1.5, 2.5]), q = R(3, 40); return { q: `${f(r4(q * d))} ÷ ${f(d)}`, ans: q }; },
  () => { const n = A.pick([4, 5, 8, 12, 15, 25]), q = R(12, 99); return { q: `${n * q} ÷ ${n}`, ans: q }; },
  () => { const a = R(1000, 9999) / 100, b = R(100, 999) / 10; return { q: `${f(a)} + ${f(b)}`, ans: r4(a + b) }; },
  () => { const a = R(5000, 19999) / 100, b = R(1000, 4999) / 100; return { q: `${f(a)} − ${f(b)}`, ans: r4(a - b) }; },
  () => { const p = A.pick([5, 12.5, 15, 20, 25, 35, 40, 60, 75]), b = R(2, 30) * 8; return { q: `${f(p)} % de ${b}`, ans: r4(p * b / 100) }; },
  () => { const d = A.pick([3, 4, 5, 6, 8]), n = R(1, d - 1), k = R(2, 12) * d; return { q: `${n}/${d} × ${k}`, ans: n * k / d }; },
  () => {
    const b = A.pick([2, 3, 4, 5, 6, 8]), d = A.pick([3, 4, 6, 8, 10, 12]);
    const a = R(1, b - 1), c = R(1, d - 1);
    return { q: `${a}/${b} + ${c}/${d}`, frac: A.F.add(A.F.make(a, b), A.F.make(c, d)), naive: A.F.make(a + c, b + d) };
  }
];

function options(item) {
  if (item.frac) {
    const F = item.frac, pool = [item.naive, A.F.make(F.n + 1, F.d), A.F.make(Math.max(1, F.n - 1), F.d), A.F.make(F.n, F.d + 1), A.F.make(F.n + F.d, F.d * 2)];
    const seen = new Set([A.F.str(F)]), out = [A.F.str(F)];
    for (const p of A.shuffle(pool)) { const s = A.F.str(p); if (!seen.has(s) && out.length < 4) { seen.add(s); out.push(s); } }
    return { ans: A.F.str(F), opts: A.shuffle(out) };
  }
  const v = item.ans, int = Number.isInteger(v);
  // pièges plausibles : même dernier chiffre (±10, ±20), décalage de virgule, ±1
  const pool = int ? [v + 10, v - 10, v + 20, v - 20, v * 10, v + 1, v - 1, v + 100]
                   : [v * 10, v / 10, v + 1, v - 1, v + 0.1, v - 0.1, v + 10];
  const seen = new Set([f(v)]), out = [f(v)];
  for (const p of A.shuffle(pool)) { const s = f(r4(p)); if (p > 0 && !seen.has(s) && out.length < 4) { seen.add(s); out.push(s); } }
  return { ans: f(v), opts: A.shuffle(out) };
}

A.register({
  id: 'optiver', cat: 'calc', code: '80EN8', name: '80 en 8',
  short: 'Le test numérique type Optiver',
  desc: 'Calcul mental en QCM sous pression : décimales, fractions, pourcentages. Chaque erreur coûte un point, donc ne tire pas au hasard.',
  rules: ['Une bonne réponse = +1, une erreur = −1', 'Décimales, fractions, pourcentages, multiplications', 'Astuce : estime l’ordre de grandeur, puis vérifie le dernier chiffre'],
  variants: [{ id: '40', label: '40 en 4', time: 240, n: 40 }, { id: '80', label: '80 en 8', time: 480, n: 80 }],
  def: '40', unit: 'points nets',
  perf: (s, v) => s / (v === '80' ? 60 : 30) * 100,
  start(ctx) {
    const N = ctx.v.n;
    let i = 0, good = 0, bad = 0, cur, locked = false;
    ctx.el.innerHTML = `<div class="qbox"><div class="hint qn"></div><div class="q"></div></div><div class="opts"></div>`;
    const qEl = ctx.el.querySelector('.q'), qn = ctx.el.querySelector('.qn'), oEl = ctx.el.querySelector('.opts');
    const next = () => {
      if (i >= N) return ctx.end(result());
      const item = A.pick(GENS)();
      cur = options(item); locked = false;
      qn.textContent = `QUESTION ${i + 1}/${N}`;
      qEl.textContent = item.q;
      qEl.style.fontSize = item.q.length > 13 ? '32px' : '';
      oEl.innerHTML = cur.opts.map(o => `<button class="opt">${o}</button>`).join('');
      oEl.querySelectorAll('.opt').forEach(b => A.tap(b, () => {
        if (locked) return;
        locked = true; i++;
        if (b.textContent === cur.ans) { good++; ctx.sfx('ok'); b.classList.add('good'); ctx.later(next, 120); }
        else {
          bad++; ctx.flash(false); ctx.sfx('bad'); b.classList.add('bad');
          [...oEl.children].find(x => x.textContent === cur.ans).classList.add('good');
          ctx.later(next, 650);
        }
        ctx.score(good - bad);
        ctx.progress(i / N);
      }));
    };
    const result = () => ({
      score: good - bad,
      stats: [['Justes', good], ['Fausses', bad], ['Précision', good + bad ? A.fmt(good / (good + bad) * 100, 0) + ' %' : '—'], ['Répondues', `${i}/${N}`]],
      x: { good, bad }
    });
    next();
    return { finish: result };
  }
});
})();
