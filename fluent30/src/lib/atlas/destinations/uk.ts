import type { AtlasDestination, AtlasExercise, AtlasMission, Band, StoryNode } from "../types";
import type { DialogueLine } from "../../curriculum/types";

// =====================================================================
// UNITED KINGDOM — reference destination (original content for Fluent30)
// English is the main language; regional accents and Scots / Welsh / Gaelic words are presented factually.
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

const pub: AtlasMission = {
  id: "uk-pub", order: 1, title: "Commander au pub", titleEn: "Order at the pub", place: "london", minutes: 7,
  briefing: "Un vendredi soir dans un pub de quartier à Londres. Dans la plupart des pubs traditionnels, on commande et on paie directement au bar. Tu commandes des boissons sans alcool, tu te présentes à des habitués et tu découvres la soirée quiz.",
  objectives: {
    A1: "Commander une boisson et dire merci.",
    A2: "Commander pour plusieurs personnes, demander le prix et payer.",
    B1: "Te présenter et entretenir une petite conversation au comptoir.",
    B2: "Comprendre les codes implicites (les tournées, le quiz) et y répondre avec tact.",
    C1: "Jouer avec l'humour britannique et l'understatement sans être maladroit.",
  },
  grammar: ["Can I have… / Could I get…", "Présent simple pour se présenter", "Questions polies"],
  phrases: [
    { en: "Can I have a lemonade, please?", fr: "Je peux avoir une limonade, s'il vous plaît ?" },
    { en: "Could I get two orange juices?", fr: "Je pourrais avoir deux jus d'orange ?" },
    { en: "How much is that?", fr: "Ça fait combien ?" },
    { en: "Can I pay by card?", fr: "Je peux payer par carte ?" },
    { en: "It's my round.", fr: "C'est ma tournée." },
    { en: "Do you mind if I join you?", fr: "Ça vous dérange si je me joins à vous ?" },
    { en: "Is this seat taken?", fr: "Cette place est prise ?" },
    { en: "Cheers!", fr: "Merci ! / Santé !" },
  ],
  vocab: ["pint", "round", "soft-drink", "quiz", "bar", "cheers"],
  exercises: [
    mcq("A1 A2", "Dans un pub traditionnel, où commandes-tu en général ?", ["À ta table, un serveur vient", "Au bar", "Par téléphone"], 1, "Dans la plupart des pubs traditionnels, on va au bar pour commander et payer. Beaucoup de gastropubs servent aussi à table."),
    fill("A1 A2", "Can I ___ a lemonade, please?", ["have", "get"], "« Can I have… ? » est la formule la plus simple et polie pour commander.", "Je peux avoir une limonade ?"),
    listen("A1 A2 B1", "That's six pounds forty, please. Card or cash?", "Combien dois-tu payer ?", ["6,14 £", "6,40 £", "16,40 £", "60,40 £"], 1, "« six pounds forty » = 6,40 £ : on dit le nombre de livres puis les pence."),
    match("A1 A2 B1", [["a pint", "une pinte (≈ 0,57 l)"], ["a soft drink", "une boisson sans alcool"], ["a round", "une tournée"], ["the bar", "le comptoir"], ["cash", "espèces"]], "Vocabulaire de base du pub."),
    dialogue("A1 A2 B1", "Au comptoir, le barman t'accueille.",
      say("Barman", "Evening! What can I get you?", "Bonsoir ! Je vous sers quoi ?"),
      pick("Commande deux boissons sans alcool.",
        ["Could I get two lemonades, please?", true, "Demande polie et claire."],
        ["I want two lemonade.", false, "Trop direct, et « lemonade » doit être au pluriel ici : « two lemonades »."],
        ["Give lemonades.", false, "Un impératif sans « please » paraît impoli."]),
      say("Barman", "Sure. That's five sixty.", "Bien sûr. Ça fait cinq soixante."),
      pick("Demande si tu peux payer par carte.",
        ["Can I pay by card?", true, "« pay by card » est l'expression habituelle."],
        ["Can I pay with the card of credit?", false, "Calque du français : on dit « by card »."]),
      say("Barman", "Course you can. Just tap here.", "Bien sûr. Posez la carte ici.")),
    reorder("A2 B1", "Is this seat taken", "Question figée pour demander si une place est libre.", "Cette place est prise ?"),
    tr("A2 B1 B2 C1", "fr", "C'est ma tournée, qu'est-ce que vous prenez ?", ["It's my round, what are you having?", "It's my round, what would you like?", "It's my round. What are you having?", "My round, what are you having?"], "« It's my round » : en groupe, chacun paie à tour de rôle une tournée. « What are you having? » = qu'est-ce que tu prends."),
    { type: "decide", title: "Le soir du quiz", doc: "PUB QUIZ — Every Tuesday, 8pm. Teams of up to 6. £2 per person, all money goes to the local food bank. No phones during rounds!", question: "Tu es avec 7 amis. Que faites-vous ?", options: [
      { en: "We split into two teams of four.", correct: true, why: "Les équipes sont limitées à 6 personnes : deux équipes de quatre respectent la règle." },
      { en: "We play as one team of eight.", correct: false, why: "« Teams of up to 6 » : 8 personnes dépassent la limite." },
      { en: "We use our phones to check answers.", correct: false, why: "« No phones during rounds » : les téléphones sont interdits pendant les manches." },
    ], bands: b("B1 B2 C1") },
    mcq("B2 C1", "Un habitué dit : « It's not the worst quiz I've ever done. » Il veut probablement dire :", ["Le quiz était horrible", "Il a plutôt aimé le quiz", "Il n'a jamais fait de quiz"], 1, "C'est de l'understatement britannique : une formulation négative et modérée pour exprimer un avis plutôt positif."),
    fix("B1 B2 C1", "Do you mind if I join to you?", ["Do you mind if I join you?"], "« join » est transitif : on dit « join someone », sans « to »."),
    produce("B2 C1", "Rejoindre une équipe", "You'd like to join a quiz team of strangers. Ask politely and say one thing about yourself.", "Demande poliment à des inconnus de rejoindre leur équipe et dis une chose sur toi.", [["mind if", "could i join", "can i join", "would it be ok", "would it be okay", "room for"], ["i'm", "i am", "my name"]], 14, ["Hi, sorry to bother you — do you mind if I join your team? I'm Léa, I'm visiting from Lyon and I'm quite good at geography.", "Would it be OK if I joined you? I'm new in town and I love quizzes."], "Commence par « Sorry to bother you » : c'est une ouverture très naturelle au Royaume-Uni."),
    speak("A1 A2", "Could I get two orange juices, please?", "Je pourrais avoir deux jus d'orange, s'il vous plaît ?"),
  ],
  tags: ["food", "city", "capital"],
  lesson: "theme-restaurant", scenario: "friends", reward: "uk-tote-bag", legacyId: "london-hostel",
};

const tea: AtlasMission = {
  id: "uk-tea", order: 2, title: "Un thé dans un café", titleEn: "Tea at a café", place: "london", minutes: 7,
  briefing: "Maggie tient un petit café près de Camden. Tu commandes un thé (« milk and sugar? »), puis tu découvres l'afternoon tea, avec ses scones, sa crème et sa confiture.",
  objectives: {
    A1: "Commander un thé ou un café et un gâteau.",
    A2: "Préciser comment tu le veux (lait, sucre, à emporter).",
    B1: "Décrire ce que tu goûtes et donner ton avis.",
    B2: "Comprendre et commenter un petit débat culturel (la crème ou la confiture d'abord ?).",
    C1: "Manier les formules de politesse indirectes britanniques avec naturel.",
  },
  grammar: ["Would like", "Some / any", "Adjectifs pour décrire le goût"],
  phrases: [
    { en: "I'd like a cup of tea, please.", fr: "Je voudrais une tasse de thé, s'il vous plaît." },
    { en: "With milk, no sugar.", fr: "Avec du lait, sans sucre." },
    { en: "To have in or take away?", fr: "Sur place ou à emporter ?" },
    { en: "Could I have a scone with jam and cream?", fr: "Je pourrais avoir un scone avec confiture et crème ?" },
    { en: "It's delicious.", fr: "C'est délicieux." },
    { en: "Could we have the bill, please?", fr: "Pourrait-on avoir l'addition ?" },
  ],
  vocab: ["take-away", "scone", "bill", "milk", "afternoon-tea"],
  exercises: [
    listen("A1 A2", "Milk and sugar?", "Que te demande Maggie ?", ["Si tu veux du lait et du sucre", "Si tu veux un gâteau", "Où tu habites"], 0, "« Milk and sugar? » : au Royaume-Uni, le thé noir se boit souvent avec un nuage de lait."),
    fill("A1 A2", "I'd ___ a cup of tea, please.", ["like"], "« I'd like » (= I would like) est la manière polie de commander.", "Je voudrais une tasse de thé."),
    match("A1 A2 B1", [["take away", "à emporter"], ["have in", "sur place"], ["the bill", "l'addition"], ["a scone", "un scone (petit pain sucré)"], ["jam", "confiture"]]),
    { type: "assemble", title: "Le plateau d'afternoon tea", brief: "Écoute la commande et compose le plateau.", audio: "One afternoon tea, please: a pot of tea, some sandwiches, and two scones with jam and clotted cream. No cake, thanks.", options: [
      { id: "pot", en: "a pot of tea", fr: "une théière" }, { id: "sand", en: "sandwiches", fr: "des sandwichs" }, { id: "scones", en: "scones", fr: "des scones" },
      { id: "jam", en: "jam", fr: "confiture" }, { id: "cream", en: "clotted cream", fr: "crème épaisse" }, { id: "cake", en: "a slice of cake", fr: "une part de gâteau" }, { id: "coffee", en: "a coffee", fr: "un café" },
    ], correct: ["pot", "sand", "scones", "jam", "cream"], explain: "La cliente refuse le gâteau (« No cake, thanks ») et ne demande pas de café.", bands: b("A1 A2 B1") },
    dialogue("A1 A2 B1", "Au comptoir de Maggie.",
      say("Maggie", "Hiya! What can I get you?", "Salut ! Je vous sers quoi ?"),
      pick("Commande un thé au lait.",
        ["Could I have a tea with milk, please?", true, "Commande polie et précise."],
        ["A tea. Milk. Now.", false, "Trop sec : ajoute « Could I have… please »."]),
      say("Maggie", "Course. To have in or take away?", "Bien sûr. Sur place ou à emporter ?"),
      pick("Tu restes sur place.",
        ["To have in, please.", true, "On reprend simplement la formule « to have in »."],
        ["For here eating.", false, "Ce n'est pas idiomatique. Aux États-Unis on dirait « for here »."])),
    tr("A2 B1", "fr", "Je voudrais un scone avec de la confiture, s'il vous plaît.", ["I'd like a scone with jam, please.", "I would like a scone with jam, please.", "Could I have a scone with jam, please?", "Can I have a scone with jam, please?"], "« I'd like » ou « Could I have » ; « jam » = confiture (« jelly » en américain)."),
    mcq("B1 B2 C1", "Dans le Devon et en Cornouailles, on débat avec humour : sur un scone, met-on…", ["le thé ou le café en premier", "la crème ou la confiture en premier", "le sel ou le poivre"], 1, "C'est un débat amical et régional : dans le Devon, on met souvent la crème d'abord ; en Cornouailles, plutôt la confiture."),
    produce("B1 B2 C1", "Ton avis sur le scone", "Describe what you ate and drank, and give your honest opinion.", "Décris ce que tu as mangé et bu et donne ton avis.", [["scone", "scones", "tea", "cake", "sandwich"], ["delicious", "lovely", "tasty", "nice", "rich", "too sweet", "dry", "loved", "liked", "enjoyed"]], 15, ["The scones were lovely and warm, but the clotted cream was a bit too rich for me. The tea was perfect with milk.", "I had a pot of tea and two scones. I really enjoyed them, especially with jam."], "Nuance avec « a bit », « quite », « really » : très naturel en anglais britannique."),
    mcq("B2 C1", "Maggie te dit : « You couldn't pass me that tray, could you? » C'est :", ["une question sur tes capacités", "une demande polie et indirecte", "un reproche"], 1, "La forme négative + tag (« You couldn't…, could you? ») est une manière très polie et indirecte de demander un service."),
    fix("B1 B2 C1", "Can I have an addition, please?", ["Can I have the bill, please?", "Could I have the bill, please?", "Could we have the bill, please?", "Can we have the bill, please?"], "Faux ami : l'addition se dit « the bill » en anglais britannique (« the check » aux États-Unis)."),
    speak("A1 A2 B1", "I'd like a cup of tea with milk, please.", "Je voudrais une tasse de thé au lait, s'il vous plaît."),
    { type: "decide", title: "L'ardoise du café", doc: "Afternoon tea served 2pm–5pm. Booking recommended at weekends. Vegan and gluten-free options available on request.", question: "Il est 13h30 un samedi et tu es végane. Quelle est la meilleure option ?", options: [
      { en: "Book a table for 2pm and ask for the vegan option.", correct: true, why: "L'afternoon tea commence à 14h, la réservation est conseillée le week-end et l'option végane existe sur demande." },
      { en: "Order an afternoon tea right now.", correct: false, why: "Il n'est servi qu'à partir de 14h (« served 2pm–5pm »)." },
      { en: "Leave: there is nothing vegan.", correct: false, why: "« Vegan options available on request » : il suffit de demander." },
    ], bands: b("A2 B1 B2 C1") },
  ],
  tags: ["food", "coffee-tea", "city"],
  lesson: "a1-key-verbs", scenario: "restaurant", reward: "uk-tea-set", legacyId: "london-cafe",
};

const tube: AtlasMission = {
  id: "uk-tube", order: 3, title: "Le métro londonien", titleEn: "Ride the London Underground", place: "london", minutes: 7,
  briefing: "Le « Tube » est le plus ancien métro du monde (ouvert en 1863). Tu payes sans contact, tu choisis la bonne ligne et la bonne direction, tu comprends les annonces et tu gères un incident de ligne.",
  objectives: {
    A1: "Comprendre « Mind the gap », le nom des lignes et des directions.",
    A2: "Demander quelle ligne prendre et où changer.",
    B1: "Comprendre une annonce de perturbation et adapter ton trajet.",
    B2: "Expliquer un itinéraire alternatif à quelqu'un d'autre.",
    C1: "Comprendre les annonces rapides et les formulations administratives.",
  },
  grammar: ["Impératif", "Prépositions de mouvement (to, at, on)", "Futur proche"],
  phrases: [
    { en: "Which line goes to King's Cross?", fr: "Quelle ligne va à King's Cross ?" },
    { en: "Change at Oxford Circus.", fr: "Changez à Oxford Circus." },
    { en: "Take the Victoria line northbound.", fr: "Prenez la Victoria line direction nord." },
    { en: "Mind the gap.", fr: "Attention à l'espace entre le train et le quai." },
    { en: "Is there step-free access?", fr: "Y a-t-il un accès sans marches ?" },
    { en: "The line is part-suspended.", fr: "La ligne est partiellement interrompue." },
  ],
  vocab: ["platform", "line", "change", "northbound", "contactless", "step-free"],
  exercises: [
    mcq("A1 A2", "« Mind the gap » veut dire :", ["Faites attention à l'espace entre le train et le quai", "Le train a du retard", "Gardez votre billet"], 0, "Annonce célèbre du métro londonien : « gap » = l'espace entre la rame et le quai."),
    match("A1 A2 B1", [["platform", "quai"], ["line", "ligne"], ["northbound", "direction nord"], ["to change", "changer (de ligne)"], ["contactless", "sans contact"]]),
    fill("A1 A2", "Excuse me, which ___ goes to King's Cross?", ["line"], "On demande la ligne (« line ») qui mène à une station.", "Pardon, quelle ligne va à King's Cross ?"),
    listen("A1 A2 B1", "The next station is Green Park. Change here for the Jubilee and Piccadilly lines.", "Que peux-tu faire à Green Park ?", ["Changer pour les lignes Jubilee et Piccadilly", "Sortir vers un parc fermé", "Acheter un billet"], 0, "« Change here for… » indique les correspondances possibles."),
    { type: "steps", title: "De Waterloo à King's Cross", brief: "Remets les étapes du trajet dans l'ordre.", steps: [
      "Tap your contactless card at the gate.",
      "Take the Northern line northbound.",
      "Get off at Euston.",
      "Change to the Victoria line.",
      "Ride one stop to King's Cross St Pancras.",
      "Tap out at the exit gate.",
    ], fr: ["Valide ta carte sans contact au portique.", "Prends la Northern line direction nord.", "Descends à Euston.", "Change pour la Victoria line.", "Fais un arrêt jusqu'à King's Cross St Pancras.", "Valide à la sortie."], explain: "On valide à l'entrée ET à la sortie pour payer le bon tarif : c'est le principe du « tap in / tap out ».", bands: b("A2 B1 B2") },
    dialogue("A1 A2 B1", "Tu es perdu devant le plan.",
      say("Station staff", "You alright there? Need a hand?", "Ça va ? Besoin d'aide ?"),
      pick("Demande comment aller au British Museum.",
        ["Yes, please. How do I get to the British Museum?", true, "« How do I get to… ? » est la question standard."],
        ["Where is the British Museum line?", false, "Il n'y a pas de « British Museum line » : demande le trajet."]),
      say("Staff", "Central line eastbound to Tottenham Court Road. It's a five-minute walk from there.", "Central line direction est jusqu'à Tottenham Court Road. C'est à cinq minutes à pied."),
      pick("Vérifie que tu as bien compris.",
        ["So, Central line eastbound, and I get off at Tottenham Court Road?", true, "Reformuler pour vérifier est une excellente stratégie."],
        ["OK westbound.", false, "Il a dit « eastbound » (direction est)."])),
    { type: "decide", title: "Annonce de perturbation", doc: "Good morning. Due to a signal failure, there is no service on the Central line between Liverpool Street and Stratford. Customers are advised to use the Elizabeth line. Tickets will be accepted on local buses.", audio: true, question: "Tu vas de Liverpool Street à Stratford. Que fais-tu ?", options: [
      { en: "I take the Elizabeth line.", correct: true, why: "L'annonce conseille la Elizabeth line pour cette section interrompue." },
      { en: "I wait on the Central line platform.", correct: false, why: "« No service » : aucun train ne circule sur cette section." },
      { en: "I buy a new ticket for the bus.", correct: false, why: "« Tickets will be accepted on local buses » : ton billet est accepté." },
    ], bands: b("B1 B2 C1") },
    tr("B1 B2 C1", "fr", "Pour aller à Camden, prenez la Northern line et descendez à Camden Town.", ["To get to Camden, take the Northern line and get off at Camden Town.", "To go to Camden, take the Northern line and get off at Camden Town."], "« get off at » = descendre à (un arrêt)."),
    produce("B2 C1", "Guide un ami", "Your friend has to go from Waterloo to King's Cross, but the Northern line is closed. Explain an alternative route.", "Ton ami doit aller de Waterloo à King's Cross mais la Northern line est fermée. Explique-lui un autre trajet.", [["take", "get"], ["change", "switch", "then"], ["line", "bus"]], 18, ["Since the Northern line is closed, take the Jubilee line to Green Park, then change to the Victoria line and ride two stops to King's Cross.", "Get the Bakerloo line to Oxford Circus, then switch to the Victoria line northbound — King's Cross is two stops."], "Utilise « since » ou « as » pour justifier, puis « then » pour enchaîner les étapes."),
    mcq("C1", "« Customers are advised to seek alternative routes » signifie :", ["Il est conseillé de prendre un autre itinéraire", "Les clients doivent rester calmes", "Le trajet sera remboursé"], 0, "Formulation administrative : « are advised to » = il est recommandé de ; « seek » = chercher (soutenu)."),
    dictation("B2 C1", "Please stand on the right on the escalators.", ["Please stand on the right on the escalators.", "Please stand on the right on the escalators"], "Sur les escalators du métro londonien, on se tient à droite pour laisser passer à gauche."),
  ],
  tags: ["train", "city", "capital"],
  lesson: "a2-prepositions", scenario: "transport", reward: "uk-oyster-souvenir", legacyId: "london-tube",
};

const directions: AtlasMission = {
  id: "uk-directions", order: 4, title: "Demander son chemin", titleEn: "Ask for directions", place: "london", minutes: 6,
  briefing: "En sortant du métro à Westminster, ton téléphone n'a plus de batterie. Tu demandes ton chemin vers différents lieux et tu comprends les indications à l'oral.",
  objectives: {
    A1: "Comprendre left, right, straight on.",
    A2: "Demander poliment un lieu et suivre des indications simples.",
    B1: "Suivre des indications longues et vérifier que tu as compris.",
    B2: "Donner toi-même des indications précises.",
    C1: "Comprendre les indications floues ou humoristiques des passants.",
  },
  grammar: ["Impératif", "Prépositions de lieu", "Questions indirectes (Could you tell me where…)"],
  phrases: [
    { en: "Excuse me, how do I get to Big Ben?", fr: "Excusez-moi, comment aller à Big Ben ?" },
    { en: "Go straight on.", fr: "Allez tout droit." },
    { en: "Take the second left.", fr: "Prenez la deuxième à gauche." },
    { en: "It's on your right.", fr: "C'est sur votre droite." },
    { en: "Could you tell me where the station is?", fr: "Pourriez-vous me dire où est la gare ?" },
    { en: "Is it far?", fr: "C'est loin ?" },
    { en: "It's about ten minutes on foot.", fr: "C'est à environ dix minutes à pied." },
  ],
  vocab: ["straight-on", "corner", "crossroads", "on-foot", "opposite"],
  exercises: [
    match("A1 A2", [["turn left", "tourner à gauche"], ["straight on", "tout droit"], ["opposite", "en face de"], ["the corner", "le coin"], ["crossroads", "carrefour"]]),
    listen("A1 A2 B1", "Go straight on, then take the second right. The museum is opposite the bank.", "Où est le musée ?", ["À côté de la banque", "En face de la banque", "Derrière la gare"], 1, "« opposite » = en face de."),
    fill("A1 A2", "Excuse me, how do I ___ to Big Ben?", ["get"], "« How do I get to… ? » = comment aller à… ?", "Excusez-moi, comment aller à Big Ben ?"),
    reorder("A2 B1 B2", "Could you tell me where the station is", "Question indirecte : après « Could you tell me where », le sujet vient AVANT le verbe (the station is).", "Pourriez-vous me dire où est la gare ?"),
    fix("A2 B1 B2 C1", "Could you tell me where is the station?", ["Could you tell me where the station is?"], "Dans une question indirecte, on n'inverse pas : « where the station is »."),
    dialogue("A1 A2 B1", "Près de Parliament Square.",
      pick("Interpelle poliment une passante.",
        ["Excuse me, sorry — could you help me?", true, "« Excuse me, sorry » est une ouverture très britannique et polie."],
        ["Hey you! Big Ben?", false, "Trop brusque pour aborder un inconnu."]),
      say("Passer-by", "Of course, love. Where are you headed?", "Bien sûr. Vous allez où ?"),
      pick("Dis que tu cherches Trafalgar Square.",
        ["I'm looking for Trafalgar Square.", true, "« I'm looking for… » = je cherche…"],
        ["I search Trafalgar Square.", false, "« search » s'emploie pour fouiller ; ici on dit « look for »."]),
      say("Passer-by", "Just go straight up Whitehall. You can't miss it.", "Remontez tout droit Whitehall. Vous ne pouvez pas le rater.")),
    { type: "identify", title: "Où es-tu arrivé ?", audio: "It's a huge square with a tall column in the middle, four bronze lions and a big gallery on the north side.", options: [
      { en: "Trafalgar Square", fr: "Trafalgar Square", motif: "column-lions" }, { en: "Tower Bridge", fr: "Tower Bridge", motif: "bridge" }, { en: "Hyde Park", fr: "Hyde Park", motif: "park" }, { en: "St Paul's Cathedral", fr: "Cathédrale Saint-Paul", motif: "dome" },
    ], answer: 0, explain: "La colonne Nelson, les quatre lions de bronze et la National Gallery au nord : c'est Trafalgar Square.", bands: b("A2 B1 B2 C1") },
    produce("B1 B2 C1", "Donne des indications", "A tourist at Trafalgar Square asks you the way to Buckingham Palace. Give clear directions (it's along The Mall, about 15 minutes on foot).", "Un touriste te demande le chemin de Buckingham Palace (par The Mall, environ 15 minutes à pied).", [["go", "walk", "head", "follow"], ["mall"], ["minutes", "minute", "on foot", "walk"]], 15, ["Go through Admiralty Arch and walk straight down The Mall. The palace is at the end, about fifteen minutes on foot.", "Head under the big arch and follow The Mall all the way — it takes about 15 minutes."], "Donne un repère visuel (« the big arch ») et une durée."),
    mcq("B2 C1", "Un passant répond : « Ooh, you're miles off, I'm afraid. » Il veut dire :", ["Tu es tout près", "Tu es très loin de ta destination", "Il a peur"], 1, "« miles off » = très loin ; « I'm afraid » adoucit une mauvaise nouvelle, il n'exprime pas la peur."),
    mcq("B2 C1", "« It's a stone's throw from here. » signifie :", ["C'est tout près d'ici", "C'est dangereux", "C'est en travaux"], 0, "« a stone's throw » = à un jet de pierre, c'est-à-dire tout près."),
    speak("A1 A2", "Excuse me, is it far?", "Excusez-moi, c'est loin ?"),
  ],
  tags: ["city", "capital"],
  lesson: "a2-prepositions", scenario: "transport", reward: "uk-umbrella", legacyId: "london-park",
};

const accents: AtlasMission = {
  id: "uk-accents", order: 5, title: "Les accents britanniques", titleEn: "British accents", place: "manchester", minutes: 8,
  briefing: "Au Royaume-Uni, l'accent change parfois d'une ville à l'autre : Londres, Liverpool (Scouse), Newcastle (Geordie), Birmingham (Brummie), Glasgow… La voix de ton appareil ne reproduit pas ces accents : on travaille ici sur les mots et les tournures régionales réelles, et sur les stratégies pour comprendre.",
  objectives: {
    A1: "Reconnaître des salutations informelles (You alright? Cheers).",
    A2: "Comprendre des mots familiers courants (quid, loo, mate).",
    B1: "Repérer quelques mots régionaux (wee, aye, love) et demander de répéter.",
    B2: "Utiliser des stratégies pour comprendre un accent difficile.",
    C1: "Distinguer registre, région et ironie dans un échange rapide.",
  },
  grammar: ["Question tags (…isn't it?)", "Demander de répéter / reformuler"],
  phrases: [
    { en: "You alright?", fr: "Ça va ? (salutation)" },
    { en: "Cheers, mate.", fr: "Merci, l'ami." },
    { en: "Sorry, could you say that again?", fr: "Pardon, vous pouvez répéter ?" },
    { en: "Could you speak a bit more slowly?", fr: "Vous pourriez parler un peu plus lentement ?" },
    { en: "That's five quid.", fr: "Ça fait cinq livres. (familier)" },
    { en: "It's a wee bit cold.", fr: "Il fait un peu froid. (écossais)" },
  ],
  vocab: ["quid", "loo", "mate", "wee", "aye", "queue"],
  exercises: [
    mcq("A1 A2", "Un vendeur te dit « You alright? ». Il veut dire :", ["Tu es blessé ?", "Bonjour, ça va ?", "Tu as raison ?"], 1, "« You alright? » est une simple salutation dans une grande partie de l'Angleterre."),
    match("A1 A2 B1", [["quid", "livre (argent, familier)"], ["loo", "toilettes (familier)"], ["mate", "ami, pote"], ["queue", "file d'attente"], ["cheers", "merci"]]),
    listen("A1 A2 B1", "Cheers, love. Have a good one!", "Que fait la vendeuse ?", ["Elle trinque", "Elle remercie et dit au revoir", "Elle demande ton prénom"], 1, "« Cheers » remercie, « Have a good one! » = bonne journée. « love » est une adresse amicale courante dans le nord de l'Angleterre, sans sous-entendu."),
    fill("A1 A2 B1", "Sorry, could you say that ___?", ["again"], "« say that again » = répéter.", "Pardon, vous pouvez répéter ?"),
    match("B1 B2", [["wee (Scotland)", "petit"], ["aye (Scotland, north)", "oui"], ["bairn (Scotland, NE England)", "enfant"], ["lass", "fille, jeune femme"], ["ginnel / snicket (Yorkshire)", "ruelle"]], "Mots régionaux réels : on les comprend, on n'est pas obligé de les utiliser."),
    dialogue("A2 B1 B2", "À Glasgow, un chauffeur de bus parle vite.",
      say("Driver", "Where ye headin', pal?", "Tu vas où, mon pote ?"),
      pick("Tu n'as pas compris.",
        ["Sorry, could you say that again a bit more slowly?", true, "Demander de répéter plus lentement est poli et efficace."],
        ["What?!", false, "Sec et peu poli."],
        ["Yes.", false, "Répondre au hasard crée un malentendu."]),
      say("Driver", "Where are you going?", "Où allez-vous ?"),
      pick("Réponds.",
        ["To the Kelvingrove museum, please.", true, "Réponse claire avec la destination."],
        ["I go museum.", false, "Il manque la préposition et l'article : « to the museum »."])),
    { type: "decide", title: "Stratégie d'écoute", doc: "You're in Newcastle. A friendly local says something very fast and you only catch 'canny' and 'the night'.", question: "Quelle est la meilleure stratégie ?", options: [
      { en: "Smile, say you're still getting used to the accent, and ask them to repeat.", correct: true, why: "Les gens apprécient en général qu'on le dise franchement. « Canny » (Geordie) veut souvent dire « bien, sympa », et « the night » = ce soir." },
      { en: "Pretend you understood and nod.", correct: false, why: "Tu risques d'accepter quelque chose sans le savoir." },
      { en: "Ask them to speak 'proper English'.", correct: false, why: "Vexant : les accents régionaux sont de l'anglais à part entière." },
    ], bands: b("B1 B2 C1") },
    mcq("B2 C1", "« Lovely weather, isn't it? » (sous une pluie battante) exprime :", ["De l'ironie", "Une vraie admiration", "Une question sur la météo"], 0, "L'ironie sur la météo est un classique de la conversation britannique. Réponds avec le sourire : « Gorgeous, isn't it? »"),
    tr("B1 B2 C1", "en", "I'm absolutely knackered.", ["Je suis complètement crevé.", "Je suis complètement épuisé.", "Je suis crevé.", "Je suis épuisé."], "« knackered » = très fatigué (familier, britannique)."),
    produce("B2 C1", "Avouer avec humour", "Tell a local, with a bit of humour, that you are struggling with their accent and ask them to slow down.", "Dis avec un peu d'humour à un habitant que tu as du mal avec son accent et demande-lui de ralentir.", [["accent"], ["slow", "slowly", "slower", "again", "repeat"]], 14, ["Sorry, my ears are still on French time — I'm loving the accent, but could you slow down a little?", "I'm afraid your accent is beating me today! Could you say that again a bit more slowly?"], "L'autodérision fonctionne très bien en anglais britannique."),
    mcq("C1", "« Not bad at all » dit par un Britannique sur un plat signifie souvent :", ["C'était médiocre", "C'était vraiment bon", "Il n'a pas goûté"], 1, "Understatement : « not bad at all » est souvent un vrai compliment."),
    speak("A1 A2", "Sorry, could you speak a bit more slowly?", "Pardon, vous pourriez parler un peu plus lentement ?"),
  ],
  tags: ["city", "music"],
  lesson: "b2-informal-english", scenario: "friends", reward: "uk-flat-cap", legacyId: "london-market",
};

const museum: AtlasMission = {
  id: "uk-museum", order: 6, title: "Au musée", titleEn: "At the museum", place: "british-museum", minutes: 7,
  briefing: "La plupart des grands musées nationaux de Londres sont gratuits pour leurs collections permanentes (un don est bienvenu). Tu demandes ton chemin dans les salles, tu suis un audioguide et tu décris une œuvre.",
  objectives: {
    A1: "Lire les panneaux d'un musée (exit, cloakroom, toilets).",
    A2: "Demander où se trouve une salle et réserver une exposition.",
    B1: "Comprendre une courte explication d'audioguide et la résumer.",
    B2: "Décrire et comparer des objets, débattre de leur histoire.",
    C1: "Discuter avec nuance d'un sujet sensible (restitution des œuvres).",
  },
  grammar: ["Passif (was found, was made)", "Superlatifs", "Exprimer une opinion nuancée"],
  phrases: [
    { en: "Where is the cloakroom?", fr: "Où est le vestiaire ?" },
    { en: "Is the entry free?", fr: "L'entrée est gratuite ?" },
    { en: "Do I need to book for the exhibition?", fr: "Faut-il réserver pour l'exposition ?" },
    { en: "It was made around 196 BC.", fr: "Elle a été faite vers 196 av. J.-C." },
    { en: "It's one of the most visited objects.", fr: "C'est l'un des objets les plus visités." },
    { en: "In my view…", fr: "À mon avis…" },
  ],
  vocab: ["cloakroom", "exhibition", "audio-guide", "donation", "gallery"],
  exercises: [
    match("A1 A2", [["cloakroom", "vestiaire"], ["exhibition", "exposition"], ["gift shop", "boutique"], ["way out", "sortie"], ["donation", "don"]]),
    { type: "decide", title: "Le panneau d'entrée", doc: "Free entry to the permanent collection. Special exhibition: £20, booking recommended. Large bags must be left at the cloakroom.", question: "Tu veux voir la collection permanente avec ton grand sac à dos.", options: [
      { en: "Leave my backpack at the cloakroom and go in for free.", correct: true, why: "Collection permanente gratuite et grands sacs au vestiaire." },
      { en: "Pay £20 at the entrance.", correct: false, why: "Les 20 £ concernent seulement l'exposition temporaire." },
      { en: "Keep my backpack with me.", correct: false, why: "« Large bags must be left at the cloakroom »." },
    ], bands: b("A1 A2 B1") },
    fill("A1 A2", "Excuse me, where is the ___? I'd like to leave my coat.", ["cloakroom"], "Le vestiaire = « cloakroom ».", "Excusez-moi, où est le vestiaire ?"),
    listen("A1 A2 B1", "The Egyptian sculpture galleries are on the ground floor, room four. The mummies are upstairs, on level three.", "Où sont les momies ?", ["Au rez-de-chaussée", "Au niveau 3", "Salle 4"], 1, "« upstairs, on level three » : au niveau 3. Le rez-de-chaussée (« ground floor ») accueille les sculptures."),
    listen("A2 B1 B2 C1", "This stone was found in 1799 near the town of Rashid, in Egypt. The same decree is written in three scripts, which helped scholars understand hieroglyphs.", "Pourquoi cette pierre est-elle célèbre ?", ["Elle est en or", "Le même texte y est écrit en trois écritures", "Elle a été trouvée à Londres"], 1, "C'est la pierre de Rosette : le même décret en trois écritures a aidé à déchiffrer les hiéroglyphes."),
    fix("B1 B2", "The stone was find in 1799.", ["The stone was found in 1799."], "Au passif : be + participe passé (find → found)."),
    tr("B1 B2 C1", "fr", "Cette statue a été sculptée il y a plus de 3000 ans.", ["This statue was carved more than 3,000 years ago.", "This statue was carved over 3,000 years ago.", "This statue was carved more than 3000 years ago.", "This statue was sculpted more than 3,000 years ago.", "This statue was made more than 3,000 years ago."], "Passif au passé : « was carved ». « ago » se place après la durée."),
    produce("B1 B2 C1", "Décris ton objet préféré", "Describe your favourite object in the museum: what it is, where it comes from and why you like it.", "Décris ton objet préféré du musée : ce que c'est, d'où il vient et pourquoi tu l'aimes.", [["it is", "it's", "this is"], ["from", "made in", "found in", "comes from"], ["because", "since", "as", "love", "like"]], 20, ["My favourite object is a small gold cup from Ireland. It was made more than 3,000 years ago and I love how simple and modern it looks.", "I really liked the Rosetta Stone because it shows how people cracked a lost writing system."], "Utilise le passif (« it was made… ») pour parler de l'origine d'un objet."),
    mcq("B2 C1", "Quelle formulation est la plus nuancée pour un débat sur la restitution d'œuvres ?", ["They should give everything back now.", "It's a complex issue: there are strong arguments on both sides, and some museums are now discussing long-term loans.", "I don't care."], 1, "Une formulation nuancée reconnaît la complexité et cite des solutions débattues (prêts, coopérations)."),
    mcq("C1", "« The exhibition was, frankly, underwhelming. » signifie :", ["L'exposition était décevante", "L'exposition était impressionnante", "L'exposition était fermée"], 0, "« underwhelming » = décevant, qui ne fait pas l'effet attendu ; « frankly » marque un avis assumé."),
    speak("A1 A2", "Is the entry free?", "L'entrée est gratuite ?"),
  ],
  tags: ["history", "civilisation", "art", "capital"],
  lesson: "b2-passive", scenario: "opinion", reward: "uk-museum-print",
};

const literature: AtlasMission = {
  id: "uk-literature", order: 7, title: "Sur les traces des écrivains", titleEn: "A literary walk", place: "bath", minutes: 8,
  briefing: "Le Royaume-Uni a vu naître des œuvres aujourd'hui dans le domaine public : Jane Austen, Charles Dickens, les sœurs Brontë, Lewis Carroll, Arthur Conan Doyle… Tu participes à une promenade littéraire à Bath, où Jane Austen a vécu, puis tu choisis un livre dans une librairie.",
  objectives: {
    A1: "Dire quel type de livre tu aimes.",
    A2: "Demander un conseil de lecture en librairie.",
    B1: "Résumer une histoire au passé simple.",
    B2: "Comparer deux auteurs et argumenter ton choix.",
    C1: "Commenter un style et une citation avec précision.",
  },
  grammar: ["Prétérit (past simple)", "Comparatifs", "Relatives (who, which)"],
  phrases: [
    { en: "I love detective stories.", fr: "J'adore les romans policiers." },
    { en: "Could you recommend a classic?", fr: "Vous pourriez me conseiller un classique ?" },
    { en: "Jane Austen lived in Bath for a few years.", fr: "Jane Austen a vécu quelques années à Bath." },
    { en: "It's about a young woman who…", fr: "Ça parle d'une jeune femme qui…" },
    { en: "The plot is gripping.", fr: "L'intrigue est captivante." },
    { en: "I prefer Dickens to Austen.", fr: "Je préfère Dickens à Austen." },
  ],
  vocab: ["novel", "plot", "author", "bookshop", "chapter"],
  exercises: [
    match("A1 A2", [["a novel", "un roman"], ["an author", "un auteur"], ["a bookshop", "une librairie"], ["a library", "une bibliothèque"], ["a chapter", "un chapitre"]], "Attention au faux ami : « library » = bibliothèque, « bookshop » = librairie."),
    mcq("A1 A2", "Où achètes-tu un livre ?", ["In a library", "In a bookshop", "In a bakery"], 1, "Faux ami : on achète dans une « bookshop » ; une « library » prête des livres."),
    fill("A1 A2 B1", "I ___ detective stories.", ["love", "like", "enjoy", "adore"], "Présent simple pour un goût général.", "J'adore les romans policiers."),
    { type: "identify", title: "Quel classique ?", audio: "In this novel, a young girl falls down a rabbit hole and meets a talking rabbit, a grinning cat and a very bad-tempered queen.", options: [
      { en: "Alice's Adventures in Wonderland", fr: "Alice au pays des merveilles", motif: "rabbit-watch" }, { en: "Pride and Prejudice", fr: "Orgueil et préjugés", motif: "ballroom" }, { en: "Oliver Twist", fr: "Oliver Twist", motif: "london-street" }, { en: "The Hound of the Baskervilles", fr: "Le Chien des Baskerville", motif: "moor-dog" },
    ], answer: 0, explain: "Le lapin, le chat qui sourit et la reine colérique : c'est Alice, de Lewis Carroll (1865).", bands: b("A1 A2 B1") },
    match("A2 B1 B2 C1", [["Jane Austen", "Pride and Prejudice"], ["Charles Dickens", "Oliver Twist"], ["Arthur Conan Doyle", "Sherlock Holmes"], ["Charlotte Brontë", "Jane Eyre"], ["Lewis Carroll", "Alice's Adventures in Wonderland"]], "Tous ces auteurs sont morts depuis plus de 70 ans : leurs textes originaux sont dans le domaine public."),
    dialogue("A2 B1", "Dans une librairie de Bath.",
      say("Bookseller", "Looking for anything in particular?", "Vous cherchez quelque chose en particulier ?"),
      pick("Demande un conseil.",
        ["Could you recommend a classic that isn't too hard to read?", true, "Demande polie et précise."],
        ["Give me a good book.", false, "Trop direct."]),
      say("Bookseller", "Try The Hound of the Baskervilles. It's short and gripping.", "Essayez Le Chien des Baskerville. C'est court et captivant."),
      pick("Demande de quoi ça parle.",
        ["What's it about?", true, "La question naturelle : « What's it about? »"],
        ["Of what it speaks?", false, "Calque du français."])),
    reorder("B1 B2 C1", "It's about a detective who solves impossible cases", "« It's about… » pour résumer, et « who » pour une personne.", "Ça parle d'un détective qui résout des affaires impossibles."),
    tr("B1 B2 C1", "fr", "Elle a écrit ce roman quand elle avait vingt ans.", ["She wrote this novel when she was twenty.", "She wrote this novel when she was 20.", "She wrote the novel when she was twenty."], "Prétérit : write → wrote. On dit « she was twenty » (être âgé de)."),
    produce("B2 C1", "Défends ton auteur", "Which would you rather read: Austen or Dickens? Justify your choice with two arguments.", "Plutôt Austen ou Dickens ? Justifie ton choix avec deux arguments.", [["austen", "dickens"], ["because", "since", "as", "whereas", "while"], ["prefer", "rather", "would choose", "i'd go for", "i would go for"]], 22, ["I'd rather read Austen because her dialogues are witty and her characters feel very modern, whereas Dickens can be a bit long for me.", "I prefer Dickens since his stories are full of unforgettable characters and they show what life was like for poor people in Victorian London."], "« whereas / while » permettent d'opposer deux auteurs dans la même phrase."),
    mcq("B2 C1", "« Her prose is deceptively simple » signifie :", ["Son style paraît simple mais il est subtil", "Son style est trompeur et faux", "Son style est trop simple"], 0, "« deceptively » = en apparence seulement : la simplicité cache une vraie maîtrise."),
    speak("A1 A2 B1", "Could you recommend a classic?", "Vous pourriez me conseiller un classique ?"),
  ],
  tags: ["literature", "history"],
  lesson: "a2-past-simple-regular", scenario: "passions", reward: "uk-first-edition",
};

const scotland: AtlasMission = {
  id: "uk-scotland", order: 8, title: "L'Écosse, d'Édimbourg aux Highlands", titleEn: "Scotland: Edinburgh to the Highlands", place: "highlands", minutes: 9,
  briefing: "Tu prends le train jusqu'à Édimbourg, capitale de l'Écosse, puis tu pars randonner dans les Highlands avec Callum, guide à Fort William. La météo change vite : il faut comprendre un bulletin et préparer ton sac. Il s'agit d'un exercice de langue, pas d'une formation à la sécurité en montagne.",
  objectives: {
    A1: "Nommer le matériel de randonnée et la météo.",
    A2: "Acheter un billet de train et demander l'heure d'arrivée.",
    B1: "Comprendre un bulletin météo et adapter ton plan.",
    B2: "Discuter des risques et convaincre un ami de changer d'itinéraire.",
    C1: "Comprendre les nuances (Scots, prévisions incertaines) et décrire un paysage avec précision.",
  },
  grammar: ["Futur (will / going to)", "Conditionnel 1 (If it rains, we'll…)", "Modaux de conseil (should, had better)"],
  phrases: [
    { en: "A return ticket to Edinburgh, please.", fr: "Un aller-retour pour Édimbourg, s'il vous plaît." },
    { en: "What time does it arrive?", fr: "À quelle heure arrive-t-il ?" },
    { en: "It's going to rain this afternoon.", fr: "Il va pleuvoir cet après-midi." },
    { en: "If the wind picks up, we'll turn back.", fr: "Si le vent forcit, on fera demi-tour." },
    { en: "You'd better bring a waterproof jacket.", fr: "Tu ferais mieux d'emporter une veste imperméable." },
    { en: "The view is breathtaking.", fr: "La vue est à couper le souffle." },
  ],
  vocab: ["return-ticket", "waterproof", "forecast", "summit", "midges", "itinerary"],
  exercises: [
    match("A1 A2", [["waterproof jacket", "veste imperméable"], ["hiking boots", "chaussures de randonnée"], ["forecast", "prévisions météo"], ["summit", "sommet"], ["map", "carte"]]),
    fill("A1 A2", "A ___ ticket to Edinburgh, please. I'm coming back on Sunday.", ["return"], "Un aller-retour = « a return ticket » ; un aller simple = « a single ».", "Un aller-retour pour Édimbourg."),
    listen("A1 A2 B1", "The 10 o'clock train to Edinburgh Waverley will depart from platform 4. Journey time is about four and a half hours.", "Quel quai et combien de temps ?", ["Quai 10, 4 heures", "Quai 4, environ 4 h 30", "Quai 4, 10 heures"], 1, "« platform 4 », « about four and a half hours » = environ 4 h 30."),
    { type: "assemble", title: "Prépare ton sac", brief: "Callum : « Weather changes fast up there. Pack for rain, wind and midges, and bring enough to eat. » Choisis les bons objets.", options: [
      { id: "jacket", en: "a waterproof jacket", fr: "une veste imperméable" }, { id: "layer", en: "a warm layer", fr: "une couche chaude" }, { id: "repellent", en: "insect repellent", fr: "anti-moustiques" },
      { id: "food", en: "snacks and water", fr: "en-cas et eau" }, { id: "map", en: "a map", fr: "une carte" }, { id: "heels", en: "high heels", fr: "talons hauts" }, { id: "umbrella", en: "a big umbrella", fr: "un grand parapluie" },
    ], correct: ["jacket", "layer", "repellent", "food", "map"], explain: "Pluie et vent → veste imperméable et couche chaude ; « midges » (petits moucherons des Highlands en été) → répulsif. Un parapluie est peu utile par vent fort.", bands: b("A1 A2 B1") },
    { type: "decide", title: "Le bulletin du matin", doc: "Mountain forecast, Lochaber: Morning dry with good visibility. From 2pm, rain spreading from the west, gusts of 50 mph on the summits, visibility dropping to near zero.", audio: true, question: "Votre randonnée dure 6 heures. Que proposes-tu ?", options: [
      { en: "Start early and choose a lower route, so we're down before 2pm.", correct: true, why: "Le matin est sec ; l'après-midi apporte des rafales et une visibilité nulle en altitude. Partir tôt sur un itinéraire bas est raisonnable." },
      { en: "Leave at 1pm for the summit.", correct: false, why: "Vous seriez au sommet pendant les rafales de 50 mph et sans visibilité." },
      { en: "Ignore the forecast: it's summer.", correct: false, why: "En Écosse, la météo de montagne peut être rude même en été." },
    ], bands: b("A2 B1 B2 C1") },
    fix("B1 B2", "If it will rain, we turn back.", ["If it rains, we'll turn back.", "If it rains, we will turn back."], "Conditionnel 1 : if + présent, puis will dans la proposition principale."),
    match("B1 B2 C1", [["wee", "petit"], ["aye", "oui"], ["bonnie", "joli"], ["loch", "lac"], ["glen", "vallée étroite"]], "« loch » et « glen » viennent du gaélique écossais et s'emploient partout en Écosse."),
    produce("B2 C1", "Convaincre de changer de plan", "Your friend wants to climb Ben Nevis this afternoon despite the forecast. Convince them to change plans, politely but firmly.", "Ton ami veut monter au Ben Nevis cet après-midi malgré la météo. Convaincs-le, poliment mais fermement.", [["forecast", "weather", "wind", "rain", "visibility"], ["should", "better", "how about", "why don't we", "instead", "rather"]], 22, ["I know you really want to do it, but the forecast says gusts of 50 mph and almost no visibility. Why don't we do a lower walk this morning and try the summit another day?", "We'd better not go up this afternoon — the wind will be dangerous on the summit. How about Glen Nevis instead?"], "Reconnais d'abord l'envie de l'autre (« I know you really want to… ») avant de proposer une alternative."),
    produce("B1 B2 C1", "Décris le paysage", "Describe the landscape around you in the Highlands in three or four sentences.", "Décris le paysage des Highlands en trois ou quatre phrases.", [["mountain", "mountains", "hills", "peak", "glen", "valley"], ["loch", "lake", "river", "water", "sky", "mist", "clouds"]], 20, ["The mountains are covered in purple heather and the loch below is completely still. Low clouds are drifting over the glen, and it feels incredibly peaceful.", "I can see green hills, a dark loch and mist on the peaks."], "Utilise le présent continu pour ce qui se passe sous tes yeux (« clouds are drifting »)."),
    mcq("C1", "Callum dit : « It's a bit dreich today. » Le mot « dreich » (scots) décrit :", ["un temps gris, humide et morne", "un temps très chaud", "une neige épaisse"], 0, "« dreich » est un mot scots très courant pour un temps gris, humide et déprimant."),
    speak("A1 A2", "A return ticket to Edinburgh, please.", "Un aller-retour pour Édimbourg, s'il vous plaît."),
  ],
  tags: ["hiking", "nature", "train"],
  lesson: "a2-will-going-to", scenario: "plans", reward: "uk-fair-isle-jumper", activityDisclaimer: true,
};

const mystery: AtlasMission = {
  id: "uk-mystery", order: 9, title: "L'enquête mystérieuse", titleEn: "The Bath bookshop mystery", place: "bath", minutes: 10,
  briefing: "Histoire fictive : à Bath, dans la librairie ancienne « Hollis & Page », une première édition (fictive) a disparu pendant l'après-midi. Interroge les personnes présentes, relève les indices et trouve qui a déplacé le livre. Pose les bonnes questions, au bon temps.",
  objectives: {
    A1: "Comprendre des phrases simples sur où étaient les personnes.",
    A2: "Poser des questions au passé (Where were you? What did you see?).",
    B1: "Relier des indices et raconter la chronologie.",
    B2: "Formuler des hypothèses (It must have been…, She can't have…).",
    C1: "Repérer les contradictions subtiles et argumenter ta conclusion.",
  },
  grammar: ["Past simple / past continuous", "Modaux de déduction (must have, can't have)", "Questions au passé"],
  phrases: [
    { en: "Where were you at three o'clock?", fr: "Où étiez-vous à trois heures ?" },
    { en: "What were you doing?", fr: "Que faisiez-vous ?" },
    { en: "Did you see anyone near the shelf?", fr: "Avez-vous vu quelqu'un près de l'étagère ?" },
    { en: "That doesn't add up.", fr: "Ça ne colle pas." },
    { en: "It must have been the courier.", fr: "Ça devait être le coursier." },
    { en: "She can't have done it.", fr: "Elle ne peut pas l'avoir fait." },
  ],
  vocab: ["clue", "witness", "receipt", "alibi", "suspect"],
  exercises: [
    match("A1 A2", [["a clue", "un indice"], ["a witness", "un témoin"], ["a suspect", "un suspect"], ["a receipt", "un reçu"], ["an alibi", "un alibi"]]),
    fill("A1 A2", "Where ___ you at three o'clock?", ["were"], "Passé de « be » avec « you » : were.", "Où étiez-vous à trois heures ?"),
    fill("A2 B1", "I ___ reading in the back room when the bell rang.", ["was"], "Past continuous (was + -ing) pour l'action en cours, interrompue par une action au prétérit.", "Je lisais dans l'arrière-boutique quand la cloche a sonné."),
    { type: "investigate", title: "Le livre disparu", brief: "Le livre était sur l'étagère « Rare books » à 14 h 30. À 15 h 30, il n'y était plus. Interroge chacun, puis désigne qui l'a déplacé.", suspects: [
      { name: "Edith Page", role: "Propriétaire de la librairie", questions: [
        { q: "Where were you between 2.30 and 3.30?", a: "At the till, the whole time. I sold two maps and a cookbook.", clue: "Edith était à la caisse : elle avait la vue sur l'entrée, pas sur l'étagère du fond." },
        { q: "Who came into the shop?", a: "A courier at three, Mr Okafor the collector, and a student who stayed for ages." },
      ] },
      { name: "Daniel Okafor", role: "Collectionneur, client régulier", questions: [
        { q: "What were you doing in the shop?", a: "I was looking at the rare books. I didn't touch the first edition — I've already got one.", clue: "Il possède déjà un exemplaire : peu de raisons de le voler." },
        { q: "Did you see anything strange?", a: "Yes, the courier went to the back with a box, even though deliveries usually stay at the till.", clue: "Le coursier est allé au fond avec un carton, ce qui est inhabituel." },
      ] },
      { name: "Sam Reid", role: "Coursier", questions: [
        { q: "Where did you go?", a: "I just left the parcel at the till and went straight out.", clue: "Contradiction : un témoin l'a vu aller au fond avec un carton." },
        { q: "What was in your box?", a: "Books for repair. Edith asked me to collect them from the back.", clue: "Il a emporté des livres « à réparer » depuis l'arrière-boutique." },
      ] },
      { name: "Lina Haddad", role: "Étudiante", questions: [
        { q: "What were you doing?", a: "Revising for an exam in the reading corner, with my headphones on.", clue: "Elle portait un casque : elle n'a probablement rien entendu." },
      ] },
    ], question: "Que s'est-il passé ?", options: [
      { en: "The courier took the first edition by mistake with the books for repair.", correct: true, why: "Sam dit d'abord être reparti directement, puis admet avoir pris des livres au fond. Daniel l'a vu y aller avec un carton : le livre est sans doute parti avec les livres à réparer." },
      { en: "Daniel stole it for his collection.", correct: false, why: "Il possède déjà un exemplaire et c'est lui qui donne l'indice clé." },
      { en: "Lina hid it in her bag.", correct: false, why: "Aucun indice ne l'accuse : elle révisait avec son casque." },
    ], bands: b("A2 B1 B2 C1") },
    listen("A1 A2 B1", "I was at the till the whole time. I sold two maps and a cookbook.", "Où était Edith ?", ["À la caisse", "Dans l'arrière-boutique", "Dehors"], 0, "« the till » = la caisse enregistreuse."),
    reorder("A1 A2 B1", "Did you see anyone near the shelf", "Question au prétérit : Did + sujet + verbe à l'infinitif.", "Avez-vous vu quelqu'un près de l'étagère ?"),
    mcq("B1 B2 C1", "Sam dit d'abord « I went straight out », puis « I collected books from the back ». C'est :", ["une contradiction", "un alibi solide", "une preuve qu'il est innocent"], 0, "Ses deux versions ne sont pas compatibles : « That doesn't add up »."),
    fill("B2 C1", "It ___ have been Lina: she had her headphones on and never left the reading corner.", ["can't", "cannot", "couldn't", "could not"], "Déduction négative au passé : can't have + participe passé (= c'est impossible que…).", "Ça ne peut pas être Lina."),
    produce("B2 C1", "Ta conclusion", "Explain who moved the book and how you know. Use at least one modal of deduction.", "Explique qui a déplacé le livre et comment tu le sais, avec au moins un modal de déduction.", [["courier", "sam"], ["must have", "might have", "may have", "can't have", "could have", "must've"], ["because", "since", "as", "so"]], 22, ["It must have been Sam, the courier. He said he went straight out, but Daniel saw him go to the back with a box, so he probably took the first edition by mistake with the books for repair.", "Sam must have taken it by accident because he collected books from the back room."], "« must have + participe » = conclusion presque certaine sur le passé."),
    tr("B1 B2 C1", "en", "That doesn't add up.", ["Ça ne colle pas.", "Ça ne tient pas debout.", "Ça ne colle pas du tout.", "Il y a quelque chose qui cloche."], "« add up » = être cohérent (littéralement : faire le bon total)."),
    speak("A1 A2 B1", "Where were you at three o'clock?", "Où étiez-vous à trois heures ?"),
  ],
  tags: ["literature", "city"],
  lesson: "b2-modals-deduction", scenario: "past-story", reward: "uk-detective-notebook",
};

// ---------------------------------------------------------------------
// Final story — "A weekend in Edinburgh"
// ---------------------------------------------------------------------

const finalNodes: StoryNode[] = [
  {
    id: "arrive", scene: "Vendredi soir, tu arrives dans un petit B&B d'Édimbourg. L'hôte ne trouve pas ta réservation.",
    lines: [{ speaker: "Fiona", en: "I'm so sorry, I can't see anything under that name.", fr: "Je suis vraiment désolée, je ne vois rien à ce nom." }],
    step: { kind: "choice", prompt: "Comment réagis-tu ?", options: [
      { en: "No problem. I booked a double room for two nights. Could you check under 'Martin', M-A-R-T-I-N?", next: "found", good: true, why: "Calme, précis, tu épelles ton nom : c'est la meilleure façon de résoudre le problème." },
      { en: "You lost my booking! This is unacceptable!", next: "tense", good: false, why: "La colère complique la situation ; le problème est souvent une simple faute de frappe." },
    ] },
  },
  {
    id: "tense", scene: "Fiona se crispe un peu, mais cherche encore. Elle trouve la réservation au nom de « Marten ».",
    lines: [{ speaker: "Fiona", en: "Ah — here it is. Someone typed 'Marten'. Sorry about that.", fr: "Ah, la voilà. Quelqu'un a tapé « Marten ». Désolée." }],
    step: { kind: "choice", prompt: "Rattrape la situation.", options: [
      { en: "Oh, thank you so much — and sorry I got a bit stressed. It's been a long day.", next: "found", good: true, why: "S'excuser avec simplicité détend l'atmosphère : très apprécié au Royaume-Uni." },
      { en: "Finally.", next: "found", good: false, why: "Sec : la relation avec ton hôte part mal pour le week-end." },
    ] },
  },
  {
    id: "found", scene: "Tout est réglé. Fiona te donne ta clé et te demande à quelle heure tu rentreras ce soir.",
    lines: [{ speaker: "Fiona", en: "Will you be back late tonight? The front door locks at eleven.", fr: "Vous rentrerez tard ce soir ? La porte d'entrée se ferme à 23 h." }],
    step: { kind: "produce", exercise: { type: "produce", title: "Ton programme du soir", prompt: "Tell Fiona what time you'll be back and ask for the wifi password.", fr: "Dis à Fiona à quelle heure tu rentres et demande le mot de passe du wifi.", mustInclude: [["back", "return", "home", "come in", "get in"], ["wifi", "wi-fi", "password", "internet"]], minWords: 10, samples: ["I'll be back around ten, so that's fine. Could I have the wifi password, please?", "I should be home before eleven. What's the wifi password?"], tip: "« I'll be back around… » = je serai de retour vers…" }, next: "breakfast" },
  },
  {
    id: "breakfast", scene: "Samedi matin, au petit-déjeuner, Fiona prend les commandes.",
    lines: [{ speaker: "Fiona", en: "Morning! Full Scottish, or something lighter?", fr: "Bonjour ! Petit-déjeuner écossais complet ou plus léger ?" }],
    step: { kind: "exercise", exercise: { type: "assemble", title: "La commande de ta voisine de table", brief: "Écoute ce que commande la voyageuse à côté de toi et compose son assiette.", audio: "Could I have porridge with honey, a slice of toast and a pot of tea, please? No eggs for me, thanks.", options: [
      { id: "porridge", en: "porridge", fr: "porridge" }, { id: "honey", en: "honey", fr: "miel" }, { id: "toast", en: "toast", fr: "pain grillé" }, { id: "tea", en: "a pot of tea", fr: "une théière" },
      { id: "eggs", en: "eggs", fr: "œufs" }, { id: "coffee", en: "coffee", fr: "café" },
    ], correct: ["porridge", "honey", "toast", "tea"], explain: "Elle refuse les œufs (« No eggs for me ») et prend du thé, pas de café." }, next: "route" },
  },
  {
    id: "route", scene: "Tu as la journée devant toi. Fiona te propose deux options.",
    lines: [{ speaker: "Fiona", en: "You could walk up the Royal Mile to the castle, or climb Arthur's Seat — it's an old volcano, great views.", fr: "Tu peux remonter le Royal Mile jusqu'au château, ou grimper Arthur's Seat, un ancien volcan, avec une vue superbe." }],
    step: { kind: "choice", prompt: "Que choisis-tu ?", options: [
      { en: "I think I'll do the castle — I love history.", next: "castle", good: true, why: "Choix justifié : très naturel." },
      { en: "Arthur's Seat sounds amazing. How long does it take to get to the top?", next: "hill", good: true, why: "Tu choisis et tu poses une question utile." },
    ] },
  },
  {
    id: "castle", scene: "Devant le château, un panneau t'arrête.",
    step: { kind: "exercise", exercise: { type: "decide", title: "Billets du château", doc: "Edinburgh Castle — Timed entry. Tickets sold online only today. Next available slot: 1.30pm.", question: "Il est 11 h. Que fais-tu ?", options: [
      { en: "Book the 1.30 slot online and explore the Royal Mile until then.", correct: true, why: "Les billets sont horodatés et vendus en ligne aujourd'hui ; le prochain créneau est 13 h 30." },
      { en: "Queue at the gate to buy a ticket.", correct: false, why: "« Tickets sold online only today »." },
      { en: "Go in now without a ticket.", correct: false, why: "L'entrée est horodatée (« timed entry »)." },
    ] }, next: "meet" },
  },
  {
    id: "hill", scene: "Au sommet d'Arthur's Seat, le vent se lève. Un panneau donne une consigne.",
    step: { kind: "exercise", exercise: { type: "decide", title: "Au sommet", doc: "Strong winds expected after 3pm. Paths can be slippery when wet. Please keep to the marked paths.", question: "Il est 14 h 45 et il commence à pleuvoir. Que fais-tu ?", options: [
      { en: "Head down now on the marked path.", correct: true, why: "Vent fort après 15 h et chemins glissants sous la pluie : redescendre par le sentier balisé est raisonnable." },
      { en: "Take a shortcut down the rocks.", correct: false, why: "Le panneau demande de rester sur les chemins balisés, glissants par temps humide." },
    ] }, next: "meet" },
  },
  {
    id: "meet", scene: "Dans un café, une voyageuse canadienne, Jo, s'assoit à côté de toi.",
    lines: [{ speaker: "Jo", en: "Hi! Is this seat taken? I'm Jo, from Halifax.", fr: "Salut ! Cette place est prise ? Moi c'est Jo, d'Halifax." }],
    step: { kind: "choice", prompt: "Lance la conversation.", options: [
      { en: "No, go ahead! I'm Léa, from France. How long have you been in Scotland?", next: "problem", good: true, why: "Tu réponds, te présentes et poses une question ouverte : la conversation peut continuer." },
      { en: "No.", next: "problem", good: false, why: "Correct mais fermé : Jo risque de ne pas oser continuer." },
    ] },
  },
  {
    id: "problem", scene: "Dimanche, à la gare de Waverley, ton train de retour pour Londres est annulé.",
    lines: [{ speaker: "Announcement", en: "We're sorry to announce that the 12.00 service to London King's Cross has been cancelled.", fr: "Nous sommes au regret de vous annoncer que le train de 12 h pour Londres King's Cross est annulé." }],
    step: { kind: "produce", exercise: { type: "produce", title: "Au guichet", prompt: "Explain your problem at the ticket office and ask what your options are.", fr: "Explique ton problème au guichet et demande quelles sont tes options.", mustInclude: [["cancelled", "canceled", "cancellation"], ["next", "another", "alternative", "options", "what can i do", "later"]], minWords: 14, samples: ["Hi, my 12 o'clock train to King's Cross has been cancelled. Can I use my ticket on the next train, or what are my options?", "Sorry, my train was cancelled. Is there another train to London this afternoon?"], tip: "Donne l'info clé (quel train) puis pose une question ouverte : « What are my options? »" }, next: "story" },
  },
  {
    id: "story", scene: "Dans le train suivant, tu écris à un ami pour raconter ton week-end.",
    step: { kind: "produce", exercise: { type: "produce", title: "Raconte ton week-end", prompt: "Write a short message to a friend about your weekend in Edinburgh: what you did, who you met and one problem you solved.", fr: "Écris un court message à un ami sur ton week-end : ce que tu as fait, qui tu as rencontré et un problème résolu.", mustInclude: [["visited", "went", "climbed", "walked", "saw"], ["met", "talked", "chatted"], ["cancelled", "problem", "booking", "lost", "but"]], minWords: 30, samples: ["What a weekend! I visited Edinburgh Castle, walked up the Royal Mile and met a lovely Canadian traveller called Jo. My B&B couldn't find my booking at first and my train was cancelled, but everything worked out in the end.", "I climbed Arthur's Seat, which is an old volcano, and the view was breathtaking. I chatted with a girl from Halifax in a café. My train home was cancelled, so I took the next one."], tip: "Prétérit pour les actions, et « but… in the end » pour raconter un problème résolu." }, next: "end" },
  },
  { id: "end", scene: "Le train file vers le sud. Ton week-end écossais est terminé.", step: { kind: "end", summary: "Tu as résolu une réservation, commandé, choisi ton itinéraire, lu des consignes, rencontré quelqu'un et géré une annulation : tu sais te débrouiller en anglais au Royaume-Uni." } },
];

// ---------------------------------------------------------------------
// Destination
// ---------------------------------------------------------------------

export const UK: AtlasDestination | null = {
  id: "uk",
  tagline: "Quatre nations, mille accents, et des histoires à chaque coin de rue.",
  intro: "Le Royaume-Uni réunit l'Angleterre, l'Écosse, le pays de Galles et l'Irlande du Nord. L'anglais y est la langue principale, aux côtés du gallois, du gaélique écossais, du scots ou de l'irlandais selon les régions. Des grandes villes multiculturelles aux landes du nord, chaque région a son accent, son humour et ses habitudes : on y voyage aussi bien par les livres que par le train.",
  palette: { sky: "#C9D6DF", land: "#8BA888", sea: "#5F7F95", accent: "#B5533C", ink: "#22313F" },
  landscape: "uk-city-hills",
  places: [
    { id: "london", name: "Londres", kind: "capitale", fr: "Capitale du Royaume-Uni, traversée par la Tamise, avec un métro ouvert en 1863." },
    { id: "british-museum", name: "British Museum", kind: "musée", fr: "Musée fondé en 1753 ; l'entrée de sa collection permanente est gratuite." },
    { id: "manchester", name: "Manchester", kind: "ville", fr: "Grande ville du nord-ouest de l'Angleterre, marquée par son passé industriel et sa scène musicale." },
    { id: "bath", name: "Bath", kind: "ville historique", fr: "Ville inscrite au patrimoine mondial de l'UNESCO, connue pour ses thermes romains et son architecture géorgienne." },
    { id: "edinburgh", name: "Édimbourg", kind: "capitale de l'Écosse", fr: "Capitale de l'Écosse ; sa vieille ville et sa ville nouvelle sont inscrites à l'UNESCO." },
    { id: "highlands", name: "Highlands écossais", kind: "montagnes", fr: "Région montagneuse du nord de l'Écosse, où se trouve le Ben Nevis (1 345 m), plus haut sommet du Royaume-Uni." },
    { id: "cardiff", name: "Cardiff", kind: "capitale du pays de Galles", fr: "Capitale du pays de Galles, où le gallois et l'anglais sont tous deux langues officielles." },
  ],
  characters: [
    { id: "maggie", name: "Maggie", role: "Patronne d'un café à Camden", origin: "local", personality: "Chaleureuse, bavarde, très directe sous des airs polis.", register: "familier", accent: "en-GB", hello: "Hiya, love! Tea's on." },
    { id: "callum", name: "Callum", role: "Guide de randonnée à Fort William", origin: "local", personality: "Calme, prudent, pince-sans-rire.", register: "courant", accent: "en-GB", hello: "Aye, the weather's turning. Got your waterproofs?" },
    { id: "priya", name: "Priya", role: "Médiatrice culturelle dans un musée londonien", origin: "local", personality: "Passionnée, précise, aime les débats.", register: "courant", accent: "en-GB", hello: "Every object here has at least two stories." },
    { id: "edith", name: "Edith Page", role: "Libraire à Bath", origin: "local", personality: "Érudite, un peu théâtrale.", register: "formel", accent: "en-GB", hello: "Do mind the stairs — the poetry's on the top floor." },
    { id: "jo", name: "Jo", role: "Voyageuse canadienne", origin: "traveller", personality: "Curieuse, sociable, toujours un plan B.", register: "familier", accent: "en-CA", hello: "Hey! Want to split a taxi?" },
    { id: "rafael", name: "Rafael", role: "Étudiant brésilien en échange à Manchester", origin: "traveller", personality: "Drôle, apprend lui aussi les accents du nord.", register: "familier", hello: "I've been here six months and I still say 'pardon?' a lot." },
  ],
  culture: [
    { title: "Le pub", fr: "Lieu de rencontre de quartier, pas seulement pour l'alcool : on y mange, on y joue au quiz, on y regarde des matchs. On commande en général au bar." },
    { title: "La file d'attente", fr: "Faire la queue (« queue ») est une habitude sociale très respectée." },
    { title: "Les musées gratuits", fr: "Beaucoup de musées nationaux sont gratuits pour leurs collections permanentes ; les expositions temporaires sont souvent payantes." },
    { title: "Plusieurs langues", fr: "Le gallois est officiel au pays de Galles ; le gaélique écossais et le scots sont reconnus en Écosse ; l'irlandais et l'Ulster Scots en Irlande du Nord." },
    { title: "L'understatement", fr: "On atténue souvent ce qu'on pense : « not bad » peut être un vrai compliment, « a bit annoying » une vraie colère." },
  ],
  food: [
    { en: "Afternoon tea", fr: "Le thé de l'après-midi", desc: "Thé servi avec des petits sandwichs, des scones, de la crème et de la confiture ; souvent pour une occasion." },
    { en: "Fish and chips", fr: "Poisson pané et frites", desc: "Plat populaire vendu dans les « chippies », souvent à emporter." },
    { en: "Full breakfast", fr: "Petit-déjeuner complet", desc: "Œufs, saucisses, haricots, champignons, tomates ; versions anglaise, écossaise, galloise ou d'Ulster." },
    { en: "Welsh rarebit", fr: "Welsh rarebit", desc: "Pain grillé nappé d'une sauce au fromage épicée, spécialité galloise." },
    { en: "Cranachan", fr: "Cranachan", desc: "Dessert écossais à la crème, aux framboises, au miel et à l'avoine grillée." },
  ],
  vocab: [
    { id: "pint", en: "a pint", fr: "une pinte" },
    { id: "round", en: "a round", fr: "une tournée", example: "It's my round." },
    { id: "soft-drink", en: "a soft drink", fr: "une boisson sans alcool", concept: "soft-drink" },
    { id: "quiz", en: "a pub quiz", fr: "un quiz au pub" },
    { id: "bar", en: "the bar", fr: "le comptoir" },
    { id: "cheers", en: "cheers", fr: "merci / santé", concept: "thanks-informal" },
    { id: "take-away", en: "to take away", fr: "à emporter", concept: "take-away" },
    { id: "scone", en: "a scone", fr: "un scone" },
    { id: "bill", en: "the bill", fr: "l'addition", concept: "the-bill" },
    { id: "milk", en: "milk", fr: "lait" },
    { id: "afternoon-tea", en: "afternoon tea", fr: "thé de l'après-midi" },
    { id: "platform", en: "a platform", fr: "un quai", concept: "platform" },
    { id: "line", en: "a line", fr: "une ligne (de métro)", concept: "metro-line" },
    { id: "change", en: "to change (trains)", fr: "changer (de train)", concept: "to-change-trains" },
    { id: "northbound", en: "northbound", fr: "direction nord" },
    { id: "contactless", en: "contactless", fr: "sans contact", concept: "contactless" },
    { id: "step-free", en: "step-free access", fr: "accès sans marches", concept: "accessibility" },
    { id: "straight-on", en: "straight on", fr: "tout droit", concept: "directions" },
    { id: "corner", en: "the corner", fr: "le coin" },
    { id: "crossroads", en: "a crossroads", fr: "un carrefour" },
    { id: "on-foot", en: "on foot", fr: "à pied", concept: "on-foot" },
    { id: "opposite", en: "opposite", fr: "en face de", concept: "directions" },
    { id: "quid", en: "a quid", fr: "une livre (familier)" },
    { id: "loo", en: "the loo", fr: "les toilettes (familier)", concept: "toilets" },
    { id: "mate", en: "mate", fr: "pote, ami" },
    { id: "wee", en: "wee", fr: "petit (Écosse)" },
    { id: "aye", en: "aye", fr: "oui (Écosse, nord)" },
    { id: "queue", en: "a queue", fr: "une file d'attente", concept: "queue" },
    { id: "cloakroom", en: "a cloakroom", fr: "un vestiaire" },
    { id: "exhibition", en: "an exhibition", fr: "une exposition", concept: "exhibition" },
    { id: "audio-guide", en: "an audio guide", fr: "un audioguide" },
    { id: "donation", en: "a donation", fr: "un don" },
    { id: "gallery", en: "a gallery", fr: "une salle / galerie" },
    { id: "novel", en: "a novel", fr: "un roman" },
    { id: "plot", en: "the plot", fr: "l'intrigue" },
    { id: "author", en: "an author", fr: "un auteur" },
    { id: "bookshop", en: "a bookshop", fr: "une librairie", concept: "bookshop" },
    { id: "chapter", en: "a chapter", fr: "un chapitre" },
    { id: "return-ticket", en: "a return ticket", fr: "un aller-retour", concept: "to-book" },
    { id: "waterproof", en: "a waterproof jacket", fr: "une veste imperméable", concept: "rain-gear" },
    { id: "forecast", en: "the forecast", fr: "les prévisions météo", concept: "weather-forecast" },
    { id: "summit", en: "the summit", fr: "le sommet", concept: "summit" },
    { id: "midges", en: "midges", fr: "petits moucherons (Écosse)" },
    { id: "itinerary", en: "an itinerary", fr: "un itinéraire", concept: "itinerary" },
    { id: "clue", en: "a clue", fr: "un indice" },
    { id: "witness", en: "a witness", fr: "un témoin" },
    { id: "receipt", en: "a receipt", fr: "un reçu", concept: "receipt" },
    { id: "alibi", en: "an alibi", fr: "un alibi" },
    { id: "suspect", en: "a suspect", fr: "un suspect" },
  ],
  expressions: [
    { en: "You alright?", fr: "Ça va ? (salutation)" },
    { en: "Cheers!", fr: "Merci ! / Santé !" },
    { en: "It's my round.", fr: "C'est ma tournée." },
    { en: "Sorry to bother you…", fr: "Désolé de vous déranger…" },
    { en: "Mind the gap.", fr: "Attention à la marche / à l'espace." },
    { en: "It's a stone's throw away.", fr: "C'est à deux pas." },
    { en: "Not bad at all.", fr: "Vraiment pas mal (souvent un compliment).", note: "Understatement" },
    { en: "I'm knackered.", fr: "Je suis crevé.", note: "Familier" },
    { en: "Fancy a cuppa?", fr: "Tu veux une tasse de thé ?", note: "Familier" },
    { en: "That doesn't add up.", fr: "Ça ne colle pas." },
    { en: "I'm afraid…", fr: "Je crains que… (pour adoucir une mauvaise nouvelle)" },
    { en: "Have a good one!", fr: "Bonne journée !" },
    { en: "It's a bit dreich.", fr: "Il fait gris et humide. (Écosse)" },
    { en: "Shall we…?", fr: "Et si on… ?" },
  ],
  missions: [pub, tea, tube, directions, accents, museum, literature, scotland, mystery],
  final: {
    id: "uk-final", title: "Un week-end à Édimbourg", titleEn: "A weekend in Edinburgh",
    intro: "Mission finale : un week-end complet en Écosse. Réservation, petit-déjeuner, itinéraire, rencontre, imprévu… Tes choix changent l'histoire, et tes réponses libres sont évaluées sur le sens, pas sur une phrase exacte.",
    start: "arrive", nodes: finalNodes,
    skills: ["Résoudre un problème de réservation", "Commander", "Lire des consignes", "Engager la conversation", "Gérer une annulation", "Raconter un voyage"],
  },
  rewards: [
    { id: "uk-fair-isle-jumper", kind: "clothing", fr: "Pull jacquard Fair Isle", en: "Fair Isle jumper", desc: "Pull en laine aux motifs colorés, inspiré du tricot traditionnel des îles Shetland.", shopItem: "uk-fair-isle-jumper", motif: "knit-pattern" },
    { id: "uk-flat-cap", kind: "clothing", fr: "Casquette plate en tweed", en: "Tweed flat cap", desc: "Casquette plate en tweed, portée depuis plus d'un siècle à la ville comme à la campagne.", shopItem: "uk-flat-cap", motif: "flat-cap" },
    { id: "uk-umbrella", kind: "accessory", fr: "Parapluie pliant vert sapin", en: "Forest-green umbrella", desc: "Le compagnon indispensable d'une journée à Londres.", shopItem: "uk-umbrella", motif: "umbrella" },
    { id: "uk-tote-bag", kind: "accessory", fr: "Tote bag de librairie", en: "Bookshop tote bag", desc: "Sac en toile d'une librairie indépendante de Bath.", shopItem: "uk-tote-bag", motif: "tote" },
    { id: "uk-tea-set", kind: "decor", fr: "Service à thé fleuri", en: "Floral tea set", desc: "Théière et tasses en porcelaine pour ton propre afternoon tea.", shopItem: "uk-tea-set", motif: "teapot" },
    { id: "uk-first-edition", kind: "souvenir-culture", fr: "Reproduction d'une couverture victorienne", en: "Victorian book cover replica", desc: "La couverture d'un roman du XIXᵉ siècle, aujourd'hui dans le domaine public.", motif: "book" },
    { id: "uk-museum-print", kind: "souvenir-culture", fr: "Gravure de la salle de lecture", en: "Reading room print", desc: "Une gravure de la grande salle de lecture circulaire.", motif: "print" },
    { id: "uk-oyster-souvenir", kind: "souvenir-activity", fr: "Plan de métro de poche", en: "Pocket Tube map", desc: "Un plan plié, annoté de tes correspondances.", motif: "map" },
    { id: "uk-detective-notebook", kind: "souvenir-activity", fr: "Carnet de détective", en: "Detective's notebook", desc: "Le carnet où tu as noté les indices de l'enquête de Bath.", motif: "notebook" },
    { id: "uk-stamp", kind: "stamp", fr: "Tampon Royaume-Uni", en: "United Kingdom stamp", desc: "Un tampon rond orné d'une boîte aux lettres et d'un chardon.", motif: "postbox-thistle" },
    { id: "uk-postcard", kind: "postcard", fr: "Carte postale d'Édimbourg", en: "Edinburgh postcard", desc: "Le château au-dessus des toits, sous un ciel changeant.", motif: "castle-rooftops" },
    { id: "uk-trophy", kind: "trophy", fr: "Trophée « Explorateur britannique »", en: "British explorer trophy", desc: "Pour avoir validé toutes les missions du Royaume-Uni.", motif: "trophy" },
  ],
  story: {
    title: "The Umbrella on the 73", level: "A2",
    text: `Nadia arrived in London on a grey Monday morning. She had one suitcase, one address and no umbrella.

At the bus stop, an old man smiled at her. "First time in London?" he asked. "Yes," said Nadia. "Is it always this wet?" The man laughed. "Only on days that end in 'y'." Nadia didn't understand the joke at first. Then she counted: Monday, Tuesday, Wednesday… She laughed too.

The number 73 bus came. Nadia sat upstairs, at the front, like a child. Below her, red buses, black taxis and hundreds of umbrellas moved slowly along Oxford Street. When she got off, she saw a green umbrella on the seat next to her. It wasn't hers.

She took it to the driver. "Someone forgot this," she said. "Keep it, love," the driver said. "Nobody comes back for umbrellas in London. It's tradition." Nadia wasn't sure it was a real tradition, but she said thank you and opened it. It was the perfect size.

That evening, she went to a small café near her new flat. The owner, Maggie, looked at the umbrella. "Ooh, nice. Where did you get that?" Nadia told her the story. Maggie poured two cups of tea. "Well," she said, "now you're a real Londoner. You've got an umbrella and a story."

A month later, Nadia was on the 73 again. A young man got on, wet from head to toe. He looked lost. Nadia smiled and held out the green umbrella. "First time in London?" she asked.`,
    glossary: [
      { en: "wet", fr: "mouillé, humide" }, { en: "upstairs", fr: "à l'étage" }, { en: "to get off", fr: "descendre (d'un bus)" },
      { en: "to forget", fr: "oublier" }, { en: "to pour", fr: "verser" }, { en: "from head to toe", fr: "de la tête aux pieds" },
    ],
  },
  postcardLine: "I explored the United Kingdom, solved a mystery in Bath and finally understood what 'You alright?' means.",
  sources: [
    "VisitBritain — visitbritain.com",
    "VisitScotland — visitscotland.com",
    "Transport for London — tfl.gov.uk",
    "British Museum — britishmuseum.org",
    "UNESCO World Heritage Centre (City of Bath; Old and New Towns of Edinburgh) — whc.unesco.org",
    "Encyclopaedia Britannica — britannica.com",
  ],
  review: { linguistic: "auto-checked", cultural: "auto-checked", updated: "2026-11-27" },
};
