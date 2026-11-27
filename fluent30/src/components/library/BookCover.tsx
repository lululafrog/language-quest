// Original book cover (procedural SVG) — contract used across the app.
// Props are stable; the drawing itself may be refined.
import type { LibraryBook, LibraryCategory } from "@/lib/data/library";

export interface CoverInput {
  title: string;
  author?: string;
  cat?: LibraryCategory | string;
  level?: string;
  cover?: LibraryBook["cover"];
}

export function BookCover({ book, className, showText = true }: { book: CoverInput; className?: string; showText?: boolean }) {
  const pal = book.cover?.palette ?? ["#4a32bb", "#6a55f2", "#ffd166"];
  const id = `bc${[...book.title].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)}`;
  return (
    <svg viewBox="0 0 300 450" className={className} role="img" aria-label={book.title}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={pal[0]} />
          <stop offset="1" stopColor={pal[1]} />
        </linearGradient>
      </defs>
      <rect width="300" height="450" rx="14" fill={`url(#${id})`} />
      <circle cx="150" cy="190" r="70" fill={pal[2]} opacity="0.9" />
      {showText && (
        <>
          <text x="150" y="330" textAnchor="middle" fontSize="24" fontWeight="800" fill="#fff" fontFamily="Georgia, serif">{book.title.slice(0, 22)}</text>
          {book.author && <text x="150" y="365" textAnchor="middle" fontSize="15" fill="#fff" opacity="0.85" fontFamily="Georgia, serif">{book.author}</text>}
        </>
      )}
    </svg>
  );
}
