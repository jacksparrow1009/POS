import { Skeleton } from "@/components/loading-skeletons";

export default function ReceiptLoading() {
  return <section className="min-w-0 animate-pulse p-5" aria-busy="true" aria-label="Loading receipt">
    <Skeleton className="h-7 w-48" /><div className="mx-auto mt-8 max-w-md space-y-4 border border-border bg-surface p-5">
      <Skeleton className="mx-auto h-6 w-32" /><Skeleton className="mx-auto h-4 w-44" />
      {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
    </div></section>;
}
