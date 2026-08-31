import { DONUTLUCK_RAIN_API_URL } from '@/lib/constants';
import { isRainApiResponse, type RainApiResponse } from '@/types/rain';

export class UpstreamRainError extends Error {
  constructor(message: string, public readonly status = 502) {
    super(message);
    this.name = 'UpstreamRainError';
  }
}

// Some APIs block or challenge requests that don't look like they're coming
// from a real browser (no/unusual User-Agent is a common signal serverless
// functions trip that a normal browser tab never would). Sending a standard
// browser User-Agent avoids that class of false-positive block.
const BROWSER_LIKE_HEADERS = {
  Accept: 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

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
      headers: BROWSER_LIKE_HEADERS,
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!upstream.ok) {
      // Include a snippet of the body — if this is a bot-block/challenge
      // page rather than a real API error, the snippet makes that obvious
      // instead of just a bare status code.
      const snippet = await upstream.text().then((t) => t.slice(0, 200)).catch(() => '');
      throw new UpstreamRainError(
        `Upstream responded with status ${upstream.status}${snippet ? ` — body: ${snippet}` : ''}`,
        502,
      );
    }

    const payload: unknown = await upstream.json();

    if (!isRainApiResponse(payload)) {
      throw new UpstreamRainError(
        `Upstream response did not match the expected rain state shape — got: ${JSON.stringify(payload).slice(0, 200)}`,
        502,
      );
    }

    return payload;
  } catch (err) {
    if (err instanceof UpstreamRainError) throw err;
    const timedOut = err instanceof Error && err.name === 'AbortError';
    const detail = err instanceof Error ? err.message : String(err);
    throw new UpstreamRainError(timedOut ? 'Upstream request timed out' : `Upstream request failed: ${detail}`, 504);
  } finally {
    clearTimeout(timeout);
  }
}
