'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { fetchRainState, RainFetchError } from '@/services/donutluck';
import { OFFLINE_THRESHOLD_MS, POLL_INTERVAL_MS } from '@/lib/constants';
import type { ConnectionStatus, RainApiResponse } from '@/types/rain';
import { useSettings } from '@/context/SettingsContext';
import { usePush } from '@/context/PushContext';
import { useAlarmSound } from '@/hooks/useAlarmSound';
import { showRainNotification } from '@/lib/notifications';

export interface AlertLogEntry {
  id: string;
  kind: 'rain-start' | 'test';
  at: number;
}

interface RainContextValue {
  data: RainApiResponse | null;
  connectionStatus: ConnectionStatus;
  lastUpdatedAt: number | null;
  targetAt: number | null;
  /** Reference duration (seconds) the current phase started at — for progress rings. */
  phaseTotalSeconds: number | null;
  error: string | null;
  alarm: ReturnType<typeof useAlarmSound>;
  alertLog: AlertLogEntry[];
  triggerTestAlert: () => Promise<void>;
  refreshNow: () => void;
}

const RainContext = createContext<RainContextValue | null>(null);

export function RainProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const { pushStatus } = usePush();
  const alarm = useAlarmSound(settings.volume);

  const [data, setData] = useState<RainApiResponse | null>(null);
  const [receivedAt, setReceivedAt] = useState<number | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [phaseTotalSeconds, setPhaseTotalSeconds] = useState<number | null>(null);
  const [alertLog, setAlertLog] = useState<AlertLogEntry[]>([]);

  // Refs mirror the latest values so the long-lived poll loop (set up once,
  // in an effect with an empty dependency array) never reads stale state
  // from the render it was created in.
  const prevActiveRef = useRef<boolean | null>(null);
  const lastUpdatedAtRef = useRef<number | null>(null);
  const settingsRef = useRef(settings);
  const pushStatusRef = useRef(pushStatus);
  const abortRef = useRef<AbortController | null>(null);
  settingsRef.current = settings;
  pushStatusRef.current = pushStatus;

  const logAlert = useCallback((kind: AlertLogEntry['kind']) => {
    setAlertLog((prev) =>
      [
        { id: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, kind, at: Date.now() },
        ...prev,
      ].slice(0, 20),
    );
  }, []);

  const fireRainStartAlert = useCallback(async () => {
    const s = settingsRef.current;
    if (!s.rainAlertsEnabled) return;
    // If a push subscription is active, the server-side check will send an
    // OS notification independently of whether this tab is even open — firing
    // one here too would double up on the common case where the tab happens
    // to be open and polling right as the server-side check also runs.
    if (s.browserNotificationsEnabled && pushStatusRef.current !== 'subscribed') {
      showRainNotification('DonutLuck Rain is active', 'Rain event started on DonutLuck.');
    }
    if (s.soundAlertsEnabled) {
      await alarm.play();
    }
    logAlert('rain-start');
    // alarm.play is a stable useCallback reference from useAlarmSound.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alarm.play, logAlert]);

  const poll = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await fetchRainState(controller.signal);
      const now = Date.now();

      setData(result);
      setReceivedAt(now);
      setLastUpdatedAt(now);
      lastUpdatedAtRef.current = now;
      setConnectionStatus('connected');
      setError(null);

      setPhaseTotalSeconds((prevTotal) => {
        const activeChanged = prevActiveRef.current !== null && prevActiveRef.current !== result.active;
        if (activeChanged || prevTotal === null || result.time_remaining > prevTotal) {
          return result.time_remaining;
        }
        return prevTotal;
      });

      if (prevActiveRef.current === false && result.active === true) {
        void fireRainStartAlert();
      }
      prevActiveRef.current = result.active;
    } catch (err) {
      if (err instanceof RainFetchError && err.message === 'Request aborted') return;
      setError(err instanceof Error ? err.message : 'Could not reach the rain API');
      setConnectionStatus((prevStatus) => {
        const sinceLastSuccess =
          lastUpdatedAtRef.current !== null ? Date.now() - lastUpdatedAtRef.current : Infinity;
        if (sinceLastSuccess >= OFFLINE_THRESHOLD_MS) return 'offline';
        return prevStatus === 'connected' ? 'degraded' : prevStatus;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fireRainStartAlert]);

  useEffect(() => {
    void poll();
    const id = window.setInterval(() => void poll(), POLL_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void poll();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
      abortRef.current?.abort();
    };
    // poll is stable (see its own deps); this loop is intentionally set up once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const targetAt = useMemo(() => {
    if (!data || receivedAt === null) return null;
    return receivedAt + data.time_remaining * 1000;
  }, [data, receivedAt]);

  const triggerTestAlert = useCallback(async () => {
    if (settingsRef.current.browserNotificationsEnabled) {
      showRainNotification('Test alert', 'This is a test of your DonutLuck Rain alert.');
    }
    await alarm.play();
    logAlert('test');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alarm.play, logAlert]);

  const value = useMemo(
    () => ({
      data,
      connectionStatus,
      lastUpdatedAt,
      targetAt,
      phaseTotalSeconds,
      error,
      alarm,
      alertLog,
      triggerTestAlert,
      refreshNow: () => void poll(),
    }),
    [
      data,
      connectionStatus,
      lastUpdatedAt,
      targetAt,
      phaseTotalSeconds,
      error,
      alarm,
      alertLog,
      triggerTestAlert,
      poll,
    ],
  );

  return <RainContext.Provider value={value}>{children}</RainContext.Provider>;
}

export function useRain() {
  const ctx = useContext(RainContext);
  if (!ctx) throw new Error('useRain must be used within a RainProvider');
  return ctx;
}
