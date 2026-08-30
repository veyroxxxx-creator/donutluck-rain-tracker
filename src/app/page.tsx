import { RainStatusCard } from '@/components/RainStatusCard';

export default function DashboardPage() {
  return (
    <div className="animate-fadeUp space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">DonutLuck Rain</h1>
        <p className="text-sm text-muted">
          Live status, pulled straight from the DonutLuck rain API every few seconds.
        </p>
      </div>
      <RainStatusCard />
    </div>
  );
}
