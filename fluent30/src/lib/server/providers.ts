import "server-only";
// Registry of every external service used by Fluent30: what it powers, how it is configured, and a real health check.
// Keys are never returned: only `keyHint` (last 4 characters).
import { config } from "./config";
import { anthropicHealth } from "./ai";
import { classifyAiError } from "./errors";
import { modelForTier } from "./costs-core";

export interface Provider {
  id: string;
  label: string;
  envVars: string[];
  required: boolean;
  free: boolean;
  /** where the service runs: our server, the learner's browser */
  runs: "server" | "browser";
  features: string[];
  docsUrl: string;
  costNote: string;
  configured: () => boolean;
  keyHint?: () => string | null;
}

const hint = (v?: string) => (v && v.length >= 8 ? `…${v.slice(-4)}` : v ? "…" : null);

export const PROVIDERS: Provider[] = [
  {
    id: "anthropic",
    label: "Anthropic Claude (IA)",
    envVars: ["ANTHROPIC_API_KEY", "FLUENT30_MODEL_FAST", "FLUENT30_MODEL_STANDARD", "FLUENT30_MODEL_PREMIUM"],
    required: true,
    free: false,
    runs: "server",
    features: [
      "Fiches de vocabulaire intelligentes et classement par thème", "Traduction en contexte (liseuse, traducteur)", "Lecture de texte sur image (OCR)",
      "Analyse de photos (Memory Cards, Autour de moi)", "Conversations avec l'IA et bilans", "Correction grammaticale et explications personnalisées",
      "My Real Life English (mini-leçons, exercices, mises en situation)", "Journal corrigé", "Romans et adaptations de livres", "Évaluation de l'expression écrite",
    ],
    docsUrl: "https://console.anthropic.com/settings/keys",
    costNote: "Paiement à l'usage. Routage : Haiku 5.5 (tâches simples, 0,10 $ / 0,50 $ par million de jetons), Sonnet 5.5 (analyses, 2 $ / 10 $), Opus 5.5 (romans, évaluation, 4 $ / 20 $).",
    configured: () => !!config.anthropicKey,
    keyHint: () => hint(config.anthropicKey),
  },
  {
    id: "openai",
    label: "OpenAI (images et transcription)",
    envVars: ["OPENAI_API_KEY", "FLUENT30_IMAGE_MODEL", "FLUENT30_TRANSCRIBE_MODEL"],
    required: false,
    free: false,
    runs: "server",
    features: ["Illustrations générées pour le vocabulaire (si aucune image libre trouvée)", "Transcription audio côté serveur (navigateurs sans reconnaissance vocale)"],
    docsUrl: "https://platform.openai.com/api-keys",
    costNote: "Paiement à l'usage : ≈ 0,04 $ par illustration, ≈ 0,003 $ par minute transcrite. Facultatif : images libres (Openverse) et reconnaissance vocale du navigateur sinon.",
    configured: () => !!config.openaiKey,
    keyHint: () => hint(config.openaiKey),
  },
  {
    id: "supabase",
    label: "Supabase (comptes, synchronisation, statistiques)",
    envVars: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
    required: false,
    free: true,
    runs: "server",
    features: ["Comptes et connexion", "Sauvegarde et synchronisation entre appareils", "Cache partagé des réponses génériques", "Suivi des coûts et quotas fiables (multi-serveurs)", "Protection des fonctions IA (session obligatoire)"],
    docsUrl: "https://supabase.com/dashboard/project/_/settings/api",
    costNote: "Offre gratuite suffisante pour démarrer (500 Mo de base). Pro à 25 $/mois ensuite.",
    configured: () => !!(config.supabaseUrl && config.supabaseAnonKey),
    keyHint: () => hint(config.supabaseServiceKey ?? config.supabaseAnonKey),
  },
  {
    id: "mymemory",
    label: "MyMemory (traduction gratuite)",
    envVars: [],
    required: false,
    free: true,
    runs: "server",
    features: ["Traduction simple de mots et phrases quand l'IA n'est pas disponible"],
    docsUrl: "https://mymemory.translated.net/doc/usagelimits.php",
    costNote: "Gratuit, quota quotidien limité par adresse IP.",
    configured: () => true,
  },
  {
    id: "languagetool",
    label: "LanguageTool (correction grammaticale gratuite)",
    envVars: ["LANGUAGETOOL_URL"],
    required: false,
    free: true,
    runs: "server",
    features: ["Correction grammaticale de secours (journal, cartes postales, correcteur)"],
    docsUrl: "https://dev.languagetool.org/public-http-api",
    costNote: "API publique gratuite (≈ 20 requêtes/min) ou serveur auto-hébergé open source (LANGUAGETOOL_URL).",
    configured: () => true,
  },
  {
    id: "dictionary",
    label: "Free Dictionary API (Wiktionary)",
    envVars: [],
    required: false,
    free: true,
    runs: "browser",
    features: ["Définitions, phonétique et audio des mots dans la liseuse"],
    docsUrl: "https://dictionaryapi.dev/",
    costNote: "Gratuit (contenu Wiktionary, CC BY-SA).",
    configured: () => true,
  },
  {
    id: "openverse",
    label: "Openverse (images sous licence libre)",
    envVars: [],
    required: false,
    free: true,
    runs: "server",
    features: ["Illustrations libres de droits pour le vocabulaire, avec attribution"],
    docsUrl: "https://api.openverse.org/v1/",
    costNote: "Gratuit (limite de requêtes anonymes).",
    configured: () => true,
  },
  {
    id: "gutenberg",
    label: "Project Gutenberg (livres du domaine public)",
    envVars: [],
    required: false,
    free: true,
    runs: "server",
    features: ["Catalogue et téléchargement de classiques du domaine public"],
    docsUrl: "https://www.gutenberg.org/policy/robot_access.html",
    costNote: "Gratuit. 141 livres sont déjà intégrés à l'application.",
    configured: () => true,
  },
  {
    id: "webspeech",
    label: "Synthèse et reconnaissance vocales de l'appareil",
    envVars: [],
    required: false,
    free: true,
    runs: "browser",
    features: ["Prononciation audio", "Reconnaissance vocale et retour de prononciation"],
    docsUrl: "https://developer.mozilla.org/docs/Web/API/Web_Speech_API",
    costNote: "Gratuit, intégré au navigateur (Chrome, Edge, Safari).",
    configured: () => true,
  },
  {
    id: "tesseract",
    label: "Tesseract.js (lecture de texte locale)",
    envVars: [],
    required: false,
    free: true,
    runs: "browser",
    features: ["Lecture de texte sur image, sans IA, directement sur l'appareil"],
    docsUrl: "https://github.com/naptha/tesseract.js",
    costNote: "Gratuit et open source (Apache 2.0).",
    configured: () => true,
  },
];

export interface HealthResult {
  provider: string;
  ok: boolean;
  latencyMs: number;
  code?: string;
  error?: string;
  skipped?: boolean;
}

async function timed(url: string, init?: RequestInit) {
  const r = await fetch(url, { ...init, signal: AbortSignal.timeout(5000) });
  return r;
}

/** Real, cheap request against the provider (no tokens billed). Never logs keys. */
export async function healthCheck(id: string): Promise<HealthResult> {
  const p = PROVIDERS.find((x) => x.id === id);
  const t0 = Date.now();
  const done = (ok: boolean, extra: Partial<HealthResult> = {}): HealthResult => ({ provider: id, ok, latencyMs: Date.now() - t0, ...extra });
  if (!p) return done(false, { code: "unknown_provider", error: "Service inconnu." });
  if (p.runs === "browser") return done(true, { skipped: true, error: "S'exécute dans le navigateur de chaque utilisateur : pas de test côté serveur." });
  if (!p.configured()) return done(false, { code: "not_configured", error: `Non configuré (${p.envVars.filter((v) => !v.startsWith("FLUENT30_")).join(", ")}).` });
  try {
    switch (id) {
      case "anthropic":
        await anthropicHealth();
        return done(true);
      case "openai": {
        const r = await timed("https://api.openai.com/v1/models", { headers: { Authorization: `Bearer ${config.openaiKey}` } });
        return r.ok ? done(true) : done(false, { code: r.status === 401 ? "service_auth" : `http_${r.status}`, error: r.status === 401 ? "Clé refusée par OpenAI (invalide ou révoquée)." : `Réponse HTTP ${r.status}.` });
      }
      case "supabase": {
        const r = await timed(`${config.supabaseUrl}/auth/v1/health`, { headers: { apikey: config.supabaseAnonKey ?? "" } });
        return r.ok ? done(true) : done(false, { code: `http_${r.status}`, error: `Réponse HTTP ${r.status}.` });
      }
      case "mymemory": {
        const r = await timed("https://api.mymemory.translated.net/get?q=hello&langpair=en|fr");
        return r.ok ? done(true) : done(false, { code: `http_${r.status}`, error: `Réponse HTTP ${r.status}.` });
      }
      case "languagetool": {
        const r = await timed(`${config.languageToolUrl.replace(/\/$/, "")}/v2/languages`);
        return r.ok ? done(true) : done(false, { code: `http_${r.status}`, error: `Réponse HTTP ${r.status}.` });
      }
      case "openverse": {
        const r = await timed("https://api.openverse.org/v1/images/?q=apple&page_size=1");
        return r.ok ? done(true) : done(false, { code: `http_${r.status}`, error: `Réponse HTTP ${r.status}.` });
      }
      case "gutenberg": {
        const r = await timed("https://gutenberg.pglaf.org/", { method: "HEAD" });
        return r.ok || r.status === 405 ? done(true) : done(false, { code: `http_${r.status}`, error: `Réponse HTTP ${r.status}.` });
      }
    }
    return done(true, { skipped: true });
  } catch (e) {
    const m = classifyAiError(e);
    const detail = m.code === "service_auth" ? "Clé refusée (invalide ou révoquée)." : m.code === "timeout" || (e instanceof Error && e.name === "TimeoutError") ? "Pas de réponse en 5 secondes." : m.code === "provider_unavailable" ? "Service injoignable depuis le serveur (réseau ou panne)." : m.message;
    return done(false, { code: e instanceof Error && e.name === "TimeoutError" ? "timeout" : m.code, error: detail });
  }
}

export function providerOverview() {
  return PROVIDERS.map((p) => ({
    id: p.id,
    label: p.label,
    configured: p.configured(),
    keyHint: p.keyHint?.() ?? null,
    required: p.required,
    free: p.free,
    runs: p.runs,
    features: p.features,
    docsUrl: p.docsUrl,
    envVars: p.envVars,
    costNote: p.costNote,
  }));
}

export function modelsInUse() {
  return { fast: modelForTier("fast"), standard: modelForTier("standard"), premium: modelForTier("premium"), main: modelForTier("premium") };
}
