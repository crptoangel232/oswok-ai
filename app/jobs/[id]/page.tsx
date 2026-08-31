import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { applyToJob } from '../actions'

export default async function JobPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ applied?: string; error?: string }> }) {
  const { id } = await params
  const query = await searchParams
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')
  const { data: job } = await supabase.from('jobs').select('id, employer_id, title, description, category, location, pay_amount, pay_currency, status, created_at').eq('id', id).maybeSingle()
  if (!job) notFound()
  const { data: employer } = await supabase.from('employer_profiles').select('organisation_name, organisation_type').eq('user_id', job.employer_id).maybeSingle()
  const { data: profile } = await supabase.rpc('get_my_profile').maybeSingle()
  const { data: application } = profile?.role === 'worker' ? await supabase.from('applications').select('id, status').eq('job_id', id).eq('worker_id', userId).maybeSingle() : { data: null }
  const isOwner = profile?.role === 'employer' && job.employer_id === userId

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <Link href="/jobs" className="text-sm font-semibold text-cyan-300">← Back to jobs</Link>
        <article className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-7">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">{job.category || 'General work'}</p><h1 className="mt-2 text-3xl font-bold">{job.title}</h1><p className="mt-2 text-slate-400">{employer?.organisation_name || 'Oswok employer'} · {job.location || 'Location flexible'}</p></div><div className="rounded-xl bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300">{job.status}</div></div>
          <div className="mt-7 border-y border-white/10 py-5"><p className="text-sm text-slate-400">Pay</p><p className="mt-1 text-2xl font-bold">{job.pay_currency} {Number(job.pay_amount).toLocaleString()}</p></div>
          <div className="mt-7"><h2 className="text-lg font-semibold">About the work</h2><p className="mt-3 whitespace-pre-wrap leading-7 text-slate-300">{job.description}</p></div>
          {query.error ? <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{query.error}</div> : null}
          {query.applied === '1' ? <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">Application submitted. The employer can now review it.</div> : null}
          {profile?.role === 'worker' && job.status === 'open' ? (application ? <div className="mt-7 rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-5"><p className="font-semibold">You already applied</p><p className="mt-1 text-sm text-slate-400">Application status: <span className="capitalize text-slate-200">{application.status}</span></p></div> : <form action={applyToJob} className="mt-7 space-y-4 rounded-xl border border-white/10 bg-slate-900/60 p-5"><input type="hidden" name="jobId" value={job.id} /><label htmlFor="coverNote" className="block text-sm font-medium">Why are you a good fit? <span className="text-slate-500">(optional)</span></label><textarea id="coverNote" name="coverNote" rows={5} placeholder="Briefly tell the employer about your relevant experience." className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3" /><button type="submit" className="w-full rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950">Apply for this job</button></form>) : null}
          {isOwner ? <div className="mt-7 rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-5"><p className="font-semibold">Manage applicants</p><p className="mt-1 text-sm text-slate-400">Review applications, read worker notes, and accept or reject candidates.</p><Link href={`/jobs/${id}/manage`} className="mt-4 inline-flex rounded-xl bg-cyan-300 px-4 py-2 font-semibold text-slate-950">View applicants</Link></div> : null}
        </article>
      </div>
    </main>
  )
}
