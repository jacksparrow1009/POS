import { Skeleton } from "@/components/loading-skeletons";

export default function PosLoading() {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:min-h-screen grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="flex flex-col min-w-0 border-r border-border p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-md" />
          ))}
        </div>
      </section>
      <section className="hidden xl:flex flex-col bg-surface p-4 space-y-4">
        <Skeleton className="h-7 w-32" />
        <div className="flex-1 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
        <Skeleton className="h-14 w-full" />
      </section>
    </div>
  );
}
