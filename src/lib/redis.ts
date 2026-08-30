import { Redis } from '@upstash/redis';

let client: Redis | null = null;

/**
 * Returns a shared Upstash Redis client, or null if the required env vars
 * aren't configured. Server (and cron-job) storage is optional at the code
 * level so the rest of the app degrades instead of crashing if it isn't set
 * up yet — but push notifications require it, since subscriptions have to
 * survive between serverless invocations.
 *
 * Set these from the Upstash Redis integration in the Vercel Marketplace
 * (or any Upstash database): UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN.
 */
export function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  if (!client) {
    client = new Redis({ url, token });
  }
  return client;
}
