import { Skeleton } from "@/components/loading-skeletons";

export default function SettingsLoading() {
  return (
    <section className="min-w-0 space-y-6 p-5 lg:p-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="space-y-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="overflow-hidden rounded-md border border-border bg-surface">
          {[0, 1, 2].map((item) => (
            <div className="grid gap-5 border-b border-border p-6 xl:grid-cols-[230px_minmax(0,1fr)]" key={item}>
              <div className="space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3 w-48" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
              </div>
            </div>
          ))}
          <div className="flex justify-end bg-surface-subtle p-4">
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    </section>
  );
}
