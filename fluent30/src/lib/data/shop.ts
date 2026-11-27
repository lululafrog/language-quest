// Tourist wardrobe: silly (and very touristy) items bought with coins earned by practising.
import type { AvatarSlot } from "../types";

/** Drawing spec read by components/avatar/Tourist.tsx. k = kind, c/c2 = colours, t = text, p = pattern. */
export interface Spec {
  k: string;
  c?: string;
  c2?: string;
  t?: string;
  p?: "flowers" | "dots" | "stripes" | "plaid" | "sequins" | "none";
}

export type ShopCategory =
  | "casquettes" | "bobs" | "chapeaux" | "lunettes" | "visage" | "hauts" | "ponchos" | "vestes" | "robes"
  | "jeans" | "shorts" | "chaussures" | "sacs" | "accessoires" | "mains" | "decors";

export interface ShopItem {
  id: string;
  slot: AvatarSlot;
  cat: ShopCategory;
  fr: string;
  en: string;
  price: number;
  rarity: "commun" | "rare" | "épique" | "légendaire";
  spec: Spec;
}

const rar = (price: number): ShopItem["rarity"] => (price >= 400 ? "légendaire" : price >= 180 ? "épique" : price >= 90 ? "rare" : "commun");
const I = (id: string, slot: AvatarSlot, cat: ShopCategory, fr: string, en: string, price: number, spec: Spec): ShopItem => ({ id, slot, cat, fr, en, price, rarity: rar(price), spec });

export const SHOP_ITEMS: ShopItem[] = [
  // ---------- Casquettes
  I("cap-red-ldn", "hat", "casquettes", "Casquette I ♥ London", "I ♥ London cap", 80, { k: "cap", c: "#E53935", t: "I♥LDN" }),
  I("cap-ny", "hat", "casquettes", "Casquette NY", "NY cap", 70, { k: "cap", c: "#1A237E", t: "NY" }),
  I("cap-usa", "hat", "casquettes", "Casquette USA", "USA cap", 70, { k: "cap", c: "#FFFFFF", t: "USA", c2: "#C62828" }),
  I("cap-tourist", "hat", "casquettes", "Casquette « TOURIST »", "“TOURIST” cap", 60, { k: "cap", c: "#FF7A00", t: "TOURIST" }),
  I("cap-pink", "hat", "casquettes", "Casquette rose bonbon", "Candy pink cap", 50, { k: "cap", c: "#FF8FB1" }),
  I("cap-green", "hat", "casquettes", "Casquette verte de randonneur", "Hiker's green cap", 50, { k: "cap", c: "#2E7D32" }),
  I("cap-back", "hat", "casquettes", "Casquette à l'envers", "Backwards cap", 60, { k: "capBack", c: "#212121" }),
  I("cap-visor", "hat", "casquettes", "Visière de tennis", "Tennis visor", 40, { k: "visor", c: "#FFFFFF" }),
  // ---------- Bobs
  I("hat-bob", "hat", "bobs", "Bob de camping", "Camping bucket hat", 40, { k: "bob", c: "#D8C38E" }),
  I("bob-fluo", "hat", "bobs", "Bob jaune fluo", "Neon yellow bucket hat", 50, { k: "bob", c: "#E6FF3B" }),
  I("bob-flowers", "hat", "bobs", "Bob à fleurs", "Flowery bucket hat", 70, { k: "bob", c: "#FF8FB1", p: "flowers" }),
  I("bob-fisher", "hat", "bobs", "Bob de pêcheur kaki", "Fisherman's bucket hat", 60, { k: "bob", c: "#7C8B5A" }),
  I("bob-rainbow", "hat", "bobs", "Bob arc-en-ciel", "Rainbow bucket hat", 110, { k: "bob", c: "#FF5252", p: "stripes", c2: "#FFD166" }),
  I("bob-dots", "hat", "bobs", "Bob à pois", "Polka-dot bucket hat", 60, { k: "bob", c: "#1E88E5", p: "dots" }),
  // ---------- Chapeaux
  I("hat-straw", "hat", "chapeaux", "Chapeau de paille", "Straw hat", 60, { k: "straw" }),
  I("hat-panama", "hat", "chapeaux", "Panama", "Panama hat", 90, { k: "panama" }),
  I("hat-beret", "hat", "chapeaux", "Béret (pour rester français)", "Beret", 50, { k: "beret", c: "#1A1740" }),
  I("hat-beanie", "hat", "chapeaux", "Bonnet à pompon", "Bobble hat", 50, { k: "beanie", c: "#E53935", c2: "#FFFFFF" }),
  I("hat-bowler", "hat", "chapeaux", "Chapeau melon (très British)", "Bowler hat", 120, { k: "bowler" }),
  I("hat-conical", "hat", "chapeaux", "Chapeau conique de rizière", "Conical rice hat", 90, { k: "conical" }),
  I("hat-cowboy", "hat", "chapeaux", "Chapeau de cowboy", "Cowboy hat", 120, { k: "cowboy" }),
  I("hat-sombrero", "hat", "chapeaux", "Sombrero géant", "Giant sombrero", 180, { k: "sombrero" }),
  I("hat-viking", "hat", "chapeaux", "Casque de viking", "Viking helmet", 220, { k: "viking" }),
  I("hat-crown", "hat", "chapeaux", "Couronne (en plastique) de la Reine", "The Queen's (plastic) crown", 500, { k: "crown" }),
  // ---------- Lunettes
  I("gl-heart", "glasses", "lunettes", "Lunettes cœur", "Heart glasses", 50, { k: "glHeart" }),
  I("gl-round", "glasses", "lunettes", "Lunettes rondes d'intello", "Round nerd glasses", 50, { k: "glRound" }),
  I("gl-big", "glasses", "lunettes", "Lunettes de soleil XXL", "XXL sunglasses", 70, { k: "glBig" }),
  I("gl-star", "glasses", "lunettes", "Lunettes étoiles", "Star glasses", 80, { k: "glStar" }),
  I("gl-aviator", "glasses", "lunettes", "Lunettes d'aviateur", "Aviator glasses", 90, { k: "glAviator" }),
  I("gl-3d", "glasses", "lunettes", "Lunettes 3D", "3D glasses", 60, { k: "gl3d" }),
  I("gl-snorkel", "glasses", "lunettes", "Masque de plongée", "Snorkel mask", 130, { k: "glSnorkel" }),
  // ---------- Visage
  I("face-sunburn", "face", "visage", "Coup de soleil", "Sunburn", 30, { k: "sunburn" }),
  I("face-tan", "face", "visage", "Marque de lunettes de soleil", "Sunglasses tan line", 40, { k: "tanline" }),
  I("face-zinc", "face", "visage", "Crème solaire mal étalée", "Badly spread sunscreen", 40, { k: "zinc" }),
  I("face-moustache", "face", "visage", "Moustache de gentleman", "Gentleman's moustache", 100, { k: "moustache" }),
  // ---------- Hauts
  I("top-white", "top", "hauts", "T-shirt blanc", "White T-shirt", 0, { k: "tee", c: "#FFFFFF" }),
  I("top-ilove", "top", "hauts", "T-shirt I ♥ NY", "I ♥ NY T-shirt", 70, { k: "tee", c: "#FFFFFF", t: "I♥NY" }),
  I("top-paris", "top", "hauts", "T-shirt I ♥ Paris", "I ♥ Paris T-shirt", 70, { k: "tee", c: "#F3E5F5", t: "I♥PARIS" }),
  I("top-bali", "top", "hauts", "T-shirt Bintang (souvenir de Bali)", "Bali souvenir tank", 70, { k: "tank", c: "#1B5E20", t: "BALI" }),
  I("top-mariniere", "top", "hauts", "Marinière", "Breton stripes", 80, { k: "stripes", c: "#FFFFFF", c2: "#1A237E" }),
  I("top-hawaii", "top", "hauts", "Chemise hawaïenne bleue", "Blue Hawaiian shirt", 120, { k: "hawaii", c: "#1E88E5", c2: "#FFD166" }),
  I("top-hawaii-red", "top", "hauts", "Chemise hawaïenne rouge", "Red Hawaiian shirt", 120, { k: "hawaii", c: "#E53935", c2: "#FFF8EE" }),
  I("top-plaid", "top", "hauts", "Chemise à carreaux", "Plaid shirt", 70, { k: "plaid", c: "#C62828", c2: "#1A1740" }),
  I("top-polo", "top", "hauts", "Polo de golfeur", "Golf polo", 60, { k: "polo", c: "#FFD166" }),
  I("top-football", "top", "hauts", "Maillot de foot", "Football shirt", 90, { k: "football", c: "#E53935", t: "10" }),
  // ---------- Ponchos
  I("top-rain", "outer", "ponchos", "Poncho de pluie jaune", "Yellow rain poncho", 90, { k: "poncho", c: "#FFE066" }),
  I("poncho-clear", "outer", "ponchos", "Poncho transparent (Londres oblige)", "See-through poncho", 70, { k: "poncho", c: "#B3E5FC", t: "clear" }),
  I("poncho-mexico", "outer", "ponchos", "Poncho mexicain rayé", "Striped Mexican poncho", 150, { k: "poncho", c: "#E53935", p: "stripes", c2: "#FFD166" }),
  I("poncho-disney", "outer", "ponchos", "Poncho de parc d'attractions", "Theme-park poncho", 80, { k: "poncho", c: "#CE93D8" }),
  // ---------- Vestes
  I("top-grab", "outer", "vestes", "Veste Grab de moto-taxi", "Grab motorbike-taxi jacket", 150, { k: "jacket", c: "#00B14F", t: "Grab" }),
  I("jk-denim", "outer", "vestes", "Veste en jean", "Denim jacket", 120, { k: "jacket", c: "#4F7CAC" }),
  I("jk-puffer", "outer", "vestes", "Doudoune", "Puffer jacket", 140, { k: "puffer", c: "#3949AB" }),
  I("jk-wind", "outer", "vestes", "Coupe-vent fluo", "Neon windbreaker", 90, { k: "jacket", c: "#C6FF00", c2: "#FF4081" }),
  I("jk-safari", "outer", "vestes", "Gilet multipoches de safari", "Safari vest", 110, { k: "safari", c: "#BFA77A" }),
  I("jk-trench", "outer", "vestes", "Trench de détective", "Detective's trench coat", 200, { k: "trench", c: "#C8A97E" }),
  I("top-lifejacket", "outer", "vestes", "Gilet de sauvetage", "Life jacket", 110, { k: "lifejacket" }),
  I("top-tuxedo", "outer", "vestes", "Smoking (pour l'heure du thé)", "Tuxedo (for tea time)", 300, { k: "tuxedo" }),
  // ---------- Robes
  I("dr-flowers", "dress", "robes", "Robe d'été à fleurs", "Flowery summer dress", 120, { k: "dress", c: "#FFB74D", p: "flowers" }),
  I("dr-red", "dress", "robes", "Petite robe rouge", "Little red dress", 120, { k: "dress", c: "#E53935" }),
  I("dr-dots", "dress", "robes", "Robe à pois", "Polka-dot dress", 110, { k: "dress", c: "#1A237E", p: "dots" }),
  I("dr-boho", "dress", "robes", "Robe longue bohème", "Long boho dress", 160, { k: "dressLong", c: "#A1887F", p: "flowers" }),
  I("dr-sequins", "dress", "robes", "Robe à paillettes", "Sequin dress", 350, { k: "dress", c: "#B388FF", p: "sequins" }),
  // ---------- Jeans & pantalons
  I("jn-blue", "bottom", "jeans", "Jean bleu", "Blue jeans", 60, { k: "pants", c: "#3F6FA8" }),
  I("jn-black", "bottom", "jeans", "Jean noir", "Black jeans", 60, { k: "pants", c: "#263238" }),
  I("jn-ripped", "bottom", "jeans", "Jean troué", "Ripped jeans", 80, { k: "pants", c: "#5C8BC4", t: "ripped" }),
  I("jn-flare", "bottom", "jeans", "Jean pattes d'eph'", "Flared jeans", 90, { k: "flare", c: "#4A78B5" }),
  I("pt-hiking", "bottom", "jeans", "Pantalon de rando zippé", "Zip-off hiking trousers", 70, { k: "pants", c: "#8D8F6B", t: "zip" }),
  I("pt-legging", "bottom", "jeans", "Legging fluo", "Neon leggings", 60, { k: "pants", c: "#FF4081", t: "slim" }),
  // ---------- Shorts & jupes
  I("sh-denim", "bottom", "shorts", "Short en jean", "Denim shorts", 40, { k: "shorts", c: "#7AA6C2" }),
  I("bot-cargo", "bottom", "shorts", "Bermuda à poches", "Cargo shorts", 50, { k: "cargo", c: "#BFA77A" }),
  I("bot-flower", "bottom", "shorts", "Short à fleurs", "Flowery shorts", 60, { k: "shorts", c: "#FF8FB1", p: "flowers" }),
  I("sk-pleated", "bottom", "shorts", "Jupe plissée", "Pleated skirt", 70, { k: "skirt", c: "#7E57C2" }),
  I("bot-kilt", "bottom", "shorts", "Kilt écossais", "Scottish kilt", 160, { k: "kilt" }),
  // ---------- Chaussures
  I("sh-flipflops", "shoes", "chaussures", "Tongs", "Flip-flops", 30, { k: "flipflops", c: "#2FBF9A" }),
  I("sh-crocs", "shoes", "chaussures", "Crocs (le classique du touriste)", "Crocs", 60, { k: "crocs", c: "#FF9800" }),
  I("sh-sockssandals", "shoes", "chaussures", "Chaussettes + sandales", "Socks with sandals", 80, { k: "socksSandals" }),
  I("sh-espadrilles", "shoes", "chaussures", "Espadrilles", "Espadrilles", 50, { k: "sneakers", c: "#1A237E", c2: "#E0C9A6" }),
  I("sh-sneakers-red", "shoes", "chaussures", "Baskets rouges", "Red sneakers", 60, { k: "sneakers", c: "#E53935", c2: "#FFFFFF" }),
  I("sh-hiking", "shoes", "chaussures", "Chaussures de rando", "Hiking boots", 90, { k: "boots", c: "#6D4C41", t: "low" }),
  I("sh-boots", "shoes", "chaussures", "Bottes de pluie", "Wellies", 70, { k: "boots", c: "#FFD166" }),
  I("sh-golden", "shoes", "chaussures", "Baskets en or", "Golden sneakers", 400, { k: "sneakers", c: "#FFD166", c2: "#FFF3D1" }),
  // ---------- Sacs
  I("bag-backpack", "bag", "sacs", "Gros sac à dos de routard", "Big backpacker's rucksack", 120, { k: "backpack", c: "#FF7043" }),
  I("bag-backpack-blue", "bag", "sacs", "Sac à dos bleu", "Blue backpack", 90, { k: "backpack", c: "#1E88E5" }),
  I("neck-banana", "bag", "sacs", "Sac banane", "Bum bag", 50, { k: "bumbag", c: "#6A55F2" }),
  I("bag-banana-fluo", "bag", "sacs", "Banane fluo", "Neon bum bag", 60, { k: "bumbag", c: "#C6FF00" }),
  I("bag-tote", "bag", "sacs", "Tote bag « I ♥ LONDON »", "“I ♥ LONDON” tote bag", 50, { k: "tote", c: "#F5F0E6", t: "I♥LDN" }),
  I("bag-pouch", "bag", "sacs", "Pochette passeport tour de cou", "Neck passport pouch", 40, { k: "pouch", c: "#8D6E63" }),
  // ---------- Accessoires
  I("neck-lei", "neck", "accessoires", "Collier de fleurs", "Flower lei", 60, { k: "lei" }),
  I("neck-camera", "neck", "accessoires", "Appareil photo jetable", "Disposable camera", 90, { k: "camera" }),
  I("neck-binoculars", "neck", "accessoires", "Jumelles", "Binoculars", 80, { k: "binoculars" }),
  I("neck-pillow", "neck", "accessoires", "Coussin de voyage", "Travel pillow", 70, { k: "pillow", c: "#8578FB" }),
  I("neck-scarf", "neck", "accessoires", "Écharpe de supporter", "Football scarf", 60, { k: "scarf", c: "#E53935", c2: "#FFFFFF" }),
  I("neck-badge", "neck", "accessoires", "Badge « Visiteur »", "“Visitor” badge", 30, { k: "badge" }),
  // ---------- Dans la main
  I("hand-baguette", "hand", "mains", "Baguette (pour rester français)", "Baguette", 30, { k: "baguette" }),
  I("hand-map", "hand", "mains", "Carte dépliée (à l'envers)", "Map (upside down)", 40, { k: "map" }),
  I("hand-guide", "hand", "mains", "Guide de voyage", "Travel guidebook", 50, { k: "guide" }),
  I("hand-phone", "hand", "mains", "Smartphone (GPS allumé)", "Smartphone", 40, { k: "phone" }),
  I("hand-tea", "hand", "mains", "Tasse de thé", "Cup of tea", 60, { k: "tea" }),
  I("hand-icecream", "hand", "mains", "Glace qui fond", "Melting ice cream", 50, { k: "icecream" }),
  I("hand-coconut", "hand", "mains", "Noix de coco avec paille", "Coconut with a straw", 70, { k: "coconut" }),
  I("hand-umbrella", "hand", "mains", "Parapluie", "Umbrella", 80, { k: "umbrella", c: "#6A55F2" }),
  I("hand-suitcase", "hand", "mains", "Valise à roulettes", "Wheeled suitcase", 90, { k: "suitcase", c: "#FF7A6B" }),
  I("hand-selfie", "hand", "mains", "Perche à selfie", "Selfie stick", 100, { k: "selfie" }),
  I("hand-duck", "hand", "mains", "Bouée canard", "Duck rubber ring", 140, { k: "duck" }),
  // ---------- Décors
  I("bg-home", "background", "decors", "Ma chambre", "My room", 0, { k: "home" }),
  I("bg-beach", "background", "decors", "Plage", "Beach", 100, { k: "beach" }),
  I("bg-airport", "background", "decors", "Aéroport", "Airport", 120, { k: "airport" }),
  I("bg-mountain", "background", "decors", "Montagne enneigée", "Snowy mountains", 150, { k: "mountain" }),
  I("bg-jungle", "background", "decors", "Jungle", "Jungle", 150, { k: "jungle" }),
  I("bg-desert", "background", "decors", "Désert", "Desert", 150, { k: "desert" }),
  I("bg-london", "background", "decors", "Londres", "London", 200, { k: "london" }),
  I("bg-paris", "background", "decors", "Paris", "Paris", 200, { k: "paris" }),
  I("bg-lombok", "background", "decors", "Lombok", "Lombok", 200, { k: "lombok" }),
  I("bg-tokyo", "background", "decors", "Tokyo", "Tokyo", 250, { k: "tokyo" }),
  I("bg-nyc", "background", "decors", "New York", "New York", 250, { k: "nyc" }),
  I("bg-space", "background", "decors", "Station spatiale", "Space station", 800, { k: "space" }),
];

export const SHOP_BY_ID = new Map(SHOP_ITEMS.map((i) => [i.id, i]));

/** Legacy ids from the first wardrobe → new ids. */
export const LEGACY_IDS: Record<string, string> = { "hat-london": "cap-red-ldn" };

export const CATEGORIES: { id: ShopCategory; fr: string; en: string; emoji: string }[] = [
  { id: "casquettes", fr: "Casquettes", en: "Caps", emoji: "🧢" },
  { id: "bobs", fr: "Bobs", en: "Bucket hats", emoji: "👒" },
  { id: "chapeaux", fr: "Chapeaux", en: "Hats", emoji: "🎩" },
  { id: "lunettes", fr: "Lunettes", en: "Glasses", emoji: "🕶️" },
  { id: "visage", fr: "Visage", en: "Face", emoji: "😎" },
  { id: "hauts", fr: "T-shirts & chemises", en: "Tops", emoji: "👕" },
  { id: "ponchos", fr: "Ponchos", en: "Ponchos", emoji: "🌧️" },
  { id: "vestes", fr: "Vestes", en: "Jackets", emoji: "🧥" },
  { id: "robes", fr: "Robes", en: "Dresses", emoji: "👗" },
  { id: "jeans", fr: "Jeans & pantalons", en: "Jeans & trousers", emoji: "👖" },
  { id: "shorts", fr: "Shorts & jupes", en: "Shorts & skirts", emoji: "🩳" },
  { id: "chaussures", fr: "Chaussures", en: "Shoes", emoji: "👟" },
  { id: "sacs", fr: "Sacs", en: "Bags", emoji: "🎒" },
  { id: "accessoires", fr: "Accessoires", en: "Accessories", emoji: "📷" },
  { id: "mains", fr: "Dans la main", en: "In hand", emoji: "🥖" },
  { id: "decors", fr: "Décors", en: "Scenes", emoji: "🏝️" },
];

// ---------- Appearance (free) ----------
export const SKIN_TONES = ["#FFE0C7", "#F9CFA8", "#E8B38A", "#C98E63", "#9C6644", "#6B4430"];
export const HAIR_COLORS = ["#2B1B12", "#6B4226", "#A0612E", "#E3B860", "#C9502C", "#9E9E9E", "#F2F2F2", "#7E57C2", "#26A69A"];
export const HAIR_STYLES: { id: import("../types").Appearance["hair"]; fr: string; en: string }[] = [
  { id: "short", fr: "Courts", en: "Short" },
  { id: "buzz", fr: "Très courts", en: "Buzz cut" },
  { id: "bob", fr: "Carré", en: "Bob" },
  { id: "long", fr: "Longs", en: "Long" },
  { id: "ponytail", fr: "Queue de cheval", en: "Ponytail" },
  { id: "bun", fr: "Chignon", en: "Bun" },
  { id: "curly", fr: "Bouclés", en: "Curly" },
  { id: "afro", fr: "Afro", en: "Afro" },
  { id: "bald", fr: "Chauve", en: "Bald" },
];
export const EYES: { id: import("../types").Appearance["eyes"]; fr: string; en: string }[] = [
  { id: "round", fr: "Ronds", en: "Round" },
  { id: "happy", fr: "Rieurs", en: "Smiling" },
  { id: "lashes", fr: "Avec cils", en: "Lashes" },
];
