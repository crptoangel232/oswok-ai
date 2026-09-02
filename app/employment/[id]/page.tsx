import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { confirmPayment, submitReview, transitionEmployment } from '../actions'

type Employment = {
  employment_id: string
  job_id: string
  job_title: string
  employer_id: string
  employer_name: string
  worker_id: string
  worker_name: string
  status: string
  started_at: string
}

export default async function EmploymentDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ updated?: string; paid?: string; reviewed?: string; error?: string }> }) {
  const { id } = await params
  const query = await searchParams
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const { data: profile } = await supabase.rpc('get_my_profile').maybeSingle()
  if (!profile) redirect('/onboarding')

  const result = await (supabase.rpc as unknown as (name: string) => Promise<{ data: Employment[] | null; error: { message: string } | null }>)('get_my_employments')
  const employment = result.data?.find((item) => item.employment_id === id)
  if (!employment) notFound()

  const isEmployer = employment.employer_id === userId
  const isWorker = employment.worker_id === userId
  const { data: transaction } = await supabase.from('transactions').select('id, amount, currency, status').eq('job_id', employment.job_id).eq('worker_id', employment.worker_id).eq('employer_id', employment.employer_id).order('created_at', { ascending: false }).limit(1).maybeSingle()
  const { data: existingReview } = transaction ? await supabase.from('reviews').select('id').eq('transaction_id', transaction.id).eq('reviewer_id', userId).maybeSingle() : { data: null }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <Link href="/employment" className="text-sm font-semibold text-cyan-300">← Employment</Link>
        <article className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Employment</p><h1 className="mt-2 text-3xl font-bold">{employment.job_title}</h1><p className="mt-2 text-slate-400">{isEmployer ? `Worker: ${employment.worker_name}` : `Hirer: ${employment.employer_name}`}</p></div>
            <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-sm font-semibold capitalize text-emerald-200">{employment.status.replaceAll('_', ' ')}</span>
          </div>

          <div className="mt-7 grid gap-4 border-y border-white/10 py-5 sm:grid-cols-3">
            <div><p className="text-xs text-slate-500">Started</p><p className="mt-1 font-semibold">{new Date(employment.started_at).toLocaleDateString('en-GB')}</p></div>
            <div><p className="text-xs text-slate-500">{isEmployer ? 'Worker' : 'Hirer'}</p><p className="mt-1 font-semibold">{isEmployer ? employment.worker_name : employment.employer_name}</p></div>
            <div><p className="text-xs text-slate-500">Payment</p><p className="mt-1 font-semibold capitalize">{transaction?.status ?? 'Not recorded'}</p></div>
          </div>

          {query.error ? <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{query.error}</div> : null}
          {query.updated === '1' ? <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">Employment status updated successfully.</div> : null}
          {query.paid === '1' ? <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">Payment confirmed. Both sides can now leave a review.</div> : null}
          {query.reviewed === '1' ? <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">Review submitted successfully.</div> : null}

          {employment.status === 'active' ? <div className="mt-7 rounded-xl border border-white/10 bg-slate-900/60 p-5"><h2 className="font-semibold">Manage employment</h2><p className="mt-1 text-sm text-slate-400">Mark the work completed when the agreed work is finished. The hirer can also cancel an active employment.</p><div className="mt-5 flex flex-wrap gap-3"><form action={transitionEmployment}><input type="hidden" name="employmentId" value={id}/><input type="hidden" name="status" value="completed"/><button className="rounded-xl bg-emerald-300 px-4 py-2 text-sm font-semibold text-slate-950">Mark completed</button></form>{isEmployer ? <form action={transitionEmployment}><input type="hidden" name="employmentId" value={id}/><input type="hidden" name="status" value="cancelled"/><button className="rounded-xl border border-red-300/20 px-4 py-2 text-sm font-semibold text-red-200">Cancel employment</button></form> : null}</div></div> : null}

          {employment.status === 'completed' && isEmployer ? <div className="mt-7 rounded-xl border border-amber-300/20 bg-amber-300/5 p-5"><h2 className="font-semibold">Confirm payment</h2><p className="mt-1 text-sm text-slate-400">Confirm that the worker has been paid the agreed amount. This is a manual MVP confirmation, not a Mobile Money payment.</p><p className="mt-3 font-semibold">{transaction ? `${transaction.currency} ${Number(transaction.amount).toLocaleString()}` : 'Agreed job payment'}</p><form action={confirmPayment} className="mt-5"><input type="hidden" name="employmentId" value={id}/><button className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950">Confirm payment</button></form></div> : null}

          {employment.status === 'payment_confirmed' && !existingReview ? <div className="mt-7 rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-5"><h2 className="font-semibold">Leave a review</h2><p className="mt-1 text-sm text-slate-400">Rate your experience with the {isEmployer ? 'worker' : 'hirer'}.</p><form action={submitReview} className="mt-5 space-y-4"><input type="hidden" name="employmentId" value={id}/><label className="block"><span className="text-sm text-slate-400">Rating</span><select name="rating" defaultValue="5" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3"><option value="5">5 - Excellent</option><option value="4">4 - Good</option><option value="3">3 - Average</option><option value="2">2 - Poor</option><option value="1">1 - Very poor</option></select></label><label className="block"><span className="text-sm text-slate-400">Comment</span><textarea name="comment" rows={4} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3" placeholder="Share a brief, useful review." /></label><button className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950">Submit review</button></form></div> : null}
          {existingReview ? <div className="mt-7 rounded-xl border border-white/10 bg-slate-900/60 p-5"><p className="font-semibold">Review submitted</p><p className="mt-1 text-sm text-slate-400">You have already reviewed this employment.</p></div> : null}

          {employment.status !== 'active' && employment.status !== 'completed' && employment.status !== 'payment_confirmed' && !existingReview ? <div className="mt-7 rounded-xl border border-white/10 bg-slate-900/60 p-5"><p className="font-semibold capitalize">Employment {employment.status.replaceAll('_', ' ')}</p><p className="mt-1 text-sm text-slate-400">No further employment action is available.</p></div> : null}
          <Link href={`/jobs/${employment.job_id}`} className="mt-6 inline-flex text-sm font-semibold text-cyan-300">View job →</Link>
        </article>
      </div>
    </main>
  )
}
