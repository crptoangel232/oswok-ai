'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function requireUser() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims?.sub) redirect('/login')
  return supabase
}

export async function requestPayout(formData: FormData) {
  const amount = Number(formData.get('amount') ?? 0)
  const provider = String(formData.get('provider') ?? '')
  const phone = String(formData.get('phone') ?? '').trim()

  if (!Number.isFinite(amount) || amount <= 0) redirect('/wallet?error=Enter a valid payout amount.')
  if (!['orange_money', 'africell_money', 'qcell_money', 'manual'].includes(provider)) redirect('/wallet?error=Choose a payout method.')
  if (phone.length < 8) redirect('/wallet?error=Enter a valid payout phone number.')

  const supabase = await requireUser()
  const { error } = await supabase.rpc('request_payout', {
    payout_amount: amount,
    payout_provider: provider,
    payout_phone: phone,
  })

  if (error) redirect(`/wallet?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/wallet')
  redirect('/wallet?payout=1')
}
