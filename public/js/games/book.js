'use strict';
/* BOOK — Carnet d'ordres : mémorise des cotations, puis restitue un prix ou une quantité.
 * La taille du carnet s'adapte : +1 ligne après une réussite, −1 après un échec. */
(function () {
const TICK = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'META', 'GOOG', 'BNP', 'LVMH', 'AIR', 'TTE', 'ORCL', 'NFLX', 'AMD', 'SAN', 'KO', 'SAP', 'ASML'];

A.register({
  id: 'book', cat: 'memo', code: 'BOOK', name: 'Carnet d’ordres',
  short: 'Mémorise les cotations, restitue-les',
  desc: 'Un carnet de cotations s’affiche quelques secondes. Il disparaît, puis on te demande un prix (et plus tard une quantité). Le carnet grossit à chaque réussite.',
  rules: ['Mémorise, puis touche PRÊT (ou attends la fin du chrono)', 'Réussite = +1 ligne au carnet · échec = −1 ligne', 'Points = taille du carnet réussi · dès 5 lignes, les quantités entrent en jeu'],
  variants: [{ id: '180', label: '3 min', time: 180 }, { id: '300', label: '5 min', time: 300 }],
  def: '180', unit: 'points',
  perf: (s, v) => s / (v === '300' ? 70 : 42) * 100,
  start(ctx) {
    let K = Math.max(3, A.level('book', 3)), wq = false, best = 0, pts = 0, good = 0, bad = 0, rows, ask, input = '', phase = 'show', round = 0;
    ctx.el.innerHTML = `<div class="bk"><div class="hint bk-h"></div><div class="bk-bar"><i></i></div><div class="bk-book"></div><div class="bk-q"></div><div class="ans mono bk-ans"></div><div class="bk-kp"></div></div>`;
    const $ = s => ctx.el.querySelector(s);
    const kp = A.keypad({
      left: 'C', actions: [{ label: 'PRÊT', key: 'ready' }, { label: 'VALIDER', key: 'ok', primary: true }],
      onKey: k => {
        if (k === 'ready') { if (phase === 'show') hide(); return; }
        if (phase !== 'ask') return;
        if (k === 'ok') { if (input) verdict(+input === ask.ans); return; }
        input = A.editNum(input, k, 5);
        $('.bk-ans').textContent = input;
        if (+input === ask.ans && input.length >= String(ask.ans).length) verdict(true);
      }
    });
    $('.bk-kp').appendChild(kp);
    const table = (hl) => `<table class="bk-t"><thead><tr><th>ACTIF</th><th>PRIX</th>${wq ? '<th>QTÉ</th>' : ''}</tr></thead><tbody>
      ${rows.map((r, i) => `<tr class="${hl === i ? 'hl' : ''}"><td>${r.t}</td><td>${r.p}</td>${wq ? `<td>${r.q}</td>` : ''}</tr>`).join('')}</tbody></table>`;
    const newRound = () => {
      round++; phase = 'show'; input = ''; wq = K >= 5;
      const names = A.shuffle(TICK).slice(0, K);
      rows = names.map(t => ({ t, p: A.rand(10, 999), q: A.pick([100, 200, 250, 300, 400, 500, 750, 800, 1000, 1200, 1500]) }));
      $('.bk-h').textContent = `MÉMORISE · ${K} LIGNES`;
      $('.bk-book').innerHTML = table(); $('.bk-book').classList.remove('hidden');
      $('.bk-q').textContent = ''; $('.bk-ans').textContent = ''; $('.bk-ans').classList.remove('reveal');
      const dur = 900 + K * (wq ? 1500 : 1100);
      const bar = $('.bk-bar i');
      bar.style.transition = 'none'; bar.style.transform = 'scaleX(1)';
      requestAnimationFrame(() => { bar.style.transition = `transform ${dur}ms linear`; bar.style.transform = 'scaleX(0)'; });
      const r = round;
      ctx.later(() => { if (phase === 'show' && round === r) hide(); }, dur);
    };
    const hide = () => {
      phase = 'ask';
      const bar = $('.bk-bar i'); bar.style.transition = 'none'; bar.style.transform = 'scaleX(0)';
      $('.bk-book').classList.add('hidden');
      const i = A.rand(0, rows.length - 1), qty = wq && Math.random() < 0.4;
      ask = { i, ans: qty ? rows[i].q : rows[i].p };
      $('.bk-h').innerHTML = '<span class="amber">RESTITUE</span>';
      $('.bk-q').innerHTML = `${qty ? 'Quantité' : 'Prix'} de <b class="amber">${rows[i].t}</b> ?`;
    };
    const verdict = ok => {
      phase = 'wait';
      if (ok) { pts += K; good++; best = Math.max(best, K); K = Math.min(8, K + 1); ctx.sfx('win'); ctx.flash(true); }
      else {
        bad++; K = Math.max(3, K - 1); ctx.sfx('bad'); ctx.flash(false);
        $('.bk-ans').textContent = ask.ans; $('.bk-ans').classList.add('reveal');
        $('.bk-book').innerHTML = table(ask.i); $('.bk-book').classList.remove('hidden');
      }
      ctx.score(pts);
      ctx.later(newRound, ok ? 450 : 2000);
    };
    newRound();
    return {
      finish: () => ({
        score: pts,
        stats: [['Carnet max réussi', best ? best + ' lignes' : '—'], ['Réussites', good], ['Échecs', bad]],
        level: Math.max(3, K - 1),
        x: { best }
      })
    };
  }
});
})();
