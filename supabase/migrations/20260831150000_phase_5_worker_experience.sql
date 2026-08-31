-- Oswok Phase 5: worker application centre and marketplace read model.
-- Additive only: existing Phase 4 tables, RPCs and policies remain unchanged.

create or replace function public.get_my_applications()
returns table (
  application_id uuid,
  job_id uuid,
  job_title text,
  job_category text,
  job_location text,
  pay_amount numeric,
  pay_currency text,
  job_status text,
  employer_name text,
  application_status text,
  cover_note text,
  applied_at timestamptz,
  updated_at timestamptz
)
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
    where p.id = v_uid and p.role = 'worker'::public.user_role and p.status = 'active'::public.account_status
  ) then
    raise exception 'Only active worker accounts can view applications';
  end if;

  return query
  select a.id,
         j.id,
         j.title,
         j.category,
         j.location,
         j.pay_amount,
         j.pay_currency,
         j.status::text,
         coalesce(ep.organisation_name, 'Oswok employer'),
         a.status::text,
         a.cover_note,
         a.created_at,
         a.updated_at
  from public.applications a
  join public.jobs j on j.id = a.job_id
  left join public.employer_profiles ep on ep.user_id = j.employer_id
  where a.worker_id = v_uid
  order by a.updated_at desc, a.created_at desc;
end;
$$;

revoke execute on function public.get_my_applications() from anon, public;
grant execute on function public.get_my_applications() to authenticated;
