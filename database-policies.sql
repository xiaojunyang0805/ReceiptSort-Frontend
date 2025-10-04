-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES TABLE POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can create their own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- RECEIPTS TABLE POLICIES
-- ============================================

-- Users can view their own receipts
CREATE POLICY "Users can view their own receipts"
ON receipts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own receipts
CREATE POLICY "Users can create their own receipts"
ON receipts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own receipts
CREATE POLICY "Users can update their own receipts"
ON receipts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own receipts
CREATE POLICY "Users can delete their own receipts"
ON receipts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- CREDIT_TRANSACTIONS TABLE POLICIES
-- ============================================

-- Users can view their own credit transactions
CREATE POLICY "Users can view their own credit transactions"
ON credit_transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own credit transactions
CREATE POLICY "Users can create their own credit transactions"
ON credit_transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Service role can insert credit transactions (for system operations)
CREATE POLICY "Service role can manage credit transactions"
ON credit_transactions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- EXPORTS TABLE POLICIES
-- ============================================

-- Users can view their own exports
CREATE POLICY "Users can view their own exports"
ON exports
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own exports
CREATE POLICY "Users can create their own exports"
ON exports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own exports
CREATE POLICY "Users can update their own exports"
ON exports
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own exports
CREATE POLICY "Users can delete their own exports"
ON exports
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- TRIGGER: Auto-create profile for new users
-- ============================================

-- Function to create profile on user signup
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
  );
  RETURN new;
END;
$$;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
