"use client";
// Word-level diff between the learner's text and a rewrite (removed = struck, added = highlighted).
import { useMemo } from "react";

type Part = { t: string; k: "same" | "del" | "add" };

function diff(a: string[], b: string[]): Part[] {
  const n = a.length, m = b.length;
  if (n * m > 1_500_000) return [...a.map((t) => ({ t, k: "del" as const })), ...b.map((t) => ({ t, k: "add" as const }))];
  const dp: Uint16Array[] = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: Part[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ t: b[j], k: "same" });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) out.push({ t: a[i++], k: "del" });
    else out.push({ t: b[j++], k: "add" });
  }
  while (i < n) out.push({ t: a[i++], k: "del" });
  while (j < m) out.push({ t: b[j++], k: "add" });
  return out;
}

export function WordDiff({ from, to }: { from: string; to: string }) {
  const parts = useMemo(() => diff(from.split(/\s+/).filter(Boolean), to.split(/\s+/).filter(Boolean)), [from, to]);
  return (
    <p className="text-[15.5px] leading-[1.9]">
      {parts.map((p, i) => (
        <span key={i}>
          {p.k === "same" ? (
            p.t
          ) : p.k === "del" ? (
            <del className="rounded bg-coral-500/10 px-0.5 text-coral-600 decoration-coral-400/70 dark:text-coral-400">{p.t}</del>
          ) : (
            <ins className="rounded bg-mint-500/15 px-0.5 font-medium text-mint-600 no-underline dark:text-mint-400">{p.t}</ins>
          )}{" "}
        </span>
      ))}
    </p>
  );
}
