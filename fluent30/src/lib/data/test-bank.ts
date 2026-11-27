// Built-in assessment items (written for Fluent30). Used by the placement, weekly and monthly tests.

/** Plausible non-words, used to correct for over-claiming in yes/no vocabulary tests (LexTALE-style). */
export const PSEUDOWORDS = [
  "plinder", "crumbish", "dorrow", "flimp", "brastle", "mennick", "snolter", "quabe", "trindle", "glonk",
  "parlish", "skettle", "bromity", "wendish", "clape", "fraddle", "humbrous", "nackle", "spoint", "thrunder",
  "obvesh", "gristal", "plunder" /* real — excluded below */, "molent", "rabbage", "slinter", "verdock", "kemble",
  "proffle", "dwindy", "stampery", "lurgent", "forbish", "chandle", "pribble", "scrumpet", "fenderish", "blusk",
].filter((w) => w !== "plunder");

export interface McqItem {
  id: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1";
  prompt: string; // sentence with ___
  options: string[];
  answer: number; // index in options
  explanation: string; // French
  topic: string; // grammar lesson id / topic
}

export const GRAMMAR_ITEMS: McqItem[] = [
  { id: "g1", level: "A1", prompt: "She ___ in London.", options: ["live", "lives", "is live", "living"], answer: 1, explanation: "Present simple, 3e personne du singulier : on ajoute -s.", topic: "present-simple" },
  { id: "g2", level: "A1", prompt: "___ you like coffee?", options: ["Are", "Do", "Does", "Have"], answer: 1, explanation: "Question au present simple avec 'you' : auxiliaire do.", topic: "questions" },
  { id: "g3", level: "A1", prompt: "I ___ a student.", options: ["am", "is", "are", "be"], answer: 0, explanation: "be : I am, you are, he/she/it is.", topic: "present-simple" },
  { id: "g4", level: "A1", prompt: "They ___ TV right now.", options: ["watch", "watches", "are watching", "watched"], answer: 2, explanation: "Action en cours ('right now') : present continuous.", topic: "present-continuous" },
  { id: "g5", level: "A2", prompt: "I ___ to Spain last summer.", options: ["go", "have gone", "went", "was going"], answer: 2, explanation: "Moment passé terminé et précis ('last summer') : past simple.", topic: "past-simple" },
  { id: "g6", level: "A2", prompt: "He doesn't ___ meat.", options: ["eats", "eat", "eating", "ate"], answer: 1, explanation: "Après does/doesn't, le verbe reste à la base verbale.", topic: "negatives" },
  { id: "g7", level: "A2", prompt: "Look at those clouds! It ___ rain.", options: ["will", "is going to", "rains", "would"], answer: 1, explanation: "Prédiction fondée sur un indice présent : be going to.", topic: "will-vs-going-to" },
  { id: "g8", level: "A2", prompt: "There aren't ___ eggs left.", options: ["some", "any", "no", "much"], answer: 1, explanation: "Phrase négative avec un dénombrable pluriel : any.", topic: "quantifiers" },
  { id: "g9", level: "A2", prompt: "She is ___ than her brother.", options: ["more tall", "taller", "tallest", "the taller"], answer: 1, explanation: "Adjectif court : comparatif en -er.", topic: "comparatives" },
  { id: "g10", level: "B1", prompt: "I ___ here since 2019.", options: ["live", "am living", "have lived", "lived"], answer: 2, explanation: "Action commencée dans le passé et toujours vraie, avec 'since' : present perfect (pas le présent comme en français).", topic: "for-vs-since" },
  { id: "g11", level: "B1", prompt: "Have you ___ been to Japan?", options: ["ever", "yet", "already", "since"], answer: 0, explanation: "'ever' = déjà (une fois dans sa vie), dans les questions au present perfect.", topic: "present-perfect" },
  { id: "g12", level: "B1", prompt: "If it rains tomorrow, we ___ at home.", options: ["stay", "will stay", "would stay", "stayed"], answer: 1, explanation: "Conditionnel de type 1 : if + présent, will + base verbale.", topic: "conditionals-real" },
  { id: "g13", level: "B1", prompt: "I was cooking when the phone ___.", options: ["rang", "was ringing", "rings", "has rung"], answer: 0, explanation: "Action longue (past continuous) interrompue par une action courte (past simple).", topic: "past-continuous" },
  { id: "g14", level: "B1", prompt: "You ___ wear a seatbelt. It's the law.", options: ["should", "must", "might", "could"], answer: 1, explanation: "Obligation forte/règle : must (ou have to).", topic: "must" },
  { id: "g15", level: "B1", prompt: "I used to ___ football every weekend.", options: ["playing", "played", "play", "plays"], answer: 2, explanation: "used to + base verbale pour une habitude passée.", topic: "used-to" },
  { id: "g16", level: "B1", prompt: "This bridge ___ in 1890.", options: ["built", "was built", "has built", "is building"], answer: 1, explanation: "Voix passive au passé : was/were + participe passé.", topic: "passive" },
  { id: "g17", level: "B2", prompt: "If I ___ more time, I would travel more.", options: ["have", "had", "would have", "will have"], answer: 1, explanation: "Conditionnel de type 2 (hypothèse) : if + prétérit.", topic: "conditionals-unreal" },
  { id: "g18", level: "B2", prompt: "By the time we arrived, the film ___.", options: ["started", "has started", "had started", "was starting"], answer: 2, explanation: "Antériorité dans le passé : past perfect.", topic: "past-perfect" },
  { id: "g19", level: "B2", prompt: "She told me she ___ tired.", options: ["is", "was", "has been", "will be"], answer: 1, explanation: "Discours rapporté : le présent recule au passé (concordance des temps).", topic: "reported-speech" },
  { id: "g20", level: "B2", prompt: "I've been waiting ___ two hours!", options: ["since", "during", "for", "from"], answer: 2, explanation: "'for' + durée ; 'since' + point de départ.", topic: "for-vs-since" },
  { id: "g21", level: "B2", prompt: "He ___ have left already — his coat is gone.", options: ["must", "should", "can", "would"], answer: 0, explanation: "Déduction quasi certaine sur le passé : must have + participe passé.", topic: "must" },
  { id: "g22", level: "B2", prompt: "I'm not used to ___ up so early.", options: ["get", "getting", "got", "have got"], answer: 1, explanation: "be used to + -ing = être habitué à.", topic: "used-to" },
  { id: "g23", level: "C1", prompt: "If she had taken the job, she ___ in Paris now.", options: ["would live", "would have lived", "will live", "lived"], answer: 0, explanation: "Conditionnel mixte : condition passée, conséquence présente.", topic: "conditionals-unreal" },
  { id: "g24", level: "C1", prompt: "Hardly ___ the house when it started to pour.", options: ["I had left", "had I left", "I left", "did I leave"], answer: 1, explanation: "Inversion après une expression négative en tête de phrase (registre soutenu).", topic: "word-order" },
  { id: "g25", level: "C1", prompt: "I'd rather you ___ tell anyone.", options: ["don't", "didn't", "won't", "not"], answer: 1, explanation: "would rather + sujet + prétérit pour exprimer une préférence sur l'action de quelqu'un d'autre.", topic: "would-modal" },
  { id: "g26", level: "A2", prompt: "What ___ you do yesterday?", options: ["did", "do", "were", "have"], answer: 0, explanation: "Question au past simple : auxiliaire did + base verbale.", topic: "questions" },
  { id: "g27", level: "B1", prompt: "I haven't finished my homework ___.", options: ["already", "still", "yet", "ever"], answer: 2, explanation: "'yet' en fin de phrase négative ou interrogative.", topic: "already-yet-still" },
  { id: "g28", level: "A2", prompt: "Can you ___ me the salt, please?", options: ["pass", "passing", "to pass", "passed"], answer: 0, explanation: "Après un modal (can), base verbale sans 'to'.", topic: "can-could-able" },
];

export interface ReadingPassage {
  id: string;
  level: "A2" | "B1" | "B2";
  title: string;
  text: string;
  questions: { q: string; options: string[]; answer: number }[];
}

export const READING_PASSAGES: ReadingPassage[] = [
  {
    id: "r1", level: "A2", title: "A new job",
    text: "Maya started a new job last Monday. She works in a small bakery near the station. Every morning she gets up at five o'clock, because the bakery opens at six. She doesn't mind the early start: she loves the smell of fresh bread, and her boss, Tom, is very kind. On her first day she burnt a tray of croissants, but Tom just laughed and said, \"Everybody does that once.\"",
    questions: [
      { q: "Where is the bakery?", options: ["Near the station", "Next to Maya's house", "In the city centre", "Near a school"], answer: 0 },
      { q: "Why does Maya get up at five?", options: ["She goes running", "The bakery opens at six", "She lives far away", "Tom asks her to"], answer: 1 },
      { q: "How did Tom react to the burnt croissants?", options: ["He was angry", "He laughed", "He fired her", "He didn't notice"], answer: 1 },
    ],
  },
  {
    id: "r2", level: "B1", title: "Slow travel",
    text: "More and more people are choosing to travel by train instead of flying, even for long distances. Some do it for environmental reasons, but many say the journey itself has become part of the holiday. \"On a plane you're just waiting to arrive,\" explains Lucas, who recently travelled from Paris to Rome by night train. \"On the train I read, I chatted with other passengers and I watched the Alps go by. I arrived relaxed instead of exhausted.\" The main drawback, travellers admit, is the price: rail tickets are often more expensive than budget flights.",
    questions: [
      { q: "According to the text, why do many people prefer the train?", options: ["It is always cheaper", "The journey is part of the holiday", "Planes are dangerous", "Trains are faster"], answer: 1 },
      { q: "How did Lucas feel when he arrived in Rome?", options: ["Exhausted", "Bored", "Relaxed", "Lost"], answer: 2 },
      { q: "What is the main disadvantage mentioned?", options: ["Comfort", "Price", "Delays", "Noise"], answer: 1 },
    ],
  },
  {
    id: "r3", level: "B2", title: "The four-day week",
    text: "When a software company in Bristol trialled a four-day working week, managers expected productivity to drop. Instead, output held steady and sick days fell by almost a third. Staff reported that the extra day off gave them time for errands and family, which meant fewer distractions during working hours. Critics, however, point out that the model is harder to apply in sectors such as healthcare or retail, where someone has to be physically present. The company's director remains cautious: \"It worked for us, but I wouldn't claim it's a universal solution.\"",
    questions: [
      { q: "What did managers originally expect?", options: ["More sick days", "Lower productivity", "Higher salaries", "Fewer staff"], answer: 1 },
      { q: "Why, according to staff, were they less distracted at work?", options: ["They had time for personal tasks on their day off", "They worked from home", "Their managers watched them", "They had longer breaks"], answer: 0 },
      { q: "What is the director's opinion?", options: ["Every company should adopt it", "It was a failure", "It suits some companies but not all", "It only works in healthcare"], answer: 2 },
    ],
  },
];
