// Contenu « I teach English ». Chaque consigne : { en, id, fr }.
// Mot : [anglais, emoji, indonésien, français]
import { GRAMMAR_LESSONS } from './grammar.js';

// 5e colonne facultative : true si l'emoji n'illustre pas vraiment le mot.
const V = (rows, lessonId) => rows.map(([en, emoji, id, fr, abstract], i) => ({ key: `${lessonId}#${i}`, en, emoji, id, fr, ...(abstract ? { abstract } : {}) }));

export const EN_LESSONS = [
  {
    id: 'en-intro', n: 1, full: true, icon: '👋', title: 'Greetings & Introductions', level: 'A0', duration: 45,
    objective: {
      en: 'Students can say hello, say their name and age, and ask "What\'s your name?"',
      id: 'Murid bisa menyapa, menyebut nama dan umur, dan bertanya "What\'s your name?"',
      fr: 'Les élèves savent saluer, dire leur nom et leur âge, et demander « What\'s your name? »',
    },
    vocab: V([
      ['hello', '👋', 'halo', 'bonjour'],
      ['good morning', '🌅', 'selamat pagi', 'bonjour (le matin)'],
      ['goodbye', '🙋‍♀️', 'sampai jumpa', 'au revoir'],
      ['name', '🏷️', 'nama', 'nom'],
      ['friend', '🤝', 'teman', 'ami(e)'],
      ['teacher', '🧑‍🏫', 'guru', 'professeur'],
      ['student', '🧒', 'murid', 'élève'],
      ['girl', '👧', 'anak perempuan', 'fille'],
      ['boy', '👦', 'anak laki-laki', 'garçon'],
      ['thank you', '🙏', 'terima kasih', 'merci'],
      ['please', '🥺', 'tolong', 's\'il te plaît'],
      ['yes', '✅', 'ya', 'oui'],
      ['no', '❌', 'tidak', 'non'],
    ], 'en-intro'),
    sentences: [
      { en: 'Hello! My name is Rina.', id: 'Halo! Nama saya Rina.', fr: 'Bonjour ! Je m\'appelle Rina.' },
      { en: 'What\'s your name?', id: 'Siapa namamu?', fr: 'Comment tu t\'appelles ?' },
      { en: 'I am ten years old.', id: 'Saya berumur sepuluh tahun.', fr: 'J\'ai dix ans.' },
      { en: 'How are you? – I\'m fine, thank you.', id: 'Apa kabar? – Baik, terima kasih.', fr: 'Comment ça va ? – Bien, merci.' },
      { en: 'Nice to meet you!', id: 'Senang bertemu denganmu!', fr: 'Ravie de te rencontrer !' },
      { en: 'She is my friend.', id: 'Dia teman saya.', fr: 'C\'est mon amie.' },
    ],
    grammar: {
      title: 'TO BE : I am / You are / She is',
      rule: { en: 'I → am. You → are. He / She → is.', id: 'I → am. You → are. He / She → is. (Bahasa Indonesia tidak memakai "to be".)', fr: 'I → am. You → are. He / She → is. (L\'indonésien n\'a pas de verbe « être » : à bien montrer !)' },
      table: [['I', 'am', 'I\'m'], ['You', 'are', 'You\'re'], ['He', 'is', 'He\'s'], ['She', 'is', 'She\'s']],
      examples: ['I am Rina.', 'You are my friend.', 'She is ten.'],
    },
    exercises: [
      { type: 'fill', s: 'I ___ Rina.', opts: ['am', 'is', 'are'], a: 'am', why: { en: 'I → am', id: 'I selalu memakai "am".', fr: 'Avec I, on utilise toujours « am ».' } },
      { type: 'fill', s: 'She ___ my friend.', opts: ['am', 'is', 'are'], a: 'is', why: { en: 'She → is', id: 'She / He memakai "is".', fr: 'She / He → « is ».' } },
      { type: 'fill', s: 'You ___ a student.', opts: ['am', 'is', 'are'], a: 'are', why: { en: 'You → are', id: 'You memakai "are".', fr: 'You → « are ».' } },
      { type: 'fill', s: 'He ___ ten years old.', opts: ['am', 'is', 'are'], a: 'is', why: { en: 'He → is', id: 'He memakai "is".', fr: 'He → « is ».' } },
      { type: 'fill', s: 'My ___ is Dewi.', opts: ['name', 'friend', 'hello'], a: 'name', why: { en: 'My name is…', id: 'My name is… = Nama saya…', fr: 'My name is… = je m\'appelle…' } },
      { type: 'build', a: 'My name is Rina', fr: 'Je m\'appelle Rina.', id: 'Nama saya Rina.' },
      { type: 'build', a: 'I am ten years old', fr: 'J\'ai dix ans.', id: 'Saya berumur sepuluh tahun.' },
      { type: 'build', a: 'What is your name', fr: 'Comment tu t\'appelles ?', id: 'Siapa namamu?' },
    ],
    game: 'team',
    gameNote: { en: 'Team Challenge: each team answers "What\'s your name?" chains.', id: 'Tantangan tim: setiap tim menjawab pertanyaan.', fr: 'Team Challenge : questions de vocabulaire par équipe, chaque bonne réponse = 1 point.' },
    conversation: 'conv-name',
    steps: [
      { min: 5, en: 'Warm-up: wave and say "Hello!" to each student.', id: 'Pemanasan: lambaikan tangan dan bilang "Hello!"', fr: 'Échauffement : saluer chaque élève avec « Hello! » et un signe de la main.' },
      { min: 10, en: 'Vocabulary: show the cards, students repeat in chorus.', id: 'Kosakata: tunjukkan kartu, murid mengulang bersama.', fr: 'Vocabulaire : montrer les cartes, répétition en chœur.' },
      { min: 10, en: 'Grammar: I am / You are / She is.', id: 'Tata bahasa: I am / You are / She is.', fr: 'Grammaire : I am / You are / She is.' },
      { min: 10, en: 'Pair work: practise the conversation.', id: 'Kerja berpasangan: latihan percakapan.', fr: 'Travail en binômes : jouer la conversation.' },
      { min: 10, en: 'Team game + mini-test.', id: 'Permainan tim + tes kecil.', fr: 'Jeu par équipes + mini-test.' },
    ],
    tips: [
      { en: 'Start with chorus repetition: nobody speaks alone at first.', id: 'Mulai dengan mengulang bersama-sama.', fr: 'Commencer par la répétition en chœur : personne ne parle seule au début.' },
      { en: 'Let students answer in pairs before answering alone.', id: 'Biarkan murid menjawab berdua dulu.', fr: 'Laisser répondre à deux avant de répondre seule.' },
      { en: 'Use a soft toy or ball: only the person holding it speaks.', id: 'Pakai bola: hanya yang pegang bola yang bicara.', fr: 'Utiliser une balle ou une peluche : seule celle qui la tient parle (ça rassure).' },
      { en: 'Praise effort, not only correct answers: "Good try!"', id: 'Puji usaha mereka: "Good try!" = "Bagus, sudah mencoba!"', fr: 'Valoriser l\'effort : « Good try! » plutôt que corriger directement.' },
    ],
  },
  {
    id: 'en-feelings', n: 2, full: true, icon: '😊', title: 'Feelings & Emotions', level: 'A0–A1', duration: 45,
    objective: {
      en: 'Students can name 8 feelings and say "I am happy / I am not sad".',
      id: 'Murid bisa menyebut 8 perasaan dan berkata "I am happy / I am not sad".',
      fr: 'Les élèves savent nommer 8 émotions et dire « I am happy / I am not sad ».',
    },
    vocab: V([
      ['happy', '😊', 'senang', 'content(e)'],
      ['sad', '😢', 'sedih', 'triste'],
      ['angry', '😠', 'marah', 'en colère'],
      ['scared', '😨', 'takut', 'effrayé(e)'],
      ['tired', '😴', 'capek', 'fatigué(e)'],
      ['excited', '🤩', 'bersemangat', 'enthousiaste'],
      ['bored', '😑', 'bosan', 'qui s\'ennuie'],
      ['surprised', '😲', 'kaget', 'surpris(e)'],
      ['hungry', '😋', 'lapar', 'affamé(e)'],
      ['thirsty', '🥤', 'haus', 'assoiffé(e)'],
      ['shy', '😳', 'malu', 'timide'],
      ['sick', '🤒', 'sakit', 'malade'],
      ['calm', '😌', 'tenang', 'calme'],
      ['proud', '🥹', 'bangga', 'fier / fière'],
    ], 'en-feelings'),
    sentences: [
      { en: 'I am happy today.', id: 'Saya senang hari ini.', fr: 'Je suis contente aujourd\'hui.' },
      { en: 'How are you feeling?', id: 'Bagaimana perasaanmu?', fr: 'Comment te sens-tu ?' },
      { en: 'She is tired.', id: 'Dia capek.', fr: 'Elle est fatiguée.' },
      { en: 'I am not scared.', id: 'Saya tidak takut.', fr: 'Je n\'ai pas peur.' },
      { en: 'Are you hungry? – Yes, I am.', id: 'Kamu lapar? – Ya.', fr: 'Tu as faim ? – Oui.' },
      { en: 'We are excited!', id: 'Kami bersemangat!', fr: 'Nous sommes enthousiastes !' },
    ],
    grammar: {
      title: 'TO BE + feeling (and NOT)',
      rule: { en: 'I am happy. I am not sad. Are you tired?', id: 'I am happy. Kalimat negatif: tambah "not". Pertanyaan: "Are you…?"', fr: 'I am happy. Négation : ajouter « not ». Question : inverser → « Are you tired? »' },
      table: [['I', 'am', 'I am not'], ['You / We / They', 'are', 'are not (aren\'t)'], ['He / She', 'is', 'is not (isn\'t)']],
      examples: ['I am happy.', 'He is not angry.', 'Are you scared?'],
    },
    exercises: [
      { type: 'fill', s: 'I ___ happy today.', opts: ['am', 'is', 'are'], a: 'am', why: { en: 'I → am', id: 'I → am', fr: 'I → am' } },
      { type: 'fill', s: 'They ___ excited.', opts: ['am', 'is', 'are'], a: 'are', why: { en: 'They → are', id: 'They (mereka) → are', fr: 'They (ils/elles) → are' } },
      { type: 'fill', s: 'She ___ not sad.', opts: ['am', 'is', 'are'], a: 'is', why: { en: 'She → is (+ not)', id: 'She → is not', fr: 'She → is not' } },
      { type: 'fill', s: '😢 He is ___.', opts: ['sad', 'happy', 'hungry'], a: 'sad', why: { en: '😢 = sad', id: '😢 = sedih', fr: '😢 = triste' } },
      { type: 'fill', s: '😴 I am ___.', opts: ['tired', 'angry', 'excited'], a: 'tired', why: { en: '😴 = tired', id: '😴 = capek', fr: '😴 = fatiguée' } },
      { type: 'fill', s: '___ you hungry?', opts: ['Are', 'Is', 'Am'], a: 'Are', why: { en: 'Question: Are you…?', id: 'Pertanyaan: Are you…?', fr: 'Question : Are you… ?' } },
      { type: 'build', a: 'I am happy', fr: 'Je suis contente.', id: 'Saya senang.' },
      { type: 'build', a: 'She is not scared', fr: 'Elle n\'a pas peur.', id: 'Dia tidak takut.' },
      { type: 'build', a: 'Are you tired', fr: 'Tu es fatiguée ?', id: 'Kamu capek?' },
    ],
    game: 'emotions',
    gameNote: { en: 'Guess the Emotion: one student mimes, the others guess.', id: 'Tebak Perasaan: satu murid memperagakan, yang lain menebak.', fr: 'Guess the Emotion : une élève mime, les autres devinent.' },
    conversation: 'conv-feel',
    steps: [
      { min: 5, en: 'Warm-up: "How are you?" with big faces.', id: 'Pemanasan: "How are you?" dengan ekspresi wajah.', fr: 'Échauffement : « How are you? » avec de grandes grimaces.' },
      { min: 10, en: 'Vocabulary with emojis: repeat and mime.', id: 'Kosakata dengan emoji: ulangi dan peragakan.', fr: 'Vocabulaire avec emojis : répéter et mimer.' },
      { min: 10, en: 'Grammar: I am / I am not.', id: 'Tata bahasa: I am / I am not.', fr: 'Grammaire : I am / I am not.' },
      { min: 10, en: 'Game: Guess the Emotion (mime mode).', id: 'Permainan: Tebak Perasaan.', fr: 'Jeu : Guess the Emotion (mode mime).' },
      { min: 10, en: 'Mini-test and "How do you feel now?"', id: 'Tes kecil dan "How do you feel now?"', fr: 'Mini-test et « How do you feel now? » pour finir.' },
    ],
    tips: [
      { en: 'Mime first yourself: being silly makes shy students relax.', id: 'Guru memperagakan dulu, supaya murid tidak malu.', fr: 'Mimer soi-même en premier : le ridicule assumé détend les timides.' },
      { en: 'Mime can be done in pairs or in small groups.', id: 'Peragaan bisa berdua atau berkelompok.', fr: 'Le mime peut se faire à deux ou en petit groupe.' },
      { en: 'Accept pointing at the emoji as a first answer.', id: 'Menunjuk emoji juga boleh sebagai jawaban.', fr: 'Accepter qu\'une élève montre l\'emoji du doigt comme première réponse.' },
    ],
  },
  {
    id: 'en-hobbies', n: 9, full: true, icon: '⚽', title: 'Hobbies & Sports', level: 'A1', duration: 50,
    objective: {
      en: 'Students can say what they like and can do: "I like dancing. I can swim."',
      id: 'Murid bisa mengatakan hobi dan kemampuan: "I like dancing. I can swim."',
      fr: 'Les élèves savent dire ce qu\'elles aiment et savent faire : « I like dancing. I can swim. »',
    },
    vocab: V([
      ['football', '⚽', 'sepak bola', 'football'],
      ['badminton', '🏸', 'bulu tangkis', 'badminton'],
      ['volleyball', '🏐', 'bola voli', 'volley-ball'],
      ['swimming', '🏊‍♀️', 'berenang', 'natation'],
      ['dancing', '💃', 'menari', 'danse'],
      ['singing', '🎤', 'menyanyi', 'chant'],
      ['reading', '📖', 'membaca', 'lecture'],
      ['drawing', '🎨', 'menggambar', 'dessin'],
      ['cooking', '🍳', 'memasak', 'cuisine'],
      ['running', '🏃‍♀️', 'berlari', 'course'],
      ['cycling', '🚲', 'bersepeda', 'vélo'],
      ['playing guitar', '🎸', 'bermain gitar', 'jouer de la guitare'],
      ['jumping rope', '🪢', 'lompat tali', 'corde à sauter'],
    ], 'en-hobbies'),
    sentences: [
      { en: 'I like dancing.', id: 'Saya suka menari.', fr: 'J\'aime danser.' },
      { en: 'I don\'t like running.', id: 'Saya tidak suka berlari.', fr: 'Je n\'aime pas courir.' },
      { en: 'I can swim.', id: 'Saya bisa berenang.', fr: 'Je sais nager.' },
      { en: 'I can\'t play guitar.', id: 'Saya tidak bisa bermain gitar.', fr: 'Je ne sais pas jouer de la guitare.' },
      { en: 'Do you like badminton? – Yes, I do!', id: 'Kamu suka bulu tangkis? – Ya!', fr: 'Tu aimes le badminton ? – Oui !' },
      { en: 'What is your hobby?', id: 'Apa hobimu?', fr: 'Quel est ton loisir ?' },
    ],
    grammar: {
      title: 'I like / I don\'t like • I can / I can\'t',
      rule: { en: 'I like + -ing (I like dancing). I can + verb (I can dance).', id: 'I like + kata kerja -ing. I can + kata kerja. Negatif: don\'t like / can\'t.', fr: 'I like + verbe en -ing (I like dancing). I can + verbe simple (I can dance). Négatif : don\'t like / can\'t.' },
      table: [['I like', 'swimming', '👍'], ['I don\'t like', 'running', '👎'], ['I can', 'swim', '💪'], ['I can\'t', 'sing', '🙅‍♀️']],
      examples: ['I like reading.', 'I don\'t like cooking.', 'I can ride a bike.'],
    },
    exercises: [
      { type: 'fill', s: 'I ___ dancing. 👍', opts: ['like', 'don\'t like', 'can\'t'], a: 'like', why: { en: '👍 = like', id: '👍 = suka', fr: '👍 = like (aimer)' } },
      { type: 'fill', s: 'I ___ running. 👎', opts: ['don\'t like', 'like', 'am'], a: 'don\'t like', why: { en: '👎 = don\'t like', id: '👎 = tidak suka', fr: '👎 = don\'t like' } },
      { type: 'fill', s: 'I can ___. 🏊‍♀️', opts: ['swim', 'swimming', 'swims'], a: 'swim', why: { en: 'can + verb (no -ing)', id: 'can + kata kerja (tanpa -ing)', fr: 'can + verbe simple, sans -ing' } },
      { type: 'fill', s: 'Do you like badminton? – Yes, I ___.', opts: ['do', 'am', 'like'], a: 'do', why: { en: 'Do you…? → Yes, I do.', id: 'Do you…? → Yes, I do.', fr: 'Do you… ? → Yes, I do.' } },
      { type: 'fill', s: 'She likes ___. 💃', opts: ['dancing', 'dance', 'dances'], a: 'dancing', why: { en: 'like + -ing', id: 'like + -ing', fr: 'like + verbe en -ing' } },
      { type: 'build', a: 'I like reading', fr: 'J\'aime lire.', id: 'Saya suka membaca.' },
      { type: 'build', a: 'I can play football', fr: 'Je sais jouer au foot.', id: 'Saya bisa main sepak bola.' },
      { type: 'build', a: 'Do you like singing', fr: 'Tu aimes chanter ?', id: 'Kamu suka menyanyi?' },
    ],
    game: 'simon',
    gameNote: { en: 'Simon Says with sports actions, then Team Challenge.', id: 'Simon Says dengan gerakan olahraga, lalu tantangan tim.', fr: 'Simon Says avec des gestes sportifs, puis Team Challenge.' },
    conversation: 'conv-hobby',
    steps: [
      { min: 5, en: 'Warm-up: Simon Says.', id: 'Pemanasan: Simon Says.', fr: 'Échauffement : Simon Says.' },
      { min: 10, en: 'Vocabulary: mime each sport.', id: 'Kosakata: peragakan setiap olahraga.', fr: 'Vocabulaire : mimer chaque sport.' },
      { min: 10, en: 'Grammar: like / don\'t like / can / can\'t with 👍 👎.', id: 'Tata bahasa: like / don\'t like / can / can\'t.', fr: 'Grammaire : like / don\'t like / can / can\'t avec les pouces.' },
      { min: 10, en: 'Survey: "Do you like…?" ask 3 friends.', id: 'Survei: tanya 3 teman "Do you like…?"', fr: 'Sondage : chaque élève demande « Do you like…? » à 3 camarades.' },
      { min: 15, en: 'Team Challenge + mini-test.', id: 'Tantangan tim + tes kecil.', fr: 'Team Challenge + mini-test.' },
    ],
    tips: [
      { en: 'Thumbs up / thumbs down lets everyone answer without speaking.', id: 'Jempol ke atas / bawah: semua bisa menjawab tanpa bicara.', fr: 'Pouce levé / baissé : tout le monde répond sans avoir à parler.' },
      { en: 'Survey in pairs: the shy student writes, the other asks.', id: 'Survei berpasangan: satu menulis, satu bertanya.', fr: 'Sondage en binôme : une écrit, l\'autre pose la question.' },
      { en: 'Connect to their life: badminton and volleyball are popular in Lombok.', id: 'Hubungkan dengan kehidupan mereka.', fr: 'Partir de leur vie : le badminton et le volley sont très populaires en Indonésie.' },
    ],
  },
];

// Leçons rapides : vocabulaire illustré + exercices générés automatiquement.
const quick = (id, n, icon, title, rows) => ({ id, n, icon, title, full: false, level: 'A0', duration: 30, vocab: V(rows, id) });

export const EN_QUICK = [
  quick('en-numbers', 3, '🔢', 'Numbers & Age', [
    ['one', '1️⃣', 'satu', 'un'], ['two', '2️⃣', 'dua', 'deux'], ['three', '3️⃣', 'tiga', 'trois'], ['four', '4️⃣', 'empat', 'quatre'],
    ['five', '5️⃣', 'lima', 'cinq'], ['six', '6️⃣', 'enam', 'six'], ['seven', '7️⃣', 'tujuh', 'sept'], ['eight', '8️⃣', 'delapan', 'huit'],
    ['nine', '9️⃣', 'sembilan', 'neuf'], ['ten', '🔟', 'sepuluh', 'dix'],
  ]),
  quick('en-colors', 4, '🎨', 'Colors & Shapes', [
    ['red', '🟥', 'merah', 'rouge'], ['blue', '🟦', 'biru', 'bleu'], ['green', '🟩', 'hijau', 'vert'], ['yellow', '🟨', 'kuning', 'jaune'],
    ['orange', '🟧', 'oranye', 'orange'], ['purple', '🟪', 'ungu', 'violet'], ['black', '⬛', 'hitam', 'noir'], ['white', '⬜', 'putih', 'blanc'],
    ['circle', '⚪', 'lingkaran', 'cercle'], ['star', '⭐', 'bintang', 'étoile'], ['heart', '❤️', 'hati', 'cœur'], ['triangle', '🔺', 'segitiga', 'triangle'],
  ]),
  quick('en-animals', 5, '🐒', 'Animals', [
    ['cat', '🐱', 'kucing', 'chat'], ['dog', '🐶', 'anjing', 'chien'], ['bird', '🐦', 'burung', 'oiseau'], ['fish', '🐟', 'ikan', 'poisson'],
    ['monkey', '🐒', 'monyet', 'singe'], ['chicken', '🐔', 'ayam', 'poule'], ['cow', '🐄', 'sapi', 'vache'], ['horse', '🐴', 'kuda', 'cheval'],
    ['turtle', '🐢', 'kura-kura', 'tortue'], ['elephant', '🐘', 'gajah', 'éléphant'], ['butterfly', '🦋', 'kupu-kupu', 'papillon'], ['snake', '🐍', 'ular', 'serpent'],
  ]),
  quick('en-food', 6, '🍚', 'Food & Drinks', [
    ['rice', '🍚', 'nasi', 'riz'], ['water', '💧', 'air', 'eau'], ['bread', '🍞', 'roti', 'pain'], ['egg', '🥚', 'telur', 'œuf'],
    ['banana', '🍌', 'pisang', 'banane'], ['mango', '🥭', 'mangga', 'mangue'], ['milk', '🥛', 'susu', 'lait'], ['tea', '🍵', 'teh', 'thé'],
    ['noodles', '🍜', 'mi', 'nouilles'], ['coconut', '🥥', 'kelapa', 'noix de coco'], ['apple', '🍎', 'apel', 'pomme'], ['cake', '🍰', 'kue', 'gâteau'],
  ]),
  quick('en-family', 7, '👨‍👩‍👧', 'Family', [
    ['mother', '👩', 'ibu', 'mère'], ['father', '👨', 'ayah', 'père'], ['sister', '👧', 'saudara perempuan', 'sœur'], ['brother', '👦', 'saudara laki-laki', 'frère'],
    ['grandmother', '👵', 'nenek', 'grand-mère'], ['grandfather', '👴', 'kakek', 'grand-père'], ['baby', '👶', 'bayi', 'bébé'], ['family', '👨‍👩‍👧‍👦', 'keluarga', 'famille'],
    ['aunt', '👩‍🦱', 'bibi', 'tante'], ['uncle', '👨‍🦱', 'paman', 'oncle'],
  ]),
  quick('en-body', 8, '🖐️', 'Body Parts', [
    ['head', '🙆‍♀️', 'kepala', 'tête'], ['eyes', '👀', 'mata', 'yeux'], ['ears', '👂', 'telinga', 'oreilles'], ['nose', '👃', 'hidung', 'nez'],
    ['mouth', '👄', 'mulut', 'bouche'], ['hand', '✋', 'tangan', 'main'], ['foot', '🦶', 'kaki', 'pied'], ['leg', '🦵', 'kaki', 'jambe'],
    ['arm', '💪', 'lengan', 'bras'], ['teeth', '🦷', 'gigi', 'dents'], ['hair', '💇‍♀️', 'rambut', 'cheveux'],
    ['neck', '🧣', 'leher', 'cou', true], ['shoulder', '🤷‍♀️', 'bahu', 'épaule', true], ['stomach', '🍽️', 'perut', 'ventre', true],
    ['knee', '🦵', 'lutut', 'genou', true], ['eyebrows', '🤨', 'alis', 'sourcils', true], ['cheeks', '😊', 'pipi', 'joues', true],
  ]),
  quick('en-school', 10, '🏫', 'School & Classroom', [
    ['board', '🟩', 'papan tulis', 'tableau', true], ['desk', '🗄️', 'meja', 'bureau, table', true], ['chair', '🪑', 'kursi', 'chaise'],
    ['book', '📕', 'buku', 'livre'], ['pen', '🖊️', 'pulpen', 'stylo'], ['pencil', '✏️', 'pensil', 'crayon'], ['bag', '🎒', 'tas', 'sac'],
    ['window', '🪟', 'jendela', 'fenêtre'], ['door', '🚪', 'pintu', 'porte'], ['clock', '🕰️', 'jam dinding', 'horloge'],
    ['ruler', '📏', 'penggaris', 'règle'], ['eraser', '🧽', 'penghapus', 'gomme', true],
  ]),
];

export const EN_ALL = [...EN_LESSONS, ...GRAMMAR_LESSONS, ...EN_QUICK].sort((a, b) => a.n - b.n);
export const EN_BY_ID = Object.fromEntries(EN_ALL.map((l) => [l.id, l]));

// Thèmes prévus, pas encore rédigés.
export const EN_ROADMAP = [
  'Days & Months', 'Weather', 'Clothes', 'Daily Routine', 'Places & Directions',
  'I have / I don\'t have', 'What / Where / Who / When', 'There is / There are', 'Basic Adjectives', 'Simple Questions & Answers',
];
