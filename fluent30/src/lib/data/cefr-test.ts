// Fluent30 — full CEFR level test content (original items written for Fluent30).
// Structure follows skill-by-skill CEFR assessment practice: each skill gets its own level.

export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type Level = (typeof LEVELS)[number];

export interface GvItem {
  q: string; // sentence with ___ or a question
  options: string[];
  answer: number;
  why: string; // French explanation
}

/** Grammar & vocabulary: 6 items per level (5 are drawn per block). */
export const GV_ITEMS: Record<Level, GvItem[]> = {
  A1: [
    { q: "My sister ___ two children.", options: ["have", "has", "is", "are"], answer: 1, why: "3e personne du singulier : has." },
    { q: "___ is your name?", options: ["Who", "How", "What", "Where"], answer: 2, why: "« Comment t'appelles-tu ? » = What is your name?" },
    { q: "We ___ from France.", options: ["is", "am", "are", "be"], answer: 2, why: "we are." },
    { q: "There ___ a cat in the garden.", options: ["is", "are", "have", "has"], answer: 0, why: "There is + singulier." },
    { q: "I get up ___ seven o'clock.", options: ["in", "on", "at", "to"], answer: 2, why: "at + heure." },
    { q: "Which word is a colour?", options: ["chair", "green", "happy", "slowly"], answer: 1, why: "green = vert." },
  ],
  A2: [
    { q: "I ___ to the cinema last weekend.", options: ["go", "went", "have gone", "am going"], answer: 1, why: "Moment passé terminé (last weekend) : past simple." },
    { q: "She can't come because she ___ a cold.", options: ["has got", "is having", "have", "having"], answer: 0, why: "has got = a (possession, maladie)." },
    { q: "This is the ___ restaurant in town.", options: ["better", "good", "best", "most good"], answer: 2, why: "Superlatif de good : the best." },
    { q: "How ___ money do you need?", options: ["many", "much", "lot", "few"], answer: 1, why: "money est indénombrable : how much." },
    { q: "We're going to ___ a party on Saturday.", options: ["make", "do", "have", "take"], answer: 2, why: "Collocation : have a party." },
    { q: "\"Would you like a drink?\" — \"___\"", options: ["Yes, I would like.", "Yes, please.", "Yes, I like.", "Yes, I want it please."], answer: 1, why: "Réponse naturelle et polie : Yes, please." },
  ],
  B1: [
    { q: "I've known Sarah ___ we were at school.", options: ["for", "since", "during", "from"], answer: 1, why: "since + point de départ." },
    { q: "If I ___ you, I'd talk to him.", options: ["am", "was", "were", "would be"], answer: 2, why: "Conseil hypothétique : If I were you." },
    { q: "The museum ___ in 1902.", options: ["built", "was built", "has built", "is building"], answer: 1, why: "Passif au passé." },
    { q: "I'm really looking forward to ___ you.", options: ["see", "seeing", "have seen", "saw"], answer: 1, why: "look forward to + -ing." },
    { q: "Can you ___ my cat while I'm away?", options: ["look after", "look for", "look up", "look into"], answer: 0, why: "look after = s'occuper de." },
    { q: "She asked me where ___.", options: ["did I live", "I lived", "do I live", "I do live"], answer: 1, why: "Question indirecte : pas d'inversion." },
  ],
  B2: [
    { q: "By the time we got there, the concert ___.", options: ["already started", "has already started", "had already started", "was already starting"], answer: 2, why: "Antériorité dans le passé : past perfect." },
    { q: "I wish I ___ so much last night — I've got a headache.", options: ["didn't drink", "hadn't drunk", "wouldn't drink", "don't drink"], answer: 1, why: "Regret sur le passé : wish + past perfect." },
    { q: "He's very good at ___ people feel at ease.", options: ["doing", "making", "letting", "getting"], answer: 1, why: "make someone feel = faire en sorte que quelqu'un se sente." },
    { q: "The meeting has been ___ until next week.", options: ["put off", "put out", "put up", "put on"], answer: 0, why: "put off = reporter." },
    { q: "___ the bad weather, the match went ahead.", options: ["Although", "Despite", "However", "Even"], answer: 1, why: "Despite + nom ; although + proposition." },
    { q: "You ___ have told me! I'd have helped you.", options: ["must", "should", "would", "can"], answer: 1, why: "Reproche sur le passé : should have + participe." },
  ],
  C1: [
    { q: "Not until I read the letter ___ how serious the situation was.", options: ["I realised", "did I realise", "I did realise", "had I realised it"], answer: 1, why: "Inversion après « Not until… » en tête de phrase." },
    { q: "She's highly regarded, ___ her critics would have you believe.", options: ["whatever", "despite what", "however", "no matter"], answer: 1, why: "despite what + proposition = contrairement à ce que." },
    { q: "The new policy is bound to ___ some resistance from staff.", options: ["meet with", "meet up", "come across", "run into with"], answer: 0, why: "meet with resistance = rencontrer une opposition." },
    { q: "Had they left earlier, they ___ the traffic.", options: ["would avoid", "would have avoided", "had avoided", "will have avoided"], answer: 1, why: "Conditionnel 3 avec inversion (Had they = If they had)." },
    { q: "His explanation didn't really ___ — nobody believed him.", options: ["hold water", "keep water", "carry weight", "stand point"], answer: 0, why: "Idiome : hold water = tenir la route." },
    { q: "It's high time we ___ a decision.", options: ["make", "made", "will make", "have made"], answer: 1, why: "It's (high) time + prétérit." },
  ],
  C2: [
    { q: "The report was, ___, a damning indictment of the board's conduct.", options: ["to all intents and purposes", "for all purposes and intents", "at all intents", "in all purposes"], answer: 0, why: "Expression figée : to all intents and purposes = en pratique." },
    { q: "Little ___ that his every move was being recorded.", options: ["he knew", "did he know", "he did know", "knew he"], answer: 1, why: "Inversion après « Little » (registre soutenu)." },
    { q: "Her argument, though ___ at first glance, falls apart under scrutiny.", options: ["specious", "spacious", "speculative", "spurious-like"], answer: 0, why: "specious = séduisant mais trompeur." },
    { q: "We were left ___ for words by his audacity.", options: ["lost", "at a loss", "short", "without"], answer: 1, why: "at a loss for words = ne pas savoir quoi dire." },
    { q: "Were the government ___ the measure, the backlash would be considerable.", options: ["to implement", "implementing", "implemented", "having implement"], answer: 0, why: "Hypothèse formelle : Were + sujet + to + base verbale." },
    { q: "He has a tendency to ___ the issue whenever he's asked about it.", options: ["skirt around", "skirt over", "dress around", "go about with"], answer: 0, why: "skirt around an issue = éluder une question." },
  ],
};

export interface Passage {
  level: Level;
  title: string;
  text: string;
  questions: { q: string; options: string[]; answer: number }[];
}

export const READING: Record<Level, Passage> = {
  A1: {
    level: "A1", title: "A message from Tom",
    text: "Hi Anna! I'm at the café near the station. It's next to the bank. I have a blue jacket and a black bag. I'm here at 3 o'clock. See you soon! Tom",
    questions: [
      { q: "Where is Tom?", options: ["At the bank", "At a café", "At home", "At the station"], answer: 1 },
      { q: "What colour is his jacket?", options: ["Black", "Blue", "Green", "Red"], answer: 1 },
      { q: "What time is he there?", options: ["At 2", "At 3", "At 4", "At 13"], answer: 1 },
    ],
  },
  A2: {
    level: "A2", title: "The new neighbours",
    text: "Last month a young family moved into the flat below ours. At first we were worried because they have two small children and a dog, and our building isn't very big. But they are very friendly. Last Saturday they invited us for lunch, and the father cooked an amazing curry. Their son, who is six, showed me all his drawings. Now we sometimes look after the dog when they go away for the weekend.",
    questions: [
      { q: "Why were the writer's family worried at first?", options: ["The neighbours were rude", "The family might be noisy in a small building", "The dog was dangerous", "The flat was expensive"], answer: 1 },
      { q: "What happened last Saturday?", options: ["The neighbours moved in", "The writer cooked a curry", "The writer had lunch with the neighbours", "The dog ran away"], answer: 2 },
      { q: "What does the writer do now?", options: ["Takes care of the dog sometimes", "Teaches the boy to draw", "Cooks for the neighbours", "Goes away every weekend"], answer: 0 },
    ],
  },
  B1: {
    level: "B1", title: "Learning to say no",
    text: "For years, Jess said yes to everything: extra work, favours for friends, weekend events she didn't even enjoy. \"I thought people would like me less if I refused,\" she explains. The turning point came when she fell ill from exhaustion and had to take two weeks off. A friend suggested she try a simple rule: wait one day before agreeing to anything new. \"It sounds silly, but it gave me time to ask myself whether I really wanted to do it.\" Six months later, she says she has more energy, and, surprisingly, her friendships are stronger because she's actually present when she sees people.",
    questions: [
      { q: "Why did Jess use to accept every request?", options: ["She needed money", "She was afraid people would like her less", "Her boss forced her", "She was bored at home"], answer: 1 },
      { q: "What was the friend's suggestion?", options: ["Stop seeing people", "Change jobs", "Wait a day before saying yes", "Take a holiday"], answer: 2 },
      { q: "What surprising result does Jess mention?", options: ["Her friendships improved", "She earns more money", "She lost friends", "She works more hours"], answer: 0 },
    ],
  },
  B2: {
    level: "B2", title: "The return of the repair shop",
    text: "A generation ago, a broken toaster was simply thrown away; replacing it was cheaper than fixing it. Now, a growing network of volunteer-run 'repair cafés' is challenging that habit. Visitors bring in anything from lamps to laptops, and volunteers show them how to diagnose and fix the problem themselves. Organisers insist the point is not merely to save money. \"People leave with a sense of competence they haven't felt in years,\" says one founder. Critics argue that the movement can only go so far while manufacturers glue components together and refuse to sell spare parts. Several governments have responded with 'right to repair' laws, though campaigners say these remain too limited to change industry practices significantly.",
    questions: [
      { q: "According to the organisers, what is the main benefit of repair cafés?", options: ["Making money for volunteers", "Saving money only", "Giving people confidence in their own abilities", "Selling spare parts"], answer: 2 },
      { q: "What limits the movement, according to critics?", options: ["A lack of volunteers", "The way products are designed and sold", "Government bans", "Customers' lack of interest"], answer: 1 },
      { q: "What do campaigners think of the new laws?", options: ["They go too far", "They are not strong enough", "They are unnecessary", "They have solved the problem"], answer: 1 },
    ],
  },
  C1: {
    level: "C1", title: "The myth of multitasking",
    text: "We like to think of ourselves as accomplished jugglers, answering emails during meetings and listening to podcasts while drafting reports. Yet a substantial body of research suggests that what we experience as multitasking is, in fact, rapid task-switching — and that each switch carries a cognitive cost. The effect is easy to underestimate precisely because it is gradual: no single interruption feels damaging, but the cumulative toll on accuracy and depth of thought can be considerable. Intriguingly, those who rate themselves as the most skilled multitaskers tend to perform worst on tests of attention, perhaps because their confidence prevents them from noticing their own lapses. None of this means that we should retreat into monastic isolation; rather, it argues for being deliberate about when we allow ourselves to be interrupted.",
    questions: [
      { q: "What does the writer say 'multitasking' really is?", options: ["A rare talent", "Switching quickly between tasks", "Doing two tasks perfectly at once", "A myth invented by employers"], answer: 1 },
      { q: "Why is the cost of switching easy to underestimate?", options: ["It only affects some people", "It builds up gradually", "Researchers disagree about it", "It improves with practice"], answer: 1 },
      { q: "What does the writer ultimately recommend?", options: ["Avoiding all technology", "Working in isolation", "Choosing consciously when to accept interruptions", "Training to multitask better"], answer: 2 },
    ],
  },
  C2: {
    level: "C2", title: "On nostalgia",
    text: "Nostalgia was once classified as a disease — a 'cerebral affliction' diagnosed in homesick Swiss mercenaries — and for much of the twentieth century it retained a faintly disreputable air, the indulgence of those unable to reconcile themselves to the present. Latterly, psychologists have been more charitable, finding that bouts of wistful reminiscence can bolster a sense of continuity and even buffer against loneliness. Yet the rehabilitation is not unqualified. Nostalgia is, by its nature, an editor: it trims away the tedium and anxiety that suffused the remembered moment, leaving a version more luminous than the original ever was. The danger lies less in the feeling itself than in mistaking its curated past for a blueprint — a temptation to which politicians, no less than individuals, have proved remarkably susceptible.",
    questions: [
      { q: "How has the view of nostalgia changed, according to the text?", options: ["It is now considered a serious illness", "It has gained a more positive reputation, with reservations", "It has always been viewed positively", "Psychologists now recommend avoiding it"], answer: 1 },
      { q: "What does the writer mean by calling nostalgia 'an editor'?", options: ["It makes memories more accurate", "It removes the unpleasant parts of memories", "It helps people write about the past", "It erases memories entirely"], answer: 1 },
      { q: "Where, according to the writer, does the real danger lie?", options: ["In feeling nostalgic too often", "In treating an idealised past as a model for the future", "In forgetting the past", "In politicians ignoring history"], answer: 1 },
    ],
  },
};

export interface ListeningItem {
  level: Level;
  title: string;
  rate: number; // TTS speed
  script: string;
  questions: { q: string; options: string[]; answer: number }[];
}

export const LISTENING: Record<Level, ListeningItem> = {
  A1: {
    level: "A1", title: "At the shop", rate: 0.8,
    script: "Hello. Can I have two apples and a bottle of water, please? Thank you. How much is it? Three pounds fifty? Here you are.",
    questions: [
      { q: "What does the person buy?", options: ["Two apples and water", "Two bananas and juice", "Apples and milk", "Water and bread"], answer: 0 },
      { q: "How much does it cost?", options: ["£2.50", "£3.15", "£3.50", "£13.50"], answer: 2 },
    ],
  },
  A2: {
    level: "A2", title: "A voicemail", rate: 0.88,
    script: "Hi Mark, it's Julie. I'm sorry, but I can't meet you at the cinema tonight. My train is late and I won't be home before nine. Can we go tomorrow instead? The film starts at half past seven. Call me back when you get this. Bye!",
    questions: [
      { q: "Why can't Julie go tonight?", options: ["She is ill", "Her train is late", "She has to work", "The film is cancelled"], answer: 1 },
      { q: "What does she suggest?", options: ["Going tomorrow", "Going next week", "Watching a film at home", "Meeting at nine"], answer: 0 },
      { q: "What time does the film start tomorrow?", options: ["7:00", "7:30", "8:30", "9:00"], answer: 1 },
    ],
  },
  B1: {
    level: "B1", title: "A holiday problem", rate: 0.95,
    script: "So, we arrived at the hotel quite late, around eleven, and the receptionist told us they'd given our room to someone else. Apparently there'd been a problem with the booking system. Anyway, they were really apologetic, and in the end they sent us to their sister hotel, which was actually much nicer, right on the beach. And they paid for the taxi. So it turned out fine, but I was pretty stressed at the time.",
    questions: [
      { q: "What was the problem?", options: ["The hotel was closed", "Their room had been given to someone else", "They lost their luggage", "The taxi didn't arrive"], answer: 1 },
      { q: "How did the hotel solve it?", options: ["They gave a refund", "They moved them to another hotel", "They upgraded their room", "They offered a free dinner"], answer: 1 },
      { q: "How does the speaker feel about it now?", options: ["Still angry", "It worked out well in the end", "They will never go back", "Indifferent"], answer: 1 },
    ],
  },
  B2: {
    level: "B2", title: "Working from home", rate: 1.0,
    script: "I'll be honest, when we switched to working from home full-time, I thought I'd love it. No commute, more time with the kids. And for the first few months, it was great. But gradually I noticed I was working longer hours, not fewer, because there was no clear moment when the day ended. What's helped is going back into the office two days a week. It's not that I'm more productive there, necessarily, but it gives the week some structure, and I actually see my colleagues, which I hadn't realised I'd missed so much.",
    questions: [
      { q: "What problem did the speaker notice after a few months?", options: ["Their children were too noisy", "They were working longer hours", "Their internet was too slow", "They missed the commute"], answer: 1 },
      { q: "Why does the speaker go to the office two days a week?", options: ["Because they're more productive there", "Their boss requires it", "It gives their week structure and social contact", "It's closer to their children's school"], answer: 2 },
      { q: "What hadn't the speaker realised?", options: ["How much they missed their colleagues", "How expensive commuting was", "How much they enjoyed cooking", "How quiet the office was"], answer: 0 },
    ],
  },
  C1: {
    level: "C1", title: "A podcast extract", rate: 1.03,
    script: "What strikes me about the debate on artificial sweeteners is how often the headlines run ahead of the evidence. A study finds a correlation in a particular group of people, and within days it's being reported as though sweeteners definitively cause harm. Now, that's not to say there's nothing there — some of the findings are genuinely concerning and deserve proper follow-up. But correlation in observational data is a starting point, not a verdict. The more useful question for most listeners isn't 'are sweeteners dangerous?' but 'what am I replacing them with, and is that any better?'",
    questions: [
      { q: "What is the speaker's main criticism?", options: ["Scientists are biased", "Media reports exaggerate what the studies show", "Sweeteners have never been studied", "People consume too much sugar"], answer: 1 },
      { q: "What is the speaker's view of the research findings?", options: ["They are worthless", "Some deserve further investigation", "They prove sweeteners are safe", "They prove sweeteners are harmful"], answer: 1 },
      { q: "What question does the speaker think is more useful?", options: ["Which brand is safest", "What the alternative to sweeteners would be", "Whether to ban sweeteners", "How much sugar is safe"], answer: 1 },
    ],
  },
  C2: {
    level: "C2", title: "A lecture extract", rate: 1.06,
    script: "It would be tempting, and frankly rather convenient, to cast the collapse of these trading networks as the product of a single catastrophe — an earthquake, say, or a failed harvest. The archaeological record, however, resists such tidy narratives. What we find instead is a slow attrition: routes abandoned one by one, luxury goods quietly disappearing from burial sites a generation or two before the cities themselves were deserted. If anything, the dramatic destruction layers that attract so much attention may mark not the cause of decline but its final, almost incidental, chapter.",
    questions: [
      { q: "What explanation does the lecturer reject?", options: ["A gradual decline", "A single sudden disaster", "Climate change", "Foreign invasion over centuries"], answer: 1 },
      { q: "What does the evidence suggest?", options: ["Cities were deserted before trade declined", "Trade declined gradually before cities were abandoned", "Luxury goods increased before the collapse", "An earthquake destroyed the routes"], answer: 1 },
      { q: "How does the lecturer interpret the destruction layers?", options: ["As the main cause of the collapse", "As the last stage rather than the cause", "As evidence of an earthquake", "As unimportant forgeries"], answer: 1 },
    ],
  },
};

export interface WritingTask {
  level: Level;
  promptFr: string;
  promptEn: string;
  minWords: number;
}

export const WRITING_TASKS: Record<Level, WritingTask> = {
  A1: { level: "A1", promptFr: "Présentez-vous : votre nom, votre âge, où vous habitez, ce que vous aimez.", promptEn: "Introduce yourself: your name, age, where you live, what you like.", minWords: 25 },
  A2: { level: "A2", promptFr: "Écrivez un message à un ami pour raconter votre dernier week-end.", promptEn: "Write a message to a friend about your last weekend.", minWords: 40 },
  B1: { level: "B1", promptFr: "Racontez un voyage ou un souvenir marquant et dites ce que vous en avez retenu.", promptEn: "Describe a memorable trip or experience and what you learned from it.", minWords: 80 },
  B2: { level: "B2", promptFr: "« Les réseaux sociais font plus de mal que de bien. » Donnez votre opinion avec des arguments et des exemples.", promptEn: "\"Social media does more harm than good.\" Give your opinion with arguments and examples.", minWords: 120 },
  C1: { level: "C1", promptFr: "Rédigez une courte lettre à une entreprise ou une institution pour proposer une amélioration de son service, en argumentant.", promptEn: "Write a short letter to an organisation proposing an improvement to its service, with reasoned arguments.", minWords: 150 },
  C2: { level: "C2", promptFr: "Discutez de manière nuancée : le progrès technologique nous rend-il plus libres ?", promptEn: "Discuss, with nuance: does technological progress make us freer?", minWords: 180 },
};

/** CEFR self-assessment statements ("je peux…"), adapted from the official CEFR self-assessment grid. */
export const CAN_DO: Record<"writing" | "speaking", Record<Level, string[]>> = {
  writing: {
    A1: ["Je peux écrire une carte postale simple ou remplir un formulaire avec mon nom, ma nationalité et mon adresse.", "Je peux écrire des phrases simples sur moi-même."],
    A2: ["Je peux écrire des notes et messages simples et courts.", "Je peux écrire une lettre personnelle très simple, par exemple pour remercier quelqu'un."],
    B1: ["Je peux écrire un texte simple et cohérent sur des sujets familiers.", "Je peux écrire des lettres personnelles pour décrire expériences et impressions."],
    B2: ["Je peux écrire des textes clairs et détaillés sur une grande gamme de sujets.", "Je peux écrire un essai en argumentant pour ou contre une opinion."],
    C1: ["Je peux m'exprimer dans un texte clair et bien structuré et développer mon point de vue.", "Je peux adapter mon style au destinataire (registre formel ou informel)."],
    C2: ["Je peux écrire un texte clair, fluide et stylistiquement adapté.", "Je peux rédiger des lettres, rapports ou articles complexes avec une construction logique efficace."],
  },
  speaking: {
    A1: ["Je peux communiquer simplement si l'interlocuteur parle lentement et m'aide.", "Je peux utiliser des phrases simples pour décrire où je vis et les gens que je connais."],
    A2: ["Je peux communiquer lors de tâches simples et habituelles (courses, transports, restaurant).", "Je peux avoir des échanges très brefs, même si je ne comprends pas assez pour poursuivre une conversation."],
    B1: ["Je peux faire face à la plupart des situations rencontrées en voyage.", "Je peux raconter une histoire, une expérience, et donner brièvement mes raisons et explications."],
    B2: ["Je peux communiquer avec spontanéité et aisance avec un locuteur natif.", "Je peux exposer un point de vue sur un sujet d'actualité et expliquer les avantages et inconvénients."],
    C1: ["Je peux m'exprimer spontanément et couramment sans trop chercher mes mots.", "Je peux utiliser la langue de manière souple et efficace dans ma vie sociale et professionnelle."],
    C2: ["Je peux participer sans effort à toute conversation et je connais bien les expressions idiomatiques et familières.", "Je peux exprimer avec précision de fines nuances de sens."],
  },
};

/** Read-aloud sentences for the optional intelligibility check (indicative only). */
export const READ_ALOUD = [
  "I think we should leave a bit earlier tomorrow.",
  "The weather was surprisingly warm for the beginning of March.",
  "Could you tell me where the nearest station is, please?",
];

/** CEFR global scale, in French: what the learner can do at each level. */
export const GLOBAL_SCALE: Record<Level, { title: string; canDo: string; next: string }> = {
  A1: { title: "Introductif — découverte", canDo: "Vous comprenez et utilisez des expressions familières et quotidiennes, vous pouvez vous présenter et poser des questions simples, si l'interlocuteur parle lentement.", next: "Pour atteindre A2 : enrichir le vocabulaire du quotidien (achats, transports, travail), maîtriser le présent et le past simple." },
  A2: { title: "Intermédiaire — survie", canDo: "Vous comprenez des phrases isolées sur des sujets familiers et pouvez communiquer lors d'échanges simples et habituels.", next: "Pour atteindre B1 : raconter des expériences, travailler le present perfect, les connecteurs et l'écoute de conversations naturelles." },
  B1: { title: "Niveau seuil", canDo: "Vous comprenez l'essentiel quand un langage clair est utilisé, vous vous débrouillez en voyage et pouvez raconter un événement et donner votre avis brièvement.", next: "Pour atteindre B2 : argumenter, comprendre l'anglais parlé à vitesse normale, enrichir les phrasal verbs et les structures complexes." },
  B2: { title: "Avancé — indépendant", canDo: "Vous comprenez l'essentiel de textes complexes et pouvez converser avec spontanéité et aisance avec un locuteur natif.", next: "Pour atteindre C1 : nuancer, maîtriser les registres, comprendre l'implicite et l'humour, lire des textes longs et exigeants." },
  C1: { title: "Autonome", canDo: "Vous comprenez des textes longs et exigeants, saisissez l'implicite et vous exprimez couramment et de façon structurée.", next: "Pour atteindre C2 : précision lexicale, expressions idiomatiques, style et finesse dans toutes les situations." },
  C2: { title: "Maîtrise", canDo: "Vous comprenez sans effort pratiquement tout et pouvez vous exprimer spontanément, très couramment et avec précision, en rendant de fines nuances de sens.", next: "Continuez à lire, écouter et écrire sur des sujets variés pour entretenir ce niveau." },
};
