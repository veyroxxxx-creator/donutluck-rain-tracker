'use client';

import { useSettings, type Theme } from '@/context/SettingsContext';

const THEMES: { value: Theme; label: string; swatch: string[] }[] = [
  { value: 'cream', label: 'Cream White', swatch: ['#F6F1E7', '#B38129', '#2B2620'] },
  { value: 'black-purple', label: 'Black Purple', swatch: ['#09070E', '#8B5CF6', '#F4F1F9'] },
];

export function ThemeSelector() {
  const { settings, updateSettings } = useSettings();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {THEMES.map((theme) => {
        const isActive = settings.theme === theme.value;
        return (
          <button
            key={theme.value}
            type="button"
            onClick={() => updateSettings({ theme: theme.value })}
            aria-pressed={isActive}
            className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${
              isActive ? 'border-accent bg-surface-2' : 'border-border bg-surface hover:bg-surface-2'
            }`}
          >
            <span className="flex overflow-hidden rounded-full border border-border">
              {theme.swatch.map((c, i) => (
                <span key={i} className="h-8 w-4" style={{ backgroundColor: c }} />
              ))}
            </span>
            <span className="text-sm font-medium">{theme.label}</span>
          </button>
        );
      })}
    </div>
  );
}
