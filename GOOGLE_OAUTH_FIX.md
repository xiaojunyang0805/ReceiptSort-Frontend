# Google OAuth Fix Guide

**Problem:** Cannot login or signup with Google on production (receiptsort.seenano.nl)

---

## Root Cause

When we updated the domain from `receiptsort.vercel.app` to `receiptsort.seenano.nl`, the Supabase redirect configuration needs to be verified to ensure Google OAuth redirects to the correct domain.

---

## Solution: Update Supabase Configuration

### Step 1: Check Supabase Site URL ⚠️ CRITICAL

1. Go to: https://supabase.com/dashboard/project/xalcrmpqhtakgkqiyere/auth/url-configuration

2. **Verify Site URL:**
   ```
   Current: https://receiptsort.seenano.nl
   ```

   If it's NOT set to this, change it immediately.

3. Click **Save**

---

### Step 2: Verify Redirect URLs

In the same page (URL Configuration), check **Redirect URLs**:

**Should include:**
```
https://receiptsort.seenano.nl/**
https://receiptsort.seenano.nl/auth/callback
https://receiptsort.seenano.nl/dashboard
```

**Optional (for backup/testing):**
```
https://receiptsort.vercel.app/**
http://localhost:3000/**
```

**Make sure to click "Add URL" for each one, then "Save"**

---

### Step 3: Verify Google OAuth Provider is Enabled

1. Go to: https://supabase.com/dashboard/project/xalcrmpqhtakgkqiyere/auth/providers

2. Find **Google** in the list

3. **Verify it's toggled ON** (should be green/enabled)

4. If it's OFF, toggle it ON and click Save

---

### Step 4: Check Google Cloud Console (If Issue Persists)

The Google OAuth redirect URI should point to Supabase (not your domain), but let's verify:

1. Go to: https://console.cloud.google.com/apis/credentials

2. Find your OAuth 2.0 Client ID

3. Click to edit it

4. **Authorized redirect URIs** should include:
   ```
   https://xalcrmpqhtakgkqiyere.supabase.co/auth/v1/callback
   ```

5. If it's missing or incorrect, add it and click **Save**

---

## Testing the Fix

### Test 1: Google Login from Landing Page

1. Go to: https://receiptsort.seenano.nl
2. Click "Get Started" or "Login"
3. Click "Sign in with Google"
4. Select your Google account
5. **Should redirect to:** https://receiptsort.seenano.nl/dashboard
6. **Should NOT redirect to:** localhost or receiptsort.vercel.app

### Test 2: Google Signup

1. Go to: https://receiptsort.seenano.nl/signup
2. Click "Sign up with Google"
3. Select your Google account
4. Should create account and redirect to dashboard

---

## Common Errors and Solutions

### Error: "Provider is not enabled"

**Cause:** Google OAuth provider is disabled in Supabase

**Solution:**
1. Go to Supabase → Authentication → Providers
2. Enable Google provider
3. Wait 2 minutes for changes to propagate
4. Try again

---

### Error: Redirects to localhost:3000

**Cause:** Supabase Site URL is set to localhost

**Solution:**
1. Go to Supabase → Authentication → URL Configuration
2. Change Site URL to: `https://receiptsort.seenano.nl`
3. Save and test again

---

### Error: Redirects to receiptsort.vercel.app

**Cause:** Supabase Site URL is set to old domain

**Solution:**
1. Go to Supabase → Authentication → URL Configuration
2. Change Site URL to: `https://receiptsort.seenano.nl`
3. Keep vercel.app in Redirect URLs as backup
4. Save and test again

---

### Error: "redirect_uri_mismatch" from Google

**Cause:** Google Cloud Console doesn't have Supabase callback URL

**Solution:**
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Edit your OAuth 2.0 Client ID
3. Add authorized redirect URI:
   ```
   https://xalcrmpqhtakgkqiyere.supabase.co/auth/v1/callback
   ```
4. Save and try again

---

### Error: "Database error for user"

**Cause:** Profile creation trigger is missing or broken

**Solution:** This is a different issue. See `fix-trigger-oauth.sql`

---

## Configuration Checklist

Use this to verify everything is configured correctly:

### Supabase Configuration
- [ ] Site URL = `https://receiptsort.seenano.nl`
- [ ] Redirect URLs include `https://receiptsort.seenano.nl/**`
- [ ] Redirect URLs include `https://receiptsort.seenano.nl/auth/callback`
- [ ] Redirect URLs include `https://receiptsort.seenano.nl/dashboard`
- [ ] Google provider is enabled (toggled ON)
- [ ] Google Client ID is configured
- [ ] Google Client Secret is configured

### Google Cloud Console
- [ ] OAuth 2.0 Client ID exists
- [ ] Authorized redirect URIs includes:
      `https://xalcrmpqhtakgkqiyere.supabase.co/auth/v1/callback`
- [ ] OAuth consent screen is configured
- [ ] OAuth consent screen status is "In production" or "Testing"

### Environment Variables (Vercel)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set

---

## Quick Fix Commands

If you need to quickly check environment variables:

```bash
cd D:/receiptsort
vercel env ls
```

Should show:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

---

## What We Already Configured

Earlier in deployment, we updated:

✅ Supabase Site URL → `https://receiptsort.seenano.nl`
✅ Supabase Redirect URLs → Added production URLs
✅ Environment variables → All configured

**What might be wrong:**
- Google provider might have been accidentally disabled
- Redirect URLs might need to be re-saved
- Browser cache might be causing issues

---

## Debugging Steps

If the issue persists after checking everything above:

### 1. Check Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Try Google login
4. Look for errors related to:
   - "Provider not enabled"
   - "redirect_uri_mismatch"
   - "Invalid client"
   - Network errors to Supabase

### 2. Check Supabase Logs

1. Go to: https://supabase.com/dashboard/project/xalcrmpqhtakgkqiyere/logs/explorer
2. Look for authentication errors
3. Check if Google OAuth requests are reaching Supabase

### 3. Test with Vercel Domain

Try logging in with the old domain to isolate the issue:
1. Go to: https://receiptsort.vercel.app/login
2. Try Google login
3. If it works there but not on seenano.nl:
   - Issue is with Redirect URLs configuration
   - Double-check Site URL matches new domain

---

## Most Likely Fix

Based on the symptoms (Google OAuth not working), the most likely issue is:

**Supabase Site URL is still set to the old domain or localhost**

**Quick Fix:**
1. Go to: https://supabase.com/dashboard/project/xalcrmpqhtakgkqiyere/auth/url-configuration
2. Set Site URL to: `https://receiptsort.seenano.nl`
3. Click Save
4. Wait 1-2 minutes
5. Clear browser cache (Ctrl+Shift+Delete)
6. Try Google login again

---

## Need More Help?

If none of the above works, please provide:

1. Exact error message you're seeing
2. Screenshot of the error
3. What URL you're trying to login from
4. What URL it redirects to (if any)
5. Browser console errors (F12 → Console)

This will help diagnose the exact issue.

---

**Last Updated:** 2025-10-13
**Status:** Awaiting user to check Supabase configuration
