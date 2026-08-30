import type { ConnectionStatus } from '@/types/rain';

const COPY: Record<ConnectionStatus, { label: string; dotClass: string }> = {
  connecting: { label: 'Connecting', dotClass: 'bg-muted' },
  connected: { label: 'Connected', dotClass: 'bg-active' },
  degraded: { label: 'Reconnecting', dotClass: 'bg-accent' },
  offline: { label: 'Offline', dotClass: 'bg-danger' },
};

export function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  const { label, dotClass } = COPY[status];
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text">
      <span className="relative flex h-2 w-2">
        {status === 'connected' && (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${dotClass} opacity-60`} />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${dotClass}`} />
      </span>
      {label}
    </span>
  );
}
