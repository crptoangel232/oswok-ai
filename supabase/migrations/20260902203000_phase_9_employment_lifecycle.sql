-- Oswok Phase 9: employment lifecycle.
-- Participants can complete an active employment; only the hirer can cancel it.

create policy "employment participants can update own employment"
on public.employments
for update
to authenticated
using (employer_id = (select auth.uid()) or worker_id = (select auth.uid()))
with check (employer_id = (select auth.uid()) or worker_id = (select auth.uid()));

create or replace function public.transition_my_employment(target_employment_id uuid, new_status text)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_employment public.employments%rowtype;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if new_status not in ('completed','cancelled') then raise exception 'Invalid employment status'; end if;

  select * into v_employment
  from public.employments
  where id = target_employment_id
    and (employer_id = v_uid or worker_id = v_uid)
  for update;

  if v_employment.id is null then raise exception 'Employment not found or not accessible'; end if;
  if v_employment.status <> 'active' then raise exception 'This employment is already %', v_employment.status; end if;
  if new_status = 'cancelled' and v_employment.employer_id <> v_uid then
    raise exception 'Only the hirer can cancel an employment';
  end if;

  update public.employments
  set status = new_status,
      completed_at = case when new_status = 'completed' then now() else null end,
      updated_at = now()
  where id = target_employment_id;

  return true;
end;
$$;

revoke execute on function public.transition_my_employment(uuid,text) from anon, public;
grant execute on function public.transition_my_employment(uuid,text) to authenticated;
