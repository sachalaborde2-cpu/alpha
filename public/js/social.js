'use strict';
/* Social : profil, synchronisation d'un résumé de tes scores, amis, classement.
 * Le téléphone garde { id, token, code, name } dans A.db.social ; le serveur ne voit qu'un résumé. */
(function () {
const S = A.social = {};
const st = () => A.db.social || (A.db.social = {});
S.state = st;
S.enabled = () => !!(A.db.social && A.db.social.id && !A.db.social.invalid);

async function call(action, body) {
  let r;
  try {
    r = await fetch('/api/' + action, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  } catch (e) { throw Object.assign(new Error('offline'), { code: 'offline' }); }
  const j = await r.json().catch(() => ({ error: 'server' }));
  if (!r.ok) throw Object.assign(new Error(j.error || 'server'), { code: j.error || 'server', status: r.status });
  return j;
}
const auth = () => ({ id: st().id, token: st().token });
S.ERR = {
  offline: 'Pas de réseau : réessaie quand tu es connecté.',
  notfound: 'Aucun joueur avec ce code.',
  self: 'C’est ton propre code 🙂',
  limit: 'Tu as atteint 50 amis.',
  name: 'Pseudo trop court (2 caractères minimum).',
  auth: 'Profil introuvable sur le serveur.',
  server: 'Le serveur ne répond pas, réessaie dans un instant.',
  recovery: 'Code ami ou clé de récupération incorrect.',
  size: 'Sauvegarde trop volumineuse.',
  nofriend: 'Choisis au moins un ami.'
};
S.msg = e => S.ERR[e && e.code] || S.ERR.server;

/* Résumé public : ce que tes amis voient */
S.summary = () => {
  const m = A.market(), r = x => A.round(x, 1);
  const d = A.db.daily[A.dayKey()];
  const recs = {};
  A.GAME_ORDER.forEach(id => { const b = A.best(id, A.games[id].def); if (b != null) recs[id] = b; });
  const done = {};
  if (d) Object.keys(d.done).forEach(i => { done[i] = Math.round(d.done[i].perf); });
  return {
    v: A.VERSION,
    idx: r(m.idx), idx7: r(A.catAt(m, null, 7)),
    cats: Object.fromEntries(A.CAT_ORDER.map(c => [c, r(m.cats[c] * 10)])),
    spark: [A.IPO * 10].concat(m.days.slice(-14).map(x => r(x.c))),
    streak: A.streak(), bestStreak: A.bestStreak(),
    games: A.db.sessions.length,
    min: Math.round(A.db.sessions.reduce((s, x) => s + (x.dur || 0), 0) / 60),
    recs,
    today: d ? { day: A.dayKey(), plan: d.plan.map(p => p.g + '/' + p.v), done } : null
  };
};

S.register = async name => {
  const j = await call('register', { name });
  A.db.social = { id: j.id, token: j.token, code: j.code, name: j.name };
  A.save();
  await S.sync(true);
  return j;
};

// Synchro : différée (regroupe plusieurs parties) sauf si now = true. Silencieuse hors ligne.
let timer = null;
S.sync = (now = false) => {
  if (!S.enabled()) return Promise.resolve(false);
  clearTimeout(timer);
  if (!now) { st().dirty = true; A.save(); timer = setTimeout(() => S.sync(true), 1500); return Promise.resolve(false); }
  return call('sync', Object.assign(auth(), { name: st().name, summary: S.summary() }))
    .then(() => { st().dirty = false; st().lastSync = Date.now(); A.save(); S.flushResults(); S.backup(); return true; })
    .catch(e => { st().dirty = true; if (e.status === 401) st().invalid = true; A.save(); return false; });
};

S.board = async () => {
  const j = await call('board', auth());
  st().board = j; st().boardAt = Date.now(); A.save();
  return j;
};
S.addFriend = async code => { const j = await call('friend', Object.assign(auth(), { code })); await S.board().catch(() => {}); return j; };
S.removeFriend = async fid => { await call('unfriend', Object.assign(auth(), { friend: fid })); await S.board().catch(() => {}); };
S.rename = async name => { st().name = name; A.save(); return S.sync(true); };
S.deleteProfile = async () => { await call('delete', auth()); delete A.db.social; A.save(); };

/* ---------- sauvegarde cloud ---------- */
// Tout A.db sauf le bloc social (jeton, cache du classement)
S.backupData = () => JSON.stringify(Object.assign({}, A.db, { social: undefined }));
S.backup = async (force = false) => {
  if (!S.enabled()) return false;
  if (!force && st().backupAt && Date.now() - st().backupAt < 5 * 60e3) return false; // au plus toutes les 5 min
  try { const j = await call('backup', Object.assign(auth(), { data: S.backupData() })); st().backupAt = j.at; A.save(); return true; }
  catch (e) { if (force) throw e; return false; }
};
S.recoveryKey = async () => {
  if (st().rk) return st().rk;
  const j = await call('recovery', auth());
  st().rk = j.key; A.save();
  return j.key;
};
S.fmtKey = k => (k || '').match(/.{1,4}/g).join('-');
// Nouveau téléphone : récupère profil + sauvegarde, remplace les données locales
S.restore = async (code, key) => {
  const j = await call('restore', { code, key });
  if (j.data) A.importDb(j.data);
  A.db.social = { id: j.id, token: j.token, code: j.code, name: j.name, rk: String(key).toUpperCase().replace(/[^A-Z0-9]/g, ''), backupAt: j.at };
  A.save();
  return j;
};

/* ---------- défis (mêmes questions pour tout le monde : graine commune) ---------- */
S.CH_GAMES = [['calc', '120'], ['calc', '60'], ['calc', 'hard'], ['optiver', '40'], ['pnl', '180'], ['switch', '60'], ['stroop', '60']];
S.challenges = () => ((st().board && st().board.challenges) || []);
S.pending = () => S.challenges().filter(c => c.open && !c.results[st().id] && !(st().played || {})[c.id]);
S.createChallenge = async (game, v, to) => {
  const j = await call('challenge', Object.assign(auth(), { game, v, to }));
  const b = st().board; if (b) { b.challenges = [j.challenge].concat(b.challenges || []); A.save(); }
  return j.challenge;
};
// Résultat mémorisé localement puis envoyé (renvoyé plus tard si hors ligne)
S.submitResult = (cid, score, perf) => {
  st().played = Object.assign(st().played || {}, { [cid]: { score, perf, at: Date.now(), sent: false } });
  A.save();
  return S.flushResults();
};
S.flushResults = async () => {
  const p = st().played || {};
  for (const cid of Object.keys(p)) {
    if (p[cid].sent) continue;
    try { await call('result', Object.assign(auth(), { cid, score: p[cid].score, perf: p[cid].perf })); p[cid].sent = true; A.save(); }
    catch (e) { if (e.code !== 'notfound') return; p[cid].sent = true; A.save(); }
  }
};
S.shareText = () => `Viens t’entraîner sur Alpha 📈 ${location.origin} — ajoute-moi avec mon code ami : ${st().code}`;
})();
