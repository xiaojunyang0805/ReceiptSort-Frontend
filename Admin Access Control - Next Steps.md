# 🔐 Admin Access Control - Next Steps

## ✅ What's Been Completed

The admin panel now has full security implementation:

1. ✅ **Admin utility functions** created (`src/lib/admin.ts`)
2. ✅ **API route protection** - Both admin endpoints verify admin status
3. ✅ **Client-side protection** - Admin page redirects non-admins
4. ✅ **Conditional UI** - Admin link only visible to admins
5. ✅ **JWT verification** - All requests require valid auth token
6. ✅ **Code deployed** to GitHub and Vercel

## ⚠️ Database Setup Required

The code is ready, but you need to add the `is_admin` column to your database:

### Step 1: Create Profiles Table in Supabase

The `profiles` table doesn't exist yet. You need to create it first.

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your **ReceiptSort project**
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. **Copy the ENTIRE contents** of `scripts/create-profiles-table.sql` and paste it

**OR paste this SQL directly:**

```sql
-- Create profiles table with admin support
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  credits INTEGER DEFAULT 10 NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can do anything" ON public.profiles;

-- RLS Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can do anything"
  ON public.profiles FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, credits, is_admin)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 10, FALSE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create profiles for existing users
INSERT INTO public.profiles (id, full_name, credits, is_admin)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'full_name', ''), 10, FALSE
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- Set admin user
UPDATE public.profiles
SET is_admin = TRUE, updated_at = NOW()
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'xiaojunyang0805@gmail.com'
);

-- Verify setup
SELECT u.email, p.credits, p.is_admin
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
ORDER BY p.created_at DESC;
```

6. Click **Run** (or press F5)
7. Check the results at the bottom - you should see all users with their profiles
8. Find **xiaojunyang0805@gmail.com** - it should show `is_admin: true`

### Step 2: Test Admin Access

1. **Clear your browser cache** (important!)
2. Visit: https://receiptsort.seenano.nl
3. **Login** as xiaojunyang0805@gmail.com
4. You should now see **"Admin"** link in the sidebar
5. Click **Admin** to access the admin panel

### Step 3: Test Non-Admin Access

1. Login as a different user (e.g., 42535832@qq.com)
2. Admin link should **NOT** be visible in sidebar
3. If you manually visit `/admin`, you should be redirected to `/dashboard`

## 🔒 Security Features

### What Happens Now:

**For Admin Users (xiaojunyang0805@gmail.com):**
- ✅ See "Admin" link in sidebar
- ✅ Can access /admin page
- ✅ Can search for users
- ✅ Can adjust user credits

**For Non-Admin Users:**
- ❌ No "Admin" link in sidebar
- ❌ Accessing /admin redirects to dashboard
- ❌ API calls return 403 Forbidden
- ✅ Toast notification: "Access denied: Admin privileges required"

### Protection Layers:

1. **Client-side**: Admin page checks `is_admin` flag and redirects
2. **API-level**: All admin routes verify JWT token + `is_admin` flag
3. **UI-level**: Admin link hidden for non-admins
4. **Database-level**: RLS policies (if configured)

## 📝 Adding More Admins Later

To add another admin user:

```sql
UPDATE profiles
SET is_admin = TRUE
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'newadmin@example.com'
);
```

## 🐛 Troubleshooting

### "Admin access required" error
- **Solution**: Run the SQL update command above
- Make sure the email matches exactly

### Admin link not showing
- **Solution**: Clear browser cache and reload
- Check browser console for errors

### Still can't access admin panel
1. Verify column was added:
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'profiles' AND column_name = 'is_admin';
   ```

2. Verify your admin status:
   ```sql
   SELECT u.email, p.is_admin
   FROM profiles p
   JOIN auth.users u ON u.id = p.id
   WHERE u.email = 'xiaojunyang0805@gmail.com';
   ```

## 📚 Documentation

See `ADMIN_SETUP.md` for complete documentation including:
- Security architecture
- API protection details
- Best practices
- Troubleshooting guide

## ✨ What This Solves

**Before:**
- ❌ Anyone could access /admin URL
- ❌ Anyone could call admin API endpoints
- ❌ Major security vulnerability

**After:**
- ✅ Only authorized admins can access admin panel
- ✅ All admin API calls are authenticated and authorized
- ✅ Non-admins are blocked at multiple levels
- ✅ Secure, production-ready admin system

---

**Ready to test?** Run the SQL above in Supabase SQL Editor, then login and check for the Admin link!
