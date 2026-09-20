import { SalesList, type SaleListItem } from "@/app/pos/sales/sales-list";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";

export default async function SalesPage() {
  const { organization, branch } = await getCurrentWorkspace();
  if (!branch) return <section className="p-6"><h1 className="text-xl font-semibold">Sales</h1>
    <p className="mt-3 text-sm text-muted">No active branch is available.</p></section>;
  const supabase = await createClient();
  const { data: sales, error } = await supabase.from("sales")
    .select("id, receipt_number, created_at, grand_total, status")
    .eq("organization_id", organization.id).eq("branch_id", branch.id)
    .order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error("Could not load sales. Please try again.");
  const saleIds = (sales ?? []).map((sale) => sale.id);
  const { data: returns, error: returnsError } = saleIds.length
    ? await supabase.from("sale_returns").select("sale_id, refund_total")
      .eq("organization_id", organization.id).eq("branch_id", branch.id).in("sale_id", saleIds)
    : { data: [], error: null };
  if (returnsError) throw new Error("Could not load return totals. Please try again.");
  const refunds = new Map<string, number>();
  for (const row of returns ?? []) refunds.set(row.sale_id, (refunds.get(row.sale_id) ?? 0) + Number(row.refund_total));
  const items: SaleListItem[] = (sales ?? []).map((sale) => ({
    id: sale.id, receiptNumber: sale.receipt_number, createdAt: sale.created_at,
    total: Number(sale.grand_total), refunded: refunds.get(sale.id) ?? 0, status: sale.status,
  }));
  return <SalesList items={items} branchName={branch.name}
    currency={organization.currency_code.trim()} timezone={organization.timezone} />;
}
