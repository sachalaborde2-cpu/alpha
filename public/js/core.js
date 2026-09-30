'use strict';
/* ALPHA — noyau : utilitaires, stockage, catégories, indice, sons, composants UI. */
(function () {
const A = window.A = {};

/* ---------- version ---------- */
A.VERSION = '1.2.0';
A.CHANGELOG = [
  { v: '1.2.0', date: '2026-09-30', items: [
    'Onglet AMIS : crée ton profil, ajoute tes potes avec leur code ami',
    'Duel quotidien : tout le monde a les mêmes 6 épreuves, comparez-vous épreuve par épreuve',
    'Classements : indice Alpha, cotes par catégorie, records par jeu',
    'Mises à jour automatiques : l’app vérifie les nouvelles versions à chaque retour'
  ] },
  { v: '1.1.0', date: '2026-09-30', items: [
    'La Balle & le Trou v2 : la balle se déplace dans les 4 directions et le trou change de place à chaque niveau',
    '5 nouveaux modules : Fair Value, P&L Express, Carnet d’ordres, Stroop Marché, Code Breaker',
    '52 nouveaux brainteasers (107 au total)',
    'Sprint Calcul : notation plus juste · Switch : notation plus exigeante (erreur −2)',
    'Numéro de version affiché et notes de mise à jour'
  ] },
  { v: '1.0.0', date: '2026-09-27', items: ['Première version : 11 modules, séance du jour, indice Alpha, tableau de bord'] }
];

/* ---------- utilitaires ---------- */
A.rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
A.pick = arr => arr[Math.floor(Math.random() * arr.length)];
A.shuffle = arr => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
A.clamp = (x, a, b) => Math.max(a, Math.min(b, x));
A.gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
A.round = (x, d = 4) => Math.round(x * 10 ** d) / 10 ** d;
A.avg = arr => arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : null;
A.seeded = seed => {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};
A.hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

A.dayKey = (d = new Date()) => {
  const z = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};
A.dayFromKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
A.addDays = (k, n) => { const d = A.dayFromKey(k); d.setDate(d.getDate() + n); return A.dayKey(d); };
A.DAYS = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
A.MONTHS = ['JANV', 'FÉVR', 'MARS', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛT', 'SEPT', 'OCT', 'NOV', 'DÉC'];
A.shortDate = k => { const d = A.dayFromKey(k); return `${d.getDate()} ${A.MONTHS[d.getMonth()]}`; };

// Nombres au format français
A.fmt = (x, d = 0) => (x == null || isNaN(x)) ? '—' :
  x.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/ /g, ' ');
A.num = x => String(A.round(x, 4)).replace('.', ',').replace('-', '−');
A.signed = (x, d = 1, suffix = '') => (x > 0 ? '+' : x < 0 ? '−' : '±') + A.fmt(Math.abs(x), d) + suffix;
A.esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
A.dcls = x => x > 0.005 ? 'up' : x < -0.005 ? 'down' : 'flat';
A.arrow = x => x > 0.005 ? '▲' : x < -0.005 ? '▼' : '■';
A.mmss = s => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

/* ---------- fractions exactes ---------- */
A.F = {
  make(n, d = 1) { if (d < 0) { n = -n; d = -d; } const g = A.gcd(n, d); return { n: n / g, d: d / g }; },
  add: (a, b) => A.F.make(a.n * b.d + b.n * a.d, a.d * b.d),
  sub: (a, b) => A.F.make(a.n * b.d - b.n * a.d, a.d * b.d),
  mul: (a, b) => A.F.make(a.n * b.n, a.d * b.d),
  div: (a, b) => b.n === 0 ? null : A.F.make(a.n * b.d, a.d * b.n),
  val: a => a.n / a.d,
  str: a => a.d === 1 ? String(a.n).replace('-', '−') : `${String(a.n).replace('-', '−')}/${a.d}`
};

/* ---------- stockage ---------- */
const KEY = 'alpha.v1';
const blank = () => ({ v: 1, created: Date.now(), sessions: [], levels: {}, daily: {}, teasers: {}, settings: { sound: false } });
A.db = (() => {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && s.v === 1) { const b = blank(); return Object.assign(b, s, { settings: Object.assign(b.settings, s.settings) }); }
  } catch (e) { /* stockage indisponible */ }
  return blank();
})();
A.save = () => { try { localStorage.setItem(KEY, JSON.stringify(A.db)); } catch (e) { /* plein ou bloqué */ } };
A.resetDb = () => { A.db = blank(); A.save(); };
A.importDb = json => { const s = JSON.parse(json); if (!s || s.v !== 1 || !Array.isArray(s.sessions)) throw new Error('format'); A.db = Object.assign(blank(), s); A.save(); };
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { /* facultatif */ }

/* ---------- catégories & jeux ---------- */
A.CATS = {
  calc:  { code: 'CALC',  name: 'Calcul' },
  logi:  { code: 'LOGI',  name: 'Logique' },
  memo:  { code: 'MEMO',  name: 'Mémoire' },
  viva:  { code: 'VIVA',  name: 'Vivacité' },
  quant: { code: 'QUANT', name: 'Probas' }
};
A.CAT_ORDER = ['calc', 'logi', 'memo', 'viva', 'quant'];
A.games = {};
A.GAME_ORDER = [];
A.register = g => { A.games[g.id] = g; A.GAME_ORDER.push(g.id); };
A.variant = (g, vid) => g.variants.find(v => v.id === vid) || g.variants.find(v => v.id === g.def) || g.variants[0];

A.record = s => {
  s.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  s.t = Date.now(); s.day = A.dayKey();
  A.db.sessions.push(s);
  if (A.db.sessions.length > 6000) A.db.sessions.splice(0, A.db.sessions.length - 6000);
  A.save();
  return s;
};
A.sessionsOf = (gid, vid) => A.db.sessions.filter(s => s.g === gid && (vid == null || s.v === vid));
A.best = (gid, vid) => { const l = A.sessionsOf(gid, vid); return l.length ? Math.max(...l.map(s => s.score)) : null; };
A.level = (gid, def = 1) => A.db.levels[gid] != null ? A.db.levels[gid] : def;

/* ---------- l'indice ALPHA ----------
 * Chaque catégorie a une cote (0-100) qui démarre à 50 et suit une moyenne mobile
 * exponentielle des perfs. L'indice = moyenne des 5 cotes × 10 (IPO à 500). */
A.IPO = 50;
A.ALPHA_K = 0.3;
A.market = () => {
  const r = {}; A.CAT_ORDER.forEach(c => r[c] = A.IPO);
  const ticks = [];
  const sorted = A.db.sessions.slice().sort((a, b) => a.t - b.t);
  const composite = () => A.CAT_ORDER.reduce((s, c) => s + r[c], 0) / A.CAT_ORDER.length * 10;
  for (const s of sorted) {
    const g = A.games[s.g];
    if (!g || s.perf == null) continue;
    // perf recalculée avec le barème actuel : un changement de notation s'applique à tout l'historique
    const perf = A.clamp(g.perf(s.score, s.v, s), 0, 100);
    r[g.cat] += A.ALPHA_K * (perf - r[g.cat]);
    ticks.push({ t: s.t, day: s.day, idx: composite(), cats: Object.assign({}, r), s });
  }
  // bougies journalières : O = clôture veille, H/L = extrêmes intrajournaliers, C = dernier tick
  const days = [];
  let prev = A.IPO * 10;
  for (const p of ticks) {
    let d = days[days.length - 1];
    if (!d || d.day !== p.day) { d = { day: p.day, o: prev, h: prev, l: prev, c: prev, n: 0, min: 0 }; days.push(d); }
    d.h = Math.max(d.h, p.idx); d.l = Math.min(d.l, p.idx); d.c = p.idx; d.n++; d.min += (p.s.dur || 0) / 60;
    d.cats = p.cats;
    prev = p.idx;
  }
  return { ticks, days, cats: r, idx: composite() };
};
// valeur d'une catégorie N jours avant (clôture), pour les variations
A.catAt = (m, cat, daysAgo) => {
  const lim = A.addDays(A.dayKey(), -daysAgo);
  let v = A.IPO;
  for (const d of m.days) { if (d.day <= lim) v = cat ? d.cats[cat] : d.c; }
  if (!cat && !m.days.some(d => d.day <= lim)) v = A.IPO * 10;
  return v;
};

A.activeDays = () => { const s = new Set(); A.db.sessions.forEach(x => s.add(x.day)); return s; };
A.streak = () => {
  const days = A.activeDays();
  let k = A.dayKey();
  if (!days.has(k)) k = A.addDays(k, -1);
  let n = 0;
  while (days.has(k)) { n++; k = A.addDays(k, -1); }
  return n;
};
A.bestStreak = () => {
  const days = [...A.activeDays()].sort();
  let best = 0, cur = 0, prev = null;
  for (const d of days) { cur = prev && A.addDays(prev, 1) === d ? cur + 1 : 1; best = Math.max(best, cur); prev = d; }
  return best;
};

/* ---------- sons (désactivés par défaut) ---------- */
let ac = null;
A.sfx = type => {
  if (!A.db.settings.sound) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const o = ac.createOscillator(), g = ac.createGain();
    const cfg = { ok: [880, 0.07], bad: [170, 0.16], tick: [620, 0.04], end: [520, 0.3], win: [1175, 0.12] }[type] || [440, 0.05];
    o.type = type === 'bad' ? 'sawtooth' : 'sine';
    o.frequency.value = cfg[0];
    g.gain.setValueAtTime(0.08, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + cfg[1]);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + cfg[1]);
  } catch (e) { /* audio indisponible */ }
};

/* ---------- composants UI ---------- */
A.h = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

// Bouton réactif au toucher (pointerdown = pas de latence)
A.tap = (el, fn) => {
  el.addEventListener('pointerdown', e => {
    if (e.button > 0) return;
    e.preventDefault();
    el.classList.add('down');
    setTimeout(() => el.classList.remove('down'), 110);
    fn(e);
  });
};

// Saisie numérique avec virgule et signe (état interne : '-12.5')
A.editNum = (s, k, max = 9) => {
  if (k === '⌫') return s.slice(0, -1);
  if (k === 'C') return '';
  if (k === '-') return s.startsWith('-') ? s.slice(1) : '-' + s;
  if (k === ',') return s.includes('.') ? s : s.replace('-', '') === '' ? s + '0.' : s + '.';
  return s.replace(/[-.]/g, '').length < max ? s + k : s;
};
A.showNum = s => s.replace('.', ',').replace('-', '−');
// juste à ±0,005 près (accepte l'arrondi au centime dans les deux sens)
A.numOk = (s, ans, tol = 0.0051) => s !== '' && s !== '-' && !s.endsWith('.') && Math.abs(+s - ans) <= tol;

// Pavé numérique maison (évite le clavier iOS)
A.keypad = ({ onKey, left = 'C', actions = [] }) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', left, '0', '⌫'];
  const el = A.h(`<div class="keypad">
    ${keys.map(k => `<button class="key${/\d/.test(k) ? '' : ' fn'}" data-k="${k}">${k === '-' ? '±' : k}</button>`).join('')}
    ${actions.length ? `<div class="kp-actions">${actions.map(a => `<button class="key act${a.primary ? ' primary' : ''}" data-k="${a.key}">${a.label}</button>`).join('')}</div>` : ''}
  </div>`);
  el.querySelectorAll('.key').forEach(b => A.tap(b, () => onKey(b.dataset.k)));
  return el;
};

// Modale de confirmation
A.confirm = (title, msg, ok = 'Confirmer', cancel = 'Annuler') => new Promise(res => {
  const m = A.h(`<div class="modal"><div class="modal-card">
    <div class="modal-title">${title}</div><div class="modal-msg">${msg}</div>
    <div class="modal-btns"><button class="btn ghost" data-r="0">${cancel}</button><button class="btn danger" data-r="1">${ok}</button></div>
  </div></div>`);
  m.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { m.remove(); res(b.dataset.r === '1'); }));
  document.body.appendChild(m);
});

// Modale avec champ texte
A.prompt = (title, msg, value = '', ok = 'Valider', max = 16) => new Promise(res => {
  const m = A.h(`<div class="modal"><div class="modal-card">
    <div class="modal-title">${title}</div><div class="modal-msg">${msg}</div>
    <input class="inp" maxlength="${max}" autocomplete="off" autocorrect="off" spellcheck="false">
    <div class="modal-btns" style="margin-top:14px"><button class="btn ghost" data-r="0">Annuler</button><button class="btn primary" data-r="1">${ok}</button></div>
  </div></div>`);
  const inp = m.querySelector('input'); inp.value = value;
  m.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { m.remove(); res(b.dataset.r === '1' ? inp.value.trim() : null); }));
  document.body.appendChild(m);
  setTimeout(() => inp.focus(), 50);
});

A.ago = t => {
  if (!t) return 'jamais';
  const s = (Date.now() - t) / 1000;
  return s < 60 ? 'à l’instant' : s < 3600 ? `il y a ${Math.floor(s / 60)} min` : s < 86400 ? `il y a ${Math.floor(s / 3600)} h` : `il y a ${Math.floor(s / 86400)} j`;
};

A.toast = msg => {
  const t = A.h(`<div class="toast">${msg}</div>`);
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('out'), 1800);
  setTimeout(() => t.remove(), 2200);
};

// Empêche l'écran de s'éteindre pendant une partie
let lock = null;
A.wake = async on => {
  try {
    if (on && 'wakeLock' in navigator && !lock) { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); }
    if (!on && lock) { await lock.release(); lock = null; }
  } catch (e) { lock = null; }
};
})();
