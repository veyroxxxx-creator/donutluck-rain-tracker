'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { deleteCustomSound, loadCustomSound, saveCustomSound, type StoredSound } from '@/lib/indexedDb';

const DEFAULT_ALARM_SRC = '/sounds/default-alarm.wav';
const ACCEPTED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/mp3'];

export interface AlarmSoundState {
  customSoundName: string | null;
  isCustom: boolean;
  isLoading: boolean;
  error: string | null;
  /** True once a user gesture has successfully unlocked audio playback. */
  unlocked: boolean;
}

export function useAlarmSound(volume: number) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [state, setState] = useState<AlarmSoundState>({
    customSoundName: null,
    isCustom: false,
    isLoading: true,
    error: null,
    unlocked: false,
  });

  const applySource = useCallback((src: string, isCustom: boolean, name: string | null) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'auto';
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    audioRef.current.src = src;
    setState((s) => ({ ...s, isCustom, customSoundName: name }));
  }, []);

  // Load whatever sound was previously stored, on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored: StoredSound | null = await loadCustomSound();
        if (cancelled) return;
        if (stored) {
          const url = URL.createObjectURL(stored.blob);
          objectUrlRef.current = url;
          applySource(url, true, stored.name);
        } else {
          applySource(DEFAULT_ALARM_SRC, false, null);
        }
      } catch {
        if (!cancelled) applySource(DEFAULT_ALARM_SRC, false, null);
      } finally {
        if (!cancelled) setState((s) => ({ ...s, isLoading: false }));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = Math.min(1, Math.max(0, volume));
  }, [volume]);

  const play = useCallback(async (): Promise<boolean> => {
    const audio = audioRef.current;
    if (!audio) return false;
    try {
      audio.currentTime = 0;
      await audio.play();
      setState((s) => (s.unlocked ? s : { ...s, unlocked: true }));
      return true;
    } catch (err) {
      // Autoplay was blocked — this only happens before any user gesture has
      // unlocked audio on the page. Surface it instead of failing silently.
      setState((s) => ({
        ...s,
        error:
          err instanceof Error && err.name === 'NotAllowedError'
            ? 'Your browser blocked the alarm sound. Click "Test alarm" once to enable it.'
            : 'Could not play the alarm sound.',
      }));
      return false;
    }
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }, []);

  const uploadCustomSound = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type) && !/\.(mp3|wav|ogg)$/i.test(file.name)) {
        setState((s) => ({ ...s, error: 'Please upload an MP3, WAV or OGG file.' }));
        return;
      }
      try {
        await saveCustomSound(file);
        const url = URL.createObjectURL(file);
        objectUrlRef.current = url;
        applySource(url, true, file.name);
        setState((s) => ({ ...s, error: null }));
      } catch {
        setState((s) => ({ ...s, error: 'Could not save that sound in your browser.' }));
      }
    },
    [applySource],
  );

  const resetToDefault = useCallback(async () => {
    try {
      await deleteCustomSound();
    } finally {
      applySource(DEFAULT_ALARM_SRC, false, null);
    }
  }, [applySource]);

  return { ...state, play, stop, uploadCustomSound, resetToDefault };
}
