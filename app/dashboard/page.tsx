import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub

  if (!userId) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, location, verification_status')
    .eq('id', userId)
    .maybeSingle()

  if (!profile) redirect('/onboarding')

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-sm font-semibold text-cyan-300">OSWOK AI</p>
            <h1 className="mt-2 text-3xl font-bold">Welcome, {profile.full_name || 'there'}.</h1>
            <p className="mt-1 text-slate-400">{profile.role === 'employer' ? 'Employer workspace' : 'Worker workspace'} · {profile.location || 'Location not set'}</p>
          </div>
          <form action="/auth/signout" method="post"><button className="rounded-xl border border-white/10 px-4 py-2 text-sm">Sign out</button></form>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-sm text-slate-400">Account</p><p className="mt-2 font-semibold capitalize">{profile.role}</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-sm text-slate-400">Verification</p><p className="mt-2 font-semibold capitalize">{profile.verification_status}</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-sm text-slate-400">Next</p><p className="mt-2 font-semibold">{profile.role === 'employer' ? 'Post your first job' : 'Add your skills'}</p></div>
        </section>

        <section className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-6">
          <p className="text-sm font-semibold text-cyan-200">Phase 3 foundation</p>
          <h2 className="mt-2 text-xl font-bold">Your identity is now connected to Oswok.</h2>
          <p className="mt-2 max-w-2xl text-slate-400">Jobs, applications, matching and payments will be introduced in later phases. For now, this dashboard confirms that authentication and role-aware onboarding are working.</p>
        </section>
      </div>
    </main>
  )
}
