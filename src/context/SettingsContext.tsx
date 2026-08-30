'use client';

import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { LOCAL_STORAGE_SETTINGS_KEY } from '@/lib/constants';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export type Theme = 'cream' | 'black-purple';

export interface Settings {
  theme: Theme;
  rainAlertsEnabled: boolean;
  browserNotificationsEnabled: boolean;
  soundAlertsEnabled: boolean;
  volume: number; // 0..1
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'cream',
  rainAlertsEnabled: true,
  browserNotificationsEnabled: false,
  soundAlertsEnabled: true,
  volume: 0.7,
};

interface SettingsContextValue {
  settings: Settings;
  hydrated: boolean;
  updateSettings: (patch: Partial<Settings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings, hydrated] = useLocalStorage<Settings>(
    LOCAL_STORAGE_SETTINGS_KEY,
    DEFAULT_SETTINGS,
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      setSettings((prev) => ({ ...prev, ...patch }));
    },
    [setSettings],
  );

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, [setSettings]);

  const value = useMemo(
    () => ({ settings, hydrated, updateSettings, resetSettings }),
    [settings, hydrated, updateSettings, resetSettings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
}
