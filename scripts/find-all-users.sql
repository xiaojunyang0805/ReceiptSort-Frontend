-- Find ALL users and their profiles
SELECT
  u.id as user_id,
  u.email,
  u.created_at as user_created,
  p.id as profile_id,
  p.is_admin,
  p.credits,
  p.created_at as profile_created
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY u.email;
