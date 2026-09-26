import { Skeleton } from "@/components/loading-skeletons";

export default function SettingsLoading() {
  return (
    <section className="min-w-0 max-w-4xl p-5 lg:p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-52" />
      </div>

      <div className="rounded-md border border-border bg-surface p-6 space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
    </section>
  );
}
