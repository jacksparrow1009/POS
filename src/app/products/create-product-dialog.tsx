"use client";

import { useEffect, useRef } from "react";
import { PackagePlus, Plus, X } from "lucide-react";
import { createProduct } from "@/app/products/actions";
import { SubmitButton } from "@/components/submit-button";

type CreateProductDialogProps = {
  error?: string;
};

export function CreateProductDialog({ error }: CreateProductDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (error && !dialogRef.current?.open) {
      dialogRef.current?.showModal();
    }
  }, [error]);

  return (
    <>
      <button
        className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        <Plus aria-hidden="true" size={17} strokeWidth={2} />
        Add product
      </button>

      <dialog
        aria-labelledby="create-product-title"
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-md border border-border bg-surface p-0 text-foreground shadow-xl backdrop:bg-black/35"
        ref={dialogRef}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="flex gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-soft text-brand">
              <PackagePlus aria-hidden="true" size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold" id="create-product-title">Add product</h2>
              <p className="mt-1 text-sm text-muted">Create its default variant and opening stock.</p>
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

        <form action={createProduct} className="space-y-4 p-5">
          {error ? (
            <p className="rounded-md border border-warning/25 bg-warning-soft p-3 text-sm text-warning">
              {error}
            </p>
          ) : null}

          <Field autoFocus label="Product name" name="name" placeholder="Coke 500ml" required />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="SKU" name="sku" placeholder="BEV-001" />
            <Field label="Barcode" name="barcode" placeholder="Scan or type" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field defaultValue="0" label="Cost price" min="0" name="costPrice" required step="0.01" type="number" />
            <Field defaultValue="0" label="Selling price" min="0" name="sellingPrice" required step="0.01" type="number" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field defaultValue="0" label="Opening stock" min="0" name="openingStock" required step="0.001" type="number" />
            <Field defaultValue="5" label="Low-stock alert" min="0" name="lowStockThreshold" required step="0.001" type="number" />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button
              className="h-10 rounded-md border border-border-strong bg-surface px-4 text-sm font-semibold text-muted-strong hover:bg-surface-subtle"
              onClick={() => dialogRef.current?.close()}
              type="button"
            >
              Cancel
            </button>
            <SubmitButton
              className="h-10 rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover"
              pendingLabel="Adding product..."
            >
              Add product
            </SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
};

function Field({ label, ...props }: FieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        className="mt-2 h-11 w-full rounded-md border border-border-strong bg-surface px-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/10"
        {...props}
      />
    </label>
  );
}
