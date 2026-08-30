'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type Role = 'worker' | 'employer'

function errorRedirect(message: string): never {
  redirect(`/login?error=${encodeURIComponent(message)}`)
}

function getAppUrl(requestHeaders: Headers) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '')
  if (configuredUrl) return configuredUrl

  const forwardedProto = requestHeaders.get('x-forwarded-proto') ?? 'http'
  const host = requestHeaders.get('host') ?? 'localhost:3000'
  return `${forwardedProto}://${host}`
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
  const role = String(formData.get('role') ?? '') as Role

  if (!['worker', 'employer'].includes(role)) errorRedirect('Choose whether you want to find work or hire people.')
  if (fullName.length < 2) errorRedirect('Enter your full name.')
  if (!email || !email.includes('@')) errorRedirect('Enter a valid email address.')
  if (password.length < 8) errorRedirect('Password must be at least 8 characters.')

  const requestHeaders = await headers()
  const appUrl = getAppUrl(requestHeaders)
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, preferred_role: role },
      emailRedirectTo: `${appUrl}/auth/confirm?next=/onboarding&role=${role}`,
    },
  })

  if (error) errorRedirect(error.message)

  if (data.session) redirect(`/onboarding?role=${role}`)
  redirect('/check-email')
}
