# Scripts

## Built-in library (`build_library.py`)

`library_source.py` is the editorial source of truth (category, French title, level, spoiler-free summary,
countries, cover design) of the books shipped with the app. Only works in the public domain **both in the USA and
in France/EU** are allowed (author and translator dead for more than 70 years — e.g. Agatha Christie, A. A. Milne,
E. M. Forster or Lionel Giles' *Art of War* translation are excluded).

```bash
mkdir -p /tmp/pg && for id in $(python3 -c "import sys;sys.path.insert(0,'scripts');import library_source as L;print(' '.join(map(str,L.B)))"); do
  curl -s -o /tmp/pg/$id.txt https://gutenberg.pglaf.org/cache/epub/$id/pg$id.txt
done
python3 scripts/build_library.py /tmp/pg
```

It writes `public/books/<id>.txt.gz`, `public/books/<id>.lemmas.json` (1,500 most frequent word forms, used to estimate
the share of a book's vocabulary the learner already knows) and regenerates `src/lib/data/library.ts`.
