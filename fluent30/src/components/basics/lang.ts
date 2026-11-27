// Pure helpers: numbers and clock times written out in English.
const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

/** British style ("one hundred and five"); american=true drops the "and". */
export function numberToWords(n: number, american = false): string {
  if (n < 0) return `minus ${numberToWords(-n, american)}`;
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : "");
  if (n < 1000) {
    const rest = n % 100;
    return `${ONES[Math.floor(n / 100)]} hundred${rest ? `${american ? " " : " and "}${numberToWords(rest, american)}` : ""}`;
  }
  for (const [value, name] of [[1_000_000_000, "billion"], [1_000_000, "million"], [1000, "thousand"]] as [number, string][]) {
    if (n >= value) {
      const rest = n % value;
      const joiner = rest === 0 ? "" : rest < 100 && !american ? " and " : rest < 100 ? " " : ", ";
      return `${numberToWords(Math.floor(n / value), american)} ${name}${rest ? joiner + numberToWords(rest, american) : ""}`;
    }
  }
  return String(n);
}

/** Years are read in pairs: 1998 → "nineteen ninety-eight", 2005 → "two thousand and five", 2024 → "twenty twenty-four". */
export function yearToWords(y: number): string {
  if (y >= 2000 && y < 2010) return numberToWords(y);
  const hi = Math.floor(y / 100);
  const lo = y % 100;
  if (lo === 0) return `${numberToWords(hi)} hundred`;
  return `${numberToWords(hi)} ${lo < 10 ? `oh ${numberToWords(lo)}` : numberToWords(lo)}`;
}

/** "It's half past three", "It's quarter to four", "It's twenty-five past eleven". */
export function timeToWords(h24: number, m: number): string {
  const h12 = (x: number) => ((x + 11) % 12) + 1;
  const name = (x: number) => (x % 24 === 0 ? "midnight" : x % 24 === 12 ? "midday" : numberToWords(h12(x)));
  if (m === 0) return h24 % 12 === 0 ? `It's ${name(h24)}.` : `It's ${numberToWords(h12(h24))} o'clock.`;
  if (m === 15) return `It's quarter past ${name(h24)}.`;
  if (m === 30) return `It's half past ${name(h24)}.`;
  if (m === 45) return `It's quarter to ${name(h24 + 1)}.`;
  const minutes = (x: number) => `${numberToWords(x)}${x % 5 === 0 ? "" : x === 1 ? " minute" : " minutes"}`;
  if (m < 30) return `It's ${minutes(m)} past ${name(h24)}.`;
  return `It's ${minutes(60 - m)} to ${name(h24 + 1)}.`;
}

/** Digital reading: "It's three forty-five p.m." */
export function timeToDigital(h24: number, m: number): string {
  const h12 = ((h24 + 11) % 12) + 1;
  const mm = m === 0 ? "o'clock" : m < 10 ? `oh ${numberToWords(m)}` : numberToWords(m);
  return `It's ${numberToWords(h12)} ${mm}${m === 0 ? "" : ""} ${h24 < 12 ? "a.m." : "p.m."}`.replace(" o'clock a.m.", " a.m.").replace(" o'clock p.m.", " p.m.");
}

export function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Spoken phone number, digit by digit with "double" (British habit): 07788 → "oh seven double seven eight eight". */
export function phoneToWords(digits: string): string {
  const d = digits.replace(/\D/g, "").split("");
  const out: string[] = [];
  for (let i = 0; i < d.length; i++) {
    const w = d[i] === "0" ? "oh" : ONES[Number(d[i])];
    if (d[i + 1] === d[i] && d[i + 2] !== d[i]) {
      out.push(`double ${w}`);
      i++;
    } else out.push(w);
  }
  return out.join(" ");
}
