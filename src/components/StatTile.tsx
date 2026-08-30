import type { ReactNode } from 'react';

interface StatTileProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
}

export function StatTile({ label, value, hint, icon }: StatTileProps) {
  return (
    <div className="card flex flex-col gap-2 p-4 sm:p-5">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted">
        {icon}
        <span>{label}</span>
      </div>
      <div className="font-mono text-xl font-semibold tabular-nums sm:text-2xl">{value}</div>
      {hint && <div className="text-xs text-muted">{hint}</div>}
    </div>
  );
}
