"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { closeRegister, completeCashSale, openRegister } from "@/app/pos/actions";
import { SubmitButton } from "@/components/submit-button";

export type PosItem = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  price: number;
  stock: number;
};

type Shift = { id: string; opening_cash: number; opened_at: string; opened_by: string } | null;

export function PosRegister({ items, shift, branchName, currency, error }: {
  items: PosItem[]; shift: Shift; branchName: string; currency: string; error?: string;
}) {
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cashReceived, setCashReceived] = useState("");
  const [checkoutState, checkoutAction] = useActionState(completeCashSale, { error: null });
  const keyRef = useRef<string | null>(null);
  const keyInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const money = (value: number) => `${currency} ${value.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const cartItems = items.filter((item) => cart[item.id] > 0);
  const total = cartItems.reduce((sum, item) => sum + item.price * cart[item.id], 0);
  const change = Math.max(0, Number(cashReceived || 0) - total);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter((item) => !term || item.name.toLowerCase().includes(term) ||
      item.sku?.toLowerCase().includes(term) || item.barcode?.toLowerCase().includes(term)).slice(0, 50);
  }, [items, query]);

  function addItem(item: PosItem) {
    setCart((current) => ({ ...current, [item.id]: Math.min(item.stock, (current[item.id] ?? 0) + 1) }));
  }

  function updateQuantity(item: PosItem, quantity: number) {
    setCart((current) => {
      const next = { ...current };
      if (quantity <= 0) delete next[item.id];
      else next[item.id] = Math.min(item.stock, quantity);
      return next;
    });
  }

  return (
    <section className="min-w-0">
      <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-5 py-4 lg:px-6">
        <div><p className="text-xs font-semibold uppercase text-muted">{branchName}</p>
          <h1 className="mt-1 text-xl font-semibold">Point of sale</h1></div>
        {shift ? <span className="rounded-md bg-success-soft px-3 py-2 text-xs font-semibold text-success">Register open</span>
          : <span className="rounded-md bg-warning-soft px-3 py-2 text-xs font-semibold text-warning">Register closed</span>}
      </header>

      {error ? <p role="alert" className="mx-5 mt-5 rounded-md border border-warning/30 bg-warning-soft p-3 text-sm text-warning">{error}</p> : null}

      {!shift ? (
        <div className="mx-auto max-w-md p-5 lg:py-12">
          <div className="border border-border bg-surface p-6">
            <h2 className="text-base font-semibold">Open register</h2>
            <p className="mt-2 text-sm text-muted">Enter the cash in the drawer to start selling.</p>
            <form action={openRegister} className="mt-6 space-y-4">
              <label className="block text-sm font-medium">Opening cash
                <input name="openingCash" type="number" min="0" max="999999999999.99" step="0.01" required defaultValue="0"
                  className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 tabular-nums" />
              </label>
              <SubmitButton pendingLabel="Opening..." className="h-11 w-full rounded-md bg-brand px-4 font-semibold text-white">Open register</SubmitButton>
            </form>
          </div>
        </div>
      ) : (
        <div className="grid min-w-0 gap-5 p-5 lg:p-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <label className="relative block flex-1">
                <span className="sr-only">Search products or scan barcode</span>
                <Search aria-hidden="true" size={18} className="absolute left-3 top-3.5 text-muted" />
                <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      const exact = items.find((item) => item.barcode === query.trim() || item.sku?.toLowerCase() === query.trim().toLowerCase());
                      if (exact && exact.stock > 0) { addItem(exact); setQuery(""); }
                    }
                  }}
                  placeholder="Search name, SKU, or scan barcode" autoComplete="off"
                  className="h-11 w-full rounded-md border border-border bg-surface pl-10 pr-3 text-sm" />
              </label>
            </div>
            <div className="mt-4 overflow-hidden border border-border bg-surface">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h2 className="text-sm font-semibold">Products</h2><span className="text-xs text-muted">{filtered.length} shown</span>
              </div>
              {filtered.length ? <div className="max-h-[620px] divide-y divide-border overflow-y-auto">
                {filtered.map((item) => <div key={item.id} className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 hover:bg-surface-subtle">
                  <div className="min-w-0"><p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="mt-1 truncate text-xs text-muted">{item.sku || item.barcode || "No SKU"} / {item.stock} available</p></div>
                  <div className="flex shrink-0 items-center gap-3"><span className="text-sm font-semibold tabular-nums">{money(item.price)}</span>
                    <button type="button" onClick={() => addItem(item)} disabled={item.stock <= (cart[item.id] ?? 0)}
                      title={`Add ${item.name}`} aria-label={`Add ${item.name}`}
                      className="grid size-9 place-items-center rounded-md border border-border text-brand hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-40">
                      <Plus aria-hidden="true" size={18} /></button></div>
                </div>)}
              </div> : <p className="px-4 py-12 text-center text-sm text-muted">No products found.</p>}
            </div>
          </div>

          <aside className="self-start border border-border bg-surface xl:sticky xl:top-5">
            <div className="flex items-center justify-between border-b border-border p-4"><h2 className="flex items-center gap-2 text-sm font-semibold"><ShoppingCart aria-hidden="true" size={17} /> Current sale</h2>
              <span className="text-xs text-muted">{cartItems.reduce((sum, item) => sum + cart[item.id], 0)} items</span></div>
            {cartItems.length ? <div className="max-h-[360px] divide-y divide-border overflow-y-auto">
              {cartItems.map((item) => <div key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-2"><p className="text-sm font-medium">{item.name}</p>
                  <button type="button" onClick={() => updateQuantity(item, 0)} title="Remove item" aria-label={`Remove ${item.name}`}
                    className="text-muted hover:text-danger"><Trash2 aria-hidden="true" size={16} /></button></div>
                <div className="mt-3 flex items-center justify-between"><div className="flex items-center gap-2">
                  <button type="button" onClick={() => updateQuantity(item, cart[item.id] - 1)} title="Decrease quantity" aria-label={`Decrease ${item.name} quantity`}
                    className="grid size-8 place-items-center rounded-md border border-border"><Minus aria-hidden="true" size={15} /></button>
                  <span className="w-8 text-center text-sm tabular-nums">{cart[item.id]}</span>
                  <button type="button" onClick={() => updateQuantity(item, cart[item.id] + 1)} disabled={cart[item.id] >= item.stock}
                    title="Increase quantity" aria-label={`Increase ${item.name} quantity`}
                    className="grid size-8 place-items-center rounded-md border border-border disabled:opacity-40"><Plus aria-hidden="true" size={15} /></button></div>
                  <span className="text-sm font-semibold tabular-nums">{money(item.price * cart[item.id])}</span></div>
              </div>)}
            </div> : <div className="px-4 py-12 text-center text-sm text-muted">Add a product to start the sale.</div>}
            <form action={checkoutAction} onSubmit={() => {
              if (!keyRef.current) keyRef.current = crypto.randomUUID();
              if (keyInputRef.current) keyInputRef.current.value = keyRef.current;
            }} className="space-y-4 border-t border-border p-4">
              <input type="hidden" name="shiftId" value={shift.id} />
              <input type="hidden" name="checkoutKey" ref={keyInputRef} />
              <input type="hidden" name="items" value={JSON.stringify(cartItems.map((item) => ({ variant_id: item.id, quantity: cart[item.id] })))} />
              <div className="flex justify-between text-sm"><span>Subtotal</span><span className="tabular-nums">{money(total)}</span></div>
              <div className="flex justify-between border-t border-border pt-3 text-lg font-semibold"><span>Total</span><span className="tabular-nums">{money(total)}</span></div>
              <label className="block text-sm font-medium">Cash received
                <input name="cashReceived" type="number" min={total} step="0.01" required value={cashReceived}
                  onChange={(event) => setCashReceived(event.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-border px-3 tabular-nums" />
              </label>
              <div className="flex justify-between text-sm"><span>Change due</span><span className="font-semibold tabular-nums">{money(change)}</span></div>
              {checkoutState.error ? <p role="alert" className="rounded-md bg-warning-soft p-3 text-sm text-warning">{checkoutState.error}</p> : null}
              <SubmitButton pendingLabel="Completing sale..." disabled={!cartItems.length || Number(cashReceived) < total}
                className="h-11 w-full rounded-md bg-brand px-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Complete cash sale</SubmitButton>
            </form>
            <details className="border-t border-border p-4 text-sm"><summary className="cursor-pointer font-medium">Close register</summary>
              <form action={closeRegister} className="mt-4 space-y-3"><input type="hidden" name="shiftId" value={shift.id} />
                <label className="block">Counted cash in drawer
                  <input name="closingCash" type="number" min="0" max="999999999999.99" step="0.01" required
                    className="mt-2 h-10 w-full rounded-md border border-border px-3 tabular-nums" /></label>
                <SubmitButton pendingLabel="Closing..." className="h-10 w-full rounded-md border border-border px-3 font-semibold hover:bg-surface-subtle">Close register</SubmitButton>
              </form>
            </details>
          </aside>
        </div>
      )}
    </section>
  );
}
