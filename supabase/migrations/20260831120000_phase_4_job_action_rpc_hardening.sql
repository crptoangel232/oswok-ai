create or replace function public.create_my_job(
  new_title text,
  new_description text,
  new_category text default null,
  new_location text default null,
  new_pay_amount numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_job_id uuid;
  v_role public.user_role;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  select role into v_role
  from public.profiles
  where id = v_user_id and status = 'active'::public.account_status;

  if v_role is null then raise exception 'Profile not found or inactive'; end if;
  if v_role <> 'employer'::public.user_role then raise exception 'Only hirer accounts can post jobs'; end if;
  if not exists (select 1 from public.employer_profiles where user_id = v_user_id) then raise exception 'Hirer profile is incomplete'; end if;
  if length(trim(coalesce(new_title, ''))) < 3 then raise exception 'Enter a job title'; end if;
  if length(trim(coalesce(new_description, ''))) < 20 then raise exception 'Give the job a useful description of at least 20 characters'; end if;
  if new_pay_amount is null or new_pay_amount <= 0 then raise exception 'Enter a valid positive pay amount'; end if;

  insert into public.jobs (employer_id, title, description, category, location, pay_amount, pay_currency, status)
  values (v_user_id, trim(new_title), trim(new_description), nullif(trim(coalesce(new_category, '')), ''), nullif(trim(coalesce(new_location, '')), ''), new_pay_amount, 'SLE', 'open'::public.job_status)
  returning id into v_job_id;

  return v_job_id;
end;
$$;

grant execute on function public.create_my_job(text,text,text,text,numeric) to authenticated;

create or replace function public.apply_to_job(
  target_job_id uuid,
  new_cover_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_role public.user_role;
  v_application_id uuid;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  select role into v_role
  from public.profiles
  where id = v_user_id and status = 'active'::public.account_status;

  if v_role <> 'worker'::public.user_role then raise exception 'Only worker accounts can apply for jobs'; end if;
  if not exists (select 1 from public.worker_profiles where user_id = v_user_id) then raise exception 'Worker profile is incomplete'; end if;
  if not exists (select 1 from public.jobs where id = target_job_id and status = 'open'::public.job_status) then raise exception 'This job is not available for applications'; end if;

  insert into public.applications (job_id, worker_id, cover_note, status)
  values (target_job_id, v_user_id, nullif(trim(coalesce(new_cover_note, '')), ''), 'pending'::public.application_status)
  returning id into v_application_id;

  return v_application_id;
exception when unique_violation then
  raise exception 'You have already applied for this job';
end;
$$;

grant execute on function public.apply_to_job(uuid,text) to authenticated;
