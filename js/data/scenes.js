// Schémas interactifs « Touch it! » : un dessin SVG + des zones à toucher.
// Chaque zone renvoie à un mot du vocabulaire d'une leçon d'anglais (par son mot anglais).
import { EN_BY_ID } from './english.js';

const SKIN = '#e0a878', HAIR = '#3b2a20', SHIRT = '#14b8a6', WOOD = '#8a5a3b';

// Formes de zones (la classe « hit » sert au toucher et à la surbrillance).
const ci = (cx, cy, r) => `<circle class="hit" cx="${cx}" cy="${cy}" r="${r}"/>`;
const el = (cx, cy, rx, ry, rot = 0) => `<ellipse class="hit" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"${rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : ''}/>`;
const re = (x, y, w, h) => `<rect class="hit" x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/>`;
const pa = (d) => `<path class="hit" d="${d}"/>`;
const Z = (w, hit, lx, ly) => ({ w, hit, lx, ly });
const E = (w, emoji, x, y, s = 44, ring = false) => ({ w, emoji, x, y, s, ring, lx: x, ly: y + s * 0.62 + 6 });

function star(cx, cy, R, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, d = i % 2 ? r : R;
    pts.push(`${(cx + d * Math.cos(a)).toFixed(1)},${(cy + d * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

const LEG_L = 'M108,250 L148,250 L146,402 L114,402 Z', LEG_R = 'M152,250 L192,250 L186,402 L154,402 Z';
const HAIR_TOP = 'M107,72 C104,26 196,26 193,72 C186,52 168,44 150,50 C132,44 114,52 107,72 Z';
const hand = (sx) => {
  const x = (v) => (sx < 0 ? 300 - v : v);
  return `<circle cx="${x(56)}" cy="256" r="15" fill="${SKIN}"/>
    ${[[48, 262, 46, 276], [54, 266, 54, 281], [61, 266, 62, 281], [67, 261, 70, 274], [44, 250, 37, 257]]
      .map(([a, b, c, d]) => `<line x1="${x(a)}" y1="${b}" x2="${x(c)}" y2="${d}" stroke="${SKIN}" stroke-width="6" stroke-linecap="round"/>`).join('')}`;
};

const BODY_BG = `
  <rect width="300" height="460" rx="24" fill="#e6f7f2"/>
  <ellipse cx="150" cy="432" rx="84" ry="10" fill="#cde9de"/>
  <path d="M104,70 C100,130 112,150 120,150 L180,150 C188,150 200,130 196,70 Z" fill="${HAIR}"/>
  <line x1="104" y1="140" x2="60" y2="245" stroke="${SKIN}" stroke-width="22" stroke-linecap="round"/>
  <line x1="196" y1="140" x2="240" y2="245" stroke="${SKIN}" stroke-width="22" stroke-linecap="round"/>
  <line x1="104" y1="140" x2="92" y2="170" stroke="${SHIRT}" stroke-width="30" stroke-linecap="round"/>
  <line x1="196" y1="140" x2="208" y2="170" stroke="${SHIRT}" stroke-width="30" stroke-linecap="round"/>
  ${hand(1)}${hand(-1)}
  <path d="${LEG_L}" fill="#334155"/><path d="${LEG_R}" fill="#334155"/>
  <ellipse cx="129" cy="330" rx="14" ry="10" fill="#475569"/><ellipse cx="171" cy="330" rx="14" ry="10" fill="#475569"/>
  <ellipse cx="124" cy="414" rx="22" ry="11" fill="${SKIN}"/><ellipse cx="176" cy="414" rx="22" ry="11" fill="${SKIN}"/>
  <path d="M108,411 Q124,400 140,411" stroke="#ef6c4d" stroke-width="5" fill="none"/><path d="M160,411 Q176,400 192,411" stroke="#ef6c4d" stroke-width="5" fill="none"/>
  <rect x="140" y="100" width="20" height="32" fill="#c98b5e"/>
  <path d="M104,128 Q150,118 196,128 L200,258 Q150,266 100,258 Z" fill="${SHIRT}"/>
  <path d="M136,126 Q150,140 164,126" stroke="#0f8f82" stroke-width="4" fill="none"/>
  <circle cx="107" cy="76" r="9" fill="${SKIN}"/><circle cx="193" cy="76" r="9" fill="${SKIN}"/>
  <circle cx="150" cy="72" r="42" fill="${SKIN}"/>
  <circle cx="135" cy="74" r="5" fill="#2a1d15"/><circle cx="165" cy="74" r="5" fill="#2a1d15"/>
  <path d="M150,78 Q146,86 151,87" stroke="#b97f55" stroke-width="2" fill="none"/>
  <path d="M138,93 Q150,103 162,93" stroke="#9b3d2e" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="126" cy="88" r="6" fill="#f08a7a" opacity=".45"/><circle cx="174" cy="88" r="6" fill="#f08a7a" opacity=".45"/>
  <path d="${HAIR_TOP}" fill="${HAIR}"/><circle cx="178" cy="44" r="6" fill="#ffd166"/>`;

const FACE_HAIR = 'M50,178 C40,40 260,40 250,178 C238,118 200,96 150,100 C100,96 62,118 50,178 Z';
const FACE_BG = `
  <rect width="300" height="340" rx="24" fill="#fdf0e1"/>
  <path d="M48,180 C40,262 70,300 90,300 L210,300 C230,300 260,262 252,180 Z" fill="${HAIR}"/>
  <rect x="122" y="270" width="56" height="50" fill="#c98b5e"/>
  <path d="M50,340 Q56,306 120,302 L180,302 Q244,306 250,340 Z" fill="${SHIRT}"/>
  <ellipse cx="50" cy="192" rx="16" ry="26" fill="${SKIN}"/><ellipse cx="250" cy="192" rx="16" ry="26" fill="${SKIN}"/>
  <ellipse cx="150" cy="182" rx="100" ry="110" fill="${SKIN}"/>
  <path d="${FACE_HAIR}" fill="${HAIR}"/>
  <path d="M88,138 Q108,126 128,136" stroke="${HAIR}" stroke-width="7" fill="none" stroke-linecap="round"/>
  <path d="M172,136 Q192,126 212,138" stroke="${HAIR}" stroke-width="7" fill="none" stroke-linecap="round"/>
  <ellipse cx="108" cy="162" rx="20" ry="13" fill="#fff"/><circle cx="110" cy="163" r="9" fill="#2a1d15"/><circle cx="113" cy="160" r="3" fill="#fff"/>
  <ellipse cx="192" cy="162" rx="20" ry="13" fill="#fff"/><circle cx="190" cy="163" r="9" fill="#2a1d15"/><circle cx="193" cy="160" r="3" fill="#fff"/>
  <path d="M150,172 Q140,200 146,206 Q150,210 156,206" stroke="#b97f55" stroke-width="4" fill="none" stroke-linecap="round"/>
  <circle cx="86" cy="214" r="17" fill="#f08a7a" opacity=".5"/><circle cx="214" cy="214" r="17" fill="#f08a7a" opacity=".5"/>
  <path d="M110,236 Q150,240 190,236 Q182,282 150,284 Q118,282 110,236 Z" fill="#7f1d1d" stroke="#d9534f" stroke-width="5" stroke-linejoin="round"/>
  <path d="M117,239 L183,239 Q181,252 177,254 L123,254 Q119,252 117,239 Z" fill="#fff"/>
  <ellipse cx="150" cy="272" rx="18" ry="7" fill="#f08a7a"/>`;

const CLASS_BG = `
  <rect width="400" height="300" rx="22" fill="#fdf3dc"/>
  <rect y="230" width="400" height="70" fill="#e8c99b"/><rect y="228" width="400" height="5" fill="#d4b07f"/>
  <rect x="18" y="36" width="74" height="84" fill="#9fd8f0" stroke="${WOOD}" stroke-width="6"/>
  <circle cx="40" cy="58" r="9" fill="#ffd166"/>
  <line x1="55" y1="36" x2="55" y2="120" stroke="${WOOD}" stroke-width="4"/><line x1="18" y1="78" x2="92" y2="78" stroke="${WOOD}" stroke-width="4"/>
  <rect x="110" y="26" width="170" height="96" fill="#2f6b4f" stroke="${WOOD}" stroke-width="6"/>
  <text x="195" y="68" fill="#fff" font-size="24" text-anchor="middle" font-family="Comic Sans MS, Chalkboard, cursive">Hello!</text>
  <text x="195" y="100" fill="#e2f3ea" font-size="15" text-anchor="middle" font-family="Comic Sans MS, Chalkboard, cursive">2 + 3 = 5</text>
  <circle cx="349" cy="48" r="22" fill="#fff" stroke="#334155" stroke-width="4"/>
  <line x1="349" y1="48" x2="349" y2="34" stroke="#334155" stroke-width="3" stroke-linecap="round"/><line x1="349" y1="48" x2="359" y2="52" stroke="#334155" stroke-width="3" stroke-linecap="round"/>
  <rect x="318" y="92" width="62" height="138" fill="#b07a4f" stroke="${WOOD}" stroke-width="4"/><circle cx="330" cy="165" r="4" fill="#ffd166"/>
  <rect x="24" y="140" width="52" height="50" rx="6" fill="#ef6c4d"/><rect x="20" y="190" width="60" height="10" rx="3" fill="#d4583b"/>
  <line x1="26" y1="200" x2="26" y2="262" stroke="${WOOD}" stroke-width="5"/><line x1="74" y1="200" x2="74" y2="262" stroke="${WOOD}" stroke-width="5"/>
  <rect x="180" y="222" width="56" height="48" rx="12" fill="#8b5cf6"/><rect x="190" y="244" width="36" height="18" rx="6" fill="#7c4ddb"/>
  <path d="M192,224 Q208,204 224,224" stroke="#6d3fd0" stroke-width="5" fill="none"/>
  <rect x="100" y="196" width="200" height="12" rx="3" fill="#b07a4f"/><rect x="108" y="208" width="184" height="10" fill="#9a6a43"/>
  <rect x="110" y="208" width="10" height="60" fill="#9a6a43"/><rect x="280" y="208" width="10" height="60" fill="#9a6a43"/>
  <rect x="112" y="172" width="54" height="24" rx="3" fill="#e63946"/><rect x="156" y="174" width="6" height="20" fill="#fff"/>
  <rect x="178" y="183" width="48" height="8" rx="4" fill="#2563eb" transform="rotate(-8 202 187)"/>
  <rect x="236" y="182" width="46" height="9" fill="#ffd166"/><polygon points="282,182 296,186.5 282,191" fill="#f4c99b"/><polygon points="292,185 296,186.5 292,188" fill="#334155"/>`;

const FAMILY_LINES = `
  <rect width="360" height="330" rx="22" fill="#fff4e6"/>
  <g stroke="#d6b88c" stroke-width="4" fill="none" stroke-linecap="round">
    <line x1="120" y1="55" x2="240" y2="55"/><line x1="180" y1="55" x2="180" y2="110"/><line x1="110" y1="110" x2="210" y2="110"/>
    <line x1="110" y1="110" x2="110" y2="132"/><line x1="210" y1="110" x2="210" y2="132"/>
    <line x1="40" y1="160" x2="110" y2="160"/><line x1="210" y1="160" x2="290" y2="160"/>
    <line x1="250" y1="160" x2="250" y2="222"/><line x1="120" y1="222" x2="330" y2="222"/>
    ${[120, 190, 260, 330].map((x) => `<line x1="${x}" y1="222" x2="${x}" y2="242"/>`).join('')}
  </g>
  <circle cx="190" cy="270" r="28" fill="#ffd166"/><text x="190" y="266" font-size="26" text-anchor="middle" dominant-baseline="central">⭐</text>
  <text x="190" y="314" font-size="15" font-weight="800" text-anchor="middle" fill="#1f2a37">me</text>`;

const ANIMALS_BG = `
  <rect width="400" height="300" rx="22" fill="#bfe8f5"/>
  <circle cx="362" cy="36" r="20" fill="#ffd166"/>
  <path d="M0,170 Q100,130 200,165 Q300,140 400,168 L400,300 L0,300 Z" fill="#9bd77a"/>
  <rect x="50" y="96" width="22" height="90" fill="${WOOD}"/>
  <circle cx="60" cy="80" r="46" fill="#3fa34d"/><circle cx="28" cy="104" r="28" fill="#3fa34d"/><circle cx="96" cy="102" r="30" fill="#3fa34d"/>
  <ellipse cx="322" cy="266" rx="64" ry="26" fill="#5bc0eb"/>`;

const FOOD_BG = `
  <rect width="400" height="300" rx="22" fill="#fff1d6"/>
  ${Array.from({ length: 10 }, (_, i) => `<rect x="${i * 40}" y="0" width="40" height="30" fill="${i % 2 ? '#fff' : '#ef6c4d'}"/><circle cx="${i * 40 + 20}" cy="30" r="20" fill="${i % 2 ? '#fff' : '#ef6c4d'}"/>`).join('')}
  <text x="200" y="22" font-size="16" font-weight="900" text-anchor="middle" fill="#1f2a37" letter-spacing="3">WARUNG</text>
  <rect x="16" y="120" width="368" height="10" rx="4" fill="#b07a4f"/><rect x="16" y="208" width="368" height="10" rx="4" fill="#b07a4f"/>
  <rect x="8" y="284" width="384" height="16" rx="4" fill="#9a6a43"/>`;

const COLORS_BG = `
  <rect width="400" height="300" rx="22" fill="#fff8ec"/>
  <path d="M40,150 C30,60 140,30 220,52 C290,72 290,140 250,170 C222,192 252,222 220,250 C170,290 50,260 40,150 Z" fill="#e9c99a" stroke="#c9a46e" stroke-width="3"/>
  <circle cx="200" cy="215" r="15" fill="#fff8ec" stroke="#c9a46e" stroke-width="3"/>
  ${[['#e63946', 80, 110], ['#f97316', 128, 72], ['#facc15', 182, 74], ['#22c55e', 232, 112], ['#2563eb', 90, 168], ['#8b5cf6', 140, 205], ['#111827', 146, 140], ['#ffffff', 200, 150]]
    .map(([c, x, y]) => `<circle cx="${x}" cy="${y}" r="22" fill="${c}" stroke="rgba(0,0,0,.18)" stroke-width="2"/>`).join('')}
  <g fill="#cbd5e1" stroke="#475569" stroke-width="4" stroke-linejoin="round">
    <circle cx="335" cy="48" r="24"/>
    <polygon points="${star(335, 122, 28, 12)}"/>
    <path d="M335,214 C305,192 317,170 335,186 C353,170 365,192 335,214 Z"/>
    <polygon points="335,240 361,282 309,282"/>
  </g>`;

export const SCENES = [
  {
    id: 'body', title: 'My Body', fr: 'Le corps', icon: '🧍‍♀️', lesson: 'en-body', vb: '0 0 300 460', bg: BODY_BG,
    zones: [
      Z('leg', pa(LEG_L) + pa(LEG_R), 128, 372),
      Z('knee', el(129, 330, 18, 15) + el(171, 330, 18, 15), 150, 318),
      Z('foot', el(124, 414, 28, 16) + el(176, 414, 28, 16), 150, 444),
      Z('stomach', el(150, 222, 40, 26), 150, 222),
      Z('arm', el(82, 192, 16, 58, 23) + el(218, 192, 16, 58, -23), 70, 196),
      Z('shoulder', ci(106, 136, 16) + ci(194, 136, 16), 240, 130),
      Z('hand', ci(55, 262, 22) + ci(245, 262, 22), 55, 298),
      Z('head', ci(150, 74, 44), 150, 82),
      Z('neck', re(136, 112, 28, 16), 214, 112),
      Z('hair', pa(HAIR_TOP), 150, 30),
    ],
  },
  {
    id: 'face', title: 'My Face', fr: 'Le visage', icon: '🙂', lesson: 'en-body', vb: '0 0 300 340', bg: FACE_BG,
    zones: [
      Z('hair', pa(FACE_HAIR), 150, 74),
      Z('ears', el(50, 192, 20, 30) + el(250, 192, 20, 30), 44, 238),
      Z('eyebrows', re(84, 122, 48, 22) + re(168, 122, 48, 22), 196, 114),
      Z('eyes', el(108, 162, 24, 17) + el(192, 162, 24, 17), 108, 188),
      Z('nose', el(150, 190, 16, 24), 150, 190),
      Z('cheeks', ci(84, 216, 22) + ci(216, 216, 22), 222, 244),
      Z('mouth', el(150, 262, 44, 26), 150, 304),
      Z('teeth', re(114, 236, 72, 20), 150, 246),
    ],
  },
  {
    id: 'classroom', title: 'My Classroom', fr: 'La classe', icon: '🏫', lesson: 'en-school', vb: '0 0 400 300', bg: CLASS_BG,
    zones: [
      Z('window', re(14, 32, 82, 92), 55, 134),
      Z('board', re(106, 22, 178, 104), 195, 40),
      Z('clock', ci(349, 48, 26), 349, 84),
      Z('door', re(314, 92, 70, 140), 349, 130),
      Z('chair', re(16, 136, 68, 130), 50, 228),
      Z('desk', re(100, 196, 200, 24) + re(106, 208, 18, 62) + re(276, 208, 18, 62), 150, 252),
      Z('bag', re(176, 218, 64, 56), 208, 286),
      Z('book', re(108, 166, 62, 32), 139, 158),
      Z('pen', re(174, 174, 56, 22), 202, 160),
      Z('pencil', re(234, 172, 66, 26), 268, 160),
    ],
  },
  {
    id: 'family', title: 'My Family', fr: 'La famille', icon: '👨‍👩‍👧', lesson: 'en-family', vb: '0 0 360 330', bg: FAMILY_LINES,
    zones: [
      E('grandfather', '👴', 120, 55, 36, true), E('grandmother', '👵', 240, 55, 36, true),
      E('aunt', '👩‍🦱', 40, 160, 36, true), E('uncle', '👨‍🦱', 110, 160, 36, true),
      E('father', '👨', 210, 160, 36, true), E('mother', '👩', 290, 160, 36, true),
      E('brother', '👦', 120, 270, 36, true), E('sister', '👧', 260, 270, 36, true), E('baby', '👶', 330, 270, 36, true),
    ],
  },
  {
    id: 'animals', title: 'Animals', fr: 'Les animaux', icon: '🐒', lesson: 'en-animals', vb: '0 0 400 300', bg: ANIMALS_BG,
    zones: [
      E('monkey', '🐒', 62, 72, 40), E('bird', '🐦', 190, 44, 38), E('butterfly', '🦋', 280, 76, 36),
      E('elephant', '🐘', 335, 160, 54), E('cow', '🐄', 222, 170, 48), E('horse', '🐴', 120, 200, 46),
      E('chicken', '🐔', 262, 228, 40), E('cat', '🐱', 40, 250, 40), E('dog', '🐶', 108, 262, 42),
      E('snake', '🐍', 186, 262, 40), E('fish', '🐟', 330, 264, 34), E('turtle', '🐢', 372, 232, 34),
    ],
  },
  {
    id: 'food', title: 'At the Warung', fr: 'Au warung', icon: '🍚', lesson: 'en-food', vb: '0 0 400 300', bg: FOOD_BG,
    zones: [
      ['rice', '🍚'], ['noodles', '🍜'], ['bread', '🍞'], ['cake', '🍰'],
      ['banana', '🍌'], ['mango', '🥭'], ['apple', '🍎'], ['coconut', '🥥'],
      ['egg', '🥚'], ['milk', '🥛'], ['tea', '🍵'], ['water', '💧'],
    ].map(([w, e], i) => {
      const z = E(w, e, 60 + (i % 4) * 93, 88 + Math.floor(i / 4) * 88, 46);
      return { ...z, ly: z.y - 40 };
    }),
  },
  {
    id: 'colors', title: 'Colors & Shapes', fr: 'Couleurs et formes', icon: '🎨', lesson: 'en-colors', vb: '0 0 400 300', bg: COLORS_BG,
    say: (w) => w,
    zones: [
      Z('red', ci(80, 110, 26), 80, 80), Z('orange', ci(128, 72, 26), 128, 42), Z('yellow', ci(182, 74, 26), 182, 44),
      Z('green', ci(232, 112, 26), 232, 82), Z('blue', ci(90, 168, 26), 90, 200), Z('purple', ci(140, 205, 26), 140, 240),
      Z('black', ci(146, 140, 26), 146, 110), Z('white', ci(200, 150, 26), 200, 182),
      Z('circle', ci(335, 48, 30), 335, 86), Z('star', ci(335, 122, 32), 335, 160),
      Z('heart', ci(335, 196, 30), 335, 230), Z('triangle', ci(335, 265, 32), 335, 294),
    ],
  },
];

export const SCENE_BY_ID = Object.fromEntries(SCENES.map((s) => [s.id, s]));
export const scenesForLesson = (lessonId) => SCENES.filter((s) => s.lesson === lessonId);

// Mot complet (en, id, fr, emoji…) pour chaque zone.
export function sceneWords(sc) {
  const vocab = EN_BY_ID[sc.lesson]?.vocab || [];
  return Object.fromEntries(sc.zones.map((z) => {
    const v = vocab.find((x) => x.en === z.w);
    return [z.w, v || { en: z.w, id: z.w, fr: z.w }];
  }));
}

// Consigne : « Touch the hand! » / « Sentuh tangan! »
export function sayTouch(sc, w, lang) {
  const word = sceneWords(sc)[w];
  if (lang === 'id') return `Sentuh ${word.id}!`;
  return `Touch ${sc.say ? sc.say(w) : 'the ' + w}!`;
}

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// SVG complet. marks : { mot: 'ok' | 'ko' | 'hint' | 'seen' } ; labels : mots dont on affiche l'étiquette.
export function sceneSVG(sc, { marks = {}, labels = [], labelOf = (w) => w } = {}) {
  const [, , W, H] = sc.vb.split(' ').map(Number);
  const zones = sc.zones.map((z) => {
    const inner = z.emoji
      ? `${z.ring ? `<circle cx="${z.x}" cy="${z.y}" r="${z.s * 0.78}" fill="#fff" stroke="#f0d9b5" stroke-width="3"/>` : ''}<text class="em" x="${z.x}" y="${z.y}" font-size="${z.s}" text-anchor="middle" dominant-baseline="central">${z.emoji}</text>${ci(z.x, z.y, z.s * 0.72)}`
      : z.hit;
    return `<g class="zone ${marks[z.w] || ''}" data-w="${esc(z.w)}">${inner}</g>`;
  }).join('');
  const lbls = labels.map((w) => {
    const z = sc.zones.find((x) => x.w === w);
    if (!z) return '';
    const t = labelOf(w);
    const wpx = t.length * 8.6 + 20;
    const x = Math.max(4, Math.min(W - wpx - 4, z.lx - wpx / 2));
    const y = Math.max(4, Math.min(H - 30, z.ly - 13));
    return `<g class="lbl ${marks[w] || ''}"><rect x="${x}" y="${y}" width="${wpx}" height="26" rx="13"/><text x="${x + wpx / 2}" y="${y + 13}" text-anchor="middle" dominant-baseline="central">${esc(t)}</text></g>`;
  }).join('');
  return `<svg viewBox="${sc.vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(sc.title)}">${sc.bg}${zones}${lbls}</svg>`;
}
