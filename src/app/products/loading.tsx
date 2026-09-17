import { Skeleton } from "@/components/loading-skeletons";

export default function ProductsLoading() {
  return (
    <section className="min-w-0 animate-pulse" aria-busy="true" aria-label="Loading products">
      <span className="sr-only">Loading products</span>
      <header className="flex h-20 items-center justify-between border-b border-border bg-surface px-5 lg:px-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3 w-52" />
        </div>
        <Skeleton className="h-9 w-32" />
      </header>

      <div className="p-5 lg:p-6">
        <div className="border border-border bg-surface">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-10 w-full sm:max-w-sm" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>

          <div className="divide-y divide-border">
            <div className="hidden grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_40px] gap-4 px-4 py-3 md:grid">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-3 w-16" />
              ))}
            </div>
            {Array.from({ length: 7 }).map((_, index) => (
              <div
                key={index}
                className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_40px] md:items-center md:gap-4"
              >
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="size-8" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
