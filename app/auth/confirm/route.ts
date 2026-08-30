import type { EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const allowedNextPaths = new Set(['/onboarding', '/dashboard', '/reset-password'])

function getSafeDestination(request: NextRequest) {
  const requestedNext = request.nextUrl.searchParams.get('next') ?? '/onboarding'
  const next = allowedNextPaths.has(requestedNext) ? requestedNext : '/onboarding'
  const role = request.nextUrl.searchParams.get('role')
  const destination = new URL(next, request.url)
  if (next === '/onboarding' && (role === 'worker' || role === 'employer')) destination.searchParams.set('role', role)
  return destination
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const tokenHash = request.nextUrl.searchParams.get('token_hash')
  const type = request.nextUrl.searchParams.get('type') as EmailOtpType | null
  const destination = getSafeDestination(request)

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(destination)
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) return NextResponse.redirect(destination)
  }

  return NextResponse.redirect(new URL('/login?error=The confirmation or reset link is invalid or has expired.', request.url))
}
