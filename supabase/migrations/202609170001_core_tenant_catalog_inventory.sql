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
