import { cookies } from "next/headers";
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

  const cookieStore = await cookies();
  const activeBranchCookie = cookieStore.get("active_branch_id")?.value;

  const [{ data: organization, error: organizationError }, { data: branches, error: branchError }] =
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
        .order("created_at", { ascending: true }),
    ]);

  if (organizationError || !organization) {
    throw new Error(
      `Could not load organization: ${organizationError?.message ?? "not found"}`,
    );
  }

  if (branchError) {
    throw new Error(`Could not load branch: ${branchError.message}`);
  }

  const branchList = branches ?? [];
  const activeBranch =
    branchList.find((b) => b.id === activeBranchCookie) ??
    branchList[0] ??
    null;

  return { user, organization, branch: activeBranch, branches: branchList };
}
