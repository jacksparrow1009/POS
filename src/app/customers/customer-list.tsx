"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  CircleDollarSign,
  MessageCircle,
  Search,
  ShoppingBag,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";
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

type BalanceFilter = "all" | "outstanding" | "clear";

export function CustomerList({ customers, currency }: { customers: CustomerItem[]; currency: string }) {
  const [query, setQuery] = useState("");
  const [balanceFilter, setBalanceFilter] = useState<BalanceFilter>("all");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return customers.filter((customer) => {
      const matchesQuery =
        !term ||
        customer.name.toLowerCase().includes(term) ||
        customer.phone?.toLowerCase().includes(term) ||
        customer.email?.toLowerCase().includes(term);
      const matchesBalance =
        balanceFilter === "all" ||
        (balanceFilter === "outstanding" && customer.unpaidBalance > 0) ||
        (balanceFilter === "clear" && customer.unpaidBalance <= 0);
      return matchesQuery && matchesBalance;
    });
  }, [balanceFilter, customers, query]);

  const money = (value: number) =>
    `${currency} ${value.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const totalSpent = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);
  const outstanding = customers.reduce((sum, customer) => sum + customer.unpaidBalance, 0);
  const totalOrders = customers.reduce((sum, customer) => sum + customer.totalOrders, 0);

  return (
    <section className="min-w-0">
      <header className="flex min-h-24 flex-wrap items-center justify-between gap-4 border-b border-border bg-surface px-5 py-5 lg:px-8">
        <div>
          <p className="text-xs font-medium text-muted">Customer directory</p>
          <h1 className="mt-1 text-2xl font-semibold">Customers and credit</h1>
          <p className="mt-1 text-sm text-muted">Track customer activity, balances, and contact details.</p>
        </div>
        <CreateCustomerDialog />
      </header>

      <div className="space-y-5 p-5 lg:p-8">
        <section aria-label="Customer summary" className="grid overflow-hidden rounded-md border border-border bg-surface shadow-xs sm:grid-cols-2 xl:grid-cols-4">
          <SummaryMetric icon={Users} label="Customers" value={customers.length.toLocaleString()} />
          <SummaryMetric icon={ShoppingBag} label="Total orders" value={totalOrders.toLocaleString()} />
          <SummaryMetric icon={CircleDollarSign} label="Lifetime sales" value={money(totalSpent)} />
          <SummaryMetric icon={WalletCards} label="Outstanding credit" value={money(outstanding)} warning={outstanding > 0} />
        </section>

        <section className="overflow-hidden rounded-md border border-border bg-surface shadow-xs">
          <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative block w-full lg:max-w-md">
              <span className="sr-only">Search customers</span>
              <Search aria-hidden="true" size={17} className="pointer-events-none absolute left-3 top-3 text-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, phone, or email"
                className="h-10 w-full rounded-md border border-border-strong bg-surface pl-10 pr-10 text-sm outline-none placeholder:text-muted"
              />
              {query ? (
                <button aria-label="Clear search" className="absolute right-1 top-1 grid size-8 place-items-center rounded text-muted hover:bg-surface-subtle hover:text-foreground" onClick={() => setQuery("")} type="button">
                  <X aria-hidden="true" size={15} />
                </button>
              ) : null}
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-10 items-center rounded-md border border-border bg-surface-subtle p-1" aria-label="Filter by balance">
                {(["all", "outstanding", "clear"] as const).map((option) => (
                  <button
                    className={`h-8 rounded px-3 text-xs font-semibold capitalize ${balanceFilter === option ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"}`}
                    key={option}
                    onClick={() => setBalanceFilter(option)}
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>
              <p className="text-xs tabular-nums text-muted">{filtered.length} of {customers.length}</p>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyCustomers filtered={customers.length > 0} />
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead className="bg-surface-subtle text-[11px] font-semibold uppercase text-muted">
                    <tr>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3 text-center">Orders</th>
                      <th className="px-4 py-3 text-right">Total spent</th>
                      <th className="px-4 py-3 text-right">Balance</th>
                      <th className="w-12 px-4 py-3"><span className="sr-only">View</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((customer) => <CustomerRow customer={customer} key={customer.id} money={money} />)}
                  </tbody>
                </table>
              </div>
              <div className="divide-y divide-border md:hidden">
                {filtered.map((customer) => <CustomerCard customer={customer} key={customer.id} money={money} />)}
              </div>
            </>
          )}
        </section>
      </div>
    </section>
  );
}

function SummaryMetric({ icon: Icon, label, value, warning = false }: { icon: typeof Users; label: string; value: string; warning?: boolean }) {
  return (
    <div className="flex items-center gap-3 border-b border-border p-4 last:border-b-0 sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:last:border-r-0">
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-surface-subtle text-muted-strong"><Icon aria-hidden="true" size={17} /></span>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className={`mt-0.5 truncate text-base font-semibold tabular-nums ${warning ? "text-danger" : "text-foreground"}`}>{value}</p>
      </div>
    </div>
  );
}

function CustomerRow({ customer, money }: { customer: CustomerItem; money: (value: number) => string }) {
  const waLink = getWhatsAppLink(customer.phone);
  return (
    <tr className="hover:bg-surface-subtle/70">
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <CustomerAvatar name={customer.name} />
          <div className="min-w-0">
            <Link href={`/customers/${customer.id}`} className="font-semibold text-foreground hover:text-brand">{customer.name}</Link>
            <p className="mt-0.5 max-w-xs truncate text-xs text-muted">{customer.address || "No address added"}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <p className="text-xs font-medium text-foreground">{customer.phone || "No phone"}</p>
        <p className="mt-1 max-w-48 truncate text-xs text-muted">{customer.email || "No email"}</p>
      </td>
      <td className="px-4 py-3.5 text-center font-medium tabular-nums">{customer.totalOrders}</td>
      <td className="px-4 py-3.5 text-right font-semibold tabular-nums">{money(customer.totalSpent)}</td>
      <td className="px-4 py-3.5 text-right"><Balance amount={customer.unpaidBalance} money={money} /></td>
      <td className="px-4 py-3.5">
        <div className="flex justify-end gap-1">
          {waLink ? <a aria-label={`Message ${customer.name} on WhatsApp`} className="grid size-8 place-items-center rounded-md text-muted hover:bg-success-soft hover:text-success" href={waLink} rel="noopener noreferrer" target="_blank" title="Message on WhatsApp"><MessageCircle aria-hidden="true" size={16} /></a> : null}
          <Link aria-label={`View ${customer.name}`} className="grid size-8 place-items-center rounded-md text-muted hover:bg-surface-subtle hover:text-foreground" href={`/customers/${customer.id}`} title="View customer"><ChevronRight aria-hidden="true" size={17} /></Link>
        </div>
      </td>
    </tr>
  );
}

function CustomerCard({ customer, money }: { customer: CustomerItem; money: (value: number) => string }) {
  return (
    <Link className="block p-4 hover:bg-surface-subtle" href={`/customers/${customer.id}`}>
      <div className="flex items-start gap-3">
        <CustomerAvatar name={customer.name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2"><p className="truncate text-sm font-semibold">{customer.name}</p><Balance amount={customer.unpaidBalance} money={money} /></div>
          <p className="mt-1 truncate text-xs text-muted">{customer.phone || customer.email || "No contact details"}</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted"><span>{customer.totalOrders} orders</span><span className="font-medium text-foreground">{money(customer.totalSpent)} spent</span></div>
        </div>
      </div>
    </Link>
  );
}

function CustomerAvatar({ name }: { name: string }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return <span className="grid size-9 shrink-0 place-items-center rounded-md bg-surface-subtle text-xs font-semibold text-muted-strong">{initials || <UserRound size={16} />}</span>;
}

function Balance({ amount, money }: { amount: number; money: (value: number) => string }) {
  return amount > 0
    ? <span className="inline-flex rounded bg-danger-soft px-2 py-1 text-xs font-semibold tabular-nums text-danger">{money(amount)}</span>
    : <span className="inline-flex rounded bg-success-soft px-2 py-1 text-xs font-semibold text-success">Clear</span>;
}

function EmptyCustomers({ filtered }: { filtered: boolean }) {
  return (
    <div className="px-4 py-16 text-center text-sm text-muted">
      <Users size={30} className="mx-auto mb-3 text-muted/60" strokeWidth={1.5} />
      <p className="font-semibold text-foreground">{filtered ? "No customers match these filters" : "No customers yet"}</p>
      <p className="mt-1 text-xs">{filtered ? "Clear the search or choose another balance filter." : "Add a customer to track purchases and credit balances."}</p>
    </div>
  );
}

function getWhatsAppLink(phone: string | null) {
  const cleanPhone = phone?.replace(/[^0-9]/g, "") ?? "";
  if (!cleanPhone) return null;
  return `https://wa.me/${cleanPhone.startsWith("0") ? `92${cleanPhone.slice(1)}` : cleanPhone}`;
}
