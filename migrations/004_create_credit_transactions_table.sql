-- Create credit_transactions table for tracking credit purchases and usage
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'refund', 'bonus')),
  description TEXT NOT NULL,
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id
  ON credit_transactions(user_id);

-- Create index for Stripe session lookups
CREATE INDEX IF NOT EXISTS idx_credit_transactions_stripe_session
  ON credit_transactions(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

-- Enable RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own transactions
CREATE POLICY "Users can view own credit transactions"
  ON credit_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Only service role can insert transactions
-- (Webhooks and server actions use service role)
CREATE POLICY "Service role can insert credit transactions"
  ON credit_transactions
  FOR INSERT
  WITH CHECK (true);

-- Add helpful comment
COMMENT ON TABLE credit_transactions IS 'Tracks all credit purchases, usage, and refunds for audit trail';
COMMENT ON COLUMN credit_transactions.type IS 'Transaction type: purchase (buying credits), usage (spending credits), refund (credit refund), bonus (promotional credits)';
COMMENT ON COLUMN credit_transactions.stripe_session_id IS 'Stripe Checkout Session ID for purchase transactions';
COMMENT ON COLUMN credit_transactions.stripe_payment_intent IS 'Stripe Payment Intent ID for purchase transactions';
