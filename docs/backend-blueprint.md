# POS SaaS Backend Blueprint

This is the V1 backend contract for the retail POS SaaS. The first product is a multi-branch POS, inventory, purchase, customer, and reporting system for small and medium retail stores.

## Product Scope

The primary success path is:

```text
Create account
Create organization
Create branch
Configure store
Add or import products
Add opening stock
Open register
Make sale
Print receipt
Review sales and profit
```

V1 includes authentication, organizations, branches, employees, roles, products, variants, inventory, stock movements, customers, suppliers, purchases, POS sales, payments, returns, expenses, register shifts, dashboard reporting, subscriptions, settings, and audit logs.

V1 excludes accounting ledger, payroll, restaurant tables, kitchen display, ecommerce, offline sync, native mobile apps, public API, advanced loyalty, and AI assistant.

## Architecture

```text
Next.js + TypeScript
Server Actions / API Routes
Supabase Auth
Supabase PostgreSQL
Supabase Storage
Supabase Realtime later
```

Use row level security on every tenant-owned table. Never model one user as one business; use organization membership.

## Core Tables

```sql
create table organizations (
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

create table roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  permissions jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid references roles(id),
  status text not null default 'active',
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table branches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
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
```

## Catalog And Inventory

```sql
create table categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  parent_id uuid references categories(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table brands (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  category_id uuid references categories(id),
  brand_id uuid references brands(id),
  product_type text not null default 'standard',
  tax_rate numeric(5,2) not null default 0,
  track_inventory boolean not null default true,
  allow_negative_stock boolean not null default false,
  low_stock_threshold numeric(14,3) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
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

create table branch_inventory (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  variant_id uuid not null references product_variants(id) on delete cascade,
  quantity_on_hand numeric(14,3) not null default 0,
  quantity_reserved numeric(14,3) not null default 0,
  updated_at timestamptz not null default now(),
  unique (branch_id, variant_id)
);

create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid not null references branches(id),
  variant_id uuid not null references product_variants(id),
  movement_type text not null,
  quantity numeric(14,3) not null,
  reference_type text,
  reference_id uuid,
  unit_cost numeric(14,2),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
```

## Transaction Tables

Add suppliers, purchases, customers, sales, sale items, payments, returns, expenses, register shifts, subscriptions, and audit logs after the catalog tables are migrated. Every table should include `organization_id`; branch-specific records should also include `branch_id`.

## RLS Pattern

Use this helper pattern:

```sql
create or replace function is_org_member(target_organization_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from organization_members
    where organization_id = target_organization_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;
```

Then apply policies like:

```sql
alter table products enable row level security;

create policy "members can read products"
on products for select
using (is_org_member(organization_id));
```
