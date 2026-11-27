// Offline theme classification (used when the AI is not available, and to complete AI themes):
// part of speech first (verbs, adjectives, phrasal verbs), then keyword lists per theme.
import { normalize } from "./text";
import { seedByLemma } from "./data/vocab";

const KEYWORDS: Record<string, string[]> = {
  animals: ["dog", "cat", "horse", "cow", "pig", "sheep", "goat", "chicken", "hen", "duck", "bird", "fish", "mouse", "rat", "rabbit", "fox", "wolf", "bear", "lion", "tiger", "elephant", "monkey", "snake", "frog", "bee", "ant", "spider", "fly", "butterfly", "whale", "dolphin", "shark", "deer", "owl", "eagle", "crow", "pigeon", "squirrel", "puppy", "kitten", "pet", "animal", "beast", "creature", "insect", "zebra", "giraffe", "camel", "donkey", "bull", "ox", "goose", "swan", "parrot", "turtle", "tortoise", "crab", "lobster", "worm", "bat", "hound", "mare", "lamb", "calf", "feather", "fur", "paw", "tail", "claw", "beak", "wing", "nest", "hive"],
  crime: ["murder", "murderer", "kill", "killer", "crime", "criminal", "police", "detective", "inspector", "suspect", "victim", "witness", "evidence", "clue", "alibi", "weapon", "gun", "knife", "poison", "blood", "body", "corpse", "theft", "thief", "steal", "rob", "robbery", "burglar", "arrest", "prison", "jail", "trial", "judge", "jury", "guilty", "innocent", "confess", "confession", "investigate", "investigation", "mystery", "motive", "culprit", "inquest", "coroner", "fingerprint", "deduce", "deduction", "accuse", "verdict", "hang", "strangle", "stab", "shoot", "corpse", "crook", "blackmail", "kidnap"],
  clothes: ["shirt", "t-shirt", "dress", "skirt", "trousers", "pants", "jeans", "shorts", "jacket", "coat", "hat", "cap", "scarf", "glove", "gloves", "sock", "socks", "shoe", "shoes", "boot", "boots", "sweater", "jumper", "hoodie", "suit", "tie", "belt", "pocket", "button", "zip", "sleeve", "collar", "uniform", "pyjamas", "underwear", "bra", "heel", "sandal", "cloak", "gown", "apron", "wear", "outfit"],
  sport: ["sport", "football", "soccer", "tennis", "rugby", "basketball", "golf", "swim", "swimming", "run", "running", "race", "match", "game", "team", "player", "coach", "goal", "score", "win", "lose", "ball", "bike", "cycling", "ski", "skiing", "gym", "train", "training", "fitness", "marathon", "champion", "referee", "stadium", "surf", "climb", "hike", "workout"],
  food: ["food", "bread", "butter", "cheese", "milk", "egg", "meat", "beef", "chicken", "pork", "fish", "rice", "pasta", "soup", "salad", "fruit", "apple", "banana", "orange", "lemon", "pear", "grape", "strawberry", "vegetable", "potato", "tomato", "carrot", "onion", "garlic", "sugar", "salt", "pepper", "cake", "biscuit", "cookie", "chocolate", "coffee", "tea", "wine", "beer", "juice", "breakfast", "lunch", "dinner", "supper", "meal", "cook", "bake", "eat", "drink", "hungry", "thirsty", "delicious", "taste", "honey", "jam", "flour", "oil"],
  restaurant: ["restaurant", "menu", "waiter", "waitress", "bill", "tip", "order", "dish", "starter", "dessert", "table", "chef", "reservation", "cafe", "bar", "pub"],
  body: ["head", "face", "eye", "eyes", "ear", "nose", "mouth", "lip", "tooth", "teeth", "tongue", "neck", "shoulder", "arm", "elbow", "hand", "finger", "thumb", "nail", "chest", "back", "stomach", "belly", "leg", "knee", "foot", "feet", "toe", "skin", "hair", "heart", "brain", "bone", "blood", "throat", "cheek", "chin", "forehead", "wrist", "ankle", "hip"],
  health: ["doctor", "nurse", "hospital", "ill", "sick", "illness", "disease", "pain", "hurt", "medicine", "pill", "fever", "cough", "cold", "flu", "injury", "wound", "headache", "healthy", "health", "cure", "heal", "pharmacy", "surgery", "ambulance"],
  emotions: ["happy", "sad", "angry", "afraid", "scared", "fear", "love", "hate", "joy", "anger", "worried", "worry", "nervous", "anxious", "proud", "ashamed", "jealous", "lonely", "bored", "excited", "surprised", "upset", "calm", "grief", "hope", "despair", "tears", "cry", "laugh", "smile", "fury", "delight", "misery", "guilt", "relief"],
  travel: ["travel", "trip", "journey", "holiday", "vacation", "tourist", "passport", "luggage", "suitcase", "hotel", "map", "abroad", "visit", "voyage", "guide", "border", "ticket", "backpack"],
  airport: ["airport", "plane", "flight", "boarding", "gate", "pilot", "departure", "arrival", "terminal", "runway", "airline", "customs"],
  transport: ["car", "bus", "train", "taxi", "bike", "bicycle", "boat", "ship", "station", "platform", "road", "street", "traffic", "drive", "driver", "subway", "tube", "tram", "carriage", "coach", "wheel", "engine"],
  home: ["house", "home", "room", "kitchen", "bedroom", "bathroom", "door", "window", "floor", "wall", "roof", "stairs", "garden", "bed", "chair", "sofa", "table", "lamp", "key", "garage", "cupboard", "drawer", "fireplace", "attic", "cellar", "curtain"],
  people: ["mother", "father", "mum", "dad", "brother", "sister", "son", "daughter", "uncle", "aunt", "cousin", "grandmother", "grandfather", "wife", "husband", "child", "baby", "family", "friend", "neighbour", "neighbor", "man", "woman", "boy", "girl", "lady", "gentleman", "nephew", "niece", "widow"],
  nature: ["tree", "flower", "grass", "forest", "wood", "river", "lake", "sea", "ocean", "mountain", "hill", "valley", "beach", "sky", "sun", "moon", "star", "cloud", "rain", "snow", "wind", "storm", "weather", "leaf", "rock", "stone", "field", "island", "desert", "fog", "mist", "thunder", "lightning"],
  work: ["work", "job", "office", "boss", "manager", "colleague", "meeting", "salary", "career", "company", "business", "employee", "interview", "contract", "client", "deadline"],
  shopping: ["shop", "store", "buy", "sell", "price", "money", "cash", "card", "pay", "cheap", "expensive", "sale", "market", "cost", "pound", "dollar", "coin", "receipt"],
  time: ["day", "night", "morning", "evening", "afternoon", "week", "month", "year", "hour", "minute", "second", "today", "tomorrow", "yesterday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "clock", "season", "summer", "winter", "spring", "autumn"],
  tech: ["phone", "computer", "internet", "email", "app", "website", "screen", "laptop", "password", "online", "download", "battery", "charger", "camera"],
  dating: ["date", "flirt", "kiss", "crush", "boyfriend", "girlfriend", "romantic", "sweetheart", "darling", "lover", "marry", "wedding", "propose"],
};

/** Returns 1-3 theme ids for a term. `pos` is the English part of speech if known (noun, verb, adjective…). */
export function guessThemes(term: string, pos?: string): string[] {
  const t = normalize(term).replace(/^to /, "");
  const words = t.split(" ");
  const out: string[] = [];
  const p = (pos ?? "").toLowerCase();
  if (p.includes("phrasal")) out.push("phrasal-verbs");
  else if (p.startsWith("verb") || p === "modal") out.push("action-verbs");
  else if (p.startsWith("adj")) out.push("adjectives");
  if (words.length >= 3 && !out.length) out.push("idioms");
  const seed = seedByLemma(t);
  for (const th of seed?.themes ?? []) if (!out.includes(th)) out.push(th);
  for (const [theme, list] of Object.entries(KEYWORDS)) {
    if (words.some((w) => list.includes(w)) && !out.includes(theme)) out.push(theme);
  }
  if (!out.length) out.push("daily");
  return out.slice(0, 3);
}
