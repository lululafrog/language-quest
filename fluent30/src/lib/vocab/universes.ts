// Vocabulary universes (20) and their sub-themes (≈ 230). Every lexicon entry belongs to one or more sub-themes;
// the old flat theme ids (lib/data/types THEMES) are mapped onto sub-themes so existing cards keep their place.

export interface SubTheme {
  id: string; // globally unique, "universe.sub"
  fr: string;
  en: string;
}

export interface Universe {
  id: string;
  fr: string;
  en: string;
  /** short French tagline */
  tagline: string;
  /** colour family used for the universe card, plant and mind-map branch */
  hue: "sea" | "sage" | "terracotta" | "sand" | "plum" | "ocean" | "moss" | "rose" | "slate" | "amber";
  subs: SubTheme[];
  /** old flat theme ids that belong here (first one = default sub-theme) */
  legacy: string[];
}

const s = (u: string, list: [string, string, string][]): SubTheme[] => list.map(([id, fr, en]) => ({ id: `${u}.${id}`, fr, en }));

export const UNIVERSES: Universe[] = [
  {
    id: "travel", fr: "Voyage et aventure", en: "Travel & adventure", tagline: "De l'aéroport au sommet", hue: "sea",
    legacy: ["travel", "airport", "accommodation", "beach", "adventure", "travel-problems"],
    subs: s("travel", [
      ["airport", "Aéroport", "Airport"], ["plane", "Avion", "On the plane"], ["hotel", "Hôtel", "Hotel"], ["restaurant", "Restaurant en voyage", "Eating out abroad"],
      ["meeting", "Rencontres", "Meeting people"], ["sightseeing", "Activités touristiques", "Sightseeing"], ["car-rental", "Location de véhicule", "Car rental"],
      ["problems", "Problèmes et imprévus", "Travel problems"], ["hiking", "Randonnée", "Hiking"], ["diving", "Plongée", "Diving"], ["orientation", "Orientation", "Finding your way"],
      ["backpacking", "Sac à dos", "Backpacking"], ["beach", "Plage", "Beach"], ["camping", "Camping", "Camping"], ["border", "Frontière et douane", "Border & customs"],
    ]),
  },
  {
    id: "daily", fr: "Vie quotidienne", en: "Daily life", tagline: "Les mots de tous les jours", hue: "sand",
    legacy: ["daily", "time", "numbers", "greetings", "introductions"],
    subs: s("daily", [
      ["routine", "Routine du matin et du soir", "Daily routine"], ["chores", "Tâches ménagères", "Chores"], ["time", "Heures, jours et dates", "Time & dates"],
      ["numbers", "Nombres et quantités", "Numbers & quantities"], ["weather", "Météo", "Weather"], ["errands", "Courses et démarches", "Errands"],
      ["phone", "Téléphone et messages", "Phone & messages"], ["family-life", "Vie de famille", "Family life"], ["sleep", "Sommeil", "Sleep"],
      ["greetings", "Saluer et se présenter", "Greetings & introductions"], ["small-talk", "Petites conversations", "Small talk"], ["habits", "Habitudes", "Habits"],
    ]),
  },
  {
    id: "love", fr: "Amour et séduction", en: "Love & dating", tagline: "Flirter, aimer, se dire les choses", hue: "rose",
    legacy: ["dating"],
    subs: s("love", [
      ["flirting", "Flirter", "Flirting"], ["dating", "Rendez-vous", "Dating"], ["compliments", "Compliments", "Compliments"], ["feelings", "Sentiments amoureux", "Feelings"],
      ["status", "Situation amoureuse", "Relationship status"], ["plans", "Sorties à deux", "Date ideas"], ["breakup", "Rupture", "Breaking up"], ["wedding", "Mariage", "Weddings"],
      ["online", "Rencontres en ligne", "Online dating"], ["trust", "Confiance et jalousie", "Trust & jealousy"], ["affection", "Tendresse", "Affection"],
    ]),
  },
  {
    id: "friends", fr: "Relations et amitié", en: "Friends & relationships", tagline: "Se faire des amis, partout", hue: "amber",
    legacy: ["relationships", "people", "party"],
    subs: s("friends", [
      ["making-friends", "Se faire des amis", "Making friends"], ["friendship", "Amitié", "Friendship"], ["family", "Famille", "Family"], ["invitations", "Invitations", "Invitations"],
      ["parties", "Fêtes et soirées", "Parties"], ["social-media", "Réseaux sociaux", "Social media"], ["conflicts", "Disputes et conflits", "Conflicts"], ["apologies", "S'excuser", "Apologising"],
      ["support", "Soutenir quelqu'un", "Support"], ["neighbours", "Voisins", "Neighbours"], ["people", "Décrire les gens", "Describing people"], ["kids", "Enfants et âges de la vie", "Children & ages"],
    ]),
  },
  {
    id: "emotions", fr: "Émotions et personnalité", en: "Emotions & personality", tagline: "Dire ce qu'on ressent", hue: "plum",
    legacy: ["emotions"],
    subs: s("emotions", [
      ["happiness", "Joie", "Happiness"], ["sadness", "Tristesse", "Sadness"], ["anger", "Colère", "Anger"], ["fear", "Peur et anxiété", "Fear & anxiety"],
      ["surprise", "Surprise", "Surprise"], ["stress", "Stress", "Stress"], ["positive-traits", "Qualités", "Positive traits"], ["negative-traits", "Défauts", "Negative traits"],
      ["moods", "Humeurs", "Moods"], ["motivation", "Motivation", "Motivation"], ["empathy", "Empathie", "Empathy"], ["confidence", "Confiance en soi", "Confidence"],
    ]),
  },
  {
    id: "food", fr: "Cuisine et gastronomie", en: "Food & cooking", tagline: "Commander, cuisiner, savourer", hue: "terracotta",
    legacy: ["food", "restaurant", "cooking"],
    subs: s("food", [
      ["ordering", "Commander au restaurant", "Ordering food"], ["ingredients", "Ingrédients", "Ingredients"], ["cooking", "Modes de cuisson", "Cooking methods"], ["kitchen", "Ustensiles", "Kitchen tools"],
      ["flavours", "Saveurs et textures", "Flavours & textures"], ["drinks", "Boissons", "Drinks"], ["breakfast", "Petit-déjeuner", "Breakfast"], ["desserts", "Desserts", "Desserts"],
      ["diets", "Régimes et allergies", "Diets & allergies"], ["cafe", "Café et bar", "Cafés & bars"], ["recipes", "Recettes", "Recipes"], ["street-food", "Street food", "Street food"],
      ["fruit-veg", "Fruits et légumes", "Fruit & vegetables"],
    ]),
  },
  {
    id: "sport", fr: "Sport et bien-être", en: "Sport & wellbeing", tagline: "Bouger, souffler, progresser", hue: "moss",
    legacy: ["sport"],
    subs: s("sport", [
      ["gym", "Salle de sport", "Gym & fitness"], ["team", "Sports collectifs", "Team sports"], ["running", "Course à pied", "Running"], ["water", "Sports nautiques", "Water sports"],
      ["yoga", "Yoga et méditation", "Yoga & meditation"], ["outdoor", "Sports de plein air", "Outdoor sports"], ["competition", "Compétition", "Competition"], ["injuries", "Blessures", "Injuries"],
      ["nutrition", "Nutrition", "Nutrition"], ["relax", "Détente", "Relaxation"], ["cycling", "Vélo", "Cycling"], ["watching", "Regarder un match", "Watching sport"],
    ]),
  },
  {
    id: "health", fr: "Santé et corps humain", en: "Health & body", tagline: "Se soigner, s'expliquer", hue: "ocean",
    legacy: ["health", "body"],
    subs: s("health", [
      ["body", "Parties du corps", "Body parts"], ["symptoms", "Symptômes", "Symptoms"], ["doctor", "Chez le médecin", "At the doctor's"], ["pharmacy", "Pharmacie", "Pharmacy"],
      ["hospital", "Hôpital", "Hospital"], ["dentist", "Dentiste", "Dentist"], ["mental", "Santé mentale", "Mental health"], ["illnesses", "Maladies", "Illnesses"],
      ["first-aid", "Premiers secours", "First aid"], ["senses", "Les sens", "Senses"], ["habits", "Bonnes habitudes", "Healthy habits"], ["appearance", "Apparence physique", "Appearance"],
    ]),
  },
  {
    id: "nature", fr: "Nature et animaux", en: "Nature & animals", tagline: "Paysages, bêtes et saisons", hue: "sage",
    legacy: ["nature", "animals"],
    subs: s("nature", [
      ["landscapes", "Paysages", "Landscapes"], ["climate", "Climat", "Climate"], ["plants", "Plantes et arbres", "Plants & trees"], ["wild", "Animaux sauvages", "Wild animals"],
      ["pets", "Animaux de compagnie", "Pets"], ["birds-insects", "Oiseaux et insectes", "Birds & insects"], ["sea", "Vie marine", "Sea life"], ["environment", "Écologie", "Environment"],
      ["seasons", "Saisons", "Seasons"], ["disasters", "Catastrophes naturelles", "Natural disasters"], ["farm", "La ferme", "The farm"], ["sky", "Ciel et espace", "Sky & space"],
    ]),
  },
  {
    id: "work", fr: "Travail et carrière", en: "Work & career", tagline: "De l'entretien à la réunion", hue: "slate",
    legacy: ["work", "school"],
    subs: s("work", [
      ["job-search", "Chercher un emploi", "Job hunting"], ["interview", "Entretien d'embauche", "Job interview"], ["office", "Vie au bureau", "Office life"], ["meetings", "Réunions", "Meetings"],
      ["emails", "E-mails professionnels", "Work emails"], ["projects", "Projets et délais", "Projects & deadlines"], ["management", "Management", "Management"], ["contracts", "Salaire et contrat", "Pay & contracts"],
      ["remote", "Télétravail", "Remote work"], ["jobs", "Métiers", "Jobs"], ["negotiation", "Négociation", "Negotiation"], ["presentations", "Présentations", "Presentations"],
      ["studies", "Études et formation", "Studies"],
    ]),
  },
  {
    id: "money", fr: "Argent et finances", en: "Money & finance", tagline: "Payer, épargner, négocier", hue: "amber",
    legacy: [],
    subs: s("money", [
      ["banking", "Banque", "Banking"], ["payments", "Payer", "Payments"], ["budget", "Budget", "Budgeting"], ["saving", "Épargne et placements", "Saving & investing"],
      ["prices", "Prix et bonnes affaires", "Prices & deals"], ["taxes", "Impôts", "Taxes"], ["loans", "Crédits et dettes", "Loans & debt"], ["exchange", "Change", "Currency exchange"],
      ["bills", "Factures", "Bills"], ["insurance", "Assurance", "Insurance"],
    ]),
  },
  {
    id: "shopping", fr: "Shopping et vêtements", en: "Shopping & clothes", tagline: "Essayer, comparer, rendre", hue: "rose",
    legacy: ["shopping", "clothes"],
    subs: s("shopping", [
      ["clothes", "Vêtements", "Clothes"], ["shoes", "Chaussures et accessoires", "Shoes & accessories"], ["sizes", "Tailles et essayage", "Sizes & fitting"], ["style", "Mode et style", "Fashion & style"],
      ["supermarket", "Supermarché", "Supermarket"], ["returns", "Échanges et remboursements", "Returns & refunds"], ["sales", "Soldes", "Sales"], ["colours", "Couleurs et matières", "Colours & materials"],
      ["online", "Achats en ligne", "Online shopping"], ["beauty", "Beauté et soins", "Beauty"], ["market", "Marchés", "Markets"],
    ]),
  },
  {
    id: "culture", fr: "Culture et loisirs", en: "Culture & leisure", tagline: "Films, musique, livres, sorties", hue: "plum",
    legacy: ["music", "books", "movies", "art"],
    subs: s("culture", [
      ["movies", "Films et séries", "Movies & series"], ["music", "Musique", "Music"], ["books", "Livres et lecture", "Books"], ["art", "Musées et art", "Museums & art"],
      ["theatre", "Théâtre et spectacles", "Theatre & shows"], ["photo", "Photographie", "Photography"], ["hobbies", "Loisirs et jeux", "Hobbies & games"], ["festivals", "Festivals", "Festivals"],
      ["history", "Histoire", "History"], ["tv", "Télévision et médias", "TV & media"], ["concerts", "Concerts", "Concerts"], ["going-out", "Sorties", "Going out"],
    ]),
  },
  {
    id: "tech", fr: "Technologie", en: "Technology", tagline: "Écrans, appli et réseaux", hue: "slate",
    legacy: ["tech"],
    subs: s("tech", [
      ["phones", "Smartphones", "Smartphones"], ["computers", "Ordinateurs", "Computers"], ["internet", "Internet", "The internet"], ["social", "Réseaux sociaux", "Social networks"],
      ["apps", "Applications", "Apps"], ["security", "Sécurité et vie privée", "Security & privacy"], ["science", "Sciences et IA", "Science & AI"], ["problems", "Pannes et bugs", "Tech problems"],
      ["gaming", "Jeux vidéo", "Video games"], ["gadgets", "Objets connectés", "Gadgets"],
    ]),
  },
  {
    id: "transport", fr: "Transports", en: "Transport", tagline: "Se déplacer sans stress", hue: "ocean",
    legacy: ["transport", "directions", "city"],
    subs: s("transport", [
      ["train", "Train", "Train"], ["bus", "Bus et car", "Bus & coach"], ["metro", "Métro", "Underground"], ["taxi", "Taxi et VTC", "Taxis & rideshare"],
      ["driving", "Conduire", "Driving"], ["traffic", "Route et circulation", "Roads & traffic"], ["bikes", "Vélos et trottinettes", "Bikes & scooters"], ["boat", "Bateau et ferry", "Boats & ferries"],
      ["tickets", "Billets et horaires", "Tickets & timetables"], ["delays", "Retards et grèves", "Delays & strikes"], ["directions", "Demander son chemin", "Asking the way"], ["city", "En ville", "Around town"],
    ]),
  },
  {
    id: "home", fr: "Maison et logement", en: "Home & housing", tagline: "Louer, ranger, réparer", hue: "sand",
    legacy: ["home"],
    subs: s("home", [
      ["rooms", "Pièces", "Rooms"], ["furniture", "Meubles", "Furniture"], ["renting", "Louer", "Renting"], ["buying", "Acheter un logement", "Buying a home"],
      ["repairs", "Réparations et bricolage", "Repairs & DIY"], ["appliances", "Électroménager", "Appliances"], ["cleaning", "Ménage", "Cleaning"], ["garden", "Jardin", "Garden"],
      ["moving", "Déménager", "Moving house"], ["utilities", "Eau, gaz, électricité", "Utilities"], ["objects", "Objets du quotidien", "Everyday objects"],
    ]),
  },
  {
    id: "debate", fr: "Conversations et débats", en: "Conversation & debate", tagline: "Argumenter avec nuance", hue: "sea",
    legacy: ["opinions", "linking"],
    subs: s("debate", [
      ["opinion", "Donner son avis", "Giving opinions"], ["agreeing", "Être d'accord", "Agreeing"], ["disagreeing", "Ne pas être d'accord", "Disagreeing"], ["persuading", "Convaincre", "Persuading"],
      ["connectors", "Connecteurs logiques", "Linking words"], ["nuance", "Nuancer", "Nuancing"], ["clarifying", "Faire préciser", "Asking for clarification"], ["storytelling", "Raconter une histoire", "Storytelling"],
      ["society", "Société et politique", "Society & politics"], ["news", "Actualité", "The news"], ["fillers", "Gagner du temps à l'oral", "Fillers & hesitation"], ["polite", "Désaccord poli", "Polite disagreement"],
    ]),
  },
  {
    id: "humour", fr: "Humour et expressions familières", en: "Humour & slang", tagline: "Parler comme un natif", hue: "terracotta",
    legacy: ["slang", "idioms"],
    subs: s("humour", [
      ["slang", "Argot du quotidien", "Everyday slang"], ["jokes", "Blagues et taquineries", "Jokes & teasing"], ["sarcasm", "Ironie et sarcasme", "Irony & sarcasm"], ["exclamations", "Exclamations", "Exclamations"],
      ["informal-greetings", "Salutations familières", "Casual greetings"], ["texting", "Abréviations des textos", "Texting"], ["british", "Expressions britanniques", "British English"], ["american", "Expressions américaines", "American English"],
      ["idioms", "Expressions imagées", "Idioms"], ["banter", "Chambrer entre amis", "Banter"], ["reactions", "Réactions spontanées", "Reactions"],
    ]),
  },
  {
    id: "admin", fr: "Administration", en: "Paperwork & services", tagline: "Formulaires sans prise de tête", hue: "slate",
    legacy: [],
    subs: s("admin", [
      ["passport", "Passeport et visa", "Passports & visas"], ["forms", "Formulaires", "Forms"], ["bank-admin", "Démarches bancaires", "Bank paperwork"], ["police-report", "Déclarations à la police", "Police reports"],
      ["post", "Poste et colis", "Post & parcels"], ["appointments", "Rendez-vous et réservations", "Appointments & bookings"], ["rental-papers", "Dossier de location", "Rental paperwork"],
      ["official", "Courriers officiels", "Official letters"], ["customer-service", "Service client", "Customer service"], ["complaints", "Réclamations", "Complaints"],
    ]),
  },
  {
    id: "emergency", fr: "Situations d'urgence", en: "Emergencies", tagline: "Les mots qui comptent", hue: "terracotta",
    legacy: ["emergency", "crime"],
    subs: s("emergency", [
      ["calling", "Appeler les secours", "Calling for help"], ["accidents", "Accidents", "Accidents"], ["medical", "Urgence médicale", "Medical emergency"], ["theft", "Vol et perte", "Theft & loss"],
      ["fire", "Incendie", "Fire"], ["disaster", "Catastrophe", "Disasters"], ["police", "Police", "Police"], ["lost", "Perdu", "Being lost"], ["breakdown", "Panne", "Breakdowns"],
      ["safety", "Consignes de sécurité", "Safety instructions"],
    ]),
  },
];

/** Grammar-oriented legacy themes → closest universe (words without a clearer universe). */
const LEGACY_FALLBACK: Record<string, string> = {
  "action-verbs": "daily", adjectives: "emotions", "grammar-words": "daily", "phrasal-verbs": "daily", "irregular-verbs": "daily",
};

export const ALL_SUBS: SubTheme[] = UNIVERSES.flatMap((u) => u.subs);
const subById = new Map(ALL_SUBS.map((x) => [x.id, x]));
const uniById = new Map(UNIVERSES.map((u) => [u.id, u]));

export function universe(id?: string): Universe | undefined {
  return id ? uniById.get(id) : undefined;
}
export function subTheme(id: string): SubTheme | undefined {
  return subById.get(id);
}
export function universeOfSub(subId: string): Universe | undefined {
  return uniById.get(subId.split(".")[0]);
}
export function isSub(id: string): boolean {
  return subById.has(id);
}

/** Universe ids for a word from its sub-themes or legacy themes. */
export function universesOf(themes: string[] | undefined, subs?: string[]): string[] {
  const out = new Set<string>();
  for (const sb of subs ?? []) if (isSub(sb)) out.add(sb.split(".")[0]);
  for (const t of themes ?? []) {
    if (isSub(t)) out.add(t.split(".")[0]);
    else if (uniById.has(t) && !UNIVERSES.some((u) => u.legacy.includes(t))) out.add(t);
    else {
      const u = UNIVERSES.find((x) => x.legacy.includes(t));
      if (u) out.add(u.id);
      else if (LEGACY_FALLBACK[t] && !out.size) out.add(LEGACY_FALLBACK[t]);
    }
  }
  return [...out];
}

/** Sub-theme for a legacy theme id (first sub-theme of its universe, or a named match). */
export function subForLegacy(theme: string): string | undefined {
  if (isSub(theme)) return theme;
  const direct: Record<string, string> = {
    airport: "travel.airport", accommodation: "travel.hotel", beach: "travel.beach", adventure: "travel.hiking", "travel-problems": "travel.problems",
    time: "daily.time", numbers: "daily.numbers", greetings: "daily.greetings", introductions: "daily.greetings", restaurant: "food.ordering", cooking: "food.cooking",
    relationships: "friends.friendship", people: "friends.people", party: "friends.parties", dating: "love.dating", body: "health.body", animals: "nature.wild",
    school: "work.studies", clothes: "shopping.clothes", music: "culture.music", books: "culture.books", movies: "culture.movies", art: "culture.art",
    transport: "transport.tickets", directions: "transport.directions", city: "transport.city", opinions: "debate.opinion", linking: "debate.connectors",
    slang: "humour.slang", idioms: "humour.idioms", emergency: "emergency.calling", crime: "emergency.police",
  };
  if (direct[theme]) return direct[theme];
  const u = UNIVERSES.find((x) => x.legacy.includes(theme));
  return u?.subs[0]?.id;
}

/** Word categories (grammar / usage) shown as filters and used by collections. */
export const CATEGORIES = {
  word: "Mot",
  verb: "Verbe",
  irregular: "Verbe irrégulier",
  phrasal: "Phrasal verb",
  adjective: "Adjectif",
  adverb: "Adverbe",
  idiom: "Expression idiomatique",
  connector: "Connecteur logique",
  slang: "Expression familière",
  collocation: "Collocation",
  native: "Expression de natif",
  falsefriend: "Faux ami",
  phrase: "Phrase utile",
  ukus: "Anglais UK / US",
} as const;
export type Category = keyof typeof CATEGORIES;
