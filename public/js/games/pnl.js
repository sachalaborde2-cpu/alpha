'use strict';
/* P&L — Calcul mental financier : P&L de position, rendements, prix moyen, levier, change, dividendes. */
(function () {
const R = A.rand, f = A.num;
const eur = x => f(A.round(x, 2)) + ' €';

const GENS = [
  () => {
    const q = A.pick([50, 100, 200, 250, 400, 500, 1000]), p1 = R(40, 300) / 2;
    let m; do { m = R(-16, 16) * 0.25; } while (!m);
    return { t: 'P&L · ACHAT', q: `Achat de ${q} actions à ${eur(p1)}, revente à ${eur(p1 + m)}. P&L ?`, ans: q * m, e: `${q} × (${f(p1 + m)} − ${f(p1)}) = ${eur(q * m)}` };
  },
  () => {
    const q = A.pick([100, 200, 300, 500]), p1 = R(40, 240) / 2;
    let m; do { m = R(-12, 12) * 0.5; } while (!m);
    return { t: 'P&L · VENTE À DÉCOUVERT', q: `Vente à découvert de ${q} actions à ${eur(p1)}, rachat à ${eur(p1 + m)}. P&L ?`, ans: -q * m, e: `À découvert on gagne quand ça baisse : ${q} × (${f(p1)} − ${f(p1 + m)}) = ${eur(-q * m)}` };
  },
  () => {
    const p1 = A.pick([20, 25, 40, 50, 80, 120, 125, 200, 250, 400]);
    let pct; do { pct = R(-8, 12) * 5; } while (!pct);
    return { t: 'RENDEMENT', q: `Achat à ${eur(p1)}, revente à ${eur(p1 * (1 + pct / 100))}. Rendement en % ?`, ans: pct, e: `(${f(p1 * (1 + pct / 100))} − ${p1}) / ${p1} = ${f(pct)} %` };
  },
  () => {
    const [q1, q2] = A.pick([[100, 100], [100, 300], [300, 100], [200, 200], [100, 400], [400, 100], [200, 300], [300, 200]]);
    const p1 = R(20, 80), p2 = p1 + R(-10, 10);
    const avg = (q1 * p1 + q2 * p2) / (q1 + q2);
    return { t: 'PRIX MOYEN', q: `Achat de ${q1} à ${eur(p1)}, puis ${q2} à ${eur(p2)}. Prix de revient moyen ?`, ans: avg, e: `(${q1}×${p1} + ${q2}×${p2}) / ${q1 + q2} = ${eur(avg)}` };
  },
  () => {
    const L = A.pick([2, 3, 4, 5, 10]);
    let x; do { x = R(-9, 9) * 0.5; } while (!x);
    return { t: 'LEVIER', q: `Position à levier ×${L}. Le sous-jacent fait ${x > 0 ? '+' : '−'}${f(Math.abs(x))} %. Ta performance en % ?`, ans: L * x, e: `${L} × ${f(x)} % = ${f(L * x)} %` };
  },
  () => {
    const a = A.pick([10, 20, 25, 50, -10, -20, -25, -50]), b = A.pick([10, 20, 25, 50, -10, -20, -25, -50].filter(x => x !== a));
    const t = ((1 + a / 100) * (1 + b / 100) - 1) * 100;
    return { t: 'RENDEMENTS COMPOSÉS', q: `Une action fait ${a > 0 ? '+' : '−'}${Math.abs(a)} % puis ${b > 0 ? '+' : '−'}${Math.abs(b)} %. Variation totale en % ?`, ans: A.round(t, 2), e: `${f(1 + a / 100)} × ${f(1 + b / 100)} = ${f(1 + t / 100)} → ${f(A.round(t, 2))} %` };
  },
  () => {
    const r = A.pick([1.1, 1.2, 1.25, 1.5, 0.8]), E = R(2, 40) * 10;
    return Math.random() < 0.5
      ? { t: 'CHANGE', q: `1 € = ${f(r)} $. Combien d’euros pour ${f(E * r)} $ ?`, ans: E, e: `${f(E * r)} / ${f(r)} = ${E} €` }
      : { t: 'CHANGE', q: `1 € = ${f(r)} $. Combien de dollars pour ${E} € ?`, ans: A.round(E * r, 2), e: `${E} × ${f(r)} = ${f(E * r)} $` };
  },
  () => {
    const [l, g] = A.pick([[10, 11.11], [20, 25], [25, 33.33], [40, 66.67], [50, 100], [60, 150], [75, 300], [30, 42.86]]);
    return { t: 'RETOUR À ZÉRO', q: `Ton portefeuille perd ${l} %. Quelle hausse (en %) pour revenir au point de départ ?`, ans: g, e: `1 / (1 − ${f(l / 100)}) − 1 = ${f(g)} %` };
  },
  () => {
    const p = A.pick([40, 50, 80, 100, 120, 125, 200, 250]), y = A.pick([1, 1.5, 2, 2.5, 3, 4, 5, 6]);
    return { t: 'DIVIDENDE', q: `Action à ${eur(p)}, dividende annuel de ${eur(p * y / 100)}. Rendement en % ?`, ans: y, e: `${f(p * y / 100)} / ${p} = ${f(y)} %` };
  },
  () => {
    const q = A.pick([20, 50, 150, 250, 300, 400]), p = R(1000, 9000) / 100;
    return { t: 'VALEUR DE POSITION', q: `${q} actions à ${eur(p)}. Valeur de la position ?`, ans: A.round(q * p, 2), e: `${q} × ${f(p)} = ${eur(q * p)}` };
  }
];

A.register({
  id: 'pnl', cat: 'calc', code: 'P&L', name: 'P&L Express',
  short: 'Calcul mental façon desk',
  desc: 'P&L de positions, rendements, prix moyen, levier, change, dividendes : le calcul mental qu’on te demande vraiment sur un desk.',
  rules: ['Réponse validée dès qu’elle est juste à 0,01 près', '± pour une perte, virgule sur le pavé', 'PASSER affiche le calcul détaillé'],
  variants: [{ id: '180', label: '3 min', time: 180 }, { id: '300', label: '5 min', time: 300 }],
  def: '180', unit: 'calculs',
  perf: (s, v) => s / (v === '300' ? 22 : 14) * 100,
  start(ctx) {
    let ok = 0, skip = 0, cur, input = '', busy = false, t0 = 0;
    const times = [];
    ctx.el.innerHTML = `<div class="qbox fv"><div class="hint fv-t"></div><div class="pb-q fv-q"></div><div class="ans mono"></div><div class="fv-e"></div></div>`;
    const $ = s => ctx.el.querySelector(s);
    const next = () => {
      let n; do { n = A.pick(GENS)(); } while (cur && n.t === cur.t);
      cur = n; input = ''; busy = false; t0 = ctx.now();
      $('.fv-t').textContent = cur.t; $('.fv-q').textContent = cur.q;
      $('.ans').textContent = ''; $('.ans').classList.remove('reveal'); $('.fv-e').innerHTML = '';
    };
    ctx.el.appendChild(A.keypad({
      left: 'C', actions: [{ label: '±', key: '-' }, { label: ',', key: ',' }, { label: 'PASSER', key: 'skip' }],
      onKey: k => {
        if (busy) return;
        if (k === 'skip') {
          skip++; busy = true;
          $('.ans').textContent = A.showNum(String(A.round(cur.ans, 2))); $('.ans').classList.add('reveal');
          $('.fv-e').innerHTML = `<div class="expl">${cur.e}</div>`;
          ctx.later(next, 2400); return;
        }
        input = A.editNum(input, k, 8);
        $('.ans').textContent = A.showNum(input);
        if (A.numOk(input, cur.ans)) {
          ok++; times.push((ctx.now() - t0) / 1000); ctx.score(ok); ctx.sfx('ok'); ctx.flash(true);
          busy = true; ctx.later(next, 220);
        }
      }
    }));
    next();
    return {
      finish: () => ({
        score: ok,
        stats: [['Calculs justes', ok], ['Passés', skip], ['Temps moyen', times.length ? A.fmt(A.avg(times), 1) + ' s' : '—']]
      })
    };
  }
});
A._pnl = { GENS };
})();
