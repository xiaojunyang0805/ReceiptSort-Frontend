-- Enhanced function to handle both email and OAuth signups
-- Works with email/password and OAuth providers (Google, etc.)
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
  INSERT INTO public.profiles (id, email, credits_remaining, created_at, updated_at)
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

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
