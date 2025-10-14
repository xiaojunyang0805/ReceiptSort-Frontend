# Google OAuth Redirect Issue Fix

**Problem:** After Google OAuth login/signup, user is redirected to landing page (`/`) instead of dashboard (`/dashboard`)

**Started After:**
1. Domain change to receiptsort.seenano.nl
2. Dashboard logo changed to link to `/` instead of `/dashboard`

---

## Diagnosis

The issue is likely one of these:

### Option 1: Session Not Persisting After OAuth Callback

After Google OAuth:
1. ✅ User authenticates with Google
2. ✅ Redirects to `/auth/callback?code=...`
3. ✅ Callback exchanges code for session
4. ✅ Redirects to `/dashboard`
5. ❌ Session cookie not properly set
6. ❌ Middleware sees no user, redirects to `/`

### Option 2: Redirect URL Mismatch

The `redirectTo` in AuthForm might not match what's configured in Supabase.

---

## Solution Steps

### Step 1: Verify Supabase Redirect URLs

Go to: https://supabase.com/dashboard/project/xalcrmpqhtakgkqiyere/auth/url-configuration

**Check Redirect URLs include:**
```
https://receiptsort.seenano.nl/auth/callback
https://receiptsort.seenano.nl/**
```

**Site URL should be:**
```
https://receiptsort.seenano.nl
```

### Step 2: Check Environment Variables

The `NEXT_PUBLIC_URL` should be set correctly:

```bash
vercel env pull .env.production
cat .env.production | grep NEXT_PUBLIC_URL
```

Should show: `https://receiptsort.seenano.nl`

### Step 3: Add Logging to Callback Route

Temporarily add logging to see what's happening:

File: `src/app/[locale]/(auth)/auth/callback/route.ts`

```typescript
export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> }
) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin
  const { locale } = await params

  console.log('=== OAuth Callback ===')
  console.log('Code:', code ? 'present' : 'missing')
  console.log('Origin:', origin)
  console.log('Locale:', locale)

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    console.log('Session exchange result:', {
      hasSession: !!data?.session,
      hasUser: !!data?.user,
      error
    })
  }

  const redirectLocale = locale === defaultLocale ? '' : `/${locale}`
  const redirectUrl = `${origin}${redirectLocale}/dashboard`
  console.log('Redirecting to:', redirectUrl)

  return NextResponse.redirect(redirectUrl)
}
```

### Step 4: Test and Check Logs

1. Clear browser cookies/cache
2. Go to `/login`
3. Click "Continue with Google"
4. After OAuth, check Vercel logs:
   ```bash
   vercel logs --prod
   ```

Look for the console.log output to see what's happening.

---

## Quick Fix (Try This First)

The issue might be that after the callback redirects to `/dashboard`, the middleware doesn't see the session cookie yet.

### Add a Small Delay

In `src/app/[locale]/(auth)/auth/callback/route.ts`:

```typescript
if (code) {
  const supabase = await createClient()
  const { data } = await supabase.auth.exchangeCodeForSession(code)

  // Wait for cookies to be set
  await new Promise(resolve => setTimeout(resolve, 500))
}
```

### OR: Force Refresh After Redirect

Modify the redirect to include a query parameter that triggers a refresh:

```typescript
const redirectLocale = locale === defaultLocale ? '' : `/${locale}`
return NextResponse.redirect(`${origin}${redirectLocale}/dashboard?from=oauth`)
```

Then in the dashboard page, check for this parameter and refresh if present.

---

## Alternative: Use Server-Side Redirect in Dashboard

Instead of relying on the callback to redirect, handle it in the dashboard page itself.

File: `src/app/[locale]/dashboard/page.tsx`

Add at the top:

```typescript
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Rest of component...
}
```

---

## Most Likely Fix

Based on the symptoms (worked before domain change), the issue is probably:

**Supabase redirect URLs don't include the new domain properly**

### Steps:

1. Go to Supabase dashboard → Auth → URL Configuration
2. **Remove** old URLs (receiptsort.vercel.app if present)
3. **Add** these URLs:
   ```
   https://receiptsort.seenano.nl/auth/callback
   https://receiptsort.seenano.nl/dashboard
   https://receiptsort.seenano.nl/**
   ```
4. Set **Site URL** to: `https://receiptsort.seenano.nl`
5. Click **Save**
6. Wait 2 minutes for changes to propagate
7. Test again

---

## Debug: What URL Does Google Redirect To?

To see exactly what's happening:

1. Open browser DevTools → Network tab
2. Click "Continue with Google"
3. After OAuth, look at the network requests
4. Find the redirect from `/auth/callback`
5. Check:
   - Does it redirect to `/dashboard`?
   - Does another request immediately redirect from `/dashboard` to `/`?
   - Are there any 401 or 403 errors?

This will tell us exactly where the redirect chain is breaking.

---

## Summary

Most likely causes (in order of likelihood):

1. **Supabase redirect URLs** - Not configured for new domain
2. **Session cookie domain mismatch** - Cookie set for wrong domain
3. **Middleware timing** - Session not available immediately after callback
4. **Environment variable** - NEXT_PUBLIC_URL not set correctly

**Next Step:** Check Supabase redirect URLs first, as this is the most common issue after a domain change.
