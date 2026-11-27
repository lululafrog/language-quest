// Free, openly licensed illustrations via Openverse (WordPress Foundation's search of CC-licensed media).
// No key needed for low volume. We only keep CC0 / Public Domain Mark / CC BY images and always store the attribution.

export interface OpenverseItem {
  id: string;
  title?: string;
  url: string;
  thumbnail?: string;
  creator?: string;
  creator_url?: string;
  license: string; // "cc0", "pdm", "by", "by-sa", ...
  license_version?: string;
  license_url?: string;
  foreign_landing_url?: string;
  mature?: boolean;
  filetype?: string;
  width?: number;
  height?: number;
}

const ALLOWED = ["cc0", "pdm", "by"];

export interface OpenverseImage {
  url: string;
  license: string;
  licenseUrl?: string;
  creator?: string;
  source?: string;
  attribution: string;
  engine: "openverse";
}

export function pickOpenverse(results: OpenverseItem[]): OpenverseImage | null {
  const ok = results
    .filter((r) => !r.mature && ALLOWED.includes((r.license || "").toLowerCase()) && (r.url || r.thumbnail))
    .filter((r) => !r.filetype || ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(r.filetype.toLowerCase()))
    .sort((a, b) => ALLOWED.indexOf(a.license.toLowerCase()) - ALLOWED.indexOf(b.license.toLowerCase()));
  const r = ok[0];
  if (!r) return null;
  const lic = r.license.toLowerCase() === "pdm" ? "Domaine public" : r.license.toLowerCase() === "cc0" ? "CC0" : `CC BY${r.license_version ? " " + r.license_version : ""}`;
  return {
    url: r.thumbnail || r.url,
    license: lic,
    licenseUrl: r.license_url,
    creator: r.creator,
    source: r.foreign_landing_url,
    attribution: `${r.title ? `« ${r.title} » ` : ""}${r.creator ? `par ${r.creator}` : "auteur inconnu"} — ${lic} (via Openverse)`,
    engine: "openverse",
  };
}

export async function openverseSearch(q: string): Promise<OpenverseImage | null> {
  const url = new URL("https://api.openverse.org/v1/images/");
  url.searchParams.set("q", q.slice(0, 80));
  url.searchParams.set("license", ALLOWED.join(","));
  url.searchParams.set("page_size", "8");
  url.searchParams.set("mature", "false");
  const r = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) });
  if (!r.ok) return null;
  const j = (await r.json()) as { results?: OpenverseItem[] };
  return pickOpenverse(j.results ?? []);
}
