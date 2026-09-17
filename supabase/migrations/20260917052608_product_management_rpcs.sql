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

notify pgrst, 'reload schema';
