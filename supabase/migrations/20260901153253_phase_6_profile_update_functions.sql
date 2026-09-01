-- Oswok Phase 6: secure profile update functions.
-- Invoker functions preserve RLS and only allow the authenticated owner to edit their own role-specific profile.

create or replace function public.update_my_worker_profile(
  new_full_name text,
  new_location text,
  new_bio text,
  new_availability text,
  new_hourly_rate numeric,
  new_experience_years numeric
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = v_uid
      and p.role = 'worker'::public.user_role
      and p.status = 'active'::public.account_status
  ) then
    raise exception 'Only active worker accounts can edit a worker profile';
  end if;

  update public.profiles
  set full_name = new_full_name,
      location = nullif(trim(new_location), ''),
      bio = nullif(trim(new_bio), ''),
      updated_at = now()
  where id = v_uid;

  insert into public.worker_profiles (user_id, availability, hourly_rate, experience_years, updated_at)
  values (v_uid, nullif(trim(new_availability), ''), new_hourly_rate, new_experience_years, now())
  on conflict (user_id) do update
    set availability = excluded.availability,
        hourly_rate = excluded.hourly_rate,
        experience_years = excluded.experience_years,
        updated_at = now();
end;
$$;

create or replace function public.update_my_employer_profile(
  new_full_name text,
  new_location text,
  new_bio text,
  new_organisation_name text,
  new_organisation_type text,
  new_website text
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = v_uid
      and p.role = 'employer'::public.user_role
      and p.status = 'active'::public.account_status
  ) then
    raise exception 'Only active hirer accounts can edit a hirer profile';
  end if;

  update public.profiles
  set full_name = new_full_name,
      location = nullif(trim(new_location), ''),
      bio = nullif(trim(new_bio), ''),
      updated_at = now()
  where id = v_uid;

  insert into public.employer_profiles (user_id, organisation_name, organisation_type, website, updated_at)
  values (v_uid, new_organisation_name, nullif(trim(new_organisation_type), ''), nullif(trim(new_website), ''), now())
  on conflict (user_id) do update
    set organisation_name = excluded.organisation_name,
        organisation_type = excluded.organisation_type,
        website = excluded.website,
        updated_at = now();
end;
$$;

revoke execute on function public.update_my_worker_profile(text,text,text,text,numeric,numeric) from anon, public;
grant execute on function public.update_my_worker_profile(text,text,text,text,numeric,numeric) to authenticated;
revoke execute on function public.update_my_employer_profile(text,text,text,text,text,text) from anon, public;
grant execute on function public.update_my_employer_profile(text,text,text,text,text,text) to authenticated;
