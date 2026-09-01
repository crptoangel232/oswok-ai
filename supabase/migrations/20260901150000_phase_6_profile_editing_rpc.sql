drop function if exists public.get_my_profile();

create function public.get_my_profile()
returns table (
  id uuid,
  full_name text,
  role public.user_role,
  status public.account_status,
  location text,
  verification_status public.verification_status,
  onboarding_completed boolean,
  bio text
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id,
         p.full_name,
         p.role,
         p.status,
         p.location,
         p.verification_status,
         p.onboarding_completed,
         p.bio
  from public.profiles p
  where p.id = auth.uid()
    and auth.uid() is not null;
$$;

grant execute on function public.get_my_profile() to authenticated;
revoke execute on function public.get_my_profile() from anon;
