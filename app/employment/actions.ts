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

export async function transitionEmployment(formData: FormData) {
  const employmentId = String(formData.get('employmentId') ?? '')
  const status = String(formData.get('status') ?? '')
  if (!employmentId || !['completed', 'cancelled'].includes(status)) redirect('/employment?error=Invalid employment action.')
  const supabase = await requireUser()
  const { error } = await (supabase.rpc as unknown as (name: string, args: Record<string, string>) => Promise<{ data: boolean | null; error: { message: string } | null }>)('transition_my_employment', { target_employment_id: employmentId, new_status: status })
  if (error) redirect(`/employment/${employmentId}?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/employment'); revalidatePath(`/employment/${employmentId}`); revalidatePath('/dashboard')
  redirect(`/employment/${employmentId}?updated=1`)
}

export async function confirmPayment(formData: FormData) {
  const employmentId = String(formData.get('employmentId') ?? '')
  if (!employmentId) redirect('/employment?error=Employment not found.')
  const supabase = await requireUser()
  const { error } = await (supabase.rpc as unknown as (name: string, args: Record<string, string>) => Promise<{ data: string | null; error: { message: string } | null }>)('confirm_employment_payment', { target_employment_id: employmentId })
  if (error) redirect(`/employment/${employmentId}?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/employment'); revalidatePath(`/employment/${employmentId}`); revalidatePath('/dashboard')
  redirect(`/employment/${employmentId}?paid=1`)
}

export async function submitReview(formData: FormData) {
  const employmentId = String(formData.get('employmentId') ?? '')
  const rating = Number(formData.get('rating') ?? 0)
  const comment = String(formData.get('comment') ?? '').trim()
  if (!employmentId || !Number.isInteger(rating) || rating < 1 || rating > 5) redirect(`/employment/${employmentId}?error=Choose a rating from 1 to 5.`)
  const supabase = await requireUser()
  const { error } = await (supabase.rpc as unknown as (name: string, args: Record<string, string | number>) => Promise<{ data: string | null; error: { message: string } | null }>)('review_my_employment', { target_employment_id: employmentId, new_rating: rating, new_comment: comment || null })
  if (error) redirect(`/employment/${employmentId}?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/employment'); revalidatePath(`/employment/${employmentId}`); revalidatePath('/dashboard'); revalidatePath('/profile')
  redirect(`/employment/${employmentId}?reviewed=1`)
}
