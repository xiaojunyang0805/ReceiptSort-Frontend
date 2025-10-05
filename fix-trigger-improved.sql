-- Improved function to create profile on user signup
-- Handles potential conflicts and errors more gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, credits_remaining, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    10, -- Default starting credits
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate profile errors

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
