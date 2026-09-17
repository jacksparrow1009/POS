export default function ProductsLoading() {
  return (
    <main className="min-h-screen bg-[#f6f7f9] p-5" aria-label="Loading products">
      <div className="mx-auto max-w-7xl animate-pulse space-y-5">
        <div className="h-20 rounded-md bg-white" />
        <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
          <div className="h-[520px] rounded-md bg-white" />
          <div className="h-[520px] rounded-md bg-white" />
        </div>
      </div>
    </main>
  );
}
