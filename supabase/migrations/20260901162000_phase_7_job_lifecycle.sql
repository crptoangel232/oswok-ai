-- Oswok Phase 7: controlled job lifecycle.
-- Existing statuses are preserved; new execution states make the marketplace flow explicit.

alter type public.job_status add value if not exists 'matched';
alter type public.job_status add value if not exists 'accepted';
alter type public.job_status add value if not exists 'in_progress';
alter type public.job_status add value if not exists 'completed';
alter type public.job_status add value if not exists 'payment_confirmed';
alter type public.job_status add value if not exists 'reviewed';
alter type public.job_status add value if not exists 'expired';
alter type public.job_status add value if not exists 'disputed';
alter type public.job_status add value if not exists 'suspended';

create or replace function public.transition_my_job_status(target_job_id uuid, new_status text)
returns public.job_status
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_current public.job_status;
  v_next public.job_status;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if new_status not in ('draft','open','paused','filled','closed','cancelled','matched','accepted','in_progress','completed','payment_confirmed','reviewed','expired','disputed','suspended') then
    raise exception 'Invalid job status';
  end if;

  select j.status into v_current
  from public.jobs j
  where j.id = target_job_id and j.employer_id = v_uid;

  if v_current is null then raise exception 'Job not found or not owned by you'; end if;
  v_next := new_status::public.job_status;

  if v_current = v_next then return v_current; end if;

  if not (
    (v_current='draft' and v_next in ('open','cancelled')) or
    (v_current='open' and v_next in ('paused','matched','closed','cancelled','expired','suspended')) or
    (v_current='paused' and v_next in ('open','cancelled','expired','suspended')) or
    (v_current='filled' and v_next in ('closed','cancelled')) or
    (v_current='matched' and v_next in ('accepted','open','cancelled','disputed','suspended')) or
    (v_current='accepted' and v_next in ('in_progress','cancelled','disputed','suspended')) or
    (v_current='in_progress' and v_next in ('completed','disputed','suspended')) or
    (v_current='completed' and v_next in ('payment_confirmed','disputed')) or
    (v_current='payment_confirmed' and v_next in ('reviewed','disputed'))
  ) then
    raise exception 'Invalid job status transition: % -> %', v_current, v_next;
  end if;

  update public.jobs set status=v_next, updated_at=now() where id=target_job_id and employer_id=v_uid;
  return v_next;
end;
$$;

revoke execute on function public.transition_my_job_status(uuid,text) from anon, public;
grant execute on function public.transition_my_job_status(uuid,text) to authenticated;

create index if not exists jobs_status_created_at_idx on public.jobs(status, created_at desc);
create index if not exists applications_job_status_idx on public.applications(job_id, status);
create index if not exists matches_job_score_idx on public.matches(job_id, score desc);
