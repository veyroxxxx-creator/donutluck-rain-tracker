import { DONUTLUCK_RAIN_API_URL } from '@/lib/constants';
import { isRainApiResponse, type RainApiResponse } from '@/types/rain';

export class UpstreamRainError extends Error {
  constructor(message: string, public readonly status = 502) {
    super(message);
    this.name = 'UpstreamRainError';
  }
}

/**
 * Fetches and validates the current state directly from donutluck.com.
 * Server-side only — this is the one place that holds `DONUTLUCK_RAIN_API_URL`.
 * Used by both `/api/rain` (the browser-facing proxy) and `/api/push/check`
 * (the scheduled job that watches for a new rain event).
 */
export async function fetchUpstreamRainState(timeoutMs = 6000): Promise<RainApiResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const upstream = await fetch(DONUTLUCK_RAIN_API_URL, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!upstream.ok) {
      throw new UpstreamRainError(`Upstream responded with status ${upstream.status}`, 502);
    }

    const payload: unknown = await upstream.json();

    if (!isRainApiResponse(payload)) {
      throw new UpstreamRainError('Upstream response did not match the expected rain state shape', 502);
    }

    return payload;
  } catch (err) {
    if (err instanceof UpstreamRainError) throw err;
    const timedOut = err instanceof Error && err.name === 'AbortError';
    throw new UpstreamRainError(timedOut ? 'Upstream request timed out' : 'Upstream request failed', 504);
  } finally {
    clearTimeout(timeout);
  }
}
