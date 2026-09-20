"use client";

import { useActionState, useRef, useState } from "react";
import { returnCashSale } from "@/app/pos/receipt/[id]/return-action";
import { SubmitButton } from "@/components/submit-button";

export type ReturnableLine = { id: string; name: string; remaining: number; unitPrice: number };

export function ReturnForm({ saleId, shiftId, lines, currency }: {
  saleId: string; shiftId: string; lines: ReturnableLine[]; currency: string;
}) {
  const [state, action] = useActionState(returnCashSale, { error: null });
  const keyRef = useRef<string | null>(null);
  const keyInputRef = useRef<HTMLInputElement>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [reason, setReason] = useState("");
  const total = lines.reduce((sum, line) => sum + line.unitPrice * (quantities[line.id] ?? 0), 0);
  const money = (value: number) => `${currency} ${value.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return <form action={action} onSubmit={() => {
    if (!keyRef.current) keyRef.current = crypto.randomUUID();
    if (keyInputRef.current) keyInputRef.current.value = keyRef.current;
  }} className="space-y-4">
    <input type="hidden" name="saleId" value={saleId} />
    <input type="hidden" name="shiftId" value={shiftId} />
    <input type="hidden" name="returnKey" ref={keyInputRef} />
    <div className="divide-y divide-border border-y border-border">
      {lines.filter((line) => line.remaining > 0).map((line) => <div key={line.id} className="flex items-center justify-between gap-3 py-3">
        <div className="min-w-0"><p className="text-sm font-medium">{line.name}</p>
          <p className="mt-1 text-xs text-muted">{line.remaining} available to return / {money(line.unitPrice)} each</p></div>
        <label className="shrink-0 text-xs font-semibold text-muted">Quantity
          <input type="number" name={`return_${line.id}`} min="0" max={line.remaining} step="1"
            value={quantities[line.id] ?? 0}
            onChange={(event) => setQuantities((current) => ({ ...current,
              [line.id]: Math.max(0, Math.min(line.remaining, Number(event.target.value) || 0)) }))}
            className="mt-1 block h-10 w-20 rounded-md border border-border px-2 text-right text-sm tabular-nums" /></label>
      </div>)}
    </div>
    <label className="block text-sm font-medium">Reason for return
      <textarea name="reason" required minLength={3} maxLength={240} rows={2}
        value={reason} onChange={(event) => setReason(event.target.value)}
        className="mt-2 w-full rounded-md border border-border p-3 text-sm" placeholder="e.g. Damaged item" /></label>
    <div className="flex justify-between border-t border-border pt-3 text-sm font-semibold"><span>Cash refund</span><span className="tabular-nums">{money(total)}</span></div>
    <label className="flex items-start gap-2 text-sm"><input name="confirmed" type="checkbox" checked={confirmed}
      onChange={(event) => setConfirmed(event.target.checked)} className="mt-1 accent-brand" />
      <span>I have counted and refunded this cash to the customer.</span></label>
    {state.error ? <p role="alert" className="rounded-md bg-warning-soft p-3 text-sm text-warning">{state.error}</p> : null}
    <SubmitButton pendingLabel="Processing return..." disabled={!confirmed || total <= 0}
      className="h-11 w-full rounded-md bg-danger px-4 font-semibold text-white disabled:opacity-50">Process return</SubmitButton>
  </form>;
}
