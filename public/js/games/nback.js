'use strict';
/* FLUX — Dual N-back version marché : position de l'ordre + ticker.
 * Signale quand la position et/ou le ticker sont identiques à ceux d'il y a N ordres. */
(function () {
const TICK = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'META', 'BNP', 'LVMH'];
const POS = [0, 1, 2, 3, 5, 6, 7, 8]; // grille 3×3 sans le centre
const TRIAL = 2600, SHOW = 1100;

function block(n) {
  const T = 20 + n, seq = [];
  for (let i = 0; i < T; i++) {
    if (i < n) { seq.push({ p: A.pick(POS), t: A.rand(0, 7) }); continue; }
    const back = seq[i - n];
    const p = Math.random() < 0.3 ? back.p : A.pick(POS.filter(x => x !== back.p));
    const t = Math.random() < 0.3 ? back.t : A.pick([0, 1, 2, 3, 4, 5, 6, 7].filter(x => x !== back.t));
    seq.push({ p, t });
  }
  return seq;
}

A.register({
  id: 'nback', cat: 'memo', code: 'FLUX', name: 'Order Flow',
  short: 'Dual N-back : mémoire de travail',
  desc: 'Des ordres arrivent sur la grille. Signale quand la POSITION et/ou le TICKER sont les mêmes que N ordres plus tôt. N s’adapte à ton niveau entre chaque bloc.',
  rules: [
    'POSITION : même case que N ordres avant', 'TICKER : même action que N ordres avant', '≥ 80 % de précision : N monte (jusqu’au plafond du niveau) · < 50 % : N descend',
    'Facile : N de 1 à 2 · Moyen : N de 2 à 3 · Difficile : N de 3 à 6'
  ],
  variants: [
    { id: 'easy', label: 'Facile', time: null, blocks: 3, w: 0.7, note: '3 blocs · N de 1 à 2' },
    { id: 'mid', label: 'Moyen', time: null, blocks: 3, w: 0.9, note: '3 blocs · N de 2 à 3' },
    { id: '3', label: 'Difficile', time: null, blocks: 3, note: '3 blocs · N de 3 à 6' },
    { id: '2', label: '2 blocs', time: null, blocks: 2, hide: true },
    { id: '5', label: '5 blocs', time: null, blocks: 5, hide: true }
  ],
  def: 'easy', unit: 'pts', scoreLabel: 'SCORE',
  perf: (s, v) => s * ({ easy: 2, mid: 4 / 3 }[v] || 1),
  start(ctx) {
    const B = ctx.v.blocks;
    // N de départ et plafond propres à chaque niveau (jamais hérités d'une autre partie)
    const CFG = { easy: { start: 1, cap: 2 }, mid: { start: 2, cap: 3 } }[ctx.v.id] || { start: 3, cap: 6 };
    let n = CFG.start, b = 0, i = 0, seq, resp, st = { hp: 0, mp: 0, fp: 0, ht: 0, mt: 0, ft: 0 };
    const res = [];
    ctx.el.innerHTML = `<div class="nb">
      <div class="nb-top"><span class="nb-n"></span><span class="hint nb-b"></span></div>
      <div class="nb-grid">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(k => `<div class="nb-c${k === 4 ? ' mid' : ''}" data-k="${k}"></div>`).join('')}</div>
      <div class="nb-btns"><button class="nb-btn" data-m="p">POSITION</button><button class="nb-btn" data-m="t">TICKER</button></div>
    </div>`;
    const cells = [...ctx.el.querySelectorAll('.nb-c')], nEl = ctx.el.querySelector('.nb-n'), bEl = ctx.el.querySelector('.nb-b');
    const btn = { p: ctx.el.querySelector('[data-m=p]'), t: ctx.el.querySelector('[data-m=t]') };
    const isMatch = (m, k) => k >= n && seq[k][m] === seq[k - n][m];
    const press = m => {
      if (!seq || i >= seq.length || resp[m]) return;
      resp[m] = true;
      const ok = isMatch(m, i);
      btn[m].classList.add(ok ? 'good' : 'bad');
      ctx.sfx(ok ? 'ok' : 'bad');
    };
    Object.keys(btn).forEach(m => A.tap(btn[m], () => press(m)));
    const startBlock = () => {
      seq = block(n); i = 0;
      st = { hp: 0, mp: 0, fp: 0, ht: 0, mt: 0, ft: 0 };
      nEl.innerHTML = `N = <b>${n}</b>`;
      bEl.textContent = `BLOC ${b + 1}/${B}`;
      ctx.el.querySelector('.nb-grid .mid').textContent = `${n}-BACK`;
      trial();
    };
    const trial = () => {
      resp = { p: false, t: false };
      Object.values(btn).forEach(x => x.classList.remove('good', 'bad', 'miss'));
      const s = seq[i];
      const c = cells[s.p];
      c.textContent = TICK[s.t]; c.classList.add('on');
      ctx.progress((b * seq.length + i) / (B * seq.length));
      ctx.later(() => { c.classList.remove('on'); c.textContent = ''; }, SHOW);
      ctx.later(endTrial, TRIAL);
    };
    const endTrial = () => {
      for (const m of ['p', 't']) {
        const match = isMatch(m, i);
        if (match && resp[m]) st['h' + m]++;
        else if (match) { st['m' + m]++; btn[m].classList.add('miss'); }
        else if (resp[m]) st['f' + m]++;
      }
      i++;
      if (i < seq.length) { ctx.later(trial, match0() ? 250 : 0); return; }
      endBlock();
    };
    const match0 = () => btn.p.classList.contains('miss') || btn.t.classList.contains('miss');
    const endBlock = () => {
      const hits = st.hp + st.ht, tot = hits + st.mp + st.mt + st.fp + st.ft;
      const acc = tot ? hits / tot : 1;
      const perf = A.clamp((n - 1) * 25 + acc * 25, 0, 100);
      res.push({ n, acc, perf });
      const nn = acc >= 0.8 ? Math.min(CFG.cap, n + 1) : acc < 0.5 ? Math.max(1, n - 1) : n;
      b++;
      if (b >= B) { n = nn; ctx.end(finish()); return; }
      const ov = A.h(`<div class="overlay">
        <div class="label">BLOC ${b}/${B} TERMINÉ</div>
        <div class="hero-num">${A.fmt(acc * 100, 0)} %</div>
        <div class="dim">de précision à ${n}-back</div>
        <div class="chip ${nn > n ? 'hot' : ''}">${nn > n ? `▲ N passe à ${nn}` : nn < n ? `▼ N redescend à ${nn}` : `N reste à ${n}`}</div>
        <button class="btn primary" style="max-width:260px">BLOC SUIVANT</button>
      </div>`);
      ctx.el.appendChild(ov);
      A.tap(ov.querySelector('button'), () => { ov.remove(); n = nn; startBlock(); });
    };
    const finish = () => {
      const perf = res.length ? A.avg(res.map(r => r.perf)) : 0;
      return {
        score: Math.round(perf),
        stats: [['N max', Math.max(...res.map(r => r.n), 0)], ['N moyen', A.fmt(A.avg(res.map(r => r.n)) || 0, 1)], ['Précision moy.', res.length ? A.fmt(A.avg(res.map(r => r.acc)) * 100, 0) + ' %' : '—'],
          ...res.map((r, k) => [`Bloc ${k + 1}`, `${r.n}-back · ${A.fmt(r.acc * 100, 0)} %`])],
        x: { blocks: res }
      };
    };
    startBlock();
    return { finish };
  }
});
})();
