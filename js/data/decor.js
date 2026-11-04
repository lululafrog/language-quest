// Décor « kawaii » de l'île : petits dessins SVG avec visages (yeux, joues roses, sourire).
// Chaque dessin tient dans un viewBox 0 0 100 100.

const INK = '#4a3428', BLUSH = '#ff9eb0';

// Visage : deux yeux brillants, joues roses, petit sourire.
export function face(cx, cy, s = 20, { happy = false } = {}) {
  const ex = s * 0.32, er = s * 0.11;
  const eyes = happy
    ? `<path d="M${cx - ex - er},${cy} q${er},${-er * 1.4} ${er * 2},0 M${cx + ex - er},${cy} q${er},${-er * 1.4} ${er * 2},0" stroke="${INK}" stroke-width="${s * 0.07}" fill="none" stroke-linecap="round"/>`
    : `<circle cx="${cx - ex}" cy="${cy}" r="${er}" fill="${INK}"/><circle cx="${cx + ex}" cy="${cy}" r="${er}" fill="${INK}"/>
       <circle cx="${cx - ex + er * 0.35}" cy="${cy - er * 0.35}" r="${er * 0.35}" fill="#fff"/><circle cx="${cx + ex + er * 0.35}" cy="${cy - er * 0.35}" r="${er * 0.35}" fill="#fff"/>`;
  return `${eyes}
    <ellipse cx="${cx - ex * 1.55}" cy="${cy + s * 0.2}" rx="${s * 0.15}" ry="${s * 0.09}" fill="${BLUSH}" opacity=".75"/>
    <ellipse cx="${cx + ex * 1.55}" cy="${cy + s * 0.2}" rx="${s * 0.15}" ry="${s * 0.09}" fill="${BLUSH}" opacity=".75"/>
    <path d="M${cx - s * 0.12},${cy + s * 0.18} q${s * 0.12},${s * 0.14} ${s * 0.24},0" stroke="${INK}" stroke-width="${s * 0.06}" fill="none" stroke-linecap="round"/>`;
}

const svg = (body, vb = '0 0 100 100') => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

export const ART = {
  cloud: () => svg(`<g fill="#fff" stroke="#dbe7f3" stroke-width="2">
    <circle cx="32" cy="58" r="20"/><circle cx="54" cy="46" r="26"/><circle cx="74" cy="60" r="18"/><rect x="24" y="58" width="60" height="20" rx="10"/></g>
    <rect x="26" y="56" width="56" height="20" fill="#fff"/>${face(54, 58, 26, { happy: true })}`),
  sun: () => svg(`<g stroke="#ffc94a" stroke-width="7" stroke-linecap="round">${Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4; return `<line x1="${50 + Math.cos(a) * 34}" y1="${50 + Math.sin(a) * 34}" x2="${50 + Math.cos(a) * 44}" y2="${50 + Math.sin(a) * 44}"/>`; }).join('')}</g>
    <circle cx="50" cy="50" r="27" fill="#ffd95e"/>${face(50, 50, 30)}`),
  palm: () => svg(`<path d="M52,96 C50,70 54,50 50,30" stroke="#b07a4f" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M50,30 C35,18 18,22 10,34 C26,28 38,30 50,30 Z" fill="#5cc27a"/><path d="M50,30 C64,16 82,20 90,32 C74,27 62,29 50,30 Z" fill="#4fb36d"/>
    <path d="M50,30 C40,12 46,4 58,2 C52,12 52,20 50,30 Z" fill="#6ad08a"/><path d="M50,30 C58,36 70,46 72,58 C62,48 56,40 50,30 Z" fill="#4fb36d"/>
    <path d="M50,30 C40,38 30,48 28,60 C38,50 44,40 50,30 Z" fill="#5cc27a"/>
    <circle cx="46" cy="34" r="5" fill="#8a5a3b"/><circle cx="55" cy="35" r="5" fill="#9a6a43"/>`),
  starfish: () => svg(`<path d="M50,8 L61,38 L94,40 L68,60 L77,92 L50,74 L23,92 L32,60 L6,40 L39,38 Z" fill="#ff9e8a" stroke="#f47c66" stroke-width="3" stroke-linejoin="round"/>${face(50, 52, 24)}`),
  shell: () => svg(`<path d="M50,90 C20,88 8,60 14,40 C30,20 70,20 86,40 C92,60 80,88 50,90 Z" fill="#ffd3de" stroke="#f3a8bb" stroke-width="3"/>
    ${[30, 42, 58, 70].map((x) => `<path d="M50,88 Q${x},55 ${x + (x < 50 ? -6 : 6)},30" stroke="#f3a8bb" stroke-width="3" fill="none"/>`).join('')}`),
  wave: () => svg(`<path d="M0,60 C15,40 30,40 45,60 C60,80 75,80 100,58 L100,100 L0,100 Z" fill="#8fd3ea"/>
    <path d="M0,72 C18,58 32,60 50,74 C68,88 82,84 100,70 L100,100 L0,100 Z" fill="#6cc3e0"/>
    <circle cx="22" cy="52" r="4" fill="#fff"/><circle cx="64" cy="66" r="3" fill="#fff"/>`),
  // Lumbung : le grenier à riz sasak, symbole de Lombok.
  lumbung: () => svg(`<rect x="34" y="70" width="5" height="26" fill="#9a6a43"/><rect x="61" y="70" width="5" height="26" fill="#9a6a43"/>
    <ellipse cx="50" cy="72" rx="22" ry="5" fill="#b07a4f"/>
    <path d="M50,6 C26,12 18,40 22,70 L78,70 C82,40 74,12 50,6 Z" fill="#e7b46a" stroke="#c98d3f" stroke-width="3"/>
    <path d="M30,30 Q50,24 70,30 M26,46 Q50,40 74,46 M24,60 Q50,55 76,60" stroke="#c98d3f" stroke-width="2.5" fill="none"/>
    <rect x="42" y="48" width="16" height="14" rx="3" fill="#8a5a3b"/>${face(50, 36, 20)}`),
  flower: () => svg(`${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="50" cy="28" rx="15" ry="24" fill="#fff" stroke="#f6d6e0" stroke-width="2" transform="rotate(${a} 50 52)"/>`).join('')}
    <circle cx="50" cy="52" r="13" fill="#ffd166"/>${face(50, 52, 14, { happy: true })}`),
  mango: () => svg(`<path d="M50,92 C22,92 14,62 24,42 C34,22 64,14 78,34 C90,52 82,92 50,92 Z" fill="#ffb347"/>
    <path d="M60,22 C66,10 76,8 84,12 C76,16 70,20 64,26 Z" fill="#5cc27a"/>${face(50, 60, 30)}`),
  coconut: () => svg(`<circle cx="50" cy="56" r="34" fill="#9a6a43"/><circle cx="50" cy="56" r="26" fill="#fff6e8"/>
    <path d="M58,20 L70,6 M58,20 L76,18" stroke="#5cc27a" stroke-width="6" stroke-linecap="round"/>${face(50, 58, 26)}`),
  pencil: () => svg(`<g transform="rotate(35 50 50)"><rect x="40" y="10" width="20" height="62" rx="4" fill="#ffd166"/>
    <rect x="40" y="10" width="20" height="10" rx="4" fill="#ff9eb0"/><path d="M40,72 L60,72 L50,92 Z" fill="#f4c99b"/><path d="M46,84 L54,84 L50,92 Z" fill="${INK}"/>
    ${face(50, 46, 18)}</g>`),
  book: () => svg(`<path d="M10,26 Q30,18 50,28 Q70,18 90,26 L90,82 Q70,74 50,84 Q30,74 10,82 Z" fill="#7cc6f2" stroke="#4fa8de" stroke-width="3"/>
    <path d="M50,28 L50,84" stroke="#4fa8de" stroke-width="3"/>${face(30, 50, 22)}${face(70, 50, 22, { happy: true })}`),
  rice: () => svg(`<path d="M50,96 C50,70 46,50 40,30" stroke="#7cb342" stroke-width="5" fill="none" stroke-linecap="round"/>
    ${[[40, 30], [44, 42], [36, 44], [46, 54], [38, 58]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="8" fill="#f2cf5b"/>`).join('')}
    <path d="M50,96 C54,74 60,60 70,48" stroke="#8bc34a" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M50,80 C40,74 30,74 22,78" stroke="#8bc34a" stroke-width="4" fill="none" stroke-linecap="round"/>`),
  buffalo: () => svg(`<ellipse cx="50" cy="70" rx="34" ry="20" fill="#8d8a92"/>
    <circle cx="50" cy="46" r="24" fill="#a3a0a8"/><path d="M28,36 C14,30 10,20 16,14 C20,24 26,28 34,30 Z M72,36 C86,30 90,20 84,14 C80,24 74,28 66,30 Z" fill="#efe6d8"/>
    <ellipse cx="50" cy="58" rx="13" ry="8" fill="#c9c4cc"/>${face(50, 44, 26)}`),
  tree: () => svg(`<rect x="44" y="62" width="12" height="32" rx="5" fill="#9a6a43"/>
    <circle cx="50" cy="44" r="30" fill="#5cc27a"/><circle cx="30" cy="54" r="16" fill="#4fb36d"/><circle cx="70" cy="54" r="16" fill="#4fb36d"/>
    <circle cx="36" cy="30" r="4" fill="#ff9eb0"/><circle cx="66" cy="28" r="4" fill="#ff9eb0"/>${face(50, 46, 26)}`),
  mushroom: () => svg(`<rect x="38" y="52" width="24" height="34" rx="10" fill="#fff6e8"/>
    <path d="M12,56 C12,24 88,24 88,56 Z" fill="#ff7a8a"/><circle cx="34" cy="40" r="6" fill="#fff"/><circle cx="62" cy="34" r="5" fill="#fff"/><circle cx="72" cy="48" r="4" fill="#fff"/>
    ${face(50, 68, 18)}`),
  waterfall: () => svg(`<path d="M18,12 C30,4 70,4 82,12 L80,30 L20,30 Z" fill="#a9a2b4"/>
    <rect x="30" y="24" width="40" height="62" fill="#8fd3ea"/>${[36, 46, 56, 64].map((x) => `<line x1="${x}" y1="30" x2="${x}" y2="82" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>`).join('')}
    <ellipse cx="50" cy="88" rx="34" ry="9" fill="#6cc3e0"/><circle cx="30" cy="84" r="4" fill="#fff"/><circle cx="72" cy="86" r="3" fill="#fff"/>`),
  rock: () => svg(`<path d="M10,86 C8,60 26,40 50,40 C76,40 92,62 90,86 Z" fill="#b8b0c4"/>${face(50, 66, 26, { happy: true })}`),
  frog: () => svg(`<ellipse cx="50" cy="66" rx="34" ry="24" fill="#7ccf7a"/><circle cx="32" cy="40" r="12" fill="#7ccf7a"/><circle cx="68" cy="40" r="12" fill="#7ccf7a"/>
    <circle cx="32" cy="40" r="6" fill="${INK}"/><circle cx="68" cy="40" r="6" fill="${INK}"/><circle cx="34" cy="38" r="2" fill="#fff"/><circle cx="70" cy="38" r="2" fill="#fff"/>
    <ellipse cx="30" cy="66" rx="6" ry="4" fill="${BLUSH}"/><ellipse cx="70" cy="66" rx="6" ry="4" fill="${BLUSH}"/><path d="M40,64 Q50,74 60,64" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`),
  tent: () => svg(`<path d="M50,12 L90,86 L10,86 Z" fill="#ffb38a" stroke="#f08a5d" stroke-width="3" stroke-linejoin="round"/>
    <path d="M50,40 L64,86 L36,86 Z" fill="#8a5a3b"/><line x1="50" y1="12" x2="50" y2="2" stroke="#8a5a3b" stroke-width="3"/><path d="M50,2 L62,6 L50,10 Z" fill="#ffd166"/>${face(32, 66, 16)}`),
  fire: () => svg(`<path d="M20,90 L80,76 M20,76 L80,90" stroke="#9a6a43" stroke-width="7" stroke-linecap="round"/>
    <path d="M50,80 C30,74 30,50 44,36 C44,48 52,50 52,38 C62,46 74,62 50,80 Z" fill="#ff8a4c"/><path d="M50,78 C40,74 42,60 48,54 C50,62 56,62 56,56 C60,64 60,74 50,78 Z" fill="#ffd166"/>`),
  lake: () => svg(`<ellipse cx="50" cy="66" rx="44" ry="22" fill="#8fd3ea"/><ellipse cx="50" cy="62" rx="34" ry="14" fill="#b5e6f5"/>
    <ellipse cx="62" cy="58" rx="9" ry="7" fill="#fff"/><circle cx="68" cy="50" r="6" fill="#fff"/><path d="M73,50 L79,52 L73,54 Z" fill="#ffb347"/><circle cx="69" cy="49" r="1.5" fill="${INK}"/>`),
  snow: () => svg(`<g stroke="#a9dcf3" stroke-width="6" stroke-linecap="round">${[0, 60, 120].map((a) => `<line x1="50" y1="14" x2="50" y2="86" transform="rotate(${a} 50 50)"/>`).join('')}</g><circle cx="50" cy="50" r="14" fill="#fff"/>${face(50, 50, 16, { happy: true })}`),
  hill: () => svg(`<path d="M0,100 C10,50 40,30 50,30 C64,30 90,50 100,100 Z" fill="#9fdc9a"/>${face(50, 62, 26, { happy: true })}`, '0 0 100 100'),
  heart: () => svg(`<path d="M50,88 C10,60 6,30 26,20 C40,14 48,24 50,30 C52,24 60,14 74,20 C94,30 90,60 50,88 Z" fill="#ff9eb0"/>`),
  sparkle: () => svg(`<path d="M50,6 C54,40 60,46 94,50 C60,54 54,60 50,94 C46,60 40,54 6,50 C40,46 46,40 50,6 Z" fill="#fff4b8"/>`),
};

// Tortue mascotte.
export const TURTLE = svg(`<ellipse cx="50" cy="82" rx="30" ry="6" fill="#000" opacity=".08"/>
  <ellipse cx="26" cy="72" rx="8" ry="6" fill="#8fd18c"/><ellipse cx="74" cy="72" rx="8" ry="6" fill="#8fd18c"/>
  <circle cx="80" cy="50" r="15" fill="#8fd18c"/>${face(80, 50, 18)}
  <path d="M18,70 C18,36 70,30 74,64 Z" fill="#6bbf6a" stroke="#4e9e4e" stroke-width="3"/>
  <path d="M30,62 L38,46 L52,44 L60,58 Z" fill="#9fdc9a" opacity=".8"/>`);

// Le Rinjani, version mignonne.
export const MOUNTAIN = svg(`
  <path d="M0,160 C40,150 60,110 92,80 C120,52 140,30 160,28 C182,26 200,50 226,78 C256,110 284,146 320,160 Z" fill="#b39486"/>
  <path d="M128,46 C140,32 150,28 160,28 C172,28 184,36 196,50 C188,48 182,56 174,50 C168,58 160,52 154,58 C148,50 138,54 128,46 Z" fill="#fff"/>
  ${face(160, 92, 46)}
  <ellipse cx="226" cy="126" rx="26" ry="7" fill="#8fd3ea"/>
  <path d="M0,160 C50,130 90,150 140,140 C190,130 240,150 320,136 L320,170 L0,170 Z" fill="#9fdc9a"/>
  <line x1="160" y1="28" x2="160" y2="2" stroke="#4a3428" stroke-width="3" stroke-linecap="round"/><path d="M160,2 L184,9 L160,16 Z" fill="#ff7a8a"/>`, '0 -4 320 174');

// Collines douces au pied de chaque zone : [couleur avant, couleur arrière].
export const HILLS = (a, b) => svg(`<path d="M0,60 C60,20 140,30 200,52 C260,74 330,30 400,44 L400,100 L0,100 Z" fill="${b}"/>
  <path d="M0,78 C80,52 150,70 220,66 C300,60 340,80 400,70 L400,100 L0,100 Z" fill="${a}"/>`, '0 0 400 100');
