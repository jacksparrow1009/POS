"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function switchBranch(formData: FormData) {
  const branchId = formData.get("branchId")?.toString();
  if (!branchId) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set("active_branch_id", branchId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
}
