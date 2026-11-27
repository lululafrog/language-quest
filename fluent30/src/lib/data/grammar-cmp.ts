import type { GrammarLesson } from "./grammar-types";

// Priority 4 — comparison lessons (the pairs French speakers mix up).
export const GRAMMAR_CMP: GrammarLesson[] = [
  {
    id: "past-simple-vs-present-perfect",
    title: "Past Simple vs Present Perfect",
    titleFr: "Prétérit ou present perfect ?",
    priority: 4,
    summaryFr: "Moment précis et terminé → prétérit. Lien avec maintenant, sans date → present perfect.",
    when: [
      "Prétérit : on sait ou on demande QUAND (yesterday, in 2020, last week, ago, when I was…).",
      "Present perfect : pas de date, expérience, résultat présent, période pas terminée (today, this week, ever, never, yet, since, for jusqu'à maintenant).",
      "Une conversation commence souvent au present perfect puis passe au prétérit pour les détails : « Have you been to Japan? — Yes, I went there in 2019 ».",
    ],
    construction: [
      { label: "Prétérit", formula: "verbe-ed / irrégulier | did", example: "I saw that film last week." },
      { label: "Present perfect", formula: "have / has + participe passé", example: "I've seen that film (twice)." },
    ],
    examples: [
      { en: "Have you ever been to New York? — Yes, I went there last year.", fr: "Tu es déjà allé à New York ? — Oui, j'y suis allé l'année dernière." },
      { en: "I've lost my keys. I lost them on the bus.", fr: "J'ai perdu mes clés. Je les ai perdues dans le bus." },
      { en: "She's worked here since May. Before that, she worked in a bank.", fr: "Elle travaille ici depuis mai. Avant, elle travaillait dans une banque." },
    ],
    frenchDiff: [
      "Le passé composé français couvre les deux : « j'ai vu ». C'est la présence d'un moment précis qui décide en anglais.",
      "Mots-clés prétérit : yesterday, ago, last…, in + année, when… Mots-clés present perfect : ever, never, yet, already, just, since, so far.",
    ],
    mistakes: [
      { wrong: "I have been to Rome in 2018.", right: "I went to Rome in 2018.", why: "Date précise → prétérit." },
      { wrong: "Did you ever eat snails?", right: "Have you ever eaten snails?", why: "Expérience → present perfect." },
      { wrong: "When have you arrived?", right: "When did you arrive?", why: "When demande un moment → prétérit." },
    ],
    timeline: {
      caption: "Prétérit : un point coupé du présent. Present perfect : relié à maintenant.",
      marks: [
        { kind: "point", at: -0.6, label: "last year (prétérit)", example: "I went to Rome last year.", color: "coral" },
        { kind: "range", from: -0.85, to: 0, label: "ma vie jusqu'ici (present perfect)", example: "I've been to Rome twice.", color: "ink" },
      ],
    },
    exercises: [
      { type: "tense", sentence: "I ___ my wallet. Can you lend me some money?", options: ["lost", "have lost"], answer: "have lost", explanation: "Résultat présent (je n'ai plus d'argent) → present perfect." },
      { type: "tense", sentence: "I ___ my wallet yesterday on the train.", options: ["lost", "have lost"], answer: "lost", explanation: "Yesterday → prétérit." },
      { type: "fill", sentence: "Have you ever ___ (try) Indian food?", answer: ["tried"], explanation: "Expérience : Have you ever + participe passé (tried)." },
      { type: "error", sentence: "We have moved to Bordeaux three years ago.", wrong: "have moved", correct: "moved", explanation: "« ago » → prétérit." },
      { type: "mcq", prompt: "« Quand est-ce qu'elle est partie ? »", options: ["When has she left?", "When did she leave?", "When she left?"], answer: "When did she leave?", explanation: "When → prétérit." },
      { type: "tense", sentence: "I ___ three cups of coffee today.", options: ["had", "have had"], answer: "have had", explanation: "Période pas terminée (today) → present perfect." },
      { type: "fill", sentence: "She ___ (live) here since 2020.", answer: ["has lived", "'s lived", "has been living"], explanation: "Since + durée jusqu'à maintenant → present perfect." },
    ],
    keywords: ["past simple vs present perfect", "prétérit vs present perfect", "preterit present perfect", "passé composé", "ago since"],
  },
  {
    id: "present-simple-vs-continuous",
    title: "Present Simple vs Present Continuous",
    titleFr: "Présent simple ou continu ?",
    priority: 4,
    summaryFr: "Habituel / permanent → simple. Maintenant / temporaire → continu.",
    when: [
      "Simple : habitudes, faits, états permanents (I work in a bank).",
      "Continu : en ce moment, situation temporaire, changement en cours (I'm working from home this week).",
      "Verbes d'état (know, want, like, believe, need) → presque toujours au simple.",
    ],
    construction: [
      { label: "Simple", formula: "base verbale (+s) | do/does", example: "She usually drives to work." },
      { label: "Continu", formula: "am/is/are + -ing", example: "She's taking the train today." },
    ],
    examples: [
      { en: "I usually drink tea, but today I'm having coffee.", fr: "D'habitude je bois du thé, mais aujourd'hui je prends un café." },
      { en: "What do you do? — I'm a nurse. What are you doing? — I'm cooking.", fr: "Tu fais quoi dans la vie ? — Infirmière. Tu fais quoi là ? — Je cuisine." },
      { en: "I think you're right. / I'm thinking about it.", fr: "Je pense que tu as raison. / J'y réfléchis." },
    ],
    frenchDiff: [
      "Un seul présent en français, deux en anglais : demande-toi « habitude ou en ce moment ? ».",
      "Think : I think (= opinion, simple) / I'm thinking (= je réfléchis, continu). Have : I have a car / I'm having lunch.",
    ],
    mistakes: [
      { wrong: "I'm going to the gym every day.", right: "I go to the gym every day.", why: "Every day = habitude → simple." },
      { wrong: "Listen! Someone knocks.", right: "Listen! Someone's knocking.", why: "En ce moment → continu." },
      { wrong: "I'm needing help.", right: "I need help.", why: "Need : verbe d'état." },
    ],
    timeline: {
      caption: "Habitude (points répétés) vs action en cours (autour de maintenant).",
      marks: [
        { kind: "repeat", from: -0.9, to: 0.9, label: "usually", example: "I usually drink tea.", color: "ink" },
        { kind: "range", from: -0.15, to: 0.15, label: "now", example: "Today I'm having coffee.", color: "coral" },
      ],
    },
    exercises: [
      { type: "tense", sentence: "She ___ French at a high school.", options: ["teaches", "is teaching"], answer: "teaches", explanation: "Métier, situation permanente → simple." },
      { type: "tense", sentence: "Shh! The baby ___.", options: ["sleeps", "is sleeping"], answer: "is sleeping", explanation: "En ce moment → continu." },
      { type: "tense", sentence: "I ___ what you mean.", options: ["understand", "am understanding"], answer: "understand", explanation: "Understand : verbe d'état." },
      { type: "fill", sentence: "I ___ (stay) at a hotel until I find a flat.", answer: ["am staying", "'m staying"], explanation: "Situation temporaire → continu." },
      { type: "error", sentence: "He is playing tennis every Sunday.", wrong: "is playing", correct: "plays", explanation: "Every Sunday = habitude → plays." },
      { type: "mcq", prompt: "« J'y réfléchis. »", options: ["I think about it.", "I'm thinking about it.", "I thinking about it."], answer: "I'm thinking about it.", explanation: "Réfléchir en ce moment → continu." },
    ],
    keywords: ["present simple vs continuous", "présent simple continu", "habitude maintenant", "verbes d'état"],
  },
  {
    id: "will-vs-going-to",
    title: "Will vs Going to",
    titleFr: "Will ou going to ?",
    priority: 4,
    summaryFr: "Décision maintenant / promesse → will. Projet déjà décidé / évidence → going to.",
    when: [
      "Will : décision spontanée, offre, promesse, opinion sur le futur (I think…).",
      "Going to : intention décidée avant, prédiction basée sur une preuve visible.",
      "Present continuous : rendez-vous organisé (I'm seeing the dentist on Monday).",
    ],
    construction: [
      { label: "Will", formula: "will ('ll) + base verbale", example: "I'll get it!" },
      { label: "Going to", formula: "am/is/are going to + base verbale", example: "I'm going to paint the kitchen." },
    ],
    examples: [
      { en: "We're out of milk. — Oh, I'll get some.", fr: "Il n'y a plus de lait. — Ah, je vais en acheter." },
      { en: "I know, I'm going to buy some later.", fr: "Je sais, je vais en acheter tout à l'heure. (déjà prévu)" },
      { en: "Look at him! He's going to fall.", fr: "Regarde-le ! Il va tomber." },
    ],
    frenchDiff: [
      "Le futur proche français « je vais » couvre les deux : demande-toi si la décision vient d'être prise (will) ou était déjà prise (going to).",
    ],
    mistakes: [
      { wrong: "The phone's ringing. — I'm going to answer it.", right: "I'll answer it.", why: "Décision spontanée → will." },
      { wrong: "I'll visit my aunt next week, I booked the train.", right: "I'm going to visit my aunt next week.", why: "Projet déjà organisé → going to (ou présent continu)." },
    ],
    timeline: {
      caption: "Will : décision au moment présent. Going to : décision antérieure.",
      marks: [
        { kind: "point", at: 0, label: "will : je décide maintenant", example: "I'll have the soup.", color: "coral" },
        { kind: "point", at: -0.5, label: "going to : décidé avant", example: "I'm going to move to Canada.", color: "ink" },
      ],
    },
    exercises: [
      { type: "tense", sentence: "A: I'm cold. B: I ___ close the window.", options: ["'ll", "'m going to"], answer: "'ll", explanation: "Offre spontanée → will." },
      { type: "tense", sentence: "We ___ get married in June. We've booked the venue.", options: ["will", "are going to"], answer: "are going to", explanation: "Projet décidé → going to." },
      { type: "tense", sentence: "Look at that traffic jam! We ___ be late.", options: ["will", "are going to"], answer: "are going to", explanation: "Évidence visible → going to." },
      { type: "mcq", prompt: "Promesse :", options: ["I'm going to never do it again.", "I'll never do it again.", "I never do it again."], answer: "I'll never do it again.", explanation: "Promesse → will." },
      { type: "fill", sentence: "I think it ___ be a great party.", hint: "opinion", answer: ["will", "'ll"], explanation: "Opinion avec I think → will." },
      { type: "error", sentence: "Wait, I'm going to help you with that box!", wrong: "I'm going to", correct: "I'll", explanation: "Décision et offre spontanées → I'll help you." },
    ],
    keywords: ["will vs going to", "futur", "will going to", "décision projet"],
  },
  {
    id: "must-vs-have-to",
    title: "Must vs Have to",
    titleFr: "Must ou have to ?",
    priority: 4,
    summaryFr: "Proches à l'affirmatif, opposés au négatif : mustn't = interdit, don't have to = pas obligé.",
    when: [
      "Must : obligation que je ressens, ou règle écrite (I must call her; Visitors must sign in).",
      "Have to : obligation extérieure, la plus courante à l'oral (I have to work late).",
      "Mustn't : interdiction. Don't have to : absence d'obligation.",
      "Passé des deux : had to.",
    ],
    construction: [
      { label: "Must / mustn't", formula: "must / mustn't + base verbale", example: "You mustn't be late." },
      { label: "Have to / don't have to", formula: "have/has to | don't/doesn't have to + base", example: "You don't have to come." },
    ],
    examples: [
      { en: "I must remember to call Mum.", fr: "Il faut que je pense à appeler maman." },
      { en: "I have to wear a suit at work.", fr: "Je dois porter un costume au travail." },
      { en: "You mustn't drink and drive.", fr: "Il ne faut pas boire et conduire." },
      { en: "You don't have to tip in Japan.", fr: "On n'est pas obligé de laisser un pourboire au Japon." },
    ],
    frenchDiff: [
      "« Tu ne dois pas » = mustn't (interdiction). « Tu n'es pas obligé » = don't have to. Le français « ne pas devoir » est ambigu, l'anglais non.",
    ],
    mistakes: [
      { wrong: "It's Sunday, you mustn't get up early.", right: "It's Sunday, you don't have to get up early.", why: "Pas obligé (pas interdit) → don't have to." },
      { wrong: "Yesterday I must leave early.", right: "Yesterday I had to leave early.", why: "Passé → had to." },
    ],
    exercises: [
      { type: "mcq", prompt: "Entrée gratuite :", options: ["You mustn't pay.", "You don't have to pay."], answer: "You don't have to pay.", explanation: "Pas d'obligation." },
      { type: "mcq", prompt: "Panneau dans un musée :", options: ["You mustn't touch the paintings.", "You don't have to touch the paintings."], answer: "You mustn't touch the paintings.", explanation: "Interdiction." },
      { type: "fill", sentence: "She ___ work on Saturdays — it's in her contract.", answer: ["has to"], explanation: "Obligation extérieure → has to." },
      { type: "error", sentence: "Last night we must take a taxi.", wrong: "must", correct: "had to", explanation: "Passé → had to." },
      { type: "tense", sentence: "You ___ come if you're tired. It's fine.", options: ["mustn't", "don't have to"], answer: "don't have to", explanation: "Pas obligé." },
      { type: "tense", sentence: "You ___ tell anyone. It's a secret!", options: ["mustn't", "don't have to"], answer: "mustn't", explanation: "Interdiction." },
    ],
    keywords: ["must vs have to", "mustn't don't have to", "obligation interdiction"],
  },
  {
    id: "should-vs-could",
    title: "Should vs Could",
    titleFr: "Should ou could ?",
    priority: 4,
    summaryFr: "Should = je te conseille. Could = c'est une possibilité parmi d'autres.",
    when: [
      "Should : recommandation, ce que je pense être la bonne chose à faire.",
      "Could : suggestion neutre, une option possible.",
      "Should have = regret (aurais dû) ; could have = possibilité passée non réalisée (aurais pu).",
    ],
    construction: [
      { label: "Should", formula: "should + base verbale", example: "You should apologise." },
      { label: "Could", formula: "could + base verbale", example: "You could take the train or the bus." },
    ],
    examples: [
      { en: "You should see a doctor.", fr: "Tu devrais voir un médecin." },
      { en: "We could go to the cinema, or we could stay in.", fr: "On pourrait aller au cinéma, ou rester à la maison." },
      { en: "You could have told me!", fr: "Tu aurais pu me le dire !" },
    ],
    frenchDiff: [
      "Should = « devrais / aurais dû » ; could = « pourrais / aurais pu ». Même logique qu'en français.",
    ],
    mistakes: [
      { wrong: "You could stop smoking (pour un conseil ferme).", right: "You should stop smoking.", why: "Conseil → should." },
      { wrong: "I should have came.", right: "I should have come.", why: "Participe passé : come." },
    ],
    exercises: [
      { type: "tense", sentence: "Your tooth hurts? You ___ see a dentist.", options: ["should", "could"], answer: "should", explanation: "Conseil → should." },
      { type: "tense", sentence: "For dinner we ___ have pizza or sushi — what do you think?", options: ["should", "could"], answer: "could", explanation: "Options possibles → could." },
      { type: "mcq", prompt: "« Tu aurais pu me prévenir ! »", options: ["You should warn me!", "You could have warned me!", "You could warned me!"], answer: "You could have warned me!", explanation: "could have + participe passé." },
      { type: "mcq", prompt: "« J'aurais dû partir plus tôt. »", options: ["I should have left earlier.", "I could leave earlier.", "I should left earlier."], answer: "I should have left earlier.", explanation: "Regret → should have." },
      { type: "fill", sentence: "If you're bored, you ___ learn a new hobby.", hint: "suggestion", answer: ["could", "should"], explanation: "Suggestion → could (should si conseil plus appuyé)." },
      { type: "error", sentence: "You should to apologise to her.", wrong: "to apologise", correct: "apologise", explanation: "should + base verbale." },
    ],
    keywords: ["should vs could", "conseil suggestion", "should have could have"],
  },
  {
    id: "for-vs-since",
    title: "For vs Since",
    titleFr: "For ou since ?",
    priority: 4,
    summaryFr: "For + une durée (pendant / depuis X temps). Since + un point de départ (depuis telle date).",
    when: [
      "For + durée : for two hours, for ten years, for ages.",
      "Since + point de départ : since 2019, since Monday, since I was a child.",
      "Avec un sens « depuis », on utilise le present perfect (simple ou continu).",
    ],
    construction: [
      { label: "For", formula: "present perfect + for + durée", example: "I've known her for ten years." },
      { label: "Since", formula: "present perfect + since + date / moment", example: "I've known her since 2015." },
      { label: "Question", formula: "How long have you…?", example: "How long have you lived here?" },
    ],
    examples: [
      { en: "We've been waiting for ages!", fr: "On attend depuis une éternité !" },
      { en: "I haven't seen him since Christmas.", fr: "Je ne l'ai pas vu depuis Noël." },
      { en: "I lived in Berlin for two years.", fr: "J'ai vécu à Berlin pendant deux ans. (terminé)" },
    ],
    frenchDiff: [
      "« Depuis » se traduit par for OU since selon ce qui suit (durée ou date).",
      "« Pendant » (durée terminée) = for + prétérit : « I lived there for 2 years ».",
      "Jamais de présent simple avec « depuis » : « I've been here since 9 », pas « I am here since 9 ».",
    ],
    mistakes: [
      { wrong: "I've lived here since five years.", right: "I've lived here for five years.", why: "Durée → for." },
      { wrong: "I'm working here for 2019.", right: "I've been working here since 2019.", why: "Date → since + present perfect." },
      { wrong: "I know him since years.", right: "I've known him for years.", why: "Durée → for + present perfect." },
    ],
    timeline: {
      caption: "For mesure la durée ; since pointe le départ.",
      marks: [
        { kind: "range", from: -0.6, to: 0, label: "for 3 years", example: "I've lived here for three years.", color: "ink" },
        { kind: "point", at: -0.6, label: "since 2022", example: "I've lived here since 2022.", color: "coral" },
      ],
    },
    exercises: [
      { type: "tense", sentence: "I've been learning English ___ six months.", options: ["for", "since"], answer: "for", explanation: "Durée → for." },
      { type: "tense", sentence: "She's worked here ___ March.", options: ["for", "since"], answer: "since", explanation: "Point de départ → since." },
      { type: "tense", sentence: "We haven't spoken ___ the party.", options: ["for", "since"], answer: "since", explanation: "Événement de départ → since." },
      { type: "tense", sentence: "They've been married ___ a long time.", options: ["for", "since"], answer: "for", explanation: "Durée → for." },
      { type: "error", sentence: "I am here since 9 o'clock.", wrong: "am", correct: "have been", explanation: "Depuis → present perfect : I've been here since 9." },
      { type: "reorder", answer: "How long have you been living in London?", translationFr: "Depuis combien de temps vis-tu à Londres ?", explanation: "How long + present perfect continu." },
    ],
    keywords: ["for vs since", "for since", "depuis", "pendant", "how long"],
  },
  {
    id: "already-yet-still",
    title: "Already, yet, still",
    titleFr: "Already, yet ou still ?",
    priority: 4,
    summaryFr: "Already = déjà (plus tôt que prévu). Yet = déjà ? / pas encore. Still = toujours, encore.",
    when: [
      "Already : affirmatif, « déjà » : « I've already eaten ».",
      "Yet : questions (« déjà ? ») et négations (« pas encore ») ; en fin de phrase : « Have you finished yet? », « Not yet ».",
      "Still : quelque chose continue (plus longtemps que prévu) : « Are you still working? », « I still don't understand ».",
    ],
    construction: [
      { label: "Already", formula: "have + already + participe passé", example: "She's already left." },
      { label: "Yet", formula: "…haven't + participe passé + yet / Have… yet?", example: "I haven't decided yet." },
      { label: "Still", formula: "sujet + still + verbe | be + still", example: "He's still asleep." },
    ],
    examples: [
      { en: "Is she still here? — No, she's already gone.", fr: "Elle est encore là ? — Non, elle est déjà partie." },
      { en: "Have you seen it yet? — Not yet.", fr: "Tu l'as déjà vu ? — Pas encore." },
      { en: "I still love that song.", fr: "J'adore toujours cette chanson." },
    ],
    frenchDiff: [
      "« Déjà » = already (affirmation) ou yet (question). « Tu as déjà mangé ? » = Have you eaten yet? (ou already si on est surpris).",
      "« Encore / toujours » (continuité) = still, pas « always » : « Il dort encore » = He's still sleeping.",
      "Placement : already et still au milieu, yet à la fin.",
    ],
    mistakes: [
      { wrong: "He's always sleeping (= il dort encore).", right: "He's still sleeping.", why: "Continuité → still." },
      { wrong: "I didn't finish already.", right: "I haven't finished yet.", why: "Négation « pas encore » → yet + present perfect." },
      { wrong: "Have you yet finished?", right: "Have you finished yet?", why: "Yet en fin de phrase." },
    ],
    exercises: [
      { type: "tense", sentence: "Have you booked the hotel ___?", options: ["already", "yet", "still"], answer: "yet", explanation: "Question neutre « déjà ? » → yet." },
      { type: "tense", sentence: "Don't cook for me, I've ___ eaten.", options: ["already", "yet", "still"], answer: "already", explanation: "Affirmatif « déjà » → already." },
      { type: "tense", sentence: "It's 11 am and he's ___ in bed!", options: ["already", "yet", "still"], answer: "still", explanation: "Ça continue → still." },
      { type: "tense", sentence: "I haven't decided ___.", options: ["already", "yet", "still"], answer: "yet", explanation: "« pas encore » → yet." },
      { type: "error", sentence: "After all these years, she is always living with her parents.", wrong: "always", correct: "still", explanation: "Continuité → still." },
      { type: "reorder", answer: "I still don't understand this rule.", translationFr: "Je ne comprends toujours pas cette règle.", explanation: "still avant l'auxiliaire négatif." },
    ],
    keywords: ["already yet still", "already", "yet", "still", "déjà", "pas encore", "encore toujours"],
  },
];
