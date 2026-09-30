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
  server: 'Le serveur ne répond pas, réessaie dans un instant.'
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
    .then(() => { st().dirty = false; st().lastSync = Date.now(); A.save(); return true; })
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
S.shareText = () => `Viens t’entraîner sur Alpha 📈 ${location.origin} — ajoute-moi avec mon code ami : ${st().code}`;
})();
