-- Migration: Ensure all receipt columns exist
-- Created: 2025-10-05
-- Description: Add any missing columns to receipts table

-- File storage columns
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- Processing status
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending';

-- Extracted data columns
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS merchant_name TEXT;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10,2);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS currency TEXT;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS receipt_date DATE;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10,2);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(3,2);

-- Processing fields (from previous migration)
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS raw_ocr_text TEXT;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS processing_error TEXT;

-- Timestamps
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add comments
COMMENT ON COLUMN receipts.file_path IS 'Storage path in Supabase Storage bucket';
COMMENT ON COLUMN receipts.file_url IS 'Public URL for the receipt file';
COMMENT ON COLUMN receipts.processing_status IS 'Status: pending, processing, completed, failed';
COMMENT ON COLUMN receipts.confidence_score IS 'AI confidence score (0.0 to 1.0)';
