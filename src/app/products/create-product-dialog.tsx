"use client";

import { useEffect, useRef } from "react";
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
        className="h-10 rounded-md bg-[#0b5c5a] px-4 text-sm font-semibold text-white"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        Add product
      </button>

      <dialog
        aria-labelledby="create-product-title"
        className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-md border border-[#dfe3e8] bg-white p-0 text-[#172026] shadow-xl backdrop:bg-black/35"
        ref={dialogRef}
      >
        <div className="border-b border-[#edf0f2] px-5 py-4">
          <h2 className="text-lg font-semibold" id="create-product-title">Add product</h2>
          <p className="mt-1 text-sm text-[#697680]">
            Create the default variant and opening stock together.
          </p>
        </div>

        <form action={createProduct} className="space-y-4 p-5">
          {error ? (
            <p className="rounded-md border border-[#ffd8a8] bg-[#fff8ef] p-3 text-sm text-[#8a5300]">
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

          <div className="flex justify-end gap-2 border-t border-[#edf0f2] pt-4">
            <button
              className="h-10 rounded-md border border-[#cfd6dd] bg-white px-4 text-sm font-semibold"
              onClick={() => dialogRef.current?.close()}
              type="button"
            >
              Cancel
            </button>
            <SubmitButton
              className="h-10 rounded-md bg-[#0b5c5a] px-4 text-sm font-semibold text-white"
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
        className="mt-2 h-11 w-full rounded-md border border-[#cfd6dd] px-3 text-sm outline-none focus:border-[#0b5c5a]"
        {...props}
      />
    </label>
  );
}
