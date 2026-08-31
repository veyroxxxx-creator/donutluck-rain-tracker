import { MAX_FETCH_RETRIES, RAIN_PROXY_ENDPOINT } from '@/lib/constants';
import { isRainApiResponse, type RainApiResponse } from '@/types/rain';

export class RainFetchError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'RainFetchError';
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches the current DonutLuck Rain state.
 *
 * All requests go through our own `/api/rain` route (see
 * `src/app/api/rain/route.ts`), which proxies `DONUTLUCK_RAIN_API_URL`
 * server-side. This is the only function in the app that should talk to
 * that route — keep it that way so the fetch/error/retry behavior stays in
 * one place.
 */
export async function fetchRainState(
  signal?: AbortSignal,
  attempt = 0,
): Promise<RainApiResponse> {
  try {
    const res = await fetch(RAIN_PROXY_ENDPOINT, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const detail = body && typeof body === 'object' && 'error' in body ? String((body as { error: unknown }).error) : null;
      throw new RainFetchError(detail ? `Rain proxy error: ${detail}` : `Rain proxy responded with status ${res.status}`);
    }

    const payload: unknown = await res.json();

    if (!isRainApiResponse(payload)) {
      throw new RainFetchError('Rain proxy returned an unexpected payload shape');
    }

    return payload;
  } catch (err) {
    if (signal?.aborted) {
      throw new RainFetchError('Request aborted', err);
    }
    if (attempt < MAX_FETCH_RETRIES) {
      await delay(400 * 2 ** attempt);
      return fetchRainState(signal, attempt + 1);
    }
    throw err instanceof RainFetchError ? err : new RainFetchError('Network request failed', err);
  }
}
