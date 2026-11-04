// « Mes 5 mots du jour » : photographier un objet, obtenir sa traduction, réviser en images.
import { html, useState, useMemo, useEffect, useRef } from '../vendor/preact-htm.js';
import { useStore, update, uid, today, recordAnswer, PHOTO_DECK } from '../store.js';
import { EN_ALL } from '../data/english.js';
import { VERBS } from '../data/grammar.js';
import { speak } from '../speech.js';
import { AudioBtn, Back, go, shuffle, sample, Confetti, Empty } from '../ui.js';
import { confirmBox } from '../dialog.js';
import { T, isStudentUi, progress } from '../i18n.js';

const BackP = ({ to }) => html`<${Back} to=${isStudentUi() ? '/s/play' : to} label=${isStudentUi() ? 'Main (Play)' : to === '/photo' ? 'Mes photos' : 'Flashcards'} />`;

const GOAL = 5;

export const photoCards = (s) => s.custom.cards.filter((c) => c.deckId === PHOTO_DECK && c.image);
const todays = (s) => photoCards(s).filter((c) => c.day === today());

// Jours d'affilée avec l'objectif atteint.
function goalStreak(s) {
  const per = {};
  photoCards(s).forEach((c) => { per[c.day] = (per[c.day] || 0) + 1; });
  let n = 0;
  const d = new Date();
  if ((per[today(d)] || 0) < GOAL) d.setDate(d.getDate() - 1);
  while ((per[today(d)] || 0) >= GOAL) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

// ---------- Dictionnaire intégré (hors ligne) ----------
const strip = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\(.*?\)/g, '').trim();
const DICT = [
  ...EN_ALL.flatMap((l) => l.vocab.filter((w) => !w.forms).map((w) => ({ en: w.en, id: w.id, fr: w.fr, emoji: w.abstract ? '' : w.emoji }))),
  ...VERBS.map((v) => ({ en: 'to ' + v.base, id: v.id, fr: v.fr, emoji: v.emoji })),
];
function lookup(q) {
  const n = strip(q);
  if (n.length < 2) return [];
  const keys = (e) => [e.en, e.id, e.fr].flatMap((x) => x.split(/[,/]/)).map(strip);
  const exact = DICT.filter((e) => keys(e).includes(n));
  const starts = n.length >= 3 ? DICT.filter((e) => !exact.includes(e) && keys(e).some((k) => k.startsWith(n))) : [];
  return [...exact, ...starts].slice(0, 5);
}

// ---------- Claude (version en ligne uniquement) ----------
let samplerP;
const getSampler = () => (samplerP ||= (window.claude?.use ? window.claude.use('sample').catch(() => null) : Promise.resolve(null)));

const ASK = `You help beginner English learners (Indonesian schoolgirls in Lombok, and their French teacher).
Answer with JSON only, no prose: {"en": "...", "id": "...", "fr": "...", "emoji": "...", "example": "..."}
- en: the common, simple English noun, lowercase, singular, without article (plural only if the word is normally plural, like "glasses")
- id: the everyday Indonesian word
- fr: the French word, without article
- emoji: one emoji that shows it, or ""
- example: a very short, simple English sentence with the word (max 6 words)`;

const clean = (r) => {
  const t = (v) => (typeof v === 'string' ? v.trim().slice(0, 60) : '');
  return r && t(r.en) ? { en: t(r.en).toLowerCase(), id: t(r.id), fr: t(r.fr), emoji: t(r.emoji).slice(0, 8), example: t(r.example) } : null;
};

async function recognize(blob) {
  const s = await getSampler();
  if (!s) return null;
  const lim = await s.limits().catch(() => null);
  if (!lim?.images) return null;
  return clean(await s.json(`${ASK}\nLook at the photo and name the ONE main object in the middle of it.`, { images: [blob], modelTier: 'quick' }));
}
async function translate(word) {
  const s = await getSampler();
  if (!s) return null;
  return clean(await s.json(`${ASK}\nThe word or object is: "${word.slice(0, 60)}" (it may be written in French, Indonesian or English).`, { modelTier: 'quick' }));
}

// Image réduite : petite pour le stockage, plus grande pour la reconnaissance.
function shrink(file, max, quality, asBlob) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const r = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement('canvas');
      cv.width = Math.round(img.width * r); cv.height = Math.round(img.height * r);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      if (asBlob) cv.toBlob((b) => (b ? res(b) : rej(new Error('image'))), 'image/jpeg', quality);
      else res(cv.toDataURL('image/jpeg', quality));
    };
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}

// ---------- ÉCRAN PRINCIPAL ----------
export function PhotoHome() {
  const s = useStore();
  const [draft, setDraft] = useState(null);
  const [canAI, setCanAI] = useState(false);
  useEffect(() => { getSampler().then((x) => setCanAI(!!x)); }, []);
  const tw = todays(s);
  const all = photoCards(s);
  const streak = goalStreak(s);

  const onFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const image = await shrink(file, 360, 0.7);
      const d = { image, en: '', id: '', fr: '', emoji: '', example: '', status: canAI ? 'looking' : 'manual' };
      setDraft(d);
      if (canAI) {
        const blob = await shrink(file, 800, 0.8, true);
        recognize(blob)
          .then((r) => setDraft((cur) => cur && cur.image === image ? (r ? { ...cur, ...r, status: 'found' } : { ...cur, status: 'manual' }) : cur))
          .catch(() => setDraft((cur) => cur && cur.image === image ? { ...cur, status: 'manual' } : cur));
      }
    } catch { setDraft(null); }
  };

  const byDay = useMemo(() => {
    const g = {};
    all.forEach((c) => { (g[c.day] = g[c.day] || []).push(c); });
    return Object.entries(g).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [all.length]);

  return html`<div class="page narrow photo-page">
    <${BackP} to="/flashcards" />
    <h1>📸 ${T('Mes 5 mots du jour', '5 kata hari ini (5 words today)')}</h1>
    <p class="muted">${T('Photographie 5 objets que tu vois aujourd\'hui : chacun devient une carte avec l\'image et sa traduction en anglais (et en indonésien).', 'Foto 5 benda yang kamu lihat hari ini. Setiap foto jadi kartu dengan kata bahasa Inggrisnya! (Take photos of 5 things you see today!)')}</p>

    <div class="goal card">
      <div class="goal-dots">${Array.from({ length: GOAL }, (_, i) => html`<span class=${i < tw.length ? 'on' : ''}>${i < tw.length ? (tw[i].emoji || '✓') : i + 1}</span>`)}</div>
      <div><b>${tw.length >= GOAL ? T('🎉 Objectif du jour atteint !', '🎉 Target hari ini tercapai! (Goal reached!)') : `${tw.length}/${GOAL} ${T('aujourd\'hui', 'hari ini (today)')}`}</b>
        <span class="muted small block">${tw.length >= GOAL ? T('Tu peux en ajouter autant que tu veux.', 'Kamu boleh tambah sebanyak yang kamu mau. (Add as many as you want.)') : T(`Encore ${GOAL - tw.length} mot${GOAL - tw.length > 1 ? 's' : ''}.`, `${GOAL - tw.length} kata lagi.`)}${streak > 0 ? ` · 🔥 ${streak} ${T('jour(s) d\'affilée', 'hari berturut-turut (days in a row)')}` : ''}</span></div>
    </div>

    ${draft ? html`<${Draft} draft=${draft} setDraft=${setDraft} canAI=${canAI} />` : html`
      <div class="photo-btns">
        <label class="btn coral xl block">📸 ${T('Prendre une photo', 'Ambil foto (Take a photo)')}<input type="file" accept="image/*" capture="environment" hidden onChange=${onFile} /></label>
        <label class="btn ghost block">🖼️ ${T('Choisir une image de la galerie', 'Pilih dari galeri (From gallery)')}<input type="file" accept="image/*" hidden onChange=${onFile} /></label>
      </div>
      <p class="muted small">${canAI ? '✨ Claude reconnaît l\'objet et propose la traduction. Tu peux toujours la corriger.' : T('Écris le nom de l\'objet en français, en indonésien ou en anglais : le dictionnaire de l\'appli propose la traduction. (La reconnaissance automatique de la photo marche dans la version claude.ai.)', 'Tulis nama bendanya: kamus akan memberi terjemahannya. (Write the name: the dictionary gives the translation.)')}</p>`}

    <h2>🎲 ${T('Réviser en images', 'Belajar dengan gambar (Learn with pictures)')}</h2>
    ${all.length === 0 ? html`<${Empty} icon="🖼️">${T('Tes cartes photo apparaîtront ici.', 'Kartu fotomu akan muncul di sini. (Your photo cards will appear here.)')}</${Empty}>` : html`
      <div class="game-grid">
        <button class="game-tile" onClick=${() => go('/photo/cards')}><span class="game-icon">🃏</span><b>${T('Cartes photo', 'Kartu foto (Photo cards)')}</b><span class="muted small">${T('L\'image, puis la traduction en dessous. Sans limite.', 'Gambar dulu, lalu katanya. Sepuasnya! (Picture first, then the word.)')}</span></button>
        <button class="game-tile" disabled=${all.length < 4} onClick=${() => go('/photo/find')}><span class="game-icon">🔎</span><b>${T('Trouve la photo', 'Cari fotonya (Find the photo)')}</b><span class="muted small">${all.length < 4 ? T('Dès 4 photos', 'Minimal 4 foto (4 photos needed)') : T('Un mot, 4 photos : touche la bonne', 'Satu kata, 4 foto: pilih yang benar (One word, 4 photos)')}</span></button>
        ${!isStudentUi() && html`<button class="game-tile" disabled=${all.length < 4} onClick=${() => go('/games/duel')}><span class="game-icon">⚔️</span><b>Duel photo</b><span class="muted small">${all.length < 4 ? 'Dès 4 photos' : 'Contre une copine : thème « 📸 Mes photos »'}</span></button>`}
      </div>
      ${!isStudentUi() && html`<p class="muted small">Tes photos entrent aussi dans la révision espacée (deck « My Photo Words »).</p>`}`}

    ${byDay.map(([day, cards]) => html`<h3>${day === today() ? T('Aujourd\'hui', 'Hari ini (Today)') : new Date(day + 'T12:00').toLocaleDateString(T('fr-FR', 'id-ID'), { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
      <div class="photo-grid">${cards.map((c) => html`<${PhotoTile} c=${c} />`)}</div>`)}
  </div>`;
}

function PhotoTile({ c }) {
  const del = async () => { if (await confirmBox(T(`Supprimer « ${c.front} » ?`, `Hapus « ${c.front} »?`))) update((s) => { s.custom.cards = s.custom.cards.filter((x) => x.id !== c.id); delete s.cards['c:' + c.id]; }); };
  return html`<div class="photo-tile">
    <img src=${c.image} alt=${c.front} loading="lazy" />
    <div class="pt-text"><b>${c.front}</b> <${AudioBtn} text=${c.front} lang="en" /><span class="small muted block">🇮🇩 ${c.idw || '—'}${isStudentUi() ? '' : ` · 🇫🇷 ${c.fr || '—'}`}</span></div>
    <button class="pt-del" onClick=${del} aria-label="Supprimer">✕</button>
  </div>`;
}

function Draft({ draft, setDraft, canAI }) {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const hits = useMemo(() => lookup(q), [q]);
  const set = (k, v) => setDraft({ ...draft, [k]: v });
  const use = (e) => { setDraft({ ...draft, en: e.en, id: e.id, fr: e.fr, emoji: e.emoji || '', status: 'found' }); setQ(''); speak(e.en, 'en'); };
  const ask = async () => {
    setBusy(true); setErr('');
    try { const r = await translate(q); if (r) use(r); else setErr('Pas de réponse : remplis les cases à la main.'); }
    catch { setErr('Traduction indisponible pour le moment : remplis les cases à la main.'); }
    setBusy(false);
  };
  const save = (e) => {
    e.preventDefault();
    if (!draft.en.trim()) return;
    update((s) => {
      s.custom.cards.push({
        id: uid(), deckId: PHOTO_DECK, image: draft.image, lang: 'en', theme: 'photo', created: Date.now(), day: today(),
        front: draft.en.trim(), back: [draft.id && `🇮🇩 ${draft.id.trim()}`, draft.fr && `🇫🇷 ${draft.fr.trim()}`].filter(Boolean).join(' · ') || '—',
        idw: draft.id.trim(), fr: draft.fr.trim(), emoji: draft.emoji, example: draft.example,
      });
    });
    speak(draft.en, 'en');
    progress('photo');
    setDraft(null);
  };
  return html`<form class="card draft" onSubmit=${save}>
    <div class="draft-top">
      <img src=${draft.image} alt="" class="draft-img" />
      <div class="grow">
        ${draft.status === 'looking' && html`<div class="looking">🔎 Claude regarde ta photo…</div>`}
        ${draft.status === 'found' && draft.en && html`<div class="found"><span class="found-em">${draft.emoji}</span><b class="huge-ish">${draft.en}</b> <${AudioBtn} text=${draft.en} lang="en" />
          ${draft.example && html`<div class="muted small">« ${draft.example} »</div>`}</div>`}
        ${draft.status !== 'looking' && html`<label class="small">${T('C\'est quoi ? (français, indonésien ou anglais)', 'Ini apa? (What is it?)')}
          <input id="photo-search" class="input" value=${q} onInput=${(e) => setQ(e.target.value)} placeholder=${T('ex. chaise, kursi, chair', 'contoh (e.g.): kursi, chair')} autocapitalize="off" /></label>
          ${hits.length > 0 && html`<div class="row wrap">${hits.map((h) => html`<button type="button" class="chip" onClick=${() => use(h)}>${h.emoji} ${h.en} · ${h.id}</button>`)}</div>`}
          ${q.trim().length >= 2 && canAI && html`<button type="button" class="btn ghost sm" disabled=${busy} onClick=${ask}>${busy ? '…' : `✨ Traduire « ${q.trim()} » avec Claude`}</button>`}
          ${err && html`<div class="small ko-text">${err}</div>`}`}
      </div>
    </div>
    <div class="draft-fields">
      <label>🇬🇧 ${T('Anglais', 'Inggris (English)')}<input id="photo-en" class="input" value=${draft.en} onInput=${(e) => set('en', e.target.value)} required autocapitalize="off" /></label>
      <label>🇮🇩 ${T('Indonésien', 'Indonesia (Indonesian)')}<input id="photo-id" class="input" value=${draft.id} onInput=${(e) => set('id', e.target.value)} autocapitalize="off" /></label>
      ${!isStudentUi() && html`<label>🇫🇷 Français<input id="photo-fr" class="input" value=${draft.fr} onInput=${(e) => set('fr', e.target.value)} /></label>`}
    </div>
    <div class="row">
      <button type="button" class="btn ghost" onClick=${() => setDraft(null)}>${T('Annuler', 'Batal (Cancel)')}</button>
      <button class="btn primary grow" disabled=${!draft.en.trim()}>✓ ${T('Ajouter à mes cartes', 'Simpan kartu (Save card)')}</button>
    </div>
  </form>`;
}

// ---------- RÉVISION EN IMAGES (illimitée) ----------
function Scope({ scope, setScope, s }) {
  const n = { today: todays(s).length, all: photoCards(s).length };
  return html`<div class="row wrap">${[['today', T('Aujourd\'hui', 'Hari ini (Today)')], ['all', T('Toutes mes photos', 'Semua fotoku (All my photos)')]].map(([k, t]) =>
    html`<button class=${'chip' + (scope === k ? ' on' : '')} disabled=${!n[k]} onClick=${() => setScope(k)}>${t} (${n[k]})</button>`)}</div>`;
}

export function PhotoCards() {
  const s = useStore();
  const [scope, setScope] = useState(todays(s).length >= 3 ? 'today' : 'all');
  const pool = scope === 'today' ? todays(s) : photoCards(s);
  const [queue, setQueue] = useState([]);
  const [shown, setShown] = useState(false);
  const [stats, setStats] = useState({ ok: 0, ko: 0, round: 1 });
  useEffect(() => { setQueue(shuffle(pool.map((c) => c.id))); setShown(false); }, [scope, pool.length]);
  const c = pool.find((x) => x.id === queue[0]);
  const reveal = () => { setShown(true); speak(c.front, 'en'); };
  const answer = (ok) => {
    recordAnswer(ok, ok ? 2 : 0);
    const rest = queue.slice(1);
    // Une carte ratée revient trois cartes plus loin.
    if (!ok) rest.splice(Math.min(3, rest.length), 0, c.id);
    setQueue(rest); setShown(false);
    setStats({ ...stats, ok: stats.ok + (ok ? 1 : 0), ko: stats.ko + (ok ? 0 : 1) });
  };
  if (!pool.length) return html`<div class="page narrow"><${BackP} to="/photo" /><${Empty} icon="📸">${T('Prends d\'abord quelques photos.', 'Ambil beberapa foto dulu. (Take some photos first.)')}</${Empty}></div>`;
  return html`<div class="page narrow photo-play">
    <div class="row between"><${BackP} to="/photo" /><span class="pill">✓ ${stats.ok} · ✗ ${stats.ko}</span></div>
    <h1>🃏 ${T('Cartes photo', 'Kartu foto (Photo cards)')}</h1>
    <${Scope} scope=${scope} setScope=${setScope} s=${s} />
    ${!c ? html`<div class="center-page"><${Confetti} /><div class="giant">🌟</div><h2>${T(`Tour ${stats.round} terminé !`, `Putaran ${stats.round} selesai!`)}</h2>
        <button class="btn primary lg" onClick=${() => { setQueue(shuffle(pool.map((x) => x.id))); setStats({ ok: 0, ko: 0, round: stats.round + 1 }); }}>🔁 ${T('Encore un tour', 'Sekali lagi (Again)')}</button></div>`
      : html`<div class="pcard" onClick=${() => !shown && reveal()}>
        <img src=${c.image} alt="" />
        <div class="pcard-under">${shown
          ? html`<div class="huge-ish">${c.front}</div><div class="muted">🇮🇩 ${c.idw || '—'}${isStudentUi() ? '' : ` · 🇫🇷 ${c.fr || '—'}`}</div>${c.example && html`<div class="small">« ${c.example} »</div>`}`
          : html`<div class="muted">What is it? 🤔 ${T('Dis-le à voix haute, puis touche la carte', 'Ucapkan, lalu sentuh kartunya (Say it, then touch the card)')}</div>`}</div>
      </div>
      ${shown ? html`<div class="row"><${AudioBtn} text=${c.front} lang="en" big />
          <button class="btn ghost grow" onClick=${() => answer(false)}>😕 ${T('Pas encore', 'Belum tahu (Not yet)')}</button>
          <button class="btn good grow" onClick=${() => answer(true)}>😀 ${T('Je savais', 'Aku tahu! (I knew it!)')}</button></div>`
        : html`<button class="btn coral lg block" onClick=${reveal}>👀 ${T('Voir la traduction', 'Lihat jawabannya (See the answer)')}</button>`}
      <p class="muted small center">${T(`${queue.length} carte${queue.length > 1 ? 's' : ''} dans ce tour`, `${queue.length} kartu lagi`)}</p>`}
  </div>`;
}

export function PhotoFind() {
  const s = useStore();
  const all = photoCards(s);
  const [n, setN] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);
  const round = useMemo(() => {
    if (all.length < 4) return null;
    const target = all[Math.floor(Math.random() * all.length)];
    const others = sample(all.filter((c) => c.front.toLowerCase() !== target.front.toLowerCase()), 3);
    return { target, opts: shuffle([target, ...others]) };
  }, [n, all.length]);
  useEffect(() => { if (round) speak(round.target.front, 'en'); }, [round]);
  if (!round) return html`<div class="page narrow"><${BackP} to="/photo" /><${Empty} icon="📸">${T('Il faut au moins 4 photos.', 'Perlu minimal 4 foto. (4 photos needed.)')}</${Empty}></div>`;
  const tap = (c) => {
    if (picked) return;
    const ok = c.id === round.target.id;
    setPicked(c.id);
    if (ok) setScore(score + 1);
    recordAnswer(ok, ok ? 2 : 0);
    setTimeout(() => { setPicked(null); setN(n + 1); }, ok ? 900 : 1700);
  };
  return html`<div class="page narrow photo-play">
    <div class="row between"><${BackP} to="/photo" /><span class="pill">⭐ ${score} / ${n + (picked ? 1 : 0)}</span></div>
    <div class="touch-prompt"><span>Find: ${round.target.front}</span><${AudioBtn} text=${round.target.front} lang="en" /></div>
    <div class="find-grid">${round.opts.map((c) => {
      let cls = 'find-opt';
      if (picked) { if (c.id === round.target.id) cls += ' right'; else if (c.id === picked) cls += ' wrong'; }
      return html`<button class=${cls} onClick=${() => tap(c)}><img src=${c.image} alt="" />${picked && html`<span>${c.front}</span>`}</button>`;
    })}</div>
  </div>`;
}
