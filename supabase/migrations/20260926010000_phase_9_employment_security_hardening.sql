-- Oswok Phase 9: employment lifecycle security hardening.
-- Worker completes active employment; employer confirms payment or cancels.
-- Prevent direct table updates from bypassing the lifecycle RPC.

drop policy if exists "employment participants can update own employment" on public.employments;

revoke update on public.employments from authenticated;

create or replace function public.transition_my_employment(target_employment_id uuid, new_status text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_employment public.employments%rowtype;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if new_status not in ('completed', 'cancelled') then
    raise exception 'Invalid employment status';
  end if;

  select *
  into v_employment
  from public.employments
  where id = target_employment_id
    and (employer_id = v_uid or worker_id = v_uid)
  for update;

  if v_employment.id is null then
    raise exception 'Employment not found or not accessible';
  end if;

  if v_employment.status <> 'active' then
    raise exception 'This employment is already %', v_employment.status;
  end if;

  if new_status = 'completed' and v_employment.worker_id <> v_uid then
    raise exception 'Only the worker can mark an employment completed';
  end if;

  if new_status = 'cancelled' and v_employment.employer_id <> v_uid then
    raise exception 'Only the hirer can cancel an employment';
  end if;

  update public.employments
  set status = new_status,
      completed_at = case
        when new_status = 'completed' then now()
        else null
      end,
      updated_at = now()
  where id = target_employment_id;

  return true;
end;
$$;

revoke execute on function public.transition_my_employment(uuid, text) from anon, public;
grant execute on function public.transition_my_employment(uuid, text) to authenticated;

-- Employers may only create an employment through the hiring flow:
-- the application must belong to the same job/worker and already be accepted.
drop policy if exists "employers can create own employments" on public.employments;

create policy "employers can create own accepted employments"
on public.employments
for insert
to authenticated
with check (
  employer_id = (select auth.uid())
  and exists (
    select 1
    from public.jobs j
    where j.id = job_id
      and j.employer_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.applications a
    where a.id = application_id
      and a.job_id = job_id
      and a.worker_id = worker_id
      and a.status = 'accepted'::public.application_status
  )
);

create unique index if not exists employments_job_unique
  on public.employments (job_id);
