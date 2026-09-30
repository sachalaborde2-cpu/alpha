'use strict';
/* 24 — Atteindre 24 avec 4 nombres et + − × ÷ (grand classique des entretiens trading). */
(function () {
const F = A.F;
const SYM = { '+': '+', '-': '−', '*': '×', '/': '÷' };

// Solveur exhaustif (flottants) : renvoie une expression ou null
function solve(items) {
  if (items.length === 1) return Math.abs(items[0].v - 24) < 1e-9 ? items[0].e : null;
  for (let i = 0; i < items.length; i++) for (let j = 0; j < items.length; j++) {
    if (i === j) continue;
    const a = items[i], b = items[j];
    const rest = items.filter((_, k) => k !== i && k !== j);
    const cands = [{ v: a.v - b.v, e: `(${a.e} − ${b.e})` }];
    if (Math.abs(b.v) > 1e-12) cands.push({ v: a.v / b.v, e: `(${a.e} ÷ ${b.e})` });
    if (i < j) cands.push({ v: a.v + b.v, e: `(${a.e} + ${b.e})` }, { v: a.v * b.v, e: `(${a.e} × ${b.e})` }); // commutatifs : une seule fois
    for (const c of cands) { const r = solve(rest.concat([c])); if (r) return r; }
  }
  return null;
}
const clean = e => e.replace(/^\((.*)\)$/, '$1');

function gen(max) {
  for (;;) {
    const ns = [0, 0, 0, 0].map(() => A.rand(1, max));
    const s = solve(ns.map(n => ({ v: n, e: String(n) })));
    if (s) return { ns, sol: clean(s) };
  }
}

A.register({
  id: 'g24', cat: 'calc', code: '24', name: 'Le 24',
  short: 'Le casse-tête favori des trading firms',
  desc: 'Combine les 4 nombres avec + − × ÷ pour obtenir exactement 24. Chaque nombre sert une fois. Les fractions intermédiaires sont permises.',
  rules: ['Touche un nombre, un opérateur, puis un second nombre', '↶ annule le dernier calcul, PASSER montre une solution', 'Les premiers tirages vont de 1 à 9, puis de 1 à 13'],
  variants: [{ id: '180', label: '3 min', time: 180 }, { id: '300', label: '5 min', time: 300 }],
  def: '180', unit: 'résolus',
  perf: (s, v) => s / (v === '300' ? 18 : 11) * 100,
  start(ctx) {
    let solved = 0, skipped = 0, cur, cards, hist, sel = null, op = null, busy = false, t0 = 0;
    const times = [];
    ctx.el.innerHTML = `<div class="g24">
      <div class="hint g24-h">ATTEINS 24</div>
      <div class="g24-cards"></div>
      <div class="g24-ops">${['+', '-', '*', '/'].map(o => `<button class="g24-op" data-o="${o}">${SYM[o]}</button>`).join('')}</div>
      <div class="g24-sol hint"></div>
      <div class="kp-actions"><button class="key act" data-a="undo">↶ ANNULER</button><button class="key act" data-a="skip">PASSER</button></div>
    </div>`;
    const cEl = ctx.el.querySelector('.g24-cards'), solEl = ctx.el.querySelector('.g24-sol');
    const render = () => {
      cEl.innerHTML = cards.map((c, i) => `<button class="g24-card${sel === i ? ' sel' : ''}${c ? '' : ' gone'}" data-i="${i}">${c ? F.str(c) : ''}</button>`).join('');
      cEl.querySelectorAll('.g24-card').forEach(b => A.tap(b, () => pickCard(+b.dataset.i)));
      ctx.el.querySelectorAll('.g24-op').forEach(b => b.classList.toggle('sel', b.dataset.o === op));
    };
    const next = () => {
      cur = gen(solved < 4 ? 9 : 13);
      cards = cur.ns.map(n => F.make(n)); hist = []; sel = null; op = null; busy = false; t0 = ctx.now();
      solEl.textContent = '';
      render();
    };
    const pickCard = i => {
      if (busy || !cards[i]) return;
      if (sel === null || op === null || sel === i) { sel = sel === i ? null : i; op = sel === null ? null : op; render(); return; }
      const a = cards[sel], b = cards[i];
      const r = op === '+' ? F.add(a, b) : op === '-' ? F.sub(a, b) : op === '*' ? F.mul(a, b) : F.div(a, b);
      if (!r) { ctx.flash(false); return; }
      hist.push(cards.slice());
      cards[i] = r; cards[sel] = null; sel = i; op = null;
      render();
      const left = cards.filter(Boolean);
      if (left.length === 1) {
        busy = true;
        if (left[0].n === 24 && left[0].d === 1) {
          solved++; times.push((ctx.now() - t0) / 1000); ctx.score(solved); ctx.sfx('win'); ctx.flash(true);
          cEl.classList.add('win'); ctx.later(() => { cEl.classList.remove('win'); next(); }, 450);
        } else {
          ctx.flash(false); ctx.sfx('bad');
          ctx.later(() => { cards = hist[0]; hist = []; sel = null; busy = false; render(); }, 500);
        }
      }
    };
    ctx.el.querySelectorAll('.g24-op').forEach(b => A.tap(b, () => { if (sel !== null && !busy) { op = b.dataset.o; render(); } }));
    ctx.el.querySelectorAll('[data-a]').forEach(b => A.tap(b, () => {
      if (busy) return;
      if (b.dataset.a === 'undo') { if (hist.length) { cards = hist.pop(); sel = null; op = null; render(); } }
      else {
        skipped++; busy = true;
        solEl.innerHTML = `SOLUTION · <span class="amber">${cur.sol} = 24</span>`;
        ctx.later(next, 1900);
      }
    }));
    next();
    return {
      finish: () => ({
        score: solved,
        stats: [['Résolus', solved], ['Passés', skipped], ['Temps moyen', times.length ? A.fmt(A.avg(times), 1) + ' s' : '—']],
        x: { skipped }
      })
    };
  }
});
A.solve24 = ns => solve(ns.map(n => ({ v: n, e: String(n) })));
})();
