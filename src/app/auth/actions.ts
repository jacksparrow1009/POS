"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

type WorkspaceRpcClient = {
  rpc(
    name: "create_retail_workspace",
    args: {
      organization_name: string;
      organization_slug: string;
      branch_name: string;
      branch_code: string;
      currency_code: string;
      timezone: string;
    },
  ): Promise<{ error: { message: string } | null }>;
};

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const workspaceSchema = z.object({
  organizationName: z.string().min(2).max(80),
  organizationSlug: z
    .string()
    .min(2)
    .max(48)
    .regex(/^[a-z0-9-]+$/),
  branchName: z.string().min(2).max(80),
  branchCode: z.string().min(2).max(12),
  currencyCode: z.string().length(3).default("PKR"),
  timezone: z.string().min(2).default("Asia/Karachi"),
});

export async function signIn(formData: FormData) {
  const values = credentialsSchema.parse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword(values);

  if (error) {
    redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}

export async function signUp(formData: FormData) {
  const values = credentialsSchema.parse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp(values);

  if (error) {
    redirect(`/signup?message=${encodeURIComponent(error.message)}`);
  }

  redirect("/onboarding");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createWorkspace(formData: FormData) {
  const values = workspaceSchema.parse({
    organizationName: formData.get("organizationName"),
    organizationSlug: formData.get("organizationSlug"),
    branchName: formData.get("branchName"),
    branchCode: formData.get("branchCode"),
    currencyCode: formData.get("currencyCode") || "PKR",
    timezone: formData.get("timezone") || "Asia/Karachi",
  });
  const supabase = await createClient();

  const workspaceClient = supabase as unknown as WorkspaceRpcClient;
  const { error } = await workspaceClient.rpc("create_retail_workspace", {
    organization_name: values.organizationName,
    organization_slug: values.organizationSlug,
    branch_name: values.branchName,
    branch_code: values.branchCode.toUpperCase(),
    currency_code: values.currencyCode.toUpperCase(),
    timezone: values.timezone,
  });

  if (error) {
    redirect(`/onboarding?message=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}
