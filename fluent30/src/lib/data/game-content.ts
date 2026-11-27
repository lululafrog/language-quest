// Curated content banks for the mini-games (natural spoken English, French glosses & explanations).

/** Concrete nouns with an emoji, used ONLY as an honest fallback when no card illustrations exist yet. */
export const EMOJI_NOUNS: { en: string; fr: string; emoji: string }[] = [
  { en: "apple", fr: "pomme", emoji: "🍎" }, { en: "bread", fr: "pain", emoji: "🍞" }, { en: "cheese", fr: "fromage", emoji: "🧀" },
  { en: "coffee", fr: "café", emoji: "☕" }, { en: "egg", fr: "œuf", emoji: "🥚" }, { en: "fish", fr: "poisson", emoji: "🐟" },
  { en: "dog", fr: "chien", emoji: "🐕" }, { en: "cat", fr: "chat", emoji: "🐈" }, { en: "horse", fr: "cheval", emoji: "🐎" },
  { en: "bird", fr: "oiseau", emoji: "🐦" }, { en: "tree", fr: "arbre", emoji: "🌳" }, { en: "flower", fr: "fleur", emoji: "🌸" },
  { en: "sun", fr: "soleil", emoji: "☀️" }, { en: "moon", fr: "lune", emoji: "🌙" }, { en: "rain", fr: "pluie", emoji: "🌧️" },
  { en: "snow", fr: "neige", emoji: "❄️" }, { en: "house", fr: "maison", emoji: "🏠" }, { en: "car", fr: "voiture", emoji: "🚗" },
  { en: "bike", fr: "vélo", emoji: "🚲" }, { en: "train", fr: "train", emoji: "🚆" }, { en: "plane", fr: "avion", emoji: "✈️" },
  { en: "boat", fr: "bateau", emoji: "⛵" }, { en: "key", fr: "clé", emoji: "🔑" }, { en: "book", fr: "livre", emoji: "📖" },
  { en: "phone", fr: "téléphone", emoji: "📱" }, { en: "clock", fr: "horloge", emoji: "🕰️" }, { en: "chair", fr: "chaise", emoji: "🪑" },
  { en: "bed", fr: "lit", emoji: "🛏️" }, { en: "door", fr: "porte", emoji: "🚪" }, { en: "umbrella", fr: "parapluie", emoji: "☂️" },
  { en: "shoe", fr: "chaussure", emoji: "👟" }, { en: "hat", fr: "chapeau", emoji: "🎩" }, { en: "glasses", fr: "lunettes", emoji: "👓" },
  { en: "money", fr: "argent", emoji: "💵" }, { en: "gift", fr: "cadeau", emoji: "🎁" }, { en: "ball", fr: "ballon", emoji: "⚽" },
  { en: "mountain", fr: "montagne", emoji: "⛰️" }, { en: "beach", fr: "plage", emoji: "🏖️" }, { en: "heart", fr: "cœur", emoji: "❤️" },
  { en: "hand", fr: "main", emoji: "✋" }, { en: "eye", fr: "œil", emoji: "👁️" }, { en: "ear", fr: "oreille", emoji: "👂" },
  { en: "doctor", fr: "médecin", emoji: "🧑‍⚕️" }, { en: "ticket", fr: "billet", emoji: "🎫" }, { en: "suitcase", fr: "valise", emoji: "🧳" },
  { en: "map", fr: "carte", emoji: "🗺️" }, { en: "bottle", fr: "bouteille", emoji: "🍾" }, { en: "knife", fr: "couteau", emoji: "🔪" },
];

/** Phrasal verbs: `sentence` contains the full phrasal verb; `blank` hides the particle(s). */
export const PHRASAL_BANK: { pv: string; fr: string; sentence: string; sentenceFr: string; particle: string; level: 1 | 2 | 3 }[] = [
  { pv: "get up", fr: "se lever", sentence: "I usually get up at seven.", sentenceFr: "Je me lève d'habitude à sept heures.", particle: "up", level: 1 },
  { pv: "wake up", fr: "se réveiller", sentence: "I woke up in the middle of the night.", sentenceFr: "Je me suis réveillé au milieu de la nuit.", particle: "up", level: 1 },
  { pv: "sit down", fr: "s'asseoir", sentence: "Please sit down and relax.", sentenceFr: "Assieds-toi et détends-toi.", particle: "down", level: 1 },
  { pv: "turn on", fr: "allumer", sentence: "Can you turn on the light?", sentenceFr: "Tu peux allumer la lumière ?", particle: "on", level: 1 },
  { pv: "turn off", fr: "éteindre", sentence: "Don't forget to turn off the oven.", sentenceFr: "N'oublie pas d'éteindre le four.", particle: "off", level: 1 },
  { pv: "come back", fr: "revenir", sentence: "When are you coming back?", sentenceFr: "Quand est-ce que tu reviens ?", particle: "back", level: 1 },
  { pv: "go out", fr: "sortir", sentence: "Do you want to go out tonight?", sentenceFr: "Tu veux sortir ce soir ?", particle: "out", level: 1 },
  { pv: "look for", fr: "chercher", sentence: "I'm looking for my keys.", sentenceFr: "Je cherche mes clés.", particle: "for", level: 1 },
  { pv: "put on", fr: "mettre (un vêtement)", sentence: "Put on your coat, it's cold.", sentenceFr: "Mets ton manteau, il fait froid.", particle: "on", level: 1 },
  { pv: "take off", fr: "enlever ; décoller", sentence: "The plane took off on time.", sentenceFr: "L'avion a décollé à l'heure.", particle: "off", level: 2 },
  { pv: "give up", fr: "abandonner, arrêter", sentence: "Don't give up, you're almost there!", sentenceFr: "N'abandonne pas, tu y es presque !", particle: "up", level: 2 },
  { pv: "find out", fr: "découvrir, apprendre", sentence: "I found out the truth yesterday.", sentenceFr: "J'ai découvert la vérité hier.", particle: "out", level: 2 },
  { pv: "look after", fr: "s'occuper de", sentence: "Can you look after my dog this weekend?", sentenceFr: "Tu peux t'occuper de mon chien ce week-end ?", particle: "after", level: 2 },
  { pv: "get along (with)", fr: "bien s'entendre (avec)", sentence: "I get along really well with my sister.", sentenceFr: "Je m'entends vraiment bien avec ma sœur.", particle: "along", level: 2 },
  { pv: "pick up", fr: "aller chercher ; ramasser", sentence: "I'll pick you up at the station.", sentenceFr: "Je viendrai te chercher à la gare.", particle: "up", level: 2 },
  { pv: "run out (of)", fr: "manquer de, être à court de", sentence: "We've run out of milk.", sentenceFr: "On n'a plus de lait.", particle: "out", level: 2 },
  { pv: "figure out", fr: "comprendre, trouver", sentence: "I can't figure out how this works.", sentenceFr: "Je n'arrive pas à comprendre comment ça marche.", particle: "out", level: 2 },
  { pv: "hang out", fr: "traîner, passer du temps", sentence: "We hung out at the beach all afternoon.", sentenceFr: "On a traîné à la plage tout l'après-midi.", particle: "out", level: 2 },
  { pv: "show up", fr: "se pointer, arriver", sentence: "He showed up two hours late.", sentenceFr: "Il est arrivé avec deux heures de retard.", particle: "up", level: 2 },
  { pv: "call off", fr: "annuler", sentence: "They called off the meeting.", sentenceFr: "Ils ont annulé la réunion.", particle: "off", level: 3 },
  { pv: "put off", fr: "reporter, remettre à plus tard", sentence: "Stop putting off your homework!", sentenceFr: "Arrête de repousser tes devoirs !", particle: "off", level: 3 },
  { pv: "come up with", fr: "trouver (une idée)", sentence: "She came up with a brilliant idea.", sentenceFr: "Elle a eu une idée brillante.", particle: "up with", level: 3 },
  { pv: "look forward to", fr: "avoir hâte de", sentence: "I'm looking forward to seeing you.", sentenceFr: "J'ai hâte de te voir.", particle: "forward to", level: 3 },
  { pv: "break up", fr: "rompre", sentence: "They broke up after five years.", sentenceFr: "Ils ont rompu après cinq ans.", particle: "up", level: 3 },
  { pv: "catch up", fr: "rattraper ; prendre des nouvelles", sentence: "Let's grab a coffee and catch up.", sentenceFr: "Prenons un café pour se raconter les nouvelles.", particle: "up", level: 3 },
  { pv: "turn down", fr: "refuser ; baisser (le son)", sentence: "She turned down the job offer.", sentenceFr: "Elle a refusé l'offre d'emploi.", particle: "down", level: 3 },
  { pv: "work out", fr: "faire du sport ; trouver une solution", sentence: "I work out three times a week.", sentenceFr: "Je fais du sport trois fois par semaine.", particle: "out", level: 3 },
  { pv: "set off", fr: "partir, se mettre en route", sentence: "We set off early to avoid the traffic.", sentenceFr: "On est partis tôt pour éviter les bouchons.", particle: "off", level: 3 },
];
export const PARTICLES = ["up", "down", "on", "off", "out", "in", "back", "away", "for", "after", "along", "over", "up with", "forward to"];

export type TenseId =
  | "present-simple" | "present-continuous" | "past-simple" | "past-continuous" | "present-perfect"
  | "present-perfect-continuous" | "past-perfect" | "future-will" | "going-to" | "conditional";

export const TENSE_LABELS: Record<TenseId, string> = {
  "present-simple": "Present Simple", "present-continuous": "Present Continuous", "past-simple": "Past Simple",
  "past-continuous": "Past Continuous", "present-perfect": "Present Perfect", "present-perfect-continuous": "Present Perfect Continuous",
  "past-perfect": "Past Perfect", "future-will": "Future (will)", "going-to": "Be going to", conditional: "Conditional (would)",
};

export const TENSE_BANK: { s: string; fr: string; tense: TenseId; why: string; level: 1 | 2 | 3 }[] = [
  { s: "She works in a bank.", fr: "Elle travaille dans une banque.", tense: "present-simple", why: "Fait permanent / habitude.", level: 1 },
  { s: "I'm cooking dinner right now.", fr: "Je suis en train de préparer le dîner.", tense: "present-continuous", why: "Action en cours au moment où l'on parle (right now).", level: 1 },
  { s: "We went to Rome last summer.", fr: "On est allés à Rome l'été dernier.", tense: "past-simple", why: "Action terminée à un moment précis du passé (last summer).", level: 1 },
  { s: "I'll call you tomorrow.", fr: "Je t'appellerai demain.", tense: "future-will", why: "Décision ou promesse spontanée sur le futur.", level: 1 },
  { s: "They're going to buy a house.", fr: "Ils vont acheter une maison.", tense: "going-to", why: "Projet déjà décidé.", level: 1 },
  { s: "He doesn't eat meat.", fr: "Il ne mange pas de viande.", tense: "present-simple", why: "Habitude, forme négative avec doesn't.", level: 1 },
  { s: "I've never been to Japan.", fr: "Je ne suis jamais allé au Japon.", tense: "present-perfect", why: "Expérience de vie, sans date précise (never).", level: 2 },
  { s: "I was having a shower when you called.", fr: "J'étais sous la douche quand tu as appelé.", tense: "past-continuous", why: "Action en cours dans le passé, interrompue par une autre.", level: 2 },
  { s: "She has just left.", fr: "Elle vient de partir.", tense: "present-perfect", why: "Action très récente avec un lien au présent (just).", level: 2 },
  { s: "Look at those clouds! It's going to rain.", fr: "Regarde ces nuages ! Il va pleuvoir.", tense: "going-to", why: "Prédiction fondée sur un indice présent.", level: 2 },
  { s: "Did you see the match last night?", fr: "Tu as vu le match hier soir ?", tense: "past-simple", why: "Question sur un moment passé précis (last night).", level: 2 },
  { s: "What are you doing this weekend?", fr: "Tu fais quoi ce week-end ?", tense: "present-continuous", why: "Projet futur déjà organisé.", level: 2 },
  { s: "I've been waiting for an hour.", fr: "J'attends depuis une heure.", tense: "present-perfect-continuous", why: "Action commencée dans le passé qui dure encore (for an hour). En français : présent + depuis.", level: 3 },
  { s: "When we arrived, the film had already started.", fr: "Quand nous sommes arrivés, le film avait déjà commencé.", tense: "past-perfect", why: "Action antérieure à une autre action passée.", level: 3 },
  { s: "If I had more time, I would travel more.", fr: "Si j'avais plus de temps, je voyagerais plus.", tense: "conditional", why: "Situation hypothétique (would + base verbale).", level: 3 },
  { s: "We've lived here since 2015.", fr: "Nous habitons ici depuis 2015.", tense: "present-perfect", why: "Situation qui dure jusqu'à maintenant (since). Le français utilise le présent.", level: 3 },
  { s: "She's been learning English for two years.", fr: "Elle apprend l'anglais depuis deux ans.", tense: "present-perfect-continuous", why: "Activité en cours depuis une durée (for two years).", level: 3 },
  { s: "I would love to come, but I'm busy.", fr: "J'adorerais venir, mais je suis occupé.", tense: "conditional", why: "Souhait poli avec would.", level: 3 },
  { s: "He had never seen the sea before that trip.", fr: "Il n'avait jamais vu la mer avant ce voyage.", tense: "past-perfect", why: "Expérience antérieure à un moment passé.", level: 3 },
  { s: "While I was walking home, it started to snow.", fr: "Pendant que je rentrais à pied, il a commencé à neiger.", tense: "past-continuous", why: "Action de fond dans le passé (while).", level: 3 },
];

/** Typical French-speaker mistakes. `alt` is another plausible wrong version for multiple choice. */
export const ERROR_BANK: { wrong: string; right: string; alt: string; why: string; label: string; level: 1 | 2 | 3 }[] = [
  { wrong: "I have 25 years.", right: "I'm 25.", alt: "I am 25 years.", why: "L'âge se dit avec be : I'm 25 (years old).", label: "L'âge avec be", level: 1 },
  { wrong: "She don't like coffee.", right: "She doesn't like coffee.", alt: "She not like coffee.", why: "À la 3e personne du singulier : doesn't.", label: "doesn't à la 3e personne", level: 1 },
  { wrong: "He work in London.", right: "He works in London.", alt: "He working in London.", why: "Present Simple : -s à la 3e personne (he/she/it).", label: "-s de la 3e personne", level: 1 },
  { wrong: "I am agree with you.", right: "I agree with you.", alt: "I am agreed with you.", why: "Agree est un verbe : pas de be.", label: "agree sans be", level: 1 },
  { wrong: "Where you live?", right: "Where do you live?", alt: "Where you are living?", why: "Les questions au Present Simple ont besoin de do/does.", label: "Questions avec do", level: 1 },
  { wrong: "I didn't went to school.", right: "I didn't go to school.", alt: "I not went to school.", why: "Après did / didn't, le verbe reste à la base verbale.", label: "did + base verbale", level: 1 },
  { wrong: "It depends of the weather.", right: "It depends on the weather.", alt: "It depends from the weather.", why: "Depend on (et non of).", label: "depend on", level: 2 },
  { wrong: "I'm living here since 2019.", right: "I've been living here since 2019.", alt: "I live here since 2019.", why: "Depuis + durée jusqu'à maintenant : Present Perfect (Continuous), pas le présent.", label: "since/for + Present Perfect", level: 2 },
  { wrong: "I saw this film yesterday night.", right: "I saw this film last night.", alt: "I saw this film the last night.", why: "Hier soir = last night.", label: "last night", level: 2 },
  { wrong: "Can you explain me the problem?", right: "Can you explain the problem to me?", alt: "Can you explain to me me the problem?", why: "Explain something to someone (pas explain me).", label: "explain sth to sb", level: 2 },
  { wrong: "I have seen him yesterday.", right: "I saw him yesterday.", alt: "I have saw him yesterday.", why: "Avec un moment passé précis (yesterday) : Past Simple.", label: "Past Simple vs Present Perfect", level: 2 },
  { wrong: "The people is very friendly.", right: "The people are very friendly.", alt: "The peoples is very friendly.", why: "People est un pluriel : are.", label: "people = pluriel", level: 2 },
  { wrong: "I'm used to wake up early.", right: "I'm used to waking up early.", alt: "I used to waking up early.", why: "Be used to + -ing (= être habitué à).", label: "be used to + -ing", level: 3 },
  { wrong: "If I will see him, I'll tell him.", right: "If I see him, I'll tell him.", alt: "If I would see him, I'll tell him.", why: "Pas de will après if : présent dans la subordonnée.", label: "if + présent", level: 3 },
  { wrong: "He said me that he was tired.", right: "He told me that he was tired.", alt: "He said to me he is tired.", why: "Tell someone / say something (to someone).", label: "say vs tell", level: 3 },
  { wrong: "I look forward to see you.", right: "I look forward to seeing you.", alt: "I look forward see you.", why: "Look forward to + -ing (to est une préposition).", label: "look forward to + -ing", level: 3 },
  { wrong: "She is more taller than me.", right: "She is taller than me.", alt: "She is most tall than me.", why: "Comparatif court : -er sans more.", label: "comparatifs", level: 2 },
  { wrong: "I must to go now.", right: "I must go now.", alt: "I must going now.", why: "Après un modal (must, can, should…) : base verbale sans to.", label: "modal + base verbale", level: 1 },
  { wrong: "I need an information.", right: "I need some information.", alt: "I need informations.", why: "Information est indénombrable : some information.", label: "indénombrables", level: 3 },
  { wrong: "Actually, I live in Paris, but next year I'm moving.", right: "At the moment, I live in Paris, but next year I'm moving.", alt: "Currently, I am live in Paris, but next year I'm moving.", why: "Faux ami : actually = en fait. « Actuellement » = at the moment / currently.", label: "faux ami actually", level: 3 },
];

/** Gap-fill sentences (grammar & collocations). */
export const GAPFILL_BANK: { s: string; answer: string; choices: string[]; fr: string; why: string; level: 1 | 2 | 3 }[] = [
  { s: "I ___ coffee every morning.", answer: "drink", choices: ["drink", "drinks", "drinking", "am drink"], fr: "Je bois du café tous les matins.", why: "Present Simple, sujet I : base verbale.", level: 1 },
  { s: "She ___ to work by bus.", answer: "goes", choices: ["goes", "go", "going", "is go"], fr: "Elle va au travail en bus.", why: "3e personne : goes.", level: 1 },
  { s: "There ___ a lot of people at the party.", answer: "were", choices: ["were", "was", "is", "have"], fr: "Il y avait beaucoup de monde à la fête.", why: "People est pluriel : there were.", level: 1 },
  { s: "I'm really ___ in history.", answer: "interested", choices: ["interested", "interesting", "interest", "interests"], fr: "Je m'intéresse beaucoup à l'histoire.", why: "-ed = ce que l'on ressent ; -ing = ce qui provoque le sentiment.", level: 1 },
  { s: "Can you ___ me a favour?", answer: "do", choices: ["do", "make", "give", "take"], fr: "Tu peux me rendre un service ?", why: "Collocation : do someone a favour.", level: 1 },
  { s: "Let's ___ a break.", answer: "take", choices: ["take", "make", "do", "have got"], fr: "Faisons une pause.", why: "Collocation : take a break.", level: 1 },
  { s: "I've lived here ___ ten years.", answer: "for", choices: ["for", "since", "during", "from"], fr: "J'habite ici depuis dix ans.", why: "For + durée ; since + point de départ.", level: 2 },
  { s: "I've lived here ___ 2016.", answer: "since", choices: ["since", "for", "from", "during"], fr: "J'habite ici depuis 2016.", why: "Since + point de départ.", level: 2 },
  { s: "Have you finished ___?", answer: "yet", choices: ["yet", "already", "still", "just"], fr: "Tu as déjà fini ?", why: "Yet en fin de question ou de phrase négative.", level: 2 },
  { s: "I ___ my keys. I can't find them anywhere.", answer: "have lost", choices: ["have lost", "lost", "lose", "am losing"], fr: "J'ai perdu mes clés. Je ne les trouve nulle part.", why: "Conséquence présente : Present Perfect.", level: 2 },
  { s: "We ___ make a mistake again. Be careful!", answer: "mustn't", choices: ["mustn't", "don't have to", "needn't", "can"], fr: "On ne doit pas refaire d'erreur. Fais attention !", why: "Mustn't = interdiction ; don't have to = pas obligatoire.", level: 2 },
  { s: "You ___ see a doctor about that cough.", answer: "should", choices: ["should", "would", "must to", "will to"], fr: "Tu devrais voir un médecin pour cette toux.", why: "Conseil : should.", level: 2 },
  { s: "When I was a kid, I ___ play outside all day.", answer: "used to", choices: ["used to", "use to", "am used to", "was used"], fr: "Quand j'étais petit, je jouais dehors toute la journée.", why: "Habitude passée : used to + base verbale.", level: 3 },
  { s: "If I ___ you, I'd take the job.", answer: "were", choices: ["were", "am", "will be", "would be"], fr: "Si j'étais toi, je prendrais le poste.", why: "Conditionnel 2 : if I were you.", level: 3 },
  { s: "The museum ___ built in 1890.", answer: "was", choices: ["was", "is", "has", "did"], fr: "Le musée a été construit en 1890.", why: "Voix passive au passé : was + participe passé.", level: 3 },
  { s: "She asked me where I ___.", answer: "lived", choices: ["lived", "do live", "did live", "live I"], fr: "Elle m'a demandé où j'habitais.", why: "Discours rapporté : pas d'inversion, concordance des temps.", level: 3 },
  { s: "I'm not used to ___ on the left.", answer: "driving", choices: ["driving", "drive", "drove", "to drive"], fr: "Je n'ai pas l'habitude de conduire à gauche.", why: "Be used to + -ing.", level: 3 },
  { s: "It's ___ hot to go running.", answer: "too", choices: ["too", "very", "enough", "so much"], fr: "Il fait trop chaud pour aller courir.", why: "Too + adjectif + to = trop … pour.", level: 2 },
];

/** Sentences for reconstruction and dictation. */
export const SENTENCE_BANK: { en: string; fr: string; level: 1 | 2 | 3 }[] = [
  { en: "Where do you live?", fr: "Où habites-tu ?", level: 1 },
  { en: "I don't know what to say.", fr: "Je ne sais pas quoi dire.", level: 1 },
  { en: "Can I have the bill, please?", fr: "Je peux avoir l'addition, s'il vous plaît ?", level: 1 },
  { en: "What time is it?", fr: "Quelle heure est-il ?", level: 1 },
  { en: "I'm looking for the train station.", fr: "Je cherche la gare.", level: 1 },
  { en: "How long have you been here?", fr: "Depuis combien de temps es-tu ici ?", level: 2 },
  { en: "Do you mind if I sit here?", fr: "Ça vous dérange si je m'assois ici ?", level: 2 },
  { en: "I've never been to New York.", fr: "Je ne suis jamais allé à New York.", level: 2 },
  { en: "What are you up to this weekend?", fr: "Qu'est-ce que tu fais ce week-end ?", level: 2 },
  { en: "It's not as easy as it looks.", fr: "Ce n'est pas aussi facile que ça en a l'air.", level: 2 },
  { en: "I would have called you if I had known.", fr: "Je t'aurais appelé si j'avais su.", level: 3 },
  { en: "She's been working here for three years.", fr: "Elle travaille ici depuis trois ans.", level: 3 },
  { en: "I'm not sure it's worth it.", fr: "Je ne suis pas sûr que ça en vaille la peine.", level: 3 },
  { en: "You should have told me earlier.", fr: "Tu aurais dû me le dire plus tôt.", level: 3 },
  { en: "Let me know if you need anything.", fr: "Dis-moi si tu as besoin de quoi que ce soit.", level: 2 },
  { en: "I can't wait to see you again.", fr: "J'ai hâte de te revoir.", level: 2 },
];

export const SYNONYM_BANK: { w: string; syn: string; fr: string; level: 1 | 2 | 3 }[] = [
  { w: "big", syn: "large", fr: "grand", level: 1 }, { w: "small", syn: "little", fr: "petit", level: 1 },
  { w: "happy", syn: "glad", fr: "content", level: 1 }, { w: "begin", syn: "start", fr: "commencer", level: 1 },
  { w: "fast", syn: "quick", fr: "rapide", level: 1 }, { w: "buy", syn: "purchase", fr: "acheter", level: 2 },
  { w: "maybe", syn: "perhaps", fr: "peut-être", level: 1 }, { w: "hard", syn: "difficult", fr: "difficile", level: 1 },
  { w: "help", syn: "assist", fr: "aider", level: 2 }, { w: "tired", syn: "exhausted", fr: "fatigué", level: 2 },
  { w: "angry", syn: "mad", fr: "en colère", level: 2 }, { w: "funny", syn: "hilarious", fr: "drôle", level: 2 },
  { w: "smart", syn: "clever", fr: "intelligent", level: 1 }, { w: "scared", syn: "afraid", fr: "effrayé", level: 1 },
  { w: "rich", syn: "wealthy", fr: "riche", level: 2 }, { w: "choose", syn: "pick", fr: "choisir", level: 2 },
  { w: "important", syn: "significant", fr: "important", level: 3 }, { w: "enough", syn: "sufficient", fr: "assez", level: 3 },
  { w: "show", syn: "demonstrate", fr: "montrer", level: 3 }, { w: "often", syn: "frequently", fr: "souvent", level: 2 },
  { w: "strange", syn: "weird", fr: "bizarre", level: 2 }, { w: "awful", syn: "terrible", fr: "affreux", level: 2 },
  { w: "get", syn: "obtain", fr: "obtenir", level: 3 }, { w: "need", syn: "require", fr: "avoir besoin de", level: 3 },
];

/** Verbs with all forms, verified spelling (used by the conjugation game). `c` works with every template. */
export const CONJ_VERBS: { base: string; third: string; past: string; pp: string; ing: string; fr: string; c: string }[] = [
  { base: "work", third: "works", past: "worked", pp: "worked", ing: "working", fr: "travailler", c: "from home" },
  { base: "play", third: "plays", past: "played", pp: "played", ing: "playing", fr: "jouer", c: "tennis" },
  { base: "study", third: "studies", past: "studied", pp: "studied", ing: "studying", fr: "étudier", c: "Spanish" },
  { base: "watch", third: "watches", past: "watched", pp: "watched", ing: "watching", fr: "regarder", c: "the news" },
  { base: "try", third: "tries", past: "tried", pp: "tried", ing: "trying", fr: "essayer", c: "new recipes" },
  { base: "stop", third: "stops", past: "stopped", pp: "stopped", ing: "stopping", fr: "s'arrêter", c: "at the bakery" },
  { base: "travel", third: "travels", past: "travelled", pp: "travelled", ing: "travelling", fr: "voyager", c: "by train" },
  { base: "cook", third: "cooks", past: "cooked", pp: "cooked", ing: "cooking", fr: "cuisiner", c: "Italian food" },
  { base: "go", third: "goes", past: "went", pp: "gone", ing: "going", fr: "aller", c: "to the gym" },
  { base: "eat", third: "eats", past: "ate", pp: "eaten", ing: "eating", fr: "manger", c: "sushi" },
  { base: "drink", third: "drinks", past: "drank", pp: "drunk", ing: "drinking", fr: "boire", c: "green tea" },
  { base: "write", third: "writes", past: "wrote", pp: "written", ing: "writing", fr: "écrire", c: "emails" },
  { base: "swim", third: "swims", past: "swam", pp: "swum", ing: "swimming", fr: "nager", c: "in the sea" },
  { base: "run", third: "runs", past: "ran", pp: "run", ing: "running", fr: "courir", c: "in the park" },
  { base: "take", third: "takes", past: "took", pp: "taken", ing: "taking", fr: "prendre", c: "the bus" },
  { base: "make", third: "makes", past: "made", pp: "made", ing: "making", fr: "faire", c: "pancakes" },
  { base: "do", third: "does", past: "did", pp: "done", ing: "doing", fr: "faire", c: "yoga" },
  { base: "have", third: "has", past: "had", pp: "had", ing: "having", fr: "avoir, prendre", c: "lunch outside" },
  { base: "read", third: "reads", past: "read", pp: "read", ing: "reading", fr: "lire", c: "comics" },
  { base: "speak", third: "speaks", past: "spoke", pp: "spoken", ing: "speaking", fr: "parler", c: "English at work" },
  { base: "buy", third: "buys", past: "bought", pp: "bought", ing: "buying", fr: "acheter", c: "fresh bread" },
  { base: "fly", third: "flies", past: "flew", pp: "flown", ing: "flying", fr: "voyager en avion", c: "to Dublin" },
  { base: "drive", third: "drives", past: "drove", pp: "driven", ing: "driving", fr: "conduire", c: "to work" },
  { base: "sleep", third: "sleeps", past: "slept", pp: "slept", ing: "sleeping", fr: "dormir", c: "in a tent" },
  { base: "listen", third: "listens", past: "listened", pp: "listened", ing: "listening", fr: "écouter", c: "to podcasts" },
  { base: "dance", third: "dances", past: "danced", pp: "danced", ing: "dancing", fr: "danser", c: "salsa" },
];

export const CONJ_TEMPLATES: { id: string; label: string; s: (c: string, base: string) => string; form: "third" | "past" | "pp" | "ing" | "base"; hint: string; level: 1 | 2 | 3 }[] = [
  { id: "ps3", label: "Present Simple (3e pers.)", s: (c, b) => `She ___ (${b}) ${c} every week.`, form: "third", hint: "he/she/it → -s / -es / -ies", level: 1 },
  { id: "q", label: "Question (does)", s: (c, b) => `Does he ___ (${b}) ${c}?`, form: "base", hint: "Après does : base verbale", level: 1 },
  { id: "past", label: "Past Simple", s: (c, b) => `Last weekend, we ___ (${b}) ${c}.`, form: "past", hint: "Prétérit (régulier -ed ou irrégulier)", level: 1 },
  { id: "cont", label: "Present Continuous", s: (c, b) => `Right now, they're ___ (${b}) ${c}.`, form: "ing", hint: "be + -ing", level: 2 },
  { id: "pp", label: "Present Perfect", s: (c, b) => `I've never ___ (${b}) ${c}.`, form: "pp", hint: "have + participe passé", level: 2 },
  { id: "neg", label: "Négation passée", s: (c, b) => `He didn't ___ (${b}) ${c}.`, form: "base", hint: "Après didn't : base verbale", level: 2 },
  { id: "ppc", label: "Present Perfect Continuous", s: (c, b) => `She's been ___ (${b}) ${c} since January.`, form: "ing", hint: "have been + -ing", level: 3 },
  { id: "pastperf", label: "Past Perfect", s: (c, b) => `By then, he had already ___ (${b}) ${c}.`, form: "pp", hint: "had + participe passé", level: 3 },
];

/** Most useful irregular verbs first (others come at higher levels). */
export const COMMON_IRREGULAR = ["be", "have", "do", "go", "get", "make", "take", "come", "see", "know", "think", "say", "tell", "give", "find", "feel", "leave", "put", "keep", "let", "begin", "bring", "buy", "eat", "drink", "write", "speak", "read", "meet", "pay", "sleep", "run", "send", "sit", "stand", "understand", "lose", "spend", "forget", "drive"];
