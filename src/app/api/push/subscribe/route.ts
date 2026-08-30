import { NextResponse } from 'next/server';
import { deleteSubscription, saveSubscription } from '@/lib/pushStore';
import { getRedis } from '@/lib/redis';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface SubscribeBody {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
}

interface ValidSubscribeBody {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

function isValidSubscriptionBody(body: unknown): body is ValidSubscribeBody {
  if (!body || typeof body !== 'object') return false;
  const b = body as SubscribeBody;
  return (
    typeof b.endpoint === 'string' &&
    b.endpoint.length > 0 &&
    !!b.keys &&
    typeof b.keys.p256dh === 'string' &&
    typeof b.keys.auth === 'string'
  );
}

export async function POST(request: Request) {
  if (!getRedis()) {
    return NextResponse.json(
      { error: 'Push storage is not configured on this deployment (missing UPSTASH_REDIS_REST_URL/TOKEN).' },
      { status: 503 },
    );
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!isValidSubscriptionBody(body)) {
    return NextResponse.json({ error: 'Expected a PushSubscription-shaped body' }, { status: 400 });
  }
  try {
    await saveSubscription({ endpoint: body.endpoint, keys: { p256dh: body.keys.p256dh, auth: body.keys.auth } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to save subscription' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const endpoint = (body as { endpoint?: unknown } | null)?.endpoint;
  if (typeof endpoint !== 'string' || endpoint.length === 0) {
    return NextResponse.json({ error: 'Expected { endpoint: string }' }, { status: 400 });
  }
  await deleteSubscription(endpoint);
  return NextResponse.json({ ok: true });
}
