/**
 * Shape returned by the DonutLuck Rain API.
 * https://donutluck.com/api/chat/rain/state
 *
 * Only these four fields are documented as present on the response.
 * Nothing else should be assumed about the payload.
 */
export interface RainApiResponse {
  active: boolean;
  time_remaining: number;
  participants_count: number;
  prize: number;
}

/** Narrower type guard so a malformed response never reaches the UI. */
export function isRainApiResponse(value: unknown): value is RainApiResponse {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.active === 'boolean' &&
    typeof v.time_remaining === 'number' &&
    Number.isFinite(v.time_remaining) &&
    typeof v.participants_count === 'number' &&
    Number.isFinite(v.participants_count) &&
    typeof v.prize === 'number' &&
    Number.isFinite(v.prize)
  );
}

/** Connection status of the polling loop, independent of rain state. */
export type ConnectionStatus = 'connecting' | 'connected' | 'degraded' | 'offline';

/**
 * Client-side snapshot combining the last known API payload with metadata
 * about when it arrived and how the local countdown should be anchored.
 */
export interface RainSnapshot {
  data: RainApiResponse;
  /** Client timestamp (ms) when this snapshot was received. */
  receivedAt: number;
  /** Client timestamp (ms) this snapshot's countdown reaches zero. */
  targetAt: number;
}
