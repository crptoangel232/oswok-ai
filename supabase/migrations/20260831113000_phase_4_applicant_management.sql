create or replace function public.get_my_job_applicants(target_job_id uuid)
returns table (
  application_id uuid,
  job_id uuid,
  worker_id uuid,
  worker_name text,
  worker_phone text,
  worker_location text,
  worker_bio text,
  verification_status text,
  availability text,
  hourly_rate numeric,
  experience_years numeric,
  status text,
  cover_note text,
  applied_at timestamptz
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.jobs j where j.id = target_job_id and j.employer_id = v_uid) then
    raise exception 'You can only manage applicants for your own jobs';
  end if;
  return query
  select a.id, a.job_id, a.worker_id, p.full_name, p.phone, p.location, p.bio,
         p.verification_status::text, wp.availability, wp.hourly_rate, wp.experience_years,
         a.status::text, a.cover_note, a.created_at
  from public.applications a
  join public.profiles p on p.id = a.worker_id
  left join public.worker_profiles wp on wp.user_id = a.worker_id
  where a.job_id = target_job_id
  order by a.created_at asc;
end;
$$;

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
  if new_status not in ('pending','accepted','rejected') then raise exception 'Invalid application status'; end if;
  select a.job_id into v_job_id
  from public.applications a join public.jobs j on j.id=a.job_id
  where a.id=target_application_id and j.employer_id=v_uid;
  if v_job_id is null then raise exception 'Application not found or not owned by you'; end if;
  update public.applications set status=new_status::application_status, updated_at=now() where id=target_application_id;
  return true;
end;
$$;

grant execute on function public.get_my_job_applicants(uuid) to authenticated;
grant execute on function public.update_my_job_application(uuid,text) to authenticated;