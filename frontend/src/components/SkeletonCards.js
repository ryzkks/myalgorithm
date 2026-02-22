export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-800/60 rounded-xl ${className}`} />;
}

export function MetricSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-24" />
    </div>
  );
}

export function CardSkeleton({ lines = 3 }) {
  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <Skeleton className="h-5 w-36" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" style={{ width: `${80 - i * 15}%` }} />
      ))}
    </div>
  );
}

export function AnalysisSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-16 w-20 rounded-2xl" />
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      <Skeleton className="h-20 w-full rounded-xl" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02]">
          <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
