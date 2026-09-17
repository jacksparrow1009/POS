import { CreateProductDialog } from "@/app/products/create-product-dialog";
import { ProductCatalog, type CatalogItem } from "@/app/products/product-catalog";
import { AppSidebar } from "@/components/app-sidebar";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";

type ProductsPageProps = {
  searchParams: Promise<{ created?: string; error?: string }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { created, error: message } = await searchParams;
  const { organization, branch } = await getCurrentWorkspace();
  const supabase = await createClient();

  const [{ data: products, error: productsError }, { data: variants, error: variantsError }] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, name, low_stock_threshold, is_active, created_at")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("product_variants")
        .select("id, product_id, sku, barcode, cost_price, selling_price")
        .eq("organization_id", organization.id),
    ]);

  if (productsError || variantsError) {
    throw new Error(productsError?.message ?? variantsError?.message);
  }

  const variantIds = variants.map((variant) => variant.id);
  const inventoryResult = branch && variantIds.length
    ? await supabase
        .from("branch_inventory")
        .select("variant_id, quantity_on_hand, quantity_reserved")
        .eq("branch_id", branch.id)
        .in("variant_id", variantIds)
    : { data: [], error: null };

  if (inventoryResult.error) {
    throw new Error(inventoryResult.error.message);
  }

  const variantsByProduct = new Map(variants.map((variant) => [variant.product_id, variant]));
  const inventoryByVariant = new Map(
    (inventoryResult.data ?? []).map((inventory) => [inventory.variant_id, inventory]),
  );
  const currency = organization.currency_code.trim();
  const catalogItems: CatalogItem[] = products.map((product) => {
    const variant = variantsByProduct.get(product.id);
    const inventory = variant ? inventoryByVariant.get(variant.id) : undefined;

    return {
      id: product.id,
      name: product.name,
      sku: variant?.sku ?? null,
      barcode: variant?.barcode ?? null,
      costPrice: Number(variant?.cost_price ?? 0),
      sellingPrice: Number(variant?.selling_price ?? 0),
      available:
        Number(inventory?.quantity_on_hand ?? 0) -
        Number(inventory?.quantity_reserved ?? 0),
      lowStockThreshold: Number(product.low_stock_threshold),
      isActive: product.is_active,
    };
  });

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-[#172026]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[244px_1fr]">
        <AppSidebar
          activeItem="Products"
          branchName={branch?.name ?? "No active branch"}
          currency={currency}
          organizationName={organization.name}
          timezone={branch?.timezone ?? organization.timezone}
        />

        <section className="min-w-0">
          <header className="flex flex-col gap-4 border-b border-[#dfe3e8] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Products</h1>
              <p className="mt-1 text-sm text-[#697680]">
                {products.length} products / Prices in {currency}
              </p>
            </div>
            <CreateProductDialog error={message} />
          </header>

          {created ? (
            <div className="px-5 pt-5">
              <p className="rounded-md border border-[#b7dfce] bg-[#edf8f3] p-3 text-sm text-[#0f6848]">
                Product created successfully.
              </p>
            </div>
          ) : null}

          <div className="p-5">
            <ProductCatalog
              branchName={branch?.name ?? "your active branch"}
              currency={currency}
              items={catalogItems}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
