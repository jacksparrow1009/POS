"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";

const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  sku: z.string().trim().max(64).default(""),
  barcode: z.string().trim().max(128).default(""),
  costPrice: z.coerce.number().min(0).default(0),
  sellingPrice: z.coerce.number().min(0),
  openingStock: z.coerce.number().min(0).default(0),
  lowStockThreshold: z.coerce.number().min(0).default(0),
});

const identifiersSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid(),
});

function productRedirect(
  productId: string,
  key: "updated" | "adjusted" | "status",
  error?: string,
): never {
  const query = error
    ? `error=${encodeURIComponent(error)}`
    : `${key}=1`;
  redirect(`/products/${productId}?${query}`);
}

export async function createProduct(formData: FormData) {
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku") ?? "",
    barcode: formData.get("barcode") ?? "",
    costPrice: formData.get("costPrice"),
    sellingPrice: formData.get("sellingPrice"),
    openingStock: formData.get("openingStock"),
    lowStockThreshold: formData.get("lowStockThreshold"),
  });

  if (!parsed.success) {
    redirect(`/products?error=${encodeURIComponent("Check the product details and try again.")}`);
  }

  const { organization, branch } = await getCurrentWorkspace();

  if (!branch) {
    redirect(`/products?error=${encodeURIComponent("Create an active branch before adding products.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_product_with_inventory", {
    p_organization_id: organization.id,
    p_branch_id: branch.id,
    p_name: parsed.data.name,
    p_sku: parsed.data.sku,
    p_barcode: parsed.data.barcode,
    p_cost_price: parsed.data.costPrice,
    p_selling_price: parsed.data.sellingPrice,
    p_opening_stock: parsed.data.openingStock,
    p_low_stock_threshold: parsed.data.lowStockThreshold,
  });

  if (error) {
    const message = error.message.includes("duplicate key")
      ? "That SKU or barcode is already in use."
      : error.message;
    redirect(`/products?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/products");
  revalidatePath("/");
  redirect("/products?created=1");
}

export async function updateProduct(formData: FormData) {
  const ids = identifiersSchema.safeParse({
    productId: formData.get("productId"),
    variantId: formData.get("variantId"),
  });
  const values = productSchema.omit({ openingStock: true }).safeParse({
    name: formData.get("name"),
    sku: formData.get("sku") ?? "",
    barcode: formData.get("barcode") ?? "",
    costPrice: formData.get("costPrice"),
    sellingPrice: formData.get("sellingPrice"),
    lowStockThreshold: formData.get("lowStockThreshold"),
  });

  if (!ids.success || !values.success) {
    redirect("/products?error=Invalid%20product%20details.");
  }

  const { organization } = await getCurrentWorkspace();
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_product_details", {
    p_organization_id: organization.id,
    p_product_id: ids.data.productId,
    p_variant_id: ids.data.variantId,
    p_name: values.data.name,
    p_sku: values.data.sku,
    p_barcode: values.data.barcode,
    p_cost_price: values.data.costPrice,
    p_selling_price: values.data.sellingPrice,
    p_low_stock_threshold: values.data.lowStockThreshold,
  });

  if (error) {
    productRedirect(ids.data.productId, "updated", error.message.includes("duplicate key") ? "That SKU or barcode is already in use." : error.message);
  }

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(`/products/${ids.data.productId}`);
  productRedirect(ids.data.productId, "updated");
}

export async function adjustStock(formData: FormData) {
  const ids = identifiersSchema.safeParse({
    productId: formData.get("productId"),
    variantId: formData.get("variantId"),
  });
  const values = z.object({
    adjustment: z.coerce.number().refine((value) => value !== 0),
    notes: z.string().trim().max(240).default(""),
  }).safeParse({
    adjustment: formData.get("adjustment"),
    notes: formData.get("notes") ?? "",
  });

  if (!ids.success || !values.success) {
    redirect("/products?error=Invalid%20stock%20adjustment.");
  }

  const { organization, branch } = await getCurrentWorkspace();
  if (!branch) {
    productRedirect(ids.data.productId, "adjusted", "No active branch is available.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("adjust_branch_inventory", {
    p_organization_id: organization.id,
    p_branch_id: branch.id,
    p_variant_id: ids.data.variantId,
    p_adjustment: values.data.adjustment,
    p_notes: values.data.notes,
  });

  if (error) {
    productRedirect(ids.data.productId, "adjusted", error.message);
  }

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(`/products/${ids.data.productId}`);
  productRedirect(ids.data.productId, "adjusted");
}

export async function setProductStatus(formData: FormData) {
  const productId = z.string().uuid().safeParse(formData.get("productId"));
  const isActive = formData.get("isActive") === "true";

  if (!productId.success) {
    redirect("/products?error=Invalid%20product.");
  }

  const { organization } = await getCurrentWorkspace();
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_product_active_status", {
    p_organization_id: organization.id,
    p_product_id: productId.data,
    p_is_active: isActive,
  });

  if (error) {
    productRedirect(productId.data, "status", error.message);
  }

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(`/products/${productId.data}`);
  productRedirect(productId.data, "status");
}
