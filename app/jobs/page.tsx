import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type SearchParams = Promise<{ error?: string }>

export default async function JobsPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims?.sub) redirect('/login')

  const { data: profile } = await supabase.rpc('get_my_profile').maybeSingle()
  if (!profile) redirect('/onboarding')

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, employer_id, title, description, category, location, pay_amount, pay_currency, status, created_at')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  const employerIds = [...new Set((jobs ?? []).map((job) => job.employer_id))]
  const { data: employers } = employerIds.length
    ? await supabase.from('employer_profiles').select('user_id, organisation_name').in('user_id', employerIds)
    : { data: [] }
  const employerNames = new Map((employers ?? []).map((employer) => [employer.user_id, employer.organisation_name]))
  const params = await searchParams

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <Link href="/dashboard" className="text-sm font-semibold text-cyan-300">← Dashboard</Link>
            <h1 className="mt-3 text-3xl font-bold">Find work</h1>
            <p className="mt-2 text-slate-400">Open opportunities from employers on Oswok.</p>
          </div>
          {profile.role === 'employer' ? (
            <Link href="/jobs/new" className="rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">Post a job</Link>
          ) : null}
        </header>

        {params.error ? <div className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{params.error}</div> : null}
        {error ? <div className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">Unable to load jobs right now.</div> : null}

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          {(jobs ?? []).map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`} className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-cyan-300/40 hover:bg-white/[0.07]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">{job.category || 'General work'}</p>
                  <h2 className="mt-2 text-xl font-bold">{job.title}</h2>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">Open</span>
              </div>
              <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-400">{job.description}</p>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
                <span>{job.location || 'Location flexible'}</span>
                <span>{job.pay_currency} {Number(job.pay_amount).toLocaleString()}</span>
              </div>
              <p className="mt-4 text-xs text-slate-500">Posted by {employerNames.get(job.employer_id) || 'Oswok employer'}</p>
            </Link>
          ))}
        </section>

        {!jobs?.length && !error ? (
          <div className="mt-8 rounded-2xl border border-dashed border-white/10 p-10 text-center">
            <h2 className="text-xl font-semibold">No open jobs yet</h2>
            <p className="mt-2 text-slate-400">The marketplace is ready. We just need employers to start posting.</p>
          </div>
        ) : null}
      </div>
    </main>
  )
}
