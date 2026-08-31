-- Phase 4 security hardening.
-- These RPCs are application-internal and must never be callable by anonymous clients.
revoke execute on function public.apply_to_job(uuid, text) from anon;
revoke execute on function public.create_my_job(text, text, text, text, numeric) from anon;
revoke execute on function public.get_my_job_applicants(uuid) from anon;
revoke execute on function public.update_my_job_application(uuid, text) from anon;
revoke execute on function public.complete_my_onboarding(text, text, text, text, text, text) from anon;
revoke execute on function public.get_my_profile() from anon;
revoke execute on function public.set_my_role(public.user_role) from anon;
revoke execute on function public.is_admin() from anon;

grant execute on function public.apply_to_job(uuid, text) to authenticated;
grant execute on function public.create_my_job(text, text, text, text, numeric) to authenticated;
grant execute on function public.get_my_job_applicants(uuid) to authenticated;
grant execute on function public.update_my_job_application(uuid, text) to authenticated;
grant execute on function public.complete_my_onboarding(text, text, text, text, text, text) to authenticated;
grant execute on function public.get_my_profile() to authenticated;
grant execute on function public.set_my_role(public.user_role) to authenticated;
grant execute on function public.is_admin() to authenticated;
