import { Skeleton } from "@/components/loading-skeletons";

export default function SalesLoading() {
  return <section aria-busy="true" aria-label="Loading sales" className="min-w-0 animate-pulse">
    <div className="flex h-20 items-center justify-between border-b border-border bg-surface px-5"><Skeleton className="h-6 w-32" /><Skeleton className="h-9 w-28" /></div>
    <div className="space-y-4 p-5"><Skeleton className="h-10 w-80 max-w-full" />
      <div className="divide-y divide-border border border-border bg-surface">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="flex justify-between gap-4 p-4"><Skeleton className="h-4 w-28" /><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-24" /></div>)}
      </div></div>
  </section>;
}
