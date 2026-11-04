import { html, useState, useEffect, useMemo } from '../vendor/preact-htm.js';
import { useStore, update, teacherEvent } from '../store.js';
import { EN_ALL, EN_BY_ID, EN_ROADMAP } from '../data/english.js';
import { CONVERSATIONS } from '../data/games.js';
import { ID_LESSONS } from '../data/indonesian.js';
import { VERBS, TENSES } from '../data/grammar.js';
import { Back, go, Tri, AudioBtn, FullscreenBtn, shuffle, sample, Empty } from '../ui.js';
import { GAMES } from './games.js';
import { scenesForLesson } from '../data/scenes.js';
import { TouchSlide } from './touch.js';

const DEFAULT_WORDS = 10;

export function ClassroomHome() {
  const s = useStore();
  const teach = ID_LESSONS.find((l) => l.id === 'id-4-teach');
  return html`<div class="page">
    <h1>🇬🇧 I teach English</h1>
    <p class="muted">Prépare ta séance, puis lance le mode classe : gros boutons, réponses cachées, plein écran.</p>
    <div class="row wrap">
      <button class="btn coral" onClick=${() => go('/games/touch')}>👆 Touch it!</button>
      <button class="btn coral" onClick=${() => go('/games/team')}>🏆 Team Challenge</button>
      <button class="btn ghost" onClick=${() => go('/games/simon')}>🙋‍♀️ Simon Says</button>
      <button class="btn ghost" onClick=${() => go('/games/emotions')}>😊 Guess the Emotion</button>
      <button class="btn ghost" onClick=${() => go('/classroom/phrases')}>🧑‍🏫 Mes phrases en indonésien</button>
      <button class="btn ghost" onClick=${() => go('/classroom/verbs')}>📗 50 verbes & les temps</button>
    </div>
    <h2>Leçons complètes : thèmes</h2>
    <div class="lesson-grid">${EN_ALL.filter((l) => l.full && l.n < 16).map((l) => html`<${LessonTile} l=${l} />`)}</div>
    <h2>Les bases : pronoms, temps, verbes</h2>
    <div class="lesson-grid">${EN_ALL.filter((l) => l.full && l.n >= 16).map((l) => html`<${LessonTile} l=${l} />`)}</div>
    <h2>Leçons rapides (vocabulaire + jeux)</h2>
    <div class="lesson-grid">${EN_ALL.filter((l) => !l.full).map((l) => html`<${LessonTile} l=${l} />`)}</div>
    <h2>Bientôt</h2>
    <div class="row wrap">${EN_ROADMAP.map((t) => html`<span class="pill muted">🔒 ${t}</span>`)}</div>
  </div>`;
}

function LessonTile({ l }) {
  return html`<button class="lesson-tile" onClick=${() => go('/classroom/' + l.id)}>
    <span class="lt-icon">${l.icon}</span>
    <span class="grow"><b>${l.n}. ${l.title}</b><span class="muted small block">${l.level} · ${l.duration} min · ${l.vocab.length} mots</span></span>
    <span class="go">▶</span>
  </button>`;
}

export function VerbsPage() {
  const [q, setQ] = useState('');
  const [onlyIrr, setOnlyIrr] = useState(false);
  const n = q.trim().toLowerCase();
  const list = VERBS.filter((v) => (!onlyIrr || v.irregular) && (!n || [v.base, v.past, v.ing, v.id, v.fr].some((t) => t.toLowerCase().includes(n))));
  return html`<div class="page">
    <${Back} to="/classroom" label="Classe" />
    <h1>📗 50 verbes & les temps</h1>
    <h2>Les 4 temps à connaître</h2>
    <p class="muted">Avec ces quatre temps, tes élèves peuvent parler de leurs habitudes, de ce qu'elles font, d'hier et de demain. En indonésien, le verbe ne change pas : on ajoute un petit mot (sedang, sudah, akan).</p>
    <div class="tenses">${TENSES.map((t) => html`<div class="tense card">
      <div class="tense-head"><span>${t.icon}</span><b>${t.name}</b></div>
      <div class="muted small">${t.use} · 🇮🇩 ${t.id}</div>
      <div class="tense-ex">${t.ex} <${AudioBtn} text=${t.ex} lang="en" /></div>
      <dl><dt>Forme</dt><dd>${t.form}</dd><dt>Négation</dt><dd>${t.neg}</dd><dt>Question</dt><dd>${t.q}</dd><dt>Mots repères</dt><dd>${t.when}</dd><dt>🇮🇩 Mot équivalent</dt><dd>${t.bridge}</dd></dl>
    </div>`)}</div>
    <div class="row wrap">
      <button class="btn primary" onClick=${() => go('/classroom/en-verbs')}>▶ Préparer une séance verbes</button>
      <button class="btn ghost" onClick=${() => go('/flashcards/review/en-verbs')}>🃏 Réviser en flashcards</button>
      <button class="btn ghost" onClick=${() => go('/games/duel')}>⚔️ Quiz Duel des verbes</button>
    </div>
    <h2>Les 50 verbes</h2>
    <div class="row wrap">
      <input id="verb-search" class="input grow" placeholder="Chercher : go, makan, manger…" value=${q} onInput=${(e) => setQ(e.target.value)} autocapitalize="off" />
      <label class="check"><input id="verb-irr" type="checkbox" checked=${onlyIrr} onChange=${(e) => setOnlyIrr(e.target.checked)} /> Irréguliers seulement (${VERBS.filter((v) => v.irregular).length})</label>
    </div>
    <div class="table-wrap"><table class="verbs">
      <thead><tr><th></th><th>Base</th><th>he / she</th><th>-ing</th><th>Prétérit</th><th>🇮🇩</th><th>🇫🇷</th></tr></thead>
      <tbody>${list.map((v) => html`<tr>
        <td class="v-em">${v.emoji}</td>
        <td><b>${v.base}</b> <${AudioBtn} text=${v.base} lang="en" /></td>
        <td>${v.he}</td><td>${v.ing}</td>
        <td class=${v.irregular ? 'irr' : ''}>${v.past}</td>
        <td class="v-id">${v.id}</td><td class="muted">${v.fr}</td>
      </tr>`)}</tbody>
    </table></div>
    <p class="muted small">En orange : prétérit irrégulier, à apprendre par cœur.</p>
  </div>`;
}

export function TeacherPhrases() {
  const l = ID_LESSONS.find((x) => x.id === 'id-4-teach');
  return html`<div class="page">
    <${Back} to="/classroom" label="Classe" />
    <h1>🧑‍🏫 Phrases de classe en indonésien</h1>
    <p class="muted">Touche une phrase pour l'entendre. Affiche-la en grand pour la montrer aux élèves.</p>
    <div class="phrase-grid">${l.words.map((w) => html`<div class="phrase">
      <div class="ph-id">${w.id}</div><div class="muted">${w.fr} · <i>${w.en}</i></div><div class="w-pron small">🗣️ ${w.pron}</div>
      <${AudioBtn} text=${w.id} />
    </div>`)}</div>
    <button class="btn primary" onClick=${() => go('/learn/id-4-teach')}>Apprendre ces phrases (leçon niveau 4)</button>
  </div>`;
}

function useSelection(l) {
  const s = useStore();
  const sel = s.classSel?.[l.id] || l.vocab.slice(0, DEFAULT_WORDS).map((w) => w.key);
  const toggle = (k) => update((st) => {
    st.classSel = st.classSel || {};
    const cur = st.classSel[l.id] || l.vocab.slice(0, DEFAULT_WORDS).map((w) => w.key);
    st.classSel[l.id] = cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k];
  });
  return [sel, toggle];
}

export function ClassLesson({ id }) {
  const l = EN_BY_ID[id];
  const [sel, toggle] = useSelection(l || { id: '', vocab: [] });
  if (!l) return html`<div class="page"><${Back} to="/classroom" /><${Empty} icon="🤷">Leçon introuvable.</${Empty}></div>`;
  const conv = CONVERSATIONS.find((c) => c.id === l.conversation);
  const game = GAMES.find((g) => g.id === l.game);
  return html`<div class="page u-en">
    <${Back} to="/classroom" label="Classe" />
    <div class="lesson-head">
      <span class="lesson-icon">${l.icon}</span>
      <div><small class="muted">Teacher preparation</small><h1>${l.title}</h1>
        <div class="row wrap"><span class="pill">⏱ ${l.duration} min</span><span class="pill">🎯 ${l.level}</span><span class="pill">👧 13 élèves</span></div></div>
    </div>
    <div class="sticky-cta"><button class="btn coral lg block" onClick=${() => { teacherEvent('sessions'); go('/classroom/' + id + '/present'); }}>▶ Lancer le mode classe (${sel.length} mots)</button></div>

    ${l.objective && html`<h2>🎯 Objectif</h2><div class="card"><${Tri} t=${l.objective} /></div>`}

    ${l.steps && html`<h2>🗓️ Déroulé de la séance</h2><ol class="timeline">${l.steps.map((st) => html`<li><span class="min">${st.min}′</span><${Tri} t=${st} /></li>`)}</ol>`}

    <h2>📚 Vocabulaire — choisis les mots du jour</h2>
    <p class="muted small">Pas plus de 8 à 10 nouveaux mots par séance pour des débutantes. Touche une carte pour l'inclure ou l'exclure.</p>
    <div class="vocab-grid">${l.vocab.map((w) => html`<button class=${'vcard' + (sel.includes(w.key) ? ' on' : '')} onClick=${() => toggle(w.key)}>
      <span class="v-emoji">${w.emoji}</span><b>${w.en}</b><span class="small">🇮🇩 ${w.id}</span><span class="small muted">🇫🇷 ${w.fr}</span>${w.forms && html`<span class="small forms">${w.forms}</span>`}<span class="v-check">${sel.includes(w.key) ? '✓' : ''}</span>
    </button>`)}</div>

    ${l.sentences && html`<h2>💬 Phrases d'exemple</h2><div class="card">${l.sentences.map((x) => html`<div class="sent"><b>${x.en}</b> <${AudioBtn} text=${x.en} lang="en" /><div class="muted small">🇮🇩 ${x.id} · 🇫🇷 ${x.fr}</div></div>`)}</div>`}

    ${l.grammar && html`<h2>🧩 Grammaire : ${l.grammar.title}</h2><div class="card"><${Tri} t=${l.grammar.rule} />
      <table class="gtable">${l.grammar.table.map((r) => html`<tr>${r.map((c) => html`<td>${c}</td>`)}</tr>`)}</table></div>`}

    ${l.exercises && html`<h2>✏️ Exercices progressifs</h2><div class="card"><ol>${l.exercises.map((e) => html`<li>${e.type === 'fill' ? html`${e.s} <span class="muted">(${e.opts.join(' / ')})</span> → <b>${e.a}</b>` : html`🧱 ${shuffleWords(e.a)} → <b>${e.a}.</b> <span class="muted small">${e.fr}</span>`}</li>`)}</ol></div>`}

    ${scenesForLesson(l.id).length > 0 && html`<h2>👆 Touch it! — le dessin interactif</h2>
      <div class="card"><p class="muted small">« Touch the hand! » : une élève vient toucher la bonne partie du dessin. Découverte, défi, duel ou équipes. Aussi inclus dans le mode classe.</p>
        <div class="row wrap">${scenesForLesson(l.id).map((sc) => html`<button class="btn primary" onClick=${() => go('/games/touch/' + sc.id)}>${sc.icon} ${sc.title}</button>`)}</div></div>`}
    ${game && html`<h2>🎲 Jeu collectif</h2><div class="card row between wrap"><div><b>${game.icon} ${game.name}</b><${Tri} t=${l.gameNote} show=${['fr', 'id']} /></div><button class="btn primary" onClick=${() => go('/games/' + game.id)}>Lancer</button></div>`}
    ${conv && html`<div class="card row between wrap"><div><b>💬 Dialogue : ${conv.title}</b><div class="muted small">À jouer en binômes</div></div><button class="btn ghost" onClick=${() => go('/games/conversation')}>Ouvrir</button></div>`}
    ${!l.full && html`<h2>🎲 Jeux conseillés</h2><div class="row wrap"><button class="btn ghost" onClick=${() => go('/games/memory')}>🧠 Memory</button><button class="btn ghost" onClick=${() => go('/games/match')}>🔗 Match the Pairs</button><button class="btn ghost" onClick=${() => go('/games/team')}>🏆 Team Challenge</button></div>`}

    <h2>📝 Mini-test final</h2><div class="card"><ol>${miniTest(l, sel).map((q) => html`<li>${q.emoji} ${q.q} → <b>${q.a}</b></li>`)}</ol></div>

    ${l.tips && html`<h2>🌸 Conseils pour les élèves timides</h2><div class="tips">${l.tips.map((t) => html`<div class="card tip"><${Tri} t=${t} show=${['fr', 'en', 'id']} /></div>`)}</div>`}
  </div>`;
}

const shuffleWords = (s) => s.split(' ').reverse().join(' / ');

function miniTest(l, sel) {
  const words = l.vocab.filter((w) => sel.includes(w.key));
  const qs = words.slice(0, 4).map((w) => ({ emoji: w.emoji, q: 'What is it?', a: w.en }));
  const fill = (l.exercises || []).filter((e) => e.type === 'fill').slice(-2).map((e) => ({ emoji: '✏️', q: e.s + ` (${e.opts.join(' / ')})`, a: e.a }));
  return [...qs, ...fill];
}

// ---------- MODE CLASSE (présentation) ----------
function buildSlides(l, sel) {
  const words = l.vocab.filter((w) => sel.includes(w.key));
  const slides = [{ type: 'title' }];
  words.forEach((w) => slides.push({ type: 'word', w }));
  if (words.length >= 4) slides.push({ type: 'review', words: shuffle(words) });
  scenesForLesson(l.id).forEach((sc) => slides.push({ type: 'touch', sc, pool: words.map((w) => w.en) }));
  (l.sentences || []).forEach((x) => slides.push({ type: 'sentence', x }));
  if (l.grammar) slides.push({ type: 'grammar' });
  (l.exercises || []).forEach((e) => slides.push({ type: 'exercise', e, tokens: shuffle(e.a.split(' ')) }));
  if (l.game) slides.push({ type: 'game', game: l.game });
  miniTest(l, sel).forEach((q, i) => slides.push({ type: 'test', q, i }));
  slides.push({ type: 'end' });
  return slides;
}

export function Present({ id }) {
  const s = useStore();
  const l = EN_BY_ID[id];
  const sel = s.classSel?.[id] || l.vocab.slice(0, DEFAULT_WORDS).map((w) => w.key);
  const slides = useMemo(() => buildSlides(l, sel), [id, sel.join()]);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [teacher, setTeacher] = useState(false);
  const slide = slides[Math.min(i, slides.length - 1)];
  const move = (d) => { setI(Math.max(0, Math.min(slides.length - 1, i + d))); setShown(false); };
  useEffect(() => {
    const k = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') move(1);
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') move(-1);
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setShown(true); }
    };
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  });
  const needsAnswer = ['word', 'sentence', 'exercise', 'test'].includes(slide.type);

  return html`<div class=${'present' + (teacher ? ' teacher' : '')}>
    <div class="present-bar">
      <button class="btn ghost sm" onClick=${() => go('/classroom/' + id)}>✕ Quitter</button>
      <span class="muted">${l.icon} ${l.title} · ${i + 1}/${slides.length}</span>
      <span class="row">
        <button class=${'btn sm ' + (teacher ? 'primary' : 'ghost')} onClick=${() => setTeacher(!teacher)}>${teacher ? '🧑‍🏫 Vue prof' : '👧 Vue élèves'}</button>
        <${FullscreenBtn} />
      </span>
    </div>
    <div class="slide">${renderSlide(l, slide, shown, teacher)}</div>
    <div class="present-nav">
      <button class="btn ghost xl" disabled=${i === 0} onClick=${() => move(-1)}>◀</button>
      ${needsAnswer && !shown ? html`<button class="btn coral xl" onClick=${() => setShown(true)}>Show Answer</button>` : html`<span class="grow"></span>`}
      <button class="btn primary xl" disabled=${i === slides.length - 1} onClick=${() => move(1)}>▶</button>
    </div>
  </div>`;
}

function renderSlide(l, sl, shown, teacher) {
  switch (sl.type) {
    case 'title': return html`<div class="giant">${l.icon}</div><div class="huge">${l.title}</div>
      ${l.objective && html`<div class="trans">${l.objective.en}</div>${teacher && html`<div class="note">🇫🇷 ${l.objective.fr}<br />🇮🇩 ${l.objective.id}</div>`}`}
      <div class="trans">Let's start! 🇮🇩 Ayo kita mulai!</div>`;
    case 'word': return html`${!sl.w.abstract && html`<div class="giant">${sl.w.emoji}</div>`}<div class="huge">${sl.w.en}</div><${AudioBtn} text=${sl.w.en} lang="en" big />
      ${sl.w.forms && html`<div class="trans">${sl.w.forms}</div>`}
      ${(shown || teacher) && html`<div class=${'trans' + (shown ? '' : ' peek')}>🇮🇩 ${sl.w.id}${teacher ? ` · 🇫🇷 ${sl.w.fr}` : ''}</div>`}
      ${teacher && html`<div class="note">Montre la carte, dis le mot 2 fois, la classe répète en chœur, puis 2-3 élèves (volontaires d'abord).</div>`}`;
    case 'review': return html`<div class="huge">What is it? 🤔</div><div class="emoji-wall">${sl.words.map((w) => html`<span title=${teacher ? w.en : ''}>${w.emoji}</span>`)}</div>
      ${teacher && html`<div class="note">Pointe un emoji au hasard : la classe dit le mot. ${sl.words.map((w) => w.emoji + ' ' + w.en).join(' · ')}</div>`}`;
    case 'touch': return html`<${TouchSlide} key=${sl.sc.id} sc=${sl.sc} pool=${sl.pool} />
      ${teacher && html`<div class="note">Une élève vient toucher l'écran (ou montre la partie sur son propre corps). Puis « Next word ».</div>`}`;
    case 'sentence': return html`<div class="huge">${sl.x.en}</div><${AudioBtn} text=${sl.x.en} lang="en" big />
      ${(shown || teacher) && html`<div class=${'trans' + (shown ? '' : ' peek')}>🇮🇩 ${sl.x.id}${teacher ? html`<br />🇫🇷 ${sl.x.fr}` : ''}</div>`}`;
    case 'grammar': return html`<div class="huge">${l.grammar.title}</div>
      <table class="gtable big">${l.grammar.table.map((r) => html`<tr>${r.map((c) => html`<td>${c}</td>`)}</tr>`)}</table>
      <div class="trans">${l.grammar.examples.join(' · ')}</div>${teacher && html`<div class="note">${l.grammar.rule.fr}<br />🇮🇩 ${l.grammar.rule.id}</div>`}`;
    case 'exercise': return sl.e.type === 'fill'
      ? html`<div class="huge">${shown ? html`${sl.e.s.split('___')[0]}<mark>${sl.e.a}</mark>${sl.e.s.split('___')[1]}` : sl.e.s}</div>
        <div class="opt-row">${sl.e.opts.map((o) => html`<span class=${'opt' + (shown && o === sl.e.a ? ' right' : '')}>${o}</span>`)}</div>
        ${(shown || teacher) && html`<div class=${'trans' + (shown ? '' : ' peek')}>${teacher ? '✔ ' + sl.e.a + ' · ' : ''}🇮🇩 ${sl.e.why.id}</div>`}`
      : html`<div class="ex-kind">Build a sentence</div><div class="opt-row">${sl.tokens.map((t) => html`<span class="opt">${t}</span>`)}</div>
        <div class="trans">🇮🇩 ${sl.e.id}</div>
        ${(shown || teacher) && html`<div class=${'huge' + (shown ? '' : ' peek')}>${sl.e.a}.</div>`}`;
    case 'game': {
      const g = GAMES.find((x) => x.id === sl.game);
      return html`<div class="giant">${g.icon}</div><div class="huge">Game time!</div><div class="trans">${g.name} · 🇮🇩 Ayo bermain!</div>
        <button class="btn coral xl" onClick=${() => go('/games/' + g.id)}>▶ Lancer ${g.name}</button>`;
    }
    case 'test': return html`<div class="ex-kind">Mini test · ${sl.i + 1}</div><div class="giant">${sl.q.emoji}</div><div class="huge">${sl.q.q}</div>
      ${(shown || teacher) && html`<div class=${'answer' + (shown ? '' : ' peek')}>${sl.q.a}</div>`}`;
    case 'end': return html`<div class="giant">🌟</div><div class="huge">Great job, everyone!</div><div class="trans">🇮🇩 Kerja bagus, semuanya! · Sampai jumpa!</div>`;
  }
  return null;
}
