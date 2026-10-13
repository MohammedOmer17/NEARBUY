export default function Skeleton({ className = '' }) {
  return <div aria-hidden className={`animate-pulse rounded-xl bg-line ${className}`} />
}

export function ProductGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="min-w-0 rounded-2xl bg-white p-2.5 shadow-card">
          <Skeleton className="aspect-square" />
          <Skeleton className="mt-3 h-4 w-4/5" />
          <Skeleton className="mt-2 h-3 w-1/3" />
          <Skeleton className="mt-3 h-11 w-full rounded-full" />
        </div>
      ))}
    </div>
  )
}
