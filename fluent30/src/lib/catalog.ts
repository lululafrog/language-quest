// Counts / titles of built-in content, used by the dashboard and statistics.
import { GRAMMAR_LESSONS } from "./data/grammar";

export const GRAMMAR_TOTAL = GRAMMAR_LESSONS.length;
export const GRAMMAR_TITLES: Record<string, string> = Object.fromEntries(GRAMMAR_LESSONS.map((l) => [l.id, l.title]));
