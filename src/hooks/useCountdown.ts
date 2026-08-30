'use client';

import { useEffect, useState } from 'react';

/**
 * Ticks down to `targetAtMs` once a second. Because the remaining value is
 * always recomputed from `Date.now()` against a fixed target timestamp
 * (rather than decremented in place), the displayed number stays correct
 * even if the tab was throttled or backgrounded and misses ticks — the next
 * tick just jumps straight to the right value instead of drifting.
 */
export function useCountdown(targetAtMs: number | null): number {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() =>
    targetAtMs === null ? 0 : Math.max(0, Math.round((targetAtMs - Date.now()) / 1000)),
  );

  useEffect(() => {
    if (targetAtMs === null) {
      setRemainingSeconds(0);
      return;
    }

    const tick = () => {
      setRemainingSeconds(Math.max(0, Math.round((targetAtMs - Date.now()) / 1000)));
    };

    tick();
    const id = window.setInterval(tick, 1000);

    // Re-sync immediately whenever the tab regains visibility, rather than
    // waiting for the next 1s tick.
    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [targetAtMs]);

  return remainingSeconds;
}
