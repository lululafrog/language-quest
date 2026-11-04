// Paysages de chaque zone de l'île, inspirés de Lombok. Un SVG par zone (viewBox 400 × 1060),
// les éléments hauts restent sur les bords pour laisser le sentier lisible au centre.
import { face, ART } from './decor.js';

const ART_FROG = ART.frog().replace(/^<svg[^>]*>|<\/svg>$/g, '').replace(/^/, '<g transform="translate(-50 -80)">') + '</g>';

const W = 400, H = 1060;
const g = (x, y, s, body, flip = false) => `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">${body}</g>`;

// ---------- Éléments ----------
const palm = (x, y, s = 1, flip) => g(x, y, s, `
  <path d="M0,0 C-4,-40 6,-80 0,-120" stroke="#b07a4f" stroke-width="10" fill="none" stroke-linecap="round"/>
  <path d="M0,-120 C-24,-140 -52,-132 -64,-112 C-40,-120 -20,-120 0,-120 Z" fill="#4fb36d"/>
  <path d="M0,-120 C24,-142 54,-134 66,-114 C42,-121 20,-121 0,-120 Z" fill="#5cc27a"/>
  <path d="M0,-120 C-12,-150 -2,-164 14,-168 C6,-150 4,-134 0,-120 Z" fill="#6ad08a"/>
  <path d="M0,-120 C16,-110 34,-92 36,-74 C22,-90 10,-104 0,-120 Z" fill="#4fb36d"/>
  <path d="M0,-120 C-16,-108 -32,-92 -34,-74 C-20,-90 -10,-104 0,-120 Z" fill="#5cc27a"/>
  <circle cx="-5" cy="-114" r="6" fill="#8a5a3b"/><circle cx="6" cy="-112" r="6" fill="#9a6a43"/>`, flip);
const tree = (x, y, s = 1, c = '#5cc27a', c2 = '#4fb36d') => g(x, y, s, `
  <rect x="-6" y="-40" width="12" height="40" rx="5" fill="#9a6a43"/>
  <circle cx="0" cy="-62" r="34" fill="${c}"/><circle cx="-24" cy="-48" r="20" fill="${c2}"/><circle cx="24" cy="-48" r="20" fill="${c2}"/><circle cx="-8" cy="-80" r="14" fill="${c}" opacity=".7"/>`);
const banana = (x, y, s = 1, flip) => g(x, y, s, `
  <path d="M0,0 L0,-60" stroke="#8bb65a" stroke-width="9" stroke-linecap="round"/>
  <path d="M0,-60 C-30,-70 -50,-56 -56,-36 C-36,-46 -18,-52 0,-60 Z M0,-60 C30,-74 52,-62 58,-42 C38,-50 18,-54 0,-60 Z M0,-60 C-8,-90 6,-104 20,-104 C10,-86 6,-74 0,-60 Z" fill="#7cc65c"/>`, flip);
const pine = (x, y, s = 1, c = '#3f9d67') => g(x, y, s, `
  <rect x="-5" y="-16" width="10" height="16" fill="#8a5a3b"/>
  <path d="M0,-96 L26,-56 L14,-56 L34,-24 L-34,-24 L-14,-56 L-26,-56 Z" fill="${c}"/><path d="M0,-96 L10,-80 L-10,-80 Z" fill="#fff" opacity=".5"/>`);
const bush = (x, y, s = 1, c = '#7cc98c') => g(x, y, s, `<circle cx="-14" cy="-10" r="14" fill="${c}"/><circle cx="6" cy="-16" r="18" fill="${c}"/><circle cx="22" cy="-8" r="12" fill="${c}"/><circle cx="-2" cy="-22" r="4" fill="#ff9eb0"/><circle cx="14" cy="-12" r="3" fill="#fff"/>`);
const fern = (x, y, s = 1) => g(x, y, s, [-50, -25, 0, 25, 50].map((a) => `<path d="M0,0 Q${a / 2},-26 ${a},-40" stroke="#5aa86a" stroke-width="5" fill="none" stroke-linecap="round"/>`).join(''));
const rock = (x, y, s = 1, c = '#b8b0c4') => g(x, y, s, `<path d="M-30,0 C-32,-20 -14,-34 2,-32 C20,-30 34,-18 30,0 Z" fill="${c}"/><path d="M-14,-24 C-6,-30 6,-30 12,-26" stroke="#fff" stroke-width="3" fill="none" opacity=".5" stroke-linecap="round"/>`);
const flower = (x, y, s = 1, c = '#fff') => g(x, y, s, `${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-7" rx="4" ry="7" fill="${c}" transform="rotate(${a})"/>`).join('')}<circle r="3.5" fill="#ffd166"/>`);
const grass = (x, y, s = 1, c = '#8fcf7a') => g(x, y, s, `<path d="M-8,0 Q-6,-10 -10,-16 M0,0 Q1,-12 -1,-20 M8,0 Q7,-10 11,-15" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/>`);
const cloud = (x, y, s = 1, smile = false) => g(x, y, s, `<g fill="#fff"><circle cx="-26" cy="0" r="16"/><circle cx="0" cy="-10" r="22"/><circle cx="24" cy="0" r="15"/><rect x="-40" y="-2" width="80" height="16" rx="8"/></g>${smile ? face(0, 0, 20, { happy: true }) : ''}`);
const lumbung = (x, y, s = 1) => g(x, y, s, `
  <rect x="-16" y="-34" width="4" height="34" fill="#9a6a43"/><rect x="12" y="-34" width="4" height="34" fill="#9a6a43"/><ellipse cx="0" cy="-34" rx="22" ry="5" fill="#b07a4f"/>
  <path d="M0,-100 C-24,-94 -30,-60 -26,-36 L26,-36 C30,-60 24,-94 0,-100 Z" fill="#e7b46a" stroke="#c98d3f" stroke-width="3"/>
  <path d="M-20,-76 Q0,-82 20,-76 M-24,-56 Q0,-62 24,-56" stroke="#c98d3f" stroke-width="2.5" fill="none"/><rect x="-7" y="-60" width="14" height="12" rx="2" fill="#8a5a3b"/>`);
// Bale : maison sasak (murs de bambou tressé, toit de chaume bas).
const bale = (x, y, s = 1) => g(x, y, s, `
  <rect x="-40" y="-36" width="80" height="36" fill="#e9cf9f"/><path d="M-40,-24 L40,-24 M-40,-12 L40,-12" stroke="#d4b47c" stroke-width="2"/>
  <rect x="-10" y="-28" width="20" height="28" fill="#8a5a3b"/>
  <path d="M-58,-30 L0,-78 L58,-30 Z" fill="#c9a061" stroke="#a87d3e" stroke-width="3" stroke-linejoin="round"/>
  <path d="M-40,-44 L40,-44 M-24,-58 L24,-58" stroke="#a87d3e" stroke-width="2"/>`);
const fence = (x1, x2, y) => `<g stroke="#c49a63" stroke-width="4" stroke-linecap="round"><line x1="${x1}" y1="${y - 10}" x2="${x2}" y2="${y - 10}"/>${Array.from({ length: Math.floor((x2 - x1) / 16) + 1 }, (_, i) => `<line x1="${x1 + i * 16}" y1="${y}" x2="${x1 + i * 16}" y2="${y - 20}"/>`).join('')}</g>`;
const chicken = (x, y, s = 1, flip) => g(x, y, s, `<ellipse cx="0" cy="-12" rx="14" ry="11" fill="#fff"/><circle cx="12" cy="-24" r="8" fill="#fff"/><path d="M10,-32 L13,-38 L16,-32" fill="#ff7a8a"/><path d="M20,-24 L26,-22 L20,-20 Z" fill="#ffb347"/><circle cx="14" cy="-25" r="1.6" fill="#4a3428"/><path d="M-14,-14 C-22,-24 -18,-30 -12,-22" fill="#f2cf5b"/>`, flip);
const boat = (x, y, s = 1) => g(x, y, s, `
  <path d="M-60,-6 C-40,10 40,10 60,-6 L50,-14 L-50,-14 Z" fill="#ef6c4d"/><path d="M-50,-14 L50,-14 L46,-8 L-46,-8 Z" fill="#ffd166"/>
  <path d="M-30,-14 Q0,-36 30,-14" stroke="#8a5a3b" stroke-width="3" fill="none"/><line x1="-70" y1="2" x2="70" y2="2" stroke="#8a5a3b" stroke-width="3"/>
  <line x1="0" y1="-14" x2="0" y2="-70" stroke="#8a5a3b" stroke-width="3"/><path d="M2,-68 L40,-24 L2,-24 Z" fill="#fff" stroke="#e8e0d4" stroke-width="2"/>`);
const umbrella = (x, y, s = 1, c = '#ff7a8a') => g(x, y, s, `<line x1="0" y1="0" x2="0" y2="-46" stroke="#8a5a3b" stroke-width="3"/><path d="M-30,-40 Q0,-70 30,-40 Z" fill="${c}"/><path d="M-10,-40 Q0,-66 10,-40" fill="#fff" opacity=".6"/>`);
const stall = (x, y, s = 1, c = '#ef6c4d', goods = ['#ffb347', '#ffd166', '#7cc65c']) => g(x, y, s, `
  <rect x="-44" y="-56" width="4" height="56" fill="#9a6a43"/><rect x="40" y="-56" width="4" height="56" fill="#9a6a43"/>
  <path d="M-52,-56 L52,-56 L46,-76 L-46,-76 Z" fill="${c}"/>${[-36, -12, 12, 36].map((dx, i) => `<path d="M${dx - 10},-56 Q${dx},-46 ${dx + 10},-56 Z" fill="${i % 2 ? '#fff' : c}"/>`).join('')}
  <rect x="-44" y="-26" width="88" height="26" fill="#c49a63"/>${goods.map((cg, i) => `<circle cx="${-26 + i * 26}" cy="-30" r="10" fill="${cg}"/>`).join('')}`);
const basket = (x, y, s = 1, c = '#7cc65c') => g(x, y, s, `<circle cx="-8" cy="-18" r="8" fill="${c}"/><circle cx="6" cy="-20" r="8" fill="#ffb347"/><path d="M-18,-14 L18,-14 L14,0 L-14,0 Z" fill="#c49a63"/><path d="M-16,-8 L16,-8" stroke="#a87d3e" stroke-width="2"/>`);
const school = (x, y, s = 1) => g(x, y, s, `
  <rect x="-70" y="-60" width="140" height="60" fill="#fff6e8"/><path d="M-80,-56 L0,-96 L80,-56 Z" fill="#ef6c4d"/>
  ${[-50, -20, 20, 50].map((dx) => `<rect x="${dx - 9}" y="-46" width="18" height="16" rx="2" fill="#9fd8f0"/>`).join('')}
  <rect x="-10" y="-30" width="20" height="30" fill="#8a5a3b"/><rect x="-26" y="-76" width="52" height="12" rx="3" fill="#fff"/><text x="0" y="-67" font-size="9" text-anchor="middle" fill="#4a3428" font-family="sans-serif" font-weight="700">SDN 1</text>`);
const flag = (x, y, s = 1) => g(x, y, s, `<line x1="0" y1="0" x2="0" y2="-110" stroke="#9aa3ad" stroke-width="4"/><rect x="2" y="-108" width="40" height="13" fill="#e53935"/><rect x="2" y="-95" width="40" height="13" fill="#fff" stroke="#eee"/>`);
const bike = (x, y, s = 1) => g(x, y, s, `<circle cx="-16" cy="-12" r="12" stroke="#4a3428" stroke-width="3" fill="none"/><circle cx="16" cy="-12" r="12" stroke="#4a3428" stroke-width="3" fill="none"/><path d="M-16,-12 L-4,-30 L12,-30 L16,-12 M-4,-30 L4,-12 L-16,-12" stroke="#4fa8de" stroke-width="3" fill="none"/>`);
const buffalo = (x, y, s = 1, flip) => g(x, y, s, `<ellipse cx="0" cy="-22" rx="28" ry="16" fill="#8d8a92"/><rect x="-20" y="-12" width="6" height="12" fill="#7a7780"/><rect x="14" y="-12" width="6" height="12" fill="#7a7780"/>
  <circle cx="28" cy="-30" r="12" fill="#a3a0a8"/><path d="M20,-40 C12,-48 14,-54 20,-54 C20,-48 24,-44 28,-42 Z M36,-40 C44,-48 42,-54 36,-54 C36,-48 32,-44 30,-42 Z" fill="#efe6d8"/>${face(28, -30, 12)}`, flip);
const hut = (x, y, s = 1) => g(x, y, s, `<rect x="-24" y="-30" width="4" height="30" fill="#9a6a43"/><rect x="20" y="-30" width="4" height="30" fill="#9a6a43"/><rect x="-26" y="-22" width="52" height="5" fill="#c49a63"/><path d="M-36,-28 L0,-56 L36,-28 Z" fill="#d9b26a"/>`);
const monkey = (x, y, s = 1) => g(x, y, s, `<path d="M0,0 C0,-20 0,-30 0,-40" stroke="#9a6a43" stroke-width="3"/><circle cx="0" cy="-8" r="12" fill="#a8774e"/><circle cx="0" cy="-26" r="11" fill="#a8774e"/><ellipse cx="0" cy="-24" rx="7" ry="6" fill="#f2d2b0"/><circle cx="-11" cy="-28" r="4" fill="#a8774e"/><circle cx="11" cy="-28" r="4" fill="#a8774e"/>${face(0, -26, 10)}`);
const mushroom = (x, y, s = 1) => g(x, y, s, `<rect x="-5" y="-14" width="10" height="14" rx="4" fill="#fff6e8"/><path d="M-14,-12 C-14,-30 14,-30 14,-12 Z" fill="#ff7a8a"/><circle cx="-5" cy="-20" r="2.5" fill="#fff"/><circle cx="5" cy="-24" r="2" fill="#fff"/>`);
const tent = (x, y, s = 1, c = '#ffb38a') => g(x, y, s, `<path d="M0,-50 L40,0 L-40,0 Z" fill="${c}" stroke="#00000018" stroke-width="2" stroke-linejoin="round"/><path d="M0,-26 L12,0 L-12,0 Z" fill="#8a5a3b"/><line x1="0" y1="-50" x2="0" y2="-60" stroke="#8a5a3b" stroke-width="3"/>`);
const fire = (x, y, s = 1) => g(x, y, s, `<path d="M-16,0 L16,-6 M-16,-6 L16,0" stroke="#9a6a43" stroke-width="5" stroke-linecap="round"/><path d="M0,-4 C-12,-8 -12,-24 -4,-32 C-4,-24 2,-24 2,-32 C8,-26 14,-14 0,-4 Z" fill="#ff8a4c"/><path d="M0,-5 C-5,-8 -4,-16 -1,-19 C0,-14 3,-14 3,-17 C6,-12 5,-7 0,-5 Z" fill="#ffd166"/>`);
const sign = (x, y, s = 1, text = 'POS 2') => g(x, y, s, `<rect x="-3" y="-44" width="6" height="44" fill="#9a6a43"/><rect x="-28" y="-56" width="56" height="20" rx="4" fill="#c49a63"/><text x="0" y="-42" font-size="11" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="800">${text}</text>`);
const steam = (x, y, s = 1) => g(x, y, s, `<path d="M0,0 C-10,-14 10,-22 0,-36 C-10,-50 8,-58 2,-70" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".8"/>`);

// Bande de terrain ondulée pleine largeur.
const band = (y, amp, c, op = 1) => `<path d="M0,${y} C80,${y - amp} 160,${y + amp} 240,${y} C300,${y - amp} 360,${y + amp / 2} ${W},${y - amp / 3} L${W},${H} L0,${H} Z" fill="${c}" opacity="${op}"/>`;
const wavesLine = (y, c = '#fff') => `<path d="M0,${y} q20,-10 40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0" stroke="${c}" stroke-width="3" fill="none" opacity=".7"/>`;
const dots = (n, x1, x2, y1, y2, c, r = 2, seed = 1) => Array.from({ length: n }, (_, i) => {
  const a = Math.sin((i + 1) * 12.9898 * seed) * 43758.5453, b = Math.sin((i + 1) * 78.233 * seed) * 12345.678;
  return `<circle cx="${x1 + (a - Math.floor(a)) * (x2 - x1)}" cy="${y1 + (b - Math.floor(b)) * (y2 - y1)}" r="${r}" fill="${c}"/>`;
}).join('');
const edgeRow = (fn, ys) => ys.map((y, i) => fn(i % 2 ? 370 : 30, y, i)).join('');

// ---------- Paysages ----------
const SCENES = [
  // 1. Pantai Kuta : mer, sable, palmiers, jukung, collines de Mandalika.
  () => `
    <path d="M0,0 C40,60 90,40 120,90 L0,140 Z M${W},0 C360,60 310,40 280,90 L${W},140 Z" fill="#9fdc9a"/>
    ${band(560, 20, '#fbe3b0')}${dots(60, 0, W, 600, 900, '#f2cf8f', 2, 1)}
    ${band(880, 18, '#8fd3ea')}${band(930, 14, '#6cc3e0')}${wavesLine(900)}${wavesLine(960)}${wavesLine(1010)}
    ${boat(90, 990, 0.9)}${umbrella(330, 760, 1.1, '#ff7a8a')}${umbrella(60, 650, 1, '#7cc6f2')}
    ${palm(26, 420, 1.1)}${palm(374, 300, 1, true)}${palm(30, 820, 1)}${palm(372, 640, 1.15, true)}${palm(20, 180, 0.9)}
    ${flower(80, 470, 1.4, '#fff')}${flower(330, 520, 1.2, '#ffd3de')}${cloud(330, 70, 1, true)}`,
  // 2. Desa Sasak : maisons bale, lumbung, clôtures en bambou, bananiers, poules.
  () => `
    ${band(120, 16, '#f3d6b8', .8)}${dots(50, 0, W, 140, 1060, '#e8c49c', 2, 2)}
    <path d="M200,1060 C160,900 250,760 190,600 C140,460 240,320 200,0" stroke="#f0cfa6" stroke-width="44" fill="none" opacity=".6"/>
    ${bale(54, 300, 0.9)}${lumbung(352, 210, 1)}${bale(350, 620, 0.85)}${lumbung(40, 760, 0.95)}${bale(52, 1000, 0.8)}${lumbung(358, 950, 0.85)}
    ${fence(0, 90, 360)}${fence(310, 400, 680)}${banana(40, 520, 1)}${banana(366, 430, 1, true)}${banana(370, 820, 0.9, true)}
    ${chicken(90, 560, 0.9)}${chicken(320, 760, 0.8, true)}${flower(30, 140, 1.3, '#fff')}${flower(370, 120, 1.3, '#ffd3de')}`,
  // 3. Sekolah : bâtiment, drapeau rouge et blanc, terrain, vélos, arbres.
  () => `
    ${band(80, 12, '#d9d2f7', .7)}<rect x="0" y="420" width="${W}" height="300" fill="#c8ecb6" opacity=".6"/>
    <rect x="70" y="460" width="260" height="220" rx="20" fill="none" stroke="#fff" stroke-width="5" opacity=".8"/><circle cx="200" cy="570" r="34" fill="none" stroke="#fff" stroke-width="5" opacity=".8"/><line x1="70" y1="570" x2="330" y2="570" stroke="#fff" stroke-width="5" opacity=".8"/>
    ${school(60, 300, 0.8)}${flag(370, 330, 1)}${tree(370, 180, 1)}${tree(30, 820, 1.1, '#7cc98c', '#6bbd7c')}${tree(372, 900, 0.9)}
    ${bike(350, 760, 1)}${bush(40, 620, 1)}${bush(360, 1020, 1)}${flower(80, 960, 1.3, '#ffd3de')}${cloud(60, 90, 0.9, true)}`,
  // 4. Pasar : étals à rayures, paniers de fruits, fanions.
  () => `
    <path d="M0,40 Q100,80 200,40 T${W},40" stroke="#c49a63" stroke-width="2" fill="none"/>${Array.from({ length: 10 }, (_, i) => `<path d="M${i * 40 + 6},${44 + Math.sin(i) * 6} l14,0 l-7,16 Z" fill="${['#ef6c4d', '#ffd166', '#7cc6f2', '#7cc65c'][i % 4]}"/>`).join('')}
    ${dots(40, 0, W, 100, 1060, '#f7c9d4', 2, 3)}
    ${stall(50, 260, 0.9, '#ef6c4d')}${stall(350, 420, 0.9, '#4fa8de', ['#ff7a8a', '#ffb347', '#fff6e8'])}${stall(50, 640, 0.9, '#7cc65c', ['#ffd166', '#a8774e', '#ff7a8a'])}
    ${stall(350, 840, 0.9, '#b48cf2', ['#7cc65c', '#ffb347', '#ffd166'])}${stall(52, 1010, 0.85, '#ffb347')}
    ${basket(110, 300, 1.2)}${basket(296, 460, 1.1, '#ff7a8a')}${basket(110, 690, 1.1, '#ffd166')}${basket(300, 880, 1.2)}`,
  // 5. Sawah : rizières en terrasses, saung, buffle, palmiers.
  () => `
    ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => band(120 + i * 110, 26, i % 2 ? '#b5e08e' : '#c8ea9f', .9)).join('')}
    ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<path d="M0,${150 + i * 110} C80,${124 + i * 110} 160,${176 + i * 110} 240,${150 + i * 110} C300,${124 + i * 110} 360,${163 + i * 110} ${W},${141 + i * 110}" stroke="#8fcf7a" stroke-width="3" fill="none" opacity=".7"/>`).join('')}
    ${hut(352, 330, 1.2)}${buffalo(50, 560, 1.1)}${palm(374, 760, 0.9, true)}${palm(24, 260, 0.85)}${hut(46, 940, 1)}
    ${Array.from({ length: 14 }, (_, i) => grass(i % 2 ? 360 - (i % 3) * 10 : 30 + (i % 3) * 12, 140 + i * 66, 1.2, '#6fbf55')).join('')}`,
  // 6. Hutan : jungle en couches, fougères, champignons, singes.
  () => `
    ${edgeRow((x, y, i) => tree(x, y, 1.3 + (i % 3) * 0.15, i % 2 ? '#4fb36d' : '#5cc27a', '#3f9d5f'), [130, 260, 390, 520, 650, 780, 910, 1040])}
    ${edgeRow((x, y) => fern(x === 30 ? 70 : 330, y, 1.1), [200, 460, 720, 980])}
    ${mushroom(80, 330, 1.4)}${mushroom(330, 600, 1.3)}${mushroom(90, 860, 1.2)}
    ${monkey(40, 180, 1.2)}${monkey(362, 700, 1.1)}
    <path d="M120,0 L180,1060 M260,0 L300,1060" stroke="#fffde0" stroke-width="30" opacity=".18"/>`,
  // 7. Sendang Gile : falaise, cascade, bassin, rivière, fougères.
  () => `
    <path d="M0,0 L110,0 C130,120 120,260 90,380 L0,420 Z" fill="#b8b0c4"/><path d="M0,0 L80,0 C96,140 86,260 60,360 L0,380 Z" fill="#a9a2b4"/>
    <rect x="58" y="40" width="40" height="350" fill="#8fd3ea"/>${[64, 74, 84, 92].map((x) => `<line x1="${x}" y1="50" x2="${x}" y2="380" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>`).join('')}
    <ellipse cx="90" cy="410" rx="90" ry="28" fill="#6cc3e0"/>${dots(10, 30, 150, 390, 420, '#fff', 3, 4)}
    <path d="M90,430 C180,500 120,620 220,700 C300,770 240,900 320,1060" stroke="#8fd3ea" stroke-width="40" fill="none" opacity=".75"/>
    ${rock(150, 440, 1.2)}${rock(360, 300, 1.3)}${fern(360, 520, 1.3)}${fern(40, 640, 1.3)}${tree(370, 880, 1.2)}${tree(30, 1000, 1.1)}${bush(40, 820, 1.1)}${flower(330, 180, 1.3)}`,
  // 8. Pos Pendakian : pins, tentes, feu de camp, panneau.
  () => `
    ${band(300, 30, '#d1dae6', .8)}${band(700, 24, '#c3cede', .6)}
    ${edgeRow((x, y, i) => pine(x, y, 1 + (i % 3) * 0.2), [120, 250, 380, 510, 640, 770, 900, 1030])}
    ${tent(90, 360, 1.1, '#ffb38a')}${tent(320, 560, 1, '#7cc6f2')}${tent(90, 820, 1, '#b48cf2')}${fire(140, 400, 1.2)}${sign(330, 900, 1.1, 'POS 2')}
    ${rock(320, 220, 1)}${rock(70, 640, 0.9)}${cloud(330, 90, 1.1)}`,
  // 9. Segara Anak : lac de cratère, Barujari qui fume, sources chaudes, parois du cratère.
  () => `
    <path d="M0,0 C60,200 40,600 0,900 Z M${W},0 C340,200 360,600 ${W},900 Z" fill="#b9a99f" opacity=".8"/>
    <ellipse cx="200" cy="560" rx="190" ry="250" fill="#8fc3ea" opacity=".75"/><ellipse cx="200" cy="560" rx="150" ry="200" fill="#a9d5f2" opacity=".6"/>
    ${wavesLine(420, '#fff')}${wavesLine(700, '#fff')}
    <path d="M320,620 L350,560 L366,560 L392,620 Z" fill="#8d6e63"/>${steam(358, 560, 0.8)}
    ${steam(50, 980, 0.9)}${steam(80, 1000, 0.7)}<ellipse cx="66" cy="1010" rx="40" ry="10" fill="#b5e6f5"/>
    ${pine(40, 260, 1)}${pine(362, 960, 1.1)}${rock(360, 240, 1.1)}${cloud(80, 90, 1.1, true)}${cloud(320, 1000, 0.9)}`,
  // 10. Puncak : pentes rocheuses, mer de nuages, lever de soleil.
  () => `
    <path d="M0,1060 L0,300 C80,200 120,80 200,0 C280,80 320,200 ${W},300 L${W},1060 Z" fill="#d6c4b8" opacity=".7"/>
    ${dots(40, 0, W, 100, 1000, '#bfa99b', 3, 5)}${edgeRow((x, y, i) => rock(x, y, 1 + (i % 2) * 0.4, '#a99a90'), [200, 380, 560, 740, 920])}
    ${cloud(60, 980, 1.6)}${cloud(200, 1020, 1.8)}${cloud(350, 970, 1.5)}${cloud(320, 400, 1)}${cloud(60, 640, 1.1, true)}
    ${edgeRow((x, y) => grass(x, y, 1.3, '#b5a37f'), [150, 300, 460, 620, 780])}`,
];

// ---------- Détails animés (classes a-* dans styles.css) ----------
const A = (cls, body) => `<g class="${cls}">${body}</g>`;
const bird = (x, y, s = 1, c = '#5b6b7a', d = 0) => A('a-fly', g(x, y, s, `<g style="animation-delay:${d}s" class="a-flap"><path d="M-12,0 Q-6,-8 0,0 Q6,-8 12,0" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/></g>`));
const butterfly = (x, y, s = 1, c = '#ff9eb0', d = 0) => A('a-float', g(x, y, s, `<g class="a-flap" style="animation-delay:${d}s"><ellipse cx="-7" cy="-4" rx="7" ry="9" fill="${c}"/><ellipse cx="7" cy="-4" rx="7" ry="9" fill="${c}"/><ellipse cx="-5" cy="6" rx="5" ry="6" fill="${c}" opacity=".8"/><ellipse cx="5" cy="6" rx="5" ry="6" fill="${c}" opacity=".8"/></g><rect x="-1.5" y="-10" width="3" height="20" rx="1.5" fill="#4a3428"/>`));
const crab = (x, y, s = 1) => A('a-scuttle', g(x, y, s, `<ellipse cx="0" cy="-10" rx="16" ry="11" fill="#ff7a6b"/><path d="M-16,-12 C-26,-20 -28,-30 -20,-32 C-22,-26 -18,-22 -14,-18 M16,-12 C26,-20 28,-30 20,-32 C22,-26 18,-22 14,-18" stroke="#ff7a6b" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M-12,-2 L-18,4 M-6,0 L-10,6 M12,-2 L18,4 M6,0 L10,6" stroke="#ff7a6b" stroke-width="3" stroke-linecap="round"/>${face(0, -12, 14)}`));
const islet = (x, y, w = 60) => `<path d="M${x - w / 2},${y} C${x - w / 4},${y - 22} ${x + w / 4},${y - 26} ${x + w / 2},${y} Z" fill="#9fdc9a"/><path d="M${x - w / 2 + 6},${y} L${x + w / 2 - 6},${y}" stroke="#fbe3b0" stroke-width="4"/>`;
const footprints = (x, y, n = 6) => Array.from({ length: n }, (_, i) => `<ellipse cx="${x + (i % 2 ? 8 : -8) + Math.sin(i) * 6}" cy="${y - i * 26}" rx="4" ry="6" fill="#ecc98e"/>`).join('');
const sandcastle = (x, y, s = 1) => g(x, y, s, `<rect x="-24" y="-20" width="48" height="20" fill="#f2cf8f"/><rect x="-14" y="-38" width="28" height="18" fill="#f2cf8f"/><path d="M-24,-20 l6,-6 l6,6 l6,-6 l6,6 l6,-6 l6,6 l6,-6 l6,6" fill="#f2cf8f"/><line x1="0" y1="-38" x2="0" y2="-54" stroke="#9a6a43" stroke-width="2"/><path d="M0,-54 L12,-50 L0,-46 Z" fill="#ff7a8a"/>`);
const kite = (x, y, s = 1, c = '#ff7a8a') => A('a-sway', g(x, y, s, `<path d="M0,-30 L20,0 L0,30 L-20,0 Z" fill="${c}"/><path d="M0,-30 L0,30 M-20,0 L20,0" stroke="#fff" stroke-width="2"/><path d="M0,30 C10,50 -10,60 4,80 C14,94 0,104 6,120" stroke="#fff" stroke-width="2" fill="none"/>${[50, 70, 90].map((yy) => `<path d="M-4,${yy} l8,4 l-8,4 Z" fill="#ffd166"/>`).join('')}`));
const laundry = (x1, x2, y) => `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y + 6}" stroke="#9a6a43" stroke-width="2"/>${Array.from({ length: 4 }, (_, i) => { const xx = x1 + 10 + i * ((x2 - x1 - 20) / 3); return `<g class="a-sway-s"><rect x="${xx - 8}" y="${y + 2}" width="16" height="${20 + (i % 2) * 8}" rx="3" fill="${['#ef6c4d', '#7cc6f2', '#ffd166', '#b48cf2'][i]}"/></g>`; }).join('')}`;
const smoke = (x, y, s = 1) => g(x, y, s, [0, 1, 2].map((i) => `<circle class="a-rise" style="animation-delay:${i * 1.3}s" cx="0" cy="0" r="${6 + i * 2}" fill="#fff" opacity=".7"/>`).join(''));
const goat = (x, y, s = 1, flip) => g(x, y, s, `<ellipse cx="0" cy="-16" rx="18" ry="11" fill="#f5efe6"/><rect x="-12" y="-8" width="4" height="10" fill="#d9cfc0"/><rect x="8" y="-8" width="4" height="10" fill="#d9cfc0"/><circle cx="18" cy="-26" r="8" fill="#f5efe6"/><path d="M14,-32 L10,-40 M20,-33 L22,-41" stroke="#b9a68c" stroke-width="3" stroke-linecap="round"/><path d="M18,-20 L18,-14" stroke="#d9cfc0" stroke-width="3"/>${face(19, -27, 8)}`, flip);
const cat = (x, y, s = 1) => g(x, y, s, `<ellipse cx="0" cy="-10" rx="14" ry="10" fill="#ffb347"/><circle cx="0" cy="-26" r="10" fill="#ffb347"/><path d="M-8,-32 L-8,-40 L-2,-34 M8,-32 L8,-40 L2,-34" fill="#ffb347"/><path d="M14,-8 C24,-10 24,-24 18,-26" stroke="#ffb347" stroke-width="4" fill="none" stroke-linecap="round" class="a-sway-s"/>${face(0, -26, 10)}`);
const swing = (x, y, s = 1) => g(x, y, s, `<path d="M-30,0 L-24,-60 L24,-60 L30,0" stroke="#9a6a43" stroke-width="5" fill="none"/><g class="a-swing"><line x1="-8" y1="-60" x2="-8" y2="-20" stroke="#8a5a3b" stroke-width="2"/><line x1="8" y1="-60" x2="8" y2="-20" stroke="#8a5a3b" stroke-width="2"/><rect x="-12" y="-22" width="24" height="5" rx="2" fill="#ef6c4d"/></g>`);
const welcome = (x, y, s = 1) => g(x, y, s, `<rect x="-3" y="-30" width="6" height="30" fill="#9a6a43"/><rect x="-40" y="-62" width="80" height="34" rx="6" fill="#2f6b4f" stroke="#9a6a43" stroke-width="4"/><text x="0" y="-40" font-size="13" text-anchor="middle" fill="#fff" font-family="Comic Sans MS, Chalkboard, cursive">Welcome!</text>`);
const scooter = (x, y, s = 1, c = '#7cc6f2', flip) => g(x, y, s, `<circle cx="-18" cy="-8" r="8" fill="#4a3428"/><circle cx="18" cy="-8" r="8" fill="#4a3428"/><circle cx="-18" cy="-8" r="3" fill="#ccc"/><circle cx="18" cy="-8" r="3" fill="#ccc"/><path d="M-26,-14 C-24,-28 6,-30 10,-16 L22,-16 L18,-34 L24,-36" fill="${c}" stroke="${c}" stroke-width="4" stroke-linejoin="round"/><rect x="-22" y="-28" width="20" height="5" rx="2" fill="#4a3428"/>`, flip);
// Cidomo : la carriole à cheval de Lombok.
const cidomo = (x, y, s = 1, flip) => g(x, y, s, `<g class="a-trot"><ellipse cx="44" cy="-30" rx="16" ry="10" fill="#b07a4f"/><rect x="34" y="-22" width="4" height="22" fill="#9a6a43"/><rect x="50" y="-22" width="4" height="22" fill="#9a6a43"/><path d="M56,-36 L64,-52 L72,-44 L64,-30 Z" fill="#b07a4f"/><path d="M62,-52 L60,-58" stroke="#b07a4f" stroke-width="3"/>${face(66, -44, 8)}</g>
  <line x1="10" y1="-26" x2="34" y2="-30" stroke="#8a5a3b" stroke-width="3"/><rect x="-30" y="-36" width="44" height="20" rx="4" fill="#ffd166"/><path d="M-34,-36 Q-8,-66 18,-36 Z" fill="#ef6c4d"/>
  <circle cx="-8" cy="-12" r="12" fill="none" stroke="#8a5a3b" stroke-width="4"/><path d="M-8,-24 L-8,0 M-20,-12 L4,-12" stroke="#8a5a3b" stroke-width="2"/>`, flip);
const sack = (x, y, s = 1) => g(x, y, s, `<path d="M-14,0 C-18,-20 -12,-30 0,-30 C12,-30 18,-20 14,0 Z" fill="#e9dcc4"/><path d="M-6,-30 L0,-36 L6,-30" stroke="#c4b08c" stroke-width="3" fill="none"/><text x="0" y="-10" font-size="7" text-anchor="middle" fill="#9a6a43" font-family="sans-serif" font-weight="700">BERAS</text>`);
const lantern = (x, y, c = '#ef6c4d') => `<g class="a-sway-s"><line x1="${x}" y1="${y - 14}" x2="${x}" y2="${y - 4}" stroke="#9a6a43"/><ellipse cx="${x}" cy="${y + 6}" rx="8" ry="11" fill="${c}"/><rect x="${x - 5}" y="${y - 6}" width="10" height="3" fill="#ffd166"/></g>`;
const duckRow = (x, y, n = 4, s = 1) => A('a-waddle', g(x, y, s, Array.from({ length: n }, (_, i) => { const big = i === 0, k = big ? 1 : 0.6, dx = -i * 24; return `<g transform="translate(${dx} 0) scale(${k})"><ellipse cx="0" cy="-10" rx="12" ry="9" fill="${big ? '#fff' : '#ffe27a'}"/><circle cx="9" cy="-20" r="7" fill="${big ? '#fff' : '#ffe27a'}"/><path d="M15,-20 L22,-18 L15,-16 Z" fill="#ffb347"/><circle cx="10" cy="-21" r="1.5" fill="#4a3428"/></g>`; }).join('')));
const dragonfly = (x, y, s = 1) => A('a-float', g(x, y, s, `<rect x="-1.5" y="-14" width="3" height="28" rx="1.5" fill="#4fa8de"/><g class="a-flap"><ellipse cx="-10" cy="-6" rx="10" ry="3" fill="#bfe7f5" opacity=".9"/><ellipse cx="10" cy="-6" rx="10" ry="3" fill="#bfe7f5" opacity=".9"/><ellipse cx="-9" cy="0" rx="8" ry="3" fill="#bfe7f5" opacity=".9"/><ellipse cx="9" cy="0" rx="8" ry="3" fill="#bfe7f5" opacity=".9"/></g>`));
const scarecrow = (x, y, s = 1) => A('a-sway', g(x, y, s, `<line x1="0" y1="0" x2="0" y2="-70" stroke="#9a6a43" stroke-width="4"/><line x1="-24" y1="-48" x2="24" y2="-48" stroke="#9a6a43" stroke-width="4"/><rect x="-14" y="-56" width="28" height="26" rx="4" fill="#7cc6f2"/><circle cx="0" cy="-66" r="9" fill="#f2d2b0"/><path d="M-22,-68 L0,-84 L22,-68 Z" fill="#e7c06a"/>${face(0, -64, 9)}`));
const vine = (x, y, len = 160) => `<path class="a-sway-s" d="M${x},${y} C${x + 10},${y + len / 3} ${x - 10},${y + (2 * len) / 3} ${x + 4},${y + len}" stroke="#4e9e4e" stroke-width="3" fill="none"/>${[0.25, 0.5, 0.75].map((t) => `<ellipse cx="${x + 6}" cy="${y + len * t}" rx="7" ry="4" fill="#6bbf6a"/>`).join('')}`;
const fireflies = (n, x1, x2, y1, y2, seed) => Array.from({ length: n }, (_, i) => { const a = Math.sin((i + 3) * 91.7 * seed) * 999, b = Math.sin((i + 5) * 37.3 * seed) * 999; return `<circle class="a-twinkle" style="animation-delay:${(i % 5) * 0.6}s" cx="${x1 + (a - Math.floor(a)) * (x2 - x1)}" cy="${y1 + (b - Math.floor(b)) * (y2 - y1)}" r="3" fill="#fff6a8"/>`; }).join('');
const rainbow = (x, y, r = 80) => `<g opacity=".55">${['#ff7a8a', '#ffb347', '#ffd166', '#7cc65c', '#7cc6f2', '#b48cf2'].map((c, i) => `<path d="M${x - r + i * 6},${y} A${r - i * 6},${r - i * 6} 0 0 1 ${x + r - i * 6},${y}" stroke="${c}" stroke-width="6" fill="none"/>`).join('')}</g>`;
const lily = (x, y, s = 1, flower = false) => g(x, y, s, `<path d="M0,0 m-16,0 a16,8 0 1,0 32,0 a16,8 0 1,0 -32,0 M0,0 L14,-4" fill="#6bbf6a"/>${flower ? `<circle cx="-4" cy="-4" r="5" fill="#ffd3de"/>` : ''}`);
const edelweiss = (x, y, s = 1) => g(x, y, s, `<line x1="0" y1="0" x2="0" y2="-16" stroke="#9fb39a" stroke-width="2"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<ellipse cx="0" cy="-26" rx="3" ry="8" fill="#f4f6f2" stroke="#dfe5dc" transform="rotate(${a} 0 -20)"/>`).join('')}<circle cx="0" cy="-20" r="4" fill="#e8e0a0"/>`);
const backpack = (x, y, s = 1, c = '#ef6c4d') => g(x, y, s, `<rect x="-12" y="-30" width="24" height="30" rx="8" fill="${c}"/><rect x="-8" y="-16" width="16" height="10" rx="3" fill="#00000022"/><rect x="-10" y="-36" width="20" height="8" rx="4" fill="#4a3428"/>`);
const thiefMonkey = (x, y, s = 1) => A('a-bob', g(x, y, s, `<circle cx="0" cy="-8" r="11" fill="#a8774e"/><circle cx="0" cy="-26" r="10" fill="#a8774e"/><ellipse cx="0" cy="-24" rx="6" ry="5" fill="#f2d2b0"/>${face(0, -26, 9)}<rect x="8" y="-16" width="14" height="10" rx="2" fill="#ffd166" transform="rotate(-15 15 -11)"/><text x="15" y="-9" font-size="5" text-anchor="middle" fill="#ef6c4d" font-family="sans-serif" transform="rotate(-15 15 -11)">MIE</text>`));
const fishJump = (x, y, s = 1) => g(x, y, s, `<g class="a-jump"><path d="M-10,0 C-4,-8 8,-8 12,0 C8,8 -4,8 -10,0 Z M-10,0 L-18,-6 L-18,6 Z" fill="#ffb347"/><circle cx="6" cy="-1" r="1.5" fill="#4a3428"/></g><ellipse cx="0" cy="16" rx="14" ry="4" fill="none" stroke="#fff" stroke-width="2" opacity=".7"/>`);
const rod = (x, y, s = 1) => g(x, y, s, `<line x1="0" y1="0" x2="50" y2="-50" stroke="#8a5a3b" stroke-width="3"/><path d="M50,-50 C60,-40 62,-10 60,6" stroke="#fff" stroke-width="1.5" fill="none"/><circle cx="60" cy="6" r="3" fill="#ef6c4d" class="a-bob"/>`);
const sunrise = (x, y, r = 46) => `<g class="a-glow"><circle cx="${x}" cy="${y}" r="${r * 1.7}" fill="#ffe7a8" opacity=".5"/>${Array.from({ length: 9 }, (_, i) => { const a = Math.PI + (i * Math.PI) / 8; return `<line x1="${x + Math.cos(a) * r * 1.2}" y1="${y + Math.sin(a) * r * 1.2}" x2="${x + Math.cos(a) * r * 1.6}" y2="${y + Math.sin(a) * r * 1.6}" stroke="#ffc94a" stroke-width="5" stroke-linecap="round"/>`; }).join('')}</g><circle cx="${x}" cy="${y}" r="${r}" fill="#ffb347"/>${face(x, y - 6, r)}`;
const summitSign = (x, y, s = 1) => g(x, y, s, `<rect x="-3" y="-50" width="6" height="50" fill="#9a6a43"/><rect x="-40" y="-70" width="80" height="26" rx="5" fill="#c49a63"/><text x="0" y="-52" font-size="12" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="800">3.726 m</text>`);
const pebbles = (n, x1, x2, y1, y2, seed, c = '#d9cfc0') => dots(n, x1, x2, y1, y2, c, 3, seed);
const tufts = (list, c) => list.map(([x, y, s]) => grass(x, y, s || 1, c)).join('');

const EXTRA = [
  // Kuta
  () => `${islet(300, 1010, 70)}${islet(360, 1030, 40)}
    <g class="a-wave">${wavesLine(890, '#fff')}</g><g class="a-wave-r">${wavesLine(945, '#fff')}</g>
    ${footprints(150, 850, 8)}${sandcastle(250, 820, 1)}${crab(320, 870, 0.9)}${crab(120, 640, 0.7)}
    ${bird(120, 200, 1, '#fff', 0)}${bird(160, 230, 0.8, '#fff', 0.4)}${bird(260, 160, 0.9, '#fff', 0.8)}
    ${dots(20, 20, 380, 620, 860, '#fff', 3, 7)}${flower(40, 560, 1.2, '#ffd3de')}${tufts([[80, 140], [330, 150], [120, 120]], '#6fbf55')}`,
  // Desa Sasak
  () => `${kite(300, 80, 1, '#ff7a8a')}${kite(110, 150, 0.7, '#7cc6f2')}${laundry(10, 120, 560)}${smoke(60, 220, 1)}${smoke(345, 545, 0.8)}
    ${goat(320, 330, 1, true)}${cat(80, 890, 0.9)}${pebbles(30, 150, 250, 100, 1000, 8, '#e3c39c')}
    ${tufts([[110, 400], [300, 460], [90, 700], [310, 860], [140, 980]], '#9ccf7a')}${butterfly(260, 260, 0.9, '#ffd166', 0)}${butterfly(140, 760, 0.8, '#ff9eb0', 0.5)}`,
  // Sekolah
  () => `${welcome(330, 480, 1)}${swing(60, 420, 1)}${backpack(110, 760, 1, '#7cc6f2')}${backpack(300, 330, 0.9, '#ff7a8a')}
    ${butterfly(150, 210, 0.9, '#b48cf2', 0)}${butterfly(260, 860, 0.9, '#ffd166', 0.6)}${butterfly(320, 640, 0.7, '#ff9eb0', 0.3)}
    ${bird(200, 120, 0.9, '#5b6b7a', 0)}${bird(230, 140, 0.7, '#5b6b7a', 0.5)}${Array.from({ length: 8 }, (_, i) => flower(20 + i * 50, 1040, 1.1, i % 2 ? '#fff' : '#ffd3de')).join('')}`,
  // Pasar
  () => `${cidomo(70, 1000, 0.8)}${scooter(300, 1040, 1, '#ff7a8a', true)}${scooter(60, 470, 0.9, '#7cc65c')}
    ${sack(330, 300, 1.1)}${sack(355, 310, 0.9)}${sack(70, 860, 1)}
    ${[60, 120, 180, 240, 300, 350].map((x, i) => lantern(x, 120 + (i % 2) * 10, ['#ef6c4d', '#ffd166', '#7cc6f2'][i % 3])).join('')}
    ${cat(330, 700, 0.8)}${chicken(250, 960, 0.8)}${pebbles(20, 150, 260, 150, 1000, 9, '#f4c9d4')}`,
  // Sawah
  () => `${duckRow(200, 420, 4, 1)}${duckRow(280, 820, 3, 0.9)}${scarecrow(330, 600, 1)}${scarecrow(60, 300, 0.9)}
    <path d="M0,700 C120,690 260,720 ${W},700" stroke="#8fd3ea" stroke-width="10" fill="none" opacity=".8"/>
    ${dragonfly(120, 640, 1)}${dragonfly(300, 230, 0.9)}${bird(160, 100, 1, '#5b6b7a', 0)}${bird(200, 130, 0.8, '#5b6b7a', 0.4)}${butterfly(80, 980, 0.8, '#ffd166', 0.3)}`,
  // Hutan
  () => `${vine(110, 0, 180)}${vine(300, 0, 220)}${vine(70, 520, 150)}${vine(340, 600, 160)}${fireflies(18, 40, 360, 100, 1000, 3)}
    ${butterfly(150, 300, 0.9, '#7cc6f2', 0)}${butterfly(260, 760, 0.9, '#ffb347', 0.4)}${pebbles(16, 140, 260, 300, 1000, 10, '#b7d9bd')}
    ${mushroom(140, 980, 1.1)}${mushroom(270, 420, 1)}${bush(200, 1060, 1.4, '#6bbd7c')}`,
  // Sendang Gile
  () => `${rainbow(80, 360, 100)}<g class="a-flow">${[64, 74, 84, 92].map((x) => `<line x1="${x}" y1="60" x2="${x}" y2="90" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`).join('')}</g>
    ${fireflies(10, 30, 170, 360, 440, 4)}${lily(200, 640, 1, true)}${lily(250, 720, 0.9)}${lily(290, 900, 1, true)}${g(200, 636, 0.5, ART_FROG)}
    ${bird(250, 140, 1, '#4fa8de', 0)}${dragonfly(300, 820, 0.9)}${butterfly(330, 420, 0.8, '#ff9eb0', 0.2)}${fern(170, 470, 1)}`,
  // Pos Pendakian
  () => `${Array.from({ length: 7 }, (_, i) => edelweiss(30 + (i % 2) * 330 + (i % 3) * 14, 170 + i * 130, 1.1)).join('')}
    ${backpack(70, 430, 1, '#7cc65c')}${backpack(290, 600, 0.9, '#ffd166')}${thiefMonkey(95, 440, 1.1)}${thiefMonkey(300, 980, 0.9)}
    ${smoke(140, 385, 0.8)}${bird(250, 120, 1.2, '#5b6b7a', 0)}${pebbles(24, 120, 280, 200, 1000, 11, '#c4ccd8')}`,
  // Segara Anak
  () => `${fishJump(150, 520, 1)}${fishJump(260, 680, 0.9)}${rod(330, 760, 1)}${smoke(358, 548, 1.1)}${smoke(60, 970, 0.9)}
    ${lily(120, 640, 0.9)}${lily(280, 450, 0.8, true)}${duckRow(230, 600, 3, 0.8)}
    ${tufts([[40, 400], [360, 380], [30, 760], [370, 820]], '#8fbf7a')}${bird(150, 150, 1, '#5b6b7a', 0)}${bird(190, 175, 0.8, '#5b6b7a', 0.4)}`,
  // Puncak
  () => `${sunrise(330, 160, 40)}${summitSign(70, 200, 1.1)}${Array.from({ length: 5 }, (_, i) => edelweiss(i % 2 ? 360 : 40, 300 + i * 130, 1)).join('')}
    ${bird(150, 120, 1.4, '#5b6b7a', 0)}<g class="a-wave">${cloud(200, 900, 1.4)}</g><g class="a-wave-r">${cloud(80, 860, 1)}</g>${fireflies(10, 40, 360, 80, 700, 6)}`,
];

const cache = {};
export function landscape(zi) {
  return (cache[zi] ||= `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">${SCENES[zi]()}${EXTRA[zi]()}</svg>`);
}
