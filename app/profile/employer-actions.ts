'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function fail(message: string): never {
  redirect(`/profile?error=${encodeURIComponent(message)}`)
}

export async function updateEmployerProfile(formData: FormData) {
  const fullName = String(formData.get('fullName') ?? '').trim()
  const location = String(formData.get('location') ?? '').trim()
  const bio = String(formData.get('bio') ?? '').trim()
  const organisationName = String(formData.get('organisationName') ?? '').trim()
  const organisationType = String(formData.get('organisationType') ?? '').trim()
  const website = String(formData.get('website') ?? '').trim()

  if (fullName.length < 2) fail('Enter your full name.')
  if (location.length < 2) fail('Enter your location.')
  if (organisationName.length < 2) fail('Enter your organisation or business name.')

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login?error=Your session has expired. Please sign in again.')

  const { data: profile } = await supabase.rpc('get_my_profile').maybeSingle()
  if (!profile) redirect('/onboarding')
  if (profile.role !== 'employer') fail('Only hirer accounts can edit an employer profile.')

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name: fullName, location, bio: bio || null, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (profileError) fail(profileError.message)

  const { error: employerError } = await supabase
    .from('employer_profiles')
    .upsert({ user_id: userId, organisation_name: organisationName, organisation_type: organisationType || null, website: website || null, updated_at: new Date().toISOString() })
  if (employerError) fail(employerError.message)

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  revalidatePath('/jobs')
  redirect('/profile?saved=1')
}
