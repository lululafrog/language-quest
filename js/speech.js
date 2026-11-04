import { getState } from './store.js';

// Android déclare souvent l'indonésien avec l'ancien code « in-ID ».
const LANG_PREFIX = { id: ['id', 'in'], en: ['en'], fr: ['fr'] };
const LOCALE = { id: 'id-ID', en: 'en-GB', fr: 'fr-FR' };

let voices = [];
const listeners = new Set();
function refresh() {
  voices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
  listeners.forEach((f) => f());
}
if (window.speechSynthesis) {
  refresh();
  speechSynthesis.onvoiceschanged = refresh;
  setTimeout(refresh, 800);
}
export const onVoices = (f) => { listeners.add(f); return () => listeners.delete(f); };

export function voiceFor(lang) {
  const pre = LANG_PREFIX[lang] || [lang];
  const ok = voices.filter((v) => pre.some((p) => v.lang.toLowerCase().replace('_', '-').startsWith(p + '-') || v.lang.toLowerCase() === p));
  if (!ok.length) return null;
  if (lang === 'en') return ok.find((v) => /en-gb/i.test(v.lang)) || ok.find((v) => /en-us/i.test(v.lang)) || ok[0];
  return ok.find((v) => v.localService) || ok[0];
}

export const canSpeak = (lang) => !!voiceFor(lang);

// Ne parle jamais avec une voix d'une autre langue : sans voix adaptée, on ne fait rien.
export function speak(text, lang = 'id') {
  const v = voiceFor(lang);
  if (!v) return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/\.\.\.|…|___/g, ' '));
  u.voice = v;
  u.lang = v.lang;
  u.rate = getState().settings.rate || 0.85;
  speechSynthesis.speak(u);
  return true;
}

const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
export const canListen = () => !!Rec;

export function listen(lang = 'id') {
  return new Promise((resolve, reject) => {
    if (!Rec) return reject(new Error('unsupported'));
    const r = new Rec();
    r.lang = LOCALE[lang];
    r.interimResults = false;
    r.maxAlternatives = 5;
    let done = false;
    r.onresult = (e) => {
      done = true;
      resolve(Array.from(e.results[0]).map((a) => a.transcript));
    };
    r.onerror = (e) => { done = true; reject(new Error(e.error)); };
    r.onend = () => { if (!done) resolve([]); };
    r.start();
  });
}

export function normalize(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Similarité de Levenshtein normalisée (0..1).
export function similarity(a, b) {
  a = normalize(a); b = normalize(b);
  if (!a.length && !b.length) return 1;
  const m = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) m[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return 1 - m[a.length][b.length] / Math.max(a.length, b.length);
}
