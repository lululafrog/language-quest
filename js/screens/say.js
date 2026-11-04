// Prononciation : l'élève dit un mot (ou une phrase) au micro, l'app vérifie et encourage.
import { html, useState, useEffect, useMemo } from '../vendor/preact-htm.js';
import { useStore, getState, update } from '../store.js';
import { listen, canListen, speak, normalize, similarity } from '../speech.js';
import { go, AudioBtn, Confetti, shuffle, sample } from '../ui.js';
import { chime } from '../exercises.js';
import { ZONES, levelInfo, pathState } from '../data/path.js';
import { B, progress } from '../i18n.js';

export const micOn = () => !!getState().settings.mic;
export const canSay = () => micOn() && canListen() && location.protocol !== 'file:' && window.top === window;

const NUM = { 0: 'zero', 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten' };
// Mots qui sonnent pareil : la reconnaissance vocale choisit parfois l'autre.
const SAME = [['two', 'to', 'too'], ['eight', 'ate'], ['eye', 'i'], ['eyes', 'is'], ['four', 'for'], ['one', 'won'], ['sea', 'see'], ['son', 'sun'], ['hear', 'here'], ['right', 'write'], ['pear', 'pair'], ['knows', 'nose'], ['no', 'know'], ['flower', 'flour'], ['meet', 'meat']];
const clean = (t) => normalize(String(t).replace(/\b(\d+)\b/g, (n) => NUM[n] || n));
const same = (a, b) => a === b || SAME.some((g) => g.includes(a) && g.includes(b));

// Score 0..1 sur toutes les propositions entendues ; mots reconnus pour colorer la phrase.
export function scoreSpeech(target, alts) {
  const t = clean(target);
  const tw = t.split(' ');
  let best = 0, heard = alts[0] || '', hits = new Set();
  for (const a of alts) {
    const h = clean(a);
    const hw = h.split(' ');
    const found = tw.filter((w) => hw.some((x) => same(w, x)));
    // Un mot : on tolère une petite erreur. Une phrase : « parfait » seulement si tous les mots y sont.
    const sc = tw.length > 1 ? Math.min(similarity(t, h), found.length / tw.length) : Math.max(similarity(t, h), found.length);
    if (sc > best) { best = sc; heard = a; hits = new Set(found); }
  }
  return { score: best, heard, hits };
}
export const verdict = (sc) => (sc >= 0.85 ? { ok: true, icon: '🌟', t: B('Sempurna!', 'Perfect!') } : sc >= 0.7 ? { ok: true, icon: '👍', t: B('Bagus!', 'Good!') } : { ok: false, icon: '🔁', t: B('Coba lagi', 'Try again') });

// Bouton micro + résultat. onResult(score) à chaque essai.
export function MicCheck({ text, onResult, compact = false }) {
  const [st, setSt] = useState('idle');
  const [res, setRes] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { setSt('idle'); setRes(null); setErr(''); }, [text]);
  const go2 = async () => {
    setSt('listening'); setErr('');
    try {
      const alts = await listen('en');
      const r = scoreSpeech(text, alts);
      setRes(r); setSt('done');
      chime(verdict(r.score).ok);
      onResult && onResult(r);
    } catch (e) {
      setErr(e.message === 'not-allowed' || e.message === 'service-not-allowed'
        ? B('Izinkan mikrofon di HP-mu', 'Allow the microphone on your phone')
        : e.message === 'no-speech' ? B('Tidak terdengar. Bicara lebih keras ya!', 'I didn\'t hear you. Speak louder!')
          : B('Mikrofon tidak bisa dipakai', 'The microphone doesn\'t work here'));
      setSt('idle');
    }
  };
  const v = res && verdict(res.score);
  return html`<div class=${'mic-check' + (compact ? ' compact' : '')}>
    <button class=${'mic-btn' + (st === 'listening' ? ' on' : '')} disabled=${st === 'listening'} onClick=${go2}>
      ${st === 'listening' ? '👂' : '🎙️'}<span>${st === 'listening' ? B('Aku mendengar…', 'Listening…') : res ? B('Coba lagi', 'Again') : B('Tekan dan bicara', 'Tap and speak')}</span></button>
    ${res && html`<div class=${'mic-res ' + (v.ok ? 'ok' : 'ko')}><b>${v.icon} ${v.t}</b>
      <span class="small">${B('Aku dengar', 'I heard')}: « ${res.heard || '…'} »</span></div>`}
    ${err && html`<div class="mic-res ko small">${err}</div>`}
  </div>`;
}

// ---------- Jeu « Ucapkan! » ----------
function topics(s) {
  const p = pathState(s);
  const upto = Math.min(ZONES.length - 1, levelInfo(p.cur).zi);
  const zones = ZONES.slice(0, upto + 1).map((z, zi) => ({ k: 'z' + zi, title: `${z.icon} ${z.name}`, words: () => levelInfo(zi * 10 + 1).zoneWords.filter((w) => /^[a-z' -]+$/i.test(w.en) && w.en.length <= 16) }));
  const mine = Object.entries(s.wordbank || {}).map(([en, v]) => ({ en, id: v.id, emoji: '' }));
  return [...(mine.length >= 3 ? [{ k: 'mine', title: '⭐ Kata-kataku (My words)', words: () => mine }] : []), ...zones];
}

export function SayGame() {
  const s = useStore();
  const [topic, setTopic] = useState(null);
  const list = topics(s);
  if (!canSay()) return html`<div class="page narrow student"><button class="btn ghost sm" onClick=${() => go('/s/play')}>← Main (Play)</button>
    <h1>🎙️ Ucapkan! (Say it!)</h1><div class="card"><p>${B('Mikrofon tidak tersedia di browser ini.', 'The microphone isn\'t available in this browser.')}</p>
    <p class="muted small">${B('Coba buka aplikasi di Chrome (Android) atau Safari (iPhone).', 'Try opening the app in Chrome (Android) or Safari (iPhone).')}</p></div></div>`;
  if (topic) return html`<${SayRound} key=${topic.k} topic=${topic} onExit=${() => setTopic(null)} />`;
  return html`<div class="page narrow student">
    <button class="btn ghost sm" onClick=${() => go('/s/play')}>← Main (Play)</button>
    <h1>🎙️ Ucapkan! (Say it!)</h1>
    <p class="muted">${B('Dengar kata, lalu ucapkan dengan keras. Aku akan mendengarkan!', 'Listen to the word, then say it out loud. I\'ll listen!')}</p>
    <div class="src-grid">${list.map((t) => html`<button class="src" onClick=${() => setTopic(t)}>${t.title}</button>`)}</div>
    <p class="muted small">💡 ${B('Zona baru terbuka saat kamu naik di 🏝️ Pulau.', 'New zones open as you climb the 🏝️ Island.')}</p>
  </div>`;
}

function SayRound({ topic, onExit }) {
  const words = useMemo(() => sample(topic.words(), 8), [topic]);
  const [i, setI] = useState(0);
  const [tries, setTries] = useState(0);
  const [best, setBest] = useState(0);
  const [stars, setStars] = useState([]);
  const w = words[i];
  useEffect(() => { if (w) setTimeout(() => speak(w.en, 'en'), 300); setTries(0); setBest(0); }, [i]);
  useEffect(() => { if (words.length && i >= words.length) progress('say'); }, [i >= words.length]);
  const next = () => { setStars([...stars, best >= 0.85 ? 3 : best >= 0.7 ? 2 : best > 0 ? 1 : 0]); setI(i + 1); };
  if (i >= words.length) {
    const tot = stars.reduce((a, b) => a + b, 0);
    return html`<div class="page narrow student center-page">${tot >= words.length * 2 && html`<${Confetti} />`}
      <div class="giant">🎤</div><h1>${B('Hebat!', 'Great job!')}</h1>
      <div class="big-stars">⭐ ${tot} / ${words.length * 3}</div>
      <div class="say-recap">${words.map((x, k) => html`<span>${x.en} ${'★'.repeat(stars[k])}${'☆'.repeat(3 - stars[k])}</span>`)}</div>
      <button class="btn coral lg" onClick=${onExit}>🔁 ${B('Main lagi', 'Play again')}</button>
      <button class="btn ghost" onClick=${() => go('/s/play')}>${B('Kembali', 'Back')}</button></div>`;
  }
  const pic = w.emoji && !w.abstract;
  return html`<div class="page narrow student">
    <div class="row between"><button class="btn ghost sm" onClick=${onExit}>✕</button><span class="muted">${i + 1} / ${words.length}</span></div>
    <div class="bar"><i style=${`width:${(i / words.length) * 100}%`}></i></div>
    <div class="say-card">
      ${pic && html`<div class="intro-emoji">${w.emoji}</div>`}
      <div class="intro-en">${w.en} <${AudioBtn} text=${w.en} lang="en" /></div>
      <div class="intro-id">🇮🇩 ${w.id}</div>
      <${MicCheck} text=${w.en} onResult=${(r) => { setTries(tries + 1); setBest(Math.max(best, r.score)); }} />
    </div>
    ${(best >= 0.7 || tries >= 3) && html`<button class="btn primary lg block" onClick=${next}>${B('Kata berikutnya', 'Next word')} →</button>`}
    ${best < 0.7 && tries < 3 && html`<button class="btn link block" onClick=${next}>${B('Lewati', 'Skip')}</button>`}
  </div>`;
}

// ---------- Exercice dans les leçons de l'île ----------
export function SayEx({ ex, onDone }) {
  const [best, setBest] = useState(0);
  const [tries, setTries] = useState(0);
  useEffect(() => { setTimeout(() => speak(ex.w.en, 'en'), 300); }, []);
  return html`<div class="ex say-card">
    <div class="ex-kind">🎙️ ${B('Ucapkan dengan keras', 'Say it out loud')}</div>
    ${ex.w.emoji && !ex.w.abstract && html`<div class="intro-emoji">${ex.w.emoji}</div>`}
    <div class="intro-en">${ex.w.en} <${AudioBtn} text=${ex.w.en} lang="en" /></div>
    <${MicCheck} text=${ex.w.en} onResult=${(r) => { setTries(tries + 1); setBest(Math.max(best, r.score)); }} />
    ${(best >= 0.7 || tries >= 2) ? html`<button class="btn primary lg block" onClick=${() => onDone(best >= 0.7)}>${B('Lanjut', 'Next')} →</button>`
      : html`<button class="btn link block" onClick=${() => onDone(null)}>${B('Lewati (tidak ada mikrofon)', 'Skip (no microphone)')}</button>`}
  </div>`;
}
