import Link from "next/link";
import { notFound } from "next/navigation";
import { adjustStock, setProductStatus, updateProduct } from "@/app/products/actions";
import { SubmitButton } from "@/components/submit-button";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";
import { ArrowLeft, Archive, Boxes, CheckCircle2, History, Package, RotateCcw } from "lucide-react";

type ProductDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    adjusted?: string;
    error?: string;
    status?: string;
    updated?: string;
  }>;
};

export default async function ProductDetailPage({
  params,
  searchParams,
}: ProductDetailPageProps) {
  const { id } = await params;
  const notices = await searchParams;
  const { organization, branch } = await getCurrentWorkspace();
  const supabase = await createClient();

  const [{ data: product, error: productError }, { data: variant, error: variantError }] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, name, low_stock_threshold, is_active")
        .eq("organization_id", organization.id)
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("product_variants")
        .select("id, product_id, sku, barcode, cost_price, selling_price, is_active")
        .eq("organization_id", organization.id)
        .eq("product_id", id)
        .limit(1)
        .maybeSingle(),
    ]);

  if (productError || variantError) {
    throw new Error(productError?.message ?? variantError?.message);
  }
  if (!product || !variant) {
    notFound();
  }

  const [{ data: inventory, error: inventoryError }, { data: movements, error: movementsError }] =
    await Promise.all([
      branch
        ? supabase
            .from("branch_inventory")
            .select("quantity_on_hand, quantity_reserved")
            .eq("branch_id", branch.id)
            .eq("variant_id", variant.id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from("inventory_movements")
        .select("id, movement_type, quantity, notes, created_at")
        .eq("organization_id", organization.id)
        .eq("variant_id", variant.id)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  if (inventoryError || movementsError) {
    throw new Error(inventoryError?.message ?? movementsError?.message);
  }

  const onHand = Number(inventory?.quantity_on_hand ?? 0);
  const reserved = Number(inventory?.quantity_reserved ?? 0);
  const available = onHand - reserved;
  const currency = organization.currency_code.trim();
  const successMessage = notices.updated
    ? "Product details updated."
    : notices.adjusted
      ? "Stock adjustment recorded."
      : notices.status
        ? `Product ${product.is_active ? "restored" : "archived"}.`
        : null;

  return (
        <section className="min-w-0">
      <header className="border-b border-border bg-surface px-5 py-4 lg:px-6">
        <div className="flex min-h-12 items-center justify-between gap-4">
          <div>
            <Link className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-brand" href="/products">
              <ArrowLeft aria-hidden="true" size={14} /> Products
            </Link>
            <h1 className="mt-1 text-xl font-semibold">{product.name}</h1>
            <p className="mt-1 text-sm text-muted">{branch?.name ?? "No active branch"} / {variant.sku ?? "No SKU"}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold ${product.is_active ? "bg-success-soft text-success" : "bg-surface-subtle text-muted-strong"}`}>
            <span className="size-1.5 rounded-full bg-current" />
            {product.is_active ? "Active" : "Archived"}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl p-5 lg:p-6">
        {notices.error ? (
          <p className="mb-5 rounded-md border border-danger/20 bg-danger-soft p-3 text-sm text-danger">{notices.error}</p>
        ) : null}
        {successMessage ? (
          <p className="mb-5 flex items-center gap-2 rounded-md border border-success/20 bg-success-soft p-3 text-sm font-medium text-success"><CheckCircle2 aria-hidden="true" size={17} />{successMessage}</p>
        ) : null}

        <section className="mb-5 grid gap-4 sm:grid-cols-3">
          <Metric label="On hand" value={onHand.toLocaleString()} />
          <Metric label="Reserved" value={reserved.toLocaleString()} />
          <Metric label="Available" value={available.toLocaleString()} warning={available <= Number(product.low_stock_threshold)} />
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-md border border-border bg-surface p-5">
            <div className="flex items-center gap-2"><Package aria-hidden="true" className="text-muted" size={18} /><h2 className="text-sm font-semibold">Product details</h2></div>
            <form action={updateProduct} className="mt-5 space-y-4">
              <input name="productId" type="hidden" value={product.id} />
              <input name="variantId" type="hidden" value={variant.id} />
              <Field defaultValue={product.name} label="Product name" name="name" required />
              <div className="grid grid-cols-2 gap-3">
                <Field defaultValue={variant.sku ?? ""} label="SKU" name="sku" />
                <Field defaultValue={variant.barcode ?? ""} label="Barcode" name="barcode" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field defaultValue={variant.cost_price} label={`Cost (${currency})`} min="0" name="costPrice" required step="0.01" type="number" />
                <Field defaultValue={variant.selling_price} label={`Price (${currency})`} min="0" name="sellingPrice" required step="0.01" type="number" />
              </div>
              <Field defaultValue={product.low_stock_threshold} label="Low-stock alert" min="0" name="lowStockThreshold" required step="0.001" type="number" />
              <SubmitButton className="h-11 w-full rounded-md bg-brand text-sm font-semibold text-white hover:bg-brand-hover" pendingLabel="Saving changes...">
                Save changes
              </SubmitButton>
            </form>
          </section>

          <div className="space-y-5">
            <section className="rounded-md border border-border bg-surface p-5">
              <div className="flex items-center gap-2"><Boxes aria-hidden="true" className="text-muted" size={18} /><h2 className="text-sm font-semibold">Adjust stock</h2></div>
              <p className="mt-1 text-sm text-muted">Use a positive number to add stock or a negative number to remove it.</p>
              <form action={adjustStock} className="mt-5 space-y-4">
                <input name="productId" type="hidden" value={product.id} />
                <input name="variantId" type="hidden" value={variant.id} />
                <Field label="Quantity change" name="adjustment" placeholder="10 or -2" required step="0.001" type="number" />
                <Field label="Reason" maxLength={240} name="notes" placeholder="Cycle count correction" />
                <SubmitButton className="h-11 w-full rounded-md border border-brand bg-surface text-sm font-semibold text-brand hover:bg-brand-soft" pendingLabel="Updating stock...">
                  Record adjustment
                </SubmitButton>
              </form>
            </section>

            <section className="rounded-md border border-border bg-surface p-5">
              <h2 className="text-sm font-semibold">Selling status</h2>
              <p className="mt-1 text-sm text-muted">Archived products remain in reports and stock history.</p>
              <form action={setProductStatus} className="mt-4">
                <input name="productId" type="hidden" value={product.id} />
                <input name="isActive" type="hidden" value={String(!product.is_active)} />
                <SubmitButton className="h-10 rounded-md border border-border-strong bg-surface px-4 text-sm font-semibold text-muted-strong hover:bg-surface-subtle" pendingLabel={product.is_active ? "Archiving..." : "Restoring..."}>
                  {product.is_active ? <Archive aria-hidden="true" size={16} /> : <RotateCcw aria-hidden="true" size={16} />}
                  {product.is_active ? "Archive product" : "Restore product"}
                </SubmitButton>
              </form>
            </section>
          </div>
        </div>

        <section className="mt-5 overflow-hidden rounded-md border border-border bg-surface">
          <div className="flex items-center gap-2 border-b border-border p-4">
            <History aria-hidden="true" className="text-muted" size={18} />
            <h2 className="text-sm font-semibold">Recent stock movements</h2>
          </div>
          {movements.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted">No stock movements recorded yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {movements.map((movement) => (
                <div className="flex items-center justify-between gap-4 px-4 py-3" key={movement.id}>
                  <div>
                    <p className="text-sm font-medium">{movement.notes ?? movement.movement_type.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-xs text-muted">{new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short", timeZone: organization.timezone }).format(new Date(movement.created_at))}</p>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${Number(movement.quantity) >= 0 ? "text-success" : "text-danger"}`}>
                    {Number(movement.quantity) > 0 ? "+" : ""}{Number(movement.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
        </section>
  );
}

function Metric({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
  return (
    <article className="rounded-md border border-border bg-surface p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${warning ? "text-warning" : ""}`}>{value}</p>
    </article>
  );
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string };

function Field({ label, ...props }: FieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input className="mt-2 h-11 w-full rounded-md border border-border-strong bg-surface px-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/10" {...props} />
    </label>
  );
}
