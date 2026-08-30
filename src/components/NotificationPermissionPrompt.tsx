'use client';

import { getNotificationSupport } from '@/lib/notifications';
import { usePush } from '@/context/PushContext';
import { useSettings } from '@/context/SettingsContext';

export function NotificationPermissionPrompt() {
  const { settings } = useSettings();
  const { permission, pushStatus, pushError, enable } = usePush();
  const supported = getNotificationSupport();

  if (!supported) {
    return (
      <p className="text-xs text-muted">
        Browser notifications aren't supported in this browser. Sound alerts will still work.
      </p>
    );
  }

  if (permission === 'denied') {
    return (
      <p className="text-xs text-danger">
        Notifications are blocked. Allow them from your browser's site settings to receive alerts.
      </p>
    );
  }

  if (permission === 'granted') {
    if (pushStatus === 'subscribed') {
      return (
        <p className="text-xs text-active">
          Notifications are enabled, including push — you'll be alerted even if this tab isn't open.
        </p>
      );
    }
    if (pushStatus === 'subscribing') {
      return <p className="text-xs text-muted">Setting up push notifications…</p>;
    }
    if (pushStatus === 'unconfigured') {
      return (
        <p className="text-xs text-muted">
          Notifications are enabled for this tab. Push (alerts even when the tab is closed) isn't set up
          on this deployment yet — see the README for how to add it.
        </p>
      );
    }
    if (pushStatus === 'error') {
      return (
        <p className="text-xs text-danger">
          Notifications are enabled for this tab, but push setup failed{pushError ? `: ${pushError}` : '.'}
        </p>
      );
    }
    return <p className="text-xs text-active">Notifications are enabled for this tab.</p>;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface-2 p-4">
      <div>
        <p className="text-sm font-medium text-text">Turn on browser notifications</p>
        <p className="text-xs text-muted">
          Get notified the moment a new DonutLuck Rain event starts — including via push, if this
          deployment has it configured, even when this tab isn't open.
        </p>
      </div>
      <button
        type="button"
        onClick={() => void enable()}
        disabled={!settings.rainAlertsEnabled}
        className="shrink-0 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Enable notifications
      </button>
    </div>
  );
}
