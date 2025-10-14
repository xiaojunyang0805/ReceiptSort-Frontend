-- =====================================================
-- Add is_admin Column to Existing Profiles Table
-- =====================================================

-- Add the is_admin column if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE NOT NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);

-- Set your email as admin
UPDATE public.profiles
SET is_admin = TRUE, updated_at = NOW()
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'xiaojunyang0805@gmail.com'
);

-- Verify the change
SELECT
  u.email,
  p.full_name,
  p.credits,
  p.is_admin,
  p.created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'xiaojunyang0805@gmail.com';
