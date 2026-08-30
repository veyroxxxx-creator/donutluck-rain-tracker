import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { fetchUpstreamRainState } from '@/lib/rainSource';
import { getPrevActive, listSubscriptions, removeSubscriptionByEndpoint, setPrevActive } from '@/lib/pushStore';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  // If no secret is configured, refuse to run rather than silently allowing
  // anyone on the internet to trigger sends.
  if (!secret) return false;

  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${secret}`) return true;

  const url = new URL(request.url);
  if (url.searchParams.get('secret') === secret) return true;

  return false;
}

function vapidConfigured() {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let data;
  try {
    data = await fetchUpstreamRainState();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not reach the rain API' },
      { status: 502 },
    );
  }

  const prevActive = await getPrevActive();
  const isNewRainEvent = prevActive === false && data.active === true;
  await setPrevActive(data.active);

  if (!isNewRainEvent) {
    return NextResponse.json({ active: data.active, transitioned: false, notified: 0 });
  }

  if (!vapidConfigured()) {
    return NextResponse.json(
      { active: data.active, transitioned: true, notified: 0, error: 'VAPID keys are not configured — push skipped.' },
      { status: 200 },
    );
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT as string,
    process.env.VAPID_PUBLIC_KEY as string,
    process.env.VAPID_PRIVATE_KEY as string,
  );

  const subscriptions = await listSubscriptions();
  const payload = JSON.stringify({
    title: 'DonutLuck Rain is active',
    body: 'Rain event started on DonutLuck.',
  });

  let notified = 0;
  let removed = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload,
        );
        notified += 1;
      } catch (err) {
        const statusCode = (err as { statusCode?: number } | null)?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Subscription is gone (user revoked permission, uninstalled, etc.) — clean it up.
          await removeSubscriptionByEndpoint(sub.endpoint);
          removed += 1;
        }
        // Other errors (e.g. a transient 5xx from the push service) are left
        // for the next check cycle rather than dropping the subscription.
      }
    }),
  );

  return NextResponse.json({
    active: data.active,
    transitioned: true,
    subscriptions: subscriptions.length,
    notified,
    removed,
  });
}
