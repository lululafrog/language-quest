// Album d'autocollants : 20 dessins kawaii de Lombok, débloqués tous les 15 étoiles.
import { face } from './decor.js';

const S = (body) => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
const shine = (x, y, r = 5) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.6}" fill="#fff" opacity=".55" transform="rotate(-30 ${x} ${y})"/>`;

export const STICKER_ART = [
  { id: 'Penyu', en: 'Sea turtle', svg: S(`<ellipse cx="22" cy="70" rx="10" ry="7" fill="#7ccf7a"/><ellipse cx="78" cy="70" rx="10" ry="7" fill="#7ccf7a"/><ellipse cx="26" cy="36" rx="10" ry="7" fill="#7ccf7a"/><ellipse cx="74" cy="36" rx="10" ry="7" fill="#7ccf7a"/>
    <circle cx="50" cy="20" r="13" fill="#8fd18c"/>${face(50, 20, 15)}<ellipse cx="50" cy="56" rx="30" ry="26" fill="#4e9e6a"/><path d="M38,44 L50,36 L62,44 L62,60 L50,68 L38,60 Z" fill="#6bbf6a"/><path d="M50,36 L50,30 M62,44 L74,40 M62,60 L74,66 M38,60 L26,66 M38,44 L26,40 M50,68 L50,80" stroke="#6bbf6a" stroke-width="3"/>${shine(36, 46)}`) },
  { id: 'Bunga kamboja', en: 'Frangipani', svg: S(`${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="50" cy="26" rx="15" ry="24" fill="#fff" stroke="#f6c9d6" stroke-width="2" transform="rotate(${a} 50 50)"/><ellipse cx="50" cy="36" rx="7" ry="10" fill="#ffe27a" opacity=".8" transform="rotate(${a} 50 50)"/>`).join('')}
    <circle cx="50" cy="50" r="12" fill="#ffd166"/>${face(50, 50, 14, { happy: true })}`) },
  { id: 'Mangga', en: 'Mango', svg: S(`<path d="M50,92 C20,92 12,62 22,40 C32,20 64,12 80,32 C92,50 84,92 50,92 Z" fill="#ffb347"/><path d="M50,92 C30,90 22,74 26,58 C40,70 60,74 82,66 C78,82 66,92 50,92 Z" fill="#ff8f3f" opacity=".6"/>
    <path d="M62,20 C68,8 80,6 88,10 C80,16 72,20 66,26 Z" fill="#5cc27a"/>${face(50, 58, 30)}${shine(34, 40, 7)}`) },
  { id: 'Pohon kelapa', en: 'Palm tree', svg: S(`<ellipse cx="50" cy="92" rx="30" ry="6" fill="#fbe3b0"/><path d="M52,92 C48,70 56,50 50,34" stroke="#b07a4f" stroke-width="10" fill="none" stroke-linecap="round"/>
    <path d="M50,34 C34,20 14,24 6,38 C24,32 36,32 50,34 Z M50,34 C66,18 86,22 94,36 C76,31 62,32 50,34 Z M50,34 C40,14 48,4 62,2 C54,14 54,24 50,34 Z M50,34 C62,40 74,52 74,66 C64,52 56,44 50,34 Z M50,34 C38,42 26,54 26,68 C36,54 44,44 50,34 Z" fill="#5cc27a"/>
    <circle cx="45" cy="38" r="6" fill="#8a5a3b"/><circle cx="56" cy="39" r="6" fill="#9a6a43"/>${face(52, 66, 14)}`) },
  { id: 'Monyet', en: 'Monkey', svg: S(`<circle cx="20" cy="44" r="12" fill="#a8774e"/><circle cx="80" cy="44" r="12" fill="#a8774e"/><circle cx="20" cy="44" r="6" fill="#f2d2b0"/><circle cx="80" cy="44" r="6" fill="#f2d2b0"/>
    <circle cx="50" cy="48" r="32" fill="#a8774e"/><path d="M28,52 C28,34 72,34 72,52 C72,74 28,74 28,52 Z" fill="#f2d2b0"/>${face(50, 54, 30)}<path d="M40,22 Q50,10 60,22" stroke="#8a5a3b" stroke-width="4" fill="none" stroke-linecap="round"/>`) },
  { id: 'Kupu-kupu', en: 'Butterfly', svg: S(`<ellipse cx="28" cy="36" rx="22" ry="24" fill="#b48cf2"/><ellipse cx="72" cy="36" rx="22" ry="24" fill="#b48cf2"/><ellipse cx="32" cy="72" rx="15" ry="17" fill="#ff9eb0"/><ellipse cx="68" cy="72" rx="15" ry="17" fill="#ff9eb0"/>
    <circle cx="26" cy="34" r="7" fill="#fff" opacity=".6"/><circle cx="74" cy="34" r="7" fill="#fff" opacity=".6"/><rect x="43" y="26" width="14" height="56" rx="7" fill="#5b4a8a"/>
    <path d="M46,26 Q40,10 32,8 M54,26 Q60,10 68,8" stroke="#5b4a8a" stroke-width="3" fill="none" stroke-linecap="round"/>${face(50, 40, 12)}`) },
  { id: 'Lumba-lumba', en: 'Dolphin', svg: S(`<path d="M14,64 C18,34 46,18 70,26 C84,30 92,40 90,48 L76,46 C70,62 50,76 28,76 Z" fill="#7cc6f2"/><path d="M48,26 C48,14 56,8 62,8 C60,16 60,22 62,28 Z" fill="#5ab0e4"/>
    <path d="M28,76 C20,84 10,86 6,84 C10,78 14,72 20,70 Z" fill="#5ab0e4"/><path d="M30,66 C44,72 62,66 74,52" fill="#e6f4fb"/>${face(70, 38, 14)}${shine(44, 40, 6)}
    <circle cx="16" cy="30" r="4" fill="#bfe7f5"/><circle cx="10" cy="20" r="3" fill="#bfe7f5"/>`) },
  { id: 'Gunung Rinjani', en: 'Mount Rinjani', svg: S(`<path d="M4,86 C20,70 32,44 50,20 C68,44 80,70 96,86 Z" fill="#b39486"/><path d="M38,36 C44,26 48,22 50,20 C54,24 58,28 62,36 C58,34 54,40 50,36 C46,40 42,34 38,36 Z" fill="#fff"/>
    ${face(50, 60, 26)}<ellipse cx="72" cy="78" rx="12" ry="4" fill="#8fd3ea"/><path d="M4,86 C30,76 70,90 96,82 L96,92 L4,92 Z" fill="#9fdc9a"/><line x1="50" y1="20" x2="50" y2="6" stroke="#4a3428" stroke-width="2.5"/><path d="M50,6 L62,10 L50,14 Z" fill="#ff7a8a"/>`) },
  { id: 'Pulau Gili', en: 'Gili island', svg: S(`<ellipse cx="50" cy="78" rx="46" ry="16" fill="#8fd3ea"/><ellipse cx="50" cy="70" rx="30" ry="12" fill="#fbe3b0"/>${face(42, 70, 16, { happy: true })}
    <path d="M62,68 C60,54 64,44 60,34" stroke="#b07a4f" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M60,34 C50,26 40,28 36,36 C46,32 52,32 60,34 Z M60,34 C70,24 80,26 84,34 C74,31 66,32 60,34 Z M60,34 C56,22 60,16 68,14 C64,22 62,28 60,34 Z" fill="#5cc27a"/>
    <circle cx="20" cy="30" r="12" fill="#ffd95e"/>`) },
  { id: 'Jukung', en: 'Outrigger boat', svg: S(`<path d="M10,64 C30,80 70,80 90,64 L80,56 L20,56 Z" fill="#ef6c4d"/><path d="M20,56 L80,56 L76,62 L24,62 Z" fill="#ffd166"/><line x1="4" y1="74" x2="96" y2="74" stroke="#8a5a3b" stroke-width="4"/>
    <path d="M30,56 Q50,40 70,56" stroke="#8a5a3b" stroke-width="3" fill="none"/><line x1="50" y1="56" x2="50" y2="10" stroke="#8a5a3b" stroke-width="3"/><path d="M52,12 L82,50 L52,50 Z" fill="#fff" stroke="#f0e6d8" stroke-width="2"/>${face(50, 66, 16)}
    <path d="M0,86 q12,-6 25,0 t25,0 t25,0 t25,0" stroke="#8fd3ea" stroke-width="4" fill="none"/>`) },
  { id: 'Ikan badut', en: 'Clownfish', svg: S(`<path d="M86,50 L98,34 L98,66 Z" fill="#ff8f3f"/><ellipse cx="50" cy="50" rx="38" ry="26" fill="#ff8f3f"/><path d="M34,26 C30,40 30,60 34,74 L44,74 C40,60 40,40 44,26 Z M60,26 C56,40 56,60 60,74 L68,72 C64,58 64,42 68,28 Z" fill="#fff"/>
    <path d="M34,26 L44,26 M34,74 L44,74" stroke="#4a3428" stroke-width="2"/>${face(24, 46, 14)}<path d="M50,24 C54,14 62,12 68,16 C62,18 58,22 56,26 Z" fill="#ff8f3f"/>`) },
  { id: 'Burung kakatua', en: 'Cockatoo', svg: S(`<path d="M50,20 C44,4 56,0 54,14 C60,2 70,6 60,18 C70,12 74,22 62,24 Z" fill="#ffe27a"/><ellipse cx="50" cy="56" rx="26" ry="32" fill="#fff" stroke="#eee" stroke-width="2"/>
    <ellipse cx="34" cy="62" rx="10" ry="18" fill="#f3f3f3" transform="rotate(15 34 62)"/>${face(50, 44, 22)}<path d="M50,52 C46,52 44,58 50,62 C56,58 54,52 50,52 Z" fill="#4a3428"/><path d="M42,86 L40,94 M58,86 L60,94" stroke="#9a9a9a" stroke-width="3" stroke-linecap="round"/>`) },
  { id: 'Nanas', en: 'Pineapple', svg: S(`<path d="M50,26 L38,4 L48,14 L50,2 L54,14 L64,4 Z" fill="#5cc27a"/><ellipse cx="50" cy="60" rx="26" ry="32" fill="#ffd166"/>
    <path d="M28,46 L72,78 M28,62 L60,88 M34,34 L72,62 M72,46 L28,78 M72,62 L40,88 M66,34 L28,62" stroke="#f2b33d" stroke-width="2.5"/>${face(50, 60, 28)}`) },
  { id: 'Kelapa', en: 'Coconut', svg: S(`<circle cx="50" cy="56" r="36" fill="#9a6a43"/><circle cx="50" cy="56" r="28" fill="#fff6e8"/><circle cx="50" cy="56" r="20" fill="#dff3f9" opacity=".6"/>
    <path d="M60,18 L72,4 M60,18 L80,16" stroke="#5cc27a" stroke-width="6" stroke-linecap="round"/><line x1="64" y1="8" x2="56" y2="36" stroke="#ff7a8a" stroke-width="4" stroke-linecap="round"/>${face(46, 58, 26)}`) },
  { id: 'Matahari terbit', en: 'Sunrise', svg: S(`<g stroke="#ffc94a" stroke-width="6" stroke-linecap="round">${Array.from({ length: 7 }, (_, i) => { const a = Math.PI + (i * Math.PI) / 6; return `<line x1="${50 + Math.cos(a) * 34}" y1="${66 + Math.sin(a) * 34}" x2="${50 + Math.cos(a) * 46}" y2="${66 + Math.sin(a) * 46}"/>`; }).join('')}</g>
    <path d="M22,66 A28,28 0 0 1 78,66 Z" fill="#ffb347"/>${face(50, 54, 26)}<path d="M4,66 L96,66" stroke="#8fd3ea" stroke-width="6" stroke-linecap="round"/><path d="M14,78 q10,-6 20,0 t20,0 t20,0 t20,0" stroke="#8fd3ea" stroke-width="5" fill="none" stroke-linecap="round"/>`) },
  { id: 'Kerang', en: 'Seashell', svg: S(`<path d="M50,90 C18,88 6,58 12,36 C28,14 72,14 88,36 C94,58 82,88 50,90 Z" fill="#ffd3de" stroke="#f3a8bb" stroke-width="3"/>
    ${[26, 38, 50, 62, 74].map((x) => `<path d="M50,88 Q${x},55 ${x + (x < 50 ? -6 : x > 50 ? 6 : 0)},26" stroke="#f3a8bb" stroke-width="3" fill="none"/>`).join('')}<rect x="38" y="84" width="24" height="10" rx="4" fill="#f3a8bb"/>${face(50, 58, 22, { happy: true })}`) },
  { id: 'Kepiting', en: 'Crab', svg: S(`<path d="M14,40 C4,28 8,14 18,14 C16,24 20,30 26,34 Z M86,40 C96,28 92,14 82,14 C84,24 80,30 74,34 Z" fill="#ff7a6b"/>
    <path d="M22,62 L8,72 M26,70 L14,82 M78,62 L92,72 M74,70 L86,82" stroke="#ff7a6b" stroke-width="6" stroke-linecap="round"/><ellipse cx="50" cy="56" rx="32" ry="24" fill="#ff7a6b"/>
    <line x1="40" y1="34" x2="38" y2="22" stroke="#ff7a6b" stroke-width="4"/><line x1="60" y1="34" x2="62" y2="22" stroke="#ff7a6b" stroke-width="4"/><circle cx="38" cy="20" r="6" fill="#fff"/><circle cx="62" cy="20" r="6" fill="#fff"/><circle cx="38" cy="20" r="3" fill="#4a3428"/><circle cx="62" cy="20" r="3" fill="#4a3428"/>
    <ellipse cx="34" cy="62" rx="5" ry="3" fill="#ff9eb0"/><ellipse cx="66" cy="62" rx="5" ry="3" fill="#ff9eb0"/><path d="M44,62 Q50,68 56,62" stroke="#4a3428" stroke-width="3" fill="none" stroke-linecap="round"/>`) },
  { id: 'Pelangi', en: 'Rainbow', svg: S(`${['#ff7a8a', '#ffb347', '#ffd166', '#7cc65c', '#7cc6f2', '#b48cf2'].map((c, i) => `<path d="M${10 + i * 5},70 A${40 - i * 5},${40 - i * 5} 0 0 1 ${90 - i * 5},70" stroke="${c}" stroke-width="6" fill="none"/>`).join('')}
    <g fill="#fff"><circle cx="14" cy="74" r="10"/><circle cx="26" cy="72" r="12"/><circle cx="76" cy="72" r="12"/><circle cx="88" cy="74" r="10"/></g>${face(26, 74, 12, { happy: true })}${face(76, 74, 12, { happy: true })}`) },
  { id: 'Mahkota Dewi Anjani', en: 'Dewi Anjani\'s crown', svg: S(`<path d="M12,76 L18,30 L34,52 L50,20 L66,52 L82,30 L88,76 Z" fill="#ffd166" stroke="#f2b33d" stroke-width="3" stroke-linejoin="round"/>
    <rect x="12" y="72" width="76" height="14" rx="5" fill="#f5b83d"/><circle cx="50" cy="20" r="6" fill="#ff7a8a"/><circle cx="18" cy="30" r="5" fill="#7cc6f2"/><circle cx="82" cy="30" r="5" fill="#7cc65c"/>
    <circle cx="30" cy="79" r="4" fill="#b48cf2"/><circle cx="50" cy="79" r="4" fill="#ff7a8a"/><circle cx="70" cy="79" r="4" fill="#7cc6f2"/>${face(50, 58, 20)}${shine(28, 56, 5)}`) },
  { id: 'Piala juara', en: 'Champion trophy', svg: S(`<path d="M24,18 C8,18 8,46 30,48 M76,18 C92,18 92,46 70,48" stroke="#f2b33d" stroke-width="6" fill="none"/><path d="M24,12 L76,12 L72,48 C68,62 32,62 28,48 Z" fill="#ffd166" stroke="#f2b33d" stroke-width="3"/>
    <rect x="44" y="60" width="12" height="14" fill="#f2b33d"/><rect x="30" y="74" width="40" height="14" rx="4" fill="#9a6a43"/><text x="50" y="85" font-size="9" text-anchor="middle" fill="#ffd166" font-family="sans-serif" font-weight="900">No.1</text>
    ${face(50, 32, 22)}<path d="M50,0 L53,6 L60,6 L54,10 L56,17 L50,13 L44,17 L46,10 L40,6 L47,6 Z" fill="#fff4b8"/>${shine(34, 22, 5)}`) },
];
