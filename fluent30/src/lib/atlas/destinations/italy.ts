import type { AtlasDestination, AtlasExercise, AtlasMission, Band, StoryNode } from "../types";
import type { DialogueLine } from "../../curriculum/types";

// =====================================================================
// ITALY — reference destination (original content for Fluent30)
// Italian is the local language: the missions simulate exchanges in ENGLISH as the international
// language between travellers, guides, hosts and colleagues. Local habits are described as common
// practices, never as rules everyone follows.
// =====================================================================

const b = (s: string): Band[] => s.split(" ") as Band[];
const mcq = (bands: string, prompt: string, options: string[], answer: number, explain: string, fr?: string): AtlasExercise => ({ type: "mcq", prompt, options, answer, explain, fr, bands: b(bands) });
const fill = (bands: string, sentence: string, answers: string[], explain: string, fr?: string, hint?: string): AtlasExercise => ({ type: "fill", sentence, answers, explain, fr, hint, bands: b(bands) });
const listen = (bands: string, audio: string, question: string, options: string[], answer: number, explain: string): AtlasExercise => ({ type: "listen", audio, question, options, answer, explain, bands: b(bands) });
const dictation = (bands: string, audio: string, answers: string[], explain: string): AtlasExercise => ({ type: "dictation", audio, answers, explain, bands: b(bands) });
const reorder = (bands: string, answer: string, explain: string, fr?: string): AtlasExercise => ({ type: "reorder", words: answer.split(" "), answer, explain, fr, bands: b(bands) });
const tr = (bands: string, from: "fr" | "en", text: string, answers: string[], explain: string): AtlasExercise => ({ type: "translate", from, text, answers, explain, bands: b(bands) });
const fix = (bands: string, sentence: string, answers: string[], explain: string): AtlasExercise => ({ type: "fix", sentence, answers, explain, bands: b(bands) });
const match = (bands: string, pairs: [string, string][], explain?: string): AtlasExercise => ({ type: "match", pairs, explain, bands: b(bands) });
const speak = (bands: string, text: string, fr: string): AtlasExercise => ({ type: "speak", text, fr, bands: b(bands) });
const say = (speaker: string, en: string, fr?: string): DialogueLine => ({ speaker, en, fr });
const pick = (fr: string, ...choices: [string, boolean, string][]): DialogueLine => {
  const list = choices.map(([en, correct, why]) => ({ en, correct, why }));
  const r = [...fr].reduce((a, c) => a + c.charCodeAt(0), 0) % list.length;
  return { speaker: "You", fr, choices: [...list.slice(r), ...list.slice(0, r)] };
};
const dialogue = (bands: string, intro: string, ...lines: DialogueLine[]): AtlasExercise => ({ type: "dialogue", intro, lines, bands: b(bands) });
const produce = (bands: string, title: string, prompt: string, fr: string, mustInclude: string[][], minWords: number, samples: string[], tip: string): AtlasExercise => ({ type: "produce", title, prompt, fr, mustInclude, minWords, samples, tip, bands: b(bands) });

// ---------------------------------------------------------------------
// Missions
// ---------------------------------------------------------------------

const pizza: AtlasMission = {
  id: "italy-pizza", order: 1, title: "Commander une pizza à Naples", titleEn: "Order a pizza in Naples", place: "napoli", minutes: 7,
  briefing: "Naples est le berceau de la pizza napolitaine, dont le savoir-faire (l'art du « pizzaiuolo ») est inscrit au patrimoine immatériel de l'UNESCO. Giulia, pizzaiola, parle anglais avec les nombreux visiteurs étrangers : tu commandes en anglais, tu poses des questions sur les ingrédients et tu signales une allergie.",
  objectives: {
    A1: "Nommer des ingrédients et commander une pizza.",
    A2: "Poser des questions sur un plat et signaler une allergie.",
    B1: "Comprendre une explication sur la préparation et réagir.",
    B2: "Comparer deux styles de pizza et justifier ton choix.",
    C1: "Échanger avec finesse sur les traditions sans tomber dans les clichés.",
  },
  grammar: ["Can I have / I'd like", "Some / any", "There is / there are"],
  phrases: [
    { en: "I'd like a margherita, please.", fr: "Je voudrais une margherita, s'il vous plaît." },
    { en: "What's in the marinara?", fr: "Qu'est-ce qu'il y a dans la marinara ?" },
    { en: "Is there any cheese in it?", fr: "Il y a du fromage dedans ?" },
    { en: "I'm allergic to nuts.", fr: "Je suis allergique aux fruits à coque." },
    { en: "Could we have some water, please?", fr: "On pourrait avoir de l'eau, s'il vous plaît ?" },
    { en: "It's soft in the middle.", fr: "Elle est moelleuse au centre." },
    { en: "That was amazing, thank you!", fr: "C'était incroyable, merci !" },
  ],
  vocab: ["ingredients", "allergy", "oven", "dough", "menu"],
  exercises: [
    match("A1 A2", [["tomato", "tomate"], ["basil", "basilic"], ["garlic", "ail"], ["olive oil", "huile d'olive"], ["dough", "pâte"]]),
    { type: "assemble", title: "La margherita de Giulia", brief: "Giulia te demande de l'aider : choisis les ingrédients d'une margherita classique.", audio: "A classic margherita has tomato, mozzarella, fresh basil and a little olive oil. Nothing else!", options: [
      { id: "tomato", en: "tomato", fr: "tomate" }, { id: "mozzarella", en: "mozzarella", fr: "mozzarella" }, { id: "basil", en: "fresh basil", fr: "basilic frais" }, { id: "oil", en: "olive oil", fr: "huile d'olive" },
      { id: "ham", en: "ham", fr: "jambon" }, { id: "pineapple", en: "pineapple", fr: "ananas" }, { id: "mushrooms", en: "mushrooms", fr: "champignons" },
    ], correct: ["tomato", "mozzarella", "basil", "oil"], explain: "Tomate, mozzarella, basilic et un filet d'huile d'olive : « Nothing else! »", bands: b("A1 A2 B1") },
    fill("A1 A2", "I'd ___ a margherita, please.", ["like"], "« I'd like » est la formule polie pour commander.", "Je voudrais une margherita."),
    listen("A1 A2 B1", "The marinara has tomato, garlic, oregano and olive oil. There's no cheese in it.", "Qu'est-ce qui n'est PAS dans la marinara ?", ["L'ail", "Le fromage", "L'origan", "La tomate"], 1, "« There's no cheese in it » : la marinara traditionnelle n'a pas de fromage."),
    dialogue("A1 A2 B1", "Giulia prend ta commande.",
      say("Giulia", "Hi! Ready to order?", "Bonjour ! Prêts à commander ?"),
      pick("Commande une margherita et demande de l'eau.",
        ["Yes, I'd like a margherita and some water, please.", true, "Commande claire et polie."],
        ["I take margherita and water.", false, "Il manque l'article et la formule polie ; « I'd like » ou « Can I have »."]),
      say("Giulia", "Still or sparkling?", "Plate ou gazeuse ?"),
      pick("Tu veux de l'eau plate.",
        ["Still, please.", true, "« still » = plate, « sparkling » = gazeuse."],
        ["Calm water, please.", false, "Calque : on dit « still water »."])),
    tr("A2 B1 B2 C1", "fr", "Je suis allergique aux fruits à coque. Il y en a dans ce plat ?", ["I'm allergic to nuts. Are there any in this dish?", "I'm allergic to nuts. Are there nuts in this dish?", "I am allergic to nuts. Are there any in this dish?", "I'm allergic to nuts. Is there any in this dish?"], "« allergic TO » ; « any » dans une question."),
    fix("A2 B1 B2", "I am allergic of nuts.", ["I am allergic to nuts.", "I'm allergic to nuts."], "On est « allergic to » quelque chose (pas « of »)."),
    mcq("B1 B2 C1", "Giulia explique : « Our pizza is soft and a bit wet in the middle — that's how it's meant to be. » Que comprends-tu ?", ["La pizza n'est pas assez cuite", "Un centre moelleux est normal pour la pizza napolitaine", "Il faut la renvoyer"], 1, "La pizza napolitaine est connue pour son centre moelleux : « that's how it's meant to be » = c'est voulu."),
    produce("B2 C1", "Napolitaine ou romaine ?", "A friend asks you whether they should try a thin, crispy pizza or a soft Neapolitan one. Compare them and recommend one.", "Un ami hésite entre une pizza fine et croustillante ou une napolitaine moelleuse. Compare et recommande.", [["crispy", "thin", "crunchy"], ["soft", "chewy", "neapolitan", "fluffy"], ["recommend", "should", "go for", "try", "i'd", "i would"]], 20, ["If you like crispy pizza, the thin Roman style is great, but here in Naples I'd definitely go for a soft Neapolitan one — the crust is light and chewy.", "The Neapolitan pizza is softer and puffier, while the thin one is crispier. You should try the Neapolitan here."], "« while / whereas » pour comparer, « I'd go for » pour recommander."),
    mcq("B2 C1", "Quelle phrase évite le cliché ?", ["Italians only eat pizza.", "Pizza is one of many regional dishes, and Neapolitan pizza has its own traditions.", "Every Italian makes pizza at home."], 1, "On parle d'une tradition régionale parmi d'autres, sans généraliser à tout un pays."),
    mcq("B2 C1", "« The dough is left to rise for hours » signifie :", ["La pâte repose et lève pendant des heures", "La pâte est jetée", "La pâte est cuite des heures"], 0, "« to rise » (lever) pour une pâte ; « is left to » = on la laisse."),
    speak("A1 A2", "I'd like a margherita, please.", "Je voudrais une margherita, s'il vous plaît."),
  ],
  tags: ["food"],
  lesson: "theme-restaurant", scenario: "restaurant", reward: "italy-linen-shirt",
};

const pasta: AtlasMission = {
  id: "italy-pasta", order: 2, title: "L'atelier de pâtes fraîches", titleEn: "The fresh pasta workshop", place: "bologna", minutes: 9,
  briefing: "À Bologne, Marco anime un cours de pâtes fraîches en anglais pour des voyageurs du monde entier. Tu suis ses instructions et tu apprends les verbes d'action de la cuisine. Ici, le ragù se sert traditionnellement avec des tagliatelle plutôt qu'avec des spaghetti.",
  objectives: {
    A1: "Comprendre des verbes simples (mix, cut, boil).",
    A2: "Suivre une recette pas à pas.",
    B1: "Expliquer une recette à quelqu'un d'autre.",
    B2: "Gérer un problème de recette et donner des conseils.",
    C1: "Comprendre et utiliser un vocabulaire culinaire précis.",
  },
  grammar: ["Impératif", "Connecteurs de séquence (first, then, after that, finally)", "Quantités (a pinch of, 100 grams of)"],
  phrases: [
    { en: "First, make a well in the flour.", fr: "D'abord, fais un puits dans la farine." },
    { en: "Crack the eggs into the middle.", fr: "Casse les œufs au milieu." },
    { en: "Knead the dough for ten minutes.", fr: "Pétris la pâte dix minutes." },
    { en: "Let it rest for half an hour.", fr: "Laisse-la reposer une demi-heure." },
    { en: "Roll it out very thin.", fr: "Étale-la très finement." },
    { en: "Boil the pasta in salted water.", fr: "Fais cuire les pâtes dans l'eau salée." },
    { en: "Drain it and toss it with the sauce.", fr: "Égoutte-les et mélange-les à la sauce." },
  ],
  vocab: ["knead", "roll-out", "boil", "drain", "flour", "pinch"],
  exercises: [
    match("A1 A2", [["to knead", "pétrir"], ["to boil", "faire bouillir / cuire à l'eau"], ["to drain", "égoutter"], ["to roll out", "étaler"], ["flour", "farine"]]),
    { type: "steps", title: "Tagliatelle maison", brief: "Remets les instructions de Marco dans l'ordre.", steps: [
      "Make a well in the flour.",
      "Crack the eggs into the middle.",
      "Mix with a fork, then knead for about ten minutes.",
      "Wrap the dough and let it rest for thirty minutes.",
      "Roll it out very thin with a rolling pin.",
      "Fold the sheet and cut it into ribbons.",
      "Boil the tagliatelle in salted water for two or three minutes.",
    ], fr: ["Fais un puits dans la farine.", "Casse les œufs au milieu.", "Mélange à la fourchette puis pétris une dizaine de minutes.", "Emballe la pâte et laisse-la reposer 30 minutes.", "Étale-la très finement au rouleau.", "Plie la feuille et coupe-la en rubans.", "Cuis les tagliatelle 2 à 3 minutes dans l'eau salée."], explain: "La pâte doit reposer avant d'être étalée, et les pâtes fraîches cuisent en quelques minutes seulement.", bands: b("A1 A2 B1 B2") },
    fill("A1 A2", "___ the eggs into the middle of the flour.", ["Crack", "crack", "Break", "break"], "« crack an egg » = casser un œuf.", "Casse les œufs au milieu de la farine."),
    listen("A1 A2 B1", "Knead the dough for ten minutes, until it's smooth and elastic.", "Jusqu'à quand pétrir ?", ["Jusqu'à ce que la pâte soit lisse et élastique", "Jusqu'à ce qu'elle soit liquide", "Pendant une heure"], 0, "« until it's smooth and elastic » = jusqu'à ce qu'elle soit lisse et élastique."),
    reorder("A2 B1", "Let the dough rest for half an hour", "« let + objet + verbe » : laisse la pâte reposer.", "Laisse la pâte reposer une demi-heure."),
    fix("A2 B1 B2 C1", "Cook the pasta in salt water during three minutes.", ["Cook the pasta in salted water for three minutes.", "Boil the pasta in salted water for three minutes."], "« salted water » (eau salée) et « for » + durée (pas « during »)."),
    dialogue("A2 B1 B2", "Ta pâte colle partout.",
      say("Marco", "How's it going?", "Ça avance ?"),
      pick("Explique le problème.",
        ["Not great — my dough is really sticky.", true, "« sticky » = collant : description précise du problème."],
        ["My pasta is glue.", false, "Compréhensible mais maladroit."]),
      say("Marco", "Just add a little flour, a spoonful at a time.", "Ajoute un peu de farine, une cuillère à la fois."),
      pick("Vérifie le conseil.",
        ["So I add flour little by little until it stops sticking?", true, "Reformuler pour vérifier : excellente stratégie."],
        ["I add all the flour?", false, "Il a dit « a spoonful at a time » : petit à petit."])),
    tr("B1 B2 C1", "fr", "D'abord, mélange la farine et les œufs, puis pétris la pâte.", ["First, mix the flour and the eggs, then knead the dough.", "First, mix the flour and eggs, then knead the dough.", "First mix the flour and the eggs, then knead the dough."], "« First… then… » pour enchaîner les étapes ; « knead » = pétrir."),
    produce("B1 B2 C1", "Explique la recette", "A friend wants to make fresh pasta at home. Explain the main steps in order.", "Un ami veut faire des pâtes fraîches. Explique les étapes principales dans l'ordre.", [["first", "start"], ["then", "next", "after that", "afterwards"], ["knead", "roll", "rest", "cut", "boil"]], 25, ["First, make a well in the flour and crack the eggs into it. Then knead the dough for ten minutes and let it rest. After that, roll it out, cut it into ribbons and boil it for a couple of minutes.", "Start by mixing flour and eggs, then knead it, let it rest, roll it out thin and cut it."], "Les connecteurs (first, then, after that, finally) rendent les instructions claires."),
    mcq("B2 C1", "Marco dit : « Don't overcook it — fresh pasta should still have a bit of bite. » Il veut dire :", ["Les pâtes doivent rester légèrement fermes", "Il faut les cuire longtemps", "Il faut les manger froides"], 0, "« a bit of bite » = encore un peu de tenue sous la dent (proche de « al dente »)."),
    mcq("C1", "Quel verbe décrit le fait de mélanger les pâtes avec la sauce en les faisant sauter ?", ["to toss", "to whisk", "to grate"], 0, "« toss » = mélanger en remuant / faisant sauter ; « whisk » = fouetter ; « grate » = râper."),
    speak("A1 A2", "Knead the dough for ten minutes.", "Pétris la pâte dix minutes."),
  ],
  tags: ["food"],
  lesson: "a1-key-verbs", scenario: "passions", reward: "italy-rolling-pin",
};

const train: AtlasMission = {
  id: "italy-train", order: 3, title: "Voyager en train", titleEn: "Travel by train", place: "roma", minutes: 8,
  briefing: "À la gare de Roma Termini, tu prends un train pour Florence. Les annonces et les panneaux sont en italien et en anglais. Tu achètes un billet, tu comprends les règles (les billets régionaux papier doivent en général être validés avant de monter) et tu gères un retard.",
  objectives: {
    A1: "Lire un tableau des départs (platform, delay).",
    A2: "Acheter un billet et demander le quai.",
    B1: "Comprendre une annonce de retard ou de grève et réagir.",
    B2: "Négocier une solution avec le personnel (changement de billet).",
    C1: "Comprendre des conditions de remboursement formulées de façon administrative.",
  },
  grammar: ["Heures et horaires", "Present simple pour les horaires (The train leaves at…)", "Questions avec how long / how much"],
  phrases: [
    { en: "A ticket to Florence, please.", fr: "Un billet pour Florence, s'il vous plaît." },
    { en: "Which platform does it leave from?", fr: "De quel quai part-il ?" },
    { en: "Do I need to validate this ticket?", fr: "Dois-je valider ce billet ?" },
    { en: "The train is running twenty minutes late.", fr: "Le train a vingt minutes de retard." },
    { en: "Can I change my ticket?", fr: "Puis-je changer mon billet ?" },
    { en: "Is this seat free?", fr: "Cette place est libre ?" },
  ],
  vocab: ["platform-it", "delay", "validate", "strike", "refund"],
  exercises: [
    match("A1 A2", [["platform", "quai (binario)"], ["delay", "retard"], ["departures", "départs"], ["arrivals", "arrivées"], ["strike", "grève"]]),
    { type: "decide", title: "Le tableau des départs", doc: "DEPARTURES — 10:15 Frecciarossa to Firenze S.M.N., platform 12, on time. 10:20 Regionale to Orte, platform 3, delay 15 min. 10:35 Italo to Milano Centrale, platform 8, on time.", question: "Tu vas à Florence. Quel quai ?", options: [
      { en: "Platform 12.", correct: true, why: "Le Frecciarossa de 10 h 15 pour Firenze S.M.N. part du quai 12, à l'heure." },
      { en: "Platform 3.", correct: false, why: "C'est le train régional pour Orte, en retard." },
      { en: "Platform 8.", correct: false, why: "Celui-ci va à Milan." },
    ], bands: b("A1 A2 B1") },
    fill("A1 A2", "Which ___ does the train to Florence leave from?", ["platform"], "Le quai = « platform » (« binario » en italien).", "De quel quai part le train pour Florence ?"),
    listen("A1 A2 B1", "The regional train to Orte is running fifteen minutes late. We apologise for the inconvenience.", "Que se passe-t-il ?", ["Le train est annulé", "Le train a 15 minutes de retard", "Le train part en avance"], 1, "« running fifteen minutes late » = 15 minutes de retard."),
    dialogue("A1 A2 B1", "Au guichet.",
      say("Clerk", "Good morning. Where to?", "Bonjour. Pour où ?"),
      pick("Demande un billet pour Florence ce matin.",
        ["A ticket to Florence this morning, please.", true, "Clair et poli."],
        ["Florence. Ticket.", false, "Trop sec."]),
      say("Clerk", "The 10:15 is 24 euros. Single or return?", "Le 10 h 15 coûte 24 euros. Aller simple ou aller-retour ?"),
      pick("Tu reviens dans trois jours.",
        ["Return, please. I'm coming back on Friday.", true, "« return » = aller-retour."],
        ["Single and back.", false, "On dit « return » (ou « round trip » en américain)."])),
    mcq("A2 B1", "Tu as un billet régional papier. Que fais-tu avant de monter ?", ["Rien", "Je le valide dans la machine sur le quai", "Je le donne au conducteur"], 1, "Les billets régionaux papier doivent en général être validés (« convalidare ») avant de monter, sinon tu risques une amende."),
    fix("A2 B1 B2", "The train leaves at the platform 12.", ["The train leaves from platform 12."], "On part « from platform 12 », sans article."),
    { type: "decide", title: "Annonce de grève", doc: "Notice: due to a national rail strike on Thursday from 9am to 5pm, some services may be cancelled. Guaranteed services are listed on the website. Tickets for cancelled trains can be refunded or changed.", audio: true, question: "Ton train est jeudi à 11 h. Quelle est la meilleure réaction ?", options: [
      { en: "Check the guaranteed services online and change my ticket if needed.", correct: true, why: "Les trains garantis sont listés en ligne, et les billets des trains annulés peuvent être échangés ou remboursés." },
      { en: "Go to the station and hope for the best.", correct: false, why: "Ton train est dans la plage de grève : vérifie d'abord." },
      { en: "My ticket is lost: I need to buy another one.", correct: false, why: "« can be refunded or changed » : ton billet n'est pas perdu." },
    ], bands: b("B1 B2 C1") },
    produce("B2 C1", "Au guichet après l'annulation", "Your train was cancelled because of the strike. Politely ask to change your ticket for the next available train and ask if you need to pay anything.", "Ton train est annulé à cause de la grève. Demande poliment à changer ton billet pour le prochain train et s'il faut payer quelque chose.", [["cancelled", "canceled", "strike"], ["change", "swap", "rebook", "exchange", "next train", "another train"], ["pay", "extra", "cost", "charge", "free"]], 20, ["Hi, my 11 o'clock train to Florence was cancelled because of the strike. Could I change my ticket to the next available train? Do I need to pay anything extra?", "My train was cancelled due to the strike — is it possible to swap my ticket for a later one, free of charge?"], "Donne le contexte (quel train, pourquoi), puis deux questions précises."),
    mcq("C1", "« Refunds are subject to the conditions of carriage » signifie :", ["Les remboursements dépendent des conditions générales de transport", "Les remboursements sont automatiques", "Il n'y a aucun remboursement"], 0, "« subject to » = soumis à, qui dépend de. Formulation administrative typique."),
    tr("B1 B2 C1", "fr", "Le train a vingt minutes de retard.", ["The train is twenty minutes late.", "The train is running twenty minutes late.", "The train is 20 minutes late.", "The train is delayed by twenty minutes.", "The train is running 20 minutes late."], "« to be X minutes late » ou « to be delayed by X minutes »."),
    dictation("B2 C1", "We apologise for the inconvenience.", ["We apologise for the inconvenience.", "We apologize for the inconvenience."], "Formule figée des annonces : « Nous vous prions de nous excuser pour la gêne occasionnée »."),
  ],
  tags: ["train"],
  lesson: "theme-travel", scenario: "transport", reward: "italy-leather-bag",
};

const colosseum: AtlasMission = {
  id: "italy-colosseum", order: 4, title: "Visiter le Colisée", titleEn: "Visit the Colosseum", place: "roma", minutes: 8,
  briefing: "Le Colisée (Amphithéâtre flavien) a été achevé en 80 apr. J.-C., sous l'empereur Titus. Tu réserves un créneau de visite, tu suis une guide qui commente en anglais pour un groupe international et tu reconstitues la chronologie.",
  objectives: {
    A1: "Comprendre des dates et des chiffres simples.",
    A2: "Réserver un créneau et poser des questions pratiques.",
    B1: "Comprendre une visite guidée et en résumer l'essentiel.",
    B2: "Discuter de faits historiques avec des nuances (estimations, sources).",
    C1: "Commenter la conservation du patrimoine et le tourisme de masse.",
  },
  grammar: ["Passif au passé (was built, was completed)", "Dates et nombres", "Prétérit"],
  phrases: [
    { en: "Two tickets for the 10 o'clock slot, please.", fr: "Deux billets pour le créneau de 10 h, s'il vous plaît." },
    { en: "How long does the tour last?", fr: "Combien de temps dure la visite ?" },
    { en: "It was completed in AD 80.", fr: "Il a été achevé en 80 apr. J.-C." },
    { en: "It could hold tens of thousands of people.", fr: "Il pouvait accueillir des dizaines de milliers de personnes." },
    { en: "Historians estimate that…", fr: "Les historiens estiment que…" },
  ],
  vocab: ["slot", "tour-guide", "ancient", "ruins", "heritage"],
  exercises: [
    match("A1 A2", [["ruins", "ruines"], ["ancient", "antique, ancien"], ["emperor", "empereur"], ["arena", "arène"], ["a guided tour", "une visite guidée"]]),
    listen("A1 A2 B1", "The Colosseum was completed in the year 80, under the emperor Titus.", "Quand a-t-il été achevé ?", ["En 800", "En 80 apr. J.-C.", "En 1980"], 1, "« in the year 80 » = en l'an 80 de notre ère."),
    fill("A1 A2", "Two tickets for the 10 o'clock ___, please.", ["slot", "tour", "entry", "time slot"], "« slot » = créneau horaire réservé.", "Deux billets pour le créneau de 10 h."),
    dialogue("A1 A2 B1", "À l'entrée, avec la guide.",
      say("Guide", "Welcome! Is this your first time in Rome?", "Bienvenue ! C'est votre première fois à Rome ?"),
      pick("Réponds et pose une question pratique.",
        ["Yes, it is! How long does the tour last?", true, "Tu réponds puis demandes la durée : naturel."],
        ["Yes. How many time the tour?", false, "On dit « How long does the tour last? »."]),
      say("Guide", "About an hour. Stay close to the group, please.", "Environ une heure. Restez près du groupe, s'il vous plaît.")),
    { type: "steps", title: "La chronologie du Colisée", brief: "Remets ces étapes de l'histoire du monument dans l'ordre chronologique.", steps: [
      "Emperor Vespasian starts building the amphitheatre (around AD 70–72).",
      "The building is completed under Titus (AD 80).",
      "Games and shows are held there for centuries.",
      "Earthquakes damage the structure in the Middle Ages.",
      "Stone from the building is reused for other constructions.",
      "Restoration work and archaeological studies protect it today.",
    ], explain: "Commencé sous Vespasien, achevé sous Titus en 80, utilisé pendant des siècles, puis endommagé par des séismes et en partie démonté avant d'être protégé et restauré.", bands: b("A2 B1 B2 C1") },
    fix("A2 B1 B2", "The Colosseum was build by the Romans.", ["The Colosseum was built by the Romans."], "Passif : was + participe passé (build → built)."),
    mcq("B1 B2 C1", "La guide dit : « Estimates vary, but it may have held around 50,000 spectators. » Que retiens-tu ?", ["Le chiffre exact est connu", "C'est une estimation, les chiffres varient", "Il y avait 5 000 places"], 1, "« Estimates vary » et « may have held » montrent une incertitude : c'est une estimation."),
    tr("B1 B2 C1", "fr", "Le Colisée a été achevé sous l'empereur Titus.", ["The Colosseum was completed under the emperor Titus.", "The Colosseum was completed under Emperor Titus.", "The Colosseum was finished under the emperor Titus.", "The Colosseum was finished under Emperor Titus."], "Passif au passé : « was completed / finished »."),
    produce("B2 C1", "Tourisme et patrimoine", "Give your opinion: should famous monuments limit the number of daily visitors? Give one argument for and one against.", "Donne ton avis : les monuments célèbres doivent-ils limiter le nombre de visiteurs par jour ? Un argument pour, un contre.", [["limit", "cap", "restrict", "fewer"], ["on the one hand", "however", "but", "although", "on the other hand", "while"], ["protect", "damage", "preserve", "crowds", "experience", "money", "access"]], 25, ["On the one hand, limiting visitors helps protect fragile monuments and makes the visit more pleasant. On the other hand, it can make it harder and more expensive for people to see them.", "I think a daily cap is a good idea because crowds damage the site, although it means some people won't get tickets."], "« On the one hand… on the other hand… » structure un avis équilibré."),
    mcq("C1", "« The site bears the scars of centuries of reuse » signifie :", ["Le site porte les traces de siècles de réemploi", "Le site a été reconstruit à l'identique", "Le site est interdit"], 0, "« bear the scars of » = porter les marques de ; « reuse » = réemploi des pierres."),
    speak("A1 A2", "How long does the tour last?", "Combien de temps dure la visite ?"),
  ],
  tags: ["history", "civilisation", "architecture", "capital"],
  lesson: "b2-passive", scenario: "opinion", reward: "italy-postcard",
};

const art: AtlasMission = {
  id: "italy-art", order: 5, title: "Parler d'art à Florence", titleEn: "Talk about art in Florence", place: "firenze", minutes: 8,
  briefing: "Le centre historique de Florence est inscrit à l'UNESCO. À la Galerie des Offices, Samir, étudiant en histoire de l'art, te fait découvrir des œuvres de la Renaissance, comme La Naissance de Vénus de Botticelli. Vous échangez en anglais avec d'autres visiteurs.",
  objectives: {
    A1: "Nommer des couleurs et des formes dans un tableau.",
    A2: "Décrire simplement ce que tu vois (in the background, on the left).",
    B1: "Dire ce que tu ressens et pourquoi.",
    B2: "Interpréter une œuvre et comparer deux artistes.",
    C1: "Employer un vocabulaire d'analyse précis et nuancé.",
  },
  grammar: ["There is / there are", "Prépositions de lieu (in the foreground, on the right)", "Exprimer une opinion (It seems / It strikes me)"],
  phrases: [
    { en: "In the middle, there's a woman standing on a shell.", fr: "Au milieu, il y a une femme debout sur un coquillage." },
    { en: "In the background, you can see the sea.", fr: "À l'arrière-plan, on voit la mer." },
    { en: "The colours are very soft.", fr: "Les couleurs sont très douces." },
    { en: "It makes me feel calm.", fr: "Ça me donne une impression de calme." },
    { en: "What strikes me is…", fr: "Ce qui me frappe, c'est…" },
  ],
  vocab: ["painting", "background", "foreground", "masterpiece", "exhibition-it"],
  exercises: [
    match("A1 A2", [["a painting", "un tableau"], ["a sculpture", "une sculpture"], ["the background", "l'arrière-plan"], ["the foreground", "le premier plan"], ["a masterpiece", "un chef-d'œuvre"]]),
    { type: "identify", title: "Quel tableau ?", audio: "In this painting, a goddess stands on a large shell in the sea. On the left, winds are blowing her towards the shore, and on the right a woman is waiting with a cloak.", options: [
      { en: "The Birth of Venus (Botticelli)", fr: "La Naissance de Vénus (Botticelli)", motif: "shell-sea" }, { en: "The Last Supper (Leonardo)", fr: "La Cène (Léonard de Vinci)", motif: "long-table" }, { en: "The Creation of Adam (Michelangelo)", fr: "La Création d'Adam (Michel-Ange)", motif: "hands" }, { en: "Primavera (Botticelli)", fr: "Le Printemps (Botticelli)", motif: "garden" },
    ], answer: 0, explain: "La déesse sur un coquillage, poussée par les vents vers le rivage : La Naissance de Vénus, de Botticelli, conservée aux Offices.", bands: b("A1 A2 B1 B2") },
    fill("A1 A2", "In the ___, you can see the sea.", ["background"], "« in the background » = à l'arrière-plan.", "À l'arrière-plan, on voit la mer."),
    listen("A1 A2 B1", "On the right, a woman is holding a cloak with flowers on it.", "Que tient la femme à droite ?", ["Un coquillage", "Un manteau fleuri", "Un livre"], 1, "« a cloak with flowers on it » = un manteau orné de fleurs."),
    reorder("A2 B1", "There is a woman standing on a shell", "« There is » + nom + participe présent pour décrire une scène.", "Il y a une femme debout sur un coquillage."),
    dialogue("A2 B1 B2", "Une visiteuse américaine te parle devant le tableau.",
      say("Visitor", "It's smaller than I expected, isn't it?", "C'est plus petit que je pensais, non ?"),
      pick("Réagis et donne ton impression.",
        ["Actually, I think it's huge! And the colours are so soft.", true, "Tu nuances poliment avec « Actually » et tu ajoutes ton impression."],
        ["No.", false, "Réponse fermée : la conversation s'arrête."]),
      say("Visitor", "True. What do you like most about it?", "C'est vrai. Qu'est-ce que tu aimes le plus ?"),
      pick("Explique.",
        ["What strikes me is the movement — her hair seems to be blowing in the wind.", true, "« What strikes me is… » : formulation précise pour une impression."],
        ["I like it because it is beautiful because yes.", false, "Pas d'argument réel."])),
    fix("B1 B2 C1", "The painting makes me to feel calm.", ["The painting makes me feel calm."], "« make someone + verbe sans to »."),
    produce("B1 B2 C1", "Ton œuvre préférée", "Describe a painting you saw and explain how it makes you feel.", "Décris un tableau vu et explique ce qu'il te fait ressentir.", [["there is", "there's", "there are", "in the", "on the", "you can see"], ["feel", "makes me", "strikes me", "love", "like", "moving", "calm"]], 22, ["In the middle of the painting there's a goddess on a shell, and in the background you can see the sea. It makes me feel calm, but also a bit dreamy.", "What strikes me most is the light: it makes the whole scene feel peaceful."], "Décris d'abord (où, quoi), puis donne ton ressenti."),
    mcq("B2 C1", "Quelle phrase est la plus nuancée ?", ["It's the best painting in the world.", "To me, it's one of the most striking works of the period, partly because of its delicate lines.", "Everybody loves it."], 1, "« To me », « one of the most », « partly because » : un avis personnel argumenté et nuancé."),
    mcq("C1", "« The figures seem almost weightless » signifie :", ["Les personnages semblent presque sans poids, légers", "Les personnages sont très lourds", "Les personnages ont été effacés"], 0, "« weightless » = sans poids ; on l'emploie pour une impression de légèreté."),
    tr("B2 C1", "fr", "Ce qui me frappe, c'est la lumière.", ["What strikes me is the light.", "What strikes me is the lighting.", "What strikes me most is the light."], "« What strikes me is… » = ce qui me frappe, c'est…"),
    speak("A1 A2", "In the background, you can see the sea.", "À l'arrière-plan, on voit la mer."),
  ],
  tags: ["art", "architecture", "history"],
  lesson: "b1-opinions", scenario: "opinion", reward: "italy-botticelli-print",
};

const dolomites: AtlasMission = {
  id: "italy-dolomites", order: 6, title: "Randonnée dans les Dolomites", titleEn: "Hiking in the Dolomites", place: "dolomiti", minutes: 9,
  briefing: "Les Dolomites sont inscrites au patrimoine mondial de l'UNESCO depuis 2009. Chiara, guide du Haut-Adige (où l'on parle italien, allemand et ladin), accompagne en anglais un groupe international. En été, les orages de l'après-midi sont fréquents. Il s'agit d'un exercice de langue, pas d'une formation à la montagne.",
  objectives: {
    A1: "Nommer l'équipement et la météo.",
    A2: "Demander l'heure de départ et la durée d'un itinéraire.",
    B1: "Comprendre un bulletin météo de montagne et adapter le plan.",
    B2: "Discuter d'un risque et proposer une alternative.",
    C1: "Décrire un paysage de façon précise et évocatrice.",
  },
  grammar: ["Futur (will) et prévisions", "Conditionnel 1", "Comparatifs (higher, steeper, safer)"],
  phrases: [
    { en: "How long is the hike?", fr: "Combien de temps dure la randonnée ?" },
    { en: "Thunderstorms are likely in the afternoon.", fr: "Des orages sont probables l'après-midi." },
    { en: "We should start early.", fr: "On devrait partir tôt." },
    { en: "Can we have lunch at the mountain hut?", fr: "On peut déjeuner au refuge ?" },
    { en: "I'm out of breath.", fr: "Je suis essoufflé." },
    { en: "The peaks are glowing pink.", fr: "Les sommets rougeoient." },
  ],
  vocab: ["hut", "thunderstorm", "trail", "steep", "summit-it", "itinerary-it"],
  exercises: [
    match("A1 A2", [["a mountain hut", "un refuge"], ["a trail", "un sentier"], ["steep", "raide"], ["a thunderstorm", "un orage"], ["sunscreen", "crème solaire"]]),
    { type: "assemble", title: "Le sac de la journée", brief: "Chiara : « It's sunny now, but storms are likely after 2pm and it's cold at 2,500 metres. We'll eat at the hut. » Choisis ce que tu emportes.", options: [
      { id: "rain", en: "a rain jacket", fr: "une veste de pluie" }, { id: "fleece", en: "a fleece", fr: "une polaire" }, { id: "sun", en: "sunscreen and a hat", fr: "crème solaire et chapeau" }, { id: "water", en: "water", fr: "de l'eau" },
      { id: "cash", en: "some cash for the hut", fr: "un peu d'espèces pour le refuge" }, { id: "flipflops", en: "flip-flops", fr: "tongs" }, { id: "stove", en: "a camping stove", fr: "un réchaud de camping" },
    ], correct: ["rain", "fleece", "sun", "water", "cash"], explain: "Soleil puis orages et froid en altitude : protection solaire, couche chaude et veste de pluie. On mange au refuge, donc pas besoin de réchaud ; certains refuges n'acceptent pas toujours la carte, un peu d'espèces est utile.", bands: b("A1 A2 B1") },
    fill("A1 A2", "How ___ is the hike?", ["long"], "« How long…? » pour une durée.", "Combien de temps dure la randonnée ?"),
    listen("A1 A2 B1", "The hike takes about four hours, and the hut is halfway.", "Où est le refuge ?", ["Au départ", "À mi-chemin", "Au sommet"], 1, "« halfway » = à mi-chemin."),
    { type: "decide", title: "Bulletin de montagne", doc: "Mountain forecast: sunny until 1pm. From 2pm, thunderstorms likely above 2,000 m, with lightning and sudden temperature drops. Tomorrow: stable and sunny all day.", audio: true, question: "Vous hésitez entre une crête exposée à 2 800 m aujourd'hui et demain. Que proposes-tu ?", options: [
      { en: "Do a shorter, lower walk today and the ridge tomorrow.", correct: true, why: "Orages probables au-dessus de 2 000 m cet après-midi, beau temps stable demain : on décale la crête." },
      { en: "Go up the ridge this afternoon.", correct: false, why: "Une crête exposée pendant un orage est une très mauvaise idée." },
      { en: "Cancel the whole trip.", correct: false, why: "Inutile : le bulletin annonce un beau temps stable demain." },
    ], bands: b("A2 B1 B2 C1") },
    dialogue("A2 B1", "Au refuge, à midi.",
      say("Host", "Hi! Table for how many?", "Bonjour ! Une table pour combien ?"),
      pick("Vous êtes quatre et vous êtes pressés.",
        ["Four, please. Is there anything quick? We want to be down before the storm.", true, "Tu donnes l'info et tu expliques ta contrainte."],
        ["Four. Fast.", false, "Trop sec."]),
      say("Host", "The barley soup is ready now.", "La soupe d'orge est prête tout de suite.")),
    fix("B1 B2", "If it will rain, we go down.", ["If it rains, we'll go down.", "If it rains, we will go down."], "Conditionnel 1 : if + présent, puis will."),
    tr("B1 B2 C1", "fr", "Le sentier est plus raide que je ne pensais.", ["The trail is steeper than I thought.", "The path is steeper than I thought.", "The trail is steeper than I expected.", "The path is steeper than I expected."], "Comparatif court : steep → steeper than."),
    produce("B2 C1", "Proposer un autre plan", "The group wants to continue to the summit, but dark clouds are coming. Suggest turning back and explain why, tactfully.", "Le groupe veut continuer vers le sommet, mais des nuages noirs arrivent. Propose de faire demi-tour avec tact.", [["clouds", "storm", "thunder", "weather", "lightning"], ["turn back", "go back", "head down", "go down", "come back"], ["tomorrow", "another day", "next time", "instead", "safer", "better"]], 22, ["I know we're close, but those clouds look like a storm is coming. I think it'd be safer to turn back now and try the summit tomorrow, when it's sunny all day.", "Maybe we should head down — the storm is coming fast and the forecast is much better tomorrow."], "Reconnais l'envie du groupe (« I know we're close ») avant de proposer."),
    produce("B1 B2 C1", "Décris le paysage", "Describe the landscape at sunset from the hut.", "Décris le paysage au coucher du soleil depuis le refuge.", [["peaks", "mountains", "rocks", "cliffs", "summits"], ["pink", "orange", "glow", "glowing", "light", "sky", "sunset"]], 18, ["The jagged peaks are glowing pink and orange, and the valley below is already in shadow. It's absolutely breathtaking.", "The rocks turn pink in the evening light and the sky is clear."], "Le présent continu (« are glowing ») fait vivre la scène."),
    mcq("C1", "« The jagged peaks » décrit des sommets :", ["arrondis", "dentelés, déchiquetés", "enneigés"], 1, "« jagged » = dentelé, en dents de scie : très juste pour les Dolomites."),
    speak("A1 A2", "How long is the hike?", "Combien de temps dure la randonnée ?"),
  ],
  tags: ["hiking", "nature", "snow"],
  lesson: "b1-conditionals", scenario: "plans", reward: "italy-hiking-poles", activityDisclaimer: true,
};

const market: AtlasMission = {
  id: "italy-market", order: 7, title: "Le marché aux puces", titleEn: "The flea market", place: "roma", minutes: 8,
  briefing: "Le dimanche matin, le marché de Porta Portese, à Rome, réunit des centaines de stands de brocante. Sur les marchés alimentaires, les prix sont en général fixes ; chez les brocanteurs, discuter le prix poliment est courant. Le vendeur parle anglais avec les visiteurs.",
  objectives: {
    A1: "Demander un prix et comprendre un montant en euros.",
    A2: "Comparer deux objets et poser des questions.",
    B1: "Négocier poliment.",
    B2: "Refuser une offre avec tact et faire une contre-proposition.",
    C1: "Jouer avec les nuances de politesse pour conclure un bon accord.",
  },
  grammar: ["Comparatifs", "Modaux (could, would)", "Formules de politesse"],
  phrases: [
    { en: "How much is this lamp?", fr: "Combien coûte cette lampe ?" },
    { en: "Is this one older than that one?", fr: "Celle-ci est plus ancienne que celle-là ?" },
    { en: "Would you take thirty?", fr: "Vous la laisseriez à trente ?" },
    { en: "That's a bit more than I wanted to spend.", fr: "C'est un peu plus que ce que je voulais dépenser." },
    { en: "It's a deal!", fr: "Marché conclu !" },
    { en: "I'll think about it, thanks.", fr: "Je vais réfléchir, merci." },
  ],
  vocab: ["bargain", "price", "deal", "second-hand", "cash"],
  exercises: [
    match("A1 A2", [["price", "prix"], ["cheap", "bon marché"], ["expensive", "cher"], ["second-hand", "d'occasion"], ["a deal", "un accord, une affaire"]]),
    listen("A1 A2 B1", "This one is forty-five euros, but for you, forty.", "Quel prix propose le vendeur ?", ["14 €", "40 €", "45 €", "54 €"], 1, "Il annonce 45 € puis propose 40 € (« for you, forty »)."),
    fill("A1 A2", "Excuse me, how ___ is this lamp?", ["much"], "« How much is…? » pour demander un prix.", "Combien coûte cette lampe ?"),
    reorder("A1 A2 B1", "Is this one older than that one", "Comparatif court : old → older than.", "Celle-ci est plus ancienne que celle-là ?"),
    { type: "bargain", title: "La lampe en laiton", brief: "Tu veux une vieille lampe en laiton. Le vendeur demande 45 €. Ton budget : environ 30 €. Reste poli : un ton agressif fait remonter le prix.", item: "a brass lamp", currency: "€", start: 45, target: 32, floor: 28, turns: [
      { seller: "Beautiful lamp, isn't it? Forty-five euros.", options: [
        { en: "It's lovely! Would you take thirty?", delta: -7, mood: "good", why: "Compliment + proposition claire : bonne ouverture." },
        { en: "Forty-five? That's a joke.", delta: 0, mood: "rude", why: "Vexer le vendeur ne fait pas baisser le prix." },
        { en: "OK, forty-five is fine.", delta: 0, mood: "weak", why: "Tu acceptes le premier prix sans essayer de négocier." },
      ] },
      { seller: "Thirty? No, no. Thirty-eight, my last price.", options: [
        { en: "I understand. It's a bit more than I wanted to spend… thirty-two?", delta: -5, mood: "good", why: "Tu montres de la compréhension et tu remontes un peu : négociation équilibrée." },
        { en: "Thirty or I leave.", delta: 0, mood: "rude", why: "Ultimatum : le vendeur se braque." },
        { en: "Fine, thirty-eight.", delta: 0, mood: "weak", why: "Tu abandonnes trop vite." },
      ] },
      { seller: "Mmm… thirty-three, and I give you this little bag.", options: [
        { en: "It's a deal! Thank you so much.", delta: 0, mood: "good", why: "Bon accord, conclu chaleureusement." },
        { en: "Twenty-five.", delta: 0, mood: "rude", why: "Redescendre sous ta propre offre est perçu comme de la mauvaise foi." },
      ] },
    ], bands: b("A2 B1 B2 C1") },
    fix("B1 B2", "This lamp is more old than the other.", ["This lamp is older than the other.", "This lamp is older than the other one."], "Adjectif court : older, pas « more old »."),
    mcq("B1 B2 C1", "Sur un marché alimentaire romain, tu achètes des tomates. Négocier le prix est :", ["attendu", "en général peu courant : les prix affichés sont fixes", "obligatoire"], 1, "Sur les marchés alimentaires, les prix sont en général affichés et fixes ; la négociation se pratique plutôt en brocante."),
    tr("B1 B2 C1", "fr", "C'est un peu plus que ce que je voulais dépenser.", ["That's a bit more than I wanted to spend.", "It's a bit more than I wanted to spend.", "That's slightly more than I wanted to spend.", "That's a little more than I wanted to spend."], "« a bit more than » adoucit le refus."),
    produce("B2 C1", "Refuser avec tact", "The seller won't go below 40 euros for a vase you like. Refuse politely and leave the door open.", "Le vendeur refuse de descendre sous 40 € pour un vase. Refuse poliment en laissant la porte ouverte.", [["thank", "thanks", "appreciate", "lovely", "beautiful"], ["think about", "come back", "maybe later", "another time", "budget", "too much", "can't"]], 15, ["Thanks, it's really beautiful, but it's a bit over my budget. I'll think about it and maybe come back later.", "I appreciate it, but forty is too much for me today. Maybe another time!"], "Remercie, donne une raison neutre (le budget) et laisse une porte ouverte."),
    mcq("C1", "Le vendeur dit « I can't go any lower, I'm afraid. » C'est :", ["un refus ferme mais poli", "une offre spéciale", "une insulte"], 0, "« I'm afraid » adoucit un refus ferme."),
    speak("A1 A2", "How much is this lamp?", "Combien coûte cette lampe ?"),
  ],
  tags: ["market", "city", "capital"],
  lesson: "a2-comparatives", scenario: "problem-abroad", reward: "italy-summer-dress",
};

const cafe: AtlasMission = {
  id: "italy-cafe", order: 8, title: "Café et gelato", titleEn: "Coffee and gelato", place: "milano", minutes: 7,
  briefing: "À Milan, Kenji, voyageur japonais, et toi découvrez les habitudes des bars italiens, en anglais avec le barista. Ce sont des pratiques courantes, pas des règles absolues : beaucoup de gens boivent leur café au comptoir, souvent plus rapidement et moins cher qu'en salle, et le cappuccino se boit surtout le matin.",
  objectives: {
    A1: "Commander un café ou une glace.",
    A2: "Choisir des parfums et demander le prix au comptoir ou en salle.",
    B1: "Comprendre et expliquer une habitude locale.",
    B2: "Parler de différences culturelles sans généraliser.",
    C1: "Manier l'humour et la nuance sur les habitudes alimentaires.",
  },
  grammar: ["Can I have…? / I'll have…", "Fréquence (usually, often, sometimes)", "Nuancer (tend to, quite often)"],
  phrases: [
    { en: "An espresso, please.", fr: "Un expresso, s'il vous plaît." },
    { en: "Do I pay first?", fr: "Je paie d'abord ?" },
    { en: "Is it cheaper at the counter?", fr: "C'est moins cher au comptoir ?" },
    { en: "Can I have two flavours in a cup?", fr: "Je peux avoir deux parfums en pot ?" },
    { en: "People tend to have cappuccino in the morning.", fr: "Les gens ont tendance à prendre un cappuccino le matin." },
  ],
  vocab: ["counter", "flavour", "cone", "receipt-it", "espresso"],
  exercises: [
    match("A1 A2", [["a cone", "un cornet"], ["a cup (for ice cream)", "un pot"], ["a flavour", "un parfum"], ["the counter", "le comptoir"], ["the till", "la caisse"]]),
    fill("A1 A2", "An ___, please.", ["espresso", "coffee"], "Un expresso = « an espresso ». Au bar, « un caffè » désigne justement un expresso.", "Un expresso, s'il vous plaît."),
    { type: "decide", title: "Le bar du matin", doc: "BAR — Price at the counter: espresso €1.30, cappuccino €1.60. Table service: espresso €2.50. Please pay at the till first and bring your receipt to the counter.", question: "Tu veux un expresso rapide et pas cher. Que fais-tu ?", options: [
      { en: "Pay at the till first, then give my receipt at the counter and drink it there.", correct: true, why: "Prix au comptoir moins cher, et ici on paie d'abord à la caisse puis on donne le ticket au barista." },
      { en: "Sit at a table and wait for the waiter.", correct: false, why: "Possible, mais plus cher (2,50 € en salle) et plus lent." },
      { en: "Order at the counter and pay when I leave.", correct: false, why: "Le panneau demande de payer d'abord à la caisse." },
    ], bands: b("A1 A2 B1") },
    listen("A1 A2 B1", "Cone or cup? You can have up to three flavours.", "Combien de parfums peux-tu choisir ?", ["Un seul", "Jusqu'à trois", "Autant que tu veux"], 1, "« up to three flavours » = jusqu'à trois parfums."),
    dialogue("A1 A2 B1", "Chez le glacier.",
      say("Server", "Hi! Cone or cup?", "Bonjour ! Cornet ou pot ?"),
      pick("Choisis un pot avec deux parfums.",
        ["A cup, please — pistachio and lemon.", true, "Clair et naturel."],
        ["A cup with two perfumes.", false, "Faux ami : un parfum de glace = « flavour », pas « perfume »."]),
      say("Server", "Small or medium?", "Petit ou moyen ?"),
      pick("Petit.",
        ["Small, please.", true, "Réponse courte et polie."],
        ["Little size of cup.", false, "Pas naturel : « small »."])),
    fix("A2 B1 B2 C1", "I'd like a ice cream with two perfumes.", ["I'd like an ice cream with two flavours.", "I'd like an ice cream with two flavors.", "I would like an ice cream with two flavours."], "« an ice cream » (voyelle) et « flavours » (faux ami « perfume »)."),
    tr("B1 B2 C1", "fr", "Les gens ont tendance à boire leur café au comptoir.", ["People tend to drink their coffee at the counter.", "People tend to have their coffee at the counter.", "People tend to drink coffee at the counter.", "People tend to have coffee at the counter."], "« tend to » nuance : une tendance, pas une règle."),
    mcq("B1 B2 C1", "Quelle phrase décrit le mieux l'habitude du cappuccino ?", ["Italians never drink cappuccino after 11am.", "Many people in Italy tend to have cappuccino in the morning rather than after a meal.", "Cappuccino is forbidden in the afternoon."], 1, "« Many people… tend to » décrit une pratique courante sans en faire une règle absolue."),
    produce("B2 C1", "Différences culturelles", "Kenji asks how coffee habits in Italy compare with those in your country. Answer with nuance.", "Kenji te demande comment les habitudes de café en Italie se comparent à celles de ton pays. Réponds avec nuance.", [["in france", "at home", "in my country", "where i'm from", "back home"], ["tend to", "usually", "often", "quite", "more", "less", "whereas", "while"]], 22, ["Back home in France, people often sit down for a coffee and stay a while, whereas here many people tend to drink a quick espresso standing at the counter.", "In my country we usually have bigger coffees, while here espresso is the default."], "« tend to », « often », « whereas » : on compare sans généraliser."),
    mcq("B2 C1", "Kenji dit en riant : « I committed a crime — I ordered a cappuccino at 4pm. » Ton :", ["Il est sérieusement inquiet", "Il plaisante sur une habitude locale", "Il a vraiment enfreint une loi"], 1, "C'est de l'autodérision : il exagère volontairement une simple habitude."),
    speak("A1 A2", "A cup, please, pistachio and lemon.", "Un pot, s'il vous plaît, pistache et citron."),
  ],
  tags: ["food", "coffee-tea", "city"],
  lesson: "b2-informal-english", scenario: "friends", reward: "italy-lemon-tree",
};

const advice: AtlasMission = {
  id: "italy-advice", order: 9, title: "Demander des conseils culinaires", titleEn: "Ask for food recommendations", place: "roma", minutes: 8,
  briefing: "Dans une trattoria romaine, Emma, voyageuse australienne, et toi demandez des conseils en anglais au serveur. La cuisine italienne est très régionale : à Rome, on trouve par exemple la carbonara, la cacio e pepe ou l'amatriciana. Tu demandes ce qui est de saison, tu précises un régime alimentaire et tu comprends l'addition (le « coperto »).",
  objectives: {
    A1: "Comprendre le nom des plats et des parties du menu.",
    A2: "Demander une recommandation et préciser ce que tu ne manges pas.",
    B1: "Comprendre une description de plat et réagir.",
    B2: "Comprendre l'addition et poser une question délicate poliment.",
    C1: "Discuter de « l'authenticité » culinaire avec nuance.",
  },
  grammar: ["Questions (What would you recommend?)", "Relatives (a dish which / that…)", "Questions indirectes polies"],
  phrases: [
    { en: "What would you recommend?", fr: "Que nous conseillez-vous ?" },
    { en: "What's the local speciality?", fr: "Quelle est la spécialité locale ?" },
    { en: "I don't eat meat.", fr: "Je ne mange pas de viande." },
    { en: "Is there cream in the carbonara?", fr: "Il y a de la crème dans la carbonara ?" },
    { en: "Could you tell me what the 'coperto' is?", fr: "Pourriez-vous me dire ce qu'est le « coperto » ?" },
  ],
  vocab: ["recommend", "speciality", "vegetarian", "cover-charge", "tip"],
  exercises: [
    match("A1 A2", [["starter", "entrée"], ["main course", "plat principal"], ["dessert", "dessert"], ["the bill", "l'addition"], ["a speciality", "une spécialité"]]),
    fill("A1 A2", "What would you ___?", ["recommend", "suggest"], "« What would you recommend? » = que me conseillez-vous ?", "Que me conseillez-vous ?"),
    listen("A1 A2 B1", "Cacio e pepe is very simple: pasta, pecorino cheese and black pepper. No meat at all.", "Pourquoi Emma, végétarienne, peut-elle en manger ?", ["Il n'y a pas de viande", "C'est sans fromage", "C'est un dessert"], 0, "« No meat at all » : pâtes, pecorino et poivre noir."),
    dialogue("A1 A2 B1", "Le serveur arrive.",
      say("Waiter", "Ready to order, or do you need a minute?", "Prêts à commander, ou il vous faut une minute ?"),
      pick("Demande un conseil.",
        ["Actually, what would you recommend? We'd like something local.", true, "Question naturelle qui donne une indication (local)."],
        ["What is good?", false, "Compréhensible mais vague."]),
      say("Waiter", "Our carbonara is very popular. It's made with guanciale, eggs and pecorino.", "Notre carbonara est très demandée. Elle est faite avec du guanciale, des œufs et du pecorino."),
      pick("Emma ne mange pas de viande.",
        ["My friend doesn't eat meat. Is there anything vegetarian?", true, "Tu expliques le besoin et poses une question ouverte."],
        ["My friend no meat.", false, "Il manque le verbe : « doesn't eat meat »."])),
    mcq("A2 B1", "Le guanciale est :", ["un fromage", "de la joue de porc séchée", "un légume"], 1, "Le guanciale est de la joue de porc séchée, utilisée dans la carbonara et l'amatriciana."),
    reorder("A2 B1 B2", "Could you tell me what the cover charge is", "Question indirecte : pas d'inversion après « Could you tell me what ».", "Pourriez-vous me dire ce qu'est le couvert ?"),
    { type: "decide", title: "L'addition", doc: "BILL — 2 × cacio e pepe €24.00 · 1 × water €3.00 · Coperto (2) €5.00 · TOTAL €32.00. Service not included.", question: "Emma s'étonne des 5 € de « coperto ». Que lui expliques-tu ?", options: [
      { en: "It's a cover charge per person for bread and table service; it's common in Italy.", correct: true, why: "Le « coperto » est un couvert facturé par personne, courant dans beaucoup de restaurants italiens et indiqué sur le menu." },
      { en: "It's a mistake, we should refuse to pay.", correct: false, why: "Ce n'est pas une erreur s'il est indiqué sur le menu." },
      { en: "It's the tip, so we shouldn't leave anything else.", correct: false, why: "Le couvert n'est pas un pourboire ; le pourboire reste libre." },
    ], bands: b("B1 B2 C1") },
    fix("B1 B2 C1", "Could you say me what is in this dish?", ["Could you tell me what is in this dish?", "Could you tell me what's in this dish?"], "« tell someone » (pas « say someone ») ; « what is in this dish » reste correct car « what » est le sujet."),
    produce("B2 C1", "L'authenticité", "Emma says carbonara with cream is 'fake'. Give a nuanced opinion about 'authentic' recipes.", "Emma dit que la carbonara à la crème est « fausse ». Donne un avis nuancé sur les recettes « authentiques ».", [["traditional", "authentic", "original", "classic"], ["but", "however", "although", "while", "whereas"], ["recipe", "dish", "version", "cream", "cooks", "people"]], 25, ["The traditional Roman version doesn't use cream, but recipes travel and change, so I wouldn't call other versions fake — just different. I'd still try the classic one here.", "It's true that the classic recipe has no cream; however, every family adapts recipes, and that's how cuisine evolves."], "Reconnais un fait (la recette traditionnelle) puis nuance (« but recipes evolve »)."),
    mcq("C1", "« This dish is a far cry from what I had back home » signifie :", ["Ce plat est très différent de ce que j'ai mangé chez moi", "Ce plat me fait pleurer", "Ce plat vient de loin"], 0, "« a far cry from » = très différent de."),
    tr("B1 B2 C1", "fr", "Quelle est la spécialité de la région ?", ["What's the local speciality?", "What is the local speciality?", "What's the regional speciality?", "What is the speciality of the region?", "What's the local specialty?", "What is the regional specialty?"], "« speciality » (britannique) / « specialty » (américain)."),
    speak("A1 A2", "What would you recommend?", "Que nous conseillez-vous ?"),
  ],
  tags: ["food", "capital"],
  lesson: "theme-restaurant", scenario: "restaurant", reward: "italy-espresso-souvenir",
};

// ---------------------------------------------------------------------
// Final story — "48 hours: Florence to Bologna"
// ---------------------------------------------------------------------

const finalNodes: StoryNode[] = [
  {
    id: "checkin", scene: "Tu arrives à Florence à 9 h. Ta chambre ne sera prête qu'à 14 h. La réceptionniste parle anglais avec les voyageurs.",
    lines: [{ speaker: "Receptionist", en: "Good morning! I'm afraid check-in is at 2pm.", fr: "Bonjour ! Je crains que l'arrivée soit à 14 h." }],
    step: { kind: "choice", prompt: "Que dis-tu ?", options: [
      { en: "No problem. Could I leave my luggage here until then?", next: "uffizi", good: true, why: "Tu acceptes la règle et proposes une solution pratique." },
      { en: "But I paid! I want my room now.", next: "upset", good: false, why: "Exiger ne change pas l'heure d'arrivée et crispe l'échange." },
    ] },
  },
  {
    id: "upset", scene: "La réceptionniste reste calme mais ne peut rien faire. Tu te reprends.",
    lines: [{ speaker: "Receptionist", en: "I understand. The room is still being cleaned, sorry.", fr: "Je comprends. La chambre est encore en cours de ménage, désolée." }],
    step: { kind: "choice", prompt: "Rattrape la situation.", options: [
      { en: "Sorry, I'm just tired. Could I leave my bag here, then?", next: "uffizi", good: true, why: "S'excuser et proposer une solution détend l'échange." },
      { en: "Whatever.", next: "uffizi", good: false, why: "La relation reste froide." },
    ] },
  },
  {
    id: "uffizi", scene: "Bagages déposés, tu entres à la Galerie des Offices. Un guide décrit un tableau à un groupe.",
    step: { kind: "exercise", exercise: { type: "identify", title: "Devant le tableau", audio: "In this painting, a goddess stands on a large shell. The wind gods blow her towards the shore, where a woman waits with a flowered cloak.", options: [
      { en: "The Birth of Venus", fr: "La Naissance de Vénus", motif: "shell-sea" }, { en: "The Last Supper", fr: "La Cène", motif: "long-table" }, { en: "The Mona Lisa", fr: "La Joconde", motif: "portrait" },
    ], answer: 0, explain: "Coquillage, vents et rivage : La Naissance de Vénus, de Botticelli, exposée aux Offices." }, next: "strike" },
  },
  {
    id: "strike", scene: "Le lendemain, tu dois aller à Bologne. Une grève touche les trains régionaux.",
    lines: [{ speaker: "Announcement", en: "Due to a strike, some regional trains are cancelled today. High-speed services are running normally.", fr: "En raison d'une grève, certains trains régionaux sont annulés. Les trains à grande vitesse circulent normalement." }],
    step: { kind: "choice", prompt: "Que fais-tu ?", options: [
      { en: "I'll ask at the ticket office if I can switch to a high-speed train.", next: "office", good: true, why: "Les trains à grande vitesse circulent : changer de billet est la solution la plus simple." },
      { en: "I'll look for a coach (long-distance bus) to Bologna.", next: "coach", good: true, why: "Une alternative raisonnable aussi : tes choix mènent à des scènes différentes." },
    ] },
  },
  {
    id: "office", scene: "Au guichet, l'agent attend ta demande.",
    step: { kind: "produce", exercise: { type: "produce", title: "Changer de billet", prompt: "Explain that your regional train is cancelled and ask to change to a high-speed train. Ask how much extra it costs.", fr: "Explique que ton régional est annulé et demande à passer sur un train à grande vitesse. Demande le supplément.", mustInclude: [["cancelled", "canceled", "strike"], ["change", "switch", "swap", "high-speed", "frecciarossa", "another train"], ["how much", "extra", "cost", "pay", "price"]], minWords: 15, samples: ["Hi, my regional train to Bologna is cancelled because of the strike. Could I switch to a high-speed train? How much extra would it cost?", "My train was cancelled. Can I change to the Frecciarossa, and do I need to pay extra?"], tip: "Contexte → demande → question sur le prix." }, next: "class" },
  },
  {
    id: "coach", scene: "À la gare routière, un panneau affiche les départs pour Bologne.",
    step: { kind: "exercise", exercise: { type: "decide", title: "Les cars pour Bologne", doc: "COACHES TO BOLOGNA — 10:30 sold out · 12:15 seats available, arrives 13:45 · 16:00 seats available, arrives 17:30. Book online or at the kiosk.", question: "Ton cours de cuisine commence à 15 h à Bologne. Que choisis-tu ?", options: [
      { en: "The 12:15 coach.", correct: true, why: "Il arrive à 13 h 45, avant ton cours de 15 h, et il reste des places." },
      { en: "The 10:30 coach.", correct: false, why: "Il est complet (« sold out »)." },
      { en: "The 16:00 coach.", correct: false, why: "Il arrive à 17 h 30 : trop tard pour le cours." },
    ] }, next: "class" },
  },
  {
    id: "class", scene: "À Bologne, Marco commence le cours de pâtes fraîches.",
    step: { kind: "exercise", exercise: { type: "steps", title: "Les étapes de Marco", brief: "Remets les instructions dans l'ordre.", steps: ["Make a well in the flour.", "Crack the eggs into it.", "Knead the dough until it's smooth.", "Let it rest.", "Roll it out and cut the tagliatelle."], explain: "Puits, œufs, pétrissage, repos, puis on étale et on découpe." }, next: "dinner" },
  },
  {
    id: "dinner", scene: "Le soir, au restaurant, tu dois signaler une allergie aux fruits à coque.",
    lines: [{ speaker: "Waiter", en: "Tonight we have a pesto special.", fr: "Ce soir nous avons un plat au pesto." }],
    step: { kind: "produce", exercise: { type: "produce", title: "Signaler une allergie", prompt: "Tell the waiter about your nut allergy and ask what you can safely eat.", fr: "Signale ton allergie aux fruits à coque et demande ce que tu peux manger sans risque.", mustInclude: [["allergic", "allergy"], ["nut", "nuts", "pine nuts"], ["what", "which", "anything", "recommend", "can i", "safe"]], minWords: 12, samples: ["I'm allergic to nuts, so I can't have the pesto — pine nuts, right? What would you recommend instead?", "I have a nut allergy. Is there anything on the menu that's completely nut-free?"], tip: "Le pesto genovese contient en général des pignons de pin : mentionne-le." }, next: "meet" },
  },
  {
    id: "meet", scene: "À la table voisine, une voyageuse t'adresse la parole.",
    lines: [{ speaker: "Emma", en: "Sorry — did you do the pasta class today? How was it?", fr: "Pardon, tu as fait le cours de pâtes aujourd'hui ? C'était comment ?" }],
    step: { kind: "choice", prompt: "Réponds.", options: [
      { en: "Yes! It was great — messy, but my tagliatelle actually worked. Are you travelling alone?", next: "story", good: true, why: "Tu réponds avec détails et relances par une question." },
      { en: "Yes.", next: "story", good: false, why: "Correct, mais la conversation s'éteint." },
    ] },
  },
  {
    id: "story", scene: "Dans ton carnet, tu racontes ces 48 heures.",
    step: { kind: "produce", exercise: { type: "produce", title: "Mon voyage en Italie", prompt: "Write about your 48 hours: what you saw, a problem you solved and what you learned to cook.", fr: "Raconte tes 48 heures : ce que tu as vu, un problème résolu et ce que tu as appris à cuisiner.", mustInclude: [["saw", "visited", "went"], ["strike", "cancelled", "problem", "changed", "coach"], ["pasta", "tagliatelle", "cook", "cooked", "made", "learned", "learnt"]], minWords: 30, samples: ["In Florence I saw The Birth of Venus at the Uffizi. The next day my regional train was cancelled because of a strike, so I changed my ticket and still made it to Bologna, where I learned to make fresh tagliatelle.", "I visited the Uffizi, took a coach to Bologna when the trains were on strike, and made pasta from scratch with Marco."], tip: "Prétérit + « so » pour la conséquence d'un problème." }, next: "end" },
  },
  { id: "end", scene: "Ton aventure italienne se termine sur une terrasse de Bologne.", step: { kind: "end", summary: "Tu as négocié une arrivée, décrit une œuvre, contourné une grève, suivi un cours de cuisine, signalé une allergie et raconté ton voyage : tu communiques en anglais dans un pays où ce n'est pas la langue locale." } },
];

// ---------------------------------------------------------------------
// Destination
// ---------------------------------------------------------------------

export const ITALY: AtlasDestination | null = {
  id: "italy",
  tagline: "Des Alpes à la Sicile, vingt régions et autant de cuisines.",
  intro: "L'Italie compte vingt régions aux traditions, dialectes et cuisines très différents. L'italien est la langue officielle ; l'allemand, le français, le ladin ou le slovène sont aussi parlés dans certaines régions. Dans ces missions, tu communiques en anglais, la langue que partagent voyageurs, guides et hôtes venus du monde entier — sans oublier quelques mots d'italien par politesse.",
  palette: { sky: "#E8D9C0", land: "#9DAE7E", sea: "#4E7FA0", accent: "#C1623F", ink: "#2E2A26" },
  landscape: "italy-dolomites-coast",
  places: [
    { id: "roma", name: "Rome", kind: "capitale", fr: "Capitale de l'Italie ; son centre historique est inscrit au patrimoine mondial de l'UNESCO." },
    { id: "napoli", name: "Naples", kind: "ville", fr: "Grande ville du sud au pied du Vésuve ; l'art du pizzaiuolo napolitain est inscrit au patrimoine immatériel de l'UNESCO (2017)." },
    { id: "firenze", name: "Florence", kind: "ville d'art", fr: "Berceau de la Renaissance ; la Galerie des Offices y abrite des œuvres de Botticelli." },
    { id: "bologna", name: "Bologne", kind: "ville", fr: "Ville universitaire d'Émilie-Romagne, réputée pour ses arcades et sa cuisine." },
    { id: "dolomiti", name: "Dolomites", kind: "montagnes", fr: "Massif des Alpes orientales inscrit à l'UNESCO en 2009, à cheval sur plusieurs régions." },
    { id: "milano", name: "Milan", kind: "ville", fr: "Capitale économique du nord, grand centre de design et de mode." },
    { id: "venezia", name: "Venise", kind: "ville sur la lagune", fr: "Ville construite sur une lagune, inscrite avec celle-ci au patrimoine mondial de l'UNESCO." },
  ],
  characters: [
    { id: "giulia", name: "Giulia", role: "Pizzaiola à Naples", origin: "local", personality: "Fière de son métier, rieuse, explique tout avec les mains.", register: "familier", hello: "Welcome! First pizza in Naples? Then sit down, it's an occasion." },
    { id: "marco", name: "Marco", role: "Professeur de cuisine à Bologne", origin: "local", personality: "Patient, précis, très attaché aux recettes de sa grand-mère.", register: "courant", hello: "Flour on the table, eggs in the middle — and no rush." },
    { id: "chiara", name: "Chiara", role: "Guide de montagne dans le Haut-Adige", origin: "local", personality: "Trilingue (italien, allemand, anglais), prudente, passionnée de géologie.", register: "courant", hello: "The mountains decide the plan. We just listen." },
    { id: "samir", name: "Samir", role: "Étudiant en histoire de l'art à Florence, né à Turin", origin: "local", personality: "Enthousiaste, cultivé, aime les débats.", register: "courant", hello: "Every painting here is a conversation across 500 years." },
    { id: "emma", name: "Emma", role: "Voyageuse australienne, végétarienne", origin: "traveller", personality: "Spontanée, directe, toujours affamée.", register: "familier", accent: "en-AU", hello: "Right, where's the best food in this city?" },
    { id: "kenji", name: "Kenji", role: "Voyageur japonais, photographe amateur", origin: "traveller", personality: "Observateur, drôle, prend des notes sur tout.", register: "courant", hello: "I've taken three hundred photos of coffee cups. Is that normal?" },
  ],
  culture: [
    { title: "Une cuisine régionale", fr: "Chaque région a ses spécialités : ragù et tagliatelle à Bologne, pesto en Ligurie, risotto au safran à Milan, carbonara à Rome…" },
    { title: "Le bar", fr: "Le « bar » italien sert surtout du café. Beaucoup de gens le boivent au comptoir ; dans certains bars, on paie d'abord à la caisse." },
    { title: "Le coperto", fr: "Beaucoup de restaurants facturent un « coperto » (couvert) par personne, indiqué sur le menu. Le pourboire reste libre." },
    { title: "Plusieurs langues", fr: "Outre l'italien, on parle notamment allemand et ladin dans le Haut-Adige, français dans la Vallée d'Aoste, slovène près de Trieste." },
    { title: "Le patrimoine", fr: "L'Italie compte de très nombreux sites inscrits au patrimoine mondial de l'UNESCO, des Dolomites aux centres historiques." },
  ],
  food: [
    { en: "Neapolitan pizza", fr: "Pizza napolitaine", desc: "Pâte moelleuse aux bords gonflés, cuite très rapidement au four à bois." },
    { en: "Tagliatelle al ragù", fr: "Tagliatelle au ragù", desc: "Pâtes fraîches aux œufs et sauce à la viande mijotée, plat emblématique de Bologne." },
    { en: "Cacio e pepe", fr: "Cacio e pepe", desc: "Pâtes romaines au pecorino et au poivre noir." },
    { en: "Risotto alla milanese", fr: "Risotto à la milanaise", desc: "Risotto parfumé au safran, spécialité de Milan." },
    { en: "Pesto alla genovese", fr: "Pesto génois", desc: "Sauce ligure au basilic, pignons de pin, fromage, ail et huile d'olive." },
    { en: "Gelato", fr: "Glace artisanale", desc: "Glace servie en cornet ou en pot, souvent avec deux ou trois parfums." },
  ],
  vocab: [
    { id: "ingredients", en: "ingredients", fr: "ingrédients", concept: "ingredients" },
    { id: "allergy", en: "an allergy", fr: "une allergie", example: "I'm allergic to nuts.", concept: "allergy" },
    { id: "oven", en: "an oven", fr: "un four" },
    { id: "dough", en: "dough", fr: "pâte (à pain, à pizza)" },
    { id: "menu", en: "the menu", fr: "la carte", concept: "menu" },
    { id: "knead", en: "to knead", fr: "pétrir" },
    { id: "roll-out", en: "to roll out", fr: "étaler" },
    { id: "boil", en: "to boil", fr: "faire bouillir", concept: "cooking-verbs" },
    { id: "drain", en: "to drain", fr: "égoutter", concept: "cooking-verbs" },
    { id: "flour", en: "flour", fr: "farine" },
    { id: "pinch", en: "a pinch of", fr: "une pincée de" },
    { id: "platform-it", en: "a platform", fr: "un quai", concept: "platform" },
    { id: "delay", en: "a delay", fr: "un retard", concept: "delay" },
    { id: "validate", en: "to validate a ticket", fr: "valider un billet" },
    { id: "strike", en: "a strike", fr: "une grève", concept: "strike" },
    { id: "refund", en: "a refund", fr: "un remboursement", concept: "refund" },
    { id: "slot", en: "a time slot", fr: "un créneau", concept: "to-book" },
    { id: "tour-guide", en: "a tour guide", fr: "un guide", concept: "guide" },
    { id: "ancient", en: "ancient", fr: "antique, ancien" },
    { id: "ruins", en: "ruins", fr: "ruines", concept: "ruins" },
    { id: "heritage", en: "heritage", fr: "patrimoine", concept: "heritage" },
    { id: "painting", en: "a painting", fr: "un tableau", concept: "art" },
    { id: "background", en: "the background", fr: "l'arrière-plan" },
    { id: "foreground", en: "the foreground", fr: "le premier plan" },
    { id: "masterpiece", en: "a masterpiece", fr: "un chef-d'œuvre" },
    { id: "exhibition-it", en: "an exhibition", fr: "une exposition", concept: "exhibition" },
    { id: "hut", en: "a mountain hut", fr: "un refuge" },
    { id: "thunderstorm", en: "a thunderstorm", fr: "un orage", concept: "weather-forecast" },
    { id: "trail", en: "a trail", fr: "un sentier", concept: "trail" },
    { id: "steep", en: "steep", fr: "raide" },
    { id: "summit-it", en: "the summit", fr: "le sommet", concept: "summit" },
    { id: "itinerary-it", en: "an itinerary", fr: "un itinéraire", concept: "itinerary" },
    { id: "bargain", en: "to bargain", fr: "marchander", example: "Would you take thirty?", concept: "to-bargain" },
    { id: "price", en: "the price", fr: "le prix", concept: "price" },
    { id: "deal", en: "a deal", fr: "un accord, une affaire", concept: "to-bargain" },
    { id: "second-hand", en: "second-hand", fr: "d'occasion" },
    { id: "cash", en: "cash", fr: "espèces", concept: "cash" },
    { id: "counter", en: "the counter", fr: "le comptoir" },
    { id: "flavour", en: "a flavour", fr: "un parfum (de glace)" },
    { id: "cone", en: "a cone", fr: "un cornet" },
    { id: "receipt-it", en: "a receipt", fr: "un ticket de caisse", concept: "receipt" },
    { id: "espresso", en: "an espresso", fr: "un expresso" },
    { id: "recommend", en: "to recommend", fr: "recommander, conseiller", concept: "recommend" },
    { id: "speciality", en: "a speciality", fr: "une spécialité", concept: "speciality" },
    { id: "vegetarian", en: "vegetarian", fr: "végétarien", concept: "diet" },
    { id: "cover-charge", en: "a cover charge", fr: "un couvert (coperto)" },
    { id: "tip", en: "a tip", fr: "un pourboire", concept: "tip" },
  ],
  expressions: [
    { en: "What would you recommend?", fr: "Que me conseillez-vous ?" },
    { en: "It's a deal!", fr: "Marché conclu !" },
    { en: "That's a bit more than I wanted to spend.", fr: "C'est un peu plus que mon budget." },
    { en: "I'll think about it.", fr: "Je vais réfléchir." },
    { en: "Still or sparkling?", fr: "Plate ou gazeuse ?" },
    { en: "It's running late.", fr: "Il est en retard." },
    { en: "We apologise for the inconvenience.", fr: "Nous vous prions de nous excuser pour la gêne." },
    { en: "Let it rest.", fr: "Laisse reposer." },
    { en: "A bit of bite.", fr: "Encore un peu ferme (pâtes)." },
    { en: "What strikes me is…", fr: "Ce qui me frappe, c'est…" },
    { en: "It's breathtaking.", fr: "C'est à couper le souffle." },
    { en: "People tend to…", fr: "Les gens ont tendance à…" },
    { en: "A far cry from…", fr: "Très différent de…" },
    { en: "I'm out of breath.", fr: "Je suis essoufflé." },
    { en: "Grazie! (Thank you!)", fr: "Merci ! — un mot d'italien toujours apprécié", note: "Italien" },
  ],
  missions: [pizza, pasta, train, colosseum, art, dolomites, market, cafe, advice],
  final: {
    id: "italy-final", title: "48 heures entre Florence et Bologne", titleEn: "48 hours: Florence to Bologna",
    intro: "Mission finale : arrivée à l'hôtel, musée, grève des trains, cours de cuisine, allergie au restaurant et rencontre. Tes choix changent le trajet, et tes réponses libres sont jugées sur le sens.",
    start: "checkin", nodes: finalNodes,
    skills: ["Négocier une solution", "Décrire une œuvre", "Gérer une grève", "Suivre des instructions", "Signaler une allergie", "Raconter un voyage"],
  },
  rewards: [
    { id: "italy-linen-shirt", kind: "clothing", fr: "Chemise en lin", en: "Linen shirt", desc: "Chemise légère en lin, idéale pour les étés chauds du sud.", shopItem: "italy-linen-shirt", motif: "linen-shirt" },
    { id: "italy-summer-dress", kind: "clothing", fr: "Robe d'été à motif citrons", en: "Lemon-print summer dress", desc: "Robe légère imprimée de citrons, clin d'œil aux vergers de la côte amalfitaine.", shopItem: "italy-summer-dress", motif: "lemon-dress" },
    { id: "italy-leather-bag", kind: "accessory", fr: "Sacoche en cuir", en: "Leather satchel", desc: "Sacoche inspirée du travail du cuir, artisanat réputé à Florence.", shopItem: "italy-leather-bag", motif: "satchel" },
    { id: "italy-hiking-poles", kind: "accessory", fr: "Bâtons de randonnée", en: "Hiking poles", desc: "Pour les sentiers raides des Dolomites.", shopItem: "italy-hiking-poles", motif: "poles" },
    { id: "italy-lemon-tree", kind: "decor", fr: "Citronnier en pot", en: "Potted lemon tree", desc: "Un petit citronnier en terre cuite pour ta maison.", shopItem: "italy-lemon-tree", motif: "lemon-tree" },
    { id: "italy-botticelli-print", kind: "souvenir-culture", fr: "Reproduction de Botticelli", en: "Botticelli print", desc: "Reproduction d'une œuvre de la Renaissance, aujourd'hui dans le domaine public.", motif: "print" },
    { id: "italy-postcard", kind: "postcard", fr: "Carte postale du Colisée", en: "Colosseum postcard", desc: "Les arches du Colisée dans la lumière du soir.", motif: "arches" },
    { id: "italy-rolling-pin", kind: "souvenir-activity", fr: "Rouleau à pâtisserie de Marco", en: "Marco's rolling pin", desc: "Le long rouleau en bois avec lequel tu as étalé tes premières tagliatelle.", motif: "rolling-pin" },
    { id: "italy-espresso-souvenir", kind: "souvenir-activity", fr: "Tasse à expresso", en: "Espresso cup", desc: "Une petite tasse épaisse, comme celles des comptoirs.", motif: "espresso-cup" },
    { id: "italy-stamp", kind: "stamp", fr: "Tampon Italie", en: "Italy stamp", desc: "Un tampon ovale orné d'un citron et d'une arche.", motif: "lemon-arch" },
    { id: "italy-trophy", kind: "trophy", fr: "Trophée « Viaggiatore »", en: "Viaggiatore trophy", desc: "Pour avoir validé toutes les missions d'Italie.", motif: "trophy" },
  ],
  story: {
    title: "The Last Train to Bologna", level: "B1",
    text: `Lucie had planned everything. Florence on Monday, Bologna on Tuesday, a cooking class at three o'clock. She even had a spreadsheet.

On Tuesday morning, the departure board at the station was full of red words. Cancellato. Cancelled. A strike. Around her, travellers sighed in ten different languages.

"Excuse me," said a voice behind her. A tall man with a camera around his neck was looking at the board too. "Do you speak English? I can't understand the announcements." His name was Kenji, and he was trying to get to Bologna as well.

They went to the ticket office together. The woman behind the glass was tired but kind. "The regional trains are on strike," she explained, "but the high-speed trains are running. You can change your ticket, but it's twelve euros extra." Lucie looked at Kenji. Kenji looked at Lucie. "Worth it," they said at the same time.

On the train, Kenji showed her his photos: hundreds of coffee cups, from every bar he had visited. "In Japan, I usually sit for hours in cafés," he said. "Here, people drink their coffee in thirty seconds, standing up. I'm trying to understand why." Lucie laughed and told him about French cafés, where people stay all afternoon with one small coffee.

In Bologna, they arrived just in time for the cooking class. Marco, the teacher, gave them flour, eggs and a long wooden rolling pin. Lucie's pasta was too thick. Kenji's pasta was full of holes. Marco smiled. "Perfect," he said. "Now you have a story."

That evening, Lucie deleted her spreadsheet. The best part of the trip had not been on it.`,
    glossary: [
      { en: "a departure board", fr: "un tableau des départs" }, { en: "to sigh", fr: "soupirer" }, { en: "worth it", fr: "ça vaut le coup" },
      { en: "a rolling pin", fr: "un rouleau à pâtisserie" }, { en: "just in time", fr: "juste à temps" }, { en: "to delete", fr: "supprimer" },
    ],
  },
  postcardLine: "I explored Italy, made fresh tagliatelle in Bologna and found my way around a train strike — in English!",
  sources: [
    "ENIT / Italia.it — italia.it",
    "UNESCO World Heritage Centre (Historic Centre of Florence; The Dolomites) — whc.unesco.org",
    "UNESCO Intangible Cultural Heritage (Art of Neapolitan 'Pizzaiuolo', 2017) — ich.unesco.org",
    "Parco archeologico del Colosseo — colosseo.it",
    "Gallerie degli Uffizi — uffizi.it",
    "Trenitalia — trenitalia.com",
    "Encyclopaedia Britannica — britannica.com",
  ],
  review: { linguistic: "auto-checked", cultural: "auto-checked", updated: "2026-11-27" },
};
