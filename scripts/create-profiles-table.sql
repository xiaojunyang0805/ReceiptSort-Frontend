-- =====================================================
-- Create Profiles Table with Admin Support
-- =====================================================
-- This script creates the profiles table if it doesn't exist
-- and adds the is_admin column for admin access control

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  credits INTEGER DEFAULT 10 NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can do anything" ON public.profiles;

-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Service role can do anything (for admin operations)
CREATE POLICY "Service role can do anything"
  ON public.profiles
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Function to create profile automatically when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, credits, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    10,
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create profiles for existing users (if any don't have profiles)
INSERT INTO public.profiles (id, full_name, credits, is_admin)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  10,
  FALSE
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- Set xiaojunyang0805@gmail.com as admin
UPDATE public.profiles
SET is_admin = TRUE, updated_at = NOW()
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'xiaojunyang0805@gmail.com'
);

-- Verify the setup
SELECT
  u.email,
  p.credits,
  p.is_admin,
  p.created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email IN ('xiaojunyang0805@gmail.com', '42535832@qq.com')
ORDER BY u.email;

-- Show all profiles (for verification)
SELECT
  u.email,
  p.full_name,
  p.credits,
  p.is_admin
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
ORDER BY p.created_at DESC
LIMIT 10;
