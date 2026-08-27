'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function errorRedirect(message: string): never {
  redirect(`/login?error=${encodeURIComponent(message)}`)
}

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!email || !email.includes('@') || password.length < 8) {
    errorRedirect('Enter a valid email and a password of at least 8 characters.')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) errorRedirect('Unable to sign in. Check your email and password.')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const fullName = String(formData.get('fullName') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (fullName.length < 2) errorRedirect('Enter your full name.')
  if (!email || !email.includes('@')) errorRedirect('Enter a valid email address.')
  if (password.length < 8) errorRedirect('Password must be at least 8 characters.')

  const requestHeaders = await headers()
  const forwardedProto = requestHeaders.get('x-forwarded-proto') ?? 'http'
  const host = requestHeaders.get('host') ?? 'localhost:3000'
  const origin = `${forwardedProto}://${host}`

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/auth/confirm?next=/onboarding`,
    },
  })

  if (error) errorRedirect(error.message)

  if (data.session) redirect('/onboarding')
  redirect('/check-email')
}
