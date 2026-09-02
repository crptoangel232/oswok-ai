create or replace function public.confirm_employment_payment(target_employment_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_employment public.employments%rowtype;
  v_transaction_id uuid;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  select * into v_employment from public.employments where id = target_employment_id and employer_id = v_uid for update;
  if v_employment.id is null then raise exception 'Employment not found or not accessible'; end if;
  if v_employment.status <> 'completed' then raise exception 'Work must be completed before payment is confirmed'; end if;
  select id into v_transaction_id from public.transactions where job_id = v_employment.job_id and worker_id = v_employment.worker_id and employer_id = v_employment.employer_id order by created_at desc limit 1;
  if v_transaction_id is null then
    insert into public.transactions(job_id, worker_id, employer_id, amount, currency, status, provider)
    select j.id, v_employment.worker_id, v_employment.employer_id, j.pay_amount, j.pay_currency, 'paid', 'manual_confirmation'
    from public.jobs j where j.id = v_employment.job_id returning id into v_transaction_id;
  else
    update public.transactions set status = 'paid', updated_at = now() where id = v_transaction_id;
  end if;
  update public.employments set status = 'payment_confirmed', updated_at = now() where id = target_employment_id;
  return v_transaction_id;
end;
$$;

create or replace function public.review_my_employment(target_employment_id uuid, new_rating integer, new_comment text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_employment public.employments%rowtype;
  v_transaction_id uuid;
  v_reviewee uuid;
  v_review_id uuid;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if new_rating < 1 or new_rating > 5 then raise exception 'Rating must be between 1 and 5'; end if;
  select * into v_employment from public.employments where id = target_employment_id and (employer_id = v_uid or worker_id = v_uid) for update;
  if v_employment.id is null then raise exception 'Employment not found or not accessible'; end if;
  if v_employment.status not in ('payment_confirmed','reviewed') then raise exception 'Payment must be confirmed before leaving a review'; end if;
  if v_uid = v_employment.employer_id then v_reviewee := v_employment.worker_id; else v_reviewee := v_employment.employer_id; end if;
  select id into v_transaction_id from public.transactions where job_id = v_employment.job_id and worker_id = v_employment.worker_id and employer_id = v_employment.employer_id and status = 'paid' order by created_at desc limit 1;
  if v_transaction_id is null then raise exception 'Payment transaction not found'; end if;
  if exists (select 1 from public.reviews where transaction_id = v_transaction_id and reviewer_id = v_uid) then raise exception 'You have already reviewed this employment'; end if;
  insert into public.reviews(transaction_id, reviewer_id, reviewee_id, rating, comment)
  values(v_transaction_id, v_uid, v_reviewee, new_rating, nullif(trim(new_comment), '')) returning id into v_review_id;
  if (select count(*) from public.reviews where transaction_id = v_transaction_id) >= 2 then
    update public.employments set status = 'reviewed', updated_at = now() where id = target_employment_id;
  end if;
  return v_review_id;
end;
$$;

grant execute on function public.confirm_employment_payment(uuid) to authenticated;
grant execute on function public.review_my_employment(uuid, integer, text) to authenticated;
