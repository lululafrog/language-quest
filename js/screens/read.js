// « Baca » : lire des comptines et des légendes, toucher un mot pour sa traduction,
// le ranger dans « Kata-kataku » (par domaine) et le réviser chaque jour.
import { html, useState, useEffect, useMemo, useRef } from '../vendor/preact-htm.js';
import { useStore, saveWord, removeWord, markRead, rateCard, today } from '../store.js';
import { isDue } from '../fsrs.js';
import { speak } from '../speech.js';
import { go, AudioBtn, Confetti, shuffle, Empty } from '../ui.js';
import { confirmBox } from '../dialog.js';
import { TEXTS, TEXT_BY_ID } from '../data/texts.js';
import { DOMAINS, DOMAIN, lookup, tokens } from '../data/words.js';
import { B, progress } from '../i18n.js';

const KIND = { song: B('Lagu', 'Song'), story: B('Cerita', 'Story') };
const dueWords = (s) => Object.keys(s.wordbank || {}).filter((w) => isDue(s.cards['w:' + w]) || !s.cards['w:' + w]);

// ---------- Bibliothèque ----------
export function Library() {
  const s = useStore();
  const n = Object.keys(s.wordbank || {}).length;
  const due = dueWords(s).length;
  const shelf = (kind) => TEXTS.filter((t) => t.kind === kind).map((t) => html`
    <button class="book" style=${`--bc:${t.color}`} onClick=${() => go('/s/read/' + t.id)}>
      <span class="book-cover">${t.cover}</span>
      <b>${t.title}</b><span class="small">🇮🇩 ${t.titleId}</span>
      <span class="book-meta">${'●'.repeat(t.level)}${'○'.repeat(3 - t.level)}${s.reads?.[t.id] ? ' · ✅' : ''}</span>
    </button>`);
  return html`<div class="page narrow student">
    <h1>📚 Baca (Read)</h1>
    <p class="muted">Sentuh kata yang belum kamu tahu: lihat artinya dan simpan! (Tap a word you don't know: see its meaning and save it!)</p>
    <button class="todo words-cta" onClick=${() => go('/s/words')}>
      <span class="todo-ic">⭐</span><span class="grow"><b>Kata-kataku (My words) · ${n}</b>
      <span class="muted small block">${due ? `${due} kata untuk diulang hari ini (to review today)` : n ? 'Semua sudah diulang! (All reviewed!)' : 'Belum ada kata. (No words yet.)'}</span></span><span class="go">▶</span></button>
    <h2>🎵 ${B('Lagu', 'Songs')}</h2><div class="shelf">${shelf('song')}</div>
    <h2>📖 ${B('Cerita rakyat', 'Folk tales')}</h2><div class="shelf">${shelf('story')}</div>
  </div>`;
}

// ---------- Lecteur ----------
export function Reader({ id }) {
  const t = TEXT_BY_ID[id];
  const s = useStore();
  const [sel, setSel] = useState(null);
  const [showId, setShowId] = useState(false);
  const [playing, setPlaying] = useState(-1);
  const [done, setDone] = useState(false);
  const stop = useRef(false);
  useEffect(() => () => { stop.current = true; speechSynthesis?.cancel?.(); }, []);
  if (!t) return html`<div class="page narrow"><${Empty} icon="📚">?</${Empty}></div>`;
  const bank = s.wordbank || {};

  const tap = (tk, li) => {
    const hit = lookup(tk.t);
    if (!hit) return;
    speak(hit.word, 'en');
    setSel({ ...hit, li });
  };
  // Lecture de tout le texte, ligne par ligne (karaoké).
  const playAll = async () => {
    if (playing >= 0) { stop.current = true; speechSynthesis?.cancel?.(); setPlaying(-1); return; }
    stop.current = false;
    for (let i = 0; i < t.lines.length && !stop.current; i++) {
      setPlaying(i);
      await new Promise((res) => {
        const u = speak(t.lines[i][0], 'en', 0.8);
        const done = () => setTimeout(res, 250);
        if (u && 'onend' in u) { u.onend = done; u.onerror = done; } else setTimeout(res, 2500);
      });
    }
    setPlaying(-1);
  };
  const finish = () => {
    if (!s.reads?.[t.id] || s.reads[t.id] !== today()) progress('read');
    markRead(t.id);
    setDone(true);
  };

  return html`<div class="page narrow reader" style=${`--bc:${t.color}`}>
    <div class="row between"><button class="btn ghost sm" onClick=${() => go('/s/read')}>← Baca (Read)</button>
      <label class="check small"><input type="checkbox" checked=${showId} onChange=${(e) => setShowId(e.target.checked)} /> 🇮🇩 ${B('Terjemahan', 'Translation')}</label></div>
    <div class="reader-head"><span class="reader-cover">${t.cover}</span>
      <div><small>${KIND[t.kind]}</small><h1>${t.title}</h1><span class="muted">🇮🇩 ${t.titleId}</span>${t.note && html`<span class="small block">${t.note}</span>`}</div></div>
    <button class=${'btn block ' + (playing >= 0 ? 'ghost' : 'primary')} onClick=${playAll}>${playing >= 0 ? '⏹ ' + B('Berhenti', 'Stop') : '🔊 ' + B('Dengarkan semua', 'Listen to all')}</button>
    <div class="text">${t.lines.map(([en, idl], li) => html`
      <p class=${'line' + (playing === li ? ' playing' : '')}>
        ${tokens(en).map((tk) => (tk.w
          ? html`<span class=${'word' + (bank[lookup(tk.t)?.base] ? ' saved' : '') + (sel && sel.li === li && clean2(tk.t) === sel.word ? ' on' : '')} onClick=${() => tap(tk, li)}>${tk.t}</span>`
          : tk.t))}
        <button class="line-audio" onClick=${() => speak(en, 'en', 0.85)} aria-label="Listen">🔊</button>
        ${showId && html`<span class="line-id">🇮🇩 ${idl}</span>`}
      </p>`)}</div>
    ${!done ? html`<button class="btn coral lg block" onClick=${finish}>✅ ${B('Selesai membaca', 'I finished reading')}</button>`
      : html`<div class="card center"><${Confetti} /><div class="giant">🎉</div><b>${B('Hebat! Kamu selesai membaca!', 'Great! You finished reading!')}</b>
        <div class="row center wrap" style="margin-top:.6rem"><button class="btn primary" onClick=${() => go('/s/words')}>⭐ Kata-kataku</button><button class="btn ghost" onClick=${() => go('/s/read')}>📚 ${B('Buku lain', 'Another one')}</button></div></div>`}
    ${sel && html`<${WordSheet} sel=${sel} line=${t.lines[sel.li]} src=${t.id} saved=${!!bank[sel.base]} onClose=${() => setSel(null)} />`}
  </div>`;
}
const clean2 = (t) => t.toLowerCase().replace(/[’]/g, "'").replace(/^[^a-z]+|[^a-z]+$/g, '');

function WordSheet({ sel, line, src, saved, onClose }) {
  const d = DOMAIN[sel.d];
  return html`<div class="sheet-bg" onClick=${onClose}>
    <div class="sheet" onClick=${(e) => e.stopPropagation()}>
      <div class="row between"><span class="dom-chip">${d.icon} ${d.id} (${d.en})</span><button class="btn ghost sm" onClick=${onClose}>✕</button></div>
      <div class="sheet-word">${sel.word} <${AudioBtn} text=${sel.word} lang="en" /></div>
      ${sel.base !== sel.word && html`<div class="muted small">${B('bentuk dasar', 'base form')}: <b>${sel.base}</b></div>`}
      <div class="sheet-id">🇮🇩 ${sel.id}</div>
      <div class="sheet-line">« ${line[0]} »<span class="muted small block">🇮🇩 ${line[1]}</span></div>
      ${saved ? html`<button class="btn ghost block" disabled>✓ ${B('Sudah tersimpan', 'Already saved')}</button>`
        : html`<button class="btn coral lg block" onClick=${() => { saveWord(sel.base, { id: sel.id, d: sel.d, src, line: line[0], lineId: line[1] }); onClose(); }}>⭐ ${B('Simpan ke Kata-kataku', 'Save to My words')}</button>`}
    </div>
  </div>`;
}

// ---------- Mes mots ----------
export function MyWords() {
  const s = useStore();
  const bank = s.wordbank || {};
  const [view, setView] = useState('domain');
  const words = Object.entries(bank).map(([w, v]) => ({ w, ...v }));
  const due = dueWords(s);
  const groups = view === 'domain'
    ? DOMAINS.map((d) => ({ key: d.k, title: `${d.icon} ${d.id} (${d.en})`, items: words.filter((x) => x.d === d.k) }))
    : view === 'story'
      ? TEXTS.map((t) => ({ key: t.id, title: `${t.cover} ${t.title}`, items: words.filter((x) => x.src === t.id) }))
      : [{ key: 'new', title: B('Terbaru', 'Newest'), items: [...words].sort((a, b) => b.added - a.added) }];
  const del = async (w) => { if (await confirmBox(`Hapus « ${w} »? (Remove?)`)) removeWord(w); };
  return html`<div class="page narrow student">
    <button class="btn ghost sm" onClick=${() => go('/s/read')}>← Baca (Read)</button>
    <h1>⭐ Kata-kataku (My words)</h1>
    ${words.length === 0 ? html`<${Empty} icon="📚">${B('Baca cerita dan sentuh kata yang belum kamu tahu!', 'Read a story and tap the words you don\'t know!')}</${Empty}>
      <button class="btn primary block" onClick=${() => go('/s/read')}>📚 ${B('Mulai membaca', 'Start reading')}</button>` : html`
      <div class="review-cta">
        <div><b>${due.length ? `${due.length} ${B('kata untuk diulang hari ini', 'words to review today')}` : B('Semua sudah diulang hari ini! 🎉', 'All reviewed today!')}</b>
          <span class="small block">${words.length} ${B('kata tersimpan', 'saved words')}</span></div>
        <button class="btn coral lg" disabled=${!due.length} onClick=${() => go('/s/words/review')}>🔁 ${B('Ulangi', 'Review')}</button>
      </div>
      <div class="row wrap">${[['domain', '🗂️ ' + B('Per tema', 'By topic')], ['story', '📖 ' + B('Per cerita', 'By story')], ['new', '🆕 ' + B('Terbaru', 'Newest')]].map(([k, l]) => html`
        <button class=${'chip' + (view === k ? ' on' : '')} onClick=${() => setView(k)}>${l}</button>`)}</div>
      ${groups.filter((g) => g.items.length).map((g) => html`<h3>${g.title} <span class="muted small">· ${g.items.length}</span></h3>
        <div class="word-list">${g.items.map((x) => html`<div class="word-row">
          <${AudioBtn} text=${x.w} lang="en" />
          <span class="grow"><b>${x.w}</b> <span class="muted">= ${x.id}</span>
            ${view !== 'domain' && html`<span class="small block">${DOMAIN[x.d].icon} ${DOMAIN[x.d].id}</span>`}</span>
          <span class="word-level">${level(s.cards['w:' + x.w])}</span>
          <button class="btn ghost sm" onClick=${() => del(x.w)} aria-label="Remove">✕</button></div>`)}</div>`)}`}
  </div>`;
}

// Niveau de mémorisation affiché avec des petites fleurs.
function level(c) {
  if (!c || c.state === 'new') return '🌱';
  const days = c.s || 0;
  return days >= 21 ? '🌳' : days >= 5 ? '🌿' : '🌱';
}

// ---------- Révision du jour ----------
export function WordReview() {
  const s = useStore();
  const [queue] = useState(() => shuffle(dueWords(s)).slice(0, 15));
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [score, setScore] = useState(0);
  const w = queue[i];
  const x = w && s.wordbank[w];
  useEffect(() => { if (w) speak(w, 'en'); }, [i]);
  useEffect(() => { if (queue.length && i >= queue.length) progress('review'); }, [i >= queue.length]);
  if (!queue.length || i >= queue.length) return html`<div class="page narrow center-page student"><${Confetti} />
    <div class="giant">🌟</div><h1>${B('Selesai untuk hari ini!', 'Done for today!')}</h1>
    ${queue.length > 0 && html`<p>${score} / ${queue.length} ${B('kata diingat', 'words remembered')}</p>`}
    <button class="btn primary lg" onClick=${() => go('/s/words')}>⭐ Kata-kataku</button>
    <button class="btn ghost" onClick=${() => go('/s/read')}>📚 ${B('Baca lagi', 'Read more')}</button></div>`;
  const answer = (ok) => { rateCard('w:' + w, ok ? 3 : 1); if (ok) setScore(score + 1); setShown(false); setI(i + 1); };
  const line = x.line ? x.line.replace(new RegExp(`\\b(${w}\\w*)`, 'i'), '[$1]') : '';
  return html`<div class="page narrow student">
    <div class="row between"><button class="btn ghost sm" onClick=${() => go('/s/words')}>✕</button><span class="muted">${i + 1} / ${queue.length}</span></div>
    <div class="bar"><i style=${`width:${(i / queue.length) * 100}%`}></i></div>
    <div class="flash" onClick=${() => setShown(true)}>
      <span class="dom-chip">${DOMAIN[x.d].icon} ${DOMAIN[x.d].id}</span>
      <div class="flash-word">${w} <${AudioBtn} text=${w} lang="en" /></div>
      ${line && html`<div class="flash-line">« ${line.split(/(\[[^\]]+\])/).map((p) => (p.startsWith('[') ? html`<mark>${p.slice(1, -1)}</mark>` : p))} »</div>`}
      ${shown ? html`<div class="flash-id">🇮🇩 ${x.id}</div>` : html`<div class="muted">${B('Ingat artinya? Sentuh untuk melihat', 'Remember the meaning? Tap to see')} 👀</div>`}
    </div>
    ${shown ? html`<div class="row"><button class="btn ghost lg grow" onClick=${() => answer(false)}>😕 ${B('Lupa', 'Forgot')}</button>
        <button class="btn good lg grow" onClick=${() => answer(true)}>😀 ${B('Ingat!', 'Remembered!')}</button></div>`
      : html`<button class="btn coral lg block" onClick=${() => setShown(true)}>👀 ${B('Lihat artinya', 'See the meaning')}</button>`}
  </div>`;
}
