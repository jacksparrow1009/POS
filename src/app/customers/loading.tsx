import { Skeleton } from "@/components/loading-skeletons";

export default function CustomersLoading() {
  return (
    <section className="min-w-0 space-y-5 p-5 lg:p-8">
      <div className="grid overflow-hidden rounded-md border border-border bg-surface sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="flex items-center gap-3 border-b border-border p-4 xl:border-b-0 xl:border-r" key={index}>
            <Skeleton className="size-9" />
            <div className="space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-5 w-28" /></div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-md border border-border bg-surface">
        <div className="flex justify-between gap-4 border-b border-border p-4"><Skeleton className="h-10 w-full max-w-md" /><Skeleton className="h-10 w-64" /></div>
        <div className="space-y-1 p-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </section>
  );
}
