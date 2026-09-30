'use strict';
/* PROBA — Probabilités & espérance façon entretien trading : dés, pièces, cartes, urnes, paris.
 * Une erreur affiche l'explication : on apprend en jouant. */
(function () {
const R = A.rand, F = A.F.make, S = A.F.str;
const C = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); };
const ways = s => 6 - Math.abs(s - 7);
const eur = v => (v < 0 ? '−' : '') + A.num(Math.abs(A.round(v, 2))) + ' €';
const mk = (q, ans, ds, e) => ({ q, ans: S(ans), ds: ds.map(S), e });

const PARAM = [
  () => { const k = R(2, 12), w = ways(k); return mk(`Deux dés. Probabilité que la somme fasse ${k} ?`, F(w, 36), [F(w + 1, 36), F(Math.max(1, w - 1), 36), F(1, 11), F(1, 6)], `${w} combinaisons (ordonnées) sur 36.`); },
  () => { const k = R(8, 11); let c = 0; for (let s = k; s <= 12; s++) c += ways(s); return mk(`Deux dés. Probabilité que la somme soit ≥ ${k} ?`, F(c, 36), [F(c + ways(k - 1), 36), F(c - ways(k), 36), F(36 - c, 36)], `On compte les sommes de ${k} à 12 : ${c} cas sur 36.`); },
  () => { const n = R(2, 3), t = 6 ** n, a = t - 5 ** n; return mk(`Tu lances ${n} dés. Probabilité d’obtenir au moins un 6 ?`, F(a, t), [F(n, 6), F(5 ** n, t), F(1, t)], `Passer par le contraire : 1 − (5/6)^${n} = ${a}/${t}.`); },
  () => { const n = R(3, 6), k = R(1, n - 1), t = 2 ** n; return mk(`${n} lancers de pièce. Probabilité d’avoir exactement ${k} Pile ?`, F(C(n, k), t), [F(C(n, k) + 1, t), F(k, n), F(1, t), F(1, 2)], `C(${n},${k}) = ${C(n, k)} façons sur 2^${n} = ${t}.`); },
  () => { const n = R(3, 6), t = 2 ** n; return mk(`${n} lancers de pièce. Probabilité d’avoir au moins un Pile ?`, F(t - 1, t), [F(1, t), F(n, t), F(1, 2), F(n - 1, n)], `1 − P(que des Face) = 1 − 1/${t}.`); },
  () => { const r = R(2, 6), b = R(2, 6), N = r + b; return mk(`Urne : ${r} rouges, ${b} bleues. On tire 2 boules sans remise. Probabilité qu’elles soient toutes les deux rouges ?`, F(r * (r - 1), N * (N - 1)), [F(r * r, N * N), F(r, N), F(r - 1, N - 1), F(r * (r - 1), N * N)], `${r}/${N} × ${r - 1}/${N - 1}.`); },
  () => { const r = R(2, 6), b = R(2, 6), N = r + b; return mk(`Urne : ${r} rouges, ${b} bleues. 2 tirages sans remise. Probabilité d’avoir une boule de chaque couleur ?`, F(2 * r * b, N * (N - 1)), [F(r * b, N * (N - 1)), F(2 * r * b, N * N), F(1, 2)], `2 ordres possibles : 2 × ${r}/${N} × ${b}/${N - 1}.`); },
  () => {
    const p = A.pick([10, 20, 25, 40, 50, 60, 75, 80]), G = A.pick([10, 20, 30, 50, 100]), L = A.pick([5, 10, 20, 40]);
    const ev = p * G / 100 - (100 - p) * L / 100;
    const ds = [p * G / 100 - L, p * G / 100, -ev, (p * G - p * L) / 100].filter(d => A.round(d, 2) !== A.round(ev, 2));
    return { q: `Pari : ${p} % de chances de gagner ${G} €, sinon tu perds ${L} €. Espérance ?`, ans: eur(ev), ds: ds.map(eur), e: `${p} % × ${G} − ${100 - p} % × ${L} = ${eur(ev)}.` };
  }
];

const FIXED = [
  ['Tu gagnes le résultat d’un dé, en €. Prix juste du jeu ?', '3,5 €', ['3 €', '4 €', '3,25 €'], '(1+2+…+6)/6 = 21/6.'],
  ['Tu gagnes le carré du résultat d’un dé. Espérance ?', '15,17 €', ['12,25 €', '15 €', '18 €'], 'E[X²] = 91/6 ≈ 15,17 (≠ 3,5² : Jensen).'],
  ['Tu gagnes le max de deux dés. Espérance ?', '4,47 €', ['4 €', '3,5 €', '5 €'], 'P(max ≤ k) = (k/6)² → E = 161/36 ≈ 4,47.'],
  ['Tu gagnes le min de deux dés. Espérance ?', '2,53 €', ['2,5 €', '3 €', '2 €'], 'E[min] = 7 − E[max] = 91/36 ≈ 2,53.'],
  ['Un dé, tu peux relancer une fois (tu gardes le 2e). Espérance en jouant bien ?', '4,25 €', ['3,5 €', '4 €', '4,5 €'], 'Garde 4, 5, 6 (moy. 5), relance sinon (3,5) : ½·5 + ½·3,5.'],
  ['Tu gagnes le produit de deux dés. Espérance ?', '12,25 €', ['12 €', '10,5 €', '13 €'], 'Indépendants : E[XY] = 3,5 × 3,5.'],
  ['Tu gagnes le résultat d’un dé s’il est pair, 0 sinon. Espérance ?', '2 €', ['1,75 €', '3 €', '1,5 €'], '(2 + 4 + 6)/6 = 2.'],
  ['Nombre moyen de lancers d’un dé pour obtenir un 6 ?', '6', ['3', '5', '3,5'], 'Loi géométrique : 1/p = 6.'],
  ['Nombre moyen de lancers de pièce pour obtenir deux Pile consécutifs ?', '6', ['4', '3', '8'], 'E = 2 + 4 via les états (0, P, PP) : 6.'],
  ['Nombre moyen de lancers de pièce pour voir Pile puis Face (PF) ?', '4', ['6', '3', '2'], 'Attendre un Pile (2) puis un Face (2) : 4.'],
  ['Nombre moyen de lancers pour voir les 6 faces d’un dé ?', '14,7', ['12', '21', '36'], 'Collectionneur : 6 × (1 + 1/2 + … + 1/6) ≈ 14,7.'],
  ['Deux cartes (jeu de 52). Probabilité qu’elles soient de la même couleur (♠♥♦♣) ?', '4/17', ['1/4', '3/13', '1/17'], 'Peu importe la 1re : 12 bonnes cartes sur 51.'],
  ['Deux cartes (jeu de 52). Probabilité d’avoir une paire ?', '1/17', ['1/13', '1/169', '3/52'], 'Peu importe la 1re : 3 cartes sur 51.'],
  ['Deux cartes (jeu de 52). Probabilité d’avoir deux as ?', '1/221', ['1/169', '1/26', '1/13'], '4/52 × 3/51.'],
  ['Une carte. Probabilité de tirer un cœur ou un as ?', '4/13', ['17/52', '1/4', '5/13'], '13 + 4 − 1 (as de cœur) = 16 sur 52.'],
  ['Famille de 2 enfants, au moins un garçon. Probabilité de 2 garçons ?', '1/3', ['1/2', '1/4', '2/3'], 'Cas possibles : GG, GF, FG → 1 sur 3.'],
  ['Deux dés, la somme vaut 8. Probabilité que ce soit un double ?', '1/5', ['1/6', '1/36', '1/4'], '(2,6)(3,5)(4,4)(5,3)(6,2) : 1 double sur 5.'],
  ['Deux dés, au moins un 6. Probabilité d’un double 6 ?', '1/11', ['1/36', '1/6', '1/12'], '11 issues contiennent un 6, une seule est 6-6.'],
  ['Monty Hall : tu changes de porte. Probabilité de gagner ?', '2/3', ['1/2', '1/3', '3/4'], 'Tu gagnes en changeant dès que ton 1er choix était faux : 2/3.'],
  ['Test fiable à 99 %, maladie touchant 1 % des gens. Test positif. Probabilité d’être malade ?', '1/2', ['99/100', '1/100', '9/10'], 'Vrais positifs 0,99 % = faux positifs 0,99 % → 1/2.'],
  ['Deux dés. Probabilité que le 1er soit strictement plus grand que le 2e ?', '5/12', ['1/2', '1/3', '7/12'], '(1 − 1/6)/2 = 5/12 par symétrie.'],
  ['Trois dés. Probabilité qu’ils soient tous différents ?', '5/9', ['1/2', '2/3', '4/9'], '1 × 5/6 × 4/6 = 5/9.'],
  ['Deux dés. Probabilité que la somme soit paire ?', '1/2', ['1/3', '5/12', '7/12'], 'Même parité pour les deux dés : 1/2.']
].map(([q, ans, ds, e]) => ({ q, ans, ds, e }));

function gen(usedFixed) {
  if (Math.random() < 0.45) {
    const left = FIXED.filter((_, i) => !usedFixed.has(i));
    if (left.length) { const it = A.pick(left); usedFixed.add(FIXED.indexOf(it)); return it; }
  }
  return A.pick(PARAM)();
}
function options(it) {
  const seen = new Set([it.ans]), out = [it.ans];
  for (const d of A.shuffle(it.ds)) if (!seen.has(d) && out.length < 4 && d !== '0') { seen.add(d); out.push(d); }
  return A.shuffle(out);
}

A.register({
  id: 'proba', cat: 'quant', code: 'PROBA', name: 'Probas & EV',
  short: 'Dés, cartes, paris : le quiz trading',
  desc: 'Les questions de probabilités et d’espérance des entretiens trading. Réponds vite, mais une erreur coûte un point. Après une erreur, lis l’explication.',
  rules: ['Bonne réponse +1, erreur −1', 'Après une erreur, l’explication s’affiche : touche pour continuer', 'Réflexes utiles : passer par le contraire, compter les cas, la symétrie'],
  variants: [{ id: '180', label: '3 min', time: 180 }, { id: '300', label: '5 min', time: 300 }],
  def: '180', unit: 'points nets',
  perf: (s, v) => s / (v === '300' ? 20 : 12) * 100,
  start(ctx) {
    let good = 0, bad = 0, cur, locked = false;
    const used = new Set();
    ctx.el.innerHTML = `<div class="qbox pb"><div class="pb-q"></div><div class="pb-e"></div></div><div class="opts"></div>`;
    const qEl = ctx.el.querySelector('.pb-q'), eEl = ctx.el.querySelector('.pb-e'), oEl = ctx.el.querySelector('.opts');
    const next = () => {
      cur = gen(used); locked = false;
      qEl.textContent = cur.q; eEl.innerHTML = '';
      oEl.innerHTML = options(cur).map(o => `<button class="opt">${o}</button>`).join('');
      oEl.querySelectorAll('.opt').forEach(b => A.tap(b, () => {
        if (locked) return;
        locked = true;
        if (b.textContent === cur.ans) { good++; b.classList.add('good'); ctx.sfx('ok'); ctx.later(next, 260); }
        else {
          bad++; b.classList.add('bad'); ctx.sfx('bad'); ctx.flash(false);
          [...oEl.children].find(x => x.textContent === cur.ans).classList.add('good');
          eEl.innerHTML = `<div class="expl">${cur.e}<div class="hint" style="margin-top:8px">TOUCHE POUR CONTINUER</div></div>`;
          const go = () => { eEl.removeEventListener('pointerdown', go); oEl.removeEventListener('pointerdown', go); next(); };
          setTimeout(() => { eEl.addEventListener('pointerdown', go); oEl.addEventListener('pointerdown', go); }, 400);
        }
        ctx.score(good - bad);
      }));
    };
    next();
    return {
      finish: () => ({
        score: good - bad,
        stats: [['Justes', good], ['Fausses', bad], ['Précision', good + bad ? A.fmt(good / (good + bad) * 100, 0) + ' %' : '—']],
        x: { good, bad }
      })
    };
  }
});
A._proba = { PARAM, FIXED };
})();
