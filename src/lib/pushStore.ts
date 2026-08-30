import { createHash } from 'crypto';
import { getRedis } from '@/lib/redis';

export interface PushSubscriptionRecord {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  savedAt: number;
}

const SUBS_INDEX_KEY = 'push:subs:index';
const SUB_KEY_PREFIX = 'push:sub:';
const PREV_ACTIVE_KEY = 'rain:prevActive';

function subId(endpoint: string): string {
  return createHash('sha256').update(endpoint).digest('hex').slice(0, 32);
}

export async function saveSubscription(sub: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  const redis = getRedis();
  if (!redis) throw new Error('Redis is not configured (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)');
  const id = subId(sub.endpoint);
  const record: PushSubscriptionRecord = { endpoint: sub.endpoint, keys: sub.keys, savedAt: Date.now() };
  await redis.set(SUB_KEY_PREFIX + id, JSON.stringify(record));
  await redis.sadd(SUBS_INDEX_KEY, id);
}

export async function deleteSubscription(endpoint: string) {
  const redis = getRedis();
  if (!redis) return;
  const id = subId(endpoint);
  await redis.del(SUB_KEY_PREFIX + id);
  await redis.srem(SUBS_INDEX_KEY, id);
}

export async function listSubscriptions(): Promise<PushSubscriptionRecord[]> {
  const redis = getRedis();
  if (!redis) return [];
  const ids = (await redis.smembers(SUBS_INDEX_KEY)) as string[];
  if (!ids || ids.length === 0) return [];
  const raw = await Promise.all(ids.map((id) => redis.get<string | PushSubscriptionRecord>(SUB_KEY_PREFIX + id)));
  const records: PushSubscriptionRecord[] = [];
  raw.forEach((value: string | PushSubscriptionRecord | null, i: number) => {
    if (!value) return; // stale index entry, subscription no longer stored
    try {
      const parsed = typeof value === 'string' ? (JSON.parse(value) as PushSubscriptionRecord) : value;
      records.push(parsed);
    } catch {
      // Corrupt entry — drop its index reference so it doesn't linger.
      const staleId = ids[i];
      if (staleId) void redis.srem(SUBS_INDEX_KEY, staleId);
    }
  });
  return records;
}

/** Removes a subscription by its raw endpoint — used when a push send comes back as gone/expired. */
export async function removeSubscriptionByEndpoint(endpoint: string) {
  await deleteSubscription(endpoint);
}

export async function getPrevActive(): Promise<boolean | null> {
  const redis = getRedis();
  if (!redis) return null;
  const value = await redis.get<string>(PREV_ACTIVE_KEY);
  if (value === null || value === undefined) return null;
  return value === 'true' || (value as unknown as boolean) === true;
}

export async function setPrevActive(active: boolean) {
  const redis = getRedis();
  if (!redis) return;
  await redis.set(PREV_ACTIVE_KEY, String(active));
}
