-- Capture EIN and home state at signup.

alter table public.organizations add column if not exists home_state text;

-- Replace the 1-arg version to avoid PostgREST overload ambiguity.
drop function if exists public.create_organization(text);

create or replace function public.create_organization(
  org_name text,
  org_ein text default null,
  org_state text default null
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  insert into organizations (name, ein, home_state)
    values (org_name, nullif(trim(coalesce(org_ein, '')), ''), org_state)
    returning id into v_org;
  insert into memberships (org_id, user_id, role) values (v_org, auth.uid(), 'owner');
  insert into accounts (org_id, code, name, type, subtype, normal_balance)
    select v_org, t.code, t.name, t.type, t.subtype, t.normal_balance
    from coa_template t;
  insert into audit_log (org_id, action, entity, entity_id)
    values (v_org, 'create', 'organization', v_org);
  return v_org;
end;
$$;
