import { CustomerList, type CustomerItem } from "@/app/customers/customer-list";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";

export default async function CustomersPage() {
  const { organization } = await getCurrentWorkspace();
  const supabase = await createClient();

  const [{ data: customers, error: customersError }, { data: sales }] =
    await Promise.all([
      supabase
        .from("customers")
        .select("id, name, phone, email, address, created_at")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("sales")
        .select("customer_id, grand_total, paid_total")
        .eq("organization_id", organization.id)
        .not("customer_id", "is", null),
    ]);

  if (customersError) {
    throw new Error(`Could not load customers: ${customersError.message}`);
  }

  const stats = new Map<
    string,
    { totalOrders: number; totalSpent: number; unpaidBalance: number }
  >();

  for (const sale of sales ?? []) {
    if (!sale.customer_id) continue;
    const current = stats.get(sale.customer_id) ?? {
      totalOrders: 0,
      totalSpent: 0,
      unpaidBalance: 0,
    };
    current.totalOrders += 1;
    current.totalSpent += Number(sale.grand_total);
    current.unpaidBalance += Math.max(
      0,
      Number(sale.grand_total) - Number(sale.paid_total),
    );
    stats.set(sale.customer_id, current);
  }

  const items: CustomerItem[] = (customers ?? []).map((c) => {
    const s = stats.get(c.id) ?? { totalOrders: 0, totalSpent: 0, unpaidBalance: 0 };
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      totalOrders: s.totalOrders,
      totalSpent: s.totalSpent,
      unpaidBalance: s.unpaidBalance,
      createdAt: c.created_at,
    };
  });

  return (
    <CustomerList
      customers={items}
      currency={organization.currency_code.trim()}
    />
  );
}
