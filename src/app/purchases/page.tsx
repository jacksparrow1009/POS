import { ReceiveStockDialog, type VariantOption } from "@/app/purchases/receive-stock-dialog";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";
import { Truck } from "lucide-react";

export default async function PurchasesPage() {
  const { organization, branch } = await getCurrentWorkspace();
  const supabase = await createClient();

  const [
    { data: purchases, error: purchasesError },
    { data: suppliers },
    { data: variants },
    { data: products },
  ] = await Promise.all([
    supabase
      .from("purchases")
      .select("id, purchase_number, supplier_id, grand_total, status, notes, created_at")
      .eq("organization_id", organization.id)
      .eq("branch_id", branch?.id ?? "")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("suppliers")
      .select("id, name")
      .eq("organization_id", organization.id),
    supabase
      .from("product_variants")
      .select("id, product_id, sku, cost_price")
      .eq("organization_id", organization.id)
      .eq("is_active", true),
    supabase
      .from("products")
      .select("id, name")
      .eq("organization_id", organization.id)
      .eq("is_active", true),
  ]);

  if (purchasesError) {
    throw new Error(`Could not load purchases: ${purchasesError.message}`);
  }

  const currency = organization.currency_code.trim();
  const money = (val: number) =>
    `${currency} ${val.toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const suppliersById = new Map((suppliers ?? []).map((s) => [s.id, s.name]));
  const productsById = new Map((products ?? []).map((p) => [p.id, p.name]));

  const variantOptions: VariantOption[] = (variants ?? []).map((v) => ({
    id: v.id,
    name: productsById.get(v.product_id) ?? "Product",
    sku: v.sku,
    costPrice: Number(v.cost_price),
  }));

  return (
    <section className="min-w-0">
      <header className="flex min-h-20 flex-wrap items-center justify-between gap-4 border-b border-border bg-surface px-5 py-4 lg:px-6">
        <div>
          <p className="text-xs font-semibold uppercase text-muted">
            {branch?.name ?? "Branch"} inventory replenishment
          </p>
          <h1 className="mt-1 text-xl font-semibold">Purchases &amp; Suppliers</h1>
        </div>
        <ReceiveStockDialog variants={variantOptions} currency={currency} />
      </header>

      <div className="p-5 lg:p-6">
        <div className="overflow-hidden rounded-md border border-border bg-surface shadow-xs">
          <div className="border-b border-border p-4">
            <h2 className="text-sm font-semibold">Stock In &amp; Purchase orders</h2>
            <p className="mt-0.5 text-xs text-muted">
              Recent receipts from distributors and wholesale suppliers.
            </p>
          </div>

          {(purchases ?? []).length === 0 ? (
            <div className="px-4 py-16 text-center text-sm text-muted">
              <Truck size={32} className="mx-auto mb-2 text-muted/60" strokeWidth={1.5} />
              <p className="font-semibold text-foreground">No purchases recorded yet</p>
              <p className="mt-1 text-xs">
                Receive stock to update product inventory and track cost of goods.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-surface-subtle text-[11px] font-semibold uppercase text-muted">
                  <tr>
                    <th className="px-4 py-3">PO Number</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Notes</th>
                    <th className="px-4 py-3 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(purchases ?? []).map((po) => {
                    const supplierName = po.supplier_id
                      ? suppliersById.get(po.supplier_id) ?? "Supplier"
                      : "Direct Supplier";

                    const formattedDate = new Intl.DateTimeFormat("en-PK", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: organization.timezone,
                    }).format(new Date(po.created_at));

                    return (
                      <tr key={po.id} className="hover:bg-surface-subtle/70">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">
                          {po.purchase_number}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-strong">
                          {formattedDate}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {supplierName}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">
                            {po.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted max-w-xs truncate">
                          {po.notes || "—"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-bold text-foreground">
                          {money(Number(po.grand_total))}
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
