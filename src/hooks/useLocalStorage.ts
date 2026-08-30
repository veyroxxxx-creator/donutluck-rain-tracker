'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Persists a piece of state to localStorage under `key`. SSR-safe: the
 * initial render always uses `initialValue`, then hydrates from storage on
 * mount so there's never a server/client markup mismatch.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        setValue(JSON.parse(raw) as T);
      }
    } catch {
      // Corrupt or inaccessible storage — fall back to the initial value.
    } finally {
      setHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // Storage full or blocked — value still updates in memory for this session.
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, update, hydrated] as const;
}
