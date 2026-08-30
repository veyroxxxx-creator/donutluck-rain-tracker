'use client';

import { useRef, useState } from 'react';
import { useRain } from '@/context/RainContext';

export function AlarmSoundManager() {
  const { alarm } = useRain();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    await alarm.uploadCustomSound(file);
    setBusy(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-text">Alarm sound</p>
          <p className="text-xs text-muted">
            {alarm.isLoading
              ? 'Loading…'
              : alarm.isCustom
                ? `Custom: ${alarm.customSoundName}`
                : 'Using the default alarm'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void alarm.play()}
            className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-text transition-colors hover:bg-surface-2"
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-text transition-colors hover:bg-surface-2 disabled:opacity-50"
          >
            {busy ? 'Uploading…' : 'Upload sound'}
          </button>
          {alarm.isCustom && (
            <button
              type="button"
              onClick={() => void alarm.resetToDefault()}
              className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-surface-2"
            >
              Remove
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="audio/mpeg,audio/wav,audio/x-wav,audio/ogg,.mp3,.wav,.ogg"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
      />
      {alarm.error && <p className="text-xs text-danger">{alarm.error}</p>}
      <p className="text-xs text-muted">
        Stored only in this browser (IndexedDB) — never uploaded anywhere.
      </p>
    </div>
  );
}
