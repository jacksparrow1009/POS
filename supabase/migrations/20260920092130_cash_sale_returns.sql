alter table public.sale_returns add column register_shift_id uuid references public.register_shifts(id);
alter table public.sale_returns add column return_key uuid;
alter table public.sale_returns add column refund_method text not null default 'cash';
create unique index sale_returns_org_return_key_idx on public.sale_returns (organization_id, return_key)
  where return_key is not null;
create index sale_returns_register_shift_id_idx on public.sale_returns (register_shift_id);

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
