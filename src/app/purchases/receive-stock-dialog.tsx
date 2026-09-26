"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus, Truck, X } from "lucide-react";
import { recordStockPurchase } from "@/app/purchases/actions";
import { SubmitButton } from "@/components/submit-button";

export type VariantOption = {
  id: string;
  name: string;
  sku: string | null;
  costPrice: number;
};

export function ReceiveStockDialog({
  variants,
  currency,
}: {
  variants: VariantOption[];
  currency: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction] = useActionState(recordStockPurchase, { error: null });

  useEffect(() => {
    if (state.error && !dialogRef.current?.open) {
      dialogRef.current?.showModal();
    }
  }, [state.error]);

  return (
    <>
      <button
        className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-brand-hover"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        <Plus aria-hidden="true" size={17} strokeWidth={2} />
        Receive stock
      </button>

      <dialog
        aria-labelledby="receive-stock-title"
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-md border border-border bg-surface p-0 text-foreground shadow-xl backdrop:bg-black/35"
        ref={dialogRef}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="flex gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-soft text-brand">
              <Truck aria-hidden="true" size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold" id="receive-stock-title">
                Receive stock (Purchase)
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                Add incoming goods from supplier and update inventory.
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

        <form action={formAction} className="space-y-4 p-5">
          {state.error ? (
            <p
              role="alert"
              className="rounded-md border border-warning/25 bg-warning-soft p-3 text-sm text-warning"
            >
              {state.error}
            </p>
          ) : null}

          <label className="block text-sm font-medium">
            Supplier / Vendor name <span className="text-danger">*</span>
            <input
              name="supplierName"
              required
              placeholder="e.g. Metro Cash & Carry, Unilever Distributor"
              className="mt-1.5 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/10"
            />
          </label>

          <label className="block text-sm font-medium">
            Product variant <span className="text-danger">*</span>
            <select
              name="variantId"
              required
              className="mt-1.5 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/10"
            >
              <option value="">-- Select product variant --</option>
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.sku || "No SKU"}) · Default Cost: {currency} {v.costPrice}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Quantity received <span className="text-danger">*</span>
              <input
                name="quantity"
                type="number"
                step="any"
                min="0.001"
                required
                placeholder="e.g. 50 or 12.5"
                className="mt-1.5 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm tabular-nums outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/10"
              />
            </label>

            <label className="block text-sm font-medium">
              Unit cost ({currency}) <span className="text-danger">*</span>
              <input
                name="unitCost"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="e.g. 150.00"
                className="mt-1.5 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm tabular-nums outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/10"
              />
            </label>
          </div>

          <label className="block text-sm font-medium">
            Invoice / Delivery note (optional)
            <input
              name="notes"
              placeholder="e.g. Bill #4928, Batch 09/26"
              className="mt-1.5 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/10"
            />
          </label>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="h-10 rounded-md border border-border px-4 text-sm font-semibold text-muted-strong hover:bg-surface-subtle"
            >
              Cancel
            </button>
            <SubmitButton
              pendingLabel="Saving purchase..."
              className="h-10 rounded-md bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-hover"
            >
              Receive stock
            </SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
