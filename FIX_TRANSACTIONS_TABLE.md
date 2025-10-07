# Fix Credit Transactions Table

## Problem
The `credit_transactions` table exists in the database but doesn't have the correct schema.
The migration file `migrations/004_create_credit_transactions_table.sql` was never applied.

## Solution
Apply the migration manually via Supabase SQL Editor.

### Steps:

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard/project/xalcrmpqhtakgkqiyere

2. Navigate to **SQL Editor** (in the left sidebar)

3. Click **New Query**

4. Copy and paste the entire contents of `migrations/004_create_credit_transactions_table.sql`:

```sql
-- Drop existing table if it has wrong schema
DROP TABLE IF EXISTS credit_transactions CASCADE;

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
```

5. Click **RUN** (or press Ctrl+Enter)

6. After migration is applied, add the missing transaction record for the €9.99 purchase:

```sql
INSERT INTO credit_transactions (user_id, amount, type, description, stripe_session_id, stripe_payment_intent)
VALUES (
  '90123fcc-52ef-4895-aa1b-959318f5358a',
  25,
  'purchase',
  'Purchased basic package',
  'cs_live_a1SkwoIH5QWSqVja2C75EhFmnKVKu4R30b09kpBUI8XLwYXMOzN91oIelh',
  'pi_3SFKSI2Q25JDcEYX0Lojllob'
);
```

7. Verify the transaction was added:

```sql
SELECT * FROM credit_transactions WHERE user_id = '90123fcc-52ef-4895-aa1b-959318f5358a';
```

## After Fixing

After completing these steps:
- Refresh the Credits page in the app
- The Transaction History section should now show the €9.99 purchase
- Future webhook events will correctly create transaction records
