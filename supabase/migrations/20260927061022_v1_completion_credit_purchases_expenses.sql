alter table public.sales
  add column if not exists payment_method text not null default 'cash';

create index if not exists sales_customer_id_idx on public.sales(customer_id);
create index if not exists sale_payments_organization_id_created_at_idx
  on public.sale_payments(organization_id, created_at desc);

create or replace function public.complete_pos_sale(
  p_organization_id uuid, p_branch_id uuid, p_shift_id uuid,
  p_checkout_key uuid, p_customer_id uuid, p_items jsonb,
  p_amount_received numeric, p_payment_method text
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
  v_method text := lower(coalesce(nullif(trim(p_payment_method), ''), 'cash'));
  v_paid_total numeric;
  v_change numeric := 0;
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
  if v_method not in ('cash', 'card', 'bank_transfer', 'wallet', 'credit') then
    raise exception 'Invalid payment method.';
  end if;
  if p_amount_received is null or p_amount_received < 0 or p_amount_received > 999999999999.99 then
    raise exception 'Enter a valid payment amount.';
  end if;
  if v_method = 'credit' and p_customer_id is null then
    raise exception 'Select a customer for credit sales.';
  end if;
  if p_customer_id is not null and not exists (
    select 1 from public.customers
    where id = p_customer_id and organization_id = p_organization_id
  ) then
    raise exception 'Customer not found.';
  end if;

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

  if v_method = 'cash' then
    if p_amount_received < v_subtotal then
      raise exception 'Cash received is less than the sale total.';
    end if;
    v_paid_total := v_subtotal;
    v_change := p_amount_received - v_subtotal;
  else
    v_paid_total := least(p_amount_received, v_subtotal);
  end if;

  v_sale_id := pg_catalog.gen_random_uuid();
  insert into public.sales (id, organization_id, branch_id, register_shift_id,
    customer_id, checkout_key, receipt_number, subtotal, grand_total, paid_total,
    change_total, payment_method, created_by)
  values (v_sale_id, p_organization_id, p_branch_id, p_shift_id, p_customer_id,
    p_checkout_key, 'POS-' || upper(substr(replace(v_sale_id::text, '-', ''), 1, 12)),
    v_subtotal, v_subtotal, v_paid_total, v_change, v_method, (select auth.uid()));

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

  if v_paid_total > 0 then
    insert into public.sale_payments (organization_id, sale_id, method, amount)
    values (p_organization_id, v_sale_id, v_method, v_paid_total);
  end if;

  insert into public.audit_logs (organization_id, actor_id, action, entity_type, entity_id, metadata)
  values (p_organization_id, (select auth.uid()), 'completed', 'sale', v_sale_id,
    jsonb_build_object('payment_method', v_method, 'paid_total', v_paid_total, 'grand_total', v_subtotal));

  return v_sale_id;
end;
$$;

create or replace function public.complete_cash_sale(
  p_organization_id uuid, p_branch_id uuid, p_shift_id uuid,
  p_checkout_key uuid, p_items jsonb, p_cash_received numeric
)
returns uuid
language plpgsql security invoker set search_path = ''
as $$
begin
  return public.complete_pos_sale(
    p_organization_id, p_branch_id, p_shift_id, p_checkout_key,
    null, p_items, p_cash_received, 'cash'
  );
end;
$$;

create or replace function public.receive_stock_purchase(
  p_organization_id uuid, p_branch_id uuid, p_supplier_name text,
  p_variant_id uuid, p_quantity numeric, p_unit_cost numeric, p_notes text
)
returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  v_supplier_id uuid;
  v_purchase_id uuid;
  v_purchase_number text;
  v_line_total numeric;
begin
  if (select auth.uid()) is null or not (select public.is_org_member(p_organization_id)) then
    raise exception 'Not authorized.';
  end if;
  if p_supplier_name is null or length(trim(p_supplier_name)) < 2 then
    raise exception 'Supplier name required.';
  end if;
  if p_quantity is null or p_quantity <= 0 or p_quantity > 999999
    or p_quantity <> trunc(p_quantity, 3) then
    raise exception 'Invalid purchase quantity.';
  end if;
  if p_unit_cost is null or p_unit_cost < 0 or p_unit_cost > 999999999999.99 then
    raise exception 'Invalid unit cost.';
  end if;
  if not exists (select 1 from public.branches where id = p_branch_id
    and organization_id = p_organization_id and is_active) then
    raise exception 'Active branch not found.';
  end if;
  if not exists (select 1 from public.product_variants
    where id = p_variant_id and organization_id = p_organization_id and is_active) then
    raise exception 'Product variant not found.';
  end if;

  select id into v_supplier_id
  from public.suppliers
  where organization_id = p_organization_id and lower(name) = lower(trim(p_supplier_name))
  limit 1;

  if v_supplier_id is null then
    insert into public.suppliers (organization_id, name)
    values (p_organization_id, trim(p_supplier_name))
    returning id into v_supplier_id;
  end if;

  v_purchase_id := pg_catalog.gen_random_uuid();
  v_purchase_number := 'PO-' || upper(substr(replace(v_purchase_id::text, '-', ''), 1, 10));
  v_line_total := round(p_quantity * p_unit_cost, 2);

  insert into public.purchases (id, organization_id, branch_id, supplier_id,
    purchase_number, status, subtotal, grand_total, paid_total, notes, created_by)
  values (v_purchase_id, p_organization_id, p_branch_id, v_supplier_id,
    v_purchase_number, 'received', v_line_total, v_line_total, v_line_total,
    nullif(trim(coalesce(p_notes, '')), ''), (select auth.uid()));

  insert into public.purchase_items (organization_id, purchase_id, variant_id,
    quantity, unit_cost, line_total)
  values (p_organization_id, v_purchase_id, p_variant_id, p_quantity, p_unit_cost, v_line_total);

  update public.product_variants set cost_price = p_unit_cost, updated_at = now()
  where id = p_variant_id and organization_id = p_organization_id;

  insert into public.branch_inventory (organization_id, branch_id, variant_id, quantity_on_hand)
  values (p_organization_id, p_branch_id, p_variant_id, p_quantity)
  on conflict (branch_id, variant_id)
  do update set quantity_on_hand = public.branch_inventory.quantity_on_hand + excluded.quantity_on_hand,
    updated_at = now();

  insert into public.inventory_movements (organization_id, branch_id, variant_id,
    movement_type, quantity, reference_type, reference_id, unit_cost, notes, created_by)
  values (p_organization_id, p_branch_id, p_variant_id, 'purchase', p_quantity,
    'purchase', v_purchase_id, p_unit_cost,
    'Received from ' || trim(p_supplier_name) || ' (' || v_purchase_number || ')',
    (select auth.uid()));

  insert into public.audit_logs (organization_id, actor_id, action, entity_type, entity_id, metadata)
  values (p_organization_id, (select auth.uid()), 'received', 'purchase', v_purchase_id,
    jsonb_build_object('supplier', trim(p_supplier_name), 'quantity', p_quantity, 'unit_cost', p_unit_cost));

  return v_purchase_id;
end;
$$;

create or replace function public.record_expense(
  p_organization_id uuid, p_branch_id uuid, p_category text,
  p_amount numeric, p_payment_method text, p_notes text, p_spent_at timestamptz
)
returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare v_expense_id uuid;
begin
  if (select auth.uid()) is null or not (select public.is_org_member(p_organization_id)) then
    raise exception 'Not authorized.';
  end if;
  if p_branch_id is not null and not exists (select 1 from public.branches
    where id = p_branch_id and organization_id = p_organization_id and is_active) then
    raise exception 'Active branch not found.';
  end if;
  if p_category is null or length(trim(p_category)) < 2 then
    raise exception 'Expense category is required.';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount > 999999999999.99 then
    raise exception 'Enter a valid expense amount.';
  end if;

  insert into public.expenses (organization_id, branch_id, category, amount,
    payment_method, notes, spent_at, created_by)
  values (p_organization_id, p_branch_id, trim(p_category), p_amount,
    lower(coalesce(nullif(trim(p_payment_method), ''), 'cash')),
    nullif(trim(coalesce(p_notes, '')), ''), coalesce(p_spent_at, now()),
    (select auth.uid()))
  returning id into v_expense_id;

  insert into public.audit_logs (organization_id, actor_id, action, entity_type, entity_id, metadata)
  values (p_organization_id, (select auth.uid()), 'recorded', 'expense', v_expense_id,
    jsonb_build_object('category', trim(p_category), 'amount', p_amount));

  return v_expense_id;
end;
$$;

revoke all on function public.complete_pos_sale(uuid, uuid, uuid, uuid, uuid, jsonb, numeric, text) from public, anon;
revoke all on function public.receive_stock_purchase(uuid, uuid, text, uuid, numeric, numeric, text) from public, anon;
revoke all on function public.record_expense(uuid, uuid, text, numeric, text, text, timestamptz) from public, anon;
grant execute on function public.complete_pos_sale(uuid, uuid, uuid, uuid, uuid, jsonb, numeric, text) to authenticated;
grant execute on function public.receive_stock_purchase(uuid, uuid, text, uuid, numeric, numeric, text) to authenticated;
grant execute on function public.record_expense(uuid, uuid, text, numeric, text, text, timestamptz) to authenticated;
notify pgrst, 'reload schema';
