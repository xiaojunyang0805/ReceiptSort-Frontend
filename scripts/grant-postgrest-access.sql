-- =====================================================
-- Grant PostgREST Access to is_admin Column
-- =====================================================

-- Ensure the anon and authenticated roles can read the column
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;

-- Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- Wait a moment, then test the API directly
SELECT
  u.id,
  u.email,
  p.is_admin,
  p.credits
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'xiaojunyang0805@gmail.com';
