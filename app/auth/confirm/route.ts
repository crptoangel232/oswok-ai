import type { EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const allowedNextPaths = new Set(['/onboarding', '/dashboard'])

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash')
  const type = request.nextUrl.searchParams.get('type') as EmailOtpType | null
  const requestedNext = request.nextUrl.searchParams.get('next') ?? '/onboarding'
  const next = allowedNextPaths.has(requestedNext) ? requestedNext : '/onboarding'

  if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) return NextResponse.redirect(new URL(next, request.url))
  }

  return NextResponse.redirect(new URL('/login?error=The confirmation link is invalid or has expired.', request.url))
}
