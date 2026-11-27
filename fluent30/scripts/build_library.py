#!/usr/bin/env python3
"""Builds the built-in library of Fluent30.

Usage:
    python3 scripts/build_library.py <raw_dir>

<raw_dir> contains the plain-text Project Gutenberg files <id>.txt, downloaded with:
    curl -o <raw_dir>/<id>.txt https://gutenberg.pglaf.org/cache/epub/<id>/pg<id>.txt
(official PG mirror; use curl, which honours HTTPS_PROXY).

Outputs:
    public/books/<id>.txt.gz       stripped text (PG licence boilerplate removed, short attribution kept)
    public/books/<id>.lemmas.json  1500 most frequent lowercase word forms with counts (vocabulary coverage)
    src/lib/data/library.ts        generated catalogue (editorial data from scripts/library_source.py)

Rights: only works in the public domain both in the USA and in France/EU are listed in library_source.py.
"""
import gzip, json, os, re, sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import library_source as L  # noqa: E402

TITLE_OVERRIDES = {
    21: "Aesop's Fables",
    2591: "Grimms' Fairy Tales",
    2147: "The Works of Edgar Allan Poe, Volume 1",
    2148: "The Works of Edgar Allan Poe, Volume 2",
    20203: "The Autobiography of Benjamin Franklin",
    64576: "Minor Dialogues",
    3794: "On Benefits",
    871: "The Golden Sayings of Epictetus",
    216: "Tao Te Ching",
    3330: "The Analects of Confucius",
    2944: "Essays, First Series",
    2945: "Essays, Second Series",
    1597: "Andersen's Fairy Tales",
    6133: "The Extraordinary Adventures of Arsène Lupin",
    205: "Walden",
    46: "A Christmas Carol",
    773: "Lord Arthur Savile's Crime and Other Stories",
    12122: "The Monkey's Paw and Other Stories",
    10150: "Dracula's Guest and Other Weird Stories",
    74: "The Adventures of Tom Sawyer",
    110: "Tess of the d'Urbervilles",
    829: "Gulliver's Travels",
    160: "The Awakening",
    308: "Three Men in a Boat",
    521: "Robinson Crusoe",
    13415: "The Lady with the Dog and Other Stories",
    2048: "The Sketch-Book",
}
AUTHOR_OVERRIDES = {
    2680: "Marcus Aurelius",
    1399: "Leo Tolstoy",
    2591: "Jacob & Wilhelm Grimm",
    64576: "Seneca",
    3794: "Seneca",
    16317: "J. Berg Esenwein & Dale Carnegie",
    84: "Mary Shelley",
    216: "Lao Tzu",
    1597: "Hans Christian Andersen",
    13415: "Anton Chekhov",
}
SMALL = {"a", "an", "the", "and", "or", "of", "in", "on", "at", "to", "for", "with", "by", "from", "as"}


def title_case(t: str) -> str:
    words = t.split()
    out = []
    for i, w in enumerate(words):
        if i and w.lower() in SMALL:
            out.append(w.lower())
        elif w[:1].islower():
            out.append(w[:1].upper() + w[1:])
        else:
            out.append(w)
    return " ".join(out)


def strip(t: str) -> str:
    t = t.replace("\r\n", "\n").replace("\r", "\n").lstrip("﻿")
    m = re.search(r"^\*{3}\s*START OF (THE|THIS) PROJECT GUTENBERG EBOOK.*$", t, re.M | re.I)
    body = t[t.index("\n", m.start()) + 1:] if m else t
    m = re.search(r"^\*{3}\s*END OF (THE|THIS) PROJECT GUTENBERG EBOOK.*$", body, re.M | re.I)
    if m:
        body = body[: m.start()]
    body = re.sub(r"^\s*(Produced by|Transcribed from|E-text prepared by)[^\n]*(\n[^\n]+)*\n\n", "", body, flags=re.I)
    return body.strip()


def main(raw_dir: str):
    out_books = os.path.join(ROOT, "public", "books")
    os.makedirs(out_books, exist_ok=True)
    keep = set()
    entries = []
    for bid, (cat, also, title_fr, level, countries, motif, pal, note, summary) in L.B.items():
        raw = open(os.path.join(raw_dir, f"{bid}.txt"), encoding="utf-8", errors="replace").read()
        head = raw[:8000]
        tm = re.search(r"^Title:\s*(.+)$", head, re.M)
        am = re.search(r"^Author:\s*(.+)$", head, re.M)
        if not tm:
            raise SystemExit(f"{bid}: no Title header")
        title = TITLE_OVERRIDES.get(bid) or title_case(re.split(r"[;:]", tm.group(1))[0].strip())
        author = AUTHOR_OVERRIDES.get(bid) or (am.group(1).strip() if am else "Anonymous")
        body = strip(raw) + (
            f"\n\nThis eBook is from Project Gutenberg (www.gutenberg.org), ebook #{bid}. "
            "It is in the public domain in the USA; check the laws of your country before redistributing it."
        )
        with open(os.path.join(out_books, f"{bid}.txt.gz"), "wb") as f:
            f.write(gzip.compress(body.encode("utf-8"), 9))
        tokens = [w for w in re.findall(r"[a-z]+(?:'[a-z]+)?", body.lower().replace("’", "'")) if len(w) > 1 or w in ("a", "i")]
        top = Counter(tokens).most_common(1500)
        with open(os.path.join(out_books, f"{bid}.lemmas.json"), "w") as f:
            json.dump(top, f, separators=(",", ":"))
        keep.update({f"{bid}.txt.gz", f"{bid}.lemmas.json"})
        palette = L.P[pal]
        entries.append(dict(id=bid, cat=cat, alsoIn=also, title=title, titleFr=title_fr, author=author, level=level,
                            words=len(body.split()), noteFr=note, summaryFr=summary, countries=countries,
                            cover=dict(palette=list(palette), motif=motif)))
    for f in os.listdir(out_books):
        if f not in keep:
            os.remove(os.path.join(out_books, f))
    write_ts(entries)
    size = sum(os.path.getsize(os.path.join(out_books, f)) for f in os.listdir(out_books))
    counts = Counter()
    for e in entries:
        counts[e["cat"]] += 1
        for a in e["alsoIn"]:
            counts[a] += 1
    print(f"{len(entries)} books, public/books = {size / 1e6:.1f} MB")
    print("per category (main + alsoIn):", dict(counts))


def js(v):
    return json.dumps(v, ensure_ascii=False)


def write_ts(entries):
    lines = []
    for e in entries:
        also = f" alsoIn: {js(e['alsoIn'])}," if e["alsoIn"] else ""
        pal = e["cover"]["palette"]
        lines.append(
            f"  {{ id: {e['id']}, cat: {js(e['cat'])},{also} title: {js(e['title'])}, titleFr: {js(e['titleFr'])}, author: {js(e['author'])}, "
            f"level: {js(e['level'])}, words: {e['words']}, noteFr: {js(e['noteFr'])}, summaryFr: {js(e['summaryFr'])}, "
            f"countries: {js(e['countries'])}, cover: {{ palette: [{js(pal[0])}, {js(pal[1])}, {js(pal[2])}], motif: {js(e['cover']['motif'])} }} }},"
        )
    ts = '''// GENERATED by scripts/build_library.py from scripts/library_source.py — edit the source, then re-run the script.
// Built-in library: public-domain classics (Project Gutenberg) shipped with the app in public/books/<id>.txt.gz
// (readable offline, no external service), with public/books/<id>.lemmas.json for vocabulary coverage.
// All are in the public domain both in the USA and in France/EU (authors and translators died more than 70 years ago).
export type LibraryCategory = "romance" | "thriller" | "fantastique" | "aventure" | "devperso" | "horreur" | "classiques" | "courtes";

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
  /** countries where the story takes place (French names), for the "Globe-trotteur" trophy */
  countries?: string[];
  /** original cover design: palette (3 colours) + motif id drawn by components/library/BookCover.tsx */
  cover?: { palette: [string, string, string]; motif: string };
}

export const LIBRARY_CATEGORIES: { id: LibraryCategory; fr: string; en: string; emoji: string }[] = [
  { id: "romance", fr: "Romance", en: "Romance", emoji: "💘" },
  { id: "thriller", fr: "Thriller & enquêtes", en: "Thrillers & mysteries", emoji: "🔎" },
  { id: "fantastique", fr: "Fantastique & SF", en: "Fantasy & sci-fi", emoji: "🪐" },
  { id: "aventure", fr: "Aventure & voyage", en: "Adventure & travel", emoji: "🧭" },
  { id: "devperso", fr: "Développement personnel", en: "Personal growth", emoji: "🌱" },
  { id: "horreur", fr: "Horreur", en: "Horror", emoji: "🦇" },
  { id: "classiques", fr: "Grands classiques", en: "Great classics", emoji: "🏛️" },
  { id: "courtes", fr: "Histoires courtes", en: "Short stories", emoji: "⚡" },
];

export const LIBRARY: LibraryBook[] = [
''' + "\n".join(lines) + '''
];

/** Books of a category (main category or secondary ones). */
export function booksInCategory(cat: LibraryCategory): LibraryBook[] {
  return LIBRARY.filter((b) => b.cat === cat || b.alsoIn?.includes(cat));
}

export function libraryBook(id: number): LibraryBook | undefined {
  return LIBRARY.find((b) => b.id === id);
}

export function readingTime(words: number) {
  const h = words / 200 / 60;
  return h < 1 ? `${Math.max(5, Math.round((h * 60) / 5) * 5)} min` : `${Math.round(h)} h`;
}
'''
    with open(os.path.join(ROOT, "src", "lib", "data", "library.ts"), "w") as f:
        f.write(ts)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    main(sys.argv[1])
