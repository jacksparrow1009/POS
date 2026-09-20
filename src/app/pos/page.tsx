import { PosRegister, type PosItem } from "@/app/pos/pos-register";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";

export default async function PosPage({ searchParams }: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { organization, branch } = await getCurrentWorkspace();
  const supabase = await createClient();
  if (!branch) {
    return <section className="p-6"><h1 className="text-xl font-semibold">Register</h1>
      <p className="mt-3 text-sm text-muted">Create an active branch before opening a register.</p></section>;
  }
  const [{ data: shift, error: shiftError }, { data: products, error: productsError },
    { data: variants, error: variantsError }, { data: stock, error: stockError }] = await Promise.all([
    supabase.from("register_shifts").select("id, opening_cash, opened_at, opened_by")
      .eq("organization_id", organization.id).eq("branch_id", branch.id)
      .eq("status", "open").maybeSingle(),
    supabase.from("products").select("id, name, track_inventory")
      .eq("organization_id", organization.id).eq("is_active", true).order("name"),
    supabase.from("product_variants").select("id, product_id, sku, barcode, selling_price")
      .eq("organization_id", organization.id).eq("is_active", true),
    supabase.from("branch_inventory").select("variant_id, quantity_on_hand, quantity_reserved")
      .eq("organization_id", organization.id).eq("branch_id", branch.id),
  ]);
  if (shiftError || productsError || variantsError || stockError) {
    throw new Error("Could not load the register. Please try again.");
  }
  const productById = new Map((products ?? []).map((product) => [product.id, product]));
  const stockById = new Map((stock ?? []).map((row) => [row.variant_id, row]));
  const items: PosItem[] = (variants ?? []).flatMap((variant) => {
    const product = productById.get(variant.product_id);
    if (!product) return [];
    const inventory = stockById.get(variant.id);
    return [{ id: variant.id, name: product.name, sku: variant.sku,
      barcode: variant.barcode, price: Number(variant.selling_price),
      stock: Math.max(0, Number(inventory?.quantity_on_hand ?? 0) -
        Number(inventory?.quantity_reserved ?? 0)) }];
  });
  return <PosRegister items={items} shift={shift} branchName={branch.name}
    currency={organization.currency_code.trim()} error={error} />;
}
