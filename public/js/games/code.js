'use strict';
/* CODE — Code Breaker (Mastermind) : casse un code de 4 chiffres (1 à 6) en 8 essais max.
 * ● = bon chiffre bien placé · ○ = bon chiffre mal placé. */
(function () {
const LEN = 4, MAXT = 8;

function feedback(code, guess) {
  let exact = 0; const c = [0, 0, 0, 0, 0, 0, 0], g = [0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < LEN; i++) { if (code[i] === guess[i]) exact++; else { c[code[i]]++; g[guess[i]]++; } }
  let mis = 0; for (let d = 1; d <= 6; d++) mis += Math.min(c[d], g[d]);
  return { exact, mis };
}

A.register({
  id: 'code', cat: 'logi', code: 'CODE', name: 'Code Breaker',
  short: 'Déduis le code secret en 8 essais',
  desc: 'Un code secret de 4 chiffres (de 1 à 6) est caché. Propose un code : ● = bon chiffre à la bonne place, ○ = bon chiffre mal placé. Déduis-le en un minimum d’essais.',
  rules: ['● bien placé · ○ présent mais mal placé', 'Niveau 1 : chiffres tous différents · ensuite, les répétitions sont possibles', 'Points = 9 − nombre d’essais (0 si le code n’est pas trouvé en 8)'],
  variants: [{ id: '300', label: '5 min', time: 300 }, { id: '180', label: '3 min', time: 180 }],
  def: '300', unit: 'points',
  perf: (s, v) => s / (v === '180' ? 9 : 15) * 100,
  start(ctx) {
    let pts = 0, solved = 0, failed = 0, code, tries, guess, busy = false;
    const att = [];
    ctx.el.innerHTML = `<div class="cb">
      <div class="hint cb-h"></div>
      <div class="cb-rows"></div>
      <div class="cb-cur"></div>
      <div class="cb-pad">${[1, 2, 3, 4, 5, 6].map(d => `<button class="key cb-k d${d}" data-d="${d}">${d}</button>`).join('')}</div>
      <div class="kp-actions"><button class="key act" data-a="del">⌫</button><button class="key act" data-a="give">ABANDON</button><button class="key act primary" data-a="ok">VALIDER</button></div>
    </div>`;
    const $ = s => ctx.el.querySelector(s);
    const peg = (d, cls = '') => `<span class="cb-p ${d ? 'd' + d : 'empty'} ${cls}">${d || ''}</span>`;
    const drawCur = () => { $('.cb-cur').innerHTML = [0, 1, 2, 3].map(i => peg(guess[i], i === guess.length ? 'next' : '')).join(''); };
    const newCode = () => {
      const rep = solved >= 1;
      code = rep ? Array.from({ length: LEN }, () => A.rand(1, 6)) : A.shuffle([1, 2, 3, 4, 5, 6]).slice(0, LEN);
      tries = []; guess = []; busy = false;
      $('.cb-h').textContent = `CODE #${solved + failed + 1} · ${rep ? 'RÉPÉTITIONS POSSIBLES' : 'CHIFFRES DIFFÉRENTS'}`;
      $('.cb-rows').innerHTML = '';
      drawCur();
    };
    const row = (g, fb) => `<div class="cb-row"><span class="cb-n">${tries.length}</span><span class="cb-g">${g.map(d => peg(d)).join('')}</span>
      <span class="cb-fb">${'<i class="ex"></i>'.repeat(fb.exact)}${'<i class="mi"></i>'.repeat(fb.mis)}${'<i></i>'.repeat(LEN - fb.exact - fb.mis)}</span></div>`;
    const reveal = (won) => {
      busy = true;
      $('.cb-cur').innerHTML = code.map(d => peg(d, won ? 'win' : 'lost')).join('');
      ctx.later(newCode, won ? 900 : 2000);
    };
    ctx.el.querySelectorAll('[data-d]').forEach(b => A.tap(b, () => { if (!busy && guess.length < LEN) { guess.push(+b.dataset.d); drawCur(); } }));
    ctx.el.querySelectorAll('[data-a]').forEach(b => A.tap(b, () => {
      if (busy) return;
      const a = b.dataset.a;
      if (a === 'del') { guess.pop(); drawCur(); }
      if (a === 'give') { failed++; ctx.flash(false); ctx.sfx('bad'); reveal(false); }
      if (a === 'ok' && guess.length === LEN) {
        const fb = feedback(code, guess);
        tries.push(guess);
        $('.cb-rows').insertAdjacentHTML('beforeend', row(guess, fb));
        guess = [];
        if (fb.exact === LEN) {
          const gain = MAXT + 1 - tries.length;
          pts += gain; solved++; att.push(tries.length);
          ctx.score(pts); ctx.sfx('win'); ctx.flash(true); ctx.toast(`TROUVÉ EN ${tries.length} · +${gain}`);
          reveal(true);
        } else if (tries.length >= MAXT) { failed++; ctx.sfx('bad'); ctx.flash(false); reveal(false); }
        else { ctx.sfx('tick'); drawCur(); }
      }
    }));
    newCode();
    return {
      finish: () => ({
        score: pts,
        stats: [['Codes cassés', solved], ['Ratés', failed], ['Essais moyens', att.length ? A.fmt(A.avg(att), 1) : '—']],
        x: { att }
      })
    };
  }
});
A._code = { feedback };
})();
