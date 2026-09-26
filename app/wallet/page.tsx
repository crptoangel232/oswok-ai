import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requestPayout } from './actions'

export default async function WalletPage({ searchParams }: { searchParams: Promise<{ error?: string; payout?: string }> }) {
  const query = await searchParams
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims?.sub) redirect('/login')

  const { data: wallet } = await supabase.rpc('get_my_wallet').maybeSingle()
  const { data: ledger } = await supabase.rpc('get_my_wallet_ledger')

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Oswok Wallet</p>
        <h1 className="mt-2 text-3xl font-bold">Your earnings</h1>
        <p className="mt-2 text-slate-400">Money earned from completed work is credited here. External Mobile Money settlement is still behind the payout provider connection.</p>

        <section className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-7">
          <p className="text-sm text-slate-400">Available balance</p>
          <p className="mt-2 text-4xl font-bold">{wallet ? `${wallet.currency} ${Number(wallet.balance).toLocaleString()}` : 'SLE 0'}</p>
          <p className="mt-2 text-sm capitalize text-slate-500">{wallet?.status ?? 'active'}</p>
        </section>

        {query.error ? <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{query.error}</div> : null}
        {query.payout === '1' ? <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">Payout request submitted.</div> : null}

        <section className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-7">
          <h2 className="font-semibold">Request payout</h2>
          <p className="mt-1 text-sm text-slate-400">Your balance is reserved when you submit a payout request. Settlement is currently manual until the provider connector is enabled.</p>
          <form action={requestPayout} className="mt-5 space-y-4">
            <input name="amount" type="number" min="1" step="0.01" placeholder="Amount" required className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3" />
            <select name="provider" defaultValue="" required className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3">
              <option value="" disabled>Select payout method</option>
              <option value="orange_money">Orange Money</option>
              <option value="africell_money">Africell Money</option>
              <option value="qcell_money">QCell Money</option>
              <option value="manual">Manual payout</option>
            </select>
            <input name="phone" type="tel" placeholder="Payout phone number" required className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3" />
            <button className="rounded-xl bg-cyan-300 px-4 py-2 font-semibold text-slate-950">Request payout</button>
          </form>
        </section>

        <section className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-7">
          <h2 className="font-semibold">Wallet history</h2>
          <div className="mt-4 space-y-3">
            {(ledger ?? []).length === 0 ? <p className="text-sm text-slate-500">No wallet activity yet.</p> : null}
            {(ledger ?? []).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-4 border-b border-white/10 py-3 last:border-0">
                <div><p className="font-medium">{entry.description ?? entry.entry_type}</p><p className="text-xs text-slate-500">{new Date(entry.created_at).toLocaleString('en-GB')}</p></div>
                <p className={entry.entry_type === 'debit' ? 'font-semibold text-amber-200' : 'font-semibold text-emerald-200'}>{entry.entry_type === 'debit' ? '-' : '+'}{entry.currency} {Number(entry.amount).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
