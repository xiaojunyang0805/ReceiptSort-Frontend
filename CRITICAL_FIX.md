# CRITICAL: Fix Supabase Site URL

## The Problem
Supabase is redirecting OAuth to `localhost:3000` because the **Site URL** in Supabase is set to localhost.

## The Fix

### Step 1: Update Supabase Site URL
1. Go to: https://supabase.com/dashboard/project/xalcrmpqhtakgkqiyere/auth/url-configuration
2. Find **Site URL** field
3. Change it from `http://localhost:3000` to: `https://receiptsort.vercel.app`
4. Click **Save**

### Step 2: Update Redirect URLs (in same page)
While you're there, also verify:
- **Redirect URLs**: Should include `https://receiptsort.vercel.app/**` (with the wildcard)

### Step 3: Test Again
1. Go to: https://receiptsort.vercel.app/signup
2. Click "Continue with Google"
3. Sign in with Google
4. Should now redirect to Vercel, not localhost

---

## Why This Happened
Supabase's "Site URL" is the default redirect URL for OAuth flows. When you set up Supabase, it defaults to `http://localhost:3000`. This needs to be changed to your production URL.

---

## Alternative: Add Both URLs
If you want to test both locally and on Vercel:
1. **Site URL**: `https://receiptsort.vercel.app`
2. **Redirect URLs**: Add both:
   - `https://receiptsort.vercel.app/**`
   - `http://localhost:3000/**`

This way both will work.
