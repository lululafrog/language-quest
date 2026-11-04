import { html, useState, useEffect, useRef, useMemo } from '../vendor/preact-htm.js';
import { useStore, rateCard, update, uid, addStudyTime, getState, WIH_DECK } from '../store.js';
import { RATINGS, previewLabel } from '../fsrs.js';
import { AudioBtn, FavBtn, Mastery, Back, go, Confetti, Empty } from '../ui.js';
import { buildQueue, cardContent, deckList, deckStats, deckKeys } from '../cards.js';
import { toCSV, parseCSV } from '../csv.js';
import { notify, confirmBox, promptBox, exportText } from '../dialog.js';
import { ID_LESSONS } from '../data/indonesian.js';

const FLAG = { id: '🇮🇩', en: '🇬🇧', fr: '🇫🇷' };

export function FlashcardsHome() {
  const s = useStore();
  const decks = deckList(s);
  const mine = decks.filter((d) => d.custom);
  const idDecks = decks.filter((d) => d.lang === 'id' && !d.custom);
  const enDecks = decks.filter((d) => d.en);
  const all = deckStats('all', s);
  return html`<div class="page">
    <h1>🃏 Flashcards</h1>
    <p class="muted">Révision espacée FSRS : l'appli te montre chaque carte juste avant que tu l'oublies.</p>
    <div class="hero-card teal">
      <div><div class="big-num">${deckStats('id-all', s).due + mine.reduce((a, d) => a + deckStats(d.id, s).due, 0)}</div>cartes à réviser</div>
      <button class="btn white" onClick=${() => go('/flashcards/review/all')}>▶ Réviser maintenant</button>
    </div>
    <button class="todo photo-cta" onClick=${() => go('/photo')}><span class="todo-ic">📸</span><span class="grow"><b>Mes 5 mots du jour</b><span class="muted small block">Prends un objet en photo, reçois sa traduction, révise en images autant que tu veux</span></span><span class="go">▶</span></button>
    <${QuickAdd} />
    <h2>Mes decks</h2>
    <div class="deck-grid">${mine.map((d) => html`<${DeckTile} d=${d} s=${s} />`)}
      <button class="deck-tile add" onClick=${async () => { const name = await promptBox('Nom du nouveau deck ?'); if (name) update((st) => { st.custom.decks.push({ id: 'deck-' + uid(), name, lang: 'id' }); }); }}>＋ Nouveau deck</button>
    </div>
    <div class="row wrap">
      <button class="btn ghost sm" onClick=${exportCSV}>⬇️ Exporter mes cartes (CSV)</button>
      <label class="btn ghost sm">⬆️ Importer un CSV<input type="file" accept=".csv,text/csv" hidden onChange=${importCSV} /></label>
    </div>
    <p class="muted small">Format CSV : deck, front, back, example, lang (id/en/fr), theme, pron. Compatible Excel et Google Sheets.</p>
    <h2>Indonésien</h2>
    <div class="deck-grid">${idDecks.map((d) => html`<${DeckTile} d=${d} s=${s} />`)}</div>
    <h2>Anglais (pour mes cours)</h2>
    <div class="deck-grid">${enDecks.map((d) => html`<${DeckTile} d=${d} s=${s} />`)}</div>
    <p class="muted small">Total : ${all.learned} cartes acquises.</p>
  </div>`;
}

function DeckTile({ d, s }) {
  const st = deckStats(d.id, s);
  return html`<div class="deck-tile" onClick=${() => go('/flashcards/deck/' + d.id)}>
    <div class="deck-icon">${d.icon}</div>
    <div class="deck-name">${d.name}</div>
    <div class="deck-meta">${st.total} cartes${st.due ? html` · <b class="due">${st.due} à revoir</b>` : ''}</div>
  </div>`;
}

function QuickAdd() {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [ok, setOk] = useState(false);
  const add = (e) => {
    e.preventDefault();
    if (!front.trim()) return;
    update((s) => { s.custom.cards.push({ id: uid(), deckId: WIH_DECK, front: front.trim(), back: back.trim(), lang: 'id', theme: 'heard', created: Date.now() }); });
    setFront(''); setBack(''); setOk(true); setTimeout(() => setOk(false), 1500);
  };
  return html`<form class="card quick-add" onSubmit=${add}>
    <div class="qa-title">👂 <b>Words I Heard Today</b> <span class="muted small">— note vite un mot entendu</span></div>
    <div class="qa-row">
      <input class="input" placeholder="Mot indonésien (ex. capek)" value=${front} onInput=${(e) => setFront(e.target.value)} autocapitalize="off" />
      <input class="input" placeholder="Sens (si tu le connais)" value=${back} onInput=${(e) => setBack(e.target.value)} />
      <button class="btn primary">${ok ? '✓ Ajouté' : 'Ajouter'}</button>
    </div>
  </form>`;
}

function exportCSV() {
  const s = getState();
  const deckName = (id) => s.custom.decks.find((d) => d.id === id)?.name || '';
  const rows = [['deck', 'front', 'back', 'example', 'lang', 'theme', 'pron'],
    ...s.custom.cards.map((c) => [deckName(c.deckId), c.front, c.back, c.example, c.lang, c.theme, c.pron])];
  exportText(`language-quest-cartes-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(rows));
}

function importCSV(e) {
  const f = e.target.files[0];
  if (!f) return;
  f.text().then((txt) => {
    const rows = parseCSV(txt);
    if (!rows.length) return notify('Fichier vide.');
    const head = rows[0].map((h) => h.trim().toLowerCase());
    const hasHead = head.includes('front');
    const col = (name, def) => (hasHead ? head.indexOf(name) : def);
    const c = { deck: col('deck', 0), front: col('front', 1), back: col('back', 2), example: col('example', 3), lang: col('lang', 4), theme: col('theme', 5), pron: col('pron', 6) };
    const data = hasHead ? rows.slice(1) : rows;
    let n = 0;
    update((s) => {
      data.forEach((r) => {
        const get = (k) => (c[k] >= 0 ? (r[c[k]] || '').trim() : '');
        if (!get('front')) return;
        const dn = get('deck') || 'Import';
        let deck = s.custom.decks.find((d) => d.name.toLowerCase() === dn.toLowerCase());
        if (!deck) { deck = { id: 'deck-' + uid(), name: dn, lang: get('lang') || 'id' }; s.custom.decks.push(deck); }
        s.custom.cards.push({ id: uid(), deckId: deck.id, front: get('front'), back: get('back'), example: get('example'), lang: get('lang') || deck.lang || 'id', theme: get('theme'), pron: get('pron') });
        n++;
      });
    });
    notify(`${n} carte(s) importée(s).`);
    e.target.value = '';
  });
}

export function DeckView({ id }) {
  const s = useStore();
  const deck = deckList(s).find((d) => d.id === id);
  const [editing, setEditing] = useState(null);
  if (!deck) return html`<div class="page"><${Back} to="/flashcards" /><${Empty} icon="🤷">Deck introuvable.</${Empty}></div>`;
  const keys = deckKeys(id, s);
  const st = deckStats(id, s);
  const custom = deck.custom;
  return html`<div class="page">
    <${Back} to="/flashcards" label="Flashcards" />
    <h1>${deck.icon} ${deck.name}</h1>
    <div class="row wrap">
      <span class="pill">${st.total} cartes</span><span class="pill">${st.fresh} nouvelles</span><span class="pill due">${st.due} à revoir</span><span class="pill ok">${st.learned} acquises</span>
    </div>
    <div class="row wrap">
      <button class="btn primary" disabled=${!keys.length} onClick=${() => go('/flashcards/review/' + id)}>▶ Réviser</button>
      ${custom && html`<button class="btn coral" onClick=${() => setEditing({})}>＋ Ajouter une carte</button>`}
      ${custom && !deck.special && html`<button class="btn ghost sm" onClick=${async () => { const n = await promptBox('Nouveau nom ?', deck.name); if (n) update((x) => { x.custom.decks.find((d) => d.id === id).name = n; }); }}>✏️ Renommer</button>
        <button class="btn ghost sm danger" onClick=${async () => { if (await confirmBox('Supprimer ce deck et ses cartes ?', 'Supprimer')) { update((x) => { x.custom.decks = x.custom.decks.filter((d) => d.id !== id); x.custom.cards = x.custom.cards.filter((c) => c.deckId !== id); }); go('/flashcards'); } }}>🗑️ Supprimer le deck</button>`}
    </div>
    ${editing && html`<${CardEditor} card=${editing} deckId=${id} onClose=${() => setEditing(null)} />`}
    ${!keys.length && html`<${Empty} icon="🗂️">${deck.special === 'photo' ? 'Prends en photo les objets de ta journée depuis « 📸 Mes 5 mots du jour ».' : deck.special ? 'Note ici les mots indonésiens entendus dans la journée.' : 'Aucune carte pour le moment.'}</${Empty}>`}
    <div class="card-list">${keys.map((k) => {
      const c = cardContent(k, s);
      if (!c) return null;
      return html`<div class="card-row">
        ${c.image ? html`<img src=${c.image} alt="" class="thumb" />` : c.emoji ? html`<span class="thumb emoji">${c.emoji}</span>` : null}
        <div class="grow"><b>${c.front}</b> <${AudioBtn} text=${c.front} lang=${c.lang} /><div class="muted">${c.back}</div>${c.pron && html`<div class="w-pron small">🗣️ ${c.pron}</div>`}</div>
        <${Mastery} id=${k} />
        ${k.startsWith('c:') ? html`<button class="icon-btn" title="Modifier" onClick=${() => setEditing(s.custom.cards.find((x) => 'c:' + x.id === k))}>✏️</button>` : html`<${FavBtn} id=${k} />`}
      </div>`;
    })}</div>
  </div>`;
}

function resizeImage(file) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const max = 320, r = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement('canvas');
      cv.width = img.width * r; cv.height = img.height * r;
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      res(cv.toDataURL('image/jpeg', 0.7));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}

function CardEditor({ card, deckId, onClose }) {
  const s = useStore();
  const [f, setF] = useState({ front: '', back: '', example: '', pron: '', lang: 'id', theme: '', image: '', deckId, ...card });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = (e) => {
    e.preventDefault();
    if (!f.front.trim()) return;
    update((x) => {
      if (f.id) Object.assign(x.custom.cards.find((c) => c.id === f.id), f);
      else x.custom.cards.push({ ...f, id: uid(), created: Date.now() });
    });
    onClose();
  };
  const del = async () => {
    if (!(await confirmBox('Supprimer cette carte ?', 'Supprimer'))) return;
    update((x) => { x.custom.cards = x.custom.cards.filter((c) => c.id !== f.id); delete x.cards['c:' + f.id]; });
    onClose();
  };
  return html`<div class="modal-bg" onClick=${onClose}><form class="modal" onClick=${(e) => e.stopPropagation()} onSubmit=${save}>
    <h2>${f.id ? 'Modifier la carte' : 'Nouvelle carte'}</h2>
    <label>Mot ou expression<input class="input" required value=${f.front} onInput=${set('front')} autocapitalize="off" /></label>
    <label>Traduction<input class="input" value=${f.back} onInput=${set('back')} /></label>
    <label>Exemple<input class="input" value=${f.example} onInput=${set('example')} /></label>
    <label>Prononciation (facultatif)<input class="input" value=${f.pron} onInput=${set('pron')} /></label>
    <div class="row">
      <label class="grow">Langue du mot<select class="input" value=${f.lang} onChange=${set('lang')}><option value="id">🇮🇩 Indonésien</option><option value="en">🇬🇧 Anglais</option><option value="fr">🇫🇷 Français</option></select></label>
      <label class="grow">Thème<input class="input" value=${f.theme} onInput=${set('theme')} placeholder="ex. marché" /></label>
    </div>
    <label>Deck<select class="input" value=${f.deckId} onChange=${set('deckId')}>${s.custom.decks.map((d) => html`<option value=${d.id}>${d.name}</option>`)}</select></label>
    <label>Image ${f.image && html`<img src=${f.image} class="thumb" alt="" />`}
      <input type="file" accept="image/*" onChange=${async (e) => { const file = e.target.files[0]; if (file) setF({ ...f, image: await resizeImage(file) }); }} /></label>
    ${f.image && html`<button type="button" class="btn link" onClick=${() => setF({ ...f, image: '' })}>Retirer l'image</button>`}
    <div class="row">
      ${f.id && html`<button type="button" class="btn ghost danger" onClick=${del}>🗑️ Supprimer</button>`}
      <span class="grow"></span>
      <button type="button" class="btn ghost" onClick=${onClose}>Annuler</button>
      <button class="btn primary">Enregistrer</button>
    </div>
  </form></div>`;
}

export function Review({ deck }) {
  const [queue, setQueue] = useState(() => buildQueue(deck));
  const [flipped, setFlipped] = useState(false);
  const [reverse, setReverse] = useState(false);
  const [count, setCount] = useState(0);
  const t0 = useRef(Date.now());
  const s = useStore();
  useEffect(() => () => addStudyTime(Date.now() - t0.current), []);

  useEffect(() => {
    const k = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === ' ') { e.preventDefault(); setFlipped(true); }
      if (flipped && ['1', '2', '3', '4'].includes(e.key)) rate(+e.key);
    };
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  });

  const key = queue[0];
  const rate = (g) => {
    rateCard(key, g);
    const after = getState().cards[key];
    const rest = queue.slice(1);
    // Une carte encore « en apprentissage » revient plus loin dans la séance.
    if (after.due - Date.now() < 20 * 60 * 1000) rest.splice(Math.min(rest.length, 3 + Math.floor(Math.random() * 3)), 0, key);
    setQueue(rest);
    setFlipped(false);
    setCount(count + 1);
  };

  if (!key) {
    return html`<div class="page center-page">
      ${count > 0 && html`<${Confetti} />`}
      <div class="result-emoji">${count ? '🎉' : '🌴'}</div>
      <h2>${count ? `${count} révision${count > 1 ? 's' : ''} faite${count > 1 ? 's' : ''} !` : 'Rien à réviser pour le moment'}</h2>
      <p class="muted">${count ? 'Les cartes reviendront au bon moment.' : 'Termine une leçon ou ajoute des cartes pour en avoir de nouvelles.'}</p>
      <button class="btn coral" onClick=${() => setQueue(buildQueue(deck, { extraNew: 10 }))}>＋ 10 nouvelles cartes</button>
      <button class="btn primary" onClick=${() => go('/flashcards')}>Terminer</button>
    </div>`;
  }
  const c = cardContent(key, s);
  const card = s.cards[key];
  const front = reverse ? c.back : c.front;
  const back = reverse ? c.front : c.back;
  return html`<div class="page review">
    <div class="progress-top">
      <button class="x" onClick=${() => go('/flashcards')} aria-label="Quitter">✕</button>
      <div class="bar"><i style=${`width:${(count / (count + queue.length)) * 100}%`}></i></div>
      <span class="muted">${queue.length} restantes</span>
    </div>
    <div class="row between">
      <button class="btn ghost sm" onClick=${() => { setReverse(!reverse); setFlipped(false); }}>Sens : ${reverse ? `🇫🇷 → ${FLAG[c.lang]}` : `${FLAG[c.lang]} → 🇫🇷`}</button>
      <span class="row"><${Mastery} id=${key} />${!key.startsWith('c:') && html`<${FavBtn} id=${key} />`}</span>
    </div>
    <div class=${'flip' + (flipped ? ' flipped' : '')} onClick=${() => setFlipped(!flipped)}>
      <div class="face front">
        ${c.image && html`<img src=${c.image} alt="" class="card-img" />`}
        ${c.emoji && html`<div class="card-emoji">${c.emoji}</div>`}
        <div class="card-word">${front}</div>
        ${!reverse && html`<${AudioBtn} text=${c.front} lang=${c.lang} big />`}
        <div class="tap-hint">Touche pour retourner</div>
      </div>
      <div class="face back">
        <div class="card-word small">${back}</div>
        ${reverse && html`<${AudioBtn} text=${c.front} lang=${c.lang} big />`}
        ${c.pron && html`<div class="w-pron">🗣️ ${c.pron}</div>`}
        ${c.ex && html`<div class="w-ex">${c.ex} <${AudioBtn} text=${c.ex} lang=${c.lang} />${c.exFr && html`<br /><em>${c.exFr}</em>`}</div>`}
      </div>
    </div>
    ${flipped
      ? html`<div class="ratings">${RATINGS.map((r) => html`<button class=${'rate ' + r.cls} onClick=${() => rate(r.g)}>
          <b>${r.label}</b><span>${r.fr}</span><small>${previewLabel(card, r.g)}</small></button>`)}</div>`
      : html`<button class="btn primary block lg" onClick=${() => setFlipped(true)}>Voir la réponse</button>`}
  </div>`;
}
