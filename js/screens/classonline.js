// Espace prof : ma classe en ligne (élèves, codes emoji, équipes, bocal d'étoiles). Textes en indonésien (anglais).
import { html, useState, useEffect } from '../vendor/preact-htm.js';
import { Back, Empty } from '../ui.js';
import { today } from '../store.js';
import { useRef } from '../vendor/preact-htm.js';
import { drawPoster, joinUrl } from '../qr.js';

const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return today(d); };
import { confirmBox, promptBox, notify } from '../dialog.js';
import {
  hasConfig, useAuth, teacherSignIn, signOut, myClasses, createClass, addStudent, removeStudent, getPins,
  updateClass, useDoc, usePlayers, isOnline, missionOf, STICKER_STEP, TEAMS, EMOJIS,
} from '../net/fb.js';

export function ClassOnline() {
  const auth = useAuth();
  const [classes, setClasses] = useState(null);
  const [code, setCode] = useState(null);
  const user = auth.user && !auth.user.email?.endsWith('language-quest.app') ? auth.user : null;
  useEffect(() => { if (user) myClasses().then((c) => { setClasses(c); if (c.length === 1) setCode(c[0].code); }).catch((e) => notify(e.message)); }, [user?.uid]);

  const wrap = (body) => html`<div class="page narrow"><${Back} to="/s/login" label="Kembali (Back)" /><h1>👩‍🏫 Kelasku (My class)</h1>${body}</div>`;

  if (!hasConfig()) return wrap(html`<div class="card"><p>Kelas online belum terhubung ke Firebase. (The online class is not connected to Firebase yet.)</p></div>`);
  if (auth.error) return wrap(html`<div class="card"><p>Tidak bisa terhubung ke Firebase. (Cannot reach Firebase.)</p><p class="muted small">${auth.error}</p></div>`);
  if (auth.loading) return wrap(html`<p class="muted">Menghubungkan… (Connecting)</p>`);
  if (auth.user && !user) return wrap(html`<div class="card"><p>HP ini masuk sebagai murid. (This phone is logged in as a student.)</p><button class="btn ghost" onClick=${signOut}>Keluar (Log out)</button></div>`);
  if (!user) return wrap(html`<div class="card"><p>Masuk dengan akun Google untuk mengatur kelasmu. (Sign in with Google to manage your class.)</p><p class="muted small">Murid tidak perlu email: cukup nama dan kode emoji. (Students need no email: just a name and an emoji code.)</p>
    <button class="btn primary lg block" onClick=${() => teacherSignIn().catch((e) => notify(e.message))}>Masuk dengan Google (Sign in with Google)</button></div>`);
  if (classes === null) return wrap(html`<p class="muted">Memuat… (Loading)</p>`);
  if (!code) return wrap(html`
    ${classes.map((c) => html`<button class="todo" onClick=${() => setCode(c.code)}><span class="todo-ic">🏫</span><span class="grow"><b>${c.name}</b><span class="muted small block">Kode (Code) ${c.code} · ${c.roster.length} murid (students)</span></span><span class="go">▶</span></button>`)}
    <${NewClass} onDone=${(c) => { setCode(c); myClasses().then(setClasses); }} />
    <p class="muted small">${user.email} · <button class="btn link" onClick=${signOut}>Keluar (Log out)</button></p>`);
  return html`<${ClassAdmin} code=${code} onBack=${classes.length > 1 ? () => setCode(null) : null} email=${user.email} />`;
}

function NewClass({ onDone }) {
  const [name, setName] = useState('Kelas Bahasa Inggris');
  const [n, setN] = useState(3);
  const [busy, setBusy] = useState(false);
  const go = async (e) => {
    e.preventDefault(); setBusy(true);
    try { onDone(await createClass(name.trim(), n)); } catch (err) { notify(err.message); }
    setBusy(false);
  };
  return html`<form class="card" onSubmit=${go}><h2>Buat kelas (Create a class)</h2>
    <label>Nama kelas (Class name)<input id="class-name" class="input" value=${name} onInput=${(e) => setName(e.target.value)} required /></label>
    <div class="row wrap" style="margin:.6rem 0"><b>Tim (Teams):</b>${[2, 3, 4].map((k) => html`<button type="button" class=${'chip' + (n === k ? ' on' : '')} onClick=${() => setN(k)}>${k}</button>`)}
      <span class="muted small">${TEAMS.slice(0, n).map((t) => t.icon + ' ' + t.name).join(' · ')}</span></div>
    <button class="btn primary block" disabled=${busy}>${busy ? '…' : 'Buat kelas (Create class)'}</button></form>`;
}

function ClassAdmin({ code, onBack, email }) {
  const c = useDoc(['classes', code]);
  const players = usePlayers(code);
  const [pins, setPins] = useState({});
  const [showPins, setShowPins] = useState(false);
  const [name, setName] = useState('');
  const [team, setTeam] = useState(0);
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState(null);
  useEffect(() => { getPins(code).then(setPins).catch(() => {}); }, [code, fresh]);
  if (!c) return html`<div class="page narrow"><p class="muted">Memuat… (Loading)</p></div>`;
  const teams = c.teams || [];
  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const r = await addStudent(code, name.trim(), team);
      setFresh({ name: name.trim(), pin: r.pin });
      setName(''); setTeam((team + 1) % teams.length);
    } catch (err) { notify('Gagal menambah murid (Could not add student): ' + err.message); }
    setBusy(false);
  };
  const byUid = Object.fromEntries(players.map((p) => [p.uid, p]));
  const online = players.filter(isOnline).length;
  return html`<div class="page narrow">
    <div class="row between">${onBack ? html`<button class="btn ghost sm" onClick=${onBack}>← Kelasku (My classes)</button>` : html`<${Back} to="/s/login" label="Kembali (Back)" />`}<span class="muted small">${email}</span></div>
    <h1>🏫 ${c.name}</h1>
    <div class="hero-card teal"><div><small>Kode kelas (Class code)</small><div class="big-num code">${code}</div><span class="small">Murid mengetiknya sekali di HP mereka (Students type it once on their phone)</span></div></div>

    <${ClassQR} code=${code} name=${c.name} />

    <h2>🫙 Toples bintang (Star jar)</h2>
    <div class="card">
      <div class="jar"><i style=${`width:${Math.min(100, (c.jar / c.jarGoal) * 100)}%`}></i><span>⭐ ${c.jar} / ${c.jarGoal}</span></div>
      <p>Hadiah (Reward): <b>${c.reward}</b></p>
      <div class="row wrap">
        <button class="btn ghost sm" onClick=${async () => { const r = await promptBox('Hadiah kalau toples penuh? (Reward when the jar is full?)', c.reward); if (r) updateClass(code, { reward: r }); }}>✏️ Hadiah (Reward)</button>
        <button class="btn ghost sm" onClick=${async () => { const g = Number(await promptBox('Target bintang? (Star goal?)', String(c.jarGoal))); if (g > 0) updateClass(code, { jarGoal: g }); }}>🎯 Target (Goal)</button>
        <button class="btn ghost sm" onClick=${async () => { if (await confirmBox('Kosongkan toples? (Empty the jar?)')) updateClass(code, { jar: 0 }); }}>🔄 Kosongkan (Empty)</button>
      </div>
    </div>

    <h2>🏆 Tim (Teams)</h2>
    <div class="scoreboard">${teams.map((t, i) => html`<div class="score" style=${`--c:${t.color}`}><span class="team-ic">${t.icon}</span><b class="pts">${c['t' + i] || 0}</b><span class="tname">${t.name}</span></div>`)}</div>
    <button class="btn link" onClick=${async () => { if (await confirmBox('Nol-kan poin tim? (Reset team points?)')) updateClass(code, { t0: 0, t1: 0, t2: 0, t3: 0 }); }}>Nol-kan poin tim (Reset team points)</button>

    <h2>👧 Murid (Students) ${c.roster.length} · ${online} online</h2>
    ${fresh && html`<div class="card fresh"><b>${fresh.name}</b> ditambahkan (added). Kode rahasianya (Her secret code):
      <div class="pin-big">${fresh.pin.map((i) => html`<span>${EMOJIS[i]}</span>`)}</div>
      <span class="muted small">Tunjukkan padanya atau tulis di kertas. (Show it to her or write it on paper.)</span>
      <button class="btn ghost sm" onClick=${() => setFresh(null)}>OK</button></div>`}
    <form class="card" onSubmit=${add}>
      <div class="qa-row">
        <input id="student-name" class="input" placeholder="Nama (Name), contoh: Siti" value=${name} onInput=${(e) => setName(e.target.value)} />
        <select id="student-team" class="input" value=${team} onChange=${(e) => setTeam(Number(e.target.value))}>${teams.map((t, i) => html`<option value=${i}>${t.icon} ${t.name}</option>`)}</select>
        <button class="btn primary" disabled=${busy}>${busy ? '…' : '＋ Tambah (Add)'}</button>
      </div>
    </form>
    ${c.roster.length === 0 ? html`<${Empty} icon="👧">Tambahkan murid satu per satu: masing-masing dapat kode 4 emoji. (Add students one by one: each gets a 4-emoji code.)</${Empty}>` : html`
      <button class="btn ghost sm" onClick=${() => setShowPins(!showPins)}>${showPins ? '🙈 Sembunyikan kode (Hide codes)' : '🔑 Lihat kode (Show codes)'}</button>
      <div class="roster">${c.roster.map((r) => {
        const p = byUid[r.uid] || {};
        const m = missionOf(p);
        const t = teams[r.team] || {};
        return html`<div class="roster-row" style=${`--c:${t.color}`}>
          <span class="av">${p.avatar || r.avatar}</span>
          <span class="grow"><b>${r.name}</b> ${isOnline(p) ? html`<i class="dot-on" title="Online"></i>` : ''}
            <span class="muted small block">${t.icon} ${t.name} · ⭐ ${p.stars || 0} · 🎟️ ${Math.floor((p.stars || 0) / STICKER_STEP)} · ⚔️ ${p.races || 0} · 🏝️ Level ${p.pathLevel || 0} · 🔥 ${p.pathDay === today() || p.pathDay === yesterday() ? p.pathStreak || 0 : 0}${p.pathDay === today() ? ' · ✅ ' + 'hari ini (today)' : ''}${m.bonus ? ' · 🎯 misi (mission)' : ''}</span>
            ${showPins && html`<span class="pin-small">${pins[r.uid] || '—'}</span>`}</span>
          <button class="btn ghost sm" onClick=${async () => { if (await confirmBox(`Hapus ${r.name}? (Remove ${r.name}?)`)) removeStudent(code, r.uid).catch((e) => notify(e.message)); }} aria-label="Remove">✕</button>
        </div>`;
      })}</div>`}

    <h2>📲 Cara murid masuk (How students log in)</h2>
    <div class="card"><ol>
      <li>Buka link aplikasi. (Open the app link.)</li>
      <li>Ketik kode <b>${code}</b>, pilih nama, lalu 4 emoji. (Type the code, pick your name, then your 4 emojis.)</li>
      <li>Tips: « Tambahkan ke layar utama » (Add to home screen).</li>
    </ol></div>
  </div>`;
}

// QR code : les élèves scannent et arrivent directement sur la connexion de la classe.
function ClassQR({ code, name }) {
  const ref = useRef(null);
  const [url, setUrl] = useState('');
  const [err, setErr] = useState(false);
  useEffect(() => {
    drawPoster(ref.current, code, name).then((cv) => setUrl(cv.toDataURL('image/png'))).catch(() => setErr(true));
  }, [code, name]);
  return html`<h2>📲 Kode QR (QR code)</h2>
    <div class="card qr-card">
      <canvas ref=${ref} class="qr-poster" aria-label="QR code"></canvas>
      ${err && html`<p class="muted">QR tidak bisa dibuat tanpa internet. (No internet: QR unavailable.)</p>`}
      <p class="small">Murid scan dengan kamera HP → langsung ke kelas ${code}. (Students scan with the phone camera → straight to the class.)</p>
      <code class="small">${joinUrl(code)}</code>
      ${url && html`<a class="btn primary block" href=${url} download=${`qr-kelas-${code}.png`}>⬇️ Unduh poster (Download poster)</a>`}
    </div>`;
}
