alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false;

create or replace function public.set_my_role(new_role public.user_role)
returns public.user_role
language plpgsql
security definer
set search_path = public
as $$
declare
  current_role public.user_role;
  completed boolean;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if new_role not in ('worker', 'employer') then
    raise exception 'Invalid role';
  end if;

  select role, onboarding_completed
  into current_role, completed
  from public.profiles
  where id = auth.uid();

  if current_role is null then
    raise exception 'Profile not found';
  end if;

  if completed then
    raise exception 'Account type is already set';
  end if;

  update public.profiles
  set role = new_role,
      onboarding_completed = true,
      updated_at = now()
  where id = auth.uid();

  return new_role;
end;
$$;

revoke execute on function public.set_my_role(public.user_role) from public, anon;
grant execute on function public.set_my_role(public.user_role) to authenticated;
