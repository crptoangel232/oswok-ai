-- Oswok Phase 10 hardening: worker-only wallet and payout access.
-- Keep wallet mutations behind SECURITY DEFINER RPCs and least-privilege grants.

create or replace function public.get_my_wallet()
returns table(balance numeric, currency text, status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role public.user_role;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  select role into v_role from public.profiles where id = v_uid;
  if v_role <> 'worker' then raise exception 'Only workers have wallets'; end if;

  insert into public.wallet_accounts(user_id)
  values (v_uid)
  on conflict (user_id) do nothing;

  return query
    select w.balance, w.currency, w.status
    from public.wallet_accounts w
    where w.user_id = v_uid;
end;
$$;

create or replace function public.get_my_wallet_ledger()
returns table(
  id uuid,
  entry_type text,
  amount numeric,
  currency text,
  description text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role public.user_role;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  select role into v_role from public.profiles where id = v_uid;
  if v_role <> 'worker' then raise exception 'Only workers have wallets'; end if;

  return query
    select l.id, l.entry_type, l.amount, l.currency, l.description, l.created_at
    from public.wallet_ledger l
    where l.user_id = v_uid
    order by l.created_at desc;
end;
$$;

create or replace function public.request_payout(
  payout_amount numeric,
  payout_provider text,
  payout_phone text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role public.user_role;
  v_balance numeric;
  v_currency text;
  v_status text;
  v_request_id uuid;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;

  select role into v_role
  from public.profiles
  where id = v_uid;

  if v_role <> 'worker' then
    raise exception 'Only workers can request payouts';
  end if;

  if payout_amount <= 0 then
    raise exception 'Payout amount must be greater than zero';
  end if;

  if payout_provider not in ('orange_money','africell_money','qcell_money','manual') then
    raise exception 'Unsupported payout provider';
  end if;

  if length(trim(payout_phone)) < 8 then
    raise exception 'Enter a valid payout phone number';
  end if;

  select balance, currency, status
  into v_balance, v_currency, v_status
  from public.wallet_accounts
  where user_id = v_uid
  for update;

  if v_balance is null then raise exception 'Wallet not found'; end if;
  if v_status <> 'active' then raise exception 'Wallet is suspended'; end if;
  if payout_amount > v_balance then raise exception 'Insufficient wallet balance'; end if;

  insert into public.payout_requests(
    worker_id, amount, currency, provider, account_phone
  )
  values(
    v_uid, payout_amount, v_currency, payout_provider, trim(payout_phone)
  )
  returning id into v_request_id;

  update public.wallet_accounts
  set balance = balance - payout_amount,
      updated_at = now()
  where user_id = v_uid;

  insert into public.wallet_ledger(
    user_id, payout_request_id, entry_type, amount, currency, description
  )
  values(
    v_uid, v_request_id, 'debit', payout_amount, v_currency, 'Payout requested'
  );

  return v_request_id;
end;
$$;

alter table public.wallet_accounts enable row level security;
alter table public.wallet_ledger enable row level security;
alter table public.payout_requests enable row level security;

revoke all on public.wallet_accounts from anon;
revoke all on public.wallet_ledger from anon;
revoke all on public.payout_requests from anon;

revoke all on public.wallet_accounts from authenticated;
revoke all on public.wallet_ledger from authenticated;
revoke update, delete on public.payout_requests from authenticated;

grant select on public.wallet_accounts to authenticated;
grant select on public.wallet_ledger to authenticated;
grant select, insert on public.payout_requests to authenticated;

revoke execute on function public.get_my_wallet() from public, anon;
revoke execute on function public.get_my_wallet_ledger() from public, anon;
revoke execute on function public.request_payout(numeric,text,text) from public, anon;

grant execute on function public.get_my_wallet() to authenticated;
grant execute on function public.get_my_wallet_ledger() to authenticated;
grant execute on function public.request_payout(numeric,text,text) to authenticated;
