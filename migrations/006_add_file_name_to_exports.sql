-- Migration: Add missing file_name column to exports table
-- Created: 2025-10-06
-- Description: The exports table was created with a different structure than migration 003
-- This adds the missing file_name column that the API expects

-- Add file_name column if it doesn't exist
ALTER TABLE exports
ADD COLUMN IF NOT EXISTS file_name TEXT;

-- Make receipt_ids optional (it's currently required but API doesn't use it)
ALTER TABLE exports
ALTER COLUMN receipt_ids DROP NOT NULL;

-- Make file_size optional (API doesn't use it)
ALTER TABLE exports
ALTER COLUMN file_size DROP NOT NULL;

-- Verify the columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'exports'
ORDER BY ordinal_position;
