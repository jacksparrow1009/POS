import { ReceiptText, Wallet } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";
import { recordExpense } from "./actions";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  const { created, error } = await searchParams;
  const { organization, branch } = await getCurrentWorkspace();
  const supabase = await createClient();
  const { data: expenses, error: expensesError } = await supabase
    .from("expenses")
    .select("id, category, amount, payment_method, notes, spent_at")
    .eq("organization_id", organization.id)
    .eq("branch_id", branch?.id ?? "")
    .order("spent_at", { ascending: false })
    .limit(75);

  if (expensesError) throw new Error("Could not load expenses. Please try again.");

  const currency = organization.currency_code.trim();
  const money = (val: number) =>
    `${currency} ${val.toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  const total = (expenses ?? []).reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <section className="min-w-0">
      <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-5 py-4 lg:px-6">
        <div>
          <p className="text-xs font-semibold uppercase text-muted">
            {branch?.name ?? "Store"} operating costs
          </p>
          <h1 className="mt-1 text-xl font-semibold">Expenses</h1>
        </div>
        <div className="rounded-md border border-border bg-surface-subtle px-3 py-2 text-sm">
          <span className="text-muted">Listed total</span>{" "}
          <span className="font-semibold tabular-nums">{money(total)}</span>
        </div>
      </header>

      <div className="grid gap-5 p-5 lg:p-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <form action={recordExpense} className="self-start rounded-md border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <Wallet aria-hidden="true" size={18} className="text-brand" />
            <h2 className="text-sm font-semibold">Record expense</h2>
          </div>
          {error ? (
            <p className="mt-4 rounded-md bg-warning-soft p-3 text-sm text-warning" role="alert">
              {error}
            </p>
          ) : null}
          {created ? (
            <p className="mt-4 rounded-md bg-success-soft p-3 text-sm text-success" role="status">
              Expense recorded.
            </p>
          ) : null}

          <div className="mt-4 space-y-4">
            <label className="block text-sm font-medium">
              Category
              <input name="category" required className="mt-1.5 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10" />
            </label>
            <label className="block text-sm font-medium">
              Amount ({currency})
              <input name="amount" type="number" min="0.01" step="0.01" required className="mt-1.5 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm tabular-nums outline-none focus:border-brand focus:ring-2 focus:ring-brand/10" />
            </label>
            <label className="block text-sm font-medium">
              Payment method
              <select name="paymentMethod" defaultValue="cash" className="mt-1.5 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10">
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank transfer</option>
                <option value="wallet">Wallet</option>
              </select>
            </label>
            <label className="block text-sm font-medium">
              Date
              <input name="spentAt" type="datetime-local" className="mt-1.5 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10" />
            </label>
            <label className="block text-sm font-medium">
              Notes
              <input name="notes" maxLength={240} className="mt-1.5 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10" />
            </label>
          </div>

          <SubmitButton pendingLabel="Recording..." className="mt-5 h-10 w-full rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover">
            Record expense
          </SubmitButton>
        </form>

        <div className="overflow-hidden rounded-md border border-border bg-surface">
          <div className="border-b border-border p-4">
            <h2 className="text-sm font-semibold">Recent expenses</h2>
            <p className="mt-0.5 text-xs text-muted">Cash drawer and operating cost history.</p>
          </div>
          {(expenses ?? []).length === 0 ? (
            <div className="px-4 py-16 text-center text-sm text-muted">
              <ReceiptText aria-hidden="true" className="mx-auto mb-2 text-muted/60" size={30} />
              No expenses recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-surface-subtle text-[11px] font-semibold uppercase text-muted">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Notes</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(expenses ?? []).map((item) => (
                    <tr key={item.id} className="hover:bg-surface-subtle/70">
                      <td className="px-4 py-3 text-xs text-muted-strong">
                        {new Intl.DateTimeFormat("en-PK", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: organization.timezone,
                        }).format(new Date(item.spent_at))}
                      </td>
                      <td className="px-4 py-3 font-medium">{item.category}</td>
                      <td className="px-4 py-3 text-xs text-muted-strong">{item.payment_method}</td>
                      <td className="max-w-xs truncate px-4 py-3 text-xs text-muted">{item.notes || "None"}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">{money(Number(item.amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
