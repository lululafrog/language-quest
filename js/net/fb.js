// Classe en ligne : Firebase (connexion, élèves, présence, défis entre téléphones).
// Le SDK n'est chargé que lorsqu'on ouvre l'espace classe.
import { useState, useEffect } from '../vendor/preact-htm.js';
import { FIREBASE_CONFIG } from '../firebase-config.js';
import { today } from '../store.js';

const V = '10.12.2';
const lib = (m) => import(`https://www.gstatic.com/firebasejs/${V}/firebase-${m}.js`);

export const hasConfig = () => !!FIREBASE_CONFIG?.apiKey;

let fbP;
export function fb() {
  fbP ||= (async () => {
    if (!hasConfig()) throw new Error('no-config');
    const [app, auth, fs] = await Promise.all([lib('app'), lib('auth'), lib('firestore')]);
    const main = app.initializeApp(FIREBASE_CONFIG);
    return { app, auth, fs, main, A: auth.getAuth(main), db: fs.getFirestore(main) };
  })();
  fbP.catch(() => { fbP = null; });
  return fbP;
}

// ---------- Codes ----------
export const EMOJIS = ['🐢', '🌺', '⭐', '🥭', '🐒', '🌴', '🍉', '🦋', '🐟', '🌙', '🚲', '🎈'];
export const AVATARS = ['🐢', '🐒', '🦋', '🐬', '🦜', '🐠', '🦎', '🐱', '🐰', '🦊', '🐼', '🦄', '🐨', '🐸', '🐙', '🦉'];
const ALNUM = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const rand = (n, chars = ALNUM) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => chars[b % chars.length]).join('');
export const randomPin = () => Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => b % EMOJIS.length);
export const pinText = (pin) => pin.map((i) => EMOJIS[i]).join('');
const email = (code, rid) => `${rid}.${code}@students.language-quest.app`.toLowerCase();
const password = (code, pin) => `lq#${pin.map((i) => 'abcdefghijkl'[i]).join('')}#${code}`;
export const weekKey = (d = new Date()) => {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  return `${y}-W${Math.ceil(((t - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7)}`;
};
export const TEAMS = [
  { name: 'Turtles', icon: '🐢', color: '#14b8a6' },
  { name: 'Mangoes', icon: '🥭', color: '#f59e0b' },
  { name: 'Frangipanis', icon: '🌺', color: '#ef6c4d' },
  { name: 'Dolphins', icon: '🐬', color: '#6366f1' },
];
// Autocollants débloqués avec les étoiles (un tous les 15).
export const STICKERS = ['🐢', '🌺', '🥭', '🌴', '🐒', '🦋', '🐬', '🌋', '🏝️', '🛶', '🐠', '🦜', '🍍', '🥥', '🌅', '🐚', '🦀', '🌈', '👑', '🏆'];
export const STICKER_STEP = 15;

// ---------- Session ----------
export function useAuth() {
  const [st, setSt] = useState({ loading: hasConfig(), user: null, error: null });
  useEffect(() => {
    if (!hasConfig()) return;
    let off = () => {};
    fb().then((f) => { off = f.auth.onAuthStateChanged(f.A, (user) => setSt({ loading: false, user, error: null })); })
      .catch((e) => setSt({ loading: false, user: null, error: e.message }));
    return () => off();
  }, []);
  return st;
}

export async function teacherSignIn() {
  const f = await fb();
  const p = new f.auth.GoogleAuthProvider();
  try { await f.auth.signInWithPopup(f.A, p); }
  catch (e) { if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-environment') await f.auth.signInWithRedirect(f.A, p); else throw e; }
}

export async function signOut() {
  const f = await fb();
  await f.auth.signOut(f.A);
  try { localStorage.removeItem('lq-student'); } catch { /* rien */ }
}

// ---------- Prof : classe et élèves ----------
const ref = (f, ...path) => f.fs.doc(f.db, ...path);

export async function myClasses() {
  const f = await fb();
  const q = f.fs.query(f.fs.collection(f.db, 'classes'), f.fs.where('ownerUid', '==', f.A.currentUser.uid));
  return (await f.fs.getDocs(q)).docs.map((d) => ({ code: d.id, ...d.data() }));
}

export async function createClass(name, nTeams) {
  const f = await fb();
  let code;
  do { code = rand(6); } while ((await f.fs.getDoc(ref(f, 'classes', code))).exists());
  await f.fs.setDoc(ref(f, 'classes', code), {
    name, ownerUid: f.A.currentUser.uid, createdAt: f.fs.serverTimestamp(),
    teams: TEAMS.slice(0, nTeams), roster: [], memberUids: [],
    jar: 0, jarGoal: 150, reward: 'Sore bermain (Game afternoon) 🎉', t0: 0, t1: 0, t2: 0, t3: 0,
  });
  return code;
}

export async function addStudent(code, name, team) {
  const f = await fb();
  const rid = rand(8, 'abcdefghijkmnpqrstuvwxyz23456789');
  const pin = randomPin();
  // Une seconde instance crée le compte sans déconnecter la prof.
  const tmp = f.app.initializeApp(FIREBASE_CONFIG, 'creator-' + rid);
  try {
    const a2 = f.auth.initializeAuth(tmp, { persistence: f.auth.inMemoryPersistence });
    const { user } = await f.auth.createUserWithEmailAndPassword(a2, email(code, rid), password(code, pin));
    await f.auth.signOut(a2);
    const avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    await f.fs.setDoc(ref(f, 'classes', code, 'players', user.uid), { name, team, rid, avatar, stars: 0, lastSeen: null, mission: null, wins: 0, races: 0 });
    await f.fs.updateDoc(ref(f, 'classes', code), {
      roster: f.fs.arrayUnion({ uid: user.uid, rid, name, avatar, team }),
      memberUids: f.fs.arrayUnion(user.uid),
    });
    await f.fs.setDoc(ref(f, 'classes', code, 'private', 'pins'), { [user.uid]: pinText(pin) }, { merge: true });
    return { uid: user.uid, pin };
  } finally {
    f.app.deleteApp(tmp).catch(() => {});
  }
}

export async function removeStudent(code, uid) {
  const f = await fb();
  const c = (await f.fs.getDoc(ref(f, 'classes', code))).data();
  await f.fs.updateDoc(ref(f, 'classes', code), {
    roster: c.roster.filter((r) => r.uid !== uid),
    memberUids: c.memberUids.filter((u) => u !== uid),
  });
  await f.fs.deleteDoc(ref(f, 'classes', code, 'players', uid));
}

export async function getPins(code) {
  const f = await fb();
  return (await f.fs.getDoc(ref(f, 'classes', code, 'private', 'pins'))).data() || {};
}

export async function updateClass(code, data) {
  const f = await fb();
  await f.fs.updateDoc(ref(f, 'classes', code), data);
}

// ---------- Élève : connexion ----------
export async function getClass(code) {
  const f = await fb();
  const d = await f.fs.getDoc(ref(f, 'classes', code.toUpperCase().trim()));
  return d.exists() ? { code: d.id, ...d.data() } : null;
}

export async function studentSignIn(code, rid, pin) {
  const f = await fb();
  // Le code de classe est posé avant la connexion : la sauvegarde en ligne le trouve tout de suite.
  try { localStorage.setItem('lq-student', code); } catch { /* rien */ }
  try { await f.auth.signInWithEmailAndPassword(f.A, email(code, rid), password(code, pin)); }
  catch (e) { try { localStorage.removeItem('lq-student'); } catch { /* rien */ } throw e; }
}

// ---------- Abonnements temps réel ----------
export function useDoc(path) {
  const [v, setV] = useState(undefined);
  const key = path && path.join('/');
  useEffect(() => {
    if (!path) return;
    let off = () => {};
    fb().then((f) => { off = f.fs.onSnapshot(ref(f, ...path), (d) => setV(d.exists() ? { id: d.id, ...d.data() } : null), () => setV(null)); });
    return () => off();
  }, [key]);
  return v;
}

export function usePlayers(code) {
  const [v, setV] = useState([]);
  useEffect(() => {
    if (!code) return;
    let off = () => {};
    fb().then((f) => { off = f.fs.onSnapshot(f.fs.collection(f.db, 'classes', code, 'players'), (s) => setV(s.docs.map((d) => ({ uid: d.id, ...d.data() }))), () => setV([])); });
    return () => off();
  }, [code]);
  return v;
}

export function useMyMatches(code, uid) {
  const [v, setV] = useState([]);
  useEffect(() => {
    if (!code || !uid) return;
    let off = () => {};
    fb().then((f) => {
      const q = f.fs.query(f.fs.collection(f.db, 'classes', code, 'matches'),
        f.fs.where('uids', 'array-contains', uid), f.fs.where('week', '==', weekKey()), f.fs.limit(60));
      off = f.fs.onSnapshot(q, (s) => setV(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.id > a.id ? 1 : -1))), () => setV([]));
    });
    return () => off();
  }, [code, uid]);
  return v;
}

// Session élève : classe + profil, en temps réel.
export function useStudent() {
  const auth = useAuth();
  let code = null;
  try { code = localStorage.getItem('lq-student'); } catch { /* rien */ }
  const uid = auth.user?.uid;
  const cls = useDoc(code && uid ? ['classes', code] : null);
  const me = useDoc(code && uid ? ['classes', code, 'players', uid] : null);
  return { auth, code, uid, cls, me: me && { ...me, uid } };
}

// Présence : « en ligne » si vue il y a moins de 90 s.
export const isOnline = (p) => p.lastSeen?.toMillis && Date.now() - p.lastSeen.toMillis() < 90000;
export function usePresence(code, uid) {
  useEffect(() => {
    if (!code || !uid) return;
    const beat = () => { if (document.visibilityState === 'visible') fb().then((f) => f.fs.updateDoc(ref(f, 'classes', code, 'players', uid), { lastSeen: f.fs.serverTimestamp() })).catch(() => {}); };
    beat();
    const t = setInterval(beat, 45000);
    document.addEventListener('visibilitychange', beat);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', beat); };
  }, [code, uid]);
}

// ---------- Étoiles, équipes, missions ----------
export async function awardStars(code, uid, team, n) {
  if (!n) return;
  const f = await fb();
  const inc = f.fs.increment(Math.min(n, 30));
  await f.fs.updateDoc(ref(f, 'classes', code, 'players', uid), { stars: inc });
  await f.fs.updateDoc(ref(f, 'classes', code), { jar: inc, ['t' + team]: inc });
}

export async function bump(code, uid, fields) {
  const f = await fb();
  const upd = {};
  Object.entries(fields).forEach(([k, v]) => { upd[k] = f.fs.increment(v); });
  await f.fs.updateDoc(ref(f, 'classes', code, 'players', uid), upd);
}

export async function updateMe(code, uid, data) {
  const f = await fb();
  await f.fs.updateDoc(ref(f, 'classes', code, 'players', uid), data);
}

export const MISSION = [
  { k: 'race', n: 1, icon: '⚔️', id: 'Tantang 1 teman (Challenge 1 friend)', fr: 'Défier 1 copine' },
  { k: 'lesson', n: 1, icon: '🏝️', id: 'Selesaikan 1 pelajaran (Finish 1 lesson)', fr: 'Finir 1 leçon' },
  { k: 'photo', n: 3, icon: '📸', id: 'Foto 3 kata baru (Photo 3 new words)', fr: 'Photographier 3 mots' },
];
export const missionOf = (p) => (p?.mission?.day === today() ? p.mission : { day: today(), race: 0, touch: 0, photo: 0, bonus: false });

// ---------- Défis (courses) ----------
export async function createMatch(code, me, friend, game) {
  const f = await fb();
  const id = `${Date.now()}-${rand(4)}`;
  const blank = { i: 0, score: 0, done: false, ms: 0, claimed: false };
  await f.fs.setDoc(ref(f, 'classes', code, 'matches', id), {
    uids: [me.uid, friend.uid], week: weekKey(), createdAt: f.fs.serverTimestamp(),
    names: { [me.uid]: me.name, [friend.uid]: friend.name }, avatars: { [me.uid]: me.avatar, [friend.uid]: friend.avatar },
    kind: game.kind, src: game.src, title: game.title, qs: JSON.parse(JSON.stringify(game.qs)), scene: game.scene || null,
    p: { [me.uid]: blank, [friend.uid]: blank },
  });
  return id;
}

export async function matchStep(code, id, uid, data) {
  const f = await fb();
  const upd = {};
  Object.entries(data).forEach(([k, v]) => { upd[`p.${uid}.${k}`] = v; });
  await f.fs.updateDoc(ref(f, 'classes', code, 'matches', id), upd);
}

// Résultat d'une course du point de vue de « uid ».
export function matchResult(m, uid) {
  const other = m.uids.find((u) => u !== uid);
  const a = m.p[uid], b = m.p[other];
  if (!a.done || !b.done) return null;
  if (a.score !== b.score) return a.score > b.score ? 'win' : 'lose';
  return a.ms === b.ms ? 'tie' : a.ms < b.ms ? 'win' : 'lose';
}
