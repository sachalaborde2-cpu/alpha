// API sociale d'Alpha : profils, amis, classement.
// Indépendant de Netlify : `store` expose get(key, { type: 'json' }), setJSON(key, value), delete(key)
// (interface de Netlify Blobs), ce qui permet de tester avec un store en mémoire.
//
// Clés : user/<id> → profil complet (avec l'empreinte du jeton) · code/<CODE> → { id }
// Authentification : le téléphone garde un jeton secret ; le serveur n'en stocke que le SHA-256.

const ALPH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans 0/O ni 1/I pour éviter les confusions
const MAX_FRIENDS = 50;

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
});
const rnd = n => crypto.getRandomValues(new Uint8Array(n));
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const sha = async s => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
const newCode = () => Array.from(rnd(5), x => ALPH[x % ALPH.length]).join('');
const cleanName = s => String(s || '').replace(/[\u0000-\u001f<>&"]/g, '').trim().slice(0, 16);
export const cleanCode = s => {
  let c = String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (c.length > 5 && c.startsWith('ALPHA')) c = c.slice(5);
  return c;
};
// Ce que les amis voient (jamais l'empreinte du jeton ni la liste d'amis)
const pub = u => ({ id: u.id, name: u.name, code: u.code, summary: u.summary || null, updated: u.updated || null });

export async function handle(req, store) {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const action = new URL(req.url).pathname.split('/').filter(Boolean).pop();
  let body;
  try { body = await req.json(); } catch { return json({ error: 'json' }, 400); }
  const getUser = id => store.get('user/' + id, { type: 'json' });

  if (action === 'register') {
    const name = cleanName(body.name);
    if (name.length < 2) return json({ error: 'name' }, 400);
    let code = newCode();
    for (let i = 0; i < 20 && await store.get('code/' + code, { type: 'json' }); i++) code = newCode();
    const id = hex(rnd(12)), token = hex(rnd(24)), now = Date.now();
    const u = { id, name, code, th: await sha(token), friends: [], created: now, updated: now, summary: null };
    await store.setJSON('user/' + id, u);
    await store.setJSON('code/' + code, { id });
    return json({ id, code, token, name });
  }

  // Toutes les autres actions sont authentifiées
  const u = typeof body.id === 'string' && /^[0-9a-f]{24}$/.test(body.id) ? await getUser(body.id) : null;
  if (!u || u.th !== await sha(String(body.token || ''))) return json({ error: 'auth' }, 401);

  if (action === 'sync') {
    const n = cleanName(body.name);
    if (n.length >= 2) u.name = n;
    if (body.summary && typeof body.summary === 'object' && JSON.stringify(body.summary).length < 20000) u.summary = body.summary;
    u.updated = Date.now();
    await store.setJSON('user/' + u.id, u);
    return json({ ok: true });
  }

  if (action === 'friend') {
    const ref = await store.get('code/' + cleanCode(body.code), { type: 'json' });
    const f = ref && await getUser(ref.id);
    if (!f) return json({ error: 'notfound' }, 404);
    if (f.id === u.id) return json({ error: 'self' }, 400);
    if (!u.friends.includes(f.id)) {
      if (u.friends.length >= MAX_FRIENDS) return json({ error: 'limit' }, 400);
      u.friends.push(f.id);
    }
    if (!f.friends.includes(u.id)) f.friends.push(u.id); // amitié réciproque
    await store.setJSON('user/' + u.id, u);
    await store.setJSON('user/' + f.id, f);
    return json({ friend: pub(f) });
  }

  if (action === 'unfriend') {
    const fid = String(body.friend || '');
    u.friends = u.friends.filter(x => x !== fid);
    await store.setJSON('user/' + u.id, u);
    const f = /^[0-9a-f]{24}$/.test(fid) && await getUser(fid);
    if (f) { f.friends = f.friends.filter(x => x !== u.id); await store.setJSON('user/' + f.id, f); }
    return json({ ok: true });
  }

  if (action === 'board') {
    const friends = (await Promise.all(u.friends.map(getUser))).filter(Boolean);
    return json({ me: pub(u), friends: friends.map(pub), now: Date.now() });
  }

  if (action === 'delete') {
    for (const fid of u.friends) {
      const f = await getUser(fid);
      if (f) { f.friends = f.friends.filter(x => x !== u.id); await store.setJSON('user/' + f.id, f); }
    }
    await store.delete('code/' + u.code);
    await store.delete('user/' + u.id);
    return json({ ok: true });
  }

  return json({ error: 'action' }, 404);
}
