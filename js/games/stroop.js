'use strict';
/* STROOP — Réponds à la COULEUR de l'encre, pas au mot (HAUSSE en rouge = ROUGE).
 * Mesure ton coût d'interférence : le temps perdu quand le mot contredit la couleur. */
(function () {
const WORDS = [{ w: 'HAUSSE', c: 'g' }, { w: 'BAISSE', c: 'r' }, { w: 'VERT', c: 'g' }, { w: 'ROUGE', c: 'r' }, { w: '▲ BID', c: 'g' }, { w: '▼ ASK', c: 'r' }];

A.register({
  id: 'stroop', cat: 'viva', code: 'STROOP', name: 'Stroop Marché',
  short: 'Réagis à la couleur, ignore le mot',
  desc: 'Un mot s’affiche en vert ou en rouge. Réponds à la COULEUR de l’encre, jamais au sens du mot. « HAUSSE » écrit en rouge, c’est ROUGE.',
  rules: ['Gauche = encre VERTE · droite = encre ROUGE', 'Bonne réponse +1, erreur −2', 'Coût d’interférence = temps perdu quand mot et couleur se contredisent'],
  variants: [{ id: '60', label: '1 min', time: 60 }, { id: '90', label: '1 min 30', time: 90 }],
  def: '60', unit: 'points nets',
  perf: (s, v) => s / (v === '90' ? 105 : 70) * 100,
  start(ctx) {
    let good = 0, bad = 0, cur, t0 = 0, busy = false;
    const rt = { con: [], inc: [] };
    ctx.el.innerHTML = `<div class="sw st">
      <div class="sw-card"><div class="sw-rule">COULEUR DE L’ENCRE ?</div><div class="st-w"></div></div>
      <div class="sw-btns">
        <button class="sw-b st-g" data-c="g"><span class="b">VERT</span></button>
        <button class="sw-b st-r" data-c="r"><span class="b">ROUGE</span></button>
      </div></div>`;
    const card = ctx.el.querySelector('.sw-card'), wEl = ctx.el.querySelector('.st-w');
    const next = () => {
      let n;
      do { const w = A.pick(WORDS), inc = Math.random() < 0.55; n = { w: w.w, ink: inc ? (w.c === 'g' ? 'r' : 'g') : w.c, inc }; } while (cur && n.w === cur.w && n.ink === cur.ink);
      cur = n; t0 = ctx.now(); busy = false;
      card.classList.remove('ok', 'ko');
      wEl.textContent = cur.w; wEl.className = 'st-w ' + cur.ink;
    };
    ctx.el.querySelectorAll('[data-c]').forEach(b => A.tap(b, () => {
      if (busy) return;
      busy = true;
      const ok = b.dataset.c === cur.ink, t = ctx.now() - t0;
      if (ok) { good++; (cur.inc ? rt.inc : rt.con).push(t); ctx.sfx('ok'); }
      else { bad++; ctx.flash(false); ctx.sfx('bad'); }
      card.classList.add(ok ? 'ok' : 'ko');
      ctx.score(good - 2 * bad);
      ctx.later(next, ok ? 100 : 450);
    }));
    next();
    return {
      finish: () => {
        const c = A.avg(rt.con), i = A.avg(rt.inc), cost = c != null && i != null ? i - c : null;
        return {
          score: good - 2 * bad,
          stats: [['Justes', good], ['Fausses', bad], ['Précision', good + bad ? A.fmt(good / (good + bad) * 100, 0) + ' %' : '—'],
            ['Réaction (cohérent)', c != null ? A.fmt(c, 0) + ' ms' : '—'], ['Réaction (piège)', i != null ? A.fmt(i, 0) + ' ms' : '—'], ['Coût d’interférence', cost != null ? A.signed(cost, 0, ' ms') : '—']],
          x: { cost }
        };
      }
    };
  }
});
})();
