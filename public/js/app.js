'use strict';
/* ALPHA — écrans : desk, séance du jour, modules, intro, partie, résultats, stats, réglages. */
(function () {
const app = document.getElementById('app');
const I = {
  desk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-5 4 3 8-8"/><path d="M15 7h5v5"/></svg>',
  mods: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/></svg>',
  rank: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4z"/><path d="M17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 10-2.3 5.7M20 4v7h-7"/></svg>',
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
      <button class="tab ${tab === 'rank' ? 'on' : ''}" data-t="rank">${I.rank}AMIS${A.social.pending().length ? '<i class="tab-dot"></i>' : ''}</button>
      <button class="tab ${tab === 'stats' ? 'on' : ''}" data-t="stats">${I.stats}STATS</button>
    </nav>`);
    nav.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => { tab = b.dataset.t; go(); }));
    app.appendChild(nav);
  }
}
const page = (html, withTabs = true) => A.h(`<div class="screen"><div class="scroll${withTabs ? ' with-tabs' : ''}">${html}</div></div>`);
const on = (root, sel, fn) => root.querySelectorAll(sel).forEach(el => el.addEventListener('click', e => fn(el, e)));
function go() { ({ desk: renderDesk, mods: renderModules, rank: renderSocial, stats: renderStats })[tab](); }

/* ---------- séance du jour ---------- */
function planFor(day) {
  const rnd = A.seeded(A.hash('alpha' + day));
  const pick = arr => arr[Math.floor(rnd() * arr.length)];
  return [
    { g: 'calc', v: '120', slot: 'OUVERTURE' },
    Object.assign(pick([{ g: 'arb', v: '60' }, { g: 'switch', v: '60' }, { g: 'stroop', v: '60' }]), { slot: 'RÉFLEXES' }),
    Object.assign(pick([{ g: 'seq', v: '180' }, { g: 'riddle', v: '240' }, { g: 'code', v: '180' }]), { slot: 'LOGIQUE' }),
    { g: 'exit', v: '300', slot: 'STRATÉGIE' },
    Object.assign(pick([{ g: 'nback', v: '3' }, { g: 'span', v: 'spatial' }, { g: 'span', v: 'digits' }, { g: 'book', v: '180' }]), { slot: 'MÉMOIRE' }),
    Object.assign(pick([{ g: 'proba', v: '180' }, { g: 'g24', v: '180' }, { g: 'optiver', v: '40' }, { g: 'fair', v: '180' }, { g: 'pnl', v: '180' }]), { slot: 'CLÔTURE' })
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
      <div class="logo"><b>ALPH<i>A</i></b><span>${A.DAYS[now.getDay()]} ${now.getDate()} ${A.MONTHS[now.getMonth()]}</span><button class="chip ver" data-go="settings">v${A.VERSION}</button></div>
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

    ${A.social.pending().length ? `<button class="card ch-alert" data-go="rank" style="width:100%;text-align:left"><span class="label amber">⚔ Défis en attente</span><div style="font-weight:700;font-size:17px;margin-top:4px">${A.social.pending().length} défi${A.social.pending().length > 1 ? 's' : ''} à relever</div></button>` : ''}
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
    if (g === 'rank') { tab = 'rank'; renderSocial(); }
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
  const isDaily = opts.daily != null, ch = opts.challenge;
  let vid = ch ? ch.v : isDaily ? daily().plan[opts.daily].v : (opts.v || g.def);
  const draw = () => {
    const v = A.variant(g, vid), ss = A.sessionsOf(gid, vid);
    const best = A.best(gid, vid), last5 = ss.slice(-5).map(s => s.score);
    const el = page(`
      <button class="back" data-back>${I.back} ${isDaily ? 'DESK' : 'MODULES'}</button>
      <div class="intro-code">${ch ? `⚔ DÉFI · ${ch.players.length} JOUEURS · MÊMES QUESTIONS` : isDaily ? `ÉPREUVE ${opts.daily + 1}/6 · ${daily().plan[opts.daily].slot}` : `${A.CATS[g.cat].code} · ${g.code}`}</div>
      <div class="h-title">${g.name}</div>
      <div class="h-sub">${g.desc}</div>
      ${!isDaily && !ch && g.variants.length > 1 ? `<div class="seg" style="margin-bottom:12px">${g.variants.map(x => `<button data-v="${x.id}" class="${x.id === vid ? 'on' : ''}">${x.label}</button>`).join('')}</div>` : ''}
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
    on(el, '[data-back]', () => ch ? (tab = 'rank', renderSocial(false)) : isDaily ? renderDesk() : (tab = 'mods', renderModules()));
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
  let realRandom = null; // défi : Math.random remplacé par un générateur à graine commune
  const cleanup = () => { if (realRandom) { Math.random = realRandom; realRandom = null; } ended = true; clearInterval(iv); document.removeEventListener('visibilitychange', onVis); A.wake(false); };
  const quit = () => { cleanup(); opts.challenge ? (tab = 'rank', renderSocial(false)) : opts.daily != null ? renderDesk() : openIntro(gid, { v: vid }); };
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
    if (opts.challenge) A.social.submitResult(opts.challenge.id, res.score, s.perf);
    A.social.sync(); // envoi différé du résumé aux amis
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
    else {
      ov.remove();
      if (opts.challenge) { realRandom = Math.random; Math.random = A.seeded(opts.challenge.seed); }
      inst = g.start(ctx); running = true; A.wake(true);
    }
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
      : opts.challenge ? `<button class="btn primary" data-a="ch">Voir le défi ▸</button>` : `<button class="btn primary" data-a="again">Rejouer ▸</button>`}
    <div class="btn-row" style="margin-top:8px"><button class="btn ghost small" data-a="home">${isDaily ? 'Pause · retour desk' : 'Modules'}</button></div>
  </div>`));
  mount(el, false);
  on(el, '[data-a]', b => {
    const a = b.dataset.a;
    if (a === 'next') openIntro(d.plan[nx].g, { daily: nx });
    if (a === 'close') renderClose();
    if (a === 'again') runGame(g.id, v.id, {});
    if (a === 'ch') { tab = 'rank'; renderSocial(); }
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
  const stp = ss.filter(s => s.g === 'stroop' && s.x && s.x.cost != null).slice(-5);
  const bookMax = Math.max(0, ...ss.filter(s => s.g === 'book' && s.x).map(s => s.x.best || 0));
  const cbS = ss.filter(s => s.g === 'code' && s.x && s.x.att && s.x.att.length).slice(-10);
  const cbAvg = cbS.length ? A.avg(cbS.flatMap(s => s.x.att)) : null;

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
      <div class="stat"><div class="label">Interférence</div><div class="v">${stp.length ? A.fmt(A.avg(stp.map(s => s.x.cost)), 0) : '—'}</div><div class="s muted">ms · Stroop moy. 5</div></div>
      <div class="stat"><div class="label">Carnet max</div><div class="v">${bookMax || '—'}</div><div class="s muted">lignes restituées</div></div>
      <div class="stat"><div class="label">Code Breaker</div><div class="v">${cbAvg != null ? A.fmt(cbAvg, 1) : '—'}</div><div class="s muted">essais / code</div></div>
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

/* ---------- AMIS ---------- */
const onSocial = () => !!app.querySelector('[data-screen=social]');
function renderJoin() {
  const S = A.social, invalid = S.state().invalid;
  const el = page(`<div data-screen="social"></div>
    <div class="label" style="margin-top:6px">Classement</div>
    <div class="h-title">Entre amis</div>
    <div class="h-sub">Crée ton profil et ajoute tes potes : duel sur la séance du jour (vous avez tous les mêmes épreuves), indice Alpha, records par jeu.</div>
    ${invalid ? '<div class="card expl">Ton ancien profil n’existe plus sur le serveur. Crée-en un nouveau : tes scores sur ce téléphone sont intacts.</div>' : ''}
    <div class="card">
      <div class="label" style="margin-bottom:8px">Ton pseudo</div>
      <input class="inp" maxlength="16" placeholder="ex. Sacha" autocomplete="off" autocorrect="off" spellcheck="false" value="${A.esc(S.state().name || '')}">
      <div style="height:12px"></div>
      <button class="btn primary" data-join>Créer mon profil ▸</button>
    </div>
    <button class="btn ghost small" data-restore style="margin-bottom:12px">J’ai déjà un profil : restaurer mes données</button>
    <div class="card dim" style="font-size:13px;line-height:1.5">Ce que tes amis verront : ton pseudo, ton indice, tes cotes, tes records et ta séance du jour. Tout le reste reste sur ton téléphone.</div>
  `);
  mount(el, true);
  const inp = el.querySelector('.inp'), btn = el.querySelector('[data-join]');
  on(el, '[data-restore]', async () => {
    const code = await A.prompt('Restaurer mon profil', 'Ton code ami (5 caractères).', '', 'Suivant', 12);
    if (!code) return;
    const key = await A.prompt('Clé de récupération', 'La clé notée depuis Réglages → Sauvegarde cloud (ex. ABCD-EFGH-JKLM).', '', 'Restaurer', 20);
    if (!key) return;
    if (A.db.sessions.length && !await A.confirm('Remplacer les données de ce téléphone ?', 'Elles seront remplacées par ta sauvegarde cloud.', 'Remplacer')) return;
    try { const j = await S.restore(code, key); A.toast(j.data ? 'Données restaurées ✓' : 'Profil restauré (aucune sauvegarde)'); tab = 'desk'; renderDesk(); }
    catch (e) { A.toast(S.msg(e)); }
  });
  btn.addEventListener('click', async () => {
    const name = inp.value.trim();
    if (name.length < 2) return A.toast(S.ERR.name);
    btn.disabled = true; btn.textContent = 'Création…';
    try {
      if (invalid) delete A.db.social;
      await S.register(name);
      renderSocial();
      S.recoveryKey().then(keyModal).catch(() => {});
    } catch (e) { A.toast(S.msg(e)); btn.disabled = false; btn.textContent = 'Créer mon profil ▸'; }
  });
}

function renderSocial(fetchNow = true) {
  const S = A.social;
  if (!S.enabled()) return renderJoin();
  const me = S.state(), b = me.board, mine = S.summary(), today = A.dayKey();
  const players = [{ id: me.id, name: me.name, code: me.code, summary: mine, updated: Date.now(), me: true }].concat(b ? b.friends : []);
  const friends = b ? b.friends : [];
  const nm = p => `<span class="rk-name">${A.esc(p.name)}${p.me ? ' <span class="muted">· toi</span>' : ''}</span>`;

  // Duel du jour : on aligne les épreuves par jeu/durée (même tirage pour tout le monde)
  const keys = daily().plan.map(p => p.g + '/' + p.v);
  const perfOf = (p, i) => {
    const t = p.summary && p.summary.today;
    if (!t || t.day !== today) return null;
    const j = t.plan.indexOf(keys[i]);
    return j >= 0 && t.done[j] != null ? t.done[j] : null;
  };
  const duel = players.map(p => { const v = keys.map((_, i) => perfOf(p, i)); return { p, v, n: v.filter(x => x != null).length, sum: v.reduce((s, x) => s + (x || 0), 0) }; })
    .filter(r => r.n > 0 || r.p.me).sort((x, y) => y.sum - x.sum);
  const colBest = keys.map((_, i) => Math.max(-1, ...duel.map(r => r.v[i] == null ? -1 : r.v[i])));
  const ranked = players.filter(p => p.summary).sort((x, y) => y.summary.idx - x.summary.idx);
  const catBest = A.CAT_ORDER.map(c => Math.max(...ranked.map(p => p.summary.cats[c] || 0)));
  const recs = A.GAME_ORDER.map(id => {
    const h = players.filter(p => p.summary && p.summary.recs && p.summary.recs[id] != null);
    if (!h.length) return null;
    return { id, top: h.reduce((x, y) => y.summary.recs[id] > x.summary.recs[id] ? y : x), mine: mine.recs[id] };
  }).filter(Boolean);

  const el = page(`<div data-screen="social"></div>
    <div class="label" style="margin-top:6px">Classement</div>
    <div class="top" style="margin-bottom:12px"><div class="h-title">Entre amis</div>
      <button class="icon-btn" data-refresh>${I.refresh}</button></div>

    <div class="card">
      <div class="card-h"><span class="label">Ton code ami</span><button class="chip" data-rename>${A.esc(me.name)} ✎</button></div>
      <div class="code-big mono">${me.code}</div>
      <div class="btn-row" style="margin-top:12px"><button class="btn ghost small" data-share>Partager mon code</button></div>
    </div>

    <div class="card">
      <div class="label" style="margin-bottom:8px">Ajouter un ami</div>
      <div class="btn-row"><input class="inp" data-code maxlength="12" placeholder="CODE AMI" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" style="text-transform:uppercase">
        <button class="btn primary small" data-add style="width:auto;padding:0 18px;height:48px">Ajouter</button></div>
    </div>

    ${friends.length ? challengesHtml(me) : ''}
    ${!friends.length ? `<div class="card empty"><b>Pas encore d’amis</b>Partage ton code à tes potes, ou entre le leur au-dessus. Le classement apparaîtra ici.</div>` : `
    <div class="section"><span class="label">Duel · séance du jour</span><span class="label">perf /100</span></div>
    <div class="card" style="padding:6px 12px;overflow-x:auto">
      <table class="tbl duel"><thead><tr><th>Joueur</th>${keys.map(k => `<th>${A.games[k.split('/')[0]].code.slice(0, 4)}</th>`).join('')}<th>Σ</th></tr></thead><tbody>
      ${duel.map((r, ri) => `<tr class="${r.p.me ? 'me' : ''}"><td><span class="rk-n">${ri + 1}</span>${nm(r.p)}</td>
        ${r.v.map((x, i) => `<td class="${x != null && x === colBest[i] && duel.length > 1 ? 'amber' : x == null ? 'muted' : ''}">${x == null ? '·' : x}</td>`).join('')}
        <td><strong>${Math.round(r.sum)}</strong></td></tr>`).join('')}
      </tbody></table>
      ${duel.length < 2 ? '<div class="muted" style="font-size:12px;padding:6px 0 4px">Aucun ami n’a encore joué la séance aujourd’hui.</div>' : ''}
    </div>

    <div class="section"><span class="label">Indice Alpha</span><span class="label">var. 7 j</span></div>
    <div class="card" style="padding:4px 14px">
      ${ranked.map((p, i) => {
        const ch = p.summary.idx7 ? (p.summary.idx - p.summary.idx7) / p.summary.idx7 * 100 : 0;
        return `<div class="rk-row ${p.me ? 'me' : ''}"><span class="rk-n">${i + 1}</span>
          <span class="rk-main">${nm(p)}<span class="rk-sub">▲ ${p.summary.streak || 0} j · ${p.summary.games || 0} parties${p.me ? '' : ' · ' + A.ago(p.updated)}</span></span>
          ${A.chart.spark(p.summary.spark || [], { w: 54, h: 20 })}
          <span class="rk-v">${A.fmt(p.summary.idx, 1)}<span class="${A.dcls(ch)}">${A.signed(ch, 1, '%')}</span></span></div>`;
      }).join('')}
    </div>

    <div class="section"><span class="label">Cotes par catégorie</span><span class="label">meilleure en ambre</span></div>
    <div class="card" style="padding:6px 12px;overflow-x:auto">
      <table class="tbl duel"><thead><tr><th>Joueur</th>${A.CAT_ORDER.map(c => `<th>${A.CATS[c].code}</th>`).join('')}</tr></thead><tbody>
      ${ranked.map(p => `<tr class="${p.me ? 'me' : ''}"><td>${nm(p)}</td>${A.CAT_ORDER.map((c, i) => `<td class="${ranked.length > 1 && p.summary.cats[c] === catBest[i] ? 'amber' : ''}">${A.fmt(p.summary.cats[c] || 0, 0)}</td>`).join('')}</tr>`).join('')}
      </tbody></table>
    </div>

    <div class="section"><span class="label">Records</span><span class="label">format standard</span></div>
    <div class="card" style="padding:6px 12px">
      <table class="tbl"><thead><tr><th>Jeu</th><th>Leader</th><th>Record</th><th>Toi</th></tr></thead><tbody>
      ${recs.map(r => { const g = A.games[r.id]; return `<tr><td><b>${g.code}</b></td><td class="rk-lead">${A.esc(r.top.name)}${r.top.me ? ' 👑' : ''}</td><td>${r.top.summary.recs[r.id]}</td><td class="${r.mine == null ? 'muted' : r.mine >= r.top.summary.recs[r.id] ? 'up' : ''}">${r.mine == null ? '—' : r.mine}</td></tr>`; }).join('')}
      </tbody></table>
    </div>

    <div class="section"><span class="label">Mes amis · ${friends.length}</span></div>
    <div class="card" style="padding:4px 14px">
      ${friends.map(f => `<div class="row"><span><span style="font-weight:600">${A.esc(f.name)}</span> <span class="mono muted" style="font-size:12px">${f.code}</span><div class="muted" style="font-size:12px">actif ${A.ago(f.updated)}${f.summary && f.summary.v ? ' · v' + A.esc(f.summary.v) : ''}</div></span>
        <button class="icon-btn" data-unfriend="${f.id}" data-name="${A.esc(f.name)}">${I.close}</button></div>`).join('')}
    </div>`}

    <div class="hint" style="margin:18px 0 8px">${me.boardAt ? 'CLASSEMENT MIS À JOUR ' + A.ago(me.boardAt).toUpperCase() : 'CHARGEMENT…'}</div>
    <button class="btn ghost small" data-delete style="color:var(--down);margin-bottom:8px">Supprimer mon profil en ligne</button>
  `);
  mount(el, true);

  on(el, '[data-refresh]', () => renderSocial(true));
  on(el, '[data-newch]', () => renderNewChallenge());
  on(el, '[data-play]', b => { const c = S.challenges().find(x => x.id === b.dataset.play); if (c) openIntro(c.game, { challenge: c }); });
  on(el, '[data-share]', async () => {
    const text = S.shareText();
    try { if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(text); A.toast('Message copié ✓'); } }
    catch (e) { /* partage annulé */ }
  });
  on(el, '[data-rename]', async () => {
    const n = await A.prompt('Changer de pseudo', 'Visible par tes amis (2 à 16 caractères).', me.name);
    if (n == null) return;
    if (n.length < 2) return A.toast(S.ERR.name);
    await S.rename(n); renderSocial(false);
  });
  const add = async () => {
    const inp = el.querySelector('[data-code]'), code = inp.value.trim();
    if (!code) return;
    try { const j = await S.addFriend(code); A.toast(`✓ ${j.friend.name} ajouté`); renderSocial(false); }
    catch (e) { A.toast(S.msg(e)); }
  };
  on(el, '[data-add]', add);
  el.querySelector('[data-code]').addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
  on(el, '[data-unfriend]', async b => {
    if (!await A.confirm(`Retirer ${b.dataset.name} ?`, 'Vous disparaîtrez de vos classements respectifs.', 'Retirer')) return;
    try { await S.removeFriend(b.dataset.unfriend); renderSocial(false); } catch (e) { A.toast(S.msg(e)); }
  });
  on(el, '[data-delete]', async () => {
    if (!await A.confirm('Supprimer ton profil en ligne ?', 'Ton pseudo, ton code et tes amis seront effacés du serveur. Tes scores restent sur ton téléphone.', 'Supprimer')) return;
    try { await S.deleteProfile(); A.toast('Profil supprimé'); renderSocial(); } catch (e) { A.toast(S.msg(e)); }
  });

  if (fetchNow) {
    S.sync(true).then(() => S.board())
      .then(() => { if (onSocial()) renderSocial(false); })
      .catch(e => { if (onSocial()) { if (e.code === 'auth') { S.state().invalid = true; A.save(); renderSocial(false); } else A.toast(S.msg(e)); } });
  }
}


/* ---------- DÉFIS ---------- */
function keyModal(k) {
  const m = A.h(`<div class="modal"><div class="modal-card">
    <div class="label amber">Sauvegarde cloud</div>
    <div class="modal-title" style="margin-top:4px">Ta clé de récupération</div>
    <div class="code-big mono" style="font-size:24px;letter-spacing:.12em;margin:8px 0">${A.social.fmtKey(k)}</div>
    <div class="modal-msg">Avec ton code ami <b class="mono">${A.social.state().code}</b>, elle permet de tout récupérer sur un nouveau téléphone. Note-la (dans Notes par ex.). Elle reste visible dans Réglages.</div>
    <div class="modal-btns"><button class="btn ghost" data-c>Copier</button><button class="btn primary" data-ok>C’est noté</button></div></div></div>`);
  m.querySelector('[data-c]').addEventListener('click', () => navigator.clipboard.writeText(`Alpha · code ami ${A.social.state().code} · clé ${A.social.fmtKey(k)}`).then(() => A.toast('Copié ✓'), () => {}));
  m.querySelector('[data-ok]').addEventListener('click', () => m.remove());
  document.body.appendChild(m);
}

function challengesHtml(me) {
  const S = A.social, chs = S.challenges().slice(0, 8), played = me.played || {};
  return `<div class="section"><span class="label">Défis · mêmes questions</span><span class="label">7 jours</span></div>
    <button class="btn primary" data-newch style="margin-bottom:10px">⚔ Lancer un défi</button>
    ${chs.map(c => {
      const g = A.games[c.game], v = A.variant(g, c.v);
      const mine = c.results[me.id] || played[c.id];
      const rows = c.players.map(pid => ({ name: c.names[pid], me: pid === me.id, r: pid === me.id ? mine : c.results[pid] }))
        .sort((x, y) => (y.r ? y.r.score : -1e9) - (x.r ? x.r.score : -1e9));
      const done = rows.every(x => x.r);
      return `<div class="card ch-card ${!mine && c.open ? 'todo' : ''}">
        <div class="card-h"><span><b class="amber mono">${g.code}</b> <span style="font-weight:600">${g.name}</span> <span class="muted">· ${v.label}</span></span>
          <span class="label">${done ? 'TERMINÉ' : c.open ? A.ago(c.created) : 'EXPIRÉ'}</span></div>
        <div class="muted" style="font-size:12px;margin:-4px 0 6px">${c.from === me.id ? 'Lancé par toi' : 'Lancé par ' + A.esc(c.names[c.from] || '?')}</div>
        ${rows.map((x, i) => `<div class="ch-row ${x.me ? 'me' : ''}"><span class="rk-n">${x.r ? (i === 0 && done && rows.length > 1 ? '👑' : i + 1) : '·'}</span>
          <span class="rk-name">${A.esc(x.name)}${x.me ? ' <span class="muted">· toi</span>' : ''}</span>
          <span class="mono ${x.r ? '' : 'muted'}">${x.r ? A.fmt(x.r.score, 0) : 'en attente'}</span></div>`).join('')}
        ${!mine && c.open ? `<button class="btn primary small" data-play="${c.id}" style="margin-top:10px">Relever le défi ▸</button>` : ''}
      </div>`;
    }).join('')}`;
}

function renderNewChallenge() {
  const S = A.social, friends = (S.state().board || {}).friends || [];
  let pick = S.CH_GAMES[0], sel = new Set(friends.map(f => f.id));
  const draw = () => {
    const el = page(`
      <button class="back" data-back>${I.back} AMIS</button>
      <div class="h-title" style="margin-top:6px">Nouveau défi</div>
      <div class="h-sub">Tout le monde reçoit exactement les mêmes questions, dans le même ordre. Meilleur score gagne.</div>
      <div class="label" style="margin-bottom:8px">Épreuve</div>
      <div class="ch-games">${S.CH_GAMES.map(([gid, vid], i) => { const g = A.games[gid]; return `<button class="ch-g ${pick[0] === gid && pick[1] === vid ? 'on' : ''}" data-i="${i}"><b class="mono">${g.code}</b><span>${g.name}</span><span class="muted">${A.variant(g, vid).label}</span></button>`; }).join('')}</div>
      <div class="label" style="margin:16px 0 8px">Adversaires</div>
      <div class="ch-friends">${friends.map(f => `<button class="chip ${sel.has(f.id) ? 'hot' : ''}" data-f="${f.id}">${sel.has(f.id) ? '✓ ' : ''}${A.esc(f.name)}</button>`).join('')}</div>
      <div style="height:90px"></div>`, false);
    el.appendChild(A.h(`<div class="bottom-cta"><button class="btn primary" data-go>Défier ${sel.size} ami${sel.size > 1 ? 's' : ''} & jouer ▸</button></div>`));
    mount(el, false);
    on(el, '[data-back]', () => renderSocial(false));
    on(el, '[data-i]', b => { pick = S.CH_GAMES[+b.dataset.i]; draw(); });
    on(el, '[data-f]', b => { sel.has(b.dataset.f) ? sel.delete(b.dataset.f) : sel.add(b.dataset.f); draw(); });
    on(el, '[data-go]', async b => {
      if (!sel.size) return A.toast(S.ERR.nofriend);
      b.disabled = true; b.textContent = 'Création…';
      try { const c = await S.createChallenge(pick[0], pick[1], [...sel]); openIntro(c.game, { challenge: c }); }
      catch (e) { A.toast(S.msg(e)); b.disabled = false; b.textContent = 'Réessayer'; }
    });
  };
  draw();
}

/* ---------- RÉGLAGES ---------- */
function renderSettings() {
  const el = page(`
    <button class="back" data-back>${I.back} DESK</button>
    <div class="h-title" style="margin-top:6px">Réglages</div>
    <div class="card" style="padding:4px 14px">
      <div class="row"><span>Sons</span><button class="switch ${A.db.settings.sound ? 'on' : ''}" data-snd></button></div>
    </div>
    <div class="label" style="margin:18px 0 8px">Sauvegarde cloud</div>
    <div class="card">${A.social.enabled() ? `
      <div class="row" style="padding-top:0"><span>Dernière sauvegarde</span><span class="mono dim" style="font-size:13px">${A.ago(A.social.state().backupAt)}</span></div>
      <div class="dim" style="font-size:13px;line-height:1.45;margin:4px 0 12px">Automatique après tes parties. Nouveau téléphone : onglet AMIS → « restaurer », avec ton code ami <b class="mono amber">${A.social.state().code}</b> et ta clé de récupération.</div>
      <div class="btn-row"><button class="btn ghost small" data-bk>Sauvegarder maintenant</button><button class="btn ghost small" data-key>Ma clé</button></div>`
      : `<div class="dim" style="font-size:13px;line-height:1.45">Crée ton profil dans l’onglet AMIS pour activer la sauvegarde automatique de tes données.</div>`}
    </div>
    <div class="label" style="margin:18px 0 8px">Sauvegarde manuelle</div>
    <div class="card">
      <div class="dim" style="font-size:13px;line-height:1.45;margin-bottom:10px">Tes données restent sur ton iPhone. Copie une sauvegarde de temps en temps (dans Notes par exemple).</div>
      <button class="btn ghost small" data-exp>Copier la sauvegarde</button>
      <div style="height:10px"></div>
      <textarea placeholder="Colle ici une sauvegarde pour la restaurer"></textarea>
      <div style="height:8px"></div>
      <button class="btn ghost small" data-imp>Restaurer</button>
    </div>
    <div class="label" style="margin:18px 0 8px">Version</div>
    <div class="card">
      <div class="card-h"><span style="font-weight:700;font-size:17px">Alpha <span class="amber mono">v${A.VERSION}</span></span><span class="label">${A.CHANGELOG[0].date.split('-').reverse().join('/')}</span></div>
      ${A.CHANGELOG.map((c, i) => `<div class="label" style="margin:${i ? 14 : 4}px 0 6px">v${c.v} · ${c.date.split('-').reverse().join('/')}</div><ul class="changelog">${c.items.map(x => `<li>${x}</li>`).join('')}</ul>`).join('')}
    </div>
    <div class="label" style="margin:18px 0 8px">Installation</div>
    <div class="card dim" style="font-size:13px;line-height:1.5">Dans Safari : bouton Partager → « Sur l’écran d’accueil ». L’app s’ouvre alors en plein écran et fonctionne hors connexion.</div>
    <button class="btn ghost small" data-reset style="color:var(--down)">Tout réinitialiser</button>
    <div class="hint" style="margin:18px 0">ALPHA v${A.VERSION} · ${A.db.sessions.length} PARTIES ENREGISTRÉES</div>
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
  on(el, '[data-bk]', async b => {
    b.disabled = true;
    try { await A.social.backup(true); A.toast('Sauvegardé ✓'); renderSettings(); } catch (e) { A.toast(A.social.msg(e)); b.disabled = false; }
  });
  on(el, '[data-key]', () => A.social.recoveryKey().then(keyModal).catch(e => A.toast(A.social.msg(e))));
  on(el, '[data-reset]', async () => {
    if (await A.confirm('Tout réinitialiser ?', 'Historique, records, niveaux et séances seront effacés. Irréversible.', 'Effacer')) { A.resetDb(); tab = 'desk'; renderDesk(); }
  });
}

/* ---------- démarrage ---------- */
let lastDay = A.dayKey();
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  if (A.dayKey() !== lastDay) { lastDay = A.dayKey(); if (!document.querySelector('.game')) go(); }
  if (A.social.state().dirty) A.social.sync(true); // rattrape les envois ratés hors ligne
});
// Service worker : quand une nouvelle version prend la main, on recharge (sauf en pleine partie)
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    const reload = () => { if (!reloading) { reloading = true; location.reload(); } };
    if (!document.querySelector('.game')) reload();
    else document.addEventListener('visibilitychange', () => { if (!document.querySelector('.game')) reload(); });
  });
  navigator.serviceWorker.register('sw.js').then(reg => {
    reg.update();
    // iOS reprend souvent l'app sans la relancer : on revérifie à chaque retour dessus
    document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
  }).catch(() => {});
}
// Nouveautés : affichées une fois après chaque mise à jour
function whatsNew() {
  const seen = A.db.seenVersion;
  A.db.seenVersion = A.VERSION; A.save();
  if (!seen && !A.db.sessions.length) return; // première installation : rien à annoncer
  if (seen === A.VERSION) return;
  const c = A.CHANGELOG[0];
  const m = A.h(`<div class="modal"><div class="modal-card">
    <div class="label amber">Mise à jour</div>
    <div class="modal-title" style="margin-top:4px">Alpha v${c.v}</div>
    <ul class="changelog" style="margin:8px 0 16px">${c.items.map(x => `<li>${x}</li>`).join('')}</ul>
    <button class="btn primary">C’est parti</button></div></div>`);
  m.querySelector('button').addEventListener('click', () => m.remove());
  document.body.appendChild(m);
}
A.ui = { renderNewChallenge, renderDesk, renderModules, renderStats, renderSocial, openIntro, runGame, renderResult, renderClose, renderTeaser, renderSettings };
renderDesk();
whatsNew();
if (A.social.enabled()) A.social.sync(true);
})();
