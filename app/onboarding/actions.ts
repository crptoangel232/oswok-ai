'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type Role = 'worker' | 'employer'

function fail(message: string): never {
  redirect(`/onboarding?error=${encodeURIComponent(message)}`)
}

export async function completeOnboarding(formData: FormData) {
  const role = String(formData.get('role') ?? '') as Role
  const fullName = String(formData.get('fullName') ?? '').trim()
  const location = String(formData.get('location') ?? '').trim()
  const phone = String(formData.get('phone') ?? '').trim()
  const organisationName = String(formData.get('organisationName') ?? '').trim()
  const organisationType = String(formData.get('organisationType') ?? '').trim()

  if (!['worker', 'employer'].includes(role)) fail('Choose a valid account type.')
  if (fullName.length < 2) fail('Enter your full name.')
  if (location.length < 2) fail('Enter your location.')
  if (role === 'employer' && organisationName.length < 2) fail('Enter your organisation or business name.')

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims?.sub) redirect('/login?error=Your session has expired. Please sign in again.')

  const { error } = await (supabase.rpc as unknown as (
    functionName: string,
    args: Record<string, string | null>
  ) => Promise<{ error: { message: string } | null }>)('complete_my_onboarding', {
    new_role: role,
    new_full_name: fullName,
    new_location: location,
    new_phone: phone || null,
    new_organisation_name: role === 'employer' ? organisationName : null,
    new_organisation_type: role === 'employer' ? organisationType || null : null,
  })

  if (error) fail(error.message)

  redirect('/dashboard')
}
