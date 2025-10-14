-- Add is_admin column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Set xiaojunyang0805@gmail.com as admin
UPDATE profiles
SET is_admin = TRUE
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'xiaojunyang0805@gmail.com'
);

-- Verify the change
SELECT
  u.email,
  p.is_admin,
  p.credits
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'xiaojunyang0805@gmail.com';
