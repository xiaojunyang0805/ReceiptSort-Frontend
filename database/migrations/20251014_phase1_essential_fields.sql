-- Phase 1: Essential Fields Migration
-- Add 5 essential fields for medical receipts and business invoices
-- Date: 2025-10-14
-- Description: Extends receipt schema to support invoice numbers, document types,
--              subtotal, vendor address, and due dates

-- Step 1: Add new columns to receipts table (all nullable for backward compatibility)
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS document_type VARCHAR(50) DEFAULT 'receipt';
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS vendor_address TEXT;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS due_date DATE;

-- Step 2: Add index on document_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_receipts_document_type ON receipts(document_type);

-- Step 3: Add index on due_date for bill payment tracking queries
CREATE INDEX IF NOT EXISTS idx_receipts_due_date ON receipts(due_date);

-- Step 4: Backfill document_type for existing receipts (set to 'receipt')
UPDATE receipts
SET document_type = 'receipt'
WHERE document_type IS NULL;

-- Step 5: Add comment on new fields for documentation
COMMENT ON COLUMN receipts.invoice_number IS 'Invoice/receipt number from the document (critical for medical insurance reimbursement)';
COMMENT ON COLUMN receipts.document_type IS 'Type of document: receipt, invoice, medical_invoice, bill (auto-detected by AI)';
COMMENT ON COLUMN receipts.subtotal IS 'Amount before tax (required for accounting integration)';
COMMENT ON COLUMN receipts.vendor_address IS 'Full vendor address from the document';
COMMENT ON COLUMN receipts.due_date IS 'Payment due date (for invoices and bills)';
