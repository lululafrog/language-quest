// Tourist wardrobe: silly items bought with coins earned by practising.
import type { AvatarSlot } from "../types";

export interface ShopItem {
  id: string;
  slot: AvatarSlot;
  fr: string;
  en: string;
  price: number;
  rarity: "commun" | "rare" | "épique" | "légendaire";
}

const r = (price: number): ShopItem["rarity"] => (price >= 400 ? "légendaire" : price >= 180 ? "épique" : price >= 90 ? "rare" : "commun");
const item = (id: string, slot: AvatarSlot, fr: string, en: string, price: number): ShopItem => ({ id, slot, fr, en, price, rarity: r(price) });

export const SHOP_ITEMS: ShopItem[] = [
  item("hat-bob", "hat", "Bob de camping", "Bucket hat", 40),
  item("hat-straw", "hat", "Chapeau de paille", "Straw hat", 60),
  item("hat-london", "hat", "Casquette I ♥ London", "I ♥ London cap", 80),
  item("hat-cowboy", "hat", "Chapeau de cowboy", "Cowboy hat", 120),
  item("hat-sombrero", "hat", "Sombrero géant", "Giant sombrero", 180),
  item("hat-viking", "hat", "Casque de viking", "Viking helmet", 220),
  item("hat-crown", "hat", "Couronne (en plastique) de la Reine", "The Queen's (plastic) crown", 500),

  item("gl-heart", "glasses", "Lunettes cœur", "Heart glasses", 50),
  item("gl-big", "glasses", "Lunettes de soleil XXL", "XXL sunglasses", 70),
  item("gl-aviator", "glasses", "Lunettes d'aviateur", "Aviator glasses", 90),
  item("gl-snorkel", "glasses", "Masque de plongée", "Snorkel mask", 130),

  item("face-sunburn", "face", "Coup de soleil", "Sunburn", 30),
  item("face-zinc", "face", "Crème solaire mal étalée", "Badly spread sunscreen", 40),
  item("face-moustache", "face", "Moustache de gentleman", "Gentleman's moustache", 100),

  item("top-ilove", "top", "T-shirt I ♥ NY", "I ♥ NY T-shirt", 70),
  item("top-rain", "top", "Poncho de pluie (Londres oblige)", "Rain poncho", 90),
  item("top-lifejacket", "top", "Gilet de sauvetage", "Life jacket", 110),
  item("top-hawaii", "top", "Chemise hawaïenne", "Hawaiian shirt", 120),
  item("top-grab", "top", "Veste Grab de moto-taxi", "Grab motorbike-taxi jacket", 150),
  item("top-tuxedo", "top", "Smoking (pour l'heure du thé)", "Tuxedo (for tea time)", 300),

  item("bot-cargo", "bottom", "Bermuda à poches", "Cargo shorts", 50),
  item("bot-flower", "bottom", "Short à fleurs", "Flowery shorts", 60),
  item("bot-kilt", "bottom", "Kilt écossais", "Scottish kilt", 160),

  item("sh-flipflops", "shoes", "Tongs", "Flip-flops", 30),
  item("sh-boots", "shoes", "Bottes de pluie", "Wellies", 70),
  item("sh-sockssandals", "shoes", "Chaussettes + sandales", "Socks with sandals", 80),
  item("sh-golden", "shoes", "Baskets en or", "Golden sneakers", 400),

  item("neck-banana", "neck", "Sac banane", "Bum bag", 50),
  item("neck-lei", "neck", "Collier de fleurs", "Flower lei", 60),
  item("neck-pillow", "neck", "Coussin de voyage", "Travel pillow", 70),
  item("neck-camera", "neck", "Appareil photo jetable", "Disposable camera", 90),

  item("hand-baguette", "hand", "Baguette (pour rester français)", "Baguette (stay French)", 30),
  item("hand-map", "hand", "Carte dépliée (à l'envers)", "Map (upside down)", 40),
  item("hand-tea", "hand", "Tasse de thé", "Cup of tea", 60),
  item("hand-suitcase", "hand", "Valise à roulettes", "Wheeled suitcase", 90),
  item("hand-selfie", "hand", "Perche à selfie", "Selfie stick", 100),
  item("hand-duck", "hand", "Bouée canard", "Duck rubber ring", 140),

  item("bg-home", "background", "Ma chambre", "My room", 0),
  item("bg-beach", "background", "Plage", "Beach", 100),
  item("bg-airport", "background", "Aéroport", "Airport", 120),
  item("bg-london", "background", "Londres", "London", 200),
  item("bg-lombok", "background", "Lombok", "Lombok", 200),
  item("bg-nyc", "background", "New York", "New York", 250),
  item("bg-space", "background", "Station spatiale", "Space station", 800),
];

export const SLOT_LABELS: Record<AvatarSlot, { fr: string; en: string; emoji: string }> = {
  hat: { fr: "Chapeaux", en: "Hats", emoji: "🎩" },
  glasses: { fr: "Lunettes", en: "Glasses", emoji: "🕶️" },
  face: { fr: "Visage", en: "Face", emoji: "😎" },
  top: { fr: "Hauts", en: "Tops", emoji: "👕" },
  bottom: { fr: "Bas", en: "Bottoms", emoji: "🩳" },
  shoes: { fr: "Chaussures", en: "Shoes", emoji: "👟" },
  neck: { fr: "Accessoires", en: "Accessories", emoji: "📷" },
  hand: { fr: "Dans la main", en: "In hand", emoji: "🥖" },
  background: { fr: "Décors", en: "Scenes", emoji: "🏝️" },
};
