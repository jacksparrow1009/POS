drop function if exists public.create_retail_workspace(
  text,
  text,
  text,
  text,
  char(3),
  text
);

drop function if exists public.create_retail_workspace(
  text,
  text,
  text,
  text,
  text,
  text
);

create or replace function public.create_retail_workspace(
  organization_name text,
  organization_slug text,
  branch_name text,
  branch_code text,
  currency_code text,
  timezone text
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

select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'create_retail_workspace';
