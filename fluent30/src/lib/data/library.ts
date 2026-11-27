// Built-in library: 100 public-domain classics (Project Gutenberg), 20 per genre, shipped with the app
// in public/books/<id>.txt.gz so they can be read anywhere, even offline and without any external service.
// All are in the public domain in the USA and in France/EU (authors who died more than 70 years ago).
export type LibraryCategory = "policier" | "aventure" | "romance" | "fantastique" | "jeunesse";

export interface LibraryBook {
  id: number;
  cat: LibraryCategory;
  /** extra categories the book also belongs to (e.g. a short horror story is also "courtes") */
  alsoIn?: LibraryCategory[];
  title: string;
  titleFr: string;
  author: string;
  level: "A2" | "B1" | "B2" | "C1" | "C2";
  words: number;
  noteFr: string;
  /** spoiler-free French summary (2-3 sentences) */
  summaryFr?: string;
  /** countries where the story takes place (ISO-like French names), for the "Globe-trotteur" trophy */
  countries?: string[];
  /** original cover design: palette (3 colours) + motif id drawn by components/library/BookCover.tsx */
  cover?: { palette: [string, string, string]; motif: string };
}

export const LIBRARY_CATEGORIES: { id: LibraryCategory; fr: string; en: string; emoji: string }[] = [
  { id: "policier", fr: "Policier & suspense", en: "Mystery", emoji: "🔎" },
  { id: "aventure", fr: "Aventure & voyage", en: "Adventure & travel", emoji: "🧭" },
  { id: "romance", fr: "Romance & sentiments", en: "Romance", emoji: "💘" },
  { id: "fantastique", fr: "Fantastique & science-fiction", en: "Fantasy & sci-fi", emoji: "🪐" },
  { id: "jeunesse", fr: "Jeunesse, contes & humour", en: "Children, tales & humour", emoji: "🧸" },
];

export const LIBRARY: LibraryBook[] = [
  { id: 1661, cat: "policier", title: "The Adventures of Sherlock Holmes", titleFr: "Les Aventures de Sherlock Holmes", author: "Arthur Conan Doyle", level: "B2", words: 104533, noteFr: "12 enquêtes courtes : parfait pour lire par petits morceaux." },
  { id: 2852, cat: "policier", title: "The Hound of the Baskervilles", titleFr: "Le Chien des Baskerville", author: "Arthur Conan Doyle", level: "B2", words: 59287, noteFr: "L'enquête la plus célèbre de Holmes, dans la lande anglaise." },
  { id: 244, cat: "policier", title: "A Study in Scarlet", titleFr: "Une étude en rouge", author: "Arthur Conan Doyle", level: "B2", words: 43454, noteFr: "La rencontre de Holmes et Watson." },
  { id: 2097, cat: "policier", title: "The Sign of the Four", titleFr: "Le Signe des quatre", author: "Arthur Conan Doyle", level: "B2", words: 43122, noteFr: "Trésor, pacte secret et course-poursuite sur la Tamise." },
  { id: 834, cat: "policier", title: "The Memoirs of Sherlock Holmes", titleFr: "Les Mémoires de Sherlock Holmes", author: "Arthur Conan Doyle", level: "B2", words: 95513, noteFr: "Nouvelles enquêtes, dont le duel contre Moriarty." },
  { id: 108, cat: "policier", title: "The Return of Sherlock Holmes", titleFr: "Le Retour de Sherlock Holmes", author: "Arthur Conan Doyle", level: "B2", words: 112143, noteFr: "Holmes est de retour : 13 nouvelles affaires." },
  { id: 204, cat: "policier", title: "The innocence of Father Brown", titleFr: "La Clairvoyance du père Brown", author: "G. K. Chesterton", level: "C1", words: 78944, noteFr: "Un prêtre détective aux déductions inattendues." },
  { id: 558, cat: "policier", title: "The Thirty-Nine Steps", titleFr: "Les 39 Marches", author: "John Buchan", level: "B2", words: 41004, noteFr: "Course-poursuite et espionnage : impossible à lâcher." },
  { id: 155, cat: "policier", title: "The Moonstone", titleFr: "La Pierre de lune", author: "Wilkie Collins", level: "C1", words: 194936, noteFr: "L'un des tout premiers romans policiers : vol d'un diamant." },
  { id: 583, cat: "policier", title: "The Woman in White", titleFr: "La Dame en blanc", author: "Wilkie Collins", level: "C1", words: 244792, noteFr: "Suspense, secrets de famille et identité volée." },
  { id: 6133, cat: "policier", title: "The Extraordinary Adventures of Arsène Lupin, Gentleman-Burglar", titleFr: "Arsène Lupin, gentleman cambrioleur", author: "Maurice Leblanc", level: "B2", words: 53951, noteFr: "Le héros français, en anglais !" },
  { id: 175, cat: "policier", title: "The Phantom of the Opera", titleFr: "Le Fantôme de l'Opéra", author: "Gaston Leroux", level: "B2", words: 85590, noteFr: "Le classique français de Gaston Leroux, en anglais." },
  { id: 1695, cat: "policier", title: "The Man Who Was Thursday", titleFr: "Le Nommé Jeudi", author: "G. K. Chesterton", level: "C1", words: 58213, noteFr: "Policier absurde et cauchemardesque, plein de surprises." },
  { id: 4047, cat: "policier", title: "The Leavenworth Case", titleFr: "L'Affaire Leavenworth", author: "Anna Katharine Green", level: "C1", words: 111324, noteFr: "Le premier best-seller policier américain." },
  { id: 2147, cat: "policier", title: "The Works of Edgar Allan Poe — Volume 1", titleFr: "Histoires extraordinaires d'Edgar Poe (vol. 1)", author: "Edgar Allan Poe", level: "C1", words: 90386, noteFr: "Le Scarabée d'or, La Lettre volée… les origines du polar." },
  { id: 3289, cat: "policier", title: "The Valley of Fear", titleFr: "La Vallée de la peur", author: "Arthur Conan Doyle", level: "B2", words: 57841, noteFr: "Meurtre dans un manoir et société secrète américaine." },
  { id: 2350, cat: "policier", title: "His last bow", titleFr: "Son dernier coup d'archet", author: "Arthur Conan Doyle", level: "B2", words: 59050, noteFr: "Les dernières enquêtes, jusqu'à l'espionnage." },
  { id: 223, cat: "policier", title: "The wisdom of Father Brown", titleFr: "La Sagesse du père Brown", author: "G. K. Chesterton", level: "C1", words: 71679, noteFr: "La suite des énigmes du père Brown." },
  { id: 706, cat: "policier", title: "The Amateur Cracksman", titleFr: "Raffles, gentleman cambrioleur", author: "E. W. Hornung", level: "B2", words: 52003, noteFr: "Le « Arsène Lupin » anglais : cambriolages élégants." },
  { id: 4017, cat: "policier", title: "The Hollow Needle", titleFr: "L'Aiguille creuse", author: "Maurice Leblanc", level: "B2", words: 65307, noteFr: "Arsène Lupin face au jeune détective Beautrelet." },
  { id: 103, cat: "aventure", title: "Around the World in Eighty Days", titleFr: "Le Tour du monde en 80 jours", author: "Jules Verne", level: "B1", words: 63361, noteFr: "Le voyage parfait pour un voyageur !" },
  { id: 120, cat: "aventure", title: "Treasure Island", titleFr: "L'Île au trésor", author: "Robert Louis Stevenson", level: "B1", words: 68664, noteFr: "Pirates, carte au trésor et perroquet." },
  { id: 215, cat: "aventure", title: "The call of the wild", titleFr: "L'Appel de la forêt", author: "Jack London", level: "B1", words: 31851, noteFr: "Court et intense, dans le Grand Nord." },
  { id: 910, cat: "aventure", title: "White Fang", titleFr: "Croc-Blanc", author: "Jack London", level: "B2", words: 72206, noteFr: "Un loup entre deux mondes." },
  { id: 74, cat: "aventure", title: "The Adventures of Tom Sawyer, Complete", titleFr: "Les Aventures de Tom Sawyer", author: "Mark Twain", level: "B2", words: 70827, noteFr: "Anglais américain, plein d'humour." },
  { id: 76, cat: "aventure", title: "Adventures of Huckleberry Finn", titleFr: "Les Aventures de Huckleberry Finn", author: "Mark Twain", level: "C1", words: 111112, noteFr: "Classique américain, en dialecte du Sud." },
  { id: 164, cat: "aventure", title: "Twenty Thousand Leagues under the Sea", titleFr: "Vingt mille lieues sous les mers", author: "Jules Verne", level: "B2", words: 104699, noteFr: "Le Nautilus et le capitaine Nemo." },
  { id: 18857, cat: "aventure", title: "A Journey to the Centre of the Earth", titleFr: "Voyage au centre de la Terre", author: "Jules Verne", level: "B2", words: 85842, noteFr: "Expédition fantastique sous un volcan islandais." },
  { id: 1184, cat: "aventure", title: "The Count of Monte Cristo", titleFr: "Le Comte de Monte-Cristo", author: "Alexandre Dumas", level: "B2", words: 460992, noteFr: "Vengeance et trésor : le chef-d'œuvre de Dumas (long !)." },
  { id: 1257, cat: "aventure", title: "The three musketeers", titleFr: "Les Trois Mousquetaires", author: "Alexandre Dumas", level: "B2", words: 229456, noteFr: "Un pour tous, tous pour un !" },
  { id: 521, cat: "aventure", title: "The Life and Adventures of Robinson Crusoe", titleFr: "Robinson Crusoé", author: "Daniel Defoe", level: "C1", words: 120947, noteFr: "Survivre seul sur une île." },
  { id: 829, cat: "aventure", title: "Gulliver's Travels into Several Remote Nations of the World", titleFr: "Les Voyages de Gulliver", author: "Jonathan Swift", level: "C1", words: 105106, noteFr: "Lilliputiens, géants et satire." },
  { id: 2701, cat: "aventure", title: "Moby Dick", titleFr: "Moby Dick", author: "Herman Melville", level: "C1", words: 212823, noteFr: "La chasse à la baleine blanche." },
  { id: 3176, cat: "aventure", title: "The Innocents Abroad", titleFr: "Le Voyage des innocents", author: "Mark Twain", level: "C1", words: 193240, noteFr: "Mark Twain touriste en Europe : très drôle pour un voyageur." },
  { id: 1268, cat: "aventure", title: "The Mysterious Island", titleFr: "L'Île mystérieuse", author: "Jules Verne", level: "B2", words: 193362, noteFr: "Naufragés qui recréent une civilisation." },
  { id: 421, cat: "aventure", title: "Kidnapped", titleFr: "Enlevé !", author: "Robert Louis Stevenson", level: "B2", words: 81930, noteFr: "Aventure dans les Highlands écossais." },
  { id: 139, cat: "aventure", title: "The Lost World", titleFr: "Le Monde perdu", author: "Arthur Conan Doyle", level: "B2", words: 75786, noteFr: "Des dinosaures en Amazonie." },
  { id: 2166, cat: "aventure", title: "King Solomon's Mines", titleFr: "Les Mines du roi Salomon", author: "H. Rider Haggard", level: "B2", words: 82240, noteFr: "Le premier grand roman d'aventure en Afrique." },
  { id: 2186, cat: "aventure", title: "\"Captains Courageous\"", titleFr: "Capitaines courageux", author: "Rudyard Kipling", level: "B2", words: 52573, noteFr: "Un enfant gâté devient marin." },
  { id: 119, cat: "aventure", title: "A Tramp Abroad", titleFr: "Un vagabond à l'étranger", author: "Mark Twain", level: "C1", words: 156727, noteFr: "Mark Twain randonneur en Allemagne et dans les Alpes." },
  { id: 1342, cat: "romance", title: "Pride and Prejudice", titleFr: "Orgueil et Préjugés", author: "Jane Austen", level: "C1", words: 127387, noteFr: "Elizabeth et Mr Darcy : la référence." },
  { id: 161, cat: "romance", title: "Sense and Sensibility", titleFr: "Raison et Sentiments", author: "Jane Austen", level: "C1", words: 118887, noteFr: "Deux sœurs, deux façons d'aimer." },
  { id: 158, cat: "romance", title: "Emma", titleFr: "Emma", author: "Jane Austen", level: "C1", words: 157585, noteFr: "Une marieuse qui se trompe sur tout." },
  { id: 105, cat: "romance", title: "Persuasion", titleFr: "Persuasion", author: "Jane Austen", level: "C1", words: 83362, noteFr: "Une seconde chance en amour." },
  { id: 1260, cat: "romance", title: "Jane Eyre", titleFr: "Jane Eyre", author: "Charlotte Brontë", level: "C1", words: 185417, noteFr: "Une héroïne forte et un mystère à Thornfield." },
  { id: 768, cat: "romance", title: "Wuthering Heights", titleFr: "Les Hauts de Hurlevent", author: "Emily Brontë", level: "C1", words: 115972, noteFr: "Passion sauvage dans la lande." },
  { id: 514, cat: "romance", title: "Little Women", titleFr: "Les Quatre Filles du docteur March", author: "Louisa May Alcott", level: "B2", words: 186139, noteFr: "Quatre sœurs pendant la guerre de Sécession." },
  { id: 45, cat: "romance", title: "Anne of Green Gables", titleFr: "Anne… la maison aux pignons verts", author: "L. M. Montgomery", level: "B2", words: 102528, noteFr: "Une orpheline pleine d'imagination." },
  { id: 64317, cat: "romance", title: "The Great Gatsby", titleFr: "Gatsby le Magnifique", author: "F. Scott Fitzgerald", level: "C1", words: 48235, noteFr: "Fêtes et illusions des années 20." },
  { id: 1400, cat: "romance", title: "Great Expectations", titleFr: "Les Grandes Espérances", author: "Charles Dickens", level: "C1", words: 184505, noteFr: "Pip, Estella et un mystérieux bienfaiteur." },
  { id: 110, cat: "romance", title: "Tess of the d'Urbervilles", titleFr: "Tess d'Urberville", author: "Thomas Hardy", level: "C1", words: 150069, noteFr: "Destin tragique dans la campagne anglaise." },
  { id: 541, cat: "romance", title: "The Age of Innocence", titleFr: "Le Temps de l'innocence", author: "Edith Wharton", level: "C1", words: 101410, noteFr: "Amour interdit dans le New York chic." },
  { id: 2413, cat: "romance", title: "Madame Bovary", titleFr: "Madame Bovary", author: "Gustave Flaubert", level: "C1", words: 115691, noteFr: "Flaubert en anglais : relire un classique français autrement." },
  { id: 1513, cat: "romance", title: "Romeo and Juliet", titleFr: "Roméo et Juliette", author: "William Shakespeare", level: "C2", words: 25985, noteFr: "Shakespeare : anglais ancien, à lire à voix haute." },
  { id: 160, cat: "romance", title: "The Awakening, and Selected Short Stories", titleFr: "L'Éveil", author: "Kate Chopin", level: "B2", words: 64055, noteFr: "Une femme qui s'émancipe à La Nouvelle-Orléans." },
  { id: 208, cat: "romance", title: "Daisy Miller", titleFr: "Daisy Miller", author: "Henry James", level: "B2", words: 21345, noteFr: "Une jeune Américaine en voyage en Europe." },
  { id: 4276, cat: "romance", title: "North and South", titleFr: "Nord et Sud", author: "Elizabeth Cleghorn Gaskell", level: "C1", words: 180857, noteFr: "Amour et lutte sociale dans l'Angleterre industrielle." },
  { id: 1952, cat: "romance", title: "The Yellow Wallpaper", titleFr: "Le Papier peint jaune", author: "Charlotte Perkins Gilman", level: "B2", words: 6112, noteFr: "Nouvelle très courte et troublante." },
  { id: 1023, cat: "romance", title: "Bleak House", titleFr: "La Maison d'Âpre-Vent", author: "Charles Dickens", level: "C1", words: 353490, noteFr: "Le grand roman de Dickens (très long)." },
  { id: 33, cat: "romance", title: "The Scarlet Letter", titleFr: "La Lettre écarlate", author: "Nathaniel Hawthorne", level: "C1", words: 83047, noteFr: "Amour et honte dans l'Amérique puritaine." },
  { id: 84, cat: "fantastique", title: "Frankenstein", titleFr: "Frankenstein", author: "Mary Wollstonecraft Shelley", level: "C1", words: 75069, noteFr: "La créature et son créateur." },
  { id: 345, cat: "fantastique", title: "Dracula", titleFr: "Dracula", author: "Bram Stoker", level: "C1", words: 161348, noteFr: "Le vampire, raconté par lettres et journaux." },
  { id: 35, cat: "fantastique", title: "The Time Machine", titleFr: "La Machine à explorer le temps", author: "H. G. Wells", level: "B2", words: 32481, noteFr: "Court et fondateur de la science-fiction." },
  { id: 36, cat: "fantastique", title: "The war of the worlds", titleFr: "La Guerre des mondes", author: "H. G. Wells", level: "B2", words: 60102, noteFr: "Les Martiens attaquent l'Angleterre." },
  { id: 5230, cat: "fantastique", title: "The Invisible Man", titleFr: "L'Homme invisible", author: "H. G. Wells", level: "B2", words: 48527, noteFr: "Un savant devenu invisible… et dangereux." },
  { id: 159, cat: "fantastique", title: "The island of Doctor Moreau", titleFr: "L'Île du docteur Moreau", author: "H. G. Wells", level: "B2", words: 43572, noteFr: "Expériences monstrueuses sur une île." },
  { id: 174, cat: "fantastique", title: "The Picture of Dorian Gray", titleFr: "Le Portrait de Dorian Gray", author: "Oscar Wilde", level: "C1", words: 79006, noteFr: "Un portrait qui vieillit à votre place." },
  { id: 43, cat: "fantastique", title: "The strange case of Dr. Jekyll and Mr. Hyde", titleFr: "L'Étrange Cas du Dr Jekyll et de Mr Hyde", author: "Robert Louis Stevenson", level: "B2", words: 25658, noteFr: "Court et captivant." },
  { id: 209, cat: "fantastique", title: "The Turn of the Screw", titleFr: "Le Tour d'écrou", author: "Henry James", level: "C1", words: 42304, noteFr: "Fantômes ou folie ? Histoire de terreur." },
  { id: 62, cat: "fantastique", title: "A princess of Mars", titleFr: "Une princesse de Mars", author: "Edgar Rice Burroughs", level: "B2", words: 67463, noteFr: "Aventure sur Mars, ancêtre de Star Wars." },
  { id: 10007, cat: "fantastique", title: "Carmilla", titleFr: "Carmilla", author: "Joseph Sheridan Le Fanu", level: "B2", words: 28130, noteFr: "La vampire qui a inspiré Dracula." },
  { id: 41, cat: "fantastique", title: "The Legend of Sleepy Hollow", titleFr: "La Légende de Sleepy Hollow", author: "Washington Irving", level: "B2", words: 12241, noteFr: "Le cavalier sans tête (très court)." },
  { id: 201, cat: "fantastique", title: "Flatland", titleFr: "Flatland", author: "Edwin Abbott Abbott", level: "C1", words: 34691, noteFr: "Un monde en deux dimensions." },
  { id: 389, cat: "fantastique", title: "The Great God Pan", titleFr: "Le Grand Dieu Pan", author: "Arthur Machen", level: "C1", words: 21742, noteFr: "Horreur surnaturelle victorienne." },
  { id: 2148, cat: "fantastique", title: "The Works of Edgar Allan Poe — Volume 2", titleFr: "Histoires extraordinaires d'Edgar Poe (vol. 2)", author: "Edgar Allan Poe", level: "C1", words: 95070, noteFr: "Le Chat noir, Double assassinat dans la rue Morgue…" },
  { id: 11, cat: "fantastique", title: "Alice's Adventures in Wonderland", titleFr: "Alice au pays des merveilles", author: "Lewis Carroll", level: "B1", words: 26552, noteFr: "Jeux de mots et logique absurde." },
  { id: 12, cat: "fantastique", title: "Through the Looking-Glass", titleFr: "De l'autre côté du miroir", author: "Lewis Carroll", level: "B1", words: 29779, noteFr: "La suite d'Alice." },
  { id: 55, cat: "fantastique", title: "The Wonderful Wizard of Oz", titleFr: "Le Magicien d'Oz", author: "L. Frank Baum", level: "B1", words: 39676, noteFr: "Langue claire, histoire connue." },
  { id: 16, cat: "fantastique", title: "Peter Pan", titleFr: "Peter Pan", author: "J. M. Barrie", level: "B1", words: 47295, noteFr: "Le garçon qui ne voulait pas grandir." },
  { id: 86, cat: "fantastique", title: "A Connecticut Yankee in King Arthur's Court", titleFr: "Un Yankee à la cour du roi Arthur", author: "Mark Twain", level: "B2", words: 117837, noteFr: "Voyage dans le temps plein d'humour." },
  { id: 21, cat: "jeunesse", title: "Three hundred Aesop’s fables", titleFr: "Les Fables d'Ésope", author: "Aesop", level: "A2", words: 44904, noteFr: "Fables très courtes : idéal pour commencer." },
  { id: 2591, cat: "jeunesse", title: "Grimms' Fairy Tales", titleFr: "Contes de Grimm", author: "Jacob Grimm", level: "B1", words: 101138, noteFr: "Blanche-Neige, Hansel et Gretel…" },
  { id: 902, cat: "jeunesse", title: "The Happy Prince, and Other Tales", titleFr: "Le Prince heureux et autres contes", author: "Oscar Wilde", level: "B1", words: 16399, noteFr: "Contes poétiques d'Oscar Wilde." },
  { id: 113, cat: "jeunesse", title: "The Secret Garden", titleFr: "Le Jardin secret", author: "Frances Hodgson Burnett", level: "B1", words: 80659, noteFr: "Une petite fille découvre un jardin caché." },
  { id: 146, cat: "jeunesse", title: "A Little Princess", titleFr: "Petite Princesse", author: "Frances Hodgson Burnett", level: "B1", words: 66398, noteFr: "Sara, de la richesse à la misère." },
  { id: 289, cat: "jeunesse", title: "The Wind in the Willows", titleFr: "Le Vent dans les saules", author: "Kenneth Grahame", level: "B1", words: 58453, noteFr: "Taupe, Rat et Crapaud au bord de la rivière." },
  { id: 1837, cat: "jeunesse", title: "The Prince and the Pauper", titleFr: "Le Prince et le Pauvre", author: "Mark Twain", level: "B2", words: 70073, noteFr: "Deux garçons échangent leur vie." },
  { id: 2781, cat: "jeunesse", title: "Just so stories", titleFr: "Histoires comme ça", author: "Rudyard Kipling", level: "B1", words: 28812, noteFr: "Comment le léopard a eu ses taches…" },
  { id: 500, cat: "jeunesse", title: "The Adventures of Pinocchio", titleFr: "Les Aventures de Pinocchio", author: "Carlo Collodi", level: "B1", words: 39912, noteFr: "Le pantin dont le nez s'allonge." },
  { id: 1448, cat: "jeunesse", title: "Heidi", titleFr: "Heidi", author: "Johanna Spyri", level: "B1", words: 91748, noteFr: "Une petite fille dans les Alpes suisses." },
  { id: 844, cat: "jeunesse", title: "The Importance of Being Earnest", titleFr: "L'Importance d'être Constant", author: "Oscar Wilde", level: "B2", words: 20741, noteFr: "Comédie hilarante, tout en dialogues." },
  { id: 308, cat: "jeunesse", title: "Three men in a boat (to say nothing of the dog)", titleFr: "Trois hommes dans un bateau", author: "Jerome K. Jerome", level: "B2", words: 66850, noteFr: "L'humour anglais par excellence." },
  { id: 1597, cat: "jeunesse", title: "Andersen's Fairy Tales", titleFr: "Contes d'Andersen", author: "H. C. Andersen", level: "B1", words: 55441, noteFr: "La Petite Sirène, Le Vilain Petit Canard…" },
  { id: 271, cat: "jeunesse", title: "Black Beauty", titleFr: "Black Beauty", author: "Anna Sewell", level: "B1", words: 59988, noteFr: "La vie d'un cheval, racontée par lui-même." },
  { id: 1874, cat: "jeunesse", title: "The Railway Children", titleFr: "Les Enfants du chemin de fer", author: "E. Nesbit", level: "B1", words: 59376, noteFr: "Aventures de trois enfants à la campagne." },
  { id: 1450, cat: "jeunesse", title: "Pollyanna", titleFr: "Pollyanna", author: "Eleanor H. Porter", level: "B1", words: 55716, noteFr: "Le « jeu du contentement »." },
  { id: 11757, cat: "jeunesse", title: "The Velveteen Rabbit", titleFr: "Le Lapin de velours", author: "Margery Williams Bianco", level: "A2", words: 3991, noteFr: "Conte très court et tendre." },
  { id: 46, cat: "jeunesse", title: "A Christmas Carol in Prose", titleFr: "Un chant de Noël", author: "Charles Dickens", level: "B2", words: 28568, noteFr: "Scrooge et les trois fantômes." },
  { id: 236, cat: "jeunesse", title: "The Jungle Book", titleFr: "Le Livre de la jungle", author: "Rudyard Kipling", level: "B1", words: 50866, noteFr: "Mowgli, Baloo et Bagheera." },
  { id: 501, cat: "jeunesse", title: "The Story of Doctor Dolittle", titleFr: "L'Histoire du docteur Dolittle", author: "Hugh Lofting", level: "B1", words: 26705, noteFr: "Le docteur qui parle aux animaux." },
];

export function readingTime(words: number) {
  const h = words / 200 / 60;
  return h < 1 ? `${Math.max(5, Math.round(h * 60 / 5) * 5)} min` : `${Math.round(h)} h`;
}
