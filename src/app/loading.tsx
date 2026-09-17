import { SidebarSkeleton, Skeleton } from "@/components/loading-skeletons";

export default function Loading() {
  return (
    <main aria-busy="true" aria-label="Loading dashboard" className="min-h-screen bg-background">
      <span className="sr-only">Loading dashboard</span>
      <div className="grid min-h-screen animate-pulse lg:grid-cols-[244px_minmax(0,1fr)]">
        <SidebarSkeleton />

        <section className="min-w-0">
          <header className="flex h-20 items-center justify-between border-b border-border bg-surface px-5 lg:px-6">
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-52" />
            </div>
            <Skeleton className="h-9 w-28" />
          </header>

          <div className="space-y-5 p-5 lg:p-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="border border-border bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="size-8" />
                  </div>
                  <Skeleton className="mt-5 h-7 w-28" />
                  <Skeleton className="mt-3 h-3 w-36" />
                </div>
              ))}
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="border border-border bg-surface p-5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-8 w-20" />
                </div>
                <Skeleton className="mt-6 h-56 w-full" />
              </div>
              <div className="border border-border bg-surface p-5">
                <Skeleton className="h-5 w-36" />
                <div className="mt-6 space-y-5">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Skeleton className="size-9 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
