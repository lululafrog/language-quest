// Travel wardrobe: items bought with coins earned by practising, or earned by real progress
// (destination missions, lessons, mastered words, books, regularity).
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
  | "casquettes" | "bobs" | "chapeaux" | "bonnets" | "lunettes" | "tshirts" | "chemises" | "pulls" | "vestes" | "ponchos"
  | "jeans" | "pantalons" | "shorts" | "jupes" | "robes" | "maillots" | "chaussures" | "sandales" | "sacsados" | "valises"
  | "bijoux" | "sport" | "objets" | "visage" | "decors";

export type Collection =
  | "backpacker" | "tropical" | "adventure" | "citytrip" | "winter" | "beach" | "safari" | "hiking" | "surf" | "diving"
  | "eusummer" | "airport" | "literary";

/** Earned (not buyable) item: unlocked by real progress, checked by lib/game.ts → checkEarnedItems(). */
export interface EarnRule {
  kind: "lessons" | "missions" | "books" | "mastered" | "streak";
  n: number;
  /** destination id for "missions" (mission ids are prefixed "<dest>-") */
  dest?: string;
  fr: string;
  en: string;
}

export interface ShopItem {
  id: string;
  slot: AvatarSlot;
  cat: ShopCategory;
  fr: string;
  en: string;
  price: number;
  rarity: "commun" | "rare" | "épique" | "légendaire";
  spec: Spec;
  col?: Collection;
  /** exclusive item: granted when the learner finishes one of these books (Gutenberg / library ids) */
  unlock?: { ids: number[]; fr: string; en: string };
  /** exclusive item: granted by real progress (lessons, destination missions, books, mastered words, regularity) */
  earn?: EarnRule;
}

const rar = (price: number): ShopItem["rarity"] => (price >= 400 ? "légendaire" : price >= 180 ? "épique" : price >= 90 ? "rare" : "commun");
const I = (id: string, slot: AvatarSlot, cat: ShopCategory, fr: string, en: string, price: number, spec: Spec, col?: Collection): ShopItem => ({ id, slot, cat, fr, en, price, rarity: rar(price), spec, col });
const E = (id: string, slot: AvatarSlot, cat: ShopCategory, fr: string, en: string, spec: Spec, earn: EarnRule, col?: Collection, rarity: ShopItem["rarity"] = "épique"): ShopItem => ({ id, slot, cat, fr, en, price: 0, rarity, spec, col, earn });

const mission = (dest: string, n: number, cityFr: string, cityEn: string): EarnRule => ({ kind: "missions", dest, n, fr: `${n} mission${n > 1 ? "s" : ""} réussie${n > 1 ? "s" : ""} à ${cityFr}`, en: `${n} mission${n > 1 ? "s" : ""} completed in ${cityEn}` });

export const SHOP_ITEMS: ShopItem[] = [
  // ---------- Casquettes
  I("cap-red-ldn", "hat", "casquettes", "Casquette I ♥ London", "I ♥ London cap", 80, { k: "cap", c: "#B23A3A", t: "I♥LDN" }, "citytrip"),
  I("cap-ny", "hat", "casquettes", "Casquette NY", "NY cap", 70, { k: "cap", c: "#2B3A55", t: "NY" }, "citytrip"),
  I("cap-usa", "hat", "casquettes", "Casquette USA", "USA cap", 70, { k: "cap", c: "#FBF7F0", t: "USA", c2: "#B23A3A" }, "citytrip"),
  I("cap-tourist", "hat", "casquettes", "Casquette « TOURIST »", "“TOURIST” cap", 60, { k: "cap", c: "#D9773F", t: "TOURIST" }, "backpacker"),
  I("cap-pink", "hat", "casquettes", "Casquette vieux rose", "Dusty pink cap", 50, { k: "cap", c: "#D9A0A0" }, "eusummer"),
  I("cap-green", "hat", "casquettes", "Casquette verte de randonneur", "Hiker's green cap", 50, { k: "cap", c: "#6F8F6A" }, "hiking"),
  I("cap-back", "hat", "casquettes", "Casquette à l'envers", "Backwards cap", 60, { k: "capBack", c: "#2F2A28" }, "surf"),
  I("cap-visor", "hat", "casquettes", "Visière de tennis", "Tennis visor", 40, { k: "visor", c: "#FBF7F0" }, "beach"),
  // ---------- Bobs
  I("hat-bob", "hat", "bobs", "Bob de camping", "Camping bucket hat", 40, { k: "bob", c: "#D8C38E" }, "backpacker"),
  I("bob-fluo", "hat", "bobs", "Bob jaune soleil", "Sunshine bucket hat", 50, { k: "bob", c: "#E9C46A" }, "beach"),
  I("bob-flowers", "hat", "bobs", "Bob à fleurs", "Flowery bucket hat", 70, { k: "bob", c: "#D9A0A0", p: "flowers" }, "tropical"),
  I("bob-fisher", "hat", "bobs", "Bob de pêcheur kaki", "Fisherman's bucket hat", 60, { k: "bob", c: "#7C8B5A" }, "hiking"),
  I("bob-rainbow", "hat", "bobs", "Bob rayé terracotta", "Terracotta striped bucket hat", 110, { k: "bob", c: "#C9785A", p: "stripes", c2: "#E9C46A" }, "eusummer"),
  I("bob-dots", "hat", "bobs", "Bob à pois", "Polka-dot bucket hat", 60, { k: "bob", c: "#4C6E8A", p: "dots" }, "citytrip"),
  // ---------- Chapeaux
  I("hat-straw", "hat", "chapeaux", "Chapeau de paille", "Straw hat", 60, { k: "straw" }, "beach"),
  I("hat-panama", "hat", "chapeaux", "Panama", "Panama hat", 90, { k: "panama" }, "eusummer"),
  I("hat-beret", "hat", "chapeaux", "Béret (pour rester français)", "Beret", 50, { k: "beret", c: "#2B3A55" }, "citytrip"),
  I("hat-bowler", "hat", "chapeaux", "Chapeau melon (très British)", "Bowler hat", 120, { k: "bowler" }, "citytrip"),
  I("hat-conical", "hat", "chapeaux", "Chapeau conique de rizière", "Conical rice hat", 90, { k: "conical" }, "tropical"),
  I("hat-cowboy", "hat", "chapeaux", "Chapeau de cowboy", "Cowboy hat", 120, { k: "cowboy" }, "adventure"),
  I("hat-sombrero", "hat", "chapeaux", "Sombrero géant", "Giant sombrero", 180, { k: "sombrero" }, "tropical"),
  I("hat-viking", "hat", "chapeaux", "Casque de viking", "Viking helmet", 220, { k: "viking" }, "adventure"),
  I("hat-crown", "hat", "chapeaux", "Couronne (en plastique) de la Reine", "The Queen's (plastic) crown", 500, { k: "crown" }, "citytrip"),
  // ---------- Bonnets
  I("hat-beanie", "hat", "bonnets", "Bonnet à pompon", "Bobble hat", 50, { k: "beanie", c: "#B23A3A", c2: "#FBF7F0" }, "winter"),
  I("beanie-sage", "hat", "bonnets", "Bonnet côtelé vert sauge", "Sage ribbed beanie", 50, { k: "beanie", c: "#8FAF8A", c2: "#7F9C7A", t: "plain" }, "hiking"),
  I("beanie-chullo", "hat", "bonnets", "Bonnet péruvien à oreillettes", "Andean chullo hat", 90, { k: "chullo", c: "#2B3A55", c2: "#E9C46A" }, "winter"),
  I("beanie-ski", "hat", "bonnets", "Bonnet de ski sable", "Sand ski beanie", 60, { k: "beanie", c: "#E6D6BF", c2: "#C9785A" }, "winter"),
  // ---------- Lunettes
  I("gl-heart", "glasses", "lunettes", "Lunettes cœur", "Heart glasses", 50, { k: "glHeart" }, "beach"),
  I("gl-round", "glasses", "lunettes", "Lunettes rondes d'intello", "Round nerd glasses", 50, { k: "glRound" }, "citytrip"),
  I("gl-big", "glasses", "lunettes", "Lunettes de soleil XXL", "XXL sunglasses", 70, { k: "glBig" }, "airport"),
  I("gl-star", "glasses", "lunettes", "Lunettes étoiles", "Star glasses", 80, { k: "glStar" }, "eusummer"),
  I("gl-aviator", "glasses", "lunettes", "Lunettes d'aviateur", "Aviator glasses", 90, { k: "glAviator" }, "airport"),
  I("gl-3d", "glasses", "lunettes", "Lunettes 3D", "3D glasses", 60, { k: "gl3d" }),
  I("gl-snorkel", "glasses", "lunettes", "Masque de plongée", "Snorkel mask", 130, { k: "glSnorkel" }, "diving"),
  // ---------- Visage
  I("face-sunburn", "face", "visage", "Coup de soleil", "Sunburn", 30, { k: "sunburn" }, "beach"),
  I("face-tan", "face", "visage", "Marque de lunettes de soleil", "Sunglasses tan line", 40, { k: "tanline" }, "beach"),
  I("face-zinc", "face", "visage", "Crème solaire mal étalée", "Badly spread sunscreen", 40, { k: "zinc" }, "surf"),
  I("face-moustache", "face", "visage", "Moustache de gentleman", "Gentleman's moustache", 100, { k: "moustache" }),
  // ---------- T-shirts
  I("top-white", "top", "tshirts", "T-shirt blanc", "White T-shirt", 0, { k: "tee", c: "#FBF7F0" }, "backpacker"),
  I("top-ilove", "top", "tshirts", "T-shirt I ♥ NY", "I ♥ NY T-shirt", 70, { k: "tee", c: "#FBF7F0", t: "I♥NY" }, "citytrip"),
  I("top-paris", "top", "tshirts", "T-shirt I ♥ Paris", "I ♥ Paris T-shirt", 70, { k: "tee", c: "#F1E4E8", t: "I♥PARIS" }, "citytrip"),
  I("top-bali", "top", "tshirts", "Débardeur souvenir de Bali", "Bali souvenir tank", 70, { k: "tank", c: "#3F6B4F", t: "BALI" }, "tropical"),
  I("top-mariniere", "top", "tshirts", "Marinière", "Breton stripes", 80, { k: "stripes", c: "#FBF7F0", c2: "#2B3A55" }, "eusummer"),
  I("top-football", "top", "tshirts", "Maillot de foot", "Football shirt", 90, { k: "football", c: "#B23A3A", t: "10" }),
  I("tee-sage", "top", "tshirts", "T-shirt vert sauge", "Sage green T-shirt", 30, { k: "tee", c: "#A9BFA0" }, "hiking"),
  // ---------- Chemises
  I("top-hawaii", "top", "chemises", "Chemise hawaïenne bleue", "Blue Hawaiian shirt", 120, { k: "hawaii", c: "#4C8DA8", c2: "#E9C46A" }, "tropical"),
  I("top-hawaii-red", "top", "chemises", "Chemise hawaïenne terracotta", "Terracotta Hawaiian shirt", 120, { k: "hawaii", c: "#C9785A", c2: "#FBF7F0" }, "tropical"),
  I("top-plaid", "top", "chemises", "Chemise à carreaux", "Plaid shirt", 70, { k: "plaid", c: "#A33B3B", c2: "#2F2A28" }, "hiking"),
  I("top-polo", "top", "chemises", "Polo de golfeur", "Golf polo", 60, { k: "polo", c: "#E9C46A" }, "eusummer"),
  I("shirt-linen", "top", "chemises", "Chemise en lin", "Linen shirt", 80, { k: "shirt", c: "#F1E7D6" }, "eusummer"),
  I("shirt-denim", "top", "chemises", "Chemise en jean", "Denim shirt", 90, { k: "shirt", c: "#6A8DB0" }, "citytrip"),
  // ---------- Pulls
  I("pull-cream", "top", "pulls", "Pull en maille crème", "Cream knit jumper", 90, { k: "sweater", c: "#EFE4D2" }, "winter"),
  I("pull-fairisle", "top", "pulls", "Pull jacquard", "Fair Isle jumper", 140, { k: "sweater", c: "#2B3A55", c2: "#E9C46A", t: "fairisle" }, "winter"),
  I("pull-turtle", "top", "pulls", "Col roulé terracotta", "Terracotta turtleneck", 100, { k: "turtleneck", c: "#C9785A" }, "citytrip"),
  I("pull-hoodie", "top", "pulls", "Sweat à capuche sable", "Sand hoodie", 80, { k: "hoodie", c: "#D9C7A7" }, "airport"),
  // ---------- Ponchos
  I("top-rain", "outer", "ponchos", "Poncho de pluie jaune", "Yellow rain poncho", 90, { k: "poncho", c: "#E9C46A" }, "adventure"),
  I("poncho-clear", "outer", "ponchos", "Poncho transparent (Londres oblige)", "See-through poncho", 70, { k: "poncho", c: "#B3D5E0", t: "clear" }, "citytrip"),
  I("poncho-mexico", "outer", "ponchos", "Poncho rayé tissé main", "Hand-woven striped poncho", 150, { k: "poncho", c: "#B23A3A", p: "stripes", c2: "#E9C46A" }, "adventure"),
  I("poncho-disney", "outer", "ponchos", "Poncho de parc d'attractions", "Theme-park poncho", 80, { k: "poncho", c: "#B9A3C9" }),
  // ---------- Vestes
  I("top-grab", "outer", "vestes", "Veste Grab de moto-taxi", "Grab motorbike-taxi jacket", 150, { k: "jacket", c: "#00A651", t: "Grab" }, "tropical"),
  I("jk-denim", "outer", "vestes", "Veste en jean", "Denim jacket", 120, { k: "jacket", c: "#5F84A8" }, "citytrip"),
  I("jk-puffer", "outer", "vestes", "Doudoune", "Puffer jacket", 140, { k: "puffer", c: "#3F5470" }, "winter"),
  I("jk-wind", "outer", "vestes", "Coupe-vent", "Windbreaker", 90, { k: "jacket", c: "#8FAF8A", c2: "#C9785A" }, "hiking"),
  I("jk-safari", "outer", "vestes", "Gilet multipoches de safari", "Safari vest", 110, { k: "safari", c: "#BFA77A" }, "safari"),
  I("jk-trench", "outer", "vestes", "Trench de détective", "Detective's trench coat", 200, { k: "trench", c: "#C8A97E" }, "citytrip"),
  I("top-lifejacket", "outer", "vestes", "Gilet de sauvetage", "Life jacket", 110, { k: "lifejacket" }, "diving"),
  I("top-tuxedo", "outer", "vestes", "Smoking (pour l'heure du thé)", "Tuxedo (for tea time)", 300, { k: "tuxedo" }),
  I("jk-fleece", "outer", "vestes", "Polaire de randonnée", "Hiking fleece", 100, { k: "fleece", c: "#7F9C7A" }, "hiking"),
  I("jk-hoodiezip", "outer", "vestes", "Sweat zippé d'aéroport", "Airport zip hoodie", 90, { k: "hoodieZip", c: "#8A8F98" }, "airport"),
  // ---------- Jeans
  I("jn-blue", "bottom", "jeans", "Jean bleu", "Blue jeans", 60, { k: "pants", c: "#4A6E96" }, "citytrip"),
  I("jn-black", "bottom", "jeans", "Jean noir", "Black jeans", 60, { k: "pants", c: "#2F3236" }, "citytrip"),
  I("jn-ripped", "bottom", "jeans", "Jean troué", "Ripped jeans", 80, { k: "pants", c: "#6A8DB0", t: "ripped" }, "backpacker"),
  I("jn-flare", "bottom", "jeans", "Jean pattes d'eph'", "Flared jeans", 90, { k: "flare", c: "#5779A0" }, "eusummer"),
  // ---------- Pantalons
  I("pt-hiking", "bottom", "pantalons", "Pantalon de rando zippé", "Zip-off hiking trousers", 70, { k: "pants", c: "#8D8F6B", t: "zip" }, "hiking"),
  I("pt-legging", "bottom", "pantalons", "Legging de sport", "Sports leggings", 60, { k: "pants", c: "#3F4A5A", t: "slim" }, "airport"),
  I("pt-chino", "bottom", "pantalons", "Chino beige", "Beige chinos", 70, { k: "pants", c: "#CDB894" }, "citytrip"),
  I("pt-linen", "bottom", "pantalons", "Pantalon en lin", "Linen trousers", 80, { k: "pants", c: "#EFE6D6" }, "eusummer"),
  // ---------- Shorts
  I("sh-denim", "bottom", "shorts", "Short en jean", "Denim shorts", 40, { k: "shorts", c: "#8FA9B8" }, "backpacker"),
  I("bot-cargo", "bottom", "shorts", "Bermuda à poches", "Cargo shorts", 50, { k: "cargo", c: "#BFA77A" }, "safari"),
  I("bot-flower", "bottom", "shorts", "Short à fleurs", "Flowery shorts", 60, { k: "shorts", c: "#D9A0A0", p: "flowers" }, "tropical"),
  // ---------- Jupes
  I("sk-pleated", "bottom", "jupes", "Jupe plissée", "Pleated skirt", 70, { k: "skirt", c: "#7E6A9A" }, "citytrip"),
  I("bot-kilt", "bottom", "jupes", "Kilt écossais", "Scottish kilt", 160, { k: "kilt" }, "adventure"),
  I("sk-denim", "bottom", "jupes", "Jupe en jean", "Denim skirt", 60, { k: "denimskirt", c: "#5F84A8" }, "eusummer"),
  I("sk-long", "bottom", "jupes", "Jupe longue terracotta", "Terracotta maxi skirt", 90, { k: "longskirt", c: "#C9785A" }, "tropical"),
  // ---------- Robes
  I("dr-flowers", "dress", "robes", "Robe d'été à fleurs", "Flowery summer dress", 120, { k: "dress", c: "#E3A66B", p: "flowers" }, "eusummer"),
  I("dr-red", "dress", "robes", "Petite robe rouge", "Little red dress", 120, { k: "dress", c: "#B23A3A" }, "citytrip"),
  I("dr-dots", "dress", "robes", "Robe à pois", "Polka-dot dress", 110, { k: "dress", c: "#2B3A55", p: "dots" }, "eusummer"),
  I("dr-boho", "dress", "robes", "Robe longue bohème", "Long boho dress", 160, { k: "dressLong", c: "#A1887F", p: "flowers" }, "tropical"),
  I("dr-sequins", "dress", "robes", "Robe à paillettes", "Sequin dress", 350, { k: "dress", c: "#8C7AA8", p: "sequins" }),
  I("dr-sage", "dress", "robes", "Robe chemise vert sauge", "Sage shirt dress", 120, { k: "dress", c: "#8FAF8A" }, "airport"),
  // ---------- Maillots de bain
  I("sw-one", "dress", "maillots", "Maillot une pièce terracotta", "Terracotta swimsuit", 80, { k: "swimsuit", c: "#C9785A", c2: "#E9C46A" }, "beach"),
  I("sw-flowers", "dress", "maillots", "Maillot à fleurs", "Flowery swimsuit", 90, { k: "swimsuit", c: "#4C8DA8", p: "flowers" }, "tropical"),
  I("sw-board", "bottom", "maillots", "Short de bain", "Board shorts", 60, { k: "boardshorts", c: "#4C8DA8", c2: "#E9C46A" }, "surf"),
  I("sw-board-palm", "bottom", "maillots", "Short de bain à fleurs", "Flowery board shorts", 70, { k: "boardshorts", c: "#3F6B4F", p: "flowers" }, "beach"),
  I("sw-rash", "top", "maillots", "Lycra de surf", "Surf rash guard", 80, { k: "rashguard", c: "#2B3A55", c2: "#E9C46A" }, "surf"),
  I("sw-wetsuit", "dress", "maillots", "Combinaison de plongée", "Wetsuit", 160, { k: "wetsuit", c: "#263238", c2: "#4C8DA8" }, "diving"),
  // ---------- Chaussures
  I("sh-crocs", "shoes", "chaussures", "Crocs (le classique du touriste)", "Crocs", 60, { k: "crocs", c: "#D9773F" }),
  I("sh-espadrilles", "shoes", "chaussures", "Espadrilles", "Espadrilles", 50, { k: "sneakers", c: "#2B3A55", c2: "#E0C9A6" }, "eusummer"),
  I("sh-sneakers-red", "shoes", "chaussures", "Baskets rouges", "Red sneakers", 60, { k: "sneakers", c: "#B23A3A", c2: "#FBF7F0" }, "citytrip"),
  I("sh-hiking", "shoes", "chaussures", "Chaussures de rando", "Hiking boots", 90, { k: "boots", c: "#6D4C41", t: "low" }, "hiking"),
  I("sh-boots", "shoes", "chaussures", "Bottes de pluie", "Wellies", 70, { k: "boots", c: "#E9C46A" }, "adventure"),
  I("sh-golden", "shoes", "chaussures", "Baskets dorées", "Golden sneakers", 400, { k: "sneakers", c: "#D4A64A", c2: "#FFF3D1" }),
  I("sh-loafers", "shoes", "chaussures", "Mocassins", "Loafers", 80, { k: "loafers", c: "#7A4E35" }, "citytrip"),
  // ---------- Sandales
  I("sh-flipflops", "shoes", "sandales", "Tongs", "Flip-flops", 30, { k: "flipflops", c: "#5FA894" }, "beach"),
  I("sh-sockssandals", "shoes", "sandales", "Chaussettes + sandales", "Socks with sandals", 80, { k: "socksSandals" }, "backpacker"),
  I("sh-sandals", "shoes", "sandales", "Sandales de randonnée", "Hiking sandals", 60, { k: "sandals", c: "#5A4636" }, "adventure"),
  I("sh-sandals-tan", "shoes", "sandales", "Sandales en cuir", "Leather sandals", 70, { k: "sandals", c: "#B07A4F" }, "eusummer"),
  // ---------- Sacs à dos
  I("bag-backpack", "bag", "sacsados", "Gros sac à dos de routard", "Big backpacker's rucksack", 120, { k: "backpack", c: "#C9785A" }, "backpacker"),
  I("bag-backpack-blue", "bag", "sacsados", "Sac à dos bleu", "Blue backpack", 90, { k: "backpack", c: "#4C6E8A" }, "citytrip"),
  I("bag-hike", "bag", "sacsados", "Sac de rando avec tapis", "Hiking pack with bedroll", 140, { k: "backpack", c: "#7F9C7A", c2: "#C9785A", t: "hike" }, "hiking"),
  I("bag-mini", "bag", "sacsados", "Petit sac à dos sable", "Small sand daypack", 70, { k: "backpack", c: "#D9C7A7", c2: "#E9C46A", t: "mini" }, "airport"),
  // ---------- Valises
  I("hand-suitcase", "hand", "valises", "Valise à roulettes", "Wheeled suitcase", 90, { k: "suitcase", c: "#C9785A" }, "airport"),
  I("case-hard", "hand", "valises", "Valise rigide vert sauge", "Sage hard-shell suitcase", 120, { k: "suitcaseHard", c: "#7F9C7A" }, "airport"),
  I("case-stickers", "hand", "valises", "Valise vintage à autocollants", "Vintage suitcase with stickers", 160, { k: "suitcaseHard", c: "#8C5A3C", t: "stickers" }, "backpacker"),
  // ---------- Bijoux
  I("neck-lei", "neck", "bijoux", "Collier de fleurs", "Flower lei", 60, { k: "lei" }, "tropical"),
  I("jw-shells", "neck", "bijoux", "Collier de coquillages", "Shell necklace", 50, { k: "shells" }, "beach"),
  I("jw-compass", "neck", "bijoux", "Pendentif boussole", "Compass pendant", 120, { k: "compass" }, "adventure"),
  I("jw-pearls", "neck", "bijoux", "Collier de perles", "Pearl necklace", 150, { k: "pearls" }, "citytrip"),
  I("jw-bracelets", "neck", "bijoux", "Bracelets brésiliens", "Friendship bracelets", 40, { k: "bracelets" }, "backpacker"),
  I("jw-hoops", "face", "bijoux", "Créoles dorées", "Gold hoop earrings", 70, { k: "earrings" }, "eusummer"),
  I("jw-studs", "face", "bijoux", "Puces d'oreilles nacrées", "Pearl stud earrings", 50, { k: "studs" }, "citytrip"),
  // ---------- Accessoires sportifs
  I("neck-scarf", "neck", "sport", "Écharpe de supporter", "Football scarf", 60, { k: "scarf", c: "#B23A3A", c2: "#FBF7F0" }),
  I("sp-sweatband", "hat", "sport", "Bandeau éponge", "Sweatband", 30, { k: "sweatband", c: "#FBF7F0", c2: "#C9785A" }),
  I("sp-racket", "hand", "sport", "Raquette de tennis", "Tennis racket", 80, { k: "racket", c: "#C9785A" }),
  I("sp-surfboard", "hand", "sport", "Planche de surf", "Surfboard", 180, { k: "surfboard", c: "#F4EBDD", c2: "#4C8DA8" }, "surf"),
  I("sp-ball", "hand", "sport", "Ballon de foot", "Football", 40, { k: "ball" }),
  // ---------- Objets de voyage
  I("neck-banana", "bag", "objets", "Sac banane", "Bum bag", 50, { k: "bumbag", c: "#4C6E8A" }, "backpacker"),
  I("bag-banana-fluo", "bag", "objets", "Banane moutarde", "Mustard bum bag", 60, { k: "bumbag", c: "#D4A64A" }, "airport"),
  I("bag-tote", "bag", "objets", "Tote bag « I ♥ LONDON »", "“I ♥ LONDON” tote bag", 50, { k: "tote", c: "#F5F0E6", t: "I♥LDN" }, "citytrip"),
  I("bag-pouch", "bag", "objets", "Pochette passeport tour de cou", "Neck passport pouch", 40, { k: "pouch", c: "#8D6E63" }, "airport"),
  I("neck-camera", "neck", "objets", "Appareil photo jetable", "Disposable camera", 90, { k: "camera" }, "citytrip"),
  I("neck-binoculars", "neck", "objets", "Jumelles", "Binoculars", 80, { k: "binoculars" }, "safari"),
  I("neck-pillow", "neck", "objets", "Coussin de voyage", "Travel pillow", 70, { k: "pillow", c: "#9FB4C7" }, "airport"),
  I("neck-badge", "neck", "objets", "Badge « Visiteur »", "“Visitor” badge", 30, { k: "badge" }),
  I("hand-baguette", "hand", "objets", "Baguette (pour rester français)", "Baguette", 30, { k: "baguette" }, "eusummer"),
  I("hand-map", "hand", "objets", "Carte dépliée (à l'envers)", "Map (upside down)", 40, { k: "map" }, "backpacker"),
  I("hand-guide", "hand", "objets", "Guide de voyage", "Travel guidebook", 50, { k: "guide" }, "backpacker"),
  I("hand-phone", "hand", "objets", "Smartphone (GPS allumé)", "Smartphone", 40, { k: "phone" }, "citytrip"),
  I("hand-tea", "hand", "objets", "Tasse de thé", "Cup of tea", 60, { k: "tea" }, "citytrip"),
  I("hand-icecream", "hand", "objets", "Glace qui fond", "Melting ice cream", 50, { k: "icecream" }, "eusummer"),
  I("hand-coconut", "hand", "objets", "Noix de coco avec paille", "Coconut with a straw", 70, { k: "coconut" }, "tropical"),
  I("hand-umbrella", "hand", "objets", "Parapluie", "Umbrella", 80, { k: "umbrella", c: "#4C6E8A" }, "citytrip"),
  I("hand-selfie", "hand", "objets", "Perche à selfie", "Selfie stick", 100, { k: "selfie" }),
  I("hand-duck", "hand", "objets", "Bouée canard", "Duck rubber ring", 140, { k: "duck" }, "beach"),
  // ---------- Décors
  I("bg-home", "background", "decors", "Ma chambre", "My room", 0, { k: "home" }),
  I("bg-beach", "background", "decors", "Plage", "Beach", 100, { k: "beach" }, "beach"),
  I("bg-airport", "background", "decors", "Aéroport", "Airport", 120, { k: "airport" }, "airport"),
  I("bg-mountain", "background", "decors", "Montagne enneigée", "Snowy mountains", 150, { k: "mountain" }, "winter"),
  I("bg-jungle", "background", "decors", "Jungle", "Jungle", 150, { k: "jungle" }, "adventure"),
  I("bg-desert", "background", "decors", "Désert", "Desert", 150, { k: "desert" }, "safari"),
  I("bg-london", "background", "decors", "Londres", "London", 200, { k: "london" }, "citytrip"),
  I("bg-paris", "background", "decors", "Paris", "Paris", 200, { k: "paris" }, "eusummer"),
  I("bg-lombok", "background", "decors", "Lombok", "Lombok", 200, { k: "lombok" }, "tropical"),
  I("bg-tokyo", "background", "decors", "Tokyo", "Tokyo", 250, { k: "tokyo" }, "citytrip"),
  I("bg-nyc", "background", "decors", "New York", "New York", 250, { k: "nyc" }, "citytrip"),
  I("bg-space", "background", "decors", "Station spatiale", "Space station", 800, { k: "space" }),

  // ---------- Earned by real progress (destination exclusives first)
  E("x-london-raincoat", "outer", "vestes", "Imperméable de Londres", "London raincoat", { k: "raincoat", c: "#2B3A55" }, mission("london", 2, "Londres", "London"), "citytrip"),
  E("x-london-tartan", "neck", "bijoux", "Écharpe tartan", "Tartan scarf", { k: "scarfPlaid", c: "#A33B3B", c2: "#2E4A3A" }, mission("london", 4, "Londres", "London"), "winter"),
  E("x-ny-hoodie", "top", "pulls", "Sweat à capuche NYC", "NYC hoodie", { k: "hoodie", c: "#3F5470", c2: "#FBF7F0", t: "NYC" }, mission("newyork", 2, "New York", "New York"), "citytrip"),
  E("x-ny-cap", "hat", "casquettes", "Casquette de Brooklyn", "Brooklyn cap", { k: "cap", c: "#2F2A28", t: "BKLYN" }, mission("newyork", 4, "New York", "New York"), "citytrip"),
  E("x-bali-sarong", "bottom", "jupes", "Sarong batik de Bali", "Balinese batik sarong", { k: "sarong", c: "#3F6B4F", p: "flowers", c2: "#E9C46A" }, mission("bali", 2, "Bali", "Bali"), "tropical"),
  E("x-bali-flowers", "hat", "bijoux", "Fleur de frangipanier", "Frangipani flower", { k: "flowerpin" }, mission("bali", 4, "Bali", "Bali"), "tropical"),
  E("x-sydney-bushhat", "hat", "chapeaux", "Chapeau de brousse", "Australian bush hat", { k: "bushhat", c: "#8C6A4A" }, mission("sydney", 2, "Sydney", "Sydney"), "adventure"),
  E("x-sydney-board", "bottom", "maillots", "Short de surf de Bondi", "Bondi board shorts", { k: "boardshorts", c: "#E9C46A", c2: "#4C8DA8" }, mission("sydney", 4, "Sydney", "Sydney"), "surf"),
  E("x-tokyo-souvenir", "outer", "vestes", "Veste souvenir brodée", "Embroidered souvenir jacket", { k: "souvenir", c: "#2B3A55", c2: "#E9C46A" }, mission("tokyo", 2, "Tokyo", "Tokyo"), "citytrip"),
  E("x-tokyo-sneakers", "shoes", "chaussures", "Baskets de Harajuku", "Harajuku sneakers", { k: "sneakers", c: "#FBF7F0", c2: "#C9785A" }, mission("tokyo", 4, "Tokyo", "Tokyo"), "citytrip"),
  E("x-toronto-plaid", "top", "chemises", "Chemise de bûcheron", "Lumberjack shirt", { k: "plaid", c: "#B23A3A", c2: "#1F1A17" }, mission("toronto", 2, "Toronto", "Toronto"), "winter"),
  E("x-toronto-beanie", "hat", "bonnets", "Bonnet feuille d'érable", "Maple leaf beanie", { k: "beanie", c: "#FBF7F0", c2: "#B23A3A", t: "maple" }, mission("toronto", 4, "Toronto", "Toronto"), "winter"),
  // regularity, lessons, words, books
  E("x-lessons-5", "hand", "objets", "Carnet de voyage en cuir", "Leather travel journal", { k: "journal" }, { kind: "lessons", n: 5, fr: "5 cours validés", en: "5 lessons passed" }, "adventure", "rare"),
  E("x-lessons-20", "outer", "vestes", "Veste d'explorateur", "Explorer's jacket", { k: "safari", c: "#7C8B5A" }, { kind: "lessons", n: 20, fr: "20 cours validés", en: "20 lessons passed" }, "safari"),
  E("x-words-100", "hat", "chapeaux", "Chapeau de globe-trotteur", "Globetrotter's hat", { k: "fedora", c: "#D8C8A8", c2: "#7F9C7A" }, { kind: "mastered", n: 100, fr: "100 mots maîtrisés", en: "100 words mastered" }, "adventure"),
  E("x-words-500", "bag", "sacsados", "Sac de grand voyageur", "Seasoned traveller's pack", { k: "backpack", c: "#2B3A55", c2: "#E9C46A", t: "hike" }, { kind: "mastered", n: 500, fr: "500 mots maîtrisés", en: "500 words mastered" }, "backpacker", "légendaire"),
  E("x-books-1", "hand", "valises", "Valise de lecteur", "Reader's suitcase", { k: "suitcaseHard", c: "#C9785A", t: "stickers" }, { kind: "books", n: 1, fr: "1 livre terminé", en: "1 book finished" }, "backpacker", "rare"),
  E("x-streak-7", "neck", "bijoux", "Bracelets de la semaine", "One-week bracelets", { k: "bracelets" }, { kind: "streak", n: 7, fr: "7 jours d'apprentissage", en: "7 days of learning" }, "backpacker", "rare"),
  E("x-streak-30", "dress", "maillots", "Maillot du voyageur fidèle", "Loyal traveller's swimsuit", { k: "swimsuit", c: "#2B3A55", c2: "#C9785A" }, { kind: "streak", n: 30, fr: "30 jours d'apprentissage", en: "30 days of learning" }, "beach"),
];

/** Literary collections: exclusive rewards for finishing a book of that universe, then wearable forever. */
const L = (id: string, slot: AvatarSlot, cat: ShopCategory, fr: string, en: string, price: number, spec: Spec, unlock?: ShopItem["unlock"], col: Collection = "literary"): ShopItem => ({ ...I(id, slot, cat, fr, en, price, spec, col), unlock });
const HOLMES = { ids: [1661, 2852, 244, 2097, 834, 108, 3289, 2350, 69700], fr: "Sherlock Holmes", en: "Sherlock Holmes" };
const ALICE = { ids: [11, 12], fr: "Alice au pays des merveilles", en: "Alice in Wonderland" };
const DRACULA = { ids: [345], fr: "Dracula", en: "Dracula" };
const TREASURE = { ids: [120], fr: "L'Île au trésor", en: "Treasure Island" };
const AUSTEN = { ids: [1342, 161, 158, 105], fr: "un roman de Jane Austen", en: "a Jane Austen novel" };
const GATSBY = { ids: [64317], fr: "Gatsby le Magnifique", en: "The Great Gatsby" };
SHOP_ITEMS.push(
  L("lit-deerstalker", "hat", "chapeaux", "Chapeau de Sherlock (deerstalker)", "Sherlock's deerstalker", 0, { k: "deerstalker" }, HOLMES),
  L("lit-inverness", "outer", "vestes", "Manteau à pèlerine de détective", "Detective's Inverness cape", 0, { k: "inverness" }, HOLMES),
  L("lit-magnifier", "hand", "objets", "Loupe de détective", "Magnifying glass", 0, { k: "magnifier" }, HOLMES),
  L("lit-pipe", "face", "visage", "Pipe de Baker Street", "Baker Street pipe", 0, { k: "pipe" }, HOLMES),
  L("lit-alice-dress", "dress", "robes", "Robe bleue et tablier d'Alice", "Alice's blue dress & apron", 0, { k: "aliceDress" }, ALICE),
  L("lit-alice-band", "hat", "bijoux", "Serre-tête noir d'Alice", "Alice's black headband", 0, { k: "headband" }, ALICE),
  L("lit-pocketwatch", "neck", "bijoux", "Montre à gousset du Lapin blanc", "White Rabbit's pocket watch", 0, { k: "pocketwatch" }, ALICE),
  L("lit-vampcape", "outer", "vestes", "Cape gothique du comte", "The Count's gothic cape", 0, { k: "vampcape" }, DRACULA),
  L("lit-tricorn", "hat", "chapeaux", "Tricorne de pirate", "Pirate tricorn", 0, { k: "tricorn" }, TREASURE),
  L("lit-eyepatch", "face", "visage", "Bandeau de pirate", "Pirate eye-patch", 0, { k: "eyepatch" }, TREASURE),
  L("lit-parrot", "neck", "objets", "Perroquet sur l'épaule", "Parrot on the shoulder", 0, { k: "parrot" }, TREASURE),
  L("lit-piratecoat", "outer", "vestes", "Redingote de capitaine", "Captain's coat", 0, { k: "piratecoat" }, TREASURE),
  L("lit-regency", "dress", "robes", "Robe Régence taille empire", "Regency empire-waist gown", 0, { k: "regency" }, AUSTEN),
  L("lit-bonnet", "hat", "chapeaux", "Capote Régence à rubans", "Regency bonnet", 0, { k: "bonnet" }, AUSTEN),
  L("lit-tailcoat", "outer", "vestes", "Habit à queue de pie (Mr Darcy)", "Mr Darcy's tailcoat", 0, { k: "tailcoat" }, AUSTEN),
  L("lit-flapper", "dress", "robes", "Robe charleston à franges", "Flapper dress with fringes", 0, { k: "flapper", c: "#C9A227" }, GATSBY),
  L("lit-featherband", "hat", "bijoux", "Bandeau à plume années 20", "1920s feather headband", 0, { k: "featherband" }, GATSBY),
  L("lit-boater", "hat", "chapeaux", "Canotier", "Boater hat", 0, { k: "boater" }, GATSBY),
  L("lit-creamsuit", "outer", "vestes", "Costume crème de Gatsby", "Gatsby's cream suit", 0, { k: "creamsuit" }, GATSBY),
  // travel outfits (buyable)
  L("trv-fedora", "hat", "chapeaux", "Chapeau d'aventurier", "Adventurer's fedora", 140, { k: "fedora" }, undefined, "adventure"),
  L("trv-pith", "hat", "chapeaux", "Casque d'explorateur", "Explorer's helmet", 160, { k: "pith" }, undefined, "safari"),
  L("trv-flapper-black", "dress", "robes", "Robe années 20 noire", "Black 1920s dress", 260, { k: "flapper", c: "#1F1F2B" }, undefined, "citytrip"),
);

export const SHOP_BY_ID = new Map(SHOP_ITEMS.map((i) => [i.id, i]));

/** Legacy ids from the first wardrobe → new ids. */
export const LEGACY_IDS: Record<string, string> = { "hat-london": "cap-red-ldn" };

/** Wardrobe categories (clothing first, then objects). `group` organises the category scroller. */
export const CATEGORIES: { id: ShopCategory; fr: string; en: string; group: "tete" | "haut" | "bas" | "pieds" | "bagages" | "accessoires" | "decor" }[] = [
  { id: "casquettes", fr: "Casquettes", en: "Caps", group: "tete" },
  { id: "bobs", fr: "Bobs", en: "Bucket hats", group: "tete" },
  { id: "chapeaux", fr: "Chapeaux", en: "Hats", group: "tete" },
  { id: "bonnets", fr: "Bonnets", en: "Beanies", group: "tete" },
  { id: "lunettes", fr: "Lunettes", en: "Glasses", group: "tete" },
  { id: "tshirts", fr: "T-shirts", en: "T-shirts", group: "haut" },
  { id: "chemises", fr: "Chemises", en: "Shirts", group: "haut" },
  { id: "pulls", fr: "Pulls", en: "Jumpers", group: "haut" },
  { id: "vestes", fr: "Vestes", en: "Jackets", group: "haut" },
  { id: "ponchos", fr: "Ponchos", en: "Ponchos", group: "haut" },
  { id: "jeans", fr: "Jeans", en: "Jeans", group: "bas" },
  { id: "pantalons", fr: "Pantalons", en: "Trousers", group: "bas" },
  { id: "shorts", fr: "Shorts", en: "Shorts", group: "bas" },
  { id: "jupes", fr: "Jupes", en: "Skirts", group: "bas" },
  { id: "robes", fr: "Robes", en: "Dresses", group: "bas" },
  { id: "maillots", fr: "Maillots de bain", en: "Swimwear", group: "bas" },
  { id: "chaussures", fr: "Chaussures", en: "Shoes", group: "pieds" },
  { id: "sandales", fr: "Sandales", en: "Sandals", group: "pieds" },
  { id: "sacsados", fr: "Sacs à dos", en: "Backpacks", group: "bagages" },
  { id: "valises", fr: "Valises", en: "Suitcases", group: "bagages" },
  { id: "bijoux", fr: "Bijoux", en: "Jewellery", group: "accessoires" },
  { id: "sport", fr: "Accessoires sportifs", en: "Sports gear", group: "accessoires" },
  { id: "objets", fr: "Objets de voyage", en: "Travel items", group: "accessoires" },
  { id: "visage", fr: "Visage", en: "Face", group: "accessoires" },
  { id: "decors", fr: "Décors", en: "Scenes", group: "decor" },
];

export const COLLECTIONS: { id: Collection; fr: string; en: string }[] = [
  { id: "backpacker", fr: "Backpacker", en: "Backpacker" },
  { id: "tropical", fr: "Tropical", en: "Tropical" },
  { id: "adventure", fr: "Aventure", en: "Adventure" },
  { id: "citytrip", fr: "City trip", en: "City trip" },
  { id: "winter", fr: "Voyage d'hiver", en: "Winter travel" },
  { id: "beach", fr: "Beach life", en: "Beach life" },
  { id: "safari", fr: "Safari", en: "Safari" },
  { id: "hiking", fr: "Randonnée", en: "Hiking" },
  { id: "surf", fr: "Surf", en: "Surf" },
  { id: "diving", fr: "Plongée", en: "Diving" },
  { id: "eusummer", fr: "Été européen", en: "European summer" },
  { id: "airport", fr: "Tenue d'aéroport", en: "Airport outfit" },
  { id: "literary", fr: "Littéraire", en: "Literary" },
];

// ---------- Appearance (free) ----------
export const SKIN_TONES = ["#FBE3D0", "#F3D2B8", "#F1C7A1", "#E5B48C", "#D19C72", "#C98E63", "#A9714C", "#8A5A3C", "#6B4430", "#4E3022"];
export const HAIR_COLORS = ["#1E1410", "#2B1B12", "#6B4226", "#A0612E", "#D9B36A", "#F0D9A0", "#B5482B", "#8C8C8C", "#F2F2F2", "#7E6A9A", "#4C8DA8", "#C9785A"];
export const HAIR_STYLES: { id: import("../types").Appearance["hair"]; fr: string; en: string }[] = [
  { id: "short", fr: "Courts", en: "Short" },
  { id: "sidepart", fr: "Raie sur le côté", en: "Side part" },
  { id: "spiky", fr: "En pics", en: "Spiky" },
  { id: "mohawk", fr: "Crête", en: "Mohawk" },
  { id: "pixie", fr: "Coupe garçonne", en: "Pixie cut" },
  { id: "wavy", fr: "Ondulés", en: "Wavy" },
  { id: "braids", fr: "Tresses", en: "Braids" },
  { id: "buzz", fr: "Très courts", en: "Buzz cut" },
  { id: "bob", fr: "Carré", en: "Bob" },
  { id: "long", fr: "Longs", en: "Long" },
  { id: "ponytail", fr: "Queue de cheval", en: "Ponytail" },
  { id: "bun", fr: "Chignon", en: "Bun" },
  { id: "curly", fr: "Bouclés", en: "Curly" },
  { id: "afro", fr: "Afro", en: "Afro" },
  { id: "bald", fr: "Chauve", en: "Bald" },
];
export const EYE_COLORS = ["#5D4037", "#3B2A20", "#8D6E3F", "#A8874A", "#4E7D46", "#6F8F6A", "#3F7FBF", "#7A8A99"];
export const BODIES: { id: NonNullable<import("../types").Appearance["body"]>; fr: string; en: string }[] = [
  { id: "slim", fr: "Fine", en: "Slim" },
  { id: "average", fr: "Moyenne", en: "Average" },
  { id: "strong", fr: "Ronde / costaude", en: "Curvy / strong" },
];
export const EXPRESSIONS: { id: NonNullable<import("../types").Appearance["expression"]>; fr: string; en: string }[] = [
  { id: "smile", fr: "Souriant", en: "Smiling" },
  { id: "neutral", fr: "Calme", en: "Calm" },
  { id: "laugh", fr: "Rieur", en: "Laughing" },
  { id: "surprised", fr: "Étonné", en: "Surprised" },
  { id: "focused", fr: "Concentré", en: "Focused" },
];
export const FACE_SHAPES: { id: NonNullable<import("../types").Appearance["face"]>; fr: string; en: string }[] = [
  { id: "oval", fr: "Ovale", en: "Oval" },
  { id: "round", fr: "Rond", en: "Round" },
  { id: "square", fr: "Carré", en: "Square" },
  { id: "heart", fr: "Cœur", en: "Heart" },
  { id: "long", fr: "Long", en: "Long" },
  { id: "diamond", fr: "Diamant", en: "Diamond" },
];
export const EYES: { id: import("../types").Appearance["eyes"]; fr: string; en: string }[] = [
  { id: "round", fr: "Ronds", en: "Round" },
  { id: "happy", fr: "Rieurs", en: "Smiling" },
  { id: "lashes", fr: "Avec cils", en: "Lashes" },
];
