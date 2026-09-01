import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type SearchParams = Promise<{ job?: string }>
type RecommendedJob = {
  job_id: string
  title: string
  description: string
  category: string | null
  location: string | null
  pay_amount: number
  pay_currency: string
  employer_name: string
  employer_verification: string
  score: number
  reason: string
}
type Candidate = {
  worker_id: string
  worker_name: string | null
  location: string | null
  bio: string | null
  verification_status: string
  availability: string | null
  hourly_rate: number | null
  experience_years: number | null
  score: number
  reason: string
}

export default async function MatchesPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const { data: profile } = await supabase.rpc('get_my_profile').maybeSingle()
  if (!profile) redirect('/onboarding')
  if (profile.role === 'admin') redirect('/dashboard')

  const params = await searchParams
  const isEmployer = profile.role === 'employer'

  if (!isEmployer) {
    const result = await (supabase.rpc as unknown as (name: string, args: Record<string, number>) => Promise<{ data: RecommendedJob[] | null; error: { message: string } | null }>)('get_my_recommended_jobs', { limit_count: 12 })
    const recommendations = result.data ?? []
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <header className="border-b border-white/10 pb-6">
            <Link href="/dashboard" className="text-sm font-semibold text-cyan-300">← Dashboard</Link>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
              <div><p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">Oswok matching</p><h1 className="mt-2 text-3xl font-bold">Recommended jobs</h1><p className="mt-2 text-slate-400">Opportunities ranked using your current profile, location, experience, availability, skills and trust signals.</p></div>
              <Link href="/jobs" className="rounded-xl border border-white/10 px-5 py-3 font-semibold">Browse all jobs</Link>
            </div>
          </header>
          {result.error ? <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">Unable to load recommendations right now.</div> : null}
          <section className="mt-7 grid gap-5 md:grid-cols-2">
            {recommendations.map((job) => (
              <article key={job.job_id} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">{job.category || 'General work'}</p><h2 className="mt-2 text-xl font-bold">{job.title}</h2><p className="mt-1 text-sm text-slate-400">{job.employer_name} · {job.location || 'Location flexible'}</p></div><span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-200">{Math.round(job.score)}% fit</span></div>
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-400">{job.description}</p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-300"><span>{job.pay_currency} {Number(job.pay_amount).toLocaleString()}</span><span className="capitalize">Employer: {job.employer_verification}</span></div>
                <p className="mt-4 text-sm text-cyan-100">{job.reason}</p>
                <Link href={`/jobs/${job.job_id}`} className="mt-5 inline-flex rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950">View opportunity →</Link>
              </article>
            ))}
          </section>
          {!recommendations.length && !result.error ? <div className="mt-8 rounded-2xl border border-dashed border-white/10 p-10 text-center"><h2 className="text-xl font-semibold">No new recommendations yet</h2><p className="mx-auto mt-2 max-w-lg text-slate-400">You may have already applied to the available jobs. Keep your profile complete and new opportunities will be evaluated automatically.</p><Link href="/jobs" className="mt-6 inline-flex rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">Browse jobs</Link></div> : null}
        </div>
      </main>
    )
  }

  const { data: jobs } = await supabase.from('jobs').select('id,title,status').eq('employer_id', userId).order('created_at', { ascending: false })
  const selectedJobId = params.job && jobs?.some((job) => job.id === params.job) ? params.job : jobs?.[0]?.id
  let candidates: Candidate[] = []
  let candidateError: string | null = null
  if (selectedJobId) {
    const result = await (supabase.rpc as unknown as (name: string, args: Record<string, string | number>) => Promise<{ data: Candidate[] | null; error: { message: string } | null }>)('get_my_candidate_recommendations', { target_job_id: selectedJobId, limit_count: 12 })
    candidates = result.data ?? []
    candidateError = result.error?.message ?? null
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-white/10 pb-6">
          <Link href="/dashboard" className="text-sm font-semibold text-cyan-300">← Dashboard</Link>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">Oswok matching</p><h1 className="mt-2 text-3xl font-bold">Recommended workers</h1><p className="mt-2 text-slate-400">Candidates ranked using job requirements, location, skills, experience, availability and trust signals.</p></div><Link href="/jobs/new" className="rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">Post a job</Link></div>
        </header>
        {!jobs?.length ? <div className="mt-8 rounded-2xl border border-dashed border-white/10 p-10 text-center"><h2 className="text-xl font-semibold">Post a job first</h2><p className="mt-2 text-slate-400">Once you have an opportunity, Oswok can rank potential workers against it.</p><Link href="/jobs/new" className="mt-6 inline-flex rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">Create job</Link></div> : <>
          <form method="get" className="mt-7 flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-white/5 p-5"><label className="min-w-[260px] flex-1"><span className="mb-2 block text-sm font-medium">Job</span><select name="job" defaultValue={selectedJobId} className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3">{jobs.map((job) => <option key={job.id} value={job.id}>{job.title} · {job.status}</option>)}</select></label><button className="rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">Find candidates</button></form>
          {candidateError ? <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">Unable to load candidate recommendations right now.</div> : null}
          <section className="mt-7 grid gap-5 md:grid-cols-2">
            {candidates.map((candidate) => <article key={candidate.worker_id} className="rounded-2xl border border-white/10 bg-white/5 p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold">{candidate.worker_name || 'Worker'}</h2><p className="mt-1 text-sm text-slate-400">{candidate.location || 'Location not set'} · {candidate.availability || 'Availability not set'}</p></div><span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-200">{Math.round(candidate.score)}% fit</span></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><div><p className="text-xs text-slate-500">Verification</p><p className="mt-1 text-sm capitalize">{candidate.verification_status}</p></div><div><p className="text-xs text-slate-500">Experience</p><p className="mt-1 text-sm">{candidate.experience_years ?? 0} years</p></div><div><p className="text-xs text-slate-500">Hourly rate</p><p className="mt-1 text-sm">{candidate.hourly_rate ? `SLE ${Number(candidate.hourly_rate).toLocaleString()}` : 'Not set'}</p></div></div>{candidate.bio ? <p className="mt-5 text-sm leading-6 text-slate-400">{candidate.bio}</p> : null}<p className="mt-4 text-sm text-cyan-100">{candidate.reason}</p></article>)}
          </section>
          {!candidates.length && !candidateError ? <div className="mt-8 rounded-2xl border border-dashed border-white/10 p-10 text-center"><h2 className="text-xl font-semibold">No new candidate recommendations</h2><p className="mt-2 text-slate-400">Workers who have already applied are excluded from this discovery list.</p></div> : null}
        </>}
      </div>
    </main>
  )
}
