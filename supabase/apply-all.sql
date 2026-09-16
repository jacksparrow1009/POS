create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  business_type text not null default 'retail',
  currency_code char(3) not null default 'PKR',
  timezone text not null default 'Asia/Karachi',
  phone text,
  email text,
  logo_url text,
  status text not null default 'active',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  permissions jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid references public.roles(id),
  status text not null default 'active',
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  code text not null,
  phone text,
  email text,
  address_line_1 text,
  address_line_2 text,
  city text,
  state text,
  country text,
  timezone text not null default 'Asia/Karachi',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  parent_id uuid references public.categories(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  category_id uuid references public.categories(id),
  brand_id uuid references public.brands(id),
  product_type text not null default 'standard',
  tax_rate numeric(5,2) not null default 0,
  track_inventory boolean not null default true,
  allow_negative_stock boolean not null default false,
  low_stock_threshold numeric(14,3) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null default 'Default',
  sku text,
  barcode text,
  cost_price numeric(14,2) not null default 0,
  selling_price numeric(14,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, sku),
  unique (organization_id, barcode)
);

create table public.branch_inventory (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  quantity_on_hand numeric(14,3) not null default 0,
  quantity_reserved numeric(14,3) not null default 0,
  updated_at timestamptz not null default now(),
  unique (branch_id, variant_id)
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid not null references public.branches(id),
  variant_id uuid not null references public.product_variants(id),
  movement_type text not null,
  quantity numeric(14,3) not null,
  reference_type text,
  reference_id uuid,
  unit_cost numeric(14,2),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index branches_organization_id_idx on public.branches(organization_id);
create index organization_members_user_id_idx on public.organization_members(user_id);
create index products_organization_id_idx on public.products(organization_id);
create index product_variants_product_id_idx on public.product_variants(product_id);
create index branch_inventory_branch_id_idx on public.branch_inventory(branch_id);
create index inventory_movements_variant_id_idx on public.inventory_movements(variant_id);

create trigger set_organizations_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create trigger set_branches_updated_at
before update on public.branches
for each row execute function public.set_updated_at();

create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create trigger set_product_variants_updated_at
before update on public.product_variants
for each row execute function public.set_updated_at();

create or replace function public.is_org_member(target_organization_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = target_organization_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

alter table public.organizations enable row level security;
alter table public.roles enable row level security;
alter table public.organization_members enable row level security;
alter table public.branches enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.branch_inventory enable row level security;
alter table public.inventory_movements enable row level security;

create policy "members can read organizations"
on public.organizations for select
using (public.is_org_member(id));

create policy "members can read roles"
on public.roles for select
using (public.is_org_member(organization_id));

create policy "members can read memberships"
on public.organization_members for select
using (public.is_org_member(organization_id));

create policy "members can manage branches"
on public.branches for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "members can manage categories"
on public.categories for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "members can manage brands"
on public.brands for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "members can manage products"
on public.products for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "members can manage variants"
on public.product_variants for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "members can manage branch inventory"
on public.branch_inventory for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "members can manage inventory movements"
on public.inventory_movements for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));
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
create or replace function public.create_retail_workspace(
  organization_name text,
  organization_slug text,
  branch_name text,
  branch_code text,
  currency_code char(3) default 'PKR',
  timezone text default 'Asia/Karachi'
)
returns table (
  organization_id uuid,
  branch_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_organization_id uuid;
  new_branch_id uuid;
  owner_role_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  insert into public.organizations (
    name,
    slug,
    currency_code,
    timezone,
    created_by
  )
  values (
    organization_name,
    organization_slug,
    currency_code,
    timezone,
    auth.uid()
  )
  returning id into new_organization_id;

  insert into public.roles (
    organization_id,
    name,
    permissions
  )
  values (
    new_organization_id,
    'Owner',
    '{"all": true}'::jsonb
  )
  returning id into owner_role_id;

  insert into public.organization_members (
    organization_id,
    user_id,
    role_id,
    status,
    joined_at
  )
  values (
    new_organization_id,
    auth.uid(),
    owner_role_id,
    'active',
    now()
  );

  insert into public.branches (
    organization_id,
    name,
    code,
    timezone
  )
  values (
    new_organization_id,
    branch_name,
    branch_code,
    timezone
  )
  returning id into new_branch_id;

  insert into public.subscriptions (
    organization_id,
    plan_code,
    status,
    trial_ends_at
  )
  values (
    new_organization_id,
    'starter',
    'trialing',
    now() + interval '14 days'
  );

  return query select new_organization_id, new_branch_id;
end;
$$;

grant execute on function public.create_retail_workspace(
  text,
  text,
  text,
  text,
  char(3),
  text
) to authenticated;
drop function if exists public.create_retail_workspace(
  text,
  text,
  text,
  text,
  char(3),
  text
);

create or replace function public.create_retail_workspace(
  organization_name text,
  organization_slug text,
  branch_name text,
  branch_code text,
  currency_code text default 'PKR',
  timezone text default 'Asia/Karachi'
)
returns table (
  organization_id uuid,
  branch_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_organization_id uuid;
  new_branch_id uuid;
  owner_role_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  insert into public.organizations (
    name,
    slug,
    currency_code,
    timezone,
    created_by
  )
  values (
    organization_name,
    organization_slug,
    upper(currency_code)::char(3),
    timezone,
    auth.uid()
  )
  returning id into new_organization_id;

  insert into public.roles (
    organization_id,
    name,
    permissions
  )
  values (
    new_organization_id,
    'Owner',
    '{"all": true}'::jsonb
  )
  returning id into owner_role_id;

  insert into public.organization_members (
    organization_id,
    user_id,
    role_id,
    status,
    joined_at
  )
  values (
    new_organization_id,
    auth.uid(),
    owner_role_id,
    'active',
    now()
  );

  insert into public.branches (
    organization_id,
    name,
    code,
    timezone
  )
  values (
    new_organization_id,
    branch_name,
    upper(branch_code),
    timezone
  )
  returning id into new_branch_id;

  insert into public.subscriptions (
    organization_id,
    plan_code,
    status,
    trial_ends_at
  )
  values (
    new_organization_id,
    'starter',
    'trialing',
    now() + interval '14 days'
  );

  return query select new_organization_id, new_branch_id;
end;
$$;

grant execute on function public.create_retail_workspace(
  text,
  text,
  text,
  text,
  text,
  text
) to authenticated;

notify pgrst, 'reload schema';
