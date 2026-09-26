"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutGrid,
  List,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
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

export type PosCustomer = {
  id: string;
  name: string;
  phone: string | null;
};

type Shift = { id: string; opening_cash: number; opened_at: string; opened_by: string } | null;

export function PosRegister({
  items,
  shift,
  branchName,
  currency,
  error,
  customers = [],
}: {
  items: PosItem[];
  shift: Shift;
  branchName: string;
  currency: string;
  error?: string;
  customers?: PosCustomer[];
}) {
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cashReceived, setCashReceived] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [checkoutState, checkoutAction] = useActionState(completeCashSale, { error: null });

  const keyRef = useRef<string | null>(null);
  const keyInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const cashInputRef = useRef<HTMLInputElement>(null);

  const money = (value: number) =>
    `${currency} ${value.toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const cartItems = items.filter((item) => (cart[item.id] ?? 0) > 0);
  const total = cartItems.reduce((sum, item) => sum + item.price * (cart[item.id] ?? 0), 0);
  const numericCash = Number(cashReceived || 0);
  const change = Math.max(0, numericCash - total);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items
      .filter(
        (item) =>
          !term ||
          item.name.toLowerCase().includes(term) ||
          item.sku?.toLowerCase().includes(term) ||
          item.barcode?.toLowerCase().includes(term),
      )
      .slice(0, 60);
  }, [items, query]);

  // Global POS Keyboard Shortcuts: F2 for search, F4 for cash tender, Esc to clear search
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "F2") {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      } else if (event.key === "F4" && cartItems.length > 0) {
        event.preventDefault();
        cashInputRef.current?.focus();
        cashInputRef.current?.select();
      } else if (event.key === "Escape") {
        if (query) {
          event.preventDefault();
          setQuery("");
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cartItems.length, query]);

  function addItem(item: PosItem, step = 1) {
    setCart((current) => {
      const currentQty = current[item.id] ?? 0;
      const nextQty = Math.min(item.stock, Number((currentQty + step).toFixed(3)));
      return { ...current, [item.id]: nextQty };
    });
  }

  function updateQuantity(item: PosItem, quantity: number) {
    setCart((current) => {
      const next = { ...current };
      if (quantity <= 0) {
        delete next[item.id];
      } else {
        next[item.id] = Math.min(item.stock, Number(quantity.toFixed(3)));
      }
      return next;
    });
  }

  // Quick tender calculation: round up to note denomination
  function getTenderTarget(note: number) {
    if (total <= 0) return note;
    return Math.ceil(total / note) * note;
  }

  return (
    <section className="min-w-0">
      <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-5 py-4 lg:px-6">
        <div>
          <p className="text-xs font-semibold uppercase text-muted">{branchName}</p>
          <h1 className="mt-1 text-xl font-semibold">Point of sale</h1>
        </div>
        <div className="flex items-center gap-3">
          {shift ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-success-soft px-3 py-1.5 text-xs font-semibold text-success">
              <span className="size-2 rounded-full bg-success" />
              Register open
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-warning-soft px-3 py-1.5 text-xs font-semibold text-warning">
              <span className="size-2 rounded-full bg-warning" />
              Register closed
            </span>
          )}
        </div>
      </header>

      {error ? (
        <p
          role="alert"
          className="mx-5 mt-5 rounded-md border border-warning/30 bg-warning-soft p-3 text-sm text-warning"
        >
          {error}
        </p>
      ) : null}

      {!shift ? (
        <div className="mx-auto max-w-md p-5 lg:py-12">
          <div className="rounded-md border border-border bg-surface p-6 shadow-sm">
            <h2 className="text-base font-semibold">Open register</h2>
            <p className="mt-2 text-sm text-muted">Enter the cash in the drawer to start selling.</p>
            <form action={openRegister} className="mt-6 space-y-4">
              <label className="block text-sm font-medium">
                Opening cash ({currency})
                <input
                  name="openingCash"
                  type="number"
                  min="0"
                  max="999999999999.99"
                  step="0.01"
                  required
                  defaultValue="0"
                  className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 tabular-nums outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
                />
              </label>
              <SubmitButton
                pendingLabel="Opening..."
                className="h-11 w-full rounded-md bg-brand px-4 font-semibold text-white hover:bg-brand-hover"
              >
                Open register
              </SubmitButton>
            </form>
          </div>
        </div>
      ) : (
        <div className="grid min-w-0 gap-5 p-5 lg:p-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0">
            {/* Search & Layout Controls */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative block flex-1">
                <span className="sr-only">Search products or scan barcode</span>
                <Search
                  aria-hidden="true"
                  size={18}
                  className="pointer-events-none absolute left-3 top-3.5 text-muted"
                />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      const cleanQuery = query.trim().toLowerCase();
                      const exact = items.find(
                        (item) =>
                          item.barcode?.toLowerCase() === cleanQuery ||
                          item.sku?.toLowerCase() === cleanQuery,
                      );
                      if (exact && exact.stock > 0) {
                        addItem(exact);
                        setQuery("");
                      } else if (filtered.length === 1 && filtered[0].stock > 0) {
                        addItem(filtered[0]);
                        setQuery("");
                      }
                    }
                  }}
                  placeholder="Search by name, SKU, or scan barcode (F2)"
                  autoComplete="off"
                  className="h-11 w-full rounded-md border border-border bg-surface pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/10"
                />
              </label>

              {/* Grid / List View Toggle */}
              <div
                className="flex h-11 items-center rounded-md border border-border bg-surface-subtle p-1 self-start sm:self-auto"
                aria-label="Product display mode"
              >
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`grid size-9 place-items-center rounded ${
                    viewMode === "grid"
                      ? "bg-surface text-brand shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                  title="Grid view"
                  aria-label="Grid view"
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`grid size-9 place-items-center rounded ${
                    viewMode === "list"
                      ? "bg-surface text-brand shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                  title="List view"
                  aria-label="List view"
                >
                  <List size={18} />
                </button>
              </div>
            </div>

            <div className="mt-1 flex items-center justify-between text-xs text-muted">
              <span>
                Tip: Press <kbd className="rounded border border-border bg-surface px-1 py-0.5 font-mono text-[10px]">F2</kbd> to search, <kbd className="rounded border border-border bg-surface px-1 py-0.5 font-mono text-[10px]">Enter</kbd> to scan &amp; add
              </span>
              <span>{filtered.length} products shown</span>
            </div>

            {/* Product Catalog Display */}
            <div className="mt-4 overflow-hidden rounded-md border border-border bg-surface">
              {filtered.length === 0 ? (
                <div className="px-4 py-16 text-center text-sm text-muted">
                  No products found matching &ldquo;{query}&rdquo;.
                </div>
              ) : viewMode === "grid" ? (
                /* Touch-friendly Grid View */
                <div className="max-h-[640px] overflow-y-auto p-3.5">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                    {filtered.map((item) => {
                      const inCart = cart[item.id] ?? 0;
                      const isOutOfStock = item.stock <= inCart;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => addItem(item)}
                          className={`group flex flex-col justify-between rounded-md border p-3 text-left transition-all ${
                            inCart > 0
                              ? "border-brand/40 bg-brand-soft/20 shadow-xs"
                              : "border-border bg-surface hover:border-brand/30 hover:bg-surface-subtle"
                          } ${isOutOfStock ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <p className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-brand">
                                {item.name}
                              </p>
                              {inCart > 0 ? (
                                <span className="shrink-0 rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white tabular-nums">
                                  {inCart}
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 truncate font-mono text-[11px] text-muted">
                              {item.barcode || item.sku || "No Code"}
                            </p>
                          </div>

                          <div className="mt-3 flex items-end justify-between gap-2 border-t border-border/60 pt-2">
                            <span className="text-sm font-bold text-foreground tabular-nums">
                              {money(item.price)}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-medium tabular-nums ${
                                item.stock <= 5
                                  ? "bg-warning-soft text-warning"
                                  : "bg-surface-subtle text-muted"
                              }`}
                            >
                              {item.stock} left
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* High-density List View */
                <div className="max-h-[640px] divide-y divide-border overflow-y-auto">
                  {filtered.map((item) => {
                    const inCart = cart[item.id] ?? 0;
                    const isOutOfStock = item.stock <= inCart;

                    return (
                      <div
                        key={item.id}
                        className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-subtle"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{item.name}</p>
                          <p className="mt-1 truncate text-xs text-muted">
                            <span className="font-mono">{item.sku || item.barcode || "No SKU"}</span>
                            {" · "}
                            <span className="tabular-nums">{item.stock} available</span>
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="text-sm font-semibold tabular-nums">
                            {money(item.price)}
                          </span>
                          <button
                            type="button"
                            onClick={() => addItem(item)}
                            disabled={isOutOfStock}
                            title={`Add ${item.name}`}
                            aria-label={`Add ${item.name}`}
                            className="grid size-9 place-items-center rounded-md border border-border text-brand transition-colors hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Plus aria-hidden="true" size={17} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Cart & Checkout Panel */}
          <aside className="self-start rounded-md border border-border bg-surface xl:sticky xl:top-5">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <ShoppingCart aria-hidden="true" size={17} /> Current sale
              </h2>
              <span className="rounded bg-surface-subtle px-2 py-0.5 text-xs font-semibold tabular-nums text-muted-strong">
                {cartItems.length} items
              </span>
            </div>

            {cartItems.length ? (
              <div className="max-h-[340px] divide-y divide-border overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{item.name}</p>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item, 0)}
                        title="Remove item"
                        aria-label={`Remove ${item.name}`}
                        className="text-muted transition-colors hover:text-danger"
                      >
                        <Trash2 aria-hidden="true" size={16} />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      {/* Quantity Editor: supports both buttons and direct typing (fractional weights like 1.5 kg) */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item, (cart[item.id] ?? 0) - 1)}
                          title="Decrease quantity"
                          aria-label={`Decrease ${item.name} quantity`}
                          className="grid size-8 place-items-center rounded-md border border-border text-muted-strong hover:bg-surface-subtle"
                        >
                          <Minus aria-hidden="true" size={14} />
                        </button>

                        <input
                          type="number"
                          step="any"
                          min="0.001"
                          max={item.stock}
                          value={cart[item.id]}
                          onChange={(event) =>
                            updateQuantity(item, parseFloat(event.target.value) || 0)
                          }
                          aria-label={`${item.name} quantity`}
                          className="h-8 w-14 rounded-md border border-border bg-surface text-center text-sm font-semibold tabular-nums outline-none focus:border-brand"
                        />

                        <button
                          type="button"
                          onClick={() => updateQuantity(item, (cart[item.id] ?? 0) + 1)}
                          disabled={cart[item.id] >= item.stock}
                          title="Increase quantity"
                          aria-label={`Increase ${item.name} quantity`}
                          className="grid size-8 place-items-center rounded-md border border-border text-muted-strong hover:bg-surface-subtle disabled:opacity-40"
                        >
                          <Plus aria-hidden="true" size={14} />
                        </button>
                      </div>

                      <span className="text-sm font-semibold tabular-nums">
                        {money(item.price * cart[item.id])}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-12 text-center text-sm text-muted">
                Scan barcode or click products to start sale.
              </div>
            )}

            {/* Checkout Form */}
            <form
              action={checkoutAction}
              onSubmit={() => {
                if (!keyRef.current) keyRef.current = crypto.randomUUID();
                if (keyInputRef.current) keyInputRef.current.value = keyRef.current;
              }}
              className="space-y-4 border-t border-border p-4"
            >
              <input type="hidden" name="shiftId" value={shift.id} />
              <input type="hidden" name="checkoutKey" ref={keyInputRef} />
              <input
                type="hidden"
                name="items"
                value={JSON.stringify(
                  cartItems.map((item) => ({
                    variant_id: item.id,
                    quantity: cart[item.id],
                  })),
                )}
              />
              <input type="hidden" name="customerId" value={selectedCustomerId} />

              {/* Customer Selector (Walk-in vs Regular Khata customer) */}
              <div>
                <label htmlFor="customerSelect" className="block text-xs font-semibold uppercase text-muted">
                  Customer account
                </label>
                <select
                  id="customerSelect"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-2.5 text-xs outline-none focus:border-brand"
                >
                  <option value="">Walk-in Customer (Standard)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="font-semibold tabular-nums">{money(total)}</span>
              </div>

              <div className="flex justify-between border-t border-border pt-3 text-lg font-bold">
                <span>Total</span>
                <span className="tabular-nums text-brand">{money(total)}</span>
              </div>

              {/* Cash Received with Quick Tender Denominations */}
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="cashReceived" className="text-sm font-medium">
                    Cash received
                  </label>
                  <span className="text-[11px] text-muted">Press F4 to focus</span>
                </div>

                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-3 top-3 text-sm font-medium text-muted">
                    {currency}
                  </span>
                  <input
                    id="cashReceived"
                    ref={cashInputRef}
                    name="cashReceived"
                    type="number"
                    min={total}
                    step="0.01"
                    required
                    value={cashReceived}
                    onChange={(event) => setCashReceived(event.target.value)}
                    placeholder="0.00"
                    className="mt-1 h-11 w-full rounded-md border border-border-strong bg-surface pl-14 pr-3 text-base font-semibold tabular-nums outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
                  />
                </div>

                {/* Quick Tender Note Chips */}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCashReceived(total > 0 ? String(total) : "")}
                    disabled={total <= 0}
                    className="rounded border border-border bg-surface-subtle px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-surface hover:border-brand disabled:opacity-40"
                  >
                    Exact
                  </button>
                  {[100, 500, 1000, 5000].map((note) => {
                    const target = getTenderTarget(note);
                    return (
                      <button
                        key={note}
                        type="button"
                        onClick={() => setCashReceived(String(target))}
                        disabled={total <= 0}
                        className="rounded border border-border bg-surface-subtle px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-surface hover:border-brand disabled:opacity-40"
                        title={`Tender Rs. ${target.toLocaleString()}`}
                      >
                        Rs. {target.toLocaleString()}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between rounded-md bg-surface-subtle p-3 text-sm">
                <span className="font-medium text-muted">Change due</span>
                <span className="font-bold tabular-nums text-foreground">{money(change)}</span>
              </div>

              {checkoutState.error ? (
                <p role="alert" className="rounded-md bg-warning-soft p-3 text-sm text-warning">
                  {checkoutState.error}
                </p>
              ) : null}

              <SubmitButton
                pendingLabel="Completing sale..."
                disabled={!cartItems.length || numericCash < total}
                className="h-11 w-full rounded-md bg-brand px-4 font-semibold text-white shadow-xs transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                Complete cash sale
              </SubmitButton>
            </form>

            {/* Shift Closing Accordion */}
            <details className="border-t border-border p-4 text-sm">
              <summary className="cursor-pointer font-medium text-muted-strong hover:text-foreground">
                Close register shift
              </summary>
              <form action={closeRegister} className="mt-4 space-y-3">
                <input type="hidden" name="shiftId" value={shift.id} />
                <label className="block text-sm">
                  Counted cash in drawer ({currency})
                  <input
                    name="closingCash"
                    type="number"
                    min="0"
                    max="999999999999.99"
                    step="0.01"
                    required
                    className="mt-1.5 h-10 w-full rounded-md border border-border px-3 tabular-nums outline-none focus:border-brand"
                  />
                </label>
                <SubmitButton
                  pendingLabel="Closing..."
                  className="h-10 w-full rounded-md border border-border px-3 font-semibold hover:bg-surface-subtle"
                >
                  Close register
                </SubmitButton>
              </form>
            </details>
          </aside>
        </div>
      )}
    </section>
  );
}
