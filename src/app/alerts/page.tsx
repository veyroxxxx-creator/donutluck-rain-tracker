'use client';

import Link from 'next/link';
import { useRain } from '@/context/RainContext';
import { useSettings } from '@/context/SettingsContext';
import { usePush } from '@/context/PushContext';
import { Toggle } from '@/components/Toggle';
import { NotificationPermissionPrompt } from '@/components/NotificationPermissionPrompt';

function formatLogTime(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function AlertsPage() {
  const { alertLog, triggerTestAlert } = useRain();
  const { settings, updateSettings } = useSettings();
  const { enable: enablePush, disable: disablePush } = usePush();

  return (
    <div className="animate-fadeUp space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">Alerts</h1>
        <p className="text-sm text-muted">
          Get notified the moment a new rain event begins. Fine-tune sounds and volume in{' '}
          <Link href="/settings" className="text-accent underline underline-offset-2">
            Settings
          </Link>
          .
        </p>
      </div>

      <div className="card p-5 sm:p-6">
        <h2 className="font-display text-base font-semibold">Quick controls</h2>
        <div className="mt-2 divide-y divide-border">
          <Toggle
            id="alerts-master"
            label="Rain alerts"
            description="Master switch for all alerts below."
            checked={settings.rainAlertsEnabled}
            onChange={(v) => updateSettings({ rainAlertsEnabled: v })}
          />
          <Toggle
            id="alerts-notifications"
            label="Browser notifications"
            checked={settings.browserNotificationsEnabled}
            disabled={!settings.rainAlertsEnabled}
            onChange={(v) => void (v ? enablePush() : disablePush())}
          />
          <Toggle
            id="alerts-sound"
            label="Sound alerts"
            checked={settings.soundAlertsEnabled}
            disabled={!settings.rainAlertsEnabled}
            onChange={(v) => updateSettings({ soundAlertsEnabled: v })}
          />
        </div>
        <div className="mt-3">
          <NotificationPermissionPrompt />
        </div>
        <div className="mt-4">
          <button
            type="button"
            onClick={() => void triggerTestAlert()}
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Send test alert
          </button>
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        <h2 className="font-display text-base font-semibold">Recent alerts</h2>
        {alertLog.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Nothing yet — this fills in the moment rain starts, or when you run a test alert.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {alertLog.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between py-2.5 text-sm">
                <span>{entry.kind === 'rain-start' ? 'Rain started' : 'Test alert'}</span>
                <span className="font-mono text-xs text-muted tabular-nums">{formatLogTime(entry.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
