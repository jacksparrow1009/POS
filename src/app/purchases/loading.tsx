import { Skeleton } from "@/components/loading-skeletons";

export default function PurchasesLoading() {
  return (
    <section className="min-w-0 p-5 lg:p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      <div className="rounded-md border border-border bg-surface p-4 space-y-4">
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    </section>
  );
}
