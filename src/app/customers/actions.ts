"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";

const customerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().trim().max(30).optional().nullable(),
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .optional()
    .or(z.literal(""))
    .nullable(),
  address: z.string().trim().max(200).optional().nullable(),
});

export type CustomerFormState = {
  error: string | null;
};

export async function createCustomer(
  _prevState: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const parsed = customerSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || null,
    email: formData.get("email") || null,
    address: formData.get("address") || null,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please provide valid customer details.",
    };
  }

  const { organization } = await getCurrentWorkspace();
  const supabase = await createClient();

  const { error } = await supabase.from("customers").insert({
    organization_id: organization.id,
    name: parsed.data.name,
    phone: parsed.data.phone ?? null,
    email: parsed.data.email ?? null,
    address: parsed.data.address ?? null,
  });

  if (error) {
    return { error: `Could not create customer: ${error.message}` };
  }

  revalidatePath("/customers");
  redirect("/customers");
}

const paymentSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID"),
  amount: z.coerce.number().positive("Payment amount must be greater than 0").max(999999999999.99),
  method: z.string().trim().default("cash"),
  notes: z.string().trim().max(200).optional().nullable(),
});

export type PaymentFormState = {
  error: string | null;
  success?: string | null;
};

export async function recordCustomerPayment(
  _prevState: PaymentFormState,
  formData: FormData,
): Promise<PaymentFormState> {
  const parsed = paymentSchema.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    method: formData.get("method") || "cash",
    notes: formData.get("notes") || null,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please enter a valid payment amount.",
    };
  }

  const { organization } = await getCurrentWorkspace();
  const supabase = await createClient();

  // Find all unpaid completed sales for this customer, ordered FIFO
  const { data: unpaidSales, error: fetchError } = await supabase
    .from("sales")
    .select("id, grand_total, paid_total")
    .eq("organization_id", organization.id)
    .eq("customer_id", parsed.data.customerId)
    .order("created_at", { ascending: true });

  if (fetchError) {
    return { error: `Could not retrieve customer account: ${fetchError.message}` };
  }

  let remainingToApply = parsed.data.amount;
  const salesWithDebt = (unpaidSales ?? []).filter(
    (s) => Number(s.grand_total) > Number(s.paid_total),
  );

  if (salesWithDebt.length === 0) {
    return { error: "This customer has no outstanding debt to settle." };
  }

  for (const sale of salesWithDebt) {
    if (remainingToApply <= 0) break;

    const currentDebt = Number(sale.grand_total) - Number(sale.paid_total);
    const paymentAllocation = Math.min(currentDebt, remainingToApply);
    const newPaidTotal = Number((Number(sale.paid_total) + paymentAllocation).toFixed(2));

    // Update sale paid_total
    await supabase
      .from("sales")
      .update({ paid_total: newPaidTotal, updated_at: new Date().toISOString() })
      .eq("id", sale.id)
      .eq("organization_id", organization.id);

    // Record payment line
    await supabase.from("sale_payments").insert({
      organization_id: organization.id,
      sale_id: sale.id,
      method: parsed.data.method,
      amount: paymentAllocation,
      reference_number: parsed.data.notes || "Khata debt settlement (Vasooli)",
    });

    remainingToApply = Number((remainingToApply - paymentAllocation).toFixed(2));
  }

  revalidatePath(`/customers/${parsed.data.customerId}`);
  revalidatePath("/customers");
  revalidatePath("/reports");
  revalidatePath("/");

  return { error: null, success: "Payment recorded successfully." };
}

