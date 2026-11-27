import "server-only";
// Ring buffer of recent technical errors (no personal content: feature, code, short technical message).
// Persisted to Supabase (ai_error_log) when the service role key is set — see usage.ts.

export interface ErrorEntry {
  at: number;
  feature: string;
  code: string;
  message: string;
  provider?: string;
}

const RING: ErrorEntry[] = [];

export function logError(e: ErrorEntry) {
  RING.push({ ...e, message: e.message.slice(0, 300) });
  if (RING.length > 200) RING.splice(0, RING.length - 200);
}

export function recentErrors(limit = 50): ErrorEntry[] {
  return RING.slice(-limit).reverse();
}
