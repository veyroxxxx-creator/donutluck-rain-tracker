'use client';

import { formatDuration } from '@/lib/formatters';

interface CountdownRingProps {
  remainingSeconds: number;
  totalSeconds: number | null;
  active: boolean;
  size?: number;
}

export function CountdownRing({
  remainingSeconds,
  totalSeconds,
  active,
  size = 260,
}: CountdownRingProps) {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction =
    totalSeconds && totalSeconds > 0 ? Math.min(1, Math.max(0, remainingSeconds / totalSeconds)) : 0;
  const dashOffset = circumference * (1 - fraction);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      role="timer"
      aria-live="polite"
      aria-label={`${active ? 'Rain ends' : 'Next rain'} in ${formatDuration(remainingSeconds)}`}
    >
      <svg width={size} height={size} className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--color-border))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={active ? 'rgb(var(--color-active))' : 'rgb(var(--color-accent))'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          style={{ filter: active ? 'drop-shadow(0 0 10px rgb(var(--color-active) / 0.55))' : undefined }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
        <span className="font-mono text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl">
          {formatDuration(remainingSeconds)}
        </span>
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
          {active ? 'until rain ends' : 'until next rain'}
        </span>
      </div>
    </div>
  );
}
