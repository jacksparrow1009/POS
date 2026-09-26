"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, MessageCircle, Search, Users } from "lucide-react";
import { CreateCustomerDialog } from "@/app/customers/create-customer-dialog";

export type CustomerItem = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  totalOrders: number;
  totalSpent: number;
  unpaidBalance: number;
  createdAt: string;
};

export function CustomerList({
  customers,
  currency,
}: {
  customers: CustomerItem[];
  currency: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return customers.filter(
      (c) =>
        !term ||
        c.name.toLowerCase().includes(term) ||
        c.phone?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term),
    );
  }, [customers, query]);

  const money = (val: number) =>
    `${currency} ${val.toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <section className="min-w-0">
      <header className="flex min-h-20 flex-wrap items-center justify-between gap-4 border-b border-border bg-surface px-5 py-4 lg:px-6">
        <div>
          <p className="text-xs font-semibold uppercase text-muted">Customer directory</p>
          <h1 className="mt-1 text-xl font-semibold">Customers &amp; Khata</h1>
        </div>
        <CreateCustomerDialog />
      </header>

      <div className="p-5 lg:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full max-w-sm">
            <span className="sr-only">Search customers</span>
            <Search
              aria-hidden="true"
              size={17}
              className="pointer-events-none absolute left-3 top-3 text-muted"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, phone (0300...)"
              className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/10"
            />
          </label>
          <p className="text-xs text-muted">
            {filtered.length} of {customers.length} customers
          </p>
        </div>

        <div className="mt-4 overflow-hidden rounded-md border border-border bg-surface shadow-xs">
          {filtered.length === 0 ? (
            <div className="px-4 py-16 text-center text-sm text-muted">
              <Users size={32} className="mx-auto mb-2 text-muted/60" strokeWidth={1.5} />
              <p className="font-semibold text-foreground">
                {query ? "No matching customers found" : "No customers registered yet"}
              </p>
              <p className="mt-1 text-xs">
                {query
                  ? "Try searching with a different name or phone number."
                  : "Add regular customers to track purchase history and Khata credit."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-surface-subtle text-[11px] font-semibold uppercase text-muted">
                  <tr>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3 text-center">Orders</th>
                    <th className="px-4 py-3 text-right">Total spent</th>
                    <th className="px-4 py-3 text-right">Khata balance</th>
                    <th className="px-4 py-3 text-right"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((c) => {
                    const cleanPhone = c.phone?.replace(/[^0-9]/g, "") ?? "";
                    const waLink = cleanPhone
                      ? `https://wa.me/${cleanPhone.startsWith("0") ? "92" + cleanPhone.slice(1) : cleanPhone}`
                      : null;

                    return (
                      <tr
                        key={c.id}
                        className="transition-colors hover:bg-surface-subtle/70"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/customers/${c.id}`}
                            className="font-medium text-foreground hover:text-brand"
                          >
                            {c.name}
                          </Link>
                          {c.address ? (
                            <p className="mt-0.5 text-xs text-muted truncate max-w-xs">{c.address}</p>
                          ) : null}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {c.phone ? (
                              <span className="font-mono text-xs text-foreground">
                                {c.phone}
                              </span>
                            ) : (
                              <span className="text-xs text-muted">No phone</span>
                            )}
                            {waLink ? (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Chat on WhatsApp"
                                className="grid size-6 place-items-center rounded text-success hover:bg-success-soft"
                              >
                                <MessageCircle size={14} />
                              </a>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-center tabular-nums font-medium">
                          {c.totalOrders}
                        </td>

                        <td className="px-4 py-3 text-right tabular-nums font-semibold">
                          {money(c.totalSpent)}
                        </td>

                        <td className="px-4 py-3 text-right tabular-nums">
                          {c.unpaidBalance > 0 ? (
                            <span className="inline-flex rounded bg-danger-soft px-2 py-0.5 text-xs font-bold text-danger">
                              Udhar: {money(c.unpaidBalance)}
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-success">Clear</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/customers/${c.id}`}
                            className="ml-auto grid size-8 place-items-center rounded-md text-muted hover:bg-brand-soft hover:text-brand"
                            title="View customer profile"
                          >
                            <ChevronRight size={17} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
