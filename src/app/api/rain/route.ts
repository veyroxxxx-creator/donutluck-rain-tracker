import { NextResponse } from 'next/server';
import { fetchUpstreamRainState, UpstreamRainError } from '@/lib/rainSource';

// Always fetch fresh data — this route is the trust boundary for upstream state.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Same-origin proxy for the DonutLuck Rain API.
 *
 * The browser never talks to donutluck.com directly. This avoids any CORS
 * restriction the upstream API might impose, keeps the upstream URL out of
 * client bundles/network tabs beyond this one route, and gives us a single
 * place to normalize errors and timeouts.
 *
 * No API key is used or required — the upstream endpoint is public.
 */
export async function GET() {
  try {
    const data = await fetchUpstreamRainState();
    return NextResponse.json(data, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    const status = err instanceof UpstreamRainError ? err.status : 502;
    const message = err instanceof Error ? err.message : 'Unknown upstream error';
    return NextResponse.json({ error: message }, { status });
  }
}
