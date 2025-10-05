# Supabase Configuration Steps

## Issue: "Database error for user" when signing up

### Fix: Re-run the database trigger SQL

1. Go to: https://supabase.com/dashboard/project/xalcrmpqhtakgkqiyere/sql
2. Click "New Query"
3. Copy and paste this SQL:

```sql
-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, credits_remaining, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    10, -- Default starting credits
    now(),
    now()
  );
  RETURN new;
END;
$$;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

4. Click "Run" (or press Ctrl+Enter)
5. You should see "Success. No rows returned"

---

## Enable Google OAuth

### Step 1: Get Google OAuth Credentials

1. Go to: https://console.cloud.google.com/
2. Create/select a project
3. Go to: **APIs & Services** → **Credentials**
4. Click **"Create Credentials"** → **"OAuth client ID"**
5. Application type: **Web application**
6. Add Authorized redirect URI:
   ```
   https://xalcrmpqhtakgkqiyere.supabase.co/auth/v1/callback
   ```
7. Copy the **Client ID** and **Client Secret**

### Step 2: Configure in Supabase

1. Go to: https://supabase.com/dashboard/project/xalcrmpqhtakgkqiyere/auth/providers
2. Find **Google** in the providers list
3. Toggle **Enable Sign in with Google** to ON
4. Paste your **Client ID** (from Google Cloud Console)
5. Paste your **Client Secret** (from Google Cloud Console)
6. Click **Save**

---

## Test Authentication

After completing the steps above:

1. **Test Email Signup**: https://receiptsort.vercel.app/signup
   - Should create user + profile automatically
   - Should redirect to dashboard

2. **Test Google OAuth**: https://receiptsort.vercel.app/signup
   - Click "Continue with Google"
   - Should redirect to Google sign-in
   - Should create user + profile automatically
   - Should redirect to dashboard

---

## Troubleshooting

If you still see errors:
- Wait 1-2 minutes after making changes
- Clear browser cache
- Try incognito/private window
- Check Supabase logs: https://supabase.com/dashboard/project/xalcrmpqhtakgkqiyere/logs/explorer
