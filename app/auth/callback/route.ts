import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'

  const supabase = await createClient()

  // Handle OAuth callback (Google, GitHub)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    return NextResponse.redirect(`${origin}/?error=auth_failed`)
  }

  // Handle email verification (signup confirmation)
  if (token_hash && type === 'signup') {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'signup',
    })
    if (!error) {
      return NextResponse.redirect(`${origin}/`)
    }
    return NextResponse.redirect(`${origin}/?error=verification_failed`)
  }

  // Handle password recovery
  if (token_hash && type === 'recovery') {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'recovery',
    })
    if (!error) {
      return NextResponse.redirect(`${origin}/auth/reset-password`)
    }
    return NextResponse.redirect(`${origin}/?error=recovery_failed`)
  }

  // Handle email change verification
  if (token_hash && type === 'email_change') {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'email_change',
    })
    if (!error) {
      return NextResponse.redirect(`${origin}/`)
    }
    return NextResponse.redirect(`${origin}/?error=email_change_failed`)
  }

  // Return to home page if no valid parameters
  return NextResponse.redirect(`${origin}/?error=auth_failed`)
}
