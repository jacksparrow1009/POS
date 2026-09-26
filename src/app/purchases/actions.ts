"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";

const purchaseSchema = z.object({
  supplierName: z.string().trim().min(2, "Supplier name required").max(100),
  variantId: z.string().uuid("Please select a product variant"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0").max(999999),
  unitCost: z.coerce.number().min(0, "Cost cannot be negative").max(999999999999.99),
  notes: z.string().trim().max(300).optional().nullable(),
});

export type PurchaseFormState = {
  error: string | null;
};

export async function recordStockPurchase(
  _prevState: PurchaseFormState,
  formData: FormData,
): Promise<PurchaseFormState> {
  const parsed = purchaseSchema.safeParse({
    supplierName: formData.get("supplierName"),
    variantId: formData.get("variantId"),
    quantity: formData.get("quantity"),
    unitCost: formData.get("unitCost"),
    notes: formData.get("notes") || null,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please provide valid purchase information.",
    };
  }

  const { organization, branch } = await getCurrentWorkspace();
  if (!branch) return { error: "No active branch available." };

  const supabase = await createClient();

  // 1. Find or create supplier
  let supplierId: string | null = null;
  const { data: existingSupplier } = await supabase
    .from("suppliers")
    .select("id")
    .eq("organization_id", organization.id)
    .ilike("name", parsed.data.supplierName)
    .maybeSingle();

  if (existingSupplier) {
    supplierId = existingSupplier.id;
  } else {
    const { data: newSupplier, error: supError } = await supabase
      .from("suppliers")
      .insert({
        organization_id: organization.id,
        name: parsed.data.supplierName,
      })
      .select("id")
      .single();

    if (supError) {
      return { error: `Could not register supplier: ${supError.message}` };
    }
    supplierId = newSupplier.id;
  }

  const purchaseNumber = `PO-${Date.now().toString().slice(-6)}`;
  const lineTotal = Number((parsed.data.quantity * parsed.data.unitCost).toFixed(2));

  // 2. Insert Purchase Order
  const { data: purchase, error: purchaseError } = await supabase
    .from("purchases")
    .insert({
      organization_id: organization.id,
      branch_id: branch.id,
      supplier_id: supplierId,
      purchase_number: purchaseNumber,
      status: "received",
      subtotal: lineTotal,
      grand_total: lineTotal,
      paid_total: lineTotal,
      notes: parsed.data.notes ?? null,
    })
    .select("id")
    .single();

  if (purchaseError || !purchase) {
    return { error: `Could not create purchase record: ${purchaseError?.message}` };
  }

  // 3. Insert Purchase Item
  const { error: itemError } = await supabase.from("purchase_items").insert({
    organization_id: organization.id,
    purchase_id: purchase.id,
    variant_id: parsed.data.variantId,
    quantity: parsed.data.quantity,
    unit_cost: parsed.data.unitCost,
    line_total: lineTotal,
  });

  if (itemError) {
    return { error: `Could not save purchase line item: ${itemError.message}` };
  }

  // 4. Update Variant Cost Price if changed
  await supabase
    .from("product_variants")
    .update({ cost_price: parsed.data.unitCost })
    .eq("id", parsed.data.variantId)
    .eq("organization_id", organization.id);

  // 5. Update Branch Inventory (upsert)
  const { data: currentInventory } = await supabase
    .from("branch_inventory")
    .select("quantity_on_hand")
    .eq("organization_id", organization.id)
    .eq("branch_id", branch.id)
    .eq("variant_id", parsed.data.variantId)
    .maybeSingle();

  const newQty = Number(currentInventory?.quantity_on_hand ?? 0) + parsed.data.quantity;

  const { error: invError } = await supabase.from("branch_inventory").upsert(
    {
      organization_id: organization.id,
      branch_id: branch.id,
      variant_id: parsed.data.variantId,
      quantity_on_hand: newQty,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "branch_id,variant_id" },
  );

  if (invError) {
    return { error: `Could not update inventory: ${invError.message}` };
  }

  // 6. Record Inventory Movement
  await supabase.from("inventory_movements").insert({
    organization_id: organization.id,
    branch_id: branch.id,
    variant_id: parsed.data.variantId,
    movement_type: "purchase",
    quantity: parsed.data.quantity,
    reference_type: "purchase",
    reference_id: purchase.id,
    unit_cost: parsed.data.unitCost,
    notes: `Received from ${parsed.data.supplierName} (${purchaseNumber})`,
  });

  revalidatePath("/purchases");
  revalidatePath("/products");
  revalidatePath("/");
  redirect("/purchases");
}
