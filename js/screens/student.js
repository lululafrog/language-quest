// Espace élève (en indonésien) : connexion, accueil, défis entre copines, équipe et autocollants.
import { html, useState, useEffect, useMemo, useRef } from '../vendor/preact-htm.js';
import { go, shuffle, Confetti, AudioBtn } from '../ui.js';
import { speak } from '../speech.js';
import { EN_ALL, EN_BY_ID } from '../data/english.js';
import { SCENES, SCENE_BY_ID, sayTouch, sceneWords } from '../data/scenes.js';
import { pictured } from '../gen.js';
import { duelQuestions } from './multiplayer.js';
import { Scene } from './touch.js';
import { setUiLang } from '../i18n.js';
import { DailyCard } from './island.js';
import { isDue } from '../fsrs.js';
import { useStore } from '../store.js';

// Raccourci « mots à revoir » sur l'accueil.
function WordsCard() {
  const s = useStore();
  const all = Object.keys(s.wordbank || {});
  const due = all.filter((w) => !s.cards['w:' + w] || isDue(s.cards['w:' + w])).length;
  return html`<button class="todo words-cta" onClick=${() => go(all.length ? '/s/words' : '/s/read')}>
    <span class="todo-ic">📚</span><span class="grow"><b>${all.length ? `Kata-kataku (My words) · ${all.length}` : 'Baca cerita (Read a story)'}</b>
    <span class="muted small block">${all.length ? (due ? `${due} kata untuk diulang hari ini (to review today)` : 'Semua sudah diulang! (All reviewed!)') : 'Lagu & cerita rakyat Indonesia (Songs & Indonesian folk tales)'}</span></span><span class="go">▶</span></button>`;
}
import {
  hasConfig, useAuth, getClass, studentSignIn, signOut, useDoc, usePlayers, useMyMatches, usePresence, isOnline,
  awardStars, updateMe, bump, missionOf, MISSION, useStudent, createMatch, matchStep, matchResult, EMOJIS, AVATARS, STICKERS, STICKER_STEP,
} from '../net/fb.js';

export { useStudent };

const Wait = ({ text = 'Tunggu sebentar… (Please wait)' }) => html`<div class="page narrow center-page"><div class="giant spin">🌴</div><p class="muted">${text}</p></div>`;

// ---------- CONNEXION ----------
export function StudentLogin({ initial }) {
  const [step, setStep] = useState('code');
  const [code, setCode] = useState(() => { if (initial) return initial.toUpperCase(); try { return localStorage.getItem('lq-last-class') || ''; } catch { return ''; } });
  const [cls, setCls] = useState(null);
  const [who, setWho] = useState(null);
  const [pin, setPin] = useState([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (!hasConfig()) return html`<div class="page narrow"><h1>👧 Masuk murid (Student login)</h1><div class="card"><p>Kelas online belum aktif. (The online class is not active yet.)</p><p class="muted small">Tanya gurumu. (Ask your teacher.)</p></div>
    <button class="btn coral xl block" onClick=${() => go('/s/play')}>🎮 Main sekarang (Play now)</button></div>`;

  useEffect(() => { if (initial && hasConfig()) findClass(); }, []);
  const findClass = async (e) => {
    e?.preventDefault(); setErr(''); setBusy(true);
    try {
      const c = await getClass(code);
      if (!c) setErr('Kode kelas tidak ditemukan. Coba lagi! (Class code not found. Try again!)');
      else { setCls(c); setStep('name'); try { localStorage.setItem('lq-last-class', c.code); } catch { /* rien */ } }
    } catch { setErr('Tidak ada internet? Coba lagi. (No internet? Try again.)'); }
    setBusy(false);
  };
  const tapEmoji = async (i) => {
    const p = [...pin, i];
    setPin(p); setErr('');
    if (p.length < 4) return;
    setBusy(true);
    try {
      await studentSignIn(cls.code, who.rid, p);
      setUiLang('id');
      go('/s');
    } catch (e2) {
      setErr(e2.code === 'auth/too-many-requests' ? 'Terlalu banyak percobaan. Tunggu sebentar ya. (Too many tries. Wait a moment.)' : 'Kode salah. Coba lagi! (Wrong code. Try again!) 🙂');
      setPin([]);
    }
    setBusy(false);
  };

  return html`<div class="page narrow student-login">
    ${step !== 'code' && html`<button class="btn ghost sm" onClick=${() => (step === 'pin' ? setStep('name') : setStep('code'))}>← Kembali (Back)</button>`}
    ${step === 'code' && html`<form class="center-page" onSubmit=${findClass}>
      <div class="giant">🏫</div><h1>Halo! Masukkan kode kelas</h1><p class="muted">(Hello! Enter your class code)</p>
      <input id="class-code" class="input big code" value=${code} onInput=${(e) => setCode(e.target.value.toUpperCase())} maxlength="8" autocapitalize="characters" autocomplete="off" placeholder="ABC123" />
      <button class="btn coral xl" disabled=${code.trim().length < 4 || busy}>${busy ? '…' : 'Lanjut (Next) →'}</button>
      ${err && html`<p class="ko-text">${err}</p>`}
      <button type="button" class="btn ghost" onClick=${() => go('/s/play')}>🎮 Main tanpa masuk (Play without logging in)</button>
      <button type="button" class="btn link" onClick=${() => go('/guru')}>👩‍🏫 Guru (Teacher)</button></form>`}
    ${step === 'name' && html`<div class="center-page"><h1>Siapa namamu? (What's your name?)</h1><p class="muted">${cls.name}</p>
      <div class="name-grid">${[...cls.roster].sort((a, b) => a.name.localeCompare(b.name)).map((r) => html`<button class="name-btn" onClick=${() => { setWho(r); setPin([]); setStep('pin'); }}><span>${r.avatar}</span>${r.name}</button>`)}</div>
      ${cls.roster.length === 0 && html`<p class="muted">Belum ada murid. Tanya gurumu! (No students yet. Ask your teacher!)</p>`}</div>`}
    ${step === 'pin' && html`<div class="center-page"><div class="giant">${who.avatar}</div><h1>Halo ${who.name}! Kode rahasiamu? (Your secret code?)</h1>
      <div class="pin-slots">${[0, 1, 2, 3].map((k) => html`<span class=${pin[k] != null ? 'on' : ''}>${pin[k] != null ? EMOJIS[pin[k]] : ''}</span>`)}</div>
      <div class="emoji-pad">${EMOJIS.map((e, i) => html`<button disabled=${busy} onClick=${() => tapEmoji(i)}>${e}</button>`)}</div>
      ${pin.length > 0 && !busy && html`<button class="btn link" onClick=${() => setPin(pin.slice(0, -1))}>⌫ Hapus (Delete)</button>`}
      ${err && html`<p class="ko-text">${err}</p>`}
      <p class="muted small">Lupa kodemu? Tanya gurumu. (Forgot your code? Ask your teacher.) 🙂</p></div>`}
  </div>`;
}

// ---------- PONT : missions et étoiles ----------
const REWARD = { photo: 1, touch: 2, read: 2, review: 1 };
export function StudentBridge() {
  const { code, uid, me, cls } = useStudent();
  usePresence(code, uid);
  const meRef = useRef(me);
  meRef.current = me;
  useEffect(() => {
    const on = async (e) => {
      const m = meRef.current;
      if (!m || !code) return;
      const { kind, n } = e.detail;
      const mission = { ...missionOf(m) };
      mission[kind] = (mission[kind] || 0) + n;
      let stars = REWARD[kind] ? REWARD[kind] * n : 0;
      if (!mission.bonus && MISSION.every((x) => (mission[x.k] || 0) >= x.n)) { mission.bonus = true; stars += 5; }
      try {
        await updateMe(code, uid, { mission });
        await awardStars(code, uid, m.team, stars);
      } catch { /* hors ligne : tant pis */ }
    };
    addEventListener('lq:progress', on);
    return () => removeEventListener('lq:progress', on);
  }, [code, uid]);
  useEffect(() => { if (cls === null && uid) { signOut(); go('/s/login'); } }, [cls, uid]);
  return null;
}

// ---------- ACCUEIL ----------
export function StudentHome() {
  const { auth, code, uid, cls, me } = useStudent();
  const players = usePlayers(cls ? code : null);
  const matches = useMyMatches(cls ? code : null, uid);
  const [pickAv, setPickAv] = useState(false);
  if (!auth.loading && (!auth.user || !code)) return html`<div class="page narrow student">
    <h1>Halo! 👋</h1>
    <${DailyCard} />
    <${WordsCard} />
    <div class="card"><b>👯 ${'Masuk untuk main dengan teman! (Log in to play with friends!)'}</b>
      <p class="muted small">Tantang teman, kumpulkan bintang untuk timmu. (Challenge friends, collect stars for your team.)</p>
      <button class="btn primary block" onClick=${() => go('/s/login')}>Masuk (Log in)</button></div>
  </div>`;
  if (auth.loading || !cls || !me) return html`<${Wait} />`;

  const friends = players.filter((p) => p.uid !== uid).sort((a, b) => (isOnline(b) - isOnline(a)) || a.name.localeCompare(b.name));
  const invites = matches.filter((m) => m.uids[1] === uid && !m.p[uid].done);
  const waiting = matches.filter((m) => m.p[uid].done && !m.p[m.uids.find((u) => u !== uid)].done);
  const results = matches.filter((m) => matchResult(m, uid)).slice(0, 5);
  const mission = missionOf(me);
  const nextSticker = STICKER_STEP - (me.stars % STICKER_STEP);
  const team = cls.teams[me.team] || {};

  return html`<div class="page narrow student">
    <div class="me-card" style=${`--c:${team.color}`}>
      <button class="me-av" onClick=${() => setPickAv(!pickAv)} aria-label="Change avatar">${me.avatar}</button>
      <div class="grow"><h1>Halo, ${me.name}!</h1><span class="muted small">${team.icon} Tim ${team.name}</span></div>
      <div class="me-stars"><b>⭐ ${me.stars}</b><small>${nextSticker} lagi → stiker baru (to a new sticker)</small></div>
    </div>
    <${DailyCard} />
    <${WordsCard} />
    ${pickAv && html`<div class="card av-pick">${AVATARS.map((a) => html`<button onClick=${() => { updateMe(code, uid, { avatar: a }); setPickAv(false); }}>${a}</button>`)}</div>`}

    ${invites.map((m) => { const o = m.uids[0]; return html`<button class="invite" onClick=${() => go('/s/race/' + m.id)}>
      <span class="av">${m.avatars[o]}</span><span class="grow"><b>${m.names[o]} menantangmu! (challenges you!)</b><span class="small block">${m.title}${m.p[o].done ? ` · skor (score) ${m.p[o].score}` : ''}</span></span><span class="btn coral">Main! (Play!) ⚔️</span></button>`; })}

    <h2>🎯 Misi hari ini (Today's mission)</h2>
    <div class="card mission">${MISSION.map((x) => {
      const v = Math.min(mission[x.k] || 0, x.n);
      return html`<div class=${'mrow' + (v >= x.n ? ' done' : '')}><span>${v >= x.n ? '✅' : x.icon}</span><span class="grow">${x.id}</span><b>${v}/${x.n}</b></div>`;
    })}<div class="muted small">${mission.bonus ? '🎉 Misi selesai! +5 ⭐ untuk timmu (Mission complete! +5 ⭐ for your team)' : 'Selesaikan semua: bonus +5 ⭐ (Finish all: +5 ⭐ bonus)'}</div></div>

    <h2>👯 Teman-teman · tantang mereka! (Friends · challenge them!)</h2>
    <div class="friends">${friends.map((p) => html`<div class="friend">
      <span class="av">${p.avatar}${isOnline(p) && html`<i class="dot-on"></i>`}</span>
      <span class="grow"><b>${p.name}</b><span class="small muted block">${isOnline(p) ? 'Online sekarang (Online now)' : `⭐ ${p.stars}`} · 🏝️ Level ${(p.pathLevel || 0) + 1}${p.pathStreak ? ` · 🔥 ${p.pathStreak}` : ''}</span></span>
      <button class="btn primary sm" onClick=${() => go('/s/new/' + p.uid)}>⚔️ Tantang (Challenge)</button></div>`)}
      ${friends.length === 0 && html`<p class="muted">Teman-temanmu belum terdaftar. (Your friends are not registered yet.)</p>`}</div>

    ${waiting.length > 0 && html`<h3>⏳ Menunggu (Waiting)</h3>${waiting.map((m) => { const o = m.uids.find((u) => u !== uid); return html`<button class="todo" onClick=${() => go('/s/race/' + m.id)}><span class="todo-ic">${m.avatars[o]}</span><span class="grow"><b>${m.names[o]}</b><span class="muted small block">${m.title} · skormu (your score) ${m.p[uid].score}</span></span></button>`; })}`}
    ${results.length > 0 && html`<h3>🏁 Hasil minggu ini (This week's results)</h3>${results.map((m) => { const o = m.uids.find((u) => u !== uid); const r = matchResult(m, uid); return html`<button class="todo" onClick=${() => go('/s/race/' + m.id)}><span class="todo-ic">${r === 'win' ? '🏆' : r === 'tie' ? '🤝' : '💪'}</span><span class="grow"><b>${r === 'win' ? 'Menang (Won)' : r === 'tie' ? 'Seri (Draw)' : 'Kalah (Lost)'} vs ${m.names[o]}</b><span class="muted small block">${m.title} · ${m.p[uid].score} – ${m.p[o].score}</span></span></button>`; })}`}

    <${ClassJar} cls=${cls} />
  </div>`;
}

function ClassJar({ cls }) {
  const ranked = cls.teams.map((t, i) => ({ ...t, pts: cls['t' + i] || 0 })).sort((a, b) => b.pts - a.pts);
  return html`<h2>🫙 Toples bintang kelas (Class star jar)</h2>
    <div class="card"><div class="jar"><i style=${`width:${Math.min(100, (cls.jar / cls.jarGoal) * 100)}%`}></i><span>⭐ ${cls.jar} / ${cls.jarGoal}</span></div>
      <p class="small">Kalau penuh (when full): <b>${cls.reward}</b>. Semua bintang dari semua murid masuk ke sini! (Everyone's stars go here!)</p>
      <div class="scoreboard">${ranked.map((t) => html`<div class="score" style=${`--c:${t.color}`}><span class="team-ic">${t.icon}</span><b class="pts">${t.pts}</b><span class="tname">${t.name}</span></div>`)}</div></div>`;
}

// ---------- JOUER SEULE ----------
export function StudentPlay() {
  const { auth } = useStudent();
  const tile = (icon, name, sub, to) => html`<button class="game-tile" onClick=${() => go(to)}><span class="game-icon">${icon}</span><b>${name}</b><span class="muted small">${sub}</span></button>`;
  return html`<div class="page narrow student">
    <h1>🎮 Main (Play)</h1>
    <div class="game-grid">
      ${tile('👆', 'Touch it!', 'Sentuh tangan, hidung, pintu… (Touch the hand, the nose…)', '/games/touch')}
      ${tile('📸', 'Foto 5 kata', 'Foto benda di sekitarmu (Photo things around you)', '/photo')}
      ${tile('🃏', 'Kartu foto', 'Gambar → kata bahasa Inggris (Picture → English word)', '/photo/cards')}
      ${tile('🔎', 'Cari fotonya', 'Dengar kata, pilih foto (Listen, pick the photo)', '/photo/find')}
      ${tile('❓', 'Kuis (Quiz)', 'Pilih jawaban yang benar (Choose the right answer)', '/games/quiz')}
      ${tile('🔗', 'Cocokkan (Match)', 'Kata ↔ gambar (Word ↔ picture)', '/games/match')}
      ${tile('🧠', 'Memori (Memory)', 'Cari pasangan kartu (Find the pairs)', '/games/memory')}
      ${tile('✏️', 'Lengkapi (Fill in)', '« She ___ happy. »', '/games/fill')}
      ${tile('🧱', 'Susun kalimat (Build)', 'Urutkan kata (Put the words in order)', '/games/build')}
    </div>
    <h2>👯 Main berdua di 1 HP (Two players, one phone)</h2>
    <div class="game-grid">
      ${tile('⚔️', 'Quiz Duel', 'Berhadapan, yang tercepat menang (Face to face, fastest wins)', '/games/duel')}
      ${tile('🎈', 'Hangman', 'Tebak kata huruf demi huruf (Guess the word letter by letter)', '/games/hangman')}
    </div>
    ${!auth.user && html`<div class="card"><b>👧 Masuk untuk tantang teman! (Log in to challenge friends!)</b><button class="btn primary block" style="margin-top:.5rem" onClick=${() => go('/s/login')}>Masuk (Log in)</button></div>`}
    <h2>⚔️ Tantang teman (Challenge a friend)</h2>
    <p class="muted">Pilih teman di Beranda, lalu pilih permainan. Kalian main di HP masing-masing! (Pick a friend on Home, then a game. Each plays on her own phone!)</p>
    <button class="btn coral lg block" onClick=${() => go('/s')}>👯 Lihat teman-teman (See friends)</button>
  </div>`;
}

// ---------- ÉQUIPE ET AUTOCOLLANTS ----------
export function StudentTeam() {
  const { cls, me } = useStudent();
  if (!cls || !me) return html`<${Wait} />`;
  const got = Math.floor(me.stars / STICKER_STEP);
  return html`<div class="page narrow student">
    <h1>🌟 Stiker & tim (Stickers & team)</h1>
    <div class="card"><b>⭐ ${me.stars} bintang (stars)</b> · ${got} stiker · 🏆 ${me.wins || 0} menang (wins) / ⚔️ ${me.races || 0} tantangan (challenges)
      <div class="jar small-jar"><i style=${`width:${((me.stars % STICKER_STEP) / STICKER_STEP) * 100}%`}></i><span>Stiker berikutnya (next sticker): ${me.stars % STICKER_STEP}/${STICKER_STEP}</span></div></div>
    <h2>📒 Album stikerku (My sticker album)</h2>
    <div class="album">${STICKERS.map((s, i) => html`<span class=${i < got ? 'on' : ''}>${i < got ? s : '?'}</span>`)}</div>
    <${ClassJar} cls=${cls} />
    <button class="btn ghost block" onClick=${async () => { await signOut(); setUiLang('fr'); go('/s/login'); }}>🚪 Keluar (Log out)</button>
  </div>`;
}

// ---------- NOUVEAU DÉFI ----------
const QUIZ_SRC = () => [
  ...EN_ALL.filter((l) => pictured(l.vocab).length >= 4 && l.id !== 'en-verbs').map((l) => ({ src: l.id, title: `${l.icon} ${l.title}` })),
  { src: 'verbs-id', title: '📗 Verbs' }, { src: 'verbs-past', title: '⏪ Past: go → went' }, { src: 'verbs-ing', title: '⏳ -ing: swim → swimming' },
];

export function StudentNew({ friendUid }) {
  const { code, cls, me } = useStudent();
  const players = usePlayers(cls ? code : null);
  const [busy, setBusy] = useState(false);
  const friend = players.find((p) => p.uid === friendUid);
  if (!cls || !me || !friend) return html`<${Wait} />`;
  const start = async (game) => {
    setBusy(true);
    try { go('/s/race/' + await createMatch(code, me, friend, game)); }
    catch { setBusy(false); }
  };
  const touch = (sc) => start({ kind: 'touch', src: sc.id, scene: sc.id, title: `${sc.icon} Touch it: ${sc.title}`, qs: shuffle(sc.zones.map((z) => z.w)).slice(0, 8) });
  const quiz = (q) => start({ kind: 'quiz', src: q.src, title: q.title, qs: duelQuestions(q.src, 10) });
  return html`<div class="page narrow student">
    <button class="btn ghost sm" onClick=${() => go('/s')}>← Kembali (Back)</button>
    <h1>⚔️ Tantang ${friend.avatar} ${friend.name}</h1>
    <p class="muted">Pilih permainan. Kalian menjawab pertanyaan yang sama, di HP masing-masing. Yang paling banyak benar menang! (Same questions, each on her own phone. Most right answers wins!)</p>
    <h2>👆 Touch it!</h2>
    <div class="src-grid">${SCENES.map((sc) => html`<button class="src" disabled=${busy} onClick=${() => touch(sc)}>${sc.icon} ${sc.title}</button>`)}</div>
    <h2>❓ Kuis (Quiz)</h2>
    <div class="src-grid">${QUIZ_SRC().map((q) => html`<button class="src" disabled=${busy} onClick=${() => quiz(q)}>${q.title}</button>`)}</div>
  </div>`;
}

// ---------- COURSE ----------
export function StudentRace({ id }) {
  const { code, uid, cls, me } = useStudent();
  const m = useDoc(cls ? ['classes', code, 'matches', id] : null);
  const [i, setI] = useState(null);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);
  const t0 = useRef(0);
  const claimed = useRef(false);
  const mine = m?.p?.[uid];
  const other = m && m.uids.find((u) => u !== uid);
  const res = m && matchResult(m, uid);

  // Récompense finale, une seule fois par joueuse.
  useEffect(() => {
    if (!m || !res || mine.claimed || claimed.current) return;
    claimed.current = true;
    const bonus = res === 'win' ? 3 : res === 'tie' ? 2 : 1;
    matchStep(code, id, uid, { claimed: true })
      .then(() => awardStars(code, uid, me.team, bonus))
      .then(() => (res === 'win' ? bump(code, uid, { wins: 1 }) : null))
      .catch(() => {});
  }, [res]);

  if (m === undefined || !me) return html`<${Wait} />`;
  if (m === null) return html`<div class="page narrow center-page"><p>Tantangan tidak ditemukan. (Challenge not found.)</p><button class="btn primary" onClick=${() => go('/s')}>Beranda (Home)</button></div>`;

  const started = i !== null;
  const total = m.qs.length;
  const finish = async (sc) => {
    const ms = Date.now() - t0.current;
    await matchStep(code, id, uid, { done: true, score: sc, ms, i: total });
    await awardStars(code, uid, me.team, Math.ceil(sc / 2));
    await bump(code, uid, { races: 1 });
    window.dispatchEvent(new CustomEvent('lq:progress', { detail: { kind: 'race', n: 1 } }));
  };
  const answer = (ok) => {
    const sc = score + (ok ? 1 : 0);
    setScore(sc);
    const ni = i + 1;
    matchStep(code, id, uid, { i: ni, score: sc }).catch(() => {});
    setTimeout(() => { setPicked(null); if (ni >= total) { setI(ni); finish(sc); } else setI(ni); }, ok ? 650 : 1300);
  };

  const bars = html`<div class="race-bars">${[uid, other].map((u) => {
    const p = m.p[u];
    const prog = u === uid && started && !mine.done ? i : p.i;
    return html`<div class="race-bar"><span class="av">${m.avatars[u]}</span><div class="grow"><b>${u === uid ? 'Kamu (You)' : m.names[u]}</b>
      <div class="track"><i style=${`width:${(prog / total) * 100}%`}></i></div></div><b class="race-score">${u === uid && started && !mine.done ? score : p.score}</b></div>`;
  })}</div>`;

  // Terminé ou en attente
  if (mine.done) {
    const o = m.p[other];
    return html`<div class="page narrow student center-page">${res === 'win' && html`<${Confetti} />`}
      ${bars}
      ${res ? html`<div class="giant">${res === 'win' ? '🏆' : res === 'tie' ? '🤝' : '💪'}</div>
          <h1>${res === 'win' ? 'Kamu menang! (You win!)' : res === 'tie' ? 'Seri! (Draw!)' : `${m.names[other]} menang! (wins!)`}</h1>
          <p class="huge-ish">${mine.score} – ${o.score}</p><p class="muted">+${res === 'win' ? 3 : res === 'tie' ? 2 : 1} ⭐ bonus untuk timmu (for your team)</p>
          <button class="btn coral lg" onClick=${() => go('/s/new/' + other)}>🔁 Main lagi (Play again)</button>`
        : html`<div class="giant spin">⏳</div><h1>Skormu (Your score): ${mine.score}/${total}</h1><p class="muted">Menunggu (Waiting for) ${m.names[other]}… ${o.i}/${total}</p>`}
      <button class="btn ghost" onClick=${() => go('/s')}>Beranda (Home)</button>
    </div>`;
  }

  if (!started) return html`<div class="page narrow student center-page">
    ${bars}
    <div class="giant">⚔️</div><h1>${m.title}</h1>
    <p>${m.names[m.uids[0]]} vs ${m.names[m.uids[1]]} · ${total} soal (questions)</p>
    <p class="muted small">${isOnlineVs(m, other) ? 'Main bersama sekarang, atau nanti juga boleh! (Play together now, or later!)' : 'Temanmu bisa main nanti. Skormu akan menunggu! (Your friend can play later. Your score will wait!)'}</p>
    <button class="btn coral xl" onClick=${() => { t0.current = Date.now(); setI(0); }}>▶ Mulai! (Start!)</button>
    <button class="btn ghost" onClick=${() => go('/s')}>Nanti saja (Later)</button>
  </div>`;

  if (i >= total) return html`<${Wait} text="Menyimpan… (Saving)" />`;
  const q = m.qs[i];
  return html`<div class="page narrow student race">
    ${bars}
    ${m.kind === 'touch' ? html`<${TouchQ} key=${i} scId=${m.scene} target=${q} onAnswer=${answer} />`
      : html`<${QuizQ} key=${i} q=${q} picked=${picked} onPick=${(o) => { if (picked) return; setPicked(o); answer(o === q.a); }} />`}
    <p class="muted center small">${i + 1} / ${total}</p>
  </div>`;
}

const isOnlineVs = (m, other) => m.p[other].i > 0;

function QuizQ({ q, picked, onPick }) {
  const opts = useMemo(() => shuffle(q.options), [q]);
  useEffect(() => { if (/^[A-Za-z' ]+$/.test(q.prompt) && q.prompt !== 'What is it?') speak(q.prompt, 'en'); }, [q]);
  return html`<div class="ex">
    <div class="ex-prompt">${q.img && html`<img class="duel-img" src=${q.img} alt="" />`}${q.emoji && html`<div class="ex-emoji">${q.emoji}</div>`}${q.prompt}</div>
    <div class="choices big">${opts.map((o) => {
      let c = 'choice';
      if (picked) { if (o === q.a) c += ' right'; else if (o === picked) c += ' wrong'; else c += ' dim'; }
      return html`<button class=${c} disabled=${!!picked} onClick=${() => onPick(o)}>${o}</button>`;
    })}</div>
  </div>`;
}

function TouchQ({ scId, target, onAnswer }) {
  const sc = SCENE_BY_ID[scId];
  const [marks, setMarks] = useState({});
  const [labels, setLabels] = useState([]);
  const [done, setDone] = useState(false);
  useEffect(() => { speak(sayTouch(sc, target, 'en'), 'en'); }, []);
  const tap = (w) => {
    if (done) return;
    setDone(true);
    const ok = w === target;
    setMarks(ok ? { [w]: 'ok' } : { [w]: 'ko', [target]: 'ok' });
    setLabels(ok ? [w] : [w, target]);
    onAnswer(ok);
  };
  return html`<div>
    <div class="touch-prompt"><span>${sayTouch(sc, target, 'en')}</span><${AudioBtn} text=${sayTouch(sc, target, 'en')} lang="en" /></div>
    <${Scene} sc=${sc} marks=${marks} labels=${labels} onTap=${tap} />
    <p class="muted center small">🇮🇩 ${done ? sceneWords(sc)[target].id : '…'}</p>
  </div>`;
}
