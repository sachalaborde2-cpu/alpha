'use strict';
/* SORTIE — Amène la balle jusqu'au trou en déplaçant voitures (2) et bus (3).
 * La balle glisse dans les 4 directions ; le trou change de bord et de position à chaque niveau.
 * Puzzles pré-calculés par BFS (banque) : le nombre de coups optimal est toujours connu. */
(function () {
const N = 6;
const LEVELS = [[3, 5], [6, 8], [9, 12], [13, 16], [17, 28]];

// Case d'arrivée (bord du plateau) pour un trou donné
const goalCell = h => h.side === 'R' ? [N - 1, h.pos] : h.side === 'L' ? [0, h.pos] : h.side === 'T' ? [h.pos, 0] : [h.pos, N - 1];

/* État : [bx, by, v1, v2, …] — la balle a 2 coordonnées, chaque véhicule 1 (sa position le long de son axe).
 * P = véhicules { x, y, len, h } (coordonnée fixe = y si horizontal, x si vertical). */
function grid(s, P) {
  const g = new Uint8Array(N * N);
  g[s[1] * N + s[0]] = 1;
  for (let i = 0; i < P.length; i++) {
    const p = P[i], v = s[i + 2];
    for (let k = 0; k < p.len; k++) g[p.h ? p.y * N + v + k : (v + k) * N + p.x] = 1;
  }
  return g;
}
function neighbors(s, P) {
  const g = grid(s, P), out = [];
  const bx = s[0], by = s[1];
  const push = (i, v) => { const t = s.slice(); t[i] = v; out.push(t); };
  for (let x = bx - 1; x >= 0 && !g[by * N + x]; x--) push(0, x);
  for (let x = bx + 1; x < N && !g[by * N + x]; x++) push(0, x);
  for (let y = by - 1; y >= 0 && !g[y * N + bx]; y--) push(1, y);
  for (let y = by + 1; y < N && !g[y * N + bx]; y++) push(1, y);
  for (let i = 0; i < P.length; i++) {
    const p = P[i], v = s[i + 2];
    if (p.h) {
      for (let x = v - 1; x >= 0 && !g[p.y * N + x]; x--) push(i + 2, x);
      for (let x = v + p.len; x < N && !g[p.y * N + x]; x++) push(i + 2, x - p.len + 1);
    } else {
      for (let y = v - 1; y >= 0 && !g[y * N + p.x]; y--) push(i + 2, y);
      for (let y = v + p.len; y < N && !g[y * N + p.x]; y++) push(i + 2, y - p.len + 1);
    }
  }
  return out;
}
const key = s => String.fromCharCode(...s.map(v => v + 48));

// Composante complète + distance de chaque état au but (BFS multi-sources)
function analyze(s0, P, hole, limit = 40000) {
  const [gx, gy] = goalCell(hole);
  const states = [s0], idx = new Map([[key(s0), 0]]), adj = [];
  for (let i = 0; i < states.length; i++) {
    if (states.length > limit) return null;
    const a = [];
    for (const t of neighbors(states[i], P)) {
      const k = key(t);
      let j = idx.get(k);
      if (j === undefined) { j = states.length; idx.set(k, j); states.push(t); }
      a.push(j);
    }
    adj.push(a);
  }
  const dist = new Int16Array(states.length).fill(-1), q = [];
  states.forEach((s, i) => { if (s[0] === gx && s[1] === gy) { dist[i] = 0; q.push(i); } });
  if (!q.length) return null;
  for (let h = 0; h < q.length; h++) for (const j of adj[q[h]]) if (dist[j] < 0) { dist[j] = dist[q[h]] + 1; q.push(j); }
  return { states, dist };
}

function randomBoard(nVeh) {
  const g = new Uint8Array(N * N), P = [];
  const bx = A.rand(0, N - 1), by = A.rand(0, N - 1);
  g[by * N + bx] = 1;
  for (let t = 0; t < 400 && P.length < nVeh; t++) {
    const len = Math.random() < 0.3 ? 3 : 2, h = Math.random() < 0.5;
    const x = h ? A.rand(0, N - len) : A.rand(0, N - 1), y = h ? A.rand(0, N - 1) : A.rand(0, N - len);
    const cells = []; for (let k = 0; k < len; k++) cells.push(h ? y * N + x + k : (y + k) * N + x);
    if (cells.some(c => g[c])) continue;
    cells.forEach(c => g[c] = 1);
    P.push({ x, y, len, h });
  }
  const hole = { side: A.pick(['L', 'R', 'T', 'B']), pos: A.rand(0, N - 1) };
  return { s0: [bx, by].concat(P.map(p => p.h ? p.x : p.y)), P, hole };
}

// Génération à la volée (secours si la banque manque)
function genLive(level) {
  const [lo, hi] = LEVELS[A.clamp(level, 0, LEVELS.length - 1)];
  let best = null;
  for (let attempt = 0; attempt < 40; attempt++) {
    const b = randomBoard(A.rand(10, 14));
    const r = analyze(b.s0, b.P, b.hole, 20000);
    if (!r) continue;
    let pick = -1, far = 0;
    r.dist.forEach((d, i) => { if (d > r.dist[far]) far = i; if (d >= lo && d <= hi && (pick < 0 || d > r.dist[pick])) pick = i; });
    const mk = i => ({ s: r.states[i], P: b.P, hole: b.hole, opt: r.dist[i] });
    if (pick >= 0) return mk(pick);
    if (r.dist[far] > 0 && (!best || r.dist[far] > best.opt)) best = mk(far);
  }
  return best;
}

/* Banque : 'opt:' + côté (L/R/T/B) + pos + bx + by + véhicules 'xylh'… */
function encode(p) {
  return `${p.opt}:${p.hole.side}${p.hole.pos}${p.s[0]}${p.s[1]}` +
    p.P.map((v, i) => `${v.h ? p.s[i + 2] : v.x}${v.h ? v.y : p.s[i + 2]}${v.len}${v.h ? 1 : 0}`).join('');
}
function decode(str) {
  const [opt, c] = str.split(':');
  const hole = { side: c[0], pos: +c[1] };
  const P = [], s = [+c[2], +c[3]];
  for (let i = 4; i < c.length; i += 4) {
    const [x, y, len, h] = c.slice(i, i + 4).split('').map(Number);
    P.push({ x, y, len, h: !!h }); s.push(h ? x : y);
  }
  return { s, P, hole, opt: +opt };
}
const recent = [];
function gen(level) {
  const lv = A.clamp(level, 0, LEVELS.length - 1);
  const bank = A.EXIT_BANK && A.EXIT_BANK[lv];
  if (!bank || !bank.length) return genLive(lv);
  const fresh = bank.filter(b => !recent.includes(b));
  const pick = A.pick(fresh.length ? fresh : bank);
  recent.push(pick); if (recent.length > 80) recent.shift();
  return decode(pick);
}

A.register({
  id: 'exit', cat: 'logi', code: 'SORTIE', name: 'La Balle & le Trou',
  short: 'Libère le passage, en un minimum de coups',
  desc: 'Fais glisser la balle dans n’importe quelle direction et déplace voitures et bus pour lui ouvrir la route jusqu’au trou. Le trou change de place à chaque niveau. Chaque niveau a une solution optimale connue : vise-la.',
  rules: ['La balle glisse dans les 4 directions, les véhicules seulement dans leur axe', 'Un glissement (même de plusieurs cases) = 1 coup', 'Points = difficulté × efficacité · bonus ×1,5 si tu trouves l’optimal'],
  variants: [{ id: '300', label: '5 min', time: 300 }, { id: '180', label: '3 min', time: 180 }],
  def: '300', unit: 'points',
  perf: (s, v) => s / (v === '180' ? 45 : 75) * 100,
  start(ctx) {
    let level = A.clamp(A.level('exit2', 0), 0, LEVELS.length - 1), maxLvl = level;
    let pts = 0, solved = 0, optimal = 0, cur, st, moves, hist, busy = false, cell = 50, goal;
    ctx.el.innerHTML = `<div class="ex">
      <div class="ex-info"><span>COUPS <b class="mv">0</b></span><span>OPTIMAL <b class="op">–</b></span><span>NIV. <b class="lv"></b></span></div>
      <div class="ex-board"><div class="ex-gate"></div><div class="ex-hole"></div></div>
      <div class="kp-actions"><button class="key act" data-a="undo">↶ ANNULER</button><button class="key act" data-a="reset">RESET</button><button class="key act" data-a="skip">PASSER</button></div>
    </div>`;
    const board = ctx.el.querySelector('.ex-board'), hole = ctx.el.querySelector('.ex-hole'), gate = ctx.el.querySelector('.ex-gate');
    const mvEl = ctx.el.querySelector('.mv'), opEl = ctx.el.querySelector('.op'), lvEl = ctx.el.querySelector('.lv');
    const size = () => {
      cell = Math.floor(Math.max(34, Math.min((ctx.el.clientWidth - 8) / (N + 1), (ctx.el.clientHeight - 150) / (N + 1))));
      board.style.width = board.style.height = cell * N + 'px';
      board.style.setProperty('--c', cell + 'px');
    };
    const placeHole = () => {
      const { side, pos } = cur.hole, c = cell, hs = c * 0.72;
      const cx = side === 'R' ? N * c + c * 0.3 : side === 'L' ? -c * 0.3 : (pos + 0.5) * c;
      const cy = side === 'B' ? N * c + c * 0.3 : side === 'T' ? -c * 0.3 : (pos + 0.5) * c;
      Object.assign(hole.style, { width: hs + 'px', height: hs + 'px', left: cx - hs / 2 + 'px', top: cy - hs / 2 + 'px' });
      const vert = side === 'L' || side === 'R';
      Object.assign(gate.style, {
        width: vert ? '3px' : c - 8 + 'px', height: vert ? c - 8 + 'px' : '3px',
        left: (side === 'R' ? N * c - 1 : side === 'L' ? -2 : pos * c + 4) + 'px',
        top: (side === 'B' ? N * c - 1 : side === 'T' ? -2 : pos * c + 4) + 'px'
      });
    };
    const occupied = skip => {
      const g = new Uint8Array(N * N);
      if (skip !== -1) g[st[1] * N + st[0]] = 1;
      cur.P.forEach((p, i) => { if (i === skip) return; const v = st[i + 2]; for (let k = 0; k < p.len; k++) g[p.h ? p.y * N + v + k : (v + k) * N + p.x] = 1; });
      return g;
    };
    const setPos = (el, x, y) => { el.style.transform = `translate(${x * cell}px, ${y * cell}px)`; };
    const render = () => {
      board.querySelectorAll('.pc').forEach(e => e.remove());
      const ball = document.createElement('div');
      ball.className = 'pc ball'; ball.style.width = ball.style.height = cell + 'px'; ball.innerHTML = '<i></i>';
      setPos(ball, st[0], st[1]); board.appendChild(ball); dragBall(ball);
      cur.P.forEach((p, i) => {
        const el = document.createElement('div');
        el.className = 'pc ' + (p.len === 3 ? 'bus' : 'car') + (p.h ? ' h' : ' v');
        el.style.width = (p.h ? p.len : 1) * cell + 'px';
        el.style.height = (p.h ? 1 : p.len) * cell + 'px';
        el.innerHTML = '<i></i>';
        setPos(el, p.h ? st[i + 2] : p.x, p.h ? p.y : st[i + 2]);
        board.appendChild(el);
        dragVehicle(el, i);
      });
      mvEl.textContent = moves; opEl.textContent = cur.opt; lvEl.textContent = level + 1;
    };
    const commit = (idx, v) => {
      if (st[idx] === v) return;
      hist.push(st.slice()); st[idx] = v; moves++; mvEl.textContent = moves; ctx.sfx('tick');
    };
    const dragVehicle = (el, i) => {
      let d = null;
      el.addEventListener('pointerdown', e => {
        if (busy) return;
        e.preventDefault();
        const p = cur.P[i], g = occupied(i);
        let lo = st[i + 2], hi = lo;
        if (p.h) { while (lo > 0 && !g[p.y * N + lo - 1]) lo--; while (hi + p.len < N && !g[p.y * N + hi + p.len]) hi++; }
        else { while (lo > 0 && !g[(lo - 1) * N + p.x]) lo--; while (hi + p.len < N && !g[(hi + p.len) * N + p.x]) hi++; }
        d = { px: e.clientX, py: e.clientY, from: st[i + 2], lo, hi, pos: st[i + 2] };
        el.setPointerCapture(e.pointerId); el.classList.add('drag');
      });
      el.addEventListener('pointermove', e => {
        if (!d) return;
        const p = cur.P[i];
        d.pos = A.clamp(d.from + (p.h ? e.clientX - d.px : e.clientY - d.py) / cell, d.lo, d.hi);
        setPos(el, p.h ? d.pos : p.x, p.h ? p.y : d.pos);
      });
      const up = () => {
        if (!d) return;
        const p = cur.P[i];
        el.classList.remove('drag');
        commit(i + 2, Math.round(d.pos));
        setPos(el, p.h ? st[i + 2] : p.x, p.h ? p.y : st[i + 2]);
        d = null;
      };
      el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    };
    // La balle : on verrouille l'axe au premier mouvement franc (horizontal ou vertical)
    const dragBall = el => {
      let d = null;
      el.addEventListener('pointerdown', e => {
        if (busy) return;
        e.preventDefault();
        const g = occupied(-1), bx = st[0], by = st[1];
        let l = bx, r = bx, t = by, b = by;
        while (l > 0 && !g[by * N + l - 1]) l--;
        while (r < N - 1 && !g[by * N + r + 1]) r++;
        while (t > 0 && !g[(t - 1) * N + bx]) t--;
        while (b < N - 1 && !g[(b + 1) * N + bx]) b++;
        d = { px: e.clientX, py: e.clientY, l, r, t, b, axis: null, x: bx, y: by };
        el.setPointerCapture(e.pointerId); el.classList.add('drag');
      });
      el.addEventListener('pointermove', e => {
        if (!d) return;
        const dx = e.clientX - d.px, dy = e.clientY - d.py;
        if (!d.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 6) d.axis = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
        if (d.axis === 'h') { d.x = A.clamp(st[0] + dx / cell, d.l, d.r); d.y = st[1]; }
        if (d.axis === 'v') { d.y = A.clamp(st[1] + dy / cell, d.t, d.b); d.x = st[0]; }
        setPos(el, d.x, d.y);
      });
      const up = () => {
        if (!d) return;
        el.classList.remove('drag');
        const nx = Math.round(d.x), ny = Math.round(d.y);
        if (nx !== st[0]) commit(0, nx); else if (ny !== st[1]) commit(1, ny);
        setPos(el, st[0], st[1]);
        d = null;
        if (st[0] === goal[0] && st[1] === goal[1]) win(el);
      };
      el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    };
    const win = el => {
      busy = true;
      const o = { R: [0.8, 0], L: [-0.8, 0], T: [0, -0.8], B: [0, 0.8] }[cur.hole.side];
      el.style.transition = 'transform .4s cubic-bezier(.5,0,.9,.4), opacity .4s';
      el.style.transform = `translate(${(st[0] + o[0]) * cell}px, ${(st[1] + o[1]) * cell}px) scale(.3)`;
      el.style.opacity = 0;
      const gain = Math.round(cur.opt * (moves === cur.opt ? 1.5 : Math.max(0.4, Math.min(1, cur.opt / moves))) * 10) / 10;
      pts = A.round(pts + gain, 1); solved++; if (moves === cur.opt) optimal++;
      ctx.score(A.fmt(pts, 0)); ctx.sfx('win'); ctx.flash(true);
      ctx.toast(moves === cur.opt ? `OPTIMAL · +${A.fmt(gain, 1)}` : `+${A.fmt(gain, 1)} · ${moves} coups / ${cur.opt}`);
      if (moves <= cur.opt + 2) level = Math.min(LEVELS.length - 1, level + 1);
      maxLvl = Math.max(maxLvl, level);
      ctx.later(load, 700);
    };
    const load = () => {
      cur = gen(level);
      st = cur.s.slice(); goal = goalCell(cur.hole); moves = 0; hist = []; busy = false;
      placeHole(); render();
    };
    ctx.el.querySelectorAll('[data-a]').forEach(b => A.tap(b, () => {
      if (busy) return;
      const a = b.dataset.a;
      if (a === 'undo' && hist.length) { st = hist.pop(); moves--; render(); }
      if (a === 'reset') { st = cur.s.slice(); moves = 0; hist = []; render(); }
      if (a === 'skip') { level = Math.max(0, level - 1); busy = true; ctx.flash(false); ctx.later(load, 200); }
    }));
    size();
    load();
    return {
      levelKey: 'exit2',
      finish: () => ({
        score: Math.round(pts),
        stats: [['Niveaux résolus', solved], ['Solutions optimales', optimal], ['Niveau max', maxLvl + 1]],
        level: Math.max(0, maxLvl - 1),
        x: { solved, optimal }
      })
    };
  }
});
A._exit = { gen, genLive, analyze, randomBoard, encode, decode, goalCell, LEVELS };
})();
