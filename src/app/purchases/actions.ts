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
  const { error } = await supabase.rpc("receive_stock_purchase", {
    p_organization_id: organization.id,
    p_branch_id: branch.id,
    p_supplier_name: parsed.data.supplierName,
    p_variant_id: parsed.data.variantId,
    p_quantity: parsed.data.quantity,
    p_unit_cost: parsed.data.unitCost,
    p_notes: parsed.data.notes ?? "",
  });
  if (error) return { error: `Could not receive stock: ${error.message}` };

  revalidatePath("/purchases");
  revalidatePath("/products");
  revalidatePath("/");
  redirect("/purchases");
}
