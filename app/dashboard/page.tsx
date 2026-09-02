import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const { data: profile, error } = await supabase.rpc('get_my_profile').maybeSingle()
  if (error || !profile) redirect('/onboarding')
  if (profile.status === 'suspended') redirect('/login?error=This account is suspended.')
  if (!profile.onboarding_completed) redirect('/onboarding')

  const isEmployer = profile.role === 'employer'
  const { data: jobs } = isEmployer
    ? await supabase.from('jobs').select('id, title, status, location, pay_amount, pay_currency, created_at').eq('employer_id', userId).order('created_at', { ascending: false }).limit(5)
    : await supabase.from('jobs').select('id, title, status, location, pay_amount, pay_currency, created_at').eq('status', 'open').order('created_at', { ascending: false }).limit(5)

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-sm font-semibold text-cyan-300">OSWOK AI</p>
            <h1 className="mt-2 text-3xl font-bold">{isEmployer ? 'Employer dashboard' : 'Worker dashboard'}</h1>
            <p className="mt-1 text-slate-400">Welcome, {profile.full_name || 'there'} · {profile.location || 'Location not set'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/profile" className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold">{isEmployer ? 'Edit employer profile' : 'Edit worker profile'}</Link>
            <Link href="/matches" className="rounded-xl border border-cyan-300/20 px-4 py-2 text-sm font-semibold text-cyan-200">{isEmployer ? 'Find recommended workers' : 'Recommended jobs'}</Link>
            <form action="/auth/signout" method="post"><button className="rounded-xl border border-white/10 px-4 py-2 text-sm">Sign out</button></form>
          </div>
        </header>

        <section className="mt-8 rounded-3xl border border-cyan-300/20 bg-cyan-300/5 p-7">
          <p className="text-sm font-semibold text-cyan-200">{isEmployer ? 'Hiring' : 'Finding work'}</p>
          <h2 className="mt-2 text-2xl font-bold">{isEmployer ? 'Find the right people for the work.' : 'Find work that fits you.'}</h2>
          <p className="mt-2 max-w-2xl text-slate-400">{isEmployer ? 'Create a clear job, publish it, and manage applicants from your employer dashboard.' : 'Discover jobs, apply directly, and track your applications from your worker dashboard.'}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {isEmployer ? <Link href="/jobs/new" className="rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">Post a job</Link> : <Link href="/jobs" className="rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">Find jobs</Link>}
            {isEmployer ? <Link href="/jobs" className="rounded-xl border border-white/10 px-5 py-3 font-semibold">My jobs</Link> : <Link href="/applications" className="rounded-xl border border-white/10 px-5 py-3 font-semibold">My applications</Link>}
            <Link href="/matches" className="rounded-xl border border-white/10 px-5 py-3 font-semibold">{isEmployer ? 'Recommended workers' : 'Recommended jobs'}</Link>
          </div>
        </section>

        <section className="mt-7 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-sm text-slate-400">Account type</p><p className="mt-2 font-semibold capitalize">{profile.role}</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-sm text-slate-400">Verification</p><p className="mt-2 font-semibold capitalize">{profile.verification_status}</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-sm text-slate-400">Current activity</p><p className="mt-2 font-semibold">{isEmployer ? 'Hiring' : 'Finding work'}</p></div>
        </section>

        <section className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-xl font-bold">{isEmployer ? 'Your recent job posts' : 'Latest open jobs'}</h2><p className="mt-1 text-sm text-slate-400">{isEmployer ? 'Manage the jobs you have published.' : 'Jobs currently available on Oswok.'}</p></div>
            <Link href={isEmployer ? '/jobs/new' : '/jobs'} className="text-sm font-semibold text-cyan-300">{isEmployer ? 'Post another →' : 'View all →'}</Link>
          </div>
          {jobs?.length ? <div className="mt-5 divide-y divide-white/10">{jobs.map((job) => <Link key={job.id} href={`/jobs/${job.id}`} className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0 hover:text-cyan-200"><div><p className="font-semibold">{job.title}</p><p className="mt-1 text-sm text-slate-500">{job.location || 'Location flexible'} · {job.pay_currency} {Number(job.pay_amount).toLocaleString()}</p></div><span className="rounded-full bg-white/5 px-3 py-1 text-xs capitalize text-slate-300">{job.status}</span></Link>)}</div> : <div className="mt-5 rounded-xl border border-dashed border-white/10 p-6 text-center"><p className="font-medium">{isEmployer ? 'You have not posted a job yet.' : 'No open jobs have been published yet.'}</p><p className="mt-1 text-sm text-slate-500">{isEmployer ? 'Publish your first job to start receiving applications.' : 'Check again when employers publish new jobs.'}</p></div>}
        </section>
      </div>
    </main>
  )
}
