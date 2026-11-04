// Contenu « I learn Indonesian ».
// Mot : [indonésien, français, anglais, prononciation pour francophones, exemple ID, exemple FR]
// Repères de prononciation : u = « ou », c = « tch », j = « dj », e souvent « eu »,
// ny = « gn », r roulé, g toujours dur, s toujours « ss ».

const W = (rows, lessonId) => rows.map(([id, fr, en, pron, exId, exFr], i) => ({
  key: `${lessonId}#${i}`, id, fr, en, pron, ex: exId, exFr, lesson: lessonId,
}));

const L = (o) => ({ ...o, words: W(o.words, o.id) });

export const LEVELS = [
  { n: 1, title: 'Survival Indonesian', fr: 'Survie', icon: '🛟', color: '#14b8a6' },
  { n: 2, title: 'Essential Verbs', fr: 'Verbes essentiels', icon: '⚡', color: '#f59e0b' },
  { n: 3, title: 'Daily Life', fr: 'Vie quotidienne', icon: '🛵', color: '#ef6c4d' },
  { n: 4, title: 'Teaching Indonesian', fr: 'Indonésien pour enseigner', icon: '🧑‍🏫', color: '#8b5cf6' },
  { n: 5, title: 'Real Conversations', fr: 'Vraies conversations', icon: '💬', color: '#1f9d6b' },
];

export const ID_LESSONS = [
  L({
    id: 'id-1-hello', level: 1, icon: '👋', title: 'Salam & politesse', sub: 'Bonjour, merci, au revoir, oui, non, s\'il te plaît',
    words: [
      ['Selamat pagi', 'Bonjour (le matin)', 'Good morning', 'seu-la-mat pa-gui', 'Selamat pagi, Bu!', 'Bonjour, Madame !'],
      ['Selamat siang', 'Bonjour (midi – 15 h)', 'Good afternoon', 'seu-la-mat si-ang', 'Selamat siang, semuanya.', 'Bonjour à tous.'],
      ['Selamat sore', 'Bonjour (fin d\'après-midi)', 'Good afternoon (late)', 'seu-la-mat so-ré', 'Selamat sore, Pak.', 'Bonjour, Monsieur.'],
      ['Selamat malam', 'Bonsoir', 'Good evening', 'seu-la-mat ma-lam', 'Selamat malam, sampai besok!', 'Bonsoir, à demain !'],
      ['Apa kabar?', 'Comment ça va ?', 'How are you?', 'a-pa ka-bar', 'Halo, apa kabar?', 'Salut, comment ça va ?'],
      ['Baik', 'Bien / Ça va', 'Fine / Good', 'ba-ik', 'Baik, terima kasih.', 'Bien, merci.'],
      ['Terima kasih', 'Merci', 'Thank you', 'teu-ri-ma ka-si', 'Terima kasih banyak!', 'Merci beaucoup !'],
      ['Sama-sama', 'De rien', 'You\'re welcome', 'sa-ma sa-ma', '"Terima kasih." – "Sama-sama."', '« Merci. » – « De rien. »'],
      ['Maaf', 'Pardon / Désolée', 'Sorry', 'ma-af', 'Maaf, saya terlambat.', 'Désolée, je suis en retard.'],
      ['Permisi', 'Excusez-moi (pour passer / interpeller)', 'Excuse me', 'peur-mi-si', 'Permisi, Pak.', 'Excusez-moi, Monsieur.'],
      ['Tolong', 'S\'il vous plaît (pour demander de l\'aide)', 'Please (help)', 'to-long', 'Tolong bantu saya.', 'Aidez-moi, s\'il vous plaît.'],
      ['Silakan', 'Je vous en prie / Allez-y', 'Please (go ahead)', 'si-la-kan', 'Silakan duduk.', 'Asseyez-vous, je vous en prie.'],
      ['Ya', 'Oui', 'Yes', 'ya', 'Ya, saya mau.', 'Oui, je veux bien.'],
      ['Tidak', 'Non / ne… pas', 'No / not', 'ti-da(k)', 'Tidak, terima kasih.', 'Non, merci.'],
      ['Sampai jumpa', 'Au revoir / À bientôt', 'See you', 'sam-paï djoum-pa', 'Sampai jumpa besok!', 'À demain !'],
    ],
    grammar: {
      title: 'Saluer selon l\'heure',
      points: [
        '« Selamat » + moment de la journée : pagi (≈ jusqu\'à 11 h), siang (11 h – 15 h), sore (15 h – 18 h), malam (le soir).',
        'On ajoute souvent « Pak » (Monsieur) ou « Bu » (Madame) par respect : « Terima kasih, Bu ».',
        '« Tolong » sert à demander un service ; « Silakan » sert à proposer, inviter (« allez-y »).',
      ],
    },
    fill: [
      { s: 'Selamat ___ ! (il est 8 h du matin)', fr: 'Bonjour !', opts: ['pagi', 'malam', 'sore'], a: 'pagi', why: '« Pagi » = le matin. « Malam » = le soir.' },
      { s: 'Terima ___ banyak!', fr: 'Merci beaucoup !', opts: ['kasih', 'kabar', 'maaf'], a: 'kasih', why: '« Merci » se dit « terima kasih ».' },
      { s: '"Terima kasih." – "___"', fr: '« Merci. » – « De rien. »', opts: ['Sama-sama', 'Permisi', 'Tolong'], a: 'Sama-sama', why: '« Sama-sama » = de rien.' },
      { s: 'Apa ___? – Baik!', fr: 'Comment ça va ? – Bien !', opts: ['kabar', 'kasih', 'pagi'], a: 'kabar', why: '« Apa kabar ? » = comment ça va ?' },
    ],
    build: [
      { fr: 'Merci beaucoup !', a: 'Terima kasih banyak' },
      { fr: 'Bien, merci.', a: 'Baik terima kasih' },
      { fr: 'Non, merci.', a: 'Tidak terima kasih' },
    ],
    translate: [
      { fr: 'Merci', a: ['terima kasih', 'makasih'] },
      { fr: 'Comment ça va ?', a: ['apa kabar'] },
      { fr: 'Bonsoir', a: ['selamat malam'] },
    ],
  }),
  L({
    id: 'id-1-intro', level: 1, icon: '🙋‍♀️', title: 'Se présenter & comprendre', sub: 'Se présenter, poser des questions, faire répéter',
    words: [
      ['Nama saya…', 'Je m\'appelle…', 'My name is…', 'na-ma sa-ya', 'Nama saya Claire.', 'Je m\'appelle Claire.'],
      ['Siapa nama kamu?', 'Comment tu t\'appelles ?', 'What\'s your name?', 'si-a-pa na-ma ka-mou', 'Halo! Siapa nama kamu?', 'Salut ! Comment tu t\'appelles ?'],
      ['Saya dari Prancis', 'Je viens de France', 'I\'m from France', 'sa-ya da-ri pran-tchis', 'Saya dari Prancis, dari Paris.', 'Je viens de France, de Paris.'],
      ['Kamu dari mana?', 'Tu viens d\'où ?', 'Where are you from?', 'ka-mou da-ri ma-na', 'Kamu dari mana? Dari Lombok?', 'Tu viens d\'où ? De Lombok ?'],
      ['Saya tinggal di…', 'J\'habite à…', 'I live in…', 'sa-ya ting-gal di', 'Saya tinggal di Mataram.', 'J\'habite à Mataram.'],
      ['Senang bertemu dengan kamu', 'Ravie de te rencontrer', 'Nice to meet you', 'seu-nang beur-teu-mou deu-ngan ka-mou', 'Senang bertemu dengan kamu, Rina.', 'Ravie de te rencontrer, Rina.'],
      ['Apa?', 'Quoi ? / Qu\'est-ce que ?', 'What?', 'a-pa', 'Ini apa?', 'C\'est quoi, ça ?'],
      ['Siapa?', 'Qui ?', 'Who?', 'si-a-pa', 'Dia siapa?', 'Qui est-ce ?'],
      ['Di mana?', 'Où ?', 'Where?', 'di ma-na', 'Toilet di mana?', 'Où sont les toilettes ?'],
      ['Kapan?', 'Quand ?', 'When?', 'ka-pan', 'Kapan kelas mulai?', 'Quand commence le cours ?'],
      ['Berapa?', 'Combien ?', 'How much / How many?', 'beu-ra-pa', 'Berapa umur kamu?', 'Quel âge as-tu ?'],
      ['Saya tidak mengerti', 'Je ne comprends pas', 'I don\'t understand', 'sa-ya ti-da meu-ngeur-ti', 'Maaf, saya tidak mengerti.', 'Pardon, je ne comprends pas.'],
      ['Bisa diulang?', 'Vous pouvez répéter ?', 'Can you repeat?', 'bi-sa di-ou-lang', 'Maaf, bisa diulang?', 'Pardon, vous pouvez répéter ?'],
      ['Pelan-pelan', 'Lentement', 'Slowly', 'peu-lan peu-lan', 'Tolong bicara pelan-pelan.', 'Parlez lentement, s\'il vous plaît.'],
      ['Apa artinya?', 'Ça veut dire quoi ?', 'What does it mean?', 'a-pa ar-ti-gna', '"Capek" apa artinya?', 'Que veut dire « capek » ?'],
    ],
    grammar: {
      title: 'Poser une question',
      points: [
        'Le mot interrogatif peut se mettre au début ou à la fin : « Kamu dari mana ? » = « Dari mana kamu ? ».',
        'Pas d\'inversion ni de conjugaison : on monte simplement l\'intonation.',
        '« Kamu » = tu (amis, enfants). « Anda » = vous (poli, inconnus). Avec un adulte : « Bapak » (Monsieur) / « Ibu » (Madame).',
      ],
    },
    fill: [
      { s: '___ saya Claire.', fr: 'Je m\'appelle Claire.', opts: ['Nama', 'Siapa', 'Dari'], a: 'Nama', why: '« Nama saya… » = mon nom est…' },
      { s: 'Kamu dari ___?', fr: 'Tu viens d\'où ?', opts: ['mana', 'apa', 'kapan'], a: 'mana', why: '« Dari mana » = d\'où.' },
      { s: 'Toilet di ___?', fr: 'Où sont les toilettes ?', opts: ['mana', 'siapa', 'berapa'], a: 'mana', why: '« Di mana » = où.' },
      { s: 'Saya tidak ___.', fr: 'Je ne comprends pas.', opts: ['mengerti', 'tinggal', 'kabar'], a: 'mengerti', why: '« Mengerti » = comprendre.' },
    ],
    build: [
      { fr: 'Je viens de France.', a: 'Saya dari Prancis' },
      { fr: 'Comment tu t\'appelles ?', a: 'Siapa nama kamu' },
      { fr: 'Pardon, je ne comprends pas.', a: 'Maaf saya tidak mengerti' },
    ],
    translate: [
      { fr: 'Je ne comprends pas', a: ['saya tidak mengerti', 'saya nggak ngerti', 'saya tidak paham'] },
      { fr: 'Où ?', a: ['di mana', 'dimana'] },
      { fr: 'Tu viens d\'où ?', a: ['kamu dari mana', 'dari mana kamu', 'dari mana'] },
    ],
  }),
  L({
    id: 'id-2-verbs', level: 2, icon: '⚡', title: 'Les 7 structures magiques', sub: 'Saya mau, suka, bisa, tidak, belum, punya, perlu',
    words: [
      ['Saya mau…', 'Je veux…', 'I want…', 'sa-ya ma-ou', 'Saya mau air putih.', 'Je veux de l\'eau.'],
      ['Saya suka…', 'J\'aime…', 'I like…', 'sa-ya sou-ka', 'Saya suka pantai.', 'J\'aime la plage.'],
      ['Saya bisa…', 'Je peux / Je sais…', 'I can…', 'sa-ya bi-sa', 'Saya bisa berenang.', 'Je sais nager.'],
      ['Saya tidak…', 'Je ne… pas', 'I don\'t…', 'sa-ya ti-da(k)', 'Saya tidak suka pedas.', 'Je n\'aime pas le piquant.'],
      ['Saya belum…', 'Je n\'ai pas encore…', 'I haven\'t… yet', 'sa-ya beu-loum', 'Saya belum makan.', 'Je n\'ai pas encore mangé.'],
      ['Saya sudah…', 'J\'ai déjà…', 'I have already…', 'sa-ya sou-dah', 'Saya sudah makan.', 'J\'ai déjà mangé.'],
      ['Saya punya…', 'J\'ai / Je possède…', 'I have…', 'sa-ya pou-gna', 'Saya punya dua adik.', 'J\'ai deux petits frères et sœurs.'],
      ['Saya perlu…', 'J\'ai besoin de…', 'I need…', 'sa-ya peur-lou', 'Saya perlu bantuan.', 'J\'ai besoin d\'aide.'],
      ['makan', 'manger', 'to eat', 'ma-kan', 'Saya mau makan.', 'Je veux manger.'],
      ['minum', 'boire', 'to drink', 'mi-noum', 'Saya mau minum kopi.', 'Je veux boire un café.'],
      ['belajar', 'apprendre / étudier', 'to learn', 'beu-la-djar', 'Saya belajar bahasa Indonesia.', 'J\'apprends l\'indonésien.'],
      ['bahasa Indonesia', 'la langue indonésienne', 'Indonesian language', 'ba-ha-sa in-do-né-si-a', 'Saya suka bahasa Indonesia.', 'J\'aime l\'indonésien.'],
      ['bicara', 'parler', 'to speak', 'bi-tcha-ra', 'Saya bisa bicara sedikit.', 'Je sais parler un peu.'],
      ['sedikit', 'un peu', 'a little', 'seu-di-kit', 'Saya bisa bahasa Indonesia sedikit.', 'Je parle un peu indonésien.'],
    ],
    grammar: {
      title: 'Aucune conjugaison !',
      points: [
        'Sujet + mot-clé + verbe : « Saya mau makan » = je veux manger. Le verbe ne change jamais.',
        '« Tidak » nie un verbe ou un adjectif : « Saya tidak mau ». (« Bukan » nie un nom : « Saya bukan guru ».)',
        '« Belum » = pas encore (sous-entend « mais ça viendra »). Contraire : « sudah » = déjà. À « Sudah makan ? », on répond poliment « Belum » plutôt que « Tidak ».',
        'On combine : « Saya tidak bisa datang » = je ne peux pas venir ; « Saya belum bisa » = je ne sais pas encore.',
      ],
    },
    fill: [
      { s: 'Saya ___ minum kopi.', fr: 'Je veux boire un café.', opts: ['mau', 'punya', 'belum'], a: 'mau', why: '« Mau » = vouloir.' },
      { s: 'Saya ___ makan. (pas encore)', fr: 'Je n\'ai pas encore mangé.', opts: ['belum', 'tidak', 'sudah'], a: 'belum', why: '« Belum » = pas encore. « Sudah » = déjà.' },
      { s: 'Saya ___ suka pedas.', fr: 'Je n\'aime pas le piquant.', opts: ['tidak', 'bukan', 'belum'], a: 'tidak', why: '« Tidak » nie un verbe. « Bukan » nie un nom.' },
      { s: 'Saya ___ berenang.', fr: 'Je sais nager.', opts: ['bisa', 'perlu', 'punya'], a: 'bisa', why: '« Bisa » = pouvoir / savoir faire.' },
      { s: 'Saya ___ dua adik.', fr: 'J\'ai deux petits frères/sœurs.', opts: ['punya', 'mau', 'bisa'], a: 'punya', why: '« Punya » = avoir, posséder.' },
      { s: 'Saya ___ bantuan.', fr: 'J\'ai besoin d\'aide.', opts: ['perlu', 'suka', 'sudah'], a: 'perlu', why: '« Perlu » = avoir besoin de.' },
    ],
    build: [
      { fr: 'Je veux boire un café.', a: 'Saya mau minum kopi' },
      { fr: 'J\'apprends l\'indonésien.', a: 'Saya belajar bahasa Indonesia' },
      { fr: 'Je n\'ai pas encore mangé.', a: 'Saya belum makan' },
      { fr: 'Je ne peux pas venir.', a: 'Saya tidak bisa datang' },
    ],
    translate: [
      { fr: 'Je veux manger', a: ['saya mau makan'] },
      { fr: 'J\'aime la plage', a: ['saya suka pantai'] },
      { fr: 'J\'ai besoin d\'aide', a: ['saya perlu bantuan', 'saya butuh bantuan'] },
      { fr: 'Je parle un peu indonésien', a: ['saya bisa bahasa indonesia sedikit', 'saya bisa sedikit bahasa indonesia', 'saya bisa bicara bahasa indonesia sedikit', 'saya bisa bicara sedikit bahasa indonesia'] },
    ],
  }),
  L({
    id: 'id-3-daily', level: 3, icon: '🛍️', title: 'Manger, acheter, se déplacer', sub: 'Prix, nourriture, directions, horaires',
    words: [
      ['Berapa harganya?', 'Combien ça coûte ?', 'How much is it?', 'beu-ra-pa har-ga-gna', 'Ini berapa harganya?', 'Ça coûte combien ?'],
      ['mahal', 'cher', 'expensive', 'ma-hal', 'Wah, mahal sekali!', 'Oh, c\'est très cher !'],
      ['murah', 'pas cher', 'cheap', 'mou-rah', 'Di pasar lebih murah.', 'Au marché, c\'est moins cher.'],
      ['Boleh kurang?', 'Vous pouvez baisser le prix ?', 'Can you lower the price?', 'bo-lé kou-rang', 'Dua puluh ribu, boleh kurang?', 'Vingt mille, vous pouvez baisser ?'],
      ['Saya mau beli…', 'Je voudrais acheter…', 'I want to buy…', 'sa-ya ma-ou beu-li', 'Saya mau beli air putih.', 'Je voudrais acheter de l\'eau.'],
      ['air putih', 'eau (à boire)', 'drinking water', 'a-ir pou-ti', 'Satu air putih, ya.', 'Une eau, s\'il vous plaît.'],
      ['nasi goreng', 'riz frit', 'fried rice', 'na-si go-rèng', 'Saya mau nasi goreng.', 'Je veux un riz frit.'],
      ['enak', 'bon / délicieux', 'delicious', 'é-nak', 'Enak sekali!', 'Très bon !'],
      ['tidak pedas', 'pas piquant', 'not spicy', 'ti-da peu-das', 'Tolong tidak pedas, ya.', 'Pas piquant, s\'il vous plaît.'],
      ['kiri', 'gauche', 'left', 'ki-ri', 'Belok kiri di sana.', 'Tournez à gauche là-bas.'],
      ['kanan', 'droite', 'right', 'ka-nan', 'Sekolah di sebelah kanan.', 'L\'école est sur la droite.'],
      ['lurus', 'tout droit', 'straight', 'lou-rous', 'Jalan lurus saja.', 'Allez tout droit.'],
      ['Jam berapa?', 'À quelle heure ? / Quelle heure est-il ?', 'What time?', 'djam beu-ra-pa', 'Sekarang jam berapa?', 'Quelle heure est-il ?'],
      ['Bisa bantu saya?', 'Vous pouvez m\'aider ?', 'Can you help me?', 'bi-sa ban-tou sa-ya', 'Permisi, bisa bantu saya?', 'Excusez-moi, vous pouvez m\'aider ?'],
      ['ribu', 'mille (roupies)', 'thousand', 'ri-bou', 'Sepuluh ribu.', 'Dix mille.'],
    ],
    grammar: {
      title: 'Les prix et « ya »',
      points: [
        'Les prix se disent en milliers : sepuluh ribu (10 000), dua puluh ribu (20 000), lima puluh ribu (50 000).',
        'Nombres utiles : satu 1, dua 2, tiga 3, empat 4, lima 5, enam 6, tujuh 7, delapan 8, sembilan 9, sepuluh 10.',
        'Ajouter « ya » en fin de phrase adoucit une demande : « Tidak pedas, ya » ≈ « pas piquant, d\'accord ? ».',
        '« Sekali » après un adjectif = très : « enak sekali » (très bon), « mahal sekali » (très cher).',
      ],
    },
    fill: [
      { s: 'Ini berapa ___?', fr: 'Ça coûte combien ?', opts: ['harganya', 'umurnya', 'jamnya'], a: 'harganya', why: '« Harga » = prix ; « harganya » = son prix.' },
      { s: 'Belok ___ di sana. (à gauche)', fr: 'Tournez à gauche là-bas.', opts: ['kiri', 'kanan', 'lurus'], a: 'kiri', why: '« Kiri » = gauche, « kanan » = droite.' },
      { s: 'Wah, ___ sekali! Boleh kurang?', fr: 'Oh, très cher ! Vous pouvez baisser ?', opts: ['mahal', 'murah', 'enak'], a: 'mahal', why: 'On négocie quand c\'est « mahal » (cher).' },
      { s: 'Tolong tidak ___, ya.', fr: 'Pas piquant, s\'il vous plaît.', opts: ['pedas', 'enak', 'murah'], a: 'pedas', why: '« Pedas » = piquant.' },
    ],
    build: [
      { fr: 'Je voudrais acheter de l\'eau.', a: 'Saya mau beli air putih' },
      { fr: 'Quelle heure est-il ?', a: 'Sekarang jam berapa' },
      { fr: 'Excusez-moi, vous pouvez m\'aider ?', a: 'Permisi bisa bantu saya' },
    ],
    translate: [
      { fr: 'Combien ça coûte ?', a: ['berapa harganya', 'ini berapa harganya', 'berapa', 'harganya berapa'] },
      { fr: 'Très bon !', a: ['enak sekali', 'enak banget'] },
      { fr: 'Tout droit', a: ['lurus', 'jalan lurus'] },
    ],
  }),
  L({
    id: 'id-4-teach', level: 4, icon: '🧑‍🏫', title: 'Les consignes de classe', sub: 'Écoutez, répétez, qui veut essayer ? Très bien !',
    words: [
      ['Dengarkan', 'Écoutez', 'Listen', 'deu-ngar-kan', 'Dengarkan baik-baik, ya.', 'Écoutez bien, d\'accord ?'],
      ['Ikuti saya', 'Répétez après moi', 'Repeat after me', 'i-kou-ti sa-ya', 'Ikuti saya: "Hello!"', 'Répétez après moi : « Hello ! »'],
      ['Ulangi', 'Répétez / Recommencez', 'Repeat', 'ou-la-ngi', 'Ulangi sekali lagi.', 'Répétez encore une fois.'],
      ['Lihat', 'Regardez', 'Look', 'li-hat', 'Lihat ke papan tulis.', 'Regardez le tableau.'],
      ['Tulis', 'Écrivez', 'Write', 'tou-lis', 'Tulis di buku kalian.', 'Écrivez dans vos cahiers.'],
      ['Siapa mau coba?', 'Qui veut essayer ?', 'Who wants to try?', 'si-a-pa ma-ou tcho-ba', 'Siapa mau coba? Angkat tangan!', 'Qui veut essayer ? Levez la main !'],
      ['Kalian sudah mengerti?', 'Vous avez compris ?', 'Do you understand?', 'ka-li-an sou-dah meu-ngeur-ti', 'Kalian sudah mengerti? Ya atau belum?', 'Vous avez compris ? Oui ou pas encore ?'],
      ['Sekali lagi', 'Encore une fois', 'One more time', 'seu-ka-li la-gui', 'Bagus! Sekali lagi!', 'Super ! Encore une fois !'],
      ['Bagus sekali!', 'Très bien !', 'Very good!', 'ba-gous seu-ka-li', 'Bagus sekali, Rina!', 'Très bien, Rina !'],
      ['Tidak apa-apa', 'Ce n\'est pas grave', 'It\'s okay', 'ti-da a-pa a-pa', 'Salah? Tidak apa-apa!', 'Une erreur ? Ce n\'est pas grave !'],
      ['Jangan takut salah', 'N\'ayez pas peur de vous tromper', 'Don\'t be afraid of mistakes', 'dja-ngan ta-kout sa-lah', 'Ayo coba, jangan takut salah!', 'Allez, essayez, n\'ayez pas peur de vous tromper !'],
      ['Pelan-pelan saja', 'Prenez votre temps', 'Take your time', 'peu-lan peu-lan sa-dja', 'Tidak usah buru-buru, pelan-pelan saja.', 'Pas besoin de se presser, prenez votre temps.'],
      ['Ayo kita belajar bersama', 'Travaillons ensemble', 'Let\'s learn together', 'a-yo ki-ta beu-la-djar beur-sa-ma', 'Ayo kita belajar bersama!', 'Allez, apprenons ensemble !'],
      ['Angkat tangan', 'Levez la main', 'Raise your hand', 'ang-kat ta-ngan', 'Kalau tahu, angkat tangan.', 'Si vous savez, levez la main.'],
      ['Tolong tenang', 'Du calme, s\'il vous plaît', 'Quiet, please', 'to-long teu-nang', 'Tolong tenang sebentar, ya.', 'Un peu de calme, s\'il vous plaît.'],
      ['Silakan duduk', 'Asseyez-vous', 'Please sit down', 'si-la-kan dou-douk', 'Silakan duduk, anak-anak.', 'Asseyez-vous, les enfants.'],
      ['Ayo!', 'Allez ! / On y va !', 'Come on! / Let\'s go!', 'a-yo', 'Ayo, kita mulai!', 'Allez, on commence !'],
    ],
    grammar: {
      title: 'Parler à un groupe d\'enfants',
      points: [
        '« Kalian » = vous (pluriel, pour des enfants ou des amis). « Anak-anak » = les enfants.',
        'L\'impératif est le verbe seul : « Lihat ! », « Tulis ! ». Ajoutez « ya » ou « Ayo » pour un ton doux et encourageant.',
        '« Jangan » + verbe = ne… pas (défense) : « Jangan takut » = n\'ayez pas peur.',
        'Encouragements : Bagus ! (bien), Pintar ! (malin), Hebat ! (génial), Betul ! (correct).',
      ],
    },
    fill: [
      { s: '___ baik-baik, ya.', fr: 'Écoutez bien.', opts: ['Dengarkan', 'Tulis', 'Duduk'], a: 'Dengarkan', why: '« Dengarkan » = écoutez.' },
      { s: 'Siapa mau ___?', fr: 'Qui veut essayer ?', opts: ['coba', 'lihat', 'tenang'], a: 'coba', why: '« Coba » = essayer.' },
      { s: 'Jangan takut ___!', fr: 'N\'ayez pas peur de vous tromper !', opts: ['salah', 'bagus', 'lagi'], a: 'salah', why: '« Salah » = faux, erreur.' },
      { s: 'Bagus! Sekali ___!', fr: 'Super ! Encore une fois !', opts: ['lagi', 'saja', 'apa'], a: 'lagi', why: '« Sekali lagi » = encore une fois.' },
      { s: '___ sudah mengerti?', fr: 'Vous avez compris ? (aux enfants)', opts: ['Kalian', 'Saya', 'Siapa'], a: 'Kalian', why: '« Kalian » = vous (pluriel).' },
    ],
    build: [
      { fr: 'Qui veut essayer ?', a: 'Siapa mau coba' },
      { fr: 'N\'ayez pas peur de vous tromper.', a: 'Jangan takut salah' },
      { fr: 'Allez, apprenons ensemble !', a: 'Ayo kita belajar bersama' },
    ],
    translate: [
      { fr: 'Très bien !', a: ['bagus sekali', 'bagus', 'hebat'] },
      { fr: 'Ce n\'est pas grave', a: ['tidak apa apa', 'tidak apa-apa', 'nggak apa apa', 'gak apa apa'] },
      { fr: 'Encore une fois', a: ['sekali lagi', 'ulangi sekali lagi'] },
      { fr: 'Regardez', a: ['lihat'] },
    ],
  }),
  L({
    id: 'id-5-talk', level: 5, icon: '💬', title: 'Discuter avec les habitants', sub: 'Faire connaissance, passions, voyages, sa journée',
    words: [
      ['Mau ke mana?', 'Tu vas où ? (salutation courante)', 'Where are you going?', 'ma-ou keu ma-na', '"Mau ke mana, Bu?" – "Ke pasar."', '« Vous allez où ? » – « Au marché. »'],
      ['Sudah makan?', 'Tu as mangé ? (salutation courante)', 'Have you eaten?', 'sou-dah ma-kan', '"Sudah makan?" – "Sudah, terima kasih."', '« Tu as mangé ? » – « Oui, merci. »'],
      ['Sudah berapa lama di sini?', 'Depuis combien de temps es-tu ici ?', 'How long have you been here?', 'sou-dah beu-ra-pa la-ma di si-ni', 'Sudah berapa lama di Lombok?', 'Depuis combien de temps es-tu à Lombok ?'],
      ['Saya relawan', 'Je suis bénévole', 'I am a volunteer', 'sa-ya reu-la-wan', 'Saya relawan di sebuah yayasan.', 'Je suis bénévole dans une association.'],
      ['Saya mengajar bahasa Inggris', 'J\'enseigne l\'anglais', 'I teach English', 'sa-ya meu-nga-djar ba-ha-sa ing-gris', 'Saya mengajar bahasa Inggris untuk anak-anak.', 'J\'enseigne l\'anglais aux enfants.'],
      ['Hobi saya…', 'Ma passion / mon hobby, c\'est…', 'My hobby is…', 'ho-bi sa-ya', 'Hobi saya menyelam dan membaca.', 'Mes passions : la plongée et la lecture.'],
      ['jalan-jalan', 'se balader / voyager', 'to travel / stroll', 'dja-lan dja-lan', 'Saya suka jalan-jalan ke pantai.', 'J\'aime me balader à la plage.'],
      ['Kamu kerja di mana?', 'Tu travailles où ?', 'Where do you work?', 'ka-mou keur-dja di ma-na', 'Kamu kerja di mana, Mas?', 'Tu travailles où ?'],
      ['Hari ini saya…', 'Aujourd\'hui, je…', 'Today I…', 'ha-ri i-ni sa-ya', 'Hari ini saya mengajar di sekolah.', 'Aujourd\'hui, j\'enseigne à l\'école.'],
      ['capek', 'fatigué(e)', 'tired', 'tcha-pèk', 'Saya capek sekali hari ini.', 'Je suis très fatiguée aujourd\'hui.'],
      ['Kamu sudah menikah?', 'Tu es marié(e) ? (question fréquente)', 'Are you married?', 'ka-mou sou-dah meu-ni-kah', '"Sudah menikah?" – "Belum."', '« Tu es mariée ? » – « Pas encore. »'],
      ['Indah sekali', 'C\'est magnifique', 'It\'s beautiful', 'in-dah seu-ka-li', 'Lombok indah sekali!', 'Lombok est magnifique !'],
      ['Saya sudah ke…', 'Je suis déjà allée à…', 'I have been to…', 'sa-ya sou-dah keu', 'Saya sudah ke Bali dan Flores.', 'Je suis déjà allée à Bali et Flores.'],
      ['Nanti', 'Plus tard', 'Later', 'nan-ti', 'Sampai nanti!', 'À plus tard !'],
    ],
    grammar: {
      title: 'Les questions « de politesse »',
      points: [
        '« Mau ke mana ? » et « Sudah makan ? » sont des salutations, pas des questions indiscrètes. Réponse vague acceptée : « Jalan-jalan saja » (je me balade).',
        'Le temps se marque avec des petits mots : sudah (déjà), belum (pas encore), sedang (en train de), akan (futur), tadi (tout à l\'heure).',
        'Exemple : « Saya sedang belajar » = je suis en train d\'apprendre ; « Saya akan ke Bali » = j\'irai à Bali.',
      ],
    },
    fill: [
      { s: 'Mau ke ___? – Ke pasar.', fr: 'Tu vas où ? – Au marché.', opts: ['mana', 'apa', 'siapa'], a: 'mana', why: '« Ke mana » = vers où.' },
      { s: 'Saya ___ bahasa Inggris.', fr: 'J\'enseigne l\'anglais.', opts: ['mengajar', 'belajar', 'makan'], a: 'mengajar', why: '« Mengajar » = enseigner ; « belajar » = apprendre.' },
      { s: '"Sudah makan?" – "___, terima kasih."', fr: '« Tu as mangé ? » – « Oui, merci. »', opts: ['Sudah', 'Tidak', 'Bukan'], a: 'Sudah', why: 'On répond « sudah » (déjà) ou « belum » (pas encore).' },
      { s: 'Lombok ___ sekali!', fr: 'Lombok est magnifique !', opts: ['indah', 'capek', 'mahal'], a: 'indah', why: '« Indah » = beau, magnifique.' },
    ],
    build: [
      { fr: 'Je suis bénévole.', a: 'Saya relawan' },
      { fr: 'Aujourd\'hui, je suis très fatiguée.', a: 'Hari ini saya capek sekali' },
      { fr: 'J\'aime me balader à la plage.', a: 'Saya suka jalan-jalan ke pantai' },
    ],
    translate: [
      { fr: 'J\'enseigne l\'anglais', a: ['saya mengajar bahasa inggris'] },
      { fr: 'Je suis fatiguée', a: ['saya capek', 'saya lelah'] },
      { fr: 'À plus tard !', a: ['sampai nanti'] },
    ],
  }),
];

export const ALL_ID_WORDS = ID_LESSONS.flatMap((l) => l.words);
export const ID_WORD_BY_KEY = Object.fromEntries(ALL_ID_WORDS.map((w) => [w.key, w]));
