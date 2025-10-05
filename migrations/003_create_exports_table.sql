-- Migration: Create exports tracking table
-- Created: 2025-10-05
-- Description: Track user exports for analytics and audit

-- Create exports table
CREATE TABLE IF NOT EXISTS exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL CHECK (export_type IN ('csv', 'excel')),
  receipt_count INTEGER NOT NULL DEFAULT 0,
  file_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_exports_user_id ON exports(user_id);
CREATE INDEX IF NOT EXISTS idx_exports_created_at ON exports(created_at DESC);

-- Enable RLS
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own exports"
  ON exports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own exports"
  ON exports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE exports IS 'Tracks user export history for analytics';
COMMENT ON COLUMN exports.export_type IS 'Type of export: csv or excel';
COMMENT ON COLUMN exports.receipt_count IS 'Number of receipts included in export';
