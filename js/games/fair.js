'use strict';
/* FAIR — Fair Value : donne le juste prix (espérance) d'un jeu quand une partie de l'info est révélée.
 * Le réflexe de base du market making. */
(function () {
const R = A.rand;
const die = d => `<span class="die${d == null ? ' q' : ''}">${d == null ? '?' : d}</span>`;
const card = c => `<span class="die card${c == null ? ' q' : ''}">${c == null ? '?' : c}</span>`;
const sum = a => a.reduce((s, x) => s + x, 0);
const n2 = x => A.num(A.round(x, 2));

// Conditions sur deux dés : espérance de la somme par énumération
const COND = [
  ['au moins un dé vaut 6', (a, b) => a === 6 || b === 6],
  ['au moins un dé vaut 1', (a, b) => a === 1 || b === 1],
  ['la somme est au moins 9', (a, b) => a + b >= 9],
  ['c’est un double', (a, b) => a === b],
  ['les deux dés sont différents', (a, b) => a !== b],
  ['le premier dé est pair', a => a % 2 === 0],
  ['les deux dés sont impairs', (a, b) => a % 2 && b % 2],
  ['le produit est pair', (a, b) => (a * b) % 2 === 0]
];

const GENS = [
  { lv: 1, f: () => {
    const n = R(3, 5), k = R(1, n - 1), d = Array.from({ length: k }, () => R(1, 6)), s = sum(d);
    return { t: 'SOMME DE DÉS', q: `Tu gagnes la somme de ${n} dés (en €). Déjà sortis :`, vis: d.map(die).join('') + die(null).repeat(n - k), ans: s + 3.5 * (n - k), e: `${s} déjà acquis + ${n - k} × 3,5 = ${n2(s + 3.5 * (n - k))}` };
  } },
  { lv: 1, f: () => {
    const N = A.pick([6, 8, 10, 12]), k = R(2, N - 2), h = R(0, k), G = A.pick([1, 2, 5]);
    return { t: 'PILE OU FACE', q: `${N} lancers de pièce, ${G} € par Pile. Après ${k} lancers : ${h} Pile. Juste prix du jeu ?`, vis: '', ans: G * (h + (N - k) / 2), e: `${G} × (${h} + ${N - k} × ½) = ${n2(G * (h + (N - k) / 2))}` };
  } },
  { lv: 2, f: () => {
    const k = R(2, 4), d = A.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, k), s = sum(d);
    return { t: 'CARTES 1 À 10', q: 'Cartes 1 à 10, sans remise. Déjà tirées :', vis: d.map(card).join('') + card(null), sub: 'Espérance de la prochaine carte ?', ans: (55 - s) / (10 - k), e: `Il reste ${55 - s} points sur ${10 - k} cartes : ${55 - s}/${10 - k} ≈ ${n2((55 - s) / (10 - k))}` };
  } },
  { lv: 2, f: () => {
    const a = R(1, 6); let s = a * a; for (let j = a + 1; j <= 6; j++) s += j;
    return { t: 'MAX DE DEUX DÉS', q: 'Tu gagnes le plus grand de deux dés (en €). Le premier vaut :', vis: die(a) + die(null), ans: s / 6, e: `Si le 2e ≤ ${a} tu gardes ${a} (${a}/6), sinon tu prends le 2e : ${s}/6 ≈ ${n2(s / 6)}` };
  } },
  { lv: 2, f: () => {
    const r = R(2, 6), b = R(2, 6), k = R(2, Math.min(4, r + b - 1)), G = A.pick([5, 10, 20]);
    return { t: 'URNE', q: `Urne : ${r} rouges, ${b} bleues. Tu tires ${k} boules sans remise et gagnes ${G} € par rouge. Juste prix ?`, vis: '', ans: G * k * r / (r + b), e: `Linéarité : ${k} × ${r}/${r + b} × ${G} ≈ ${n2(G * k * r / (r + b))}` };
  } },
  { lv: 3, f: () => {
    const [txt, c] = A.pick(COND); let s = 0, n = 0;
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (c(a, b)) { s += a + b; n++; }
    return { t: 'CONDITIONNEL', q: `Deux dés. On sait que ${txt}. Espérance de la somme ?`, vis: die(null) + die(null), ans: s / n, e: `${n} issues possibles, somme totale ${s} : ${s}/${n} ≈ ${n2(s / n)}` };
  } },
  { lv: 3, f: () => {
    const k = R(2, 4), d = A.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, k), s = sum(d), m = R(2, 3);
    return { t: 'CARTES 1 À 10', q: 'Cartes 1 à 10, sans remise. Déjà tirées :', vis: d.map(card).join(''), sub: `Espérance de la somme des ${m} prochaines ?`, ans: m * (55 - s) / (10 - k), e: `${m} × ${55 - s}/${10 - k} ≈ ${n2(m * (55 - s) / (10 - k))}` };
  } },
  { lv: 3, f: () => {
    const n = R(2, 4), k = R(1, n - 1), d = Array.from({ length: k }, () => R(1, 6)), p = d.reduce((x, y) => x * y, 1);
    return { t: 'PRODUIT DE DÉS', q: `Tu gagnes le produit de ${n} dés (en €). Déjà sortis :`, vis: d.map(die).join('') + die(null).repeat(n - k), ans: p * 3.5 ** (n - k), e: `Indépendance : ${p} × 3,5${n - k > 1 ? '^' + (n - k) : ''} ≈ ${n2(p * 3.5 ** (n - k))}` };
  } }
];

A.register({
  id: 'fair', cat: 'quant', code: 'FAIR', name: 'Fair Value',
  short: 'Donne le juste prix, l’info arrive',
  desc: 'Des dés, des cartes, des pièces… une partie est déjà révélée. Donne le juste prix du jeu (son espérance). C’est le réflexe de base du market making.',
  rules: ['Réponse validée dès qu’elle est juste à 0,01 près', 'La virgule est sur le pavé · PASSER affiche le calcul', 'Linéarité de l’espérance, cartes sans remise, conditionnement'],
  variants: [{ id: '180', label: '3 min', time: 180 }, { id: '300', label: '5 min', time: 300 }],
  def: '180', unit: 'justes prix',
  perf: (s, v) => s / (v === '300' ? 16 : 10) * 100,
  start(ctx) {
    let ok = 0, skip = 0, cur, input = '', busy = false, t0 = 0;
    const times = [];
    ctx.el.innerHTML = `<div class="qbox fv"><div class="hint fv-t"></div><div class="pb-q fv-q"></div><div class="dice"></div><div class="fv-sub dim"></div><div class="ans mono"></div><div class="fv-e"></div></div>`;
    const $ = s => ctx.el.querySelector(s);
    const level = () => Math.min(3, 1 + Math.floor(ok / 3));
    const next = () => {
      const pool = GENS.filter(g => g.lv <= level());
      const same = pool.filter(x => x.lv === level());
      const g = A.pick(Math.random() < 0.6 && same.length ? same : pool);
      cur = g.f(); input = ''; busy = false; t0 = ctx.now();
      $('.fv-t').textContent = `${cur.t} · NIV. ${level()}`;
      $('.fv-q').textContent = cur.q; $('.dice').innerHTML = cur.vis; $('.fv-sub').textContent = cur.sub || '';
      $('.ans').textContent = ''; $('.ans').classList.remove('reveal'); $('.fv-e').innerHTML = '';
    };
    ctx.el.appendChild(A.keypad({
      left: 'C', actions: [{ label: ',', key: ',' }, { label: 'PASSER', key: 'skip' }],
      onKey: k => {
        if (busy) return;
        if (k === 'skip') {
          skip++; busy = true;
          $('.ans').textContent = n2(cur.ans); $('.ans').classList.add('reveal');
          $('.fv-e').innerHTML = `<div class="expl">${cur.e}</div>`;
          ctx.later(next, 2600); return;
        }
        input = A.editNum(input, k, 7);
        $('.ans').textContent = A.showNum(input);
        if (A.numOk(input, cur.ans)) {
          ok++; times.push((ctx.now() - t0) / 1000); ctx.score(ok); ctx.sfx('ok'); ctx.flash(true);
          busy = true; ctx.later(next, 250);
        }
      }
    }));
    next();
    return {
      finish: () => ({
        score: ok,
        stats: [['Justes prix', ok], ['Passés', skip], ['Temps moyen', times.length ? A.fmt(A.avg(times), 1) + ' s' : '—']]
      })
    };
  }
});
A._fair = { GENS };
})();
