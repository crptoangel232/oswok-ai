'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (!email || !email.includes('@')) redirect('/forgot-password?error=Enter a valid email address.')

  const requestHeaders = await headers()
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '')
  const forwardedProto = requestHeaders.get('x-forwarded-proto') ?? 'http'
  const host = requestHeaders.get('host') ?? 'localhost:3000'
  const appUrl = configuredUrl || `${forwardedProto}://${host}`

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/confirm?next=/reset-password`,
  })

  if (error) redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`)
  redirect('/forgot-password?sent=1')
}
