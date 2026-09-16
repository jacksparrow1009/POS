create table public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  address text,
  loyalty_points numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid not null references public.branches(id),
  supplier_id uuid references public.suppliers(id),
  purchase_number text not null,
  status text not null default 'received',
  subtotal numeric(14,2) not null default 0,
  discount_total numeric(14,2) not null default 0,
  tax_total numeric(14,2) not null default 0,
  grand_total numeric(14,2) not null default 0,
  paid_total numeric(14,2) not null default 0,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, purchase_number)
);

create table public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id),
  quantity numeric(14,3) not null,
  unit_cost numeric(14,2) not null,
  discount_total numeric(14,2) not null default 0,
  tax_total numeric(14,2) not null default 0,
  line_total numeric(14,2) not null
);

create table public.register_shifts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid not null references public.branches(id),
  opened_by uuid not null references auth.users(id),
  closed_by uuid references auth.users(id),
  opening_cash numeric(14,2) not null default 0,
  closing_cash numeric(14,2),
  expected_cash numeric(14,2),
  status text not null default 'open',
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid not null references public.branches(id),
  register_shift_id uuid references public.register_shifts(id),
  customer_id uuid references public.customers(id),
  receipt_number text not null,
  status text not null default 'completed',
  subtotal numeric(14,2) not null default 0,
  discount_total numeric(14,2) not null default 0,
  tax_total numeric(14,2) not null default 0,
  grand_total numeric(14,2) not null default 0,
  paid_total numeric(14,2) not null default 0,
  change_total numeric(14,2) not null default 0,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, receipt_number)
);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id),
  quantity numeric(14,3) not null,
  unit_price numeric(14,2) not null,
  unit_cost numeric(14,2) not null default 0,
  discount_total numeric(14,2) not null default 0,
  tax_total numeric(14,2) not null default 0,
  line_total numeric(14,2) not null
);

create table public.sale_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,
  method text not null,
  amount numeric(14,2) not null,
  reference_number text,
  created_at timestamptz not null default now()
);

create table public.sale_returns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid not null references public.branches(id),
  sale_id uuid not null references public.sales(id),
  return_number text not null,
  refund_total numeric(14,2) not null default 0,
  reason text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (organization_id, return_number)
);

create table public.sale_return_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sale_return_id uuid not null references public.sale_returns(id) on delete cascade,
  sale_item_id uuid not null references public.sale_items(id),
  variant_id uuid not null references public.product_variants(id),
  quantity numeric(14,3) not null,
  refund_total numeric(14,2) not null
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id),
  category text not null,
  amount numeric(14,2) not null,
  payment_method text not null default 'cash',
  notes text,
  spent_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plan_code text not null,
  status text not null default 'trialing',
  trial_ends_at timestamptz,
  current_period_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index customers_organization_id_idx on public.customers(organization_id);
create index suppliers_organization_id_idx on public.suppliers(organization_id);
create index purchases_branch_id_idx on public.purchases(branch_id);
create index purchase_items_purchase_id_idx on public.purchase_items(purchase_id);
create index register_shifts_branch_id_status_idx on public.register_shifts(branch_id, status);
create index sales_branch_id_created_at_idx on public.sales(branch_id, created_at desc);
create index sale_items_sale_id_idx on public.sale_items(sale_id);
create index sale_payments_sale_id_idx on public.sale_payments(sale_id);
create index sale_returns_sale_id_idx on public.sale_returns(sale_id);
create index expenses_branch_id_spent_at_idx on public.expenses(branch_id, spent_at desc);
create index audit_logs_organization_id_created_at_idx on public.audit_logs(organization_id, created_at desc);

create trigger set_customers_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

create trigger set_suppliers_updated_at
before update on public.suppliers
for each row execute function public.set_updated_at();

create trigger set_purchases_updated_at
before update on public.purchases
for each row execute function public.set_updated_at();

create trigger set_sales_updated_at
before update on public.sales
for each row execute function public.set_updated_at();

create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

alter table public.customers enable row level security;
alter table public.suppliers enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.register_shifts enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.sale_payments enable row level security;
alter table public.sale_returns enable row level security;
alter table public.sale_return_items enable row level security;
alter table public.expenses enable row level security;
alter table public.subscriptions enable row level security;
alter table public.audit_logs enable row level security;

create policy "members can manage customers"
on public.customers for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "members can manage suppliers"
on public.suppliers for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "members can manage purchases"
on public.purchases for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "members can manage purchase items"
on public.purchase_items for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "members can manage register shifts"
on public.register_shifts for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "members can manage sales"
on public.sales for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "members can manage sale items"
on public.sale_items for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "members can manage sale payments"
on public.sale_payments for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "members can manage sale returns"
on public.sale_returns for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "members can manage sale return items"
on public.sale_return_items for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "members can manage expenses"
on public.expenses for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "members can read subscriptions"
on public.subscriptions for select
using (public.is_org_member(organization_id));

create policy "members can read audit logs"
on public.audit_logs for select
using (public.is_org_member(organization_id));
