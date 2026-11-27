// Pronunciation course for French speakers: the classic errors, ordered by impact on intelligibility.
// IPA follows standard British English (RP). Written for Fluent30.

export interface PronPair {
  a: string; // target (often the sound French speakers miss)
  b: string; // the word it gets confused with
  ipaA: string;
  ipaB: string;
  frA?: string;
  frB?: string;
}

export interface TapItem {
  word: string; // word or sentence
  parts: string[]; // syllables, letters or words to tap
  answer: number; // index of the stressed syllable / silent letter / main stressed word
  ipa?: string;
  fr?: string;
}

export interface SortItem {
  text: string;
  cat: string; // category id
  ipa?: string;
}

export interface PronLesson {
  id: string;
  title: string;
  titleEn: string;
  emoji: string;
  sound: string; // short label, e.g. "/θ/ /ð/"
  summary: string;
  why: string; // why French speakers struggle
  how: string[]; // concrete mouth / technique tips
  examples: { word: string; ipa: string; note?: string }[];
  pairs?: PronPair[];
  sentences: string[];
  mistakes: { wrong: string; right: string; explanation: string }[];
  tap?: { prompt: string; promptEn: string; items: TapItem[] };
  sort?: { prompt: string; promptEn: string; categories: { id: string; label: string; ipa?: string }[]; items: SortItem[] };
}

export const PRON_LESSONS: PronLesson[] = [
  {
    id: "h",
    title: "Le H aspiré",
    titleEn: "The H sound",
    emoji: "💨",
    sound: "/h/",
    summary: "En anglais, le H se prononce presque toujours : c'est un souffle, comme de la buée sur une vitre.",
    why: "Le français n'a plus de H prononcé. Résultat : « I 'ave a 'ouse » — ou l'inverse, un H ajouté là où il n'y en a pas (« h-eat » pour eat) par excès de zèle.",
    how: [
      "Expirez doucement comme pour faire de la buée sur des lunettes : « hhh ».",
      "Gardez la bouche dans la position de la voyelle qui suit, puis soufflez avant de la dire.",
      "Placez la main devant la bouche : sur « hat », vous sentez l'air ; sur « at », presque rien.",
      "Attention aux H muets : hour, honest, honour, heir (et herb en américain).",
    ],
    examples: [
      { word: "house", ipa: "/haʊs/" },
      { word: "happy", ipa: "/ˈhæpi/" },
      { word: "hello", ipa: "/həˈləʊ/" },
      { word: "behind", ipa: "/bɪˈhaɪnd/" },
      { word: "hour", ipa: "/ˈaʊə/", note: "H muet" },
      { word: "honest", ipa: "/ˈɒnɪst/", note: "H muet" },
    ],
    pairs: [
      { a: "hair", b: "air", ipaA: "/heə/", ipaB: "/eə/", frA: "cheveux", frB: "air" },
      { a: "heat", b: "eat", ipaA: "/hiːt/", ipaB: "/iːt/", frA: "chaleur", frB: "manger" },
      { a: "hold", b: "old", ipaA: "/həʊld/", ipaB: "/əʊld/", frA: "tenir", frB: "vieux" },
      { a: "hand", b: "and", ipaA: "/hænd/", ipaB: "/ænd/", frA: "main", frB: "et" },
      { a: "hill", b: "ill", ipaA: "/hɪl/", ipaB: "/ɪl/", frA: "colline", frB: "malade" },
      { a: "hate", b: "eight", ipaA: "/heɪt/", ipaB: "/eɪt/", frA: "détester", frB: "huit" },
    ],
    sentences: ["He has a house on the hill.", "How are you? Happy holidays!", "I hate eating at eight."],
    mistakes: [
      { wrong: "I 'ave an 'ouse", right: "I have a house", explanation: "Le H de have et house doit s'entendre. Notez aussi « a house » (et non « an ») car le H se prononce." },
      { wrong: "an hhhour", right: "an hour /ən ˈaʊə/", explanation: "Hour fait partie des rares mots au H muet : on dit donc « an hour »." },
      { wrong: "I want to h-eat", right: "I want to eat", explanation: "Ne rajoutez pas de H devant une voyelle : « heat » (chaleur) n'est pas « eat » (manger)." },
    ],
  },
  {
    id: "th",
    title: "Le TH",
    titleEn: "TH sounds",
    emoji: "👅",
    sound: "/θ/ /ð/",
    summary: "Deux sons absents du français : /θ/ sourd (think) et /ð/ sonore (this). On les fait avec la langue entre les dents.",
    why: "Faute de modèle en français, on les remplace par /s/ /z/ (« I sink », « zis ») ou par /f/ /d/. Les anglophones comprennent souvent, mais certaines confusions changent le sens : think/sink, three/free, mouth/mouse.",
    how: [
      "Posez le bout de la langue entre les dents du haut et du bas, sans mordre.",
      "Pour /θ/ (think, three) : soufflez de l'air entre la langue et les dents, sans vibration.",
      "Pour /ð/ (this, mother) : même position, mais faites vibrer la gorge (posez la main sur la gorge pour sentir).",
      "Exagérez au début devant un miroir : la langue doit être visible.",
    ],
    examples: [
      { word: "think", ipa: "/θɪŋk/" },
      { word: "three", ipa: "/θriː/" },
      { word: "birthday", ipa: "/ˈbɜːθdeɪ/" },
      { word: "the", ipa: "/ðə/" },
      { word: "this", ipa: "/ðɪs/" },
      { word: "mother", ipa: "/ˈmʌðə/" },
    ],
    pairs: [
      { a: "think", b: "sink", ipaA: "/θɪŋk/", ipaB: "/sɪŋk/", frA: "penser", frB: "évier / couler" },
      { a: "three", b: "free", ipaA: "/θriː/", ipaB: "/friː/", frA: "trois", frB: "libre / gratuit" },
      { a: "mouth", b: "mouse", ipaA: "/maʊθ/", ipaB: "/maʊs/", frA: "bouche", frB: "souris" },
      { a: "thank", b: "tank", ipaA: "/θæŋk/", ipaB: "/tæŋk/", frA: "remercier", frB: "réservoir / char" },
      { a: "they", b: "day", ipaA: "/ðeɪ/", ipaB: "/deɪ/", frA: "ils", frB: "jour" },
      { a: "then", b: "zen", ipaA: "/ðen/", ipaB: "/zen/", frA: "ensuite", frB: "zen" },
    ],
    sentences: ["Thank you for this, I think it's three thirty.", "My mother and father are together.", "There are three things I think about."],
    mistakes: [
      { wrong: "I sink so", right: "I think so", explanation: "« I sink » veut dire « je coule ». La langue doit passer entre les dents." },
      { wrong: "zis is my bruzzer", right: "this is my brother /ðɪs ɪz maɪ ˈbrʌðə/", explanation: "Le /ð/ est sonore mais se fait avec la langue entre les dents, pas comme un Z." },
      { wrong: "tree o'clock", right: "three o'clock", explanation: "« tree » = arbre. Gardez le souffle /θ/ avant le R." },
    ],
  },
  {
    id: "i-ee",
    title: "/ɪ/ court et /iː/ long",
    titleEn: "Short /ɪ/ vs long /iː/",
    emoji: "📏",
    sound: "/ɪ/ /iː/",
    summary: "L'anglais distingue un « i » court et relâché (ship) d'un « i » long et tendu (sheep). Le français n'a que le second.",
    why: "On prononce tout comme le « i » français de « si », donc ship = sheep, live = leave, it = eat. Certaines paires peuvent même devenir… embarrassantes avec des mots comme sheet, beach ou piece : prenez vraiment le temps d'allonger le /iː/ !",
    how: [
      "/ɪ/ (ship, it, live) : bouche détendue, presque entre « i » et « é », très bref.",
      "/iː/ (sheep, eat, leave) : lèvres étirées comme pour sourire, son tendu et long.",
      "Astuce : pensez « ship » ≈ « chip » rapide, et « sheep » ≈ « chiiiip » souriant.",
    ],
    examples: [
      { word: "sit", ipa: "/sɪt/" },
      { word: "big", ipa: "/bɪɡ/" },
      { word: "live", ipa: "/lɪv/" },
      { word: "see", ipa: "/siː/" },
      { word: "eat", ipa: "/iːt/" },
      { word: "people", ipa: "/ˈpiːpl/" },
    ],
    pairs: [
      { a: "ship", b: "sheep", ipaA: "/ʃɪp/", ipaB: "/ʃiːp/", frA: "bateau", frB: "mouton" },
      { a: "live", b: "leave", ipaA: "/lɪv/", ipaB: "/liːv/", frA: "vivre", frB: "partir" },
      { a: "it", b: "eat", ipaA: "/ɪt/", ipaB: "/iːt/", frA: "ça", frB: "manger" },
      { a: "fill", b: "feel", ipaA: "/fɪl/", ipaB: "/fiːl/", frA: "remplir", frB: "ressentir" },
      { a: "sit", b: "seat", ipaA: "/sɪt/", ipaB: "/siːt/", frA: "s'asseoir", frB: "siège" },
      { a: "hit", b: "heat", ipaA: "/hɪt/", ipaB: "/hiːt/", frA: "frapper", frB: "chaleur" },
    ],
    sentences: ["Please sit in this seat.", "I live here, but I leave tomorrow.", "Did you eat it?"],
    mistakes: [
      { wrong: "I leave in Paris", right: "I live in Paris /lɪv/", explanation: "Avec un /iː/ long, vous dites « je pars de Paris » au lieu de « j'habite à Paris »." },
      { wrong: "I feel the glass", right: "I fill the glass /fɪl/", explanation: "Remplir = fill (court) ; ressentir = feel (long)." },
    ],
  },
  {
    id: "a-u",
    title: "/æ/, /ʌ/ et /ɑː/",
    titleEn: "cat, cut, cart",
    emoji: "🐱",
    sound: "/æ/ /ʌ/ /ɑː/",
    summary: "Trois « a » différents : /æ/ dans cat (bouche ouverte, entre « a » et « è »), /ʌ/ dans cut (court, neutre), /ɑː/ dans cart (long et grave).",
    why: "Le français n'a qu'un « a ». On prononce donc cat, cut et cart de la même façon, ce qui crée des confusions (hat/hut, cap/cup, match/much).",
    how: [
      "/æ/ (cat, bag) : ouvrez grand la bouche, coins des lèvres tirés, dites « è » en baissant la mâchoire.",
      "/ʌ/ (cup, love, money) : son court et relâché, proche du « a » de « patte » mais plus fermé. Souvent écrit « u » ou « o ».",
      "/ɑː/ (car, father, half) : son long, au fond de la bouche, comme chez le médecin : « aaah ».",
    ],
    examples: [
      { word: "cat", ipa: "/kæt/" },
      { word: "happy", ipa: "/ˈhæpi/" },
      { word: "cup", ipa: "/kʌp/" },
      { word: "money", ipa: "/ˈmʌni/" },
      { word: "car", ipa: "/kɑː/" },
      { word: "father", ipa: "/ˈfɑːðə/" },
    ],
    pairs: [
      { a: "cat", b: "cut", ipaA: "/kæt/", ipaB: "/kʌt/", frA: "chat", frB: "couper" },
      { a: "cap", b: "cup", ipaA: "/kæp/", ipaB: "/kʌp/", frA: "casquette", frB: "tasse" },
      { a: "bag", b: "bug", ipaA: "/bæɡ/", ipaB: "/bʌɡ/", frA: "sac", frB: "insecte / bug" },
      { a: "match", b: "much", ipaA: "/mætʃ/", ipaB: "/mʌtʃ/", frA: "match", frB: "beaucoup" },
      { a: "cut", b: "cart", ipaA: "/kʌt/", ipaB: "/kɑːt/", frA: "couper", frB: "chariot" },
      { a: "hat", b: "heart", ipaA: "/hæt/", ipaB: "/hɑːt/", frA: "chapeau", frB: "cœur" },
    ],
    sentences: ["My cat loves this cup.", "How much is the match ticket?", "I parked the car in the dark."],
    mistakes: [
      { wrong: "a cap of coffee", right: "a cup of coffee /ə kʌp əv ˈkɒfi/", explanation: "Cap = casquette. Cup se prononce avec /ʌ/, comme dans love." },
      { wrong: "mo-ney (comme en français)", right: "money /ˈmʌni/", explanation: "Le « o » de money, love, come, mother se prononce /ʌ/." },
    ],
  },
  {
    id: "u-oo",
    title: "/ʊ/ court et /uː/ long",
    titleEn: "Short /ʊ/ vs long /uː/",
    emoji: "🌕",
    sound: "/ʊ/ /uː/",
    summary: "Comme pour /ɪ/–/iː/ : un « ou » court et relâché (full, book) et un « ou » long et arrondi (fool, food).",
    why: "On prononce tout comme le « ou » français, donc full = fool, pull = pool, look = Luke.",
    how: [
      "/ʊ/ (book, good, put) : lèvres peu arrondies, son très bref et détendu.",
      "/uː/ (food, blue, soon) : lèvres bien arrondies et avancées, son long.",
      "Les mots en -ook (book, look, cook) ont presque toujours le son court /ʊ/.",
    ],
    examples: [
      { word: "book", ipa: "/bʊk/" },
      { word: "good", ipa: "/ɡʊd/" },
      { word: "could", ipa: "/kʊd/", note: "L muet" },
      { word: "food", ipa: "/fuːd/" },
      { word: "blue", ipa: "/bluː/" },
      { word: "soon", ipa: "/suːn/" },
    ],
    pairs: [
      { a: "full", b: "fool", ipaA: "/fʊl/", ipaB: "/fuːl/", frA: "plein", frB: "idiot" },
      { a: "pull", b: "pool", ipaA: "/pʊl/", ipaB: "/puːl/", frA: "tirer", frB: "piscine" },
      { a: "look", b: "Luke", ipaA: "/lʊk/", ipaB: "/luːk/", frA: "regarder", frB: "Luc" },
    ],
    sentences: ["Look at this good book.", "The food was too cool.", "Pull the door, don't push it."],
    mistakes: [
      { wrong: "I'm fool (je suis plein)", right: "I'm full /fʊl/", explanation: "Après un bon repas, dites « full » court… sinon vous annoncez « je suis idiot » !" },
    ],
  },
  {
    id: "schwa",
    title: "Le schwa et les formes faibles",
    titleEn: "Schwa and weak forms",
    emoji: "🫥",
    sound: "/ə/",
    summary: "Le son le plus fréquent de l'anglais : un « e » neutre et très court /ə/. Les petits mots (to, of, can, and, for) se réduisent presque toujours à ce son.",
    why: "En français, chaque syllabe se prononce clairement. En anglais, les syllabes non accentuées et les mots grammaticaux sont « avalés ». Prononcer tout distinctement rend l'anglais haché et difficile à suivre — et empêche de comprendre les natifs.",
    how: [
      "/ə/ : bouche détendue, langue au repos, un « euh » très bref.",
      "Les mots grammaticaux se réduisent : to → /tə/, of → /əv/, for → /fə/, and → /ən/, can → /kən/.",
      "Dans les mots longs, les syllabes non accentuées passent souvent au schwa : banana /bəˈnɑːnə/, doctor /ˈdɒktə/.",
      "Attention : « I can » se dit /kən/ (faible) mais « I can't » /kɑːnt/ garde une voyelle pleine — c'est ainsi qu'on les distingue.",
    ],
    examples: [
      { word: "about", ipa: "/əˈbaʊt/" },
      { word: "banana", ipa: "/bəˈnɑːnə/" },
      { word: "doctor", ipa: "/ˈdɒktə/" },
      { word: "a cup of tea", ipa: "/ə ˈkʌp əv ˈtiː/" },
      { word: "I can swim", ipa: "/aɪ kən ˈswɪm/" },
      { word: "fish and chips", ipa: "/ˈfɪʃ ən ˈtʃɪps/" },
    ],
    pairs: [
      { a: "I can go.", b: "I can't go.", ipaA: "/aɪ kən ˈɡəʊ/", ipaB: "/aɪ ˈkɑːnt ˈɡəʊ/", frA: "je peux y aller", frB: "je ne peux pas y aller" },
    ],
    sentences: ["I want to go to the shop.", "Can you come for a cup of tea?", "It was a lot of fun."],
    mistakes: [
      { wrong: "I want TOO go TOO the shop", right: "I wanna go tə the shop", explanation: "« to » non accentué se réduit à /tə/ ; à l'oral familier, want to devient même « wanna »." },
      { wrong: "I CAN swim (accentué)", right: "I can swim /kən/", explanation: "Si vous accentuez « can », on risque de comprendre « can't »." },
    ],
  },
  {
    id: "word-stress",
    title: "L'accent tonique des mots",
    titleEn: "Word stress",
    emoji: "🎯",
    sound: "ˈ",
    summary: "Chaque mot anglais a une syllabe plus forte, plus longue et plus haute. Se tromper de syllabe gêne plus la compréhension qu'une voyelle imparfaite.",
    why: "En français, on accentue régulièrement la dernière syllabe (photo-gra-PHIE). Transposé en anglais, cela donne « comforTABLE » ou « deveLOP », souvent incompréhensibles.",
    how: [
      "Repérez la syllabe accentuée dans le dictionnaire : elle suit le signe ˈ dans la transcription.",
      "Exagérez-la : plus forte, plus longue, plus haute. Les autres syllabes deviennent faibles (souvent /ə/).",
      "Beaucoup de noms de deux syllabes sont accentués sur la première (TAble, HAPpy), beaucoup de verbes sur la seconde (be-GIN, de-CIDE).",
      "Les mots en -tion, -ic, -ity accentuent la syllabe juste avant : inforMAtion, phoTOgraphy, elecTRIcity.",
    ],
    examples: [
      { word: "photograph", ipa: "/ˈfəʊtəɡrɑːf/" },
      { word: "photography", ipa: "/fəˈtɒɡrəfi/" },
      { word: "photographic", ipa: "/ˌfəʊtəˈɡræfɪk/" },
      { word: "comfortable", ipa: "/ˈkʌmftəbl/" },
      { word: "develop", ipa: "/dɪˈveləp/" },
      { word: "hotel", ipa: "/həʊˈtel/" },
    ],
    sentences: ["I took a photograph of the hotel.", "This chair is very comfortable.", "It's an important economic decision."],
    mistakes: [
      { wrong: "comfor-TABLE", right: "COMF-ta-ble /ˈkʌmftəbl/", explanation: "Accent sur la première syllabe, et le « or » disparaît presque." },
      { wrong: "deve-LOP", right: "de-VE-lop /dɪˈveləp/", explanation: "Accent sur la deuxième syllabe." },
      { wrong: "VE-ge-TA-ble", right: "VEG-ta-ble /ˈvedʒtəbl/", explanation: "Trois syllabes seulement, accent sur la première." },
    ],
    tap: {
      prompt: "Touchez la syllabe accentuée",
      promptEn: "Tap the stressed syllable",
      items: [
        { word: "photograph", parts: ["pho", "to", "graph"], answer: 0, ipa: "/ˈfəʊtəɡrɑːf/" },
        { word: "photography", parts: ["pho", "to", "gra", "phy"], answer: 1, ipa: "/fəˈtɒɡrəfi/" },
        { word: "photographic", parts: ["pho", "to", "gra", "phic"], answer: 2, ipa: "/ˌfəʊtəˈɡræfɪk/" },
        { word: "comfortable", parts: ["com", "for", "ta", "ble"], answer: 0, ipa: "/ˈkʌmftəbl/" },
        { word: "develop", parts: ["de", "ve", "lop"], answer: 1, ipa: "/dɪˈveləp/" },
        { word: "hotel", parts: ["ho", "tel"], answer: 1, ipa: "/həʊˈtel/" },
        { word: "important", parts: ["im", "por", "tant"], answer: 1, ipa: "/ɪmˈpɔːtnt/" },
        { word: "interesting", parts: ["in", "te", "res", "ting"], answer: 0, ipa: "/ˈɪntrəstɪŋ/" },
        { word: "banana", parts: ["ba", "na", "na"], answer: 1, ipa: "/bəˈnɑːnə/" },
        { word: "computer", parts: ["com", "pu", "ter"], answer: 1, ipa: "/kəmˈpjuːtə/" },
        { word: "hospital", parts: ["hos", "pi", "tal"], answer: 0, ipa: "/ˈhɒspɪtl/" },
        { word: "Japanese", parts: ["Ja", "pa", "nese"], answer: 2, ipa: "/ˌdʒæpəˈniːz/" },
        { word: "restaurant", parts: ["res", "tau", "rant"], answer: 0, ipa: "/ˈrestrɒnt/" },
        { word: "information", parts: ["in", "for", "ma", "tion"], answer: 2, ipa: "/ˌɪnfəˈmeɪʃn/" },
        { word: "decide", parts: ["de", "cide"], answer: 1, ipa: "/dɪˈsaɪd/" },
        { word: "chocolate", parts: ["choc", "late"], answer: 0, ipa: "/ˈtʃɒklət/" },
      ],
    },
  },
  {
    id: "rhythm",
    title: "Accent de phrase et rythme",
    titleEn: "Sentence stress and rhythm",
    emoji: "🥁",
    sound: "● • ●",
    summary: "L'anglais est une langue « accentuelle » : on appuie sur les mots qui portent le sens (noms, verbes, adjectifs) et on glisse sur les petits mots.",
    why: "Le français donne à chaque syllabe à peu près la même durée. En anglais, ce rythme régulier sonne mécanique, et le message important ne ressort pas.",
    how: [
      "Accentuez les mots de contenu : noms, verbes principaux, adjectifs, adverbes, négations (can't, don't).",
      "Réduisez les mots grammaticaux : articles, prépositions, pronoms, auxiliaires (a, the, to, of, you, can).",
      "Le mot le plus fort est en général le dernier mot important de la phrase : I'd like a cup of TEA.",
      "Tapez le rythme dans les mains : da-DUM-da-da-DUM.",
    ],
    examples: [
      { word: "I'd like a cup of tea.", ipa: "/aɪd ˈlaɪk ə ˈkʌp əv ˈtiː/" },
      { word: "Where do you live?", ipa: "/ˈweə dʒə ˈlɪv/" },
      { word: "I don't want to go.", ipa: "/aɪ ˈdəʊnt ˈwɒnə ˈɡəʊ/" },
    ],
    sentences: ["I'd like a cup of tea, please.", "What are you doing at the weekend?", "I want to go to the beach."],
    mistakes: [
      { wrong: "I – WANT – TO – GO – TO – THE – BEACH (tout égal)", right: "I WANT to GO to the BEACH", explanation: "Les mots grammaticaux sont courts et faibles ; les mots de sens ressortent." },
    ],
    tap: {
      prompt: "Touchez le mot le plus accentué de la phrase",
      promptEn: "Tap the most stressed word",
      items: [
        { word: "I'd like a cup of tea.", parts: ["I'd", "like", "a", "cup", "of", "tea"], answer: 5 },
        { word: "What's your name?", parts: ["What's", "your", "name"], answer: 2 },
        { word: "I want to go to the beach.", parts: ["I", "want", "to", "go", "to", "the", "beach"], answer: 6 },
        { word: "Where do you live?", parts: ["Where", "do", "you", "live"], answer: 3 },
        { word: "It was a great party.", parts: ["It", "was", "a", "great", "party"], answer: 4 },
        { word: "Can you help me with this?", parts: ["Can", "you", "help", "me", "with", "this"], answer: 2 },
      ],
    },
  },
  {
    id: "r",
    title: "Le R anglais",
    titleEn: "The English R",
    emoji: "🌀",
    sound: "/r/",
    summary: "Le R anglais ne se fait pas dans la gorge : la langue se recourbe légèrement vers l'arrière sans toucher le palais. En anglais britannique, il est muet en fin de syllabe (car, bird).",
    why: "Le R français, raclé au fond de la gorge, est l'un des marqueurs d'accent les plus forts. Il peut aussi rapprocher right de light ou wrong de long.",
    how: [
      "Arrondissez un peu les lèvres, comme pour « ou ».",
      "Relevez le bout de la langue vers le haut et l'arrière, sans toucher le palais ni les dents.",
      "Rien ne doit vibrer au fond de la gorge.",
      "En anglais britannique, ne prononcez pas le R s'il n'est pas suivi d'une voyelle : car /kɑː/, bird /bɜːd/, here /hɪə/.",
    ],
    examples: [
      { word: "red", ipa: "/red/" },
      { word: "right", ipa: "/raɪt/" },
      { word: "very", ipa: "/ˈveri/" },
      { word: "sorry", ipa: "/ˈsɒri/" },
      { word: "car", ipa: "/kɑː/", note: "R muet (UK)" },
      { word: "world", ipa: "/wɜːld/", note: "R muet (UK)" },
    ],
    pairs: [
      { a: "right", b: "light", ipaA: "/raɪt/", ipaB: "/laɪt/", frA: "droite / juste", frB: "lumière" },
      { a: "road", b: "load", ipaA: "/rəʊd/", ipaB: "/ləʊd/", frA: "route", frB: "charge" },
      { a: "wrong", b: "long", ipaA: "/rɒŋ/", ipaB: "/lɒŋ/", frA: "faux", frB: "long" },
      { a: "pray", b: "play", ipaA: "/preɪ/", ipaB: "/pleɪ/", frA: "prier", frB: "jouer" },
    ],
    sentences: ["Turn right at the red light.", "I'm really sorry, I was wrong.", "The road around the river is very pretty."],
    mistakes: [
      { wrong: "R raclé dans la gorge", right: "R avec la langue recourbée, sans friction", explanation: "Pensez à commencer le mot par un très léger « ou » : « (ou)red »." },
      { wrong: "carrr, birrrd", right: "car /kɑː/, bird /bɜːd/", explanation: "En anglais britannique, le R final ne se prononce pas (il se prononce en américain)." },
    ],
  },
  {
    id: "ed",
    title: "La terminaison -ED",
    titleEn: "-ED endings",
    emoji: "⏮️",
    sound: "/t/ /d/ /ɪd/",
    summary: "Le -ed du passé se prononce de trois façons : /t/ (worked), /d/ (played), /ɪd/ (wanted). On n'ajoute une syllabe que si le verbe finit par le son t ou d.",
    why: "On a tendance à prononcer « work-ED » avec une syllabe en plus, ou au contraire à ne rien prononcer du tout (« I work yesterday »), ce qui efface le passé.",
    how: [
      "Après les sons t ou d → /ɪd/, une syllabe en plus : wanted, needed, decided.",
      "Après un son sourd (p, k, s, ʃ, tʃ, f, θ) → /t/ : worked, stopped, watched, laughed.",
      "Après un son sonore (voyelles, b, g, l, m, n, v, z…) → /d/ : played, lived, called, opened.",
      "Liez avec le mot suivant : « I worked on it » → /aɪ ˈwɜːk tɒn ɪt/.",
    ],
    examples: [
      { word: "worked", ipa: "/wɜːkt/" },
      { word: "played", ipa: "/pleɪd/" },
      { word: "wanted", ipa: "/ˈwɒntɪd/" },
      { word: "watched", ipa: "/wɒtʃt/" },
      { word: "lived", ipa: "/lɪvd/" },
      { word: "needed", ipa: "/ˈniːdɪd/" },
    ],
    pairs: [
      { a: "I worked there.", b: "I work there.", ipaA: "/aɪ ˈwɜːkt ðeə/", ipaB: "/aɪ ˈwɜːk ðeə/", frA: "j'ai travaillé là-bas", frB: "je travaille là-bas" },
      { a: "We played tennis.", b: "We play tennis.", ipaA: "/wi ˈpleɪd ˈtenɪs/", ipaB: "/wi ˈpleɪ ˈtenɪs/" },
    ],
    sentences: ["I worked late and watched a film.", "She wanted to stay, so we waited.", "They lived in London and loved it."],
    mistakes: [
      { wrong: "work-ED /wɜːkɪd/", right: "worked /wɜːkt/", explanation: "Une seule syllabe : le -ed se réduit à /t/." },
      { wrong: "I work yesterday", right: "I worked yesterday", explanation: "Sans le /t/ final, on n'entend plus le passé." },
    ],
    sort: {
      prompt: "Comment se prononce la terminaison -ed ?",
      promptEn: "How is the -ed ending pronounced?",
      categories: [
        { id: "t", label: "/t/", ipa: "worked" },
        { id: "d", label: "/d/", ipa: "played" },
        { id: "id", label: "/ɪd/", ipa: "wanted" },
      ],
      items: [
        { text: "worked", cat: "t", ipa: "/wɜːkt/" },
        { text: "played", cat: "d", ipa: "/pleɪd/" },
        { text: "wanted", cat: "id", ipa: "/ˈwɒntɪd/" },
        { text: "stopped", cat: "t", ipa: "/stɒpt/" },
        { text: "lived", cat: "d", ipa: "/lɪvd/" },
        { text: "needed", cat: "id", ipa: "/ˈniːdɪd/" },
        { text: "watched", cat: "t", ipa: "/wɒtʃt/" },
        { text: "called", cat: "d", ipa: "/kɔːld/" },
        { text: "decided", cat: "id", ipa: "/dɪˈsaɪdɪd/" },
        { text: "laughed", cat: "t", ipa: "/lɑːft/" },
        { text: "opened", cat: "d", ipa: "/ˈəʊpənd/" },
        { text: "started", cat: "id", ipa: "/ˈstɑːtɪd/" },
        { text: "asked", cat: "t", ipa: "/ɑːskt/" },
        { text: "cleaned", cat: "d", ipa: "/kliːnd/" },
        { text: "visited", cat: "id", ipa: "/ˈvɪzɪtɪd/" },
        { text: "washed", cat: "t", ipa: "/wɒʃt/" },
      ],
    },
  },
  {
    id: "s",
    title: "Le -S final",
    titleEn: "Final -S",
    emoji: "🐍",
    sound: "/s/ /z/ /ɪz/",
    summary: "Le -s du pluriel et de la 3ᵉ personne (he works) se prononce toujours, de trois façons : /s/ (cats), /z/ (dogs), /ɪz/ (buses).",
    why: "En français, le -s final est muet. On l'oublie donc à l'oral (« he work », « two cat »), ce qui s'entend comme une faute de grammaire.",
    how: [
      "Après les sons s, z, ʃ, ʒ, tʃ, dʒ → /ɪz/, une syllabe en plus : buses, watches, changes.",
      "Après un son sourd (p, t, k, f, θ) → /s/ : cats, books, works.",
      "Après un son sonore (voyelles, b, d, g, l, m, n, v…) → /z/ : dogs, plays, goes, loves.",
      "Exagérez au début : « he work-SSS » vaut mieux que « he work ».",
    ],
    examples: [
      { word: "cats", ipa: "/kæts/" },
      { word: "dogs", ipa: "/dɒɡz/" },
      { word: "buses", ipa: "/ˈbʌsɪz/" },
      { word: "works", ipa: "/wɜːks/" },
      { word: "goes", ipa: "/ɡəʊz/" },
      { word: "watches", ipa: "/ˈwɒtʃɪz/" },
    ],
    pairs: [
      { a: "He works here.", b: "We work here.", ipaA: "/hi ˈwɜːks hɪə/", ipaB: "/wi ˈwɜːk hɪə/", frA: "il travaille ici", frB: "nous travaillons ici" },
      { a: "the cats", b: "the cat", ipaA: "/ðə ˈkæts/", ipaB: "/ðə ˈkæt/", frA: "les chats", frB: "le chat" },
    ],
    sentences: ["She works in a shop and likes it.", "My friends have two dogs and three cats.", "He watches films and plays games."],
    mistakes: [
      { wrong: "he like football", right: "he likes football /laɪks/", explanation: "La 3ᵉ personne prend un -s qui doit s'entendre." },
      { wrong: "two horse", right: "two horses /ˈhɔːsɪz/", explanation: "Après un son s, le pluriel ajoute une syllabe /ɪz/." },
    ],
    sort: {
      prompt: "Comment se prononce le -s final ?",
      promptEn: "How is the final -s pronounced?",
      categories: [
        { id: "s", label: "/s/", ipa: "cats" },
        { id: "z", label: "/z/", ipa: "dogs" },
        { id: "iz", label: "/ɪz/", ipa: "buses" },
      ],
      items: [
        { text: "cats", cat: "s", ipa: "/kæts/" },
        { text: "dogs", cat: "z", ipa: "/dɒɡz/" },
        { text: "buses", cat: "iz", ipa: "/ˈbʌsɪz/" },
        { text: "books", cat: "s", ipa: "/bʊks/" },
        { text: "plays", cat: "z", ipa: "/pleɪz/" },
        { text: "watches", cat: "iz", ipa: "/ˈwɒtʃɪz/" },
        { text: "likes", cat: "s", ipa: "/laɪks/" },
        { text: "goes", cat: "z", ipa: "/ɡəʊz/" },
        { text: "misses", cat: "iz", ipa: "/ˈmɪsɪz/" },
        { text: "maps", cat: "s", ipa: "/mæps/" },
        { text: "eyes", cat: "z", ipa: "/aɪz/" },
        { text: "roses", cat: "iz", ipa: "/ˈrəʊzɪz/" },
        { text: "works", cat: "s", ipa: "/wɜːks/" },
        { text: "loves", cat: "z", ipa: "/lʌvz/" },
        { text: "changes", cat: "iz", ipa: "/ˈtʃeɪndʒɪz/" },
      ],
    },
  },
  {
    id: "ing",
    title: "Le son -ING",
    titleEn: "The -ING sound",
    emoji: "🔔",
    sound: "/ŋ/",
    summary: "Le « ng » anglais est un seul son nasal /ŋ/, fait au fond de la bouche, sans « g » prononcé à la fin : sing /sɪŋ/.",
    why: "On a tendance à dire « sing-gue », ou à nasaliser comme en français (« parking » prononcé « parkine »). On confond aussi win/wing, thin/thing.",
    how: [
      "Le dos de la langue touche le fond du palais (comme pour un « g »), mais l'air sort par le nez.",
      "Ne relâchez pas un « g » à la fin : sing ≠ « sing-gue ». Exception : finger, longer, English ont un /ŋɡ/.",
      "La voyelle avant -ing reste /ɪ/ court : morning /ˈmɔːnɪŋ/.",
    ],
    examples: [
      { word: "sing", ipa: "/sɪŋ/" },
      { word: "morning", ipa: "/ˈmɔːnɪŋ/" },
      { word: "thing", ipa: "/θɪŋ/" },
      { word: "singer", ipa: "/ˈsɪŋə/", note: "pas de g" },
      { word: "finger", ipa: "/ˈfɪŋɡə/", note: "avec g" },
      { word: "English", ipa: "/ˈɪŋɡlɪʃ/" },
    ],
    pairs: [
      { a: "sing", b: "sin", ipaA: "/sɪŋ/", ipaB: "/sɪn/", frA: "chanter", frB: "péché" },
      { a: "thing", b: "thin", ipaA: "/θɪŋ/", ipaB: "/θɪn/", frA: "chose", frB: "mince" },
      { a: "wing", b: "win", ipaA: "/wɪŋ/", ipaB: "/wɪn/", frA: "aile", frB: "gagner" },
      { a: "rang", b: "ran", ipaA: "/ræŋ/", ipaB: "/ræn/", frA: "a sonné", frB: "a couru" },
    ],
    sentences: ["I'm going shopping this morning.", "She was singing something amazing.", "Nothing is working."],
    mistakes: [
      { wrong: "sing-gue, thing-gue", right: "sing /sɪŋ/, thing /θɪŋ/", explanation: "Le son s'arrête sur la nasale, sans « g » relâché." },
    ],
  },
  {
    id: "diphthongs",
    title: "Les diphtongues",
    titleEn: "Diphthongs",
    emoji: "🎢",
    sound: "/eɪ/ /əʊ/ /aɪ/",
    summary: "Beaucoup de voyelles anglaises « glissent » d'un son à un autre : day /deɪ/, go /ɡəʊ/, my /maɪ/. En français, les voyelles sont pures.",
    why: "On dit « go » comme le « gros » français, « day » comme « dé ». Cela crée des confusions : wait/wet, late/let, coat/caught.",
    how: [
      "/eɪ/ (day, wait, late) : partez de « é » et glissez vers « i ».",
      "/əʊ/ (go, home, no — UK) : partez d'un « euh » et finissez vers « ou ».",
      "/aɪ/ (my, time), /aʊ/ (now, house), /ɔɪ/ (boy) : glissez nettement d'un son à l'autre.",
      "Faites durer le glissement : c'est lui qui rend le mot reconnaissable.",
    ],
    examples: [
      { word: "day", ipa: "/deɪ/" },
      { word: "go", ipa: "/ɡəʊ/" },
      { word: "home", ipa: "/həʊm/" },
      { word: "time", ipa: "/taɪm/" },
      { word: "now", ipa: "/naʊ/" },
      { word: "boy", ipa: "/bɔɪ/" },
    ],
    pairs: [
      { a: "wait", b: "wet", ipaA: "/weɪt/", ipaB: "/wet/", frA: "attendre", frB: "mouillé" },
      { a: "late", b: "let", ipaA: "/leɪt/", ipaB: "/let/", frA: "en retard", frB: "laisser" },
      { a: "coat", b: "caught", ipaA: "/kəʊt/", ipaB: "/kɔːt/", frA: "manteau", frB: "attrapé" },
      { a: "boat", b: "bought", ipaA: "/bəʊt/", ipaB: "/bɔːt/", frA: "bateau", frB: "acheté" },
      { a: "no", b: "now", ipaA: "/nəʊ/", ipaB: "/naʊ/", frA: "non", frB: "maintenant" },
    ],
    sentences: ["Wait, I'm late! Let's go home.", "I bought a boat and a new coat.", "Don't go now, stay a day or two."],
    mistakes: [
      { wrong: "go (comme « gros »)", right: "go /ɡəʊ/", explanation: "Le son glisse de « euh » vers « ou »." },
      { wrong: "I'm let", right: "I'm late /leɪt/", explanation: "Sans le glissement /eɪ/, late devient let (laisser)." },
    ],
  },
  {
    id: "w-v-ch",
    title: "W, V, CH et J",
    titleEn: "W, V, CH and J",
    emoji: "🔤",
    sound: "/w/ /v/ /tʃ/ /dʒ/",
    summary: "Le W est un « ou » rapide (west), le V se fait dents sur la lèvre (vest). CH se dit /tʃ/ (« tch ») et J se dit /dʒ/ (« dj »).",
    why: "Les francophones prononcent souvent CH comme « ch » français (chips → « ships ») et J comme « j » français (jam → « jamme »). Le W et le V sont aussi parfois inversés.",
    how: [
      "W : arrondissez les lèvres comme pour « ou », puis ouvrez vite : west = « ouest ».",
      "V : dents du haut posées sur la lèvre inférieure, avec vibration.",
      "CH /tʃ/ (chips, cheese, watch) : un petit « t » collé au « ch » : « tchips ».",
      "J /dʒ/ (jam, job, June, age) : un petit « d » collé au « j » : « djob ».",
    ],
    examples: [
      { word: "west", ipa: "/west/" },
      { word: "very", ipa: "/ˈveri/" },
      { word: "cheese", ipa: "/tʃiːz/" },
      { word: "watch", ipa: "/wɒtʃ/" },
      { word: "job", ipa: "/dʒɒb/" },
      { word: "change", ipa: "/tʃeɪndʒ/" },
    ],
    pairs: [
      { a: "chips", b: "ships", ipaA: "/tʃɪps/", ipaB: "/ʃɪps/", frA: "frites", frB: "bateaux" },
      { a: "cheap", b: "sheep", ipaA: "/tʃiːp/", ipaB: "/ʃiːp/", frA: "bon marché", frB: "mouton" },
      { a: "chair", b: "share", ipaA: "/tʃeə/", ipaB: "/ʃeə/", frA: "chaise", frB: "partager" },
      { a: "watch", b: "wash", ipaA: "/wɒtʃ/", ipaB: "/wɒʃ/", frA: "regarder / montre", frB: "laver" },
      { a: "west", b: "vest", ipaA: "/west/", ipaB: "/vest/", frA: "ouest", frB: "maillot de corps / gilet" },
      { a: "wine", b: "vine", ipaA: "/waɪn/", ipaB: "/vaɪn/", frA: "vin", frB: "vigne" },
    ],
    sentences: ["I'd like fish and chips and a cheap wine.", "Which chair is yours?", "John changed jobs in June."],
    mistakes: [
      { wrong: "fish and ships", right: "fish and chips /tʃɪps/", explanation: "Sans le « t », vous commandez des bateaux !" },
      { wrong: "jam (j français)", right: "jam /dʒæm/", explanation: "Le J anglais commence par un petit « d »." },
    ],
  },
  {
    id: "silent",
    title: "Les lettres muettes",
    titleEn: "Silent letters",
    emoji: "🤫",
    sound: "—",
    summary: "Beaucoup de mots courants contiennent des lettres qui ne se prononcent pas : knife, walk, island, Wednesday.",
    why: "Le français lit (presque) toutes les consonnes en début et milieu de mot. On prononce donc le K de knife, le L de walk ou le S d'island — et le mot devient difficile à reconnaître.",
    how: [
      "KN- en début de mot : le K est muet (know, knife, knee).",
      "WR- : le W est muet (write, wrong).",
      "-ALK / -ALF : le L est muet (walk, talk, half, could, should, would).",
      "-MB : le B est muet (climb, comb, lamb) ; -STLE / -STEN : le T est muet (castle, listen).",
      "Mots à retenir : Wednesday /ˈwenzdeɪ/, comfortable /ˈkʌmftəbl/, vegetable /ˈvedʒtəbl/, island /ˈaɪlənd/.",
    ],
    examples: [
      { word: "knife", ipa: "/naɪf/" },
      { word: "walk", ipa: "/wɔːk/" },
      { word: "island", ipa: "/ˈaɪlənd/" },
      { word: "Wednesday", ipa: "/ˈwenzdeɪ/" },
      { word: "listen", ipa: "/ˈlɪsn/" },
      { word: "climb", ipa: "/klaɪm/" },
    ],
    sentences: ["I walked to the island on Wednesday.", "Listen, I know you're comfortable here.", "He climbed the castle wall with a knife."],
    mistakes: [
      { wrong: "k-nife, wal-k", right: "knife /naɪf/, walk /wɔːk/", explanation: "Le K et le L sont muets." },
      { wrong: "Wed-nes-day", right: "Wednesday /ˈwenzdeɪ/", explanation: "Deux syllabes seulement : « wenz-dey »." },
    ],
    tap: {
      prompt: "Touchez la lettre muette",
      promptEn: "Tap the silent letter",
      items: [
        { word: "knife", parts: ["k", "n", "i", "f", "e"], answer: 0, ipa: "/naɪf/" },
        { word: "walk", parts: ["w", "a", "l", "k"], answer: 2, ipa: "/wɔːk/" },
        { word: "island", parts: ["i", "s", "l", "a", "n", "d"], answer: 1, ipa: "/ˈaɪlənd/" },
        { word: "listen", parts: ["l", "i", "s", "t", "e", "n"], answer: 3, ipa: "/ˈlɪsn/" },
        { word: "climb", parts: ["c", "l", "i", "m", "b"], answer: 4, ipa: "/klaɪm/" },
        { word: "doubt", parts: ["d", "o", "u", "b", "t"], answer: 3, ipa: "/daʊt/" },
        { word: "write", parts: ["w", "r", "i", "t", "e"], answer: 0, ipa: "/raɪt/" },
        { word: "half", parts: ["h", "a", "l", "f"], answer: 2, ipa: "/hɑːf/" },
        { word: "castle", parts: ["c", "a", "s", "t", "l", "e"], answer: 3, ipa: "/ˈkɑːsl/" },
        { word: "hour", parts: ["h", "o", "u", "r"], answer: 0, ipa: "/ˈaʊə/" },
        { word: "receipt", parts: ["r", "e", "c", "e", "i", "p", "t"], answer: 5, ipa: "/rɪˈsiːt/" },
        { word: "knee", parts: ["k", "n", "e", "e"], answer: 0, ipa: "/niː/" },
      ],
    },
  },
  {
    id: "intonation",
    title: "L'intonation des questions",
    titleEn: "Question intonation",
    emoji: "🎵",
    sound: "↗ ↘",
    summary: "Les questions fermées (réponse oui/non) montent à la fin ↗. Les questions ouvertes (what, where, how…) descendent ↘, comme les affirmations.",
    why: "En français, on fait souvent monter toutes les questions. En anglais, une question en « wh- » qui monte peut sonner surprise ou insistante, et une affirmation qui monte sonne incertaine.",
    how: [
      "Yes/No questions (Do you…? Are you…? Can you…?) : la voix monte sur le dernier mot important ↗.",
      "Wh- questions (What, Where, When, Why, How…) : la voix descend à la fin ↘.",
      "Affirmations : la voix descend ↘ — sinon on a l'air de demander une confirmation.",
      "Question tags pour vérifier (« It's nice, isn't it? ») : ↘ si vous êtes sûr, ↗ si vous demandez vraiment.",
    ],
    examples: [
      { word: "Are you ready?", ipa: "↗" },
      { word: "Where do you live?", ipa: "↘" },
      { word: "Can you help me?", ipa: "↗" },
      { word: "What time is it?", ipa: "↘" },
    ],
    sentences: ["Do you like coffee?", "How was your weekend?", "Is this seat free?"],
    mistakes: [
      { wrong: "Where do you live ↗ ?", right: "Where do you live ↘ ?", explanation: "Les questions en wh- descendent : la montée peut sonner étonnée." },
    ],
    sort: {
      prompt: "La voix monte ↗ ou descend ↘ à la fin ?",
      promptEn: "Does the voice rise ↗ or fall ↘ at the end?",
      categories: [
        { id: "up", label: "↗ monte" },
        { id: "down", label: "↘ descend" },
      ],
      items: [
        { text: "Are you ready?", cat: "up" },
        { text: "Where do you live?", cat: "down" },
        { text: "Do you like coffee?", cat: "up" },
        { text: "What time is it?", cat: "down" },
        { text: "Can you help me?", cat: "up" },
        { text: "How are you?", cat: "down" },
        { text: "Is this seat free?", cat: "up" },
        { text: "Why are you late?", cat: "down" },
        { text: "I live in Lyon.", cat: "down" },
        { text: "Have you been to London?", cat: "up" },
      ],
    },
  },
];

export function getPronLesson(id: string): PronLesson | undefined {
  return PRON_LESSONS.find((l) => l.id === id);
}

/** Read-aloud sentences packed with traps, used by the global « Bilan ». */
export const TRAP_SENTENCES: { text: string; lesson: string }[] = [
  { text: "I think three of them are here.", lesson: "th" },
  { text: "He has a house on the hill.", lesson: "h" },
  { text: "Please sit in this seat.", lesson: "i-ee" },
  { text: "I worked late and watched a film.", lesson: "ed" },
  { text: "She likes cats and dogs.", lesson: "s" },
  { text: "Turn right at the red light.", lesson: "r" },
  { text: "Wait, I'm late! Let's go home.", lesson: "diphthongs" },
  { text: "I'd like fish and chips, please.", lesson: "w-v-ch" },
];

export const PRON_PROGRESS_KEY = "fluent30.pron.progress";
export const PRON_BILAN_KEY = "fluent30.pron.lastBilan";
