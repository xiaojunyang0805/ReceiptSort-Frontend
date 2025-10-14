-- =====================================================
-- Fix RLS Policy to Allow Reading is_admin Column
-- =====================================================
-- This script fixes the Row Level Security policy so users
-- can read their own is_admin status

-- Drop and recreate the SELECT policy to ensure it includes all columns
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create updated policy that explicitly allows all columns including is_admin
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Verify the policy works by selecting your profile
SELECT
  id,
  full_name,
  credits,
  is_admin,
  created_at
FROM public.profiles
WHERE id = auth.uid();
