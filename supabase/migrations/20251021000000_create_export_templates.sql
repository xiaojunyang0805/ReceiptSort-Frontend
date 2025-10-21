-- Create export templates feature
-- Date: October 21, 2025
-- Purpose: Allow users to create custom export templates for VAT declarations, accounting, etc.

-- User template quota tracking
CREATE TABLE IF NOT EXISTS user_template_quota (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  max_templates INTEGER NOT NULL DEFAULT 10,
  templates_created INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_quota CHECK (templates_created >= 0 AND templates_created <= max_templates)
);

-- Export templates table
CREATE TABLE IF NOT EXISTS export_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_name VARCHAR(255) NOT NULL,
  description TEXT,

  -- File storage
  file_path VARCHAR(500) NOT NULL,
  file_url VARCHAR(500),
  file_size INTEGER, -- in bytes

  -- Template configuration
  sheet_name VARCHAR(255) NOT NULL DEFAULT 'Sheet1',
  start_row INTEGER NOT NULL DEFAULT 2,
  field_mapping JSONB NOT NULL DEFAULT '{}',

  -- Usage tracking
  export_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Credits
  credits_spent INTEGER NOT NULL DEFAULT 20,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_template_name UNIQUE (user_id, template_name),
  CONSTRAINT valid_start_row CHECK (start_row > 0),
  CONSTRAINT valid_file_size CHECK (file_size > 0 AND file_size <= 5242880), -- 5MB max
  CONSTRAINT valid_credits CHECK (credits_spent > 0)
);

-- Template transactions (credit charging history)
CREATE TABLE IF NOT EXISTS template_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES export_templates(id) ON DELETE SET NULL,
  transaction_type VARCHAR(50) NOT NULL, -- 'create', 'edit', 'delete'
  credits_charged INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_transaction_type CHECK (transaction_type IN ('create', 'edit', 'delete')),
  CONSTRAINT valid_credits_charged CHECK (credits_charged >= 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_export_templates_user_id ON export_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_export_templates_created_at ON export_templates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_templates_is_active ON export_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_template_transactions_user_id ON template_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_template_transactions_template_id ON template_transactions(template_id);

-- RLS Policies

-- User template quota
ALTER TABLE user_template_quota ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quota"
  ON user_template_quota FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quota"
  ON user_template_quota FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quota"
  ON user_template_quota FOR UPDATE
  USING (auth.uid() = user_id);

-- Export templates
ALTER TABLE export_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own templates"
  ON export_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
  ON export_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON export_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON export_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Template transactions
ALTER TABLE template_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON template_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON template_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Functions

-- Function to increment template count
CREATE OR REPLACE FUNCTION increment_template_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure user has quota record
  INSERT INTO user_template_quota (user_id, templates_created)
  VALUES (NEW.user_id, 1)
  ON CONFLICT (user_id) DO UPDATE
  SET templates_created = user_template_quota.templates_created + 1,
      updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement template count
CREATE OR REPLACE FUNCTION decrement_template_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_template_quota
  SET templates_created = GREATEST(0, templates_created - 1),
      updated_at = NOW()
  WHERE user_id = OLD.user_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update template updated_at timestamp
CREATE OR REPLACE FUNCTION update_template_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers

-- Auto-increment template count on insert
CREATE TRIGGER on_template_created
  AFTER INSERT ON export_templates
  FOR EACH ROW
  EXECUTE FUNCTION increment_template_count();

-- Auto-decrement template count on delete
CREATE TRIGGER on_template_deleted
  AFTER DELETE ON export_templates
  FOR EACH ROW
  EXECUTE FUNCTION decrement_template_count();

-- Auto-update timestamp
CREATE TRIGGER on_template_updated
  BEFORE UPDATE ON export_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_template_timestamp();

-- Comments for documentation
COMMENT ON TABLE user_template_quota IS 'Tracks template creation quota for each user (max 10 templates)';
COMMENT ON TABLE export_templates IS 'Stores user-uploaded Excel templates for custom exports';
COMMENT ON TABLE template_transactions IS 'Audit log of template-related credit charges';
COMMENT ON COLUMN export_templates.field_mapping IS 'JSON mapping of receipt fields to template columns, e.g., {"merchant_name": "B", "total_amount": "G"}';
COMMENT ON COLUMN export_templates.sheet_name IS 'Name of the worksheet to populate in the template';
COMMENT ON COLUMN export_templates.start_row IS 'Row number where data population begins';
