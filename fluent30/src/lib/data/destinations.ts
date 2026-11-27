// Passport destinations: each stamp rewards a real achievement in the course.
// Flag colours are simplified palettes (3 bands) used to tint the stamp, not official flags.

export type StampMetric =
  | "lessons" // lessons completed in the path or modules
  | "units" // course units fully completed
  | "level" // CEFR level fully completed (n = index: 1 = A1 … 5 = C1)
  | "books" // books finished
  | "streak" // gentle regularity (one forgiven day per week)
  | "plans" // daily plans fully completed
  | "words" // words memorised durably
  | "activeDays"; // distinct days with practice

export type Landmark = "bridge" | "tower" | "statue" | "clock" | "castle" | "opera" | "mountain" | "lighthouse" | "palm" | "skyline" | "temple" | "arch" | "wheel" | "dome" | "harbour" | "maple";

export interface Destination {
  id: string;
  nameFr: string;
  nameEn: string;
  country: string;
  colors: [string, string, string];
  landmark: Landmark;
  rule: { metric: StampMetric; n: number; fr: string };
  souvenir: { fr: string; en: string };
  coins: number;
  /** also granted when every mission of the world-map destination with the same id is completed */
  world?: boolean;
}

export const DESTINATIONS: Destination[] = [
  { id: "london", nameFr: "Londres", nameEn: "London", country: "Royaume-Uni", colors: ["#1F3A93", "#FFFFFF", "#C8102E"], landmark: "clock", rule: { metric: "lessons", n: 1, fr: "Termine ton premier cours" }, souvenir: { fr: "Une tasse de thé", en: "A cup of tea" }, coins: 30, world: true },
  { id: "dublin", nameFr: "Dublin", nameEn: "Dublin", country: "Irlande", colors: ["#169B62", "#FFFFFF", "#FF883E"], landmark: "harbour", rule: { metric: "activeDays", n: 3, fr: "Pratique 3 jours différents" }, souvenir: { fr: "Un trèfle porte-bonheur", en: "A lucky shamrock" }, coins: 30 },
  { id: "edinburgh", nameFr: "Édimbourg", nameEn: "Edinburgh", country: "Écosse", colors: ["#005EB8", "#FFFFFF", "#005EB8"], landmark: "castle", rule: { metric: "plans", n: 1, fr: "Termine un programme du jour" }, souvenir: { fr: "Une écharpe en tartan", en: "A tartan scarf" }, coins: 40 },
  { id: "new-york", nameFr: "New York", nameEn: "New York", country: "États-Unis", colors: ["#3C3B6E", "#FFFFFF", "#B22234"], landmark: "statue", rule: { metric: "units", n: 1, fr: "Termine une unité complète" }, souvenir: { fr: "Un ticket de métro", en: "A subway ticket" }, coins: 60, world: true },
  { id: "cardiff", nameFr: "Cardiff", nameEn: "Cardiff", country: "Pays de Galles", colors: ["#00B140", "#FFFFFF", "#D30731"], landmark: "castle", rule: { metric: "streak", n: 7, fr: "7 jours de régularité (1 jour d'oubli pardonné par semaine)" }, souvenir: { fr: "Une cuillère d'amour galloise", en: "A Welsh love spoon" }, coins: 80 },
  { id: "toronto", nameFr: "Toronto", nameEn: "Toronto", country: "Canada", colors: ["#D52B1E", "#FFFFFF", "#D52B1E"], landmark: "maple", rule: { metric: "words", n: 50, fr: "Mémorise durablement 50 mots" }, souvenir: { fr: "Du sirop d'érable", en: "Maple syrup" }, coins: 60, world: true },
  { id: "bath", nameFr: "Bath", nameEn: "Bath", country: "Royaume-Uni", colors: ["#7A5C3E", "#F2E6D0", "#7A5C3E"], landmark: "arch", rule: { metric: "books", n: 1, fr: "Termine ton premier livre" }, souvenir: { fr: "Un marque-page ancien", en: "An antique bookmark" }, coins: 80 },
  { id: "boston", nameFr: "Boston", nameEn: "Boston", country: "États-Unis", colors: ["#002868", "#FFFFFF", "#BF0A30"], landmark: "harbour", rule: { metric: "lessons", n: 10, fr: "Termine 10 cours" }, souvenir: { fr: "Une boîte de thé du port", en: "A tea chest" }, coins: 80 },
  { id: "san-francisco", nameFr: "San Francisco", nameEn: "San Francisco", country: "États-Unis", colors: ["#C0362C", "#F4E9D8", "#1E3A5F"], landmark: "bridge", rule: { metric: "level", n: 1, fr: "Termine tout le niveau A1" }, souvenir: { fr: "Une carte postale du pont", en: "A bridge postcard" }, coins: 150 },
  { id: "sydney", nameFr: "Sydney", nameEn: "Sydney", country: "Australie", colors: ["#00008B", "#FFFFFF", "#E4002B"], landmark: "opera", rule: { metric: "activeDays", n: 20, fr: "Pratique 20 jours différents" }, souvenir: { fr: "Un boomerang", en: "A boomerang" }, coins: 100, world: true },
  { id: "cape-town", nameFr: "Le Cap", nameEn: "Cape Town", country: "Afrique du Sud", colors: ["#007749", "#FFB81C", "#001489"], landmark: "mountain", rule: { metric: "plans", n: 10, fr: "Termine 10 programmes du jour" }, souvenir: { fr: "Une pierre de la Montagne de la Table", en: "A Table Mountain stone" }, coins: 100 },
  { id: "auckland", nameFr: "Auckland", nameEn: "Auckland", country: "Nouvelle-Zélande", colors: ["#00247D", "#FFFFFF", "#CC142B"], landmark: "lighthouse", rule: { metric: "words", n: 200, fr: "Mémorise durablement 200 mots" }, souvenir: { fr: "Une plume de kiwi (en bois)", en: "A wooden kiwi" }, coins: 120 },
  { id: "chicago", nameFr: "Chicago", nameEn: "Chicago", country: "États-Unis", colors: ["#41B6E6", "#FFFFFF", "#E4002B"], landmark: "skyline", rule: { metric: "level", n: 2, fr: "Termine tout le niveau A2" }, souvenir: { fr: "Un disque de jazz", en: "A jazz record" }, coins: 200 },
  { id: "vancouver", nameFr: "Vancouver", nameEn: "Vancouver", country: "Canada", colors: ["#D52B1E", "#FFFFFF", "#2E6B4F"], landmark: "mountain", rule: { metric: "streak", n: 30, fr: "30 jours de régularité" }, souvenir: { fr: "Une boussole", en: "A compass" }, coins: 200 },
  { id: "oxford", nameFr: "Oxford", nameEn: "Oxford", country: "Royaume-Uni", colors: ["#002147", "#F3E9D2", "#002147"], landmark: "dome", rule: { metric: "books", n: 5, fr: "Termine 5 livres" }, souvenir: { fr: "Un stylo plume", en: "A fountain pen" }, coins: 200 },
  { id: "singapore", nameFr: "Singapour", nameEn: "Singapore", country: "Singapour", colors: ["#EF3340", "#FFFFFF", "#EF3340"], landmark: "wheel", rule: { metric: "lessons", n: 40, fr: "Termine 40 cours" }, souvenir: { fr: "Une orchidée séchée", en: "A dried orchid" }, coins: 200 },
  { id: "mumbai", nameFr: "Bombay", nameEn: "Mumbai", country: "Inde", colors: ["#FF9933", "#FFFFFF", "#138808"], landmark: "arch", rule: { metric: "level", n: 3, fr: "Termine tout le niveau B1" }, souvenir: { fr: "Un sachet d'épices", en: "A bag of spices" }, coins: 300 },
  { id: "kingston", nameFr: "Kingston", nameEn: "Kingston", country: "Jamaïque", colors: ["#009B3A", "#FED100", "#000000"], landmark: "palm", rule: { metric: "words", n: 1000, fr: "Mémorise durablement 1 000 mots" }, souvenir: { fr: "Un grain de café des Blue Mountains", en: "A Blue Mountain coffee bean" }, coins: 300 },
  { id: "honolulu", nameFr: "Honolulu", nameEn: "Honolulu", country: "États-Unis", colors: ["#00843D", "#FFFFFF", "#F2A900"], landmark: "palm", rule: { metric: "level", n: 4, fr: "Termine tout le niveau B2" }, souvenir: { fr: "Un collier de fleurs", en: "A flower lei" }, coins: 400 },
  { id: "malta", nameFr: "La Valette", nameEn: "Valletta", country: "Malte", colors: ["#CF142B", "#FFFFFF", "#CF142B"], landmark: "temple", rule: { metric: "level", n: 5, fr: "Termine tout le niveau C1" }, souvenir: { fr: "Une croix de Malte dorée", en: "A golden Maltese cross" }, coins: 600 },
  { id: "bali", nameFr: "Bali", nameEn: "Bali", country: "Indonésie", colors: ["#3F8A6E", "#F3E6C8", "#C2573A"], landmark: "palm", rule: { metric: "activeDays", n: 30, fr: "Pratique 30 jours différents, ou termine les missions de Bali" }, souvenir: { fr: "Un sarong batik", en: "A batik sarong" }, coins: 100, world: true },
  { id: "tokyo", nameFr: "Tokyo", nameEn: "Tokyo", country: "Japon", colors: ["#FFFFFF", "#BC002D", "#2C2A3A"], landmark: "temple", rule: { metric: "words", n: 300, fr: "Mémorise durablement 300 mots, ou termine les missions de Tokyo" }, souvenir: { fr: "Une grue en origami", en: "A paper crane" }, coins: 120, world: true },
];

export function getDestination(id: string): Destination | undefined {
  return DESTINATIONS.find((d) => d.id === id);
}
