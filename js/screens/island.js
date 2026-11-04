// L'île : carte des 100 niveaux jusqu'au Rinjani, leçon du jour et écran de leçon.
import { html, useState, useEffect, useMemo } from '../vendor/preact-htm.js';
import { useStore, completeLevel, today } from '../store.js';
import { go, AudioBtn, Confetti } from '../ui.js';
import { speak } from '../speech.js';
import { Session, Match } from '../exercises.js';
import { EN_BY_ID } from '../data/english.js';
import { SCENE_BY_ID, sayTouch, sceneWords } from '../data/scenes.js';
import { ZONES, LEVELS_N, SUMMIT_M, altitude, levelInfo, buildLevel, starsFor, PASS } from '../data/path.js';
import { Scene } from './touch.js';
import { B, progress } from '../i18n.js';
import { useStudent, updateMe, awardStars } from '../net/fb.js';

const fmtM = (m) => m.toLocaleString('id-ID') + ' m';

// ---------- Progression ----------
export function pathState(s) {
  const done = s.path?.done || {};
  let cur = 1;
  while (cur <= LEVELS_N && done[cur]) cur++;
  const days = s.path?.days || {};
  let streak = 0;
  const d = new Date();
  if (!days[today(d)]) d.setDate(d.getDate() - 1);
  while (days[today(d)]) { streak++; d.setDate(d.getDate() - 1); }
  const stars = Object.values(done).reduce((a, b) => a + b, 0);
  return { done, cur: Math.min(cur, LEVELS_N), finished: cur > LEVELS_N, streak, todayDone: days[today()] || 0, stars, top: cur - 1 };
}

// ---------- Carte « leçon du jour » ----------
export function DailyCard() {
  const s = useStore();
  const p = pathState(s);
  const info = levelInfo(p.cur);
  const z = info.zone;
  return html`<div class="daily" style=${`--zc:${z.color};--zi:${z.ink}`}>
    <div class="daily-top">
      <span class="daily-streak">🔥 ${p.streak} <small>${B('hari', 'days')}</small></span>
      <span class="daily-alt">⛰️ ${fmtM(altitude(p.top))} / ${fmtM(SUMMIT_M)}</span>
    </div>
    <div class="daily-body">
      <span class="daily-icon">${z.icon}</span>
      <div class="grow"><small>${p.todayDone ? B('Target hari ini tercapai! ✅', 'Today\'s goal done!') : B('Pelajaran hari ini', 'Today\'s lesson')}</small>
        <b>Level ${p.cur} · ${info.icon} ${info.label}</b>
        <span class="small block">${z.name} (${z.en}) · ${fmtM(info.alt)}</span></div>
    </div>
    <div class="alt-bar"><i style=${`width:${(p.top / LEVELS_N) * 100}%`}></i></div>
    <div class="row">
      <button class="btn coral lg grow" onClick=${() => go('/s/level/' + p.cur)}>▶ ${p.todayDone ? B('Lanjut naik', 'Keep climbing') : B('Mulai', 'Start')} · 5 menit</button>
      <button class="btn ghost lg" onClick=${() => go('/s/island')} aria-label="Map">🗺️</button>
    </div>
  </div>`;
}

// ---------- Carte de l'île ----------
export function IslandMap() {
  const s = useStore();
  const p = pathState(s);
  const st = useStudent();
  const avatar = st.me?.avatar || '🧒';
  useEffect(() => {
    const el = document.getElementById('lvl-' + p.cur);
    if (el) setTimeout(() => el.scrollIntoView({ block: 'center' }), 50);
  }, []);
  const node = (n) => {
    const done = p.done[n];
    const open = n <= p.cur;
    const boss = n % 10 === 0;
    const x = Math.round(Math.sin(n * 0.85) * 34);
    const info = levelInfo(n);
    return html`<div class="lvl-row" style=${`--x:${x}%`}>
      <button id=${'lvl-' + n} class=${'lvl' + (done ? ' done' : '') + (n === p.cur ? ' cur' : '') + (!open ? ' locked' : '') + (boss ? ' boss' : '')}
        disabled=${!open} onClick=${() => go('/s/level/' + n)} aria-label=${'Level ' + n}>
        <span class="lvl-ic">${!open ? '🔒' : boss ? (n === LEVELS_N ? '🏁' : '🚩') : info.icon}</span>
        <span class="lvl-n">${n}</span>
        ${done ? html`<span class="lvl-stars">${'★'.repeat(done)}${'☆'.repeat(3 - done)}</span>` : ''}
      </button>
      ${n === p.cur && !p.finished && html`<span class=${'me-pin' + (x > 0 ? ' left' : '')}>${avatar}<small>${B('Kamu', 'You')}</small></span>`}
    </div>`;
  };
  return html`<div class="isle">
    <div class="alt-meter"><span>⛰️ <b>${fmtM(altitude(p.top))}</b> / ${fmtM(SUMMIT_M)}</span><span>🔥 ${p.streak}</span><span>⭐ ${p.stars}</span></div>
    <div class="summit">
      <svg viewBox="0 0 320 150" aria-hidden="true">
        <path d="M0,150 L110,40 L140,62 L170,18 L205,58 L230,44 L320,150 Z" fill="#8d6e63"/>
        <path d="M150,40 L170,18 L188,40 L178,36 L170,44 L160,36 Z" fill="#fff"/>
        <path d="M110,40 L124,54 L116,52 L104,48 Z" fill="#fff" opacity=".8"/>
        <line x1="170" y1="18" x2="170" y2="-4" stroke="#334155" stroke-width="3"/><path d="M170,-4 L192,3 L170,10 Z" fill="#ef6c4d"/>
        <ellipse cx="170" cy="120" rx="46" ry="10" fill="#5bc0eb" opacity=".8"/>
      </svg>
      <b>Puncak Rinjani · ${fmtM(SUMMIT_M)}</b><span>${B('Tujuan akhir', 'Final goal')} 🏁</span>
    </div>
    ${[...ZONES].map((z, zi) => ({ z, zi })).reverse().map(({ z, zi }) => html`
      <section class="zone-band" style=${`--zc:${z.color};--zi:${z.ink}`}>
        <span class="zone-deco l">${z.icon}</span><span class="zone-deco r">${z.icon}</span>
        ${Array.from({ length: 10 }, (_, i) => zi * 10 + 10 - i).map(node)}
        <div class="zone-label"><span>${z.icon}</span><div><b>${z.name}</b><small>${z.en} · ${fmtM(altitude(zi * 10))} – ${fmtM(altitude(zi * 10 + 10))}</small></div></div>
      </section>`)}
    <div class="shore">🌊 ${B('Mulai di sini', 'Start here')} · 0 m 🌊</div>
  </div>`;
}

// ---------- Exercices propres aux leçons ----------
function Intro({ ex, onDone }) {
  const w = ex.w;
  useEffect(() => { speak(w.en, 'en'); }, [w]);
  return html`<div class="ex intro-card">
    <div class="ex-kind">✨ ${B('Kata baru', 'New word')}</div>
    ${!w.abstract && html`<div class="intro-emoji">${w.emoji}</div>`}
    <div class="intro-en">${w.en} <${AudioBtn} text=${w.en} lang="en" /></div>
    ${w.forms && html`<div class="muted">${w.forms}</div>`}
    <div class="intro-id">🇮🇩 ${w.id}</div>
    <button class="btn primary lg block" autofocus onClick=${() => onDone(null)}>${B('Lanjut', 'Next')} →</button>
  </div>`;
}

function Rule({ ex, onDone }) {
  const g = EN_BY_ID[ex.lesson].grammar;
  return html`<div class="ex rule-card">
    <div class="ex-kind">🧩 ${B('Tata bahasa', 'Grammar')}</div>
    <h2>${g.title}</h2>
    <p>${g.rule.id}</p>
    <p class="muted small">${g.rule.en}</p>
    <div class="table-wrap"><table class="gtable">${g.table.map((r) => html`<tr>${r.map((c) => html`<td>${c}</td>`)}</tr>`)}</table></div>
    ${g.examples && html`<div class="rule-ex">${g.examples.map((e) => html`<div><b>${e}</b> <${AudioBtn} text=${e} lang="en" /></div>`)}</div>`}
    <button class="btn primary lg block" onClick=${() => onDone(null)}>${B('Mengerti!', 'Got it!')} →</button>
  </div>`;
}

const MatchEx = ({ ex, onDone }) => html`<${Match} pairs=${ex.pairs} bigRight=${ex.big} onDone=${(perfect, errors) => onDone(errors <= 1)} />`;

function TouchEx({ ex, onDone }) {
  const sc = SCENE_BY_ID[ex.scene];
  const [res, setRes] = useState(null);
  const say = sayTouch(sc, ex.target, 'en');
  useEffect(() => { speak(say, 'en'); }, [ex]);
  const tap = (w) => { if (res === null) setRes(w); };
  const ok = res === ex.target;
  const marks = res === null ? {} : ok ? { [res]: 'ok' } : { [res]: 'ko', [ex.target]: 'ok' };
  const word = sceneWords(sc)[ex.target];
  return html`<div class="ex">
    <div class="ex-kind">👆 ${B('Sentuh gambar', 'Touch the picture')}</div>
    <div class="touch-prompt"><span>${say}</span><${AudioBtn} text=${say} lang="en" /></div>
    <${Scene} sc=${sc} marks=${marks} labels=${Object.keys(marks)} onTap=${tap} />
    ${res !== null && html`<div class=${'feedback ' + (ok ? 'ok' : 'ko')}>
      <div class="fb-title">${ok ? B('✨ Hebat!', 'Great!') : B('💡 Hampir!', 'Almost!')}</div>
      <div><b>${word.en}</b> = ${word.id}</div>
      <button class="btn primary block" autofocus onClick=${() => onDone(ok)}>${B('Lanjut', 'Next')} →</button></div>`}
  </div>`;
}

const EXTRA = { intro: Intro, rule: Rule, match: MatchEx, touch: TouchEx };

// ---------- Écran de leçon ----------
export function LevelPlay({ n }) {
  n = Math.max(1, Math.min(LEVELS_N, Number(n) || 1));
  const s = useStore();
  const p = pathState(s);
  const st = useStudent();
  const [round, setRound] = useState(0);
  const [result, setResult] = useState(null);
  const lvl = useMemo(() => buildLevel(n), [n, round]);
  if (n > p.cur) return html`<div class="page narrow center-page"><div class="giant">🔒</div><p>${B('Level ini masih terkunci', 'This level is still locked')}</p><button class="btn primary" onClick=${() => go('/s/island')}>🗺️ ${B('Peta', 'Map')}</button></div>`;

  const finish = (pct) => {
    const need = PASS[lvl.type] || 0;
    const passed = pct >= need;
    const stars = passed ? starsFor(pct) : 0;
    const wasDone = !!p.done[n];
    if (passed) {
      completeLevel(n, stars);
      progress('lesson');
      if (st.me && st.code) {
        const after = pathState({ path: { done: { ...p.done, [n]: stars }, days: { ...(s.path?.days || {}), [today()]: (s.path?.days?.[today()] || 0) + 1 } } });
        updateMe(st.code, st.uid, { pathLevel: after.top, pathStreak: after.streak, pathDay: today() }).catch(() => {});
        if (!wasDone) awardStars(st.code, st.uid, st.me.team, stars).catch(() => {});
      }
    }
    setResult({ pct, passed, stars, need, zoneDone: passed && n % 10 === 0 });
  };

  if (result) {
    const z = lvl.zone;
    return html`<div class="page narrow center-page level-result" style=${`--zc:${z.color};--zi:${z.ink}`}>
      ${result.passed && html`<${Confetti} />`}
      ${result.passed ? html`
        <div class="giant">${result.zoneDone ? (n === LEVELS_N ? '🏁' : '🚩') : z.icon}</div>
        <h1>${n === LEVELS_N ? B('Kamu sampai di puncak Rinjani!', 'You reached the top of Rinjani!') : result.zoneDone ? B('Gerbang terbuka!', 'Gate open!') : B('Level selesai!', 'Level complete!')}</h1>
        <div class="big-stars">${'★'.repeat(result.stars)}${'☆'.repeat(3 - result.stars)}</div>
        <p class="huge-ish">⛰️ ${fmtM(altitude(n))}</p>
        <p class="muted">${B('Kamu naik terus!', 'You keep climbing!')} ${result.pct} % ${B('benar', 'correct')}</p>
        ${result.zoneDone && n < LEVELS_N && html`<p><b>${B('Zona baru', 'New zone')}: ${ZONES[lvl.zi + 1].icon} ${ZONES[lvl.zi + 1].name}</b></p>`}
        ${n < LEVELS_N && html`<button class="btn coral xl" onClick=${() => go('/s/level/' + (n + 1))}>▶ Level ${n + 1}</button>`}`
      : html`
        <div class="giant">💪</div>
        <h1>${B('Hampir!', 'Almost!')}</h1>
        <p>${result.pct} % · ${B(`Gerbang perlu ${result.need} %`, `The gate needs ${result.need} %`)}</p>
        <button class="btn coral xl" onClick=${() => { setResult(null); setRound(round + 1); }}>🔁 ${B('Coba lagi', 'Try again')}</button>`}
      <button class="btn ghost" onClick=${() => go('/s/island')}>🗺️ ${B('Peta', 'Map')}</button>
    </div>`;
  }

  return html`<div class="page narrow level-page" style=${`--zc:${lvl.zone.color};--zi:${lvl.zone.ink}`}>
    <div class="level-head"><span>${lvl.zone.icon}</span><b>Level ${n}</b><span>${lvl.icon} ${lvl.label}</span><span class="muted">⛰️ ${fmtM(lvl.alt)}</span></div>
    <${Session} key=${n + ':' + round} items=${lvl.items} extra=${EXTRA} onExit=${() => go('/s/island')}
      finishLabel=${B('Lihat hasil', 'See result') + ' →'} onFinish=${finish} />
  </div>`;
}
