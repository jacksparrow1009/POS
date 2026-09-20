"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";

export type ReturnState = { error: string | null };

const returnSchema = z.object({
  saleId: z.string().uuid(),
  shiftId: z.string().uuid(),
  returnKey: z.string().uuid(),
  reason: z.string().trim().min(3).max(240),
  confirmed: z.literal("on"),
  items: z.array(z.object({ sale_item_id: z.string().uuid(),
    quantity: z.number().positive().max(999999) })).min(1).max(100),
});

export async function returnCashSale(_previous: ReturnState, formData: FormData): Promise<ReturnState> {
  const requestedItems = Array.from(formData.entries()).filter(([key]) => key.startsWith("return_")).map(([key, value]) => ({
    sale_item_id: key.slice(7), quantity: Number(value),
  }));
  if (requestedItems.some((item) => !Number.isFinite(item.quantity) || item.quantity < 0)) {
    return { error: "Return quantities must be valid, non-negative numbers." };
  }
  const items = requestedItems.filter((item) => item.quantity > 0);
  const parsed = returnSchema.safeParse({
    saleId: formData.get("saleId"), shiftId: formData.get("shiftId"),
    returnKey: formData.get("returnKey"), reason: formData.get("reason"),
    confirmed: formData.get("confirmed"), items,
  });
  if (!parsed.success) return { error: "Select items, enter a reason, and confirm the cash refund." };
  const { organization, branch } = await getCurrentWorkspace();
  if (!branch) return { error: "No active branch is available." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("return_cash_sale", {
    p_organization_id: organization.id,
    p_branch_id: branch.id,
    p_shift_id: parsed.data.shiftId,
    p_sale_id: parsed.data.saleId,
    p_return_key: parsed.data.returnKey,
    p_items: parsed.data.items,
    p_reason: parsed.data.reason,
  });
  if (error) {
    if (error.message.includes("Return quantity exceeds")) return { error: "Some items were already returned. Refresh the receipt and review quantities." };
    if (error.message.includes("Open register not found")) return { error: "Open a register before issuing a cash refund." };
    return { error: "Could not process the return. Review the items and try again." };
  }
  revalidatePath(`/pos/receipt/${parsed.data.saleId}`);
  revalidatePath("/pos/sales");
  revalidatePath("/pos");
  revalidatePath("/products");
  revalidatePath("/");
  redirect(`/pos/receipt/${parsed.data.saleId}?returned=1`);
}
