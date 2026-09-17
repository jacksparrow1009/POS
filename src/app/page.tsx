import {
  activity,
  cart,
  metrics,
  setupSteps,
} from "@/lib/pos-demo-data";
import { signOut } from "@/app/auth/actions";
import { AppSidebar } from "@/components/app-sidebar";
import { SubmitButton } from "@/components/submit-button";
import { getCurrentWorkspace } from "@/lib/workspace";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  CircleCheck,
  LogOut,
  PackageSearch,
  ShoppingCart,
  TrendingUp,
  TriangleAlert,
  WalletCards,
} from "lucide-react";

export default async function Home() {
  const { organization, branch } = await getCurrentWorkspace();
  const supabase = await createClient();
  const [{ data: catalogProducts }, { data: catalogVariants }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, low_stock_threshold")
      .eq("organization_id", organization.id)
      .eq("is_active", true)
      .order("updated_at", { ascending: false }),
    supabase
      .from("product_variants")
      .select("id, product_id, sku")
      .eq("organization_id", organization.id)
      .eq("is_active", true),
  ]);
  const variantIds = (catalogVariants ?? []).map((variant) => variant.id);
  const { data: branchStock } = branch && variantIds.length
    ? await supabase
        .from("branch_inventory")
        .select("variant_id, quantity_on_hand, quantity_reserved")
        .eq("branch_id", branch.id)
        .in("variant_id", variantIds)
    : { data: [] };
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const discount = 320;
  const tax = 218;
  const total = subtotal - discount + tax;
  const activeBranchName = branch?.name ?? "No active branch";
  const variantByProduct = new Map(
    (catalogVariants ?? []).map((variant) => [variant.product_id, variant]),
  );
  const stockByVariant = new Map(
    (branchStock ?? []).map((stock) => [stock.variant_id, stock]),
  );
  const inventoryProducts = (catalogProducts ?? []).map((product) => {
    const variant = variantByProduct.get(product.id);
    const stock = variant ? stockByVariant.get(variant.id) : undefined;
    return {
      id: product.id,
      name: product.name,
      sku: variant?.sku ?? "No SKU",
      stock: Number(stock?.quantity_on_hand ?? 0) - Number(stock?.quantity_reserved ?? 0),
      alert: Number(product.low_stock_threshold),
    };
  });
  const lowStockCount = inventoryProducts.filter(
    (product) => product.stock <= product.alert,
  ).length;
  const dashboardMetrics = metrics.map((metric) =>
    metric.label === "Low stock"
      ? { ...metric, value: `${lowStockCount} SKUs`, delta: lowStockCount ? "Needs review" : "Stock healthy" }
      : metric,
  );
  const dashboardSetupSteps = setupSteps.map((step) =>
    step.label === "Products imported" || step.label === "Opening stock added"
      ? { ...step, done: inventoryProducts.length > 0 }
      : step,
  );
  const currentDate = new Intl.DateTimeFormat("en-PK", {
    dateStyle: "full",
    timeZone: organization.timezone,
  }).format(new Date());
  const metricIcons = [Banknote, TrendingUp, WalletCards, TriangleAlert];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[244px_minmax(0,1fr)]">
        <AppSidebar
          activeItem="Dashboard"
          branchName={activeBranchName}
          currency={organization.currency_code}
          organizationName={organization.name}
          timezone={branch?.timezone ?? organization.timezone}
        />

        <section className="min-w-0">
          <header className="flex min-h-20 flex-col gap-4 border-b border-border bg-surface px-5 py-4 md:flex-row md:items-center md:justify-between lg:px-6">
            <div>
              <p className="text-xs font-semibold uppercase text-muted">
                {currentDate}
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-normal">
                Overview
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={signOut}>
                <SubmitButton
                  className="h-10 rounded-md border border-border-strong bg-surface px-3 text-sm font-semibold text-muted-strong hover:bg-surface-subtle"
                  pendingLabel="Signing out..."
                >
                  <LogOut aria-hidden="true" size={16} />
                  Sign out
                </SubmitButton>
              </form>
              <Link className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover" href="/products">
                <ShoppingCart aria-hidden="true" size={17} />
                Manage products
              </Link>
            </div>
          </header>

          <div className="grid gap-5 p-5 lg:p-6 2xl:grid-cols-[minmax(0,1fr)_380px]">
            <section className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {dashboardMetrics.map((metric, index) => {
                  const Icon = metricIcons[index];
                  return (
                  <article
                    className="rounded-md border border-border bg-surface p-4"
                    key={metric.label}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-muted">{metric.label}</p>
                      <span className="grid size-8 place-items-center rounded-md bg-surface-subtle text-muted-strong">
                        <Icon aria-hidden="true" size={17} strokeWidth={1.8} />
                      </span>
                    </div>
                    <p className="mt-4 text-2xl font-semibold tabular-nums">{metric.value}</p>
                    <p className="mt-2 text-xs font-medium text-brand">
                      {metric.delta}
                    </p>
                  </article>
                  );
                })}
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                <article className="rounded-md border border-border bg-surface">
                  <div className="flex items-center justify-between gap-4 border-b border-border p-4">
                    <div>
                    <h2 className="text-sm font-semibold">Inventory watch</h2>
                    <p className="mt-1 text-xs text-muted">
                      Stock is tracked per branch and product variant.
                    </p>
                    </div>
                    <Link className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-hover" href="/products">
                      View all <ArrowRight aria-hidden="true" size={14} />
                    </Link>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-sm">
                      <thead className="bg-surface-subtle text-[11px] uppercase text-muted">
                        <tr>
                          <th className="px-4 py-3">SKU</th>
                          <th className="px-4 py-3">Product</th>
                          <th className="px-4 py-3">Branch</th>
                          <th className="px-4 py-3">Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryProducts.slice(0, 6).map((product) => (
                          <tr className="border-t border-border hover:bg-surface-subtle/70" key={product.id}>
                            <td className="px-4 py-3 font-mono text-xs">
                              {product.sku}
                            </td>
                            <td className="px-4 py-3 font-medium">{product.name}</td>
                            <td className="px-4 py-3 text-muted-strong">
                              {activeBranchName}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded px-2 py-1 text-xs font-semibold ${
                                  product.stock <= product.alert
                                    ? "bg-warning-soft text-warning"
                                    : "bg-success-soft text-success"
                                }`}
                              >
                                {product.stock} on hand
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {inventoryProducts.length === 0 ? (
                    <div className="border-t border-border px-4 py-10 text-center text-sm text-muted">
                      <PackageSearch aria-hidden="true" className="mx-auto mb-2" size={24} />
                      No products yet. <Link className="font-semibold text-brand" href="/products">Add your first product</Link>.
                    </div>
                  ) : null}
                </article>

                <article className="rounded-md border border-border bg-surface p-4">
                  <h2 className="text-sm font-semibold">Setup progress</h2>
                  <div className="mt-4 space-y-3">
                    {dashboardSetupSteps.map(({ label, done }) => (
                      <div className="flex items-center gap-3" key={String(label)}>
                        <CircleCheck aria-hidden="true" className={done ? "text-success" : "text-border-strong"} size={17} />
                        <span className={done ? "text-sm" : "text-sm text-muted"}>{label}</span>
                      </div>
                    ))}
                  </div>
                </article>
              </div>

              <article className="rounded-md border border-border bg-surface p-4">
                <h2 className="text-sm font-semibold">Recent activity</h2>
                <div className="mt-3 divide-y divide-border">
                  {activity.map((item) => (
                    <p className="py-3 text-sm text-muted-strong" key={item}>
                      {item}
                    </p>
                  ))}
                </div>
              </article>
            </section>

            <aside className="self-start rounded-md border border-border bg-surface p-4 2xl:sticky 2xl:top-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Register preview</h2>
                  <p className="mt-1 text-xs text-muted">Shift 02 / Counter 1</p>
                </div>
                <span className="rounded bg-surface-subtle px-2 py-1 text-xs font-semibold text-muted-strong">
                  Preview
                </span>
              </div>

              <label className="mt-5 block">
                <span className="text-xs font-semibold uppercase text-muted">
                  Barcode or search
                </span>
                <input
                  className="mt-2 h-11 w-full rounded-md border border-border bg-surface-subtle px-3 text-sm text-muted"
                  disabled
                  placeholder="Scan barcode or type product name"
                />
              </label>

              <div className="mt-5 space-y-3">
                {cart.map((item) => (
                  <div
                    className="flex items-center justify-between rounded-md border border-border p-3"
                    key={item.name}
                  >
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="mt-1 text-xs text-muted">Qty {item.qty}</p>
                    </div>
                    <p className="text-sm font-semibold">
                      PKR {item.price.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between text-muted-strong">
                  <span>Subtotal</span>
                  <span>PKR {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-strong">
                  <span>Discount</span>
                  <span>-PKR {discount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-strong">
                  <span>Tax</span>
                  <span>PKR {tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-3 text-lg font-semibold">
                  <span>Total</span>
                  <span>PKR {total.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                {["Cash", "Card", "Bank"].map((method) => (
                  <button
                    className="h-10 rounded-md border border-border bg-surface-subtle text-sm font-semibold text-muted"
                    disabled
                    key={method}
                  >
                    {method}
                  </button>
                ))}
              </div>
              <button className="mt-3 h-11 w-full rounded-md bg-brand text-sm font-semibold text-white opacity-60" disabled>
                POS coming next
              </button>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
