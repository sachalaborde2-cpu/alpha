'use strict';
/* SORTIE — Fais rouler la balle jusqu'au trou en déplaçant voitures (2) et bus (3).
 * Puzzles générés puis résolus par BFS : on connaît toujours le nombre de coups optimal. */
(function () {
const N = 6, ROW = 2;
const LEVELS = [[3, 5], [6, 9], [10, 14], [15, 20], [21, 60]];

// pièce : { x, y, len, h } ; pièce 0 = la balle (1 case, horizontale, rangée ROW)
function neighbors(s, P) {
  const g = new Uint8Array(N * N);
  for (let i = 0; i < P.length; i++) {
    const p = P[i];
    for (let k = 0; k < p.len; k++) g[p.h ? p.y * N + s[i] + k : (s[i] + k) * N + p.x] = 1;
  }
  const out = [];
  for (let i = 0; i < P.length; i++) {
    const p = P[i], v = s[i];
    if (p.h) {
      for (let x = v - 1; x >= 0 && !g[p.y * N + x]; x--) { const t = s.slice(); t[i] = x; out.push(t); }
      for (let x = v + p.len; x < N && !g[p.y * N + x]; x++) { const t = s.slice(); t[i] = x - p.len + 1; out.push(t); }
    } else {
      for (let y = v - 1; y >= 0 && !g[y * N + p.x]; y--) { const t = s.slice(); t[i] = y; out.push(t); }
      for (let y = v + p.len; y < N && !g[y * N + p.x]; y++) { const t = s.slice(); t[i] = y - p.len + 1; out.push(t); }
    }
  }
  return out;
}
const key = s => String.fromCharCode(...s.map(v => v + 48));

function randomBoard(nVeh) {
  const P = [{ x: 0, y: ROW, len: 1, h: true, ball: true }];
  P[0].x = A.rand(0, 2);
  const g = new Uint8Array(N * N); g[ROW * N + P[0].x] = 1;
  for (let t = 0; t < 300 && P.length < nVeh + 1; t++) {
    const len = Math.random() < 0.28 ? 3 : 2, h = Math.random() < 0.5;
    if (h && Math.random() < 0.5) continue;
    const x = h ? A.rand(0, N - len) : A.rand(0, N - 1), y = h ? A.rand(0, N - 1) : A.rand(0, N - len);
    if (h && y === ROW) continue;
    const cells = []; for (let k = 0; k < len; k++) cells.push(h ? y * N + x + k : (y + k) * N + x);
    if (cells.some(c => g[c])) continue;
    cells.forEach(c => g[c] = 1);
    P.push({ x, y, len, h });
  }
  return P;
}

// Explore toute la composante, puis distances aux états gagnants (BFS multi-sources)
function analyze(P) {
  const s0 = P.map(p => p.h ? p.x : p.y);
  const states = [s0], idx = new Map([[key(s0), 0]]), adj = [];
  for (let i = 0; i < states.length; i++) {
    if (states.length > 30000) return null;
    const nb = neighbors(states[i], P), a = [];
    for (const t of nb) {
      const k = key(t);
      let j = idx.get(k);
      if (j === undefined) { j = states.length; idx.set(k, j); states.push(t); }
      a.push(j);
    }
    adj.push(a);
  }
  const dist = new Int16Array(states.length).fill(-1), q = [];
  states.forEach((s, i) => { if (s[0] === N - 1) { dist[i] = 0; q.push(i); } });
  if (!q.length) return null;
  for (let h = 0; h < q.length; h++) for (const j of adj[q[h]]) if (dist[j] < 0) { dist[j] = dist[q[h]] + 1; q.push(j); }
  return { states, dist };
}

function genLive(level) {
  const [lo, hi] = LEVELS[A.clamp(level, 0, LEVELS.length - 1)];
  let best = null;
  for (let attempt = 0; attempt < 60; attempt++) {
    const P = randomBoard(A.rand(8 + Math.min(level, 3), 12 + Math.min(level, 2)));
    const r = analyze(P);
    if (!r) continue;
    let pick = -1, far = -1;
    r.dist.forEach((d, i) => {
      if (d > far) far = d;
      if (d >= lo && d <= hi && (pick < 0 || d > r.dist[pick] || (d === r.dist[pick] && Math.random() < 0.3))) pick = i;
    });
    const mk = i => ({ pieces: P.map((p, k) => Object.assign({}, p, p.h ? { x: r.states[i][k] } : { y: r.states[i][k] })), opt: r.dist[i] });
    if (pick >= 0) return mk(pick);
    if (far > 0 && (!best || far > best.opt)) { const i = r.dist.indexOf(far); best = mk(i); }
  }
  return best;
}

// Tirage dans la banque pré-calculée (instantané), en évitant les puzzles déjà vus récemment
const recent = [];
function decode(str) {
  const [opt, code] = str.split(':');
  const pieces = [];
  for (let i = 0; i < code.length; i += 4) {
    const [x, y, len, h] = code.slice(i, i + 4).split('').map(Number);
    pieces.push(i ? { x, y, len, h: !!h } : { x, y, len, h: true, ball: true });
  }
  return { pieces, opt: +opt };
}
function gen(level) {
  const lv = A.clamp(level, 0, LEVELS.length - 1);
  const bank = A.EXIT_BANK && A.EXIT_BANK[lv];
  if (!bank || !bank.length) return genLive(lv);
  const fresh = bank.filter(b => !recent.includes(b));
  const pick = A.pick(fresh.length ? fresh : bank);
  recent.push(pick); if (recent.length > 60) recent.shift();
  return decode(pick);
}

A.register({
  id: 'exit', cat: 'logi', code: 'SORTIE', name: 'La Balle & le Trou',
  short: 'Libère le passage, en un minimum de coups',
  desc: 'Fais glisser voitures et bus pour ouvrir la route : la balle doit rouler jusqu’au trou à droite. Chaque niveau a une solution optimale connue : vise-la.',
  rules: ['Glisse les véhicules dans leur axe, la balle roule sur sa ligne', 'Un glissement (même de plusieurs cases) = 1 coup', 'Points = difficulté du niveau × efficacité · bonus ×1,5 si tu trouves l’optimal'],
  variants: [{ id: '300', label: '5 min', time: 300 }, { id: '180', label: '3 min', time: 180 }],
  def: '300', unit: 'points',
  perf: (s, v) => s / (v === '180' ? 45 : 75) * 100,
  start(ctx) {
    let level = A.level('exit', 0), maxLvl = level;
    let pts = 0, solved = 0, optimal = 0, cur, pieces, moves, hist, busy = false;
    ctx.el.innerHTML = `<div class="ex">
      <div class="ex-info"><span>COUPS <b class="mv">0</b></span><span>OPTIMAL <b class="op">–</b></span><span>NIV. <b class="lv"></b></span></div>
      <div class="ex-board"><div class="ex-hole"></div></div>
      <div class="kp-actions"><button class="key act" data-a="undo">↶ ANNULER</button><button class="key act" data-a="reset">RESET</button><button class="key act" data-a="skip">PASSER</button></div>
    </div>`;
    const board = ctx.el.querySelector('.ex-board'), mvEl = ctx.el.querySelector('.mv'), opEl = ctx.el.querySelector('.op'), lvEl = ctx.el.querySelector('.lv');
    let cell = 50;
    const size = () => {
      cell = Math.floor(Math.max(34, Math.min((ctx.el.clientWidth - 8) / (N + 0.5), (ctx.el.clientHeight - 130) / N)));
      board.style.width = board.style.height = cell * N + 'px';
      board.style.setProperty('--c', cell + 'px');
    };
    const place = (p, el, pos) => {
      const x = p.h ? (pos ?? p.x) : p.x, y = p.h ? p.y : (pos ?? p.y);
      el.style.transform = `translate(${x * cell}px, ${y * cell}px)`;
    };
    const occupied = skip => {
      const g = new Uint8Array(N * N);
      pieces.forEach((p, i) => { if (i === skip) return; for (let k = 0; k < p.len; k++) g[p.h ? p.y * N + p.x + k : (p.y + k) * N + p.x] = 1; });
      return g;
    };
    const render = () => {
      board.querySelectorAll('.pc').forEach(e => e.remove());
      pieces.forEach((p, i) => {
        const el = document.createElement('div');
        el.className = 'pc ' + (p.ball ? 'ball' : p.len === 3 ? 'bus' : 'car') + (p.h ? ' h' : ' v');
        el.style.width = (p.h ? p.len : 1) * cell + 'px';
        el.style.height = (p.h ? 1 : p.len) * cell + 'px';
        el.innerHTML = '<i></i>';
        place(p, el);
        board.appendChild(el);
        drag(el, i);
      });
      mvEl.textContent = moves; opEl.textContent = cur.opt; lvEl.textContent = level + 1;
    };
    const drag = (el, i) => {
      let st = null;
      el.addEventListener('pointerdown', e => {
        if (busy) return;
        e.preventDefault();
        const p = pieces[i], g = occupied(i);
        let lo = p.h ? p.x : p.y, hi = lo;
        if (p.h) { while (lo > 0 && !g[p.y * N + lo - 1]) lo--; while (hi + p.len < N && !g[p.y * N + hi + p.len]) hi++; }
        else { while (lo > 0 && !g[(lo - 1) * N + p.x]) lo--; while (hi + p.len < N && !g[(hi + p.len) * N + p.x]) hi++; }
        st = { px: e.clientX, py: e.clientY, from: p.h ? p.x : p.y, lo, hi, pos: p.h ? p.x : p.y };
        el.setPointerCapture(e.pointerId);
        el.classList.add('drag');
      });
      el.addEventListener('pointermove', e => {
        if (!st) return;
        const p = pieces[i];
        const d = (p.h ? e.clientX - st.px : e.clientY - st.py) / cell;
        st.pos = A.clamp(st.from + d, st.lo, st.hi);
        place(p, el, st.pos);
      });
      const up = () => {
        if (!st) return;
        const p = pieces[i], to = Math.round(st.pos);
        el.classList.remove('drag');
        if (to !== st.from) {
          hist.push(pieces.map(q => Object.assign({}, q)));
          if (p.h) p.x = to; else p.y = to;
          moves++; mvEl.textContent = moves; ctx.sfx('tick');
        }
        place(p, el);
        st = null;
        if (pieces[0].x === N - 1) win(el);
      };
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    };
    const win = () => {
      busy = true;
      const ballEl = board.querySelector('.ball');
      ballEl.classList.add('sink');
      const eff = Math.min(1, cur.opt / moves);
      const gain = Math.round(cur.opt * (moves === cur.opt ? 1.5 : Math.max(0.4, eff)) * 10) / 10;
      pts = A.round(pts + gain, 1); solved++; if (moves === cur.opt) optimal++;
      ctx.score(A.fmt(pts, 0)); ctx.sfx('win'); ctx.flash(true);
      ctx.toast && ctx.toast(moves === cur.opt ? `OPTIMAL · +${A.fmt(gain, 1)}` : `+${A.fmt(gain, 1)} · ${moves} coups / ${cur.opt}`);
      if (moves <= cur.opt + 2) level = Math.min(LEVELS.length - 1, level + 1);
      maxLvl = Math.max(maxLvl, level);
      ctx.later(load, 700);
    };
    const load = () => {
      cur = gen(level);
      pieces = cur.pieces.map(p => Object.assign({}, p)); moves = 0; hist = []; busy = false;
      render();
    };
    ctx.el.querySelectorAll('[data-a]').forEach(b => A.tap(b, () => {
      if (busy) return;
      const a = b.dataset.a;
      if (a === 'undo' && hist.length) { pieces = hist.pop(); moves--; render(); }
      if (a === 'reset') { pieces = cur.pieces.map(p => Object.assign({}, p)); moves = 0; hist = []; render(); }
      if (a === 'skip') { level = Math.max(0, level - 1); busy = true; ctx.flash(false); ctx.later(load, 200); }
    }));
    size();
    load();
    return {
      finish: () => ({
        score: Math.round(pts),
        stats: [['Niveaux résolus', solved], ['Solutions optimales', optimal], ['Niveau max', maxLvl + 1]],
        level: Math.max(0, maxLvl - 1),
        x: { solved, optimal }
      })
    };
  }
});
A._exit = { gen, genLive, analyze, decode, LEVELS };
})();
