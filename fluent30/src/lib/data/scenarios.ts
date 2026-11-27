// Role-play scenarios for the AI conversation partner (section 8).
import type { Register } from "../types";

export interface Scenario {
  id: string;
  emoji: string;
  titleFr: string;
  titleEn: string;
  setting: string; // English, sent to the AI
  role: string; // AI's role
  goal: string; // learner's goal
  goalFr: string;
  register: Register;
  phrases: { en: string; fr: string }[];
}

export const SCENARIOS: Scenario[] = [
  {
    id: "free", emoji: "💬", titleFr: "Conversation libre", titleEn: "Free chat",
    setting: "A relaxed chat about anything the learner wants to talk about.",
    role: "a curious, friendly English-speaking friend", goal: "talk freely about any topic", goalFr: "Parler librement de ce que vous voulez.",
    register: "courant",
    phrases: [{ en: "What about you?", fr: "Et toi ?" }, { en: "That's interesting!", fr: "C'est intéressant !" }, { en: "How do you say … in English?", fr: "Comment dit-on … en anglais ?" }],
  },
  {
    id: "travel-meet", emoji: "🧳", titleFr: "Rencontrer quelqu'un en voyage", titleEn: "Meet someone while travelling",
    setting: "In the common room of a hostel in Lisbon, in the evening.",
    role: "Sam, a fellow traveller from Australia on a backpacking trip", goal: "introduce yourself, find common interests, maybe plan something together", goalFr: "Se présenter, trouver des points communs, peut-être prévoir une sortie.",
    register: "familier",
    phrases: [{ en: "Where are you headed next?", fr: "Tu vas où ensuite ?" }, { en: "How long have you been travelling?", fr: "Ça fait combien de temps que tu voyages ?" }, { en: "Do you fancy grabbing a drink?", fr: "Ça te dit d'aller boire un verre ?" }],
  },
  {
    id: "flirt", emoji: "💘", titleFr: "Flirter naturellement", titleEn: "Flirt naturally",
    setting: "At a friend's birthday party in London; you've just been introduced.",
    role: "Alex, a witty, warm person who seems interested in the learner (keep it respectful and light-hearted)", goal: "make conversation, compliment naturally, suggest meeting again", goalFr: "Engager la conversation, faire un compliment naturel, proposer de se revoir.",
    register: "familier",
    phrases: [{ en: "So, how do you know Emma?", fr: "Alors, tu connais Emma comment ?" }, { en: "I love your sense of humour.", fr: "J'adore ton humour." }, { en: "Would you like to grab a coffee sometime?", fr: "Ça te dirait d'aller prendre un café un de ces jours ?" }],
  },
  {
    id: "restaurant", emoji: "🍽️", titleFr: "Commander au restaurant", titleEn: "Order at a restaurant",
    setting: "A busy bistro in New York at dinner time.",
    role: "Jordan, a friendly and slightly hurried waiter", goal: "get a table, ask about the menu, order, deal with the bill", goalFr: "Obtenir une table, poser des questions sur la carte, commander, demander l'addition.",
    register: "courant",
    phrases: [{ en: "Could we get a table for two?", fr: "Pourrions-nous avoir une table pour deux ?" }, { en: "What would you recommend?", fr: "Que nous conseillez-vous ?" }, { en: "Could we get the check, please?", fr: "L'addition, s'il vous plaît." }],
  },
  {
    id: "hotel", emoji: "🏨", titleFr: "Réserver un hôtel", titleEn: "Book a hotel",
    setting: "Phone call to a small hotel in Edinburgh.",
    role: "Fiona, the hotel receptionist", goal: "book a room for specific dates, ask about price, breakfast, check-in time", goalFr: "Réserver une chambre, demander le prix, le petit-déjeuner, l'heure d'arrivée.",
    register: "professionnel",
    phrases: [{ en: "I'd like to book a double room.", fr: "Je voudrais réserver une chambre double." }, { en: "Is breakfast included?", fr: "Le petit-déjeuner est-il inclus ?" }, { en: "What time is check-in?", fr: "À quelle heure peut-on arriver ?" }],
  },
  {
    id: "transport", emoji: "🚆", titleFr: "Prendre les transports", titleEn: "Use public transport",
    setting: "At a London Underground station ticket area.",
    role: "a helpful station staff member", goal: "buy the right ticket, find your line and platform, ask how long it takes", goalFr: "Acheter le bon billet, trouver sa ligne et son quai, demander la durée du trajet.",
    register: "courant",
    phrases: [{ en: "Which line goes to Camden?", fr: "Quelle ligne va à Camden ?" }, { en: "Do I need to change?", fr: "Est-ce que je dois changer ?" }, { en: "A single to Brighton, please.", fr: "Un aller simple pour Brighton, s'il vous plaît." }],
  },
  {
    id: "friends", emoji: "🍻", titleFr: "Discuter avec des amis", titleEn: "Chat with friends",
    setting: "Friday night at the pub with English-speaking friends.",
    role: "Chris, a laid-back friend who loves gossip and jokes", goal: "catch up, react naturally, share news from your week", goalFr: "Prendre des nouvelles, réagir naturellement, raconter sa semaine.",
    register: "familier",
    phrases: [{ en: "What have you been up to?", fr: "Qu'est-ce que tu deviens ?" }, { en: "No way!", fr: "Sans blague !" }, { en: "I'm knackered.", fr: "Je suis crevé(e)." }],
  },
  {
    id: "passions", emoji: "🎸", titleFr: "Parler de ses passions", titleEn: "Talk about your passions",
    setting: "Meeting a new colleague during a lunch break.",
    role: "Taylor, an enthusiastic colleague who asks lots of follow-up questions", goal: "describe your hobbies, explain why you love them, ask about theirs", goalFr: "Décrire vos loisirs, expliquer pourquoi vous les aimez, poser des questions.",
    register: "courant",
    phrases: [{ en: "I'm really into…", fr: "Je suis à fond dans…" }, { en: "I got into it when…", fr: "J'ai commencé quand…" }, { en: "How about you, what do you do for fun?", fr: "Et toi, tu fais quoi pour te détendre ?" }],
  },
  {
    id: "interview", emoji: "💼", titleFr: "Passer un entretien", titleEn: "Job interview",
    setting: "A video job interview for a position in an international company.",
    role: "Ms Patel, a professional but friendly hiring manager", goal: "present your experience, strengths, answer classic questions, ask a question", goalFr: "Présenter votre parcours et vos atouts, répondre aux questions classiques, en poser une.",
    register: "professionnel",
    phrases: [{ en: "I have five years of experience in…", fr: "J'ai cinq ans d'expérience dans…" }, { en: "One of my strengths is…", fr: "L'une de mes qualités est…" }, { en: "What does a typical day look like?", fr: "À quoi ressemble une journée type ?" }],
  },
  {
    id: "past-story", emoji: "📖", titleFr: "Raconter une expérience passée", titleEn: "Tell a past experience",
    setting: "Chatting with a friend who asks about your best (or worst) trip ever.",
    role: "Jamie, a good listener who reacts and asks for details", goal: "tell a story in the past (past simple, past continuous), with details and feelings", goalFr: "Raconter une histoire au passé avec des détails et des émotions.",
    register: "courant",
    phrases: [{ en: "It all started when…", fr: "Tout a commencé quand…" }, { en: "While we were walking, …", fr: "Pendant qu'on marchait, …" }, { en: "In the end, …", fr: "Finalement, …" }],
  },
  {
    id: "opinion", emoji: "🗣️", titleFr: "Exprimer une opinion", titleEn: "Give your opinion",
    setting: "A friendly debate over coffee about a current topic (remote work, social media, travel…).",
    role: "Morgan, who politely disagrees to make the learner argue", goal: "give and justify your opinion, agree/disagree politely, nuance", goalFr: "Donner et justifier votre avis, être d'accord ou non poliment, nuancer.",
    register: "courant",
    phrases: [{ en: "If you ask me, …", fr: "Si tu veux mon avis, …" }, { en: "I see your point, but…", fr: "Je comprends ton point de vue, mais…" }, { en: "It depends on…", fr: "Ça dépend de…" }],
  },
  {
    id: "plans", emoji: "🗓️", titleFr: "Parler de ses projets", titleEn: "Talk about your plans",
    setting: "End of year chat with a friend about plans for next year.",
    role: "Riley, a supportive friend", goal: "talk about future plans and intentions (going to, will, present continuous)", goalFr: "Parler de vos projets (going to, will, présent continu).",
    register: "courant",
    phrases: [{ en: "I'm going to…", fr: "Je vais…" }, { en: "I'm thinking of…", fr: "Je pense à…" }, { en: "Hopefully, I'll…", fr: "J'espère que je vais…" }],
  },
  {
    id: "problem-abroad", emoji: "🆘", titleFr: "Gérer un problème à l'étranger", titleEn: "Handle a problem abroad",
    setting: "At an airport in Toronto: your luggage didn't arrive.",
    role: "Casey, an airline lost-luggage desk agent, polite but bureaucratic", goal: "explain the problem, describe your bag, find out what happens next, insist politely", goalFr: "Expliquer le problème, décrire votre valise, savoir la suite, insister poliment.",
    register: "courant",
    phrases: [{ en: "My suitcase hasn't arrived.", fr: "Ma valise n'est pas arrivée." }, { en: "It's a large black suitcase with…", fr: "C'est une grande valise noire avec…" }, { en: "How long will it take?", fr: "Combien de temps cela va-t-il prendre ?" }],
  },
];

export const REGISTERS: { id: Register; fr: string; en: string; desc: string; example: string }[] = [
  { id: "familier", fr: "Familier", en: "Informal", desc: "Entre amis, SMS, réseaux sociaux. Contractions, argot léger.", example: "Wanna grab a bite? / I'm knackered." },
  { id: "courant", fr: "Courant", en: "Neutral", desc: "Le registre par défaut, avec des inconnus ou au quotidien.", example: "Would you like to get something to eat?" },
  { id: "professionnel", fr: "Professionnel", en: "Professional", desc: "Travail, e-mails, clients. Poli, clair, sans argot.", example: "Would you be available for a quick call tomorrow?" },
  { id: "soutenu", fr: "Soutenu", en: "Formal", desc: "Écrits officiels, discours. Phrases longues, vocabulaire latin.", example: "I would be grateful if you could advise me at your earliest convenience." },
];

export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type Level = (typeof LEVELS)[number];
