-- Fix: Allow templates to be saved with 0 credits (FREE save policy)
-- Date: October 22, 2025
-- Issue: The valid_credits CHECK constraint required credits_spent > 0,
--        but our policy is that saving templates is FREE (0 credits)

-- Drop old constraint
ALTER TABLE export_templates
DROP CONSTRAINT IF EXISTS valid_credits;

-- Add new constraint allowing 0 or positive credits
ALTER TABLE export_templates
ADD CONSTRAINT valid_credits CHECK (credits_spent >= 0);

-- Comment
COMMENT ON CONSTRAINT valid_credits ON export_templates IS 'Allows 0 credits for free template saves, positive for paid operations';
