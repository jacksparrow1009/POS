"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";

const money = z.coerce.number().finite().min(0).max(999999999999.99);
const checkoutSchema = z.object({
  shiftId: z.string().uuid(),
  checkoutKey: z.string().uuid(),
  cashReceived: money,
  items: z.array(z.object({
    variant_id: z.string().uuid(),
    quantity: z.number().int().min(1).max(999999),
  })).min(1).max(100),
});

export type CheckoutState = { error: string | null };

function saleError(message: string): string {
  if (message.includes("Insufficient stock")) return "Stock changed. Review the cart quantities and try again.";
  if (message.includes("Open register not found")) return "The register is closed. Open a register to continue.";
  if (message.includes("no longer available")) return "A product is no longer available. Remove it from the cart.";
  if (message.includes("Cash received")) return "Cash received must cover the total.";
  return "Could not complete the sale. Please check the cart and try again.";
}

export async function openRegister(formData: FormData) {
  const amount = money.safeParse(formData.get("openingCash"));
  if (!amount.success) redirect("/pos?error=Enter%20a%20valid%20opening%20cash%20amount.");
  const { organization, branch } = await getCurrentWorkspace();
  if (!branch) redirect("/pos?error=No%20active%20branch%20is%20available.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("open_register", {
    p_organization_id: organization.id,
    p_branch_id: branch.id,
    p_opening_cash: amount.data,
  });
  if (error) redirect("/pos?error=Could%20not%20open%20the%20register.");
  revalidatePath("/pos");
  redirect("/pos");
}

export async function closeRegister(formData: FormData) {
  const parsed = z.object({ shiftId: z.string().uuid(), closingCash: money }).safeParse({
    shiftId: formData.get("shiftId"),
    closingCash: formData.get("closingCash"),
  });
  if (!parsed.success) redirect("/pos?error=Enter%20a%20valid%20closing%20cash%20amount.");
  const { organization, branch } = await getCurrentWorkspace();
  if (!branch) redirect("/pos?error=No%20active%20branch%20is%20available.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("close_register", {
    p_organization_id: organization.id,
    p_branch_id: branch.id,
    p_shift_id: parsed.data.shiftId,
    p_closing_cash: parsed.data.closingCash,
  });
  if (error) redirect("/pos?error=Could%20not%20close%20the%20register.");
  revalidatePath("/pos");
  redirect("/pos");
}

export async function completeCashSale(
  _previousState: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  let items: unknown;
  try { items = JSON.parse(String(formData.get("items"))); }
  catch { return { error: "The cart is invalid. Please review it and try again." }; }
  const parsed = checkoutSchema.safeParse({
    shiftId: formData.get("shiftId"),
    checkoutKey: formData.get("checkoutKey"),
    cashReceived: formData.get("cashReceived"),
    items,
  });
  if (!parsed.success) return { error: "Review the cart and cash received, then try again." };

  const { organization, branch } = await getCurrentWorkspace();
  if (!branch) return { error: "No active branch is available." };
  const supabase = await createClient();
  const { data: saleId, error } = await supabase.rpc("complete_cash_sale", {
    p_organization_id: organization.id,
    p_branch_id: branch.id,
    p_shift_id: parsed.data.shiftId,
    p_checkout_key: parsed.data.checkoutKey,
    p_items: parsed.data.items,
    p_cash_received: parsed.data.cashReceived,
  });
  if (error || !saleId) return { error: saleError(error?.message ?? "") };
  revalidatePath("/pos");
  revalidatePath("/products");
  revalidatePath("/");
  redirect(`/pos/receipt/${saleId}`);
}
