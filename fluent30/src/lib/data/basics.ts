// "Les bases" — illustrated basic lessons (original content written for Fluent30).
import type { Emotion, Weather, Shape, BodyPart } from "@/components/basics/Illustrations";

export type BasicVisual =
  | { kind: "emotion"; id: Emotion }
  | { kind: "weather"; id: Weather }
  | { kind: "shape"; id: Shape; color?: string }
  | { kind: "color"; hex: string }
  | { kind: "body"; id: BodyPart }
  | { kind: "big"; text: string };

export interface BasicItem {
  en: string;
  fr: string;
  ex?: string;
  exFr?: string;
  pos?: string;
  visual?: BasicVisual;
}

export interface BasicSection {
  title: string;
  text?: string; // short French explanation
  items: BasicItem[];
  grid?: boolean; // show items as illustrated tiles
}

export interface BasicLesson {
  id: string;
  title: string;
  titleEn: string;
  emoji: string;
  tone: string; // tailwind gradient
  theme: string; // vocabulary theme id (lib/data/types THEMES)
  intro: string;
  special?: "numbers" | "clock" | "timeline" | "family";
  sections: BasicSection[];
  tips?: string[];
}

const big = (text: string): BasicVisual => ({ kind: "big", text });

export const BASIC_LESSONS: BasicLesson[] = [
  {
    id: "numbers",
    title: "Les nombres",
    titleEn: "Numbers",
    emoji: "🔢",
    tone: "from-[#6a55f2] to-[#4a32bb]",
    theme: "numbers",
    intro: "Indispensables pour les prix, l'heure, les adresses et les numéros de téléphone. Bonne nouvelle : après 20, tout se construit avec quelques briques.",
    special: "numbers",
    sections: [
      {
        title: "De 0 à 20",
        text: "À apprendre par cœur : ce sont les seuls nombres vraiment irréguliers. Attention à la différence entre thirteen (13) et thirty (30) : l'accent tombe sur la fin pour 13 (thirTEEN) et sur le début pour 30 (THIRty).",
        grid: true,
        items: [
          ["zero", "zéro", 0], ["one", "un", 1], ["two", "deux", 2], ["three", "trois", 3], ["four", "quatre", 4], ["five", "cinq", 5], ["six", "six", 6],
          ["seven", "sept", 7], ["eight", "huit", 8], ["nine", "neuf", 9], ["ten", "dix", 10], ["eleven", "onze", 11], ["twelve", "douze", 12],
          ["thirteen", "treize", 13], ["fourteen", "quatorze", 14], ["fifteen", "quinze", 15], ["sixteen", "seize", 16], ["seventeen", "dix-sept", 17],
          ["eighteen", "dix-huit", 18], ["nineteen", "dix-neuf", 19], ["twenty", "vingt", 20],
        ].map(([en, fr, n]) => ({ en: en as string, fr: fr as string, pos: "num", visual: big(String(n)) })),
      },
      {
        title: "Les dizaines",
        text: "Pour 21 à 99 : dizaine + tiret + unité (twenty-one, fifty-six). Pas de « soixante-dix » ni de « quatre-vingts » : seventy (70) et eighty (80) sont réguliers !",
        grid: true,
        items: [
          ["thirty", "trente", 30], ["forty", "quarante", 40], ["fifty", "cinquante", 50], ["sixty", "soixante", 60], ["seventy", "soixante-dix", 70],
          ["eighty", "quatre-vingts", 80], ["ninety", "quatre-vingt-dix", 90], ["twenty-one", "vingt et un", 21], ["ninety-nine", "quatre-vingt-dix-neuf", 99],
        ].map(([en, fr, n]) => ({ en: en as string, fr: fr as string, pos: "num", visual: big(String(n)) })),
      },
      {
        title: "Les grands nombres",
        text: "En anglais britannique, on dit « and » après hundred : one hundred and five. Les Américains disent souvent « one hundred five ». Pas de « s » à hundred / thousand / million après un chiffre : two hundred, three thousand.",
        items: [
          { en: "a hundred / one hundred", fr: "cent", pos: "num", visual: big("100"), ex: "There were about a hundred people.", exFr: "Il y avait une centaine de personnes." },
          { en: "a thousand", fr: "mille", pos: "num", visual: big("1 000"), ex: "It costs a thousand euros.", exFr: "Ça coûte mille euros." },
          { en: "a million", fr: "un million", pos: "num", visual: big("1 000 000"), ex: "The city has three million people.", exFr: "La ville compte trois millions d'habitants." },
          { en: "a billion", fr: "un milliard", pos: "num", visual: big("10⁹"), ex: "A billion is a thousand million.", exFr: "Un « billion » anglais = un milliard français !" },
          { en: "dozens of", fr: "des dizaines de", pos: "expr", ex: "I've told you dozens of times!", exFr: "Je te l'ai dit des dizaines de fois !" },
        ],
      },
      {
        title: "Prix, années, téléphone",
        text: "Le point remplace la virgule : 2.50 se lit « two fifty » ou « two pounds fifty ». Les années se lisent par paires : 1998 = nineteen ninety-eight, 2024 = twenty twenty-four. Au téléphone, on dit chaque chiffre, 0 se dit « oh » et deux chiffres identiques « double ».",
        items: [
          { en: "How much is it?", fr: "C'est combien ?", pos: "phrase", ex: "How much is it? — It's five ninety-nine.", exFr: "C'est combien ? — 5,99." },
          { en: "two pounds fifty", fr: "2,50 £", pos: "expr", visual: big("£2.50") },
          { en: "nineteen ninety-eight", fr: "1998", pos: "expr", visual: big("1998") },
          { en: "twenty twenty-four", fr: "2024", pos: "expr", visual: big("2024") },
          { en: "double seven", fr: "77 (au téléphone)", pos: "expr", visual: big("77") },
          { en: "first, second, third", fr: "premier, deuxième, troisième", pos: "num", visual: big("1st 2nd 3rd"), ex: "It's on the third floor.", exFr: "C'est au troisième étage." },
        ],
      },
    ],
    tips: ["Le séparateur des milliers est une virgule : 1,000 = mille ; la virgule décimale est un point : 1.5 = un virgule cinq.", "On écrit 1st, 2nd, 3rd, 4th… (ordinaux)."],
  },
  {
    id: "time",
    title: "Dire l'heure",
    titleEn: "Telling the time",
    emoji: "🕒",
    tone: "from-[#ff7a6b] to-[#e85d4d]",
    theme: "time",
    intro: "Deux façons de dire l'heure : la façon « classique » avec past et to (très britannique), et la façon digitale, plus simple, qu'on entend partout.",
    special: "clock",
    sections: [
      {
        title: "Le vocabulaire de l'heure",
        text: "past = après l'heure (de 1 à 30 minutes), to = avant l'heure suivante (de 31 à 59). On utilise souvent le format 12 h avec a.m. (matin) et p.m. (après-midi, soir).",
        items: [
          { en: "What time is it?", fr: "Quelle heure est-il ?", pos: "phrase", ex: "Excuse me, what time is it?", exFr: "Excusez-moi, quelle heure est-il ?" },
          { en: "o'clock", fr: "heure(s) pile", pos: "expr", visual: big("3:00"), ex: "It's three o'clock.", exFr: "Il est trois heures." },
          { en: "quarter past", fr: "et quart", pos: "expr", visual: big("3:15"), ex: "It's quarter past three.", exFr: "Il est trois heures et quart." },
          { en: "half past", fr: "et demie", pos: "expr", visual: big("3:30"), ex: "It's half past three.", exFr: "Il est trois heures et demie." },
          { en: "quarter to", fr: "moins le quart", pos: "expr", visual: big("3:45"), ex: "It's quarter to four.", exFr: "Il est quatre heures moins le quart." },
          { en: "a.m.", fr: "du matin (de minuit à midi)", pos: "expr", visual: big("a.m."), ex: "The train leaves at 7 a.m.", exFr: "Le train part à 7 h." },
          { en: "p.m.", fr: "de l'après-midi / du soir", pos: "expr", visual: big("p.m."), ex: "See you at 8 p.m.", exFr: "À 20 h." },
          { en: "midday / noon", fr: "midi", pos: "noun", visual: big("12:00") },
          { en: "midnight", fr: "minuit", pos: "noun", visual: big("00:00") },
          { en: "at seven", fr: "à sept heures", pos: "expr", ex: "Let's meet at seven.", exFr: "Retrouvons-nous à sept heures." },
          { en: "in ten minutes", fr: "dans dix minutes", pos: "expr", ex: "The bus comes in ten minutes.", exFr: "Le bus arrive dans dix minutes." },
          { en: "I'm running late", fr: "je suis en retard", pos: "phrase", ex: "Sorry, I'm running late!", exFr: "Désolé, je suis en retard !" },
        ],
      },
    ],
    tips: ["Le format 24 h (20:00) existe mais sert surtout aux horaires officiels ; à l'oral on dit « eight p.m. » ou « eight in the evening ».", "« Half three » (sans past) = 3 h 30 en anglais britannique familier — rien à voir avec « 2 h 30 » en allemand !"],
  },
  {
    id: "calendar",
    title: "Jours, mois, saisons & dates",
    titleEn: "Days, months, seasons & dates",
    emoji: "📅",
    tone: "from-[#2fbf9a] to-[#1f9c7c]",
    theme: "time",
    intro: "En anglais, les jours et les mois prennent toujours une majuscule. Et les prépositions in / on / at suivent une logique simple, du plus large au plus précis.",
    sections: [
      {
        title: "Les jours de la semaine",
        grid: true,
        items: [
          ["Monday", "lundi"], ["Tuesday", "mardi"], ["Wednesday", "mercredi"], ["Thursday", "jeudi"], ["Friday", "vendredi"], ["Saturday", "samedi"], ["Sunday", "dimanche"],
        ].map(([en, fr]) => ({ en, fr, pos: "noun", visual: big(en.slice(0, 3)), ex: `See you on ${en}!`, exFr: `À ${fr} !` })),
      },
      {
        title: "Les mois",
        grid: true,
        items: [
          ["January", "janvier"], ["February", "février"], ["March", "mars"], ["April", "avril"], ["May", "mai"], ["June", "juin"],
          ["July", "juillet"], ["August", "août"], ["September", "septembre"], ["October", "octobre"], ["November", "novembre"], ["December", "décembre"],
        ].map(([en, fr]) => ({ en, fr, pos: "noun", visual: big(en.slice(0, 3)) })),
      },
      {
        title: "Les saisons",
        grid: true,
        items: [
          { en: "spring", fr: "le printemps", pos: "noun", visual: { kind: "weather", id: "rainbow" } },
          { en: "summer", fr: "l'été", pos: "noun", visual: { kind: "weather", id: "sunny" } },
          { en: "autumn (UK) / fall (US)", fr: "l'automne", pos: "noun", visual: { kind: "weather", id: "windy" } },
          { en: "winter", fr: "l'hiver", pos: "noun", visual: { kind: "weather", id: "snowy" } },
        ],
      },
      {
        title: "Dire la date",
        text: "On écrit « 1 May » ou « May 1st », mais on dit « the first of May » (UK) ou « May first » (US). Attention : 03/04 = 3 avril au Royaume-Uni mais 4 mars aux États-Unis !",
        items: [
          { en: "What's the date today?", fr: "Quelle est la date aujourd'hui ?", pos: "phrase" },
          { en: "the first of May", fr: "le 1er mai", pos: "expr", visual: big("1/5") },
          { en: "my birthday", fr: "mon anniversaire", pos: "noun", ex: "My birthday is on the 14th of July.", exFr: "Mon anniversaire est le 14 juillet." },
          { en: "weekend", fr: "le week-end", pos: "noun", ex: "What are you doing at the weekend?", exFr: "Tu fais quoi ce week-end ?" },
        ],
      },
      {
        title: "in / on / at avec le temps",
        text: "IN pour les périodes longues (mois, saisons, années, moments de la journée), ON pour les jours et dates, AT pour les heures et moments précis.",
        items: [
          { en: "in July / in summer / in 2025", fr: "en juillet / en été / en 2025", pos: "expr", visual: big("IN") },
          { en: "in the morning", fr: "le matin", pos: "expr", visual: big("IN") },
          { en: "on Monday / on 3 March", fr: "lundi / le 3 mars", pos: "expr", visual: big("ON") },
          { en: "at 6 o'clock / at night / at the weekend", fr: "à 6 h / la nuit / le week-end", pos: "expr", visual: big("AT") },
        ],
      },
    ],
  },
  {
    id: "time-words",
    title: "Les mots du temps",
    titleEn: "Time words",
    emoji: "⏳",
    tone: "from-[#8b5cf6] to-[#6d28d9]",
    theme: "time",
    intro: "Yesterday, tomorrow, ago, already… Ces petits mots reviennent dans presque toutes les conversations. Touchez la frise pour les entendre.",
    special: "timeline",
    sections: [
      {
        title: "Avant, maintenant, après",
        items: [
          { en: "yesterday", fr: "hier", pos: "adv", ex: "I saw her yesterday.", exFr: "Je l'ai vue hier." },
          { en: "today", fr: "aujourd'hui", pos: "adv", ex: "What are you doing today?", exFr: "Tu fais quoi aujourd'hui ?" },
          { en: "tomorrow", fr: "demain", pos: "adv", ex: "See you tomorrow!", exFr: "À demain !" },
          { en: "the day before yesterday", fr: "avant-hier", pos: "expr" },
          { en: "the day after tomorrow", fr: "après-demain", pos: "expr" },
          { en: "tonight", fr: "ce soir", pos: "adv", ex: "Are you free tonight?", exFr: "Tu es libre ce soir ?" },
          { en: "last week", fr: "la semaine dernière", pos: "expr", ex: "I was in London last week.", exFr: "J'étais à Londres la semaine dernière." },
          { en: "next week", fr: "la semaine prochaine", pos: "expr", ex: "We're leaving next week.", exFr: "On part la semaine prochaine." },
          { en: "ago", fr: "il y a (dans le passé)", pos: "adv", ex: "I arrived two days ago.", exFr: "Je suis arrivé il y a deux jours." },
          { en: "now", fr: "maintenant", pos: "adv" },
          { en: "right now", fr: "tout de suite / en ce moment", pos: "expr", ex: "I'm busy right now.", exFr: "Je suis occupé en ce moment." },
          { en: "later", fr: "plus tard", pos: "adv", ex: "Talk to you later!", exFr: "On se parle plus tard !" },
          { en: "soon", fr: "bientôt", pos: "adv", ex: "See you soon!", exFr: "À bientôt !" },
        ],
      },
      {
        title: "Déjà, encore, juste",
        text: "already = déjà (plus tôt que prévu), yet = déjà/encore dans les questions et négations (en fin de phrase), still = toujours/encore (ça continue), just = venir de.",
        items: [
          { en: "already", fr: "déjà", pos: "adv", ex: "I've already eaten.", exFr: "J'ai déjà mangé." },
          { en: "yet", fr: "déjà (question) / pas encore (négation)", pos: "adv", ex: "Have you finished yet? — Not yet.", exFr: "Tu as déjà fini ? — Pas encore." },
          { en: "still", fr: "toujours, encore", pos: "adv", ex: "She's still asleep.", exFr: "Elle dort encore." },
          { en: "just", fr: "venir de", pos: "adv", ex: "I've just arrived.", exFr: "Je viens d'arriver." },
        ],
      },
      {
        title: "La fréquence",
        text: "Ces adverbes se placent avant le verbe principal (I usually walk) mais après be (I'm always late).",
        items: [
          { en: "always", fr: "toujours", pos: "adv", visual: big("100%"), ex: "I always drink coffee in the morning.", exFr: "Je bois toujours du café le matin." },
          { en: "usually", fr: "d'habitude", pos: "adv", visual: big("80%") },
          { en: "often", fr: "souvent", pos: "adv", visual: big("60%") },
          { en: "sometimes", fr: "parfois", pos: "adv", visual: big("40%") },
          { en: "rarely", fr: "rarement", pos: "adv", visual: big("10%") },
          { en: "never", fr: "jamais", pos: "adv", visual: big("0%"), ex: "I never eat meat.", exFr: "Je ne mange jamais de viande." },
        ],
      },
    ],
  },
  {
    id: "emotions",
    title: "Les émotions",
    titleEn: "Emotions",
    emoji: "😊",
    tone: "from-[#f472b6] to-[#db2777]",
    theme: "emotions",
    intro: "Dire comment on se sent, c'est la base de toute vraie conversation. Remarque : en anglais on dit « I'm hungry / I'm cold » avec be, là où le français utilise avoir.",
    sections: [
      {
        title: "Comment tu te sens ?",
        text: "Pour demander : How are you feeling? / How do you feel? Pour répondre : I feel… ou I'm…",
        grid: true,
        items: ([
          ["happy", "heureux, content", "happy", "I'm so happy to see you!", "Je suis si content de te voir !"],
          ["sad", "triste", "sad", "She looks sad today.", "Elle a l'air triste aujourd'hui."],
          ["angry", "en colère", "angry", "Don't be angry with me.", "Ne sois pas fâché contre moi."],
          ["scared", "effrayé, qui a peur", "scared", "I'm scared of spiders.", "J'ai peur des araignées."],
          ["surprised", "surpris", "surprised", "I was surprised to hear that.", "J'ai été surpris d'apprendre ça."],
          ["tired", "fatigué", "tired", "I'm really tired after the trip.", "Je suis vraiment fatigué après le voyage."],
          ["bored", "qui s'ennuie", "bored", "I'm bored. Let's go out!", "Je m'ennuie. Sortons !"],
          ["excited", "impatient, enthousiaste", "excited", "I'm so excited about the trip!", "J'ai trop hâte de partir !"],
          ["worried", "inquiet", "worried", "Don't worry, everything's fine.", "Ne t'inquiète pas, tout va bien."],
          ["proud", "fier", "proud", "I'm proud of you.", "Je suis fier de toi."],
          ["embarrassed", "gêné", "embarrassed", "I was so embarrassed!", "J'étais tellement gêné !"],
          ["in love", "amoureux", "in-love", "They're madly in love.", "Ils sont fous amoureux."],
          ["nervous", "nerveux, stressé", "nervous", "I'm nervous about the interview.", "Je stresse pour l'entretien."],
          ["relaxed", "détendu", "relaxed", "I feel so relaxed on holiday.", "Je me sens si détendu en vacances."],
          ["disgusted", "dégoûté", "disgusted", "I'm disgusted by the mess.", "Ce désordre me dégoûte."],
          ["confused", "perdu, qui ne comprend pas", "confused", "Sorry, I'm a bit confused.", "Désolé, je suis un peu perdu."],
          ["jealous", "jaloux", "jealous", "Are you jealous?", "Tu es jaloux ?"],
          ["lonely", "seul (qui souffre de solitude)", "lonely", "I sometimes feel lonely abroad.", "Je me sens parfois seul à l'étranger."],
          ["grateful", "reconnaissant", "grateful", "I'm really grateful for your help.", "Je te suis vraiment reconnaissant de ton aide."],
          ["shocked", "choqué", "shocked", "Everyone was shocked by the news.", "Tout le monde a été choqué par la nouvelle."],
        ] as [string, string, string, string, string][]).map(([en, fr, id, ex, exFr]) => ({ en, fr, pos: "adj", ex, exFr, visual: { kind: "emotion", id } as BasicVisual })),
      },
      {
        title: "Avec « be » et pas « avoir »",
        items: [
          { en: "I'm hungry", fr: "j'ai faim", pos: "phrase" },
          { en: "I'm thirsty", fr: "j'ai soif", pos: "phrase" },
          { en: "I'm cold / I'm hot", fr: "j'ai froid / j'ai chaud", pos: "phrase" },
          { en: "I'm scared", fr: "j'ai peur", pos: "phrase" },
          { en: "I'm right / you're wrong", fr: "j'ai raison / tu as tort", pos: "phrase" },
          { en: "I'm 30 (years old)", fr: "j'ai 30 ans", pos: "phrase" },
        ],
      },
    ],
    tips: ["-ed décrit ce qu'on ressent (I'm bored = je m'ennuie), -ing décrit ce qui provoque l'émotion (it's boring = c'est ennuyeux). « I'm boring » veut dire « je suis ennuyeux » !"],
  },
  {
    id: "colors-shapes",
    title: "Couleurs & formes",
    titleEn: "Colours & shapes",
    emoji: "🎨",
    tone: "from-[#fb923c] to-[#ea580c]",
    theme: "adjectives",
    intro: "L'adjectif de couleur se place avant le nom et ne s'accorde jamais : a red car, two red cars.",
    sections: [
      {
        title: "Les couleurs",
        grid: true,
        items: ([
          ["red", "rouge", "#E53935"], ["orange", "orange", "#FB8C00"], ["yellow", "jaune", "#FDD835"], ["green", "vert", "#43A047"], ["blue", "bleu", "#1E88E5"],
          ["purple", "violet", "#8E24AA"], ["pink", "rose", "#F48FB1"], ["brown", "marron", "#795548"], ["black", "noir", "#212121"], ["white", "blanc", "#FFFFFF"],
          ["grey (UK) / gray (US)", "gris", "#9E9E9E"], ["light blue", "bleu clair", "#90CAF9"], ["dark green", "vert foncé", "#1B5E20"], ["gold", "doré", "#D4AF37"],
        ] as [string, string, string][]).map(([en, fr, hex]) => ({ en, fr, pos: "adj", visual: { kind: "color", hex } as BasicVisual })),
      },
      {
        title: "Les formes",
        grid: true,
        items: ([
          ["circle", "cercle", "circle"], ["square", "carré", "square"], ["triangle", "triangle", "triangle"], ["rectangle", "rectangle", "rectangle"],
          ["star", "étoile", "star"], ["heart", "cœur", "heart"], ["oval", "ovale", "oval"], ["diamond", "losange", "diamond"],
        ] as [string, string, Shape][]).map(([en, fr, id], i) => ({ en, fr, pos: "noun", visual: { kind: "shape", id, color: ["#6A55F2", "#FF7A6B", "#5FD3B5", "#FFD166"][i % 4] } as BasicVisual })),
      },
    ],
  },
  {
    id: "family",
    title: "La famille",
    titleEn: "Family",
    emoji: "👪",
    tone: "from-[#38bdf8] to-[#2563eb]",
    theme: "people",
    intro: "Présenter sa famille est l'un des premiers sujets de conversation. Touchez une personne de l'arbre pour l'entendre.",
    special: "family",
    sections: [
      {
        title: "Les membres de la famille",
        items: [
          { en: "parents", fr: "les parents (père et mère)", pos: "noun", ex: "My parents live in Lyon.", exFr: "Mes parents habitent à Lyon." },
          { en: "relatives", fr: "les parents (la famille au sens large)", pos: "noun", ex: "We're visiting relatives.", exFr: "On rend visite à de la famille." },
          { en: "son / daughter", fr: "fils / fille", pos: "noun" },
          { en: "husband / wife", fr: "mari / femme", pos: "noun" },
          { en: "boyfriend / girlfriend / partner", fr: "copain / copine / conjoint(e)", pos: "noun" },
          { en: "grandparents", fr: "grands-parents", pos: "noun" },
          { en: "nephew / niece", fr: "neveu / nièce", pos: "noun" },
          { en: "only child", fr: "enfant unique", pos: "noun", ex: "I'm an only child.", exFr: "Je suis enfant unique." },
          { en: "siblings", fr: "frères et sœurs", pos: "noun", ex: "Have you got any siblings?", exFr: "Tu as des frères et sœurs ?" },
          { en: "in-laws", fr: "la belle-famille", pos: "noun" },
          { en: "stepmother / stepfather", fr: "belle-mère / beau-père (remariage)", pos: "noun" },
        ],
      },
    ],
    tips: ["Faux ami : parents = seulement le père et la mère. Pour « mes parents » au sens de la famille élargie, on dit relatives.", "Le possessif : my brother's car = la voiture de mon frère."],
  },
  {
    id: "body",
    title: "Le corps",
    titleEn: "The body",
    emoji: "🫀",
    tone: "from-[#f97316] to-[#c2410c]",
    theme: "body",
    intro: "Utile surtout pour dire où on a mal, chez le médecin ou à la pharmacie : « My back hurts » ou « I've got a headache ».",
    sections: [
      {
        title: "Les parties du corps",
        grid: true,
        items: ([
          ["head", "tête", "head"], ["hair", "cheveux", "hair"], ["eye", "œil", "eye"], ["ear", "oreille", "ear"], ["nose", "nez", "nose"], ["mouth", "bouche", "mouth"],
          ["neck", "cou", "neck"], ["shoulder", "épaule", "shoulder"], ["arm", "bras", "arm"], ["hand", "main", "hand"], ["finger", "doigt", "finger"], ["back", "dos", "back"],
          ["stomach", "ventre, estomac", "stomach"], ["leg", "jambe", "leg"], ["knee", "genou", "knee"], ["foot (pl. feet)", "pied", "foot"], ["toe", "orteil", "toe"],
        ] as [string, string, BodyPart][]).map(([en, fr, id]) => ({ en, fr, pos: "noun", visual: { kind: "body", id } as BasicVisual })),
      },
      {
        title: "Dire où on a mal",
        items: [
          { en: "My … hurts", fr: "J'ai mal à…", pos: "phrase", ex: "My back hurts.", exFr: "J'ai mal au dos." },
          { en: "I've got a headache", fr: "j'ai mal à la tête", pos: "phrase" },
          { en: "I've got a stomach ache", fr: "j'ai mal au ventre", pos: "phrase" },
          { en: "I've got a sore throat", fr: "j'ai mal à la gorge", pos: "phrase" },
        ],
      },
    ],
    tips: ["Hair est indénombrable : her hair is long (pas « hairs »).", "En anglais on utilise le possessif : I washed my hands (pas « the hands »)."],
  },
  {
    id: "weather",
    title: "La météo",
    titleEn: "The weather",
    emoji: "🌦️",
    tone: "from-[#22d3ee] to-[#0891b2]",
    theme: "nature",
    intro: "Le sujet de conversation préféré des Britanniques ! Pour la météo on utilise « it's » : It's sunny, It's raining.",
    sections: [
      {
        title: "Quel temps fait-il ?",
        grid: true,
        items: ([
          ["sunny", "ensoleillé", "sunny", "It's sunny today.", "Il fait soleil aujourd'hui."],
          ["cloudy", "nuageux", "cloudy", "It's a bit cloudy.", "C'est un peu nuageux."],
          ["raining / rainy", "il pleut / pluvieux", "rainy", "It's raining again!", "Il pleut encore !"],
          ["snowing / snowy", "il neige / enneigé", "snowy", "It's snowing in the mountains.", "Il neige en montagne."],
          ["windy", "venteux", "windy", "It's really windy.", "Il y a beaucoup de vent."],
          ["stormy", "orageux", "stormy", "There's a storm coming.", "Un orage arrive."],
          ["foggy", "brumeux", "foggy", "It's foggy this morning.", "Il y a du brouillard ce matin."],
          ["hot", "chaud", "hot", "It's boiling hot!", "Il fait une chaleur à crever !"],
          ["cold", "froid", "cold", "It's freezing cold.", "Il fait un froid glacial."],
          ["rainbow", "arc-en-ciel", "rainbow", "Look, a rainbow!", "Regarde, un arc-en-ciel !"],
        ] as [string, string, Weather, string, string][]).map(([en, fr, id, ex, exFr]) => ({ en, fr, pos: "adj", ex, exFr, visual: { kind: "weather", id } as BasicVisual })),
      },
      {
        title: "Parler de la météo",
        items: [
          { en: "What's the weather like?", fr: "Quel temps fait-il ?", pos: "phrase" },
          { en: "Lovely day, isn't it?", fr: "Belle journée, n'est-ce pas ?", pos: "phrase" },
          { en: "It's 25 degrees", fr: "il fait 25 degrés", pos: "phrase" },
          { en: "the forecast", fr: "les prévisions météo", pos: "noun", ex: "The forecast says rain tomorrow.", exFr: "La météo annonce de la pluie demain." },
        ],
      },
    ],
  },
  {
    id: "greetings",
    title: "Saluer & se présenter",
    titleEn: "Greetings & introductions",
    emoji: "👋",
    tone: "from-[#a3e635] to-[#4d7c0f]",
    theme: "greetings",
    intro: "Les premières phrases de toute rencontre. En anglais parlé, on reste simple et chaleureux.",
    sections: [
      {
        title: "Saluer",
        items: [
          { en: "Hi! / Hello!", fr: "Salut ! / Bonjour !", pos: "interj" },
          { en: "Good morning / Good afternoon / Good evening", fr: "Bonjour (matin) / Bon après-midi / Bonsoir", pos: "expr" },
          { en: "How are you? — I'm fine, thanks. And you?", fr: "Comment vas-tu ? — Bien, merci. Et toi ?", pos: "phrase" },
          { en: "How's it going?", fr: "Ça va ? (familier)", pos: "phrase" },
          { en: "Nice to meet you", fr: "Enchanté(e)", pos: "phrase" },
          { en: "See you later! / Bye!", fr: "À plus tard ! / Salut !", pos: "phrase" },
          { en: "Good night", fr: "Bonne nuit (pour se quitter le soir)", pos: "phrase" },
        ],
      },
      {
        title: "Se présenter",
        items: [
          { en: "My name is… / I'm…", fr: "Je m'appelle… / Je suis…", pos: "phrase", ex: "Hi, I'm Léa.", exFr: "Salut, moi c'est Léa." },
          { en: "I'm from France", fr: "Je viens de France", pos: "phrase" },
          { en: "I live in…", fr: "J'habite à…", pos: "phrase" },
          { en: "I work as a…", fr: "Je travaille comme…", pos: "phrase", ex: "I work as a nurse.", exFr: "Je suis infirmière." },
          { en: "I'm learning English", fr: "J'apprends l'anglais", pos: "phrase" },
          { en: "What do you do?", fr: "Qu'est-ce que tu fais dans la vie ?", pos: "phrase" },
          { en: "Where are you from?", fr: "Tu viens d'où ?", pos: "phrase" },
        ],
      },
    ],
    tips: ["« Good night » ne sert qu'à se quitter le soir ; pour arriver, on dit « Good evening ».", "« How do you do? » est très formel et un peu vieilli."],
  },
  {
    id: "pronouns",
    title: "Les pronoms",
    titleEn: "Pronouns",
    emoji: "🧍",
    tone: "from-[#64748b] to-[#334155]",
    theme: "grammar-words",
    intro: "Sujet, complément, possessif : trois petites séries à connaître pour construire n'importe quelle phrase.",
    sections: [
      {
        title: "Pronoms sujets",
        text: "I prend toujours une majuscule. You = tu ET vous. They s'utilise aussi pour une personne dont on ne connaît pas le genre.",
        items: [
          { en: "I", fr: "je", pos: "pron" }, { en: "you", fr: "tu / vous", pos: "pron" }, { en: "he", fr: "il (personne)", pos: "pron" }, { en: "she", fr: "elle (personne)", pos: "pron" },
          { en: "it", fr: "il / elle (objet, animal)", pos: "pron" }, { en: "we", fr: "nous / on", pos: "pron" }, { en: "they", fr: "ils / elles", pos: "pron" },
        ],
      },
      {
        title: "Pronoms compléments",
        items: [
          { en: "me", fr: "me, moi", pos: "pron", ex: "Call me!", exFr: "Appelle-moi !" }, { en: "him", fr: "le, lui (masc.)", pos: "pron" }, { en: "her", fr: "la, lui (fém.)", pos: "pron" },
          { en: "us", fr: "nous", pos: "pron" }, { en: "them", fr: "les, leur", pos: "pron", ex: "I love them.", exFr: "Je les adore." },
        ],
      },
      {
        title: "Possessifs",
        text: "Le possessif s'accorde avec le possesseur, pas avec l'objet : his mother (sa mère, à lui), her father (son père, à elle).",
        items: [
          { en: "my / mine", fr: "mon, ma, mes / le mien", pos: "det" }, { en: "your / yours", fr: "ton, votre / le tien, le vôtre", pos: "det" },
          { en: "his", fr: "son, sa, ses (à lui) / le sien", pos: "det" }, { en: "her / hers", fr: "son, sa, ses (à elle) / le sien", pos: "det" },
          { en: "our / ours", fr: "notre / le nôtre", pos: "det" }, { en: "their / theirs", fr: "leur / le leur", pos: "det" },
        ],
      },
    ],
  },
  {
    id: "questions",
    title: "Poser une question",
    titleEn: "Asking questions",
    emoji: "❓",
    tone: "from-[#facc15] to-[#ca8a04]",
    theme: "daily",
    intro: "Les mots en wh- (et how) + auxiliaire + sujet + verbe. C'est la structure de presque toutes les questions.",
    sections: [
      {
        title: "Les mots interrogatifs",
        grid: true,
        items: [
          { en: "What?", fr: "Quoi ? Que ?", pos: "pron", visual: big("?"), ex: "What do you want?", exFr: "Qu'est-ce que tu veux ?" },
          { en: "Where?", fr: "Où ?", pos: "adv", visual: big("📍"), ex: "Where do you live?", exFr: "Où habites-tu ?" },
          { en: "When?", fr: "Quand ?", pos: "adv", visual: big("🕒"), ex: "When does it start?", exFr: "Ça commence quand ?" },
          { en: "Who?", fr: "Qui ?", pos: "pron", visual: big("👤"), ex: "Who is that?", exFr: "C'est qui ?" },
          { en: "Why?", fr: "Pourquoi ?", pos: "adv", visual: big("🤔"), ex: "Why are you laughing?", exFr: "Pourquoi tu ris ?" },
          { en: "How?", fr: "Comment ?", pos: "adv", visual: big("⚙"), ex: "How do you say that in English?", exFr: "Comment on dit ça en anglais ?" },
          { en: "Which?", fr: "Lequel ? Quel ? (choix)", pos: "pron", visual: big("A/B"), ex: "Which one do you prefer?", exFr: "Lequel tu préfères ?" },
          { en: "Whose?", fr: "À qui ?", pos: "pron", visual: big("🔑"), ex: "Whose bag is this?", exFr: "C'est le sac de qui ?" },
          { en: "How much?", fr: "Combien ? (indénombrable, prix)", pos: "expr", visual: big("€"), ex: "How much is it?", exFr: "C'est combien ?" },
          { en: "How many?", fr: "Combien ? (dénombrable)", pos: "expr", visual: big("123"), ex: "How many people are coming?", exFr: "Combien de personnes viennent ?" },
          { en: "How long?", fr: "Combien de temps ?", pos: "expr", visual: big("⏳"), ex: "How long does it take?", exFr: "Ça prend combien de temps ?" },
          { en: "How old?", fr: "Quel âge ?", pos: "expr", visual: big("🎂"), ex: "How old are you?", exFr: "Quel âge as-tu ?" },
        ],
      },
    ],
    tips: ["Pas d'inversion du verbe principal : on ajoute do/does/did. Where do you work? (pas « Where work you? »)."],
  },
  {
    id: "help",
    title: "Demander de l'aide",
    titleEn: "Asking for help",
    emoji: "🆘",
    tone: "from-[#ef4444] to-[#b91c1c]",
    theme: "emergency",
    intro: "Les phrases à savoir dire quand on ne comprend pas, qu'on est perdu ou en difficulté. Les plus utiles de toute l'application !",
    sections: [
      {
        title: "Quand on ne comprend pas",
        items: [
          { en: "Sorry, I don't understand.", fr: "Désolé, je ne comprends pas.", pos: "phrase" },
          { en: "Could you say that again, please?", fr: "Pourriez-vous répéter, s'il vous plaît ?", pos: "phrase" },
          { en: "Could you speak more slowly, please?", fr: "Pourriez-vous parler plus lentement ?", pos: "phrase" },
          { en: "What does … mean?", fr: "Que veut dire… ?", pos: "phrase" },
          { en: "How do you say … in English?", fr: "Comment dit-on… en anglais ?", pos: "phrase" },
          { en: "Can you write it down?", fr: "Vous pouvez l'écrire ?", pos: "phrase" },
        ],
      },
      {
        title: "Demander de l'aide",
        items: [
          { en: "Excuse me, can you help me?", fr: "Excusez-moi, vous pouvez m'aider ?", pos: "phrase" },
          { en: "I'm lost.", fr: "Je suis perdu(e).", pos: "phrase" },
          { en: "I need help.", fr: "J'ai besoin d'aide.", pos: "phrase" },
          { en: "Help!", fr: "Au secours !", pos: "interj" },
          { en: "Call an ambulance!", fr: "Appelez une ambulance !", pos: "phrase" },
          { en: "I've lost my passport.", fr: "J'ai perdu mon passeport.", pos: "phrase" },
          { en: "Where's the nearest pharmacy?", fr: "Où est la pharmacie la plus proche ?", pos: "phrase" },
        ],
      },
    ],
    tips: ["Le numéro d'urgence est 999 au Royaume-Uni, 911 aux États-Unis et au Canada, 112 dans toute l'Europe."],
  },
];

export function getBasicLesson(id: string) {
  return BASIC_LESSONS.find((l) => l.id === id);
}

export function allItems(l: BasicLesson): BasicItem[] {
  return l.sections.flatMap((s) => s.items);
}
