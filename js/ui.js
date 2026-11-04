import { html, useState, useEffect } from './vendor/preact-htm.js';
import { speak, canSpeak, onVoices } from './speech.js';
import { toggleFav, useStore } from './store.js';
import { mastery } from './fsrs.js';
import { notify } from './dialog.js';
import { T } from './i18n.js';

export { html };

export const shuffle = (a) => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
};
export const sample = (a, n) => shuffle(a).slice(0, n);
export const pick = (a) => a[Math.floor(Math.random() * a.length)];

export const go = (path) => { location.hash = path; };

export function useVoices() {
  const [, set] = useState(0);
  useEffect(() => onVoices(() => set((n) => n + 1)), []);
}

export function AudioBtn({ text, lang = 'id', big = false }) {
  useVoices();
  const ok = canSpeak(lang);
  const label = lang === 'id' ? 'indonésienne' : lang === 'en' ? 'anglaise' : 'française';
  return html`<button class=${'audio' + (big ? ' big' : '') + (ok ? '' : ' off')}
    title=${ok ? 'Écouter' : `Aucune voix ${label} installée sur cet appareil (voir Réglages)`}
    aria-label="Écouter"
    onClick=${(e) => { e.stopPropagation(); if (!speak(text, lang)) notify(`Aucune voix ${label} n'est installée sur cet appareil.\nRéglages → « Voix » pour savoir comment l'ajouter.`); }}>🔊</button>`;
}

export function FavBtn({ id }) {
  const s = useStore();
  const on = !!s.favorites[id];
  return html`<button class=${'fav' + (on ? ' on' : '')} aria-label="Favori" title="Favori"
    onClick=${(e) => { e.stopPropagation(); toggleFav(id); }}>${on ? '★' : '☆'}</button>`;
}

export function Mastery({ id }) {
  const s = useStore();
  const m = mastery(s.cards[id]);
  const names = ['Nouveau', 'En apprentissage', 'Fragile', 'Acquis', 'Maîtrisé'];
  return html`<span class="mastery" title=${names[m]}>${[1, 2, 3, 4].map((i) => html`<i class=${i <= m ? 'on m' + m : ''}></i>`)}</span>`;
}

// Fiche complète d'un mot indonésien.
export function WordRow({ w }) {
  const s = useStore();
  return html`<div class="word">
    <div class="word-main">
      <div class="word-top">
        <b class="w-id">${w.id}</b>
        <${AudioBtn} text=${w.id} />
      </div>
      <div class="w-fr">${w.fr}</div>
      ${s.settings.showPron && html`<div class="w-pron">🗣️ ${w.pron}</div>`}
      <div class="w-ex"><span>${w.ex}</span> <${AudioBtn} text=${w.ex} /><br /><em>${w.exFr}</em></div>
    </div>
    <div class="word-side"><${FavBtn} id=${w.key} /><${Mastery} id=${w.key} /></div>
  </div>`;
}

export function Back({ to, label = 'Retour' }) {
  return html`<button class="back" onClick=${() => (to ? go(to) : history.back())}>← ${label}</button>`;
}

export function Confetti() {
  const bits = Array.from({ length: 60 }, (_, i) => i);
  const colors = ['#ff7a59', '#ffd166', '#14b8a6', '#1f9d6b', '#8b5cf6', '#38bdf8'];
  return html`<div class="confetti" aria-hidden="true">${bits.map((i) => html`<i style=${`left:${Math.random() * 100}%;background:${colors[i % 6]};animation-delay:${Math.random() * 0.8}s;animation-duration:${2 + Math.random() * 2}s`}></i>`)}</div>`;
}

export function FullscreenBtn() {
  const [fs, setFs] = useState(!!document.fullscreenElement);
  useEffect(() => {
    const f = () => setFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', f);
    return () => document.removeEventListener('fullscreenchange', f);
  }, []);
  if (!document.documentElement.requestFullscreen) return null;
  return html`<button class="btn ghost sm" onClick=${() => (fs ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {})}>${fs ? T('⤡ Quitter plein écran', '⤡ Keluar layar penuh') : T('⤢ Plein écran', '⤢ Layar penuh')}</button>`;
}

export function Tri({ t, show = ['en', 'id', 'fr'] }) {
  if (!t) return null;
  const flag = { en: '🇬🇧', id: '🇮🇩', fr: '🇫🇷' };
  return html`<div class="tri">${show.filter((k) => t[k]).map((k) => html`<div class=${'tri-' + k}><span>${flag[k]}</span> ${t[k]}</div>`)}</div>`;
}

export function Empty({ icon, children }) {
  return html`<div class="empty"><div class="empty-icon">${icon}</div>${children}</div>`;
}
