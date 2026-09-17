import { Skeleton } from "@/components/loading-skeletons";

export default function ProductDetailsLoading() {
  return (
    <section className="min-w-0 animate-pulse" aria-busy="true" aria-label="Loading product details">
      <span className="sr-only">Loading product details</span>
      <header className="flex h-20 items-center justify-between border-b border-border bg-surface px-5 lg:px-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-8 w-20" />
      </header>

      <div className="space-y-5 p-5 lg:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="border border-border bg-surface p-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-4 h-7 w-28" />
            </div>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {Array.from({ length: 2 }).map((_, panelIndex) => (
            <div key={panelIndex} className="border border-border bg-surface p-5">
              <Skeleton className="h-5 w-36" />
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, fieldIndex) => (
                  <div key={fieldIndex} className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
