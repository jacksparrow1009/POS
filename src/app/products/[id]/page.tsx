import Link from "next/link";
import { notFound } from "next/navigation";
import { adjustStock, setProductStatus, updateProduct } from "@/app/products/actions";
import { SubmitButton } from "@/components/submit-button";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";

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
    <main className="min-h-screen bg-[#f6f7f9] text-[#172026]">
      <header className="border-b border-[#dfe3e8] bg-white px-5 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <Link className="text-sm font-semibold text-[#0b5c5a]" href="/products">Products</Link>
            <h1 className="mt-1 text-2xl font-semibold">{product.name}</h1>
            <p className="mt-1 text-sm text-[#697680]">{branch?.name ?? "No active branch"} / {variant.sku ?? "No SKU"}</p>
          </div>
          <span className={`rounded px-3 py-1.5 text-xs font-semibold ${product.is_active ? "bg-[#e8f4ee] text-[#0f6848]" : "bg-[#eceff1] text-[#53606b]"}`}>
            {product.is_active ? "Active" : "Archived"}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl p-5">
        {notices.error ? (
          <p className="mb-5 rounded-md border border-[#ffd8a8] bg-[#fff8ef] p-3 text-sm text-[#8a5300]">{notices.error}</p>
        ) : null}
        {successMessage ? (
          <p className="mb-5 rounded-md border border-[#b7dfce] bg-[#edf8f3] p-3 text-sm text-[#0f6848]">{successMessage}</p>
        ) : null}

        <section className="mb-5 grid gap-4 sm:grid-cols-3">
          <Metric label="On hand" value={onHand.toLocaleString()} />
          <Metric label="Reserved" value={reserved.toLocaleString()} />
          <Metric label="Available" value={available.toLocaleString()} warning={available <= Number(product.low_stock_threshold)} />
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-md border border-[#dfe3e8] bg-white p-5">
            <h2 className="text-base font-semibold">Product details</h2>
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
              <SubmitButton className="h-11 w-full rounded-md bg-[#0b5c5a] text-sm font-semibold text-white" pendingLabel="Saving changes...">
                Save changes
              </SubmitButton>
            </form>
          </section>

          <div className="space-y-5">
            <section className="rounded-md border border-[#dfe3e8] bg-white p-5">
              <h2 className="text-base font-semibold">Adjust stock</h2>
              <p className="mt-1 text-sm text-[#697680]">Use a positive number to add stock or a negative number to remove it.</p>
              <form action={adjustStock} className="mt-5 space-y-4">
                <input name="productId" type="hidden" value={product.id} />
                <input name="variantId" type="hidden" value={variant.id} />
                <Field label="Quantity change" name="adjustment" placeholder="10 or -2" required step="0.001" type="number" />
                <Field label="Reason" maxLength={240} name="notes" placeholder="Cycle count correction" />
                <SubmitButton className="h-11 w-full rounded-md border border-[#0b5c5a] bg-white text-sm font-semibold text-[#0b5c5a]" pendingLabel="Updating stock...">
                  Record adjustment
                </SubmitButton>
              </form>
            </section>

            <section className="rounded-md border border-[#dfe3e8] bg-white p-5">
              <h2 className="text-base font-semibold">Selling status</h2>
              <p className="mt-1 text-sm text-[#697680]">Archived products remain in reports and stock history.</p>
              <form action={setProductStatus} className="mt-4">
                <input name="productId" type="hidden" value={product.id} />
                <input name="isActive" type="hidden" value={String(!product.is_active)} />
                <SubmitButton className="h-10 rounded-md border border-[#cfd6dd] bg-white px-4 text-sm font-semibold" pendingLabel={product.is_active ? "Archiving..." : "Restoring..."}>
                  {product.is_active ? "Archive product" : "Restore product"}
                </SubmitButton>
              </form>
            </section>
          </div>
        </div>

        <section className="mt-5 overflow-hidden rounded-md border border-[#dfe3e8] bg-white">
          <div className="border-b border-[#edf0f2] p-4">
            <h2 className="text-base font-semibold">Recent stock movements</h2>
          </div>
          {movements.length === 0 ? (
            <p className="p-5 text-sm text-[#697680]">No stock movements recorded yet.</p>
          ) : (
            <div className="divide-y divide-[#edf0f2]">
              {movements.map((movement) => (
                <div className="flex items-center justify-between gap-4 px-4 py-3" key={movement.id}>
                  <div>
                    <p className="text-sm font-medium">{movement.notes ?? movement.movement_type.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-xs text-[#697680]">{new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short", timeZone: organization.timezone }).format(new Date(movement.created_at))}</p>
                  </div>
                  <span className={`text-sm font-semibold ${Number(movement.quantity) >= 0 ? "text-[#0f6848]" : "text-[#a13d32]"}`}>
                    {Number(movement.quantity) > 0 ? "+" : ""}{Number(movement.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
  return (
    <article className="rounded-md border border-[#dfe3e8] bg-white p-4">
      <p className="text-sm text-[#697680]">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${warning ? "text-[#935400]" : ""}`}>{value}</p>
    </article>
  );
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string };

function Field({ label, ...props }: FieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input className="mt-2 h-11 w-full rounded-md border border-[#cfd6dd] px-3 text-sm outline-none focus:border-[#0b5c5a]" {...props} />
    </label>
  );
}
