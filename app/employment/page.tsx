import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function EmploymentPage({ searchParams }: { searchParams: Promise<{ hired?: string; job?: string; error?: string }> }) {
  const query = await searchParams
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')
  const { data: profile } = await supabase.rpc('get_my_profile').maybeSingle()
  if (!profile) redirect('/onboarding')
  const { data: employments, error } = await (supabase.rpc as unknown as (name: string) => Promise<{ data: Array<{ employment_id:string; job_id:string; job_title:string; employer_id:string; employer_name:string; worker_id:string; worker_name:string; status:string; started_at:string }> | null; error:{message:string}|null }> )('get_my_employments')

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard" className="text-sm font-semibold text-cyan-300">← Dashboard</Link>
        <header className="mt-5 border-b border-white/10 pb-6"><p className="text-sm font-semibold text-cyan-300">EMPLOYMENT</p><h1 className="mt-2 text-3xl font-bold">Employment</h1><p className="mt-2 text-slate-400">Track current hiring relationships and work you have been hired to do.</p></header>
        {query.hired === '1' ? <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">Worker hired successfully. The employment record is now active.</div> : null}
        {query.error ? <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{query.error}</div> : null}
        {error ? <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">Unable to load employment records.</div> : null}
        <section className="mt-7 space-y-4">
          {(employments ?? []).map((employment) => {
            const otherParty = profile.role === 'employer' ? employment.worker_name : employment.employer_name
            return <article key={employment.employment_id} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">{profile.role === 'employer' ? 'Worker hired' : 'Hirer'}</p><h2 className="mt-2 text-xl font-bold">{employment.job_title}</h2><p className="mt-1 text-sm text-slate-400">{otherParty}</p></div><span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold capitalize text-emerald-200">{employment.status}</span></div>
              <p className="mt-5 text-sm text-slate-400">Started {new Date(employment.started_at).toLocaleDateString('en-GB')}</p>
              <div className="mt-4 flex flex-wrap gap-4"><Link href={`/employment/${employment.employment_id}`} className="text-sm font-semibold text-cyan-300">Manage employment →</Link><Link href={`/jobs/${employment.job_id}`} className="text-sm font-semibold text-slate-300">View job →</Link></div>
            </article>
          })}
          {!employments?.length && !error ? <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center"><h2 className="text-xl font-semibold">No active employment yet</h2><p className="mt-2 text-sm text-slate-400">Your employment records will appear here after a worker is hired for a job.</p></div> : null}
        </section>
      </div>
    </main>
  )
}
