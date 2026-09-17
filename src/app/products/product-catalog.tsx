"use client";

import Link from "next/link";
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

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase());
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [query]);

  const visibleItems = useMemo(() => {
    if (!debouncedQuery) return items;

    return items.filter((item) =>
      [item.name, item.sku, item.barcode]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(debouncedQuery)),
    );
  }, [debouncedQuery, items]);

  return (
    <section className="overflow-hidden rounded-md border border-[#dfe3e8] bg-white">
      <div className="flex flex-col gap-4 border-b border-[#edf0f2] p-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-base font-semibold">Catalog and stock</h2>
          <p className="mt-1 text-sm text-[#697680]">Current inventory at {branchName}.</p>
        </div>
        <label className="w-full max-w-sm">
          <span className="sr-only">Search products</span>
          <input
            autoComplete="off"
            className="h-10 w-full rounded-md border border-[#cfd6dd] px-3 text-sm outline-none focus:border-[#0b5c5a]"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, SKU, or barcode"
            type="search"
            value={query}
          />
        </label>
      </div>

      {visibleItems.length === 0 ? (
        <div className="px-5 py-16 text-center" aria-live="polite">
          <p className="font-semibold">{debouncedQuery ? "No matching products" : "No products yet"}</p>
          <p className="mt-2 text-sm text-[#697680]">
            {debouncedQuery ? "Try a different name, SKU, or barcode." : "Add your first product using the form."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[#f7f8f9] text-xs uppercase text-[#697680]">
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
                  <tr className="border-t border-[#edf0f2]" key={item.id}>
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs">{item.sku ?? "No SKU"}</p>
                      <p className="mt-1 text-xs text-[#697680]">{item.barcode ?? "No barcode"}</p>
                    </td>
                    <td className="px-4 py-3">{currency} {item.costPrice.toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold">{currency} {item.sellingPrice.toLocaleString()}</td>
                    <td className="px-4 py-3">{item.available.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${!item.isActive ? "bg-[#eceff1] text-[#53606b]" : lowStock ? "bg-[#fff1df] text-[#935400]" : "bg-[#e8f4ee] text-[#0f6848]"}`}>
                        {!item.isActive ? "Archived" : lowStock ? "Low stock" : "In stock"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link className="font-semibold text-[#0b5c5a]" href={`/products/${item.id}`}>
                        Manage
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
