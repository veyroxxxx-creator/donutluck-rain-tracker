'use client';

import { useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { useRain } from '@/context/RainContext';
import { usePush } from '@/context/PushContext';
import { Toggle } from '@/components/Toggle';
import { ThemeSelector } from '@/components/ThemeSelector';
import { AlarmSoundManager } from '@/components/AlarmSoundManager';
import { NotificationPermissionPrompt } from '@/components/NotificationPermissionPrompt';
import { showRainNotification, getNotificationPermission } from '@/lib/notifications';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5 sm:p-6">
      <h2 className="font-display text-base font-semibold">{title}</h2>
      <div className="mt-3 divide-y divide-border">{children}</div>
    </div>
  );
}

export function SettingsPanel() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { triggerTestAlert } = useRain();
  const { enable: enablePush, disable: disablePush } = usePush();
  const [testFeedback, setTestFeedback] = useState<string | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const handleTestNotification = () => {
    if (getNotificationPermission() !== 'granted') {
      setTestFeedback('Enable browser notifications above to test this.');
      return;
    }
    showRainNotification('Test notification', 'This is a test alert from DonutLuck Rain Tracker.');
    setTestFeedback('Test notification sent.');
  };

  const handleTestAlarm = async () => {
    await triggerTestAlert();
    setTestFeedback('Playing test alarm…');
  };

  const handleReset = () => {
    if (!confirmingReset) {
      setConfirmingReset(true);
      return;
    }
    resetSettings();
    setConfirmingReset(false);
    setTestFeedback('Settings reset to defaults.');
  };

  return (
    <div className="flex flex-col gap-4">
      <Section title="Rain alerts">
        <Toggle
          id="rain-alerts"
          label="Rain alerts"
          description="Master switch for notifications and sound when rain starts."
          checked={settings.rainAlertsEnabled}
          onChange={(v) => updateSettings({ rainAlertsEnabled: v })}
        />
        <Toggle
          id="browser-notifications"
          label="Browser notifications"
          description="Show a system notification when a new rain event starts — including via push, if configured, when this tab isn't open."
          checked={settings.browserNotificationsEnabled}
          disabled={!settings.rainAlertsEnabled}
          onChange={(v) => void (v ? enablePush() : disablePush())}
        />
        <Toggle
          id="sound-alerts"
          label="Sound alerts"
          description="Play an alarm sound when a new rain event starts."
          checked={settings.soundAlertsEnabled}
          disabled={!settings.rainAlertsEnabled}
          onChange={(v) => updateSettings({ soundAlertsEnabled: v })}
        />
        <div className="pt-3">
          <NotificationPermissionPrompt />
        </div>
      </Section>

      <Section title="Alarm sound">
        <div className="py-3">
          <label htmlFor="volume" className="mb-2 block text-sm font-medium text-text">
            Alarm volume
          </label>
          <input
            id="volume"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={settings.volume}
            onChange={(e) => updateSettings({ volume: Number(e.target.value) })}
            className="w-full accent-[rgb(var(--color-accent))]"
          />
        </div>
        <div className="py-3">
          <AlarmSoundManager />
        </div>
      </Section>

      <Section title="Test your alerts">
        <div className="flex flex-wrap gap-2 py-3">
          <button
            type="button"
            onClick={handleTestNotification}
            className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-2"
          >
            Test notification
          </button>
          <button
            type="button"
            onClick={() => void handleTestAlarm()}
            className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-2"
          >
            Test alarm
          </button>
        </div>
        {testFeedback && <p className="pb-1 text-xs text-muted">{testFeedback}</p>}
      </Section>

      <Section title="Theme">
        <div className="py-3">
          <ThemeSelector />
        </div>
      </Section>

      <Section title="Reset">
        <div className="flex items-center justify-between gap-3 py-3">
          <p className="text-xs text-muted">Restore alerts, sound and theme to their defaults.</p>
          <button
            type="button"
            onClick={handleReset}
            onBlur={() => setConfirmingReset(false)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              confirmingReset
                ? 'bg-danger text-white'
                : 'border border-border bg-surface hover:bg-surface-2'
            }`}
          >
            {confirmingReset ? 'Confirm reset' : 'Reset settings'}
          </button>
        </div>
      </Section>
    </div>
  );
}
