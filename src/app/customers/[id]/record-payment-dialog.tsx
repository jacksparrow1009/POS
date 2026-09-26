"use client";

import { useActionState, useEffect, useRef } from "react";
import { Banknote, CheckCircle2, X } from "lucide-react";
import { recordCustomerPayment } from "@/app/customers/actions";
import { SubmitButton } from "@/components/submit-button";

export function RecordPaymentDialog({
  customerId,
  customerName,
  unpaidBalance,
  currency,
}: {
  customerId: string;
  customerName: string;
  unpaidBalance: number;
  currency: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction] = useActionState(recordCustomerPayment, {
    error: null,
    success: null,
  });

  useEffect(() => {
    if (state.success) {
      dialogRef.current?.close();
    }
  }, [state.success]);

  const money = (val: number) =>
    `${currency} ${val.toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-brand-hover"
      >
        <Banknote size={17} />
        Record payment (Vasooli)
      </button>

      <dialog
        aria-labelledby="record-payment-title"
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-md border border-border bg-surface p-0 text-foreground shadow-xl backdrop:bg-black/35"
        ref={dialogRef}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="flex gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-soft text-brand">
              <Banknote aria-hidden="true" size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold" id="record-payment-title">
                Khata payment (وصولی)
              </h2>
              <p className="mt-0.5 text-xs text-muted">{customerName}</p>
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
          <input type="hidden" name="customerId" value={customerId} />

          <div className="rounded-md border border-border bg-surface-subtle p-3.5">
            <div className="flex justify-between text-xs text-muted">
              <span>Total outstanding Udhar</span>
              <span className="font-bold text-danger">{money(unpaidBalance)}</span>
            </div>
          </div>

          {state.error ? (
            <p
              role="alert"
              className="rounded-md border border-warning/25 bg-warning-soft p-3 text-sm text-warning"
            >
              {state.error}
            </p>
          ) : null}

          {state.success ? (
            <p
              role="status"
              className="flex items-center gap-2 rounded-md bg-success-soft p-3 text-sm font-medium text-success"
            >
              <CheckCircle2 size={16} />
              {state.success}
            </p>
          ) : null}

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="paymentAmount" className="text-sm font-medium">
                Amount received <span className="text-danger">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById("paymentAmount") as HTMLInputElement;
                  if (input) input.value = String(unpaidBalance);
                }}
                className="text-xs font-semibold text-brand hover:underline"
              >
                Pay full ({money(unpaidBalance)})
              </button>
            </div>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute left-3 top-3 text-sm font-medium text-muted">
                {currency}
              </span>
              <input
                id="paymentAmount"
                name="amount"
                type="number"
                step="0.01"
                min="1"
                max={unpaidBalance}
                required
                defaultValue={unpaidBalance}
                className="h-11 w-full rounded-md border border-border bg-surface pl-14 pr-3 text-base font-semibold tabular-nums outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
              />
            </div>
          </div>

          <label className="block text-sm font-medium">
            Payment method
            <select
              name="method"
              defaultValue="cash"
              className="mt-1.5 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-brand"
            >
              <option value="cash">Cash (نقدی)</option>
              <option value="jazzcash">JazzCash</option>
              <option value="easypaisa">EasyPaisa</option>
              <option value="raast">Raast / Bank Transfer</option>
              <option value="card">Card Terminal</option>
            </select>
          </label>

          <label className="block text-sm font-medium">
            Reference / Receipt note
            <input
              name="notes"
              placeholder="e.g. Received by counter staff"
              className="mt-1.5 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-brand"
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
              pendingLabel="Saving payment..."
              className="h-10 rounded-md bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-hover"
            >
              Confirm payment
            </SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
