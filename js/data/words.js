// Petit dictionnaire anglais → indonésien pour la lecture, avec un domaine par mot.
// Les formes (jumps, jumped, went…) sont ramenées à leur base avant la recherche.
import { EN_ALL } from './english.js';
import { VERBS } from './grammar.js';

export const DOMAINS = [
  { k: 'an', icon: '🐾', id: 'Binatang', en: 'Animals' },
  { k: 'fa', icon: '👨‍👩‍👧', id: 'Orang & keluarga', en: 'People & family' },
  { k: 'bo', icon: '🖐️', id: 'Tubuh', en: 'Body' },
  { k: 'fo', icon: '🍚', id: 'Makanan', en: 'Food' },
  { k: 'na', icon: '🌋', id: 'Alam', en: 'Nature' },
  { k: 'pl', icon: '🏠', id: 'Tempat & benda', en: 'Places & things' },
  { k: 'ac', icon: '⚡', id: 'Kata kerja', en: 'Action words' },
  { k: 'de', icon: '🌈', id: 'Sifat & perasaan', en: 'Describing & feelings' },
  { k: 'ti', icon: '⏰', id: 'Waktu & angka', en: 'Time & numbers' },
  { k: 'sm', icon: '🔤', id: 'Kata kecil', en: 'Little words' },
  { k: 'ot', icon: '✨', id: 'Lainnya', en: 'Other' },
];
export const DOMAIN = Object.fromEntries(DOMAINS.map((d) => [d.k, d]));

// [indonésien, domaine]
const CORE = {
  // Petits mots
  a: ['sebuah, seekor, seorang', 'sm'], an: ['sebuah, seekor', 'sm'], the: ['(kata sandang) itu', 'sm'], and: ['dan', 'sm'], but: ['tetapi', 'sm'],
  i: ['aku, saya', 'sm'], you: ['kamu', 'sm'], he: ['dia (laki-laki)', 'sm'], she: ['dia (perempuan)', 'sm'], it: ['itu, dia (benda)', 'sm'],
  we: ['kami, kita', 'sm'], they: ['mereka', 'sm'], them: ['mereka', 'sm'], my: ['-ku (milikku)', 'sm'], your: ['-mu (milikmu)', 'sm'],
  his: ['-nya (milik dia, laki-laki)', 'sm'], her: ['dia, -nya (perempuan)', 'sm'], their: ['milik mereka', 'sm'], our: ['milik kita', 'sm'],
  how: ['bagaimana', 'sm'], what: ['apa', 'sm'], up: ['ke atas', 'sm'], down: ['ke bawah', 'sm'], above: ['di atas', 'sm'], in: ['di dalam', 'sm'],
  on: ['di atas, pada', 'sm'], at: ['di, ke', 'sm'], to: ['ke, untuk', 'sm'], into: ['ke dalam', 'sm'], from: ['dari', 'sm'], of: ['dari, milik', 'sm'],
  for: ['untuk', 'sm'], with: ['dengan', 'sm'], near: ['dekat', 'sm'], across: ['menyeberangi', 'sm'], away: ['pergi, jauh', 'sm'],
  so: ['sangat, begitu', 'sm'], very: ['sangat', 'sm'], like: ['seperti; suka', 'sm'], not: ['tidak, bukan', 'sm'], all: ['semua', 'sm'],
  much: ['banyak, sangat', 'sm'], each: ['masing-masing', 'sm'], other: ['lain', 'sm'], this: ['ini', 'sm'], here: ['di sini', 'sm'],
  there: ['di sana; ada', 'sm'], everywhere: ['di mana-mana', 'sm'], left: ['kiri', 'sm'], right: ['kanan', 'sm'], please: ['tolong', 'sm'],
  must: ['harus', 'sm'], too: ['juga', 'sm'], "let's": ['ayo', 'sm'], when: ['ketika, kalau', 'sm'],
  // Actions
  be: ['adalah, berada (am / is / are)', 'ac'], have: ['punya', 'ac'], do: ['melakukan', 'ac'], twinkle: ['berkelip', 'ac'], wonder: ['ingin tahu', 'ac'],
  row: ['mendayung', 'ac'], see: ['melihat', 'ac'], live: ['tinggal, hidup', 'ac'], want: ['ingin, mau', 'ac'], count: ['menghitung', 'ac'],
  say: ['berkata', 'ac'], make: ['membuat', 'ac'], jump: ['melompat', 'ac'], eat: ['makan', 'ac'], thank: ['berterima kasih', 'ac'],
  laugh: ['tertawa', 'ac'], marry: ['menikah', 'ac'], fight: ['berkelahi', 'ac'], go: ['pergi', 'ac'], look: ['melihat', 'ac'],
  love: ['sayang, cinta', 'ac'], disappear: ['menghilang', 'ac'], call: ['memanggil, menyebut', 'ac'], give: ['memberi', 'ac'],
  come: ['datang', 'ac'], take: ['mengambil', 'ac'], run: ['berlari', 'ac'], throw: ['melempar', 'ac'], grow: ['tumbuh', 'ac'],
  can: ['bisa', 'ac'], will: ['akan', 'ac'], cry: ['menangis', 'ac'], become: ['menjadi', 'ac'], remember: ['ingat', 'ac'],
  respect: ['menghormati', 'ac'], care: ['merawat (take care = menjaga)', 'ac'], climb: ['mendaki, memanjat', 'ac'],
  // Corps
  head: ['kepala', 'bo'], shoulder: ['bahu, pundak', 'bo'], knee: ['lutut', 'bo'], toe: ['jari kaki', 'bo'], eye: ['mata', 'bo'],
  ear: ['telinga', 'bo'], mouth: ['mulut', 'bo'], nose: ['hidung', 'bo'], back: ['punggung; kembali', 'bo'],
  // Nature
  star: ['bintang', 'na'], world: ['dunia', 'na'], sky: ['langit', 'na'], stream: ['sungai kecil', 'na'], mountain: ['gunung', 'na'],
  top: ['puncak', 'na'], tree: ['pohon', 'na'], forest: ['hutan', 'na'], river: ['sungai', 'na'], beach: ['pantai', 'na'], sea: ['laut', 'na'],
  bamboo: ['bambu', 'na'], mud: ['lumpur', 'na'], storm: ['badai', 'na'], stone: ['batu', 'na'], lake: ['danau', 'na'], island: ['pulau', 'na'],
  rinjani: ['Rinjani (gunung di Lombok)', 'na'],
  // Lieux et objets
  diamond: ['berlian', 'pl'], boat: ['perahu', 'pl'], farm: ['peternakan, kebun', 'pl'], side: ['sisi, seberang', 'pl'], bag: ['tas, kantong', 'pl'],
  needle: ['jarum', 'pl'], home: ['rumah', 'pl'], ship: ['kapal', 'pl'], rubbish: ['sampah', 'pl'], lombok: ['Lombok (pulau kita)', 'pl'],
  // Animaux
  cow: ['sapi', 'an'], duck: ['bebek', 'an'], moo: ['(suara sapi)', 'an'], quack: ['(suara bebek)', 'an'], mouse: ['tikus', 'an'],
  deer: ['rusa', 'an'], crocodile: ['buaya', 'an'], worm: ['cacing', 'an'], animal: ['binatang', 'an'], kancil: ['kancil, pelanduk', 'an'],
  nyale: ['nyale (cacing laut)', 'an'],
  // Gens
  king: ['raja', 'fa'], princess: ['putri', 'fa'], prince: ['pangeran', 'fa'], people: ['orang-orang', 'fa'], woman: ['perempuan, ibu', 'fa'],
  child: ['anak', 'fa'], giant: ['raksasa', 'fa'], baby: ['bayi', 'fa'], girl: ['anak perempuan', 'fa'], mother: ['ibu', 'fa'],
  wife: ['istri', 'fa'], son: ['anak laki-laki', 'fa'], queen: ['ratu', 'fa'], dewi: ['dewi', 'fa'], anjani: ['Anjani (nama)', 'fa'],
  malin: ['Malin (nama)', 'fa'], mandalika: ['Mandalika (nama)', 'fa'], macdonald: ['MacDonald (nama)', 'fa'], timun: ['timun, mentimun', 'fo'],
  // Nourriture
  fruit: ['buah', 'fo'], cucumber: ['mentimun', 'fo'], seed: ['biji', 'fo'], salt: ['garam', 'fo'], shrimp: ['udang', 'fo'], paste: ['pasta (terasi)', 'fo'],
  // Description
  little: ['kecil', 'de'], high: ['tinggi', 'de'], gently: ['pelan-pelan, lembut', 'de'], merrily: ['dengan gembira', 'de'], green: ['hijau', 'de'],
  old: ['tua', 'de'], small: ['kecil', 'de'], hungry: ['lapar', 'de'], sweet: ['manis', 'de'], big: ['besar', 'de'], clever: ['cerdik', 'de'],
  long: ['panjang', 'de'], angry: ['marah', 'de'], happy: ['senang', 'de'], beautiful: ['cantik, indah', 'de'], kind: ['baik hati', 'de'],
  smart: ['pintar', 'de'], friendly: ['ramah', 'de'], colorful: ['berwarna-warni', 'de'], golden: ['emas, keemasan', 'de'], mas: ['emas', 'de'],
  sad: ['sedih', 'de'], tall: ['tinggi', 'de'], hot: ['panas', 'de'], happily: ['dengan bahagia', 'de'], poor: ['miskin', 'de'], rich: ['kaya', 'de'],
  strong: ['kuat', 'de'], blue: ['biru', 'de'], polite: ['sopan', 'de'], safe: ['aman', 'de'],
  // Temps et nombres
  one: ['satu', 'ti'], two: ['dua', 'ti'], three: ['tiga', 'ti'], four: ['empat', 'ti'], five: ['lima', 'ti'], many: ['banyak', 'ti'],
  day: ['hari', 'ti'], time: ['waktu', 'ti'], ago: ['yang lalu', 'ti'], then: ['lalu', 'ti'], next: ['berikutnya', 'ti'], morning: ['pagi', 'ti'],
  every: ['setiap', 'ti'], year: ['tahun', 'ti'], later: ['kemudian', 'ti'], always: ['selalu', 'ti'],
  // Ajouts : nouvelles chansons et légendes
  if: ['kalau, jika', 'sm'], "you're": ['kamu (adalah)', 'sm'], surely: ['pasti', 'sm'], out: ['keluar', 'sm'], again: ['lagi', 'sm'], me: ['aku (objek)', 'sm'],
  anyone: ['siapa pun', 'sm'], more: ['lebih, makin banyak', 'sm'], only: ['hanya', 'sm'], never: ['tidak pernah', 'ti'], night: ['malam', 'ti'],
  clap: ['bertepuk', 'ac'], show: ['menunjukkan', 'ac'], stamp: ['menghentakkan (kaki)', 'ac'], dry: ['mengeringkan; kering', 'ac'], clean: ['membersihkan', 'ac'],
  fall: ['jatuh', 'ac'], find: ['mencari, menemukan', 'ac'], move: ['bergerak, pindah', 'ac'], push: ['mendorong', 'ac'], put: ['menaruh, memasukkan', 'ac'],
  catch: ['menangkap', 'ac'], shout: ['berteriak', 'ac'], keep: ['menepati, menyimpan', 'ac'], wash: ['mencuci', 'ac'], walk: ['berjalan', 'ac'],
  help: ['menolong', 'ac'], ask: ['meminta, bertanya', 'ac'], open: ['membuka', 'ac'], speak: ['berbicara', 'ac'], sit: ['duduk', 'ac'],
  face: ['wajah', 'bo'], tooth: ['gigi', 'bo'], spider: ['laba-laba', 'an'], cockatoo: ['burung kakatua', 'an'], snake: ['ular', 'an'], fish: ['ikan', 'an'], dog: ['anjing', 'an'],
  rain: ['hujan', 'na'], sun: ['matahari', 'na'], ground: ['tanah', 'na'], toba: ['Toba (danau di Sumatra)', 'na'],
  spout: ['pipa air, talang', 'pl'], house: ['rumah', 'pl'], clothes: ['baju, pakaian', 'pl'], shirt: ['baju, kemeja', 'pl'], way: ['jalan', 'pl'],
  gold: ['emas', 'pl'], garden: ['kebun', 'pl'], scarecrow: ['orang-orangan sawah', 'pl'], glue: ['lem', 'pl'], cage: ['kandang', 'pl'], window: ['jendela', 'pl'],
  stepmother: ['ibu tiri', 'fa'], farmer: ['petani', 'fa'], samosir: ['Samosir (nama)', 'fa'], grandmother: ['nenek', 'fa'], father: ['ayah', 'fa'], sister: ['saudara perempuan', 'fa'],
  bawang: ['bawang', 'fo'], pumpkin: ['labu', 'fo'], lunch: ['makan siang', 'fo'], water: ['air', 'fo'],
  itsy: ['kecil sekali', 'de'], bitsy: ['kecil sekali', 'de'], putih: ['putih', 'de'], merah: ['merah', 'de'], lazy: ['malas', 'de'], nice: ['baik, menyenangkan', 'de'],
  full: ['penuh', 'de'], honest: ['jujur', 'de'], sticky: ['lengket', 'de'], stuck: ['menempel, tersangkut', 'de'], red: ['merah', 'de'],
  la: ['(bunyi lagu)', 'ot'], oh: ['oh, aduh', 'ot'], party: ['pesta', 'ot'], promise: ['janji', 'ot'], hello: ['halo', 'ot'],
  // Ajouts : Gagak dan Rubah, Keong Mas, Lutung Kasarung
  who: ['yang, siapa', 'sm'], than: ['daripada', 'sm'], under: ['di bawah', 'sm'], everyone: ['semua orang', 'sm'], "don't": ['jangan, tidak', 'sm'],
  sing: ['bernyanyi', 'ac'], believe: ['percaya', 'ac'], hide: ['bersembunyi', 'ac'], stop: ['berhenti', 'ac'], send: ['mengirim, menyuruh pergi', 'ac'],
  meet: ['bertemu', 'ac'], pray: ['berdoa', 'ac'], cook: ['memasak', 'ac'], watch: ['menonton, mengamati', 'ac'],
  crow: ['burung gagak', 'an'], fox: ['rubah', 'an'], snail: ['keong, siput', 'an'], monkey: ['monyet, lutung', 'an'], lutung: ['lutung (monyet hitam)', 'an'],
  beak: ['paruh', 'bo'], feather: ['bulu (burung)', 'bo'], voice: ['suara', 'bo'], heart: ['hati, jantung', 'bo'],
  cheese: ['keju', 'fo'], food: ['makanan', 'fo'],
  branch: ['dahan, cabang', 'na'], moon: ['bulan', 'na'], pool: ['kolam', 'na'],
  piece: ['sepotong, bagian', 'pl'], jar: ['guci, toples', 'pl'], table: ['meja', 'pl'], thing: ['barang, hal', 'pl'],
  witch: ['penyihir', 'fa'], candra: ['Candra (nama)', 'fa'], kirana: ['Kirana (nama)', 'fa'], purbasari: ['Purbasari (nama)', 'fa'], purbararang: ['Purbararang (nama)', 'fa'], kasarung: ['Kasarung (nama)', 'fa'],
  shiny: ['berkilau', 'de'], lovely: ['indah, merdu', 'de'], proud: ['bangga', 'de'], jealous: ['iri', 'de'], bad: ['jahat, buruk', 'de'], delicious: ['enak, lezat', 'de'],
  gentle: ['lembut', 'de'], handsome: ['tampan', 'de'], sorry: ['maaf', 'de'], good: ['baik', 'de'], black: ['hitam', 'de'], surprised: ['terkejut', 'de'],
  song: ['lagu', 'ot'], caw: ['(suara gagak)', 'an'], magic: ['sihir', 'ot'], friend: ['teman', 'fa'],
  // Autres
  life: ['hidup, kehidupan', 'ot'], dream: ['mimpi', 'ot'], idea: ['ide', 'ot'], line: ['barisan, garis', 'ot'], name: ['nama', 'ot'],
  festival: ['festival, pesta', 'ot'], bau: ['Bau (menangkap, bahasa Sasak)', 'ot'], 'e-i-e-i-o': ['(bunyi lagu)', 'ot'],
};

// Formes irrégulières → base.
const IRREG = {
  am: 'be', is: 'be', are: 'be', was: 'be', were: 'be', has: 'have', had: 'have', did: 'do', does: 'do', went: 'go', came: 'come',
  saw: 'see', said: 'say', says: 'say', gave: 'give', ran: 'run', threw: 'throw', grew: 'grow', became: 'become', could: 'can',
  took: 'take', ate: 'eat', fell: 'fall', found: 'find', caught: 'catch', spoke: 'speak', sat: 'sit', made: 'make', put: 'put', hid: 'hide', sent: 'send', met: 'meet', children: 'child', people: 'people', women: 'woman', mice: 'mouse', feet: 'foot', teeth: 'tooth',
};

// Mots des leçons (domaine selon la leçon) et des 50 verbes.
const LESSON_DOMAIN = { 'en-animals': 'an', 'en-family': 'fa', 'en-body': 'bo', 'en-food': 'fo', 'en-colors': 'de', 'en-numbers': 'ti', 'en-school': 'pl', 'en-feelings': 'de', 'en-pronouns': 'sm', 'en-intro': 'fa', 'en-hobbies': 'ac' };
const DICT = { ...CORE };
EN_ALL.forEach((l) => l.vocab.forEach((w) => {
  const k = w.en.toLowerCase();
  if (!DICT[k] && /^[a-z']+$/.test(k)) DICT[k] = [w.id, LESSON_DOMAIN[l.id] || 'ot'];
}));
const FORMS = {};
VERBS.forEach((v) => {
  if (!DICT[v.base] && /^[a-z]+$/.test(v.base)) DICT[v.base] = [v.id, 'ac'];
  [v.he, v.ing, ...v.past.split(' / ')].forEach((f) => { if (/^[a-z]+$/.test(f) && !DICT[f]) FORMS[f] = v.base; });
});

export const clean = (t) => t.toLowerCase().replace(/[’]/g, "'").replace(/^[^a-z]+|[^a-z]+$/g, '');

// Ramène un mot à une entrée du dictionnaire : { word, base, id, d }
export function lookup(raw) {
  const w = clean(raw);
  if (!w) return null;
  const tries = [w, IRREG[w], FORMS[w]];
  if (w.endsWith("'s")) tries.push(w.slice(0, -2));
  if (w.endsWith('ies')) tries.push(w.slice(0, -3) + 'y');
  if (w.endsWith('ied')) tries.push(w.slice(0, -3) + 'y');
  if (w.endsWith('s')) tries.push(w.slice(0, -1));
  if (w.endsWith('es')) tries.push(w.slice(0, -2));
  if (w.endsWith('ed')) tries.push(w.slice(0, -2), w.slice(0, -1), w.slice(0, -3));
  if (w.endsWith('ing')) tries.push(w.slice(0, -3), w.slice(0, -3) + 'e', w.slice(0, -4));
  if (w.endsWith('ly')) tries.push(w.slice(0, -2));
  const base = tries.find((t) => t && DICT[t]);
  return base ? { word: w, base, id: DICT[base][0], d: DICT[base][1] } : null;
}

// Découpe une ligne en mots touchables (le reste : ponctuation, espaces).
export const tokens = (line) => line.split(/(\s+)/).map((t) => ({ t, w: /[a-z]/i.test(t) ? clean(t) : null }));
