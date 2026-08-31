import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type SearchParams = Promise<{ error?: string; q?: string; category?: string; location?: string }>

export default async function JobsPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const { data: profile } = await supabase.rpc('get_my_profile').maybeSingle()
  if (!profile) redirect('/onboarding')

  const params = await searchParams
  const q = params.q?.trim() || ''
  const category = params.category?.trim() || ''
  const location = params.location?.trim() || ''
  const isEmployer = profile.role === 'employer'

  let jobsQuery = supabase
    .from('jobs')
    .select('id, employer_id, title, description, category, location, pay_amount, pay_currency, status, created_at')
    .order('created_at', { ascending: false })

  if (isEmployer) jobsQuery = jobsQuery.eq('employer_id', userId)
  else jobsQuery = jobsQuery.eq('status', 'open')
  if (q) jobsQuery = jobsQuery.or(`title.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`)
  if (category) jobsQuery = jobsQuery.eq('category', category)
  if (location) jobsQuery = jobsQuery.ilike('location', `%${location}%`)

  const { data: jobs, error } = await jobsQuery

  const employerIds = [...new Set((jobs ?? []).map((job) => job.employer_id))]
  const { data: employers } = employerIds.length
    ? await supabase.from('employer_profiles').select('user_id, organisation_name').in('user_id', employerIds)
    : { data: [] }
  const employerNames = new Map((employers ?? []).map((employer) => [employer.user_id, employer.organisation_name]))

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <Link href="/dashboard" className="text-sm font-semibold text-cyan-300">← Dashboard</Link>
            <h1 className="mt-3 text-3xl font-bold">{isEmployer ? 'My jobs' : 'Find work'}</h1>
            <p className="mt-2 text-slate-400">{isEmployer ? 'Manage the opportunities you have published and review applicants.' : 'Discover open opportunities from employers on Oswok.'}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard" className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold">Dashboard</Link>
            {isEmployer ? <Link href="/jobs/new" className="rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">Post a job</Link> : <Link href="/applications" className="rounded-xl border border-white/10 px-5 py-3 font-semibold">My applications</Link>}
          </div>
        </header>

        <form method="get" className="mt-7 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 md:grid-cols-[2fr_1fr_1fr_auto]">
          <input name="q" defaultValue={q} placeholder="Search jobs, skills or keywords" className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3" />
          <input name="category" defaultValue={category} placeholder="Category" className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3" />
          <input name="location" defaultValue={location} placeholder="Location" className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3" />
          <button type="submit" className="rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">Search</button>
        </form>

        {params.error ? <div className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{params.error}</div> : null}
        {error ? <div className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">Unable to load jobs right now. Please try again.</div> : null}

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          {(jobs ?? []).map((job) => (
            <article key={job.id} className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-cyan-300/40 hover:bg-white/[0.07]">
              <Link href={`/jobs/${job.id}`} className="block">
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">{job.category || 'General work'}</p><h2 className="mt-2 text-xl font-bold">{job.title}</h2></div>
                  <span className="shrink-0 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium capitalize text-emerald-300">{job.status}</span>
                </div>
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-400">{job.description}</p>
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300"><span>{job.location || 'Location flexible'}</span><span>{job.pay_currency} {Number(job.pay_amount).toLocaleString()}</span></div>
                <p className="mt-4 text-xs text-slate-500">{isEmployer ? 'Your job' : `Posted by ${employerNames.get(job.employer_id) || 'Oswok employer'}`}</p>
              </Link>
              {isEmployer ? <Link href={`/jobs/${job.id}/manage`} className="mt-5 inline-flex rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-cyan-300">Manage applicants →</Link> : <Link href={`/jobs/${job.id}`} className="mt-5 inline-flex text-sm font-semibold text-cyan-300">View opportunity →</Link>}
            </article>
          ))}
        </section>

        {!jobs?.length && !error ? (
          <div className="mt-8 rounded-2xl border border-dashed border-white/10 p-10 text-center">
            <h2 className="text-xl font-semibold">{isEmployer ? 'You have no jobs yet' : 'No matching open jobs'}</h2>
            <p className="mx-auto mt-2 max-w-lg text-slate-400">{isEmployer ? 'Create your first opportunity to start receiving applications.' : 'Try a broader search or check again as employers publish new opportunities.'}</p>
            {isEmployer ? <Link href="/jobs/new" className="mt-6 inline-flex rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">Post your first job</Link> : <Link href="/jobs" className="mt-6 inline-flex rounded-xl border border-white/10 px-5 py-3 font-semibold">Clear search</Link>}
          </div>
        ) : null}
      </div>
    </main>
  )
}
