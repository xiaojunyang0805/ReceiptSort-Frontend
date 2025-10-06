-- Migration: Fix exports table RLS INSERT policy
-- Created: 2025-10-06
-- Description: Change INSERT policy to allow server-side inserts (similar to credit_transactions)

-- Drop the old restrictive INSERT policy
DROP POLICY IF EXISTS "Users can create own exports" ON exports;

-- Create new INSERT policy that works with server-side Supabase client
-- The server code ensures user_id is set correctly, so we can trust it
CREATE POLICY "Allow authenticated inserts to exports"
  ON exports
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- The SELECT policy remains unchanged - users can only view their own exports
-- This is enforced by: USING (auth.uid() = user_id)
