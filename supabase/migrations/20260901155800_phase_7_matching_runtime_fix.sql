-- Phase 7 follow-up: preserve deterministic ordering by job creation time.
-- The final definition below is intentionally identical in behaviour to the Phase 7 matcher,
-- with the internal created_at column explicitly selected for ordering.
create or replace function public.get_my_recommended_jobs(limit_count integer default 10)
returns table (job_id uuid, title text, description text, category text, location text, pay_amount numeric, pay_currency text, employer_name text, employer_verification text, score numeric, reason text)
language plpgsql security invoker set search_path = public
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.profiles p where p.id=v_uid and p.role='worker'::public.user_role and p.status='active'::public.account_status) then raise exception 'Only active worker accounts can view recommendations'; end if;
  return query
  with worker as (select p.id,p.location,p.bio,p.verification_status,wp.experience_years,wp.availability from public.profiles p left join public.worker_profiles wp on wp.user_id=p.id where p.id=v_uid),
  scored as (
    select j.id as job_id,j.title,j.description,j.category,j.location,j.pay_amount,j.pay_currency,j.created_at,coalesce(ep.organisation_name,'Oswok employer') as employer_name,coalesce(ep_owner.verification_status::text,'unverified') as employer_verification,
      least(100,(case when j.location is not null and w.location is not null and lower(trim(j.location))=lower(trim(w.location)) then 25 else 0 end + case when w.verification_status='verified'::public.verification_status then 15 else 0 end + case when coalesce(w.experience_years,0)>=2 then 15 when coalesce(w.experience_years,0)>=1 then 8 else 0 end + case when w.availability is not null and trim(w.availability)<>'' then 10 else 0 end + case when j.category is not null and (exists (select 1 from public.worker_skills ws join public.skills s on s.id=ws.skill_id where ws.worker_id=w.id and (lower(s.name)=lower(j.category) or lower(coalesce(s.category,''))=lower(j.category))) or lower(coalesce(w.bio,'')) like '%'||lower(j.category)||'%') then 25 else 0 end))::numeric as score,
      concat_ws(' · ',case when j.category is not null and (exists (select 1 from public.worker_skills ws join public.skills s on s.id=ws.skill_id where ws.worker_id=w.id and (lower(s.name)=lower(j.category) or lower(coalesce(s.category,''))=lower(j.category))) or lower(coalesce(w.bio,'')) like '%'||lower(j.category)||'%') then 'Relevant skills or experience' end,case when j.location is not null and w.location is not null and lower(trim(j.location))=lower(trim(w.location)) then 'Same location' end,case when w.verification_status='verified'::public.verification_status then 'Verified profile' end,case when coalesce(w.experience_years,0)>=1 then 'Relevant experience' end,case when w.availability is not null and trim(w.availability)<>'' then 'Availability provided' end) as reason
    from public.jobs j join worker w on true left join public.employer_profiles ep on ep.user_id=j.employer_id left join public.profiles ep_owner on ep_owner.id=j.employer_id
    where j.status='open'::public.job_status and j.employer_id<>v_uid and not exists (select 1 from public.applications a where a.job_id=j.id and a.worker_id=v_uid)
  )
  select s.job_id,s.title,s.description,s.category,s.location,s.pay_amount,s.pay_currency,s.employer_name,s.employer_verification,s.score,coalesce(nullif(s.reason,''),'Open opportunity based on your current profile') from scored s order by s.score desc,s.created_at desc limit greatest(1,least(coalesce(limit_count,10),50));
end;
$$;
revoke execute on function public.get_my_recommended_jobs(integer) from anon, public;
grant execute on function public.get_my_recommended_jobs(integer) to authenticated;
