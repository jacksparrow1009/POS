"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";

const settingsSchema = z.object({
  organizationName: z.string().trim().min(2, "Business name is required").max(100),
  currencyCode: z.string().trim().min(3).max(3),
  timezone: z.string().trim().min(2).max(50),
  branchName: z.string().trim().min(2, "Branch name is required").max(100),
  branchCode: z.string().trim().min(1, "Branch code is required").max(12),
});

export type SettingsFormState = {
  error: string | null;
  success: string | null;
};

export async function updateStoreSettings(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const parsed = settingsSchema.safeParse({
    organizationName: formData.get("organizationName"),
    currencyCode: formData.get("currencyCode"),
    timezone: formData.get("timezone"),
    branchName: formData.get("branchName"),
    branchCode: formData.get("branchCode"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please enter valid store settings.",
      success: null,
    };
  }

  const { organization, branch } = await getCurrentWorkspace();
  const supabase = await createClient();

  // 1. Update Organization
  const { error: orgError } = await supabase
    .from("organizations")
    .update({
      name: parsed.data.organizationName,
      currency_code: parsed.data.currencyCode,
      timezone: parsed.data.timezone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", organization.id);

  if (orgError) {
    return { error: `Could not update store: ${orgError.message}`, success: null };
  }

  // 2. Update Branch
  if (branch) {
    const { error: branchError } = await supabase
      .from("branches")
      .update({
        name: parsed.data.branchName,
        code: parsed.data.branchCode,
        timezone: parsed.data.timezone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", branch.id)
      .eq("organization_id", organization.id);

    if (branchError) {
      return { error: `Could not update branch: ${branchError.message}`, success: null };
    }
  }

  revalidatePath("/settings");
  revalidatePath("/");
  revalidatePath("/pos");
  revalidatePath("/products");

  return { error: null, success: "Store settings updated successfully." };
}
