'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getExistingPushSubscription,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/pushClient';
import {
  getNotificationPermission,
  requestNotificationPermission,
  type NotificationPermissionState,
} from '@/lib/notifications';
import { useSettings } from '@/context/SettingsContext';

export type PushStatus = 'unsupported' | 'unconfigured' | 'idle' | 'subscribing' | 'subscribed' | 'error';

interface PushContextValue {
  permission: NotificationPermissionState;
  pushStatus: PushStatus;
  pushError: string | null;
  /** Requests OS permission (if needed) and subscribes to push; also flips the setting on. */
  enable: () => Promise<void>;
  /** Unsubscribes from push and flips the setting off. */
  disable: () => Promise<void>;
}

const PushContext = createContext<PushContextValue | null>(null);

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export function PushProvider({ children }: { children: React.ReactNode }) {
  const { settings, updateSettings } = useSettings();
  const [permission, setPermission] = useState<NotificationPermissionState>('default');
  const [pushStatus, setPushStatus] = useState<PushStatus>('idle');
  const [pushError, setPushError] = useState<string | null>(null);

  useEffect(() => {
    setPermission(getNotificationPermission());
    if (!isPushSupported()) {
      setPushStatus('unsupported');
      return;
    }
    if (!VAPID_PUBLIC_KEY) {
      setPushStatus('unconfigured');
      return;
    }
    getExistingPushSubscription()
      .then((sub) => setPushStatus(sub ? 'subscribed' : 'idle'))
      .catch(() => setPushStatus('idle'));
  }, []);

  const enable = useCallback(async () => {
    setPushError(null);

    if (!isPushSupported()) {
      // No push support — still let plain (tab-open) browser notifications work.
      const result = await requestNotificationPermission();
      setPermission(result);
      if (result === 'granted') updateSettings({ browserNotificationsEnabled: true });
      return;
    }

    const result = await requestNotificationPermission();
    setPermission(result);
    if (result !== 'granted') return;

    updateSettings({ browserNotificationsEnabled: true });

    if (!VAPID_PUBLIC_KEY) {
      setPushStatus('unconfigured');
      return;
    }

    setPushStatus('subscribing');
    try {
      await subscribeToPush(VAPID_PUBLIC_KEY);
      setPushStatus('subscribed');
    } catch (err) {
      setPushStatus('error');
      setPushError(err instanceof Error ? err.message : 'Could not enable push notifications.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateSettings]);

  const disable = useCallback(async () => {
    updateSettings({ browserNotificationsEnabled: false });
    if (!isPushSupported()) return;
    try {
      await unsubscribeFromPush();
      setPushStatus('idle');
    } catch {
      // Best-effort — the setting is already off locally either way.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateSettings]);

  const value = useMemo(
    () => ({ permission, pushStatus, pushError, enable, disable }),
    [permission, pushStatus, pushError, enable, disable],
  );

  // Keep the setting and the actual subscription from drifting apart if
  // something external (browser UI) revokes permission.
  useEffect(() => {
    if (permission === 'denied' && settings.browserNotificationsEnabled) {
      updateSettings({ browserNotificationsEnabled: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission]);

  return <PushContext.Provider value={value}>{children}</PushContext.Provider>;
}

export function usePush() {
  const ctx = useContext(PushContext);
  if (!ctx) throw new Error('usePush must be used within a PushProvider');
  return ctx;
}
