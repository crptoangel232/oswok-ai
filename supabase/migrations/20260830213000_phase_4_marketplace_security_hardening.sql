-- Oswok Phase 4: restrict an internal SECURITY DEFINER helper.
-- The marketplace uses existing jobs/applications tables and RLS policies.
-- rls_auto_enable is an internal helper and must not be callable through the public API.

revoke execute on function public.rls_auto_enable() from anon, authenticated, public;
