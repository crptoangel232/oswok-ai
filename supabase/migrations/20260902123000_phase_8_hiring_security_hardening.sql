-- Oswok Phase 8: keep hiring RPC under normal RLS instead of SECURITY DEFINER.
-- This preserves role ownership checks while avoiding an exposed privileged function.

create policy "employers can create own employments" on public.employments
  for insert to authenticated
  with check (
    employer_id = (select auth.uid())
    and exists (select 1 from public.jobs j where j.id = job_id and j.employer_id = (select auth.uid()))
    and exists (select 1 from public.applications a where a.id = application_id and a.job_id = job_id and a.worker_id = worker_id)
  );

create or replace function public.hire_worker(target_application_id uuid)
returns uuid
language plpgsql
security invoker
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
  select a.job_id, a.worker_id, j.status into v_job_id, v_worker_id, v_job_status
  from public.applications a join public.jobs j on j.id = a.job_id
  where a.id = target_application_id and j.employer_id = v_uid;
  if v_job_id is null then raise exception 'Application not found or not owned by you'; end if;
  if v_job_status not in ('open','paused','matched') then raise exception 'This job is not available for hiring'; end if;
  if exists (select 1 from public.employments e where e.job_id = v_job_id) then raise exception 'This job already has a hired worker'; end if;
  update public.applications set status='accepted'::public.application_status, updated_at=now() where id=target_application_id;
  insert into public.employments(job_id,application_id,employer_id,worker_id) values(v_job_id,target_application_id,v_uid,v_worker_id) returning id into v_employment_id;
  update public.jobs set status='accepted'::public.job_status, updated_at=now() where id=v_job_id;
  return v_employment_id;
end;
$$;

revoke execute on function public.hire_worker(uuid) from anon, public;
grant execute on function public.hire_worker(uuid) to authenticated;
