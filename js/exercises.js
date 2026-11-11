import { html, useState, useEffect, useMemo, useRef } from './vendor/preact-htm.js';
import { AudioBtn, shuffle, Confetti } from './ui.js';
import { speak, canSpeak, canListen, listen, normalize, similarity } from './speech.js';
import { recordAnswer, addStudyTime } from './store.js';
import { T, B } from './i18n.js';

// Petit son de réussite ou d'erreur (si le téléphone n'est pas en silencieux).
export function chime(ok) {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    (ok ? [660, 990] : [330, 247]).forEach((f, i) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = ok ? 'triangle' : 'sine'; o.frequency.value = f;
      o.connect(g); g.connect(ac.destination);
      const t = ac.currentTime + i * 0.11;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.16, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      o.start(t); o.stop(t + 0.3);
    });
    setTimeout(() => ac.close(), 900);
  } catch { /* pas de son */ }
}

function Feedback({ ok, answer, why, onNext }) {
  useEffect(() => { chime(ok); }, []);
  return html`<div class=${'feedback ' + (ok ? 'ok' : 'ko')}>
    <div class="fb-title">${ok ? T('✨ Bravo !', B('✨ Hebat!', 'Great!')) : T('💡 Presque !', B('💡 Hampir!', 'Almost!'))}</div>
    ${!ok && answer && html`<div>${T('Réponse', B('Jawaban', 'Answer'))} : <b>${answer}</b></div>`}
    ${why && html`<div class="fb-why">${why}</div>`}
    <button class="btn primary block" autofocus onClick=${onNext}>${T('Continuer →', B('Lanjut', 'Next') + ' →')}</button>
  </div>`;
}

function Choices({ options, answer, onAnswer, picked, big }) {
  return html`<div class=${'choices' + (big ? ' big' : '')}>${options.map((o) => {
    let cls = 'choice';
    if (picked != null) { if (o === answer) cls += ' right'; else if (o === picked) cls += ' wrong'; else cls += ' dim'; }
    return html`<button class=${cls} disabled=${picked != null} onClick=${() => onAnswer(o)}>${o}</button>`;
  })}</div>`;
}

export function MCQ({ ex, onDone }) {
  const [picked, setPicked] = useState(null);
  const opts = useMemo(() => shuffle(ex.options), [ex]);
  useEffect(() => { if (ex.autoplay) speak(ex.audio.text, ex.audio.lang); }, [ex]);
  const ok = picked === ex.answer;
  return html`<div class="ex">
    <div class="ex-kind">${ex.kindLabel || T('Choisis la bonne réponse', B('Pilih jawaban yang benar', 'Choose the right answer'))}</div>
    <div class="ex-prompt">${ex.emoji && html`<div class="ex-emoji">${ex.emoji}</div>`}${ex.prompt}
      ${ex.audio && html` <${AudioBtn} text=${ex.audio.text} lang=${ex.audio.lang} big=${ex.autoplay} />`}</div>
    ${ex.sub && html`<div class="ex-sub">${ex.sub}</div>`}
    <${Choices} options=${opts} answer=${ex.answer} picked=${picked} onAnswer=${setPicked} />
    ${picked != null && html`<${Feedback} ok=${ok} answer=${ex.answer} why=${ex.why} onNext=${() => onDone(ok)} />`}
  </div>`;
}

export function Fill({ ex, onDone }) {
  const [picked, setPicked] = useState(null);
  const opts = useMemo(() => shuffle(ex.opts), [ex]);
  const ok = picked === ex.a;
  const shown = picked != null ? ex.s.replace('___', `[${ex.a}]`) : ex.s;
  return html`<div class="ex">
    <div class="ex-kind">${T('Complète la phrase', B('Lengkapi kalimat', 'Complete the sentence'))}</div>
    <div class="ex-prompt sentence">${shown.split(/(\[[^\]]+\])/).map((p) => p.startsWith('[') ? html`<mark>${p.slice(1, -1)}</mark>` : p)}</div>
    ${ex.fr && html`<div class="ex-sub">${ex.fr}</div>`}
    <${Choices} options=${opts} answer=${ex.a} picked=${picked} onAnswer=${setPicked} />
    ${picked != null && html`<${Feedback} ok=${ok} answer=${ex.a} why=${ex.why} onNext=${() => onDone(ok)} />`}
  </div>`;
}

export function Build({ ex, onDone }) {
  const tokens = useMemo(() => {
    const t = ex.a.split(' ').map((w, i) => ({ w, i }));
    let s = shuffle(t);
    if (t.length > 1) while (s.map((x) => x.i).join() === t.map((x) => x.i).join()) s = shuffle(t);
    return s;
  }, [ex]);
  const [chosen, setChosen] = useState([]);
  const [checked, setChecked] = useState(null);
  const sentence = chosen.map((i) => tokens[i].w).join(' ');
  const check = () => setChecked(normalize(sentence) === normalize(ex.a));
  return html`<div class="ex">
    <div class="ex-kind">${T('Construis la phrase', B('Susun kalimat', 'Build the sentence'))}</div>
    <div class="ex-prompt">${ex.fr}</div>
    ${ex.sub && html`<div class="ex-sub">${ex.sub}</div>`}
    <div class="build-line">${chosen.length ? chosen.map((i, k) => html`<button class="tok placed" disabled=${checked != null}
      onClick=${() => setChosen(chosen.filter((_, j) => j !== k))}>${tokens[i].w}</button>`) : html`<span class="placeholder">${T('Touche les mots dans l\'ordre…', B('Sentuh kata-kata sesuai urutan', 'Tap the words in order') + '…')}</span>`}</div>
    <div class="tokens">${tokens.map((t, i) => html`<button class="tok" disabled=${chosen.includes(i) || checked != null}
      onClick=${() => setChosen([...chosen, i])}>${t.w}</button>`)}</div>
    ${checked == null
      ? html`<button class="btn primary block" disabled=${chosen.length !== tokens.length} onClick=${check}>${T('Vérifier', B('Periksa', 'Check'))}</button>`
      : html`<${Feedback} ok=${checked} answer=${ex.a} why=${ex.why} onNext=${() => onDone(checked)} />`}
  </div>`;
}

export function Translate({ ex, onDone }) {
  const [val, setVal] = useState('');
  const [res, setRes] = useState(null);
  const check = (e) => {
    e.preventDefault();
    const n = normalize(val);
    const exact = ex.a.some((a) => normalize(a) === n);
    const close = !exact && ex.a.some((a) => similarity(a, val) >= 0.85);
    setRes({ ok: exact || close, close });
  };
  return html`<form class="ex" onSubmit=${check}>
    <div class="ex-kind">${ex.kindLabel || T('Traduis en indonésien', B('Terjemahkan', 'Translate'))}</div>
    <div class="ex-prompt">${ex.fr}${ex.audio && html` <${AudioBtn} text=${ex.audio.text} lang=${ex.audio.lang} />`}</div>
    <input class="input big" value=${val} onInput=${(e) => setVal(e.target.value)} disabled=${res != null}
      placeholder=${T('Écris ta réponse…', B('Tulis jawabanmu', 'Write your answer') + '…')} autocapitalize="off" autocomplete="off" spellcheck="false" />
    ${res == null
      ? html`<button class="btn primary block" disabled=${!val.trim()}>${T('Vérifier', B('Periksa', 'Check'))}</button>`
      : html`<${Feedback} ok=${res.ok} answer=${ex.a[0]} why=${res.close ? T(`Petite faute d'orthographe : la forme exacte est « ${ex.a[0]} ».`, `${B('Ejaan hampir benar', 'Almost right')}: « ${ex.a[0]} »`) : ex.a.length > 1 ? `${T('Aussi accepté', B('Juga benar', 'Also correct'))} : ${ex.a.slice(1).join(' · ')}` : ''} onNext=${() => onDone(res.ok)} />`}
  </form>`;
}

export function Speak({ ex, onDone }) {
  const [state, setState] = useState('idle');
  const [heard, setHeard] = useState('');
  const [score, setScore] = useState(0);
  const go = async () => {
    setState('listening');
    try {
      const alts = await listen(ex.lang || 'id');
      const best = Math.max(0, ...alts.map((a) => similarity(a, ex.text)));
      setHeard(alts[0] || '(rien entendu)');
      setScore(best);
      setState('done');
    } catch (e) {
      setHeard(e.message === 'not-allowed' ? 'Micro refusé. Autorise le micro dans le navigateur.' : 'Reconnaissance vocale indisponible.');
      setState('error');
    }
  };
  const ok = score >= 0.75;
  return html`<div class="ex">
    <div class="ex-kind">${T('Prononce à voix haute', B('Ucapkan dengan keras', 'Say it out loud'))} 🎙️</div>
    <div class="ex-prompt">${ex.text} <${AudioBtn} text=${ex.text} lang=${ex.lang || 'id'} /></div>
    <div class="ex-sub">${ex.fr}${ex.pron && html` · 🗣️ ${ex.pron}`}</div>
    ${state === 'idle' && html`<button class="btn mic block" onClick=${go}>🎙️ Appuie et parle</button>`}
    ${state === 'listening' && html`<button class="btn mic block listening" disabled>👂 J'écoute…</button>`}
    ${state === 'done' && html`<div class="feedback ${ok ? 'ok' : 'ko'}">
      <div class="fb-title">${ok ? '✨ Bien prononcé !' : '🔁 On réessaie ?'}</div>
      <div>Entendu : « ${heard} » · ${Math.round(score * 100)} %</div>
      <div class="row"><button class="btn ghost" onClick=${() => setState('idle')}>Réessayer</button>
      <button class="btn primary" onClick=${() => onDone(ok)}>Continuer →</button></div></div>`}
    ${state === 'error' && html`<div class="feedback ko"><div>${heard}</div><button class="btn primary block" onClick=${() => onDone(null)}>Passer →</button></div>`}
    ${state === 'idle' && html`<button class="btn link" onClick=${() => onDone(null)}>Passer (pas de micro maintenant)</button>`}
  </div>`;
}

// Associer des paires : on touche un élément à gauche puis à droite.
export function Match({ pairs, onDone, title, bigRight = false }) {
  const left = useMemo(() => shuffle(pairs.map((p, i) => ({ t: p[0], i }))), [pairs]);
  const right = useMemo(() => shuffle(pairs.map((p, i) => ({ t: p[1], i }))), [pairs]);
  const [sel, setSel] = useState(null);
  const [done, setDone] = useState([]);
  const [wrong, setWrong] = useState(null);
  const [errors, setErrors] = useState(0);
  const tap = (side, i) => {
    if (done.includes(i)) return;
    if (!sel || sel.side === side) return setSel({ side, i });
    if (sel.i === i) {
      const d = [...done, i];
      setDone(d); setSel(null);
      if (d.length === pairs.length) setTimeout(() => onDone(errors === 0, errors), 600);
    } else {
      setErrors(errors + 1);
      setWrong({ a: sel, b: { side, i } });
      setSel(null);
      setTimeout(() => setWrong(null), 600);
    }
  };
  const cls = (side, i) => {
    let c = 'pair';
    if (done.includes(i)) c += ' matched';
    else if (sel && sel.side === side && sel.i === i) c += ' selected';
    if (wrong && ((wrong.a.side === side && wrong.a.i === i) || (wrong.b.side === side && wrong.b.i === i))) c += ' shake';
    return c;
  };
  return html`<div class="ex">
    <div class="ex-kind">${title || T('Associe les paires', B('Cocokkan pasangan', 'Match the pairs'))}</div>
    <div class="match">
      <div class="col">${left.map((x) => html`<button class=${cls('l', x.i)} onClick=${() => tap('l', x.i)}>${x.t}</button>`)}</div>
      <div class="col">${right.map((x) => html`<button class=${cls('r', x.i) + (bigRight ? ' emoji' : '')} onClick=${() => tap('r', x.i)}>${x.t}</button>`)}</div>
    </div>
    <div class="muted center">${done.length}/${pairs.length} ${T('paires', 'pasangan (pairs)')} · ${errors} ${T('erreur' + (errors > 1 ? 's' : ''), 'salah (mistakes)')}</div>
  </div>`;
}

export function Listen({ ex, onDone }) {
  return html`<${MCQ} ex=${{ ...ex, kindLabel: T('Écoute et choisis 👂', B('Dengar dan pilih', 'Listen and choose') + ' 👂'), autoplay: true }} onDone=${onDone} />`;
}

const COMPONENTS = { mcq: MCQ, fill: Fill, build: Build, translate: Translate, speak: Speak, listen: Listen };

// Enchaîne une liste d'exercices, affiche le score et propose de rejouer les erreurs.
export function Session({ items, onFinish, onExit, finishLabel = T('Terminer', B('Selesai', 'Finish')), xp = 3, extra = {} }) {
  const [list, setList] = useState(items);
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState([]);
  const start = useRef(Date.now());
  useEffect(() => () => addStudyTime(Date.now() - start.current), []);

  const done = (ok) => {
    if (ok !== null) recordAnswer(ok, ok ? xp : 0);
    const r = [...results, { ex: list[idx], ok }];
    setResults(r);
    setIdx(idx + 1);
  };

  if (idx >= list.length) {
    const graded = results.filter((r) => r.ok !== null);
    const good = graded.filter((r) => r.ok).length;
    const pct = graded.length ? Math.round((good / graded.length) * 100) : 100;
    const missed = results.filter((r) => r.ok === false).map((r) => r.ex);
    return html`<div class="ex result">
      ${pct >= 80 && html`<${Confetti} />`}
      <div class="result-emoji">${pct >= 80 ? '🌟' : pct >= 50 ? '👍' : '🌱'}</div>
      <h2>${pct} % ${T('de réussite', B('benar', 'correct'))}</h2>
      <p class="muted">${good} / ${graded.length} ${T('bonnes réponses', B('jawaban benar', 'right answers'))}</p>
      ${missed.length > 0 && html`<button class="btn coral block" onClick=${() => { setList(shuffle(missed)); setIdx(0); setResults([]); }}>🔁 ${T(`Rejouer les ${missed.length} erreur${missed.length > 1 ? 's' : ''}`, `${B('Ulangi yang salah', 'Replay mistakes')} (${missed.length})`)}</button>`}
      <button class="btn primary block" onClick=${() => onFinish && onFinish(pct)}>${finishLabel}</button>
    </div>`;
  }

  const ex = list[idx];
  const C = COMPONENTS[ex.kind] || extra[ex.kind];
  return html`<div>
    <div class="progress-top">
      <button class="x" onClick=${onExit} aria-label="Exit">✕</button>
      <div class="bar"><i style=${`width:${(idx / list.length) * 100}%`}></i></div>
      <span class="muted">${idx + 1}/${list.length}</span>
    </div>
    <${C} key=${idx + ':' + list.length + ':' + results.length} ex=${ex} onDone=${done} />
  </div>`;
}

export const canDoListening = () => canSpeak('id');
export const canDoSpeaking = () => canListen() && location.protocol !== 'file:' && window.top === window;
