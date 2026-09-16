export default function Loading() {
  return (
    <main
      aria-label="Loading"
      aria-live="polite"
      className="grid min-h-screen place-items-center bg-[#f6f7f9] text-[#0b5c5a]"
    >
      <div className="flex items-center gap-3 text-sm font-semibold">
        <span
          aria-hidden="true"
          className="size-5 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
        Loading
      </div>
    </main>
  );
}
