-- Oswok Phase 9: employment completion, payment confirmation and reviews hardening.
-- Keeps email verification as the only verification gate for the MVP.
-- This migration aligns the employment status constraint with the Phase 9 lifecycle
-- already implemented by the application and restricts sensitive RPC execution.

alter table public.employments
  drop constraint if exists employments_status_check;

alter table public.employments
  add constraint employments_status_check
  check (status in ('active', 'completed', 'cancelled', 'payment_confirmed', 'reviewed'));

create unique index if not exists reviews_transaction_reviewer_unique
  on public.reviews (transaction_id, reviewer_id);

revoke execute on function public.confirm_employment_payment(uuid) from anon, public;
grant execute on function public.confirm_employment_payment(uuid) to authenticated;

revoke execute on function public.review_my_employment(uuid, integer, text) from anon, public;
grant execute on function public.review_my_employment(uuid, integer, text) to authenticated;

revoke execute on function public.transition_my_employment(uuid, text) from anon, public;
grant execute on function public.transition_my_employment(uuid, text) to authenticated;

-- Keep the employment read RPC available only to signed-in users.
revoke execute on function public.get_my_employments() from anon, public;
grant execute on function public.get_my_employments() to authenticated;
