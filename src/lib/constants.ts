/**
 * Single source of truth for the upstream DonutLuck Rain API.
 * Nothing else in the app should hardcode this URL — see
 * `src/services/donutluck.ts` and `src/app/api/rain/route.ts`.
 */
export const DONUTLUCK_RAIN_API_URL = 'https://donutluck.com/api/chat/rain/state';

/** Our own same-origin proxy route that the browser actually calls. */
export const RAIN_PROXY_ENDPOINT = '/api/rain';

/** How often the browser asks the server for a fresh snapshot. */
export const POLL_INTERVAL_MS = 7000;

/** If we haven't heard back successfully in this long, show "offline". */
export const OFFLINE_THRESHOLD_MS = POLL_INTERVAL_MS * 3;

/** How many times to retry a failed fetch, with backoff, before giving up on that cycle. */
export const MAX_FETCH_RETRIES = 2;

export const SITE_NAME = 'DonutLuck Rain Tracker';
export const SITE_DOMAIN = 'donutluckraintracker.com';
export const SITE_DESCRIPTION =
  'Track DonutLuck Rain events with a live countdown, notifications and custom alarms.';

export const LOCAL_STORAGE_SETTINGS_KEY = 'dlrt.settings.v1';
export const INDEXED_DB_NAME = 'dlrt-sounds';
export const INDEXED_DB_STORE = 'alarm-sound';
export const INDEXED_DB_KEY = 'custom-alarm';
