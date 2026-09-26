import { Skeleton } from "@/components/loading-skeletons";

export default function ReportsLoading() {
  return (
    <section className="min-w-0 p-5 lg:p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-52" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-md border border-border bg-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="size-8" />
            </div>
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      <div className="rounded-md border border-border bg-surface p-5 space-y-4">
        <Skeleton className="h-5 w-48" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </section>
  );
}
