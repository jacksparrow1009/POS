"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";

export type SaleListItem = { id: string; receiptNumber: string; createdAt: string;
  total: number; refunded: number; status: string };

export function SalesList({ items, branchName, currency, timezone }: {
  items: SaleListItem[]; branchName: string; currency: string; timezone: string;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => items.filter((sale) =>
    sale.receiptNumber.toLowerCase().includes(query.trim().toLowerCase())), [items, query]);
  const money = (amount: number) => `${currency} ${amount.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const date = (value: string) => new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium", timeStyle: "short", timeZone: timezone,
  }).format(new Date(value));
  return <section className="min-w-0">
    <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-5 py-4 lg:px-6">
      <div><p className="text-xs font-semibold uppercase text-muted">{branchName}</p>
        <h1 className="mt-1 text-xl font-semibold">Sales history</h1></div>
      <Link href="/pos" className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white">
        New sale <ArrowRight aria-hidden="true" size={17} /></Link>
    </header>
    <div className="p-5 lg:p-6">
      <label className="relative block max-w-sm"><span className="sr-only">Search receipt number</span>
        <Search aria-hidden="true" size={18} className="absolute left-3 top-3 text-muted" />
        <input value={query} onChange={(event) => setQuery(event.target.value)}
          placeholder="Search receipt number" className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-3 text-sm" />
      </label>
      <p className="mt-3 text-xs text-muted">Showing the latest {items.length} sales</p>
      <div className="mt-4 overflow-x-auto border border-border bg-surface">
        <table className="w-full min-w-[650px] text-left text-sm">
          <thead className="border-b border-border bg-surface-subtle text-xs uppercase text-muted"><tr>
            <th className="px-4 py-3 font-semibold">Receipt</th><th className="px-4 py-3 font-semibold">Date</th>
            <th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 text-right font-semibold">Total</th>
            <th className="px-4 py-3 text-right font-semibold">Refunded</th><th className="px-4 py-3" />
          </tr></thead>
          <tbody className="divide-y divide-border">{filtered.map((sale) => {
            const refundStatus = sale.refunded >= sale.total && sale.total > 0 ? "Returned"
              : sale.refunded > 0 ? "Partially returned" : sale.status === "completed" ? "Completed" : sale.status;
            return <tr key={sale.id} className="hover:bg-surface-subtle">
              <td className="px-4 py-3 font-mono text-xs font-semibold">{sale.receiptNumber}</td>
              <td className="px-4 py-3 text-muted-strong">{date(sale.createdAt)}</td>
              <td className="px-4 py-3"><span className="rounded bg-surface-subtle px-2 py-1 text-xs font-medium">{refundStatus}</span></td>
              <td className="px-4 py-3 text-right tabular-nums">{money(sale.total)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{money(sale.refunded)}</td>
              <td className="px-4 py-3 text-right"><Link href={`/pos/receipt/${sale.id}`} className="font-semibold text-brand hover:underline">View</Link></td>
            </tr>;
          })}</tbody>
        </table>
        {!filtered.length ? <p className="px-4 py-10 text-center text-sm text-muted">{items.length ? "No matching receipts." : "No sales yet."}</p> : null}
      </div>
    </div>
  </section>;
}
