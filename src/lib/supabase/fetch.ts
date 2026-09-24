/**
 * Bounded fetch untuk Supabase clients.
 *
 * - Timeout 8s per request — host yang mati/paused tidak boleh me-stall.
 * - Circuit breaker: setelah fetch gagal (network/DNS/timeout), semua call
 *   berikutnya fail-instant selama 30s. Mencegah sequential queries masing-masing
 *   nunggu timeout penuh saat host unreachable.
 * - HTTP error (4xx/5xx) TIDAK membuka circuit — hanya connectivity failure.
 */

const TIMEOUT_MS = 8000;
const CIRCUIT_OPEN_MS = 30_000;

let circuitOpenUntil = 0;

export const supabaseFetch: typeof fetch = async (input, init) => {
  if (Date.now() < circuitOpenUntil) {
    throw new Error("Supabase unreachable (circuit open)");
  }
  try {
    return await fetch(input, {
      ...init,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    circuitOpenUntil = Date.now() + CIRCUIT_OPEN_MS;
    throw err;
  }
};
