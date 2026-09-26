import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Percent,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";

export default async function ReportsPage() {
  const { organization, branch } = await getCurrentWorkspace();
  const supabase = await createClient();

  const [
    { data: sales, error: salesError },
    { data: saleItems, error: itemsError },
    { data: returns, error: returnsError },
    { data: shifts, error: shiftsError },
    { data: variants },
    { data: products },
  ] = await Promise.all([
    supabase
      .from("sales")
      .select("id, grand_total, created_at, status")
      .eq("organization_id", organization.id)
      .eq("branch_id", branch?.id ?? "")
      .order("created_at", { ascending: false }),
    supabase
      .from("sale_items")
      .select("variant_id, quantity, unit_price, unit_cost, line_total")
      .eq("organization_id", organization.id),
    supabase
      .from("sale_returns")
      .select("refund_total, created_at")
      .eq("organization_id", organization.id)
      .eq("branch_id", branch?.id ?? ""),
    supabase
      .from("register_shifts")
      .select("id, opened_at, closed_at, opening_cash, closing_cash, expected_cash, status")
      .eq("organization_id", organization.id)
      .eq("branch_id", branch?.id ?? "")
      .order("opened_at", { ascending: false })
      .limit(15),
    supabase
      .from("product_variants")
      .select("id, product_id, sku")
      .eq("organization_id", organization.id),
    supabase
      .from("products")
      .select("id, name")
      .eq("organization_id", organization.id),
  ]);

  if (salesError || itemsError || returnsError || shiftsError) {
    throw new Error("Could not load business reports. Please try again.");
  }

  const currency = organization.currency_code.trim();
  const money = (val: number) =>
    `${currency} ${val.toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // Financial Metrics
  const grossSales = (sales ?? []).reduce((sum, s) => sum + Number(s.grand_total), 0);
  const totalRefunds = (returns ?? []).reduce((sum, r) => sum + Number(r.refund_total), 0);
  const netRevenue = Math.max(0, grossSales - totalRefunds);

  const cogs = (saleItems ?? []).reduce(
    (sum, item) => sum + Number(item.unit_cost) * Number(item.quantity),
    0,
  );
  const grossProfit = netRevenue - cogs;
  const grossMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;
  const averageOrderValue = (sales ?? []).length > 0 ? netRevenue / (sales ?? []).length : 0;

  // Top Selling Products Calculation
  const productsById = new Map((products ?? []).map((p) => [p.id, p.name]));
  const variantsById = new Map((variants ?? []).map((v) => [v.id, v]));

  const salesByVariant = new Map<
    string,
    { units: number; revenue: number; name: string; sku: string }
  >();

  for (const item of saleItems ?? []) {
    const variant = variantsById.get(item.variant_id);
    const prodName = variant ? productsById.get(variant.product_id) ?? "Product" : "Product";
    const sku = variant?.sku ?? "No SKU";

    const curr = salesByVariant.get(item.variant_id) ?? {
      units: 0,
      revenue: 0,
      name: prodName,
      sku,
    };
    curr.units += Number(item.quantity);
    curr.revenue += Number(item.line_total);
    salesByVariant.set(item.variant_id, curr);
  }

  const topProducts = Array.from(salesByVariant.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  return (
    <section className="min-w-0">
      <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-5 py-4 lg:px-6">
        <div>
          <p className="text-xs font-semibold uppercase text-muted">
            {branch?.name ?? "Store"} analytics
          </p>
          <h1 className="mt-1 text-xl font-semibold">Reports &amp; Performance</h1>
        </div>
      </header>

      <div className="space-y-6 p-5 lg:p-6">
        {/* KPI Financial Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-md border border-border bg-surface p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-muted">
              <span>Net Revenue</span>
              <DollarSign size={17} className="text-brand" />
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">
              {money(netRevenue)}
            </p>
            <p className="mt-1 text-xs text-muted">
              Gross: {money(grossSales)} · Refunds: {money(totalRefunds)}
            </p>
          </div>

          <div className="rounded-md border border-border bg-surface p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-muted">
              <span>Gross Profit</span>
              <TrendingUp size={17} className="text-success" />
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums text-success">
              {money(grossProfit)}
            </p>
            <p className="mt-1 text-xs text-muted">Estimated COGS: {money(cogs)}</p>
          </div>

          <div className="rounded-md border border-border bg-surface p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-muted">
              <span>Gross Margin</span>
              <Percent size={17} className="text-brand" />
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">
              {grossMargin.toFixed(1)}%
            </p>
            <p className="mt-1 text-xs text-muted">Profit efficiency ratio</p>
          </div>

          <div className="rounded-md border border-border bg-surface p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-muted">
              <span>Avg Order Value</span>
              <Receipt size={17} className="text-muted" />
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">
              {money(averageOrderValue)}
            </p>
            <p className="mt-1 text-xs text-muted">{(sales ?? []).length} total receipts</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          {/* Shift Drawer Reconciliation Table */}
          <div className="rounded-md border border-border bg-surface shadow-xs">
            <div className="border-b border-border p-4">
              <h2 className="text-sm font-semibold">Shift drawer reconciliations</h2>
              <p className="mt-0.5 text-xs text-muted">
                Audit cash drawer opening, expected, and closing counted balances.
              </p>
            </div>

            {(shifts ?? []).length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-muted">
                No register shifts completed yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[580px] text-left text-sm">
                  <thead className="bg-surface-subtle text-[11px] font-semibold uppercase text-muted">
                    <tr>
                      <th className="px-4 py-3">Shift Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Opening</th>
                      <th className="px-4 py-3 text-right">Expected</th>
                      <th className="px-4 py-3 text-right">Closing</th>
                      <th className="px-4 py-3 text-right">Difference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(shifts ?? []).map((shift) => {
                      const diff =
                        shift.closing_cash !== null && shift.expected_cash !== null
                          ? Number(shift.closing_cash) - Number(shift.expected_cash)
                          : null;

                      const formattedDate = new Intl.DateTimeFormat("en-PK", {
                        dateStyle: "short",
                        timeStyle: "short",
                        timeZone: organization.timezone,
                      }).format(new Date(shift.opened_at));

                      return (
                        <tr key={shift.id} className="hover:bg-surface-subtle/70">
                          <td className="px-4 py-3 text-xs font-medium text-foreground">
                            {formattedDate}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded px-2 py-0.5 text-xs font-semibold ${
                                shift.status === "open"
                                  ? "bg-success-soft text-success"
                                  : "bg-surface-subtle text-muted-strong"
                              }`}
                            >
                              {shift.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-xs">
                            {money(Number(shift.opening_cash))}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-xs">
                            {shift.expected_cash !== null ? money(Number(shift.expected_cash)) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-xs font-medium">
                            {shift.closing_cash !== null ? money(Number(shift.closing_cash)) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-xs font-semibold">
                            {diff === null ? (
                              <span className="text-muted">In progress</span>
                            ) : diff === 0 ? (
                              <span className="text-success">Exact (0.00)</span>
                            ) : diff > 0 ? (
                              <span className="inline-flex items-center text-success">
                                <ArrowUpRight size={13} /> +{money(diff)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-danger">
                                <ArrowDownRight size={13} /> {money(diff)}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top Selling Products */}
          <div className="rounded-md border border-border bg-surface shadow-xs">
            <div className="border-b border-border p-4">
              <h2 className="text-sm font-semibold">Top selling products</h2>
              <p className="mt-0.5 text-xs text-muted">
                Ranked by gross sales volume at this branch.
              </p>
            </div>

            {topProducts.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-muted">
                No items sold yet.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {topProducts.map((prod, idx) => (
                  <div
                    key={prod.sku + idx}
                    className="flex items-center justify-between gap-3 p-3.5 hover:bg-surface-subtle/70"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="grid size-6 shrink-0 place-items-center rounded bg-surface-subtle font-mono text-xs font-bold text-muted-strong">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {prod.name}
                        </p>
                        <p className="text-xs text-muted font-mono">{prod.sku}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold tabular-nums text-foreground">
                        {money(prod.revenue)}
                      </p>
                      <p className="text-xs text-muted tabular-nums">
                        {prod.units.toLocaleString()} units sold
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
