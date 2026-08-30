import { SettingsPanel } from '@/components/SettingsPanel';

export default function SettingsPage() {
  return (
    <div className="animate-fadeUp space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">Settings</h1>
        <p className="text-sm text-muted">Alerts, sound, theme — all saved to this browser.</p>
      </div>
      <SettingsPanel />
    </div>
  );
}
