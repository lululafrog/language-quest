import { html, useState } from '../vendor/preact-htm.js';
import { useStore, BADGES, update, exportBackup, importBackup, resetAll, today } from '../store.js';
import { go, AudioBtn, useVoices } from '../ui.js';
import { totals, deckStats, newLeftToday, unlockedIdLessons } from '../cards.js';
import { ID_LESSONS, LEVELS } from '../data/indonesian.js';
import { voiceFor, canListen, speak } from '../speech.js';
import { exportText, confirmBox } from '../dialog.js';
import { VoicePicker } from './voice.js';
import { PHOTO_DECK } from '../store.js';

const fmtTime = (ms) => {
  const m = Math.round(ms / 60000);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60}`;
};

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return ['Selamat pagi', 'bonjour (matin)'];
  if (h < 15) return ['Selamat siang', 'bonjour (midi)'];
  if (h < 18) return ['Selamat sore', 'bonjour (après-midi)'];
  return ['Selamat malam', 'bonsoir'];
}

export function Home() {
  const s = useStore();
  const t = totals(s);
  const [hi, hiFr] = greeting();
  const next = unlockedIdLessons(s).find((l) => !s.lessons[l.id]);
  const due = deckStats('all', s).due;
  return html`<div class="page">
    <div class="greet"><div><h1>${hi}! 🌺</h1><p class="muted">${hiFr} · <${AudioBtn} text=${hi} /></p></div>
      <div class="streak" title="Série de jours">🔥 <b>${s.streak.count}</b><small>jour${s.streak.count > 1 ? 's' : ''}</small></div></div>
    <div class="modes">
      <button class="mode id" onClick=${() => go('/learn')}>
        <span class="mode-flag">🇮🇩</span><b>Learn Indonesian</b><span>Voyage, découverte, conversation</span>
        <span class="mode-meta">${t.lessonsDone ? `${Object.keys(s.lessons).filter((k) => k.startsWith('id-')).length}/${ID_LESSONS.length} leçons` : 'Commencer au niveau 1'}</span>
      </button>
      <button class="mode en" onClick=${() => go('/classroom')}>
        <span class="mode-flag">🇬🇧</span><b>Teach English</b><span>Classe, vocabulaire, jeux</span>
        <span class="mode-meta">${s.teacher.sessions || 0} séance(s) animée(s)</span>
      </button>
    </div>
    <h2>Aujourd'hui</h2>
    <div class="today">
      <button class="todo" onClick=${() => go('/flashcards/review/all')}><span class="todo-ic">🃏</span><span class="grow"><b>Révision du jour</b><span class="muted small block">${due} à revoir · ${newLeftToday(s)} nouvelles possibles · ≈ 5 min</span></span><span class="go">▶</span></button>
      ${next && html`<button class="todo" onClick=${() => go('/learn/' + next.id)}><span class="todo-ic">${next.icon}</span><span class="grow"><b>Leçon : ${next.title}</b><span class="muted small block">${next.sub}</span></span><span class="go">▶</span></button>`}
      <button class="todo" onClick=${() => go('/photo')}><span class="todo-ic">📸</span><span class="grow"><b>Mes 5 mots du jour</b><span class="muted small block">${photoToday(s)}/5 photo(s) aujourd'hui · révision en images</span></span><span class="go">▶</span></button>
      <button class="todo" onClick=${() => go('/flashcards/deck/deck-heard-today')}><span class="todo-ic">👂</span><span class="grow"><b>Words I Heard Today</b><span class="muted small block">${deckStats('deck-heard-today', s).total} mot(s) noté(s)</span></span><span class="go">▶</span></button>
    </div>
    <h2>Ma progression</h2>
    <${Stats} t=${t} s=${s} />
  </div>`;
}

const photoToday = (s) => s.custom.cards.filter((c) => c.deckId === PHOTO_DECK && c.day === today()).length;

function Stats({ t, s }) {
  const items = [
    ['🌱', t.learned, 'mots appris'], ['🔁', t.due, 'à réviser'], ['⏱️', fmtTime(t.ms), 'd\'étude'],
    ['📘', t.lessonsDone, 'leçons finies'], ['🎯', t.pct + ' %', 'de réussite'], ['🔥', s.streak.count, 'jours de suite'],
    ['✨', s.xp, 'XP'], ['🗺️', `${unlockedIdLessons(s).length}/${ID_LESSONS.length}`, 'leçons débloquées'],
  ];
  return html`<div class="stats">${items.map(([i, v, l]) => html`<div class="stat"><span>${i}</span><b>${v}</b><small>${l}</small></div>`)}</div>`;
}

export function Progress() {
  const s = useStore();
  const t = totals(s);
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 13 + i); return today(d); });
  const max = Math.max(1, ...days.map((d) => s.days[d]?.answered || 0));
  return html`<div class="page">
    <h1>📈 Ma progression</h1>
    <${Stats} t=${t} s=${s} />
    <h2>14 derniers jours</h2>
    <div class="card"><div class="bars">${days.map((d) => {
      const v = s.days[d]?.answered || 0;
      return html`<div class="bar-col" title=${`${d} : ${v} réponses`}><i style=${`height:${(v / max) * 100}%`}></i><small>${d.slice(8)}</small></div>`;
    })}</div><p class="muted small">Réponses données par jour (flashcards + exercices).</p></div>
    <h2>🗺️ Carte d'aventure</h2>
    <div class="adventure">${LEVELS.map((lv) => {
      const ls = ID_LESSONS.filter((l) => l.level === lv.n);
      const done = ls.filter((l) => s.lessons[l.id]).length;
      return html`<div class=${'adv-stop' + (done === ls.length ? ' done' : done ? ' half' : '')} style=${`--c:${lv.color}`}>
        <span class="adv-ic">${done === ls.length ? '🏝️' : lv.icon}</span><b>${lv.title}</b><small>${done}/${ls.length}</small></div>`;
    })}</div>
    <h2>🏅 Badges</h2>
    <div class="badges">${BADGES.map((b) => html`<div class=${'badge' + (s.badges[b.id] ? ' got' : '')}><span>${b.icon}</span><b>${b.name}</b><small>${b.desc}</small></div>`)}</div>
  </div>`;
}

export function Settings() {
  const s = useStore();
  useVoices();
  const vId = voiceFor('id'), vEn = voiceFor('en');
  const set = (k, v) => update((st) => { st.settings[k] = v; });
  const [msg, setMsg] = useState('');
  return html`<div class="page">
    <h1>⚙️ Réglages</h1>
    <div class="card">
      <h3>Apprentissage</h3>
      <label class="setting">Nouvelles cartes par jour <select class="input inline" value=${s.settings.newPerDay} onChange=${(e) => set('newPerDay', +e.target.value)}>${[5, 10, 15, 20, 30].map((n) => html`<option value=${n}>${n}</option>`)}</select></label>
      <label class="setting check"><input type="checkbox" checked=${s.settings.showPron} onChange=${(e) => set('showPron', e.target.checked)} /> Afficher la prononciation simplifiée</label>
      <label class="setting check"><input type="checkbox" checked=${s.settings.unlockAll} onChange=${(e) => set('unlockAll', e.target.checked)} /> Tout débloquer (accès direct à toutes les leçons)</label>
    </div>
    <div class="card">
      <h3>🔊 Voix</h3>
      <p>🇮🇩 Indonésien : ${vId ? html`<b class="ok-text">✓ ${vId.name}</b> <button class="btn ghost sm" onClick=${() => speak('Selamat pagi, apa kabar?', 'id')}>Tester</button>` : html`<b class="ko-text">✗ aucune voix installée</b>`}</p>
      <p>🇬🇧 Anglais : ${vEn ? html`<b class="ok-text">✓ ${vEn.name}</b> <button class="btn ghost sm" onClick=${() => speak('Hello! How are you?', 'en')}>Tester</button>` : html`<b class="ko-text">✗ aucune voix</b>`}</p>
      <p>🎙️ Reconnaissance vocale : ${canListen() ? html`<b class="ok-text">✓ disponible</b>` : html`<b class="ko-text">✗ non disponible dans ce navigateur (Chrome ou Safari récents conseillés)</b>`}</p>
      <details><summary>🇬🇧 Choisir la voix anglaise (la plus naturelle est choisie d'office)</summary><${VoicePicker} lang="en" /></details>
      <details><summary>🇮🇩 Choisir la voix indonésienne</summary><${VoicePicker} lang="id" /></details>
      <details><summary>Installer la voix indonésienne (hors ligne)</summary>
        <p><b>iPhone / iPad :</b> Réglages → Accessibilité → Contenu énoncé → Voix → Indonésien → télécharger « Damayanti ».</p>
        <p><b>Android :</b> Paramètres → Système → Langues → Synthèse vocale → Moteur Google → ⚙️ → Installer les données vocales → Indonésien.</p>
        <p><b>Mac :</b> Réglages Système → Accessibilité → Contenu énoncé → Voix du système → Gérer les voix → Indonésien.</p>
        <p class="muted small">Sans voix indonésienne, l'appli ne lit rien plutôt que de prononcer l'indonésien avec une voix anglaise.</p>
      </details>
    </div>
    <div class="card">
      <h3>💾 Sauvegarde</h3>
      <p class="muted small">Tout est enregistré sur cet appareil, sans compte. Exporte une sauvegarde pour changer de téléphone.</p>
      <div class="row wrap">
        <button class="btn ghost" onClick=${() => exportText(`language-quest-sauvegarde-${today()}.json`, exportBackup(), 'application/json')}>⬇️ Exporter ma sauvegarde</button>
        <label class="btn ghost">⬆️ Restaurer<input type="file" accept=".json,application/json" hidden onChange=${(e) => e.target.files[0]?.text().then((t) => { try { importBackup(t); setMsg('✓ Sauvegarde restaurée'); } catch (err) { setMsg('✗ ' + err.message); } })} /></label>
        <button class="btn ghost danger" onClick=${async () => { if (await confirmBox('Effacer toute la progression et les cartes personnelles ?', 'Tout effacer')) resetAll(); }}>🗑️ Tout réinitialiser</button>
      </div>
      ${msg && html`<p>${msg}</p>`}
    </div>
    <div class="card">
      <h3>📱 Installer sur le téléphone</h3>
      <p><b>iPhone (Safari) :</b> bouton Partager → « Sur l'écran d'accueil ». <b>Android (Chrome) :</b> menu ⋮ → « Installer l'application ».</p>
      <p class="muted small">Une fois ouverte une première fois, l'appli fonctionne hors connexion (leçons, flashcards, jeux).</p>
    </div>
  </div>`;
}
