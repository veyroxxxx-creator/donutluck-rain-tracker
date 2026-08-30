'use client';

import { useRain } from '@/context/RainContext';
import { useCountdown } from '@/hooks/useCountdown';
import { useNowTick } from '@/hooks/useNowTick';
import { formatNumber, formatRelativeTime } from '@/lib/formatters';
import { CountdownRing } from '@/components/CountdownRing';
import { RainVeil } from '@/components/RainVeil';
import { ConnectionBadge } from '@/components/ConnectionBadge';
import { StatTile } from '@/components/StatTile';

export function RainStatusCard() {
  const { data, connectionStatus, lastUpdatedAt, targetAt, phaseTotalSeconds, error } = useRain();
  const remainingSeconds = useCountdown(targetAt);
  const now = useNowTick(1000);

  const active = data?.active ?? false;
  const isLoading = data === null && connectionStatus !== 'offline';
  const isEmpty = data === null && connectionStatus === 'offline';

  return (
    <section className="card relative overflow-hidden p-6 sm:p-10">
      <RainVeil active={active} />

      <div className="relative flex flex-col items-center gap-8">
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${
              active
                ? 'bg-active/15 text-active'
                : 'bg-surface-2 text-muted'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${active ? 'animate-pulseGlow bg-active' : 'bg-muted'}`} />
            {isLoading ? 'Checking status' : active ? 'Rain active' : 'Rain inactive'}
          </span>
          <ConnectionBadge status={connectionStatus} />
        </div>

        {isEmpty ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-lg font-medium">Can&apos;t reach DonutLuck right now</p>
            <p className="max-w-sm text-sm text-muted">
              {error ?? 'The rain API is not responding. We\'ll keep trying in the background.'}
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="skeleton h-[260px] w-[260px] animate-shimmer rounded-full" />
            <p className="text-sm text-muted">Loading live rain state…</p>
          </div>
        ) : (
          <>
            <CountdownRing
              remainingSeconds={remainingSeconds}
              totalSeconds={phaseTotalSeconds}
              active={active}
            />
            <p className="max-w-sm text-center text-sm text-muted">
              {active
                ? 'Rain is currently active on DonutLuck. Jump in before it ends.'
                : 'Rain is currently inactive. Counting down to the next event.'}
            </p>
          </>
        )}

        {data && (
          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Participants" value={formatNumber(data.participants_count)} />
            <StatTile label="Prize" value={formatNumber(data.prize)} />
            <StatTile
              label="Last updated"
              value={lastUpdatedAt ? formatRelativeTime(lastUpdatedAt, now) : '—'}
            />
            <StatTile
              label="Connection"
              value={connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'degraded' ? 'Retrying' : connectionStatus === 'offline' ? 'Offline' : 'Connecting'}
            />
          </div>
        )}
      </div>
    </section>
  );
}
