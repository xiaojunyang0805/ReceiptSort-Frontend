-- Add file storage columns to exports table
-- This enables storing export files in Supabase Storage with 30-day retention

-- Add columns for file storage
ALTER TABLE exports
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Add index for cleanup queries (finding old files to delete)
CREATE INDEX IF NOT EXISTS idx_exports_created_at ON exports(created_at DESC);

-- Add comment
COMMENT ON COLUMN exports.file_path IS 'Path to the export file in Supabase Storage (e.g., user_id/exports/filename.xlsx)';
COMMENT ON COLUMN exports.file_url IS 'Public URL to download the export file from Supabase Storage';
