import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingForm from './onboarding-form'

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()

  if (!claimsData?.claims?.sub) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, status, onboarding_completed')
    .eq('id', claimsData.claims.sub)
    .maybeSingle()

  if (!profile) redirect('/login?error=We could not find your Oswok profile.')
  if (profile.status === 'suspended') redirect('/login?error=This account is suspended.')
  if (profile.onboarding_completed) redirect('/dashboard')

  const params = await searchParams

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-12 text-white">
      <div className="mx-auto max-w-lg">
        <p className="text-sm font-semibold text-cyan-300">OSWOK AI</p>
        <h1 className="mt-5 text-3xl font-bold">Let us set up your account.</h1>
        <p className="mt-3 text-slate-400">Choose whether you are here to find work or hire people. This controls the first version of your Oswok experience.</p>
        {params.error ? <div className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{params.error}</div> : null}
        <div className="mt-7">
          <OnboardingForm defaultName={profile.full_name ?? ''} />
        </div>
      </div>
    </main>
  )
}
