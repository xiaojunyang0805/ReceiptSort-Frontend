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
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Preserve locale in redirect, or use default if not English
  const redirectLocale = locale === defaultLocale ? '' : `/${locale}`
  return NextResponse.redirect(`${origin}${redirectLocale}/dashboard`)
}
