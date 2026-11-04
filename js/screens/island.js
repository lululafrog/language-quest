// L'île : carte des 100 niveaux jusqu'au Rinjani, leçon du jour et écran de leçon.
import { html, useState, useEffect, useMemo } from '../vendor/preact-htm.js';
import { useStore, completeLevel, today } from '../store.js';
import { go, AudioBtn, Confetti } from '../ui.js';
import { speak } from '../speech.js';
import { Session, Match, chime } from '../exercises.js';
import { EN_BY_ID } from '../data/english.js';
import { SCENE_BY_ID, sayTouch, sceneWords } from '../data/scenes.js';
import { ZONES, LEVELS_N, SUMMIT_M, altitude, levelInfo, buildLevel, starsFor, PASS, pathState } from '../data/path.js';
import { SayEx } from './say.js';
import { Scene } from './touch.js';
import { B, progress } from '../i18n.js';
import { useStudent, updateMe, awardStars } from '../net/fb.js';
import { ART, TURTLE, MOUNTAIN } from '../data/decor.js';
import { landscape } from '../data/landscape.js';

const CUTE = ['sparkle', 'sun', 'starfish', 'flower', 'frog', 'heart', 'mango', 'coconut', 'book', 'pencil'];

const art = (name) => ({ __html: ART[name]() });

const fmtM = (m) => m.toLocaleString('id-ID') + ' m';

export { pathState };

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
        <span class="small block">${z.icon} ${z.theme}</span>
        <span class="small block">${z.name} · ⛰️ ${fmtM(info.alt)}${info.type === 'boss' ? ` · ${B('Lawan', 'Beat')} ${z.guard} ${z.guardName}!` : ''}</span></div>
    </div>
    <div class="alt-bar"><i style=${`width:${(p.top / LEVELS_N) * 100}%`}></i></div>
    <div class="row">
      <button class="btn coral lg grow" onClick=${() => go('/s/level/' + p.cur)}>▶ ${p.todayDone ? B('Lanjut naik', 'Keep climbing') : B('Mulai', 'Start')} · 5 menit</button>
      <button class="btn ghost lg" onClick=${() => go('/s/island')} aria-label="Map">🗺️</button>
    </div>
  </div>`;
}

// ---------- Carte de l'île ----------
const ROW = 96;
const xOf = (n) => Math.round(Math.sin(n * 0.85) * 24);
const CHEERS = ['Ayo naik! (Let\'s climb!)', 'Kamu hebat! (You\'re great!)', 'Sedikit lagi! (Almost there!)', 'Semangat! (You can do it!)', 'Pemandangannya indah! (What a view!)'];

function ZoneBand({ zi, p, avatar }) {
  const z = ZONES[zi];
  const above = ZONES[zi + 1];
  const levels = Array.from({ length: 10 }, (_, i) => zi * 10 + 10 - i);
  const H = levels.length * ROW;
  const pt = (n, i) => [50 + xOf(n), i * ROW + ROW / 2];
  // Sentier : un segment par paire de niveaux, plein s'il est déjà parcouru.
  const segs = [];
  levels.forEach((n, i) => {
    const [x, y] = pt(n, i);
    const [x2, y2] = i < levels.length - 1 ? pt(levels[i + 1], i + 1) : [50 + xOf(n - 1), H + ROW / 2];
    segs.push({ d: `M${x},${y} C${x},${y + ROW / 2} ${x2},${y2 - ROW / 2} ${x2},${y2}`, done: n <= p.cur });
  });
  if (zi < ZONES.length - 1) {
    const [x, y] = pt(levels[0], 0);
    segs.push({ d: `M${50 + xOf(levels[0] + 1)},${-ROW / 2} C${50 + xOf(levels[0] + 1)},0 ${x},${y - ROW / 2} ${x},${y}`, done: levels[0] + 1 <= p.cur });
  }
  return html`<section class="zone-band" style=${`--zc:${z.color};--zn:${above ? above.color : '#cfe9f7'};--zi:${z.ink}`}>
    <div class="landscape" dangerouslySetInnerHTML=${{ __html: landscape(zi) }}></div>
    ${z.deco.filter(([a]) => CUTE.includes(a)).map(([a, x, y, sz], k) => html`<span class=${'deco' + (a === 'sparkle' ? ' twinkle' : k % 2 ? ' sway' : ' bounce')} style=${`left:${x}%;top:${y}%;width:min(${sz}px,19vw);height:min(${sz}px,19vw);animation-delay:${k * 0.7}s`} dangerouslySetInnerHTML=${art(a)}></span>`)}
    <div class="trail-box" style=${`height:${H}px`}>
      <svg class="trail" viewBox=${`0 0 100 ${H}`} preserveAspectRatio="none" aria-hidden="true">
        ${segs.map((g) => html`<path d=${g.d} class=${g.done ? 'done' : ''} vector-effect="non-scaling-stroke" />`)}
      </svg>
      ${levels.map((n, i) => {
        const done = p.done[n];
        const open = n <= p.cur;
        const boss = n % 10 === 0;
        const info = levelInfo(n);
        const x = xOf(n);
        return html`<div class="lvl-spot" style=${`left:${50 + x}%;top:${i * ROW + ROW / 2}px`}>
          ${n === p.cur && !p.finished && html`<span class="go-bubble">${B('Mulai!', 'Start!')}</span>`}
          <button id=${'lvl-' + n} class=${'lvl' + (done ? ' done' : '') + (n === p.cur ? ' cur' : '') + (!open ? ' locked' : '') + (boss ? ' boss' : '')}
            disabled=${!open} onClick=${() => go('/s/level/' + n)} aria-label=${'Level ' + n}>
            <span class="lvl-ic">${boss ? (n === LEVELS_N ? '🏁' : z.guard) : !open ? '🔒' : info.icon}</span>
            <span class="lvl-n">${n}</span>
          </button>
          ${done ? html`<span class="lvl-stars">${[1, 2, 3].map((k) => html`<i class=${k <= done ? 'on' : ''}>★</i>`)}</span>` : ''}
          ${n === p.cur && !p.finished && html`<span class=${'me-pin' + (x > 0 ? ' left' : '')}>${avatar}</span>`}
        </div>`;
      })}
    </div>
    <div class="zone-label">
      <span class="zl-icon">${z.icon}</span>
      <div><b>${zi + 1}. ${z.name}</b><span>${z.theme}</span><small>⛰️ ${fmtM(altitude(zi * 10))} – ${fmtM(altitude(zi * 10 + 10))} · ${B('Penjaga', 'Guardian')}: ${z.guard} ${z.guardName}</small></div>
    </div>
  </section>`;
}

export function IslandMap() {
  const s = useStore();
  const p = pathState(s);
  const st = useStudent();
  const avatar = st.me?.avatar || '🐢';
  useEffect(() => {
    const el = document.getElementById('lvl-' + p.cur);
    if (el) setTimeout(() => el.scrollIntoView({ block: 'center' }), 60);
  }, []);
  const cheer = CHEERS[(p.top + new Date().getDate()) % CHEERS.length];
  return html`<div class="isle">
    <div class="alt-meter">
      <span>⛰️ <b>${fmtM(altitude(p.top))}</b></span>
      <span class="alt-track"><i style=${`width:${(p.top / LEVELS_N) * 100}%`}></i></span>
      <span>🔥 ${p.streak}</span><span>⭐ ${p.stars}</span>
    </div>
    <div class="summit">
      <span class="cloud c1" dangerouslySetInnerHTML=${art('cloud')}></span><span class="cloud c2" dangerouslySetInnerHTML=${art('cloud')}></span><span class="cloud c3" dangerouslySetInnerHTML=${art('sun')}></span>
      <div class="mtn" dangerouslySetInnerHTML=${{ __html: MOUNTAIN }}></div>
      <b>Puncak Rinjani · ${fmtM(SUMMIT_M)}</b>
      <span>${B('Penjaga terakhir', 'Final guardian')}: 🧚‍♀️ Dewi Anjani</span>
    </div>
    ${ZONES.map((_, zi) => zi).reverse().map((zi) => html`<${ZoneBand} key=${zi} zi=${zi} p=${p} avatar=${avatar} />`)}
    <div class="shore"><span class="wave">🌊</span> ${B('Mulai di sini', 'Start here')} · 0 m <span class="wave">🌊</span></div>
    <div class="mascot"><span class="turtle" dangerouslySetInnerHTML=${{ __html: TURTLE }}></span><p>${cheer}</p></div>
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
  const tap = (w) => { if (res === null) { setRes(w); chime(w === ex.target); } };
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

const EXTRA = { intro: Intro, rule: Rule, match: MatchEx, touch: TouchEx, say: SayEx };

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
        <div class="giant">${result.zoneDone ? (n === LEVELS_N ? '🏆' : '🚩') : z.icon}</div>
        <h1>${n === LEVELS_N ? B('Kamu sampai di puncak Rinjani!', 'You reached the top of Rinjani!') : result.zoneDone ? B('Gerbang terbuka!', 'Gate open!') : B('Level selesai!', 'Level complete!')}</h1>
        ${result.zoneDone && html`<p class="huge-ish">${z.guard} ${B(`${z.guardName} kalah!`, 'Guardian beaten!')}</p>`}
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
    ${lvl.type === 'boss' && html`<div class="guardian"><span>${lvl.zone.guard}</span><p><b>${lvl.zone.guardName}</b> ${B('menjaga gerbang. Jawab 70% dengan benar untuk lewat!', 'guards the gate. Get 70% right to pass!')}</p></div>`}
    <${Session} key=${n + ':' + round} items=${lvl.items} extra=${EXTRA} onExit=${() => go('/s/island')}
      finishLabel=${B('Lihat hasil', 'See result') + ' →'} onFinish=${finish} />
  </div>`;
}
