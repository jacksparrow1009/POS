alter table public.sales add column checkout_key uuid;
create unique index sales_organization_checkout_key_idx
  on public.sales (organization_id, checkout_key) where checkout_key is not null;
create unique index register_shifts_one_open_per_branch_idx
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
notify pgrst, 'reload schema';
