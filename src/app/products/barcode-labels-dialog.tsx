"use client";

import { useRef, useState } from "react";
import { Barcode, Printer, X } from "lucide-react";

export type LabelProduct = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  price: number;
};

export function BarcodeLabelsDialog({
  products,
  currency,
  storeName,
}: {
  products: LabelProduct[];
  currency: string;
  storeName: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");
  const [count, setCount] = useState(12);

  const selectedProduct = products.find((p) => p.id === selectedProductId) ?? products[0];
  const codeValue = selectedProduct?.barcode || selectedProduct?.sku || "00000000";

  function handlePrint() {
    window.print();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-semibold text-muted-strong shadow-xs hover:bg-surface-subtle"
      >
        <Barcode size={17} />
        Print barcode labels
      </button>

      <dialog
        aria-labelledby="barcode-dialog-title"
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-md border border-border bg-surface p-0 text-foreground shadow-xl backdrop:bg-black/35 print:m-0 print:max-h-none print:w-full print:border-0 print:p-0 print:shadow-none"
        ref={dialogRef}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 print:hidden">
          <div className="flex gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-soft text-brand">
              <Barcode aria-hidden="true" size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold" id="barcode-dialog-title">
                Barcode &amp; Price Label Generator
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                Print standard 50x25mm (2&quot;x1&quot;) retail shelf &amp; product price stickers.
              </p>
            </div>
          </div>
          <button
            aria-label="Close dialog"
            className="grid size-9 shrink-0 place-items-center rounded-md text-muted hover:bg-surface-subtle hover:text-foreground"
            onClick={() => dialogRef.current?.close()}
            title="Close"
            type="button"
          >
            <X aria-hidden="true" size={19} />
          </button>
        </div>

        {/* Configuration Controls (hidden when printing) */}
        <div className="grid gap-4 border-b border-border p-5 sm:grid-cols-3 print:hidden">
          <label className="block text-sm font-medium sm:col-span-2">
            Select product
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-brand"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku || p.barcode || "No Code"}) · {currency} {p.price.toLocaleString()}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium">
            Stickers to print
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="mt-1.5 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-brand"
            >
              {[4, 8, 12, 16, 24, 32, 48].map((num) => (
                <option key={num} value={num}>
                  {num} stickers
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Preview / Printable Stickers Grid */}
        <div className="p-5">
          <div className="flex items-center justify-between pb-3 print:hidden">
            <span className="text-xs font-semibold uppercase text-muted">Sticker preview</span>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-brand px-4 text-xs font-semibold text-white hover:bg-brand-hover"
            >
              <Printer size={15} /> Print stickers
            </button>
          </div>

          {selectedProduct ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 print:grid-cols-3 print:gap-2">
              {Array.from({ length: count }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex flex-col justify-between rounded border border-border-strong/80 bg-white p-2 text-center text-black shadow-2xs print:border-black print:shadow-none"
                  style={{ minHeight: "95px" }}
                >
                  <div>
                    <p className="truncate text-[9px] font-bold uppercase tracking-wider text-neutral-600">
                      {storeName}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-xs font-bold leading-tight">
                      {selectedProduct.name}
                    </p>
                  </div>

                  <div className="my-1.5 flex flex-col items-center">
                    {/* Visual Barcode Graphic Pattern */}
                    <div
                      className="flex h-7 w-4/5 items-stretch justify-center gap-0.5 overflow-hidden py-0.5"
                      aria-hidden="true"
                    >
                      {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 1, 4, 2].map(
                        (w, i) => (
                          <div
                            key={i}
                            className="bg-black"
                            style={{ width: `${(w % 3) + 1}px` }}
                          />
                        ),
                      )}
                    </div>
                    <p className="font-mono text-[9px] tracking-widest text-black">
                      {codeValue}
                    </p>
                  </div>

                  <p className="text-xs font-extrabold tabular-nums">
                    {currency} {selectedProduct.price.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </dialog>
    </>
  );
}
