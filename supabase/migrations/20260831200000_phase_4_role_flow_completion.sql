-- Oswok Phase 4: complete role-specific onboarding atomically.
-- This prevents the profile from being marked complete when the role-specific
-- profile insert/update fails halfway through onboarding.

create or replace function public.complete_my_onboarding(
  new_role text,
  new_full_name text,
  new_location text,
  new_phone text default null,
  new_organisation_name text default null,
  new_organisation_type text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  user_id uuid := auth.uid();
  completed boolean;
begin
  if user_id is null then
    raise exception 'Not authenticated';
  end if;

  if new_role not in ('worker', 'employer') then
    raise exception 'Invalid account type';
  end if;

  if length(trim(coalesce(new_full_name, ''))) < 2 then
    raise exception 'Enter your full name';
  end if;

  if length(trim(coalesce(new_location, ''))) < 2 then
    raise exception 'Enter your location';
  end if;

  select onboarding_completed into completed
  from public.profiles
  where id = user_id
  for update;

  if not found then
    raise exception 'Profile not found';
  end if;

  if completed then
    raise exception 'Account onboarding is already complete';
  end if;

  update public.profiles
  set full_name = trim(new_full_name),
      location = trim(new_location),
      phone = nullif(trim(coalesce(new_phone, '')), ''),
      role = new_role::public.user_role,
      onboarding_completed = true,
      updated_at = now()
  where id = user_id;

  if new_role = 'worker' then
    insert into public.worker_profiles (user_id)
    values (user_id)
    on conflict (user_id) do update
      set updated_at = now();
  else
    if length(trim(coalesce(new_organisation_name, ''))) < 2 then
      raise exception 'Enter your organisation or business name';
    end if;

    insert into public.employer_profiles (user_id, organisation_name, organisation_type)
    values (
      user_id,
      trim(new_organisation_name),
      nullif(trim(coalesce(new_organisation_type, '')), '')
    )
    on conflict (user_id) do update
      set organisation_name = excluded.organisation_name,
          organisation_type = excluded.organisation_type,
          updated_at = now();
  end if;
end;
$$;

revoke execute on function public.complete_my_onboarding(text, text, text, text, text, text) from anon, public;
grant execute on function public.complete_my_onboarding(text, text, text, text, text, text) to authenticated;
