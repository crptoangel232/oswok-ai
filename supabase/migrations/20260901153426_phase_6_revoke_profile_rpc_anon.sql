-- Oswok Phase 6 security hardening: get_my_profile is a signed-in-only RPC.
revoke execute on function public.get_my_profile() from anon, public;
grant execute on function public.get_my_profile() to authenticated;
