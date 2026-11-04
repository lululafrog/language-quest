import { html, useState, useMemo } from '../vendor/preact-htm.js';
import { useStore, finishLesson } from '../store.js';
import { ID_LESSONS, LEVELS, ALL_ID_WORDS } from '../data/indonesian.js';
import { EN_ALL } from '../data/english.js';
import { WordRow, Back, go, AudioBtn, Empty } from '../ui.js';
import { isLessonUnlocked } from '../cards.js';
import { Session, Match } from '../exercises.js';
import { idLessonExercises, uniquePairs } from '../gen.js';
import { normalize } from '../speech.js';

export function LearnHome() {
  const s = useStore();
  return html`<div class="page">
    <h1>🇮🇩 I learn Indonesian</h1>
    <p class="muted">Ta carte d'aventure : chaque île se débloque quand tu termines la précédente.</p>
    <button class="search-launch" onClick=${() => go('/lexicon')}>🔎 Chercher un mot ou une expression (FR · ID · EN)</button>
    <div class="row wrap">
      <button class="btn ghost" onClick=${() => go('/games/touch/body/id')}>👆 Touch it en indonésien (corps, classe, famille…)</button>
      <button class="btn ghost" onClick=${() => go('/photo')}>📸 Mes 5 mots du jour</button>
    </div>
    <div class="map">
      ${LEVELS.map((lv) => {
        const lessons = ID_LESSONS.filter((l) => l.level === lv.n);
        return html`<section class="island" style=${`--c:${lv.color}`}>
          <div class="island-head"><span class="island-icon">${lv.icon}</span><div><small>Niveau ${lv.n}</small><b>${lv.title}</b><div class="muted small">${lv.fr}</div></div></div>
          ${lessons.map((l) => {
            const open = isLessonUnlocked(l.id, s);
            const done = s.lessons[l.id];
            return html`<button class=${'stop' + (open ? '' : ' locked') + (done ? ' done' : '')} disabled=${!open} onClick=${() => go('/learn/' + l.id)}>
              <span class="stop-dot">${done ? '✓' : open ? l.icon : '🔒'}</span>
              <span class="grow"><b>${l.title}</b><span class="muted small block">${l.sub}</span></span>
              ${done && html`<span class="pill ok">${done.best} %</span>`}
            </button>`;
          })}
        </section>`;
      })}
    </div>
    <p class="muted small center">Besoin des consignes de classe tout de suite ? Active « Tout débloquer » dans les Réglages.</p>
  </div>`;
}

export function LessonView({ id }) {
  const s = useStore();
  const lesson = ID_LESSONS.find((l) => l.id === id);
  const [mode, setMode] = useState('learn');
  const [runKey, setRunKey] = useState(0);
  const items = useMemo(() => (lesson ? idLessonExercises(lesson) : []), [lesson, runKey]);
  const pairs = useMemo(() => (lesson ? uniquePairs(lesson.words.map((w) => [w.id, w.fr]), 5) : []), [lesson, runKey]);
  if (!lesson) return html`<div class="page"><${Back} to="/learn" /><${Empty} icon="🤷">Leçon introuvable.</${Empty}></div>`;
  if (!isLessonUnlocked(id, s)) return html`<div class="page"><${Back} to="/learn" /><${Empty} icon="🔒">Termine la leçon précédente pour débloquer celle-ci.</${Empty}></div>`;

  if (mode === 'match') return html`<div class="page narrow">
    <${Match} pairs=${pairs} onDone=${() => setMode('practice')} title="Échauffement : associe indonésien et français" />
  </div>`;

  if (mode === 'practice') return html`<div class="page narrow">
    <${Session} items=${items} finishLabel="Terminer la leçon ✓" onExit=${() => setMode('learn')}
      onFinish=${(pct) => { finishLesson(lesson.id, pct, lesson.words.map((w) => w.key)); setMode('done'); }} />
  </div>`;

  if (mode === 'done') {
    const next = ID_LESSONS[ID_LESSONS.indexOf(lesson) + 1];
    return html`<div class="page center-page">
      <div class="result-emoji">🏝️</div>
      <h2>Leçon terminée !</h2>
      <p class="muted">Les ${lesson.words.length} mots de la leçon sont ajoutés à tes flashcards. Reviens demain pour les réviser.</p>
      <button class="btn primary" onClick=${() => go('/flashcards/review/' + lesson.id)}>🃏 Réviser ces mots maintenant</button>
      ${next && html`<button class="btn coral" onClick=${() => { go('/learn/' + next.id); setMode('learn'); }}>Leçon suivante : ${next.title} →</button>`}
      <button class="btn ghost" onClick=${() => go('/learn')}>Retour à la carte</button>
    </div>`;
  }

  return html`<div class="page">
    <${Back} to="/learn" label="Carte" />
    <div class="lesson-head">
      <span class="lesson-icon">${lesson.icon}</span>
      <div><small class="muted">Niveau ${lesson.level} · ${LEVELS[lesson.level - 1].title}</small><h1>${lesson.title}</h1><p class="muted">${lesson.sub}</p></div>
    </div>
    <div class="sticky-cta"><button class="btn primary lg block" onClick=${() => { setRunKey(runKey + 1); setMode('match'); }}>▶ Commencer les exercices (${items.length + 1})</button></div>
    <h2>📚 Vocabulaire et phrases (${lesson.words.length})</h2>
    <div class="words">${lesson.words.map((w) => html`<${WordRow} w=${w} />`)}</div>
    <h2>🧩 ${lesson.grammar.title}</h2>
    <div class="card grammar">${lesson.grammar.points.map((p) => html`<p>${p}</p>`)}</div>
    <h2>✍️ Phrases modèles</h2>
    <div class="card">${lesson.build.map((b) => html`<div class="model"><b>${b.a}</b> <${AudioBtn} text=${b.a} /><span class="muted"> — ${b.fr}</span></div>`)}</div>
  </div>`;
}

// Lexique : recherche dans tous les contenus (FR, ID, EN).
export function Lexicon() {
  const [q, setQ] = useState('');
  const n = normalize(q);
  const idRes = n.length < 2 ? [] : ALL_ID_WORDS.filter((w) => [w.id, w.fr, w.en, w.ex, w.exFr].some((t) => normalize(t).includes(n)));
  const enRes = n.length < 2 ? [] : EN_ALL.flatMap((l) => l.vocab).filter((w) => [w.en, w.id, w.fr].some((t) => normalize(t).includes(n)));
  return html`<div class="page">
    <${Back} />
    <h1>🔎 Lexique</h1>
    <input class="input big" autofocus placeholder="ex. merci, comprendre, happy, makan…" value=${q} onInput=${(e) => setQ(e.target.value)} autocapitalize="off" />
    ${n.length >= 2 && !idRes.length && !enRes.length && html`<${Empty} icon="🌊">Aucun résultat. Ajoute-le à « Words I Heard Today » !</${Empty}>`}
    ${idRes.length > 0 && html`<h2>🇮🇩 Indonésien (${idRes.length})</h2><div class="words">${idRes.map((w) => html`<${WordRow} w=${w} />`)}</div>`}
    ${enRes.length > 0 && html`<h2>🇬🇧 Vocabulaire de classe (${enRes.length})</h2>
      <div class="card-list">${enRes.map((w) => html`<div class="card-row"><span class="thumb emoji">${w.emoji}</span><div class="grow"><b>${w.en}</b> <${AudioBtn} text=${w.en} lang="en" />
      <div>🇮🇩 ${w.id} <${AudioBtn} text=${w.id} lang="id" /></div><div class="muted">🇫🇷 ${w.fr}</div></div></div>`)}</div>`}
    ${n.length < 2 && html`<p class="muted">Tape au moins 2 lettres. La recherche couvre ${ALL_ID_WORDS.length} expressions indonésiennes et ${EN_ALL.reduce((a, l) => a + l.vocab.length, 0)} mots d'anglais.</p>`}
  </div>`;
}
