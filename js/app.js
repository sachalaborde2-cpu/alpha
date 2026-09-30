'use strict';
/* ALPHA — écrans : desk, séance du jour, modules, intro, partie, résultats, stats, réglages. */
(function () {
const app = document.getElementById('app');
const I = {
  desk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-5 4 3 8-8"/><path d="M15 7h5v5"/></svg>',
  mods: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/></svg>',
  stats: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 4v16M6 8h-2v6h2M12 6v14M12 9h-2v7h2M18 3v15M18 6h-2v8h2" /></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>',
  back: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>'
};
let tab = 'desk';

/* ---------- montage ---------- */
function mount(el, withTabs) {
  app.innerHTML = '';
  app.appendChild(el);
  if (withTabs) {
    const nav = A.h(`<nav class="tabbar">
      <button class="tab ${tab === 'desk' ? 'on' : ''}" data-t="desk">${I.desk}DESK</button>
      <button class="tab ${tab === 'mods' ? 'on' : ''}" data-t="mods">${I.mods}MODULES</button>
      <button class="tab ${tab === 'stats' ? 'on' : ''}" data-t="stats">${I.stats}STATS</button>
    </nav>`);
    nav.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => { tab = b.dataset.t; go(); }));
    app.appendChild(nav);
  }
}
const page = (html, withTabs = true) => A.h(`<div class="screen"><div class="scroll${withTabs ? ' with-tabs' : ''}">${html}</div></div>`);
const on = (root, sel, fn) => root.querySelectorAll(sel).forEach(el => el.addEventListener('click', e => fn(el, e)));
function go() { ({ desk: renderDesk, mods: renderModules, stats: renderStats })[tab](); }

/* ---------- séance du jour ---------- */
function planFor(day) {
  const rnd = A.seeded(A.hash('alpha' + day));
  const pick = arr => arr[Math.floor(rnd() * arr.length)];
  return [
    { g: 'calc', v: '120', slot: 'OUVERTURE' },
    Object.assign(pick([{ g: 'arb', v: '60' }, { g: 'switch', v: '60' }]), { slot: 'RÉFLEXES' }),
    Object.assign(pick([{ g: 'seq', v: '180' }, { g: 'riddle', v: '240' }]), { slot: 'LOGIQUE' }),
    { g: 'exit', v: '300', slot: 'STRATÉGIE' },
    Object.assign(pick([{ g: 'nback', v: '3' }, { g: 'span', v: 'spatial' }, { g: 'span', v: 'digits' }]), { slot: 'MÉMOIRE' }),
    Object.assign(pick([{ g: 'proba', v: '180' }, { g: 'g24', v: '180' }, { g: 'optiver', v: '40' }]), { slot: 'CLÔTURE' })
  ];
}
function daily(day = A.dayKey()) {
  let d = A.db.daily[day];
  if (!d) { d = A.db.daily[day] = { plan: planFor(day), done: {} }; A.save(); }
  if (!d.teaser) { d.teaser = A.dailyTeaser(day).id; A.save(); }
  return d;
}
const estMin = (g, v) => v.time ? v.time / 60 + 0.5 : g.id === 'nback' ? v.blocks * 1.2 + 0.5 : 3;
const nextSlot = d => d.plan.findIndex((_, i) => !d.done[i]);

/* ---------- DESK ---------- */
function renderDesk() {
  const m = A.market(), d = daily(), now = new Date();
  const doneN = Object.keys(d.done).length, nx = nextSlot(d);
  const total = d.plan.reduce((s, p) => s + estMin(A.games[p.g], A.variant(A.games[p.g], p.v)), 0);
  const prevClose = A.catAt(m, null, 1);
  const chg = (m.idx - prevClose) / prevClose * 100;
  const closes = [A.IPO * 10].concat(m.days.slice(-30).map(x => x.c));
  const streak = A.streak();
  const tapeItems = A.CAT_ORDER.map(c => {
    const v = m.cats[c] * 10, p = A.catAt(m, c, 1) * 10, ch = (v - p) / p * 100;
    return `<span><b>${A.CATS[c].code}</b>${A.fmt(v, 1)} <span class="${A.dcls(ch)}">${A.arrow(ch)} ${A.fmt(Math.abs(ch), 2)}%</span></span>`;
  }).join('') + `<span><b>ALPHA</b>${A.fmt(m.idx, 1)} <span class="${A.dcls(chg)}">${A.arrow(chg)} ${A.fmt(Math.abs(chg), 2)}%</span></span>`;
  const teaser = A.TEASERS.find(t => t.id === d.teaser);
  const tz = A.db.teasers[teaser.id];

  const el = page(`
    <div class="top">
      <div class="logo"><b>ALPH<i>A</i></b><span>${A.DAYS[now.getDay()]} ${now.getDate()} ${A.MONTHS[now.getMonth()]}</span></div>
      <div style="display:flex;gap:8px;align-items:center">
        <span class="chip ${streak ? 'hot' : ''}">▲ ${streak} J</span>
        <button class="icon-btn" data-go="settings">${I.gear}</button>
      </div>
    </div>
    <div class="tape"><div class="tape-inner">${tapeItems}${tapeItems}</div></div>

    <div class="card">
      <div class="card-h"><span class="label">Indice Alpha</span><span class="label">IPO 500</span></div>
      <div class="hero-row">
        <div class="hero-num">${A.fmt(m.idx, 2)}</div>
        <span class="pill ${A.dcls(chg)} delta">${A.signed(chg, 2, ' %')}</span>
      </div>
      <div class="dim" style="font-size:12px;margin:4px 0 8px">${m.ticks.length ? 'Moyenne de tes 5 cotes · variation vs clôture d’hier' : 'Ton indice démarre à 500. Chaque partie le fait bouger.'}</div>
      <div class="desk-spark"></div>
    </div>

    <div class="card daily">
      <div class="card-h">
        <div><div class="label amber">Séance du jour</div><div style="font-weight:700;font-size:18px;margin-top:4px">${doneN === 6 ? 'Séance bouclée ✓' : doneN ? 'Séance en cours' : 'Prêt pour l’ouverture'}</div></div>
        <span class="chip">~${Math.round(total)} MIN</span>
      </div>
      <div class="progress"><i style="width:${doneN / 6 * 100}%"></i></div>
      <div class="daily-list">
        ${d.plan.map((p, i) => {
          const g = A.games[p.g], v = A.variant(g, p.v), r = d.done[i];
          return `<div class="dl-item ${r ? 'done' : ''} ${i === nx ? 'next' : ''}">
            <span class="n">${r ? '✓' : String(i + 1).padStart(2, '0')}</span>
            <span class="code">${g.code}</span>
            <span class="nm">${g.name}<span class="muted" style="font-size:11px"> · ${v.label}</span></span>
            <span class="res ${r ? (r.perf >= 50 ? 'up' : 'down') : 'muted'}">${r ? A.fmt(r.perf, 0) + '/100' : p.slot}</span>
          </div>`;
        }).join('')}
      </div>
      ${nx >= 0 ? `<button class="btn primary" data-go="daily">${doneN ? 'Continuer · épreuve ' + (nx + 1) + '/6' : 'Ouvrir la séance ▸'}</button>`
               : `<button class="btn ghost" data-go="close">Voir la clôture</button>`}
    </div>

    <button class="card teaser-card" data-go="teaser" style="width:100%;text-align:left">
      <div class="card-h"><span class="label amber">Brainteaser du jour</span><span class="chip ${tz && tz.ok ? 'hot' : ''}">${tz && tz.ok ? 'RÉSOLU ✓' : tz ? 'EN COURS' : 'BONUS'}</span></div>
      <div style="font-size:15px;line-height:1.4">${teaser.q}</div>
    </button>

    <div class="section"><span class="label">Tes positions</span><span class="label">var. 7 j</span></div>
    <div class="card" style="padding:4px 14px">
      <table class="tbl"><tbody>
      ${A.CAT_ORDER.map(c => {
        const series = [A.IPO].concat(m.days.slice(-20).map(x => x.cats[c]));
        const v = m.cats[c] * 10, p7 = A.catAt(m, c, 7) * 10, ch = (v - p7) / p7 * 100;
        return `<tr data-cat="${c}"><td><b>${A.CATS[c].code}</b><span class="nm">${A.CATS[c].name}</span></td>
          <td>${A.chart.spark(series, { w: 64, h: 22 })}</td><td>${A.fmt(v, 1)}</td>
          <td class="${A.dcls(ch)}" style="width:70px">${A.signed(ch, 1, '%')}</td></tr>`;
      }).join('')}
      </tbody></table>
    </div>
  `);
  mount(el, true);
  if (closes.length > 1) A.chart.line(el.querySelector('.desk-spark'), closes.map((c, i) => ({ y: c, label: i === 0 ? 'IPO' : A.shortDate(m.days.slice(-30)[i - 1].day) })), { h: 110 });
  on(el, '[data-go]', b => {
    const g = b.dataset.go;
    if (g === 'daily') openIntro(d.plan[nx].g, { daily: nx });
    if (g === 'close') renderClose();
    if (g === 'settings') renderSettings();
    if (g === 'teaser') renderTeaser(teaser.id, renderDesk);
  });
  on(el, '[data-cat]', () => { tab = 'stats'; go(); });
}

/* ---------- MODULES ---------- */
function renderModules() {
  const el = page(`
    <div class="label" style="margin-top:6px">Marchés</div>
    <div class="h-title">Modules</div>
    <div class="h-sub">Entraînement libre, sans limite. Chaque partie compte dans ton indice.</div>
    ${A.CAT_ORDER.map(c => `
      <div class="cat-h"><b>${A.CATS[c].code}</b>${A.CATS[c].name.toUpperCase()}</div>
      <div class="mods">
        ${A.GAME_ORDER.filter(id => A.games[id].cat === c).map(id => {
          const g = A.games[id], ss = A.sessionsOf(id), best = A.best(id, g.def);
          return `<button class="mod" data-g="${id}">
            <span class="code"><span>${g.code}</span><span class="muted">${ss.length ? ss.length + '×' : 'NEW'}</span></span>
            <span class="nm">${g.name}</span>
            <span class="ds">${g.short}</span>
            <span class="bt"><span>${best != null ? 'REC ' + best : '—'}</span>${A.chart.spark(ss.slice(-12).map(s => s.perf), { w: 56, h: 20 })}</span>
          </button>`;
        }).join('')}
        ${c === 'logi' ? `<button class="mod" data-teasers="1">
          <span class="code"><span>TEASER</span><span class="muted">${Object.values(A.db.teasers).filter(t => t.ok).length}/${A.TEASERS.length}</span></span>
          <span class="nm">Brainteasers</span><span class="ds">Les énigmes classiques des entretiens, sans chrono</span><span class="bt"><span>BIBLIOTHÈQUE</span></span></button>` : ''}
      </div>`).join('')}
  `);
  mount(el, true);
  on(el, '[data-g]', b => openIntro(b.dataset.g, {}));
  on(el, '[data-teasers]', () => renderTeaserList());
}

/* ---------- INTRO ---------- */
function openIntro(gid, opts) {
  const g = A.games[gid];
  const isDaily = opts.daily != null;
  let vid = isDaily ? daily().plan[opts.daily].v : (opts.v || g.def);
  const draw = () => {
    const v = A.variant(g, vid), ss = A.sessionsOf(gid, vid);
    const best = A.best(gid, vid), last5 = ss.slice(-5).map(s => s.score);
    const el = page(`
      <button class="back" data-back>${I.back} ${isDaily ? 'DESK' : 'MODULES'}</button>
      <div class="intro-code">${isDaily ? `ÉPREUVE ${opts.daily + 1}/6 · ${daily().plan[opts.daily].slot}` : `${A.CATS[g.cat].code} · ${g.code}`}</div>
      <div class="h-title">${g.name}</div>
      <div class="h-sub">${g.desc}</div>
      ${!isDaily && g.variants.length > 1 ? `<div class="seg" style="margin-bottom:12px">${g.variants.map(x => `<button data-v="${x.id}" class="${x.id === vid ? 'on' : ''}">${x.label}</button>`).join('')}</div>` : ''}
      <div class="stats-grid">
        <div class="stat"><div class="label">Record</div><div class="v">${best != null ? best : '—'}</div></div>
        <div class="stat"><div class="label">Moy. 5</div><div class="v">${last5.length ? A.fmt(A.avg(last5), 1) : '—'}</div></div>
        <div class="stat"><div class="label">Parties</div><div class="v">${ss.length}</div></div>
      </div>
      ${ss.length >= 2 ? `<div class="card"><div class="card-h"><span class="label">Historique · ${v.label}</span><span class="label">${g.unit}</span></div><div class="hist"></div></div>` : ''}
      <div class="card"><div class="label">Règles</div><ul class="rules">${g.rules.map(r => `<li>${r}</li>`).join('')}</ul></div>
      <div style="height:80px"></div>
    `, false);
    el.appendChild(A.h(`<div class="bottom-cta"><button class="btn primary" data-play>Lancer · ${v.label} ▸</button></div>`));
    mount(el, false);
    if (ss.length >= 2) {
      const pts = ss.slice(-30).map(s => ({ y: s.score, label: A.shortDate(s.day) }));
      const b = g.bench && g.bench[vid];
      A.chart.line(el.querySelector('.hist'), pts, { h: 140, fmt: v => A.fmt(v, 0), ref: b ? { v: b.v, label: b.label } : null });
    }
    on(el, '[data-back]', () => isDaily ? renderDesk() : (tab = 'mods', renderModules()));
    on(el, '[data-v]', b => { vid = b.dataset.v; draw(); });
    on(el, '[data-play]', () => runGame(gid, vid, opts));
  };
  draw();
}

/* ---------- PARTIE ---------- */
function runGame(gid, vid, opts) {
  const g = A.games[gid], v = A.variant(g, vid);
  const root = A.h(`<div class="screen game">
    <div class="hud">
      <button class="icon-btn" data-q>${I.close}</button>
      <span class="code">${g.code}</span><span class="sp"></span>
      <span class="score">${g.scoreLabel || 'SCORE'}<b>0</b></span>
      <span class="time">${v.time ? A.mmss(v.time) : '0:00'}</span>
      <button class="icon-btn" data-p>${I.pause}</button>
    </div>
    <div class="tbar"><i></i></div>
    <div class="stage"></div>
  </div>`);
  mount(root, false);
  const stage = root.querySelector('.stage'), scoreEl = root.querySelector('.score b'), timeEl = root.querySelector('.time'), bar = root.querySelector('.tbar');
  let clock = 0, last = null, paused = false, running = false, ended = false, inst = null, tasks = [];
  if (!v.time) bar.querySelector('i').style.transform = 'scaleX(0)';

  const ctx = {
    el: stage, v, sfx: A.sfx,
    now: () => clock,
    later: (fn, ms) => tasks.push({ at: clock + ms, fn }),
    score: n => { scoreEl.textContent = n; },
    progress: p => { if (!v.time) bar.querySelector('i').style.transform = `scaleX(${A.clamp(p, 0, 1)})`; },
    flash: ok => { stage.classList.remove('flash-ok', 'flash-bad'); void stage.offsetWidth; stage.classList.add(ok ? 'flash-ok' : 'flash-bad'); },
    toast: msg => { const t = A.h(`<div class="g-toast">${msg}</div>`); stage.appendChild(t); setTimeout(() => t.remove(), 1100); },
    end: res => finish(res)
  };
  // Horloge de jeu : avance au rythme de l'écran (rAF) + un intervalle de secours
  // (mode économie d'énergie, saccades). Les deux appels sont idempotents.
  const tick = () => {
    if (ended) return;
    const t = performance.now();
    if (last == null) last = t;
    const dt = Math.min(t - last, 1000); last = t; // l’arrière-plan est géré par la pause auto
    if (!running || paused) return;
    clock += dt;
    if (tasks.length) {
      const due = tasks.filter(k => k.at <= clock);
      if (due.length) { tasks = tasks.filter(k => k.at > clock); due.forEach(k => { if (!ended) k.fn(); }); }
    }
    if (ended) return;
    if (v.time) {
      const rem = v.time - clock / 1000;
      timeEl.textContent = A.mmss(rem);
      bar.querySelector('i').style.transform = `scaleX(${A.clamp(rem / v.time, 0, 1)})`;
      const hot = rem <= 10; timeEl.classList.toggle('hot', hot); bar.classList.toggle('hot', hot);
      if (rem <= 0) finish(inst.finish());
    } else timeEl.textContent = A.mmss(clock / 1000);
  };
  const frame = () => { if (ended) return; tick(); requestAnimationFrame(frame); };
  const iv = setInterval(tick, 100);
  const pause = () => {
    if (paused || ended || !running) return;
    paused = true;
    const ov = A.h(`<div class="overlay"><div class="label">Marché suspendu</div><div class="hero-num">PAUSE</div>
      <button class="btn primary" style="max-width:280px" data-r>Reprendre</button>
      <button class="btn ghost" style="max-width:280px" data-x>Abandonner</button></div>`);
    root.appendChild(ov);
    ov.querySelector('[data-r]').addEventListener('click', () => { ov.remove(); last = null; paused = false; });
    ov.querySelector('[data-x]').addEventListener('click', quit);
  };
  const onVis = () => { if (document.hidden) pause(); };
  document.addEventListener('visibilitychange', onVis);
  const cleanup = () => { ended = true; clearInterval(iv); document.removeEventListener('visibilitychange', onVis); A.wake(false); };
  const quit = () => { cleanup(); opts.daily != null ? renderDesk() : openIntro(gid, { v: vid }); };
  root.querySelector('[data-q]').addEventListener('click', async () => {
    const wasPaused = paused; paused = true;
    if (await A.confirm('Abandonner la partie ?', 'Elle ne sera pas comptée dans ton indice.', 'Abandonner', 'Continuer')) quit();
    else { paused = wasPaused; last = null; }
  });
  root.querySelector('[data-p]').addEventListener('click', pause);

  function finish(res) {
    if (ended) return;
    cleanup();
    A.sfx('end');
    const before = A.market();
    const prevBest = A.best(gid, vid);
    const prev = A.sessionsOf(gid, vid).slice(-5).map(s => s.score);
    const perf = A.clamp(g.perf(res.score, vid, res), 0, 100);
    const s = A.record({ g: gid, v: vid, score: res.score, perf: A.round(perf, 1), dur: Math.round(clock / 1000), daily: opts.daily != null, x: res.x || null });
    if (res.level != null) A.db.levels[(inst && inst.levelKey) || gid] = res.level;
    if (opts.daily != null) { const d = daily(); d.done[opts.daily] = { sid: s.id, perf: s.perf, score: res.score }; }
    A.save();
    renderResult(g, v, res, s, { before, after: A.market(), prevBest, prev, opts });
  }

  // compte à rebours puis départ
  const ov = A.h('<div class="overlay"><div class="label">Ouverture dans</div><div class="count">3</div></div>');
  root.appendChild(ov);
  let n = 3;
  const countdown = () => {
    if (ended) return;
    n--;
    if (n > 0) { ov.querySelector('.count').outerHTML = `<div class="count">${n}</div>`; A.sfx('tick'); setTimeout(countdown, 650); }
    else { ov.remove(); inst = g.start(ctx); running = true; A.wake(true); }
  };
  setTimeout(countdown, 650);
  requestAnimationFrame(frame);
}

/* ---------- RÉSULTAT ---------- */
function renderResult(g, v, res, s, { before, after, prevBest, prev, opts }) {
  const isDaily = opts.daily != null;
  const d = isDaily ? daily() : null;
  const nx = d ? nextSlot(d) : -1;
  const rec = prevBest == null ? 'first' : res.score > prevBest ? 'rec' : null;
  const avg = A.avg(prev);
  const dv = avg == null ? null : avg > 0 ? (res.score - avg) / avg * 100 : null;
  const cat = g.cat, cb = before.cats[cat] * 10, ca = after.cats[cat] * 10;
  const ich = (after.idx - before.idx) / before.idx * 100;
  const el = page(`
    <div class="label" style="margin-top:10px">${isDaily ? `Épreuve ${opts.daily + 1}/6 · ` : ''}${g.code} · ${v.label}</div>
    <div class="h-title">${g.name}</div>
    <div style="display:flex;align-items:flex-end;gap:12px;flex-wrap:wrap;margin:6px 0 4px">
      <div class="res-score">${A.fmt(res.score, 0)}</div>
      <div class="dim" style="padding-bottom:10px">${g.unit}</div>
    </div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:16px">
      ${rec === 'rec' ? '<span class="badge">▲ NOUVEAU RECORD</span>' : rec === 'first' ? '<span class="badge">PREMIÈRE COTATION</span>' : ''}
      ${dv != null ? `<span class="pill ${dv >= 0 ? 'up' : 'down'} delta">${A.signed(dv, 1, ' %')} vs ta moyenne</span>` : avg != null ? `<span class="pill delta ${res.score >= avg ? 'up' : 'down'}">${A.signed(res.score - avg, 1)} vs moyenne</span>` : ''}
    </div>

    <div class="card">
      <div class="card-h"><span class="label">Performance</span><span class="mono" style="font-weight:700">${A.fmt(s.perf, 0)}<span class="muted">/100</span></span></div>
      <div class="gauge"><i style="width:${s.perf}%"></i></div>
      <div class="gauge-l"><span>DÉBUTANT</span><span>SOLIDE</span><span>DESK-READY</span></div>
    </div>

    <div class="card">
      <div class="label" style="margin-bottom:10px">Impact marché</div>
      <div class="imp-row"><span><b class="amber mono">ALPHA</b></span><span class="mono">${A.fmt(before.idx, 1)} → <b>${A.fmt(after.idx, 1)}</b></span><span class="mono ${ich >= 0 ? 'up' : 'down'}">${A.signed(ich, 2, '%')}</span></div>
      <div class="imp-row"><span><b class="amber mono">${A.CATS[cat].code}</b></span><span class="mono">${A.fmt(cb, 1)} → <b>${A.fmt(ca, 1)}</b></span><span class="mono ${ca >= cb ? 'up' : 'down'}">${A.signed((ca - cb) / cb * 100, 2, '%')}</span></div>
    </div>

    ${res.stats && res.stats.length ? `<div class="stats-grid two">${res.stats.map(([k, val]) => `<div class="stat"><div class="label">${k}</div><div class="v" style="font-size:17px">${val}</div></div>`).join('')}</div>` : ''}
    <div style="height:140px"></div>
  `, false);
  el.appendChild(A.h(`<div class="bottom-cta">
    ${isDaily
      ? (nx >= 0 ? `<button class="btn primary" data-a="next">Épreuve suivante · ${nx + 1}/6 ▸</button>` : `<button class="btn primary" data-a="close">Clôturer la séance ▸</button>`)
      : `<button class="btn primary" data-a="again">Rejouer ▸</button>`}
    <div class="btn-row" style="margin-top:8px"><button class="btn ghost small" data-a="home">${isDaily ? 'Pause · retour desk' : 'Modules'}</button></div>
  </div>`));
  mount(el, false);
  on(el, '[data-a]', b => {
    const a = b.dataset.a;
    if (a === 'next') openIntro(d.plan[nx].g, { daily: nx });
    if (a === 'close') renderClose();
    if (a === 'again') runGame(g.id, v.id, {});
    if (a === 'home') isDaily ? renderDesk() : (tab = 'mods', renderModules());
  });
}

/* ---------- CLÔTURE DE SÉANCE ---------- */
function renderClose() {
  const d = daily(), m = A.market(), today = m.days.find(x => x.day === A.dayKey());
  const items = d.plan.map((p, i) => ({ g: A.games[p.g], r: d.done[i] })).filter(x => x.r);
  const bestI = items.reduce((b, x) => !b || x.r.perf > b.r.perf ? x : b, null);
  const worstI = items.reduce((b, x) => !b || x.r.perf < b.r.perf ? x : b, null);
  const ch = today ? (today.c - today.o) / today.o * 100 : 0;
  const el = page(`
    <button class="back" data-back>${I.back} DESK</button>
    <div class="label" style="margin-top:8px">Clôture · ${A.shortDate(A.dayKey())}</div>
    <div class="h-title">Séance bouclée</div>
    <div class="h-sub">6 épreuves, ${today ? A.fmt(today.min, 0) : '—'} minutes de marché.</div>
    <div class="card">
      <div class="card-h"><span class="label">Indice Alpha · séance</span><span class="pill ${ch >= 0 ? 'up' : 'down'} delta">${A.signed(ch, 2, ' %')}</span></div>
      ${today ? `<div class="stats-grid" style="grid-template-columns:repeat(4,1fr);margin:0">
        ${[['OUV.', today.o], ['HAUT', today.h], ['BAS', today.l], ['CLÔT.', today.c]].map(([k, v]) => `<div class="stat"><div class="label">${k}</div><div class="v mono" style="font-size:15px">${A.fmt(v, 1)}</div></div>`).join('')}</div>` : ''}
    </div>
    <div class="card">
      <div class="label" style="margin-bottom:8px">Épreuves</div>
      ${A.chart.bars(items.map(x => ({ label: x.g.code, v: x.r.perf })), { max: 100, fmt: v => A.fmt(v, 0) })}
    </div>
    ${bestI ? `<div class="stats-grid two">
      <div class="stat"><div class="label">Meilleure</div><div class="v" style="font-size:16px">${bestI.g.name}</div><div class="s up">${A.fmt(bestI.r.perf, 0)}/100</div></div>
      <div class="stat"><div class="label">À travailler</div><div class="v" style="font-size:16px">${worstI.g.name}</div><div class="s down">${A.fmt(worstI.r.perf, 0)}/100</div></div>
    </div>` : ''}
    <button class="btn primary" data-tz>Bonus · brainteaser du jour ▸</button>
    <div style="height:10px"></div>
    <button class="btn ghost" data-back>Retour au desk</button>
  `, false);
  mount(el, false);
  on(el, '[data-back]', renderDesk);
  on(el, '[data-tz]', () => renderTeaser(d.teaser, renderDesk));
}

/* ---------- BRAINTEASERS ---------- */
function renderTeaser(id, back) {
  const t = A.TEASERS.find(x => x.id === id);
  const st = A.db.teasers[id] || { tries: 0 };
  let input = '', done = !!(st.ok || st.revealed);
  const el = A.h(`<div class="screen game"><div class="scroll" style="display:flex;flex-direction:column;padding-bottom:calc(var(--sb) + 12px)">
    <button class="back" data-back>${I.back} RETOUR</button>
    <div class="label amber" style="margin-top:8px">Brainteaser · ${t.id.slice(1)}/${A.TEASERS.length}</div>
    <div class="tz-q">${t.q}</div>
    <div class="tz-state"></div>
    <div class="ans mono tz-ans" style="align-self:center"></div>
    <div class="tz-kp" style="margin-top:auto"></div>
  </div></div>`);
  mount(el, false);
  const stEl = el.querySelector('.tz-state'), ansEl = el.querySelector('.tz-ans'), kpEl = el.querySelector('.tz-kp');
  const showDone = () => {
    const s = A.db.teasers[id] || {};
    stEl.innerHTML = `<div class="expl" style="margin:14px 0"><b class="${s.ok ? 'up' : 'amber'}">${s.ok ? '✓ Bien joué' : 'Réponse'} : ${A.fmt(t.a, 0)}</b><br>${t.e}</div>`;
    ansEl.style.display = 'none'; kpEl.innerHTML = '';
    kpEl.appendChild(A.h('<button class="btn ghost">Retour</button>'));
    kpEl.firstChild.addEventListener('click', back);
  };
  const save = patch => { A.db.teasers[id] = Object.assign({ tries: 0 }, A.db.teasers[id], patch, { day: A.dayKey() }); A.save(); };
  if (done) showDone();
  else {
    stEl.innerHTML = `<div class="hint" style="margin:14px 0">${st.tries ? st.tries + ' essai(s) · ' : ''}PAS DE CHRONO, PRENDS TON TEMPS</div>`;
    kpEl.appendChild(A.keypad({
      left: 'C', actions: [{ label: 'RÉVÉLER', key: 'rev' }, { label: 'VALIDER', key: 'ok', primary: true }],
      onKey: k => {
        if (k === 'rev') { A.confirm('Révéler la réponse ?', 'Le brainteaser sera marqué comme non résolu.', 'Révéler').then(y => { if (y) { save({ revealed: true }); showDone(); } }); return; }
        if (k === 'ok') {
          if (!input) return;
          const ok = (t.accept || [t.a]).includes(+input);
          const cur = A.db.teasers[id] || { tries: 0 };
          save({ tries: (cur.tries || 0) + 1, ok: ok || undefined });
          if (ok) { A.sfx('win'); showDone(); }
          else { A.sfx('bad'); ansEl.classList.add('reveal'); setTimeout(() => ansEl.classList.remove('reveal'), 500); stEl.innerHTML = `<div class="hint down" style="margin:14px 0">✗ PAS ÇA · ESSAI ${cur.tries + 1}</div>`; input = ''; ansEl.textContent = ''; }
          return;
        }
        if (k === '⌫') input = input.slice(0, -1); else if (k === 'C') input = ''; else if (input.length < 9) input += k;
        ansEl.textContent = input;
      }
    }));
  }
  on(el, '[data-back]', back);
}
function renderTeaserList() {
  const el = page(`
    <button class="back" data-back>${I.back} MODULES</button>
    <div class="h-title">Brainteasers</div>
    <div class="h-sub">${Object.values(A.db.teasers).filter(t => t.ok).length} résolus sur ${A.TEASERS.length}. Les classiques des entretiens, sans chrono.</div>
    <div class="card" style="padding:4px 14px">
      ${A.TEASERS.map(t => { const s = A.db.teasers[t.id]; return `<button class="row tz-row" data-t="${t.id}" style="width:100%;text-align:left;gap:12px">
        <span class="mono muted" style="font-size:11px">${t.id.slice(1)}</span><span style="flex:1;font-size:14px;line-height:1.35">${t.q}</span>
        <span class="mono ${s && s.ok ? 'up' : s && s.revealed ? 'down' : 'muted'}" style="font-size:12px">${s && s.ok ? '✓' : s && s.revealed ? '✗' : '›'}</span></button>`; }).join('')}
    </div>`, true);
  mount(el, true);
  on(el, '[data-back]', () => { tab = 'mods'; renderModules(); });
  on(el, '[data-t]', b => renderTeaser(b.dataset.t, renderTeaserList));
}

/* ---------- STATS ---------- */
let range = 30;
function renderStats() {
  const m = A.market(), ss = A.db.sessions;
  if (!ss.length) {
    const el = page(`<div class="label" style="margin-top:6px">Analyse</div><div class="h-title">Performance</div>
      <div class="card empty"><b>Aucune cotation pour l’instant</b>Lance ta première séance : ton indice, ton profil, tes records et ta régularité apparaîtront ici.</div>
      <button class="btn primary" data-go>Ouvrir la séance du jour ▸</button>`);
    mount(el, true);
    on(el, '[data-go]', () => { tab = 'desk'; renderDesk(); });
    return;
  }
  const days = range ? m.days.filter(d => d.day > A.addDays(A.dayKey(), -range)) : m.days;
  const startV = range ? A.catAt(m, null, range) : A.IPO * 10;
  const chg = (m.idx - startV) / startV * 100;
  // rendements journaliers → Sharpe & drawdown
  const rets = m.days.slice(-30).map(d => (d.c - d.o) / d.o);
  const sd = rets.length > 1 ? Math.sqrt(A.avg(rets.map(r => (r - A.avg(rets)) ** 2))) : 0;
  const sharpe = rets.length >= 5 && sd > 0 ? A.avg(rets) / sd : null;
  let peak = -Infinity, mdd = 0;
  m.days.forEach(d => { peak = Math.max(peak, d.c); mdd = Math.min(mdd, (d.c - peak) / peak); });
  const minutes = {}; m.days.forEach(d => minutes[d.day] = d.min);
  const totalMin = ss.reduce((s, x) => s + (x.dur || 0), 0) / 60;
  const fullDays = Object.values(A.db.daily).filter(d => Object.keys(d.done).length === 6).length;
  const cmp = A.CAT_ORDER.map(c => A.catAt(m, c, 30));
  // latence calcul (5 dernières parties ZMAC standard)
  const zm = ss.filter(s => s.g === 'calc' && s.v === '120' && s.x && s.x.lat).slice(-5);
  const lat = [0, 1, 2, 3].map(i => A.avg(zm.map(s => s.x.lat[i]).filter(x => x != null)));
  const sw = ss.filter(s => s.g === 'switch' && s.x && s.x.cost != null).slice(-5);
  const arbRt = ss.filter(s => s.g === 'arb' && s.x && s.x.rt).slice(-5);
  const nbMax = Math.max(0, ...ss.filter(s => s.g === 'nback' && s.x).map(s => Math.max(...s.x.blocks.map(b => b.n))));
  const spG = A.best('span', 'spatial'), spD = A.best('span', 'digits');

  const el = page(`
    <div class="label" style="margin-top:6px">Analyse</div>
    <div class="top" style="margin-bottom:10px"><div class="h-title">Performance</div>
      <div class="seg mini">${[[7, '7J'], [30, '30J'], [0, 'TOUT']].map(([r, l]) => `<button data-r="${r}" class="${r === range ? 'on' : ''}">${l}</button>`).join('')}</div></div>

    <div class="card">
      <div class="card-h"><span class="label">Indice Alpha · clôtures</span><span class="pill ${chg >= 0 ? 'up' : 'down'} delta">${A.signed(chg, 2, ' %')}</span></div>
      <div class="hero-num" style="font-size:34px">${A.fmt(m.idx, 2)}</div>
      <div class="c-line" style="margin-top:10px"></div>
    </div>

    <div class="card">
      <div class="card-h"><span class="label">Séances · bougies journalières</span><span class="label">O/H/B/C</span></div>
      <div class="c-candles"></div>
      <div class="dim" style="font-size:12px;margin-top:6px">Ouverture = clôture de la veille. Chaque partie fait bouger l’indice dans la journée.</div>
    </div>

    <div class="card">
      <div class="card-h"><span class="label">Profil cognitif</span><span class="label">cotes /100</span></div>
      <div class="c-radar"></div>
      <div class="legend"><span><i style="background:${A.chart.COLORS.amber}"></i>Aujourd’hui</span><span><i style="background:${A.chart.COLORS.muted}"></i>Il y a 30 jours</span></div>
    </div>

    <div class="stats-grid">
      <div class="stat"><div class="label">Série</div><div class="v">${A.streak()} j</div><div class="s muted">record ${A.bestStreak()} j</div></div>
      <div class="stat"><div class="label">Séances</div><div class="v">${fullDays}</div><div class="s muted">complètes</div></div>
      <div class="stat"><div class="label">Temps</div><div class="v">${totalMin >= 60 ? A.fmt(totalMin / 60, 1) + ' h' : A.fmt(totalMin, 0) + ' min'}</div><div class="s muted">${ss.length} parties</div></div>
      <div class="stat"><div class="label">Sharpe 30j</div><div class="v">${sharpe != null ? A.fmt(sharpe, 2) : '—'}</div><div class="s muted">progrès ÷ volatilité</div></div>
      <div class="stat"><div class="label">Max DD</div><div class="v ${mdd < 0 ? 'down' : ''}">${A.fmt(mdd * 100, 1)} %</div><div class="s muted">pire repli</div></div>
      <div class="stat"><div class="label">N-back</div><div class="v">${nbMax || '—'}</div><div class="s muted">N max atteint</div></div>
    </div>

    <div class="card">
      <div class="card-h"><span class="label">Vitesse de calcul · latence / opération</span><span class="label">5 dern. ZMAC</span></div>
      ${zm.length ? A.chart.bars(['+', '−', '×', '÷'].map((o, i) => ({ label: o, v: lat[i] })), { fmt: v => A.fmt(v, 2) + ' s' }) : '<div class="muted" style="font-size:13px">Joue un Sprint Calcul 2 min pour mesurer tes latences.</div>'}
    </div>

    <div class="stats-grid">
      <div class="stat"><div class="label">Coût switch</div><div class="v">${sw.length ? A.fmt(A.avg(sw.map(s => s.x.cost)), 0) : '—'}</div><div class="s muted">ms · moy. 5</div></div>
      <div class="stat"><div class="label">Réaction ARB</div><div class="v">${arbRt.length ? A.fmt(A.avg(arbRt.map(s => s.x.rt)), 2) : '—'}</div><div class="s muted">s · moy. 5</div></div>
      <div class="stat"><div class="label">Span</div><div class="v">${spG || '—'} / ${spD || '—'}</div><div class="s muted">grille / chiffres</div></div>
    </div>

    <div class="card">
      <div class="card-h"><span class="label">Cotes par catégorie</span><span class="label">var. 7 j</span></div>
      <table class="tbl"><thead><tr><th>Actif</th><th>Tendance</th><th>Cote</th><th>7 j</th></tr></thead><tbody>
      ${A.CAT_ORDER.map(c => {
        const series = [A.IPO].concat(m.days.slice(-20).map(x => x.cats[c]));
        const v = m.cats[c] * 10, p7 = A.catAt(m, c, 7) * 10, ch = (v - p7) / p7 * 100;
        return `<tr><td><b>${A.CATS[c].code}</b><span class="nm">${A.CATS[c].name}</span></td><td>${A.chart.spark(series, { w: 60, h: 20 })}</td><td>${A.fmt(v, 1)}</td><td class="${A.dcls(ch)}">${A.signed(ch, 1, '%')}</td></tr>`;
      }).join('')}</tbody></table>
    </div>

    <div class="card">
      <div class="card-h"><span class="label">Régularité · minutes / jour</span><span class="label">17 sem.</span></div>
      <div class="c-heat"></div>
      <div class="heat-l">moins ${A.chart.HEAT.map(c => `<i style="background:${c}"></i>`).join('')} plus</div>
    </div>

    <div class="card">
      <div class="label" style="margin-bottom:6px">Records</div>
      <table class="tbl"><thead><tr><th>Jeu</th><th>Record</th><th>Moy. 5</th><th>Parties</th></tr></thead><tbody>
      ${A.GAME_ORDER.map(id => {
        const g = A.games[id], l = A.sessionsOf(id, g.def);
        return `<tr><td><b>${g.code}</b><span class="nm">${A.variant(g, g.def).label}</span></td><td>${l.length ? A.best(id, g.def) : '—'}</td><td>${l.length ? A.fmt(A.avg(l.slice(-5).map(s => s.score)), 1) : '—'}</td><td>${A.sessionsOf(id).length}</td></tr>`;
      }).join('')}</tbody></table>
    </div>
  `);
  mount(el, true);
  const lineDays = [{ day: null, c: startV }].concat(days);
  A.chart.line(el.querySelector('.c-line'), lineDays.map((d, i) => ({ y: d.c, label: d.day ? A.shortDate(d.day) : (range ? `J−${range}` : 'IPO') })), { h: 170 });
  A.chart.candles(el.querySelector('.c-candles'), days.slice(-40));
  A.chart.radar(el.querySelector('.c-radar'), A.CAT_ORDER.map(c => A.CATS[c].code), A.CAT_ORDER.map(c => m.cats[c]), cmp);
  A.chart.heat(el.querySelector('.c-heat'), minutes);
  on(el, '[data-r]', b => { range = +b.dataset.r; renderStats(); });
}

/* ---------- RÉGLAGES ---------- */
function renderSettings() {
  const el = page(`
    <button class="back" data-back>${I.back} DESK</button>
    <div class="h-title" style="margin-top:6px">Réglages</div>
    <div class="card" style="padding:4px 14px">
      <div class="row"><span>Sons</span><button class="switch ${A.db.settings.sound ? 'on' : ''}" data-snd></button></div>
    </div>
    <div class="label" style="margin:18px 0 8px">Sauvegarde</div>
    <div class="card">
      <div class="dim" style="font-size:13px;line-height:1.45;margin-bottom:10px">Tes données restent sur ton iPhone. Copie une sauvegarde de temps en temps (dans Notes par exemple).</div>
      <button class="btn ghost small" data-exp>Copier la sauvegarde</button>
      <div style="height:10px"></div>
      <textarea placeholder="Colle ici une sauvegarde pour la restaurer"></textarea>
      <div style="height:8px"></div>
      <button class="btn ghost small" data-imp>Restaurer</button>
    </div>
    <div class="label" style="margin:18px 0 8px">Installation</div>
    <div class="card dim" style="font-size:13px;line-height:1.5">Dans Safari : bouton Partager → « Sur l’écran d’accueil ». L’app s’ouvre alors en plein écran et fonctionne hors connexion.</div>
    <button class="btn ghost small" data-reset style="color:var(--down)">Tout réinitialiser</button>
    <div class="hint" style="margin:18px 0">ALPHA · ${A.db.sessions.length} PARTIES ENREGISTRÉES</div>
  `, false);
  mount(el, false);
  on(el, '[data-back]', () => { tab = 'desk'; renderDesk(); });
  on(el, '[data-snd]', b => { A.db.settings.sound = !A.db.settings.sound; A.save(); b.classList.toggle('on', A.db.settings.sound); A.sfx('ok'); });
  on(el, '[data-exp]', async () => {
    const json = JSON.stringify(A.db);
    try { await navigator.clipboard.writeText(json); A.toast('Sauvegarde copiée ✓'); }
    catch (e) { el.querySelector('textarea').value = json; A.toast('Copie manuelle : sélectionne le texte'); }
  });
  on(el, '[data-imp]', async () => {
    const v = el.querySelector('textarea').value.trim();
    if (!v) return;
    if (!await A.confirm('Restaurer cette sauvegarde ?', 'Tes données actuelles seront remplacées.', 'Restaurer')) return;
    try { A.importDb(v); A.toast('Sauvegarde restaurée ✓'); tab = 'desk'; renderDesk(); } catch (e) { A.toast('Sauvegarde invalide'); }
  });
  on(el, '[data-reset]', async () => {
    if (await A.confirm('Tout réinitialiser ?', 'Historique, records, niveaux et séances seront effacés. Irréversible.', 'Effacer')) { A.resetDb(); tab = 'desk'; renderDesk(); }
  });
}

/* ---------- démarrage ---------- */
let lastDay = A.dayKey();
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && A.dayKey() !== lastDay) { lastDay = A.dayKey(); if (!document.querySelector('.game')) go(); }
});
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
A.ui = { renderDesk, renderModules, renderStats, openIntro, runGame, renderResult, renderClose, renderTeaser, renderSettings };
renderDesk();
})();
