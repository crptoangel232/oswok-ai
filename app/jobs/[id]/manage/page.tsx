import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { transitionJobStatus, updateApplicationStatus } from '../../actions'

const nextStatuses: Record<string, string[]> = {
  draft: ['open', 'cancelled'],
  open: ['paused', 'matched', 'closed', 'cancelled', 'expired', 'suspended'],
  paused: ['open', 'cancelled', 'expired', 'suspended'],
  matched: ['accepted', 'open', 'cancelled', 'disputed', 'suspended'],
  accepted: ['in_progress', 'cancelled', 'disputed', 'suspended'],
  in_progress: ['completed', 'disputed', 'suspended'],
  completed: ['payment_confirmed', 'disputed'],
  payment_confirmed: ['reviewed', 'disputed'],
  filled: ['closed'],
}

export default async function ManageApplicantsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; updated?: string }> }) {
  const { id } = await params
  const query = await searchParams
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const { data: job } = await supabase.from('jobs').select('id, employer_id, title, status').eq('id', id).maybeSingle()
  if (!job) notFound()
  if (job.employer_id !== userId) redirect(`/jobs/${id}`)

  const { data: applicants, error } = await (supabase.rpc as unknown as (name: string, args: Record<string, string>) => Promise<{ data: Array<{ application_id:string; worker_id:string; worker_name:string|null; worker_phone:string|null; worker_location:string|null; worker_bio:string|null; verification_status:string; availability:string|null; hourly_rate:number|null; experience_years:number|null; status:string; cover_note:string|null; applied_at:string }> | null; error:{message:string}|null }>)('get_my_job_applicants', { target_job_id: id })
  const currentStatus = String(job.status)
  const availableTransitions = nextStatuses[currentStatus] ?? []

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href={`/jobs/${id}`} className="text-sm font-semibold text-cyan-300">← Back to job</Link>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-sm font-semibold text-cyan-300">HIRER</p><h1 className="mt-2 text-3xl font-bold">Applicants for {job.title}</h1><p className="mt-2 text-slate-400">Review applicants and move the job through its controlled lifecycle.</p></div>
          <span className="rounded-full bg-white/5 px-3 py-1 text-sm capitalize">Job: {currentStatus.replaceAll('_', ' ')}</span>
        </div>
        {query.error || error ? <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{query.error ?? error?.message}</div> : null}
        {query.updated === '1' ? <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">Change saved successfully.</div> : null}

        <section className="mt-7 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Job lifecycle</p><h2 className="mt-1 text-xl font-bold">{currentStatus.replaceAll('_', ' ')}</h2><p className="mt-2 text-sm text-slate-400">Each transition is validated server-side. The interface only exposes valid next states.</p></div><span className="text-sm text-slate-400">{availableTransitions.length} next step{availableTransitions.length === 1 ? '' : 's'}</span></div>
          {availableTransitions.length ? <div className="mt-5 flex flex-wrap gap-3">{availableTransitions.map((status) => <form key={status} action={transitionJobStatus}><input type="hidden" name="jobId" value={id}/><input type="hidden" name="status" value={status}/><button className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2 text-sm font-semibold capitalize hover:border-cyan-300/40">Move to {status.replaceAll('_', ' ')}</button></form>)}</div> : <p className="mt-4 text-sm text-slate-500">No further job transition is available from this state.</p>}
        </section>

        <div className="mt-7 space-y-5">
          {applicants?.length ? applicants.map((applicant) => (
            <article key={applicant.application_id} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><h2 className="text-xl font-bold">{applicant.worker_name || 'Worker'}</h2><p className="mt-1 text-sm text-slate-400">{applicant.worker_location || 'Location not set'} · {applicant.availability || 'Availability not set'}</p></div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs capitalize">{applicant.status}</span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3"><div><p className="text-xs text-slate-500">Verification</p><p className="mt-1 text-sm capitalize">{applicant.verification_status}</p></div><div><p className="text-xs text-slate-500">Experience</p><p className="mt-1 text-sm">{applicant.experience_years ?? 0} years</p></div><div><p className="text-xs text-slate-500">Expected hourly rate</p><p className="mt-1 text-sm">{applicant.hourly_rate ? `SLE ${Number(applicant.hourly_rate).toLocaleString()}` : 'Not set'}</p></div></div>
              {applicant.worker_bio ? <div className="mt-5"><p className="text-xs text-slate-500">Worker bio</p><p className="mt-1 text-sm leading-6 text-slate-300">{applicant.worker_bio}</p></div> : null}
              {applicant.cover_note ? <div className="mt-5 rounded-xl border border-cyan-300/10 bg-cyan-300/5 p-4"><p className="text-xs font-semibold text-cyan-200">Application note</p><p className="mt-2 text-sm leading-6 text-slate-300">{applicant.cover_note}</p></div> : null}
              <div className="mt-6 flex flex-wrap gap-3">
                <form action={updateApplicationStatus}><input type="hidden" name="applicationId" value={applicant.application_id}/><input type="hidden" name="jobId" value={id}/><input type="hidden" name="status" value="accepted"/><button className="rounded-xl bg-emerald-300 px-4 py-2 text-sm font-semibold text-slate-950">Accept applicant</button></form>
                <form action={updateApplicationStatus}><input type="hidden" name="applicationId" value={applicant.application_id}/><input type="hidden" name="jobId" value={id}/><input type="hidden" name="status" value="rejected"/><button className="rounded-xl border border-red-300/20 px-4 py-2 text-sm font-semibold text-red-200">Reject</button></form>
                {applicant.status !== 'pending' ? <form action={updateApplicationStatus}><input type="hidden" name="applicationId" value={applicant.application_id}/><input type="hidden" name="jobId" value={id}/><input type="hidden" name="status" value="pending"/><button className="rounded-xl border border-white/10 px-4 py-2 text-sm">Move to pending</button></form> : null}
              </div>
            </article>
          )) : <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center"><p className="font-semibold">No applicants yet.</p><p className="mt-2 text-sm text-slate-500">Once workers apply, their applications will appear here.</p></div>}
        </div>
      </div>
    </main>
  )
}
