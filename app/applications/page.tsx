import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-400/10 text-amber-200',
  shortlisted: 'bg-cyan-400/10 text-cyan-200',
  accepted: 'bg-emerald-400/10 text-emerald-200',
  rejected: 'bg-red-400/10 text-red-200',
  withdrawn: 'bg-slate-400/10 text-slate-300',
}

export default async function ApplicationsPage() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims?.sub) redirect('/login')

  const { data: profile } = await supabase.rpc('get_my_profile').maybeSingle()
  if (!profile) redirect('/onboarding')
  if (profile.role !== 'worker') redirect('/dashboard')

  const { data: applications, error } = await supabase.rpc('get_my_applications')

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="border-b border-white/10 pb-6">
          <Link href="/dashboard" className="text-sm font-semibold text-cyan-300">← Dashboard</Link>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">My applications</h1>
              <p className="mt-2 text-slate-400">Track every opportunity you have applied for and see the latest decision.</p>
            </div>
            <Link href="/jobs" className="rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">Find more jobs</Link>
          </div>
        </header>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">Unable to load your applications right now.</div>
        ) : null}

        <section className="mt-7 space-y-4">
          {(applications ?? []).map((application) => (
            <article key={application.application_id} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">{application.job_category || 'General work'}</p>
                  <h2 className="mt-2 text-xl font-bold">{application.job_title}</h2>
                  <p className="mt-1 text-sm text-slate-400">{application.employer_name} · {application.job_location || 'Location flexible'}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[application.application_status] || statusStyles.pending}`}>
                  {application.application_status}
                </span>
              </div>
              <div className="mt-5 grid gap-4 border-y border-white/10 py-4 sm:grid-cols-3">
                <div><p className="text-xs text-slate-500">Pay</p><p className="mt-1 font-semibold">{application.pay_currency} {Number(application.pay_amount).toLocaleString()}</p></div>
                <div><p className="text-xs text-slate-500">Applied</p><p className="mt-1 font-semibold">{new Date(application.applied_at).toLocaleDateString('en-GB')}</p></div>
                <div><p className="text-xs text-slate-500">Job status</p><p className="mt-1 font-semibold capitalize">{application.job_status}</p></div>
              </div>
              {application.cover_note ? <p className="mt-4 text-sm leading-6 text-slate-400">“{application.cover_note}”</p> : null}
              <Link href={`/jobs/${application.job_id}`} className="mt-5 inline-flex text-sm font-semibold text-cyan-300">View job →</Link>
            </article>
          ))}

          {!applications?.length && !error ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
              <h2 className="text-xl font-semibold">No applications yet</h2>
              <p className="mx-auto mt-2 max-w-lg text-slate-400">Find an open opportunity, review the details, and submit your first application.</p>
              <Link href="/jobs" className="mt-6 inline-flex rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">Browse open jobs</Link>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}
