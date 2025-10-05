-- Step 1: Create profile for existing Google OAuth user
INSERT INTO profiles (id, email, credits, created_at, updated_at)
VALUES ('90123fcc-52ef-4895-aa1b-959318f5358a', 'xiaojunyang0805@gmail.com', 10, now(), now())
ON CONFLICT (id) DO UPDATE
SET
  credits = 10,
  updated_at = now();

-- Step 2: Verify the enhanced trigger is in place
-- (This is a repeat of fix-trigger-oauth.sql to ensure it's properly set up)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  -- Get email from user metadata (works for both email and OAuth)
  user_email := COALESCE(
    new.email,
    new.raw_user_meta_data->>'email',
    new.raw_user_meta_data->>'email_verified'
  );

  -- Insert profile with error handling
  INSERT INTO public.profiles (id, email, credits, created_at, updated_at)
  VALUES (
    new.id,
    user_email,
    10, -- Default starting credits
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    updated_at = now();

  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the auth signup
    RAISE WARNING 'Error creating profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$;

-- Step 3: Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Verify the fix
SELECT
  id,
  email,
  credits,
  created_at
FROM profiles
WHERE id = '90123fcc-52ef-4895-aa1b-959318f5358a';
