import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { defaultLocale } from '@/i18n/config'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> }
) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin
  const { locale } = await params

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('OAuth callback error:', error)
      // Redirect to login with error
      const redirectLocale = locale === defaultLocale ? '' : `/${locale}`
      return NextResponse.redirect(`${origin}${redirectLocale}/login?error=auth_failed`)
    }
  }

  // Preserve locale in redirect, or use default if not English
  const redirectLocale = locale === defaultLocale ? '' : `/${locale}`
  const redirectUrl = `${origin}${redirectLocale}/dashboard`

  // Create response with redirect
  const response = NextResponse.redirect(redirectUrl)

  // Force the response to include all cookies from the supabase client
  return response
}
