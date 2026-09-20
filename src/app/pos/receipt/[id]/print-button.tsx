"use client";

import { Printer } from "lucide-react";

export function PrintReceiptButton() {
  return <button type="button" onClick={() => window.print()}
    className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-3 text-sm font-semibold text-white">
    <Printer aria-hidden="true" size={17} /> Print
  </button>;
}
