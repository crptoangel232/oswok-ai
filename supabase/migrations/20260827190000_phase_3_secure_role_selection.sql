drop policy if exists profiles_update_own on public.profiles;

create policy profiles_update_own
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and role = (select role from public.profiles where id = auth.uid())
);

create or replace function public.set_my_role(new_role public.user_role)
returns public.user_role
language plpgsql
security definer
set search_path = public
as $$
declare
  current_role public.user_role;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if new_role not in ('worker', 'employer') then
    raise exception 'Invalid role';
  end if;

  select role into current_role
  from public.profiles
  where id = auth.uid();

  if current_role is null then
    raise exception 'Profile not found';
  end if;

  if current_role <> 'worker' and current_role <> new_role then
    raise exception 'Role cannot be changed after onboarding';
  end if;

  update public.profiles
  set role = new_role, updated_at = now()
  where id = auth.uid();

  return new_role;
end;
$$;

revoke execute on function public.set_my_role(public.user_role) from public, anon;
grant execute on function public.set_my_role(public.user_role) to authenticated;
