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

// Classement des voix : naturelles et féminines d'abord, voix « gadget » jamais.
const NATURAL = /natural|neural|premium|enhanced|wavenet|studio|journey|siri/i;
const FEMALE = /female|woman|samantha|\bava\b|allison|susan|victoria|karen|moira|tessa|serena|kate|fiona|martha|catherine|zira|aria|jenny|libby|sonia|emma|michelle|joanna|salli|kimberly|nicky|damayanti|gadis|x-sfg|x-iob|x-iog|x-tpc|x-tpf|x-gba|x-gbc|x-gbg|x-idc|google uk english female|google us english/i;
// Voix « Eloquence » d'Apple : très robotiques.
const ROBOTIC = /\b(flo|sandy|shelley|grandma|grandpa|eddy|reed|rocko)\b/i;
const MALE = /\bmale\b|daniel|alex\b|fred|arthur|oliver|thomas|david|mark|george|guy|ryan|rishi|aaron|gordon|eddy|reed|rocko|x-iom|x-tpd|x-gbd|x-rjs/i;
const NOVELTY = /bad ?news|bells|bubbles|cellos|zarvox|whisper|albert|jester|organ|trinoids|wobble|boing|bahh|superstar|junior|ralph|good ?news|hysterical|deranged|pipe ?organ|princess|kathy|fred/i;

function langVoices(lang) {
  const pre = LANG_PREFIX[lang] || [lang];
  return voices.filter((v) => pre.some((p) => v.lang.toLowerCase().replace('_', '-').startsWith(p + '-') || v.lang.toLowerCase() === p));
}
export function voiceScore(v) {
  let sc = 0;
  const id = `${v.name} ${v.voiceURI || ''}`;
  if (/karen/i.test(id)) sc += 100; // voix préférée de la prof (accent australien), puis Moira
  if (/moira/i.test(id)) sc += 60;
  if (NATURAL.test(id)) sc += 50;
  if (FEMALE.test(id)) sc += 30;
  if (MALE.test(id) && !/female/i.test(id)) sc -= 40;
  if (NOVELTY.test(id)) sc -= 200;
  if (ROBOTIC.test(id)) sc -= 60;
  if (/en-(gb|us)|id-id|in-id/i.test(v.lang)) sc += 5;
  if (/google/i.test(v.name)) sc += 8;
  return sc;
}
export const rankVoices = (lang) => {
  const all = langVoices(lang).filter((v) => voiceScore(v) > -100).sort((a, b) => voiceScore(b) - voiceScore(a));
  const good = all.filter((v) => voiceScore(v) > 5);
  return good.length ? good : all;
};

export function voiceFor(lang) {
  const chosen = getState().settings.voices?.[lang];
  const list = langVoices(lang);
  if (!list.length) return null;
  return (chosen && list.find((v) => v.name === chosen)) || rankVoices(lang)[0] || list[0];
}

export const canSpeak = (lang) => !!voiceFor(lang);

// Ne parle jamais avec une voix d'une autre langue : sans voix adaptée, on ne fait rien.
export function speak(text, lang = 'id', rate) {
  const v = voiceFor(lang);
  if (!v) return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/\.\.\.|…|___/g, ' '));
  u.voice = v;
  u.lang = v.lang;
  const st = getState().settings;
  // Voix posée : un peu plus lente, un ton légèrement plus doux.
  u.rate = rate || st.rate || 0.82;
  u.pitch = st.pitch ?? 1.05;
  speechSynthesis.speak(u);
  return u;
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
