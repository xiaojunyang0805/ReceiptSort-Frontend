-- =====================================================
-- FORCE Add is_admin Column (Robust Version)
-- =====================================================

-- First, check if column exists
DO $$
BEGIN
    -- Try to add the column
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE NOT NULL;
        RAISE NOTICE 'Column is_admin added successfully';
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'Column is_admin already exists';
    END;
END $$;

-- Create index
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);

-- Update the admin user
UPDATE public.profiles
SET is_admin = TRUE
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'xiaojunyang0805@gmail.com'
);

-- Show the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Show all profiles with admin status
SELECT
  u.email,
  p.credits,
  p.is_admin
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
ORDER BY u.email;
