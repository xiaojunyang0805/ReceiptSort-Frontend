# Debug Google OAuth Issue

## Current Problem
Google OAuth redirects to `localhost:3000` instead of Vercel URL.

## Steps to Debug:

### 1. Check if you set NEXT_PUBLIC_URL in Vercel
- Go to: https://vercel.com/xiaojunyang0805/receiptsort/settings/environment-variables
- Verify `NEXT_PUBLIC_URL = https://receiptsort.vercel.app` exists
- If not, add it and redeploy

### 2. Check Vercel Deployment Logs
- Go to: https://vercel.com/xiaojunyang0805/receiptsort/deployments
- Click on latest deployment
- Check "Build Logs" for any env var errors
- Check "Runtime Logs" when you test OAuth

### 3. Test on Vercel (NOT localhost)
**IMPORTANT**: You must test at https://receiptsort.vercel.app/signup
- Testing on localhost will always use localhost URL
- Vercel deployment uses NEXT_PUBLIC_URL from Vercel settings

### 4. Verify Google OAuth Configuration
Go to Google Cloud Console and verify:
- **Authorized JavaScript origins** includes:
  - `https://receiptsort.vercel.app`
  - `https://xalcrmpqhtakgkqiyere.supabase.co`

- **Authorized redirect URIs** includes:
  - `https://xalcrmpqhtakgkqiyere.supabase.co/auth/v1/callback`

### 5. Check Supabase Settings
Go to: https://supabase.com/dashboard/project/xalcrmpqhtakgkqiyere/auth/providers

Verify Google provider has:
- Client ID: (your Google OAuth client ID)
- Client Secret: (your Google OAuth client secret)
- Enabled: Toggle ON

---

## What Should Happen:

1. User clicks "Continue with Google" on https://receiptsort.vercel.app/signup
2. Browser redirects to Google sign-in
3. User signs in with Google
4. Google redirects to: `https://xalcrmpqhtakgkqiyere.supabase.co/auth/v1/callback?code=...`
5. Supabase processes OAuth and redirects to: `https://receiptsort.vercel.app/auth/callback?code=...`
6. Your app exchanges code for session and redirects to `/dashboard`

---

## Current Code Logic:

```javascript
// In AuthForm.tsx
const redirectUrl = process.env.NEXT_PUBLIC_URL || window.location.origin
```

- On Vercel: uses `NEXT_PUBLIC_URL` from environment variables
- On localhost: falls back to `window.location.origin` (localhost:3000)

---

## Action Items:

1. ✅ Make sure you're testing on **Vercel**, not localhost
2. ✅ Add `NEXT_PUBLIC_URL=https://receiptsort.vercel.app` in Vercel environment variables
3. ✅ Redeploy after adding the env var
4. ✅ Verify Google OAuth redirect URIs in Google Cloud Console
5. ✅ Test again on https://receiptsort.vercel.app/signup

---

## If Still Not Working:

Run the improved trigger to handle OAuth users better:
```sql
-- In Supabase SQL Editor, run: fix-trigger-improved.sql
```

This version won't fail the signup even if profile creation has issues.
