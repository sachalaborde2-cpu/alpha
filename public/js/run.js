'use strict';
/* PARCOURS — niveaux 1 à 2000, générés à partir du numéro (rien n'est écrit à la main).
 * Un niveau = un mini-défi chronométré (30 à 90 s) dans un jeu existant, avec un objectif de score.
 * Les 10 jeux tournent par blocs de 10 niveaux (tous les jeux une fois par bloc, le 10e est un BOSS).
 * La difficulté suit les paliers des jeux (Facile → Moyen → Difficile → Expert) et l'objectif monte
 * doucement dans chaque palier. Le Parcours est indépendant de l'indice Alpha. */
(function () {
const MAX = 2000;
// t : variantes du jeu par palier (le dernier palier est repris jusqu'à la fin) · time : secondes par niveau
const POOL = [
  { g: 'calc', t: ['easy', 'mid', '120', 'hard'], time: 45 },
  { g: 'g24', t: ['easy', 'mid', '180'], time: 60 },
  { g: 'pnl', t: ['easy', 'mid', '180'], time: 60 },
  { g: 'proba', t: ['easy', 'mid', '180'], time: 45 },
  { g: 'fair', t: ['easy', 'mid', '180'], time: 60 },
  { g: 'seq', t: ['easy', 'mid', '180'], time: 45 },
  { g: 'arb', t: ['easy', 'mid', '60'], time: 30 },
  { g: 'book', t: ['easy', 'mid', '180'], time: 60 },
  { g: 'switch', t: ['60'], time: 30 },
  { g: 'stroop', t: ['60'], time: 30 }
];
const ZONES = ['Ouverture', 'Premier ordre', 'Carnet plein', 'Spread serré', 'Momentum', 'Volatilité', 'Fixing', 'Pré-marché', 'Appel de marge', 'Liquidité',
  'Arbitrage', 'Delta neutre', 'Gamma squeeze', 'Black swan', 'Haute fréquence', 'Market maker', 'Salle des marchés', 'Desk senior', 'Prop trading', 'Alpha pur'];
const BOUNDS = [0, 0.2, 0.5, 0.85, 1];

const R = A.run = { MAX, POOL, ZONES };
const st = () => A.db.run || (A.db.run = { lvl: 1, stars: {}, fails: {}, days: {} });
R.state = st;
R.totalStars = () => Object.values(st().stars).reduce((s, x) => s + x, 0);
R.zone = n => ZONES[Math.min(ZONES.length - 1, Math.floor((n - 1) / 100))];

const blockOrder = b => {
  const rnd = A.seeded(A.hash('alpha-run' + b)), a = POOL.map((_, i) => i);
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  if (b > 0 && a[0] === blockOrder(b - 1)[POOL.length - 1]) [a[0], a[1]] = [a[1], a[0]]; // jamais deux fois le même jeu de suite
  return a;
};
const gameIdx = n => blockOrder(Math.floor((n - 1) / 10))[(n - 1) % 10];

// plus petit score entier atteignant la perf p (au rythme du jeu natif : score × scale)
const scoreFor = (g, vid, scale, p) => {
  for (let s = 0; s <= 600; s++) if (A.clamp(g.perf(s * scale, vid, {}), 0, 100) >= p) return s;
  return 600;
};

// fails : échecs successifs sur ce niveau → « coup de pouce » (objectif plus bas, jusqu'à −12 points de perf)
R.spec = (n, fails = 0) => {
  const e = POOL[gameIdx(n)], g = A.games[e.g];
  const f = (n - 1) / (MAX - 1);
  let ti = f < BOUNDS[1] ? 0 : f < BOUNDS[2] ? 1 : f < BOUNDS[3] ? 2 : 3;
  ti = Math.min(ti, e.t.length - 1);
  const lo = BOUNDS[ti], hi = ti === e.t.length - 1 ? 1 : BOUNDS[ti + 1];
  const u = A.clamp((f - lo) / (hi - lo), 0, 1);
  const boss = n % 10 === 0, vid = e.t[ti], v = A.variant(g, vid);
  const time = Math.round(e.time * (boss ? 1.5 : 1)), scale = v.time / time;
  const target = A.clamp(35 + 40 * u + (boss ? 8 : 0) - Math.min(3, fails) * 4, 20, 92);
  const p = [target, Math.min(target + 12, 96), Math.min(target + 24, 99)];
  const need = p.map(x => scoreFor(g, vid, scale, x));
  need[1] = Math.max(need[1], need[0] + 1); need[2] = Math.max(need[2], need[1] + 1);
  return { n, g: e.g, vid, label: v.label, time, scale, boss, need, assist: Math.min(3, fails) > 0, zone: R.zone(n) };
};
R.specNow = n => R.spec(n, st().fails[n] || 0);
R.starsFor = (spec, score) => spec.need.filter(x => score >= x).length;

// enregistre un résultat ; renvoie { stars, passed, advanced, best }
R.complete = (spec, score) => {
  const s = st(), stars = R.starsFor(spec, score), passed = stars > 0;
  s.days[A.dayKey()] = 1;
  let advanced = false;
  if (passed) {
    s.stars[spec.n] = Math.max(s.stars[spec.n] || 0, stars);
    delete s.fails[spec.n];
    if (spec.n === s.lvl && s.lvl <= MAX) { s.lvl++; advanced = true; }
  } else s.fails[spec.n] = (s.fails[spec.n] || 0) + 1;
  A.save();
  return { stars, passed, advanced, best: s.stars[spec.n] || 0 };
};
})();
