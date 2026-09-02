import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateWorkerProfile } from './actions'
import { updateEmployerProfile } from './employer-actions'

type SearchParams = Promise<{ saved?: string; error?: string }>
type Profile = {
  id: string
  full_name: string | null
  role: 'worker' | 'employer' | 'admin'
  status: 'active' | 'suspended' | 'pending'
  location: string | null
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected'
  onboarding_completed: boolean
  bio: string | null
}

export default async function ProfilePage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const { data: profileData } = await supabase.rpc('get_my_profile').maybeSingle()
  const profile = profileData as Profile | null
  if (!profile) redirect('/onboarding')
  if (profile.role === 'admin') redirect('/dashboard')

  const isEmployer = profile.role === 'employer'
  const { data: worker } = isEmployer
    ? { data: null }
    : await supabase.from('worker_profiles').select('availability, hourly_rate, experience_years').eq('user_id', userId).maybeSingle()
  const { data: employer } = isEmployer
    ? await supabase.from('employer_profiles').select('organisation_name, organisation_type, website').eq('user_id', userId).maybeSingle()
    : { data: null }
  const params = await searchParams

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <Link href="/dashboard" className="text-sm font-semibold text-cyan-300">← Dashboard</Link>
        <div className="mt-4 border-b border-white/10 pb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">Account profile</p>
          <h1 className="mt-2 text-3xl font-bold">{isEmployer ? 'Hirer profile' : 'Worker profile'}</h1>
          <p className="mt-2 text-slate-400">Keep your profile accurate so workers and hirers can make informed employment decisions.</p>
        </div>

        {params.saved ? <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">Profile updated successfully.</div> : null}
        {params.error ? <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{params.error}</div> : null}

        {isEmployer ? (
          <form action={updateEmployerProfile} className="mt-7 space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-4">
              <p className="font-semibold">Hirer identity</p>
              <p className="mt-1 text-sm text-slate-400">This information is shown to workers when they evaluate your jobs.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2"><span className="text-sm font-medium">Your full name</span><input name="fullName" required defaultValue={profile.full_name ?? ''} className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3" /></label>
              <label className="space-y-2"><span className="text-sm font-medium">Location</span><input name="location" required defaultValue={profile.location ?? ''} placeholder="Freetown" className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3" /></label>
            </div>
            <label className="block space-y-2"><span className="text-sm font-medium">Organisation / business name</span><input name="organisationName" required defaultValue={employer?.organisation_name ?? ''} className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3" /></label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2"><span className="text-sm font-medium">Organisation type</span><input name="organisationType" defaultValue={employer?.organisation_type ?? ''} placeholder="Business, NGO, startup, individual" className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3" /></label>
              <label className="space-y-2"><span className="text-sm font-medium">Website</span><input name="website" type="url" defaultValue={employer?.website ?? ''} placeholder="https://example.com" className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3" /></label>
            </div>
            <label className="block space-y-2"><span className="text-sm font-medium">About you / your organisation</span><textarea name="bio" rows={5} defaultValue={profile.bio ?? ''} placeholder="Tell workers who you are and what kind of work you hire for." className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3" /></label>
            <button type="submit" className="w-full rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">Save hirer profile</button>
          </form>
        ) : (
          <form action={updateWorkerProfile} className="mt-7 space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-4">
              <p className="font-semibold">Worker identity</p>
              <p className="mt-1 text-sm text-slate-400">Give hirers enough information to understand your skills and availability.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2"><span className="text-sm font-medium">Full name</span><input name="fullName" required defaultValue={profile.full_name ?? ''} className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3" /></label>
              <label className="space-y-2"><span className="text-sm font-medium">Location</span><input name="location" defaultValue={profile.location ?? ''} placeholder="Freetown" className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3" /></label>
            </div>
            <label className="block space-y-2"><span className="text-sm font-medium">Bio</span><textarea name="bio" rows={5} defaultValue={profile.bio ?? ''} placeholder="Tell employers what you are good at and the kind of work you want." className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3" /></label>
            <div className="grid gap-5 sm:grid-cols-3">
              <label className="space-y-2"><span className="text-sm font-medium">Availability</span><input name="availability" defaultValue={worker?.availability ?? ''} placeholder="Weekdays" className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3" /></label>
              <label className="space-y-2"><span className="text-sm font-medium">Hourly rate (SLE)</span><input name="hourlyRate" type="number" min="0" step="0.01" defaultValue={worker?.hourly_rate ?? 0} className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3" /></label>
              <label className="space-y-2"><span className="text-sm font-medium">Experience (years)</span><input name="experienceYears" type="number" min="0" step="0.5" defaultValue={worker?.experience_years ?? 0} className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3" /></label>
            </div>
            <button type="submit" className="w-full rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">Save worker profile</button>
          </form>
        )}
      </div>
    </main>
  )
}
