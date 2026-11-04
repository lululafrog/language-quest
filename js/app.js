import { html, render, useState, useEffect } from './vendor/preact-htm.js';
import { Home, Progress, Settings } from './screens/home.js';
import { LearnHome, LessonView, Lexicon } from './screens/learn.js';
import { FlashcardsHome, DeckView, Review } from './screens/flashcards.js';
import { GamesHome, GAME_SCREENS } from './screens/games.js';
import { ClassroomHome, ClassLesson, Present, TeacherPhrases, VerbsPage } from './screens/classroom.js';
import { MULTI_SCREENS } from './screens/multiplayer.js';
import { TouchGame } from './screens/touch.js';
import { PhotoHome, PhotoCards, PhotoFind } from './screens/photo.js';
import { ClassOnline } from './screens/classonline.js';
import { StudentLogin, StudentHome, StudentPlay, StudentTeam, StudentNew, StudentRace, StudentBridge } from './screens/student.js';
import { KIDS } from './i18n.js';
import { IslandMap, LevelPlay } from './screens/island.js';
import { Library, Reader, MyWords, WordReview } from './screens/read.js';
import { useStore } from './store.js';
import { deckStats } from './cards.js';
import { go } from './ui.js';
import { Dialogs } from './dialog.js';

const NAV = [
  { path: '/', icon: '🏠', label: 'Dashboard', short: 'Accueil' },
  { path: '/learn', icon: '🇮🇩', label: 'Learn', short: 'Apprendre' },
  { path: '/flashcards', icon: '🃏', label: 'Flashcards', short: 'Cartes' },
  { path: '/games', icon: '🎲', label: 'Games', short: 'Jeux' },
  { path: '/classroom', icon: '🇬🇧', label: 'Classroom', short: 'Classe' },
  { path: '/progress', icon: '📈', label: 'My Progress', short: 'Progrès', side: true },
  { path: '/settings', icon: '⚙️', label: 'Settings', short: 'Réglages', side: true },
];

const STUDENT_NAV = [
  { path: '/s', icon: '🏠', label: 'Beranda', short: 'Beranda' },
  { path: '/s/island', icon: '🏝️', label: 'Pulau', short: 'Pulau' },
  { path: '/s/read', icon: '📚', label: 'Baca', short: 'Baca' },
  { path: '/s/play', icon: '🎮', label: 'Main', short: 'Main' },
  { path: '/s/team', icon: '🌟', label: 'Stiker & tim', short: 'Tim' },
];
// Édition enfants : seules ces pages existent (le reste est la version française de la prof).
const KIDS_GAMES = ['touch', 'quiz', 'match', 'memory', 'fill', 'build', 'duel', 'hangman'];
const STUDENT_OK = ['/s', '/photo', '/guru', ...KIDS_GAMES.map((g) => '/games/' + g)];

function useRoute() {
  const get = () => location.hash.replace(/^#/, '') || '/';
  const [r, set] = useState(get());
  useEffect(() => {
    const f = () => { set(get()); window.scrollTo(0, 0); };
    addEventListener('hashchange', f);
    return () => removeEventListener('hashchange', f);
  }, []);
  return r;
}

function route(path) {
  const p = path.split('/').filter(Boolean);
  if (!p.length) return KIDS ? { el: html`<${StudentHome} />` } : { el: html`<${Home} />` };
  switch (p[0]) {
    case 'learn': return p[1] ? { el: html`<${LessonView} key=${p[1]} id=${p[1]} />`, u: 'id' } : { el: html`<${LearnHome} />`, u: 'id' };
    case 'lexicon': return { el: html`<${Lexicon} />`, u: 'id' };
    case 'flashcards':
      if (p[1] === 'review') return { el: html`<${Review} key=${p[2]} deck=${p[2] || 'all'} />`, bare: true };
      if (p[1] === 'deck') return { el: html`<${DeckView} id=${p[2]} />` };
      return { el: html`<${FlashcardsHome} />` };
    case 'games': {
      const G = GAME_SCREENS[p[1]] || MULTI_SCREENS[p[1]] || (p[1] === 'touch' && TouchGame);
      return G ? { el: html`<${G} key=${p.join('/')} arg=${p[2]} arg2=${p[3]} />`, u: 'en' } : { el: html`<${GamesHome} />` };
    }
    case 'classroom':
      if (p[1] === 'phrases') return { el: html`<${TeacherPhrases} />`, u: 'en' };
      if (p[1] === 'online') return { el: html`<${ClassOnline} />`, u: 'en' };
      if (p[1] === 'verbs') return { el: html`<${VerbsPage} />`, u: 'en' };
      if (p[1] && p[2] === 'present') return { el: html`<${Present} id=${p[1]} />`, bare: true, u: 'en' };
      if (p[1]) return { el: html`<${ClassLesson} id=${p[1]} />`, u: 'en' };
      return { el: html`<${ClassroomHome} />`, u: 'en' };
    case 'photo':
      if (p[1] === 'cards') return { el: html`<${PhotoCards} />` };
      if (p[1] === 'find') return { el: html`<${PhotoFind} />` };
      return { el: html`<${PhotoHome} />` };
    case 's':
      if (p[1] === 'login') return { el: html`<${StudentLogin} />`, bare: true };
      if (p[1] === 'join') return { el: html`<${StudentLogin} key=${p[2]} initial=${p[2]} />`, bare: true };
      if (p[1] === 'play') return { el: html`<${StudentPlay} />` };
      if (p[1] === 'read') return { el: p[2] ? html`<${Reader} key=${p[2]} id=${p[2]} />` : html`<${Library} />` };
      if (p[1] === 'words') return { el: p[2] === 'review' ? html`<${WordReview} />` : html`<${MyWords} />` };
      if (p[1] === 'island') return { el: html`<${IslandMap} />` };
      if (p[1] === 'level') return { el: html`<${LevelPlay} key=${p[2]} n=${p[2]} />`, bare: true };
      if (p[1] === 'team') return { el: html`<${StudentTeam} />` };
      if (p[1] === 'new') return { el: html`<${StudentNew} key=${p[2]} friendUid=${p[2]} />` };
      if (p[1] === 'race') return { el: html`<${StudentRace} key=${p[2]} id=${p[2]} />`, bare: true };
      return { el: html`<${StudentHome} />` };
    case 'guru': return { el: html`<${ClassOnline} />` };
    case 'progress': return { el: html`<${Progress} />` };
    case 'settings': return { el: html`<${Settings} />` };
  }
  return { el: html`<${Home} />` };
}

function App() {
  const path = useRoute();
  const s = useStore();
  const student = KIDS;
  useEffect(() => { if (student && !STUDENT_OK.some((x) => path === x || path.startsWith(x + '/'))) go('/s'); }, [student, path]);
  const { el, bare, u } = route(path);
  const due = deckStats('all', s).due;
  const active = (p) => (p === '/' || p === '/s' ? path === p : path.startsWith(p));
  useEffect(() => { document.body.dataset.universe = student ? 'student' : u || ''; }, [u, student]);
  const nav = student ? STUDENT_NAV : NAV;
  if (bare) return html`<main class="bare">${el}</main>${student && path !== '/s/login' && html`<${StudentBridge} />`}<${Dialogs} />`;
  return html`<div class="shell">
    <aside class="side">
      <div class="logo">🌴 <b>Language Quest</b></div>
      ${nav.map((n) => html`<a href=${'#' + n.path} class=${'side-link' + (active(n.path) ? ' on' : '')}><span>${n.icon}</span>${n.label}
        ${!student && n.path === '/flashcards' && due > 0 && html`<i class="dot">${due}</i>`}</a>`)}
      <div class="side-foot muted small">Terima kasih 🌺<br />${student ? 'Kelas online' : 'Données enregistrées sur cet appareil'}</div>
    </aside>
    <header class="top">
      <a href=${student ? '#/s' : '#/'} class="logo">🌴 <b>Language Quest</b></a>
      ${!student && html`<span class="row"><a href="#/progress" class="icon-btn" aria-label="My Progress">📈</a><a href="#/settings" class="icon-btn" aria-label="Settings">⚙️</a></span>`}
    </header>
    <main>${el}</main>
    <nav class="tabs">${nav.filter((n) => !n.side).map((n) => html`<a href=${'#' + n.path} class=${active(n.path) ? 'on' : ''}>
      <span>${n.icon}${!student && n.path === '/flashcards' && due > 0 ? html`<i class="dot">${due}</i>` : ''}</span><small>${n.short}</small></a>`)}</nav>
    ${student && html`<${StudentBridge} />`}
    <${Dialogs} />
  </div>`;
}

const root = document.getElementById('app');
root.textContent = '';
render(html`<${App} />`, root);

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
