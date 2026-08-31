import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateWorkerProfile } from './actions'

type SearchParams = Promise<{ saved?: string; error?: string }>

export default async function ProfilePage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const { data: profile } = await supabase.rpc('get_my_profile').maybeSingle()
  if (!profile) redirect('/onboarding')
  if (profile.role !== 'worker') redirect('/dashboard')

  const { data: worker } = await supabase.from('worker_profiles').select('availability, hourly_rate, experience_years').eq('user_id', userId).maybeSingle()
  const params = await searchParams

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <Link href="/dashboard" className="text-sm font-semibold text-cyan-300">← Dashboard</Link>
        <div className="mt-4 border-b border-white/10 pb-6">
          <h1 className="text-3xl font-bold">Worker profile</h1>
          <p className="mt-2 text-slate-400">Keep your profile useful to employers. Better information means better matching later.</p>
        </div>

        {params.saved ? <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">Profile updated successfully.</div> : null}
        {params.error ? <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{params.error}</div> : null}

        <form action={updateWorkerProfile} className="mt-7 space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
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
          <button type="submit" className="w-full rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">Save profile</button>
        </form>
      </div>
    </main>
  )
}
