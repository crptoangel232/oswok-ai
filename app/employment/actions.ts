'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function transitionEmployment(formData: FormData) {
  const employmentId = String(formData.get('employmentId') ?? '')
  const status = String(formData.get('status') ?? '')
  if (!employmentId || !['completed', 'cancelled'].includes(status)) {
    redirect('/employment?error=Invalid employment action.')
  }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims?.sub) redirect('/login')

  const { error } = await (supabase.rpc as unknown as (name: string, args: Record<string, string>) => Promise<{ data: boolean | null; error: { message: string } | null }>)('transition_my_employment', {
    target_employment_id: employmentId,
    new_status: status,
  })

  if (error) redirect(`/employment/${employmentId}?error=${encodeURIComponent(error.message)}`)

  revalidatePath('/employment')
  revalidatePath(`/employment/${employmentId}`)
  revalidatePath('/dashboard')
  redirect(`/employment/${employmentId}?updated=1`)
}
