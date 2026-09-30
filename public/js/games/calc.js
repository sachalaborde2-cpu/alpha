'use strict';
/* ZMAC — Sprint calcul (réglages Zetamac) : validation automatique dès que la réponse est juste. */
(function () {
const R = A.rand;
const OPS = ['+', '−', '×', '÷'];

function gen(hard) {
  const t = R(0, 3);
  let a, b;
  if (t < 2) { a = hard ? R(10, 999) : R(2, 100); b = hard ? R(10, 999) : R(2, 100); }
  else { a = hard ? R(3, 25) : R(2, 12); b = hard ? R(10, 200) : R(2, 100); }
  if (t === 0) return { op: 0, q: `${a} + ${b}`, ans: a + b };
  if (t === 1) return { op: 1, q: `${a + b} − ${a}`, ans: b };
  if (t === 2) return Math.random() < 0.5 ? { op: 2, q: `${a} × ${b}`, ans: a * b } : { op: 2, q: `${b} × ${a}`, ans: a * b };
  return { op: 3, q: `${a * b} ÷ ${a}`, ans: b };
}

A.register({
  id: 'calc', cat: 'calc', code: 'ZMAC', name: 'Sprint Calcul',
  short: 'Le test Zetamac des desks de trading',
  desc: "Enchaîne un maximum d'opérations. La réponse est validée dès qu'elle est juste : pas de bouton, que de la vitesse.",
  rules: [
    '+ et − jusqu’à 100 · × et ÷ par 2 à 12 (réglages Zetamac standard)',
    'Validation automatique : tape juste, la suivante arrive',
    'Repère indicatif desks de trading : 40+ en 2 min, 60+ = excellent'
  ],
  variants: [{ id: '120', label: '2 min', time: 120 }, { id: '60', label: '1 min', time: 60 }, { id: 'hard', label: 'Hard · 2 min', time: 120 }],
  def: '120', unit: 'bonnes réponses',
  bench: { '120': { v: 40, label: 'REPÈRE 40' } },
  // courbe concave : progresser compte vite au début, les derniers points sont durs à aller chercher
  // (2 min : 15 → 46, 25 → 65, 40 → 81, 60 → 92)
  perf: (s, v) => 100 * (1 - Math.exp(-s / (v === '60' ? 12 : v === 'hard' ? 16 : 24))),
  start(ctx) {
    const hard = ctx.v.id === 'hard';
    ctx.el.innerHTML = `<div class="qbox"><div class="q"></div><div class="ans mono"></div><div class="hint">VALIDATION AUTO</div></div>`;
    const qEl = ctx.el.querySelector('.q'), ansEl = ctx.el.querySelector('.ans');
    let cur = null, input = '', score = 0, t0 = 0;
    const times = [[], [], [], []];
    const next = () => {
      let n; do { n = gen(hard); } while (cur && n.q === cur.q);
      cur = n; input = ''; t0 = ctx.now();
      qEl.textContent = cur.q; ansEl.textContent = '';
    };
    ctx.el.appendChild(A.keypad({
      left: 'C',
      onKey: k => {
        if (k === '⌫') input = input.slice(0, -1);
        else if (k === 'C') input = '';
        else if (input.length < 6) input += k;
        ansEl.textContent = input;
        if (input !== '' && +input === cur.ans) {
          times[cur.op].push((ctx.now() - t0) / 1000);
          score++; ctx.score(score); ctx.sfx('ok');
          next();
        }
      }
    }));
    next();
    return {
      finish() {
        const all = times.flat();
        const lat = times.map(t => A.avg(t));
        const worst = lat.reduce((w, v, i) => v != null && (w < 0 || v > lat[w]) ? i : w, -1);
        return {
          score,
          stats: [
            ['Cadence', A.fmt(score / ctx.v.time * 60, 1) + '/min'],
            ['Latence moy.', all.length ? A.fmt(A.avg(all), 2) + ' s' : '—'],
            ['Point faible', worst >= 0 ? `${OPS[worst]} · ${A.fmt(lat[worst], 2)} s` : '—'],
            ...OPS.map((o, i) => [`Latence ${o}`, lat[i] != null ? A.fmt(lat[i], 2) + ' s' : '—'])
          ],
          x: { lat }
        };
      }
    };
  }
});
})();
