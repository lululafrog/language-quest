// Curated public-domain classics available on Project Gutenberg, with an indicative level.
export interface Classic {
  id: number;
  title: string;
  author: string;
  level: string;
  genre: string;
  noteFr: string;
}

export const CLASSICS: Classic[] = [
  { id: 21, title: "Aesop's Fables", author: "Aesop", level: "A2", genre: "Contes", noteFr: "Fables très courtes : idéal pour commencer." },
  { id: 2591, title: "Grimms' Fairy Tales", author: "Jacob & Wilhelm Grimm", level: "B1", genre: "Contes", noteFr: "Contes célèbres, phrases simples." },
  { id: 902, title: "The Happy Prince and Other Tales", author: "Oscar Wilde", level: "B1", genre: "Contes", noteFr: "Contes courts et poétiques." },
  { id: 55, title: "The Wonderful Wizard of Oz", author: "L. Frank Baum", level: "B1", genre: "Jeunesse", noteFr: "Langue claire, histoire connue." },
  { id: 16, title: "Peter Pan", author: "J. M. Barrie", level: "B1", genre: "Jeunesse", noteFr: "Aventure et humour." },
  { id: 11, title: "Alice's Adventures in Wonderland", author: "Lewis Carroll", level: "B1", genre: "Jeunesse", noteFr: "Jeux de mots — une lecture amusante." },
  { id: 236, title: "The Jungle Book", author: "Rudyard Kipling", level: "B1", genre: "Aventure", noteFr: "Récits d'aventure dans la jungle." },
  { id: 113, title: "The Secret Garden", author: "Frances Hodgson Burnett", level: "B1", genre: "Jeunesse", noteFr: "Roman doux, vocabulaire de la nature." },
  { id: 46, title: "A Christmas Carol", author: "Charles Dickens", level: "B2", genre: "Classique", noteFr: "Court roman de Dickens." },
  { id: 35, title: "The Time Machine", author: "H. G. Wells", level: "B2", genre: "Science-fiction", noteFr: "Science-fiction fondatrice, assez courte." },
  { id: 36, title: "The War of the Worlds", author: "H. G. Wells", level: "B2", genre: "Science-fiction", noteFr: "Invasion martienne, rythme soutenu." },
  { id: 120, title: "Treasure Island", author: "Robert Louis Stevenson", level: "B2", genre: "Aventure", noteFr: "Pirates et trésor." },
  { id: 1661, title: "The Adventures of Sherlock Holmes", author: "Arthur Conan Doyle", level: "B2", genre: "Policier", noteFr: "Nouvelles policières indépendantes." },
  { id: 2852, title: "The Hound of the Baskervilles", author: "Arthur Conan Doyle", level: "B2", genre: "Policier", noteFr: "L'enquête la plus célèbre de Holmes." },
  { id: 215, title: "The Call of the Wild", author: "Jack London", level: "B2", genre: "Aventure", noteFr: "Aventure dans le Grand Nord." },
  { id: 74, title: "The Adventures of Tom Sawyer", author: "Mark Twain", level: "B2", genre: "Aventure", noteFr: "Anglais américain, dialogues familiers." },
  { id: 43, title: "The Strange Case of Dr Jekyll and Mr Hyde", author: "Robert Louis Stevenson", level: "B2", genre: "Fantastique", noteFr: "Court et captivant." },
  { id: 103, title: "Around the World in Eighty Days", author: "Jules Verne", level: "B2", genre: "Aventure", noteFr: "Traduction anglaise du classique de Verne." },
  { id: 45, title: "Anne of Green Gables", author: "L. M. Montgomery", level: "B2", genre: "Jeunesse", noteFr: "Roman chaleureux et drôle." },
  { id: 1342, title: "Pride and Prejudice", author: "Jane Austen", level: "C1", genre: "Romance", noteFr: "Romance et ironie, anglais soutenu." },
  { id: 84, title: "Frankenstein", author: "Mary Shelley", level: "C1", genre: "Fantastique", noteFr: "Style riche du XIXᵉ siècle." },
  { id: 174, title: "The Picture of Dorian Gray", author: "Oscar Wilde", level: "C1", genre: "Classique", noteFr: "Dialogues brillants et aphorismes." },
  { id: 345, title: "Dracula", author: "Bram Stoker", level: "C1", genre: "Fantastique", noteFr: "Roman épistolaire (lettres, journaux)." },
  { id: 64317, title: "The Great Gatsby", author: "F. Scott Fitzgerald", level: "C1", genre: "Classique", noteFr: "Entré dans le domaine public en 2021 (États-Unis)." },
];

export const GUTENBERG_TOPICS: { topic: string; fr: string; en: string }[] = [
  { topic: "adventure", fr: "Aventure", en: "Adventure" },
  { topic: "detective", fr: "Policier", en: "Mystery" },
  { topic: "love", fr: "Romance", en: "Romance" },
  { topic: "science fiction", fr: "Science-fiction", en: "Sci-fi" },
  { topic: "children", fr: "Jeunesse", en: "Children" },
  { topic: "short stories", fr: "Nouvelles", en: "Short stories" },
  { topic: "fairy tales", fr: "Contes", en: "Fairy tales" },
  { topic: "horror", fr: "Horreur", en: "Horror" },
  { topic: "humor", fr: "Humour", en: "Humour" },
  { topic: "history", fr: "Histoire", en: "History" },
];
