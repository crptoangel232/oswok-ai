-- Phase 7: indexes supporting recommendation lookups.
create index if not exists worker_skills_skill_id_idx on public.worker_skills(skill_id);
create index if not exists job_skills_skill_id_idx on public.job_skills(skill_id);
create index if not exists profiles_role_status_idx on public.profiles(role,status);
