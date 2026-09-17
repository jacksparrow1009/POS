type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div aria-hidden="true" className={`rounded bg-border ${className}`} />;
}

export function SidebarSkeleton() {
  return (
    <>
      <div className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 lg:hidden">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="size-9" />
      </div>

      <aside className="hidden h-screen flex-col border-r border-border bg-surface p-4 lg:flex">
        <div className="flex items-center gap-3 border-b border-border px-2 pb-5">
          <Skeleton className="size-10" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex h-10 items-center gap-3 px-2">
              <Skeleton className="size-5" />
              <Skeleton className={`h-3 ${index === 2 ? "w-24" : "w-20"}`} />
            </div>
          ))}
        </div>

        <div className="mt-auto space-y-3 border-t border-border pt-4">
          <Skeleton className="h-10 w-full" />
          <div className="flex items-center gap-3 px-2">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export function AuthPageSkeleton({ setup = false }: { setup?: boolean }) {
  return (
    <main
      aria-busy="true"
      aria-label={setup ? "Loading business setup" : "Loading account page"}
      className="grid min-h-screen place-items-center bg-background p-4"
    >
      <span className="sr-only">Loading</span>
      <section className="w-full max-w-lg animate-pulse border border-border bg-surface p-6 sm:p-8">
        <div className="space-y-3">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>

        <div className="mt-8 space-y-5">
          {Array.from({ length: setup ? 4 : 2 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-11 w-full" />
            </div>
          ))}
          <Skeleton className="h-11 w-full" />
        </div>
      </section>
    </main>
  );
}
