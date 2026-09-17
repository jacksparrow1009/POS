"use client";

import Link from "next/link";
import { ChevronRight, PackageSearch, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type CatalogItem = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  costPrice: number;
  sellingPrice: number;
  available: number;
  lowStockThreshold: number;
  isActive: boolean;
};

type ProductCatalogProps = {
  branchName: string;
  currency: string;
  items: CatalogItem[];
};

export function ProductCatalog({ branchName, currency, items }: ProductCatalogProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "archived">("all");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase());
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [query]);

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      const matchesQuery = !debouncedQuery || [item.name, item.sku, item.barcode]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(debouncedQuery));
      const matchesFilter = filter === "all"
        ? true
        : filter === "archived"
          ? !item.isActive
          : item.isActive && item.available <= item.lowStockThreshold;

      return matchesQuery && matchesFilter;
    });
  }, [debouncedQuery, filter, items]);

  return (
    <section className="overflow-hidden rounded-md border border-border bg-surface">
      <div className="border-b border-border p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-sm font-semibold">Product catalog</h2>
          <p className="mt-1 text-xs text-muted">Live availability at {branchName}</p>
        </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex h-9 items-center rounded-md border border-border bg-surface-subtle p-0.5" aria-label="Filter products">
              {(["all", "low", "archived"] as const).map((option) => (
                <button
                  aria-pressed={filter === option}
                  className={`h-8 rounded px-3 text-xs font-semibold capitalize transition-colors ${filter === option ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"}`}
                  key={option}
                  onClick={() => setFilter(option)}
                  type="button"
                >
                  {option === "low" ? "Low stock" : option}
                </button>
              ))}
            </div>
            <label className="relative w-full sm:w-72">
              <span className="sr-only">Search products</span>
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
              <input
                autoComplete="off"
                className="h-10 w-full rounded-md border border-border-strong bg-surface pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/10"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products"
                type="search"
                value={query}
              />
            </label>
          </div>
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <div className="grid min-h-64 place-items-center px-5 py-12 text-center" aria-live="polite">
          <div>
            <PackageSearch aria-hidden="true" className="mx-auto text-muted" size={28} strokeWidth={1.5} />
          <p className="font-semibold">{debouncedQuery ? "No matching products" : "No products yet"}</p>
          <p className="mt-2 text-sm text-muted">
            {debouncedQuery || filter !== "all" ? "Try another search or filter." : "Add your first product to start tracking stock."}
          </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-surface-subtle text-[11px] font-semibold uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU / Barcode</th>
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Available</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((item) => {
                const lowStock = item.available <= item.lowStockThreshold;

                return (
                  <tr className="border-t border-border transition-colors hover:bg-surface-subtle/70" key={item.id}>
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs">{item.sku ?? "No SKU"}</p>
                      <p className="mt-1 text-xs text-muted">{item.barcode ?? "No barcode"}</p>
                    </td>
                    <td className="px-4 py-3">{currency} {item.costPrice.toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold">{currency} {item.sellingPrice.toLocaleString()}</td>
                    <td className="px-4 py-3">{item.available.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-semibold ${!item.isActive ? "bg-surface-subtle text-muted-strong" : lowStock ? "bg-warning-soft text-warning" : "bg-success-soft text-success"}`}>
                        <span className="size-1.5 rounded-full bg-current" />
                        {!item.isActive ? "Archived" : lowStock ? "Low stock" : "In stock"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link aria-label={`Manage ${item.name}`} className="ml-auto grid size-8 place-items-center rounded-md text-muted transition-colors hover:bg-brand-soft hover:text-brand" href={`/products/${item.id}`} title="Manage product">
                        <ChevronRight aria-hidden="true" size={17} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
