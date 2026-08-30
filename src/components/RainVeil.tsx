'use client';

import { useMemo } from 'react';

interface RainVeilProps {
  active: boolean;
  className?: string;
}

interface Streak {
  left: number;
  duration: number;
  delay: number;
  height: number;
  opacity: number;
}

/**
 * A quiet field of falling streaks behind the countdown ring — DonutLuck
 * Rain, made literal. Slow and sparse at rest; it quickens the moment rain
 * goes active, so the state of the dashboard is legible before you even
 * read a number.
 */
export function RainVeil({ active, className = '' }: RainVeilProps) {
  const streaks = useMemo<Streak[]>(() => {
    const count = 22;
    return Array.from({ length: count }, (_, i) => {
      const seed = i / count;
      return {
        left: (seed * 97) % 100,
        duration: 2.6 + ((i * 37) % 21) / 10, // 2.6 – 4.7s
        delay: -((i * 53) % 47) / 10, // negative delay staggers on mount
        height: 46 + ((i * 29) % 40),
        opacity: 0.35 + ((i * 19) % 40) / 100,
      };
    });
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {streaks.map((s, i) => (
        <span
          key={i}
          className="absolute top-0 w-px animate-rain-fall bg-gradient-to-b from-transparent via-accent to-transparent"
          style={{
            left: `${s.left}%`,
            height: `${s.height}px`,
            animationDuration: `${active ? s.duration * 0.55 : s.duration * 1.9}s`,
            animationDelay: `${s.delay}s`,
            // @ts-expect-error -- custom property consumed by the keyframe
            '--rain-opacity': active ? s.opacity : s.opacity * 0.4,
          }}
        />
      ))}
    </div>
  );
}
