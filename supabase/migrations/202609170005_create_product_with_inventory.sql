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

notify pgrst, 'reload schema';
