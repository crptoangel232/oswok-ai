'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type Role = 'worker' | 'employer'

export async function completeOnboarding(formData: FormData) {
  const role = String(formData.get('role') ?? '') as Role
  const fullName = String(formData.get('fullName') ?? '').trim()
  const location = String(formData.get('location') ?? '').trim()
  const phone = String(formData.get('phone') ?? '').trim()

  if (!['worker', 'employer'].includes(role)) redirect('/onboarding?error=Choose a valid account type.')
  if (fullName.length < 2) redirect('/onboarding?error=Enter your full name.')
  if (location.length < 2) redirect('/onboarding?error=Enter your location.')

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub

  if (!userId) redirect('/login?error=Your session has expired. Please sign in again.')

  const { error: roleError } = await (supabase.rpc as unknown as (
    functionName: string,
    args: { new_role: Role }
  ) => Promise<{ error: { message: string } | null }>)('set_my_role', { new_role: role })

  if (roleError) redirect(`/onboarding?error=${encodeURIComponent(roleError.message)}`)

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name: fullName, location, phone, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (profileError) redirect(`/onboarding?error=${encodeURIComponent(profileError.message)}`)

  if (role === 'worker') {
    const { error } = await supabase.from('worker_profiles').upsert({ user_id: userId })
    if (error) redirect(`/onboarding?error=${encodeURIComponent(error.message)}`)
  } else {
    const organisationName = String(formData.get('organisationName') ?? '').trim()
    if (organisationName.length < 2) redirect('/onboarding?error=Enter your organisation or business name.')

    const { error } = await supabase.from('employer_profiles').upsert({
      user_id: userId,
      organisation_name: organisationName,
      organisation_type: String(formData.get('organisationType') ?? '').trim() || null,
    })
    if (error) redirect(`/onboarding?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/dashboard')
}
