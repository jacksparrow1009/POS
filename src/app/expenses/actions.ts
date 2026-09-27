"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";

const expenseSchema = z.object({
  category: z.string().trim().min(2).max(80),
  amount: z.coerce.number().positive().max(999999999999.99),
  paymentMethod: z.string().trim().min(2).max(40).default("cash"),
  notes: z.string().trim().max(240).default(""),
  spentAt: z.string().trim().optional(),
});

export async function recordExpense(formData: FormData) {
  const parsed = expenseSchema.safeParse({
    category: formData.get("category"),
    amount: formData.get("amount"),
    paymentMethod: formData.get("paymentMethod") || "cash",
    notes: formData.get("notes") || "",
    spentAt: formData.get("spentAt") || undefined,
  });

  if (!parsed.success) {
    redirect(`/expenses?error=${encodeURIComponent("Check the expense details and try again.")}`);
  }

  const { organization, branch } = await getCurrentWorkspace();
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_expense", {
    p_organization_id: organization.id,
    p_branch_id: branch?.id ?? null,
    p_category: parsed.data.category,
    p_amount: parsed.data.amount,
    p_payment_method: parsed.data.paymentMethod,
    p_notes: parsed.data.notes,
    p_spent_at: parsed.data.spentAt ? new Date(parsed.data.spentAt).toISOString() : null,
  });

  if (error) {
    redirect(`/expenses?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/expenses");
  revalidatePath("/reports");
  revalidatePath("/");
  redirect("/expenses?created=1");
}
