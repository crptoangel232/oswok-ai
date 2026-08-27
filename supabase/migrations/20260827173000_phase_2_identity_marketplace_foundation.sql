-- Oswok Phase 2: identity and marketplace foundation.
-- This migration mirrors the schema provisioned in the Oswok Supabase project.

create extension if not exists pgcrypto;

create type public.user_role as enum ('worker','employer','admin');
create type public.account_status as enum ('active','suspended','pending');
create type public.job_status as enum ('draft','open','paused','filled','closed','cancelled');
create type public.application_status as enum ('pending','shortlisted','accepted','rejected','withdrawn');
create type public.verification_status as enum ('unverified','pending','verified','rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role public.user_role not null default 'worker',
  status public.account_status not null default 'active',
  verification_status public.verification_status not null default 'unverified',
  avatar_url text,
  location text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.skills (
  id uuid primary key default gen_random_uuid(), name text not null unique,
  category text, created_at timestamptz not null default now()
);

create table public.worker_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  availability text, hourly_rate numeric(12,2), experience_years numeric(5,2),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.worker_skills (
  worker_id uuid not null references public.worker_profiles(user_id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  created_at timestamptz not null default now(), primary key (worker_id, skill_id)
);

create table public.employer_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  organisation_name text, organisation_type text, website text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employer_profiles(user_id) on delete cascade,
  title text not null, description text not null, category text, location text,
  pay_amount numeric(12,2) not null check (pay_amount >= 0),
  pay_currency text not null default 'SLE',
  status public.job_status not null default 'draft',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.job_skills (
  job_id uuid not null references public.jobs(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  required boolean not null default true, primary key (job_id, skill_id)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  worker_id uuid not null references public.worker_profiles(user_id) on delete cascade,
  status public.application_status not null default 'pending', cover_note text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (job_id, worker_id)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  worker_id uuid not null references public.worker_profiles(user_id) on delete cascade,
  score numeric(5,2) check (score between 0 and 100), reason text,
  created_at timestamptz not null default now(), unique (job_id, worker_id)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete set null,
  worker_id uuid not null references public.worker_profiles(user_id) on delete restrict,
  employer_id uuid not null references public.employer_profiles(user_id) on delete restrict,
  amount numeric(12,2) not null check (amount >= 0), currency text not null default 'SLE',
  status text not null default 'pending' check (status in ('pending','processing','paid','failed','refunded')),
  provider text, provider_reference text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete restrict,
  reviewee_id uuid not null references public.profiles(id) on delete restrict,
  rating integer not null check (rating between 1 and 5), comment text,
  created_at timestamptz not null default now(), unique (transaction_id, reviewer_id)
);

create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references public.transactions(id) on delete set null,
  opened_by uuid not null references public.profiles(id) on delete restrict,
  reason text not null, description text not null,
  status text not null default 'open' check (status in ('open','investigating','resolved','rejected')),
  resolution text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null, entity_type text not null, entity_id uuid,
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create index jobs_employer_id_idx on public.jobs(employer_id);
create index jobs_status_idx on public.jobs(status);
create index jobs_category_idx on public.jobs(category);
create index applications_worker_id_idx on public.applications(worker_id);
create index applications_job_id_idx on public.applications(job_id);
create index matches_worker_id_idx on public.matches(worker_id);
create index transactions_worker_id_idx on public.transactions(worker_id);
create index transactions_employer_id_idx on public.transactions(employer_id);
create index reviews_reviewee_id_idx on public.reviews(reviewee_id);
create index disputes_opened_by_idx on public.disputes(opened_by);
create index audit_logs_actor_id_idx on public.audit_logs(actor_id);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.phone)
  on conflict (id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'active'); $$;

alter table public.profiles enable row level security;
alter table public.skills enable row level security;
alter table public.worker_profiles enable row level security;
alter table public.worker_skills enable row level security;
alter table public.employer_profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.job_skills enable row level security;
alter table public.applications enable row level security;
alter table public.matches enable row level security;
alter table public.transactions enable row level security;
alter table public.reviews enable row level security;
alter table public.disputes enable row level security;
alter table public.audit_logs enable row level security;

-- Public discovery and own-record policies. Admin policies are intentionally explicit.
create policy profiles_select_authenticated on public.profiles for select to authenticated using (status <> 'suspended');
create policy profiles_insert_own on public.profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_update_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_all on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy skills_select_authenticated on public.skills for select to authenticated using (true);
create policy skills_admin_write on public.skills for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy worker_profiles_select_authenticated on public.worker_profiles for select to authenticated using (true);
create policy worker_profiles_own_write on public.worker_profiles for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy worker_profiles_admin_all on public.worker_profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy worker_skills_select_authenticated on public.worker_skills for select to authenticated using (true);
create policy worker_skills_own_write on public.worker_skills for all to authenticated using (worker_id = auth.uid()) with check (worker_id = auth.uid());
create policy worker_skills_admin_all on public.worker_skills for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy employer_profiles_select_authenticated on public.employer_profiles for select to authenticated using (true);
create policy employer_profiles_own_write on public.employer_profiles for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy employer_profiles_admin_all on public.employer_profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy jobs_select_authenticated on public.jobs for select to authenticated using (status = 'open' or employer_id = auth.uid() or public.is_admin());
create policy jobs_employer_insert on public.jobs for insert to authenticated with check (employer_id = auth.uid() and exists (select 1 from public.profiles where id = auth.uid() and role = 'employer'));
create policy jobs_employer_update on public.jobs for update to authenticated using (employer_id = auth.uid() or public.is_admin()) with check (employer_id = auth.uid() or public.is_admin());
create policy jobs_employer_delete on public.jobs for delete to authenticated using (employer_id = auth.uid() or public.is_admin());
create policy job_skills_select_authenticated on public.job_skills for select to authenticated using (true);
create policy job_skills_employer_write on public.job_skills for all to authenticated using (exists (select 1 from public.jobs where id = job_id and employer_id = auth.uid()) or public.is_admin()) with check (exists (select 1 from public.jobs where id = job_id and employer_id = auth.uid()) or public.is_admin());
create policy applications_worker_select_own on public.applications for select to authenticated using (worker_id = auth.uid() or exists (select 1 from public.jobs where id = job_id and employer_id = auth.uid()) or public.is_admin());
create policy applications_worker_insert on public.applications for insert to authenticated with check (worker_id = auth.uid() and exists (select 1 from public.jobs where id = job_id and status = 'open'));
create policy applications_participant_update on public.applications for update to authenticated using (worker_id = auth.uid() or exists (select 1 from public.jobs where id = job_id and employer_id = auth.uid()) or public.is_admin()) with check (worker_id = auth.uid() or exists (select 1 from public.jobs where id = job_id and employer_id = auth.uid()) or public.is_admin());
create policy matches_participant_select on public.matches for select to authenticated using (worker_id = auth.uid() or exists (select 1 from public.jobs where id = job_id and employer_id = auth.uid()) or public.is_admin());
create policy matches_admin_insert on public.matches for insert to authenticated with check (public.is_admin());
create policy matches_admin_update on public.matches for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy transactions_participant_select on public.transactions for select to authenticated using (worker_id = auth.uid() or employer_id = auth.uid() or public.is_admin());
create policy transactions_admin_write on public.transactions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy reviews_participant_select on public.reviews for select to authenticated using (reviewer_id = auth.uid() or reviewee_id = auth.uid() or public.is_admin());
create policy reviews_reviewer_insert on public.reviews for insert to authenticated with check (reviewer_id = auth.uid());
create policy disputes_participant_select on public.disputes for select to authenticated using (opened_by = auth.uid() or exists (select 1 from public.transactions t where t.id = transaction_id and (t.worker_id = auth.uid() or t.employer_id = auth.uid())) or public.is_admin());
create policy disputes_own_insert on public.disputes for insert to authenticated with check (opened_by = auth.uid());
create policy disputes_admin_update on public.disputes for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy audit_logs_admin_select on public.audit_logs for select to authenticated using (public.is_admin());
create policy audit_logs_admin_insert on public.audit_logs for insert to authenticated with check (public.is_admin());

revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.is_admin() from anon, authenticated, public;

insert into public.skills (name, category) values
('General Labour','manual'),('Cleaning','services'),('Delivery','logistics'),('Data Entry','digital'),
('Graphic Design','creative'),('Web Development','technology'),('Social Media Management','marketing'),('Sales','business')
on conflict (name) do nothing;
