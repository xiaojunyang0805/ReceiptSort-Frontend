-- Migration: Add processing fields to receipts table
-- Created: 2025-10-05
-- Description: Add raw_ocr_text and processing_error fields for AI processing

-- Add raw_ocr_text field to store full OCR output from OpenAI
ALTER TABLE receipts
ADD COLUMN IF NOT EXISTS raw_ocr_text TEXT;

-- Add processing_error field to store error messages if processing fails
ALTER TABLE receipts
ADD COLUMN IF NOT EXISTS processing_error TEXT;

-- Add comment for documentation
COMMENT ON COLUMN receipts.raw_ocr_text IS 'Full OCR text extracted from receipt by OpenAI Vision API';
COMMENT ON COLUMN receipts.processing_error IS 'Error message if receipt processing failed';
