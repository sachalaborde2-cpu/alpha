'use strict';
/* SWITCH — Alternance de tâches (type tests SHL / Pymetrics) :
 * cadre AMBRE = parité, cadre BLEU = niveau (vs 5). Mesure ton « coût de switch ». */
(function () {
const NUMS = [1, 2, 3, 4, 6, 7, 8, 9];

A.register({
  id: 'switch', cat: 'viva', code: 'SWITCH', name: 'Switch',
  short: 'Change de règle sans perdre de vitesse',
  desc: 'Un chiffre s’affiche dans un cadre. Cadre AMBRE : pair ou impair ? Cadre BLEU : plus grand ou plus petit que 5 ? La règle change sans prévenir.',
  rules: ['AMBRE → gauche = IMPAIR · droite = PAIR', 'BLEU → gauche = < 5 · droite = > 5', 'Bonne réponse +1, erreur −2 : la précision compte autant que la vitesse', 'Le coût de switch = temps perdu quand la règle change'],
  variants: [{ id: '60', label: '1 min', time: 60 }, { id: '90', label: '1 min 30', time: 90 }],
  def: '60', unit: 'points nets',
  perf: (s, v) => s / (v === '90' ? 120 : 80) * 100,
  start(ctx) {
    let good = 0, bad = 0, rule = Math.random() < 0.5 ? 'par' : 'niv', prev = null, n, t0 = 0, busy = false;
    const rt = { rep: [], sw: [] };
    ctx.el.innerHTML = `<div class="sw">
      <div class="sw-card"><div class="sw-rule"></div><div class="sw-n mono"></div></div>
      <div class="sw-btns">
        <button class="sw-b" data-s="L"><span class="a">IMPAIR</span><span class="b">&lt; 5</span></button>
        <button class="sw-b" data-s="R"><span class="a">PAIR</span><span class="b">&gt; 5</span></button>
      </div></div>`;
    const card = ctx.el.querySelector('.sw-card'), ruleEl = ctx.el.querySelector('.sw-rule'), nEl = ctx.el.querySelector('.sw-n');
    const next = () => {
      prev = rule;
      if (Math.random() < 0.4) rule = rule === 'par' ? 'niv' : 'par';
      let m; do { m = A.pick(NUMS); } while (m === n);
      n = m; t0 = ctx.now(); busy = false;
      card.className = 'sw-card ' + rule;
      ruleEl.textContent = rule === 'par' ? 'PARITÉ' : 'NIVEAU';
      nEl.textContent = n;
    };
    ctx.el.querySelectorAll('.sw-b').forEach(b => A.tap(b, () => {
      if (busy) return;
      busy = true;
      const right = rule === 'par' ? n % 2 === 0 : n > 5;
      const ok = (b.dataset.s === 'R') === right;
      const t = ctx.now() - t0;
      if (ok) { good++; (prev === rule ? rt.rep : rt.sw).push(t); ctx.sfx('ok'); }
      else { bad++; ctx.flash(false); ctx.sfx('bad'); }
      card.classList.add(ok ? 'ok' : 'ko');
      ctx.score(good - 2 * bad);
      ctx.later(next, ok ? 110 : 450);
    }));
    next();
    return {
      finish: () => {
        const a = A.avg(rt.rep), s = A.avg(rt.sw);
        const cost = a != null && s != null ? s - a : null;
        return {
          score: good - 2 * bad,
          stats: [['Justes', good], ['Fausses', bad], ['Précision', good + bad ? A.fmt(good / (good + bad) * 100, 0) + ' %' : '—'],
            ['Réaction (même règle)', a != null ? A.fmt(a, 0) + ' ms' : '—'], ['Réaction (switch)', s != null ? A.fmt(s, 0) + ' ms' : '—'], ['Coût de switch', cost != null ? A.signed(cost, 0, ' ms') : '—']],
          x: { cost, rep: a, sw: s }
        };
      }
    };
  }
});
})();
