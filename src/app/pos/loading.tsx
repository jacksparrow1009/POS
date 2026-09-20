import { Skeleton } from "@/components/loading-skeletons";

export default function PosLoading() {
  return (
    <section aria-busy="true" aria-label="Loading register" className="min-w-0 animate-pulse">
      <header className="flex h-20 items-center justify-between border-b border-border bg-surface px-5">
        <Skeleton className="h-6 w-28" /><Skeleton className="h-9 w-32" />
      </header>
      <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4"><Skeleton className="h-11 w-full" />
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
        <div className="space-y-4 border border-border bg-surface p-4">
          <Skeleton className="h-5 w-28" /><Skeleton className="h-52 w-full" />
          <Skeleton className="h-11 w-full" /><Skeleton className="h-11 w-full" />
        </div>
      </div>
    </section>
  );
}
