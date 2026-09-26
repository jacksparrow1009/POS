-- =============================================================================
-- Awan POS: Latest Features & RPCs Migration
-- Run this script in the Supabase SQL Editor for an existing database.
-- =============================================================================

-- =============================================================================
-- Migration 202609170005_create_product_with_inventory.sql
-- =============================================================================

create or replace function public.create_product_with_inventory(
  p_organization_id uuid,
  p_branch_id uuid,
  p_name text,
  p_sku text,
  p_barcode text,
  p_cost_price numeric,
  p_selling_price numeric,
  p_opening_stock numeric,
  p_low_stock_threshold numeric
)
returns table (product_id uuid, variant_id uuid)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_product_id uuid;
  new_variant_id uuid;
begin
  if (select auth.uid()) is null
    or not (select public.is_org_member(p_organization_id)) then
    raise exception 'You do not have access to this organization.';
  end if;

  if not exists (
    select 1
    from public.branches
    where id = p_branch_id
      and organization_id = p_organization_id
      and is_active = true
  ) then
    raise exception 'The selected branch is not available.';
  end if;

  if length(trim(p_name)) < 2 then
    raise exception 'Product name must contain at least 2 characters.';
  end if;

  if p_cost_price < 0 or p_selling_price < 0
    or p_opening_stock < 0 or p_low_stock_threshold < 0 then
    raise exception 'Prices and stock values cannot be negative.';
  end if;

  insert into public.products (
    organization_id,
    name,
    low_stock_threshold
  ) values (
    p_organization_id,
    trim(p_name),
    p_low_stock_threshold
  )
  returning id into new_product_id;

  insert into public.product_variants (
    organization_id,
    product_id,
    name,
    sku,
    barcode,
    cost_price,
    selling_price
  ) values (
    p_organization_id,
    new_product_id,
    'Default',
    nullif(upper(trim(p_sku)), ''),
    nullif(trim(p_barcode), ''),
    p_cost_price,
    p_selling_price
  )
  returning id into new_variant_id;

  insert into public.branch_inventory (
    organization_id,
    branch_id,
    variant_id,
    quantity_on_hand
  ) values (
    p_organization_id,
    p_branch_id,
    new_variant_id,
    p_opening_stock
  );

  if p_opening_stock > 0 then
    insert into public.inventory_movements (
      organization_id,
      branch_id,
      variant_id,
      movement_type,
      quantity,
      reference_type,
      unit_cost,
      notes,
      created_by
    ) values (
      p_organization_id,
      p_branch_id,
      new_variant_id,
      'opening_stock',
      p_opening_stock,
      'product_setup',
      p_cost_price,
      'Opening stock entered during product creation',
      (select auth.uid())
    );
  end if;

  return query select new_product_id, new_variant_id;
end;
$$;

revoke execute on function public.create_product_with_inventory(
  uuid, uuid, text, text, text, numeric, numeric, numeric, numeric
) from public, anon;

grant execute on function public.create_product_with_inventory(
  uuid, uuid, text, text, text, numeric, numeric, numeric, numeric
) to authenticated;

-- =============================================================================
-- Migration 20260917052608_product_management_rpcs.sql
-- =============================================================================

create or replace function public.update_product_details(
  p_organization_id uuid,
  p_product_id uuid,
  p_variant_id uuid,
  p_name text,
  p_sku text,
  p_barcode text,
  p_cost_price numeric,
  p_selling_price numeric,
  p_low_stock_threshold numeric
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select auth.uid()) is null
    or not (select public.is_org_member(p_organization_id)) then
    raise exception 'You do not have access to this organization.';
  end if;

  if length(trim(p_name)) < 2 then
    raise exception 'Product name must contain at least 2 characters.';
  end if;

  if p_cost_price < 0 or p_selling_price < 0 or p_low_stock_threshold < 0 then
    raise exception 'Prices and stock values cannot be negative.';
  end if;

  update public.products
  set name = trim(p_name),
      low_stock_threshold = p_low_stock_threshold
  where id = p_product_id
    and organization_id = p_organization_id;

  if not found then
    raise exception 'Product not found.';
  end if;

  update public.product_variants
  set sku = nullif(upper(trim(p_sku)), ''),
      barcode = nullif(trim(p_barcode), ''),
      cost_price = p_cost_price,
      selling_price = p_selling_price
  where id = p_variant_id
    and product_id = p_product_id
    and organization_id = p_organization_id;

  if not found then
    raise exception 'Product variant not found.';
  end if;
end;
$$;

create or replace function public.adjust_branch_inventory(
  p_organization_id uuid,
  p_branch_id uuid,
  p_variant_id uuid,
  p_adjustment numeric,
  p_notes text
)
returns numeric
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_quantity numeric;
begin
  if (select auth.uid()) is null
    or not (select public.is_org_member(p_organization_id)) then
    raise exception 'You do not have access to this organization.';
  end if;

  if p_adjustment = 0 then
    raise exception 'Stock adjustment cannot be zero.';
  end if;

  if not exists (
    select 1 from public.branches
    where id = p_branch_id
      and organization_id = p_organization_id
      and is_active = true
  ) or not exists (
    select 1 from public.product_variants
    where id = p_variant_id
      and organization_id = p_organization_id
      and is_active = true
  ) then
    raise exception 'Branch or product variant not found.';
  end if;

  if p_adjustment > 0 then
    insert into public.branch_inventory (
      organization_id, branch_id, variant_id, quantity_on_hand
    ) values (
      p_organization_id, p_branch_id, p_variant_id, p_adjustment
    )
    on conflict (branch_id, variant_id)
    do update set
      quantity_on_hand = public.branch_inventory.quantity_on_hand + excluded.quantity_on_hand,
      updated_at = now()
    returning quantity_on_hand into new_quantity;
  else
    update public.branch_inventory
    set quantity_on_hand = quantity_on_hand + p_adjustment,
        updated_at = now()
    where organization_id = p_organization_id
      and branch_id = p_branch_id
      and variant_id = p_variant_id
      and quantity_on_hand + p_adjustment >= 0
    returning quantity_on_hand into new_quantity;
  end if;

  if new_quantity is null then
    raise exception 'This adjustment would make stock negative.';
  end if;

  insert into public.inventory_movements (
    organization_id,
    branch_id,
    variant_id,
    movement_type,
    quantity,
    reference_type,
    notes,
    created_by
  ) values (
    p_organization_id,
    p_branch_id,
    p_variant_id,
    'manual_adjustment',
    p_adjustment,
    'inventory_adjustment',
    nullif(trim(p_notes), ''),
    (select auth.uid())
  );

  return new_quantity;
end;
$$;

create or replace function public.set_product_active_status(
  p_organization_id uuid,
  p_product_id uuid,
  p_is_active boolean
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select auth.uid()) is null
    or not (select public.is_org_member(p_organization_id)) then
    raise exception 'You do not have access to this organization.';
  end if;

  update public.products
  set is_active = p_is_active
  where id = p_product_id
    and organization_id = p_organization_id;

  if not found then
    raise exception 'Product not found.';
  end if;

  update public.product_variants
  set is_active = p_is_active
  where product_id = p_product_id
    and organization_id = p_organization_id;
end;
$$;

revoke execute on function public.update_product_details(
  uuid, uuid, uuid, text, text, text, numeric, numeric, numeric
) from public, anon;
revoke execute on function public.adjust_branch_inventory(
  uuid, uuid, uuid, numeric, text
) from public, anon;
revoke execute on function public.set_product_active_status(
  uuid, uuid, boolean
) from public, anon;

grant execute on function public.update_product_details(
  uuid, uuid, uuid, text, text, text, numeric, numeric, numeric
) to authenticated;
grant execute on function public.adjust_branch_inventory(
  uuid, uuid, uuid, numeric, text
) to authenticated;
grant execute on function public.set_product_active_status(
  uuid, uuid, boolean
) to authenticated;

-- =============================================================================
-- Migration 20260920090054_pos_cash_checkout.sql
-- =============================================================================

alter table public.sales add column if not exists checkout_key uuid;
create unique index if not exists sales_organization_checkout_key_idx
  on public.sales (organization_id, checkout_key) where checkout_key is not null;
create unique index if not exists register_shifts_one_open_per_branch_idx
  on public.register_shifts (branch_id) where status = 'open';

create or replace function public.open_register(
  p_organization_id uuid, p_branch_id uuid, p_opening_cash numeric
)
returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare v_shift_id uuid;
begin
  if (select auth.uid()) is null or not (select public.is_org_member(p_organization_id)) then
    raise exception 'Not authorized.';
  end if;
  if p_opening_cash is null or p_opening_cash < 0 or p_opening_cash > 999999999999.99 then
    raise exception 'Enter a valid opening cash amount.';
  end if;
  if not exists (select 1 from public.branches where id = p_branch_id
    and organization_id = p_organization_id and is_active) then
    raise exception 'Active branch not found.';
  end if;
  insert into public.register_shifts (organization_id, branch_id, opened_by, opening_cash)
  values (p_organization_id, p_branch_id, (select auth.uid()), p_opening_cash)
  returning id into v_shift_id;
  return v_shift_id;
exception when unique_violation then
  raise exception 'A register is already open for this branch.';
end;
$$;

create or replace function public.close_register(
  p_organization_id uuid, p_branch_id uuid, p_shift_id uuid, p_closing_cash numeric
)
returns void
language plpgsql security invoker set search_path = ''
as $$
declare v_shift public.register_shifts%rowtype; v_cash_sales numeric;
begin
  if (select auth.uid()) is null or not (select public.is_org_member(p_organization_id)) then
    raise exception 'Not authorized.';
  end if;
  if p_closing_cash is null or p_closing_cash < 0 or p_closing_cash > 999999999999.99 then
    raise exception 'Enter a valid closing cash amount.';
  end if;
  select * into v_shift from public.register_shifts
  where id = p_shift_id and organization_id = p_organization_id
    and branch_id = p_branch_id and status = 'open' for update;
  if not found then raise exception 'Open register not found.'; end if;
  select coalesce(sum(sp.amount), 0) into v_cash_sales
  from public.sale_payments sp join public.sales s on s.id = sp.sale_id
  where s.register_shift_id = p_shift_id and s.organization_id = p_organization_id
    and s.status = 'completed' and sp.method = 'cash';
  update public.register_shifts set status = 'closed', closed_by = (select auth.uid()),
    closing_cash = p_closing_cash, expected_cash = v_shift.opening_cash + v_cash_sales,
    closed_at = now()
  where id = p_shift_id;
end;
$$;

create or replace function public.complete_cash_sale(
  p_organization_id uuid, p_branch_id uuid, p_shift_id uuid,
  p_checkout_key uuid, p_items jsonb, p_cash_received numeric
)
returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  v_sale_id uuid;
  v_shift public.register_shifts%rowtype;
  v_item jsonb;
  v_variant_id uuid;
  v_quantity numeric;
  v_price numeric;
  v_cost numeric;
  v_subtotal numeric := 0;
  v_stock numeric;
begin
  if (select auth.uid()) is null or not (select public.is_org_member(p_organization_id)) then
    raise exception 'Not authorized.';
  end if;
  if p_checkout_key is null or p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Invalid checkout request.';
  end if;
  if jsonb_array_length(p_items) not between 1 and 100 then
    raise exception 'Invalid checkout request.';
  end if;
  -- Serialize retries for this key before checking for an existing sale.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_checkout_key::text, 0));
  select id into v_sale_id from public.sales
  where organization_id = p_organization_id and checkout_key = p_checkout_key;
  if found then return v_sale_id; end if;

  select * into v_shift from public.register_shifts
  where id = p_shift_id and organization_id = p_organization_id
    and branch_id = p_branch_id and status = 'open' for update;
  if not found then raise exception 'Open register not found.'; end if;
  if not exists (select 1 from public.branches where id = p_branch_id
    and organization_id = p_organization_id and is_active) then
    raise exception 'Active branch not found.';
  end if;
  if exists (select 1 from jsonb_array_elements(p_items) as item(value)
    group by item.value->>'variant_id' having count(*) > 1) then
    raise exception 'Duplicate items in cart.';
  end if;

  -- Lock stock rows in stable order to prevent overselling and reduce deadlocks.
  for v_item in select item.value from jsonb_array_elements(p_items) as item(value)
    order by item.value->>'variant_id' loop
    begin
      v_variant_id := (v_item->>'variant_id')::uuid;
      v_quantity := (v_item->>'quantity')::numeric;
    exception when invalid_text_representation then
      raise exception 'Invalid cart item.';
    end;
    if v_quantity is null or v_quantity <= 0 or v_quantity > 999999
      or v_quantity <> trunc(v_quantity, 3) then
      raise exception 'Invalid item quantity.';
    end if;
    select pv.selling_price, pv.cost_price into v_price, v_cost
    from public.product_variants pv join public.products p on p.id = pv.product_id
    where pv.id = v_variant_id and pv.organization_id = p_organization_id
      and pv.is_active and p.is_active;
    if not found then raise exception 'A product is no longer available.'; end if;
    select quantity_on_hand - quantity_reserved into v_stock
    from public.branch_inventory where organization_id = p_organization_id
      and branch_id = p_branch_id and variant_id = v_variant_id for update;
    if v_stock is null or v_stock < v_quantity then
      raise exception 'Insufficient stock for a cart item.';
    end if;
    v_subtotal := v_subtotal + round(v_price * v_quantity, 2);
  end loop;
  if p_cash_received is null or p_cash_received < v_subtotal
    or p_cash_received > 999999999999.99 then
    raise exception 'Cash received is less than the sale total.';
  end if;

  v_sale_id := pg_catalog.gen_random_uuid();
  insert into public.sales (id, organization_id, branch_id, register_shift_id,
    checkout_key, receipt_number, subtotal, grand_total, paid_total, change_total, created_by)
  values (v_sale_id, p_organization_id, p_branch_id, p_shift_id, p_checkout_key,
    'POS-' || upper(substr(replace(v_sale_id::text, '-', ''), 1, 12)),
    v_subtotal, v_subtotal, v_subtotal, p_cash_received - v_subtotal, (select auth.uid()));

  for v_item in select item.value from jsonb_array_elements(p_items) as item(value)
    order by item.value->>'variant_id' loop
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_quantity := (v_item->>'quantity')::numeric;
    select pv.selling_price, pv.cost_price into v_price, v_cost
    from public.product_variants pv where pv.id = v_variant_id
      and pv.organization_id = p_organization_id;
    update public.branch_inventory set quantity_on_hand = quantity_on_hand - v_quantity,
      updated_at = now() where organization_id = p_organization_id
      and branch_id = p_branch_id and variant_id = v_variant_id;
    insert into public.sale_items (organization_id, sale_id, variant_id,
      quantity, unit_price, unit_cost, line_total)
    values (p_organization_id, v_sale_id, v_variant_id, v_quantity,
      v_price, v_cost, round(v_price * v_quantity, 2));
    insert into public.inventory_movements (organization_id, branch_id, variant_id,
      movement_type, quantity, reference_type, reference_id, unit_cost, created_by)
    values (p_organization_id, p_branch_id, v_variant_id, 'sale', -v_quantity,
      'sale', v_sale_id, v_cost, (select auth.uid()));
  end loop;
  insert into public.sale_payments (organization_id, sale_id, method, amount)
  values (p_organization_id, v_sale_id, 'cash', v_subtotal);
  return v_sale_id;
end;
$$;

revoke all on function public.open_register(uuid, uuid, numeric) from public, anon;
revoke all on function public.close_register(uuid, uuid, uuid, numeric) from public, anon;
revoke all on function public.complete_cash_sale(uuid, uuid, uuid, uuid, jsonb, numeric) from public, anon;
grant execute on function public.open_register(uuid, uuid, numeric) to authenticated;
grant execute on function public.close_register(uuid, uuid, uuid, numeric) to authenticated;
grant execute on function public.complete_cash_sale(uuid, uuid, uuid, uuid, jsonb, numeric) to authenticated;

-- =============================================================================
-- Migration 20260920092130_cash_sale_returns.sql
-- =============================================================================

alter table public.sale_returns add column if not exists register_shift_id uuid references public.register_shifts(id);
alter table public.sale_returns add column if not exists return_key uuid;
alter table public.sale_returns add column if not exists refund_method text not null default 'cash';
create unique index if not exists sale_returns_org_return_key_idx on public.sale_returns (organization_id, return_key)
  where return_key is not null;
create index if not exists sale_returns_register_shift_id_idx on public.sale_returns (register_shift_id);

create or replace function public.return_cash_sale(
  p_organization_id uuid, p_branch_id uuid, p_shift_id uuid,
  p_sale_id uuid, p_return_key uuid, p_items jsonb, p_reason text
)
returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  v_sale public.sales%rowtype;
  v_item public.sale_items%rowtype;
  v_request jsonb;
  v_quantity numeric;
  v_already_returned numeric;
  v_line_refund numeric;
  v_total numeric := 0;
  v_return_id uuid;
begin
  if (select auth.uid()) is null or not (select public.is_org_member(p_organization_id)) then
    raise exception 'Not authorized.';
  end if;
  if p_return_key is null or p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Invalid return request.';
  end if;
  if jsonb_array_length(p_items) not between 1 and 100
    or length(trim(coalesce(p_reason, ''))) not between 3 and 240 then
    raise exception 'Select items and provide a reason for the return.';
  end if;
  if exists (select 1 from jsonb_array_elements(p_items) as item(value)
    group by item.value->>'sale_item_id' having count(*) > 1) then
    raise exception 'Duplicate return items.';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_return_key::text, 0));
  select id into v_return_id from public.sale_returns
    where organization_id = p_organization_id and return_key = p_return_key;
  if found then return v_return_id; end if;

  -- Lock the shift before the sale, matching checkout and register-close lock order.
  perform 1 from public.register_shifts where id = p_shift_id
    and organization_id = p_organization_id and branch_id = p_branch_id
    and status = 'open' for update;
  if not found then raise exception 'Open register not found.'; end if;
  select * into v_sale from public.sales where id = p_sale_id
    and organization_id = p_organization_id and branch_id = p_branch_id
    and status = 'completed' for update;
  if not found then raise exception 'Sale not found.'; end if;
  if v_sale.discount_total <> 0 or v_sale.tax_total <> 0
    or not exists (select 1 from public.sale_payments where sale_id = p_sale_id
      and organization_id = p_organization_id and method = 'cash') then
    raise exception 'Only cash sales without discounts or tax can be returned here.';
  end if;

  v_return_id := pg_catalog.gen_random_uuid();
  insert into public.sale_returns (id, organization_id, branch_id, sale_id,
    register_shift_id, return_key, return_number, refund_total, reason, created_by)
    values (v_return_id, p_organization_id, p_branch_id, p_sale_id, p_shift_id,
      p_return_key, 'RET-' || upper(substr(replace(v_return_id::text, '-', ''), 1, 12)),
      0, trim(p_reason), (select auth.uid()));
  -- Every requested item is checked against its original sale and previous returns.
  for v_request in select item.value from jsonb_array_elements(p_items) as item(value)
    order by item.value->>'sale_item_id' loop
    begin
      v_quantity := (v_request->>'quantity')::numeric;
      select * into v_item from public.sale_items
        where id = (v_request->>'sale_item_id')::uuid
          and sale_id = p_sale_id and organization_id = p_organization_id;
    exception when invalid_text_representation then
      raise exception 'Invalid return item.';
    end;
    if not found then raise exception 'Sale item not found.'; end if;
    if v_quantity is null or v_quantity <= 0 or v_quantity > v_item.quantity
      or v_quantity <> trunc(v_quantity, 3) then
      raise exception 'Invalid return quantity.';
    end if;
    if v_item.discount_total <> 0 or v_item.tax_total <> 0 then
      raise exception 'Discounted or taxed items cannot be returned here.';
    end if;
    select coalesce(sum(sri.quantity), 0) into v_already_returned
      from public.sale_return_items sri join public.sale_returns sr on sr.id = sri.sale_return_id
      where sri.sale_item_id = v_item.id and sr.organization_id = p_organization_id;
    if v_quantity > v_item.quantity - v_already_returned then
      raise exception 'Return quantity exceeds the remaining sold quantity.';
    end if;
    v_line_refund := round(v_item.unit_price * v_quantity, 2);
    v_total := v_total + v_line_refund;

    if not exists (select 1 from public.product_variants where id = v_item.variant_id
      and organization_id = p_organization_id) then
      raise exception 'Product variant not found.';
    end if;
    insert into public.branch_inventory (organization_id, branch_id, variant_id, quantity_on_hand)
      values (p_organization_id, p_branch_id, v_item.variant_id, v_quantity)
      on conflict (branch_id, variant_id) do update
      set quantity_on_hand = public.branch_inventory.quantity_on_hand + excluded.quantity_on_hand,
          updated_at = now();
    insert into public.sale_return_items (organization_id, sale_return_id, sale_item_id,
      variant_id, quantity, refund_total)
      values (p_organization_id, v_return_id, v_item.id, v_item.variant_id, v_quantity, v_line_refund);
    insert into public.inventory_movements (organization_id, branch_id, variant_id,
      movement_type, quantity, reference_type, reference_id, unit_cost, created_by)
      values (p_organization_id, p_branch_id, v_item.variant_id, 'sale_return',
        v_quantity, 'sale_return', v_return_id, v_item.unit_cost, (select auth.uid()));
  end loop;
  update public.sale_returns set refund_total = v_total where id = v_return_id;
  return v_return_id;
end;
$$;

create or replace function public.close_register(
  p_organization_id uuid, p_branch_id uuid, p_shift_id uuid, p_closing_cash numeric
)
returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  v_shift public.register_shifts%rowtype;
  v_cash_sales numeric;
  v_cash_refunds numeric;
begin
  if (select auth.uid()) is null or not (select public.is_org_member(p_organization_id)) then
    raise exception 'Not authorized.';
  end if;
  if p_closing_cash is null or p_closing_cash < 0 or p_closing_cash > 999999999999.99 then
    raise exception 'Enter a valid closing cash amount.';
  end if;
  select * into v_shift from public.register_shifts
  where id = p_shift_id and organization_id = p_organization_id
    and branch_id = p_branch_id and status = 'open' for update;
  if not found then raise exception 'Open register not found.'; end if;
  select coalesce(sum(sp.amount), 0) into v_cash_sales
    from public.sale_payments sp join public.sales s on s.id = sp.sale_id
    where s.register_shift_id = p_shift_id and s.organization_id = p_organization_id
      and s.status = 'completed' and sp.method = 'cash';
  select coalesce(sum(sr.refund_total), 0) into v_cash_refunds
    from public.sale_returns sr where sr.register_shift_id = p_shift_id
      and sr.organization_id = p_organization_id and sr.refund_method = 'cash';
  update public.register_shifts set status = 'closed', closed_by = (select auth.uid()),
    closing_cash = p_closing_cash,
    expected_cash = v_shift.opening_cash + v_cash_sales - v_cash_refunds,
    closed_at = now()
    where id = p_shift_id;
end;
$$;

revoke all on function public.return_cash_sale(uuid, uuid, uuid, uuid, uuid, jsonb, text)
  from public, anon;
grant execute on function public.return_cash_sale(uuid, uuid, uuid, uuid, uuid, jsonb, text)
  to authenticated;

notify pgrst, 'reload schema';
