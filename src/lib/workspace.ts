import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentWorkspace() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    throw new Error(`Could not load workspace membership: ${membershipError.message}`);
  }

  if (!membership) {
    redirect("/onboarding");
  }

  const [{ data: organization, error: organizationError }, { data: branch, error: branchError }] =
    await Promise.all([
      supabase
        .from("organizations")
        .select("id, name, slug, currency_code, timezone, status")
        .eq("id", membership.organization_id)
        .single(),
      supabase
        .from("branches")
        .select("id, name, code, timezone")
        .eq("organization_id", membership.organization_id)
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

  if (organizationError || !organization) {
    throw new Error(
      `Could not load organization: ${organizationError?.message ?? "not found"}`,
    );
  }

  if (branchError) {
    throw new Error(`Could not load branch: ${branchError.message}`);
  }

  return { user, organization, branch };
}
