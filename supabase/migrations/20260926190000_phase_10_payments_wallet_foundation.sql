-- Oswok Phase 10: payment and wallet foundation.
-- Internal SLE wallet credits completed employment payments.
-- External Mobile Money provider settlement remains behind the payout adapter.

create table if not exists public.wallet_accounts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  balance numeric(14,2) not null default 0 check (balance >= 0),
  currency text not null default 'SLE',
  status text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete set null,
  payout_request_id uuid,
  entry_type text not null check (entry_type in ('credit','debit','refund')),
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'SLE',
  description text,
  created_at timestamptz not null default now()
);

create unique index if not exists wallet_ledger_transaction_credit_unique
  on public.wallet_ledger(transaction_id, entry_type)
  where transaction_id is not null and entry_type = 'credit';

create table if not exists public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'SLE',
  provider text not null check (provider in ('orange_money','africell_money','qcell_money','manual')),
  account_phone text not null,
  status text not null default 'pending' check (status in ('pending','processing','paid','failed','cancelled')),
  provider_reference text,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wallet_accounts enable row level security;
alter table public.wallet_ledger enable row level security;
alter table public.payout_requests enable row level security;

drop policy if exists wallet_accounts_owner_select on public.wallet_accounts;
create policy wallet_accounts_owner_select on public.wallet_accounts for select to authenticated using (user_id = (select auth.uid()) or is_admin());

drop policy if exists wallet_ledger_owner_select on public.wallet_ledger;
create policy wallet_ledger_owner_select on public.wallet_ledger for select to authenticated using (user_id = (select auth.uid()) or is_admin());

drop policy if exists payout_requests_owner_select on public.payout_requests;
create policy payout_requests_owner_select on public.payout_requests for select to authenticated using (worker_id = (select auth.uid()) or is_admin());

drop policy if exists payout_requests_owner_insert on public.payout_requests;
create policy payout_requests_owner_insert on public.payout_requests for insert to authenticated with check (worker_id = (select auth.uid()));

revoke insert, update, delete on public.wallet_accounts from authenticated;
revoke insert, update, delete on public.wallet_ledger from authenticated;
revoke update, delete on public.payout_requests from authenticated;

create or replace function public.confirm_employment_payment(target_employment_id uuid)
returns uuid language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_employment public.employments%rowtype;
  v_transaction_id uuid;
  v_amount numeric;
  v_currency text;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  select * into v_employment from public.employments where id = target_employment_id and employer_id = v_uid for update;
  if v_employment.id is null then raise exception 'Employment not found or not accessible'; end if;
  if v_employment.status <> 'completed' then raise exception 'Work must be completed before payment is confirmed'; end if;

  select j.pay_amount, j.pay_currency into v_amount, v_currency from public.jobs j where j.id = v_employment.job_id;
  if v_amount is null or v_amount <= 0 then raise exception 'Job payment amount is invalid'; end if;

  select id into v_transaction_id from public.transactions
  where job_id = v_employment.job_id and worker_id = v_employment.worker_id and employer_id = v_employment.employer_id
  order by created_at desc limit 1;

  if v_transaction_id is null then
    insert into public.transactions(job_id, worker_id, employer_id, amount, currency, status, provider)
    values(v_employment.job_id, v_employment.worker_id, v_employment.employer_id, v_amount, v_currency, 'paid', 'oswok_wallet')
    returning id into v_transaction_id;
  else
    update public.transactions set status = 'paid', provider = coalesce(provider, 'oswok_wallet'), updated_at = now() where id = v_transaction_id;
  end if;

  insert into public.wallet_accounts(user_id, balance, currency) values(v_employment.worker_id, 0, v_currency) on conflict (user_id) do nothing;

  insert into public.wallet_ledger(user_id, transaction_id, entry_type, amount, currency, description)
  values(v_employment.worker_id, v_transaction_id, 'credit', v_amount, v_currency, 'Payment for completed employment')
  on conflict do nothing;

  if found then
    update public.wallet_accounts set balance = balance + v_amount, currency = v_currency, updated_at = now() where user_id = v_employment.worker_id;
  end if;

  update public.employments set status = 'payment_confirmed', updated_at = now() where id = target_employment_id;
  return v_transaction_id;
end;
$$;

create or replace function public.get_my_wallet()
returns table(balance numeric, currency text, status text)
language plpgsql security definer set search_path = public
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  insert into public.wallet_accounts(user_id) values(v_uid) on conflict (user_id) do nothing;
  return query select w.balance,w.currency,w.status from public.wallet_accounts w where w.user_id = v_uid;
end;
$$;

create or replace function public.get_my_wallet_ledger()
returns table(id uuid, entry_type text, amount numeric, currency text, description text, created_at timestamptz)
language plpgsql security definer set search_path = public
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  return query select l.id,l.entry_type,l.amount,l.currency,l.description,l.created_at from public.wallet_ledger l where l.user_id = v_uid order by l.created_at desc;
end;
$$;

create or replace function public.request_payout(payout_amount numeric, payout_provider text, payout_phone text)
returns uuid language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_balance numeric;
  v_currency text;
  v_request_id uuid;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if payout_amount <= 0 then raise exception 'Payout amount must be greater than zero'; end if;
  if payout_provider not in ('orange_money','africell_money','qcell_money','manual') then raise exception 'Unsupported payout provider'; end if;
  if length(trim(payout_phone)) < 8 then raise exception 'Enter a valid payout phone number'; end if;

  select balance,currency into v_balance,v_currency from public.wallet_accounts where user_id=v_uid for update;
  if v_balance is null then raise exception 'Wallet not found'; end if;
  if payout_amount > v_balance then raise exception 'Insufficient wallet balance'; end if;

  insert into public.payout_requests(worker_id,amount,currency,provider,account_phone)
  values(v_uid,payout_amount,v_currency,payout_provider,trim(payout_phone))
  returning id into v_request_id;

  update public.wallet_accounts set balance=balance-payout_amount,updated_at=now() where user_id=v_uid;

  insert into public.wallet_ledger(user_id,payout_request_id,entry_type,amount,currency,description)
  values(v_uid,v_request_id,'debit',payout_amount,v_currency,'Payout requested');

  return v_request_id;
end;
$$;

revoke execute on function public.confirm_employment_payment(uuid) from anon, public;
grant execute on function public.confirm_employment_payment(uuid) to authenticated;
revoke execute on function public.get_my_wallet() from anon, public;
grant execute on function public.get_my_wallet() to authenticated;
revoke execute on function public.get_my_wallet_ledger() from anon, public;
grant execute on function public.get_my_wallet_ledger() to authenticated;
revoke execute on function public.request_payout(numeric,text,text) from anon, public;
grant execute on function public.request_payout(numeric,text,text) to authenticated;
