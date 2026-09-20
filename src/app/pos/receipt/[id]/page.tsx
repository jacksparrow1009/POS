import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { PrintReceiptButton } from "@/app/pos/receipt/[id]/print-button";
import { ReturnForm, type ReturnableLine } from "@/app/pos/receipt/[id]/return-form";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";

export default async function ReceiptPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returned?: string }>;
}) {
  const { id } = await params;
  const { returned } = await searchParams;
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/.test(id)) notFound();
  const { organization, branch } = await getCurrentWorkspace();
  const supabase = await createClient();
  const { data: sale } = await supabase.from("sales")
    .select("id, receipt_number, subtotal, discount_total, tax_total, grand_total, paid_total, change_total, created_at, branch_id")
    .eq("id", id).eq("organization_id", organization.id).single();
  if (!sale) notFound();
  const [linesResult, paymentResult, returnsResult, shiftResult] = await Promise.all([
    supabase.from("sale_items").select("id, variant_id, quantity, unit_price, line_total, discount_total, tax_total")
      .eq("sale_id", sale.id).eq("organization_id", organization.id),
    supabase.from("sale_payments").select("method, amount")
      .eq("sale_id", sale.id).eq("organization_id", organization.id).limit(1).maybeSingle(),
    supabase.from("sale_returns").select("id, return_number, refund_total, reason, created_at")
      .eq("sale_id", sale.id).eq("organization_id", organization.id).order("created_at", { ascending: false }),
    supabase.from("register_shifts").select("id")
      .eq("organization_id", organization.id).eq("branch_id", sale.branch_id)
      .eq("status", "open").maybeSingle(),
  ]);
  if (linesResult.error || paymentResult.error || returnsResult.error || shiftResult.error) {
    throw new Error("Could not load the complete receipt. Please try again.");
  }
  const lines = linesResult.data;
  const payment = paymentResult.data;
  const returns = returnsResult.data;
  const shift = shiftResult.data;
  const returnIds = (returns ?? []).map((row) => row.id);
  const { data: returnLines, error: returnLinesError } = returnIds.length ? await supabase.from("sale_return_items")
    .select("sale_item_id, quantity").eq("organization_id", organization.id).in("sale_return_id", returnIds)
    : { data: [], error: null };
  if (returnLinesError) throw new Error("Could not load return details. Please try again.");
  const variantIds = (lines ?? []).map((line) => line.variant_id);
  const { data: variants, error: variantsError } = variantIds.length ? await supabase.from("product_variants")
    .select("id, product_id, sku").eq("organization_id", organization.id).in("id", variantIds)
    : { data: [], error: null };
  const productIds = (variants ?? []).map((variant) => variant.product_id);
  const { data: products, error: productsError } = productIds.length ? await supabase.from("products")
    .select("id, name").eq("organization_id", organization.id).in("id", productIds)
    : { data: [], error: null };
  if (variantsError || productsError) throw new Error("Could not load receipt products. Please try again.");
  const variantsById = new Map((variants ?? []).map((variant) => [variant.id, variant]));
  const productsById = new Map((products ?? []).map((product) => [product.id, product]));
  const returnedByLine = new Map<string, number>();
  for (const line of returnLines ?? []) returnedByLine.set(line.sale_item_id,
    (returnedByLine.get(line.sale_item_id) ?? 0) + Number(line.quantity));
  const returnable: ReturnableLine[] = (lines ?? []).map((line) => {
    const variant = variantsById.get(line.variant_id);
    return { id: line.id, name: variant ? productsById.get(variant.product_id)?.name ?? "Product" : "Product",
      remaining: Math.max(0, Number(line.quantity) - (returnedByLine.get(line.id) ?? 0)),
      unitPrice: Number(line.unit_price) };
  });
  const refundTotal = (returns ?? []).reduce((sum, row) => sum + Number(row.refund_total), 0);
  const canReturn = branch?.id === sale.branch_id && !!shift && payment?.method === "cash"
    && Number(sale.discount_total) === 0 && Number(sale.tax_total) === 0
    && (lines ?? []).every((line) => Number(line.discount_total) === 0 && Number(line.tax_total) === 0)
    && returnable.some((line) => line.remaining > 0);
  const currency = organization.currency_code.trim();
  const money = (value: number) => `${currency} ${Number(value).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return <section className="min-w-0">
    <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-5 py-4 lg:px-6 print:hidden">
      <div><p className="flex items-center gap-2 text-xs font-semibold text-success"><CheckCircle2 size={16} /> Sale completed</p>
        <h1 className="mt-1 text-xl font-semibold">Receipt {sale.receipt_number}</h1></div>
      <div className="flex gap-2"><Link href="/pos/sales" className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold"><ArrowLeft size={17} /> Sales</Link>
        <PrintReceiptButton /></div>
    </header>
    {returned ? <p role="status" className="mx-auto mt-5 max-w-md rounded-md bg-success-soft p-3 text-sm font-medium text-success print:hidden">Return recorded and stock restored.</p> : null}
    <div className="mx-auto max-w-md p-5 print:max-w-none print:p-0">
      <article className="border border-border bg-surface p-5 print:border-0 print:p-0">
        <div className="border-b border-border pb-4 text-center"><h2 className="text-lg font-semibold">{organization.name}</h2>
          <p className="mt-1 text-xs text-muted">{branch?.id === sale.branch_id ? branch.name : "Store receipt"}</p>
          <p className="mt-3 font-mono text-sm">{sale.receipt_number}</p>
          <p className="mt-1 text-xs text-muted">{new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short", timeZone: organization.timezone }).format(new Date(sale.created_at))}</p></div>
        <div className="divide-y divide-border">{(lines ?? []).map((line, index) => {
          const variant = variantsById.get(line.variant_id);
          return <div key={`${line.variant_id}-${index}`} className="flex justify-between gap-3 py-3 text-sm">
            <div><p className="font-medium">{variant ? productsById.get(variant.product_id)?.name ?? "Product" : "Product"}</p>
              <p className="mt-1 text-xs text-muted">{line.quantity} x {money(line.unit_price)}</p></div>
            <span className="shrink-0 font-semibold tabular-nums">{money(line.line_total)}</span></div>;
        })}</div>
        <div className="space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{money(sale.subtotal)}</span></div>
          <div className="flex justify-between text-base font-semibold"><span>Total</span><span>{money(sale.grand_total)}</span></div>
          <div className="flex justify-between"><span>Cash received</span><span>{money(Number(payment?.amount ?? 0) + Number(sale.change_total))}</span></div>
          <div className="flex justify-between"><span>Change</span><span>{money(sale.change_total)}</span></div>
        </div>
        <p className="mt-8 text-center text-xs text-muted">Thank you for shopping with us.</p>
      </article>
      <div className="mt-5 space-y-5 print:hidden">
        {(returns ?? []).length ? <section className="border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold">Returns</h2>
          <p className="mt-2 text-sm text-muted">Total refunded: {money(refundTotal)}</p>
          <div className="mt-3 divide-y divide-border">{(returns ?? []).map((row) => <div key={row.id} className="flex justify-between gap-3 py-3 text-sm">
            <div><p className="font-mono text-xs font-semibold">{row.return_number}</p>
              <p className="mt-1 text-xs text-muted">{row.reason}</p></div>
            <span className="shrink-0 font-semibold tabular-nums">{money(row.refund_total)}</span>
          </div>)}</div>
        </section> : null}
        {canReturn && shift ? <section className="border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold">Return items</h2>
          <p className="mt-1 text-xs text-muted">Cash refunds are paid from the current register.</p>
          <div className="mt-5"><ReturnForm saleId={sale.id} shiftId={shift.id}
            lines={returnable} currency={currency} /></div>
        </section> : returnable.some((line) => line.remaining > 0) ? <p className="text-sm text-muted">Cash returns require an open register in the sale branch and a sale without tax or discounts.</p> : null}
      </div>
    </div>
  </section>;
}
