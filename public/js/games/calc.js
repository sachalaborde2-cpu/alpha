'use strict';
/* ZMAC — Sprint calcul (réglages Zetamac) : validation automatique dès que la réponse est juste. */
(function () {
const R = A.rand;
const OPS = ['+', '−', '×', '÷'];

// plages par niveau : [+ −], [facteur ×÷], [multiplicande]
const LV = {
  easy: { add: [2, 30], ma: [2, 5], mb: [2, 10] },
  mid: { add: [2, 60], ma: [2, 9], mb: [2, 20] },
  std: { add: [2, 100], ma: [2, 12], mb: [2, 100] },
  hard: { add: [10, 999], ma: [3, 25], mb: [10, 200] }
};
function gen(lv) {
  const L = LV[lv] || LV.std, t = R(0, 3);
  let a, b;
  if (t < 2) { a = R(...L.add); b = R(...L.add); }
  else { a = R(...L.ma); b = R(...L.mb); }
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
    'Facile : + et − jusqu’à 30, tables de 2 à 5 · Moyen : jusqu’à 60, tables jusqu’à 9',
    'Difficile : réglages Zetamac standard (+ et − jusqu’à 100, × et ÷ par 2 à 12) · Expert : nombres à 3 chiffres',
    'Validation automatique : tape juste, la suivante arrive',
    'Repère indicatif desks de trading : 40+ en 2 min, 60+ = excellent'
  ],
  variants: [
    { id: 'easy', label: 'Facile', time: 60, w: 0.85, note: '1 min · petits nombres, tables de 2 à 5' },
    { id: 'mid', label: 'Moyen', time: 120, w: 0.95, note: '2 min · nombres jusqu’à 60, tables jusqu’à 9' },
    { id: '120', label: 'Difficile', time: 120, note: '2 min · réglages Zetamac standard' },
    { id: 'hard', label: 'Expert', time: 120, note: '2 min · nombres à 3 chiffres' },
    { id: '60', label: '1 min Zetamac', time: 60, hide: true }
  ],
  def: 'easy', unit: 'bonnes réponses',
  bench: { '120': { v: 40, label: 'REPÈRE 40' } },
  // courbe concave : progresser compte vite au début, les derniers points sont durs à aller chercher
  // (2 min : 15 → 46, 25 → 65, 40 → 81, 60 → 92)
  perf: (s, v) => 100 * (1 - Math.exp(-s / ({ easy: 14, mid: 22, '60': 12, hard: 16 }[v] || 24))),
  start(ctx) {
    const lv = { easy: 'easy', mid: 'mid', hard: 'hard' }[ctx.v.id] || 'std';
    ctx.el.innerHTML = `<div class="qbox"><div class="q"></div><div class="ans mono"></div><div class="hint">VALIDATION AUTO</div></div>`;
    const qEl = ctx.el.querySelector('.q'), ansEl = ctx.el.querySelector('.ans');
    let cur = null, input = '', score = 0, t0 = 0;
    const times = [[], [], [], []];
    const next = () => {
      let n; do { n = gen(lv); } while (cur && n.q === cur.q);
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
