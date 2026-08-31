import { DONUTLUCK_RAIN_API_URL, MAX_FETCH_RETRIES, RAIN_PROXY_ENDPOINT } from '@/lib/constants';
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
 * Where a snapshot can come from, tried in order. `direct` is a real
 * browser making the request — this is the one DonutLuck's Cloudflare
 * protection actually lets through, since it's built to tell real browsers
 * apart from server/datacenter traffic (which is exactly what our own
 * `/api/rain` proxy route looks like to it, and why that route alone
 * couldn't reliably reach it). The public proxies are a best-effort
 * fallback for visitors whose own browser gets blocked — note that those
 * proxies typically also run on datacenter infrastructure, so they may hit
 * the same kind of block; they're kept here because they're free and
 * harmless to try, not because they're guaranteed to help.
 */
interface RainSource {
  name: string;
  build: () => string;
}

const SOURCES: RainSource[] = [
  { name: 'direct', build: () => DONUTLUCK_RAIN_API_URL },
  { name: 'allorigins', build: () => `https://api.allorigins.win/raw?url=${encodeURIComponent(DONUTLUCK_RAIN_API_URL)}` },
  { name: 'thingproxy', build: () => `https://thingproxy.freeboard.io/fetch/${DONUTLUCK_RAIN_API_URL}` },
  { name: 'corsproxy.io', build: () => `https://corsproxy.io/?url=${encodeURIComponent(DONUTLUCK_RAIN_API_URL)}` },
  // Last resort: our own server-side proxy. Kept as a fallback in case
  // DonutLuck's block ever eases on that front, but it's the least likely
  // of these to actually get through.
  { name: 'server-proxy', build: () => RAIN_PROXY_ENDPOINT },
];

let preferredSourceIndex = 0;
/** Which source last succeeded — exposed so the UI can be honest about how the data got here. */
export let lastSuccessfulSource: string | null = null;

async function fetchFromSource(source: RainSource, signal?: AbortSignal): Promise<RainApiResponse> {
  const res = await fetch(source.build(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = body && typeof body === 'object' && 'error' in body ? String((body as { error: unknown }).error) : null;
    throw new RainFetchError(detail ? `${source.name} error: ${detail}` : `${source.name} responded with status ${res.status}`);
  }

  const payload: unknown = await res.json();
  if (!isRainApiResponse(payload)) {
    throw new RainFetchError(`${source.name} returned an unexpected payload shape`);
  }
  return payload;
}

async function fetchRainStateOnce(signal?: AbortSignal): Promise<RainApiResponse> {
  const order = [...SOURCES.slice(preferredSourceIndex), ...SOURCES.slice(0, preferredSourceIndex)];
  let lastErr: unknown = null;

  for (const source of order) {
    if (signal?.aborted) throw new RainFetchError('Request aborted');
    try {
      const payload = await fetchFromSource(source, signal);
      preferredSourceIndex = SOURCES.indexOf(source);
      lastSuccessfulSource = source.name;
      return payload;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new RainFetchError('All sources failed');
}

/**
 * Fetches the current DonutLuck Rain state, trying a real direct browser
 * request first and falling back through public proxies (see `SOURCES`
 * above) if that's blocked. Retries the whole chain with backoff before
 * giving up on a given poll cycle.
 */
export async function fetchRainState(
  signal?: AbortSignal,
  attempt = 0,
): Promise<RainApiResponse> {
  try {
    return await fetchRainStateOnce(signal);
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
