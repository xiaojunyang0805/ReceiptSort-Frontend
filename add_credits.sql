-- Find user by email and add 500 credits
UPDATE user_credits 
SET credits = credits + 500 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = '42535832@qq.com'
);

-- Show the result
SELECT 
  u.email, 
  uc.credits 
FROM user_credits uc
JOIN auth.users u ON u.id = uc.user_id
WHERE u.email = '42535832@qq.com';
