import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

// Create i18n middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});

export async function middleware(request: NextRequest) {
  // Step 1: Handle internationalization
  const intlResponse = intlMiddleware(request);

  // Step 2: Handle authentication with Supabase
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get the pathname without locale prefix for auth checks
  const pathnameWithoutLocale = request.nextUrl.pathname.replace(/^\/(nl|de|fr|es|ja)/, '');

  // Protect /dashboard/* routes
  if (pathnameWithoutLocale.startsWith('/dashboard') && !user) {
    const loginUrl = new URL('/login', request.url);
    // Preserve locale in redirect
    const locale = request.nextUrl.pathname.match(/^\/(nl|de|fr|es|ja)/)?.[1];
    if (locale) {
      loginUrl.pathname = `/${locale}/login`;
    }
    return NextResponse.redirect(loginUrl);
  }

  // Merge cookies from both responses
  intlResponse.cookies.getAll().forEach((cookie) => {
    supabaseResponse.cookies.set(cookie.name, cookie.value);
  });

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - API routes
     * - Static files
     */
    '/((?!_next/static|_next/image|api|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
