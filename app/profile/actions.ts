'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function fail(message: string): never {
  redirect(`/profile?error=${encodeURIComponent(message)}`)
}

export async function updateWorkerProfile(formData: FormData) {
  const fullName = String(formData.get('fullName') ?? '').trim()
  const location = String(formData.get('location') ?? '').trim()
  const bio = String(formData.get('bio') ?? '').trim()
  const availability = String(formData.get('availability') ?? '').trim()
  const hourlyRate = Number(formData.get('hourlyRate') ?? 0)
  const experienceYears = Number(formData.get('experienceYears') ?? 0)

  if (fullName.length < 2) fail('Enter your full name.')
  if (!Number.isFinite(hourlyRate) || hourlyRate < 0) fail('Enter a valid hourly rate.')
  if (!Number.isFinite(experienceYears) || experienceYears < 0) fail('Enter valid years of experience.')

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login?error=Your session has expired. Please sign in again.')

  const { data: profile } = await supabase.rpc('get_my_profile').maybeSingle()
  if (!profile) redirect('/onboarding')
  if (profile.role !== 'worker') fail('Only worker accounts can edit a worker profile.')

  const { error } = await supabase.rpc('update_my_worker_profile', {
    new_full_name: fullName,
    new_location: location,
    new_bio: bio,
    new_availability: availability,
    new_hourly_rate: hourlyRate,
    new_experience_years: experienceYears,
  })
  if (error) fail(error.message)

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  redirect('/profile?saved=1')
}
