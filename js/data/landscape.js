// Paysages de chaque zone de l'île, inspirés de Lombok. Un SVG par zone (viewBox 400 × 1060),
// les éléments hauts restent sur les bords pour laisser le sentier lisible au centre.
import { face } from './decor.js';

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

const cache = {};
export function landscape(zi) {
  return (cache[zi] ||= `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">${SCENES[zi]()}</svg>`);
}
