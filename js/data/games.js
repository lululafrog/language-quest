export const SIMON_ACTIONS = [
  { en: 'Touch your nose', id: 'Sentuh hidungmu', fr: 'Touche ton nez', emoji: '👃' },
  { en: 'Raise your hands', id: 'Angkat tanganmu', fr: 'Lève les mains', emoji: '🙌' },
  { en: 'Jump', id: 'Lompat', fr: 'Saute', emoji: '🦘' },
  { en: 'Sit down', id: 'Duduk', fr: 'Assieds-toi', emoji: '🪑' },
  { en: 'Stand up', id: 'Berdiri', fr: 'Lève-toi', emoji: '🧍‍♀️' },
  { en: 'Clap your hands', id: 'Tepuk tangan', fr: 'Tape dans tes mains', emoji: '👏' },
  { en: 'Turn around', id: 'Berputar', fr: 'Tourne sur toi-même', emoji: '🔄' },
  { en: 'Touch your head', id: 'Sentuh kepalamu', fr: 'Touche ta tête', emoji: '🙆‍♀️' },
  { en: 'Close your eyes', id: 'Tutup matamu', fr: 'Ferme les yeux', emoji: '🙈' },
  { en: 'Smile', id: 'Tersenyum', fr: 'Souris', emoji: '😁' },
  { en: 'Wave your hand', id: 'Lambaikan tanganmu', fr: 'Fais coucou de la main', emoji: '👋' },
  { en: 'Touch your ears', id: 'Sentuh telingamu', fr: 'Touche tes oreilles', emoji: '👂' },
  { en: 'Stamp your feet', id: 'Hentakkan kakimu', fr: 'Tape des pieds', emoji: '🦶' },
  { en: 'Dance', id: 'Menari', fr: 'Danse', emoji: '💃' },
  { en: 'Swim', id: 'Berenang (pura-pura)', fr: 'Fais semblant de nager', emoji: '🏊‍♀️' },
  { en: 'Play football', id: 'Main sepak bola (pura-pura)', fr: 'Fais semblant de jouer au foot', emoji: '⚽' },
  { en: 'Be happy', id: 'Tunjukkan wajah senang', fr: 'Fais une tête contente', emoji: '😊' },
  { en: 'Be scared', id: 'Tunjukkan wajah takut', fr: 'Fais une tête effrayée', emoji: '😨' },
];

export const CONVERSATIONS = [
  {
    id: 'conv-name', title: 'Meeting a friend', icon: '👋',
    lines: [
      { who: 'A', en: 'Hello! What\'s your name?', id: 'Halo! Siapa namamu?' },
      { who: 'B', en: 'My name is ____.', id: 'Nama saya ____.', hint: 'Rina / Dewi / Sari' },
      { who: 'A', en: 'How old are you?', id: 'Berapa umurmu?' },
      { who: 'B', en: 'I\'m ____ years old.', id: 'Umur saya ____ tahun.', hint: 'ten / eleven / twelve' },
      { who: 'A', en: 'Nice to meet you!', id: 'Senang bertemu denganmu!' },
      { who: 'B', en: 'Nice to meet you ____!', id: 'Senang bertemu denganmu juga!', hint: 'too' },
    ],
  },
  {
    id: 'conv-feel', title: 'How are you?', icon: '😊',
    lines: [
      { who: 'A', en: 'Good morning! How are you?', id: 'Selamat pagi! Apa kabar?' },
      { who: 'B', en: 'I\'m ____, thank you. And you?', id: 'Saya ____, terima kasih. Kamu?', hint: 'happy / fine / tired' },
      { who: 'A', en: 'I\'m ____. I\'m ____ too.', id: 'Saya ____. Saya juga ____.', hint: 'good… hungry' },
      { who: 'B', en: 'Are you ____?', id: 'Apakah kamu ____?', hint: 'sad / scared / excited' },
      { who: 'A', en: 'No, I\'m not. I\'m ____!', id: 'Tidak. Saya ____!', hint: 'happy' },
    ],
  },
  {
    id: 'conv-hobby', title: 'What do you like?', icon: '⚽',
    lines: [
      { who: 'A', en: 'What do you like?', id: 'Kamu suka apa?' },
      { who: 'B', en: 'I like ____.', id: 'Saya suka ____.', hint: 'dancing / badminton / drawing' },
      { who: 'A', en: 'Can you ____?', id: 'Kamu bisa ____?', hint: 'swim / sing / cook' },
      { who: 'B', en: 'Yes, I can! / No, I ____.', id: 'Ya, bisa! / Tidak, saya ____.', hint: 'can\'t' },
      { who: 'A', en: 'Do you like ____?', id: 'Kamu suka ____?', hint: 'football / reading' },
      { who: 'B', en: 'Yes, I ____! / No, I don\'t.', id: 'Ya! / Tidak.', hint: 'do' },
    ],
  },
  {
    id: 'conv-food', title: 'At lunch', icon: '🍚',
    lines: [
      { who: 'A', en: 'Are you hungry?', id: 'Kamu lapar?' },
      { who: 'B', en: 'Yes, I am. I want ____.', id: 'Ya. Saya mau ____.', hint: 'rice / noodles / bread' },
      { who: 'A', en: 'Do you like ____?', id: 'Kamu suka ____?', hint: 'mango / banana' },
      { who: 'B', en: 'Yes, I do! It\'s ____!', id: 'Ya! Enak!', hint: 'yummy / delicious' },
      { who: 'A', en: 'Are you thirsty?', id: 'Kamu haus?' },
      { who: 'B', en: 'Yes. I want ____, please.', id: 'Ya. Saya mau ____.', hint: 'water / tea / milk' },
    ],
  },
  {
    id: 'conv-family', title: 'My family', icon: '👨‍👩‍👧',
    lines: [
      { who: 'A', en: 'Do you have a brother?', id: 'Kamu punya saudara laki-laki?' },
      { who: 'B', en: 'Yes, I have ____ brother(s).', id: 'Ya, saya punya ____ saudara laki-laki.', hint: 'one / two' },
      { who: 'A', en: 'What\'s your mother\'s name?', id: 'Siapa nama ibumu?' },
      { who: 'B', en: 'Her name is ____.', id: 'Namanya ____.' },
      { who: 'A', en: 'Is she ____?', id: 'Apakah dia ____?', hint: 'a teacher / happy' },
      { who: 'B', en: 'Yes, she ____.', id: 'Ya.', hint: 'is' },
    ],
  },
];
