-- Oswok Phase 8: employment hiring workflow.
-- Keeps email verification as the only verification gate for now.
-- Adds an explicit employment record when an employer hires a worker.

create table if not exists public.employments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  application_id uuid not null unique references public.applications(id) on delete restrict,
  employer_id uuid not null references public.profiles(id) on delete restrict,
  worker_id uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'active' check (status in ('active','completed','cancelled')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id)
);

alter table public.employments enable row level security;

drop policy if exists "workers can view own employments" on public.employments;
drop policy if exists "employers can view own employments" on public.employments;
create policy "workers can view own employments" on public.employments
  for select to authenticated using (worker_id = auth.uid());
create policy "employers can view own employments" on public.employments
  for select to authenticated using (employer_id = auth.uid());

create or replace function public.hire_worker(target_application_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_job_id uuid;
  v_worker_id uuid;
  v_job_status public.job_status;
  v_employment_id uuid;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;

  select a.job_id, a.worker_id, j.status
    into v_job_id, v_worker_id, v_job_status
  from public.applications a
  join public.jobs j on j.id = a.job_id
  where a.id = target_application_id
    and j.employer_id = v_uid;

  if v_job_id is null then raise exception 'Application not found or not owned by you'; end if;
  if v_job_status not in ('open','paused','matched') then raise exception 'This job is not available for hiring'; end if;
  if exists (select 1 from public.employments e where e.job_id = v_job_id) then raise exception 'This job already has a hired worker'; end if;

  update public.applications
    set status = 'accepted'::public.application_status, updated_at = now()
  where id = target_application_id;

  insert into public.employments (job_id, application_id, employer_id, worker_id)
  values (v_job_id, target_application_id, v_uid, v_worker_id)
  returning id into v_employment_id;

  update public.jobs
    set status = 'accepted'::public.job_status, updated_at = now()
  where id = v_job_id;

  return v_employment_id;
end;
$$;

create or replace function public.get_my_employments()
returns table (
  employment_id uuid,
  job_id uuid,
  job_title text,
  employer_id uuid,
  employer_name text,
  worker_id uuid,
  worker_name text,
  status text,
  started_at timestamptz
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  return query
  select e.id, e.job_id, j.title, e.employer_id,
         coalesce(ep.organisation_name, ep_profile.full_name, 'Employer'),
         e.worker_id, coalesce(wp_profile.full_name, 'Worker'),
         e.status, e.started_at
  from public.employments e
  join public.jobs j on j.id = e.job_id
  left join public.employer_profiles ep on ep.user_id = e.employer_id
  left join public.profiles ep_profile on ep_profile.id = e.employer_id
  left join public.profiles wp_profile on wp_profile.id = e.worker_id
  where e.worker_id = v_uid or e.employer_id = v_uid
  order by e.started_at desc;
end;
$$;

revoke execute on function public.hire_worker(uuid) from anon, public;
grant execute on function public.hire_worker(uuid) to authenticated;
revoke execute on function public.get_my_employments() from anon, public;
grant execute on function public.get_my_employments() to authenticated;

create or replace function public.update_my_job_application(target_application_id uuid, new_status text)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_job_id uuid;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if new_status not in ('pending','shortlisted','accepted','rejected') then raise exception 'Invalid application status'; end if;
  select a.job_id into v_job_id
  from public.applications a join public.jobs j on j.id=a.job_id
  where a.id=target_application_id and j.employer_id=v_uid;
  if v_job_id is null then raise exception 'Application not found or not owned by you'; end if;
  if new_status = 'accepted' then
    raise exception 'Use the Hire worker action to accept an applicant';
  end if;
  update public.applications set status=new_status::public.application_status, updated_at=now() where id=target_application_id;
  return true;
end;
$$;

grant execute on function public.update_my_job_application(uuid,text) to authenticated;
