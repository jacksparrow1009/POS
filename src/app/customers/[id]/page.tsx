import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  MapPin,
  MessageCircle,
  Phone,
  ShoppingBag,
  User,
} from "lucide-react";
import { RecordPaymentDialog } from "./record-payment-dialog";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/.test(id)) notFound();

  const { organization } = await getCurrentWorkspace();
  const supabase = await createClient();

  const [{ data: customer }, { data: sales }] = await Promise.all([
    supabase
      .from("customers")
      .select("id, name, phone, email, address, created_at")
      .eq("id", id)
      .eq("organization_id", organization.id)
      .single(),
    supabase
      .from("sales")
      .select("id, receipt_number, created_at, grand_total, paid_total, status")
      .eq("customer_id", id)
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false }),
  ]);

  if (!customer) notFound();

  const currency = organization.currency_code.trim();
  const money = (val: number) =>
    `${currency} ${val.toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const totalSpent = (sales ?? []).reduce(
    (sum, s) => sum + Number(s.grand_total),
    0,
  );
  const totalPaid = (sales ?? []).reduce(
    (sum, s) => sum + Number(s.paid_total),
    0,
  );
  const unpaidBalance = Math.max(0, totalSpent - totalPaid);

  const cleanPhone = customer.phone?.replace(/[^0-9]/g, "") ?? "";
  const waLink = cleanPhone
    ? `https://wa.me/${cleanPhone.startsWith("0") ? "92" + cleanPhone.slice(1) : cleanPhone}`
    : null;

  const joinDate = new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    timeZone: organization.timezone,
  }).format(new Date(customer.created_at));

  return (
    <section className="min-w-0">
      <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-5 py-4 lg:px-6">
        <div>
          <Link
            href="/customers"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
          >
            <ArrowLeft size={14} /> Back to customers
          </Link>
          <h1 className="mt-1 text-xl font-semibold">{customer.name}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {unpaidBalance > 0 ? (
            <RecordPaymentDialog
              customerId={customer.id}
              customerName={customer.name}
              unpaidBalance={unpaidBalance}
              currency={currency}
            />
          ) : null}

          {waLink ? (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-semibold text-success hover:bg-success-soft"
            >
              <MessageCircle size={16} /> WhatsApp customer
            </a>
          ) : null}
        </div>
      </header>

      <div className="space-y-6 p-5 lg:p-6">
        {/* Customer Metrics */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-md border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-muted">Total purchases</span>
              <ShoppingBag size={17} className="text-muted" />
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">{money(totalSpent)}</p>
            <p className="mt-1 text-xs text-muted">{(sales ?? []).length} completed orders</p>
          </div>

          <div className="rounded-md border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-muted">Khata balance (Udhar)</span>
              <CreditCard size={17} className="text-muted" />
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums text-danger">
              {money(unpaidBalance)}
            </p>
            <p className="mt-1 text-xs text-muted">
              {unpaidBalance > 0 ? "Pending payment due" : "All accounts clear"}
            </p>
          </div>

          <div className="rounded-md border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-muted">Customer since</span>
              <Calendar size={17} className="text-muted" />
            </div>
            <p className="mt-2 text-xl font-bold">{joinDate}</p>
            <p className="mt-1 text-xs text-muted">Registered in {organization.name}</p>
          </div>
        </div>

        {/* Contact Info Card */}
        <div className="rounded-md border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold">Contact &amp; address</h2>
          <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2 text-muted-strong">
              <Phone size={15} className="text-muted" />
              <span>{customer.phone || "No phone number added"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-strong">
              <User size={15} className="text-muted" />
              <span>{customer.email || "No email address"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-strong sm:col-span-2">
              <MapPin size={15} className="text-muted" />
              <span>{customer.address || "No address recorded"}</span>
            </div>
          </div>
        </div>

        {/* Purchase History Table */}
        <div className="rounded-md border border-border bg-surface shadow-xs">
          <div className="border-b border-border p-4">
            <h2 className="text-sm font-semibold">Purchase history &amp; receipts</h2>
          </div>
          {(sales ?? []).length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-muted">
              No purchases recorded for this customer yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="bg-surface-subtle text-[11px] font-semibold uppercase text-muted">
                  <tr>
                    <th className="px-4 py-3">Receipt</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Order total</th>
                    <th className="px-4 py-3 text-right">Amount paid</th>
                    <th className="px-4 py-3 text-right">Balance</th>
                    <th className="px-4 py-3 text-right"><span className="sr-only">View</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(sales ?? []).map((sale) => {
                    const balance = Math.max(
                      0,
                      Number(sale.grand_total) - Number(sale.paid_total),
                    );
                    const formattedDate = new Intl.DateTimeFormat("en-PK", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: organization.timezone,
                    }).format(new Date(sale.created_at));

                    return (
                      <tr
                        key={sale.id}
                        className="transition-colors hover:bg-surface-subtle/70"
                      >
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-brand">
                          <Link href={`/pos/receipt/${sale.id}`}>{sale.receipt_number}</Link>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-strong">
                          {formattedDate}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium">
                          {money(Number(sale.grand_total))}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-success">
                          {money(Number(sale.paid_total))}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {balance > 0 ? (
                            <span className="font-semibold text-danger">
                              {money(balance)}
                            </span>
                          ) : (
                            <span className="text-xs text-muted">Paid</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/pos/receipt/${sale.id}`}
                            className="text-xs font-semibold text-brand hover:underline"
                          >
                            Receipt
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
