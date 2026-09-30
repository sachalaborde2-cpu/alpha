'use strict';
/* ARB — Arbitrage : touche la valeur la plus élevée. Les écarts se resserrent avec ta série. */
(function () {
const R = A.rand;
const GAPS = [[0.12, 0.4], [0.06, 0.2], [0.03, 0.1], [0.015, 0.05], [0.004, 0.02]];
const frac = (a, b) => `<span class="fr"><i>${a}</i><i>${b}</i></span>`;

const MK = {
  frac: () => { const b = R(3, 17), a = R(1, 2 * b - 1); return { s: frac(a, b), v: a / b }; },
  dec: () => { const v = R(5, 190) / 100; return { s: A.num(v), v }; },
  prod: () => { const a = R(4, 39), b = R(4, 39); return { s: `${a} × ${b}`, v: a * b }; },
  pct: () => { const p = R(1, 19) * 5, x = R(4, 40) * 10; return { s: `${p} % de ${x}`, v: p * x / 100 }; },
  pow: () => { const b = A.pick([2, 3, 5, 7]), e = b === 2 ? R(5, 13) : b === 3 ? R(3, 8) : b === 5 ? R(2, 5) : R(2, 4); return { s: `${b}<sup>${e}</sup>`, v: b ** e }; },
  sqrt: () => { const n = R(5, 150); return { s: `√${n}`, v: Math.sqrt(n) }; },
  dec2: () => { const v = R(22, 125) / 10; return { s: A.num(v), v }; },
  sum: () => { const a = R(120, 890), b = R(120, 890); return { s: `${a} + ${b}`, v: a + b }; },
  prod2: () => { const a = R(20, 60), b = R(12, 40); return { s: `${a} × ${b}`, v: a * b }; }
};
const PAIRS = [
  { lv: 0, a: 'frac', b: 'frac' }, { lv: 0, a: 'frac', b: 'dec' }, { lv: 0, a: 'prod', b: 'prod' }, { lv: 0, a: 'pct', b: 'pct' },
  { lv: 1, a: 'pow', b: 'pow' }, { lv: 1, a: 'sqrt', b: 'dec2' }, { lv: 2, a: 'sum', b: 'prod2' }, { lv: 2, a: 'pct', b: 'prod' }
];

function gen(lv) {
  const [lo, hi] = GAPS[lv];
  for (let t = 0; t < 400; t++) {
    const pr = A.pick(PAIRS.filter(p => p.lv <= lv));
    const x = MK[pr.a](), y = MK[pr.b]();
    const gap = Math.abs(x.v - y.v) / Math.max(x.v, y.v);
    if (gap >= lo && gap <= hi) return Math.random() < 0.5 ? [x, y] : [y, x];
  }
  const x = MK.frac(), y = MK.dec();
  return x.v === y.v ? gen(lv) : [x, y];
}

A.register({
  id: 'arb', cat: 'viva', code: 'ARB', name: 'Arbitrage',
  short: 'Repère la valeur la plus haute, vite',
  desc: 'Deux cotations s’affichent : touche la plus élevée. Fractions, puissances, pourcentages, racines… Plus ta série est longue, plus les écarts se resserrent.',
  rules: ['Bonne réponse +1, erreur −1', 'Série de 4 : le spread se resserre · erreur : il s’élargit', 'Estime, ne calcule pas tout : c’est un jeu de vitesse'],
  variants: [{ id: '60', label: '1 min', time: 60 }, { id: '120', label: '2 min', time: 120 }],
  def: '60', unit: 'points nets',
  perf: (s, v) => s / (v === '120' ? 60 : 30) * 100,
  start(ctx) {
    let lv = 0, streak = 0, good = 0, bad = 0, lvMax = 0, pair, t0 = 0, busy = false;
    const rts = [];
    ctx.el.innerHTML = `<div class="arb"><div class="hint arb-h">TOUCHE LA PLUS HAUTE</div>
      <div class="arb-cards"><button class="arb-c" data-i="0"></button><div class="arb-vs mono">VS</div><button class="arb-c" data-i="1"></button></div>
      <div class="arb-spread hint"></div></div>`;
    const cs = [...ctx.el.querySelectorAll('.arb-c')], spEl = ctx.el.querySelector('.arb-spread');
    const next = () => {
      pair = gen(lv); t0 = ctx.now(); busy = false;
      cs.forEach((c, i) => { c.innerHTML = pair[i].s; c.classList.remove('good', 'bad'); });
      spEl.innerHTML = `SPREAD ${'▮'.repeat(5 - lv)}${'▯'.repeat(lv)} · NIV. ${lv + 1}`;
    };
    cs.forEach((c, i) => A.tap(c, () => {
      if (busy) return;
      busy = true;
      const ok = pair[i].v > pair[1 - i].v;
      rts.push((ctx.now() - t0) / 1000);
      if (ok) {
        good++; streak++; c.classList.add('good'); ctx.sfx('ok');
        if (streak % 4 === 0) lv = Math.min(4, lv + 1);
      } else {
        bad++; streak = 0; c.classList.add('bad'); cs[1 - i].classList.add('good'); ctx.sfx('bad'); ctx.flash(false);
        lv = Math.max(0, lv - 1);
      }
      lvMax = Math.max(lvMax, lv);
      ctx.score(good - bad);
      ctx.later(next, ok ? 140 : 550);
    }));
    next();
    return {
      finish: () => ({
        score: good - bad,
        stats: [['Justes', good], ['Fausses', bad], ['Précision', good + bad ? A.fmt(good / (good + bad) * 100, 0) + ' %' : '—'], ['Temps de réaction', rts.length ? A.fmt(A.avg(rts), 2) + ' s' : '—'], ['Spread min atteint', 'niv. ' + (lvMax + 1)]],
        x: { rt: A.avg(rts) }
      })
    };
  }
});
})();
