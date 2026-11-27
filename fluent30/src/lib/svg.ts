// Defensive SVG sanitiser for AI-generated pictograms (removes scripts, event handlers, external refs).
export function sanitizeSvg(input: string): string | null {
  const m = input.match(/<svg[\s\S]*<\/svg>/i);
  if (!m) return null;
  let s = m[0];
  s = s.replace(/<\s*(script|foreignObject|iframe|image|use|style|a|animate|set)[\s\S]*?<\/\s*\1\s*>/gi, "");
  s = s.replace(/<\s*(script|foreignObject|iframe|image|use|style|a|animate|set)[^>]*\/?>/gi, "");
  s = s.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  s = s.replace(/\s(href|xlink:href)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  s = s.replace(/<\s*text[\s\S]*?<\/\s*text\s*>/gi, "");
  s = s.replace(/url\(\s*['"]?(?!#)[^)]*\)/gi, "none");
  if (!/xmlns=/.test(s)) s = s.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  return s.length > 20000 ? null : s;
}
