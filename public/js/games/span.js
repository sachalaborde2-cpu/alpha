'use strict';
/* SPAN — Empan mnésique : grille (Corsi) ou chiffres à l'envers. Escalier adaptatif : +1 à chaque réussite, 2 échecs = fin. */
(function () {
A.register({
  id: 'span', cat: 'memo', code: 'SPAN', name: 'Span Mémoire',
  short: 'Mémorise une séquence de plus en plus longue',
  desc: 'Une séquence s’affiche, reproduis-la. Chaque réussite l’allonge d’un élément. Deux échecs de suite à la même longueur et c’est fini.',
  rules: [
    'GRILLE : reproduis l’ordre des cases qui s’allument', 'CHIFFRES : retape les chiffres dans l’ordre · CHIFFRES ↺ : dans l’ordre INVERSE', 'Adulte moyen : 5 à 7 en grille, 4 à 6 à l’envers',
    'Facile et Moyen ont un plafond : la partie s’arrête quand tu le réussis (5 et 7 éléments)'
  ],
  variants: [
    { id: 'easy', label: 'Facile', time: null, w: 0.85, note: 'Grille · de 3 à 5 éléments' },
    { id: 'mid', label: 'Moyen', time: null, w: 0.95, note: 'Grille · de 3 à 7 éléments' },
    { id: 'spatial', label: 'Difficile', time: null, note: 'Grille · sans plafond, départ à 4' },
    { id: 'dfwd', label: 'Chiffres', time: null, w: 0.9, note: 'Chiffres dans l’ordre · de 3 à 8' },
    { id: 'digits', label: 'Inverse', time: null, note: 'Chiffres à l’envers · sans plafond' }
  ],
  def: 'easy', unit: 'éléments', scoreLabel: 'SPAN',
  perf: (s, v) => v === 'digits' ? (s - 2) / 6 * 100 : v === 'easy' ? (s - 2) / 3 * 100 : v === 'dfwd' ? (s - 2) / 6 * 100 : v === 'mid' ? (s - 2) / 5 * 100 : (s - 2) / 7 * 100,
  start(ctx) {
    const digits = ctx.v.id === 'digits' || ctx.v.id === 'dfwd', rev = ctx.v.id === 'digits';
    // départ et plafond fixes par niveau (cap = 0 : pas de plafond)
    const CFG = { easy: { start: 3, cap: 5 }, mid: { start: 3, cap: 7 }, dfwd: { start: 3, cap: 8 }, digits: { start: 3, cap: 0 } }[ctx.v.id] || { start: 4, cap: 0 };
    const target = () => rev ? seq.slice().reverse() : seq;
    let endNow = false;
    let L = CFG.start, best = 0, fails = 0, trials = 0, seq, input, phase = 'show';
    ctx.el.innerHTML = digits
      ? `<div class="qbox"><div class="hint sp-h"></div><div class="sp-digit mono"></div><div class="ans mono"></div></div>`
      : `<div class="sp"><div class="hint sp-h"></div><div class="sp-grid">${Array.from({ length: 16 }, (_, k) => `<button class="sp-c" data-k="${k}"></button>`).join('')}</div></div>`;
    const hEl = ctx.el.querySelector('.sp-h');
    const cells = [...ctx.el.querySelectorAll('.sp-c')];
    const dEl = ctx.el.querySelector('.sp-digit'), ansEl = ctx.el.querySelector('.ans');
    ctx.score(best);

    const newTrial = () => {
      trials++;
      phase = 'show'; input = [];
      hEl.textContent = `MÉMORISE · ${L} ÉLÉMENTS`;
      if (digits) {
        seq = []; for (let k = 0; k < L; k++) { let d; do { d = A.rand(0, 9); } while (d === seq[k - 1]); seq.push(d); }
        ansEl.textContent = ''; ansEl.classList.remove('reveal');
        seq.forEach((d, k) => {
          ctx.later(() => { dEl.textContent = d; dEl.classList.add('on'); }, 500 + k * 900);
          ctx.later(() => { dEl.textContent = ''; dEl.classList.remove('on'); }, 500 + k * 900 + 650);
        });
      } else {
        seq = A.shuffle([...Array(16).keys()]).slice(0, L);
        seq.forEach((c, k) => {
          ctx.later(() => cells[c].classList.add('on'), 500 + k * 750);
          ctx.later(() => cells[c].classList.remove('on'), 500 + k * 750 + 520);
        });
      }
      ctx.later(() => { phase = 'input'; hEl.innerHTML = digits ? rev ? '<span class="amber">À TOI · À L’ENVERS ↺</span>' : '<span class="amber">À TOI</span>' : '<span class="amber">À TOI</span>'; }, 500 + L * (digits ? 900 : 750));
    };
    const verdict = ok => {
      phase = 'wait';
      if (ok) { best = Math.max(best, L); ctx.score(best); if (CFG.cap && L >= CFG.cap) endNow = true; L++; fails = 0; ctx.sfx('win'); ctx.flash(true); hEl.innerHTML = '<span class="up">✓ PARFAIT</span>'; }
      else {
        fails++; ctx.sfx('bad'); ctx.flash(false);
        hEl.innerHTML = `<span class="down">✗ ${digits ? 'ATTENDU ' + target().join(' ') : 'RATÉ'}</span>`;
        if (!digits) seq.forEach(c => cells[c].classList.add('ghost'));
      }
      ctx.later(() => {
        cells.forEach(c => c.classList.remove('ghost', 'good', 'bad'));
        if (endNow || fails >= 2 || trials >= 16) ctx.end(finish()); else newTrial();
      }, ok ? 700 : 1800);
    };
    if (digits) {
      ctx.el.appendChild(A.keypad({
        left: 'C', actions: [{ label: 'VALIDER', key: 'ok', primary: true }],
        onKey: k => {
          if (phase !== 'input') return;
          if (k === 'ok') { if (input.length) verdict(input.join('') === target().join('')); return; }
          if (k === '⌫') input.pop(); else if (k === 'C') input = []; else if (input.length < 14) input.push(k);
          ansEl.textContent = input.join(' ');
        }
      }));
    } else {
      cells.forEach(c => A.tap(c, () => {
        if (phase !== 'input') return;
        const k = +c.dataset.k, want = seq[input.length];
        input.push(k);
        c.classList.add(k === want ? 'good' : 'bad');
        setTimeout(() => c.classList.remove('good'), 220);
        if (k !== want) verdict(false);
        else if (input.length === seq.length) verdict(true);
      }));
    }
    const finish = () => ({
      score: best,
      stats: [['Span max', best], ['Essais', trials]]
    });
    newTrial();
    return { finish };
  }
});
})();
